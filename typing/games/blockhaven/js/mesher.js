// Turns a chunk's blocks into triangles the graphics card can draw.
// Only faces that touch air (or see-through blocks) are drawn, and each corner gets
// sunlight, torchlight, and soft corner shadows.
import { B, CHUNK, HEIGHT, OPAQUE, idOf, metaOf, blockDef, faceTile, lightOf, OPEN, TOP, HEAD, TILE, ATLAS_W, ATLAS_H, DUST_LEVEL, COOL, FACEGLOW } from "./blocks.js";
import { model, dustConn, dustPoints } from "./shapes.js";
import { chunkKey } from "./world.js";
import { hash3 } from "./noise.js";

const M = 8, RW = CHUNK + 2 * M, AREA = RW * RW, SIZE = AREA * HEIGHT;
const vals = new Uint16Array(SIZE), sky = new Uint8Array(SIZE), blk = new Uint8Array(SIZE), cool = new Uint8Array(SIZE), queue = new Int32Array(SIZE * 2);
const ri = (x, y, z) => (x + M) + (z + M) * RW + y * AREA;

// Scratch buffers (reused for every chunk)
function makeBuf(maxQuads) { return { pos: new Float32Array(maxQuads * 12), uv: new Float32Array(maxQuads * 8), lt: new Float32Array(maxQuads * 12), cl: new Float32Array(maxQuads * 4), n: 0, max: maxQuads }; }
const solidBuf = makeBuf(60000), waterBuf = makeBuf(20000);

// Faces: normal direction, 4 corners, which texture face (0 top, 1 side, 2 bottom), brightness
const FACES = [
  { d: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], tex: 1, shade: 0.75 },
  { d: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], tex: 1, shade: 0.75 },
  { d: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], tex: 0, shade: 1 },
  { d: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], tex: 2, shade: 0.5 },
  { d: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], tex: 1, shade: 0.88 },
  { d: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], tex: 1, shade: 0.88 }
];
const FACING_DIR = [4, 0, 5, 1];   // meta facing 0..3 → which face is the "front"
const PF_FACE = [2, 3, 4, 0, 5, 1];   // 6-way facing (up, down, +z, +x, −z, −x) → face
// For each face corner: offsets (in the layer in front of the face) of side1, side2, corner neighbors
for (const f of FACES) {
  const axes = [0, 1, 2].filter(a => f.d[a] === 0);
  f.ao = f.c.map(c => {
    const s1 = [0, 0, 0], s2 = [0, 0, 0];
    s1[axes[0]] = c[axes[0]] ? 1 : -1; s2[axes[1]] = c[axes[1]] ? 1 : -1;
    const off = v => (v[0] + f.d[0]) + (v[2] + f.d[2]) * RW + (v[1] + f.d[1]) * AREA;
    return [off(s1), off(s2), off([s1[0] + s2[0], s1[1] + s2[1], s1[2] + s2[2]])];
  });
  f.front = f.d[0] + f.d[2] * RW + f.d[1] * AREA;
}
const AO = [0.42, 0.62, 0.8, 1];
const isWater = v => (v & 255) === B.WATER;

function quad(buf, pts, tile, uvs, lights) {
  if (buf.n >= buf.max) return;
  const p = buf.n * 12, u = buf.n * 8, tx = (tile % 16) * 16, ty = Math.floor(tile / 16) * 16;
  for (let k = 0; k < 4; k++) {
    buf.pos[p + k * 3] = pts[k][0]; buf.pos[p + k * 3 + 1] = pts[k][1]; buf.pos[p + k * 3 + 2] = pts[k][2];
    buf.uv[u + k * 2] = (tx + 0.02 + uvs[k][0] * 15.96) / ATLAS_W;
    buf.uv[u + k * 2 + 1] = 1 - (ty + 0.02 + (1 - uvs[k][1]) * 15.96) / ATLAS_H;
    buf.lt[p + k * 3] = lights[k][0]; buf.lt[p + k * 3 + 1] = lights[k][1]; buf.lt[p + k * 3 + 2] = lights[k][2];
    buf.cl[buf.n * 4 + k] = lights[k][3] || 0;   // cool (teal) light
  }
  buf.n++;
}
const UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
const TURNED_UV = [UV, [UV[1], UV[2], UV[3], UV[0]], [UV[2], UV[3], UV[0], UV[1]], [UV[3], UV[0], UV[1], UV[2]]];
const RANDOM_TOP = new Set([TILE.grass_top, TILE.dirt, TILE.stone, TILE.sand, TILE.leaves, TILE.birch_leaves]);

