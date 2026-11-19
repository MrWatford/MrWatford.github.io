import { B } from "./blocks.js";

export function buildCapitalTents(K, camps) {
  const { g, set, box } = K;
  const trims = [B.CRIMSON_PLANKS, B.WARPED_PLANKS, B.ROOF_TILES, B.BLACK_WOOL];
  camps.forEach(([x, z], i) => {
    const trim = trims[i];
    box(x - 3, g, z, x + 3, g, z + 5, B.PLANKS);
    for (const dx of [-3, 3]) for (const dz of [0, 5]) box(x + dx, g + 1, z + dz, x + dx, g + 3, z + dz, B.LOG);
    for (let dx = -4; dx <= 4; dx++) {
      const y = g + 7 - Math.abs(dx);
      box(x + dx, y, z - 1, x + dx, y, z + 6, (xx, yy, zz) => (zz - z) % 3 ? B.WOOL : trim);
    }
    box(x - 2, g + 1, z, x + 2, g + 2, z, trim);
    set(x - 2, g + 1, z + 2, i === 2 ? B.SMITH_TABLE : B.TABLE);
    set(x + 2, g + 1, z + 2, i === 1 ? B.BOOKSHELF : B.HAY);
    set(x + 2, g + 3, z + 3, B.SHINESTONE);
    K.bed(x, g + 1, z + 2);
  });
}

export function finishRuinedCapital(K, ruins) {
  buildSouthGate(K);
  buildAlliedCamp(K);
  dressGrandAvenue(K);
  for (const [x, z, width, depth] of ruins) dressCapitalRuin(K, x, z, width, depth);
  frameGateOfEight(K);
}

function buildSouthGate(K) {
  const { g, set, box } = K;
  K.road(-3, 47, 3, 55, B.STONE_BRICKS, B.QUARTZ_BLOCK);
  for (const side of [-1, 1]) {
    const low = Math.min(side * 4, side * 8), high = Math.max(side * 4, side * 8);
    box(low, g + 1, 48, high, g + 4, 52, B.DARKSLATE_BRICKS);
    for (let y = g + 5; y <= g + 12; y++) {
      box(low, y, 49, high, y, 51, (x, yy, z) => yy % 4 === 0 ? B.MOSSY : z === 50 && x === side * 6 ? B.AIR : B.STONE_BRICKS);
    }
    box(low, g + 13, 49, high, g + 13, 51, B.QUARTZ_BLOCK);
    set(side * 5, g + 14, 51, B.BRAZIER);
    box(side * 4, g + 4, 48, side * 4, g + 10, 48, B.QUARTZ_BLOCK);
    set(side * 5, g + 8, 48, B.GOLD_BLOCK);
    set(side * 5, g + 9, 48, B.CRIMSON_PLANKS);
    box(side * 3, g + 8, 49, side * 3, g + 10, 51, B.CRACKED_BRICKS);
  }
  box(-2, g + 9, 49, 0, g + 10, 51, B.STONE_BRICKS);
  box(1, g + 10, 50, 2, g + 10, 51, B.CRACKED_BRICKS);
  set(0, g + 9, 49, B.SHINESTONE);
  for (const z of [36, 44]) for (const x of [-49, 49]) {
    box(x, g + 1, z - 1, x, g + 6, z + 1, B.MOSSY);
    set(x, g + 7, z, B.QUARTZ_BLOCK);
  }
}

