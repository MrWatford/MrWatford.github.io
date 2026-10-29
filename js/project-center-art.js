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
    },

    /* ----- Projects 37–56 ----- */
    "elephant-toothpaste-yeast": {
      alt: "A tall clear container on a tray fills with pink foam. A ruler stands beside it, and a small cup of yeast mixture waits nearby.",
      draw: function () {
        return WALL + TABLE + '<rect x="60" y="132" width="190" height="8" rx="3" fill="#9aa3ad"/>' +
          anim("a-fill", '<path d="M136 132V70q6-10 13-4q7-10 14-2q7-8 13 2v66z" fill="#f7c6d9"/><circle cx="146" cy="96" r="3" fill="#fff"/><circle cx="160" cy="82" r="2.5" fill="#fff"/><circle cx="166" cy="112" r="3" fill="#fff"/><circle cx="150" cy="120" r="2" fill="#fff"/>') +
          '<rect x="134" y="40" width="44" height="92" rx="3" fill="#fff" fill-opacity=".3" stroke="#8fb6cf" stroke-width="2"/>' +
          ruler(186, 132, 90, true) + cup(96, 132, 26, 24, 0.5, "#e8d3a8") +
          t(96, 160, "yeast", 8, "#fff") + t(156, 160, "3% peroxide", 8, "#fff") + timer(270, 112);
      }
    },
    "lava-lamp-tablet": {
      alt: "A clear jar holds a red water layer under yellow oil. Red blobs float up through the oil. Whole, half, and quarter tablets lie beside it.",
      draw: function () {
        return WALL + TABLE +
          '<rect x="122" y="52" width="56" height="58" fill="#f6d77a" opacity=".85"/><rect x="122" y="110" width="56" height="30" fill="#e0524a"/>' +
          anim("a-lift", '<circle cx="138" cy="104" r="5" fill="#e0524a"/><circle cx="140" cy="111" r="1.5" fill="#fff"/>') +
          anim("a-lift", '<circle cx="160" cy="102" r="6" fill="#e0524a"/><circle cx="158" cy="110" r="1.5" fill="#fff"/>', "animation-delay:.8s") +
          anim("a-lift", '<circle cx="150" cy="96" r="4" fill="#e0524a"/>', "animation-delay:1.6s") +
          '<rect x="120" y="42" width="60" height="98" rx="4" fill="#fff" fill-opacity=".2" stroke="#8fb6cf" stroke-width="2"/>' +
          t(150, 80, "oil", 8, "#7a5a12") + t(150, 128, "water", 8, "#fff") +
          '<circle cx="222" cy="130" r="9" fill="#fff" stroke="#9aa3ad"/><path d="M244 130a9 9 0 0 1 18 0z" fill="#fff" stroke="#9aa3ad"/><path d="M278 130v-9a9 9 0 0 1 9 9z" fill="#fff" stroke="#9aa3ad"/>' +
          t(222, 156, "1", 8, "#fff") + t(253, 156, "1/2", 8, "#fff") + t(282, 156, "1/4", 8, "#fff") + timer(60, 112);
      }
    },
    "slime-stretch": {
      alt: "Green slime stretches into a long strand above a meter stick. A glue bottle and a saline bottle stand in the back.",
      draw: function () {
        return WALL + TABLE +
          '<rect x="20" y="58" width="24" height="46" rx="4" fill="#fff" stroke="#c9d3cc"/><path d="M26 58l6-12 6 12z" fill="#f28c28"/>' + t(32, 86, "glue", 7) +
          '<rect x="276" y="60" width="22" height="44" rx="4" fill="#dff1fb" stroke="#8fb6cf"/><rect x="282" y="52" width="10" height="9" fill="#2f6fc4"/>' + t(287, 86, "saline", 6) +
          ruler(30, 140, 260) + '<ellipse cx="60" cy="116" rx="18" ry="12" fill="#5cc87a"/>' +
          anim("a-bend", '<path d="M72 110C120 114 180 116 228 112v8C180 122 120 122 72 122z" fill="#5cc87a"/><ellipse cx="240" cy="116" rx="14" ry="10" fill="#5cc87a"/>');
      }
    },
    "balloon-race-car": {
      alt: "A cardboard car with bottle-cap wheels and a red balloon on top rolls away from a tape starting line across the floor.",
      draw: function () {
        return WALL + FLOOR + '<rect x="20" y="140" width="6" height="40" fill="#5aa6dd"/>' + t(23, 136, "start", 7) +
          '<rect x="30" y="162" width="270" height="8" fill="#f5d76e"/>' +
          anim("a-roll",
            '<rect x="28" y="116" width="62" height="8" rx="2" fill="#c8a06a"/><circle cx="40" cy="131" r="9" fill="#2f6fc4"/><circle cx="78" cy="131" r="9" fill="#2f6fc4"/><circle cx="40" cy="131" r="3" fill="#fff"/><circle cx="78" cy="131" r="3" fill="#fff"/>' +
            '<path d="M30 112h36" stroke="#9aa3ad" stroke-width="3"/><ellipse cx="74" cy="96" rx="18" ry="15" fill="#e0524a"/><path d="M62 106l-6 6" stroke="#e0524a" stroke-width="4"/>', "--dx:190px");
      }
    },
    "fizzy-volcano": {
      alt: "A cardboard volcano on a tray has a window cut in its side, showing a clear cup where foam rises beside a ruler. A vinegar bottle and baking soda box sit nearby.",
      draw: function () {
        return WALL + TABLE + '<rect x="40" y="132" width="230" height="8" rx="3" fill="#9aa3ad"/>' +
          '<path d="M60 132L128 50h44l68 82z" fill="#8a6440"/><path d="M128 50h44l-6 8h-32z" fill="#6b4c30"/>' +
          '<rect x="134" y="62" width="34" height="70" fill="#eef5ef"/>' +
          anim("a-fill", '<path d="M136 132V96q5-7 10-2q5-7 10 0q5-6 10 2v36z" fill="#f2a65a"/><circle cx="146" cy="110" r="2.5" fill="#fff"/><circle cx="158" cy="120" r="2" fill="#fff"/>') +
          '<rect x="134" y="62" width="34" height="70" fill="none" stroke="#8fb6cf" stroke-width="2"/>' + ruler(170, 132, 70, true) +
          '<rect x="268" y="70" width="24" height="62" rx="4" fill="#fff" stroke="#c9d3cc"/><rect x="274" y="62" width="12" height="9" fill="#d6372e"/>' + t(280, 104, "vinegar", 6) +
          '<rect x="14" y="98" width="34" height="34" fill="#f5c431"/>' + t(31, 114, "baking", 6) + t(31, 122, "soda", 6);
      }
    },
    "bubble-glycerin": {
      alt: "A shimmering bubble dome sits on a wet plate inside a drawn circle, with a straw nearby. Four labeled bottles of bubble solution stand behind it.",
      draw: function () {
        let s = WALL + TABLE + '<ellipse cx="110" cy="136" rx="66" ry="7" fill="#dfe6ea" stroke="#9aa3ad"/>' +
          anim("a-pulse", '<path d="M62 136a48 48 0 0 1 96 0z" fill="#cfe9f7" fill-opacity=".45" stroke="#8fb6cf" stroke-width="2"/><path d="M80 110a30 30 0 0 1 22-14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>') +
          '<path d="M168 112l38-34" stroke="#e8462e" stroke-width="5" stroke-linecap="round"/>';
        ["0%", "2.5%", "5%", "10%"].forEach(function (lab, i) {
          const x = 222 + i * 24;
          s += '<rect x="' + (x - 9) + '" y="98" width="18" height="40" rx="3" fill="#e6f6ff" stroke="#8fb6cf"/><rect x="' + (x - 5) + '" y="92" width="10" height="7" fill="#7a4b9a"/>' + t(x, 156, lab, 7, "#fff");
        });
        return s;
      }
    },
    "oobleck-flow": {
      alt: "A smooth board is propped on books to make a ramp. A white blob of cornstarch mixture slides down from a tape start line. A bowl of mixture and a stopwatch sit nearby.",
      draw: function () {
        return WALL + TABLE + books(52, 140, 4) +
          '<path d="M30 98L250 136v4L30 102z" fill="#9aa3ad"/><path d="M48 96l4 10" stroke="#5aa6dd" stroke-width="4"/>' +
          anim("a-roll", '<ellipse cx="70" cy="104" rx="14" ry="4" fill="#f4f1e8" stroke="#d8d2bf" transform="rotate(10 70 104)"/>', "--dx:40px") +
          '<path d="M250 120h50a25 14 0 0 1-50 0z" fill="#f4f1e8" stroke="#c9c2ab" stroke-width="2"/>' + timer(282, 70);
      }
    },
    "shell-free-egg-osmosis": {
      alt: "Two clear jars each hold one shell-free egg, one labeled water and one labeled sugar. A third egg rests on a kitchen scale.",
      draw: function () {
        function jar(x, label, liquid) {
          return '<rect x="' + (x - 24) + '" y="72" width="48" height="68" rx="6" fill="' + liquid + '" fill-opacity=".5" stroke="#8fb6cf" stroke-width="2"/><rect x="' + (x - 26) + '" y="64" width="52" height="9" rx="2" fill="#5c6a60"/>' +
            '<ellipse cx="' + x + '" cy="114" rx="13" ry="17" fill="#f7e7c6" fill-opacity=".9" stroke="#e2c58f"/><circle cx="' + x + '" cy="118" r="6" fill="#f5c431" opacity=".55"/>' + t(x, 158, label, 8, "#fff");
        }
        return WALL + TABLE + jar(70, "water", "#dff1fb") + jar(150, "sugar", "#f6efd9") +
          scale(250, 140, "g") + '<ellipse cx="250" cy="112" rx="12" ry="15" fill="#f7e7c6" stroke="#e2c58f"/>';
      }
    },
    "invisible-ink-cabbage": {
      alt: "A brush paints purple cabbage juice over a sheet of paper, and a hidden word, SCIENCE, appears. A cup of purple indicator sits beside it.",
      draw: function () {
        return WALL + TABLE + '<rect x="40" y="40" width="160" height="96" fill="#fff" stroke="#c9d3cc"/>' +
          anim("a-fill", '<rect x="42" y="42" width="156" height="92" fill="#a77fc4" opacity=".75"/>') +
          anim("a-pulse", '<text x="120" y="96" class="pa-t" text-anchor="middle" style="font-size:22px;fill:#3f8f5a">SCIENCE</text>') +
          '<path d="M210 40l40-22" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M204 44l10-6 4 6-10 6z" fill="#7a4b9a"/>' +
          cup(262, 140, 40, 40, 0.6, "#7a4b9a") + t(262, 158, "indicator", 7, "#fff");
      }
    },
    "marker-chromatography": {
      alt: "Four cups each hold a paper strip hanging from a pencil, with a black ink dot just above the water. Water creeps up each strip. Four black markers lie on the table.",
      draw: function () {
        let s = WALL + TABLE;
        ["A", "B", "C", "D"].forEach(function (lab, i) {
          const x = 50 + i * 70;
          s += '<path d="M' + (x - 26) + ' 46h52" stroke="#f5c431" stroke-width="5" stroke-linecap="round"/>' +
            '<rect x="' + (x - 7) + '" y="48" width="14" height="86" fill="#fff" stroke="#c9d3cc"/>' +
            anim("a-grow", '<rect x="' + (x - 6) + '" y="70" width="12" height="62" fill="#cfe9f7"/>', "animation-delay:" + i * 0.3 + "s") +
            '<circle cx="' + x + '" cy="118" r="2.5" fill="#26292b"/>' + cup(x, 140, 40, 60, 0.18) + t(x, 40, lab, 9);
        });
        return s + '<rect x="70" y="150" width="40" height="7" rx="3" fill="#26292b"/><rect x="200" y="150" width="40" height="7" rx="3" fill="#26292b"/>';
      }
    },
    "dancing-raisins": {
      alt: "Four clear cups of water labeled fresh, 2 hours, 24 hours, and tap. In each cup, raisins sit at the bottom while one rises with bubbles.",
      draw: function () {
        let s = WALL + TABLE;
        ["fresh", "2 hr", "24 hr", "tap"].forEach(function (lab, i) {
          const x = 50 + i * 72;
          s += cup(x, 140, 52, 74, 0.85, "#dff1fb") +
            '<ellipse cx="' + (x - 6) + '" cy="135" rx="4" ry="3" fill="#5a2f4a"/><ellipse cx="' + (x + 6) + '" cy="135" rx="4" ry="3" fill="#5a2f4a"/>' +
            anim("a-lift", '<ellipse cx="' + x + '" cy="126" rx="4" ry="3" fill="#5a2f4a"/><circle cx="' + (x - 4) + '" cy="122" r="1.5" fill="#fff"/><circle cx="' + (x + 4) + '" cy="123" r="1.5" fill="#fff"/>', "animation-delay:" + i * 0.4 + "s") +
            t(x, 158, lab, 8, "#fff");
        });
        return s;
      }
    },
    "walking-water-bridges": {
      alt: "Three pairs of cups are joined by paper-towel bridges of three widths. Colored water travels from each full cup into the empty cup beside it.",
      draw: function () {
        let s = WALL + TABLE;
        [[56, 3, "2 cm"], [160, 6, "4 cm"], [264, 9, "6 cm"]].forEach(function (p) {
          const x = p[0];
          s += cup(x - 22, 140, 40, 56, 0.75, "#5aa6dd") +
            anim("a-fill", '<path d="M' + (x + 12) + ' 132h20l-2 8h-16z" fill="#5aa6dd"/>') + cup(x + 22, 140, 40, 56, 0) +
            '<path d="M' + (x - 22) + " 136V76q22-14 44 0V136" + '" fill="none" stroke="#f2f2f2" stroke-width="' + p[1] + '" stroke-linejoin="round"/>' +
            '<path d="M' + (x - 22) + " 136V96" + '" fill="none" stroke="#5aa6dd" stroke-opacity=".5" stroke-width="' + p[1] + '"/>' + t(x, 158, p[2], 8, "#fff");
        });
        return s;
      }
    },
    "gummy-bear-salt": {
      alt: "Four clear cups labeled 0 grams, 2 grams, 5 grams, and 10 grams of salt each hold three identical gummy bears. A salt shaker and a scale sit nearby.",
      draw: function () {
        function bear(x, y, color) {
          return '<g fill="' + color + '" opacity=".9"><circle cx="' + (x - 3) + '" cy="' + (y - 11) + '" r="1.8"/><circle cx="' + (x + 3) + '" cy="' + (y - 11) + '" r="1.8"/><circle cx="' + x + '" cy="' + (y - 8) + '" r="3.6"/><ellipse cx="' + x + '" cy="' + (y - 1) + '" rx="4" ry="5"/></g>';
        }
        let s = WALL + TABLE;
        ["0 g", "2 g", "5 g", "10 g"].forEach(function (lab, i) {
          const x = 40 + i * 58;
          s += cup(x, 140, 46, 56, 0.7, "#e6f6ff") + bear(x - 9, 136, "#e0524a") + bear(x, 136, "#e0524a") + bear(x + 9, 136, "#e0524a") + t(x, 158, lab, 8, "#fff");
        });
        return s + '<path d="M262 132v-26q0-8 8-8h4q8 0 8 8v26z" fill="#fff" stroke="#9aa3ad"/><path d="M264 98q8-10 16 0" fill="#9aa3ad"/>' + t(272, 120, "salt", 7) + scale(292, 140, "g");
      }
    },
    "ice-cream-salt": {
      alt: "A big zip-top bag full of ice cubes and salt surrounds a smaller bag of cream. It shakes back and forth while a thermometer and a salt container wait nearby.",
      draw: function () {
        let ice = "";
        [[96, 70], [118, 66], [176, 70], [196, 76], [92, 104], [196, 106], [110, 118], [182, 118], [140, 120]].forEach(function (c) { ice += iceCube(c[0], c[1], 14); });
        return WALL + TABLE +
          anim("a-shake", '<rect x="80" y="54" width="140" height="84" rx="12" fill="#eef8fd" fill-opacity=".7" stroke="#8fb6cf" stroke-width="2"/><path d="M80 64h140" stroke="#2f6fc4" stroke-width="3"/>' + ice +
            '<rect x="126" y="84" width="50" height="34" rx="6" fill="#fbf3dc" stroke="#d9c79a"/>' + t(151, 104, "cream", 7, "#7a5a12")) +
          thermo(250, 132, 70, 0.25) + '<rect x="272" y="94" width="28" height="44" rx="4" fill="#2f6fc4"/>' + t(286, 120, "salt", 8, "#fff") + t(150, 160, "ice + salt", 8, "#fff");
      }
    },
    "straw-rocket-fins": {
      alt: "A straw rests on a launch box at an angle, and a small paper rocket with fins flies off it across the room toward a sticky note on the floor.",
      draw: function () {
        return WALL + FLOOR + '<rect x="20" y="104" width="44" height="36" fill="#c8a06a"/><path d="M40 104l36-22" stroke="#5aa6dd" stroke-width="5" stroke-linecap="round"/>' +
          '<rect x="30" y="162" width="270" height="8" fill="#f5d76e"/><rect x="262" y="146" width="14" height="10" fill="#ffe27a" stroke="#d9a90f"/>' +
          '<path d="M78 80Q170 20 268 140" fill="none" stroke="#9aa3ad" stroke-width="1.5" stroke-dasharray="4 4"/>' +
          anim("a-fly", '<g transform="rotate(-30 80 80)"><rect x="70" y="76" width="24" height="8" rx="2" fill="#fff" stroke="#5c6a60" stroke-width="1.5"/><path d="M94 76l6 4-6 4z" fill="#e8462e"/><path d="M70 76l-6-5v5zM70 84l-6 5v-5z" fill="#2f6fc4"/></g>', "--dx:190px;--dy:60px");
      }
    },
    "marble-coaster-loop": {
      alt: "An orange foam track drops from high on a wall into a loop and runs out to a catch tray. A marble waits at the top, and a dashed arrow shows the release height.",
      draw: function () {
        return WALL + FLOOR +
          '<path d="M24 34C80 40 130 134 200 134" fill="none" stroke="#f28c28" stroke-width="7" stroke-linecap="round"/>' +
          '<circle cx="204" cy="100" r="34" fill="none" stroke="#f28c28" stroke-width="7"/><path d="M208 134H286" stroke="#f28c28" stroke-width="7" stroke-linecap="round"/>' +
          '<rect x="280" y="128" width="34" height="12" rx="2" fill="#c8a06a"/>' +
          anim("a-pulse", '<circle cx="30" cy="28" r="6" fill="#2f6fc4" stroke="#fff" stroke-width="1.5"/>') +
          '<path d="M12 30V134" stroke="#26292b" stroke-dasharray="4 3"/><path d="M8 36l4-6 4 6M8 128l4 6 4-6" fill="none" stroke="#26292b"/>' + t(70, 160, "release height", 8, "#5c4a12");
      }
    },
    "mini-hovercraft": {
      alt: "A hovercraft made of a plastic lid with a bottle cap and a balloon on top glides across a table on a cushion of air, pushed off from a ruler.",
      draw: function () {
        return WALL + TABLE + '<rect x="14" y="124" width="10" height="16" fill="#f5d76e"/>' +
          anim("a-roll",
            '<path d="M36 132q40-10 80 0v4H36z" fill="#2f6fc4"/><rect x="70" y="118" width="12" height="12" fill="#e6f6ff" stroke="#8fb6cf"/><rect x="68" y="112" width="16" height="7" rx="2" fill="#2e7d4a"/>' +
            '<ellipse cx="76" cy="92" rx="20" ry="20" fill="#f5c431"/><path d="M70 110l6 4 6-4" fill="#f5c431"/>' +
            anim("a-blow", '<path d="M118 136h10M118 132h8" stroke="#8fb6cf" stroke-width="2" stroke-linecap="round"/>'), "--dx:170px");
      }
    },
    "crayon-water-resistance": {
      alt: "A paper square with a crayon-colored box is taped over a clear cup. A dropper lets a blue drop fall onto it. Uncoated and coated squares and a crayon lie beside it.",
      draw: function () {
        let squares = "";
        [0, 2, 4, 8].forEach(function (n, i) {
          const x = 196 + i * 30;
          squares += '<rect x="' + x + '" y="112" width="24" height="24" fill="#fff" stroke="#c9d3cc"/><rect x="' + (x + 6) + '" y="118" width="12" height="12" fill="#f5c431" opacity="' + (n ? 0.2 + n * 0.09 : 0) + '"/>' + t(x + 12, 152, n, 8, "#fff");
        });
        return WALL + TABLE + cup(100, 140, 64, 64, 0) + '<rect x="62" y="72" width="76" height="4" fill="#fff" stroke="#c9d3cc"/><rect x="84" y="70" width="32" height="3" fill="#f5c431"/>' +
          '<path d="M96 22h8v20l-4 6-4-6z" fill="#e6f6ff" stroke="#8fb6cf"/><rect x="94" y="12" width="12" height="10" rx="3" fill="#d6372e"/>' +
          drop(100, 54, 0, 14, "#2f6fc4") + squares + '<rect x="20" y="132" width="36" height="7" rx="3" fill="#f5c431"/><path d="M56 132l6 3.5-6 3.5z" fill="#e2b72a"/>';
      }
    },
    "crater-drop-height": {
      alt: "A golf ball falls from beside an upright meter stick toward a pan of smooth sand on the floor.",
      draw: function () {
        return WALL + FLOOR + '<rect x="60" y="114" width="190" height="26" rx="3" fill="#7a7f86"/><rect x="64" y="116" width="182" height="8" fill="#e8d3a1"/>' +
          '<ellipse cx="150" cy="119" rx="16" ry="3.5" fill="#cdb684"/>' + ruler(262, 140, 120, true) +
          anim("a-fall", '<circle cx="150" cy="34" r="8" fill="#fff" stroke="#9aa3ad" stroke-width="1.5"/><circle cx="147" cy="31" r="1" fill="#c9d3cc"/><circle cx="152" cy="36" r="1" fill="#c9d3cc"/>', "--dy:76px") +
          '<path d="M164 34h96" stroke="#26292b" stroke-dasharray="3 3"/>';
      }
    },
    "magnetic-maze": {
      alt: "A cardboard maze board rests on two stacks of books. A magnet held underneath drags a paper clip along the maze path on top.",
      draw: function () {
        return WALL + TABLE + books(44, 140, 3) + books(276, 140, 3) +
          '<path d="M40 86h240l20 22H20z" fill="#d9b98a"/><rect x="20" y="108" width="280" height="6" fill="#b8925e"/><path d="M20 111h280" stroke="#9c7748" stroke-width=".8"/>' +
          '<path d="M60 92h70l10 10h60l-10-10h50" fill="none" stroke="#2f6fc4" stroke-width="2" stroke-dasharray="5 3"/>' +
          anim("a-roll", '<path d="M96 95h14a2 2 0 0 0 0-4H98a2 2 0 0 0 0 3h10" fill="none" stroke="#5c6a60" stroke-width="1.5"/><rect x="92" y="117" width="22" height="16" rx="2" fill="#d6372e"/><rect x="92" y="117" width="11" height="16" rx="2" fill="#2f6fc4"/>', "--dx:90px");
      }
    },
    /* ----- Projects 57–75 ----- */
    "bath-bomb-fizz": {
      alt: "Three clear cups of water labeled cool, room, and warm, each with a thermometer. A round white tablet sits in each cup with bubbles rising. A stopwatch waits beside them.",
      draw: function () {
        let s = WALL + TABLE;
        ["cool", "room", "warm"].forEach(function (lab, i) {
          const x = 60 + i * 80;
          s += cup(x, 140, 56, 66, 0.75, "#cfe9f8") + '<ellipse cx="' + x + '" cy="134" rx="10" ry="4" fill="#fff" stroke="#c9d3cc"/>' +
            vapor(x - 6, 126, i * 0.4).replace(/#7fb8dc/g, "#ffffff") +
            anim("a-rise", '<circle cx="' + (x + 4) + '" cy="124" r="2" fill="#fff" stroke="#8fb6cf" stroke-width=".8"/><circle cx="' + (x - 3) + '" cy="116" r="1.6" fill="#fff" stroke="#8fb6cf" stroke-width=".8"/>', "animation-delay:" + (i * 0.3) + "s") +
            thermo(x + 20, 130, 50, 0.5) + t(x, 160, lab, 8, "#fff");
        });
        return s + timer(286, 120);
      }
    },
    "static-butterfly": {
      alt: "A tissue-paper butterfly is taped to a cardboard board. A balloon is held above one wing beside an upright ruler, and the wing tip lifts toward the balloon.",
      draw: function () {
        return WALL + TABLE + '<rect x="40" y="132" width="200" height="8" fill="#d9b98a"/>' +
          '<rect x="128" y="120" width="10" height="14" rx="4" fill="#2b2f33"/>' +
          '<path d="M128 128L74 132L80 124z" fill="#f28cb8" opacity=".85"/>' +
          anim("a-tilt", '<path d="M138 130L196 130L190 122z" fill="#f28cb8" opacity=".85"/>', "transform-origin:0% 100%;animation-duration:1.6s!important") +
          ruler(228, 132, 90, true) +
          '<ellipse cx="196" cy="62" rx="26" ry="30" fill="#e8462e"/><path d="M192 92l4 6 4-6z" fill="#c6362c"/><ellipse cx="186" cy="50" rx="6" ry="10" fill="#fff" opacity=".35"/>' +
          anim("a-pulse", '<g fill="#2f6fc4" font-size="9" font-weight="800"><text x="182" y="96">+</text><text x="204" y="96">−</text></g>') +
          '<path d="M222 92H234" stroke="#26292b" stroke-dasharray="3 2"/>' + t(270, 160, "distance", 8, "#fff");
      }
    },
    "balloon-in-bottle": {
      alt: "A clear plastic bottle with a small vent hole near the bottom holds a balloon whose mouth is stretched over the bottle opening. A small hand pump is attached, and tape covers with different hole sizes lie beside it.",
      draw: function () {
        let covers = "";
        ["0", "1", "6", "12"].forEach(function (mm, i) {
          const x = 220 + i * 24;
          covers += '<rect x="' + x + '" y="114" width="18" height="18" fill="#c9b27a"/>' + (i ? '<circle cx="' + (x + 9) + '" cy="123" r="' + (i === 1 ? 0.8 : i === 2 ? 3 : 6) + '" fill="#eef5ef"/>' : "") + t(x + 9, 150, mm, 7, "#fff");
        });
        return WALL + TABLE +
          '<path d="M80 60h60v76a4 4 0 0 1-4 4H84a4 4 0 0 1-4-4z" fill="#fff" fill-opacity=".45" stroke="#8fb6cf" stroke-width="2"/><path d="M80 60q0-14 22-18h16q22 4 22 18" fill="#fff" fill-opacity=".45" stroke="#8fb6cf" stroke-width="2"/><rect x="100" y="32" width="20" height="10" fill="#e6f6ff" stroke="#8fb6cf"/>' +
          anim("a-pulse", '<ellipse cx="110" cy="84" rx="18" ry="24" fill="#f5c431" opacity=".9"/>') + '<path d="M106 42v18h8V42" fill="#f5c431"/>' +
          '<circle cx="136" cy="128" r="4" fill="#eef5ef" stroke="#5c6a60"/>' + anim("a-blow", '<path d="M142 128h8M142 124h6" stroke="#8fb6cf" stroke-width="1.5" stroke-linecap="round"/>') +
          '<rect x="104" y="12" width="12" height="20" fill="#2f6fc4"/><rect x="100" y="6" width="20" height="6" rx="2" fill="#26292b"/>' + covers + t(258, 104, "vent covers (mm)", 8);
      }
    },
    "cartesian-diver": {
      alt: "A tall plastic bottle full of water with two tape lines on its side. A dropper diver with copper wire wrapped around its tip rises between the lines. A stopwatch sits beside it.",
      draw: function () {
        return WALL + TABLE +
          '<path d="M120 50h64v86a4 4 0 0 1-4 4h-56a4 4 0 0 1-4-4z" fill="#cfe9f8" stroke="#8fb6cf" stroke-width="2"/><path d="M120 50q0-14 22-18h20q22 4 22 18" fill="#cfe9f8" stroke="#8fb6cf" stroke-width="2"/><rect x="142" y="18" width="20" height="14" rx="2" fill="#2f6fc4"/>' +
          '<rect x="114" y="60" width="76" height="3" fill="#f5c431"/><rect x="114" y="122" width="76" height="3" fill="#f5c431"/>' +
          anim("a-lift", '<g><ellipse cx="152" cy="108" rx="7" ry="9" fill="#fff" fill-opacity=".8" stroke="#5c6a60"/><rect x="149.5" y="104" width="5" height="6" fill="#8fcbec"/><path d="M152 117v10" stroke="#5c6a60" stroke-width="2.5"/><path d="M148 121h8M148 124h8" stroke="#c87533" stroke-width="1.6"/></g>', "animation-duration:2.4s!important") +
          t(212, 64, "upper line", 7) + t(212, 126, "lower line", 7) + timer(270, 118);
      }
    },
    "candy-color-race": {
      alt: "A clear flat dish of water sits on white paper with a ring drawn on it. A red candy in the center sends a red color circle spreading outward toward the ring. A thermometer and stopwatch are nearby.",
      draw: function () {
        return WALL + TABLE + '<path d="M40 128h180l10 12H30z" fill="#fff"/>' +
          '<ellipse cx="130" cy="128" rx="80" ry="12" fill="#e6f6ff" stroke="#8fb6cf" stroke-width="2"/>' +
          '<ellipse cx="130" cy="128" rx="54" ry="8" fill="none" stroke="#26292b" stroke-dasharray="4 3"/>' +
          anim("a-wave", '<ellipse cx="130" cy="128" rx="40" ry="6" fill="#e8462e" opacity=".35"/>', "transform-origin:50% 50%;animation-duration:3s!important") +
          '<ellipse cx="130" cy="127" rx="6" ry="3" fill="#d6372e"/>' + thermo(250, 134, 56, 0.45) + timer(290, 118) + t(130, 160, "3 cm ring", 8, "#fff");
      }
    },
    "milk-color-soap": {
      alt: "A shallow dish of white milk with a drop of blue food coloring in the center. A dropper above releases a drop of soap, and the blue color spreads outward. A ruler lies beside the dish and a phone films from above.",
      draw: function () {
        return WALL + TABLE +
          '<ellipse cx="140" cy="128" rx="78" ry="12" fill="#fbfaf4" stroke="#c9d3cc" stroke-width="2"/>' +
          anim("a-wave", '<ellipse cx="140" cy="128" rx="34" ry="5" fill="none" stroke="#2f6fc4" stroke-width="3" opacity=".7"/>', "transform-origin:50% 50%") +
          '<ellipse cx="140" cy="128" rx="7" ry="2.5" fill="#2f6fc4"/>' +
          '<path d="M136 46h8v20l-4 6-4-6z" fill="#e6f6ff" stroke="#8fb6cf"/><rect x="134" y="36" width="12" height="10" rx="3" fill="#2e7d4a"/>' + drop(140, 80, 0, 40, "#f5c431") +
          '<rect x="220" y="130" width="80" height="8" fill="#f5d76e"/>' +
          '<rect x="210" y="14" width="48" height="26" rx="4" fill="#26292b"/><circle cx="234" cy="27" r="7" fill="#5aa6dd"/>' + t(70, 160, "soap: 0 – 100%", 8, "#fff");
      }
    },
    "water-xylophone": {
      alt: "Five identical glasses on a tray hold increasing amounts of water. A wooden spoon taps one glass while a phone with a tuner app shows the frequency in hertz.",
      draw: function () {
        let s = WALL + TABLE + '<rect x="20" y="134" width="236" height="6" rx="2" fill="#7a4b2a"/>';
        [0.05, 0.25, 0.45, 0.65, 0.85].forEach(function (lv, i) {
          s += cup(48 + i * 46, 134, 36, 62, lv, "#7fb8dc");
        });
        return s + anim("a-swing", '<path d="M200 30l26 40" stroke="#b07a3a" stroke-width="4" stroke-linecap="round"/><ellipse cx="228" cy="74" rx="5" ry="7" fill="#b07a3a"/>', "transform-origin:0% 0%") +
          anim("a-wave", '<path d="M246 64q8 8 0 16M252 60q12 12 0 24" fill="none" stroke="#2f6fc4" stroke-width="2"/>', "transform-origin:0% 50%") +
          '<rect x="268" y="84" width="34" height="56" rx="5" fill="#26292b"/><rect x="272" y="92" width="26" height="36" fill="#cfe6d6"/>' + t(285, 113, "Hz", 9);
      }
    },
    "straw-oboe": {
      alt: "Four drinking straws of different lengths, each with a pointed, flattened reed at one end, lie on a table next to scissors, a ruler, and a phone showing a tuner.",
      draw: function () {
        let s = WALL + TABLE;
        [200, 160, 120, 80].forEach(function (len, i) {
          const y = 52 + i * 20;
          s += '<rect x="30" y="' + (y - 3) + '" width="' + (len - 14) + '" height="6" rx="2" fill="#5aa6dd"/><path d="M' + (16 + len) + " " + (y - 3) + "l14 3-14 3z" + '" fill="#8fcbec"/>';
        });
        return s + anim("a-wave", '<path d="M244 52q8 6 0 12M250 48q12 10 0 20" fill="none" stroke="#2f6fc4" stroke-width="2"/>', "transform-origin:0% 50%") +
          ruler(30, 140, 180) + '<path d="M232 120l20 8M232 132l20-8" stroke="#5c6a60" stroke-width="3"/><circle cx="228" cy="118" r="5" fill="none" stroke="#d6372e" stroke-width="2.5"/><circle cx="228" cy="134" r="5" fill="none" stroke="#d6372e" stroke-width="2.5"/>' +
          '<rect x="268" y="84" width="34" height="56" rx="5" fill="#26292b"/><rect x="272" y="92" width="26" height="36" fill="#cfe6d6"/>' + t(285, 113, "Hz", 9);
      }
    },
    "spinning-sprinkler": {
      alt: "A wide plastic container hangs from a string and swivel over a tub. Water streams out of two bent straws near its bottom, pointing in opposite directions, and the container turns.",
      draw: function () {
        return WALL + FLOOR + '<rect x="20" y="10" width="280" height="6" rx="3" fill="#8a5a2b"/><path d="M160 16v22" stroke="#5c6a60" stroke-width="1.5"/><circle cx="160" cy="40" r="3" fill="#9aa3ad"/>' +
          '<path d="M160 43l-26 19M160 43l26 19M160 43v19" stroke="#5c6a60" stroke-width="1"/>' +
          anim("a-shake", '<path d="M130 62h60l-4 40h-52z" fill="#fff" fill-opacity=".55" stroke="#8fb6cf" stroke-width="2"/><path d="M133 72h54l-3 30h-48z" fill="#8fcbec"/><rect x="152" y="78" width="16" height="6" fill="#f5c431"/>' +
            '<path d="M134 98h-26v8" fill="none" stroke="#5aa6dd" stroke-width="4" stroke-linecap="round"/><path d="M186 98h26v-8" fill="none" stroke="#5aa6dd" stroke-width="4" stroke-linecap="round"/>', "animation-duration:.5s!important") +
          drop(108, 112, 0, 26) + drop(112, 112, 0.5, 26) + '<path d="M212 88q14-4 20 6" fill="none" stroke="#4a9fd8" stroke-width="2" stroke-dasharray="3 3"/>' +
          '<path d="M60 128h200l-10 20H70z" fill="#5aa6dd" opacity=".55"/><path d="M56 126h208" stroke="#2f6fc4" stroke-width="4"/>' + timer(284, 120);
      }
    },
    "hydraulic-lift": {
      alt: "Two needle-free syringes are joined by colored-water tubing. Pushing the plunger of the small input syringe lifts a cardboard platform with coins on the larger output syringe beside an upright ruler.",
      draw: function () {
        return WALL + TABLE +
          '<rect x="40" y="70" width="20" height="60" rx="2" fill="#fff" fill-opacity=".6" stroke="#8fb6cf" stroke-width="2"/><rect x="42" y="96" width="16" height="32" fill="#e8462e" opacity=".6"/>' +
          anim("a-lift", '<rect x="47" y="40" width="6" height="56" fill="#9aa3ad"/><rect x="38" y="36" width="24" height="6" rx="2" fill="#5c6a60"/>', "animation-direction:alternate-reverse") +
          '<path d="M50 130v8h90q30 0 30-14v-6" fill="none" stroke="#e8462e" stroke-width="4" opacity=".75"/>' +
          '<rect x="156" y="70" width="32" height="50" rx="3" fill="#fff" fill-opacity=".6" stroke="#8fb6cf" stroke-width="2"/><rect x="158" y="94" width="28" height="24" fill="#e8462e" opacity=".6"/>' +
          anim("a-lift", '<rect x="168" y="44" width="8" height="50" fill="#9aa3ad"/><rect x="152" y="38" width="40" height="6" fill="#d9b98a"/><g fill="#c99a2e"><ellipse cx="164" cy="36" rx="6" ry="2"/><ellipse cx="164" cy="33" rx="6" ry="2"/><ellipse cx="180" cy="36" rx="6" ry="2"/></g>', "animation-duration:4s!important;--x:0") +
          ruler(204, 130, 100, true) + t(50, 160, "input", 8, "#fff") + t(172, 160, "output", 8, "#fff");
      }
    },
    "mini-catapult": {
      alt: "A craft-stick catapult taped behind a launch line flings a pom-pom in an arc across the floor toward a tape measure. A small upright ruler beside the arm marks the pullback distance.",
      draw: function () {
        return WALL + FLOOR + '<rect x="56" y="140" width="4" height="40" fill="#26292b"/>' +
          '<rect x="20" y="126" width="30" height="10" rx="2" fill="#e5c07b" stroke="#b9934f"/><path d="M16 136l40-6" stroke="#e5c07b" stroke-width="5" stroke-linecap="round"/>' +
          anim("a-tilt", '<path d="M16 132l40-16" stroke="#e5c07b" stroke-width="5" stroke-linecap="round"/><ellipse cx="54" cy="114" rx="6" ry="3" fill="#2f6fc4"/>', "transform-origin:0% 100%;animation-duration:1.8s!important") +
          ruler(62, 136, 40, true) +
          '<path d="M60 108Q160 20 270 150" fill="none" stroke="#9aa3ad" stroke-width="1.5" stroke-dasharray="4 4"/>' +
          anim("a-fly", '<circle cx="62" cy="104" r="6" fill="#f28cb8"/>', "--dx:200px;--dy:40px") +
          '<rect x="60" y="164" width="250" height="8" fill="#f5d76e"/>';
      }
    },
    "paper-helicopter": {
      alt: "A paper helicopter with two bent rotor blades and a paper clip at the bottom spins as it falls beside a tall measuring tape on the wall. A stopwatch waits on the floor.",
      draw: function () {
        return WALL + FLOOR + ruler(50, 140, 130, true) + '<rect x="40" y="18" width="40" height="3" fill="#d6372e"/>' + t(100, 22, "drop height", 8) +
          anim("a-fall", '<g>' + anim("a-shake", '<path d="M156 20h-20v-5h20z" fill="#5aa6dd"/><path d="M164 20h20v-5h-20z" fill="#8fcbec"/><rect x="156" y="20" width="8" height="30" fill="#5aa6dd"/><path d="M157 50h6v6h-6z" fill="none" stroke="#5c6a60" stroke-width="1.5"/>', "animation-duration:.18s!important") + "</g>", "--dy:80px") +
          timer(250, 122);
      }
    },
    "green-roof-model": {
      alt: "Four small pans sit tilted on blocks. One is bare, and the others hold thin, medium, and thick layers of soil. A cup with pinholes rains water on the last pan, and runoff drips from its low end into a measuring cup.",
      draw: function () {
        let s = WALL + TABLE;
        [0, 6, 12, 18].forEach(function (d, i) {
          const x = 14 + i * 60;
          s += '<rect x="' + x + '" y="124" width="8" height="16" fill="#7a4b2a"/>' +
            '<g transform="rotate(8 ' + (x + 25) + ' 126)"><rect x="' + x + '" y="114" width="50" height="20" fill="#c9cfd4" stroke="#8a939b"/>' +
            (d ? '<rect x="' + (x + 2) + '" y="' + (130 - d) + '" width="46" height="' + d + '" fill="#5b3a23"/><rect x="' + (x + 2) + '" y="130" width="46" height="2" fill="#9aa3ad"/>' : "") + "</g>" +
            t(x + 25, 160, d ? d / 3 + " cm" : "bare", 8, "#fff");
        });
        return s + '<path d="M182 30h36l-4 24h-28z" fill="#fff" stroke="#8fb6cf" stroke-width="2"/>' + t(200, 24, "rain cup", 8) +
          drop(190, 62, 0, 40) + drop(200, 62, 0.4, 40) + drop(210, 62, 0.8, 40) +
          drop(240, 138, 0.2, 8) + cup(262, 140, 26, 20, 0.3) + t(292, 132, "runoff", 8);
      }
    },
    "seed-dispersal-flyers": {
      alt: "A box fan on the floor blows toward a paper seed model with a paper clip that drifts down across the floor above a tape measure. Paper wings shaped like a rectangle, triangle, circle, and two squares wait on the side.",
      draw: function () {
        return WALL + FLOOR + fan(40, 140) +
          anim("a-blow", '<path d="M70 70h16M70 84h22M70 98h14" stroke="#8fb6cf" stroke-width="2" stroke-linecap="round"/>') +
          '<path d="M96 40Q180 50 250 150" fill="none" stroke="#9aa3ad" stroke-width="1.5" stroke-dasharray="4 4"/>' +
          anim("a-fly", '<rect x="94" y="34" width="16" height="8" fill="#fff" stroke="#5c6a60"/><path d="M101 42v4" stroke="#5c6a60" stroke-width="2"/>', "--dx:150px;--dy:100px") +
          '<rect x="60" y="164" width="250" height="8" fill="#f5d76e"/>' +
          '<rect x="232" y="24" width="20" height="10" fill="#fff" stroke="#5c6a60"/><path d="M262 34l10-14 10 14z" fill="#fff" stroke="#5c6a60"/><circle cx="296" cy="28" r="7" fill="#fff" stroke="#5c6a60"/><rect x="250" y="44" width="10" height="10" fill="#fff" stroke="#5c6a60"/><rect x="262" y="44" width="10" height="10" fill="#fff" stroke="#5c6a60"/>';
      }
    },
    "potato-osmosis": {
      alt: "Five clear cups of salt water labeled 0, 1, 2, 5, and 10 grams each hold a potato stick. A kitchen scale and paper towel sit to the side.",
      draw: function () {
        let s = WALL + TABLE;
        ["0", "1", "2", "5", "10"].forEach(function (g, i) {
          const x = 34 + i * 46;
          s += cup(x, 140, 38, 52, 0.7, "#e6f6ff") + '<rect x="' + (x - 3) + '" y="104" width="7" height="32" rx="1" fill="#f3e1a6" stroke="#c9ab5a" transform="rotate(12 ' + x + ' 120)"/>' + t(x, 160, g + " g", 8, "#fff");
        });
        return s + scale(282, 140, "g") + '<rect x="266" y="110" width="12" height="5" rx="1" fill="#f3e1a6" stroke="#c9ab5a"/><rect x="252" y="96" width="40" height="10" rx="2" fill="#fff" stroke="#c9d3cc"/>';
      }
    },
    "apple-browning": {
      alt: "Apple slices sit on five labeled plates: untreated, water, 25%, 50%, and 100% lemon juice. A bottle of lemon juice and a white reference card with a numbered color scale stand behind them.",
      draw: function () {
        let s = WALL + TABLE + '<rect x="16" y="40" width="120" height="44" rx="3" fill="#fff" stroke="#c9d3cc"/>' + t(76, 52, "browning scale", 8);
        ["#f7f0d0", "#f0dfae", "#e3c58a", "#cfa463", "#a8743f"].forEach(function (c, i) {
          s += '<rect x="' + (24 + i * 22) + '" y="58" width="18" height="14" fill="' + c + '" stroke="#c9d3cc"/>' + t(33 + i * 22, 80, i, 7);
        });
        ["none", "0%", "25%", "50%", "100%"].forEach(function (lab, i) {
          const x = 36 + i * 50;
          s += '<ellipse cx="' + x + '" cy="132" rx="22" ry="6" fill="#fff" stroke="#c9d3cc"/><circle cx="' + x + '" cy="124" r="10" fill="#f7f0d0" stroke="#c6362c" stroke-width="2"/><path d="M' + (x - 2) + " 120l2 4 2-4" + '" stroke="#7a4b2a" stroke-width="1.5" fill="none"/>' + t(x, 160, lab, 8, "#fff");
        });
        return s + '<rect x="270" y="78" width="26" height="60" rx="5" fill="#f5e663" stroke="#c9b43a"/><rect x="276" y="68" width="14" height="10" fill="#2e7d4a"/>' + t(283, 112, "lemon", 7) + timer(208, 62);
      }
    },
    "yeast-balloon": {
      alt: "Four small plastic bottles of yeast mixture labeled 0, 5, 10, and 20 grams of sugar each have a balloon stretched over the neck. A string wraps around one balloon to measure it.",
      draw: function () {
        let s = WALL + TABLE;
        ["0 g", "5 g", "10 g", "20 g"].forEach(function (lab, i) {
          const x = 46 + i * 62;
          s += '<path d="M' + (x - 18) + " 96h36v40a4 4 0 0 1-4 4h-28a4 4 0 0 1-4-4z" + '" fill="#fff" fill-opacity=".45" stroke="#8fb6cf" stroke-width="2"/><path d="M' + (x - 18) + " 96q0-12 12-16h12q12 4 12 16" + '" fill="#fff" fill-opacity=".45" stroke="#8fb6cf" stroke-width="2"/>' +
            '<rect x="' + (x - 16) + '" y="112" width="32" height="26" fill="#e8d3a1"/><rect x="' + (x - 6) + '" y="72" width="12" height="8" fill="#e8462e"/>' +
            anim("a-pulse", '<ellipse cx="' + x + '" cy="56" rx="14" ry="17" fill="#e8462e" opacity=".85"/>', "animation-delay:" + (i * 0.2) + "s") + t(x, 160, lab, 8, "#fff");
        });
        return s + '<path d="M32 56h28" stroke="#26292b" stroke-width="1.5" stroke-dasharray="2 2"/>' + timer(290, 122);
      }
    },
    "diy-periscope": {
      alt: "A tall cardboard periscope stands upright with a mirror at the top and bottom. Light from a grid poster on the far wall enters the top window, bounces down, and leaves the bottom window toward an eye.",
      draw: function () {
        let grid = '<rect x="236" y="20" width="60" height="96" fill="#fff" stroke="#c9d3cc"/>';
        for (let y = 28; y < 116; y += 10) grid += '<path d="M240 ' + y + 'h52" stroke="#9aa3ad"/>';
        return WALL + TABLE + grid + '<circle cx="266" cy="48" r="5" fill="#e8462e"/>' +
          '<rect x="96" y="30" width="44" height="108" fill="#c8a06a" stroke="#8a5a2b" stroke-width="2"/><rect x="140" y="38" width="3" height="22" fill="#eef5ef"/><rect x="93" y="108" width="3" height="22" fill="#eef5ef"/>' +
          anim("a-stir", '<path d="M102 66L134 36" stroke="#9cc7e0" stroke-width="5" stroke-linecap="round"/>', "transform-origin:50% 50%;animation-duration:2.4s!important") +
          '<path d="M102 134L134 104" stroke="#9cc7e0" stroke-width="5" stroke-linecap="round"/><circle cx="118" cy="51" r="2.5" fill="#5c4a12"/>' +
          '<path d="M236 48H120V118H60" fill="none" stroke="#f5c431" stroke-width="2" stroke-dasharray="5 3"/>' +
          '<path d="M46 112q10-10 20 0q-10 10-20 0z" fill="#fff" stroke="#26292b" stroke-width="1.5"/><circle cx="56" cy="112" r="3.5" fill="#2f6fc4"/>' + t(118, 160, "upper mirror angle", 8, "#fff");
      }
    },
    "domino-chain": {
      alt: "A straight row of dominoes stands on a paper spacing template. The first few dominoes tip over into the next ones while a phone on a stand films the chain from the side.",
      draw: function () {
        let s = WALL + TABLE + '<rect x="20" y="134" width="240" height="6" fill="#fff"/>';
        for (let i = 0; i < 12; i++) {
          const x = 36 + i * 19;
          s += '<path d="M' + x + ' 134v6" stroke="#9aa3ad"/>';
          s += i < 2 ? '<rect x="' + x + '" y="104" width="6" height="30" rx="1" fill="#26292b" transform="rotate(' + (i ? 40 : 62) + " " + (x + 6) + ' 134)"/>'
            : i === 2 ? '<rect x="' + x + '" y="104" width="6" height="30" rx="1" fill="#26292b" transform="rotate(18 ' + (x + 6) + ' 134)"/>' + anim("a-pulse", '<path d="M' + (x + 12) + ' 100q4 6 0 12" fill="none" stroke="#e8462e" stroke-width="2"/>')
            : '<rect x="' + x + '" y="104" width="6" height="30" rx="1" fill="#26292b"/>';
        }
        return s + '<rect x="268" y="80" width="30" height="48" rx="4" fill="#26292b"/><circle cx="276" cy="90" r="4" fill="#5aa6dd"/><path d="M283 128v12" stroke="#5c6a60" stroke-width="3"/>' + t(140, 160, "spacing", 8, "#fff");
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
