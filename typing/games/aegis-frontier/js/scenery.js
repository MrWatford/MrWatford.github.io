// Aegis Frontier: natural scenery and the sky.
//  - Trees (5 pine shapes + bare trees), rocks (6 shapes), and bushes are built from code, placed in
//    natural clusters with a fixed seed (same layout every time), and drawn with instancing.
//    Nearby copies use detailed models; distant copies use simple ones.
//  - Grass clumps are generated in small chunks around the player and sway in the wind.
//  - Water uses animated ripples and gets more see-through near the shore.
//  - The sky (with the habitat ring, clouds, and distant craft) is drawn in its own far layer.
import * as THREE from "../lib/three.module.min.js";
import { SITES, WORLD_HALF, WATER_Y } from "./content.js";
import { rng, fbm, smoothstep, clamp, lerp } from "./util.js";
import { regionAt } from "./terrain.js";
import { srgb, addDetail, addWind, SHARED } from "./materials.js";

// ---------------- geometry building helpers ----------------
// Collects parts into one geometry with vertex colors and a "sway" value (0 at the base, 1 at the top).
class Kit {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.sway = []; }
  add(geo, m, colorFn, swayFn) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(m);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) {
      this.pos.push(p[i], p[i + 1], p[i + 2]); this.nor.push(n[i], n[i + 1], n[i + 2]);
      const c = colorFn(p[i], p[i + 1], p[i + 2]); this.col.push(c.r, c.g, c.b);
      this.sway.push(swayFn ? swayFn(p[i], p[i + 1], p[i + 2]) : 0);
    }
  }
  build(upBias = 0) {
    if (upBias) for (let i = 0; i < this.nor.length; i += 3) {
      const x = this.nor[i] * (1 - upBias), y = lerp(this.nor[i + 1], 1, upBias), z = this.nor[i + 2] * (1 - upBias), l = Math.hypot(x, y, z) || 1;
      this.nor[i] = x / l; this.nor[i + 1] = y / l; this.nor[i + 2] = z / l;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute("sway", new THREE.Float32BufferAttribute(this.sway, 1));
    g.computeBoundingSphere();
    return g;
  }
}
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), E = new THREE.Euler(), T4 = new THREE.Matrix4();
const C = (r, g, b) => srgb(r, g, b);
// open ground kept free of trees and rocks: the title-screen lookout and the Old Span showcase path
const CLEARINGS = [[-52, 534, 16], [-42, 517, 22], [-14, 506, 9]];

