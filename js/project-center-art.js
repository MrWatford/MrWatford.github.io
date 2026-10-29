/* =========================================================
   Science Project Center — setup drawings
   One small animated drawing per project, keyed by the project's id
   in js/project-center-data.js. Each drawing is 320 × 180 with the
   table top at y = 140. Moving parts use the a-… classes in style.css
   (they move on hover and inside the project window).
   To add a drawing for a new project: add an entry to PROJECT_ART
   with alt (a short description) and draw (returns SVG shapes).
   ========================================================= */

const PROJECT_ART = (function () {
  /* ---------- Reusable parts ---------- */
  const WALL = '<rect width="320" height="180" fill="#eef5ef"/>';
  const TABLE = '<rect y="140" width="320" height="40" fill="#c98a4b"/><rect y="140" width="320" height="6" fill="#26292b"/>';
  const FLOOR = '<rect y="140" width="320" height="40" fill="#d8c9b0"/><rect y="140" width="320" height="2" fill="#b9a88c"/>';
  const OUTSIDE = '<rect width="320" height="180" fill="#dff1fb"/>';

  function t(x, y, s, size, color) {
    return '<text x="' + x + '" y="' + y + '" class="pa-t" text-anchor="middle"' +
      (size ? ' font-size="' + size + '"' : "") + (color ? ' fill="' + color + '"' : "") + ">" + s + "</text>";
  }
  function anim(cls, inner, style) {
    return '<g class="' + cls + '"' + (style ? ' style="' + style + '"' : "") + ">" + inner + "</g>";
  }
  // Clear cup: x = center, y = bottom
  function cup(x, y, w, h, level, liquid) {
    const b = w * 0.4;
    let s = "";
    if (level) {
      const top = y - h * level;
      const wt = b + (w / 2 - b) * level;
      s += '<path d="M' + (x - wt) + " " + top + "L" + (x + wt) + " " + top + "L" + (x + b) + " " + y + "L" + (x - b) + " " + y + 'Z" fill="' + (liquid || "#8fcbec") + '"/>';
    }
    return s + '<path d="M' + (x - w / 2) + " " + (y - h) + "L" + (x + w / 2) + " " + (y - h) + "L" + (x + b) + " " + y + "L" + (x - b) + " " + y + 'Z" fill="#fff" fill-opacity=".35" stroke="#8fb6cf" stroke-width="2"/>';
  }
  function thermo(x, y, h, level) {
    return '<rect x="' + (x - 3) + '" y="' + (y - h) + '" width="6" height="' + h + '" rx="3" fill="#fff" stroke="#9aa3ad" stroke-width="1.5"/>' +
      '<rect x="' + (x - 1.5) + '" y="' + (y - h * (level || 0.5)) + '" width="3" height="' + h * (level || 0.5) + '" fill="#d6372e"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="5" fill="#d6372e"/>';
  }
  function pot(x, y, soil) {
    return '<path d="M' + (x - 16) + " " + (y - 22) + "h32l-5 22h-22z" + '" fill="#c8693b"/>' +
      '<rect x="' + (x - 18) + '" y="' + (y - 26) + '" width="36" height="6" rx="2" fill="#a8552c"/>' +
      '<rect x="' + (x - 15) + '" y="' + (y - 27) + '" width="30" height="3" fill="' + (soil || "#5b3a23") + '"/>';
  }
  function plant(x, y, h, delay, leaf) {
    const top = y - h;
    return anim("a-grow",
      '<path d="M' + x + " " + y + "V" + top + '" stroke="#2f7a35" stroke-width="2.5"/>' +
      '<ellipse cx="' + (x - 7) + '" cy="' + (top + 3) + '" rx="7" ry="3.5" fill="' + (leaf || "#43a267") + '" transform="rotate(-25 ' + (x - 7) + " " + (top + 3) + ')"/>' +
      '<ellipse cx="' + (x + 7) + '" cy="' + (top + 3) + '" rx="7" ry="3.5" fill="' + (leaf || "#43a267") + '" transform="rotate(25 ' + (x + 7) + " " + (top + 3) + ')"/>',
      delay ? "animation-delay:" + delay + "s" : "");
  }
  function drop(x, y, delay, dy, color) {
    return anim("a-drip", '<path d="M' + x + " " + (y - 4) + "q3 4 3 6a3 3 0 0 1-6 0q0-2 3-6z" + '" fill="' + (color || "#4a9fd8") + '"/>',
      "animation-delay:" + (delay || 0) + "s;--dy:" + (dy || 30) + "px");
  }
  function timer(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="13" fill="#fff" stroke="#2b2f33" stroke-width="3"/>' +
      '<rect x="' + (x - 3) + '" y="' + (y - 19) + '" width="6" height="5" fill="#2b2f33"/>' +
      anim("a-tick", '<path d="M' + x + " " + y + "V" + (y - 9) + '" stroke="#d6372e" stroke-width="2" stroke-linecap="round"/>');
  }
  function scale(x, y, txt) {
    return '<rect x="' + (x - 28) + '" y="' + (y - 14) + '" width="56" height="14" rx="3" fill="#e9edf0" stroke="#9aa3ad" stroke-width="1.5"/>' +
      '<rect x="' + (x - 12) + '" y="' + (y - 11) + '" width="24" height="8" rx="1" fill="#26292b"/>' + t(x, y - 4.5, txt || "g", 6.5, "#7cf08c");
  }
  function meter(x, y, txt) {
    return '<rect x="' + (x - 18) + '" y="' + (y - 40) + '" width="36" height="40" rx="5" fill="#f5c431" stroke="#2b2f33" stroke-width="2"/>' +
      '<rect x="' + (x - 13) + '" y="' + (y - 35) + '" width="26" height="11" fill="#cfe6d6" stroke="#2b2f33"/>' +
      anim("a-pulse", t(x, y - 26.5, txt, 7.5, "#163d24")) +
      '<circle cx="' + x + '" cy="' + (y - 11) + '" r="7" fill="#2b2f33"/><path d="M' + x + " " + (y - 11) + "l4-4" + '" stroke="#fff" stroke-width="1.5"/>';
  }
  function battery(x, y) {
    return '<rect x="' + (x - 9) + '" y="' + (y - 34) + '" width="18" height="34" rx="3" fill="#2b2f33"/>' +
      '<rect x="' + (x - 9) + '" y="' + (y - 34) + '" width="18" height="10" rx="3" fill="#c98a1b"/>' +
      '<rect x="' + (x - 3) + '" y="' + (y - 38) + '" width="6" height="4" fill="#9aa3ad"/>' + t(x, y - 12, "1.5V", 6, "#fff");
  }
  function ruler(x, y, len, vertical) {
    let ticks = "";
    for (let i = 0; i <= len; i += 10) {
      ticks += vertical
        ? '<path d="M' + x + " " + (y - i) + "h" + (i % 50 ? 4 : 7) + '" stroke="#5c4a12"/>'
        : '<path d="M' + (x + i) + " " + y + "v" + (i % 50 ? -4 : -7) + '" stroke="#5c4a12"/>';
    }
    return (vertical
      ? '<rect x="' + x + '" y="' + (y - len) + '" width="10" height="' + len + '" fill="#f5d76e"/>'
      : '<rect x="' + x + '" y="' + (y - 10) + '" width="' + len + '" height="10" fill="#f5d76e"/>') + ticks;
  }
  function sun(x, y) {
    return anim("a-pulse", '<g stroke="#f5c431" stroke-width="4" stroke-linecap="round"><path d="M' + x + " " + (y - 30) + "v-8M" + x + " " + (y + 30) + "v8M" + (x - 30) + " " + y + "h-8M" + (x + 30) + " " + y + "h8M" + (x - 21) + " " + (y - 21) + "l-6-6M" + (x + 21) + " " + (y - 21) + "l6-6M" + (x - 21) + " " + (y + 21) + "l-6 6M" + (x + 21) + " " + (y + 21) + 'l6 6"/></g>') +
      '<circle cx="' + x + '" cy="' + y + '" r="22" fill="#f5c431"/>';
  }
  function heat(x, y, delay) {
    return anim("a-rise", '<path d="M' + x + " " + y + "c-4-5 4-8 0-13s4-8 0-13" + '" fill="none" stroke="#e8462e" stroke-width="2" stroke-linecap="round" opacity=".7"/>',
      "animation-delay:" + (delay || 0) + "s");
  }
  function vapor(x, y, delay) {
    return anim("a-rise", '<path d="M' + x + " " + y + "c-3-4 3-6 0-10s3-6 0-10" + '" fill="none" stroke="#7fb8dc" stroke-width="2" stroke-linecap="round"/>',
      "animation-delay:" + (delay || 0) + "s");
  }
  function bag(x, y, label, roots, delay) {
    let seeds = "";
    for (let i = 0; i < 5; i++) {
      const sx = x - 16 + i * 8;
      seeds += '<ellipse cx="' + sx + '" cy="' + (y - 18) + '" rx="2.5" ry="1.8" fill="#7a4b2a"/>';
      if (i < roots) seeds += anim("a-grow", '<path d="M' + sx + " " + (y - 16) + "v8" + '" stroke="#f3efe6" stroke-width="1.6" stroke-linecap="round"/>', "animation-delay:" + ((delay || 0) + i * 0.3) + "s");
    }
    return '<rect x="' + (x - 24) + '" y="' + (y - 34) + '" width="48" height="32" rx="2" fill="#fff" fill-opacity=".55" stroke="#9cc7e0" stroke-width="1.5"/>' +
      '<rect x="' + (x - 24) + '" y="' + (y - 34) + '" width="48" height="4" fill="#2f6fc4" opacity=".6"/>' +
      '<rect x="' + (x - 20) + '" y="' + (y - 27) + '" width="40" height="22" fill="#f6f1e2"/>' + seeds + t(x, y + 9, label, 7.5);
  }
  function books(x, y, n) {
    const colors = ["#2f6fc4", "#c6362c", "#2e7d4a", "#f5c431", "#7a4b9a"];
    let s = "";
    for (let i = 0; i < n; i++) s += '<rect x="' + (x - 18 + (i % 2) * 2) + '" y="' + (y - (i + 1) * 9) + '" width="36" height="9" rx="1" fill="' + colors[i % 5] + '"/>';
    return s;
  }
  function bottleFunnel(x, y, layers) {
    let s = '<path d="M' + (x - 18) + " " + (y - 40) + "h36v40h-36z" + '" fill="#fff" fill-opacity=".4" stroke="#8fb6cf" stroke-width="2"/>';
    let top = y - 98;
    s += '<path d="M' + (x - 20) + " " + top + "h40v40l-14 14h-12l-14-14z" + '" fill="#fff" fill-opacity=".4" stroke="#8fb6cf" stroke-width="2"/>';
    layers.forEach(function (l) {
      s += '<rect x="' + (x - 19) + '" y="' + top + '" width="38" height="' + l[1] + '" fill="' + l[0] + '"/>';
      top += l[1];
    });
    return s;
  }
  function chair(x, y) {
    return '<path d="M' + (x - 12) + " " + y + "v-30h24v30M" + (x - 12) + " " + (y - 30) + "v-26" + '" stroke="#8a5a2b" stroke-width="4" fill="none"/>';
  }
  function fan(x, y) {
    return '<rect x="' + (x - 4) + '" y="' + (y - 36) + '" width="8" height="36" fill="#9aa3ad"/><rect x="' + (x - 18) + '" y="' + (y - 4) + '" width="36" height="5" rx="2" fill="#5c6a60"/>' +
      '<circle cx="' + x + '" cy="' + (y - 56) + '" r="26" fill="#fff" stroke="#5c6a60" stroke-width="3"/>' +
      anim("a-spin", '<g fill="#8fb6cf"><ellipse cx="' + x + '" cy="' + (y - 70) + '" rx="6" ry="13"/><ellipse cx="' + x + '" cy="' + (y - 42) + '" rx="6" ry="13"/><ellipse cx="' + (x - 14) + '" cy="' + (y - 56) + '" rx="13" ry="6"/><ellipse cx="' + (x + 14) + '" cy="' + (y - 56) + '" rx="13" ry="6"/></g><circle cx="' + x + '" cy="' + (y - 56) + '" r="4" fill="#5c6a60"/>');
  }
  function bulb(x, y, glow) {
    return (glow ? anim("a-pulse", '<circle cx="' + x + '" cy="' + (y - 14) + '" r="' + (8 + glow * 6) + '" fill="#ffe27a" opacity=".6"/>') : "") +
      '<circle cx="' + x + '" cy="' + (y - 14) + '" r="8" fill="' + (glow ? "#ffe27a" : "#f4f4f4") + '" stroke="#9aa3ad" stroke-width="1.5"/>' +
      '<rect x="' + (x - 5) + '" y="' + (y - 6) + '" width="10" height="6" fill="#9aa3ad"/>';
  }
  function iceCube(x, y, s) {
    return '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="2" fill="#e6f6ff" stroke="#9cc7e0"/>';
  }
  function frame(x, y, braces) {
    let s = '<g stroke="#c99a2e" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M' + (x - 14) + " " + y + "V" + (y - 66) + "M" + (x + 14) + " " + y + "V" + (y - 66) + "M" + (x - 14) + " " + (y - 22) + "h28M" + (x - 14) + " " + (y - 44) + "h28M" + (x - 14) + " " + (y - 66) + 'h28"/>';
    if (braces) s += '<path d="M' + (x - 14) + " " + y + "l28-22M" + (x + 14) + " " + y + "l-28-22M" + (x - 14) + " " + (y - 22) + "l28-22M" + (x + 14) + " " + (y - 22) + "l-28-22M" + (x - 14) + " " + (y - 44) + "l28-22M" + (x + 14) + " " + (y - 44) + 'l-28-22" stroke="#2e7d4a" stroke-width="' + (braces > 1 ? 2 : 1.2) + '"/>';
    return s + '</g><rect x="' + (x - 8) + '" y="' + (y - 72) + '" width="16" height="7" rx="2" fill="#7a4b2a"/>';
  }

  /* ---------- One drawing per project ---------- */
  return {
    "paper-towel-absorbency": {
      alt: "A paper towel square hangs from a clip and drips into a bowl of water. Rolls labeled A, B, and C and a kitchen scale sit nearby.",
      draw: function () {
        return WALL + TABLE +
          '<g><rect x="190" y="70" width="22" height="40" rx="3" fill="#fff" stroke="#c9d3cc"/><rect x="220" y="70" width="22" height="40" rx="3" fill="#fbf3e2" stroke="#c9d3cc"/><rect x="250" y="70" width="22" height="40" rx="3" fill="#eef6ff" stroke="#c9d3cc"/></g>' +
          t(201, 94, "A", 10) + t(231, 94, "B", 10) + t(261, 94, "C", 10) +
          '<path d="M40 30h110" stroke="#8a5a2b" stroke-width="4"/><path d="M60 30V140" stroke="#8a5a2b" stroke-width="4"/>' +
          '<rect x="104" y="27" width="8" height="12" fill="#f5c431"/>' +
          '<rect x="88" y="38" width="40" height="40" fill="#fff" stroke="#c9d3cc"/><g fill="#dfe6e2"><circle cx="96" cy="46" r="1.5"/><circle cx="108" cy="54" r="1.5"/><circle cx="120" cy="46" r="1.5"/><circle cx="100" cy="66" r="1.5"/><circle cx="116" cy="70" r="1.5"/></g>' +
          drop(102, 84, 0, 34) + drop(114, 84, 0.7, 34) +
          '<path d="M78 126h60a30 14 0 0 1-60 0z" fill="#8fcbec" stroke="#8fb6cf" stroke-width="2"/>' +
          scale(240, 140, "g") + timer(290, 120);
      }
    },
    "paper-airplane-wing-width": {
      alt: "A paper airplane glides over a hallway floor from a tape launch line toward a sticky note, with a tape measure along the floor.",
      draw: function () {
        return WALL + FLOOR +
          '<rect x="20" y="140" width="6" height="40" fill="#5aa6dd"/>' + t(23, 136, "launch", 7) +
          '<rect x="30" y="160" width="270" height="8" fill="#f5d76e"/>' +
          (function () { let s = ""; for (let i = 0; i <= 270; i += 27) s += '<path d="M' + (30 + i) + ' 160v4" stroke="#5c4a12"/>'; return s; })() +
          '<rect x="262" y="146" width="14" height="10" fill="#ffe27a" stroke="#d9a90f"/>' +
          '<path d="M40 70Q160 40 268 140" fill="none" stroke="#9aa3ad" stroke-width="1.5" stroke-dasharray="4 4"/>' +
          anim("a-fly", '<path d="M30 74l34 6-34 6 6-6z" fill="#fff" stroke="#5c6a60" stroke-width="1.5"/><path d="M36 80l28 0" stroke="#5c6a60"/>', "--dx:230px;--dy:62px");
      }
    },
    "light-seedling-growth": {
      alt: "Three pots of seedlings sit under an LED lamp, labeled 4 hours, 8 hours, and 12 hours of light. A cardboard box waits to cover them.",
      draw: function () {
        return WALL + TABLE +
          '<path d="M40 140V30h70" stroke="#5c6a60" stroke-width="5" fill="none"/><path d="M95 30h70l-10 14h-50z" fill="#2b2f33"/>' +
          anim("a-pulse", '<path d="M105 44h50l40 90H65z" fill="#fff3c4" opacity=".55"/>') +
          pot(90, 140) + plant(90, 113, 26) + pot(130, 140) + plant(130, 113, 26, 0.4) + pot(170, 140) + plant(170, 113, 26, 0.8) +
          t(90, 158, "4 hr", 8, "#fff") + t(130, 158, "8 hr", 8, "#fff") + t(170, 158, "12 hr", 8, "#fff") +
          '<path d="M230 140v-46h60v46z" fill="#c8a06a"/><path d="M230 94l10-12h60l-10 12z" fill="#dcb47e"/>' + t(260, 120, "dark box", 8);
      }
    },
    "water-seed-germination": {
      alt: "Five zip-top bags with seeds on damp paper towels, labeled 0, 5, 10, 20, and 30 milliliters of water. The seeds are checked each day for tiny roots.",
      draw: function () {
        return WALL + TABLE +
          bag(40, 130, "0 mL", 3) + bag(100, 130, "5 mL", 3, 0.3) + bag(160, 130, "10 mL", 3, 0.6) + bag(220, 130, "20 mL", 3, 0.9) + bag(280, 130, "30 mL", 3, 1.2) +
          '<rect x="140" y="40" width="40" height="8" rx="2" fill="#9aa3ad"/><ellipse cx="135" cy="44" rx="10" ry="6" fill="#d9e6ef" stroke="#9aa3ad"/>' + t(160, 36, "5 mL spoon", 8);
      }
    },
    "ramp-height-toy-car": {
      alt: "A toy car rolls down a board propped on a stack of books and across the floor next to a tape measure.",
      draw: function () {
        return WALL + FLOOR + books(40, 140, 6) +
          '<path d="M24 86L150 140" stroke="#a86f38" stroke-width="6" stroke-linecap="round"/>' +
          ruler(10, 140, 54, true) +
          '<rect x="150" y="164" width="160" height="8" fill="#f5d76e"/>' +
          anim("a-roll", '<rect x="146" y="128" width="24" height="9" rx="3" fill="#c6362c"/><rect x="151" y="123" width="12" height="6" rx="2" fill="#e8746b"/><circle cx="151" cy="138" r="3.5" fill="#26292b"/><circle cx="165" cy="138" r="3.5" fill="#26292b"/>', "--dx:120px");
      }
    },
    "ice-cube-insulation": {
      alt: "Five cups of ice side by side: one wrapped in foil, one in a sock, one in bubble wrap, one in newspaper, and one unwrapped. Each cup is checked for meltwater after the same time.",
      draw: function () {
        const cups = [[40, "#c7ccd1", "foil"], [95, "#c6362c", "sock"], [150, "#e6f2fb", "bubble"], [205, "#d9d4c6", "paper"]];
        let s = WALL + TABLE;
        cups.forEach(function (c) {
          s += '<path d="M' + (c[0] - 20) + ' 82h40l-5 58h-30z" fill="' + c[1] + '" stroke="#8a9199"/>';
          if (c[2] === "bubble") s += '<g fill="#fff" stroke="#9cc7e0"><circle cx="' + (c[0] - 8) + '" cy="96" r="4"/><circle cx="' + (c[0] + 6) + '" cy="104" r="4"/><circle cx="' + (c[0] - 4) + '" cy="118" r="4"/><circle cx="' + (c[0] + 8) + '" cy="126" r="4"/></g>';
          if (c[2] === "paper") s += '<path d="M' + (c[0] - 14) + " 96h28M" + (c[0] - 13) + " 106h26M" + (c[0] - 12) + " 116h24M" + (c[0] - 11) + ' 126h22" stroke="#8a8270"/>';
          s += t(c[0], 160, c[2], 8, "#fff");
        });
        s += cup(265, 140, 40, 58, 0.2) + anim("a-melt", iceCube(252, 104, 14) + iceCube(266, 110, 14) + iceCube(258, 118, 14)) + t(265, 160, "unwrapped", 8, "#fff");
        return s;
      }
    },
    "water-temperature-dissolving": {
      alt: "Three clear cups of water labeled cool, room, and warm, each with a thermometer. A spoon stirs sugar in one cup and a timer runs.",
      draw: function () {
        let s = WALL + TABLE;
        [[70, "cool", "#bfe3f7"], [150, "room", "#cfe8f3"], [230, "warm", "#f6dccf"]].forEach(function (c, i) {
          s += cup(c[0], 140, 48, 60, 0.75, c[2]) + thermo(c[0] + 16, 128, 56, 0.5) + t(c[0], 160, c[1], 9, "#fff");
          s += anim("a-fade", '<g fill="#fff"><circle cx="' + (c[0] - 8) + '" cy="134" r="1.6"/><circle cx="' + (c[0] - 2) + '" cy="135" r="1.6"/><circle cx="' + (c[0] + 4) + '" cy="134" r="1.6"/><circle cx="' + c[0] + '" cy="132" r="1.6"/></g>', "animation-delay:" + i * 0.3 + "s");
        });
        s += anim("a-stir", '<path d="M150 50L146 128" stroke="#9aa3ad" stroke-width="3" stroke-linecap="round"/><ellipse cx="145" cy="130" rx="5" ry="3" fill="#9aa3ad"/>') + timer(290, 60);
        return s;
      }
    },
    "surface-color-warming": {
      alt: "Cups of water wrapped in white, black, red, and blue paper sit in sunlight, each with a thermometer. The temperature of each cup is recorded every 10 minutes.",
      draw: function () {
        let s = OUTSIDE + '<rect y="140" width="320" height="40" fill="#8bc47a"/>' + sun(40, 38);
        [[110, "#fff"], [160, "#26292b"], [210, "#c6362c"], [260, "#2f6fc4"]].forEach(function (c, i) {
          s += '<path d="M' + (c[0] - 18) + ' 92h36l-4 48h-28z" fill="' + c[1] + '" stroke="#8a9199"/>' + thermo(c[0], 98, 30, 0.5);
        });
        return s;
      }
    },
    "pendulum-length": {
      alt: "A string with metal washers hangs from a pencil taped to a table edge and swings back and forth. A protractor and stopwatch are nearby.",
      draw: function () {
        return WALL + '<rect x="0" y="22" width="120" height="12" fill="#c98a4b"/><rect x="0" y="22" width="120" height="3" fill="#26292b"/>' +
          '<rect x="108" y="20" width="40" height="5" rx="2" fill="#f5c431"/>' +
          '<path d="M128 26a26 26 0 0 0 0 0" /><path d="M110 38a20 20 0 0 0 36 0" fill="#fff" fill-opacity=".6" stroke="#9aa3ad"/>' +
          anim("a-swing", '<path d="M128 26V132" stroke="#5c6a60" stroke-width="1.5"/><circle cx="128" cy="138" r="8" fill="#9aa3ad" stroke="#5c6a60" stroke-width="2"/><circle cx="128" cy="138" r="3" fill="#eef5ef"/>') +
          timer(250, 90) + t(250, 120, "10 swings", 9);
      }
    },
    "soil-drainage": {
      alt: "Three cut plastic bottles act as funnels holding sand, potting soil, and clay soil. Water drips through into the bottoms.",
      draw: function () {
        let s = WALL + TABLE;
        [[70, "#e3c98f", "sand"], [160, "#5b3a23", "potting"], [250, "#a0522d", "clay"]].forEach(function (c, i) {
          s += bottleFunnel(c[0], 140, [[c[1], 30]]) + drop(c[0], 96, i * 0.5, 30) +
            anim("a-fill", '<rect x="' + (c[0] - 17) + '" y="128" width="34" height="11" fill="#8fcbec" opacity=".85"/>', "animation-delay:" + i * 0.5 + "s") +
            t(c[0], 160, c[2], 9, "#fff");
        });
        return s;
      }
    },
    "rubber-band-pitch": {
      alt: "A rubber band stretched around an open box with a pencil bridge under it. The band vibrates and music notes float up toward a tuner.",
      draw: function () {
        return WALL + TABLE + '<path d="M40 140v-40h220v40z" fill="#c8a06a"/><path d="M40 100l16-14h220l-16 14z" fill="#dcb47e"/>' +
          '<rect x="160" y="88" width="8" height="12" fill="#f5c431"/>' +
          '<path d="M40 100H160" stroke="#d6372e" stroke-width="2"/>' +
          anim("a-vib", '<path d="M168 98Q214 92 260 98" stroke="#d6372e" stroke-width="2.5" fill="none"/>') +
          anim("a-rise", t(210, 78, "♪", 16, "#2f6fc4")) + anim("a-rise", t(232, 74, "♫", 16, "#2f6fc4"), "animation-delay:1.1s") +
          '<rect x="276" y="44" width="30" height="50" rx="5" fill="#2b2f33"/><rect x="280" y="50" width="22" height="20" fill="#7cf08c"/>' + t(291, 64, "Hz", 8, "#163d24") + ruler(170, 128, 90);
      }
    },
    "drops-on-a-penny": {
      alt: "A dropper releases drops onto a penny on a plate, where water forms a dome. Cups labeled 0, 1, 2, and 4 drops of soap wait nearby.",
      draw: function () {
        let s = WALL + TABLE + '<ellipse cx="110" cy="138" rx="48" ry="7" fill="#fff" stroke="#c9d3cc"/>' +
          '<ellipse cx="110" cy="134" rx="16" ry="4" fill="#c87533"/><path d="M95 134q15-14 30 0z" fill="#8fcbec" opacity=".8"/>' +
          '<path d="M106 30h8v40l-4 8-4-8z" fill="#e6f2fb" stroke="#8fb6cf"/><rect x="103" y="18" width="14" height="14" rx="5" fill="#d6372e"/>' +
          drop(110, 84, 0, 40);
        [["0", 200], ["1", 230], ["2", 260], ["4", 290]].forEach(function (c) { s += cup(c[1], 140, 24, 30, 0.6, "#cfe8f3") + t(c[1], 158, c[0], 9, "#fff"); });
        return s + t(250, 96, "drops of soap", 8);
      }
    },
    "salt-seed-germination": {
      alt: "Seed bags labeled 0, one quarter, one half, and 1 teaspoon of salt, next to cups of salt water and a salt shaker.",
      draw: function () {
        return WALL + TABLE + bag(45, 130, "0 tsp", 3) + bag(110, 130, "¼ tsp", 3, 0.3) + bag(175, 130, "½ tsp", 3, 0.6) + bag(240, 130, "1 tsp", 3, 0.9) +
          '<rect x="278" y="62" width="22" height="34" rx="6" fill="#fff" stroke="#9aa3ad"/><rect x="278" y="56" width="22" height="10" rx="3" fill="#9aa3ad"/>' + t(289, 84, "SALT", 6.5) +
          anim("a-drip", '<g fill="#fff" stroke="#9aa3ad" stroke-width=".5"><rect x="286" y="100" width="2" height="2"/><rect x="290" y="104" width="2" height="2"/></g>', "--dy:24px");
      }
    },
    "soil-type-plant-growth": {
      alt: "Three groups of bean plants grow in pots of different soils: dark potting mix, tan sandy soil, and reddish clay soil, next to a sunny window.",
      draw: function () {
        let s = WALL + TABLE + '<rect x="250" y="20" width="60" height="70" fill="#dff1fb" stroke="#fff" stroke-width="5"/><path d="M280 20v70M250 55h60" stroke="#fff" stroke-width="4"/>';
        [[40, "#3b2414", 26], [72, "#3b2414", 26], [120, "#d9bf82", 26], [152, "#d9bf82", 26], [200, "#a0522d", 26], [232, "#a0522d", 26]].forEach(function (p, i) {
          s += pot(p[0], 140, p[1]) + plant(p[0], 113, p[2], i * 0.3);
        });
        return s + t(56, 158, "potting mix", 8, "#fff") + t(136, 158, "sandy", 8, "#fff") + t(216, 158, "clay", 8, "#fff");
      }
    },
    "water-filter-materials": {
      alt: "Cloudy brown water is poured into a bottle funnel filled with layers of gravel, sand, and charcoal. Clearer water drips into a cup in front of a card with an X. A sign says do not drink.",
      draw: function () {
        return WALL + TABLE + '<path d="M50 40h34v40H50z" fill="#b08a5a" opacity=".85"/><path d="M50 40h34v40H50zM84 48h8v20h-8" fill="none" stroke="#8fb6cf" stroke-width="2"/>' +
          '<path d="M92 56q14 0 18 14" stroke="#b08a5a" stroke-width="4" fill="none"/>' +
          bottleFunnel(125, 140, [["#9a9a9a", 10], ["#e3c98f", 12], ["#2b2f33", 10], ["#fff", 6]]) +
          drop(125, 92, 0, 30, "#bfe3f7") +
          '<rect x="190" y="70" width="44" height="56" fill="#fff" stroke="#c9d3cc"/><path d="M200 82l24 32M224 82l-24 32" stroke="#26292b" stroke-width="5"/>' + cup(212, 140, 34, 40, 0.5, "#e2f1fa") +
          '<rect x="252" y="60" width="56" height="34" rx="4" fill="#c6362c"/>' + t(280, 76, "DO NOT", 8, "#fff") + t(280, 87, "DRINK", 8, "#fff");
      }
    },
    "electromagnet-coils": {
      alt: "A large nail wrapped in copper wire connects to a battery. Paper clips cling to the tip of the nail above a pile of clips.",
      draw: function () {
        let coil = "";
        for (let i = 0; i < 9; i++) coil += '<ellipse cx="' + (110 + i * 9) + '" cy="80" rx="3.5" ry="11" fill="none" stroke="#c87533" stroke-width="3"/>';
        return WALL + TABLE + battery(50, 140) + '<path d="M50 102V80h60M190 80h20v30H60v-6" fill="none" stroke="#c87533" stroke-width="2.5"/>' +
          '<path d="M100 76h110l14 4-14 4H100z" fill="#9aa3ad" stroke="#5c6a60"/><rect x="96" y="72" width="6" height="16" fill="#5c6a60"/>' + coil +
          '<g fill="none" stroke="#9aa3ad" stroke-width="2"><rect x="222" y="84" width="6" height="14" rx="3"/><rect x="224" y="96" width="6" height="14" rx="3"/><rect x="219" y="108" width="6" height="14" rx="3"/></g>' +
          anim("a-pulse", '<g stroke="#f5c431" stroke-width="2" stroke-linecap="round"><path d="M232 70l6-6M236 80h8M232 90l6 6"/></g>') +
          '<g fill="none" stroke="#9aa3ad" stroke-width="2"><rect x="200" y="132" width="14" height="6" rx="3"/><rect x="214" y="130" width="14" height="6" rx="3"/><rect x="228" y="133" width="14" height="6" rx="3"/><rect x="210" y="126" width="14" height="6" rx="3"/></g>';
      }
    },
    "fruit-battery": {
      alt: "A lemon with a zinc nail and a copper strip pushed into it, connected by red and black wires to a multimeter. An orange and an apple wait their turn.",
      draw: function () {
        return WALL + TABLE + '<ellipse cx="110" cy="116" rx="46" ry="28" fill="#f5d431" stroke="#d9b40f" stroke-width="2"/><ellipse cx="62" cy="116" rx="5" ry="4" fill="#d9b40f"/>' +
          '<rect x="94" y="70" width="4" height="34" fill="#9aa3ad"/><rect x="122" y="70" width="6" height="34" fill="#c87533"/>' +
          t(82, 68, "zinc", 8) + t(144, 68, "copper", 8) +
          '<path d="M125 72C160 40 200 50 220 96" fill="none" stroke="#d6372e" stroke-width="2.5"/><path d="M96 72C130 20 210 30 232 96" fill="none" stroke="#26292b" stroke-width="2.5"/>' +
          meter(226, 140, "_ . _ V") + '<circle cx="280" cy="128" r="12" fill="#f79a2f"/><circle cx="302" cy="128" r="11" fill="#d6372e"/>';
      }
    },
    "paper-bridge-strength": {
      alt: "A folded zigzag paper bridge spans the gap between two stacks of books. A small cup on the bridge fills with pennies.",
      draw: function () {
        let zig = "M70 86";
        for (let i = 0; i < 18; i++) zig += "l10 " + (i % 2 ? -8 : 8);
        return WALL + TABLE + books(70, 140, 6) + books(250, 140, 6) +
          '<path d="' + zig + '" fill="none" stroke="#9aa3ad" stroke-width="2"/><path d="M52 86h216" stroke="#c9d3cc" stroke-width="1.5"/>' +
          '<path d="M148 62h24l-3 22h-18z" fill="#fff" stroke="#9aa3ad" stroke-width="1.5"/>' +
          anim("a-drip", '<ellipse cx="160" cy="44" rx="6" ry="2.5" fill="#c87533" stroke="#9a5525"/>', "--dy:30px") +
          anim("a-drip", '<ellipse cx="157" cy="44" rx="6" ry="2.5" fill="#c87533" stroke="#9a5525"/>', "--dy:30px;animation-delay:.7s") +
          '<path d="M88 108h144" stroke="#26292b" stroke-dasharray="3 3"/>' + t(160, 122, "20 cm gap", 9);
      }
    },
    "parachute-size": {
      alt: "A small plastic parachute carrying metal washers floats down beside a wall with a tape mark at 2 meters. A stopwatch times the fall.",
      draw: function () {
        return WALL + FLOOR + '<rect x="40" y="20" width="16" height="3" fill="#5aa6dd"/>' + t(48, 16, "2 m", 9) + ruler(30, 140, 118, true) +
          anim("a-fall", '<path d="M110 30q30-24 60 0z" fill="#e8462e"/><path d="M110 30l26 34M170 30l-26 34M124 26l12 38M156 26l-12 38" stroke="#5c6a60" stroke-width="1"/><circle cx="140" cy="68" r="5" fill="#9aa3ad" stroke="#5c6a60" stroke-width="1.5"/>', "--dy:64px") +
          timer(250, 80);
      }
    },
    "salt-ice-melting": {
      alt: "Bowls of ice cubes get different amounts of salt from a shaker. Meltwater collects in the bowls next to a kitchen scale.",
      draw: function () {
        let s = WALL + TABLE;
        [[50, "0 g"], [115, "2 g"], [180, "4 g"], [245, "8 g"]].forEach(function (b, i) {
          s += '<path d="M' + (b[0] - 26) + ' 118h52a26 22 0 0 1-52 0z" fill="#fff" stroke="#9aa3ad" stroke-width="1.5"/>' +
            anim("a-melt", iceCube(b[0] - 14, 104, 12) + iceCube(b[0], 106, 12) + iceCube(b[0] - 6, 96, 12), "animation-delay:" + i * 0.4 + "s") +
            t(b[0], 156, b[1], 9, "#fff");
        });
        return s + '<rect x="160" y="40" width="20" height="30" rx="6" fill="#fff" stroke="#9aa3ad"/><rect x="160" y="34" width="20" height="9" rx="3" fill="#9aa3ad"/>' + t(170, 60, "SALT", 6) +
          anim("a-drip", '<g fill="#fff" stroke="#9aa3ad" stroke-width=".5"><rect x="166" y="76" width="2" height="2"/><rect x="172" y="80" width="2" height="2"/></g>', "--dy:20px") + scale(295, 140, "g");
      }
    },
    "evaporation-surface-area": {
      alt: "A narrow cup, a medium bowl, and a wide pan each hold the same amount of water. Wavy lines show water evaporating, and each container is weighed daily.",
      draw: function () {
        return WALL + TABLE + cup(60, 140, 30, 60, 0.75) + vapor(60, 92, 0) +
          '<path d="M110 110h70l-8 30h-54z" fill="#fff" fill-opacity=".4" stroke="#8fb6cf" stroke-width="2"/><path d="M114 120h62l-5 20h-52z" fill="#8fcbec"/>' + vapor(135, 112, 0.4) + vapor(155, 112, 1.2) +
          '<path d="M200 126h110l-4 14H204z" fill="#8fcbec" stroke="#8fb6cf" stroke-width="2"/>' + vapor(240, 122, 0.2) + vapor(275, 122, 1.0) +
          t(60, 160, "narrow", 8, "#fff") + t(145, 160, "medium", 8, "#fff") + t(255, 160, "wide", 8, "#fff");
      }
    },
    "crystal-growth-cooling": {
      alt: "Three cups of Epsom salt solution cooling in a refrigerator, on a counter, and wrapped in a towel. Needle-shaped crystals grow inside.",
      draw: function () {
        function crystals(x, d, y) {
          y = y || 136;
          return anim("a-grow", '<g stroke="#4f84c9" stroke-width="2.5" stroke-linecap="round"><path d="M' + (x - 8) + " " + y + "l-4-16M" + x + " " + y + "v-20M" + (x + 8) + " " + y + "l5-14M" + (x - 3) + " " + y + 'l-8-10"/></g>', "animation-delay:" + d + "s");
        }
        return WALL + TABLE + '<rect x="20" y="40" width="70" height="100" rx="6" fill="#e9edf0" stroke="#9aa3ad" stroke-width="2"/>' + t(55, 56, "❄ fridge", 9) +
          cup(55, 140, 34, 40, 0.75, "#d6ecf7") + crystals(55, 0) +
          cup(160, 140, 34, 40, 0.75, "#d6ecf7") + crystals(160, 0.6) + t(160, 160, "counter", 8, "#fff") +
          cup(260, 138, 30, 40, 0.75, "#d6ecf7") + crystals(260, 1.2, 134) + '<path d="M236 112h48v28h-48z" fill="#e8746b" opacity=".92"/><path d="M236 120h48M236 130h48" stroke="#c6362c"/>' + t(260, 160, "wrapped", 8, "#fff");
      }
    },
    "balloon-rocket-payload": {
      alt: "A balloon taped to a straw zooms along a string stretched between two chairs, carrying paper clips hanging underneath.",
      draw: function () {
        return WALL + FLOOR + chair(30, 140) + chair(290, 140) + '<path d="M30 60H290" stroke="#5c6a60" stroke-width="1.5"/>' +
          anim("a-roll", '<rect x="44" y="57" width="34" height="5" fill="#fff" stroke="#9aa3ad"/><ellipse cx="62" cy="74" rx="24" ry="13" fill="#e8462e"/><path d="M38 74l-6-3v6z" fill="#c6362c"/>' +
            '<g fill="none" stroke="#9aa3ad" stroke-width="1.5"><rect x="58" y="86" width="4" height="9" rx="2"/><rect x="65" y="86" width="4" height="9" rx="2"/></g>', "--dx:180px");
      }
    },
    "wind-evaporation": {
      alt: "A fan blows across three shallow dishes of water on a tray one meter away. Water vapor drifts away from the dishes.",
      draw: function () {
        let s = WALL + TABLE + fan(50, 140) + '<path d="M80 154h120" stroke="#fff" stroke-dasharray="4 3"/>' + t(140, 168, "1 m", 9, "#fff");
        [170, 225, 280].forEach(function (x, i) {
          s += '<path d="M' + (x - 24) + ' 128h48l-4 12h-40z" fill="#8fcbec" stroke="#8fb6cf" stroke-width="2"/>' +
            anim("a-blow", '<path d="M' + (x - 10) + " 122c4-4 10-4 14 0s10 4 14 0" + '" fill="none" stroke="#7fb8dc" stroke-width="2"/>', "animation-delay:" + i * 0.5 + "s");
        });
        return s + anim("a-blow", '<path d="M86 80h40M90 92h30M86 104h40" stroke="#9aa3ad" stroke-width="2" stroke-linecap="round"/>');
      }
    },
    "solar-panel-angle": {
      alt: "A small solar panel on a cardboard stand tilts to different angles toward the sun, wired to a resistor and a multimeter.",
      draw: function () {
        return OUTSIDE + '<rect y="140" width="320" height="40" fill="#8bc47a"/>' + sun(270, 36) +
          '<path d="M60 140h60" stroke="#8a5a2b" stroke-width="5"/>' +
          anim("a-tilt", '<g><rect x="60" y="124" width="70" height="14" fill="#1f3c74" stroke="#9aa3ad" stroke-width="2"/><path d="M77 124v14M95 124v14M112 124v14" stroke="#5aa6dd"/></g>') +
          '<path d="M60 140a30 30 0 0 1 30-30" fill="none" stroke="#9aa3ad" stroke-dasharray="3 3"/>' +
          '<path d="M128 138C160 150 170 150 196 134" fill="none" stroke="#d6372e" stroke-width="2"/><rect x="150" y="142" width="16" height="6" rx="2" fill="#c8a06a"/>' + meter(214, 140, "_._ V");
      }
    },
    "wind-turbine-blades": {
      alt: "A fan blows on a model wind turbine with four cardstock blades on a small motor. Wires run from the motor to a multimeter.",
      draw: function () {
        return WALL + TABLE + fan(50, 140) +
          '<rect x="176" y="70" width="8" height="70" fill="#8a5a2b"/><rect x="164" y="134" width="32" height="6" fill="#8a5a2b"/><rect x="170" y="60" width="20" height="14" rx="3" fill="#9aa3ad"/>' +
          '<g transform="translate(166 67)">' + anim("a-spin", '<g fill="#f5c431" stroke="#c99a14"><rect x="-4" y="-34" width="8" height="30" rx="2"/><rect x="-4" y="4" width="8" height="30" rx="2"/><rect x="-34" y="-4" width="30" height="8" rx="2"/><rect x="4" y="-4" width="30" height="8" rx="2"/></g><circle r="5" fill="#7a4b2a"/>') + "</g>" +
          '<path d="M190 66C230 70 240 100 250 104" fill="none" stroke="#d6372e" stroke-width="2"/>' + meter(266, 140, "_._ V");
      }
    },
    "earthquake-model-buildings": {
      alt: "Three straw model buildings on a shake table: one with no braces, one with some diagonal braces, and one fully braced. The table shakes side to side.",
      draw: function () {
        return WALL + TABLE + '<rect x="40" y="132" width="240" height="8" rx="2" fill="#5c6a60"/>' +
          '<g fill="#5aa6dd"><circle cx="70" cy="137" r="3"/><circle cx="130" cy="137" r="3"/><circle cx="190" cy="137" r="3"/><circle cx="250" cy="137" r="3"/></g>' +
          anim("a-shake", '<rect x="50" y="122" width="220" height="10" rx="2" fill="#c8a06a"/>' + frame(90, 122, 0) + frame(160, 122, 1) + frame(230, 122, 2)) +
          t(90, 160, "no braces", 8, "#fff") + t(160, 160, "some braces", 8, "#fff") + t(230, 160, "all braced", 8, "#fff");
      }
    },
    "soil-erosion-ground-cover": {
      alt: "Three tilted trays of soil, one bare, one covered in mulch, and one with grass, get the same rain from a sprinkler bottle. Muddy runoff drains into cups.",
      draw: function () {
        let s = WALL + TABLE;
        [[60, "#7a4b2a", "bare"], [160, "#b5803f", "mulch"], [260, "#4f9a4a", "grass"]].forEach(function (c, i) {
          s += '<path d="M' + (c[0] - 40) + " 104L" + (c[0] + 34) + " 120v6L" + (c[0] - 40) + ' 110z" fill="#9aa3ad"/>' +
            '<path d="M' + (c[0] - 40) + " 98L" + (c[0] + 34) + " 114v6L" + (c[0] - 40) + ' 104z" fill="' + c[1] + '"/>' +
            (c[2] === "grass" ? '<path d="M' + (c[0] - 36) + " 98l2-6 2 6M" + (c[0] - 20) + " 102l2-6 2 6M" + (c[0] - 4) + " 106l2-6 2 6M" + (c[0] + 12) + " 109l2-6 2 6M" + (c[0] + 26) + ' 112l2-6 2 6" stroke="#2f7a35" fill="none"/>' : "") +
            cup(c[0] + 38, 140, 18, 16, 0.5, "#b8a07e") +
            drop(c[0] - 20, 56, i * 0.3, 40) + drop(c[0], 56, 0.6 + i * 0.3, 44) + t(c[0], 160, c[2], 8, "#fff");
        });
        return s;
      }
    },
    "automated-plant-watering": {
      alt: "Two potted plants: one gets water through a tube from a small pump when its moisture sensor says the soil is dry, and the other is watered by hand at 8 a.m. The electronics sit in a protective box.",
      draw: function () {
        return WALL + TABLE + pot(80, 140) + plant(80, 113, 30) + '<rect x="90" y="96" width="4" height="22" fill="#2e7d4a"/>' + t(80, 160, "sensor", 8, "#fff") +
          '<rect x="140" y="104" width="34" height="36" rx="3" fill="#cfe8f3" stroke="#8fb6cf" stroke-width="2"/><rect x="142" y="116" width="30" height="22" fill="#8fcbec"/>' + t(157, 98, "water", 8) +
          '<path d="M157 114V80H78v14" fill="none" stroke="#5aa6dd" stroke-width="3"/>' + drop(78, 102, 0, 10) +
          '<rect x="190" y="70" width="44" height="30" rx="4" fill="#e6f2fb" stroke="#9aa3ad" stroke-width="2"/><rect x="198" y="78" width="28" height="14" fill="#2e7d4a"/>' + t(212, 110, "kit in box", 8) +
          '<path d="M92 96C120 60 180 60 200 72" fill="none" stroke="#26292b" stroke-width="1.5" stroke-dasharray="3 2"/>' +
          pot(270, 140) + plant(270, 113, 28, 0.5) + t(270, 160, "8 a.m.", 8, "#fff");
      }
    },
    "solar-oven-insulation": {
      alt: "A pizza-box solar oven with a foil reflector flap, a plastic window, black paper inside, and a thermometer sits in the sun. Heat shimmers above it.",
      draw: function () {
        return OUTSIDE + '<rect y="140" width="320" height="40" fill="#8bc47a"/>' + sun(270, 36) +
          '<path d="M70 140l20-24h140l20 24z" fill="#c8a06a"/><path d="M90 116h140l-14-6H104z" fill="#b08a5a"/>' +
          '<path d="M104 110L120 56h120l-24 54z" fill="#d9dee3" stroke="#9aa3ad" stroke-width="2"/>' +
          anim("a-pulse", '<path d="M246 52L180 100M260 64L196 104" stroke="#f5c431" stroke-width="2.5" stroke-dasharray="5 4"/>') +
          '<path d="M98 132l14-14h96l14 14z" fill="#26292b" opacity=".85"/><path d="M98 132l14-14h96l14 14z" fill="#dff1fb" opacity=".35"/>' +
          thermo(160, 130, 18, 0.7) + heat(140, 112, 0) + heat(180, 112, 0.9);
      }
    },
    "water-wheel": {
      alt: "Water pours from a bottle onto a paddle wheel, which spins and winds a string to lift a small cup of washers.",
      draw: function () {
        let paddles = "";
        for (let i = 0; i < 8; i++) paddles += '<rect x="-3" y="-34" width="6" height="14" fill="#5aa6dd" transform="rotate(' + i * 45 + ')"/>';
        return WALL + TABLE + '<rect x="70" y="20" width="30" height="40" rx="4" fill="#cfe8f3" stroke="#8fb6cf" stroke-width="2"/>' +
          '<path d="M100 52q20 0 22 26" stroke="#4a9fd8" stroke-width="5" fill="none"/>' +
          '<path d="M100 134V96M180 134V96" stroke="#8a5a2b" stroke-width="5"/><rect x="60" y="130" width="160" height="10" fill="#8fcbec" opacity=".8"/>' +
          '<g transform="translate(140 96)">' + anim("a-spin-slow", '<circle r="24" fill="#fff" stroke="#9aa3ad" stroke-width="2"/>' + paddles) + '<circle r="4" fill="#7a4b2a"/></g>' +
          '<path d="M100 96H240" stroke="#7a4b2a" stroke-width="3"/>' +
          anim("a-lift", '<path d="M240 96v26" stroke="#5c6a60"/><path d="M230 122h20l-3 14h-14z" fill="#fff" stroke="#9aa3ad"/>') + t(268, 112, "lifts", 8);
      }
    },
    "model-house-insulation": {
      alt: "Shoebox model houses with roofs, one cut open to show insulation lining and a capped bottle of warm water inside with a thermometer probe. The water temperature is recorded every 10 minutes.",
      draw: function () {
        function house(x, lined) {
          return '<path d="M' + (x - 34) + " 140v-46h68v46z" + '" fill="#c8a06a"/><path d="M' + (x - 40) + " 94l40-26 40 26z" + '" fill="#a8552c"/>' +
            '<path d="M' + (x - 26) + " 134v-34h52v34z" + '" fill="' + (lined ? "#f2d9e6" : "#efe6d6") + '"/>' +
            (lined ? '<path d="M' + (x - 26) + " 108h52M" + (x - 26) + " 118h52M" + (x - 26) + ' 128h52" stroke="#d9a6c0"/>' : "") +
            '<rect x="' + (x - 7) + '" y="106" width="14" height="28" rx="4" fill="#8fcbec" stroke="#5aa6dd"/><path d="M' + x + " 106V64" + '" stroke="#26292b" stroke-width="1.5"/>';
        }
        return WALL + TABLE + house(90, false) + house(220, true) +
          '<rect x="250" y="40" width="30" height="20" rx="3" fill="#2b2f33"/>' + t(265, 54, "°C", 9, "#7cf08c") + '<path d="M220 64C230 50 240 50 250 50" fill="none" stroke="#26292b" stroke-width="1.5"/>' +
          t(90, 160, "no insulation", 8, "#fff") + t(220, 160, "insulated", 8, "#fff");
      }
    },
    "cantilever-beam": {
      alt: "A folded paper beam sticks out from the edge of a table, held down by heavy books. A cup of pennies hangs from its tip, and an upright ruler measures how much it bends.",
      draw: function () {
        return WALL + '<rect x="0" y="80" width="130" height="100" fill="#c98a4b"/><rect x="0" y="80" width="130" height="6" fill="#26292b"/>' + books(70, 80, 3) +
          anim("a-bend", '<path d="M40 74h170v6H40z" fill="#fff" stroke="#9aa3ad"/><path d="M206 80v12" stroke="#5c6a60"/><path d="M196 92h20l-3 16h-14z" fill="#fff" stroke="#9aa3ad"/><ellipse cx="206" cy="96" rx="7" ry="2" fill="#c87533"/>') +
          ruler(240, 160, 110, true) + '<path d="M210 77h28" stroke="#d6372e" stroke-dasharray="3 2"/>';
      }
    },
    "sound-reducing-materials": {
      alt: "A small speaker sits inside a box lined with foam. Sound waves spread out toward a phone with a sound meter app 50 centimeters away.",
      draw: function () {
        let foam = "";
        for (let i = 0; i < 6; i++) foam += '<path d="M' + (52 + i * 14) + " 74q7-8 14 0" + '" fill="none" stroke="#7a4b9a" stroke-width="3"/>';
        return WALL + TABLE + '<path d="M40 140V68h110v72z" fill="#c8a06a"/><path d="M48 132V76h94v56z" fill="#cdb6dd"/>' + foam +
          '<rect x="80" y="100" width="30" height="32" rx="4" fill="#2b2f33"/><circle cx="95" cy="116" r="9" fill="#5c6a60"/>' +
          anim("a-wave", '<path d="M160 96a24 24 0 0 1 0 36" fill="none" stroke="#2f6fc4" stroke-width="2.5"/>') +
          anim("a-wave", '<path d="M176 88a36 36 0 0 1 0 52" fill="none" stroke="#2f6fc4" stroke-width="2.5"/>', "animation-delay:.4s") +
          '<rect x="252" y="84" width="34" height="56" rx="5" fill="#2b2f33"/><rect x="256" y="90" width="26" height="40" fill="#cfe6d6"/>' + t(269, 112, "dB", 9) +
          '<path d="M150 154h100" stroke="#fff" stroke-dasharray="4 3"/>' + t(200, 168, "50 cm", 8, "#fff");
      }
    },
    "water-storage-temperature": {
      alt: "Four identical clear boxes in the sun hold bottles; some bottles are filled with water and some are empty. A thermometer probe hangs in each box.",
      draw: function () {
        let s = OUTSIDE + '<rect y="140" width="320" height="40" fill="#8bc47a"/>' + sun(290, 30);
        [[50, 0], [118, 1], [186, 2], [254, 4]].forEach(function (b) {
          s += '<rect x="' + (b[0] - 30) + '" y="92" width="60" height="48" rx="4" fill="#fff" fill-opacity=".45" stroke="#8fb6cf" stroke-width="2"/>';
          for (let i = 0; i < 4; i++) {
            s += '<rect x="' + (b[0] - 24 + i * 12) + '" y="112" width="9" height="26" rx="3" fill="' + (i < b[1] ? "#5aa6dd" : "#fff") + '" stroke="#8fb6cf"/>';
          }
          s += '<path d="M' + b[0] + ' 92v12" stroke="#26292b"/><circle cx="' + b[0] + '" cy="105" r="2" fill="#d6372e"/>' + t(b[0], 158, b[1] * 500 + " mL", 8, "#163d24");
        });
        return s;
      }
    },
    "series-parallel-circuits": {
      alt: "Two circuit boards side by side: two bulbs connected in a single loop (series) and two bulbs on separate branches (parallel), each with a battery pack and an ammeter.",
      draw: function () {
        return WALL + TABLE + '<rect x="14" y="30" width="140" height="106" rx="6" fill="#fff" stroke="#c9d3cc"/><rect x="166" y="30" width="140" height="106" rx="6" fill="#fff" stroke="#c9d3cc"/>' +
          t(84, 46, "series", 10) + t(236, 46, "parallel", 10) +
          '<path d="M34 116V78h100v38H34" fill="none" stroke="#2b2f33" stroke-width="2"/>' + bulb(68, 86, 1) + bulb(102, 86, 1) +
          '<rect x="60" y="108" width="30" height="16" rx="2" fill="#2b2f33"/><rect x="62" y="110" width="12" height="12" fill="#c98a1b"/>' +
          '<circle cx="120" cy="116" r="8" fill="#f5c431" stroke="#2b2f33" stroke-width="1.5"/>' + t(120, 119, "A", 8) +
          '<path d="M186 62H270M186 116H270M230 62V116M270 62V116M186 62V116" fill="none" stroke="#2b2f33" stroke-width="2"/>' +
          bulb(230, 100, 1) + bulb(270, 100, 1) +
          '<rect x="178" y="78" width="16" height="30" rx="2" fill="#2b2f33"/><rect x="180" y="80" width="12" height="12" fill="#c98a1b"/>' +
          '<circle cx="208" cy="62" r="8" fill="#f5c431" stroke="#2b2f33" stroke-width="1.5"/>' + t(208, 65, "A", 8);
      }
    }
  };
})();

/* Builds the full SVG for one project (or "" if no drawing exists yet) */
function projectArt(id) {
  const art = PROJECT_ART[id];
  if (!art) return "";
  return '<svg class="pa" viewBox="0 0 320 180" role="img" aria-label="' + art.alt.replace(/"/g, "&quot;") + '">' + art.draw() + "</svg>";
}
