export function ancientAwakeningProgress(e) {
  const c=e?.duneCycle;
  if(e?.sp!=='leviathan_ancient'||e.dead||e.gone||e.tame||c?.preview||c?.step!=='awakening'||
    ![e.age,e.hp,e.maxHp,c.arrivalFrom,c.until,c.site?.y].every(Number.isFinite)||
    e.hp<=0||e.maxHp<=0||c.until<=c.arrivalFrom||e.age<c.arrivalFrom)return null;
  return Math.max(0,Math.min(1,(e.age-c.arrivalFrom)/(c.until-c.arrivalFrom)));
}

// Ancient-only, pre-combat physics. The endpoint matches the old rising goal,
// so the normal emergence/recovery resumes without a teleport or scale change.
export function stepAncientAwakening(e) {
  const progress=ancientAwakeningProgress(e);
  if(progress===null)return false;
  const t=Math.max(0,(progress-.2)/.8);
  const rise=t*t*(3-2*t);
  e.pos.y=e.duneCycle.site.y-22+18*rise;
  e.vel.x=e.vel.y=e.vel.z=0;
  return true;
}
