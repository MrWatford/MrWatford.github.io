// The Legacy Campaign's places for Chapters 4–6 (Milestone 13, Part E):
//   Chapter 4: Ironhold (the mining town under Mount Ferrum) and its corrupted mines, the Blight Citadel (open-sky arena)
//   Chapter 5: the Ember Outpost (an expedition camp with an unlit portal) and three Dragon Seal shrines in the Ember Depths
//   Chapter 6: Hollowmere, the village in the fog, and Dr. Vell's observatory
// Each builder returns { cells, info } for one stamp (see js/campaign-kit.js). All builders are deterministic.
import { B, HEIGHT, make } from "./blocks.js";
import { makeKit } from "./campaign-kit.js";

export const TOWNS2_V = 1;
export const SIZES2 = { ironhold: 112, blightcitadel: 80, outpost: 48, hollowmere: 88, sealshrine: 56 };
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ======================= IRONHOLD: the mining town under Mount Ferrum =======================
export function buildIronhold(g, groundAt) {
  const K = makeKit(SIZES2.ironhold, g), { set, box } = K;
  K.ground(groundAt, 46, 54);
  // Mount Ferrum rises behind the north wall (stone with veins of iron and coal)
  for (let Z = -56; Z <= -17; Z++) for (let X = -56; X < 56; X++) {
    const edge = Math.max(0, Math.min(1, (55 - Math.max(Math.abs(X), Math.abs(Z))) / 9)), f = Math.min(1, (-Z - 17) / 26) * (0.55 + 0.45 * Math.cos(X / 56 * Math.PI / 2)) * edge, h = Math.round(20 * f + hash(X, Z) * 2);
    if (h < 1) continue;
    for (let y = g + 1; y <= Math.min(HEIGHT - 3, g + h); y++) {
      const r = hash(X * 7 + y, Z * 13 - y);
      set(X, y, Z, y === g + h && h < 9 ? B.GRASS : r < 0.025 ? B.IRON_ORE : r < 0.06 ? B.COAL_ORE : r < 0.1 ? B.COBBLE : B.STONE);
    }
  }
  // the town wall (cobblestone, two high) with gates south, east, and west
  const W = 44, N = -16;
  for (let X = -W; X <= W; X++) for (const Z of [N, W]) if (!(Z === W && Math.abs(X) <= 2)) { box(X, g + 1, Z, X, g + 3, Z, B.COBBLE); if (X % 2 === 0) set(X, g + 4, Z, B.STONE_BRICKS); }
  for (let Z = N; Z <= W; Z++) for (const X of [-W, W]) if (Math.abs(Z - 14) > 2) { box(X, g + 1, Z, X, g + 3, Z, B.COBBLE); if (Z % 2 === 0) set(X, g + 4, Z, B.STONE_BRICKS); }
  for (const [x, z] of [[-3, W], [3, W], [-W, 11], [-W, 17], [W, 11], [W, 17]]) { box(x, g + 1, z, x, g + 6, z, B.STONE_BRICKS); set(x, g + 7, z, B.TORCH); }
  K.sign(-4, g + 1, W + 1, 0, "Ironhold\n\nThe mining town under Mount Ferrum. Best iron in all the kingdoms. Forgemaster Hilda keeps the forge burning day and night.");
  // roads and the Anvil Square
  K.road(-2, -12, 2, W); K.road(-W, 12, W, 16);
  for (let Z = 6; Z <= 22; Z++) for (let X = -8; X <= 8; X++) { const d = Math.hypot(X, Z - 14); if (d <= 8.5) set(X, g, Z, d > 7.5 ? B.STONE_BRICKS : (Math.round(d) % 2 ? B.COBBLE : B.STONE_BRICKS)); }
  box(-1, g + 1, 13, 1, g + 1, 15, B.STONE_BRICKS); box(0, g + 2, 14, 0, g + 4, 14, B.IRON_BLOCK); set(-1, g + 4, 14, B.IRON_BLOCK); set(1, g + 4, 14, B.IRON_BLOCK); set(0, g + 5, 14, B.SHINESTONE);
  K.sign(0, g + 1, 16, 0, "The Anvil Square\n\nThe great iron anvil was the first thing ever forged in Ironhold. Miners touch it for luck before every shift.");
  K.waystone("ironhold", 5, 19);
  for (const a of [0.3, 1.1, 1.9, 2.7, 3.5, 4.3, 5.1, 5.9]) K.lamp(Math.round(Math.cos(a) * 10), 14 + Math.round(Math.sin(a) * 10));
  for (let Z = 26; Z <= 42; Z += 8) { K.lamp(-4, Z); K.lamp(4, Z); }
  K.place("ironhold", 0, 14, 40);
  // the Forge Hall (Forgemaster Hilda)
  K.house({ x0: -32, z0: -12, x1: -12, z1: 4, h: 6, wall: B.STONE_BRICKS, corner: B.COBBLE, floor: B.STONE_BRICKS, roof: B.COBBLE, ridge: "x", doorSide: "s", doorAt: -22 });
  for (const x of [-30, -28, -26]) set(x, g + 1, -11, make(B.FURNACE, 0));
  set(-24, g + 1, -11, B.SMITH_TABLE); set(-22, g + 1, -11, B.TABLE);
  box(-18, g, -10, -15, g, -9, B.LAVA); box(-19, g + 1, -11, -14, g + 1, -8, (x, y, z) => (x === -19 || x === -14 || z === -11 || z === -8 ? B.STONE_BRICKS : B.AIR)); box(-18, g + 2, -10, -15, g + 2, -9, B.GLASS);
  K.chest(-30, g + 1, 2, 1, "ihForge", "Forge Racks"); K.chest(-14, g + 1, 2, 3, "ihForge2", "Forge Racks");
  K.sign(-25, g + 1, 5, 0, "The Forge Hall\n\nAnything made of iron in the five kingdoms was probably hammered here.");
  K.npc("hilda", -22, -4); K.place("ihForge", -22, -4, 10);
  // the Mine Head: the way down to the deep mine (where the blight is spreading)
  K.house({ x0: 14, z0: -14, x1: 26, z1: -2, h: 5, wall: B.COBBLE, corner: B.LOG, floor: B.PLANKS, roof: B.COBBLE, ridge: "z", doorSide: "s", doorAt: 16 });
  K.npc("dag", 16, 0); K.place("ihMineHead", 20, -8, 6);
  K.sign(23, g + 1, -1, 0, "The Mine Head\n\nCLOSED by order of the Forgemaster. Something down there is turning the stone black. Ask Hilda before going down.");
  for (let k = 0; k < 26; k++) { const x = 8 + Math.floor(hash(k, 41) * 24), z = -1 + Math.floor(hash(k, 42) * 8); if (Math.abs(x) > 2 && K.get(x, g, z) === B.GRASS) set(x, g, z, hash(k, 43) < 0.5 ? B.BLACKSTONE : B.SOUL_SAND); }
  for (let z = -1; z <= 10; z++) set(12, g + 1, z, B.RAIL);   // an old cart line from the mine to the ore yard
  K.chest(11, g + 1, 10, 1, "ihYard", "Ore Yard Crate");
  // homes, the healer's house, the guard post
  [[-38, 20], [-28, 20], [-38, 32], [-28, 32], [24, 22], [34, 22]].forEach(([x0, z0], i) => {
    K.house({ x0, z0, x1: x0 + 7, z1: z0 + 6, h: 4, wall: i % 2 ? B.COBBLE : B.PLANKS, corner: B.LOG, floor: B.PLANKS, roof: i % 3 ? B.COBBLE : B.BRICKS, doorSide: "n", doorAt: x0 + 3 });
    K.bed(x0 + 1, g + 1, z0 + 5); K.chest(x0 + 6, g + 1, z0 + 5, 2, "ihHome", "Miner's Locker");
  });
  K.house({ x0: 24, z0: 32, x1: 36, z1: 40, h: 4, wall: B.BIRCH_PLANKS, corner: B.LOG, floor: B.PLANKS, roof: B.BRICKS, doorSide: "n", doorAt: 30 });
  K.bed(25, g + 1, 39); K.bed(27, g + 1, 39); K.chest(35, g + 1, 39, 3, "ihHealer", "Healer's Shelf");
  K.npc("rue", 30, 36); K.sign(32, g + 1, 31, 2, "Healer Rue\n\nBandages, broth, and good advice. No charge.");
  K.house({ x0: -12, z0: 34, x1: -5, z1: 41, h: 4, wall: B.STONE_BRICKS, corner: B.COBBLE, floor: B.PLANKS, roof: B.COBBLE, doorSide: "e", doorAt: 37 });
  K.chest(-11, g + 1, 40, 1, "ihGuard", "Guard Post Locker"); K.npc("orrin", -2, 40);
  // ----- the deep mine below the town -----
  const F = g - 13;
  box(-36, F - 3, -12, 52, F + 8, 44, B.STONE);
  for (let k = 0; k <= 13; k++) { const z = -8 + k; box(19, g - k - 1, z, 21, g - k - 1, z, B.STONE); box(19, g - k, z, 21, g - k + 3, z, B.AIR); if (k % 4 === 2) set(22, g - k + 2, z, B.TORCH); }
  box(19, g, -8, 21, g, -7, B.AIR);
  // the main hall, propped up with timber
  box(10, F, 6, 30, F + 5, 17, B.AIR); box(10, F - 1, 6, 30, F - 1, 17, B.STONE);
  box(19, F, 3, 21, F + 3, 6, B.AIR);
  for (const x of [13, 17, 23, 27]) { box(x, F, 6, x, F + 4, 6, B.LOG); box(x, F, 17, x, F + 4, 17, B.LOG); box(x, F + 5, 6, x, F + 5, 17, B.PLANKS); }
  for (const [x, z] of [[11, 7], [29, 7], [11, 16], [29, 16]]) set(x, F + 3, z, B.TORCH);
  for (let x = 12; x <= 28; x++) set(x, F, 11, B.RAIL);
  K.chest(29, F, 12, 3, "ihMine", "Abandoned Supply Crate");
  K.sign(20, F, 7, 0, "The Deep Mine\n\nThree crews dug three new tunnels: west, south, and east. All three found something under the stone, and none of them stayed to tell us what.");
  K.place("blightMine", 20, 11, 9, F);
  // the three corrupted galleries: black stone, Wailing Sand, and a Blight Skull at the end of each
  const blight = (x0, z0, x1, z1) => box(x0, F - 1, z0, x1, F + 4, z1, (x, y, z) => {
    const edge = x === x0 || x === x1 || z === z0 || z === z1 || y === F - 1 || y === F + 4, r = hash(x * 3 + y, z * 5 - y);
    if (!edge) return B.AIR;
    return y === F - 1 ? (r < 0.35 ? B.SOUL_SAND : r < 0.8 ? B.BLACKSTONE : B.STONE) : r < 0.55 ? B.BLACKSTONE : r < 0.65 ? B.BASALT : B.STONE;
  });
  const tunnel = (x0, z0, x1, z1) => { box(x0, F, z0, x1, F + 2, z1, B.AIR); box(x0, F - 1, z0, x1, F - 1, z1, B.STONE); };
  const rooms = [[-31, 4, -19, 18, -25, 11, 1], [14, 29, 26, 41, 20, 35, 2], [40, 4, 51, 18, 45, 11, 3]];
  tunnel(-19, 10, 10, 12); tunnel(19, 17, 21, 29); tunnel(30, 10, 40, 12);
  for (let x = -16; x <= 8; x += 6) set(x, F + 2, 9, B.TORCH);
  rooms.forEach(([x0, z0, x1, z1, cx, cz, face], n) => {
    blight(x0, z0 - 1, x1, z1 + 1);
    tunnel(...(n === 0 ? [-19, 10, -18, 12] : n === 1 ? [19, 28, 21, 30] : [39, 10, 41, 12]));
    box(cx - 1, F, cz - 1, cx + 1, F, cz + 1, B.BLACKSTONE_BRICKS);
    K.chest(cx, F + 1, cz, face, "mineSkull" + n, "Blackened Strongbox");
    set(cx - 3, F + 3, cz, B.SHINESTONE); set(cx + 3, F + 3, cz, B.SHINESTONE);
    K.place("mineGallery" + n, cx, cz, 7, F);
  });
  K.sign(-21, F, 13, 1, "Scratched on the wall:\n\n\"The skull in the stone whispers. It wants to go home to the old citadel. Don't listen to it.\"");
  K.animal("blight", -27, 8, F); K.animal("zombie", -22, 15, F);
  K.animal("blight", 17, 37, F); K.animal("blight", 23, 33, F);
  K.animal("blight", 47, 8, F); K.animal("cave_spider", 43, 15, F);
  K.info.marks.mineFloor = F;
  return K;
}

