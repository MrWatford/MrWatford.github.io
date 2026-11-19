import { B, CHUNK, HEIGHT, SEA } from "./blocks.js";
import { hash3 } from "./noise.js";
import { makeKit } from "./campaign-kit.js";
import { overlapsSettlement, settlementIsUntouched } from "./campaign-renovation.js";

export const COMMONS_SIZE = 48;
export const COMMONS_LAYOUT = 1;
const HALF = COMMONS_SIZE / 2;
const EMPTY = { signs: [], chests: [], crops: [] };

function commonsElevation(gen, x, z) {
  const heights = [];
  for (let dz = -23; dz <= 23; dz += 6) for (let dx = -23; dx <= 23; dx += 6) {
    const { h, biome } = gen.column(x + dx, z + dz);
    if (h < SEA + 1 || h > HEIGHT - 15 || biome === "peak" || biome === "mountain") return null;
    heights.push(h);
  }
  heights.sort((a, b) => a - b);
  return heights.at(-1) - heights[0] <= 9 ? heights[Math.floor(heights.length / 2)] : null;
}

export function canPlaceLegacyCommons(gen, village, plot, data, player) {
  if (plot?.kind !== "legacyCommons" || plot.v !== COMMONS_LAYOUT ||
      ![plot.cx, plot.cz, plot.g, plot.rot].every(Number.isSafeInteger) || plot.rot < 0 || plot.rot > 3) return false;
  const x0 = plot.cx - HALF, z0 = plot.cz - HALF;
  const distance = Math.max(Math.abs(plot.cx - village.cx), Math.abs(plot.cz - village.cz));
  if (x0 % CHUNK || z0 % CHUNK || distance < 104 || distance > 232) return false;
  if (gen.stamps?.some(stamp => overlapsSettlement(plot, COMMONS_SIZE, stamp))) return false;
  if (gen.strongholds?.some(site => Math.abs(site.x - plot.cx) < HALF + 72 && Math.abs(site.z - plot.cz) < HALF + 72)) return false;
  for (let z = z0 / CHUNK; z < (z0 + COMMONS_SIZE) / CHUNK; z++) for (let x = x0 / CHUNK; x < (x0 + COMMONS_SIZE) / CHUNK; x++) {
    if (gen.villageAt(x, z) || hash3(gen.seed, x, 99, z) < 0.035 || hash3(gen.seed, x, 77, z) < 0.02) return false;
  }
  return plot.g === commonsElevation(gen, plot.cx, plot.cz) &&
    settlementIsUntouched(plot, COMMONS_SIZE, EMPTY, data, player);
}

export function findLegacyCommons(gen, village, data, player) {
  const align = n => Math.round((n - HALF) / CHUNK) * CHUNK + HALF;
  const directions = [[0, 1, 2], [1, 0, 1], [-1, 0, 3], [0, -1, 0]];
  for (let distance = 112; distance <= 224; distance += CHUNK) {
    for (const offset of [0, 16, -16, 32, -32, 48, -48, 64, -64]) {
      for (const [dx, dz, rot] of directions) {
        const cx = align(village.cx + distance * dx + offset * dz);
        const cz = align(village.cz + distance * dz + offset * dx);
        const g = commonsElevation(gen, cx, cz);
        if (g === null) continue;
        const plot = { cx, cz, g, rot, kind: "legacyCommons", v: COMMONS_LAYOUT };
        if (canPlaceLegacyCommons(gen, village, plot, data, player)) return plot;
      }
    }
  }
  return null;
}

