import { B, CHUNK, HEIGHT, SEA, HEAD, OPEN, TOP, WET, make } from "./blocks.js";
import { hash3 } from "./noise.js";

export const VILLAGE_OVERHAUL_GEN = 12;
export const VILLAGE_PROFESSIONS_GEN = 14;
export const VILLAGE_TERRAIN_GEN = 15;

const PLOTS = [
  ["farm", "farmer"], ["house", "cleric"], ["house", "shepherd"], ["house", "smith"],
  ["garden", "farmer"], ["house", "fletcher"], ["house", "farmer"], ["house", "shepherd"]
];
const AROUND = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
const PALETTES = {
  plains: { stone: B.STONE_BRICKS, worn: B.COBBLE, timber: B.LOG, wall: B.BIRCH_PLANKS, roof: B.ROOF_TILES, ground: B.GRASS },
  forest: { stone: B.COBBLE, worn: B.MOSSY, timber: B.LOG, wall: B.PLANKS, roof: B.DARKSLATE_BRICKS, ground: B.GRASS },
  birch: { stone: B.STONE_BRICKS, worn: B.MOSSY, timber: B.BIRCH_LOG, wall: B.BIRCH_PLANKS, roof: B.ROOF_TILES, ground: B.GRASS },
  sandy: { stone: B.SANDSTONE, worn: B.TEMPLE_STONE, timber: B.LOG, wall: B.TEMPLE_STONE, roof: B.ROOF_TILES, ground: B.SAND }
};

export function villagePlotHasLandmark(seed, cx, cz) {
  return hash3(seed, cx, 99, cz) < .035 || hash3(seed, cx, 77, cz) < .02;
}

function terrainPlan(gen, village, cache) {
  const { vx, vz } = village;
  const key = vx + "," + vz;
  if (cache.has(key)) return cache.get(key);
  const x = vx * CHUNK + 8, z = vz * CHUNK + 8;
  const center = gen.column(x, z);
  const levels = [];
  let gentle = true;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const px = x + dx * CHUNK, pz = z + dz * CHUNK;
    const y = Math.max(SEA + 1, gen.column(px, pz).h);
    let low = y, high = y;
    for (let oz = -8; oz <= 7; oz += 3) for (let ox = -8; ox <= 7; ox += 3) {
      const h = gen.column(px + ox, pz + oz).h;
      low = Math.min(low, h);
      high = Math.max(high, h);
    }
    if (low < SEA - 1 || center.h - low > 9 || high - center.h > 9) gentle = false;
    levels.push(low >= SEA - 6 && high - low <= 15 && y < HEIGHT - 19 ? y : null);
  }
  const plan = {
    y: center.h, biome: center.biome, levels, gentle,
    slope: levels[7] >= levels[1] ? 1 : -1,
    shift: Math.floor(hash3(gen.seed, vx, 1212, vz) * PLOTS.length)
  };
  if (cache.size >= 256) cache.clear();
  cache.set(key, plan);
  return plan;
}

function villagePlotReserved(gen, minX, minZ, size = CHUNK) {
  return gen.stamps?.some(s => s.x < minX + size && s.x + s.size > minX &&
    s.z < minZ + size && s.z + s.size > minZ);
}

