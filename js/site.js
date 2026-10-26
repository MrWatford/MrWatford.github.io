/* =========================================================
   Mr. Watford's Website — shared helpers
   1. Header shadow when the page scrolls.
   2. The interactive classroom on the home page.
   3. Mr. Watford's corner guide (tips + reactions).
   4. YouTube videos: paste a link, it becomes a player.
   5. Practice problems: check answers instantly.
   Nothing here saves or sends any student information.
   ========================================================= */

// Where the site's main folder is, worked out from this script's own address.
// (Lets pages in sub-folders find images without extra setup.)
const SITE_ROOT = document.currentScript.src.replace(/js\/site\.js.*$/, "");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Header shadow ---------- */
const header = document.querySelector(".site-header");
if (header) {
  const onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* Types text into a caption one letter at a time, like the captions in the videos.
   Screen readers get the whole sentence at once from a hidden copy. */
function makeSpeaker(textEl, liveEl, onTalk) {
  let timer = null;
  return function say(text) {
    clearInterval(timer);
    if (liveEl) liveEl.textContent = text;
    if (reduceMotion) { textEl.textContent = text; return; }
    let i = 0;
    textEl.textContent = "";
    if (onTalk) onTalk(true);
    timer = setInterval(function () {
      i += 1;
      textEl.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(timer);
        if (onTalk) onTalk(false);
      }
    }, 22);
  };
}

/* ---------- 2. The interactive classroom (home page) ---------- */
const classroom = document.querySelector(".classroom-wrap");
if (classroom) {
  const teacher = classroom.querySelector(".teacher");
  const say = makeSpeaker(
    classroom.querySelector(".caption-text"),
    classroom.querySelector(".caption-live"),
    function (talking) { teacher.classList.toggle("talking", talking); }
  );

  // Things Mr. Watford says when you click him. Add or change lines here!
  const lines = [
    "Welcome to my classroom! Click the whiteboard, the computer, or the volcano to get started.",
    "“Whatsoever ye do, do it heartily, as to the Lord.” That's Colossians 3:23!",
    "Typing tip: keep your pointer fingers on the bumps on F and J.",
    "In science, safety comes first. Goggles on!",
    "Stuck on a math problem? Every practice page has hints. Give it a try!"
  ];
  let lineIndex = 0;

  setTimeout(function () { say(lines[0]); }, 500);

  teacher.addEventListener("click", function () {
    lineIndex = (lineIndex + 1) % lines.length;
    say(lines[lineIndex]);
  });

  // Hovering (or tabbing to) an object: Mr. Watford leans toward it and explains it.
  classroom.querySelectorAll(".hotspot").forEach(function (spot) {
    const show = function () {
      teacher.classList.remove("lean-left", "lean-right");
      teacher.classList.add(spot.dataset.side === "left" ? "lean-left" : "lean-right");
      say(spot.dataset.say);
    };
    const hide = function () { teacher.classList.remove("lean-left", "lean-right"); };
    spot.addEventListener("mouseenter", show);
    spot.addEventListener("focus", show);
    spot.addEventListener("mouseleave", hide);
    spot.addEventListener("blur", hide);
  });

  // The classroom clock shows the real time.
  const hourHand = classroom.querySelector(".clock .hour");
  const minuteHand = classroom.querySelector(".clock .minute");
  function setClock() {
    const now = new Date();
    const m = now.getMinutes();
    const h = (now.getHours() % 12) + m / 60;
    if (hourHand) hourHand.style.transform = "rotate(" + h * 30 + "deg)";
    if (minuteHand) minuteHand.style.transform = "rotate(" + m * 6 + "deg)";
  }
  setClock();
  setInterval(setClock, 30000);
}

/* ---------- 3. Mr. Watford's corner guide ----------
   On any page, add tips to the <body> tag, separated by |
     <body data-tips="First tip.|Second tip.">
   He pops up in the corner once you scroll past the top picture.
   Practice problems also make him react (see section 5). */