// ======================= the Blight Citadel: an open-sky courtyard where the Blightking rises =======================
export function buildBlightCitadel(g, groundAt) {
  const K = makeKit(SIZES2.blightcitadel, g), { set, box } = K;
  K.ground(groundAt, 32, 38);
  const R = 20;
  // the blight has soaked into the land around it
  for (let Z = -38; Z < 38; Z++) for (let X = -38; X < 38; X++) {
    const d = Math.hypot(X, Z), r = hash(X + 900, Z - 300); if (d > 32 || d <= R + 3) continue;
    if (r < 0.5 - (d - R) / 30) set(X, g, Z, r < 0.15 ? B.SOUL_SAND : r < 0.3 ? B.BLACKSTONE : B.DIRT);
  }
  // the courtyard floor
  for (let Z = -R - 1; Z <= R + 1; Z++) for (let X = -R - 1; X <= R + 1; X++) {
    const d = Math.hypot(X, Z); if (d > R + 0.5) continue;
    const r = hash(X * 11, Z * 7);
    set(X, g, Z, d < 4.5 ? B.BLACKSTONE_BRICKS : r < 0.1 ? B.SOUL_SAND : r < 0.6 ? B.BLACKSTONE_BRICKS : B.BLACKSTONE);
    for (let y = g + 1; y <= g + 30 && y < HEIGHT - 1; y++) set(X, y, Z, B.AIR);
  }
  // the broken ring wall and its south gate
  for (let Z = -R - 4; Z <= R + 4; Z++) for (let X = -R - 4; X <= R + 4; X++) {
    const d = Math.hypot(X, Z); if (d <= R + 0.5 || d > R + 3) continue;
    if (Z > 0 && Math.abs(X) <= 2) { set(X, g, Z, B.BLACKSTONE_BRICKS); continue; }
    const top = 5 + Math.floor(Math.abs(Math.sin(Math.atan2(Z, X) * 5)) * 7 + hash(X, Z) * 2);
    for (let y = g; y <= g + top; y++) set(X, y, Z, (y + X + Z) % 5 ? B.BLACKSTONE_BRICKS : B.BLACKSTONE);
  }
  for (const s of [-3, 3]) { box(s, g + 1, R + 1, s, g + 12, R + 3, B.BLACKSTONE_BRICKS); set(s, g + 13, R + 2, B.SKULL); }
  for (const [x, z] of [[-26, -26], [26, -26], [-26, 26], [26, 26]]) K.tower(x, z, 7, 15, B.BLACKSTONE_BRICKS, z < 0 ? "s" : "n");
  K.road(-2, R + 3, 2, 37, B.GRAVEL, B.BLACKSTONE);
  // lamp posts of black stone with sickly lights
  for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2 + 0.39, x = Math.round(Math.cos(t) * (R - 2)), z = Math.round(Math.sin(t) * (R - 2)); box(x, g + 1, z, x, g + 3, z, B.BLACKSTONE_BRICKS); set(x, g + 4, z, B.SHROOMLIGHT); }
  // the altar: a T of Wailing Sand waiting for three Blight Skulls
  set(0, g + 1, 0, B.SOUL_SAND); for (const x of [-1, 0, 1]) set(x, g + 2, 0, B.SOUL_SAND);
  K.info.marks.altar = { ...K.at(0, 0), y: g + 3 };
  const devices = K.runes(0, g + 1, 0, R - 5, [Math.PI * 0.75, Math.PI * 1.5, Math.PI * 0.25]);
  K.info.arenas.tempest = { X: 0, y: g + 1, Z: 0, r: R, devices, manual: true };
  K.chest(-4, g + 1, R - 2, 2, "citadelSupplies", "The Last Watch's Supplies");
  K.chest(4, g + 1, R - 2, 2, "citadelSand", "Spare Wailing Sand");
  K.sign(0, g + 1, R + 4, 0, "The Blight Citadel\n\nThe First Builders sealed the Blightking here. To end the curse for good, wake him on his own altar: place three Blight Skulls on top of the Wailing Sand in the middle of the courtyard. Then be ready.");
  K.sign(-2, g + 1, R - 1, 2, "Carved into the stone:\n\n\"If the King of Blight falls in this place, the land he poisoned will rise against you one last time. Light the three Rune Stones to break its storm.\"");
  for (let k = 0; k < 14; k++) {   // dead trees outside the walls
    const a = hash(k, 61) * Math.PI * 2, r = 29 + hash(k, 62) * 7, x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r);
    if (Math.abs(x) <= 4 && z > 0) continue;
    const h = 4 + Math.floor(hash(k, 63) * 4); for (let y = g + 1; y <= g + h; y++) set(x, y, z, B.LOG);
    set(x + 1, g + h - 1, z, B.LOG); set(x - 1, g + h, z, B.LOG);
  }
  K.place("blightCitadel", 0, 0, R + 10);
  return K;
}