// A conifer: tapered trunk, tiers of drooping branch clumps (darker inside, lighter tips), irregular gaps.
function pineGeometry(seed, H, maxLen, opts = {}) {
  const R = rng(seed), K = new Kit();
  const bark = C(0.36, 0.26, 0.18), barkDark = C(0.22, 0.16, 0.11);
  const inner = opts.dry ? C(0.18, 0.24, 0.12) : C(0.05, 0.13, 0.08), tip = opts.dry ? C(0.4, 0.44, 0.24) : C(0.2, 0.37, 0.18);
  const trunkR = H * 0.022 + 0.12;
  M4.makeTranslation(0, H * 0.5, 0);
  K.add(new THREE.CylinderGeometry(trunkR * 0.25, trunkR, H, 7, 4), M4, (x, y) => (Math.sin(y * 3 + x * 9) > 0.6 ? barkDark : bark), (x, y) => y / H);
  const tiers = opts.tiers || Math.round(H / 1.25);
  const start = opts.crown ? H * opts.crown : H * 0.22;
  for (let t = 0; t < tiers; t++) {
    const f = t / (tiers - 1), y = start + (H - start - 0.6) * f;
    const len = Math.max(0.35, maxLen * Math.pow(1 - f, 0.85) * (0.75 + R() * 0.45));
    const count = 4 + Math.floor(R() * 4);
    const off = R() * 6.28;
    for (let b = 0; b < count; b++) {
      if (R() < (opts.sparse || 0.12)) continue;          // gaps between branch groups
      const a = off + (b / count) * Math.PI * 2 + (R() - 0.5) * 0.6;
      const droop = 0.25 + R() * 0.35;
      const geo = new THREE.ConeGeometry(len * 0.32, len, 5, 1, true);
      geo.rotateZ(-Math.PI / 2);                          // point along +x
      geo.translate(len / 2, 0, 0);
      geo.scale(1, 0.42, 1);
      Q.setFromEuler(E.set(0, a, -droop));
      M4.compose(V.set(0, y, 0), Q, S3.set(1, 1, 1));
      const jitter = R() * 0.1;
      K.add(geo, M4, (x, yy, z) => { const d = Math.hypot(x, z) / (len + 0.01); return inner.clone().lerp(tip, clamp(d * 1.1 + jitter, 0, 1)); }, (x, yy) => yy / H);
    }
  }
  M4.makeTranslation(0, H - 0.2, 0);
  K.add(new THREE.ConeGeometry(0.35, 1.6, 5), M4, () => tip, () => 1);
  return K.build();
}
function bareTreeGeometry(seed, H) {
  const R = rng(seed), K = new Kit();
  const bark = C(0.46, 0.42, 0.38);
  M4.makeTranslation(0, H / 2, 0);
  K.add(new THREE.CylinderGeometry(0.06, H * 0.02 + 0.12, H, 6, 3), M4, () => bark, (x, y) => y / H);
  for (let i = 0; i < 9; i++) {
    const y = H * (0.35 + R() * 0.55), l = 0.6 + R() * 1.6;
    const g = new THREE.CylinderGeometry(0.02, 0.06, l, 4); g.translate(0, l / 2, 0);
    Q.setFromEuler(E.set(0, R() * 6.28, 1.1 + R() * 0.6)); M4.compose(V.set(0, y, 0), Q, S3.set(1, 1, 1));
    K.add(g, M4, () => bark, (x, yy) => yy / H);
  }
  return K.build();
}
// Simple far-away version of a pine: three stacked cones.
function farPine(H, maxLen) {
  const K = new Kit();
  M4.makeTranslation(0, H * 0.4, 0); K.add(new THREE.CylinderGeometry(0.1, 0.3, H * 0.8, 4), M4, () => C(0.3, 0.22, 0.15));
  for (const [y0, r, h] of [[0.22, 0.95, 0.45], [0.5, 0.7, 0.36], [0.76, 0.4, 0.28]]) {
    M4.makeTranslation(0, H * y0 + H * h * 0.5, 0);
    K.add(new THREE.ConeGeometry(maxLen * r, H * h, 6), M4, (x, y) => C(0.06, 0.15, 0.09).lerp(C(0.14, 0.27, 0.15), clamp((y - H * y0) / (H * h), 0, 1)));
  }
  return K.build();
}
// Fractured boulders: a noisy, squashed sphere cut by a few flat planes, with moss on top.
function rockGeometry(seed, detail, sx, sy, sz) {
  const R = rng(seed);
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  const planes = [];
  for (let i = 0; i < 6; i++) planes.push([new THREE.Vector3(R() - 0.5, R() * 0.6 - 0.2, R() - 0.5).normalize(), 0.6 + R() * 0.3]);
  for (let i = 0; i < p.count; i++) {
    V.fromBufferAttribute(p, i);
    const n = V.clone().normalize();
    let r = 1 + fbm(n.x * 2 + seed, n.z * 2 + n.y, 3, seed) * 0.35;
    for (const [pn, d] of planes) { const k = n.dot(pn); if (k * r > d) r = d / Math.max(0.2, k); }
    V.copy(n).multiplyScalar(r);
    if (V.y < -0.35) V.y = -0.35 - (V.y + 0.35) * 0.2;
    p.setXYZ(i, V.x * sx, V.y * sy, V.z * sz);
  }
  const ng = g.toNonIndexed(); ng.computeVertexNormals();
  const K = new Kit();
  K.add(ng, M4.identity(), () => { const t = R(); return C(0.44 + t * 0.06, 0.43 + t * 0.06, 0.41 + t * 0.05); });
  const out = K.build();
  const n = out.attributes.normal, c = out.attributes.color, moss = C(0.27, 0.38, 0.17), tmp = new THREE.Color();
  for (let i = 0; i < n.count; i++) { const up = smoothstep(0.55, 0.92, n.getY(i)); if (up > 0) { tmp.setRGB(c.getX(i), c.getY(i), c.getZ(i)).lerp(moss, up * 0.7); c.setXYZ(i, tmp.r, tmp.g, tmp.b); } }
  return out;
}
function bushGeometry(seed) {
  const R = rng(seed), K = new Kit();
  for (let i = 0; i < 6; i++) {
    const r = 0.35 + R() * 0.35;
    M4.makeTranslation((R() - 0.5) * 0.9, r * 0.8, (R() - 0.5) * 0.9);
    K.add(new THREE.IcosahedronGeometry(r, 0), M4, (x, y) => C(0.1, 0.22, 0.07).lerp(C(0.3, 0.42, 0.16), clamp(y / 1.2, 0, 1)), (x, y) => y / 1.2);
  }
  return K.build(0.4);
}
// A grass clump: curved, tapered blades (dark roots, lighter tips) with upward-facing normals so
// they light like the meadow they grow from. Tall clumps carry seed heads.
function grassGeometry(seed, tall) {
  const R = rng(seed);
  const blades = tall ? 7 : 11;
  const pos = [], col = [], sway = [];
  const root = C(0.16, 0.24, 0.08);
  for (let b = 0; b < blades; b++) {
    const a = R() * 6.28, r = R() * 0.28, x0 = Math.cos(a) * r, z0 = Math.sin(a) * r;
    const h = (tall ? 0.55 : 0.28) + R() * (tall ? 0.35 : 0.3), w = 0.018 + R() * 0.018, lean = (R() - 0.3) * 0.35, dir = R() * 6.28;
    const dry = R() < 0.25;
    const tipC = dry ? C(0.7, 0.64, 0.38) : C(0.42 + R() * 0.12, 0.58 + R() * 0.1, 0.24);
    const px = Math.cos(dir + 1.57) * w, pz = Math.sin(dir + 1.57) * w, lx = Math.cos(dir) * lean, lz = Math.sin(dir) * lean;
    const pts = [[x0 - px, 0, z0 - pz, 0], [x0 + px, 0, z0 + pz, 0], [x0 - px * 0.6 + lx * 0.35, h * 0.55, z0 - pz * 0.6 + lz * 0.35, 0.55], [x0 + px * 0.6 + lx * 0.35, h * 0.55, z0 + pz * 0.6 + lz * 0.35, 0.55], [x0 + lx, h, z0 + lz, 1]];
    for (const t of [[0, 1, 2], [1, 3, 2], [2, 3, 4]]) for (const i of t) { const q = pts[i]; pos.push(q[0], q[1], q[2]); const c = root.clone().lerp(tipC, q[3]); col.push(c.r, c.g, c.b); sway.push(q[3]); }
    if (tall && R() < 0.35) {
      const g = new THREE.CylinderGeometry(0.008, 0.016, 0.09, 4); g.translate(x0 + lx, h + 0.06, z0 + lz);
      const nb = g.toNonIndexed().attributes.position.array, sc = C(0.68, 0.62, 0.4);
      for (let i = 0; i < nb.length; i += 3) { pos.push(nb[i], nb[i + 1], nb[i + 2]); col.push(sc.r, sc.g, sc.b); sway.push(1); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const nor = new Float32Array(pos.length); for (let i = 1; i < nor.length; i += 3) nor[i] = 1;
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("sway", new THREE.Float32BufferAttribute(sway, 1));
  g.computeBoundingSphere();
  return g;
}

// ---------------- instanced near/far sets ----------------
// Holds every placement of one model; nearby ones go to the detailed mesh, distant ones to the simple mesh.
class InstanceSet {
  constructor(scene, nearGeo, farGeo, mat, items, o = {}) {
    this.items = items; this.o = o;
    const colored = items.some((it) => it.c);
    this.near = new THREE.InstancedMesh(nearGeo, mat, Math.max(1, items.length));
    this.far = farGeo ? new THREE.InstancedMesh(farGeo, o.farMat || mat, Math.max(1, items.length)) : null;
    if (colored) { this.near.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, items.length) * 3).fill(1), 3); if (this.far) this.far.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, items.length) * 3).fill(1), 3); }
    this.near.castShadow = !!o.shadow; this.near.receiveShadow = true; this.near.frustumCulled = false;
    if (this.far) { this.far.frustumCulled = false; this.far.receiveShadow = true; scene.add(this.far); }
    scene.add(this.near);
    this.near.count = 0; if (this.far) this.far.count = 0;
  }
  update(px, pz, nearR, viewR) {
    let n = 0, f = 0;
    for (const it of this.items) {
      const d = Math.hypot(it.x - px, it.z - pz);
      if (d > viewR + 40) continue;
      const tgt = d < nearR ? this.near : this.far;
      if (!tgt) continue;
      if (tgt === this.far && it.s < (this.o.farMin || 0)) continue;   // small things vanish with distance
      Q.setFromAxisAngle(V.set(0, 1, 0), it.rot);
      M4.compose(V.set(it.x, it.y, it.z), Q, S3.set(it.s, it.s, it.s));
      if (it.tilt) { T4.makeRotationFromEuler(E.set(it.tilt[0], 0, it.tilt[1])); M4.multiply(T4); }
      const i = tgt === this.near ? n++ : f++;
      tgt.setMatrixAt(i, M4);
      if (it.c && tgt.instanceColor) tgt.setColorAt(i, it.c);
    }
    this.near.count = n; this.near.instanceMatrix.needsUpdate = true;
    if (this.near.instanceColor) this.near.instanceColor.needsUpdate = true;
    if (this.far) { this.far.count = f; this.far.instanceMatrix.needsUpdate = true; if (this.far.instanceColor) this.far.instanceColor.needsUpdate = true; }
  }
}