// Spread light outward, losing one level per block
function flood(L, start, end) {
  let head = start, tail = end;
  while (head < tail) {
    const i = queue[head++], l = L[i] - 1;
    if (l <= 0) continue;
    const y = Math.floor(i / AREA), rem = i - y * AREA, z = Math.floor(rem / RW), x = rem - z * RW;
    let j;
    if (x > 0 && L[j = i - 1] < l && !OPAQUE[vals[j] & 255]) { L[j] = l; queue[tail++] = j; }
    if (x < RW - 1 && L[j = i + 1] < l && !OPAQUE[vals[j] & 255]) { L[j] = l; queue[tail++] = j; }
    if (z > 0 && L[j = i - RW] < l && !OPAQUE[vals[j] & 255]) { L[j] = l; queue[tail++] = j; }
    if (z < RW - 1 && L[j = i + RW] < l && !OPAQUE[vals[j] & 255]) { L[j] = l; queue[tail++] = j; }
    if (y > 0 && L[j = i - AREA] < l && !OPAQUE[vals[j] & 255]) { L[j] = l; queue[tail++] = j; }
    if (y < HEIGHT - 1 && L[j = i + AREA] < l && !OPAQUE[vals[j] & 255]) { L[j] = l; queue[tail++] = j; }
  }
}