// ======================= the Ember Outpost: an expedition camp with an unlit portal =======================
export function buildOutpost(g, groundAt) {
  const K = makeKit(SIZES2.outpost, g), { set, box } = K;
  K.ground(groundAt, 16, 22);
  for (let i = -17; i <= 17; i++) for (const [x, z] of [[i, 17], [i, -17], [17, i], [-17, i]]) if (Math.abs(i) > 2 || z === -17) { set(x, g + 1, z, B.LOG); if (i % 2) set(x, g + 2, z, B.OAK_FENCE); }
  // the portal frame (obsidian, waiting for a spark)
  box(-3, g, -11, 2, g, -9, B.STONE_BRICKS);
  for (let x = -2; x <= 1; x++) for (let y = g + 1; y <= g + 5; y++) set(x, y, -10, x === -2 || x === 1 || y === g + 1 || y === g + 5 ? B.OBSIDIAN : B.AIR);
  K.sign(3, g + 1, -10, 0, "The Ember Gate\n\nA portal frame, built by the expedition. Strike it with Flint and Steel (in the supply chest) to open the way to the Ember Depths.");
  K.info.marks.portal = { ...K.at(0, -10), y: g + 2 };
  // tents, a map table, the supply chests
  const tent = (cx, cz, wool) => { for (let z = cz - 3; z <= cz + 3; z++) for (let x = cx - 3; x <= cx + 3; x++) { const h = 4 - Math.abs(x - cx); if (h < 1) continue; set(x, g + h, z, wool); } box(cx, g + 1, cz - 3, cx, g + 3, cz - 3, B.LOG); };
  tent(-9, 4, B.WOOL); tent(9, 4, B.BLACK_WOOL); tent(-9, -4, B.BLACK_WOOL);
  K.bed(-10, g + 1, 6); K.bed(8, g + 1, 6);
  set(2, g + 1, 2, B.MAP_TABLE); set(-2, g + 1, 2, B.TABLE);
  K.chest(4, g + 1, -6, 2, "outpost", "Expedition Supplies"); K.chest(5, g + 1, -6, 2, "outpost2", "Expedition Supplies");
  box(-1, g, 6, 1, g, 8, B.COBBLE); set(0, g + 1, 7, B.SHINESTONE);
  K.waystone("outpost", 6, 9);
  K.npc("sable", 0, 3); K.npc("quill", -5, -2);
  K.sign(-4, g + 1, 10, 0, "The Ember Outpost\n\nBase camp of the Royal Expedition to the Ember Depths. Wipe your boots. Some of us still have to sleep here.");
  K.place("outpost", 0, 0, 14);
  return K;
}