export class Scenery {
  constructor(scene, terrain, col, T) {
    this.scene = scene; this.t = terrain; this.col = col; this.T = T;
    this.sets = []; this.birds = []; this.grass = new Map(); this.lastUp = null;
    this.blocked = [];   // spots kept clear of grass (terminals, pickups)
  }
  nearSite(x, z, pad = 8) {
    for (const [cx, cz, r] of CLEARINGS) if (Math.hypot(x - cx, z - cz) < r) return true;
    for (const s of SITES) {
      const r = (s.r || 10) + pad;
      if (Math.abs(x - s.x) < r && Math.abs(z - s.z) < r && Math.hypot(x - s.x, z - s.z) < r) return true;
    }
    return false;
  }

  build(density) {
    const R = rng(4242), T = this.t;
    const treeMat = addWind(addDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, envMapIntensity: 0.5 }), this.T.bark, { scale: 0.9, bump: 0.6, mix: 0.45 }), 0.22, 0.9);
    const farTreeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    const rockMat = addDetail(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, envMapIntensity: 0.55 }), this.T.rock, { scale: 0.32, bump: 1.1, mix: 0.9 });
    const bushMat = addWind(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), 0.12, 1.4);
    const pines = [
      [pineGeometry(11, 22, 3.0, { sparse: 0.2, crown: 0.35 }), farPine(22, 2.6), 22],
      [pineGeometry(12, 15, 3.4, {}), farPine(15, 3.1), 15],
      [pineGeometry(13, 10, 2.5, { tiers: 9 }), farPine(10, 2.3), 10],
      [pineGeometry(14, 19, 2.6, { sparse: 0.35, crown: 0.5 }), farPine(19, 2.2), 19],
      [pineGeometry(15, 16, 3.0, { dry: true, sparse: 0.25 }), farPine(16, 2.7), 16],
    ];
    const bare = bareTreeGeometry(16, 14);
    const rocks = [[1.6, 1.0, 1.3], [1.2, 1.3, 1.0], [2.2, 0.8, 1.4], [1.0, 1.6, 1.1], [1.8, 1.1, 1.8], [2.6, 1.5, 1.2]].map((s, i) => [rockGeometry(100 + i, 2, ...s), rockGeometry(100 + i, 0, ...s)]);
    const bush = bushGeometry(7);
    const treeItems = pines.map(() => []), bareItems = [], rockItems = rocks.map(() => []), bushItems = [];
    const n = new THREE.Vector3();
    const tries = Math.round(30000 * density);
    for (let k = 0; k < tries; k++) {
      const x = (R() * 2 - 1) * (WORLD_HALF - 30), z = (R() * 2 - 1) * (WORLD_HALF - 30);
      const y = T.heightAt(x, z);
      if (y < 0.8) continue;
      T.normalAt(x, z, n);
      const reg = regionAt(x, z).id;
      const roadK = T.bilinear(T.roadW, x, z), padK = T.bilinear(T.padW, x, z);
      if (roadK > 0.05 || padK > 0.05 || this.nearSite(x, z)) continue;
      // a low-frequency "forest" field makes groves, clearings, and scattered edge trees
      const forest = fbm(x * 0.009, z * 0.009, 3, 99) + fbm(x * 0.04, z * 0.04, 2, 98) * 0.35;
      const pick = R();
      const base = reg === "G" ? 0.12 : reg === "R" ? 0.05 : reg === "W" ? 0.0 : reg === "X" ? -0.25 : -0.4;
      const grove = smoothstep(-0.05, 0.25, forest + base) * smoothstep(0.7, 0.86, n.y) + 0.03;
      if (y < 85 && pick < grove * 0.5) {
        if (R() < 0.04) { bareItems.push({ x, y: y - 0.2, z, s: 0.8 + R() * 0.5, rot: R() * 6.28 }); continue; }
        const vi = reg === "C" ? 4 : y > 55 ? (R() < 0.6 ? 3 : 0) : Math.floor(R() * 4);
        const s = 0.75 + R() * 0.55;
        treeItems[vi].push({ x, y: y - 0.3, z, s, rot: R() * 6.28 });
        this.col.addCyl(x, z, (pines[vi][2] * 0.022 + 0.12) * s + 0.1, y - 1, y + pines[vi][2] * s, { tag: "tree" });
        continue;
      }
      if (n.y > 0.75 && pick < grove * 0.5 + 0.1) { bushItems.push({ x, y: y - 0.1, z, s: 0.7 + R() * 0.9, rot: R() * 6.28 }); continue; }
      // rocks gather at cliff bases and on moderate slopes (not stuck to sheer faces)
      const rocky = smoothstep(0.95, 0.72, n.y) + (reg === "C" ? 0.25 : 0) + (reg === "R" ? 0.15 : 0);
      if (n.y > 0.62 && Math.max(Math.abs(x), Math.abs(z)) < 548 && pick > 1 - 0.05 - rocky * 0.12) {
        const ri = Math.floor(R() * rocks.length), s = (rocky > 0.5 ? 1.2 : 0.5) + R() * (rocky > 0.5 ? 2.8 : 1.4);
        const c = reg === "C" ? C(1.3, 0.95, 0.72) : reg === "X" ? C(1.02, 1.0, 1.06) : C(1, 1, 1);
        rockItems[ri].push({ x, y: y + s * 0.15, z, s, rot: R() * 6.28, c, tilt: [(R() - 0.5) * 0.4, (R() - 0.5) * 0.4] });
        if (s > 1.1) this.col.addCyl(x, z, s * 1.2, y - 1, y + s * 1.1, { tag: "rock" });
        for (let q = 0; q < (s > 2 ? 5 : 1); q++) {   // scree around bigger rocks
          const a = R() * 6.28, d = s * (1.6 + R() * 1.8), sx = x + Math.cos(a) * d, sz = z + Math.sin(a) * d;
          rockItems[Math.floor(R() * rocks.length)].push({ x: sx, y: T.heightAt(sx, sz), z: sz, s: 0.15 + R() * 0.3, rot: R() * 6.28, c });
        }
      }
    }
    this.sets.push(...pines.map((p, i) => new InstanceSet(this.scene, p[0], p[1], treeMat, treeItems[i], { shadow: true, farMat: farTreeMat })));
    this.sets.push(new InstanceSet(this.scene, bare, null, treeMat, bareItems, { shadow: true }));
    this.sets.push(...rocks.map((r, i) => new InstanceSet(this.scene, r[0], r[1], rockMat, rockItems[i], { shadow: true, farMin: 1.4 })));
    this.bushSet = new InstanceSet(this.scene, bush, null, bushMat, bushItems, {});
    this.sets.push(this.bushSet);
    this.counts = { trees: treeItems.reduce((a, t) => a + t.length, 0) + bareItems.length, rocks: rockItems.reduce((a, t) => a + t.length, 0), bushes: bushItems.length };
    // grass
    this.grassGeo = [grassGeometry(1, false), grassGeometry(2, false), grassGeometry(3, true)];
    this.grassMat = addWind(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide, envMapIntensity: 0.6 }), 0.32, 1.9);
    const prevGrass = this.grassMat.onBeforeCompile;
    this.grassR = { value: 28 };
    this.grassMat.onBeforeCompile = (sh, r) => {
      prevGrass(sh, r);
      sh.uniforms.uGrassR = this.grassR;
      sh.vertexShader = sh.vertexShader.replace("uniform float uTime;", "uniform float uTime; uniform float uGrassR;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          { vec4 gp = modelMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0); float gd = distance(gp.xz, cameraPosition.xz);
            transformed.y *= smoothstep(uGrassR, uGrassR * 0.65, gd); }`);
    };
    this.grassMat.customProgramCacheKey = () => "grass-v1";
  }

  // one grass chunk; placement comes from the chunk's own seed, so it is the same every visit
  grassChunk(ci, cj) {
    const T = this.t, size = 12, R = rng(ci * 7919 + cj * 104729 + 7);
    const x0 = ci * size, z0 = cj * size;
    const items = [[], [], []];
    const step = 0.85;
    for (let gx = 0; gx < size; gx += step) for (let gz = 0; gz < size; gz += step) {
      const x = x0 + gx + R() * step, z = z0 + gz + R() * step;
      const g = T.grassAt(x, z);
      if (g < 0.35) continue;
      const y = T.heightAt(x, z);
      if (y < 0.4) continue;
      if (T.bilinear(T.roadW, x, z) > 0.25 || T.bilinear(T.padW, x, z) > 0.3) continue;
      const clump = fbm(x * 0.08, z * 0.08, 2, 77) * 0.5 + 0.5;
      if (R() > g * (0.35 + clump * 0.9)) continue;
      if (this.blocked.some((b) => Math.abs(b[0] - x) < 2.2 && Math.abs(b[1] - z) < 2.2)) continue;
      if (this.col.groundAt(x, z, y + 3, 0.2) > y + 0.2) continue;   // under a floor or structure
      const v = R() < 0.12 + clump * 0.1 ? 2 : R() < 0.5 ? 0 : 1;
      items[v].push([x, y - 0.03, z, 0.75 + R() * 0.45 * (0.6 + clump), R() * 6.28]);
    }
    return items.map((list, v) => {
      if (!list.length) return null;
      const m = new THREE.InstancedMesh(this.grassGeo[v], this.grassMat, list.length);
      list.forEach(([x, y, z, s, r], i) => { Q.setFromAxisAngle(V.set(0, 1, 0), r); M4.compose(V.set(x, y, z), Q, S3.set(s, s * (0.85 + (i % 5) * 0.08), s)); m.setMatrixAt(i, M4); });
      m.receiveShadow = true;
      m.computeBoundingSphere();
      this.scene.add(m);
      return m;
    }).filter(Boolean);
  }
  updateGrass(px, pz, radius) {
    this.grassR.value = radius;
    const size = 12, rc = Math.ceil(radius / size) + 1;
    const ci0 = Math.floor(px / size), cj0 = Math.floor(pz / size);
    const want = new Set();
    let made = 0;
    for (let i = -rc; i <= rc; i++) for (let j = -rc; j <= rc; j++) {
      const ci = ci0 + i, cj = cj0 + j;
      const cx = (ci + 0.5) * size, cz = (cj + 0.5) * size;
      if (Math.hypot(cx - px, cz - pz) > radius + size) continue;
      const k = ci + "," + cj; want.add(k);
      if (!this.grass.has(k) && made < 4) { this.grass.set(k, this.grassChunk(ci, cj)); made++; }   // spread work over frames
    }
    for (const [k, ms] of this.grass) if (!want.has(k)) { for (const m of ms) { this.scene.remove(m); m.dispose(); } this.grass.delete(k); }
  }
  clearGrass() { for (const ms of this.grass.values()) for (const m of ms) { this.scene.remove(m); m.dispose(); } this.grass.clear(); }

  buildWater() {
    // a terrain height texture tells the water shader its depth (shallow = clear green, deep = blue)
    const S = 256, data = new Float32Array(S * S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) data[j * S + i] = this.t.heightAt(-WORLD_HALF + (i / (S - 1)) * WORLD_HALF * 2, -WORLD_HALF + (j / (S - 1)) * WORLD_HALF * 2);
    const ht = new THREE.DataTexture(data, S, S, THREE.RedFormat, THREE.FloatType); ht.minFilter = ht.magFilter = THREE.LinearFilter; ht.needsUpdate = true;
    const geo = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, 1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0.0, transparent: true });
    const T = this.T;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { tH: { value: ht }, tRip: { value: T.water }, uTime: SHARED.time, uHalf: { value: WORLD_HALF } });
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D tH, tRip; uniform float uTime, uHalf; varying vec3 vWP;")
        .replace("#include <map_fragment>", `
          float floorY = texture2D(tH, (vWP.xz + uHalf) / (uHalf * 2.0)).r; float depth = max(0.0, -floorY);
          diffuseColor.rgb = mix(vec3(0.06, 0.2, 0.17), vec3(0.01, 0.06, 0.14), smoothstep(0.3, 5.0, depth));
          diffuseColor.a = mix(0.3, 0.88, smoothstep(0.0, 2.5, depth));
          vec2 r1 = vWP.xz * 0.06 + vec2(uTime * 0.02, uTime * 0.013), r2 = vWP.xz * 0.11 - vec2(uTime * 0.017, -uTime * 0.021);
          float wh = texture2D(tRip, r1).r + texture2D(tRip, r2).r;`)
        .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
          { vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float hx = dFdx(wh), hy = dFdy(wh);
            vec3 r1v = cross(dpy, normal), r2v = cross(normal, dpx); float det = dot(dpx, r1v);
            normal = normalize(abs(det) * normal - sign(det) * (hx * r1v + hy * r2v) * 0.35); }`);
    };
    mat.customProgramCacheKey = () => "water-v1";
    this.water = new THREE.Mesh(geo, mat);
    this.water.position.y = WATER_Y; this.water.renderOrder = 2;
    this.scene.add(this.water);
  }

  buildBirds() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([-0.9, 0, 0.2, 0, 0, -0.3, 0, 0, 0.3, 0.9, 0, 0.2, 0, 0, 0.3, 0, 0, -0.3], 3));
    const mat = new THREE.MeshBasicMaterial({ color: 0x2b2b33, side: THREE.DoubleSide });
    const R = rng(77);
    for (let k = 0; k < 14; k++) {
      const b = new THREE.Mesh(geo, mat);
      const cx = (R() * 2 - 1) * 450, cz = (R() * 2 - 1) * 450;
      this.birds.push({ m: b, cx, cz, r: 20 + R() * 40, h: this.t.heightAt(cx, cz) + 35 + R() * 30, a: R() * 6, sp: 0.2 + R() * 0.2, f: R() * 6 });
      this.scene.add(b);
    }
  }

  update(dt, px, pz, viewDist, Q) {
    SHARED.time.value += dt;
    if (!this.lastUp || Math.hypot(px - this.lastUp[0], pz - this.lastUp[1]) > 12) {
      this.lastUp = [px, pz];
      for (const s of this.sets) s.update(px, pz, s === this.bushSet ? Q.bushR : Q.treeNear, viewDist);
    }
    if (Q.grass > 0) this.updateGrass(px, pz, Q.grass); else if (this.grass.size) this.clearGrass();
    for (const b of this.birds) {
      b.a += dt * b.sp; b.f += dt * 9;
      b.m.position.set(b.cx + Math.cos(b.a) * b.r, b.h + Math.sin(b.a * 2) * 2, b.cz + Math.sin(b.a) * b.r);
      b.m.rotation.y = -b.a;
      b.m.scale.set(1, 1 + Math.sin(b.f) * 0.5, 1);
      b.m.rotation.z = Math.sin(b.f) * 0.4;
    }
  }
  refreshNow() { this.lastUp = null; this.clearGrass(); }
}

