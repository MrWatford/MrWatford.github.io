import { B, CHUNK, HEIGHT, SEA, make } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

export const FERN_PLAINS = "fern_plains";
export const FERN_LAYOUT = 1;
export const PLAINS_ARRIVAL = { x: 0, z: -5, yaw: Math.PI };
export const JUNGLE_RETURN = { x: 0, z: 0, yaw: Math.PI };
export const SURVEY_POSTS = Object.freeze([
  { x: -5, y: 36, z: 8 },
  { x: 13, y: 36, z: 39 }
]);
export const surveyPost = hit => SURVEY_POSTS.findIndex(p => p.x === hit.x && p.y === hit.y && p.z === hit.z);

const roadX = z => Math.round(Math.max(0, z - 10) * 0.24);
const road = (x, z) => z >= -6 && z <= 45 && Math.abs(x - roadX(z)) < 2;
const crossingHeight = SEA + 5;

export class FernPlainsGenerator {
  constructor(seedText, expedition) {
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0x2fbb657);
    this.expedition = expedition;
  }

  isNether() { return false; }
  findSpawn() { return { x: PLAINS_ARRIVAL.x + 0.5, z: PLAINS_ARRIVAL.z + 0.5 }; }

  column(x, z) {
    const relief = this.noise.fbm2(x / 100, z / 100, 3);
    const lowland = SEA + 5 + relief * 13;
    const bend = -30 + this.noise.n2(z / 82, 33) * 12;
    const bank = Math.max(0, 1 - Math.abs(x - bend) / 13);
    const meadow = Math.min(1, Math.hypot((x - roadX(z)) / 26, (z - 14) / 47));
    const postEdge = Math.min(...SURVEY_POSTS.map(p => Math.max(Math.abs(x - p.x), Math.abs(z - p.z)))) - 2;
    const trailEdge = Math.max(Math.abs(x - roadX(z)) - 1, -6 - z, z - 45);
    const transition = Math.max(0, Math.min(1, Math.min(postEdge, trailEdge) / 5));
    const h = Math.round(crossingHeight + (lowland - crossingHeight - bank * 10) * meadow * transition);
    return { h, biome: h < SEA ? "river" : "fern_plains" };
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const write = (x, y, z, material) => {
      if (x >= x0 && x < x0 + CHUNK && z >= z0 && z < z0 + CHUNK) data[idx(x - x0, y, z - z0)] = material;
    };
    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const onTrail = road(x, z);
      const atPost = SURVEY_POSTS.some(p => Math.abs(x - p.x) <= 2 && Math.abs(z - p.z) <= 2);
      const { h } = this.column(x, z);
      write(x, 0, z, B.BEDROCK);
      for (let y = 1; y < h - 2; y++) {
        const ore = hash3(this.seed, x, y, z);
        write(x, y, z, ore < 0.013 ? B.COAL_ORE : ore > 0.989 ? B.IRON_ORE : B.STONE);
      }
      write(x, h - 2, z, B.DIRT);
      write(x, h - 1, z, B.DIRT);
      write(x, h, z, onTrail ? B.GRAVEL : h <= SEA ? B.SAND : B.GRASS);
      for (let y = h + 1; y <= SEA; y++) write(x, y, z, B.WATER);
      if (h <= SEA || onTrail || atPost) continue;
      const plant = hash3(this.seed, x, 83, z);
      if (plant < 0.026) write(x, h + 1, z, make(B.BERRY_BUSH, 3));
      else if (plant < 0.37) write(x, h + 1, z, B.TALL_GRASS);
      else if (plant > 0.974) write(x, h + 1, z, B.FLOWER_YELLOW);
      // Scattered stone outcrops leave most of the meadow open.
      if (plant > 0.995 && Math.abs(x - roadX(z)) > 11) write(x, h + 1, z, B.MOSSY);
    }
    // Low walls frame the two views across the herd's route.
    for (const { x, y, z } of SURVEY_POSTS) {
      for (const dx of [-1, 0, 1]) write(x + dx, y - 1, z, B.STONE_BRICKS);
      write(x - 1, y, z, B.MOSSY);
      write(x + 1, y, z, B.MOSSY);
      write(x - 1, y + 1, z, B.TORCH);
      write(x + 1, y + 1, z, B.TORCH);
      if (this.expedition) write(x, y, z, B.LORE_TABLET);
      for (const [dx, dz] of [[-1, 1], [0, 2], [1, 1]]) write(x + dx, y - 1, z + dz, B.DIRT);
    }
    // Trees near the arrival provide wood and saplings for sandbox play.
    for (const x of [-11, 12]) {
      const z = -9, { h } = this.column(x, z);
      for (let y = h + 1; y <= h + 5; y++) write(x, y, z, B.LOG);
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        if (dx || dz) write(x + dx, h + 5, z + dz, B.LEAVES);
        if (Math.abs(dx) + Math.abs(dz) <= 2) write(x + dx, h + 6, z + dz, B.LEAVES);
      }
    }
    return data;
  }
}
