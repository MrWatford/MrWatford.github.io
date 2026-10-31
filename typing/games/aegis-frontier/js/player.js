// Aegis Frontier: the Guardian. First-person movement with collision, mantling, sliding, swimming,
// the Tether Gauntlet and other equipment, the energy repulse, throwables, and shields.
import * as THREE from "../lib/three.module.min.js";
import { clamp, lerp, approach, angleWrap } from "./util.js";
import { WATER_Y, QUIPS } from "./content.js";

export const P = {
  walk: 5.5, sprint: 8.2, crouch: 3.0, swim: 3.4, accel: 55, airAccel: 14, friction: 38, gravity: 22, jump: 7.4,
  radius: 0.4, height: 1.8, crouchH: 1.1, step: 0.45, eye: 0.14,
};
const TMP = new THREE.Vector3(), NRM = new THREE.Vector3();

export class Player {
  constructor(G) {
    this.G = G;
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.h = P.height; this.eyeY = P.height - P.eye;
    this.grounded = false; this.coyote = 0; this.swimming = false;
    this.slide = 0; this.mantle = null; this.tether = null; this.dashT = 0;
    this.shield = 100; this.suit = 100; this.lastHit = -99; this.shieldBroken = false; this.recharging = false;
    this.cd = { tether: 0, beacon: 0, barrier: 0, dash: 0, repulse: 0, throw: 0 };
    this.dashCharges = 1;
    this.equipSel = "tether";
    this.throwSel = "emp"; this.throwables = { emp: 2, stasis: 2 };
    this.carry = null;
    this.barrier = null;
    this.invuln = 0;
    this.lastSafe = new THREE.Vector3(); this.safeT = 0;
    this.stepT = 0; this.landDip = 0; this.shake = 0; this.bob = 0; this.speed2d = 0;
    this.hitDirs = [];
    this.vehicle = null;
    this.combatT = -99;
    this.stuckT = 0;
    this.buildBarrierMesh();
  }

  get up() { return this.G.state.upgrades; }
  tier(track) { return this.up[track] || 0; }
  get shieldMax() { const t = this.tier("shield"); return t >= 4 ? 150 : t >= 1 ? 125 : 100; }
  get rechargeDelay() { return this.tier("shield") >= 2 ? 3 : 4; }
  get rechargeRate() { return 32 * (this.tier("shield") >= 3 ? 1.5 : 1) * (this.G.diff.shieldRegen || 1); }
  cdMul() { return this.G.mods.cooldown ? 0.7 : 1; }
  unlocked(eq) { return this.G.flag("equip:" + eq); }

