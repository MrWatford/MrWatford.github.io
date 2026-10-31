// Aegis Frontier: friendly people. Rangers fight robots and withdraw when their shields drop (they
// are never defeated). Researchers and Pilot Rowan never fight and are never targeted.
// Escort transports, and Rowan's dropship for deliveries and evacuations, live here too.
import * as THREE from "../lib/three.module.min.js";
import { clamp, lerp, angleWrap } from "./util.js";

const SUITS = { ranger: [0x3e8f4f, 0xeef3e6, 0xffb23e], civ: [0xf0c35a, 0xf5f5f5, 0x3a6fd6], rowan: [0xff8a2a, 0xffffff, 0x2f6fd6] };
const CIV_COLORS = [0xf0c35a, 0x6fc3f0, 0xe58bd0, 0x9be07a, 0xf09a6f];

function person(kind, k = 0) {
  const g = new THREE.Group();
  const [a, b, c] = SUITS[kind];
  const main = kind === "civ" ? CIV_COLORS[k % CIV_COLORS.length] : a;
  const M = (col) => new THREE.MeshLambertMaterial({ color: col });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(0.5, 0.62, 0.3), M(main), 0, 1.15, 0);
  add(new THREE.BoxGeometry(0.52, 0.1, 0.32), M(c), 0, 1.3, 0);
  const head = add(new THREE.SphereGeometry(0.19, 12, 10), M(b), 0, 1.66, 0);
  add(new THREE.BoxGeometry(0.26, 0.09, 0.05), new THREE.MeshBasicMaterial({ color: kind === "civ" ? 0x2a3a4a : 0x6ff2e0 }), 0, 1.68, -0.17);
  const legs = [add(new THREE.BoxGeometry(0.17, 0.82, 0.2), M(b), -0.13, 0.41, 0), add(new THREE.BoxGeometry(0.17, 0.82, 0.2), M(b), 0.13, 0.41, 0)];
  const arms = [add(new THREE.BoxGeometry(0.13, 0.58, 0.15), M(main), -0.33, 1.13, 0), add(new THREE.BoxGeometry(0.13, 0.58, 0.15), M(main), 0.33, 1.13, 0)];
  if (kind === "ranger") add(new THREE.BoxGeometry(0.1, 0.12, 0.6), M(0x39414e), 0.33, 1.1, -0.3);
  if (kind === "civ") add(new THREE.BoxGeometry(0.34, 0.4, 0.16), M(0x8a6a48), 0, 1.15, 0.22);
  g.userData = { legs, arms, head };
  return g;
}

