// Builds the Lost Civilization's hand-planned maps. Runs only during development (tools/lost-build.html);
// the results are packed into maps/deep-v1.bin, maps/expanse-v1.bin, and maps/surface-v1.bin.
import { B, I, HEIGHT, make, TOP } from "./blocks.js";
import { Noise } from "./noise.js";
import { Grid, KEEP, walkable } from "./maps.js";
import { LORE, MURALS, MEMORIES } from "./lost-lore.js";

export const LOST_VERSION = 1;
function seeded(s) { return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const it = (id, n = 1) => ({ id, n });
const k3 = (x, y, z) => x + "," + y + "," + z;

// ---------- loot tiers (tune here) ----------
const SUPPLY = [[I.BREAD, 4, 8], [I.COOKED_PORK, 3, 6], [I.ARROW, 8, 20], [B.TORCH, 8, 16], [I.IRON_INGOT, 2, 5], [I.APPLE, 2, 5], [I.COOKED_MINNOW, 3, 6], [B.HUSH_CARPET, 6, 12], [I.ECHO_SHARD, 2, 4], [I.STRING, 3, 6]];
const DISCOVERY = [[I.LUMEN_SHARD, 2, 5], [I.GOLD_INGOT, 2, 5], [I.JADE, 2, 6], [I.SKYSHARD, 1, 2], [I.GOLDEN_APPLE, 1, 1], [I.TOTEM, 1, 1], [B.KEEPER_LAMP, 4, 8], [I.SHIELD, 1, 1], [I.SKY_SWORD, 1, 1], [I.IRON_CHEST, 1, 1]];
function lootFor(r, tier, extra = []) {
  const out = [], pick = (table, n) => { for (let i = 0; i < n; i++) { const [id, a, b] = table[Math.floor(r() * table.length)]; out.push(it(id, a + Math.floor(r() * (b - a + 1)))); } };
  if (tier === "supply") pick(SUPPLY, 3 + Math.floor(r() * 2));
  if (tier === "discovery") { pick(SUPPLY, 2); pick(DISCOVERY, 2 + Math.floor(r() * 2)); }
  if (tier === "vault") { pick(SUPPLY, 2); pick(DISCOVERY, 4); out.push(it(I.SKYSHARD, 2), it(I.GOLDEN_APPLE, 2)); }
  return [...extra, ...out].slice(0, 27);
}

// ---------- shared building helpers ----------
function makeKit(W, meta, r) {
  const K = {
    lore(x, y, z, id) { W.set(x, y, z, B.LORE_TABLET); meta.lore[k3(x, y, z)] = id; },
    mural(x, y, z, id) { W.set(x, y, z, B.MURAL); W.set(x, y + 1, z, B.MURAL); meta.lore[k3(x, y, z)] = id; meta.lore[k3(x, y + 1, z)] = id; },
    chest(x, y, z, id, tier, extra, facing = 0) { W.set(x, y, z, make(B.CHEST, facing)); meta.chests[k3(x, y, z)] = { id, tier, slots: lootFor(r, tier, extra) }; },
    beacon(x, y, z, id, name) { W.set(x, y, z, B.KEEPER_BEACON); meta.checkpoints.push({ id, name, x, y, z }); },
    lamp(x, y, z, h = 3) { W.box(x, y, z, x, y + h - 2, z, B.DARKSLATE_BRICKS); W.set(x, y + h - 1, z, B.KEEPER_LAMP); },
    // a Keeper house: walls of darkslate brick, a doorway, windows, a flat roof, sometimes broken
    house(x0, z0, w, d, y, h, opts = {}) {
      const x1 = x0 + w - 1, z1 = z0 + d - 1, wall = opts.wall || B.DARKSLATE_BRICKS;
      W.box(x0, y - 1, z0, x1, y - 1, z1, opts.floor || B.DARKSLATE);
      W.box(x0 + 1, y, z0 + 1, x1 - 1, y + h - 1, z1 - 1, 0);
      W.walls(x0, y, z0, x1, y + h - 1, z1, wall);
      W.box(x0, y + h, z0, x1, y + h, z1, opts.roof || B.DARKSLATE);
      const door = opts.door || "s";
      const dx = door === "s" || door === "n" ? Math.floor((x0 + x1) / 2) : door === "e" ? x1 : x0, dz = door === "e" || door === "w" ? Math.floor((z0 + z1) / 2) : door === "s" ? z1 : z0;
      W.box(dx, y, dz, dx, y + 1, dz, 0);
      for (let x = x0 + 2; x < x1 - 1; x += 3) { W.set(x, y + 1, z0, B.RESONANT_GLASS); W.set(x, y + 1, z1, x === dx ? 0 : B.RESONANT_GLASS); }
      if (opts.broken) { W.box(x1, y + 1, z0 + 1, x1, y + h, z0 + 2, 0); W.box(x0 + 1, y + h, z0 + 1, x0 + 2, y + h, z0 + 2, 0); }
      if (opts.lamp !== false) W.set(x0 + 1, y, z0 + 1, B.KEEPER_LAMP);
      return { door: { x: dx, y, z: dz } };
    },
    tower(cx, cz, y, rad, h, mat = B.DARKSLATE_BRICKS, cap = B.KEEPER_LAMP) {
      for (let yy = y; yy < y + h; yy++) for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { const dd = Math.hypot(dx, dz); if (dd <= rad + 0.3) W.set(cx + dx, yy, cz + dz, dd > rad - 1 ? (yy % 5 === 0 ? B.KEEPER_COPPER : mat) : 0); }
      W.set(cx, y + h, cz, cap);
    },
    // a round tower you can climb: a spiral of steps inside, a doorway at the bottom (south), and a floor on top with a hatch
    stairTower(cx, cz, y, h, mat = B.DARKSLATE_BRICKS) {
      K.tower(cx, cz, y, 3, h, mat, B.KEEPER_LAMP);
      W.set(cx, y + h, cz, 0);
      const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
      for (let yy = y; yy < y + h - 1; yy++) { const [dx, dz] = ring[(yy - y) % 8]; W.set(cx + dx, yy, cz + dz, mat); }
      W.box(cx - 2, y + h - 1, cz - 2, cx + 2, y + h - 1, cz + 2, mat);
      for (let k = 1; k <= 3; k++) { const yy = y + h - 1 - k, [dx, dz] = ring[(yy - y) % 8]; W.set(cx + dx, y + h - 1, cz + dz, 0); }
      W.box(cx, y, cz + 3, cx, y + 1, cz + 3, 0);
      return { top: { x: cx, y: y + h, z: cz } };
    },
    bridge(a, b, y, wdt = 1, mat = B.DARKSLATE_BRICKS, rail = true) {
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z)), dx = (b.x - a.x) / steps, dz = (b.z - a.z) / steps, px = -dz, pz = dx;
      for (let s = 0; s <= steps; s++) {
        const x = a.x + dx * s, z = a.z + dz * s, yy = a.y !== undefined ? Math.round(a.y + (b.y - a.y) * s / steps) : y;   // slopes gently between two heights
        for (let w = -wdt; w <= wdt; w++) { W.set(Math.round(x + px * w), yy, Math.round(z + pz * w), mat); for (let c = 1; c <= 3; c++) W.set(Math.round(x + px * w), yy + c, Math.round(z + pz * w), 0); }
        if (rail) for (const w of [-wdt - 1, wdt + 1]) W.set(Math.round(x + px * w), yy + 1, Math.round(z + pz * w), s % 6 === 0 ? B.KEEPER_LAMP : B.DARKSLATE_BRICKS);
      }
    },
    stairsDown(a, b, wdt = 1) {   // a carved passage with steps, from a down (or up) to b
      const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.z - a.z), Math.abs(b.y - a.y) * 2);
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(a.x + (b.x - a.x) * s / steps), y = Math.round(a.y + (b.y - a.y) * s / steps), z = Math.round(a.z + (b.z - a.z) * s / steps);
        W.box(x - wdt, y, z - wdt, x + wdt, y + 3, z + wdt, 0);
        W.box(x - wdt, y - 1, z - wdt, x + wdt, y - 1, z + wdt, (xx, yy, zz, old) => (old & 255) === 0 || (old & 255) === B.WATER || (old & 255) === B.LAVA ? B.DARKSLATE_BRICKS : undefined);
        if (s % 10 === 5) W.set(x + wdt + 1, y + 2, z, B.KEEPER_LAMP);
      }
    }
  };
  return K;
}

