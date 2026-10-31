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

// Turns smooth slopes into ledges and terraces (medium-scale landforms).
function terrace(h, step, sharp = 0.75) {
  const f = h / step, b = Math.floor(f), t = f - b;
  return (b + smoothstep(sharp, 1, t)) * step;
}
// Authored landforms for the opening showcase route (a grassy ridge above the crash site).
const RIDGES = [{ a: [-100, 534], b: [-8, 528], h: 8, w: 26 }];

function regionHeight(i, x, z) {
  switch (i) {
    case 0: {
      let h = 6 + 7 * fbm(x * 0.0055, z * 0.0055, 4, 11) + 2 * fbm(x * 0.03, z * 0.03, 2, 12);
      h -= 1.6 * Math.pow(ridged(x * 0.012, z * 0.012, 2, 13), 3);   // shallow gullies
      for (const R of RIDGES) { const [d] = segDist(x, z, R.a[0], R.a[1], R.b[0], R.b[1]); const k = 1 - smoothstep(0, R.w, d); h += R.h * k * k * (3 - 2 * k) * (0.85 + 0.3 * fbm(x * 0.05, z * 0.05, 2, 14)); }
      return h;
    }
    case 1: {
      const n = fbm(x * 0.0075 + 40, z * 0.0075, 4, 21);
      const t = smoothstep(0.02, 0.14, n);
      return 7 + terrace(t * 26, 6.5, 0.7) + 1.5 * fbm(x * 0.05, z * 0.05, 2, 22);
    }
    case 2: {
      const r = ridged(x * 0.0045, z * 0.0045, 5, 31);
      const h = 14 + 78 * r * r + 3 * fbm(x * 0.03, z * 0.03, 2, 32);
      return lerp(h, terrace(h, 7, 0.8), 0.35);
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
  // small-scale surface variation (stronger on rocky ground, softer on meadows)
  h += 0.35 * fbm(x * 0.11, z * 0.11, 2, 81) * (0.5 + smoothstep(10, 60, h));
  const e = Math.max(Math.abs(x), Math.abs(z));
  h += smoothstep(555, 625, e) * (85 + 12 * fbm(x * 0.03, z * 0.03, 2, 71));
  return h;
}

// Ground material: blends grass, dirt, rock (projected from 3 sides so cliffs do not stretch) and gravel
// textures by the per-vertex weights, mixes two texture scales to hide repetition, and adds matching bump.
function terrainMaterial(T) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0, envMapIntensity: 0.55 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { tGrass: { value: T.grass }, tDirt: { value: T.dirt }, tRock: { value: T.rock }, tGravel: { value: T.gravel } });
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec4 splat; varying vec4 vSplat; varying vec3 vWPos; varying vec3 vWNrm;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvSplat = splat; vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWNrm = objectNormal;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform sampler2D tGrass, tDirt, tRock, tGravel; varying vec4 vSplat; varying vec3 vWPos; varying vec3 vWNrm;
        vec3 two(sampler2D t, vec2 uv){ return mix(texture2D(t, uv).rgb, texture2D(t, uv * 0.23 + 0.31).rgb, 0.4); }`)
      .replace("#include <map_fragment>", `
        vec3 n3 = normalize(vWNrm); vec3 tw = pow(abs(n3), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);
        vec3 rockC = (two(tRock, vWPos.zy * 0.11) * tw.x + two(tRock, vWPos.xz * 0.11) * tw.y + two(tRock, vWPos.xy * 0.11) * tw.z) * 0.78;
        vec3 grassC = two(tGrass, vWPos.xz * 0.2), dirtC = two(tDirt, vWPos.xz * 0.24), gravC = two(tGravel, vWPos.xz * 0.33);
        vec4 sw = vSplat; sw = max(sw, 0.0);
        // height-aware blending: crisper borders between surfaces
        vec4 hb = sw * vec4(dot(grassC, vec3(0.33)) + 0.2, dot(dirtC, vec3(0.33)), dot(rockC, vec3(0.33)) + 0.1, dot(gravC, vec3(0.33)));
        float mx = max(max(hb.x, hb.y), max(hb.z, hb.w)); hb = max(hb - (mx - 0.18), 0.0); hb /= (hb.x + hb.y + hb.z + hb.w + 1e-4);
        vec3 surf = grassC * hb.x + dirtC * hb.y + rockC * hb.z + gravC * hb.w;
        float dH = dot(surf, vec3(0.333));
        diffuseColor.rgb *= surf * 1.6;`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        { vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float hx = dFdx(dH), hy = dFdy(dH);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
          vec3 gr = sign(det) * (hx * r1 + hy * r2) * 0.9; normal = normalize(abs(det) * normal - gr); }`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.95, 0.82, hb.z);");
  };
  m.customProgramCacheKey = () => "terrain-v1";
  return m;
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
      const half = G.w / 2, bank = G.bank || 6;
      const cx = (G.a[0] + G.b[0]) / 2, cz = (G.a[1] + G.b[1]) / 2;
      const R = Math.hypot(G.b[0] - G.a[0], G.b[1] - G.a[1]) / 2 + half + bank + 2;
      this.around(cx, cz, R, (id) => {
        const i = id % N, j = (id - i) / N;
        const [d] = segDist(-HALF + i * RES, -HALF + j * RES, G.a[0], G.a[1], G.b[0], G.b[1]);
        const f = 1 - smoothstep(half, half + bank, d);
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
  // Each vertex gets a tint (broad regional color, linear) and four surface weights:
  // grass, dirt, rock, gravel. The shader blends real surface textures with them.
  paintAt(x, z, y, ny, k, tint, splat) {
    const ds = REGIONS.map((r) => Math.hypot(x - r.c[0], z - r.c[1]));
    const dmin = Math.min(...ds);
    let r = 0, g = 0, b = 0, ws = 0;
    const broad = fbm(x * 0.012, z * 0.012, 3, 92), v = fbm(x * 0.05, z * 0.05, 2, 91);
    const edge = Math.max(Math.abs(x), Math.abs(z));
    for (let i = 0; i < 5; i++) {
      const w = Math.exp(-(ds[i] - dmin) / 30);
      if (w < 0.02) continue;
      let c;
      if (i === 0) c = [1.0 + broad * 0.25, 1.02, 0.95 - broad * 0.2];        // meadow: mixes fresh and dry
      else if (i === 1) c = [1.25, 0.98, 0.72];                                // warm canyon
      else if (i === 2) c = [0.86, 0.97, 0.98];                                // cool alpine
      else if (i === 3) c = [0.9, 1.06, 0.95];                                 // lush basin
      else c = [1.0, 0.97, 1.05];                                              // pale citadel plateau
      r += c[0] * w; g += c[1] * w; b += c[2] * w; ws += w;
    }
    r /= ws; g /= ws; b /= ws;
    const canyon = Math.exp(-(ds[1] - dmin) / 30) / ws;
    // weights
    let rock = smoothstep(0.8, 0.6, ny) + smoothstep(0.25, 0.6, v) * 0.15 * (1 - ny);
    let gravel = smoothstep(0.86, 0.74, ny) * 0.35 + this.padW[k] * 0.9;
    let dirt = smoothstep(0.3, 0.8, this.roadW[k]) + smoothstep(0.2, 0.55, v) * 0.35 + (1 - smoothstep(0.4, 1.8, y)) * 0.9 + canyon * 0.9;
    let grass = 1.0 - canyon * 0.55;
    if (edge > 555) rock += 0.6;
    const snow = y > 82 && ds[2] === dmin && edge < 555 ? smoothstep(82, 92, y) : 0;
    rock = Math.min(1, rock); grass *= 1 - rock; dirt *= 1 - rock * 0.7; gravel *= 1 - rock * 0.5;
    const sum = grass + dirt + rock + gravel || 1;
    splat[0] = grass / sum; splat[1] = dirt / sum; splat[2] = rock / sum; splat[3] = gravel / sum;
    // moss on flatter rock in wet green regions; snow tint up high; darker under water
    if (snow) { r = lerp(r, 3.2, snow); g = lerp(g, 3.2, snow); b = lerp(b, 3.4, snow); }
    if (y < -0.3) { r *= 0.62; g *= 0.7; b *= 0.72; }
    const c = new THREE.Color().setRGB(r * (0.92 + v * 0.12), g * (0.92 + v * 0.12), b * (0.92 + v * 0.1), THREE.SRGBColorSpace);
    tint[0] = c.r; tint[1] = c.g; tint[2] = c.b;
  }
  grassAt(x, z) { return this.bilinear(this.splatG, x, z); }

  buildMeshes(scene, T) {
    const tmpN = new THREE.Vector3(), tint = [0, 0, 0], sp = [0, 0, 0, 0];
    const colors = new Float32Array(N * N * 3), normals = new Float32Array(N * N * 3), splats = new Float32Array(N * N * 4);
    this.splatG = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, x = -HALF + i * RES, z = -HALF + j * RES;
      const hx = this.g(i + 1, j) - this.g(i - 1, j), hz = this.g(i, j + 1) - this.g(i, j - 1);
      tmpN.set(-hx, 2 * RES, -hz).normalize();
      normals[k * 3] = tmpN.x; normals[k * 3 + 1] = tmpN.y; normals[k * 3 + 2] = tmpN.z;
      this.paintAt(x, z, this.h[k], tmpN.y, k, tint, sp);
      colors[k * 3] = tint[0]; colors[k * 3 + 1] = tint[1]; colors[k * 3 + 2] = tint[2];
      splats.set(sp, k * 4); this.splatG[k] = sp[0];
    }
    this.mat = terrainMaterial(T);
    this.chunks = [];
    const nc = (N - 1) / CHUNK;
    for (let cj = 0; cj < nc; cj++) for (let ci = 0; ci < nc; ci++) {
      const near = this.chunkMesh(ci, cj, 1, colors, normals, splats, false);
      const far = this.chunkMesh(ci, cj, 2, colors, normals, splats, true);
      near.receiveShadow = true; far.receiveShadow = true;
      scene.add(near); scene.add(far);
      far.visible = false;
      this.chunks.push({ near, far, cx: -HALF + (ci + 0.5) * CHUNK * RES, cz: -HALF + (cj + 0.5) * CHUNK * RES });
    }
  }

  chunkMesh(ci, cj, step, colors, normals, splats, skirt) {
    const n = CHUNK / step + 1;
    const pos = [], nor = [], colr = [], spl = [], idx = [];
    const push = (i, j, dy) => {
      const k = j * N + i;
      pos.push(-HALF + i * RES, this.h[k] - dy, -HALF + j * RES);
      nor.push(normals[k * 3], normals[k * 3 + 1], normals[k * 3 + 2]);
      colr.push(colors[k * 3], colors[k * 3 + 1], colors[k * 3 + 2]);
      spl.push(splats[k * 4], splats[k * 4 + 1], splats[k * 4 + 2], splats[k * 4 + 3]);
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
    geo.setAttribute("splat", new THREE.Float32BufferAttribute(spl, 4));
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
