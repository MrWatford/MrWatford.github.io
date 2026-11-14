// Turbo League — Mr. Watford Training Academy.
// Every lesson = setup (where the car/ball/targets go) + tick (is the goal met?) + stars + a demo.
// The demo drives the student's car with the same buttons a player would press, and the automated
// tests run every demo to prove each lesson can actually be completed.
// No graphics in this file (it runs in Node for the tests); main.js draws the targets.
import { Match } from "./match.js";
import { V, Q, sdf } from "./physics.js";
import { ARENA, BALL, CAR, PHYS } from "./config.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const flat = (v) => new V(v.x, 0, v.z);
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const BLANK = () => ({ throttle: 0, steer: 0, pitch: 0, roll: 0, jump: false, boost: false, slide: false });
const TAU = Math.PI * 2;

// ---------- driving helpers used by the demos ----------
export function steerTo(car, p, inp = BLANK(), { boost = false, maxSpeed = 23, slideAt = 1.4 } = {}) {
  const local = car.q.rot(V.sub(p, car.pos), true), ang = Math.atan2(local.x, local.z), dist = Math.hypot(local.x, local.z), vF = car.vel.dot(car.forward);
  inp.steer = clamp(-ang * 3, -1, 1); inp.throttle = vF < maxSpeed ? 1 : vF > maxSpeed + 1.5 ? -0.3 : 0.02;
  inp.slide = car.onGround && Math.abs(ang) > slideAt && vF > 6;
  inp.boost = boost && Math.abs(ang) < 0.3 && vF < Math.min(22.9, maxSpeed) && car.boost > 0;
  return { inp, ang, dist, vF };
}
export function orient(car, fwd, up, inp) {
  const f = car.q.rot(fwd, true), u = car.q.rot(up, true), w = car.q.rot(car.ang, true);
  inp.pitch = clamp(3 * Math.atan2(-f.y, f.z) - 0.7 * w.x, -1, 1);
  inp.steer = -clamp(3 * Math.atan2(f.x, f.z) - 0.7 * w.y, -1, 1);
  inp.roll = clamp(2.5 * Math.atan2(-u.x, u.y) - 0.4 * w.z, -1, 1); inp.slide = false;
  return Math.acos(clamp(f.z / Math.max(1e-6, Math.hypot(f.x, f.y, f.z)), -1, 1));
}
export function upright(car, inp = BLANK()) { const v = flat(car.vel); orient(car, v.len() > 1.5 ? v.norm() : flat(car.forward).norm(), new V(0, 1, 0), inp); return inp; }
// point the nose at a target in the air and boost toward it (plus a little lift against gravity)
function flyTo(car, target, inp = BLANK(), tLeft = null) {
  const D = V.sub(target, car.pos), d = D.len(), T = tLeft ? clamp(tLeft, 0.15, 3) : clamp(d / 10, 0.25, 2);
  const need = D.clone().addS(car.vel, -T).scale(2 / (T * T)); need.y += PHYS.gravity;
  const off = orient(car, need.clone().norm(), new V(0, 1, 0), inp); inp.boost = off < 0.6 && car.boost > 0; inp.throttle = 1; return inp;
}

