// The Legacy Campaign's places for Chapter 8 (Milestone 13, Part G):
//   Skyreach: the First Builders' city above the clouds (a floating island reached by the Sky Stair) and the Storm Spire arena
//   The Ruined Capital: the First Builders' broken capital, the kingdoms' camp, the Gate of Eight, and the Throne Court arena
// Each builder returns { cells, info } for one stamp (see js/campaign-kit.js). All builders are deterministic.
import { B, HEIGHT } from "./blocks.js";
import { makeKit } from "./campaign-kit.js";

export const TOWNS3_V = 1;
export const SIZES3 = { skyreach: 96, capital: 128 };
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ======================= SKYREACH: the city above the clouds =======================
// The landing (south) has the Waystone and the Sky Stair, a tall white tower whose top joins the island by a bridge.
// The island floats to the north: the Relic Forge (Keeper Solenne), the Sky Gardens, houses, and the Storm Spire arena.
export function buildSkyreach(g, groundAt) {
  const K = makeKit(SIZES3.skyreach, g), { set, box } = K;
  K.ground(groundAt, 40, 47);
  const I = Math.min(HEIGHT - 14, g + 26), IC = -16, R = 28;   // island top height, island middle (Z), island radius
  K.info.marks.island = { y: I };
  // ---- the landing ----
  for (let Z = 22; Z <= 40; Z++) for (let X = -9; X <= 9; X++) { const d = Math.hypot(X, Z - 31); if (d <= 8.5) set(X, g, Z, d > 7.5 ? B.GOLD_BLOCK : (Math.round(d) % 2 ? B.QUARTZ_BLOCK : B.SKY_BLOCK)); }
  K.road(-1, 40, 1, 47, B.QUARTZ_BLOCK, B.SKY_BLOCK);
  K.waystone("skyreach", 4, 33);
  K.sign(-4, g + 1, 36, 0, "Skyreach Landing\n\nHigh above you floats Skyreach, where the First Builders forged the eight Relics. Climb the Sky Stair to reach it.\n\nIf you fall, you'll be back here. Watch your step up there!");
  K.chest(-6, g + 1, 31, 1, "skyLanding", "Climber's Supplies");
  for (const [x, z] of [[-8, 25], [8, 25], [-8, 37], [8, 37]]) K.lamp(x, z);
  // ---- the Sky Stair: a white tower with a stair inside, from the ground to the island ----
  const TZ = 18, h = I - g;
  K.tower(0, TZ, 9, h, B.QUARTZ_BLOCK, "s");
  for (let y = g + 6; y < I - 1; y += 6) for (const [dx, dz] of [[-4, TZ - 2], [4, TZ + 2], [-4, TZ + 2], [4, TZ - 2]]) set(dx, y, dz, B.GOLD_BLOCK);
  for (const x of [-1, 0, 1]) for (let y = I + 1; y <= I + 2; y++) set(x, y, TZ - 4, B.AIR);   // a gap in the battlements toward the bridge
  K.sign(1, g + 1, TZ + 6, 0, "The Sky Stair\n\nIt climbs to Skyreach. It's a long way up: take a breath on the landings.");
  // ---- the island: grass on top, then dirt, then stone tapering to a point underneath ----
  for (let Z = IC - R - 2; Z <= IC + R + 2; Z++) for (let X = -R - 2; X <= R + 2; X++) {
    const d = Math.hypot(X, Z - IC), rim = R + (hash(X + 40, Z) - 0.5) * 2.4;
    if (d > rim) continue;
    const t = d / R, depth = Math.max(2, Math.round(Math.pow(1 - Math.min(1, t), 0.65) * 15 + hash(X, Z + 9) * 3));
    for (let y = I - depth; y <= I; y++) set(X, y, Z, y === I ? B.GRASS : y > I - 3 ? B.DIRT : hash(X * 3 + y, Z) < 0.06 ? B.SKY_ORE : B.STONE);
    for (let y = I + 1; y <= Math.min(HEIGHT - 2, I + 12); y++) set(X, y, Z, B.AIR);
    if (d > R - 1.6 && d <= rim && !(Z > IC + R - 6 && Math.abs(X) <= 1)) set(X, I + 1, Z, B.BIRCH_FENCE);   // a railing (with a gap for the bridge)
  }
  box(-1, I, TZ - 7, 1, I, TZ - 4, B.SKY_BLOCK);   // the bridge to the island
  for (const x of [-2, 2]) for (let z = TZ - 7; z <= TZ - 4; z++) set(x, I + 1, z, B.BIRCH_FENCE);
  // a few small islands drifting around it
  for (const [x, z, r, dy] of [[-38, -30, 4, 3], [38, -24, 5, -2], [-36, 12, 3, 5], [37, 14, 4, 1], [-20, 30, 3, 7]]) {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dz); if (d > r + 0.3) continue;
      const dep = Math.max(1, Math.round((1 - d / (r + 0.5)) * (r + 1)));
      for (let y = I + dy - dep; y <= I + dy; y++) set(x + dx, y, z + dz, y === I + dy ? B.GRASS : B.STONE);
    }
    K.tree(x, z, 3 + (r > 3 ? 1 : 0), B.BIRCH_LOG, B.BIRCH_LEAVES, I + dy);
  }
  // paths across the island
  for (let Z = IC - 2; Z <= IC + R; Z++) for (let X = -1; X <= 1; X++) set(X, I, Z, (X + Z) % 5 ? B.QUARTZ_BLOCK : B.GOLD_BLOCK);
  for (let X = -22; X <= 22; X++) for (let Z = -1; Z <= 1; Z++) set(X, I, Z, (X + Z) % 5 ? B.QUARTZ_BLOCK : B.GOLD_BLOCK);
  // ---- the Relic Forge: Keeper Solenne's hall ----
  K.house({ x0: -6, z0: -10, x1: 6, z1: -2, h: 6, wall: B.QUARTZ_BLOCK, corner: B.GOLD_BLOCK, floor: B.SKY_BLOCK, roof: B.QUARTZ_BLOCK, doorSide: "s", doorAt: 0, base: I });
  for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2, x = Math.round(Math.cos(t) * 3), z = -6 + Math.round(Math.sin(t) * 2.4); set(x, I + 1, z, B.RELIC_PEDESTAL); }
  set(0, I + 1, -6, B.BEACON);
  K.chest(5, I + 1, -9, 2, "skyForge", "The Relic Forge's Chest");
  K.sign(-4, I + 1, -3, 2, "The Relic Forge\n\nHere the First Builders poured their power into eight Relics, one for every realm. Eight pedestals still wait for them.");
  K.npc("solenne", 0, -4, I + 1);
  K.place("skyForge", 0, -6, 6, I + 1);
  K.waystone("skyreachTop", 4, 4, I);
  // ---- the Sky Gardens (east) ----
  for (const [x, z] of [[14, -8], [20, -4], [16, 4], [22, 6], [11, 8]]) K.tree(x, z, 4, B.BIRCH_LOG, B.BIRCH_LEAVES, I);
  for (let k = 0; k < 40; k++) { const x = 10 + Math.floor(hash(k, 3) * 15), z = -10 + Math.floor(hash(k, 4) * 20); if (K.get(x, I + 1, z) === B.AIR) set(x, I + 1, z, k % 3 ? B.FLOWER_YELLOW : B.FLOWER_RED); }
  set(17, I, -1, B.WATER); set(18, I, -1, B.WATER); set(17, I, 0, B.WATER);
  K.sign(12, I + 1, 2, 3, "The Sky Gardens\n\nThe First Builders grew their gardens closer to the sun. Some of these trees are older than the kingdoms.");
  K.place("skyGarden", 16, -2, 9, I + 1);
  // ---- two houses (west) ----
  K.house({ x0: -22, z0: -10, x1: -14, z1: -4, h: 4, wall: B.QUARTZ_BLOCK, corner: B.GOLD_BLOCK, floor: B.SKY_BLOCK, roof: B.SKY_BLOCK, doorSide: "e", doorAt: -7, base: I });
  K.house({ x0: -22, z0: 2, x1: -14, z1: 8, h: 4, wall: B.QUARTZ_BLOCK, corner: B.GOLD_BLOCK, floor: B.SKY_BLOCK, roof: B.SKY_BLOCK, doorSide: "e", doorAt: 5, base: I });
  K.chest(-20, I + 1, -9, 0, "skyHouse", "A Sky Keeper's Chest");
  K.bed(-20, I + 1, 7);
  for (const [x, z] of [[-6, 2], [6, 2], [-6, 10], [6, 10], [-12, -12], [12, -12]]) K.lamp(x, z, I);
  K.place("skyreachIsle", 0, -4, 24, I + 1);
  // ---- the Storm Spire: a round arena at the island's north end, open to the sky ----
  const AZ = -30, AR = 12;
  for (let dz = -AR - 2; dz <= AR + 2; dz++) for (let dx = -AR - 2; dx <= AR + 2; dx++) {
    const d = Math.hypot(dx, dz); if (d > AR + 1.5) continue;
    const x = dx, z = AZ + dz;
    set(x, I, z, d > AR + 0.5 ? B.GOLD_BLOCK : (Math.round(d) % 4 === 0 ? B.GOLD_BLOCK : (dx + dz) % 2 ? B.QUARTZ_BLOCK : B.SKY_BLOCK));
    for (let y = I - 3; y < I; y++) if (K.get(x, y, z) === 65535) set(x, y, z, B.STONE);
    for (let y = I + 1; y <= Math.min(HEIGHT - 2, I + 13); y++) set(x, y, z, B.AIR);
    if (d > AR + 0.5 && !(dz > 0 && Math.abs(dx) <= 1)) { set(x, I + 1, z, B.QUARTZ_BLOCK); set(x, I + 2, z, B.BIRCH_FENCE); }   // the low wall (open on the south side)
  }
  for (let k = 0; k < 4; k++) {   // four spires around it
    const t = k / 4 * Math.PI * 2 + Math.PI / 4, x = Math.round(Math.cos(t) * (AR + 3)), z = AZ + Math.round(Math.sin(t) * (AR + 3)), top = Math.min(HEIGHT - 3, I + 10 + k % 2 * 2);
    for (let y = I - 2; y <= top; y++) set(x, y, z, y % 3 ? B.QUARTZ_BLOCK : B.GOLD_BLOCK);
    set(x, top + 1, z, B.SHINESTONE);
  }
  const devices = K.runes(0, I + 1, AZ, AR - 3, [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.5]);
  K.info.arenas.skysov = { X: 0, y: I + 1, Z: AZ, r: AR, devices };
  K.sign(2, I + 1, AZ + AR + 2, 0, "The Storm Spire\n\nThe Sky Sovereign guards the Crown Key here. Every strike it makes glows first. When it raises its shield, light the three Rune Stones.\n\nStay inside the wall!");
  K.place("stormSpire", 0, AZ, AR, I + 1);
  K.place("skyreach", 0, 30, 14);
  return K;
}

