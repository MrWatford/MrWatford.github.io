import { B, SOLID } from "./blocks.js";

export const OBSIDIAN_VENT_LAYOUT = 1;
export const OBSIDIAN_VENT_RISE = 2.8;

export function obsidianVentSite(site) {
  return { x: site.x + 24.5, y: site.y + 1, z: site.z + 9.5 };
}

export function stampObsidianVent(grid, site) {
  if (site.ventLayout !== OBSIDIAN_VENT_LAYOUT) return;
  const y = site.y, x = 24, z = 9;
  grid.box(x - 4, y - 10, z - 4, x + 4, y - 1, z + 4, B.BLACKSTONE);
  grid.box(x - 3, y - 8, z - 3, x + 3, y - 2, z + 3, B.AIR);
  grid.box(x - 3, y - 8, z - 3, x + 3, y - 8, z + 3, B.LAVA);
  grid.box(x - 2, y - 7, z - 2, x + 2, y, z + 2, B.AIR);
  grid.walls(x - 3, y, z - 3, x + 3, y + 1, z + 3, B.BASALT);
  for (const dx of [-3, 3]) for (const dz of [-3, 3]) grid.set(x + dx, y + 2, z + dz, B.EMBER_CRYSTAL);
}

export function openObsidianVent(world, vent) {
  const x = Math.floor(vent.x), z = Math.floor(vent.z), y = vent.y;
  if (!world.isLoaded(x, z) || world.id(x, y - 9, z) !== B.LAVA) return false;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -8; dy <= 2; dy++) if (world.id(x + dx, y + dy, z + dz) !== B.AIR) return false;
  }
  for (let dz = 3; dz <= 6; dz++) for (let dx = -2; dx <= 2; dx++) {
    if (SOLID[world.id(x + dx, y + 2, z + dz)] || SOLID[world.id(x + dx, y + 3, z + dz)]) return false;
  }
  return true;
}

export function selectObsidianVent(world, site, day) {
  if (site.ventLayout !== OBSIDIAN_VENT_LAYOUT || ((world.gen.seed >>> 0) % 3 + day) % 3 !== 0) return null;
  const vent = obsidianVentSite(site);
  return openObsidianVent(world, vent) ? vent : null;
}

const ease = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export function stepObsidianVent(actor) {
  const cycle = actor.duneCycle;
  if (cycle?.step !== "vent-rise") return false;
  const { vent, site, riseFrom } = cycle;
  const t = Math.max(0, (actor.age - riseFrom) / OBSIDIAN_VENT_RISE);
  const rise = ease(t / 0.6), glide = ease((t - 0.58) / 0.42);
  actor.pos.x = vent.x + (site.x - vent.x) * glide;
  actor.pos.z = vent.z + (site.z - 4 - vent.z) * glide;
  actor.pos.y = vent.y - 8 + rise * 10.4 - glide * 2.4;
  actor.emerged = rise >= 0.7;
  return true;
}
