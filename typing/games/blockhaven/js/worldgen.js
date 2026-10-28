// Builds the natural world from a seed. The same seed always makes the same land.
import { Noise, hashSeed, rng, hash3 } from "./noise.js";
import { B, CHUNK, HEIGHT, SEA, make, EYE_IN } from "./blocks.js";

export const LOOT = 4;   // chest meta bit: a ruin chest that fills with treasure when first opened
// Land versions: 1 = first release, 2 = deep lava, 3 = ruined portals, 4 = strongholds. Raise this when generation changes.
export const CURRENT_GEN = 4;
// Three strongholds per world, a few hundred blocks from the middle (the Eye of the Void points to the nearest)
export function strongholdSpots(seed) {
  const r = rng(seed ^ 0x51ed27), base = r() * Math.PI * 2;
  return [0, 1, 2].map(k => { const a = base + k * Math.PI * 2 / 3, d = 260 + r() * 200; return { x: Math.round(Math.cos(a) * d), y: 22, z: Math.round(Math.sin(a) * d) }; });
}
// The 12 portal-frame spots around a stronghold's 3×3 portal
export function frameSpots(s) {
  const out = [];
  for (let d = -1; d <= 1; d++) out.push([s.x + d, s.y, s.z - 2], [s.x + d, s.y, s.z + 2], [s.x - 2, s.y, s.z + d], [s.x + 2, s.y, s.z + d]);
  return out;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;

export class Generator {
  // version: worlds made before an update keep the old land shapes in places the player changed
  constructor(seedText, version = CURRENT_GEN) {
    this.version = version;
    this.seed = hashSeed(seedText);
    this.n = new Noise(this.seed);
    this.c = new Noise(this.seed ^ 0x5bd1e995);   // caves
    this.strongholds = strongholdSpots(this.seed);
  }

  // Ground height and land type for one column of the world
  column(x, z) {
    const n = this.n;
    const cont = n.fbm2(x / 260, z / 260, 3);
    const hills = n.fbm2(x / 70 + 100, z / 70, 3);
    const mm = smooth(0.12, 0.55, n.n2(x / 420 + 50, z / 420 - 30));
    const rid = 1 - Math.abs(n.fbm2(x / 110 - 200, z / 110 + 70, 4));
    let h = 33 + cont * 8 + hills * 6 * (1 - mm * 0.5) + mm * (rid * rid * 36 + 5);
    const river = Math.abs(n.fbm2(x / 320 + 400, z / 320 - 400, 3));
    if (river < 0.055 && mm < 0.7) h = h + (SEA - 3 - h) * smooth(0, 1, 1 - river / 0.055) * (1 - mm);
    h = Math.max(4, Math.min(HEIGHT - 8, Math.floor(h)));
    const temp = n.n2(x / 350 + 900, z / 350), moist = n.n2(x / 300 - 700, z / 300 + 300);
    let biome = "plains";
    if (h >= SEA + 36) biome = "peak";
    else if (h > SEA + 24 && mm > 0.4) biome = "mountain";
    else if (temp > 0.3 && moist < -0.05) biome = "sandy";
    else if (moist > 0.12) biome = temp < -0.15 ? "birch" : "forest";
    return { h, biome, mm };
  }

  // opts.version lets old worlds use new features only in places the player never changed
  generate(cx, cz, opts = {}) {
    const ver = opts.version || this.version;
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK, cols = [];
    const r = rng(this.seed ^ Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663));
    // cave noise on a coarse 4-block grid, blended in between (much faster, same shapes on both sides of a chunk edge)
    const GY = HEIGHT / 4 + 1, grid = [new Float32Array(25 * GY), new Float32Array(25 * GY), new Float32Array(25 * GY)];
    for (let gz = 0; gz < 5; gz++) for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < GY; gy++) {
      const wx = x0 + gx * 4, wz = z0 + gz * 4, y = gy * 4, k = gx + gz * 5 + gy * 25;
      grid[0][k] = this.c.n3(wx / 42, y / 26, wz / 42);
      grid[1][k] = this.c.n3(wx / 42 + 61, y / 26, wz / 42 - 17);
      grid[2][k] = y < 40 ? this.c.n3(wx / 64 - 90, y / 30, wz / 64 + 40) : -1;
    }
    const cave = (g, lx, y, lz) => {
      const fx = lx / 4, fy = y / 4, fz = lz / 4, ix = Math.min(3, Math.floor(fx)), iy = Math.min(GY - 2, Math.floor(fy)), iz = Math.min(3, Math.floor(fz));
      const tx = fx - ix, ty = fy - iy, tz = fz - iz, a = grid[g];
      const at = (i, j, k) => a[(ix + i) + (iz + k) * 5 + (iy + j) * 25];
      const l = (p, q, t) => p + (q - p) * t;
      return l(l(l(at(0, 0, 0), at(1, 0, 0), tx), l(at(0, 0, 1), at(1, 0, 1), tx), tz), l(l(at(0, 1, 0), at(1, 1, 0), tx), l(at(0, 1, 1), at(1, 1, 1), tx), tz), ty);
    };
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = x0 + lx, wz = z0 + lz, col = this.column(wx, wz), h = col.h;
      cols[lx + lz * CHUNK] = col;
      const patch = this.n.n2(wx / 9 + 33, wz / 9 - 71);
      let top = B.GRASS, under = B.DIRT, depth = 3;
      if (col.biome === "peak") { top = B.SNOW; under = B.STONE; }
      else if (col.biome === "mountain") { top = patch > 0.25 ? B.GRASS : B.STONE; under = top === B.STONE ? B.STONE : B.DIRT; }
      else if (col.biome === "sandy") { top = B.SAND; under = B.SAND; depth = 4; }
      if (h <= SEA + 1 && h >= SEA - 3) { top = patch > 0.45 ? B.GRAVEL : B.SAND; under = top; }
      if (h < SEA - 3) { top = patch > 0.5 ? B.CLAY : patch < -0.4 ? B.GRAVEL : B.SAND; under = B.SAND; }
      for (let y = 0; y <= Math.max(h, SEA); y++) {
        let v;
        if (y === 0 || (y <= 2 && hash3(this.seed, wx, y, wz) < 0.5)) v = B.BEDROCK;
        else if (y < h - depth) v = B.STONE;
        else if (y < h) v = under === B.SAND && col.biome === "sandy" && y < h - 2 ? B.SANDSTONE : under;
        else if (y === h) v = top;
        else v = B.WATER;   // y between ground and sea level
        data[idx(lx, y, lz)] = v;
      }
      // caves (kept away from the sea floor so oceans don't drain into them)
      const roof = h < SEA + 2 ? h - 6 : h - 1;
      for (let y = 3; y < roof; y++) {
        let carve = Math.abs(cave(0, lx, y, lz)) < 0.085 && Math.abs(cave(1, lx, y, lz)) < 0.085;
        if (!carve && y < 34) carve = cave(2, lx, y, lz) > 0.6;
        if (carve) data[idx(lx, y, lz)] = ver >= 2 && y <= 9 ? B.LAVA : B.AIR;
      }
      // a grassy cave roof would leave floating grass: fix the top block if what's under it was carved
      if (data[idx(lx, h, lz)] === B.GRASS && data[idx(lx, h - 1, lz)] === B.AIR) data[idx(lx, h, lz)] = B.DIRT;
    }

    // ore veins
    const vein = (id, tries, minY, maxY, size, inside = B.STONE) => {
      for (let t = 0; t < tries; t++) {
        let x = Math.floor(r() * 16), y = minY + Math.floor(r() * (maxY - minY)), z = Math.floor(r() * 16);
        const n = 1 + Math.floor(r() * size);
        for (let k = 0; k < n; k++) {
          if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT && data[idx(x, y, z)] === inside) data[idx(x, y, z)] = id;
          const d = Math.floor(r() * 6); x += [1, -1, 0, 0, 0, 0][d]; y += [0, 0, 1, -1, 0, 0][d]; z += [0, 0, 0, 0, 1, -1][d];
        }
      }
    };
    vein(B.COAL_ORE, 18, 6, 64, 8);
    vein(B.IRON_ORE, 11, 4, 46, 6);
    vein(B.SKY_ORE, 2, 3, 18, 4);
    vein(B.GRAVEL, 4, 6, 50, 10);
    vein(B.DIRT, 4, 6, 50, 10);

    // trees and plants
    const center = cols[8 + 8 * CHUNK];
    const treeTries = { forest: 9, birch: 8, plains: r() < 0.45 ? 1 : 0, mountain: r() < 0.5 ? 1 : 0, peak: 0, sandy: 0 }[center.biome];
    for (let t = 0; t < treeTries; t++) {
      const lx = 2 + Math.floor(r() * 12), lz = 2 + Math.floor(r() * 12), col = cols[lx + lz * CHUNK];
      if (data[idx(lx, col.h, lz)] !== B.GRASS || col.h + 9 >= HEIGHT) continue;
      const birch = col.biome === "birch" || (col.biome === "forest" && r() < 0.2);
      this.tree(data, lx, col.h + 1, lz, birch, r);
    }
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = cols[lx + lz * CHUNK], y = col.h + 1;
      if (y >= HEIGHT || data[idx(lx, col.h, lz)] !== B.GRASS || data[idx(lx, y, lz)] !== B.AIR) continue;
      const p = hash3(this.seed, x0 + lx, 7, z0 + lz);
      const grassChance = col.biome === "plains" ? 0.16 : 0.07;
      if (p < 0.012) data[idx(lx, y, lz)] = B.FLOWER_RED;
      else if (p < 0.024) data[idx(lx, y, lz)] = B.FLOWER_YELLOW;
      else if (p < 0.024 + grassChance) data[idx(lx, y, lz)] = B.TALL_GRASS;
    }

    // a rare landmark: a crumbling watchtower with a treasure chest
    if (hash3(this.seed, cx, 99, cz) < 0.035) this.ruin(data, cols, r);
    else if (ver >= 3 && hash3(this.seed, cx, 77, cz) < 0.02) this.ruinedPortal(data, cols, r);
    if (ver >= 4) for (const s of this.strongholds) if (Math.abs(s.x - x0 - 8) < 72 && Math.abs(s.z - z0 - 8) < 72) this.stronghold(data, x0, z0, s);
    return data;
  }

  // An underground fort of stone bricks: a portal room with four halls leading to treasure rooms
  stronghold(data, x0, z0, s) {
    const SY = s.y, L = 30, boxes = [[s.x - 7, SY - 1, s.z - 8, s.x + 7, SY + 7, s.z + 8]], chests = [];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = 7, b = 7 + L, ex = s.x + dx * (b + 3), ez = s.z + dz * (b + 3);
      if (dx) boxes.push([Math.min(s.x + dx * a, s.x + dx * b), SY - 1, s.z - 2, Math.max(s.x + dx * a, s.x + dx * b), SY + 4, s.z + 2]);
      else boxes.push([s.x - 2, SY - 1, Math.min(s.z + dz * a, s.z + dz * b), s.x + 2, SY + 4, Math.max(s.z + dz * a, s.z + dz * b)]);
      boxes.push([ex - 3, SY - 1, ez - 3, ex + 3, SY + 5, ez + 3]);
      chests.push([ex, SY, ez]);
    }
    const put = (x, y, z, v) => { const lx = x - x0, lz = z - z0; if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16 && y > 0 && y < HEIGHT) data[idx(lx, y, lz)] = v; };
    const inChunk = bx => bx[3] >= x0 && bx[0] < x0 + 16 && bx[5] >= z0 && bx[2] < z0 + 16;
    for (const pass of [0, 1]) for (const bx of boxes) {
      if (!inChunk(bx)) continue;
      for (let x = Math.max(bx[0], x0); x <= Math.min(bx[3], x0 + 15); x++) for (let z = Math.max(bx[2], z0); z <= Math.min(bx[5], z0 + 15); z++) for (let y = bx[1]; y <= bx[4]; y++) {
        const edge = x === bx[0] || x === bx[3] || y === bx[1] || y === bx[4] || z === bx[2] || z === bx[5];
        if (pass === 0 && edge) put(x, y, z, hash3(this.seed, x, y, z) < 0.2 ? B.MOSSY : B.STONE_BRICKS);
        if (pass === 1 && !edge) put(x, y, z, B.AIR);
      }
    }
    // the portal: a ring of 12 frames around a 3×3 hole, a few already holding eyes, on a raised dais
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) put(s.x + dx, SY - 1, s.z + dz, B.STONE_BRICKS);
    for (const [x, y, z] of frameSpots(s)) put(x, y, z, make(B.END_FRAME, hash3(this.seed, x, 31, z) < 0.1 ? EYE_IN : 0));
    put(s.x, SY + 6, s.z + 7, B.TORCH); put(s.x, SY + 6, s.z - 7, B.TORCH);
    for (const [x, y, z] of chests) { put(x, y, z, make(B.CHEST, LOOT)); put(x + 2, y, z + 2, B.TORCH); }
  }

  // A broken obsidian portal frame with some Ember Depths blocks around it and a chest
  ruinedPortal(data, cols, r) {
    const cx = 6, cz = 6, col = cols[cx + cz * CHUNK];
    if (col.h <= SEA || col.h + 8 >= HEIGHT || col.biome === "peak") return;
    const y0 = col.h;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 4; dx++) {
      if (r() < 0.55) data[idx(cx + dx, y0, cz + dz)] = r() < 0.15 ? B.MAGMA : B.EMBERRACK;
      for (let y = y0 + 1; y < y0 + 7; y++) if (data[idx(cx + dx, y, cz + dz)] !== B.AIR && data[idx(cx + dx, y, cz + dz)] !== B.WATER) data[idx(cx + dx, y, cz + dz)] = B.AIR;
    }
    // frame along x: 4 wide, 5 tall; some pieces missing
    for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 5; dy++) {
      const edge = dx === 0 || dx === 3 || dy === 0 || dy === 4;
      if (!edge) continue;
      if (r() < 0.3) { if (r() < 0.5) data[idx(cx + dx + 1, y0, cz + 2)] = B.OBSIDIAN; continue; }   // fallen piece
      data[idx(cx + dx, y0 + 1 + dy, cz)] = B.OBSIDIAN;
    }
    data[idx(cx - 2, y0 + 1, cz + 2)] = make(B.CHEST, LOOT | 2);
  }

  tree(data, x, y, z, birch, r) {
    const log = birch ? B.BIRCH_LOG : B.LOG, leaf = birch ? B.BIRCH_LEAVES : B.LEAVES;
    const hgt = (birch ? 5 : 4) + Math.floor(r() * 3), top = y + hgt;
    for (let ly = top - 3; ly <= top; ly++) {
      const rad = ly >= top - 1 ? 1 : 2;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad && (ly === top || r() < 0.5)) continue;
        const i = idx(x + dx, ly, z + dz);
        if (data[i] === B.AIR || data[i] === B.TALL_GRASS) data[i] = leaf;
      }
    }
    for (let ly = y; ly < top; ly++) data[idx(x, ly, z)] = log;
    data[idx(x, y - 1, z)] = B.DIRT;
  }

  ruin(data, cols, r) {
    const cx = 5 + Math.floor(r() * 6), cz = 5 + Math.floor(r() * 6), col = cols[cx + cz * CHUNK];
    if (col.h <= SEA + 1 || col.h + 9 >= HEIGHT || col.biome === "peak") return;
    const base = col.h;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      for (let y = base - 2; y <= base; y++) data[idx(cx + dx, y, cz + dz)] = r() < 0.5 ? B.MOSSY : B.COBBLE;     // floor
      const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2;
      const height = wall ? 2 + Math.floor(r() * 5) : 0;
      for (let y = base + 1; y <= base + 6; y++) data[idx(cx + dx, y, cz + dz)] = y <= base + height ? (r() < 0.45 ? B.MOSSY : B.STONE_BRICKS) : B.AIR;
    }
    data[idx(cx + 2, base + 1, cz)] = B.AIR; data[idx(cx + 2, base + 2, cz)] = B.AIR;   // doorway
    data[idx(cx, base + 1, cz)] = make(B.CHEST, LOOT | 3);
    data[idx(cx - 1, base + 1, cz - 1)] = B.TORCH;
  }

  isNether() { return false; }
  // A good starting spot: dry land near trees, close to the middle of the world
  findSpawn() {
    for (let ring = 0; ring < 60; ring++) {
      for (let i = 0; i < 8 * Math.max(1, ring); i++) {
        const a = (i / (8 * Math.max(1, ring))) * Math.PI * 2, x = Math.round(Math.cos(a) * ring * 8), z = Math.round(Math.sin(a) * ring * 8);
        const col = this.column(x, z);
        if (col.h > SEA + 1 && col.h < SEA + 18 && (col.biome === "forest" || col.biome === "birch" || (ring > 30 && col.biome === "plains"))) return { x: x + 0.5, z: z + 0.5 };
      }
    }
    return { x: 0.5, z: 0.5 };
  }
}