  place(x, y, z, yaw) {
    this.pos.set(x, y, z); this.vel.set(0, 0, 0);
    if (yaw !== undefined) this.yaw = yaw;
    this.pitch = 0; this.tether = null; this.mantle = null; this.slide = 0;
    this.lastSafe.copy(this.pos);
  }
  eye(out) { return out.set(this.pos.x, this.pos.y + this.eyeY, this.pos.z); }
  forward(out) {
    const cp = Math.cos(this.pitch);
    return out.set(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  // ---------------- movement ----------------
  update(dt) {
    const G = this.G, I = G.input, col = G.col, S = G.settings;
    this.invuln = Math.max(0, this.invuln - dt);
    for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt);
    const maxDash = this.tier("dash") >= 2 ? 2 : 1;
    if (this.dashCharges > maxDash) this.dashCharges = maxDash;
    if (this.dashCharges < maxDash && this.cd.dash <= 0) { this.dashCharges++; if (this.dashCharges < maxDash) this.cd.dash = this.dashCD(); }
    this.updateShields(dt);
    this.updateBarrier(dt);

    // look
    const sens = S.sens * 0.0022 * (G.weapons.adsFactor || 1);
    this.yaw -= I.mdx * sens;
    this.pitch -= I.mdy * sens * (S.invert ? -1 : 1);
    this.pitch = clamp(this.pitch, -1.5, 1.5);

    if (this.mantle) { this.updateMantle(dt); return; }
    this.updateTetherRope(dt);

    // crouch / slide
    const wantCrouch = I.crouch;
    const moving = I.key("KeyW") || I.key("KeyA") || I.key("KeyS") || I.key("KeyD");
    const sprint = I.key("ShiftLeft") || I.key("ShiftRight");
    if (I.crouchHit && this.grounded && this.speed2d > 6.5 && this.slide <= 0) {
      this.slide = 0.85;
      const f = Math.hypot(this.vel.x, this.vel.z) || 1;
      const boost = Math.max(10.5, f + 2.5);
      this.vel.x = (this.vel.x / f) * boost; this.vel.z = (this.vel.z / f) * boost;
      G.audio.play("dash", 0.5);
    }
    let targetH = wantCrouch || this.slide > 0 ? P.crouchH : P.height;
    if (targetH > this.h && col.ceilingAt(this.pos.x, this.pos.z, this.pos.y, P.radius) < this.pos.y + P.height) targetH = this.h; // no room to stand
    this.h = approach(this.h, targetH, dt * 6);
    this.eyeY = lerp(this.eyeY, this.h - P.eye, Math.min(1, dt * 14));

    // wish direction
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    let wx = 0, wz = 0;
    if (I.key("KeyW")) { wx += fx; wz += fz; }
    if (I.key("KeyS")) { wx -= fx; wz -= fz; }
    if (I.key("KeyD")) { wx -= fz; wz += fx; }
    if (I.key("KeyA")) { wx += fz; wz -= fx; }
    const wl = Math.hypot(wx, wz);
    if (wl > 0) { wx /= wl; wz /= wl; }
    this.wish = [wx, wz];
    const crouched = this.h < 1.5;
    const canSprint = sprint && I.key("KeyW") && !crouched && !G.weapons.ads && !this.carry;
    this.sprinting = canSprint && moving && this.grounded;
    let maxS = this.swimming ? P.swim : crouched ? P.crouch : canSprint ? P.sprint : P.walk;
    if (this.carry) maxS = Math.min(maxS, 4.5);

    if (this.tether && this.tether.state === "pull") this.tetherPull(dt);
    else if (this.dashT > 0) { this.dashT -= dt; this.vel.y = Math.max(this.vel.y, 0); }
    else if (this.grounded || this.swimming) {
      if (this.slide > 0) {
        this.slide -= dt;
        G.terrain.normalAt(this.pos.x, this.pos.z, NRM);
        const sp = Math.hypot(this.vel.x, this.vel.z);
        const downhill = (this.vel.x * NRM.x + this.vel.z * NRM.z) / (sp || 1);
        const decel = 7 - downhill * 14;
        const ns = Math.max(0, sp - decel * dt);
        if (sp > 0) { this.vel.x *= ns / sp; this.vel.z *= ns / sp; }
        if (ns < 4 || !I.crouch) this.slide = 0;
      } else {
        const tx = wx * maxS, tz = wz * maxS;
        const rate = wl > 0 ? P.accel : P.friction;
        const dx = tx - this.vel.x, dz = tz - this.vel.z, dl = Math.hypot(dx, dz);
        const stepv = rate * dt;
        if (dl <= stepv) { this.vel.x = tx; this.vel.z = tz; } else { this.vel.x += (dx / dl) * stepv; this.vel.z += (dz / dl) * stepv; }
      }
    } else {
      // limited air control
      const cur = Math.hypot(this.vel.x, this.vel.z);
      this.vel.x += wx * P.airAccel * dt; this.vel.z += wz * P.airAccel * dt;
      const ns = Math.hypot(this.vel.x, this.vel.z), cap = Math.max(cur, P.walk);
      if (ns > cap) { this.vel.x *= cap / ns; this.vel.z *= cap / ns; }
    }

    // jump / mantle
    this.coyote = this.grounded ? 0.12 : Math.max(0, this.coyote - dt);
    if (I.hit("Space")) {
      if (this.tether) { this.releaseTether(true); }
      else if (this.tryMantle()) return;
      else if (this.coyote > 0 || this.swimming) {
        this.vel.y = this.swimming ? 5.5 : P.jump; this.grounded = false; this.coyote = 0; this.slide = 0;
        G.audio.play("jump");
      }
    } else if (I.key("Space") && this.vel.y < 2 && wl > 0 && this.tryMantle()) return;

    const g = this.tether && this.tether.state === "pull" ? P.gravity * 0.25 : this.dashT > 0 ? 0 : P.gravity;
    if (!this.swimming) this.vel.y -= g * dt;
    this.move(dt);

    // safe spot memory for fall recovery
    this.safeT -= dt;
    if (this.grounded && !this.swimming && this.safeT <= 0) {
      G.terrain.normalAt(this.pos.x, this.pos.z, NRM);
      if (NRM.y > 0.75 || this.onBox) { this.lastSafe.copy(this.pos); this.safeT = 1; }
    }
    if (this.pos.y < G.terrain.heightAt(this.pos.x, this.pos.z) - 4 || this.pos.y < -40) this.recover("You slipped somewhere unusual. LUMA moved you to safe ground.");
    G.world.enforceBounds(this.pos, this);

    // head bob + footsteps
    this.speed2d = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && this.speed2d > 1) {
      this.bob += dt * this.speed2d * 1.6;
      this.stepT -= dt * this.speed2d;
      if (this.stepT <= 0) { this.stepT = 2.4; G.audio.play("step", this.sprinting ? 1.2 : 0.8); }
    }
    this.landDip = approach(this.landDip, 0, dt * 3);
    this.shake = Math.max(0, this.shake - dt * 2.5);
  }

