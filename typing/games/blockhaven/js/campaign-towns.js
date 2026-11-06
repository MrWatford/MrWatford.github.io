// The Legacy Campaign's places for Chapters 1–3 (Milestone 13, Part D): four towns, the ruined watchtower and its
// mine (the Stone Guardian's hall), three jungle ruins (one Ancient Key each), a shipwreck, and the three boss
// chambers behind the temple vaults. Each builder returns { cells, info } for one stamp (see js/campaign-kit.js).
// All builders are deterministic: the same inputs always make the same blocks.
import { B, HEIGHT, SEA, make, TOP } from "./blocks.js";
import { makeKit } from "./campaign-kit.js";

export const TOWNS_V = 1;
export const SIZES = { stonehaven: 112, ruin: 64, sandspire: 96, oakwood: 96, seabreak: 96, keyruin: 40, wreck: 40, throne: 80 };
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ======================= STONEHAVEN: the walled kingdom =======================
export function buildStonehaven(g, groundAt) {
  const K = makeKit(SIZES.stonehaven, g), { set, box } = K;
  K.ground(groundAt, 46, 54);
  const W = 42;
  // walls (two thick), battlements, four gates
  for (let i = -W; i <= W; i++) for (const [x, z] of [[i, W], [i, W - 1], [i, -W], [i, -W + 1], [W, i], [W - 1, i], [-W, i], [-W + 1, i]]) {
    for (let y = g + 1; y <= g + 7; y++) set(x, y, z, y === g + 7 ? B.STONE_BRICKS : (x * 5 + z * 3 + y) % 13 === 0 ? B.MOSSY : B.COBBLE);
    if ((Math.abs(x) === W || Math.abs(z) === W) && i % 2 === 0) set(x, g + 8, z, B.STONE_BRICKS);
  }
  for (const [xa, za, xb, zb] of [[-2, W - 1, 2, W], [-2, -W, 2, -W + 1], [W - 1, -2, W, 2], [-W, -2, -W + 1, 2]]) box(xa, g + 1, za, xb, g + 5, zb, B.AIR);
  for (const s of [-3, 3]) { box(s, g + 1, W - 1, s, g + 10, W, B.STONE_BRICKS); set(s, g + 11, W, B.TORCH); box(W - 1, g + 1, s, W, g + 10, s, B.STONE_BRICKS); box(-W, g + 1, s, -W + 1, g + 10, s, B.STONE_BRICKS); set(W, g + 11, s, B.TORCH); set(-W, g + 11, s, B.TORCH); }
  K.tower(-W, W, 7, 16, B.STONE_BRICKS, "e", -2); K.tower(W, W, 7, 16, B.STONE_BRICKS, "w", -2);
  K.tower(-W, -W, 7, 16, B.STONE_BRICKS, "e", 2); K.tower(W, -W, 7, 16, B.STONE_BRICKS, "w", 2);
  K.sign(-3, g + 1, W + 1, 0, "Stonehaven\n\nThe oldest kingdom in Blockhaven. Its walls have never fallen. King Aldric holds court in the castle to the north.");
  // roads and the plaza with its well
  K.road(-2, -18, 2, W); K.road(-W, -2, W, 2);
  for (let Z = -9; Z <= 9; Z++) for (let X = -9; X <= 9; X++) { const d = Math.hypot(X, Z); if (d <= 8.5) set(X, g, Z, d > 7.5 ? B.STONE_BRICKS : (Math.round(d) % 2 ? B.COBBLE : B.STONE_BRICKS)); }
  box(-2, g - 2, -2, 2, g, 2, B.COBBLE); box(-1, g - 1, -1, 1, g, 1, B.WATER);
  for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) box(x, g + 1, z, x, g + 3, z, B.OAK_FENCE);
  box(-2, g + 4, -2, 2, g + 4, 2, B.PLANKS); set(0, g + 5, 0, B.BRICKS); set(0, g + 3, 0, B.SHINESTONE);
  K.waystone("stonehaven", 5, 5);
  K.sign(-5, g + 1, 5, 0, "Stonehaven Square\n\nTouch the Waystone to remember this place. Once you have found two Waystones, you can travel between them.");
  for (const a of [0.4, 1.2, 2, 2.8, 3.6, 4.4, 5.2, 6]) K.lamp(Math.round(Math.cos(a) * 10), Math.round(Math.sin(a) * 10));
  for (let Z = 12; Z <= 38; Z += 8) { K.lamp(-4, Z); K.lamp(4, Z); }
  for (let X = 12; X <= 38; X += 8) { K.lamp(X, -4); K.lamp(-X, -4); K.lamp(X, 4); K.lamp(-X, 4); }
  K.place("stonehaven", 0, 0, 40);
  // the royal castle
  const X0 = -22, X1 = 22, Z0 = -40, Z1 = -18;
  for (let z = Z0; z <= Z1; z++) for (let x = X0; x <= X1; x++) {
    const edge = x === X0 || x === X1 || z === Z0 || z === Z1;
    set(x, g, z, B.GRASS);
    if (!edge) continue;
    for (let y = g + 1; y <= g + 9; y++) set(x, y, z, B.STONE_BRICKS);
    if ((x + z) % 2 === 0) set(x, g + 10, z, B.STONE_BRICKS);
  }
  box(-2, g + 1, Z1, 2, g + 5, Z1, B.AIR); box(-2, g, -24, 2, g, Z1, B.STONE_BRICKS);
  for (const x of [X0, X1]) for (const z of [Z0, Z1]) { box(x - 2, g + 1, z - 2, x + 2, g + 13, z + 2, (xx, y, zz) => (Math.abs(xx - x) === 2 || Math.abs(zz - z) === 2 || y === g + 13 ? B.STONE_BRICKS : B.AIR)); for (let k = -2; k <= 2; k += 2) { set(x + k, g + 14, z - 2, B.STONE_BRICKS); set(x + k, g + 14, z + 2, B.STONE_BRICKS); } }
  // the keep: throne hall below, the king's rooms above, a roof with battlements
  const KX0 = -11, KX1 = 11, KZ0 = -38, KZ1 = -26;
  box(KX0, g, KZ0, KX1, g, KZ1, B.STONE_BRICKS);
  for (let y = g + 1; y <= g + 14; y++) for (let z = KZ0; z <= KZ1; z++) for (let x = KX0; x <= KX1; x++) {
    const edge = x === KX0 || x === KX1 || z === KZ0 || z === KZ1;
    set(x, y, z, edge || y === g + 7 || y === g + 14 ? B.STONE_BRICKS : B.AIR);
  }
  for (let x = KX0; x <= KX1; x += 2) { set(x, g + 15, KZ0, B.STONE_BRICKS); set(x, g + 15, KZ1, B.STONE_BRICKS); }
  for (let z = KZ0; z <= KZ1; z += 2) { set(KX0, g + 15, z, B.STONE_BRICKS); set(KX1, g + 15, z, B.STONE_BRICKS); }
  for (let x = KX0 + 2; x <= KX1 - 2; x += 3) for (const y of [g + 3, g + 4, g + 10, g + 11]) { if (Math.abs(x) > 1) set(x, y, KZ1, B.GLASS); set(x, y, KZ0, B.GLASS); }
  box(-1, g + 1, KZ1, 1, g + 3, KZ1, B.AIR); K.door(0, g + 1, KZ1, "s");
  box(-1, g, -36, 1, g, -27, B.WOOL);
  box(-3, g + 1, -37, 3, g + 1, -36, B.STONE_BRICKS); set(0, g + 2, -37, B.GOLD_BLOCK); box(0, g + 3, -37, 0, g + 4, -37, B.GOLD_BLOCK);
  for (const x of [-6, 6]) for (const z of [-35, -30]) box(x, g + 1, z, x, g + 6, z, B.LOG);
  for (const [x, z] of [[-4, -32], [4, -32]]) { set(x, g + 6, z, B.SHINESTONE); }
  for (const x of [-9, -7, 7, 9]) box(x, g + 2, KZ0 + 1, x, g + 5, KZ0 + 1, x % 4 ? B.WOOL : B.BLACK_WOOL);
  for (let k = 1; k <= 7; k++) box(KX0 + 1, g + 1, -27 - k, KX0 + 2, g + k, -27 - k, B.STONE_BRICKS);
  box(KX0 + 1, g + 7, -33, KX0 + 2, g + 7, -28, B.AIR);
  for (let k = 1; k <= 7; k++) box(KX1 - 2, g + 8, -27 - k, KX1 - 1, g + 7 + k, -27 - k, B.STONE_BRICKS);
  box(KX1 - 2, g + 14, -33, KX1 - 1, g + 14, -28, B.AIR);
  box(KX0 + 3, g + 7, KZ0 + 1, KX1 - 3, g + 7, KZ1 - 1, B.PLANKS);
  K.bed(-6, g + 8, -36); K.bed(-4, g + 8, -36);
  K.chest(0, g + 8, -37, 0, "shRoyal", "Royal Treasury"); K.chest(6, g + 8, -37, 0, "shArmory", "Stonehaven Armory");
  for (let x = 3; x <= 9; x++) { set(x, g + 8, KZ1 - 1, B.BOOKSHELF); }
  set(0, g + 13, -32, B.SHINESTONE);
  K.npc("king", 0, -34); K.place("shCastle", 0, -30, 14);
  K.sign(-3, g + 1, -18, 0, "Castle Stonehaven\n\nHome of King Aldric and the Stonehaven Guard.");
  // shops along the east road
  const shops = [[10, -12, 18, -6, "n", "Armorer", "smith2", "shopArmor"], [22, -12, 30, -6, "n", "General Store", null, "shopGeneral"], [10, 6, 18, 12, "s", "Bakery", "baker", "shopBakery"], [22, 6, 30, 12, "s", "Tailor", null, "shopTailor"]];
  shops.forEach(([x0, z0, x1, z1, face, name, who, loot], i) => {
    const door = face === "n" ? "s" : "n", dz = face === "n" ? z1 : z0;
    K.house({ x0, z0, x1, z1, h: 4, wall: i % 2 ? B.PLANKS : B.BIRCH_PLANKS, corner: B.LOG, floor: B.PLANKS, roof: i % 2 ? B.BRICKS : B.COBBLE, doorSide: door, doorAt: (x0 + x1) >> 1 });
    K.sign(((x0 + x1) >> 1) + 2, g + 1, dz + (face === "n" ? 1 : -1), face === "n" ? 0 : 2, name + "\n\nOpen for business. Everything on the shelves is free for heroes of the realm!");
    K.chest(x0 + 1, g + 1, face === "n" ? z0 + 1 : z1 - 1, 1, loot, "Stonehaven " + name);
    box(x0 + 2, g + 1, face === "n" ? z0 + 1 : z1 - 1, x1 - 2, g + 1, face === "n" ? z0 + 1 : z1 - 1, B.PLANKS);
    if (who) K.npc(who, (x0 + x1) >> 1, (z0 + z1) >> 1);
  });
  K.place("shMarket", 20, 0, 12);
  // the barracks
  K.house({ x0: -38, z0: -16, x1: -24, z1: -6, h: 5, wall: B.COBBLE, corner: B.STONE_BRICKS, floor: B.PLANKS, roof: B.COBBLE, doorSide: "s", doorAt: -31 });
  for (let x = -37; x <= -25; x += 3) K.bed(x, g + 1, -14);
  K.chest(-37, g + 1, -8, 1, "shBarracks", "Barracks Locker"); K.chest(-25, g + 1, -8, 3, "shBarracks2", "Barracks Locker");
  K.npc("captainB", -31, -3); K.place("shBarracks", -31, -11, 8);
  K.sign(-28, g + 1, -5, 0, "Barracks of the Stonehaven Guard\n\nCaptain Brenna drills the guard here every morning.");
  // homes
  [[-36, 8], [-24, 8], [-36, 20], [-24, 20], [-36, 32], [-24, 32]].forEach(([x0, z0], i) => {
    K.house({ x0, z0, x1: x0 + 6, z1: z0 + 6, h: 4, wall: i % 2 ? B.PLANKS : B.BIRCH_PLANKS, corner: B.LOG, floor: B.PLANKS, roof: i % 3 ? B.BRICKS : B.COBBLE, ridge: "z", doorSide: "e", doorAt: z0 + 3 });
    K.bed(x0 + 1, g + 1, z0 + 2); set(x0 + 1, g + 1, z0 + 5, B.TABLE); K.chest(x0 + 1, g + 1, z0 + 3, 1, "home", "Home Supplies");
  });
  // the inn
  K.house({ x0: -14, z0: 26, x1: -6, z1: 38, h: 5, wall: B.PLANKS, corner: B.LOG, floor: B.PLANKS, roof: B.BRICKS, ridge: "z", doorSide: "e", doorAt: 32 });
  box(-12, g + 1, 28, -8, g + 1, 28, B.PLANKS); for (const z of [31, 35]) { set(-12, g + 1, z, B.PLANKS); set(-11, g + 1, z, B.OAK_FENCE); }
  K.bed(-13, g + 1, 37); K.chest(-13, g + 1, 33, 1, "inn", "Innkeeper's Pantry");
  K.sign(-5, g + 1, 30, 1, "The Sleeping Griffin Inn\n\nWarm beds and warmer soup.");
  K.npc("innkeeper", -9, 32); K.place("shInn", -10, 32, 6);
  // farms in the south-east
  K.farm(10, 18, 38, 38); set(9, g + 1, 18, B.COMPOSTER); K.npc("townFarmer", 24, 16);
  for (const [sp, x, z] of [["cow", 34, -30], ["sheep", 30, -34], ["chicken", 36, -26]]) K.animal(sp, x, z);
  for (let z = -36; z <= -24; z++) { set(28, g + 1, z, B.OAK_FENCE); set(38, g + 1, z, B.OAK_FENCE); }
  for (let x = 28; x <= 38; x++) { set(x, g + 1, -36, B.OAK_FENCE); set(x, g + 1, -24, x === 33 ? make(B.OAK_GATE, 0) : B.OAK_FENCE); }
  K.npc("guardB", 0, 38);
  // where raiders gather (outside the gates)
  K.info.marks.raid = [K.at(0, 50), K.at(50, 0), K.at(-50, 0)].map(p => ({ ...p, y: g + 1 }));
  return K;
}

