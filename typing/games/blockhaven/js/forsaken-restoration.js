import { B, CHUNK } from "./blocks.js";
import { hash3 } from "./noise.js";

const shoots=[B.TALL_GRASS,B.FLOWER_YELLOW,B.FLOWER_RED,B.CRIMSON_BRIAR,B.FLOWER_YELLOW];
const dry=new Set([B.ASH_SOIL,B.FORSAKEN_STONE,B.BLACKSTONE,B.FORSAKEN_MOSSY]);
export function restoreClearing(world,saved,entities,mark) {
  const cx=Math.floor(mark.x/CHUNK), cz=Math.floor(mark.z/CHUNK), key=cx+","+cz;
  if (!world.isLoaded(mark.x,mark.z) || world.visited.has(key) || world.mods.has(key) ||
      saved?.entities?.[key]?.length || entities.some(e=>Math.floor(e.pos.x/CHUNK)===cx&&Math.floor(e.pos.z/CHUNK)===cz)) return false;
  for (const key2 of world.containers.keys()) {
    const [x, ,z]=key2.split(",").map(Number);
    if (Math.floor(x/CHUNK)===cx && Math.floor(z/CHUNK)===cz) return false;
  }
  let changed=false;
  for (let dz=-2; dz<=2; dz++) for (let dx=-2; dx<=2; dx++) {
    const x=mark.x+dx, z=mark.z+dz;
    if (Math.floor(x/CHUNK)!==cx || Math.floor(z/CHUNK)!==cz || hash3(mark.x,x,1,z)<.43) continue;
    const y=world.gen.column(x,z).h;
    if (dry.has(world.id(x,y,z)) && world.id(x,y+1,z)===B.AIR && world.id(x,y+2,z)===B.AIR) {
      const plant=shoots[Math.floor(hash3(mark.z,x,5,z)*shoots.length)];
      changed=world.set(x,y+1,z,plant)||changed;
    }
  }
  return changed;
}

export function restorationSites(layout,fallen) {
  const { woods,kingdom }=layout.anchors;
  const s=layout.sanctuary, market=fallen?.market;
  const align=(p,x,z)=>({x:Math.floor((p.x+x)/CHUNK)*CHUNK+7,z:Math.floor((p.z+z)/CHUNK)*CHUNK+7});
  return [
    align(woods,19,16), align(woods,-21,-12), align(kingdom,20,-13),
    ...(s?[align(s,-23,16)]:[]), ...(market?[align(market,28,7)]:[]),
  ];
}
