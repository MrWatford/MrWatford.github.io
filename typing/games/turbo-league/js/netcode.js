// Turbo League — online play, the rules part (no drawing, no network calls, so it runs in Node and test.html).
//
// How it works:
// • The HOST's computer runs the real match (physics, rules, computer players). Nobody else's copy is "the truth".
// • GUESTS send only their controls: one entry per physics tick (120 a second), packed and sent 20 times a second.
// • The host sends a "snapshot" of everything that moves 20 times a second, plus rule events (goals, kickoffs, the end).
// • To make driving feel instant, a guest PREDICTS: it runs its own copy of the physics with its own controls right away.
//   When a snapshot arrives it jumps back to the host's version and re-plays the controls the host hasn't used yet.
//   Any small difference is smoothed out on screen over a few frames instead of snapping.
import { Match } from "./match.js";
import { V } from "./physics.js";
import { PHYS } from "./config.js";

export const NET_VERSION = "10.1";     // must be digits and dots (the relay checks it); guests must match the host
export const SNAP_MS = 50;             // host snapshot every 50 ms (20 a second)
export const INPUT_MS = 50;            // guest sends its controls every 50 ms
const BUFFER = 8;                      // ticks of a guest's controls the host keeps waiting (about 67 ms)
const DT = 1 / PHYS.hz;
const r2 = (v) => Math.round(v * 100) / 100, r4 = (v) => Math.round(v * 1e4) / 1e4, r5 = (v) => Math.round(v * 1e5) / 1e5;

// ---- controls ----
export const ZERO_IN = Object.freeze({ throttle: 0, steer: 0, pitch: 0, roll: 0, jump: false, boost: false, slide: false });
export const packIn = (i) => [r2(i.throttle || 0), r2(i.steer || 0), r2(i.pitch || 0), r2(i.roll || 0), (i.jump ? 1 : 0) | (i.boost ? 2 : 0) | (i.slide ? 4 : 0)];
export const unpackIn = (a) => (a ? { throttle: a[0], steer: a[1], pitch: a[2], roll: a[3], jump: !!(a[4] & 1), boost: !!(a[4] & 2), slide: !!(a[4] & 4) } : ZERO_IN);
const sameIn = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4];
// run-length: [[input, count], ...] (holding a key for 6 ticks costs one entry)
export function rle(list) { const out = []; for (const x of list) { const l = out[out.length - 1]; if (l && sameIn(l[0], x)) l[1]++; else out.push([x, 1]); } return out; }
export function unrle(runs) { const out = []; for (const [x, n] of runs || []) for (let k = 0; k < Math.min(n, 240); k++) out.push(x); return out; }

