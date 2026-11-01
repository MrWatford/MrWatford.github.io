// Ringfall: drivable vehicles — Trailrunner Rover (wheels), Driftwing Skiff (hover),
// Bastion Crawler (armored cannon), Skyfin (flight). Third-person camera, collision with the
// world, gentle shoving of people, stuck recovery, and safe shielded ejection.
import * as THREE from "../lib/three.module.min.js";
import { VEHICLES, QUIPS, WATER_Y } from "./content.js";
import { clamp, lerp, angleWrap, approach } from "./util.js";
import { castShot } from "./weapons.js";
import { buildRover, buildGuardian } from "./models.js";
import { MAT } from "./materials.js";

const TYPES = {
  rover:   { max: 27, rev: 9, accel: 15, turn: 1.9, grip: 26, drift: 5, hp: 450, len: 4.2, wid: 2.4, clear: 0.55, cam: 7.5, r: 1.3, boost: 1.35 },
  skiff:   { max: 24, rev: 8, accel: 13, turn: 2.2, grip: 4, strafe: 9, hp: 360, len: 4.6, wid: 2.6, clear: 1.0, cam: 7.5, r: 1.4, hover: true, boost: 1.45 },
  crawler: { max: 10, rev: 6, accel: 7, turn: 1.0, grip: 40, hp: 1000, len: 5.4, wid: 3.6, clear: 0.5, cam: 9, r: 1.9, boost: 1.15, cannon: true },
  skyfin:  { max: 38, rev: 0, accel: 14, turn: 1.4, hp: 380, len: 5.5, wid: 6, clear: 0.9, cam: 11, r: 1.6, fly: true, boost: 1.4, ceiling: 140 },
};

function M(c) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.25 }); }
function G0(c) { const m = new THREE.MeshBasicMaterial({ color: c }); m.color.multiplyScalar(2.2); return m; }
function buildMesh(type) {
  if (type === "rover") return buildRover();
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const b = (w, h, d, m, x, y, z, par = body) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
  const wheels = [];
  const wheel = (x, z, r = 0.55) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.45, 12), M(0x262a30)); w.rotation.z = Math.PI / 2; w.position.set(x, r, z); body.add(w); wheels.push(w); };
  let turret = null;
  if (type === "rover") {
    b(2.2, 0.6, 4.0, M(0xf1f3f6), 0, 0.85, 0); b(2.0, 0.5, 1.6, M(0x2f6fd6), 0, 1.35, -0.7);
    b(0.12, 1.1, 0.12, M(0xff8a2a), -0.9, 1.6, 0.3); b(0.12, 1.1, 0.12, M(0xff8a2a), 0.9, 1.6, 0.3); b(1.92, 0.12, 0.12, M(0xff8a2a), 0, 2.15, 0.3);
    b(1.6, 0.08, 0.6, M(0x9fd8ff), 0, 1.65, -1.55);
    turret = new THREE.Group(); turret.position.set(0, 1.75, 1.3); body.add(turret);
    b(0.5, 0.4, 0.5, M(0x39414e), 0, 0, 0, turret); b(0.14, 0.14, 1.0, G0(0x7ff7ff), 0, 0.1, -0.6, turret);
    for (const x of [-1.15, 1.15]) for (const z of [-1.4, 1.4]) wheel(x, z);
    b(2.2, 0.08, 0.1, G0(0xffe2a0), 0, 0.9, -2.02);
  } else if (type === "skiff") {
    b(2.4, 0.45, 4.4, M(0xf1f3f6), 0, 0.6, 0); b(1.4, 0.5, 1.6, M(0x2fd6c4), 0, 1.05, 0.4); b(1.3, 0.3, 0.8, M(0x9fd8ff), 0, 1.1, -0.7);
    b(0.1, 0.8, 1.0, M(0xff8a2a), -1.1, 1.0, 1.8); b(0.1, 0.8, 1.0, M(0xff8a2a), 1.1, 1.0, 1.8);
    b(2.6, 0.08, 4.6, G0(0x6ff2e0), 0, 0.35, 0);
  } else if (type === "crawler") {
    b(3.4, 1.2, 5.2, M(0x4a5260), 0, 1.0, 0); b(0.7, 1.0, 5.6, M(0x262a30), -1.9, 0.6, 0); b(0.7, 1.0, 5.6, M(0x262a30), 1.9, 0.6, 0);
    b(3.5, 0.1, 5.3, M(0xff8a2a), 0, 1.65, 0);
    turret = new THREE.Group(); turret.position.set(0, 2.1, 0.2); body.add(turret);
    b(1.8, 0.8, 2.0, M(0xf1f3f6), 0, 0, 0, turret); const barrel = b(0.3, 0.3, 2.4, M(0x39414e), 0, 0.1, -1.9, turret); b(0.32, 0.32, 0.2, G0(0x7dffb0), 0, 0.1, -3.1, turret);
    turret.userData.barrel = barrel;
  } else if (type === "skyfin") {
    b(1.2, 1.0, 5.0, M(0xf1f3f6), 0, 0, 0); b(0.9, 0.6, 1.4, M(0x9fd8ff), 0, 0.5, -1.2);
    b(6.0, 0.15, 1.6, M(0x2f6fd6), 0, -0.1, 0.4); b(0.15, 1.1, 1.0, M(0xff8a2a), 0, 0.7, 2.1); b(2.4, 0.12, 0.8, M(0x2f6fd6), 0, 0.2, 2.2);
    for (const x of [-1.6, 1.6]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 10), G0(0x6ff2e0)); e.rotation.x = Math.PI / 2; e.position.set(x, -0.1, 1.0); body.add(e); }
    body.position.y = 1.0;
  }
  return { g, body, wheels, turret };
}

