// Builds the three Keeper temples (development only; tools/lost-build.html packs them into maps/):
// the Drowned Citadel (sea), the Verdant Labyrinth (jungle), and the Sunken Pyramid of Aurelis (desert).
// Each holds a relic for the First Gate, a boss guarding it, traps that always warn first, puzzles, and 12–14 caches.
import { B, I, HEIGHT, make } from "./blocks.js";
import { Grid, walkable } from "./maps.js";
import { Noise } from "./noise.js";
import { seeded, it, makeKit, k3 } from "./lost-author.js";

export const TEMPLE = { min: -64, size: 128 };
const MIN = TEMPLE.min, MAX = TEMPLE.min + TEMPLE.size - 1;

// ---------- shared pieces ----------
function base(fill, seed, kind) {
  const W = new Grid(MIN, MIN, TEMPLE.size, TEMPLE.size, fill), r = seeded(seed), n = new Noise(seed);
  for (let z = MIN; z <= MAX; z++) for (let x = MIN; x <= MAX; x++) { W.set(x, 0, z, B.BEDROCK); W.set(x, HEIGHT - 1, z, B.BEDROCK); }
  const meta = { version: 1, id: kind + "-v1", kind, fill, lore: {}, chests: {}, checkpoints: [], districts: [], nodes: [], puzzles: {}, secrets: [], spawns: [], traps: [] };
  return { W, r, n, meta, K: makeKit(W, meta, r) };
}
// Rooms are built in two passes (every shell first, then every inside), so wherever two rooms touch, a doorway opens.
function planner(W) {
  const list = [], carved = new Uint8Array(W.sx * W.sz * HEIGHT);   // insides already carved stay open when a later room's walls touch them
  const wall = (x, y, z, v) => { if (W.inside(x, y, z) && !carved[W.i(x, y, z)]) W.set(x, y, z, v); };
  const P = {
    room(x0, y0, z0, x1, y1, z1, wall, floor = wall, opts = {}) { list.push({ x0: Math.min(x0, x1), y0, z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1, z1: Math.max(z0, z1), wall, floor, ...opts }); },
    build() {
      for (const q of list) {
        for (let y = q.y0 - 1; y <= q.y1 + 1; y++) for (let z = q.z0 - 1; z <= q.z1 + 1; z++) for (let x = q.x0 - 1; x <= q.x1 + 1; x++) wall(x, y, z, y === q.y0 - 1 && x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1 ? q.floor : q.wall);
        if (q.glass) for (let y = q.y0 + 1; y < q.y1; y++) for (let x = q.x0; x <= q.x1; x += 2) for (let z = q.z0; z <= q.z1; z += 2) {   // windows in the long walls
          if (z === q.z0) wall(x, y, q.z0 - 1, B.GLASS); if (z === q.z1) wall(x, y, q.z1 + 1, B.GLASS); if (x === q.x0) wall(q.x0 - 1, y, z, B.GLASS); if (x === q.x1) wall(q.x1 + 1, y, z, B.GLASS);
        }
      }
      for (const q of list) for (let y = q.y0; y <= q.y1; y++) for (let z = q.z0; z <= q.z1; z++) for (let x = q.x0; x <= q.x1; x++) if (W.inside(x, y, z)) { W.set(x, y, z, 0); carved[W.i(x, y, z)] = 1; }
      list.length = 0;
    }
  };
  return P;
}
// A helical ramp inside a round shaft: every spot has a floor, one step up per eighth of a turn, so nobody can fall down the middle.
function helix(W, cx, cz, yBottom, yTop, mat) {
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const d = Math.hypot(dx, dz); if (d > 2.5) continue;
    for (let y = yBottom + 1; y <= yTop + 3; y++) W.set(cx + dx, y, cz + dz, 0);
    if (d < 0.5) { for (let y = yBottom; y <= yTop + 2; y++) W.set(cx, y, cz, mat); continue; }   // the solid middle post
    const s = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * 8) % 8;
    for (let y = yBottom + s; y <= yTop; y += 8) W.set(cx + dx, y, cz + dz, mat);
  }
}
// a carved passage with steps, from a down (or up) to b, lined with `mat`
function steps(W, a, b, wdt, mat) {
  const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.z - a.z), Math.abs(b.y - a.y) * 2);
  for (let s = 0; s <= n; s++) {
    const x = Math.round(a.x + (b.x - a.x) * s / n), y = Math.round(a.y + (b.y - a.y) * s / n), z = Math.round(a.z + (b.z - a.z) * s / n);
    W.box(x - wdt, y, z - wdt, x + wdt, y + 3, z + wdt, 0);
    W.box(x - wdt, y - 1, z - wdt, x + wdt, y - 1, z + wdt, mat);
  }
}
function arena(W, cx, y, cz, rad, h, wall, floor, top) {
  for (let dz = -rad - 1; dz <= rad + 1; dz++) for (let dx = -rad - 1; dx <= rad + 1; dx++) {
    const d = Math.hypot(dx, dz); if (d > rad + 1.2) continue;
    for (let yy = y - 1; yy <= y + h; yy++) W.set(cx + dx, yy, cz + dz, d > rad || yy === y - 1 || yy === y + h ? (yy === y - 1 ? floor : yy === y + h ? top(dx, dz) : wall) : 0);
  }
  for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; W.set(Math.round(cx + Math.cos(t) * (rad + 1)), y + 3, Math.round(cz + Math.sin(t) * (rad + 1)), B.SHINESTONE); }   // a ring of lights in the wall
}
function entrance(K, W, meta, x, y, z, loreKey, theme) {   // the arrival room: lift home, beacon, supplies, a welcome tablet
  W.set(x + 3, y, z + 2, B.DEEP_LIFT); K.beacon(x - 3, y, z + 2, "arrival", "the temple entrance"); K.lore(x - 3, y, z - 2, loreKey);
  K.chest(x + 3, y, z - 2, theme + "_entry", "supply", [it(I.GOLDEN_APPLE, 1), it(B.TORCH, 16)]);
  meta.arrival = { x: x + 0.5, y, z: z + 0.5 }; meta.lift = { x: x + 3, y, z: z + 2 };
}
function bossSite(K, W, meta, o) {   // devices around the arena, cover, the vault door, the relic pedestal
  meta.arena = { x: o.x + 0.5, y: o.y, z: o.z + 0.5, r: o.r, boss: o.boss, devices: o.devices, threshold: o.threshold };
  for (const d of o.devices) W.set(d.x, d.y, d.z, o.deviceBlock);
  for (const c of o.cover) W.box(c[0], o.y, c[1], c[0] + 1, o.y + 2, c[1], o.coverBlock);
  W.box(o.door.x0, o.door.y0, o.door.z0, o.door.x1, o.door.y1, o.door.z1, B.KEEPER_STONE);
  meta.puzzles.vault = { kind: "boss", door: o.door };
  W.set(o.pedestal.x, o.pedestal.y, o.pedestal.z, B.RELIC_PEDESTAL); meta.pedestal = { ...o.pedestal, relic: o.relic };
  K.lore(o.pedestal.x - 2, o.pedestal.y, o.pedestal.z, o.loreKey);
  K.chest(o.pedestal.x + 2, o.pedestal.y, o.pedestal.z, o.theme + "_vault1", "vault"); K.chest(o.pedestal.x + 3, o.pedestal.y, o.pedestal.z + 2, o.theme + "_vault2", "vault");
}

