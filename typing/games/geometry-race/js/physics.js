/* =========================================================
   Geometry Race — physics, collision, and the level solver
   Pure simulation: no drawing, sound, or page code lives here.
   Everything runs on a fixed 1/240-second tick, so a jump is
   exactly the same on a Chromebook, a phone, or a 144 Hz monitor.
   Units are blocks (1 block = one grid square). y points up.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};

  const TICK = 1 / 240;
  const SPEEDS = [8.4, 10.4, 12.96, 15.6];          // blocks per second
  const SPEED_NAMES = ["Slow", "Normal", "Fast", "Very fast"];
  const PRESS_BUFFER = 0.08;   // a press this early still counts when you land
  const ORB_BUFFER = 0.05;     // a press this early still counts when you touch an orb
  const SNAP = 0.24;           // corner forgiveness when landing on / bumping a surface
  const EPS = 1e-6;
  const HAZ = 0.7;             // the player's box is shrunk to 70% for spikes, saws, and red walls
  const MINI = 0.6;
  const KILL_LOW = -2.6, KILL_HIGH = 60;

  // Movement settings for each mode (normal size).
  const MODE = {
    cube:  { w: 1,    h: 1,    g: 88, jump: 19.4, maxFall: 26, pad: 27, pink: 14, orb: 19.4 },
    ship:  { w: 1,    h: 0.72, up: 58, down: 50, maxUp: 10.5, maxFall: 11, pad: 12, pink: 7, orb: 11 },
    ball:  { w: 1,    h: 1,    g: 62, maxFall: 20, kick: 5, pad: 20, pink: 11, orb: 15 },
    ufo:   { w: 1,    h: 0.82, g: 50, hop: 13, maxFall: 14, pad: 17, pink: 10, orb: 15 },
    wave:  { w: 0.56, h: 0.56, slope: 1, pad: 0, pink: 0, orb: 0 },
    robot: { w: 1,    h: 1,    g: 88, boost: 12, boostMax: 0.22, maxFall: 26, pad: 27, pink: 14, orb: 19.4 }
  };
  const MODE_NAMES = ["cube", "ship", "ball", "ufo", "wave", "robot"];

  // Event bits a step can report (used for sound and particles).
  const EV = { JUMP: 1, LAND: 2, ORB: 4, PAD: 8, PORTAL: 16, TOKEN: 32, DIE: 64, WIN: 128, FLIP: 256 };

  function dims(s) {
    const m = MODE[s.mode], k = s.mini ? MINI : 1;
    return { w: m.w * k, h: m.h * k };
  }

  // ---------- geometry helpers ----------
  // Spike hitbox triangles inside a 1×1 cell (pointing up). Slightly smaller than the drawing.
  const TRI_BIG = [0.15, 0, 0.85, 0, 0.5, 0.86];
  const TRI_SMALL = [0.17, 0, 0.83, 0, 0.5, 0.42];
  function rotPt(x, y, rot) {
    if (rot === 1) return [1 - y, x];       // points left
    if (rot === 2) return [1 - x, 1 - y];   // points down
    if (rot === 3) return [y, 1 - x];       // points right
    return [x, y];
  }
  function spikeTri(o) {
    const src = o.small ? TRI_SMALL : TRI_BIG, out = [];
    for (let i = 0; i < 6; i += 2) {
      const p = rotPt(src[i], src[i + 1], o.rot);
      out.push(o.x + p[0], o.y + p[1]);
    }
    return out;
  }
  function triBox(t, dx, dy, x0, y0, x1, y1) {
    const ax = t[0] + dx, ay = t[1] + dy, bx = t[2] + dx, by = t[3] + dy, cx = t[4] + dx, cy = t[5] + dy;
    if (Math.max(ax, bx, cx) <= x0 || Math.min(ax, bx, cx) >= x1) return false;
    if (Math.max(ay, by, cy) <= y0 || Math.min(ay, by, cy) >= y1) return false;
    const P = [ax, ay, bx, by, cx, cy];
    for (let i = 0; i < 3; i++) {
      const px = P[i * 2], py = P[i * 2 + 1], qx = P[((i + 1) % 3) * 2], qy = P[((i + 1) % 3) * 2 + 1];
      const nx = -(qy - py), ny = qx - px;
      let tmin = Infinity, tmax = -Infinity;
      for (let j = 0; j < 3; j++) { const d = P[j * 2] * nx + P[j * 2 + 1] * ny; if (d < tmin) tmin = d; if (d > tmax) tmax = d; }
      const c1 = x0 * nx + y0 * ny, c2 = x1 * nx + y0 * ny, c3 = x0 * nx + y1 * ny, c4 = x1 * nx + y1 * ny;
      const bmin = Math.min(c1, c2, c3, c4), bmax = Math.max(c1, c2, c3, c4);
      if (bmax <= tmin || bmin >= tmax) return false;
    }
    return true;
  }
  function circleBox(cx, cy, r, x0, y0, x1, y1) {
    const qx = cx < x0 ? x0 : cx > x1 ? x1 : cx, qy = cy < y0 ? y0 : cy > y1 ? y1 : cy;
    const dx = cx - qx, dy = cy - qy;
    return dx * dx + dy * dy < r * r;
  }
  // Moving hazards follow a sine path tied to the level clock (so every attempt matches).
  function moveOffset(mv, t) {
    if (!mv) return null;
    const a = Math.sin(2 * Math.PI * (t / mv.period + mv.phase));
    return [mv.ax * a, mv.ay * a];
  }

  // ---------- compiling level data into collision lists ----------
  const CELL = 4, ORIGIN = 40;
  function cellOf(x) { return Math.max(0, Math.floor((x + ORIGIN) / CELL)); }

  function compile(def) {
    const L = {
      id: def.id, endX: def.endX, solids: [], hazards: [], triggers: [], tokens: [],
      zones: def.zones.slice(), startMode: def.startMode || "cube", startSpeed: def.startSpeed == null ? 1 : def.startSpeed,
      startY: def.startY || 0, def: def
    };
    // Ground: solid everywhere except pits.
    const pits = def.pits.slice().sort(function (a, b) { return a[0] - b[0]; });
    let gx = -ORIGIN;
    pits.forEach(function (p) {
      if (p[0] > gx) L.solids.push({ x0: gx, y0: -40, x1: p[0], y1: 0, k: "g" });
      gx = Math.max(gx, p[1]);
    });
    L.solids.push({ x0: gx, y0: -40, x1: def.endX + 80, y1: 0, k: "g" });
    // Zones: a safe floor and ceiling while flying, rolling, or upside down.
    def.zones.forEach(function (z) {
      if (z.lo > 0) L.solids.push({ x0: z.x0, y0: z.lo - 40, x1: z.x1, y1: z.lo, k: "z" });
      L.solids.push({ x0: z.x0, y0: z.hi, x1: z.x1, y1: z.hi + 40, k: "z" });
    });
    def.objects.forEach(function (o) {
      switch (o.t) {
        case "block": L.solids.push({ x0: o.x, y0: o.y, x1: o.x + o.w, y1: o.y + o.h, k: "b" }); break;
        case "spike": L.hazards.push({ type: "spike", tri: spikeTri(o), mv: o.mv || null, src: o }); break;
        case "saw": L.hazards.push({ type: "saw", cx: o.x, cy: o.y, r: o.r * 0.84, mv: o.mv || null, src: o }); break;
        case "haz": L.hazards.push({ type: "haz", x0: o.x + 0.04, y0: o.y + 0.04, x1: o.x + o.w - 0.04, y1: o.y + o.h - 0.04, mv: o.mv || null, src: o }); break;
        case "pad": case "orb": case "portal": case "token": {
          const tr = Object.assign({ id: L.triggers.length }, o);
          if (o.t === "pad") {
            tr.x0 = o.x + 0.1; tr.x1 = o.x + 0.9;
            if (o.rot === 2) { tr.y0 = o.y + 0.62; tr.y1 = o.y + 1; } else { tr.y0 = o.y; tr.y1 = o.y + 0.38; }
          } else if (o.t === "portal") {
            tr.x0 = o.x - 0.45; tr.x1 = o.x + 0.45; tr.y0 = o.y - 1.5; tr.y1 = o.y + 1.5;
            // Speed portals work at any height so the music always lines up.
            if (o.k === "speed") { tr.y0 = -100; tr.y1 = 200; }
          } else if (o.t === "orb") {
            tr.r = 0.85;
          } else {
            tr.r = 0.62; tr.n = L.tokens.length; L.tokens.push(tr);
          }
          L.triggers.push(tr); break;
        }
      }
    });
    // Broad-phase grid so each tick only looks at nearby objects.
    function index(list, ext) {
      const cells = [];
      list.forEach(function (o, i) {
        const e = ext(o), a = cellOf(e[0]), b = cellOf(e[1]);
        for (let c = a; c <= b; c++) (cells[c] || (cells[c] = [])).push(i);
      });
      return cells;
    }
    function mvPad(o) { return o.mv ? Math.abs(o.mv.ax) : 0; }
    L.gSolids = index(L.solids, function (o) { return [o.x0, o.x1]; });
    L.gHaz = index(L.hazards, function (o) {
      const m = mvPad(o);
      if (o.type === "spike") return [Math.min(o.tri[0], o.tri[2], o.tri[4]) - m, Math.max(o.tri[0], o.tri[2], o.tri[4]) + m];
      if (o.type === "saw") return [o.cx - o.r - m, o.cx + o.r + m];
      return [o.x0 - m, o.x1 + m];
    });
    L.gTrig = index(L.triggers, function (o) { return o.r ? [o.x - o.r, o.x + o.r] : [o.x0, o.x1]; });
    L.seen = new Uint32Array(Math.max(L.solids.length, L.hazards.length, L.triggers.length) + 1);
    L.stamp = 0;
    return L;
  }

  function near(L, grid, x, reach, fn) {
    const a = cellOf(x - reach), b = cellOf(x + reach);
    const stamp = ++L.stamp;
    for (let c = a; c <= b; c++) {
      const list = grid[c];
      if (!list) continue;
      for (let i = 0; i < list.length; i++) {
        const id = list[i];
        if (L.seen[id] === stamp) continue;
        L.seen[id] = stamp;
        if (fn(id) === false) return;
      }
    }
  }

  // ---------- state ----------
  function newState(L) {
    const m = MODE[L.startMode];
    return {
      x: 0, y: L.startY + m.h / 2, vy: 0, vx: SPEEDS[L.startSpeed], speed: L.startSpeed,
      mode: L.startMode, gs: 1, mini: false, grounded: true, ceil: false,
      t: 0, tick: 0, pbuf: 0, obuf: 0, held: false, rb: 0,
      used: new Uint8Array(L.triggers.length), uh: 0, tk: 0,
      dead: false, won: false, ev: 0, px: 0, py: L.startY + m.h / 2,
      lastPortal: null, lastToken: -1, hz: HAZ
    };
  }
  function clone(s) {
    const c = Object.assign({}, s);
    c.used = s.used.slice();
    return c;
  }
  function useTrig(s, id) { s.used[id] = 1; s.uh = (s.uh + (id + 1) * 7919) % 1000003; }

  function setMode(s, mode) {
    if (mode === s.mode) return;
    const before = dims(s), feet = s.y - s.gs * before.h / 2, wasGrounded = s.grounded;
    let vl = s.vy * s.gs;
    s.mode = mode; s.rb = 0;
    const M = MODE[mode];
    if (mode === "ship") vl = Math.max(-M.maxFall, Math.min(M.maxUp, vl * 0.5));
    else if (mode === "ufo") vl = Math.max(-M.maxFall, Math.min(M.hop, vl * 0.5));
    else if (mode === "ball") vl = Math.max(-M.maxFall, vl * 0.5);
    else if (mode === "wave") vl = 0;
    else vl = Math.max(-M.maxFall, vl);
    s.vy = vl * s.gs;
    const after = dims(s);
    if (wasGrounded) s.y = feet + s.gs * after.h / 2;
  }
  function setMini(s, mini) {
    if (mini === s.mini) return;
    const before = dims(s), feet = s.y - s.gs * before.h / 2;
    s.mini = mini;
    const after = dims(s);
    if (s.grounded) s.y = feet + s.gs * after.h / 2;
  }
  function flipGravity(s, newGs, vlAfter) {
    if (newGs === s.gs) return false;
    s.gs = newGs; s.grounded = false;
    if (vlAfter != null) s.vy = vlAfter * s.gs;
    return true;
  }

  // ---------- one tick ----------
  // press: the button went down this tick. held: the button is down at the end of this tick.
  function step(s, L, press, held) {
    const dt = TICK;
    s.ev = 0;
    s.t += dt; s.tick++;
    if (press) { s.pbuf = PRESS_BUFFER; s.obuf = ORB_BUFFER; }
    else { s.pbuf = s.pbuf > dt ? s.pbuf - dt : 0; s.obuf = s.obuf > dt ? s.obuf - dt : 0; }
    s.held = held;
    const M = MODE[s.mode], k = s.mini ? MINI : 1;
    let d = dims(s), hw = d.w / 2, hh = d.h / 2;
    let vl = s.vy * s.gs;

    // Orbs: a deliberate press while touching one.
    if (s.obuf > 0 && M.orb > 0) {
      let hit = -1;
      near(L, L.gTrig, s.x, 2, function (id) {
        const o = L.triggers[id];
        if (o.t !== "orb" || s.used[id]) return;
        if (circleBox(o.x, o.y, o.r, s.x - hw, s.y - hh, s.x + hw, s.y + hh)) { hit = id; return false; }
      });
      if (hit >= 0) {
        const o = L.triggers[hit];
        useTrig(s, hit);
        s.obuf = 0; s.pbuf = 0; s.grounded = false; s.rb = 0;
        if (o.kind === "blue") { flipGravity(s, -s.gs, null); vl = s.mode === "ship" ? -4 : -8; s.ev |= EV.FLIP; }
        else vl = (o.kind === "pink" ? M.pink : M.orb) * k * (o.kind === "pink" ? 1 : 1);
        s.ev |= EV.ORB;
      }
    }

    // Mode movement.
    switch (s.mode) {
      case "cube":
        if (s.grounded && (s.pbuf > 0 || held)) { vl = M.jump * (s.mini ? 0.88 : 1); s.grounded = false; s.pbuf = 0; s.ev |= EV.JUMP; }
        else { vl -= M.g * dt; if (vl < -M.maxFall) vl = -M.maxFall; }
        break;
      case "ship":
        vl += (held ? M.up : -M.down) * dt;
        if (vl > M.maxUp) vl = M.maxUp; if (vl < -M.maxFall) vl = -M.maxFall;
        break;
      case "ball":
        if (s.grounded && s.pbuf > 0) {
          s.gs = -s.gs; s.grounded = false; s.pbuf = 0; vl = -M.kick; s.ev |= EV.FLIP | EV.JUMP;
        } else { vl -= M.g * dt; if (vl < -M.maxFall) vl = -M.maxFall; }
        break;
      case "ufo":
        if (s.pbuf > 0 && press) { vl = M.hop * (s.mini ? 0.88 : 1); s.pbuf = 0; s.grounded = false; s.ev |= EV.JUMP; }
        else { vl -= M.g * dt; if (vl < -M.maxFall) vl = -M.maxFall; }
        break;
      case "wave": {
        const sl = (s.mini ? 2 : 1) * s.vx;
        vl = held ? sl : -sl;
        break;
      }
      case "robot":
        if (s.grounded && (s.pbuf > 0 || held)) {
          vl = M.boost * (s.mini ? 0.88 : 1); s.rb = M.boostMax; s.grounded = false; s.pbuf = 0; s.ev |= EV.JUMP;
        } else if (s.rb > 0 && held) {
          vl = M.boost * (s.mini ? 0.88 : 1); s.rb -= dt;
        } else {
          s.rb = 0; vl -= M.g * dt; if (vl < -M.maxFall) vl = -M.maxFall;
        }
        break;
    }
    s.vy = vl * s.gs;

    // Move.
    s.px = s.x; s.py = s.y;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // Solid surfaces.
    const wasGrounded = s.grounded, fallSpeed = -vl;
    s.grounded = false; s.ceil = false;
    const canCeil = s.mode === "ship" || s.mode === "ufo" || s.mode === "ball" || s.mode === "wave";
    near(L, L.gSolids, s.x, hw + 1, function (id) {
      const r = L.solids[id];
      if (!(s.x + hw > r.x0 + EPS && s.x - hw < r.x1 - EPS && s.y + hh > r.y0 + EPS && s.y - hh < r.y1 - EPS)) return;
      const gs = s.gs;
      const feet = s.y - gs * hh, head = s.y + gs * hh;
      const surfF = gs > 0 ? r.y1 : r.y0, surfH = gs > 0 ? r.y0 : r.y1;
      const dF = (surfF - feet) * gs, dH = (head - surfH) * gs;
      const v = s.vy * gs;
      if (v <= 0 && dF <= Math.max(SNAP, -v * dt + 0.02)) {
        s.y = surfF + gs * hh; s.vy = 0; s.grounded = true;
      } else if (v >= 0 && dH <= Math.max(SNAP, v * dt + 0.02)) {
        if (canCeil || r.k === "z") { s.y = surfH - gs * hh; s.vy = 0; s.ceil = true; if (s.mode === "robot") s.rb = 0; }
        else { s.dead = true; return false; }
      } else { s.dead = true; return false; }
    });
    if (s.dead) { s.ev |= EV.DIE; return s; }
    if (s.grounded && !wasGrounded && fallSpeed > 6) s.ev |= EV.LAND;

    // Hazards.
    const hzw = hw * s.hz, hzh = hh * s.hz;
    const bx0 = s.x - hzw, by0 = s.y - hzh, bx1 = s.x + hzw, by1 = s.y + hzh;
    near(L, L.gHaz, s.x, 3, function (id) {
      const h = L.hazards[id];
      const off = h.mv ? moveOffset(h.mv, s.t) : null, ox = off ? off[0] : 0, oy = off ? off[1] : 0;
      let hit = false;
      if (h.type === "spike") hit = triBox(h.tri, ox, oy, bx0, by0, bx1, by1);
      else if (h.type === "saw") hit = circleBox(h.cx + ox, h.cy + oy, h.r, bx0, by0, bx1, by1);
      else hit = bx1 > h.x0 + ox && bx0 < h.x1 + ox && by1 > h.y0 + oy && by0 < h.y1 + oy;
      if (hit) { s.dead = true; return false; }
    });
    if (s.dead) { s.ev |= EV.DIE; return s; }

    // Pads, portals, tokens.
    d = dims(s); hw = d.w / 2; hh = d.h / 2;
    near(L, L.gTrig, s.x, 2, function (id) {
      if (s.used[id]) return;
      const o = L.triggers[id];
      if (o.t === "orb") return;
      if (o.t === "token") {
        if (circleBox(o.x, o.y, o.r, s.x - hw, s.y - hh, s.x + hw, s.y + hh)) { useTrig(s, id); s.tk |= 1 << o.n; s.lastToken = o.n; s.ev |= EV.TOKEN; }
        return;
      }
      if (!(s.x + hw > o.x0 && s.x - hw < o.x1 && s.y + hh > o.y0 && s.y - hh < o.y1)) return;
      useTrig(s, id);
      const MM = MODE[s.mode], kk = s.mini ? MINI : 1;
      if (o.t === "pad") {
        if (MM.pad <= 0) return;
        s.grounded = false; s.rb = 0; s.pbuf = 0;
        if (o.kind === "blue") { flipGravity(s, -s.gs, s.mode === "ship" ? -4 : -9); s.ev |= EV.FLIP; }
        else s.vy = (o.kind === "pink" ? MM.pink : MM.pad) * kk * s.gs;
        s.ev |= EV.PAD;
      } else if (o.t === "portal") {
        s.lastPortal = o; s.ev |= EV.PORTAL;
        if (o.k === "mode") setMode(s, o.v);
        else if (o.k === "grav") { if (flipGravity(s, o.v === "up" ? -1 : 1, -(s.vy * s.gs) * 0.5)) s.ev |= EV.FLIP; }
        else if (o.k === "speed") { s.speed = o.v; s.vx = SPEEDS[o.v]; }
        else if (o.k === "size") setMini(s, o.v === "mini");
        d = dims(s); hw = d.w / 2; hh = d.h / 2;
      }
    });

    if (s.y < KILL_LOW || s.y > KILL_HIGH) { s.dead = true; s.ev |= EV.DIE; return s; }
    if (s.x >= L.endX) { s.won = true; s.ev |= EV.WIN; }
    return s;
  }

  // ---------- running a list of inputs (decisions) ----------
  // decisions: array of 0/1, one per D ticks. Returns the final state.
  function replay(L, decisions, D, start, opts) {
    const s = start ? clone(start) : newState(L);
    if (opts && opts.hz) s.hz = opts.hz;
    let prev = start ? (start.held ? 1 : 0) : 0;
    for (let i = 0; i < decisions.length && !s.dead && !s.won; i++) {
      const h = decisions[i];
      for (let j = 0; j < D && !s.dead && !s.won; j++) {
        step(s, L, j === 0 && h && !prev, !!h);
        if (opts && opts.onTick) opts.onTick(s);
      }
      prev = h;
    }
    return s;
  }

  // ---------- solver ----------
  // Depth-first search over "hold / don't hold" every D ticks, remembering states it has
  // already tried. Used by the tests (to prove a level can be beaten) and by practice mode
  // (to refuse a checkpoint that would leave you no way to survive).
  // opts: D, hz (hazard box size), maxTicks (stop early = success), needTokens (bitmask), budget
  function solve(L, start, opts) {
    opts = opts || {};
    const D = opts.D || 8, budget = opts.budget || 4e6;
    const s0 = start ? clone(start) : newState(L);
    if (opts.hz) s0.hz = opts.hz;
    const endTick = opts.maxTicks ? s0.tick + opts.maxTicks : Infinity;
    const need = opts.needTokens || 0;
    const tokX = L.tokens.map(function (t) { return t.x; });
    const visited = new Set();
    let work = 0;
    const stack = [{ s: s0, next: 0, prev: s0.held ? 1 : 0, choice: s0.held ? 1 : 0 }];
    function key(s, h) {
      return (s.tick / D | 0) + "|" + Math.round(s.y * 25) + "|" + Math.round(s.vy * 3) + "|" + s.mode + s.gs + (s.mini ? 1 : 0) + h +
        "|" + Math.round(s.rb * 200) + "|" + s.uh + "|" + (need ? s.tk : 0) + "|" + (s.grounded ? 1 : 0);
    }
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top.next >= 2) { stack.pop(); continue; }
      const choice = top.next === 0 ? top.prev : 1 - top.prev;   // try "keep doing the same thing" first
      top.next++;
      const s = clone(top.s);
      let ok = true;
      for (let j = 0; j < D; j++) {
        step(s, L, j === 0 && choice === 1 && top.prev === 0, choice === 1);
        work++;
        if (s.dead) { ok = false; break; }
        if (s.won || s.tick >= endTick) break;
      }
      if (!ok) continue;
      if (opts.avoidToken != null && (s.tk >> opts.avoidToken) & 1) continue;
      if (need) {
        let miss = false;
        for (let i = 0; i < tokX.length; i++) if ((need & (1 << i)) && !(s.tk & (1 << i)) && s.x > tokX[i] + 3) miss = true;
        if (miss) continue;
      }
      if (s.won || s.tick >= endTick) {
        if (need && s.won && (s.tk & need) !== need) continue;
        const path = stack.slice(1).map(function (f) { return f.choice; });
        path.push(choice);
        return { ok: true, decisions: path, D: D, end: s, work: work };
      }
      const kk = key(s, choice);
      if (visited.has(kk)) continue;
      visited.add(kk);
      if (work > budget) return { ok: false, budget: true, x: s.x, work: work };
      stack.push({ s: s, next: 0, prev: choice, choice: choice });
    }
    let far = 0;
    return { ok: false, work: work, far: far };
  }

  // Furthest x the solver can reach (for reporting where a level is impossible).
  function furthest(L, opts) {
    opts = opts || {};
    const D = opts.D || 8;
    const s0 = newState(L);
    if (opts.hz) s0.hz = opts.hz;
    const visited = new Set();
    let best = 0, work = 0;
    const stack = [{ s: s0, next: 0, prev: 0 }];
    while (stack.length && work < (opts.budget || 3e6)) {
      const top = stack[stack.length - 1];
      if (top.next >= 2) { stack.pop(); continue; }
      const choice = top.next === 0 ? top.prev : 1 - top.prev;
      top.next++;
      const s = clone(top.s);
      let ok = true;
      for (let j = 0; j < D; j++) { step(s, L, j === 0 && choice && !top.prev, !!choice); work++; if (s.dead) { ok = false; break; } if (s.won) break; }
      if (!ok) continue;
      if (s.x > best) best = s.x;
      if (s.won) return { won: true, x: s.x };
      const kk = (s.tick / D | 0) + "|" + Math.round(s.y * 25) + "|" + Math.round(s.vy * 3) + "|" + s.mode + s.gs + (s.mini ? 1 : 0) + choice + "|" + Math.round(s.rb * 200) + "|" + s.uh + (s.grounded ? 1 : 0);
      if (visited.has(kk)) continue;
      visited.add(kk);
      stack.push({ s: s, next: 0, prev: choice });
    }
    return { won: false, x: best };
  }

  // Time (seconds) at which the player reaches x, given the level's speed portals.
  // Horizontal motion never depends on input, so this is exact.
  function timeAtX(def, x) {
    let t = 0, cx = 0, sp = def.startSpeed == null ? 1 : def.startSpeed;
    const ports = def.speedMarks;
    for (let i = 0; i < ports.length; i++) {
      const p = ports[i];
      if (p.x >= x) break;
      t += (p.x - cx) / SPEEDS[sp]; cx = p.x; sp = p.v;
    }
    return t + (x - cx) / SPEEDS[sp];
  }

  GR.Physics = {
    TICK: TICK, SPEEDS: SPEEDS, SPEED_NAMES: SPEED_NAMES, MODE: MODE, MODE_NAMES: MODE_NAMES, MINI: MINI, EV: EV, HAZ: HAZ,
    compile: compile, newState: newState, clone: clone, step: step, replay: replay, solve: solve, furthest: furthest,
    dims: dims, moveOffset: moveOffset, spikeTri: spikeTri, timeAtX: timeAtX, near: near
  };
})();
