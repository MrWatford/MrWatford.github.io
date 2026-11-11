import { B, I, CHUNK, HEIGHT, SEA, make } from "./blocks.js";
import { Grid, KEEP } from "./maps.js";
import { hash3 } from "./noise.js";
import { untouchedFootprint } from "./structure-placement.js";
import { LOOT } from "./worldgen.js";
import { DESERT_VAULT_LAYOUT, stampDesertVault } from "./desert-vaults.js";
import { OBSIDIAN_BADLANDS_LAYOUT, canPlaceObsidianBadlands, obsidianBadlandsBounds } from "./obsidian-badlands.js";
import { OBSIDIAN_VENT_LAYOUT, stampObsidianVent } from "./obsidian-vent.js";

const SIZE = 16;
export const RELIC_SITES = [
  { key: "shrine", name: "Desert Shrine", item: I.DUNE_RELIC, crest: B.SUN_GLYPH },
  { key: "graveyard", name: "Leviathan Graveyard", item: I.SUN_RELIC, crest: B.QUARTZ_BLOCK },
  { key: "tomb", name: "Buried Royal Tomb", item: I.TOMB_RELIC, crest: B.SUN_BRICKS }
];
export const DESERT_SITES = [
  ...RELIC_SITES,
  { key: "observatory", name: "Great Dune Observatory", salt: 583 },
  { key: "city", name: "Abandoned Desert City", salt: 584, size: 32 },
  { key: "citadel", name: "Obsidian Citadel", salt: 585, size: 48 }
];
export const SHRINE_INSCRIPTION = "Solkara's keepers carried three relics into the dunes. When the Leviathan rises, wait for the sand to settle. Sound the Sandcaller Horn once at each of three surfacings. Spill no blood during the rite.";

export function planRelicSites(gen, data, previous = {}, origin = gen.findSpawn()) {
  const sites = { ...previous };
  const untouched = untouchedFootprint(data);
  const reserved = (gen.stamps || []).map(({ x, z, size }) => ({ x, z, size }));
  for (const def of DESERT_SITES) {
    const s = sites[def.key];
    if (s) reserved.push(s.volcanicLayout === OBSIDIAN_BADLANDS_LAYOUT ?
      obsidianBadlandsBounds(s) : { x: s.x, z: s.z, size: def.size || SIZE });
  }
  for (const def of DESERT_SITES) {
    if (sites[def.key]) continue;
    const size = def.size || SIZE, half = size / 2;
    let fallback = null;
    const offset = hash3(gen.seed, def.item ?? def.salt, 6, 0) * Math.PI * 2;
    for (let radius = 64; radius <= 1800 && !sites[def.key]; radius += 32) {
      const samples = Math.ceil(2 * Math.PI * radius / 48);
      for (let i = 0; i < samples; i++) {
        const angle = offset + i * Math.PI * 2 / samples;
        const x = Math.floor((origin.x + Math.cos(angle) * radius) / CHUNK) * CHUNK;
        const z = Math.floor((origin.z + Math.sin(angle) * radius) / CHUNK) * CHUNK;
        if (!untouched(x, z, x + size, z + size)) continue;
        if (reserved.some(s => x < s.x + s.size + 24 && x + size + 24 > s.x && z < s.z + s.size + 24 && z + size + 24 > s.z)) continue;
        if (gen.strongholds?.some(s => Math.hypot(s.x - x - half, s.z - z - half) < 77 + half)) continue;
        const center = gen.column(x + half, z + half);
        if (center.biome !== "sandy" || center.h <= SEA + 2 || center.h >= HEIGHT - 12) continue;
        let clear = true;
        for (let cx = x / CHUNK; cx < (x + size) / CHUNK; cx++) for (let cz = z / CHUNK; cz < (z + size) / CHUNK; cz++) {
          if (gen.villagePiece?.(cx, cz) || hash3(gen.seed, cx, 99, cz) < 0.035 || hash3(gen.seed, cx, 77, cz) < 0.02) clear = false;
        }
        if (!clear) continue;
        const edge = size - 2, corners = [[1, 1], [1, edge], [edge, 1], [edge, edge]];
        if (corners.some(([dx, dz]) => Math.abs(gen.column(x + dx, z + dz).h - center.h) > 2)) continue;
        const site = { x, y: center.h, z };
        if (def.key === "tomb" || def.key === "citadel") site.vaultLayout = DESERT_VAULT_LAYOUT;
        if (def.key === "citadel") {
          fallback ||= site;
          if (!canPlaceObsidianBadlands(gen, site, untouched, reserved)) continue;
          site.volcanicLayout = OBSIDIAN_BADLANDS_LAYOUT;
          site.ventLayout = OBSIDIAN_VENT_LAYOUT;
        }
        sites[def.key] = site;
        reserved.push(site.volcanicLayout ? obsidianBadlandsBounds(site) : { x, z, size });
        break;
      }
    }
    if (!sites[def.key] && fallback) sites[def.key] = fallback;
  }
  return sites;
}

