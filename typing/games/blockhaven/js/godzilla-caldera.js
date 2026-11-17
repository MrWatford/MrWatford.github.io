import { B, CHUNK, HEIGHT, SEA, make, I } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

export const GODZILLA_CALDERA = "godzilla_caldera";
export const CALDERA_LAYOUT = 1;
export const CALDERA_ARRIVAL = { x: 0, z: -5, yaw: Math.PI };
export const GODZILLA_START = 15;
export const CALDERA_FLOOR = SEA + 10;
export const GODZILLA_SITE = { x: 0.5, y: CALDERA_FLOOR + 1, z: 27.5 };
export const GODZILLA_TERMINAL = { x: -2, y: CALDERA_FLOOR + 1, z: 4 };
export const CALDERA_CACHE = { x: 2, y: CALDERA_FLOOR + 1, z: -1 };
export const GODZILLA_ANCHORS = [
  { x: -13, y: CALDERA_FLOOR + 1, z: 20 },
  { x: 13, y: CALDERA_FLOOR + 1, z: 20 },
  { x: 0, y: CALDERA_FLOOR + 1, z: 44 }
];
export const atCalderaSite = (hit, site) => hit.x === site.x && hit.y === site.y && hit.z === site.z;
export const isGodzillaConsole = hit => atCalderaSite(hit, GODZILLA_TERMINAL) || GODZILLA_ANCHORS.some(site => atCalderaSite(hit, site));

export function calderaSupplies() {
  const gear = [
    [I.IRON_SWORD, 1], [I.BOW, 1], [I.ARROW, 64], [I.ARROW, 32], [I.SHIELD, 1],
    [I.IRON_HELMET, 1], [I.IRON_CHEST, 1], [I.IRON_LEGS, 1], [I.IRON_BOOTS, 1], [I.STEAK, 16]
  ];
  return { type: "chest", slots: Array.from({ length: 27 }, (_, i) => gear[i] ? { id: gear[i][0], n: gear[i][1] } : null) };
}

export const inCalderaArena = (x, z) => Math.hypot(x - GODZILLA_SITE.x, z - GODZILLA_SITE.z) < 24;

export class GodzillaCalderaGenerator {
  constructor(seedText) {
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0x18f31c);
  }

  isNether() { return false; }
  findSpawn() { return { x: 0.5, z: -4.5 }; }

  column(x, z) {
    const d = Math.hypot(x, z - 27);
    if (d < 24 || Math.abs(x) <= 4 && z >= -7 && z <= 6) return { h: CALDERA_FLOOR, biome: "godzilla_caldera" };
    if (d < 28) return { h: CALDERA_FLOOR - 3, biome: "godzilla_caldera" };
    const ridge = Math.max(0, 1 - Math.abs(d - 37) / 23);
    const h = Math.round(CALDERA_FLOOR + ridge * 25 + this.noise.n2(x / 48, z / 48) * 7);
    return { h, biome: "godzilla_caldera" };
  }

  generate(cx, cz) {
    const bytes = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const put = (x, y, z, id) => {
      if (x >= x0 && x < x0 + CHUNK && z >= z0 && z < z0 + CHUNK) bytes[idx(x - x0, y, z - z0)] = id;
    };
    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const { h } = this.column(x, z);
      const d = Math.hypot(x, z - 27);
      for (let y = 0; y <= h; y++) {
        const noise = hash3(this.seed, x, y, z);
        let b = B.STONE;
        if (y === 0) b = B.BEDROCK;
        else if (y === h) b = h === CALDERA_FLOOR && (d < 24 || Math.abs(x) <= 4 && z <= 6) ?
          noise < 0.18 ? B.BLACKSTONE : B.BLACKSTONE_BRICKS : noise < 0.19 ? B.EMBERRACK : B.BASALT;
        else if (y > h - 5) b = B.BASALT;
        put(x, y, z, b);
      }
      if (d >= 24 && d < 28 && h < CALDERA_FLOOR - 1) {
        for (let y = h + 1; y < CALDERA_FLOOR; y++) put(x, y, z, B.LAVA);
      }
      if (h === CALDERA_FLOOR && d > 22 && d < 23) put(x, h, z, B.OBSIDIAN);
    }
    for (const site of [GODZILLA_TERMINAL, ...GODZILLA_ANCHORS]) {
      const { x, y, z } = site;
      put(x, y, z, B.LORE_TABLET);
      put(x + 1, y, z, B.OBSIDIAN);
      put(x + 1, y + 1, z, B.LUMEN_CRYSTAL);
    }
    put(CALDERA_CACHE.x, CALDERA_CACHE.y, CALDERA_CACHE.z, B.CHEST);
    for (const x of [-3, 3]) for (const z of [-6, 1, 8, 15]) {
      put(x, CALDERA_FLOOR + 1, z, B.BLACKSTONE_BRICKS);
      put(x, CALDERA_FLOOR + 2, z, B.TORCH);
    }
    // Four low basalt outcrops break up the floor while leaving walks to all three anchors.
    for (const [x, z] of [[-9, 13], [9, 13], [-9, 39], [9, 39]]) {
      for (let dx = -1; dx <= 1; dx++) put(x + dx, CALDERA_FLOOR + 1, z, B.BASALT);
      put(x, CALDERA_FLOOR + 2, z, B.BASALT);
    }
    return bytes;
  }
}
