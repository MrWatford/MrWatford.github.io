// Aegis Frontier: solid things you can bump into (boxes and upright cylinders), a spatial grid
// to find them quickly, ray casts, and the "stand on it / push out of it" rules for movement.
import { clamp } from "./util.js";
import { WATER_Y } from "./content.js";

const CELL = 16;

export class Colliders {
  constructor(terrain) {
    this.t = terrain;
    this.grid = new Map();
    this.stamp = 1;
    this.count = 0;
    this.all = [];
  }
  key(i, j) { return i * 8192 + j; }
  insert(c) {
    c.cells = [];
    const i0 = Math.floor(c.minX / CELL), i1 = Math.floor(c.maxX / CELL);
    const j0 = Math.floor(c.minZ / CELL), j1 = Math.floor(c.maxZ / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const k = this.key(i, j);
      let a = this.grid.get(k);
      if (!a) this.grid.set(k, (a = []));
      a.push(c); c.cells.push(k);
    }
    this.count++;
    this.all.push(c);
    return c;
  }
  addBox(minX, minY, minZ, maxX, maxY, maxZ, opts = {}) {
    return this.insert({ type: 0, minX, minY, minZ, maxX, maxY, maxZ, active: true, _s: 0, ...opts });
  }
  addCyl(x, z, r, y0, y1, opts = {}) {
    return this.insert({ type: 1, x, z, r, minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r, minY: y0, maxY: y1, active: true, _s: 0, ...opts });
  }
  // Calls fn for every active collider touching the XZ rectangle (each at most once).
  query(minX, minZ, maxX, maxZ, fn) {
    const s = ++this.stamp;
    const i0 = Math.floor(minX / CELL), i1 = Math.floor(maxX / CELL);
    const j0 = Math.floor(minZ / CELL), j1 = Math.floor(maxZ / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = this.grid.get(this.key(i, j));
      if (!a) continue;
      for (const c of a) {
        if (c._s === s || !c.active) continue;
        c._s = s;
        if (c.maxX < minX || c.minX > maxX || c.maxZ < minZ || c.minZ > maxZ) continue;
        if (fn(c) === false) return;
      }
    }
  }

  // Highest surface under a circle footprint at or below yTop (terrain or the top of a box).
  groundAt(x, z, yTop, r = 0.35) {
    let g = this.t.heightAt(x, z);
    const rr = r * 0.7;
    this.query(x - rr, z - rr, x + rr, z + rr, (c) => {
      if (c.noStand || c.maxY > yTop || c.maxY <= g) return;
      if (c.type === 0) {
        if (x + rr < c.minX || x - rr > c.maxX || z + rr < c.minZ || z - rr > c.maxZ) return;
      } else if (Math.hypot(x - c.x, z - c.z) > c.r + rr) return;
      g = c.maxY;
    });
    return g;
  }
  // Lowest ceiling above yFeet over the footprint (Infinity if open sky).
  ceilingAt(x, z, yFeet, r = 0.35) {
    let top = Infinity;
    this.query(x - r, z - r, x + r, z + r, (c) => {
      if (c.minY < yFeet + 0.05 || c.minY >= top) return;
      if (c.type === 0) {
        if (x + r <= c.minX || x - r >= c.maxX || z + r <= c.minZ || z - r >= c.maxZ) return;
      } else if (Math.hypot(x - c.x, z - c.z) >= c.r + r) return;
      top = c.minY;
    });
    return top;
  }

