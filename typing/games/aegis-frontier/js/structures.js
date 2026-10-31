// Aegis Frontier: builds every site out of boxes. Each box can also be solid (collision).
// Static boxes are merged into one mesh per site to keep drawing fast.
import * as THREE from "../lib/three.module.min.js";
import { SITES, RESCUES } from "./content.js";
import { addDetail } from "./materials.js";

export const COL = {
  wall: 0xdfe3e8, wall2: 0xc4ccd6, dark: 0x3a4250, metal: 0x8d97a4, orange: 0xff8a2a, teal: 0x2fd6c4,
  graphite: 0x2c3038, violet: 0x6a4d9a, rock: 0x857a6e, red: 0x9a5a3a, crate: 0xe0832e, wood: 0x8a6a48,
  glass: 0x9fd8ff, white: 0xf4f6f8, tent: 0xeedfb8, green: 0x4f9a5a,
};
// glow strips are a little brighter than white so the bloom pass picks them up
const glowM = (c, k) => { const m = new THREE.MeshBasicMaterial({ color: c }); m.color.multiplyScalar(k); return m; };
export const GLOW = {
  hostile: glowM(0xb06cff, 2.2),
  friendly: glowM(0x3ff0d8, 2.2),
  neutral: glowM(0xffd9a0, 1.8),
};

// Collects many boxes/shapes into one geometry with vertex colors.
export class MeshBuilder {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  addBox(cx, cy, cz, w, h, d, color) {
    const c = new THREE.Color(color);
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    const F = (a, b, cc, dd, n, shade) => {
      for (const v of [a, b, cc, a, cc, dd]) { this.pos.push(v[0], v[1], v[2]); this.nor.push(n[0], n[1], n[2]); this.col.push(c.r * shade, c.g * shade, c.b * shade); }
    };
    F([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], 1);
    F([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], 0.7);
    F([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], 0.92);
    F([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], 0.92);
    F([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], 0.85);
    F([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], 0.85);
  }
  addGeo(geo, matrix, color) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.applyMatrix4(matrix);
    const p = g.attributes.position.array, n = g.attributes.normal.array, c = new THREE.Color(color);
    for (let i = 0; i < p.length; i += 3) {
      this.pos.push(p[i], p[i + 1], p[i + 2]); this.nor.push(n[i], n[i + 1], n[i + 2]); this.col.push(c.r, c.g, c.b);
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
  get empty() { return this.pos.length === 0; }
}

export const solidMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15 });
export const ruinMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.05 });
// engineered panel detail (plates, seams, bolts) projected onto every structure in world space
export function initStructureLook(T) {
  addDetail(solidMat, T.panel, { scale: 0.17, bump: 0.35, mix: 0.45 });
  addDetail(ruinMat, T.rock, { scale: 0.22, bump: 1.0, mix: 0.85 });
}
const _m = new THREE.Matrix4();

// Helper handed to each site builder; all positions are relative to the site's floor center.
class Site {
  constructor(world, s) {
    this.w = world; this.s = s; this.ox = s.x; this.oz = s.z; this.oy = s.y;
    this.mb = new MeshBuilder(); this.gb = new MeshBuilder();
  }
  id(name) { return this.s.id + "." + name; }
  box(dx, dy, dz, w, h, d, color, o = {}) {
    const x = this.ox + dx, y = this.oy + dy, z = this.oz + dz;
    if (o.glow) this.gb.addBox(x, y + h / 2, z, w, h, d, 0xffffff);
    else this.mb.addBox(x, y + h / 2, z, w, h, d, color);
    if (o.collide !== false && !o.glow) return this.w.col.addBox(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, { tag: o.tag, site: this.s.id });
  }
  glow(dx, dy, dz, w, h, d) { this.box(dx, dy, dz, w, h, d, 0, { glow: true }); }
  cyl(dx, dy, dz, r, h, color, o = {}) {
    const x = this.ox + dx, y = this.oy + dy, z = this.oz + dz;
    _m.makeTranslation(x, y + h / 2, z);
    const geo = new THREE.CylinderGeometry(o.r2 ?? r, r, h, o.seg || 10);
    if (o.glow) this.gb.addGeo(geo, _m, 0xffffff); else this.mb.addGeo(geo, _m, color);
    if (o.collide !== false && !o.glow) this.w.col.addCyl(x, z, Math.max(r, o.r2 ?? 0), y, y + h, { site: this.s.id });
  }
  // A separately drawn, switchable solid piece (doors, bridge sections). show(flags) decides.
  part(dx, dy, dz, w, h, d, color, show, o = {}) {
    const x = this.ox + dx, y = this.oy + dy, z = this.oz + dz;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.glow ? GLOW.friendly : new THREE.MeshLambertMaterial({ color, transparent: !!o.alpha, opacity: o.alpha || 1 }));
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = !o.alpha;
    this.w.scene.add(mesh);
    const c = o.collide === false ? null : this.w.col.addBox(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, { site: this.s.id });
    this.w.toggles.push({ mesh, c, show, anim: o.anim, base: y + h / 2 });
    return mesh;
  }
  bubble(dx, dy, dz, r, show) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xb06cff, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    mesh.position.set(this.ox + dx, this.oy + dy, this.oz + dz);
    this.w.scene.add(mesh);
    this.w.toggles.push({ mesh, c: null, show });
  }
  anchor(name, dx, dy, dz) {
    const a = { x: this.ox + dx, y: this.oy + dy, z: this.oz + dz };
    this.w.anchors.set(this.id(name), a);
    return a;
  }
  // Something the player can use with E. model: "console", "crate", "rack", "pad", "pod", "socket", "none"
  use(name, dx, dy, dz, kind, params = {}, model = "console") {
    const a = this.anchor(name, dx, dy, dz);
    const it = { id: this.id(name), site: this.s.id, kind, x: a.x, y: a.y + 1.1, z: a.z, ...params };
    if (model === "console") { this.box(dx, dy, dz, 1.0, 1.0, 0.6, COL.dark); this.glow(dx, dy + 1.0, dz, 0.8, 0.12, 0.45); }
    else if (model === "crate") { this.box(dx, dy, dz, 1.8, 1.1, 1.2, COL.crate); this.glow(dx, dy + 1.1, dz, 1.2, 0.08, 0.6); }
    else if (model === "rack") { this.box(dx, dy, dz, 2.4, 1.8, 0.5, COL.metal); this.glow(dx, dy + 1.2, dz + 0.27, 2.0, 0.1, 0.05); }
    else if (model === "pad") { this.box(dx, dy, dz, 0.8, 1.2, 0.8, COL.dark); this.glow(dx, dy + 1.2, dz, 0.6, 0.1, 0.6); }
    else if (model === "socket") { this.box(dx, dy, dz, 0.9, 1.3, 0.9, COL.graphite); }
    this.w.interacts.push(it);
    return it;
  }
  // Something that can be shot to switch it off (relay cores, power junctions, emitters).
  shootable(name, dx, dy, dz, r, hp, flag, o = {}) {
    const x = this.ox + dx, y = this.oy + dy, z = this.oz + dz;
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
    mesh.position.set(x, y, z);
    this.w.scene.add(mesh);
    const sh = { id: this.id(name), site: this.s.id, x, y, z, r, hp, max: hp, flag, mesh, alive: true, needFlag: o.needFlag, label: o.label || "Power core" };
    this.w.shootables.push(sh);
    this.w.anchors.set(sh.id, { x, y, z });
    return sh;
  }
  item(name, kind, dx, dy, dz, params = {}) {
    const it = { id: this.id(name), kind, home: { x: this.ox + dx, y: this.oy + dy, z: this.oz + dz }, ...params };
    this.w.itemDefs.push(it);
    this.w.anchors.set(it.id, it.home);
    return it;
  }
  finish(glowMat) {
    if (!this.mb.empty) {
      const m = new THREE.Mesh(this.mb.build(), solidMat);
      m.castShadow = m.receiveShadow = true;
      this.w.scene.add(m); this.s.mesh = m;
    }
    if (!this.gb.empty) {
      const g = new THREE.Mesh(this.gb.build(), glowMat);
      this.w.scene.add(g); this.s.glowMesh = g;
    }
  }
}

