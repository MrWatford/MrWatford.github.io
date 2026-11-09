import { validObsidianVolley } from './obsidian-shrapnel.js';

export function obsidianWarningCue(e) {
  if (e?.sp !== 'leviathan_obsidian' || e.tame || e.dead || e.gone || !e.emerged ||
      ![e.age, e.hp, e.maxHp].every(Number.isFinite) || e.hp <= 0 || e.maxHp <= 0) return null;
  const c = e.duneCycle, a = c?.attack;
  if (c?.step === 'shrapnel' && a?.kind === 'shrapnel' && validObsidianVolley(a.volley) &&
      [a.from, c.attackAt].every(Number.isFinite) && c.attackAt > a.from && e.age >= a.from) {
    return { type: 'shrapnel', ...a.volley.origin, volley: a.volley, deadline: c.attackAt,
      progress: Math.max(0, Math.min(1, (e.age - a.from) / (c.attackAt - a.from))) };
  }
  if (c?.step !== 'attack' || !a || !['eruption', 'roar'].includes(a.kind) ||
      ![a.x, a.z, a.r, a.from, c.site?.y, c.attackAt].every(Number.isFinite) ||
      a.r <= 0 || a.r > 6 || c.attackAt <= a.from || e.age < a.from) return null;
  // AI decisions run every ~150 ms. Hold the fully charged cue until that
  // decision actually releases/cancels it, rather than disarming between ticks.
  return { type: a.kind, x: a.x, y: c.site.y, z: a.z, radius: a.r,
    deadline: c.attackAt, progress: Math.max(0, Math.min(1, (e.age - a.from) / (c.attackAt - a.from))) };
}