export function detailedVillagePiece(gen, village, cx, cz, cache, legacy, layoutVersion = gen.version) {
  // New and explicitly renovated plots can work around nearby landmarks one plot at a time.
  const singlePlot = !!legacy || gen.version >= VILLAGE_PROFESSIONS_GEN;
  const minX = (singlePlot ? cx : village.vx - 1) * CHUNK;
  const minZ = (singlePlot ? cz : village.vz - 1) * CHUNK;
  const size = (singlePlot ? 1 : 3) * CHUNK;
  if (villagePlotReserved(gen, minX, minZ, size)) return null;
  const plan = terrainPlan(gen, village, cache);
  const dx = cx - village.vx, dz = cz - village.vz, x0 = cx * CHUNK, z0 = cz * CHUNK;
  const i = AROUND.findIndex(([x, z]) => x === dx && z === dz);
  const slot = (i + plan.shift) % PLOTS.length;
  const [type, earlierProf] = legacy ? [legacy.type, legacy.prof] : i === -1 ? ["plaza", "cleric"] : PLOTS[slot];
  const modern = !legacy && i !== -1 && gen.version >= VILLAGE_PROFESSIONS_GEN;
  const prof = modern && slot === 6 ? "beekeeper" : modern && slot === 7 ? "scribe" : earlierProf;
  const level = plan.gentle ? plan.y + dz * plan.slope : plan.levels[(dx + 1) + (dz + 1) * 3];
  const compact = level === null;
  if (compact && layoutVersion < VILLAGE_TERRAIN_GEN && !legacy) return null;
  const natural = compact ? gen.column(x0 + 8, z0 + 8).h : null;
  const y = compact ? Math.max(SEA + 1, Math.min(HEIGHT - 12, natural)) : legacy?.y ?? level;
  const p = { type, prof, dx, dz, y, biome: plan.biome, detailed: true, rough: !!legacy || !plan.gentle,
    center: [village.vx * CHUNK + 8, village.vz * CHUNK + 8] };
  if (compact) {
    p.compact = true;
    p.waterside = natural <= SEA + 2;
    p.entry = [x0 + 7.5, y + 1, z0 + 12.5];
  }
  if (type === "house") {
    p.bed = [x0 + 5, y + 1, z0 + 5];
    p.job = [x0 + 10, y + 1, z0 + 6];
    p.home = [x0 + 7.5, y + 1, z0 + 8.5];
  } else if (type === "farm") {
    p.job = [x0 + 3, y + 1, z0 + 3];
    p.home = [x0 + 6.5, y + 1, z0 + 12.5];
  } else {
    p.home = [x0 + 6.5, y + 1, z0 + 12.5];
  }
  return p;
}

