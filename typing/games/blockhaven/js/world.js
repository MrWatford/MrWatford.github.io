// Holds the blocks of the world in 16×16 columns ("chunks") and remembers every change the player makes.
import { B, CHUNK, HEIGHT, idOf } from "./blocks.js";
import { idx } from "./worldgen.js";

export const chunkKey = (cx, cz) => cx + "," + cz;

export class World {
  constructor(gen) {
    this.gen = gen;
    this.chunks = new Map();       // loaded chunks: key → { cx, cz, data, dirty, meshed, mesh }
    this.mods = new Map();         // player changes: key → Map(index → block value). Saved with the world.
    this.containers = new Map();   // chests and furnaces: "x,y,z" → contents
    this.dirtyQueue = new Set();   // chunks that need their 3D shape rebuilt
  }

  chunkAt(x, z) { return this.chunks.get(chunkKey(Math.floor(x / CHUNK), Math.floor(z / CHUNK))); }

  // Make a chunk's blocks (generate the natural land, then re-apply the player's changes)
  load(cx, cz) {
    const key = chunkKey(cx, cz);
    let c = this.chunks.get(key);
    if (c) return c;
    const data = this.gen.generate(cx, cz);
    const m = this.mods.get(key);
    if (m) for (const [i, v] of m) data[i] = v;
    c = { cx, cz, key, data, dirty: true, mesh: null };
    this.chunks.set(key, c);
    return c;
  }
  unload(c) { this.chunks.delete(c.key); this.dirtyQueue.delete(c); }

  get(x, y, z) {
    if (y < 0) return B.BEDROCK;
    if (y >= HEIGHT) return B.AIR;
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const c = this.chunks.get(chunkKey(cx, cz));
    if (!c) return B.BEDROCK;   // not loaded yet: treat as solid so nobody falls through
    return c.data[idx(x - cx * CHUNK, y, z - cz * CHUNK)];
  }
  id(x, y, z) { return idOf(this.get(x, y, z)); }
  isLoaded(x, z) { return !!this.chunkAt(x, z); }

  set(x, y, z, v) {
    if (y < 0 || y >= HEIGHT) return false;
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), key = chunkKey(cx, cz);
    const c = this.chunks.get(key);
    if (!c) return false;
    const i = idx(x - cx * CHUNK, y, z - cz * CHUNK);
    c.data[i] = v;
    let m = this.mods.get(key);
    if (!m) { m = new Map(); this.mods.set(key, m); }
    m.set(i, v);
    // this chunk and the neighbors whose light could change need new shapes
    c.dirty = true; c.urgent = true; this.dirtyQueue.add(c);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const n = this.chunks.get(chunkKey(cx + dx, cz + dz));
      if (n) { n.dirty = true; this.dirtyQueue.add(n); }
    }
    return true;
  }

  // Highest block a player could stand on in this column
  surfaceY(x, z) {
    for (let y = HEIGHT - 1; y > 0; y--) { const id = this.id(x, y, z); if (id !== B.AIR && id !== B.TALL_GRASS && id !== B.FLOWER_RED && id !== B.FLOWER_YELLOW) return y; }
    return 1;
  }

  // ----- saving -----
  modsToJSON() {
    const out = {};
    for (const [k, m] of this.mods) if (m.size) out[k] = [...m];
    return out;
  }
  modsFromJSON(obj) {
    this.mods.clear();
    for (const k of Object.keys(obj || {})) this.mods.set(k, new Map(obj[k]));
  }
}
