import { B, CHUNK, HEIGHT, SEA } from "./blocks.js";
import { hash3 } from "./noise.js";
import { structuresNear } from "./land-structures.js";
import { fitVillageBuilding, villageBuildingAnchors, VILLAGE_BUILDINGS } from "./village-architecture.js";
import { GRAND_CAPITAL_GEN } from "./stonehaven-grand.js";

export const GRAND_VILLAGE_GEN = 22;
export const GRAND_VILLAGE_LAYOUT = 1;
export const SETTLEMENT_CLASSES = {
  hamlet: { title: "Hamlet", size: 5, homes: 12, fields: 4, gardens: 3, pens: 1 },
  village: { title: "Developed Village", size: 6, homes: 18, fields: 6, gardens: 4, pens: 1 },
  fortified: { title: "Fortified Village", size: 8, homes: 35, fields: 10, gardens: 7, pens: 2 }
};
const CELL = 10;
const key = (x, z) => x + "," + z;
const clip = (n, min, max) => Math.max(min, Math.min(max, n));
const NEIGHBORS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const REGIONS = {
  birch: "birch", dark_forest: "forest", cherry_grove: "cherry", jungle: "jungle",
  forest: "forest", snowy_plains: "taiga", taiga: "taiga", mountain: "mountain",
  sandy: "sandy", badlands: "sandy", plains: "plains", savanna: "savanna",
  swamp: "wetland", mushroom_fields: "plains"
};
const TRADES = {
  cottage: ["shepherd", B.LOOM], house: ["fletcher", B.FLETCH_TABLE], manor: ["fletcher", B.FLETCH_TABLE],
  farmhouse: ["farmer", B.COMPOSTER], smithy: ["smith", B.SMITH_TABLE], library: ["scribe", B.BOOKSHELF],
  shop: ["fletcher", B.FLETCH_TABLE], inn: ["butcher", B.SMOKER], storehouse: ["fisherman", B.BARREL],
  stable: ["shepherd", B.LOOM], windmill: ["farmer", B.COMPOSTER]
};

const hit = (x, z, size, ax, az, width, depth = width) => x < ax + width && x + size > ax && z < az + depth && z + size > az;
const plotSurface = (gen, x, z) => {
  const heights = [[2,2],[13,2],[8,7],[2,13],[13,13]].map(([dx,dz]) => gen.column(x * CHUNK + dx, z * CHUNK + dz).h);
  heights.sort((a, b) => a - b);
  return { low: heights[0], high: heights[4], median: heights[2] };
};

function tryPlan(gen, kind, minX, minZ, natural) {
  const spec = SETTLEMENT_CLASSES[kind], size = spec.size, maxX = minX + size - 1, maxZ = minZ + size - 1;
  const vx = minX + Math.floor(size / 2), vz = minZ + Math.floor(size / 2);
  const sx = minX * CHUNK, sz = minZ * CHUNK, extent = size * CHUNK;
  const mx = vx * CHUNK + 8, mz = vz * CHUNK + 8, middle = gen.column(mx, mz);
  const biome = REGIONS[gen.landBiome(middle, mx, mz)];
  if (!biome || middle.h <= SEA || middle.h > HEIGHT - 23) return null;
  if (gen.stamps?.some(s => hit(sx, sz, extent, s.x, s.z, s.size || 32))) return null;
  if (gen.strongholds.some(s => hit(sx, sz, extent, s.x - 55, s.z - 55, 110))) return null;
  if (structuresNear(gen, mx, mz).some(s => hit(sx, sz, extent, s.x0 - 2, s.z0 - 2, s.w + 4, s.d + 4))) return null;
  if (gen.monumentsNear(mx, mz).some(s => hit(sx, sz, extent, s.x0 - 5, s.z0 - 5, 68))) return null;

  const levels = [], plots = new Map();
  let wetLots = 0;
  for (let z = minZ; z <= maxZ; z++) for (let x = minX; x <= maxX; x++) {
    const id = key(x, z);
    let col = natural.get(id);
    if (!col) { col = plotSurface(gen, x, z); natural.set(id, col); }
    const water = col.median < SEA;
    const edge = x === minX || x === maxX || z === minZ || z === maxZ;
    // A few interior ruins can remain as protected islands. The complete road graph must still connect.
    const protectedLot = hash3(gen.seed, x, 99, z) < .035 || hash3(gen.seed, x, 77, z) < .02;
    if (col.low < SEA - 9 || col.high > HEIGHT - 18 || col.high - col.low > 19 ||
        (protectedLot && edge && kind === "fortified")) return null;
    if (water) wetLots++;
    levels.push(clip(col.median, SEA + 1, HEIGHT - 23));
    if (!protectedLot) plots.set(id, { cx: x, cz: z, dx: x - vx, dz: z - vz, biome, detailed: true });
  }
  if (wetLots > Math.ceil(size * size * .18) || plots.size < Math.ceil(size * size * .86) || !plots.has(key(vx, vz))) return null;

  const group = { kind, biome, spec, minX, minZ, maxX, maxZ, vx, vz, plots, levels, generation:gen.version,
    center: [mx, mz], id: key(vx, vz) };
  const reaches = new Set([group.id]), queue = [plots.get(group.id)];
  for (let i = 0; i < queue.length; i++) for (const [dx,dz] of NEIGHBORS) {
    const id = key(queue[i].cx + dx, queue[i].cz + dz);
    if (plots.has(id) && !reaches.has(id)) { reaches.add(id); queue.push(plots.get(id)); }
  }
  if (queue.length !== plots.size) return null;
  for (let i = 0; i < size * 2; i++) for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    for (const [dx, dz] of NEIGHBORS) if (x + dx >= 0 && x + dx < size && z + dz >= 0 && z + dz < size) {
      const a = x + z * size, b = a + dx + dz * size;
      if (levels[a] > levels[b] + 6) levels[a] = levels[b] + 6;
    }
  }
  if (!assignDistricts(group, gen.seed, gen.version)) return null;
  return group;
}

