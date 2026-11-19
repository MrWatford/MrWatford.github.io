import { B } from "./blocks.js";

export const HOLLOWMERE_LAYOUT = 2;

export function hollowmereMist(site, pos) {
  const distance = Math.hypot(pos.x - site.cx, pos.z - site.cz);
  return Math.max(0, Math.min(1, (72 - distance) / 32, (site.g + 36 - pos.y) / 16));
}

export function finishHollowmere(K, cottages) {
  const { g, set, box } = K;
  const lane = (x0, z0, x1, z1) => K.road(x0, z0, x1, z1, B.GRAVEL, B.MOSSY);
  lane(-2, -36, 2, -4);
  lane(-2, 4, 2, 39);
  lane(-35, -2, -4, 2);
  lane(4, -2, 35, 2);
  lane(-12, -30, 0, -28);
  lane(-13, 15, 0, 17);
  lane(-30, -16, -28, 0);
  lane(24, -7, 26, -1);
  for (const [x, z] of cottages) {
    lane(x + 2, z - 2, x + 4, z - 1);
    set(x + 1, g + 1, z + 1, B.BOOKSHELF);
    set(x + 1, g + 1, z + 4, B.TABLE);
    set(x + 3, g + 1, z + 5, B.BLACK_WOOL);
    set(x + 5, g + 2, z + 5, B.VINES);
    box(x + 7, g + 2, z + 2, x + 7, g + 4, z + 2, B.VINES);
    set(x + 2, g + 1, z - 1, B.TALL_GRASS);
    set(x + 6, g + 1, z - 2, B.TALL_GRASS);
  }

  for (const [x,z] of [[-8,-8],[8,4],[-10,10],[7,-12],[15,-4],[-5,29]]) {
    box(x - 1, g - 1, z - 1, x + 1, g, z + 1, B.MOSSY);
    set(x, g, z, B.WATER);
    set(x + 1, g, z, B.WATER);
    set(x + 2, g, z, B.DIRT);
    set(x + 1, g + 1, z - 1, B.TALL_GRASS);
  }
  buildOldWell(K);
  dressMeetingHall(K);
  dressIlsasHome(K);
  for (const [x, z] of [[-3, 33],[3, 33],[-7, 16],[-16, 17],[-7, -28],[5, -13],[22, -6],[26, -6]]) {
    if (K.get(x, g + 1, z) === B.AIR) lamp(K, x, z, B.KEEPER_LAMP);
  }
}

function lamp(K, x, z, light) {
  const { g, set } = K;
  set(x, g + 1, z, B.MOSSY);
  set(x, g + 2, z, B.OAK_FENCE);
  set(x, g + 3, z, light);
}

function buildOldWell(K) {
  const { g, set, box } = K;
  for (let z = -5; z <= 6; z++) for (let x = -6; x <= 6; x++) {
    if (Math.max(Math.abs(x), Math.abs(z)) <= 2 || Math.abs(x) + Math.abs(z) > 9) continue;
    set(x, g, z, (x + z) % 4 ? B.COBBLE : B.MOSSY);
  }
  box(-2, g + 2, -2, 2, g + 4, 2, B.AIR);
  for (const x of [-2, 2]) for (const z of [-2, 2]) {
    box(x, g + 1, z, x, g + 4, z, B.LOG);
    set(x, g, z, B.MOSSY);
    set(x, g + 3, z, B.KEEPER_LAMP);
  }
  for (const x of [-2, 2]) box(x, g + 2, -1, x, g + 2, 1, B.OAK_FENCE);
  for (const z of [-2, 2]) box(-1, g + 2, z, 1, g + 2, z, B.OAK_FENCE);
  for (let x = -3; x <= 3; x++) {
    const y = g + 7 - Math.abs(x);
    box(x, y, -3, x, y, 3, (xx, yy, z) => x === -2 && Math.abs(z) < 2 ? B.PLANKS : B.DARKSLATE_BRICKS);
  }
  box(-2, g + 4, 0, 2, g + 4, 0, B.LOG);
  set(0, g + 3, 0, B.OAK_FENCE);
}

