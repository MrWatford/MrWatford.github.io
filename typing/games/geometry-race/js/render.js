/* =========================================================
   Geometry Race — drawing and effects
   Draws the level, player, trails, and particles onto the canvas.
   Nothing here can hurt the player: hitboxes live in physics.js.
   World units are blocks with y pointing up.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};
  const P = GR.Physics, Looks = GR.Looks;

  const MODE_COLORS = { cube: "#4dff88", ship: "#ff5fd2", ball: "#ff9a2e", ufo: "#b07bff", wave: "#2de2ff", robot: "#e9ecff" };
  const PAD_COLORS = { yellow: "#ffd23f", pink: "#ff5fd2", blue: "#3fb6ff" };
  const SPEED_COLORS = ["#ff9a2e", "#3fb6ff", "#4dff88", "#ff5fd2"];
  const GRAV_COLORS = { up: "#ffe14d", down: "#3fb6ff" };

  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function Renderer(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.cssW = 1; this.cssH = 1; this.dpr = 1; this.scale = 40; this.viewW = 20; this.viewH = 11;
    this.cam = { x: 0, y: 0 };
    this.parts = [];
    this.trail = [];
    this.wave = [];
    this.fx = { low: false, reduced: false, shake: true };
    this.shake = 0;
    this.flash = 0;
    this.def = null; this.L = null;
  }

  Renderer.prototype.resize = function () {
    const r = this.c.getBoundingClientRect();
    this.cssW = Math.max(1, r.width); this.cssH = Math.max(1, r.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.fx.low ? 1 : 2);
    this.c.width = Math.round(this.cssW * this.dpr);
    this.c.height = Math.round(this.cssH * this.dpr);
    // At least 11 blocks tall and 19 blocks wide are always visible, so hazards never show up late on narrow screens.
    this.scale = Math.min(this.cssH / 11, this.cssW / 19);
    this.viewW = this.cssW / this.scale; this.viewH = this.cssH / this.scale;
  };

  Renderer.prototype.setLevel = function (def, L) {
    this.def = def; this.L = L; this.pal = def.palette;
    this.draw = def.objects.map(function (o, i) {
      const x0 = o.t === "block" || o.t === "haz" ? o.x : o.t === "saw" ? o.x - o.r : o.t === "text" ? o.x : o.x - 1;
      const x1 = o.t === "block" || o.t === "haz" ? o.x + o.w : o.t === "saw" ? o.x + o.r : o.t === "text" ? o.x + 30 : o.x + 2;
      const pad = o.mv ? Math.abs(o.mv.ax) : 0;
      return { o: o, x0: x0 - pad, x1: x1 + pad, i: i };
    }).sort(function (a, b) { return a.x0 - b.x0; });
    this.maxSpan = this.draw.reduce(function (m, d) { return Math.max(m, d.x1 - d.x0); }, 0);
    // Map trigger objects to their ids so used orbs/pads can be dimmed.
    const trigIndex = new Map();
    L.triggers.forEach(function (t) { trigIndex.set(t.x + ":" + t.y + ":" + t.t, t.id); });
    this.trigIndex = trigIndex;
    this.parts.length = 0; this.trail.length = 0; this.wave.length = 0;
  };

  // ---------- camera ----------
  Renderer.prototype.zoneAt = function (x) {
    const z = this.def.zones;
    for (let i = 0; i < z.length; i++) if (x >= z[i].x0 - 2 && x <= z[i].x1) return z[i];
    return null;
  };
  Renderer.prototype.camTarget = function (s) {
    const vh = this.viewH;
    const z = this.zoneAt(s.x + 3) || this.zoneAt(s.x);
    if (z) {
      const mid = (z.lo + z.hi) / 2;
      if (z.hi - z.lo <= vh - 1.4) return mid;
      return Math.max(z.lo + vh / 2 - 0.7, Math.min(z.hi - vh / 2 + 0.7, s.y));
    }
    const base = vh / 2 - 2.4;
    let t = base;
    if (s.y > base + vh / 2 - 3.4) t = s.y - vh / 2 + 3.4;
    return t;
  };
  Renderer.prototype.resetCam = function (s) {
    this.cam.x = s.x - this.viewW * 0.3;
    this.cam.y = this.camTarget(s);
  };
  Renderer.prototype.updateCam = function (x, s, dt) {
    this.cam.x = x - this.viewW * 0.3;
    const t = this.camTarget(s), k = 1 - Math.exp(-dt * 5.5);
    this.cam.y += (t - this.cam.y) * k;
  };

  // ---------- particles ----------
  Renderer.prototype.emit = function (n, x, y, opt) {
    const max = this.fx.low ? 140 : 420;
    if (this.fx.reduced) n = Math.ceil(n / 2);
    for (let i = 0; i < n && this.parts.length < max; i++) {
      const a = (opt.dir != null ? opt.dir : 0) + (Math.random() - 0.5) * (opt.spread != null ? opt.spread : Math.PI * 2);
      const sp = (opt.speed || 4) * (0.4 + Math.random() * 0.8);
      this.parts.push({
        x: x + (Math.random() - 0.5) * (opt.jitter || 0), y: y + (Math.random() - 0.5) * (opt.jitter || 0),
        vx: Math.cos(a) * sp + (opt.vx || 0), vy: Math.sin(a) * sp + (opt.vy || 0),
        life: 0, max: (opt.life || 0.5) * (0.6 + Math.random() * 0.6), size: (opt.size || 0.18) * (0.6 + Math.random() * 0.8),
        color: opt.colors ? opt.colors[(Math.random() * opt.colors.length) | 0] : opt.color, g: opt.g || 0,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, kind: opt.kind || 0
      });
    }
  };
  Renderer.prototype.burst = function (x, y, colors) {
    this.emit(34, x, y, { speed: 9, life: 0.55, size: 0.28, colors: colors, g: -14, kind: 0 });
    this.emit(14, x, y, { speed: 15, life: 0.3, size: 0.12, colors: ["#ffffff"], kind: 1 });
    this.ring = { x: x, y: y, t: 0, color: colors[0] };
    if (this.fx.shake && !this.fx.reduced) this.shake = 0.28;
  };
  Renderer.prototype.confetti = function (x, y) {
    const cols = ["#ffe14d", "#39ff88", "#2de2ff", "#ff4fd8", "#ffffff", "#ff9a2e"];
    this.emit(80, x, y, { speed: 14, life: 1.4, size: 0.26, colors: cols, g: -10, dir: Math.PI / 2, spread: Math.PI * 1.4 });
    this.flash = this.fx.reduced ? 0 : 0.35;
  };
  Renderer.prototype.clearFx = function () { this.parts.length = 0; this.trail.length = 0; this.wave.length = 0; this.ring = null; this.shake = 0; this.flash = 0; };

  Renderer.prototype.stepFx = function (dt) {
    const ps = this.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.max) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      p.vx *= 1 - dt * 1.5;
    }
    if (this.ring) { this.ring.t += dt; if (this.ring.t > 0.45) this.ring = null; }
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
  };

  // Trail history (called once per frame while alive). Wave points come from every tick.
  Renderer.prototype.pushTrail = function (x, y, now) {
    this.trail.push({ x: x, y: y, t: now });
    while (this.trail.length && now - this.trail[0].t > 0.32) this.trail.shift();
  };
  Renderer.prototype.pushWave = function (x, y, t) {
    const w = this.wave;
    w.push({ x: x, y: y, t: t });
    while (w.length > 2 && t - w[0].t > 1.3) w.shift();
  };

  // ---------- drawing ----------
  // v: { s, x, y (drawn player position), t (level time), now, look, attempt, practice, checkpoints, dead, won, beat, energy }
  Renderer.prototype.render = function (v) {
    const ctx = this.ctx, dpr = this.dpr, W = this.cssW, H = this.cssH, sc = this.scale, pal = this.pal;
    const low = this.fx.low, reduced = this.fx.reduced;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Beat pulse (gentle, and off with reduced motion).
    const pulse = reduced ? 0 : Math.pow(1 - v.beat % 1, 4) * (v.energy || 0.5);

    // Sky.
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, pal.sky1); g.addColorStop(1, pal.sky2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    let shx = 0, shy = 0;
    if (this.shake > 0) { const a = this.shake * 0.5 * sc; shx = (Math.random() - 0.5) * a; shy = (Math.random() - 0.5) * a; }
    const camX = this.cam.x, camY = this.cam.y;

    // Far layer: slowly turning outlines.
    if (!low) {
      ctx.save();
      ctx.lineWidth = 2;
      const par = 0.08, tile = 7;
      const left = camX * par, i0 = Math.floor(left / tile) - 1, i1 = i0 + Math.ceil(this.viewW / tile) + 3;
      for (let i = i0; i <= i1; i++) {
        const h1 = hash(i * 7 + 3), h2 = hash(i * 13 + 5), h3 = hash(i * 31 + 9);
        const sx = ((i * tile + h1 * 4) - left) * sc, sy = H * (0.12 + h2 * 0.5) - (camY * 0.05) * sc;
        const size = (1.2 + h3 * 2.6) * sc;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate((reduced ? 0 : v.now * (h1 - 0.5) * 0.25) + h2 * 3);
        ctx.strokeStyle = hexA(pal.far, 0.18 + pulse * 0.12);
        if (h3 < 0.5) ctx.strokeRect(-size / 2, -size / 2, size, size);
        else { ctx.beginPath(); ctx.moveTo(0, -size / 2); ctx.lineTo(size / 2, size / 2); ctx.lineTo(-size / 2, size / 2); ctx.closePath(); ctx.stroke(); }
        ctx.restore();
      }
      ctx.restore();
    }
    // Mid layer: skyline.
    {
      const par = 0.3, tile = 2.6, left = camX * par;
      const i0 = Math.floor(left / tile) - 1, i1 = i0 + Math.ceil(this.viewW / tile) + 3;
      const groundSy = H / 2 + (camY - 0) * sc * 0.6 + sc * 0.6;
      ctx.fillStyle = hexA(pal.far, 0.13);
      for (let i = i0; i <= i1; i++) {
        const h = 2 + hash(i * 17 + 1) * 5.5;
        const sx = (i * tile - left) * sc;
        ctx.fillRect(sx, groundSy - h * sc, tile * sc - 3, h * sc + H);
      }
      ctx.fillStyle = hexA(pal.accent, 0.08 + pulse * 0.2);
      for (let i = i0; i <= i1; i++) {
        const h = 2 + hash(i * 17 + 1) * 5.5;
        ctx.fillRect((i * tile - left) * sc, groundSy - h * sc, tile * sc - 3, 2);
      }
    }

    // World transform: blocks, y up.
    const ox = -camX * sc + shx, oy = H / 2 + camY * sc + shy;
    ctx.setTransform(dpr * sc, 0, 0, -dpr * sc, dpr * ox, dpr * oy);
    const xL = camX - 1, xR = camX + this.viewW + 1;
    const yB = camY - this.viewH / 2 - 1, yT = camY + this.viewH / 2 + 1;
    const lw = 1 / sc;

    // Ground, zone floors/ceilings.
    const sol = this.L.solids;
    for (let i = 0; i < sol.length; i++) {
      const r = sol[i];
      if (r.k === "b" || r.x1 < xL || r.x0 > xR) continue;
      const y0 = Math.max(r.y0, yB), y1 = Math.min(r.y1, yT);
      if (y1 <= y0) continue;
      const x0 = Math.max(r.x0, xL), x1 = Math.min(r.x1, xR);
      ctx.fillStyle = pal.ground;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      // tile seams
      ctx.fillStyle = hexA("#000000", 0.18);
      for (let gx = Math.ceil(x0 / 2) * 2; gx < x1; gx += 2) ctx.fillRect(gx, y0, 2 * lw, y1 - y0);
      const edge = r.k === "z" && r.y0 > -20 ? r.y0 : r.y1;
      if (edge >= yB && edge <= yT) {
        ctx.fillStyle = pal.line;
        ctx.fillRect(x0, edge - 1.5 * lw, x1 - x0, 3 * lw);
        if (!low) { ctx.fillStyle = hexA(pal.line, 0.18 + pulse * 0.3); ctx.fillRect(x0, edge - 6 * lw, x1 - x0, 12 * lw); }
      }
    }

    // Objects.
    const list = this.draw, used = v.s.used, t = v.t;
    let lo = 0, hi = list.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (list[m].x0 < xL - this.maxSpan) lo = m + 1; else hi = m; }
    for (let i = lo; i < list.length; i++) {
      const d = list[i];
      if (d.x0 > xR) break;
      if (d.x1 < xL) continue;
      this.drawObj(ctx, d.o, t, used, v, lw, pulse);
    }

    // Finish gate.
    const ex = this.def.endX;
    if (ex < xR + 2) {
      for (let k = 0; k < 2; k++) {
        const gx = ex + k * 0.5;
        for (let yy = Math.floor(yB); yy < yT; yy++) {
          ctx.fillStyle = (yy + k) % 2 ? "#ffffff" : "#10131f";
          ctx.fillRect(gx, yy, 0.5, 1);
        }
      }
      ctx.fillStyle = hexA("#ffffff", 0.08 + pulse * 0.1);
      ctx.fillRect(ex + 1, yB, 6, yT - yB);
      this.text(ctx, "FINISH", ex - 0.6, camY + 2.6, 0.9, "#ffffff", "right");
    }

    // Practice checkpoints.
    if (v.checkpoints) v.checkpoints.forEach(function (cp) {
      ctx.save(); ctx.translate(cp.x, cp.y); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#39ff88"; ctx.fillRect(-0.28, -0.28, 0.56, 0.56);
      ctx.strokeStyle = "#0b2a17"; ctx.lineWidth = 2 * lw; ctx.strokeRect(-0.28, -0.28, 0.56, 0.56);
      ctx.restore();
    });

    // Attempt counter floating at the start.
    if (v.attemptText && v.attemptX != null) this.text(ctx, v.attemptText, v.attemptX, v.attemptY, 0.95, "#ffffff", "left", 0.92);

    // Trails, player, particles.
    this.drawTrail(ctx, v, lw);
    if (!v.dead) this.drawPlayer(ctx, v, lw);
    this.drawParticles(ctx, lw);
    if (this.ring) {
      const r = this.ring, k = r.t / 0.45;
      ctx.beginPath(); ctx.arc(r.x, r.y, 0.4 + k * 2.6, 0, Math.PI * 2);
      ctx.lineWidth = (1 - k) * 0.25; ctx.strokeStyle = hexA(r.color, 1 - k); ctx.stroke();
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.flash > 0) { ctx.fillStyle = "rgba(255,255,255," + (this.flash * 0.6) + ")"; ctx.fillRect(0, 0, W, H); }
  };

  Renderer.prototype.text = function (ctx, s, x, y, size, color, align, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(1, -1);
    ctx.font = "700 " + size + "px 'Russo One', 'Fredoka', system-ui, sans-serif";
    ctx.textAlign = align || "left"; ctx.textBaseline = "middle";
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.strokeText(s, 0, 0);
    ctx.fillStyle = color; ctx.fillText(s, 0, 0);
    ctx.restore();
  };

  Renderer.prototype.isUsed = function (o, used) {
    const id = this.trigIndex.get(o.x + ":" + o.y + ":" + o.t);
    return id != null && used[id];
  };

  Renderer.prototype.drawObj = function (ctx, o, t, used, v, lw, pulse) {
    const pal = this.pal, low = this.fx.low;
    const off = o.mv ? P.moveOffset(o.mv, t) : null, ox = off ? off[0] : 0, oy = off ? off[1] : 0;
    switch (o.t) {
      case "block": {
        ctx.fillStyle = pal.block; ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = hexA(pal.line, 0.16); ctx.lineWidth = lw;
        ctx.beginPath();
        for (let gx = o.x + 1; gx < o.x + o.w - 0.01; gx++) { ctx.moveTo(gx, o.y); ctx.lineTo(gx, o.y + o.h); }
        for (let gy = o.y + 1; gy < o.y + o.h - 0.01; gy++) { ctx.moveTo(o.x, gy); ctx.lineTo(o.x + o.w, gy); }
        ctx.stroke();
        ctx.strokeStyle = pal.line; ctx.lineWidth = 2.5 * lw;
        ctx.strokeRect(o.x + 1.25 * lw, o.y + 1.25 * lw, o.w - 2.5 * lw, o.h - 2.5 * lw);
        ctx.fillStyle = hexA("#ffffff", 0.12 + pulse * 0.1); ctx.fillRect(o.x, o.y + o.h - 0.1, o.w, 0.1);
        break;
      }
      case "spike": {
        const big = !o.small, hgt = big ? 1 : 0.5;
        const pts = [[0, 0], [1, 0], [0.5, hgt]].map(function (p) {
          let x = p[0], y = p[1];
          if (o.rot === 1) { const q = x; x = 1 - y; y = q; } else if (o.rot === 2) { x = 1 - x; y = 1 - y; } else if (o.rot === 3) { const q = x; x = y; y = 1 - q; }
          return [o.x + x + ox, o.y + y + oy];
        });
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.closePath();
        ctx.fillStyle = "#070a14"; ctx.fill();
        ctx.lineWidth = 2.4 * lw; ctx.strokeStyle = "#f2f6ff"; ctx.lineJoin = "miter"; ctx.stroke();
        // inner shine
        const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) { const px = cx + (pts[k][0] - cx) * 0.45, py = cy + (pts[k][1] - cy) * 0.45; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fillStyle = hexA(pal.accent, 0.25); ctx.fill();
        break;
      }
      case "haz": {
        const x = o.x + ox, y = o.y + oy;
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, o.w, o.h); ctx.clip();
        ctx.fillStyle = "#1a0509"; ctx.fillRect(x, y, o.w, o.h);
        ctx.fillStyle = "#ff3b4f";
        for (let k = -o.h - 1; k < o.w + 1; k += 0.7) {
          ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k + 0.32, y); ctx.lineTo(x + k + 0.32 + o.h, y + o.h); ctx.lineTo(x + k + o.h, y + o.h); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#ffd6dc"; ctx.strokeRect(x, y, o.w, o.h);
        break;
      }
      case "saw": {
        const x = o.x + ox, y = o.y + oy, r = o.r, n = Math.max(8, Math.round(r * 9));
        ctx.save(); ctx.translate(x, y); ctx.rotate(this.fx.reduced ? 0 : -t * 7);
        ctx.beginPath();
        for (let k = 0; k < n * 2; k++) { const a = k * Math.PI / n, rr = k % 2 ? r * 0.8 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fillStyle = "#0a0d18"; ctx.fill(); ctx.lineWidth = 2.4 * lw; ctx.strokeStyle = "#ff6b7d"; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.strokeStyle = "#f2f6ff"; ctx.stroke();
        ctx.fillStyle = "#ff6b7d"; ctx.fillRect(-r * 0.12, -r * 0.12, r * 0.24, r * 0.24);
        ctx.restore();
        break;
      }
      case "pad": {
        const c = PAD_COLORS[o.kind], usedNow = this.isUsed(o, used);
        const base = o.rot === 2 ? o.y + 1 : o.y, dir = o.rot === 2 ? -1 : 1;
        ctx.beginPath(); ctx.ellipse(o.x + 0.5, base, 0.46, 0.3, 0, dir > 0 ? 0 : Math.PI, dir > 0 ? Math.PI : Math.PI * 2);
        ctx.fillStyle = usedNow ? hexA(c, 0.45) : c; ctx.fill();
        ctx.lineWidth = 2 * lw; ctx.strokeStyle = "#0a0d18"; ctx.stroke();
        if (!usedNow && !low) {
          const k = (t * 2) % 1;
          ctx.fillStyle = hexA(c, 0.35 * (1 - k));
          ctx.fillRect(o.x + 0.2, base + dir * (0.2 + k * 0.9) - 0.05, 0.6, 0.1);
        }
        break;
      }
      case "orb": {
        const c = PAD_COLORS[o.kind], usedNow = this.isUsed(o, used);
        const k = (t * 1.6) % 1;
        if (!low) { ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = usedNow ? 0 : 14; }
        ctx.beginPath(); ctx.arc(o.x, o.y, 0.42, 0, Math.PI * 2);
        ctx.fillStyle = usedNow ? hexA(c, 0.25) : c; ctx.fill();
        if (!low) ctx.restore();
        ctx.beginPath(); ctx.arc(o.x, o.y, 0.42, 0, Math.PI * 2); ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#0a0d18"; ctx.stroke();
        ctx.beginPath(); ctx.arc(o.x, o.y, 0.2, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.globalAlpha = usedNow ? 0.3 : 0.85; ctx.fill(); ctx.globalAlpha = 1;
        if (!usedNow && !this.fx.reduced) { ctx.beginPath(); ctx.arc(o.x, o.y, 0.45 + k * 0.45, 0, Math.PI * 2); ctx.lineWidth = 2 * lw; ctx.strokeStyle = hexA(c, 1 - k); ctx.stroke(); }
        break;
      }
      case "portal": this.drawPortal(ctx, o, t, lw, this.isUsed(o, used)); break;
      case "token": {
        const got = this.isUsed(o, used) || (v.savedTokens && v.savedTokens[this.L.tokens.findIndex(function (q) { return q.x === o.x && q.y === o.y; })]);
        if (this.isUsed(o, used)) break;
        const sx = this.fx.reduced ? 1 : Math.cos(t * 3);
        ctx.save(); ctx.translate(o.x, o.y + (this.fx.reduced ? 0 : Math.sin(t * 4) * 0.08)); ctx.scale(Math.max(0.15, Math.abs(sx)), 1);
        if (!low) { ctx.shadowColor = "#ffd23f"; ctx.shadowBlur = 16; }
        ctx.beginPath(); ctx.moveTo(0, 0.48); ctx.lineTo(0.38, 0); ctx.lineTo(0, -0.48); ctx.lineTo(-0.38, 0); ctx.closePath();
        ctx.fillStyle = got ? "rgba(255,210,63,.35)" : "#ffd23f"; ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3 * lw; ctx.strokeStyle = got ? "rgba(255,255,255,.5)" : "#fff6c9"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0.22); ctx.lineTo(0.16, 0); ctx.lineTo(0, -0.22); ctx.lineTo(-0.16, 0); ctx.closePath();
        ctx.fillStyle = got ? "rgba(0,0,0,.2)" : "#ff9a2e"; ctx.fill();
        ctx.restore();
        break;
      }
      case "text": if (!v.noText) this.text(ctx, o.s, o.x, o.y, 0.62, "#ffffff", "left", 0.88); break;
    }
  };

  Renderer.prototype.drawPortal = function (ctx, o, t, lw, usedNow) {
    const low = this.fx.low;
    let c;
    if (o.k === "mode") c = MODE_COLORS[o.v];
    else if (o.k === "grav") c = GRAV_COLORS[o.v];
    else if (o.k === "speed") c = SPEED_COLORS[o.v];
    else c = o.v === "mini" ? "#ff4fd8" : "#39ff88";
    if (o.k === "speed") {
      // Chevrons: one per speed level.
      const n = o.v + 1;
      ctx.save(); ctx.translate(o.x, o.y);
      if (!low) { ctx.shadowColor = c; ctx.shadowBlur = 12; }
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 0.42;
        ctx.beginPath(); ctx.moveTo(x - 0.25, 0.75); ctx.lineTo(x + 0.18, 0); ctx.lineTo(x - 0.25, -0.75); ctx.lineTo(x - 0.05, -0.75); ctx.lineTo(x + 0.38, 0); ctx.lineTo(x - 0.05, 0.75); ctx.closePath();
        ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2 * lw; ctx.strokeStyle = "#0a0d18"; ctx.stroke();
      }
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(o.x, o.y);
    const wob = this.fx.reduced ? 0 : Math.sin(t * 5) * 0.03;
    if (!low) { ctx.shadowColor = c; ctx.shadowBlur = 18; }
    ctx.beginPath(); ctx.ellipse(0, 0, 0.42 + wob, 1.5, 0, 0, Math.PI * 2);
    ctx.lineWidth = 0.2; ctx.strokeStyle = c; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.ellipse(0, 0, 0.42 + wob, 1.5, 0, 0, Math.PI * 2);
    ctx.lineWidth = 2 * lw; ctx.strokeStyle = "#ffffff"; ctx.stroke();
    ctx.fillStyle = hexA(c, usedNow ? 0.08 : 0.18); ctx.fill();
    // Icon inside the portal.
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0a0d18"; ctx.lineWidth = 2 * lw;
    if (o.k === "mode") {
      ctx.save(); ctx.scale(1, -1);
      Looks.drawPlayer(ctx, o.v, { icon: 0, c1: 8, c2: 11 }, 0.5, 0.5, 0, t);
      ctx.restore();
    } else if (o.k === "grav") {
      const d = o.v === "up" ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(0, 0.45 * d); ctx.lineTo(0.28, 0.05 * d); ctx.lineTo(0.1, 0.05 * d); ctx.lineTo(0.1, -0.4 * d); ctx.lineTo(-0.1, -0.4 * d); ctx.lineTo(-0.1, 0.05 * d); ctx.lineTo(-0.28, 0.05 * d); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (o.k === "size") {
      const s = o.v === "mini" ? 0.24 : 0.5;
      ctx.fillRect(-s / 2, -s / 2, s, s); ctx.strokeRect(-s / 2, -s / 2, s, s);
    }
    ctx.restore();
  };

  Renderer.prototype.drawTrail = function (ctx, v, lw) {
    const look = v.look, s = v.s, c1 = Looks.COLORS[look.c1].c, c2 = Looks.COLORS[look.c2].c;
    // The wave always leaves a bright line.
    const w = this.wave;
    if (w.length > 1) {
      const d = P.dims(s);
      ctx.lineJoin = "miter"; ctx.lineCap = "butt";
      ctx.beginPath(); ctx.moveTo(w[0].x, w[0].y);
      for (let i = 1; i < w.length; i++) ctx.lineTo(w[i].x, w[i].y);
      if (!v.dead && s.mode === "wave") ctx.lineTo(v.x, v.y);
      ctx.lineWidth = Math.max(d.w * 0.55, 0.14); ctx.strokeStyle = hexA(c2, 0.75); ctx.stroke();
      ctx.lineWidth = Math.max(d.w * 0.18, 0.05); ctx.strokeStyle = "#ffffff"; ctx.stroke();
    }
    const tr = this.trail, style = Looks.TRAILS[look.trail] ? Looks.TRAILS[look.trail].name : "Streak";
    if (style === "Off" || tr.length < 2 || v.dead || s.mode === "wave") return;
    const n = tr.length;
    if (style === "Streak" || style === "Comet" || style === "Ribbon") {
      for (let i = 1; i < n; i++) {
        const k = i / n;
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y);
        ctx.lineCap = "round";
        if (style === "Ribbon") ctx.strokeStyle = "hsla(" + ((i * 18 + v.now * 200) % 360) + ",100%,62%," + (k * 0.85) + ")";
        else ctx.strokeStyle = hexA(style === "Comet" ? c1 : c2, k * (style === "Comet" ? 0.5 : 0.7));
        ctx.lineWidth = (style === "Comet" ? 0.75 : 0.32) * k;
        ctx.stroke();
      }
    } else if (style === "Dots") {
      for (let i = 0; i < n; i += 2) { const k = i / n; ctx.beginPath(); ctx.arc(tr[i].x, tr[i].y, 0.14 * k + 0.03, 0, Math.PI * 2); ctx.fillStyle = hexA(c2, k); ctx.fill(); }
    } else if (style === "Sparkle" || style === "Pixels") {
      if (Math.random() < 0.6 && !this.fx.reduced) this.emit(1, tr[n - 1].x - 0.3, tr[n - 1].y, {
        speed: 1, life: 0.45, size: style === "Pixels" ? 0.22 : 0.16, colors: [c1, c2, "#ffffff"], kind: style === "Sparkle" ? 2 : 0, jitter: 0.5
      });
    }
  };

  Renderer.prototype.drawPlayer = function (ctx, v, lw) {
    const s = v.s, d = P.dims(s), look = v.look;
    const c1 = Looks.COLORS[look.c1].c;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(1, -1);                 // drawings are made with y pointing down
    if (s.gs < 0) ctx.scale(1, -1);   // upside down in reversed gravity
    if (!this.fx.low) { ctx.shadowColor = c1; ctx.shadowBlur = 12; }
    Looks.drawPlayer(ctx, s.mode, look, d.w, d.h, v.rot, v.now);
    ctx.restore();
  };

  Renderer.prototype.drawParticles = function (ctx) {
    const ps = this.parts;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i], k = 1 - p.life / p.max;
      ctx.globalAlpha = k;
      ctx.fillStyle = p.color;
      if (p.kind === 1) ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      else if (p.kind === 2) { const r = p.size * k; ctx.fillRect(p.x - r, p.y - r * 0.2, r * 2, r * 0.4); ctx.fillRect(p.x - r * 0.2, p.y - r, r * 0.4, r * 2); }
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); const r = p.size * (0.4 + k * 0.6); ctx.fillRect(-r / 2, -r / 2, r, r); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
  };

  // Small static drawings for menus (How to Play legend, customization preview).
  Renderer.icon = function (canvas, kind, look, now) {
    const ctx = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const sc = Math.min(w, h) / 2.4;
    const fake = { fx: { low: false, reduced: true }, pal: { accent: "#7df9ff", line: "#5ec8ff", block: "#173a7a" }, isUsed: function () { return false; }, L: { tokens: [] }, text: function () {} };
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (kind.startsWith("mode:")) {
      Looks.drawPlayer(ctx, kind.slice(5), look, Math.min(w, h) * 0.6, Math.min(w, h) * 0.6, 0, now || 0);
    } else {
      ctx.scale(sc, -sc);
      const lw = 1 / sc, o = ({
        spike: { t: "spike", x: -0.5, y: -0.5, rot: 0 },
        saw: { t: "saw", x: 0, y: 0, r: 0.8 },
        haz: { t: "haz", x: -0.6, y: -0.6, w: 1.2, h: 1.2 },
        pad: { t: "pad", x: -0.5, y: -0.4, kind: "yellow", rot: 0 },
        orb: { t: "orb", x: 0, y: 0, kind: "yellow" },
        "orb-blue": { t: "orb", x: 0, y: 0, kind: "blue" },
        "pad-blue": { t: "pad", x: -0.5, y: -0.4, kind: "blue", rot: 0 },
        "portal-ship": { t: "portal", x: 0, y: 0, k: "mode", v: "ship" },
        "portal-grav": { t: "portal", x: 0, y: 0, k: "grav", v: "up" },
        "portal-speed": { t: "portal", x: 0, y: 0, k: "speed", v: 2 },
        "portal-mini": { t: "portal", x: 0, y: 0, k: "size", v: "mini" },
        token: { t: "token", x: 0, y: 0 },
        block: { t: "block", x: -0.8, y: -0.8, w: 1.6, h: 1.6 }
      })[kind];
      if (o && o.t === "portal") ctx.scale(0.7, 0.7);
      if (o) Renderer.prototype.drawObj.call(Object.assign(fake, { drawPortal: Renderer.prototype.drawPortal }), ctx, o, now || 0, [], {}, lw, 0);
    }
    ctx.restore();
  };

  GR.Renderer = Renderer;
  GR.COLORS = { MODE: MODE_COLORS, PAD: PAD_COLORS };
})();
