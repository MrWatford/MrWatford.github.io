import { B } from "./blocks.js";
import { makeKit } from "./campaign-kit.js";
import { DISTRICT_SIZE, buildDistrictApproach } from "./campaign-districts.js";

export function buildSandspireCaravanCourt(g, groundAt, rot) {
  const K = makeKit(DISTRICT_SIZE, g, rot), { set, box } = K;
  K.ground(groundAt, 19, 24, B.SANDSTONE, B.SANDSTONE);
  buildDistrictApproach(K, groundAt);
  K.road(-2, 3, 2, 18, B.SANDSTONE, B.TEMPLE_TRIM);
  K.road(-18, 2, 18, 5, B.SANDSTONE, B.TEMPLE_TRIM);
  K.road(-7, -11, -4, 2, B.SANDSTONE, B.TEMPLE_TRIM);
  K.road(4, -11, 7, 2, B.SANDSTONE, B.TEMPLE_TRIM);
  K.road(-6, -13, 6, -9, B.SANDSTONE, B.TEMPLE_TRIM);

  for (const side of [-1, 1]) {
    const x = 5 * side;
    box(x - 1, g, 15, x + 1, g + 2, 18, B.TEMPLE_TRIM);
    box(x - 1, g + 3, 15, x + 1, g + 6, 17, B.SANDSTONE);
    set(x, g + 3, 18, B.VINE_BRICKS);
    box(x - 1, g + 7, 15, x + 1, g + 7, 17, B.TEMPLE_TRIM);
    set(x, g + 8, 16, B.BRAZIER);
    box(Math.min(3 * side, x), g + 5, 16, Math.max(3 * side, x), g + 6, 17, B.SANDSTONE);
    set(2 * side, g + 6, 16, B.TEMPLE_TRIM);
    for (const z of [3, -6, -12]) {
      box(5 * side, g + 1, z, 5 * side, g + 2, z, B.BIRCH_FENCE);
      set(5 * side, g + 3, z, B.SHINESTONE);
    }
  }
  box(-4, g + 7, 16, 4, g + 7, 17, B.TEMPLE_TRIM);
  box(-2, g + 8, 16, 2, g + 8, 16, B.SANDSTONE);
  set(0, g + 9, 16, B.SUN_GLYPH);
  K.sign(-8, g + 1, 17, 0, "Sandspire Caravan Court\n\nZahir draws maps in the Chart House. Suri stocks the Provision Hall. The Waystone links back to the oasis.");
  K.waystone("sandspireCaravanCourt", 3, 13);

  // A sunken cistern leaves dry walking lanes on both sides.
  for (let x = -3; x <= 3; x++) for (let z = -7; z <= 0; z++) {
    const rim = Math.abs(x) === 3 || z === -7 || z === 0;
    set(x, g - 1, z, B.SANDSTONE);
    set(x, g, z, rim ? B.TEMPLE_TRIM : B.WATER);
    if (rim) set(x, g + 1, z, B.TEMPLE_TRIM);
  }
  set(0, g, -4, B.TEMPLE_PILLAR);
  set(0, g + 1, -4, B.TEMPLE_PILLAR);
  set(0, g + 2, -4, B.SHINESTONE);
  for (const x of [-4, 4]) set(x, g + 1, 1, B.TEMPLE_STEP);

  for (const side of [-1, 1]) {
    const center = side * 12;
    K.house({ x0: center - 5, x1: center + 5, z0: -17, z1: -5, h: 4, wall: B.SANDSTONE,
      corner: B.TEMPLE_PILLAR, floor: B.SANDSTONE, roof: B.TEMPLE_TRIM, flat: true,
      doorSide: side < 0 ? "e" : "w", doorAt: -10 });
    for (let step = 0; step < 3; step++) {
      box(center - 4 + step, g + 5 + step, -16 + step, center + 4 - step, g + 5 + step, -6 - step,
        step % 2 ? B.TEMPLE_TRIM : B.SANDSTONE);
    }
    set(center, g + 8, -11, B.BRAZIER);
    for (const z of [-12, -8]) box(side * 6, g + 1, z, side * 6, g + 3, z, B.TEMPLE_PILLAR);
    for (let z = -13; z <= -7; z++) box(Math.min(side * 5, side * 7), g + 4, z,
      Math.max(side * 5, side * 7), g + 4, z, z % 2 ? B.WOOL : side < 0 ? B.WARPED_PLANKS : B.CRIMSON_PLANKS);
    set(side * 6, g + 3, -10, B.SHINESTONE);
    K.bed(side * 15, g + 1, -7);
  }
  K.sign(-6, g + 1, -11, 1, "Chart House\n\nMapmaker Zahir supplies compasses and expedition tables.");
  K.sign(6, g + 1, -11, 3, "Provision Hall\n\nProvisioner Suri sells bread and food for the road.");
  box(-16, g + 1, -16, -9, g + 2, -16, B.BOOKSHELF);
  set(-11, g + 1, -14, B.MAP_TABLE);
  set(-12, g + 1, -14, B.STONE_STEP);
  K.npc("sandspireMapmaker", -10, -10);
  box(12, g + 1, -15, 16, g + 1, -15, B.HAY);
  set(11, g + 1, -14, B.TABLE);
  set(16, g + 1, -9, B.FURNACE);
  K.npc("sandspireProvisioner", 10, -10);

  K.farm(-4, -19, 4, -14);
  set(0, g + 1, -14, B.AIR);
  K.info.crops = K.info.crops.map(({ X, y, Z }) => ({ ...K.at(X, Z), y }));
  for (const side of [-1, 1]) {
    const x = side * 12;
    const trim = side < 0 ? B.CRIMSON_PLANKS : B.WARPED_PLANKS;
    box(x - 4, g, 6, x + 4, g, 11, B.SANDSTONE);
    for (const dx of [-4, 4]) for (const z of [6, 11]) box(x + dx, g + 1, z, x + dx, g + 3, z, B.LOG);
    box(x - 5, g + 4, 5, x + 5, g + 4, 12, (xx, y, z) => z % 2 ? trim : B.WOOL);
    box(x - 3, g + 5, 7, x + 3, g + 5, 10, trim);
    box(x - 3, g + 1, 10, x + 3, g + 1, 10, B.TEMPLE_TRIM);
    set(x, g + 3, 8, B.SHINESTONE);
    set(x + side * 2, g + 1, 9, side < 0 ? B.CLAY : B.HAY);
    for (const z of [14, 17]) {
      box(x - 2, g, z, x + 2, g, z, B.DIRT);
      for (const dx of [-2, 0, 2]) set(x + dx, g + 1, z, dx ? B.FLOWER_YELLOW : B.FLOWER_RED);
    }
  }
  return K;
}
