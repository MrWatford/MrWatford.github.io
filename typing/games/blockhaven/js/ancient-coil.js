import {ancientAwakeningProgress} from './ancient-awakening.js';

// A transient pose, not a new entity path or encounter phase. The head remains
// authoritative, while actual body transforms also supply projectile contact.
export function ancientCoilWeight(e,reducedMotion=false){
  const c=e?.duneCycle;
  if(e?.sp!=='leviathan_ancient'||e.dead||e.gone||e.tame||c?.preview||
    ![e.age,e.hp,e.pos?.x,e.pos?.y,e.pos?.z,c?.site?.x,c?.site?.y,c?.site?.z].every(Number.isFinite)||e.hp<=0)return 0;
  const p=ancientAwakeningProgress(e);
  if(p!==null){const t=Math.max(0,Math.min(1,(p-.45)/.55));return reducedMotion?1:t*t*(3-2*t);}
  return Number.isFinite(c?.awakenedAt)&&c.awakenedAt>=0&&e.age>=c.awakenedAt?1:0;
}

// Write into the caller's scratch point; no per-segment allocation. Segment 0
// keeps its normal neck clearance. The raised arc passes over the low fossils
// and follows the head back beneath the floor when the boss submerges.
export function applyAncientCoil(e,index,weight,reducedMotion,out){
  if(!(weight>0)||index<1||index>9)return out;
  const w=Math.min(1,weight),site=e.duneCycle.site;
  const angle=Math.atan2(e.pos.z-site.z,e.pos.x-site.x)+index*.52;
  const x=site.x+Math.cos(angle)*12,z=site.z+Math.sin(angle)*12;
  const surfaced=Math.max(0,Math.min(1,(e.pos.y-(site.y-8))/8));
  const lift=Math.min(10,(index+1)*2.5)*surfaced;
  const ripple=reducedMotion?0:Math.sin(e.age*.8-index*.5)*.2*surfaced;
  out.x+=(x-out.x)*w;out.y+=(e.pos.y+lift+ripple-out.y)*w;out.z+=(z-out.z)*w;
  return out;
}