  move(dt) {
    const G = this.G, col = G.col, T = G.terrain;
    const sp = Math.hypot(this.vel.x, this.vel.y, this.vel.z);
    const n = Math.max(1, Math.ceil((sp * dt) / 0.3));
    const sdt = dt / n;
    const wasGrounded = this.grounded;
    let landedV = 0;
    this.onBox = false;
    for (let s = 0; s < n; s++) {
      const ox = this.pos.x, oz = this.pos.z;
      this.pos.x += this.vel.x * sdt; this.pos.z += this.vel.z * sdt;
      const hitN = { x: 0, z: 0, c: null };
      if (col.pushOut(this.pos, P.radius, this.h, P.step, hitN)) {
        const l = Math.hypot(hitN.x, hitN.z);
        if (l > 0) {
          const nx = hitN.x / l, nz = hitN.z / l, dot = this.vel.x * nx + this.vel.z * nz;
          if (dot < 0) { this.vel.x -= nx * dot; this.vel.z -= nz * dot; }
          if (this.tether && this.tether.state === "pull") this.tether.blocked = (this.tether.blocked || 0) + sdt;
        }
      }
      // steep terrain acts like a wall when walking uphill
      const th = T.heightAt(this.pos.x, this.pos.z);
      if (th > this.pos.y + P.step) {
        T.normalAt(this.pos.x, this.pos.z, NRM);
        if (NRM.y < 0.64) {
          this.pos.x = ox; this.pos.z = oz;
          const l = Math.hypot(NRM.x, NRM.z) || 1, nx = NRM.x / l, nz = NRM.z / l, dot = this.vel.x * nx + this.vel.z * nz;
          if (dot < 0) { this.vel.x -= nx * dot; this.vel.z -= nz * dot; }
        }
      }
      // vertical
      this.pos.y += this.vel.y * sdt;
      const yTop = this.pos.y + (this.vel.y <= 0 ? P.step : 0.05);
      const ground = col.groundAt(this.pos.x, this.pos.z, Math.max(yTop, this.pos.y + 0.05), P.radius);
      if (this.pos.y <= ground) {
        if (this.vel.y < -9) landedV = this.vel.y;
        this.pos.y = ground; if (this.vel.y < 0) this.vel.y = 0;
        this.grounded = true;
        this.onBox = ground > T.heightAt(this.pos.x, this.pos.z) + 0.05;
      } else if (wasGrounded && this.vel.y <= 0.01 && this.pos.y - ground < 0.55 && !this.tether) {
        this.pos.y = ground; this.vel.y = 0; this.grounded = true;
      } else this.grounded = false;
      if (this.vel.y > 0) {
        const ceil = col.ceilingAt(this.pos.x, this.pos.z, this.pos.y, P.radius * 0.9);
        if (this.pos.y + this.h > ceil) { this.pos.y = ceil - this.h; this.vel.y = 0; }
      }
    }
    // standing on a too-steep slope: slide down it
    if (this.grounded && !this.onBox) {
      T.normalAt(this.pos.x, this.pos.z, NRM);
      if (NRM.y < 0.64) { this.vel.x += NRM.x * 14 * dt; this.vel.z += NRM.z * 14 * dt; }
    }
    // water
    const floor = T.heightAt(this.pos.x, this.pos.z);
    this.swimming = floor < WATER_Y - 1.3 && this.pos.y < WATER_Y - 0.9;
    if (this.swimming) { this.pos.y = Math.max(this.pos.y, WATER_Y - 1.15); if (this.vel.y < 0) this.vel.y = 0; this.grounded = false; }
    if (landedV) { this.landDip = Math.min(0.25, -landedV * 0.02); this.G.audio.play("land"); }
  }