// ---- snapshots: everything that moves ----
const NUMS = ["boost", "contacts", "jumpT", "sinceJump", "dodgeT", "jumpGrace", "yawRate", "hitCooldown", "bodyTouch"];
const BOOLS = ["onGround", "jumping", "hasJumped", "hasFlipped", "dodging", "prevJump", "boosting", "supersonic", "sliding", "frozen"];
const v3 = (v) => [r4(v.x), r4(v.y), r4(v.z)];
function snapCar(c) {
  let bits = 0; BOOLS.forEach((k, i) => { if (c[k]) bits |= 1 << i; });
  return [...v3(c.pos), ...v3(c.vel), ...v3(c.ang), r5(c.q.x), r5(c.q.y), r5(c.q.z), r5(c.q.w), ...v3(c.groundNormal), ...NUMS.map((k) => r4(c[k] || 0)), bits,
    r2(c.dodgeDir[0]), r2(c.dodgeDir[1]), c.groundNormalBody ? v3(c.groundNormalBody) : 0, c.wheels.map((w) => [r4(w.comp), r4(w.prevComp), w.contact ? 1 : 0, r4(w.spin), r4(w.steer)]), packIn(c.input || ZERO_IN), r4(c.lastKick || 0)];
}
function applyCar(c, a) {
  c.pos.set(a[0], a[1], a[2]); c.vel.set(a[3], a[4], a[5]); c.ang.set(a[6], a[7], a[8]);
  c.q.x = a[9]; c.q.y = a[10]; c.q.z = a[11]; c.q.w = a[12];
  c.groundNormal = new V(a[13], a[14], a[15]);
  let i = 16; for (const k of NUMS) c[k] = a[i++];
  const bits = a[i++]; BOOLS.forEach((k, j) => { c[k] = !!(bits & (1 << j)); });
  c.dodgeDir = [a[i++], a[i++]];
  const gb = a[i++]; c.groundNormalBody = gb ? new V(gb[0], gb[1], gb[2]) : undefined;
  a[i++].forEach((w, k) => { const W = c.wheels[k]; W.comp = w[0]; W.prevComp = w[1]; W.contact = !!w[2]; W.spin = w[3]; W.steer = w[4]; });
  c.input = unpackIn(a[i++]); c.lastKick = a[i++];
}
export function snapMatch(m) {
  const W = m.world, B = W.ball;
  return { k: W.tick, tm: r4(W.time), st: m.state, mt: r4(m.timer), cl: r4(m.clock), ot: m.overtime ? 1 : 0, ott: r4(m.otTime), kt: m.kickoffTouched ? 1 : 0,
    sc: [...W.score], g: W.goal ? 1 : 0, bf: W.ballFrozen ? 1 : 0, b: [...v3(B.pos), ...v3(B.vel), ...v3(B.ang), B.contact ? 1 : 0],
    p: W.pads.map((p) => r2(p.timer)), c: m.players.map((p) => snapCar(p.car)) };
}
export function applyMatch(m, s) {
  const W = m.world, B = W.ball;
  W.tick = s.k; W.time = s.tm; m.state = s.st; m.timer = s.mt; m.clock = s.cl; m.overtime = !!s.ot; m.otTime = s.ott; m.kickoffTouched = !!s.kt;
  W.score = [...s.sc]; W.goal = s.g ? (W.goal || { team: -1 }) : null; W.ballFrozen = !!s.bf;
  B.pos.set(s.b[0], s.b[1], s.b[2]); B.vel.set(s.b[3], s.b[4], s.b[5]); B.ang.set(s.b[6], s.b[7], s.b[8]); B.contact = !!s.b[9];
  s.p.forEach((t, i) => { if (W.pads[i]) W.pads[i].timer = t; });
  s.c.forEach((a, i) => { if (m.players[i]) applyCar(m.players[i].car, a); });
}

// ---- rule events (goals, saves, kickoffs, the end) travel as plain data with player numbers instead of objects ----
const RULE_EVENTS = ["goal", "save", "overtime", "go", "kickoff", "over"];
export function packEvents(m, list) {
  const ix = (p) => (p ? m.players.indexOf(p) : -1);
  return list.filter((e) => RULE_EVENTS.includes(e.type)).map((e) => {
    if (e.type === "goal") return { type: "goal", team: e.team, scorer: ix(e.scorer), assist: ix(e.assist), ownGoal: !!e.ownGoal, speed: r2(e.speed), pos: v3(e.pos), score: e.score, aerial: !!e.aerial };
    if (e.type === "save") return { type: "save", player: ix(e.player) };
    if (e.type === "over") return { type: "over", result: { winner: e.result.winner, score: e.result.score, mvp: ix(e.result.mvp), overtime: e.result.overtime, otTime: r2(e.result.otTime) }, stats: m.players.map((p) => p.stats) };
    return { type: e.type };
  });
}
export function unpackEvents(m, list) {
  const P = (i) => (i >= 0 ? m.players[i] : null);
  return (list || []).map((e) => {
    if (e.type === "goal") { m.world.score = [...e.score]; return { ...e, scorer: P(e.scorer), assist: P(e.assist), pos: { x: e.pos[0], y: e.pos[1], z: e.pos[2] } }; }
    if (e.type === "save") return { type: "save", player: P(e.player) };
    if (e.type === "over") { e.stats.forEach((s, i) => { if (m.players[i]) m.players[i].stats = s; }); m.state = "over"; m.result = { ...e.result, mvp: P(e.result.mvp) }; return { type: "over", result: m.result }; }
    return e;
  }).filter((e) => !(e.type === "save" && !e.player));
}

