import { B, I, CHUNK, make, OPEN, TOP } from "./blocks.js";
import { protectedGatewayChunks } from "./forsaken-gateway.js";
import { hash3 } from "./noise.js";

export const STRONGHOLD_ROOMS_LAYOUT = 1;
export const legacyTempleNote = {
  title: "The Forgotten Temple · Last Watch",
  text: "The armory has enough iron for a torch and a shield. If you find the Pale Lantern, follow the chapel's broken floor down to the gate. Set the lantern in the empty socket. Ashmarket's old library kept the names of the five wardens and the roads to them.",
};

const rooms = [
  { x: 8, z: -10, width: 6, depth: 10, kind: "library" },
  { x: -13, z: -10, width: 6, depth: 10, kind: "armory" },
  { x: -13, z: 2, width: 6, depth: 7, kind: "barracks" },
];
const at = (a, x, y, z) => ({ x: a.x + x, y: a.y + y, z: a.z + z });

export function templeJournal(a) { return at(a, 9, 1, -7); }

export function canAddStrongholdRooms(data, anchor) {
  const protectedChunks = protectedGatewayChunks(data);
  for (let x = Math.floor((anchor.x - 14) / CHUNK); x <= Math.floor((anchor.x + 14) / CHUNK); x++) {
    for (let z = Math.floor((anchor.z - 11) / CHUNK); z <= Math.floor((anchor.z + 10) / CHUNK); z++) {
      if (protectedChunks.has(x + "," + z)) return false;
    }
  }
  return true;
}

export function strongholdRoomsStamp(site) {
  return {
    x: site.x - 14, z: site.z - 11, size: 29,
    apply(gen, data, x0, z0, addContents) {
      const put = (x,y,z,value,contents) => {
        const q = at(site,x,y,z);
        if (q.x < x0 || q.x >= x0 + CHUNK || q.z < z0 || q.z >= z0 + CHUNK) return;
        data[q.x-x0 + (q.z-z0)*CHUNK + q.y*CHUNK*CHUNK] = value;
        if (contents) addContents?.(q.x,q.y,q.z,value,contents);
      };
      for (const room of rooms) {
        const { x,z,width,depth,kind } = room;
        const end = z+depth-1, entrance = x+Math.floor(width/2);
        for(let dz=0;dz<depth;dz++) for(let dx=0;dx<width;dx++) {
          const wx=x+dx, wz=z+dz, side=dx===0||dx===width-1, face=dz===0||dz===depth-1;
          const wall=side||face;
          put(wx,0,wz,wall?B.FORSAKEN_BRICKS:B.DEADWOOD_PLANKS);
          for(let y=1;y<=4;y++){
            let block=B.AIR;
            if(wall){
              const window=side&&dz%4===2&&y>=2&&y<=3;
              block=window?(kind==="library"?B.FORSAKEN_PANE:B.IRON_BARS):
                hash3(gen.seed,site.x+wx,y,site.z+wz)<.22?B.FORSAKEN_CRACKED:B.FORSAKEN_BRICKS;
            }
            put(wx,y,wz,block);
          }
          if (kind !== "barracks" || dx < 3 || dz < 4)
            put(wx,5 + Math.min(2,dx,width-1-dx),wz,kind==="library"?B.ROOF_TILES:B.FORSAKEN_BRICKS);
          if (side && dz % 4 === 0) put(wx,5,wz,B.FORSAKEN_SLAB);
        }
        put(entrance,1,end,make(B.DOOR,OPEN));
        put(entrance,2,end,make(B.DOOR,OPEN|TOP));
        put(entrance,3,end+1,make(B.FORSAKEN_BANNER,4));
        put(x+1,1,end-1,B.LANTERN);
        if (kind==="library") {
          for(let i=1;i<width-1;i++) for(const y of [1,2,3])put(x+i,y,z+1,B.BOOKSHELF);
          put(x+3,1,z+4,B.TABLE);
          put(x+2,1,z+4,make(B.FORSAKEN_STAIRS,1));
          put(x+3,2,z+2,make(B.PAINTING,2),{ type:"painting", art:"moon",rx:1,rz:0 });
          put(9,1,-7,B.NOTE_STAND);
        }
        if (kind==="armory") {
          put(x+1,1,z+1,B.ANVIL);
          put(x+2,1,z+1,B.GRINDSTONE);
          put(x+3,2,z+1,make(B.ITEM_FRAME,2),{type:"frame",slots:[{id:I.SHIELD,n:1}],rot:0});
          put(x+4,1,z+2,make(B.ARMOR_STAND,0),{type:"stand",slots:[{id:I.IRON_HELMET,n:1,dur:165},null,null,null]});
          put(x+1,1,z+4,B.BARREL,{type:"chest",slots:Array.from({length:27},(_,i)=>
            [{id:I.IRON_INGOT,n:2},{id:B.TORCH,n:6},{id:I.BREAD,n:2}][i]||null)});
        }
        if (kind==="barracks") {
          for(const dx of [1,4]) {
            put(x+dx,1,z+1,make(B.BED,0));
            put(x+dx,1,z+2,make(B.BED,8));
            put(x+dx,1,z+3,B.BARREL);
          }
          put(x+2,1,z+3,B.TABLE);
          put(x+3,1,z+3,B.FORSAKEN_STAIRS);
        }
      }
      for(let dz=1;dz<=10;dz++)for(const dx of [-11,10])put(dx,0,dz,B.COBBLE);
    },
  };
}