// ======================= the ruined watchtower and the Stone Guardian's hall =======================
export function buildRuin(g, groundAt) {
  const K = makeKit(SIZES.ruin, g), { set, box } = K;
  K.ground(groundAt, 22, 30);
  // the broken tower: a round wall, torn down unevenly, rubble all around, scorched ground
  for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) {
    const d = Math.hypot(dx, dz); if (d > 5.5) continue;
    set(dx, g, dz, d > 4.5 ? B.STONE_BRICKS : B.COBBLE);
    if (d > 4.5) { const a = Math.atan2(dz, dx), h = 2 + Math.floor(Math.abs(Math.sin(a * 3)) * 7); for (let y = g + 1; y <= g + h; y++) set(dx, y, dz, (y + dx) % 4 ? B.STONE_BRICKS : B.MOSSY); }
  }
  box(-1, g + 1, 5, 1, g + 4, 5, B.AIR); box(4, g + 1, -2, 5, g + 3, 1, B.AIR);
  for (let k = 0; k < 40; k++) { const a = hash(k, 1) * Math.PI * 2, r = 6 + hash(k, 2) * 10, x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r); set(x, g + 1, z, hash(k, 3) < 0.6 ? B.COBBLE : B.STONE_BRICKS); if (hash(k, 4) < 0.3) set(x, g + 2, z, B.COBBLE); }
  for (let k = 0; k < 30; k++) { const x = Math.round((hash(k, 5) - 0.5) * 24), z = Math.round((hash(k, 6) - 0.5) * 24); if (Math.hypot(x, z) > 6) set(x, g, z, B.BLACKSTONE); }
  // huge stone footprints leading from the tower to the old mine
  for (let k = 0; k < 6; k++) { const x = 6 + k * 3, z = (k % 2 ? -4 : -7); box(x, g, z, x + 1, g, z + 1, B.GRAVEL); }
  K.sign(0, g + 1, 2, 0, "The Ruined Watchtower\n\nThe stones here were not pushed. They were torn apart, as if by giant hands. Huge footprints of crushed stone lead east, toward the old mine.");
  K.waystone("ruin", -8, 8);
  K.place("watchtower", 0, 0, 9);
  // the old mine: a shed, then stairs down to a guarded hall far below
  const F = g - 13, CX = -6, CZ = -6, R = 11;
  box(-20, F - 3, -20, 30, F + 10, 8, B.STONE);
  K.house({ x0: 24, z0: -10, x1: 30, z1: -2, h: 4, wall: B.COBBLE, corner: B.LOG, floor: B.PLANKS, roof: B.COBBLE, ridge: "z", doorSide: "s", doorAt: 27 });
  box(24, g + 1, -7, 24, g + 3, -5, B.AIR);
  for (let k = 0; k <= 13; k++) { const x = 26 - k; box(x, g - k - 1, -7, x, g - k - 1, -5, B.STONE); box(x, g - k, -7, x, g - k + 3, -5, B.AIR); if (k % 4 === 2) set(x, g - k + 2, -8, B.TORCH); }
  box(23, g, -7, 26, g, -5, B.AIR);
  box(6, F - 1, -7, 13, F - 1, -5, B.STONE); box(6, F, -7, 13, F + 3, -5, B.AIR);
  for (const x of [8, 12]) { box(x, F, -8, x, F + 2, -8, B.LOG); box(x, F, -4, x, F + 2, -4, B.LOG); box(x, F + 3, -8, x, F + 3, -4, B.PLANKS); }
  K.arena(CX, F, CZ, R, 8, B.STONE_BRICKS, B.STONE_BRICKS, B.STONE);
  box(CX + R - 1, F, -7, CX + R + 2, F + 3, -5, B.AIR); box(CX + R - 1, F - 1, -7, CX + R + 2, F - 1, -5, B.STONE_BRICKS);
  for (const [dx, dz] of [[5, 5], [-5, 5], [5, -5], [-5, -5]]) box(CX + dx, F, CZ + dz, CX + dx, F + 7, CZ + dz, B.STONE_BRICKS);
  const devices = K.runes(CX, F, CZ, R - 3);
  K.chest(CX - R + 2, F, CZ, 1, "hoard", "The Guardian's Hoard");
  K.sign(CX + R - 2, F, CZ + 2, 3, "The Hall of the Guardian\n\n\"Here the First Builders set a guardian of stone, to keep the road to Sandspire. Only one who carries the sun's map may pass.\"");
  K.info.arenas.stoneguard = { X: CX, y: F, Z: CZ, r: R, devices };
  K.place("oldMine", 27, -6, 6); K.place("guardianHall", CX, CZ, R, F);
  return K;
}

