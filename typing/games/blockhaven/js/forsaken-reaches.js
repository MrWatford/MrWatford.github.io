// The Outer Reaches: five new places in the Forsaken World's outer ring (between the packaged map, which ends at
// ±80, and the bedrock edge wall at ±128). Each one is a Forsaken Mutant's haunt with a lore note.
// The packaged map is never changed. The ring is generated land, so these are added as it's generated:
// applyReaches(cx, cz, data) runs inside ForsakenGen.generate for ring chunks (see worldgen.js), and any ring chunk a
// player had already changed before this update keeps its old shape (main.js passes those keys as `skip`).
import { B, CHUNK, HEIGHT } from "./blocks.js";

export const REACHES_VERSION = 1;
const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;
const seeded = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// where each place is (centers are at least 22 blocks inside the ring on every side)
export const REACHES = [
  { key: "camp", name: "Wayfarer's Rest", kind: "groaner", x: 8, z: -104, r: 13, floor: B.GRAVEL, note: "reach_camp" },
  { key: "graves", name: "The Hollow Graves", kind: "rattler", x: 104, z: 16, r: 14, floor: B.SOUL_SAND, note: "reach_graves" },
  { key: "crater", name: "The Blight Crater", kind: "hisser", x: 96, z: 96, r: 14, floor: B.BLACKSTONE, note: "reach_crater" },
  { key: "silk", name: "Silkwood Hollow", kind: "skitter", x: -104, z: -24, r: 14, floor: B.DIRT, note: "reach_silk" },
  { key: "gate", name: "The Sundered Gate", kind: "voidwalker", x: -92, z: 100, r: 14, floor: B.HOLLOWSTONE, note: "reach_gate" }
];
const PAD = 35;   // every place sits on flat ground at this height (blended into the hills around it)

