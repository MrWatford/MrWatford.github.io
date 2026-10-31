// Aegis Frontier: the land. One height grid (2.5 m cells) is used for BOTH drawing and collision,
// so what you see is exactly what you stand on.
import * as THREE from "../lib/three.module.min.js";
import { REGIONS, PASSES, ROADS, LAKES, GORGES, SITES, WORLD_HALF, WATER_Y } from "./content.js";
import { clamp, lerp, smoothstep, fbm, ridged, segDist } from "./util.js";

export const RES = 2.5;
export const N = Math.round((WORLD_HALF * 2) / RES) + 1; // 513 points per side
const HALF = WORLD_HALF;
const CHUNK = 32; // cells per chunk side (80 m)

const passPts = PASSES.map(([a, b]) => {
  const A = REGIONS.find((r) => r.id === a), B = REGIONS.find((r) => r.id === b);
  return { a: REGIONS.indexOf(A), b: REGIONS.indexOf(B), x: (A.c[0] + B.c[0]) / 2, z: (A.c[1] + B.c[1]) / 2 };
});

function regionHeight(i, x, z) {
  switch (i) {
    case 0: return 6 + 7 * fbm(x * 0.0055, z * 0.0055, 4, 11) + 2 * fbm(x * 0.03, z * 0.03, 2, 12);
    case 1: {
      const n = fbm(x * 0.0075 + 40, z * 0.0075, 4, 21);
      const t = smoothstep(0.02, 0.14, n);
      return 7 + t * 26 + 1.5 * fbm(x * 0.05, z * 0.05, 2, 22);
    }
    case 2: {
      const r = ridged(x * 0.0045, z * 0.0045, 5, 31);
      return 14 + 78 * r * r + 3 * fbm(x * 0.03, z * 0.03, 2, 32);
    }
    case 3: return -2.4 + 7.5 * fbm(x * 0.008 - 30, z * 0.008 + 17, 4, 41) + 1.5 * fbm(x * 0.03, z * 0.03, 2, 42);
    default: return 20 + 4 * fbm(x * 0.01, z * 0.01, 3, 51);
  }
}

// Which region owns a point (nearest center), plus the two nearest for border math.
export function nearestRegions(x, z) {
  let d1 = 1e9, d2 = 1e9, i1 = 0, i2 = 0;
  for (let i = 0; i < REGIONS.length; i++) {
    const c = REGIONS[i].c, d = Math.hypot(x - c[0], z - c[1]);
    if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = i; } else if (d < d2) { d2 = d; i2 = i; }
  }
  return [i1, i2, d1, d2];
}
export function regionAt(x, z) { return REGIONS[nearestRegions(x, z)[0]]; }
// Distance from a point to the border between its two nearest regions.
export function borderDist(x, z) {
  const [i1, i2, d1, d2] = nearestRegions(x, z);
  const a = REGIONS[i1].c, b = REGIONS[i2].c;
  return [(d2 * d2 - d1 * d1) / (2 * Math.hypot(a[0] - b[0], a[1] - b[1])), i1, i2];
}

function baseHeight(x, z) {
  let wsum = 0, h = 0;
  const ds = REGIONS.map((r) => Math.hypot(x - r.c[0], z - r.c[1]));
  const dmin = Math.min(...ds);
  for (let i = 0; i < REGIONS.length; i++) {
    const w = Math.exp(-(ds[i] - dmin) / 40);
    if (w < 0.01) continue;
    wsum += w; h += w * regionHeight(i, x, z);
  }
  h /= wsum;
  // border ridges with gaps at the passes
  const [b, i1, i2] = borderDist(x, z);
  let ridge = (30 + 12 * fbm(x * 0.02, z * 0.02, 2, 61)) * (1 - smoothstep(3, 30, b));
  if (ridge > 0.01) {
    for (const p of passPts) {
      if ((p.a === i1 && p.b === i2) || (p.a === i2 && p.b === i1)) ridge *= smoothstep(22, 60, Math.hypot(x - p.x, z - p.z));
    }
    h += ridge;
  }
  for (const L of LAKES) {
    const d = Math.hypot(x - L.x, z - L.z);
    if (d < L.r) h = lerp(h, -L.depth, 1 - smoothstep(L.r * 0.5, L.r, d));
  }
  const e = Math.max(Math.abs(x), Math.abs(z));
  h += smoothstep(555, 625, e) * (85 + 12 * fbm(x * 0.03, z * 0.03, 2, 71));
  return h;
}