class Vehicle {
  constructor(sys, type, x, z, yaw) {
    this.sys = sys; this.G = sys.G; this.type = type; this.T = TYPES[type];
    this.pos = new THREE.Vector3(x, 0, z); this.vel = new THREE.Vector3(); this.yaw = yaw || 0;
    this.pos.y = this.groundY(x, z) + (this.T.fly ? 0 : 0);
    this.hp = this.T.hp; this.pitch = 0; this.roll = 0; this.boostMeter = 1;
    this.driver = null; this.gunner = null; this.fireT = 0; this.stuckT = 0; this.dead = 0; this.air = false;
    const m = buildMesh(type); this.mesh = m.g; this.body = m.body; this.wheels = m.wheels; this.turret = m.turret;
    this.G.scene.add(this.mesh);
    this.sync();
  }
  get name() { return VEHICLES[this.type].name; }
  groundY(x, z) {
    const G = this.G;
    let y = G.col.groundAt(x, z, (this.pos ? this.pos.y : G.terrain.heightAt(x, z)) + 1.4, 0.5);
    if (this.T.hover || this.T.fly) y = Math.max(y, WATER_Y);
    return y;
  }
  damage(dmg, fx, fz) {
    if (this.dead) return;
    this.hp -= dmg;
    this.G.player.lastHit = this.G.time; this.G.player.combatT = this.G.time;
    if (fx !== undefined) this.G.player.hitDirs.push({ a: Math.atan2(fx - this.pos.x, fz - this.pos.z), t: 1 });
    this.G.audio.play("hurt", 0.6);
    if (this.hp <= 0) this.sys.destroy(this);
  }