  tryMantle(dx, dz) {
    const G = this.G, col = G.col;
    let fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    if (dx !== undefined) { const l = Math.hypot(dx, dz); if (l < 0.01) return false; fx = dx / l; fz = dz / l; }
    for (const d of [0.75, 1.05]) {
      const x = this.pos.x + fx * d, z = this.pos.z + fz * d;
      const top = col.groundAt(x, z, this.pos.y + 2.15, 0.3);
      const rise = top - this.pos.y;
      if (rise < 0.55 || rise > 2.1) continue;
      if (col.ceilingAt(x, z, top, P.radius) < top + P.crouchH + 0.05) continue;
      // something must actually be in front at chest height (a wall or ledge face)
      this.mantle = { t: 0, dur: 0.18 + rise * 0.12, fx: this.pos.x, fy: this.pos.y, fz: this.pos.z, tx: x, ty: top + 0.02, tz: z };
      this.vel.set(0, 0, 0); this.tether = null; this.slide = 0;
      G.audio.play("jump", 0.6);
      return true;
    }
    return false;
  }
  updateMantle(dt) {
    const m = this.mantle;
    m.t += dt;
    const k = Math.min(1, m.t / m.dur);
    const up = Math.min(1, k * 1.6), fw = Math.max(0, (k - 0.35) / 0.65);
    this.pos.set(lerp(m.fx, m.tx, fw), lerp(m.fy, m.ty, up), lerp(m.fz, m.tz, fw));
    if (k >= 1) {
      this.mantle = null;
      this.G.col.pushOut(this.pos, P.radius, this.h, P.step);
      this.grounded = true;
    }
  }

  recover(msg) {
    const p = this.lastSafe;
    const ok = !this.G.col.inside(p.x, p.y + 0.9, p.z);
    if (ok) this.place(p.x, p.y + 0.05, p.z);
    else this.G.respawnSafe();
    if (msg) this.G.ui.toast(msg);
  }

