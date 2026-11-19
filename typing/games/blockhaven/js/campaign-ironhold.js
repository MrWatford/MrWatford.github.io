import { B } from "./blocks.js";

export function finishIronholdTown(K) {
  const { g, set, box } = K;
  buildGatehouses(K);

  K.road(-24, 7, -2, 9, B.GRAVEL, B.STONE_BRICKS);
  K.road(-24, 5, -21, 9, B.GRAVEL, B.STONE_BRICKS);
  K.road(2, 5, 10, 7, B.GRAVEL, B.STONE_BRICKS);
  K.road(14, -1, 17, 12, B.GRAVEL, B.COBBLE);
  K.road(-39, 18, -8, 19, B.GRAVEL, B.STONE_BRICKS);
  K.road(-30, 19, -29, 30, B.GRAVEL, B.STONE_BRICKS);
  K.road(-39, 29, -21, 30, B.GRAVEL, B.STONE_BRICKS);
  K.road(18, 20, 39, 21, B.GRAVEL, B.STONE_BRICKS);
  K.road(18, 16, 20, 30, B.GRAVEL, B.STONE_BRICKS);
  K.road(19, 29, 31, 30, B.GRAVEL, B.STONE_BRICKS);

  for (let z = 5; z <= 23; z++) for (let x = -9; x <= 9; x++) {
    const d = Math.hypot(x, z - 14);
    if (d > 9) continue;
    const radial = Math.abs(x) === Math.abs(z - 14) || x === 0 || z === 14;
    set(x, g, z, d > 8 ? B.DARKSLATE_BRICKS : radial ? B.STONE_BRICKS : (x + z) % 3 === 0 ? B.MOSSY : B.COBBLE);
  }
  box(-2, g + 1, 13, 2, g + 1, 15, B.STONE_BRICKS);
  box(-1, g + 2, 13, 1, g + 2, 15, B.DARKSLATE_BRICKS);
  box(-2, g + 4, 14, 2, g + 4, 14, B.IRON_BLOCK);
  box(-1, g + 5, 13, 2, g + 5, 15, B.IRON_BLOCK);
  set(-3, g + 4, 14, B.IRON_BLOCK);
  set(-2, g + 5, 14, B.IRON_BLOCK);
  set(3, g + 5, 14, B.IRON_BLOCK);
  for (const x of [-6, 6]) for (const z of [10, 18]) {
    if (K.get(x, g + 1, z) === B.AIR) ironholdLamp(K, x, z);
  }

  dressForge(K);
  dressMineHead(K);
  buildOreYard(K);
  dressHomes(K);
}

function ironholdLamp(K, x, z) {
  const { g, set } = K;
  set(x, g + 1, z, B.STONE_BRICKS);
  set(x, g + 2, z, B.OAK_FENCE);
  set(x, g + 3, z, B.BRAZIER);
}

function buildGatehouses(K) {
  const { g, set } = K;
  for (let x = -43; x <= 43; x++) for (const z of [-16, 44]) {
    if (z === 44 && Math.abs(x) <= 2) continue;
    set(x, g + 4, z, B.DARKSLATE_BRICKS);
    if (x % 3 !== 0) set(x, g + 5, z, B.STONE_BRICKS);
    if (x % 7 === 0) for (let dy = 1; dy <= 4; dy++) set(x, g + dy, z + 1, B.STONE_BRICKS);
  }
  for (let z = -15; z < 44; z++) for (const x of [-44, 44]) {
    if (Math.abs(z - 14) <= 2) continue;
    set(x, g + 4, z, B.DARKSLATE_BRICKS);
    if (z % 3 !== 0) set(x, g + 5, z, B.STONE_BRICKS);
    if (z % 7 === 0) for (let dy = 1; dy <= 4; dy++) set(x - Math.sign(x), g + dy, z, B.STONE_BRICKS);
  }

  // Each gate is five blocks wide and open at ground level.
  for (const [x, z, turn] of [[0, 44, false], [-44, 14, true], [44, 14, true]]) {
    const gate = (u, y, v, block) => set(x + (turn ? v : u), g + y, z + (turn ? u : v), block);
    for (const side of [-1, 1]) for (let v = -1; v <= 1; v++) {
      for (let y = 1; y <= 7; y++) gate(side * 3, y, v, y === 4 || y === 6 ? B.DARKSLATE_BRICKS : B.STONE_BRICKS);
      for (let y = 1; y <= 5; y++) {
        if (!turn && side === -1 && v === 1 && y === 1) continue;   // the original Ironhold sign
        gate(side * 4, y, v, B.STONE_BRICKS);
      }
      gate(side * 2, 6, v, B.STONE_BRICKS);
      gate(side * 2, 5, v, B.DARKSLATE_BRICKS);
      gate(side * 3, 8, v, B.STONE_BRICKS);
    }
    for (let u = -4; u <= 4; u++) for (let v = -1; v <= 1; v++) {
      gate(u, 7, v, B.LOG);
      gate(u, 8, v, B.ROOF_TILES);
      if (Math.abs(u) <= 2) gate(u, 9, v, B.ROOF_TILES);
    }
    for (const side of [-1, 1]) {
      gate(0, 6, side, B.SHINESTONE);
      gate(3, 3, side, B.BRAZIER);
      gate(-3, 3, side, B.BRAZIER);
    }
  }
}

