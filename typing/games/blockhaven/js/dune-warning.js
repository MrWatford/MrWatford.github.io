import { dunePhase } from './dune-leviathan.js';
const clamp=v=>Math.max(0,Math.min(1,v));
export const DUNE_BURST_DURATION=1;
// Read-only presentation of the authoritative encounter deadlines and hit areas.
export function duneWarningCue(entity){
  if(entity?.sp!=='leviathan_dune'||entity.dead||entity.gone||entity.tame||!Number.isFinite(entity.age)||!Number.isFinite(entity.hp)||(!Number.isFinite(entity.maxHp)||entity.maxHp<=0))return null;
  const c=entity.duneCycle;if(!c)return null;
  let point,type,radius,deadline,from;
  if(c.step==='rising'){
    point=c.site;type='eruptionBurst';radius=3;
    from=Number.isFinite(c.riseFrom)?c.riseFrom:c.until-1.4;deadline=from+DUNE_BURST_DURATION;
  }else if(c.step==='warning'){
    point=c.site;type='eruption';radius=3;deadline=c.until;
    from=Number.isFinite(c.warningFrom)?c.warningFrom:deadline-(1.8-dunePhase(entity.hp,entity.maxHp)*.15);
  }else if(c.step==='surface'&&c.attack&&[2,3,4].includes(c.attack.phase)){
    point=c.attack;type=['','','sweep','vortex','devour'][point.phase];radius=point.phase===2?4:point.phase===3?3.5:3;deadline=c.attackAt;
    from=Number.isFinite(point.from)?point.from:deadline-1.25;
  }else return null;
  if(!point||![point.x,point.y,point.z,deadline,from].every(Number.isFinite)||deadline<=from||entity.age<from||type==='eruptionBurst'&&entity.age>=deadline)return null;
  return {type,radius,x:point.x,y:point.y,z:point.z,deadline,progress:clamp((entity.age-from)/(deadline-from))};
}