class Ally {
  constructor(sys, kind, x, y, z, o = {}) {
    this.sys = sys; this.G = sys.G; this.kind = kind;
    this.pos = new THREE.Vector3(x, y, z); this.vel = new THREE.Vector3(); this.yaw = o.yaw || 0;
    this.mode = o.mode || "idle"; this.home = this.pos.clone();
    this.shield = 100; this.recoverT = 0; this.fireT = 1; this.stuckT = 0; this.lastPos = this.pos.clone();
    this.path = null; this.pathI = 0; this.repathT = 0;
    this.mesh = person(kind, o.k || 0); this.G.scene.add(this.mesh);
    this.tag = o.tag; this.radius = 0.6; this.aimY = 1.1; this.isAlly = true;
    this.wander = o.wander; this.seated = false; this.say = o.say;
  }
  active() { return this.kind === "ranger" && this.recoverT <= 0 && !this.seated && this.mesh.visible; }
  hurt(dmg) {
    if (this.kind !== "ranger") return;
    this.shield -= dmg * 0.7;
    this.G.fx.burst(this.pos.x, this.pos.y + 1.2, this.pos.z, 0x88ddff, 3, 2, 0.05, 0.2, 0);
    if (this.shield <= 0) { this.shield = 0; this.recoverT = 7; if (this.G.time - (this.sys.lineT || 0) > 15) { this.sys.lineT = this.G.time; this.G.say("ranger", "Shields down—falling back to recharge!", { quip: true, short: true }); } }
  }
  goTo(x, z, speed, dt) {
    const G = this.G;
    if (!this.path || this.repathT <= 0 || !this.goal || Math.hypot(this.goal[0] - x, this.goal[1] - z) > 4) {
      this.path = G.nav.find(this.pos.x, this.pos.z, x, z, 1500); this.pathI = 0; this.goal = [x, z]; this.repathT = 1.5;
    }
    if (!this.path || this.pathI >= this.path.length) { this.vel.x *= 0.8; this.vel.z *= 0.8; return true; }
    const [px, pz] = this.path[this.pathI];
    const dx = px - this.pos.x, dz = pz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.8) { this.pathI++; return false; }
    this.vel.x = lerp(this.vel.x, (dx / d) * speed, Math.min(1, dt * 6)); this.vel.z = lerp(this.vel.z, (dz / d) * speed, Math.min(1, dt * 6));
    this.yaw = Math.atan2(-dx, -dz);
    return false;
  }
  update(dt) {
    const G = this.G, P = G.player;
    if (this.seated) { this.mesh.visible = false; return; }
    this.mesh.visible = true;
    this.repathT -= dt;
    if (this.recoverT > 0) { this.recoverT -= dt; if (this.recoverT <= 0) this.shield = 100; }
    else if (this.shield < 100) this.shield = Math.min(100, this.shield + 6 * dt);
    let moving = false;
    if (this.mode === "follow") {
      const pp = P.vehicle ? P.vehicle.pos : P.pos;
      const d = Math.hypot(pp.x - this.pos.x, pp.z - this.pos.z);
      // regroup quietly if far behind or stuck
      if ((d > 45 || this.stuckT > 5) && !this.visibleToPlayer()) { this.regroup(); return; }
      if (d > 4.5) { this.goTo(pp.x + Math.sin(this.slot || 0) * 2.5, pp.z + Math.cos(this.slot || 0) * 2.5, d > 12 ? 7.5 : 5.2, dt); moving = true; }
      else { this.vel.x *= 0.8; this.vel.z *= 0.8; }
    } else if (this.mode === "goto" && this.dest) {
      moving = !this.goTo(this.dest[0], this.dest[1], this.speed || 4, dt);
      if (!moving && this.onArrive) { const f = this.onArrive; this.onArrive = null; f(this); }
    } else if (this.wander) {
      this.wT = (this.wT || 0) - dt;
      if (this.wT <= 0) { this.wT = 5 + Math.random() * 6; this.wdest = [this.home.x + (Math.random() - 0.5) * 10, this.home.z + (Math.random() - 0.5) * 10]; }
      if (this.wdest && !this.goTo(this.wdest[0], this.wdest[1], 1.6, dt)) moving = true;
    } else { this.vel.x *= 0.8; this.vel.z *= 0.8; }
    // rangers shoot at robots they can see
    if (this.kind === "ranger" && this.recoverT <= 0) this.combat(dt);
    // withdraw: move behind the player while recharging
    if (this.recoverT > 0 && this.mode === "follow") { const pp = P.pos; this.goTo(pp.x - Math.sin(P.yaw) * 4, pp.z - Math.cos(P.yaw) * 4, 6, dt); }
    this.physics(dt);
    // stuck detection
    if (moving && this.lastPos.distanceTo(this.pos) < 0.5 * dt * 2) this.stuckT += dt; else this.stuckT = Math.max(0, this.stuckT - dt);
    this.lastPos.copy(this.pos);
    this.sync(dt);
  }
  visibleToPlayer() {
    const G = this.G, e = G.player.eye(new THREE.Vector3()), f = G.player.forward(new THREE.Vector3());
    const dx = this.pos.x - e.x, dz = this.pos.z - e.z, d = Math.hypot(dx, dz);
    if (d > 60) return false;
    return (dx * f.x + dz * f.z) / d > 0.5;
  }
  regroup() {
    const G = this.G, P = G.player;
    const pp = P.vehicle ? P.vehicle.pos : P.pos;
    const bx = pp.x + Math.sin(P.yaw) * 4, bz = pp.z + Math.cos(P.yaw) * 4;
    const q = G.nav.nearestOk(bx, bz, 10);
    if (!q) return;
    this.pos.set(q[0], G.col.groundAt(q[0], q[1], G.terrain.heightAt(q[0], q[1]) + 2), q[1]);
    this.path = null; this.stuckT = 0;
  }
  combat(dt) {
    const G = this.G;
    this.fireT -= dt;
    if (this.fireT > 0) return;
    this.fireT = 0.7 + Math.random() * 0.4;
    let best = null, bd = 40;
    for (const r of G.robots.list) {
      if (!r.alive) continue;
      const d = r.pos.distanceTo(this.pos);
      if (d < bd && G.col.clearLine(this.pos.x, this.pos.y + 1.5, this.pos.z, r.pos.x, r.pos.y + r.def.h * 0.6, r.pos.z)) { bd = d; best = r; }
    }
    if (!best) return;
    this.yaw = Math.atan2(-(best.pos.x - this.pos.x), -(best.pos.z - this.pos.z));
    const hit = Math.random() < 0.7;
    const tx = best.pos.x + (hit ? 0 : (Math.random() - 0.5) * 2), ty = best.pos.y + best.def.h * 0.6, tz = best.pos.z + (hit ? 0 : (Math.random() - 0.5) * 2);
    G.fx.tracer(this.pos.x, this.pos.y + 1.3, this.pos.z, tx, ty, tz, 0x7affc8, 0.07);
    G.audio.play("carbine", 0.25);
    if (hit) { const r = best.hurt(7, { x: tx, y: ty, z: tz }); if (r && r.killed) G.onAllyTakedown(); }
  }
  physics(dt) {
    const G = this.G;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    G.col.pushOut(this.pos, 0.4, 1.8, 0.45, null);
    this.pos.y = G.col.groundAt(this.pos.x, this.pos.z, this.pos.y + 0.6, 0.4);
    if (this.pos.y < -1.2) this.regroup();
  }
  sync(dt) {
    const m = this.mesh, u = m.userData;
    m.position.copy(this.pos); m.rotation.y = this.yaw;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const sw = Math.sin(this.G.time * 8 + this.pos.x) * Math.min(1, sp / 3) * 0.6;
    u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw; u.arms[0].rotation.x = -sw * 0.6; u.arms[1].rotation.x = sw * 0.6;
    if (this.cheer) u.arms.forEach((a) => (a.rotation.z = Math.sin(this.G.time * 10) * 0.5 + (a === u.arms[0] ? 2.6 : -2.6)));
    else u.arms.forEach((a) => (a.rotation.z = 0));
  }
  remove() { this.G.scene.remove(this.mesh); this.removed = true; }
}

