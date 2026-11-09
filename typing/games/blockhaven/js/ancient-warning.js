// Judgment timing comes from the actor clock, including the AI scheduling gap.
export function ancientWarningCue(e) {
  const c = e?.duneCycle, a = c?.attack;
  if (e?.sp !== 'leviathan_ancient' || e.dead || e.gone || e.tame || !e.emerged || c?.preview ||
      c?.step !== 'judgment' || !a || ![e.age, e.hp, e.maxHp, a.x, a.y, a.z, a.r, a.from, c.attackAt].every(Number.isFinite) ||
      e.hp <= 0 || e.maxHp <= 0 || a.r <= 0 || a.r > 11 || c.attackAt <= a.from || e.age < a.from) return null;
  return { x: a.x, y: a.y, z: a.z, radius: a.r, deadline: c.attackAt,
    progress: Math.max(0, Math.min(1, (e.age - a.from) / (c.attackAt - a.from))) };
}

// The <=23-block footprint overlaps at most three chunks per axis.
export function ancientWarningLoadedKey(world, cue) {
  return [-cue.radius, 0, cue.radius].flatMap(dz => [-cue.radius, 0, cue.radius].map(dx =>
    world.isLoaded(Math.floor(cue.x + dx), Math.floor(cue.z + dz)) ? 1 : 0)).join('');
}