const guide = (function () {
  const tips = (document.body.dataset.tips || "").split("|").filter(Boolean);
  if (!tips.length && !document.querySelector(".practice-list")) return null;

  const box = document.createElement("div");
  box.className = "guide away";
  box.innerHTML =
    '<div class="guide-bubble caption" hidden>' +
      '<span class="caption-tag">Mr. Watford</span>' +
      '<span class="guide-text" aria-hidden="true"></span>' +
      '<span class="sr-only" aria-live="polite"></span>' +
      (tips.length > 1 ? '<button type="button" class="guide-next">Another tip →</button>' : "") +
      '<button type="button" class="guide-close" aria-label="Close">×</button>' +
    "</div>" +
    '<button type="button" class="guide-btn" aria-label="Get a tip from Mr. Watford">' +
      '<img src="' + SITE_ROOT + 'images/mr-watford/face.png" alt="">' +
    "</button>";
  document.body.appendChild(box);

  const bubble = box.querySelector(".guide-bubble");
  const say = makeSpeaker(box.querySelector(".guide-text"), box.querySelector(".sr-only"));
  let tipIndex = 0;
  let hideTimer = null;
  let greeted = false;

  function open(text, seconds) {
    bubble.hidden = false;
    say(text);
    clearTimeout(hideTimer);
    if (seconds) hideTimer = setTimeout(function () { bubble.hidden = true; }, seconds * 1000);
  }
  function showTip() { if (tips.length) open(tips[tipIndex]); }

  box.querySelector(".guide-btn").addEventListener("click", function () {
    if (bubble.hidden) showTip();
    else bubble.hidden = true;
  });
  box.querySelector(".guide-close").addEventListener("click", function () { bubble.hidden = true; });
  const next = box.querySelector(".guide-next");
  if (next) next.addEventListener("click", function () {
    tipIndex = (tipIndex + 1) % tips.length;
    showTip();
  });

  // Stay hidden while the big Mr. Watford at the top of the page is on screen.
  const bigTeacher = document.querySelector(".stage, .classroom");
  function arrive() {
    box.classList.remove("away");
    if (!greeted && tips.length) { greeted = true; open(tips[0], 8); }
  }
  if (bigTeacher && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { box.classList.add("away"); bubble.hidden = true; }
      else arrive();
    }).observe(bigTeacher);
  } else {
    setTimeout(arrive, 1200);
  }

  function animate(name) {
    box.classList.remove("cheer", "think");
    void box.offsetWidth; // restart the animation
    box.classList.add(name);
  }

  return {
    react: function (kind) {
      greeted = true; // a reaction counts as his hello, so the first tip won't interrupt it
      box.classList.remove("away");
      if (kind === "correct") {
        animate("cheer");
        open(["Great job!", "You got it!", "That's right. Keep going!", "Nice work!"][Math.floor(Math.random() * 4)], 3);
      } else if (kind === "wrong") {
        animate("think");
        open("Not quite. Read the hint and try again. You can do it!", 4);
      } else if (kind === "all") {
        animate("cheer");
        open("Every problem correct! I'm proud of you! 🎉", 6);
      }
    }
  };
})();

function confetti() {
  if (reduceMotion) return;
  const colors = ["#f5c431", "#2e7d4a", "#2f6fc4", "#c6362c", "#43a267"];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = Math.random() * 0.6 + "s";
    piece.style.animationDuration = 2 + Math.random() * 1.5 + "s";
    document.body.appendChild(piece);
    setTimeout(function () { piece.remove(); }, 4500);
  }
}

/* ---------- 4. YouTube videos ----------
   In a page, write:
     <div class="video" data-youtube="PASTE YOUTUBE LINK HERE"></div>
   Any normal YouTube link works (youtu.be/..., youtube.com/watch?v=..., shorts).
   If the link is left blank, a "video coming soon" box shows instead.
   Optional: data-poster="../images/…jpg" shows that picture behind the "coming soon" message,
             and data-soon="Your message" changes the message. */
