export const ANCIENT_CIRCLE_SECONDS = 10;
export const ANCIENT_CIRCLE_SETTLE_SECONDS = 2;
const ease=t=>t*t*(3-2*t);

// Constant-speed middle with eased acceleration/deceleration. The integral is
// exactly one lap, with zero velocity at both endpoints.
export function ancientCircleTravel(p){
  const t=Number.isFinite(p)?Math.max(0,Math.min(1,p)):0,ramp=.15,scale=1/(1-ramp);
  if(t<ramp)return{distance:scale*t*t/(2*ramp),speed:scale*t/ramp};
  if(t>1-ramp){const q=1-t;return{distance:1-scale*q*q/(2*ramp),speed:scale*q/ramp};}
  return{distance:scale*(t-ramp/2),speed:scale};
}

export function stepAncientCircle(e){
  const c=e?.duneCycle,circle=c?.introCircle,site=c?.site;
  if(e?.sp!=='leviathan_ancient'||e.dead||e.gone||e.tame||!e.emerged||c?.preview||c?.step!=='recover'||
    !circle||circle.finished||![e.age,e.hp,circle.from,circle.until,site?.x,site?.y,site?.z,e.pos?.x,e.pos?.y,e.pos?.z].every(Number.isFinite)||
    e.hp<=0||circle.until<=circle.from||e.age<circle.from)return false;
  // Capture the actual settled head, rather than snapping back to a preset.
  circle.start ||= {x:e.pos.x,y:e.pos.y,z:e.pos.z,yaw:Number.isFinite(e.yaw)?e.yaw:0};
  const p=Math.max(0,Math.min(1,(e.age-circle.from)/(circle.until-circle.from))),travel=ancientCircleTravel(p);
  const radius=8+4*Math.sin(Math.PI*p)**2,dr=4*Math.PI*Math.sin(2*Math.PI*p)/(circle.until-circle.from);
  const angle=-Math.PI/2-travel.distance*Math.PI*2,da=-travel.speed*Math.PI*2/(circle.until-circle.from);
  const blend=ease(Math.min(1,p/.15)),yBlend=ease(Math.min(1,p/.2));
  const correction=1-blend;
  e.pos.x=site.x+Math.cos(angle)*radius+(circle.start.x-site.x)*correction;
  e.pos.z=site.z+Math.sin(angle)*radius+(circle.start.z-(site.z-8))*correction;
  const height=8*yBlend;
  e.pos.y=site.y+height+(circle.start.y-site.y)*(1-yBlend);
  e.vel.x=Math.cos(angle)*dr-Math.sin(angle)*radius*da;
  e.vel.z=Math.sin(angle)*dr+Math.cos(angle)*radius*da;
  const climb=Math.min(1,p/.2);
  e.vel.y=(site.y+8-circle.start.y)*6*climb*(1-climb)/(.2*(circle.until-circle.from));
  const heading=Math.atan2(-e.vel.x,-e.vel.z),turn=Math.atan2(Math.sin(heading-circle.start.yaw),Math.cos(heading-circle.start.yaw));
  const face=ease(Math.min(1,p/.12,(1-p)/.12));
  e.yaw=circle.start.yaw+turn*face;
  if(p>=1){
    const settle=Math.max(0,Math.min(1,(e.age-circle.until)/ANCIENT_CIRCLE_SETTLE_SECONDS));
    e.pos.x=site.x;e.pos.y=site.y+8*(1-ease(settle));e.pos.z=site.z-8;
    e.vel.x=e.vel.z=0;e.vel.y=-8*6*settle*(1-settle)/ANCIENT_CIRCLE_SETTLE_SECONDS;e.yaw=circle.start.yaw;
    if(settle>=1){e.vel.y=0;circle.finished=true;}
  }
  return true;
}
