import { B, make } from "./blocks.js";

// Sandspire's second layout reuses the original town's quests, chests, Waystone and stair geometry.
export function finishCampaignSandspire(K, stalls, homes) {
  const { g } = K;
  const get = (x, y, z) => K.get(x, g + y, z);
  const set = (x, y, z, block) => K.set(x, g + y, z, block);
  const box = (x0, y0, z0, x1, y1, z1, block) => K.box(x0, g + y0, z0, x1, g + y1, z1, block);
  const paving = new Set([B.SAND, B.SANDSTONE, B.SUN_BRICKS, B.TEMPLE_STONE]);
  function pave(x0, z0, x1, z1) {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (paving.has(get(x, 0, z))) set(x, 0, z, (x * 3 + z * 5) % 11 === 0 ? B.TEMPLE_TRIM : B.TEMPLE_STONE);
    }
  }
  function lamp(x, z) {
    if (get(x, 1, z) !== B.AIR) return;
    set(x, 1, z, B.TEMPLE_PILLAR);
    set(x, 2, z, B.OAK_FENCE);
    set(x, 3, z, B.BRAZIER);
  }
  function planted(x, z, flower) {
    if (get(x, 1, z) !== B.AIR || get(x, 0, z) !== B.SAND) return;
    set(x, 0, z, B.DIRT);
    set(x, 1, z, flower);
  }

  // The avenues meet at a stone-edged oasis. Water still runs beneath the short bridge.
  pave(-2, 6, 2, 38);
  pave(-38, -2, 38, 2);
  pave(-2, -16, 2, -6);
  pave(-2, -38, 2, -35);
  for (let z = -10; z <= 10; z++) for (let x = -10; x <= 10; x++) {
    const r = Math.hypot(x, z);
    if (r > 6.3 && r <= 10.5 && paving.has(get(x, 0, z))) {
      set(x, 0, z, r > 9.6 ? B.TEMPLE_TRIM : r < 7.3 ? B.SUN_BRICKS : B.TEMPLE_STONE);
    }
  }
  box(-6, 0, -1, 6, 0, 1, B.PLANKS);
  for (const z of [-1, 1]) for (const x of [-5, -2, 2, 5]) {
    set(x, -1, z, B.LOG);
    set(x, 1, z, B.OAK_FENCE);
  }
  for (const x of [-8, 8]) for (const z of [-4, 4]) lamp(x, z);
  for (const x of [-6, 6]) for (const z of [-7, 7]) set(x, 1, z, B.TEMPLE_STEP);
  for (const [x, z] of [[-7, -9], [6, -9], [-10, 5], [10, 9], [-6, 11], [6, 11], [-11, -5]]) {
    planted(x, z, (x + z) % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  }
  for (let a = 13; a <= 33; a += 8) {
    for (const x of [-4, 4]) lamp(x, a);
    for (const x of [-a, a]) for (const z of [-3, 3]) lamp(x, z);
  }

  // Four tiled gates with open arches and glowing terracotta bands.
  for (const side of [-1, 1]) {
    for (const x of [-3, 3]) {
      box(x, 1, side * 35, x, 7, side * 36, B.TEMPLE_PILLAR);
      set(x, 8, side * 36, B.BRAZIER);
    }
    box(-3, 5, side * 35, 3, 6, side * 36, B.TEMPLE_STONE);
    box(-4, 7, side * 34, 4, 7, side * 37, B.TEMPLE_TRIM);
    box(-2, 8, side * 35, 2, 8, side * 36, B.WARPED_PLANKS);
    set(0, 9, side * 36, B.SHINESTONE);
    for (const z of [-3, 3]) {
      box(side * 35, 1, z, side * 36, 7, z, B.TEMPLE_PILLAR);
      set(side * 36, 8, z, B.BRAZIER);
    }
    box(side * 35, 5, -3, side * 36, 6, 3, B.TEMPLE_STONE);
    box(side * 34, 7, -4, side * 37, 7, 4, B.TEMPLE_TRIM);
    box(side * 35, 8, -2, side * 36, 8, 2, B.WARPED_PLANKS);
  }

  // Alternating awnings and working shop displays in the bazaar.
  const colors = [B.CRIMSON_PLANKS, B.WARPED_PLANKS, B.TEMPLE_TRIM];
  const display = [B.HAY, B.WOOL, B.BOOKSHELF, B.CLAY, B.COMPOSTER, B.MAP_TABLE];
  stalls.forEach(([x, z], i) => {
    pave(x - 2, z - 2, x + 2, z + 2);
    const color = colors[i % colors.length], face = z < 0 ? 1 : -1;
    box(x - 2, 4, z - 2, x + 2, 4, z + 2, xx => (xx - x) % 2 ? B.WOOL : color);
    box(x - 1, 5, z - 1, x + 1, 5, z + 1, color);
    set(x + 1, 1, z - face, display[i]);
    set(x + 1, 2, z + face, B.TORCH);
  });
  set(23, 1, 7, B.BOOKSHELF);
  K.npc("sandspireMapmaker", 24, 6);
  // Nia's open-air kiln keeps the west road clear.
  pave(-27, 3, -21, 6);
  for (const x of [-27, -21]) for (const z of [3, 6]) box(x, 1, z, x, 3, z, B.TEMPLE_PILLAR);
  box(-28, 4, 3, -20, 4, 6, x => x % 2 ? B.WARPED_PLANKS : B.WOOL);
  set(-26, 1, 5, make(B.FURNACE, 2));
  set(-26, 2, 5, B.TORCH);
  set(-22, 1, 5, B.CLAY);
  set(-23, 1, 5, B.TABLE);

  // Courtyard houses have shade porches, carved trim, and furnished interiors.
  homes.forEach(([x, z], i) => {
    const accent = i % 2 ? B.WARPED_PLANKS : B.TEMPLE_TRIM;
    pave(x + 2, z - 2, x + 4, z - 1);
    for (const dx of [1, 6]) {
      box(x + dx, 1, z - 2, x + dx, 2, z - 2, B.TEMPLE_PILLAR);
      set(x + dx, 2, z, B.STAINED_GLASS);
      set(x + dx, 3, z, B.STAINED_GLASS);
    }
    box(x, 3, z - 2, x + 7, 3, z - 1, xx => (xx - x) % 2 ? accent : B.WOOL);
    box(x, 4, z, x + 7, 4, z, B.TEMPLE_TRIM);
    box(x + 1, 5, z + 1, x + 6, 5, z + 5, B.TEMPLE_STONE);
    box(x + 2, 6, z + 2, x + 5, 6, z + 4, accent);
    set(x + 3, 1, z + 4, B.TABLE);
    set(x + 5, 1, z + 5, B.FURNACE);
    set(x + 6, 1, z + 2, B.BOOKSHELF);
    set(x + 4, 4, z + 3, B.SHINESTONE);
    box(x + 2, 0, z + 2, x + 5, 0, z + 3, accent);
    planted(x, z - 1, B.FLOWER_RED);
    planted(x + 7, z - 1, B.FLOWER_YELLOW);
  });

  // The Sun Palace gains a stepped dome, a columned entry, and a furnished map hall.
  box(-5, 9, -30, 5, 13, -20, B.AIR);
  for (const [level, radius] of [8, 7, 7, 6, 5, 4, 2, 1].entries()) {
    for (let z = -radius; z <= radius; z++) for (let x = -radius; x <= radius; x++) {
      if (Math.hypot(x, z) > radius + .35) continue;
      const material = level === 7 ? B.GOLD_BLOCK : level === 0 || level === 3 ? B.TEMPLE_TRIM : B.TEMPLE_STONE;
      set(x, 9 + level, -25 + z, material);
    }
  }
  set(0, 17, -25, B.BRAZIER);
  for (const x of [-12, -7, 7, 12]) {
    box(x, 1, -13, x, 5, -13, B.TEMPLE_PILLAR);
    box(x - 1, 6, -13, x + 1, 6, -16, B.TEMPLE_TRIM);
    box(x - 1, 7, -14, x + 1, 7, -16, B.TEMPLE_STONE);
    set(x, 5, -14, B.SHINESTONE);
    planted(x, -11, B.FLOWER_RED);
  }
  box(-13, 7, -16, 13, 7, -16, B.TEMPLE_TRIM);
  for (const z of [-34, -16]) for (let x = -12; x <= 12; x += 3) for (const y of [2, 3]) {
    if (get(x, y, z) === B.GLASS) set(x, y, z, B.STAINED_GLASS);
  }
  box(-1, 0, -32, 1, 0, -18, B.CRIMSON_PLANKS);
  for (const x of [-4, 4]) {
    box(x, 1, -29, x, 1, -24, B.BIRCH_PLANKS);
    set(x, 6, -25, B.SHINESTONE);
    set(x, 7, -25, B.OAK_FENCE);
  }
  set(4, 1, -24, B.MAP_TABLE);
  box(-11, 1, -30, -11, 2, -29, B.BOOKSHELF);
  box(11, 1, -30, 11, 2, -29, B.BOOKSHELF);
  pave(-2, -16, 2, -10);
  pave(15, -24, 19, -24);

  // Dress the tower exterior, then shade the lookout while leaving its stair exit and sightlines clear.
  for (let i = -4; i <= 4; i++) for (const [x, z] of [[24 + i, -28], [24 + i, -20], [20, -24 + i], [28, -24 + i]]) {
    for (const y of [5, 10, 15, 20, 25]) if (get(x, y, z) === B.SANDSTONE) set(x, y, z, B.TEMPLE_TRIM);
  }
  for (const x of [22, 26]) for (const z of [-26, -22]) box(x, 27, z, x, 29, z, B.TEMPLE_PILLAR);
  box(22, 30, -26, 26, 30, -22, x => x % 2 ? B.WOOL : B.WARPED_PLANKS);
  box(23, 31, -25, 25, 31, -23, B.TEMPLE_TRIM);
  set(24, 32, -24, B.BRAZIER);
}
