// Aegis Frontier: puts the static world together and keeps its switchable parts in sync with progress:
// region barrier fields, doors/bridges/shield bubbles, shootable power cores, faction lights.
import * as THREE from "../lib/three.module.min.js";
import { REGIONS, SITES, siteById, WORLD_HALF } from "./content.js";
import { nearestRegions } from "./terrain.js";
import { buildSites, GLOW } from "./structures.js";
import { raySphere } from "./robots.js";

export class World {
  constructor(G) {
    this.G = G; this.scene = G.scene; this.col = G.col; this.terrain = G.terrain;
    this.anchors = new Map(); this.interacts = []; this.shootables = []; this.toggles = []; this.itemDefs = [];
    this.curtains = [];
    this.toggleT = 0;
  }
  build() {
    buildSites(this);
    // the rock ledge face and a few machinery boxes are tagged "volatile" (marked with stripes)
    this.buildCurtains();
  }

  // ---------- region barrier fields ----------
  regionLocked(id) {
    const r = REGIONS.find((q) => q.id === id);
    if (!r || r.open) return false;
    const G = this.G;
    if (G.state.mode === "training") return id !== "G";
    return !G.flag(r.flag);
  }
  buildCurtains() {
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 256;
    const g = cv.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, "rgba(150,80,240,0)"); grd.addColorStop(0.6, "rgba(150,80,240,0.22)"); grd.addColorStop(1, "rgba(150,80,240,0.45)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 256);
    g.fillStyle = "rgba(200,160,255,0.4)"; for (let y = 0; y < 256; y += 16) g.fillRect(0, y, 64, 2);
    g.fillStyle = "rgba(230,210,255,0.3)"; g.fillRect(30, 0, 4, 256);
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    this.curtainTex = tex;
    const T = this.terrain;
    for (let a = 0; a < REGIONS.length; a++) for (let b = a + 1; b < REGIONS.length; b++) {
      const A = REGIONS[a].c, B = REGIONS[b].c;
      const mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2;
      let dx = -(B[1] - A[1]), dz = B[0] - A[0];
      const L = Math.hypot(dx, dz); dx /= L; dz /= L;
      const pts = [];
      for (let t = -1000; t <= 1000; t += 6) {
        const x = mx + dx * t, z = mz + dz * t;
        if (Math.abs(x) > WORLD_HALF - 20 || Math.abs(z) > WORLD_HALF - 20) continue;
        const [i1, i2] = nearestRegions(x, z);
        if ((i1 === a && i2 === b) || (i1 === b && i2 === a)) pts.push([x, z]);
      }
      if (pts.length < 2) continue;
      const pos = [], uv = [], idx = [];
      let u = 0;
      for (let k = 0; k < pts.length; k++) {
        const [x, z] = pts[k];
        const y0 = T.heightAt(x, z) - 3, y1 = Math.max(T.heightAt(x, z), 0) + 60;
        if (k > 0) u += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][1]) / 16;
        pos.push(x, y0, z, x, y1, z); uv.push(u, 0, u, 1);
        if (k > 0) { const q = (k - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      mesh.visible = false;
      this.scene.add(mesh);
      this.curtains.push({ a: REGIONS[a].id, b: REGIONS[b].id, mesh });
    }
  }
  refreshCurtains() {
    for (const c of this.curtains) c.mesh.visible = this.regionLocked(c.a) !== this.regionLocked(c.b);
  }
  // Keeps the player (or a vehicle) out of locked regions and inside the habitat's safe perimeter.
  enforceBounds(pos, who) {
    const G = this.G;
    const edge = Math.max(Math.abs(pos.x), Math.abs(pos.z)) > WORLD_HALF - 38;
    const reg = REGIONS[nearestRegions(pos.x, pos.z)[0]];
    const locked = this.regionLocked(reg.id);
    if (!edge && !locked) { (who.lastAllowed || (who.lastAllowed = new THREE.Vector3())).copy(pos); return; }
    if (who.lastAllowed) {
      pos.x = who.lastAllowed.x; pos.z = who.lastAllowed.z; pos.y = Math.max(pos.y, who.lastAllowed.y);
      if (who.vel) { who.vel.x *= -0.3; who.vel.z *= -0.3; }
    }
    if (G.time - (this.boundMsg || -99) > 4) {
      this.boundMsg = G.time;
      G.ui.toast(edge ? "Safe recall perimeter: the habitat's outer edge isn't safe to cross." : `Directorate barrier field. ${reg.name} opens later in the story.`);
      G.audio.play("denied");
    }
  }

  // ---------- switchable parts ----------
  update(dt) {
    this.toggleT -= dt;
    if (this.curtainTex) this.curtainTex.offset.y = (this.curtainTex.offset.y + dt * 0.1) % 1;
    for (const t of this.toggles) {
      if (t.animK !== undefined && t.animK < 1) {
        t.animK = Math.min(1, t.animK + dt);
        const dir = t.anim === "rise" ? 1 : -1;
        t.mesh.position.y = t.base + dir * t.animK * 6;
        if (t.animK >= 1) t.mesh.visible = false;
      }
    }
    if (this.toggleT <= 0) { this.toggleT = 0.3; this.refreshToggles(false); }
  }
  refreshToggles(instant) {
    const F = this.G.flagSet;
    for (const t of this.toggles) {
      const on = !!t.show(F);
      if (t.on === on) continue;
      const first = t.on === undefined;
      t.on = on;
      if (t.c) { t.c.active = on; this.G.nav && this.G.nav.refresh(t.c); }
      if (on) { t.mesh.visible = true; t.mesh.position.y = t.base; t.animK = undefined; }
      else if (t.anim && !first && !instant) t.animK = 0;
      else t.mesh.visible = false;
    }
    for (const s of this.shootables) {
      const dead = this.G.flag(s.flag);
      if (dead && s.alive) { s.alive = false; s.mesh.material.color.set(0x333840); }
      if (!dead && !s.alive) { s.alive = true; s.hp = s.max; s.mesh.material.color.set(0xffb347); }
    }
    for (const s of SITES) {
      if (!s.glowMesh) continue;
      let mat = s.glowMesh.material;
      if (s.kind === "base") mat = this.G.flag("base:" + s.id) ? GLOW.friendly : GLOW.hostile;
      else if (["checkpoint", "foundry", "hangar", "hydro", "bastion"].includes(s.kind)) {
        const id = { checkpoint: "S1", foundry: "S2", hangar: "S3", hydro: "S4", bastion: "S5" }[s.kind];
        mat = this.G.flag("stronghold:" + id) ? GLOW.friendly : GLOW.hostile;
      } else if (s.kind === "citadel") mat = this.G.flag("boss:atlas") ? GLOW.friendly : GLOW.hostile;
      s.glowMesh.material = mat;
    }
    this.refreshCurtains();
  }

  // ---------- shootables (relay cores, junctions, emitters) ----------
  rayHit(ox, oy, oz, dx, dy, dz, maxT) {
    let best = null;
    for (const s of this.shootables) {
      if (!s.alive) continue;
      if (Math.abs(s.x - ox) > maxT + 2 || Math.abs(s.z - oz) > maxT + 2) continue;
      const t = raySphere(ox, oy, oz, dx, dy, dz, s.x, s.y, s.z, s.r);
      if (t !== null && t < maxT && (!best || t < best.t)) best = { t, x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, target: s.wrap || (s.wrap = this.wrapShootable(s)), part: "core" };
    }
    return best;
  }
  wrapShootable(s) {
    return { hurt: (dmg) => { if (!s.alive) return null; this.hurtShootable(s, dmg); return { weak: false, blocked: false, killed: !s.alive }; } };
  }
  hurtShootable(s, dmg) {
    const G = this.G;
    if (!s.alive) return;
    s.hp -= dmg;
    s.mesh.scale.setScalar(1 + 0.15 * Math.random());
    if (s.hp <= 0) {
      s.alive = false;
      s.mesh.material.color.set(0x333840);
      G.fx.burst(s.x, s.y, s.z, 0xffb347, 22, 6, 0.12, 0.7, 6); G.fx.flash(s.x, s.y, s.z, 0xffe0a0, 2, 0.25);
      G.audio.play("powerdown");
      G.ui.toast(`${s.label} disabled.`);
      G.setFlag(s.flag);
    }
  }
  anchor(id) {
    if (this.anchors.has(id)) return this.anchors.get(id);
    const s = siteById[id];
    if (s) return { x: s.x, y: s.y + 2, z: s.z };
    return null;
  }
}