export function buildChunk(world, chunk, fancy) {
  const { cx, cz } = chunk;
  // 1) copy this chunk plus a border of its neighbors into one region
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = world.chunks.get(chunkKey(cx + dx, cz + dz));
    const xs = Math.max(-M, dx * CHUNK), xe = Math.min(CHUNK + M, dx * CHUNK + CHUNK);
    const zs = Math.max(-M, dz * CHUNK), ze = Math.min(CHUNK + M, dz * CHUNK + CHUNK);
    for (let y = 0; y < HEIGHT; y++) for (let z = zs; z < ze; z++) {
      const rowR = ri(xs, y, z), rowC = (xs - dx * CHUNK) + (z - dz * CHUNK) * CHUNK + y * CHUNK * CHUNK;
      for (let x = 0; x < xe - xs; x++) vals[rowR + x] = n ? n.data[rowC + x] : B.STONE;
    }
  }
  // 2) sunlight straight down each column, then spread sideways into overhangs and caves
  sky.fill(0); blk.fill(0); cool.fill(0);
  const tops = new Int16Array(AREA);
  for (let c = 0; c < AREA; c++) {
    let s = 15, y = HEIGHT - 1;
    for (; y >= 0; y--) {
      const id = vals[c + y * AREA] & 255;
      if (OPAQUE[id]) break;
      if (id === B.WATER || id === B.LEAVES || id === B.BIRCH_LEAVES) s = Math.max(0, s - 1);
      sky[c + y * AREA] = s;
    }
    tops[c] = y + 1;
  }
  let tail = 0;
  for (let z = 0; z < RW; z++) for (let x = 0; x < RW; x++) {
    const c = x + z * RW;
    let hi = tops[c];
    if (x > 0) hi = Math.max(hi, tops[c - 1]); if (x < RW - 1) hi = Math.max(hi, tops[c + 1]);
    if (z > 0) hi = Math.max(hi, tops[c - RW]); if (z < RW - 1) hi = Math.max(hi, tops[c + RW]);
    for (let y = tops[c]; y < hi; y++) if (sky[c + y * AREA] > 1) queue[tail++] = c + y * AREA;
    for (let y = 0; y < tops[c]; y++) if (sky[c + y * AREA] > 1) queue[tail++] = c + y * AREA;   // under water/leaves
  }
  flood(sky, 0, tail);
  // 3) torchlight (warm), then cool teal light from Echohold's crystals, moss nodes, and gate stones
  tail = 0; let coolN = 0;
  for (let i = 0; i < SIZE; i++) { const v = vals[i]; if (v && lightOf(v)) { if (COOL[v & 255]) { cool[i] = lightOf(v); coolN++; } else { blk[i] = lightOf(v); queue[tail++] = i; } } }
  flood(blk, 0, tail);
  if (coolN) { tail = 0; for (let i = 0; i < SIZE; i++) if (cool[i]) queue[tail++] = i; flood(cool, 0, tail); }

  // keep this chunk's light levels so creatures can check how dark a spot is
  if (!chunk.sky) { chunk.sky = new Uint8Array(CHUNK * CHUNK * HEIGHT); chunk.blk = new Uint8Array(CHUNK * CHUNK * HEIGHT); }
  for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < CHUNK; z++) {
    const r0 = ri(0, y, z), c0 = z * CHUNK + y * CHUNK * CHUNK;
    chunk.sky.set(sky.subarray(r0, r0 + CHUNK), c0);
    for (let x = 0; x < CHUNK; x++) chunk.blk[c0 + x] = Math.max(blk[r0 + x], cool[r0 + x]);   // creatures see both kinds of light
  }
  // 4) build faces for the blocks inside this chunk
  solidBuf.n = 0; waterBuf.n = 0;
  const lights = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  for (let y = 0; y < HEIGHT; y++) for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
    const i = ri(x, y, z), v = vals[i], id = v & 255;
    if (!id) continue;
    const def = blockDef(v);
    if (def.shape === "cube") {
      const frontDir = def.front6 ? PF_FACE[metaOf(v) & 7] : def.front ? FACING_DIR[metaOf(v) & 3] : -1;
      const glow = FACEGLOW[id];
      for (let f = 0; f < 6; f++) {
        const F = FACES[f];
        if ((y === 0 && f === 3) || (y === HEIGHT - 1 && f === 2)) continue;
        const ni = i + F.front, nv = vals[ni], nid = nv & 255;
        if (OPAQUE[nid]) continue;
        if (nid === id && def.render === "cutout" && (!fancy || id === B.GLASS)) continue;
        const tile = faceTile(v, F.tex, f === frontDir);
        // Rotate natural surfaces without moving the texture on doors, walls, or placed devices.
        const rotation = f === 2 && RANDOM_TOP.has(tile) ? Math.floor(hash3(0, cx * CHUNK + x, y, cz * CHUNK + z) * 4) : 0;
        const uv = TURNED_UV[rotation];
        for (let k = 0; k < 4; k++) {
          const [a, b, c] = F.ao[k];
          const s1 = OPAQUE[vals[i + a] & 255], s2 = OPAQUE[vals[i + b] & 255], cc = OPAQUE[vals[i + c] & 255];
          const ao = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
          let ls = sky[ni], lb = blk[ni], lc = cool[ni], cnt = 1;
          if (!s1) { ls += sky[i + a] | 0; lb += blk[i + a] | 0; lc += cool[i + a] | 0; cnt++; }
          if (!s2) { ls += sky[i + b] | 0; lb += blk[i + b] | 0; lc += cool[i + b] | 0; cnt++; }
          if (!cc && !(s1 && s2)) { ls += sky[i + c] | 0; lb += blk[i + c] | 0; lc += cool[i + c] | 0; cnt++; }
          lights[k][0] = ls / cnt / 15; lights[k][1] = lb / cnt / 15; lights[k][2] = F.shade * AO[ao]; lights[k][3] = Math.max(lc / cnt / 15, glow);
        }
        const pts = F.c.map(p => [x + p[0], y + p[1], z + p[2]]);
        // flip the square's diagonal so corner shadows look smooth
        if (lights[0][2] + lights[2][2] < lights[1][2] + lights[3][2]) quad(solidBuf, [pts[1], pts[2], pts[3], pts[0]], tile, TURNED_UV[(rotation + 1) & 3], [lights[1], lights[2], lights[3], lights[0]]);
        else quad(solidBuf, pts, tile, uv, lights);
      }
    } else if (def.shape === "water") {
      const above = vals[i + AREA];
      const topY = isWater(above) ? 1 : 0.88;
      for (let f = 0; f < 6; f++) {
        const F = FACES[f], ni = i + F.front, nv = vals[ni];
        if ((y === 0 && f === 3) || (y === HEIGHT - 1 && f === 2)) continue;
        if (isWater(nv) || OPAQUE[nv & 255]) continue;
        const l = [sky[ni] / 15, blk[ni] / 15, F.shade, Math.max(cool[ni], COOL[id] ? cool[i] : 0) / 15];
        const pts = F.c.map(p => [x + p[0], y + (p[1] ? topY : 0), z + p[2]]);
        quad(waterBuf, pts, faceTile(v, F.tex), UV, [l, l, l, l]);
      }
    } else if (def.shape === "endportal") {   // a flat starry surface
      const l = [1, 1, 1], L = [l, l, l, l], tile = faceTile(v, 0), h = y + 0.75;
      const q = [[x, h, z + 1], [x + 1, h, z + 1], [x + 1, h, z], [x, h, z]];
      quad(waterBuf, q, tile, UV, L); quad(waterBuf, [q[1], q[0], q[3], q[2]], tile, [UV[1], UV[0], UV[3], UV[2]], L);
    } else if (def.shape === "glow") {   // a glowing see-through cube
      const l = [1, 1, 1], tile = faceTile(v, 1);
      for (const F of FACES) quad(waterBuf, F.c.map(p => [x + p[0], y + p[1], z + p[2]]), tile, UV, [l, l, l, l]);
    } else if (def.shape === "portal") {   // a thin glowing sheet in the middle of the block
      const l = [1, 1, 1], L = [l, l, l, l], tile = faceTile(v, 1), alongX = !(metaOf(v) & 1);
      const q = alongX ? [[x, y, z + 0.5], [x + 1, y, z + 0.5], [x + 1, y + 1, z + 0.5], [x, y + 1, z + 0.5]] : [[x + 0.5, y, z + 1], [x + 0.5, y, z], [x + 0.5, y + 1, z], [x + 0.5, y + 1, z + 1]];
      quad(waterBuf, q, tile, UV, L); quad(waterBuf, [q[1], q[0], q[3], q[2]], tile, [UV[1], UV[0], UV[3], UV[2]], L);
    } else if (def.shape === "liquid") {   // lava: like water but glowing and solid-looking
      const topY = (vals[i + AREA] & 255) === id ? 1 : 0.88;
      for (let f = 0; f < 6; f++) {
        const F = FACES[f], ni = i + F.front, nv = vals[ni];
        if ((y === 0 && f === 3) || (y === HEIGHT - 1 && f === 2)) continue;
        if ((nv & 255) === id || OPAQUE[nv & 255]) continue;
        const l = [1, 1, F.shade];
        quad(solidBuf, F.c.map(p => [x + p[0], y + (p[1] ? topY : 0), z + p[2]]), faceTile(v, F.tex), UV, [l, l, l, l]);
      }
    } else if (def.shape === "farmland" || def.shape === "bed") {
      const top = def.shape === "bed" ? 9 / 16 : 15 / 16;
      const facing = metaOf(v) & 3;
      for (let f = 0; f < 6; f++) {
        const F = FACES[f], ni = i + F.front;
        if (f === 3 && OPAQUE[vals[ni] & 255]) continue;
        if (f !== 2 && f !== 3 && OPAQUE[vals[ni] & 255] && def.shape === "farmland") continue;
        const lc = f === 2 ? i : ni, l = [sky[lc] / 15, blk[lc] / 15, F.shade];
        const pts = F.c.map(p => [x + p[0], y + (p[1] ? top : 0), z + p[2]]);
        let uv = UV;
        if (f === 2 && def.shape === "bed") uv = [[[0, 0], [1, 0], [1, 1], [0, 1]], [[1, 0], [1, 1], [0, 1], [0, 0]], [[1, 1], [0, 1], [0, 0], [1, 0]], [[0, 1], [0, 0], [1, 0], [1, 1]]][facing];
        else if (f !== 2 && f !== 3) uv = [[0, 0], [1, 0], [1, top], [0, top]];
        quad(solidBuf, pts, faceTile(v, F.tex), uv, [l, l, l, l]);
      }
    } else if (def.shape === "crop") {   // four upright planes in a # pattern
      const l = [sky[i] / 15, blk[i] / 15, 0.9], L = [l, l, l, l], tile = faceTile(v, 1), yy = y - 1 / 16;
      for (const o of [0.25, 0.75]) {
        const qa = [[x + o, yy, z], [x + o, yy, z + 1], [x + o, yy + 1, z + 1], [x + o, yy + 1, z]];
        const qb = [[x, yy, z + o], [x + 1, yy, z + o], [x + 1, yy + 1, z + o], [x, yy + 1, z + o]];
        for (const q of [qa, qb]) { quad(solidBuf, q, tile, UV, L); quad(solidBuf, [q[1], q[0], q[3], q[2]], tile, [UV[1], UV[0], UV[3], UV[2]], L); }
      }
    } else if (def.shape === "cross" || def.shape === "torch") {
      const l = [sky[i] / 15, blk[i] / 15, def.shape === "torch" ? 1 : 0.9, cool[i] / 15], L = [l, l, l, l], tile = faceTile(v, 1);
      const a = def.shape === "torch" ? 0.3 : 0.15, b = 1 - a, h = def.shape === "torch" ? 0.75 : 1;
      const diag = [[[x + a, y, z + a], [x + b, y, z + b], [x + b, y + h, z + b], [x + a, y + h, z + a]], [[x + a, y, z + b], [x + b, y, z + a], [x + b, y + h, z + a], [x + a, y + h, z + b]]];
      const uv = h < 1 ? [[0, 0], [1, 0], [1, h], [0, h]] : UV;
      for (const q of diag) { quad(solidBuf, q, tile, uv, L); quad(solidBuf, [q[1], q[0], q[3], q[2]], tile, [uv[1], uv[0], uv[3], uv[2]], L); }
    } else if (def.shape === "head") {   // a small block sitting on the ground (skulls)
      const box = [0.25, 0, 0.25, 0.75, 0.5, 0.75], tile = faceTile(v, 1), l = [sky[i] / 15, blk[i] / 15, 1];
      for (const F of FACES) quad(solidBuf, F.c.map(p => [x + (p[0] ? box[3] : box[0]), y + (p[1] ? box[4] : box[1]), z + (p[2] ? box[5] : box[2])]), tile, UV, [l, l, l, l].map(q => [q[0], q[1], F.shade]));
    } else if (def.shape === "jelly") {   // Gloop and Honey Blocks: see-through, with a smaller cube inside
      const tile = faceTile(v, 1), ls = sky[i] / 15, lb = blk[i] / 15;
      for (let f = 0; f < 6; f++) {
        const F = FACES[f], nv = vals[i + F.front];
        if ((nv & 255) === id || OPAQUE[nv & 255]) continue;
        const l = [Math.max(ls, sky[i + F.front] / 15), Math.max(lb, blk[i + F.front] / 15), F.shade];
        quad(waterBuf, F.c.map(p => [x + p[0], y + p[1], z + p[2]]), tile, UV, [l, l, l, l]);
      }
      const a = 0.22, b = 0.78, l = [ls, lb, 0.8];
      for (const F of FACES) quad(waterBuf, F.c.map(p => [x + (p[0] ? b : a), y + (p[1] ? b : a), z + (p[2] ? b : a)]), tile, [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75]], [l, l, l, l]);
    } else if (def.shape === "rail") {
      drawRail(v, x, y, z, sky[i], blk[i]);
    } else if (def.shape === "dust") {
      const get = (dx, dy, dz) => { const yy = y + dy; return yy < 0 ? B.BEDROCK : yy >= HEIGHT ? 0 : vals[ri(x + dx, yy, z + dz)]; };
      drawDust(v, get, x, y, z, sky[i], blk[i]);
    } else if (def.shape === "model") {
      const get = (dx, dy, dz) => { const yy = y + dy; return yy < 0 ? B.BEDROCK : yy >= HEIGHT ? 0 : vals[ri(x + dx, yy, z + dz)]; };
      const mo = model(v, get), ls = sky[i] / 15, lb = blk[i] / 15, lc = cool[i] / 15;
      if (mo) { drawModel(mo, x, y, z, ls, lb, lc); if (mo.arms) for (const a of mo.arms) drawModel(a, x, y, z, ls, lb, lc); }
    } else if (def.shape === "door") {
      const meta = metaOf(v), box = doorBox(meta), tile = faceTile(v, 1), l = [sky[i] / 15, blk[i] / 15, 1, cool[i] / 15];
      for (const F of FACES) {
        const pts = F.c.map(p => [x + (p[0] ? box[3] : box[0]), y + (p[1] ? box[4] : box[1]), z + (p[2] ? box[5] : box[2])]);
        quad(solidBuf, pts, tile, UV, [l, l, l, l].map((q, k) => [q[0], q[1], F.shade, q[3]]));
        quad(solidBuf, [pts[1], pts[0], pts[3], pts[2]], tile, [UV[1], UV[0], UV[3], UV[2]], [l, l, l, l].map(q => [q[0], q[1], F.shade * 0.9, q[3]]));
      }
    }
  }
  return { solid: pack(solidBuf), water: pack(waterBuf) };
}