// ======================= SANDSPIRE: the desert town =======================
export function buildSandspire(g, groundAt) {
  const K = makeKit(SIZES.sandspire, g), { set, box } = K;
  K.ground(groundAt, 38, 46, B.SAND, B.SAND);
  const W = 36;
  for (let i = -W; i <= W; i++) for (const [x, z] of [[i, W], [i, -W], [W, i], [-W, i]]) {
    if (Math.abs(i) <= 2) continue;
    for (let y = g + 1; y <= g + 4; y++) set(x, y, z, B.SANDSTONE);
    if (i % 2 === 0) set(x, g + 5, z, B.SANDSTONE);
  }
  for (const [x, z] of [[-3, W], [3, W], [-3, -W], [3, -W], [W, -3], [W, 3], [-W, -3], [-W, 3]]) { box(x, g + 1, z, x, g + 7, z, B.SUN_BRICKS); set(x, g + 8, z, B.TORCH); }
  K.road(-2, -16, 2, W, B.SANDSTONE, B.SUN_BRICKS); K.road(-W, -2, W, 2, B.SANDSTONE, B.SUN_BRICKS);
  // the oasis and its palms
  for (let dz = -7; dz <= 7; dz++) for (let dx = -7; dx <= 7; dx++) { const d = Math.hypot(dx, dz); if (d > 7.5) continue; if (d > 5) set(dx, g, dz, B.SANDSTONE); else { set(dx, g, dz, B.WATER); set(dx, g - 1, dz, B.WATER); set(dx, g - 2, dz, B.SAND); } }
  const palm = (x, z, h) => { for (let y = g + 1; y <= g + h; y++) set(x + (y > g + h - 2 ? 1 : 0), y, z, B.LOG); const tx = x + 1, ty = g + h + 1; set(tx, ty, z, B.LEAVES); for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 3; k++) set(tx + ax * k, ty - (k === 3 ? 1 : 0), z + az * k, B.LEAVES); };
  palm(-9, -6, 6); palm(8, 8, 7); palm(-8, 9, 5); palm(9, -9, 6);
  K.waystone("sandspire", 0, 9);
  K.place("sandspire", 0, 0, 34);
  // the palace with its golden dome
  const PX0 = -14, PX1 = 14, PZ0 = -34, PZ1 = -16;
  K.house({ x0: PX0, z0: PZ0, x1: PX1, z1: PZ1, h: 8, wall: B.SANDSTONE, corner: B.SUN_BRICKS, floor: B.SUN_BRICKS, roof: B.SANDSTONE, flat: true, doorSide: "s", doorAt: 0 });
  box(-1, g + 1, PZ1, 1, g + 4, PZ1, B.AIR);
  for (let k = 0; k < 5; k++) box(-5 + k, g + 9 + k, -30 + k, 5 - k, g + 9 + k, -20 - k, k === 4 ? B.GOLD_BLOCK : k % 2 ? B.GOLD_BLOCK : B.SANDSTONE);
  for (const x of [-10, -6, 6, 10]) for (const z of [-30, -22]) box(x, g + 1, z, x, g + 7, z, B.SUN_BRICKS);
  box(-1, g, -32, 1, g, -18, B.WOOL); box(-3, g + 1, -33, 3, g + 1, -32, B.SANDSTONE); set(0, g + 2, -33, B.GOLD_BLOCK);
  K.chest(-12, g + 1, -33, 0, "spPalace", "Palace Storeroom"); K.chest(12, g + 1, -33, 0, "spPalace2", "Palace Storeroom");
  K.sign(3, g + 1, -32, 0, "The Sun Palace\n\nElder Rasha keeps the old maps of the desert. The great pyramid lies beneath the dunes to the south and west.");
  K.npc("rasha", 0, -26); K.place("spPalace", 0, -25, 10);
  // the Sandspire itself: a tall tower to climb
  K.tower(24, -24, 9, 26, B.SANDSTONE, "w");
  K.place("spire", 24, -24, 5); K.place("spireTop", 24, -24, 5, g + 26);
  // the bazaar
  for (const [x, z] of [[8, -6], [16, -6], [24, -6], [8, 6], [16, 6], [24, 6]]) {
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) box(x + dx, g + 1, z + dz, x + dx, g + 3, z + dz, B.OAK_FENCE);
    box(x - 2, g + 4, z - 2, x + 2, g + 4, z + 2, (xx, y, zz) => ((xx + zz) % 2 ? B.WOOL : B.BLACK_WOOL));
    box(x - 1, g + 1, z + (z < 0 ? 1 : -1), x + 1, g + 1, z + (z < 0 ? 1 : -1), B.SANDSTONE);
  }
  K.chest(16, g + 1, -7, 0, "bazaar", "Bazaar Crate"); K.npc("kadir", 16, -3); K.place("bazaar", 16, 0, 12);
  // flat-roofed houses
  [[-30, 8], [-20, 8], [-30, 20], [-20, 20], [8, 20], [20, 20]].forEach(([x0, z0], i) => {
    K.house({ x0, z0, x1: x0 + 7, z1: z0 + 6, h: 4, wall: B.SANDSTONE, corner: B.SUN_BRICKS, floor: B.SANDSTONE, roof: B.SANDSTONE, flat: true, doorSide: "n", doorAt: x0 + 3, win: B.AIR });
    K.bed(x0 + 1, g + 1, z0 + 5); K.chest(x0 + 6, g + 1, z0 + 5, 2, "spHome", "Clay Jar Chest");
  });
  K.npc("potter", -24, 4);
  for (const [x, z] of [[-26, -12], [-14, -10], [30, 30], [-30, 30]]) { box(x, g + 1, z, x, g + 3, z, B.SANDSTONE); set(x, g + 4, z, B.TORCH); }
  return K;
}

