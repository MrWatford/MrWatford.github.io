// Builds the natural world from a seed. The same seed always makes the same land.
import { Noise, hashSeed, rng, hash3 } from "./noise.js";
import { treeShape } from "./trees.js";
import { monumentCell, MONUMENT_SIZE, MONUMENT_TOP, MONUMENT_CELL } from "./ocean-monument.js";
import { stampStructures, structuresNear } from "./land-structures.js";   // Milestone 23, Part D
import { B, I, CHUNK, HEIGHT, SEA, make, EYE_IN, OPEN, TOP, HEAD, CORALS } from "./blocks.js";

import { isLanternVale, buildLanternValePlot } from "./lantern-vale.js";

import { VILLAGE_OVERHAUL_GEN, VILLAGE_TERRAIN_GEN, detailedVillagePiece, buildDetailedVillage, buildCompactVillage, villagePlotHasLandmark } from "./village-overhaul.js";
import { VILLAGE_ARCHITECTURE_GEN } from "./village-architecture.js";
import { GRAND_VILLAGE_GEN, grandVillagePlot } from "./grand-villages.js";
import { buildGrandVillage } from "./grand-village-build.js";
import { GRAND_CAPITAL_GEN } from "./stonehaven-grand.js";

export const LOOT = 4;   // chest meta bit: a ruin chest that fills with treasure when first opened
// Land versions: 1 = first release, 2 = deep lava, 3 = ruined portals, 4 = strongholds, 5 = villages + jade, 6 = bee nests + berry bushes. Raise this when generation changes.
export const LEGACY_CHUNK_GEN = 9;   // 7: Spark Ore; 8: village bells; 9: Hollow ships
// 16 (Milestone 15): sugar cane by the water. Lapis Ore is in every world (it only replaces buried stone).
export const ENCHANT_GEN = 16;
// 17 (Milestone 20, Part A): real oceans and deep oceans. Only brand-new worlds: oceans lower the land, and older worlds
// already have structures planned on today's land. Strongholds and the area around the world's middle stay dry.
export const BIOME_GEN = 17;
// 18 (Milestone 17, Part A): the ocean floor (kelp, seagrass, coral reefs, sea pickles, icebergs). It never changes the
// land's height. Worlds made at version 17 get it only in chunks nobody has visited or changed (world.js, remembered).
export const OCEAN_GEN = 18;
// Milestone 17, Part B: what a sunken chest holds (chest meta bits 3-5; filled when first opened, main.js fillLoot)
export const SEA_LOOT = { supply: 1, map: 2, treasure: 3, ruin: 4, buried: 5 };
export const seaLootOf = meta => (meta >> 3) & 7;
const seaChest = (kind, f = 0) => make(B.CHEST, LOOT | (f & 3) | (kind << 3));
export const TREASURE_CELL = 160;   // one buried treasure spot at most in each 160 × 160 square, on a beach
// Milestone 20, Part C: the new land biomes. They only change what's on the ground (never its height), so they can also
// reach older worlds, in big squares of land nobody has visited or changed (decided once in world.js, remembered).
export const SPECIAL_BIOMES = new Set(["snowy_plains", "taiga", "jungle", "savanna", "dark_forest", "swamp", "badlands", "cherry_grove", "mushroom_fields", "frozen_ocean"]);
export const BIOME_NAMES = { plains: "Plains", forest: "Forest", birch: "Birch Forest", sandy: "Desert", mountain: "Mountains", peak: "Snowy Peaks", ocean: "Ocean",
  deep_ocean: "Deep Ocean", frozen_ocean: "Frozen Ocean", snowy_plains: "Snowy Plains", taiga: "Taiga", jungle: "Jungle", savanna: "Savanna", dark_forest: "Dark Forest",
  swamp: "Swamp", badlands: "Badlands", cherry_grove: "Cherry Grove", mushroom_fields: "Mushroom Fields", warm_ocean: "Warm Ocean" };
const SOFT_SEA = new Set([B.KELP, B.SEAGRASS, B.SEA_PICKLE]);   // Milestone 17, Part C: water plants a monument's foundation replaces
const WARM_SEA = 0.3;   // Milestone 17: seas warmer than this are Warm Oceans (coral reefs)
const SOFT_GEN = new Set([B.AIR, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.SNOW_LAYER, B.PINK_PETALS, B.DEAD_BUSH]);
const BANDS = [B.TERRACOTTA, B.ORANGE_TERRACOTTA, B.TERRACOTTA, B.YELLOW_TERRACOTTA, B.ORANGE_TERRACOTTA, B.WHITE_TERRACOTTA, B.RED_TERRACOTTA, B.TERRACOTTA,
  B.BROWN_TERRACOTTA, B.LIGHT_GRAY_TERRACOTTA, B.ORANGE_TERRACOTTA, B.RED_TERRACOTTA];
