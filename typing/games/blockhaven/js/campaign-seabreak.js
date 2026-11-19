import { B, SEA } from "./blocks.js";

export const SEABREAK_HOMES = [[-30, -30], [-18, -30], [8, -30], [20, -30], [-30, -14], [-18, -14], [12, -10], [22, -10]];

export function buildSeabreakHarbor(K, groundAt) {
  const { g, set, box } = K;
  K.ground(groundAt, 30, 44);
  K.road(-2, -35, 2, 27, B.STONE_BRICKS, B.COBBLE);
  K.road(-30, -2, 30, 1, B.STONE_BRICKS, B.MOSSY);
  for (const z of [-23, -7]) K.road(-29, z, 28, z + 1, B.GRAVEL, B.COBBLE);
  for (const x of [-23, -12, 11, 24]) K.road(x, -23, x + 1, 27, B.GRAVEL, B.COBBLE);

  buildWaterfront(K);
  buildMooredShip(K);
  buildLighthouse(K);

  K.house({ x0: -18, z0: 12, x1: -6, z1: 22, h: 5, wall: B.SANDSTONE, corner: B.LOG, roof: B.DARKSLATE_BRICKS,
    win: B.STAINED_GLASS, doorSide: "s", doorAt: -12 });
  box(-16, g, 23, -8, g, 25, B.STONE_BRICKS);
  for (const x of [-16, -8]) box(x, g + 1, 24, x, g + 3, 24, B.LOG);
  for (let z = 23; z <= 25; z++) box(-17, g + 4, z, -7, g + 4, z, x => x % 3 ? B.WARPED_PLANKS : B.WOOL);
  box(-17, g + 1, 13, -17, g + 3, 16, B.BOOKSHELF);
  set(-16, g + 1, 14, B.MAP_TABLE);
  box(-15, g + 1, 18, -15, g + 1, 20, B.TABLE);
  for (const x of [-15, -9]) set(x, g + 4, 19, B.SHINESTONE);
  for (const z of [16, 18, 20]) set(-8, g + 1, z, B.STONE_STEP);
  set(-9, g + 1, 16, B.MAP_TABLE);
  K.chest(-8, g + 1, 13, 0, "harbor", "Harbor Supplies");
  K.chest(-7, g + 1, 13, 0, "harbor2", "Harbor Supplies");
  K.sign(-10, g + 1, 23, 0, "Harbor Office\n\nCaptain Mira knows these waters better than anyone. Ask her about the drowned kingdom.");
  K.npc("mira", -12, 17);
  K.place("harborOffice", -12, 17, 7);

  for (const [x, trim, goods] of [[-26, B.WARPED_PLANKS, B.TABLE], [-4, B.ROOF_TILES, B.COMPOSTER], [12, B.WARPED_PLANKS, B.HAY], [22, B.ROOF_TILES, B.MAP_TABLE]]) {
    box(x - 2, g, 23, x + 2, g, 26, B.PLANKS);
    for (const dx of [-2, 2]) for (const z of [23, 26]) box(x + dx, g + 1, z, x + dx, g + 3, z, B.BIRCH_LOG);
    for (let z = 22; z <= 27; z++) {
      const roofY = g + (z === 22 || z === 27 ? 4 : 5);
      box(x - 3, roofY, z, x + 3, roofY, z, xx => (xx - x) % 2 ? trim : B.WOOL);
    }
    box(x - 1, g + 1, 26, x + 1, g + 1, 26, B.STONE_STEP);
    set(x - 1, g + 1, 24, goods);
    set(x + 2, g + 3, 25, B.TIDE_LAMP);
  }
  set(22, g + 1, 23, B.BOOKSHELF);
  K.npc("fishmonger", -22, 22);
  K.npc("shipwright", 4, 32);
  K.npc("seabreakChartmaker", 22, 24);

  SEABREAK_HOMES.forEach(([x, z], i) => {
    K.house({ x0: x, z0: z, x1: x + 7, z1: z + 6, h: 4, wall: i % 2 ? B.BIRCH_PLANKS : B.SANDSTONE, corner: B.LOG,
      roof: i % 2 ? B.ROOF_TILES : B.DARKSLATE_BRICKS, doorSide: "s", doorAt: x + 3 });
    for (const dz of [1, 4]) {
      set(x, g + 2, z + dz, B.GLASS);
      set(x + 7, g + 2, z + dz, B.GLASS);
    }
    K.bed(x + 1, g + 1, z + 2);
    K.chest(x + 6, g + 1, z + 1, 0, "sbHome", "Sailor's Chest");
    set(x + 1, g + 1, z + 4, i % 2 ? B.BOOKSHELF : B.FURNACE);
    set(x + 6, g + 1, z + 4, B.TABLE);
    box(x + 2, g, z + 7, x + 4, g, z + 8, B.STONE_BRICKS);
    for (const dx of [1, 6]) {
      set(x + dx, g, z + 7, B.DIRT);
      set(x + dx, g + 1, z + 7, i % 2 ? B.FLOWER_YELLOW : B.FLOWER_RED);
    }
  });
  buildHarborSquare(K);

  for (let z = -32; z <= 20; z += 8) {
    lightPost(K, -3, z);
    lightPost(K, 3, z);
  }
  K.waystone("seabreak", -4, 6);
  K.sign(-6, g + 1, 6, 0, "Seabreak\n\nThe last harbor before the open sea. Take a boat from the piers, and mind the lighthouse rocks.");
  K.place("seabreak", 0, 0, 32);
  return K;
}

