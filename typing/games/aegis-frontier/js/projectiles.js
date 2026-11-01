// Ringfall: moving shots (robot energy bolts, Flux orbs, EMP Orbs, Stasis Discs) and
// area effects (energy repulse, EMP, stasis fields, flux bursts, volatile machinery).
import * as THREE from "../lib/three.module.min.js";
import { rayPanel, segPanel } from "./robots.js";
import { castShot } from "./weapons.js";

const _d = new THREE.Vector3();

export class Projectiles {
  constructor(G) {
    this.G = G;
    this.list = [];
    this.fields = [];
    this.boltGeo = new THREE.CapsuleGeometry(0.09, 0.6, 2, 6); this.boltGeo.rotateX(Math.PI / 2);
    this.boltMat = new THREE.MeshBasicMaterial({ color: 0xc58bff });
    this.orbGeo = new THREE.SphereGeometry(0.22, 10, 8);
    this.pool = [];
  }
  mesh(geo, mat) {
    const m = this.pool.find((q) => !q.visible && q.geometry === geo) || (() => { const q = new THREE.Mesh(geo, mat); this.G.scene.add(q); this.pool.push(q); return q; })();
    m.material = mat; m.visible = true;
    return m;
  }
  spawnBolt(x, y, z, vx, vy, vz, dmg, owner) {
    const m = this.mesh(this.boltGeo, this.boltMat);
    m.position.set(x, y, z); m.lookAt(x + vx, y + vy, z + vz);
    this.list.push({ kind: "bolt", team: "enemy", m, x, y, z, vx, vy, vz, dmg, owner, life: 2.2 });
  }
  spawnFlux(x, y, z, vx, vy, vz) {
    const m = this.mesh(this.orbGeo, new THREE.MeshBasicMaterial({ color: 0x7dffb0 }));
    m.position.set(x, y, z);
    this.list.push({ kind: "flux", team: "player", m, x, y, z, vx, vy, vz, g: 6, life: 4 });
  }
  spawnThrowable(kind, x, y, z, vx, vy, vz) {
    const m = this.mesh(this.orbGeo, new THREE.MeshBasicMaterial({ color: kind === "emp" ? 0x7af0ff : 0xffe27a }));
    m.position.set(x, y, z);
    this.list.push({ kind, team: "player", m, x, y, z, vx, vy, vz, g: 18, life: 1.6, bounces: 1 });
  }
  spawnAtlasOrb(x, y, z, vx, vy, vz, dmg) {
    const m = this.mesh(this.orbGeo, new THREE.MeshBasicMaterial({ color: 0xd9a4ff }));
    m.position.set(x, y, z); m.scale.setScalar(1.6);
    this.list.push({ kind: "bolt", team: "enemy", m, x, y, z, vx, vy, vz, dmg, life: 4, big: true });
  }

