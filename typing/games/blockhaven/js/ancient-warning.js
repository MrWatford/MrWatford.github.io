// Judgment timing comes from the actor clock, including the AI scheduling gap.
export function ancientWarningCue(e) {
  const c = e?.duneCycle, a = c?.attack;
  if (e?.sp !== 'leviathan_ancient' || e.dead || e.gone || e.tame || !e.emerged || c?.preview ||
      c?.step !== 'judgment' || !a || ![e.age, e.hp, e.maxHp, a.x, a.y, a.z, a.r, a.from, c.attackAt].every(Number.isFinite) ||
      e.hp <= 0 || e.maxHp <= 0 || a.r <= 0 || a.r > 11 || c.attackAt <= a.from || e.age < a.from) return null;
  return { x: a.x, y: a.y, z: a.z, radius: a.r, deadline: c.attackAt,
    progress: Math.max(0, Math.min(1, (e.age - a.from) / (c.attackAt - a.from))) };
}

export function ancientCollapseCues(e) {
  const cue = ancientWarningCue(e);
  if (!cue) return [];
  const recorded=e.duneCycle.attack.phase;
  const phase=Number.isInteger(recorded)&&recorded>=2&&recorded<=5?recorded:Math.min(5,2+Math.floor((1-e.hp/e.maxHp)*4));
  if (phase!==5) return [];
  const sites = e.duneCycle.attack.collapses;
  if (!Array.isArray(sites)) return [];
  return sites.slice(0,2).filter(p => p && [p.x,p.y,p.z,p.r].every(Number.isFinite) && p.r > 0 && p.r <= 2.25)
    .map(point => ({point,type:'collapse',x:point.x,y:point.y,z:point.z,radius:point.r,
      deadline:cue.deadline,progress:cue.progress}));
}

// The <=23-block footprint overlaps at most three chunks per axis.
export function ancientWarningLoadedKey(world, cue) {
  return [-cue.radius, 0, cue.radius].flatMap(dz => [-cue.radius, 0, cue.radius].map(dx =>
    world.isLoaded(Math.floor(cue.x + dx), Math.floor(cue.z + dz)) ? 1 : 0)).join('');
}
