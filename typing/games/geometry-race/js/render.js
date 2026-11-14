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
    // Expansion scenery (backgrounds, special block styles, boss) when it has loaded.
    this.scn = (def.scenery && GR.Scenery && GR.Scenery[def.scenery]) || null;
    this.bossHit = -10;
    if (this.scn && this.scn.init) this.scn.init(this, def);
    this.draw = def.objects.map(function (o, i) {
      let x0, x1;
      if (o.t === "crys") { x0 = Infinity; x1 = -Infinity; for (let k = 0; k < o.pts.length; k += 2) { x0 = Math.min(x0, o.pts[k]); x1 = Math.max(x1, o.pts[k]); } }
      else if (o.t === "block" || o.t === "haz" || o.t === "beam") { x0 = o.x; x1 = o.x + o.w; }
      else if (o.t === "saw" || o.t === "pulse") { x0 = o.x - o.r; x1 = o.x + o.r; }
      else if (o.t === "text") { x0 = o.x; x1 = o.x + 30; }
      else { x0 = o.x - 1; x1 = o.x + 2; }
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

    // Far layer: slowly turning outlines (or the level's own scenery).
    const scn = this.scn;
    if (scn && scn.back) scn.back(ctx, this, v, camX, camY, W, H, pulse);
    if (!scn && !low) {
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
    if (!scn) {
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
    if (scn && scn.world) scn.world(ctx, this, v, xL, xR, yB, yT, lw, pulse);

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
    if (ex < xR + 12 && scn && scn.finish) scn.finish(ctx, this, v, ex, yB, yT, lw, pulse);
    else if (ex < xR + 2) {
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
    if (scn && scn.overlay) scn.overlay(ctx, this, v, W, H);
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
        const bx = o.x + ox, by = o.y + oy;
        if (o.mv) this.drawTrack(ctx, o, t, lw);
        if (o.clip) { ctx.save(); ctx.beginPath(); ctx.rect(bx - 0.5, o.clip[0], o.w + 1, o.clip[1] - o.clip[0]); ctx.clip(); }
        if (!(this.scn && this.scn.block && this.scn.block(ctx, this, o, bx, by, lw, pulse, t))) {
          ctx.fillStyle = pal.block; ctx.fillRect(bx, by, o.w, o.h);
          if (o.w * o.h < 400) {
            ctx.strokeStyle = hexA(pal.line, 0.16); ctx.lineWidth = lw;
            ctx.beginPath();
            for (let gx = bx + 1; gx < bx + o.w - 0.01; gx++) { ctx.moveTo(gx, by); ctx.lineTo(gx, by + o.h); }
            for (let gy = by + 1; gy < by + o.h - 0.01; gy++) { ctx.moveTo(bx, gy); ctx.lineTo(bx + o.w, gy); }
            ctx.stroke();
          }
          ctx.strokeStyle = pal.line; ctx.lineWidth = 2.5 * lw;
          ctx.strokeRect(bx + 1.25 * lw, by + 1.25 * lw, o.w - 2.5 * lw, o.h - 2.5 * lw);
          ctx.fillStyle = hexA("#ffffff", 0.12 + pulse * 0.1); ctx.fillRect(bx, by + o.h - 0.1, o.w, 0.1);
        }
        if (o.mv) this.drawLamp(ctx, o, bx, by, t, lw);
        if (o.clip) ctx.restore();
        break;
      }
      case "beam": this.drawBeam(ctx, o, t, lw, ox, oy); break;
      case "pulse": this.drawPulse(ctx, o, t, lw); break;
      case "crys": this.drawCrystal(ctx, o, lw, pulse); break;
      case "bgate": this.drawBossGate(ctx, o, t, lw, this.isUsed(o, used), v); break;
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
        if (o.st === "energy") { this.drawEnergy(ctx, o, x, y, t, lw); break; }
        if (o.st === "piston") this.drawShaft(ctx, o, x, y, lw);
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, o.w, o.h); ctx.clip();
        ctx.fillStyle = "#1a0509"; ctx.fillRect(x, y, o.w, o.h);
        ctx.fillStyle = "#ff3b4f";
        for (let k = -o.h - 1; k < o.w + 1; k += 0.7) {
          ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k + 0.32, y); ctx.lineTo(x + k + 0.32 + o.h, y + o.h); ctx.lineTo(x + k + o.h, y + o.h); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#ffd6dc"; ctx.strokeRect(x, y, o.w, o.h);
        if (o.mv && o.mv.shape === "step") this.drawLamp(ctx, o, x, y, t, lw);
        break;
      }
      case "saw": {
        const x = o.x + ox, y = o.y + oy, r = o.r, n = Math.max(8, Math.round(r * 9));
        if (o.mv && o.mv.shape === "pend") {
          ctx.beginPath(); ctx.moveTo(o.x, o.y + o.mv.len); ctx.lineTo(x, y);
          ctx.lineWidth = 0.14; ctx.strokeStyle = "#8a6a3a"; ctx.stroke();
          ctx.lineWidth = 2 * lw; ctx.strokeStyle = "#ffd27a"; ctx.stroke();
          ctx.beginPath(); ctx.arc(o.x, o.y + o.mv.len, 0.22, 0, Math.PI * 2); ctx.fillStyle = "#ffc04a"; ctx.fill();
        }
        if (o.st === "rock") { this.drawRock(ctx, o, x, y, t, lw); break; }
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

  // ---------- expansion objects ----------
  // A thin rail shows where a moving block travels, so its path is never a surprise.
  Renderer.prototype.drawTrack = function (ctx, o, t, lw) {
    if (o.clip || !o.mv || o.mv.ay === 0 || o.mv.shape === "once") return;
    const a = Math.abs(o.mv.ay), cx = o.x + o.w / 2;
    ctx.fillStyle = hexA(this.pal.line, 0.22);
    ctx.fillRect(cx - 1.5 * lw, o.y - a, 3 * lw, o.h + 2 * a);
  };
  // Warning lamp on machinery: green while holding, amber just before it moves, white while moving.
  Renderer.prototype.drawLamp = function (ctx, o, bx, by, t, lw) {
    const mv = o.mv;
    let c = "#39ff88";
    if (mv.shape === "step") {
      let u = (t / mv.period + mv.phase) % 1; if (u < 0) u += 1;
      const g = mv.glide || 0.15, soon = 0.14;
      const moving = (u >= 0.5 - g && u < 0.5) || u >= 1 - g;
      const warn = (u >= 0.5 - g - soon && u < 0.5 - g) || (u >= 1 - g - soon && u < 1 - g);
      c = moving ? "#ffffff" : warn ? "#ffb02e" : "#39ff88";
    } else if (mv.shape === "once") {
      c = t < mv.t0 - 0.9 ? "#39ff88" : t < mv.t0 + mv.dur ? "#ffb02e" : "#ff4d5e";
    } else return;
    const cx = bx + o.w / 2, cy = Math.max(by + 0.45, Math.min(by + o.h - 0.45, o.clip ? (o.y > 0 ? by + 0.45 : by + o.h - 0.45) : by + o.h / 2));
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
    if (!this.fx.low) { ctx.shadowColor = c; ctx.shadowBlur = 10; }
    ctx.fillStyle = c; ctx.fillRect(-0.16, -0.16, 0.32, 0.32);
    ctx.shadowBlur = 0; ctx.lineWidth = 2 * lw; ctx.strokeStyle = "#0a0d18"; ctx.strokeRect(-0.16, -0.16, 0.32, 0.32);
    ctx.restore();
  };
  // Where a timed hazard is in its cycle: 0 idle, 1 charging, 2 firing, 3 cooling down. k = 0..1 inside that state.
  function timedState(o, t) {
    for (let i = 0; i < o.on.length; i++) {
      const a = o.on[i][0], b2 = o.on[i][1];
      if (t >= a && t < b2) return [2, (t - a) / (b2 - a)];
      if (t >= a - o.warn && t < a) return [1, (t - (a - o.warn)) / o.warn];
      if (t >= b2 && t < b2 + 0.4) return [3, (t - b2) / 0.4];
    }
    return [0, 0];
  }
  Renderer.timedState = timedState;
  const BEAM_COLORS = { boss: "#ff3b6b", sweep: "#ff4fd8" };
  Renderer.prototype.drawBeam = function (ctx, o, t, lw, ox, oy) {
    const st = timedState(o, t), x = o.x + ox, y = o.y + oy, w = o.w, h = o.h;
    const c = BEAM_COLORS[o.st] || "#ff5a36", horiz = w >= h, low = this.fx.low;
    // Emitters at both ends are always visible, so you know a beam lives here.
    ctx.fillStyle = "#1b1f33"; ctx.strokeStyle = hexA(c, 0.9); ctx.lineWidth = 2 * lw;
    if (horiz) { ctx.fillRect(x - 0.3, y + h / 2 - 0.3, 0.3, 0.6); ctx.strokeRect(x - 0.3, y + h / 2 - 0.3, 0.3, 0.6); ctx.fillRect(x + w, y + h / 2 - 0.3, 0.3, 0.6); ctx.strokeRect(x + w, y + h / 2 - 0.3, 0.3, 0.6); }
    else { ctx.fillRect(x + w / 2 - 0.3, y - 0.3, 0.6, 0.3); ctx.strokeRect(x + w / 2 - 0.3, y - 0.3, 0.6, 0.3); ctx.fillRect(x + w / 2 - 0.3, y + h, 0.6, 0.3); ctx.strokeRect(x + w / 2 - 0.3, y + h, 0.6, 0.3); }
    if (st[0] === 0) {
      ctx.setLineDash([0.25, 0.35]); ctx.strokeStyle = hexA(c, 0.22); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
      return;
    }
    if (st[0] === 1) {
      // Charging: the outline fills in and a thin targeting line brightens (a smooth ramp, no blinking).
      const k = st[1];
      ctx.fillStyle = hexA(c, 0.06 + 0.16 * k); ctx.fillRect(x, y, w, h);
      ctx.setLineDash([0.4, 0.25]); ctx.lineWidth = (2 + 2 * k) * lw; ctx.strokeStyle = hexA(c, 0.45 + 0.5 * k); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
      ctx.fillStyle = hexA("#ffffff", 0.25 + 0.6 * k);
      if (horiz) ctx.fillRect(x, y + h / 2 - lw, w * k, 2 * lw); else ctx.fillRect(x + w / 2 - lw, y, 2 * lw, h * k);
      return;
    }
    if (st[0] === 2) {
      if (!low) { ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 18; }
      ctx.fillStyle = hexA(c, 0.88); ctx.fillRect(x, y, w, h);
      if (!low) ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,.85)";
      if (horiz) ctx.fillRect(x, y + h * 0.35, w, h * 0.3); else ctx.fillRect(x + w * 0.35, y, w * 0.3, h);
      ctx.lineWidth = 2.5 * lw; ctx.strokeStyle = "#ffffff"; ctx.strokeRect(x, y, w, h);
      return;
    }
    // Cooling down: a fading, grey-tinted glow that can no longer hurt you.
    ctx.fillStyle = "rgba(200,200,220," + (0.35 * (1 - st[1])) + ")"; ctx.fillRect(x, y, w, h);
  };
  Renderer.prototype.drawPulse = function (ctx, o, t, lw) {
    const st = timedState(o, t), c = "#ff3b6b";
    ctx.beginPath(); ctx.arc(o.x, o.y, 0.18, 0, Math.PI * 2); ctx.fillStyle = hexA(c, 0.7); ctx.fill();
    if (st[0] === 1) {
      const k = st[1];
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.setLineDash([0.3, 0.2]); ctx.lineWidth = (2 + 2 * k) * lw; ctx.strokeStyle = hexA(c, 0.4 + 0.5 * k); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r * k, 0, Math.PI * 2); ctx.fillStyle = hexA(c, 0.15); ctx.fill();
    } else if (st[0] === 2) {
      if (!this.fx.low) { ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 20; }
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fillStyle = hexA(c, 0.85); ctx.fill();
      if (!this.fx.low) ctx.restore();
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.55, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fill();
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.lineWidth = 2.5 * lw; ctx.strokeStyle = "#fff"; ctx.stroke();
    } else if (st[0] === 3) {
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r * (1 + st[1] * 0.3), 0, Math.PI * 2); ctx.lineWidth = 3 * lw; ctx.strokeStyle = "rgba(220,220,240," + (0.5 * (1 - st[1])) + ")"; ctx.stroke();
    }
  };
  Renderer.prototype.drawCrystal = function (ctx, o, lw, pulse) {
    const p = o.pts, grid = o.st === "grid";
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (let k = 2; k < p.length; k += 2) ctx.lineTo(p[k], p[k + 1]);
    ctx.closePath();
    ctx.fillStyle = grid ? "rgba(46,8,30,.62)" : "#1a0630"; ctx.fill();
    ctx.lineJoin = "miter";
    if (o.edge != null) {
      // Tunnel pieces: only the side facing the open corridor glows, so joins between pieces stay quiet.
      ctx.lineWidth = 1.5 * lw; ctx.strokeStyle = hexA(grid ? "#ff4d6d" : "#ff7ae6", 0.18); ctx.stroke();
      const i = o.edge * 2, j = (i + 2) % p.length;
      ctx.beginPath(); ctx.moveTo(p[i], p[i + 1]); ctx.lineTo(p[j], p[j + 1]);
      ctx.lineCap = "round"; ctx.lineWidth = 3.5 * lw; ctx.strokeStyle = grid ? "#ff4d6d" : "#ff7ae6"; ctx.stroke();
      ctx.lineWidth = 1.2 * lw; ctx.strokeStyle = hexA("#ffffff", 0.45 + pulse * 0.25); ctx.stroke();
      ctx.lineCap = "butt";
      return;
    }
    ctx.lineWidth = 3 * lw; ctx.strokeStyle = grid ? "#ff4d6d" : "#ff7ae6"; ctx.stroke();
    ctx.lineWidth = lw; ctx.strokeStyle = hexA("#ffffff", 0.35 + pulse * 0.2); ctx.stroke();
  };
  Renderer.prototype.drawBossGate = function (ctx, o, t, lw, usedNow, v) {
    const y0 = this.cam.y - this.viewH / 2 - 1, y1 = this.cam.y + this.viewH / 2 + 1, c = usedNow ? "#8a7a40" : "#ffd23f";
    if (!this.fx.low && !usedNow) { ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 16; }
    ctx.fillStyle = hexA(c, usedNow ? 0.12 : 0.22); ctx.fillRect(o.x - 0.35, y0, 0.7, y1 - y0);
    ctx.fillStyle = c; ctx.fillRect(o.x - 0.35, y0, 0.1, y1 - y0); ctx.fillRect(o.x + 0.25, y0, 0.1, y1 - y0);
    if (!this.fx.low && !usedNow) ctx.restore();
    const k = this.fx.reduced ? 0 : (t * 2) % 1;
    for (let yy = Math.floor(y0) + k; yy < y1; yy += 1) {
      ctx.beginPath(); ctx.moveTo(o.x - 0.2, yy); ctx.lineTo(o.x, yy + 0.25); ctx.lineTo(o.x + 0.2, yy); ctx.lineWidth = 3 * lw; ctx.strokeStyle = hexA("#fff6c9", usedNow ? 0.2 : 0.7); ctx.stroke();
    }
  };
  Renderer.prototype.drawEnergy = function (ctx, o, x, y, t, lw) {
    const c = "#ff7a1a";
    if (!this.fx.low) { ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 14; }
    ctx.fillStyle = hexA(c, 0.85); ctx.fillRect(x, y, o.w, o.h);
    if (!this.fx.low) ctx.restore();
    ctx.fillStyle = "rgba(255,240,200,.9)"; ctx.fillRect(x, y + o.h * 0.4, o.w, o.h * 0.2);
    const k = this.fx.reduced ? 0 : (t * 3) % 1;
    ctx.fillStyle = "rgba(255,255,255,.55)";
    for (let xx = x + k; xx < x + o.w; xx += 1) ctx.fillRect(xx, y, 0.25, o.h);
    ctx.lineWidth = 2 * lw; ctx.strokeStyle = "#ffe0b0"; ctx.strokeRect(x, y, o.w, o.h);
    ctx.fillStyle = "#2a2230"; ctx.fillRect(x - 0.25, y - 0.15, 0.25, o.h + 0.3); ctx.fillRect(x + o.w, y - 0.15, 0.25, o.h + 0.3);
  };
  Renderer.prototype.drawShaft = function (ctx, o, x, y, lw) {
    const top = o.shaft, from = y + o.h;
    if (top <= from) return;
    const cx = x + o.w / 2;
    ctx.fillStyle = "#5a4630"; ctx.fillRect(cx - 0.18, from, 0.36, top - from);
    ctx.fillStyle = "#c8994a"; ctx.fillRect(cx - 0.06, from, 0.12, top - from);
  };
  Renderer.prototype.drawRock = function (ctx, o, x, y, t, lw) {
    const r = o.r, n = 9, seed = Math.round(o.x * 13 + o.y * 7);
    ctx.save(); ctx.translate(x, y); ctx.rotate(this.fx.reduced ? 0 : t * 0.6 * (hash(seed) - 0.5));
    ctx.beginPath();
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, rr = r * (0.86 + 0.14 * hash(seed + k)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = "#3d2c2a"; ctx.fill();
    ctx.lineWidth = 3 * lw; ctx.strokeStyle = "#ff8a4a"; ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.fillStyle = "#2a1c1c"; ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.25, r * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
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
    if (style === "Bubbles") {
      for (let i = 1; i < n; i++) { const k = i / n; ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.lineCap = "round"; ctx.strokeStyle = hexA("#7fe9ff", k * 0.35); ctx.lineWidth = 0.3 * k; ctx.stroke(); }
      if (Math.random() < 0.45 && !this.fx.reduced) this.emit(1, tr[n - 1].x - 0.4, tr[n - 1].y, { speed: 0.5, vy: 1.6, life: 0.8, size: 0.2, colors: ["#bff6ff", c2, "#ffffff"], kind: 3, jitter: 0.4 });
      return;
    }
    if (style === "Prismatic") {
      const cols = ["#ff4fd8", "#ffe14d", "#2de2ff"];
      for (let j = 0; j < 3; j++) for (let i = 1; i < n; i++) {
        const k = i / n, off = (j - 1) * 0.16 * k;
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y + off); ctx.lineTo(tr[i].x, tr[i].y + off);
        ctx.lineCap = "round"; ctx.strokeStyle = hexA(cols[j], k * 0.75); ctx.lineWidth = 0.13 * k + 0.02; ctx.stroke();
      }
      if (Math.random() < 0.25 && !this.fx.reduced) this.emit(1, tr[n - 1].x - 0.3, tr[n - 1].y, { speed: 0.6, life: 0.4, size: 0.14, colors: ["#ffffff", "#c9b8ff"], kind: 2, jitter: 0.5 });
      return;
    }
    if (style === "Solar Flare") {
      for (let i = 1; i < n; i++) {
        const k = i / n;
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(255," + Math.round(90 + 140 * k) + "," + Math.round(30 * k) + "," + (k * 0.8) + ")"; ctx.lineWidth = 0.85 * k; ctx.stroke();
      }
      if (Math.random() < 0.5 && !this.fx.reduced) this.emit(1, tr[n - 1].x - 0.4, tr[n - 1].y, { speed: 1.2, vx: -1, life: 0.45, size: 0.15, colors: ["#ffd23f", "#ff9a2e", "#ff4d1a"], kind: 1, jitter: 0.5 });
      return;
    }
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
      else if (p.kind === 3) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + (1 - k) * 0.6), 0, Math.PI * 2); ctx.lineWidth = 0.04; ctx.strokeStyle = p.color; ctx.stroke(); }
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
        block: { t: "block", x: -0.8, y: -0.8, w: 1.6, h: 1.6 },
        beam: { t: "beam", x: -0.9, y: -0.3, w: 1.8, h: 0.6, on: [[0, 1]], warn: 0.5 },
        pulse: { t: "pulse", x: 0, y: 0, r: 0.75, on: [[1, 2]], warn: 1 },
        mover: { t: "block", x: -0.6, y: -0.8, w: 1.2, h: 1.6, mv: { ax: 0, ay: 0, period: 2, phase: 0.25, shape: "step", glide: 0.15 } },
        crys: { t: "crys", pts: [-0.9, -0.8, 0.9, -0.8, 0.9, 0.2, -0.9, 0.8] },
        bgate: { t: "bgate", x: 0, y: 0 }
      })[kind];
      if (o && o.t === "bgate") { ctx.fillStyle = "#ffd23f"; ctx.fillRect(-0.4, -1, 0.12, 2); ctx.fillRect(0.28, -1, 0.12, 2); ctx.fillStyle = "rgba(255,210,63,.3)"; ctx.fillRect(-0.4, -1, 0.8, 2); ctx.restore(); return; }
      if (o && o.t === "portal") ctx.scale(0.7, 0.7);
      const P2 = Renderer.prototype;
      if (o) P2.drawObj.call(Object.assign(fake, { drawPortal: P2.drawPortal, drawBeam: P2.drawBeam, drawPulse: P2.drawPulse, drawCrystal: P2.drawCrystal, drawTrack: P2.drawTrack, drawLamp: P2.drawLamp, cam: { y: 0 }, viewH: 2 }), ctx, o, kind === "beam" ? 0.5 : kind === "pulse" ? 0.6 : now || 0, [], {}, lw, 0);
    }
    ctx.restore();
  };

  GR.Renderer = Renderer;
  GR.COLORS = { MODE: MODE_COLORS, PAD: PAD_COLORS };
})();
