import { B, CHUNK, HEIGHT, SEA } from "./blocks.js";
import { hash3 } from "./noise.js";
import { overlapsSettlement, settlementIsUntouched } from "./campaign-renovation.js";

export const DISTRICT_SIZE = 48;
export const DISTRICT_LAYOUT = 1;
const HALF = DISTRICT_SIZE / 2;
const DEFAULT_SEARCH_DISTANCE = 224;
const EMPTY = { signs: [], chests: [], crops: [] };

function districtElevation(gen, x, z) {
  const heights = [];
  for (let dz = -23; dz <= 23; dz += 6) for (let dx = -23; dx <= 23; dx += 6) {
    const { h, biome } = gen.column(x + dx, z + dz);
    if (h < SEA + 1 || h > HEIGHT - 15 || biome === "peak" || biome === "mountain") return null;
    heights.push(h);
  }
  heights.sort((a, b) => a - b);
  return heights.at(-1) - heights[0] <= 9 ? heights[Math.floor(heights.length / 2)] : null;
}

export function canPlaceCampaignDistrict(gen, parent, district, plot, data, player, reserved = []) {
  if (plot?.kind !== district.id || plot.v !== DISTRICT_LAYOUT ||
      ![plot.cx, plot.cz, plot.g, plot.rot].every(Number.isSafeInteger) || plot.rot < 0 || plot.rot > 3) return false;
  const x0 = plot.cx - HALF, z0 = plot.cz - HALF;
  const distance = Math.max(Math.abs(plot.cx - parent.cx), Math.abs(plot.cz - parent.cz));
  const searchDistance = district.searchDistance ?? DEFAULT_SEARCH_DISTANCE;
  if (x0 % CHUNK || z0 % CHUNK || distance < district.clearance || distance > searchDistance + CHUNK / 2) return false;
  if (gen.stamps?.some(stamp => overlapsSettlement(plot, DISTRICT_SIZE, stamp)) ||
      reserved.some(stamp => overlapsSettlement(plot, DISTRICT_SIZE, stamp))) return false;
  if (gen.strongholds?.some(site => Math.abs(site.x - plot.cx) < HALF + 72 && Math.abs(site.z - plot.cz) < HALF + 72)) return false;
  for (let z = z0 / CHUNK; z < (z0 + DISTRICT_SIZE) / CHUNK; z++) for (let x = x0 / CHUNK; x < (x0 + DISTRICT_SIZE) / CHUNK; x++) {
    if (gen.villageAt(x, z) || hash3(gen.seed, x, 99, z) < 0.035 || hash3(gen.seed, x, 77, z) < 0.02) return false;
  }
  return plot.g === districtElevation(gen, plot.cx, plot.cz) &&
    settlementIsUntouched(plot, DISTRICT_SIZE, EMPTY, data, player);
}

export function findCampaignDistrict(gen, parent, district, data, player, reserved = []) {
  const align = n => Math.round((n - HALF) / CHUNK) * CHUNK + HALF;
  const directions = [[0, 1, 2], [1, 0, 1], [-1, 0, 3], [0, -1, 0]];
  const searchDistance = district.searchDistance ?? DEFAULT_SEARCH_DISTANCE;
  for (let distance = district.clearance + CHUNK / 2; distance <= searchDistance; distance += CHUNK) {
    for (const offset of [0, 16, -16, 32, -32, 48, -48, 64, -64]) {
      for (const [dx, dz, rot] of directions) {
        const cx = align(parent.cx + distance * dx + offset * dz);
        const cz = align(parent.cz + distance * dz + offset * dx);
        const g = districtElevation(gen, cx, cz);
        if (g === null) continue;
        const plot = { cx, cz, g, rot, kind: district.id, v: DISTRICT_LAYOUT };
        if (canPlaceCampaignDistrict(gen, parent, district, plot, data, player, reserved)) return plot;
      }
    }
  }
  return null;
}

export function buildDistrictApproach(K, groundAt) {
  const { box, g } = K;
  // Blend the entry lane into the natural slope toward the old village.
  for (let z = 19; z < HALF; z++) {
    const level = Math.round(g + (groundAt(...K.rp(0, z)) - g) * (z - 18) / 6);
    box(-2, level - 2, z, 2, level - 1, z, B.COBBLE);
    box(-2, level, z, 2, level, z, B.GRAVEL);
    box(-2, level + 1, z, 2, Math.max(level + 3, g + 4), z, B.AIR);
  }
}
