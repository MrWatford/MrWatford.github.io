// Aegis Frontier: things you pick up — upgrade cores, recordings, emblems (each collected once,
// saved by id), carryable energy cells, and energy packs that robots leave behind.
import * as THREE from "../lib/three.module.min.js";
import { CORES_HIDDEN, EMBLEMS, RECORDINGS } from "./content.js";

const GEO = {
  core: new THREE.OctahedronGeometry(0.42),
  rec: new THREE.BoxGeometry(0.45, 0.45, 0.45),
  emblem: new THREE.CylinderGeometry(0.5, 0.5, 0.12, 6),
  cell: new THREE.CylinderGeometry(0.22, 0.22, 0.6, 10),
  pack: new THREE.BoxGeometry(0.4, 0.3, 0.4),
};
const MATS = {
  core: new THREE.MeshBasicMaterial({ color: 0x6ff2e0 }),
  rec: new THREE.MeshBasicMaterial({ color: 0xffb347 }),
  emblem: new THREE.MeshBasicMaterial({ color: 0xffd34a }),
  cell: new THREE.MeshBasicMaterial({ color: 0x7af0ff }),
  pack: new THREE.MeshBasicMaterial({ color: 0x9fe8ff }),
  emp: new THREE.MeshBasicMaterial({ color: 0x7af0ff }),
};