// =====================================================================
// THE DEEP: a layered descent to Echohold, capital of the Keepers
// =====================================================================
export const DEEP = { min: -128, size: 256, floor: 12 };
export function buildDeep() {
  const W = new Grid(DEEP.min, DEEP.min, DEEP.size, DEEP.size), n = new Noise(51923), r = seeded(1104);
  const meta = { version: LOST_VERSION, id: "deep-v1", kind: "deep", lore: {}, chests: {}, checkpoints: [], districts: [], nodes: [], puzzles: {}, secrets: [], spawns: [] };
  const K = makeKit(W, meta, r), F = DEEP.floor;
  // solid rock: stone above, darkslate below, with ore
  for (let z = DEEP.min; z < DEEP.min + DEEP.size; z++) for (let x = DEEP.min; x < DEEP.min + DEEP.size; x++) for (let y = 0; y < HEIGHT; y++) {
    let v = y === 0 || y === HEIGHT - 1 ? B.BEDROCK : y < 44 ? B.DARKSLATE : B.STONE;
    if (v !== B.BEDROCK) { const q = r(); if (q < 0.006) v = B.COAL_ORE; else if (q < 0.01) v = B.IRON_ORE; else if (q < 0.0115 && y < 30) v = B.SKY_ORE; }
    W.set(x, y, z, v);
  }
  // wandering side caves for exploring (never on the main route; the route is carved afterward)
  for (let z = DEEP.min + 2; z < DEEP.min + DEEP.size - 2; z++) for (let x = DEEP.min + 2; x < DEEP.min + DEEP.size - 2; x++) for (let y = 4; y < HEIGHT - 4; y++) if (n.n3(x / 22, y / 14, z / 22) > 0.52) W.set(x, y, z, 0);
  // ----- the great cavern: a dome 208 blocks across, floor at y 12 -----
  const RAD = 104;
  for (let z = -RAD - 4; z <= RAD + 4; z++) for (let x = -RAD - 4; x <= RAD + 4; x++) {
    const d = Math.hypot(x, z), wob = n.n2(x / 18, z / 18) * 5;
    for (let y = 1; y < HEIGHT - 2; y++) {
      const inside = (d / (RAD + wob)) ** 2 + ((y - F) / 60) ** 2 <= 1;
      if (y <= F && d < RAD - 2) W.set(x, y, z, y === F ? (n.n2(x / 9, z / 9) > 0.35 && d < 60 ? B.HUSHMOSS : B.DARKSLATE) : B.DARKSLATE);
      else if (inside) W.set(x, y, z, 0);
    }
  }
  // stalactite columns and lumen crystals on the walls for a sense of scale
  for (let k = 0; k < 70; k++) { const a = r() * Math.PI * 2, d = 40 + r() * 60, x = Math.round(Math.cos(a) * d), z = Math.round(Math.sin(a) * d); let y = HEIGHT - 3; while (y > F + 20 && W.id(x, y, z) !== 0) y--; const len = 3 + Math.floor(r() * 9); for (let j = 0; j < len; j++) if (W.id(x, y - j, z) === 0) W.set(x, y - j, z, B.DRIPSTONE); }
  for (let k = 0; k < 140; k++) { const a = r() * Math.PI * 2, x = Math.round(Math.cos(a) * (RAD + 1)), z = Math.round(Math.sin(a) * (RAD + 1)), y = F + 6 + Math.floor(r() * 40); if (W.id(x, y, z) && W.id(Math.round(x * 0.97), y, Math.round(z * 0.97)) === 0) W.set(Math.round(x * 0.97), y, Math.round(z * 0.97), B.LUMEN_CRYSTAL); }

  // ----- the descent: arrival → upper caverns → balcony → lush → dripstone → crystal → ravine → the city -----
  const A = { x: 108, y: 66, z: -108 };
  W.ball(A.x, A.y + 2, A.z, 7, 4, 7, 0); W.box(A.x - 6, A.y - 1, A.z - 6, A.x + 6, A.y - 1, A.z + 6, B.DARKSLATE_BRICKS);
  W.set(A.x + 2, A.y, A.z + 2, B.DEEP_LIFT); K.lamp(A.x - 4, A.y, A.z - 4); K.lamp(A.x + 4, A.y, A.z - 4);
  K.chest(A.x - 4, A.y, A.z + 3, "lift_cache", "supply", [it(I.ECHO_SHARD, 4), it(B.HUSH_CARPET, 8)]);
  meta.arrival = { x: A.x + 0.5, y: A.y, z: A.z + 0.5 }; meta.lift = { x: A.x + 2, y: A.y, z: A.z + 2 };
  K.beacon(A.x, A.y, A.z + 4, "lift", "the Keeper Lift");
  const UP = { x: 112, y: 58, z: -74 }, LUSH = { x: 114, y: 46, z: -30 }, DRIP = { x: 112, y: 36, z: 16 }, CRYS = { x: 100, y: 26, z: 66 }, RAV = { x: 74, y: 17, z: 100 }, ENTRY = { x: 56, y: F + 1, z: 82 };
  // upper caverns: rough stone, roots, a small mining shelter
  W.ball(UP.x, UP.y + 4, UP.z, 12, 7, 12, 0); W.box(UP.x - 11, UP.y - 1, UP.z - 11, UP.x + 11, UP.y - 1, UP.z + 11, (x, y, z, o) => (o & 255) === 0 ? B.STONE : undefined);
  W.box(UP.x + 3, UP.y, UP.z - 6, UP.x + 7, UP.y + 3, UP.z - 3, (x, y, z) => x === UP.x + 3 || x === UP.x + 7 || z === UP.z - 6 || z === UP.z - 3 || y === UP.y + 3 ? B.PLANKS : 0); W.box(UP.x + 5, UP.y, UP.z - 3, UP.x + 5, UP.y + 1, UP.z - 3, 0);
  K.chest(UP.x + 4, UP.y, UP.z - 5, "shelter", "supply", [it(I.IRON_PICK, 1)]); K.lamp(UP.x - 6, UP.y, UP.z);
  for (let k = 0; k < 12; k++) { const x = UP.x - 10 + Math.floor(r() * 20), z = UP.z - 10 + Math.floor(r() * 20); for (let y = UP.y + 10; y > UP.y + 3; y--) if (W.id(x, y, z) === 0 && W.id(x, y + 1, z)) { W.set(x, y, z, B.ROOTWOOD); W.set(x, y - 1, z, B.ROOTWOOD); break; } }
  K.stairsDown({ x: A.x, y: A.y, z: A.z + 6 }, { x: UP.x, y: UP.y, z: UP.z - 10 });
  // the balcony: a window in the cavern wall where you first see the whole city below
  const BAL = { x: 62, y: 58, z: -44 };
  K.stairsDown({ x: UP.x - 10, y: UP.y, z: UP.z + 4 }, { x: BAL.x + 4, y: BAL.y, z: BAL.z - 2 }, 1);
  W.box(BAL.x - 3, BAL.y - 1, BAL.z - 3, BAL.x + 4, BAL.y - 1, BAL.z + 3, B.DARKSLATE_BRICKS);
  for (let x = BAL.x - 4; x <= BAL.x + 4; x++) W.set(x, BAL.y, BAL.z + 3, x % 2 ? B.DARKSLATE_BRICKS : 0);
  W.box(BAL.x - 3, BAL.y, BAL.z - 3, BAL.x + 3, BAL.y + 3, BAL.z + 2, 0);
  K.lore(BAL.x - 2, BAL.y, BAL.z - 2, "ilyan_gate"); meta.balcony = { x: BAL.x, y: BAL.y, z: BAL.z };
  // lush caverns: moss, hanging roots, a waterfall into a pool, a safe rest beacon
  K.stairsDown({ x: UP.x, y: UP.y, z: UP.z + 11 }, { x: LUSH.x, y: LUSH.y, z: LUSH.z - 12 });
  W.ball(LUSH.x, LUSH.y + 5, LUSH.z, 13, 8, 13, 0);
  W.box(LUSH.x - 12, LUSH.y - 1, LUSH.z - 12, LUSH.x + 12, LUSH.y - 1, LUSH.z + 12, (x, y, z, o) => (o & 255) === 0 || (o & 255) === B.STONE || (o & 255) === B.DARKSLATE ? B.CAVE_MOSS : undefined);
  W.box(LUSH.x + 4, LUSH.y - 1, LUSH.z + 2, LUSH.x + 9, LUSH.y - 1, LUSH.z + 7, B.WATER); W.box(LUSH.x + 4, LUSH.y - 2, LUSH.z + 2, LUSH.x + 9, LUSH.y - 2, LUSH.z + 7, B.CAVE_MOSS);
  for (let y = LUSH.y; y < LUSH.y + 11; y++) W.set(LUSH.x + 9, y, LUSH.z + 4, B.WATER);
  for (let k = 0; k < 30; k++) { const x = LUSH.x - 11 + Math.floor(r() * 22), z = LUSH.z - 11 + Math.floor(r() * 22); for (let y = LUSH.y + 12; y > LUSH.y + 2; y--) if (W.id(x, y, z) === 0 && W.id(x, y + 1, z)) { const len = 2 + Math.floor(r() * 4); for (let j = 0; j < len; j++) if (W.id(x, y - j, z) === 0) W.set(x, y - j, z, B.LEAVES); break; } }
  for (let k = 0; k < 40; k++) { const x = LUSH.x - 11 + Math.floor(r() * 22), z = LUSH.z - 11 + Math.floor(r() * 22); if (W.id(x, LUSH.y - 1, z) === B.CAVE_MOSS && W.id(x, LUSH.y, z) === 0) W.set(x, LUSH.y, z, r() < 0.8 ? B.TALL_GRASS : B.FLOWER_YELLOW); }
  K.beacon(LUSH.x - 6, LUSH.y, LUSH.z - 4, "lush", "the Lush Caverns"); K.chest(LUSH.x - 8, LUSH.y, LUSH.z + 6, "lush_cache", "supply");
  // dripstone chamber: tall columns, a narrow ledge path over a stream
  K.stairsDown({ x: LUSH.x, y: LUSH.y, z: LUSH.z + 12 }, { x: DRIP.x, y: DRIP.y + 2, z: DRIP.z - 12 });
  W.ball(DRIP.x, DRIP.y + 6, DRIP.z, 12, 10, 12, 0);
  W.box(DRIP.x - 11, DRIP.y - 3, DRIP.z - 11, DRIP.x + 11, DRIP.y - 3, DRIP.z + 11, (x, y, z, o) => (o & 255) === 0 ? B.DRIPSTONE : undefined);
  W.box(DRIP.x - 11, DRIP.y - 2, DRIP.z - 3, DRIP.x + 11, DRIP.y - 2, DRIP.z + 3, B.WATER);
  W.box(DRIP.x - 1, DRIP.y + 1, DRIP.z - 12, DRIP.x + 1, DRIP.y + 1, DRIP.z + 12, B.DRIPSTONE);   // the ledge path
  for (let k = 0; k < 16; k++) { const x = DRIP.x - 10 + Math.floor(r() * 20), z = DRIP.z - 10 + Math.floor(r() * 20); if (Math.abs(x - DRIP.x) < 3) continue; const h = 4 + Math.floor(r() * 12); for (let j = 0; j < h; j++) W.set(x, DRIP.y - 2 + j, z, B.DRIPSTONE); }
  K.lamp(DRIP.x + 3, DRIP.y + 2, DRIP.z - 10); K.chest(DRIP.x + 2, DRIP.y + 2, DRIP.z + 9, "drip_cache", "discovery");
  // crystal gallery: lumen crystals, broken survey gear, and the first resonance lesson (a resonator opens a door)
  K.stairsDown({ x: DRIP.x, y: DRIP.y + 2, z: DRIP.z + 12 }, { x: CRYS.x, y: CRYS.y, z: CRYS.z - 12 });
  W.ball(CRYS.x, CRYS.y + 5, CRYS.z, 13, 8, 12, 0); W.box(CRYS.x - 12, CRYS.y - 1, CRYS.z - 11, CRYS.x + 12, CRYS.y - 1, CRYS.z + 11, (x, y, z, o) => (o & 255) === 0 ? B.DARKSLATE : undefined);
  for (let k = 0; k < 60; k++) { const x = CRYS.x - 12 + Math.floor(r() * 24), z = CRYS.z - 11 + Math.floor(r() * 22), y = CRYS.y + Math.floor(r() * 10); if (W.id(x, y, z) === 0 && (W.id(x + 1, y, z) || W.id(x, y + 1, z) || W.id(x, y - 1, z))) W.set(x, y, z, B.LUMEN_CRYSTAL); }
  for (const [dx, dz] of [[-4, -3], [-2, -4]]) W.set(CRYS.x + dx, CRYS.y, CRYS.z + dz, B.KEEPER_COPPER);
  W.set(CRYS.x - 3, CRYS.y, CRYS.z + 5, B.RESONATOR);
  meta.puzzles.crystal = { kind: "tone", resonator: { x: CRYS.x - 3, y: CRYS.y, z: CRYS.z + 5 }, door: { x0: CRYS.x - 1, y0: CRYS.y, z0: CRYS.z + 11, x1: CRYS.x + 1, y1: CRYS.y + 2, z1: CRYS.z + 11 } };
  K.chest(CRYS.x + 8, CRYS.y, CRYS.z - 6, "crystal_cache", "discovery", [it(I.LUMEN_SHARD, 4)]);
  // ravine: a deep crack with a ruined bridge and an old rail tunnel down to the city (carved first, so the paths into it keep their floors)
  W.box(RAV.x - 16, 6, RAV.z - 3, RAV.x + 16, RAV.y + 22, RAV.z + 3, 0);
  W.box(RAV.x - 16, 5, RAV.z - 3, RAV.x + 16, 5, RAV.z + 3, B.DARKSLATE); W.box(RAV.x - 16, 6, RAV.z - 3, RAV.x + 16, 6, RAV.z + 3, B.WATER);
  K.stairsDown({ x: CRYS.x, y: CRYS.y, z: CRYS.z + 12 }, { x: RAV.x + 13, y: RAV.y + 3, z: RAV.z });
  W.box(CRYS.x - 1, CRYS.y, CRYS.z + 11, CRYS.x + 1, CRYS.y + 2, CRYS.z + 11, B.KEEPER_STONE);   // the resonance door (opens with the resonator)
  K.bridge({ x: RAV.x + 12, z: RAV.z }, { x: RAV.x - 14, z: RAV.z }, RAV.y + 3, 1, B.PLANKS);
  W.box(RAV.x - 3, RAV.y + 3, RAV.z - 1, RAV.x - 1, RAV.y + 3, RAV.z + 1, 0);   // a broken gap…
  // …with a lower walkway under the bridge to land on, and steps back up beside it
  W.box(RAV.x - 9, RAV.y, RAV.z - 1, RAV.x + 1, RAV.y, RAV.z + 1, B.PLANKS);
  for (let s = 0; s < 3; s++) { const x = RAV.x - 9 - s, y = RAV.y + 1 + s; W.box(x, RAV.y + 1, RAV.z + 2, x, y, RAV.z + 2, B.PLANKS); W.box(x, y + 1, RAV.z + 2, x, y + 3, RAV.z + 2, 0); }
  W.box(RAV.x - 12, RAV.y + 3, RAV.z + 2, RAV.x - 11, RAV.y + 3, RAV.z + 2, B.PLANKS); W.box(RAV.x - 12, RAV.y + 4, RAV.z + 2, RAV.x - 11, RAV.y + 6, RAV.z + 2, 0);
  K.stairsDown({ x: RAV.x - 15, y: RAV.y + 4, z: RAV.z }, { x: ENTRY.x + 4, y: ENTRY.y, z: ENTRY.z + 4 });
  K.stairsDown({ x: ENTRY.x + 4, y: ENTRY.y, z: ENTRY.z + 4 }, { x: 58, y: F + 1, z: 76 }, 2);   // out of the tunnel and into the great cavern
  K.chest(RAV.x + 10, RAV.y + 4, RAV.z + 2, "ravine_camp", "supply"); K.lore(RAV.x + 8, RAV.y + 4, RAV.z - 2, "camp_pell");

  // ----- Echohold -----
  const Y = F + 1;
  const district = (id, name, x, z, rad, entrance, extra = {}) => { meta.districts.push({ id, name, x, z, r: rad, entrance, ...extra }); };
  // 1. the Abandoned Expedition Camp (just inside the cavern): map table, tents, supplies, a sound tutorial strip
  const CAMP = { x: 58, z: 70 };
  for (const [dx, dz] of [[-4, -2], [2, -3]]) W.box(CAMP.x + dx, Y, CAMP.z + dz, CAMP.x + dx + 2, Y + 1, CAMP.z + dz + 2, (x, y, z) => y === Y + 1 ? B.WOOL : (x === CAMP.x + dx + 1 ? 0 : B.WOOL));
  W.set(CAMP.x, Y, CAMP.z + 2, B.TABLE); K.beacon(CAMP.x - 2, Y, CAMP.z + 3, "camp", "the Expedition Camp");
  K.chest(CAMP.x + 3, Y, CAMP.z + 3, "camp_supplies", "supply", [it(I.ECHO_SHARD, 6), it(B.HUSH_CARPET, 16), it(I.SURVEY_MAP, 1)]);
  K.lore(CAMP.x + 1, Y, CAMP.z + 2, "camp_pell");
  // tutorial strip: stone (loud) beside carpet (quiet), with a harmless practice node at the end
  W.box(CAMP.x - 8, F, CAMP.z - 6, CAMP.x - 2, F, CAMP.z - 6, B.DARKSLATE_BRICKS); W.box(CAMP.x - 8, F, CAMP.z - 4, CAMP.x - 2, F, CAMP.z - 4, B.HUSH_CARPET);
  W.set(CAMP.x - 9, F, CAMP.z - 5, B.HUSH_NODE); meta.nodes.push({ x: CAMP.x - 9, y: F, z: CAMP.z - 5, practice: true });
  meta.tutorial = { stone: { x: CAMP.x - 5, z: CAMP.z - 6 }, carpet: { x: CAMP.x - 5, z: CAMP.z - 4 }, node: { x: CAMP.x - 9, y: F, z: CAMP.z - 5 } };
  district("camp", "the Abandoned Expedition Camp", CAMP.x, CAMP.z, 8, { x: CAMP.x, y: Y, z: CAMP.z });
  meta.cityArrival = { x: CAMP.x + 0.5, y: Y, z: CAMP.z + 5.5 };
  // the city wall with its great gate (2. the Gate of Whispers) to the south-east
  const WALL = 78;
  for (let a = 0; a < 360; a += 0.5) { const t = a * Math.PI / 180, x = Math.round(Math.cos(t) * WALL), z = Math.round(Math.sin(t) * WALL); if (Math.abs(a - 45) < 6) continue; W.box(x, Y, z, x, Y + 7, z, (xx, yy) => yy === Y + 7 && Math.round(a) % 4 === 0 ? B.KEEPER_LAMP : B.DARKSLATE_BRICKS); }
  const GW = { x: Math.round(Math.cos(Math.PI / 4) * WALL), z: Math.round(Math.sin(Math.PI / 4) * WALL) };
  const gwTop = K.stairTower(GW.x + 7, GW.z - 7, Y, 14).top; K.stairTower(GW.x - 7, GW.z + 7, Y, 14);
  W.box(GW.x - 4, Y, GW.z - 4, GW.x + 4, Y + 6, GW.z + 4, (x, y, z) => Math.abs((x - GW.x) - (z - GW.z)) <= 1 ? 0 : undefined);
  // whisper doors: a quiet path through the gate opened by a deliberate resonator tone; detection nodes line the loud street
  W.box(GW.x - 2, Y, GW.z - 2, GW.x + 2, Y + 4, GW.z + 2, (x, y, z) => Math.abs((x - GW.x) + (z - GW.z)) <= 1 && Math.abs((x - GW.x) - (z - GW.z)) <= 1 ? B.KEEPER_STONE : undefined);
  W.set(GW.x + 4, Y, GW.z + 2, B.RESONATOR);
  meta.puzzles.whisper = { kind: "tone", resonator: { x: GW.x + 4, y: Y, z: GW.z + 2 }, door: { x0: GW.x - 1, y0: Y, z0: GW.z - 1, x1: GW.x + 1, y1: Y + 4, z1: GW.z + 1 } };
  for (const [dx, dz] of [[-10, -6], [-6, -10], [-14, -12], [-12, -14]]) { W.set(GW.x + dx, F, GW.z + dz, B.HUSH_NODE); meta.nodes.push({ x: GW.x + dx, y: F, z: GW.z + dz }); }
  K.mural(GW.x + 7, Y, GW.z + 1, "m_founding"); K.chest(gwTop.x + 1, gwTop.y, gwTop.z - 1, "gate_tower", "discovery");
  district("gate", "the Gate of Whispers", GW.x, GW.z, 10, { x: GW.x + 3, y: Y, z: GW.z + 3 });
  // the main avenue from the gate to the processional (paved, with lamps)
  const avenue = (a, b) => { const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z)); for (let s = 0; s <= steps; s++) { const x = Math.round(a.x + (b.x - a.x) * s / steps), z = Math.round(a.z + (b.z - a.z) * s / steps); W.box(x - 2, F, z - 2, x + 2, F, z + 2, B.DARKSLATE_BRICKS); W.box(x - 2, Y, z - 2, x + 2, Y + 3, z + 2, (xx, yy, zz, o) => (o & 255) === B.DARKSLATE_BRICKS || (o & 255) === B.HUSHMOSS ? undefined : 0); if (s % 12 === 0) { K.lamp(x + 3, Y, z, 4); K.lamp(x - 3, Y, z, 4); } } };
  avenue({ x: GW.x - 6, z: GW.z - 6 }, { x: 0, z: 10 }); avenue({ x: 0, z: 10 }, { x: 0, z: -40 });
  // 3. the Silent Bazaar (east): stalls, warehouses, merchant safes, rooftop route
  const BZ = { x: 44, z: 8 };
  for (let i = 0; i < 6; i++) { const x = BZ.x - 10 + (i % 3) * 8, z = BZ.z - 6 + Math.floor(i / 3) * 10; W.box(x, Y, z, x + 4, Y, z + 2, B.PLANKS); W.box(x, Y + 3, z, x + 4, Y + 3, z + 2, i % 2 ? B.WOOL : B.BLACK_WOOL); W.box(x, Y, z, x, Y + 2, z, B.LOG); W.box(x + 4, Y, z, x + 4, Y + 2, z, B.LOG); }
  K.house(BZ.x + 8, BZ.z - 10, 9, 7, Y, 5, { door: "w" }); K.house(BZ.x + 8, BZ.z + 2, 9, 7, Y, 5, { door: "w", broken: true });
  for (let s = 0; s <= 5; s++) { W.set(BZ.x + 17, Y + s, BZ.z - 4 - s, B.DARKSLATE_BRICKS); W.box(BZ.x + 17, Y + s + 1, BZ.z - 4 - s, BZ.x + 17, Y + s + 3, BZ.z - 4 - s, 0); }   // steps up to the warehouse roof
  K.chest(BZ.x + 10, Y, BZ.z - 8, "bazaar_safe1", "discovery"); K.chest(BZ.x + 13, Y, BZ.z + 6, "bazaar_safe2", "discovery"); K.chest(BZ.x - 8, Y, BZ.z - 5, "bazaar_stall", "supply"); K.chest(BZ.x + 14, Y + 6, BZ.z - 9, "bazaar_roof", "discovery", [it(I.ECHO_SHARD, 4)]);
  K.lore(BZ.x - 2, Y, BZ.z - 4, "bazaar_ledger");
  meta.spawns.push({ id: "bazaar_crawlers", kind: "crawler", n: 3, x: BZ.x, y: Y, z: BZ.z, r: 8 });
  district("bazaar", "the Silent Bazaar", BZ.x, BZ.z, 16, { x: BZ.x - 12, y: Y, z: BZ.z });
  // 10. the Sanctuary of Silence (by the avenue): carpeted, walled, safe from anything that hunts by sound
  const SN = { x: 24, z: 34 };
  W.box(SN.x - 6, F, SN.z - 5, SN.x + 6, F, SN.z + 5, B.HUSH_CARPET);
  W.walls(SN.x - 6, Y, SN.z - 5, SN.x + 6, Y + 5, SN.z + 5, B.DARKSLATE_BRICKS); W.box(SN.x - 6, Y + 6, SN.z - 5, SN.x + 6, Y + 6, SN.z + 5, B.DARKSLATE_BRICKS);
  W.box(SN.x - 1, Y, SN.z - 5, SN.x + 1, Y + 2, SN.z - 5, 0);
  W.set(SN.x - 5, Y, SN.z + 4, B.TABLE); W.set(SN.x - 4, Y, SN.z + 4, B.FURNACE); K.beacon(SN.x, Y, SN.z + 2, "sanctuary", "the Sanctuary of Silence");
  K.chest(SN.x + 5, Y, SN.z + 4, "sanctuary_store", "supply", [it(I.GOLDEN_APPLE, 1)]); K.lore(SN.x + 3, Y, SN.z - 3, "sanctuary_plaque");
  for (const [dx, dz] of [[-5, -4], [5, -4]]) W.set(SN.x + dx, Y + 4, SN.z + dz, B.KEEPER_LAMP);
  meta.sanctuary = { x: SN.x, z: SN.z, r: 7 };
  district("sanctuary", "the Sanctuary of Silence", SN.x, SN.z, 7, { x: SN.x, y: Y, z: SN.z - 6 }, { safe: true });
  // 4. the Residential Terraces (south): stepped streets of homes, a schoolroom, a communal kitchen, the evacuation corridor
  const RT = { x: -6, z: 54 };
  for (let row = 0; row < 3; row++) {
    const ty = Y + row * 3, tz = RT.z + 10 - row * 9;
    W.box(RT.x - 22, F, tz - 4, RT.x + 18, ty - 1, tz + 4, B.DARKSLATE_BRICKS);
    for (let i = 0; i < 4; i++) K.house(RT.x - 20 + i * 10, tz - 3, 7, 6, ty, 4, { door: "s", broken: (row + i) % 3 === 0 });
    W.box(RT.x + 19, F, tz - 1, RT.x + 21, ty - 1, tz + 1, B.DARKSLATE_BRICKS);
  }
  for (let s = 0; s < 6; s++) W.box(RT.x + 20, Y + s, RT.z + 10 - s * 3, RT.x + 21, Y + s, RT.z + 8 - s * 3, B.DARKSLATE_BRICKS);   // stairs up the terraces
  K.lore(RT.x - 18, Y + 6, RT.z - 7, "child_hush"); K.chest(RT.x - 7, Y + 3, RT.z + 1, "terrace_family", "discovery", [it(I.GOLDEN_CARROT, 3)]); K.chest(RT.x + 3, Y, RT.z + 9, "terrace_kitchen", "supply");
  // the child's model of the city hints at the secret door behind the kitchen
  W.box(RT.x - 14, Y + 6, RT.z - 8, RT.x - 13, Y + 6, RT.z - 7, B.DARKSLATE_BRICKS); W.set(RT.x - 13, Y + 7, RT.z - 8, B.KEEPER_LAMP);
  W.box(RT.x + 9, Y, RT.z + 13, RT.x + 11, Y + 2, RT.z + 18, 0); W.set(RT.x + 10, Y, RT.z + 18, make(B.CHEST, 0)); meta.chests[k3(RT.x + 10, Y, RT.z + 18)] = { id: "secret_kitchen", tier: "vault", slots: lootFor(r, "vault") };
  meta.secrets.push({ id: "kitchen", name: "the hidden pantry", x: RT.x + 10, y: Y, z: RT.z + 16 });
  district("terraces", "the Residential Terraces", RT.x, RT.z, 20, { x: RT.x + 5, y: Y, z: RT.z + 14 });
  // 5. the Great Archive (west): tall hall of shelves with balconies; a symbol puzzle that gives the Archive Stabilizer
  const AR = { x: -52, z: 6 };
  W.box(AR.x - 12, F, AR.z - 10, AR.x + 12, F, AR.z + 10, B.DARKSLATE_BRICKS);
  W.walls(AR.x - 12, Y, AR.z - 10, AR.x + 12, Y + 14, AR.z + 10, B.DARKSLATE_BRICKS); W.box(AR.x - 12, Y + 15, AR.z - 10, AR.x + 12, Y + 15, AR.z + 10, B.DARKSLATE);
  W.box(AR.x + 12, Y, AR.z - 2, AR.x + 12, Y + 3, AR.z + 2, 0);
  for (let x = AR.x - 10; x <= AR.x + 8; x += 4) for (const z of [AR.z - 8, AR.z + 8]) W.box(x, Y, z, x + 1, Y + 5, z, B.PLANKS);
  W.box(AR.x - 11, Y + 6, AR.z - 9, AR.x + 11, Y + 6, AR.z - 6, B.PLANKS); W.box(AR.x - 11, Y + 6, AR.z + 6, AR.x + 11, Y + 6, AR.z + 9, B.PLANKS);   // reading balconies
  for (let s = 0; s < 6; s++) { W.set(AR.x + 9 - s, Y + s, AR.z - 5, B.PLANKS); W.set(AR.x + 9 - s, Y + s, AR.z + 5, B.PLANKS); }   // stairs to both balconies
  for (let y = Y + 2; y < Y + 14; y += 4) for (const x of [AR.x - 11, AR.x + 11]) W.set(x, y, AR.z, B.KEEPER_LAMP);
  K.lore(AR.x - 8, Y + 7, AR.z - 8, "mara_voice"); K.lore(AR.x + 6, Y + 7, AR.z + 8, "ilyan_worry"); K.mural(AR.x - 12, Y + 1, AR.z + 3, "m_voice");
  const archSw = [[-6, 0], [-2, 0], [2, 0], [6, 0]].map(([dx, dz]) => { W.set(AR.x + dx, Y, AR.z + dz, B.KEEPER_SWITCH); return { x: AR.x + dx, y: Y, z: AR.z + dz }; });
  W.box(AR.x - 3, Y, AR.z - 10, AR.x + 3, Y + 3, AR.z - 10, B.KEEPER_STONE); W.box(AR.x - 2, Y, AR.z - 14, AR.x + 2, Y + 3, AR.z - 11, 0); W.box(AR.x - 3, F, AR.z - 15, AR.x + 3, F, AR.z - 10, B.DARKSLATE_BRICKS);
  K.chest(AR.x, Y, AR.z - 13, "archive_vault", "vault", [it(I.STAB_ARCHIVE, 1)]);
  meta.puzzles.archive = { kind: "order", switches: archSw, symbols: ["wave", "leaf", "sun", "echo"], order: [2, 0, 3, 1], clue: "The catalog machine's dusty card reads: \"Evacuation plan, page order: SUN, then WAVE, then ECHO, then LEAF.\" The four switches under the reading balconies wear those same four symbols.", door: { x0: AR.x - 3, y0: Y, z0: AR.z - 10, x1: AR.x + 3, y1: Y + 3, z1: AR.z - 10 }, reward: "STAB_ARCHIVE" };
  K.chest(AR.x - 9, Y + 7, AR.z + 7, "archive_balcony", "discovery", [it(I.SURVEY_MAP, 1)]);
  district("archive", "the Great Archive", AR.x, AR.z, 13, { x: AR.x + 13, y: Y, z: AR.z });
  // 6. the Resonance Foundry (south-west): pistons of copper, tuning chambers; time three resonators for the Foundry Stabilizer
  const FD = { x: -42, z: 46 };
  W.box(FD.x - 11, F, FD.z - 9, FD.x + 11, F, FD.z + 9, B.KEEPER_COPPER);
  W.walls(FD.x - 11, Y, FD.z - 9, FD.x + 11, Y + 9, FD.z + 9, B.DARKSLATE_BRICKS); W.box(FD.x + 11, Y, FD.z - 2, FD.x + 11, Y + 3, FD.z + 2, 0);
  for (let x = FD.x - 8; x <= FD.x + 6; x += 7) { W.box(x, Y, FD.z - 7, x + 2, Y + 7, FD.z - 5, B.KEEPER_COPPER); W.set(x + 1, Y + 8, FD.z - 6, B.KEEPER_LAMP); }
  const fdRes = [[-6, 3], [0, 5], [6, 3]].map(([dx, dz]) => { W.set(FD.x + dx, Y, FD.z + dz, B.RESONATOR); return { x: FD.x + dx, y: Y, z: FD.z + dz }; });
  W.box(FD.x - 3, Y, FD.z + 9, FD.x + 3, Y + 3, FD.z + 9, B.KEEPER_STONE); W.box(FD.x - 2, Y, FD.z + 10, FD.x + 2, Y + 3, FD.z + 13, 0); W.box(FD.x - 3, F, FD.z + 9, FD.x + 3, F, FD.z + 14, B.KEEPER_COPPER);
  K.chest(FD.x, Y, FD.z + 12, "foundry_vault", "vault", [it(I.STAB_FOUNDRY, 1), it(I.ECHO_COMPASS, 1)]);
  meta.puzzles.foundry = { kind: "timing", resonators: fdRes, window: 6, clue: "A brass plate: \"Tune the chambers together. Ring all three tuning resonators within six heartbeats and the pressure door will open.\"", door: { x0: FD.x - 3, y0: Y, z0: FD.z + 9, x1: FD.x + 3, y1: Y + 3, z1: FD.z + 9 }, reward: "STAB_FOUNDRY" };
  K.lore(FD.x + 8, Y, FD.z - 3, "foundry_log"); K.mural(FD.x - 11, Y + 1, FD.z, "m_hush"); K.chest(FD.x - 9, Y, FD.z + 6, "foundry_tools", "supply", [it(I.IRON_PICK, 1)]);
  meta.spawns.push({ id: "foundry_sentinel", kind: "sentinel_e", n: 1, x: FD.x, y: Y, z: FD.z - 2, r: 4 });
  district("foundry", "the Resonance Foundry", FD.x, FD.z, 12, { x: FD.x + 12, y: Y, z: FD.z });
  // 7. the Sunken Aqueduct (a water channel around the city, with a flooded treasury and the evacuation route)
  for (let a = 0; a < 360; a += 0.6) { const t = a * Math.PI / 180, x = Math.round(Math.cos(t) * 66), z = Math.round(Math.sin(t) * 66); if (Math.abs(a - 45) < 4 || Math.abs(a - 90) < 3) continue; W.box(x - 1, F - 2, z - 1, x + 1, F, z + 1, B.WATER); W.box(x - 1, F - 3, z - 1, x + 1, F - 3, z + 1, B.DARKSLATE_BRICKS); }
  const AQ = { x: -46, z: -46 };
  W.box(AQ.x - 6, F - 6, AQ.z - 6, AQ.x + 6, F, AQ.z + 6, B.WATER); W.box(AQ.x - 7, F - 7, AQ.z - 7, AQ.x + 7, F - 7, AQ.z + 7, B.DARKSLATE_BRICKS);
  W.box(AQ.x - 2, F - 3, AQ.z - 2, AQ.x + 2, F - 1, AQ.z + 2, 0);   // an air pocket in the treasury
  K.chest(AQ.x, F - 3, AQ.z, "flooded_treasury", "vault"); W.set(AQ.x + 2, F - 3, AQ.z + 2, B.KEEPER_LAMP);
  W.box(AQ.x + 7, F, AQ.z - 2, AQ.x + 10, F, AQ.z + 2, B.DARKSLATE_BRICKS); W.set(AQ.x + 9, Y, AQ.z, B.KEEPER_SWITCH);
  meta.puzzles.sluice = { kind: "switch", switches: [{ x: AQ.x + 9, y: Y, z: AQ.z }], drain: { x0: AQ.x - 6, y0: F - 6, z0: AQ.z - 6, x1: AQ.x + 6, y1: F, z1: AQ.z + 6 }, clue: "A sluice lever. A painted arrow shows the water draining toward the city's lowest pipe." };
  K.lore(AQ.x + 8, Y, AQ.z + 3, "tovin_evac"); W.set(AQ.x + 8, Y, AQ.z - 3, B.LORE_TABLET); meta.lore[k3(AQ.x + 8, Y, AQ.z - 3)] = "mem_evac";
  district("aqueduct", "the Sunken Aqueduct", AQ.x, AQ.z, 9, { x: AQ.x + 9, y: Y, z: AQ.z });
  // 8. the Watcher Bridges: high bridges between towers across the north of the city, with a lower recovery walk
  const towers = [{ x: 38, z: -36 }, { x: 14, z: -58 }, { x: -18, z: -60 }, { x: -40, z: -34 }];
  for (let i = 0; i < towers.length - 1; i++) K.bridge(towers[i], towers[i + 1], Y + 21, 1);   // bridges first, so the towers' stair hatches stay open
  for (const t of towers) K.stairTower(t.x, t.z, Y, 22);
  K.lore(towers[1].x + 2, Y + 22, towers[1].z, "council_order"); K.chest(towers[2].x - 2, Y + 22, towers[2].z, "bridge_cache", "discovery");
  meta.spawns.push({ id: "bridge_stalker", kind: "stalker", n: 1, x: 0, y: Y, z: -48, r: 14 });
  district("bridges", "the Watcher Bridges", 0, -50, 22, { x: towers[0].x, y: Y, z: towers[0].z + 3 });
  // 9. the Memory Gardens (north-east): pale roots, dormant light trees, three switches (water, light, warmth)
  const MG = { x: 50, z: -18 };
  W.box(MG.x - 10, F, MG.z - 9, MG.x + 10, F, MG.z + 9, B.CAVE_MOSS);
  for (let k = 0; k < 7; k++) { const x = MG.x - 8 + Math.floor(r() * 16), z = MG.z - 7 + Math.floor(r() * 14); for (let y = Y; y < Y + 5; y++) W.set(x, y, z, B.ROOTWOOD); W.box(x - 1, Y + 5, z - 1, x + 1, Y + 6, z + 1, B.RESONANT_GLASS); }
  W.walls(MG.x - 10, Y, MG.z - 9, MG.x + 10, Y + 1, MG.z + 9, B.RESONANT_GLASS); W.box(MG.x - 10, Y, MG.z - 1, MG.x - 10, Y + 1, MG.z + 1, 0);
  const gSw = [[-6, 6], [0, 7], [6, 6]].map(([dx, dz]) => { W.set(MG.x + dx, Y, MG.z + dz, B.KEEPER_SWITCH); return { x: MG.x + dx, y: Y, z: MG.z + dz }; });
  W.box(MG.x + 4, Y, MG.z - 8, MG.x + 8, Y + 3, MG.z - 5, B.RESONANT_GLASS); W.box(MG.x + 5, Y, MG.z - 7, MG.x + 7, Y + 2, MG.z - 6, 0);
  K.chest(MG.x + 6, Y, MG.z - 7, "garden_vault", "vault", [it(I.STAB_GARDEN, 1)]);
  meta.puzzles.garden = { kind: "all", switches: gSw, labels: ["WATER", "LIGHT", "WARMTH"], clue: "The gardener's chalkboard: wake WATER, LIGHT, and WARMTH, and the trees will open their glass case.", door: { x0: MG.x + 4, y0: Y, z0: MG.z - 8, x1: MG.x + 8, y1: Y + 3, z1: MG.z - 5 }, reward: "STAB_GARDEN" };
  K.lore(MG.x - 7, Y, MG.z - 6, "garden_keeper"); K.lore(MG.x - 3, Y, MG.z - 7, "mara_crown"); K.chest(MG.x - 8, Y, MG.z + 7, "garden_seeds", "supply", [it(I.SEEDS, 8), it(I.BERRIES, 6)]);
  district("gardens", "the Memory Gardens", MG.x, MG.z, 11, { x: MG.x - 11, y: Y, z: MG.z });
  // 11. the Warden's Citadel (centre): fortified ring with three acoustic pylons, a prep room, and the arena
  const CT = { x: 0, z: -14 }, CR = 16;
  for (let a = 0; a < 360; a += 1) { const t = a * Math.PI / 180, x = Math.round(CT.x + Math.cos(t) * CR), z = Math.round(CT.z + Math.sin(t) * CR); if (Math.abs(a - 90) < 6) continue; W.box(x, Y, z, x, Y + 9, z, B.DARKSLATE_BRICKS); }
  W.box(CT.x - CR + 1, F, CT.z - CR + 1, CT.x + CR - 1, F, CT.z + CR - 1, (x, y, z) => Math.hypot(x - CT.x, z - CT.z) < CR ? B.DARKSLATE_BRICKS : undefined);
  const pylons = [0, 120, 240].map(a => { const t = (a - 90) * Math.PI / 180, x = Math.round(CT.x + Math.cos(t) * 10), z = Math.round(CT.z + Math.sin(t) * 10); W.box(x, Y, z, x, Y + 3, z, B.KEEPER_COPPER); W.set(x, Y + 4, z, B.RESONATOR); return { x, y: Y + 4, z, standX: x, standZ: z + (z < CT.z ? 2 : -2) }; });
  for (const [dx, dz] of [[-6, 5], [6, 5], [-7, -4], [7, -4], [0, -8]]) { W.box(CT.x + dx, Y, CT.z + dz, CT.x + dx + 1, Y + 3, CT.z + dz, B.HUSH_CARPET); }   // sound-dampening cover blocks
  // the prep room outside the threshold (south), with a beacon and supplies
  W.box(CT.x - 4, F, CT.z + CR + 1, CT.x + 4, F, CT.z + CR + 8, B.DARKSLATE_BRICKS); K.beacon(CT.x - 3, Y, CT.z + CR + 6, "citadel", "the Citadel threshold"); K.chest(CT.x + 3, Y, CT.z + CR + 6, "citadel_prep", "supply", [it(I.GOLDEN_APPLE, 2), it(I.ECHO_SHARD, 6), it(I.ARROW, 24)]);
  K.lore(CT.x + 3, Y, CT.z + CR + 3, "warden_order");
  meta.citadel = { x: CT.x + 0.5, y: Y, z: CT.z + 0.5, r: CR, pylons, threshold: { x: CT.x, z: CT.z + CR }, emerge: { x: CT.x + 0.5, y: Y, z: CT.z - 3.5 } };
  district("citadel", "the Warden's Citadel", CT.x, CT.z, CR, { x: CT.x, y: Y, z: CT.z + CR + 2 });
  // 12. the First Gate (north): elevated processional, statues, four sockets, the gate itself, an archive below
  const FG = { x: 0, z: -72 }, GY = Y + 6;
  W.box(FG.x - 12, F, FG.z - 4, FG.x + 12, GY - 1, FG.z + 12, B.DARKSLATE_BRICKS);
  for (let s = 0; s < 6; s++) W.box(FG.x - 3, F + s + 1, FG.z + 13 + (5 - s) * 2, FG.x + 3, F + s + 1, FG.z + 14 + (5 - s) * 2, B.DARKSLATE_BRICKS);   // the processional stairs
  W.box(FG.x - 3, F, FG.z + 13, FG.x + 3, F, FG.z + 26, B.DARKSLATE_BRICKS);
  for (const sx of [-6, 6]) for (let s = 0; s < 3; s++) { const z = FG.z + 14 + s * 4; W.box(FG.x + sx, F + 1, z, FG.x + sx, F + 4, z, B.KEEPER_STONE); W.set(FG.x + sx, F + 5, z, B.KEEPER_LAMP); }   // statues of the engineers
  // the gate: a frame 13 wide and 16 tall, its veil, and four sockets on pedestals in front
  for (let x = FG.x - 7; x <= FG.x + 7; x++) for (let y = GY; y <= GY + 17; y++) { const edge = Math.abs(x - FG.x) >= 6 || y === GY || y >= GY + 16; W.set(x, y, FG.z - 2, edge ? B.GATE_FRAME : B.GATE_VEIL); }
  const sockets = [["sea", -6], ["green", -2], ["sun", 2], ["echo", 6]].map(([slot, dx]) => { W.set(FG.x + dx, GY, FG.z + 4, B.KEEPER_STONE); W.set(FG.x + dx, GY + 1, FG.z + 4, B.GATE_SOCKET); return { slot, x: FG.x + dx, y: GY + 1, z: FG.z + 4 }; });
  meta.gate = { x: FG.x, y: GY, z: FG.z - 2, veil: { x0: FG.x - 5, y0: GY + 1, x1: FG.x + 5, y1: GY + 15, z: FG.z - 2 }, sockets, stand: { x: FG.x + 0.5, y: GY, z: FG.z + 8.5 } };
  K.mural(FG.x - 10, GY, FG.z + 8, "m_sealing"); K.beacon(FG.x + 9, GY, FG.z + 10, "gate", "the First Gate");
  // the archive beneath the platform
  W.box(FG.x - 6, F + 1, FG.z + 2, FG.x + 6, F + 4, FG.z + 10, 0); W.box(FG.x + 7, F + 1, FG.z + 5, FG.x + 12, F + 3, FG.z + 7, 0);
  K.lore(FG.x - 4, F + 1, FG.z + 4, "last_procedure"); W.set(FG.x + 4, F + 1, FG.z + 4, B.LORE_TABLET); meta.lore[k3(FG.x + 4, F + 1, FG.z + 4)] = "mem_control";
  K.chest(FG.x, F + 1, FG.z + 9, "gate_archive", "discovery"); W.set(FG.x - 5, F + 3, FG.z + 9, B.KEEPER_LAMP); W.set(FG.x + 5, F + 3, FG.z + 9, B.KEEPER_LAMP);
  district("firstgate", "the First Gate", FG.x, FG.z, 13, { x: FG.x, y: F + 1, z: FG.z + 24 });
  // secrets: the engineer's workshop, a rail depot, an observatory shaft, an emergency vault, and the quiet apartment
  const sec = (id, name, x, z, build) => { build(x, z); meta.secrets.push({ id, name, x, y: Y, z }); };
  sec("workshop", "the Chief Engineer's workshop", -70, -12, (x, z) => { K.house(x - 4, z - 3, 8, 7, Y, 4, { door: "e" }); K.chest(x - 2, Y, z, "engineer_workshop", "vault", [it(I.SKY_PICK, 1)]); });
  sec("depot", "a concealed rail depot", 70, -48, (x, z) => { W.box(x - 3, Y, z - 6, x + 3, Y + 3, z + 6, 0); W.box(x - 3, F, z - 6, x + 3, F, z + 6, B.KEEPER_COPPER); K.chest(x, Y, z + 5, "rail_depot", "discovery", [it(I.IRON_INGOT, 8)]); });
  sec("observatory", "a forgotten observatory shaft", -26, 80, (x, z) => { const top = K.stairTower(x, z, Y, 26).top; K.chest(top.x + 1, top.y, top.z + 1, "observatory", "discovery", [it(I.LUMEN_SHARD, 6)]); });
  sec("vault", "the sealed emergency vault", 8, 62, (x, z) => { W.walls(x - 3, Y, z - 3, x + 3, Y + 3, z + 3, B.KEEPER_COPPER); W.box(x - 3, Y, z, x - 3, Y + 1, z, 0); K.chest(x, Y, z, "emergency_vault", "vault"); });
  sec("apartment", "a quiet apartment", -30, 64, (x, z) => { K.house(x - 3, z - 3, 7, 6, Y, 4, { door: "n" }); W.set(x, Y, z, B.LORE_TABLET); meta.lore[k3(x, Y, z)] = "mem_apartment"; });
  // more caches along the streets and in the side houses
  const streetCaches = [[30, -2], [-20, 24], [-28, -30], [18, -40], [-60, 30], [40, 44], [-8, -38], [62, 20]];
  streetCaches.forEach(([x, z], i) => { K.house(x - 3, z - 3, 7, 6, Y, 4, { door: ["n", "s", "e", "w"][i % 4], broken: i % 2 === 0 }); K.chest(x, Y, z, "street_" + i, i % 3 === 0 ? "discovery" : "supply"); });
  // hushmoss and detection nodes spread toward the citadel and gate (the corruption)
  for (let k = 0; k < 26; k++) { const a = r() * Math.PI * 2, d = 18 + r() * 40, x = Math.round(Math.cos(a) * d), z = Math.round(-20 + Math.sin(a) * d * 0.8); if (W.id(x, F, z) === B.DARKSLATE || W.id(x, F, z) === B.HUSHMOSS) { W.set(x, F, z, B.HUSH_NODE); meta.nodes.push({ x, y: F, z }); } }
  meta.spawns.push({ id: "streets_crawlers", kind: "crawler", n: 2, x: -20, y: Y, z: 20, r: 12 }, { id: "gate_motes", kind: "mote", n: 2, x: 0, y: Y + 8, z: -50, r: 6 }, { id: "archive_guardian", kind: "guardian", n: 1, x: AR.x, y: Y, z: AR.z + 4, r: 2, dormant: true });
  // a lift back up to the Surface from the camp area (an earned shortcut)
  W.set(CAMP.x + 6, Y, CAMP.z - 2, B.DEEP_LIFT); meta.cityLift = { x: CAMP.x + 6, y: Y, z: CAMP.z - 2 };
  meta.nodes = meta.nodes.filter(q => W.id(q.x, q.y, q.z) === B.HUSH_NODE);   // drop any node a later building covered up
  return { grid: W, meta };
}

