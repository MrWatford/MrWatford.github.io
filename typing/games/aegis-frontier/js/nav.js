// Aegis Frontier: ground navigation. The terrain grid (2.5 m cells) is marked walkable or blocked
// (too steep, deep water, or inside a structure); A* finds paths, then they are smoothed.
import { N, RES } from "./terrain.js";
import { WORLD_HALF } from "./content.js";

const HALF = WORLD_HALF;

export class Nav {
  constructor(terrain, col) {
    this.t = terrain; this.col = col;
    this.walk = new Uint8Array(N * N);
    this.g = new Float32Array(N * N); this.f = new Float32Array(N * N);
    this.from = new Int32Array(N * N); this.seen = new Uint32Array(N * N); this.closed = new Uint32Array(N * N);
    this.gen = 1;
    this.heap = [];
  }
  build() {
    const h = this.t.h;
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) {
      const k = j * N + i, y = h[k];
      let ok = y > -0.6;
      if (ok) {
        const d = Math.max(Math.abs(h[k + 1] - y), Math.abs(h[k - 1] - y), Math.abs(h[k + N] - y), Math.abs(h[k - N] - y));
        ok = d < 1.25;
      }
      this.walk[k] = ok ? 1 : 0;
    }
    for (const c of this.col.all) this.markCollider(c);
  }
  markCollider(c) {
    const pad = 0.5;
    const i0 = Math.max(0, Math.floor((c.minX - pad + HALF) / RES)), i1 = Math.min(N - 1, Math.ceil((c.maxX + pad + HALF) / RES));
    const j0 = Math.max(0, Math.floor((c.minZ - pad + HALF) / RES)), j1 = Math.min(N - 1, Math.ceil((c.maxZ + pad + HALF) / RES));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * N + i, x = -HALF + i * RES, z = -HALF + j * RES;
      if (this.walk[k] === 0 && !c.active) continue;
      this.walk[k] = this.cellOk(k, x, z) ? 1 : 0;
    }
  }
  cellOk(k, x, z) {
    const h = this.t.h, y = h[k];
    if (y <= -0.6) return false;
    const i = k % N;
    if (i < 1 || i >= N - 1 || k < N || k >= N * (N - 1)) return false;
    const d = Math.max(Math.abs(h[k + 1] - y), Math.abs(h[k - 1] - y), Math.abs(h[k + N] - y), Math.abs(h[k - N] - y));
    if (d >= 1.25) return false;
    let blocked = false;
    const r = 0.9;
    this.col.query(x - r, z - r, x + r, z + r, (c) => {
      if (c.maxY < y + 0.5 || c.minY > y + 1.8) return;
      if (c.type === 0) { if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) { blocked = true; return false; } }
      else if (Math.hypot(x - c.x, z - c.z) < c.r + r) { blocked = true; return false; }
    });
    return !blocked;
  }
  refresh(c) { this.markCollider(c); }
  cell(x, z) {
    const i = Math.round((x + HALF) / RES), j = Math.round((z + HALF) / RES);
    if (i < 0 || j < 0 || i >= N || j >= N) return -1;
    return j * N + i;
  }
  ok(x, z) { const k = this.cell(x, z); return k >= 0 && this.walk[k] === 1; }
  nearestOk(x, z, maxR = 12) {
    if (this.ok(x, z)) return [x, z];
    for (let r = RES; r <= maxR; r += RES) {
      for (let a = 0; a < 16; a++) {
        const px = x + Math.cos((a / 16) * Math.PI * 2) * r, pz = z + Math.sin((a / 16) * Math.PI * 2) * r;
        if (this.ok(px, pz)) return [px, pz];
      }
    }
    return null;
  }
  // straight walkable line on the grid?
  lineOk(ax, az, bx, bz) {
    const L = Math.hypot(bx - ax, bz - az), n = Math.ceil(L / (RES * 0.5));
    for (let s = 1; s <= n; s++) { const t = s / n; if (!this.ok(ax + (bx - ax) * t, az + (bz - az) * t)) return false; }
    return true;
  }

  // A* with a node budget. Returns a smoothed list of [x, z] points, or null.
  find(ax, az, bx, bz, budget = 2500) {
    let s = this.cell(ax, az), e = this.cell(bx, bz);
    if (s < 0 || e < 0) return null;
    if (!this.walk[s]) { const q = this.nearestOk(ax, az, 6); if (!q) return null; s = this.cell(q[0], q[1]); }
    if (!this.walk[e]) { const q = this.nearestOk(bx, bz, 10); if (!q) return null; e = this.cell(q[0], q[1]); }
    if (this.lineOk(ax, az, bx, bz)) return [[bx, bz]];
    const gen = ++this.gen;
    const ei = e % N, ej = (e - ei) / N;
    const H = (k) => { const i = k % N, j = (k - i) / N, dx = Math.abs(i - ei), dz = Math.abs(j - ej); return dx + dz - 0.586 * Math.min(dx, dz); };
    const heap = this.heap; heap.length = 0;
    this.g[s] = 0; this.f[s] = H(s); this.seen[s] = gen; this.from[s] = -1;
    const push = (k) => { heap.push(k); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (this.f[heap[p]] <= this.f[heap[i]]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && this.f[heap[l]] < this.f[heap[m]]) m = l; if (r < heap.length && this.f[heap[r]] < this.f[heap[m]]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    push(s);
    let best = s, bestH = H(s), n = 0;
    const DIRS = [1, -1, N, -N, N + 1, N - 1, -N + 1, -N - 1];
    while (heap.length && n++ < budget) {
      const k = pop();
      if (this.closed[k] === gen) continue;
      this.closed[k] = gen;
      if (k === e) { best = k; break; }
      const hk = H(k); if (hk < bestH) { bestH = hk; best = k; }
      for (let d = 0; d < 8; d++) {
        const nk = k + DIRS[d];
        if (nk < 0 || nk >= N * N || !this.walk[nk] || this.closed[nk] === gen) continue;
        if (d >= 4 && (!this.walk[k + DIRS[d] - (d === 4 || d === 5 ? N : -N)] || !this.walk[k + (d < 6 ? N : -N)])) continue;
        const ng = this.g[k] + (d < 4 ? 1 : 1.414) + Math.abs(this.t.h[nk] - this.t.h[k]) * 0.3;
        if (this.seen[nk] !== gen || ng < this.g[nk]) {
          this.seen[nk] = gen; this.g[nk] = ng; this.f[nk] = ng + H(nk); this.from[nk] = k; push(nk);
        }
      }
    }
    // rebuild path (to goal, or to the closest point reached)
    const cells = [];
    for (let k = best; k !== -1 && cells.length < 4000; k = this.from[k]) { cells.push(k); if (k === s) break; }
    cells.reverse();
    const pts = cells.map((k) => { const i = k % N, j = (k - i) / N; return [-HALF + i * RES, -HALF + j * RES]; });
    if (best === e) pts.push([bx, bz]);
    // smooth: skip points that have a clear line
    const out = [];
    let cur = [ax, az], i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !this.lineOk(cur[0], cur[1], pts[j][0], pts[j][1])) j--;
      out.push(pts[j]); cur = pts[j]; i = j + 1;
    }
    return out.length ? out : null;
  }
}
