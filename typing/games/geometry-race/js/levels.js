/* =========================================================
   Geometry Race — level data
   Every level is hand-placed with the helpers below. Positions
   are in blocks; b.X(beat) turns a music beat into a position so
   obstacles land on the beat (speed changes are counted for you).
   b.J(beat) = where to put a spike so jumping ON that beat clears it.
   ========================================================= */
(function () {
  "use strict";
  const GR = window.GR = window.GR || {};
  const SPEEDS = GR.Physics.SPEEDS;

  function Builder(meta) {
    this.meta = meta;
    this.o = []; this.zones = []; this.pits = [];
    this.speedPlan = (meta.speeds || []).slice().sort(function (a, b) { return a[0] - b[0]; });
    this.start = meta.startSpeed == null ? 1 : meta.startSpeed;
  }
  Builder.prototype = {
    bpb: function (sp) { return SPEEDS[sp] * 60 / this.meta.bpm; },
    X: function (beat) {
      let x = 0, b = 0, sp = this.start;
      for (let i = 0; i < this.speedPlan.length; i++) {
        const p = this.speedPlan[i];
        if (p[0] >= beat) break;
        x += (p[0] - b) * this.bpb(sp); b = p[0]; sp = p[1];
      }
      return x + (beat - b) * this.bpb(sp);
    },
    speedAt: function (beat) {
      let sp = this.start;
      for (let i = 0; i < this.speedPlan.length; i++) if (this.speedPlan[i][0] <= beat) sp = this.speedPlan[i][1];
      return sp;
    },
    // Spike group of n placed so a jump ON this beat passes right over its middle.
    J: function (beat, n) { return this.X(beat) + SPEEDS[this.speedAt(beat)] * 0.221 - (n || 1) / 2; },
    // A wall across a flying section with an opening from gLo to gHi.
    // Spikes line the opening's edges when spikes is true. Use haz=true for red walls (wave sections).
    gate: function (x, w, lo, hi, gLo, gHi, spikes, haz) {
      const f = haz ? this.haz.bind(this) : this.blk.bind(this);
      if (gLo > lo) { f(x, lo, w, gLo - lo); if (spikes && !haz) this.sps(x, w, gLo); }
      if (gHi < hi) { f(x, gHi, w, hi - gHi); if (spikes && !haz) this.csps(x, w, gHi); }
      return this;
    },
    mv: function (ax, ay, beats, phase) { return { ax: ax, ay: ay, period: beats * 60 / this.meta.bpm, phase: phase || 0 }; },
    add: function (o) { this.o.push(o); return this; },
    sp: function (x, y, mv) { return this.add({ t: "spike", x: x, y: y || 0, rot: 0, mv: mv }); },
    sps: function (x, n, y) { for (let i = 0; i < n; i++) this.sp(x + i, y || 0); return this; },
    small: function (x, y) { return this.add({ t: "spike", x: x, y: y || 0, rot: 0, small: true }); },
    smalls: function (x, n, y) { for (let i = 0; i < n; i++) this.small(x + i, y || 0); return this; },
    // Ceiling spike hanging down from a surface at height y.
    csp: function (x, y, mv) { return this.add({ t: "spike", x: x, y: y - 1, rot: 2, mv: mv }); },
    csps: function (x, n, y) { for (let i = 0; i < n; i++) this.csp(x + i, y); return this; },
    csmall: function (x, y) { return this.add({ t: "spike", x: x, y: y - 1, rot: 2, small: true }); },
    csmalls: function (x, n, y) { for (let i = 0; i < n; i++) this.csmall(x + i, y); return this; },
    blk: function (x, y, w, h) { return this.add({ t: "block", x: x, y: y, w: w, h: h }); },
    haz: function (x, y, w, h, mv) { return this.add({ t: "haz", x: x, y: y, w: w, h: h, mv: mv }); },
    saw: function (x, y, r, mv) { return this.add({ t: "saw", x: x, y: y, r: r, mv: mv }); },
    pad: function (x, y, kind) { return this.add({ t: "pad", x: x, y: y || 0, kind: kind || "yellow", rot: 0 }); },
    cpad: function (x, y, kind) { return this.add({ t: "pad", x: x, y: y - 1, kind: kind || "yellow", rot: 2 }); },
    orb: function (x, y, kind) { return this.add({ t: "orb", x: x, y: y, kind: kind || "yellow" }); },
    portal: function (x, y, k, v) { return this.add({ t: "portal", x: x, y: y, k: k, v: v }); },
    mode: function (x, y, m) { return this.portal(x, y, "mode", m); },
    grav: function (x, y, dir) { return this.portal(x, y, "grav", dir); },
    size: function (x, y, v) { return this.portal(x, y, "size", v); },
    token: function (x, y) { return this.add({ t: "token", x: x, y: y }); },
    text: function (x, y, s) { return this.add({ t: "text", x: x, y: y, s: s }); },
    pit: function (x0, x1) { this.pits.push([x0, x1]); return this; },
    zone: function (x0, x1, lo, hi) { this.zones.push({ x0: x0, x1: x1, lo: lo, hi: hi }); return this; },
    finish: function () {
      const self = this, m = this.meta;
      const endX = this.X(m.endBeat);
      const speedMarks = this.speedPlan.map(function (p) { return { x: self.X(p[0]), v: p[1], y: p[2] == null ? 1.5 : p[2] }; });
      // Speed portals are drawn where the plan says and work at any height, so the music timing never changes.
      speedMarks.forEach(function (p) { self.o.push({ t: "portal", x: p.x, y: p.y, k: "speed", v: p.v, tall: true }); });
      return Object.assign({}, m, {
        objects: this.o, zones: this.zones, pits: this.pits, endX: endX, speedMarks: speedMarks,
        duration: endX ? 0 : 0
      });
    }
  };

  function make(meta, design) {
    const b = new Builder(meta);
    design(b);
    const def = b.finish();
    def.duration = GR.Physics.timeAtX(def, def.endX);
    return def;
  }

  const LEVELS = [];

  // =========================================================
  // 1. FIRST FLIGHT — Beginner. Cube only, generous spacing.
  // 120 BPM, normal speed: one beat = 5.2 blocks.
  // =========================================================
  LEVELS.push(make({
    id: "first-flight", name: "First Flight", difficulty: "Beginner", stars: 1, bpm: 120, endBeat: 100,
    palette: { sky1: "#0b1a3d", sky2: "#1b3f8a", ground: "#14306b", line: "#5ec8ff", block: "#173a7a", accent: "#7df9ff", glow: "#5ec8ff", far: "#2a5cc4" },
    song: "flight", sections: [[0, "intro"], [4, "main"], [15, "drop"], [22, "outro"]], blurb: "Learn to jump. Spikes, blocks, and stairs."
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    b.text(4, 3.4, "Press SPACE, click, or tap to jump");
    // Intro: single spikes on the beat.
    b.sp(J(8)); b.sp(J(12)); b.sp(J(16)); b.sp(J(18));
    b.sps(J(20, 2), 2);
    b.text(X(22), 3.2, "Land on top of blocks — don't hit their sides");
    // Blocks to hop onto.
    b.blk(X(24) + 2.6, 0, 5, 1);
    b.blk(X(28) + 2.6, 0, 3, 1); b.sp(X(28) + 5.6, 0); b.sp(X(28) + 6.6, 0);
    // Stairs up, a floating high route with token 1, then the drop.
    b.blk(X(32) + 2.6, 0, 5.2, 1);
    b.blk(X(33) + 2.6, 0, 5.2, 2);
    b.blk(X(34) + 2.6, 0, 5.4, 3);
    b.blk(X(35) + 4.2, 4.2, 4, 0.6);          // optional floating ledge
    b.token(X(35) + 7.4, 6.3);
    b.sps(X(36) + 3.4, 2);
    b.sp(J(39)); b.sp(J(40) + 1.2);
    // Pits.
    b.text(X(41), 3.2, "Jump over gaps");
    b.pit(X(42) + 1.8, X(42) + 4.2);
    b.pit(X(44) + 1.8, X(44) + 4.4);
    b.pit(X(46) + 1.6, X(46) + 4.6);
    b.blk(X(47) + 3.4, 0, 2, 1);
    b.pit(X(48) + 0.6, X(48) + 3.2);
    // Ceiling section: a roof with hanging spikes (they can't reach you).
    b.blk(X(50), 4.4, X(57) - X(50), 0.6);
    b.csps(X(51), 3, 4.4); b.csps(X(54), 3, 4.4);
    b.sp(J(51)); b.sps(J(53, 2), 2); b.sp(J(55));
    b.token(X(52) + 2.4, 3.1);                 // token 2: an extra jump on beat 52, then jump again right away
    b.sp(X(56) + 2.6); b.blk(X(56) + 3.6, 0, 1, 1); b.sp(X(56) + 4.6);
    // Rhythm run (the music gets bigger here).
    b.sp(J(60)); b.sp(J(61)); b.sps(J(62, 2), 2);
    b.sp(J(64)); b.sp(J(65)); b.sps(J(66, 2), 2);
    // Platform hopping over a spike floor.
    for (let i = 0; i < 4; i++) {
      const x = X(68 + i) + 2.6;
      b.blk(x, 0, 3.4, 1);
      b.small(x + 3.4); b.small(x + 4.4);
    }
    b.token(X(70) + 7.0, 4.25);                // token 3: a high jump right over the middle gap
    b.blk(X(72) + 2.6, 0, 3, 2);
    b.blk(X(73) + 2.6, 0, 6, 1);
    // Finale.
    b.sps(J(76, 2), 2); b.sp(J(78)); b.sps(J(80, 2), 2);
    b.blk(X(82) + 2.6, 0, 5.2, 1);
    b.blk(X(83) + 2.6, 0, 5.2, 2);
    b.sps(X(84) + 3.8, 3);
    b.sp(J(87)); b.sps(J(89, 2), 2); b.sp(J(91)); b.sp(J(92));
    b.sps(J(94, 2), 2);
  }));

  // =========================================================
  // 2. NEON AVENUE — Easy. Jump pads, orbs, gentle speed changes.
  // 128 BPM. Normal → fast (beat 40) → slow (beat 88) → fast (beat 104).
  // =========================================================
  LEVELS.push(make({
    id: "neon-avenue", name: "Neon Avenue", difficulty: "Easy", stars: 2, bpm: 128, endBeat: 128,
    speeds: [[40, 2], [88, 0], [104, 2]],
    palette: { sky1: "#16052b", sky2: "#4a0f63", ground: "#2b0b45", line: "#ff5fd2", block: "#3a1260", accent: "#ffd23f", glow: "#ff5fd2", far: "#8a2fc0" },
    song: "neon", sections: [[0, "intro"], [4, "main"], [10, "drop"], [18, "main"], [22, "calm"], [26, "drop"], [31, "outro"]],
    blurb: "Jump pads, orbs, and speed portals."
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    b.text(3, 3.6, "Yellow pads launch you on their own");
    // Pads.
    b.pad(X(8) + 1); b.sps(X(8) + 3, 3);
    b.sp(J(12)); b.sp(J(13));
    b.pad(X(14) + 1); b.blk(X(14) + 4, 0, 7, 3);
    b.token(X(14) + 12.4, 5.5);               // token 1: jump off the very end of the tall block
    b.text(X(16) + 5, 3.6, "Pink pads are small boosts");
    b.pad(X(19) + 1, 0, "pink"); b.sp(X(19) + 2.7);
    b.pad(X(20) + 1, 0, "pink"); b.blk(X(20) + 2.6, 0, 3, 1);
    b.sp(J(22));
    // Orbs.
    b.text(X(22) + 3, 3.6, "Press while touching an orb to jump in midair");
    b.pit(X(24) + 1.5, X(24) + 8.5); b.orb(X(24) + 5, 2.3);
    b.sps(X(27) + 2, 5); b.orb(X(27) + 4.6, 2.4);
    b.sps(X(30) + 2, 2); b.orb(X(30) + 4.9, 1.2, "pink"); b.sps(X(30) + 5.6, 2);
    b.pad(X(33) + 1); b.pit(X(33) + 2.5, X(33) + 11); b.orb(X(33) + 5.8, 3.0);
    b.sp(J(36)); b.sps(J(37, 2), 2);
    b.blk(X(38) + 2.6, 0, 4, 1);
    // Speed portal at beat 40: open runway, then a faster run.
    b.sp(J(42)); b.sp(J(43)); b.sps(J(44, 3), 3);
    b.blk(X(46) + 3, 0, 5, 1); b.blk(X(47) + 3, 0, 5, 2);
    b.pad(X(48) + 0.5, 2); b.sps(X(48) + 2.6, 5);
    b.orb(X(48) + 4.6, 6.6);                   // optional orb high above the pad jump...
    b.token(X(48) + 8.6, 9.0);                 // ...leads to token 2
    // Drop: orb chain over a long pit.
    b.sps(J(52, 2), 2); b.sp(J(53));
    b.pit(X(55) + 1.5, X(55) + 16); b.orb(X(55) + 5.2, 2.3); b.orb(X(55) + 10.8, 2.3);
    b.blk(X(58) + 2, 0, 3, 1); b.sps(J(59.4, 2), 2);
    // Low roof: little jumps only.
    b.blk(X(61), 3.5, X(67) - X(61), 0.7);
    b.sp(J(62)); b.sp(J(63)); b.sps(J(64, 2), 2); b.sp(J(65.5));
    // Platforms with pink pads between them.
    for (let i = 0; i < 3; i++) {
      const x = X(68 + i * 2) + 3;
      b.blk(x, 0, 5, 1); b.pad(x + 5.4, 0, "pink"); b.blk(x + 7.4, 0, 3, 2); b.sps(x + 5.0 + 0, 0);
    }
    b.sps(X(75) + 4, 2);
    b.pad(X(78) + 1); b.blk(X(78) + 4, 0, 3, 3); b.blk(X(78) + 9, 0, 3, 3); b.sps(X(78) + 7, 2);
    b.orb(X(79) + 9.6, 4.4); b.sps(X(80) + 3.6, 6);
    b.token(X(80) + 4.5, 7.3);                 // token 3: hit the orb late for an extra-high arc
    b.sp(J(84)); b.sps(J(85, 2), 2);
    // Slow, calm section (beat 88).
    b.text(X(89), 3.6, "Slow down... breathe");
    b.sp(J(90)); b.sp(J(92)); b.blk(X(93) + 2, 0, 3, 1); b.sp(J(95) + 0.5);
    b.pad(X(97) + 1, 0, "pink"); b.blk(X(97) + 3.2, 0, 2, 1.5);
    b.sp(J(99)); b.sps(J(101, 2), 2);
    // Fast finale (beat 104).
    b.sps(J(106, 3), 3); b.sp(J(107.5));
    b.pad(X(109) + 1); b.pit(X(109) + 2.5, X(109) + 13); b.orb(X(109) + 7.0, 3.0); b.orb(X(110) + 7.8, 2.4, "pink");
    b.sps(J(113, 2), 2); b.sp(J(114)); b.sps(J(115, 3), 3);
    b.blk(X(117) + 3, 0, 5, 1); b.blk(X(118) + 3, 0, 5, 2); b.blk(X(119) + 3, 0, 4, 3);
    b.sps(X(120) + 1.1, 4);
    b.sp(J(122)); b.sps(J(123, 2), 2);
  }));

  // =========================================================
  // 3. GRAVITY CIRCUIT — Medium. Upside-down cube and the ball.
  // 132 BPM, normal speed, fast from beat 80.
  // =========================================================
  LEVELS.push(make({
    id: "gravity-circuit", name: "Gravity Circuit", difficulty: "Medium", stars: 3, bpm: 132, endBeat: 144,
    speeds: [[80, 2]],
    palette: { sky1: "#03201c", sky2: "#0b4d43", ground: "#073a33", line: "#4dffd2", block: "#0c4a40", accent: "#ffe14d", glow: "#4dffd2", far: "#1a8f7b" },
    song: "gravity", sections: [[0, "intro"], [4, "main"], [10, "drop"], [18, "main"], [20, "calm"], [24, "drop"], [30, "main"], [34, "outro"]],
    blurb: "Flip gravity and roll the ball between floor and ceiling."
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    // Warm-up.
    b.sp(J(6)); b.sps(J(8, 2), 2); b.blk(X(10) + 2.6, 0, 4, 1); b.sp(J(12));
    // Zone 1: gravity flips (floor 0, ceiling 7).
    const z1a = X(14) + 2, z1b = X(72) + 4;
    b.zone(z1a, z1b, 0, 7);
    b.text(X(13), 4.6, "Yellow portal: gravity flips upside down!");
    b.grav(X(16) + 1, 1.5, "up");
    b.csp(J(19), 7); b.csp(J(20.5), 7); b.csps(J(22, 2), 2, 7);
    b.grav(X(23) + 2, 5.5, "down");
    b.sp(J(25.5));
    b.grav(X(27) + 1, 1.5, "up");
    b.text(X(28) + 1, 3.2, "Blue pads and orbs flip you back");
    b.cpad(X(29) + 3, 7, "blue");
    b.sp(J(31)); b.sp(J(32));
    b.orb(X(33) + 2.4, 2.4, "blue");
    b.csps(X(34) + 4, 2, 7);
    b.token(X(34) + 1.2, 3.6);                 // token 1: in the middle of the flip, only reached with a late press
    b.grav(X(36) + 2, 5.5, "down");
    b.smalls(J(38, 2), 2);
    // Ball (same zone).
    b.text(X(39), 4.6, "Ball: press to flip to the other side");
    b.mode(X(41) + 1, 1.5, "ball");
    for (let k = 0; k < 6; k++) {
      const x = X(44 + k * 2) + 2;
      if (k % 2 === 0) b.sps(x, 3); else b.csps(x, 3, 7);
    }
    // Pillars: ride the ceiling over floor blocks, then the floor under ceiling blocks.
    b.blk(X(56) + 2, 0, 4, 3); b.blk(X(57) + 2, 4, 4, 3); b.blk(X(58) + 2, 0, 4, 3); b.blk(X(59) + 2, 4, 4, 3);
    b.token(X(60) + 3, 3.5);                   // token 2: flip back and forth twice between the pillars
    for (let k = 0; k < 6; k++) {
      const x = X(62 + k) + 2.2;
      if (k % 2 === 0) b.sps(x, 2); else b.csps(x, 2, 7);
    }
    // Funnel down to the floor, then back to the cube.
    b.blk(X(69) + 1, 4, X(72) + 6 - (X(69) + 1), 3);
    b.mode(X(71) + 1, 1.5, "cube");
    // Zone 2 (fast): gravity cube, then ball again.
    const z2a = X(75), z2b = X(118) + 6;
    b.zone(z2a, z2b, 0, 8);
    b.sp(J(74));
    b.grav(X(77) + 1, 1.5, "up");
    b.csps(J(82, 2), 2, 8); b.csp(J(83.5), 8);
    b.orb(X(85) + 2.6, 5.6, "blue");
    b.sps(X(85) + 6, 2);
    b.pad(X(88) + 1, 0, "blue");
    b.csps(X(89) + 4, 3, 8);
    b.cpad(X(91) + 1, 8, "blue");
    b.sps(J(93, 2), 2);
    b.mode(X(96) + 1, 1.5, "ball");
    for (let k = 0; k < 5; k++) {
      const x = X(99 + k * 2) + 2.5;
      if (k % 2 === 0) b.blk(x, 0, 3, 4); else b.blk(x, 4, 3, 4);
    }
    b.token(X(108) + 1.5, 4.0);               // token 3: flip early twice in a row
    b.sps(X(109) + 3, 3); b.csps(X(110) + 3, 3, 8); b.sps(X(111) + 3, 3);
    b.blk(X(114), 3.2, X(118) + 6 - X(114), 4.8);
    b.mode(X(116) + 1, 1.5, "cube");
    // Cube finale with pads that flip you up and down.
    const z3a = X(124), z3b = X(140) + 4;
    b.zone(z3a, z3b, 0, 7);
    b.sp(J(120)); b.sps(J(121.5, 2), 2);
    b.pad(X(125) + 1, 0, "blue"); b.csps(X(126) + 1, 2, 7);
    b.cpad(X(127) + 2, 7, "blue"); b.sps(X(128) + 1, 2);
    b.pad(X(129) + 2, 0, "blue"); b.csps(X(130) + 1.5, 2, 7);
    b.grav(X(132) + 1, 5.5, "down");
    b.sp(J(134)); b.sps(J(135, 2), 2); b.sps(J(137, 3), 3);
  }));

  // =========================================================
  // 4. SKYLINE SURGE — Medium. Ship and UFO.
  // 136 BPM, normal speed, fast from beat 92.
  // =========================================================
  LEVELS.push(make({
    id: "skyline-surge", name: "Skyline Surge", difficulty: "Medium", stars: 4, bpm: 136, endBeat: 160,
    speeds: [[92, 2]],
    palette: { sky1: "#2a0d05", sky2: "#7a2a12", ground: "#4a1a0a", line: "#ffb347", block: "#5a220e", accent: "#fff1a8", glow: "#ffb347", far: "#c4571f" },
    song: "skyline", sections: [[0, "intro"], [3, "main"], [11, "calm"], [15, "main"], [23, "drop"], [31, "main"], [35, "outro"]],
    blurb: "Fly the ship and hop the UFO over the city."
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    b.sp(J(4)); b.sps(J(6, 2), 2); b.orb(X(8) + 4.4, 2.4); b.sps(X(8) + 2, 5);
    // Ship zone (floor 0, ceiling 9).
    b.zone(X(11), X(44) + 4, 0, 9);
    b.text(X(10) - 2, 5.2, "Ship: hold to rise, let go to fall");
    b.mode(X(12) + 1, 1.5, "ship");
    b.gate(X(16) + 2, 2, 0, 9, 3, 7.5);
    b.gate(X(18) + 2, 2, 0, 9, 4.5, 9);
    b.gate(X(20) + 2, 2, 0, 9, 0, 4.5);
    b.gate(X(22) + 2, 2, 0, 9, 2.5, 8, true);
    // Tunnel.
    b.blk(X(24) + 2, 0, X(27) - X(24), 2); b.blk(X(24) + 2, 6.5, X(27) - X(24), 2.5);
    b.sps(X(25) + 2, 2, 2); b.csps(X(26), 2, 6.5);
    b.token(X(25) + 3, 6.0);                   // token 1: squeeze up high in the tunnel
    // Moving saw.
    b.saw(X(28) + 4, 4.5, 1, b.mv(0, 2.6, 4));
    b.gate(X(30) + 2, 1.5, 0, 9, 1.5, 5.5, true);
    b.gate(X(31) + 2, 1.5, 0, 9, 3.5, 7.5, true);
    b.gate(X(32) + 2, 1.5, 0, 9, 2, 6, true);
    b.gate(X(33) + 2, 1.5, 0, 9, 4, 8, true);
    b.saw(X(35) + 2, 1.2, 1.2); b.saw(X(35) + 4.5, 7.8, 1.2);
    b.gate(X(37) + 2, 2, 0, 9, 2.5, 6.5, true);
    // Funnel down to the floor for the cube portal.
    b.blk(X(40) + 1, 7, 3, 2); b.blk(X(40) + 4, 5.2, 3, 3.8); b.blk(X(41) + 2.4, 3.2, X(44) + 4 - (X(41) + 2.4), 5.8);
    b.mode(X(43), 1.5, "cube");
    b.sp(J(46)); b.sps(J(47, 2), 2);
    b.pad(X(49) + 1); b.blk(X(49) + 4, 0, 5, 3);
    b.sps(X(50) + 4.5, 3); b.orb(X(51) + 2, 2.6); b.sps(X(51) + 0.5, 4);
    b.sp(J(54)); b.sps(J(56, 2), 2);
    // UFO zone (floor 0, ceiling 9) — the ship comes back later in the same zone.
    b.zone(X(58), X(124) + 4, 0, 9);
    b.text(X(57), 5.2, "UFO: tap for each hop");
    b.mode(X(60) + 1, 1.5, "ufo");
    b.sps(X(62) + 1, Math.floor(X(86) - X(62) - 1));       // spike floor under the whole UFO section
    b.gate(X(64) + 2, 1.5, 0, 9, 2.5, 6.5);
    b.gate(X(66) + 2, 1.5, 0, 9, 4, 8);
    b.gate(X(68) + 2, 1.5, 0, 9, 2, 6);
    b.gate(X(70) + 2, 1.5, 0, 9, 3.5, 7.5);
    b.saw(X(72) + 3, 7.6, 1.1);
    b.gate(X(74) + 2, 1.5, 0, 9, 1.5, 5);
    b.token(X(75) + 3, 7.4);                   // token 2: hop up high between gates
    b.gate(X(76) + 2, 1.5, 0, 9, 4, 7.5);
    b.gate(X(78) + 2, 1.5, 0, 9, 2, 5.5);
    b.saw(X(80) + 2.4, 5.2, 0.9, b.mv(0, 1.6, 4));
    b.gate(X(82) + 2, 1.5, 0, 9, 3, 6.5);
    b.gate(X(84) + 2, 1.5, 0, 9, 1.5, 5);
    // Funnel to the floor, then the ship (fast).
    b.blk(X(86) + 1, 6.5, 3, 2.5); b.blk(X(87) + 0.4, 3.2, X(92) + 3 - (X(87) + 0.4), 5.8);
    b.mode(X(91) + 1, 1.5, "ship");
    b.gate(X(96) + 2, 1.5, 0, 9, 2, 5.5, true);
    b.gate(X(97) + 2.5, 1.5, 0, 9, 4, 7.5, true);
    b.gate(X(98) + 3, 1.5, 0, 9, 2.5, 6, true);
    b.saw(X(100) + 3, 4.5, 1.1, b.mv(0, 2.4, 4, 0.25));
    b.blk(X(102) + 2, 0, X(106) - X(102), 3); b.blk(X(102) + 2, 6.2, X(106) - X(102), 2.8);
    b.sps(X(103) + 2, 3, 3); b.csps(X(104) + 2, 3, 6.2);
    b.gate(X(107) + 2, 1.5, 0, 9, 4, 7.5, true);
    b.gate(X(108) + 2, 1.5, 0, 9, 1.5, 5, true);
    b.gate(X(109) + 2, 1.5, 0, 9, 4, 7.5, true);
    b.token(X(111) + 2, 1.2);                  // token 3: dive to the floor under a saw
    b.saw(X(111) + 2, 4.4, 1.6);
    b.gate(X(113) + 2, 1.5, 0, 9, 2.5, 6.5, true);
    b.gate(X(115) + 2, 1.5, 0, 9, 3.5, 7.5, true);
    b.blk(X(118) + 1, 6.5, 3, 2.5); b.blk(X(119), 3.2, X(124) + 4 - X(119), 5.8);
    b.mode(X(122) + 1, 1.5, "cube");
    // Cube finale (fast).
    b.sps(J(127, 3), 3); b.sp(J(128.5));
    b.pad(X(130) + 1); b.blk(X(130) + 4.5, 0, 6, 3); b.sps(X(131) + 5, 2);
    b.orb(X(132) + 3, 2.6); b.sps(X(132) + 1.2, 5);
    b.sps(J(135, 2), 2); b.sp(J(136)); b.sps(J(137, 3), 3);
    b.blk(X(139) + 3, 0, 5, 1); b.blk(X(140) + 3, 0, 5, 2); b.blk(X(141) + 3, 0, 4, 3);
    b.sps(X(142) + 1.3, 5);
    b.sps(J(145, 2), 2); b.sp(J(146.5)); b.sps(J(148, 3), 3);
    b.pad(X(150) + 1); b.sps(X(150) + 3, 6);
    b.sp(J(154)); b.sps(J(155, 2), 2);
  }));

  // =========================================================
  // 5. PRISM RUSH — Hard. Robot and wave, mini size.
  // 140 BPM, fast speed (very fast from beat 128).
  // =========================================================
  LEVELS.push(make({
    id: "prism-rush", name: "Prism Rush", difficulty: "Hard", stars: 5, bpm: 140, endBeat: 168, startSpeed: 2,
    speeds: [[128, 3]],
    palette: { sky1: "#05081f", sky2: "#22106b", ground: "#140b45", line: "#9b8cff", block: "#231663", accent: "#2de2ff", glow: "#9b8cff", far: "#5b3fd6" },
    song: "prism", sections: [[0, "intro"], [2, "main"], [9, "drop"], [16, "main"], [22, "drop"], [29, "calm"], [32, "drop"], [40, "outro"]],
    blurb: "Robot jumps and razor-sharp wave zigzags."
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    b.sp(J(3)); b.sps(J(5, 3), 3);
    // Robot.
    b.text(X(6) + 2, 4, "Robot: hold longer to jump higher");
    b.mode(X(8) + 1, 1.5, "robot");
    b.blk(X(10) + 3, 0, 4, 1);
    b.blk(X(12) + 3, 0, 6, 3);
    b.blk(X(14) + 4, 2.4, X(17) - X(14), 0.6);           // low roof: small hops only
    b.smalls(J(15), 1); b.smalls(J(16), 1);
    b.blk(X(18) + 3, 0, 4, 1); b.blk(X(19) + 3, 0, 4, 2); b.blk(X(20) + 3, 0, 4, 3);
    b.sps(X(21) + 1.6, 3);
    b.token(X(21) + 3, 6.0);                  // token 1: a full-height jump off the top step
    b.sp(J(23)); b.sps(J(24, 2), 2);
    b.pad(X(26) + 1); b.blk(X(26) + 5, 0, 4, 4); b.sps(X(27) + 3.5, 3);
    b.blk(X(29) + 2, 0, 3, 2); b.sps(X(29) + 5, 2); b.blk(X(30) + 2.4, 0, 3, 3);
    b.sps(X(31) + 1.4, 2);
    b.blk(X(33), 3.2, X(37) - X(33), 1);                // roof before the wave portal
    // Wave zone (floor 0, ceiling 8).
    b.zone(X(35), X(64) + 2, 0, 8);
    b.mode(X(36), 1.5, "wave");
    b.text(X(36) + 2, 5.2, "Wave: hold to go up, let go to go down");
    b.smalls(X(38), X(40) - X(38));
    for (let i = 0; i < 6; i++) {
      const x = X(40 + i) + 2;
      if (i % 2 === 0) b.haz(x, 0, 2, 4.6); else b.haz(x, 3.4, 2, 4.6);
    }
    b.saw(X(46) + 4, 4, 1, b.mv(0, 2.2, 2));
    for (let i = 0; i < 7; i++) {
      const x = X(47.5 + i * 0.75) + 2;
      if (i % 2 === 0) b.haz(x, 0, 1, 4.4); else b.haz(x, 3.6, 1, 4.4);
    }
    b.token(X(52) + 4.5, 6.8);                // token 2: swoop high after the fast zigzag
    b.haz(X(53) + 2, 0, 3, 3); b.haz(X(53) + 2, 6, 3, 2);
    b.haz(X(55) + 2, 2, 3, 6); b.haz(X(56) + 4, 0, 3, 5.5);
    b.haz(X(58) + 2, 3.2, 2, 4.8); b.haz(X(59) + 2.6, 0, 2, 4.6);
    b.blk(X(61), 3.2, X(64) + 2 - X(61), 4.8);          // ceiling steps down for the robot portal
    b.mode(X(63), 1.5, "robot");
    // Mini robot under low roofs.
    b.size(X(66), 1.5, "mini");
    b.blk(X(68), 1.9, X(74) - X(68), 0.6);
    b.small(J(69)); b.small(J(70)); b.smalls(J(71, 2), 2); b.small(J(72.5));
    b.blk(X(75) + 2, 0, 3, 1); b.blk(X(76) + 2, 0, 3, 2);
    b.size(X(78), 1.5, "normal");
    b.blk(X(80) + 3, 0, 5, 3); b.sps(X(81) + 3.2, 3);
    b.sp(J(83)); b.sps(J(84, 2), 2);
    b.blk(X(86), 3.2, X(89) - X(86), 1);
    // Mini wave (steeper).
    b.zone(X(87) + 2, X(116) + 2, 0, 8);
    b.mode(X(88) + 0.5, 1.5, "wave");
    b.size(X(90), 4, "mini");
    for (let i = 0; i < 7; i++) {
      const x = X(92 + i * 0.75) + 2;
      if (i % 2 === 0) b.haz(x, 0, 1, 4.6); else b.haz(x, 3.4, 1, 4.6);
    }
    b.token(X(97) + 3.5, 7.0);                // token 3: zip to the top after the mini zigzag
    for (let i = 0; i < 6; i++) b.saw(X(98 + i) + 3, i % 2 ? 6 : 2, 1.2);
    b.size(X(104) + 2, 4, "normal");
    for (let i = 0; i < 6; i++) {
      const x = X(106 + i) + 2;
      if (i % 2 === 0) b.haz(x, 0, 2, 4.4); else b.haz(x, 3.6, 2, 4.4);
    }
    b.blk(X(113), 3.2, X(116) + 2 - X(113), 4.8);
    b.mode(X(115), 1.5, "cube");
    // Cube finale, very fast from beat 128.
    b.sps(J(119, 3), 3); b.sp(J(120.5)); b.orb(X(122) + 4.6, 2.4); b.sps(X(122) + 2, 6);
    b.sps(J(125, 2), 2); b.sps(J(126, 3), 3);
    b.sp(J(131)); b.sps(J(132, 3), 3);
    b.mode(X(134) + 1, 1.5, "robot");
    b.blk(X(136) + 3, 0, 5, 3); b.sps(X(137) + 3, 3); b.blk(X(138) + 2, 0, 4, 2);
    b.blk(X(140) + 3, 2.3, X(143) - X(140), 0.7); b.small(J(141)); b.small(J(142));
    b.mode(X(145) + 1, 1.5, "cube");
    b.sps(J(148, 3), 3); b.pad(X(150) + 1); b.sps(X(150) + 3, 8);
    b.sps(J(155, 2), 2); b.sps(J(156, 3), 3); b.sp(J(158)); b.sps(J(160, 3), 3);
  }));

  // =========================================================
  // 6. FINAL VELOCITY — Expert. Everything, fast.
  // 150 BPM, fast speed; very fast from beat 64 to 84 and 136 to 168.
  // =========================================================
  LEVELS.push(make({
    id: "final-velocity", name: "Final Velocity", difficulty: "Expert", stars: 6, bpm: 150, endBeat: 200, startSpeed: 2,
    speeds: [[64, 3], [84, 2], [136, 3], [168, 2]],
    palette: { sky1: "#1f0208", sky2: "#5c0a1c", ground: "#3a0612", line: "#ff4d5e", block: "#4a0a18", accent: "#ffe14d", glow: "#ff4d5e", far: "#a01834" },
    song: "velocity", sections: [[0, "intro"], [4, "main"], [10, "drop"], [16, "main"], [21, "calm"], [24, "drop"], [34, "main"], [42, "drop"], [48, "outro"]],
    blurb: "Every mode, every trick, top speed."
  }, function (b) {
    const X = b.X.bind(b), J = b.J.bind(b);
    // Cube.
    b.sp(J(4)); b.sps(J(5, 3), 3); b.orb(X(7) + 4.4, 2.4); b.sps(X(7) + 2, 6);
    b.pad(X(10) + 1); b.blk(X(10) + 4.6, 0, 5, 3); b.sps(X(11) + 4.4, 3);
    b.sps(J(13, 2), 2); b.sp(J(14));
    // Ship (zone 0..9 from beat 16 to 40), ball after.
    b.zone(X(15) + 2, X(64) + 2, 0, 9);
    b.mode(X(16) + 2, 1.5, "ship");
    b.gate(X(19) + 2, 1.5, 0, 9, 3, 7, true);
    b.gate(X(20) + 2.5, 1.5, 0, 9, 1.5, 5.5, true);
    b.saw(X(22) + 3, 4.5, 1.2, b.mv(0, 2.4, 4));
    b.gate(X(24) + 2, 1.5, 0, 9, 3.5, 7.5, true);
    b.gate(X(25) + 2, 1.5, 0, 9, 1.5, 5.5, true);
    b.blk(X(27) + 2, 0, X(31) - X(27), 3.5); b.blk(X(27) + 2, 7, X(31) - X(27), 2);
    b.saw(X(29) + 2, 5.25, 0.7, b.mv(4, 0, 4));
    b.token(X(29) + 2, 6.4);                   // token 1: thread the gap above the sliding saw
    b.gate(X(32) + 2, 1.5, 0, 9, 4, 8, true);
    b.gate(X(33) + 2, 1.5, 0, 9, 1, 5, true);
    b.gate(X(34) + 2, 1.5, 0, 9, 3.5, 7.5, true);
    b.blk(X(36) + 1, 6.6, 3, 2.4); b.blk(X(37), 3.2, X(40) + 3 - X(37), 5.8);
    b.mode(X(39) + 1, 1.5, "ball");
    for (let k = 0; k < 8; k++) {
      const x = X(42 + k * 1.5) + 2;
      if (k % 2 === 0) b.sps(x, 3); else b.csps(x, 3, 9);
    }
    b.grav(X(54) + 2, 4.5, "up");
    b.sps(X(55) + 3, 3); b.csps(X(56) + 3, 3, 9); b.sps(X(57) + 3, 3);
    b.blk(X(59) + 2, 0, 3, 4); b.blk(X(60) + 2, 5, 3, 4);
    b.blk(X(61) + 2, 4.5, X(64) + 2 - (X(61) + 2), 4.5);
    b.grav(X(62) + 1, 1.5, "down");
    b.mode(X(63) + 1, 1.5, "ufo");
    // UFO, very fast (beat 64-84).
    b.zone(X(64) + 2, X(84) + 4, 0, 9);
    b.sps(X(65) + 2, Math.floor(X(81) - X(65) - 2));
    b.gate(X(67) + 2, 1.5, 0, 9, 2.5, 6.5);
    b.gate(X(69) + 2, 1.5, 0, 9, 4, 8);
    b.gate(X(71) + 2, 1.5, 0, 9, 1.5, 5.5);
    b.saw(X(73) + 3, 7.2, 1.2);
    b.gate(X(75) + 2, 1.5, 0, 9, 3, 7);
    b.gate(X(77) + 2, 1.5, 0, 9, 2, 6);
    b.token(X(78) + 3, 7.6);                   // token 2: hop high between the last two gates
    b.gate(X(79) + 2, 1.5, 0, 9, 3.5, 7.5);
    b.blk(X(81) + 1, 6.5, 3, 2.5); b.blk(X(82), 3.2, X(84) + 4 - X(82), 5.8);
    b.mode(X(83) + 1, 1.5, "wave");
    // Wave (fast).
    b.zone(X(84) + 4, X(112) + 2, 0, 8);
    for (let i = 0; i < 8; i++) {
      const x = X(86 + i) + 2;
      if (i % 2 === 0) b.haz(x, 0, 2, 4.7); else b.haz(x, 3.3, 2, 4.7);
    }
    b.size(X(94) + 2, 4, "mini");
    for (let i = 0; i < 8; i++) {
      const x = X(96 + i * 0.5) + 2;
      if (i % 2 === 0) b.haz(x, 0, 1, 4.6); else b.haz(x, 3.4, 1, 4.6);
    }
    b.size(X(101) + 2, 4, "normal");
    b.saw(X(103) + 3, 4, 1.1, b.mv(0, 2.6, 2));
    b.haz(X(105) + 2, 0, 3, 3); b.haz(X(105) + 2, 6, 3, 2); b.haz(X(107) + 2, 2.5, 2, 5.5);
    b.blk(X(109), 3.2, X(112) + 2 - X(109), 4.8);
    b.mode(X(111), 1.5, "robot");
    // Robot.
    b.blk(X(114) + 3, 0, 5, 3); b.sps(X(115) + 3.5, 3);
    b.blk(X(117) + 3, 2.3, X(120) - X(117), 0.7); b.small(J(118)); b.small(J(119));
    b.blk(X(121) + 3, 0, 4, 1); b.blk(X(122) + 3, 0, 4, 3); b.sps(X(123) + 2.2, 3);
    b.token(X(123) + 4, 6.4);                  // token 3: max-height robot jump off the tall block
    b.pad(X(126) + 1); b.blk(X(126) + 5, 0, 4, 4); b.sps(X(127) + 4, 3);
    b.mode(X(130) + 1, 1.5, "cube");
    b.sps(J(132, 3), 3); b.sp(J(133.5));
    // Cube with gravity, very fast (beat 136-168).
    b.zone(X(135) + 2, X(166) + 4, 0, 8);
    b.grav(X(137) + 1, 1.5, "up");
    b.csps(J(140, 2), 2, 8); b.csp(J(141.5), 8);
    b.orb(X(143) + 3, 5.6, "blue"); b.sps(X(143) + 6.4, 2);
    b.sps(J(146, 3), 3);
    b.pad(X(148) + 1, 0, "blue"); b.csps(X(149) + 2, 3, 8);
    b.cpad(X(151) + 1, 8, "blue"); b.sps(J(153, 2), 2);
    b.mode(X(155) + 1, 1.5, "ball");
    b.sps(X(157) + 3, 3); b.csps(X(158) + 3, 3, 8); b.sps(X(159) + 3, 3); b.csps(X(160) + 3, 3, 8);
    b.blk(X(162), 3.2, X(166) + 4 - X(162), 4.8);
    b.mode(X(164) + 1, 1.5, "ship");
    // Ship finale (fast from beat 168).
    b.zone(X(166) + 4, X(194) + 3, 0, 9);
    b.gate(X(169) + 2, 1.5, 0, 9, 3, 7, true);
    b.gate(X(170) + 2, 1.5, 0, 9, 1.5, 5.5, true);
    b.gate(X(171) + 2, 1.5, 0, 9, 4, 8, true);
    b.blk(X(173) + 2, 0, X(178) - X(173), 3); b.blk(X(173) + 2, 6.5, X(178) - X(173), 2.5);
    b.saw(X(175) + 2, 4.75, 0.55, b.mv(2.5, 0, 2));
    b.gate(X(179) + 2, 1.5, 0, 9, 2, 6, true);
    b.gate(X(180) + 2, 1.5, 0, 9, 4, 8, true);
    b.gate(X(181) + 2, 1.5, 0, 9, 1.5, 5.5, true);
    b.saw(X(183) + 3, 4.5, 1.2, b.mv(0, 2.5, 2));
    b.gate(X(185) + 2, 1.5, 0, 9, 3, 7, true);
    b.blk(X(188) + 1, 6.5, 3, 2.5); b.blk(X(189), 3.2, X(194) + 3 - X(189), 5.8);
    b.mode(X(192) + 1, 1.5, "cube");
    b.sps(J(196, 2), 2); b.sp(J(197.5));
  }));

  GR.LEVELS = LEVELS;
  GR.makeLevel = make;
})();
