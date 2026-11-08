import { B } from './blocks.js';
import { hash3 } from './noise.js';
import { naturalSandsFootprint } from './hollow-sands-footprint.js';
export const HEAT_RADIUS=1.8,HEAT_GRACE=3,HEAT_INTERVAL=2;
export function heatSite(world,x,z){
  if(!Number.isInteger(x)||!Number.isInteger(z)||!Number.isFinite(world?.gen?.seed)||((x%9)+9)%9!==4||((z%9)+9)%9!==4)return null;
  // Existing ruined pillars use marker values below .5; leave their sites alone.
  const marker=hash3(world.gen.seed,Math.floor(x/9),3,Math.floor(z/9));if(marker<.65||marker>=.85)return null;
  const footprint=naturalSandsFootprint(world,x,z,3,2,1,true);if(!footprint)return null;
  const {h,floors}=footprint;
  for(const [dx,dz,y] of floors)if(world.id(x+dx,y-1,z+dz)!==B.SUN_BRICKS||world.id(x+dx,y,z+dz)!==B.AIR||world.id(x+dx,y+1,z+dz)!==B.AIR)return null;
  return {key:x+','+z,x:x+.5,y:h+1,z:z+.5,bx:x,bz:z,floors};
}
export function findHeatSite(world,position){
  if(!position||![position.x,position.y,position.z].every(Number.isFinite))return null;
  let best=null,range=9;const gx=Math.floor(position.x/9),gz=Math.floor(position.z/9);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
    const x=(gx+dx)*9+4,z=(gz+dz)*9+4,d=Math.hypot(position.x-x-.5,position.z-z-.5);if(d>=range)continue;
    const site=heatSite(world,x,z);if(site&&Math.abs(position.y-site.y)<3){best=site;range=d;}
  }
  return best;
}
export function insideHeat(site,player){
  if(!site||!player?.onGround||player.flying||player.inWater||player.mount||player.boat||player.cart)return false;
  const dx=Math.floor(player.pos.x)-site.bx,dz=Math.floor(player.pos.z)-site.bz,floor=site.floors.find(f=>f[0]===dx&&f[1]===dz);
  return !!floor&&Math.hypot(player.pos.x-site.x,player.pos.z-site.z)<HEAT_RADIUS&&Math.abs(player.pos.y-floor[2])<.2;
}
export class HeatExposure{
  constructor(){this.age=0;this.elapsed=0;this.nextAt=HEAT_GRACE;this.ticks=0;}
  step(dt,inside){
    if(!Number.isFinite(dt)||dt<=0)return false;
    const delta=Math.min(.1,dt);this.age+=delta;
    if(!inside){this.elapsed=0;this.nextAt=HEAT_GRACE;this.ticks=0;return false;}
    this.elapsed+=delta;
    if(this.elapsed+1e-9<this.nextAt)return false;
    this.nextAt+=HEAT_INTERVAL;this.ticks++;return true;
  }
}
