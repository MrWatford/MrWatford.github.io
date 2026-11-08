import { B, CHUNK } from "./blocks.js";
import { Grid, KEEP } from "./maps.js";
import { idx, MapGen } from "./worldgen.js";
import { SOLKARA_LIBRARY_RECORDS } from "./solkara-lore.js";

const X = -64, Z = 16, SIZE = 48, Y = 22;
const BRICK = B.SUN_BRICKS;
export const SOLKARA_ORDER = ["sun", "river", "star"];
export const SOLKARA_MARKS = [
  { x: -42, y: Y, z: 23, name: "star" },
  { x: -42, y: Y, z: 27, name: "sun" },
  { x: -42, y: Y, z: 31, name: "river" }
];
export const SOLKARA_MURAL = { x: -35, y: Y + 1, z: 28 };
export const SOLKARA_ALTAR = { x: -57, y: Y, z: 27 };
export const SOLKARA_GATE = { x: -61, y: Y + 2, z: 27 };
export const SOLKARA_LIBRARY = { x: -31, y: Y, z: 46 };
export const SOLKARA_VAULT = { x: -57, y: Y, z: 46 };
export const SOLKARA_WING_SWITCH = { x: -31, y: Y, z: 52 };
export const SOLKARA_SAND_TRAP = { x: -44, y: Y, z: 46, radius: 2.4 };
export const SOLKARA_SANCTUARY = "solkara_sanctuary";
export const SOLKARA_RETURN = { x: -21, y: Y, z: 19 };
export const isSolkaraRealm = dim => dim === "desert" || dim === SOLKARA_SANCTUARY;

export class SolkaraSanctuaryGen extends MapGen {
  constructor() {
    super({ meta: { fill: B.SANDSTONE, arrival: { x: -26, z: 19 } }, has: () => false }, SOLKARA_SANCTUARY);
    const annex = buildSolkaraAnnex(), wing = buildSolkaraWing();
    annex.cells[(SOLKARA_RETURN.x - annex.x) + (SOLKARA_RETURN.z - annex.z) * annex.size +
      SOLKARA_RETURN.y * annex.size * annex.size] = B.SOLKARA_GATE;
    this.stamps = [annex, wing];
  }
}

export function buildSolkaraAnnex() {
  const g = new Grid(X, Z, SIZE, SIZE, KEEP);
  const room = (x0, z0, x1, z1, h) => {
    g.box(x0, Y - 1, z0, x1, Y + h, z1, BRICK);
    g.box(x0 + 1, Y, z0 + 1, x1 - 1, Y + h - 1, z1 - 1, B.AIR);
  };
  room(-37, 17, -23, 34, 7); // Hall of the Buried Kings
  room(-49, 19, -38, 35, 6); // Chamber of Echoes
  room(-62, 20, -50, 34, 7); // Leviathan Altar and Sealed Gateway
  g.box(-24, Y - 1, 18, -21, Y - 1, 20, BRICK);
  g.box(-24, Y, 18, -21, Y + 3, 20, B.AIR);
  for (const [x0, x1] of [[-38, -37], [-50, -49]]) {
    g.box(x0, Y, 26, x1, Y + 3, 28, B.AIR);
  }
  for (const x of [-33, -28]) for (const z of [21, 31]) {
    g.box(x, Y, z, x, Y + 4, z, B.SUN_GLYPH);
    g.set(x, Y + 5, z, B.SHINESTONE);
  }
  // A dark stone aisle and brass-colored trim guide the eye to the mural.
  g.box(-34, Y - 1, 24, -25, Y - 1, 30, B.KEEPER_STONE);
  for (const z of [23, 31]) g.box(-34, Y - 1, z, -25, Y - 1, z, B.SUN_GLYPH);
  g.box(-36, Y + 4, 25, -36, Y + 4, 31, B.SUN_GLYPH);
  for (const z of [25, 31]) {
    g.box(-36, Y, z, -36, Y + 3, z, B.KEEPER_STONE);
    g.set(-35, Y + 2, z, B.SHINESTONE);
  }
  g.set(SOLKARA_MURAL.x, SOLKARA_MURAL.y, SOLKARA_MURAL.z, B.MURAL);
  for (const p of SOLKARA_MARKS) {
    g.set(p.x, p.y, p.z, B.KEEPER_SWITCH);
    g.set(p.x, p.y + 2, p.z, B.SHINESTONE);
    g.set(p.x, p.y - 1, p.z, p.name === "river" ? B.RESONANT_GLASS : p.name === "sun" ? B.SUN_GLYPH : B.QUARTZ_BLOCK);
  }
  for (const z of [22, 32]) {
    g.box(-60, Y, z, -60, Y + 4, z, B.KEEPER_STONE);
    g.set(-60, Y + 5, z, B.SHINESTONE);
  }
  g.box(-60, Y - 1, 24, -53, Y - 1, 30, B.KEEPER_STONE);
  g.box(-59, Y - 1, 26, -54, Y - 1, 28, B.SUN_GLYPH);
  g.set(SOLKARA_ALTAR.x, SOLKARA_ALTAR.y, SOLKARA_ALTAR.z, B.RELIC_PEDESTAL);
  g.box(-61, Y + 1, 24, -61, Y + 5, 30, B.SUN_GLYPH);
  g.box(-61, Y + 2, 25, -61, Y + 4, 29, B.KEEPER_STONE);
  g.set(SOLKARA_GATE.x, SOLKARA_GATE.y, SOLKARA_GATE.z, B.SOLKARA_GATE);
  return { x: X, z: Z, size: SIZE, cells: g.data };
}

