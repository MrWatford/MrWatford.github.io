import { B, make } from "./blocks.js";
import { hash3 } from "./noise.js";

const DECK_RADIUS = 7;
const RISE = 10;

export function buildOakwoodCanopy(K, trees) {
  const { g, set, box } = K, deck = g + RISE;
  trees.forEach(([cx, cz], i) => {
    // Branches sit above the houses and leave the stair landing and balcony routes open.
    box(cx - 1, g - 2, cz - 1, cx + 1, g + 23, cz + 1, B.LOG);
    for (let dx = -9; dx <= 9; dx++) for (let dz = -9; dz <= 9; dz++) for (let dy = -3; dy <= 5; dy++) {
      const radius = Math.hypot(dx, dz, 1.7 * dy);
      if (radius > 8.7 || hash3(i, dx, dy, dz) < .06) continue;
      const x = cx + dx, y = g + 21 + dy, z = cz + dz;
      if (K.get(x, y, z) === B.AIR) set(x, y, z, radius >= 7.4 && i % 2 ? B.BIRCH_LEAVES : B.LEAVES);
    }
    for (const side of [-1, 1]) {
      box(cx + side * 2, g, cz, cx + side * 4, g, cz, B.LOG);
      box(cx, g, cz + side * 2, cx, g, cz + side * 4, B.LOG);
    }
    const ring = K.squareRing(cx, cz, 2, 0, 2);
    const holes = K.spiral(ring, g, RISE, B.PLANKS);
    for (let dx = -DECK_RADIUS; dx <= DECK_RADIUS; dx++) for (let dz = -DECK_RADIUS; dz <= DECK_RADIUS; dz++) {
      const edge = Math.max(Math.abs(dx), Math.abs(dz)), corner = Math.abs(dx) + Math.abs(dz);
      const x = cx + dx, z = cz + dz;
      if (corner > 12 || edge <= 1 || holes.has(x + "," + z)) continue;
      const rim = edge === DECK_RADIUS || corner === 12;
      set(x, deck, z, rim ? B.LOG : Math.abs(dx) === 3 || Math.abs(dz) === 3 ? B.BIRCH_PLANKS : B.PLANKS);
      if (rim) set(x, deck + 1, z, B.OAK_FENCE);
    }
    box(cx - 2, deck + 1, cz - 3, cx + 1, deck + 1, cz - 3, B.OAK_FENCE);
    set(cx - 2, deck + 1, cz - 2, B.OAK_FENCE);
    for (const dx of [-5, 5]) for (const dz of [-5, 5]) {
      box(cx + dx, g + 1, cz + dz, cx + dx, deck - 1, cz + dz, B.LOG);
      box(cx + dx - 1, deck - 2, cz + dz, cx + dx + 1, deck - 1, cz + dz, B.PLANKS);
    }
    for (const dx of [-6, 6]) for (const dz of [-5, 5]) {
      set(cx + dx, deck + 1, cz + dz, B.OAK_FENCE);
      set(cx + dx, deck + 2, cz + dz, B.BRAZIER);
    }

    const x = cx + (i % 2 ? -5 : 1), z = cz + 1;
    const roof = i % 2 ? B.DARKSLATE_BRICKS : B.ROOF_TILES;
    K.house({ x0: x, z0: z, x1: x + 4, z1: z + 4, h: 4, wall: B.BIRCH_PLANKS, corner: B.LOG,
      roof, ridge: "z", doorSide: "n", doorAt: x + 2, base: deck });
    K.bed(x + 1, deck + 1, z + 3);
    K.chest(x + 3, deck + 1, z + 3, 2, "treehouse", "Treehouse Chest");
    set(x + 3, deck + 1, z + 1, [B.MAP_TABLE, B.LOOM, B.BOOKSHELF, B.TABLE][i]);
    set(x + 1, deck + 1, z + 1, B.STONE_STEP);
    set(x + 2, deck + 3, z, B.SHINESTONE);
    K.place("tree" + i, cx, cz, 6, deck);
  });

  // Straight, level spans line up with an opening on each deck. The rail posts have floor under them.
  function bridge([ax, az], [bx, bz]) {
    const horizontal = Math.abs(ax - bx) > Math.abs(az - bz);
    const fixed = horizontal ? Math.round((az + bz) / 2) : Math.round((ax + bx) / 2);
    const start = Math.min(horizontal ? ax : az, horizontal ? bx : bz) + DECK_RADIUS;
    const end = Math.max(horizontal ? ax : az, horizontal ? bx : bz) - DECK_RADIUS;
    for (let u = start; u <= end; u++) for (let v = -2; v <= 2; v++) {
      const x = horizontal ? u : fixed + v, z = horizontal ? fixed + v : u;
      const rim = Math.abs(v) === 2;
      set(x, deck, z, rim ? B.LOG : (u - start) % 6 === 0 ? B.BIRCH_PLANKS : B.PLANKS);
      set(x, deck + 1, z, rim ? B.OAK_FENCE : B.AIR);
      if (rim && (u - start) % 7 === 3) {
        set(x, deck + 2, z, B.BRAZIER);
        set(x, deck - 1, z, B.PLANKS);
      }
    }
  }
  for (let i = 0; i < trees.length; i++) bridge(trees[i], trees[(i + 1) % trees.length]);

  const [x, z] = trees[2];
  for (const [dx, dz] of [[-6, 3], [-5, 3], [-5, 5], [-3, 5]]) {
    set(x + dx, deck, z + dz, B.DIRT);
    set(x + dx, deck + 1, z + dz, dz === 3 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  }
  set(x - 6, deck + 1, z + 4, B.LOG);
  set(x - 6, deck + 2, z + 4, make(B.BEE_NEST, 1));
  set(x - 5, deck + 1, z + 4, B.BEEHIVE);
  K.npc("oakwoodBeekeeper", x - 4, z + 4, deck + 1);
}

export function buildOakwoodCamp(K) {
  const { g, set, box } = K;
  box(5, g, -7, 15, g, 2, B.PLANKS);
  for (const x of [6, 14]) for (const z of [-6, 2]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  for (let z = -7; z <= 3; z++) {
    const y = g + 5 + Math.floor((5 - Math.abs(z + 2)) / 2);
    box(5, y, z, 15, y, z, x => (x - 5) % 3 === 1 ? B.WOOL : B.WARPED_PLANKS);
  }
  box(6, g + 4, -6, 14, g + 4, -6, B.LOG);
  box(6, g + 4, 2, 14, g + 4, 2, B.LOG);
  for (const x of [8, 12]) set(x, g + 4, -2, B.SHINESTONE);
  set(8, g + 1, -4, B.MAP_TABLE);
  box(7, g + 1, -5, 7, g + 2, -5, B.BOOKSHELF);
  set(13, g + 1, -4, B.HAY);
  set(8, g + 1, 0, B.STONE_STEP);
  set(12, g + 1, 0, B.STONE_STEP);
}

export function finishOakwoodGround(K, trees, cabins) {
  const { g, set, box } = K;
  const pathBlocks = new Set([B.GRASS, B.DIRT, B.GRAVEL]);
  function path(x0, z0, x1, z1) {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (pathBlocks.has(K.get(x, g, z))) set(x, g, z, (3 * x + z * 5) % 11 === 0 ? B.MOSSY : B.GRAVEL);
    }
  }
  function lamp(x, z) {
    if (K.get(x, g + 1, z) !== B.AIR) return;
    set(x, g + 1, z, B.STONE_BRICKS);
    set(x, g + 2, z, B.OAK_FENCE);
    set(x, g + 3, z, B.BRAZIER);
  }
  path(-1, -38, 1, 38); path(-38, -1, 38, 1);
  path(-31, -11, -29, 12); path(27, -15, 29, 12);
  path(-31, 17, 29, 19);
  path(-23, -16, -21, -1); path(19, -20, 21, -1);
  path(-21, 19, -19, 30); path(21, 19, 23, 28);
  path(4, 0, 6, 2);
  path(-5, 24, -1, 24); path(1, 25, 8, 25);
  for (const x of [-30, 0, 28]) {
    box(x - 1, g, 12, x + 1, g, 17, B.PLANKS);
    for (const side of [-2, 2]) {
      box(x + side, g, 13, x + side, g, 16, B.LOG);
      for (const z of [12, 17]) lamp(x + side, z);
    }
  }
  for (const [x, z] of [[-3, -9], [3, -9], [-3, 9], [3, 9], [-3, 23], [3, 24], [6, 4], [14, 4], [-11, 3], [11, 3]]) lamp(x, z);

  K.farm(-12, 21, -5, 30);
  set(-5, g + 1, 24, B.AIR);
  set(-6, g, 24, B.PLANKS);
  set(-6, g + 1, 30, B.COMPOSTER);
  for (const [z, flower] of [[22, B.FLOWER_RED], [24, B.FLOWER_YELLOW], [27, B.FLOWER_YELLOW], [29, B.FLOWER_RED]]) {
    set(-4, g, z, B.DIRT);
    set(-4, g + 1, z, flower);
  }
  box(8, g, 22, 14, g, 28, B.PLANKS);
  for (const x of [8, 14]) for (const z of [22, 28]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  for (let x = 7; x <= 15; x++) {
    const y = g + 5 + Math.floor((4 - Math.abs(x - 11)) / 2);
    box(x, y, 21, x, y, 29, B.DARKSLATE_BRICKS);
  }
  for (const z of [22, 28]) box(8, g + 4, z, 14, g + 4, z, B.LOG);
  box(13, g + 1, 23, 14, g + 1, 27, B.LOG);
  box(14, g + 2, 23, 14, g + 2, 27, B.LOG);
  set(11, g + 1, 23, B.TABLE);
  set(11, g + 4, 25, B.SHINESTONE);

  // The four entrances keep their five-block openings beneath timber lintels.
  for (const side of [-1, 1]) {
    box(-3, g + 4, side * 40, 3, g + 4, side * 40, B.LOG);
    box(-4, g + 5, side * 41, 4, g + 5, side * 39, B.DARKSLATE_BRICKS);
    box(side * 40, g + 4, -3, side * 40, g + 4, 3, B.LOG);
    box(side * 41, g + 5, -4, side * 39, g + 5, 4, B.DARKSLATE_BRICKS);
    for (const offset of [-3, 3]) {
      set(offset, g + 3, side * 39, B.SHINESTONE);
      set(side * 39, g + 3, offset, B.SHINESTONE);
    }
  }
  for (const [x, z] of cabins) {
    const side = x < 0 ? 1 : -1, front = x < 0 ? x + 6 : x;
    path(front + side, z + 1, front + side, z + 3);
    for (const dz of [1, 4]) {
      set(front, g + 2, z + dz, B.GLASS);
      const garden = front + side;
      if (K.get(garden, g + 1, z + dz) === B.AIR) {
        set(garden, g, z + dz, B.DIRT);
        set(garden, g + 1, z + dz, dz === 1 ? B.FLOWER_RED : B.FLOWER_YELLOW);
      }
    }
    set(front, g + 3, z + 2, B.SHINESTONE);
    const inner = front - side * 2;
    set(inner, g + 1, z + 1, B.FURNACE);
    set(inner, g + 1, z + 4, B.BOOKSHELF);
  }
  for (const [x, z] of trees) {
    if (K.get(x, g, z + 3) === B.GRASS) set(x, g, z + 3, B.GRAVEL);
    lamp(x - 3, z + 3);
    lamp(x + 3, z + 3);
  }
}
