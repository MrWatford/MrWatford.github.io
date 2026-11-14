// Turbo League — computer players.
// A bot "presses buttons" exactly like a person (throttle, steer, jump, boost...). It never gets
// extra speed or special physics. Higher levels think more often, aim better, read the ball further
// ahead, rotate between attack and defense, and know more moves (jump shots, dodges, aerials).
import { V } from "./physics.js";
import { ARENA, BALL, CAR, PHYS } from "./config.js";

// airSkill = how hard an air shot the bot will try (the push it needs, in m/s per second; boost gives at most ~9.9)
export const LEVELS = [
  { name: "Rookie",   think: 0.42, react: 0.45, aimErr: 0.55, boost: 0.1,  jump: false, dodge: false, aerial: false, rotate: false, throttle: 0.75, horizon: 1.2, kickBoost: false, recover: 0.4 },
  { name: "Amateur",  think: 0.3, react: 0.32, aimErr: 0.32, boost: 0.45, jump: true,  dodge: false, aerial: false, rotate: false, throttle: 0.95, horizon: 1.8, kickBoost: true,  recover: 0.7 },
  { name: "Pro",      think: 0.24, react: 0.16, aimErr: 0.18, boost: 0.75, jump: true,  dodge: true,  aerial: false, rotate: true,  throttle: 1,    horizon: 2.5, kickBoost: true,  recover: 1 },
  { name: "All-Star", think: 0.24, react: 0.16, aimErr: 0.16, boost: 0.6,  jump: true,  dodge: true,  aerial: true, airSkill: 6.0, rotate: true,  throttle: 0.94, horizon: 2.5, kickBoost: true,  recover: 1 },
  { name: "Champion", think: 0.23, react: 0.14, aimErr: 0.15, boost: 0.7,  jump: true,  dodge: true,  aerial: true, airSkill: 7.0, rotate: true,  throttle: 0.97, horizon: 2.5, kickBoost: true,  recover: 1 },
  { name: "Legend",   think: 0.22, react: 0.12, aimErr: 0.14, boost: 0.8,  jump: true,  dodge: true,  aerial: true, airSkill: 7.6, rotate: true,  throttle: 1,    horizon: 2.5, kickBoost: true,  recover: 1 },
];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const flat = (v) => new V(v.x, 0, v.z);
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const BLANK = () => ({ throttle: 0, steer: 0, pitch: 0, roll: 0, jump: false, boost: false, slide: false });