// ---------- the Ember Depths: a closed underworld of caverns, lava seas, fungus forests, and fortresses ----------
export const LAVA_LEVEL = 22;
export class NetherGen {
  constructor(seedText) {
    this.version = CURRENT_GEN;
    this.seed = (hashSeed(seedText) ^ 0x2545f491) >>> 0;
    this.n = new Noise(this.seed);
    this.c = new Noise(this.seed ^ 0x68e31da4);
  }
  isNether() { return true; }
  biome(x, z) {
    const a = this.n.n2(x / 150, z / 150), b = this.n.n2(x / 150 + 300, z / 150 - 200);
    if (a > 0.35) return "crimson";
    if (a < -0.35) return "warped";
    if (b > 0.3) return "soul";
    if (b < -0.35) return "basalt";
    return "wastes";
  }
  column(x, z) { return { h: 40, biome: this.biome(x, z) }; }
  findSpawn() { return { x: 0.5, z: 0.5 }; }
  // Is this chunk part of a fortress or bastion? (same answer every time for the same seed)
  fortress(cx, cz) { const rx = Math.floor(cx / 4), rz = Math.floor(cz / 4); return hash3(this.seed, rx, 555, rz) < 0.3 ? { y: 34 + Math.floor(hash3(this.seed, rx, 556, rz) * 10) } : null; }
  bastion(cx, cz) {
    if (cx % 5 !== 2 && cx % 5 !== -3) return null;
    if (cz % 5 !== 2 && cz % 5 !== -3) return null;
    if (this.fortress(cx, cz)) return null;
    return hash3(this.seed, Math.floor(cx / 5), 777, Math.floor(cz / 5)) < 0.22 ? { y: 30 + Math.floor(hash3(this.seed, cx, 778, cz) * 8) } : null;
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const r = rng(this.seed ^ Math.imul(cx, 83492791) ^ Math.imul(cz, 297121507));
    // cavern shapes on a coarse grid, blended in between
    const GY = HEIGHT / 4 + 1, grid = new Float32Array(25 * GY);
    for (let gz = 0; gz < 5; gz++) for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < GY; gy++) {
      const wx = x0 + gx * 4, wz = z0 + gz * 4, y = gy * 4;
      grid[gx + gz * 5 + gy * 25] = this.c.n3(wx / 48, y / 30, wz / 48) + 0.5 * this.c.n3(wx / 18 + 40, y / 14, wz / 18 - 40);
    }
    const dens = (lx, y, lz) => {
      const fx = lx / 4, fy = y / 4, fz = lz / 4, ix = Math.min(3, Math.floor(fx)), iy = Math.min(GY - 2, Math.floor(fy)), iz = Math.min(3, Math.floor(fz));
      const tx = fx - ix, ty = fy - iy, tz = fz - iz, at = (i, j, k) => grid[(ix + i) + (iz + k) * 5 + (iy + j) * 25], l = (p, q, t) => p + (q - p) * t;
      return l(l(l(at(0, 0, 0), at(1, 0, 0), tx), l(at(0, 0, 1), at(1, 0, 1), tx), tz), l(l(at(0, 1, 0), at(1, 1, 0), tx), l(at(0, 1, 1), at(1, 1, 1), tx), tz), ty);
    };
    const biomes = [];
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = x0 + lx, wz = z0 + lz, biome = this.biome(wx, wz);
      biomes[lx + lz * CHUNK] = biome;
      for (let y = 0; y < HEIGHT; y++) {
        let v;
        if (y === 0 || y === HEIGHT - 1 || (y <= 2 && hash3(this.seed, wx, y, wz) < 0.5) || (y >= HEIGHT - 3 && hash3(this.seed, wx, y, wz) < 0.5)) v = B.BEDROCK;
        else {
          const bias = y < 16 ? (16 - y) / 16 * 1.2 : y > 60 ? (y - 60) / 19 * 1.5 : 0;
          if (dens(lx, y, lz) + bias > 0.12) {
            v = B.EMBERRACK;
            if (biome === "basalt") v = hash3(this.seed, wx, y, wz) < 0.7 ? B.BASALT : B.BLACKSTONE;
          } else v = y <= LAVA_LEVEL ? B.LAVA : B.AIR;
        }
        data[idx(lx, y, lz)] = v;
      }
      // dress the floors: moss, wailing sand, magma near the lava sea, the odd fire
      for (let y = 1; y < HEIGHT - 2; y++) {
        const i = idx(lx, y, lz), v = data[i];
        if (v === B.AIR || v === B.LAVA || v === B.BEDROCK || data[i + CHUNK * CHUNK] !== B.AIR) continue;
        if (biome === "crimson") data[i] = B.CRIMSON_NYLIUM;
        else if (biome === "warped") data[i] = B.WARPED_NYLIUM;
        else if (biome === "soul") { data[i] = B.SOUL_SAND; if (data[i - CHUNK * CHUNK] === B.EMBERRACK) data[i - CHUNK * CHUNK] = B.SOUL_SAND; }
        else if (biome === "basalt" && y <= LAVA_LEVEL + 3 && r() < 0.3) data[i] = B.MAGMA;
        else if (biome === "wastes") {
          if (y <= LAVA_LEVEL + 2 && r() < 0.25) data[i] = B.MAGMA;
          else if (r() < 0.015) data[i + CHUNK * CHUNK] = B.FIRE;
        }
      }
    }
    // ores
    const vein = (id, tries, minY, maxY, size) => {
      for (let t = 0; t < tries; t++) {
        let x = Math.floor(r() * 16), y = minY + Math.floor(r() * (maxY - minY)), z = Math.floor(r() * 16);
        const n = 1 + Math.floor(r() * size);
        for (let k = 0; k < n; k++) {
          if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT && data[idx(x, y, z)] === B.EMBERRACK) data[idx(x, y, z)] = id;
          const d = Math.floor(r() * 6); x += [1, -1, 0, 0, 0, 0][d]; y += [0, 0, 1, -1, 0, 0][d]; z += [0, 0, 0, 0, 1, -1][d];
        }
      }
    };
    vein(B.QUARTZ_ORE, 14, 8, 72, 8);
    vein(B.NETHER_GOLD_ORE, 9, 8, 72, 6);
    if (r() < 0.6) {   // ancient scrap: rare and deep, often hidden inside rock
      const x = Math.floor(r() * 16), y = 8 + Math.floor(r() * 14), z = Math.floor(r() * 16);
      if (data[idx(x, y, z)] !== B.BEDROCK && data[idx(x, y, z)] !== B.LAVA) data[idx(x, y, z)] = B.ANCIENT_SCRAP;
    }
    // shinestone hanging from ceilings
    for (let t = 0; t < 3; t++) {
      const x = 2 + Math.floor(r() * 12), z = 2 + Math.floor(r() * 12);
      for (let y = HEIGHT - 4; y > 40; y--) {
        if (data[idx(x, y, z)] !== B.AIR && data[idx(x, y - 1, z)] === B.AIR) {
          let px = x, py = y - 1, pz = z;
          for (let k = 0; k < 6 + Math.floor(r() * 10); k++) {
            if (px > 0 && px < 15 && pz > 0 && pz < 15 && py > 30 && data[idx(px, py, pz)] === B.AIR) data[idx(px, py, pz)] = B.SHINESTONE;
            const d = Math.floor(r() * 5); px += [1, -1, 0, 0, 0][d]; pz += [0, 0, 1, -1, 0][d]; py -= d === 4 ? 1 : 0;
          }
          break;
        }
      }
    }
    // giant fungi in the crimson and warped forests
    for (let t = 0; t < 8; t++) {
      const lx = 2 + Math.floor(r() * 12), lz = 2 + Math.floor(r() * 12), biome = biomes[lx + lz * CHUNK];
      if (biome !== "crimson" && biome !== "warped") continue;
      const moss = biome === "crimson" ? B.CRIMSON_NYLIUM : B.WARPED_NYLIUM;
      for (let y = LAVA_LEVEL + 1; y < HEIGHT - 12; y++) {
        if (data[idx(lx, y, lz)] !== moss || data[idx(lx, y + 1, lz)] !== B.AIR) continue;
        const stem = biome === "crimson" ? B.CRIMSON_STEM : B.WARPED_STEM, cap = biome === "crimson" ? B.CRIMSON_WART : B.WARPED_WART, hgt = 4 + Math.floor(r() * 4);
        let room = true; for (let k = 1; k <= hgt + 2; k++) if (data[idx(lx, y + k, lz)] !== B.AIR) room = false;
        if (!room) continue;
        for (let k = 1; k <= hgt; k++) data[idx(lx, y + k, lz)] = stem;
        for (let ly = y + hgt - 1; ly <= y + hgt + 1; ly++) {
          const rad = ly === y + hgt + 1 ? 1 : 2;
          for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
            const i = idx(lx + dx, ly, lz + dz);
            if (data[i] !== B.AIR) continue;
            if (ly < y + hgt + 1 && Math.abs(dx) < rad && Math.abs(dz) < rad) continue;   // hollow under the cap
            data[i] = r() < 0.08 ? B.SHROOMLIGHT : cap;
          }
        }
        break;
      }
    }
    // a lavafall now and then
    if (r() < 0.15) {
      const x = 1 + Math.floor(r() * 14), z = 1 + Math.floor(r() * 14);
      for (let y = 60; y > 30; y--) {
        if (data[idx(x, y, z)] !== B.AIR && data[idx(x, y - 1, z)] === B.AIR) {
          for (let yy = y; yy > LAVA_LEVEL && (yy === y || data[idx(x, yy, z)] === B.AIR); yy--) data[idx(x, yy, z)] = B.LAVA;
          break;
        }
      }
    }
    this.fortressPiece(data, cx, cz, r);
    this.bastionPiece(data, cx, cz, r);
    return data;
  }

  // Ember Brick corridors that cross a 4×4-chunk area, with a garden room where they meet
  fortressPiece(data, cx, cz, r) {
    const f = this.fortress(cx, cz);
    if (!f) return;
    const m = (v, k) => ((v % k) + k) % k;
    const alongZ = m(cx, 4) === 1, alongX = m(cz, 4) === 2, fy = f.y;
    if (!alongZ && !alongX) return;
    const put = (x, y, z, v) => { if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT - 1) data[idx(x, y, z)] = v; };
    const corridor = (axis) => {
      for (let a = 0; a < 16; a++) for (let b = 5; b <= 10; b++) {
        const [x, z] = axis === "z" ? [b, a] : [a, b];
        const wall = b === 5 || b === 10;
        put(x, fy, z, B.EMBER_BRICKS);
        for (let y = fy + 1; y <= fy + 4; y++) put(x, y, z, wall ? (y === fy + 2 && a % 4 === 1 ? B.AIR : B.EMBER_BRICKS) : B.AIR);
        put(x, fy + 5, z, B.EMBER_BRICKS);
        if (wall && a % 8 === 3) for (let y = fy - 1; y > 1 && (data[idx(x, y, z)] === B.AIR || data[idx(x, y, z)] === B.LAVA); y--) put(x, y, z, B.EMBER_BRICKS);   // support pillars
      }
    };
    if (alongZ) corridor("z");
    if (alongX) corridor("x");
    if (alongZ && alongX) {   // a room with a wart garden and a chest
      for (let x = 3; x <= 12; x++) for (let z = 3; z <= 12; z++) {
        const wall = x === 3 || x === 12 || z === 3 || z === 12;
        put(x, fy, z, B.EMBER_BRICKS);
        for (let y = fy + 1; y <= fy + 5; y++) put(x, y, z, wall && !(x >= 6 && x <= 9) && !(z >= 6 && z <= 9) ? B.EMBER_BRICKS : B.AIR);
        put(x, fy + 6, z, B.EMBER_BRICKS);
      }
      for (const [x, z] of [[5, 5], [6, 5], [5, 6], [6, 6], [9, 9], [10, 9], [9, 10], [10, 10]]) { put(x, fy, z, B.SOUL_SAND); put(x, fy + 1, z, make(B.EMBER_WART, Math.floor(r() * 8))); }
      put(10, fy + 1, 5, make(B.CHEST, LOOT | 3));
    }
  }

  // A crumbling blackstone stronghold of the Boarkin, with gold and treasure
  bastionPiece(data, cx, cz, r) {
    const b = this.bastion(cx, cz);
    if (!b) return;
    const by = b.y, put = (x, y, z, v) => { if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT - 1) data[idx(x, y, z)] = v; };
    for (let x = 1; x <= 14; x++) for (let z = 1; z <= 14; z++) {
      const wall = x === 1 || x === 14 || z === 1 || z === 14;
      put(x, by, z, B.BLACKSTONE_BRICKS);
      for (let y = by + 1; y <= by + 7; y++) put(x, y, z, wall && r() > 0.12 && !(x >= 7 && x <= 8 && y <= by + 3) ? B.BLACKSTONE_BRICKS : B.AIR);
      if ((x === 1 || x === 14) && (z === 1 || z === 14)) for (let y = by - 1; y > 1 && (data[idx(x, y, z)] === B.AIR || data[idx(x, y, z)] === B.LAVA); y--) put(x, y, z, B.BLACKSTONE);
    }
    for (let x = 4; x <= 11; x++) for (let z = 4; z <= 11; z++) if (x === 4 || x === 11 || z === 4 || z === 11) put(x, by + 4, z, B.BLACKSTONE_BRICKS);   // inner balcony
    for (let i = 0; i < 4; i++) put(3 + Math.floor(r() * 10), by + 1, 3 + Math.floor(r() * 10), B.GOLD_BLOCK);
    put(6, by + 1, 6, make(B.CHEST, LOOT | 0)); put(9, by + 5, 9, make(B.CHEST, LOOT | 2));
  }
}

