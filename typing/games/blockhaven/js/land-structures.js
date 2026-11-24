// Milestone 23, Part D: Pillager Outposts, Witch Huts and Woodland Mansions, built into the land.
// Each one is decided once per square of the world (from the seed). world.js only lets it appear where nobody has
// been yet (like the Ocean Monuments), so nothing ever pops up in land a player has already seen or changed.
import { B, CHUNK, HEIGHT, make } from "./blocks.js";
import { hash3 } from "./noise.js";
import { VILLAGE_ARCHITECTURE_GEN } from "./village-architecture.js";

const SEA = 30, LOOT = 4;   // (the same "treasure chest" bit as worldgen.js)
const LOOT_OUTPOST = 6, LOOT_MANSION = 7;   // chest meta bits 3-5 (main.js fillLoot)
const chest = (kind, f = 0) => make(B.CHEST, LOOT | (f & 3) | (kind << 3));
const OUTPOST_LANDS = new Set(["plains", "savanna", "sandy", "taiga", "snowy_plains", "birch"]);

export const KINDS = {
  //            square  chance  width depth height  lands                         needs the new biomes?
  outpost: { cell: 448, chance: 0.55, w: 9, d: 9, h: 18, ok: b => OUTPOST_LANDS.has(b), newLand: false, salt: 7301 },
  hut:     { cell: 320, chance: 0.7, w: 7, d: 9, h: 9, ok: b => b === "swamp", newLand: true, salt: 7311 },
  mansion: { cell: 1280, chance: 0.75, w: 25, d: 19, h: 14, ok: b => b === "dark_forest", newLand: true, salt: 7321 }
};

function biomeOf(gen, x, z) { const c = gen.column(x, z); return gen.landBiome ? gen.landBiome(c, x, z) : c.biome; }

// the site of one kind in one square (or null)
function site(gen, kind, gx, gz) {
  const K = KINDS[kind], key = kind + ":" + gx + "," + gz;
  gen.structCache ||= new Map();
  if (gen.structCache.has(key)) return gen.structCache.get(key);
  let s = null;
  if (hash3(gen.seed, gx, K.salt, gz) < K.chance) {
    const x0 = gx * K.cell + 32 + Math.floor(hash3(gen.seed, gx, K.salt + 1, gz) * (K.cell - 64 - K.w));
    const z0 = gz * K.cell + 32 + Math.floor(hash3(gen.seed, gx, K.salt + 2, gz) * (K.cell - 64 - K.d));
    const cx = x0 + (K.w >> 1), cz = z0 + (K.d >> 1);
    let ok = Math.hypot(cx, cz) > 220 && K.ok(biomeOf(gen, cx, cz));   // never near the world's starting area
    let lo = 99, hi = -1;
    for (const [a, b] of [[0, 0], [K.w - 1, 0], [0, K.d - 1], [K.w - 1, K.d - 1], [K.w >> 1, K.d >> 1]]) { const h = gen.column(x0 + a, z0 + b).h; lo = Math.min(lo, h); hi = Math.max(hi, h); }
    if (ok && (hi - lo > (kind === "mansion" ? 7 : 5) || (kind !== "hut" && lo <= SEA) || hi + K.h + 3 >= HEIGHT)) ok = false;
    for (const st of gen.strongholds || []) if (Math.hypot(st.x - cx, st.z - cz) < 220) ok = false;
    if (ok && (gen.stamps || []).some(t => t.x < x0 + K.w + 16 && t.x + (t.size || 32) > x0 - 16 && t.z < z0 + K.d + 16 && t.z + (t.size || 32) > z0 - 16)) ok = false;
    if (ok && gen.villagePiece) for (let i = Math.floor((x0 - 16) / CHUNK); i <= Math.floor((x0 + K.w + 16) / CHUNK) && ok; i++)
      for (let j = Math.floor((z0 - 16) / CHUNK); j <= Math.floor((z0 + K.d + 16) / CHUNK); j++) {
        // Expanded villages yield to these reservations. Compute them against the earlier village grid.
        if (gen.villagePiece(i, j, Math.min(gen.version, VILLAGE_ARCHITECTURE_GEN))) { ok = false; break; }
      }
    if (ok) s = { key, kind, x0, z0, y0: (kind === "hut" ? Math.max(hi, SEA) : hi) + 1, w: K.w, d: K.d, h: K.h, cx, cz, newLand: K.newLand };
  }
  gen.structCache.set(key, s);
  return s;
}
// every site whose square is near (x, z)
export function structuresNear(gen, x, z) {
  const out = [];
  for (const kind of Object.keys(KINDS)) {
    const c = KINDS[kind].cell, gx = Math.floor(x / c), gz = Math.floor(z / c);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const s = site(gen, kind, gx + i, gz + j); if (s) out.push(s); }
  }
  return out;
}