export function buildSolkaraWing() {
  const g = new Grid(X, 32, SIZE, SIZE, KEEP);
  const room = (x0, z0, x1, z1) => {
    g.box(x0, Y - 1, z0, x1, Y + 6, z1, BRICK);
    g.box(x0 + 1, Y, z0 + 1, x1 - 1, Y + 5, z1 - 1, B.AIR);
  };
  room(-37, 37, -23, 57);
  room(-49, 40, -38, 52);
  room(-62, 39, -50, 54);
  g.box(-28, Y - 1, 34, -26, Y - 1, 38, BRICK);
  g.box(-28, Y, 34, -26, Y + 3, 38, B.AIR);
  for (const [x0, x1] of [[-38, -37], [-50, -49]]) g.box(x0, Y, 45, x1, Y + 3, 47, B.AIR);
  for (const x of [-35, -25]) for (let z = 40; z <= 54; z += 3) {
    g.box(x, Y, z, x, Y + 2, z + 1, B.BOOKSHELF);
    g.set(x, Y + 3, z, B.SHINESTONE);
  }
  g.set(SOLKARA_LIBRARY.x, Y, SOLKARA_LIBRARY.z, B.LORE_TABLET);
  for (const record of SOLKARA_LIBRARY_RECORDS) {
    const p = record.position;
    g.set(p.x, p.y, p.z, B.LORE_TABLET);
  }
  g.set(SOLKARA_WING_SWITCH.x, Y, SOLKARA_WING_SWITCH.z, B.KEEPER_SWITCH);
  g.box(-47, Y + 6, 42, -41, Y + 6, 50, B.SANDSTONE);
  for (const x of [-47, -41]) g.box(x, Y, 42, x, Y, 50, B.KEEPER_STONE);
  g.set(-44, Y + 5, 46, B.SAND);
  for (const x of [-60, -52]) for (const z of [42, 51]) {
    g.box(x, Y, z, x, Y + 3, z, B.SUN_GLYPH); g.set(x, Y + 4, z, B.SHINESTONE);
  }
  g.set(SOLKARA_VAULT.x, Y, SOLKARA_VAULT.z, B.RELIC_PEDESTAL);
  return { x: X, z: 32, size: SIZE, cells: g.data };
}

export function annexFits(stamp, data, reserved, bounds = { x0: -62, x1: -20, z0: 17, z1: 36 }) {
  const overwrites = (x, y, z) => {
    const sx = x - stamp.x, sz = z - stamp.z;
    return sx >= 0 && sx < stamp.size && sz >= 0 && sz < stamp.size &&
      y >= Y - 1 && y <= Y + 7 && stamp.cells[sx + sz * stamp.size + y * stamp.size * stamp.size] !== KEEP;
  };
  for (const [key, edits] of Object.entries(data.mods || {})) {
    const [cx, cz] = key.split(",").map(Number);
    for (const [i] of edits) {
      const x = i % CHUNK, z = Math.floor(i / CHUNK) % CHUNK, y = Math.floor(i / (CHUNK * CHUNK));
      if (idx(x, y, z) === i && overwrites(cx * CHUNK + x, y, cz * CHUNK + z)) return false;
    }
  }
  for (const [key] of data.containers || []) {
    const [x, y, z] = key.split(",").map(Number);
    if (Number.isFinite(y) && overwrites(x, y, z)) return false;
  }
  // Campaign stamps must have exclusive horizontal reservations.
  return reserved.every(s => s.x >= bounds.x1 || s.x + s.size <= bounds.x0 || s.z >= bounds.z1 || s.z + s.size <= bounds.z0);
}

export function solkaraMarkAt(hit) {
  return SOLKARA_MARKS.find(p => atSolkara(hit, p));
}

export function atSolkara(hit, p) {
  return hit.x === p.x && hit.y === p.y && hit.z === p.z;
}
