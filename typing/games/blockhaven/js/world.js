// Holds the blocks of the world in 16×16 columns ("chunks") and remembers every change the player makes.
import { B, CHUNK, HEIGHT, idOf, lightOf } from "./blocks.js";
import { idx, LEGACY_CHUNK_GEN, ENCHANT_GEN, BIOME_GEN, MONUMENT_GEN, STRUCT_GEN } from "./worldgen.js";
import { MONUMENT_SIZE } from "./ocean-monument.js";
import { VILLAGE_ARCHITECTURE_GEN } from "./village-architecture.js";
import { GRAND_VILLAGE_GEN, settlementRecord } from "./grand-villages.js";

export const chunkKey = (cx, cz) => cx + "," + cz;

export class World {
  constructor(gen) {
    this.gen = gen;
    this.chunks = new Map();       // loaded chunks: key → { cx, cz, data, dirty, meshed, mesh }
    this.mods = new Map();         // player changes: key → Map(index → block value). Saved with the world.
    this.containers = new Map();   // chests and furnaces: "x,y,z" → contents
    this.settlements = new Map();  // discovered Grand Villages, indexed by plaza chunk
    this.dirtyQueue = new Set();   // chunks that need their 3D shape rebuilt
    this.entityStore = new Map();  // creatures waiting in unloaded chunks: key → [saved creature]
    this.visited = new Set();      // chunks that already got their starting animals
    this.newGen = new Set();       // (older worlds only) chunks first made with the newest land features
    this.regions = new Map();      // (older worlds only) Milestone 20: 256 × 256 squares → 1 if they get the new biomes, 0 if not. Saved.
    this.crops = new Set();        // "x,y,z" of crops and saplings that grow over time
    this.editCount = 0;            // bumps on every block change (creatures re-plan their paths)
    this.onLoad = null; this.onUnload = null;
    this.onSet = null;            // the signal engine listens for every block change
  }
  // [sky light, torch light] at a block, if that chunk has been drawn
  lightAt(x, y, z) {
    if (y >= HEIGHT) return [15, 0];
    if (y < 0) return [0, 0];
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), c = this.chunks.get(chunkKey(cx, cz));
    if (!c || !c.sky) return null;
    const i = idx(x - cx * CHUNK, y, z - cz * CHUNK);
    return [c.sky[i], c.blk[i]];
  }

  chunkAt(x, z) { return this.chunks.get(chunkKey(Math.floor(x / CHUNK), Math.floor(z / CHUNK))); }

  // Make a chunk's blocks (generate the natural land, then re-apply the player's changes)
  load(cx, cz) {
    const key = chunkKey(cx, cz);
    let c = this.chunks.get(key);
    if (c) return c;
    const m = this.mods.get(key);
    // older worlds: places the player already changed keep their original shapes; untouched places get new features
    let opts = {};
    if (this.gen.version < LEGACY_CHUNK_GEN) {
      const fresh = !m || this.newGen.has(key);
      if (fresh) this.newGen.add(key);
      opts = { version: fresh ? LEGACY_CHUNK_GEN : this.gen.version, cane: fresh };
    } else if (this.gen.lateFeatures && this.gen.version < ENCHANT_GEN) {
      // Milestone 15: sugar cane grows only in land nobody has visited or changed (remembered once decided)
      const fresh = (!m && !this.visited.has(key)) || this.newGen.has(key);
      if (fresh) this.newGen.add(key);
      opts = { cane: fresh };
    } else if (this.gen.version === BIOME_GEN) {
      // Milestone 17, Part A: worlds made at land version 17 get the ocean floor only in chunks nobody has visited or changed
      const fresh = (!m && !this.visited.has(key)) || this.newGen.has(key);
      if (fresh) this.newGen.add(key);
      opts = { sea: fresh };
    }
    if (this.gen.lateFeatures && this.gen.version < BIOME_GEN) opts.biomes = this.biomeRegion(cx, cz);   // Milestone 20, Part C
    if (this.gen.version >= BIOME_GEN && this.gen.version < MONUMENT_GEN) opts.monumentOk = s => this.monumentOk(s);   // Milestone 17, Part C
    if (this.gen.lateFeatures && this.gen.version < STRUCT_GEN) opts.structureOk = s => this.structureOk(s);   // Milestone 23, Part D
    const furnishings = [];
    if (this.gen.version >= VILLAGE_ARCHITECTURE_GEN) {
      opts.addContents = (x, y, z, value, contents) => furnishings.push({ x, y, z, value, contents });
    }
    if (this.gen.version >= GRAND_VILLAGE_GEN) opts.addSettlement = p => {
      const id = p.settlement.id;
      if (!this.settlements.has(id)) this.settlements.set(id, settlementRecord(p));
    };
    let data = this.gen.generate(cx, cz, opts);
    if (!(data instanceof Uint32Array)) data = Uint32Array.from(data);   // room for block ids 256 and up (the block limit step)
    if (m) for (const [i, v] of m) data[i] = v;
    for (const { x, y, z, value, contents } of furnishings) {
      const i = idx(x - cx * CHUNK, y, z - cz * CHUNK), position = x + "," + y + "," + z;
      if (data[i] === value && !m?.has(i) && !this.containers.has(position)) {
        this.containers.set(position, structuredClone(contents));
      }
    }
    c = { cx, cz, key, data, dirty: true, mesh: null };
    this.chunks.set(key, c);
    if (this.onLoad) this.onLoad(c);
    return c;
  }
  // Milestone 20, Part E: the biome at a spot, as the land there was actually made (new biomes only where they were allowed)
  hasNewBiomes(x, z) { return !!this.gen.landBiome && (this.gen.version >= BIOME_GEN || this.regions.get((Math.floor(x / CHUNK) >> 4) + "," + (Math.floor(z / CHUNK) >> 4)) === 1); }
  biomeAt(x, z) { if (!this.gen.landBiome) return null; const c = this.gen.column(x, z); return this.hasNewBiomes(x, z) ? this.gen.landBiome(c, x, z) : c.biome; }
  caveBiomeAt(x, z) { return this.hasNewBiomes(x, z) && this.gen.caveBiome ? this.gen.caveBiome(Math.floor(x / CHUNK) * CHUNK + 8, Math.floor(z / CHUNK) * CHUNK + 8) : null; }
  // Milestone 20, Part C: an older world's square of 16 × 16 chunks gets the new biomes only if nobody has been anywhere in it
  // (no chunk visited, no block changed). Decided the first time any of its land is made, then remembered forever.
  biomeRegion(cx, cz) {
    const rx = cx >> 4, rz = cz >> 4, rk = rx + "," + rz;
    let d = this.regions.get(rk);
    if (d === undefined) {
      d = 1;
      for (let i = 0; i < 16 && d; i++) for (let j = 0; j < 16; j++) { const k = chunkKey(rx * 16 + i, rz * 16 + j); if (this.visited.has(k) || this.mods.has(k)) { d = 0; break; } }
      this.regions.set(rk, d);
    }
    return d === 1;
  }
  // Milestone 17, Part C: may this Ocean Monument stand in this world? New worlds: always. Worlds made at land version
  // 17 or 18: only if nobody had been anywhere on its spot when it was first decided (remembered in `regions`).
  monumentOk(s) {
    if (this.gen.version >= MONUMENT_GEN) return true;
    if (this.gen.version < BIOME_GEN) return false;
    const rk = "m:" + s.key;
    let d = this.regions.get(rk);
    if (d === undefined) {
      d = 1;
      for (let i = Math.floor((s.x0 - 16) / CHUNK); i <= Math.floor((s.x0 + MONUMENT_SIZE + 16) / CHUNK) && d; i++)
        for (let j = Math.floor((s.z0 - 16) / CHUNK); j <= Math.floor((s.z0 + MONUMENT_SIZE + 16) / CHUNK); j++) { const k = chunkKey(i, j); if (this.visited.has(k) || this.mods.has(k) || this.chunks.has(k)) { d = 0; break; } }
      this.regions.set(rk, d);
    }
    return d === 1;
  }
  // Milestone 23, Part D: may this outpost, witch hut or mansion stand in this world? New worlds: always. Older worlds:
  // only if nobody had been on or near its spot when it was first decided (remembered in `regions`), and (huts,
  // mansions) only where the new biomes are.
  structureOk(s) {
    if (!this.gen.lateFeatures) return false;
    if (this.gen.version >= STRUCT_GEN) return true;
    if (s.newLand && !this.hasNewBiomes(s.cx, s.cz)) return false;
    const rk = "s:" + s.key;
    let d = this.regions.get(rk);
    if (d === undefined) {
      d = 1;
      for (let i = Math.floor((s.x0 - 16) / CHUNK); i <= Math.floor((s.x0 + s.w + 16) / CHUNK) && d; i++)
        for (let j = Math.floor((s.z0 - 16) / CHUNK); j <= Math.floor((s.z0 + s.d + 16) / CHUNK); j++) {
          const k = chunkKey(i, j), under = i * CHUNK <= s.x0 + s.w && i * CHUNK + CHUNK > s.x0 && j * CHUNK <= s.z0 + s.d && j * CHUNK + CHUNK > s.z0;
          if (this.visited.has(k) || this.mods.has(k) || (under && this.chunks.has(k))) { d = 0; break; }
        }
      this.regions.set(rk, d);
    }
    return d === 1;
  }
  structuresHere(x, z) { return this.gen.structuresNear ? this.gen.structuresNear(x, z).filter(s => this.structureOk(s)) : []; }
  // the monument covering this chunk, if this world has one there
  monumentAt(cx, cz) {
    if (!this.gen.monumentsNear) return null;
    for (const s of this.gen.monumentsNear(cx * CHUNK + 8, cz * CHUNK + 8))
      if (s.x0 <= cx * CHUNK + CHUNK - 1 && s.x0 + MONUMENT_SIZE - 1 >= cx * CHUNK && s.z0 <= cz * CHUNK + CHUNK - 1 && s.z0 + MONUMENT_SIZE - 1 >= cz * CHUNK && this.monumentOk(s)) return s;
    return null;
  }
  unload(c) { if (this.onUnload) this.onUnload(c); this.chunks.delete(c.key); this.dirtyQueue.delete(c); }

  get(x, y, z) {
    if (y < 0) return this.gen.isEnd?.() ? B.AIR : B.BEDROCK;
    if (y >= HEIGHT) return B.AIR;
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const c = this.chunks.get(chunkKey(cx, cz));
    if (!c) return B.BEDROCK;   // not loaded yet: treat as solid so nobody falls through
    return c.data[idx(x - cx * CHUNK, y, z - cz * CHUNK)];
  }
  id(x, y, z) { return idOf(this.get(x, y, z)); }
  isLoaded(x, z) { return !!this.chunkAt(x, z); }

  // soft = only the block's state changed (a wire's power, a lamp turning on): its shape and collision stay the same,
  // so creatures don't need new paths and the chunk is redrawn at most a few times a second.
  set(x, y, z, v, soft) {
    if (y < 0 || y >= HEIGHT) return false;
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), key = chunkKey(cx, cz);
    const c = this.chunks.get(key);
    if (!c) return false;
    const i = idx(x - cx * CHUNK, y, z - cz * CHUNK), old = c.data[i];
    c.data[i] = v;
    let m = this.mods.get(key);
    if (!m) { m = new Map(); this.mods.set(key, m); }
    m.set(i, v);
    const lightChanged = lightOf(old) !== lightOf(v);
    if (soft) { c.dirty = true; c.soft = true; this.dirtyQueue.add(c); }
    else { this.editCount++; c.dirty = true; c.urgent = true; this.dirtyQueue.add(c); }
    // the neighbors whose light could change need new shapes
    if (!soft || lightChanged) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const n = this.chunks.get(chunkKey(cx + dx, cz + dz));
      if (n) { n.dirty = true; if (soft) n.soft = true; this.dirtyQueue.add(n); }
    }
    if (this.onSet && old !== v) this.onSet(x, y, z, v, old);
    if (World.onAnySet && old !== v) World.onAnySet(this, x, y, z, v);   // Play Together sends the host's changes to friends
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