// ----- what each building looks like: cell(mx, my, mz) → a block, or undefined to leave the land alone -----
const DOP = () => B.DARK_OAK_PLANKS, DOL = () => B.DARK_OAK_LOG;
function outpostCell(mx, my, mz) {
  const edge = mx === 0 || mx === 8 || mz === 0 || mz === 8, inner = mx >= 1 && mx <= 7 && mz >= 1 && mz <= 7;
  const wall = inner && (mx === 1 || mx === 7 || mz === 1 || mz === 7), corner = (mx === 1 || mx === 7) && (mz === 1 || mz === 7);
  if (my === -1) return B.COBBLE;
  if (my <= 12) {
    if (!inner) return B.AIR;
    if (corner) return DOL();
    if (wall) {
      if (mx === 4 && mz === 1 && my <= 1) return B.AIR;                                   // the doorway
      if ((my === 3 || my === 8) && (mx === 4 || mz === 4)) return B.AIR;                  // windows
      return DOP();
    }
    if ((my === 5 || my === 10) && !(mx === 2 && mz === 2)) return B.BIRCH_PLANKS;          // floors (a gap for the ladder)
    if (mx === 2 && mz === 2) return make(B.LADDER, 3);                                    // up the inside of the west wall
    return B.AIR;
  }
  if (my === 13) return mx === 2 && mz === 2 ? make(B.LADDER, 3) : DOP();                  // the lookout deck
  if (my === 14) { if (mx === 4 && mz === 4) return chest(LOOT_OUTPOST); if (edge) return B.OAK_FENCE; return B.AIR; }
  if (my <= 16) return (mx === 0 || mx === 8) && (mz === 0 || mz === 8) ? DOL() : B.AIR;
  if (my === 17) return B.DARK_OAK_SLAB;                                                   // a flat roof
  return undefined;
}
function hutCell(mx, my, mz) {
  const stilt = (mx === 0 || mx === 6) && (mz === 0 || mz === 6 || mz === 8);
  if (my <= 2) return stilt ? B.SPRUCE_LOG : B.AIR;
  if (my === 3) return B.SPRUCE_PLANKS;                                                    // the floor (and porch)
  if (my <= 6) {
    if (mz >= 7) return stilt && my < 6 ? B.OAK_FENCE : B.AIR;                             // the porch
    const wall = mx === 0 || mx === 6 || mz === 0 || mz === 6;
    if (!wall) { if (my === 4 && mx === 1 && mz === 1) return make(B.CAULDRON, 2); if (my === 4 && mx === 5 && mz === 1) return B.TABLE; if (my === 4 && mx === 5 && mz === 5) return B.RED_MUSHROOM; return B.AIR; }
    if (mz === 6 && mx === 3 && my <= 5) return B.AIR;                                     // the door
    if (my === 5 && (mx === 0 || mx === 6) && mz === 3) return B.GLASS_PANE;
    return stilt ? B.SPRUCE_LOG : B.SPRUCE_PLANKS;
  }
  if (my === 7) return B.SPRUCE_SLAB;
  return undefined;
}
function mansionCell(mx, my, mz) {
  const W = 24, D = 18, outer = mx === 0 || mx === W || mz === 0 || mz === D, pillar = (mx % 6 === 0) && (mz === 0 || mz === D) || (mz % 6 === 0) && (mx === 0 || mx === W);
  if (my === -1) return B.COBBLE;
  if (my === 0 || my === 5) { if (outer) return DOL(); return my === 0 ? DOP() : (mx === 2 && mz === 2 ? make(B.LADDER, 3) : B.BIRCH_PLANKS); }
  if (my <= 9) {
    if (outer) {
      if (pillar) return DOL();
      if (mz === 0 && (mx === 12 || mx === 11) && (my === 1 || my === 2)) return B.AIR;              // the front door
      if ((my === 2 || my === 3 || my === 7 || my === 8) && (mx % 3 === 1 || mz % 3 === 1)) return B.GLASS_PANE;
      return my === 4 || my === 9 ? B.COBBLE : DOP();
    }
    if (mx === 2 && mz === 2) return make(B.LADDER, 3);
    const room = mx === 8 || mx === 16 || mz === 9;                                                    // inside walls make 6 rooms
    if (room) { if ((my === 1 || my === 2 || my === 6 || my === 7) && (mx === 8 || mx === 16 ? mz % 9 === 4 : mx % 8 === 4)) return B.AIR; return B.BIRCH_PLANKS; }
    const fl = my === 1 || my === 6;
    if (fl && (mx === 4 || mx === 20) && (mz === 4 || mz === 14)) return chest(LOOT_MANSION, mz === 4 ? 0 : 2);
    if (fl && mz === 17 && mx >= 10 && mx <= 14) return B.BOOKSHELF;
    if (fl && (mx === 12) && (mz === 13)) return B.TABLE;
    if (fl && mx > 9 && mx < 15 && mz > 10 && mz < 16) return B.RED_CARPET;
    if (my === 3 && (mx === 4 || mx === 20) && mz === 9) return B.LANTERN;
    return B.AIR;
  }
  if (my <= 13) { const k = my - 10; if (mx < k || mx > W - k || mz < k || mz > D - k) return undefined; return mx === k || mx === W - k || mz === k || mz === D - k ? DOP() : (k === 3 ? B.DARK_OAK_SLAB : B.AIR); }
  return undefined;
}
const CELLS = { outpost: outpostCell, hut: hutCell, mansion: mansionCell };