// ======================= a Dragon Seal shrine (Ember Depths): a carved cavern with four tunnels =======================
// floor at F - 1 (you stand at F). Local (0, 0) is the shrine's middle.
export function buildSealShrine(n, F) {
  const K = makeKit(SIZES2.sealshrine, F), { set, box } = K;
  const cy = F + 3;
  for (let dz = -16; dz <= 16; dz++) for (let dx = -16; dx <= 16; dx++) for (let y = F - 4; y <= F + 13; y++) {
    const d = Math.hypot(dx, dz, (y - cy) * 1.3), flat = Math.hypot(dx, dz);
    if (y === F - 1 && flat <= 15) set(dx, y, dz, flat <= 8 ? B.BLACKSTONE_BRICKS : hash(dx, dz + n * 50) < 0.3 ? B.BASALT : B.BLACKSTONE);
    else if (y < F - 1 && flat <= 15) set(dx, y, dz, B.BASALT);
    else if (y >= F && d <= 15) set(dx, y, dz, B.AIR);
  }
  // four tunnels out into the rock, lit along the way
  for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let r = 12; r <= 27; r++) for (let k = -1; k <= 1; k++) {
    const x = ax * r + az * k, z = az * r + ax * k;
    set(x, F - 1, z, B.BLACKSTONE_BRICKS); for (let y = F; y <= F + 3; y++) set(x, y, z, B.AIR);
    if (k === 0 && r % 5 === 0) set(x, F + 4, z, B.SHROOMLIGHT);
  }
  // the altar and its four flame pillars
  box(-2, F, -2, 2, F, 2, B.CINDER_BRICKS); box(-1, F + 1, -1, 1, F + 1, 1, B.EMBER_BRICKS);
  K.chest(0, F + 2, 0, 0, "seal" + n, "Dragon Seal Reliquary");
  for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { box(x, F, z, x, F + 4, z, B.EMBER_BRICKS); set(x, F + 5, z, B.SHROOMLIGHT); }
  for (let a = 0; a < 6; a++) { const t = a / 6 * Math.PI * 2, x = Math.round(Math.cos(t) * 10), z = Math.round(Math.sin(t) * 10); set(x, F + 11, z, B.SHROOMLIGHT); }
  const lore = [
    "The First Seal\n\n\"The dragon of the embers was not always cruel. We woke it with our digging, and it guarded the fire we stole. These three seals hold the key to its citadel.\"",
    "The Second Seal\n\n\"Its fire powered every portal we built. When we sealed the Forgotten King, we left the dragon to guard the last of that fire, and the fourth Relic with it.\"",
    "The Third Seal\n\n\"Bring the three seals together and they will remember what they once were: an eye of cinder, that opens the dragon's altar. Go carefully, builder.\""
  ][n];
  K.sign(0, F, 4, 0, lore);
  const guards = [["blight", "blight"], ["flare", "flare"], ["brute", "magma"]][n];
  K.animal(guards[0], 6, 2, F); K.animal(guards[1], -6, -2, F);
  K.place("seal" + n, 0, 0, 10, F);
  return K;
}