const TREES = { taiga: ["spruce", 7], snowy_plains: ["spruce", 0.6], jungle: ["jungle", 6], savanna: ["acacia", 1.4], dark_forest: ["dark_oak", 2.5], cherry_grove: ["cherry", 2], swamp: ["mangrove", 1.6], mushroom_fields: ["mushroom", 0.8] };
// 19 (Milestone 17, Part C): Ocean Monuments in deep seas. Worlds made at 17 or 18 get one only if nobody has been
// anywhere near its spot (decided once per monument in world.js and remembered).
export const MONUMENT_GEN = 19;
// 20 (Milestone 23, Part D): Pillager Outposts, Witch Huts and Woodland Mansions. Worlds made earlier get one only if
// nobody has been anywhere on its spot (decided once per building in world.js and remembered), like the monuments.
export const STRUCT_GEN = 20;
export const CURRENT_GEN = GRAND_CAPITAL_GEN;
export const PROFESSIONS = ["farmer", "fletcher", "shepherd", "cleric", "smith"];
const JOB_BLOCK = { farmer: B.COMPOSTER, fletcher: B.FLETCH_TABLE, shepherd: B.LOOM, cleric: B.ALTAR, smith: B.SMITH_TABLE, scribe: B.BOOKSHELF, beekeeper: B.BEEHIVE };
// Three strongholds per world, a few hundred blocks from the middle (the Eye of the Void points to the nearest)
export function strongholdSpots(seed) {
  const r = rng(seed ^ 0x51ed27), base = r() * Math.PI * 2;
  return [0, 1, 2].map(k => { const a = base + k * Math.PI * 2 / 3, d = 260 + r() * 200; return { x: Math.round(Math.cos(a) * d), y: 22, z: Math.round(Math.sin(a) * d) }; });
}
// The 12 portal-frame spots around a stronghold's 3×3 portal
export function frameSpots(s) {
  const out = [];
  for (let d = -1; d <= 1; d++) out.push([s.x + d, s.y, s.z - 2], [s.x + d, s.y, s.z + 2], [s.x - 2, s.y, s.z + d], [s.x + 2, s.y, s.z + d]);
  return out;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const idx = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;

export class Generator {
  // version: worlds made before an update keep the old land shapes in places the player changed
  constructor(seedText, version = CURRENT_GEN) {
    this.version = version;
    this.seed = hashSeed(seedText);
    this.n = new Noise(this.seed);
    this.c = new Noise(this.seed ^ 0x5bd1e995);   // caves
    this.strongholds = strongholdSpots(this.seed);
    this.villageTerrain = new Map();
    this.lateFeatures = true;   // world.js: older worlds get sugar cane only in land nobody has visited
  }

  // Milestone 20: how much this spot is sea (0 = land, 1 = deep sea middle). Big, slow noise, kept away from the
  // world's middle (the starting area) and from the three strongholds (their castles and portals must stay dry).
  oceanness(x, z) {
    let o = smooth(0.05, 0.55, -this.n.fbm2(x / 1100 + 3000, z / 1100 - 2000, 3));
    if (!o) return 0;
    o *= smooth(220, 420, Math.hypot(x, z));
    for (const s of this.strongholds) { if (!o) break; o *= smooth(200, 330, Math.hypot(x - s.x, z - s.z)); }
    return o;
  }

  // Milestone 20, Part C: the new biome for a column, from the same temperature and moisture the land already has
  landBiome(col, x, z) {
    const b = col.biome, t = col.temperature, m = col.moisture, w = this.n.n2(x / 480 + 1700, z / 480 - 900);
    if (b === "ocean" || b === "deep_ocean") return t < -0.52 ? "frozen_ocean" : b === "ocean" && t > WARM_SEA ? "warm_ocean" : b;   // Milestone 17: sunny shallow seas
    if (b === "peak" || b === "mountain") return b;
    if (b === "sandy") return w > 0.25 ? "badlands" : "sandy";
    if (t < -0.44) return b === "plains" ? "snowy_plains" : "taiga";
    if (b === "plains") {
      if (w > 0.55) return "mushroom_fields";
      if (col.h <= SEA + 5 && m > 0.05 && w > -0.2) return "swamp";
      if (t > 0.2 && m < 0.15) return "savanna";
      if (w < -0.48 && t > -0.15) return "cherry_grove";
      return "plains";
    }
    if (b === "forest") {
      if (t > 0.28 && m > 0.26) return "jungle";
      if (m > 0.4) return "dark_forest";
      if (w < -0.48) return "cherry_grove";
      if (t < -0.3) return "taiga";
      if (col.h <= SEA + 3 && m > 0.2) return "swamp";
      return "forest";
    }
    if (b === "birch") return t < -0.25 ? "taiga" : "birch";
    return b;
  }
  // Decorate one chunk's columns and trees for the new biomes (runs after the old-style plants)
  decorate(data, cols, x0, z0, cx, cz) {
    this.caves(data, cols, x0, z0, cx, cz);   // Part D
    const r = rng((this.seed ^ Math.imul(cx, 668265263) ^ Math.imul(cz, 374761393) ^ 0x20c0) >>> 0);
    const at = (lx, y, lz) => data[idx(lx, y, lz)], put = (lx, y, lz, v) => { if (lx >= 0 && lx < CHUNK && lz >= 0 && lz < CHUNK && y > 0 && y < HEIGHT - 1) data[idx(lx, y, lz)] = v; };
    const bandOff = Math.floor((this.n.n2(x0 / 200 + 33, z0 / 200 - 71) + 1) * 6);
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = cols[lx + lz * CHUNK], nb = col.nb, h = col.h, top = at(lx, h, lz), above = at(lx, h + 1, lz), p = r();
      if (nb === "snowy_plains" || nb === "frozen_ocean" || (nb === "taiga" && col.temperature < -0.42)) {
        if (h < SEA && at(lx, SEA, lz) === B.WATER && at(lx, SEA + 1, lz) === B.AIR) put(lx, SEA, lz, B.ICE);   // frozen water
        else if ((top === B.GRASS || top === B.DIRT || top === B.STONE) && SOFT_GEN.has(above)) put(lx, h + 1, lz, B.SNOW_LAYER);
      } else if (nb === "badlands") {
        if (top === B.SAND) put(lx, h, lz, B.RED_SAND);
        for (let y = h - 1; y >= Math.max(6, h - 16); y--) { const v = at(lx, y, lz); if (v === B.SAND || v === B.SANDSTONE || v === B.STONE || v === B.DIRT) put(lx, y, lz, BANDS[(y + bandOff) % BANDS.length]); }
        if (above === B.AIR && top === B.SAND) { if (p < 0.012) this.cactus(data, lx, h + 1, lz, r); else if (p < 0.035) put(lx, h + 1, lz, B.DEAD_BUSH); }
      } else if (nb === "sandy") {
        if (above === B.AIR && top === B.SAND) { if (p < 0.008) this.cactus(data, lx, h + 1, lz, r); else if (p < 0.022) put(lx, h + 1, lz, B.DEAD_BUSH); }
      } else if (nb === "mushroom_fields") {
        if (top === B.GRASS) { put(lx, h, lz, B.MYCELIUM); if (SOFT_GEN.has(above)) put(lx, h + 1, lz, p < 0.03 ? (r() < 0.5 ? B.RED_MUSHROOM : B.BROWN_MUSHROOM) : B.AIR); }
      } else if (nb === "swamp") {
        if (top === B.GRASS && this.n.n2((x0 + lx) / 9 + 77, (z0 + lz) / 9) > 0.25) put(lx, h, lz, B.MUD);
        if (h < SEA && at(lx, SEA, lz) === B.WATER && at(lx, SEA + 1, lz) === B.AIR && p < 0.09) put(lx, SEA + 1, lz, B.LILY_PAD);
      } else if (nb === "jungle") {
        if (top === B.GRASS && SOFT_GEN.has(above)) {
          if (p < 0.006) put(lx, h + 1, lz, B.MELON);
          else if (p < 0.03) { const tall = 4 + Math.floor(r() * 7); for (let k = 1; k <= tall; k++) put(lx, h + k, lz, B.BAMBOO); }
        }
      } else if (nb === "cherry_grove") {
        if (top === B.GRASS && SOFT_GEN.has(above) && p < 0.2) put(lx, h + 1, lz, B.PINK_PETALS);
      } else if (nb === "savanna") {
        if (top === B.GRASS && above === B.AIR && p < 0.22) put(lx, h + 1, lz, B.TALL_GRASS);
      } else if (nb === "dark_forest") {
        if (top === B.GRASS && SOFT_GEN.has(above) && p < 0.02) put(lx, h + 1, lz, r() < 0.5 ? B.RED_MUSHROOM : B.BROWN_MUSHROOM);
      } else if (nb === "taiga") {
        if (top === B.GRASS && SOFT_GEN.has(above) && p < 0.015) put(lx, h + 1, lz, make(B.BERRY_BUSH, 3));
      }
    }
    // trees of the biome in this chunk's middle
    const center = cols[8 + 8 * CHUNK].nb, plan = TREES[center];
    if (!plan) return;
    let n = Math.floor(plan[1]) + (r() < plan[1] % 1 ? 1 : 0);
    if (center === "dark_forest" && r() < 0.35) n++;   // a giant mushroom among the dark oaks
    for (let t = 0; t < n; t++) {
      const lx = 4 + Math.floor(r() * 8), lz = 4 + Math.floor(r() * 8), col = cols[lx + lz * CHUNK], y = col.h + 1;
      const ground = at(lx, col.h, lz);
      if (![B.GRASS, B.DIRT, B.MYCELIUM, B.MUD].includes(ground) || y + 16 >= HEIGHT) continue;
      let kind = plan[0];
      if (kind === "mushroom" || (center === "dark_forest" && t === n - 1 && n > Math.floor(plan[1]) + (plan[1] % 1 ? 1 : 0))) kind = r() < 0.5 ? "red_mushroom" : "brown_mushroom";
      for (const [dx, dy, dz, v, isWood] of treeShape(kind, r)) {
        const x = lx + dx, yy = y + dy, z = lz + dz;
        if (x < 0 || x >= CHUNK || z < 0 || z >= CHUNK || yy <= 0 || yy >= HEIGHT - 1) continue;
        const old = at(x, yy, z);
        if (SOFT_GEN.has(old) || (isWood && (old === B.WATER || old === B.SPRUCE_LEAVES || old === B.JUNGLE_LEAVES))) put(x, yy, z, v);
      }
      if (kind === "jungle") for (let k = 0; k < 3; k++) if (r() < 0.3) {   // cocoa pods on the trunk
        const f = Math.floor(r() * 4), [dx, dz] = [[0, 1], [1, 0], [0, -1], [-1, 0]][f], cy = y + 2 + Math.floor(r() * 4);
        if (at(lx - dx, cy, lz - dz) === B.AIR && at(lx, cy, lz) === B.JUNGLE_LOG) put(lx - dx, cy, lz - dz, make(B.COCOA, f | (Math.floor(r() * 3) << 2)));
      }
    }
  }
  // Milestone 17, Part A: the ocean floor. Seagrass and kelp forests in the seas, coral reefs with sea pickles in warm
  // seas, and now and then an iceberg in a frozen sea. Only fills water (and, for icebergs, the air just above it).
  seaFloor(data, cols, x0, z0, cx, cz) {
    const r = rng((this.seed ^ Math.imul(cx, 1597334677) ^ Math.imul(cz, 3812015801) ^ 0x17a0) >>> 0);
    const at = (lx, y, lz) => data[idx(lx, y, lz)], put = (lx, y, lz, v) => { data[idx(lx, y, lz)] = v; };
    const floorOk = v => v === B.SAND || v === B.GRAVEL || v === B.CLAY || v === B.DIRT || v === B.STONE || v === B.RED_SAND;
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = cols[lx + lz * CHUNK], nb = col.nb, h = col.h, depth = SEA - h, x = x0 + lx, z = z0 + lz, p = r();
      if ((nb !== "ocean" && nb !== "deep_ocean" && nb !== "warm_ocean") || depth < 2 || at(lx, h + 1, lz) !== B.WATER || !floorOk(at(lx, h, lz))) continue;
      if (nb === "warm_ocean") {
        const reef = this.n.n2(x / 26 + 1300, z / 26 - 2100) > -0.05, kind = Math.floor(hash3(this.seed, x >> 2, 1717, z >> 2) * CORALS.length), K = CORALS[kind][0];
        if (reef && p < 0.3) {   // a little mound of coral blocks with something growing on top
          const tall = depth > 4 && r() < 0.4 ? 2 : 1;
          for (let k = 1; k <= tall; k++) put(lx, h + k, lz, B[K + "_CORAL_BLOCK"]);
          const q = r(), y = h + tall + 1;
          if (y < SEA && at(lx, y, lz) === B.WATER) {
            if (q < 0.35) put(lx, y, lz, B[CORALS[Math.floor(r() * CORALS.length)][0] + "_CORAL"]);
            else if (q < 0.6) put(lx, y, lz, B[CORALS[Math.floor(r() * CORALS.length)][0] + "_CORAL_FAN"]);
            else if (q < 0.68) put(lx, y, lz, make(B.SEA_PICKLE, Math.floor(r() * 4)));
          }
        } else if (reef && p < 0.62) put(lx, h + 1, lz, B[(r() < 0.5 ? K : CORALS[Math.floor(r() * CORALS.length)][0]) + (r() < 0.55 ? "_CORAL" : "_CORAL_FAN")]);
        else if (p < 0.8) put(lx, h + 1, lz, B.SEAGRASS);
        continue;
      }
      const forest = depth >= 5 && this.n.n2(x / 44 - 2600, z / 44 + 1900) > (nb === "deep_ocean" ? 0.35 : 0.12);
      if (forest && p < 0.45) {   // kelp reaching up toward the surface
        const len = 1 + Math.floor(r() * Math.max(1, depth - 2));
        for (let k = 1; k <= len && h + k < SEA; k++) if (at(lx, h + k, lz) === B.WATER) put(lx, h + k, lz, B.KELP); else break;
      } else if (p < (nb === "deep_ocean" ? 0.12 : 0.32)) put(lx, h + 1, lz, B.SEAGRASS);
    }
    // a frozen sea sometimes has an iceberg of packed ice with a blue ice heart, kept inside this chunk
    if (cols[8 + 8 * CHUNK].nb === "frozen_ocean" && r() < 0.09) {
      const R = 3 + Math.floor(r() * 3), up = 3 + Math.floor(r() * 7), down = 3 + Math.floor(r() * 4);
      for (let lz = 8 - R; lz <= 8 + R; lz++) for (let lx = 8 - R; lx <= 8 + R; lx++) {
        const d = Math.hypot(lx - 8, lz - 8) + r() * 0.6;
        if (d > R) continue;
        const top = SEA + Math.round(up * (1 - d / (R + 0.5)) ** 1.4), bottom = Math.max(cols[lx + lz * CHUNK].h + 1, SEA - Math.round(down * (1 - d / (R + 1))));
        for (let y = bottom; y <= top; y++) {
          const v = at(lx, y, lz);
          if (v === B.WATER || v === B.AIR || v === B.ICE || v === B.SNOW_LAYER) put(lx, y, lz, d < R * 0.35 && y < top - 1 && r() < 0.6 ? B.BLUE_ICE : B.PACKED_ICE);
        }
        if (top + 1 < HEIGHT && at(lx, top + 1, lz) === B.AIR && r() < 0.7) put(lx, top + 1, lz, B.SNOW_LAYER);
      }
    }
  }
  // Milestone 17, Part B: a shipwreck or a sunken ruin in some sea chunks (each kept inside its own chunk), and buried
  // treasure under a beach (one spot at most per 160 × 160 square; treasure maps lead to it).
  seaStructures(data, cols, x0, z0, cx, cz) {
    const spot = this.treasureSpot(Math.floor(x0 / TREASURE_CELL), Math.floor(z0 / TREASURE_CELL));
    if (spot && spot.x >= x0 && spot.x < x0 + CHUNK && spot.z >= z0 && spot.z < z0 + CHUNK) data[idx(spot.x - x0, spot.y, spot.z - z0)] = seaChest(SEA_LOOT.buried);
    const c = cols[8 + 8 * CHUNK], nb = c.nb, depth = SEA - c.h, roll = hash3(this.seed, cx, 1741, cz);
    if (!["ocean", "deep_ocean", "warm_ocean", "frozen_ocean"].includes(nb) || depth < 3) return;
    const r = rng((this.seed ^ Math.imul(cx, 2246822519) ^ Math.imul(cz, 3266489917) ^ 0x5417) >>> 0);
    if (roll < 0.022 && depth >= 4) this.shipwreck(data, c.h + 1, r);
    else if (roll >= 0.022 && roll < 0.075) this.oceanRuin(data, cols, nb === "warm_ocean", r);
  }
  // Milestone 17, Part C: the Ocean Monument of one 384 × 384 square, if that square has a big enough deep sea (or null).
  // Its spot keeps clear of the strongholds and of anything stamped into the land (temple entrances and so on).
  structuresNear(x, z) { return structuresNear(this, x, z); }   // Milestone 23, Part D
  monumentSite(gx, gz) {
    const key = gx + "," + gz;
    this.monumentCache ||= new Map();
    if (this.monumentCache.has(key)) return this.monumentCache.get(key);
    let site = null;
    if (this.version >= BIOME_GEN) {
      const x0 = gx * MONUMENT_CELL + 24 + Math.floor(hash3(this.seed, gx, 2201, gz) * (MONUMENT_CELL - 48 - MONUMENT_SIZE));
      const z0 = gz * MONUMENT_CELL + 24 + Math.floor(hash3(this.seed, gx, 2202, gz) * (MONUMENT_CELL - 48 - MONUMENT_SIZE));
      let ok = hash3(this.seed, gx, 2203, gz) < 0.75;
      for (let a = -8; a <= MONUMENT_SIZE + 8 && ok; a += 16) for (let b = -8; b <= MONUMENT_SIZE + 8 && ok; b += 16) { const c = this.column(x0 + a, z0 + b); if (c.h > SEA - 12 || c.sea < 0.5) ok = false; }
      if (ok) site = { key, x0, z0, y0: SEA - 1 - MONUMENT_TOP, cx: x0 + MONUMENT_SIZE / 2, cz: z0 + MONUMENT_SIZE / 2 };
    }
    this.monumentCache.set(key, site);
    return site;
  }
  // monuments whose spot could reach near (x, z), leaving out any that would overlap something stamped into the land
  monumentsNear(x, z) {
    const gx = Math.floor(x / MONUMENT_CELL), gz = Math.floor(z / MONUMENT_CELL), out = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const s = this.monumentSite(gx + i, gz + j);
      if (!s) continue;
      if ((this.stamps || []).some(t => t.x < s.x0 + MONUMENT_SIZE + 16 && t.x + (t.size || 32) > s.x0 - 16 && t.z < s.z0 + MONUMENT_SIZE + 16 && t.z + (t.size || 32) > s.z0 - 16)) continue;
      out.push(s);
    }
    return out;
  }
  // draw this chunk's part of any monument (ok decides it for worlds made before monuments; null = always)
  monuments(data, x0, z0, ok) {
    for (const s of this.monumentsNear(x0 + 8, z0 + 8)) {
      if (s.x0 > x0 + CHUNK - 1 || s.x0 + MONUMENT_SIZE - 1 < x0 || s.z0 > z0 + CHUNK - 1 || s.z0 + MONUMENT_SIZE - 1 < z0) continue;
      if (ok && !ok(s)) continue;
      for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
        const mx = x0 + lx - s.x0, mz = z0 + lz - s.z0;
        if (mx < 0 || mz < 0 || mx >= MONUMENT_SIZE || mz >= MONUMENT_SIZE) continue;
        for (let my = 0; my <= MONUMENT_TOP; my++) data[idx(lx, s.y0 + my, lz)] = monumentCell(mx, my, mz);
        for (let y = s.y0 - 1; y > 0; y--) { const v = data[idx(lx, y, lz)]; if (v !== B.WATER && !SOFT_SEA.has(v & 0xFFFF00FF)) break; data[idx(lx, y, lz)] = B.PRISMARINE; }   // its foundation, down to the sea floor
      }
    }
  }
  // Milestone 17, Part D: the nearest shipwreck or sunken ruin (the same rule seaStructures uses), for Splashers to lead you to
  wreckNear(x, z, ok = () => true, reach = 24) {
    const cx0 = Math.floor(x / CHUNK), cz0 = Math.floor(z / CHUNK);
    let best = null, bd = Infinity;
    for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) {
      const cx = cx0 + i, cz = cz0 + j, roll = hash3(this.seed, cx, 1741, cz);
      if (roll >= 0.075 || this.version < BIOME_GEN) continue;
      const px = cx * CHUNK + 8, pz = cz * CHUNK + 8, d = Math.hypot(px - x, pz - z);
      if (d >= bd) continue;
      const c = this.column(px, pz), nb = this.landBiome(c, px, pz), depth = SEA - c.h;
      if (!["ocean", "deep_ocean", "warm_ocean", "frozen_ocean"].includes(nb) || depth < 3 || (roll < 0.022 && depth < 4)) continue;
      const s = { x: px, z: pz, kind: roll < 0.022 ? "shipwreck" : "ruin" };
      if (!ok(s)) continue;
      best = s; bd = d;
    }
    return best;
  }
  // the treasure spot of one big square: a beach (land just above sea level at the edge of a real sea), or null
  treasureSpot(gx, gz) {
    const key = gx + "," + gz;
    this.treasureCache ||= new Map();
    if (this.treasureCache.has(key)) return this.treasureCache.get(key);
    let found = null;
    const bx = gx * TREASURE_CELL + 16 + Math.floor(hash3(this.seed, gx, 1901, gz) * (TREASURE_CELL - 32)), bz = gz * TREASURE_CELL + 16 + Math.floor(hash3(this.seed, gx, 1902, gz) * (TREASURE_CELL - 32));
    for (let k = 0; k < 24 && !found; k++) {
      const x = k ? gx * TREASURE_CELL + 4 + Math.floor(hash3(this.seed, gx * 31 + k, 1903, gz) * (TREASURE_CELL - 8)) : bx;
      const z = k ? gz * TREASURE_CELL + 4 + Math.floor(hash3(this.seed, gx, 1904, gz * 31 + k) * (TREASURE_CELL - 8)) : bz;
      const col = this.column(x, z);
      if (col.h >= SEA && col.h <= SEA + 2 && col.sea > 0.02 && col.biome !== "peak" && col.biome !== "mountain") found = { x, z, y: col.h - 1 };
    }
    if (this.treasureCache.size > 4000) this.treasureCache.clear();
    this.treasureCache.set(key, found);
    return found;
  }
  // the nearest treasure spot to (x, z), looking a few squares around; ok(spot) can rule spots out
  treasureNear(x, z, ok = () => true, reach = 3) {
    const gx = Math.floor(x / TREASURE_CELL), gz = Math.floor(z / TREASURE_CELL);
    let best = null, bd = Infinity;
    for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) {
      const s = this.treasureSpot(gx + i, gz + j);
      if (!s || !ok(s)) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }
  // a wrecked wooden ship lying on the sea floor: a hull with holes, a deck, a broken mast, a little cabin, and 3 chests
  shipwreck(data, Y, r) {
    if (Y + 8 >= HEIGHT - 1) return;
    const [P, L] = [[B.PLANKS, B.LOG], [B.SPRUCE_PLANKS, B.SPRUCE_LOG], [B.DARK_OAK_PLANKS, B.DARK_OAK_LOG]][Math.floor(r() * 3)];
    const alongX = r() < 0.5, at = (u, v) => alongX ? [2 + u, 8 + v] : [8 + v, 2 + u];
    const put = (u, y, v, b, rot = 0.13) => { if (rot && r() < rot) return; const [lx, lz] = at(u, v); data[idx(lx, y, lz)] = b; };
    const open = y => y <= SEA ? B.WATER : B.AIR;
    for (let u = 0; u <= 12; u++) {
      const half = u === 0 || u === 12 ? 0 : u === 1 || u === 11 ? 1 : 2;
      for (let v = -half; v <= half; v++) {
        if (Math.abs(v) < 2 && u >= 1 && u <= 11) put(u, Y, v, P, 0);   // the keel and the bottom of the hull
        for (let y = Y + 1; y <= Y + 3; y++) {
          if (Math.abs(v) === half) put(u, y, v, P);   // the sides
          else { const [lx, lz] = at(u, v); data[idx(lx, y, lz)] = open(y); }   // the hold
        }
        if (u >= 1 && u <= 11) put(u, Y + 4, v, P, 0.2);   // the deck, rotted through in places
      }
    }
    for (let u = 9; u <= 11; u++) for (let v = -2; v <= 2; v++) for (let y = Y + 5; y <= Y + 7; y++) {   // the cabin at the back
      const wall = u === 9 || u === 11 || Math.abs(v) === 2;
      if (y === Y + 7) put(u, y, v, P, 0.25);
      else if (wall && !(u === 9 && v === 0)) put(u, y, v, P, 0.15);
      else { const [lx, lz] = at(u, v); data[idx(lx, y, lz)] = open(y); }
    }
    const mast = 3 + Math.floor(r() * 6);
    for (let y = Y + 1; y <= Math.min(HEIGHT - 2, Y + mast + 1); y++) put(6, y, 0, L, 0);   // the broken mast
    const f = alongX ? 1 : 0;
    put(2, Y + 1, 0, seaChest(SEA_LOOT.supply, f), 0);
    put(7, Y + 1, -1, seaChest(SEA_LOOT.treasure, f), 0);
    put(10, Y + 5, 0, seaChest(SEA_LOOT.map, f), 0);
  }
  // the broken stone walls of a small sunken building (sandstone in warm seas), sometimes with a chest
  oceanRuin(data, cols, warm, r) {
    const mats = warm ? [B.SANDSTONE, B.SANDSTONE, B.SANDSTONE] : [B.STONE_BRICKS, B.MOSSY, B.CRACKED_BRICKS];
    const S = r() < 0.5 ? 5 : 7, ox = 2 + Math.floor(r() * (13 - S)), oz = 2 + Math.floor(r() * (13 - S)), H = 1 + Math.floor(r() * 3);
    for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
      const lx = ox + a, lz = oz + b, h = cols[lx + lz * CHUNK].h;
      if (h >= SEA - 1) continue;
      data[idx(lx, h, lz)] = mats[Math.floor(r() * 3)];   // the floor
      const edge = a === 0 || b === 0 || a === S - 1 || b === S - 1;
      if (edge) { const tall = Math.min(H + (r() < 0.3 ? 1 : 0), SEA - h - 1); for (let y = h + 1; y <= h + tall; y++) if (r() > 0.22) data[idx(lx, y, lz)] = mats[Math.floor(r() * 3)]; }
      else if (data[idx(lx, h + 1, lz)] !== B.WATER) data[idx(lx, h + 1, lz)] = B.WATER;
    }
    if (r() < 0.6) { const lx = ox + 1 + Math.floor(r() * (S - 2)), lz = oz + 1 + Math.floor(r() * (S - 2)), h = cols[lx + lz * CHUNK].h; if (h + 1 < SEA) data[idx(lx, h + 1, lz)] = seaChest(SEA_LOOT.ruin, Math.floor(r() * 4)); }
  }
  // Milestone 20, Part D: which kind of cave lies under this chunk (big, slow patches), and decorating it
  caveBiome(x0, z0) { const c = this.n.n2(x0 / 170 + 5000, z0 / 170 - 5000); return c > 0.45 ? "lush_caves" : c < -0.45 ? "dripstone_caves" : null; }
  caves(data, cols, x0, z0, cx, cz) {
    const kind = this.caveBiome(x0 + 8, z0 + 8);
    if (!kind) return;
    const r = rng((this.seed ^ Math.imul(cx, 1103515245) ^ Math.imul(cz, 12345) ^ 0x20d0) >>> 0), lush = kind === "lush_caves";
    const rock = v => v === B.STONE || v === B.DIRT || v === B.GRAVEL;
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const top = Math.min(cols[lx + lz * CHUNK].h - 4, HEIGHT - 3);
      for (let y = 11; y < top; y++) {
        const i = idx(lx, y, lz);
        if (data[i] !== B.AIR) continue;
        const bi = idx(lx, y - 1, lz), ai = idx(lx, y + 1, lz), below = data[bi], above = data[ai];
        if (rock(below)) {   // a cave floor
          const p = r();
          if (lush) {
            data[bi] = B.MOSS_BLOCK;
            data[i] = p < 0.22 ? B.MOSS_CARPET : p < 0.25 ? B.AZALEA : p < 0.27 ? B.FLOWERING_AZALEA : B.AIR;
          } else {
            if (p < 0.7) data[bi] = B.DRIPSTONE;
            if (p < 0.06) { const n = 1 + Math.floor(r() * 2); for (let k = 0; k < n && data[idx(lx, y + k, lz)] === B.AIR; k++) data[idx(lx, y + k, lz)] = B.POINTED_DRIPSTONE; }
          }
        }
        if (rock(above) && data[i] === B.AIR) {   // a cave ceiling
          const p = r();
          if (lush) {
            if (p < 0.5) data[ai] = B.MOSS_BLOCK;
            if (p < 0.07) { const n = 1 + Math.floor(r() * 4); for (let k = 0; k < n && y - k > 10 && data[idx(lx, y - k, lz)] === B.AIR; k++) data[idx(lx, y - k, lz)] = make(B.CAVE_VINES, r() < 0.3 ? 1 : 0); }
            else if (p < 0.078) data[i] = B.SPORE_BLOSSOM;
          } else {
            if (p < 0.7) data[ai] = B.DRIPSTONE;
            if (p < 0.08) { const n = 1 + Math.floor(r() * 3); for (let k = 0; k < n && y - k > 10 && data[idx(lx, y - k, lz)] === B.AIR; k++) data[idx(lx, y - k, lz)] = make(B.POINTED_DRIPSTONE, 1); }
          }
        }
      }
    }
  }
  cactus(data, lx, y, lz, r) {
    const tall = 1 + Math.floor(r() * 3);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = lx + dx, z = lz + dz; if (x >= 0 && x < CHUNK && z >= 0 && z < CHUNK && data[idx(x, y, z)] !== B.AIR) return; }
    for (let k = 0; k < tall && y + k < HEIGHT - 1; k++) data[idx(lx, y + k, lz)] = B.CACTUS;
  }

  // Ground height and land type for one column of the world
  column(x, z) {
    const n = this.n;
    const cont = n.fbm2(x / 260, z / 260, 3);
    const hills = n.fbm2(x / 70 + 100, z / 70, 3);
    const mm = smooth(0.12, 0.55, n.n2(x / 420 + 50, z / 420 - 30));
    const rid = 1 - Math.abs(n.fbm2(x / 110 - 200, z / 110 + 70, 4));
    let h = 33 + cont * 8 + hills * 6 * (1 - mm * 0.5) + mm * (rid * rid * 36 + 5);
    const river = Math.abs(n.fbm2(x / 320 + 400, z / 320 - 400, 3));
    if (river < 0.055 && mm < 0.7) h = h + (SEA - 3 - h) * smooth(0, 1, 1 - river / 0.055) * (1 - mm);
    let sea = 0;
    if (this.version >= BIOME_GEN) {   // Milestone 20: wide seas, deepest in the middle (floor down to about 18 blocks below sea level)
      sea = this.oceanness(x, z);
      if (sea > 0) {
        const floor = SEA - 4 - 14 * smooth(0.45, 1, sea) + n.n2(x / 37 + 811, z / 37 - 409) * 2;
        h = h + (Math.min(h, floor) - h) * smooth(0, 0.4, sea);
      }
    }
    h = Math.max(4, Math.min(HEIGHT - 8, Math.floor(h)));
    const temp = n.n2(x / 350 + 900, z / 350), moist = n.n2(x / 300 - 700, z / 300 + 300);
    let biome = "plains";
    if (sea > 0.2 && h <= SEA - 12) biome = "deep_ocean";
    else if (sea > 0.2 && h <= SEA - 3) biome = "ocean";
    else if (h >= SEA + 36) biome = "peak";
    else if (h > SEA + 24 && mm > 0.4) biome = "mountain";
    else if (temp > 0.3 && moist < -0.05) biome = "sandy";
    else if (moist > 0.12) biome = temp < -0.15 ? "birch" : "forest";
    return { h, biome, mm, temperature: temp, moisture: moist, sea };
  }

  // opts.version lets old worlds use new features only in places the player never changed
  generate(cx, cz, opts = {}) {
    const ver = opts.version || this.version;
    const data = new Uint32Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK, cols = [];
    const r = rng(this.seed ^ Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663));
    // cave noise on a coarse 4-block grid, blended in between (much faster, same shapes on both sides of a chunk edge)
    const GY = HEIGHT / 4 + 1, grid = [new Float32Array(25 * GY), new Float32Array(25 * GY), new Float32Array(25 * GY)];
    for (let gz = 0; gz < 5; gz++) for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < GY; gy++) {
      const wx = x0 + gx * 4, wz = z0 + gz * 4, y = gy * 4, k = gx + gz * 5 + gy * 25;
      grid[0][k] = this.c.n3(wx / 42, y / 26, wz / 42);
      grid[1][k] = this.c.n3(wx / 42 + 61, y / 26, wz / 42 - 17);
      grid[2][k] = y < 40 ? this.c.n3(wx / 64 - 90, y / 30, wz / 64 + 40) : -1;
    }
    const cave = (g, lx, y, lz) => {
      const fx = lx / 4, fy = y / 4, fz = lz / 4, ix = Math.min(3, Math.floor(fx)), iy = Math.min(GY - 2, Math.floor(fy)), iz = Math.min(3, Math.floor(fz));
      const tx = fx - ix, ty = fy - iy, tz = fz - iz, a = grid[g];
      const at = (i, j, k) => a[(ix + i) + (iz + k) * 5 + (iy + j) * 25];
      const l = (p, q, t) => p + (q - p) * t;
      return l(l(l(at(0, 0, 0), at(1, 0, 0), tx), l(at(0, 0, 1), at(1, 0, 1), tx), tz), l(l(at(0, 1, 0), at(1, 1, 0), tx), l(at(0, 1, 1), at(1, 1, 1), tx), tz), ty);
    };
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = x0 + lx, wz = z0 + lz, col = this.column(wx, wz), h = col.h;
      cols[lx + lz * CHUNK] = col;
      const patch = this.n.n2(wx / 9 + 33, wz / 9 - 71);
      let top = B.GRASS, under = B.DIRT, depth = 3;
      if (col.biome === "peak") { top = B.SNOW; under = B.STONE; }
      else if (col.biome === "mountain") { top = patch > 0.25 ? B.GRASS : B.STONE; under = top === B.STONE ? B.STONE : B.DIRT; }
      else if (col.biome === "sandy") { top = B.SAND; under = B.SAND; depth = 4; }
      if (h <= SEA + 1 && h >= SEA - 3) { top = patch > 0.45 ? B.GRAVEL : B.SAND; under = top; }
      if (h < SEA - 3) { top = patch > 0.5 ? B.CLAY : patch < -0.4 ? B.GRAVEL : B.SAND; under = B.SAND; }
      if (col.biome === "deep_ocean") { top = patch > 0.2 ? B.GRAVEL : patch < -0.5 ? B.CLAY : B.SAND; under = B.GRAVEL; }
      for (let y = 0; y <= Math.max(h, SEA); y++) {
        let v;
        if (y === 0 || (y <= 2 && hash3(this.seed, wx, y, wz) < 0.5)) v = B.BEDROCK;
        else if (y < h - depth) v = B.STONE;
        else if (y < h) v = under === B.SAND && col.biome === "sandy" && y < h - 2 ? B.SANDSTONE : under;
        else if (y === h) v = top;
        else v = B.WATER;   // y between ground and sea level
        data[idx(lx, y, lz)] = v;
      }
      // caves (kept away from the sea floor so oceans don't drain into them)
      const roof = h < SEA + 2 ? h - 6 : h - 1;
      for (let y = 3; y < roof; y++) {
        let carve = Math.abs(cave(0, lx, y, lz)) < 0.085 && Math.abs(cave(1, lx, y, lz)) < 0.085;
        if (!carve && y < 34) carve = cave(2, lx, y, lz) > 0.6;
        if (carve) data[idx(lx, y, lz)] = ver >= 2 && y <= 9 ? B.LAVA : B.AIR;
      }
      // a grassy cave roof would leave floating grass: fix the top block if what's under it was carved
      if (data[idx(lx, h, lz)] === B.GRASS && data[idx(lx, h - 1, lz)] === B.AIR) data[idx(lx, h, lz)] = B.DIRT;
    }

    // ore veins
    const vein = (id, tries, minY, maxY, size, inside = B.STONE) => {
      for (let t = 0; t < tries; t++) {
        let x = Math.floor(r() * 16), y = minY + Math.floor(r() * (maxY - minY)), z = Math.floor(r() * 16);
        const n = 1 + Math.floor(r() * size);
        for (let k = 0; k < n; k++) {
          if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT && data[idx(x, y, z)] === inside) data[idx(x, y, z)] = id;
          const d = Math.floor(r() * 6); x += [1, -1, 0, 0, 0, 0][d]; y += [0, 0, 1, -1, 0, 0][d]; z += [0, 0, 0, 0, 1, -1][d];
        }
      }
    };
    vein(B.COAL_ORE, 18, 6, 64, 8);
    vein(B.IRON_ORE, 11, 4, 46, 6);
    vein(B.SKY_ORE, 2, 3, 18, 4);
    vein(B.GRAVEL, 4, 6, 50, 10);
    if (ver >= 5 && ["mountain", "peak"].includes(cols[8 + 8 * CHUNK].biome)) vein(B.JADE_ORE, 5, 4, 50, 2);
    vein(B.DIRT, 4, 6, 50, 10);