// ======================= OAKWOOD: the forest town in the treetops =======================
export function buildOakwood(g, groundAt) {
  const K = makeKit(SIZES.oakwood, g), { set, box } = K;
  K.ground(groundAt, 38, 46);
  const P = g + 10;   // the treetop walkways
  // a palisade with four gates
  for (let i = -40; i <= 40; i++) for (const [x, z] of [[i, 40], [i, -40], [40, i], [-40, i]]) if (Math.abs(i) > 2) { set(x, g + 1, z, B.LOG); set(x, g + 2, z, B.LOG); if (i % 2) set(x, g + 3, z, B.OAK_FENCE); }
  // a stream across the town, with bridges
  for (let x = -47; x <= 47; x++) for (let z = 13; z <= 16; z++) { set(x, g, z, B.WATER); set(x, g - 1, z, B.WATER); set(x, g - 2, z, B.GRAVEL); }
  for (const bx of [-30, 0, 28]) { box(bx - 1, g, 12, bx + 1, g, 17, B.PLANKS); for (let z = 13; z <= 16; z++) { set(bx - 2, g + 1, z, B.OAK_FENCE); set(bx + 2, g + 1, z, B.OAK_FENCE); } }
  K.road(-1, -40, 1, 40, B.GRAVEL, B.DIRT); K.road(-40, -1, 40, 1, B.GRAVEL, B.DIRT);
  // four giant trees with spiral stairs, platforms, and little huts; bridges between them high above
  const trees = [[-22, -18], [20, -22], [22, 26], [-20, 28]];
  trees.forEach(([cx, cz], i) => {
    for (let y = g - 2; y <= g + 22; y++) box(cx - 1, y, cz - 1, cx + 1, y, cz + 1, B.LOG);
    for (let dz = -8; dz <= 8; dz++) for (let dx = -8; dx <= 8; dx++) for (let dy = -3; dy <= 5; dy++) {
      const d = Math.hypot(dx, dz * 1, dy * 1.6); if (d > 7.6 || hash(dx * 17 + i, dz * 31 + dy) < 0.08) continue;
      const y = g + 21 + dy; if (y >= HEIGHT - 1) continue;
      if (K.get(cx + dx, y, cz + dz) === B.AIR) set(cx + dx, y, cz + dz, B.LEAVES);
    }
    const ring = K.squareRing(cx, cz, 2, 0, 2);
    for (const [x, z] of ring) for (let y = g + 1; y <= P + 3; y++) set(x, y, z, B.AIR);
    const holes = K.spiral(ring, g, P - g, B.PLANKS);
    for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
      if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) continue;
      const x = cx + dx, z = cz + dz, onRing = Math.max(Math.abs(dx), Math.abs(dz)) === 2;
      if (onRing && holes.has(x + "," + z)) continue;
      set(x, P, z, B.PLANKS);
      if (Math.max(Math.abs(dx), Math.abs(dz)) === 5) set(x, P + 1, z, B.OAK_FENCE);
    }
    for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { set(cx + dx, P + 2, cz + dz, B.TORCH); box(cx + dx, g + 1, cz + dz, cx + dx, P - 1, cz + dz, B.LOG); }
    const hx = cx + (i % 2 ? -5 : 1), hz = cz + 1;
    K.house({ x0: hx, z0: hz, x1: hx + 4, z1: hz + 4, h: 3, wall: B.PLANKS, corner: B.LOG, floor: B.PLANKS, roof: B.LEAVES, ridge: "x", doorSide: "n", doorAt: hx + 2, base: P });
    K.bed(hx + 1, P + 1, hz + 3); K.chest(hx + 3, P + 1, hz + 3, 2, "treehouse", "Treehouse Chest");
    K.place("tree" + i, cx, cz, 6, P);
  });
  const walk = ([ax, az], [bx, bz]) => {
    const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
    for (let s = 0; s <= n; s++) {
      const x = Math.round(ax + (bx - ax) * s / n), z = Math.round(az + (bz - az) * s / n);
      if (Math.max(Math.abs(x - ax), Math.abs(z - az)) <= 5 || Math.max(Math.abs(x - bx), Math.abs(z - bz)) <= 5) continue;
      const wide = Math.abs(bx - ax) > Math.abs(bz - az);
      for (let k = -1; k <= 1; k++) set(x + (wide ? 0 : k), P, z + (wide ? k : 0), B.PLANKS);
      set(x + (wide ? 0 : -2), P + 1, z + (wide ? -2 : 0), B.OAK_FENCE); set(x + (wide ? 0 : 2), P + 1, z + (wide ? 2 : 0), B.OAK_FENCE);
    }
  };
  walk(trees[0], trees[1]); walk(trees[1], trees[2]); walk(trees[2], trees[3]); walk(trees[3], trees[0]);
  // the explorers' camp (a big tent), log cabins, a sawmill
  for (let z = -6; z <= 2; z++) for (let x = 6; x <= 14; x++) { const h = 4 - Math.abs(z + 2) * 0.8; if (h < 0.5) continue; set(x, g + Math.round(h), z, (x + z) % 2 ? B.WOOL : B.BLACK_WOOL); }
  box(6, g + 1, -2, 6, g + 4, -2, B.LOG); box(14, g + 1, -2, 14, g + 4, -2, B.LOG); set(10, g + 1, -5, B.TABLE); K.chest(12, g + 1, -5, 0, "camp", "Expedition Supplies");
  K.sign(8, g + 1, 3, 0, "Explorers' Camp\n\nExplorer Fenn has mapped every root and river in these woods. Almost.");
  K.npc("fenn", 10, -1); K.place("camp", 10, -2, 6);
  [[-34, -6], [-34, 4], [26, 4], [30, -8]].forEach(([x0, z0], i) => {
    K.house({ x0, z0, x1: x0 + 6, z1: z0 + 5, h: 4, wall: B.LOG, corner: B.LOG, floor: B.PLANKS, roof: B.PLANKS, ridge: "x", doorSide: x0 < 0 ? "e" : "w", doorAt: z0 + 2 });
    K.bed(x0 + (x0 < 0 ? 1 : 5), g + 1, z0 + 2); K.chest(x0 + (x0 < 0 ? 1 : 5), g + 1, z0 + 4, x0 < 0 ? 1 : 3, "cabin", "Cabin Chest");
  });
  K.npc("elm", -30, -10); K.npc("lumber", 30, -12);
  for (let k = 0; k < 18; k++) { const x = Math.round((hash(k, 9) - 0.5) * 70), z = Math.round((hash(k, 10) - 0.5) * 70); if (Math.abs(x) > 4 && Math.abs(z) > 4 && (z < 11 || z > 18) && [-1, 0, 1].every(d => K.get(x + d, g + 1, z) === B.AIR && K.get(x, g + 1, z + d) === B.AIR) && K.get(x, g, z) === B.GRASS && trees.every(([a, b]) => Math.hypot(a - x, b - z) > 10) && Math.hypot(x - 10, z + 2) > 8) K.tree(x, z, 5 + Math.floor(hash(k, 11) * 3)); }
  K.waystone("oakwood", -4, 4);
  K.sign(-4, g + 1, 6, 0, "Oakwood\n\nThe town in the trees. Climb the stairs around the great oaks to reach the walkways.");
  K.place("oakwood", 0, 0, 38);
  return K;
}

