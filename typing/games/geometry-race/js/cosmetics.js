/* =========================================================
   Geometry Race — character looks (cubes, colors, trails)
   and the drawings for each movement mode. Looks never change
   the hitbox: everything here only draws.
   Draw functions work in a 1×1 box centered on (0, 0).
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};

  const COLORS = [
    { name: "Neon green", c: "#39ff88" }, { name: "Cyan", c: "#2de2ff" }, { name: "Electric blue", c: "#3d7bff" },
    { name: "Violet", c: "#9b5cff" }, { name: "Hot pink", c: "#ff4fd8" }, { name: "Red", c: "#ff4d5e" },
    { name: "Orange", c: "#ff9a2e" }, { name: "Yellow", c: "#ffe14d" }, { name: "White", c: "#f4f7ff" },
    { name: "Mint", c: "#8affd6" }, { name: "Lime", c: "#c6ff3d" }, { name: "Midnight", c: "#1b2140" },
    { name: "Teal", c: "#19b6a5" }, { name: "Gold", c: "#ffc83d" }
  ];

  function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function poly(ctx, pts, c) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  }
  function circ(ctx, x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function ring(ctx, x, y, r, w, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }

  // Each icon: name, unlock rule, and a draw function (c1 = main color, c2 = second color).
  // unlock: null (free), { level: id } (finish that level in normal mode), or { tokens: n } (total tokens).
  const ICONS = [
    { name: "Core", unlock: null, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); rect(x, -.24, -.24, .48, .48, b); rect(x, -.1, -.1, .2, .2, a); } },
    { name: "Visor", unlock: null, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); rect(x, -.42, -.2, .84, .3, b); rect(x, -.3, -.13, .16, .16, "#0b0f1c"); rect(x, .14, -.13, .16, .16, "#0b0f1c"); rect(x, -.24, .22, .48, .1, b); } },
    { name: "Cross", unlock: null, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); rect(x, -.12, -.38, .24, .76, b); rect(x, -.38, -.12, .76, .24, b); } },
    { name: "Diamond", unlock: null, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); poly(x, [0, -.38, .38, 0, 0, .38, -.38, 0], b); poly(x, [0, -.14, .14, 0, 0, .14, -.14, 0], a); } },
    { name: "Target", unlock: null, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); ring(x, 0, 0, .28, .12, b); circ(x, 0, 0, .1, b); } },
    { name: "Split", unlock: null, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); poly(x, [.5, -.5, .5, .5, -.5, .5], b); rect(x, -.14, -.14, .28, .28, "#0b0f1c"); } },
    { name: "Circuit", unlock: { level: "first-flight" }, draw: function (x, a, b) {
      rect(x, -.5, -.5, 1, 1, a); x.strokeStyle = b; x.lineWidth = .08; x.beginPath();
      x.moveTo(-.5, -.2); x.lineTo(-.15, -.2); x.lineTo(-.15, .25); x.lineTo(.5, .25); x.moveTo(.2, -.5); x.lineTo(.2, -.05); x.stroke();
      circ(x, -.15, .25, .08, b); circ(x, .2, -.05, .08, b); } },
    { name: "Stripes", unlock: { level: "neon-avenue" }, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); for (let i = 0; i < 3; i++) poly(x, [-.5 + i * .4, .5, -.3 + i * .4, .5, .3 + i * .4 - .2, -.5, .1 + i * .4 - .2, -.5], b); } },
    { name: "Checker", unlock: { level: "gravity-circuit" }, draw: function (x, a, b) { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) rect(x, -.5 + i * .25, -.5 + j * .25, .25, .25, (i + j) % 2 ? b : a); } },
    { name: "Grin", unlock: { level: "skyline-surge" }, draw: function (x, a, b) {
      rect(x, -.5, -.5, 1, 1, a); rect(x, -.3, -.28, .18, .22, b); rect(x, .12, -.28, .18, .22, b);
      poly(x, [-.32, .1, .32, .1, .2, .32, -.2, .32], b); rect(x, -.18, .14, .36, .08, a); } },
    { name: "Bolt", unlock: { level: "prism-rush" }, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); poly(x, [.08, -.44, -.26, .06, -.02, .06, -.1, .44, .26, -.08, .02, -.08], b); } },
    { name: "Crown", unlock: { level: "final-velocity" }, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); poly(x, [-.34, .22, -.34, -.22, -.17, -.02, 0, -.3, .17, -.02, .34, -.22, .34, .22], b); rect(x, -.34, .26, .68, .1, b); } },
    { name: "Star", unlock: { tokens: 3 }, draw: function (x, a, b) {
      rect(x, -.5, -.5, 1, 1, a); const p = [];
      for (let i = 0; i < 10; i++) { const r = i % 2 ? .17 : .4, ang = -Math.PI / 2 + i * Math.PI / 5; p.push(Math.cos(ang) * r, Math.sin(ang) * r + .03); }
      poly(x, p, b); } },
    { name: "Pixel Pal", unlock: { tokens: 6 }, draw: function (x, a, b) {
      rect(x, -.5, -.5, 1, 1, a);
      const m = ["0110110", "1111111", "1011101", "1111111", "0100010", "1000001"];
      for (let r = 0; r < m.length; r++) for (let c = 0; c < 7; c++) if (m[r][c] === "1") rect(x, -.42 + c * .12, -.36 + r * .12, .12, .12, b); } },
    { name: "Prism", unlock: { tokens: 10 }, draw: function (x, a, b) { rect(x, -.5, -.5, 1, 1, a); poly(x, [0, -.36, .36, .3, -.36, .3], b); poly(x, [0, -.06, .14, .2, -.14, .2], a); } },
    { name: "Orbit", unlock: { tokens: 18 }, draw: function (x, a, b) {
      rect(x, -.5, -.5, 1, 1, a); x.save(); x.rotate(.5); x.beginPath(); x.ellipse(0, 0, .42, .16, 0, 0, Math.PI * 2);
      x.lineWidth = .07; x.strokeStyle = b; x.stroke(); x.restore(); circ(x, 0, 0, .14, b); circ(x, .3, -.2, .06, b); } }
  ];

  const TRAILS = [
    { name: "Streak", unlock: null },
    { name: "Dots", unlock: null },
    { name: "Off", unlock: null },
    { name: "Sparkle", unlock: { tokens: 3 } },
    { name: "Ribbon", unlock: { level: "gravity-circuit" } },
    { name: "Pixels", unlock: { level: "skyline-surge" } },
    { name: "Comet", unlock: { tokens: 9 } }
  ];

  function unlockText(u, levels) {
    if (!u) return "";
    if (u.level) { const l = levels.find(function (d) { return d.id === u.level; }); return "Finish " + (l ? l.name : u.level); }
    return "Collect " + u.tokens + " tokens";
  }

  // Draw the cube icon with an outline (used for the cube and inside other modes).
  function drawIcon(ctx, look, size) {
    const icon = ICONS[look.icon] || ICONS[0];
    ctx.save();
    ctx.scale(size, size);
    icon.draw(ctx, COLORS[look.c1].c, COLORS[look.c2].c);
    ctx.lineWidth = 0.07; ctx.strokeStyle = "#060912"; ctx.strokeRect(-.5, -.5, 1, 1);
    ctx.restore();
  }

  // Each mode has its own character. w/h are the drawing size in pixels (from the hitbox).
  function drawPlayer(ctx, mode, look, w, h, rot, time) {
    const a = COLORS[look.c1].c, b = COLORS[look.c2].c, ink = "#060912";
    ctx.save();
    ctx.rotate(rot);
    ctx.lineJoin = "round";
    if (mode === "cube") {
      drawIcon(ctx, look, w);
    } else if (mode === "ship") {
      const s = w;
      ctx.scale(s, s);
      poly(ctx, [-.62, .16, .62, .12, .3, -.06, -.5, -.06], b);                // lower hull
      poly(ctx, [-.62, .16, -.72, -.28, -.42, -.08], a);                       // tail fin
      ctx.beginPath(); ctx.moveTo(-.62, .16); ctx.lineTo(.62, .12); ctx.lineTo(.3, -.06); ctx.lineTo(-.5, -.06); ctx.closePath();
      ctx.lineWidth = .06; ctx.strokeStyle = ink; ctx.stroke();
      ctx.save(); ctx.translate(-.05, -.24); drawIcon(ctx, look, .42); ctx.restore();
      poly(ctx, [.3, -.06, .62, .12, .2, .02], a);
    } else if (mode === "ball") {
      const r = w / 2;
      circ(ctx, 0, 0, r, a);
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = b; ctx.fillRect(-r, -r * .18, r * 2, r * .36); ctx.fillRect(-r * .18, -r, r * .36, r * 2);
      ctx.restore();
      circ(ctx, 0, 0, r * .36, a); ring(ctx, 0, 0, r * .36, r * .1, ink);
      ring(ctx, 0, 0, r - r * .04, r * .1, ink);
    } else if (mode === "ufo") {
      const s = w;
      ctx.scale(s, s);
      ctx.save(); ctx.translate(0, -.1); drawIcon(ctx, look, .4); ctx.restore();
      ctx.beginPath(); ctx.arc(0, -.02, .32, Math.PI, 0); ctx.fillStyle = "rgba(190,240,255,.35)"; ctx.fill();
      ctx.lineWidth = .05; ctx.strokeStyle = ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, .12, .56, .17, 0, 0, Math.PI * 2); ctx.fillStyle = a; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, .1, .36, .07, 0, 0, Math.PI * 2); ctx.fillStyle = b; ctx.fill();
      for (let i = -1; i <= 1; i++) circ(ctx, i * .3, .2, .05, (Math.floor(time * 6) + i) % 2 ? b : "#fff");
    } else if (mode === "wave") {
      const s = w * 1.15;
      ctx.scale(s, s);
      poly(ctx, [.55, 0, -.45, -.42, -.22, 0, -.45, .42], a);
      poly(ctx, [.3, 0, -.22, -.2, -.1, 0, -.22, .2], b);
      ctx.beginPath(); ctx.moveTo(.55, 0); ctx.lineTo(-.45, -.42); ctx.lineTo(-.22, 0); ctx.lineTo(-.45, .42); ctx.closePath();
      ctx.lineWidth = .07; ctx.strokeStyle = ink; ctx.stroke();
    } else if (mode === "robot") {
      const s = w;
      ctx.scale(s, s);
      const step = Math.sin(time * 18) * .1;
      rect(ctx, -.28, .22, .16, .28 + step, b); rect(ctx, .1, .22, .16, .28 - step, b);
      rect(ctx, -.34, .44 + step, .26, .08, a); rect(ctx, .04, .44 - step, .26, .08, a);
      ctx.save(); ctx.translate(0, -.1); drawIcon(ctx, look, .7); ctx.restore();
      rect(ctx, .3, -.06, .16, .08, b);
    }
    ctx.restore();
  }

  GR.Looks = {
    COLORS: COLORS, ICONS: ICONS, TRAILS: TRAILS, unlockText: unlockText, drawIcon: drawIcon, drawPlayer: drawPlayer
  };
})();