export class Bot {
  constructor(match, player, level = 2, style = {}) {
    this.m = match; this.p = player; this.car = player.car; this.level = level; this.L = LEVELS[clamp(level, 0, 5)];
    // style: team personality for later tournaments (aggression 0..1 pushes support players forward, boostGreed 0..1)
    this.style = Object.assign({ aggression: 0.5, boostGreed: 0.5 }, style);
    // each match shuffles every bot's randomness (a fixed seed made the same bot "lucky" in every game)
    this.seed = 1 + ((match.o.seed * 48271 + player.idx * 7919 + level * 131) % 2147483646);
    this.reset();
  }
  rand() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; }
  reset() { this.planT = 0; this.seq = null; this.mode = "idle"; this.target = null; this.stuckT = 0; this.aerial = null; this.aimAngle = 0; this.boostOK = true; this.cool = 0; this.info = {}; }
  get sideSign() { return this.p.team === 0 ? -1 : 1; }           // own goal is at z = sideSign * hz
  get attackZ() { return -this.sideSign * ARENA.hz; }

  update(dt) {
    this.cool -= dt;
    this.planT -= dt;
    // someone touched the ball: re-think after this level's reaction time
    const touch = this.m.world.ball.touch;
    if (touch !== this.seenTouch) { this.seenTouch = touch; this.planT = Math.min(this.planT, this.L.react); }
    if (this.planT <= 0) { this.planT = this.L.think; this.plan(); }
    if (this.seq) return this.runSeq(dt);
    return this.act(dt);
  }

  // ---------- deciding what to do (runs every `think` seconds = reaction time) ----------
  plan() {
    const m = this.m, W = m.world, car = this.car, ball = W.ball;
    const pred = m.prediction();
    const mates = m.players.filter((p) => p.team === this.p.team);
    this.boostOK = this.rand() < this.L.boost;
    // pick a new aim (with this level's accuracy) about once a second, not every decision
    if (!(this.aimT > 0)) { this.aimAngle = (this.rand() - 0.5) * 2 * this.L.aimErr; this.aimT = 1; }
    this.aimT -= this.L.think;
    const ownGoal = new V(0, 0, this.sideSign * (ARENA.hz - 1));

    // kickoff: the closest player on each team goes for the ball, the others hang back
    if (!m.kickoffTouched && ball.pos.len() < 1.5 && ball.vel.len() < 1) {
      const order = mates.slice().sort((a, b) => hdist(a.car.pos, ball.pos) - hdist(b.car.pos, ball.pos) || a.idx - b.idx);
      if (order[0] === this.p) { this.mode = "kickoff"; this.target = ball.pos.clone(); return; }
      this.mode = order.indexOf(this.p) === order.length - 1 && mates.length > 2 ? "goalie" : "support";
    } else {
      // roles: whoever can reach the ball first attacks; the one farthest back defends
      const eta = (p) => this.eta(p.car, ball.pos);
      const byEta = mates.slice().sort((a, b) => eta(a) - eta(b) || a.idx - b.idx);
      const byBack = mates.slice().sort((a, b) => (b.car.pos.z - a.car.pos.z) * -this.sideSign);
      if (byEta[0] === this.p) this.mode = "attack";
      else if (mates.length >= 2 && byBack[0] === this.p) this.mode = "goalie";
      else this.mode = "support";
      // a smart player who is on the wrong side of the ball goes back first
      if (this.mode === "attack" && this.L.rotate) {
        const goalSide = (ball.pos.z - car.pos.z) * -this.sideSign > -6; // car is not far past the ball
        const danger = (m.threat && m.threat.goal === this.p.team) || Math.abs(ball.pos.z - ownGoal.z) < 22;
        // only fall back when the opponent will win the ball anyway; otherwise challenge it
        if (!goalSide && danger && this.oppEta(ball.pos) < this.eta(car, ball.pos) - 0.2) this.mode = "retreat";
      }
    }

    if (this.mode === "attack" || this.mode === "kickoff") {
      const ip = this.mode === "kickoff" ? pred[0] : this.intercept(pred);
      this.info.ip = ip;
      // shoot toward the opponents' goal, or clear it away from our goal when it's close to home
      const nearHome = Math.abs(ip.p.z - ownGoal.z) < 18;
      const aim = nearHome && this.L.rotate ? new V(ip.p.x * 3 + (ip.p.x >= 0 ? 20 : -20), 0, ip.p.z - this.sideSign * 30) : new V(0, 0, this.attackZ);
      let dir = flat(V.sub(aim, ip.p)).norm();
      const c = Math.cos(this.aimAngle), s = Math.sin(this.aimAngle);
      dir = new V(dir.x * c - dir.z * s, 0, dir.x * s + dir.z * c);
      this.shotDir = dir;
      const contact = ip.p.clone().addS(dir, -(BALL.r + CAR.half[2] * 0.8));
      const ahead = V.sub(flat(car.pos), flat(ip.p)).dot(dir); // >0 means the car is past the ball
      // circle round to the good side only when there's time before an opponent gets there
      if (this.L.rotate && ahead > 1.5 && this.mode !== "kickoff" && this.eta(car, ip.p) + 1.0 < this.oppEta(ip.p)) {
        // go around: aim at a spot behind the ball, off to the side we're already on
        const side = new V(-dir.z, 0, dir.x); const sgn = Math.sign(V.sub(car.pos, ip.p).dot(side)) || 1;
        this.target = ip.p.clone().addS(dir, -5).addS(side, 3.5 * sgn);
      } else {
        // curve in: aim at a point behind the ball that slides toward the ball as we get closer,
        // so the car arrives lined up with the shot instead of side-on
        const d = hdist(car.pos, ip.p), back = clamp(d * 0.38, BALL.r + 0.4, 7);
        this.target = this.L.rotate || this.level >= 1 ? ip.p.clone().addS(dir, -back) : ip.p.clone();
        if (d < 2.2) this.target = ip.p.clone().addS(dir, 0.5);
      }
      this.target.y = 0;
    } else if (this.mode === "retreat") {
      this.target = new V(Math.sign(car.pos.x || 1) * 5, 0, this.sideSign * (ARENA.hz - 3));
    } else if (this.mode === "goalie") {
      const toBall = flat(V.sub(ball.pos, ownGoal)).norm();
      this.target = ownGoal.clone().addS(toBall, 3 + (1 - this.style.aggression) * 1.5); this.target.y = 0;
    } else { // support: hang between ball and our goal, off to one side; grab boost when low
      const p = ball.pos.clone().addS(V.sub(ownGoal, ball.pos), 0.4 - this.style.aggression * 0.2);
      p.x += (ball.pos.x > 0 ? -1 : 1) * 10; p.y = 0;
      this.target = p;
      if (this.car.boost < 30 + this.style.boostGreed * 20) { const pad = this.nearestPad(true); if (pad) this.target = new V(pad.x, 0, pad.z); }
    }
  }
  // rough time for a car to reach a point (used to pick the attacker and the intercept point)
  eta(car, p) {
    const d = hdist(car.pos, p), f = car.forward, to = flat(V.sub(p, car.pos)).norm();
    const ang = Math.acos(clamp(flat(f).norm().dot(to), -1, 1));
    const v = Math.max(0, car.vel.dot(to)), top = car.boost > 10 ? 20 : 14;
    return d / Math.max(6, (v + top) / 2) + ang * 0.4;
  }