// ======================= SEABREAK: the harbor city (built facing the sea: local +Z is the water) =======================
export function buildSeabreak(g, groundAt, rot) {
  const K = makeKit(SIZES.seabreak, g, rot), { set, box } = K;
  K.ground(groundAt, 30, 44, B.GRASS, B.DIRT);
  for (let x = -30; x <= 30; x++) for (let z = 27; z <= 30; z++) set(x, g, z, B.STONE_BRICKS);   // the promenade
  for (let x = -30; x <= 30; x += 2) set(x, g + 1, 30, B.OAK_FENCE);
  // piers out over the water, on posts
  for (const px of [-20, 0, 20]) {
    box(px - 1, g + 1, 30, px + 1, g + 1, 30, B.AIR);
    for (let z = 31; z <= 47; z++) { box(px - 1, g, z, px + 1, g, z, B.PLANKS); for (let y = g + 1; y <= g + 3; y++) box(px - 1, y, z, px + 1, y, z, B.AIR); }
    for (let z = 32; z <= 47; z += 4) for (const x of [px - 1, px + 1]) { box(x, Math.max(1, g - 10), z, x, g - 1, z, B.LOG); set(x, g + 1, z, B.OAK_FENCE); set(x, g + 2, z, B.TORCH); }
  }
  // a ship tied up beside the middle pier
  for (let z = 33; z <= 46; z++) for (let x = 3; x <= 11; x++) {
    const w = 4 - Math.max(0, Math.abs(z - 39.5) - 4.5) * 0.9, d = Math.abs(x - 7);
    if (d > w) continue;
    for (let y = SEA - 2; y <= g + 1; y++) set(x, y, z, d > w - 1 || y === SEA - 2 ? B.PLANKS : y === g ? B.PLANKS : B.AIR);
    if (d > w - 1) set(x, g + 1, z, B.OAK_FENCE);
  }
  for (let y = g + 1; y <= g + 12; y++) { set(7, y, 37, B.LOG); set(7, y, 42, B.LOG); }
  for (const [mz, top] of [[37, 12], [42, 10]]) for (let y = g + 4; y <= g + top - 1; y++) for (let x = 4; x <= 10; x++) if (Math.abs(x - 7) <= 3 - (y - g - 4) * 0.2) set(x, y, mz + 1, B.WOOL);
  box(5, g + 1, 44, 9, g + 3, 46, (x, y, z) => (y === g + 3 ? B.PLANKS : x === 5 || x === 9 || z === 46 ? B.PLANKS : B.AIR)); K.chest(7, g + 1, 45, 2, "ship", "Ship's Hold");
  box(2, g, 39, 2, g, 40, B.PLANKS);
  K.place("harbor", 0, 38, 14);
  // the lighthouse
  K.tower(34, 20, 7, 22, B.STONE_BRICKS, "w");
  for (let y = g + 23; y <= g + 26; y++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const e = Math.abs(dx) === 3 || Math.abs(dz) === 3; if (y === g + 26) set(34 + dx, y, 20 + dz, B.BRICKS); else if (e) set(34 + dx, y, 20 + dz, (Math.abs(dx) === 3 && Math.abs(dz) === 3) ? B.STONE_BRICKS : B.GLASS); }
  box(33, g + 23, 19, 35, g + 24, 21, B.SHINESTONE); box(33, g + 22, 19, 35, g + 22, 21, B.STONE_BRICKS);
  K.place("lighthouse", 34, 20, 5);
  // the harbor office
  K.house({ x0: -18, z0: 12, x1: -6, z1: 22, h: 5, wall: B.STONE_BRICKS, corner: B.LOG, floor: B.PLANKS, roof: B.BRICKS, doorSide: "s", doorAt: -12 });
  set(-16, g + 1, 14, B.MAP_TABLE); K.chest(-8, g + 1, 13, 0, "harbor", "Harbor Supplies"); K.chest(-7, g + 1, 13, 0, "harbor2", "Harbor Supplies");
  K.sign(-10, g + 1, 23, 0, "Harbor Office\n\nCaptain Mira knows these waters better than anyone. Ask her about the drowned kingdom.");
  K.npc("mira", -12, 17); K.place("harborOffice", -12, 17, 7);
  // fish market
  for (const x of [-26, -18, 12, 22]) { for (const [dx, dz] of [[-2, -1], [2, -1], [-2, 1], [2, 1]]) box(x + dx, g + 1, 24 + dz, x + dx, g + 3, 24 + dz, B.OAK_FENCE); box(x - 2, g + 4, 23, x + 2, g + 4, 25, (xx) => (xx % 2 ? B.WOOL : B.BLACK_WOOL)); }
  K.npc("fishmonger", -22, 22); K.npc("shipwright", 4, 32);
  // houses in rows behind the harbor
  [[-30, -30], [-18, -30], [8, -30], [20, -30], [-30, -14], [-18, -14], [12, -10], [22, -10]].forEach(([x0, z0], i) => {
    K.house({ x0, z0, x1: x0 + 7, z1: z0 + 6, h: 4, wall: i % 2 ? B.PLANKS : B.COBBLE, corner: B.LOG, floor: B.PLANKS, roof: i % 2 ? B.BRICKS : B.COBBLE, doorSide: "s", doorAt: x0 + 3 });
    K.bed(x0 + 1, g + 1, z0 + 2); K.chest(x0 + 6, g + 1, z0 + 1, 0, "sbHome", "Sailor's Chest");
  });
  K.road(-1, -40, 1, 27); K.road(-40, -2, 40, 0);
  for (let z = -36; z <= 20; z += 8) { K.lamp(-3, z); K.lamp(3, z); }
  K.waystone("seabreak", -4, 6);
  K.sign(-6, g + 1, 6, 0, "Seabreak\n\nThe last harbor before the open sea. Take a boat from the piers, and mind the lighthouse rocks.");
  K.place("seabreak", 0, 0, 32);
  return K;
}

