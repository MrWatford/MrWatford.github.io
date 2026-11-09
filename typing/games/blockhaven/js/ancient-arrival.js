// Short-lived actor records only; these cues never grant progress or spawn mobs.
export function ancientArrivalCues(e) {
  const c = e?.duneCycle;
  if (e?.sp !== 'leviathan_ancient' || e.dead || e.gone || e.tame || c?.preview ||
      ![e.age,e.hp,e.maxHp].every(Number.isFinite) || e.hp <= 0 || e.maxHp <= 0) return [];
  const awakening = c?.step === 'awakening';
  if (!awakening && (c?.step !== 'summoning' || !e.emerged)) return [];
  const from = awakening ? c.arrivalFrom : c.summonFrom;
  if (![from,c.until].every(Number.isFinite) || c.until <= from || e.age < from) return [];
  const points = awakening ? [c.arrival] : c.summonSites?.slice(0,2) || [];
  return points.filter(p => p && [p.x,p.y,p.z,p.r].every(Number.isFinite) && p.r > 0 && p.r <= (awakening ? 8 : 1.5))
    .map(point => ({point,type:awakening?'awakening':'guardian',x:point.x,y:point.y,z:point.z,radius:point.r,
      deadline:c.until,progress:Math.max(0,Math.min(1,(e.age-from)/(c.until-from)))}));
}