export function relicCache(site) {
  return { x: site.x + 8, y: site.y + 1, z: site.z + 5 };
}
export function shrineSign(site) {
  return { x: site.x + 5, y: site.y + 1, z: site.z + 10 };
}
export function observatoryTablet(site) {
  return { x: site.x + 8, y: site.y + 1, z: site.z + 8 };
}
export function cityTablet(site) {
  return { x: site.x + 10, y: site.y - 3, z: site.z + 10 };
}
export function cityCache(site) {
  return { x: site.x + 10, y: site.y - 3, z: site.z + 3 };
}
export function citadelTablet(site) {
  return { x: site.x + 20, y: site.y + 1, z: site.z + 34 };
}
export function citadelCache(site) {
  return { x: site.x + 29, y: site.y + 1, z: site.z + 34 };
}
export function citadelArena(site) {
  return { x: site.x + 24.5, y: site.y + 1, z: site.z + 19.5, radius: 10 };
}

function buildObsidianCitadel(site) {
  const { x, y, z } = site, size = 48;
  const g = new Grid(0, 0, size, size, KEEP);
  const brick = B.BLACKSTONE_BRICKS, basalt = B.BASALT;
  g.box(3, y - 2, 3, 44, y, 44, brick);
  g.box(3, y + 1, 3, 44, y + 10, 44, B.AIR);
  g.walls(5, y + 1, 5, 42, y + 5, 39, brick);
  g.box(22, y + 1, 39, 26, y + 3, 39, B.AIR);
  for (const xx of [5, 42]) for (const zz of [5, 39]) {
    g.box(xx - 2, y + 1, zz - 2, xx + 2, y + 8, zz + 2, brick);
    g.box(xx - 1, y + 2, zz - 1, xx + 1, y + 7, zz + 1, B.AIR);
    g.set(xx, y + 9, zz, B.SHROOMLIGHT);
    for (const dx of [-2, 2]) for (const dz of [-2, 2]) g.set(xx + dx, y + 9, zz + dz, basalt);
  }
  // The causeway spans a recessed moat. Its rail blocks keep the lip visible.
  for (const [x0, x1] of [[6, 21], [27, 41]]) {
    g.box(x0, y, 40, x1, y, 43, B.AIR);
    g.box(x0, y - 1, 40, x1, y - 1, 43, B.LAVA);
    g.box(x0, y, 44, x1, y, 44, basalt);
  }
  g.box(22, y, 40, 26, y, 45, basalt);
  for (const xx of [22, 26]) g.box(xx, y + 1, 40, xx, y + 1, 44, brick);
  // Split basalt pillars and a sunken heat ring define the arena's silhouette.
  for (let zz = 8; zz <= 30; zz++) for (let xx = 13; xx <= 35; xx++) {
    const r = Math.hypot(xx - 24, zz - 19);
    if (r < 10.5) g.set(xx, y, zz, r > 8.9 ? B.MAGMA : r > 7.9 ? basalt : B.BLACKSTONE);
  }
  g.box(23, y, 27, 25, y, 39, basalt);
  for (const xx of [11, 37]) for (const zz of [12, 26]) {
    g.box(xx, y + 1, zz, xx, y + 6, zz, B.OBSIDIAN);
    g.set(xx, y + 7, zz, B.SHROOMLIGHT);
  }
  g.set(20, y + 1, 34, B.LORE_TABLET);
  g.set(29, y + 1, 34, make(B.CHEST, LOOT));
  stampDesertVault(g, "citadel", site);
  stampObsidianVent(g, site);
  return { x, z, size, cells: g.data };
}