export class Items {
  constructor(G) {
    this.G = G;
    this.collectibles = [];
    this.cells = [];
    this.drops = [];
    this.flying = [];
  }
  posFor(def) {
    const G = this.G;
    if (def.on) { const a = G.world.anchors.get(def.on + ".top"); if (a) return [a.x, a.y + 0.9, a.z]; }
    const [x, z] = def.at;
    const g = G.col.groundAt(x, z, G.terrain.heightAt(x, z) + 2.5, 0.3);
    return [x, Math.max(g, G.terrain.heightAt(x, z)) + 0.9 + (def.dy || 0), z];
  }
  build() {
    const add = (kind, def) => {
      const [x, y, z] = !def.on && def.dy > 2 ? [def.at[0], this.G.terrain.heightAt(def.at[0], def.at[1]) + def.dy, def.at[1]] : this.posFor(def);
      const m = new THREE.Mesh(GEO[kind], MATS[kind]);
      m.position.set(x, y, z);
      this.G.scene.add(m);
      this.collectibles.push({ kind, id: def.id, def, m, x, y, z });
    };
    for (const d of CORES_HIDDEN) add("core", d);
    for (const d of EMBLEMS) add("emblem", d);
    for (const d of RECORDINGS) add("rec", d);
    // floating emblems/cores in mid-air get a small platform so they are reachable
    for (const c of this.collectibles) {
      const ground = this.G.col.groundAt(c.x, c.z, c.y, 0.3);
      if (c.y - ground > 3) {
        const top = c.y - 1.0;
        this.G.col.addBox(c.x - 1.6, top - 0.4, c.z - 1.6, c.x + 1.6, top, c.z + 1.6, { tag: "perch" });
        const p = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 3.2), new THREE.MeshLambertMaterial({ color: 0x8d97a4 }));
        p.position.set(c.x, top - 0.2, c.z); this.G.scene.add(p);
        const gl = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.06, 3.3), new THREE.MeshBasicMaterial({ color: 0x6ff2e0 }));
        gl.position.set(c.x, top - 0.42, c.z); this.G.scene.add(gl);
      }
    }
  }
  refresh() {
    const S = this.G.state;
    for (const c of this.collectibles) c.m.visible = !S.collected.includes(c.id);
    this.spawnCells();
  }
  spawnCells() {
    const G = this.G;
    for (const c of this.cells) G.scene.remove(c.m);
    this.cells = [];
    const groups = {};
    for (const d of G.world.itemDefs) if (d.kind === "cell") (groups[d.group] = groups[d.group] || []).push(d);
    for (const g in groups) {
      const sockets = G.world.interacts.filter((i) => i.kind === "socket" && i.group === g);
      const open = sockets.filter((s) => !G.flag(s.flag)).length;
      groups[g].slice(0, open).forEach((d) => this.addCell(d));
    }
  }
  addCell(d) {
    const m = new THREE.Mesh(GEO.cell, MATS.cell);
    const h = d.home;
    m.position.set(h.x, h.y + 0.3, h.z);
    this.G.scene.add(m);
    const c = { def: d, m, x: h.x, y: h.y + 0.3, z: h.z, group: d.group, carried: false };
    this.cells.push(c);
    return c;
  }
  maybeDrop(robot) {
    const G = this.G;
    if (robot.opts.training) return;
    const r = Math.random();
    const chance = G.diff.dropChance;
    if (r < chance) this.addDrop("pack", robot.pos.x, robot.pos.y + 0.4, robot.pos.z);
    else if (r < chance + 0.07) this.addDrop("emp", robot.pos.x, robot.pos.y + 0.4, robot.pos.z);
  }
  addDrop(kind, x, y, z) {
    const m = new THREE.Mesh(GEO.pack, MATS[kind]);
    m.position.set(x, y, z); this.G.scene.add(m);
    this.drops.push({ kind, m, x, y, z, life: 60 });
  }
  // nearest item close to the aim ray (for the tether's item pull)
  pullable(e, f, R) {
    let best = null;
    const test = (it) => {
      const dx = it.x - e.x, dy = it.y - e.y, dz = it.z - e.z;
      const t = dx * f.x + dy * f.y + dz * f.z;
      if (t < 1 || t > R) return;
      const px = dx - f.x * t, py = dy - f.y * t, pz = dz - f.z * t;
      if (px * px + py * py + pz * pz > 1.4 * 1.4) return;
      if (!this.G.col.clearLine(e.x, e.y, e.z, it.x, it.y, it.z)) return;
      if (!best || t < best.t) best = { t, item: it };
    };
    for (const c of this.cells) if (!c.carried) test(c);
    for (const d of this.drops) test(d);
    for (const c of this.collectibles) if (c.m.visible) test(c);
    return best;
  }
  pullToPlayer(it) { this.flying.push({ it, t: 0 }); }

  carry(c) { const G = this.G; if (G.player.carry) return; c.carried = true; G.player.carry = c; G.audio.play("pickup"); G.ui.toast("Carrying an energy cell. Press E at a socket to insert it, or E elsewhere to set it down."); }
  dropCarry() {
    const G = this.G, P = G.player, c = P.carry;
    if (!c) return;
    P.carry = null; c.carried = false;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
    c.x = P.pos.x + fx * 1.2; c.z = P.pos.z + fz * 1.2;
    c.y = G.col.groundAt(c.x, c.z, P.pos.y + 1.5) + 0.3;
    if (G.terrain.heightAt(c.x, c.z) < -1 && c.y < 0.3) { c.x = c.def.home.x; c.y = c.def.home.y + 0.3; c.z = c.def.home.z; G.ui.toast("The cell floated back to where you found it."); }
    c.m.position.set(c.x, c.y, c.z);
  }
  insertCarry(socket) {
    const G = this.G, P = G.player, c = P.carry;
    if (!c) return false;
    P.carry = null;
    G.scene.remove(c.m);
    this.cells = this.cells.filter((q) => q !== c);
    G.setFlag(socket.flag);
    G.audio.play("holdDone");
    G.fx.burst(socket.x, socket.y, socket.z, 0x7af0ff, 14, 3, 0.08, 0.5, -1);
    return true;
  }

  update(dt) {
    const G = this.G, P = G.player, p = P.vehicle ? P.vehicle.pos : P.pos;
    const t = G.time;
    for (const c of this.collectibles) {
      if (!c.m.visible) continue;
      c.m.rotation.y = t * 1.5; c.m.position.y = c.y + Math.sin(t * 2 + c.x) * 0.12;
      if (Math.abs(c.x - p.x) < 2 && Math.abs(c.z - p.z) < 2 && Math.abs(c.y - (p.y + 1)) < 2.2) G.collect(c);
    }
    for (const c of this.cells) {
      if (c.carried) {
        const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
        c.m.position.set(P.pos.x + fx * 0.7 - fz * 0.25, P.pos.y + 1.05, P.pos.z + fz * 0.7 + fx * 0.25);
        c.m.rotation.y = P.yaw;
      } else c.m.rotation.y = t;
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.life -= dt; d.m.rotation.y = t * 2;
      if (d.life <= 0) { G.scene.remove(d.m); this.drops.splice(i, 1); continue; }
      if (!P.vehicle && Math.hypot(d.x - P.pos.x, d.z - P.pos.z) < 1.6 && Math.abs(d.y - P.pos.y) < 2.2) {
        if (d.kind === "pack") { G.weapons.refill(0.15); G.ui.toast("+ Energy pack"); }
        else { if (P.throwables.emp < 3) P.throwables.emp++; G.ui.toast("+ EMP Orb"); }
        G.audio.play("pickup"); G.scene.remove(d.m); this.drops.splice(i, 1);
      }
    }
    // things being reeled in by the tether
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const f = this.flying[i], it = f.it;
      f.t += dt;
      const tx = P.pos.x, ty = P.pos.y + 1.1, tz = P.pos.z;
      const k = Math.min(1, dt * 8);
      it.x += (tx - it.x) * k; it.y += (ty - it.y) * k; it.z += (tz - it.z) * k;
      (it.m || {}).position && it.m.position.set(it.x, it.y, it.z);
      const e = P.eye(new THREE.Vector3());
      G.fx.line(e.x, e.y - 0.3, e.z, it.x, it.y, it.z, 0x6ff2e0);
      if (Math.hypot(tx - it.x, ty - it.y, tz - it.z) < 1.2 || f.t > 1.5) {
        this.flying.splice(i, 1);
        if (this.cells.includes(it) && !P.carry) this.carry(it);
      }
    }
  }
}