if (ver >= 7) vein(B.SPARK_ORE, 8, 2, 16, 8);   // Sparkworks: deep down, like Minecraft's redstone
// Milestone 15: Lapis Ore, deep down, in every world. It has its own random numbers so nothing else in older land moves.
{
  const lr = rng((this.seed ^ Math.imul(cx, 83492791) ^ Math.imul(cz, 2971215073) ^ 0x1a915) >>> 0);
  for (let t = 0; t < 3; t++) {
    let x = Math.floor(lr() * 16), y = 3 + Math.floor(lr() * 27), z = Math.floor(lr() * 16);
    const n = 2 + Math.floor(lr() * 6);
    for (let k = 0; k < n; k++) {
      if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT && data[idx(x, y, z)] === B.STONE) data[idx(x, y, z)] = B.LAPIS_ORE;
      const d = Math.floor(lr() * 6); x += [1, -1, 0, 0, 0, 0][d]; y += [0, 0, 1, -1, 0, 0][d]; z += [0, 0, 0, 0, 1, -1][d];
    }
  }
}

    // trees and plants
    const center = cols[8 + 8 * CHUNK];
    const deco = ver >= BIOME_GEN || !!opts.biomes;   // Milestone 20, Part C: new biomes here?
    if (deco) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) { const c = cols[lx + lz * CHUNK]; c.nb = this.landBiome(c, x0 + lx, z0 + lz); }
    const specialHere = deco && SPECIAL_BIOMES.has(center.nb);
    const treeTries = specialHere ? 0 : { forest: 9, birch: 8, plains: r() < 0.45 ? 1 : 0, mountain: r() < 0.5 ? 1 : 0, peak: 0, sandy: 0 }[center.biome] || 0;
    for (let t = 0; t < treeTries; t++) {
      const lx = 2 + Math.floor(r() * 12), lz = 2 + Math.floor(r() * 12), col = cols[lx + lz * CHUNK];
      if (data[idx(lx, col.h, lz)] !== B.GRASS || col.h + 9 >= HEIGHT) continue;
      const birch = col.biome === "birch" || (col.biome === "forest" && r() < 0.2);
      const top = this.tree(data, lx, col.h + 1, lz, birch, r);
      // land v6: now and then a bee nest hangs on the trunk just under the leaves (more often in grassland)
      if (ver >= 6 && hash3(this.seed, x0 + lx, 61, z0 + lz) < (col.biome === "plains" ? 0.35 : 0.035)) {
        const f = Math.floor(hash3(this.seed, x0 + lx, 62, z0 + lz) * 4), [dx, dz] = [[0, 1], [1, 0], [0, -1], [-1, 0]][f], ny = Math.max(top - 4, col.h + 2);
        const clear = v => v === B.AIR || v === B.TALL_GRASS;   // the nest's spot (leaves are fine) and the open air in front of its opening
        if ((clear(data[idx(lx + dx, ny, lz + dz)]) || data[idx(lx + dx, ny, lz + dz)] === (birch ? B.BIRCH_LEAVES : B.LEAVES)) && clear(data[idx(lx + dx * 2, ny, lz + dz * 2)])) data[idx(lx + dx, ny, lz + dz)] = make(B.BEE_NEST, f);
      }
    }
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const col = cols[lx + lz * CHUNK], y = col.h + 1;
      if (y >= HEIGHT || data[idx(lx, col.h, lz)] !== B.GRASS || data[idx(lx, y, lz)] !== B.AIR) continue;
      if (deco && SPECIAL_BIOMES.has(col.nb)) continue;   // the new biome brings its own plants
      const p = hash3(this.seed, x0 + lx, 7, z0 + lz);
      const grassChance = col.biome === "plains" ? 0.16 : 0.07;
      if (ver >= 6 && (col.biome === "forest" || col.biome === "birch") && hash3(this.seed, x0 + lx, 13, z0 + lz) < 0.015) data[idx(lx, y, lz)] = make(B.BERRY_BUSH, 3);   // ripe berry bushes
      else if (p < 0.012) data[idx(lx, y, lz)] = B.FLOWER_RED;
      else if (p < 0.024) data[idx(lx, y, lz)] = B.FLOWER_YELLOW;
      else if (p < 0.024 + grassChance) data[idx(lx, y, lz)] = B.TALL_GRASS;
    }

