// Ringfall: Directorate robots. Every hostile is a machine; when disabled it folds down and
// dissolves into harmless holographic particles. AI: idle/patrol, investigate, alert, engage,
// reposition, search, return, disabled — with real sight lines, cover, flanking, and attack limits.
import * as THREE from "../lib/three.module.min.js";
import { ROBOTS, COMMANDERS, ROBOT_LINES } from "./content.js";
import { clamp, lerp, angleWrap, rng } from "./util.js";
import { buildRobotModel } from "./models.js";

const MAT = {
  body: new THREE.MeshLambertMaterial({ color: 0x353a44 }),
  light: new THREE.MeshLambertMaterial({ color: 0xa3abb6 }),
  trim: new THREE.MeshLambertMaterial({ color: 0x5b4a82 }),
  cmd: new THREE.MeshLambertMaterial({ color: 0xc9a227 }),
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
let uid = 1;

function glowMat(c) { return new THREE.MeshBasicMaterial({ color: c }); }
function box(g, w, h, d, m, x, y, z) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; }
function sph(g, r, m, x, y, z) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); o.position.set(x, y, z); g.add(o); return o; }

// Models now come from models.js (beveled armor, jointed legs, sensor lights).
function buildRobot(type, cmd) { return buildRobotModel(type, cmd); }