  update(dt) {
    const G = this.G, T = this.T;
    if (this.dead) { this.dead += dt; this.mesh.scale.setScalar(Math.max(0.01, 1 - (this.dead - 1.5) * 0.7)); if (this.dead > 3) this.sys.remove(this); return; }
    const I = G.input, driving = this.driver && !G.paused;
    let thr = 0, steer = 0, strafe = 0, hand = false, boost = false, up = 0;
    this.steerVis = this.steerVis || 0;
    if (driving) {
      if (I.key("KeyW")) thr += 1; if (I.key("KeyS")) thr -= 1;
      if (I.key("KeyA")) steer += 1; if (I.key("KeyD")) steer -= 1;
      hand = I.key("Space"); boost = I.key("ShiftLeft") || I.key("ShiftRight");
      if (T.fly) { up = (I.key("Space") ? 1 : 0) - (I.crouch ? 1 : 0); hand = false; }
    }
    const bm = G.mods.boost ? 1.5 : 1;
    if (boost && this.boostMeter > 0 && thr > 0) { this.boostMeter = Math.max(0, this.boostMeter - dt / (2.5 * bm)); } else { boost = false; this.boostMeter = Math.min(1, this.boostMeter + dt / 6); }
    const maxS = T.max * (boost ? T.boost : 1);
    if (T.fly) this.flyPhysics(dt, thr, steer, up, boost, maxS);
    else this.groundPhysics(dt, thr, steer, hand, maxS);
    // fire controls
    this.fireT -= dt;
    if (driving && (T.cannon || T.fly) && I.mouse[0] && this.fireT <= 0) this.fire();
    if (this.gunner) this.gunnerFire(dt);
    // stuck / overturned help
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (driving && Math.abs(thr) > 0 && sp < 0.6 && !T.fly) this.stuckT += dt; else this.stuckT = Math.max(0, this.stuckT - dt * 2);
    if (this.stuckT > 3.5 || (driving && I.hit("KeyR") && !T.fly)) { this.stuckT = 0; this.recover(); }
    if (driving && sp > 3) G.audio.play("engine", Math.min(1, sp / T.max));
    this.steerVis = lerp(this.steerVis, T.fly || T.hover ? 0 : steer * 0.42, Math.min(1, dt * 8));
    // dust from the tires on dry ground
    this.dustT = (this.dustT || 0) - dt;
    if (!T.fly && !T.hover && !this.air && sp > 6 && this.dustT <= 0 && G.terrain.grassAt(this.pos.x, this.pos.z) < 0.55) {
      this.dustT = 0.06;
      const bx = this.pos.x + Math.sin(this.yaw) * T.len * 0.45, bz = this.pos.z + Math.cos(this.yaw) * T.len * 0.45;
      G.fx.burst(bx, this.pos.y + 0.3, bz, 0xb8a284, 2, 1.2, 0.35, 0.9, -0.4, 0.6);
    }
    this.sync();
  }

