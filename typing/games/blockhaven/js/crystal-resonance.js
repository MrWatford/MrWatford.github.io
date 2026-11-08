import { B } from './blocks.js';
import { hash3 } from './noise.js';
import { naturalSandsFootprint } from './hollow-sands-footprint.js';

export const CRYSTAL_WARNING = 2.4, CRYSTAL_FLASH = .5, CRYSTAL_REST = 5, CRYSTAL_RADIUS = 2.5;
// Read-only checks against the existing generator and loaded blocks. No generation.
export function crystalSite(world,x,z) {
  if(!Number.isInteger(x)||!Number.isInteger(z)||!Number.isFinite(world?.gen?.seed)||((x%9)+9)%9!==4||((z%9)+9)%9!==4)return null;
  const marker=hash3(world.gen.seed,Math.floor(x/9),1,Math.floor(z/9));if(marker>=.18)return null;
  const footprint=naturalSandsFootprint(world,x,z,1);if(!footprint)return null;
  const {h,viewY}=footprint;
  if(world.id(x,h,z)!==B.KEEPER_STONE)return null;
  for(let y=h+1;y<=h+2+Math.floor(marker*9);y++)if(world.id(x,y,z)!==B.LUMEN_CRYSTAL)return null;
  return {key:x+','+z,x:x+.5,y:h+1,viewY,z:z+.5,bx:x,bz:z};
}
export function findCrystalSite(world,position) {
  if(!position||![position.x,position.y,position.z].every(Number.isFinite))return null;
  let best=null,range=10;
  const gx=Math.floor(position.x/9),gz=Math.floor(position.z/9);
  // Exactly nine candidate lattice positions; never scan arbitrary chunks.
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
    const x=(gx+dx)*9+4,z=(gz+dz)*9+4,d=Math.hypot(position.x-x-.5,position.z-z-.5);
    if(d>=range)continue;const site=crystalSite(world,x,z);
    if(site&&Math.abs(position.y-site.y)<4){best=site;range=d;}
  }
  return best;
}
export class CrystalResonance {
  constructor(){this.age=0;}
  step(dt){
    let strike=false,warning=false;
    if(Number.isFinite(dt)&&dt>0){const before=this.age;this.age+=Math.min(.1,dt);strike=before<CRYSTAL_WARNING&&this.age>=CRYSTAL_WARNING;
      if(this.age>=CRYSTAL_WARNING+CRYSTAL_FLASH+CRYSTAL_REST){this.age=0;warning=true;}}
    return {strike,warning};
  }
  get phase(){return this.age<CRYSTAL_WARNING?'warning':this.age<CRYSTAL_WARNING+CRYSTAL_FLASH?'pulse':'rest';}
}
export function insideCrystalPulse(site,player) {
  return !!site&&!!player?.onGround&&!player.flying&&!player.mount&&!player.boat&&
    Math.hypot(player.pos.x-site.x,player.pos.z-site.z)<CRYSTAL_RADIUS&&Math.abs(player.pos.y-site.y)<1.1;
}