function dressForge(K) {
  const { g, set, box } = K;
  box(-29, g, 5, -14, g, 7, B.STONE_BRICKS);
  for (const x of [-29, -15]) box(x, g + 1, 7, x, g + 5, 7, B.LOG);
  for (const x of [-28, -16]) {
    set(x, g + 3, 7, B.BRAZIER);
    set(x, g + 2, 7, B.STONE_BRICKS);
  }
  for (let z = 5; z <= 8; z++) box(-30, g + 6 - Math.floor((z - 5) / 2), z, -14, g + 6 - Math.floor((z - 5) / 2), z, B.DARKSLATE_BRICKS);
  for (const x of [-29, -26, -18, -15]) for (const y of [g + 2, g + 3]) set(x, y, 4, B.GLASS);
  for (const x of [-28, -17]) {
    box(x - 1, g + 7, -11, x + 1, g + 16, -9, B.STONE_BRICKS);
    box(x - 1, g + 17, -11, x + 1, g + 17, -9, B.DARKSLATE_BRICKS);
    set(x, g + 18, -10, B.BRAZIER);
  }
  for (const z of [-6, 0]) {
    box(-31, g + 5, z, -13, g + 5, z, B.LOG);
    for (const x of [-28, -16]) {
      set(x, g + 4, z, B.OAK_FENCE);
      set(x, g + 3, z, B.SHINESTONE);
    }
  }
  for (const z of [-8, -6, -4, -2, 0]) set(-22, g, z, B.DARKSLATE_BRICKS);
  box(-30, g + 1, -8, -30, g + 1, -5, B.IRON_BLOCK);
  set(-30, g + 1, -3, B.SMITH_TABLE);
  box(-17, g + 1, -4, -15, g + 1, -2, B.DARKSLATE_BRICKS);
  box(-17, g + 2, -3, -15, g + 2, -3, B.IRON_BLOCK);
  for (const x of [-19, -14]) set(x, g + 2, -9, B.BRAZIER);
  box(-28, g + 3, -11, -26, g + 4, -10, B.DARKSLATE_BRICKS);
  set(-27, g + 2, -11, B.SHROOMLIGHT);
  set(-27, g + 2, -10, B.GLASS);
}

function dressMineHead(K) {
  const { g, set, box } = K;
  for (const x of [18, 22]) box(x, g + 1, -8, x, g + 1, -5, B.OAK_FENCE);
  box(18, g + 1, -4, 22, g + 1, -4, B.OAK_FENCE);
  box(19, g, -10, 21, g, -9, B.STONE_BRICKS);
  for (const x of [18, 22]) {
    box(x, g + 1, -9, x, g + 3, -9, B.LOG);
    set(x, g + 3, -8, B.BRAZIER);
  }
  box(18, g + 4, -9, 22, g + 4, -9, B.LOG);
  for (const z of [-10, -8, -6]) set(24, g + 1, z, z === -8 ? B.SMITH_TABLE : B.PLANKS);
  box(15, g, -1, 20, g, 1, B.STONE_BRICKS);
  for (const x of [14, 20]) box(x, g + 1, 0, x, g + 3, 0, B.LOG);
  box(14, g + 4, -2, 20, g + 4, 1, B.DARKSLATE_BRICKS);
  set(16, g + 3, 0, B.SHINESTONE);
}

