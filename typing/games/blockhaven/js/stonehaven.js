// Stonehaven occupies one reserved, saved Overworld site.
import { B, CHUNK, HEIGHT, SEA, HEAD, OPEN, TOP, make } from "./blocks.js";
import { hash3, hashSeed } from "./noise.js";
import { KINGDOMS_GEN, LANTERN_VALE_SEED } from "./lantern-vale.js";
import { untouchedFootprint } from "./structure-placement.js";

export const STONEHAVEN_GEN = 13;
const PREVIEW_LAYOUT = 1, CAPITAL_LAYOUT = 2, CORE = 80, PAD = 16;
const PREVIEW = { v: PREVIEW_LAYOUT, x: -544, z: 192, y: 36 };
const SIZE = CORE + PAD * 2;
const KEEP = 65535;
const LANES = [12, 58];
const HOMES = [
  { z: 20, job: B.LOOM, resident: "shepherd" },
  { z: 32, job: B.SMITH_TABLE, resident: "smith" },
  { z: 52, job: B.FLETCH_TABLE, resident: "fletcher" }
];
const DISTRICTS = [
  { x: -12, z: 34, w: 13, d: 10, job: B.SMITH_TABLE, resident: "smith", roof: B.DARKSLATE_BRICKS },
  { x: 79, z: 34, w: 13, d: 10, job: B.ALTAR, resident: "cleric", roof: B.ROOF_TILES }
];
const GUARDS = [[35, 62], [45, 62]];
const PREVIEW_SEED = hashSeed(LANTERN_VALE_SEED);

const sizeOf = plot => plot.v === CAPITAL_LAYOUT ? SIZE : CORE;
const padOf = plot => plot.v === CAPITAL_LAYOUT ? PAD : 0;
const validCapital = (plot, seed) => plot?.v === CAPITAL_LAYOUT && plot.seed === seed && Number.isSafeInteger(plot.x) &&
  Number.isSafeInteger(plot.z) && plot.x % CHUNK === 0 && plot.z % CHUNK === 0 &&
  Math.abs(plot.x) <= 4096 && Math.abs(plot.z) <= 4096 && Number.isInteger(plot.y) && plot.y >= 32 && plot.y <= 38;
const intersects = (plot, stamp) => plot.x < stamp.x + stamp.size && stamp.x < plot.x + sizeOf(plot) &&
  plot.z < stamp.z + stamp.size && stamp.z < plot.z + sizeOf(plot);

function destination(plot) {
  const pad = padOf(plot);
  return {
    kind: "stonehaven", title: "Stonehaven", name: "South Gate",
    x: plot.x + pad + 40.5, y: plot.y + 1, z: plot.z + pad + 73.5,
    guide: plot.v === CAPITAL_LAYOUT
      ? "The South Gate leads to the market square. Take the keep stairs up to the galleries and Crown Tower, or follow the side gates to the Records Hall and Forge Court."
      : "The road through the South Gate leads into the market square. Continue north up the broad steps to the keep, or turn east or west into the garden lanes."
  };
}

export function stonehavenDestination(meta, story) {
  if (meta?.gen === KINGDOMS_GEN && meta.seed === LANTERN_VALE_SEED && story?.stonehaven === PREVIEW_LAYOUT) {
    return destination(PREVIEW);
  }
  return meta?.gen >= STONEHAVEN_GEN && validCapital(story?.stonehaven, hashSeed(meta.seed)) ? destination(story.stonehaven) : null;
}

function clearFootprint(gen, plot, untouched) {
  const size = sizeOf(plot);
  if (gen.stamps.some(s => intersects(plot, s)) ||
      !untouched(plot.x, plot.z, plot.x + size, plot.z + size)) return false;
  // Leave the underlying stronghold's corridors and its surface reserve alone.
  if (plot.v === CAPITAL_LAYOUT && gen.strongholds.some(s =>
    s.x >= plot.x - 56 && s.x < plot.x + size + 56 && s.z >= plot.z - 56 && s.z < plot.z + size + 56)) return false;
  for (let z = plot.z / CHUNK; z < (plot.z + size) / CHUNK; z++) {
    for (let x = plot.x / CHUNK; x < (plot.x + size) / CHUNK; x++) {
      if (gen.villageAt(x, z) || hash3(gen.seed, x, 99, z) < .035 || hash3(gen.seed, x, 77, z) < .02) return false;
    }
  }
  return true;
}