  // Pushes a standing cylinder (feet at p.y, given height) sideways out of any collider whose
  // body overlaps it above the step height. Returns true if something was hit.
  // Hit normals are accumulated into out (if given) so velocity can be cancelled.
  pushOut(p, r, height, stepH, out) {
    let hit = false;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      this.query(p.x - r, p.z - r, p.x + r, p.z + r, (c) => {
        if (c.maxY <= p.y + stepH || c.minY >= p.y + height) return;
        let nx = 0, nz = 0, pen = 0;
        if (c.type === 0) {
          const cx = clamp(p.x, c.minX, c.maxX), cz = clamp(p.z, c.minZ, c.maxZ);
          let dx = p.x - cx, dz = p.z - cz;
          const d = Math.hypot(dx, dz);
          if (d >= r) return;
          if (d > 1e-5) { nx = dx / d; nz = dz / d; pen = r - d; }
          else {
            // center inside the box: leave through the nearest side
            const l = p.x - c.minX, rr = c.maxX - p.x, f = p.z - c.minZ, b = c.maxZ - p.z;
            const m = Math.min(l, rr, f, b);
            if (m === l) { nx = -1; pen = l + r; } else if (m === rr) { nx = 1; pen = rr + r; }
            else if (m === f) { nz = -1; pen = f + r; } else { nz = 1; pen = b + r; }
          }
        } else {
          const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz);
          if (d >= c.r + r) return;
          if (d > 1e-5) { nx = dx / d; nz = dz / d; } else { nx = 1; }
          pen = c.r + r - d;
        }
        p.x += nx * (pen + 0.001); p.z += nz * (pen + 0.001);
        if (out) { out.x += nx; out.z += nz; out.c = c; }
        hit = moved = true;
      });
      if (!moved) break;
    }
    return hit;
  }

  // Is a point inside something solid?
  inside(x, y, z) {
    let hit = false;
    this.query(x, z, x, z, (c) => {
      if (y < c.minY || y > c.maxY) return;
      if (c.type === 0 || Math.hypot(x - c.x, z - c.z) < c.r) { hit = true; return false; }
    });
    return hit || y < this.t.heightAt(x, z) - 0.05;
  }

  // Ray cast against terrain + colliders (+ water if opts.water). d must be normalized.
  // Returns { t, x, y, z, nx, ny, nz, c, terrain, water } or null.
  raycast(ox, oy, oz, dx, dy, dz, maxT, opts = {}) {
    let best = maxT, bc = null, bnx = 0, bny = 0, bnz = 0, terrain = false, water = false;
    // colliders, in 40 m slices along the ray
    const slice = 40;
    for (let t0 = 0; t0 < maxT; t0 += slice) {
      if (t0 > best) break;
      const t1 = Math.min(maxT, t0 + slice);
      const ax = ox + dx * t0, az = oz + dz * t0, bx = ox + dx * t1, bz = oz + dz * t1;
      this.query(Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), (c) => {
        if (opts.skip && opts.skip(c)) return;
        if (c.type === 0) {
          let tmin = 0, tmax = best, nAxis = -1, nSign = 0;
          const o = [ox, oy, oz], d = [dx, dy, dz], mn = [c.minX, c.minY, c.minZ], mx = [c.maxX, c.maxY, c.maxZ];
          for (let a = 0; a < 3; a++) {
            if (Math.abs(d[a]) < 1e-9) { if (o[a] < mn[a] || o[a] > mx[a]) return; continue; }
            let ta = (mn[a] - o[a]) / d[a], tb = (mx[a] - o[a]) / d[a], s = -1;
            if (ta > tb) { const q = ta; ta = tb; tb = q; s = 1; }
            if (ta > tmin) { tmin = ta; nAxis = a; nSign = s; }
            if (tb < tmax) tmax = tb;
            if (tmin > tmax) return;
          }
          if (tmin < best && nAxis >= 0) {
            best = tmin; bc = c; bnx = nAxis === 0 ? nSign : 0; bny = nAxis === 1 ? nSign : 0; bnz = nAxis === 2 ? nSign : 0;
          }
        } else {
          // vertical cylinder: solve in XZ, then check height
          const fx = ox - c.x, fz = oz - c.z;
          const A = dx * dx + dz * dz;
          if (A < 1e-9) return;
          const B = 2 * (fx * dx + fz * dz), C = fx * fx + fz * fz - c.r * c.r;
          const disc = B * B - 4 * A * C;
          if (disc < 0) return;
          const t = (-B - Math.sqrt(disc)) / (2 * A);
          if (t < 0 || t >= best) return;
          const y = oy + dy * t;
          if (y < c.minY || y > c.maxY) return;
          best = t; bc = c; bnx = (fx + dx * t) / c.r; bny = 0; bnz = (fz + dz * t) / c.r;
        }
      });
    }
    // terrain (march then refine)
    const T = this.t;
    if (!(oy > T.maxH + 1 && dy >= 0)) {
      let prevT = 0, step = 1.25;
      let prevAbove = oy - T.heightAt(ox, oz);
      if (prevAbove < 0) return { t: 0, x: ox, y: oy, z: oz, nx: 0, ny: 1, nz: 0, c: null, terrain: true, water: false };
      for (let t = step; t <= best + step; t += step) {
        const tt = Math.min(t, best);
        const x = ox + dx * tt, y = oy + dy * tt, z = oz + dz * tt;
        if (y > T.maxH + 1 && dy >= 0) break;
        const above = y - T.heightAt(x, z);
        if (above < 0) {
          let lo = prevT, hi = tt;
          for (let k = 0; k < 8; k++) {
            const m = (lo + hi) / 2;
            if (oy + dy * m - T.heightAt(ox + dx * m, oz + dz * m) < 0) hi = m; else lo = m;
          }
          if (hi < best) { best = hi; bc = null; terrain = true; const n = T.normalAt(ox + dx * hi, oz + dz * hi, { x: 0, y: 0, z: 0 }); bnx = n.x; bny = n.y; bnz = n.z; }
          break;
        }
        prevT = tt;
        if (tt >= best) break;
      }
    }
    if (opts.water && dy < 0 && oy > WATER_Y) {
      const tw = (WATER_Y - oy) / dy;
      if (tw < best) {
        const wx = ox + dx * tw, wz = oz + dz * tw;
        if (T.heightAt(wx, wz) < WATER_Y) { best = tw; bc = null; terrain = false; water = true; bnx = 0; bny = 1; bnz = 0; }
      }
    }
    if (best >= maxT) return null;
    return { t: best, x: ox + dx * best, y: oy + dy * best, z: oz + dz * best, nx: bnx, ny: bny, nz: bnz, c: bc, terrain, water };
  }

  // Clear line between two points? (used for sight lines)
  clearLine(ax, ay, az, bx, by, bz, opts) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz);
    if (L < 1e-4) return true;
    return !this.raycast(ax, ay, az, dx / L, dy / L, dz / L, L - 0.05, opts);
  }
}