// Milestone 15: sugar cane on sand, grass or dirt right beside water at sea level
// (new worlds; older worlds only in land the player has never been to, see world.js)
    if (ver >= ENCHANT_GEN || opts.cane) for (let lz = 1; lz < CHUNK - 1; lz++) for (let lx = 1; lx < CHUNK - 1; lx++) {
  const col = cols[lx + lz * CHUNK], h = col.h, soil = data[idx(lx, h, lz)];
  if (h !== SEA || (soil !== B.SAND && soil !== B.GRASS && soil !== B.DIRT) || data[idx(lx, h + 1, lz)] !== B.AIR) continue;
  if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => data[idx(lx + dx, h, lz + dz)] === B.WATER)) continue;
  if (hash3(this.seed, x0 + lx, 161, z0 + lz) > 0.16) continue;
  const tall = 1 + Math.floor(hash3(this.seed, x0 + lx, 162, z0 + lz) * 3);
  for (let k = 1; k <= tall; k++) data[idx(lx, h + k, lz)] = B.SUGAR_CANE;
}

    if (deco) this.decorate(data, cols, x0, z0, cx, cz);   // Milestone 20, Part C
    if (deco && (ver >= OCEAN_GEN || opts.sea)) {
      this.seaFloor(data, cols, x0, z0, cx, cz);   // Milestone 17, Part A
      this.seaStructures(data, cols, x0, z0, cx, cz);   // Milestone 17, Part B
    }
    if (deco && (ver >= MONUMENT_GEN || opts.monumentOk)) this.monuments(data, x0, z0, ver >= MONUMENT_GEN ? null : opts.monumentOk);   // Milestone 17, Part C
    if (deco && (ver >= STRUCT_GEN || opts.structureOk)) stampStructures(this, data, x0, z0, ver >= STRUCT_GEN ? () => true : opts.structureOk, idx);   // Milestone 23, Part D

