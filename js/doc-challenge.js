/* Google Docs formatting challenge pages (typing/sea-otter-formatting.html).
   - Builds the "Before", "After", and "Watch it change" document previews from <template id="dc-doc">.
   - Step N turns on classes u1..uN on the preview; anything with data-s="N" gets outlined as "what changed".
   - Ctrl/Cmd switch and check marks are remembered in this browser only. Nothing is sent anywhere. */
(function () {
  var tpl = document.getElementById("dc-doc");
  if (!tpl) return;
  var KEY = "dc-" + (location.pathname.split("/").pop().replace(".html", "") || "doc");
  var LABELS = [
    "Start: the plain practice document",
    "Step 1: pasted into your own doc and renamed",
    "Step 2: title is size 26, bold, a dark color, and centered",
    "Step 3: your name added in italics, centered, with a line under it",
    "Step 4: body text is Verdana 12 with 1.5 line spacing",
    "Step 5: bold, italic, underline, and yellow highlight",
    "Step 6: section titles are Heading 2, same color as the title",
    "Step 7: the five fun facts are a bulleted list",
    "Step 8: the MOVE ME fact is cut and pasted as bullet six",
    "Step 9: the clam steps are a numbered list 1–6",
    "Step 10: picture added, about half the page wide, centered"
  ];

  function store(name, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem(KEY + "-" + name));
      localStorage.setItem(KEY + "-" + name, JSON.stringify(value));
    } catch (e) { return null; }
  }

  /* ---------- Document previews ---------- */
  function setStep(win, n, outline) {
    var paper = win.querySelector(".dc-window");
    var cls = "dc-window";
    for (var i = 1; i <= n; i++) cls += " u" + i;
    paper.className = cls;
    Array.prototype.forEach.call(paper.querySelectorAll("[data-s]"), function (el) {
      el.classList.toggle("dc-new", !!outline && n > 0 && el.getAttribute("data-s") === String(n));
    });
  }
  var slots = document.querySelectorAll(".dc-slot");
  var live = null;
  Array.prototype.forEach.call(slots, function (slot) {
    slot.appendChild(tpl.content.cloneNode(true));
    var which = slot.getAttribute("data-doc");
    if (which === "live") live = slot;
    else setStep(slot, Number(which), false);
  });

  var range = document.getElementById("dc-range");
  var label = document.getElementById("dc-live-label");
  function show(n) {
    n = Math.max(0, Math.min(10, n));
    range.value = n;
    label.textContent = LABELS[n];
    setStep(live, n, true);
    Array.prototype.forEach.call(document.querySelectorAll(".dc-step"), function (s) {
      s.classList.toggle("is-viewing", s.getAttribute("data-step") === String(n));
    });
    // Scroll the changed part into view inside the preview box.
    var changed = live.querySelector(".dc-new");
    var box = live;
    if (changed && box.scrollHeight > box.clientHeight + 4) {
      var top = changed.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 30;
      box.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    } else if (n === 0) {
      box.scrollTop = 0;
    }
  }
  if (live) {
    range.addEventListener("input", function () { show(Number(range.value)); });
    document.getElementById("dc-prev").addEventListener("click", function () { show(Number(range.value) - 1); });
    document.getElementById("dc-next").addEventListener("click", function () { show(Number(range.value) + 1); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-show]"), function (b) {
      b.addEventListener("click", function () {
        show(Number(b.getAttribute("data-show")));
        // On narrow screens the preview isn't beside the steps, so jump to it.
        if (window.matchMedia("(max-width: 900px)").matches) {
          document.getElementById("dc-live").scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
    show(0);
  }

  /* ---------- Ctrl / Cmd switch ---------- */
  function setOS(os) {
    Array.prototype.forEach.call(document.querySelectorAll(".k-mod"), function (k) { k.textContent = os === "mac" ? "Cmd" : "Ctrl"; });
    Array.prototype.forEach.call(document.querySelectorAll("[data-os]"), function (b) {
      var on = b.getAttribute("data-os") === os;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("ghost", !on);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-os]"), function (b) {
    b.addEventListener("click", function () { setOS(b.getAttribute("data-os")); store("os", b.getAttribute("data-os")); });
  });
  var savedOS = store("os");
  setOS(savedOS || (/Mac/.test(navigator.platform || "") && !/CrOS/.test(navigator.userAgent) ? "mac" : "pc"));

  /* ---------- Check marks + progress ---------- */
  var boxes = document.querySelectorAll("[data-done]");
  var done = store("done") || [];
  function paint() {
    var count = 0;
    Array.prototype.forEach.call(boxes, function (b) {
      if (b.checked) count++;
      b.closest(".dc-step").classList.toggle("is-done", b.checked);
    });
    document.getElementById("dc-count").textContent = count;
    document.getElementById("dc-bar-fill").style.width = (count * 10) + "%";
    document.getElementById("dc-progress").classList.toggle("all-done", count === boxes.length);
  }
  Array.prototype.forEach.call(boxes, function (b) {
    b.checked = done.indexOf(b.getAttribute("data-done")) !== -1;
    b.addEventListener("change", function () {
      var list = [];
      Array.prototype.forEach.call(boxes, function (x) { if (x.checked) list.push(x.getAttribute("data-done")); });
      store("done", list);
      paint();
    });
  });
  document.getElementById("dc-reset").addEventListener("click", function () {
    Array.prototype.forEach.call(boxes, function (b) { b.checked = false; });
    store("done", []);
    paint();
  });
  paint();
})();