  groundPhysics(dt, thr, steer, hand, maxS) {
    const G = this.G, T = this.T;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let vF = this.vel.x * fx + this.vel.z * fz, vR = this.vel.x * rx + this.vel.z * rz;
    if (!this.air) {
      if (thr > 0) vF = Math.min(maxS, vF + T.accel * thr * dt * (vF < 0 ? 2.5 : 1));
      else if (thr < 0) vF = Math.max(-T.rev, vF + T.accel * thr * dt * (vF > 0 ? 2.5 : 1));
      else vF = approach(vF, 0, 4 * dt);
      if (hand) vF = approach(vF, 0, 9 * dt);
      const grip = hand ? T.drift || 6 : T.grip;
      vR = approach(vR, 0, grip * dt);
      if (T.strafe && this.driver) { const s = (G.input.key("KeyD") ? 1 : 0) - (G.input.key("KeyA") ? 1 : 0); vR = approach(vR, s * T.strafe, 18 * dt); }
      // slope: too steep slows you down
      const n = G.terrain.normalAt(this.pos.x, this.pos.z, { x: 0, y: 0, z: 0 });
      const uphill = -(n.x * fx + n.z * fz);
      if (n.y < 0.7 && uphill > 0.2 && vF > 0) vF = approach(vF, 0, 18 * dt);
      vF -= (n.x * fx + n.z * fz) * -9 * dt * 0;
    }
    // steering
    if (T.hover && this.driver) {
      // skiff: nose follows the camera
      const want = this.sys.camYaw;
      this.yaw += clamp(angleWrap(want - this.yaw), -T.turn * dt, T.turn * dt);
    } else {
      const k = clamp(Math.abs(vF) / 6, 0, 1) * Math.sign(vF || 1);
      this.yaw += steer * T.turn * k * dt * (hand ? 1.5 : 1) * (T.max <= 10 ? 1.4 : 1);
      if (T === TYPES.crawler && Math.abs(vF) < 1) this.yaw += steer * T.turn * dt;   // tracks turn in place
    }
    const nfx = -Math.sin(this.yaw), nfz = -Math.cos(this.yaw), nrx = Math.cos(this.yaw), nrz = -Math.sin(this.yaw);
    this.vel.x = nfx * vF + nrx * vR; this.vel.z = nfz * vF + nrz * vR;
    // move with collision in small steps
    const steps = Math.max(1, Math.ceil((Math.hypot(this.vel.x, this.vel.z) * dt) / 0.4));
    const sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      const ox = this.pos.x, oz = this.pos.z;
      this.pos.x += this.vel.x * sdt; this.pos.z += this.vel.z * sdt;
      // deep water stops wheeled vehicles
      if (!T.hover && G.terrain.heightAt(this.pos.x, this.pos.z) < WATER_Y - 1.0) {
        this.pos.x = ox; this.pos.z = oz; this.vel.multiplyScalar(-0.2);
        if (this.driver && G.time - (this.waterMsg || 0) > 4) { this.waterMsg = G.time; G.ui.toast(`${this.name} can't drive into deep water. The Driftwing Skiff can!`); }
        break;
      }
      this.collide(ox, oz);
    }
    // ground following with simple suspension
    const L = T.len / 2, W = T.wid / 2;
    const h = (dx, dz) => this.groundY(this.pos.x + nfx * dx + nrx * dz, this.pos.z + nfz * dx + nrz * dz);
    const hf = h(L, 0), hb = h(-L, 0), hl = h(0, -W), hr = h(0, W);
    let gy = Math.max((hf + hb + hl + hr) / 4, this.groundY(this.pos.x, this.pos.z) - 0.2);
    if (T.hover) gy = Math.max(gy, WATER_Y) + T.clear;
    if (this.pos.y > gy + 0.35) { this.air = true; this.vel.y -= 22 * dt; this.pos.y += this.vel.y * dt; if (this.pos.y <= gy) { if (this.vel.y < -8) { G.audio.play("land"); G.player.shake = 0.6; } this.pos.y = gy; this.vel.y = 0; this.air = false; } }
    else { this.air = false; const prevY = this.pos.y; this.pos.y = lerp(this.pos.y, gy, Math.min(1, dt * (T.hover ? 6 : 14))); this.vel.y = (this.pos.y - prevY) / dt; if (this.vel.y > 6 && Math.abs(vF) > 12) { this.air = true; } }
    this.pitch = lerp(this.pitch, Math.atan2(hf - hb, T.len), Math.min(1, dt * 8));
    this.roll = lerp(this.roll, Math.atan2(hr - hl, T.wid) + (T.hover ? -vR * 0.02 : 0), Math.min(1, dt * 8));
    if (T.hover) this.roll += Math.sin(G.time * 2) * 0.002;
  }

  flyPhysics(dt, thr, steer, up, boost, maxS) {
    const G = this.G, T = this.T;
    // nose follows the camera; throttle sets speed; Space/C climb and descend
    const wantYaw = this.sys.camYaw, wantPitch = clamp(this.sys.camPitch + 0.15, -0.7, 0.7);
    if (this.driver) {
      this.yaw += clamp(angleWrap(wantYaw - this.yaw), -T.turn * dt, T.turn * dt);
      this.pitch = lerp(this.pitch, this.landed ? 0 : wantPitch, Math.min(1, dt * 2));
      this.roll = lerp(this.roll, clamp(angleWrap(wantYaw - this.yaw) * 1.2, -0.6, 0.6), Math.min(1, dt * 3));
    }
    this.speed = this.speed || 0;
    if (thr > 0) this.speed = Math.min(maxS, this.speed + T.accel * dt); else if (thr < 0) this.speed = Math.max(0, this.speed - T.accel * 1.5 * dt); else this.speed = approach(this.speed, Math.min(this.speed, 8), 2 * dt);
    const cp = Math.cos(this.pitch);
    const fx = -Math.sin(this.yaw) * cp, fy = this.speed > 6 ? Math.sin(this.pitch) : 0, fz = -Math.cos(this.yaw) * cp;
    this.vel.x = lerp(this.vel.x, fx * this.speed, Math.min(1, dt * 3));
    this.vel.z = lerp(this.vel.z, fz * this.speed, Math.min(1, dt * 3));
    this.vel.y = lerp(this.vel.y, fy * this.speed + up * 9 - (this.driver ? 0 : 6), Math.min(1, dt * 3));
    const ox = this.pos.x, oz = this.pos.z, oy = this.pos.y;
    this.pos.addScaledVector(this.vel, dt);
    const floor = this.groundY(this.pos.x, this.pos.z) + T.clear;
    this.landed = false;
    if (this.pos.y <= floor) {
      const impact = -this.vel.y;
      this.pos.y = floor; if (this.vel.y < 0) this.vel.y = 0;
      this.landed = this.speed < 10;
      if (impact > 12 || (this.speed > 18 && G.terrain.normalAt(this.pos.x, this.pos.z, { x: 0, y: 0, z: 0 }).y < 0.75)) { this.damage(25); this.speed *= 0.4; G.audio.play("crash"); }
    }
    const ceiling = T.ceiling;
    if (this.pos.y > ceiling) { this.pos.y = ceiling; this.vel.y = Math.min(0, this.vel.y); if (G.time - (this.ceilMsg || 0) > 5) { this.ceilMsg = G.time; G.ui.toast("Flight ceiling reached (140 m)."); } }
    // structures
    const p = new THREE.Vector3(this.pos.x, this.pos.y - 0.8, this.pos.z);
    const hitN = { x: 0, z: 0 };
    if (G.col.pushOut(p, T.r, 1.6, 0.3, hitN)) {
      const sp = Math.hypot(this.vel.x, this.vel.z);
      this.pos.x = p.x; this.pos.z = p.z;
      if (sp > 15) { this.damage(20); G.audio.play("crash"); this.speed *= 0.3; }
    }
    if (G.col.inside(this.pos.x, this.pos.y, this.pos.z)) { this.pos.set(ox, oy + 0.5, oz); this.speed *= 0.5; }
  }

  collide(ox, oz) {
    const G = this.G, T = this.T;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const off = T.len / 2 - T.r * 0.6;
    let impactN = null;
    for (const s of [off, -off, 0]) {
      const p = new THREE.Vector3(this.pos.x + fx * s, this.pos.y, this.pos.z + fz * s);
      const n = { x: 0, z: 0 };
      if (G.col.pushOut(p, T.r, 1.8, 0.55, n)) {
        this.pos.x += p.x - (this.pos.x + fx * s); this.pos.z += p.z - (this.pos.z + fz * s);
        const l = Math.hypot(n.x, n.z); if (l > 0) impactN = [n.x / l, n.z / l];
      }
    }
    if (impactN) {
      const into = -(this.vel.x * impactN[0] + this.vel.z * impactN[1]);
      if (into > 0) {
        this.vel.x += impactN[0] * into * 1.2; this.vel.z += impactN[1] * into * 1.2;
        if (into > 9) {
          this.damage(into * 2.2); G.audio.play("crash"); G.player.shake = 0.8;
          if (this.driver && Math.random() < 0.5 && G.time - (this.sys.quipT || 0) > 30) { this.sys.quipT = G.time; G.say("luma", QUIPS.crash[Math.floor(Math.random() * 2)], { quip: true }); }
        }
      }
    }
    // robots get bumped (and disabled by hard hits); people get moved aside safely
    const sp = Math.hypot(this.vel.x, this.vel.z);
    for (const r of G.robots.list) {
      if (!r.alive || r.def.fly) continue;
      const dx = r.pos.x - this.pos.x, dz = r.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d < T.r + r.def.r + 0.6 && Math.abs(r.pos.y - this.pos.y) < 2) {
        if (sp > 7 && !r.def.still && (r.lastRam || 0) < G.time - 0.6) { r.lastRam = G.time; const res = r.hurt(sp * 5, { area: true, stun: 1.2 }); if (res && res.killed) G.ui.takedown(); r.vel.x += (dx / d) * sp * 0.6; r.vel.z += (dz / d) * sp * 0.6; }
        this.vel.multiplyScalar(0.85);
      }
    }
    G.allies.shove(this.pos, T.r + 0.6, this.vel);
    const P = G.player;
    if (!P.vehicle) {
      const dx = P.pos.x - this.pos.x, dz = P.pos.z - this.pos.z, d = Math.hypot(dx, dz);
      if (d < T.r + 0.6 && d > 0.01) { P.pos.x += (dx / d) * (T.r + 0.65 - d); P.pos.z += (dz / d) * (T.r + 0.65 - d); }
    }
    for (const v of this.sys.list) {
      if (v === this || v.dead) continue;
      const dx = v.pos.x - this.pos.x, dz = v.pos.z - this.pos.z, d = Math.hypot(dx, dz), m = T.r + v.T.r;
      if (d < m && d > 0.01) { this.pos.x -= (dx / d) * (m - d); this.pos.z -= (dz / d) * (m - d); }
    }
  }

  fire() {
    const G = this.G, T = this.T;
    const cam = G.camera, f = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    if (T.cannon) {
      this.fireT = 1.6;
      const o = this.turretTip();
      // aim at whatever the camera crosshair points at
      const aim = castShot(G, cam.position.x, cam.position.y, cam.position.z, f.x, f.y, f.z, 160);
      const tgt = aim ? aim : { x: cam.position.x + f.x * 160, y: cam.position.y + f.y * 160, z: cam.position.z + f.z * 160 };
      const dx = tgt.x - o.x, dy = tgt.y - o.y, dz = tgt.z - o.z, L = Math.hypot(dx, dy, dz);
      const hit = castShot(G, o.x, o.y, o.z, dx / L, dy / L, dz / L, 160);
      const end = hit || tgt;
      G.fx.beam(o.x, o.y, o.z, end.x, end.y, end.z, 0x7dffb0, 0.3);
      G.fx.tracer(o.x, o.y, o.z, end.x, end.y, end.z, 0x7dffb0, 0.3);
      G.combat.areaBurst(end.x, end.y, end.z, 5.5, 85, 1.5, 0x7dffb0, "fluxBoom");
      G.player.shake = 0.4;
    } else if (T.fly) {
      this.fireT = 0.14;
      for (const side of [-1.6, 1.6]) {
        const o = new THREE.Vector3(side, 0.9, -2).applyEuler(this.mesh.rotation).add(this.pos);
        const hit = castShot(G, o.x, o.y, o.z, f.x, f.y, f.z, 150);
        const end = hit || { x: o.x + f.x * 150, y: o.y + f.y * 150, z: o.z + f.z * 150 };
        G.fx.tracer(o.x, o.y, o.z, end.x, end.y, end.z, 0x7ff7ff, 0.06);
        if (hit && hit.target) { const r = hit.target.hurt(11, { x: hit.x, y: hit.y, z: hit.z, part: hit.part }); if (r) { G.weapons.hitMarkT = 0.12; if (r.killed) G.ui.takedown(); } }
      }
      G.audio.play("carbine", 0.7);
    }
  }
  turretTip() {
    const t = this.turret;
    return new THREE.Vector3(0, 0.1, -3.2).applyMatrix4(t.matrixWorld);
  }
  gunnerFire(dt) {
    const G = this.G;
    this.gunT = (this.gunT || 0) - dt;
    if (this.gunT > 0) return;
    let best = null, bd = 45;
    for (const r of G.robots.list) {
      if (!r.alive) continue;
      const d = r.pos.distanceTo(this.pos);
      if (d < bd && G.col.clearLine(this.pos.x, this.pos.y + 2, this.pos.z, r.pos.x, r.pos.y + r.def.h * 0.6, r.pos.z)) { bd = d; best = r; }
    }
    if (!best) { this.gunT = 0.4; return; }
    this.gunT = 0.25;
    const o = new THREE.Vector3(); this.turret.getWorldPosition(o);
    this.turretAim = Math.atan2(-(best.pos.x - this.pos.x), -(best.pos.z - this.pos.z));
    G.fx.tracer(o.x, o.y, o.z, best.pos.x, best.pos.y + best.def.h * 0.6, best.pos.z, 0x7ff7ff, 0.06);
    G.audio.play("carbine", 0.35);
    const r = best.hurt(6, { x: best.pos.x, y: best.pos.y + 1, z: best.pos.z });
    if (r && r.killed) G.ui.takedown();
  }
  recover() {
    const G = this.G;
    const q = G.nav.nearestOk(this.pos.x, this.pos.z, 20);
    if (!q) return;
    this.pos.set(q[0], this.groundY(q[0], q[1]) + 0.3, q[1]); this.vel.set(0, 0, 0); this.pitch = this.roll = 0; this.air = false;
    G.ui.toast("LUMA nudged your vehicle back onto solid ground.");
  }
  sync() {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(0, this.yaw, 0);
    this.body.rotation.set(this.T.fly ? this.pitch : -this.pitch * 0, 0, this.roll);
    if (!this.T.fly) this.body.rotation.x = this.pitch;
    const sp = this.vel.x * -Math.sin(this.yaw) + this.vel.z * -Math.cos(this.yaw);
    for (const w of this.wheels) {
      const u = w.userData;
      if (u.spin) {
        u.spin.rotation.x -= sp * (this.G.dtFrame || 0.016) / 0.55;
        w.rotation.y = u.front ? this.steerVis : 0;
        // each wheel follows the ground under it (suspension)
        const c = Math.cos(this.yaw), s2 = Math.sin(this.yaw);
        const wx = this.pos.x + u.x * c + u.z * s2, wz = this.pos.z - u.x * s2 + u.z * c;
        const gy = this.groundY(wx, wz) - this.pos.y;
        w.position.y = 0.55 + clamp(gy, -0.25, 0.25);
        u.arm.position.y = 0.62 + clamp(gy, -0.25, 0.25) * 0.5;
      } else w.rotation.x -= sp * 0.03;
    }
    if (this.turret && this.T.cannon && this.driver) {
      this.turret.rotation.y = angleWrap(this.sys.camYaw - this.yaw);
      this.turret.userData.barrel.rotation.x = 0;
    } else if (this.turret && this.turretAim !== undefined) this.turret.rotation.y = angleWrap(this.turretAim - this.yaw);
  }
}