function dressMeetingHall(K) {
  const { g, set, box } = K;
  box(-11, g, -32, -8, g, -26, B.MOSSY);
  for (const z of [-32, -26]) box(-9, g + 1, z, -9, g + 4, z, B.LOG);
  box(-12, g + 4, -32, -9, g + 4, -26, B.LOG);
  box(-12, g + 5, -33, -8, g + 5, -25, B.DARKSLATE_BRICKS);
  set(-10, g + 3, -29, B.KEEPER_LAMP);
  for (const z of [-33, -29, -25]) {
    box(-29, g + 5, z, -13, g + 5, z, B.LOG);
    set(-21, g + 4, z, B.OAK_FENCE);
    set(-21, g + 3, z, B.KEEPER_LAMP);
    set(-21, g, z, B.MOSSY);
  }
  for (const x of [-26, -21, -16]) {
    box(x, g + 2, -36, x, g + 4, -36, B.STAINED_GLASS);
    set(x, g + 1, -34, x === -21 ? B.TABLE : B.BOOKSHELF);
  }
  box(-24, g + 1, -33, -23, g + 1, -33, B.STONE_STEP);
  set(-20, g + 1, -25, B.VINES);
  set(-17, g + 1, -24, B.PLANKS);
  // A damaged belfry lets the light show through gaps above the hall.
  box(-25, g + 10, -35, -19, g + 10, -31, B.DARKSLATE_BRICKS);
  for (const x of [-25, -19]) for (const z of [-35, -31]) box(x, g + 10, z, x, g + 20, z, B.MOSSY);
  box(-26, g + 21, -36, -18, g + 21, -30, B.DARKSLATE_BRICKS);
  box(-25, g + 22, -35, -19, g + 22, -31, B.DARKSLATE_BRICKS);
  box(-24, g + 23, -34, -20, g + 23, -32, B.DARKSLATE_BRICKS);
  box(-23, g + 20, -33, -21, g + 20, -33, B.LOG);
  set(-22, g + 19, -33, B.KEEPER_LAMP);
}

function dressIlsasHome(K) {
  const { g, set, box } = K;
  box(-15, g, 18, -9, g, 19, B.PLANKS);
  for (const x of [-15, -9]) box(x, g + 1, 18, x, g + 3, 18, B.LOG);
  box(-16, g + 4, 17, -8, g + 4, 19, B.ROOF_TILES);
  set(-12, g + 3, 19, B.SHINESTONE);
  set(-14, g + 1, 22, B.FURNACE);
  set(-15, g + 1, 23, B.BOOKSHELF);
  for (const x of [-12, -11]) set(x, g + 1, 25, B.TABLE);
  set(-12, g + 3, 23, B.SHINESTONE);
  K.road(-13, 28, -11, 30, B.GRAVEL, B.MOSSY);
  K.farm(-16, 30, -8, 34);
  set(-12, g + 1, 30, B.AIR);
  set(-8, g + 1, 34, B.COMPOSTER);
  set(-15, g + 1, 29, B.FLOWER_RED);
}

export function finishHollowmereObservatory(K, x, z, top) {
  const { g, set, box } = K;
  // Half steps climb the old hillside from the lane up to the original door.
  for (let i = 0; i <= 10; i++) {
    const zz = z + 17 - i, y = g + Math.floor(i / 2);
    box(x - 1, g, zz, x + 1, y, zz, B.STONE_BRICKS);
    box(x - 1, y + 1, zz, x + 1, y + 3, zz, B.AIR);
    if (i % 2) box(x - 1, y + 1, zz, x + 1, y + 1, zz, B.STONE_STEP);
    if (i % 2) for (const side of [-2, 2]) {
      box(x + side, g, zz, x + side, y, zz, B.MOSSY);
      set(x + side, y + 1, zz, B.STONE_BRICKS);
      if (i % 4 === 1) set(x + side, y + 2, zz, B.KEEPER_LAMP);
    }
  }

  box(x - 7, top + 6, z - 7, x + 7, top + 6, z + 7, B.AIR);
  box(x - 3, top + 5, z - 3, x + 3, top + 5, z + 3, B.AIR);
  const radii = [6.5, 6, 5.5, 4.5, 3, 2];
  for (const [dy, radius] of radii.entries()) for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
    const d = Math.hypot(dx, dz);
    if (d > radius || (dy < radii.length - 1 && d < Math.min(radius - 1, radii[dy + 1]))) continue;
    const rib = dx === 0 || dz === 0 || Math.abs(dx) === Math.abs(dz);
    set(x + dx, top + 6 + dy, z + dz, rib || dy === 0 ? B.DARKSLATE_BRICKS : B.RESONANT_GLASS);
  }
  set(x, top + 12, z, B.KEEPER_LAMP);
  for (const side of [-1, 1]) for (const offset of [-4, 4]) {
    for (const y of [top + 2, top + 3]) set(x + offset, y, z + side * 6, B.RESONANT_GLASS);
    set(x + offset, top + 3, z + 4, B.KEEPER_LAMP);
  }
  set(x, top + 3, z - 1, B.KEEPER_COPPER);
  set(x, top + 4, z - 2, B.KEEPER_LAMP);
  set(x + 3, top + 1, z - 4, B.BOOKSHELF);
  set(x - 4, top + 1, z - 3, B.TABLE);
}
