import { B, CHUNK, HEIGHT, SEA, make } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

export const MANGROVE = "mangrove_wetlands";
export const MANGROVE_LAYOUT = 1;
export const MANGROVE_ARRIVAL = { x: 0, z: -6, yaw: Math.PI };
export const PUMP = Object.freeze({ x: -3, y: 33, z: 3 });
export const RELAY = Object.freeze({ x: 2, y: 33, z: 33 });
export const RELAY_LIGHT = Object.freeze({ x: 2, y: 35, z: 33 });
export const atWetlandSite = (hit, site) => hit.x === site.x && hit.y === site.y && hit.z === site.z;

const riverCenter = x => 14 + Math.round(4 * Math.sin(x / 25));
const boardwalk = (x, z) => Math.abs(x) <= 1 && z >= -8 && z <= 35;
const platform = (x, z) => z >= 0 && z <= 5 && x >= -5 && x <= 1 || z >= 30 && z <= 35 && x >= -2 && x <= 4;
const walkable = (x, z) => boardwalk(x, z) || platform(x, z);
const deck = SEA + 2;

export class MangroveGenerator {
  constructor(seedText, expedition) {
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0x4fc21e);
    this.expedition = expedition;
  }

  isNether() { return false; }
  findSpawn() { return { x: 0.5, z: -5.5 }; }

  column(x, z) {
    const channel = Math.abs(z - riverCenter(x));
    const detail = this.noise.fbm2(x / 45, z / 45, 2);
    const bank = Math.max(0, Math.min(1, (channel - 5) / 8));
    return { h: Math.min(deck, Math.round(SEA - 6 + bank * (7 + detail * 3))), biome: "mangrove_wetlands" };
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const write = (x, y, z, id, empty = false) => {
      if (x < x0 || x >= x0 + CHUNK || z < z0 || z >= z0 + CHUNK) return;
      const i = idx(x - x0, y, z - z0);
      if (!empty || data[i] === B.AIR) data[i] = id;
    };

    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const { h } = this.column(x, z);
      write(x, 0, z, B.BEDROCK);
      for (let y = 1; y < h - 1; y++) {
        const ore = hash3(this.seed, x, y, z);
        write(x, y, z, ore < 0.013 ? B.COAL_ORE : ore > 0.989 ? B.IRON_ORE : B.STONE);
      }
      write(x, h - 1, z, B.DIRT);
      write(x, h, z, h <= SEA ? B.CLAY : B.GRASS);
      for (let y = h + 1; y <= SEA; y++) write(x, y, z, B.WATER);
      if (walkable(x, z)) {
        write(x, deck, z, B.PLANKS);
        if (Math.abs(x) === 1 && z % 7 === 0) {
          for (let y = h + 1; y < deck; y++) write(x, y, z, B.LOG);
          write(x, deck + 1, z, B.TORCH);
        }
      } else if (h > SEA) {
        const plant = hash3(this.seed, x, 76, z);
        if (plant < 0.1) write(x, h + 1, z, make(B.BERRY_BUSH, 3));
        else if (plant < 0.45) write(x, h + 1, z, B.TALL_GRASS);
      }
    }

    const spacing = 7, reach = 4;
    for (let gx = Math.floor((x0 - reach) / spacing); gx <= Math.floor((x0 + CHUNK - 1 + reach) / spacing); gx++) {
      for (let gz = Math.floor((z0 - reach) / spacing); gz <= Math.floor((z0 + CHUNK - 1 + reach) / spacing); gz++) {
        const x = gx * spacing + Math.floor(hash3(this.seed, gx, 71, gz) * spacing);
        const z = gz * spacing + Math.floor(hash3(this.seed, gx, 72, gz) * spacing);
        const { h } = this.column(x, z);
        if (h < SEA - 1 || walkable(x, z) || Math.abs(x) < 5 && z >= -10 && z <= 37) continue;
        const top = h + 7 + Math.floor(hash3(this.seed, x, 73, z) * 4);
        for (let y = h + 1; y <= top; y++) write(x, y, z, B.LOG);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (walkable(x + dx * 2, z + dz * 2)) continue;
          write(x + dx, h + 2, z + dz, B.LOG, true);
          write(x + dx * 2, h + 1, z + dz * 2, B.LOG, true);
        }
        for (let dz = -reach; dz <= reach; dz++) for (let dx = -reach; dx <= reach; dx++) {
          if (Math.abs(dx) + Math.abs(dz) > 5 || walkable(x + dx, z + dz)) continue;
          write(x + dx, top, z + dz, B.LEAVES, true);
          if (Math.abs(dx) + Math.abs(dz) < 4) write(x + dx, top + 1, z + dz, B.LEAVES, true);
          if (hash3(this.seed, x + dx, 74, z + dz) < 0.35) {
            write(x + dx, top - 1, z + dz, B.VINES, true);
            write(x + dx, top - 2, z + dz, B.VINES, true);
          }
        }
      }
    }

    for (const { x, y, z } of [PUMP, RELAY]) {
      for (const dx of [-1, 1]) {
        write(x + dx, y, z, B.MOSSY);
        write(x + dx, y + 1, z, B.TORCH);
      }
      if (this.expedition) write(x, y, z, B.LORE_TABLET);
    }
    write(RELAY_LIGHT.x, RELAY_LIGHT.y - 1, RELAY_LIGHT.z, B.IRON_BLOCK);
    write(RELAY_LIGHT.x, RELAY_LIGHT.y, RELAY_LIGHT.z, B.GLASS);
    return data;
  }
}