// =====================================================================
// THE DROWNED CITADEL: a sealed citadel under a sea cavern. Glass halls look out into the water.
// =====================================================================
export function buildSeaTemple() {
  const { W, r, n, meta, K } = base(B.STONE, 7101, "sea");
  const P = planner(W), TB = B.TIDE_BRICKS, L = 16;
  // the sea cavern: water up to y 40, sand on the bottom
  for (let z = MIN + 2; z < MAX - 1; z++) for (let x = MIN + 2; x < MAX - 1; x++) for (let y = 1; y < 56; y++) {
    const wob = n.n2(x / 14, z / 14) * 3;
    if ((x / (58 + wob)) ** 2 + ((y - 28) / 27) ** 2 + (z / (58 + wob)) ** 2 <= 1) W.set(x, y, z, y <= 40 ? B.WATER : 0);
  }
  for (let z = MIN; z <= MAX; z++) for (let x = MIN; x <= MAX; x++) for (let y = 1; y < 50; y++) if (W.id(x, y, z) === B.WATER && W.id(x, y - 1, z) === B.STONE) { W.set(x, y - 1, z, B.SAND); break; }
  for (let k = 0; k < 40; k++) { const a = r() * Math.PI * 2, d = r() * 50, x = Math.round(Math.cos(a) * d), z = Math.round(Math.sin(a) * d); let y = 55; while (y > 42 && !W.id(x, y, z)) y--; if (W.id(x, y, z) === B.STONE) W.set(x, y, z, B.TIDE_LAMP); }   // glowing stones in the cavern roof
  // arrival alcove in the south wall, the dock, and the causeway to the citadel
  P.room(-4, 42, 48, 4, 46, 56, TB); P.build();
  W.box(-5, 41, 36, 5, 41, 47, TB); for (const [x, z] of [[-5, 36], [5, 36], [-5, 44], [5, 44]]) W.box(x, 1, z, x, 40, z, TB);
  W.box(-1, 41, 22, 1, 41, 35, TB); for (let z = 23; z <= 35; z += 1) { W.set(-2, 42, z, z % 5 ? TB : B.TIDE_LAMP); W.set(2, 42, z, z % 5 ? TB : B.TIDE_LAMP); }
  for (let z = 36; z <= 46; z++) { W.set(-5, 42, z, TB); W.set(5, 42, z, TB); } W.box(-1, 42, 47, 1, 44, 47, 0);
  entrance(K, W, meta, 0, 42, 52, "sea_arrival", "sea");
  // the upper courtyard on a solid reef foundation, with corner towers
  W.box(-14, 1, -8, 14, 41, 22, TB);
  for (let x = -14; x <= 14; x++) for (const z of [-8, 22]) if (Math.abs(x) > 1 || z === -8) W.set(x, 42, z, x % 4 ? TB : B.TIDE_LAMP);
  for (let z = -8; z <= 22; z++) for (const x of [-14, 14]) W.set(x, 42, z, z % 4 ? TB : B.TIDE_LAMP);
  for (const [x, z] of [[-13, -7], [13, -7], [-13, 21], [13, 21]]) { W.box(x - 1, 42, z - 1, x + 1, 52, z + 1, TB); W.set(x, 53, z, B.TIDE_LAMP); }
  K.chest(-10, 42, 16, "sea_courtyard", "discovery"); K.lore(10, 42, 16, "sea_history");
  meta.spawns.push({ id: "sea_court_crabs", kind: "tidecrab", n: 3, x: -6, y: 42, z: 2, r: 5 });
  meta.districts.push({ id: "sea_court", name: "the Citadel Courtyard", x: 0, z: 7, r: 12, entrance: { x: 0, y: 42, z: 20 } });
  // the Gallery of Bells (inside the foundation) and the helical stair down to it
  P.room(-12, L, 2, 12, L + 5, 20, TB); P.room(14, L, 8, 20, L + 4, 14, TB); P.build();
  helix(W, 0, 12, L - 1, 41, TB);
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (Math.hypot(dx, dz) <= 2.5 && Math.hypot(dx, dz) >= 0.5) for (let y = 42; y <= 44; y++) W.set(dx, y, 12 + dz, 0);
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) W.set(dx, 42, 12 + dz, B.TIDE_LAMP);
  const bellSw = [-9, -5, 5, 9].map(x => { W.set(x, L, 4, B.KEEPER_SWITCH); return { x, y: L, z: 4 }; });
  meta.puzzles.bells = { kind: "order", switches: bellSw, symbols: ["wave", "shell", "pearl", "star"], order: [2, 0, 3, 1], clue: "The Bell-Ringer's Rhyme: PEARL, WAVE, STAR, SHELL.", door: { x0: 13, y0: L, z0: 10, x1: 13, y1: L + 2, z1: 12 } };
  W.box(13, L, 10, 13, L + 2, 12, B.KEEPER_STONE);
  K.lore(-11, L, 18, "sea_clue"); K.chest(11, L, 18, "sea_gallery", "supply"); K.chest(19, L, 11, "sea_bellvault", "discovery", [it(I.GOLDEN_APPLE, 1)]);
  for (const [x, z] of [[-11, 3], [11, 3], [-11, 19], [11, 19]]) W.set(x, L + 5, z, B.TIDE_LAMP);
  meta.districts.push({ id: "sea_gallery", name: "the Gallery of Bells", x: 0, z: 11, r: 8, entrance: { x: 0, y: L, z: 4 } });
  // the Tide Jet Corridor out under the water (glass walls), with dart vents
  P.room(-1, L, -17, 1, L + 3, 1, TB, TB, { glass: true }); P.build();
  for (let z = -16; z <= 0; z += 4) { W.set(-2, L + 1, z, B.TRAP_VENT); W.set(2, L + 1, z, B.TRAP_VENT); }
  meta.traps.push({ id: "sea_jets", kind: "darts", a: { x: 0, z: 0 }, b: { x: 0, z: -16 }, y: L - 1, box: { x0: -1, z0: -17, x1: 1, z1: 1 }, period: 3, name: "tide jets" });
  // the Lantern Hall (checkpoint), the Sluice Hall and Flooded Treasury (west), the Cracked Hall (east)
  P.room(-10, L, -30, 10, L + 5, -18, TB, TB, { glass: true });
  P.room(-24, L, -25, -11, L + 3, -23, TB, TB, { glass: true }); P.room(-36, L, -30, -25, L + 4, -18, TB);
  P.room(11, L, -25, 24, L + 3, -23, TB, TB, { glass: true }); P.room(25, L, -34, 36, L + 5, -14, TB);
  P.build();
  K.beacon(-8, L, -20, "lantern", "the Lantern Hall"); K.chest(8, L, -28, "sea_lantern", "supply");
  for (const [x, z] of [[-9, -29], [9, -19], [-9, -19]]) W.set(x, L + 5, z, B.TIDE_LAMP);
  meta.spawns.push({ id: "sea_hall_crabs", kind: "tidecrab", n: 2, x: 0, y: L, z: -24, r: 4 });
  meta.districts.push({ id: "sea_lantern", name: "the Lantern Hall", x: 0, z: -24, r: 8, entrance: { x: 0, y: L, z: -19 } });
  // treasury: a lower room full of water; the sluice lever drains it (it can also be swum)
  W.box(-37, 10, -47, -24, 19, -31, TB); W.box(-36, 11, -46, -25, 18, -32, 0); W.box(-36, 11, -46, -25, 15, -32, B.WATER);
  for (let s = 0; s <= 10; s++) { const z = -31 - s, y = L - Math.floor(s / 2); W.box(-36, y, z, -34, y + 3, z, (xx, yy) => yy <= 15 ? B.WATER : 0); W.box(-36, y - 1, z, -34, y - 1, z, TB); }
  W.box(-36, L, -31, -34, L + 3, -30, 0);
  W.set(-26, L, -24, B.KEEPER_SWITCH);
  meta.puzzles.sluice = { kind: "switch", switches: [{ x: -26, y: L, z: -24 }], drain: { x0: -36, y0: 10, z0: -47, x1: -24, y1: 16, z1: -30 }, clue: "A sluice lever. A painted arrow shows the water draining toward the low pipe." };
  K.chest(-27, 11, -44, "sea_treasury1", "discovery"); K.chest(-30, 11, -44, "sea_treasury2", "discovery"); K.chest(-27, 11, -36, "sea_treasury3", "supply");
  meta.districts.push({ id: "sea_treasury", name: "the Flooded Treasury", x: -30, z: -38, r: 7, entrance: { x: -30, y: L, z: -24 } });
  // geyser vents in the east corridor (they take turns, so there's always a safe moment)
  const ventA = [], ventB = [];
  for (let x = 12; x <= 23; x++) { W.set(x, L - 1, -24, B.TRAP_VENT); (x % 4 < 2 ? ventA : ventB).push({ x, y: L, z: -24 }); }
  meta.traps.push({ id: "sea_geysers", kind: "vents", a: ventA, b: ventB, box: { x0: 11, z0: -25, x1: 24, z1: -23 }, period: 2.2, name: "geysers", checkY: L });
  // the Cracked Hall: a crumbling bridge over a shallow pool, with steps back up on both sides
  W.box(25, 11, -27, 36, L - 1, -21, 0); W.box(25, 10, -27, 36, 10, -21, TB); W.box(25, 11, -27, 36, 12, -21, B.WATER);
  for (let x = 29; x <= 31; x++) for (let z = -27; z <= -21; z++) W.set(x, L - 1, z, B.CRACKED_FLOOR);
  meta.traps.push({ id: "sea_cracks", kind: "floor", box: { x0: 29, z0: -27, x1: 31, z1: -21 }, y: L - 1, name: "cracked floor" });
  steps(W, { x: 34, y: 13, z: -21 }, { x: 34, y: L, z: -15 }, 1, TB); steps(W, { x: 34, y: 13, z: -27 }, { x: 34, y: L, z: -33 }, 1, TB);
  K.chest(26, L, -33, "sea_cracked", "discovery");
  meta.spawns.push({ id: "sea_crack_crabs", kind: "tidecrab", n: 2, x: 30, y: L, z: -16, r: 3 });
  // a secret: a narrow gap behind the hall's corner pillar opens into a small grotto
  W.box(36, L, -15, 36, L + 5, -14, TB); P.room(38, L, -18, 42, L + 3, -15, TB); P.build(); W.box(37, L, -16, 37, L + 1, -16, 0);
  K.chest(41, L, -17, "sea_secret", "vault"); meta.secrets.push({ id: "sea_grotto", name: "the hidden grotto", x: 40, y: L, z: -17 });
  // the Tide Hall: a domed arena with a glass roof under the sea; the vault lies past it
  arena(W, 0, L, -44, 12, 9, TB, TB, (dx, dz) => (Math.hypot(dx, dz) < 9 ? B.GLASS : TB));
  W.box(-1, L, -32, 1, L + 3, -31, 0);
  P.room(-4, L, -62, 4, L + 4, -58, TB); P.build();
  bossSite(K, W, meta, { x: 0, y: L, z: -44, r: 12, boss: "regent", theme: "sea", relic: "TIDAL_HEART", loreKey: "sea_relic", deviceBlock: B.KEEPER_SWITCH,
    devices: [{ x: -9, y: L, z: -40 }, { x: 9, y: L, z: -40 }, { x: 0, y: L, z: -54 }], cover: [[-5, -48], [4, -48], [-1, -38]], coverBlock: TB,
    threshold: { x: 0, z: -32 }, door: { x0: -1, y0: L, z0: -57, x1: 1, y1: L + 2, z1: -57 }, pedestal: { x: 0, y: L, z: -60 } });
  meta.districts.push({ id: "sea_tidehall", name: "the Tide Hall", x: 0, z: -44, r: 12, entrance: { x: 0, y: L, z: -33 } });
  return { grid: W, meta };
}