// ---------------- Escorts ----------------
class Escort {
  constructor(sys, def) {
    this.sys = sys; this.G = sys.G; this.def = def;
    this.path = def.path; this.i = 1;
    const [x, z] = this.path[0];
    this.pos = new THREE.Vector3(x, this.G.col.groundAt(x, z, this.G.terrain.heightAt(x, z) + 3), z);
    this.vel = new THREE.Vector3();
    this.hp = def.hp; this.max = def.hp; this.radius = 2.2; this.aimY = 1.2; this.isEscort = true;
    this.blocked = false;
    const g = new THREE.Group();
    const M = (c) => new THREE.MeshLambertMaterial({ color: c });
    const b = (w, h, d, c, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); o.position.set(x, y, z); o.castShadow = true; g.add(o); };
    if (def.hover) { b(3, 1, 5, 0xf4f6f8, 0, 1.2, 0); b(2.4, 1.2, 2.4, 0x2fd6c4, 0, 2.1, 0.6); const gl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 5.2), new THREE.MeshBasicMaterial({ color: 0x6ff2e0 })); gl.position.y = 0.55; g.add(gl); }
    else { b(2.8, 1.8, 6, 0xf4f6f8, 0, 1.4, 0); b(2.6, 0.6, 3, 0xff8a2a, 0, 2.6, 0.8); for (const x of [-1.4, 1.4]) for (const z of [-2, 2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 10), M(0x2a2a2a)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.55, z); g.add(w); } }
    this.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(3.6, 16, 10), new THREE.MeshBasicMaterial({ color: 0x6ff2e0, transparent: true, opacity: 0.12, depthWrite: false }));
    this.shieldMesh.position.y = 1.4; g.add(this.shieldMesh);
    this.mesh = g; this.G.scene.add(g);
  }
  active() { return true; }
  hurt(dmg) { this.hp -= dmg * 0.6; this.shieldMesh.material.opacity = 0.35; if (this.hp <= 0) this.G.onEscortFail(this); }
  update(dt) {
    const G = this.G;
    this.shieldMesh.material.opacity = lerp(this.shieldMesh.material.opacity, 0.12, dt * 3);
    if (this.hp < this.max) this.hp = Math.min(this.max, this.hp + 4 * dt);
    // wait while robots are close, or the player is far behind
    let threat = false;
    for (const r of G.robots.list) if (r.alive && r.pos.distanceTo(this.pos) < 28) { threat = true; break; }
    const pd = G.player.pos.distanceTo(this.pos);
    this.blocked = threat; this.waiting = pd > 60;
    if (this.i >= this.path.length) return;
    if (threat || this.waiting) return;
    const [tx, tz] = this.path[this.i];
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 1.5) { this.i++; if (this.i >= this.path.length) G.onEscortArrive(this); return; }
    const sp = this.def.speed;
    this.pos.x += (dx / d) * sp * dt; this.pos.z += (dz / d) * sp * dt;
    const gy = this.def.hover ? Math.max(G.terrain.surfaceAt(this.pos.x, this.pos.z), G.col.groundAt(this.pos.x, this.pos.z, this.pos.y + 1.5)) : G.col.groundAt(this.pos.x, this.pos.z, this.pos.y + 1.5);
    this.pos.y = lerp(this.pos.y, gy, Math.min(1, dt * 6));
    this.mesh.position.copy(this.pos); this.mesh.rotation.y = Math.atan2(dx, dz);
  }
  remove() { this.G.scene.remove(this.mesh); }
}