function assignDistricts(group, seed, version) {
  const { vx, vz, spec, plots, biome, kind } = group;
  const open = [...plots.values()].filter(p => p.dx || p.dz);
  const distance = p => Math.abs(p.dx) + Math.abs(p.dz);
  const noise = p => hash3(seed, p.cx, 2217, p.cz);
  const core = p => distance(p) + noise(p);
  const outskirts = p => -distance(p) + noise(p);
  const fields = Math.min(spec.fields, open.length - spec.homes - spec.gardens - spec.pens);
  if (fields < (kind === "hamlet" ? 3 : kind === "village" ? 4 : 7)) return false;
  const take = (type, count, order) => {
    open.sort((a, b) => order(a) - order(b));
    const selected = open.splice(0, count);
    for (const p of selected) p.type = type;
    return selected;
  };
  plots.get(group.id).type = "plaza";
  [group.construction] = take("commons", 1, core);
  take("farm", fields, outskirts);
  take("pen", spec.pens, outskirts);
  take("orchard", 1, outskirts);
  const gardens=take("garden", spec.gardens - 2, core);
  if (version>=GRAND_CAPITAL_GEN && gardens.length) {
    [group.workshop]=gardens;
    group.workshop.type="commons";
  }
  const market = take("market", kind === "hamlet" ? 0 : 1, core);
  for (const p of market) p.kind = "shop";
  const anchor = take("house", kind === "hamlet" ? 3 : 7, core);
  const features = kind === "hamlet" ? ["smithy","farmhouse","cottage"] : ["inn","smithy","library","manor","shop","stable","storehouse"];
  anchor.forEach((p, i) => { p.kind = features[i]; });
  const [mill] = take("house", 1, outskirts);
  mill.kind = kind === "hamlet" && biome !== "plains" ? "farmhouse" : "windmill";
  const [farmhouse] = take("house", 1, outskirts);
  farmhouse.kind = "farmhouse";
  const residential = ["cottage", "house", "cottage", "farmhouse", "cottage", "house", "shop", "stable"];
  for (const p of open) {
    p.type = "house";
    p.kind = residential[Math.floor(noise(p) * residential.length)];
  }
  for (const p of plots.values()) {
    const x = p.cx * CHUNK, z = p.cz * CHUNK;
    p.center = group.center;
    p.settlement = group;
    p.y = villageRoadY(group, x + 8, z + 13);
    if (p.kind) {
      const k = p.kind === "windmill" ? "storehouse" : p.kind;
      const variant = Math.floor(hash3(seed, p.cx, 2219, p.cz) * VILLAGE_BUILDINGS[k].length);
      p.building = fitVillageBuilding(k, variant, 9, 8);
      if (biome === "sandy" && p.kind !== "windmill" && variant % 3 !== 1) p.building.roof = "terrace";
      if (biome === "taiga" && ["shed", "hip"].includes(p.building.roof)) p.building.roof = variant % 2 ? "long" : "gable";
      const anchors = villageBuildingAnchors(p.building);
      const at = ([lx, dy, lz], center = 0) => [x + 5 + lx + center, p.y + dy, z + 2 + lz + center];
      p.home = at(anchors.home, .5);
      p.bed = at(anchors.bed);
      p.job = at(anchors.job);
      p.entry = at(anchors.door, .5);
      [p.prof, p.jobBlock] = TRADES[p.kind];
    } else if (p.type === "farm") {
      p.prof = "farmer";
      p.home = [x + 4.5, p.y + 1, z + 11.5];
      p.job = [x + 4, p.y + 1, z + 9];
    } else if (p.type === "plaza") {
      p.prof = "cleric";
      p.home = [x + 11.5, p.y + 1, z + 9.5];
    } else if (p.type === "pen") {
      p.stock = [biome === "sandy" ? "camel" : "sheep", x + 8.5, p.y + 1, z + 6.5];
    }
  }
  group.buildings = [...plots.values()].filter(p => p.building).length;
  return group.buildings >= spec.homes && !!group.construction;
}