// Draw this chunk's part of any building here. ok(site) decides whether this world gets it (world.js).
export function stampStructures(gen, data, x0, z0, ok, idx) {
  for (const s of structuresNear(gen, x0 + 8, z0 + 8)) {
    if (s.x0 > x0 + CHUNK - 1 || s.x0 + s.w - 1 < x0 || s.z0 > z0 + CHUNK - 1 || s.z0 + s.d - 1 < z0) continue;
    if (!ok(s)) continue;
    const cell = CELLS[s.kind];
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const mx = x0 + lx - s.x0, mz = z0 + lz - s.z0;
      if (mx < 0 || mz < 0 || mx >= s.w || mz >= s.d) continue;
      for (let my = -1; my <= s.h + 2; my++) {
        const y = s.y0 + my;
        if (y <= 0 || y >= HEIGHT) continue;
        const v = cell(mx, my, mz);
        if (v !== undefined) data[idx(lx, y, lz)] = v;
        else if (my > 0) data[idx(lx, y, lz)] = B.AIR;   // clear trees and leaves out of the way
      }
      // a foundation down to the ground (the hut stands on its stilts instead)
      const base = s.kind === "hut" ? ((mx === 0 || mx === 6) && (mz === 0 || mz === 6 || mz === 8) ? B.SPRUCE_LOG : null) : B.COBBLE;
      if (base) for (let y = s.y0 - 2; y > 0; y--) { const v = data[idx(lx, y, lz)]; if (v !== B.AIR && v !== B.WATER && v !== B.TALL_GRASS) break; data[idx(lx, y, lz)] = base; }
    }
  }
}
// Where each building's residents stand (main.js spawns them the first time you come near)
export function residentsOf(s) {
  const at = (mx, my, mz) => ({ x: s.x0 + mx + 0.5, y: s.y0 + my, z: s.z0 + mz + 0.5 });
  if (s.kind === "outpost") return [["pillager", at(4, 14, 3), true], ["pillager", at(3, 0, -2)], ["pillager", at(6, 0, 10)], ["pillager", at(-2, 0, 5)], ["vindicator", at(10, 0, 4)]];
  if (s.kind === "hut") return [["witch", at(3, 4, 3)]];
  return [["vindicator", at(5, 1, 5)], ["vindicator", at(19, 1, 13)], ["vindicator", at(12, 6, 4)], ["evoker", at(12, 6, 14)], ["pillager", at(12, 1, 3)]];
}
export const STRUCT_NAMES = { outpost: "Pillager Outpost", hut: "Witch Hut", mansion: "Woodland Mansion" };
