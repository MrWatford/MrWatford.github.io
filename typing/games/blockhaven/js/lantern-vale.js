// The first Kingdoms & Civilizations village is a single opt-in review site.
import { B, CHUNK, HEIGHT, HEAD, OPEN, TOP, make } from "./blocks.js";
import { hash3, hashSeed } from "./noise.js";

const FIRST_PREVIEW_GEN = 10;
export const KINGDOMS_GEN = 11;
export const LANTERN_VALE_SEED = "Lantern Vale 2";
const previewSeed = hashSeed(LANTERN_VALE_SEED);

export function isLanternVale(gen, village) {
  const vx = gen.version >= KINGDOMS_GEN ? 33 : 3;
  if (gen.version < FIRST_PREVIEW_GEN || gen.version > KINGDOMS_GEN || gen.seed !== previewSeed || village.vx !== vx || village.vz !== -3) return false;
  const minX = (village.vx - 1) * CHUNK;
  const minZ = (village.vz - 1) * CHUNK;
  const size = CHUNK * 3;
  return !(gen.stamps || []).some(s =>
    s.x < minX + size && s.x + s.size > minX &&
    s.z < minZ + size && s.z + s.size > minZ
  );
}

export function buildLanternValePlot(data, p, seed, x0, z0, jobBlock) {
  const put = (x, y, z, value) => {
    if (y + p.y > 0 && y + p.y < HEIGHT) data[x + z * CHUNK + (y + p.y) * CHUNK * CHUNK] = value;
  };
  const fill = (x1, y1, z1, x2, y2, z2, value) => {
    for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) put(x, y, z, value);
    }
  };
  const weatheredStone = (x, z) => hash3(seed, x0 + x, p.y, z0 + z) < .22 ? B.COBBLE : B.STONE_BRICKS;
  const paving = (x, z) => put(x, 0, z, hash3(seed, x0 + x, 73, z0 + z) < .27 ? B.GRAVEL : weatheredStone(x, z));
  for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
    const boundary = (p.dx === -1 && x === 0) || (p.dx === 1 && x === 15) ||
      (p.dz === -1 && z === 0) || (p.dz === 1 && z === 15);
    fill(x, -6, z, x, -1, z, boundary ? weatheredStone(x, z) : B.DIRT);
    put(x, 0, z, B.GRASS);
    fill(x, 1, z, x, 17, z, B.AIR);
    if (x === 2 || x === 3 || z === 13 || z === 14) paving(x, z);
    if (boundary && !(x === 2 || x === 3 || z === 13 || z === 14)) {
      fill(x, 0, z, x, 2 + Number((x + z) % 2 === 0), z, weatheredStone(x, z));
    }
  }

  const lamp = (x, z) => {
    put(x, 1, z, B.STONE_BRICKS);
    put(x, 2, z, B.OAK_FENCE);
    put(x, 3, z, B.BRAZIER);
  };
  const planter = (x, z) => {
    put(x, 0, z, B.MOSSY);
    put(x, 1, z, (x + z) % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  };

  if (p.type === "plaza") {
    for (let x = 3; x <= 13; x++) for (let z = 2; z <= 14; z++) paving(x, z);
    fill(6, -1, 5, 10, -1, 9, B.STONE_BRICKS);
    for (let x = 6; x <= 10; x++) for (let z = 5; z <= 9; z++) {
      const rim = x === 6 || x === 10 || z === 5 || z === 9;
      put(x, 0, z, rim ? B.STONE_BRICKS : B.WATER);
      if (rim) put(x, 1, z, B.STONE_STEP);
    }
    put(8, 1, 7, B.STONE_BRICKS);
    put(8, 2, 7, B.BRAZIER);
    put(11, 1, 11, B.BELL);
    for (const [start, trim] of [[4, B.WOOL], [9, B.CRIMSON_PLANKS]]) {
      for (const x of [start, start + 3]) fill(x, 1, 2, x, 3, 2, B.OAK_FENCE);
      for (let x = start; x <= start + 3; x++) fill(x, 4, 1, x, 4, 3, x % 2 ? trim : B.BIRCH_PLANKS);
      put(start + 1, 1, 2, B.TABLE);
      put(start + 2, 1, 2, B.CHEST);
    }
    lamp(4, 11);
    lamp(12, 5);
    return;
  }

  if (p.type === "farm") {
    for (let x = 3; x <= 12; x++) for (let z = 3; z <= 12; z++) {
      const edge = x === 3 || x === 12 || z === 3 || z === 12;
      put(x, 0, z, edge ? B.LOG : z === 7 ? B.WATER : make(B.FARMLAND, 1));
      if (!edge && z !== 7) put(x, 1, z, make(x < 8 ? B.WHEAT : B.CARROTS, 5 + (x + z) % 3));
    }
    put(3, 1, 3, B.COMPOSTER);
    put(12, 1, 12, B.HAY);
    lamp(13, 9);
    return;
  }

  const tall = p.prof === "cleric";
  const eaves = tall ? 6 : 4;
  for (let x = 4; x <= 10; x++) for (let z = 4; z <= 10; z++) {
    const corner = (x === 4 || x === 10) && (z === 4 || z === 10);
    const wall = x === 4 || x === 10 || z === 4 || z === 10;
    put(x, 0, z, B.PLANKS);
    if (!wall) continue;
    const window = x === 7 || z === 7;
    for (let y = 1; y <= eaves; y++) {
      put(x, y, z, corner || y === eaves ? B.LOG : y === 1 ? weatheredStone(x, z) :
        window && (y === 2 || y === eaves - 1) ? (tall ? B.STAINED_GLASS : B.GLASS) : B.BIRCH_PLANKS);
    }
  }
  const roof = p.prof === "smith" ? B.DARKSLATE_BRICKS : B.ROOF_TILES;
  for (let x = 3; x <= 11; x++) {
    const rise = 4 - Math.abs(x - 7);
    fill(x, eaves + 1 + rise, 3, x, eaves + 1 + rise, 11, roof);
    if (rise > 1) for (const z of [4, 10]) fill(x, eaves + 1, z, x, eaves + rise, z, x === 7 ? B.LOG : B.BIRCH_PLANKS);
  }
  fill(9, 2, 5, 9, eaves + 5, 5, B.BRICKS);
  const [doorX, doorZ, facing] = p.dx > 0 ? [4, 7, 3] : p.dx < 0 ? [10, 7, 1] : p.dz > 0 ? [7, 4, 2] : [7, 10, 0];
  put(doorX, 1, doorZ, make(B.DOOR, facing | OPEN));
  put(doorX, 2, doorZ, make(B.DOOR, facing | OPEN | TOP));
  for (let x = 3; x <= 12; x++) {
    paving(x, 11);
    if (x < 5 || x > 10) paving(x, 7);
  }
  for (let z = 4; z <= 13; z++) paving(11, z);
  for (const x of [5, 8, 10]) planter(x, 12);
  put(5, 1, 5, make(B.BED, 0));
  put(5, 1, 6, make(B.BED, HEAD));
  put(9, 1, 9, jobBlock);
  put(9, 1, 5, B.FURNACE);
  put(6, 1, 5, B.CHEST);
  put(8, 1, 5, B.BOOKSHELF);
  put(7, 1, 5, B.TABLE);
  put(9, 2, 9, B.TORCH);
  put(7, 0, 8, B.WOOL);
  lamp(12, 11);
}