  // ---------------- tether ----------------
  tetherRange() { return this.tier("tether") >= 2 ? 44 : 36; }
  tetherCD() { return (this.tier("tether") >= 1 ? 3.0 : 4.0) * this.cdMul(); }
  // What would the tether hit right now? Used for the in-range indicator too.
  tetherProbe() {
    const G = this.G, e = this.eye(new THREE.Vector3()), f = this.forward(new THREE.Vector3());
    const R = this.tetherRange();
    const item = G.items.pullable(e, f, R);
    const rob = G.robots.rayHit(e.x, e.y, e.z, f.x, f.y, f.z, R);
    const hit = G.col.raycast(e.x, e.y, e.z, f.x, f.y, f.z, R, { water: true });
    let best = null;
    if (hit && !hit.water) best = { kind: "surface", t: hit.t, x: hit.x, y: hit.y, z: hit.z, nx: hit.nx, ny: hit.ny, nz: hit.nz };
    if (rob && (!best || rob.t < best.t)) best = { kind: "robot", t: rob.t, robot: rob.robot, x: rob.x, y: rob.y, z: rob.z };
    if (item && (!best || item.t < best.t + 0.5)) best = { kind: "item", t: item.t, item: item.item };
    return best;
  }
  useTether() {
    const G = this.G;
    if (this.vehicle) return;
    if (this.tether) { this.releaseTether(false); return; }
    if (this.cd.tether > 0) { G.audio.play("denied"); return; }
    const pr = this.tetherProbe();
    if (!pr) { G.audio.play("denied"); G.ui.flashTether(); this.cd.tether = 0.25; return; }
    G.audio.play("tether");
    if (pr.kind === "item") { G.items.pullToPlayer(pr.item); this.cd.tether = 1; return; }
    // ledge assist: aiming at a wall near its top anchors to the lip so you pull up and over
    if (pr.kind === "surface" && Math.abs(pr.ny) < 0.6) {
      const L = Math.hypot(pr.nx, pr.nz) || 1, ix = pr.x - (pr.nx / L) * 0.9, iz = pr.z - (pr.nz / L) * 0.9;
      const top = G.col.groundAt(ix, iz, pr.y + 4.5, 0.3);
      if (top > pr.y && top - pr.y < 4.5 && G.col.ceilingAt(ix, iz, top, 0.4) > top + 1.9) {
        // pull to a point just outside the lip (so overhangs do not catch you), then mantle onto it
        pr.lx = ix; pr.lz = iz; pr.x += (pr.nx / L) * 0.45; pr.z += (pr.nz / L) * 0.45; pr.y = top + 1.1; pr.ledge = true;
      }
    }
    const e = this.eye(new THREE.Vector3());
    this.tether = { state: "fly", t: 0, len: Math.hypot(pr.x - e.x, pr.y - e.y, pr.z - e.z), ledge: !!pr.ledge, lx: pr.lx, lz: pr.lz, x: pr.x, y: pr.y, z: pr.z, robot: pr.kind === "robot" ? pr.robot : null, time: 0, sx: e.x, sy: e.y, sz: e.z };
    if (pr.kind === "robot" && this.tier("tether") >= 3) pr.robot.stun(1.6, "tether");
  }
  tetherPull(dt) {
    const T = this.tether;
    if (T.robot) { T.x = T.robot.pos.x; T.y = T.robot.pos.y + T.robot.def.h * 0.6; T.z = T.robot.pos.z; if (!T.robot.alive) { this.releaseTether(false); return; } }
    const dx = T.x - this.pos.x, dy = T.y - (this.pos.y + 1.0), dz = T.z - this.pos.z;
    const d = Math.hypot(dx, dy, dz);
    T.time += dt;
    // stop when close, when time runs out, or when no longer getting closer
    if (T.lastD !== undefined && d > T.lastD - 0.01) T.stall = (T.stall || 0) + dt; else T.stall = 0;
    T.lastD = d;
    if (d < (T.robot ? 2.6 : T.ledge ? 1.3 : 1.8) || T.time > 2.6 || T.stall > 0.3) { this.releaseTether(false); return; }
    const acc = 70, maxV = 25;
    this.vel.x += (dx / d) * acc * dt; this.vel.y += (dy / d) * acc * dt; this.vel.z += (dz / d) * acc * dt;
    // damp sideways drift so the pull feels direct
    const along = (this.vel.x * dx + this.vel.y * dy + this.vel.z * dz) / d;
    this.vel.x = lerp(this.vel.x, (dx / d) * along, dt * 3); this.vel.y = lerp(this.vel.y, (dy / d) * along, dt * 3); this.vel.z = lerp(this.vel.z, (dz / d) * along, dt * 3);
    const v = this.vel.length();
    if (v > maxV) this.vel.multiplyScalar(maxV / v);
    this.grounded = false;
  }
  releaseTether(jumped) {
    const T = this.tether;
    if (!T) return;
    this.tether = null;
    if (T.state === "pull") {
      if (jumped) this.vel.y = Math.max(this.vel.y, 6.5);
      else if (T.y > this.pos.y + 0.5) this.vel.y = Math.max(this.vel.y, 5);
      const s = this.vel.length(); if (s > 14) this.vel.multiplyScalar(14 / s);
      if (T.ledge && !jumped) {
        // a gentle hop onto the ledge instead of a launch
        const dx = (T.lx ?? T.x) - this.pos.x, dz = (T.lz ?? T.z) - this.pos.z, l = Math.hypot(dx, dz) || 1;
        this.vel.set((dx / l) * 3, Math.min(Math.max(this.vel.y, 3), 4.5), (dz / l) * 3);
      }
      if (!this.tryMantle((T.lx ?? T.x) - this.pos.x, (T.lz ?? T.z) - this.pos.z) && T.ledge) { this.tether = null; }
      if (this.mantle) { this.cd.tether = this.tetherCD(); return; }
      if (this.tier("tether") >= 4) this.G.combat.repulseWave(this.pos, 6, 20, 0.9, false);
      this.cd.tether = this.tetherCD();
    } else this.cd.tether = 0.3;
  }
  updateTetherRope(dt) {
    const T = this.tether;
    if (!T) return;
    if (T.state === "fly") {
      T.t += dt * 110;
      if (T.t >= T.len) { T.state = "pull"; T.time = 0; this.G.audio.play("tetherHit"); }
    }
  }

