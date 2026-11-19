import { B } from "./blocks.js";
import { makeKit } from "./campaign-kit.js";
import { DISTRICT_SIZE, buildDistrictApproach } from "./campaign-districts.js";

export function buildStonehavenTradeCourt(g, groundAt, rot) {
  const K = makeKit(DISTRICT_SIZE, g, rot), { set, box } = K;
  K.ground(groundAt, 19, 24);
  buildDistrictApproach(K, groundAt);
  K.road(-2, -18, 2, 18, B.STONE_BRICKS, B.MOSSY);
  K.road(-17, 2, 17, 5, B.STONE_BRICKS, B.COBBLE);
  K.road(-5, -10, 5, -8, B.STONE_BRICKS, B.COBBLE);
  K.road(-5, -8, -3, 4, B.STONE_BRICKS, B.MOSSY);
  K.road(3, -8, 5, 4, B.STONE_BRICKS, B.MOSSY);

  for (const side of [-1, 1]) {
    const x = side * 5;
    const left = x - 1, right = x + 1;
    box(left, g, 15, right, g + 2, 18, B.DARKSLATE_BRICKS);
    box(left, g + 3, 15, right, g + 6, 18, B.STONE_BRICKS);
    box(left, g + 7, 15, right, g + 7, 18, B.QUARTZ_BLOCK);
    set(x, g + 8, 16, B.BRAZIER);
    set(x, g + 4, 19, B.CASTLE_BANNER);
    for (const z of [-8, 0, 8]) K.lamp(side * 6, z);
  }
  box(-4, g + 5, 16, 4, g + 5, 16, B.QUARTZ_BLOCK);
  box(-4, g + 6, 16, 4, g + 6, 16, B.STONE_BRICKS);
  set(0, g + 7, 16, B.GOLD_BLOCK);
  K.sign(-8, g + 1, 18, 0, "Stonehaven Trade Court\n\nVisit Elin at the Cloth Hall and Fenna at the Forge Hall. The Waystone beside the lane links back to Stonehaven.");
  K.waystone("stonehavenTradeCourt", 3, 13);

  K.house({ x0: -17, x1: -7, z0: -17, z1: -5, h: 5, wall: B.BIRCH_PLANKS, corner: B.LOG,
    floor: B.BIRCH_PLANKS, roof: B.ROOF_TILES, doorSide: "e", doorAt: -9 });
  K.house({ x0: 7, x1: 17, z0: -17, z1: -5, h: 5, wall: B.STONE_BRICKS, corner: B.DARKSLATE_BRICKS,
    floor: B.STONE_BRICKS, roof: B.DARKSLATE_BRICKS, doorSide: "w", doorAt: -9 });
  for (const side of [-1, 1]) {
    const a = side * 6, b = side * 7, c = side * 5;
    for (const z of [-12, -7]) box(a, g + 1, z, a, g + 3, z, B.LOG);
    box(Math.min(c, b), g + 4, -12, Math.max(c, b), g + 4, -7, B.BIRCH_PLANKS);
    set(a, g + 3, -9, B.SHINESTONE);
    for (const x of [10, 14]) {
      set(side * x, g + 2, -5, B.STAINED_GLASS);
      set(side * x, g + 3, -5, B.STAINED_GLASS);
    }
    K.bed(side * 15, g + 1, -7);
  }
  K.sign(-6, g + 1, -10, 1, "Cloth Hall\n\nElin makes the banners for Stonehaven’s walls and trades wool and shears.");
  K.sign(6, g + 1, -10, 3, "Forge Hall\n\nFenna fits out the market with tools and hardware.");
  box(-16, g + 1, -15, -12, g + 1, -15, B.WOOL);
  box(-15, g + 2, -15, -13, g + 2, -15, B.CRIMSON_PLANKS);
  set(-11, g + 1, -13, B.LOOM);
  set(-12, g + 1, -13, B.TABLE);
  set(-14, g + 1, -7, B.BOOKSHELF);
  K.npc("stonehavenTailor", -10, -10);
  box(12, g + 1, -15, 16, g + 2, -15, B.DARKSLATE_BRICKS);
  set(13, g + 1, -15, B.FURNACE);
  set(14, g + 1, -15, B.FURNACE);
  set(11, g + 1, -13, B.SMITH_TABLE);
  set(13, g + 1, -7, B.IRON_BLOCK);
  box(15, g + 3, -15, 15, g + 11, -15, B.BRICKS);
  K.npc("stonehavenCourtsmith", 10, -10);

  for (let x = -2; x <= 2; x++) for (let z = -4; z <= 0; z++) {
    const rim = Math.abs(x) === 2 || z === -4 || z === 0;
    set(x, g, z, B.DARKSLATE_BRICKS);
    set(x, g + 1, z, rim ? B.QUARTZ_BLOCK : B.WATER);
  }
  set(0, g + 1, -2, B.STONE_BRICKS);
  set(0, g + 2, -2, B.SHINESTONE);
  set(0, g + 3, -2, B.WATER);
  for (const x of [-5, 5]) set(x, g + 1, 6, B.STONE_STEP);

  for (const side of [-1, 1]) {
    const x = side * 12, trim = side < 0 ? B.CRIMSON_PLANKS : B.WARPED_PLANKS;
    box(x - 4, g, 7, x + 4, g, 11, B.BIRCH_PLANKS);
    for (const dx of [-4, 4]) for (const z of [7, 11]) box(x + dx, g + 1, z, x + dx, g + 3, z, B.LOG);
    box(x - 5, g + 4, 6, x + 5, g + 4, 12, (xx, y, z) => (xx - x) % 2 ? trim : B.WOOL);
    box(x - 4, g + 5, 8, x + 4, g + 5, 10, trim);
    box(x + side * 2, g + 1, 8, x + side * 2, g + 1, 10, B.BIRCH_PLANKS);
    set(x, g + 3, 9, B.SHINESTONE);
    set(x + side * 3, g + 1, 9, side < 0 ? B.WOOL : B.SMITH_TABLE);
    for (const dx of [-3, 0, 3]) for (const z of [14, 17]) {
      set(x + dx, g, z, B.DIRT);
      set(x + dx, g + 1, z, dx ? B.FLOWER_RED : B.FLOWER_YELLOW);
    }
  }
  return K;
}