// ---------- the lesson runtime ----------
export class Lesson {
  constructor(def, { demo = false, seed = 7 } = {}) {
    this.def = def; this.demo = demo;
    const botDemo = demo && def.demo === "bot";
    this.m = new Match({ size: 1, freePlay: true, opponents: def.opponent !== undefined, humans: botDemo ? [] : [0], blueLevel: 5, orangeLevel: def.opponent ?? 2, length: 0, seed, goalPause: 1.0, onGoalReset: () => this.afterGoal() });
    this.world = this.m.world; this.player = this.m.players[0]; this.car = this.player.car; this.ball = this.world.ball;
    this.m.state = "play"; this.m.timer = 0; this.m.kickoffTouched = true; this.world.ballFrozen = false;
    for (const p of this.m.players) p.car.frozen = false;
    this.t = 0; this.tries = 0; this.targets = []; this.progress = { n: 0, of: 1 }; this.state = "play"; this.result = null; this.data = {}; this.tip = ""; this.events = []; this.prev = new V();
    this.counts = { ok: 0, done: 0 };
    def.setup(this);
    this.prev.copy(this.car.pos);
  }
  rand() { return this.m.rand(); }
  get step_() { return this.data.step || 0; }
  placeCar(x, z, yaw = 0, { boost = 33, y = null, speed = 0 } = {}) {
    const c = this.car; c.place(x, z, yaw); c.boost = boost; if (y !== null) c.pos.y = y; if (speed) c.vel = c.forward.clone().scale(speed);
    for (const w of c.wheels) { w.contact = y === null; } c.frozen = false; this.prev.copy(c.pos);
  }
  setBall(x, y, z, vx = 0, vy = 0, vz = 0, frozen = false) {
    const b = this.ball; b.pos.set(x, y, z); b.vel.set(vx, vy, vz); b.ang.set(0, 0, 0); b.touch = null; this.world.ballFrozen = frozen; this.world.touches = [];
  }
  hideBall() { this.setBall(0, -50, 0, 0, 0, 0, true); }
  gates(list, { y = 1.6, r = 2.4 } = {}) { this.targets = list.map(([x, z, yy, rr]) => ({ kind: yy !== undefined && yy > 1.7 ? "ring" : "gate", pos: new V(x, yy ?? y, z), r: rr ?? r, hit: false })); this.progress = { n: 0, of: list.length }; }
  nextGate() { return this.targets.find((g) => !g.hit); }
  // did the car pass through the next gate this step? (crossing the gate's plane, close enough to its centre)
  gateTick() {
    const g = this.nextGate(); if (!g) return false;
    const a = this.prev, b = this.car.pos;
    if ((a.z - g.pos.z) * (b.z - g.pos.z) <= 0 && a.z !== b.z) {
      const k = (g.pos.z - a.z) / (b.z - a.z), x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
      if (Math.hypot(x - g.pos.x, y - g.pos.y) < g.r) { g.hit = true; this.progress.n++; this.events.push({ type: "target", pos: g.pos }); return true; }
    }
    return false;
  }
  playerHits(ev) { return ev.filter((e) => e.type === "ballHit" && e.car === this.car); }
  pass() { if (this.state !== "play") return; this.state = "success"; const stars = this.def.stars(this); this.result = { stars, time: this.t, tries: this.tries }; this.events.push({ type: "lessonPass", stars }); }
  fail(msg) { if (this.state !== "play") return; this.state = "fail"; this.result = { msg }; this.events.push({ type: "lessonFail", msg }); }
  retry(tip) { this.tries++; this.tip = tip; this.events.push({ type: "lessonRetry", tip }); this.data = { ...(this.data.keep ? this.data : {}), keep: this.data.keep }; this.def.setup(this, true); this.prev.copy(this.car.pos); }
  // multi-try lessons (shooting, saves...): note the result of one try, then set up the next
  attemptDone(ok, tip) {
    this.counts.done++; if (ok) this.counts.ok++; this.progress.n = this.counts.ok;
    this.events.push({ type: ok ? "attemptOk" : "attemptMiss", tip });
    if (!ok && tip) this.tip = tip;
    const D = this.def.attempts;
    if (D.playAll) { if (this.counts.done >= D.max) return this.counts.ok >= D.need ? this.pass() : this.fail(`${this.counts.ok} of ${D.need} — so close! Try again.`); }
    else {
      if (this.counts.ok >= D.need) return this.pass();
      if (this.counts.done >= D.max) return this.fail(`${this.counts.ok} of ${D.need} — so close! Try again.`);
    }
    this.data = { attemptT: this.t }; this.def.setupAttempt(this); this.prev.copy(this.car.pos);
  }
  afterGoal() { if (this.def.goal) this.def.goal(this); }
  // one physics step; input = the student's buttons (ignored in demo mode)
  step(input) {
    this.events = [];
    if (this.state !== "play") { return; }
    let inp = input;
    if (this.demo) inp = this.def.demo === "bot" ? null : this.def.demo(this, this.t) || BLANK();
    this.prev.copy(this.car.pos);
    this.m.step(inp ? { 0: inp } : {});
    this.t += 1 / PHYS.hz;
    const ev = this.m.takeEvents();
    if (this.world.ballFrozen && ev.some((e) => e.type === "ballHit")) this.world.ballFrozen = false;
    this.events.push(...ev);
    this.def.tick(this, ev);
    if (this.def.limit && this.t > this.def.limit && this.state === "play") this.fail("Time's up! Have another go.");
  }
}

// ---------- the 19 lessons ----------
const T = (t, a, b) => (t <= a ? 3 : t <= b ? 2 : 1);           // stars by time
const byTries = (L) => (L.tries === 0 ? 3 : L.tries <= 2 ? 2 : 1); // stars by retries
const byAttempts = (L) => { const d = L.counts.done, need = L.def.attempts.need; return d <= need ? 3 : d <= need + 1 ? 2 : 1; };
const dribbleCtl = (L, offset = 0) => { const c = L.car, b = L.ball; const dz = b.pos.z - c.pos.z - offset, want = b.vel.z + 4 * dz, vF = c.vel.dot(c.forward); return { ...BLANK(), throttle: clamp((want - vF) * 1.5, -0.08, 1), steer: clamp((b.pos.x - c.pos.x) * -2, -0.3, 0.3) }; };
const startDribble = (L) => { L.placeCar(0, -32, 0, { speed: 6 }); L.setBall(0, 0.355 + CAR.half[1] + BALL.r + 0.01, -32 + (L.def.id === "flick" ? 0.35 : 0.05), 0, 0, 6); };
const ballOnRoof = (L) => { const c = L.car, b = L.ball; return hd(b.pos, c.pos) < 1.1 && b.pos.y - c.pos.y > 0.8; };