function buildOreYard(K) {
  const { g, set, box } = K;
  box(10, g, 3, 23, g, 11, (x, y, z) => x === 12 ? B.PLANKS : (x + z) % 3 ? B.COBBLE : B.DARKSLATE_BRICKS);
  // Keep the ore crate and the cart line free of posts and bins.
  for (const x of [14, 22]) for (const z of [4, 10]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  for (let x = 13; x <= 23; x++) {
    const y = g + 5 + Math.floor((5 - Math.abs(x - 18)) / 2);
    box(x, y, 3, x, y, 11, x % 2 ? B.DARKSLATE_BRICKS : B.ROOF_TILES);
  }
  for (const z of [4, 10]) box(14, g + 4, z, 22, g + 4, z, B.LOG);
  for (const x of [16, 20]) set(x, g + 4, 7, B.SHINESTONE);
  for (const [x, block] of [[16, B.COAL_ORE], [19, B.IRON_ORE]]) {
    box(x, g + 1, 4, x + 1, g + 1, 5, block);
    set(x, g + 2, 4, block);
  }
  set(21, g + 1, 8, B.SMITH_TABLE);
  set(20, g + 1, 9, B.TABLE);
  K.npc("ironholdQuartermaster", 18, 8);
}

function dressHomes(K) {
  const { g, set, box } = K;
  const homes = [[-38, 20], [-28, 20], [-38, 32], [-28, 32], [24, 22], [34, 22]];
  for (const [x, z] of homes) {
    box(x + 2, g, z - 1, x + 4, g, z - 1, B.STONE_BRICKS);
    for (const dx of [1, 6]) {
      set(x + dx, g, z - 1, B.DIRT);
      set(x + dx, g + 1, z - 1, dx === 1 ? B.FLOWER_RED : B.FLOWER_YELLOW);
    }
    set(x + 1, g + 1, z + 2, B.BOOKSHELF);
    set(x + 6, g + 1, z + 2, B.FURNACE);
    set(x + 2, g + 1, z + 3, B.STONE_STEP);
  }

  for (const x of [26, 34]) {
    set(x, g + 1, 33, B.TABLE);
    set(x, g + 1, 35, B.BOOKSHELF);
  }
  K.farm(20, 33, 23, 40);
  set(21, g + 1, 33, B.AIR);
  set(20, g + 1, 40, B.COMPOSTER);
  ironholdLamp(K, 22, 32);
  ironholdLamp(K, 32, 30);
  for (const [x, z] of [[-19, 24], [-17, 29], [12, 34], [38, 38], [-36, 8]]) K.tree(x, z, 5);
  set(-10, g + 1, 37, B.TABLE);
  set(-10, g + 1, 35, B.BOOKSHELF);
  set(-7, g + 1, 35, B.STONE_STEP);
}

export function finishIronholdMine(K, floor) {
  const { set, box } = K;
  // The main hall opening removes the last two treads from the original stair cut.
  box(19, floor + 1, 3, 21, floor + 1, 3, B.STONE_BRICKS);
  box(19, floor, 4, 21, floor, 4, B.STONE_BRICKS);
  for (const z of [-7, -4, -1, 2]) {
    const y = K.g - (z + 8);
    box(19, y + 3, z, 21, y + 3, z, B.LOG);
    for (const x of [18, 22]) set(x, y + 2, z, B.SHINESTONE);
  }
  for (const z of [8, 14]) for (const x of [11, 28]) {
    box(x, floor, z, x, floor + 2, z, B.LOG);
    set(x, floor + 3, z, B.BRAZIER);
  }
  for (const x of [-14, -5, 4, 33, 37]) {
    box(x, floor + 3, 10, x, floor + 3, 12, B.LOG);
    set(x, floor + 2, 10, B.TORCH);
  }
  for (const z of [20, 25]) {
    box(19, floor + 3, z, 21, floor + 3, z, B.LOG);
    set(19, floor + 2, z, B.TORCH);
  }
  K.sign(10, floor, 8, 1, "West Gallery\nWatch the old rails.");
  K.sign(22, floor, 16, 2, "South Gallery\nFollow the timber braces.");
  K.sign(30, floor, 14, 3, "East Gallery\nStay clear of the walls.");
}
