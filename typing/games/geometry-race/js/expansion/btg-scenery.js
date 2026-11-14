/* =========================================================
   Geometry Race: Beyond the Grid — scenery for levels 7–12
   Loaded on demand the first time an expansion level (or the
   expansion tab) is opened. Everything here only draws: nothing
   can touch the player. Backgrounds stay dim and soft so the
   bright, outlined hazards in front are always easy to read.
   Every animation is driven by the level clock or the player's
   position, so restarts and checkpoints look identical.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR;
  const TAU = Math.PI * 2;

  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }
  function mix(a, b, k) {
    const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    const r = Math.round((x >> 16 & 255) * (1 - k) + (y >> 16 & 255) * k), g = Math.round((x >> 8 & 255) * (1 - k) + (y >> 8 & 255) * k), bl = Math.round((x & 255) * (1 - k) + (y & 255) * k);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }
  // Envelope 0→1→0 across a [from, to] beat window (eases in and out over `edge` beats).
  function env(beat, w, edge) { if (!w) return 0; edge = edge || 4; return smooth((beat - w[0]) / edge) * smooth((w[1] - beat) / edge); }
  function prog(R, v) { return clamp(v.x / R.def.endX, 0, 1); }
  // Repeating parallax strip: calls fn(i, screenX) for each tile on screen.
  function strip(R, camX, par, tile, fn) {
    const sc = R.scale, left = camX * par, i0 = Math.floor(left / tile) - 1, i1 = i0 + Math.ceil(R.viewW / tile) + 3;
    for (let i = i0; i <= i1; i++) fn(i, (i * tile - left) * sc);
  }
  function horizon(R, camY, par, H) { return H / 2 + camY * R.scale * par + R.scale * 0.6; }
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); }
  function stars(ctx, W, H, camX, n, seed, a) {
    ctx.fillStyle = "rgba(255,255,255," + a + ")";
    for (let i = 0; i < n; i++) {
      const x = ((hash(seed + i) * W * 3 - camX * 2) % W + W) % W, y = hash(seed + i * 7 + 1) * H * 0.55;
      const s = 1 + hash(i + seed * 3) * 1.4; ctx.fillRect(x, y, s, s);
    }
  }
  // Big finish gate shared by several levels: two pylons and an arch of light.
  function bigGate(ctx, R, ex, yB, yT, lw, c1, c2, pulse, h) {
    h = h || 12;
    const low = R.fx.low;
    if (!low) { ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 24; }
    ctx.fillStyle = "#0a0d1c"; ctx.fillRect(ex - 1.4, -1, 1.2, h + 1); ctx.fillRect(ex + 2.2, -1, 1.2, h + 1);
    ctx.lineWidth = 4 * lw; ctx.strokeStyle = c1; ctx.strokeRect(ex - 1.4, -1, 1.2, h + 1); ctx.strokeRect(ex + 2.2, -1, 1.2, h + 1);
    ctx.beginPath(); ctx.arc(ex + 0.9, h, 2.3, Math.PI, 0, true); ctx.lineWidth = 0.5; ctx.strokeStyle = c2; ctx.stroke();
    if (!low) ctx.restore();
    const g = ctx.createLinearGradient(ex - 0.2, 0, ex + 2.2, 0);
    g.addColorStop(0, rgba(c2, 0)); g.addColorStop(0.5, rgba(c2, 0.35 + pulse * 0.2)); g.addColorStop(1, rgba(c2, 0));
    ctx.fillStyle = g; ctx.fillRect(ex - 0.2, -0.5, 2.4, h + 0.5);
    for (let y = 1; y < h; y += 2) { ctx.fillStyle = rgba(c1, 0.9); ctx.fillRect(ex - 1.1, y, 0.6, 0.18); ctx.fillRect(ex + 2.5, y, 0.6, 0.18); }
    R.text(ctx, "FINISH", ex + 0.9, Math.min(h - 1.6, R.cam.y + 3.2), 0.9, "#ffffff", "center");
  }

  const S = {};

  // =========================================================
  // 7. Neon Overdrive — city towers, highway, signs. The lights switch on in a wave at the drop.
  // =========================================================
  S.neon = {
    back: function (ctx, R, v, camX, camY, W, H, pulse) {
      const sc = R.scale, low = R.fx.low, beat = v.beat;
      stars(ctx, W, H, camX * 0.02 * sc, low ? 20 : 50, 11, 0.5);
      // How far the wave of lights has travelled (beat 62 → 66 sweeps across the screen).
      const wave = clamp((beat - 62) / 4, 0, 1.3) * W * 1.4 - W * 0.2;
      // Soft city glow on the horizon.
      const hg = horizon(R, camY, 0.15, H), glow = ctx.createLinearGradient(0, hg - H * 0.5, 0, hg);
      glow.addColorStop(0, "rgba(255,79,216,0)"); glow.addColorStop(1, "rgba(255,79,216," + (beat > 62 ? 0.22 : 0.08) + ")");
      ctx.fillStyle = glow; ctx.fillRect(0, hg - H * 0.5, W, H * 0.5);
      // Far towers.
      const gy = horizon(R, camY, 0.15, H);
      strip(R, camX, 0.12, 3.4, function (i, sx) {
        const h = (5 + hash(i * 3 + 1) * 9) * sc * 0.7, w = (2.2 + hash(i * 5) * 1.0) * sc * 0.7;
        ctx.fillStyle = "#050a20"; ctx.fillRect(sx, gy - h, w, h + H);
        ctx.fillStyle = "rgba(61,123,255,.45)"; ctx.fillRect(sx, gy - h, w, 2); ctx.fillRect(sx, gy - h, 2, h);
        if (low) return;
        const lit = sx < wave ? 0.6 : 0.16, cols = Math.max(2, Math.floor(w / (0.42 * sc))), rows = Math.floor(h / (0.55 * sc));
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const hv = hash(i * 977 + r * 31 + c);
          if (hv < lit) { ctx.fillStyle = sx < wave ? (hv < lit * 0.35 ? "rgba(255,79,216,.75)" : "rgba(45,226,255,.7)") : "rgba(61,123,255,.3)"; ctx.fillRect(sx + 3 + c * (w - 6) / cols, gy - h + 6 + r * 0.55 * sc, Math.max(2, 0.16 * sc), Math.max(2, 0.22 * sc)); }
        }
      });
      // Elevated highway with streaking car lights.
      const hy = horizon(R, camY, 0.35, H) - 3.0 * sc;
      ctx.fillStyle = "#0b1640"; ctx.fillRect(0, hy, W, 0.45 * sc);
      ctx.fillStyle = "rgba(45,226,255,.5)"; ctx.fillRect(0, hy, W, 2);
      strip(R, camX, 0.35, 6, function (i, sx) { ctx.fillStyle = "#0a1236"; ctx.fillRect(sx, hy + 0.45 * sc, 0.35 * sc, H); });
      if (!low) {
        const tt = R.fx.reduced ? 0 : v.t;
        for (let k = 0; k < 7; k++) {
          const sp = 0.25 + hash(k) * 0.3, x = ((hash(k * 9) * W + tt * sp * W) % (W * 1.3)) - W * 0.15;
          ctx.fillStyle = k % 2 ? "rgba(255,79,216,.8)" : "rgba(255,240,200,.8)"; ctx.fillRect(x, hy + 0.12 * sc, 0.9 * sc, 0.12 * sc);
        }
      }
      // Animated signs on the mid buildings.
      const my = horizon(R, camY, 0.32, H);
      strip(R, camX, 0.32, 5.2, function (i, sx) {
        const h = (2.6 + hash(i * 17 + 4) * 3.2) * sc;
        ctx.fillStyle = "#070e2c"; ctx.fillRect(sx, my - h, 3.4 * sc, h + H);
        ctx.fillStyle = rgba(sx < wave ? "#ff4fd8" : "#3d7bff", 0.5); ctx.fillRect(sx, my - h, 3.4 * sc, 2);
        if (hash(i * 13) < 0.55) {
          const on = sx < wave || beat < 2, c = hash(i) < 0.5 ? "#ff4fd8" : "#2de2ff", bx = sx + 0.4 * sc, by = my - h - 1.4 * sc;
          ctx.fillStyle = "#081030"; ctx.fillRect(bx, by, 2.6 * sc, 1.1 * sc);
          ctx.strokeStyle = rgba(c, on ? 0.9 : 0.25); ctx.lineWidth = 2; ctx.strokeRect(bx, by, 2.6 * sc, 1.1 * sc);
          if (on) {
            const ph = Math.floor(beat / 2 + i) % 3;
            ctx.fillStyle = rgba(c, 0.5 + pulse * 0.4);
            if (ph === 0) ctx.fillRect(bx + 0.3 * sc, by + 0.35 * sc, 2 * sc, 0.4 * sc);
            else if (ph === 1) { ctx.fillRect(bx + 0.4 * sc, by + 0.25 * sc, 0.6 * sc, 0.6 * sc); ctx.fillRect(bx + 1.5 * sc, by + 0.25 * sc, 0.6 * sc, 0.6 * sc); }
            else poly(ctx, [bx + 1.3 * sc, by + 0.2 * sc, bx + 1.8 * sc, by + 0.9 * sc, bx + 0.8 * sc, by + 0.9 * sc]), ctx.fill();
          }
        }
      });
    },
    world: function (ctx, R, v, xL, xR, yB, yT, lw) {
      // Circuit traces glowing in the street below the track.
      if (yB > -0.2 || R.fx.low) return;
      ctx.strokeStyle = "rgba(45,226,255,.28)"; ctx.lineWidth = 2 * lw; ctx.beginPath();
      for (let x = Math.floor(xL / 4) * 4; x < xR; x += 4) {
        const h = hash(x * 7 + 3);
        ctx.moveTo(x, -0.6); ctx.lineTo(x + 1.6, -0.6); ctx.lineTo(x + 2.2, -1.2 - h); ctx.lineTo(x + 4, -1.2 - h);
      }
      ctx.stroke();
    },
    finish: function (ctx, R, v, ex, yB, yT, lw, pulse) { bigGate(ctx, R, ex, yB, yT, lw, "#2de2ff", "#ff4fd8", pulse, 13); }
  };

  // =========================================================
  // 8. Tidal Circuit — light rays, coral, bubbles, and the mechanical sea creature.
  // =========================================================
  S.tidal = {
    back: function (ctx, R, v, camX, camY, W, H, pulse) {
      const sc = R.scale, low = R.fx.low, tt = R.fx.reduced ? 0 : v.t;
      // Deeper is darker; the final shaft gets brighter as you climb.
      const lift = clamp((camY - 6) / 14, 0, 1);
      if (lift > 0) { ctx.fillStyle = "rgba(120,255,240," + (lift * 0.22) + ")"; ctx.fillRect(0, 0, W, H); }
      // Light rays.
      if (!low) for (let k = 0; k < 5; k++) {
        const x = ((k * 0.27 + 0.1) * W - camX * sc * 0.05 + Math.sin(tt * 0.3 + k) * 12) % (W * 1.2);
        const g = ctx.createLinearGradient(x, 0, x - 0.2 * W, H);
        g.addColorStop(0, "rgba(160,255,240,.13)"); g.addColorStop(1, "rgba(160,255,240,0)");
        ctx.fillStyle = g; poly(ctx, [x, 0, x + 0.06 * W, 0, x - 0.12 * W, H, x - 0.26 * W, H]); ctx.fill();
      }
      // The giant mechanical sea creature swims past behind the glass tunnel.
      const e = env(v.beat, R.def.moments && R.def.moments.creature, 3);
      if (e > 0) {
        const m = R.def.moments.creature, k = (v.beat - m[0]) / (m[1] - m[0]);
        const cx = W * (1.25 - 1.7 * k), cy = H * 0.34, s = H * 0.42;
        ctx.save(); ctx.globalAlpha = 0.78 * e; ctx.translate(cx, cy);
        ctx.fillStyle = "#0c4262"; ctx.beginPath(); ctx.ellipse(0, 0, s * 1.3, s * 0.42, 0, 0, TAU); ctx.fill();
        poly(ctx, [s * 1.15, 0, s * 1.9, -s * 0.38, s * 1.75, 0, s * 1.9, s * 0.38]); ctx.fill();
        poly(ctx, [-s * 0.1, -s * 0.38, s * 0.3, -s * 0.75, s * 0.5, -s * 0.36]); ctx.fill();
        ctx.strokeStyle = "rgba(45,255,216,.85)"; ctx.lineWidth = 3;
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.28, -s * 0.38); ctx.lineTo(i * s * 0.28, s * 0.38); ctx.stroke(); }
        ctx.beginPath(); ctx.ellipse(0, 0, s * 1.3, s * 0.42, 0, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(-s * 0.95, -s * 0.06, s * 0.07, 0, TAU); ctx.fillStyle = "rgba(255,230,120,.9)"; ctx.fill();
        for (let i = 0; i < 6; i++) { ctx.fillStyle = "rgba(155,123,255,.7)"; ctx.fillRect(-s * 0.7 + i * s * 0.28, s * 0.12, s * 0.08, s * 0.08); }
        ctx.restore();
      }
      // Distant pipes and coral.
      const gy = horizon(R, camY, 0.3, H);
      ctx.fillStyle = "rgba(26,143,166,.18)"; ctx.fillRect(0, gy - 4.2 * sc, W, 0.3 * sc); ctx.fillRect(0, gy - 6.6 * sc, W, 0.18 * sc);
      strip(R, camX, 0.3, 2.2, function (i, sx) {
        const h = (0.8 + hash(i * 7) * 2.6) * sc, c = hash(i * 3) < 0.5 ? "#1a8fa6" : "#9b7bff";
        // Rounded, swaying kelp and coral (soft curves so they never look like spikes).
        const sway = Math.sin(tt * 0.8 + i) * 0.25 * sc;
        ctx.strokeStyle = rgba(c, 0.26); ctx.lineCap = "round"; ctx.lineWidth = 0.32 * sc;
        ctx.beginPath(); ctx.moveTo(sx + 0.6 * sc, gy + 4); ctx.quadraticCurveTo(sx + 0.2 * sc + sway, gy - h * 0.5, sx + 0.6 * sc + sway * 2, gy - h); ctx.stroke();
        ctx.lineWidth = 0.2 * sc;
        ctx.beginPath(); ctx.moveTo(sx + 0.5 * sc, gy - h * 0.35); ctx.quadraticCurveTo(sx + 1.2 * sc + sway, gy - h * 0.55, sx + 1.1 * sc + sway * 1.5, gy - h * 0.8); ctx.stroke();
        if (!low) { ctx.beginPath(); ctx.arc(sx + 0.6 * sc + sway * 2, gy - h, 0.16 * sc, 0, TAU); ctx.fillStyle = rgba(c === "#1a8fa6" ? "#2dffd8" : "#d4c4ff", 0.35 + pulse * 0.3); ctx.fill(); }
      });
      // Bubbles drift up.
      if (!low) {
        ctx.strokeStyle = "rgba(200,255,250,.35)"; ctx.lineWidth = 1.5;
        for (let i = 0; i < 26; i++) {
          const x = ((hash(i * 5) * W * 2 - camX * sc * 0.2) % W + W) % W, y = H - ((hash(i * 9) * H + tt * (20 + hash(i) * 30)) % (H * 1.1));
          ctx.beginPath(); ctx.arc(x + Math.sin(tt + i) * 4, y, 2 + hash(i * 3) * 4, 0, TAU); ctx.stroke();
        }
      }
    },
    block: function (ctx, R, o, x, y, lw, pulse) {
      if (o.st === "glass") {
        ctx.fillStyle = "rgba(20,110,140,.62)"; ctx.fillRect(x, y, o.w, o.h);
        ctx.fillStyle = "#7ff6ff";
        if (o.y <= 0.01) ctx.fillRect(x, y + o.h - 3 * lw, o.w + 0.02, 3 * lw); else ctx.fillRect(x, y, o.w + 0.02, 3 * lw);
        return true;
      }
      if (o.st === "gate") {
        ctx.fillStyle = "#0b3a4a"; ctx.fillRect(x, y, o.w, o.h);
        ctx.fillStyle = "rgba(255,210,63,.75)";
        for (let k = 0; k < o.h; k += 1) ctx.fillRect(x, y + k, o.w, 0.12);
        ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#2dffd8"; ctx.strokeRect(x, y, o.w, o.h);
        return true;
      }
      return false;
    },
    finish: function (ctx, R, v, ex, yB, yT, lw, pulse) {
      const top = 30;
      ctx.fillStyle = "rgba(160,255,240,.18)"; ctx.fillRect(ex - 3, 14, 10, top);
      bigGate(ctx, R, ex, yB, yT, lw, "#2dffd8", "#9b7bff", pulse, 26);
    }
  };

  // =========================================================
  // 9. Clockwork Citadel — gears, pendulums, castle walls, and the giant clock.
  // =========================================================
  function gear(ctx, x, y, r, teeth, a, fill, line) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) { const ang = i * Math.PI / teeth, rr = i % 2 ? r * 0.84 : r; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, TAU); ctx.strokeStyle = line; ctx.stroke();
    ctx.restore();
  }
  S.clock = {
    back: function (ctx, R, v, camX, camY, W, H, pulse) {
      const sc = R.scale, low = R.fx.low, beat = R.fx.reduced ? 0 : v.beat;
      // The great clock face (wakes up in the final chamber, turning one notch per beat).
      const e = Math.max(0.25, env(v.beat, R.def.moments && R.def.moments.clock, 6));
      const cx = W * 0.62 - (camX * sc * 0.03) % (W * 0.2), cy = H * 0.36, r = H * (0.26 + 0.12 * e);
      ctx.save(); ctx.globalAlpha = 0.35 + 0.4 * e;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = "#2a1a0c"; ctx.fill();
      ctx.lineWidth = Math.max(3, r * 0.05); ctx.strokeStyle = "#a8732a"; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.floor(beat) * TAU / 60 * e);
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.fillStyle = "#ffc04a"; ctx.fillRect(-r * 0.02, -r * 0.92, r * 0.04, r * 0.14); }
      ctx.restore();
      const hb = beat / 4, mb = beat;
      ctx.lineCap = "round"; ctx.strokeStyle = "#ffd27a";
      ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(hb * TAU / 12) * r * 0.5, cy - Math.cos(hb * TAU / 12) * r * 0.5); ctx.stroke();
      ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(Math.floor(mb) * TAU / 16) * r * 0.8, cy - Math.cos(Math.floor(mb) * TAU / 16) * r * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.06, 0, TAU); ctx.fillStyle = "#ffc04a"; ctx.fill();
      ctx.restore();
      // Far gears.
      if (!low) strip(R, camX, 0.1, 8, function (i, sx) {
        const r2 = (1.2 + hash(i * 3) * 1.6) * sc, y = H * (0.15 + hash(i * 11) * 0.4);
        gear(ctx, sx, y, r2, 10 + Math.floor(hash(i) * 6), beat * (i % 2 ? 0.08 : -0.08), "rgba(80,50,20,.35)", "rgba(168,115,42,.45)");
      });
      // Castle wall with arches.
      const gy = horizon(R, camY, 0.3, H);
      strip(R, camX, 0.3, 4, function (i, sx) {
        const h = (3 + hash(i * 5) * 3) * sc;
        ctx.fillStyle = "rgba(42,26,12,.85)"; ctx.fillRect(sx, gy - h, 4 * sc, h + H);
        ctx.fillStyle = "rgba(255,176,46," + (0.12 + pulse * 0.12) + ")";
        ctx.beginPath(); ctx.arc(sx + 2 * sc, gy - h * 0.55, 0.6 * sc, Math.PI, 0); ctx.lineTo(sx + 2.6 * sc, gy - h * 0.3); ctx.lineTo(sx + 1.4 * sc, gy - h * 0.3); ctx.fill();
        for (let k = 0; k < 4; k++) { ctx.fillStyle = "rgba(42,26,12,.85)"; ctx.fillRect(sx + k * sc, gy - h - 0.4 * sc, 0.6 * sc, 0.4 * sc); }
      });
    },
    block: function (ctx, R, o, x, y, lw, pulse) {
      const brass = o.st === "plat" || o.st === "gear";
      ctx.fillStyle = brass ? "#4a3218" : "#3b2a18"; ctx.fillRect(x, y, o.w, o.h);
      if (!brass && o.w * o.h < 300) {
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = lw; ctx.beginPath();
        for (let gy = Math.ceil(y * 2) / 2; gy < y + o.h; gy += 0.5) { ctx.moveTo(x, gy); ctx.lineTo(x + o.w, gy); }
        ctx.stroke();
      }
      ctx.lineWidth = 3 * lw; ctx.strokeStyle = brass ? "#ffc04a" : "#a8732a"; ctx.strokeRect(x + 1.5 * lw, y + 1.5 * lw, o.w - 3 * lw, o.h - 3 * lw);
      ctx.fillStyle = "#ffd27a";
      if (o.w >= 1 && o.h >= 0.6) { ctx.fillRect(x + 0.15, y + o.h - 0.3, 0.12, 0.12); ctx.fillRect(x + o.w - 0.27, y + o.h - 0.3, 0.12, 0.12); }
      ctx.fillStyle = "rgba(255,255,255," + (0.1 + pulse * 0.1) + ")"; ctx.fillRect(x, y + o.h - 0.1, o.w, 0.1);
      return true;
    },
    finish: function (ctx, R, v, ex, yB, yT, lw, pulse) { bigGate(ctx, R, ex, yB, yT, lw, "#ffc04a", "#ffd27a", pulse, 12); }
  };

  // =========================================================
  // 10. Prism Paradox — soft floating prisms; at the transition they split into a mirrored pattern.
  // =========================================================
  S.prism = {
    back: function (ctx, R, v, camX, camY, W, H, pulse) {
      const sc = R.scale, low = R.fx.low, tt = R.fx.reduced ? 0 : v.t;
      // Luminous tunnel rings toward a vanishing point.
      if (!low) {
        const cx = W * 0.5, cy = H * 0.42;
        for (let k = 0; k < 6; k++) {
          const f = ((k + tt * 0.25) % 6) / 6, s = 30 + f * f * W * 0.9;
          ctx.strokeStyle = "rgba(224,123,255," + (0.12 * (1 - f) + 0.02) + ")"; ctx.lineWidth = 2;
          ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + Math.PI / 6; ctx.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s * 0.6); } ctx.closePath(); ctx.stroke();
        }
      }
      // Kaleidoscope split during the musical transition (purely decorative; the controls never change).
      const e = env(v.beat, R.def.moments && R.def.moments.split, 4);
      // Floating prisms: soft, unoutlined, and low contrast so they never look like the solid crystals.
      strip(R, camX, 0.12, 5, function (i, sx) {
        const y = H * (0.12 + hash(i * 7) * 0.55), s = (0.8 + hash(i * 3) * 1.8) * sc, a = tt * (hash(i) - 0.5) * 0.5 + i;
        const c = ["#8a5cff", "#ff5fe0", "#4df3ff"][((i % 3) + 3) % 3];
        ctx.save(); ctx.translate(sx, y); ctx.rotate(a);
        ctx.fillStyle = rgba(c, 0.14);
        const sp = e * s * 0.6;
        poly(ctx, [0 - sp, -s, s * 0.87 - sp, s * 0.5, -s * 0.87 - sp, s * 0.5]); ctx.fill();
        if (e > 0.02) { ctx.fillStyle = rgba(c, 0.14 * e); poly(ctx, [0 + sp, s, s * 0.87 + sp, -s * 0.5, -s * 0.87 + sp, -s * 0.5]); ctx.fill(); }
        ctx.restore();
      });
      if (e > 0.02 && !low) {
        const cx = W * 0.5, cy = H * 0.4, r = H * 0.45;
        ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = 0.35 * e;
        for (let j = 0; j < 12; j++) {
          ctx.rotate(TAU / 12);
          const f = (j % 2 ? 1 : -1);
          ctx.fillStyle = j % 3 === 0 ? "#ff5fe0" : j % 3 === 1 ? "#4df3ff" : "#8a5cff";
          poly(ctx, [0, 0, r * 0.95, f * r * 0.12 * e, r * 0.75, f * r * 0.3 * e]); ctx.fill();
        }
        ctx.restore();
      }
    },
    block: function (ctx, R, o, x, y, lw, pulse) {
      ctx.fillStyle = "#2a0f55"; ctx.fillRect(x, y, o.w, o.h);
      ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#e07bff"; ctx.strokeRect(x + 1.5 * lw, y + 1.5 * lw, o.w - 3 * lw, o.h - 3 * lw);
      ctx.strokeStyle = "rgba(77,243,255,.25)"; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.min(o.w, o.h), y + Math.min(o.w, o.h)); ctx.stroke();
      return true;
    },
    finish: function (ctx, R, v, ex, yB, yT, lw, pulse) {
      // The giant fractured prism opens around the exit.
      ctx.save(); ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(224,123,255,.25)"; poly(ctx, [ex - 9, -1, ex + 0.6, 16, ex + 0.2, -1]); ctx.fill();
      ctx.fillStyle = "rgba(77,243,255,.22)"; poly(ctx, [ex + 1.8, -1, ex + 1.4, 16, ex + 11, -1]); ctx.fill();
      ctx.restore();
      bigGate(ctx, R, ex, yB, yT, lw, "#e07bff", "#4df3ff", pulse, 12);
    }
  };

  // =========================================================
  // 11. Solar Breakdown — the swelling star and a station falling apart behind you.
  // =========================================================
  S.solar = {
    back: function (ctx, R, v, camX, camY, W, H, pulse) {
      const sc = R.scale, low = R.fx.low, p = prog(R, v), tt = R.fx.reduced ? 0 : v.t;
      stars(ctx, W, H, camX * 0.02 * sc, low ? 25 : 70, 5, 0.6);
      // The star grows through the level and swells dramatically during the escape.
      const esc = R.def.moments && R.def.moments.escape ? smooth((v.beat - R.def.moments.escape[0]) / 20) : 0;
      const r = H * (0.16 + 0.22 * p + 0.35 * esc), cx = W * 0.78, cy = H * 0.3;
      if (!low) {
        const g = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.2);
        g.addColorStop(0, "rgba(255,200,80,.55)"); g.addColorStop(0.5, "rgba(255,90,30,.18)"); g.addColorStop(1, "rgba(255,60,20,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      const g2 = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
      g2.addColorStop(0, "#fff3b0"); g2.addColorStop(0.6, "#ffb02e"); g2.addColorStop(1, "#ff5a1a");
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = g2; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      if (!low) for (let k = 0; k < 4; k++) {
        const a = k * 1.7 + tt * 0.08;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.25, a + 2.4, a + 4.0);
        ctx.lineWidth = r * 0.04; ctx.strokeStyle = "rgba(255,170,60,.5)"; ctx.stroke();
      }
      // Station trusses. During the escape, sections drift away and tumble (only scenery).
      const gy = horizon(R, camY, 0.32, H);
      strip(R, camX, 0.32, 4.5, function (i, sx) {
        let dx = 0, dy = 0, rot = 0;
        if (esc > 0) { const d = esc * (0.5 + hash(i * 3)); dx = d * 2.2 * sc; dy = -d * (1 + hash(i * 7) * 3) * sc; rot = d * (hash(i) - 0.5) * 1.6; }
        const h = (2 + hash(i * 5) * 3.5) * sc, w = 3.8 * sc;
        ctx.save(); ctx.translate(sx + w / 2 + dx, gy - h / 2 + dy); ctx.rotate(rot);
        ctx.fillStyle = "rgba(42,22,18,.92)"; ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = "rgba(255,154,46,.35)"; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.moveTo(w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2); ctx.stroke();
        if (hash(i * 9) < 0.5) { ctx.fillStyle = "rgba(255,210,63," + (0.25 + pulse * 0.3) + ")"; ctx.fillRect(-w * 0.3, -h * 0.4, w * 0.15, h * 0.12); }
        ctx.restore();
      });
    },
    block: function (ctx, R, o, x, y, lw, pulse) {
      const gird = o.st === "girder";
      ctx.fillStyle = gird ? "#4a3428" : "#3a2420"; ctx.fillRect(x, y, o.w, o.h);
      if (gird) {
        ctx.strokeStyle = "rgba(255,154,46,.6)"; ctx.lineWidth = 2 * lw; ctx.beginPath();
        for (let k = 0; k < o.h; k += 1) { ctx.moveTo(x, y + k); ctx.lineTo(x + o.w, y + k + 1); }
        ctx.stroke();
      }
      ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#ff9a2e"; ctx.strokeRect(x + 1.5 * lw, y + 1.5 * lw, o.w - 3 * lw, o.h - 3 * lw);
      ctx.fillStyle = "rgba(255,255,255," + (0.1 + pulse * 0.1) + ")"; ctx.fillRect(x, y + o.h - 0.1, o.w, 0.1);
      return true;
    },
    finish: function (ctx, R, v, ex, yB, yT, lw, pulse) { bigGate(ctx, R, ex, yB, yT, lw, "#ff9a2e", "#ffd23f", pulse, 13); }
  };

  // =========================================================
  // 12. Beyond the Grid — the central machine, colors from every level, and the Grid Guardian.
  // =========================================================
  const PHASE_COLORS = [["#4de8ff", "#e8f4ff"], ["#2dffd8", "#ff4fd8"], ["#ff3b6b", "#ffc04a"], ["#ffd23f", "#4de8ff"]];
  function phaseOf(def, beat) { let p = 0; (def.phases || []).forEach(function (ph, i) { if (beat >= ph[0]) p = i; }); return p; }
  S.grid = {
    init: function (R) { R.gridDown = null; },
    back: function (ctx, R, v, camX, camY, W, H, pulse) {
      const sc = R.scale, low = R.fx.low, def = R.def, beat = v.beat, tt = R.fx.reduced ? 0 : v.t;
      const ph = phaseOf(def, beat), pc = PHASE_COLORS[ph];
      // Perspective grid floor.
      const hy = H * 0.58 + camY * sc * 0.08;
      ctx.strokeStyle = rgba(pc[0], 0.22); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = -12; i <= 12; i++) { ctx.moveTo(W / 2 + i * W * 0.02, hy); ctx.lineTo(W / 2 + i * W * 0.22, H + 20); }
      const off = (camX * 0.4) % 1;
      for (let k = 0; k < 10; k++) { const f = Math.pow((k + 1 - off) / 10, 2); const y = hy + f * (H - hy + 20); ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      ctx.fillStyle = rgba(pc[1], 0.25); ctx.fillRect(0, hy - 1, W, 2);
      // Colors from earlier levels drift in as glowing panels (phase 2 onward).
      if (!low && ph >= 1) {
        const cols = ["#2de2ff", "#ff4fd8", "#2dffd8", "#ffc04a", "#e07bff", "#ff9a2e"];
        strip(R, camX, 0.1, 6, function (i, sx) {
          const c = cols[((i % 6) + 6) % 6], y = hy - (2 + hash(i * 3) * 5) * sc;
          ctx.fillStyle = rgba(c, 0.12); ctx.fillRect(sx, y, 1.6 * sc, 0.25 * sc);
        });
      }
      // The central machine on the horizon: rings that wake up phase by phase.
      const mx = W * 0.5, my = hy - H * 0.16, mr = H * 0.17;
      ctx.save(); ctx.translate(mx, my);
      for (let k = 0; k < 3; k++) {
        ctx.save(); ctx.rotate(tt * 0.1 * (k % 2 ? 1 : -1) * (ph + 1) + k);
        ctx.strokeStyle = rgba(pc[k % 2], 0.25 + 0.1 * ph); ctx.lineWidth = 3;
        ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = j / 6 * TAU; ctx.lineTo(Math.cos(a) * mr * (1 + k * 0.35), Math.sin(a) * mr * (1 + k * 0.35)); } ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(0, 0, mr * 0.45, 0, TAU); ctx.fillStyle = rgba(pc[0], 0.15 + pulse * 0.15); ctx.fill();
      ctx.restore();
      this.boss(ctx, R, v, W, H, pc);
    },
    // The Grid Guardian: always in the upper background, never over the route.
    boss: function (ctx, R, v, W, H, pc) {
      const bo = R.def.boss; if (!bo) return;
      const beat = v.beat, total = R.def.bossGates || 1, hits = v.s.bh || 0;
      if (beat < bo.enter - 2) return;
      const enterK = smooth((beat - bo.enter) / 6), downAt = bo.down;
      const sinceDown = beat - downAt, gone = sinceDown > 12;
      if (gone) return;
      const tt = R.fx.reduced ? 0 : v.t;
      const cx = W * 0.8, cy = H * (0.22 + (1 - enterK) * -0.4), r = Math.min(W, H) * 0.13;
      const fade = sinceDown > 0 ? 1 - smooth(sinceDown / 10) : 1;
      ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = 0.9 * fade;
      // Body: a turning double hexagon with plates that go dark as it takes damage.
      ctx.save(); ctx.rotate(tt * 0.3);
      for (let j = 0; j < 6; j++) {
        const a = j / 6 * TAU, alive = j < Math.ceil((1 - hits / total) * 6 + 0.001);
        ctx.fillStyle = alive ? "#1a1240" : "#0a0a14";
        poly(ctx, [0, 0, Math.cos(a) * r, Math.sin(a) * r, Math.cos(a + TAU / 6) * r, Math.sin(a + TAU / 6) * r]); ctx.fill();
        ctx.strokeStyle = alive ? rgba(pc[0], 0.9) : "rgba(120,120,140,.4)"; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
      ctx.save(); ctx.rotate(-tt * 0.5);
      ctx.strokeStyle = rgba(pc[1], 0.7); ctx.lineWidth = 3;
      ctx.beginPath(); for (let j = 0; j < 3; j++) { const a = j / 3 * TAU; ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35); } ctx.closePath(); ctx.stroke();
      ctx.restore();
      // Eye.
      const hitK = clamp(1 - (v.t - R.bossHit) / 0.5, 0, 1);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, TAU); ctx.fillStyle = hitK > 0 ? "#ffffff" : "#ff3b6b"; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, TAU); ctx.fillStyle = "#0a0a14"; ctx.fill();
      if (hitK > 0 && !R.fx.reduced) { ctx.beginPath(); ctx.arc(0, 0, r * (1 + (1 - hitK) * 0.8), 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(255,210,63," + hitK + ")"; ctx.stroke(); }
      ctx.restore();
      // Name and health (screen space, under the top bar).
      if (beat >= bo.fight - 2 && sinceDown < 2) {
        const bw = Math.min(260, W * 0.4), bx = W - bw - 16, by = Math.max(78, H * 0.06 + 60);
        ctx.fillStyle = "rgba(5,8,20,.65)"; ctx.fillRect(bx - 6, by - 20, bw + 12, 36);
        ctx.font = "14px 'Russo One', system-ui, sans-serif"; ctx.fillStyle = "#ffe0ea"; ctx.textAlign = "left"; ctx.fillText(bo.name, bx, by - 5);
        for (let k = 0; k < total; k++) {
          ctx.fillStyle = k < total - hits ? "#ff3b6b" : "rgba(255,255,255,.15)";
          ctx.fillRect(bx + k * (bw / total), by + 2, bw / total - 3, 8);
        }
      }
      // Shutdown: a gentle burst of light and shapes (no strobing).
      if (sinceDown > 0 && sinceDown < 12) {
        const k = sinceDown / 12;
        ctx.save(); ctx.translate(cx, cy);
        ctx.globalAlpha = 1 - k;
        ctx.beginPath(); ctx.arc(0, 0, r * (1 + k * 6), 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = "#ffd23f"; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * (0.6 + k * 4), 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = "#4de8ff"; ctx.stroke();
        for (let j = 0; j < 14; j++) {
          const a = j / 14 * TAU + hash(j) * 0.5, d = r * (0.5 + k * 5 * (0.6 + hash(j * 3)));
          ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(k * 4 + j);
          ctx.fillStyle = j % 2 ? "#ffd23f" : "#4de8ff"; poly(ctx, [0, -8, 7, 6, -7, 6]); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        if (!R.fx.reduced) { ctx.fillStyle = "rgba(255,240,200," + (0.18 * (1 - smooth(sinceDown / 3))) + ")"; ctx.fillRect(0, 0, W, H); }
      }
    },
    world: function (ctx, R, v, xL, xR, yB, yT, lw) {
      // Targeting lines: while a Guardian beam charges, a faint line points at it from the top-right.
      const bo = R.def.boss; if (!bo || v.beat < bo.fight - 1 || v.beat > bo.down) return;
      const list = R.draw;
      ctx.lineWidth = 2 * lw;
      for (let i = 0; i < list.length; i++) {
        const o = list[i].o;
        if (o.t !== "beam" || o.st !== "boss" || o.x > xR + 4 || o.x + o.w < xL) continue;
        const st = GR.Renderer.timedState(o, v.t);
        if (st[0] !== 1) continue;
        ctx.strokeStyle = "rgba(255,59,107," + (0.15 + 0.3 * st[1]) + ")";
        ctx.beginPath(); ctx.moveTo(xR + 2, yT); ctx.lineTo(o.x + o.w / 2, o.y + o.h / 2); ctx.stroke();
      }
    },
    block: function (ctx, R, o, x, y, lw, pulse) {
      if (o.st === "boss") {
        ctx.fillStyle = "#1a0a28"; ctx.fillRect(x, y, o.w, o.h);
        ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#ff3b6b"; ctx.strokeRect(x + 1.5 * lw, y + 1.5 * lw, o.w - 3 * lw, o.h - 3 * lw);
        return true;
      }
      return false;
    },
    finish: function (ctx, R, v, ex, yB, yT, lw, pulse) {
      // The massive final gateway.
      const low = R.fx.low;
      if (!low) { ctx.save(); ctx.shadowColor = "#ffd23f"; ctx.shadowBlur = 30; }
      ctx.fillStyle = "#0a0d1c"; ctx.fillRect(ex - 3, -1, 2, 20); ctx.fillRect(ex + 3.6, -1, 2, 20);
      ctx.lineWidth = 5 * lw; ctx.strokeStyle = "#ffd23f"; ctx.strokeRect(ex - 3, -1, 2, 20); ctx.strokeRect(ex + 3.6, -1, 2, 20);
      ctx.beginPath(); ctx.arc(ex + 1.3, 19, 4.3, Math.PI, 0, true); ctx.lineWidth = 0.6; ctx.strokeStyle = "#4de8ff"; ctx.stroke();
      if (!low) ctx.restore();
      const g = ctx.createLinearGradient(ex - 1, 0, ex + 3.6, 0);
      g.addColorStop(0, "rgba(255,210,63,0)"); g.addColorStop(0.5, "rgba(255,240,180," + (0.4 + pulse * 0.2) + ")"); g.addColorStop(1, "rgba(77,232,255,0)");
      ctx.fillStyle = g; ctx.fillRect(ex - 1, -0.5, 4.6, 20);
      R.text(ctx, "BEYOND THE GRID", ex + 1.3, Math.min(14, R.cam.y + 3.4), 0.8, "#ffffff", "center");
    }
  };

  GR.Scenery = Object.assign(GR.Scenery || {}, S);
})();
