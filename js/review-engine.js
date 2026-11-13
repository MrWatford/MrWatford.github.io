/* Study guide engine for typing/review/*.html
   Each page loads a data file first (js/reviews/<guide>.js) that sets window.REVIEW, then this file.
   REVIEW = {
     labels:  { term: "Word", def: "Meaning" }      // names used on flashcards and matching
     terms:   [[term, meaning], ...]                // flashcards + matching
     extraCards: [[front, back], ...]               // flashcards only
     mc:      [[question, [right, wrong, wrong, wrong], why], ...]
     makeMC:  function () { return [same shape] }   // optional: freshly generated questions each round
     tf:      [[statement, true/false, why], ...]
     short:   [[question, sample answer, [checklist items]], ...]
     fix:     [[messy sentence, [correct versions], why], ...]   // "Fix it" retype tab
     press:   [[keys, action, code, {shift, alt}], ...]          // "Press it!" shortcut game
   }
   Only the tabs that exist on the page are set up. Nothing is saved or sent anywhere. */
(function () {
  "use strict";
  var R = window.REVIEW || {};
  var L = R.labels || { term: "Word", def: "Meaning" };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  R._shuffle = shuffle;

  /* ---------- Tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".rv-tab"));
  function showTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    });
    document.dispatchEvent(new CustomEvent("rv-tab", { detail: id }));
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      var id = t.getAttribute("aria-controls");
      showTab(id);
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!n) return;
      e.preventDefault();
      var next = tabs[(i + n + tabs.length) % tabs.length];
      showTab(next.getAttribute("aria-controls"), true);
    });
  });
  var start = location.hash.slice(1);
  var ids = tabs.map(function (t) { return t.getAttribute("aria-controls"); });
  showTab(ids.indexOf(start) >= 0 ? start : ids[0]);
  Array.prototype.forEach.call(document.querySelectorAll("[data-go]"), function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("tab-" + a.getAttribute("data-go")).click();
      $(".rv-tabs").scrollIntoView({ behavior: "smooth" });
    });
  });
  function isOpen(id) { var p = document.getElementById(id); return p && !p.hidden; }

  /* ---------- Flashcards ---------- */
  if ($("#fc-card") && R.terms) (function () {
    var all = R.terms.concat(R.extraCards || []);
    var deck, idx, flipped, learning, meaningFirst = false;
    var card = $("#fc-card"), front = $("#fc-front"), back = $("#fc-back");
    var count = $("#fc-count"), done = $("#fc-done"), stage = $("#fc-stage");

    function begin(cards) {
      deck = shuffle(cards); idx = 0; learning = [];
      done.hidden = true; stage.hidden = false;
      render();
    }
    function render() {
      var c = deck[idx];
      flipped = false;
      card.classList.remove("flipped");
      front.textContent = meaningFirst ? c[1] : c[0];
      back.textContent = meaningFirst ? c[0] : c[1];
      front.className = "rv-face rv-front" + (meaningFirst ? " meaning" : " word");
      back.className = "rv-face rv-back" + (meaningFirst ? " word" : " meaning");
      count.textContent = "Card " + (idx + 1) + " of " + deck.length;
      card.setAttribute("aria-label", (meaningFirst ? L.def : L.term) + ": " + front.textContent + ". Press to flip.");
    }
    function flip() {
      flipped = !flipped;
      card.classList.toggle("flipped", flipped);
      card.setAttribute("aria-label", (flipped ? "Answer: " + back.textContent : front.textContent) + ". Press to flip.");
    }
    function next(knewIt) {
      if (knewIt === false) learning.push(deck[idx]);
      if (idx < deck.length - 1) { idx++; render(); return; }
      stage.hidden = true; done.hidden = false;
      var msg = $("#fc-done-msg"), again = $("#fc-again");
      if (learning.length) {
        msg.textContent = "Nice work! You marked " + learning.length + " card" + (learning.length > 1 ? "s" : "") + " \"Still learning.\" Practice just those?";
        again.hidden = false;
      } else {
        msg.textContent = "You knew every card! 🎉";
        again.hidden = true;
      }
    }
    card.addEventListener("click", flip);
    $("#fc-know").addEventListener("click", function () { next(true); });
    $("#fc-learning").addEventListener("click", function () { next(false); });
    $("#fc-prev").addEventListener("click", function () { if (idx > 0) { idx--; render(); } });
    $("#fc-shuffle").addEventListener("click", function () { begin(all); });
    $("#fc-restart").addEventListener("click", function () { begin(all); });
    $("#fc-again").addEventListener("click", function () { begin(learning); });
    $("#fc-mode").addEventListener("change", function (e) { meaningFirst = e.target.value === "meaning"; render(); });
    document.addEventListener("keydown", function (e) {
      if (!isOpen("flashcards") || stage.hidden) return;
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === " " && e.target === card) { e.preventDefault(); return; }
      if (e.target.classList && e.target.classList.contains("rv-tab")) return;
      if (e.key === "ArrowRight") next(true);
      if (e.key === "ArrowLeft" && idx > 0) { idx--; render(); }
    });
    begin(all);
  })();

  /* ---------- Practice questions (multiple choice + true/false) ---------- */
  if ($("#pq-box")) (function () {
    var box = $("#pq-box"), progress = $("#pq-progress"), scoreEl = $("#pq-score");
    var list, idx, right, missed;

    function build(kind, n) {
      var mcSrc = (R.mc || []).concat(R.makeMC ? R.makeMC() : []);
      var mc = mcSrc.map(function (q) { return { type: "mc", q: q[0], answer: q[1][0], choices: shuffle(q[1]), why: q[2] || "" }; });
      var tf = (R.tf || []).map(function (q) { return { type: "tf", q: q[0], answer: q[1] ? "True" : "False", choices: ["True", "False"], why: q[2] || "" }; });
      var pool = kind === "mc" ? mc : kind === "tf" ? tf : mc.concat(tf);
      pool = shuffle(pool);
      return n ? pool.slice(0, n) : pool;
    }
    function begin(qs) { list = qs; idx = 0; right = 0; missed = []; show(); }
    function show() {
      box.innerHTML = "";
      if (idx >= list.length) return finish();
      var item = list[idx];
      progress.textContent = "Question " + (idx + 1) + " of " + list.length;
      scoreEl.textContent = "Score: " + right;
      var tag = el("p", "rv-qtag", item.type === "tf" ? "True or false?" : "Multiple choice");
      var q = el("p", "rv-q", item.q);
      var choices = el("div", "rv-choices" + (item.type === "tf" ? " tf" : ""));
      var fb = el("p", "rv-feedback"); fb.setAttribute("role", "status");
      var nextBtn = el("button", "btn", idx === list.length - 1 ? "See my score →" : "Next question →");
      nextBtn.type = "button"; nextBtn.hidden = true;
      nextBtn.addEventListener("click", function () { idx++; show(); });
      item.choices.forEach(function (c, i) {
        var b = el("button", "rv-choice");
        b.type = "button";
        b.innerHTML = "<span class=\"rv-letter\">" + (item.type === "tf" ? (c === "True" ? "T" : "F") : "abcd"[i]) + "</span>";
        b.appendChild(el("span", "rv-ctext", c));
        b.addEventListener("click", function () {
          var ok = c === item.answer;
          Array.prototype.forEach.call(choices.children, function (x) {
            x.disabled = true;
            if (x.lastChild.textContent === item.answer) x.classList.add("right");
          });
          if (ok) { right++; fb.className = "rv-feedback good"; fb.textContent = "✓ Correct! " + item.why; }
          else { missed.push(item); b.classList.add("wrong"); fb.className = "rv-feedback bad"; fb.textContent = "Not quite. The answer is \"" + item.answer + "\". " + item.why; }
          scoreEl.textContent = "Score: " + right;
          nextBtn.hidden = false; nextBtn.focus();
        });
        choices.appendChild(b);
      });
      [tag, q, choices, fb, nextBtn].forEach(function (x) { box.appendChild(x); });
    }
    function finish() {
      progress.textContent = "Finished!";
      scoreEl.textContent = "Score: " + right + " / " + list.length;
      var pct = Math.round(right / list.length * 100);
      box.appendChild(el("p", "rv-big", right + " / " + list.length + " (" + pct + "%)"));
      box.appendChild(el("p", null, pct === 100 ? "Perfect! You're ready. 🎉" : pct >= 80 ? "Great job! Review the ones you missed and try again." : "Keep studying. Try the flashcards, then practice the ones you missed."));
      var row = el("div", "rv-row");
      if (missed.length) {
        var redo = el("button", "btn", "Practice the " + missed.length + " I missed");
        redo.type = "button";
        redo.addEventListener("click", function () {
          begin(shuffle(missed).map(function (m) { return m.type === "mc" ? Object.assign({}, m, { choices: shuffle(m.choices) }) : m; }));
        });
        row.appendChild(redo);
      }
      var again = el("button", "btn ghost", "New set of questions");
      again.type = "button";
      again.addEventListener("click", startFromPicker);
      row.appendChild(again);
      box.appendChild(row);
    }
    function startFromPicker() {
      var kind = $("#pq-kind") ? $("#pq-kind").value : "mix";
      var n = $("#pq-length").value === "all" ? 0 : +$("#pq-length").value;
      begin(build(kind, n));
    }
    $("#pq-start").addEventListener("click", startFromPicker);
    startFromPicker();
  })();

  /* ---------- Matching ---------- */
  if ($("#mt-words") && R.terms) (function () {
    var wordsCol = $("#mt-words"), defsCol = $("#mt-defs"), status = $("#mt-status");
    var picked = null, matched = 0, misses = 0, round;
    var tl = L.term.toLowerCase(), dl = L.def.toLowerCase();

    function deal() {
      round = shuffle(R.terms).slice(0, 6);
      matched = 0; misses = 0; picked = null;
      wordsCol.innerHTML = ""; defsCol.innerHTML = "";
      status.textContent = "Tap a " + tl + ", then tap its " + dl + ".";
      round.forEach(function (t, i) {
        var w = el("button", "rv-match word", t[0]);
        w.type = "button"; w.dataset.k = i;
        w.addEventListener("click", function () { pick(w); });
        wordsCol.appendChild(w);
      });
      shuffle(round.map(function (t, i) { return [t[1], i]; })).forEach(function (d) {
        var b = el("button", "rv-match def", d[0]);
        b.type = "button"; b.dataset.k = d[1];
        b.addEventListener("click", function () { choose(b); });
        defsCol.appendChild(b);
      });
    }
    function pick(w) {
      if (w.disabled) return;
      if (picked) picked.classList.remove("picked");
      picked = w; w.classList.add("picked");
      status.textContent = "Now tap the " + dl + " for \"" + w.textContent + "\".";
    }
    function choose(d) {
      if (!picked) { status.textContent = "Pick a " + tl + " on the left first."; return; }
      if (d.dataset.k === picked.dataset.k) {
        [picked, d].forEach(function (x) { x.classList.remove("picked"); x.classList.add("done"); x.disabled = true; });
        matched++; picked = null;
        status.textContent = matched === round.length
          ? "All matched with " + misses + " miss" + (misses === 1 ? "" : "es") + "! " + (misses === 0 ? "🎉" : "Try another round.")
          : "✓ Match! " + (round.length - matched) + " to go.";
      } else {
        misses++;
        d.classList.add("shake");
        setTimeout(function () { d.classList.remove("shake"); }, 450);
        status.textContent = "Not that one. Try again.";
      }
    }
    $("#mt-new").addEventListener("click", deal);
    deal();
  })();

  /* ---------- Short answers ---------- */
  if ($("#sa-list") && R.short) (function () {
    var wrap = $("#sa-list");
    R.short.forEach(function (s, i) {
      var art = el("div", "rv-sa");
      var id = "sa-" + (i + 1);
      var label = el("label", "rv-q", (i + 1) + ". " + s[0]);
      label.htmlFor = id;
      var ta = el("textarea");
      ta.id = id; ta.rows = 3; ta.placeholder = "Type your answer in a complete sentence…";
      ta.setAttribute("autocomplete", "off");
      var btn = el("button", "btn small", "Check my answer");
      btn.type = "button";
      var reveal = el("div", "rv-reveal"); reveal.hidden = true;
      reveal.appendChild(el("p", "rv-sample-h", "Sample answer"));
      reveal.appendChild(el("p", "rv-sample", s[1]));
      reveal.appendChild(el("p", "rv-sample-h", "Did your answer…"));
      s[2].forEach(function (c) {
        var lab = el("label", "rv-check");
        var cb = el("input"); cb.type = "checkbox";
        lab.appendChild(cb); lab.appendChild(document.createTextNode(" " + c));
        reveal.appendChild(lab);
      });
      btn.addEventListener("click", function () {
        if (!ta.value.trim()) { ta.focus(); ta.placeholder = "Try writing your own answer first!"; return; }
        reveal.hidden = false; btn.textContent = "Answer checked ✓"; btn.disabled = true;
      });
      [label, ta, btn, reveal].forEach(function (x) { art.appendChild(x); });
      wrap.appendChild(art);
    });
  })();

  /* ---------- Fix it (retype the sentence correctly) ---------- */
  if ($("#fx-box") && R.fix) (function () {
    var box = $("#fx-box"), prog = $("#fx-progress"), scoreEl = $("#fx-score");
    var list, idx, right, tries;
    function norm(s) {
      return s.replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/ /g, " ").trim();
    }
    function begin() { list = shuffle(R.fix); idx = 0; right = 0; show(); }
    function show() {
      box.innerHTML = "";
      if (idx >= list.length) {
        prog.textContent = "Finished!";
        scoreEl.textContent = "Fixed on the first try: " + right + " / " + list.length;
        box.appendChild(el("p", "rv-big", right + " / " + list.length + " fixed on the first try"));
        var again = el("button", "btn", "Start over");
        again.type = "button"; again.addEventListener("click", begin);
        box.appendChild(again);
        return;
      }
      tries = 0;
      var item = list[idx];
      prog.textContent = "Sentence " + (idx + 1) + " of " + list.length;
      scoreEl.textContent = "First-try fixes: " + right;
      box.appendChild(el("p", "rv-qtag", "Fix the mistakes"));
      box.appendChild(el("p", "rv-fx-bad", item[0]));
      var lab = el("label", "rv-fx-label", "Type the sentence the correct way:");
      var inp = el("input", "rv-fx-input");
      inp.type = "text"; inp.id = "fx-input";
      inp.setAttribute("autocomplete", "off"); inp.setAttribute("spellcheck", "false");
      inp.setAttribute("autocapitalize", "off"); inp.setAttribute("autocorrect", "off");
      lab.htmlFor = "fx-input";
      inp.addEventListener("paste", function (e) { e.preventDefault(); });
      var fb = el("p", "rv-feedback"); fb.setAttribute("role", "status");
      var row = el("div", "rv-row");
      var check = el("button", "btn", "Check");
      check.type = "button";
      var show1 = el("button", "btn ghost", "Show me");
      show1.type = "button";
      var next = el("button", "btn", idx === list.length - 1 ? "See my score →" : "Next sentence →");
      next.type = "button"; next.hidden = true;
      next.addEventListener("click", function () { idx++; show(); });
      function done(ok) {
        check.hidden = true; show1.hidden = true; next.hidden = false; inp.disabled = true;
        if (ok && tries === 1) right++;
        scoreEl.textContent = "First-try fixes: " + right;
        next.focus();
      }
      check.addEventListener("click", function () {
        if (!inp.value.trim()) { inp.focus(); return; }
        tries++;
        var v = norm(inp.value);
        var ok = item[1].some(function (g) { return norm(g) === v; });
        if (ok) { fb.className = "rv-feedback good"; fb.textContent = "✓ Correct! " + item[2]; done(true); }
        else { fb.className = "rv-feedback bad"; fb.textContent = "Not yet. Check capital letters, spaces, and punctuation, then try again."; inp.focus(); }
      });
      show1.addEventListener("click", function () {
        tries = 99;
        fb.className = "rv-feedback bad";
        fb.textContent = "Correct: " + item[1][0] + "  " + item[2];
        done(false);
      });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); (check.hidden ? next : check).click(); } });
      row.appendChild(check); row.appendChild(show1); row.appendChild(next);
      [lab, inp, fb, row].forEach(function (x) { box.appendChild(x); });
      if (isOpen("fix")) inp.focus();
    }
    begin();
  })();

  /* ---------- Press it! (real keyboard shortcuts) ---------- */
  if ($("#pr-box") && R.press) (function () {
    var box = $("#pr-box"), prog = $("#pr-progress"), scoreEl = $("#pr-score");
    var list, idx, right, missedNow, waiting = false;
    function begin() { list = shuffle(R.press).slice(0, 10); idx = 0; right = 0; show(); }
    function show() {
      box.innerHTML = "";
      waiting = false;
      if (idx >= list.length) {
        prog.textContent = "Finished!";
        scoreEl.textContent = "Score: " + right + " / " + list.length;
        box.appendChild(el("p", "rv-big", right + " / " + list.length + " on the first try"));
        var again = el("button", "btn", "Play again");
        again.type = "button"; again.addEventListener("click", begin);
        box.appendChild(again);
        return;
      }
      var item = list[idx];
      missedNow = false;
      prog.textContent = "Shortcut " + (idx + 1) + " of " + list.length;
      scoreEl.textContent = "Score: " + right;
      box.appendChild(el("p", "rv-qtag", "Press the shortcut for…"));
      box.appendChild(el("p", "rv-pr-action", item[1]));
      var pad = el("div", "rv-pr-pad", "⌨️ Press the keys on your keyboard now");
      pad.tabIndex = 0;
      pad.id = "pr-pad";
      box.appendChild(pad);
      var fb = el("p", "rv-feedback"); fb.id = "pr-fb"; fb.setAttribute("role", "status");
      box.appendChild(fb);
      var row = el("div", "rv-row");
      var hint = el("button", "btn ghost small", "I don't know");
      hint.type = "button";
      hint.addEventListener("click", function () {
        missedNow = true;
        fb.className = "rv-feedback bad";
        fb.textContent = "It's " + item[0] + ". Press it now to keep going!";
      });
      row.appendChild(hint);
      box.appendChild(row);
      waiting = true;
    }
    document.addEventListener("keydown", function (e) {
      if (!waiting || !isOpen("press")) return;
      if (/^(Control|Shift|Alt|Meta)$/.test(e.key)) return;
      var item = list[idx], opt = item[3] || {};
      var mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      e.preventDefault();
      var fb = $("#pr-fb");
      var ok = e.code === item[2] && !!e.shiftKey === !!opt.shift && !!e.altKey === !!opt.alt;
      if (ok) {
        waiting = false;
        if (!missedNow) right++;
        fb.className = "rv-feedback good";
        fb.textContent = "✓ Yes! " + item[0] + " = " + item[1] + ".";
        $("#pr-pad").classList.add("ok");
        setTimeout(function () { idx++; show(); }, 900);
      } else {
        missedNow = true;
        fb.className = "rv-feedback bad";
        fb.textContent = "Not that one. Try again, or click \"I don't know\" for a hint.";
      }
    });
    begin();
  })();

  /* ---------- Keyboard: label it + find the key ---------- */
  if ($("#kb-fill")) (function () {
    var ROWS = [
      [["`"], "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ["-"], ["="], ["Backspace", "wide2"]],
      [["Tab", "wide15"], "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", ["["], ["]"], ["\\", "wide15"]],
      [["Caps Lock", "wide18"], "A", "S", "D", "F", "G", "H", "J", "K", "L", [";"], ["'"], ["Enter", "wide22"]],
      [["Shift", "wide23"], "Z", "X", "C", "V", "B", "N", "M", [","], ["."], ["/"], ["Shift", "wide27"]],
      [["Ctrl", "wide15"], ["Alt", "wide15"], ["Space Bar", "space"], ["Alt", "wide15"], ["Ctrl", "wide15"]]
    ];
    function draw(host, mode) {
      host.innerHTML = "";
      var kb = el("div", "kbx");
      ROWS.forEach(function (r) {
        var row = el("div", "kbx-row");
        r.forEach(function (k) {
          if (Array.isArray(k)) {
            var fixed = el("span", "kbx-key fixed " + (k[1] || ""), k[0]);
            row.appendChild(fixed);
            return;
          }
          var bump = k === "F" || k === "J";
          if (mode === "fill") {
            var inp = el("input", "kbx-key blank" + (bump ? " bump" : ""));
            inp.maxLength = 1;
            inp.dataset.answer = k;
            inp.setAttribute("aria-label", "Blank key");
            inp.setAttribute("autocomplete", "off"); inp.setAttribute("autocapitalize", "characters");
            inp.setAttribute("spellcheck", "false");
            row.appendChild(inp);
          } else {
            var b = el("button", "kbx-key blank" + (bump ? " bump" : ""));
            b.type = "button";
            b.dataset.answer = k;
            b.setAttribute("aria-label", "Key");
            row.appendChild(b);
          }
        });
        kb.appendChild(row);
      });
      host.appendChild(kb);
      return kb;
    }

    // Fill mode
    var fillHost = $("#kb-fill"), fillStatus = $("#kb-fill-status");
    var instant = $("#kb-instant");
    function setupFill() {
      var kb = draw(fillHost, "fill");
      var inputs = Array.prototype.slice.call(kb.querySelectorAll("input"));
      fillStatus.textContent = "Click a blank key and type the letter or number that belongs there. Hint: F and J have bumps.";
      inputs.forEach(function (inp, i) {
        inp.addEventListener("input", function () {
          inp.value = inp.value.toUpperCase().slice(-1);
          inp.classList.remove("ok", "bad");
          if (inp.value && instant.checked) inp.classList.add(inp.value === inp.dataset.answer ? "ok" : "bad");
          if (inp.value) {
            for (var j = i + 1; j < inputs.length; j++) if (!inputs[j].value) { inputs[j].focus(); break; }
          }
        });
        inp.addEventListener("keydown", function (e) {
          if (e.key === "Backspace" && !inp.value && i > 0) { inputs[i - 1].focus(); }
        });
      });
    }
    $("#kb-check").addEventListener("click", function () {
      var inputs = fillHost.querySelectorAll("input"), score = 0, empty = 0;
      Array.prototype.forEach.call(inputs, function (inp) {
        inp.classList.remove("ok", "bad");
        if (!inp.value) { empty++; inp.classList.add("bad"); return; }
        if (inp.value === inp.dataset.answer) { score++; inp.classList.add("ok"); } else inp.classList.add("bad");
      });
      fillStatus.textContent = "Score: " + score + " / " + inputs.length + (empty ? " (" + empty + " left blank)" : "") + (score === inputs.length ? " 🎉 Perfect!" : ". Red keys need another look.");
    });
    $("#kb-show").addEventListener("click", function () {
      Array.prototype.forEach.call(fillHost.querySelectorAll("input"), function (inp) {
        if (inp.value !== inp.dataset.answer) { inp.value = inp.dataset.answer; inp.classList.remove("ok"); inp.classList.add("shown"); }
      });
      fillStatus.textContent = "Answers shown in blue. Study them, then press \"Start over\" and try from memory!";
    });
    $("#kb-reset").addEventListener("click", setupFill);
    instant.addEventListener("change", function () {
      Array.prototype.forEach.call(fillHost.querySelectorAll("input"), function (inp) {
        inp.classList.remove("ok", "bad");
        if (instant.checked && inp.value) inp.classList.add(inp.value === inp.dataset.answer ? "ok" : "bad");
      });
    });
    setupFill();

    // Find-the-key mode
    var findHost = $("#kb-find"), findStatus = $("#kb-find-status"), target, found, misses, round;
    var all = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890".split("");
    function setupFind() {
      var kb = draw(findHost, "find");
      round = shuffle(all).slice(0, 15); found = 0; misses = 0;
      Array.prototype.forEach.call(kb.querySelectorAll("button"), function (b) {
        b.addEventListener("click", function () {
          if (!target) return;
          if (b.dataset.answer === target) {
            b.textContent = target; b.classList.add("ok");
            found++;
            setTimeout(function () { b.classList.remove("ok"); b.classList.add("seen"); }, 500);
            nextTarget();
          } else {
            misses++;
            b.classList.add("bad");
            setTimeout(function () { b.classList.remove("bad"); }, 400);
            findStatus.innerHTML = "That's not it. Find <b>" + target + "</b>";
          }
        });
      });
      nextTarget();
    }
    function nextTarget() {
      if (!round.length) {
        target = null;
        findStatus.innerHTML = "🎉 Done! You found 15 keys with <b>" + misses + "</b> wrong click" + (misses === 1 ? "" : "s") + ".";
        return;
      }
      target = round.shift();
      findStatus.innerHTML = "Click the key for <b class=\"kbx-target\">" + target + "</b> <small>(" + (15 - round.length) + " of 15)</small>";
    }
    $("#kb-find-new").addEventListener("click", setupFind);
    setupFind();
  })();
})();
