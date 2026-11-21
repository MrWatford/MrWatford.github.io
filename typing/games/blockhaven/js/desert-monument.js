// The Grand Desert Temple: the huge raised temple complex around the Sunken Pyramid of Aurelis's surface entrance.
// Built from two reference videos Mr. Watford sent (a stepped, orange-striped platform; a ring of white columns with
// arches; a tiled courtyard with sunken pits and small stepped pyramids; a central stepped pyramid on a white base;
// a grand entrance with two stepped towers). The existing pyramid tip (from maps/surface-v1.bin) is lifted onto the
// central base unchanged, with its lift, tablet, and chest, so the temple below works exactly as before.
//
// Coordinates here are "monument-local": (0, 0) is the middle block of the old pyramid (site.x + 16, site.z + 16).
// +z is south (the old pyramid's doorway side), so the grand entrance faces south too.
import { B, HEIGHT, SEA } from "./blocks.js";

export const MONUMENT = {
  version: 1,
  ground: 36,        // the old stamp's ground level (its sand top); the platform's lowest step sits here
  top: 50,           // platform blocks; you walk at y 51
  podium: 55,        // the central base's top blocks; you walk at y 56 (the old pyramid's floor)
  dy: 19,            // how far the old pyramid is lifted (its floor was y 37, now y 56)
  half: 40,          // the walkway's outer edge (|x| or |z|)
  slope: 14,         // steps from the walkway down to the sand
  cell: 9,           // courtyard tile pitch; 7 × 7 tiles from -31 to 31
  stampHalf: 80,     // the stamp square: monument-local -80 … 95
  size: 176,
  foot: 30           // the stamp writes from this height up; below it, holes are filled down to solid ground
};
const KEEP = 65535;
const M = MONUMENT, S = M.size, O = M.stampHalf, P = M.top, Q = M.podium;
// The whole footprint (for overlap checks): monument-local bounds, inclusive
export const MONUMENT_BOUNDS = { x0: -76, x1: 76, z0: -76, z1: 80 };

// ---------- palette (change colors here, and the whole monument follows) ----------
const MAT = {
  wall: () => B.TEMPLE_STONE, trim: () => B.TEMPLE_TRIM, pillar: () => B.TEMPLE_PILLAR, step: () => B.TEMPLE_STEP,
  brazier: () => B.BRAZIER, fill: () => B.SANDSTONE, pyramid: () => B.SUN_BRICKS, gold: () => B.GOLD_BLOCK
};

