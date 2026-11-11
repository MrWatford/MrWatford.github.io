import { B, CHUNK, HEIGHT, SEA } from "./blocks.js";
import { Grid, KEEP } from "./maps.js";
import { hash3 } from "./noise.js";

export const OBSIDIAN_BADLANDS_LAYOUT = 1;
const CITADEL_SIZE = 3 * CHUNK;
const SIZE = CITADEL_SIZE + 2 * CHUNK;
function naturalLandmark(gen, cx, cz) {
  return gen.villagePiece?.(cx, cz) || hash3(gen.seed, cx, 99, cz) < 0.035 || hash3(gen.seed, cx, 77, cz) < 0.02;
}

export function obsidianBadlandsBounds(site) {
  return { x: site.x - CHUNK, z: site.z - CHUNK, size: SIZE };
}

export function canPlaceObsidianBadlands(gen, site, untouched, reserved) {
  const { x, z, size } = obsidianBadlandsBounds(site);
  if (!untouched(x, z, x + size, z + size) ||
      reserved.some(s => x < s.x + s.size && x + size > s.x && z < s.z + s.size && z + size > s.z) ||
      gen.strongholds?.some(s => Math.hypot(s.x - x - size / 2, s.z - z - size / 2) < 77 + size / 2)) return false;
  if (naturalLandmark(gen, x / CHUNK, z / CHUNK + 3) || naturalLandmark(gen, x / CHUNK, z / CHUNK + 4)) return false;
  for (const [dx, dz] of [[5, 62], [13, 62], [5, 76], [13, 76], [9, 75]]) {
    const { h } = gen.column(x + dx, z + dz);
    if (h <= SEA + 1 || Math.abs(h - site.y) > 5) return false;
  }
  return true;
}

export function obsidianAshStrength(site, x, z) {
  if (site?.volcanicLayout !== OBSIDIAN_BADLANDS_LAYOUT) return 0;
  const distance = Math.hypot(x - site.x - CITADEL_SIZE / 2, z - site.z - CITADEL_SIZE / 2);
  return Math.max(0, Math.min(1, (SIZE / 2 - distance) / 10));
}

export function obsidianChamberEntry(gen, site) {
  const { x, z } = obsidianBadlandsBounds(site);
  return { x: x + 9, y: gen.column(x + 9, z + 75).h + 1, z: z + 75 };
}

export function buildObsidianBadlands(gen, site) {
  const { x, z, size } = obsidianBadlandsBounds(site);
  const g = new Grid(0, 0, size, size, KEEP);
  const masked = new Set();
  for (let cz = 0; cz < size / CHUNK; cz++) for (let cx = 0; cx < size / CHUNK; cx++) {
    if (naturalLandmark(gen, x / CHUNK + cx, z / CHUNK + cz)) masked.add(cx + cz * (size / CHUNK));
  }
  const skip = (dx, dz) => masked.has(Math.floor(dx / CHUNK) + Math.floor(dz / CHUNK) * (size / CHUNK));
  for (let dz = 2; dz < size - 2; dz++) for (let dx = 2; dx < size - 2; dx++) {
    const innerX = dx >= CHUNK && dx < CHUNK + CITADEL_SIZE;
    const innerZ = dz >= CHUNK && dz < CHUNK + CITADEL_SIZE;
    if (innerX && innerZ || skip(dx, dz)) continue;
    const roll = hash3(gen.seed, x + dx, 586, z + dz);
    if (Math.hypot(dx - 39.5, dz - 39.5) > 39 + roll * 8) continue;
    const { h, biome } = gen.column(x + dx, z + dz);
    if (h <= SEA + 1 || h >= HEIGHT - 10 || biome !== "sandy") continue;
    g.set(dx, h, dz, roll > 0.86 ? B.BLACKSTONE : B.BLACK_SAND);
    g.set(dx, h - 1, dz, B.BASALT);
  }

  for (const [dx, dz, height] of [[12, 25, 5], [10, 43, 7], [25, 13, 6], [58, 12, 5], [67, 28, 8], [70, 49, 6], [61, 68, 5], [28, 68, 5]]) {
    if (skip(dx - 1, dz - 1) || skip(dx + 1, dz - 1) || skip(dx - 1, dz + 1) || skip(dx + 1, dz + 1)) continue;
    const { h, biome } = gen.column(x + dx, z + dz);
    if (h <= SEA + 1 || h + height + 1 >= HEIGHT || biome !== "sandy") continue;
    g.box(dx - 1, h - 1, dz - 1, dx + 1, h + 1, dz + 1, B.BLACKSTONE);
    g.box(dx, h + 1, dz, dx, h + height, dz, B.BASALT);
    g.set(dx, h + height + 1, dz, B.EMBER_CRYSTAL);
    g.set(dx + 1, h + 2, dz, B.OBSIDIAN);
  }

  const entry = obsidianChamberEntry(gen, site);
  const floor = entry.y - 10;
  g.box(4, floor - 2, 59, 15, floor, 66, B.BLACKSTONE);
  g.walls(4, floor + 1, 59, 15, floor + 4, 66, B.BASALT);
  g.box(5, floor + 1, 60, 14, floor + 4, 65, B.AIR);
  g.box(4, floor + 5, 59, 15, floor + 5, 66, B.BLACKSTONE);
  for (let step = 0; step <= 9; step++) {
    const stairZ = 75 - step, y = entry.y - 1 - step;
    g.box(7, y - 1, stairZ, 11, y, stairZ, B.BASALT);
    g.box(8, y + 1, stairZ, 10, Math.max(y + 3, gen.column(x + 9, z + stairZ).h + 1), stairZ, B.AIR);
    g.set(7, y + 1, stairZ, step % 3 === 0 ? B.EMBER_CRYSTAL : B.BLACKSTONE);
    g.set(11, y + 1, stairZ, B.BLACKSTONE);
  }
  g.box(8, floor + 1, 65, 10, floor + 3, 66, B.AIR);
  // Recessed magma behind a full-height rim keeps the stair and gallery dry.
  g.box(12, floor, 61, 13, floor, 64, B.LAVA);
  for (const [dx, dz] of [[6, 61], [6, 64], [14, 62], [14, 64]]) g.set(dx, floor + 1, dz, B.EMBER_CRYSTAL);
  return { x, z, size, cells: g.data };
}