  // ---------------- equipment ----------------
  useEquipment() {
    const G = this.G, eq = this.equipSel;
    if (!this.unlocked(eq)) { G.audio.play("denied"); G.ui.toast("That equipment isn't unlocked yet."); return; }
    if (eq === "tether") return this.useTether();
    if (eq === "beacon") return this.useBeacon();
    if (eq === "barrier") return this.useBarrier();
    if (eq === "dash") return this.useDash();
  }
  beaconCD() { return (this.tier("beacon") >= 4 ? 9 : 14) * this.cdMul(); }
  useBeacon() {
    const G = this.G;
    if (this.cd.beacon > 0) { G.audio.play("denied"); return; }
    const R = this.tier("beacon") >= 1 ? 55 : 40, dur = this.tier("beacon") >= 2 ? 13 : 8;
    G.fx.ring(this.pos.x, this.pos.y + 0.3, this.pos.z, 0x6ff2e0, R, 1.1);
    G.fx.ring(this.pos.x, this.pos.y + 1.2, this.pos.z, 0x6ff2e0, R * 0.7, 0.9);
    G.audio.play("scan");
    G.robots.markAround(this.pos, R, dur);
    G.markScan(this.pos, R, dur, this.tier("beacon") >= 3);
    G.setFlag("tut:beacon");
    this.cd.beacon = this.beaconCD();
  }
  dashCD() { return (this.tier("dash") >= 1 ? 2.6 : 3.5) * this.cdMul(); }
  useDash() {
    const G = this.G;
    if (this.vehicle) return;
    if (this.dashCharges <= 0) { G.audio.play("denied"); return; }
    let [wx, wz] = this.wish || [0, 0];
    if (!wx && !wz) { wx = -Math.sin(this.yaw); wz = -Math.cos(this.yaw); }
    const speed = this.tier("dash") >= 3 ? 30 : 22;
    this.vel.x = wx * speed; this.vel.z = wz * speed;
    this.dashT = 0.18; this.tether = null;
    if (this.tier("dash") >= 4) this.invuln = 0.5;
    this.dashCharges--; if (this.cd.dash <= 0) this.cd.dash = this.dashCD();
    G.audio.play("dash"); G.fx.burst(this.pos.x, this.pos.y + 1, this.pos.z, 0x9fe8ff, 10, 3, 0.08, 0.3, 0);
    G.setFlag("tut:dash");
  }
  barrierCD() { return 18 * this.cdMul(); }
  buildBarrierMesh() {
    const geo = new THREE.BoxGeometry(1, 1, 0.12);
    this.barrierMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x55e8ff, transparent: true, opacity: 0.35, depthWrite: false }));
    this.barrierEdge = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.16), new THREE.MeshBasicMaterial({ color: 0xbff8ff }));
    this.barrierMesh.add(this.barrierEdge);
    this.barrierMesh.visible = false;
    this.G.scene.add(this.barrierMesh);
  }
  useBarrier() {
    const G = this.G;
    if (this.cd.barrier > 0 || this.vehicle) { G.audio.play("denied"); return; }
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const x = this.pos.x + fx * 2.6, z = this.pos.z + fz * 2.6;
    const y = G.col.groundAt(x, z, this.pos.y + 1.5, 0.3);
    const w = this.tier("barrier") >= 3 ? 7 : 5;
    const hp = this.tier("barrier") >= 1 ? 450 : 300;
    this.barrier = { x, y, z, nx: fx, nz: fz, w, h: 3, hp, max: hp, life: this.tier("barrier") >= 2 ? 15 : 10, team: "player" };
    const m = this.barrierMesh;
    m.position.set(x, y + 1.5, z); m.rotation.set(0, this.yaw, 0); m.scale.set(w, 3, 1); m.visible = true;
    this.barrierEdge.position.y = 0.5;
    G.audio.play("barrier"); G.setFlag("tut:barrier");
    this.cd.barrier = this.barrierCD();
  }
  updateBarrier(dt) {
    const b = this.barrier;
    if (!b) return;
    b.life -= dt;
    this.barrierMesh.material.opacity = 0.2 + 0.25 * (b.hp / b.max) + Math.sin(performance.now() * 0.01) * 0.03;
    if (this.tier("barrier") >= 4 && Math.hypot(this.pos.x - b.x, this.pos.z - b.z) < 5) this.boostRecharge = true;
    if (b.life <= 0 || b.hp <= 0) {
      this.G.fx.burst(b.x, b.y + 1.5, b.z, 0x55e8ff, 16, 3, 0.1, 0.5, 2);
      this.barrier = null; this.barrierMesh.visible = false;
    }
  }

  repulse() {
    const G = this.G;
    if (this.cd.repulse > 0 || this.vehicle) { G.audio.play("denied"); return; }
    this.cd.repulse = 4.5;
    G.combat.repulseWave(this.pos, 5.5, 28, 1.3, true, this.yaw);
    G.weapons.punch();
  }
  throwItem() {
    const G = this.G;
    if (this.cd.throw > 0 || this.vehicle) return;
    const kind = this.throwSel;
    if (this.throwables[kind] <= 0) { G.audio.play("denied"); G.ui.toast(`No ${kind === "emp" ? "EMP Orbs" : "Stasis Discs"} left. Supply stations refill them.`); return; }
    this.throwables[kind]--;
    this.cd.throw = 0.7;
    const e = this.eye(new THREE.Vector3()), f = this.forward(new THREE.Vector3());
    G.projectiles.spawnThrowable(kind, e.x + f.x * 0.6, e.y + f.y * 0.6 - 0.1, e.z + f.z * 0.6, f.x * 20 + this.vel.x * 0.5, f.y * 20 + 4, f.z * 20 + this.vel.z * 0.5);
    G.audio.play("throw");
  }
  switchThrowable() { this.throwSel = this.throwSel === "emp" ? "stasis" : "emp"; this.G.audio.play("ui"); }

  // ---------------- shields & damage ----------------
  updateShields(dt) {
    const G = this.G, now = G.time;
    const max = this.shieldMax;
    if (this.shield > max) this.shield = max;
    if (now - this.lastHit > this.rechargeDelay && this.shield < max) {
      if (!this.recharging) { this.recharging = true; G.audio.play("shieldCharge"); }
      this.shield = Math.min(max, this.shield + this.rechargeRate * (this.boostRecharge ? 1.6 : 1) * dt);
      if (this.shield >= max) this.recharging = false;
    }
    this.boostRecharge = false;
    // suit integrity slowly repairs itself when things are calm
    const cap = G.diff.suitRegenCap;
    if (now - this.lastHit > 10 && this.shield >= max && this.suit < cap) this.suit = Math.min(cap, this.suit + 5 * dt);
  }
  damage(amount, fromX, fromZ, kind = "energy") {
    const G = this.G;
    if (this.invuln > 0 || G.paused || G.cinematic || G.state.mode === "ending") return;
    amount *= G.diff.dmgTaken;
    this.lastHit = G.time; this.combatT = G.time; this.recharging = false;
    if (fromX !== undefined) {
      const a = Math.atan2(fromX - this.pos.x, fromZ - this.pos.z);
      this.hitDirs.push({ a, t: 1 });
    }
    const hadShield = this.shield > 0;
    const s = Math.min(this.shield, amount);
    this.shield -= s; amount -= s;
    if (hadShield && this.shield <= 0) {
      G.audio.play("shieldBreak"); G.ui.shieldBreak();
      if (Math.random() < 0.3) G.say("luma", QUIPS.shieldbreak[Math.floor(Math.random() * 2)], { quip: true });
    } else G.audio.play(hadShield ? "shieldHit" : "hurt");
    if (amount > 0) {
      this.suit -= amount;
      if (this.suit < 30 && this.suit + amount >= 30) G.say("luma", QUIPS.lowsuit[0], { quip: true });
      if (this.suit <= 0) { this.suit = 0; G.onDefeat(); }
    }
    this.shake = Math.min(1, this.shake + 0.25);
  }
  heal(full) {
    this.shield = this.shieldMax; this.suit = full ? 100 : Math.max(this.suit, 100);
  }

  applyCamera(cam, dt) {
    const S = this.G.settings;
    const rp = this.renderPos || this.pos;
    let x = rp.x, y = rp.y + this.eyeY - this.landDip, z = rp.z;
    if (S.headBob && !S.reduceMotion && this.grounded) { y += Math.sin(this.bob * 2) * 0.035 * Math.min(1, this.speed2d / 6); }
    cam.position.set(x, y, z);
    let pitch = this.pitch, yaw = this.yaw, roll = 0;
    const sh = S.reduceMotion ? 0 : this.shake * (S.shake ?? 1);
    if (sh > 0) { pitch += (Math.random() - 0.5) * 0.02 * sh; yaw += (Math.random() - 0.5) * 0.02 * sh; }
    if (this.slide > 0 && !S.reduceMotion) roll = 0.05;
    cam.rotation.set(pitch, yaw, roll, "YXZ");
  }
}
