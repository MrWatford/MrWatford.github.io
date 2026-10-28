// Builds the natural world from a seed. The same seed always makes the same land.
import { Noise, hashSeed, rng, hash3 } from "./noise.js";
import { B, CHUNK, HEIGHT, SEA, make } from "./blocks.js";

export const LOOT = 4;   // chest meta bit: a ruin chest that fills with treasure when first opened
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;

export class Generator {
  constructor(seedText) {
    this.seed = hashSeed(seedText);
    this.n = new Noise(this.seed);
    this.c = new Noise(this.seed ^ 0x5bd1e995);   // caves
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

  generate(cx, cz) {
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
        if (carve) data[idx(lx, y, lz)] = B.AIR;
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
    return data;
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