export const TIERS = [
  { name: "Beginner", color: "#5fd38a", reward: { id: "trail-sky", label: "Sky Blue boost trail" } },
  { name: "Intermediate", color: "#ffc23a", reward: { id: "trail-gold", label: "Golden boost trail" } },
  { name: "Advanced", color: "#ff6a6a", reward: { id: "trail-legend", label: "Legend boost trail + Academy Graduate title" } },
];

export const LESSONS = [
  // ===== BEGINNER =====
  { id: "drive", tier: 0, title: "Driving", icon: "🚗", limit: 60,
    coach: "Welcome to the Academy! Every great player starts here. Let's get your car moving.",
    steps: ["Hold W (or ↑) to drive forward. S (or ↓) is brake and reverse.", "Drive through all 4 glowing gates."], stars3: "under 9 s", stars2: "under 14 s",
    setup(L) { L.placeCar(0, -32, 0); L.hideBall(); L.gates([[0, -20], [0, -8], [0, 4], [0, 16]]); },
    tick(L) { L.gateTick(); if (L.progress.n >= 4) L.pass(); },
    stars: (L) => T(L.t, 9, 14),
    demo(L) { const g = L.nextGate(); return g ? steerTo(L.car, g.pos.clone().add(new V(0, 0, 3))).inp : BLANK(); } },
  { id: "steer", tier: 0, title: "Steering", icon: "↔️", limit: 75,
    coach: "Now let's weave. Steer with A and D (or ← and →). Smooth hands win races!",
    steps: ["Steer with A/D while you drive.", "Slalom through all 6 gates."], stars3: "under 15 s", stars2: "under 22 s",
    setup(L) { L.placeCar(0, -34, 0); L.hideBall(); L.gates([[-5, -24], [5, -14], [-5, -4], [5, 6], [-5, 16], [5, 26]]); },
    tick(L) { L.gateTick(); if (L.progress.n >= 6) L.pass(); },
    stars: (L) => T(L.t, 15, 22),
    demo(L) { const g = L.nextGate(); return g ? steerTo(L.car, g.pos.clone().add(new V(0, 0, 2.5)), BLANK(), { maxSpeed: 15 }).inp : BLANK(); } },
  { id: "brake", tier: 0, title: "Braking", icon: "🛑", limit: 90,
    coach: "Speed is great, but you also need to stop on a dime. Press S to brake hard.",
    steps: ["Build up speed toward the gold zone.", "Brake with S and stop completely inside the zone."], stars3: "first try", stars2: "within 3 tries",
    setup(L) { L.placeCar(0, -32, 0); L.hideBall(); L.targets = [{ kind: "zone", pos: new V(0, 0, 12), r: 2.6 }]; L.progress = { n: 0, of: 1 }; L.data.moved = false; },
    tick(L) {
      const c = L.car, zone = L.targets[0], z = zone.pos, sp = c.speed(), d = hd(c.pos, z);
      if (sp > 5) L.data.moved = true;
      if (L.data.moved && sp < 0.6 && d < zone.r) { L.progress.n = 1; L.pass(); }
      else if (c.pos.z > z.z + 6) L.retry("You overshot the zone. Start braking a little sooner!");
      else if (L.data.moved && sp < 0.3 && d >= zone.r) L.retry("You stopped short. Keep driving until you're closer.");
    },
    stars: byTries,
    demo(L) { const c = L.car, zp = L.targets[0].pos, v = c.vel.dot(c.forward), d = zp.z - c.pos.z; const inp = BLANK(); inp.throttle = d < v * v / 70 + 0.4 ? (v > 0.2 ? -1 : 0) : 1; return inp; } },
  { id: "boost", tier: 0, title: "Boosting", icon: "🔥", limit: 45,
    coach: "Boost is your rocket fuel! Big orange pads fill your tank. Hold Shift to boost.",
    steps: ["Drive over the big glowing boost pad.", "Hold Shift (or left mouse) to boost until you go SUPERSONIC."], stars3: "under 6 s", stars2: "under 10 s",
    setup(L) { L.placeCar(-16, -14, Math.atan2(-14.8, 14), { boost: 0 }); L.hideBall(); L.world.resetPads(); L.targets = [{ kind: "marker", pos: new V(-(ARENA.hx - 3.2), 0, 0), r: 2 }]; L.progress = { n: 0, of: 2 }; L.data.step = 0; },
    tick(L, ev) {
      if (L.data.step === 0 && ev.some((e) => e.type === "pad" && e.big && e.car === L.car)) { L.data.step = 1; L.progress.n = 1; L.targets = []; L.events.push({ type: "target" }); }
      if (L.data.step === 1 && L.car.supersonic) { L.progress.n = 2; L.pass(); }
    },
    stars: (L) => T(L.t, 6, 10),
    demo(L) { if (L.data.step === 0) return steerTo(L.car, new V(-(ARENA.hx - 3.2), 0, 0)).inp; return steerTo(L.car, new V(-14, 0, 40), BLANK(), { boost: true }).inp; } },
  { id: "jump", tier: 0, title: "Jumping", icon: "⤴️", limit: 60,
    coach: "Time to fly a little! Press Space to jump. Hold it longer to jump higher.",
    steps: ["Drive toward each floating ring.", "Jump (Space) just before it to pass through all 3."], stars3: "under 9 s", stars2: "under 15 s",
    setup(L) { L.placeCar(0, -32, 0); L.hideBall(); L.gates([[0, -18, 2.1, 1.35], [0, 4, 2.1, 1.35], [0, 26, 2.1, 1.35]]); L.data.jumpFor = -1; },
    tick(L) { L.gateTick(); if (L.progress.n >= 3) L.pass(); else if (L.car.onGround) { const g = L.nextGate(); if (g && L.car.pos.z > g.pos.z + 2) L.retry("Missed a ring. Jump a bit earlier, just before the ring."); } },
    stars: (L) => T(L.t, 9, 15),
    demo(L) { const c = L.car, g = L.nextGate(); if (!g) return BLANK(); const r = steerTo(c, new V(g.pos.x, 0, g.pos.z + 3), BLANK(), { maxSpeed: 10 }), inp = r.inp; const dz = g.pos.z - c.pos.z, v = Math.max(1, c.vel.z);
      const idx = L.targets.indexOf(g); if (c.onGround && L.data.jumpFor !== idx && dz < v * 0.45 && dz > 0) { L.data.jumpFor = idx; L.data.jumpT = L.t; }
      if (L.data.jumpFor === idx && L.t - L.data.jumpT < 0.2) inp.jump = true; return inp; } },
  { id: "touch", tier: 0, title: "Ball Contact", icon: "⚽", limit: 60,
    coach: "Here comes the ball! Drive into it to hit it. The faster you go, the harder you hit.",
    steps: ["Drive into the ball to hit it.", "Hit the ball 5 times."], stars3: "under 18 s", stars2: "under 30 s",
    setup(L) { L.placeCar(0, -25, 0); L.setBall(0, BALL.r, -8); L.progress = { n: 0, of: 5 }; L.data.lastHit = -9; },
    tick(L, ev) { if (L.playerHits(ev).length && L.t - L.data.lastHit > 0.5) { L.data.lastHit = L.t; L.progress.n++; } if (L.progress.n >= 5) L.pass(); },
    stars: (L) => T(L.t, 18, 30),
    demo(L) { const b = L.ball.pos, c = L.car, to = flat(V.sub(b, c.pos)).norm(); return steerTo(c, b.clone().addS(to, 1), BLANK(), { maxSpeed: 23, boost: true }).inp; } },

  // ===== INTERMEDIATE =====
  { id: "shoot", tier: 1, title: "Shooting", icon: "🎯", demo: "bot", attempts: { need: 3, max: 6 },
    coach: "Line up behind the ball so your car, the ball and the goal make a straight line. Then hit through it!",
    steps: ["Get behind the ball, facing the orange goal.", "Score 3 goals (you have 6 tries)."], stars3: "3 goals in 3 tries", stars2: "3 goals in 4 tries",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 3 }; L.def.setupAttempt(L); },
    setupAttempt(L) { const bx = (L.rand() - 0.5) * 16, bz = 16 + L.rand() * 8; L.setBall(bx, BALL.r, bz, (L.rand() - 0.5) * 2, 0, 1); L.placeCar(bx + (L.rand() - 0.5) * 10, bz - 16, 0, { boost: 60 }); L.data.attemptT = L.t; L.data.scored = L.world.score[0]; },
    goal(L) { L.attemptDone(L.world.score[0] > L.data.scored, "Own goal! Get on the other side of the ball first."); },
    tick(L) { if (L.m.state === "play" && L.t - L.data.attemptT > 9) L.attemptDone(false, "Get lined up first: car, ball and goal in one line."); },
    stars: byAttempts },
  { id: "defend", tier: 1, title: "Defending", icon: "🛡️", demo: "bot", attempts: { need: 3, max: 5, playAll: true },
    coach: "Shots are coming at YOUR goal! Stay between the ball and the net, then challenge it.",
    steps: ["Stay in front of your blue goal.", "Keep out 3 of the 5 shots."], stars3: "stop all 5", stars2: "stop 4",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 3 }; L.def.setupAttempt(L); },
    setupAttempt(L) {
      L.placeCar(0, -(ARENA.hz - 3), 0, { boost: 50 });
      const sx = (L.rand() - 0.5) * 24, sz = -10, tx = (L.rand() - 0.5) * 9, ty = 1 + L.rand() * 3, tz = -(ARENA.hz + 2), Tt = 1.9;
      L.setBall(sx, 1.2, sz, (tx - sx) / Tt, (ty - 1.2) / Tt + 0.5 * PHYS.gravity * Tt, (tz - sz) / Tt); L.data.attemptT = L.t; L.data.conceded = L.world.score[1];
    },
    goal(L) { if (L.world.score[1] > L.data.conceded) L.attemptDone(false, "That one got in. Stay closer to the middle of your goal."); },
    tick(L) { if (L.m.state === "play" && L.t - L.data.attemptT > 4.5) L.attemptDone(true); },
    stars: (L) => (L.counts.ok >= 5 ? 3 : L.counts.ok === 4 ? 2 : 1), passAt: "end" },
  { id: "slide", tier: 1, title: "Powersliding", icon: "🌀", limit: 60,
    coach: "Hold C while turning to powerslide. Your back end swings around so you can turn much tighter!",
    steps: ["Drive through the first gate.", "Hold C (powerslide) and steer to whip around.", "Come back through the second gate."], stars3: "under 5 s", stars2: "under 8 s",
    setup(L) { L.placeCar(0, -20, 0); L.hideBall(); L.gates([[0, 0], [8, 0]]); L.data.slide = 0; },
    tick(L) { if (L.car.sliding && L.car.input && L.car.input.slide) L.data.slide += 1 / PHYS.hz; L.gateTick(); if (L.progress.n >= 2) { if (L.data.slide > 0.25) L.pass(); else L.retry("Hold C while you turn to powerslide around the corner!"); } else if (L.progress.n === 1 && L.car.pos.z > 22) L.retry("Turn sooner, and hold C to slide around."); },
    stars: (L) => T(L.t, 5, 8),
    demo(L) { const c = L.car; if (L.progress.n === 0) return steerTo(c, new V(0, 0, 4), BLANK(), { maxSpeed: 11 }).inp;
      const wp = c.pos.z > 5.5 || L.data.turned ? new V(8, 0, -6) : new V(5, 0, 9); if (c.forward.z < 0) L.data.turned = true;
      const r = steerTo(c, wp, BLANK(), { maxSpeed: 11, slideAt: 0.45 }); if (!L.data.turned && c.pos.z > 2) r.inp.slide = true; return r.inp; } },
  { id: "wall", tier: 1, title: "Wall Driving", icon: "🧗", limit: 40,
    coach: "The walls are part of the field! Drive straight into the curve and keep going up.",
    steps: ["Drive at the side wall and up the curve.", "Touch the glowing target high on the wall."], stars3: "under 4 s", stars2: "under 7 s",
    setup(L) { L.placeCar(14, 0, Math.PI / 2, { boost: 50 }); L.hideBall(); L.targets = [{ kind: "wallring", pos: new V(ARENA.hx - 0.4, 7, 2), r: 2.6 }]; L.progress = { n: 0, of: 1 }; },
    tick(L) { const c = L.car; if (c.contacts > 0 && V.sub(c.pos, L.targets[0].pos).len() < 2.8) { L.progress.n = 1; L.pass(); } else if (c.pos.y > 13) L.retry("Too high! Steer toward the target as you climb."); },
    stars: (L) => T(L.t, 4, 7),
    demo(L) { return steerTo(L.car, L.targets[0].pos, BLANK(), { boost: L.car.onGround, maxSpeed: 16 }).inp; } },
  { id: "boostmgmt", tier: 1, title: "Boost Management", icon: "⛽", limit: 45,
    coach: "Big pads aren't always close. Small pads give 12 boost each, and they add up fast. Collect them on the way!",
    steps: ["Your tank is empty and the big pads are off.", "Drive over small pads until you have 60 boost."], stars3: "under 14 s", stars2: "under 24 s",
    setup(L) { L.placeCar(0, -30, 0, { boost: 0 }); L.hideBall(); L.world.resetPads(); for (const p of L.world.pads) if (p.big) p.timer = 1e9; L.progress = { n: 0, of: 5 }; L.targets = []; },
    tick(L) { for (const p of L.world.pads) if (p.big) p.timer = 1e9; L.progress.n = Math.min(5, Math.floor(L.car.boost / 12)); if (L.car.boost >= 60) L.pass(); },
    stars: (L) => T(L.t, 14, 24),
    demo(L) { const c = L.car; let best = null, bd = 1e9; for (const p of L.world.pads) { if (p.big || p.timer > 0) continue; const d = Math.hypot(p.x - c.pos.x, p.z - c.pos.z) + Math.abs(Math.atan2(p.x - c.pos.x, p.z - c.pos.z) - Math.atan2(c.forward.x, c.forward.z)) * 3; if (d < bd) { bd = d; best = p; } }
      return best ? steerTo(c, new V(best.x, 0, best.z), BLANK(), { maxSpeed: 14 }).inp : BLANK(); } },
  { id: "aerial", tier: 1, title: "Basic Aerials", icon: "✈️", attempts: { need: 3, max: 6 },
    coach: "Jump, tilt your nose up toward the ball, and hold boost. You'll fly! Use W/S to aim up and down.",
    steps: ["Drive toward the floating ball.", "Jump, aim your nose at it (W/S), hold boost.", "Hit 3 floating balls in the air."], stars3: "3 in 3 tries", stars2: "3 in 4 tries",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 3 }; L.def.setupAttempt(L); },
    setupAttempt(L) { const spots = [[0, 4.4, 4], [-6, 5, 6], [6, 5.4, 8], [-3, 4.8, 2], [4, 5, 5], [0, 5.6, 7]]; const s = spots[L.counts.done % spots.length]; L.placeCar(0, -16, Math.atan2(s[0], s[2] + 16), { boost: 100 }); L.setBall(s[0], s[1], s[2], 0, 0, 0, true); L.data.attemptT = L.t; L.data.phase = 0; },
    tick(L, ev) { if (L.playerHits(ev).some((e) => e.pos.y > 2.6)) return L.attemptDone(true); if (L.t - L.data.attemptT > 7 || (!L.world.ballFrozen && L.ball.pos.y < 1.2)) L.attemptDone(false, "Jump when you're closer, then point your nose right at the ball."); },
    stars: byAttempts,
    demo(L) { const c = L.car, b = L.ball.pos, inp = BLANK(), h = b.y;
      if (L.data.phase === 0) { steerTo(c, new V(b.x, 0, b.z), inp, { maxSpeed: 8 }); if (hd(c.pos, b) < h * 1.6 + c.speed() * 0.35) { L.data.phase = 1; L.data.jt = L.t; } return inp; }
      const k = L.t - L.data.jt; flyTo(c, b, inp); if (k < 0.2) { inp.jump = true; } return inp; } },

  // ===== ADVANCED =====
  { id: "fastaerial", tier: 2, title: "Fast Aerials", icon: "🚀", attempts: { need: 3, max: 8 },
    coach: "A fast aerial gets you up FAST: jump and hold it, tap jump again, tilt back and boost the whole time.",
    steps: ["Jump (hold), then jump again while tilting back (S).", "Boost the whole way up.", "Reach the high ball within 2.6 s of your first jump — 3 times."], stars3: "3 in 3 tries", stars2: "3 in 5 tries",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 3 }; L.def.setupAttempt(L); },
    setupAttempt(L) { L.placeCar(0, -9, 0, { boost: 100 }); L.setBall((L.rand() - 0.5) * 4, 8.8, 3, 0, 0, 0, true); L.data.attemptT = L.t; L.data.jt = null; },
    tick(L, ev) { if (L.data.jt === null && !L.car.onGround) L.data.jt = L.t; const hit = L.playerHits(ev).some((e) => e.pos.y > 7);
      if (hit) return L.attemptDone(L.data.jt !== null && L.t - L.data.jt < 2.6, "Too slow that time: hold the first jump, tap it again and boost right away.");
      if (L.t - L.data.attemptT > 6) L.attemptDone(false, "Go straight up: jump, jump again, tilt back, boost!"); },
    stars: (L) => (L.counts.done <= 3 ? 3 : L.counts.done <= 5 ? 2 : 1),
    demo(L) { const c = L.car, k = L.t - L.data.attemptT, inp = BLANK(); inp.boost = k > 0.05; inp.jump = k < 0.2 || (k > 0.25 && k < 0.3);
      if (k > 0.02) { const j = inp.jump; flyTo(c, L.ball.pos, inp); inp.jump = j; inp.boost = true; } return inp; } },
  { id: "dribble", tier: 2, title: "Dribbling", icon: "🏀", limit: 90,
    coach: "Balance the ball on your roof! Speed up when it rolls forward, ease off when it rolls back.",
    steps: ["The ball starts on your roof.", "Keep it there for 4 seconds by matching its speed (W / ease off)."], stars3: "first try", stars2: "within 3 tries",
    setup(L) { startDribble(L); L.data.on = 0; L.progress = { n: 0, of: 4 }; },
    tick(L) { if (ballOnRoof(L) && L.car.onGround) { L.data.on += 1 / PHYS.hz; L.progress.n = Math.floor(L.data.on); if (L.data.on >= 4) L.pass(); }
      else if (L.t > 0.3 && (hd(L.ball.pos, L.car.pos) > 1.6 || L.ball.pos.y < 1.3)) L.retry("It fell off. Little throttle taps keep it balanced."); },
    stars: byTries,
    demo(L) { return dribbleCtl(L); } },
  { id: "flick", tier: 2, title: "Flicks", icon: "💥", limit: 90,
    coach: "From a dribble: hop, wait a moment, then flip forward into the ball to pop it ahead!",
    steps: ["Dribble the ball on your roof (it starts there).", "Jump, wait a beat, then jump again + W to flip forward.", "Flick the ball at least 7 m ahead of you."], stars3: "first try", stars2: "within 3 tries",
    setup(L) { startDribble(L); L.data.flicked = false; L.progress = { n: 0, of: 1 }; },
    tick(L, ev) {
      if (!L.data.flicked && ev.some((e) => e.type === "dodge" && e.car === L.car)) { L.data.flicked = true; L.data.fz = L.car.pos.z; }
      if (L.data.flicked && L.ball.pos.z - L.data.fz > 7 && L.ball.pos.y > 0.95) { L.progress.n = 1; L.pass(); }
      else if (L.data.flicked && L.ball.contact && L.ball.pos.z - L.data.fz < 7 && L.t > 0.5) L.retry("Not far enough. Wait a moment after the first jump before you flip.");
      else if (!L.data.flicked && L.t > 0.3 && (hd(L.ball.pos, L.car.pos) > 1.8 || L.ball.pos.y < 1.2)) L.retry("The ball fell off before your flick. Balance it first.");
    },
    stars: byTries,
    demo(L) { if (!L.data.ft) L.data.ft = L.t + 1.2; const k = L.t - L.data.ft; if (k < 0) return dribbleCtl(L, 0.35); return { ...BLANK(), throttle: 1, jump: k < 0.04 || (k > 0.3 && k < 0.34), pitch: k > 0.3 ? 1 : 0 }; } },
  { id: "airroll", tier: 2, title: "Air Rolling", icon: "🔄", attempts: { need: 2, max: 6 },
    coach: "In the air, hold C and press A or D to roll (or use Q / E). Spin a full circle and land on your wheels!",
    steps: ["You start high in the air.", "Roll a full circle (C + A/D, or Q/E).", "Land on your wheels — do it twice."], stars3: "2 in 2 tries", stars2: "2 in 3 tries",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 2 }; L.def.setupAttempt(L); },
    setupAttempt(L) { L.placeCar(0, -10 + L.counts.done * 4, 0, { y: 9.5, speed: 4 }); L.hideBall(); L.data.roll = 0; L.data.attemptT = L.t; },
    tick(L) { const c = L.car; if (c.contacts === 0) L.data.roll += Math.abs(c.q.rot(c.ang, true).z) / PHYS.hz;
      if (L.t - L.data.attemptT > 0.2 && (c.contacts >= 3 || c.bodyTouch > 0.2)) {
        const ok = L.data.roll >= TAU - 0.4 && c.up.y > 0.8;
        L.attemptDone(ok, L.data.roll < TAU - 0.4 ? "Keep rolling until you've gone all the way around." : "Stop the roll with your wheels pointing down.");
      } },
    stars: byAttempts,
    demo(L) { const c = L.car, inp = BLANK(); if (L.data.roll < TAU - 1.1) { inp.roll = 1; return inp; } return upright(c, inp); } },
  { id: "redirect", tier: 2, title: "Aerial Redirects", icon: "↪️", attempts: { need: 2, max: 6 },
    coach: "A teammate crosses the ball in front of goal. Meet it in the air and redirect it into the net!",
    steps: ["Watch the ball cross in front of the orange goal.", "Fly up and hit it into the goal while it's in the air.", "Score 2 air redirects."], stars3: "2 in 2 tries", stars2: "2 in 4 tries",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 2 }; L.def.setupAttempt(L); },
    setupAttempt(L) { const s = L.counts.done % 2 ? 1 : -1; L.placeCar(0, 18, 0, { boost: 100 }); L.data.fly = null; L.setBall(s * 22, 2, 31, -s * 10, 9, 1); L.data.attemptT = L.t; L.data.scored = L.world.score[0]; },
    goal(L) { if (L.world.score[0] > L.data.scored) { const t = L.world.touches[L.world.touches.length - 1]; L.attemptDone(!!(t && t.car === L.car.id && t.y > 2.3), "That went in, but hit it while it's still in the air for a redirect!"); } else L.attemptDone(false); },