// =====================================================================
// THE VERDANT LABYRINTH: a hidden green valley, a ravine, a hedge maze, the Grove of Bells, and the Heart Grove.
// =====================================================================
export function buildJungleTemple() {
  const { W, r, n, meta, K } = base(B.STONE, 7202, "jungle");
  const P = planner(W), VB = B.VINE_BRICKS, F = 14;
  // the valley: a wide cavern with a grassy floor at y 14
  for (let z = MIN + 2; z < MAX - 1; z++) for (let x = MIN + 2; x < MAX - 1; x++) {
    const wob = n.n2(x / 16, z / 16) * 3;
    for (let y = 2; y < 60; y++) if ((x / (60 + wob)) ** 2 + ((y - 30) / 28) ** 2 + (z / (60 + wob)) ** 2 <= 1) W.set(x, y, z, y < F ? (y === F - 1 ? B.GRASS : B.DIRT) : 0);
  }
  for (let k = 0; k < 60; k++) { const a = r() * Math.PI * 2, d = r() * 50, x = Math.round(Math.cos(a) * d), z = Math.round(Math.sin(a) * d); let y = 57; while (y > 30 && !W.id(x, y, z)) y--; if (W.id(x, y, z) === B.STONE) { W.set(x, y, z, B.SHINESTONE); for (let j = 1; j < 4; j++) if (!W.id(x, y - j, z)) W.set(x, y - j, z, B.VINES); } }
  // arrival in the south wall
  P.room(-4, F, 46, 4, F + 4, 56, VB); P.build(); W.box(-1, F, 45, 1, F + 2, 45, 0);
  entrance(K, W, meta, 0, F, 52, "jungle_arrival", "jungle");
  for (let x = -4; x <= 4; x += 2) W.set(x, F + 4, 47, B.VINES);
  // light-trees across the valley (kept off the paths)
  const clear = (x, z) => Math.abs(x) < 4 || (z > -12 && z < 29 && Math.abs(x) < 21) || (z < -24 && Math.abs(x) < 16) || (z > 31 && z < 39);
  for (let k = 0; k < 34; k++) {
    const a = r() * Math.PI * 2, d = 12 + r() * 32, x = Math.round(Math.cos(a) * d), z = Math.round(Math.sin(a) * d);
    if (clear(x, z) || W.id(x, F - 1, z) !== B.GRASS) continue;
    const h = 5 + Math.floor(r() * 4);
    for (let y = F; y < F + h; y++) W.set(x, y, z, B.LOG);
    W.ball(x, F + h, z, 2.6, 2, 2.6, (xx, yy, zz, o) => (o & 255) === 0 ? (r() < 0.08 ? B.SHINESTONE : B.LEAVES) : undefined);
  }
  K.chest(-24, F, 40, "jungle_valley1", "supply"); K.chest(28, F, 20, "jungle_valley2", "discovery");
  meta.spawns.push({ id: "jungle_valley_walkers", kind: "vinewalker", n: 2, x: -20, y: F, z: 34, r: 4 });
  meta.districts.push({ id: "jungle_valley", name: "the Hidden Valley", x: 0, z: 40, r: 10, entrance: { x: 0, y: F, z: 44 } });
  // the ravine across the valley: a crumbling bridge in the middle, and steps down and up the far side (always a way across)
  W.box(-47, 7, 32, 47, F - 1, 37, 0); W.box(-47, 6, 32, 47, 6, 37, B.DIRT); W.box(-47, 7, 32, 47, 7, 37, B.WATER);
  for (let x = -1; x <= 1; x++) for (let z = 32; z <= 37; z++) W.set(x, F - 1, z, B.CRACKED_FLOOR);
  meta.traps.push({ id: "jungle_cracks", kind: "floor", box: { x0: -1, z0: 32, x1: 1, z1: 37 }, y: F - 1, name: "cracked floor" });
  steps(W, { x: 12, y: F, z: 40 }, { x: 12, y: 8, z: 35 }, 1, VB); steps(W, { x: 12, y: 8, z: 34 }, { x: 12, y: F, z: 29 }, 1, VB);
  steps(W, { x: -12, y: F, z: 40 }, { x: -12, y: 8, z: 35 }, 1, VB); steps(W, { x: -12, y: 8, z: 34 }, { x: -12, y: F, z: 29 }, 1, VB);
  K.chest(-30, 8, 35, "jungle_ravine", "discovery");
  // the labyrinth: a 9 × 9 hedge maze (cells 4 blocks wide), entrance south, exit north; dead ends hide caches
  const N = 9, X0 = -18, Z0 = -9, cell = (cx, cz) => ({ x: X0 + 1 + cx * 4, z: Z0 + 1 + cz * 4 });
  W.box(X0, F, Z0, X0 + N * 4, F + 4, Z0 + N * 4, VB);
  const seen = new Set(), stack = [[4, N - 1]], links = new Map(), key = (a, b) => a + "," + b;
  seen.add(key(4, N - 1));
  while (stack.length) {
    const [cx, cz] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [cx + dx, cz + dz]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(key(a, b)));
    if (!nb.length) { stack.pop(); continue; }
    const [nx, nz] = nb[Math.floor(r() * nb.length)];
    seen.add(key(nx, nz)); stack.push([nx, nz]);
    (links.get(key(cx, cz)) || links.set(key(cx, cz), []).get(key(cx, cz))).push([nx, nz]);
    (links.get(key(nx, nz)) || links.set(key(nx, nz), []).get(key(nx, nz))).push([cx, cz]);
    const a = cell(cx, cz), b = cell(nx, nz);
    W.box(Math.min(a.x, b.x), F, Math.min(a.z, b.z), Math.max(a.x, b.x) + 2, F + 4, Math.max(a.z, b.z) + 2, 0);
  }
  for (let cz = 0; cz < N; cz++) for (let cx = 0; cx < N; cx++) { const c = cell(cx, cz); W.box(c.x, F, c.z, c.x + 2, F + 4, c.z + 2, 0); }
  const ent = cell(4, N - 1), ext = cell(4, 0);
  W.box(ent.x, F, ent.z + 3, ent.x + 2, F + 4, ent.z + 3, 0); W.box(ext.x, F, ext.z - 1, ext.x + 2, F + 4, ext.z - 1, 0);
  for (let x = X0; x <= X0 + N * 4; x += 4) for (let z = Z0; z <= Z0 + N * 4; z += 4) W.set(x, F + 5, z, B.SHINESTONE);
  const dead = [...links.entries()].filter(([k, v]) => v.length === 1 && k !== key(4, N - 1) && k !== key(4, 0)).map(([k]) => k.split(",").map(Number));
  dead.sort(() => r() - 0.5).slice(0, 5).forEach(([cx, cz], i) => { const c = cell(cx, cz); K.chest(c.x + 1, F, c.z + 1, "jungle_maze" + i, i < 2 ? "discovery" : "supply"); });
  meta.spawns.push({ id: "jungle_maze_walkers", kind: "vinewalker", n: 3, x: 0, y: F, z: 9, r: 1 });
  meta.districts.push({ id: "jungle_maze", name: "the Labyrinth", x: 0, z: 9, r: 18, entrance: { x: ent.x + 1, y: F, z: ent.z + 4 } });
  // the Grove of Bells: three bells rung together open the Root Gate
  const bells = [{ x: -11, y: F, z: -17 }, { x: 11, y: F, z: -17 }, { x: 0, y: F, z: -22 }];
  for (const b of bells) { W.set(b.x, F, b.z, B.RESONATOR); W.box(b.x - 1, F - 1, b.z - 1, b.x + 1, F - 1, b.z + 1, VB); }
  W.box(-45, F, -26, 45, F + 9, -26, VB); W.box(-2, F, -26, 2, F + 3, -26, B.KEEPER_STONE);
  meta.puzzles.rootgate = { kind: "timing", resonators: bells, window: 8, clue: "Ring all three bells within eight heartbeats.", door: { x0: -2, y0: F, z0: -26, x1: 2, y1: F + 3, z1: -26 } };
  K.lore(-4, F, -13, "jungle_clue"); K.beacon(4, F, -13, "grove", "the Grove of Bells"); K.chest(-14, F, -22, "jungle_grove", "supply");
  meta.spawns.push({ id: "jungle_grove_walkers", kind: "vinewalker", n: 2, x: 10, y: F, z: -20, r: 3 });
  meta.districts.push({ id: "jungle_grove", name: "the Grove of Bells", x: 0, z: -18, r: 9, entrance: { x: 0, y: F, z: -12 } });
  // the thorn walk: spore vents that take turns, between the Root Gate and the Heart Grove
  W.box(-4, F, -31, 4, F + 5, -27, VB); W.box(-2, F, -31, 2, F + 3, -27, 0);
  const sA = [], sB = [];
  for (let z = -31; z <= -27; z++) for (let x = -2; x <= 2; x++) { if ((x + z) % 2 === 0) { W.set(x, F - 1, z, B.TRAP_VENT); ((z + 40) % 2 ? sA : sB).push({ x, y: F, z }); } }
  meta.traps.push({ id: "jungle_spores", kind: "vents", a: sA, b: sB, box: { x0: -2, z0: -31, x1: 2, z1: -27 }, period: 2.4, name: "spore vents" });
  K.lore(3, F, -33, "jungle_history");
  // the Heart Grove arena and the vault behind it
  arena(W, 0, F, -44, 12, 10, VB, B.GRASS, (dx, dz) => (Math.hypot(dx, dz) < 8 ? B.LEAVES : VB));
  W.box(-2, F, -32, 2, F + 3, -31, 0);
  P.room(-4, F, -62, 4, F + 4, -58, VB); P.build();
  bossSite(K, W, meta, { x: 0, y: F, z: -44, r: 12, boss: "vcolossus", theme: "jungle", relic: "VERDANT_LENS", loreKey: "jungle_relic", deviceBlock: B.KEEPER_SWITCH,
    devices: [{ x: -9, y: F, z: -40 }, { x: 9, y: F, z: -40 }, { x: 0, y: F, z: -54 }], cover: [[-5, -48], [4, -48], [-1, -38]], coverBlock: B.LOG,
    threshold: { x: 0, z: -32 }, door: { x0: -1, y0: F, z0: -57, x1: 1, y1: F + 2, z1: -57 }, pedestal: { x: 0, y: F, z: -60 } });
  meta.districts.push({ id: "jungle_heart", name: "the Heart Grove", x: 0, z: -44, r: 12, entrance: { x: 0, y: F, z: -33 } });
  // a secret behind a waterfall in the east wall
  const wfx = 46;
  for (let x = 30; x <= wfx + 6; x++) for (let z = 6; z <= 10; z++) { for (let y = F; y <= F + 3; y++) W.set(x, y, z, x === wfx - 1 ? B.WATER : 0); W.set(x, F - 1, z, x < wfx ? B.GRASS : VB); }
  for (let y = F + 4; y <= F + 10; y++) for (let z = 6; z <= 10; z++) if (W.id(wfx - 1, y, z) === B.STONE) W.set(wfx - 1, y, z, B.WATER);   // the falls pour down the wall in front of the cave
  K.chest(wfx + 5, F, 8, "jungle_secret", "vault"); meta.secrets.push({ id: "jungle_falls", name: "the cave behind the waterfall", x: wfx + 3, y: F, z: 8 });
  return { grid: W, meta };
}

