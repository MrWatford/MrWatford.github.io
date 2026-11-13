/* Living Wisely Online — quiz review (typing/review/living-wisely-online.html)
   Everything comes from Mr. Watford's review sheet. Questions are written in new words
   so the real quiz is NOT posted here. Nothing is saved or sent anywhere. */
(function () {
  "use strict";

  /* ---------- Content (edit here) ---------- */
  var TERMS = [
    ["Netiquette", "Using good manners and polite rules when talking with people online."],
    ["Cyberbullying", "Using technology to hurt, threaten, or embarrass someone again and again."],
    ["Phishing", "A fake message or website that tries to trick you into giving away private information."],
    ["Plagiarism", "Copying someone else's words or work and calling it your own."],
    ["Personal information", "Private facts about you, like your address, phone number, and passwords."],
    ["Privacy settings", "Controls that decide who can see your posts and information."],
    ["AI chatbot", "A computer program that answers questions and creates writing or pictures."],
    ["Fact-checking", "Checking a claim with trustworthy sources to make sure it is true."],
    ["Digital footprint", "The trail of information you leave behind online (posts, pictures, comments, searches)."],
    ["Hallucination", "When an AI makes up a fact that sounds true but is false."],
    ["Deepfake", "A fake picture, video, or voice made with AI to look or sound like a real person."]
  ];
  var EXTRA_CARDS = [
    ["THINK", "Before you post or text, ask: Is it True? Helpful? Inspiring? Necessary? Kind?"]
  ];

  // Multiple choice: first choice listed is the right one (choices get shuffled).
  var MC = [
    ["Which of these is part of your digital footprint?", ["A comment you left under a video", "Muddy shoe prints on the classroom floor", "The size of your sneakers", "A dream you had last night"], "Your digital footprint is the trail you leave online: posts, pictures, comments, and searches."],
    ["In THINK, what does the H stand for?", ["Helpful", "Happy", "Honest", "Hidden"], "THINK = True, Helpful, Inspiring, Necessary, Kind."],
    ["In THINK, what does the N stand for?", ["Necessary", "Nice", "New", "Normal"], "THINK = True, Helpful, Inspiring, Necessary, Kind."],
    ["Which password is the strongest?", ["Maple-Canoe!82sunset", "ilovepizza", "12345678", "Your first and last name"], "Strong passwords are long and mix letters, numbers, and symbols."],
    ["Why is password123 a weak password?", ["It is short and easy to guess", "It has too many symbols", "It is too long to remember", "It uses capital letters"], "Weak passwords are easy to guess, like password123, 111111, or your name."],
    ["Someone you don't know in an online game asks which school you go to. What should you do?", ["Don't answer, block them, and tell a parent", "Tell them since it's only your school", "Give them a fake school name and keep chatting", "Ask them where they go first"], "Strangers online are not always who they say they are."],
    ["A group chat starts making fun of a classmate. What is the best choice?", ["Don't join in or share it, be kind to the classmate, and tell a trusted adult", "Add a laughing emoji so you fit in", "Screenshot it and send it to more friends", "Leave a mean comment about the people in the chat"], "Telling a trusted adult is not tattling; it helps keep people safe."],
    ["You send a friend a long message and they reply only \"ok.\" What should you do?", ["Don't assume the worst; kindly ask if everything is okay", "Reply in ALL CAPS so they know you're upset", "Stop talking to them", "Tell other friends they are being rude"], "Texts don't show tone of voice or faces, so they are easy to misunderstand."],
    ["An AI chatbot gives you a fact for your report. What should you do before using it?", ["Check it in a trustworthy source like a textbook or encyclopedia", "Nothing, because AI is always right", "Ask the same chatbot if it's sure", "Use it only if it sounds smart"], "AI can make mistakes. Fact-check it with trustworthy sources, more than one source, or a teacher or parent."],
    ["An AI tells you a president was born on the moon. What is this kind of AI mistake called?", ["A hallucination", "A deepfake", "Phishing", "Netiquette"], "A hallucination is when AI makes up a fact that sounds true but is false."],
    ["Which is a DISHONEST way to use AI?", ["Having AI write your book report and turning it in as yours", "Asking AI to explain a hard word, then writing the report yourself", "Asking your teacher if you may use AI", "Checking an AI answer in a textbook"], "Turning in AI work as if you wrote it is cheating."],
    ["Which is an HONEST way to use AI (with your teacher's permission)?", ["Asking AI to explain a math step you don't get, then doing the problems yourself", "Copying AI answers onto your homework", "Letting AI take an online quiz for you", "Having AI write your essay"], "Honest use: AI helps you understand, then you do the work."],
    ["A video shows a famous singer saying something shocking that doesn't sound like them. What might it be?", ["A deepfake", "A hallucination", "A privacy setting", "Plagiarism"], "Deepfakes are fake pictures, videos, or voices made with AI. Don't believe everything you see online."],
    ["An email says \"You won a free phone! Type your password to claim it.\" What is this?", ["Phishing", "Netiquette", "Fact-checking", "A digital footprint"], "Phishing tries to trick you into giving away private information."],
    ["Copying a paragraph from a website and turning it in as your own work is called…", ["Plagiarism", "Phishing", "Fact-checking", "Netiquette"], "Plagiarism is copying someone else's words or work and calling it your own."],
    ["What controls who can see your posts and information?", ["Privacy settings", "Netiquette", "A chatbot", "Fact-checking"], "Privacy settings decide who can see your posts."],
    ["Which of these is personal information you should keep private?", ["Your phone number", "Your favorite color", "The name of your favorite book", "What you think of a movie"], "Personal information includes your address, phone number, passwords, and school."],
    ["What does Ephesians 4:29 mean for how you act online?", ["Only post and text words that build others up", "It's okay to gossip if it's true", "Bad language is fine in private texts", "Only Sunday posts need to be kind"], "No gossip, insults, or bad language online."],
    ["Someone sends you an embarrassing picture of a classmate. What should you do?", ["Don't share it; delete it and tell a trusted adult", "Send it to just one friend", "Save it in case you need it later", "Post it, but without their name"], "Never pass along an embarrassing photo of someone else."]
  ];

  // True / false: [statement, answer, why]
  var TF = [
    ["If you delete a post right away, no one could have saved it.", false, "Posts last forever. Someone may already have taken a screenshot."],
    ["Strong passwords are long and mix letters, numbers, and symbols.", true, "Like Maple-Canoe!82sunset."],
    ["It's fine to share your password with a cousin you trust.", false, "Never share your password, not even with your best friend."],
    ["AI can make mistakes.", true, "AI is NOT always right, so fact-check it."],
    ["Typing in ALL CAPS is a polite way to show you're excited.", false, "ALL CAPS looks like you are shouting."],
    ["You can post a picture of your friends without asking them first.", false, "Ask permission before posting a photo of someone else."],
    ["Future employers might look at what you posted online.", true, "Schools and future employers may look at your digital footprint."],
    ["If the teacher can't see you, texting in class is okay.", false, "No texting during class, even if the teacher doesn't see you."],
    ["Telling a trusted adult about cyberbullying helps keep people safe.", true, "It is NOT tattling."],
    ["You should treat people online the same way you would face-to-face.", true, "Good netiquette = good manners online."],
    ["Someone online who says they are 12 years old is always telling the truth.", false, "Strangers online are not always who they say they are."],
    ["It's okay to tell an AI chatbot your home address.", false, "Never share personal information online or with an AI chatbot."],
    ["Using privacy settings is one way to keep your digital footprint positive.", true, "Also THINK first and post only kind, true things."]
  ];

  var SHORT = [
    ["What are TWO ways to check if something an AI told you is true?",
      "Look it up in a trustworthy source like a textbook or encyclopedia, and compare it with another source or ask a teacher or parent.",
      ["I named a trustworthy source (textbook, encyclopedia, reliable website)", "I gave a SECOND way (compare sources, or ask a teacher or parent)"]],
    ["What is a digital footprint? How can you keep yours positive?",
      "It is the trail of information you leave behind online. You can keep it positive by THINKing before you post and only sharing kind, true things.",
      ["I explained what a digital footprint is (the trail you leave online)", "I gave a way to keep it positive (THINK, kind and true posts, privacy settings)"]],
    ["Why is tone hard to read in a text? How should you respond?",
      "The reader can't hear your voice or see your face. Don't assume the worst; kindly ask if everything is okay.",
      ["I said you can't hear their voice or see their face", "I said to not assume the worst and kindly ask (or talk in person)"]],
    ["What is ONE honest and ONE dishonest way to use AI for homework?",
      "Honest: asking AI to explain a hard idea, then doing the work yourself. Dishonest: having AI write it and turning it in as your own.",
      ["I gave an honest way (AI explains, I do the work)", "I gave a dishonest way (AI does the work, I turn it in as mine)"]],
    ["How can you obey Ephesians 4:29 online?",
      "Only post and text words that are good and build others up. Don't gossip, insult, or share mean posts.",
      ["I said to use words that build others up", "I named something to avoid (gossip, insults, bad language, mean posts)"]]
  ];

  /* ---------- Helpers ---------- */
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
  showTab(tabs.some(function (t) { return t.getAttribute("aria-controls") === start; }) ? start : "flashcards");

  /* ---------- Flashcards ---------- */
  (function () {
    var all = TERMS.concat(EXTRA_CARDS);
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
      card.setAttribute("aria-label", (meaningFirst ? "Meaning: " : "Word: ") + front.textContent + ". Press to flip.");
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
      if (document.getElementById("flashcards").hidden || stage.hidden) return;
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === " " && e.target === card) { e.preventDefault(); return; } // button handles it
      if (e.key === "ArrowRight" && !e.target.classList.contains("rv-tab")) next(true);
      if (e.key === "ArrowLeft" && !e.target.classList.contains("rv-tab") && idx > 0) { idx--; render(); }
    });
    begin(all);
  })();

  /* ---------- Practice questions (multiple choice + true/false) ---------- */
  (function () {
    var box = $("#pq-box"), progress = $("#pq-progress"), scoreEl = $("#pq-score");
    var list, idx, right, missed;

    function build(kind, n) {
      var mc = MC.map(function (q) { return { type: "mc", q: q[0], answer: q[1][0], choices: shuffle(q[1]), why: q[2] }; });
      var tf = TF.map(function (q) { return { type: "tf", q: q[0], answer: q[1] ? "True" : "False", choices: ["True", "False"], why: q[2] }; });
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
        b.appendChild(document.createTextNode(c));
        b.addEventListener("click", function () {
          var ok = c === item.answer;
          Array.prototype.forEach.call(choices.children, function (x) {
            x.disabled = true;
            if (x.lastChild.textContent === item.answer) x.classList.add("right");
          });
          if (ok) { right++; fb.className = "rv-feedback good"; fb.textContent = "✓ Correct! " + item.why; }
          else { missed.push(item); b.classList.add("wrong"); fb.className = "rv-feedback bad"; fb.textContent = "Not quite. The answer is \"" + item.answer + ".\" " + item.why; }
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
      var kind = $("#pq-kind").value;
      var n = $("#pq-length").value === "all" ? 0 : 10;
      begin(build(kind, n));
    }
    $("#pq-start").addEventListener("click", startFromPicker);
    startFromPicker();
  })();

  /* ---------- Matching ---------- */
  (function () {
    var wordsCol = $("#mt-words"), defsCol = $("#mt-defs"), status = $("#mt-status");
    var picked = null, matched = 0, misses = 0, round;

    function deal() {
      round = shuffle(TERMS).slice(0, 6);
      matched = 0; misses = 0; picked = null;
      wordsCol.innerHTML = ""; defsCol.innerHTML = "";
      status.textContent = "Tap a word, then tap its meaning.";
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
      status.textContent = "Now tap the meaning of \"" + w.textContent + ".\"";
    }
    function choose(d) {
      if (!picked) { status.textContent = "Pick a word on the left first."; return; }
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
  (function () {
    var wrap = $("#sa-list");
    SHORT.forEach(function (s, i) {
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
})();
