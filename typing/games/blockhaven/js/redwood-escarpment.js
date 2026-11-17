import { B, CHUNK, HEIGHT, SEA, make } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

export const REDWOODS = "redwood_escarpment";
export const REDWOOD_LAYOUT = 1;
export const REDWOOD_ARRIVAL = { x: 0, z: -5, yaw: Math.PI };
export const OVERLOOK = Object.freeze({ x: 5, y: 44, z: 26 });
export const RIDGE_STATION = Object.freeze({ x: 20, y: 53, z: 57 });

const inBox = (x, z, x0, x1, z0, z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const meadow = (x, z) => inBox(x, z, 6, 20, 10, 24);
const station = (x, z) => inBox(x, z, 14, 23, 53, 59);
const overlook = (x, z) => inBox(x, z, 2, 7, 25, 29);
export function redwoodDeck(x, z) {
  if (station(x, z)) return 52;
  if (overlook(x, z) || inBox(x, z, -1, 19, 27, 29)) return 43;
  if (inBox(x, z, 17, 19, 30, 56)) return 43 + Math.floor((z - 28) / 3);
  if (inBox(x, z, -1, 1, -7, 26)) return 35 + Math.floor(Math.max(0, z + 6) / 4);
  return null;
}

export class RedwoodGenerator {
  constructor(seedText, expedition) {
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0x2eaf0c);
    this.expedition = expedition;
  }

  isNether() { return false; }
  findSpawn() { return { x: 0.5, z: -4.5 }; }

  column(x, z) {
    const creek = Math.abs(x - (9 + Math.sin(z / 18) * 6));
    const ridge = Math.min(1, Math.max(0, (z - 29) / 28));
    const variation = this.noise.fbm2(x / 58, z / 58, 3);
    const low = 35 + variation * 9 - Math.max(0, 1 - creek / 6) * 8;
    const h = meadow(x, z) ? 38 : Math.round(low + ridge * 16);
    return { h, biome: "redwood_escarpment" };
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const write = (x, y, z, id, empty = false) => {
      if (x < x0 || x >= x0 + CHUNK || z < z0 || z >= z0 + CHUNK || y < 0 || y >= HEIGHT) return;
      const i = idx(x - x0, y, z - z0);
      if (!empty || data[i] === B.AIR) data[i] = id;
    };

    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const deck = redwoodDeck(x, z);
      const h = Math.min(this.column(x, z).h, deck === null ? HEIGHT - 1 : deck - 1);
      write(x, 0, z, B.BEDROCK);
      for (let y = 1; y < h - 2; y++) {
        const ore = hash3(this.seed, x, y, z);
        write(x, y, z, ore < 0.013 ? B.COAL_ORE : ore > 0.989 ? B.IRON_ORE : B.STONE);
      }
      write(x, h - 2, z, B.DIRT);
      write(x, h - 1, z, B.DIRT);
      write(x, h, z, h <= SEA ? B.GRAVEL : B.GRASS);
      for (let y = h + 1; y <= SEA; y++) write(x, y, z, B.WATER);
      if (deck !== null) {
        write(x, deck, z, z <= 7 && Math.abs(x) <= 1 ? B.GRAVEL : B.PLANKS);
        if ((z % 6 === 0 && Math.abs(x) === 1) || (x % 6 === 0 && z === 29)) {
          for (let y = h + 1; y < deck; y++) write(x, y, z, B.LOG);
          if (redwoodDeck(0, z) === deck && Math.abs(x) === 1 || z === 29) write(x, deck + 1, z, B.TORCH);
        }
        if (z >= 12 && (x === -1 || z === 29 && x > 1 && x < 17 ||
            z > 29 && z < 53 && (x === 17 || x === 19))) {
          if ((x + z) % 6 !== 0 && (x !== -1 || z % 6 !== 0)) write(x, deck + 1, z, B.OAK_FENCE);
        }
      } else if (h > SEA) {
        const embellish = hash3(this.seed, x, 68, z);
        if (embellish < 0.027) write(x, h + 1, z, make(B.BERRY_BUSH, 3));
        else if (embellish < 0.22) write(x, h + 1, z, B.TALL_GRASS);
      }
    }

    const spacing = 9, reach = 5;
    for (let gz = Math.floor((z0 - reach) / spacing); gz <= Math.floor((z0 + CHUNK - 1 + reach) / spacing); gz++) {
      for (let gx = Math.floor((x0 - reach) / spacing); gx <= Math.floor((x0 + CHUNK - 1 + reach) / spacing); gx++) {
        const x = gx * spacing + Math.floor(hash3(this.seed, gx, 61, gz) * spacing);
        const z = gz * spacing + Math.floor(hash3(this.seed, gx, 62, gz) * spacing);
        if (meadow(x, z) || redwoodDeck(x, z) !== null) continue;
        const { h } = this.column(x, z);
        if (h <= SEA) continue;
        const top = Math.min(HEIGHT - 4, h + 15 + Math.floor(hash3(this.seed, x, 63, z) * 8));
        for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          if (redwoodDeck(x + dx, z + dz) !== null || meadow(x + dx, z + dz)) continue;
          for (let y = h + 1; y <= top - (dx || dz ? 4 : 0); y++) write(x + dx, y, z + dz, B.LOG);
        }
        for (let dz = -reach; dz <= reach; dz++) for (let dx = -reach; dx <= reach; dx++) {
          const distance = Math.abs(dx) + Math.abs(dz);
          if (distance > 7 || redwoodDeck(x + dx, z + dz) !== null || meadow(x + dx, z + dz)) continue;
          write(x + dx, top - 4, z + dz, B.LEAVES, true);
          if (distance <= 6) write(x + dx, top - 1, z + dz, B.LEAVES, true);
          if (distance <= 4) write(x + dx, top + 1, z + dz, B.LEAVES, true);
          if (distance <= 2) write(x + dx, top + 2, z + dz, B.LEAVES, true);
        }
      }
    }

    // An open-sided shelter at the end of the elevated trail.
    for (let x = 16; x <= 23; x++) for (let z = 54; z <= 59; z++) {
      write(x, 56, z, B.ROOTWOOD);
      if ((x === 16 || x === 23) && (z === 54 || z === 59)) {
        for (let y = 53; y < 56; y++) write(x, y, z, B.LOG);
      }
      if (z === 59) write(x, 53, z, B.STONE_BRICKS);
    }
    for (const site of [OVERLOOK, RIDGE_STATION]) {
      if (this.expedition) write(site.x, site.y, site.z, B.LORE_TABLET);
      write(site.x + 1, site.y, site.z, B.KEEPER_LAMP);
    }
    for (const [x, z] of [[11, 18], [15, 21]]) {
      write(x, 38, z, B.HAY);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) write(x + dx, 38, z + dz, B.DIRT);
    }
    return data;
  }
}