// ---------------- Rowan's dropship ----------------
class Dropship {
  constructor(G) {
    this.G = G;
    const g = new THREE.Group();
    const M = (c) => new THREE.MeshLambertMaterial({ color: c });
    const b = (w, h, d, c, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); o.position.set(x, y, z); g.add(o); return o; };
    b(3.4, 1.8, 9, 0xf4f6f8, 0, 0, 0); b(2.6, 1.2, 2.6, 0x9fd8ff, 0, 0.5, -4); b(9, 0.3, 2.4, 0xff8a2a, 0, 0.3, 1); b(0.3, 2, 2, 0x2f6fd6, 0, 1.5, 4);
    for (const x of [-4, 4]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10), new THREE.MeshBasicMaterial({ color: 0x6ff2e0 })); e.position.set(x, -0.2, 1); g.add(e); }
    this.cargo = b(3, 1.6, 4.4, 0x3e8f4f, 0, -1.8, 0); this.cargo.visible = false;
    this.mesh = g; g.visible = false; G.scene.add(g);
    this.queue = []; this.job = null;
  }
  busy() { return !!this.job; }
  add(job) { this.queue.push(job); }
  update(dt) {
    const G = this.G;
    if (!this.job && this.queue.length) { this.job = this.queue.shift(); this.job.t = 0; this.mesh.visible = true; this.cargo.visible = !!this.job.cargo; G.audio.play("deliver"); }
    const j = this.job;
    if (!j) return;
    j.t += dt;
    const gy = G.terrain.surfaceAt(j.x, j.z);
    const hover = j.hover || 9;
    if (j.t < 4) { const k = j.t / 4; this.mesh.position.set(j.x + 140 * (1 - k), gy + hover + 70 * (1 - k) * (1 - k), j.z + 60 * (1 - k)); this.mesh.rotation.y = Math.atan2(140, 60); }
    else if (!j.done) {
      j.done = true; this.cargo.visible = false;
      G.fx.beam(j.x, gy + hover, j.z, j.x, gy, j.z, 0x6ff2e0, 0.9);
      j.at && j.at();
    } else if (j.t < 5.5) { G.fx.beam(j.x, gy + hover - 1, j.z, j.x, gy, j.z, 0x6ff2e0, 0.6); }
    else if (j.t < 10) { const k = (j.t - 5.5) / 4.5; this.mesh.position.set(j.x - 160 * k, gy + hover + 90 * k * k, j.z - 50 * k); }
    else { this.job = null; this.mesh.visible = false; }
  }
}

export class Allies {
  constructor(G) {
    this.G = G;
    this.list = [];
    this.escorts = [];
    this.dropship = new Dropship(G);
  }
  add(kind, x, z, o = {}) {
    const G = this.G;
    const q = G.nav.nearestOk(x, z, 8) || [x, z];
    const y = G.col.groundAt(q[0], q[1], G.terrain.heightAt(q[0], q[1]) + 2);
    const a = new Ally(this, kind, q[0], y, q[1], o);
    this.list.push(a);
    return a;
  }
  byTag(tag) { return this.list.filter((a) => a.tag === tag && !a.removed); }
  removeTag(tag) { for (const a of this.list) if (a.tag === tag) a.remove(); this.list = this.list.filter((a) => !a.removed); }
  followers() { return this.list.filter((a) => a.mode === "follow" && a.kind === "ranger"); }
  combatants() { const out = this.list.filter((a) => a.active()); for (const e of this.escorts) out.push(e); return out; }
  addEscort(def) { const e = new Escort(this, def); this.escorts.push(e); return e; }
  clearEscorts() { for (const e of this.escorts) e.remove(); this.escorts.length = 0; }
  // Vehicles gently shove people aside instead of hurting them.
  shove(pos, radius, vel) {
    for (const a of this.list) {
      if (a.seated) continue;
      const dx = a.pos.x - pos.x, dz = a.pos.z - pos.z, d = Math.hypot(dx, dz);
      if (d < radius + 0.6 && d > 0.01) {
        const push = radius + 0.7 - d;
        a.pos.x += (dx / d) * push; a.pos.z += (dz / d) * push;
        a.G.col.pushOut(a.pos, 0.4, 1.8, 0.45, null);
      }
    }
  }
  update(dt) {
    const near = this.G.player.pos;
    for (const a of this.list) {
      if (Math.abs(a.pos.x - near.x) > 200 || Math.abs(a.pos.z - near.z) > 200) { if (a.mode !== "follow") continue; }
      a.update(dt);
    }
    this.list = this.list.filter((a) => !a.removed);
    for (const e of this.escorts) e.update(dt);
    this.dropship.update(dt);
    let slot = 0;
    for (const f of this.followers()) f.slot = slot++ * 2.1 + 2.4;
  }
  clearAll() { for (const a of this.list) a.remove(); this.list = []; this.clearEscorts(); }
}
