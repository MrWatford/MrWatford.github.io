import { B, OPEN, make } from "./blocks.js";

// Extra architecture for the second Legacy Village layout. The original builder supplies
// the terrain, quest sites, entrances, roads, and all of the campaign metadata.
export function finishLegacyVillage({ g, get, set, box, homes }) {
  const at = (x, y, z) => get(x, g + y, z);
  const put = (x, y, z, block) => set(x, g + y, z, block);
  const fill = (xa, ya, za, xb, yb, zb, block) => box(xa, g + ya, za, xb, g + yb, zb, block);
  const free = (x, y, z, block) => { if (at(x, y, z) === B.AIR) put(x, y, z, block); };
  const stone = (x, z) => (x * 3 + z * 7) % 13 === 0 ? B.MOSSY : B.STONE_BRICKS;
  const paving = new Set([B.GRASS, B.GRAVEL, B.COBBLE, B.STONE_BRICKS, B.MOSSY]);
  function pave(xa, za, xb, zb) {
    for (let z = za; z <= zb; z++) for (let x = xa; x <= xb; x++) {
      if (paving.has(at(x, 0, z))) put(x, 0, z, stone(x, z));
    }
  }
  function flowerBox(x, z, flower) {
    if (at(x, 0, z) !== B.GRASS) return;
    put(x, 0, z, B.DIRT);
    free(x, 1, z, flower);
  }
  function lantern(x, z) {
    if (at(x, 1, z) !== B.AIR || at(x, 2, z) !== B.AIR || at(x, 3, z) !== B.AIR) return;
    put(x, 1, z, B.STONE_BRICKS);
    put(x, 2, z, B.OAK_FENCE);
    put(x, 3, z, B.BRAZIER);
  }

  // Setts down the middle and slate edging on the main lanes.
  pave(-2, 11, 2, 54); pave(-2, -20, 2, -11);
  pave(-54, -2, -11, 2); pave(11, -2, 54, 2);
  for (let z = 13; z < 52; z++) for (const x of [-2, 2]) put(x, 0, z, B.DARKSLATE_BRICKS);
  for (let x = 13; x < 52; x++) for (const z of [-2, 2]) {
    put(x, 0, z, B.DARKSLATE_BRICKS); put(-x, 0, z, B.DARKSLATE_BRICKS);
  }
  for (const x of [-4, 4]) for (let z = 14; z <= 46; z += 8) {
    put(x, 1, z, B.STONE_BRICKS);
    put(x, 4, z, B.BRAZIER);
  }
  for (let d = 14; d <= 46; d += 8) for (const x of [-d, d]) for (const z of [-4, 4]) {
    if (at(x, 4, z) === B.TORCH) {
      put(x, 1, z, B.STONE_BRICKS);
      put(x, 4, z, B.BRAZIER);
    }
  }
  // Arcade approaches from the crossroads to the major workshops.
  pave(-19, 3, -17, 4); pave(17, 3, 19, 4);
  pave(-36, 22, -25, 24); pave(-25, 39, -14, 41);
  pave(29, 3, 31, 9); pave(36, 23, 36, 24); pave(28, 41, 36, 42);
  pave(38, -30, 41, -16);

  // Fountain coping and striped canopies, leaving the existing market crates in place.
  for (let z = -11; z <= 11; z++) for (let x = -11; x <= 11; x++) {
    const radius = Math.hypot(x, z);
    if (radius > 3.5 && radius <= 4.5 && at(x, 1, z) === B.STONE_BRICKS) put(x, 1, z, B.DARKSLATE_BRICKS);
    if (radius > 9 && radius <= 10.5) put(x, 0, z, B.DARKSLATE_BRICKS);
  }
  for (const [cx, cz, color] of [[-8,-7,B.CRIMSON_PLANKS],[8,-7,B.WARPED_PLANKS],[-8,7,B.WARPED_PLANKS],[8,7,B.CRIMSON_PLANKS]]) {
    const front = cx < 0 ? cx + 2 : cx - 2;
    fill(Math.min(cx - 1, front), 3, cz - 2, Math.max(cx + 1, front), 3, cz + 2, (x, y, z) => (z - cz) % 2 ? B.WOOL : color);
    fill(cx, 4, cz - 1, cx, 4, cz + 1, B.DARKSLATE_BRICKS);
    put(cx, 0, cz, B.BIRCH_PLANKS);
    free(cx, 2, cz, B.TORCH);
    free(cx + Math.sign(cx), 1, cz - 2, B.HAY);
  }
  for (const x of [-10, 10]) {
    for (const z of [11, 12, 13]) flowerBox(x, z, z % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
    free(x - Math.sign(x), 1, 12, B.STONE_STEP);
  }

  // Retaining stone, dark railings, and small beds along the canal.
  for (let x = -49; x <= 49; x++) for (const z of [-15, -11]) {
    if (at(x, 0, z) !== B.STONE_BRICKS) continue;
    fill(x, -2, z, x, 0, z, stone(x, z));
    if (x % 5 === 0 && Math.abs(x) > 5) flowerBox(x, z === -15 ? -16 : -10, B.FLOWER_YELLOW);
  }
  for (const cx of [-39, -30, 0, 30]) for (const x of [cx - 2, cx + 2]) {
    for (const z of [-14, -13, -12]) if (at(x, 1, z) === B.OAK_FENCE) put(x, 1, z, B.BIRCH_FENCE);
    lantern(x, -16);
  }

  // Front garden, stone threshold, warm wall light and a flue for each row house.
  homes.forEach(({ x0, x1, z0, z1, side }, i) => {
    const inward = side === "e" ? -1 : 1;
    const facade = side === "e" ? x1 : x0, front = facade - inward;
    const zc = (z0 + z1) / 2;
    const h = i % 3 === 2 ? 5 : 4;
    pave(Math.min(front, 3 * inward), zc, Math.max(front, 3 * inward), zc);
    put(front, 0, zc, B.DARKSLATE_BRICKS);
    for (const z of [zc - 2, zc + 2]) {
      flowerBox(front, z, i % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
      fill(facade, 2, z, facade, 3, z, B.GLASS);
      free(front, 2, z + Math.sign(zc - z), make(B.BIRCH_TRAPDOOR, (side === "e" ? 3 : 1) | OPEN));
    }
    put(facade, 3, zc, B.SHINESTONE);
    const back = side === "e" ? x0 + 1 : x1 - 1;
    fill(back + (side === "e" ? 1 : -1), 2, z1 - 1, back + (side === "e" ? 1 : -1), h + 5, z1 - 1, B.BRICKS);
    for (const z of [zc, zc + 1]) put(facade + inward * 2, 0, z, i % 2 ? B.BIRCH_PLANKS : B.DARKSLATE_BRICKS);
    free(facade + inward * 2, 1, z1 - 1, B.STONE_STEP);
  });

  // The Scribe works out of the first east house, the Beekeeper in the west garden.
  put(11, 1, 21, B.MAP_TABLE);
  put(12, 1, 21, B.BOOKSHELF); put(12, 2, 21, B.BOOKSHELF);
  pave(-21, 32, -16, 34);
  for (const x of [-21, -17]) for (const z of [30, 36]) fill(x, 1, z, x, 3, z, B.LOG);
  for (const z of [30, 36]) {
    fill(-22, 4, z, -16, 4, z, B.DARKSLATE_BRICKS);
    for (let x = -21; x <= -17; x++) flowerBox(x, z + (z === 30 ? -1 : 1), x % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  }
  fill(-21, 4, 31, -17, 4, 35, B.PLANKS);
  for (const z of [31, 35]) {
    put(-20, 1, z, B.LOG); put(-20, 2, z, make(B.BEE_NEST, 1));
    put(-17, 1, z, B.BEEHIVE);
  }
  lantern(-16, 34);

  // Public buildings and the waterside. Workstations, quest supplies and animal pens stay accessible.
  for (const [x, z] of [[-21, 4], [-15, 4], [15, 4], [21, 4], [-36, 20], [-36, 27], [35, 20], [35, 30], [28, 38], [28, 44], [37, -32], [43, -32]]) lantern(x, z);
  for (const x of [-24, -12, 12, 24]) for (const z of [7, 13]) {
    const outside = x < 0 ? (x === -24 ? -25 : -11) : (x === 12 ? 11 : 25);
    flowerBox(outside, z, z === 7 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  }
  fill(-22, 2, 14, -20, 2, 14, B.BRICKS);
  fill(-21, 3, 14, -21, 12, 14, B.BRICKS);
  for (const x of [14, 22]) for (const z of [8, 14]) free(x, 4, z, B.SHINESTONE);
  for (let x = 36; x <= 48; x++) for (const z of [19, 31]) put(x, 5, z, B.DARKSLATE_BRICKS);
  fill(37, 6, 21, 47, 6, 29, B.ROOF_TILES);
  for (const z of [40, 45]) for (const x of [38, 40]) put(x, 2, z, B.BRAZIER);
  for (const [x, z] of [[32,38],[34,36],[43,36],[46,39],[32,46],[37,49],[43,48],[47,45]]) flowerBox(x, z, B.FLOWER_YELLOW);
  for (const [x, z] of [[-49, 31], [-35, 31], [-27, 49], [-49, 49]]) lantern(x, z);
  // The farm's east gate opens onto an irrigation trench. A short crossing gives it a dry entrance.
  fill(-29, 0, 40, -27, 0, 40, B.PLANKS);
  for (const z of [35, 40, 45]) put(-38, 0, z, B.PLANKS);
  for (const z of [-45, -39, -33]) {
    free(-50, 4, z, B.BRAZIER);
    put(-30, 3, z, make(B.CASTLE_BANNER, 1));
  }

  // Stone banding at the gate and a pitched hall roof between the castle's towers.
  for (const x of [-3, 3]) {
    fill(x, 1, 51, x, 6, 52, B.DARKSLATE_BRICKS);
    put(x, 9, 52, B.BRAZIER);
    put(x, 6, 53, make(B.CASTLE_BANNER, 0));
  }
  fill(-3, 8, 51, 3, 8, 52, B.STONE_BRICKS);
  fill(-4, 9, 50, 4, 9, 53, B.ROOF_TILES);
  fill(-2, 10, 51, 2, 10, 52, B.DARKSLATE_BRICKS);
  for (const cx of [-5, 5]) {
    for (let step = 0; step <= 3; step++) fill(cx - 3 + step, 16 + step, -23 + step, cx + 3 - step, 16 + step, -17 - step, B.ROOF_TILES);
    put(cx, 20, -20, B.BRAZIER);
  }
  fill(-3, 17, -43, 3, 20, -37, B.AIR);
  for (const x of [-5, 5]) {
    fill(x, 17, -45, x, 17, -35, B.STONE_BRICKS);
    fill(x, 18, -45, x, 19, -35, B.STAINED_GLASS);
    fill(x, 20, -45, x, 20, -35, B.LOG);
    for (const z of [-45, -42, -38, -35]) fill(x, 18, z, x, 19, z, B.LOG);
  }
  for (const z of [-45, -35]) {
    fill(-4, 17, z, 4, 20, z, B.STAINED_GLASS);
    for (const x of [-2, 0, 2]) fill(x, 17, z, x, 20, z, B.LOG);
  }
  for (let x = -6; x <= 6; x++) {
    const rise = 6 - Math.abs(x);
    fill(x, 21 + rise, -46, x, 21 + rise, -34, Math.abs(x) === 6 || x === 0 ? B.DARKSLATE_BRICKS : B.ROOF_TILES);
    if (rise) for (const z of [-45, -35]) fill(x, 21, z, x, 20 + rise, z, x === 0 ? B.LOG : B.BIRCH_PLANKS);
  }
  for (const x of [-5, 5]) for (let z = -29; z <= -23; z += 2) flowerBox(x, z, B.FLOWER_RED);
  for (const x of [-17, 17]) for (const z of [-25, -29]) lantern(x, z);
  for (const x of [-14, 14]) for (let z = -45; z <= -35; z++) for (const y of [3, 4, 11, 12]) {
    if (at(x, y, z) === B.GLASS) put(x, y, z, B.STAINED_GLASS);
  }
  for (const z of [-47, -32]) for (let x = -12; x <= 12; x += 3) for (const y of [3, 4, 5, 11, 12, 13]) {
    if (at(x, y, z) === B.GLASS) put(x, y, z, B.STAINED_GLASS);
  }
  for (const x of [-5, 5]) for (const z of [-41, -37]) free(x, 2, z, B.TORCH);
  fill(-1, 0, -43, 1, 0, -33, B.CRIMSON_PLANKS);
}
