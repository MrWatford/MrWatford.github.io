import { B, CHUNK, HEIGHT, SEA, make } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

export const TYRANT_CANYON = "tyrant_canyon";
export const CANYON_LAYOUT = 1;
export const CANYON_ARRIVAL = { x: 0, z: -5, yaw: Math.PI };
export const TRACKS = Object.freeze({ x: -2, y: 35, z: 4 });
export const EXPEDITION_BEACON = Object.freeze({ x: 14, y: 35, z: 36 });
export const REX_HOME = Object.freeze([0.5, 35, 23.5]);

const floor = SEA + 4;
const inside = (x, z, x0, x1, z0, z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const approach = (x, z) => inside(x, z, -10, 17, -8, 42);
export const isCanyonTrail = (x, z) => inside(x, z, -1, 1, -7, 36);
export const isCoverRoute = (x, z) => inside(x, z, 10, 12, 4, 34) || inside(x, z, 1, 12, 4, 6) || inside(x, z, 11, 14, 34, 36);
const wall = (x, z) => inside(x, z, 7, 8, 7, 34) || inside(x, z, 9, 9, 10, 29) || inside(x, z, 13, 15, 8, 32);
const perch = (x, z) => inside(x, z, 12, 17, 34, 39);

export class TyrantCanyonGenerator {
  constructor(seedText, expedition) {
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0x47ab2f);
    this.expedition = expedition;
  }

  isNether() { return false; }
  findSpawn() { return { x: 0.5, z: -4.5 }; }

  column(x, z) {
    if (approach(x, z)) return { h: floor + (wall(x, z) ? 5 : 0), biome: "tyrant_canyon" };
    const rock = this.noise.fbm2(x / 43, z / 43, 3);
    const distance = Math.max(0, -10 - x, x - 17, -8 - z, z - 42);
    const h = Math.round(floor + Math.min(1, distance / 9) * (8 + rock * 10));
    return { h, biome: "tyrant_canyon" };
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const put = (x, y, z, block) => {
      if (x >= x0 && x < x0 + CHUNK && z >= z0 && z < z0 + CHUNK) data[idx(x - x0, y, z - z0)] = block;
    };

    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const { h } = this.column(x, z);
      const safeTrail = isCanyonTrail(x, z) || isCoverRoute(x, z);
      for (let y = 0; y <= h; y++) {
        const r = hash3(this.seed, x, y, z);
        let block = B.STONE;
        if (y === 0) block = B.BEDROCK;
        else if (y === h) block = perch(x, z) ? B.STONE_BRICKS : safeTrail ? B.GRAVEL : wall(x, z) ? B.SANDSTONE : B.GRASS;
        else if (y > h - 3 && wall(x, z)) block = B.SANDSTONE;
        else if (r < 0.012) block = B.COAL_ORE;
        else if (r > 0.988) block = B.IRON_ORE;
        put(x, y, z, block);
      }
      if (safeTrail || perch(x, z) || wall(x, z)) continue;
      const plant = hash3(this.seed, x, 78, z);
      if (plant < 0.037) put(x, h + 1, z, make(B.BERRY_BUSH, 3));
      else if (plant < 0.24) put(x, h + 1, z, B.TALL_GRASS);
    }
    // The split is visible from camp. Torch pairs mark the sheltered fork and the beacon pad.
    for (const [x, z] of [[-3, 4], [3, 6], [11, 6], [11, 33], [13, 37], [16, 37]]) {
      put(x, floor + 1, z, B.MOSSY);
      put(x, floor + 2, z, B.TORCH);
    }
    for (const [x, z] of [[-5, -3], [5, -3]]) {
      for (let y = floor + 1; y < floor + 6; y++) put(x, y, z, B.LOG);
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) + Math.abs(dz) <= 3) put(x + dx, floor + 5, z + dz, B.LEAVES);
      }
    }
    for (const [x, z] of [[-2, 13], [2, 16], [-2, 19]]) {
      put(x, floor, z, B.DIRT);
      put(x - 1, floor, z + 1, B.DIRT);
      put(x + 1, floor, z + 1, B.DIRT);
    }
    if (this.expedition) {
      for (const { x, y, z } of [TRACKS, EXPEDITION_BEACON]) put(x, y, z, B.LORE_TABLET);
    }
    put(15, floor + 1, 36, B.IRON_BLOCK);
    put(15, floor + 2, 36, B.KEEPER_LAMP);
    return data;
  }
}