// =====================================================================
// THE SUNKEN PYRAMID OF AURELIS: dry halls inside a buried pyramid, lit by a shaft of sunlight.
// =====================================================================
export function buildDesertTemple() {
  const { W, r, meta, K } = base(B.SANDSTONE, 7303, "desert");
  const P = planner(W), SB = B.SUN_BRICKS, Y = 22;
  // arrival chamber and the descending Gallery of Statues (dart vents in the walls)
  P.room(-5, 30, 48, 5, 35, 58, SB); P.build();
  entrance(K, W, meta, 0, 30, 54, "desert_arrival", "desert");
  steps(W, { x: 0, y: 30, z: 47 }, { x: 0, y: Y, z: 22 }, 2, SB);
  for (let z = 44; z >= 24; z -= 4) { const y = Math.round(30 - (47 - z) * (8 / 25)); for (const x of [-3, 3]) { W.set(x, y + 1, z, B.TRAP_VENT); W.set(x, y, z, SB); } }
  meta.traps.push({ id: "desert_darts", kind: "darts", a: { x: 0, z: 45 }, b: { x: 0, z: 24 }, y: null, box: { x0: -2, z0: 22, x1: 2, z1: 46 }, period: 3, name: "dart vents", checkY: 26 });
  // a secret: behind the statue at the bottom of the gallery, a narrow gap to the Scribe's Nook
  P.room(-12, 24, 26, -6, 27, 31, SB); P.build(); W.box(-5, 24, 28, -3, 25, 28, 0); W.set(-4, 26, 28, SB);
  K.chest(-11, 24, 30, "desert_secret", "vault"); meta.secrets.push({ id: "desert_nook", name: "the Scribe's Nook", x: -9, y: 24, z: 28 });
  K.chest(2, Math.round(30 - (47 - 30) * 8 / 25), 30, "desert_gallery", "supply");
  // the Grand Hall: glyph columns, the order puzzle (north wall), the clue mural (east wall), a beacon
  P.room(-20, Y, -6, 20, Y + 15, 21, SB); P.build(); W.box(-2, Y, 22, 2, Y + 3, 22, 0);
  for (let x = -15; x <= 15; x += 10) for (const z of [0, 14]) { W.box(x, Y, z, x, Y + 14, z, B.SUN_GLYPH); W.set(x, Y + 15, z, B.SHINESTONE); W.set(x, Y + 4, z, B.SHINESTONE); }
  for (let z = -4; z <= 20; z += 6) for (const x of [-21, 21]) if (z !== 10) W.set(x, Y + 3, z, B.SHINESTONE);
  const glyphs = [-9, -3, 3, 9].map(x => { W.set(x, Y, -5, B.KEEPER_SWITCH); return { x, y: Y, z: -5 }; });
  meta.puzzles.glyphs = { kind: "order", switches: glyphs, symbols: ["river", "sun", "star", "eye"], order: [1, 3, 0, 2], clue: "The order of the day: SUN, EYE, RIVER, STAR.", door: { x0: -21, y0: Y, z0: 6, x1: -21, y1: Y + 2, z1: 8 } };
  K.mural(21, Y + 1, 10, "desert_clue"); K.beacon(-17, Y, 18, "grandhall", "the Grand Hall");
  K.chest(17, Y, 18, "desert_hall1", "supply"); K.chest(-17, Y, -3, "desert_hall2", "discovery");
  meta.spawns.push({ id: "desert_hall_scarabs", kind: "sunscarab", n: 2, x: 0, y: Y, z: 8, r: 5 });
  meta.districts.push({ id: "desert_hall", name: "the Grand Hall", x: 0, z: 8, r: 14, entrance: { x: 0, y: Y, z: 20 } });
  // the Hall of Records behind the glyph door
  P.room(-32, Y, 2, -23, Y + 4, 12, SB); P.build(); W.box(-22, Y, 6, -22, Y + 2, 8, 0); W.box(-21, Y, 6, -21, Y + 2, 8, B.KEEPER_STONE);
  K.chest(-30, Y, 4, "desert_records1", "discovery"); K.chest(-30, Y, 10, "desert_records2", "discovery", [it(I.GOLD_INGOT, 4)]);
  // the Flame Corridor east (vents take turns)
  P.room(21, Y, 9, 44, Y + 3, 11, SB); P.build();
  const fA = [], fB = [];
  for (let x = 23; x <= 42; x++) { W.set(x, Y - 1, 10, B.TRAP_VENT); (Math.floor((x - 23) / 3) % 2 ? fB : fA).push({ x, y: Y, z: 10 }); }
  meta.traps.push({ id: "desert_flames", kind: "vents", a: fA, b: fB, box: { x0: 21, z0: 9, x1: 44, z1: 11 }, period: 2.2, name: "flame vents", fire: true, checkY: Y });
  // the Sand Pit Hall: a crumbling bridge across, steps down and up the sides, and the swap puzzle to the pit island
  P.room(45, Y, -14, 58, Y + 5, 14, SB); P.build();
  W.box(45, 14, -6, 58, Y - 1, 6, 0); W.box(45, 13, -6, 58, 13, 6, B.SAND); W.box(45, 14, -6, 58, 14, 6, B.SAND);
  for (let x = 50; x <= 52; x++) for (let z = -6; z <= 6; z++) W.set(x, Y - 1, z, B.CRACKED_FLOOR);
  meta.traps.push({ id: "desert_cracks", kind: "floor", box: { x0: 50, z0: -6, x1: 52, z1: 6 }, y: Y - 1, name: "cracked floor" });
  steps(W, { x: 46, y: Y, z: 9 }, { x: 46, y: 15, z: 4 }, 0, SB); steps(W, { x: 46, y: 15, z: -4 }, { x: 46, y: Y, z: -9 }, 0, SB);
  W.box(55, 15, -1, 57, Y - 1, 1, SB); K.chest(56, Y, 0, "desert_island", "discovery");   // the pit island
  const swA = [], swB = [];
  for (let z = 2; z <= 6; z++) { swA.push({ x: 56, y: Y - 1, z }); swB.push({ x: 57, y: Y - 1, z: z + 1 }); }
  swB.pop();
  for (const c of swB) W.set(c.x, c.y, c.z, B.SUN_BRICKS);
  W.set(54, Y, 8, B.KEEPER_SWITCH);
  meta.puzzles.sinking = { kind: "swap", block: B.SUN_BRICKS, switch: { x: 54, y: Y, z: 8 }, setA: swA, setB: swB, clue: "Two bridges of sun brick. Only one of them is long enough." };
  K.chest(57, Y, -12, "desert_sandhall", "supply");
  meta.spawns.push({ id: "desert_pit_scarabs", kind: "sunscarab", n: 3, x: 50, y: Y, z: -11, r: 3 });
  meta.districts.push({ id: "desert_pit", name: "the Sand Pit Hall", x: 51, z: 0, r: 8, entrance: { x: 47, y: Y, z: 12 } });
  // the Mirror Court: three mirrors catch the sunlight; turning all three opens the Sun Door
  P.room(50, Y, -30, 52, Y + 3, -15, SB); P.room(30, Y, -44, 58, Y + 8, -31, SB); P.build();
  for (let x = 32; x <= 56; x += 4) W.set(x, Y + 9, -38, B.GLASS);
  const mirrors = [{ x: 36, y: Y, z: -41 }, { x: 44, y: Y, z: -34 }, { x: 52, y: Y, z: -41 }];
  for (const m of mirrors) W.set(m.x, m.y, m.z, B.SUN_MIRROR);
  W.box(29, Y, -39, 29, Y + 2, -37, B.KEEPER_STONE);
  meta.puzzles.mirrors = { kind: "all", switches: mirrors, labels: ["WEST MIRROR", "MIDDLE MIRROR", "EAST MIRROR"], clue: "Turn all three mirrors to catch the light.", door: { x0: 29, y0: Y, z0: -39, x1: 29, y1: Y + 2, z1: -37 } };
  K.lore(56, Y, -33, "desert_history"); K.chest(56, Y, -43, "desert_mirror", "discovery");
  meta.spawns.push({ id: "desert_court_scarabs", kind: "sunscarab", n: 2, x: 44, y: Y, z: -40, r: 3 });
  meta.districts.push({ id: "desert_mirror", name: "the Mirror Court", x: 44, z: -37, r: 9, entrance: { x: 51, y: Y, z: -31 } });
  // the Hall of the Sun (arena) under a skylight, and the vault
  P.room(13, Y, -39, 28, Y + 3, -37, SB); P.build(); W.box(29, Y, -39, 29, Y + 2, -37, B.KEEPER_STONE);
  arena(W, 0, Y, -38, 12, 12, SB, SB, (dx, dz) => (Math.hypot(dx, dz) < 7 ? B.GLASS : SB));
  for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) if (Math.hypot(dx, dz) < 7) W.set(dx, Y + 13, -38 + dz, B.SHINESTONE);
  W.box(12, Y, -39, 13, Y + 3, -37, 0);
  P.room(-4, Y, -60, 4, Y + 4, -52, SB); P.build();
  bossSite(K, W, meta, { x: 0, y: Y, z: -38, r: 12, boss: "scolossus", theme: "desert", relic: "SOLAR_SEAL", loreKey: "desert_relic", deviceBlock: B.SUN_MIRROR,
    devices: [{ x: -8, y: Y, z: -31 }, { x: -8, y: Y, z: -45 }, { x: 7, y: Y, z: -46 }], cover: [[-4, -40], [3, -34], [2, -43]], coverBlock: B.SUN_GLYPH,
    threshold: { x: 12, z: -38 }, door: { x0: -1, y0: Y, z0: -51, x1: 1, y1: Y + 2, z1: -51 }, pedestal: { x: 0, y: Y, z: -56 } });
  meta.districts.push({ id: "desert_sun", name: "the Hall of the Sun", x: 0, z: -38, r: 12, entrance: { x: 11, y: Y, z: -38 } });
  void r;
  return { grid: W, meta };
}

