// Milestone 20, Part B: the six new trees (spruce, jungle, acacia, dark oak, cherry, mangrove).
// treeShape() lists every block of one tree relative to its base, so the same shapes can grow from a sapling
// (main.js growWood) and be placed by the land generator for the new biomes (Part C).
import { B } from "./blocks.js";

// Each entry: [dx, dy, dz, block, isWood]. dy = 0 is the block the sapling stands in. Wood replaces anything soft;
// leaves only fill empty space.
export function treeShape(kind, r) {
  const out = [], wood = (dx, dy, dz, v) => out.push([dx, dy, dz, v, true]), leaf = (dx, dy, dz, v) => out.push([dx, dy, dz, v, false]);
  const disk = (cx, y, cz, rad, v, cut = 0.4) => {
    for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) {
      const d = Math.hypot(dx, dz);
      if (d > rad + 0.3) continue;
      if (d > rad - 0.6 && r() < cut) continue;   // ragged edges
      leaf(cx + dx, y, cz + dz, v);
    }
  };
  if (kind === "spruce") {   // a tall cone that narrows in steps
    const h = 7 + Math.floor(r() * 3), L = B.SPRUCE_LEAVES;
    for (let y = 0; y < h; y++) wood(0, y, 0, B.SPRUCE_LOG);
    for (let y = 2; y <= h; y++) { const fromTop = h - y; disk(0, y, 0, fromTop === 0 ? 0 : Math.min(3, 1 + (fromTop >> 1) - (fromTop % 2 ? 0 : 1)), L, 0.15); }
    leaf(0, h + 1, 0, L);
  } else if (kind === "jungle") {   // tall and bare with a round crown on top
    const h = 8 + Math.floor(r() * 5), L = B.JUNGLE_LEAVES;
    for (let y = 0; y < h; y++) wood(0, y, 0, B.JUNGLE_LOG);
    [[h - 2, 3], [h - 1, 3], [h, 2], [h + 1, 1]].forEach(([y, rad]) => disk(0, y, 0, rad, L));
  } else if (kind === "acacia") {   // a trunk that leans to one side, then a flat umbrella of leaves
    const h = 5 + Math.floor(r() * 2), L = B.ACACIA_LEAVES, [sx, sz] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)];
    let x = 0, z = 0;
    for (let y = 0; y < h; y++) { if (y >= 3 && y < 5) { x += sx; z += sz; } wood(x, y, z, B.ACACIA_LOG); }
    disk(x, h, z, 3, L, 0.5); disk(x, h + 1, z, 1, L, 0);
  } else if (kind === "dark_oak") {   // a thick 2 × 2 trunk under a wide, low, dark crown
    const h = 6 + Math.floor(r() * 3), L = B.DARK_OAK_LEAVES;
    for (let y = 0; y < h; y++) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) wood(dx, y, dz, B.DARK_OAK_LOG);
    for (const [y, rad] of [[h - 2, 4], [h - 1, 4], [h, 3], [h + 1, 2]]) {
      for (let dx = -rad; dx <= rad + 1; dx++) for (let dz = -rad; dz <= rad + 1; dz++) {
        const d = Math.hypot(dx - 0.5, dz - 0.5);
        if (d <= rad + 0.2 && !(d > rad - 0.7 && r() < 0.35)) leaf(dx, y, dz, L);
      }
    }
  } else if (kind === "cherry") {   // a short trunk under a wide pink cloud, with blossoms hanging from the edges
    const h = 5 + Math.floor(r() * 2), L = B.CHERRY_LEAVES;
    for (let y = 0; y < h; y++) wood(0, y, 0, B.CHERRY_LOG);
    [[h - 2, 3], [h - 1, 4], [h, 3], [h + 1, 2]].forEach(([y, rad]) => disk(0, y, 0, rad, L, 0.3));
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) { const d = Math.hypot(dx, dz); if (d > 3 && d < 4.3 && r() < 0.35) leaf(dx, h - 2, dz, L), leaf(dx, h - 3, dz, L); }
  } else if (kind === "mangrove") {   // stands on arching roots, with a leafy top
    const h = 5 + Math.floor(r() * 3), L = B.MANGROVE_LEAVES;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { wood(dx, 0, dz, B.MANGROVE_ROOTS); wood(dx, 1, dz, B.MANGROVE_ROOTS); }
    for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) if (r() < 0.6) wood(dx, 0, dz, B.MANGROVE_ROOTS);
    wood(0, 0, 0, B.MANGROVE_ROOTS); wood(0, 1, 0, B.MANGROVE_ROOTS);
    for (let y = 2; y < h + 2; y++) wood(0, y, 0, B.MANGROVE_LOG);
    [[h, 3], [h + 1, 3], [h + 2, 2], [h + 3, 1]].forEach(([y, rad]) => disk(0, y + 0, 0, rad, L));
  } else if (kind === "azalea") {   // Milestone 20, Part D: a short oak trunk under a round azalea bush
    const h = 4 + Math.floor(r() * 2), L = B.AZALEA_LEAVES;
    for (let y = 0; y < h; y++) wood(0, y, 0, B.LOG);
    [[h - 1, 2], [h, 2], [h + 1, 1]].forEach(([y, rad]) => disk(0, y, 0, rad, L, 0.3));
  } else if (kind === "red_mushroom") {   // Milestone 20, Part C: a stem under a dome-shaped red cap
    const h = 5 + Math.floor(r() * 3), C = B.RED_MUSHROOM_BLOCK;
    for (let y = 0; y < h; y++) wood(0, y, 0, B.MUSHROOM_STEM);
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2, corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
      if (corner) continue;
      if (edge) for (let y = h - 3; y < h; y++) wood(dx, y, dz, C);
      if (Math.abs(dx) < 2 && Math.abs(dz) < 2) wood(dx, h, dz, C);
    }
  } else if (kind === "brown_mushroom") {   // a stem under a wide, flat brown cap
    const h = 5 + Math.floor(r() * 3), C = B.BROWN_MUSHROOM_BLOCK;
    for (let y = 0; y < h; y++) wood(0, y, 0, B.MUSHROOM_STEM);
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (!(Math.abs(dx) === 3 && Math.abs(dz) === 3)) wood(dx, h, dz, C);
  }
  return out;
}
// Trees that need 4 saplings in a square (like Java's dark oak)
export const NEEDS_SQUARE = new Set(["dark_oak"]);