function lightPost(K, x, z, base = K.g) {
  K.set(x, base + 1, z, B.STONE_BRICKS);
  K.set(x, base + 2, z, B.OAK_FENCE);
  K.set(x, base + 3, z, B.TIDE_LAMP);
}

function buildWaterfront(K) {
  const { g, set, box } = K;
  box(-30, g - 4, 29, 30, g - 1, 30, (x, y) => y === g - 3 || x % 6 === 0 ? B.TIDE_BRICKS : B.STONE_BRICKS);
  box(-30, g, 27, 30, g, 30, (x, y, z) => z === 27 || z === 30 ? B.TIDE_BRICKS : x % 5 === 0 ? B.COBBLE : B.STONE_BRICKS);
  box(-30, g + 1, 30, 30, g + 1, 30, B.OAK_FENCE);
  for (const x of [-27, -13, -7, 7, 13, 27]) lightPost(K, x, 29);
  for (const px of [-20, 0, 20]) {
    box(px - 2, g + 1, 30, px + 2, g + 1, 30, B.AIR);
    for (let z = 31; z <= 46; z++) {
      const y = px === 0 && z > 43 ? g - Math.min(z - 43, 2) : g;
      box(px - 2, y, z, px + 2, y, z, x => Math.abs(x - px) === 2 ? B.LOG : z % 5 === 0 ? B.BIRCH_PLANKS : B.PLANKS);
      box(px - 2, y + 1, z, px + 2, g + 3, z, B.AIR);
      for (const x of [px - 2, px + 2]) {
        const post = z % 5 === 2;
        if (post) box(x, g - 10, z, x, y - 1, z, B.LOG);
        if (px === 0 && x === 2 && z >= 38 && z <= 41) continue;
        set(x, y + 1, z, B.OAK_FENCE);
        if (post) set(x, y + 2, z, B.TIDE_LAMP);
      }
    }
    if (px !== 0) box(px - 2, g + 1, 46, px + 2, g + 1, 46, B.OAK_FENCE);
  }

  // The repair deck branches off the promenade, with a clear lane from Tobin to the middle dock.
  box(3, g, 31, 12, g, 34, B.PLANKS);
  box(3, g + 1, 31, 12, g + 3, 34, B.AIR);
  box(3, g + 1, 30, 12, g + 1, 30, B.AIR);
  box(3, g + 1, 34, 12, g + 1, 34, B.OAK_FENCE);
  for (const x of [9, 12]) for (const z of [31, 34]) box(x, g + 1, z, x, g + 3, z, B.LOG);
  box(8, g + 4, 31, 13, g + 4, 34, (x, y, z) => z % 2 ? B.WARPED_PLANKS : B.WOOL);
  box(10, g + 1, 33, 11, g + 1, 33, B.LOG);
  set(10, g + 1, 32, B.SMITH_TABLE);
  set(9, g + 3, 32, B.TIDE_LAMP);
  lightPost(K, 6, 34);
  K.place("harbor", 0, 38, 14);
}

