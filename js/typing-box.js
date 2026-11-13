/* Typing box used by Typing Classroom assignments and the speed test.
   TypingBox.create(container, { text, seconds, onFinish })
     text     – the passage to type
     seconds  – optional time limit (speed test); without it, the student types the whole passage
     onFinish – called with { wpm, accuracy, seconds, typed, total, errors, complete }
   Nothing is saved or sent anywhere. Pasting is blocked. */
(function () {
  "use strict";

  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function create(container, opts) {
    var text = String(opts.text).replace(/\s+/g, " ").trim();
    var limit = opts.seconds || 0;
    var root = document.createElement("div");
    root.className = "tb";
    root.innerHTML =
      '<div class="tb-stats" aria-live="off">' +
        '<span><small>' + (limit ? "Time left" : "Time") + '</small><b class="tb-time">' + fmtTime(limit) + '</b></span>' +
        '<span><small>Speed</small><b class="tb-wpm">0</b> WPM</span>' +
        '<span><small>Accuracy</small><b class="tb-acc">100</b>%</span>' +
        '<span><small>Progress</small><b class="tb-prog">0</b>%</span>' +
      '</div>' +
      '<div class="tb-area">' +
        '<div class="tb-text" aria-hidden="true"></div>' +
        '<textarea class="tb-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Type the passage here"></textarea>' +
        '<div class="tb-start">Click here and start typing.<br><small>The timer starts on your first key.</small></div>' +
      '</div>' +
      '<p class="tb-sr" aria-live="polite"></p>';
    container.innerHTML = "";
    container.appendChild(root);

    var display = root.querySelector(".tb-text");
    var input = root.querySelector(".tb-input");
    var startMsg = root.querySelector(".tb-start");
    var tEl = root.querySelector(".tb-time"), wEl = root.querySelector(".tb-wpm"),
        aEl = root.querySelector(".tb-acc"), pEl = root.querySelector(".tb-prog");
    var sr = root.querySelector(".tb-sr");
    // Screen readers get the passage as plain text.
    sr.textContent = "Passage: " + text;

    var spans = [];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.textContent = text[i];
      if (text[i] === " ") s.className = "sp";
      spans.push(s);
      frag.appendChild(s);
    }
    display.appendChild(frag);

    var prev = "", startT = 0, keys = 0, errors = 0, timer = 0, done = false;

    function elapsed() { return startT ? (performance.now() - startT) / 1000 : 0; }
    function correctCount() {
      var c = 0;
      for (var i = 0; i < prev.length; i++) if (prev[i] === text[i]) c++;
      return c;
    }
    function stats() {
      var sec = elapsed();
      var wpm = sec >= 2 ? Math.round((correctCount() / 5) / (sec / 60)) : 0;
      var acc = keys ? Math.floor((keys - errors) / keys * 100) : 100;
      return { wpm: wpm, accuracy: acc, seconds: Math.round(limit ? Math.min(sec, limit) : sec),
               typed: prev.length, total: text.length, errors: errors, complete: prev.length >= text.length };
    }
    function paintStats() {
      var st = stats();
      tEl.textContent = fmtTime(limit ? limit - elapsed() : elapsed());
      wEl.textContent = st.wpm;
      aEl.textContent = st.accuracy;
      pEl.textContent = Math.floor(prev.length / text.length * 100);
    }
    function mark(from, to) {
      for (var i = Math.max(0, from); i < Math.min(to, spans.length); i++) {
        var cls = text[i] === " " ? "sp" : "";
        if (i < prev.length) cls += prev[i] === text[i] ? " ok" : " bad";
        if (i === prev.length) cls += " cur";
        spans[i].className = cls.trim();
      }
    }
    function keepCursorVisible() {
      var cur = spans[Math.min(prev.length, spans.length - 1)];
      var top = cur.offsetTop - display.offsetTop;
      if (top > display.scrollTop + display.clientHeight - 40 || top < display.scrollTop) {
        display.scrollTop = Math.max(0, top - 30);
      }
    }
    function finish() {
      if (done) return;
      done = true;
      clearInterval(timer);
      input.disabled = true;
      root.classList.add("tb-done");
      startMsg.hidden = true;
      paintStats();
      var st = stats();
      if (opts.onFinish) opts.onFinish(st);
    }

    input.addEventListener("focus", function () { startMsg.hidden = true; root.classList.add("tb-focus"); });
    input.addEventListener("blur", function () { if (!done && !prev.length) startMsg.hidden = false; root.classList.remove("tb-focus"); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === "Tab") e.preventDefault(); });
    ["paste", "drop", "cut"].forEach(function (ev) { input.addEventListener(ev, function (e) { e.preventDefault(); }); });

    input.addEventListener("input", function () {
      if (done) return;
      var val = input.value.replace(/\n/g, "");
      if (val.length > text.length) val = val.slice(0, text.length);
      // Block autocomplete/paste tricks: no more than 2 new letters at once.
      if (val.length - prev.length > 2) { input.value = prev; return; }
      startMsg.hidden = true;
      if (!startT && val.length) {
        startT = performance.now();
        timer = setInterval(function () {
          paintStats();
          if (limit && elapsed() >= limit) finish();
        }, 250);
      }
      if (val.length > prev.length) {
        for (var i = prev.length; i < val.length; i++) {
          keys++;
          if (val[i] !== text[i]) errors++;
        }
      }
      var old = prev.length;
      prev = val;
      if (input.value !== val) input.value = val;
      mark(Math.min(old, val.length) - 1, Math.max(old, val.length) + 2);
      keepCursorVisible();
      paintStats();
      if (prev.length >= text.length) finish();
    });

    mark(0, 1);
    return {
      focus: function () { input.focus(); },
      stats: stats,
      finish: finish
    };
  }

  window.TypingBox = { create: create, fmtTime: fmtTime };
})();