function getYouTubeId(link) {
  if (!link) return null;
  const match = link.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

document.querySelectorAll(".video[data-youtube]").forEach(function (box) {
  const id = getYouTubeId(box.dataset.youtube.trim());
  if (id) {
    const frame = document.createElement("iframe");
    // youtube-nocookie.com = YouTube's privacy-friendly player
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0";
    frame.title = box.dataset.title || "Demo video";
    frame.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.loading = "lazy";
    box.appendChild(frame);
  } else {
    const holder = document.createElement("div");
    holder.className = "video-placeholder wall";
    holder.innerHTML = '<div class="play"></div><span></span><small>Check back soon.</small>';
    holder.querySelector("span").textContent = box.dataset.soon || "Video coming soon!";
    if (box.dataset.poster) {
      holder.classList.add("has-poster");
      holder.style.setProperty("--poster", 'url("' + box.dataset.poster + '")');
    }
    box.appendChild(holder);
  }
});

/* ---------- 5. Practice problems ----------
   In a page, write one of these for each problem:
     <div class="problem" data-answer="-3">
       <span class="q">−8 + 5 =</span>
     </div>
   The answer box, Check button, and feedback are added automatically.
   Optional extras:
     data-answer="0.5|1/2"   → more than one accepted answer, separated by |
     data-hint="Think about the number line." → shows after a wrong try
     class="problem wide"    → stretches a long word problem across the full width
   Wrap all problems in <div class="practice-list"> and the score bar shows below it.
   If the page has a side menu with <div class="toc-score"></div>, the score shows there too. */

// Make answers comparable: ignore spaces, treat the fancy minus sign "−" like "-",
// and treat equal numbers as equal (so "-3", "-3.0", and "−3" all match).
function normalize(text) {
  const cleaned = String(text)
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .replace(/\+\/?-/g, "±") // "+-7" and "+/-7" mean ±7
    .replace(/^\+/, "")
    // money, percent, and degree signs, and commas in big numbers: "$1,200" → "1200", "25%" → "25"
    .replace(/^(-?)\$/, "$1")
    .replace(/(\d)[%°]$/, "$1")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    // points: "x=7,y=5", "(7,5)", and "7,5" all count the same
    .replace(/^\(?x=([^,()]+),y=([^,()]+)\)?$/, "($1,$2)")
    .replace(/^(-?[\d.\/]+),(-?[\d.\/]+)$/, "($1,$2)")
    // "x=5" counts the same as "5"; "≥" and ">=" match too
    .replace(/^[a-z]=(?=.)/, "")
    .replace(/>=/g, "≥").replace(/<=/g, "≤");
  if (cleaned !== "" && !isNaN(Number(cleaned))) return String(Number(cleaned));
  return cleaned;
}

const praise = ["Correct! 🎉", "Nice work! ✔", "You got it! ⭐", "Exactly right! ✔"];

document.querySelectorAll(".practice-list").forEach(function (list) {
  const problems = list.querySelectorAll(".problem");

  // Score bar under the problems
  const scoreBox = document.createElement("div");
  scoreBox.className = "score-box";
  scoreBox.innerHTML =
    '<span class="score-text" aria-live="polite"></span>' +
    '<div class="meter"><div class="meter-fill"></div></div>' +
    '<button type="button" class="btn small">Start over</button>';
  list.after(scoreBox);

  const tocScore = document.querySelector(".toc-score");

  function updateScore() {
    const right = list.querySelectorAll(".problem.correct").length;
    const percent = Math.round((right / problems.length) * 100) + "%";
    scoreBox.querySelector(".score-text").textContent =
      right === problems.length
        ? "All " + problems.length + " correct — great job! 🌟"
        : "Score: " + right + " of " + problems.length;
    scoreBox.querySelector(".meter-fill").style.width = percent;
    // The side menu shows the total for the whole page (a page can have several practice sets)
    if (tocScore) {
      const all = document.querySelectorAll(".practice-list .problem").length;
      const allRight = document.querySelectorAll(".practice-list .problem.correct").length;
      tocScore.textContent = allRight + " of " + all + " correct";
      const tocBar = document.querySelector(".toc .meter-fill");
      if (tocBar) tocBar.style.width = Math.round((allRight / all) * 100) + "%";
    }
    return right === problems.length;
  }

  scoreBox.querySelector("button").addEventListener("click", function () {
    problems.forEach(function (problem) {
      problem.classList.remove("correct", "wrong");
      problem.querySelector("input").value = "";
      problem.querySelector(".feedback").textContent = "";
    });
    updateScore();
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  problems.forEach(function (problem, index) {
    const accepted = problem.dataset.answer.split("|").map(normalize);
    const label = problem.querySelector(".q").textContent.trim();

    const num = document.createElement("span");
    num.className = "num";
    num.textContent = index + 1;
    problem.querySelector(".q").prepend(num);

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "text"; // keeps the minus key on phone keyboards
    input.autocomplete = "off";
    input.placeholder = "Your answer";
    input.setAttribute("aria-label", "Answer for problem " + (index + 1) + ": " + label);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn";
    button.textContent = "Check";

    const feedback = document.createElement("div");
    feedback.className = "feedback";
    feedback.setAttribute("aria-live", "polite");

    problem.append(input, button, feedback);

    function check() {
      if (input.value.trim() === "") {
        feedback.textContent = "Type an answer first.";
        return;
      }
      const wasCorrect = problem.classList.contains("correct");
      const isRight = accepted.includes(normalize(input.value));
      problem.classList.toggle("correct", isRight);
      problem.classList.toggle("wrong", !isRight);
      if (isRight) {
        feedback.textContent = praise[Math.floor(Math.random() * praise.length)];
      } else {
        feedback.textContent = "Not quite — try again." +
          (problem.dataset.hint ? " Hint: " + problem.dataset.hint : "");
      }
      const allDone = updateScore();
      // Mr. Watford reacts
      if (allDone && !wasCorrect) { confetti(); if (guide) guide.react("all"); }
      else if (guide) guide.react(isRight ? "correct" : "wrong");
    }

    button.addEventListener("click", check);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") check();
    });
  });

  updateScore();
});
