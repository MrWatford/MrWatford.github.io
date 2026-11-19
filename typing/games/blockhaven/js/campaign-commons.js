import { B } from "./blocks.js";
import { makeKit } from "./campaign-kit.js";
import { DISTRICT_SIZE, buildDistrictApproach } from "./campaign-districts.js";

export function buildLegacyCommons(g, groundAt, rot) {
  const K = makeKit(DISTRICT_SIZE, g, rot), { set, box } = K;
  K.ground(groundAt, 19, 24);
  K.road(-2, -17, 2, 18, B.STONE_BRICKS, B.MOSSY);
  K.road(-18, -2, 18, 2, B.STONE_BRICKS, B.COBBLE);
  K.road(-16, -11, 16, -9, B.STONE_BRICKS, B.MOSSY);
  K.road(-7, 8, 7, 10, B.STONE_BRICKS, B.MOSSY);

  buildDistrictApproach(K, groundAt);
  for (const x of [-4, 4]) {
    box(x, g, 17, x, g + 4, 17, B.STONE_BRICKS);
    set(x, g + 5, 17, B.BRAZIER);
  }
  box(-4, g + 4, 17, 4, g + 4, 17, B.LOG);
  box(-3, g + 5, 17, 3, g + 5, 17, B.DARKSLATE_BRICKS);
  K.sign(-5, g + 1, 15, 0, "Legacy Village Commons\n\nFollow the entry road back toward the old village. Tamsin keeps the records hall. Nell tends the apiary across the lane.");
  K.waystone("legacyCommons", 5, 14);

  K.house({ x0: -17, x1: -6, z0: -16, z1: -5, h: 5, roof: B.DARKSLATE_BRICKS, doorSide: "e", doorAt: -10 });
  K.house({ x0: 6, x1: 17, z0: -16, z1: -5, h: 4, roof: B.ROOF_TILES, doorSide: "w", doorAt: -10 });
  for (const side of [-1, 1]) {
    const x = side * 7;
    K.road(Math.min(x, 0), -10, Math.max(x, 0), -10, B.GRAVEL, B.COBBLE);
    for (const z of [-12, -8]) box(side * 4, g + 1, z, side * 4, g + 3, z, B.LOG);
    box(Math.min(side * 4, side * 6), g + 4, -12, Math.max(side * 4, side * 6), g + 4, -8, B.BIRCH_PLANKS);
    set(side * 5, g + 3, -10, B.SHINESTONE);
    set(side * 4, g, -10, B.STONE_BRICKS);
    set(side * 12, g + 2, -5, B.STAINED_GLASS);
    set(side * 12, g + 3, -5, B.STAINED_GLASS);
    box(side * 15, g + 5, -15, side * 15, g + 9, -15, B.BRICKS);
    K.bed(side * 15, g + 1, -7);
    set(side * 13, g + 1, -7, B.TABLE);
  }
  K.sign(-5, g + 1, -11, 1, "Records Hall\n\nScribe Tamsin copies maps and keeps a record of the village roads.");
  K.sign(5, g + 1, -11, 3, "Apiary Workshop\n\nBeekeeper Nell tends the flower garden and trades honey and hive supplies.");
  box(-16, g + 1, -15, -7, g + 2, -15, B.BOOKSHELF);
  box(-16, g + 1, -14, -16, g + 2, -11, B.BOOKSHELF);
  set(-10, g + 1, -13, B.MAP_TABLE);
  set(-11, g + 1, -13, B.STONE_STEP);
  set(14, g + 1, -14, B.COMPOSTER);
  box(15, g + 1, -14, 16, g + 1, -12, B.HAY);
  set(11, g + 1, -14, B.BEEHIVE);
  K.npc("legacyScribe", -9, -11);
  K.npc("legacyBeekeeper", 9, -11);

  K.farm(-17, 4, -7, 17);
  set(-7, g + 1, 9, B.AIR);
  const beds = K.info.crops.map(({ X, y, Z }) => ({ ...K.at(X, Z), y }));
  K.info.crops = beds;
  for (const x of [8, 11, 14, 17]) {
    for (const z of [6, 13, 16]) {
      set(x, g, z, B.DIRT);
      set(x, g + 1, z, z % 2 ? B.FLOWER_YELLOW : B.FLOWER_RED);
    }
  }
  for (const x of [10, 13, 16]) {
    set(x, g + 1, 9, B.OAK_FENCE);
    set(x, g + 2, 9, B.BEEHIVE);
  }
  for (const x of [8, 18]) for (const z of [7, 11]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  box(8, g + 4, 7, 18, g + 4, 11, (x, y, z) => z % 3 ? B.WOOL : B.WARPED_PLANKS);
  set(8, g + 3, 9, B.SHINESTONE);
  set(18, g + 3, 9, B.SHINESTONE);
  K.animal("bee", 10, 8, g + 2);
  K.animal("bee", 16, 10, g + 2);

  // A low fountain and two benches leave both sides of the square walkable.
  for (const z of [-6, -5, -4]) for (const x of [-1, 0, 1]) {
    set(x, g, z, B.STONE_BRICKS);
    set(x, g + 1, z, x === 0 && z === -5 ? B.WATER : B.STONE_BRICKS);
  }
  set(0, g + 2, -5, B.SHINESTONE);
  for (const x of [-4, 4]) {
    K.lamp(x, 3);
    box(x, g + 1, -5, x, g + 1, -4, B.STONE_STEP);
    for (const z of [5, 12]) { set(x, g, z, B.DIRT); set(x, g + 1, z, B.FLOWER_YELLOW); }
  }
  for (const side of [-1, 1]) for (const x of [9, 12, 15, 18]) {
    set(side * x, g, 18, x % 2 ? B.MOSSY : B.STONE_BRICKS);
    set(side * x, g + 1, 18, x % 2 ? B.FLOWER_YELLOW : B.FLOWER_RED);
  }
  return K;
}
