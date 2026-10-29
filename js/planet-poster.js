/* =========================================================
   Planet Research Poster Project (science/planet-poster-project.html)
   1. Draws the little planet pictures and the poster examples' pieces.
   2. Final checklist (checks stay in this browser only).
   3. Print buttons: directions, organizer, checklist, examples.
   Nothing here saves or sends any student information.
   ========================================================= */

(function () {
  /* ---------- 1. Planet drawings ----------
     Each planet is drawn in a 120 × 100 box with the planet centered at (60, 50). */
  let uid = 0;
  const ORDER = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
  const NAMES = { mercury: "Mercury", venus: "Venus", earth: "Earth", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune" };

  const DESIGNS = {
    mercury: { base: "#9a9a9a", inside:
      '<circle cx="44" cy="38" r="8" fill="#7f7f7f"/><circle cx="72" cy="60" r="11" fill="#848484"/><circle cx="58" cy="76" r="5" fill="#7a7a7a"/>' +
      '<circle cx="78" cy="32" r="4" fill="#b3b3b3"/><circle cx="40" cy="62" r="5" fill="#b0b0b0"/><circle cx="62" cy="24" r="3" fill="#7d7d7d"/>' },
    venus: { base: "#e8d3a0", inside:
      '<path d="M18 40c20-8 50 6 84-4M16 58c26 8 56-8 88 2M26 74c22 4 44-6 70 0" fill="none" stroke="#d6bb7e" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M24 30c18-6 40 2 70-4" fill="none" stroke="#f4e8c6" stroke-width="5" stroke-linecap="round"/>' },
    earth: { base: "#2f6fc4", inside:
      '<path d="M34 24c10-4 18 4 14 12s4 12-4 18-16-2-18-10 0-16 8-20zM62 50c8-6 22-2 24 8s-6 20-16 18-14-18-8-26zM70 18c6 0 12 4 10 8s-10 2-10-8z" fill="#4f9a4a"/>' +
      '<path d="M22 44c10-2 18 2 26-2M58 34c12 2 22-2 32 2M36 78c12-4 24 0 34-4" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>' },
    mars: { base: "#c1440e", inside:
      '<path d="M26 52c10-6 20 2 30-4s18 4 30-2M34 68c8 2 18-4 26 0" fill="none" stroke="#8a3214" stroke-width="7" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="13" rx="16" ry="5" fill="#f4efe9"/><circle cx="76" cy="36" r="4" fill="#a63a10"/>' },
    jupiter: { base: "#d9b48a", inside:
      '<rect x="0" y="22" width="120" height="8" fill="#b98557"/><rect x="0" y="34" width="120" height="6" fill="#efe0c8"/>' +
      '<rect x="0" y="44" width="120" height="9" fill="#a8693f"/><rect x="0" y="58" width="120" height="6" fill="#efe0c8"/>' +
      '<rect x="0" y="68" width="120" height="8" fill="#b98557"/><ellipse cx="74" cy="62" rx="9" ry="5" fill="#b5452c"/>' },
    saturn: { base: "#e3c98f", ring: true, inside:
      '<rect x="0" y="34" width="120" height="6" fill="#d1b06b"/><rect x="0" y="46" width="120" height="5" fill="#f0e2b6"/><rect x="0" y="58" width="120" height="6" fill="#d1b06b"/>' },
    uranus: { base: "#9fd9dc", inside:
      '<rect x="0" y="40" width="120" height="10" fill="#b4e5e7" opacity=".8"/>' },
    neptune: { base: "#3b62c9", inside:
      '<rect x="0" y="30" width="120" height="6" fill="#2f50a8"/><rect x="0" y="62" width="120" height="5" fill="#2f50a8"/>' +
      '<ellipse cx="46" cy="50" rx="8" ry="5" fill="#213d85"/><path d="M58 44c8-2 14 0 20-2" stroke="#e8f1ff" stroke-width="3" stroke-linecap="round" opacity=".8"/>' }
  };

  function planetSVG(key, label) {
    const d = DESIGNS[key];
    const id = "pp" + (uid += 1);
    const r = d.ring ? 30 : 40;   // Saturn is drawn a little smaller to fit its rings
    const scale = r / 40;
    const back = d.ring ? '<ellipse cx="60" cy="50" rx="56" ry="13" fill="none" stroke="#c9b27a" stroke-width="5"/>' : "";
    const front = d.ring ? '<path d="M4 50a56 13 0 0 0 112 0" fill="none" stroke="#e9d9a8" stroke-width="5"/>' : "";
    return (
      // Planets without rings are cropped close so they fill their space
      '<svg viewBox="' + (d.ring ? "0 0 120 100" : "18 8 84 84") + '" ' + (label ? 'role="img" aria-label="' + label + '"' : 'aria-hidden="true"') + ">" +
        "<defs>" +
          '<clipPath id="' + id + 'c"><circle cx="60" cy="50" r="40"/></clipPath>' +
          '<radialGradient id="' + id + 'g" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient>' +
        "</defs>" + back +
        '<g transform="translate(' + (60 - 60 * scale) + " " + (50 - 50 * scale) + ") scale(" + scale + ')">' +
          '<circle cx="60" cy="50" r="40" fill="' + d.base + '"/>' +
          '<g clip-path="url(#' + id + 'c)">' + d.inside + "</g>" +
          '<circle cx="60" cy="50" r="40" fill="url(#' + id + 'g)"/>' +
        "</g>" + front +
      "</svg>"
    );
  }

  document.querySelectorAll("[data-planet-art]").forEach(function (el) {
    const key = el.dataset.planetArt;
    // The big poster-example planets get a description; small icons sit next to the planet's name
    el.innerHTML = planetSVG(key, el.classList.contains("pm-planet") ? "Sample artwork of " + NAMES[key] : "");
  });

  /* Solar-system order strip: the Sun, then all eight planets, with one circled */
  function orderSVG(pick) {
    const sizes = [5, 7, 7, 6, 13, 11, 9, 9];   // only so the dots look different; NOT to scale
    const colors = ["#9a9a9a", "#e8d3a0", "#2f6fc4", "#c1440e", "#d9b48a", "#e3c98f", "#9fd9dc", "#3b62c9"];
    const short = ["Me", "V", "E", "Ma", "J", "S", "U", "N"];
    let x = 34;
    let dots = "";
    ORDER.forEach(function (p, i) {
      const cx = x + sizes[i];
      if (i === pick - 1) {
        dots += '<circle cx="' + cx + '" cy="30" r="' + (sizes[i] + 5) + '" fill="none" stroke="#f5c431" stroke-width="2.5" stroke-dasharray="4 2"/>';
      }
      dots += '<circle cx="' + cx + '" cy="30" r="' + sizes[i] + '" fill="' + colors[i] + '"/>';
      if (p === "saturn") dots += '<ellipse cx="' + cx + '" cy="30" rx="' + (sizes[i] + 5) + '" ry="3" fill="none" stroke="#c9b27a" stroke-width="1.5"/>';
      dots += '<text x="' + cx + '" y="56" text-anchor="middle" class="o-lbl' + (i === pick - 1 ? " o-pick" : "") + '">' + short[i] + "</text>";
      x = cx + sizes[i] + 9;
    });
    return (
      '<svg viewBox="0 0 230 74" role="img" aria-label="Solar system order diagram: the Sun, then Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune, with ' + NAMES[ORDER[pick - 1]] + ' circled. Order only, not to scale.">' +
        '<path d="M0 0a30 30 0 0 1 0 60" fill="#f5c431"/><text x="4" y="34" class="o-lbl">Sun</text>' + dots +
        '<text x="115" y="70" text-anchor="middle" class="o-note">Order only—not to scale</text>' +
      "</svg>"
    );
  }
  document.querySelectorAll("[data-order]").forEach(function (el) { el.innerHTML = orderSVG(Number(el.dataset.order)); });

  /* Fact labels with blank lines for the poster examples */
  const FACT_LABELS = ["Position", "Planet type", "Diameter", "Avg. distance from Sun", "Rotation period", "Year length",
    "Temperature", "Atmosphere", "Features", "Moons & rings", "Exploration", "Compared with Earth"];
  document.querySelectorAll(".pm-factlist").forEach(function (ul) {
    const range = ul.dataset.facts === "all" ? [0, 11] : ul.dataset.facts.split("-").map(Number);
    let html = "";
    for (let i = range[0]; i <= range[1]; i++) html += "<li><b>" + FACT_LABELS[i] + ":</b><i></i></li>";
    ul.innerHTML = html;
  });

  /* Writing lines (gray lines on the posters, and lines on the printed organizer) */
  function addLines(el, n, cls) {
    let html = "";
    for (let i = 0; i < n; i++) html += '<span class="' + cls + '"></span>';
    el.innerHTML = html;
  }
  document.querySelectorAll(".pm-lines").forEach(function (el) { addLines(el, Number(el.dataset.n), "pm-line"); });

  /* ---------- 2. Final checklist ----------
     Saved in this browser only (localStorage). Never sent anywhere. */
  const KEY = "planet-poster-checklist";
  const boxes = Array.from(document.querySelectorAll("#pp-checks input"));
  const progress = document.getElementById("pp-progress");
  let canSave = true;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { canSave = false; }
  if (!canSave) {
    document.getElementById("pp-save-note").textContent =
      "Check off each item as you finish. This browser can’t save your checks, so they will clear when you leave the page. Nothing is sent to Mr. Watford.";
  }

  function update() {
    const done = boxes.filter(function (b) { return b.checked; }).length;
    progress.textContent = done === boxes.length
      ? "All " + boxes.length + " items checked. Great work! 🌟"
      : done + " of " + boxes.length + " items checked";
    boxes.forEach(function (b) { b.closest("li").classList.toggle("done", b.checked); });
  }
  function save() {
    if (!canSave) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; })));
    } catch (e) { /* storage full or blocked: the checks still work for this visit */ }
  }
  boxes.forEach(function (b) {
    b.checked = saved.indexOf(b.value) !== -1;
    b.addEventListener("change", function () { save(); update(); });
  });
  document.getElementById("pp-clear").addEventListener("click", function () {
    boxes.forEach(function (b) { b.checked = false; });
    save();
    update();
  });
  update();

  /* ---------- 3. Printing ----------
     Each button copies just the part it prints into #print-area (style.css hides everything else). */
  const printArea = document.getElementById("print-area");

  function cloneAll(selector) {
    return Array.from(document.querySelectorAll(selector)).map(function (el) {
      const copy = el.cloneNode(true);
      copy.removeAttribute("id");
      copy.querySelectorAll("[id]").forEach(function (x) { if (!x.closest("svg")) x.removeAttribute("id"); });
      copy.querySelectorAll("details").forEach(function (d) { d.open = true; });   // print every artwork idea
      return copy.outerHTML;
    }).join("")
      // Planet drawings use ids for their shading; give the printed copies their own
      .replace(/(id="|url\(#)(pp\d+)/g, "$1$2p");
  }

  function organizerHTML() {
    const holder = document.createElement("div");
    holder.appendChild(document.getElementById("organizer-template").content.cloneNode(true));
    holder.querySelectorAll("[data-lines]").forEach(function (el) { addLines(el, Number(el.dataset.lines), "w-line"); });
    return holder.innerHTML;
  }

  // The short 2-page assignment sheet (the full directions stay on the web page)
  function sheetHTML() {
    return document.getElementById("sheet-template").innerHTML;
  }

  const PARTS = {
    directions: sheetHTML,
    organizer: organizerHTML,
    checklist: function () {
      return '<p class="print-name">Name: ______________________________ &nbsp; Class: __________ &nbsp; Planet: ________________</p>' +
        cloneAll(".pp-print-checklist");
    },
    examples: function () {
      return '<h1 class="print-title">Planet Poster Layout Examples</h1>' + cloneAll(".pp-print-examples");
    }
  };

  document.querySelectorAll("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      printArea.innerHTML =
        '<p class="print-site">6th Grade Science • Planet Research Poster Project • Mr. Watford</p>' +
        '<div class="pp-printing pp-print-' + btn.dataset.print + '-only">' + PARTS[btn.dataset.print]() + "</div>";
      document.body.classList.add("printing");
      window.print();
    });
  });
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("printing");
    printArea.innerHTML = "";
  });
})();