// ---- the host side ----
export class HostSession {
  // remote: { [playerIndex]: true } for every player controlled from another computer
  constructor(match, send) {
    this.m = match; this.send = send; this.lastSnap = -1e9;
    this.q = {}; this.last = {}; this.ack = {}; this.lastMsg = {}; this.seen = {}; this.minQ = {}; this.trimT = {}; this.debt = {}; this.starved = {};
  }
  addRemote(idx, now = 0) { this.q[idx] = []; this.last[idx] = ZERO_IN; this.ack[idx] = 0; this.seen[idx] = 0; this.lastMsg[idx] = now; this.minQ[idx] = 99; this.trimT[idx] = 0; this.debt[idx] = 1; this.starved[idx] = 0; }
  removeRemote(idx) { for (const o of [this.q, this.last, this.ack, this.lastMsg, this.seen, this.minQ, this.trimT, this.debt, this.starved]) delete o[idx]; }
  get remotes() { return Object.keys(this.q).map(Number); }
  // a batch of controls from a guest: m.s = the sequence number of the first one
  onInput(idx, msg, now) {
    const q = this.q[idx]; if (!q) return;
    this.lastMsg[idx] = now;
    unrle(msg.r).forEach((pk, k) => { const seq = msg.s + k; if (seq > this.seen[idx]) { q.push([seq, pk]); this.seen[idx] = seq; } });
    while (q.length > 30) { const [seq] = q.shift(); this.ack[idx] = seq; } // way behind: throw old controls away
  }
  // the guest's controls for this physics tick (one queued entry per tick)
  inputFor(idx, now) {
    const q = this.q[idx]; if (!q) return ZERO_IN;
    // keep the waiting line short: if it never drops below BUFFER for half a second, skip one (stops lag building up)
    this.minQ[idx] = Math.min(this.minQ[idx], q.length);
    if (++this.trimT[idx] >= 60) { if (this.minQ[idx] > BUFFER && q.length) { const [seq] = q.shift(); this.ack[idx] = seq; } this.minQ[idx] = 99; this.trimT[idx] = 0; }
    // a small waiting buffer: start using a guest's controls once BUFFER ticks are waiting, so the line rarely runs dry
    // (running dry means guessing, and every guess pushes the two computers a tick apart)
    if (this.debt[idx] && q.length >= BUFFER) this.debt[idx] = 0;
    if (q.length && !this.debt[idx]) { const [seq, pk] = q.shift(); this.ack[idx] = seq; this.last[idx] = unpackIn(pk); }
    else { if (!this.debt[idx]) this.starved[idx]++; this.debt[idx] = 1; if (now - this.lastMsg[idx] > 400) this.last[idx] = ZERO_IN; } // keep the last controls (or let go if the guest went quiet)
    return this.last[idx];
  }
  // inputs for Match.step: host's own + every remote player's
  inputs(local, now) { const out = { ...local }; for (const idx of this.remotes) out[idx] = this.inputFor(idx, now); return out; }
  maybeSnapshot(now, force = false) {
    if (!force && now - this.lastSnap < SNAP_MS) return null;
    this.lastSnap = Math.max(this.lastSnap + SNAP_MS, now - SNAP_MS); // keep an even 20 a second even when frames are uneven
    const s = { t: "s", ...snapMatch(this.m), a: { ...this.ack } };
    this.send(s); return s;
  }
  events(list) { const ev = packEvents(this.m, list); if (ev.length) this.send({ t: "e", ev }); return ev; }
}

// ---- the guest side ----
export class GuestSession {
  constructor(match, me, send) {
    this.m = match; this.me = me; this.send = send;
    this.seq = 0; this.hist = new Map(); this.pending = []; this.lastSend = -1e9; this.snapK = -1; this.lastSnapAt = null;
    this.others = match.players.map(() => ZERO_IN);
    this.err = match.players.map(() => new V()); this.ballErr = new V();
    this.stats = { snaps: 0, resim: 0, maxResim: 0, corr: 0, bigCorr: 0 };
  }
  // advance the predicted world one tick (rules come from the host, so only the physics runs here)
  simTick(myInput) {
    const m = this.m, inputs = m.players.map((p, i) => (i === this.me ? myInput : this.others[i]));
    const live = m.state === "play" || m.state === "goal";
    m.world.step(live ? inputs : []);
    m.timer += DT;
    if (m.state === "play" && !m.o.freePlay && m.o.length > 0) { if (m.overtime) m.otTime += DT; else m.clock = Math.max(0, m.clock - DT); }
  }
  // one local tick with this player's controls
  step(input) {
    const pk = packIn(input); this.seq++; this.hist.set(this.seq, pk); this.pending.push(pk);
    this.simTick(unpackIn(pk));
  }
  flush(now, force = false) {
    if (!this.pending.length || (!force && now - this.lastSend < INPUT_MS)) return null;
    const msg = { t: "i", s: this.seq - this.pending.length + 1, r: rle(this.pending) };
    this.pending = []; this.lastSend = Math.max(this.lastSend + INPUT_MS, now - INPUT_MS); this.send(msg); return msg;
  }
  // a snapshot from the host: jump to it, then re-play our controls the host hasn't used yet
  onSnapshot(s, now = 0) {
    if (s.k <= this.snapK) return; this.snapK = s.k; this.lastSnapAt = now; this.stats.snaps++;
    const m = this.m, W = m.world, before = m.players.map((p) => p.car.pos.clone()), ballBefore = W.ball.pos.clone();
    const keep = W.takeEvents();
    applyMatch(m, s);
    this.others = m.players.map((p) => p.car.input || ZERO_IN);
    const ack = (s.a && s.a[this.me]) || 0;
    for (const k of [...this.hist.keys()]) if (k <= ack) this.hist.delete(k);
    let n = 0; for (let k = ack + 1; k <= this.seq; k++) { this.simTick(unpackIn(this.hist.get(k))); n++; }
    W.takeEvents(); W.events = keep; // effects from the re-play were already shown the first time
    this.stats.resim += n; this.stats.maxResim = Math.max(this.stats.maxResim, n);
    // whatever moved because of the correction is drawn where it was and eased into place
    m.players.forEach((p, i) => { const d = V.sub(before[i], p.car.pos); if (d.len() > 4) d.set(0, 0, 0); else if (d.len() > 0.5) this.stats.bigCorr++; this.err[i].add(d); if (this.err[i].len() > 4) this.err[i].set(0, 0, 0); });
    const db = V.sub(ballBefore, W.ball.pos); this.ballErr.add(db.len() > 6 ? db.set(0, 0, 0) : db); if (this.ballErr.len() > 6) this.ballErr.set(0, 0, 0);
    this.lastCorr = V.sub(before[this.me], m.players[this.me].car.pos).len(); this.stats.corr = Math.max(this.stats.corr, this.lastCorr);
  }
  // drawn position offsets fade away (call once per frame)
  decay(dt) { const k = Math.exp(-dt * 12); for (const e of this.err) e.scale(k); this.ballErr.scale(Math.exp(-dt * 9)); }
  onEvents(list) { return unpackEvents(this.m, list); }
}