function findCapital(gen, data) {
  const untouched = untouchedFootprint(data);
  const turn = Math.floor(hash3(gen.seed, 127, 13, 127) * 4);
  for (let r = 23; r <= 191; r++) {
    for (let i = 0; i < 4; i++) for (let d = -r; d < r; d += 2) {
      const side = (i + turn) % 4;
      const cx = side === 0 ? d : side === 1 ? r : side === 2 ? -d : -r;
      const cz = side === 0 ? -r : side === 1 ? d : side === 2 ? r : -d;
      const x = cx * CHUNK, z = cz * CHUNK;
      const center = gen.column(x + SIZE / 2, z + SIZE / 2).h;
      if (center < SEA || center > 43) continue;
      const plot = { v: CAPITAL_LAYOUT, seed: gen.seed, x, z, y: Math.max(32, Math.min(38, center)) };
      if (!clearFootprint(gen, plot, untouched)) continue;
      let fit = true;
      for (let dz = 1; dz < SIZE && fit; dz += 7) for (let dx = 1; dx < SIZE; dx += 7) {
        const h = gen.column(x + dx, z + dz).h;
        if (h < SEA - 3 || Math.abs(h - plot.y) > 12) { fit = false; break; }
      }
      if (fit && gen.column(x + PAD + 40, z + PAD + 77).h >= SEA) return plot;
    }
  }
  return null;
}

// Later landmark searches must honor the saved capital without marking its chunks visited.
export function stonehavenPlacementData(gen, data, story) {
  const plot = story.stonehaven;
  if (gen.version < STONEHAVEN_GEN || !validCapital(plot, gen.seed)) return data;
  const visited = [...(data.visited || [])];
  for (let z = plot.z / CHUNK; z < (plot.z + SIZE) / CHUNK; z++) {
    for (let x = plot.x / CHUNK; x < (plot.x + SIZE) / CHUNK; x++) visited.push(x + "," + z);
  }
  return { ...data, visited };
}

export function prepareStonehaven(gen, data, story) {
  const preview = gen.version === KINGDOMS_GEN && gen.seed === PREVIEW_SEED;
  if (!preview && gen.version < STONEHAVEN_GEN) return;
  const stamps = gen.stamps ||= [];
  let plot;
  if (preview) {
    plot = PREVIEW;
    if (story.stonehaven !== PREVIEW_LAYOUT && !clearFootprint(gen, plot, untouchedFootprint(data))) return;
  } else if (Object.hasOwn(story, "stonehaven")) {
    if (!validCapital(story.stonehaven, gen.seed)) return;
    plot = story.stonehaven;
  } else {
    plot = findCapital(gen, data);
    if (!plot) { story.stonehaven = null; return; }
  }
  if (stamps.some(s => intersects(plot, s))) return;
  story.stonehaven = preview ? PREVIEW_LAYOUT : plot;
  gen.stonehavenSite = plot;
  gen.stonehaven = destination(plot);
  stamps.push({ x: plot.x, z: plot.z, size: sizeOf(plot), cells: buildStonehaven(gen, plot) });
}

export function stonehavenCovers(gen, x, z) {
  const plot = gen.stonehavenSite;
  return !!plot && x >= plot.x && z >= plot.z && x < plot.x + sizeOf(plot) && z < plot.z + sizeOf(plot);
}