export class Terrain {
  constructor() {
    this.h = new Float32Array(N * N);
    this.roadW = new Float32Array(N * N);
    this.padW = new Float32Array(N * N);
    this.maxH = 0;
  }

  idx(i, j) { return j * N + i; }
  // Grid sample (no interpolation)
  g(i, j) { return this.h[clamp(j, 0, N - 1) * N + clamp(i, 0, N - 1)]; }
  bilinear(arr, x, z) {
    const fx = (x + HALF) / RES, fz = (z + HALF) / RES;
    const i = clamp(Math.floor(fx), 0, N - 2), j = clamp(Math.floor(fz), 0, N - 2);
    const tx = clamp(fx - i, 0, 1), tz = clamp(fz - j, 0, 1);
    const a = arr[j * N + i], b = arr[j * N + i + 1], c = arr[(j + 1) * N + i], d = arr[(j + 1) * N + i + 1];
    return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
  }

  build() {
    const h = this.h;
    for (let j = 0; j < N; j++) {
      const z = -HALF + j * RES;
      for (let i = 0; i < N; i++) h[j * N + i] = baseHeight(-HALF + i * RES, z);
    }
    this.applyRoads();
    this.applyGorges();
    this.applyPads();
    let m = -1e9;
    for (let k = 0; k < h.length; k++) if (h[k] > m) m = h[k];
    this.maxH = m;
  }