// ======================= three jungle ruins, each guarding one Ancient Key =======================
export function buildKeyRuin(n, g, groundAt) {
  const K = makeKit(SIZES.keyruin, g), { set, box } = K;
  K.ground(groundAt, 12, 18);
  const vine = (x, y0, z, len) => { for (let y = y0; y > y0 - len; y--) if (K.get(x, y, z) === B.AIR) set(x, y, z, B.VINES); };
  if (n === 0) {   // the Overgrown Shrine
    box(-5, g, -5, 5, g + 1, 5, B.MOSSY); box(-4, g + 1, -4, 4, g + 1, 4, B.VINE_BRICKS);
    for (let k = -3; k <= 3; k++) set(k, g + 1, 6, B.MOSSY);
    for (const [x, z] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { box(x, g + 2, z, x, g + 7, z, B.VINE_BRICKS); vine(x + 1, g + 7, z, 4); }
    box(-4, g + 8, -4, 4, g + 8, 0, B.MOSSY);
    box(-1, g + 2, -1, 1, g + 2, 1, B.SUN_BRICKS); K.chest(0, g + 3, 0, 2, "key0", "Shrine Offering");
    K.sign(0, g + 2, 3, 0, "The Overgrown Shrine\n\n\"Three keys we hid in three green places. Together they open the root-sealed door.\"");
  } else if (n === 1) {   // the Abandoned Jungle Village
    for (const [x0, z0] of [[-10, -8], [3, -9], [-4, 4]]) {
      K.house({ x0, z0, x1: x0 + 6, z1: z0 + 5, h: 3, wall: B.PLANKS, corner: B.LOG, floor: B.PLANKS, roof: B.LEAVES, ridge: "x", doorSide: "s", doorAt: x0 + 3 });
      for (let k = 0; k < 6; k++) { const x = x0 + Math.floor(hash(x0, k) * 7), z = z0 + Math.floor(hash(z0, k) * 6); set(x, g + 1 + Math.floor(hash(k, x0) * 3), z, B.AIR); }
      vine(x0, g + 3, z0 - 1, 3); vine(x0 + 6, g + 3, z0 + 6, 2);
    }
    for (let a = 0; a < 8; a++) set(Math.round(Math.cos(a * 0.785) * 2) + 10, g + 1, Math.round(Math.sin(a * 0.785) * 2) + 6, B.COBBLE);
    K.chest(-1, g + 1, 6, 2, "key1", "Village Elder's Box");
    K.sign(9, g + 1, 10, 0, "The Abandoned Village\n\nThe people of this village left in a hurry. Their elder's box is still in the house by the old fire pit.");
  } else {   // the Vine Pillars and the sunken pit
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2, x = Math.round(Math.cos(t) * 9), z = Math.round(Math.sin(t) * 9), h = 3 + (a * 5) % 6; box(x, g + 1, z, x, g + h, z, a % 2 ? B.MOSSY : B.VINE_BRICKS); vine(x + 1, g + h, z, h - 1); }
    box(-3, g - 5, -3, 3, g - 1, 3, B.MOSSY); box(-2, g - 4, -2, 2, g, 2, B.AIR);
    for (let k = 0; k < 4; k++) { box(-2 + k, g - 1 - k, 3, -2 + k, g - 1 - k, 3, B.MOSSY); box(-2 + k, g - k, 3, -2 + k, g + 2, 3, B.AIR); }
    box(-2, g - 4, 3, 2, g - 4, 3, B.MOSSY);
    K.chest(0, g - 4, -2, 0, "key2", "Pit Reliquary"); set(-2, g - 1, -2, B.SHINESTONE);
    K.sign(4, g + 1, 4, 0, "The Vine Pillars\n\nSomething glints at the bottom of the pit. Mind your step.");
  }
  K.animal("vinewalker", 6, -6); K.animal("vinewalker", -6, 6);
  K.place("keyRuin" + n, 0, 0, 10);
  return K;
}

