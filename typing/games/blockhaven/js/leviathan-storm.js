// Activity storms use the saved world clock. They never change the day or spawn a boss.
export const STORM_SPRINT_SECONDS = 8;
export const STORM_BATTLE_SECONDS = 2;
export const STORM_PEAK_AT = 30;
export const STORM_PEAK_END = 90;
export const STORM_END = 110;
export const STORM_COOLDOWN = 60;
const SOURCES = ["sprint", "battle", "observatory"];
const DUNE_APPROACH_DISTANCES = [13, 9];
const DUNE_APPROACH_OFFSETS = [0, -4, 4];

export function findDuneApproach(position, velocity, siteAt) {
  const speed = Math.hypot(velocity.x, velocity.z);
  if (!Number.isFinite(speed) || speed <= 0) return null;
  const x = velocity.x / speed, z = velocity.z / speed;
  for (const distance of DUNE_APPROACH_DISTANCES) {
    for (const offset of DUNE_APPROACH_OFFSETS) {
      const site = siteAt(position.x + x * distance - z * offset, position.z + z * distance + x * offset);
      if (site && Math.abs(site.y - position.y) <= 4) return site;
    }
  }
  return null;
}

export function validStormCall(record) {
  return record === undefined || !!record && typeof record === "object" && !Array.isArray(record) &&
    Number.isFinite(record.at) && record.at >= 0 && record.at < Number.MAX_SAFE_INTEGER - STORM_END - STORM_COOLDOWN &&
    SOURCES.includes(record.source);
}

export function stormCallStatus(record, now) {
  const elapsed = validStormCall(record) && record && Number.isFinite(now) ? now - record.at : -1;
  // A future record (for example after a clock rollback) cannot lock out new storms.
  if (elapsed < 0) return { stage: 0, ready: true, cooldown: 0, untilPeak: 0, remainingPeak: 0 };
  const stage = elapsed < 8 ? 1 : elapsed < 18 ? 2 : elapsed < STORM_PEAK_AT ? 3 :
    elapsed < STORM_PEAK_END ? 4 : elapsed < 98 ? 3 : elapsed < 104 ? 2 : elapsed < STORM_END ? 1 : 0;
  return { stage, ready: elapsed >= STORM_END + STORM_COOLDOWN,
    cooldown: Math.max(0, STORM_END + STORM_COOLDOWN - elapsed),
    untilPeak: Math.max(0, STORM_PEAK_AT - elapsed), remainingPeak: Math.max(0, STORM_PEAK_END - Math.max(STORM_PEAK_AT, elapsed)) };
}

export function stormDaytime(time) {
  return Number.isFinite(time) && time >= 0 && time < 1 && (time <= .53 || time >= .97);
}

export function severalHostilesNearby(list, p) {
  let count = 0;
  for (const e of list) {
    if (!e.def?.hostile || e.tame || e.dead || e.gone || !(e.hp > 0) || !e.pos) continue;
    if (Math.abs(e.pos.y - p.y) <= 6 && (e.pos.x - p.x) ** 2 + (e.pos.z - p.z) ** 2 <= 14 ** 2 && ++count === 3) return true;
  }
  return false;
}

export class StormActivity {
  constructor() { this.reset(); }
  reset() { this.sprint = 0; this.battle = 0; this.battleMemory = 0; }
  step(dt, { enabled, ready, sprinting, severalHostiles, combatInput }) {
    if (!enabled || !ready || !Number.isFinite(dt) || dt <= 0) { this.reset(); return null; }
    dt = Math.min(.5, dt);
    this.battleMemory = severalHostiles && combatInput ? 3 : Math.max(0, this.battleMemory - dt);
    this.sprint = Math.max(0, this.sprint + (sprinting ? dt : -dt));
    this.battle = Math.max(0, this.battle + (this.battleMemory > 0 ? dt : -dt));
    const source = this.battle >= STORM_BATTLE_SECONDS ? "battle" : this.sprint >= STORM_SPRINT_SECONDS ? "sprint" : null;
    if (source) this.reset();
    return source;
  }
  review() { return { sprint: this.sprint, battle: this.battle, battleMemory: this.battleMemory }; }
}

export const STORM_ACTIVITY_GUIDE = `During the day, sprinting outdoors in the desert for about ${STORM_SPRINT_SECONDS} seconds can stir a storm. Fighting three nearby hostile mobs can also awaken one. Wind builds for ${STORM_PEAK_AT} seconds before its strongest phase. Walking quietly avoids stirring another; slow down or shelter to avoid drawing the Leviathan out. After a called storm clears, the sands rest for ${STORM_COOLDOWN} seconds. With the shrine read, all three relics ready and a horn, stand by the Observatory instrument and sound the horn to call a storm yourself.`;
