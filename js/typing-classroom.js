/* Typing Classroom page logic: assignments list, single assignment, speed test, hub counts.
   Each page has data-tc="hub" | "assignments" | "assignment" | "speed". Nothing is sent anywhere;
   only the speed test keeps a personal best on this device (localStorage). */
(function () {
  "use strict";
  var page = document.body.getAttribute("data-tc");
  var LIST = window.TYPING_ASSIGNMENTS || [];
  var BEST_KEY = "typing-speedtest-best";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function readBest() {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || "null"); } catch (e) { return null; }
  }
  function stamp() {
    var d = new Date();
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) + " at " +
      d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  function resultCard(st, opts) {
    var box = el("div", "tc-result");
    box.setAttribute("role", "status");
    box.appendChild(el("h3", null, opts.title));
    var nums = el("div", "tc-nums");
    nums.innerHTML = "<span><b>" + st.wpm + "</b> WPM</span><span><b>" + st.accuracy + "%</b> accuracy</span>" +
      "<span><b>" + TypingBox.fmtTime(st.seconds) + "</b> time</span>";
    box.appendChild(nums);
    if (opts.goal) {
      var g = el("p");
      if (opts.goal.wpm) g.appendChild(el("span", "tc-goal " + (st.wpm >= opts.goal.wpm ? "met" : "miss"), (st.wpm >= opts.goal.wpm ? "✓ " : "✗ ") + "Goal: " + opts.goal.wpm + " WPM"));
      if (opts.goal.accuracy) g.appendChild(el("span", "tc-goal " + (st.accuracy >= opts.goal.accuracy ? "met" : "miss"), (st.accuracy >= opts.goal.accuracy ? "✓ " : "✗ ") + "Goal: " + opts.goal.accuracy + "% accuracy"));
      box.appendChild(g);
    }
    if (opts.extra) box.appendChild(el("p", null, opts.extra));
    box.appendChild(el("p", "tc-stamp", "Finished " + stamp() + (opts.note ? " • " + opts.note : "")));
    var row = el("div", "rv-row rv-center");
    var again = el("button", "btn", "Try again");
    again.type = "button";
    again.addEventListener("click", opts.again);
    row.appendChild(again);
    if (opts.back) {
      var b = el("a", "btn ghost", opts.back[0]);
      b.href = opts.back[1];
      row.appendChild(b);
    }
    box.appendChild(row);
    return box;
  }

  /* ---------- Hub ---------- */
  if (page === "hub") {
    var cur = LIST.filter(function (a) { return a.status === "current"; }).length;
    var c = document.getElementById("tc-assign-count");
    if (c) c.textContent = cur ? cur + " current" : "Practice open";
    var best = readBest(), b = document.getElementById("tc-best");
    if (b && best) { b.textContent = "Your best: " + best.wpm + " WPM"; b.hidden = false; }
  }

  /* ---------- Assignments list ---------- */
  if (page === "assignments") {
    var groups = { current: "tc-current", practice: "tc-practice", past: "tc-past" };
    Object.keys(groups).forEach(function (status) {
      var ul = document.getElementById(groups[status]);
      var items = LIST.filter(function (a) { return a.status === status; });
      if (!items.length) {
        var empty = el("li", "tc-empty", status === "current" ? "No assignments right now. Mr. Watford will post them here." : "Nothing here yet.");
        ul.appendChild(empty);
        if (status === "past") ul.closest("section").hidden = true;
        return;
      }
      items.forEach(function (a) {
        var li = el("li", "tc-item " + status);
        var info = el("div");
        var h = el("h3");
        h.appendChild(el("span", "tc-tag " + (status === "current" ? "due" : status), status === "current" ? (a.due ? "Due " + a.due : "Current") : status === "practice" ? "Practice" : "Past"));
        h.appendChild(document.createTextNode(a.title));
        info.appendChild(h);
        var bits = [];
        bits.push(a.seconds ? TypingBox.fmtTime(a.seconds) + " timed" : "Type the whole passage");
        if (a.goal && a.goal.wpm) bits.push("goal " + a.goal.wpm + " WPM");
        if (a.goal && a.goal.accuracy) bits.push("goal " + a.goal.accuracy + "% accuracy");
        info.appendChild(el("p", null, bits.join(" • ")));
        li.appendChild(info);
        var go = el("a", "btn small", status === "past" ? "Open" : "Start →");
        go.href = "assignment.html#" + a.id;
        li.appendChild(go);
        ul.appendChild(li);
      });
    });
  }

  /* ---------- One assignment ---------- */
  if (page === "assignment") {
    var show = function () {
      var id = location.hash.slice(1);
      var a = LIST.filter(function (x) { return x.id === id; })[0];
      var titleEl = document.getElementById("tc-a-title"), dirEl = document.getElementById("tc-a-directions");
      var boxEl = document.getElementById("tc-a-box"), resEl = document.getElementById("tc-a-result");
      var tagEl = document.getElementById("tc-a-tag");
      resEl.innerHTML = "";
      if (!a) {
        titleEl.textContent = "Assignment not found";
        dirEl.textContent = "This assignment may have been removed. Go back to the assignments list.";
        boxEl.innerHTML = "";
        tagEl.hidden = true;
        return;
      }
      document.title = a.title + " | Typing Classroom | Mr. Watford";
      titleEl.textContent = a.title;
      tagEl.hidden = false;
      tagEl.className = "tc-tag " + (a.status === "current" ? "due" : a.status);
      tagEl.textContent = a.status === "current" ? (a.due ? "Due " + a.due : "Current") : a.status === "practice" ? "Practice" : "Past assignment";
      dirEl.textContent = a.directions || "";
      var start = function () {
        resEl.innerHTML = "";
        var tb = TypingBox.create(boxEl, {
          text: a.text, seconds: a.seconds,
          onFinish: function (st) {
            var full = st.complete ? "" : "Time ran out at " + Math.floor(st.typed / st.total * 100) + "% of the passage.";
            resEl.appendChild(resultCard(st, {
              title: "🎉 " + a.title + " finished!",
              goal: a.goal, extra: full, note: "Show Mr. Watford this screen",
              again: start, back: ["All assignments", "assignments.html"]
            }));
            resEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
        tb.focus();
      };
      start();
    };
    window.addEventListener("hashchange", show);
    show();
  }

  /* ---------- Speed test ---------- */
  if (page === "speed") {
    var PASSAGES = [
      "Every morning the baker opens the shop before the sun comes up. She mixes flour, water, and a pinch of salt, then lets the dough rest while the ovens warm. By the time the first customers arrive, the shelves are full of warm bread and the whole street smells wonderful. She says the secret is patience, because good bread cannot be rushed.",
      "A lighthouse keeper once lived on a rocky island far from town. Each night he climbed the winding stairs, cleaned the glass, and lit the great lamp. Ships passing in the dark watched for its steady beam and steered safely around the rocks. He rarely met the sailors he helped, but he knew his small job kept many people safe.",
      "Our class planted a garden behind the school this spring. We measured the beds, mixed in good soil, and planted rows of beans, carrots, and sunflowers. Every week someone checked for weeds and watered the plants. By the end of the year the sunflowers were taller than our teacher, and we shared baskets of beans with families.",
      "The hiking trail started near a quiet creek and climbed slowly up the side of the mountain. Halfway up, we stopped to rest on a flat rock and looked out over the valley below. Hawks circled in the wind and a deer watched us from the trees. When we finally reached the top, the view made every tired step worth it.",
      "Learning to type well takes the same kind of practice as learning an instrument. At first your fingers feel slow and clumsy, and you want to look down at the keys. If you keep your eyes on the screen and trust the home row, your hands slowly learn where every letter lives. Soon you will type without even thinking about it.",
      "The county fair comes to town every fall. Farmers bring their best pumpkins, and kids show the goats and rabbits they raised all year. There are pie contests, tractor pulls, and a Ferris wheel that lights up the night sky. Our family always ends the evening sharing a bag of kettle corn while we watch the fireworks.",
      "Bees are some of the hardest workers in creation. A single honeybee may visit hundreds of flowers in one trip, carrying pollen from plant to plant. Back at the hive, the bees work together to build wax combs, care for the young, and turn nectar into honey. Without them, many of the fruits and vegetables we enjoy would be hard to grow.",
      "When the storm knocked out the power, our whole family gathered in the living room with flashlights and blankets. Dad told stories about growing up on the farm, and my little sister fell asleep halfway through a board game. The lights came back on the next morning, but we all agreed it was one of the best nights we had spent together."
    ];
    var seconds = 60, lastIdx = -1;
    var boxEl = document.getElementById("st-box"), resEl = document.getElementById("st-result");
    var bestEl = document.getElementById("st-best");
    var paintBest = function () {
      var best = readBest();
      bestEl.textContent = best ? "Your best on this device: " + best.wpm + " WPM with " + best.accuracy + "% accuracy (" + best.date + ")" : "No best score yet. Take the test to set one!";
    };
    var start = function () {
      resEl.innerHTML = "";
      var i;
      do { i = Math.floor(Math.random() * PASSAGES.length); } while (i === lastIdx && PASSAGES.length > 1);
      lastIdx = i;
      var tb = TypingBox.create(boxEl, {
        text: PASSAGES[i], seconds: seconds,
        onFinish: function (st) {
          // Score a full-length test only; finishing the passage early still counts.
          var best = readBest(), extra = "";
          if (st.accuracy < 80) extra = "Accuracy under 80% doesn't count as a new best. Slow down a little and aim for clean typing!";
          else if (!best || st.wpm > best.wpm) {
            extra = best ? "🏆 New personal best! (Old best: " + best.wpm + " WPM)" : "🏆 That's your first personal best!";
            try { localStorage.setItem(BEST_KEY, JSON.stringify({ wpm: st.wpm, accuracy: st.accuracy, date: new Date().toLocaleDateString() })); } catch (e) {}
          } else extra = "Your best is " + best.wpm + " WPM. Keep practicing!";
          paintBest();
          resEl.appendChild(resultCard(st, { title: "⏱️ Time!", extra: extra, again: start, back: ["Typing Classroom", "index.html"] }));
          resEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
      tb.focus();
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-seconds]"), function (b) {
      b.addEventListener("click", function () {
        seconds = +b.getAttribute("data-seconds");
        Array.prototype.forEach.call(document.querySelectorAll("[data-seconds]"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); x.classList.toggle("ghost", x !== b); });
        start();
      });
    });
    document.getElementById("st-reset").addEventListener("click", function () {
      if (!confirm("Erase your best score on this device?")) return;
      try { localStorage.removeItem(BEST_KEY); } catch (e) {}
      paintBest();
    });
    paintBest();
    start();
  }
})();