function buildDesertCity(site) {
  const { x, y, z } = site, size = 32;
  const g = new Grid(0, 0, size, size, KEEP);
  const stone = B.SANDSTONE, trim = B.SUN_BRICKS;
  g.box(2, y - 1, 2, 29, y, 29, stone);
  g.box(2, y + 1, 2, 29, y + 9, 29, B.AIR);
  g.box(14, y, 3, 17, y, 29, trim);
  // Broken watchtowers frame the south approach.
  for (const left of [5, 22]) {
    g.walls(left, y + 1, 22, left + 4, y + 5, 26, stone);
    g.box(left + 1, y + 4, 23, left + 3, y + 4, 25, trim);
    g.box(left + 1, y + 1, 26, left + 3, y + 2, 26, B.AIR);
    for (const xx of [left, left + 4]) for (const zz of [22, 26]) {
      g.box(xx, y + 5, zz, xx, y + 7 + (xx === left ? 1 : 0), zz, trim);
    }
  }
  for (const [xx, zz] of [[4, 6], [22, 5], [22, 13]]) {
    g.walls(xx, y + 1, zz, xx + 5, y + 2, zz + 4, stone);
    g.box(xx, y + 3, zz, xx + 3, y + 3, zz, trim);
    g.box(xx + 2, y + 1, zz + 4, xx + 3, y + 2, zz + 4, B.AIR);
    g.box(xx + 4, y + 1, zz + 1, xx + 5, y + 1, zz + 3, B.SAND);
  }
  for (const xx of [10, 20]) {
    g.box(xx, y + 1, 15, xx, y + 1, 19, stone);
    for (const zz of [15, 19]) g.box(xx, y + 2, zz, xx, y + 3, zz, B.LOG);
    g.box(xx - 1, y + 4, 15, xx + 1, y + 4, 19, B.WOOL);
  }
  // A stair in the market leads down to the library and a concealed cache.
  for (let zz = 20; zz >= 12; zz--) {
    const floor = y - Math.floor((21 - zz) / 2);
    g.box(12, floor, zz, 13, floor, zz, trim);
    g.box(12, floor + 1, zz, 13, floor + 3, zz, B.AIR);
  }
  g.box(6, y - 4, 5, 13, y - 1, 12, trim);
  g.box(7, y - 3, 6, 12, y - 1, 11, B.AIR);
  g.box(12, y - 3, 12, 13, y - 1, 12, B.AIR);
  g.box(7, y - 3, 6, 7, y - 2, 10, B.BOOKSHELF);
  g.set(10, y - 3, 10, B.LORE_TABLET);
  g.set(11, y - 1, 9, B.SHINESTONE);
  g.box(8, y - 4, 2, 12, y - 1, 4, trim);
  g.box(9, y - 3, 3, 11, y - 1, 4, B.AIR);
  g.set(10, y - 3, 5, B.COBBLE);
  g.set(10, y - 2, 5, B.COBBLE);
  g.set(10, y - 3, 3, make(B.CHEST, LOOT));
  return { x, z, size, cells: g.data };
}

export function buildRelicStamp(def, site) {
  if (def.key === "city") return buildDesertCity(site);
  if (def.key === "citadel") return buildObsidianCitadel(site);
  const { x, y, z } = site;
  const g = new Grid(0, 0, SIZE, SIZE, KEEP);
  const floor = def.key === "tomb" ? B.SUN_BRICKS : B.SANDSTONE;
  g.box(2, y - 2, 2, 13, y, 13, floor);
  g.box(2, y + 1, 2, 13, y + 8, 13, B.AIR);
  g.box(6, y, 12, 10, y, 14, B.SANDSTONE);
  if (def.key === "observatory") {
    for (let zz = 2; zz <= 13; zz++) for (let xx = 2; xx <= 13; xx++) {
      const radius = Math.hypot(xx - 7.5, zz - 7.5);
      if (radius > 4 && radius < 5.5) g.set(xx, y, zz, B.SUN_GLYPH);
      if (radius >= 5.5 && radius < 6.4 && !(zz > 10 && xx >= 6 && xx <= 9)) {
        g.set(xx, y + 1, zz, B.KEEPER_STONE);
      }
    }
    for (const [xx, zz] of [[3, 7], [12, 7], [7, 3]]) {
      g.box(xx, y + 1, zz, xx, y + 4, zz, B.SUN_BRICKS);
      g.set(xx, y + 5, zz, B.SHINESTONE);
    }
    g.set(8, y, 8, B.KEEPER_COPPER);
    g.set(8, y + 1, 8, B.LORE_TABLET);
    return { x, z, size: SIZE, cells: g.data };
  }
  if (def.key === "shrine") {
    for (const xx of [4, 11]) for (const zz of [4, 10]) {
      g.box(xx, y + 1, zz, xx, y + 4, zz, B.SUN_BRICKS);
      g.set(xx, y + 5, zz, B.SUN_GLYPH);
    }
    g.box(4, y + 6, 4, 11, y + 6, 10, B.SANDSTONE);
    g.set(5, y + 1, 10, B.SIGN);
  } else if (def.key === "graveyard") {
    for (let zz = 4; zz <= 11; zz += 3) {
      g.box(4, y + 1, zz, 4, y + 2, zz, def.crest);
      g.box(12, y + 1, zz, 12, y + 2, zz, def.crest);
      g.box(5, y + 3, zz, 11, y + 3, zz, def.crest);
    }
  } else {
    g.walls(3, y + 1, 3, 12, y + 4, 12, B.SANDSTONE);
    g.box(7, y + 1, 12, 9, y + 3, 12, B.AIR);
    g.box(3, y + 5, 3, 12, y + 5, 12, def.crest);
    g.box(5, y + 6, 5, 10, y + 6, 10, B.SANDSTONE);
  }
  g.set(8, y + 1, 5, make(B.CHEST, LOOT));
  g.set(8, y + 2, 4, B.SHINESTONE);
  stampDesertVault(g, def.key, site);
  return { x, z, size: SIZE, cells: g.data };
}

export function relicSiteAt(sites, hit, position) {
  return RELIC_SITES.find(def => {
    const site = sites?.[def.key];
    if (!site) return false;
    const p = position(site);
    return p.x === hit.x && p.y === hit.y && p.z === hit.z;
  });
}
