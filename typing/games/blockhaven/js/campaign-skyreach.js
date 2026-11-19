import { B, HEIGHT } from "./blocks.js";

export function finishSkyreach(K, deck, towerZ) {
  finishLanding(K, deck, towerZ);
  finishRelicForge(K, deck);
  finishSkyGardens(K, deck);
  finishResidences(K, deck);
  dressStormSpire(K, deck);
}

function finishLanding(K, deck, towerZ) {
  const { g, set, box } = K;
  for (let z = 23; z <= 40; z++) for (let x = -9; x <= 9; x++) {
    const radius = Math.hypot(x, z - 31);
    if (radius <= 8.8) set(x, g, z, radius > 7.7 ? B.SKY_BLOCK : Math.round(radius) % 3 === 0 ? B.GOLD_BLOCK : B.QUARTZ_BLOCK);
  }
  K.road(-2, towerZ + 5, 2, 40, B.QUARTZ_BLOCK, B.SKY_BLOCK);

  for (const side of [-1, 1]) {
    const x = side * 7;
    box(x - 1, g, 35, x + 1, g, 38, B.SKY_BLOCK);
    box(x, g + 1, 37, x, g + 5, 37, B.QUARTZ_BLOCK);
    box(x - 1, g + 5, 36, x + 1, g + 5, 38, B.QUARTZ_BLOCK);
    set(x, g + 6, 37, B.SHINESTONE);
    set(side * 6, g + 1, 35, B.STONE_STEP);
    set(side * 6, g + 1, 38, B.STONE_STEP);
  }
  for (const y of [g + 8, g + 16, deck - 2]) {
    for (let d = -4; d <= 4; d++) for (const [x, z] of [[d, towerZ - 4], [d, towerZ + 4], [-4, towerZ + d], [4, towerZ + d]]) {
      if (K.get(x, y, z) === B.QUARTZ_BLOCK) set(x, y, z, B.SKY_BLOCK);
    }
  }
  for (const x of [-4, 4]) for (const z of [towerZ - 4, towerZ + 4]) {
    box(x, g + 1, z, x, deck, z, (xx, y) => (y - g) % 8 === 0 ? B.GOLD_BLOCK : B.QUARTZ_BLOCK);
    set(x, deck + 2, z, B.SHINESTONE);
  }
  for (let d = -3; d <= 3; d++) for (const [x, z] of [[d, towerZ - 4], [d, towerZ + 4], [-4, towerZ + d], [4, towerZ + d]]) {
    if (z === towerZ - 4 && Math.abs(x) <= 1) continue;
    if (K.get(x, deck + 1, z) === B.AIR) set(x, deck + 1, z, B.BIRCH_FENCE);
  }
  for (let z = towerZ - 9; z <= towerZ - 4; z++) {
    box(-2, deck, z, 2, deck, z, x => Math.abs(x) === 2 || z % 3 === 0 ? B.SKY_BLOCK : B.QUARTZ_BLOCK);
    for (const x of [-2, 2]) {
      set(x, deck + 1, z, B.BIRCH_FENCE);
      if (z % 4 === 1) {
        set(x, deck + 2, z, B.SHINESTONE);
        set(x, deck - 1, z, B.QUARTZ_BLOCK);
      }
    }
  }
}

function finishRelicForge(K, deck) {
  const { set, box } = K;
  for (const side of [-1, 1]) {
    const x = side * 8;
    box(x, deck, -15, x + 1, deck, 2, B.QUARTZ_BLOCK);
    box(Math.min(x, 0), deck, -16, Math.max(x + 1, 0), deck, -14, B.SKY_BLOCK);
    box(Math.min(x, side * 2), deck, 0, Math.max(x + 1, side * 2), deck, 1, B.QUARTZ_BLOCK);
    for (const z of [-14, -4]) {
      set(x + side * 2, deck + 1, z, B.SKY_BLOCK);
      set(x + side * 2, deck + 2, z, B.SHINESTONE);
    }
    box(side * 5, deck + 1, -1, side * 5, deck + 4, -1, B.QUARTZ_BLOCK);
    set(side * 5, deck + 5, -1, B.GOLD_BLOCK);
    for (const z of [-8, -5]) {
      box(side * 6, deck + 2, z, side * 6, deck + 4, z, B.RESONANT_GLASS);
      set(side * 5, deck + 4, z, B.SHINESTONE);
    }
    set(side * 3, deck + 1, -9, B.BOOKSHELF);
    set(side * 5, deck + 1, -6, B.MAP_TABLE);
  }
  box(-5, deck + 5, -1, 5, deck + 5, 0, B.SKY_BLOCK);
  box(-4, deck + 6, -1, 4, deck + 6, 0, B.QUARTZ_BLOCK);
  box(-2, deck + 7, -1, 2, deck + 7, 0, B.SKY_BLOCK);
  set(0, deck + 8, -1, B.SHINESTONE);
  for (const z of [-9, -3]) {
    box(-5, deck + 5, z, 5, deck + 5, z, B.SKY_BLOCK);
    set(0, deck + 4, z, B.QUARTZ_BLOCK);
    set(0, deck + 3, z, B.SHINESTONE);
  }
  for (const x of [-4, 4]) set(x, deck + 1, -7, B.STONE_STEP);
}