// the match options both computers build from (sent by the host when it starts)
export function guestMatch(o) { return new Match({ ...o, humans: o.humans || [] }); }

// ---- names and room codes (kid-safe word lists; names must match the relay's list) ----
export const NAME_A = ["Swift", "Brave", "Clever", "Happy", "Lucky", "Mighty", "Quiet", "Sunny", "Gentle", "Bold", "Bright", "Calm", "Cheerful", "Daring", "Eager", "Friendly", "Jolly", "Kind", "Lively", "Merry", "Nimble", "Noble", "Proud", "Quick", "Silly", "Speedy", "Steady", "Sturdy", "Witty", "Zippy", "Cozy", "Fuzzy", "Golden", "Rusty", "Misty", "Frosty", "Sandy", "Mossy", "Stormy", "Starry"];
export const NAME_B = ["Otter", "Fox", "Badger", "Beaver", "Bunny", "Panda", "Koala", "Puffin", "Penguin", "Owl", "Falcon", "Robin", "Sparrow", "Turtle", "Tortoise", "Gecko", "Lizard", "Dolphin", "Walrus", "Seal", "Moose", "Llama", "Alpaca", "Hedgehog", "Squirrel", "Chipmunk", "Raccoon", "Lynx", "Bison", "Yak", "Heron", "Pelican", "Toucan", "Parrot", "Salmon", "Trout", "Lobster", "Goat", "Pony", "Hamster"];
const CODE_A = ["TURBO", "ROCKET", "NITRO", "BLAZE", "COMET", "DRIFT", "BOOST", "SPARK", "RALLY", "ORBIT", "STORM", "FLASH", "PIXEL", "LASER", "JET", "SONIC"];
const CODE_B = ["OTTER", "FOX", "PANDA", "OWL", "FALCON", "TURTLE", "GECKO", "MOOSE", "LLAMA", "LYNX", "BISON", "HERON", "TOUCAN", "PARROT", "GOAT", "PONY"];
const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
export const randomName = (rnd = Math.random) => `${pick(NAME_A, rnd)} ${pick(NAME_B, rnd)}`;
export const validName = (n) => { const p = String(n || "").split(" "); return p.length === 2 && NAME_A.includes(p[0]) && NAME_B.includes(p[1]); };
export const randomCode = (rnd = Math.random) => `${pick(CODE_A, rnd)}-${pick(CODE_B, rnd)}-${String(Math.floor(rnd() * 90) + 10)}`;
export const cleanCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
export const CODE_RE = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{2}$/;
// which seat each joiner gets: host is Blue #1; then Orange, Blue, Orange...
export function seatOrder(size) { const s = []; for (let i = 0; i < size; i++) { s.push(i); s.push(size + i); } return s; }