tick(L) { if (L.m.state === "play" && L.t - L.data.attemptT > 6) L.attemptDone(false, "Leave a little earlier and meet the ball in the air."); },
stars: byAttempts,
demo(L) {
  const c = L.car, inp = BLANK(), goal = new V(0, 2, ARENA.hz + 1);
  if (!L.data.fly) {
    // drive toward where the cross will be, and take off as soon as a jump + boost can reach it in time
const pred = L.m.prediction(); let aim = null;
// the moment the cross passes in front of the goal (high enough to be an air ball)
for (let k = 6; k < pred.length; k += 3) { const s = pred[k]; if (s.p.y < 3 || s.p.y > 8) continue; if (!aim || Math.abs(s.p.x) < Math.abs(aim.p.x)) aim = s; }
if (aim) {
  const T = aim.t - 0.25, p0 = c.pos.clone().addS(c.up, 0.55).addS(c.vel, 0.25), v0 = c.vel.clone().addS(c.up, 4.2);
  const need = V.sub(aim.p, p0).addS(v0, -T).scale(2 / (T * T)); need.y += PHYS.gravity;
  if (T > 0.35 && need.len() < 8.6 && c.onGround && aim.t < 1.6) L.data.fly = { tEnd: L.t + aim.t, jt: L.t };
}
if (!L.data.fly) { if (aim) { const spot = new V(aim.p.x * 0.5, 0, aim.p.z - 6); steerTo(c, spot, inp, { boost: hd(c.pos, spot) > 10, maxSpeed: Math.max(2, Math.min(14, hd(c.pos, spot) * 1.3)) }); } return inp; }
  }
  const F = L.data.fly, left = Math.max(0.05, F.tEnd - L.t), pred = L.m.prediction(), s = pred[Math.min(pred.length - 1, Math.round(left * 60))];
  const hitFrom = s.p.clone().addS(V.sub(goal, s.p).norm(), -1.0);
  flyTo(c, hitFrom, inp, left); if (L.t - F.jt < 0.2) inp.jump = true; return inp;
} },
  { id: "recover", tier: 2, title: "Recovery", icon: "🪂", attempts: { need: 3, max: 6 },
    coach: "Knocked upside down? Use W/S to tilt and A/D (or C + A/D) to roll so you land on your wheels.",
    steps: ["You'll be dropped upside down and spinning.", "Turn your wheels toward the floor before you land.", "Land on your wheels 3 times."], stars3: "3 in 3 tries", stars2: "3 in 4 tries",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 3 }; L.def.setupAttempt(L); },
    setupAttempt(L) { const k = L.counts.done; L.placeCar((L.rand() - 0.5) * 10, -10, L.rand() * TAU, { y: 8 }); L.car.q = L.car.q.mul(Q.axis(0, 0, 1, Math.PI * (0.7 + L.rand() * 0.6))).mul(Q.axis(1, 0, 0, (L.rand() - 0.5) * 1.5)); L.car.ang.set((L.rand() - 0.5) * 5, 1, (L.rand() - 0.5) * 5); L.hideBall(); L.data.attemptT = L.t; },
    tick(L) { const c = L.car; if (L.t - L.data.attemptT > 0.2 && (c.contacts >= 3 || c.bodyTouch > 0.2)) L.attemptDone(c.up.y > 0.8 && c.contacts >= 3, "Look at which way is down and roll your wheels toward it early."); },
    stars: byAttempts,
    demo(L) { return upright(L.car, BLANK()); } },
  { id: "shadow", tier: 2, title: "Shadow Defense", icon: "🧱", opponent: 2, attempts: { need: 3, max: 4, playAll: true },
    coach: "An attacker is coming! Back up toward your goal staying between them and the net, then win the ball when they slow down.",
    steps: ["Stay between the attacker and your goal.", "Clear the ball up the field or survive 12 seconds.", "Stop 3 of 4 attacks."], stars3: "stop all 4", stars2: "stop 3 with no goals in your first 3",
    setup(L) { L.counts = { ok: 0, done: 0 }; L.progress = { n: 0, of: 3 }; L.def.setupAttempt(L); },
    setupAttempt(L) { const bx = (L.rand() - 0.5) * 16; L.setBall(bx, BALL.r, 10, 0, 0, -2); const opp = L.m.players[1]; opp.car.place(bx + (L.rand() - 0.5) * 4, 24, Math.PI); opp.car.boost = 60; opp.car.frozen = false; if (opp.bot) opp.bot.reset();
      L.placeCar((L.rand() - 0.5) * 6, -14, 0, { boost: 40 }); L.data.attemptT = L.t; L.data.conceded = L.world.score[1]; },
    goal(L) { if (L.world.score[1] > L.data.conceded) L.attemptDone(false, "They got past you. Back up sooner and don't dive in."); else L.attemptDone(true); },
    tick(L) { if (L.m.state !== "play") return; if (L.ball.pos.z > 18 || L.t - L.data.attemptT > 12) L.attemptDone(true); },
stars: (L) => (L.counts.ok >= 4 ? 3 : 2),
demo(L) {
  // shadow: stay ~7 m goal-side of the ball, backing up with the attacker; challenge when it is loose or close
  const c = L.car, b = L.ball.pos, opp = L.m.players[1].car, own = new V(0, 0, -ARENA.hz);
  const dir = flat(V.sub(b, own)).norm(), loose = hd(opp.pos, b) > 3.5, close = hd(c.pos, b) < 5;
  const goalSide = (b.z - c.pos.z) > 1;
  if ((loose || close) && goalSide) return steerTo(c, b.clone().addS(dir, -1.2), BLANK(), { boost: hd(c.pos, b) > 8 }).inp;
  const spot = b.clone().addS(dir, -7); spot.y = 0;
  return steerTo(c, spot, BLANK(), { maxSpeed: Math.max(3, Math.min(18, hd(c.pos, spot) * 1.5 + opp.vel.len())), boost: !goalSide }).inp;
} },
];
export const lessonById = (id) => LESSONS.find((l) => l.id === id);
// which tiers are open: Intermediate after 4 Beginner lessons, Advanced after 4 Intermediate lessons
export function tierOpen(tier, done) {
  if (tier === 0) return true;
  return LESSONS.filter((l) => l.tier === tier - 1 && done[l.id] > 0).length >= 4 && tierOpen(tier - 1, done);
}
export function tierComplete(tier, done) { return LESSONS.filter((l) => l.tier === tier).every((l) => done[l.id] > 0); }