// ---------------- builders ----------------
function stairs(S, x, z, dir, steps, rise = 0.42, run = 0.8, width = 1.6, color = COL.metal) {
  // dir: [dx, dz] unit axis direction the stairs climb toward
  for (let k = 1; k <= steps; k++) {
    const cx = x + dir[0] * (k - 0.5) * run, cz = z + dir[1] * (k - 0.5) * run;
    const w = dir[0] ? run : width, d = dir[0] ? width : run;
    S.box(cx, 0, cz, w, k * rise, d, color);
  }
}
function platform(S, x, z, y, w, d, legs = true, color = COL.metal) {
  S.box(x, y - 0.4, z, w, 0.4, d, color);
  S.glow(x, y - 0.42, z + d / 2, w, 0.1, 0.06);
  if (legs) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.box(x + a * (w / 2 - 0.3), 0, z + b * (d / 2 - 0.3), 0.4, y - 0.4, 0.4, COL.dark);
}
function cover(S, x, z, along = "x", len = 3) {
  if (along === "x") S.box(x, 0, z, len, 1.25, 0.8, COL.wall2); else S.box(x, 0, z, 0.8, 1.25, len, COL.wall2);
  S.glow(x, 1.25, z, along === "x" ? len - 0.4 : 0.1, 0.06, along === "x" ? 0.1 : len - 0.4);
}