  update(dt) {
    const G = this.G;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      let sdt = dt;
      if (p.team === "enemy" && this.inStasis(p.x, p.y, p.z)) sdt *= 0.25;
      p.life -= sdt;
      if (p.g) p.vy -= p.g * sdt;
      const nx = p.x + p.vx * sdt, ny = p.y + p.vy * sdt, nz = p.z + p.vz * sdt;
      const L = Math.hypot(nx - p.x, ny - p.y, nz - p.z);
      let hit = false;
      if (L > 0) {
        const dx = (nx - p.x) / L, dy = (ny - p.y) / L, dz = (nz - p.z) / L;
        if (p.team === "enemy") hit = this.enemyHit(p, dx, dy, dz, L);
        else hit = this.playerHit(p, dx, dy, dz, L);
      }
      if (!hit) { p.x = nx; p.y = ny; p.z = nz; p.m.position.set(nx, ny, nz); if (p.kind === "bolt") p.m.lookAt(nx + p.vx, ny + p.vy, nz + p.vz); }
      if (hit === "bounce") { p.m.position.set(p.x, p.y, p.z); continue; }
      if (hit || p.life <= 0) {
        if (!hit && p.kind !== "bolt") this.detonate(p, p.x, p.y, p.z);
        p.m.visible = false; p.m.scale.setScalar(1); this.list.splice(i, 1);
      }
    }
    for (let i = this.fields.length - 1; i >= 0; i--) {
      const f = this.fields[i];
      f.life -= dt;
      f.m.material.opacity = 0.18 * Math.min(1, f.life);
      for (const r of G.robots.list) if (r.alive && r.pos.distanceTo(f.pos) < f.r) r.slowT = Math.max(r.slowT, 0.3);
      if (f.life <= 0) { G.scene.remove(f.m); this.fields.splice(i, 1); }
    }
  }
  inStasis(x, y, z) { for (const f of this.fields) if (Math.hypot(x - f.pos.x, y - f.pos.y, z - f.pos.z) < f.r) return true; return false; }

  enemyHit(p, dx, dy, dz, L) {
    const G = this.G;
    // player's barrier (blocks robot shots)
    const b = G.player.barrier;
    if (b) { const t = rayPanel(p.x, p.y, p.z, dx, dy, dz, b); if (t !== null && t <= L) { b.hp -= p.dmg; G.fx.burst(p.x + dx * t, p.y + dy * t, p.z + dz * t, 0x55e8ff, 4, 3, 0.06, 0.25, 0); G.audio.play("shieldHit", 0.5); return true; } }
    // targets (player, allies, escorts)
    for (const t of G.robots.targets()) {
      if (!t.active()) continue;
      const cx = t.pos.x, cy = t.pos.y + t.aimY, cz = t.pos.z;
      const rr = t.isPlayer ? (G.player.vehicle ? 1.6 : 0.55) : t.radius || 0.6;
      // closest approach of the segment to the target's center (a little capsule)
      const fx = cx - p.x, fy = cy - p.y, fz = cz - p.z;
      const along = Math.max(0, Math.min(L, fx * dx + fy * dy + fz * dz));
      const qx = p.x + dx * along - cx, qy = p.y + dy * along - cy, qz = p.z + dz * along - cz;
      const vert = t.isPlayer && !G.player.vehicle ? 0.8 : 0.3;
      if (qx * qx + qz * qz < rr * rr * (p.big ? 3 : 1) && Math.abs(qy) < vert + (p.big ? 0.6 : 0)) {
        t.hurt(p.dmg, p.x - dx * 5, p.z - dz * 5);
        G.fx.burst(p.x + dx * along, p.y + dy * along, p.z + dz * along, 0xc58bff, 4, 3, 0.06, 0.25, 0);
        return true;
      }
    }
    const w = G.col.raycast(p.x, p.y, p.z, dx, dy, dz, L, { water: true });
    if (w) { G.fx.burst(w.x, w.y, w.z, 0xc58bff, 3, 2.5, 0.05, 0.2, 3); if (w.c && w.c.volatile) G.combat.volatileHit(w.c); return true; }
    return false;
  }
  playerHit(p, dx, dy, dz, L) {
    const G = this.G;
    const hit = castShot(G, p.x, p.y, p.z, dx, dy, dz, L);
    if (!hit) return false;
    if ((p.kind === "emp" || p.kind === "stasis") && !hit.target && p.bounces > 0 && hit.world && hit.world.ny > 0.5 && Math.hypot(p.vx, p.vz) > 4) {
      // one small bounce off the ground, then it settles and pops
      p.bounces--; p.x = hit.x; p.y = hit.y + 0.15; p.z = hit.z; p.vy = Math.abs(p.vy) * 0.3; p.vx *= 0.5; p.vz *= 0.5;
      return "bounce";
    }
    this.detonate(p, hit.x - dx * 0.2, hit.y - dy * 0.2, hit.z - dz * 0.2);
    return true;
  }
  detonate(p, x, y, z) {
    const G = this.G;
    if (p.kind === "flux") G.combat.areaBurst(x, y, z, 4.5, 70, 0.8, 0x7dffb0, "fluxBoom");
    else if (p.kind === "emp") G.combat.emp(x, y, z, 6);
    else if (p.kind === "stasis") {
      const m = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.18, depthWrite: false }));
      m.position.set(x, y, z); G.scene.add(m);
      this.fields.push({ pos: new THREE.Vector3(x, y, z), r: 7, life: 5, m });
      G.audio.play("stasis");
    }
  }
  clear() { for (const p of this.list) p.m.visible = false; this.list.length = 0; for (const f of this.fields) this.G.scene.remove(f.m); this.fields.length = 0; }
}