// ======================= the shipwreck (in shallow water) =======================
export function buildWreck(floorY) {
  const K = makeKit(SIZES.wreck, 0), { set, box } = K;
  const b = Math.max(3, floorY);   // the hull rests on the sea floor
  for (let x = -9; x <= 9; x++) for (let z = -4; z <= 4; z++) {
    const w = 4 - Math.max(0, Math.abs(x) - 5) * 0.7, d = Math.abs(z); if (d > w) continue;
    const tilt = Math.round((x + 9) / 6);
    for (let y = b; y <= b + 5 + tilt; y++) {
      const shell = d > w - 1 || y === b, deck = y === b + 5 + tilt;
      if (shell && !(x > 3 && y > b + 3 && z > 0)) set(x, y, z, B.PLANKS);   // a hole torn in the side
      else if (deck && x < 2) set(x, y, z, B.PLANKS);
      else set(x, y, z, y <= SEA ? B.WATER : B.AIR);
    }
  }
  for (let k = 0; k < 10; k++) set(-2 + k, b + 6 + Math.floor(k / 3), 5 + (k > 6 ? 1 : 0), B.LOG);   // the fallen mast
  box(-6, b + 1, -1, -4, b + 1, 1, B.PLANKS);
  K.chest(-5, b + 2, 0, 1, "wreck", "Captain's Chest"); K.chest(5, b + 1, -2, 0, "wreck2", "Cargo Crate");
  set(0, b + 1, 0, B.SHINESTONE); set(-7, b + 1, 2, B.SHINESTONE);
  K.place("wreck", 0, 0, 12);
  return K;
}

