import { B, CHUNK, SOLID, isDoor, idOf } from "./blocks.js";
import { GRAND_CAPITAL_GEN } from "./stonehaven-grand.js";
import { villageRoadY } from "./grand-villages.js";

const key = (x,z) => Math.floor(x/CHUNK)+","+Math.floor(z/CHUNK);
export const hasSettlementLife = world => world?.dim === "overworld" && world.gen.version >= GRAND_CAPITAL_GEN;

export function settlementThreatIndex(entities) {
  const cells = new Map();
  for(const e of entities) {
    if (!e.def.hostile || e.def.boss || e.dead || e.gone) continue;
    const k = key(e.pos.x,e.pos.z);
    if (!cells.has(k)) cells.set(k,[]);
    cells.get(k).push(e);
  }
  return cells;
}
export function nearestSettlementThreat(cells,pos,range) {
  const a = Math.floor((pos.x-range)/CHUNK), b = Math.floor((pos.x+range)/CHUNK);
  const c = Math.floor((pos.z-range)/CHUNK), d = Math.floor((pos.z+range)/CHUNK);
  let found = null, best=range*range;
  for(let z=c;z<=d;z++)for(let x=a;x<=b;x++)for(const e of cells.get(x+","+z)||[]){
    if(e.dead||e.gone||Math.abs(e.pos.y-pos.y)>5)continue;
    const dx=e.pos.x-pos.x,dz=e.pos.z-pos.z,dist=dx*dx+dz*dz;
    if(dist<best){found=e;best=dist;}
  }
  return found;
}

function settlementHome(world,e) {
  if(!hasSettlementLife(world)||!e.home||e.npc)return null;
  const [hx,,hz]=e.home,gen=world.gen,p=gen.stonehavenSite;
  if(gen.grandCapital&&hx>=p.x&&hx<p.x+gen.grandCapital.size&&hz>=p.z&&hz<p.z+gen.grandCapital.size)return {capital:p};
  const plot=gen.villagePiece(Math.floor(hx/CHUNK),Math.floor(hz/CHUNK));
  return plot?.settlement ? {plot} : null;
}

export function settlementRoutine(world,e,time) {
  const home=settlementHome(world,e);
  if (!home) return null;
  const [hx,,hz]=e.home, shift=((Math.abs(Math.floor(hx)*17+Math.floor(hz)*31)%9)-4)*.003;
  const t=time+shift;
  if(t>=.335 && t<.42) {
    let points;
    if(home.capital) {
      points=world.gen.grandCapital.gatherPoints;
    } else {
      const g=home.plot.settlement,p=home.plot, court=g.construction;
      const close=Math.hypot((p.cx-court.cx)*CHUNK,(p.cz-court.cz)*CHUNK)<=24;
      const x=(close?court.cx*CHUNK+9:p.cx*CHUNK+2),z=(close?court.cz*CHUNK+4:p.cz*CHUNK+13);
      points=[{x:x+.5,y:close?court.y+1:villageRoadY(g,x,z)+1,z:z+.5}];
    }
    let target=null,distance=27;
    for(const p of points) {
      const x=Math.floor(p.x),z=Math.floor(p.z),d=Math.hypot(p.x-hx,p.z-hz);
      if(d>=distance||!world.isLoaded(x,z)||!SOLID[world.id(x,p.y-1,z)]||SOLID[world.id(x,p.y,z)]||SOLID[world.id(x,p.y+1,z)])continue;
      target=p;distance=d;
    }
    return target?{task:"gather",target}:null;
  }
  if(!e.job||t<.065||t>=.335)return null;
  if(e.sp==="farmer" && t>=.18 && t<.265) {
    const p=home.plot;
    const field=home.capital ? world.gen.grandCapital.workFields.get(e.job.join(",")) :
      p.type==="farm"?{x:p.cx*CHUNK+8.5,y:p.y+1,z:p.cz*CHUNK+5.5}:null;
    if(field&&world.isLoaded(Math.floor(field.x),Math.floor(field.z))&&SOLID[world.id(Math.floor(field.x),field.y-1,Math.floor(field.z))]&&
        !SOLID[world.id(Math.floor(field.x),field.y,Math.floor(field.z))])return {task:"field",target:field};
  }
  return {task:"work"};
}

export function shelterFromThreat(world,e,danger) {
  if(!settlementHome(world,e))return null;
  const [x,y,z]=e.home, hx=Math.floor(x), hz=Math.floor(z);
  const safe=Math.hypot(x-danger.x,z-danger.z);
  const current=Math.hypot(e.pos.x-danger.x,e.pos.z-danger.z);
  if(safe+1<current||Math.hypot(x-e.pos.x,z-e.pos.z)>25||!world.isLoaded(hx,hz))return null;
  const body=world.get(hx,y,hz),head=world.get(hx,y+1,hz);
  if((SOLID[idOf(body)]&&!isDoor(idOf(body)))||(SOLID[idOf(head)]&&!isDoor(idOf(head)))||!SOLID[world.id(hx,y-1,hz)])return null;
  return {x,y,z};
}

export function settlementChimneys(world,pos,budget) {
  if(!hasSettlementLife(world))return [];
  const pcx=Math.floor(pos.x/CHUNK),pcz=Math.floor(pos.z/CHUNK), items=[];
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
    const cx=pcx+dx,cz=pcz+dz,k=cx+","+cz;
    if(!world.chunks.has(k))continue;
    const city=world.gen.grandCapital;
    let refs=city?.chimneys.get(k);
    if(!refs) {
      const p=world.gen.villagePiece(cx,cz);
      if(p?.building&&["cottage","house","manor","inn","farmhouse","smithy"].includes(p.kind)) {
        refs=[[cx*CHUNK+6,p.y+(p.building.upper?14:11),cz*CHUNK+3]];
      }
    }
    for(const [x,start,z] of refs||[]) {
      const dist=Math.hypot(x-pos.x,z-pos.z);
      if(dist>36)continue;
      for(let y=start;y<=start+2;y++)if(world.id(x,y,z)===B.BRICK_SLAB&&world.id(x,y+1,z)===B.AIR) {
        items.push({x:x+.5,y:y+.5,z:z+.5,dist});
        break;
      }
    }
  }
  return items.sort((a,b)=>a.dist-b.dist).slice(0,budget);
}
