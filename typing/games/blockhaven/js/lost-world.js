import { B, CHUNK, HEIGHT, SEA, make } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

import { CAMP_TABLET, FIELD_TABLET } from "./lost-world-campaign.js";

export const LOST_WORLD = "lost_world";
export const LOST_WORLD_GEN = 1;
export const worldHome = save => save.lostWorldGen ? LOST_WORLD : "overworld";

const CAMP_HEIGHT = SEA + 5;
const trail = z => Math.round(3 * Math.sin(z / 9));
const camp = (x, z) => Math.hypot(x, z) < 11;
const path = (x, z) => z >= 0 && z <= 44 && Math.abs(x - trail(z)) < 3;
const grove = (x, z) => z >= 24 && z <= 40 && Math.abs(x - trail(z)) < 7;

export class LostWorldGenerator {
  constructor(seedText, layout, expedition = false) {
    if (layout !== LOST_WORLD_GEN) throw new Error("Unsupported Lost World terrain version.");
    this.expedition = expedition;
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0xfb4e91);
  }

  isNether() { return false; }
  findSpawn() { return { x: 0.5, z: 0.5 }; }

  column(x, z) {
    const n = this.noise;
    const river = Math.abs(n.fbm2(x / 96 + 20, z / 96 - 25, 2));
    const hills = n.fbm2(x / 61, z / 61, 3);
    const detail = n.n2(x / 24 + 70, z / 24);
    const wet = river < 0.085;
    const wildHeight = wet ? SEA - 4 + river * 35 : SEA + 4 + hills * 9 + detail * 3;
    const distance = Math.hypot(x, z);
    const blend = Math.max(0, Math.min(1, (distance - 11) / 14));
    const trailEdge = Math.max(0, Math.abs(x - trail(z)) - (z >= 24 && z <= 40 ? 6 : 2));
    const trailEnd = Math.max(0, -z, z - 44);
    const trailBlend = Math.min(1, Math.hypot(trailEdge, trailEnd) / 6);
    const h = Math.round(CAMP_HEIGHT + Math.min(blend, trailBlend) * (wildHeight - CAMP_HEIGHT));
    return { h, biome: h < SEA ? "river" : "primeval_jungle" };
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const write = (x, y, z, value, empty = false) => {
      if (x < x0 || x >= x0 + CHUNK || z < z0 || z >= z0 + CHUNK) return;
      const i = idx(x - x0, y, z - z0);
      if (!empty || data[i] === B.AIR) data[i] = value;
    };

    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const { h } = this.column(x, z);
      write(x, 0, z, B.BEDROCK);
      for (let y = 1; y < h - 2; y++) {
        const ore = hash3(this.seed, x, y, z);
        write(x, y, z, ore < 0.013 ? B.COAL_ORE : ore > 0.989 ? B.IRON_ORE : B.STONE);
      }
      write(x, h - 2, z, B.DIRT);
      write(x, h - 1, z, B.DIRT);
      write(x, h, z, path(x, z) ? B.GRAVEL : h <= SEA ? B.SAND : B.GRASS);
      for (let y = h + 1; y <= SEA; y++) write(x, y, z, B.WATER);
      if (h <= SEA || path(x, z) || Math.hypot(x, z) < 3) continue;
      const undergrowth = hash3(this.seed, x, 83, z);
      if (undergrowth < (camp(x, z) ? 0.075 : 0.022)) write(x, h + 1, z, make(B.BERRY_BUSH, 3));
      else if (undergrowth < 0.28) write(x, h + 1, z, B.TALL_GRASS);
      else if (undergrowth > 0.985) write(x, h + 1, z, B.FLOWER_RED);
    }

    // Tree anchors are chosen in global coordinates, including neighboring chunks.
    const radius = 4, spacing = 7;
    for (let gz = Math.floor((z0 - radius) / spacing); gz <= Math.floor((z0 + CHUNK - 1 + radius) / spacing); gz++) {
      for (let gx = Math.floor((x0 - radius) / spacing); gx <= Math.floor((x0 + CHUNK - 1 + radius) / spacing); gx++) {
        const x = gx * spacing + Math.floor(hash3(this.seed, gx, 74, gz) * spacing);
        const z = gz * spacing + Math.floor(hash3(this.seed, gx, 75, gz) * spacing);
        if (camp(x, z) || grove(x, z) || path(x, z)) continue;
        const { h } = this.column(x, z);
        if (h <= SEA) continue;
        const top = h + 8 + Math.floor(hash3(this.seed, x, 76, z) * 7);
        for (let y = h + 1; y <= top; y++) write(x, y, z, B.LOG);
        for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
          const spread = Math.abs(dx) + Math.abs(dz);
          if (spread > 6 || path(x + dx, z + dz)) continue;
          if (spread < 5) write(x + dx, top + 1, z + dz, B.LEAVES, true);
          write(x + dx, top, z + dz, B.LEAVES, true);
          if (spread > 2 && hash3(this.seed, x + dx, 77, z + dz) < 0.36) {
            write(x + dx, top - 1, z + dz, B.LEAVES, true);
            write(x + dx, top - 2, z + dz, B.VINES, true);
            write(x + dx, top - 3, z + dz, B.VINES, true);
          }
        }
      }
    }

    // Fixed landmarks make the first route legible on every seed.
    for (let y = CAMP_HEIGHT + 1; y <= CAMP_HEIGHT + 3; y++) {
      write(-3, y, 6, B.MOSSY);
      write(3, y, 6, B.MOSSY);
    }
    for (let x = -3; x <= 3; x++) write(x, CAMP_HEIGHT + 4, 6, B.STONE_BRICKS);
    write(-3, CAMP_HEIGHT + 5, 6, B.TORCH);
    write(3, CAMP_HEIGHT + 5, 6, B.TORCH);
    // A young tree and ripe bushes supply the first crafting and food loop.
    for (let y = CAMP_HEIGHT + 1; y <= CAMP_HEIGHT + 5; y++) write(-6, y, 0, B.LOG);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dz) <= 3) write(-6 + dx, CAMP_HEIGHT + 5, dz, B.LEAVES, true);
    }
    for (let z = -1; z <= 1; z++) write(5, CAMP_HEIGHT + 1, z, make(B.BERRY_BUSH, 3));
    if (this.expedition) {
      for (const { x, y, z } of [CAMP_TABLET, FIELD_TABLET]) {
        write(x, y, z, B.LORE_TABLET);
        write(x, y - 1, z, B.MOSSY);
      }
      // The ruin frames the field log without blocking the trail or the grove's arena.
      for (const x of [-4, 0]) {
        for (let y = 36; y <= 38; y++) write(x, y, 43, B.MOSSY);
      }
      for (let x = -4; x <= 0; x++) write(x, 39, 43, B.STONE_BRICKS);
      write(-4, 40, 43, B.TORCH);
      write(0, 40, 43, B.TORCH);
    }
    return data;
  }

  raptorSite(cx, cz) {
    if (cx === 0 && cz === 2) {
      const z = 34;
      return [trail(z) + 3.5, CAMP_HEIGHT + 1, z + 0.5];
    }
    if (Math.max(Math.abs(cx), Math.abs(cz)) < 3 || cx % 4 !== 0 || Math.abs(cz % 4) !== 2) return null;
    const x = cx * CHUNK + CHUNK / 2, z = cz * CHUNK + CHUNK / 2;
    const { h } = this.column(x, z);
    return h > SEA ? [x + 0.5, h + 1, z + 0.5] : null;
  }
}