// A newly reserved capital replaces ordinary natural scenery before anyone can discover it.
    const capital = this.grandCapital;
    if (!capital || x0 < capital.x || z0 < capital.z || x0 >= capital.x + capital.size || z0 >= capital.z + capital.size) {
      if (hash3(this.seed, cx, 99, cz) < 0.035) {
        if (!this.ultraHardcore) this.ruin(data, cols, r);
        else if (hash3(this.seed, cx, 183, cz) < 0.035 && !this.villagePiece(cx, cz, ver)) {
          this.survivalCache(data, cols, x0, z0, opts.addContents);
        }
      }
      else if (ver >= 3 && hash3(this.seed, cx, 77, cz) < 0.02) this.ruinedPortal(data, cols, r);
    }
    if (ver >= 4) for (const s of this.strongholds) if (!s.citadel && Math.abs(s.x - x0 - 8) < 72 && Math.abs(s.z - z0 - 8) < 72) this.stronghold(data, x0, z0, s);
    if (ver >= 5) {
      const vp = this.villagePiece(cx, cz, Math.min(ver, this.version));
      if (vp?.settlement) {
        buildGrandVillage(data, vp, cols, this.seed, opts.addContents);
        opts.addSettlement?.(vp);
      } else if (vp?.compact) buildCompactVillage(data, vp, cols, this.seed, x0, z0, JOB_BLOCK[vp.prof], opts.addContents);
      else if (vp?.detailed) buildDetailedVillage(data, vp, cols, this.seed, x0, z0, JOB_BLOCK[vp.prof], opts.addContents);
      else if (vp) this.buildVillagePiece(data, vp, x0, z0, ver);
    }
    return applyStamps(this, data, cx, cz, opts.addContents);   // hand-built sites in never-visited land
  }

  // Legacy placement remains the reservation model used by authored landmarks.
  villageAt(cx, cz) {
    const rx = Math.floor(cx / 6), rz = Math.floor(cz / 6);
    if (hash3(this.seed, rx, 1234, rz) > 0.4) return null;
    const vx = rx * 6 + 3, vz = rz * 6 + 3, col = this.column(vx * 16 + 8, vz * 16 + 8);
    if (this.skipVillages && this.skipVillages.has(vx + "," + vz)) return null;   // an unseen village whose spot the Grand Desert Temple took
    if (!["plains", "sandy", "forest", "birch"].includes(col.biome) || col.h <= SEA + 1 || col.h > SEA + 18) return null;
    if (Math.abs(cx - vx) > 1 || Math.abs(cz - vz) > 1) return null;
    return { vx, vz, sandy: col.biome === "sandy" };
  }
  renovationPiece(cx, cz) {
    const village = this.villageAt(cx, cz);
    if (!village || villagePlotHasLandmark(this.seed, cx, cz)) return null;
    if (this.version >= VILLAGE_OVERHAUL_GEN && this.villagePiece(cx, cz, this.version, false)?.detailed) return null;
    const legacy = this.villagePiece(cx, cz, LEGACY_CHUNK_GEN, false);
    if (!legacy || legacy.lanternVale) return null;
    return detailedVillagePiece(this, village, cx, cz, this.villageTerrain, legacy);
  }
  villagePiece(cx, cz, layoutVersion = this.version, applyRenovation = true) {
    if (layoutVersion >= GRAND_VILLAGE_GEN) return grandVillagePlot(this, cx, cz);
    const v = this.villageAt(cx, cz);
    if (!v) return null;
    if (applyRenovation && this.renovatedVillages?.has(cx + "," + cz)) {
      const renovated = this.renovationPiece(cx, cz);
      if (renovated) return renovated;
    }
    if (layoutVersion >= VILLAGE_OVERHAUL_GEN) {
      if (villagePlotHasLandmark(this.seed, cx, cz)) return null;
      const piece = detailedVillagePiece(this, v, cx, cz, this.villageTerrain, null, layoutVersion);
      if (piece || layoutVersion >= VILLAGE_TERRAIN_GEN) return piece;
    }
    const dx = cx - v.vx, dz = cz - v.vz, x0 = cx * 16, z0 = cz * 16;
    const lanternVale = isLanternVale(this, v);
    const y = lanternVale ? this.column(v.vx * 16 + 8, v.vz * 16 + 8).h + dz : Math.max(SEA + 1, this.column(x0 + 8, z0 + 8).h);
    const type = !dx && !dz ? "plaza" : hash3(this.seed, cx, 1235, cz) < 0.3 ? "farm" : "house";
    const prof = type === "farm" ? "farmer" : lanternVale && dx === 1 && dz === 0 ? "smith" : PROFESSIONS[Math.floor(hash3(this.seed, cx, 1236, cz) * PROFESSIONS.length)];
    const piece = { type, y, dx, dz, sandy: v.sandy, prof, center: [v.vx * 16 + 8, v.vz * 16 + 8] };
    if (lanternVale) piece.lanternVale = true;
    if (type === "house") { piece.bed = [x0 + 5, y + 1, z0 + 5]; piece.job = [x0 + 9, y + 1, z0 + 9]; piece.home = [x0 + 7.5, y + 1, z0 + 7.5]; }
    if (type === "farm") { piece.job = [x0 + 3, y + 1, z0 + 3]; piece.home = [x0 + 7.5, y + 1, z0 + 2.5]; }
    if (type === "plaza") piece.home = [x0 + 7.5, y + 1, z0 + 12.5];
    return piece;
  }
  buildVillagePiece(data, vp, x0, z0, ver = CURRENT_GEN) {
    if (vp.lanternVale) return buildLanternValePlot(data, vp, this.seed, x0, z0, JOB_BLOCK[vp.prof]);
    const y = vp.y, put = (lx, yy, lz, v) => { if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16 && yy > 0 && yy < HEIGHT) data[idx(lx, yy, lz)] = v; };
    const wall = vp.sandy ? B.SANDSTONE : B.PLANKS, post = vp.sandy ? B.SANDSTONE : B.LOG, ground = vp.sandy ? B.SAND : B.GRASS;
    // level the building site: fill below, clear above
    for (let lx = 2; lx <= 13; lx++) for (let lz = 2; lz <= 13; lz++) {
      for (let yy = y; yy > y - 8 && yy > 0; yy--) { const i = idx(lx, yy, lz); if (data[i] !== B.AIR && data[i] !== B.WATER && yy < y) break; data[i] = yy === y ? ground : B.DIRT; }
      for (let yy = y + 1; yy < Math.min(HEIGHT - 1, y + 10); yy++) put(lx, yy, lz, B.AIR);
    }
    // gravel paths toward the plaza
    const path = (lx, lz) => { const i = idx(lx, y, lz); if (data[i] !== B.WATER) data[i] = B.GRAVEL; };
    if (vp.type === "plaza") { for (let a = 0; a < 16; a++) for (const b of [7, 8]) { path(a, b); path(b, a); } }
    else if (vp.dx) { for (let a = vp.dx > 0 ? 0 : 11; a < (vp.dx > 0 ? 5 : 16); a++) { path(a, 7); path(a, 8); } }
    else { for (let a = vp.dz > 0 ? 0 : 11; a < (vp.dz > 0 ? 5 : 16); a++) { path(7, a); path(8, a); } }
    if (vp.type === "plaza") {
      for (let lx = 5; lx <= 10; lx++) for (let lz = 5; lz <= 10; lz++) put(lx, y, lz, B.GRAVEL);
      for (let lx = 6; lx <= 9; lx++) for (let lz = 6; lz <= 9; lz++) { const rim = lx === 6 || lx === 9 || lz === 6 || lz === 9; put(lx, y, lz, rim ? B.COBBLE : B.WATER); put(lx, y - 1, lz, rim ? B.COBBLE : B.WATER); if (rim) put(lx, y + 1, lz, B.COBBLE); }
      for (const [lx, lz] of [[6, 6], [9, 6], [6, 9], [9, 9]]) for (let yy = y + 2; yy <= y + 3; yy++) put(lx, yy, lz, post);
      for (let lx = 6; lx <= 9; lx++) for (let lz = 6; lz <= 9; lz++) put(lx, y + 4, lz, wall);
      put(7, y + 1, 11, B.TORCH); put(8, y + 1, 4, B.TORCH);
      if (ver >= 8) put(10, y + 1, 10, make(B.BELL, 0));   // the village bell (ring it and villagers hurry home)
    } else if (vp.type === "farm") {
      for (let lx = 3; lx <= 12; lx++) for (let lz = 3; lz <= 12; lz++) {
        const edge = lx === 3 || lx === 12 || lz === 3 || lz === 12;
        if (edge) { put(lx, y, lz, B.LOG); continue; }
        if (lz === 7) { put(lx, y, lz, B.WATER); continue; }
        put(lx, y, lz, make(B.FARMLAND, 1));
        put(lx, y + 1, lz, make(lx < 8 ? B.WHEAT : B.CARROTS, Math.floor(hash3(this.seed, x0 + lx, y, z0 + lz) * 8)));
      }
      put(3, y + 1, 3, B.COMPOSTER); put(12, y + 1, 12, B.HAY); put(12, y + 2, 12, B.TORCH);
    } else {
      for (let lx = 4; lx <= 10; lx++) for (let lz = 4; lz <= 10; lz++) {
        const edgeX = lx === 4 || lx === 10, edgeZ = lz === 4 || lz === 10, corner = edgeX && edgeZ;
        put(lx, y, lz, wall);
        for (let yy = y + 1; yy <= y + 4; yy++) {
          if (corner) put(lx, yy, lz, post);
          else if (edgeX || edgeZ) put(lx, yy, lz, yy === y + 2 && (lx === 7 || lz === 7) ? B.GLASS : wall);
          else put(lx, yy, lz, B.AIR);
        }
        put(lx, y + 5, lz, wall);
      }
      // a door on the side facing the plaza (left open)
      const [dlx, dlz, f] = vp.dx > 0 ? [4, 7, 3] : vp.dx < 0 ? [10, 7, 1] : vp.dz > 0 ? [7, 4, 2] : [7, 10, 0];
      put(dlx, y + 1, dlz, make(B.DOOR, f | OPEN)); put(dlx, y + 2, dlz, make(B.DOOR, f | OPEN | TOP));
      put(5, y + 1, 5, make(B.BED, 0)); put(5, y + 1, 6, make(B.BED, 0 | HEAD));
      put(9, y + 1, 9, JOB_BLOCK[vp.prof]); put(9, y + 1, 5, B.TORCH);
    }
  }

  // An underground fort of stone bricks: a portal room with four halls leading to treasure rooms
  stronghold(data, x0, z0, s) {
    const SY = s.y, L = 30, boxes = [[s.x - 7, SY - 1, s.z - 8, s.x + 7, SY + 7, s.z + 8]], chests = [];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = 7, b = 7 + L, ex = s.x + dx * (b + 3), ez = s.z + dz * (b + 3);
      if (dx) boxes.push([Math.min(s.x + dx * a, s.x + dx * b), SY - 1, s.z - 2, Math.max(s.x + dx * a, s.x + dx * b), SY + 4, s.z + 2]);
      else boxes.push([s.x - 2, SY - 1, Math.min(s.z + dz * a, s.z + dz * b), s.x + 2, SY + 4, Math.max(s.z + dz * a, s.z + dz * b)]);
      boxes.push([ex - 3, SY - 1, ez - 3, ex + 3, SY + 5, ez + 3]);
      chests.push([ex, SY, ez]);
    }
    const put = (x, y, z, v) => { const lx = x - x0, lz = z - z0; if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16 && y > 0 && y < HEIGHT) data[idx(lx, y, lz)] = v; };
    const inChunk = bx => bx[3] >= x0 && bx[0] < x0 + 16 && bx[5] >= z0 && bx[2] < z0 + 16;
    for (const pass of [0, 1]) for (const bx of boxes) {
      if (!inChunk(bx)) continue;
      for (let x = Math.max(bx[0], x0); x <= Math.min(bx[3], x0 + 15); x++) for (let z = Math.max(bx[2], z0); z <= Math.min(bx[5], z0 + 15); z++) for (let y = bx[1]; y <= bx[4]; y++) {
        const edge = x === bx[0] || x === bx[3] || y === bx[1] || y === bx[4] || z === bx[2] || z === bx[5];
        if (pass === 0 && edge) put(x, y, z, hash3(this.seed, x, y, z) < 0.2 ? B.MOSSY : B.STONE_BRICKS);
        if (pass === 1 && !edge) put(x, y, z, B.AIR);
      }
    }
    // the portal: a ring of 12 frames around a 3×3 hole, a few already holding eyes, on a raised dais
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) put(s.x + dx, SY - 1, s.z + dz, B.STONE_BRICKS);
    for (const [x, y, z] of frameSpots(s)) put(x, y, z, make(B.END_FRAME, hash3(this.seed, x, 31, z) < 0.1 ? EYE_IN : 0));
    put(s.x, SY + 6, s.z + 7, B.TORCH); put(s.x, SY + 6, s.z - 7, B.TORCH);
    for (const [x, y, z] of chests) { put(x, y, z, make(B.CHEST, LOOT)); put(x + 2, y, z + 2, B.TORCH); }
  }

  // A broken obsidian portal frame with some Ember Depths blocks around it and a chest
  ruinedPortal(data, cols, r) {
    const cx = 6, cz = 6, col = cols[cx + cz * CHUNK];
    if (col.h <= SEA || col.h + 8 >= HEIGHT || col.biome === "peak") return;
    const y0 = col.h;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 4; dx++) {
      if (r() < 0.55) data[idx(cx + dx, y0, cz + dz)] = r() < 0.15 ? B.MAGMA : B.EMBERRACK;
      for (let y = y0 + 1; y < y0 + 7; y++) if (data[idx(cx + dx, y, cz + dz)] !== B.AIR && data[idx(cx + dx, y, cz + dz)] !== B.WATER) data[idx(cx + dx, y, cz + dz)] = B.AIR;
    }
    // frame along x: 4 wide, 5 tall; some pieces missing
    for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 5; dy++) {
      const edge = dx === 0 || dx === 3 || dy === 0 || dy === 4;
      if (!edge) continue;
      if (r() < 0.3) { if (r() < 0.5) data[idx(cx + dx + 1, y0, cz + 2)] = B.OBSIDIAN; continue; }   // fallen piece
      data[idx(cx + dx, y0 + 1 + dy, cz)] = B.OBSIDIAN;
    }
    data[idx(cx - 2, y0 + 1, cz + 2)] = make(B.CHEST, LOOT | 2);
  }

  tree(data, x, y, z, birch, r) {
    const log = birch ? B.BIRCH_LOG : B.LOG, leaf = birch ? B.BIRCH_LEAVES : B.LEAVES;
    const hgt = (birch ? 5 : 4) + Math.floor(r() * 3), top = y + hgt;
    for (let ly = top - 3; ly <= top; ly++) {
      const rad = ly >= top - 1 ? 1 : 2;
      for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad && (ly === top || r() < 0.5)) continue;
        const i = idx(x + dx, ly, z + dz);
        if (data[i] === B.AIR || data[i] === B.TALL_GRASS) data[i] = leaf;
      }
    }
    for (let ly = y; ly < top; ly++) data[idx(x, ly, z)] = log;
    data[idx(x, y - 1, z)] = B.DIRT;
    return top;
  }

  survivalCache(data, cols, x0, z0, addContents) {
    if (!addContents) return;
    const x = 8, z = 8, h = cols[x + z * CHUNK].h;
    if (h < SEA + 2 || ![B.GRASS, B.SAND, B.GRAVEL].includes(data[idx(x, h, z)]) ||
        ![B.STONE, B.DIRT, B.SANDSTONE, B.SAND].includes(data[idx(x, h - 2, z)])) return;
    const y = h - 2;
    data[idx(x, y, z)] = B.BARREL;
    // A mossy stone above it is the only clue. Existing content loading handles emptied and broken caches.
    if (!data[idx(x, h + 1, z)]) data[idx(x, h + 1, z)] = B.MOSSY;
    const slots = Array(27).fill(null);
    slots[0] = { id: I.BREAD, n: 2 }; slots[3] = { id: B.TORCH, n: 3 }; slots[7] = { id: I.STICK, n: 2 };
    addContents(x0 + x, y, z0 + z, B.BARREL, { type: "chest", slots });
  }

  ruin(data, cols, r) {
    const cx = 5 + Math.floor(r() * 6), cz = 5 + Math.floor(r() * 6), col = cols[cx + cz * CHUNK];
    if (col.h <= SEA + 1 || col.h + 9 >= HEIGHT || col.biome === "peak") return;
    const base = col.h;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      for (let y = base - 2; y <= base; y++) data[idx(cx + dx, y, cz + dz)] = r() < 0.5 ? B.MOSSY : B.COBBLE;     // floor
      const wall = Math.abs(dx) === 2 || Math.abs(dz) === 2;
      const height = wall ? 2 + Math.floor(r() * 5) : 0;
      for (let y = base + 1; y <= base + 6; y++) data[idx(cx + dx, y, cz + dz)] = y <= base + height ? (r() < 0.45 ? B.MOSSY : B.STONE_BRICKS) : B.AIR;
    }
    data[idx(cx + 2, base + 1, cz)] = B.AIR; data[idx(cx + 2, base + 2, cz)] = B.AIR;   // doorway
    data[idx(cx, base + 1, cz)] = make(B.CHEST, LOOT | 3);
    data[idx(cx - 1, base + 1, cz - 1)] = B.TORCH;
  }

  isNether() { return false; }
  // A good starting spot: dry land near trees, close to the middle of the world
  findSpawn() {
    for (let ring = 0; ring < 60; ring++) {
      for (let i = 0; i < 8 * Math.max(1, ring); i++) {
        const a = (i / (8 * Math.max(1, ring))) * Math.PI * 2, x = Math.round(Math.cos(a) * ring * 8), z = Math.round(Math.sin(a) * ring * 8);
        const col = this.column(x, z);
        if (col.h > SEA + 1 && col.h < SEA + 18 && (col.biome === "forest" || col.biome === "birch" || (ring > 30 && col.biome === "plains"))) return { x: x + 0.5, z: z + 0.5 };
      }
    }
    return { x: 0.5, z: 0.5 };
  }
}

