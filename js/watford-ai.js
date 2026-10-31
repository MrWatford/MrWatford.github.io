/* =========================================================
   Watford AI — the study helper chat (shared code).
   Used two ways, same assistant and same conversation:
   1. The "Ask Watford AI" button on regular pages (opens a panel).
   2. The full AI Study Helper page (ai-helper.html).
   Loaded by site.js, so every page that uses site.js gets the button.
   Game pages don't load site.js, so the button never covers game controls.

   Privacy: the conversation lives only in this browser tab
   (sessionStorage) and is gone when the tab closes. No names, no accounts.
   No secret keys are in this file — the AI key stays on the server.
   ========================================================= */
(function () {
  "use strict";

  // Where the Watford AI server lives. After deploying (see ai-backend/README.md),
  // paste its address here, e.g. "https://watford-ai.YOUR-NAME.workers.dev".
  var API_BASE = "https://watford-ai.watford-ai.workers.dev";
  var LOCAL_API = "http://localhost:8787";   // used automatically for local testing

  var script = document.currentScript;
  var SITE_ROOT = script ? script.src.replace(/js\/watford-ai\.js.*$/, "") : "/";
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API = (window.WATFORD_AI_API || (isLocal ? LOCAL_API : API_BASE) || "").replace(/\/$/, "");
  var STORE_KEY = "watford-ai-v1";
  var IDLE_RESET_MS = 60 * 60 * 1000;   // shared Chromebooks: a chat left alone for an hour starts fresh
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  if (document.body && document.body.dataset.watfordAi === "off") return;

  /* ---------- styles ---------- */
  if (!document.querySelector("link[data-watford-ai]")) {
    var css = document.createElement("link");
    css.rel = "stylesheet"; css.href = SITE_ROOT + "css/watford-ai.css"; css.dataset.watfordAi = "";
    document.head.appendChild(css);
  }

  /* ---------- the current page (sent as an ID; the server checks it) ---------- */
  function currentPageId() {
    var root = SITE_ROOT.replace(/^https?:\/\/[^/]+/, "");
    var path = location.pathname;
    if (path.indexOf(root) === 0) path = path.slice(root.length);
    path = path.replace(/^\/+/, "");
    if (!path || /\/$/.test(path)) path += "index.html";
    return path.replace(/\.html$/, "");
  }

  /* ---------- saved state (this tab only) ---------- */
  function freshState(old) {
    return {
      token: old && old.token || null, tokenExp: old && old.tokenExp || 0,
      messages: [], subject: old && old.subject || null, grade: old && old.grade || null,
      context: undefined, touched: Date.now()
    };
  }
  function load() {
    try {
      var s = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
      if (!s || typeof s !== "object" || !Array.isArray(s.messages)) return freshState();
      if (Date.now() - (s.touched || 0) > IDLE_RESET_MS) return freshState();
      return s;
    } catch (e) { return freshState(); }
  }
  var state = load();
  function save() {
    state.touched = Date.now();
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode: chat still works */ }
  }

  /* ---------- server calls ---------- */
  var config = null, catalog = null, serverState = "loading";   // loading | ok | disabled | budget | not_configured | offline
  function api(path, opts) {
    opts = opts || {};
    if (!API) return Promise.reject({ code: "offline", message: "Watford AI isn't connected yet." });
    var headers = {};
    if (opts.body) headers["Content-Type"] = "application/json";
    if (opts.auth && state.token) headers.Authorization = "Bearer " + state.token;
    return fetch(API + path, {
      method: opts.method || (opts.body ? "POST" : "GET"),
      headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal, credentials: "omit", cache: "no-store"
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw { code: data.error || "http_" + r.status, message: data.message || "Something went wrong.", status: r.status, retryAfter: data.retryAfter };
        return data;
      });
    }, function (err) {
      if (err && err.name === "AbortError") throw { code: "cancelled", message: "Cancelled." };
      throw { code: "offline", message: "Can't reach Watford AI. Check your internet connection." };
    });
  }
  var configPromise = null;
  function loadConfig() {
    if (configPromise) return configPromise;
    configPromise = Promise.all([api("/api/config"), api("/api/catalog").catch(function () { return { pages: [] }; })])
      .then(function (r) { config = r[0]; catalog = r[1].pages || []; serverState = config.status; })
      .catch(function () { serverState = "offline"; configPromise = null; });
    return configPromise;
  }
  function ensureSession(classCode) {
    if (state.token && state.tokenExp > Date.now() + 60000) return Promise.resolve();
    return api("/api/session", { body: classCode ? { classCode: classCode } : {} }).then(function (r) {
      state.token = r.token; state.tokenExp = r.expiresAt; save();
    });
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    return Array.prototype.map.call(b, function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }

  /* ---------- safe Markdown + math rendering ----------
     All text is escaped first, so nothing from the AI can become HTML or a script.
     Only [[n]] source tags become links, and only to addresses the server verified. */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safeUrl(u) {
    try {
      var url = new URL(u, location.href);
      return url.protocol === "https:" || (url.protocol === "http:" && isLocal) ? url.href : null;
    } catch (e) { return null; }
  }
  function mathFallback(tex) {
    return tex
      .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
      .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
      .replace(/\\times/g, "×").replace(/\\div/g, "÷").replace(/\\cdot/g, "·").replace(/\\pm/g, "±")
      .replace(/\\le(q)?/g, "≤").replace(/\\ge(q)?/g, "≥").replace(/\\neq/g, "≠").replace(/\\pi/g, "π")
      .replace(/\\left|\\right|\\,|\\;|\\!/g, "").replace(/\\text\{([^{}]*)\}/g, "$1")
      .replace(/\^\{([^{}]*)\}/g, "^($1)").replace(/[{}]/g, "").replace(/\\/g, "");
  }
  function inline(s, sources) {
    var maths = [];
    s = s.replace(/\$\$([^$]{1,400})\$\$|\$([^$\n]{1,200})\$/g, function (m, a, b) {
      maths.push({ tex: a || b, display: !!a }); return "\u0000" + (maths.length - 1) + "\u0000";
    });
    s = esc(s)
      .replace(/`([^`]{1,200})`/g, "<code>$1</code>")
      .replace(/\*\*([^*]{1,300})\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]{1,200})\*/g, "$1<em>$2</em>")
      .replace(/\[\[(\d{1,2})\]\]/g, function (m, n) {
        var src = sources && sources[Number(n) - 1];
        var href = src && safeUrl(src.url);
        return href ? '<a class="wa-cite" href="' + esc(href) + '" title="' + esc(src.title + (src.heading ? " › " + src.heading : "")) + '">[' + n + "]</a>" : "";
      });
    return s.replace(/\u0000(\d+)\u0000/g, function (m, i) {
      var x = maths[Number(i)];
      return '<span class="wa-math' + (x.display ? " wa-math-display" : "") + '" data-tex="' + esc(x.tex) + '" role="math" aria-label="' + esc(mathFallback(x.tex)) + '">' + esc(mathFallback(x.tex)) + "</span>";
    });
  }
  function renderMarkdown(text, sources) {
    var out = [], lines = String(text).split("\n"), i = 0;
    while (i < lines.length) {
      var line = lines[i];
      var fence = /^```\s*([a-z]*)\s*$/.exec(line);
      if (fence) {
        var body = []; i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
        i++;
        out.push('<pre class="wa-pre' + (fence[1] === "passage" ? " wa-passage" : "") + '" tabindex="0"' + (fence[1] === "passage" ? ' aria-label="Typing practice passage"' : "") + ">" + esc(body.join("\n")) + "</pre>");
        continue;
      }
      if (/^\s*$/.test(line)) { i++; continue; }
      var h = /^#{1,4}\s+(.*)$/.exec(line);
      if (h) { out.push("<p class=\"wa-h\"><strong>" + inline(h[1], sources) + "</strong></p>"); i++; continue; }
      if (/^\s*(\d+[.)]|[-*•])\s+/.test(line)) {
        var ordered = /^\s*\d+[.)]/.test(line), items = [];
        while (i < lines.length && /^\s*(\d+[.)]|[-*•])\s+/.test(lines[i])) {
          items.push("<li>" + inline(lines[i].replace(/^\s*(\d+[.)]|[-*•])\s+/, ""), sources) + "</li>"); i++;
        }
        out.push((ordered ? "<ol>" : "<ul>") + items.join("") + (ordered ? "</ol>" : "</ul>"));
        continue;
      }
      var para = [];
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^```/.test(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !/^\s*(\d+[.)]|[-*•])\s+/.test(lines[i])) para.push(lines[i++]);
      out.push("<p>" + para.map(function (p) { return inline(p, sources); }).join("<br>") + "</p>");
    }
    return out.join("");
  }

  // KaTeX draws fractions and exponents nicely (and adds MathML for screen readers).
  // It loads only when a reply has math. Without it, readable text is shown instead.
  var katexPromise = null;
  function loadKatex() {
    if (katexPromise) return katexPromise;
    katexPromise = new Promise(function (resolve) {
      var l = document.createElement("link");
      l.rel = "stylesheet"; l.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      l.integrity = "sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+"; l.crossOrigin = "anonymous";
      document.head.appendChild(l);
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
      s.integrity = "sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg"; s.crossOrigin = "anonymous";
      s.onload = function () { resolve(window.katex || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return katexPromise;
  }
  function typeset(el) {
    var spots = el.querySelectorAll(".wa-math[data-tex]");
    if (!spots.length) return;
    loadKatex().then(function (katex) {
      if (!katex) return;
      spots.forEach(function (spot) {
        try {
          katex.render(spot.dataset.tex, spot, { throwOnError: false, output: "htmlAndMathml", trust: false, strict: "ignore", maxSize: 10, maxExpand: 200, displayMode: spot.classList.contains("wa-math-display") });
          spot.removeAttribute("role"); spot.removeAttribute("aria-label");   // KaTeX adds MathML for screen readers
          spot.removeAttribute("data-tex");
        } catch (e) { /* keep the readable text */ }
      });
    });
  }

  /* ---------- the chat view ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") e.textContent = v;
      else if (k === "class") e.className = v;
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }

  var views = [];
  function ChatView(root, mode) {
    this.root = root; this.mode = mode; this.pending = null;
    this.build();
    views.push(this);
  }
  ChatView.prototype.build = function () {
    var self = this, id = "wa-" + this.mode;
    this.root.textContent = "";
    this.root.classList.add("wa-chat", "wa-mode-" + this.mode);

    this.title = h("h2", { class: "wa-title", id: id + "-title" }, [
      h("span", { class: "wa-badge", "aria-hidden": "true", text: "AI" }), " ",
      h("span", { class: "wa-name", text: "Watford AI" })
    ]);
    this.subtitle = h("p", { class: "wa-sub", text: "Your AI Study Helper" });
    var tools = h("div", { class: "wa-tools" }, [
      h("button", { type: "button", class: "wa-tool", text: "New chat", onclick: function () { self.newChat(); } }),
      h("button", { type: "button", class: "wa-tool", text: "Clear", onclick: function () { self.clearAll(); } }),
      this.mode === "panel" ? h("a", { class: "wa-tool", href: SITE_ROOT + "ai-helper.html", text: "Full page" }) : null,
      this.mode === "panel" ? h("button", { type: "button", class: "wa-close", "aria-label": "Close Watford AI", text: "×", onclick: function () { closePanel(); } }) : null
    ]);
    var head = h("div", { class: "wa-head" }, [h("div", {}, [this.title, this.subtitle]), tools]);

    // subject, grade, and page context (students can change or remove it)
    this.subjectSel = h("select", { id: id + "-subject", onchange: function () { state.subject = this.value; save(); self.renderStarters(); } });
    this.gradeSel = h("select", { id: id + "-grade", onchange: function () { state.grade = this.value; save(); } });
    [["unsure", "I'm not sure"], ["6", "6th grade"], ["7", "7th grade"], ["8", "8th grade"]].forEach(function (g) { self.gradeSel.appendChild(h("option", { value: g[0], text: g[1] })); });
    this.contextLabel = h("span", { class: "wa-context-label" });
    this.contextSel = h("select", { class: "wa-context-select", "aria-label": "Choose a page for Watford AI to help with", hidden: true, onchange: function () { self.setContext(this.value || null); this.hidden = true; self.contextChange.hidden = false; } });
    this.contextChange = h("button", { type: "button", class: "wa-link", text: "Change", onclick: function () { self.openContextPicker(); } });
    this.contextRemove = h("button", { type: "button", class: "wa-link", text: "Remove", onclick: function () { self.setContext(null); } });
    var settingsRow = h("div", { class: "wa-settings" }, [
      h("label", { for: id + "-subject" }, ["Subject ", this.subjectSel]),
      h("label", { for: id + "-grade" }, ["Grade ", this.gradeSel])
    ]);
    this.contextRow = h("div", { class: "wa-context" }, [h("span", { "aria-hidden": "true", text: "📄 " }), this.contextLabel, this.contextSel, this.contextChange, this.contextRemove]);

    this.banner = h("div", { class: "wa-banner", role: "status", hidden: true });
    this.log = h("div", { class: "wa-log", role: "log", "aria-live": "polite", "aria-relevant": "additions", tabindex: "0", "aria-label": "Conversation" });
    this.status = h("p", { class: "wa-sr", "aria-live": "assertive" });

    this.input = h("textarea", { id: id + "-input", rows: "2", maxlength: "2000", placeholder: "Type your question…", "aria-describedby": id + "-hint" });
    this.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !coarse && !e.isComposing) { e.preventDefault(); self.send(); }
    });
    this.input.addEventListener("input", function () { self.autosize(); });
    this.sendBtn = h("button", { type: "submit", class: "wa-send", text: "Send" });
    this.cancelBtn = h("button", { type: "button", class: "wa-cancel", text: "Cancel", hidden: true, onclick: function () { self.cancel(); } });
    var form = h("form", { class: "wa-form", onsubmit: function (e) { e.preventDefault(); self.send(); } }, [
      h("label", { class: "wa-sr", for: id + "-input", text: "Message Watford AI" }),
      this.input, h("div", { class: "wa-form-buttons" }, [this.cancelBtn, this.sendBtn])
    ]);
    this.notice = h("p", { class: "wa-notice", id: id + "-hint" });
    this.searchBox = this.buildSearch();

    this.root.appendChild(head);
    this.root.appendChild(settingsRow);
    this.root.appendChild(this.contextRow);
    this.root.appendChild(this.banner);
    this.root.appendChild(this.log);
    this.root.appendChild(this.searchBox);
    this.root.appendChild(form);
    this.root.appendChild(this.notice);
    this.root.appendChild(this.status);
    this.refresh();
  };

  ChatView.prototype.buildSearch = function () {
    var self = this;
    var input = h("input", { type: "search", placeholder: "Search Mr. Watford's website", "aria-label": "Search Mr. Watford's website" });
    var results = h("ul", { class: "wa-search-results" });
    var form = h("form", { class: "wa-search", role: "search", onsubmit: function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q) return;
      results.textContent = ""; results.appendChild(h("li", { text: "Searching…" }));
      api("/api/search", { body: { q: q, subject: state.subject || undefined } }).then(function (r) {
        results.textContent = "";
        if (!r.results.length) results.appendChild(h("li", { text: "No pages matched. Try other words, or ask Mr. Watford." }));
        r.results.forEach(function (x) { var href = safeUrl(x.url); if (href) results.appendChild(h("li", {}, [navCard(href, x.title, x.heading, x.excerpt)])); });
      }).catch(function () { results.textContent = ""; offlineLinks(results); });
    } }, [input, h("button", { type: "submit", class: "wa-tool", text: "Search" })]);
    return h("div", { class: "wa-search-wrap", hidden: true }, [h("p", { class: "wa-search-title", text: "Find something on the website" }), form, results]);
  };

  ChatView.prototype.refresh = function () {
    var self = this;
    var c = config || {};
    this.root.querySelector(".wa-name").textContent = c.name || "Watford AI";
    this.subtitle.textContent = c.subtitle || "Your AI Study Helper";
    this.notice.textContent = c.notice || "AI can make mistakes. Check important answers with your teacher. Don't share personal information.";
    // On a new page, start from that page's context (the student can still change it).
    var here = currentPageId();
    if (this.mode === "panel" && catalog && state.seenPage !== here) {
      state.seenPage = here; state.context = undefined;
      var gs = this.guessSubject(), gg = this.guessGrade();
      if (gs) state.subject = gs;
      if (gg) state.grade = gg;
    }
    // subjects
    this.subjectSel.textContent = "";
    var subjects = (c.subjects && c.subjects.length) ? c.subjects : [{ id: state.subject || "general", label: state.subject ? "…" : "I'm not sure / Other" }];
    subjects.forEach(function (s) { self.subjectSel.appendChild(h("option", { value: s.id, text: s.label })); });
    if (config) {   // only choose a subject once the real list has loaded
      if (!state.subject || !subjects.some(function (s) { return s.id === state.subject; })) state.subject = this.guessSubject() || "general";
      if (!subjects.some(function (s) { return s.id === state.subject; })) state.subject = subjects[0].id;
    }
    this.subjectSel.value = state.subject || subjects[0].id;
    if (!state.grade && config) state.grade = this.guessGrade() || "unsure";
    this.gradeSel.value = state.grade;
    // page context
    if (state.context === undefined && catalog) state.context = here !== "ai-helper" && this.pageInCatalog(here) ? here : null;
    this.renderContext();
    // availability banner
    var down = serverState !== "ok" && serverState !== "loading";
    this.banner.hidden = !down;
    this.banner.textContent = "";
    if (down) {
      this.banner.appendChild(h("strong", { text: {
        disabled: "Watford AI is turned off right now.",
        budget: "Watford AI has reached its usage limit for now.",
        not_configured: "Watford AI isn't set up yet.",
        offline: "Can't reach Watford AI right now."
      }[serverState] || "Watford AI isn't available right now." }));
      this.banner.appendChild(document.createTextNode(" You can still search the website below."));
    }
    this.searchBox.hidden = !down;
    this.input.disabled = down;
    this.sendBtn.disabled = down || !!this.pending;
    if (down) offlineLinksOnce(this.searchBox.querySelector(".wa-search-results"));
    this.renderLog();
    save();
  };
  ChatView.prototype.pageInCatalog = function (id) {
    return (catalog || []).filter(function (p) { return p.id === id; })[0] || null;
  };
  ChatView.prototype.guessSubject = function () {
    var p = this.pageInCatalog(currentPageId());
    return p && p.subject !== "general" ? p.subject : null;
  };
  ChatView.prototype.guessGrade = function () {
    var p = this.pageInCatalog(currentPageId());
    return p && p.grades && p.grades.length === 1 ? String(p.grades[0]) : null;
  };
  ChatView.prototype.renderContext = function () {
    var p = state.context ? this.pageInCatalog(state.context) : null;
    this.contextLabel.textContent = p ? "Helping with: " + p.title : "No page selected";
    this.contextRemove.hidden = !p;
    this.contextChange.textContent = p ? "Change" : "Choose a page";
    this.contextRow.hidden = !catalog || !catalog.length;
  };
  ChatView.prototype.openContextPicker = function () {
    var sel = this.contextSel;
    sel.textContent = "";
    sel.appendChild(h("option", { value: "", text: "No page" }));
    (catalog || []).forEach(function (p) { sel.appendChild(h("option", { value: p.id, text: p.title })); });
    sel.value = state.context || "";
    sel.hidden = false; this.contextChange.hidden = true;
    sel.focus();
  };
  ChatView.prototype.setContext = function (id) {
    state.context = id;
    var p = id && this.pageInCatalog(id);
    if (p && p.subject && p.subject !== "general" && this.subjectSel.querySelector('option[value="' + p.subject + '"]')) { state.subject = p.subject; this.subjectSel.value = p.subject; }
    save();
    this.renderContext();
    this.contextSel.hidden = true; this.contextChange.hidden = false;
    this.say(p ? "Page set to " + p.title : "Page removed");
  };
  ChatView.prototype.say = function (text) { var s = this.status; s.textContent = ""; setTimeout(function () { s.textContent = text; }, 30); };

  ChatView.prototype.renderStarters = function () {
    var old = this.log.querySelector(".wa-starters");
    if (old) old.remove();
    if (state.messages.length) return;
    var self = this, c = config || {};
    var subj = (c.subjects || []).filter(function (s) { return s.id === state.subject; })[0];
    var list = (c.starters || []).slice();
    if (subj && subj.prompts) subj.prompts.forEach(function (p) { if (list.indexOf(p) < 0) list.unshift(p); });
    list = list.slice(0, 7);
    if (!list.length || serverState !== "ok") return;
    var wrap = h("div", { class: "wa-starters", role: "group", "aria-label": "Suggested questions" });
    list.forEach(function (q) { wrap.appendChild(h("button", { type: "button", class: "wa-chip", text: q, onclick: function () { self.input.value = q; self.send(); } })); });
    this.log.appendChild(wrap);
  };

  ChatView.prototype.renderLog = function () {
    var self = this;
    this.log.textContent = "";
    var c = config || {};
    this.log.appendChild(h("div", { class: "wa-msg wa-assistant wa-welcome" }, [
      h("p", { class: "wa-who", text: (c.name || "Watford AI") + " (AI)" }),
      h("p", { text: c.welcome || "Hi! I'm Watford AI, your study helper. I can explain a problem, help you practice, or find something on Mr. Watford's website. What are you working on?" })
    ]));
    state.messages.forEach(function (m, i) { self.log.appendChild(self.renderMessage(m, i === state.messages.length - 1)); });
    this.renderStarters();
    if (this.pending) this.log.appendChild(this.pendingEl());
    // Show the start of the newest answer (not its end); show the welcome when the chat is empty.
    var msgs = this.log.querySelectorAll(".wa-msg"), lastMsg = msgs[msgs.length - 1];
    var answered = !this.pending && lastMsg && !lastMsg.classList.contains("wa-user");
    if (!state.messages.length) this.log.scrollTop = 0;
    else if (answered) this.log.scrollTop = lastMsg.offsetTop - 8;
    else this.log.scrollTop = this.log.scrollHeight;
    typeset(this.log);
  };

  ChatView.prototype.renderMessage = function (m, isLast) {
    var self = this;
    if (m.role === "user") {
      var u = h("div", { class: "wa-msg wa-user" + (m.failed ? " wa-failed" : "") }, [h("p", { class: "wa-who", text: "You" }), h("p", { class: "wa-text", text: m.content })]);
      if (m.failed && isLast) {
        u.appendChild(h("div", { class: "wa-error", role: "alert" }, [
          h("p", { text: m.error || "That didn't go through." }),
          m.retryable !== false ? h("button", { type: "button", class: "wa-tool", text: "Retry", onclick: function () { self.retry(); } }) : null
        ]));
      }
      return u;
    }
    if (m.kind === "safety") {
      var st = h("div", { class: "wa-text" });
      st.innerHTML = renderMarkdown(m.content, []);   // fixed server text, still escaped
      return h("div", { class: "wa-msg wa-safety" }, [h("p", { class: "wa-who", text: "Automatic safety message (not an AI answer)" }), st]);
    }
    var body = h("div", { class: "wa-text" });
    body.innerHTML = renderMarkdown(m.content, m.sources || []);   // escaped + whitelisted above
    var box = h("div", { class: "wa-msg wa-assistant" }, [h("p", { class: "wa-who", text: ((config && config.name) || "Watford AI") + " (AI)" }), body]);
    (m.passages || []).forEach(function (p) {
      box.appendChild(h("p", { class: "wa-meta" }, ["✔ Counted by the website: " + p.withSpaces + " characters with spaces, " + p.withoutSpaces + " without spaces, " + p.words + " words. Line breaks are not counted."]));
    });
    if (m.checks && m.checks.length) {
      var d = h("details", { class: "wa-checks" }, [h("summary", { text: "✔ Checked with the website's calculator (" + m.checks.length + ")" })]);
      var ul = h("ul");
      m.checks.forEach(function (c) { ul.appendChild(h("li", { text: c.text })); });
      d.appendChild(ul); box.appendChild(d);
    }
    if (m.sources && m.sources.length) {
      var srcWrap = h("div", { class: "wa-sources" }, [h("p", { class: "wa-sources-title", text: "From Mr. Watford's website" })]);
      m.sources.forEach(function (s) {
        var href = safeUrl(s.url);
        if (!href) return;
        srcWrap.appendChild(navCard(href, "[" + s.n + "] " + s.title, s.heading, s.checkedAt ? "Checked " + new Date(s.checkedAt).toLocaleDateString() : ""));
        (s.links || []).forEach(function (l) {
          var lh = safeUrl(l.url);
          if (lh) srcWrap.appendChild(navCard(lh, l.text, l.external ? "Opens another website in a new tab" : "", "", l.external));
        });
      });
      box.appendChild(srcWrap);
    }
    if (m.truncated) box.appendChild(h("p", { class: "wa-meta", text: "This answer was cut short. Ask “keep going” to see the rest." }));
    if (m.notice) box.appendChild(h("p", { class: "wa-meta wa-warn", text: m.notice }));
    if (isLast && m.followups && m.followups.length && serverState === "ok") {
      var f = h("div", { class: "wa-followups", role: "group", "aria-label": "Quick follow-ups" });
      m.followups.forEach(function (q) { f.appendChild(h("button", { type: "button", class: "wa-chip", text: q, onclick: function () { self.input.value = q; self.send(); } })); });
      box.appendChild(f);
    }
    return box;
  };
  function navCard(href, title, heading, note, external) {
    return h("a", { class: "wa-card", href: href, target: external ? "_blank" : null, rel: external ? "noopener noreferrer" : null }, [
      h("strong", { text: title }), heading ? h("span", { text: heading }) : null, note ? h("small", { text: note }) : null
    ]);
  }
  var OFFLINE_LINKS = [["Typing", "typing/index.html"], ["Science", "science/index.html"], ["6th Grade Science", "science/grade-6.html"], ["8th Grade Science", "science/grade-8.html"], ["Pre-Algebra", "math/index.html"], ["Science Project Center", "science/project-center.html"]];
  function offlineLinks(list) {
    list.appendChild(h("li", { class: "wa-offline-title", text: "Popular pages:" }));
    OFFLINE_LINKS.forEach(function (l) { list.appendChild(h("li", {}, [navCard(SITE_ROOT + l[1], l[0])])); });
  }
  function offlineLinksOnce(list) { if (list && !list.children.length) offlineLinks(list); }

  ChatView.prototype.pendingEl = function () {
    return h("div", { class: "wa-msg wa-assistant wa-thinking", "aria-hidden": "true" }, [
      h("p", { class: "wa-who", text: ((config && config.name) || "Watford AI") + " (AI)" }),
      h("p", {}, [h("span", { class: "wa-dots" }, [h("i"), h("i"), h("i")]), " Thinking…"])
    ]);
  };
  ChatView.prototype.autosize = function () {
    this.input.style.height = "auto";
    this.input.style.height = Math.min(this.input.scrollHeight, 160) + "px";
  };

  /* ---------- sending ---------- */
  function sendableHistory() {
    // Only finished question/answer pairs (failed and safety-stopped turns are left out).
    var out = [];
    for (var i = 0; i < state.messages.length; i++) {
      var m = state.messages[i], next = state.messages[i + 1];
      if (m.role === "user" && next && next.role === "assistant" && next.kind !== "safety") {
        out.push({ role: "user", content: m.content }, { role: "assistant", content: next.content.slice(0, 6000) });
        i++;
      }
    }
    return out.slice(-18);
  }
  ChatView.prototype.send = function (text) {
    if (this.pending) return;
    var msg = (text != null ? text : this.input.value).trim();
    if (!msg) return;
    if (msg.length > 2000) { this.say("Please keep messages under 2000 characters."); return; }
    // a failed message at the end is replaced by the new one
    var last = state.messages[state.messages.length - 1];
    if (last && last.role === "user") state.messages.pop();
    state.messages.push({ role: "user", content: msg });
    this.input.value = ""; this.autosize();
    this.go();
  };
  ChatView.prototype.retry = function () { this.go(); };
  ChatView.prototype.cancel = function () { if (this.pending) this.pending.abort(); };
  ChatView.prototype.go = function (classCode) {
    var self = this;
    var question = state.messages[state.messages.length - 1];
    if (!question || question.role !== "user") return;
    delete question.failed; delete question.error;
    var controller = new AbortController();
    this.pending = controller;
    syncAll();
    this.cancelBtn.hidden = false;
    this.say("Watford AI is thinking.");
    var payload = {
      requestId: uuid(),
      messages: sendableHistory().concat([{ role: "user", content: question.content }]),
      subject: state.subject, grade: state.grade === "unsure" ? "unsure" : Number(state.grade),
      pageId: state.context || null
    };
    ensureSession(classCode)
      .then(function () { return api("/api/chat", { body: payload, auth: true, signal: controller.signal }); })
      .then(function (r) {
        state.messages.push(r.type === "safety"
          ? { role: "assistant", kind: "safety", content: r.text }
          : { role: "assistant", content: r.text, sources: r.sources, checks: r.checks, passages: r.passages, followups: r.followups, truncated: r.truncated, notice: r.notice });
        self.done(); self.say(r.type === "safety" ? "Automatic safety message received." : "Watford AI answered.");
      })
      .catch(function (err) {
        if (err.code === "session_expired") { state.token = null; save(); }
        if (err.code === "class_code") { self.done(); self.askClassCode(err.message); return; }
        if (err.code === "cancelled") {
          if (state.messages[state.messages.length - 1] === question) {
            state.messages.pop();
            self.input.value = question.content;
          }
          self.done(); self.say("Cancelled."); self.input.focus();
          return;
        }
        if (["ai_disabled", "budget", "not_configured", "offline"].indexOf(err.code) >= 0) {
          serverState = err.code === "ai_disabled" ? "disabled" : err.code;
        }
        question.failed = true;
        question.retryable = ["session_limit", "daily_limit", "ai_disabled", "budget", "not_configured", "subject_disabled", "invalid"].indexOf(err.code) < 0;
        question.error = friendlyError(err);
        self.done(); self.say(question.error);
      });
  };
  ChatView.prototype.done = function () {
    this.pending = null;
    this.cancelBtn.hidden = true;
    save();
    syncAll();
  };
  ChatView.prototype.askClassCode = function (message) {
    var self = this;
    var input = h("input", { type: "text", autocomplete: "off", "aria-label": "Class code" });
    var box = h("form", { class: "wa-msg wa-safety wa-code", onsubmit: function (e) {
      e.preventDefault(); if (!input.value.trim()) return;
      box.remove(); self.go(input.value.trim());
    } }, [
      h("p", { class: "wa-who", text: "Class code needed" }),
      h("p", { text: message + " Mr. Watford gives the class code in class." }),
      h("div", { class: "wa-code-row" }, [input, h("button", { type: "submit", class: "wa-tool", text: "Continue" })])
    ]);
    this.log.appendChild(box);
    input.focus();
  };
  function friendlyError(err) {
    switch (err.code) {
      case "offline": return "Lost connection. Check your internet, then press Retry.";
      case "busy": return "Still working on your last message. Wait a moment, then press Retry.";
      case "session_limit": case "daily_limit": case "network_limit": return err.message;
      case "budget": return "Watford AI has reached its usage limit for now. You can still search the website.";
      case "ai_disabled": return "Watford AI is turned off right now. You can still search the website.";
      case "timeout": return "That took too long. Press Retry.";
      case "provider_busy": return "Watford AI is very busy. Wait a minute, then press Retry.";
      default: return err.message || "Something went wrong. Press Retry.";
    }
  }

  ChatView.prototype.newChat = function () {
    if (this.pending) this.pending.abort();
    state.messages = []; save(); syncAll();
    this.say("Started a new chat."); this.input.focus();
  };
  ChatView.prototype.clearAll = function () {
    if (this.pending) this.pending.abort();
    state = freshState(); state.token = null; state.tokenExp = 0;
    try { sessionStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    state.context = undefined;
    syncAll();
    this.say("Cleared.");
    var note = h("p", { class: "wa-meta", role: "note", text: "Cleared from this device. Watford AI doesn't save your chat, but the AI service it uses usually keeps messages for up to 30 days (longer if flagged for a safety review)." });
    this.log.appendChild(note);
    this.input.focus();
  };

  function syncAll() { views.forEach(function (v) { v.refresh(); }); }

  /* ---------- launcher + panel (regular pages) ---------- */
  var launcher = null, panel = null, lastFocus = null, panelView = null;
  function buildLauncher() {
    launcher = h("button", { type: "button", class: "wa-launcher", "aria-haspopup": "dialog", "aria-expanded": "false", onclick: openPanel }, [
      h("span", { class: "wa-launcher-badge", "aria-hidden": "true", text: "AI" }), h("span", { text: "Ask Watford AI" })
    ]);
    document.body.appendChild(launcher);
    // On phones, hide the button while a practice box or other field is being typed in.
    document.addEventListener("focusin", function (e) {
      if (panel && panel.contains(e.target)) return;
      launcher.classList.toggle("wa-hide", /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable);
    });
    document.addEventListener("focusout", function () { setTimeout(function () { if (!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "")) launcher.classList.remove("wa-hide"); }, 50); });
  }
  function openPanel() {
    lastFocus = document.activeElement;
    if (!panel) {
      panel = h("div", { class: "wa-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "wa-panel-title", hidden: true });
      var inner = h("div", { class: "wa-panel-inner" });
      panel.appendChild(inner);
      document.body.appendChild(panel);
      panelView = new ChatView(inner, "panel");
      panel.addEventListener("keydown", trapKeys);
      fitToViewport();
    }
    panel.hidden = false;
    document.documentElement.classList.add("wa-open");
    launcher.setAttribute("aria-expanded", "true");
    loadConfig().then(syncAll);
    setTimeout(function () { panelView.input.focus(); }, reduceMotion ? 0 : 60);
  }
  function closePanel() {
    if (!panel) return;
    panel.hidden = true;
    document.documentElement.classList.remove("wa-open");
    launcher.setAttribute("aria-expanded", "false");
    (lastFocus && document.contains(lastFocus) ? lastFocus : launcher).focus();
  }
  function trapKeys(e) {
    if (e.key === "Escape") { e.preventDefault(); closePanel(); return; }
    if (e.key !== "Tab") return;
    var f = Array.prototype.filter.call(panel.querySelectorAll("button, a[href], input, select, textarea, [tabindex]"), function (x) { return !x.disabled && !x.hidden && x.offsetParent !== null && x.tabIndex >= 0; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  // Phones: keep the panel above the on-screen keyboard.
  function fitToViewport() {
    if (!window.visualViewport) return;
    var vv = window.visualViewport;
    var fit = function () { if (panel) panel.style.setProperty("--wa-vh", vv.height + "px"); };
    vv.addEventListener("resize", fit); fit();
  }

  /* ---------- start ---------- */
  function start() {
    var pageRoot = document.getElementById("watford-ai-page");
    if (pageRoot) {
      var v = new ChatView(pageRoot, "page");
      loadConfig().then(syncAll);
      v.input.focus({ preventScroll: true });
    } else {
      buildLauncher();
      loadConfig();   // fetches names and the page list in the background
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();

  window.WatfordAI = { _renderMarkdown: renderMarkdown, _sendableHistory: sendableHistory, open: function () { if (launcher) openPanel(); } };
})();
