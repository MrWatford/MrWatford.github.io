/* =========================================================
   Holiday scenes for the HOME PAGE (loaded by js/holidays.js)

   Big animated scenes for the four major holidays:
     Christmas    – a Christmas village with the Nativity
     Easter       – the resurrection garden and empty tomb
     Independence – a town square with fireworks
     Thanksgiving – an autumn harvest farm and dinner table
   …and a smaller banner for every other holiday.

   Everything is drawn here with code (SVG), no photos.
   Click things in the big scenes to explore. Mr. Watford's
   caption bar under the scene tells about them.
   ========================================================= */
(function () {
  "use strict";
  let H = null;            // drawing helpers from holidays.js
  let R = Math.random;     // seeded random numbers (same picture every visit)
  const f1 = (n) => Math.round(n * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pick = (a) => a[(R() * a.length) | 0];
  const rr = (a, b) => a + R() * (b - a);

  /* ---------------- shared pieces ---------------- */
  // A clickable part of a scene: Mr. Watford's caption explains it
  function hot(label, say, inner, act) {
    return '<g class="hs-hot" tabindex="0" role="button" aria-label="' + esc(label) + '" data-say="' + esc(say) + '"' + (act ? ' data-act="' + act + '"' : "") + ">" + inner + "</g>";
  }
  const layer = (depth, inner, cls) => '<g class="hs-layer' + (cls ? " " + cls : "") + '" data-depth="' + depth + '">' + inner + "</g>";
  const shadow = (x, y, rx, ry, o) => '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="#0b1530" opacity="' + (o || 0.28) + '" filter="url(#hs-soft)"/>';
  const softDefs = '<filter id="hs-smokef" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter><filter id="hs-soft" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="6"/></filter><filter id="hs-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

  // People for the village and the crowds: drawn facing right, feet at (x, y)
  function person(x, y, o) {
    const s = (o.h || 56) / 56, pants = o.pants || "#2b2b3a";
    let p = '<g transform="translate(' + f1(x) + " " + f1(y) + ") scale(" + f1(s * 100) / 100 + ')">';
    p += '<g class="hs-leg-a"><rect x="-7" y="-19" width="5.5" height="19" rx="2.5" fill="' + pants + '"/></g><g class="hs-leg-b"><rect x="1.5" y="-19" width="5.5" height="19" rx="2.5" fill="' + pants + '"/></g>';
    p += '<path d="M-11-15Q-13-40 0-43Q13-40 11-15Z" fill="' + o.coat + '"/><path d="M-11-15Q0-11 11-15" stroke="rgba(0,0,0,.18)" stroke-width="3" fill="none"/>';
    if (o.scarf) p += '<rect x="-9" y="-44" width="18" height="6" rx="3" fill="' + o.scarf + '"/><path d="M-5-40l-3 13" stroke="' + o.scarf + '" stroke-width="4.5" stroke-linecap="round"/>';
    p += '<circle cx="0" cy="-50" r="8.5" fill="' + (o.skin || "#e9b98f") + '"/><circle cx="3.6" cy="-51" r="1.1" fill="#2a1d14"/>';
    if (o.hat === "beanie") p += '<path d="M-8.6-52Q0-66 8.6-52Z" fill="' + (o.hatc || "#c62828") + '"/><rect x="-9" y="-54" width="18" height="4" rx="2" fill="#f3f3f3"/><circle cx="0" cy="-63" r="3" fill="#f3f3f3"/>';
    else if (o.hat === "top") p += '<rect x="-7" y="-70" width="14" height="14" fill="#1d1d24"/><rect x="-11" y="-57" width="22" height="3" fill="#1d1d24"/><rect x="-7" y="-60" width="14" height="2.5" fill="#b3202a"/>';
    else if (o.hat === "hair") p += '<path d="M-9-50Q-10-62 0-61Q10-62 9-50Q6-57 0-57Q-5-57-9-50Z" fill="' + (o.hatc || "#3a2416") + '"/>';
    else if (o.hat === "cap") p += '<path d="M-8.5-52Q0-64 8.5-52Z" fill="' + (o.hatc || "#1f3a6e") + '"/><path d="M4-53l9 1-1 2.5-8-.5Z" fill="' + (o.hatc || "#1f3a6e") + '"/>';
    if (o.book) p += '<rect x="5" y="-35" width="10" height="8" rx="1" fill="#7a1f1f"/><path d="M10-35v8" stroke="#e8d6b0"/>';
    if (o.flag) p += '<path d="M8-30V-58" stroke="#5a4a3a" stroke-width="1.5"/>' + H.flagMini(8.5, -58, 14);
    if (o.sparkler) p += '<path d="M8-30l6-18" stroke="#888" stroke-width="1.2"/><circle class="hs-spark" cx="14" cy="-49" r="5" fill="#fff3b0"/>';
    return p + "</g>";
  }
  // Something moving across the scene (wrapper does the travel, inner bobs)
  function walker(inner, dir, dur, delay, y) {
    return '<g class="hs-walk hs-walk-' + dir + '" style="animation-duration:' + dur + "s;animation-delay:" + delay + 's"><g class="hs-bob">' +
      (dir === "l" ? '<g transform="translate(0 ' + y + ') scale(-1 1)">' + inner + "</g>" : '<g transform="translate(0 ' + y + ')">' + inner + "</g>") + "</g></g>";
  }
  function evergreen(x, y, h, o) {
    o = o || {};
    const w = h * 0.42, c1 = o.c1 || "#173f2a", c2 = o.c2 || "#1f5236";
    let t = '<rect x="' + f1(x - h * 0.03) + '" y="' + f1(y - h * 0.12) + '" width="' + f1(h * 0.06) + '" height="' + f1(h * 0.12) + '" fill="#3b2a1d"/>';
    for (let i = 0; i < 4; i++) {
      const ty = y - h + i * h * 0.21, by = ty + h * 0.36, hw = w * (0.38 + i * 0.2);
      t += '<path d="M' + f1(x) + " " + f1(ty) + "L" + f1(x + hw) + " " + f1(by) + "Q" + f1(x) + " " + f1(by - h * 0.05) + " " + f1(x - hw) + " " + f1(by) + 'Z" fill="' + (i % 2 ? c2 : c1) + '"/>';
      if (o.snow) t += '<path d="M' + f1(x - hw * 0.95) + " " + f1(by - 1) + "Q" + f1(x - hw * 0.5) + " " + f1(by - h * 0.07) + " " + f1(x) + " " + f1(by - h * 0.045) + "Q" + f1(x + hw * 0.5) + " " + f1(by - h * 0.07) + " " + f1(x + hw * 0.95) + " " + f1(by - 1) + '" stroke="#f4f8ff" stroke-width="' + f1(h * 0.035) + '" fill="none" stroke-linecap="round"/>';
    }
    if (o.snow) t += '<path d="M' + f1(x - w * 0.12) + " " + f1(y - h * 0.9) + "L" + f1(x) + " " + f1(y - h) + "L" + f1(x + w * 0.12) + " " + f1(y - h * 0.9) + 'Z" fill="#f4f8ff"/>';
    return t;
  }
  function cloud(x, y, s, c, o) {
    return '<g opacity="' + (o || 0.85) + '" fill="' + c + '"><ellipse cx="' + x + '" cy="' + y + '" rx="' + 70 * s + '" ry="' + 18 * s + '"/><ellipse cx="' + (x - 30 * s) + '" cy="' + (y - 12 * s) + '" rx="' + 34 * s + '" ry="' + 20 * s + '"/><ellipse cx="' + (x + 18 * s) + '" cy="' + (y - 18 * s) + '" rx="' + 40 * s + '" ry="' + 26 * s + '"/></g>';
  }
  // A waving flag made of thin slices that ripple
  let flagCount = 0;
  function wavingFlag(x, y, w, still) {
    const id = "hs-flag-" + (flagCount++), h = w * 0.58, sh = h / 13, N = 16;
    let art = "";
    for (let i = 0; i < 13; i++) art += '<rect x="0" y="' + f1(i * sh) + '" width="' + w + '" height="' + f1(sh + 0.4) + '" fill="' + (i % 2 ? "#fff" : "#b22234") + '"/>';
    const cw = w * 0.4, ch = sh * 7;
    art += '<rect width="' + f1(cw) + '" height="' + f1(ch) + '" fill="#3c3b6e"/>';
    for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++) {
      const sx = (c + (r % 2 ? 1 : 0.5)) * (cw / 6), sy = (r + 0.6) * (ch / 9.4);
      art += '<circle cx="' + f1(sx) + '" cy="' + f1(sy) + '" r="' + f1(cw / 40) + '" fill="#fff"/>';
    }
    let s = '<defs><g id="' + id + '">' + art + "</g>";
    for (let k = 0; k < N; k++) s += '<clipPath id="' + id + "c" + k + '"><rect x="' + f1((k * w) / N - 0.3) + '" y="-30" width="' + f1(w / N + 0.6) + '" height="' + f1(h + 60) + '"/></clipPath>';
    s += "</defs>";
    let g = "";
    for (let k = 0; k < N; k++) {
      const amp = f1(1 + (k / N) * w * 0.045);
      g += '<g clip-path="url(#' + id + "c" + k + ')"><g class="hs-wave" style="--a:' + amp + "px;animation-delay:" + f1(-k * 0.14) + 's"><use href="#' + id + '"/><rect x="' + f1((k * w) / N) + '" width="' + f1(w / N + 0.4) + '" height="' + f1(h) + '" fill="' + (k % 4 < 2 ? "#fff" : "#000") + '" opacity=".07"/></g></g>';
    }
    return s + '<g transform="translate(' + x + " " + y + ')">' + g + "</g>";
  }

  /* ---------------- CHRISTMAS: the village and the Nativity ---------------- */
  function christmas(o) {
    R = H.seeded(2512);
    const W = 1600, Ht = 800;
    let defs = softDefs +
      '<linearGradient id="xs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050b20"/><stop offset=".5" stop-color="#122453"/><stop offset="1" stop-color="#3d5a98"/></linearGradient>' +
      '<radialGradient id="xs-starglow"><stop offset="0" stop-color="#fffbe6"/><stop offset=".18" stop-color="#ffeaa0" stop-opacity=".6"/><stop offset="1" stop-color="#ffeaa0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="xs-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4" stop-opacity=".38"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="xs-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset="1" stop-color="#f4a83a"/></linearGradient>' +
      '<radialGradient id="xs-pool"><stop offset="0" stop-color="#ffd98a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xs-stable"><stop offset="0" stop-color="#ffe7a6"/><stop offset=".55" stop-color="#e9a548" stop-opacity=".55"/><stop offset="1" stop-color="#6b4423" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="xs-halo"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffe082" stop-opacity=".6"/><stop offset="1" stop-color="#ffe082" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="xs-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9ff"/><stop offset="1" stop-color="#c9d8ee"/></linearGradient>' +
      '<radialGradient id="xs-ball" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#f4f8ff"/><stop offset="1" stop-color="#c6d4ea"/></radialGradient>' +
      '<radialGradient id="xs-vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#020617" stop-opacity=".55"/></radialGradient>';

    // Sky, stars, and the Star of Bethlehem
    let sky = '<rect width="' + W + '" height="' + Ht + '" fill="url(#xs-sky)"/>';
    for (let i = 0; i < 170; i++) {
      const x = R() * W, y = R() * R() * 470, r = 0.5 + R() * 1.5, tw = R() < 0.45;
      sky += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="#fff"' + (tw ? ' class="hs-twinkle" style="animation-delay:' + f1(-R() * 4) + "s;animation-duration:" + f1(2 + R() * 3) + 's"' : ' opacity="' + f1(0.4 + R() * 0.5) + '"') + "/>";
    }
    let rays = "";
    for (let i = 0; i < 12; i++) rays += '<polygon points="800,92 ' + f1(800 + Math.cos(i * 0.5236 - 0.05) * 190) + "," + f1(92 + Math.sin(i * 0.5236 - 0.05) * 190) + " " + f1(800 + Math.cos(i * 0.5236 + 0.05) * 190) + "," + f1(92 + Math.sin(i * 0.5236 + 0.05) * 190) + '" fill="#fff6cf" opacity="' + (i % 2 ? 0.14 : 0.24) + '"/>';
    const star = '<polygon points="792,112 808,112 990,640 610,640" fill="url(#xs-beam)"/>' +
      hot("The Star of Bethlehem", "The wise men followed a bright star all the way to Jesus. “When they saw the star, they rejoiced with exceeding great joy.” (Matthew 2:10)",
        '<circle cx="800" cy="92" r="190" fill="url(#xs-starglow)" class="hs-pulse"/><g class="hs-spin">' + rays + '</g><polygon points="' + H.starPts(800, 92, 62, 7, 4) + '" fill="#fffbe6" filter="url(#hs-glow)"/><polygon points="' + H.starPts(800, 92, 28, 6, 4) + '" fill="#fff" transform="rotate(45 800 92)"/><circle cx="800" cy="92" r="9" fill="#fff"/>');
    // Far mountains
    const peaks = [[0, 470], [120, 352], [215, 420], [330, 300], [450, 410], [565, 338], [700, 430], [830, 362], [945, 420], [1065, 318], [1185, 410], [1305, 336], [1425, 420], [1525, 360], [1600, 396]];
    let mts = '<path d="M' + peaks.map((p) => p.join(" ")).join("L") + 'V600H0Z" fill="#22386a"/>';
    peaks.slice(1, -1).forEach(([x, y], i) => { if (y < 400) mts += '<path d="M' + (x - 34) + " " + (y + 32) + "L" + x + " " + y + "L" + (x + 34) + " " + (y + 32) + "l-10-6-8 8-9-9-7 8-8-7-9 9-8-8Z" + '" fill="#e8f0ff" opacity=".9"/>'; });
    // Far hills with a little town and a church
    let far = '<path d="M0 520Q200 440 420 482T860 470T1260 452T1600 482V800H0Z" fill="#9fb3d6"/>';
    for (let i = 0; i < 22; i++) {
      const x = (i < 11 ? 30 + i * 36 : 960 + (i - 11) * 40) + R() * 10, y = 478 - Math.sin((x / 1600) * 6) * 14 + R() * 8, w = 16 + R() * 10, h = 12 + R() * 8;
      far += '<rect x="' + f1(x) + '" y="' + f1(y - h) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="#4b5d86"/><path d="M' + f1(x - 2) + " " + f1(y - h) + "L" + f1(x + w / 2) + " " + f1(y - h - 8) + "L" + f1(x + w + 2) + " " + f1(y - h) + 'Z" fill="#eaf1fb"/><rect x="' + f1(x + 4) + '" y="' + f1(y - h + 4) + '" width="3" height="3" fill="#ffd27a" class="hs-flicker" style="animation-delay:' + f1(-R() * 5) + 's"/>';
    }
    far += hot("The little church", "A church on the hill. People have gathered for hundreds of years at Christmas to worship the newborn King.",
      '<rect x="1270" y="408" width="44" height="38" fill="#56689a"/><path d="M1266 408L1292 388 1318 408Z" fill="#eaf1fb"/><rect x="1283" y="370" width="18" height="38" fill="#56689a"/><path d="M1280 370L1292 342 1304 370Z" fill="#eaf1fb"/><path d="M1292 326v18M1286 332h12" stroke="#ffe7a0" stroke-width="2.5"/><path d="M1287 426q5-8 10 0v14h-10z" fill="#ffd27a" class="hs-flicker"/><circle cx="1292" cy="386" r="3.5" fill="#ffd27a"/>');
    for (let i = 0; i < 40; i++) { const x = R() * W, y = 470 - Math.sin((x / 1600) * 6) * 12 + 18; far += evergreen(x, y, 22 + R() * 14, { c1: "#2b4670", c2: "#34527f", snow: true }); }

    // Middle snowfield + cottages
    let mid = '<path d="M0 586Q300 524 640 562T1300 546T1600 562V800H0Z" fill="url(#xs-snow)"/>';
    function cottage(x, base, w, h, wall, roof, name, flip) {
      const rh = h * 0.6, top = base - h, cx = x + w / 2;
      let c = shadow(cx, base + 4, w * 0.6, 10);
      c += '<ellipse cx="' + f1(cx) + '" cy="' + f1(base + 16) + '" rx="' + f1(w * 0.55) + '" ry="22" fill="url(#xs-pool)" class="hs-flicker-soft"/>';
      const chx = flip ? x + w * 0.22 : x + w * 0.68;
      c += '<rect x="' + f1(chx) + '" y="' + f1(top - rh * 0.85) + '" width="' + f1(w * 0.11) + '" height="' + f1(rh * 0.7) + '" fill="#7a3b2e"/><rect x="' + f1(chx - 3) + '" y="' + f1(top - rh * 0.88) + '" width="' + f1(w * 0.11 + 6) + '" height="7" rx="3" fill="#f6f9ff"/>';
      for (let i = 0; i < 3; i++) c += '<circle class="hs-smoke" cx="' + f1(chx + w * 0.055) + '" cy="' + f1(top - rh * 0.92) + '" r="' + f1(7 + i * 2) + '" fill="#dde4ef" filter="url(#hs-smokef)" style="animation-delay:' + f1(-i * 1.7 - R()) + 's"/>';
      c += '<rect x="' + f1(x) + '" y="' + f1(top) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="' + wall + '"/>';
      c += '<path d="M' + f1(x) + " " + f1(top + h * 0.35) + "H" + f1(x + w) + "M" + f1(x) + " " + f1(top + h * 0.7) + "H" + f1(x + w) + '" stroke="rgba(0,0,0,.08)" stroke-width="2"/>';
      c += '<path d="M' + f1(x - 16) + " " + f1(top + 4) + "L" + f1(cx) + " " + f1(top - rh) + "L" + f1(x + w + 16) + " " + f1(top + 4) + 'Z" fill="' + roof + '"/>';
      c += '<g class="hs-grow"><path d="M' + f1(x - 18) + " " + f1(top + 1) + "L" + f1(cx) + " " + f1(top - rh - 5) + "L" + f1(x + w + 18) + " " + f1(top + 1) + '" stroke="#f6f9ff" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill="none"/>';
      for (let i = 0; i < 6; i++) c += '<circle cx="' + f1(x - 8 + i * ((w + 16) / 5)) + '" cy="' + f1(top + 7) + '" r="' + f1(3 + R() * 2.5) + '" fill="#f6f9ff"/>';
      c += "</g>";
      // lights along the roof
      for (let i = 1; i < 12; i++) {
        const t = i / 12, side = t < 0.5, u = side ? t * 2 : (t - 0.5) * 2;
        const lx = side ? x - 14 + (cx - x + 14) * u : cx + (x + w + 14 - cx) * u, ly = side ? top + 8 - (rh + 2) * u : top - rh + 6 + (rh + 2) * u;
        c += '<circle cx="' + f1(lx) + '" cy="' + f1(ly + 6) + '" r="3.2" fill="' + ["#ff5a4f", "#ffe45c", "#4aa3ff", "#5fd36a"][i % 4] + '" class="hs-tw' + (i % 3) + '"/>';
      }
      const ww = w * 0.2, wh = h * 0.32, wy = top + h * 0.22;
      const win = (wx) => '<rect class="hs-win" x="' + f1(wx) + '" y="' + f1(wy) + '" width="' + f1(ww) + '" height="' + f1(wh) + '" fill="url(#xs-win)"/><path d="M' + f1(wx + ww / 2) + " " + f1(wy) + "v" + f1(wh) + "M" + f1(wx) + " " + f1(wy + wh / 2) + "h" + f1(ww) + '" stroke="#5a3a22" stroke-width="2.5"/><rect x="' + f1(wx - 3) + '" y="' + f1(wy + wh) + '" width="' + f1(ww + 6) + '" height="5" fill="#f6f9ff"/>';
      const dw = w * 0.2, dx = flip ? x + w * 0.66 : x + w * 0.14;
      c += win(flip ? x + w * 0.12 : x + w * 0.42) + win(flip ? x + w * 0.38 : x + w * 0.7 - ww * 0.2 + (w * 0.06));
      c += '<path d="M' + f1(dx) + " " + base + "V" + f1(base - h * 0.55) + "q" + f1(dw / 2) + " -" + f1(dw * 0.5) + " " + f1(dw) + " 0V" + base + 'Z" fill="#5a3320"/>';
      c += '<circle cx="' + f1(dx + dw / 2) + '" cy="' + f1(base - h * 0.4) + '" r="' + f1(dw * 0.3) + '" fill="none" stroke="#1f5e33" stroke-width="' + f1(dw * 0.16) + '"/><path d="M' + f1(dx + dw / 2) + " " + f1(base - h * 0.27) + "l-5-4v8zm0 0l5-4v8z" + '" fill="#c62828"/>';
      c += '<path d="M' + f1(x - 4) + " " + base + "q" + f1(w * 0.25) + " -12 " + f1(w * 0.5) + " -4t" + f1(w * 0.5 + 8) + ' 2v6H' + f1(x - 4) + 'Z" fill="#f6f9ff" class="hs-grow"/>';
      return hot(name, "A cozy cottage with a wreath on the door. Click it to switch its lights off and on!", c, "lights");
    }
    mid += cottage(30, 600, 200, 126, "#8b3a3a", "#3b2a2a", "The red cottage");
    mid += cottage(1075, 596, 170, 112, "#c9a26b", "#4a3426", "The tan cottage", true);
    mid += cottage(1290, 606, 200, 132, "#5f8a5a", "#33291f", "The green cottage");
    mid += cottage(1500, 592, 130, 96, "#7a4a8c", "#2c2234", "The purple cottage", true);
    let mid2 = cottage(232, 604, 140, 96, "#46688a", "#2a2a3a", "The blue cottage", true);

    // Lampposts
    function lamp(x, base, s) {
      return '<ellipse cx="' + x + '" cy="' + (base + 4) + '" rx="' + 70 * s + '" ry="' + 16 * s + '" fill="url(#xs-pool)"/>' +
        '<circle cx="' + x + '" cy="' + (base - 118 * s) + '" r="' + 46 * s + '" fill="url(#xs-pool)" class="hs-pulse"/>' +
        '<rect x="' + (x - 3 * s) + '" y="' + (base - 110 * s) + '" width="' + 6 * s + '" height="' + 110 * s + '" fill="#1d2433"/><rect x="' + (x - 8 * s) + '" y="' + (base - 8 * s) + '" width="' + 16 * s + '" height="' + 8 * s + '" fill="#1d2433"/>' +
        '<path d="M' + (x - 11 * s) + " " + (base - 112 * s) + "h" + 22 * s + "l-4 -" + 20 * s + "h-" + 14 * s + 'z" fill="#ffe9a8" stroke="#1d2433" stroke-width="' + 3 * s + '"/><path d="M' + (x - 13 * s) + " " + (base - 132 * s) + "h" + 26 * s + "l-" + 13 * s + " -" + 10 * s + 'z" fill="#1d2433"/><path d="M' + (x - 13 * s) + " " + (base - 133 * s) + "h" + 26 * s + '" stroke="#f6f9ff" stroke-width="' + 4 * s + '" stroke-linecap="round"/>' +
        '<circle cx="' + x + '" cy="' + (base - 70 * s) + '" r="' + 9 * s + '" fill="none" stroke="#1f5e33" stroke-width="' + 5 * s + '"/><path d="M' + x + " " + (base - 62 * s) + "l-" + 6 * s + " -" + 4 * s + "v" + 8 * s + "zm0 0l" + 6 * s + " -" + 4 * s + "v" + 8 * s + 'z" fill="#c62828"/>';
    }

    // The big Christmas tree
    function bigTree(cx, base) {
      let t = shadow(cx, base + 6, 170, 16, 0.35);
      t += '<circle cx="' + cx + '" cy="' + (base - 190) + '" r="230" fill="url(#xs-pool)" opacity=".55" class="hs-pulse"/>';
      t += '<rect x="' + (cx - 16) + '" y="' + (base - 46) + '" width="32" height="50" fill="#4a2f1a"/>';
      const tiers = 6, top = base - 372;
      for (let i = 0; i < tiers; i++) {
        const ty = top + i * 52, by = ty + 110, hw = 40 + i * 26;
        t += '<path d="M' + cx + " " + ty + "L" + (cx + hw) + " " + by + "Q" + (cx + hw * 0.5) + " " + (by - 10) + " " + cx + " " + (by - 4) + "Q" + (cx - hw * 0.5) + " " + (by - 10) + " " + (cx - hw) + " " + by + 'Z" fill="' + (i % 2 ? "#1c5a32" : "#16492a") + '"/>';
        t += '<path d="M' + cx + " " + (ty + 6) + "L" + (cx + hw * 0.92) + " " + (by - 3) + "Q" + (cx + hw * 0.5) + " " + (by - 12) + " " + cx + ' ' + (by - 6) + 'Z" fill="#23703f" opacity=".7"/>';
        t += '<g class="hs-grow"><path d="M' + (cx - hw) + " " + by + "Q" + (cx - hw * 0.8) + " " + (by - 9) + " " + (cx - hw * 0.62) + " " + (by - 5) + "M" + (cx + hw) + " " + by + "Q" + (cx + hw * 0.8) + " " + (by - 9) + " " + (cx + hw * 0.62) + " " + (by - 5) + '" stroke="#f4f8ff" stroke-width="6" stroke-linecap="round" fill="none"/></g>';
      }
      // gold garland swoops
      for (let i = 0; i < 5; i++) {
        const y = top + 90 + i * 64, hw = 40 + i * 30;
        t += '<path d="M' + (cx - hw) + " " + (y - 8) + "Q" + cx + " " + (y + 26) + " " + (cx + hw) + " " + (y - 22) + '" stroke="#e8c45a" stroke-width="3.5" fill="none" stroke-dasharray="2 3"/>';
      }
      // lights + ornaments
      let lights = "", orn = "";
      for (let i = 0; i < 80; i++) {
        const y = top + 40 + R() * 340, frac = (y - top) / 380, hw = 30 + frac * 165, x = cx + (R() * 2 - 1) * hw * 0.85;
        const col = pick(["#ff5a4f", "#ffe45c", "#4aa3ff", "#5fd36a", "#ff9ad5", "#fff4d0"]);
        lights += '<g class="hs-tw' + (i % 3) + '"><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="9" fill="' + col + '" opacity=".35"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="3.6" fill="' + col + '"/></g>';
      }
      for (let i = 0; i < 26; i++) {
        const y = top + 70 + R() * 310, frac = (y - top) / 380, hw = 30 + frac * 160, x = cx + (R() * 2 - 1) * hw * 0.8;
        orn += H.ornament(f1(x), f1(y), f1(6 + R() * 4), pick(["#c62828", "#d4af37", "#1e88e5", "#8e24aa", "#e53935", "#f5f5f5"]));
      }
      t += '<g class="hs-orn">' + orn + '</g><g class="hs-lights">' + lights + "</g>";
      t += '<circle cx="' + cx + '" cy="' + (top - 6) + '" r="42" fill="url(#xs-starglow)" class="hs-pulse"/><polygon points="' + H.starPts(cx, top - 6, 30, 12) + '" fill="#f3d36b" stroke="#fff3b0" stroke-width="2" filter="url(#hs-glow)"/>';
      // presents
      const gifts = [[-150, 60, 44, "#c62828", "#f3d36b"], [-96, 44, 52, "#1e88e5", "#fff"], [-40, 70, 36, "#f3d36b", "#c62828"], [30, 52, 48, "#2e7d32", "#f3d36b"], [86, 64, 40, "#8e24aa", "#fff"], [130, 40, 50, "#e53935", "#2e7d32"], [-5, 40, 30, "#fff", "#c62828"]];
      gifts.forEach(([dx, w, h, c, rb]) => {
        const gx = cx + dx, gy = base + 18 - h;
        t += '<rect x="' + gx + '" y="' + gy + '" width="' + w + '" height="' + h + '" rx="3" fill="' + c + '"/><rect x="' + gx + '" y="' + gy + '" width="' + w + '" height="' + h + '" rx="3" fill="#000" opacity=".12" clip-path="inset(0 0 0 50%)"/><rect x="' + (gx + w / 2 - 4) + '" y="' + gy + '" width="8" height="' + h + '" fill="' + rb + '"/><rect x="' + gx + '" y="' + (gy + h * 0.4) + '" width="' + w + '" height="7" fill="' + rb + '"/><path d="M' + (gx + w / 2) + " " + gy + "c-14-14-20 2-2 0c18 2 12-14 2 0" + '" fill="' + rb + '" stroke="' + rb + '" stroke-width="3"/>';
      });
      return hot("The big Christmas tree", "Our town Christmas tree! Click it again to change the light show. Evergreen trees remind many people of the everlasting life Jesus gives.", t, "tree");
    }

    // The Nativity stable
    function nativity(cx, base) {
      let n = shadow(cx, base + 6, 200, 18, 0.4);
      n += '<ellipse cx="' + cx + '" cy="' + (base - 60) + '" rx="190" ry="120" fill="url(#xs-stable)" class="hs-pulse"/>';
      n += '<path d="M' + (cx - 120) + " " + (base - 140) + "H" + (cx + 120) + "V" + base + "H" + (cx - 120) + 'Z" fill="#5a3a1e"/>';
      for (let x = cx - 110; x < cx + 120; x += 22) n += '<path d="M' + x + " " + (base - 140) + "V" + base + '" stroke="#4a2f17" stroke-width="3"/>';
      n += '<ellipse cx="' + cx + '" cy="' + (base - 70) + '" rx="120" ry="80" fill="url(#xs-stable)" opacity=".9"/>';
      // ox and donkey
      n += '<g><ellipse cx="' + (cx - 82) + '" cy="' + (base - 66) + '" rx="34" ry="24" fill="#7d6f63"/><ellipse cx="' + (cx - 56) + '" cy="' + (base - 74) + '" rx="17" ry="14" fill="#8d8073"/><path d="M' + (cx - 66) + " " + (base - 86) + "q-8-12-16-6M" + (cx - 48) + " " + (base - 86) + 'q6-12 14-6" stroke="#e8dcc6" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="' + (cx - 52) + '" cy="' + (base - 76) + '" r="2" fill="#222"/></g>';
      n += '<g><ellipse cx="' + (cx + 84) + '" cy="' + (base - 64) + '" rx="32" ry="22" fill="#9a8a78"/><ellipse cx="' + (cx + 60) + '" cy="' + (base - 74) + '" rx="14" ry="17" fill="#a89886"/><path d="M' + (cx + 56) + " " + (base - 88) + "l-4-24 7 3zM" + (cx + 64) + " " + (base - 88) + 'l4-24-8 4z" fill="#8a7a68"/><circle cx="' + (cx + 56) + '" cy="' + (base - 76) + '" r="2" fill="#222"/><ellipse cx="' + (cx + 58) + '" cy="' + (base - 62) + '" rx="7" ry="5" fill="#6b5d50"/></g>';
      // posts and roof
      n += '<rect x="' + (cx - 132) + '" y="' + (base - 160) + '" width="16" height="160" fill="#6b4423"/><rect x="' + (cx + 116) + '" y="' + (base - 160) + '" width="16" height="160" fill="#6b4423"/>';
      n += '<path d="M' + (cx - 165) + " " + (base - 150) + "L" + cx + " " + (base - 236) + "L" + (cx + 165) + " " + (base - 150) + "L" + (cx + 152) + " " + (base - 136) + "L" + cx + " " + (base - 218) + "L" + (cx - 152) + " " + (base - 136) + 'Z" fill="#7a5230"/>';
      for (let i = 1; i < 10; i++) { const t = i / 10; n += '<path d="M' + f1(cx - 165 + 165 * t) + " " + f1(base - 150 - 86 * t) + "l6 14M" + f1(cx + 165 - 165 * t) + " " + f1(base - 150 - 86 * t) + 'l-6 14" stroke="#5a3a1e" stroke-width="2"/>'; }
      n += '<g class="hs-grow"><path d="M' + (cx - 170) + " " + (base - 152) + "L" + cx + " " + (base - 242) + "L" + (cx + 170) + " " + (base - 152) + '" stroke="#f6f9ff" stroke-width="15" stroke-linejoin="round" stroke-linecap="round" fill="none"/></g>';
      // lantern
      n += '<path d="M' + cx + " " + (base - 218) + "v26" + '" stroke="#3b2a1d" stroke-width="2"/><circle cx="' + cx + '" cy="' + (base - 180) + '" r="26" fill="url(#xs-pool)" class="hs-flicker-soft"/><rect x="' + (cx - 7) + '" y="' + (base - 192) + '" width="14" height="18" rx="3" fill="#ffd27a" stroke="#3b2a1d" stroke-width="2"/>';
      // hay floor
      n += '<ellipse cx="' + cx + '" cy="' + (base - 4) + '" rx="140" ry="13" fill="#d9b25b"/>';
      for (let i = 0; i < 30; i++) { const x = cx - 130 + R() * 260; n += '<path d="M' + f1(x) + " " + (base - 4) + "l" + f1(R() * 14 - 7) + " -" + f1(4 + R() * 6) + '" stroke="#b58d3a" stroke-width="1.5"/>'; }
      // Mary (kneeling, left)
      n += '<path d="M' + (cx - 92) + " " + base + "Q" + (cx - 92) + " " + (base - 44) + " " + (cx - 72) + " " + (base - 60) + "Q" + (cx - 58) + " " + (base - 72) + " " + (cx - 46) + " " + (base - 56) + "Q" + (cx - 34) + " " + (base - 30) + " " + (cx - 30) + " " + base + 'Z" fill="#3f6fb5"/>';
      n += '<path d="M' + (cx - 72) + " " + (base - 56) + "Q" + (cx - 64) + " " + (base - 30) + " " + (cx - 58) + " " + base + '" stroke="#f3efe4" stroke-width="3" fill="none" opacity=".7"/>';
      n += '<circle cx="' + (cx - 58) + '" cy="' + (base - 78) + '" r="15" fill="#3f6fb5"/><circle cx="' + (cx - 54) + '" cy="' + (base - 76) + '" r="9.5" fill="#e9b98f"/><path d="M' + (cx - 64) + " " + (base - 86) + "q10-6 18 4" + '" stroke="#f3efe4" stroke-width="3" fill="none"/>';
      n += '<path d="M' + (cx - 46) + " " + (base - 54) + "l10-6 3 4-10 6z" + '" fill="#e9b98f"/>';
      // Joseph (standing, right)
      n += '<path d="M' + (cx + 48) + " " + base + "L" + (cx + 58) + " " + (base - 92) + "Q" + (cx + 70) + " " + (base - 104) + " " + (cx + 82) + " " + (base - 92) + "L" + (cx + 94) + " " + base + 'Z" fill="#8a5a2b"/>';
      n += '<path d="M' + (cx + 58) + " " + (base - 90) + "Q" + (cx + 64) + " " + (base - 40) + " " + (cx + 56) + " " + base + "H" + (cx + 72) + "Q" + (cx + 74) + " " + (base - 50) + " " + (cx + 82) + " " + (base - 92) + 'Z" fill="#b9874a"/>';
      n += '<circle cx="' + (cx + 70) + '" cy="' + (base - 108) + '" r="13" fill="#c9a06b"/><circle cx="' + (cx + 66) + '" cy="' + (base - 106) + '" r="9" fill="#d9a77f"/><path d="M' + (cx + 60) + " " + (base - 100) + "q6 10 12 0" + '" fill="#6b4a32"/>';
      n += '<path d="M' + (cx + 102) + " " + base + "L" + (cx + 98) + " " + (base - 140) + "q-2-14 10-14 10 0 8 10" + '" stroke="#5a3a1e" stroke-width="5" fill="none" stroke-linecap="round"/>';
      // manger + baby Jesus
      n += '<circle cx="' + cx + '" cy="' + (base - 44) + '" r="46" fill="url(#xs-halo)" class="hs-pulse"/>';
      n += '<path d="M' + (cx - 42) + " " + (base - 40) + "H" + (cx + 42) + "L" + (cx + 32) + " " + (base - 14) + "H" + (cx - 32) + 'Z" fill="#8a5a2b"/><path d="M' + (cx - 30) + " " + (base - 14) + "l-10 14M" + (cx + 30) + " " + (base - 14) + 'l10 14" stroke="#6b4423" stroke-width="5"/>';
      n += '<path d="M' + (cx - 44) + " " + (base - 40) + "q8-10 16-2 8-10 16-1 8-9 16 0 8-9 16 0 8-9 16 2" + '" fill="#e8c45a" stroke="#d4a84a" stroke-width="2"/>';
      n += '<ellipse cx="' + (cx + 4) + '" cy="' + (base - 46) + '" rx="24" ry="9" fill="#fbf6ea"/><path d="M' + (cx - 8) + " " + (base - 50) + "q10 6 26 0" + '" stroke="#e5dcc6" stroke-width="1.5" fill="none"/><circle cx="' + (cx - 20) + '" cy="' + (base - 49) + '" r="7.5" fill="#efc39a"/>';
      // sheep
      const sheep = (x, y, flip) => { let s = '<g transform="translate(' + x + " " + y + ")" + (flip ? " scale(-1 1)" : "") + '">'; for (let i = 0; i < 7; i++) s += '<circle cx="' + (-16 + (i % 4) * 10) + '" cy="' + (-14 - (i > 3 ? 8 : 0)) + '" r="9" fill="#f4f1ea"/>'; return s + '<ellipse cx="20" cy="-20" rx="7" ry="9" fill="#3b3330"/><path d="M-12-6v8M8-6v8" stroke="#3b3330" stroke-width="3"/></g>'; };
      n += sheep(cx - 150, base + 14) + sheep(cx + 160, base + 18, true);
      return hot("The Nativity: baby Jesus in the manger", "This is the heart of Christmas: Jesus, born in Bethlehem and laid in a manger, with Mary and Joseph. “For unto you is born this day in the city of David a Saviour, which is Christ the Lord.” (Luke 2:11)", n);
    }

    function snowman(x, base, s, name) {
      let m = shadow(x, base + 3, 40 * s, 7 * s, 0.25);
      m += '<circle cx="' + x + '" cy="' + (base - 30 * s) + '" r="' + 32 * s + '" fill="url(#xs-ball)"/><circle cx="' + x + '" cy="' + (base - 78 * s) + '" r="' + 23 * s + '" fill="url(#xs-ball)"/><circle cx="' + x + '" cy="' + (base - 114 * s) + '" r="' + 17 * s + '" fill="url(#xs-ball)"/>';
      m += '<path d="M' + (x - 20 * s) + " " + (base - 82 * s) + "l-" + 34 * s + " -" + 22 * s + "M" + (x - 42 * s) + " " + (base - 98 * s) + "l-" + 8 * s + " -" + 6 * s + "M" + (x + 20 * s) + " " + (base - 82 * s) + "l" + 34 * s + " -" + 26 * s + '" stroke="#5a3a1e" stroke-width="' + 3.5 * s + '" stroke-linecap="round"/>';
      m += '<circle cx="' + (x - 6 * s) + '" cy="' + (base - 118 * s) + '" r="' + 2.4 * s + '" fill="#222"/><circle cx="' + (x + 6 * s) + '" cy="' + (base - 118 * s) + '" r="' + 2.4 * s + '" fill="#222"/><path d="M' + x + " " + (base - 112 * s) + "l" + 16 * s + " " + 3 * s + "l-" + 16 * s + " " + 3 * s + 'z" fill="#f08c2a"/>';
      for (let i = 0; i < 5; i++) m += '<circle cx="' + f1(x - 8 * s + i * 4 * s) + '" cy="' + f1(base - 104 * s + Math.sin(i / 4 * Math.PI) * 3 * s) + '" r="' + 1.4 * s + '" fill="#222"/>';
      m += '<circle cx="' + x + '" cy="' + (base - 84 * s) + '" r="' + 2.6 * s + '" fill="#222"/><circle cx="' + x + '" cy="' + (base - 72 * s) + '" r="' + 2.6 * s + '" fill="#222"/>';
      m += '<path d="M' + (x - 18 * s) + " " + (base - 98 * s) + "q" + 18 * s + " " + 8 * s + " " + 36 * s + " 0l-2 " + 7 * s + "q-" + 16 * s + " " + 7 * s + " -" + 32 * s + ' 0z" fill="#c62828"/><path d="M' + (x + 10 * s) + " " + (base - 94 * s) + "l" + 4 * s + " " + 24 * s + "l" + 8 * s + " -" + 2 * s + "l-" + 4 * s + " -" + 22 * s + 'z" fill="#c62828"/>';
      m += '<g class="hs-hat"><rect x="' + (x - 20 * s) + '" y="' + (base - 133 * s) + '" width="' + 40 * s + '" height="' + 5 * s + '" rx="2" fill="#1d1d24"/><rect x="' + (x - 13 * s) + '" y="' + (base - 160 * s) + '" width="' + 26 * s + '" height="' + 28 * s + '" fill="#1d1d24"/><rect x="' + (x - 13 * s) + '" y="' + (base - 140 * s) + '" width="' + 26 * s + '" height="' + 5 * s + '" fill="#2e7d32"/><circle cx="' + (x + 8 * s) + '" cy="' + (base - 140 * s) + '" r="' + 3 * s + '" fill="#c62828"/></g>';
      return hot(name, "Brrr! A friendly snowman tips his hat to you. Merry Christmas!", m, "tip");
    }

    // Foreground
    let near = '<path d="M760 640Q720 700 650 800H950Q880 700 840 640Z" fill="#dfe8f6"/>';
    for (let i = 0; i < 14; i++) { const t = i / 14, x = 800 + Math.sin(i * 1.7) * 18 * (1 + t * 3), y = 650 + t * 140; near += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(3 + t * 4) + '" ry="' + f1(1.6 + t * 2) + '" fill="#b9c9e2"/>'; }
    near += '<path d="M0 704Q400 668 760 706T1600 690V800H0Z" fill="url(#xs-snow)"/><path d="M0 712Q400 676 760 714T1600 698" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>';
    for (let i = 0; i < 40; i++) near += '<circle cx="' + f1(R() * W) + '" cy="' + f1(712 + R() * 85) + '" r="1.3" fill="#fff" class="hs-twinkle" style="animation-delay:' + f1(-R() * 4) + 's"/>';
    // fence with garland
    let fence = "";
    for (let x = 1290; x <= 1600; x += 52) fence += '<rect x="' + x + '" y="650" width="10" height="64" rx="2" fill="#6b4423"/><rect x="' + (x - 2) + '" y="646" width="14" height="6" rx="3" fill="#f6f9ff"/><path d="M' + (x + 5) + ' 664l-6-4v8zm0 0l6-4v8z" fill="#c62828"/>';
    fence += '<rect x="1290" y="668" width="320" height="8" fill="#7a5230"/><rect x="1290" y="692" width="320" height="8" fill="#7a5230"/>';
    for (let x = 1295; x < 1600; x += 52) fence += '<path d="M' + x + " 664Q" + (x + 26) + " 686 " + (x + 52) + ' 664" stroke="#1f5e33" stroke-width="7" fill="none" stroke-linecap="round"/>';

    // Walkers: carolers, a child with a sled, a family with a dog
    const carolers = person(0, 0, { coat: "#b3202a", scarf: "#f3f3f3", hat: "beanie", hatc: "#1f5e33", book: true }) + person(30, 2, { coat: "#1f4e8a", scarf: "#d4af37", hat: "top", book: true, skin: "#8d5a3b" }) + person(60, 0, { coat: "#2e7d32", scarf: "#c62828", hat: "hair", hatc: "#6b3e1e", book: true, h: 52 });
    const sledKid = person(0, 0, { coat: "#7b3fa0", scarf: "#ffd54f", hat: "beanie", hatc: "#ff7043", h: 40, skin: "#c98e63" }) + '<path d="M-6-24l-34 18" stroke="#5a3a1e" stroke-width="1.5"/><rect x="-74" y="-12" width="40" height="7" rx="3" fill="#b3202a"/><path d="M-78-2h46q6 0 6-6" stroke="#3b3b3b" stroke-width="2.5" fill="none"/><rect x="-66" y="-30" width="22" height="18" fill="#1e88e5"/><rect x="-57" y="-30" width="4" height="18" fill="#ffd54f"/>';
    const family = person(0, 0, { coat: "#5d4037", scarf: "#e53935", hat: "cap", hatc: "#263238", skin: "#a86f4c" }) + person(28, 0, { coat: "#ad1457", scarf: "#fff", hat: "beanie", hatc: "#fff" }) + person(52, 0, { coat: "#0277bd", scarf: "#ffeb3b", hat: "beanie", hatc: "#e53935", h: 36 }) + '<g transform="translate(78 0)"><ellipse cx="0" cy="-12" rx="13" ry="7" fill="#c98a4b"/><circle cx="12" cy="-18" r="6" fill="#c98a4b"/><path d="M14-22l3-6 2 6z" fill="#8a5a2b"/><path d="M-12-14q-8-6-6-12" stroke="#c98a4b" stroke-width="3" fill="none"/><g class="hs-leg-a"><rect x="-9" y="-7" width="3" height="7" fill="#a86f38"/></g><g class="hs-leg-b"><rect x="6" y="-7" width="3" height="7" fill="#a86f38"/></g><path d="M-30-30q16 8 32 10" stroke="#e53935" stroke-width="1.2" fill="none"/></g>';
    const walkers = walker(carolers, "r", 64, -8, 752) + walker(sledKid, "l", 52, -30, 770) + walker(family, "r", 80, -52, 786);

    const svg = '<svg class="hs-svg" viewBox="0 0 ' + W + " " + Ht + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="An animated Christmas village at night with the Nativity scene, a big Christmas tree, snowy cottages, and the Star of Bethlehem"><defs>' + defs + "</defs>" +
      sky + layer(0.08, star) + layer(0.12, mts) + layer(0.25, far) +
      '<g class="hs-title" aria-hidden="true"><text x="800" y="205" text-anchor="middle" class="hs-title-big" fill="#fff6d8">Merry Christmas!</text><text x="800" y="240" text-anchor="middle" class="hs-title-small" fill="#dfe9ff">Glory to God in the highest, and on earth peace, good will toward men. (Luke 2:14)</text></g>' +
      layer(0.4, mid2 + mid) + layer(0.55, lamp(1015, 666, 1) + lamp(612, 672, 0.95) + lamp(1255, 690, 1.05) + bigTree(450, 672) + '<g transform="translate(800 648) scale(1.32) translate(-800 -648)">' + nativity(800, 648) + "</g>") +
      layer(0.8, near + fence + snowman(1180, 742, 1, "The snowman") + snowman(300, 760, 0.8, "The little snowman") + walkers) +
      layer(1.1, evergreen(40, 830, 360, { snow: true, c1: "#0e2c1c", c2: "#123724" }) + evergreen(1585, 840, 380, { snow: true, c1: "#0e2c1c", c2: "#123724" }) + evergreen(150, 840, 220, { snow: true, c1: "#0f301e", c2: "#14402a" })) +
      '<rect width="' + W + '" height="' + Ht + '" fill="url(#xs-vig)" pointer-events="none"/></svg>';
    return build("christmas", "diorama", svg, o, {
      label: "Christmas village scene", title: "Merry Christmas! A Christmas village",
      hint: "Welcome to our Christmas village! Click the manger, the tree, the star, the cottages, or the snowmen to explore.",
      fx: (cv) => o.Particles(cv, "snow", o.lowPower ? 70 : 140, { scale: 1.15 })
    });
  }

  /* ---------------- EASTER: the resurrection garden ---------------- */
  function easter(o) {
    R = H.seeded(3104);
    const W = 1600, Ht = 800, c = o.ctx;
    let defs = softDefs +
      '<linearGradient id="es-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb2e8"/><stop offset=".42" stop-color="#b9d8ee"/><stop offset=".7" stop-color="#ffd9a8"/><stop offset="1" stop-color="#ffb86b"/></linearGradient>' +
      '<radialGradient id="es-sun"><stop offset="0" stop-color="#fffbe6"/><stop offset=".2" stop-color="#fff0b3"/><stop offset=".5" stop-color="#ffd36b" stop-opacity=".45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="es-ray" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff5c8" stop-opacity=".55"/><stop offset="1" stop-color="#fff5c8" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="es-tomb"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffe082" stop-opacity=".8"/><stop offset="1" stop-color="#ffcc66" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="es-rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8b8a2"/><stop offset="1" stop-color="#8c7a66"/></linearGradient>' +
      '<radialGradient id="es-stone" cx=".38" cy=".35"><stop offset="0" stop-color="#bcae9b"/><stop offset="1" stop-color="#7d6e5d"/></radialGradient>' +
      '<linearGradient id="es-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc46a"/><stop offset="1" stop-color="#3f8a3a"/></linearGradient>' +
      '<linearGradient id="es-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".55" stop-color="#ffd54f"/><stop offset="1" stop-color="#e0a321"/></linearGradient>';
    let sky = '<rect width="' + W + '" height="' + Ht + '" fill="url(#es-sky)"/>';
    // Sun + rays
    let rays = "";
    for (let i = 0; i < 18; i++) { const a = -Math.PI + (i / 17) * Math.PI, w = 0.045; rays += '<polygon points="1130,330 ' + f1(1130 + Math.cos(a - w) * 1100) + "," + f1(330 + Math.sin(a - w) * 1100) + " " + f1(1130 + Math.cos(a + w) * 1100) + "," + f1(330 + Math.sin(a + w) * 1100) + '" fill="#fff6d0" opacity="' + (i % 2 ? 0.1 : 0.18) + '"/>'; }
    const sun = hot("The rising sun", "Jesus rose very early in the morning, as the sun was rising. Each sunrise can remind us that He is alive! (Mark 16:2)",
      '<g class="hs-rays">' + rays + '</g><circle cx="1130" cy="330" r="330" fill="url(#es-sun)" class="hs-pulse"/><circle cx="1130" cy="330" r="70" fill="#fff8d8"/>');
    let clouds = '<g class="hs-drift">' + cloud(260, 140, 1.4, "#fff3f0") + cloud(1420, 110, 1.1, "#fff6ea") + "</g>" + '<g class="hs-drift hs-drift2">' + cloud(720, 90, 0.9, "#ffeef2") + cloud(1000, 210, 0.8, "#fff") + "</g>";
    // Birds
    let birds = "";
    for (let i = 0; i < 6; i++) birds += walker('<g class="hs-flap"><path d="M-14 0q7-9 14 0q7-9 14 0" stroke="#4a4a5a" stroke-width="3" fill="none" stroke-linecap="round"/></g>', "r", 34 + i * 6, -i * 7, 170 + (i % 3) * 50 + i * 6);
    // Hills
    let hills = '<path d="M0 500Q260 430 520 470T1040 460T1600 480V800H0Z" fill="#a9d49a"/><path d="M0 520Q320 470 700 500T1600 500V800H0Z" fill="#8cc47c"/>';
    // Calvary hill with three crosses
    const crossShape = (x, y, s) => '<path d="M' + (x - 5 * s) + " " + (y - 80 * s) + "h" + 10 * s + "v" + 22 * s + "h" + 24 * s + "v" + 9 * s + "h-" + 24 * s + "v" + 69 * s + "h-" + 10 * s + "v-" + 69 * s + "h-" + 24 * s + "v-" + 9 * s + "h" + 24 * s + 'z" fill="#4a3426"/><path d="M' + (x + 4 * s) + " " + (y - 80 * s) + "v" + 80 * s + '" stroke="#ffd98a" stroke-width="' + 1.6 * s + '" opacity=".7"/>';
    const calvary = hot("The three crosses", "Jesus died on the cross for our sins, between two others. But the cross is empty now! “For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.” (John 3:16)",
      '<path d="M180 540Q330 380 470 356Q610 380 780 540Z" fill="#7fae6a"/><path d="M180 540Q330 400 470 372Q610 400 780 540" stroke="#9cc98a" stroke-width="4" fill="none"/>' + crossShape(392, 384, 0.95) + crossShape(470, 362, 1.3) + crossShape(548, 384, 0.95) +
      '<path d="M460 262q8 30-4 58M480 262q-6 26 6 50" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".95"/><path d="M456 262h28" stroke="#fff" stroke-width="5" stroke-linecap="round"/>');
    // Garden ground
    let ground = '<path d="M0 580Q400 520 820 560T1600 540V800H0Z" fill="url(#es-grass)"/>';
    // Olive trees and a palm (gently swaying)
    function olive(x, y, s) {
      let t = '<g class="hs-sway" style="animation-delay:' + f1(-R() * 4) + 's">' + '<path d="M' + x + " " + y + "q-" + 8 * s + " -" + 40 * s + " " + 6 * s + " -" + 70 * s + "q" + 10 * s + " -" + 20 * s + " -" + 4 * s + " -" + 50 * s + "M" + (x + 4 * s) + " " + (y - 68 * s) + "q" + 24 * s + " -" + 10 * s + " " + 30 * s + " -" + 40 * s + '" stroke="#6b5440" stroke-width="' + 11 * s + '" fill="none" stroke-linecap="round"/>';
      for (let i = 0; i < 9; i++) t += '<ellipse cx="' + f1(x + (R() * 2 - 1) * 70 * s) + '" cy="' + f1(y - 120 * s - R() * 60 * s) + '" rx="' + f1((34 + R() * 20) * s) + '" ry="' + f1((22 + R() * 10) * s) + '" fill="' + pick(["#7a9a6a", "#8aac78", "#6b8a5e", "#93b383"]) + '"/>';
      return t + "</g>";
    }
    function palm(x, y, s) {
      let t = '<g class="hs-sway" style="animation-delay:-1.3s"><path d="M' + x + " " + y + "q" + 10 * s + " -" + 110 * s + " " + 30 * s + " -" + 200 * s + '" stroke="#8a6d4e" stroke-width="' + 12 * s + '" fill="none"/>';
      const tx = x + 30 * s, ty = y - 200 * s;
      [[-150, 1], [-110, 1], [-60, 1], [-20, 1], [20, 1], [-180, 1]].forEach(([a]) => { const ar = a * Math.PI / 180; t += '<path d="M' + tx + " " + ty + "q" + f1(Math.cos(ar) * 50 * s) + " " + f1(Math.sin(ar) * 50 * s - 20 * s) + " " + f1(Math.cos(ar) * 100 * s) + " " + f1(Math.sin(ar) * 100 * s + 30 * s) + '" stroke="#4f8a3e" stroke-width="' + 11 * s + '" fill="none" stroke-linecap="round"/>'; });
      return t + "</g>";
    }
    // The tomb
    const tomb = hot("The empty tomb", "The stone is rolled away and the tomb is empty! The angel said, “He is not here: for he is risen, as he said. Come, see the place where the Lord lay.” (Matthew 28:6)",
      '<polygon points="1060,630 940,610 1000,540" fill="url(#es-tomb)" opacity=".7"/>' +
      '<path d="M960 650Q950 470 1060 410Q1180 350 1330 390Q1460 430 1480 560L1490 650Z" fill="url(#es-rock)"/>' +
      '<path d="M990 520Q1100 470 1220 480M1010 590Q1150 560 1300 570M1250 420Q1380 440 1450 520" stroke="#7d6c5a" stroke-width="4" fill="none" opacity=".5"/>' +
      '<path d="M1090 650V560Q1090 500 1150 500Q1210 500 1210 560V650Z" fill="#2a221c"/>' +
      '<ellipse cx="1150" cy="590" rx="90" ry="80" fill="url(#es-tomb)" class="hs-pulse"/>' +
      '<rect x="1160" y="615" width="38" height="12" rx="3" fill="#fbf6ea"/><rect x="1164" y="607" width="28" height="9" rx="3" fill="#f3ecdc"/>' +
      '<path d="M1080 650Q1150 640 1220 650" stroke="#6b5a48" stroke-width="5" fill="none"/>' +
      '<g class="hs-ivy">' + (() => { let v = ""; for (let i = 0; i < 26; i++) { const t = i / 25; v += '<ellipse cx="' + f1(980 + t * 480) + '" cy="' + f1(612 - Math.sin(t * Math.PI) * 30 + R() * 30) + '" rx="9" ry="5" fill="' + pick(["#5fae4c", "#4f9a42", "#7cc46a"]) + '" transform="rotate(' + f1(R() * 180) + " " + f1(980 + t * 480) + " " + f1(612 - Math.sin(t * Math.PI) * 30) + ')"/>'; } return v; })() + "</g>" +
      shadow(1335, 660, 90, 12, 0.35) + '<circle cx="1330" cy="590" r="74" fill="url(#es-stone)"/><circle cx="1330" cy="590" r="74" fill="none" stroke="#6b5d4e" stroke-width="5"/><path d="M1290 560q20-14 46-8" stroke="#d8ccb8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>' +
      '<path d="M1215 660q50-10 100 0" stroke="#7a6a54" stroke-width="3" stroke-dasharray="8 6" fill="none"/>');
    // Path stones
    let path = "";
    for (let i = 0; i < 9; i++) { const t = i / 8, x = 1150 - t * 340 + Math.sin(t * 5) * 30, y = 668 + t * 120; path += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(20 + t * 26) + '" ry="' + f1(7 + t * 9) + '" fill="#d8ccb8" stroke="#b5a68e" stroke-width="2"/>'; }
    // Flowers
    function tulip(x, y, h, col) { return '<g class="hs-fsway" style="animation-delay:' + f1(-R() * 3) + 's"><path d="M' + f1(x) + " " + f1(y) + "q-2-" + f1(h / 2) + " 0-" + f1(h) + '" stroke="#3f8a3a" stroke-width="3" fill="none"/><path d="M' + f1(x) + " " + f1(y - h * 0.3) + "q-12-10-10-24 6 8 10 20" + '" fill="#4f9a42"/><path d="M' + f1(x - 8) + " " + f1(y - h) + "q0 12 8 12 8 0 8-12l-4 4-4-6-4 6z" + '" fill="' + col + '"/></g>'; }
    function lily(x, y, h) { return '<g class="hs-fsway" style="animation-delay:' + f1(-R() * 3) + 's"><path d="M' + f1(x) + " " + f1(y) + "q4-" + f1(h / 2) + " -2-" + f1(h) + '" stroke="#3f8a3a" stroke-width="3" fill="none"/><path d="M' + f1(x - 2) + " " + f1(y - h) + "l-14-6q4 10 14 14 10-4 14-14z" + '" fill="#fff"/><path d="M' + f1(x - 2) + " " + f1(y - h) + "l-6-16 6 6 6-6z" + '" fill="#fbf8ee"/><circle cx="' + f1(x - 2) + '" cy="' + f1(y - h - 2) + '" r="2" fill="#f4c542"/><path d="M' + f1(x) + " " + f1(y - h * 0.4) + "q14-8 18-24-12 6-18 20" + '" fill="#4f9a42"/></g>'; }
    function daisy(x, y, h, col) { return '<g class="hs-fsway" style="animation-delay:' + f1(-R() * 3) + 's"><path d="M' + f1(x) + " " + f1(y) + "v-" + f1(h) + '" stroke="#3f8a3a" stroke-width="2.5"/>' + H.flower(f1(x), f1(y - h), 4.5, col, "#f4c542") + "</g>"; }
    let beds = "", bedsFront = "";
    for (let i = 0; i < 70; i++) {
      const x = R() * W, y = 600 + R() * 70, h = 26 + R() * 22, k = R();
      if (x > 940 && x < 1500 && y < 660) continue;
      beds += k < 0.35 ? tulip(x, y, h, pick(["#e53970", "#ff7aa8", "#ffd54f", "#b388ff", "#ff8a65"])) : k < 0.6 ? lily(x, y, h) : daisy(x, y, h * 0.8, pick(["#fff", "#ffd1e1", "#e9d8ff"]));
    }
    for (let i = 0; i < 60; i++) {
      const x = R() * W, y = 730 + R() * 70, h = 40 + R() * 34, k = R();
      bedsFront += k < 0.4 ? tulip(x, y, h, pick(["#e53970", "#ff7aa8", "#ffd54f", "#b388ff", "#ff8a65", "#fff"])) : k < 0.7 ? lily(x, y, h * 1.1) : daisy(x, y, h * 0.8, pick(["#fff", "#ffd1e1", "#e9d8ff", "#fff3b0"]));
    }
    let grass = "";
    for (let i = 0; i < 160; i++) { const x = R() * W, y = 690 + R() * 110; grass += '<path d="M' + f1(x) + " " + f1(y) + "q2-10-3-18M" + f1(x + 4) + " " + f1(y) + 'q-1-8 4-14" stroke="' + pick(["#3f8a3a", "#4f9a42", "#5fae4c"]) + '" stroke-width="2" fill="none"/>'; }
    const lilyBed = hot("The Easter lilies", "White lilies are a favorite Easter flower. They remind us of new life! Jesus said, “Consider the lilies of the field, how they grow.” (Matthew 6:28)",
      '<g>' + lily(300, 740, 70) + lily(330, 748, 84) + lily(360, 738, 66) + lily(390, 750, 78) + lily(270, 752, 60) + "</g>");
    // Butterflies (fly along gentle loops)
    function butterfly(col, col2, path, dur, delay) {
      return '<g><g class="hs-bfly"><g class="hs-wing"><path d="M0 0q-18-22-26-6-4 12 26 6zM0 0q-16 18-22 8-2-10 22-8z" fill="' + col + '"/><path d="M0 0q18-22 26-6 4 12-26 6zM0 0q16 18 22 8 2-10-22-8z" fill="' + col + '"/><circle cx="-14" cy="-7" r="3" fill="' + col2 + '"/><circle cx="14" cy="-7" r="3" fill="' + col2 + '"/></g><ellipse cx="0" cy="0" rx="2.2" ry="9" fill="#3b2a1d"/></g><animateMotion dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite" path="' + path + '"/></g>';
    }
    const bflies = butterfly("#ffb74d", "#fff", "M200 640C320 520 480 600 560 520S760 600 640 680 300 720 200 640Z", 22, -3) +
      butterfly("#ba68c8", "#ffe082", "M900 700C980 600 1100 640 1060 560S860 520 820 600 840 760 900 700Z", 26, -8) +
      butterfly("#4fc3f7", "#fff", "M1400 720C1500 640 1560 700 1520 620S1340 600 1360 680 1320 780 1400 720Z", 19, -1) +
      butterfly("#f06292", "#fff", "M600 740C700 660 860 700 820 640S620 620 560 680 520 780 600 740Z", 24, -12) +
      butterfly("#fff176", "#ff8a65", "M120 520C220 460 360 480 320 420S100 400 80 460 40 560 120 520Z", 28, -5);
    const butterflyHot = hot("The butterflies", "A caterpillar wraps itself up and comes out as a beautiful butterfly. The Bible says, “If any man be in Christ, he is a new creature.” (2 Corinthians 5:17)", '<circle cx="80" cy="460" r="0" fill="none"/>' + bflies);
    const svg = '<svg class="hs-svg" viewBox="0 0 ' + W + " " + Ht + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="An animated Easter garden at sunrise with the empty tomb, the stone rolled away, three crosses on a hill, flowers, butterflies, and birds"><defs>' + defs + "</defs>" +
      sky + layer(0.05, sun) + layer(0.1, clouds + birds) +
      '<g class="hs-title" aria-hidden="true">' + (c.beforeDay ? '<text x="800" y="96" text-anchor="middle" class="hs-title-small" fill="#5b4590">Easter Sunday is coming!</text>' : "") +
      '<text x="800" y="178" text-anchor="middle" class="hs-title-big hs-title-easter" fill="url(#es-gold)" stroke="#a8741a" stroke-width="2">He Is Risen!</text><text x="800" y="222" text-anchor="middle" class="hs-title-small" fill="#5b3f12">He is not here: for he is risen, as he said. (Matthew 28:6)</text></g>' +
      layer(0.2, hills) + layer(0.3, calvary) + layer(0.45, ground + olive(760, 590, 0.9) + palm(900, 600, 0.9) + tomb) +
      layer(0.6, path + beds + olive(110, 690, 1.2) + olive(1530, 700, 1.15)) +
      layer(0.85, grass + bedsFront + lilyBed + butterflyHot) + "</svg>";
    return build("easter", "diorama", svg, o, {
      label: "Easter resurrection garden scene", title: c.beforeDay ? "Holy Week: the resurrection garden" : "He Is Risen! The resurrection garden",
      hint: "Welcome to the resurrection garden! Click the empty tomb, the crosses, the sun, the lilies, or a butterfly to explore.",
      fx: (cv) => o.Particles(cv, "petals", o.lowPower ? 16 : 30, { scale: 1.3 })
    });
  }

  /* ---------------- INDEPENDENCE DAY: the town square ---------------- */
  function independence(o) {
    R = H.seeded(1776);
    const W = 1600, Ht = 800, c = o.ctx, yrs = c.america;
    let defs = softDefs +
      '<linearGradient id="is-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070f2e"/><stop offset=".45" stop-color="#1d2460"/><stop offset=".72" stop-color="#6a3a72"/><stop offset="1" stop-color="#e0786a"/></linearGradient>' +
      '<linearGradient id="is-brick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c4434"/><stop offset="1" stop-color="#6f2c22"/></linearGradient>' +
      '<linearGradient id="is-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#f0a845"/></linearGradient>' +
      '<radialGradient id="is-pool"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="is-bell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b4a22"/><stop offset=".45" stop-color="#c79a52"/><stop offset="1" stop-color="#5a3c1a"/></linearGradient>';
    let sky = '<rect width="' + W + '" height="' + Ht + '" fill="url(#is-sky)"/>';
    for (let i = 0; i < 90; i++) sky += '<circle cx="' + f1(R() * W) + '" cy="' + f1(R() * R() * 380) + '" r="' + f1(0.5 + R() * 1.3) + '" fill="#fff" class="hs-twinkle" style="animation-delay:' + f1(-R() * 4) + 's"/>';
    // Landmarks far away
    const sil = "#363b7c";
    let far = '<path d="M0 560Q400 520 800 540T1600 530V800H0Z" fill="#2a2b5c"/>';
    far += hot("The Washington Monument", "The Washington Monument in our capital honors George Washington, our first president. At the top of it are the Latin words “Laus Deo,” which mean “Praise be to God.”",
      '<g transform="translate(292 552) scale(1.35) translate(-292 -552)">' + '<path d="M272 552L282 250 292 236 302 250 312 552Z" fill="' + sil + '"/><path d="M292 236l10 14h-20z" fill="#3a3d7a"/><circle cx="292" cy="246" r="2.5" fill="#ff5a5a" class="hs-twinkle"/>' + '</g>');
    far += hot("The U.S. Capitol", "The Capitol building is where Congress meets to make our nation's laws.",
      '<g transform="translate(1330 552) scale(1.6) translate(-1330 -552)">' + '<rect x="1180" y="480" width="300" height="70" fill="' + sil + '"/><rect x="1270" y="440" width="120" height="44" fill="' + sil + '"/><path d="M1280 442Q1330 352 1380 442Z" fill="' + sil + '"/><rect x="1322" y="352" width="16" height="24" fill="' + sil + '"/><path d="M1330 336v18" stroke="' + sil + '" stroke-width="5"/>' + (() => { let k = ""; for (let x = 1190; x < 1480; x += 14) k += '<rect x="' + x + '" y="492" width="5" height="44" fill="#2e3270"/>'; return k; })() + '</g>');
    far += hot("The Statue of Liberty", "The Statue of Liberty holds up her torch to welcome people coming to America, the land of the free.",
      '<g transform="translate(120 552) scale(1.7) translate(-120 -552)">' + '<rect x="80" y="470" width="80" height="80" fill="' + sil + '"/><rect x="96" y="440" width="48" height="32" fill="' + sil + '"/><path d="M106 440L112 360Q120 344 128 360L134 440Z" fill="' + sil + '"/><circle cx="120" cy="346" r="11" fill="' + sil + '"/><path d="M110 340l-6-10M116 336l-2-12M124 336l2-12M130 340l6-10" stroke="' + sil + '" stroke-width="3"/><path d="M128 364L142 306" stroke="' + sil + '" stroke-width="8" stroke-linecap="round"/><path d="M137 306h10l-5-10z" fill="' + sil + '"/><ellipse cx="142" cy="292" rx="5" ry="8" fill="#ffcf5a" class="hs-flicker"/><path d="M106 380l-8 16 10 2z" fill="' + sil + '"/>' + '</g>');
    for (let i = 0; i < 46; i++) { const x = R() * W, y = 552 + R() * 6; far += '<ellipse cx="' + f1(x) + '" cy="' + f1(y - 16) + '" rx="' + f1(16 + R() * 18) + '" ry="' + f1(14 + R() * 10) + '" fill="#232552"/>'; }
    // Town square buildings
    function store(x, w, h, col, awn, base) {
      base = base || 660;
      let s = '<rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" fill="' + col + '"/><rect x="' + (x - 6) + '" y="' + (base - h - 12) + '" width="' + (w + 12) + '" height="14" fill="#e9e2d0"/>';
      for (let r = 0; r < Math.floor((h - 90) / 60); r++) for (let k = 0; k < Math.floor(w / 46); k++) s += '<rect x="' + (x + 14 + k * 46) + '" y="' + (base - h + 22 + r * 60) + '" width="24" height="34" fill="url(#is-win)" class="' + (R() < 0.3 ? "hs-flicker" : "") + '" style="animation-delay:' + f1(-R() * 5) + 's"/><path d="M' + (x + 26 + k * 46) + " " + (base - h + 22 + r * 60) + "v34" + '" stroke="#e9e2d0" stroke-width="2"/>';
      // bunting fan under the top windows
      const fx = x + w / 2;
      s += '<path d="M' + (fx - 40) + " " + (base - h + 4) + "a40 30 0 0 0 80 0z" + '" fill="#b22234"/><path d="M' + (fx - 28) + " " + (base - h + 4) + "a28 21 0 0 0 56 0z" + '" fill="#fff"/><path d="M' + (fx - 16) + " " + (base - h + 4) + "a16 12 0 0 0 32 0z" + '" fill="#1f3a6e"/><polygon points="' + H.starPts(fx, base - h + 9, 4, 1.7) + '" fill="#fff"/>';
      // awning + shop window
      s += '<rect x="' + (x + 10) + '" y="' + (base - 70) + '" width="' + (w - 20) + '" height="60" fill="url(#is-win)" opacity=".95"/><rect x="' + (x + 10) + '" y="' + (base - 10) + '" width="' + (w - 20) + '" height="10" fill="#3a2a22"/>';
      let stripes = ""; for (let i = 0; i < (w - 4) / 16; i++) stripes += '<path d="M' + (x + 2 + i * 16) + " " + (base - 88) + "h16v22a8 8 0 0 1-16 0z" + '" fill="' + (i % 2 ? "#fff" : awn) + '"/>';
      s += stripes + '<ellipse cx="' + (x + w / 2) + '" cy="' + (base + 12) + '" rx="' + w * 0.5 + '" ry="16" fill="url(#is-pool)"/>';
      return s;
    }
    let town = store(0, 180, 250, "url(#is-brick)", "#b22234") + store(176, 160, 300, "#e2d6bb", "#1f3a6e") + store(332, 150, 220, "#56708f", "#b22234") +
      store(1080, 150, 230, "#c9b48a", "#1f3a6e") + store(1226, 170, 290, "url(#is-brick)", "#b22234") + store(1392, 210, 250, "#7d8b6a", "#1f3a6e");
    // Independence Hall in the middle
    let hall = '<rect x="560" y="470" width="480" height="190" fill="url(#is-brick)"/><rect x="552" y="458" width="496" height="14" fill="#e9e2d0"/><path d="M552 458L600 430H1000L1048 458Z" fill="#5a3a2e"/>';
    for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) { if (k === 4) continue; hall += '<rect x="' + (578 + k * 50) + '" y="' + (486 + r * 78) + '" width="26" height="46" fill="url(#is-win)"/><path d="M' + (591 + k * 50) + " " + (486 + r * 78) + 'v46M' + (578 + k * 50) + " " + (509 + r * 78) + 'h26" stroke="#f3eee0" stroke-width="2.5"/><rect x="' + (574 + k * 50) + '" y="' + (480 + r * 78) + '" width="34" height="6" fill="#f3eee0"/>'; }
    hall += '<rect x="760" y="340" width="80" height="320" fill="#8f3d2f"/><rect x="752" y="330" width="96" height="12" fill="#e9e2d0"/>';
    hall += '<path d="M780 660v-60q20-26 40 0v60z" fill="#f3eee0"/><path d="M786 660v-56q14-18 28 0v56z" fill="#4a2a20"/>';
    hall += '<rect x="772" y="262" width="56" height="70" fill="#f3eee0"/><circle cx="800" cy="296" r="20" fill="#fff" stroke="#5a3a2e" stroke-width="3"/><path d="M800 296v-13M800 296l9 5" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>';
    hall += '<rect x="780" y="210" width="40" height="54" fill="#f3eee0"/><path d="M778 212h44l-4-6h-36z" fill="#d8d0bc"/><rect x="790" y="222" width="20" height="30" rx="10" fill="#2c3550"/><rect x="786" y="170" width="28" height="42" fill="#f3eee0"/><path d="M784 172Q800 140 816 172Z" fill="#e9e2d0"/><path d="M800 104V150" stroke="#e9e2d0" stroke-width="5"/><circle cx="800" cy="104" r="5" fill="#d4af37"/>';
    hall += '<ellipse cx="800" cy="676" rx="300" ry="22" fill="url(#is-pool)"/>';
    for (let k = 0; k < 4; k++) { const fx = 600 + k * 130 + (k > 1 ? 70 : 0); hall += '<path d="M' + (fx - 30) + " 474a30 22 0 0 0 60 0z" + '" fill="#b22234"/><path d="M' + (fx - 20) + " 474a20 15 0 0 0 40 0z" + '" fill="#fff"/><path d="M' + (fx - 10) + " 474a10 8 0 0 0 20 0z" + '" fill="#1f3a6e"/>'; }
    const hallHot = hot("Independence Hall", "This is Independence Hall in Philadelphia, where the Declaration of Independence was signed on July 4, 1776. This year America is " + yrs + " years old!", hall);
    // String lights across the square
    function lights(x1, y1, x2, y2, sag) {
      let s = '<path d="M' + x1 + " " + y1 + "Q" + (x1 + x2) / 2 + " " + ((y1 + y2) / 2 + sag) + " " + x2 + " " + y2 + '" stroke="#1a1a2a" stroke-width="2" fill="none"/>';
      for (let i = 1; i < 18; i++) { const t = i / 18, x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2, y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * ((y1 + y2) / 2 + sag) + t * t * y2; const col = ["#ff4d4d", "#ffffff", "#5c8dff"][i % 3]; s += '<g class="hs-tw' + (i % 3) + '"><circle cx="' + f1(x) + '" cy="' + f1(y + 5) + '" r="9" fill="' + col + '" opacity=".3"/><circle cx="' + f1(x) + '" cy="' + f1(y + 5) + '" r="3.6" fill="' + col + '"/></g>'; }
      return s;
    }
    let strings = lights(180, 380, 760, 350, 90) + lights(840, 350, 1400, 390, 90) + lights(0, 440, 560, 470, 60) + lights(1040, 470, 1600, 430, 60);
    // Flagpoles with big waving flags
    const flags = hot("The American flag", "Our flag has 50 stars for the 50 states and 13 stripes for the first 13 colonies. Red stands for courage, white for purity, and blue for justice.",
      '<rect x="466" y="260" width="7" height="410" fill="#d8dde6"/><circle cx="469.5" cy="256" r="7" fill="#d4af37"/>' + wavingFlag(473, 266, 200, o.still) +
      '<rect x="1127" y="260" width="7" height="410" fill="#d8dde6"/><circle cx="1130.5" cy="256" r="7" fill="#d4af37"/>' + wavingFlag(1134, 266, 200, o.still));
    // Liberty Bell
    const bell = hot("The Liberty Bell", "The Liberty Bell has a famous crack. Words from the Bible are written on it: “Proclaim liberty throughout all the land unto all the inhabitants thereof.” (Leviticus 25:10)",
      shadow(1320, 742, 80, 10, 0.4) + '<rect x="1240" y="602" width="160" height="14" fill="#6b4423"/><rect x="1248" y="616" width="12" height="126" fill="#6b4423"/><rect x="1380" y="616" width="12" height="126" fill="#6b4423"/>' +
      '<path d="M1320 622v10" stroke="#3b2a1d" stroke-width="6"/><path d="M1290 640q30-14 60 0l8 66q4 12 14 16h-104q10-4 14-16z" fill="url(#is-bell)"/><path d="M1276 716h88v10h-88z" fill="#8a6430"/><path d="M1300 668l6 10-4 10 6 12-3 10" stroke="#2a1a0e" stroke-width="2.5" fill="none"/><path d="M1296 660h48" stroke="#e5c27a" stroke-width="2" opacity=".6"/>');
    // Gazebo / bandstand
    let gaz = shadow(330, 736, 130, 12, 0.4) + '<rect x="210" y="700" width="240" height="30" fill="#e9e2d0"/><rect x="214" y="690" width="232" height="12" fill="#fff"/>';
    [222, 286, 374, 438].forEach((x) => { gaz += '<rect x="' + x + '" y="602" width="8" height="90" fill="#fff"/>'; });
    gaz += '<path d="M196 606L330 530 464 606Z" fill="#1f3a6e"/><path d="M196 606H464" stroke="#fff" stroke-width="6"/><path d="M330 530v-22" stroke="#fff" stroke-width="3"/><polygon points="' + H.starPts(330, 504, 9, 4) + '" fill="#d4af37"/>';
    gaz += '<path d="M226 610q28 26 56 0q28 26 48 0q20 26 48 0q28 26 56 0" stroke="#b22234" stroke-width="7" fill="none"/><path d="M226 618q28 22 56 0q28 22 48 0q20 22 48 0q28 22 56 0" stroke="#fff" stroke-width="4" fill="none"/>';
    gaz += '<rect x="236" y="660" width="188" height="6" fill="#fff"/>';
    for (let i = 0; i < 4; i++) gaz += '<g transform="translate(' + (250 + i * 44) + ' 694) scale(.7)"><circle cy="-50" r="9" fill="#e9b98f"/><path d="M-11-16Q-12-40 0-42Q12-40 11-16Z" fill="#1f3a6e"/><rect x="-8" y="-63" width="16" height="7" fill="#fff"/><rect x="-6" y="-16" width="12" height="16" fill="#fff"/><path d="M8-34l14-6" stroke="#d4af37" stroke-width="4"/></g>';
    const gazebo = hot("The bandstand", "A band is playing patriotic songs in the bandstand. Click the sky to set off fireworks!", gaz);
    // Crowd silhouettes in front
    let crowd = "";
    for (let i = 0; i < 34; i++) {
      const x = 20 + i * 47 + R() * 16, h = 46 + R() * 22, kid = R() < 0.28;
      crowd += '<g fill="#10142e"><circle cx="' + f1(x) + '" cy="' + f1(800 - h * (kid ? 0.62 : 1) + 10) + '" r="' + f1(kid ? 8 : 10) + '"/><path d="M' + f1(x - (kid ? 12 : 17)) + " 800Q" + f1(x - (kid ? 12 : 17)) + " " + f1(800 - h * (kid ? 0.55 : 0.85)) + " " + f1(x) + " " + f1(800 - h * (kid ? 0.55 : 0.85)) + "Q" + f1(x + (kid ? 12 : 17)) + " " + f1(800 - h * (kid ? 0.55 : 0.85)) + " " + f1(x + (kid ? 12 : 17)) + ' 800Z"/></g>';
      if (R() < 0.3) crowd += '<path d="M' + f1(x + 10) + " " + f1(800 - h * 0.6) + "l8-26" + '" stroke="#555" stroke-width="1.5"/><g transform="translate(' + f1(x + 17) + " " + f1(800 - h * 0.6 - 26) + ')"><g class="hs-wave" style="--a:1.5px"><rect width="16" height="10" fill="#b22234"/><rect y="3" width="16" height="2" fill="#fff"/><rect y="7" width="16" height="1.5" fill="#fff"/><rect width="7" height="5.5" fill="#3c3b6e"/></g></g>';
      else if (R() < 0.2) crowd += '<path d="M' + f1(x + 10) + " " + f1(800 - h * 0.5) + "l10-22" + '" stroke="#888" stroke-width="1.5"/><circle class="hs-spark" cx="' + f1(x + 20) + '" cy="' + f1(800 - h * 0.5 - 22) + '" r="6" fill="#fff3b0"/>';
    }
    const svg = '<svg class="hs-svg" viewBox="0 0 ' + W + " " + Ht + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="An animated Independence Day town square at night with Independence Hall, the Liberty Bell, waving American flags, landmarks, and fireworks"><defs>' + defs + "</defs>" +
      sky + '<g class="hs-title" aria-hidden="true"><text x="800" y="70" text-anchor="middle" class="hs-title-big hs-title-usa" fill="#fff">Happy Independence Day!</text><text x="800" y="100" text-anchor="middle" class="hs-title-small" fill="#ffd9d0">Celebrating ' + yrs + " years of freedom · 1776–" + (c.dayYear || c.y) + "</text></g>" +
      layer(0.1, far) + layer(0.3, town + hallHot) + layer(0.4, strings + flags) + '<path d="M0 660H1600V800H0Z" fill="#3a3a52"/><path d="M0 660H1600" stroke="#5a5a72" stroke-width="3"/>' +
      layer(0.6, (() => { let b = ""; for (let i = 0; i < 26; i++) b += '<rect x="' + (i * 64 - 10) + '" y="' + (668 + (i % 2) * 2) + '" width="60" height="3" fill="#47475f"/>'; return b; })() + gazebo + bell) +
      layer(0.9, crowd) + "</svg>";
    return build("independence", "diorama", svg, o, {
      label: "Independence Day town square scene", title: "Happy Independence Day! An American town square",
      hint: "Happy Fourth of July! Click the sky to launch fireworks, or click the Liberty Bell, Independence Hall, the flags, or the landmarks.",
      fireworks: true
    });
  }

  /* ---------------- THANKSGIVING: the autumn harvest ---------------- */
  function thanksgiving(o) {
    R = H.seeded(1621);
    const W = 1600, Ht = 800;
    let defs = softDefs +
      '<linearGradient id="ts-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#43306a"/><stop offset=".35" stop-color="#b8566b"/><stop offset=".65" stop-color="#f08a4b"/><stop offset="1" stop-color="#ffd08a"/></linearGradient>' +
      '<radialGradient id="ts-sun"><stop offset="0" stop-color="#fff4c9"/><stop offset=".25" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff9a4d" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ts-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#f0a845"/></linearGradient>' +
      '<radialGradient id="ts-pool"><stop offset="0" stop-color="#ffd98a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ts-pump" cx=".4" cy=".35"><stop offset="0" stop-color="#ffb04d"/><stop offset="1" stop-color="#d9641a"/></radialGradient>' +
      '<radialGradient id="ts-turkey" cx=".4" cy=".35"><stop offset="0" stop-color="#e8a24a"/><stop offset="1" stop-color="#9a5418"/></radialGradient>' +
      '<linearGradient id="ts-cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf1dd"/><stop offset="1" stop-color="#e8d6b2"/></linearGradient>' +
      '<linearGradient id="ts-field" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a441"/><stop offset="1" stop-color="#b9822a"/></linearGradient>';
    let sky = '<rect width="' + W + '" height="' + Ht + '" fill="url(#ts-sky)"/><circle cx="1240" cy="470" r="260" fill="url(#ts-sun)" class="hs-pulse"/><circle cx="1240" cy="470" r="70" fill="#fff1c4"/>';
    sky += '<g class="hs-drift"><path d="M80 160h360M200 180h300M900 130h280M1050 150h240" stroke="#ffc6a0" stroke-width="8" stroke-linecap="round" opacity=".5"/></g>';
    for (let i = 0; i < 5; i++) sky += walker('<g class="hs-flap"><path d="M-12 0q6-8 12 0q6-8 12 0" stroke="#3a2a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>', "l", 40 + i * 5, -i * 8, 150 + i * 22);
    // Far hills and fields
    let far = '<path d="M0 480Q300 410 640 450T1300 430T1600 460V800H0Z" fill="#9a6274"/><path d="M0 520Q360 460 760 500T1600 490V800H0Z" fill="#c07a46"/>';
    far += '<path d="M600 520Q900 470 1300 500L1600 500V600H500Z" fill="url(#ts-field)"/>';
    for (let i = 0; i < 14; i++) far += '<path d="M' + (560 + i * 80) + " 600L" + (720 + i * 66) + ' 488" stroke="#a8731f" stroke-width="3" opacity=".55"/>';
    for (let i = 0; i < 40; i++) { const x = R() * W, y = 470 + Math.sin(x / 200) * 10 + R() * 20; far += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="' + f1(14 + R() * 14) + '" ry="' + f1(12 + R() * 8) + '" fill="' + pick(["#b8361f", "#d9622b", "#e8a531", "#8a4b16", "#a6501c"]) + '"/>'; }
    // Farmhouse
    function farmhouse(x, base) {
      let h = shadow(x + 170, base + 6, 200, 14, 0.35) + '<ellipse cx="' + (x + 170) + '" cy="' + (base + 14) + '" rx="220" ry="26" fill="url(#ts-pool)"/>';
      h += '<rect x="' + (x + 250) + '" y="' + (base - 312) + '" width="26" height="120" fill="#8a3a2a"/><rect x="' + (x + 246) + '" y="' + (base - 316) + '" width="34" height="8" fill="#6b2a1e"/>';
      for (let i = 0; i < 3; i++) h += '<circle class="hs-smoke" cx="' + (x + 263) + '" cy="' + (base - 322) + '" r="' + (8 + i * 2) + '" fill="#efe2dc" filter="url(#hs-smokef)" style="animation-delay:' + (-i * 1.8) + 's"/>';
      h += '<rect x="' + x + '" y="' + (base - 200) + '" width="340" height="200" fill="#f1e6d2"/>';
      for (let y = base - 190; y < base; y += 14) h += '<path d="M' + x + " " + y + "h340" + '" stroke="#d8c8ac" stroke-width="2"/>';
      h += '<path d="M' + (x - 24) + " " + (base - 196) + "L" + (x + 170) + " " + (base - 300) + "L" + (x + 364) + " " + (base - 196) + 'Z" fill="#7d2a1f"/><path d="M' + (x - 24) + " " + (base - 196) + "L" + (x + 170) + " " + (base - 300) + "L" + (x + 364) + " " + (base - 196) + '" stroke="#5a1d15" stroke-width="6" fill="none"/>';
      h += '<rect x="' + (x + 148) + '" y="' + (base - 270) + '" width="44" height="44" fill="url(#ts-win)"/><path d="M' + (x + 170) + " " + (base - 270) + "v44M" + (x + 148) + " " + (base - 248) + 'h44" stroke="#f1e6d2" stroke-width="4"/>';
      [[x + 30], [x + 110], [x + 230], [x + 280]].forEach(([wx]) => { h += '<rect x="' + wx + '" y="' + (base - 176) + '" width="34" height="46" fill="url(#ts-win)" class="hs-flicker-soft"/><path d="M' + (wx + 17) + " " + (base - 176) + "v46M" + wx + " " + (base - 153) + 'h34" stroke="#f8f2e6" stroke-width="3"/><rect x="' + (wx - 8) + '" y="' + (base - 178) + '" width="8" height="50" fill="#2f5d4a"/><rect x="' + (wx + 34) + '" y="' + (base - 178) + '" width="8" height="50" fill="#2f5d4a"/>'; });
      // porch
      h += '<path d="M' + (x - 10) + " " + (base - 96) + "H" + (x + 350) + "L" + (x + 334) + " " + (base - 112) + "H" + (x + 6) + 'Z" fill="#6b2a20"/>';
      for (let k = 0; k < 6; k++) h += '<rect x="' + (x + 4 + k * 66) + '" y="' + (base - 96) + '" width="8" height="96" fill="#f8f2e6"/>';
      h += '<rect x="' + x + '" y="' + (base - 30) + '" width="340" height="6" fill="#f8f2e6"/><rect x="' + (x - 10) + '" y="' + (base - 6) + '" width="360" height="10" fill="#8a6a4a"/>';
      h += '<rect x="' + (x + 150) + '" y="' + (base - 84) + '" width="40" height="78" fill="#6b3a1e"/><circle cx="' + (x + 170) + '" cy="' + (base - 62) + '" r="13" fill="none" stroke="#d9622b" stroke-width="7" stroke-dasharray="4 3"/><circle cx="' + (x + 182) + '" cy="' + (base - 44) + '" r="2.5" fill="#d4af37"/>';
      [[x + 60, 0.9], [x + 88, 1.3], [x + 250, 1.1], [x + 276, 0.8]].forEach(([px, s]) => { h += '<g transform="translate(' + px + " " + (base - 8) + ") scale(" + s + ')"><ellipse cx="0" cy="-10" rx="18" ry="13" fill="url(#ts-pump)"/><path d="M-6-22q0 12 0 24M6-22q0 12 0 24" stroke="#c9561a" stroke-width="2" fill="none"/><path d="M0-22l2-8" stroke="#4f7a28" stroke-width="3"/></g>'; });
      return hot("The farmhouse", "The family's farmhouse is decorated for Thanksgiving. “Enter into his gates with thanksgiving, and into his courts with praise.” (Psalm 100:4)", h);
    }
    function barn(x, base) {
      let b = shadow(x + 150, base + 6, 190, 14, 0.35);
      b += '<path d="M' + x + " " + base + "V" + (base - 170) + "L" + (x + 40) + " " + (base - 240) + "L" + (x + 150) + " " + (base - 280) + "L" + (x + 260) + " " + (base - 240) + "L" + (x + 300) + " " + (base - 170) + "V" + base + 'Z" fill="#a3291f"/>';
      b += '<path d="M' + (x - 8) + " " + (base - 168) + "L" + (x + 36) + " " + (base - 244) + "L" + (x + 150) + " " + (base - 286) + "L" + (x + 264) + " " + (base - 244) + "L" + (x + 308) + " " + (base - 168) + '" stroke="#4a3a32" stroke-width="12" fill="none" stroke-linejoin="round"/>';
      for (let i = 1; i < 10; i++) b += '<path d="M' + (x + i * 30) + " " + base + "V" + (base - 160) + '" stroke="#8a2119" stroke-width="2"/>';
      b += '<rect x="' + (x + 90) + '" y="' + (base - 120) + '" width="120" height="120" fill="#a3291f" stroke="#f8f2e6" stroke-width="6"/><path d="M' + (x + 90) + " " + (base - 120) + "l120 120M" + (x + 210) + " " + (base - 120) + "l-120 120M" + (x + 150) + " " + (base - 120) + "v120" + '" stroke="#f8f2e6" stroke-width="6"/>';
      b += '<rect x="' + (x + 122) + '" y="' + (base - 220) + '" width="56" height="48" fill="#5a2a16" stroke="#f8f2e6" stroke-width="5"/><path d="M' + (x + 126) + " " + (base - 180) + "q24-16 48 0v8h-48z" + '" fill="#e8c45a"/>';
      b += '<rect x="' + (x + 310) + '" y="' + (base - 230) + '" width="60" height="230" fill="#b5b8bc"/><path d="M' + (x + 310) + " " + (base - 230) + "q30-40 60 0" + '" fill="#8e9297"/>';
      for (let y = base - 210; y < base; y += 24) b += '<path d="M' + (x + 310) + " " + y + "h60" + '" stroke="#9a9ea3" stroke-width="2"/>';
      return hot("The barn and silo", "The barn and silo are full of the harvest. God promised, “While the earth remaineth, seedtime and harvest… shall not cease.” (Genesis 8:22)", b);
    }
    function windmill(x, base) {
      let m = '<path d="M' + (x - 26) + " " + base + "L" + (x - 6) + " " + (base - 180) + "H" + (x + 6) + "L" + (x + 26) + " " + base + '" stroke="#5a4a42" stroke-width="4" fill="none"/>';
      for (let i = 1; i < 6; i++) { const y = base - i * 30, hw = 26 - i * 3.5; m += '<path d="M' + f1(x - hw) + " " + y + "L" + f1(x + hw) + " " + (y - 30) + "M" + f1(x + hw) + " " + y + "L" + f1(x - hw) + " " + (y - 30) + '" stroke="#5a4a42" stroke-width="1.6"/>'; }
      let blades = "";
      for (let i = 0; i < 12; i++) blades += '<path d="M' + x + " " + (base - 186) + "l-6-56h12z" + '" fill="#e8e1d4" stroke="#8a7a6a" transform="rotate(' + i * 30 + " " + x + " " + (base - 186) + ')"/>';
      m += '<g class="hs-spin-slow" style="transform-origin:' + x + "px " + (base - 186) + 'px">' + blades + '</g><circle cx="' + x + '" cy="' + (base - 186) + '" r="7" fill="#5a4a42"/><path d="M' + (x + 4) + " " + (base - 186) + "h50l-6 12h-44z" + '" fill="#8a2119"/>';
      return m;
    }
    function autumnTree(x, base, s) {
      let t = '<path d="M' + x + " " + base + "q-6-" + 70 * s + " 0-" + 130 * s + "M" + x + " " + (base - 90 * s) + "q30-" + 30 * s + " " + 50 * s + "-" + 70 * s + "M" + x + " " + (base - 70 * s) + "q-34-" + 26 * s + " -" + 56 * s + "-" + 60 * s + '" stroke="#4a3022" stroke-width="' + 14 * s + '" fill="none" stroke-linecap="round"/>';
      t += '<g class="hs-sway" style="animation-delay:' + f1(-R() * 4) + 's">';
      for (let i = 0; i < 16; i++) t += '<circle cx="' + f1(x + (R() * 2 - 1) * 100 * s) + '" cy="' + f1(base - 160 * s - R() * 100 * s + Math.abs(R() * 2 - 1) * 30 * s) + '" r="' + f1((30 + R() * 26) * s) + '" fill="' + pick(["#d9622b", "#e8a531", "#b8361f", "#f2b632", "#c4471d"]) + '"/>';
      for (let i = 0; i < 14; i++) t += H.leafPath(f1(x + (R() * 2 - 1) * 110 * s), f1(base - 140 * s - R() * 120 * s), f1(9 * s), f1(R() * 360), pick(["#ffcf5a", "#e85d2a", "#a62a16"]));
      return t + "</g>";
    }
    function pumpkinPatch(x0, x1, y0, y1, n) {
      let p = "";
      for (let i = 0; i < 18; i++) p += '<path d="M' + f1(x0 + R() * (x1 - x0)) + " " + f1(y0 + R() * (y1 - y0)) + "q" + f1(20 + R() * 30) + " -" + f1(R() * 10) + " " + f1(50 + R() * 40) + " " + f1(R() * 14) + '" stroke="#4f7a28" stroke-width="3" fill="none"/>';
      const list = [];
      for (let i = 0; i < n; i++) list.push([x0 + R() * (x1 - x0), y0 + R() * (y1 - y0)]);
      list.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => {
        const s = 0.6 + ((y - y0) / (y1 - y0)) * 0.9 + R() * 0.3;
        p += '<ellipse cx="' + f1(x + 6 * s) + '" cy="' + f1(y + 2) + '" rx="' + f1(26 * s) + '" ry="' + f1(6 * s) + '" fill="#2a1a10" opacity=".25"/><g transform="translate(' + f1(x) + " " + f1(y) + ") scale(" + f1(s * 100) / 100 + ')"><ellipse cx="-11" cy="-16" rx="13" ry="16" fill="#d9641a"/><ellipse cx="11" cy="-16" rx="13" ry="16" fill="#d9641a"/><ellipse cx="0" cy="-16" rx="13" ry="17" fill="url(#ts-pump)"/><path d="M0-32q2-10 8-12" stroke="#4f6a28" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M6-36q10-8 16 0-8 6-16 0" fill="#5f8a2e"/></g>';
      });
      return p;
    }
    function hayBale(x, y, s) { return shadow(x, y + 2, 46 * s, 6 * s, 0.3) + '<rect x="' + f1(x - 42 * s) + '" y="' + f1(y - 40 * s) + '" width="' + f1(84 * s) + '" height="' + f1(40 * s) + '" rx="' + f1(5 * s) + '" fill="#e0b85a"/><path d="M' + f1(x - 42 * s) + " " + f1(y - 27 * s) + "h" + f1(84 * s) + "M" + f1(x - 42 * s) + " " + f1(y - 13 * s) + "h" + f1(84 * s) + '" stroke="#c49a3a" stroke-width="2"/><path d="M' + f1(x - 20 * s) + " " + f1(y - 40 * s) + "v" + f1(40 * s) + "M" + f1(x + 20 * s) + " " + f1(y - 40 * s) + "v" + f1(40 * s) + '" stroke="#8a6a2a" stroke-width="2.5"/>'; }
    function cornShock(x, y, s) { let c = ""; for (let i = -5; i <= 5; i++) c += '<path d="M' + x + " " + f1(y - 110 * s) + "L" + f1(x + i * 9 * s) + " " + y + '" stroke="' + (i % 2 ? "#d9b25b" : "#c49a3a") + '" stroke-width="' + f1(6 * s) + '"/>'; return c + '<path d="M' + f1(x - 14 * s) + " " + f1(y - 70 * s) + "h" + f1(28 * s) + '" stroke="#8a6a2a" stroke-width="4"/><path d="M' + x + " " + f1(y - 110 * s) + "l-" + f1(16 * s) + "-" + f1(22 * s) + "M" + x + " " + f1(y - 110 * s) + "l" + f1(14 * s) + "-" + f1(24 * s) + '" stroke="#d9b25b" stroke-width="4"/>'; }
    function fence(x0, x1, y) { let f = '<path d="M' + x0 + " " + (y - 30) + "H" + x1 + "M" + x0 + " " + (y - 12) + "H" + x1 + '" stroke="#7a5a3a" stroke-width="7"/>'; for (let x = x0; x <= x1; x += 70) f += '<rect x="' + (x - 4) + '" y="' + (y - 44) + '" width="9" height="48" fill="#5a3f26"/>'; return f; }
    function basket(x, y, fruit) {
      let b = shadow(x, y + 2, 40, 6, 0.3);
      for (let i = 0; i < 7; i++) b += fruit === "apple" ? '<circle cx="' + f1(x - 24 + i * 8) + '" cy="' + f1(y - 36 - (i % 2) * 6) + '" r="9" fill="' + pick(["#c62828", "#e53935", "#d84315"]) + '"/>' : '<ellipse cx="' + f1(x - 22 + i * 7) + '" cy="' + f1(y - 40) + '" rx="5" ry="14" fill="#f2c94c" transform="rotate(' + (i * 8 - 24) + " " + f1(x - 22 + i * 7) + " " + (y - 40) + ')"/>';
      b += '<path d="M' + (x - 36) + " " + (y - 34) + "h72l-8 34h-56z" + '" fill="#a8743d"/><path d="M' + (x - 34) + " " + (y - 24) + "h68M" + (x - 32) + " " + (y - 13) + 'h64" stroke="#7a5230" stroke-width="2.5"/><path d="M' + (x - 30) + " " + (y - 34) + "q30-44 60 0" + '" stroke="#7a5230" stroke-width="4" fill="none"/>';
      return b;
    }
    // The big dinner table
    function table(cx, y) {
      let t = shadow(cx, y + 104, 330, 18, 0.4) + '<ellipse cx="' + cx + '" cy="' + (y + 30) + '" rx="340" ry="80" fill="url(#ts-pool)"/>';
      // chairs behind
      for (let i = 0; i < 7; i++) { const x = cx - 240 + i * 80; t += '<rect x="' + (x - 18) + '" y="' + (y - 64) + '" width="36" height="66" rx="4" fill="#6b4423"/><path d="M' + (x - 10) + " " + (y - 56) + "v52M" + x + " " + (y - 56) + "v52M" + (x + 10) + " " + (y - 56) + 'v52" stroke="#4a2f17" stroke-width="3"/>'; }
      t += '<path d="M' + (cx - 300) + " " + y + "H" + (cx + 300) + "L" + (cx + 340) + " " + (y + 60) + "H" + (cx - 340) + 'Z" fill="url(#ts-cloth)"/>';
      t += '<path d="M' + (cx - 340) + " " + (y + 60) + "H" + (cx + 340) + "V" + (y + 100) + "Q" + cx + " " + (y + 110) + " " + (cx - 340) + " " + (y + 100) + 'Z" fill="#e2cda6"/>';
      t += '<path d="M' + (cx - 60) + " " + y + "H" + (cx + 60) + "L" + (cx + 70) + " " + (y + 60) + "H" + (cx - 70) + 'Z" fill="#c4581f" opacity=".85"/><path d="M' + (cx - 70) + " " + (y + 60) + "h140v42h-140z" + '" fill="#a84a1a" opacity=".85"/>';
      t += '<rect x="' + (cx - 330) + '" y="' + (y + 100) + '" width="14" height="30" fill="#5a3a1e"/><rect x="' + (cx + 316) + '" y="' + (y + 100) + '" width="14" height="30" fill="#5a3a1e"/>';
      // plates and cups
      for (let i = 0; i < 6; i++) { const px = cx - 250 + i * 100 + (i > 2 ? 0 : 0); if (Math.abs(px - cx) < 70) continue; t += '<ellipse cx="' + px + '" cy="' + (y + 16) + '" rx="26" ry="8" fill="#fff" stroke="#d9c8a6"/><ellipse cx="' + (px - 4) + '" cy="' + (y + 46) + '" rx="30" ry="9" fill="#fff" stroke="#d9c8a6"/><rect x="' + (px + 24) + '" y="' + (y + 22) + '" width="10" height="16" rx="2" fill="#f4e3c0" stroke="#c9b48a"/>'; }
      // turkey
      t += '<ellipse cx="' + cx + '" cy="' + (y + 32) + '" rx="62" ry="16" fill="#eee" stroke="#c9b48a" stroke-width="2"/><ellipse cx="' + cx + '" cy="' + (y + 10) + '" rx="46" ry="30" fill="url(#ts-turkey)"/><path d="M' + (cx - 40) + " " + (y + 18) + "q-24 0-26 14 10 6 20-4M" + (cx + 40) + " " + (y + 18) + "q24 0 26 14-10 6-20-4" + '" fill="#b86a24" stroke="#8a4a14" stroke-width="2"/><circle cx="' + (cx - 66) + '" cy="' + (y + 32) + '" r="5" fill="#fff"/><circle cx="' + (cx + 66) + '" cy="' + (y + 32) + '" r="5" fill="#fff"/><path d="M' + (cx - 20) + " " + (y - 6) + "q20-12 40 0" + '" stroke="#f5c87a" stroke-width="4" fill="none" opacity=".7"/>';
      for (let i = 0; i < 6; i++) t += '<circle cx="' + (cx - 50 + i * 20) + '" cy="' + (y + 36) + '" r="4" fill="' + ["#5f8a2e", "#c62828", "#f2c94c"][i % 3] + '"/>';
      // pies, bread, corn, potatoes, cranberry
      const pie = (x, yy) => '<ellipse cx="' + x + '" cy="' + yy + '" rx="34" ry="11" fill="#c98a3a"/><ellipse cx="' + x + '" cy="' + (yy - 3) + '" rx="30" ry="9" fill="#e0a24a"/><path d="M' + (x - 24) + " " + (yy - 6) + "l48 4M" + (x - 26) + " " + (yy) + "l46-6M" + (x - 10) + " " + (yy - 11) + "l4 16M" + (x + 8) + " " + (yy - 11) + 'l-2 16" stroke="#b5732a" stroke-width="2.5"/>';
      t += pie(cx - 170, y + 30) + pie(cx + 180, y + 34);
      t += '<ellipse cx="' + (cx - 100) + '" cy="' + (y + 22) + '" rx="24" ry="11" fill="#c98a4b"/><path d="M' + (cx - 112) + " " + (y + 16) + "l6 10M" + (cx - 100) + " " + (y + 13) + "l6 10M" + (cx - 88) + " " + (y + 16) + 'l5 8" stroke="#a8692e" stroke-width="2.5"/>';
      t += '<ellipse cx="' + (cx + 110) + '" cy="' + (y + 24) + '" rx="26" ry="10" fill="#fff" stroke="#c9b48a"/><ellipse cx="' + (cx + 110) + '" cy="' + (y + 18) + '" rx="20" ry="9" fill="#fbf4e0"/><circle cx="' + (cx + 110) + '" cy="' + (y + 15) + '" r="4" fill="#f2c94c"/>';
      t += '<ellipse cx="' + (cx - 236) + '" cy="' + (y + 22) + '" rx="18" ry="8" fill="#fff" stroke="#c9b48a"/><ellipse cx="' + (cx - 236) + '" cy="' + (y + 19) + '" rx="14" ry="6" fill="#a8132c"/>';
      t += '<g transform="translate(' + (cx + 240) + " " + (y + 26) + ')"><ellipse rx="22" ry="7" fill="#fff" stroke="#c9b48a"/><ellipse cx="-6" cy="-4" rx="18" ry="6" fill="#f2c94c" transform="rotate(-10)"/><ellipse cx="6" cy="-2" rx="18" ry="6" fill="#e8b83c" transform="rotate(8)"/></g>';
      // candles
      [cx - 140, cx - 50, cx + 50, cx + 140].forEach((x) => { t += '<rect x="' + (x - 4) + '" y="' + (y - 18) + '" width="8" height="26" fill="#fbf1dd" stroke="#e0cba6"/><circle cx="' + x + '" cy="' + (y - 26) + '" r="16" fill="url(#ts-pool)" class="hs-flicker-soft"/><path class="hs-flame" d="M' + x + " " + (y - 34) + "q5 8 0 13-5-5 0-13z" + '" fill="#ffcf5a"/>'; });
      return hot("The Thanksgiving table", "A big table is ready for family and friends. Before eating, we thank God for His blessings. “In every thing give thanks: for this is the will of God in Christ Jesus concerning you.” (1 Thessalonians 5:18)", t);
    }
    function cornucopia(x, y) {
      let c = shadow(x, y + 4, 90, 10, 0.3) + '<path d="M' + (x + 90) + " " + y + "Q" + (x + 60) + " " + (y - 80) + " " + (x - 20) + " " + (y - 60) + "Q" + (x - 50) + " " + (y - 50) + " " + (x - 40) + " " + (y - 10) + "Q" + x + " " + (y - 40) + " " + (x + 90) + " " + y + 'Z" fill="#b5803a"/>';
      for (let i = 0; i < 6; i++) c += '<path d="M' + (x + 80 - i * 18) + " " + (y - 4 - i * 9) + "q-6-14 4-24" + '" stroke="#8a5a2a" stroke-width="3" fill="none"/>';
      c += '<path d="M' + (x + 90) + " " + y + "q30-30 26-58" + '" stroke="#b5803a" stroke-width="10" fill="none" stroke-linecap="round"/>';
      c += '<circle cx="' + (x - 46) + '" cy="' + (y - 20) + '" r="15" fill="#c62828"/><circle cx="' + (x - 70) + '" cy="' + (y - 6) + '" r="13" fill="#e8a531"/><ellipse cx="' + (x - 30) + '" cy="' + (y - 46) + '" rx="10" ry="24" fill="#f2c94c" transform="rotate(-50 ' + (x - 30) + " " + (y - 46) + ')"/>';
      for (let i = 0; i < 6; i++) c += '<circle cx="' + (x - 86 + (i % 3) * 8) + '" cy="' + (y - 24 + Math.floor(i / 3) * 8) + '" r="5" fill="#6a3d9a"/>';
      c += '<g transform="translate(' + (x - 104) + " " + (y + 2) + ') scale(.8)"><ellipse cx="-11" cy="-16" rx="13" ry="16" fill="#d9641a"/><ellipse cx="11" cy="-16" rx="13" ry="16" fill="#d9641a"/><ellipse cx="0" cy="-16" rx="13" ry="17" fill="url(#ts-pump)"/></g><ellipse cx="' + (x - 60) + '" cy="' + (y - 36) + '" rx="10" ry="8" fill="#9ccc65"/>';
      return hot("The cornucopia", "A cornucopia, or “horn of plenty,” spills over with food. It reminds us that God gives us so much. “Every good gift and every perfect gift is from above.” (James 1:17)", c);
    }
    // bistro lights over the table
    let bistro = "";
    [[60, 520, 800, 500], [800, 500, 1520, 530]].forEach(([x1, y1, x2, y2]) => {
      bistro += '<path d="M' + x1 + " " + y1 + "Q" + (x1 + x2) / 2 + " " + ((y1 + y2) / 2 + 70) + " " + x2 + " " + y2 + '" stroke="#2a1a14" stroke-width="2" fill="none"/>';
      for (let i = 1; i < 16; i++) { const t = i / 16, x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2, y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * ((y1 + y2) / 2 + 70) + t * t * y2; bistro += '<g class="hs-tw' + (i % 3) + '"><circle cx="' + f1(x) + '" cy="' + f1(y + 8) + '" r="11" fill="#ffd98a" opacity=".35"/><circle cx="' + f1(x) + '" cy="' + f1(y + 8) + '" r="4.5" fill="#fff1c4"/></g>'; }
    });
    let groundTop = '<path d="M0 600Q400 560 800 590T1600 580V800H0Z" fill="#8a6a2e"/><path d="M0 640Q400 610 800 640T1600 630V800H0Z" fill="#6f7a2e"/>';
    let leafLitter = "";
    for (let i = 0; i < 90; i++) leafLitter += H.leafPath(f1(R() * W), f1(660 + R() * 140), f1(5 + R() * 5), f1(R() * 360), pick(["#d9622b", "#e8a531", "#b8361f", "#c98a1b", "#8a4b16"]));
    const patch = hot("The pumpkin patch", "Look at all those pumpkins! God makes things grow so we can enjoy the harvest. “The earth is the LORD's, and the fulness thereof.” (Psalm 24:1)", pumpkinPatch(10, 520, 650, 790, 30));
    const svg = '<svg class="hs-svg" viewBox="0 0 ' + W + " " + Ht + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="An animated autumn harvest farm at sunset with a farmhouse, barn, windmill, pumpkin patch, hay bales, a cornucopia, and a Thanksgiving dinner table"><defs>' + defs + "</defs>" +
      sky + '<g class="hs-title" aria-hidden="true"><text x="800" y="150" text-anchor="middle" class="hs-title-big hs-title-thanks" fill="#fff4dc">Give Thanks!</text><text x="800" y="192" text-anchor="middle" class="hs-title-small" fill="#fff0d8">O give thanks unto the LORD; for he is good: for his mercy endureth for ever. (Psalm 107:1)</text></g>' +
      layer(0.12, far) + layer(0.3, barn(1060, 600) + windmill(1500, 600) + farmhouse(160, 610) + autumnTree(640, 600, 1)) +
      layer(0.5, groundTop + fence(520, 1080, 650) + cornShock(1080, 680, 1) + cornShock(1150, 684, 0.9) + hayBale(980, 690, 1.2) + hayBale(1240, 700, 1) + hayBale(1310, 690, 0.8)) +
      layer(0.7, bistro + autumnTree(60, 720, 1.4) + autumnTree(1560, 730, 1.5)) +
      layer(0.85, leafLitter + patch + table(800, 650) + cornucopia(1330, 778) + basket(500, 790, "apple") + basket(1480, 790, "corn")) + "</svg>";
    return build("thanksgiving", "diorama", svg, o, {
      label: "Thanksgiving harvest scene", title: "Give Thanks! An autumn harvest",
      hint: "Happy Thanksgiving! Click the dinner table, the cornucopia, the pumpkin patch, the farmhouse, or the barn to explore.",
      fx: (cv) => o.Particles(cv, "leaves", o.lowPower ? 22 : 44, { scale: 1.3 })
    });
  }

  /* ---------------- Smaller banners for the other holidays ---------------- */
  function banner(id, o) {
    R = H.seeded(id.length * 131 + 7);
    const W = 1600, Ht = 400;
    let s = "", defs = softDefs, fx = null, fireworks = false;
    const grad = (gid, stops) => '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' + stops.map((c, i) => '<stop offset="' + (i / (stops.length - 1)) + '" stop-color="' + c + '"/>').join("") + "</linearGradient>";
    const skyline = (y, col, lit) => { let k = "", x = 0; while (x < W) { const w = 40 + R() * 70, h = 50 + R() * 140; k += '<rect x="' + f1(x) + '" y="' + f1(y - h) + '" width="' + f1(w) + '" height="' + f1(h + 2) + '" fill="' + col + '"/>'; if (lit) for (let i = 0; i < 6; i++) k += '<rect x="' + f1(x + 6 + R() * (w - 14)) + '" y="' + f1(y - h + 8 + R() * (h - 20)) + '" width="5" height="7" fill="#ffd27a" opacity="' + f1(0.5 + R() * 0.5) + '"/>'; x += w + 3; } return k; };
    switch (id) {
      case "newyear": {
        defs += grad("b-sky", ["#05091f", "#1c2541", "#3a4a7a"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/>' + skyline(400, "#0d1330", true);
        s += '<g transform="translate(1340 150)"><circle r="92" fill="#f8f3e3" stroke="#d4af37" stroke-width="10"/>';
        for (let i = 0; i < 12; i++) s += '<rect x="-3" y="-82" width="6" height="' + (i % 3 ? 10 : 18) + '" fill="#1c2541" transform="rotate(' + i * 30 + ')"/>';
        s += '<path d="M0 0V-62M0 0V-48" stroke="#1c2541" stroke-width="7" stroke-linecap="round" transform="rotate(-4)"/><circle r="7" fill="#d4af37"/></g>';
        s += '<text x="1340" y="310" text-anchor="middle" class="hs-title-big" style="font-size:70px" fill="#d4af37">' + o.ctx.year + "</text>";
        fireworks = true; fx = (cv) => o.Particles(cv, "confetti", 26); break;
      }
      case "mlk": {
        defs += grad("b-sky", ["#6d7fb3", "#d9b8c4", "#f6d28a"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/><circle cx="1200" cy="330" r="90" fill="#fff1c4" opacity=".9"/><path d="M0 330Q400 300 800 320T1600 310V400H0Z" fill="#6a7a5a"/>';
        s += '<path d="M1080 400L1190 316H1210L1320 400Z" fill="#d8c8a8"/><path d="M1200 400V320" stroke="#fff" stroke-width="3" stroke-dasharray="14 12"/>';
        for (let i = 0; i < 4; i++) s += '<g class="hs-drift" style="animation-delay:' + -i * 3 + 's">' + H.dove(1040 + i * 110, 120 + (i % 2) * 40, 2.2, "#fff") + "</g>";
        break;
      }
      case "valentine": {
        defs += grad("b-sky", ["#ffe1ec", "#ffc2d6", "#f48fb1"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/>';
        for (let i = 0; i < 26; i++) s += '<g class="hs-float" style="animation-delay:' + f1(-R() * 8) + "s;animation-duration:" + f1(6 + R() * 6) + 's"><path d="' + H.heartPath(f1(R() * 1600), f1(60 + R() * 320), f1(8 + R() * 22)) + '" fill="' + pick(["#e91e63", "#f06292", "#fff", "#d81b60", "#ff80ab"]) + '" opacity="' + f1(0.5 + R() * 0.5) + '"/></g>';
        s += '<g transform="translate(1300 120) rotate(-6)"><rect width="220" height="150" rx="10" fill="#fff" stroke="#e8b3c6" stroke-width="4"/><path d="M0 0L110 86 220 0" stroke="#e8b3c6" stroke-width="4" fill="none"/><path d="' + H.heartPath(110, 88, 22) + '" fill="#c2185b"/></g>';
        fx = (cv) => o.Particles(cv, "hearts", 18); break;
      }
      case "presidents": {
        defs += grad("b-sky", ["#1d3260", "#36518f", "#8aa6d6"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/>';
        for (let i = 0; i < 40; i++) s += '<polygon points="' + H.starPts(f1(R() * 1600), f1(R() * 200), f1(2 + R() * 4), 1) + '" fill="#fff" class="hs-twinkle" style="animation-delay:' + f1(-R() * 4) + 's"/>';
        s += '<rect x="1050" y="250" width="460" height="150" fill="#f4f1ea"/><path d="M1180 250L1280 196 1380 250Z" fill="#e8e3d6"/><rect x="1180" y="250" width="200" height="16" fill="#e8e3d6"/>';
        for (let i = 0; i < 6; i++) s += '<rect x="' + (1192 + i * 34) + '" y="266" width="10" height="134" fill="#fff" stroke="#d8d2c4"/>';
        for (let i = 0; i < 8; i++) s += '<rect x="' + (1070 + i * 56 + (i > 3 ? 210 - 56 * 0 : 0) * 0) + '" y="290" width="18" height="30" fill="#9fb3d6"/>';
        s += '<path d="M1280 196V160" stroke="#ccc" stroke-width="3"/>' + H.flagMini(1281, 160, 40);
        s += '<path d="M960 400L972 160 984 146 996 160 1008 400Z" fill="#eae6dc"/>';
        break;
      }
      case "stpatrick": {
        defs += grad("b-sky", ["#8fd3f4", "#c9ecf9", "#e9f7ee"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/>';
        s += '<g opacity=".55" fill="none" stroke-width="16"><path d="M900 400A360 300 0 0 1 1620 400" stroke="#ff6b6b"/><path d="M916 400A344 284 0 0 1 1604 400" stroke="#ffb347"/><path d="M932 400A328 268 0 0 1 1588 400" stroke="#fff176"/><path d="M948 400A312 252 0 0 1 1572 400" stroke="#81c784"/><path d="M964 400A296 236 0 0 1 1556 400" stroke="#64b5f6"/><path d="M980 400A280 220 0 0 1 1540 400" stroke="#9575cd"/></g>';
        s += '<path d="M0 300Q300 240 600 290T1200 270T1600 300V400H0Z" fill="#43a047"/><path d="M0 340Q400 290 800 330T1600 320V400H0Z" fill="#2e7d32"/>';
        s += '<rect x="1180" y="232" width="110" height="60" fill="#e8e1d0"/><path d="M1170 236L1235 196 1300 236Z" fill="#c9a24a"/><rect x="1222" y="258" width="22" height="34" fill="#6b4423"/><rect x="1194" y="248" width="18" height="16" fill="#9fb3d6"/>';
        s += '<g transform="translate(1440 214)"><circle cy="-60" r="26" fill="none" stroke="#9e9e9e" stroke-width="8"/><path d="M-6-112h12v190h-12zM-44-66h88v12h-88z" fill="#9e9e9e"/></g>';
        for (let i = 0; i < 40; i++) s += H.shamrock(f1(R() * 1600), f1(350 + R() * 50), f1(8 + R() * 8), pick(["#1b5e20", "#66bb6a", "#2e7d32"]));
        fx = (cv) => o.Particles(cv, "shamrocks", 14); break;
      }
      case "goodfriday": {
        defs += grad("b-sky", ["#1d1726", "#4a3a5c", "#8a6a7a"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/><radialGradient id="b-glow"><stop offset="0" stop-color="#ffe8c0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe8c0" stop-opacity="0"/></radialGradient><circle cx="1220" cy="190" r="200" fill="url(#b-glow)"/>';
        s += '<g fill="#2a2234" opacity=".7">' + cloud(400, 90, 2.2, "#2a2234") + cloud(1450, 70, 1.6, "#2a2234") + "</g>";
        s += '<path d="M900 400Q1060 250 1220 220Q1380 250 1560 400Z" fill="#141018"/>';
        s += H.cross(1140, 250, 46, "#141018") + H.cross(1220, 220, 66, "#141018") + H.cross(1300, 250, 46, "#141018");
        break;
      }
      case "mothers": {
        defs += grad("b-sky", ["#fde4ef", "#f6d0e4", "#e8d4f4"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/>';
        s += '<path d="M1290 400l-20-120h120l-20 120z" fill="#b39ddb"/><path d="M1270 280h120" stroke="#9575cd" stroke-width="8"/>';
        for (let i = 0; i < 14; i++) { const a = -2.6 + (i / 13) * 2.2, x = 1330 + Math.cos(a) * 130, y = 270 + Math.sin(a) * 150; s += '<path d="M1330 280Q' + f1((1330 + x) / 2) + " " + f1(y + 60) + " " + f1(x) + " " + f1(y) + '" stroke="#5f9a4a" stroke-width="3" fill="none"/>' + H.flower(f1(x), f1(y), f1(10 + R() * 5), pick(["#e88aa8", "#fff", "#c48ad8", "#f4b6c8", "#ff8a80"]), "#f7c948"); }
        s += '<path d="' + H.heartPath(1050, 200, 40) + '" fill="#e91e63" opacity=".85" class="hs-pulse"/>';
        fx = (cv) => o.Particles(cv, "petals", 16); break;
      }
      case "memorial": case "veterans": {
        defs += grad("b-sky", id === "memorial" ? ["#5b6f8f", "#a9b7cc", "#e6e1d6"] : ["#26375e", "#5b6f9a", "#c8cfdc"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/><path d="M0 300Q400 270 800 290T1600 280V400H0Z" fill="#5f7a4a"/>';
        if (id === "memorial") {
          for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) { const x = 1010 + i * 37 + r * 16, y = 300 + r * 34, sc = 0.7 + r * 0.25; s += '<path d="M' + f1(x - 9 * sc) + " " + f1(y) + "v-" + f1(26 * sc) + "a" + f1(9 * sc) + " " + f1(9 * sc) + " 0 0 1 " + f1(18 * sc) + " 0v" + f1(26 * sc) + 'z" fill="#f4f1ea"/>' + (i % 2 ? '<path d="M' + f1(x + 14 * sc) + " " + f1(y + 2) + "v-" + f1(22 * sc) + '" stroke="#888" stroke-width="1"/>' + H.flagMini(f1(x + 14 * sc), f1(y - 20 * sc), f1(12 * sc)) : ""); }
          s += '<path d="M975 380V60" stroke="#d8dde6" stroke-width="6"/>' + H.flagMini(978, 150, 110) + '<circle cx="975" cy="58" r="6" fill="#d4af37"/>';
          for (let i = 0; i < 16; i++) s += H.flower(f1(R() * 760), f1(340 + R() * 50), 6, "#c62828", "#1d1d1d");
        } else {
          s += '<g transform="translate(1360 300)"><path d="M-110 0L0-110 110 0Z" fill="#3c3b6e"/>';
          for (let i = 0; i < 9; i++) s += '<polygon points="' + H.starPts(-60 + (i % 5) * 30, -20 - Math.floor(i / 5) * 30 - (i % 2) * 6, 7, 3) + '" fill="#fff"/>';
          s += '<path d="M-118 4L0-118 118 4Z" fill="none" stroke="#8a5a2b" stroke-width="10"/></g>';
          s += '<path d="M975 380V60" stroke="#d8dde6" stroke-width="6"/>' + H.flagMini(978, 64, 150) + '<circle cx="975" cy="58" r="6" fill="#d4af37"/>';
          for (let i = 0; i < 5; i++) s += '<polygon points="' + H.starPts(1190 + i * 70, 360, 14, 6) + '" fill="#d4af37" opacity=".9"/>';
        }
        break;
      }
      case "flag": case "independence-mini": {
        defs += grad("b-sky", ["#5aa9e6", "#a8d4f4", "#e8f4fc"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/>' + cloud(300, 90, 1.4, "#fff") + cloud(700, 60, 1, "#fff");
        s += '<rect x="1000" y="40" width="9" height="360" fill="#d8dde6"/><circle cx="1004.5" cy="36" r="9" fill="#d4af37"/>' + wavingFlag(1009, 50, 420, o.still);
        fx = (cv) => o.Particles(cv, "stars", 12); break;
      }
      case "fathers": {
        defs += grad("b-sky", ["#2f4f6f", "#e8a06a", "#ffd9a0"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/><circle cx="1200" cy="260" r="70" fill="#ffe4b0"/><path d="M0 260H1600V400H0Z" fill="#3f6f8f"/>';
        for (let i = 0; i < 10; i++) s += '<path class="hs-shimmer" style="animation-delay:' + -i * 0.4 + 's" d="M' + (1120 + R() * 160) + " " + (275 + i * 12) + "h" + (30 + R() * 60) + '" stroke="#ffe4b0" stroke-width="3" opacity=".7"/>';
        for (let i = 0; i < 10; i++) s += evergreen(30 + i * 90 + R() * 30, 266, 80 + R() * 60, { c1: "#1f3a2e", c2: "#25463a" });
        s += '<rect x="1300" y="300" width="300" height="14" fill="#7a5230"/><rect x="1330" y="314" width="10" height="70" fill="#5a3a1e"/><rect x="1450" y="314" width="10" height="70" fill="#5a3a1e"/>';
        s += '<path d="M1420 300L1520 150" stroke="#3b2a1d" stroke-width="4"/><path d="M1520 150Q1560 230 1540 330" stroke="#ddd" stroke-width="1.2" fill="none"/><circle cx="1540" cy="330" r="5" fill="#e53935"/>';
        s += '<path d="M1000 330q120 26 240 0l-20 18q-100 16-200 0z" fill="#a0522d"/>';
        break;
      }
      case "labor": {
        defs += grad("b-sky", ["#5aa9e6", "#a8d4f4", "#ffe9b0"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/><circle cx="1450" cy="90" r="50" fill="#ffd54f"/>' + skyline(320, "#5b7fa6", false);
        s += '<path d="M0 320H1600V400H0Z" fill="#7a9a4a"/>';
        for (let i = 0; i < 10; i++) s += '<path d="M' + (i * 160) + " 400L" + (i * 160 + 80) + ' 320" stroke="#6a8a3a" stroke-width="6"/>';
        s += '<g class="hs-spin-slow" style="transform-origin:1150px 220px">' + H.gear(1150, 220, 50, "#f2b632") + '</g><g class="hs-spin-rev" style="transform-origin:1262px 180px">' + H.gear(1262, 180, 34, "#2f5d8a") + "</g>";
        s += '<g transform="translate(1360 300)"><path d="M-60 0q0-60 60-60t60 60z" fill="#f2b632"/><rect x="-70" y="-4" width="140" height="12" rx="6" fill="#e0a020"/></g>';
        s += '<g transform="translate(980 330) rotate(-30)"><rect x="-6" y="-80" width="12" height="90" rx="4" fill="#8a5a2b"/><rect x="-26" y="-96" width="52" height="22" rx="4" fill="#5a5f66"/></g>';
        break;
      }
      case "patriot": {
        defs += grad("b-sky", ["#05070f", "#141c30", "#2a3550"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/>';
        for (let i = 0; i < 60; i++) s += '<circle cx="' + f1(R() * 1600) + '" cy="' + f1(R() * 260) + '" r="' + f1(0.5 + R()) + '" fill="#fff" opacity=".7"/>';
        s += '<linearGradient id="b-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9cc4ff" stop-opacity=".75"/><stop offset="1" stop-color="#9cc4ff" stop-opacity="0"/></linearGradient><path d="M1130 330L1110 0H1150ZM1210 330L1230 0H1190Z" fill="url(#b-beam)"/>';
        s += skyline(400, "#0a0e18", true);
        break;
      }
      case "halloween": {
        defs += grad("b-sky", ["#2a1a4a", "#6a3d9a", "#f08c4a"]);
        s = '<rect width="1600" height="400" fill="url(#b-sky)"/><circle cx="1400" cy="110" r="70" fill="#ffe08a"/><circle cx="1380" cy="96" r="12" fill="#f5cf6a"/><circle cx="1420" cy="130" r="8" fill="#f5cf6a"/>';
        s += '<path d="M0 300Q400 250 800 290T1600 280V400H0Z" fill="#4a2a5a"/><path d="M0 340Q400 310 800 340T1600 330V400H0Z" fill="#3a5a2a"/>';
        const jack = (x, y, sc) => '<g transform="translate(' + x + " " + y + ") scale(" + sc + ')"><circle r="40" fill="#ffcf5a" opacity=".35" class="hs-flicker-soft"/><ellipse cx="-14" rx="18" ry="24" fill="#e07a1f"/><ellipse cx="14" rx="18" ry="24" fill="#e07a1f"/><ellipse rx="18" ry="25" fill="#f08c2a"/><path d="M0-24l3-10" stroke="#4f7a28" stroke-width="5"/><circle cx="-10" cy="-6" r="5" fill="#ffd54f"/><circle cx="10" cy="-6" r="5" fill="#ffd54f"/><path d="M-14 6q14 14 28 0q-14 6-28 0z" fill="#ffd54f"/></g>';
        s += jack(1000, 330, 1.4) + jack(1110, 345, 1) + jack(1230, 330, 1.6) + jack(1350, 352, 0.9);
        s += '<path d="M1440 360q40-30 80 0l-6 30h-68z" fill="#8a5a2b"/>' + H.candyCorn(1466, 344, 2) + H.candyCorn(1494, 340, 2) + '<rect x="1474" y="334" width="16" height="10" rx="4" fill="#e53935"/>';
        for (let i = 0; i < 14; i++) s += H.candyCorn(f1(100 + R() * 800), f1(350 + R() * 40), 1.6);
        fx = (cv) => o.Particles(cv, "candy", 18); break;
      }
      default: return null;
    }
    const svg = '<svg class="hs-svg" viewBox="0 0 ' + W + " " + Ht + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + defs + "</defs>" + s + "</svg>";
    const overlay = '<div class="hol-banner-text"><p class="hol-banner-kicker">' + esc(o.ctx.name) + '</p><p class="hol-banner-title">' + esc(o.greet) + "</p><p>" + esc(o.line) + '</p><p class="hol-banner-verse">“' + esc(o.verse) + "” <b>" + esc(o.ref) + "</b></p></div>";
    return build(id, "banner", svg, o, { label: o.ctx.name + " banner", title: o.greet, overlay, fx, fireworks });
  }

  /* ---------------- Fireworks (canvas) ---------------- */
  function Fireworks(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    let W = 0, Ht = 0, dpr = 1, raf = 0, last = 0, nextAuto = 0;
    const rockets = [], sparks = [];
    const COLORS = opts.colors || ["#ff4d4d", "#ffffff", "#5c8dff", "#ffd54f", "#ff8a80", "#90caf9"];
    function size() { const r = canvas.getBoundingClientRect(); dpr = Math.min(1.5, window.devicePixelRatio || 1); W = r.width; Ht = r.height; canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, Ht * dpr); }
    function launch(x, y) {
      if (rockets.length > 6) return;
      rockets.push({ x, y: Ht + 6, tx: x + (Math.random() - 0.5) * 40, ty: y, c: COLORS[(Math.random() * COLORS.length) | 0] });
    }
    function burst(r) {
      const n = Math.min(70, 400 - sparks.length), kind = Math.random(), c2 = COLORS[(Math.random() * COLORS.length) | 0];
      const scale = Math.max(0.55, Math.min(1.2, W / 1100));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.1, sp = (kind < 0.4 ? 150 : 60 + Math.random() * 150) * scale;
        sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1 + Math.random() * 0.7, max: 1.6, c: i % 3 === 0 ? c2 : r.c, g: kind > 0.75 ? 110 : 55 });
      }
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      if (now - last < 30) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.03); last = now;
      if (opts.auto !== false && now > nextAuto) { launch(W * (0.12 + Math.random() * 0.76), Ht * (0.12 + Math.random() * 0.32)); nextAuto = now + 900 + Math.random() * 1300; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Ht);
      ctx.globalCompositeOperation = "lighter";
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i], dy = r.ty - r.y;
        r.y += Math.max(-560 * dt, dy * 0.08 - 160 * dt); r.x += (r.tx - r.x) * 0.04;
        ctx.strokeStyle = "rgba(255,230,180,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y + 14); ctx.stroke();
        if (r.y <= r.ty + 4) { burst(r); rockets.splice(i, 1); }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.vx *= 0.975; p.vy = p.vy * 0.975 + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, p.life / 0.8);
        ctx.strokeStyle = p.c; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    size();
    window.addEventListener("resize", size);
    return {
      launch, start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } },
      stop() { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); },
      destroy() { cancelAnimationFrame(raf); raf = 0; window.removeEventListener("resize", size); }
    };
  }

  /* ---------------- Putting a scene together ---------------- */
  function build(id, kind, svg, o, opt) {
    const sec = document.createElement("section");
    sec.className = "hol-scene hol-" + kind + " hol-scene-" + id;
    sec.setAttribute("aria-label", opt.label);
    sec.innerHTML = '<h2 class="sr-only">' + esc(opt.title) + "</h2>" +
      '<div class="hol-scene-frame"><div class="hol-stage">' + svg + '<canvas class="hol-stage-fx" aria-hidden="true"></canvas>' + (opt.overlay || "") + "</div>" +
      (kind === "diorama" ? '<div class="hol-scene-bar"><p class="hol-caption" aria-live="polite"><span class="hol-caption-tag">Mr. Watford</span><span class="hol-caption-text">' + esc(opt.hint) + "</span></p>" + "</div>" : "") + "</div>";
    requestAnimationFrame(() => init(sec, kind, o, opt));
    return sec;
  }

  function init(sec, kind, o, opt) {
    const stage = sec.querySelector(".hol-stage"), svg = sec.querySelector(".hs-svg"), cv = sec.querySelector(".hol-stage-fx");
    const capText = sec.querySelector(".hol-caption-text");
    let fx = null, fw = null, paused = false, visible = true;
    if (o.still) { try { svg.pauseAnimations(); } catch (e) { /* old browser */ } }
    else {
      if (opt.fx) fx = opt.fx(cv);
      if (opt.fireworks) fw = Fireworks(cv, { auto: true });
    }
    const run = () => {
      const go = visible && !paused && !o.still;
      [fx, fw].forEach((e) => { if (e) { if (go) e.start(); else e.stop(); } });
      // Off screen: pause all the scene's motion so the rest of the page stays fast
      sec.classList.toggle("hs-offscreen", !visible);
      if (!o.still && !paused) { try { visible ? svg.unpauseAnimations() : svg.pauseAnimations(); } catch (e) { /* old browser */ } }
    };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; run(); }).observe(stage); else run();
    run();

    // Gentle 3-D "parallax" when the mouse moves over the scene
    const layers = Array.prototype.slice.call(svg.querySelectorAll(".hs-layer"));
    if (!o.still && window.matchMedia("(pointer: fine)").matches) {
      let tx = 0, ty = 0, pending = false;
      stage.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; layers.forEach((l) => { const d = +l.getAttribute("data-depth"); l.style.transform = "translate(" + f1(-tx * d * 22) + "px," + f1(-ty * d * 8) + "px)"; }); }); }
      });
      stage.addEventListener("pointerleave", () => layers.forEach((l) => { l.style.transform = ""; }));
    }

    // Typing caption, like the videos
    let timer = null;
    function say(text) {
      if (!capText) return;
      clearInterval(timer);
      if (o.still) { capText.textContent = text; return; }
      let i = 0; capText.textContent = "";
      timer = setInterval(() => { i += 2; capText.textContent = text.slice(0, i); if (i >= text.length) clearInterval(timer); }, 22);
    }
    let treeMode = 0;
    function activate(g) {
      say(g.getAttribute("data-say"));
      const act = g.getAttribute("data-act");
      if (act === "tree") { treeMode = (treeMode + 1) % 3; g.classList.remove("hs-mode-1", "hs-mode-2"); if (treeMode) g.classList.add("hs-mode-" + treeMode); }
      else if (act === "lights") g.classList.toggle("hs-dark");
      else if (act === "tip") { g.classList.remove("hs-tipping"); void g.getBBox(); g.classList.add("hs-tipping"); }
      g.classList.remove("hs-pop"); void g.getBBox(); g.classList.add("hs-pop");
    }
    svg.addEventListener("click", (e) => {
      const g = e.target.closest(".hs-hot");
      if (g) return activate(g);
      if (fw && !paused) { const r = stage.getBoundingClientRect(); fw.launch(e.clientX - r.left, Math.min(e.clientY - r.top, r.height * 0.6)); }
    });
    svg.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest(".hs-hot")) { e.preventDefault(); activate(e.target.closest(".hs-hot")); } });
    const pbtn = sec.querySelector('[data-act="pause"]');
    if (pbtn) pbtn.addEventListener("click", () => {
      paused = !paused;
      sec.classList.toggle("hs-paused", paused);
      pbtn.textContent = paused ? "Play scene" : "Pause scene";
      pbtn.setAttribute("aria-pressed", paused ? "true" : "false");
      try { paused ? svg.pauseAnimations() : svg.unpauseAnimations(); } catch (e) { /* old browser */ }
      run();
    });
  }

  window.HolidayScenes = {
    render(id, o) {
      H = o.helpers; flagCount = 0;
      if (id === "christmas") return christmas(o);
      if (id === "easter") return easter(o);
      if (id === "independence") return independence(o);
      if (id === "thanksgiving") return thanksgiving(o);
      return banner(id, o);
    }
  };
})();
