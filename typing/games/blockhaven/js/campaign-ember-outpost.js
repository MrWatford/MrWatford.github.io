import { B } from "./blocks.js";

export function buildEmberShelters(K) {
  const { g, set, box } = K;
  for (const [cx, cz, cloth, trim] of [[-10, 5, B.WOOL, B.CRIMSON_PLANKS], [10, 5, B.BLACK_WOOL, B.ROOF_TILES], [-10, -4, B.WOOL, B.WARPED_PLANKS]]) {
    box(cx - 3, g, cz - 3, cx + 3, g, cz + 3, B.PLANKS);
    for (const x of [cx - 3, cx + 3]) for (const z of [cz - 3, cz + 3]) box(x, g + 1, z, x, g + 3, z, B.LOG);
    for (let x = cx - 4; x <= cx + 4; x++) {
      const y = g + 7 - Math.abs(x - cx);
      box(x, y, cz - 4, x, y, cz + 4, (xx, yy, z) => (z - cz) % 3 ? cloth : trim);
    }
    box(cx - 3, g + 3, cz - 3, cx - 3, g + 3, cz + 3, B.LOG);
    box(cx + 3, g + 3, cz - 3, cx + 3, g + 3, cz + 3, B.LOG);
    box(cx - 2, g + 1, cz - 3, cx + 2, g + 2, cz - 3, trim);
    set(cx + 2, g + 1, cz - 1, B.TABLE);
    set(cx + 2, g + 2, cz - 1, B.TORCH);
    set(cx - 2, g + 1, cz - 2, cz < 0 ? B.BOOKSHELF : B.HAY);
  }
  set(-11, g + 1, -4, B.MAP_TABLE);
  box(-13, g + 1, -6, -13, g + 2, -4, B.BOOKSHELF);
}

export function finishEmberOutpost(K) {
  const { g, set, box } = K;
  buildPalisade(K);
  K.road(-2, 9, 2, 19, B.GRAVEL, B.COBBLE);
  K.road(-19, -1, 19, 1, B.GRAVEL, B.COBBLE);
  box(-19, g + 1, -1, -17, g + 2, 1, B.AIR);
  box(17, g + 1, -1, 19, g + 2, 1, B.AIR);
  box(-2, g + 1, 17, 2, g + 2, 19, B.AIR);
  K.road(-2, -7, 1, 9, B.GRAVEL, B.COBBLE);
  K.road(6, 9, 9, 10, B.GRAVEL, B.COBBLE);
  K.road(-12, 8, -2, 10, B.GRAVEL, B.COBBLE);
  K.road(2, -5, 14, -1, B.GRAVEL, B.COBBLE);

  buildCommandPavilion(K);
  buildSupplyHall(K);
  buildEmberGateCourt(K);

  for (let z = 5; z <= 9; z++) for (let x = -3; x <= 3; x++) {
    if (Math.abs(x) + Math.abs(z - 7) < 5) set(x, g, z, (x + z) % 2 ? B.COBBLE : B.STONE_BRICKS);
  }
  set(0, g + 1, 7, B.BRAZIER);
  for (const x of [-2, 2]) for (const z of [6, 8]) set(x, g + 1, z, B.STONE_STEP);
  for (const [x, z] of [[-5, 12], [5, 13], [-14, 11], [14, -12], [-7, -11]]) campLamp(K, x, z);

  K.farm(9, 10, 14, 14);
  set(9, g + 1, 11, B.AIR);
  set(14, g + 1, 14, B.COMPOSTER);
  K.tree(-11, -12, 4);
  K.tree(10, -12, 4);
  for (const [x, z, flower] of [[-12, 10, B.FLOWER_RED], [-8, 11, B.FLOWER_YELLOW], [8, 13, B.FLOWER_RED], [13, 15, B.FLOWER_YELLOW]]) {
    set(x, g, z, B.DIRT);
    set(x, g + 1, z, flower);
  }
}

function campLamp(K, x, z) {
  const { g, set } = K;
  set(x, g + 1, z, B.STONE_BRICKS);
  set(x, g + 2, z, B.OAK_FENCE);
  set(x, g + 3, z, B.BRAZIER);
}