function buildAlliedCamp(K) {
  const { g, set, box } = K;
  box(-7, g, 36, 7, g, 44, (x, y, z) => (x + z) % 5 === 0 ? B.DARKSLATE_BRICKS : B.STONE_BRICKS);
  for (const x of [-7, 7]) for (const z of [36, 44]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  for (let z = 35; z <= 45; z++) {
    const y = g + 5 + Math.floor((5 - Math.abs(z - 40)) / 2);
    box(-8, y, z, 8, y, z, x => x % 3 === 0 ? B.WOOL : B.CRIMSON_PLANKS);
  }
  for (const x of [-7, 7]) box(x, g + 4, 36, x, g + 4, 44, B.LOG);
  for (const x of [-5, 5]) for (const z of [37, 43]) set(x, g + 4, z, B.SHINESTONE);
  set(0, g + 1, 40, B.BRAZIER);
  for (const [x, z] of [[-1, 40], [1, 40], [0, 39], [0, 41]]) set(x, g + 1, z, B.STONE_STEP);
  for (const [x, z] of [[-4, 38], [4, 38], [-4, 42], [4, 42]]) set(x, g + 1, z, B.STONE_STEP);
  set(-5, g + 1, 41, B.MAP_TABLE);
  set(5, g + 1, 41, B.SMITH_TABLE);
  set(2, g + 1, 43, B.BOOKSHELF);

  for (const side of [-1, 1]) {
    const x = side * 11, trim = side < 0 ? B.WARPED_PLANKS : B.DARKSLATE_BRICKS;
    box(x - 2, g, 42, x + 2, g, 46, B.PLANKS);
    for (const dx of [-2, 2]) for (const z of [42, 46]) box(x + dx, g + 1, z, x + dx, g + 3, z, B.LOG);
    box(x - 3, g + 4, 41, x + 3, g + 4, 47, (xx, y, z) => z % 2 ? trim : B.WOOL);
    set(x + side, g + 1, 43, side < 0 ? B.HAY : B.FURNACE);
    set(x + side, g + 1, 45, B.TABLE);
    set(x, g + 3, 45, B.SHINESTONE);
    K.road(Math.min(x, side * 7), 39, Math.max(x, side * 7), 40, B.GRAVEL, B.MOSSY);
  }

  K.road(-30, 32, 30, 34, B.COBBLE, B.GRAVEL);
  K.road(-30, 47, -15, 47, B.COBBLE, B.GRAVEL);
  K.road(15, 47, 30, 47, B.COBBLE, B.GRAVEL);
  for (const [x, z] of [[-16, 43], [16, 43], [-26, 45], [26, 45], [-9, 34], [9, 34]]) {
    set(x, g + 1, z, B.STONE_BRICKS);
    set(x, g + 2, z, B.BRAZIER);
  }
}

function dressGrandAvenue(K) {
  const { g, set, box } = K;
  for (let z = -2; z <= 35; z++) for (let x = -4; x <= 4; x++) {
    const edge = Math.abs(x) === 4;
    set(x, g, z, edge ? (z % 4 ? B.MOSSY : B.VIOLET_BRICKS) :
      Math.abs(x) === 2 && z % 3 !== 0 ? B.QUARTZ_BLOCK : (x + z) % 7 === 0 ? B.CRACKED_BRICKS : B.STONE_BRICKS);
  }
  for (const z of [4, 18, 32]) for (const x of [-5, 5]) {
    box(x - 1, g + 1, z - 1, x + 1, g + 1, z + (z === 32 && x > 0 ? 0 : 1), B.DARKSLATE_BRICKS);
    box(x, g + 2, z, x, g + 5, z, B.QUARTZ_BLOCK);
    if (z !== 18 || x > 0) {
      box(x - 1, g + 4, z, x + 1, g + 5, z, B.QUARTZ_BLOCK);
      set(x, g + 6, z, B.QUARTZ_BLOCK);
      set(x, g + 7, z, B.GOLD_BLOCK);
    } else {
      set(x - 1, g + 2, z - 1, B.QUARTZ_BLOCK);
      set(x, g + 5, z, B.CRACKED_BRICKS);
    }
  }
  for (const z of [12, 27]) {
    for (const x of [-4, 4]) {
      box(x, g + 1, z, x, g + 7, z, B.DARKSLATE_BRICKS);
      set(x, g + 8, z, B.QUARTZ_BLOCK);
      set(x, g + 5, z + 1, B.SHINESTONE);
    }
    box(-3, g + 7, z, -1, g + 7, z, B.QUARTZ_BLOCK);
    box(1, g + 7, z, 3, g + 7, z, B.QUARTZ_BLOCK);
    box(-2, g + 8, z, z === 27 ? 2 : 0, g + 8, z, B.CRACKED_BRICKS);
  }
}

function dressCapitalRuin(K, x, z, width, depth) {
  const { g, set, box } = K;
  const back = z + depth, right = x + width;
  // The original footprints and buried chests stay put. Each ruin now has a clear opening.
  box(x + 3, g + 1, back - 1, x + 4, g + 2, back, B.AIR);
  box(x + 3, g, z + 2, x + 4, g, back + 1, B.GRAVEL);
  box(x + 3, g + 1, z + 2, x + 4, g + 1, back - 2, B.AIR);
  for (const px of [x, right]) {
    box(px, g + 1, z, px, g + (x % 3 ? 5 : 4), z, B.MOSSY);
    set(px, g + 5, z, B.CRACKED_BRICKS);
  }
  box(x + 1, g + 5, z, x + 3, g + 5, z, B.LOG);
  box(x + 1, g + 6, z, x + 4, g + 6, z + 1, x % 2 ? B.DARKSLATE_BRICKS : B.ROOF_TILES);
  set(right - 1, g + 1, z + 2, B.TABLE);
  set(right - 1, g + 1, z + 3, B.PLANKS);
  set(x + 1, g + 1, back - 1, B.BLACK_WOOL);
  set(x + 2, g + 2, z, B.VINES);
  set(right, g + 2, z + 2, B.VINES);
  set(right, g + 3, z + 2, B.VINES);
  set(x, g + 1, back + 1, B.TALL_GRASS);
}

function frameGateOfEight(K) {
  const { g, set, box } = K;
  K.road(-2, -20, 2, -15, B.PALE_BRICKS, B.QUARTZ_BLOCK);
  set(0, g, -18, B.GOLD_BLOCK);
  for (const side of [-1, 1]) {
    const x = side * 6;
    box(x - 1, g + 1, -20, x + 1, g + 2, -18, B.DARKSLATE_BRICKS);
    box(x, g + 3, -20, x, g + 10, -19, B.QUARTZ_BLOCK);
    box(x - 1, g + 9, -20, x + 1, g + 10, -19, B.VIOLET_BRICKS);
    set(x, g + 11, -19, B.SHINESTONE);
  }
  box(-5, g + 10, -20, 5, g + 10, -20, B.DARKSLATE_BRICKS);
  box(-4, g + 11, -20, 4, g + 11, -20, B.VIOLET_BRICKS);
  set(0, g + 12, -20, B.GOLD_BLOCK);
  set(0, g + 13, -20, B.SHINESTONE);
}