class Robot {
  constructor(sys, type, x, y, z, opts, enc) {
    this.sys = sys; this.G = sys.G; this.id = uid++;
    this.type = type; this.enc = enc; this.opts = opts || {};
    const cmd = this.opts.cmd ? COMMANDERS[this.opts.cmd] : null;
    this.cmd = cmd; this.cmdId = this.opts.cmd;
    const base = ROBOTS[type];
    const D = this.G.diff;
    this.def = { ...base, ...(cmd ? { hp: cmd.hp, shield: cmd.shield ?? base.shield, armor: cmd.armor ?? base.armor } : {}) };
    if (this.opts.training) { this.def.hp = 30; this.def.dmg = 2; this.def.rest = 2.2; }
    this.maxHp = this.def.hp * (cmd ? 1 : D.enemyHp); this.hp = this.maxHp;
    this.maxShield = (this.def.shield || 0) * (cmd ? 1 : D.enemyHp); this.shield = this.maxShield;
    this.pos = new THREE.Vector3(x, y, z); this.home = this.pos.clone();
    this.vel = new THREE.Vector3();
    this.yaw = this.opts.yaw ?? Math.random() * 6.28; this.homeYaw = this.yaw;
    this.posted = (this.opts.y || 0) > 0.5 || this.def.still;
    this.alive = true; this.dying = 0;
    this.state = this.opts.patrol ? "patrol" : "idle";
    this.stateT = 0; this.senseT = Math.random() * 0.3; this.fireT = 1 + Math.random(); this.burstLeft = 0;
    this.stunT = 0; this.slowT = 0; this.markT = 0; this.shieldRegenT = 0;
    this.path = null; this.pathI = 0; this.repathT = 0; this.goal = null;
    this.target = null; this.lastSeen = new THREE.Vector3(); this.seenT = -99; this.lostT = 0;
    this.patrolI = 0;
    this.hasToken = false;
    this.alt = 7 + Math.random() * 5;
    this.orbitA = Math.random() * 6.28;
    this.frontUp = !!this.def.front; this.frontDownT = 0;
    this.slamT = 0; this.recoverT = 0; this.telegraphT = 0;
    this.emitters = [];
    if (cmd && cmd.emitters) for (let k = 0; k < cmd.emitters; k++) this.emitters.push({ hp: 90, max: 90, a: (k / cmd.emitters) * Math.PI * 2 });
    this.summonT = 8; this.hopT = 6; this.barrierT = 4; this.repairTarget = null;
    this.powerHp = this.def.power ? 70 : 0;
    const { g, P } = buildRobot(type, !!cmd);
    this.mesh = g; this.parts = P;
    const s = cmd ? 1.25 : 1; g.scale.setScalar(s); this.scale = s;
    if (cmd) { this.def.h *= s; this.def.r *= s; }
    if (this.emitters.length) {
      this.emitterMeshes = this.emitters.map(() => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), glowMat(0x7af0ff)); this.G.scene.add(m); return m; });
      this.bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), new THREE.MeshBasicMaterial({ color: 0x7af0ff, transparent: true, opacity: 0.18, depthWrite: false }));
      this.G.scene.add(this.bubble);
    }
    this.G.scene.add(g);
    this.sync();
  }
  get emittersUp() { return this.emitters.some((e) => e.hp > 0); }

  // ---------- damage ----------
  hurt(dmg, o = {}) {
    if (!this.alive) return null;
    const G = this.G, r = { blocked: false, weak: false, shield: false, killed: false };
    if (this.markT > 0 && G.player.tier("beacon") >= 4) dmg *= 1.1;
    if (o.part && o.part.startsWith("em")) {
      const e = this.emitters[+o.part.slice(2)];
      if (e && e.hp > 0) { e.hp -= dmg * (o.shieldMul || 1); if (e.hp <= 0) { G.fx.burst(o.x, o.y, o.z, 0x7af0ff, 14, 5, 0.1, 0.5, 4); G.audio.play("powerdown"); if (!this.emittersUp) G.ui.toast(`${this.cmd.name}'s shield is down!`); } }
      this.provoke(); return r;
    }
    if (o.part === "power") {
      this.powerHp -= dmg;
      if (this.powerHp <= 0) { G.fx.burst(o.x, o.y, o.z, 0xffb347, 16, 5, 0.1, 0.5, 4); this.disable(); r.killed = true; }
      return r;
    }
    if (this.emittersUp && !o.area) { r.blocked = true; this.provoke(); return r; }
    if (o.part === "front" && this.frontUp) { r.blocked = true; this.provoke(); return r; }
    if (o.part === "weak") { r.weak = true; dmg *= o.weakMul || 1.6; }
    else if (this.def.armor && this.recoverT <= 0) dmg *= 1 - this.def.armor;
    if (this.recoverT > 0) dmg *= 1.5;
    if (this.shield > 0) {
      const sd = dmg * (o.shieldMul || 1);
      r.shield = true;
      if (sd <= this.shield) { this.shield -= sd; dmg = 0; }
      else { dmg = (sd - this.shield) / (o.shieldMul || 1); this.shield = 0; G.fx.burst(this.pos.x, this.pos.y + this.def.h * 0.6, this.pos.z, 0x88ddff, 10, 4, 0.08, 0.4, 2); }
      this.shieldRegenT = 5;
    }
    this.hp -= dmg;
    if (o.stun) this.stun(o.stun);
    if (o.interrupt) { this.telegraphT = 0; this.slamT = 0; this.repairTarget = null; if (this.charging) this.charging = 0; }
    if (o.knockFront && this.def.front) { this.frontUp = false; this.frontDownT = 6; }
    this.provoke();
    if (this.hp <= 0) { this.disable(); r.killed = true; }
    return r;
  }
  provoke() {
    if (this.state === "engage" || this.state === "alert") { this.seenT = this.G.time; return; }
    const pt = this.sys.playerTarget;
    this.target = pt; this.lastSeen.copy(pt.pos); this.seenT = this.G.time;
    this.setState("alert");
  }
  stun(t) {
    if (!this.alive) return;
    this.stunT = Math.max(this.stunT, t * (this.cmd ? 0.5 : 1));
    if (this.def.front && t >= 1) { this.frontUp = false; this.frontDownT = 6; }
  }
  disable() {
    if (!this.alive) return;
    const G = this.G;
    this.alive = false; this.dying = 0.0; this.releaseToken();
    G.audio.play("powerdown");
    if (Math.random() < (G.mods.banter ? 0.5 : 0.12)) this.sys.robotLine("disabled", this, true);
    this.parts.eye.emissive.set(0x111111);
    if (this.bubble) { G.scene.remove(this.bubble); this.emitterMeshes.forEach((m) => G.scene.remove(m)); }
    this.sys.onDisabled(this);
  }

  setState(s) {
    if (this.state === s) return;
    if (s === "alert" && (this.state === "idle" || this.state === "patrol" || this.state === "investigate" || this.state === "return")) {
      this.G.audio.play("alert", 0.6);
      this.alertMark = 1.2;
      this.sys.robotLine("alert", this);
    }
    if (s === "search") this.sys.robotLine("search", this);
    if (s === "return") this.sys.robotLine("lost", this);
    this.state = s; this.stateT = 0; this.path = null;
    if (s === "engage") this.lostT = 0;
    if (s !== "engage") this.releaseToken();
  }
  releaseToken() { if (this.hasToken) { this.hasToken = false; this.sys.tokens--; } }

  // ---------- sensing ----------
  eye(out) { return out.set(this.pos.x, this.pos.y + this.def.h * 0.85, this.pos.z); }
  canSee(t) {
    const d = this.pos.distanceTo(t.pos);
    if (d > this.def.view * (t.stealth || 1)) return false;
    if (this.state !== "engage" && this.state !== "search" && this.state !== "alert" && !this.def.fly) {
      const a = Math.atan2(-(t.pos.x - this.pos.x), -(t.pos.z - this.pos.z));
      if (Math.abs(angleWrap(a - this.yaw)) > 1.15 && d > 6) return false;
    }
    this.eye(_a);
    return this.G.col.clearLine(_a.x, _a.y, _a.z, t.pos.x, t.pos.y + t.aimY, t.pos.z);
  }
  sense() {
    let best = null, bd = 1e9;
    for (const t of this.sys.targets()) {
      if (!t.active()) continue;
      const d = this.pos.distanceTo(t.pos) * (t.isPlayer ? 0.8 : 1);
      if (d < bd && this.canSee(t)) { bd = d; best = t; }
    }
    if (best) {
      this.target = best; this.lastSeen.copy(best.pos); this.seenT = this.G.time;
      if (this.state === "idle" || this.state === "patrol" || this.state === "investigate" || this.state === "return" || this.state === "search") this.setState("alert");
    }
  }

  // ---------- movement helpers ----------
  moveToward(x, z, speed, dt) {
    const G = this.G;
    if (this.def.fly) return;
    if (!this.path || this.repathT <= 0 || !this.goal || Math.hypot(this.goal[0] - x, this.goal[1] - z) > 3) {
      this.path = G.nav.find(this.pos.x, this.pos.z, x, z, this.posted ? 0 : 1800);
      this.pathI = 0; this.goal = [x, z]; this.repathT = 1.2 + Math.random() * 0.6;
    }
    if (!this.path || this.pathI >= this.path.length) return true;
    const [px, pz] = this.path[this.pathI];
    const dx = px - this.pos.x, dz = pz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.8) { this.pathI++; return this.pathI >= this.path.length; }
    this.vel.x = lerp(this.vel.x, (dx / d) * speed, Math.min(1, dt * 6));
    this.vel.z = lerp(this.vel.z, (dz / d) * speed, Math.min(1, dt * 6));
    return false;
  }
  faceToward(x, z, dt, rate) {
    const want = Math.atan2(-(x - this.pos.x), -(z - this.pos.z));
    const diff = angleWrap(want - this.yaw);
    const r = (rate || this.def.turn || 5) * dt;
    this.yaw += clamp(diff, -r, r);
    return Math.abs(diff);
  }

  // ---------- main update ----------
  update(dt) {
    const G = this.G, D = G.diff;
    if (!this.alive) return this.updateDying(dt);
    this.stateT += dt; this.senseT -= dt; this.repathT -= dt;
    this.markT = Math.max(0, this.markT - dt); this.alertMark = Math.max(0, (this.alertMark || 0) - dt);
    this.slowT = Math.max(0, this.slowT - dt);
    if (this.frontDownT > 0) { this.frontDownT -= dt; if (this.frontDownT <= 0) this.frontUp = true; }
    if (this.shieldRegenT > 0) this.shieldRegenT -= dt; else if (this.shield < this.maxShield) this.shield = Math.min(this.maxShield, this.shield + 15 * dt);
    const slow = this.slowT > 0 ? 0.3 : 1;
    dt *= slow;
    this.vel.x *= 0.85; this.vel.z *= 0.85;
    if (this.stunT > 0) { this.stunT -= dt; this.releaseToken(); this.physics(dt); this.sync(); return; }
    if (this.recoverT > 0) { this.recoverT -= dt; this.physics(dt); this.sync(); return; }
    if (this.opts.dummy) { this.yaw += dt * 0.6; if (this.def.fly) { this.vel.set(0, 0, 0); this.pos.y = this.home.y + Math.sin(this.G.time * 1.5 + this.id) * 0.5; } this.sync(); return; }
    if (this.senseT <= 0) { this.senseT = 0.22; this.sense(); }
    const def = this.def;
    const speed = def.speed * (this.state === "patrol" || this.state === "return" ? 0.5 : 1);

    switch (this.state) {
      case "idle":
        if (this.stateT > 3) { this.stateT = 0; this.wantYaw = this.homeYaw + (Math.random() - 0.5) * 2; }
        if (this.wantYaw !== undefined) this.yaw += clamp(angleWrap(this.wantYaw - this.yaw), -dt, dt);
        if (Math.random() < dt * 0.01 && G.mods.banter) this.sys.robotLine("banter", this);
        break;
      case "patrol": {
        const p = this.opts.patrol[this.patrolI], bx = this.enc.ox + p[0], bz = this.enc.oz + p[1];
        this.faceToward(bx, bz, dt);
        if (this.def.fly) this.flyTo(bx, bz, dt, speed);
        else if (this.moveToward(bx, bz, speed, dt) || Math.hypot(bx - this.pos.x, bz - this.pos.z) < 1.5) { this.patrolI = (this.patrolI + 1) % this.opts.patrol.length; this.path = null; }
        break;
      }
      case "investigate":
        this.faceToward(this.goalNoise.x, this.goalNoise.z, dt);
        if (this.def.fly) this.flyTo(this.goalNoise.x, this.goalNoise.z, dt, speed);
        else if (this.posted || this.moveToward(this.goalNoise.x, this.goalNoise.z, speed * 0.7, dt) || this.stateT > 8) this.setState("search");
        break;
      case "alert":
        if (this.target) this.faceToward(this.lastSeen.x, this.lastSeen.z, dt, 6);
        if (this.stateT > D.reaction * (this.cmd ? 0.6 : 1)) {
          this.setState("engage");
          // only robots that actually saw the target raise the alarm (stops alarm loops)
          if (G.time - this.seenT < 1) this.sys.alertNear(this, this.def.alerts || 22);
        }
        break;
      case "engage": this.engage(dt); break;
      case "search":
        if (this.def.fly) this.flyTo(this.lastSeen.x, this.lastSeen.z, dt, speed * 0.6);
        else if (!this.posted) this.moveToward(this.lastSeen.x, this.lastSeen.z, speed * 0.6, dt);
        this.yaw += dt * 1.2;
        if (this.stateT > 7) this.setState("return");
        break;
      case "return": {
        if (this.def.fly) { if (this.flyTo(this.home.x, this.home.z, dt, speed)) this.setState(this.opts.patrol ? "patrol" : "idle"); }
        else if (this.posted || this.moveToward(this.home.x, this.home.z, speed, dt) || this.pos.distanceTo(this.home) < 2) this.setState(this.opts.patrol ? "patrol" : "idle");
        break;
      }
    }
    this.physics(dt);
    this.sync();
  }

  engage(dt) {
    const G = this.G, D = G.diff, def = this.def, t = this.target;
    if (!t || !t.active()) { this.setState("search"); return; }
    const sees = G.time - this.seenT < 0.3;
    if (!sees) { this.lostT += dt; if (this.lostT > 3) { this.setState("search"); return; } } else this.lostT = 0;
    const tx = t.pos.x, tz = t.pos.z, d = Math.hypot(tx - this.pos.x, tz - this.pos.z);
    this.faceToward(sees ? tx : this.lastSeen.x, sees ? tz : this.lastSeen.z, dt);
    // commander specials
    if (this.cmd) this.commanderSpecials(dt, d);
    // Warden slam when close
    if (def.slam) {
      if (this.slamT > 0) {
        this.slamT -= dt;
        if (this.slamT <= 0) this.doSlam();
        this.physics(dt); return;
      }
      if (d < 7 && this.stateT > 1.5 && Math.random() < dt * 1.5) { this.slamT = 1.0; G.audio.play("telegraph"); G.fx.ring(this.pos.x, this.pos.y + 0.2, this.pos.z, 0xffb347, 7, 1.0); return; }
    }
    // Engineer repairs friends
    if (def.repair && this.repairUpdate(dt)) return;
    if (def.repair && this.barrierT <= 0 && sees && d < 30) { this.deployBarrier(t); this.barrierT = 12; }
    this.barrierT -= dt;
    // movement choice
    if (!this.posted && !def.fly) {
      this.repoT = (this.repoT || 0) - dt;
      if (this.repoT <= 0 || !this.spot) {
        this.repoT = 3 + Math.random() * 3;
        this.spot = this.chooseSpot(t, d);
      }
      if (this.spot) this.moveToward(this.spot[0], this.spot[1], def.speed, dt);
    } else if (def.fly) {
      this.orbitA += dt * 0.5;
      const R = 16 + 6 * Math.sin(this.orbitA * 0.7);
      this.flyTo(tx + Math.cos(this.orbitA) * R, tz + Math.sin(this.orbitA) * R, dt, def.speed);
    }
    // firing in bursts, limited by attack tokens
    this.fireT -= dt;
    const blockedByBarrier = this.sys.playerBarrierBlocks(this, t);
    if (blockedByBarrier && !this.posted) { this.repoT = Math.min(this.repoT, 0.3); }
    if (sees && d < def.range && this.fireT <= 0) {
      if (this.burstLeft <= 0) {
        if (!this.hasToken) {
          if (this.sys.tokens >= D.maxAttackers && !this.cmd) { this.fireT = 0.4 + Math.random() * 0.6; return; }
          this.hasToken = true; this.sys.tokens++;
        }
        this.burstLeft = def.burst;
        if (def.telegraph || (this.cmd && this.cmd.precise)) { this.telegraphT = def.telegraph || 0.7; }
      }
      if (this.telegraphT > 0) {
        this.telegraphT -= dt;
        this.eye(_a);
        G.fx.line(_a.x, _a.y, _a.z, t.pos.x, t.pos.y + t.aimY, t.pos.z, 0xff9ad6);
        if (this.telegraphT > 0) return;
      }
      this.shoot(t, d);
      this.burstLeft--;
      if (this.burstLeft <= 0) { this.fireT = def.rest * (0.8 + Math.random() * 0.5); this.releaseToken(); }
      else this.fireT = def.gap;
    }
  }

  chooseSpot(t, d) {
    const G = this.G, def = this.def;
    const tx = t.pos.x, tz = t.pos.z;
    // cover: a nearby solid box between us and the target
    if (def.cover && Math.random() < 0.75) {
      const c = this.sys.findCover(this, tx, tz);
      if (c) return c;
    }
    const flank = def.flank * G.diff.flank;
    if (Math.random() < flank) {
      const a = Math.atan2(this.pos.z - tz, this.pos.x - tx) + (Math.random() < 0.5 ? 1 : -1) * (0.9 + Math.random() * 0.5);
      const r = 12 + Math.random() * 8;
      const q = G.nav.nearestOk(tx + Math.cos(a) * r, tz + Math.sin(a) * r, 8);
      if (q) return q;
    }
    // keep a comfortable distance and strafe a little
    const want = def.range * 0.45;
    const a = Math.atan2(this.pos.z - tz, this.pos.x - tx) + (Math.random() - 0.5) * 0.8;
    const r = clamp(d, want * 0.7, want * 1.2);
    return G.nav.nearestOk(tx + Math.cos(a) * r, tz + Math.sin(a) * r, 8);
  }

  shoot(t, d) {
    const G = this.G, def = this.def;
    const mz = this.muzzle(_a);
    const tv = t.vel || { x: 0, y: 0, z: 0 };
    const lead = (d / def.bolt) * 0.6;
    const ax = t.pos.x + tv.x * lead, ay = t.pos.y + t.aimY + (tv.y || 0) * lead * 0.3, az = t.pos.z + tv.z * lead;
    let dx = ax - mz.x, dy = ay - mz.y, dz = az - mz.z;
    const L = Math.hypot(dx, dy, dz);
    const sp = def.spread * G.diff.spread * (this.cmd && this.cmd.precise ? 0.3 : 1) * (t.isPlayer && G.player.speed2d > 6 ? 1.4 : 1);
    dx = dx / L + (Math.random() - 0.5) * sp * 2; dy = dy / L + (Math.random() - 0.5) * sp * 2; dz = dz / L + (Math.random() - 0.5) * sp * 2;
    const l2 = Math.hypot(dx, dy, dz);
    const dmg = def.dmg * G.diff.enemyDmg * (this.cmd && this.cmd.precise ? 2.4 : 1) * (this.opts.training ? 0.5 : 1);
    G.projectiles.spawnBolt(mz.x, mz.y, mz.z, (dx / l2) * def.bolt, (dy / l2) * def.bolt, (dz / l2) * def.bolt, dmg, this);
    G.audio.play("ebolt", Math.max(0.2, 1 - d / 60));
  }
  muzzle(out) {
    const f = this.def.h;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const y = this.type === "skimmer" ? 0 : this.type === "turret" ? 1.1 * this.scale : f * 0.68;
    return out.set(this.pos.x + fx * (this.def.r + 0.3), this.pos.y + y, this.pos.z + fz * (this.def.r + 0.3));
  }

  doSlam() {
    const G = this.G;
    G.audio.play("slam");
    G.fx.ring(this.pos.x, this.pos.y + 0.3, this.pos.z, 0xffd27a, 8, 0.5);
    G.fx.burst(this.pos.x, this.pos.y + 0.3, this.pos.z, 0xb9a48a, 18, 6, 0.15, 0.6, 8);
    for (const t of this.sys.targets()) {
      if (!t.active()) continue;
      const d = Math.hypot(t.pos.x - this.pos.x, t.pos.z - this.pos.z);
      if (d < 7.5 && Math.abs(t.pos.y - this.pos.y) < 2.5) {
        t.hurt(30 * G.diff.enemyDmg, this.pos.x, this.pos.z);
        if (t.isPlayer) { const k = 9 / Math.max(1, d); G.player.vel.x += ((t.pos.x - this.pos.x) / Math.max(0.1, d)) * k; G.player.vel.z += ((t.pos.z - this.pos.z) / Math.max(0.1, d)) * k; G.player.vel.y = 5; G.player.shake = 1; }
      }
    }
    this.recoverT = 2.3; // recovery window: armor down, core exposed
    if (this.cmd && this.cmd.name) G.ui.toast(`${this.cmd.name} is recovering. Hit its glowing core!`);
  }

  repairUpdate(dt) {
    const G = this.G;
    if (!this.repairTarget || !this.repairTarget.alive || this.repairTarget.hp >= this.repairTarget.maxHp) {
      this.repairTarget = null;
      if (Math.random() < dt * 2) {
        let best = null;
        for (const r of this.sys.list) if (r !== this && r.alive && r.hp < r.maxHp * 0.7 && r.pos.distanceTo(this.pos) < 22 && r.type !== "turret") { best = r; break; }
        this.repairTarget = best;
      }
      if (!this.repairTarget) return false;
    }
    const r = this.repairTarget, d = r.pos.distanceTo(this.pos);
    this.faceToward(r.pos.x, r.pos.z, dt);
    if (d > 6) { this.moveToward(r.pos.x, r.pos.z, this.def.speed, dt); return true; }
    r.hp = Math.min(r.maxHp, r.hp + 22 * dt);
    this.eye(_a);
    G.fx.line(_a.x, _a.y - 0.3, _a.z, r.pos.x, r.pos.y + r.def.h * 0.6, r.pos.z, 0x7dffb0);
    return true;
  }
  deployBarrier(t) {
    const fx = t.pos.x - this.pos.x, fz = t.pos.z - this.pos.z, L = Math.hypot(fx, fz) || 1;
    const x = this.pos.x + (fx / L) * 2.5, z = this.pos.z + (fz / L) * 2.5;
    this.sys.addEnemyBarrier(x, this.G.col.groundAt(x, z, this.pos.y + 1.5), z, fx / L, fz / L, 4.2, 2.6, 220 * this.G.diff.enemyHp, 10);
  }
  commanderSpecials(dt, d) {
    const G = this.G, c = this.cmd;
    if (c.summon) {
      this.summonT -= dt;
      if (this.summonT <= 0) {
        this.summonT = 22;
        const alive = this.sys.list.filter((r) => r.alive && r.summoner === this).length;
        if (alive < 3) this.sys.dropship(this.enc, this.pos.x + 10, this.pos.z + 10, [[c.summon, 0, 0], [c.summon, 3, 0]], this);
      }
    }
    if (c.helpers && !this.helpersSpawned) {
      this.helpersSpawned = true;
      for (let k = 0; k < c.helpers; k++) { const r = this.sys.spawn("skimmer", this.pos.x + k * 3 - 3, this.pos.y + 6, this.pos.z + 4, {}, this.enc); r.summoner = this; r.target = this.target; r.setState("engage"); }
    }
    if (c.barriers) {
      this.barrierT -= dt;
      if (this.barrierT <= 0) {
        this.barrierT = 14;
        for (let k = -1; k <= 1; k++) {
          const a = this.yaw + k * 0.9, fx = -Math.sin(a), fz = -Math.cos(a);
          const x = this.pos.x + fx * 4, z = this.pos.z + fz * 4;
          this.sys.addEnemyBarrier(x, G.col.groundAt(x, z, this.pos.y + 1.5), z, fx, fz, 4, 2.8, 200, 12);
        }
      }
    }
    if (c.hop) {
      this.hopT -= dt;
      if (this.hopT <= 0) {
        this.hopT = 9;
        const perches = ["K5.perch10", "K5.perch14", "K5.perch18"].map((k) => G.world.anchors.get(k)).filter(Boolean);
        const p = perches[Math.floor(Math.random() * perches.length)];
        if (p) {
          G.fx.burst(this.pos.x, this.pos.y + 1, this.pos.z, 0xc49bff, 20, 4, 0.1, 0.6, -2);
          this.pos.set(p.x, p.y, p.z); this.home.copy(this.pos); this.posted = true;
          G.fx.burst(p.x, p.y + 1, p.z, 0xc49bff, 20, 4, 0.1, 0.6, -2);
          G.audio.play("dash");
        }
      }
    }
  }

  flyTo(x, z, dt, speed) {
    const G = this.G;
    const gy = G.terrain.surfaceAt(x, z);
    const ty = Math.max(gy, G.terrain.surfaceAt(this.pos.x, this.pos.z)) + this.alt;
    const dx = x - this.pos.x, dz = z - this.pos.z, dy = ty - this.pos.y, d = Math.hypot(dx, dz);
    if (d > 0.5) { this.vel.x = lerp(this.vel.x, (dx / d) * speed, Math.min(1, dt * 2)); this.vel.z = lerp(this.vel.z, (dz / d) * speed, Math.min(1, dt * 2)); }
    this.vel.y = lerp(this.vel.y, clamp(dy, -4, 4), Math.min(1, dt * 2));
    return d < 3;
  }

  physics(dt) {
    const G = this.G, col = G.col;
    if (this.def.fly) {
      this.pos.x += this.vel.x * dt; this.pos.y += this.vel.y * dt; this.pos.z += this.vel.z * dt;
      const floor = G.terrain.surfaceAt(this.pos.x, this.pos.z) + 3;
      if (this.pos.y < floor) { this.pos.y = floor; this.vel.y = Math.max(0, this.vel.y); }
      this.pos.y = Math.min(this.pos.y, G.terrain.heightAt(this.pos.x, this.pos.z) + 40);
      _b.set(this.pos.x, this.pos.y - 0.4, this.pos.z);
      col.pushOut(_b, this.def.r, 0.8, 0, null);
      this.pos.x = _b.x; this.pos.z = _b.z;
      if (col.inside(this.pos.x, this.pos.y, this.pos.z)) this.pos.y += 3 * dt * 10;
      return;
    }
    if (this.posted && !this.def.still) { /* posted robots only turn and shoot */ }
    if (!this.posted) {
      this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
      // separation from other robots
      for (const r of this.sys.near(this.pos, 3)) {
        if (r === this || !r.alive || r.def.fly) continue;
        const dx = this.pos.x - r.pos.x, dz = this.pos.z - r.pos.z, d = Math.hypot(dx, dz), m = this.def.r + r.def.r;
        if (d < m && d > 0.01) { this.pos.x += (dx / d) * (m - d) * 0.5; this.pos.z += (dz / d) * (m - d) * 0.5; }
      }
      col.pushOut(this.pos, this.def.r, this.def.h, 0.45, null);
      this.pos.y = col.groundAt(this.pos.x, this.pos.z, this.pos.y + 0.6, this.def.r);
      if (this.pos.y < -1.2) { this.pos.copy(this.home); this.path = null; }
    }
  }

  sync() {
    const m = this.mesh, P = this.parts, G = this.G;
    m.position.copy(this.pos);
    if (this.def.fly) m.position.y += Math.sin(G.time * 3 + this.id) * 0.15;
    m.rotation.y = this.yaw;
    if (P.head) P.head.rotation.y = 0;
    const moving = Math.hypot(this.vel.x, this.vel.z);
    if (P.legs.length) {
      const sw = Math.sin(G.time * 9 + this.id) * Math.min(1, moving / 3) * 0.5;
      P.legs.forEach((l, i) => (l.rotation.x = i % 2 ? sw : -sw));
    }
    if (P.shield) P.shield.visible = this.frontUp;
    if (P.core) P.core.scale.setScalar(this.recoverT > 0 ? 1.6 + Math.sin(G.time * 20) * 0.2 : 1);
    if (this.slamT > 0 || this.telegraphT > 0) P.eye.emissive.setHSL(0.08, 1, 0.5 + Math.sin(G.time * 30) * 0.3);
    else if (this.alive) P.eye.emissive.set(this.stunT > 0 ? 0x66ccff : this.cmd ? 0xffd34a : 0xffb347);
    // a little idle motion so machines never look frozen
    if (this.alive && !this.def.fly) P.body.position.y = Math.sin(G.time * 2.2 + this.id) * 0.015;
    if (this.bubble) {
      const up = this.emittersUp;
      this.bubble.visible = up && this.alive;
      this.bubble.position.set(this.pos.x, this.pos.y + this.def.h * 0.55, this.pos.z);
      this.bubble.scale.setScalar(this.def.h * 0.75 + 0.6);
      this.emitters.forEach((e, k) => {
        const mm = this.emitterMeshes[k];
        mm.visible = e.hp > 0 && this.alive;
        const a = e.a + G.time * 0.8;
        mm.position.set(this.pos.x + Math.cos(a) * (this.def.r + 1.2), this.pos.y + this.def.h + 0.4, this.pos.z + Math.sin(a) * (this.def.r + 1.2));
        mm.rotation.y += 0.05;
      });
    }
  }
  updateDying(dt) {
    const G = this.G;
    this.dying += dt;
    const k = this.dying;
    // fold down safely, then dissolve into holographic particles
    if (k < 0.8) {
      this.parts.body.scale.y = 1 - k * 0.5;
      this.parts.body.rotation.x = k * 0.3;
      if (this.def.fly) this.pos.y -= dt * 3;
    } else if (!this.dissolved) {
      this.dissolved = true;
      const c = G.mods.confetti ? [0xff5f7a, 0xffd34a, 0x5fe08a, 0x5fb4ff, 0xc77dff] : [0x6ff2e0, 0xc49bff];
      for (const col of c) G.fx.burst(this.pos.x, this.pos.y + this.def.h * 0.4, this.pos.z, col, G.mods.confetti ? 8 : 14, 2.2, 0.09, 1.1, G.mods.confetti ? 5 : -1.5, 1.2);
      this.G.items.maybeDrop(this);
    } else {
      const s = Math.max(0, 1 - (k - 0.8) * 2.5);
      this.mesh.scale.setScalar(this.scale * s);
    }
    this.mesh.position.copy(this.pos);
    if (k > 1.3) { this.remove(); return "dead"; }
  }
  remove() {
    this.G.scene.remove(this.mesh);
    if (this.bubble) { this.G.scene.remove(this.bubble); this.emitterMeshes.forEach((m) => this.G.scene.remove(m)); }
    this.removed = true;
  }

  // hit spheres: [cx, cy, cz, r, part]
  spheres(out) {
    out.length = 0;
    const p = this.pos, h = this.def.h, r = this.def.r, fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    if (this.emittersUp) this.emitters.forEach((e, k) => { if (e.hp > 0) { const mm = this.emitterMeshes[k].position; out.push([mm.x, mm.y, mm.z, 0.45, "em" + k]); } });
    if (this.frontUp) out.push([p.x + fx * (r + 0.15) * this.scale, p.y + h * 0.55, p.z + fz * (r + 0.15) * this.scale, 0.95 * this.scale, "front"]);
    if (this.type === "turret") {
      out.push([p.x - fx * 1.2 * this.scale, p.y + 1.05, p.z - fz * 1.2 * this.scale, 0.38, "power"]);
      out.push([p.x, p.y + 0.8, p.z, 0.95, "body"]);
      return out;
    }
    const w = this.parts.weak;
    if (w) {
      // weak point position rotated by yaw (model faces -z)
      const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      const wx = (w[0] * c + w[2] * s) * this.scale, wz = (-w[0] * s + w[2] * c) * this.scale;
      out.push([p.x + wx, p.y + w[1] * this.scale + (this.def.fly ? 0 : 0), p.z + wz, w[3] * this.scale * (this.recoverT > 0 ? 1.5 : 1), "weak"]);
    }
    if (this.def.fly) out.push([p.x, p.y, p.z, r, "body"]);
    else { out.push([p.x, p.y + h * 0.3, p.z, r, "body"]); out.push([p.x, p.y + h * 0.68, p.z, r * 0.95, "body"]); }
    return out;
  }
}

