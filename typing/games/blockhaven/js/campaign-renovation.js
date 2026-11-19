import { CHUNK, HEIGHT } from "./blocks.js";
import { untouchedFootprint } from "./structure-placement.js";

function blockPosition(key) {
  const [x, , z] = key.split(",").map(Number);
  return { x, z };
}

const fixtureKey = (site, fixture) => [site.cx + fixture.X, fixture.y, site.cz + fixture.Z].join(",");

export function overlapsSettlement(site, size, stamp) {
  const x = site.cx - size / 2, z = site.cz - size / 2;
  return x < stamp.x + stamp.size && x + size > stamp.x && z < stamp.z + stamp.size && z + size > stamp.z;
}

export function settlementChangesOverlap(site, size, before, after, stamp) {
  const x0 = site.cx - size / 2, z0 = site.cz - size / 2;
  const left = Math.max(0, stamp.x - x0), right = Math.min(size, stamp.x + stamp.size - x0);
  const near = Math.max(0, stamp.z - z0), far = Math.min(size, stamp.z + stamp.size - z0);
  for (let y = 0; y < HEIGHT; y++) {
    for (let z = near; z < far; z++) {
      const row = (y * size + z) * size;
      for (let x = left; x < right; x++) if (before[row + x] !== after[row + x]) return true;
    }
  }
  return false;
}

export function settlementIsUntouched(site, size, info, data, player, chestContents) {
  const x0 = site.cx - size / 2, z0 = site.cz - size / 2;
  const x1 = x0 + size, z1 = z0 + size;
  if (![x0, z0, x1, z1].every(Number.isSafeInteger)) return false;
  const keys = new Set();
  for (let x = Math.floor(x0 / CHUNK); x <= Math.floor((x1 - 1) / CHUNK); x++) {
    for (let z = Math.floor(z0 / CHUNK); z <= Math.floor((z1 - 1) / CHUNK); z++) keys.add(x + "," + z);
  }
  const touches = p => p && keys.has(Math.floor(p.x / CHUNK) + "," + Math.floor(p.z / CHUNK));
  const chests = new Map(info.chests.map(c => [fixtureKey(site, c), c]));
  const containers = (data.containers || []).filter(([key, box]) => {
    if (!touches(blockPosition(key))) return false;
    const c = chests.get(key);
    // The campaign fills supply chests on its first tick, even at faraway sites.
    if (!c || box?.type !== "chest" || box.label !== c.label || box.slots?.length !== 27) return true;
    return chestContents(c).some((slot, i) => {
      const saved = box.slots[i];
      return slot === null ? saved != null : !saved || slot.id !== saved.id || slot.n !== saved.n || slot.dur !== saved.dur;
    });
  });
  if (!untouchedFootprint({ ...data, containers })(x0, z0, x1, z1)) return false;
  if ([player?.pos, player?.spawn, player?.anchor, ...(data.drops || [])].some(touches)) return false;
  if (Object.entries(data.entities || {}).some(([key, residents]) => residents.length &&
    (keys.has(key) || residents.some(e => Array.isArray(e.home) && touches({ x: e.home[0], z: e.home[2] }))))) return false;
  const signs = new Map(info.signs.map(s => [fixtureKey(site, s), s.text]));
  if (Object.entries(data.signs || {}).some(([key, label]) => touches(blockPosition(key)) && signs.get(key) !== label)) return false;
  const crops = new Set(info.crops.map(c => fixtureKey(site, c)));
  if ([...(data.crops || [])].some(key => !crops.has(key) && touches(blockPosition(key)))) return false;
  if ([...Object.keys(data.links || {}), ...(data.beacons || [])].some(key => touches(blockPosition(key)))) return false;
  for (const portal of data.portals || []) {
    const width = Math.min(24, Math.max(1, portal.w || 1));
    for (let i = -1; i <= width; i++) {
      if (touches({ x: portal.x + (portal.axis === 0 ? i : 0), z: portal.z + (portal.axis === 0 ? 0 : i) })) return false;
    }
  }
  return true;
}

export function updateSettlementCrops(data, site, before, after) {
  const saved = new Set(data.crops);
  const previous = new Set(before.map(crop => fixtureKey(site, crop)));
  for (const crop of after) {
    const key = fixtureKey(site, crop);
    if (!previous.delete(key)) saved.add(key);
  }
  for (const key of previous) saved.delete(key);
  data.crops = [...saved];
}