export class Vehicles {
  constructor(G) {
    this.G = G; this.list = [];
    this.camYaw = 0; this.camPitch = -0.2;
    this.camPos = new THREE.Vector3();
  }
  spawn(type, x, z, yaw) { const v = new Vehicle(this, type, x, z, yaw); this.list.push(v); return v; }
  remove(v) { this.G.scene.remove(v.mesh); this.list = this.list.filter((q) => q !== v); }
  clearAll() { for (const v of this.list) this.G.scene.remove(v.mesh); this.list = []; }
  ofType(t) { return this.list.find((v) => v.type === t && !v.dead); }
  nearest(pos, R = 4) {
    let best = null, bd = R;
    for (const v of this.list) { if (v.dead) continue; const d = v.pos.distanceTo(pos); if (d < bd + v.T.r) { bd = d; best = v; } }
    return best;
  }
  enter(v) {
    const G = this.G, P = G.player;
    if (P.carry) { G.items.dropCarry(); }
    P.vehicle = v; v.driver = P; P.tether = null;
    this.seatDriver(v);
    this.camYaw = v.yaw; this.camPitch = -0.2;
    // a following ranger hops in as gunner
    const f = G.allies.followers()[0];
    if (f && v.type === "rover") { v.gunner = f; f.seated = true; }
    G.setFlag("drove:" + v.type);
    G.audio.play("ui");
    G.ui.toast(v.type === "skyfin" ? "Skyfin: mouse to steer, W/S throttle, Space/C up and down, click to fire, E to exit." :
      v.type === "skiff" ? "Skiff: mouse to steer, W/S throttle, A/D slide sideways, Shift boost, E to exit." :
      v.type === "crawler" ? "Crawler: W/S drive, A/D turn, mouse aims the cannon, click to fire, E to exit." :
      "Rover: W/S drive, A/D steer, Space handbrake, Shift boost, E to exit.");
  }
  // show the Guardian in the seat while driving (third-person view)
  seatDriver(v) {
    if (v.pilot) return;
    const m = buildGuardian(this.G.suitColors(), v.type !== "skiff");
    const seat = { rover: [-0.45, 0.0, 0.1], skiff: [0, 0.82, 0.2], crawler: [0, 0.7, -0.5], skyfin: [0, 0.35, -1.0] }[v.type];
    m.position.set(...seat);
    if (v.type === "crawler" || v.type === "skyfin") m.scale.setScalar(0.85);
    (v.body || v.mesh).add(m); v.pilot = m;
  }
  exit(force) {
    const G = this.G, P = G.player, v = P.vehicle;
    if (!v) return;
    if (v.T.fly && !v.landed && !force && v.pos.y - G.terrain.surfaceAt(v.pos.x, v.pos.z) > 4) { G.ui.toast("Land first (hold C to descend), or you'll take a long step."); return; }
    const right = [Math.cos(v.yaw), -Math.sin(v.yaw)], fwd = [-Math.sin(v.yaw), -Math.cos(v.yaw)];
    const opts = [[-right[0] * (v.T.wid / 2 + 1), -right[1] * (v.T.wid / 2 + 1)], [right[0] * (v.T.wid / 2 + 1), right[1] * (v.T.wid / 2 + 1)], [-fwd[0] * (v.T.len / 2 + 1.2), -fwd[1] * (v.T.len / 2 + 1.2)], [fwd[0] * (v.T.len / 2 + 1.2), fwd[1] * (v.T.len / 2 + 1.2)]];
    let spot = null;
    for (const [dx, dz] of opts) {
      const x = v.pos.x + dx, z = v.pos.z + dz;
      if (G.terrain.heightAt(x, z) < WATER_Y - 1.2) continue;
      const y = G.col.groundAt(x, z, v.pos.y + 1.5, 0.4);
      if (Math.abs(y - v.pos.y) > 2.5) continue;
      if (G.col.inside(x, y + 0.9, z) || G.col.inside(x, y + 1.6, z)) continue;
      spot = [x, y, z]; break;
    }
    if (!spot) spot = [v.pos.x, v.pos.y + 2.6, v.pos.z];
    P.vehicle = null; v.driver = null;
    if (v.pilot) { v.mesh.remove(v.pilot); v.pilot = null; }
    if (v.gunner) { const g = v.gunner; g.seated = false; g.pos.set(spot[0] + 1, spot[1], spot[2] + 1); v.gunner = null; }
    P.place(spot[0], spot[1], spot[2], this.camYaw);
    if (force) { P.vel.y = 9; P.invuln = 1.5; }
    G.audio.play("ui");
  }
  destroy(v) {
    const G = this.G;
    v.dead = 0.01;
    G.fx.burst(v.pos.x, v.pos.y + 1, v.pos.z, 0x9fe8ff, 30, 6, 0.12, 0.8, 4);
    G.audio.play("powerdown");
    if (v.driver) { this.exit(true); G.ui.toast(`${v.name} powered down. Your suit shield kept you safe. Request another at any base pad.`); }
  }
  update(dt) {
    const G = this.G, P = G.player;
    const v = P.vehicle;
    if (v) {
      const S = G.settings, sens = S.sens * 0.0022;
      this.camYaw -= G.input.mdx * sens;
      this.camPitch = clamp(this.camPitch - G.input.mdy * sens * (S.invert ? -1 : 1), -1.0, 0.6);
    }
    for (const q of this.list) q.update(dt);
  }
  // third-person camera with obstacle handling
  applyCamera(cam) {
    const G = this.G, v = G.player.vehicle;
    const T = v.T;
    const tx = v.pos.x, ty = v.pos.y + 2.4, tz = v.pos.z;
    const cp = Math.cos(this.camPitch);
    const dx = Math.sin(this.camYaw) * cp, dy = -Math.sin(this.camPitch), dz = Math.cos(this.camYaw) * cp;
    let d = T.cam;
    const hit = G.col.raycast(tx, ty, tz, dx, dy, dz, d, {});
    if (hit) d = Math.max(1.5, hit.t - 0.4);
    let cx = tx + dx * d, cy = ty + dy * d, cz = tz + dz * d;
    cy = Math.max(cy, G.terrain.heightAt(cx, cz) + 0.6);
    this.camPos.lerp(new THREE.Vector3(cx, cy, cz), 0.5);
    if (this.camPos.distanceTo(new THREE.Vector3(cx, cy, cz)) > 6) this.camPos.set(cx, cy, cz);
    cam.position.copy(this.camPos);
    cam.rotation.set(this.camPitch, this.camYaw, 0, "YXZ");
  }
}