// ---------- the Ember Depths: a closed underworld of caverns, lava seas, fungus forests, and fortresses ----------
export const LAVA_LEVEL = 22;
export class NetherGen {
  constructor(seedText) {
    this.version = CURRENT_GEN;
    this.seed = (hashSeed(seedText) ^ 0x2545f491) >>> 0;
    this.n = new Noise(this.seed);
    this.c = new Noise(this.seed ^ 0x68e31da4);
  }
  isNether() { return true; }
  biome(x, z) {
    const a = this.n.n2(x / 150, z / 150), b = this.n.n2(x / 150 + 300, z / 150 - 200);
    if (a > 0.35) return "crimson";
    if (a < -0.35) return "warped";
    if (b > 0.3) return "soul";
    if (b < -0.35) return "basalt";
    return "wastes";
  }
  column(x, z) { return { h: 40, biome: this.biome(x, z) }; }
  findSpawn() { return { x: 0.5, z: 0.5 }; }
  // Is this chunk part of a fortress or bastion? (same answer every time for the same seed)
  fortress(cx, cz) { const rx = Math.floor(cx / 4), rz = Math.floor(cz / 4); return hash3(this.seed, rx, 555, rz) < 0.3 ? { y: 34 + Math.floor(hash3(this.seed, rx, 556, rz) * 10) } : null; }
  bastion(cx, cz) {
    if (cx % 5 !== 2 && cx % 5 !== -3) return null;
    if (cz % 5 !== 2 && cz % 5 !== -3) return null;
    if (this.fortress(cx, cz)) return null;
    return hash3(this.seed, Math.floor(cx / 5), 777, Math.floor(cz / 5)) < 0.22 ? { y: 30 + Math.floor(hash3(this.seed, cx, 778, cz) * 8) } : null;
  }

  generate(cx, cz) {
    const data = new Uint32Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const r = rng(this.seed ^ Math.imul(cx, 83492791) ^ Math.imul(cz, 297121507));
    // cavern shapes on a coarse grid, blended in between
    const GY = HEIGHT / 4 + 1, grid = new Float32Array(25 * GY);
    for (let gz = 0; gz < 5; gz++) for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < GY; gy++) {
      const wx = x0 + gx * 4, wz = z0 + gz * 4, y = gy * 4;
      grid[gx + gz * 5 + gy * 25] = this.c.n3(wx / 48, y / 30, wz / 48) + 0.5 * this.c.n3(wx / 18 + 40, y / 14, wz / 18 - 40);
    }
    const dens = (lx, y, lz) => {
      const fx = lx / 4, fy = y / 4, fz = lz / 4, ix = Math.min(3, Math.floor(fx)), iy = Math.min(GY - 2, Math.floor(fy)), iz = Math.min(3, Math.floor(fz));
      const tx = fx - ix, ty = fy - iy, tz = fz - iz, at = (i, j, k) => grid[(ix + i) + (iz + k) * 5 + (iy + j) * 25], l = (p, q, t) => p + (q - p) * t;
      return l(l(l(at(0, 0, 0), at(1, 0, 0), tx), l(at(0, 0, 1), at(1, 0, 1), tx), tz), l(l(at(0, 1, 0), at(1, 1, 0), tx), l(at(0, 1, 1), at(1, 1, 1), tx), tz), ty);
    };
    const biomes = [];
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const wx = x0 + lx, wz = z0 + lz, biome = this.biome(wx, wz);
      biomes[lx + lz * CHUNK] = biome;
      for (let y = 0; y < HEIGHT; y++) {
        let v;
        if (y === 0 || y === HEIGHT - 1 || (y <= 2 && hash3(this.seed, wx, y, wz) < 0.5) || (y >= HEIGHT - 3 && hash3(this.seed, wx, y, wz) < 0.5)) v = B.BEDROCK;
        else {
          const bias = y < 16 ? (16 - y) / 16 * 1.2 : y > 60 ? (y - 60) / 19 * 1.5 : 0;
          if (dens(lx, y, lz) + bias > 0.12) {
            v = B.EMBERRACK;
            if (biome === "basalt") v = hash3(this.seed, wx, y, wz) < 0.7 ? B.BASALT : B.BLACKSTONE;
          } else v = y <= LAVA_LEVEL ? B.LAVA : B.AIR;
        }
        data[idx(lx, y, lz)] = v;
      }
      // dress the floors: moss, wailing sand, magma near the lava sea, the odd fire
      for (let y = 1; y < HEIGHT - 2; y++) {
        const i = idx(lx, y, lz), v = data[i];
        if (v === B.AIR || v === B.LAVA || v === B.BEDROCK || data[i + CHUNK * CHUNK] !== B.AIR) continue;
        if (biome === "crimson") data[i] = B.CRIMSON_NYLIUM;
        else if (biome === "warped") data[i] = B.WARPED_NYLIUM;
        else if (biome === "soul") { data[i] = B.SOUL_SAND; if (data[i - CHUNK * CHUNK] === B.EMBERRACK) data[i - CHUNK * CHUNK] = B.SOUL_SAND; }
        else if (biome === "basalt" && y <= LAVA_LEVEL + 3 && r() < 0.3) data[i] = B.MAGMA;
        else if (biome === "wastes") {
          if (y <= LAVA_LEVEL + 2 && r() < 0.25) data[i] = B.MAGMA;
          else if (r() < 0.015) data[i + CHUNK * CHUNK] = B.FIRE;
        }
      }
    }
    // ores
    const vein = (id, tries, minY, maxY, size) => {
      for (let t = 0; t < tries; t++) {
        let x = Math.floor(r() * 16), y = minY + Math.floor(r() * (maxY - minY)), z = Math.floor(r() * 16);
        const n = 1 + Math.floor(r() * size);
        for (let k = 0; k < n; k++) {
          if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT && data[idx(x, y, z)] === B.EMBERRACK) data[idx(x, y, z)] = id;
          const d = Math.floor(r() * 6); x += [1, -1, 0, 0, 0, 0][d]; y += [0, 0, 1, -1, 0, 0][d]; z += [0, 0, 0, 0, 1, -1][d];
        }
      }
    };
    vein(B.QUARTZ_ORE, 14, 8, 72, 8);
    vein(B.NETHER_GOLD_ORE, 9, 8, 72, 6);
    if (r() < 0.6) {   // ancient scrap: rare and deep, often hidden inside rock
      const x = Math.floor(r() * 16), y = 8 + Math.floor(r() * 14), z = Math.floor(r() * 16);
      if (data[idx(x, y, z)] !== B.BEDROCK && data[idx(x, y, z)] !== B.LAVA) data[idx(x, y, z)] = B.ANCIENT_SCRAP;
    }
    // shinestone hanging from ceilings
    for (let t = 0; t < 3; t++) {
      const x = 2 + Math.floor(r() * 12), z = 2 + Math.floor(r() * 12);
      for (let y = HEIGHT - 4; y > 40; y--) {
        if (data[idx(x, y, z)] !== B.AIR && data[idx(x, y - 1, z)] === B.AIR) {
          let px = x, py = y - 1, pz = z;
          for (let k = 0; k < 6 + Math.floor(r() * 10); k++) {
            if (px > 0 && px < 15 && pz > 0 && pz < 15 && py > 30 && data[idx(px, py, pz)] === B.AIR) data[idx(px, py, pz)] = B.SHINESTONE;
            const d = Math.floor(r() * 5); px += [1, -1, 0, 0, 0][d]; pz += [0, 0, 1, -1, 0][d]; py -= d === 4 ? 1 : 0;
          }
          break;
        }
      }
    }
    // giant fungi in the crimson and warped forests
    for (let t = 0; t < 8; t++) {
      const lx = 2 + Math.floor(r() * 12), lz = 2 + Math.floor(r() * 12), biome = biomes[lx + lz * CHUNK];
      if (biome !== "crimson" && biome !== "warped") continue;
      const moss = biome === "crimson" ? B.CRIMSON_NYLIUM : B.WARPED_NYLIUM;
      for (let y = LAVA_LEVEL + 1; y < HEIGHT - 12; y++) {
        if (data[idx(lx, y, lz)] !== moss || data[idx(lx, y + 1, lz)] !== B.AIR) continue;
        const stem = biome === "crimson" ? B.CRIMSON_STEM : B.WARPED_STEM, cap = biome === "crimson" ? B.CRIMSON_WART : B.WARPED_WART, hgt = 4 + Math.floor(r() * 4);
        let room = true; for (let k = 1; k <= hgt + 2; k++) if (data[idx(lx, y + k, lz)] !== B.AIR) room = false;
        if (!room) continue;
        for (let k = 1; k <= hgt; k++) data[idx(lx, y + k, lz)] = stem;
        for (let ly = y + hgt - 1; ly <= y + hgt + 1; ly++) {
          const rad = ly === y + hgt + 1 ? 1 : 2;
          for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
            const i = idx(lx + dx, ly, lz + dz);
            if (data[i] !== B.AIR) continue;
            if (ly < y + hgt + 1 && Math.abs(dx) < rad && Math.abs(dz) < rad) continue;   // hollow under the cap
            data[i] = r() < 0.08 ? B.SHROOMLIGHT : cap;
          }
        }
        break;
      }
    }
    // a lavafall now and then
    if (r() < 0.15) {
      const x = 1 + Math.floor(r() * 14), z = 1 + Math.floor(r() * 14);
      for (let y = 60; y > 30; y--) {
        if (data[idx(x, y, z)] !== B.AIR && data[idx(x, y - 1, z)] === B.AIR) {
          for (let yy = y; yy > LAVA_LEVEL && (yy === y || data[idx(x, yy, z)] === B.AIR); yy--) data[idx(x, yy, z)] = B.LAVA;
          break;
        }
      }
    }
    this.fortressPiece(data, cx, cz, r);
    this.bastionPiece(data, cx, cz, r);
    if (this.citadel) this.citadelPiece(data, cx, cz);
    return this.stamps ? applyStamps(this, data, cx, cz) : data;   // the campaign's Dragon Seal shrines (campaign worlds only)
  }

  // ----- the Cinder Citadel: Cindermaw's caldera, carved out of the rock wherever main.js placed it (this.citadel = { x, z }) -----
  // A round hall 30 blocks across from the middle, floor at y 30, ceiling at y 72; an entrance tunnel runs east (+x).
  citadelPiece(data, cx, cz) {
    const C = this.citadel, x0 = cx * CHUNK, z0 = cz * CHUNK;
    if (x0 > C.x + CITADEL.TUNNEL + 12 || x0 + CHUNK < C.x - CITADEL.R - 4 || z0 > C.z + CITADEL.R + 4 || z0 + CHUNK < C.z - CITADEL.R - 4) return;
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const dx = x0 + lx - C.x, dz = z0 + lz - C.z, d = Math.hypot(dx, dz);
      for (let y = 1; y < HEIGHT - 2; y++) { const v = citadelAt(dx, y, dz, d, this.seed); if (v !== undefined) data[idx(lx, y, lz)] = v; }
    }
  }

  // Ember Brick corridors that cross a 4×4-chunk area, with a garden room where they meet
  fortressPiece(data, cx, cz, r) {
    const f = this.fortress(cx, cz);
    if (!f) return;
    const m = (v, k) => ((v % k) + k) % k;
    const alongZ = m(cx, 4) === 1, alongX = m(cz, 4) === 2, fy = f.y;
    if (!alongZ && !alongX) return;
    const put = (x, y, z, v) => { if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT - 1) data[idx(x, y, z)] = v; };
    const corridor = (axis) => {
      for (let a = 0; a < 16; a++) for (let b = 5; b <= 10; b++) {
        const [x, z] = axis === "z" ? [b, a] : [a, b];
        const wall = b === 5 || b === 10;
        put(x, fy, z, B.EMBER_BRICKS);
        for (let y = fy + 1; y <= fy + 4; y++) put(x, y, z, wall ? (y === fy + 2 && a % 4 === 1 ? B.AIR : B.EMBER_BRICKS) : B.AIR);
        put(x, fy + 5, z, B.EMBER_BRICKS);
        if (wall && a % 8 === 3) for (let y = fy - 1; y > 1 && (data[idx(x, y, z)] === B.AIR || data[idx(x, y, z)] === B.LAVA); y--) put(x, y, z, B.EMBER_BRICKS);   // support pillars
      }
    };
    if (alongZ) corridor("z");
    if (alongX) corridor("x");
    if (alongZ && alongX) {   // a room with a wart garden and a chest
      for (let x = 3; x <= 12; x++) for (let z = 3; z <= 12; z++) {
        const wall = x === 3 || x === 12 || z === 3 || z === 12;
        put(x, fy, z, B.EMBER_BRICKS);
        for (let y = fy + 1; y <= fy + 5; y++) put(x, y, z, wall && !(x >= 6 && x <= 9) && !(z >= 6 && z <= 9) ? B.EMBER_BRICKS : B.AIR);
        put(x, fy + 6, z, B.EMBER_BRICKS);
      }
      for (const [x, z] of [[5, 5], [6, 5], [5, 6], [6, 6], [9, 9], [10, 9], [9, 10], [10, 10]]) { put(x, fy, z, B.SOUL_SAND); put(x, fy + 1, z, make(B.EMBER_WART, Math.floor(r() * 8))); }
      put(10, fy + 1, 5, make(B.CHEST, LOOT | 3));
    }
  }

  // A crumbling blackstone stronghold of the Boarkin, with gold and treasure
  bastionPiece(data, cx, cz, r) {
    const b = this.bastion(cx, cz);
    if (!b) return;
    const by = b.y, put = (x, y, z, v) => { if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT - 1) data[idx(x, y, z)] = v; };
    for (let x = 1; x <= 14; x++) for (let z = 1; z <= 14; z++) {
      const wall = x === 1 || x === 14 || z === 1 || z === 14;
      put(x, by, z, B.BLACKSTONE_BRICKS);
      for (let y = by + 1; y <= by + 7; y++) put(x, y, z, wall && r() > 0.12 && !(x >= 7 && x <= 8 && y <= by + 3) ? B.BLACKSTONE_BRICKS : B.AIR);
      if ((x === 1 || x === 14) && (z === 1 || z === 14)) for (let y = by - 1; y > 1 && (data[idx(x, y, z)] === B.AIR || data[idx(x, y, z)] === B.LAVA); y--) put(x, y, z, B.BLACKSTONE);
    }
    for (let x = 4; x <= 11; x++) for (let z = 4; z <= 11; z++) if (x === 4 || x === 11 || z === 4 || z === 11) put(x, by + 4, z, B.BLACKSTONE_BRICKS);   // inner balcony
    for (let i = 0; i < 4; i++) put(3 + Math.floor(r() * 10), by + 1, 3 + Math.floor(r() * 10), B.GOLD_BLOCK);
    put(6, by + 1, 6, make(B.CHEST, LOOT | 0)); put(9, by + 5, 9, make(B.CHEST, LOOT | 2));
  }
}