function buildMooredShip(K) {
  const { g, set, box } = K;
  for (let z = 34; z <= 47; z++) {
    const half = Math.max(1, 5 - Math.ceil(Math.max(0, 37 - z, z - 42) * .72));
    for (let dx = -half; dx <= half; dx++) {
      const x = 8 + dx, edge = Math.abs(dx) === half, end = z === 34 || z === 47;
      for (let y = SEA - 2; y <= g; y++) {
        set(x, y, z, y === g ? B.BIRCH_PLANKS : edge || end || y === SEA - 2 ? (y === SEA - 2 ? B.LOG : B.WARPED_PLANKS) : B.AIR);
      }
      if (edge || end) set(x, g + 1, z, B.BIRCH_FENCE);
    }
  }
  box(2, g, 38, 4, g, 41, B.PLANKS);
  box(2, g + 1, 38, 4, g + 1, 41, B.AIR);
  for (const [z, top, width] of [[37, 14, 4], [41, 11, 3]]) {
    box(8, g + 1, z, 8, g + top, z, B.LOG);
    box(8 - width, g + top - 2, z, 8 + width, g + top - 2, z, B.LOG);
    for (let y = g + 4; y <= g + top - 2; y++) {
      const taper = y === g + 4 || y === g + top - 2 ? 1 : 0;
      box(8 - width + taper, y, z + (y <= g + 6 ? 2 : 1), 8 + width - taper, y, z + (y <= g + 6 ? 2 : 1),
        x => x === 8 || (y === g + 5 && Math.abs(x - 8) < width) ? B.WARPED_PLANKS : B.WOOL);
    }
    box(9, g + top - 1, z, 10, g + top, z, B.ROOF_TILES);
  }
  K.house({ x0: 5, z0: 43, x1: 9, z1: 46, h: 3, wall: B.WARPED_PLANKS, corner: B.LOG, floor: B.BIRCH_PLANKS,
    roof: B.DARKSLATE_BRICKS, doorSide: "n", doorAt: 7, ridge: "z", flat: true });
  K.chest(7, g + 1, 45, 2, "ship", "Ship's Hold");
  set(6, g + 1, 45, B.TABLE);
  set(8, g + 1, 45, B.STONE_STEP);
}

function buildLighthouse(K) {
  const { g, set, box } = K;
  box(29, g - 3, 15, 39, g, 25, B.COBBLE);
  K.road(23, 19, 29, 21, B.STONE_BRICKS, B.TIDE_BRICKS);
  box(29, g + 1, 15, 39, g + 29, 25, B.AIR);
  K.tower(34, 20, 11, 22, B.SANDSTONE, "w");
  for (const x of [29, 39]) for (const z of [15, 25]) box(x, g + 1, z, x, g + 24, z, B.AIR);
  for (let d = -4; d <= 4; d++) for (const [x, z] of [[34 + d, 15], [34 + d, 25], [29, 20 + d], [39, 20 + d]]) {
    for (const dy of [5, 6, 12, 13, 19, 20]) {
      if (K.get(x, g + dy, z) === B.SANDSTONE) set(x, g + dy, z, B.TIDE_BRICKS);
    }
    if (K.get(x, g + 23, z) === B.AIR) set(x, g + 23, z, B.BIRCH_FENCE);
  }
  for (const x of [29, 39]) for (const z of [16, 24]) set(x, g + 24, z, B.TIDE_LAMP);
  box(32, g + 23, 18, 36, g + 26, 22, (x, y, z) => {
    if (x === 32 || x === 36 || z === 18 || z === 22) {
      return y === g + 23 || (x === 32 || x === 36) && (z === 18 || z === 22) ? B.TIDE_BRICKS : B.GLASS;
    }
    return y === g + 24 || y === g + 25 ? B.SHINESTONE : B.STONE_BRICKS;
  });
  box(31, g + 27, 17, 37, g + 27, 23, B.ROOF_TILES);
  box(32, g + 28, 18, 36, g + 28, 22, B.ROOF_TILES);
  box(33, g + 29, 19, 35, g + 29, 21, B.ROOF_TILES);
  set(34, g + 30, 20, B.TIDE_LAMP);
  lightPost(K, 26, 18);
  lightPost(K, 26, 22);
  K.place("lighthouse", 34, 20, 5);
}

function buildHarborSquare(K) {
  const { g, set, box } = K;
  box(6, g, 6, 23, g, 17, (x, y, z) => (x + z) % 4 ? B.STONE_BRICKS : B.TIDE_BRICKS);
  box(12, g + 1, 9, 17, g + 1, 14, (x, y, z) => x === 12 || x === 17 || z === 9 || z === 14 ? B.TIDE_BRICKS : B.WATER);
  box(14, g + 1, 11, 15, g + 2, 12, B.STONE_BRICKS);
  box(14, g + 3, 11, 15, g + 3, 12, B.TIDE_LAMP);
  for (const z of [7, 16]) for (const x of [7, 22]) {
    box(x - 1, g, z, x + 1, g, z, B.DIRT);
    for (const dx of [-1, 1]) set(x + dx, g + 1, z, dx < 0 ? B.FLOWER_RED : B.FLOWER_YELLOW);
    K.tree(x, z, 4, B.BIRCH_LOG, B.BIRCH_LEAVES);
  }
  for (const x of [9, 20]) {
    box(x, g + 1, 10, x, g + 1, 12, B.STONE_STEP);
    lightPost(K, x, 14);
  }
}