// ======================= THE RUINED CAPITAL =======================
// South: the kingdoms' camp inside the broken south gate (Waystone, tents, friends from earlier chapters).
// The Grand Avenue runs north between ruined houses to the Gate of Eight (eight pedestals and a Rune Stone),
// which opens the sealed gate of the Throne Court, a round open-sky arena with the Forgotten King's throne.
export function buildCapital(g, groundAt) {
  const K = makeKit(SIZES3.capital, g), { set, box } = K;
  K.ground(groundAt, 56, 63, B.GRASS);
  const stone = (x, y, z) => { const r = hash(x * 5 + y * 31, z * 3 - y); return r < 0.2 ? B.MOSSY : r < 0.3 ? B.COBBLE : r < 0.36 ? B.VIOLET_BRICKS : B.STONE_BRICKS; };
  // the cursed ground: purple stains spreading from the Throne Court
  for (let Z = -60; Z <= 50; Z++) for (let X = -56; X <= 56; X++) {
    const d = Math.hypot(X, (Z + 42) * 0.8), r = hash(X + 300, Z - 77);
    if (r < 0.55 - d / 110) set(X, g, Z, r < 0.12 ? B.DUSK_BLOCK : r < 0.3 ? B.GRAVEL : B.DIRT);
  }
  // ---- the outer wall (broken), with the south gate ----
  const WH = 50;
  for (let X = -WH; X <= WH; X++) for (let Z = -WH - 12; Z <= WH; Z++) {
    const onWall = (Math.abs(X) === WH && Z >= -WH - 12) || Z === WH || Z === -WH - 12; if (!onWall) continue;
    if (Z === WH && Math.abs(X) <= 3) continue;
    const top = hash(X, Z) < 0.2 ? 1 + Math.floor(hash(X + 1, Z) * 2) : 5 + Math.floor(hash(X * 2, Z * 3) * 4);
    for (let y = g + 1; y <= g + top; y++) set(X, y, Z, stone(X, y, Z));
  }
  for (const s of [-4, 4]) { box(s, g + 1, WH, s, g + 11, WH, B.QUARTZ_BLOCK); set(s, g + 12, WH, B.GOLD_BLOCK); }
  for (const [x, z] of [[-WH, WH], [WH, WH], [-WH, -WH - 12], [WH, -WH - 12]]) {   // broken corner towers
    const top = 10 + Math.floor(hash(x, z) * 6);
    for (let y = g + 1; y <= g + top; y++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) === 2 || Math.abs(dz) === 2) if (y < g + top - 2 || hash(dx + x, dz + y) < 0.5) set(x + dx, y, z + dz, stone(x + dx, y, z + dz));
  }
  // ---- the kingdoms' camp (inside the south gate) ----
  K.waystone("capital", 6, 44);
  K.sign(-6, g + 1, 46, 0, "The Ruined Capital\n\nThe first city of the First Builders, and the last. Its king became the Forgotten King.\n\nThe kingdoms have sent their bravest to camp here. The Gate of Eight lies straight ahead, at the end of the Grand Avenue.");
  const tent = (x0, z0, wool) => {   // a small tent with a bed
    for (let k = 0; k < 3; k++) box(x0 - 2 + k, g + 1 + k, z0, x0 + 2 - k, g + 1 + k, z0 + 4, wool);
    box(x0 - 1, g + 1, z0 + 1, x0 + 1, g + 1, z0 + 3, B.AIR); set(x0, g + 2, z0 + 1, B.AIR); set(x0, g + 1, z0 + 4, B.AIR); set(x0, g + 2, z0 + 4, B.AIR);
    K.bed(x0, g + 1, z0 + 2);
  };
  tent(-16, 36, B.WOOL); tent(-26, 38, B.WOOL); tent(16, 36, B.WOOL); tent(26, 38, B.WOOL);
  set(0, g, 40, B.COBBLE); set(0, g + 1, 40, B.TORCH);   // the campfire's lantern
  for (const [x, z] of [[-1, 40], [1, 40], [0, 39], [0, 41]]) set(x, g + 1, z, B.COBBLE);
  K.chest(-10, g + 1, 44, 0, "capSupplies", "The Kingdoms' Supply Chest");
  K.chest(10, g + 1, 44, 0, "capArmory", "The Kingdoms' Armory");
  K.npc("brenna8", -6, 40); K.npc("hilda8", 6, 40); K.npc("sable8", 0, 44);
  for (const [x, z] of [[-12, 30], [12, 30], [-20, 46], [20, 46]]) K.lamp(x, z);
  K.place("capital", 0, 38, 14);
  // ---- the Grand Avenue, its statues, and the ruined houses on both sides ----
  for (let Z = -2; Z <= WH; Z++) for (let X = -3; X <= 3; X++) set(X, g, Z, hash(X, Z) < 0.15 ? B.GRAVEL : (X + Z) % 6 ? B.STONE_BRICKS : B.QUARTZ_BLOCK);
  for (let Z = 4; Z <= 32; Z += 7) for (const X of [-5, 5]) {   // broken statues of the First Builders on gold plinths
    set(X, g + 1, Z, B.GOLD_BLOCK);
    const top = 2 + Math.floor(hash(X, Z) * 4);
    for (let y = g + 2; y <= g + 1 + top; y++) set(X, y, Z, B.QUARTZ_BLOCK);
    if (top >= 4) { set(X - 1, g + 4, Z, B.QUARTZ_BLOCK); set(X + 1, g + 4, Z, B.QUARTZ_BLOCK); }
    else set(X + (X < 0 ? -1 : 1), g + 1, Z + 1, B.QUARTZ_BLOCK);   // its fallen head
  }
  for (let Z = 2; Z <= 30; Z += 8) for (const X of [-6, 6]) { const bx = X + (X < 0 ? -1 : 1); for (let y = g + 1; y <= g + 3; y++) set(bx, y, Z + 3, B.DARKSLATE_BRICKS); for (let y = g + 4; y <= g + 7; y++) set(bx, y, Z + 3, B.CRIMSON_PLANKS); set(bx, g + 8, Z + 3, B.GOLD_BLOCK); }   // torn crimson banners on stone posts
  const ruin = (x0, z0, w, d, seed) => {   // a ruined house: broken walls, a fallen roof, maybe a chest
    for (let z = z0; z <= z0 + d; z++) for (let x = x0; x <= x0 + w; x++) {
      const edge = x === x0 || x === x0 + w || z === z0 || z === z0 + d;
      set(x, g, z, edge ? B.STONE_BRICKS : hash(x, z + seed) < 0.3 ? B.COBBLE : B.PLANKS);
      if (!edge) continue;
      const top = Math.floor(hash(x * 3 + seed, z) * 6) - 1;
      for (let y = g + 1; y <= g + top; y++) set(x, y, z, stone(x, y, z));
    }
    for (let k = 0; k < 3; k++) { const x = x0 + 1 + Math.floor(hash(seed, k) * (w - 1)), z = z0 + 1 + Math.floor(hash(k, seed) * (d - 1)); set(x, g + 1, z, k ? B.COBBLE : B.MOSSY); }
  };
  let n = 0;
  for (const side of [-1, 1]) for (let Z = 6; Z <= 18; Z += 12) for (let k = 0; k < 3; k++) {
    const x0 = side < 0 ? -44 + k * 13 : 8 + k * 13, seed = ++n * 17;
    ruin(x0, Z, 8 + Math.floor(hash(seed, 1) * 3), 7 + Math.floor(hash(seed, 2) * 3), seed);
    if (n === 4) K.chest(x0 + 2, g + 1, Z + 2, 0, "capRuin1", "A Buried Chest");
    if (n === 9) K.chest(x0 + 2, g + 1, Z + 2, 0, "capRuin2", "A Buried Chest");
  }
  K.sign(4, g + 1, 33, 0, "The Grand Avenue\n\nThe statues are the First Builders. Long ago, the people of the capital walked this road to see their king. He was kind, the stories say, until the Void whispered to him.");
  K.place("avenue", 0, 16, 12);
  // ---- the Gate of Eight ----
  const GZ = -6;
  for (let dz = -10; dz <= 10; dz++) for (let dx = -10; dx <= 10; dx++) { const d = Math.hypot(dx, dz); if (d <= 9.5) set(dx, g, GZ + dz, d > 8.5 ? B.GOLD_BLOCK : Math.round(d) % 3 === 0 ? B.QUARTZ_BLOCK : B.PALE_BRICKS); }
  for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2 + Math.PI / 8, x = Math.round(Math.cos(t) * 7), z = GZ + Math.round(Math.sin(t) * 7); set(x, g + 1, z, B.RELIC_PEDESTAL); set(x, g + 2, z, B.SHINESTONE); }
  K.sign(-2, g + 1, GZ + 9, 0, "The Gate of Eight\n\nEight Relics made the seal. Eight Relics, and the Crown Key from Skyreach, will open it.\n\nCarry them all to the Rune Stone before the gate and right-click it.");
  K.place("capitalGate", 0, GZ, 10);
  // ---- the Throne Court: a round arena, open to the sky, behind the sealed gate ----
  const AZ = -42, AR = 18;
  for (let dz = -AR - 4; dz <= AR + 4; dz++) for (let dx = -AR - 4; dx <= AR + 4; dx++) {
    const d = Math.hypot(dx, dz); if (d > AR + 3.5) continue;
    const x = dx, z = AZ + dz;
    if (d <= AR + 0.5) {
      set(x, g, z, Math.abs(d - 9) < 0.5 || Math.abs(d - 15) < 0.5 ? B.GOLD_BLOCK : (dx + dz) % 2 ? B.DARKSLATE_BRICKS : B.BLACKSTONE_BRICKS);
      for (let y = g + 1; y <= Math.min(HEIGHT - 2, g + 30); y++) set(x, y, z, B.AIR);
    } else {
      const top = 7 + Math.floor(Math.abs(Math.sin(Math.atan2(dz, dx) * 4)) * 5 + hash(x, z) * 2);
      for (let y = g; y <= g + top; y++) set(x, y, z, y === g + top && (dx + dz) % 2 ? B.GOLD_BLOCK : (y + x) % 6 ? B.DARKSLATE_BRICKS : B.VIOLET_BRICKS);
    }
  }
  const door = { x0: -3, x1: 3, y0: g + 1, y1: g + 6, z0: AZ + AR + 2 };   // the sealed gate in the court wall (the wall is 3 deep)
  for (let z = AZ + AR + 1; z <= AZ + AR + 3; z++) for (let x = -3; x <= 3; x++) for (let y = g + 1; y <= g + 6; y++) set(x, y, z, z === door.z0 ? B.VIOLET_PILLAR : B.AIR);
  for (let x = -3; x <= 3; x++) for (let z = AZ + AR + 1; z <= AZ + AR + 3; z++) set(x, g, z, B.GOLD_BLOCK);
  set(0, g + 1, AZ + AR + 6, B.RUNE_STONE); set(0, g, AZ + AR + 6, B.GOLD_BLOCK);
  K.info.marks.capDoor = { ...door, rune: { X: 0, y: g + 1, Z: AZ + AR + 6 } };
  // the throne at the north end
  box(-4, g + 1, AZ - AR + 1, 4, g + 1, AZ - AR + 4, B.GOLD_BLOCK); box(-3, g + 2, AZ - AR + 1, 3, g + 2, AZ - AR + 3, B.GOLD_BLOCK);
  box(-1, g + 3, AZ - AR + 1, 1, g + 3, AZ - AR + 2, B.QUARTZ_BLOCK); box(-1, g + 4, AZ - AR + 1, 1, g + 7, AZ - AR + 1, B.QUARTZ_BLOCK); set(0, g + 8, AZ - AR + 1, B.GOLD_BLOCK);
  for (const x of [-2, 2]) for (let y = g + 3; y <= g + 9; y++) set(x, y, AZ - AR, B.CRIMSON_PLANKS);
  // four broken pillars (he steps between them in his third phase) and two lights
  const tele = [];
  for (let k = 0; k < 4; k++) {
    const t = k / 4 * Math.PI * 2 + Math.PI / 4, x = Math.round(Math.cos(t) * 11), z = AZ + Math.round(Math.sin(t) * 11), top = 5 + (k % 2) * 3;
    for (let y = g + 1; y <= g + top; y++) set(x, y, z, y % 3 ? B.QUARTZ_BLOCK : B.GOLD_BLOCK);
    tele.push({ ...K.at(x + (x < 0 ? 2 : -2), z + (z < AZ ? 2 : -2)), y: g + 1 });
  }
  for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; set(Math.round(Math.cos(t) * (AR + 1)), g + 4, AZ + Math.round(Math.sin(t) * (AR + 1)), B.SHINESTONE); }
  const devices = K.runes(0, g + 1, AZ, 15, [Math.PI * 0.5 + 0.5, Math.PI * 1.17, Math.PI * 1.83]);
  K.info.arenas.king = { X: 0, y: g + 1, Z: AZ, r: AR, devices, tele };
  // tall broken spires at the court's corners: the capital's skyline, seen from far away
  for (const [x, z] of [[-24, AZ - 18], [24, AZ - 18], [-24, AZ + 14], [24, AZ + 14]]) {
    const top = Math.min(HEIGHT - 4, g + 22 + Math.floor(hash(x, z) * 8));
    for (let y = g + 1; y <= top; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) || y > top - 3) if (y < top - 4 || hash(dx + y, dz + x) < 0.6) set(x + dx, y, z + dz, y % 5 ? B.DARKSLATE_BRICKS : B.GOLD_BLOCK);
    set(x, top + 1, z, B.SHINESTONE);
  }
  K.place("throneCourt", 0, AZ, AR - 2);
  return K;
}