// =====================================================================
// THE ECHO EXPANSE: floating islands in a blue-black sky
// =====================================================================
export const EXPANSE = { min: -96, size: 192 };
export function buildExpanse() {
  const W = new Grid(EXPANSE.min, EXPANSE.min, EXPANSE.size, EXPANSE.size), n = new Noise(7781), r = seeded(77);
  const meta = { version: LOST_VERSION, id: "expanse-v1", kind: "expanse", lore: {}, chests: {}, checkpoints: [], districts: [], nodes: [], puzzles: {}, secrets: [], spawns: [], pulse: [], anchors: [] };
  const K = makeKit(W, meta, r);
  const island = (cx, cy, cz, rad, opts = {}) => {
    for (let dz = -rad - 2; dz <= rad + 2; dz++) for (let dx = -rad - 2; dx <= rad + 2; dx++) {
      const d = Math.hypot(dx, dz) + n.n2((cx + dx) / 7, (cz + dz) / 7) * 1.6;
      if (d > rad) continue;
      const depth = Math.round((1 - d / rad) * (opts.deep || rad * 0.8)) + 1;
      for (let y = cy - depth; y <= cy; y++) W.set(cx + dx, y, cz + dz, y === cy ? (opts.top || B.LUMEN_GRASS) : B.ECHOSTONE);
    }
  };
  const bridge = (a, b, ya, yb, mat = B.ECHOSTONE) => K.bridge({ ...a, y: ya }, { ...b, y: yb ?? ya }, ya, 1, mat, true);   // ya/yb: the island tops at each end
  // 1. the Arrival Sanctum (south): return gate, beacon, supplies, realm map
  const AS = { x: 0, z: 62, y: 40 };
  island(AS.x, AS.y, AS.z, 14);
  for (let x = -5; x <= 5; x++) for (let y = 1; y <= 12; y++) { const edge = Math.abs(x) >= 4 || y === 1 || y >= 11; W.set(AS.x + x, AS.y + y, AS.z + 8, edge ? B.GATE_FRAME : make(B.GATE_VEIL, 1)); }
  meta.returnVeil = { x0: AS.x - 3, y0: AS.y + 2, x1: AS.x + 3, y1: AS.y + 10, z: AS.z + 8 };
  meta.arrival = { x: AS.x + 0.5, y: AS.y + 1, z: AS.z + 4.5 };
  K.beacon(AS.x - 6, AS.y + 1, AS.z + 2, "sanctum", "the Arrival Sanctum"); K.chest(AS.x + 6, AS.y + 1, AS.z + 2, "sanctum_cache", "supply", [it(I.GOLDEN_APPLE, 1)]);
  K.lore(AS.x + 3, AS.y + 1, AS.z - 2, "expanse_camp"); K.chest(AS.x - 8, AS.y + 1, AS.z - 4, "scout_camp", "discovery");
  W.box(AS.x - 10, AS.y + 1, AS.z - 6, AS.x - 8, AS.y + 2, AS.z - 4, (x, y) => y === AS.y + 2 ? B.WOOL : (x === AS.x - 9 ? 0 : B.WOOL));
  // 2. the Echo Fields: shelves linked by bridges; some bridge pieces only solid on the beat (always a slower solid detour)
  const EF = [{ x: 0, z: 36, y: 38 }, { x: 22, z: 26, y: 40 }, { x: 34, z: 6, y: 42 }, { x: -18, z: 24, y: 37 }];
  for (const s of EF) island(s.x, s.y, s.z, 8);
  bridge({ x: AS.x, z: AS.z - 12 }, { x: EF[0].x, z: EF[0].z + 7 }, 40, 38);
  const pulseBridge = (a, b, y, phase) => { const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z)); for (let s = 0; s <= steps; s++) { const x = Math.round(a.x + (b.x - a.x) * s / steps), z = Math.round(a.z + (b.z - a.z) * s / steps); for (const w of [-1, 0, 1]) { const px = x + (Math.abs(b.z - a.z) > Math.abs(b.x - a.x) ? w : 0), pz = z + (Math.abs(b.z - a.z) > Math.abs(b.x - a.x) ? 0 : w); W.set(px, y, pz, B.RESONANT_GLASS); meta.pulse.push({ x: px, y, z: pz, phase }); } } };
  pulseBridge({ x: EF[0].x + 7, z: EF[0].z - 3 }, { x: EF[1].x - 7, z: EF[1].z + 2 }, 38, 0);
  bridge({ x: EF[0].x - 7, z: EF[0].z - 4 }, { x: EF[3].x + 6, z: EF[3].z + 3 }, 38, 37); bridge({ x: EF[3].x + 6, z: EF[3].z - 4 }, { x: EF[1].x - 6, z: EF[1].z - 4 }, 37, 40);   // the slower solid detour
  bridge({ x: EF[1].x + 5, z: EF[1].z - 6 }, { x: EF[2].x - 4, z: EF[2].z + 6 }, 40, 42);
  K.chest(EF[1].x + 3, 41, EF[1].z + 2, "fields_cache", "supply"); K.chest(EF[3].x - 3, 38, EF[3].z - 2, "fields_post", "discovery");
  for (const s of EF) W.set(s.x, s.y + 1, s.z, B.KEEPER_LAMP);
  meta.spawns.push({ id: "fields_knights", kind: "knight", n: 2, x: EF[1].x, y: EF[1].y + 1, z: EF[1].z, r: 4 });
  // 3. the Inverted Ruins (west): Keeper towers hanging upside down beneath an island; a switch swaps two bridges
  const IR = { x: -46, z: 4, y: 44 };
  island(IR.x, IR.y, IR.z, 12);
  for (const [dx, dz] of [[-6, -4], [5, 3], [-2, 6]]) for (let y = IR.y - 14; y < IR.y - 4; y++) { const hh = IR.y - 4 - y; for (let ax = -2; ax <= 2; ax++) for (let az = -2; az <= 2; az++) if ((Math.abs(ax) === 2 || Math.abs(az) === 2) && hh > 0) W.set(IR.x + dx + ax, y, IR.z + dz + az, B.DARKSLATE_BRICKS); W.set(IR.x + dx, IR.y - 15, IR.z + dz, B.KEEPER_LAMP); }
  for (const [dx, dz] of [[4, -6], [-8, 5]]) K.house(IR.x + dx - 3, IR.z + dz - 3, 7, 6, IR.y + 1, 4, { door: "e", broken: true });
  bridge({ x: EF[3].x - 7, z: EF[3].z - 2 }, { x: IR.x + 11, z: IR.z + 4 }, 37, 44);
  const RS = { x: IR.x, z: IR.z - 26, y: 44 }; island(RS.x, RS.y, RS.z, 7);
  const setA = [], setB = [];
  for (let s = 0; s <= 12; s++) { for (const w of [-1, 0, 1]) { setA.push({ x: IR.x + w, y: 44, z: IR.z - 12 - s }); setB.push({ x: IR.x + 4 + w, y: 44, z: IR.z - 12 - s }); } }
  setB.length -= 12;   // bridge B stops short of the far island; bridge A reaches it
  W.set(IR.x + 2, IR.y + 1, IR.z - 9, B.KEEPER_SWITCH);
  meta.puzzles.ruins = { kind: "swap", switch: { x: IR.x + 2, y: IR.y + 1, z: IR.z - 9 }, setA, setB, clue: "The bridges trade places when the switch is pulled. One of them reaches the far island; the other only looks like it does." };
  // the far ruin island holds a shortcut lever and a secret cache
  K.chest(RS.x, RS.y + 1, RS.z, "ruin_vault", "vault"); meta.secrets.push({ id: "ruinvault", name: "the hanging vault", x: RS.x, y: RS.y + 1, z: RS.z });
  for (const c of setB) W.set(c.x, c.y, c.z, B.RESONANT_GLASS);   // the map starts with the short bridge out
  K.lore(IR.x - 4, IR.y + 1, IR.z + 2, "forge_plaque");
  meta.spawns.push({ id: "ruins_scouts", kind: "scout", n: 2, x: IR.x, y: IR.y + 6, z: IR.z, r: 6 });
  // 4. the Resonance Forge (east): three anchors on islands around a rest platform
  const FG = { x: 48, z: -14, y: 42 };
  island(FG.x, FG.y, FG.z, 9); K.beacon(FG.x, FG.y + 1, FG.z + 3, "forge", "the Resonance Forge"); K.chest(FG.x - 4, FG.y + 1, FG.z + 4, "forge_rest", "supply", [it(I.GOLDEN_APPLE, 1)]);
  bridge({ x: EF[2].x + 3, z: EF[2].z - 7 }, { x: FG.x - 4, z: FG.z + 8 }, 42, 42);
  const anchors = [{ id: "trial", kind: "combat", x: FG.x + 22, z: FG.z - 2 }, { id: "puzzle", kind: "puzzle", x: FG.x + 6, z: FG.z - 26 }, { id: "climb", kind: "climb", x: FG.x - 14, z: FG.z - 22 }];
  for (const a of anchors) {
    island(a.x, FG.y, a.z, 7); bridge({ x: FG.x + Math.sign(a.x - FG.x) * 6, z: FG.z + Math.sign(a.z - FG.z) * 6 }, { x: a.x - Math.sign(a.x - FG.x) * 5, z: a.z - Math.sign(a.z - FG.z) * 5 }, FG.y, FG.y);
    const ay = a.kind === "climb" ? FG.y + 13 : FG.y + 1;
    if (a.kind === "climb") {   // a tower climbed by steps, with a platform on top
      for (let y = FG.y + 1; y <= FG.y + 11; y++) { const [dx, dz] = [[-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [2, -1], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [-1, 2], [-2, 2], [-2, 1], [-2, 0], [-2, -1]][(y - FG.y - 1) % 16]; W.set(a.x + dx, y, a.z + dz, B.ECHOSTONE); }
      W.box(a.x - 1, FG.y + 12, a.z - 1, a.x + 1, FG.y + 12, a.z + 1, B.ECHOSTONE);
    }
    W.set(a.x, ay, a.z, B.ANCHOR_STATION); meta.anchors.push({ ...a, y: ay });
    if (a.kind === "puzzle") { const sw = [[-3, 2], [0, 3], [3, 2]].map(([dx, dz]) => { W.set(a.x + dx, FG.y + 1, a.z + dz, B.KEEPER_SWITCH); return { x: a.x + dx, y: FG.y + 1, z: a.z + dz }; }); meta.puzzles.forgePuzzle = { kind: "order", switches: sw, symbols: ["wave", "leaf", "sun"], order: [1, 2, 0], clue: "Carved under the anchor: \"Green wakes first, then the sun, then the sea.\"" }; }
    K.chest(a.x + 3, FG.y + 1, a.z - 3, "anchor_" + a.id, "discovery");
  }
  // 5. the Crownless Citadel (north): final checkpoint, lore chamber, and the arena island with three anchor stations
  const CC = { x: 0, z: -58, y: 40 };
  island(CC.x, CC.y, CC.z, 20, { deep: 14 });
  W.box(CC.x - 2, CC.y + 1, CC.z + 20, CC.x + 2, CC.y + 1, CC.z + 28, B.ECHOSTONE);
  island(CC.x, CC.y, CC.z + 32, 6); K.beacon(CC.x - 3, CC.y + 1, CC.z + 33, "crownless", "the Crownless Citadel"); K.chest(CC.x + 3, CC.y + 1, CC.z + 33, "citadel_supplies", "supply", [it(I.GOLDEN_APPLE, 2), it(I.ARROW, 32), it(I.TOTEM, 1)]);
  bridge({ x: FG.x - 8, z: FG.z - 6 }, { x: CC.x + 5, z: CC.z + 33 }, 42, 40); bridge({ x: EF[2].x - 2, z: EF[2].z - 7 }, { x: CC.x + 4, z: CC.z + 30 }, 42, 40);
  W.box(CC.x - 3, CC.y + 1, CC.z + 36, CC.x + 3, CC.y + 4, CC.z + 39, (x, y, z) => x === CC.x - 3 || x === CC.x + 3 || z === CC.z + 39 || y === CC.y + 4 ? B.DARKSLATE_BRICKS : 0);
  K.lore(CC.x, CC.y + 1, CC.z + 38, "citadel_answer");
  for (let a = 0; a < 360; a += 30) { const t = a * Math.PI / 180, x = Math.round(CC.x + Math.cos(t) * 18), z = Math.round(CC.z + Math.sin(t) * 18); if (a === 90) continue; W.box(x, CC.y + 1, z, x, CC.y + 10 + (a % 60 ? 4 : 0), z, B.DARKSLATE_BRICKS); W.set(x, CC.y + 11 + (a % 60 ? 4 : 0), z, B.KEEPER_LAMP); }
  const stations = [210, 330, 90].map((a, i) => { const t = a * Math.PI / 180, x = Math.round(CC.x + Math.cos(t) * 12), z = Math.round(CC.z + Math.sin(t) * 12); W.set(x, CC.y + 1, z, B.ANCHOR_STATION); return { i, x, y: CC.y + 1, z }; });
  for (const [dx, dz] of [[-7, 4], [7, 4], [0, -8]]) W.box(CC.x + dx, CC.y + 1, CC.z + dz, CC.x + dx + 1, CC.y + 3, CC.z + dz, B.ECHOSTONE);   // cover
  meta.arena = { x: CC.x + 0.5, y: CC.y + 1, z: CC.z + 0.5, r: 19, stations, threshold: { x: CC.x, z: CC.z + 20 } };
  // optional: the mirror lake and the observatory with a view of somewhere farther away
  const ML = { x: -40, z: 50, y: 36 }; island(ML.x, ML.y, ML.z, 10); W.box(ML.x - 5, ML.y, ML.z - 5, ML.x + 5, ML.y, ML.z + 5, B.WATER); K.chest(ML.x + 7, ML.y + 1, ML.z, "mirror_lake", "discovery");
  bridge({ x: AS.x - 12, z: AS.z - 4 }, { x: ML.x + 9, z: ML.z + 3 }, 40, 36);
  const OB = { x: 70, z: 40, y: 46 }; island(OB.x, OB.y, OB.z, 6); K.tower(OB.x, OB.z, OB.y + 1, 2, 10); K.chest(OB.x, OB.y + 1, OB.z + 3, "observatory_expanse", "discovery");
  bridge({ x: EF[1].x + 7, z: EF[1].z + 3 }, { x: OB.x - 5, z: OB.z - 3 }, 40, 46);
  meta.secrets.push({ id: "mirror", name: "the mirror lake", x: ML.x, y: ML.y + 1, z: ML.z }, { id: "observatory", name: "the far observatory", x: OB.x, y: OB.y + 1, z: OB.z });
  meta.spawns.push({ id: "forge_burrowers", kind: "burrower", n: 2, x: FG.x, y: FG.y + 1, z: FG.z, r: 6 });
  return { grid: W, meta };
}

