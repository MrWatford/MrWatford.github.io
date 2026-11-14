// Turbo League — the physics simulation.
// Pure math, no graphics: it runs the same in the browser and in Node (for the automated tests).
// The game calls world.step() a fixed 120 times per second, so the result never depends on
// how fast the computer draws frames.
//
// Big idea: the arena is described by ONE "distance function" — for any point it tells how far
// that point is from the nearest wall/floor/ceiling (negative = inside the play space). The ball,
// the wheels and the car body all collide with that one shape, so curved ramps, walls, the
// ceiling and the goals all behave consistently, and the drawn stadium is built from the same numbers.

import { ARENA, PHYS, BALL, CAR, HIT, BOOST, boostPads } from "./config.js";

// ---------- tiny vector + quaternion math ----------
export class V {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new V(this.x, this.y, this.z); }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  addS(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) { return new V(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); }
  len() { return Math.hypot(this.x, this.y, this.z); }
  norm() { const l = this.len(); if (l > 1e-9) this.scale(1 / l); return this; }
  static sub(a, b) { return new V(a.x - b.x, a.y - b.y, a.z - b.z); }
}
export class Q {
  constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
  copy(q) { this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w; return this; }
  static axis(ax, ay, az, ang) { const s = Math.sin(ang / 2); return new Q(ax * s, ay * s, az * s, Math.cos(ang / 2)); }
  mul(b) { const a = this; return new Q(a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y, a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x, a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w, a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z); }
  // rotate a vector by this rotation (or by its inverse)
  rot(v, inv = false) {
    const qx = inv ? -this.x : this.x, qy = inv ? -this.y : this.y, qz = inv ? -this.z : this.z, qw = this.w;
    const tx = 2 * (qy * v.z - qz * v.y), ty = 2 * (qz * v.x - qx * v.z), tz = 2 * (qx * v.y - qy * v.x);
    return new V(v.x + qw * tx + (qy * tz - qz * ty), v.y + qw * ty + (qz * tx - qx * tz), v.z + qw * tz + (qx * ty - qy * tx));
  }
  norm() { const l = Math.hypot(this.x, this.y, this.z, this.w) || 1; this.x /= l; this.y /= l; this.z /= l; this.w /= l; return this; }
  // advance the rotation by angular velocity w (world space) for dt seconds
  integrate(w, dt) {
    const h = dt * 0.5, x = this.x, y = this.y, z = this.z, s = this.w;
    this.x += h * (w.x * s + w.y * z - w.z * y); this.y += h * (w.y * s + w.z * x - w.x * z);
    this.z += h * (w.z * s + w.x * y - w.y * x); this.w += h * (-w.x * x - w.y * y - w.z * z);
    return this.norm();
  }
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerpTable = (t, xs, ys) => { if (t <= xs[0]) return ys[0]; for (let i = 1; i < xs.length; i++) if (t <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (t - xs[i - 1]) / (xs[i] - xs[i - 1]); return ys[ys.length - 1]; };

// ---------- the arena shape ----------
function sdRoundRect(px, pz, bx, bz, r) {
  const qx = Math.abs(px) - bx + r, qz = Math.abs(pz) - bz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}
function sdBox(px, py, pz, cx, cy, cz, bx, by, bz) {
  const qx = Math.abs(px - cx) - bx, qy = Math.abs(py - cy) - by, qz = Math.abs(pz - cz) - bz;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}
// The main bowl: a box with round vertical corners (cornerR) and round floor/ceiling edges (edgeR).
export function sdArenaBowl(x, y, z, A = ARENA) {
  const e = A.edgeR;
  const w = sdRoundRect(x, z, A.hx - e, A.hz - e, Math.max(A.cornerR - e, 0.01));
  const qy = Math.abs(y - A.h / 2) - (A.h / 2 - e);
  return Math.hypot(Math.max(w, 0), Math.max(qy, 0)) + Math.min(Math.max(w, qy), 0) - e;
}
// Goal boxes reach back into the field a little so the ramp in front of each goal is flattened.
export function goalBox(sign, A = ARENA) {
  const z0 = A.hz - A.edgeR - 0.5, z1 = A.hz + A.goalD;
  return { cx: 0, cy: A.goalH / 2, cz: sign * (z0 + z1) / 2, bx: A.goalW / 2, by: A.goalH / 2, bz: (z1 - z0) / 2 };
}
const GB = [goalBox(1), goalBox(-1)];
export function refreshArena() { GB[0] = goalBox(1); GB[1] = goalBox(-1); }
// distance from the play-space boundary: negative inside, positive inside the walls
export function sdf(x, y, z) {
  let d = sdArenaBowl(x, y, z);
  for (const g of GB) d = Math.min(d, sdBox(x, y, z, g.cx, g.cy, g.cz, g.bx, g.by, g.bz));
  return d;
}
// direction pointing from the nearest wall back into the play space
export function normalIn(p) {
  const e = 0.004;
  const n = new V(sdf(p.x - e, p.y, p.z) - sdf(p.x + e, p.y, p.z), sdf(p.x, p.y - e, p.z) - sdf(p.x, p.y + e, p.z), sdf(p.x, p.y, p.z - e) - sdf(p.x, p.y, p.z + e));
  return n.norm();
}

// ---------- the ball ----------
export class Ball {
  constructor() { this.pos = new V(0, BALL.r, 0); this.vel = new V(); this.ang = new V(); this.touch = null; this.contact = false; }
  reset() { this.pos.set(0, BALL.r + 0.02, 0); this.vel.set(0, 0, 0); this.ang.set(0, 0, 0); this.touch = null; }
  step(dt, world) {
    const B = BALL;
    this.vel.y -= PHYS.gravity * dt;
    this.vel.scale(1 - B.drag * dt);
    this.pos.addS(this.vel, dt);
    this.contact = false;
    const pen = sdf(this.pos.x, this.pos.y, this.pos.z) + B.r;
    if (pen > 0) {
      this.contact = true;
      const n = normalIn(this.pos);
      this.pos.addS(n, pen);
      const vn = this.vel.dot(n);
      if (vn < 0) {
        const e = vn < -1 ? B.restitution : 0;              // no tiny endless bounces when resting
        const jn = -(1 + e) * vn;
        this.vel.addS(n, jn);
        // friction at the contact point makes the ball spin and roll
        const r = n.clone().scale(-B.r);
        const vc = this.vel.clone().add(this.ang.cross(r));
        const vt = vc.clone().addS(n, -vc.dot(n));
        const vtl = vt.len();
        if (vtl > 1e-6) {
          const maxJ = B.friction * Math.max(jn, PHYS.gravity * dt);
          const jl = Math.min(vtl / 3.5, maxJ);
          const J = vt.scale(-jl / vtl);
          this.vel.add(J);
          this.ang.add(r.cross(J).scale(2.5 / (B.r * B.r)));
        }
        if (-vn > 2) world.emit({ type: "bounce", strength: clamp(-vn / 25, 0, 1), pos: this.pos.clone(), n });
      }
    }
    const s = this.vel.len(); if (s > B.maxSpeed) this.vel.scale(B.maxSpeed / s);
    const w = this.ang.len(); if (w > B.maxSpin) this.ang.scale(B.maxSpin / w);
  }
}

// ---------- the car ----------
const ZERO_INPUT = { throttle: 0, steer: 0, pitch: 0, roll: 0, jump: false, boost: false, slide: false };
export class Car {
  constructor(team = 0, id = 0) {
    this.team = team; this.id = id;
    this.pos = new V(); this.vel = new V(); this.q = new Q(); this.ang = new V();
    this.boost = BOOST.start;
    const C = CAR;
    this.wheels = [[C.wheelX, C.wheelFront], [-C.wheelX, C.wheelFront], [C.wheelX, C.wheelRear], [-C.wheelX, C.wheelRear]].map(([x, z]) => ({
      anchor: new V(x, C.wheelY, z), comp: 0, prevComp: 0, contact: false, normal: new V(0, 1, 0), point: new V(), spin: 0, steer: 0, front: z > 0,
    }));
    this.resetState();
  }
  resetState() {
    this.onGround = false; this.contacts = 0; this.jumping = false; this.jumpT = 0; this.hasJumped = false; this.hasFlipped = false;
    this.sinceJump = 0; this.dodging = false; this.dodgeT = 0; this.dodgeDir = [0, 0]; this.prevJump = false; this.jumpGrace = 0;
    this.boosting = false; this.supersonic = false; this.sliding = false; this.yawRate = 0; this.hitCooldown = 0; this.bodyTouch = 0;
    this.input = ZERO_INPUT; this.frozen = false; this.groundNormal = new V(0, 1, 0);
  }
  place(x, z, yaw) {
    this.pos.set(x, 0.355, z); this.vel.set(0, 0, 0); this.ang.set(0, 0, 0);
    this.q = Q.axis(0, 1, 0, yaw); this.boost = BOOST.start; this.resetState();
    for (const w of this.wheels) { w.comp = w.prevComp = 0.017; w.contact = true; }
  }
  get forward() { return this.q.rot(new V(0, 0, 1)); }
  get up() { return this.q.rot(new V(0, 1, 0)); }
  get left() { return this.q.rot(new V(1, 0, 0)); }
  speed() { return this.vel.len(); }
  invI(v) { // inverse inertia, world space
    const l = this.q.rot(v, true), I = CAR.inertia;
    return this.q.rot(new V(l.x / I[0], l.y / I[1], l.z / I[2]));
  }
  // push the car at a world point with an impulse (instant velocity change)
  impulseAt(J, p) {
    this.vel.add(J);
    const r = V.sub(p, this.pos);
    this.ang.add(this.invI(r.cross(J)));
  }
  // one physics step
  step(dt, input, world) {
    const C = CAR; input = input || ZERO_INPUT; this.input = input;
    if (this.frozen) { this.prevJump = input.jump; return; }
    const U = this.up, F = this.forward;
    const jumpPressed = input.jump && !this.prevJump; this.prevJump = input.jump;
    this.hitCooldown -= dt; this.jumpGrace -= dt; this.sinceJump += dt;

    // --- suspension: each wheel is a ball on a spring, pushed down until it meets the arena
    let contacts = 0; const nSum = new V();
    const acc = new V(0, -PHYS.gravity, 0), angAcc = new V();
    for (const w of this.wheels) {
      const anchor = this.q.rot(w.anchor).add(this.pos);
      let t = 0, hit = false;
      for (let i = 0; i < 10; i++) {
        const p = anchor.clone().addS(U, -t);
        const d = -sdf(p.x, p.y, p.z) - C.wheelR;
        if (d < 0.002) { hit = true; break; }
        t += d; if (t > C.suspRest) break;
      }
      w.prevComp = w.comp;
      if (hit && t <= C.suspRest) {
        w.contact = true; contacts++;
        w.comp = C.suspRest - t;
        const center = anchor.clone().addS(U, -t);
        w.normal = normalIn(center); nSum.add(w.normal);
        w.point = center.clone().addS(w.normal, -C.wheelR);
        const f = Math.max(0, C.springK * w.comp + C.springC * (w.comp - w.prevComp) / dt);
        const Fv = U.clone().scale(f);
        acc.add(Fv);
        angAcc.add(this.invI(V.sub(center, this.pos).cross(Fv)));
      } else { w.contact = false; w.comp = 0; }
    }
    this.contacts = contacts;
    const grounded = contacts >= 3 && this.jumpGrace <= 0;
    if (contacts > 0) this.groundNormal = nSum.clone().norm();
    // a flip that lands on its wheels stops spinning right away (this is what makes wave dashes work)
    if (this.dodging && contacts >= 2 && this.dodgeT > 0.03) { this.dodging = false; const n0 = contacts > 0 ? nSum.clone().norm() : U; this.ang = n0.clone().scale(this.ang.dot(n0)); }
    if (grounded && !this.jumping) { this.hasJumped = false; this.hasFlipped = false; this.dodging = false; this.sinceJump = 0; }
    this.onGround = grounded;

    // --- boost
    this.boosting = !!input.boost && this.boost > 0;
    if (this.boosting) { acc.addS(F, C.boostAccel); this.boost = Math.max(0, this.boost - C.boostUse * dt); }

    // --- driving on wheels
    this.sliding = false;
    if (grounded) {
      const n = this.groundNormal;
      const Fg = F.clone().addS(n, -F.dot(n)).norm(), Lg = n.cross(Fg);
      const vF = this.vel.dot(Fg), vL = this.vel.dot(Lg);
      const thr = this.boosting ? 1 : input.throttle;
      let a = 0;
      if (Math.abs(thr) > 0.01) {
        if (vF * thr < 0 && Math.abs(vF) > 0.1) a = Math.sign(thr) * Math.min(C.brakeAccel, Math.abs(vF) / dt); // braking
        else {
          const s = Math.abs(vF);
          const curve = s < 14 ? C.throttleAccel - (C.throttleAccel - 1.6) * s / 14 : s < C.throttleTop ? 1.6 * (C.throttleTop - s) / (C.throttleTop - 14) : 0;
          a = thr * curve * (thr < 0 ? C.reverseScale : 1);
        }
      } else if (Math.abs(vF) > 0.01) a = -Math.sign(vF) * Math.min(C.coastDecel, Math.abs(vF) / dt);
      this.vel.addS(Fg, a * dt);
      // sideways grip (lower while powersliding = drifting)
      this.sliding = !!input.slide && Math.abs(vF) > 1;
      const g = input.slide ? C.slideGrip : C.grip;
      const sp0 = Math.hypot(vF, vL);
      this.vel.addS(Lg, -vL * Math.min(1, g * dt));
      if (input.slide) { // a drift swings the car around without throwing away most of its speed
        const vF2 = this.vel.dot(Fg), vL2 = this.vel.dot(Lg), sp1 = Math.hypot(vF2, vL2);
        if (sp1 > 0.1 && sp0 > sp1) { const k = (sp1 + (sp0 - sp1) * 0.8) / sp1 - 1; this.vel.addS(Fg, vF2 * k).addS(Lg, vL2 * k); }
      }
      if (Math.abs(vL) > 4 && !input.slide) this.sliding = true; // skidding
      // steering: the turn rate depends on speed (sharper when slow)
      const curv = lerpTable(Math.abs(vF), [0, 5, 10, 15, 17.5, 23], [0.69, 0.398, 0.235, 0.1375, 0.11, 0.088]);
      let target = -input.steer * curv * vF * (input.slide ? C.slideTurn : 1);
      const wn = this.ang.dot(n);
      this.ang.addS(n, (target - wn) * Math.min(1, C.steerRate * dt));
      // stick to the surface (this is what lets you drive up the walls)
      acc.addS(n, -C.sticky);
    } else if (contacts > 0 && this.jumpGrace <= 0) {
      acc.addS(this.groundNormal, -C.sticky); // partly on wheels: still a little sticky
    }

    // --- jumping, double jumps and dodges (flips)
    if (jumpPressed) {
      if (grounded) {
        this.vel.addS(U, C.jumpImpulse); this.jumping = true; this.jumpT = 0; this.hasJumped = true; this.sinceJump = 0; this.jumpGrace = 0.1;
        world.emit({ type: "jump", car: this });
      } else if (contacts === 0 && this.bodyTouch > 0 && U.y < -0.3) {
        // upside down on the floor: hop and roll back over (landing recovery)
        this.vel.addS(this.groundNormalBody || new V(0, 1, 0), 3.2); this.ang = this.q.rot(new V(0, 0, 6.5));
        this.hasJumped = true; this.hasFlipped = true; this.sinceJump = 0;
      } else if (contacts === 0 && !this.hasFlipped && (!this.hasJumped || this.sinceJump < C.doubleJumpWindow)) {
        this.hasFlipped = true;
        const f = input.pitch, s = input.steer, m = Math.hypot(f, s);
        if (m > C.dodgeDeadzone) {
          const fn = f / Math.max(m, 1), sn = s / Math.max(m, 1);
          const Fh = new V(F.x, 0, F.z).norm(), Rh = new V(-this.left.x, 0, -this.left.z).norm();
          const dir = Fh.clone().scale(fn).addS(Rh, sn).norm();
          this.vel.addS(dir, C.dodgeImpulse);
          if (this.vel.y < 0) this.vel.y = 0;
          this.dodging = true; this.dodgeT = 0; this.dodgeDir = [fn, sn];
          this.ang = this.q.rot(new V(fn * C.dodgeSpin, 0, sn * C.dodgeSpin));
          world.emit({ type: "dodge", car: this, dir: [fn, sn] });
        } else {
          this.vel.addS(U, C.jumpImpulse);
          world.emit({ type: "jump", car: this, double: true });
        }
      }
    }
    if (this.jumping) {
      this.jumpT += dt;
      if (input.jump && this.jumpT < C.jumpHoldTime) acc.addS(U, C.jumpHold);
      else this.jumping = false;
    }

    // --- control in the air: pitch, yaw, roll (air roll = powerslide + steer, or the roll keys)
    if (contacts === 0) {
      const w = this.q.rot(this.ang, true);
      let pitch = input.pitch, yaw = -input.steer, roll = input.roll || 0;
      if (input.slide) { roll = input.steer; yaw = 0; }
      if (this.dodging) {
        this.dodgeT += dt;
        if (this.dodgeT < C.dodgeTime) {
          const [fn, sn] = this.dodgeDir;
          const cancel = fn !== 0 ? clamp(-pitch * Math.sign(fn), 0, 1) : 0; // hold the opposite way = flip cancel
          w.x = fn * C.dodgeSpin * (1 - cancel); pitch = 0;
          if (sn !== 0) { w.z = sn * C.dodgeSpin; roll = 0; }
        } else this.dodging = false;
      }
      w.x += (pitch * C.airPitch - C.airDampPitch * w.x * (1 - Math.abs(pitch))) * dt;
      w.y += (yaw * C.airYaw - C.airDampYaw * w.y * (1 - Math.abs(yaw))) * dt;
      w.z += (roll * C.airRoll - (this.dodging ? 0 : C.airDampRoll * w.z * (1 - Math.abs(roll)))) * dt;
      this.ang = this.q.rot(w);
    }

    // --- integrate
    this.vel.addS(acc, dt); this.ang.addS(angAcc, dt);
    const sp = this.vel.len(); if (sp > C.maxSpeed) this.vel.scale(C.maxSpeed / sp);
    const wl = this.ang.len(); if (wl > C.maxSpin) this.ang.scale(C.maxSpin / wl);
    this.pos.addS(this.vel, dt); this.q.integrate(this.ang, dt);

    // --- the car body and wheel bottoms can't go through the arena
    this.bodyTouch = Math.max(0, this.bodyTouch - dt);
    const h = C.half; let worst = 0, worstN = null;
    const pts = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(new V(sx * h[0], sy * h[1], sz * h[2]));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push(new V(sx * h[0], 0, sz * h[2]), new V(0, sx * h[1], sz * h[2]), new V(sx * h[0], sz * h[1], 0));
    for (const w of this.wheels) pts.push(w.anchor.clone().addS(new V(0, 1, 0), -C.wheelR));
    let bump = 0;
    for (const lp of pts) {
      const p = this.q.rot(lp).add(this.pos);
      const d = sdf(p.x, p.y, p.z);
      if (d <= 0) continue;
      const n = normalIn(p);
      const r = V.sub(p, this.pos);
      const vp = this.vel.clone().add(this.ang.cross(r));
      const vn = vp.dot(n);
      if (vn < 0) {
        const k = 1 + n.dot(this.invI(r.cross(n)).cross(r));
        const j = -(1 + C.bodyRestitution) * vn / k;
        this.impulseAt(n.clone().scale(j), p);
        bump = Math.max(bump, -vn);
        const vt = vp.clone().addS(n, -vn), vtl = vt.len();
        if (vtl > 1e-5) {
          const t = vt.scale(1 / vtl);
          const kt = 1 + t.dot(this.invI(r.cross(t)).cross(r));
          this.impulseAt(t.scale(-Math.min(vtl / kt, C.bodyFriction * j)), p);
        }
      }
      this.bodyTouch = 0.25; this.groundNormalBody = n;
      if (d > worst) { worst = d; worstN = n; }
    }
    if (worstN) this.pos.addS(worstN, worst);
    if (bump > 3) world.emit({ type: "carBump", car: this, strength: clamp(bump / 15, 0, 1) });

    const spd = this.vel.len();
    this.supersonic = this.supersonic ? spd > C.supersonic - 1 : spd > C.supersonic;
    // wheel spin for the drawing
    const vF = this.vel.dot(this.forward);
    for (const w of this.wheels) { w.spin += (w.contact ? vF : vF * 0.98) / C.wheelR * dt; w.steer = w.front ? input.steer * (0.5 - Math.min(0.3, Math.abs(vF) / 60)) : 0; }
  }
}

// ---------- car vs ball ----------
function carBall(car, ball, world) {
  const B = BALL, C = CAR, h = C.half;
  const local = car.q.rot(V.sub(ball.pos, car.pos), true);
  const cl = new V(clamp(local.x, -h[0], h[0]), clamp(local.y, -h[1], h[1]), clamp(local.z, -h[2], h[2]));
  const diff = V.sub(local, cl); let dist = diff.len();
  if (dist >= B.r) return;
  let nl;
  if (dist < 1e-6) { // ball center inside the box: push out the shortest way
    const gaps = [h[0] - Math.abs(local.x), h[1] - Math.abs(local.y), h[2] - Math.abs(local.z)];
    const i = gaps.indexOf(Math.min(...gaps));
    nl = new V(i === 0 ? Math.sign(local.x) || 1 : 0, i === 1 ? Math.sign(local.y) || 1 : 0, i === 2 ? Math.sign(local.z) || 1 : 0);
    dist = -gaps[i];
  } else nl = diff.scale(1 / dist);
  const n = car.q.rot(nl);
  const cp = car.q.rot(cl).add(car.pos);
  const pen = B.r - dist, mb = B.mass, mc = 1, tot = mb + mc;
  ball.pos.addS(n, pen * mc / tot); car.pos.addS(n, -pen * mb / tot);
  const r = V.sub(cp, car.pos);
  const before = ball.vel.clone();
  const vRel = ball.vel.clone().add(ball.ang.cross(n.clone().scale(-B.r))).sub(car.vel.clone().add(car.ang.cross(r)));
  const vn = vRel.dot(n);
  if (vn >= 0) return;
  const k = 1 / mb + 1 / mc + n.dot(car.invI(r.cross(n)).cross(r));
  const j = -vn / k; // no bounce: the car "carries" the ball, the extra kick below gives shots their pop
  ball.vel.addS(n, j / mb);
  car.impulseAt(n.clone().scale(-j), cp);
  // friction puts spin on the ball
  const vt = vRel.clone().addS(n, -vn), vtl = vt.len();
  if (vtl > 1e-5) {
    const jt = Math.min(vtl / (3.5 / mb), 0.35 * j) / mb;
    const J = vt.scale(-jt / vtl);
    ball.vel.add(J); ball.ang.add(n.clone().scale(-B.r).cross(J).scale(2.5 / (B.r * B.r)));
  }
  // the extra kick (once per 0.1 s, unless this hit is clearly harder than the last one - e.g. a flick from a dribble)
  // impact speed is measured at the touching spot, so a flipping car (spin) hits harder
  const ptVel = car.vel.clone().add(car.ang.cross(r));
  const rel = Math.min(46, V.sub(before, ptVel).len());
  if (car.hitCooldown <= 0 || rel > (car.lastKick || 0) + 3) {
    car.hitCooldown = 0.1; car.lastKick = rel;
    const F = car.forward;
    const dir = V.sub(ball.pos, car.pos); dir.y *= HIT.upFlatten; dir.addS(F, -HIT.forwardFlatten * dir.dot(F)); dir.norm();
    const s = lerpTable(rel, [0, 23, 46], [HIT.lowSpeed, HIT.midSpeed, HIT.highSpeed]);
    ball.vel.addS(dir, rel * s);
    ball.touch = { car: car.id, team: car.team, time: world.time, y: ball.pos.y };
    world.touches.push(ball.touch); if (world.touches.length > 20) world.touches.shift();
    world.emit({ type: "ballHit", car, strength: clamp(rel / 30, 0, 1), pos: cp.clone() });
  }
}

// ---------- car vs car: each car is a chain of 3 overlapping spheres along its length ----------
const CHAIN = [-0.4, 0, 0.4], CHAIN_R = 0.43;
function carCar(a, b, world) {
  if (V.sub(a.pos, b.pos).len() > 2.2) return;
  const pa = CHAIN.map((z) => a.q.rot(new V(0, 0, z)).add(a.pos)), pb = CHAIN.map((z) => b.q.rot(new V(0, 0, z)).add(b.pos));
  let best = null;
  for (const p of pa) for (const q of pb) { const d = V.sub(q, p), l = d.len(); if (l < 2 * CHAIN_R && (!best || l < best.l)) best = { p, q, d, l }; }
  if (!best || best.l < 1e-6) return;
  const n = best.d.scale(1 / best.l), pen = 2 * CHAIN_R - best.l;
  a.pos.addS(n, -pen / 2); b.pos.addS(n, pen / 2);
  const cp = best.p.clone().addS(n, CHAIN_R);
  const ra = V.sub(cp, a.pos), rb = V.sub(cp, b.pos);
  const vrel = b.vel.clone().add(b.ang.cross(rb)).sub(a.vel.clone().add(a.ang.cross(ra)));
  const vn = vrel.dot(n);
  if (vn >= 0) return;
  const k = 2 + n.dot(a.invI(ra.cross(n)).cross(ra)) + n.dot(b.invI(rb.cross(n)).cross(rb));
  const j = -(1 + 0.25) * vn / k;
  a.impulseAt(n.clone().scale(-j), cp); b.impulseAt(n.clone().scale(j), cp);
  if (-vn > 2) world.emit({ type: "carBump", car: a, other: b, strength: clamp(-vn / 15, 0, 1), pos: cp });
}

// ---------- the whole world ----------
export class World {
  constructor() {
    this.ball = new Ball(); this.cars = []; this.time = 0; this.tick = 0; this.score = [0, 0];
    this.pads = boostPads().map((p) => ({ ...p, timer: 0 }));
    this.events = []; this.goal = null; this.listeners = []; this.touches = [];
  }
  emit(e) { this.events.push(e); }
  addCar(team) { const c = new Car(team, this.cars.length); this.cars.push(c); return c; }
  // inputs: array with one input object per car
  step(inputs = []) {
    const dt = 1 / PHYS.hz;
    this.time += dt; this.tick++;
    this.cars.forEach((c, i) => c.step(dt, inputs[i], this));
    if (!this.ballFrozen) this.ball.step(dt, this);
// Every car hits the SAME starting ball, and all the pushes are added together.
// (Doing them one after another let whichever car came second win every 50/50 kickoff.)
const B0 = this.ball, hits = [];
for (const c of this.cars) {
  if (c.frozen) continue;
  const tb = { pos: B0.pos.clone(), vel: B0.vel.clone(), ang: B0.ang.clone(), touch: null };
  carBall(c, tb, this);
  if (tb.touch || tb.pos.x !== B0.pos.x || tb.pos.y !== B0.pos.y || tb.pos.z !== B0.pos.z || tb.vel.x !== B0.vel.x || tb.vel.y !== B0.vel.y || tb.vel.z !== B0.vel.z) hits.push(tb);
}
if (hits.length) {
  const p = B0.pos.clone(), v = B0.vel.clone(), w = B0.ang.clone();
  for (const h of hits) { p.add(V.sub(h.pos, B0.pos)); v.add(V.sub(h.vel, B0.vel)); w.add(V.sub(h.ang, B0.ang)); if (h.touch) B0.touch = h.touch; }
  B0.pos.copy(p); B0.vel.copy(v); B0.ang.copy(w);
  const sp = B0.vel.len(); if (sp > BALL.maxSpeed) B0.vel.scale(BALL.maxSpeed / sp);
}
    for (let i = 0; i < this.cars.length; i++) for (let k = i + 1; k < this.cars.length; k++) carCar(this.cars[i], this.cars[k], this);
    // boost pads
    for (const p of this.pads) {
      if (p.timer > 0) { p.timer -= dt; continue; }
      const R = p.big ? BOOST.bigR : BOOST.smallR;
      for (const c of this.cars) {
        if (c.boost >= 100) continue;
        const dx = c.pos.x - p.x, dz = c.pos.z - p.z;
        if (dx * dx + dz * dz < R * R && c.pos.y < BOOST.height) {
          c.boost = Math.min(100, c.boost + (p.big ? BOOST.bigAmount : BOOST.smallAmount));
          p.timer = p.big ? BOOST.bigRespawn : BOOST.smallRespawn;
          this.emit({ type: "pad", car: c, big: p.big, pad: p });
          break;
        }
      }
    }
    // goals: the whole ball has to cross the goal line
    if (!this.goal) {
      const z = this.ball.pos.z, lim = ARENA.hz + BALL.r;
      if (z > lim || z < -lim) {
        const team = z > 0 ? 0 : 1; // ball in Orange's goal (+z) = point for Blue (0)
        this.score[team]++;
        this.goal = { team, time: this.time, touch: this.ball.touch, speed: this.ball.vel.len() };
        this.emit({ type: "goal", team, touch: this.ball.touch, speed: this.goal.speed, pos: this.ball.pos.clone() });
      }
    }
  }
  takeEvents() { const e = this.events; this.events = []; return e; }
  resetPads() { for (const p of this.pads) p.timer = 0; }
}
