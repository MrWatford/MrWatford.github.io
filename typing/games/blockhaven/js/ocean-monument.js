// Milestone 17, Part C: the Ocean Monument, a big prismarine fortress on the floor of a deep sea.
// It is 56 × 56 blocks and 19 tall, built from one rule per block (monumentCell), so every chunk it touches can draw
// its own part without knowing about the others. Local coordinates: x and z run 0-55, y 0 is the floor plate.
import { B } from "./blocks.js";

export const MONUMENT_SIZE = 56, MONUMENT_TOP = 18, MONUMENT_CELL = 384;
// Where the three Elder Guardians wait (local x, y, z): one in each front wing, one in the top chamber
export const ELDER_SPOTS = [[5.5, 6, 6.5], [50.5, 6, 6.5], [27.5, 13, 31.5]];
// The big hall's open water, for Guardians that come back to guard it
export const HALL = { x0: 7, x1: 48, z0: 11, z1: 48, y0: 1, y1: 10 };

const W = B.WATER, P = B.PRISMARINE, BR = B.PRISMARINE_BRICKS, D = B.DARK_PRISMARINE, L = B.SEA_LANTERN;
const inBox = (x, y, z, x0, x1, y0, y1, z0, z1) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const shell = (x, y, z, x0, x1, y0, y1, z0, z1) => inBox(x, y, z, x0, x1, y0, y1, z0, z1) && (x === x0 || x === x1 || y === y0 || y === y1 || z === z0 || z === z1);

// The block at one spot of the monument (local coordinates). Everything inside its outline that isn't stone is water.
export function monumentCell(x, y, z) {
  if (y === 0) return (x % 8 === 4 && z % 8 === 4) ? L : D;   // the floor plate, lit every 8 blocks
  // the gold vault in the middle of the hall: 8 gold blocks sealed in dark prismarine
  if (inBox(x, y, z, 25, 30, 1, 6, 28, 33)) return inBox(x, y, z, 27, 28, 2, 3, 30, 31) ? B.GOLD_BLOCK : D;
  // two sponge rooms in the back corners: brick walls and a ceiling of wet sponges
  for (const x0 of [7, 41]) if (inBox(x, y, z, x0, x0 + 7, 1, 6, 42, 48)) {
    if (y === 6) return x === x0 || x === x0 + 7 || z === 42 || z === 48 ? BR : B.WET_SPONGE;
    if (x === x0 || x === x0 + 7 || z === 48 || (z === 42 && !(x >= x0 + 3 && x <= x0 + 4 && y <= 3))) return BR;
    return W;
  }
  // the front wings (towers), where two Elder Guardians live
  for (const x0 of [0, 44]) if (inBox(x, y, z, x0, x0 + 11, 1, 15, 0, 13)) {
    if (y === 15) return (x === x0 + 5 || x === x0 + 6) && (z === 6 || z === 7) ? L : D;
    const wall = x === x0 || x === x0 + 11 || z === 0 || z === 13;
    if (!wall) return y === 8 && (x === x0 + 1 || x === x0 + 10) && z % 4 === 2 ? L : W;
    if (z === 13 && x >= x0 + 4 && x <= x0 + 7 && y <= 4) return W;   // a passage into the big hall
    if (y % 5 === 0) return D;   // dark bands
    return (y === 11 || y === 12) && (x + z) % 4 === 1 ? W : BR;   // little windows high up
  }
  // the porch: two pillars and a lintel in front of the door
  if (inBox(x, y, z, 21, 34, 1, 9, 3, 9)) {
    if ((x === 21 || x === 34) && (z === 4 || z === 8)) return y === 9 ? D : P;
    if (y === 9 && (z === 4 || z === 8)) return D;
    return W;
  }
  // the central tower on the roof: the Elder Guardian's top chamber
  if (inBox(x, y, z, 18, 37, 11, 18, 22, 41)) {
    if (y === 18) return (x === 27 || x === 28) && (z === 31 || z === 32) ? L : D;
    if (y === 11 && !(x >= 25 && x <= 30 && z >= 29 && z <= 34) && x > 18 && x < 37 && z > 22 && z < 41) return BR;   // its floor, with a hole down into the hall
    if (x === 18 || x === 37 || z === 22 || z === 41) return y === 14 && (x + z) % 3 === 0 ? W : y === 17 ? D : BR;
    return W;
  }
  // the big hall
  if (inBox(x, y, z, 6, 49, 1, 11, 10, 49)) {
    if (y === 11) return (x % 6 === 3 && z % 6 === 3) ? L : (x === 6 || x === 49 || z === 10 || z === 49 ? D : P);   // the roof
    const wall = x === 6 || x === 49 || z === 10 || z === 49;
    if (wall) {
      if (z === 10 && x >= 25 && x <= 30 && y <= 6) return W;   // the front door
      if ((y === 5 || y === 6) && (x + z) % 6 === 0) return W;   // windows
      return y === 10 ? D : y === 8 && (x + z) % 6 === 3 ? L : BR;
    }
    if ([14, 22, 33, 41].includes(x) && [18, 26, 37].includes(z)) return y === 10 ? L : D;   // pillars
    return W;
  }
  return W;
}