const B = {
  base(S) {
    const id = S.s.id;
    // command hut (open to the south)
    S.box(0, 0, -9, 12.6, 4.8, 0.6, COL.wall);
    S.box(-6, 0, -5.5, 0.6, 4.8, 7.6, COL.wall);
    S.box(6, 0, -5.5, 0.6, 4.8, 7.6, COL.wall);
    S.box(0, 4.8, -5.4, 13.4, 0.6, 8.8, COL.dark);
    S.glow(0, 4.3, -1.65, 12, 0.25, 0.2);
    S.box(-4.5, 0, -7.8, 2.2, 2.2, 1.4, COL.metal);
    S.use("terminal", 0, 0, -7.6, "baseTerminal", { base: id, hold: 2.5 });
    S.bubble(0, 0, -5.5, 8.5, (F) => !F.has("baserelay:" + id));
    // shield relay pylon
    S.box(-13, 0, 7, 1.6, 5.6, 1.6, COL.graphite);
    S.box(-13, 7.4, 7, 1.6, 0.4, 1.6, COL.graphite, { collide: false });
    S.shootable("relay", -13, 6.5, 7, 0.75, 120, "baserelay:" + id, { label: "Shield relay" });
    // watchtower with stairs
    platform(S, 12, -12, 5, 5, 5);
    stairs(S, 10.6, -0.2, [0, -1], 12, 0.42, 0.8);
    S.box(12, 5, -14.3, 5, 1.0, 0.3, COL.wall2); S.box(14.35, 5, -12, 0.3, 1.0, 5, COL.wall2);
    // cover and props
    cover(S, -6, 6); cover(S, 6, 6); cover(S, 0, 12, "x", 4); cover(S, -15, -2, "z"); cover(S, 15, 4, "z");
    S.box(-17, 0, -10, 2, 2, 2, COL.crate); S.box(-17, 2, -10, 1.4, 1.2, 1.4, COL.crate);
    S.box(-13, 0, -14, 0.4, 11, 0.4, COL.metal); S.glow(-13, 11, -14, 1, 1, 1);
    S.use("supply", -9, 0, -13.5, "supply", { base: id }, "crate");
    S.use("armory", 9, 0, -2, "armory", { base: id }, "rack");
    // vehicle pad
    S.glow(0, 0.03, 21, 9, 0.04, 0.25); S.glow(0, 0.03, 29, 9, 0.04, 0.25); S.glow(-4.5, 0.03, 25, 0.25, 0.04, 8); S.glow(4.5, 0.03, 25, 0.25, 0.04, 8);
    S.anchor("padspot", 0, 0, 25); S.anchor("padspot2", -12, 0, 22); S.anchor("padspot3", 12, 0, 22);
    S.use("pad", 7, 0, 19, "vehiclePad", { base: id }, "pad");
    S.use("pod", -6, 0, 15, "pod", {}, "none");
    S.anchor("ally1", -3, 0, 2); S.anchor("ally2", 3, 0, 0); S.anchor("ally3", -9, 0, -6); S.anchor("ally4", 9, 0, 9);
    if (id === "B8") {
      S.use("b1", -24, 0, -10, "campBeacon", { flag: "camp:b1" });
      S.use("b2", 24, 0, -12, "campBeacon", { flag: "camp:b2" });
      S.use("b3", 0, 0, 26, "campBeacon", { flag: "camp:b3" });
      S.use("holo", 3, 0, -7.6, "holo", {}, "console");
      for (let k = 0; k < 4; k++) S.box(-20 + k * 4, 0, 16, 3, 2.2, 3, COL.tent);
    }
  },

  relay(S) {
    const id = S.s.id;
    for (const [a, b] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) S.box(a, 0, b, 0.5, 18, 0.5, COL.metal);
    for (const y of [5, 10, 15]) { S.box(0, y, -1.6, 3.6, 0.3, 0.3, COL.dark, { collide: false }); S.box(0, y, 1.6, 3.6, 0.3, 0.3, COL.dark, { collide: false }); }
    S.box(0, 18, 0, 4, 0.5, 4, COL.dark);
    S.cyl(0, 18.5, 0, 0.3, 4, COL.metal, { collide: false });
    S.part(0, 22.5, 0, 1.2, 1.2, 1.2, 0, (F) => F.has("relay:" + id), { glow: true, collide: false });
    S.use("terminal", 0, 0, 3.2, "relayTerminal", { flag: "relay:" + id, enc: id, hold: 2.5 });
    cover(S, -6, 6); cover(S, 6, -5, "z");
  },

  crash(S) {
    // shuttle hull (on its belly, nose in the dirt)
    S.box(-2, 0, 2, 7, 3.2, 14, COL.white);
    S.box(-2, 3.2, 3, 5, 1.2, 9, COL.wall2);
    S.box(-2, 0, -6.5, 5, 2.4, 3, COL.white);
    S.box(-2, 0.6, -8.4, 3.4, 1.4, 0.8, COL.glass, { collide: false });
    S.box(-8, 0.4, 3, 6, 0.6, 4, COL.wall2); S.box(4, 0.4, 3, 5, 0.6, 4, COL.wall2);
    S.box(-2, 1.0, 9.2, 4, 1.8, 0.6, COL.orange);
    S.glow(-2, 2.6, 9.55, 3, 0.15, 0.1);
    S.use("power", 7.2, 0, -2, "flagUse", { flag: "crash:power", text: "Restore suit power", hold: 1.5 });
    S.use("locker", 6.5, 0, 8.5, "flagUse", { flag: "crash:locker", text: "Open the equipment locker", hold: 1, gives: "carbine", need: "crash:power" }, "rack");
    // debris and the rock ledge for the tether lesson
    S.box(8, 0, -6, 2, 0.8, 3, COL.wall2); S.box(-11, 0, -4, 1.5, 0.6, 1.5, COL.dark);
    S.box(22, 0, -22, 9, 7, 8, COL.rock, { tag: "rock" }); S.box(22, 7, -23, 6, 1.4, 5, COL.rock);
    S.glow(22, 4, -17.95, 3, 0.4, 0.1);
    S.anchor("start", 6, 0, 15);
  },

  shelter(S) {
    S.box(0, 0, -4, 8, 3.6, 0.5, COL.wall); S.box(-3.8, 0, -1, 0.5, 3.6, 6, COL.wall); S.box(3.8, 0, -1, 0.5, 3.6, 6, COL.wall);
    S.box(0, 3.6, -1, 8.6, 0.5, 6.6, COL.green);
    S.box(-2.5, 0, 2, 3, 3.6, 0.5, COL.wall); S.box(2.5, 0, 2, 3, 3.6, 0.5, COL.wall);
    S.glow(0, 3.2, 2.3, 2, 0.2, 0.1);
    S.box(0, 0, -3, 2, 0.8, 1, COL.wood);
  },

  training(S) {
    S.box(18, 0, -14, 3, 1, 3, COL.wall2);                       // low block (jump)
    S.box(14, 0, -26, 0.5, 1.6, 0.5, COL.metal); S.box(22, 0, -26, 0.5, 1.6, 0.5, COL.metal);
    S.box(18, 1.25, -26, 8.5, 0.35, 0.5, COL.orange);             // slide bar
    S.box(12, 0, -26, 4, 1.6, 0.6, COL.wall2); S.box(24, 0, -26, 4, 1.6, 0.6, COL.wall2);
    S.box(0, 0, -36, 3, 1.9, 3, COL.wall2);                      // mantle block
    S.box(-22, 0, -26, 1.2, 7.6, 1.2, COL.dark); S.box(-22, 7.6, -26, 5, 0.6, 5, COL.metal); // tether platform
    S.glow(-22, 6.2, -23.45, 4, 0.3, 0.1);
    S.box(38, 0, 14, 0.8, 6, 0.8, COL.metal); S.box(38, 0, 22, 0.8, 6, 0.8, COL.metal); S.glow(38, 6, 18, 0.8, 0.5, 8.8);
    for (const [x, z] of [[-24, 8], [-30, 14], [-20, 18]]) S.anchor("target" + (x + 100), x, 2.2, z);
    S.anchor("rover", 26, 0, 10); S.anchor("start", 0, 0, 26);
    cover(S, -20, 0, "x", 4); cover(S, -10, 4, "z", 3);
  },

  checkpoint(S) {
    // walls across the road with a gate
    S.box(-17, 0, 0, 22, 7, 2, COL.graphite); S.box(17, 0, 0, 22, 7, 2, COL.graphite);
    S.glow(-17, 6.2, 1.05, 20, 0.25, 0.1); S.glow(17, 6.2, 1.05, 20, 0.25, 0.1);
    S.part(0, 0, 0, 12, 6.5, 1.2, COL.violet, (F) => !F.has("stronghold:S1"), { anim: "drop" });
    platform(S, -12, -10, 6, 6, 5); platform(S, 12, -10, 6, 6, 5);
    stairs(S, -27, -10, [1, 0], 15, 0.42, 0.8); stairs(S, 27, -10, [-1, 0], 15, 0.42, 0.8);
    S.box(-24, 0, -8, 1.6, 4.5, 1.6, COL.graphite); S.shootable("e1", -24, 5.4, -8, 0.8, 160, "s1:e1", { label: "Shield emitter" });
    S.box(24, 0, -8, 1.6, 4.5, 1.6, COL.graphite); S.shootable("e2", 24, 5.4, -8, 0.8, 160, "s1:e2", { label: "Shield emitter" });
    S.bubble(0, 0, -2, 14, (F) => !(F.has("s1:e1") && F.has("s1:e2")));
    cover(S, -8, 10); cover(S, 8, 10); cover(S, 0, -18, "x", 5); cover(S, -18, 14, "z"); cover(S, 18, 14, "z");
    S.box(-8, 0, -16, 2, 2, 2, COL.crate); S.box(8, 0, -20, 2, 2, 2, COL.crate);
  },

  convoy(S) {
    S.box(-6, 0, 0, 4, 3, 9, COL.white); S.box(-6, 3, 1, 3.4, 0.6, 5, COL.orange);
    S.box(6, 0, 4, 4, 3, 8, COL.white); S.box(6, 3, 4, 3.4, 0.6, 4, COL.orange);
    S.box(0, 0, -8, 5, 2, 3, COL.wall2);
    for (const [x, z] of [[-4, 10], [4, -6], [-10, -6]]) S.box(x, 0, z, 3, 2.4, 3, COL.tent);
    S.use("gen", 0, 0, 4, "convoyGen", { hold: 4, flag: "convoy:repair" });
    S.bubble(0, 0, 3, 11, (F) => !F.has("escort:m4"));
    S.anchor("team", 0, 0, 7);
  },

  foundry(S) {
    const H = 9;
    // outer walls with a front gate (south), a side gap (east) and climbable walls
    S.box(0, 0, -34, 72, H, 2, COL.graphite);
    S.box(-36, 0, 0, 2, H, 70, COL.graphite);
    S.box(36, 0, -20, 2, H, 30, COL.graphite); S.box(36, 0, 22, 2, H, 26, COL.graphite);
    S.box(-22, 0, 34, 28, H, 2, COL.graphite); S.box(22, 0, 34, 28, H, 2, COL.graphite);
    for (const x of [-36, 36]) for (const z of [-34, 34]) S.box(x, 0, z, 4, H + 3, 4, COL.dark);
    S.glow(0, H - 0.6, -32.95, 70, 0.3, 0.1); S.glow(-22, H - 0.6, 35.05, 26, 0.3, 0.1); S.glow(22, H - 0.6, 35.05, 26, 0.3, 0.1);
    // assembly hall roofline and line
    S.box(0, 0, -6, 34, 1.2, 4, COL.metal); S.glow(0, 1.2, -6, 32, 0.1, 1);
    for (const x of [-14, -4, 6, 16]) S.box(x, 1.2, -6, 3, 2.2, 2.4, COL.violet, { collide: false });
    S.box(-16, 0, 8, 6, 3.5, 6, COL.graphite); S.box(16, 0, 8, 6, 3.5, 6, COL.graphite);
    S.box(-24, 0, -18, 1.4, 6, 1.4, COL.dark); S.shootable("line1", -24, 6.8, -18, 0.9, 220, "foundry:line1", { label: "Power junction" });
    S.box(24, 0, -18, 1.4, 6, 1.4, COL.dark); S.shootable("line2", 24, 6.8, -18, 0.9, 220, "foundry:line2", { label: "Power junction" });
    // controller
    S.box(0, 0, 4, 6, 0.8, 6, COL.dark);
    S.use("controller", 0, 0.8, 4, "controller", { hold: 3, flag: "stronghold:S2", need: ["foundry:line1", "foundry:line2"] });
    S.bubble(0, 0.8, 4, 4.5, (F) => !(F.has("foundry:line1") && F.has("foundry:line2")));
    // rear catwalk with stairs
    S.box(0, 8, -24, 40, 0.4, 4, COL.metal); S.box(-18, 0, -24, 0.5, 8, 0.5, COL.dark); S.box(18, 0, -24, 0.5, 8, 0.5, COL.dark);
    stairs(S, -30, -10, [0, -1], 19, 0.42, 0.7);
    S.box(-25.5, 8, -24, 11, 0.4, 4, COL.metal);
    cover(S, -8, 18); cover(S, 8, 18); cover(S, -24, 12, "z"); cover(S, 24, 12, "z"); cover(S, 0, 26, "x", 5);
    S.use("pod", -16, 0, 70, "pod", {}, "none");
    // parked crawler with a lock node (in the yard outside the east gap)
    S.anchor("crawler", 48, 0, 4);
    S.use("lock", 48, 0, 9, "lockNode", { hold: 2.5, flag: "claim:crawler", need: "stronghold:S2" }, "none");
  },

  station(S) {
    S.box(0, 0, -8, 14, 5, 8, COL.wall); S.box(0, 5, -8, 15, 0.6, 9, COL.dark); S.glow(0, 4.3, -3.95, 12, 0.3, 0.1);
    S.cyl(8, 0, 6, 0.6, 9, COL.metal);
    S.cyl(8, 9, 6, 5, 0.6, COL.white, { r2: 3, collide: false });
    S.part(8, 9.8, 6, 1, 1, 1, 0, (F) => F.has("sensor:on"), { glow: true, collide: false });
    S.use("terminal", 3, 0, -3.2, "flagUse", { flag: "sensor:on", hold: 2.5, text: "Restore the long-range sensor", needClear: ["m5_sentinel"] });
    cover(S, -8, 6); cover(S, -2, 12, "x", 4); cover(S, 12, -4, "z");
    platform(S, -12, 10, 3.5, 6, 5);
    S.item("rec", "none", 0, 0, 0);
  },

  hangar(S) {
    S.box(0, 0, -14, 32, 11, 1.2, COL.wall2);
    S.box(-15.4, 0, -4, 1.2, 11, 20, COL.wall2); S.box(15.4, 0, -4, 1.2, 11, 20, COL.wall2);
    S.box(0, 11, -4, 33, 0.8, 21, COL.dark);
    S.part(0, 0, 6, 29.6, 10, 0.8, COL.violet, (F) => !F.has("clear:S3"), { anim: "rise" });
    S.glow(0, 10.4, 6.5, 30, 0.3, 0.1);
    S.box(-6, 0, -6, 8, 2.5, 5, COL.white); S.box(-6, 2.5, -6, 4, 1, 3, COL.glass, { collide: false });
    S.use("key", 8, 0, -8, "keyPickup", { hold: 1, flag: "s3:key", need: "clear:S3", text: "Take the transport key" }, "rack");
    S.use("desk", 0, 0, 16, "flagUse", { hold: 2, flag: "stronghold:S3", need: "s3:key", text: "Return the transport key" });
    cover(S, -10, 20); cover(S, 10, 20); cover(S, -20, 10, "z"); cover(S, 20, 10, "z");
    platform(S, 18, -18, 4, 5, 5);
  },

  arena(S) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, r = (S.s.r || 20) - 6;
      cover(S, Math.cos(a) * r, Math.sin(a) * r, k % 2 ? "x" : "z", 3.5);
    }
    for (const [x, z] of [[-6, -6], [6, 6]]) S.box(x, 0, z, 2, 4, 2, COL.rock);
    S.glow(0, 0.03, 0, 6, 0.04, 6);
  },

  pillars(S) {
    for (const [x, z, h] of [[-12, -8, 10], [10, -12, 14], [4, 12, 18]]) {
      S.box(x, 0, z, 3, h, 3, COL.rock); S.box(x, h, z, 5, 0.5, 5, COL.metal);
      S.anchor("perch" + h, x, h + 0.5, z);
    }
    cover(S, -2, 0); cover(S, 14, 8, "z"); cover(S, -16, 10);
  },

  bridge(S) {
    // wide deck across the canyon gorge
    const T = S.w.terrain;
    const y = Math.max(T.heightAt(S.ox - 25, S.oz + 37), T.heightAt(S.ox + 24, S.oz - 37), 8);
    S.oy = y - 0.6;
    S.box(0, 0, 0, 26, 0.6, 34, COL.metal);
    S.box(-13.5, 0.6, 0, 0.6, 1.1, 34, COL.wall2); S.box(13.5, 0.6, 0, 0.6, 1.1, 34, COL.wall2);
    S.glow(-13.5, 1.7, 0, 0.1, 0.1, 34); S.glow(13.5, 1.7, 0, 0.1, 0.1, 34);
    for (const [x, z] of [[-10, -12], [10, 12]]) S.box(x, -30, z, 2, 30, 2, COL.dark);
    cover(S, -4, -4); cover(S, 5, 6);
    S.s.y = y; S.oy = y;
  },

  crossing(S) {
    const T = S.w.terrain;
    const y = Math.max(T.heightAt(S.ox, S.oz + 30), T.heightAt(S.ox, S.oz - 30), 3);
    S.oy = y; S.s.y = y;
    S.box(0, -0.6, 22, 7, 0.6, 18, COL.metal); S.box(0, -0.6, -22, 7, 0.6, 18, COL.metal);
    S.part(0, -0.6, 0, 7, 0.6, 26, COL.metal, (F) => F.has("crossing_restored"));
    for (const z of [-31, 31]) S.box(0, -0.6, z, 7, 0.6, 0.6, COL.dark);
    S.box(-3.8, 0, 22, 0.4, 1.1, 18, COL.wall2); S.box(3.8, 0, 22, 0.4, 1.1, 18, COL.wall2);
    S.box(-3.8, 0, -22, 0.4, 1.1, 18, COL.wall2); S.box(3.8, 0, -22, 0.4, 1.1, 18, COL.wall2);
    for (const z of [-14, 14]) for (const x of [-3, 3]) S.box(x, -40, z, 1.4, 40 - 0.6, 1.4, COL.dark);
    S.box(-10, 0, 34, 1.4, 8, 1.4, COL.graphite); S.box(10, 0, 34, 1.4, 8, 1.4, COL.graphite);
    S.glow(-10, 8, 34, 1.2, 1.2, 1.2); S.glow(10, 8, 34, 1.2, 1.2, 1.2);
    S.use("west", -10, 0, 31.5, "flagUse", { flag: "crossing:west", hold: 2.5, text: "Reconnect the west anchor", needClear: ["crossing_n"] });
    S.use("east", 10, 0, 31.5, "flagUse", { flag: "crossing:east", hold: 2.5, text: "Reconnect the east anchor", needClear: ["crossing_n"] });
    S.use("assist1", -14, 0, 44, "assist", { flag: "assist:1" });
    S.use("assist2", 12, 0, -48, "assist", { flag: "assist:2" });
    S.anchor("start", 0, 0, 50); S.anchor("end", 27, 0, -85);
  },

  vault(S) {
    // outer shell with a door on the south face
    S.box(0, 0, -20, 26, 9, 1, COL.wall);
    S.box(-12.5, 0, -10, 1, 9, 20, COL.wall); S.box(12.5, 0, -10, 1, 9, 20, COL.wall);
    S.box(-8, 0, 0, 10, 9, 1, COL.wall); S.box(8, 0, 0, 10, 9, 1, COL.wall);
    S.box(0, 6, 0, 6, 3, 1, COL.wall);
    S.box(0, 9, -10, 27, 0.6, 21, COL.dark);
    S.glow(0, 8.4, 0.55, 24, 0.25, 0.1);
    S.part(0, 0, 0, 6, 6, 0.8, COL.violet, (F) => !(F.has("vault:cell1") && F.has("vault:cell2") && F.has("vault:cell3")), { anim: "rise" });
    // inner partition and archive
    S.box(-7, 0, -10, 12, 4, 0.8, COL.wall2); S.box(9, 0, -10, 6, 4, 0.8, COL.wall2);
    for (const x of [-9, -5, 5, 9]) S.box(x, 0, -17, 2, 3.2, 3, COL.metal);
    S.use("core", 0, 0, -16, "flagUse", { flag: "vault:core", hold: 3, text: "Read the archive core", needClear: ["vault_in"] });
    S.use("dash", 5, 0, -13.5, "equipPickup", { equip: "dash", need: "vault:core" }, "rack");
    for (const [k, x] of [[1, -5], [2, 0], [3, 5]]) S.use("cell" + k, x, 0, 3.5, "socket", { flag: "vault:cell" + k, group: "vault" }, "socket");
    S.item("c1", "cell", 6, 9.6, -6, { group: "vault" });             // on the roof
    S.item("c2", "cell", 22, 0.4, 22, { group: "vault" });            // guarded
    S.box(-22, 0, 8, 6, 3.2, 6, COL.wall2); S.box(-22, 0, 12, 6, 3.2, 0.4, COL.wall2, { collide: false });
    S.item("c3", "cell", -22, 3.6, 8, { group: "vault" });            // on the shed roof
    cover(S, -8, 14); cover(S, 8, 18); cover(S, 18, 10, "z");
    S.box(-30, -1, -40, 4, 1.6, 4, COL.rock);
  },

  hydro(S) {
    S.box(0, 0, -26, 50, 10, 2, COL.wall2);
    S.box(-24, 0, -16, 2, 10, 20, COL.wall2); S.box(24, 0, -16, 2, 10, 20, COL.wall2);
    S.box(0, 10, -16, 50, 0.6, 22, COL.dark);
    S.glow(0, 9.2, -5.9, 46, 0.3, 0.1);
    for (const x of [-12, 12]) { S.cyl(x, 0, -18, 3, 6, COL.metal); S.part(x, 6, -18, 1.2, 1.2, 1.2, 0, (F) => F.has(x < 0 ? "s4:t1" : "s4:t2"), { glow: true, collide: false }); }
    S.use("t1", -12, 0, -13.5, "socket", { flag: "s4:t1", group: "hydro" }, "socket");
    S.use("t2", 12, 0, -13.5, "socket", { flag: "s4:t2", group: "hydro" }, "socket");
    S.item("c1", "cell", -22, 0.4, 20, { group: "hydro" });
    S.item("c2", "cell", 24, 0.4, 24, { group: "hydro" });
    S.box(0, 0, -6, 8, 1.4, 1, COL.wall2);
    cover(S, -14, 8); cover(S, 14, 8); cover(S, 0, 16, "x", 5); cover(S, -30, 4, "z"); cover(S, 30, 4, "z");
    S.box(-38, 0, -20, 6, 5, 6, COL.graphite); S.box(38, 0, -20, 6, 5, 6, COL.graphite);
  },

  flighttower(S) {
    S.box(0, 0, 0, 5, 40, 5, COL.wall2); S.glow(0, 20, 2.55, 3, 18, 0.1);
    platform(S, 0, 0, 40.4, 12, 12, false); S.box(0, 40.4, -6, 12, 1.1, 0.4, COL.wall2);
    S.use("terminal", 0, 40.4, -4, "flagUse", { flag: "tower:on", hold: 2.5, text: "Restore flight control", need: ["aa:1", "aa:2", "aa:3"] });
    S.use("lift", 0, 0, 3.3, "lift", { to: [0, 40.4, 3], need: ["aa:1", "aa:2", "aa:3"], text: "Ride the maintenance lift" }, "pad");
    const P = [[-14, 6, 8], [-22, -16, 16], [0, -20, 20], [24, -8, 22], [18, 14, 26], [4, 26, 28], [-8, 12, 34]];
    for (const [x, z, y] of P) { platform(S, x, z, y, 6, 6, false); S.box(x, 0, z, 0.8, y - 0.4, 0.8, COL.dark, { collide: y < 20 }); }
    S.anchor("aa1", -22, 16, -16); S.anchor("aa2", 24, 22, -8); S.anchor("aa3", 4, 28, 26);
    cover(S, -8, -8); cover(S, 10, 6); cover(S, -12, 14, "z");
  },

  bastion(S) {
    const H = 10;
    S.box(0, 0, -36, 70, H, 3, COL.graphite);
    S.box(-35, 0, -14, 3, H, 42, COL.graphite); S.box(35, 0, -14, 3, H, 42, COL.graphite);
    S.box(-22, 0, 36, 26, H, 3, COL.graphite); S.box(22, 0, 36, 26, H, 3, COL.graphite);
    S.box(-35, 0, 26, 3, H, 18, COL.graphite); S.box(35, 0, 26, 3, H, 18, COL.graphite);
    for (const x of [-35, 35]) for (const z of [-36, 36]) S.box(x, 0, z, 5, H + 6, 5, COL.dark);
    S.glow(0, H - 0.8, -34.4, 66, 0.3, 0.1);
    platform(S, -16, -20, 9, 7, 6); platform(S, 16, -20, 9, 7, 6);
    stairs(S, -20, -5, [0, -1], 21, 0.42, 0.7); stairs(S, 20, -5, [0, -1], 21, 0.42, 0.7);
    for (const [k, x, z] of [[1, -22, -28], [2, 22, -28], [3, 0, 28]]) {
      S.box(x, 0, z, 2, 5, 2, COL.graphite);
      S.shootable("e" + k, x, 6, z, 0.9, 240, "bastion:e" + k, { label: "Defense emitter" });
    }
    S.part(0, 0, -36, 14, 9, 3.2, COL.violet, (F) => !F.has("clear:m11_gatekeeper"), { anim: "drop" });
    cover(S, -10, 14); cover(S, 10, 14); cover(S, -24, 4, "z"); cover(S, 24, 4, "z"); cover(S, 0, 0, "x", 6); cover(S, -8, -12); cover(S, 8, -12);
  },

  citadel(S) {
    const R = 38, H = 20;
    // octagon chamber walls (door on the south-west for the lift corridor is not needed; lift teleports inside)
    // a ring of small blocks keeps the inner wall round (big blocks poke inward at the diagonals)
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R;
      S.box(x, 0, z, 7, H, 7, COL.graphite);
    }
    S.box(0, H, 0, 2 * R + 14, 1.5, 2 * R + 14, COL.dark);
    S.glow(0, H - 0.1, 0, 22, 0.1, 22);
    // spires
    for (const [x, z, h] of [[-58, -50, 70], [58, -50, 62], [-58, 50, 56], [58, 50, 64], [0, -60, 80]]) {
      S.box(x, 0, z, 8, h, 8, COL.wall2); S.glow(x, h * 0.5, z + 4.05, 1.2, h * 0.8, 0.1); S.box(x, h, z, 4, 8, 4, COL.white);
    }
    // inner arena
    S.cyl(0, 0, 0, 5, 6, COL.dark, { seg: 12 });
    S.use("console", 0, 0, 7.5, "heartConsole", { hold: 3, flag: "heart:reconnect", need: "boss:atlas" });
    S.anchor("boss", 0, 12, 0);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      S.box(Math.cos(a) * 14, 0, Math.sin(a) * 14, 2.6, 5, 2.6, COL.wall2);              // cover pillars
      S.box(Math.cos(a) * 24, 0, Math.sin(a) * 24, 1.6, 3.4, 1.6, COL.graphite);         // relay node stands
      S.anchor("node" + k, Math.cos(a) * 24, 4.2, Math.sin(a) * 24);
    }
    for (const sx of [-1, 1]) {
      platform(S, sx * 22, 0, 9, 7, 9);
      S.anchor("conduit" + (sx < 0 ? 0 : 1), sx * 24.5, 10.2, 0);
      // a long flight of steps up to each side platform
      for (let k = 1; k <= 21; k++) S.box(sx * 20, 0, 4.5 + (21 - k + 0.5) * 0.72, 3, k * 0.43, 0.72, COL.metal);
    }
    S.anchor("arrive", 0, 0, 24);
    S.anchor("lift", -84, 0, 42);
    // the transit lift outside the chamber
    S.box(-84, 0, 42, 6, 0.4, 6, COL.metal); S.glow(-84, 0.42, 42, 5, 0.05, 5);
    S.box(-84, 0, 45.5, 6, 9, 0.6, COL.wall2);
    S.use("liftuse", -84, 0, 42, "transitLift", { hold: 1.5, flag: "lift:ride", need: "stronghold:S5", text: "Ride the command transit lift" }, "none");
    S.item("rec", "none", 0, 0, 0);
  },

  rescue(S) {
    const r = RESCUES.find((q) => q.id === S.s.id);
    S.box(0, 0, -3, 7, 3.4, 0.5, COL.wall); S.box(-3.3, 0, 0, 0.5, 3.4, 6, COL.wall); S.box(3.3, 0, 0, 0.5, 3.4, 6, COL.wall);
    S.box(0, 3.4, 0, 7.6, 0.5, 6.6, COL.orange);
    S.box(-2.3, 0, 3, 2.2, 3.4, 0.5, COL.wall); S.box(2.3, 0, 3, 2.2, 3.4, 0.5, COL.wall);
    S.anchor("team", 0, 0, 0); S.anchor("evac", 0, 0, 14);
    for (const [x, z] of [[-8, 6], [8, 7]]) S.box(x, 0, z, 3, 2.2, 3, COL.tent);
    const id = r.id;
    if (r.type === "shield") {
      S.bubble(0, 0, 0, 6.5, (F) => !F.has("rescue:" + id) && !F.has("rfix:" + id));
      S.use("gen", 5.5, 0, 5, "rescueFix", { rescue: id, hold: 3, text: "Repair the shelter shield", flag: "rfix:" + id });
    } else if (r.type === "locked") {
      S.part(0, 0, 3, 2.4, 3, 0.4, COL.violet, (F) => !F.has("rfix:" + id), { anim: "rise" });
      S.use("socket", 3.6, 0, 4.2, "socket", { flag: "rfix:" + id, group: "res" + id }, "socket");
      S.item("cell", "cell", -14, 0.4, -10, { group: "res" + id });
    } else {
      S.use("talk", 0, 0, 4.5, "rescueFix", { rescue: id, hold: 1, text: "Tell the team it's safe", flag: "rfix:" + id }, "none");
    }
  },

  // The Old Span: an original weathered arch, partly buried, with a broken section, a fallen block,
  // inset panels, and a faint teal seam along its inner edge. Collision boxes follow each segment.
  ruin(S) {
    const T = S.w.terrain, gy = T.heightAt(S.ox, S.oz);
    S.oy = gy; S.s.y = gy;
    const mb = new MeshBuilder(), gb = new MeshBuilder();
    const stone = 0x8b8f86, stoneDark = 0x6e746c, moss = 0x5d7347;
    const arch = (cx, cz, cy, R, th, dep, a0, a1, gap, segs, rotY) => {
      for (let i = 0; i < segs; i++) {
        const a = a0 + ((a1 - a0) * i) / segs, b = a0 + ((a1 - a0) * (i + 1)) / segs;
        if (gap && a > gap[0] && b < gap[1]) continue;
        const pts = [];
        for (const ang of [a, b]) for (const r of [R - th / 2, R + th / 2]) for (const z of [-dep / 2, dep / 2]) pts.push([Math.cos(ang) * r, Math.sin(ang) * r, z]);
        const idx = [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]];
        const pos = [];
        const rot = (p) => { const c = Math.cos(rotY), s2 = Math.sin(rotY); return [cx + p[0] * c + p[2] * s2, cy + p[1], cz - p[0] * s2 + p[2] * c]; };
        for (const q of idx) for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...rot(pts[q[k]]));
        const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
        const top = Math.sin((a + b) / 2) > 0.55;
        mb.addGeo(geo, new THREE.Matrix4(), i % 3 === 0 ? stoneDark : top ? moss : stone);
        // teal seam along the inner edge (front face)
        // a continuous seam piece, turned to follow the curve
        const mid = (a + b) / 2, ri = R - th / 2 + 0.12, len = ri * (b - a) * 1.02;
        const ia = rot([Math.cos(mid) * ri, Math.sin(mid) * ri, dep / 2 + 0.03]);
        if (Math.sin(mid) * R + cy > gy + 0.3) {
          const mm = new THREE.Matrix4().makeRotationY(rotY).multiply(new THREE.Matrix4().makeRotationZ(mid + Math.PI / 2));
          mm.setPosition(ia[0], ia[1], ia[2]);
          gb.addGeo(new THREE.BoxGeometry(len, 0.14, 0.06), mm, 0xffffff);
        }
        // collision: a box around this segment (only the part above ground)
        const xs = pos.filter((_, k) => k % 3 === 0), ys = pos.filter((_, k) => k % 3 === 1), zs = pos.filter((_, k) => k % 3 === 2);
        const minY = Math.max(Math.min(...ys), gy - 2), maxY = Math.max(...ys);
        if (maxY > gy + 0.2) S.w.col.addBox(Math.min(...xs), minY, Math.min(...zs), Math.max(...xs), maxY, Math.max(...zs), { site: "ruin" });
      }
    };
    // main arch: 34 m across, buried below the hill, with a broken gap near the top
    arch(S.ox, S.oz, gy - 5, 17, 2.6, 3.4, 0.08, Math.PI - 0.08, [1.32, 1.66], 22, 0);
    // smaller second arch fragment behind it, leaning out of the slope
    arch(S.ox - 26, S.oz + 14, gy - 7, 11, 2.2, 3, 0.25, 1.9, null, 10, 0.5);
    // fallen block from the broken gap, half buried
    S.box(9, -0.9, 6, 6.5, 2.4, 3.2, stoneDark, { tag: "rock" });
    S.box(-6, -1.2, -5, 3, 1.8, 3, stone, { tag: "rock" });
    for (const [x, z] of [[-17, 2], [17, -1]]) S.box(x, -0.4, z, 4.2, 1.0, 4.6, stoneDark);   // buried footings
    const m = new THREE.Mesh(mb.build(), ruinMat); m.castShadow = m.receiveShadow = true; S.w.scene.add(m);
    const gm = new THREE.Mesh(gb.build(), GLOW.friendly); S.w.scene.add(gm);
    S.anchor("top", 0, 12, 0);
  },

  spire(S) {
    const h = S.s.h;
    S.box(0, 0, 0, 7, h * 0.45, 7, COL.rock, { tag: "rock" });
    S.box(0.5, h * 0.45, -0.3, 5.2, h * 0.35, 5.2, COL.rock, { tag: "rock" });
    S.box(0.2, h * 0.8, 0.2, 4, h * 0.2, 4, COL.rock, { tag: "rock" });
    S.anchor("top", 0.2, h, 0.2);
  },
};

export function buildSites(world) {
  for (const s of SITES) {
    const S = new Site(world, s);
    const fn = B[s.kind];
    if (!fn) continue;
    fn(S);
    S.finish(s.kind === "base" || s.kind === "checkpoint" || s.kind === "foundry" || s.kind === "bastion" || s.kind === "citadel" || s.kind === "hangar" || s.kind === "hydro" ? GLOW.hostile : GLOW.neutral);
  }
}