function buildPalisade(K) {
  const { g, set, box } = K;
  for (let i = -17; i <= 17; i++) {
    for (const [x, z] of [[i, 17], [i, -17], [17, i], [-17, i]]) {
      if (Math.abs(i) <= 2 && z !== -17) continue;
      set(x, g + 1, z, i % 4 === 0 ? B.STONE_BRICKS : B.COBBLE);
      set(x, g + 2, z, B.LOG);
      set(x, g + 3, z, i % 3 ? B.OAK_FENCE : B.DARKSLATE_BRICKS);
    }
  }
  for (const x of [-17, 17]) for (const z of [-17, 17]) {
    box(x - 1, g + 1, z - 1, x + 1, g + 4, z + 1, B.STONE_BRICKS);
    box(x - 1, g + 5, z - 1, x + 1, g + 5, z + 1, B.DARKSLATE_BRICKS);
    set(x, g + 6, z, B.BRAZIER);
  }
  for (const [x, z, turned] of [[0, 17, false], [17, 0, true], [-17, 0, true]]) {
    const put = (u, y, v, material) => set(x + (turned ? v : u), g + y, z + (turned ? u : v), material);
    for (const u of [-3, 3]) for (let v = -1; v <= 1; v++) {
      for (let y = 1; y <= 4; y++) put(u, y, v, y === 1 ? B.STONE_BRICKS : B.LOG);
      put(u, 3, v, v === 0 ? B.LOG : B.SHROOMLIGHT);
    }
    for (let u = -4; u <= 4; u++) for (let v = -1; v <= 1; v++) {
      put(u, 5, v, B.LOG);
      put(u, 6, v, B.ROOF_TILES);
      if (Math.abs(u) <= 2) put(u, 7, v, B.ROOF_TILES);
    }
  }
}

function buildCommandPavilion(K) {
  const { g, set, box } = K;
  box(-4, g, -1, 4, g, 5, B.PLANKS);
  for (const x of [-4, 4]) for (const z of [-1, 5]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  for (let z = -2; z <= 6; z++) {
    const y = g + 8 - Math.abs(z - 2);
    box(-5, y, z, 5, y, z, x => x % 3 ? B.CRIMSON_PLANKS : B.WOOL);
  }
  for (const x of [-4, 4]) box(x, g + 4, -1, x, g + 4, 5, B.LOG);
  for (const x of [-3, 3]) {
    set(x, g + 1, 0, B.BOOKSHELF);
    set(x, g + 1, 4, B.STONE_STEP);
    set(x, g + 4, 1, B.SHROOMLIGHT);
  }
}

function buildSupplyHall(K) {
  const { g, set, box } = K;
  box(3, g, -8, 14, g, -3, B.STONE_BRICKS);
  for (const x of [3, 8, 14]) for (const z of [-8, -3]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  box(4, g + 1, -8, 13, g + 3, -8, (x, y) => y === g + 2 && x % 3 === 1 ? B.GLASS : B.BIRCH_PLANKS);
  for (let z = -9; z <= -2; z++) {
    const y = g + 5 + Math.floor((4 - Math.abs(z + 5.5)) / 2);
    box(2, y, z, 15, y, z, B.DARKSLATE_BRICKS);
  }
  for (const x of [5, 11]) set(x, g + 4, -5, B.SHROOMLIGHT);
  box(9, g + 1, -7, 10, g + 1, -7, B.HAY);
  set(12, g + 1, -7, B.FURNACE);
  set(13, g + 1, -7, B.TABLE);
  set(13, g + 1, -5, B.COMPOSTER);
  K.npc("emberProvisioner", 11, -5);
}

function buildEmberGateCourt(K) {
  const { g, set, box } = K;
  box(-4, g, -14, 3, g, -7, (x, y, z) => x === -4 || x === 3 || z === -14 ? B.BLACKSTONE_BRICKS : B.STONE_BRICKS);
  for (const x of [-4, 3]) for (const z of [-12, -8]) {
    box(x, g + 1, z, x, g + 6, z, (xx, y) => y === g + 3 || y === g + 6 ? B.EMBER_BRICKS : B.BLACKSTONE_BRICKS);
    set(x, g + 7, z, B.BRAZIER);
  }
  for (const z of [-12, -8]) {
    box(-4, g + 7, z, 3, g + 7, z, B.BLACKSTONE_BRICKS);
    box(-3, g + 8, z, 2, g + 8, z, B.EMBER_BRICKS);
    set(-1, g + 9, z, B.SHROOMLIGHT);
  }
  set(-3, g + 1, -7, B.BRAZIER);
  set(2, g + 1, -7, B.BRAZIER);
}