  // Cells within radius r of (x, z): calls fn(index, distance)
  around(x, z, r, fn) {
    const i0 = Math.max(0, Math.floor((x - r + HALF) / RES)), i1 = Math.min(N - 1, Math.ceil((x + r + HALF) / RES));
    const j0 = Math.max(0, Math.floor((z - r + HALF) / RES)), j1 = Math.min(N - 1, Math.ceil((z + r + HALF) / RES));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const d = Math.hypot(-HALF + i * RES - x, -HALF + j * RES - z);
      if (d <= r) fn(j * N + i, d);
    }
  }

  applyRoads() {
    const roadH = new Float32Array(N * N);
    this.roadSamples = [];
    for (const road of ROADS) {
      const xs = [], zs = [], fixed = [];
      for (let k = 0; k < road.pts.length - 1; k++) {
        const [ax, az, ay] = road.pts[k], [bx, bz, by] = road.pts[k + 1];
        const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 2));
        for (let s = 0; s < n; s++) {
          xs.push(ax + ((bx - ax) * s) / n); zs.push(az + ((bz - az) * s) / n);
          fixed.push(s === 0 && ay !== undefined ? ay : null);
        }
      }
      const last = road.pts[road.pts.length - 1];
      xs.push(last[0]); zs.push(last[1]); fixed.push(last[2] ?? null);
      const n = xs.length;
      let hs = xs.map((x, k) => this.bilinear(this.h, x, zs[k]));
      for (let it = 0; it < 6; it++) {
        const nh = hs.slice();
        for (let k = 0; k < n; k++) {
          let s = 0, c = 0;
          for (let q = Math.max(0, k - 6); q <= Math.min(n - 1, k + 6); q++) { s += hs[q]; c++; }
          nh[k] = s / c;
        }
        hs = nh;
      }
      const g = 0.3 * 2; // max rise per 2 m sample
      for (let it = 0; it < 3; it++) {
        for (let k = 0; k < n; k++) if (fixed[k] !== null) hs[k] = fixed[k];
        for (let k = 1; k < n; k++) hs[k] = clamp(hs[k], hs[k - 1] - g, hs[k - 1] + g);
        for (let k = n - 1; k >= 0; k--) if (fixed[k] !== null) hs[k] = fixed[k];
        for (let k = n - 2; k >= 0; k--) hs[k] = clamp(hs[k], hs[k + 1] - g, hs[k + 1] + g);
      }
      const half = road.w / 2;
      for (let k = 0; k < n; k++) {
        const y = Math.max(1.2, hs[k]);
        this.roadSamples.push([xs[k], zs[k]]);
        this.around(xs[k], zs[k], half + 9, (id, d) => {
          const w = 1 - smoothstep(half, half + 9, d);
          if (w > this.roadW[id]) { this.roadW[id] = w; roadH[id] = y; }
        });
      }
    }
    for (let k = 0; k < this.h.length; k++) if (this.roadW[k] > 0) this.h[k] = lerp(this.h[k], roadH[k], this.roadW[k]);
  }

  applyGorges() {
    for (const G of GORGES) {
      const half = G.w / 2;
      const cx = (G.a[0] + G.b[0]) / 2, cz = (G.a[1] + G.b[1]) / 2;
      const R = Math.hypot(G.b[0] - G.a[0], G.b[1] - G.a[1]) / 2 + half + 8;
      this.around(cx, cz, R, (id) => {
        const i = id % N, j = (id - i) / N;
        const [d] = segDist(-HALF + i * RES, -HALF + j * RES, G.a[0], G.a[1], G.b[0], G.b[1]);
        const f = 1 - smoothstep(half, half + 6, d);
        if (f > 0) this.h[id] = Math.min(this.h[id], lerp(this.h[id], G.floor, f));
      });
    }
  }

  applyPads() {
    for (const s of SITES) {
      if (!s.r) continue;
      const y = s.h ?? Math.max(1.5, this.bilinear(this.h, s.x, s.z));
      s.y = y;
      this.around(s.x, s.z, s.r + 14, (id, d) => {
        const f = 1 - smoothstep(s.r, s.r + 14, d);
        this.h[id] = lerp(this.h[id], y, f);
        if (f > this.padW[id]) this.padW[id] = d < s.r - 1 ? 1 : f * 0.6;
      });
    }
    // sites without pads still need a floor height
    for (const s of SITES) if (s.y === undefined) s.y = this.heightAt(s.x, s.z);
  }

  // Exact height matching the drawn triangles.
  heightAt(x, z) {
    const fx = clamp((x + HALF) / RES, 0, N - 1.0001), fz = clamp((z + HALF) / RES, 0, N - 1.0001);
    const i = Math.floor(fx), j = Math.floor(fz);
    const tx = fx - i, tz = fz - j;
    const h = this.h, a = h[j * N + i], b = h[j * N + i + 1], c = h[(j + 1) * N + i], d = h[(j + 1) * N + i + 1];
    if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
    return d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
  }
  normalAt(x, z, out) {
    const e = 1.2;
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z);
    const hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    const len = Math.hypot(hx, 2 * e, hz);
    out.x = -hx / len; out.y = (2 * e) / len; out.z = -hz / len;
    return out;
  }
  // Ground or water surface for hovering things.
  surfaceAt(x, z) { return Math.max(this.heightAt(x, z), WATER_Y); }

  // ---------- drawing ----------
  colorAt(x, z, y, ny, k, out) {
    const ds = REGIONS.map((r) => Math.hypot(x - r.c[0], z - r.c[1]));
    const dmin = Math.min(...ds);
    let r = 0, g = 0, b = 0, ws = 0;
    const v = fbm(x * 0.05, z * 0.05, 2, 91) * 0.06;
    for (let i = 0; i < 5; i++) {
      const w = Math.exp(-(ds[i] - dmin) / 30);
      if (w < 0.02) continue;
      let c;
      if (i === 0) c = [0.36 + v, 0.6 + v * 1.5, 0.26];
      else if (i === 1) c = y > 18 ? [0.78, 0.47 + v, 0.3] : [0.72, 0.56 + v, 0.38];
      else if (i === 2) c = y > 80 && Math.max(Math.abs(x), Math.abs(z)) < 555 ? [0.92, 0.94, 0.97] : [0.36 + v, 0.53 + v, 0.36];
      else if (i === 3) c = [0.34 + v, 0.6 + v, 0.4];
      else c = [0.6 + v, 0.6 + v, 0.66 + v];
      r += c[0] * w; g += c[1] * w; b += c[2] * w; ws += w;
    }
    r /= ws; g /= ws; b /= ws;
    const rock = smoothstep(0.78, 0.6, ny);
    const rc = y > 85 && ds[2] === dmin && Math.max(Math.abs(x), Math.abs(z)) < 555 ? [0.8, 0.82, 0.86] : ds[1] === dmin ? [0.62, 0.38, 0.26] : [0.5, 0.49, 0.48];
    r = lerp(r, rc[0], rock); g = lerp(g, rc[1], rock); b = lerp(b, rc[2], rock);
    const sand = 1 - smoothstep(0.6, 2.2, y);
    r = lerp(r, 0.78, sand * 0.8); g = lerp(g, 0.72, sand * 0.8); b = lerp(b, 0.55, sand * 0.8);
    if (y < -0.5) { r *= 0.7; g *= 0.8; b *= 0.85; }
    const rw = this.roadW[k], pw = this.padW[k];
    if (rw > 0) { const t = smoothstep(0.35, 0.8, rw); r = lerp(r, 0.56, t); g = lerp(g, 0.48, t); b = lerp(b, 0.37, t); }
    if (pw > 0) { const t = pw * 0.85; r = lerp(r, 0.6, t); g = lerp(g, 0.61, t); b = lerp(b, 0.58, t); }
    out[0] = r; out[1] = g; out[2] = b;
  }

  buildMeshes(scene) {
    const tmpN = new THREE.Vector3(), col = [0, 0, 0];
    // per-vertex color & normal cache for the full grid
    const colors = new Float32Array(N * N * 3), normals = new Float32Array(N * N * 3);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, x = -HALF + i * RES, z = -HALF + j * RES;
      const hx = this.g(i + 1, j) - this.g(i - 1, j), hz = this.g(i, j + 1) - this.g(i, j - 1);
      tmpN.set(-hx, 2 * RES, -hz).normalize();
      normals[k * 3] = tmpN.x; normals[k * 3 + 1] = tmpN.y; normals[k * 3 + 2] = tmpN.z;
      this.colorAt(x, z, this.h[k], tmpN.y, k, col);
      colors[k * 3] = col[0]; colors[k * 3 + 1] = col[1]; colors[k * 3 + 2] = col[2];
    }
    this.mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.chunks = [];
    const nc = (N - 1) / CHUNK;
    for (let cj = 0; cj < nc; cj++) for (let ci = 0; ci < nc; ci++) {
      const near = this.chunkMesh(ci, cj, 1, colors, normals, false);
      const far = this.chunkMesh(ci, cj, 4, colors, normals, true);
      near.receiveShadow = true;
      scene.add(near); scene.add(far);
      far.visible = false;
      this.chunks.push({ near, far, cx: -HALF + (ci + 0.5) * CHUNK * RES, cz: -HALF + (cj + 0.5) * CHUNK * RES });
    }
  }

  chunkMesh(ci, cj, step, colors, normals, skirt) {
    const n = CHUNK / step + 1;
    const pos = [], nor = [], colr = [], idx = [];
    const push = (i, j, dy) => {
      const k = j * N + i;
      pos.push(-HALF + i * RES, this.h[k] - dy, -HALF + j * RES);
      nor.push(normals[k * 3], normals[k * 3 + 1], normals[k * 3 + 2]);
      colr.push(colors[k * 3], colors[k * 3 + 1], colors[k * 3 + 2]);
      return pos.length / 3 - 1;
    };
    const i0 = ci * CHUNK, j0 = cj * CHUNK;
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) push(i0 + a * step, j0 + b * step, 0);
    for (let b = 0; b < n - 1; b++) for (let a = 0; a < n - 1; a++) {
      const A = b * n + a, B = A + 1, C = A + n, D = C + 1;
      idx.push(A, C, B, B, C, D);
    }
    if (skirt) {
      const edge = (list) => {
        for (let q = 0; q < list.length - 1; q++) {
          const [ia, ja] = list[q], [ib, jb] = list[q + 1];
          const top1 = (ja - j0) / step * n + (ia - i0) / step, top2 = (jb - j0) / step * n + (ib - i0) / step;
          const lo1 = push(ia, ja, 6), lo2 = push(ib, jb, 6);
          idx.push(top1, lo1, top2, top2, lo1, lo2, top1, top2, lo1, top2, lo2, lo1);
        }
      };
      const top = [], bot = [], lef = [], rig = [];
      for (let a = 0; a < n; a++) { top.push([i0 + a * step, j0]); bot.push([i0 + a * step, j0 + CHUNK]); lef.push([i0, j0 + a * step]); rig.push([i0 + CHUNK, j0 + a * step]); }
      edge(top); edge(bot); edge(lef); edge(rig);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    return new THREE.Mesh(geo, this.mat);
  }

  updateLOD(px, pz, nearDist, viewDist) {
    for (const c of this.chunks) {
      const d = Math.hypot(c.cx - px, c.cz - pz);
      const show = d < viewDist + 60;
      c.near.visible = show && d < nearDist;
      c.far.visible = show && d >= nearDist;
    }
  }
}