export function buildDetailedVillage(data, p, cols, seed, x0, z0, jobBlock) {
  const palette = PALETTES[p.biome];
  const { timber, wall, roof, ground, stone, worn } = palette;
  const desert = p.biome === "sandy";
  const at = (x, y, z) => x + z * CHUNK + (y + p.y) * CHUNK * CHUNK;
  const put = (x, y, z, block) => {
    if (y + p.y > 0 && y + p.y < HEIGHT) data[at(x, y, z)] = block;
  };
  const fill = (x1, y1, z1, x2, y2, z2, block) => {
    for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) put(x, y, z, block);
    }
  };
  const mixedStone = (x, z) => hash3(seed, x0 + x, 822, z0 + z) < .22 ? worn : stone;
  const paving = (x, z) => put(x, 0, z, mixedStone(x, z));
  for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
    const natural = cols[x + z * CHUNK].h - p.y;
    const road = x === 1 || x === 2 || z === 13 || z === 14;
    const edge = Math.min(p.dx < 0 ? x : 15, p.dx > 0 ? 15 - x : 15,
      p.dz < 0 ? z : 15, p.dz > 0 ? 15 - z : 15);
    // Blend lanes back into the landscape at gates and between independently leveled rough plots.
    const approach = p.rough ? Math.min(x, z, 15 - x, 15 - z) : edge;
    const run = p.rough ? 6 : 4;
    const ramp = road && approach < run ? Math.round(natural * (run - approach) / run) : 0;
    const retaining = edge === 0 && !road;
    const soil = desert ? B.SANDSTONE : B.DIRT;
    fill(x, Math.min(natural, ramp) - 3, z, x, ramp - 1, z, retaining ? mixedStone(x, z) : soil);
    put(x, ramp, z, (road || retaining) ? mixedStone(x, z) : ground);
    fill(x, ramp + 1, z, x, Math.max(natural, ramp) + 10, z, B.AIR);
    if (retaining) {
      fill(x, 1, z, x, 1 + Number((x + z) % 3 === 0), z, mixedStone(x, z));
    }
  }

  function lamp(x, z) {
    put(x, 1, z, stone);
    put(x, 2, z, B.OAK_FENCE);
    put(x, 3, z, B.BRAZIER);
  }
  function planter(x, z) {
    put(x, 0, z, desert ? B.SANDSTONE : B.GRASS);
    put(x, 1, z, (x + z) % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  }
  function awning(x, z, trim) {
    fill(x, 1, z, x, 3, z, B.OAK_FENCE);
    fill(x + 4, 1, z, x + 4, 3, z, B.OAK_FENCE);
    for (let i = 0; i <= 4; i++) fill(x + i, 4, z - 1, x + i, 4, z + 1, i % 2 ? trim : B.WOOL);
    put(x + 1, 1, z, B.TABLE);
    put(x + 3, 1, z, B.CHEST);
  }
  if (p.type === "plaza") {
    for (let x = 3; x <= 13; x++) for (let z = 2; z <= 12; z++) paving(x, z);
    fill(6, -1, 5, 10, -1, 9, stone);
    for (let x = 6; x <= 10; x++) for (let z = 5; z <= 9; z++) {
      const rim = x === 6 || x === 10 || z === 5 || z === 9;
      put(x, 0, z, rim ? stone : B.WATER);
      if (rim) put(x, 1, z, desert ? B.TEMPLE_STEP : B.STONE_STEP);
    }
    put(8, 1, 7, stone);
    put(8, 2, 7, B.BRAZIER);
    put(12, 1, 10, B.BELL);
    awning(3, 3, B.CRIMSON_PLANKS);
    awning(9, 3, desert ? B.WARPED_PLANKS : B.BIRCH_PLANKS);
    lamp(4, 10);
    lamp(12, 6);
    planter(4, 12);
    planter(11, 12);
    return;
  }
  if (p.type === "farm") {
    for (let x = 3; x <= 12; x++) for (let z = 3; z <= 12; z++) {
      const edge = x === 3 || x === 12 || z === 3 || z === 12;
      put(x, 0, z, edge ? stone : z === 7 ? B.WATER : make(B.FARMLAND, WET));
      if (!edge && z !== 7) put(x, 1, z, make(x < 8 ? B.WHEAT : B.CARROTS, 4 + (x + z) % 4));
    }
    put(3, 1, 3, jobBlock);
    fill(10, 1, 3, 11, 2, 3, B.HAY);
    lamp(13, 11);
    return;
  }
  if (p.type === "garden") {
    for (let x = 4; x <= 12; x++) for (let z = 4; z <= 11; z++) {
      if (x === 8 || z === 8) paving(x, z);
      else if (x === 4 || x === 12 || z === 4 || z === 11) planter(x, z);
    }
    const leaf = p.biome === "birch" ? B.BIRCH_LEAVES : B.LEAVES;
    for (const x of [6, 10]) {
      fill(x, 1, 6, x, 4, 6, timber);
      fill(x - 1, 3, 5, x + 1, 4, 7, leaf);
      put(x, 5, 6, leaf);
    }
    fill(6, 1, 10, 10, 1, 10, desert ? B.TEMPLE_STEP : B.STONE_STEP);
    lamp(8, 12);
    return;
  }

  const chapel = p.prof === "cleric", smithy = p.prof === "smith", loft = p.prof === "fletcher";
  const width = chapel || smithy ? 9 : 8, right = 3 + width;
  const back = p.prof === "shepherd" ? 4 : 3;
  const eaves = chapel || loft || p.prof === "scribe" ? 6 : smithy ? 4 : 5;
  for (let x = 4; x <= right; x++) for (let z = back; z <= 10; z++) {
    const front = z === 10, end = front || z === back, side = x === 4 || x === right;
    put(x, 0, z, desert ? stone : B.PLANKS);
    if (!end && !side) continue;
    const window = end ? x === 6 || x === right - 2 : z === 6 || z === 8;
    for (let y = 1; y <= eaves; y++) {
      const material = y === 1 ? mixedStone(x, z) : y === eaves || (end && side) ? timber :
        window && (y === 3 || (chapel && y === 4)) ? (chapel ? B.STAINED_GLASS : B.GLASS) : wall;
      put(x, y, z, material);
    }
  }
  const roofBlock = smithy ? B.DARKSLATE_BRICKS : loft ? B.ROOF_TILES : roof;
  if (desert && !chapel) {
    fill(3, eaves + 1, back - 1, right + 1, eaves + 1, 11, B.SANDSTONE);
    for (let x = 3; x <= right + 1; x += 2) for (const z of [back - 1, 11]) put(x, eaves + 2, z, B.TEMPLE_TRIM);
  } else {
    for (let x = 3; x <= right + 1; x++) {
      const rise = Math.min(x - 3, right + 1 - x);
      fill(x, eaves + 1 + rise, back - 1, x, eaves + 1 + rise, 11, roofBlock);
      if (rise > 0) for (const z of [back, 10]) {
        fill(x, eaves + 1, z, x, eaves + rise, z, x === 8 ? timber : wall);
      }
    }
  }
  put(7, 1, 10, make(B.DOOR, OPEN));
  put(7, 2, 10, make(B.DOOR, OPEN | TOP));
  for (let x = 5; x <= 11; x++) paving(x, 11);
  for (const x of [7, 8]) paving(x, 12);
  for (const x of [5, 10, 11]) planter(x, 12);
  put(5, 1, 5, make(B.BED, 0));
  put(5, 1, 6, make(B.BED, HEAD));
  put(10, 1, 6, jobBlock);
  put(10, 2, 6, B.TORCH);
  put(6, 1, 5, B.CHEST);
  put(8, 1, 5, B.BOOKSHELF);
  put(9, 1, 5, B.TABLE);
  fill(7, 0, 7, 8, 0, 8, B.WOOL);
  if (smithy) {
    fill(9, 1, 10, 11, 3, 10, B.AIR);
    put(11, 1, 8, B.FURNACE);
    fill(11, 2, 8, 11, eaves + 4, 8, B.BRICKS);
    put(10, 1, 11, B.BRAZIER);
  } else if (chapel) {
    for (let x = 6; x <= 10; x++) for (let z = 4; z <= 8; z++) {
      if (x === 6 || x === 10 || z === 4 || z === 8) fill(x, 9, z, x, 13, z, stone);
    }
    for (const x of [7, 8, 9]) for (const z of [4, 8]) fill(x, 11, z, x, 12, z, B.AIR);
    put(8, 11, 7, B.BELL);
    fill(5, 14, 3, 11, 14, 9, roof);
    fill(6, 15, 4, 10, 15, 8, roof);
    fill(7, 16, 5, 9, 16, 7, roof);
    put(8, 17, 6, B.BRAZIER);
  } else if (p.prof === "scribe") {
    fill(9, 1, 4, 10, 2, 4, B.BOOKSHELF);
    put(9, 1, 8, B.MAP_TABLE);
    put(10, 1, 8, B.CHEST);
  } else if (p.prof === "beekeeper") {
    for (const z of [5, 7, 9]) planter(13, z);
    put(13, 1, 6, B.LOG);
    put(13, 2, 6, make(B.BEE_NEST, 1));
    put(8, 1, 9, B.TABLE);
  } else if (loft) {
    fill(5, 3, 4, 8, 3, 7, B.PLANKS);
    fill(5, 4, 8, 8, 4, 8, B.OAK_FENCE);
    for (let step = 0; step < 6; step++) {
      const z = 9 - step, rise = Math.ceil((step + 1) / 2);
      fill(9, 1, z, 9, rise, z, stone);
      if (step % 2 === 0) put(9, rise, z, desert ? B.TEMPLE_STEP : B.STONE_STEP);
    }
    put(5, 4, 4, B.BOOKSHELF);
    put(6, 4, 4, B.CHEST);
    put(8, 4, 5, B.TORCH);
    put(8, 1, 9, B.TABLE);
  } else {
    put(10, 1, 8, B.FURNACE);
    fill(10, 2, 8, 10, eaves + 5, 8, B.BRICKS);
  }
  if (p.prof === "shepherd") {
    for (const z of [5, 6, 7, 8]) planter(13, z);
    fill(14, 1, 4, 14, 1, 9, B.OAK_FENCE);
  }
  lamp(13, 10);
}