// ---------- build checks: everything that matters can be reached on foot from the entrance ----------
export function validateTemple(which, W, meta) {
  const report = [], ok = (pass, what) => report.push((pass ? "PASS " : "FAIL ") + what);
  const OPEN = new Set([0, B.WATER, B.TORCH, B.VINES, B.TALL_GRASS, B.LAVA]);
  const solid = id => !OPEN.has(id), hazard = id => id === B.LAVA;
  const doors = Object.values(meta.puzzles).filter(p => p.door);
  const swapA = Object.values(meta.puzzles).filter(p => p.kind === "swap").flatMap(p => p.setA);
  const view = { inside: (x, y, z) => W.inside(x, y, z), id: (x, y, z) => {
    for (const p of doors) { const d = p.door; if (x >= d.x0 && x <= d.x1 && y >= d.y0 && y <= d.y1 && z >= d.z0 && z <= d.z1) return 0; }
    if (swapA.some(c => c.x === x && c.y === y && c.z === z)) return B.SUN_BRICKS;
    return W.id(x, y, z); } };
  const a = meta.arrival, start = { x: Math.floor(a.x), y: a.y, z: Math.floor(a.z) };
  ok(solid(W.id(start.x, start.y - 1, start.z)) && !solid(W.id(start.x, start.y, start.z)) && !solid(W.id(start.x, start.y + 1, start.z)), `${which}: entrance has floor and head room`);
  const walk = walkable(view, start, solid, hazard);
  const reach = (t, what, rr = 2) => ok(walk.near({ x: Math.floor(t.x), y: Math.floor(t.y), z: Math.floor(t.z) }, rr), `${which}: ${what} is reachable on foot`);
  for (const c of meta.checkpoints) reach(c, `beacon "${c.name}"`);
  for (const [k, l] of Object.entries(meta.lore)) { const [x, y, z] = k.split(",").map(Number); reach({ x, y, z }, `tablet "${l}"`); }
  for (const [k, c] of Object.entries(meta.chests)) { const [x, y, z] = k.split(",").map(Number); reach({ x, y, z }, `cache "${c.id}"`); }
  for (const d of meta.districts) reach(d.entrance, `${d.name}`, 3);
  for (const s of meta.secrets) reach(s, `secret "${s.name}"`, 3);
  for (const p of Object.values(meta.puzzles)) for (const s of [...(p.switches || []), ...(p.resonators || []), ...(p.switch ? [p.switch] : [])]) reach(s, `puzzle control (${p.kind})`);
  for (const d of meta.arena.devices) reach(d, "a boss device");
  reach(meta.pedestal, "the relic pedestal");
  reach(meta.lift, "the lift home");
  for (const t of meta.traps) { const b = t.box; reach({ x: (b.x0 + b.x1) >> 1, y: t.checkY ?? (t.y != null ? t.y + 1 : meta.arrival.y), z: (b.z0 + b.z1) >> 1 }, `trap "${t.name}" area`, 4); }
  const loot = Object.keys(meta.chests).length; ok(loot >= 10 && loot <= 16, `${which}: ${loot} caches (target 10–16)`);
  report.push(`${which}: walkable spots found: ${walk.seen.size}`);
  return report;
}