// ---------- the buildings, as lists of blocks ----------
function build(area) {
  const out = new Map(), R = seeded(area.x * 7919 + area.z * 104729), { x: X, z: Z } = area, H = PAD;
  const set = (x, y, z, v) => out.set(x + "," + y + "," + z, v);
  const box = (x0, y0, z0, x1, y1, z1, v) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) set(x, y, z, typeof v === "function" ? v(x, y, z) : v); };
  const ritual = (cx, cz, mat) => {   // a ring of dark stone around a pale center: Herobrine's mark
    for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; set(Math.round(cx + Math.cos(t) * 3), H, Math.round(cz + Math.sin(t) * 3), mat); }
    set(cx, H, cz, B.PALE_BRICKS); set(cx + 1, H, cz, B.OBSIDIAN); set(cx - 1, H, cz, B.OBSIDIAN); set(cx, H, cz + 1, B.OBSIDIAN); set(cx, H, cz - 1, B.OBSIDIAN);
  };
  const deadTree = (x, z, hgt) => { for (let k = 1; k <= hgt; k++) set(x, H + k, z, B.LOG); if (R() < 0.7) set(x + 1, H + hgt - 1, z, B.LOG); if (R() < 0.7) set(x, H + hgt - 2, z - 1, B.LOG); };
  let note = null;
  if (area.key === "camp") {   // a travelers' camp torn apart: a gravel road, collapsed huts, broken fences, cold fire pits
    for (let z = Z + area.r + 8; z >= Z - 4; z--) for (let dx = -1; dx <= 1; dx++) set(X + dx + Math.round(Math.sin(z / 6)), H, z, B.GRAVEL);
    const hut = (hx, hz, broken) => {
      box(hx - 2, H + 1, hz - 2, hx + 2, H + 3, hz + 2, (x, y, z) => (Math.abs(x - hx) === 2 || Math.abs(z - hz) === 2) && !(broken && x > hx && y > H + 1) ? (Math.abs(x - hx) === 2 && Math.abs(z - hz) === 2 ? B.LOG : B.PLANKS) : B.AIR);
      set(hx, H + 1, hz + 2, B.AIR); set(hx, H + 2, hz + 2, B.AIR);
      if (!broken) box(hx - 2, H + 4, hz - 2, hx + 2, H + 4, hz + 2, B.BLACK_WOOL);
      else for (let k = 0; k < 6; k++) set(hx + 3 + Math.floor(R() * 3), H + 1, hz - 2 + Math.floor(R() * 5), R() < 0.5 ? B.PLANKS : B.LOG);
    };
    hut(X - 7, Z - 3, false); hut(X + 7, Z - 5, true); hut(X - 5, Z + 6, true);
    for (const [fx, fz] of [[X + 2, Z + 2], [X - 1, Z - 8]]) { for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(fx + dx, H + 1, fz + dz, B.COBBLE); set(fx, H + 1, fz, B.BASALT); }
    for (let x = X - 11; x <= X + 11; x++) if (R() < 0.55) set(x, H + 1, Z + 10, B.OAK_FENCE);
    set(X + 4, H + 1, Z + 9, B.HAY); set(X + 5, H + 1, Z + 9, B.HAY); set(X + 4, H + 2, Z + 9, B.HAY);
    for (let k = 0; k < 6; k++) { const ax = X - 9 + Math.floor(R() * 18), az = Z - 9 + Math.floor(R() * 18); set(ax, H, az, B.GRAVEL); set(ax, H + 1, az, B.AIR); }   // claw-like gouges
    ritual(X + 9, Z + 4, B.BLACKSTONE);
    note = { x: X - 7, y: H + 1, z: Z - 3 };
  } else if (area.key === "graves") {   // rows of old gravestones, a skull-topped arch, and a broken watchtower
    for (let gx = -10; gx <= 4; gx += 3) for (let gz = -9; gz <= 9; gz += 4) {
      if (R() < 0.15) continue;
      const x = X + gx, z = Z + gz, tall = R() < 0.3 ? 2 : 1;
      for (let k = 1; k <= tall; k++) set(x, H + k, z, R() < 0.4 ? B.MOSSY : B.STONE_BRICKS);
      set(x, H, z + 1, B.COBBLE); set(x, H, z + 2, R() < 0.5 ? B.GRAVEL : B.COBBLE);
    }
    box(X - 13, H + 1, Z - 2, X - 13, H + 4, Z - 2, B.STONE_BRICKS); box(X - 13, H + 1, Z + 2, X - 13, H + 4, Z + 2, B.STONE_BRICKS); box(X - 13, H + 5, Z - 2, X - 13, H + 5, Z + 2, B.MOSSY); set(X - 13, H + 6, Z, B.SKULL);
    for (let z = Z - 12; z <= Z + 12; z++) if (R() < 0.6 && Math.abs(z - Z) > 2) set(X - 13, H + 1, z, B.OAK_FENCE);
    const tx = X + 9, tz = Z - 1;   // the ruined tower: hollow, 7 × 7, its top half broken away on one side
    box(tx - 3, H + 1, tz - 3, tx + 3, H + 15, tz + 3, (x, y, z) => {
      const wall = Math.abs(x - tx) === 3 || Math.abs(z - tz) === 3;
      if (!wall) return B.AIR;
      if (y > H + 8 && x > tx && (y - H) > 8 + (z - tz + 3)) return B.AIR;
      if (z === tz - 3 && Math.abs(x - tx) <= 1 && y <= H + 3) return B.AIR;   // doorway
      return (x * 7 + y * 3 + z) % 5 === 0 ? B.MOSSY : B.STONE_BRICKS;
    });
    for (let y = H + 4; y <= H + 12; y += 4) box(tx - 2, y, tz - 2, tx + 2, y, tz + 2, (x, yy, z) => (x - tx) + (z - tz) > -2 ? B.PLANKS : B.AIR);   // broken floors
    ritual(X - 4, Z + 13, B.SOUL_SAND);
    note = { x: tx, y: H + 1, z: tz };
  } else if (area.key === "crater") {   // a scorched bowl of blackstone with pools of green sludge and charred stumps
    for (let dx = -area.r; dx <= area.r; dx++) for (let dz = -area.r; dz <= area.r; dz++) {
      const d = Math.hypot(dx, dz); if (d > area.r - 1) continue;
      const depth = Math.round(5 * (1 - (d / (area.r - 1)) ** 2));
      for (let y = H - depth + 1; y <= H; y++) set(X + dx, y, Z + dz, B.AIR);
      set(X + dx, H - depth, Z + dz, d < 4 ? B.BASALT : R() < 0.15 ? B.SOUL_SAND : B.BLACKSTONE);
      if (d < 9 && R() < 0.08) set(X + dx, H - depth + 1, Z + dz, B.GLOOP_BLOCK);
    }
    for (const [px, pz] of [[3, -2], [-4, 3], [1, 5], [-2, -5]]) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (Math.abs(a) + Math.abs(b) < 2) { const d = Math.hypot(px + a, pz + b), depth = Math.round(5 * (1 - (d / (area.r - 1)) ** 2)); set(X + px + a, H - depth + 1, Z + pz + b, B.GLOOP_BLOCK); }
    for (let k = 0; k < 7; k++) { const a = R() * Math.PI * 2, x = Math.round(X + Math.cos(a) * (area.r + 2)), z = Math.round(Z + Math.sin(a) * (area.r + 2)), hgt = 1 + Math.floor(R() * 3); for (let y = 1; y <= hgt; y++) set(x, H + y, z, B.BASALT); }
    for (let k = 0; k < 10; k++) { const a = R() * Math.PI * 2, rr = area.r + 1 + R() * 4; set(Math.round(X + Math.cos(a) * rr), H, Math.round(Z + Math.sin(a) * rr), B.BLACKSTONE); }
    const sx = X - area.r - 3, sz = Z;   // a research station's remains on the rim
    box(sx - 2, H + 1, sz - 2, sx + 2, H + 1, sz + 2, (x, y, z) => (Math.abs(x - sx) === 2 || Math.abs(z - sz) === 2) && R() < 0.7 ? B.COBBLE : B.AIR);
    set(sx + 1, H + 1, sz - 1, B.TABLE);
    ritual(X + 2, Z - area.r - 4, B.BLACKSTONE);
    note = { x: sx - 1, y: H + 1, z: sz + 1 };
  } else if (area.key === "silk") {   // dead trees wrapped in silk, egg clusters, and an old mine mouth in a hillside
    for (let k = 0; k < 22; k++) {
      const x = X - area.r + Math.floor(R() * area.r * 2), z = Z - area.r + Math.floor(R() * area.r * 2);
      if (Math.hypot(x - X, z - Z) < 4 || x > X + 6) continue;
      const hgt = 5 + Math.floor(R() * 4); deadTree(x, z, hgt);
      for (let y = 2; y <= hgt; y++) if (R() < 0.35) set(x + (R() < 0.5 ? 1 : -1), H + y, z, B.WOOL);   // silk cocoons
    }
    for (const [ex, ez] of [[X - 2, Z + 2], [X + 2, Z - 3], [X - 4, Z - 5]]) { set(ex, H + 1, ez, B.WOOL); set(ex + 1, H + 1, ez, B.WOOL); set(ex, H + 1, ez + 1, B.WOOL); set(ex, H + 2, ez, B.WOOL); }   // egg clusters
    const mx = X + 10, mz = Z;   // the mine mouth: a small stone hill with a timber-framed tunnel
    box(mx - 1, H + 1, mz - 5, mx + 6, H + 6, mz + 5, (x, y, z) => (y - H) <= 6 - Math.max(0, Math.abs(z - mz) - 2) ? B.STONE : B.AIR);
    box(mx - 1, H + 1, mz - 1, mx + 6, H + 3, mz + 1, B.AIR);
    for (let x = mx - 1; x <= mx + 6; x += 3) { set(x, H + 1, mz - 1, B.LOG); set(x, H + 2, mz - 1, B.LOG); set(x, H + 1, mz + 1, B.LOG); set(x, H + 2, mz + 1, B.LOG); box(x, H + 3, mz - 1, x, H + 3, mz + 1, B.PLANKS); }
    for (let x = mx - 1; x <= mx + 6; x++) set(x, H + 1, mz, B.RAIL);
    set(mx - 1, H + 1, mz - 1, B.WOOL); set(mx - 1, H + 3, mz, B.WOOL); set(mx - 1, H + 2, mz + 1, B.WOOL);   // silk across the entrance
    ritual(X - 9, Z + 9, B.SOUL_SAND);
    note = { x: mx - 2, y: H + 1, z: mz + 2 };
  } else if (area.key === "gate") {   // void ruins: broken pillars, a cracked floor, and a portal frame that leads nowhere
    for (let dx = -9; dx <= 9; dx++) for (let dz = -9; dz <= 9; dz++) if (Math.hypot(dx, dz) < 9.5 && R() < 0.85) set(X + dx, H, Z + dz, R() < 0.25 ? B.VIOLET_BRICKS : R() < 0.5 ? B.BLACKSTONE_BRICKS : B.HOLLOWSTONE);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2, x = Math.round(X + Math.cos(a) * 11), z = Math.round(Z + Math.sin(a) * 11), hgt = 2 + Math.floor(R() * 7);
      for (let y = 1; y <= hgt; y++) set(x, H + y, z, y === hgt && R() < 0.5 ? B.LUMEN_CRYSTAL : B.VIOLET_PILLAR);
    }
    box(X - 3, H + 1, Z, X + 3, H + 7, Z, (x, y, z) => { const edge = Math.abs(x - X) === 3 || y === H + 1 || y === H + 7; if (!edge) return B.AIR; if (x - X === 3 && y > H + 3) return B.AIR; if (y === H + 7 && x > X) return B.AIR; return B.OBSIDIAN; });
    set(X - 3, H + 8, Z, B.LUMEN_CRYSTAL); set(X, H + 7, Z, B.VIOLET_PILLAR);
    for (let k = 0; k < 12; k++) set(X - 6 + Math.floor(R() * 12), H + 1, Z - 6 + Math.floor(R() * 12), R() < 0.5 ? B.OBSIDIAN : B.BLACKSTONE_BRICKS);
    box(X - 1, H + 1, Z - 1, X + 1, H + 6, Z + 1, (x, y, z) => z === Z ? out.get(x + "," + y + "," + z) ?? B.AIR : B.AIR);   // keep the frame clear
    ritual(X, Z - 6, B.OBSIDIAN);
    note = { x: X + 5, y: H + 1, z: Z + 4 };
  }
  set(note.x, note.y, note.z, B.NOTE_STAND);
  area.notePos = note;
  return out;
}