// =====================================================================
// SURFACE: the Keeper excavation site (the way down). Stamped into unexplored land by the game.
// =====================================================================
export function buildSurface() {
  const S = 32, W = new Grid(0, 0, S * 4, S, KEEP), r = seeded(31), meta = { version: LOST_VERSION, id: "surface-v1", kind: "stamps", lore: {}, chests: {}, checkpoints: [], stamps: {} };
  const K = makeKit(W, meta, r), G0 = 36, c = 16;
  // a round dig site: levelled ground, a timber crane, tents, an obelisk you can see from afar, and the lift
  for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - c + 0.5, z - c + 0.5); if (d > 15) continue;
    for (let y = 22; y < HEIGHT; y++) W.set(x, y, z, y < G0 - 3 ? B.STONE : y < G0 ? B.DIRT : y === G0 ? (d < 6 ? B.GRAVEL : B.GRASS) : 0);
  }
  W.box(c - 2, G0 - 6, c - 2, c + 1, G0, c + 1, 0); W.box(c - 2, G0 - 7, c - 2, c + 1, G0 - 7, c + 1, B.DARKSLATE_BRICKS);
  W.set(c - 1, G0 - 6, c - 1, B.DEEP_LIFT); for (let y = G0 - 6; y <= G0; y++) W.set(c + 1, y, c + 1, B.COBBLE);   // steps down to the lift
  for (let y = G0 - 5; y <= G0; y++) W.set(c + 1 - Math.floor((y - (G0 - 6)) / 3), y, c - 2 + 0, 0);
  for (let i = 0; i < 6; i++) W.set(c + 1, G0 - 5 + i, c - 2 + Math.min(3, i), B.DARKSLATE_BRICKS);
  for (let y = G0 + 1; y <= G0 + 18; y++) W.set(c + 9, y, c - 9, y > G0 + 15 ? B.KEEPER_LAMP : B.DARKSLATE_BRICKS);   // the obelisk
  for (let y = G0 + 1; y <= G0 + 10; y++) W.set(c - 8, y, c - 6, B.LOG); for (let x = c - 8; x <= c - 1; x++) W.set(x, G0 + 10, c - 6, B.LOG);   // the crane
  W.box(c + 4, G0 + 1, c + 4, c + 7, G0 + 2, c + 6, (x, y) => y === G0 + 2 ? B.WOOL : (x === c + 5 ? 0 : B.WOOL));
  K.chest(c + 6, G0 + 1, c + 5, "dig_supplies", "supply", [it(I.ECHO_SHARD, 4), it(B.TORCH, 16)]);
  W.set(c - 4, G0 + 1, c + 4, B.LORE_TABLET); meta.lore[k3(c - 4, G0 + 1, c + 4)] = "dig_sign";
  meta.stamps.excavation = { ox: 0, blend: { g: G0, r0: 13, r1: 16, top: B.GRASS, under: B.DIRT }, size: S, ground: G0, lift: { x: c - 1, y: G0 - 6, z: c - 1 }, arrive: { x: c - 1, y: G0 - 5, z: c }, sign: { x: c - 4, y: G0 + 1, z: c + 4 } };
  buildTempleEntrances(W, meta, K);
  return { grid: W, meta };
}
// The three temple entrances, side by side in the same stamp sheet (each 32 × 32, KEEP around the edges).
function buildTempleEntrances(W, meta, K) {
  const S = 32, c = 16, round = (ox, rad, fn) => { for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) { const d = Math.hypot(x - c + 0.5, z - c + 0.5); if (d <= rad) fn(ox + x, z, d); } };
  // the sea: a lighthouse on a stone pier far out on the water
  let ox = 32;
  round(ox, 8, (x, z, d) => { for (let y = 4; y < HEIGHT; y++) W.set(x, y, z, y <= 30 ? (d <= 5 ? B.TIDE_BRICKS : KEEP) : y === 31 ? (d <= 7.5 ? B.TIDE_BRICKS : 0) : 0); });
  round(ox, 7.5, (x, z, d) => { if (d > 6.5) W.set(x, 32, z, Math.floor(x + z) % 4 ? B.TIDE_BRICKS : B.TIDE_LAMP); });
  W.box(ox + c - 1, 32, c + 6, ox + c + 1, 32, c + 8, 0);   // a gap in the rail for boats and swimmers (steps below)
  for (let k = 0; k < 3; k++) W.box(ox + c - 1, 29 + k, c + 9 - k, ox + c + 1, 29 + k, c + 9 - k, B.TIDE_BRICKS);
  W.box(ox + c - 2, 32, c - 2, ox + c + 2, 44, c + 2, B.TIDE_BRICKS); W.box(ox + c - 1, 32, c - 1, ox + c + 1, 43, c + 1, 0); W.set(ox + c, 45, c, B.TIDE_LAMP);
  W.box(ox + c, 32, c + 2, ox + c, 33, c + 2, 0); W.set(ox + c, 32, c - 1, B.DEEP_LIFT);
  W.set(ox + c - 4, 32, c + 3, B.LORE_TABLET); meta.lore[k3(ox + c - 4, 32, c + 3)] = "sea_sign";
  K.chest(ox + c + 4, 32, c + 3, "sea_pier", "supply", [it(I.COOKED_MINNOW, 6)]);
  meta.stamps.sea = { ox, size: S, ground: 31, lift: { x: c, y: 32, z: c - 1 }, arrive: { x: c, y: 32, z: c + 1 } };
  // the jungle: an overgrown step temple in a forest clearing
  ox = 64; const G = 38;
  round(ox, 14, (x, z, d) => { for (let y = 22; y < HEIGHT; y++) W.set(x, y, z, y < G - 2 ? B.STONE : y < G ? B.DIRT : y === G ? B.GRASS : 0); });
  for (let y = G + 1; y <= G + 9; y++) { const h = 6 - Math.floor((y - G - 1) / 3) * 2; W.box(ox + c - h, y, c - h, ox + c + h, y, c + h, B.VINE_BRICKS); }
  for (let k = 0; k <= 9; k++) { const y = G + k, z = c + 9 - k; W.box(ox + c - 1, G, z, ox + c + 1, y, z, B.VINE_BRICKS); W.box(ox + c - 1, y + 1, z, ox + c + 1, y + 3, z, 0); }
  for (let x = c - 6; x <= c + 6; x += 3) for (const z of [c - 7, c + 7]) if (x < c - 1 || x > c + 1) for (let y = G + 1; y <= G + 3; y++) W.set(ox + x, y, z, B.VINES);
  W.set(ox + c, G + 10, c - 1, B.DEEP_LIFT);
  W.set(ox + c - 4, G + 1, c + 11, B.LORE_TABLET); meta.lore[k3(ox + c - 4, G + 1, c + 11)] = "jungle_sign";
  K.chest(ox + c + 4, G + 1, c + 11, "jungle_camp", "supply");
  meta.stamps.jungle = { ox, blend: { g: G, r0: 13, r1: 17, top: B.GRASS, under: B.DIRT }, size: S, ground: G, lift: { x: c, y: G + 10, z: c - 1 }, arrive: { x: c, y: G + 10, z: c } };
  // the desert: the tip of a buried pyramid with a doorway into a small lift chamber
  ox = 96; const D = 36;
  round(ox, 14, (x, z, d) => { for (let y = 22; y < HEIGHT; y++) W.set(x, y, z, y < D - 3 ? B.SANDSTONE : y <= D ? B.SAND : 0); });
  for (let y = D + 1; y <= D + 8; y++) { const h = 8 - (y - D - 1); W.box(ox + c - h, y, c - h, ox + c + h, y, c + h, B.SUN_BRICKS); }
  for (const [x, z] of [[c - 4, c + 5], [c + 4, c + 5]]) W.set(ox + x, D + 3, z, B.SUN_GLYPH);
  W.box(ox + c - 1, D + 1, c - 1, ox + c + 1, D + 3, c + 1, 0); W.box(ox + c, D + 1, c + 2, ox + c, D + 2, c + 9, 0);
  W.set(ox + c, D + 1, c - 1, B.DEEP_LIFT); W.set(ox + c - 1, D + 3, c - 1, B.SHINESTONE);
  W.set(ox + c - 3, D + 1, c + 11, B.LORE_TABLET); meta.lore[k3(ox + c - 3, D + 1, c + 11)] = "desert_sign";
  K.chest(ox + c + 3, D + 1, c + 11, "desert_camp", "supply", [it(I.BREAD, 6)]);
  meta.stamps.desert = { ox, blend: { g: D, r0: 13, r1: 17, top: B.SAND, under: B.SAND }, size: S, ground: D, lift: { x: c, y: D + 1, z: c - 1 }, arrive: { x: c, y: D + 1, z: c + 1 } };
}
export const EXTRA_LORE = { dig_sign: { step: 0, title: "Survey Sign", by: "Rosalind Pell's expedition", where: "the excavation site", text: "KEEPER EXCAVATION. A working lift goes down to the deep caverns and the lost city of Echohold.\n\nPack food, torches, and something soft to walk on. Leave the lamps lit." } };