// earliest point on the ball's path that a jump + boost can actually reach in time (physics check, not a guess)
aerialTarget(pred) {
  const car = this.car, U = car.up, g = PHYS.gravity;
  for (let k = 30; k < Math.min(pred.length, 150); k += 3) {
    const s = pred[k]; if (s.p.y < 3.2 || Math.abs(s.p.z) > ARENA.hz - 1) continue;
    const T = s.t - 0.25; if (T < 0.35) continue;
    const p0 = car.pos.clone().addS(U, 0.55).addS(car.vel, 0.25), v0 = car.vel.clone().addS(U, 4.2);
    const need = V.sub(s.p, p0).addS(v0, -T).scale(2 / (T * T)); need.y += g;
    if (need.len() < (this.L.airSkill || 0) && T * 33 < car.boost + 5) {
      // only if the ball is roughly in front and we'd be hitting it toward the right end
      const toB = flat(V.sub(s.p, car.pos)).norm(); if (flat(car.forward).norm().dot(toB) < 0.75) return null;
      if ((s.p.z - car.pos.z) * -this.sideSign < -2) return null;
      return { p: s.p, t: s.t, k };
    }
  }
  return null;
}
  oppEta(p) { let best = 99; for (const q of this.m.players) if (q.team !== this.p.team) best = Math.min(best, this.eta(q.car, p)); return best; }
  intercept(pred) {
    const maxH = this.L.aerial ? (this.car.boost > 30 ? 9 : 3) : this.L.jump ? 2.9 : 1.6;
    const last = Math.min(pred.length - 1, Math.round(this.L.horizon * 60));
    for (let k = 0; k <= last; k += 2) {
      const s = pred[k]; if (s.p.y > maxH || Math.abs(s.p.z) > ARENA.hz) continue;
      if (this.eta(this.car, s.p) <= s.t) return s;
    }
    return pred[last];
  }
  nearestPad(bigOnly) {
    let best = null, bd = 1e9;
    for (const p of this.m.world.pads) {
      if (p.timer > 0 || (bigOnly && !p.big)) continue;
      if ((p.z - this.sideSign * ARENA.hz) * -this.sideSign > ARENA.hz * 1.2) continue; // stay on our side-ish
      const d = Math.hypot(p.x - this.car.pos.x, p.z - this.car.pos.z); if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  // ---------- doing it (every physics step) ----------
  act(dt) {
    const car = this.car, W = this.m.world, ball = W.ball, inp = BLANK();
    if (this.aerial) return this.flyAerial(dt);
    if (car.contacts === 0) { // in the air: land on the wheels
      if (this.rand() < this.L.recover) this.orient(flat(car.vel).len() > 2 ? flat(car.vel).norm() : flat(car.forward).norm(), new V(0, 1, 0), inp);
      inp.throttle = 1; return inp;
    }
    let target = this.target || ball.pos;
    if (car.up.y < 0.55) target = new V(car.pos.x * 0.6, 0, car.pos.z * 0.85); // on a wall: come back down
    const mode = this.mode;
    const arrive = mode === "goalie" || mode === "support";
    this.driveTo(target, inp, { boost: mode === "kickoff" ? this.L.kickBoost : (mode === "attack" || mode === "retreat") && this.boostOK, arrive });
    const local = car.q.rot(V.sub(ball.pos, car.pos), true), bd = Math.hypot(local.x, local.z), bang = Math.atan2(local.x, local.z);
    // goalie / support: once in position, turn to face the ball
    if (arrive && hdist(car.pos, target) < 2.5) { inp.throttle = Math.abs(bang) > 0.5 ? 0.4 : 0; inp.steer = clamp(-bang * 2, -1, 1); inp.boost = false; }
    // moves near the ball
    const speed = car.vel.dot(car.forward);
    if ((mode === "attack" || mode === "kickoff") && car.onGround && this.cool <= 0) {
      const ip = this.info.ip;
      if (mode === "kickoff" && this.L.dodge && bd < 3.3) return this.startSeq(this.dodgeSeq(0), inp);
      const lined = this.shotDir ? flat(car.forward).norm().dot(this.shotDir) : 0;
      // dodge shots are switched off until Milestone 4 makes them reliable (they lost more goals than they scored)
      if (this.L.dodgeShots && ball.pos.y < 1.2 && bd < 2.05 && bd > 1.2 && Math.abs(bang) < 0.15 && lined > 0.93 && speed > 8 && local.z > 0) return this.startSeq(this.dodgeSeq(clamp(-bang * 2, -0.6, 0.6)), inp);
      if (this.L.jump && ball.pos.y > 1.6 && ball.pos.y < 3.0 && Math.abs(bang) < 0.3 && bd < 0.9 + Math.max(0, speed) * 0.2 && Math.abs(ball.vel.y) < 4) {
        const hold = clamp((ball.pos.y - 1.2) / 8, 0.02, 0.2); return this.startSeq([{ d: hold, i: { jump: true, throttle: 1 } }, { d: 0.45, i: { throttle: 1 } }], inp);
      }
if (this.L.aerial && car.boost > 20 && car.up.y > 0.9 && Math.abs(bang) < 0.6) {
  const air = this.aerialTarget(this.m.prediction());
  if (air) {
  this.aerial = { target: air.p.clone(), tEnd: W.time + air.t, start: W.time, k: air.k };
        return this.startSeq([{ d: 0.2, i: { jump: true, boost: true } }], inp);
        }
      }
    }
    // stuck? back up for a moment
    if (Math.abs(speed) < 0.8 && Math.abs(inp.throttle) > 0.5) { this.stuckT += dt; if (this.stuckT > 1.2) { this.stuckT = 0; return this.startSeq([{ d: 0.7, i: { throttle: -1, steer: this.rand() < 0.5 ? -1 : 1 } }], inp); } } else this.stuckT = 0;
    inp.throttle *= this.L.throttle;
    return inp;
  }
  driveTo(target, inp, { boost = false, arrive = false } = {}) {
    const car = this.car, local = car.q.rot(V.sub(target, car.pos), true);
    const ang = Math.atan2(local.x, local.z), dist = Math.hypot(local.x, local.z), vF = car.vel.dot(car.forward);
    inp.steer = clamp(-ang * 3, -1, 1); inp.throttle = 1;
    if (Math.abs(ang) > 2.0 && dist < 9 && vF < 5) { inp.throttle = -1; inp.steer = Math.sign(ang) || 1; }
    if (arrive) { const want = clamp(dist * 1.3, 0, 14); inp.throttle = vF < want ? 1 : vF > want + 2 ? -1 : 0.05; }
    // too fast to make a tight turn toward a nearby target? ease off (stops the car circling around the ball)
    else if (this.level >= 1 && dist < 9 && Math.abs(ang) > 0.7) { const turnR = 1 / Math.max(0.09, 0.69 - vF * 0.025); if (turnR * Math.sin(Math.min(Math.abs(ang), 1.57)) * 2 > dist) inp.throttle = vF > 4 ? -0.3 : 0.6; }
    inp.slide = car.onGround && Math.abs(ang) > 1.3 && vF > 7;
    inp.boost = boost && Math.abs(ang) < 0.3 && vF < 22.5 && dist > 5 && car.boost > 0;
    return { ang, dist };
  }
  // point the car's nose along `fwd` with its roof toward `up` (used in the air)
  orient(fwd, up, inp) {
    const car = this.car, f = car.q.rot(fwd, true), u = car.q.rot(up, true), w = car.q.rot(car.ang, true);
    const pitchErr = Math.atan2(-f.y, f.z), yawErr = Math.atan2(f.x, f.z), rollErr = Math.atan2(-u.x, u.y);
    inp.pitch = clamp(3 * pitchErr - 0.7 * w.x, -1, 1);
    inp.steer = -clamp(3 * yawErr - 0.7 * w.y, -1, 1);
    inp.roll = clamp(2.5 * rollErr - 0.4 * w.z, -1, 1);
    inp.slide = false;
    return Math.acos(clamp(f.z / Math.max(1e-6, Math.hypot(f.x, f.y, f.z)), -1, 1));
  }
  flyAerial() {
    const car = this.car, W = this.m.world, a = this.aerial, inp = BLANK();
    const T = Math.max(0.15, a.tEnd - W.time);
    { const pr = this.m.prediction(), kk = Math.min(pr.length - 1, Math.max(0, Math.round(T * 60))); a.target = pr[kk].p.clone(); }
    if (W.time > a.tEnd + 0.5 || (car.contacts > 0 && W.time - a.start > 0.4) || (W.ball.touch && W.ball.touch.car === car.id && W.ball.touch.time > a.start)) { this.aerial = null; return inp; }
    // the push needed to arrive on time, plus holding up against gravity
    const D = V.sub(a.target, car.pos), need = D.clone().addS(car.vel, -T).scale(2 / (T * T)); need.y += PHYS.gravity;
    const dir = need.clone().norm();
    const off = this.orient(dir, new V(0, 1, 0), inp);
    inp.boost = off < 0.5 && need.len() > 3 && car.boost > 0;
    inp.throttle = 1;
    if (W.time - a.start < 0.35) inp.jump = true;
    return inp;
  }
  dodgeSeq(side) { return [{ d: 0.03, i: { jump: true, throttle: 1 } }, { d: 0.03, i: { throttle: 1 } }, { d: 0.1, i: { jump: true, pitch: 1, steer: side, throttle: 1 } }, { d: 0.55, i: { throttle: 1, pitch: 1 } }]; }
  startSeq(seq, inp) { this.seq = { steps: seq, i: 0, t: 0 }; this.cool = 1.0; return this.runSeq(0, inp); }
  runSeq(dt) {
    const s = this.seq; s.t += dt;
    while (s.i < s.steps.length && s.t >= s.steps[s.i].d) { s.t -= s.steps[s.i].d; s.i++; }
    if (s.i >= s.steps.length) { this.seq = null; return this.act(0); }
    const inp = Object.assign(BLANK(), s.steps[s.i].i);
    if (this.aerial && this.m.world.time - this.aerial.start > 0.05) { const a = this.flyAerial(); a.jump = inp.jump; return a; }
    return inp;
  }
}