export function buildLegacyCommons(g, groundAt, rot) {
  const K = makeKit(COMMONS_SIZE, g, rot), { set, box } = K;
  K.ground(groundAt, 19, 24);
  K.road(-2, -17, 2, 18, B.STONE_BRICKS, B.MOSSY);
  K.road(-18, -2, 18, 2, B.STONE_BRICKS, B.COBBLE);
  K.road(-16, -11, 16, -9, B.STONE_BRICKS, B.MOSSY);
  K.road(-7, 8, 7, 10, B.STONE_BRICKS, B.MOSSY);

  // Blend the entry lane into the natural slope toward the old village.
  for (let z = 19; z < HALF; z++) {
    const level = Math.round(g + (groundAt(...K.rp(0, z)) - g) * (z - 18) / 6);
    box(-2, level - 2, z, 2, level - 1, z, B.COBBLE);
    box(-2, level, z, 2, level, z, B.GRAVEL);
    box(-2, level + 1, z, 2, Math.max(level + 3, g + 4), z, B.AIR);
  }
  for (const x of [-4, 4]) {
    box(x, g, 17, x, g + 4, 17, B.STONE_BRICKS);
    set(x, g + 5, 17, B.BRAZIER);
  }
  box(-4, g + 4, 17, 4, g + 4, 17, B.LOG);
  box(-3, g + 5, 17, 3, g + 5, 17, B.DARKSLATE_BRICKS);
  K.sign(-5, g + 1, 15, 0, "Legacy Village Commons\n\nFollow the entry road back toward the old village. Tamsin keeps the records hall. Nell tends the apiary across the lane.");
  K.waystone("legacyCommons", 5, 14);

  K.house({ x0: -17, x1: -6, z0: -16, z1: -5, h: 5, roof: B.DARKSLATE_BRICKS, doorSide: "e", doorAt: -10 });
  K.house({ x0: 6, x1: 17, z0: -16, z1: -5, h: 4, roof: B.ROOF_TILES, doorSide: "w", doorAt: -10 });
  for (const side of [-1, 1]) {
    const x = side * 7;
    K.road(Math.min(x, 0), -10, Math.max(x, 0), -10, B.GRAVEL, B.COBBLE);
    for (const z of [-12, -8]) box(side * 4, g + 1, z, side * 4, g + 3, z, B.LOG);
    box(Math.min(side * 4, side * 6), g + 4, -12, Math.max(side * 4, side * 6), g + 4, -8, B.BIRCH_PLANKS);
    set(side * 5, g + 3, -10, B.SHINESTONE);
    set(side * 4, g, -10, B.STONE_BRICKS);
    set(side * 12, g + 2, -5, B.STAINED_GLASS);
    set(side * 12, g + 3, -5, B.STAINED_GLASS);
    box(side * 15, g + 5, -15, side * 15, g + 9, -15, B.BRICKS);
    K.bed(side * 15, g + 1, -7);
    set(side * 13, g + 1, -7, B.TABLE);
  }
  K.sign(-5, g + 1, -11, 1, "Records Hall\n\nScribe Tamsin copies maps and keeps a record of the village roads.");
  K.sign(5, g + 1, -11, 3, "Apiary Workshop\n\nBeekeeper Nell tends the flower garden and trades honey and hive supplies.");
  box(-16, g + 1, -15, -7, g + 2, -15, B.BOOKSHELF);
  box(-16, g + 1, -14, -16, g + 2, -11, B.BOOKSHELF);
  set(-10, g + 1, -13, B.MAP_TABLE);
  set(-11, g + 1, -13, B.STONE_STEP);
  set(14, g + 1, -14, B.COMPOSTER);
  box(15, g + 1, -14, 16, g + 1, -12, B.HAY);
  set(11, g + 1, -14, B.BEEHIVE);
  K.npc("legacyScribe", -9, -11);
  K.npc("legacyBeekeeper", 9, -11);

  K.farm(-17, 4, -7, 17);
  set(-7, g + 1, 9, B.AIR);
  const beds = K.info.crops.map(({ X, y, Z }) => ({ ...K.at(X, Z), y }));
  K.info.crops = beds;
  for (const x of [8, 11, 14, 17]) {
    for (const z of [6, 13, 16]) {
      set(x, g, z, B.DIRT);
      set(x, g + 1, z, z % 2 ? B.FLOWER_YELLOW : B.FLOWER_RED);
    }
  }
  for (const x of [10, 13, 16]) {
    set(x, g + 1, 9, B.OAK_FENCE);
    set(x, g + 2, 9, B.BEEHIVE);
  }
  for (const x of [8, 18]) for (const z of [7, 11]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  box(8, g + 4, 7, 18, g + 4, 11, (x, y, z) => z % 3 ? B.WOOL : B.WARPED_PLANKS);
  set(8, g + 3, 9, B.SHINESTONE);
  set(18, g + 3, 9, B.SHINESTONE);
  K.animal("bee", 10, 8, g + 2);
  K.animal("bee", 16, 10, g + 2);

  // A low fountain and two benches leave both sides of the square walkable.
  for (const z of [-6, -5, -4]) for (const x of [-1, 0, 1]) {
    set(x, g, z, B.STONE_BRICKS);
    set(x, g + 1, z, x === 0 && z === -5 ? B.WATER : B.STONE_BRICKS);
  }
  set(0, g + 2, -5, B.SHINESTONE);
  for (const x of [-4, 4]) {
    K.lamp(x, 3);
    box(x, g + 1, -5, x, g + 1, -4, B.STONE_STEP);
    for (const z of [5, 12]) { set(x, g, z, B.DIRT); set(x, g + 1, z, B.FLOWER_YELLOW); }
  }
  for (const side of [-1, 1]) for (const x of [9, 12, 15, 18]) {
    set(side * x, g, 18, x % 2 ? B.MOSSY : B.STONE_BRICKS);
    set(side * x, g + 1, 18, x % 2 ? B.FLOWER_YELLOW : B.FLOWER_RED);
  }
  return K;
}
