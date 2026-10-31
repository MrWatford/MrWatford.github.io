// Aegis Frontier: the ATLAS ARRAY, a large automated command machine. Three phases, each with a
// different job: (1) dodge sweeps and disable 4 relay nodes, (2) climb to the side platforms and shut
// off 2 link conduits while helper drones arrive, (3) interrupt the charge and damage the exposed core.
// Every attack is announced by light and sound first. A failed attempt resets cleanly.
import * as THREE from "../lib/three.module.min.js";
import { BOSS_LINES, siteById } from "./content.js";
import { raySphere } from "./robots.js";

export class Boss {
  constructor(G) {
    this.G = G;
    const s = siteById.citadel;
    this.cx = s.x; this.cz = s.z; this.fy = s.y;
    this.root = new THREE.Group(); this.root.position.set(s.x, s.y, s.z);
    G.scene.add(this.root);
    const core = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xc49bff }));
    core.position.y = 10; this.root.add(core); this.coreMesh = core;
    this.rings = [];
    for (let k = 0; k < 3; k++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(4 + k * 1.3, 0.22, 8, 40), new THREE.MeshLambertMaterial({ color: 0x9aa3ad }));
      r.position.y = 10; this.root.add(r); this.rings.push(r);
    }
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(5.4, 24, 14), new THREE.MeshBasicMaterial({ color: 0x7af0ff, transparent: true, opacity: 0.2, depthWrite: false }));
    this.dome.position.y = 10; this.root.add(this.dome);
    this.beam = new THREE.Mesh(new THREE.BoxGeometry(30, 0.35, 0.35), new THREE.MeshBasicMaterial({ color: 0xff7ad9 }));
    this.beam.geometry.translate(19, 0, 0);
    this.beam.position.y = 0.75; this.beam.visible = false; this.root.add(this.beam);
    this.nodes = []; this.conduits = [];
    for (let k = 0; k < 4; k++) {
      const a = G.world.anchors.get("citadel.node" + k);
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
      m.position.set(a.x, a.y, a.z); G.scene.add(m);
      this.nodes.push({ x: a.x, y: a.y, z: a.z, m, hp: 0, max: 0 });
    }
    for (let k = 0; k < 2; k++) {
      const a = G.world.anchors.get("citadel.conduit" + k);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.2, 10), new THREE.MeshBasicMaterial({ color: 0xc49bff }));
      m.position.set(a.x, a.y, a.z); G.scene.add(m);
      const it = { id: "citadel.conduit" + k, kind: "conduit", k, x: a.x - Math.sign(a.x - this.cx) * 1.6, y: a.y, z: a.z, hold: 2, text: "Shut off the link conduit" };
      G.world.interacts.push(it);
      this.conduits.push({ m, on: true, it });
    }
    // supply lockers in the arena (they refill every 25 seconds)
    for (const dx of [-10, 10]) {
      const y = G.col.groundAt(this.cx + dx, this.cz + 20, this.fy + 1);
      G.world.interacts.push({ id: "citadel.supply" + dx, kind: "bossSupply", x: this.cx + dx, y: y + 1.1, z: this.cz + 20, ready: 0 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 1.2), new THREE.MeshLambertMaterial({ color: 0xe0832e }));
      m.position.set(this.cx + dx, y + 0.55, this.cz + 20); G.scene.add(m);
      G.col.addBox(this.cx + dx - 0.9, y, this.cz + 19.4, this.cx + dx + 0.9, y + 1.1, this.cz + 20.6);
    }
    G.world.interacts.push({ id: "citadel.exit", kind: "exitLift", x: this.cx, y: this.fy + 1.1, z: this.cz + 30, hold: 1, text: "Ride the lift back outside" });
    this.reset();
  }
  reset() {
    const G = this.G, vet = G.diff.enemyHp;
    this.active = false; this.phase = 0; this.t = 0; this.attackT = 4; this.sweep = null; this.charge = 0; this.chargeDmg = 0;
    this.exposedT = 0; this.coreHp = 640 * vet; this.coreMax = this.coreHp; this.dronesLeft = 6; this.done = this.G.flag("boss:atlas");
    for (const n of this.nodes) { n.hp = n.max = 170 * vet; n.m.visible = !this.done; n.m.material.color.set(0xffb347); }
    for (const c of this.conduits) { c.on = true; c.m.material.color.set(0xc49bff); }
    this.beam.visible = false; this.dome.visible = !this.done;
    this.coreMesh.material.color.set(this.done ? 0x7af0ff : 0xc49bff);
    this.coreMesh.scale.setScalar(1);
  }
  get inArena() { const p = this.G.player.pos; return Math.hypot(p.x - this.cx, p.z - this.cz) < 34 && p.y < this.fy + 25; }

  start() {
    if (this.active || this.done) return;
    this.active = true; this.phase = 1; this.t = 0; this.attackT = 3;
    this.G.ui.bossBar(true);
    this.G.sayLines(BOSS_LINES.p1);
    this.G.audio.play("boss");
  }
  update(dt) {
    const G = this.G;
    this.t += dt;
    for (let k = 0; k < this.rings.length; k++) { this.rings[k].rotation.x = this.t * (0.4 + k * 0.2); this.rings[k].rotation.y = this.t * (0.3 + k * 0.25); }
    if (this.done) { this.coreMesh.material.color.set(0x7af0ff); return; }
    if (!this.active) return;
    if (!this.inArena) return;
    const P = G.player;
    // sweep: telegraph ring, then a low beam turning a full circle (jump over it, or stand on cover)
    if (this.sweep) {
      const s = this.sweep;
      s.t += dt;
      if (s.t < s.warn) {
        if (Math.floor(s.t * 6) !== s.last) { s.last = Math.floor(s.t * 6); G.fx.ring(this.cx, this.fy + 0.2, this.cz, 0xff7ad9, 32, 0.4); }
      } else {
        const k = (s.t - s.warn) / s.dur;
        const ang = s.a0 + k * Math.PI * 2 * s.dir;
        this.beam.visible = true; this.beam.rotation.y = ang;
        // player hit test
        const px = P.pos.x - this.cx, pz = P.pos.z - this.cz, d = Math.hypot(px, pz);
        const pa = Math.atan2(-pz, px);
        const diff = Math.abs(Math.atan2(Math.sin(pa - ang), Math.cos(pa - ang)));
        if (!s.hit && d > 4 && d < 49 && diff < 0.12 && P.pos.y < this.fy + 1.05) { s.hit = true; P.damage(24, this.cx, this.cz); }
        if (k >= 1) { this.sweep = null; this.beam.visible = false; }
      }
    }
    this.attackT -= dt;
    if (this.phase === 1 || this.phase === 2) {
      if (this.attackT <= 0 && !this.sweep) {
        if (Math.random() < 0.55) { this.sweep = { t: 0, warn: 1.6, dur: this.phase === 1 ? 4 : 5, a0: Math.random() * 6.28, dir: Math.random() < 0.5 ? 1 : -1, hit: false }; G.audio.play("telegraph"); }
        else this.barrage(this.phase === 1 ? 5 : 4);
        this.attackT = this.phase === 1 ? 6 : 8;
      }
      if (this.phase === 2) {
        const alive = G.robots.list.filter((r) => r.alive && r.bossHelper).length;
        if (alive < 3 && this.dronesLeft > 0 && Math.random() < dt * 0.5) {
          this.dronesLeft--;
          const r = G.robots.spawn("skimmer", this.cx + (Math.random() - 0.5) * 20, this.fy + 10, this.cz + (Math.random() - 0.5) * 20, {}, null);
          r.bossHelper = true; r.alt = 6; r.target = G.robots.playerTarget; r.lastSeen.copy(P.pos); r.seenT = G.time; r.setState("alert");
        }
      }
    }
    if (this.phase === 3) this.updatePhase3(dt);
    this.dome.visible = this.phase < 3;
    this.dome.material.opacity = 0.16 + Math.sin(this.t * 4) * 0.04;
    G.ui.bossUpdate(this.status());
  }
  barrage(n) {
    const G = this.G, P = G.player;
    G.audio.play("telegraph");
    for (let k = 0; k < n; k++) {
      setTimeout(() => {
        if (!this.active || this.done) return;
        const ox = this.cx, oy = this.fy + 10, oz = this.cz;
        const tx = P.pos.x + (Math.random() - 0.5) * 3, ty = P.pos.y + 1, tz = P.pos.z + (Math.random() - 0.5) * 3;
        const dx = tx - ox, dy = ty - oy, dz = tz - oz, L = Math.hypot(dx, dy, dz);
        G.projectiles.spawnAtlasOrb(ox + (dx / L) * 3, oy + (dy / L) * 3, oz + (dz / L) * 3, (dx / L) * 17, (dy / L) * 17, (dz / L) * 17, 10 * 1);
      }, 900 + k * 260);
    }
  }
  updatePhase3(dt) {
    const G = this.G, P = G.player;
    if (this.exposedT > 0) {
      this.exposedT -= dt;
      this.coreMesh.material.color.setHSL(0.5, 1, 0.6 + Math.sin(this.t * 12) * 0.1);
      if (this.exposedT <= 0) { this.attackT = 3; this.charge = 0; }
      return;
    }
    if (this.charge > 0) {
      this.charge += dt;
      const need = G.diff.enemyHp < 1 ? 9 : 7;
      const k = this.charge / need;
      this.coreMesh.scale.setScalar(1 + k * 0.6);
      this.coreMesh.material.color.setHSL(0.8 - k * 0.1, 1, 0.55 + k * 0.3);
      if (Math.floor(this.charge * 2) !== this.chargeBeat) { this.chargeBeat = Math.floor(this.charge * 2); G.audio.play("telegraph", 0.6); }
      if (this.charge >= need) {
        // seal pulse: blocked by the cover pillars
        this.charge = 0; this.coreMesh.scale.setScalar(1);
        G.audio.play("slam"); G.fx.ring(this.cx, this.fy + 1, this.cz, 0xff7ad9, 40, 0.8); G.fx.flash(this.cx, this.fy + 10, this.cz, 0xffd0f5, 8, 0.4);
        const safe = !G.col.clearLine(this.cx, this.fy + 10, this.cz, P.pos.x, P.pos.y + 1.2, P.pos.z);
        if (!safe) P.damage(45, this.cx, this.cz);
        this.attackT = 4;
      }
      return;
    }
    this.coreMesh.scale.setScalar(1);
    this.coreMesh.material.color.set(0xc49bff);
    if (this.attackT <= 0) {
      this.charge = 0.01; this.chargeDmg = 0; this.chargeBeat = -1;
      G.ui.toast("ATLAS is charging a seal pulse! Hit the core to interrupt, or get behind a pillar.");
    }
  }
  interrupt() {
    const G = this.G;
    this.charge = 0; this.exposedT = 6; this.coreMesh.scale.setScalar(1);
    G.audio.play("powerdown"); G.fx.burst(this.cx, this.fy + 10, this.cz, 0x7af0ff, 30, 6, 0.12, 0.7, 0);
    G.ui.toast("Charge interrupted! The core is exposed.");
  }
  status() {
    if (this.phase === 1) return { phase: "Phase 1 of 3: relay nodes", frac: this.nodes.reduce((a, n) => a + Math.max(0, n.hp), 0) / this.nodes.reduce((a, n) => a + n.max, 0), hint: `${this.nodes.filter((n) => n.hp > 0).length} relay nodes left` };
    if (this.phase === 2) return { phase: "Phase 2 of 3: link conduits", frac: this.conduits.filter((c) => c.on).length / 2, hint: `${this.conduits.filter((c) => c.on).length} conduits left (on the side platforms)` };
    return { phase: "Phase 3 of 3: the core", frac: Math.max(0, this.coreHp / this.coreMax), hint: this.exposedT > 0 ? "Core exposed! Damage it now." : this.charge > 0 ? "Charging: interrupt it!" : "Watch for the charge" };
  }

  // ---------- being hit ----------
  rayHit(ox, oy, oz, dx, dy, dz, maxT) {
    if (!this.active || this.done) return null;
    let best = null;
    if (this.phase === 1) for (const n of this.nodes) {
      if (n.hp <= 0) continue;
      const t = raySphere(ox, oy, oz, dx, dy, dz, n.x, n.y, n.z, 0.95);
      if (t !== null && t < maxT && (!best || t < best.t)) best = { t, x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, target: this.nodeWrap(n), part: "node" };
    }
    const R = this.phase < 3 ? 5.4 : 2.6 * this.coreMesh.scale.x;
    const t = raySphere(ox, oy, oz, dx, dy, dz, this.cx, this.fy + 10, this.cz, R);
    if (t !== null && t < maxT && (!best || t < best.t)) best = { t, x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, target: this.coreWrap || (this.coreWrap = { hurt: (d, o) => this.hurtCore(d, o) }), part: "core" };
    return best;
  }
  nodeWrap(n) {
    return n.wrap || (n.wrap = { hurt: (d) => {
      if (n.hp <= 0) return null;
      n.hp -= d;
      if (n.hp <= 0) {
        n.m.visible = false;
        this.G.fx.burst(n.x, n.y, n.z, 0xffb347, 24, 6, 0.12, 0.7, 4); this.G.audio.play("powerdown");
        const left = this.nodes.filter((q) => q.hp > 0).length;
        if (left === 0) this.toPhase(2); else this.G.ui.toast(`Relay node down. ${left} left.`);
        return { killed: true };
      }
      return { weak: false };
    } });
  }
  hurtCore(d, o = {}) {
    if (this.phase < 3) { this.G.fx.burst(o.x || this.cx, o.y || this.fy + 10, o.z || this.cz, 0x7af0ff, 3, 2, 0.06, 0.2, 0); return { blocked: true }; }
    if (this.charge > 0) {
      this.chargeDmg += d;
      if (this.chargeDmg >= 110 || o.interrupt) this.interrupt();
      return { weak: true };
    }
    this.coreHp -= d * (this.exposedT > 0 ? 1.6 : 0.35);
    if (this.coreHp <= 0) this.shutdown();
    return { weak: this.exposedT > 0 };
  }
  area(x, y, z, R, dmg) {
    if (!this.active || this.done) return;
    if (this.phase === 1) for (const n of this.nodes) if (n.hp > 0 && Math.hypot(n.x - x, n.y - y, n.z - z) < R + 1) this.nodeWrap(n).hurt(dmg);
    if (this.phase === 3 && Math.hypot(this.cx - x, this.fy + 10 - y, this.cz - z) < R + 3) this.hurtCore(dmg, {});
  }
  emp(x, y, z, R) {
    if (this.phase === 3 && this.charge > 0 && Math.hypot(this.cx - x, this.fy + 10 - y, this.cz - z) < R + 4) this.interrupt();
  }
  useConduit(it) {
    const c = this.conduits[it.k];
    if (!c.on || this.phase !== 2) return;
    c.on = false; c.m.material.color.set(0x333840);
    this.G.fx.burst(c.m.position.x, c.m.position.y, c.m.position.z, 0xc49bff, 20, 4, 0.1, 0.6, 2);
    this.G.audio.play("powerdown");
    if (this.conduits.every((q) => !q.on)) this.toPhase(3); else this.G.ui.toast("Link conduit off. One more on the other platform.");
  }
  toPhase(p) {
    const G = this.G;
    this.phase = p; this.attackT = 4; this.sweep = null; this.beam.visible = false;
    if (p === 2) G.sayLines(BOSS_LINES.p2);
    if (p === 3) { G.sayLines(BOSS_LINES.p3); for (const r of G.robots.list) if (r.bossHelper && r.alive) r.disable(); }
    G.checkpointHere();
  }
  shutdown() {
    const G = this.G;
    this.done = true; this.active = false; this.charge = 0; this.exposedT = 0;
    this.coreMesh.material.color.set(0x7af0ff); this.coreMesh.scale.setScalar(1);
    G.fx.burst(this.cx, this.fy + 10, this.cz, 0x7af0ff, 60, 8, 0.15, 1.2, -1);
    G.audio.play("mission");
    G.ui.bossBar(false);
    G.setFlag("boss:atlas");
    G.sayLines(BOSS_LINES.shutdown);
  }
}