// ---------- build checks ----------
export function validateLost(which, W, meta) {
  const report = [], ok = (pass, what) => report.push((pass ? "PASS " : "FAIL ") + what);
  const SOLIDS = new Set([0, B.WATER, B.TORCH, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.DOOR, B.LAVA, B.GATE_VEIL, B.LUMEN_CRYSTAL]);
  const solid = id => !SOLIDS.has(id);
  const hazard = id => id === B.LAVA;
  // puzzle doors count as open for the "can you reach it" check (opening them is part of the walk)
  const doors = Object.values(meta.puzzles || {}).filter(p => p.door);
  const view = { inside: (x, y, z) => W.inside(x, y, z), id: (x, y, z) => { for (const p of doors) { const d = p.door; if (x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1 && z >= d.z0 && z <= d.z1) return 0; } if (which === "expanse" && meta.puzzles.ruins && meta.puzzles.ruins.setA.some(c => c.x === x && c.y === y && c.z === z)) return B.RESONANT_GLASS; return W.id(x, y, z); } };
  const a = meta.arrival, start = { x: Math.floor(a.x), y: a.y, z: Math.floor(a.z) };
  ok(solid(W.id(start.x, start.y - 1, start.z)) && !solid(W.id(start.x, start.y, start.z)) && !solid(W.id(start.x, start.y + 1, start.z)), `${which}: arrival spot has floor and head room`);
  const walk = walkable(view, start, solid, hazard);
  const reach = (t, what, rr = 2) => ok(walk.near({ x: Math.floor(t.x), y: Math.floor(t.y), z: Math.floor(t.z) }, rr), `${which}: ${what} is reachable on foot`);
  for (const c of meta.checkpoints) reach(c, `checkpoint "${c.name}"`);
  for (const [k, l] of Object.entries(meta.lore)) { const [x, y, z] = k.split(",").map(Number); reach({ x, y, z }, `tablet "${l}"`); }
  for (const [k, c] of Object.entries(meta.chests)) { const [x, y, z] = k.split(",").map(Number); reach({ x, y, z }, `chest "${c.id}"`); }
  for (const d of meta.districts || []) reach(d.entrance, `${d.name} entrance`, 3);
  for (const s of meta.secrets || []) reach(s, `secret "${s.name}"`, 3);
  if (which === "deep") {
    for (const s of meta.gate.sockets) reach(s, `gate socket (${s.slot})`);
    reach(meta.gate.stand, "the gate's activation spot");
    for (const p of meta.citadel.pylons) reach({ x: p.standX, y: p.y - 4, z: p.standZ }, "a Citadel pylon", 3);
    reach(meta.cityArrival, "the city arrival");
    for (const p of Object.values(meta.puzzles)) for (const s of [...(p.switches || []), ...(p.resonators || []), ...(p.resonator ? [p.resonator] : [])]) reach(s, `puzzle control (${p.kind})`);
    ok(Object.values(meta.chests).some(c => c.slots.some(s => s.id === I.STAB_ARCHIVE)) && Object.values(meta.chests).some(c => c.slots.some(s => s.id === I.STAB_FOUNDRY)) && Object.values(meta.chests).some(c => c.slots.some(s => s.id === I.STAB_GARDEN)), "deep: all three city stabilizers are placed");
    const loot = Object.keys(meta.chests).length; ok(loot >= 25, `deep: ${loot} caches placed (target 25–40)`);
    ok(Object.keys(meta.lore).filter(k => !meta.lore[k].startsWith("m_") && !meta.lore[k].startsWith("mem_")).length >= 12, "deep: at least 12 tablets placed");
  }
  if (which === "expanse") {
    for (const an of meta.anchors) reach(an, `forge anchor (${an.kind})`, 3);
    for (const s of meta.arena.stations) reach(s, "a Sovereign arena station");
    reach({ x: meta.returnVeil.x0 + 3, y: meta.returnVeil.y0 - 1, z: meta.returnVeil.z - 1 }, "the return gate");
    const loot = Object.keys(meta.chests).length; ok(loot >= 12, `expanse: ${loot} caches placed (target 12–20)`);
  }
  report.push(`${which}: walkable spots found: ${walk.seen.size}`);
  return report;
}
export { LORE, MURALS, MEMORIES };
export { seeded, it, lootFor, makeKit, k3 };