export class Robots {
  constructor(G) {
    this.G = G;
    this.list = [];
    this.tokens = 0;
    this.enemyBarriers = [];
    this.ships = [];
    this._sph = [];
    this.lineT = 0;
    const pl = G.player;
    this.playerTarget = {
      isPlayer: true,
      get pos() { return pl.vehicle ? pl.vehicle.pos : pl.pos; },
      get vel() { return pl.vehicle ? pl.vehicle.vel : pl.vel; },
      get aimY() { return pl.vehicle ? 1.0 : pl.h * 0.6; },
      get stealth() { return pl.h < 1.5 && !pl.vehicle ? 0.75 : 1; },
      active: () => !G.cinematic && G.state.mode !== "ending",
      hurt: (dmg, fx, fz) => (pl.vehicle ? pl.vehicle.damage(dmg, fx, fz) : pl.damage(dmg, fx, fz)),
    };
  }
  targets() {
    const out = [this.playerTarget];
    for (const a of this.G.allies.combatants()) out.push(a);
    return out;
  }
  spawn(type, x, y, z, opts, enc) {
    const G = this.G;
    let px = x, pz = z, py = y;
    if (!(opts && (opts.y > 0.5)) && !ROBOTS[type].fly && !ROBOTS[type].still) {
      const q = G.nav.nearestOk(x, z, 12);
      if (q) { px = q[0]; pz = q[1]; }
      py = G.col.groundAt(px, pz, G.terrain.heightAt(px, pz) + 1.5);
    }
    if (ROBOTS[type].fly) py = G.terrain.surfaceAt(px, pz) + 8;
    const r = new Robot(this, type, px, py, pz, opts, enc);
    this.list.push(r);
    return r;
  }
  near(pos, R) { return this.list.filter((r) => Math.abs(r.pos.x - pos.x) < R && Math.abs(r.pos.z - pos.z) < R); }
  alertNear(src, R) {
    if (src.type === "scout") { this.G.fx.ring(src.pos.x, src.pos.y + 1, src.pos.z, 0xffb347, R, 0.8); }
    for (const r of this.list) {
      if (r === src || !r.alive || r.pos.distanceTo(src.pos) > R) continue;
      if (r.state !== "engage" && r.state !== "alert") { r.target = src.target; r.lastSeen.copy(src.lastSeen); r.seenT = this.G.time - 0.2; r.setState("alert"); }
    }
  }
  noise(pos, R) {
    for (const r of this.list) {
      if (!r.alive || (r.state !== "idle" && r.state !== "patrol" && r.state !== "return")) continue;
      if (r.pos.distanceTo(pos) < R) { r.goalNoise = pos.clone(); r.setState("investigate"); }
    }
  }
  markAround(pos, R, dur) { for (const r of this.list) if (r.alive && r.pos.distanceTo(pos) < R) r.markT = dur; }
  onDisabled(r) {
    this.G.onRobotDisabled(r);
  }
  robotLine(kind, r, force) {
    const G = this.G;
    if (!force && (G.time - this.lineT < (G.mods.banter ? 6 : 18))) return;
    if (r.pos.distanceTo(G.player.pos) > 35) return;
    this.lineT = G.time;
    const L = ROBOT_LINES[kind];
    G.say("robot", L[Math.floor(Math.random() * L.length)], { quip: true, short: true, name: r.cmd ? r.cmd.name : undefined });
  }