// ---------- applying it while the ring is generated ----------
let built = null;
function prepare() {
  if (built) return built;
  built = new Map();   // chunk key → [[lx, y, lz, value], ...]
  for (const a of REACHES) {
    for (const [k, v] of build(a)) {
      const [x, y, z] = k.split(",").map(Number), cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), ck = cx + "," + cz;
      if (!built.has(ck)) built.set(ck, []);
      built.get(ck).push([x - cx * CHUNK, y, z - cz * CHUNK, v]);
    }
  }
  return built;
}
export function reachNotes() { prepare(); return REACHES.map(a => ({ key: a.note, pos: a.notePos, area: a.key })); }
export function applyReaches(cx, cz, data) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  let touched = false;
  for (const a of REACHES) {
    if (x0 + CHUNK < a.x - a.r - 9 || x0 > a.x + a.r + 9 || z0 + CHUNK < a.z - a.r - 9 || z0 > a.z + a.r + 9) continue;
    touched = true;
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {   // flatten the ground under the place, blending into the hills
      const d = Math.hypot(x0 + lx - a.x, z0 + lz - a.z); if (d > a.r + 8) continue;
      let top = HEIGHT - 2; while (top > 1 && (!data[idx(lx, top, lz)] || data[idx(lx, top, lz)] === B.LOG)) top--;   // the ground, not the bare trees
      if (data[idx(lx, top, lz)] === B.BEDROCK) continue;   // the edge wall stays
      const k = d < a.r ? 1 : 1 - (d - a.r) / 8, h = Math.round(top * (1 - k) + PAD * k);
      for (let y = 1; y < HEIGHT - 1; y++) data[idx(lx, y, lz)] = y < h - 3 ? B.STONE : y < h ? B.DIRT : y === h ? (d < a.r - 1 ? a.floor : B.GRASS) : B.AIR;
    }
  }
  if (!touched) return;
  const list = prepare().get(cx + "," + cz);
  if (list) for (const [lx, y, lz, v] of list) if (y > 0 && y < HEIGHT - 1) data[idx(lx, y, lz)] = v;
}
export function inReach(x, z, pad = 0) { return REACHES.find(a => Math.hypot(x - a.x, z - a.z) < a.r + pad) || null; }