// ======================= the boss chambers behind the temple vaults =======================
// Local (0, 0) is world (0, -96) in that temple's dimension. A passage runs from just behind the relic pedestal
// (world z = ped.z - 1) north into the chamber. Rock all around comes from the temple map itself.
export const THRONE_Z = -96;
export function buildThrone(kind, ped) {
  const K = makeKit(SIZES.throne, 0), { set, box } = K;
  const F = ped.y, zStart = ped.z - 1 - THRONE_Z;   // local z where the passage begins
  const theme = { desert: [B.SANDSTONE, B.SUN_BRICKS, B.GOLD_BLOCK], jungle: [B.MOSSY, B.VINE_BRICKS, B.LOG], sea: [B.TIDE_BRICKS, B.TIDE_BRICKS, B.TIDE_LAMP] }[kind];
  const R = kind === "desert" ? 14 : kind === "jungle" ? 15 : 16, edgeZ = R + 1;
  // the passage
  box(-2, F - 1, edgeZ - 1, 2, F + 4, zStart, theme[0]); box(-1, F, edgeZ - 1, 1, F + 2, zStart, B.AIR); box(-1, F - 1, edgeZ - 1, 1, F - 1, zStart, theme[1]);
  for (let z = edgeZ + 2; z < zStart; z += 4) { set(-2, F + 2, z, B.SHINESTONE); set(2, F + 2, z, B.SHINESTONE); }
  const info = K.info;
  if (kind === "desert") {   // the Pharaoh's throne room: a square hall, four sarcophagi, a golden throne
    box(-R - 1, F - 2, -R - 1, R + 1, F + 10, R + 1, theme[0]);
    box(-R, F, -R, R, F + 9, R, B.AIR); box(-R, F - 1, -R, R, F - 1, R, (x, y, z) => ((x + z) % 2 ? B.SANDSTONE : B.SUN_BRICKS));
    for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { box(x, F, z, x, F + 8, z, B.SUN_BRICKS); set(x, F + 9, z, B.GOLD_BLOCK); set(x, F + 4, z + (z < 0 ? 1 : -1), B.SHINESTONE); }
    const tele = [[-11, -11], [11, -11], [-11, 11], [11, 11]].map(([x, z]) => { box(x - 1, F, z - (z < 0 ? 0 : 1), x + 1, F, z + (z < 0 ? 1 : 0), B.GOLD_BLOCK); return { X: x + (x < 0 ? 2 : -2), y: F, Z: z + (z < 0 ? 2 : -2) }; });
    box(-3, F, -R, 3, F, -R + 2, B.SUN_BRICKS); box(-1, F + 1, -R, 1, F + 4, -R, B.GOLD_BLOCK); set(0, F + 1, -R + 1, B.GOLD_BLOCK);
    for (let x = -R; x <= R; x += 4) { set(x, F + 6, -R - 1, B.SHINESTONE); set(x, F + 6, R + 1, B.SHINESTONE); }
    for (let z = -R; z <= R; z += 4) { set(-R - 1, F + 6, z, B.SHINESTONE); set(R + 1, F + 6, z, B.SHINESTONE); }
    const devices = K.runes(0, F, 0, R - 4);
    info.arenas.pharaoh = { X: 0, y: F, Z: 0, r: R, devices, tele };
    K.chest(-3, F + 1, -R + 1, 0, "pharaohVault", "The Pharaoh's Treasure");
  } else if (kind === "jungle") {   // the Titan's grove: a round hall of mossy stone, root pillars
    K.arena(0, F, 0, R, 12, theme[1], B.MOSSY, theme[0]);
    for (let a = 0; a < 6; a++) { const t = a / 6 * Math.PI * 2 + 0.5, x = Math.round(Math.cos(t) * 9), z = Math.round(Math.sin(t) * 9); box(x, F, z, x, F + 11, z, B.LOG); set(x + 1, F + 8, z, B.LEAVES); set(x - 1, F + 9, z, B.LEAVES); }
    for (let k = 0; k < 30; k++) { const x = Math.round((hash(k, 21) - 0.5) * 2 * R), z = Math.round((hash(k, 22) - 0.5) * 2 * R); if (Math.hypot(x, z) < R - 1) set(x, F + 11, z, B.VINES); }
    const devices = K.runes(0, F, 0, R - 3);
    info.arenas.titan = { X: 0, y: F, Z: 0, r: R, devices };
    K.chest(0, F, -R + 1, 0, "titanVault", "Roots of the Titan");
    // the root-sealed door (three Ancient Keys open it)
    const dz = 26 > zStart - 2 ? zStart - 2 : 26;
    box(-1, F, dz, 1, F + 2, dz, B.KEEPER_STONE); set(2, F + 1, dz + 1, B.RUNE_STONE); box(2, F, dz + 1, 2, F, dz + 1, B.MOSSY);
    K.sign(-1, F, dz + 1, 0, "The Root Seal\n\nThree keyholes are carved in the rune stone beside this door. Bring three Ancient Keys and touch the rune.");
    info.marks.keyDoor = { x0: -1, y0: F, z0: dz, x1: 1, y1: F + 2, z1: dz, rune: { X: 2, y: F + 1, Z: dz + 1 } };
  } else {   // the Leviathan's grotto: a deep pool with a ring of stone to stand on, air all around
    K.arena(0, F, 0, R, 12, B.TIDE_BRICKS, B.TIDE_BRICKS, B.TIDE_BRICKS);
    const PR = 9;
    for (let dz = -PR; dz <= PR; dz++) for (let dx = -PR; dx <= PR; dx++) { const d = Math.hypot(dx, dz); if (d > PR) continue; set(dx, F - 7, dz, B.SAND); for (let y = F - 6; y <= F - 1; y++) set(dx, y, dz, B.WATER); }
    for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; set(Math.round(Math.cos(t) * (PR + 1)), F, Math.round(Math.sin(t) * (PR + 1)), a % 3 ? B.AIR : B.TIDE_LAMP); }
    const devices = K.runes(0, F, 0, 13, [Math.PI * 0.25, Math.PI * 0.95, Math.PI * 1.65]);
    info.arenas.leviathan = { X: 0, y: F, Z: 0, r: R, devices, pool: { r: PR, y: F - 1 } };
    K.chest(-3, F, -R + 1, 0, "leviathanVault", "The Leviathan's Hoard");
  }
  // open the passage into the chamber again (the chamber walls were drawn over its end)
  box(-1, F, R - 1, 1, F + 2, R + 3, B.AIR); box(-1, F - 1, R - 1, 1, F - 1, R + 3, theme[1]);
  K.place("throne_" + kind, 0, 0, R - 1, F);
  return K;
}
