import { B } from './blocks.js';
import { hash3 } from './noise.js';
import { naturalSandsFootprint } from './hollow-sands-footprint.js';

export const QUICKSAND_RADIUS=1.8,QUICKSAND_SETTLE=2,QUICKSAND_MIN_SPEED=.65;
export function quicksandSite(world,x,z){
  if(!Number.isInteger(x)||!Number.isInteger(z)||!Number.isFinite(world?.gen?.seed)||((x%9)+9)%9!==4||((z%9)+9)%9!==4)return null;
  // Avoid the generator's resonant-glass markers (which occupy values below .25).
  const marker=hash3(world.gen.seed,Math.floor(x/9),4,Math.floor(z/9));if(marker<.35||marker>=.55)return null;
  const footprint=naturalSandsFootprint(world,x,z,4,2,1,true);if(!footprint)return null;
  const {h,floors}=footprint;
  for(const [dx,dz,y] of floors)if(world.id(x+dx,y-1,z+dz)!==B.SOUL_SAND||world.id(x+dx,y,z+dz)!==B.AIR||world.id(x+dx,y+1,z+dz)!==B.AIR)return null;
  return {key:x+','+z,x:x+.5,y:h+1,z:z+.5,bx:x,bz:z,floors};
}
export function findQuicksandSite(world,position){
  if(!position||![position.x,position.y,position.z].every(Number.isFinite))return null;
  let best=null,range=9;const gx=Math.floor(position.x/9),gz=Math.floor(position.z/9);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
    const x=(gx+dx)*9+4,z=(gz+dz)*9+4,d=Math.hypot(position.x-x-.5,position.z-z-.5);if(d>=range)continue;
    const site=quicksandSite(world,x,z);if(site&&Math.abs(position.y-site.y)<3){best=site;range=d;}
  }
  return best;
}
export function insideQuicksand(site,player){
  const floor=site?.floors?.find(([dx,dz])=>Math.floor(player?.pos?.x)-site.bx===dx&&Math.floor(player?.pos?.z)-site.bz===dz);
  return !!site&&!!player?.onGround&&!player.flying&&!player.inWater&&!player.mount&&!player.boat&&!player.cart&&
    !!floor&&Math.hypot(player.pos.x-site.x,player.pos.z-site.z)<QUICKSAND_RADIUS&&Math.abs(player.pos.y-floor[2])<.2;
}
export class QuicksandDrag{
  constructor(){this.age=0;this.depth=0;}
  step(dt,inside){if(!Number.isFinite(dt)||dt<=0)return;this.age+=Math.min(.1,dt);this.depth=inside?Math.min(1,this.depth+Math.min(.1,dt)/QUICKSAND_SETTLE):0;}
  get factor(){return 1-(1-QUICKSAND_MIN_SPEED)*this.depth;}
}
