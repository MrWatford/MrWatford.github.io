import { CHUNK } from './blocks.js';
import { idx } from './worldgen.js';
import { HOLLOW_SANDS,SANDS_TABLETS } from './hollow-sands.js';
import { BURIED_THRONE } from './buried-throne.js';

// Shared read-only protection for environmental effects on natural terrain.
export function naturalSandsFootprint(world,x,z,zone,radius=3,maxStep=1,collectFloors=false){
  if(!world?.gen?.column||![x,z,zone,radius,maxStep].every(Number.isInteger)||radius<1||radius>3||maxStep<0||maxStep>1)return null;
  const gen=world.gen;if(gen.isMap?.()!==HOLLOW_SANDS||!Number.isFinite(gen.seed))return null;
  const column=gen.column(x,z);
  if(column.zone!==zone||Math.hypot(x,z)<52||Math.hypot(x-BURIED_THRONE.x,z-BURIED_THRONE.z)<45||SANDS_TABLETS.some(t=>Math.hypot(x-t.x,z-t.z)<8))return null;
  if((gen.stamps||[]).some(s=>![s.x,s.z,s.size].every(Number.isFinite)||s.size<=0||x+radius>=s.x&&x-radius<s.x+s.size&&z+radius>=s.z&&z-radius<s.z+s.size))return null;
  const h=column.h;let viewY=h+1;const floors=collectFloors?[]:null;
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
    const bx=x+dx,bz=z+dz;if(!world.isLoaded(bx,bz))return null;
    const ground=gen.column(bx,bz);if(ground.zone!==zone||Math.abs(ground.h-h)>maxStep)return null;
    viewY=Math.max(viewY,ground.h+1);
    if(floors)floors.push([dx,dz,ground.h+1]);
    const cx=Math.floor(bx/CHUNK),cz=Math.floor(bz/CHUNK),mods=world.mods.get(cx+','+cz);
    for(let y=h-1;y<=h+6;y++)if(mods?.has(idx(bx-cx*CHUNK,y,bz-cz*CHUNK))||world.containers.has(bx+','+y+','+bz))return null;
  }
  return {h,viewY,floors};
}
