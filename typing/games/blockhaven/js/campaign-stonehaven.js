import { B, OPEN, make } from "./blocks.js";

// The second campaign layout builds on the original city and its quest landmarks.
export function finishCampaignStonehaven(K, shops, homes) {
  const { g } = K;
  const get = (x, y, z) => K.get(x, g + y, z);
  const set = (x, y, z, block) => K.set(x, g + y, z, block);
  const box = (x0, y0, z0, x1, y1, z1, block) => K.box(x0, g + y0, z0, x1, g + y1, z1, block);
  const pathBlocks = new Set([B.COBBLE, B.GRAVEL, B.GRASS, B.STONE_BRICKS]);
  function street(x0, z0, x1, z1) {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (pathBlocks.has(get(x, 0, z))) set(x, 0, z, (x * 3 + z * 5) % 13 === 0 ? B.MOSSY : B.STONE_BRICKS);
    }
  }
  function planters(x, z, flower) {
    if (get(x, 0, z) !== B.GRASS || get(x, 1, z) !== B.AIR) return;
    set(x, 0, z, B.DIRT);
    set(x, 1, z, flower);
  }
  function lantern(x, z) {
    if (get(x, 1, z) !== B.AIR && get(x, 1, z) !== B.OAK_FENCE) return;
    set(x, 1, z, B.STONE_BRICKS);
    box(x, 2, z, x, 3, z, B.OAK_FENCE);
    set(x, 4, z, B.BRAZIER);
  }

  // Stone avenues stay open between all four gates, the square and the castle.
  street(-2, -26, 2, 45);
  street(-45, -2, 45, 2);
  street(-2, -45, 2, -41);
  for (let a = 10; a <= 42; a++) {
    for (const x of [-2, 2]) set(x, 0, a, B.DARKSLATE_BRICKS);
    for (const z of [-2, 2]) for (const x of [-a, a]) set(x, 0, z, B.DARKSLATE_BRICKS);
  }
  for (let d = 12; d <= 36; d += 8) {
    for (const x of [-4, 4]) lantern(x, d);
    for (const x of [-d, d]) for (const z of [-4, 4]) lantern(x, z);
  }
  for (const [x, z] of [[-10, -3], [-8, 5], [10, -3], [8, 5]]) lantern(x, z);

  // The south gate has its own pair of stair towers and the flanking gates keep their open lanes.
  for (const side of [-1, 1]) {
    const x = side * 7;
    K.tower(x, 42, 7, 14, B.STONE_BRICKS, side < 0 ? "e" : "w", -1);
    for (let step = 0; step <= 4; step++) {
      box(x - 4 + step, 18 + step, 38 + step, x + 4 - step, 18 + step, 46 - step,
        step === 0 ? B.DARKSLATE_BRICKS : B.ROOF_TILES);
    }
    set(x, 23, 42, B.BRAZIER);
    box(x - 1, 15, 45, x + 1, 17, 45, B.DARKSLATE_BRICKS);
    set(x, 16, 46, make(B.CASTLE_BANNER, 0));
    set(x, 11, 45, B.STAINED_GLASS);
    for (const z of [-4, 4]) box(side * 42, 1, z, side * 42, 9, z, B.STONE_BRICKS);
    box(side * 42, 7, -4, side * 42, 9, 4, B.DARKSLATE_BRICKS);
    set(side * 42, 10, -4, B.BRAZIER);
    set(side * 42, 10, 4, B.BRAZIER);
  }
  box(-4, 6, 41, 4, 7, 43, B.STONE_BRICKS);
  box(-4, 8, 41, 4, 8, 43, B.DARKSLATE_BRICKS);
  for (const x of [-3, 3]) set(x, 5, 43, make(B.CASTLE_BANNER, 0));

  // A tiled well and cloth-covered stalls mark the working center of town.
  box(-2, 4, -2, 2, 4, 2, B.DARKSLATE_BRICKS);
  box(-1, 5, -1, 1, 5, 1, B.ROOF_TILES);
  set(0, 6, 0, B.STONE_BRICKS);
  for (const [x, z, color] of [[-7, -7, B.WARPED_PLANKS], [7, -7, B.CRIMSON_PLANKS], [-7, 7, B.CRIMSON_PLANKS], [7, 7, B.WARPED_PLANKS]]) {
    street(x - 2, z - 1, x + 2, z + 1);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      if (get(x + dx, 1, z + dz) === B.AIR) box(x + dx, 1, z + dz, x + dx, 2, z + dz, B.OAK_FENCE);
    }
    box(x - 2, 3, z - 1, x + 2, 3, z + 1, xx => (xx - x) % 2 ? B.WOOL : color);
    set(x, 1, z, B.TABLE);
    set(x + Math.sign(x), 1, z, B.HAY);
    set(x, 2, z, B.TORCH);
  }

  // Shopfronts face the main street. Each shop has a working station and a lit counter.
  shops.forEach(([x0, z0, x1, z1, face], i) => {
    const middle = (x0 + x1) >> 1;
    const front = face === "n" ? z1 : z0;
    const outside = face === "n" ? 1 : -1;
    const curb = -outside * 3;
    street(middle - 1, Math.min(front + outside, curb), middle + 1, Math.max(front + outside, curb));
    for (const x of [middle - 3, middle + 3]) {
      box(x, 2, front, x, 3, front, B.GLASS);
      planters(x, front + outside, i % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
    }
    set(middle, 4, front, B.SHINESTONE);
    const station = [B.SMITH_TABLE, B.TABLE, B.FURNACE, B.LOOM][i];
    const display = [B.FURNACE, B.BOOKSHELF, B.HAY, B.WOOL][i];
    set(x1 - 2, 1, front - outside * 3, station);
    set(x1 - 1, 1, front - outside * 3, display);
    set(x1 - 2, 2, front - outside * 3, B.TORCH);
  });
  K.npc("stonehavenTailor", 26, 9);

  // Row houses and the inn share the same stone trim, but each has its own doorway and garden.
  for (const [x, z] of homes) {
    street(x + 7, z + 3, x + 10, z + 3);
    set(x + 6, 3, z + 3, B.SHINESTONE);
    for (const zz of [z + 1, z + 5]) {
      box(x + 6, 2, zz, x + 6, 3, zz, B.GLASS);
      planters(x + 7, zz, B.FLOWER_RED);
    }
    set(x + 2, 1, z + 5, B.FURNACE);
    box(x + 2, 2, z + 5, x + 2, 9, z + 5, B.BRICKS);
    set(x + 4, 1, z + 1, B.BOOKSHELF);
  }
  street(-5, 32, -3, 32);
  for (const z of [28, 36]) planters(-5, z, B.FLOWER_YELLOW);
  set(-6, 3, 32, B.SHINESTONE);
  set(-8, 1, 36, B.FURNACE);
  box(-8, 2, 36, -8, 10, 36, B.BRICKS);
  set(-8, 2, 28, B.BOOKSHELF);
  box(-10, 0, 29, -10, 0, 35, B.CRIMSON_PLANKS);

  street(-32, -5, -30, -3);
  for (const x of [-35, -27]) lantern(x, -5);
  street(-37, -24, -25, -18);
  for (const x of [-35, -31, -27]) {
    set(x, 1, -23, B.HAY);
    set(x, 2, -23, B.TARGET);
    set(x, 3, -6, make(B.CASTLE_BANNER, 0));
  }
  street(7, 24, 9, 24);
  set(10, 1, 24, make(B.OAK_GATE, OPEN | 1));
  for (const [x, z] of [[-17, 17], [-27, 28], [33, 13], [36, -12], [-18, -11], [19, -14]]) K.tree(x, z, 4);

  // Castle court, Great Hall and records room. Keep the side stair and its roof landing clear.
  street(-2, -26, 2, -18);
  for (const x of [-6, 6]) {
    for (let z = -23; z <= -20; z++) planters(x, z, B.FLOWER_RED);
    lantern(x, -25);
    set(x, 5, -17, make(B.CASTLE_BANNER, 0));
  }
  for (const x of [-22, 22]) for (const z of [-40, -18]) {
    for (let step = 0; step <= 3; step++) box(x - 3 + step, 15 + step, z - 3 + step, x + 3 - step, 15 + step, z + 3 - step, B.DARKSLATE_BRICKS);
    set(x, 19, z, B.BRAZIER);
  }
  // The north towers touch the city wall. Open covered passages behind the keep to the north gate.
  box(-25, 1, -41, 25, 3, -41, B.AIR);
  street(-25, -41, 25, -41);
  for (const x of [-22, -14, -6, 6, 14, 22]) set(x, 3, -41, B.SHINESTONE);
  box(-4, 15, -36, 4, 15, -28, B.STONE_BRICKS);
  for (const x of [-4, 4]) {
    box(x, 16, -36, x, 18, -28, B.STAINED_GLASS);
    for (const z of [-36, -32, -28]) box(x, 16, z, x, 18, z, B.STONE_BRICKS);
  }
  box(-3, 16, -36, 3, 18, -36, B.STONE_BRICKS);
  box(-3, 16, -28, 3, 18, -28, B.STONE_BRICKS);
  K.door(-4, g + 16, -32, "w");
  K.door(4, g + 16, -32, "e");
  for (const x of [-5, 5]) set(x, 15, -32, B.STONE_STEP);
  for (let x = -5; x <= 5; x++) {
    const slope = 5 - Math.abs(x);
    box(x, 19 + slope, -37, x, 19 + slope, -27, x === 0 ? B.ROOF_TILES : B.DARKSLATE_BRICKS);
    if (slope) for (const z of [-36, -28]) box(x, 19, z, x, 18 + slope, z, B.STONE_BRICKS);
  }
  set(0, 19, -32, B.SHINESTONE);
  set(0, 16, -35, B.BOOKSHELF);
  for (const z of [-38, -26]) for (let x = -9; x <= 9; x += 3) for (const y of [3, 4, 10, 11]) {
    if (get(x, y, z) === B.GLASS) set(x, y, z, B.STAINED_GLASS);
  }
  box(-1, 0, -36, 1, 0, -27, B.CRIMSON_PLANKS);
  for (const x of [-4, 4]) {
    box(x, 1, -34, x, 1, -30, B.PLANKS);
    set(x, 2, -32, B.TORCH);
    set(x + Math.sign(x), 1, -32, B.STONE_STEP);
  }
  set(4, 8, -33, B.MAP_TABLE);
  set(5, 8, -33, B.BOOKSHELF);
  set(-4, 8, -30, B.TABLE);
  set(-4, 9, -30, B.TORCH);
  for (const [x0, x1] of [[-9, -8], [-2, -1], [2, 3], [8, 9]]) {
    box(x0, 8, -37, x1, 10, -37, B.BOOKSHELF);
    box(x0, 11, -37, x1, 11, -37, B.LOG);
  }
  box(-2, 7, -34, 3, 7, -30, B.DARKSLATE_BRICKS);
  box(-1, 7, -33, 2, 7, -31, B.WARPED_PLANKS);
  for (const x of [-6, 6]) {
    set(x, 13, -34, B.OAK_FENCE);
    set(x, 12, -34, B.SHINESTONE);
  }
}