// ---------- the Hollow: floating pale islands over an endless void ----------
export const END_TOP = 48;
export class EndGen {
  constructor(seedText) {
    this.version = CURRENT_GEN;
    this.seed = (hashSeed(seedText) ^ 0x7f4a7c15) >>> 0;
    this.n = new Noise(this.seed);
    // ten obsidian pillars ring the central island; each holds a healing crystal
    this.pillars = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return { i, x: Math.round(Math.cos(a) * 30), z: Math.round(Math.sin(a) * 30), r: 2 + (i % 3), top: 58 + (i * 7) % 16 }; });
  }
  isNether() { return false; }
  isEnd() { return true; }
  biome() { return "hollow"; }
  column() { return { h: END_TOP, biome: "hollow" }; }
  findSpawn() { return { x: 100.5, z: 0.5 }; }
  // top and bottom of the land in a column (or null for open void)
  land(x, z) {
    const d = Math.hypot(x, z);
    if (d < 58) {
      const top = END_TOP + Math.round(this.n.n2(x / 22, z / 22) * 2);
      return { top, bottom: top - Math.round(3 + (58 - d) * 0.32 + this.n.n2(x / 9, z / 9) * 2), outer: false };
    }
    if (d > 380) {
      const v = this.n.fbm2(x / 120, z / 120, 3) - Math.max(0, (420 - d) / 40) * 0.5;
      if (v > 0.2) { const top = 46 + Math.round(this.n.n2(x / 50, z / 50) * 5); return { top, bottom: top - Math.round((v - 0.2) * 45 + 2), outer: true }; }
    }
    return null;
  }
  // a Hollow tower stands in some 5×5-chunk areas far from the middle
  city(cx, cz) {
    const m = (v, k) => ((v % k) + k) % k;
    if (m(cx, 5) !== 2 || m(cz, 5) !== 2) return null;
    const x = cx * 16 + 8, z = cz * 16 + 8;
    if (Math.hypot(x, z) < 420 || hash3(this.seed, Math.floor(cx / 5), 901, Math.floor(cz / 5)) > 0.45) return null;
    const l = this.land(x, z);
    return l ? { x, z, y: l.top + 1 } : null;
  }
  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT), x0 = cx * CHUNK, z0 = cz * CHUNK;
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const x = x0 + lx, z = z0 + lz, l = this.land(x, z);
      if (l) for (let y = Math.max(1, l.bottom); y <= l.top; y++) data[idx(lx, y, lz)] = B.HOLLOWSTONE;
      if (l && l.outer && hash3(this.seed, x, 5, z) < 0.006) {   // chorus plants
        const h = 2 + Math.floor(hash3(this.seed, x, 6, z) * 4);
        for (let k = 1; k <= h && l.top + k < HEIGHT - 1; k++) data[idx(lx, l.top + k, lz)] = k === h ? B.CHORUS_FLOWER : B.CHORUS_PLANT;
      }
      for (const p of this.pillars) {
        if ((x - p.x) ** 2 + (z - p.z) ** 2 > p.r * p.r) continue;
        for (let y = END_TOP - 8; y <= p.top; y++) data[idx(lx, y, lz)] = B.OBSIDIAN;
      }
    }
    const c = this.city(cx, cz);
    if (c) this.tower(data, c);
    return data;
  }
  tower(data, c) {
    const base = c.y, top = Math.min(HEIGHT - 3, base + 24), put = (lx, y, lz, v) => { if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16 && y > 0 && y < HEIGHT) data[idx(lx, y, lz)] = v; };
    for (let lx = 3; lx <= 12; lx++) for (let lz = 3; lz <= 12; lz++) {
      const wall = lx === 3 || lx === 12 || lz === 3 || lz === 12, corner = (lx === 3 || lx === 12) && (lz === 3 || lz === 12);
      for (let y = base - 1; y <= top; y++) {
        const floor = (y - base + 1) % 6 === 0 || y === base - 1 || y === top;
        if (corner) put(lx, y, lz, B.VIOLET_PILLAR);
        else if (wall) put(lx, y, lz, (y - base) % 6 === 2 && (lx === 7 || lx === 8 || lz === 7 || lz === 8) ? B.AIR : B.VIOLET_BRICKS);
        else put(lx, y, lz, floor && !(lx >= 7 && lx <= 8 && lz >= 7 && lz <= 8 && y !== top && y !== base - 1) ? B.VIOLET_BRICKS : B.AIR);
      }
    }
    for (let y = base; y < top; y++) put(7, y, 7, B.VIOLET_PILLAR);   // a column in the stairwell to climb beside
    put(5, top - 5, 5, make(B.CHEST, LOOT | 1)); put(10, base + 5, 10, make(B.CHEST, LOOT | 3));
    put(3, base, 7, B.AIR); put(3, base + 1, 7, B.AIR);   // doorway
  }
}
