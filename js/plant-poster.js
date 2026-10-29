/* =========================================================
   Plant & Tree Research Poster Project (science/plant-poster-project.html)
   1. Draws the plant pictures, close-ups, and range maps.
   2. Fills in the poster examples' fact labels and writing lines.
   3. Final checklist (checks stay in this browser only).
   4. Print buttons: directions, organizer, checklist, examples.
   Nothing here saves or sends any student information.
   ========================================================= */

(function () {
  /* ---------- 1. Drawings ---------- */
  let uid = 0;

  // A tiny repeatable random-number maker, so rubbings look the same every visit
  function seeded(seed) {
    return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  }

  // A leaf outline with small teeth along the edge (tip at the top, base at the bottom)
  function toothedLeaf(cx, top, bottom, maxW, teeth) {
    const n = teeth * 2;
    const right = [];
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const w = maxW * Math.sin(Math.PI * Math.pow(t, 1.6)) * (i % 2 ? 1 : 0.88);
      right.push([cx + w, top + (bottom - top) * t]);
    }
    const left = right.slice().reverse().map(function (p) { return [2 * cx - p[0], p[1]]; });
    const pts = [[cx, top]].concat(right, [[cx, bottom - 6]], left);
    return "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L") + "Z";
  }

  function rubbing(kind) {
    const r = seeded(kind === "bark" ? 7 : 11);
    let s = "";
    for (let i = 0; i < 150; i++) {
      const x = 8 + r() * 84;
      const y = 6 + r() * 80;
      const len = 4 + r() * 10;
      s += '<path d="M' + x.toFixed(1) + " " + y.toFixed(1) + "l" + (r() * 4 - 2).toFixed(1) + " " + len.toFixed(1) + '"/>';
    }
    return s;
  }

  const SKY = '<rect width="160" height="110" fill="#cfe8f5"/><rect y="88" width="160" height="22" fill="#8cc46a"/>';

  const ART = {
    /* Whole plants */
    liveoak: { box: "0 0 160 110", svg: SKY +
      '<path d="M74 94c2-14 0-22-4-30M84 94c-1-12 2-22 8-28M76 74c-12-8-28-12-44-12M82 72c14-8 30-10 48-8" stroke="#5b3b22" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<path d="M70 96h20l-3-30h-14z" fill="#5b3b22"/>' +
      '<g fill="#2f6b2c"><ellipse cx="80" cy="44" rx="58" ry="22"/><ellipse cx="34" cy="56" rx="28" ry="14"/><ellipse cx="128" cy="56" rx="28" ry="14"/><ellipse cx="60" cy="32" rx="26" ry="14"/><ellipse cx="102" cy="32" rx="28" ry="14"/></g>' +
      '<g fill="#3f8a3a"><ellipse cx="62" cy="38" rx="16" ry="7"/><ellipse cx="104" cy="40" rx="18" ry="7"/><ellipse cx="38" cy="52" rx="12" ry="5"/><ellipse cx="124" cy="52" rx="12" ry="5"/></g>' },
    tuliptree: { box: "0 0 160 110", svg: SKY +
      '<path d="M76 98l2-62h4l2 62z" fill="#6e5440"/><path d="M80 66l-12-8M80 56l12-8" stroke="#6e5440" stroke-width="3"/>' +
      '<g fill="#3d7f34"><ellipse cx="80" cy="40" rx="26" ry="36"/><ellipse cx="68" cy="56" rx="16" ry="14"/><ellipse cx="92" cy="54" rx="16" ry="14"/></g>' +
      '<g fill="#58a14a"><ellipse cx="72" cy="28" rx="9" ry="12"/><ellipse cx="90" cy="40" rx="8" ry="10"/></g>' +
      '<g fill="#f2a33a"><circle cx="66" cy="34" r="2.2"/><circle cx="94" cy="26" r="2.2"/><circle cx="86" cy="58" r="2.2"/></g>' },
    sunflower: { box: "0 0 100 170", svg:
      '<path d="M50 168V34" stroke="#4e8a2e" stroke-width="5"/><path d="M50 100c10-10 18-14 26-14" stroke="#4e8a2e" stroke-width="3" fill="none"/>' +
      '<g fill="#5aa13a" stroke="#3c7424" stroke-width="1.2">' +
        '<path d="' + toothedLeaf(0, -2, 34, 13, 7) + '" transform="translate(50 130) rotate(-115)"/>' +
        '<path d="' + toothedLeaf(0, -2, 34, 13, 7) + '" transform="translate(50 112) rotate(112)"/>' +
        '<path d="' + toothedLeaf(0, -2, 28, 11, 6) + '" transform="translate(50 78) rotate(-110)"/>' +
        '<path d="' + toothedLeaf(0, -2, 28, 11, 6) + '" transform="translate(50 60) rotate(110)"/></g>' +
      '<g transform="translate(50 30)">' + head(26) + "</g>" +
      '<g transform="translate(80 84)">' + head(12) + "</g>" +
      '<rect x="20" y="164" width="60" height="6" rx="2" fill="#7a5a3a"/>' },

    /* Close-ups */
    "leaf-simple": { box: "0 0 100 100", svg:
      '<path d="M50 88C22 70 24 32 50 10c26 22 28 60 0 78z" fill="#4f8f3a" stroke="#2c5e22" stroke-width="2.5"/>' +
      '<path d="M50 98V14M50 30l-12 8M50 30l12 8M50 46l-15 9M50 46l15 9M50 62l-14 9M50 62l14 9" stroke="#2c5e22" stroke-width="2" fill="none"/>' },
    "leaf-heart": { box: "0 0 100 100", svg:
      '<path d="' + toothedLeaf(50, 8, 86, 36, 9) + '" fill="#5aa13a" stroke="#3c7424" stroke-width="2"/>' +
      '<path d="M50 98V16M50 70L28 56M50 70l22-14M50 50L34 38M50 50l16-12" stroke="#3c7424" stroke-width="2" fill="none"/>' },
    bark: { box: "0 0 100 100", svg:
      '<rect width="100" height="100" fill="#8a6a4d"/>' +
      '<g stroke="#4f3a28" stroke-width="5" fill="none" stroke-linecap="round"><path d="M12 0c4 20-4 40 2 60s-2 30 0 40M38 0c-4 24 6 40 0 62s4 26 0 38M64 0c4 18-6 36 0 56s-4 30 2 44M88 0c-4 22 4 44-2 64s2 24 0 36"/></g>' +
      '<g stroke="#a5866a" stroke-width="2"><path d="M22 18h8M50 40h8M76 70h6M24 74h8M52 86h6M78 22h6"/></g>' },
    acorn: { box: "0 0 100 100", svg:
      '<ellipse cx="50" cy="62" rx="20" ry="28" fill="#a56a2c"/><ellipse cx="44" cy="56" rx="5" ry="12" fill="#c58a4a"/>' +
      '<path d="M26 44c0-16 48-16 48 0 0 6-48 6-48 0z" fill="#6b4a2b"/><path d="M30 40l40 0M34 34h32M32 46h36" stroke="#4f351e" stroke-width="2"/>' +
      '<path d="M50 30v-10" stroke="#4f351e" stroke-width="4" stroke-linecap="round"/>' },
    flowerhead: { box: "0 0 100 100", svg: '<g transform="translate(50 50)">' + head(44, true) + "</g>" },
    seeds: { box: "0 0 100 100", svg:
      [[30, 40, -20], [62, 34, 15], [44, 70, 70], [72, 70, -40]].map(function (s) {
        return '<g transform="translate(' + s[0] + " " + s[1] + ") rotate(" + s[2] + ')">' +
          '<path d="M0-18c10 6 10 26 0 32-10-6-10-26 0-32z" fill="#3a3a3a"/>' +
          '<path d="M-3-12v22M3-12v22" stroke="#e6e1d3" stroke-width="1.6"/></g>';
      }).join("") },
    "pressed-tulip": { box: "0 0 100 100", svg:
      '<rect x="4" y="4" width="92" height="92" fill="#fffdf6"/>' +
      '<path d="M50 30L42 22C34 18 22 20 16 28L22 40C12 42 8 52 12 62L26 66C30 76 40 80 50 80 60 80 70 76 74 66L88 62C92 52 88 42 78 40L84 28C78 20 66 18 58 22z" fill="#9aa64a" stroke="#6b7330" stroke-width="2"/>' +
      '<path d="M50 94V30M50 46L24 32M50 46l26-14M50 60L18 54M50 60l32-6" stroke="#6b7330" stroke-width="1.8" fill="none"/>' +
      '<g fill="#e9e3c9" opacity=".9"><rect x="40" y="86" width="20" height="8" transform="rotate(-6 50 90)"/><rect x="8" y="22" width="16" height="7" transform="rotate(-30 16 25)"/><rect x="76" y="22" width="16" height="7" transform="rotate(30 84 25)"/></g>' },
    barkrub: { box: "0 0 100 100", svg:
      '<rect x="4" y="4" width="92" height="92" fill="#fffdf6"/><g stroke="#6d6258" stroke-width="3" stroke-linecap="round" opacity=".55">' + rubbing("bark") + "</g>" },
    leafrub: { box: "0 0 100 100", svg:
      '<rect x="4" y="4" width="92" height="92" fill="#fffdf6"/>' +
      '<path d="M50 86C24 70 24 32 50 12c26 20 26 58 0 74z" fill="#8bbf6a" opacity=".55" stroke="#4e8a2e" stroke-width="3" stroke-dasharray="3 2"/>' +
      '<path d="M50 94V16M50 32l-12 8M50 32l12 8M50 48l-15 9M50 48l15 9M50 64l-13 8M50 64l13 8" stroke="#3c7424" stroke-width="2.4" fill="none"/>' },
    tulipfruit: { box: "0 0 100 100", svg:
      '<path d="M50 96V70" stroke="#6b4a2b" stroke-width="4"/>' +
      '<path d="M50 8c14 14 16 46 0 64-16-18-14-50 0-64z" fill="#b38a55"/>' +
      '<g stroke="#7d5a32" stroke-width="2" fill="none"><path d="M40 24l10 6 10-6M38 36l12 6 12-6M38 48l12 6 12-6M40 60l10 6 10-6"/></g>' },
    flower: { box: "0 0 100 100", svg:
      [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="50" cy="28" rx="13" ry="20" fill="#e8739b" transform="rotate(' + a + ' 50 50)"/>'; }).join("") +
      '<circle cx="50" cy="50" r="10" fill="#f5c431"/>' },
    fruit: { box: "0 0 100 100", svg:
      '<path d="M18 30c20 4 50 24 66 54-6 6-14 4-20-2C48 66 26 52 14 38z" fill="#6fae3f" stroke="#477a26" stroke-width="2"/>' +
      '<g fill="#a6d07a"><ellipse cx="30" cy="42" rx="6" ry="5"/><ellipse cx="46" cy="54" rx="6" ry="5"/><ellipse cx="62" cy="68" rx="6" ry="5"/></g>' +
      '<path d="M18 30l-8-12" stroke="#477a26" stroke-width="3" stroke-linecap="round"/>' },
    cone: { box: "0 0 100 100", svg:
      '<path d="M50 8v6" stroke="#6b4a2b" stroke-width="4"/><ellipse cx="50" cy="52" rx="24" ry="38" fill="#8a5a2b"/>' +
      '<g fill="#b07a42" stroke="#5e3b1c" stroke-width="1.2">' +
        [24, 36, 48, 60, 72].map(function (y, i) {
          let row = "";
          for (let x = 34 + (i % 2) * 8; x <= 66; x += 16) row += '<path d="M' + (x - 7) + " " + y + "q7 10 14 0q-7-4-14 0z" + '"/>';
          return row;
        }).join("") + "</g>" },
    magnifier: { box: "0 0 100 100", svg:
      '<path d="M40 74C20 60 22 30 40 16c18 14 20 44 0 58z" fill="#5aa13a"/>' +
      '<circle cx="54" cy="44" r="22" fill="#eaf6fd" fill-opacity=".65" stroke="#2b2f33" stroke-width="5"/>' +
      '<path d="M70 60l18 18" stroke="#8a5a2b" stroke-width="9" stroke-linecap="round"/>' },
    press: { box: "0 0 100 100", svg:
      '<rect x="10" y="62" width="80" height="10" fill="#f4efe2" stroke="#b9ad92"/>' +
      '<path d="M70 68c10-6 18-4 22 0-4 4-12 6-22 0z" fill="#5aa13a"/>' +
      '<rect x="14" y="34" width="72" height="28" rx="3" fill="#2f6fc4"/><rect x="14" y="34" width="72" height="6" fill="#255aa0"/>' +
      '<path d="M50 22v8M44 26l6 6 6-6" stroke="#163d24" stroke-width="3" fill="none" stroke-linecap="round"/>' }
  };

  // Sunflower head: petals around a seed-filled center
  function head(r, detail) {
    let s = "";
    for (let a = 0; a < 360; a += 20) {
      s += '<ellipse cx="0" cy="' + (-r * 0.72) + '" rx="' + (r * 0.16) + '" ry="' + (r * 0.32) + '" fill="#f5c431" stroke="#d99a16" stroke-width="' + (r / 40) + '" transform="rotate(' + a + ')"/>';
    }
    s += '<circle r="' + (r * 0.48) + '" fill="#6b4423"/>';
    if (detail) {
      for (let i = 1; i < 90; i++) {
        const d = Math.sqrt(i) * r * 0.048;
        const a = i * 137.5 * Math.PI / 180;
        s += '<circle cx="' + (d * Math.cos(a)).toFixed(1) + '" cy="' + (d * Math.sin(a)).toFixed(1) + '" r="' + (r * 0.022) + '" fill="#3b2412"/>';
      }
    }
    return s;
  }

  document.querySelectorAll("[data-tp-art]").forEach(function (el) {
    const a = ART[el.dataset.tpArt];
    const label = el.dataset.label;
    el.innerHTML = '<svg viewBox="' + a.box + '" ' + (label ? 'role="img" aria-label="' + label + '"' : 'aria-hidden="true"') + ">" + a.svg + "</svg>";
  });

  /* Native-range maps: a simple outline of the lower 48 U.S. states.
     The shaded areas are only placeholders that show where shading goes on a map. */
  const US = "M14 12L60 14L98 15L100 11L104 15L116 17L122 22L128 20L134 24L140 30L144 26L150 27L156 24L162 22L170 14L176 8L182 10L184 18L176 26L172 32L168 38L162 44L160 52L164 58L160 64L152 72L146 80L148 88L154 98L156 108L152 110L146 100L140 92L130 90L122 92L114 94L106 96L100 104L98 112L90 108L86 98L80 92L72 90L66 94L60 88L44 86L34 84L24 80L18 72L12 60L8 46L8 32L12 20Z";
  const SHADE = {
    sample: "M96 40L150 34L162 46L156 66L144 82L120 88L100 80L92 60Z",
    oak: "M150 70L162 62L156 76L148 84L154 100L158 112L140 92L120 94L104 98L96 110L98 96L114 90L130 86L146 80Z",
    sunflower: "M30 28L140 30L150 60L140 88L100 100L60 90L28 80Z",
    tulip: "M118 34L150 30L164 40L160 60L150 74L144 86L130 88L116 80L112 60Z"
  };
  function mapSVG(kind) {
    const id = "tp" + (uid += 1);
    const sample = kind === "sample";
    return '<svg viewBox="0 0 200 180" role="img" aria-label="' +
      (sample ? "Example map with a title, a shaded area, a key, and a source line" : "Sample native-range map layout with a placeholder shaded area, a key, and a source line") + '">' +
      '<defs><clipPath id="' + id + 'm"><path d="' + US + '"/></clipPath>' +
      '<pattern id="' + id + 'h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#9fd08a"/><path d="M0 0v5" stroke="#3c7424" stroke-width="2"/></pattern></defs>' +
      '<text x="100" y="16" text-anchor="middle" class="tp-map-title">' + (sample ? "Native Range of ___" : "Native Range") + "</text>" +
      '<g transform="translate(0 24)">' +
        '<path d="' + US + '" fill="#fbf8ee" stroke="#555" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="' + SHADE[kind] + '" fill="url(#' + id + 'h)" clip-path="url(#' + id + 'm)"/>' +
        '<path d="' + US + '" fill="none" stroke="#555" stroke-width="1.6" stroke-linejoin="round"/>' +
      "</g>" +
      '<rect x="10" y="149" width="16" height="11" fill="url(#' + id + 'h)" stroke="#555"/>' +
      '<text x="31" y="159" class="tp-map-key">' + "= native range" + "</text>" +
      '<text x="10" y="177" class="tp-map-key">Source: _____________</text>' +
      "</svg>";
  }
  document.querySelectorAll("[data-tp-map]").forEach(function (el) { el.innerHTML = mapSVG(el.dataset.tpMap); });

  /* ---------- 2. Poster example labels and writing lines ---------- */
  const FACT_LABELS = ["Plant type", "Size & growth", "Leaves", "Stem or bark", "Flowers, fruit & seeds",
    "Native range & habitat", "Growing needs", "Seasons / life cycle", "Importance"];
  document.querySelectorAll(".pm-factlist").forEach(function (ul) {
    const range = ul.dataset.facts === "all" ? [0, FACT_LABELS.length - 1] : ul.dataset.facts.split("-").map(Number);
    let html = "";
    for (let i = range[0]; i <= range[1]; i++) html += "<li><b>" + FACT_LABELS[i] + ":</b><i></i></li>";
    ul.innerHTML = html;
  });

  function addLines(el, n, cls) {
    let html = "";
    for (let i = 0; i < n; i++) html += '<span class="' + cls + '"></span>';
    el.innerHTML = html;
  }
  document.querySelectorAll(".pm-lines").forEach(function (el) { addLines(el, Number(el.dataset.n), "pm-line"); });

  /* ---------- 3. Final checklist ----------
     Saved in this browser only (localStorage). Never sent anywhere. */
  const KEY = "plant-poster-checklist";
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

  /* ---------- 4. Printing ----------
     Each button copies just the part it prints into #print-area (style.css hides everything else). */
  const printArea = document.getElementById("print-area");

  function cloneAll(selector) {
    return Array.from(document.querySelectorAll(selector)).map(function (el) {
      const copy = el.cloneNode(true);
      copy.removeAttribute("id");
      copy.querySelectorAll("[id]").forEach(function (x) { if (!x.closest("svg")) x.removeAttribute("id"); });
      return copy.outerHTML;
    }).join("")
      // Maps use ids for their shading; give the printed copies their own
      .replace(/(id="|url\(#)(tp\d+)/g, "$1$2p");
  }

  function organizerHTML() {
    const holder = document.createElement("div");
    holder.appendChild(document.getElementById("organizer-template").content.cloneNode(true));
    holder.querySelectorAll("[data-lines]").forEach(function (el) { addLines(el, Number(el.dataset.lines), "w-line"); });
    return holder.innerHTML;
  }

  const PARTS = {
    directions: function () {
      return '<h1 class="print-title">Plant &amp; Tree Research Poster Project</h1>' +
        '<p class="print-sub">Choose a plant. Discover its features. Create a poster that teaches others!</p>' +
        cloneAll(".pp-print-directions");
    },
    organizer: organizerHTML,
    checklist: function () {
      return '<p class="print-name">Name: ______________________________ &nbsp; Class: __________ &nbsp; Plant: ________________</p>' +
        cloneAll(".pp-print-checklist");
    },
    examples: function () {
      return '<h1 class="print-title">Plant &amp; Tree Poster Layout Examples</h1>' + cloneAll(".pp-print-examples");
    }
  };

  document.querySelectorAll("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      printArea.innerHTML =
        '<p class="print-site">6th Grade Science • Plant &amp; Tree Research Poster Project • Mr. Watford</p>' +
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
