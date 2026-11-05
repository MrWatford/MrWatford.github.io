// Packaged hand-built maps (the Deep, the Echo Expanse, and Surface structures like the temples).
// A map is built once during development (tools/lost-build.html), packed as runs of (block, count) per chunk,
// gzipped, and shipped in maps/. The game unpacks a chunk only when it's needed, so a big map stays light in memory.
// KEEP (65535) means "leave the natural land here": Surface structures use it around their edges.
import { CHUNK, HEIGHT } from "./blocks.js";

export const KEEP = 65535;
const MAGIC = 0x424d5031;   // "BMP1"

// grid: { get(x, y, z) } over [x0, x0 + sx) × [z0, z0 + sz), both multiples of 16
export function packMap(grid, x0, z0, sx, sz, meta) {
  const chunks = [], key = [], cxN = sx / CHUNK, czN = sz / CHUNK, data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
  for (let cz = 0; cz < czN; cz++) for (let cx = 0; cx < cxN; cx++) {
    for (let y = 0; y < HEIGHT; y++) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) data[lx + lz * CHUNK + y * CHUNK * CHUNK] = grid.get(x0 + cx * CHUNK + lx, y, z0 + cz * CHUNK + lz);
    const out = []; let prev = data[0], run = 0;
    for (let i = 0; i < data.length; i++) { if (data[i] === prev && run < 65535) run++; else { out.push(prev, run); prev = data[i]; run = 1; } }
    out.push(prev, run);
    chunks.push(Uint16Array.from(out)); key.push((x0 / CHUNK + cx) + "," + (z0 / CHUNK + cz));
  }
  const head = new TextEncoder().encode(JSON.stringify({ ...meta, area: { x0, z0, sx, sz }, keys: key }));
  const total = 8 + head.length + chunks.reduce((s, c) => s + 4 + c.length * 2, 0);
  const buf = new ArrayBuffer(total), dv = new DataView(buf);
  let o = 0;
  dv.setUint32(o, MAGIC, true); o += 4; dv.setUint32(o, head.length, true); o += 4;
  new Uint8Array(buf, o, head.length).set(head); o += head.length;
  for (const c of chunks) { dv.setUint32(o, c.length, true); o += 4; for (let i = 0; i < c.length; i++) { dv.setUint16(o, c[i], true); o += 2; } }
  return new Uint8Array(buf);
}
export function unpackMap(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o = 0;
  if (dv.getUint32(o, true) !== MAGIC) throw new Error("That isn't a Blockhaven map file.");
  o += 4;
  const hl = dv.getUint32(o, true); o += 4;
  const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes.buffer, bytes.byteOffset + o, hl))); o += hl;
  const runs = new Map();
  for (const k of meta.keys) { const len = dv.getUint32(o, true); o += 4; runs.set(k, new Uint16Array(bytes.buffer.slice(bytes.byteOffset + o, bytes.byteOffset + o + len * 2))); o += len * 2; }
  delete meta.keys;
  return { meta, runs, has: k => runs.has(k), decode: k => decodeRuns(runs.get(k)) };
}
function decodeRuns(r) {
  const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
  let p = 0;
  for (let k = 0; k < r.length; k += 2) { data.fill(r[k], p, p + r[k + 1]); p += r[k + 1]; }
  return data;
}
export async function gzip(bytes) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer()); }
export async function gunzip(bytes) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()); }
const cache = new Map();
export function loadMap(url) {
  if (!cache.has(url)) cache.set(url, (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("A map file couldn't be downloaded (" + url + ").");
    return unpackMap(await gunzip(new Uint8Array(await res.arrayBuffer())));
  })().catch(e => { cache.delete(url); throw e; }));
  return cache.get(url);
}

