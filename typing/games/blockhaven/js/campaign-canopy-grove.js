import { B, HEIGHT } from "./blocks.js";
import { makeKit } from "./campaign-kit.js";
import { DISTRICT_SIZE, buildDistrictApproach } from "./campaign-districts.js";

export function buildOakwoodCanopyGrove(g, groundAt, rot) {
  const K = makeKit(DISTRICT_SIZE, g, rot);
  const { box, set } = K;
  const deck = g + 5;
  K.ground(groundAt, 19, 24);
  buildDistrictApproach(K, groundAt);
  K.road(-2, 12, 2, 18, B.GRAVEL, B.MOSSY);
  K.road(-17, 12, 17, 14, B.GRAVEL, B.COBBLE);

  for (const x of [-4, 4]) {
    box(x, g + 1, 17, x, g + 5, 17, B.LOG);
    set(x, g + 6, 17, B.SHINESTONE);
  }
  box(-4, g + 5, 17, 4, g + 5, 17, B.LOG);
  box(-5, g + 6, 16, 5, g + 6, 18, B.DARKSLATE_BRICKS);
  box(-3, g + 7, 17, 3, g + 7, 17, B.LEAVES);
  K.sign(-5, g + 1, 16, 0, "Oakwood Canopy Grove\n\nThe stair leads to Iona's Hive House and Lark's workshop. The Waystone links back to Oakwood.");
  K.waystone("oakwoodCanopyGrove", 3, 15);

  // Five blocks of rise split into half steps, with a clear lane between the rails.
  for (let step = 1; step <= 10; step++) {
    const z = 12 - step, y = g + Math.floor(step / 2);
    box(-2, g, z, 2, y, z, B.BIRCH_PLANKS);
    if (step % 2) box(-1, y + 1, z, 1, y + 1, z, B.STONE_STEP);
    for (const x of [-2, 2]) set(x, y + 1, z, B.BIRCH_FENCE);
  }
  box(-17, deck, -5, 17, deck, 2, (x, y, z) => z === -5 || z === 2 ? B.LOG : B.BIRCH_PLANKS);
  for (const x of [-17, 17]) box(x, deck + 1, -4, x, deck + 1, 2, B.BIRCH_FENCE);
  for (const [a, b] of [[-16, -3], [3, 16]]) box(a, deck + 1, 2, b, deck + 1, 2, B.BIRCH_FENCE);
  for (const [a, b] of [[-16, -13], [-11, 11], [13, 16]]) box(a, deck + 1, -5, b, deck + 1, -5, B.BIRCH_FENCE);
  for (const x of [-15, -8, 8, 15]) {
    for (const z of [-3, 1]) {
      box(x, g + 1, z, x, deck - 1, z, B.LOG);
      box(x, deck + 1, z, x, deck + 2, z, B.BIRCH_FENCE);
      set(x, deck + 3, z, B.SHINESTONE);
    }
  }
  for (const x of [-5, 5]) {
    set(x, deck + 1, -3, B.STONE_STEP);
    set(x, deck + 1, -2, B.STONE_STEP);
  }

  for (const side of [-1, 1]) {
    const x = side * 12;
    K.house({ x0: x - 5, x1: x + 5, z0: -15, z1: -5, h: 4,
      wall: B.BIRCH_PLANKS, corner: B.LOG, floor: B.PLANKS,
      roof: side < 0 ? B.WARPED_PLANKS : B.ROOF_TILES, doorSide: "s", doorAt: x, base: deck });
    for (const dx of [-3, 3]) for (const z of [-14, -7]) box(x + dx, g + 1, z, x + dx, deck - 1, z, B.LOG);
    for (const dx of [-2, 2]) {
      set(x + dx, deck + 2, -5, B.STAINED_GLASS);
      set(x + dx, deck + 3, -5, B.STAINED_GLASS);
    }
    K.bed(x + side * 3, deck + 1, -7);
  }
  K.sign(-13, deck + 1, -4, 0, "Hive House\n\nCanopy Keeper Iona trades honey, comb, and hives.");
  K.sign(13, deck + 1, -4, 0, "Bridge Workshop\n\nWoodworker Lark builds railings and sells iron tools.");
  box(-16, deck + 1, -14, -13, deck + 1, -14, B.HAY);
  set(-10, deck + 1, -13, B.TABLE);
  set(-11, deck + 1, -13, B.BEEHIVE);
  K.npc("oakwoodBeekeeper", -12, -10, deck + 1);
  box(13, deck + 1, -14, 16, deck + 1, -14, B.LOG);
  set(10, deck + 1, -13, B.SMITH_TABLE);
  set(11, deck + 1, -13, B.TABLE);
  K.npc("oakwoodWoodworker", 12, -10, deck + 1);

  const crown = Math.min(g + 15, HEIGHT - 3);
  for (const x of [-14, 14]) {
    box(x - 1, g, -18, x + 1, crown - 1, -17, B.LOG);
    for (let z = -22; z <= -12; z++) for (let dx = -6; dx <= 6; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (Math.hypot(dx, z + 17, dy * 2) < 6.5) set(x + dx, crown + dy, z, B.LEAVES);
      }
    }
  }
  K.tree(-18, 15, 5);
  K.tree(18, 15, 5);

  K.farm(7, 5, 16, 13);
  set(7, g + 1, 10, B.AIR);
  K.info.crops = K.info.crops.map(({ X, y, Z }) => ({ ...K.at(X, Z), y }));
  K.road(3, 10, 6, 10, B.GRAVEL, B.COBBLE);

  for (const x of [-16, -12, -8]) {
    set(x, g + 1, 7, B.OAK_FENCE);
    set(x, g + 2, 7, B.BEEHIVE);
    for (const z of [8, 10, 11]) {
      set(x, g, z, B.DIRT);
      set(x, g + 1, z, z % 2 ? B.FLOWER_YELLOW : B.FLOWER_RED);
    }
  }
  for (const x of [-17, -7]) for (const z of [5, 9]) box(x, g + 1, z, x, g + 3, z, B.LOG);
  box(-18, g + 4, 4, -6, g + 4, 10, (x, y, z) => z % 2 ? B.WARPED_PLANKS : B.WOOL);
  set(-12, g + 3, 6, B.SHINESTONE);
  K.animal("bee", -15, 8, g + 2);
  K.animal("bee", -9, 8, g + 2);
  return K;
}