export function buildCompactVillage(data, p, cols, seed, x0, z0, jobBlock) {
  const { stone, worn, timber, wall, roof, ground } = PALETTES[p.biome];
  const dry = p.biome === "sandy";
  const put = (x, y, z, block) => {
    if (y > 0 && y < HEIGHT) data[x + z * CHUNK + y * CHUNK * CHUNK] = block;
  };
  const fill = (x1, y1, z1, x2, y2, z2, block) => {
    for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) put(x, y, z, block);
    }
  };
  const y = p.y, heightAt = (x, z) => cols[x + z * CHUNK].h;
  const paving = (x, z) => hash3(seed, x0 + x, 86, z0 + z) < .25 ? worn : stone;
  // Support a small court or house on piers. Keep the shoreline and the sides of the hill around it.
  for (let z = 3; z <= 12; z++) for (let x = 3; x <= 12; x++) {
    const h = heightAt(x, z);
    const perimeter = x === 3 || x === 12 || z === 3 || z === 12;
    if (h < y) {
      const pier = (x === 3 || x === 8 || x === 12) && (z === 3 || z === 7 || z === 12);
      if (pier || h >= SEA) fill(x, h + 1, z, x, y - 1, z, perimeter || pier ? stone : B.DIRT);
    }
    put(x, y, z, perimeter ? paving(x, z) : p.waterside ? B.PLANKS : ground);
    fill(x, y + 1, z, x, Math.max(y + 10, h + 8), z, B.AIR);
  }
  // One-block grades at the stairs where possible. The remaining apron keeps its natural contours.
  function approach(dx, dz) {
    for (let i = 0; i < 3; i++) for (const t of [7, 8]) {
      const x = dx < 0 ? 2 - i : dx > 0 ? 13 + i : t;
      const z = dz < 0 ? 2 - i : dz > 0 ? 13 + i : t;
      const natural = heightAt(x, z);
      const surface = Math.max(SEA + 1, y + Math.max(-(i + 1), Math.min(i + 1, natural - y)));
      fill(x, Math.min(natural, surface), z, x, surface - 1, z, stone);
      put(x, surface, z, p.waterside ? B.PLANKS : paving(x, z));
      fill(x, surface + 1, z, x, Math.max(surface + 3, natural + 7), z, B.AIR);
    }
  }
  if (p.type === "plaza") {
    for (const [dx, dz] of [[1,0], [-1,0], [0,1], [0,-1]]) approach(dx, dz);
  } else {
    approach(0, 1);
    if (p.dx) approach(-Math.sign(p.dx), 0);
    else if (p.dz > 0) approach(0, -1);
  }
  function lamp(x, z) {
    put(x, y + 1, z, stone);
    put(x, y + 2, z, B.OAK_FENCE);
    put(x, y + 3, z, B.BRAZIER);
  }
  function box(x, z, crop) {
    put(x, y, z, dry ? stone : B.GRASS);
    put(x, y + 1, z, crop);
  }

  if (p.type === "farm") {
    for (let z = 4; z <= 11; z++) for (let x = 4; x <= 11; x++) {
      put(x, y, z, z === 7 ? B.WATER : make(B.FARMLAND, WET));
      if (z !== 7) put(x, y + 1, z, make(x < 8 ? B.WHEAT : B.CARROTS, 5 + (x + z) % 3));
    }
    put(3, y + 1, 3, jobBlock);
    put(12, y + 1, 5, B.HAY);
    put(12, y + 1, 6, B.HAY);
    lamp(12, 10);
    return;
  }
  if (p.type === "garden") {
    for (const z of [5, 8]) for (let x = 4; x <= 11; x++) box(x, z, x % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
    for (const x of [5, 10]) {
      fill(x, y + 1, 6, x, y + 3, 6, timber);
      fill(x - 1, y + 3, 5, x + 1, y + 4, 7, B.LEAVES);
    }
    put(7, y + 1, 10, B.STONE_STEP);
    put(8, y + 1, 10, B.STONE_STEP);
    lamp(11, 11);
    return;
  }
  if (p.type === "plaza") {
    fill(4, y, 4, 11, y, 11, stone);
    fill(6, y - 1, 6, 9, y - 1, 9, stone);
    fill(7, y, 7, 8, y, 8, B.WATER);
    for (const x of [6, 9]) for (const z of [6, 9]) fill(x, y + 1, z, x, y + 3, z, timber);
    fill(6, y + 4, 6, 9, y + 4, 9, roof);
    for (let x = 4; x < 11; x++) put(x, y + 4, 4, x % 2 ? B.CRIMSON_PLANKS : B.WOOL);
    for (const x of [4, 10]) fill(x, y + 1, 4, x, y + 3, 4, B.OAK_FENCE);
    put(5, y + 1, 4, B.TABLE);
    put(9, y + 1, 4, B.CHEST);
    put(11, y + 1, 10, B.BELL);
    lamp(4, 10);
    return;
  }

  const tiles = p.prof === "smith" ? B.DARKSLATE_BRICKS : roof;
  const eaves = p.prof === "cleric" ? 5 : 4;
  fill(4, y, 4, 11, y, 10, dry ? stone : B.PLANKS);
  for (const z of [4, 10]) fill(4, y + 1, z, 11, y + eaves, z, wall);
  for (const x of [4, 11]) fill(x, y + 1, 4, x, y + eaves, 10, wall);
  for (const x of [4, 11]) for (const z of [4, 10]) fill(x, y + 1, z, x, y + eaves, z, timber);
  for (const x of [4, 11]) for (const z of [6, 8]) {
    put(x, y + 2, z, p.prof === "cleric" ? B.STAINED_GLASS : B.GLASS);
    put(x, y + 3, z, timber);
  }
  for (let x = 3; x <= 12; x++) {
    const rise = Math.min(x - 3, 12 - x);
    fill(x, y + eaves + 1 + rise, 3, x, y + eaves + 1 + rise, 11, tiles);
    for (const z of [4, 10]) fill(x, y + eaves + 1, z, x, y + eaves + rise, z, x === 8 ? timber : wall);
  }
  put(7, y + 1, 10, make(B.DOOR, OPEN));
  put(7, y + 2, 10, make(B.DOOR, OPEN | TOP));
  for (const x of [7, 8]) for (const z of [11, 12]) put(x, y, z, paving(x, z));
  put(5, y + 1, 5, make(B.BED, 0));
  put(5, y + 1, 6, make(B.BED, HEAD));
  put(6, y + 1, 5, B.CHEST);
  put(8, y + 1, 5, B.BOOKSHELF);
  put(10, y + 1, 6, jobBlock);
  put(10, y + 2, 6, B.TORCH);
  put(10, y + 1, 8, B.FURNACE);
  fill(10, y + 2, 8, 10, y + eaves + 4, 8, B.BRICKS);
  if (p.prof === "scribe") put(8, y + 1, 8, B.MAP_TABLE);
  if (p.prof === "beekeeper") {
    put(12, y + 1, 6, timber);
    put(12, y + 2, 6, make(B.BEE_NEST, 1));
    box(12, 8, B.FLOWER_YELLOW);
  }
  box(5, 12, B.FLOWER_RED);
  box(10, 12, B.FLOWER_YELLOW);
  lamp(12, 11);
}
