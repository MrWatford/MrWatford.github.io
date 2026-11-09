import { B, I } from './blocks.js';
import { dunePhase } from './dune-leviathan.js';

export const OBSIDIAN_OFFERINGS = [[B.OBSIDIAN, 8], [I.GOLD_INGOT, 4], [I.QUARTZ, 2]];
export const OBSIDIAN_OFFERING_TEXT = '8 obsidian, 4 gold ingots and 2 Ember Quartz';

export function obsidianRiteInReach(e, player) {
  const p = player?.pos, c = e?.duneCycle;
  return !!p && e?.sp === 'leviathan_obsidian' && !e.tame && !e.dead && !e.gone && e.emerged && !c?.preview &&
    ['surface', 'attack', 'shrapnel', 'recover'].includes(c?.step) &&
    [p.x, p.y, p.z, e.pos?.x, e.pos?.y, e.pos?.z, e.age, e.hp, e.maxHp].every(Number.isFinite) && e.hp > 0 && e.maxHp > 0 &&
    Math.abs(p.y - e.pos.y) <= 3 && Math.hypot(p.x-e.pos.x, p.y-e.pos.y, p.z-e.pos.z) <= 13;
}

export function obsidianRitualWindow(e) {
  const c = e?.duneCycle;
  return c?.step === 'recover' && !c.ritualUsed &&
    [e.age, c.ritualFrom, c.until].every(Number.isFinite) && c.until > c.ritualFrom &&
    e.age >= c.ritualFrom && e.age < c.until;
}

export function obsidianEncounterPhase(e, record) {
  const combat = dunePhase(e.hp, e.maxHp);
  if (!record?.ritualOffered || record.bonded || record.defeated) return combat;
  const marks = Number.isInteger(e.duneCycle?.ritualMarks) ? Math.max(0, Math.min(3, e.duneCycle.ritualMarks)) : 0;
  return Math.max(combat, marks + 1);
}
