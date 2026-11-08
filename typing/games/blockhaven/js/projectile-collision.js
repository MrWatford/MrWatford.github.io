import { blockBoxes } from './player.js';

const EPS = 1e-7;
const boxes = [];
// Repeated fireball returns must not grow collision work exponentially.
// Normal bow/spell launches retain their existing speeds.
export const MAX_DEFLECT_SPEED = 96;

// Closed segment versus box. A contact only at the departing endpoint is ignored.
export function segmentBoxTime(x, y, z, nx, ny, nz, x0, y0, z0, x1, y1, z1) {
  let enter = 0, exit = 1;
  const dx = nx - x, dy = ny - y, dz = nz - z;
  if (Math.abs(dx) < EPS) { if (x < x0 || x > x1) return null; }
  else { let a = (x0 - x) / dx, b = (x1 - x) / dx; if (a > b) { const swap = a; a = b; b = swap; } enter = Math.max(enter, a); exit = Math.min(exit, b); }
  if (Math.abs(dy) < EPS) { if (y < y0 || y > y1) return null; }
  else { let a = (y0 - y) / dy, b = (y1 - y) / dy; if (a > b) { const swap = a; a = b; b = swap; } enter = Math.max(enter, a); exit = Math.min(exit, b); }
  if (Math.abs(dz) < EPS) { if (z < z0 || z > z1) return null; }
  else { let a = (z0 - z) / dz, b = (z1 - z) / dz; if (a > b) { const swap = a; a = b; b = swap; } enter = Math.max(enter, a); exit = Math.min(exit, b); }
  return enter <= exit && exit > EPS ? enter : null;
}

// Existing substeps are <= 0.25 blocks: at most twelve candidate cells,
// including one row below for 1.5-block fences/gates (plus their link queries).
// Inspect both sides of exact voxel planes, and retain partial-block openings.
export function projectileBlockHit(world, x, y, z, nx, ny, nz, out) {
  let best = Infinity;
  for (let bx = Math.floor(Math.min(x, nx) - EPS); bx <= Math.floor(Math.max(x, nx) + EPS); bx++)
    for (let by = Math.floor(Math.min(y, ny) - EPS) - 1; by <= Math.floor(Math.max(y, ny) + EPS); by++)
      for (let bz = Math.floor(Math.min(z, nz) - EPS); bz <= Math.floor(Math.max(z, nz) + EPS); bz++) {
        boxes.length = 0;
        blockBoxes(world.get(bx, by, bz), bx, by, bz, boxes, world);
        for (const b of boxes) {
          const t = segmentBoxTime(x, y, z, nx, ny, nz, ...b);
          if (t !== null && t < best) { best = t; out.x = bx; out.y = by; out.z = bz; }
        }
      }
  boxes.length = 0;
  if (best === Infinity) return null;
  out.t = best; out.hx = x + (nx - x) * best; out.hy = y + (ny - y) * best; out.hz = z + (nz - z) * best;
  return out;
}