// ----- Sparkworks shapes -----
// Texture position (u, v) for a point on a box face, from the point's position in the model's own space, so textures are cropped, not squashed
function uvFor(f, lx, ly, lz) {
  switch (f) { case 0: return [1 - lz, ly]; case 1: return [lz, ly]; case 2: return [lx, 1 - lz]; case 3: return [lx, lz]; case 4: return [lx, ly]; default: return [1 - lx, ly]; }
}
const SHADE = [0.75, 0.75, 1, 0.5, 0.88, 0.88];
function drawModel(mo, x, y, z, ls, lb, lc = 0) {
  for (const part of mo.parts) {
    const b = part.b, sh = part.shear;
    for (let f = 0; f < 6; f++) {
      const F = FACES[f], pts = [], uvs = [];
      for (const c of F.c) {
        const lx = c[0] ? b[3] : b[0], ly = c[1] ? b[4] : b[1], lz = c[2] ? b[5] : b[2];
        let px = lx, pz = lz;
        if (sh) { px += sh[0] * (ly - b[1]); pz += sh[1] * (ly - b[1]); }
        const w = mo.T([px, ly, pz]);
        pts.push([x + w[0], y + w[1], z + w[2]]);
        uvs.push(uvFor(f, lx, ly, lz));
      }
      // shade by which way the face ends up pointing
      const ax = pts[1][0] - pts[0][0], ay = pts[1][1] - pts[0][1], az = pts[1][2] - pts[0][2], bx = pts[3][0] - pts[0][0], by = pts[3][1] - pts[0][1], bz = pts[3][2] - pts[0][2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, anx = Math.abs(nx), any = Math.abs(ny), anz = Math.abs(nz);
      const shade = any >= anx && any >= anz ? (ny > 0 ? SHADE[2] : SHADE[3]) : anx >= anz ? SHADE[0] : SHADE[4];
      const l = [ls, lb, shade, lc], tile = part.tiles[f === 2 ? 0 : f === 3 ? 2 : 1];
      quad(solidBuf, pts, tile, uvs, [l, l, l, l]);
    }
  }
}
// Rails: a flat strip (or a slope up to the next block). Curves use their own picture, turned to fit.
function drawRail(v, x, y, z, s, b) {
  const sh = Math.min(9, metaOf(v) & 15), tile = (v & 255) === B.RAIL && sh >= 6 ? TILE.rail_curve : faceTile(v, 1);
  const on = (v & 255) !== B.RAIL && (metaOf(v) & 16);
  const l = [s / 15, Math.max(b / 15, on ? 0.45 : 0), 1], L = [l, l, l, l], e = 1 / 16;
  const h = (lx, lz) => y + e + (sh === 2 ? lx : sh === 3 ? 1 - lx : sh === 4 ? 1 - lz : sh === 5 ? lz : 0);
  const C = [[0, 1], [1, 1], [1, 0], [0, 0]];
  const uv = C.map(([lx, lz]) => sh === 1 || sh === 2 || sh === 3 ? [lz, lx] : sh <= 5 ? [lx, 1 - lz] : sh === 6 ? [lx, 1 - lz] : sh === 7 ? [1 - lx, 1 - lz] : sh === 8 ? [1 - lx, lz] : [lx, lz]);
  quad(solidBuf, C.map(([lx, lz]) => [x + lx, h(lx, lz), z + lz]), tile, uv, L);
}
// Sparkdust: flat lines on the floor (and up the side of a block it climbs). Brighter the stronger the signal.
function drawDust(v, get, x, y, z, s, b) {
  const power = metaOf(v) & 15, k = DUST_LEVEL(power), line = TILE["dust_line" + k], dot = TILE["dust_dot" + k];
  const conn = dustConn(get), pts = dustPoints(v, conn), h = y + 1 / 64;
  const l = [s / 15, Math.max(b / 15, power ? 0.3 + power / 40 : 0), 1], L = [l, l, l, l];
  const flat = (x0, z0, x1, z1, tile, alongZ) => {
    const q = [[x + x0, h, z + z1], [x + x1, h, z + z1], [x + x1, h, z + z0], [x + x0, h, z + z0]];
    const uv = q.map(p => { const lx = p[0] - x, lz = p[2] - z; return alongZ ? [lz, lx] : [lx, 1 - lz]; });
    quad(solidBuf, q, tile, uv, L);
  };
  const n = pts.reduce((a, c) => a + c, 0), straight = n === 2 && pts[0] === pts[2];
  if (pts[1]) flat(0.5, 0, 1, 1, line, false);
  if (pts[3]) flat(0, 0, 0.5, 1, line, false);
  if (pts[0]) flat(0, 0.5, 1, 1, line, true);
  if (pts[2]) flat(0, 0, 1, 0.5, line, true);
  if (!straight) flat(0, 0, 1, 1, dot, false);
  // climbing up the side of a block
  const e = 0.01;
  for (let d = 0; d < 4; d++) {
    if (conn[d] !== 2) continue;
    let q;
    if (d === 0) q = [[1, 0, 1 - e], [0, 0, 1 - e], [0, 1, 1 - e], [1, 1, 1 - e]];
    else if (d === 1) q = [[1 - e, 0, 0], [1 - e, 0, 1], [1 - e, 1, 1], [1 - e, 1, 0]];
    else if (d === 2) q = [[0, 0, e], [1, 0, e], [1, 1, e], [0, 1, e]];
    else q = [[e, 0, 1], [e, 0, 0], [e, 1, 0], [e, 1, 1]];
    const uv = q.map(p => d % 2 ? [p[1], p[2]] : [p[1], p[0]]);
    quad(solidBuf, q.map(p => [x + p[0], y + p[1], z + p[2]]), line, uv, L);
  }
}

// The thin slab a door takes up inside its block: [x0, y0, z0, x1, y1, z1]
export function doorBox(meta) {
  const f = ((meta & 3) + (meta & OPEN ? 1 : 0)) % 4, t = 3 / 16;
  return [[0, 0, 1 - t, 1, 1, 1], [1 - t, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, t], [0, 0, 0, t, 1, 1]][f];
}

function pack(buf) {
  if (!buf.n) return null;
  const n = buf.n, index = new Uint32Array(n * 6);
  for (let q = 0; q < n; q++) { const b = q * 4, o = q * 6; index[o] = b; index[o + 1] = b + 1; index[o + 2] = b + 2; index[o + 3] = b; index[o + 4] = b + 2; index[o + 5] = b + 3; }
  return { pos: buf.pos.slice(0, n * 12), uv: buf.uv.slice(0, n * 8), lt: buf.lt.slice(0, n * 12), cl: buf.cl.slice(0, n * 4), index };
}