// ---------------- Sky ----------------
// Drawn in its own scene with a far camera, then the world is drawn on top (keeps depth precision).
export class Sky {
  constructor(T) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 10, 60000);
    this.uniforms = { top: { value: srgb(0.24, 0.47, 0.82) }, horizon: { value: srgb(0.74, 0.84, 0.92) }, sunDir: { value: new THREE.Vector3(-0.42, 0.62, 0.35).normalize() } };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: this.uniforms,
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 top, horizon, sunDir; varying vec3 vP;
        void main(){ float h = clamp(vP.y, -0.2, 1.0); vec3 c = mix(horizon, top, pow(max(h, 0.0), 0.55));
          float s = max(dot(vP, sunDir), 0.0); c += vec3(1.0, 0.86, 0.6) * (pow(s, 12.0) * 0.25 + pow(s, 900.0) * 20.0);
          c = mix(c, horizon * 0.95, smoothstep(0.08, -0.05, vP.y));
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(50000, 32, 16), skyMat));
    this.buildRing();
    this.buildFloaters();
    this.buildClouds(T);
    this.buildCraft();
  }
  buildRing() {
    // The habitat ring: our land sits at the bottom; the rest rises east and west and arcs overhead.
    const Rr = 14000, W = 2600, segs = 260;
    const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 128;
    const g = cv.getContext("2d"), R2 = rng(5);
    for (let x = 0; x < 2048; x += 6) {
      const t = R2();
      g.fillStyle = t < 0.5 ? `hsl(${100 + R2() * 30},30%,${36 + R2() * 12}%)` : t < 0.72 ? `hsl(205,40%,${42 + R2() * 10}%)` : t < 0.88 ? `hsl(32,28%,${48 + R2() * 10}%)` : "#dfe6ee";
      g.fillRect(x, 14, 6, 100);
      if (R2() < 0.3) { g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x, 14 + R2() * 90, 6 + R2() * 20, 2 + R2() * 8); }
    }
    for (const y of [0, 114]) {   // plated rim walls with panel rhythm and lights
      g.fillStyle = "#c9d2dc"; g.fillRect(0, y, 2048, 14);
      g.fillStyle = "#8d98a5"; for (let x = 0; x < 2048; x += 24) g.fillRect(x, y, 2, 14);
      g.fillStyle = "#7ff0e6"; for (let x = 0; x < 2048; x += 64) g.fillRect(x + 6, y + 5, 8, 3);
    }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 8;
    const pos = [], uv = [];
    for (let i = 0; i <= segs; i++) {
      const a = 0.2 + (i / segs) * (Math.PI * 2 - 0.4);
      const x = Math.sin(a) * Rr, y = Rr - Math.cos(a) * Rr - 400;
      pos.push(x, y, -W / 2, x, y, W / 2); uv.push(i / segs, 0, i / segs, 1);
    }
    const idx = [];
    for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    // haze: the closer to the horizon the ring appears, the more it fades into the sky color
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
      uniforms: { map: { value: tex }, haze: this.uniforms.horizon },
      vertexShader: "varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv * vec2(5.0, 1.0); vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: `uniform sampler2D map; uniform vec3 haze; varying vec2 vUv; varying vec3 vW;
        void main(){ vec3 c = texture2D(map, vUv).rgb; float el = normalize(vW).y; float h = 1.0 - smoothstep(0.02, 0.5, el);
          c = mix(c * 0.95, haze * 1.02, 0.35 + h * 0.5); gl_FragColor = vec4(c, 0.96);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.ring = new THREE.Mesh(geo, mat);
    this.ring.rotation.y = 0.35;
    this.scene.add(this.ring);
  }
  buildFloaters() {
    const R = rng(11);
    const hz = (c) => c.clone().lerp(srgb(0.74, 0.84, 0.92), 0.45);
    const rockM = new THREE.MeshBasicMaterial({ color: hz(srgb(0.5, 0.52, 0.56)) }), topM = new THREE.MeshBasicMaterial({ color: hz(srgb(0.38, 0.55, 0.34)) });
    for (let k = 0; k < 7; k++) {   // suspended land sections
      const gr = new THREE.Group();
      const base = new THREE.Mesh(new THREE.ConeGeometry(260, 420, 7), rockM); base.rotation.x = Math.PI; base.position.y = -210;
      gr.add(base, new THREE.Mesh(new THREE.CylinderGeometry(270, 260, 40, 7), topM));
      const a = R() * Math.PI * 2, d = 6000 + R() * 5000;
      gr.position.set(Math.cos(a) * d, 1500 + R() * 2500, Math.sin(a) * d);
      gr.scale.setScalar(0.6 + R());
      this.scene.add(gr);
    }
    // immense support pylons at the horizon, with light beams rising from them
    const pyl = new THREE.MeshBasicMaterial({ color: hz(srgb(0.6, 0.66, 0.74)) });
    const beamM = new THREE.MeshBasicMaterial({ color: srgb(0.6, 0.95, 1), transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const [x, z] of [[-9000, -6000], [9000, -5000], [-7000, 8000], [8000, 9000], [0, -12000]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(160, 420, 9000, 6), pyl);
      m.position.set(x, 3800, z); this.scene.add(m);
      const b = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 14000, 6, 1, true), beamM);
      b.position.set(x, 15000, z); this.scene.add(b);
    }
  }
  buildClouds(T) {
    const R = rng(33);
    this.clouds = [];
    const mat = new THREE.SpriteMaterial({ map: T.cloud, transparent: true, opacity: 0.75, depthWrite: false });
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(mat);
      const a = R() * Math.PI * 2, d = 5000 + R() * 9000;
      s.position.set(Math.cos(a) * d, 700 + R() * 1400, Math.sin(a) * d);
      const sc = 2500 + R() * 3500; s.scale.set(sc, sc * 0.4, 1);
      this.scene.add(s); this.clouds.push({ s, a, d, sp: 0.002 + R() * 0.003 });
    }
  }
  buildCraft() {
    // small transport craft cruising in the distance (a scale cue)
    this.craft = [];
    const body = new THREE.MeshBasicMaterial({ color: srgb(0.55, 0.6, 0.66) }), glow = new THREE.MeshBasicMaterial({ color: srgb(0.5, 0.95, 1) });
    const R = rng(44);
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(18, 5, 46), body));
      const w = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 12), body); w.position.z = 6; g.add(w);
      for (const x of [-26, 26]) { const e = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 6), glow); e.position.set(x, 0, 14); g.add(e); }
      this.scene.add(g);
      this.craft.push({ g, r: 3000 + R() * 2500, h: 500 + R() * 600, a: R() * 6.28, sp: (0.01 + R() * 0.012) * (R() < 0.5 ? 1 : -1) });
    }
  }
  setDaylight(top, bottom) { this.uniforms.top.value.set(top); this.uniforms.horizon.value.set(bottom); }
  update(dt) {
    for (const c of this.clouds) { c.a += c.sp * dt; c.s.position.x = Math.cos(c.a) * c.d; c.s.position.z = Math.sin(c.a) * c.d; }
    for (const c of this.craft) { c.a += c.sp * dt; c.g.position.set(Math.cos(c.a) * c.r, c.h, Math.sin(c.a) * c.r); c.g.rotation.y = -c.a + (c.sp > 0 ? Math.PI : 0); }
  }
  render(renderer, mainCam) {
    this.camera.quaternion.copy(mainCam.quaternion);
    this.camera.fov = mainCam.fov; this.camera.aspect = mainCam.aspect; this.camera.updateProjectionMatrix();
    renderer.render(this.scene, this.camera);
  }
}