// Builds the stamp. surfaceDecode(chunkKey) returns the packed Surface sheet's chunk (the old desert entrance lives in
// it at stamp.ox); returns { cells, size, braziers, posts, chestShift } with braziers/posts in monument-local coords.
export function buildMonument(surfaceDecode, desertStamp) {
  const cells = new Uint16Array(S * S * HEIGHT).fill(KEEP);
  const I = (x, y, z) => (x + O) + (z + O) * S + y * S * S;
  const inside = (x, y, z) => x + O >= 0 && x + O < S && z + O >= 0 && z + O < S && y >= 1 && y < HEIGHT;
  const put = (x, y, z, v) => { if (inside(x, y, z)) cells[I(x, y, z)] = v; };
  const get = (x, y, z) => inside(x, y, z) ? cells[I(x, y, z)] : KEEP;
  const box = (x0, y0, z0, x1, y1, z1, v) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(x, y, z, typeof v === "function" ? v(x, y, z) : v); };
  // a column: solid from the foundation up to `top`, then open sky
  const column = (x, z, top, mat) => { for (let y = M.foot; y < HEIGHT; y++) put(x, y, z, y < top ? MAT.fill() : y === top ? mat : 0); };
  const braziers = [], posts = [];
  const brazier = (x, y, z) => { put(x, y, z, MAT.brazier()); put(x, y + 1, z, B.FIRE); braziers.push({ x, y, z }); };
  // a walking surface at height s (whole number = a full block top; .5 = a half step on top of a full block)
  const surface = (x, z, s, mat = MAT.wall()) => {
    const whole = Math.floor(s);
    for (let y = M.foot; y < HEIGHT; y++) put(x, y, z, y < whole - 1 ? MAT.fill() : y === whole - 1 ? mat : 0);
    if (s !== whole) put(x, whole, z, MAT.step());
  };
  const d8 = (x, z) => Math.max(Math.abs(x), Math.abs(z));

  // ---------- 1. the platform, its stepped walls, and the entrance towers ----------
  const towerTop = (x, z) => (Math.abs(x) >= 8 && z >= 41) ? P - Math.max(0, z - 55, Math.abs(x) - 24) : -1;
  for (let z = -O; z < S - O; z++) for (let x = -O; x < S - O; x++) {
    const d = d8(x, z);
    let top = d <= M.half ? P : d <= M.half + M.slope ? P - (d - M.half) : -1;
    const t = towerTop(x, z); if (t >= M.ground && t > top) top = t;
    if (top < M.ground) continue;
    // stripes: orange lines run down the slopes every 9 blocks (in line with the columns), and down every corner seam
    const along = Math.abs(z) >= Math.abs(x) ? x : z, onSlope = top < P;
    const stripe = onSlope && (along % M.cell === 0 || Math.abs(x) === Math.abs(z) || (t === top && t < P && Math.abs(x) === 8));
    column(x, z, top, stripe ? MAT.trim() : MAT.wall());
  }

  // ---------- 2. the walkway band around the courtyard: orange-bordered tiles in a row ----------
  for (let z = -M.half; z <= M.half; z++) for (let x = -M.half; x <= M.half; x++) {
    const d = d8(x, z); if (d < 32) continue;
    const along = Math.abs(z) >= Math.abs(x) ? x : z;
    const edge = d === 32 || d === M.half || along % M.cell === 0;
    put(x, P, z, edge ? MAT.trim() : MAT.wall());
  }

  // ---------- 3. the courtyard: 7 × 7 tiles; the middle 3 × 3 is the pyramid's base ----------
  const cellOf = v => Math.floor((v + 31) / M.cell);            // 0 … 6
  const cellLocal = v => (v + 31) - cellOf(v) * M.cell;          // 0 … 8
  for (let z = -31; z <= 31; z++) for (let x = -31; x <= 31; x++) {
    const u = cellLocal(x), w = cellLocal(z);
    const ring = (u === 1 || u === 7) && w >= 1 && w <= 7 || (w === 1 || w === 7) && u >= 1 && u <= 7;
    put(x, P, z, ring ? MAT.trim() : MAT.wall());
  }
  const cellBox = (i, j) => ({ x0: -31 + i * M.cell, z0: -31 + j * M.cell });
  // ring 2 (the tiles around the base): stairs on the four sides, small pyramids in the corners, sunken pits between
  for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) {
    const ring = Math.max(Math.abs(i - 3), Math.abs(j - 3)); if (ring !== 2) continue;
    const { x0, z0 } = cellBox(i, j);
    if (i === 3 || j === 3) continue;                              // the base's stairways run through these
    if (Math.abs(i - 3) === 2 && Math.abs(j - 3) === 2) {          // a small stepped pyramid with a fire on top
      const cx = x0 + 4, cz = z0 + 4;
      for (let k = 0; k < 3; k++) box(cx - 3 + k, P + 1 + k, cz - 3 + k, cx + 3 - k, P + 1 + k, cz + 3 - k, (x, y, z) => (Math.abs(x - cx) === 3 - k && Math.abs(z - cz) === 3 - k) ? MAT.trim() : (k === 1 ? MAT.pyramid() : MAT.wall()));
      brazier(cx, P + 4, cz);
      continue;
    }
    // a sunken pit: 6 deep, orange rim, a stair down one wall, and a burning pillar in the middle
    const floor = P - 6;
    box(x0 + 1, floor, z0 + 1, x0 + 7, P, z0 + 7, 0);
    box(x0 + 1, floor - 1, z0 + 1, x0 + 7, floor - 1, z0 + 7, (x, y, z) => (x === x0 + 4 || z === z0 + 4) ? MAT.trim() : MAT.wall());
    for (let x = x0; x <= x0 + 8; x++) for (const z of [z0, z0 + 8]) put(x, P, z, MAT.trim());
    for (let z = z0; z <= z0 + 8; z++) for (const x of [x0, x0 + 8]) put(x, P, z, MAT.trim());
    // the walls get an orange band halfway down
    for (let x = x0 + 1; x <= x0 + 7; x++) for (const z of [z0, z0 + 8]) put(x, floor + 3, z, MAT.trim());
    for (let z = z0 + 1; z <= z0 + 7; z++) for (const x of [x0, x0 + 8]) put(x, floor + 3, z, MAT.trim());
    // steps down along the north wall (from the west end), one block at a time
    for (let k = 1; k <= 5; k++) box(x0 + k, floor, z0 + 1, x0 + k, P - k, z0 + 1, MAT.wall());
    box(x0 + 3, floor, z0 + 3, x0 + 5, P, z0 + 5, (x, y, z) => (y === P ? MAT.wall() : (x === x0 + 4 && z === z0 + 4) ? MAT.pillar() : MAT.wall()));
    brazier(x0 + 4, P + 1, z0 + 4);
    if ((i + j) % 4 === 3) posts.push({ role: "husk", x: x0 + 6, y: floor, z: z0 + 6, patrol: [{ x: x0 + 6, z: z0 + 6 }, { x: x0 + 2, z: z0 + 6 }, { x: x0 + 2, z: z0 + 3 }] });
  }
  // little lamp posts where the outer tiles meet (2 × 2 white posts with an orange cap); the four inner corners burn
  const g = [-23, -14, -5, 4, 13, 22];
  for (const a of g) for (const b of g) {
    if (!(Math.abs(a + 0.5) > 20 || Math.abs(b + 0.5) > 20) || a === -5 || a === 4 || b === -5 || b === 4) continue;   // (none next to the stairways)
    const corner = Math.abs(a + 0.5) > 20 && Math.abs(b + 0.5) > 20;
    box(a, P + 1, b, a + 1, P + 2, b + 1, MAT.pillar()); box(a, P + 3, b, a + 1, P + 3, b + 1, MAT.trim());
    if (corner) { brazier(a + (a < 0 ? 0 : 1), P + 4, b + (b < 0 ? 0 : 1)); }
  }

  // ---------- 4. the central base, its four stairways, and the old pyramid on top ----------
  box(-13, P + 1, -13, 13, Q, 13, (x, y, z) => {
    const rim = Math.abs(x) === 13 || Math.abs(z) === 13;
    return rim && (y === Q || y === P + 3) ? MAT.trim() : MAT.wall();
  });
  for (let dir = 0; dir < 4; dir++) {
    const rot = (a, b) => [[a, b], [-b, a], [-a, -b], [b, -a]][dir];   // a = across the stair, b = outward
    for (let b = 14; b <= 23; b++) {
      const k = b - 14, s = Q + 0.5 - k * 0.5;                   // 55.5 at the top step, down to 51 (the courtyard)
      for (let a = -4; a <= 4; a++) {
        const [x, z] = rot(a, b);
        if (Math.abs(a) === 4) { const top = Math.ceil(s) - 1; for (let y = P + 1; y < HEIGHT; y++) put(x, y, z, y <= top ? MAT.trim() : 0); continue; }
        const whole = Math.floor(s);
        for (let y = P + 1; y < HEIGHT; y++) put(x, y, z, y < whole ? MAT.wall() : 0);
        if (s !== whole) put(x, whole, z, MAT.step());
      }
    }
  }
  for (const [x, z] of [[-13, -13], [13, -13], [-13, 13], [13, 13]]) brazier(x, Q + 1, z);
  // the old pyramid tip (unchanged, lifted by dy)
  let chestShift = [];
  if (surfaceDecode && desertStamp) {
    const ox = desertStamp.ox, ss = desertStamp.size, D = desertStamp.ground, c = ss / 2;
    for (let cz = 0; cz < ss / 16; cz++) for (let cx = 0; cx < ss / 16; cx++) {
      const data = surfaceDecode((ox / 16 + cx) + "," + cz);
      for (let y = D + 1; y + M.dy < HEIGHT; y++) for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
        const v = data[lx + lz * 16 + y * 256]; if (v === KEEP || v === 0) continue;
        put(cx * 16 + lx - c, y + M.dy, cz * 16 + lz - c, v);
      }
    }
    chestShift = M.dy;
  }
  // a fire on the very top of the pyramid (the top layer is 3 × 3 at the old y 44, now 63)
  brazier(0, M.ground + 8 + M.dy + 1, 0);

  // ---------- 5. the colonnade: big white columns joined by arches, burning towers at the corners ----------
  const CT = P + 1, LIN = P + 10;   // columns stand from y 51; the arch lintel is y 60–61
  for (let side = 0; side < 4; side++) {
    const at = (t, depth) => [[t, -depth], [depth, t], [t, depth], [-depth, t]][side];
    for (let t = -36; t <= 36; t++) for (let depth = 36; depth <= 38; depth++) {
      const [x, z] = at(t, depth);
      const col = Math.abs(((t % 9) + 9) % 9 - 0) <= 1 || ((t % 9) + 9) % 9 === 8;   // within 1 of a multiple of 9
      const near = Math.round(t / 9) * 9, isCol = col && near !== 0 && Math.abs(near) <= 36;
      if (isCol) {
        put(x, CT, z, MAT.trim());
        for (let y = CT + 1; y <= CT + 7; y++) put(x, y, z, MAT.pillar());
        put(x, CT + 8, z, MAT.wall());
      } else {
        const gap = ((t % 9) + 9) % 9;   // 2 … 7 between two columns
        if (near !== 0 && (gap === 2 || gap === 7)) put(x, CT + 8, z, MAT.wall());   // arch shoulders
      }
      put(x, LIN, z, MAT.wall()); put(x, LIN + 1, z, depth === 37 ? MAT.wall() : MAT.trim());
      if (depth === 38 && ((t + 100) % 2 === 0)) put(x, LIN + 2, z, MAT.wall());   // battlements on the outside edge
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {   // corner towers: 5 × 5, a little taller, with a fire on top
    box(sx * 35, CT, sz * 35, sx * 39, LIN + 2, sz * 39, (x, y, z) => (y === CT || y === LIN + 2) ? MAT.trim() : MAT.pillar());
    brazier(sx * 37, LIN + 3, sz * 37);
  }
  // stairs up onto the colonnade (half steps against the inside face, rising toward each corner along north and south)
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    for (let k = 0; k < 22; k++) {
      const t = sx * (12 + k), s = CT + 0.5 + k * 0.5;   // 51.5 … 62
      for (const depth of [34, 35]) {
        const z = sz * depth, whole = Math.floor(s);
        for (let y = CT; y < LIN + 2; y++) put(t, y, z, y < whole ? MAT.wall() : y === whole && s !== whole ? MAT.step() : 0);
      }
    }
    for (const depth of [34, 35, 36]) put(sx * 34, LIN + 2, sz * depth, 0);   // a gap in the inner edge where the stair arrives
  }

  // ---------- 6. stairways down the outside: a grand one between the towers (south), plainer ones on the other sides ----------
  // (past the sand line, 8 more half steps go down to y 33 with nothing written above them: where the dunes are
  // higher they simply stay buried, and where the ground is lower you can still walk straight off the bottom)
  const buried = (x, z, s, mat) => { const whole = Math.floor(s); for (let y = M.foot; y < whole; y++) put(x, y, z, y < whole - 1 ? MAT.fill() : mat); if (s !== whole) put(x, whole, z, MAT.step()); };
  const stairway = (dir, halfW, from, steps) => {
    const rot = (a, b) => [[a, b], [-b, a], [-a, -b], [b, -a]][dir];
    for (let j = 0; j < steps + 8; j++) {
      const b = from + j, s = P + 0.5 - j * 0.5;
      for (let a = -halfW - 1; a <= halfW + 1; a++) {
        const [x, z] = rot(a, b), edge = Math.abs(a) === halfW + 1;
        if (j >= steps) { buried(x, z, edge ? Math.ceil(s) : s, edge ? MAT.trim() : MAT.wall()); continue; }
        if (edge) { const top = Math.ceil(s) - 1; column(x, z, Math.max(top, M.ground), MAT.trim()); continue; }
        surface(x, z, s);
      }
    }
  };
  stairway(0, 6, 43, 28);   // south: 13 wide, z 43 … 70
  for (const dir of [1, 2, 3]) stairway(dir, 3, 41, 28);
  // the landing between the towers, and the tower tops (double orange border, a grid of tiles, two rows of pillars)
  for (let z = 41; z <= 42; z++) for (let x = -6; x <= 6; x++) column(x, z, P, MAT.wall());
  for (const sx of [-1, 1]) {
    for (let z = 41; z <= 55; z++) for (let a = 8; a <= 24; a++) {
      const x = sx * a, u = a - 8, w = z - 41;
      const border = u === 0 || u === 16 || w === 0 || w === 14 || u === 2 || u === 14 || w === 2 || w === 12;
      const tile = (u >= 3 && u <= 13 && w >= 3 && w <= 11) && ((u - 3) % 4 === 0 || (w - 3) % 4 === 0);
      put(x, P, z, border || tile ? MAT.trim() : MAT.wall());
    }
    for (const a of [10, 22]) for (const z of [44, 48, 52]) { box(sx * a, P + 1, z, sx * a, P + 6, z, MAT.pillar()); put(sx * a, P + 7, z, MAT.trim()); }
    brazier(sx * 9, P + 1, 54); brazier(sx * 23, P + 1, 54);
    for (let y = M.foot; y <= M.ground + 1; y++) put(sx * 9, y, 72, MAT.wall());
    brazier(sx * 9, M.ground + 2, 72);   // fires at the foot of the grand stair (on posts beside it)
  }
  for (const sx of [-1, 1]) { put(sx * 7, P + 1, 41, MAT.trim()); brazier(sx * 7, P + 2, 41); }
  for (const dir of [1, 2, 3]) for (const a of [-5, 5]) { const [x, z] = [[a, 40], [-40, a], [-a, -40], [40, -a]][dir]; brazier(x, P + 1, z); }

  // ---------- 7. guard posts (monument-local; y = the floor block's top) ----------
  posts.push(
    { role: "sentinel", x: -3, y: P + 1, z: 41, patrol: [{ x: -3, z: 41 }, { x: 3, z: 41 }, { x: 0, z: 30 }] },
    { role: "sentinel", x: 0, y: Q + 1, z: 11, patrol: [{ x: -10, z: 11 }, { x: 10, z: 11 }] },
    { role: "sentinel", x: 0, y: Q + 1, z: -11, patrol: [{ x: 10, z: -11 }, { x: -10, z: -11 }] },
    { role: "guardian", x: -11, y: Q + 1, z: 0, patrol: [{ x: -11, z: -8 }, { x: -11, z: 8 }], rare: true },
    { role: "guardian", x: 16, y: P + 1, z: 50, patrol: [{ x: 16, z: 46 }, { x: 16, z: 53 }], rare: true },
    { role: "husk", x: -34, y: P + 1, z: -33, patrol: [{ x: -33, z: -33 }, { x: -33, z: 20 }] },
    { role: "husk", x: 33, y: P + 1, z: 33, patrol: [{ x: 33, z: 33 }, { x: 33, z: -20 }] },
    { role: "husk", x: -26, y: P + 1, z: 26, patrol: [{ x: -26, z: 26 }, { x: 0, z: 26 }] },
    { role: "husk", x: 26, y: P + 1, z: -26, patrol: [{ x: 26, z: -26 }, { x: 0, z: -26 }] },
    { role: "husk", x: -20, y: P + 1, z: 48, patrol: [{ x: -20, z: 44 }, { x: -12, z: 52 }] }
  );
  return { cells, size: S, braziers, posts, dy: chestShift || M.dy };
}