// ======================= HOLLOWMERE: the village in the fog =======================
export function buildHollowmere(g, groundAt) {
  const K = makeKit(SIZES2.hollowmere, g), { set, box } = K;
  K.ground(groundAt, 36, 42);
  for (let Z = -40; Z < 40; Z++) for (let X = -40; X < 40; X++) { const r = hash(X + 3000, Z + 77); if (K.get(X, g, Z) === B.GRASS && r < 0.22) set(X, g, Z, r < 0.08 ? B.GRAVEL : r < 0.16 ? B.DIRT : B.MOSSY); }
  K.road(-1, -36, 1, 40, B.GRAVEL, B.MOSSY); K.road(-36, -1, 36, 1, B.GRAVEL, B.MOSSY);
  // the old well in the middle
  box(-2, g - 6, -2, 2, g + 1, 2, B.COBBLE); box(-1, g - 5, -1, 1, g + 1, 1, B.AIR); box(-1, g - 5, -1, 1, g - 3, 1, B.WATER);
  for (const [x, z] of [[-2, -2], [2, 2]]) box(x, g + 2, z, x, g + 3, z, B.OAK_FENCE); box(-2, g + 4, -2, 2, g + 4, 2, (x, y, z) => (Math.abs(x) === 2 || Math.abs(z) === 2) && (x + z) % 2 ? B.PLANKS : B.AIR);
  K.sign(3, g + 1, 3, 0, "The Old Well\n\nScratched on the stones, in a child's writing: \"The tall man with the white eyes looks down the well at night. He never says anything. He just looks.\"");
  K.place("hmWell", 0, 0, 5);
  // abandoned cottages: holes in the walls, gaps in the roofs
  [[-32, -12], [-20, 8], [10, 8], [22, 8], [10, 22], [-32, 22]].forEach(([x0, z0], i) => {
    K.house({ x0, z0, x1: x0 + 7, z1: z0 + 6, h: 4, wall: i % 2 ? B.COBBLE : B.MOSSY, corner: B.LOG, floor: B.PLANKS, roof: B.COBBLE, doorSide: "n", doorAt: x0 + 3 });
    for (let k = 0; k < 9; k++) { const x = x0 + Math.floor(hash(x0, k + 9) * 8), z = z0 + Math.floor(hash(z0, k + 9) * 7), y = g + 2 + Math.floor(hash(k, x0 + z0) * 6); if (K.get(x, y, z) !== B.AIR && !(x === x0 + 3 && z === z0)) set(x, y, z, B.AIR); }
    K.chest(x0 + 6, g + 1, z0 + 5, 2, "hmHome", "Dusty Chest");
  });
  // the Old Meeting Hall
  K.house({ x0: -30, z0: -36, x1: -12, z1: -22, h: 6, wall: B.STONE_BRICKS, corner: B.MOSSY, floor: B.PLANKS, roof: B.COBBLE, ridge: "z", doorSide: "e", doorAt: -29 });
  for (let z = -33; z <= -25; z += 2) box(-26, g + 1, z, -16, g + 1, z, (x) => (x === -21 ? B.AIR : B.PLANKS));
  set(-28, g + 1, -29, B.BELL);
  K.sign(-27, g + 1, -31, 1, "The Meeting Hall\n\nA notice, nailed to the wall: \"The fog came down from the hills on the night Dr. Vell's machine first hummed. By morning the birds had stopped singing. Everyone is to leave for Ironhold.\"");
  K.place("hmHall", -21, -29, 8);
  // Ilsa's house: the only one still cared for
  K.house({ x0: -16, z0: 20, x1: -8, z1: 28, h: 4, wall: B.PLANKS, corner: B.LOG, floor: B.PLANKS, roof: B.BRICKS, doorSide: "n", doorAt: -12 });
  K.bed(-15, g + 1, 27); K.chest(-9, g + 1, 27, 3, "hmIlsa", "Ilsa's Pantry");
  for (const x of [-17, -7]) { set(x, g + 1, 19, B.FLOWER_YELLOW); set(x, g + 1, 22, B.FLOWER_RED); }
  K.npc("ilsa", -12, 17);
  // Dr. Vell's observatory on the hill
  const HX = 24, HZ = -24, top = g + 5;
  for (let dz = -11; dz <= 11; dz++) for (let dx = -11; dx <= 11; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dz)); if (d > 11) continue; const h = Math.min(5, 11 - d); for (let y = g + 1; y <= g + h; y++) set(HX + dx, y, HZ + dz, y === g + h ? B.GRASS : B.DIRT); }
  for (let k = 0; k < 6; k++) box(HX - 1, g + 1 + k - 1, HZ + 12 - k, HX + 1, g + k, HZ + 12 - k, B.COBBLE);
  K.house({ x0: HX - 6, z0: HZ - 6, x1: HX + 6, z1: HZ + 6, h: 5, wall: B.STONE_BRICKS, corner: B.COBBLE, floor: B.STONE_BRICKS, roof: B.STONE_BRICKS, flat: true, doorSide: "s", doorAt: HX, base: top });
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { const d = Math.hypot(dx, dz); if (d <= 4.5) set(HX + dx, top + 6 + (d < 2.5 ? 1 : 0), HZ + dz, d > 3.5 ? B.STONE_BRICKS : B.GLASS); }
  for (let x = HX - 5; x <= HX + 5; x++) set(x, top + 1, HZ - 5, B.BOOKSHELF);
  set(HX - 4, top + 1, HZ + 2, B.MAP_TABLE); set(HX + 4, top + 1, HZ + 2, B.TABLE);
  box(HX - 1, top + 1, HZ - 2, HX + 1, top + 1, HZ, B.PALE_BRICKS); set(HX, top + 2, HZ - 1, B.SHINESTONE);
  K.chest(HX + 5, top + 1, HZ - 3, 3, "hmLab", "Dr. Vell's Locked Cabinet");
  K.sign(HX - 5, top + 1, HZ - 1, 1, "Dr. Vell's journal, page 1\n\n\"The mist is not weather. It comes from somewhere ELSE: a valley that isn't on any map. I have built a lantern that can find the way in.\"");
  K.sign(HX - 5, top + 1, HZ + 3, 1, "Dr. Vell's journal, page 2\n\n\"He watches from the hills. White eyes. He knew the First Builders, I'm certain of it. He may even know where they hid the Relic of Shadows.\"");
  K.sign(HX + 2, top + 1, HZ + 5, 2, "Dr. Vell's journal, last page\n\n\"I'm going in. If I don't come back, my lantern is in the cabinet. Whoever finds it: be braver than I was.\"");
  K.place("hmLab", HX, HZ, 7, top + 1);
  // dead trees all around
  for (let k = 0; k < 26; k++) {
    const x = Math.round((hash(k, 71) - 0.5) * 74), z = Math.round((hash(k, 72) - 0.5) * 74);
    if (Math.abs(x) < 5 || Math.abs(z) < 5 || K.get(x, g + 1, z) !== B.AIR || K.get(x, g, z) === B.GRAVEL) continue;
    const h = 4 + Math.floor(hash(k, 73) * 4); for (let y = g + 1; y <= g + h; y++) set(x, y, z, B.LOG);
    set(x + 1, g + h, z, B.LOG); set(x, g + h - 1, z - 1, B.LOG); if (hash(k, 74) < 0.4) set(x - 1, g + h + 1, z, B.LOG);
  }
  K.waystone("hollowmere", 4, 8);
  K.sign(-4, g + 1, 38, 0, "Hollowmere\n\nOnce a quiet farming village. Now only fog lives here. (And Ilsa. Ilsa still lives here.)");
  for (let Z = -30; Z <= 30; Z += 10) if (Math.abs(Z) > 5) K.lamp(3, Z);
  K.place("hollowmere", 0, 0, 34);
  return K;
}