// Null means the chunk is outside the city and gets normal natural spawns.
export function stonehavenResidents(gen, cx, cz) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  if (!stonehavenCovers(gen, x0, z0)) return null;
  const plot = gen.stonehavenSite, pad = padOf(plot), y = plot.y + 1;
  const xCore = plot.x + pad, zCore = plot.z + pad;
  const residents = [];
  const add = (species, x, z, job) => {
    const wx = xCore + x, wz = zCore + z;
    if (wx >= x0 && wx < x0 + CHUNK && wz >= z0 && wz < z0 + CHUNK) {
      residents.push({ species, home: [wx + .5, y, wz + .5], job });
    }
  };
  for (const x of LANES) for (const { z, resident } of HOMES) {
    add(resident, x + 4, z + 5, [xCore + x + 3, y, zCore + z + 1]);
  }
  for (const [x, z] of GUARDS) add("golem", x, z);
  if (plot.v === CAPITAL_LAYOUT) for (const { x, z, resident } of DISTRICTS) {
    add(resident, x + 6, z + 6, [xCore + x + 3, y, zCore + z + 1]);
  }
  return residents;
}

function buildStonehaven(gen, plot) {
  const size = sizeOf(plot), pad = padOf(plot), expanded = plot.v === CAPITAL_LAYOUT;
  const { x: minX, z: minZ, y: ground } = plot;
  const cells = new Uint16Array(size * size * HEIGHT).fill(KEEP);
  const put = (x, y, z, block) => { cells[x + pad + (z + pad + y * size) * size] = block; };
  const fill = (x1, y1, z1, x2, y2, z2, block) => {
    for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) {
      for (let x = x1; x <= x2; x++) put(x, y, z, block);
    }
  };
  const stone = (x, z) => hash3(gen.seed, minX + pad + x, ground, minZ + pad + z) < .18 ? B.CRACKED_BRICKS : B.STONE_BRICKS;
  for (let z = -pad; z < CORE + pad; z++) for (let x = -pad; x < CORE + pad; x++) {
    const core = x >= 0 && z >= 0 && x < CORE && z < CORE;
    const wing = expanded && z >= 25 && z <= 63 && (x <= 8 || x >= 71);
    if (!core && !wing) continue;
    const edge = wing ? Math.min(x + pad, CORE + pad - 1 - x, z - 25, 63 - z) :
      Math.min(x, CORE - 1 - x, z, CORE - 1 - z);
    const natural = gen.column(minX + pad + x, minZ + pad + z).h;
    const terrace = x >= 22 && x <= 57 && z >= 10 && z <= 39;
    const ramp = z >= 34 && x >= 35 && x <= 45;
    const grade = terrace ? (ramp ? Math.min(3, Math.floor((40 - z) / 2)) : 3) : 0;
    const blend = wing ? 3 : 7;
    const southApproach = expanded && x >= 36 && x <= 44 && z >= 72;
    const floor = southApproach ? Math.round(ground + (natural - ground) * Math.max(0, z - 74) / 5) :
      edge < blend ? Math.round(natural + (ground - natural) * edge / blend) : ground + grade;
    const lane = z >= 17 && z <= 64 && ((x >= 9 && x <= 11) || (x >= 68 && x <= 70));
    const street = lane || (x >= 36 && x <= 44) || (z >= 43 && z <= 48);
    const plaza = x >= 25 && x <= 54 && z >= 43 && z <= 65;
    const bank = terrace && (x === 22 || x === 57 || z === 10 || z === 39);
    fill(x, Math.max(1, Math.min(natural, floor) - 3), z, x, floor - 1, z, bank ? stone(x, z) : B.DIRT);
    put(x, floor, z, street || plaza || bank ? stone(x, z) : B.GRASS);
    fill(x, floor + 1, z, x, Math.max(natural, floor) + 11, z, B.AIR);
  }

  function lamp(x, y, z) {
    put(x, y + 1, z, B.STONE_BRICKS);
    put(x, y + 2, z, B.OAK_FENCE);
    put(x, y + 3, z, B.BRAZIER);
  }
  function door(x, y, z) {
    put(x, y + 1, z, make(B.DOOR, OPEN));
    put(x, y + 2, z, make(B.DOOR, OPEN | TOP));
  }
  function chamber(x, y, z, w, d, h, wall, window) {
    for (let dz = 0; dz < d; dz++) for (let dx = 0; dx < w; dx++) {
      put(x + dx, y, z + dz, B.PLANKS);
      const edgeX = dx === 0 || dx === w - 1;
      const edgeZ = dz === 0 || dz === d - 1;
      if (!edgeX && !edgeZ) continue;
      const bay = (edgeX && dz % 3 === 2) || (edgeZ && dx % 3 === 2);
      for (let k = 1; k <= h; k++) {
        const block = k <= 1 ? stone(x + dx, z + dz) :
          edgeX && edgeZ ? (wall === B.BIRCH_PLANKS ? B.LOG : B.STONE_BRICKS) :
          bay && k % 5 >= 2 && k % 5 <= 3 ? window :
          wall === B.CRACKED_BRICKS && k % 5 === 4 ? B.STONE_BRICKS : wall;
        put(x + dx, y + k, z + dz, block);
      }
    }
  }
  function roof(x, y, z, w, d, material) {
    for (let dx = -1; dx <= w; dx++) {
      const rise = Math.min(dx + 1, w - dx);
      fill(x + dx, y + rise, z - 1, x + dx, y + rise, z + d, material);
      if (rise > 0) for (const end of [z, z + d - 1]) {
        fill(x + dx, y, end, x + dx, y + rise - 1, end, dx === Math.floor(w / 2) ? B.LOG : B.PLANKS);
      }
    }
  }
  function furnish(x, y, z, job, bedroom = false) {
    put(x + 1, y + 1, z + 1, B.BOOKSHELF);
    put(x + 2, y + 1, z + 1, B.CHEST);
    put(x + 3, y + 1, z + 1, job);
    put(x + 4, y + 1, z + 1, B.BRAZIER);
    if (bedroom) {
      put(x + 1, y + 1, z + 3, make(B.BED, 0));
      put(x + 1, y + 1, z + 4, make(B.BED, HEAD));
    }
    put(x + 3, y, z + 3, B.WOOL);
  }
  function tower(x, y, z, w, h, material, climbable = false) {
    chamber(x, y, z, w, w, h, B.CRACKED_BRICKS, B.STAINED_GLASS);
    door(x + Math.floor(w / 2), y, z + w - 1);
    furnish(x, y, z, B.TABLE);
    if (climbable) {
      const ring = [];
      for (let i = 7; i >= 1; i--) ring.push([7, i]);
      for (let i = 6; i >= 1; i--) ring.push([i, 1]);
      for (let i = 2; i <= 7; i++) ring.push([1, i]);
      for (let i = 2; i <= 6; i++) ring.push([i, 7]);
      for (let step = 0; step < 28; step++) {
        const [dx, dz] = ring[step % ring.length];
        const rise = Math.ceil((step + 1) / 2);
        put(x + dx, y + rise, z + dz, step % 2 === 0 ? B.STONE_STEP : B.STONE_BRICKS);
      }
      for (const floor of [4, 10, 14]) {
        fill(x + 2, y + floor, z + 2, x + 6, y + floor, z + 6, B.PLANKS);
        put(x + 4, y + floor, z + 4, B.WOOL);
        put(x + 3, y + floor + 1, z + 4, B.BOOKSHELF);
        put(x + 5, y + floor + 1, z + 4, B.CHEST);
        put(x + 4, y + floor + 1, z + 5, B.TORCH);
      }
    } else {
      for (let step = 0; step < w - 3; step++) {
        fill(x + w - 2, y + 1, z + w - 3 - step, x + w - 2, y + 1 + Math.floor(step / 2), z + w - 3 - step, B.STONE_BRICKS);
        if (step % 2 === 0) put(x + w - 2, y + 1 + Math.floor(step / 2), z + w - 3 - step, B.STONE_STEP);
      }
      for (let floor = 5; floor < h; floor += 5) {
        fill(x + 1, y + floor, z + 1, x + w - 2, y + floor, z + w - 2, B.PLANKS);
      }
    }
    fill(x - 1, y + h, z - 1, x + w, y + h, z + w, B.STONE_BRICKS);
    for (let step = 0; step < Math.ceil(w / 2); step++) {
      for (let dx = step; dx < w - step; dx++) for (let dz = step; dz < w - step; dz++) {
        if (dx === step || dx === w - 1 - step || dz === step || dz === w - 1 - step) {
          put(x + dx, y + h + step + 1, z + dz, material);
        }
      }
    }
    put(x + Math.floor(w / 2), y + h + Math.ceil(w / 2) + 1, z + Math.floor(w / 2), B.BRAZIER);
  }

  // The curtain wall leaves clear passage into the capital at both ends of its main street.
  for (let i = 7; i <= 72; i++) {
    for (const [x, z] of [[i, 7], [i, 72], [7, i], [72, i]]) {
      const gate = (x >= 37 && x <= 43) || (expanded && (x === 7 || x === 72) && z >= 44 && z <= 47);
      if (!gate) fill(x, ground + 1, z, x, ground + 5, z, stone(x, z));
      put(x, ground + 5, z, B.STONE_BRICKS);
      if (i % 2 === 0) put(x, ground + 6, z, B.STONE_BRICKS);
    }
  }
  for (const [x, z] of [[8, 8], [65, 8], [8, 65], [65, 65], [30, 64], [44, 64]]) {
    tower(x, ground, z, 7, z === 64 ? 12 : 10, B.DARKSLATE_BRICKS);
  }
  for (const x of [36, 44]) lamp(x, ground, 74);

  // Keep, higher spires and guard court on the upper terrace.
  const upper = ground + 3;
  chamber(31, upper, 16, 19, 16, 12, B.CRACKED_BRICKS, B.STAINED_GLASS);
  fill(30, upper + 12, 15, 50, upper + 12, 32, B.STONE_BRICKS);
  for (let x = 30; x <= 50; x += 2) for (const z of [15, 32]) put(x, upper + 13, z, B.STONE_BRICKS);
  for (let z = 17; z < 32; z += 2) for (const x of [30, 50]) put(x, upper + 13, z, B.STONE_BRICKS);
  fill(38, upper + 1, 31, 42, upper + 4, 31, B.AIR);
  for (const x of [35, 45]) {
    put(x, upper + 3, 31, make(B.CASTLE_BANNER, 0));
    lamp(x, upper, 34);
    furnish(x - 2, upper, 17, B.BOOKSHELF);
  }
  fill(37, upper + 1, 18, 43, upper + 1, 22, B.STONE_BRICKS);
  put(40, upper + 2, 19, B.CHEST);
  for (const x of [34, 46]) for (const z of [23, 27]) lamp(x, upper, z);
  // The hall's side stair rises in half-block steps to a public gallery.
  fill(32, upper + 6, 17, 48, upper + 6, 19, B.PLANKS);
  for (let step = 0; step < 12; step++) {
    const z = 31 - step;
    const rise = Math.ceil((step + 1) / 2);
    for (const x of [47, 48]) {
      fill(x, upper + 1, z, x, upper + rise, z, B.STONE_BRICKS);
      if (step % 2 === 0) put(x, upper + rise, z, B.STONE_STEP);
    }
  }
  for (const x of [34, 37, 40, 43]) put(x, upper + 7, 17, B.BOOKSHELF);
  lamp(45, upper + 6, 18);
  if (expanded) {
    fill(47, upper + 2, 31, 48, upper + 4, 31, B.AIR);
    for (let step = 0; step < 12; step++) {
      const z = 20 + step, rise = Math.ceil((step + 1) / 2);
      for (const x of [32, 33]) {
        fill(x, upper + 7, z, x, upper + 6 + rise, z, B.STONE_BRICKS);
        if (step % 2 === 0) put(x, upper + 6 + rise, z, B.STONE_STEP);
        fill(x, upper + 7 + rise, z, x, upper + 9 + rise, z, B.AIR);
      }
    }
    for (const x of [31, 34]) for (let z = 28; z <= 30; z++) put(x, upper + 13, z, B.OAK_FENCE);
    lamp(35, upper + 12, 29);
    lamp(46, upper + 12, 29);
  }
  tower(36, upper + 12, 19, 9, 19, B.DARKSLATE_BRICKS, expanded);
  for (const [x, z, h] of [[23, 12, 20], [50, 12, 23], [23, 26, 17], [50, 26, 21]]) {
    tower(x, upper, z, 7, h, B.ROOF_TILES);
  }

  // Market plaza, public fountain and planted residential lanes.
  for (let z = 49; z <= 55; z++) for (let x = 37; x <= 43; x++) {
    const rim = x === 37 || x === 43 || z === 49 || z === 55;
    put(x, ground, z, rim ? B.STONE_BRICKS : B.WATER);
    if (rim) put(x, ground + 1, z, B.STONE_STEP);
  }
  fill(40, ground, 52, 40, ground + 3, 52, B.STONE_BRICKS);
  put(40, ground + 4, 52, B.BRAZIER);
  for (const [x, z, trim] of [[27, 50, B.CRIMSON_PLANKS], [47, 50, B.WARPED_PLANKS], [27, 57, B.WOOL], [47, 57, B.CRIMSON_PLANKS]]) {
    for (const dx of [0, 4]) for (const dz of [0, 2]) fill(x + dx, ground + 1, z + dz, x + dx, ground + 3, z + dz, B.OAK_FENCE);
    for (let dx = -1; dx <= 5; dx++) fill(x + dx, ground + 4, z - 1, x + dx, ground + 4, z + 3, dx % 2 ? trim : B.BIRCH_PLANKS);
    put(x + 1, ground + 1, z + 1, B.TABLE);
    put(x + 3, ground + 1, z + 1, B.CHEST);
  }
  for (const x of LANES) for (const { z, job } of HOMES) {
    chamber(x, ground, z, 9, 8, z === 32 ? 6 : 5, B.BIRCH_PLANKS, B.GLASS);
    roof(x, ground + (z === 32 ? 7 : 6), z, 9, 8, z === 32 ? B.DARKSLATE_BRICKS : B.ROOF_TILES);
    door(x + 4, ground, z + 7);
    furnish(x, ground, z, job, true);
    for (let dx = -1; dx <= 9; dx++) put(x + dx, ground, z + 9, stone(x + dx, z + 9));
    for (const dx of [0, 2, 6, 8]) {
      put(x + dx, ground, z + 8, B.MOSSY);
      put(x + dx, ground + 1, z + 8, dx % 4 ? B.FLOWER_YELLOW : B.FLOWER_RED);
    }
    lamp(x + 9, ground, z + 9);
  }
  if (expanded) {
    for (const { x, z, w, d, job, roof: roofMaterial } of DISTRICTS) {
      const doorX = x + 6, doorZ = z + d - 1;
      for (let zz = 44; zz <= 48; zz++) for (let xx = Math.min(doorX, 40); xx <= Math.max(doorX, 40); xx++) {
        put(xx, ground, zz, stone(xx, zz));
      }
      chamber(x, ground, z, w, d, 6, B.BIRCH_PLANKS, B.STAINED_GLASS);
      roof(x, ground + 7, z, w, d, roofMaterial);
      door(doorX, ground, doorZ);
      furnish(x, ground, z, job);
      for (const px of [x + 2, x + 10]) lamp(px, ground, 49);
      for (let i = 0; i < 5; i++) {
        const px = x + 2 + i * 2, pz = z + 17 + (i % 2);
        put(px, ground, pz, B.MOSSY);
        put(px, ground + 1, pz, i % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
      }
      if (job === B.ALTAR) {
        for (const px of [x + 1, x + w - 2]) fill(px, ground + 1, z + 3, px, ground + 2, z + 6, B.BOOKSHELF);
        fill(x + 5, ground, z + 2, x + 7, ground, z + 6, B.WOOL);
        put(x + 6, ground + 1, z + 2, B.MAP_TABLE);
      } else {
        put(x + 10, ground + 1, z + 2, B.FURNACE);
        fill(x + 10, ground + 2, z + 2, x + 10, ground + 13, z + 2, B.BRICKS);
        put(x + 10, ground + 1, z + 5, B.SMITH_TABLE);
        put(x + 2, ground + 1, z + 4, B.CHEST);
      }
    }
  }
  return cells;
}