export class Combat {
  constructor(G) { this.G = G; }
  // All area effects hit robots and shootables only. They never hurt the player, allies, or people.
  forArea(x, y, z, R, fn) {
    const G = this.G;
    for (const r of G.robots.list) {
      if (!r.alive) continue;
      const d = Math.hypot(r.pos.x - x, r.pos.y + r.def.h * 0.5 - y, r.pos.z - z);
      if (d < R + r.def.r && G.col.clearLine(x, y + 0.3, z, r.pos.x, r.pos.y + r.def.h * 0.5, r.pos.z)) fn(r, d);
    }
  }
  areaBurst(x, y, z, R, dmg, stun, color, snd) {
    const G = this.G;
    G.audio.play(snd || "fluxBoom");
    G.fx.flash(x, y, z, color, R * 0.6, 0.25); G.fx.ring(x, y + 0.2, z, color, R, 0.4); G.fx.burst(x, y, z, color, 16, 6, 0.1, 0.5, 4);
    G.noise({ x, y, z, clone() { return new THREE.Vector3(x, y, z); } }, 40);
    let hits = 0;
    this.forArea(x, y, z, R, (r, d) => {
      const res = r.hurt(dmg * (1 - (d / (R + 1)) * 0.5), { area: true, stun, shieldMul: 1.3, x: r.pos.x, y: r.pos.y + 1, z: r.pos.z });
      if (res) { hits++; if (res.killed) G.ui.takedown(); }
    });
    for (const s of G.world.shootables) if (s.alive && Math.hypot(s.x - x, s.y - y, s.z - z) < R + s.r) G.world.hurtShootable(s, dmg * 0.6);
    if (G.boss) G.boss.area(x, y, z, R, dmg);
    if (hits) G.weapons.hitMarkT = 0.15;
  }
  emp(x, y, z, R) {
    const G = this.G;
    G.audio.play("emp");
    G.fx.flash(x, y, z, 0x7af0ff, R * 0.7, 0.3); G.fx.ring(x, y + 0.2, z, 0x7af0ff, R, 0.6); G.fx.burst(x, y, z, 0x7af0ff, 20, 5, 0.08, 0.5, 0);
    this.forArea(x, y, z, R, (r) => {
      r.shield = 0; r.shieldRegenT = 6;
      r.emitters.forEach((e) => (e.hp = Math.max(0, e.hp - 60)));
      r.hurt(10, { area: true, stun: 3, interrupt: true, knockFront: true, x: r.pos.x, y: r.pos.y + 1, z: r.pos.z });
    });
    if (G.boss) G.boss.emp(x, y, z, R);
  }
  // Energy repulse (V) or tether arrival pulse: pushes robots back and briefly disables them.
  repulseWave(pos, R, dmg, stun, cone, yaw) {
    const G = this.G;
    G.audio.play("repulse");
    const fx = -Math.sin(yaw || 0), fz = -Math.cos(yaw || 0);
    G.fx.ring(pos.x, pos.y + 1, pos.z, 0x9fe8ff, R, 0.35, false);
    if (cone) G.fx.burst(pos.x + fx * 1.5, pos.y + 1.2, pos.z + fz * 1.5, 0x9fe8ff, 12, 7, 0.07, 0.3, 0);
    this.forArea(pos.x, pos.y + 1, pos.z, R, (r, d) => {
      const dx = r.pos.x - pos.x, dz = r.pos.z - pos.z, L = Math.hypot(dx, dz) || 1;
      if (cone && (dx * fx + dz * fz) / L < 0.35) return;
      const res = r.hurt(dmg, { area: true, stun, interrupt: true, knockFront: true, x: r.pos.x, y: r.pos.y + 1, z: r.pos.z });
      if (res && res.killed) G.ui.takedown();
      if (!r.def.still) { const k = r.cmd ? 2 : r.type === "warden" ? 3 : 7; r.vel.x += (dx / L) * k * 3; r.vel.z += (dz / L) * k * 3; }
    });
    if (G.boss) G.boss.area(pos.x, pos.y + 1, pos.z, R, dmg * 0.5);
  }
  // Marked machinery (yellow-and-black boxes) discharges when shot.
  volatileHit(c) {
    const G = this.G;
    if (c.cool > G.time) return;
    c.cool = G.time + 20;
    const x = (c.minX + c.maxX) / 2, y = c.maxY, z = (c.minZ + c.maxZ) / 2;
    G.ui.toast("Machinery discharge!");
    this.areaBurst(x, y, z, 7, 60, 2, 0xfff27a, "shock");
  }
}