// ---------- the Hollow: floating pale islands over an endless void ----------
// Shape of the Cinder Citadel (positions relative to its middle)
export const CITADEL = { R: 30, F: 30, TOP: 72, TUNNEL: 62, PYLON_R: 23, PYLON_H: 12 };
export const CITADEL_PILLARS = Array.from({ length: 8 }, (_, k) => { const a = (k * 45 + 22.5) * Math.PI / 180; return { x: Math.round(Math.cos(a) * 18), z: Math.round(Math.sin(a) * 18), h: 6 + (k * 5) % 7 }; });
export const CITADEL_PYLONS = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(([a, b]) => ({ x: a * CITADEL.PYLON_R, z: b * CITADEL.PYLON_R }));
export const CITADEL_SPOTS = { chest: { x: 39, y: 31, z: -4 }, anchor: { x: 39, y: 31, z: 4 }, altar: { x: 0, y: 33, z: 0 }, egg: { x: 0, y: 33, z: 3 } };
function citadelAt(dx, y, dz, d, seed) {
  const { R, F, TOP, TUNNEL } = CITADEL;
  // entrance tunnel (with a wider hall at 36–42 holding supplies and a Respawn Anchor), and an approach cave at the far end
  if (dx >= R - 3 && dx <= TUNNEL + 10 && Math.abs(dz) <= 12 && y >= F - 1 && y <= F + 12 && d > R - 1) {
    if (dx > TUNNEL) {   // approach cave: a rough dome so the tunnel opens into the caverns
      const cd = Math.hypot(dx - TUNNEL - 4, (y - F - 4) * 1.3, dz);
      if (cd < 8) return y === F ? B.BLACKSTONE : B.AIR;
      if (y === F && Math.abs(dz) <= 2) return B.BLACKSTONE;
      return undefined;
    }
    const hall = dx >= 36 && dx <= 42, tw = hall ? 4 : 2, th = hall ? F + 6 : F + 5;
    if (Math.abs(dz) <= tw + 1 && y <= th + 1) {
      if (y < F) return B.BLACKSTONE;
      if (y === F) return B.CINDER_BRICKS;
      if (Math.abs(dz) === tw + 1 || y === th + 1) return dx % 6 === 0 && y === th + 1 ? B.SHINESTONE : B.CINDER_BRICKS;
      // the gate: two tall brick posts with lights at the tunnel mouth
      if (dx === TUNNEL && Math.abs(dz) === tw) return y >= th - 1 ? B.SHINESTONE : B.CINDER_BRICKS;
      // supplies for the fight and a Respawn Anchor, so fainting doesn't send you all the way home
      if (y === F + 1 && dx === CITADEL_SPOTS.chest.x && dz === CITADEL_SPOTS.chest.z) return make(B.CHEST, LOOT);
      if (y === F + 1 && dx === CITADEL_SPOTS.anchor.x && dz === CITADEL_SPOTS.anchor.z) return B.RESPAWN_ANCHOR;
      return B.AIR;
    }
    if (Math.abs(dz) <= tw + 2 && d > R + 2.5) return undefined;
  }
  if (d > R + 2.5) return undefined;
  if (d > R) return y >= F - 3 && y <= TOP + 2 ? (hash3(seed, dx, y, dz) < 0.03 ? B.MAGMA : B.CINDER_BRICKS) : undefined;   // the outer wall
  if (y > TOP + 2) return undefined;
  if (y >= TOP) return y === TOP && hash3(seed, dx, 999, dz) < 0.04 ? B.SHINESTONE : B.CINDER_BRICKS;    // the ceiling, with a few lights
  if (y < F - 3) return undefined;
  const channel = d >= 11 && d < 13 && Math.abs(dx) > 1.5 && Math.abs(dz) > 1.5;   // a ring of lava with 4 bridges
  if (y < F) return channel && y === F - 1 ? B.LAVA : B.BASALT;
  if (y === F) {
    if (channel) return B.LAVA;
    if ((d >= 7.5 && d < 8.5) || (d >= 19.5 && d < 20.5)) return B.BLACKSTONE_BRICKS;   // floor rings you can read from the air
    return hash3(seed, dx, F, dz) < 0.12 ? B.BASALT : B.BLACKSTONE;
  }
  // the dais and altar in the middle
  if (d <= 4.5 && y === F + 1) return B.CINDER_BRICKS;
  if (d <= 2.5 && y === F + 2) return B.CINDER_BRICKS;
  if (dx === 0 && dz === 0 && y === F + 3) return B.CINDER_ALTAR;
  // basalt pillars for cover, each topped with a light
  for (const p of CITADEL_PILLARS) if (Math.abs(dx - p.x) <= 1 && Math.abs(dz - p.z) <= 1 && y <= F + p.h) return y === F + p.h && dx === p.x && dz === p.z ? B.SHINESTONE : B.BASALT;
  // four brick towers that hold the Ember Pylons
  for (const p of CITADEL_PYLONS) if (Math.abs(dx - p.x) <= 1 && Math.abs(dz - p.z) <= 1 && y <= F + CITADEL.PYLON_H) return B.CINDER_BRICKS;
  // four raised ledges against the wall (northeast, northwest, southwest, southeast), each with a stair ramp up from the floor
  for (let k = 0; k < 4; k++) {
    const a = (45 + k * 90) * Math.PI / 180, u = dx * Math.cos(a) + dz * Math.sin(a), v = -dx * Math.sin(a) + dz * Math.cos(a);
    if (u >= 26 && Math.abs(v) <= 4 && y === F + 8) return B.CINDER_BRICKS;
    if (u >= 26 && Math.abs(v) <= 4 && y === F + 9 && u >= 29) return B.CINDER_BRICKS;
    if (u >= 18 && u < 26 && Math.abs(v) <= 1 && y <= F + Math.floor(u - 18) + 1) return B.BASALT;
  }
  return B.AIR;
}
// Darkslate Spark Ore in the Deep: small veins inside darkslate only (never in built rooms), the same in every world
function sparkVeins(data, cx, cz) {
  const r = rng(hashSeed("spark") ^ (cx * 73856093) ^ (cz * 19349663));
  for (let t = 0; t < 5; t++) {
    let x = Math.floor(r() * 16), y = 4 + Math.floor(r() * 50), z = Math.floor(r() * 16);
    const n = 2 + Math.floor(r() * 6);
    for (let k = 0; k < n; k++) {
      if (x >= 0 && x < 16 && z >= 0 && z < 16 && y > 0 && y < HEIGHT && data[idx(x, y, z)] === B.DARKSLATE) data[idx(x, y, z)] = B.DARK_SPARK_ORE;
      const d = Math.floor(r() * 6); x += [1, -1, 0, 0, 0, 0][d]; y += [0, 0, 1, -1, 0, 0][d]; z += [0, 0, 0, 0, 1, -1][d];
    }
  }
}
// Hush Sensors growing on hushmoss in the Deep (about 1 in 40 open patches; only with 3 blocks of headroom, so no path gets blocked)
function hushSensors(data, cx, cz) {
  const r = rng(hashSeed("hush") ^ (cx * 83492791) ^ (cz * 297121507)), L = CHUNK * CHUNK;
  for (let i = 0; i < data.length - 3 * L; i++) if (data[i] === B.HUSHMOSS && !data[i + L] && !data[i + 2 * L] && !data[i + 3 * L] && r() < 0.025) data[i + L] = B.HUSH_SENSOR;
}
// ----- dimensions made from a packed map (the Deep, the Echo Expanse). Chunks are unpacked only when loaded.
// Outside the map: solid rock (the Deep) or empty sky (the Expanse).
export class MapGen {
  constructor(map, kind) { this.map = map; this.kind = kind; this.version = CURRENT_GEN; this.seed = 0x10571057; }
  isNether() { return false; }
  isMap() { return this.kind; }
  column(x, z) { return { h: 40, biome: this.kind }; }
  findSpawn() { const a = this.map.meta.arrival; return { x: a.x, z: a.z }; }
  generate(cx, cz) {
    const k = cx + "," + cz;
    if (this.map.has(k)) {
      const data = this.map.decode(k);
      if (this.kind === "deep") sparkVeins(data, cx, cz);
      if (this.kind === "deep") hushSensors(data, cx, cz);
      return this.stamps ? applyStamps(this, data, cx, cz) : data;
    }
    const data = new Uint32Array(CHUNK * CHUNK * HEIGHT);
    if (this.kind !== "expanse") { data.fill(this.map.meta.fill || B.DARKSLATE); data.fill(B.BEDROCK, 0, CHUNK * CHUNK); data.fill(B.BEDROCK, CHUNK * CHUNK * (HEIGHT - 1)); }   // the Deep and the temples sit inside solid rock
    return this.stamps ? applyStamps(this, data, cx, cz) : data;   // campaign rooms (js/campaign.js) are stamped in campaign worlds only
  }
}
// Stamps use 65535 for untouched terrain. New stamps can carry full-width blocks and chunk-indexed contents.
export function applyStamps(gen, data, cx, cz, addContents) {
  for (const st of gen.stamps || []) {
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    if (x0 >= st.x + st.size || x0 + CHUNK <= st.x || z0 >= st.z + st.size || z0 + CHUNK <= st.z) continue;
    if (st.lake) { carveLake(gen, data, x0, z0, st.lake); continue; }
    if (st.apply) { st.apply(gen, data, x0, z0, addContents); continue; }
    if (addContents && st.contents) for (const record of st.contents.get(cx + "," + cz) || []) addContents(...record);
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const sx = x0 + lx - st.x, sz = z0 + lz - st.z;
      if (sx < 0 || sz < 0 || sx >= st.size || sz >= st.size) continue;
      for (let y = 1; y < HEIGHT; y++) { const v = st.cells[sx + sz * st.size + y * st.size * st.size]; if (v !== 65535) data[idx(lx, y, lz)] = v; }
      // a "foot": under the stamp's lowest built layer, fill any air or water down to solid ground (the Grand Desert Temple)
      const f = st.foot;
      if (f && st.cells[sx + sz * st.size + f.y * st.size * st.size] !== 65535) for (let y = f.y - 1; y > 0; y--) { const i = idx(lx, y, lz), id = data[i] & 0xFFFF00FF; if (id !== 0 && id !== B.WATER && id !== B.LAVA && id !== B.TALL_GRASS) break; data[i] = f.mat; }
      // the edge slopes smoothly from the site's level down (or up) to the natural ground, so you can always walk in
      const b = st.blend; if (!b) continue;
      const d = Math.hypot(sx - st.size / 2 + 0.5, sz - st.size / 2 + 0.5);
      if (d < b.r0 || d > b.r1) continue;
      const h = gen.column(x0 + lx, z0 + lz).h; if (h < SEA) continue;
      const target = Math.round(b.g + (h - b.g) * (d - b.r0) / (b.r1 - b.r0));
      for (let y = Math.max(1, target - 3); y <= target; y++) data[idx(lx, y, lz)] = y === target ? b.top : b.under;
      for (let y = target + 1; y <= Math.min(HEIGHT - 2, Math.max(h, b.g) + 8); y++) data[idx(lx, y, lz)] = B.AIR;
    }
  }
  return data;
}
// A round bay of real sea water (used when a world has no open ocean near spawn, so the sea temple's lighthouse
// still stands in deep water). lake: { cx, cz, r0 (open water), r1 (where the shore meets the natural land) }.
// The floor dips gently toward the middle; the shore slopes up to the land around it, so you can walk or row in.
export function carveLake(gen, data, x0, z0, lake) {
  for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
    const x = x0 + lx, z = z0 + lz, d = Math.hypot(x + 0.5 - lake.cx, z + 0.5 - lake.cz);
    if (d > lake.r1) continue;
    const h = gen.column(x, z).h;
    // depth: SEA-9 in the middle, SEA-4 at the edge of open water, then up the beach to the natural ground
    const floor = d <= lake.r0 ? Math.round(SEA - 9 + 5 * (d / lake.r0) ** 2) : Math.round(SEA - 4 + (Math.max(h, SEA + 1) - (SEA - 4)) * (d - lake.r0) / (lake.r1 - lake.r0));
    if (d > lake.r0 && floor >= h) continue;   // already lower than the shore line here: leave the land alone
    for (let y = Math.max(1, floor - 3); y <= floor; y++) data[idx(lx, y, lz)] = y === floor ? (floor >= SEA ? B.SAND : B.GRAVEL) : B.SAND;
    const top = Math.min(HEIGHT - 2, Math.max(h, SEA) + 10);
    for (let y = floor + 1; y <= top; y++) data[idx(lx, y, lz)] = y <= SEA ? B.WATER : B.AIR;
  }
}
// ----- the Forsaken World: the packaged core map (maps/forsaken-v1.bin) plus plain misty scenery around it -----
// The core is copied fresh from the template every time a chunk loads; the player's changes are saved separately
// (dims.forsaken.mods) and laid on top, so the template itself never changes. Past 128 blocks a wall of mist-hidden
// bedrock keeps the adventure bounded.
export const FORSAKEN_EDGE = 128;
export class ForsakenGen {
  constructor(template) {
    this.t = template; this.version = CURRENT_GEN;
    this.seed = 0x5eed4f57; this.n = new Noise(this.seed);
    this.r = template.meta.core.min; this.size = template.meta.core.size;
  }
  isNether() { return false; }
  isForsaken() { return true; }
  landBiome(col) { return col.biome; }
  column(x, z) {
    if (this.kingdom?.contains(Math.floor(x / CHUNK), Math.floor(z / CHUNK))) return this.kingdom.column(x, z);
    return { h: 34, biome: x < -18 && z < -18 ? "pale" : "forsaken" };
  }
  voidAt(x, z) {
    return this.kingdom?.contains(Math.floor(x / CHUNK), Math.floor(z / CHUNK)) &&
      this.kingdom.column(x, z).h < 0;
  }
  findSpawn() { const a = this.t.meta.arrival; return { x: a.x, z: a.z }; }
  inCore(cx, cz) { const lo = this.r / CHUNK, hi = (this.r + this.size) / CHUNK; return cx >= lo && cx < hi && cz >= lo && cz < hi; }
  generate(cx, cz, opts = {}) {
    if (this.inCore(cx, cz)) return this.t.chunks.get(cx + "," + cz).slice();
    if (this.kingdom?.contains(cx, cz)) {
      const data = this.kingdom.generate(cx, cz);
      this.kingdom.fallen?.apply(cx, cz, data, opts.addContents);
      this.kingdom.grandFortress?.apply(cx, cz, data, opts.addContents);
      return data;
    }
    // scenery: low misty hills, bare trees, and the edge wall
    const data = new Uint32Array(CHUNK * CHUNK * HEIGHT), x0 = cx * CHUNK, z0 = cz * CHUNK;
    const r = rng(this.seed ^ Math.imul(cx, 83492791) ^ Math.imul(cz, 297121507));
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const x = x0 + lx, z = z0 + lz, edge = Math.max(Math.abs(x + 0.5), Math.abs(z + 0.5)) >= FORSAKEN_EDGE;
      const h = Math.round(34 + this.n.n2(x / 46, z / 46) * 4 + this.n.n2(x / 16, z / 16) * 1.6);
      data[idx(lx, 0, lz)] = B.BEDROCK;
      for (let y = 1; y <= (edge ? HEIGHT - 2 : h); y++) data[idx(lx, y, lz)] = edge ? B.BEDROCK : y < h - 3 ? B.STONE : y < h ? B.DIRT : B.GRASS;
    }
    for (let t = 0; t < 4; t++) {   // bare trees
      const lx = 2 + Math.floor(r() * 12), lz = 2 + Math.floor(r() * 12);
      let y = HEIGHT - 2; while (y > 1 && data[idx(lx, y, lz)] === B.AIR) y--;
      if (data[idx(lx, y, lz)] !== B.GRASS) continue;
      const hgt = 5 + Math.floor(r() * 4); for (let k = 1; k <= hgt; k++) data[idx(lx, y + k, lz)] = B.LOG;
      if (lx > 0) data[idx(lx - 1, y + hgt - 1, lz)] = B.LOG;
    }
    if (this.reaches && !(this.reachesSkip && this.reachesSkip.has(cx + "," + cz))) this.reaches(cx, cz, data);   // the Outer Reaches (js/forsaken-reaches.js), set up by main.js
    return data;
  }
}
export const END_TOP = 48;
export class EndGen {
  constructor(seedText, version = CURRENT_GEN) {
    this.version = version;   // older worlds: ships only appear in Hollow land the player hasn't changed
    this.seed = (hashSeed(seedText) ^ 0x7f4a7c15) >>> 0;
    this.n = new Noise(this.seed);
    // ten obsidian pillars ring the central island; each holds a healing crystal
    this.pillars = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return { i, x: Math.round(Math.cos(a) * 30), z: Math.round(Math.sin(a) * 30), r: 2 + (i % 3), top: 58 + (i * 7) % 16 }; });
  }
  isNether() { return false; }
  isEnd() { return true; }
  biome() { return "hollow"; }
  column() { return { h: END_TOP, biome: "hollow" }; }
  findSpawn() { return { x: 100.5, z: 0.5 }; }
  // top and bottom of the land in a column (or null for open void)
  land(x, z) {
    const d = Math.hypot(x, z);
    if (d < 58) {
      const top = END_TOP + Math.round(this.n.n2(x / 22, z / 22) * 2);
      return { top, bottom: top - Math.round(3 + (58 - d) * 0.32 + this.n.n2(x / 9, z / 9) * 2), outer: false };
    }
    if (d > 380) {
      const v = this.n.fbm2(x / 120, z / 120, 3) - Math.max(0, (420 - d) / 40) * 0.5;
      if (v > 0.2) { const top = 46 + Math.round(this.n.n2(x / 50, z / 50) * 5); return { top, bottom: top - Math.round((v - 0.2) * 45 + 2), outer: true }; }
    }
    return null;
  }
  // a Hollow tower stands in some 5×5-chunk areas far from the middle
  city(cx, cz) {
    const m = (v, k) => ((v % k) + k) % k;
    if (m(cx, 5) !== 2 || m(cz, 5) !== 2) return null;
    const x = cx * 16 + 8, z = cz * 16 + 8;
    if (Math.hypot(x, z) < 420 || hash3(this.seed, Math.floor(cx / 5), 901, Math.floor(cz / 5)) > 0.45) return null;
    const l = this.land(x, z);
    return l ? { x, z, y: l.top + 1 } : null;
  }
  generate(cx, cz, opts = {}) {
    const data = new Uint32Array(CHUNK * CHUNK * HEIGHT), x0 = cx * CHUNK, z0 = cz * CHUNK;
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const x = x0 + lx, z = z0 + lz, l = this.land(x, z);
      if (l) for (let y = Math.max(1, l.bottom); y <= l.top; y++) data[idx(lx, y, lz)] = B.HOLLOWSTONE;
      if (l && l.outer && hash3(this.seed, x, 5, z) < 0.006) {   // chorus plants
        const h = 2 + Math.floor(hash3(this.seed, x, 6, z) * 4);
        for (let k = 1; k <= h && l.top + k < HEIGHT - 1; k++) data[idx(lx, l.top + k, lz)] = k === h ? B.CHORUS_FLOWER : B.CHORUS_PLANT;
      }
      for (const p of this.pillars) {
        if ((x - p.x) ** 2 + (z - p.z) ** 2 > p.r * p.r) continue;
        for (let y = END_TOP - 8; y <= p.top; y++) data[idx(lx, y, lz)] = B.OBSIDIAN;
      }
    }
    const c = this.city(cx, cz);
    if (c) this.tower(data, c);
    const s = this.shipAt(cx, cz, opts.version ?? this.version);
    if (s) this.ship(data, s);
    return data;
  }
  // Milestone 14 (land v9): a Hollow ship floats beside some towers (in the chunk just east of the tower)
  shipAt(cx, cz, version = this.version) {
    if (version < 9) return null;
    const c = this.city(cx - 1, cz);
    if (!c || hash3(this.seed, cx, 913, cz) > 0.6) return null;
    return { x0: cx * CHUNK, z0: cz * CHUNK, y: Math.min(HEIGHT - 12, c.y + 14) };
  }
  ship(data, s) {
    const put = (lx, y, lz, v) => { if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16 && y > 0 && y < HEIGHT) data[idx(lx, y, lz)] = v; };
    const Y = s.y, mid = 7;
    for (let lz = 1; lz <= 14; lz++) {
      const hw = lz <= 2 || lz >= 13 ? 1 : lz === 3 || lz === 12 ? 2 : 3;   // pointed at the bow and the stern
      for (let dx = -hw; dx <= hw; dx++) {
        const x = mid + dx, side = Math.abs(dx) === hw;
        if (!side) put(x, Y, lz, B.VIOLET_BRICKS);   // the hull's floor
        for (let y = Y + 1; y <= Y + 2; y++) put(x, y, lz, side || lz === 1 || lz === 14 ? B.VIOLET_BRICKS : B.AIR);
        put(x, Y + 3, lz, side ? B.VIOLET_PILLAR : lz >= 7 && lz <= 8 && dx === 0 ? B.AIR : B.HOLLOW_BRICKS);   // the deck, with a hatch
      }
    }
    for (let y = Y + 4; y <= Y + 10; y++) put(mid, y, 10, B.VIOLET_PILLAR);   // the mast and a sail
    for (let y = Y + 6; y <= Y + 9; y++) for (let dx = -3; dx <= 3; dx++) if (dx) put(mid + dx, y, 10, B.BLACK_WOOL);
    put(mid - 1, Y + 1, 5, make(B.CHEST, LOOT | 2)); put(mid + 1, Y + 1, 10, make(B.CHEST, LOOT | 2));   // ship treasure below deck
    put(mid, Y + 4, 14, B.WYRM_HEAD);   // a trophy on the bow
  }
  tower(data, c) {
    const base = c.y, top = Math.min(HEIGHT - 3, base + 24), put = (lx, y, lz, v) => { if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16 && y > 0 && y < HEIGHT) data[idx(lx, y, lz)] = v; };
    for (let lx = 3; lx <= 12; lx++) for (let lz = 3; lz <= 12; lz++) {
      const wall = lx === 3 || lx === 12 || lz === 3 || lz === 12, corner = (lx === 3 || lx === 12) && (lz === 3 || lz === 12);
      for (let y = base - 1; y <= top; y++) {
        const floor = (y - base + 1) % 6 === 0 || y === base - 1 || y === top;
        if (corner) put(lx, y, lz, B.VIOLET_PILLAR);
        else if (wall) put(lx, y, lz, (y - base) % 6 === 2 && (lx === 7 || lx === 8 || lz === 7 || lz === 8) ? B.AIR : B.VIOLET_BRICKS);
        else put(lx, y, lz, floor && !(lx >= 7 && lx <= 8 && lz >= 7 && lz <= 8 && y !== top && y !== base - 1) ? B.VIOLET_BRICKS : B.AIR);
      }
    }
    for (let y = base; y < top; y++) put(7, y, 7, B.VIOLET_PILLAR);   // a column in the stairwell to climb beside
    put(5, top - 5, 5, make(B.CHEST, LOOT | 1)); put(10, base + 5, 10, make(B.CHEST, LOOT | 3));
    put(3, base, 7, B.AIR); put(3, base + 1, 7, B.AIR);   // doorway
  }
}