function groupForCell(gen, rx, rz) {
  const natural = new Map();
  const pinned = gen.surveyedVillages?.get(key(rx,rz));
  if (pinned) return tryPlan(gen, pinned.kind, pinned.minX, pinned.minZ, natural);
  const roll = hash3(gen.seed, rx, 2211, rz);
  const classes = roll < .22 ? ["fortified","village","hamlet"] : roll < .61 ? ["village","hamlet"] : ["hamlet"];
  for (const kind of classes) {
    const last = CELL - SETTLEMENT_CLASSES[kind].size;
    const starts = [];
    for (let z = 0; z <= last; z++) for (let x = 0; x <= last; x++) {
      // Always leave an undeveloped border between settlements in neighboring cells.
      if (x > last - 1 || z > last - 1) continue;
      starts.push([x, z]);
    }
    starts.sort(([ax,az],[bx,bz]) => hash3(gen.seed, rx * CELL + ax, 2214, rz * CELL + az) -
      hash3(gen.seed, rx * CELL + bx, 2214, rz * CELL + bz));
    for (const [x, z] of starts.slice(0, kind === "fortified" ? 4 : 8)) {
      const group = tryPlan(gen, kind, rx * CELL + x, rz * CELL + z, natural);
      if (group) return group;
    }
  }
  return null;
}

export function grandVillagePlot(gen, cx, cz) {
  const rx = Math.floor(cx / CELL), rz = Math.floor(cz / CELL);
  const revision = gen.stamps?.length || 0;
  if (gen.grandVillageRevision !== revision) {
    gen.grandVillageCache = new Map();
    gen.grandVillageRevision = revision;
  }
  const cache = gen.grandVillageCache, id = key(rx, rz);
  if (!cache.has(id)) {
    if (cache.size >= 96) cache.delete(cache.keys().next().value);
    cache.set(id, groupForCell(gen, rx, rz));
  }
  return cache.get(id)?.plots.get(key(cx, cz)) || null;
}

export function villageRoadY(group, wx, wz) {
  const size = group.spec.size;
  const x = clip((wx - group.minX * CHUNK - 2) / CHUNK, 0, size - 1);
  const z = clip((wz - group.minZ * CHUNK - 13) / CHUNK, 0, size - 1);
  const a = Math.floor(x), b = Math.floor(z), nextX = Math.min(size - 1, a + 1), nextZ = Math.min(size - 1, b + 1);
  const { levels } = group;
  const row = i => levels[a + i * size] * (1 - (x - a)) + levels[nextX + i * size] * (x - a);
  return Math.round(row(b) * (1 - (z - b)) + row(nextZ) * (z - b));
}

export function settlementRecord(plot) {
  const group = plot.settlement;
  const { id, kind, biome, vx, vz } = group;
  const x = vx * CHUNK + 2, z = vz * CHUNK + 13;
  return { v: GRAND_VILLAGE_LAYOUT, id, kind, biome, minX: group.minX, minZ: group.minZ,
    x: x + .5, y: villageRoadY(group, x, z) + 1, z: z + .5 };
}

export function restoreVillageRecords(records) {
  const restored = new Map();
  for (const r of Array.isArray(records) ? records : []) {
    if (r?.v !== GRAND_VILLAGE_LAYOUT || !Object.hasOwn(SETTLEMENT_CLASSES, r.kind) ||
        !Number.isSafeInteger(r.minX * CHUNK) || !Number.isSafeInteger(r.minZ * CHUNK) ||
        !Number.isInteger(r.minX) || !Number.isInteger(r.minZ) || !Number.isInteger(r.y) ||
        r.y <= 0 || r.y >= HEIGHT || !Object.values(REGIONS).includes(r.biome)) continue;
    const {size} = SETTLEMENT_CLASSES[r.kind], off = Math.floor(size / 2);
    if (r.id === key(r.minX + off, r.minZ + off) && r.x === (r.minX + off) * CHUNK + 2.5 &&
        r.z === (r.minZ + off) * CHUNK + 13.5 &&
        Math.floor((r.minX + size) / CELL) === Math.floor(r.minX / CELL) &&
        Math.floor((r.minZ + size) / CELL) === Math.floor(r.minZ / CELL)) restored.set(r.id,r);
  }
  return restored;
}

export function reserveSurveyedVillages(gen, data, records) {
  if (!records.size) return data;
  gen.surveyedVillages = new Map();
  const visited = new Set(data.visited || []);
  for (const r of records.values()) {
    const { size } = SETTLEMENT_CLASSES[r.kind];
    gen.surveyedVillages.set(key(Math.floor(r.minX / CELL), Math.floor(r.minZ / CELL)), r);
    for (let z=r.minZ;z<r.minZ+size;z++) for (let x=r.minX;x<r.minX+size;x++) visited.add(key(x,z));
  }
  return { ...data, visited: [...visited] };
}