function finishSkyGardens(K, deck) {
  const { set, box } = K;
  box(15, deck - 1, -3, 20, deck - 1, 2, B.SKY_BLOCK);
  for (let z = -3; z <= 2; z++) for (let x = 15; x <= 20; x++) {
    const edge = x === 15 || x === 20 || z === -3 || z === 2;
    set(x, deck, z, edge ? B.QUARTZ_BLOCK : B.WATER);
    const plant = K.get(x, deck + 1, z);
    if (!edge && (plant === B.FLOWER_YELLOW || plant === B.FLOWER_RED)) set(x, deck + 1, z, B.AIR);
  }
  box(17, deck, -3, 18, deck, 2, B.SKY_BLOCK);
  for (let z = -3; z <= 2; z++) for (const x of [17, 18]) {
    for (let y = deck + 1; y <= deck + 2; y++) {
      if (K.get(x, y, z) === B.BIRCH_LEAVES) set(x, y, z, B.AIR);
    }
  }
  for (const z of [-3, 2]) for (const x of [15, 20]) {
    set(x, deck + 1, z, B.BIRCH_FENCE);
    set(x, deck + 2, z, B.SHINESTONE);
  }

  box(10, deck, -14, 16, deck, -10, B.SKY_BLOCK);
  for (const x of [10, 16]) for (const z of [-14, -10]) box(x, deck + 1, z, x, deck + 3, z, B.BIRCH_LOG);
  for (let z = -15; z <= -9; z++) {
    const y = deck + (Math.abs(z + 12) < 2 ? 5 : 4);
    box(9, y, z, 17, y, z, x => x % 2 ? B.WARPED_PLANKS : B.QUARTZ_BLOCK);
  }
  box(12, deck + 1, -13, 14, deck + 1, -13, B.STONE_STEP);
  set(13, deck + 3, -12, B.SHINESTONE);
  for (const [x, z] of [[11, 4], [12, 5], [19, 4], [21, 3], [23, -5], [17, -6]]) {
    if (K.get(x, deck + 1, z) !== B.AIR) continue;
    set(x, deck, z, B.DIRT);
    set(x, deck + 1, z, (x + z) % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  }
}

function finishResidences(K, deck) {
  const { set, box } = K;
  for (const z of [-10, 2]) {
    box(-13, deck, z + 1, -11, deck, z + 5, B.SKY_BLOCK);
    for (const offset of [1, 5]) {
      box(-12, deck + 1, z + offset, -12, deck + 3, z + offset, B.BIRCH_LOG);
      set(-14, deck + 2, z + offset, B.RESONANT_GLASS);
    }
    box(-14, deck + 4, z, -11, deck + 4, z + 6, B.SKY_BLOCK);
    set(-18, deck + 1, z + 1, B.BOOKSHELF);
    set(-20, deck + 1, z + 3, B.TABLE);
    set(-16, deck + 1, z + 4, B.STONE_STEP);
    set(-17, deck + 3, z + 2, B.SHINESTONE);
  }
}

function dressStormSpire(K, deck) {
  const { set, box } = K;
  // These four pillars sit beyond the original arena and its safety railing.
  for (const x of [-11, 11]) for (const z of [-41, -19]) {
    box(x - 1, deck - 2, z - 1, x + 1, deck + 1, z + 1, B.SKY_BLOCK);
    box(x - 1, deck + 2, z - 1, x + 1, deck + 2, z + 1, B.QUARTZ_BLOCK);
    for (const y of [deck + 4, deck + 8]) {
      set(x - 1, y, z, B.GOLD_BLOCK);
      set(x + 1, y, z, B.GOLD_BLOCK);
      set(x, y, z - 1, B.SKY_BLOCK);
      set(x, y, z + 1, B.SKY_BLOCK);
    }
    const tall = x === -11 ? z === -19 : z === -41;
    const top = Math.min(HEIGHT - 3, deck + (tall ? 12 : 10));
    for (const side of [-1, 1]) {
      set(x + side, top, z, B.QUARTZ_BLOCK);
      set(x, top, z + side, B.QUARTZ_BLOCK);
    }
  }
}