  findCover(r, tx, tz) {
    const G = this.G;
    let best = null, bd = 1e9;
    G.col.query(r.pos.x - 16, r.pos.z - 16, r.pos.x + 16, r.pos.z + 16, (c) => {
      if (c.type !== 0 || c.maxY - c.minY < 1.0 || c.maxX - c.minX > 30 || c.maxZ - c.minZ > 30) return;
      const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2;
      // spot on the far side of the box from the target
      const dx = cx - tx, dz = cz - tz, L = Math.hypot(dx, dz) || 1;
      const ext = Math.max(c.maxX - c.minX, c.maxZ - c.minZ) / 2 + 1.0;
      const sx = cx + (dx / L) * ext, sz = cz + (dz / L) * ext;
      if (Math.hypot(sx - tx, sz - tz) < 6) return;
      if (!G.nav.ok(sx, sz)) return;
      const d = Math.hypot(sx - r.pos.x, sz - r.pos.z) + Math.random() * 3;
      if (d < bd) { bd = d; best = [sx, sz]; }
    });
    return best;
  }

  // does the player's barrier sit between this robot and its target?
  playerBarrierBlocks(r, t) {
    const b = this.G.player.barrier;
    if (!b) return false;
    return !!segPanel(r.pos.x, r.pos.y + r.def.h * 0.7, r.pos.z, t.pos.x, t.pos.y + 1, t.pos.z, b);
  }
  addEnemyBarrier(x, y, z, nx, nz, w, h, hp, life) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), new THREE.MeshBasicMaterial({ color: 0xc49bff, transparent: true, opacity: 0.4, depthWrite: false }));
    m.position.set(x, y + h / 2, z); m.rotation.y = Math.atan2(nx, nz);
    this.G.scene.add(m);
    this.enemyBarriers.push({ x, y, z, nx, nz, w, h, hp, max: hp, life, m, team: "enemy" });
    this.G.audio.play("barrier", 0.6);
  }
  barrierHit(ox, oy, oz, dx, dy, dz, maxT) {
    let best = null;
    for (const b of this.enemyBarriers) {
      const t = rayPanel(ox, oy, oz, dx, dy, dz, b);
      if (t !== null && t < maxT && (!best || t < best.t)) best = { t, barrier: b };
    }
    return best;
  }

  rayHit(ox, oy, oz, dx, dy, dz, maxT) {
    let best = null;
    for (const r of this.list) {
      if (!r.alive) continue;
      const cx = r.pos.x - ox, cy = r.pos.y + r.def.h / 2 - oy, cz = r.pos.z - oz;
      const along = cx * dx + cy * dy + cz * dz;
      if (along < -3 || along > maxT + 3) continue;
      const perp2 = cx * cx + cy * cy + cz * cz - along * along;
      const R = Math.max(r.def.h, r.def.r * 2) + 2;
      if (perp2 > R * R) continue;
      for (const s of r.spheres(this._sph)) {
        const t = raySphere(ox, oy, oz, dx, dy, dz, s[0], s[1], s[2], s[3]);
        if (t !== null && t < maxT && (!best || t < best.t)) best = { t, x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, target: r, robot: r, part: s[4] };
      }
    }
    return best;
  }
  assistTarget(eye, f, ang, range) {
    let best = null, bd = ang;
    for (const r of this.list) {
      if (!r.alive) continue;
      _b.set(r.pos.x - eye.x, r.pos.y + r.def.h * 0.55 - eye.y, r.pos.z - eye.z);
      const d = _b.length();
      if (d > range || d < 1) continue;
      const a = Math.acos(clamp(_b.dot(f) / d, -1, 1));
      if (a < bd && this.G.col.clearLine(eye.x, eye.y, eye.z, r.pos.x, r.pos.y + r.def.h * 0.55, r.pos.z)) { bd = a; best = _b.clone().normalize(); }
    }
    return best;
  }
  coneTargets(eye, f, range, ang, n) {
    const out = [];
    let first = null, fd = 1e9;
    for (const r of this.list) {
      if (!r.alive) continue;
      _b.set(r.pos.x - eye.x, r.pos.y + r.def.h * 0.55 - eye.y, r.pos.z - eye.z);
      const d = _b.length();
      if (d > range + r.def.r) continue;
      const a = Math.acos(clamp(_b.dot(f) / d, -1, 1));
      if (a > ang) continue;
      if (!this.G.col.clearLine(eye.x, eye.y, eye.z, r.pos.x, r.pos.y + r.def.h * 0.55, r.pos.z)) continue;
      if (d < fd) { fd = d; first = r; }
    }
    if (!first) return out;
    out.push(first);
    let cur = first;
    while (out.length < n) {
      let nx = null, nd = 7;
      for (const r of this.list) if (r.alive && !out.includes(r) && r.pos.distanceTo(cur.pos) < nd) { nd = r.pos.distanceTo(cur.pos); nx = r; }
      if (!nx) break;
      out.push(nx); cur = nx;
    }
    return out;
  }

  // Reinforcement carrier: flies in from a clear direction, lowers robots, flies away.
  dropship(enc, x, z, units, summoner) {
    const G = this.G;
    const m = new THREE.Group();
    box(m, 4, 1.2, 7, MAT.body, 0, 0, 0); box(m, 5.5, 0.3, 2, MAT.trim, 0, 0.4, 1);
    const lightM = glowMat(0xb06cff); box(m, 0.3, 0.3, 6, lightM, -2.1, -0.3, 0); box(m, 0.3, 0.3, 6, lightM, 2.1, -0.3, 0);
    const gy = G.terrain.surfaceAt(x, z);
    m.position.set(x - 120, gy + 60, z - 40);
    G.scene.add(m);
    this.ships.push({ m, x, z, gy, units, enc, summoner, t: 0, dropped: false });
    G.audio.play("deliver", 0.6);
    G.ui.toast("Directorate reinforcements inbound!");
  }
  updateShips(dt) {
    const G = this.G;
    for (let i = this.ships.length - 1; i >= 0; i--) {
      const s = this.ships[i];
      s.t += dt;
      const m = s.m;
      if (s.t < 5) { const k = s.t / 5; m.position.set(lerp(s.x - 120, s.x, k), lerp(s.gy + 60, s.gy + 12, k), lerp(s.z - 40, s.z, k)); m.rotation.y = Math.atan2(120, 40); }
      else if (!s.dropped) {
        s.dropped = true;
        for (const u of s.units) {
          const r = this.spawn(u[0], s.x + u[1], s.gy + 1, s.z + u[2], u[3] || {}, s.enc);
          r.summoner = s.summoner; r.reinforcement = true;
          r.target = this.playerTarget; r.lastSeen.copy(this.playerTarget.pos); r.seenT = G.time; r.setState("alert");
          if (s.enc) s.enc.units.push(r);
          G.fx.beam(s.x + u[1], s.gy + 12, s.z + u[2], s.x + u[1], s.gy, s.z + u[2], 0xc49bff, 0.6);
        }
      } else if (s.t < 10) { const k = (s.t - 6) / 4; m.position.y = s.gy + 12 + Math.max(0, k) * 70; m.position.x = s.x + Math.max(0, k) * 120; }
      else { G.scene.remove(m); this.ships.splice(i, 1); }
    }
  }

  update(dt) {
    const G = this.G, px = G.player.pos.x, pz = G.player.pos.z;
    this.tokens = Math.max(0, this.tokens);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const r = this.list[i];
      if (r.removed) { this.list.splice(i, 1); continue; }
      const far = Math.abs(r.pos.x - px) > 220 || Math.abs(r.pos.z - pz) > 220;
      if (far && r.alive) continue;
      if (r.update(dt) === "dead") this.list.splice(i, 1);
    }
    for (let i = this.enemyBarriers.length - 1; i >= 0; i--) {
      const b = this.enemyBarriers[i];
      b.life -= dt;
      b.m.material.opacity = 0.2 + 0.25 * Math.max(0, b.hp / b.max);
      if (b.life <= 0 || b.hp <= 0) { G.scene.remove(b.m); G.fx.burst(b.x, b.y + 1.2, b.z, 0xc49bff, 10, 3, 0.08, 0.4, 0); this.enemyBarriers.splice(i, 1); }
    }
    this.updateShips(dt);
  }
  engagedCount() { return this.list.filter((r) => r.alive && (r.state === "engage" || r.state === "alert")).length; }
  clearAll() {
    for (const r of this.list) r.remove();
    this.list.length = 0; this.tokens = 0;
    for (const b of this.enemyBarriers) this.G.scene.remove(b.m);
    this.enemyBarriers.length = 0;
    for (const s of this.ships) this.G.scene.remove(s.m);
    this.ships.length = 0;
  }
}

export function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
  const fx = ox - cx, fy = oy - cy, fz = oz - cz;
  const b = fx * dx + fy * dy + fz * dz, c = fx * fx + fy * fy + fz * fz - r * r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t >= 0) return t;
  return c < 0 ? 0 : null;
}
// Ray vs an upright rectangle panel {x, y (bottom), z, nx, nz (facing), w, h}
export function rayPanel(ox, oy, oz, dx, dy, dz, b) {
  const den = dx * b.nx + dz * b.nz;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((b.x - ox) * b.nx + (b.z - oz) * b.nz) / den;
  if (t < 0) return null;
  const x = ox + dx * t, y = oy + dy * t, z = oz + dz * t;
  const side = (x - b.x) * -b.nz + (z - b.z) * b.nx;
  if (Math.abs(side) > b.w / 2 || y < b.y || y > b.y + b.h) return null;
  return t;
}
export function segPanel(ax, ay, az, bx, by, bz, b) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz);
  const t = rayPanel(ax, ay, az, dx / L, dy / L, dz / L, b);
  return t !== null && t <= L ? t : null;
}