// The stamp record lost.js pushes into the generator: { x, z, size, cells, foot }
export function monumentStamp(built, cx, cz) {
  return { x: cx - O, z: cz - O, size: S, cells: built.cells, foot: { y: M.foot, mat: B.SANDSTONE }, monument: true };
}
// Chunk keys ("cx,cz") the monument's footprint touches, for a world centered at (cx, cz)
export function monumentChunks(cx, cz, pad = 0) {
  const out = [], b = MONUMENT_BOUNDS;
  for (let gx = Math.floor((cx + b.x0 - pad) / 16); gx <= Math.floor((cx + b.x1 + pad) / 16); gx++)
    for (let gz = Math.floor((cz + b.z0 - pad) / 16); gz <= Math.floor((cz + b.z1 + pad) / 16); gz++) out.push(gx + "," + gz);
  return out;
}

// ---------- the ground around it: a sand slope from the bottom step to the natural land, then a patchy fade to grass ----------
// SLOPE blocks wide: sand eases (with small dune bumps) from the temple's lowest step to the natural ground height, so
// the foundation is buried and every stair lands on sand. FADE blocks more: the ground stays natural height but turns
// from sand to grass in a ragged edge. Trees inside the slope (and just past it) are cleared; a few fallen temple stones,
// broken column stubs, and dry grass tufts are scattered about. Only columns outside the temple itself are touched.
export const APRON = { slope: 14, fade: 9, treeClear: 3 };
const REACH = APRON.slope + APRON.fade + APRON.treeClear, MG = REACH + 2, N = S + MG * 2;
export const APRON_PAD = REACH + 2;   // how far past MONUMENT_BOUNDS the ground can change (for the saved-world checks)
const hash = (x, z, k = 0) => { let h = (x * 374761393 + z * 668265263 + k * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (x, z, s) => {   // a smooth bumpy value in -1 … 1 (value noise on a grid of size s)
  const gx = Math.floor(x / s), gz = Math.floor(z / s), fx = x / s - gx, fz = z / s - gz, e = t => t * t * (3 - 2 * t);
  const v = (a, b) => hash(gx + a, gz + b, 7) * 2 - 1;
  const top = v(0, 0) + (v(1, 0) - v(0, 0)) * e(fx), bot = v(0, 1) + (v(1, 1) - v(0, 1)) * e(fx);
  return top + (bot - top) * e(fz);
};
// distance from every nearby column to the temple's edge, and the height of that edge (computed once)
function apronField(built) {
  if (built.apron) return built.apron;
  const dist = new Float32Array(N * N).fill(1e9), near = new Int32Array(N * N).fill(-1), topAt = new Uint8Array(N * N);
  for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
    if (built.cells[x + z * S + M.foot * S * S] === KEEP) continue;
    let t = M.foot; for (let y = HEIGHT - 1; y > M.foot; y--) { const v = built.cells[x + z * S + y * S * S]; if (v !== KEEP && v !== 0) { t = y; break; } }
    const i = (x + MG) + (z + MG) * N; dist[i] = 0; near[i] = i; topAt[i] = Math.min(t, M.ground);
  }
  const R2 = Math.SQRT2, pass = (i, j, w) => { if (dist[j] + w < dist[i]) { dist[i] = dist[j] + w; near[i] = near[j]; } };
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) { const i = x + z * N; if (x) pass(i, i - 1, 1); if (z) { pass(i, i - N, 1); if (x) pass(i, i - N - 1, R2); if (x < N - 1) pass(i, i - N + 1, R2); } }
  for (let z = N - 1; z >= 0; z--) for (let x = N - 1; x >= 0; x--) { const i = x + z * N; if (x < N - 1) pass(i, i + 1, 1); if (z < N - 1) { pass(i, i + N, 1); if (x < N - 1) pass(i, i + N + 1, R2); if (x) pass(i, i + N - 1, R2); } }
  return (built.apron = { dist, near, top: topAt });
}
const GROUND = new Set([B.GRASS, B.DIRT, B.SAND, B.STONE, B.SANDSTONE, B.GRAVEL, B.CLAY, B.SNOW, B.COBBLE]);
const PLANT = new Set([B.LOG, B.LEAVES, B.BIRCH_LOG, B.BIRCH_LEAVES, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.SAPLING, B.BERRY_BUSH]);
export function monumentApron(built, cx, cz) {
  const F = apronField(built), ox = cx - O - MG, oz = cz - O - MG, A = APRON;
  const idx = (lx, y, lz) => lx + lz * 16 + y * 256;
  return { x: ox, z: oz, size: N, apron: true, apply(gen, data, x0, z0) {
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      const x = x0 + lx, z = z0 + lz, gx = x - ox, gz = z - oz;
      if (gx < 0 || gz < 0 || gx >= N || gz >= N) continue;
      const i = gx + gz * N, d = F.dist[i]; if (d > REACH) continue;
      if (d === 0) {   // the temple itself; only the buried stair ends under the sand get touched (grass on them turns to sand)
        if (F.top[i] >= M.ground) continue;
        for (let y = HEIGHT - 2; y > F.top[i]; y--) { const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if (GROUND.has(id)) { if (id === B.GRASS || id === B.DIRT) data[idx(lx, y, lz)] = B.SAND; const a = data[idx(lx, y + 1, lz)] & 0xFFFF00FF; if (a === B.FLOWER_RED || a === B.FLOWER_YELLOW || a === B.SAPLING) data[idx(lx, y + 1, lz)] = B.AIR; break; } }
        continue;
      }
      // the ground here right now (trees and water don't count)
      let yT = 0, water = false;
      for (let y = HEIGHT - 2; y > 0; y--) { const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if (id === B.WATER) water = true; if (GROUND.has(id)) { yT = y; break; } }
      if (!yT) continue;
      const n = F.near[i], nTop = F.top[n], r = hash(x, z, 3);
      let g0 = nTop;
      if (nTop < M.ground) { const nx = (n % N) + ox, nz = Math.floor(n / N) + oz; g0 = Math.max(nTop, Math.min(M.ground, gen.column(nx, nz).h)); }   // a buried stair end: start from the ground there
      if (d <= A.slope) {
        const t = d / A.slope, ease = t * t * (3 - 2 * t);
        const dune = smooth(x, z, 7) * 1.6 * Math.sin(Math.PI * t) + smooth(x, z, 3) * 0.5 * Math.sin(Math.PI * t);
        const target = Math.max(2, Math.min(HEIGHT - 12, Math.round(g0 + (yT - g0) * ease + dune)));
        for (let y = Math.min(yT, target) - 3; y <= target; y++) if (y > 0) data[idx(lx, y, lz)] = y >= target - 2 ? B.SAND : B.SANDSTONE;
        for (let y = target + 1; y <= Math.min(HEIGHT - 2, Math.max(yT, target) + 14); y++) data[idx(lx, y, lz)] = water && y <= SEA ? B.WATER : B.AIR;
        // half-buried ruins: a fallen temple stone, now and then a broken column stub
        if (target > SEA && t > 0.15 && t < 0.85) {
          if (r < 0.0025) { data[idx(lx, target + 1, lz)] = B.TEMPLE_PILLAR; data[idx(lx, target, lz)] = B.TEMPLE_PILLAR; }   // a broken column stub
          else if (r < 0.008) data[idx(lx, target + 1, lz)] = r < 0.005 ? B.TEMPLE_STONE : B.SANDSTONE;   // a fallen stone
          else if (r < 0.022) data[idx(lx, target, lz)] = r < 0.016 ? B.TEMPLE_STONE : B.TEMPLE_TRIM;   // old paving showing through the sand
        }
        continue;
      }
      // past the slope: trees close to it are cleared, and the ground turns from sand to grass in a patchy edge
      if (d <= A.slope + A.treeClear) for (let y = yT + 1; y <= Math.min(HEIGHT - 2, yT + 14); y++) { const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if (PLANT.has(id)) data[idx(lx, y, lz)] = B.AIR; }
      else if (d <= A.slope + A.treeClear + 4) {   // leaves left hanging by a tree that was cleared (no trunk nearby in this chunk) go too
        for (let y = yT + 1; y <= Math.min(HEIGHT - 2, yT + 14); y++) {
          const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if (id !== B.LEAVES && id !== B.BIRCH_LEAVES) continue;
          let trunk = false, edge = false;
          for (let ax = -3; ax <= 3 && !trunk; ax++) for (let az = -3; az <= 3 && !trunk; az++) {
            const qx = lx + ax, qz = lz + az; if (qx < 0 || qz < 0 || qx > 15 || qz > 15) { edge = true; continue; }
            for (let ay = -5; ay <= 1; ay++) { const q = data[idx(qx, Math.max(1, y + ay), qz)] & 0xFFFF00FF; if (q === B.LOG || q === B.BIRCH_LOG) { trunk = true; break; } }
          }
          if (!trunk && !edge) data[idx(lx, y, lz)] = B.AIR;
        }
      }
      const f = (d - A.slope) / A.fade;   // 0 at the slope's edge, 1 at the outside
      const sandy = f + smooth(x, z, 4) * 0.35 + (r - 0.5) * 0.3 < 0.62;
      const top = data[idx(lx, yT, lz)] & 0xFFFF00FF;
      if (sandy && (top === B.GRASS || top === B.DIRT)) {
        for (let y = yT; y >= yT - 2 && y > 0; y--) { const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if (id === B.GRASS || id === B.DIRT) data[idx(lx, y, lz)] = B.SAND; }
        const above = data[idx(lx, yT + 1, lz)] & 0xFFFF00FF;
        if (above === B.FLOWER_RED || above === B.FLOWER_YELLOW || above === B.SAPLING || above === B.BERRY_BUSH) data[idx(lx, yT + 1, lz)] = B.AIR;
        if (above === 0 && yT >= SEA && r < 0.05) data[idx(lx, yT + 1, lz)] = B.TALL_GRASS;   // dry grass tufts
      }
    }
  } };
}