// A simple editable grid for building maps (development only)
export class Grid {
  constructor(x0, z0, sx, sz, fill = 0) { this.x0 = x0; this.z0 = z0; this.sx = sx; this.sz = sz; this.data = new Uint16Array(sx * sz * HEIGHT).fill(fill); }
  inside(x, y, z) { return x >= this.x0 && x < this.x0 + this.sx && z >= this.z0 && z < this.z0 + this.sz && y >= 0 && y < HEIGHT; }
  i(x, y, z) { return (x - this.x0) + (z - this.z0) * this.sx + y * this.sx * this.sz; }
  get(x, y, z) { return this.inside(x, y, z) ? this.data[this.i(x, y, z)] : 0; }
  id(x, y, z) { const v = this.get(x, y, z); return v === KEEP ? -1 : v & 255; }
  set(x, y, z, v) { if (this.inside(x, y, z)) this.data[this.i(x, y, z)] = v; }
  box(x0, y0, z0, x1, y1, z1, v) {
    for (let y = Math.max(0, Math.min(y0, y1)); y <= Math.min(HEIGHT - 1, Math.max(y0, y1)); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      if (!this.inside(x, y, z)) continue;
      const nv = typeof v === "function" ? v(x, y, z, this.data[this.i(x, y, z)]) : v;
      if (nv !== undefined) this.data[this.i(x, y, z)] = nv;
    }
  }
  walls(x0, y0, z0, x1, y1, z1, v) { this.box(x0, y0, z0, x1, y1, z0, v); this.box(x0, y0, z1, x1, y1, z1, v); this.box(x0, y0, z0, x0, y1, z1, v); this.box(x1, y0, z0, x1, y1, z1, v); }
  ball(cx, cy, cz, rx, ry, rz, v) { this.box(Math.floor(cx - rx), Math.floor(cy - ry), Math.floor(cz - rz), Math.ceil(cx + rx), Math.ceil(cy + ry), Math.ceil(cz + rz), (x, y, z, old) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1 ? (typeof v === "function" ? v(x, y, z, old) : v) : undefined); }
}

// Walking search used by the build checks: which standing spots can a player reach on foot from `start`?
// solid(id) and hazard(id) describe blocks; steps up 1, drops up to 4, swims up through water.
export function walkable(grid, start, solid, hazard, limit = 400000) {
  const S = (x, y, z) => { const id = grid.id(x, y, z); return id > 0 && solid(id); };
  const water = (x, y, z) => grid.id(x, y, z) === 11;
  const open = (x, y, z) => !S(x, y, z) && !hazard(grid.id(x, y, z));
  const stand = (x, y, z) => (S(x, y - 1, z) || water(x, y - 1, z) || water(x, y, z)) && !hazard(grid.id(x, y - 1, z)) && open(x, y, z) && open(x, y + 1, z);
  const seen = new Set(), key = (x, y, z) => x + "," + y + "," + z, q = [[start.x, start.y, start.z]];
  seen.add(key(start.x, start.y, start.z));
  for (let h = 0; h < q.length && seen.size < limit; h++) {
    const [x, y, z] = q[h];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const dy of [0, 1, -1, -2, -3, -4]) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (!grid.inside(nx, ny, nz) || seen.has(key(nx, ny, nz))) continue;
      if (dy === 1 && S(x, y + 2, z)) continue;
      if (!stand(nx, ny, nz)) continue;
      if (dy < 0) { let clear = true; for (let k = 0; k >= dy; k--) if (!open(nx, y + k, nz) || !open(nx, y + k + 1, nz)) clear = false; if (!clear) continue; }
      seen.add(key(nx, ny, nz)); q.push([nx, ny, nz]); break;
    }
    if (water(x, y, z) && !seen.has(key(x, y + 1, z)) && open(x, y + 1, z)) { seen.add(key(x, y + 1, z)); q.push([x, y + 1, z]); }
  }
  return { seen, near(t, r = 2) { for (let dy = -2; dy <= 2; dy++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (seen.has(key(t.x + dx, t.y + dy, t.z + dz))) return true; return false; } };
}
