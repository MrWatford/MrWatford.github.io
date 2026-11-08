import { B } from './blocks.js';

export const DUNE_VORTEX_RADIUS = 3.5;
export const DUNE_VORTEX_DURATION = 4;
export const DUNE_VORTEX_GRACE = 0.5;
export const DUNE_VORTEX_INTERVAL = 1;
export const DUNE_VORTEX_DAMAGE = 2;

// Transient encounter state, never serialized or attached to a terrain block.
export class DuneVortex {
  constructor(site) {
    this.site = { x: site.x, y: site.y, z: site.z };
    this.age = 0; this.nextAt = DUNE_VORTEX_GRACE; this.ticks = 0;
  }
  get active() { return this.age < DUNE_VORTEX_DURATION; }
  step(dt, inside) {
    if (!Number.isFinite(dt) || dt <= 0 || !this.active) return false;
    this.age = Math.min(DUNE_VORTEX_DURATION, this.age + Math.min(0.1, dt));
    if (!this.active || this.age + 1e-9 < this.nextAt) return false;
    this.nextAt += DUNE_VORTEX_INTERVAL;
    if (inside) { this.ticks++; return true; }
    return false;
  }
}

export function validDuneVortexSite(world, site) {
  if (!site || ![site.x, site.y, site.z].every(Number.isFinite) || !world.isLoaded(site.x, site.z)) return false;
  const x = Math.floor(site.x), y = Math.floor(site.y), z = Math.floor(site.z);
  return world.id(x, y - 1, z) === B.SAND && world.id(x, y, z) === B.AIR && world.id(x, y + 1, z) === B.AIR;
}

export function insideDuneVortex(vortex, player, world, clearLine) {
  if (!vortex?.active || !player || player.flying || player.mount || player.boat || player.cart || player.inWater) return false;
  const s = vortex.site, p = player.pos;
  return !!p && [p.x, p.y, p.z].every(Number.isFinite) && world.isLoaded(p.x, p.z) &&
    Math.abs(p.y - s.y) < 2.5 && Math.hypot(p.x - s.x, p.z - s.z) < DUNE_VORTEX_RADIUS &&
    clearLine(world, { x: s.x, y: s.y + 1, z: s.z }, { x: p.x, y: p.y + (player.eye ?? 1.62), z: p.z });
}

export function duneVortexSpeed(pieces) {
  return pieces >= 4 ? 1 : pieces >= 2 ? 0.825 : 0.65;
}
