import { B, I, CHUNK, HEIGHT, SEA, OPEN, TOP, WET, LEAF_PERSIST, LOG_ALONG_X, make } from "./blocks.js";
import { hash3 } from "./noise.js";
import { buildVillageBuilding, fitVillageBuilding, villageBuildingAnchors, VILLAGE_BUILDINGS } from "./village-architecture.js";
import { structuresNear } from "./land-structures.js";
import { MONUMENT_SIZE } from "./ocean-monument.js";
import { untouchedFootprint } from "./structure-placement.js";

export const GRAND_CAPITAL_GEN = 23;
export const GRAND_CAPITAL_LAYOUT = 4;
export const GRAND_CAPITAL_SIZE = 192;
export const INNER_CAPITAL_X = 48, INNER_CAPITAL_Z = 32;
const KEEP = 65535, LOWER = 8, UPPER = 183;
const C = 104, SOUTH = 176;
const CHUNK_KEY = (x,z) => Math.floor(x / CHUNK) + "," + Math.floor(z / CHUNK);
const within = (x,z,b) => x>=b[0] && z>=b[1] && x<=b[2] && z<=b[3];
const overlaps = (a,b) => a[0]<=b[2] && a[2]>=b[0] && a[1]<=b[3] && a[3]>=b[1];
const rect = (x,z,w,d) => [x,z,x+w-1,z+d-1];
const footprint = p => rect(p.x,p.z,GRAND_CAPITAL_SIZE,GRAND_CAPITAL_SIZE);
const legacyCore = [64,48,143,127];
const legacyWings = [48,73,159,111];

function eastShore(gen,x,z) {
  for (const p of [53,67,117,151]) {
    const samples = [-8,-4,0,4,8];
    const water = samples.filter(dz => gen.column(x+189,z+p+dz).h <= SEA-2);
    const coast = samples.filter(dz => gen.column(x+170,z+p+dz).h >= SEA-1);
    if (water.length >= 4 && coast.length >= 3) return p;
  }
  return null;
}

export function findGrandCapital(gen,data) {
  const available = untouchedFootprint(data), S=GRAND_CAPITAL_SIZE;
  const turn = Math.floor(hash3(gen.seed,127,23,127)*4);
  for (let r=26; r<=168; r+=2) for (let d=-r+4; d<r-3; d+=4) {
    for(let i=0;i<4;i++) {
      const side=(i+turn)%4, x=(side===0?d:side===1?r:-d) * CHUNK, z=(side===0?-r:side===2?r:d) * CHUNK;
      const xx=side===3?-r*CHUNK:x;
      const mid=gen.column(xx+C,z+88);
      if (mid.h<SEA || mid.h>43) continue;
      const plot={v:GRAND_CAPITAL_LAYOUT,seed:gen.seed,x:xx,z,y:Math.max(33,Math.min(37,mid.h)),shore:null};
      const bounds=footprint(plot);
      if (!available(xx,z,xx+S,z+S) || gen.stamps.some(s => overlaps(bounds,rect(s.x,s.z,s.size||32,s.size||32))) ||
          gen.strongholds.some(s => overlaps(bounds,[s.x-56,s.z-56,s.x+56,s.z+56]))) continue;
      let wet=0, steep=0, dry=false;
      for(let dz=15;dz<S-12;dz+=23) for(let dx=15;dx<S-12;dx+=23) {
        const h=gen.column(xx+dx,z+dz).h;
        if(h<SEA-2) wet++;
        if(h<SEA-9 || h>plot.y+15) steep++;
      }
      for (const [dx,dz] of [[104,189],[104,1],[3,93],[189,93]]) {
        const h=gen.column(xx+dx,z+dz).h;
        if (h>=SEA-1 && h<=plot.y+9) dry=true;
      }
      if (!dry || wet>15 || steep>5 || gen.column(xx+C,z+182).h<SEA-4) continue;
      if (structuresNear(gen,xx+96,z+96).some(s=>overlaps(bounds,rect(s.x0-3,s.z0-3,s.w+6,s.d+6))) ||
          gen.monumentsNear(xx+96,z+96).some(s=>overlaps(bounds,rect(s.x0-4,s.z0-4,MONUMENT_SIZE+8,MONUMENT_SIZE+8)))) continue;
      plot.shore=eastShore(gen,xx,z);
      return plot;
    }
  }
  return null;
}

export function grandCapitalDestination(plot) {
  const {x,y,z}=plot;
  return { kind:"stonehaven", title:"Stonehaven", name:"Grand South Gate", x:x+C+.5,y:y+1,z:z+182.5,
    guide:"Cross the Grand South Gate into the market and civic square. Continue north through the inner gate to the original keep and Crown Tower. The western lanes lead to farmland and homes. The eastern streets lead to the artisan district." +
      (plot.shore===null ? "" : " The east wall also opens onto the waterfront docks.") };
}

export function grandCapitalPlaces(plot) {
  const pos=(x,z,dy=1)=>({x:plot.x+x+.5,y:plot.y+dy,z:plot.z+z+.5});
  const places = [
    ["market","Grand Market",104,149,1],["keep","Crown Keep",104,82,4],["farms","West Granaries",54,155,1],
    ["artisans","Artisan Street",160,124],["nobles","Noble Gardens",104,40],["civic","Civic Hall",72,149],
    ["library","Grand Library",145,166],["homes","West Residential Lanes",53,114]
  ];
  if(plot.shore!==null)places.push(["docks","East Waterfront",180,plot.shore]);
  return places.map(([id,title,x,z,dy])=>({kind:"stone_"+id,title,name:"Stonehaven",...pos(x,z,dy)}));
}

export function grandCapitalFestival(plot) {
  return {x:plot.x+105,y:plot.y,z:plot.z+156, radius:GRAND_CAPITAL_SIZE,span:6,width:4};
}
export function grandCapitalWorkshop(plot) {
  return {cx:plot.x/CHUNK+8,cz:plot.z/CHUNK+8,y:plot.y,biome:"stonehaven",dx:0,dz:0};
}
export function grandCapitalSiege(plot) {
  const at=(x,z)=>({x:plot.x+x+.5,y:plot.y+1,z:plot.z+z+.5});
  const spawns=[[95,181],[104,184],[113,181],[92,166],[116,166],[104,170],[100,163],[110,163]].map(([x,z])=>at(x,z));
  return {anchor:at(C,171),rally:at(C,153),spawns};
}

const professions={
  cottage:["shepherd",B.LOOM], house:["fletcher",B.FLETCH_TABLE], manor:["fletcher",B.FLETCH_TABLE],
  farmhouse:["farmer",B.COMPOSTER], smithy:["smith",B.SMITH_TABLE], shop:["fletcher",B.FLETCH_TABLE],
  library:["scribe",B.BOOKSHELF], inn:["butcher",B.SMOKER], storehouse:["fisherman",B.BARREL], stable:["shepherd",B.LOOM]
};
const farmlands=[[18,136,44,149],[18,153,44,165],[27,20,48,31],[56,150,62,163]];
const publicSpaces=[
  [94,135,126,173], [64,133,79,147], [134,148,154,165], [130,130,143,143],
  [79,148,92,166], [13,158,17,165], [87,169,120,183],
  [15,46,32,57], [14,106,31,117], [44,143,55,155], ...farmlands
];
const wardLots=[
  {district:"noble",xs:[57,72,87,111,126,142,159],zs:[22,34],cycle:["manor","manor","house","manor","library"]},
  {district:"residential",xs:[19,34,50],zs:[38,63,78,101,115,132],cycle:["cottage","house","cottage","inn","house","farmhouse"]},
  {district:"artisan",xs:[148,166],zs:[51,65,79,100,115,132,150],cycle:["smithy","storehouse","shop","smithy","stable","shop"]},
  {district:"market",xs:[63,81,111,129,146,165],zs:[133,151,157],cycle:["shop","inn","storehouse","shop","smithy"]},
  {district:"agriculture",xs:[19,33,50],zs:[31,116,151,155],cycle:["farmhouse","stable","storehouse"]}
];

export function grandCapitalBlueprint(seed,shore=null) {
  const buildings = [], space = [legacyCore,legacyWings,...publicSpaces];
  const allocate=(district,kind,x,z,major=false)=>{
    const n=Math.floor(hash3(seed,x,2393,z)*VILLAGE_BUILDINGS[kind].length);
    let plan=fitVillageBuilding(kind,n,major?18:11,major?13:9);
    if (major) plan={...plan,width:kind==="library"?17:15,depth:kind==="library"?12:11,roof:"cross",upper:kind!=="smithy"};
    const box=[x-1,z-1,x+plan.width,z+plan.depth+1];
    if (!major && (box[2]>177 || box[3]>167 || box[0]<15 || space.some(s=>overlaps(box,s)) ||
        overlaps(box,[99,18,108,133]) || overlaps(box,[15,90,178,95]))) return;
    buildings.push({district,kind,x,z,plan,box,major});
    space.push(box);
  };
  allocate("civic","inn",64,135,true);
  allocate("civic","library",136,151,true);
  allocate("market","inn",63,153,true);
  allocate("artisan","smithy",161,130,true);
  allocate("agriculture","farmhouse",20,121);
  allocate("agriculture","stable",36,121);
  allocate("agriculture","storehouse",34,48);
  if(shore!==null){
    allocate("waterfront","storehouse",164,shore-16);
    allocate("waterfront","house",164,shore+6);
  }
  for(const {district,xs,zs,cycle} of wardLots) for(const z of zs) for(const x of xs) {
    const i=Math.floor(hash3(seed,x,2395,z)*cycle.length);
    allocate(district,cycle[i],x,z);
  }
  return buildings;
}

// Terrain and features are written only for the requested chunk. The old keep is a separate compact stamp.
export function buildGrandCapital(gen,plot,inner) {
  const {x:wx,z:wz,y:ground}=plot, seed=gen.seed;
  const buildings=grandCapitalBlueprint(seed,plot.shore), features=new Map(), residentChunks=new Map(), landmarks=[];
  const chimneys=new Map(), workFields=new Map(), cropChunks=new Map();
  const gatherPoints=[[104,40],[53,68],[53,116],[53,133],[160,124],[84,148],[104,153],[160,69],[122,44]]
    .map(([x,z])=>({x:wx+x+.5,y:ground+1,z:wz+z+.5}));
  const stone=(x,z)=>hash3(seed,wx+x,2386,wz+z)<.19?B.CRACKED_BRICKS:B.STONE_BRICKS;
  const cityKey=(x,z)=>CHUNK_KEY(wx+x,wz+z);
  const add=(bounds,draw)=>{
    for(let z=Math.floor(bounds[1]/CHUNK);z<=Math.floor(bounds[3]/CHUNK);z++) {
      for(let x=Math.floor(bounds[0]/CHUNK);x<=Math.floor(bounds[2]/CHUNK);x++) {
        const k=cityKey(x*CHUNK,z*CHUNK);
        if(!features.has(k))features.set(k,[]);
        features.get(k).push(draw);
      }
    }
  };
  const resident=(species,x,z,job=null,stock=false)=>{
    const k=cityKey(x,z);
    if(!residentChunks.has(k))residentChunks.set(k,[]);
    residentChunks.get(k).push({species,home:[wx+x+.5,ground+1,wz+z+.5],job,stock});
  };
  const localJob=(x,y,z)=>[wx+x,ground+y,wz+z];
  const flame=(d,x,z,y=0)=>{
    d.put(x,y+1,z,B.STONE_BRICKS);
    d.box(x,y+2,z,x,y+4,z,B.OAK_FENCE);
    d.put(x,y+4,z+1,make(B.DARK_OAK_SLAB,1));
    d.put(x,y+3,z+1,make(B.LANTERN,1));
  };
  const lampAt=(x,z)=>add([x,z,x,z+1],d=>flame(d,x,z));
  const paving=(x,z)=>((x+z)%8===0?B.MOSSY:stone(x,z));

  // The historic precinct, including its original galleries and Crown Tower, remains at the center.
  const section=[INNER_CAPITAL_X,INNER_CAPITAL_Z,INNER_CAPITAL_X+111,INNER_CAPITAL_Z+111];
  const dx=INNER_CAPITAL_X, dz=INNER_CAPITAL_Z, stride=112*112;
  add(section,d=>{
    for(let z=Math.max(d.z0,dz);z<=Math.min(d.z1,dz+111);z++) for(let x=Math.max(d.x0,dx);x<=Math.min(d.x1,dx+111);x++) {
      const start=x-dx+(z-dz)*112;
      for(let y=1;y<HEIGHT;y++){const v=inner.cells[start+y*stride];if(v!==KEEP)d.put(x,y-ground,z,v);}
    }
    if (d.contents) for (const record of inner.contents.get(d.key) || []) d.contents(...record);
  });

  // Axes link all four outer gates to the historic precinct, branching into smaller district lanes.
  add([LOWER,LOWER,UPPER,UPPER],d=>{
    for(let z=d.z0;z<=d.z1;z++) for(let x=d.x0;x<=d.x1;x++) {
      if(x<LOWER||x>UPPER||z<LOWER||z>UPPER || within(x,z,legacyCore)) continue;
      const axis=x>=C-3&&x<=C+3 || z>=91&&z<=95;
      const lanes=!within(x,z,legacyWings) && (x>=51&&x<=55 || x>=159&&x<=162 ||
        z>=19&&z<=20 || z>=46&&z<=47 || z>=128&&z<=133 || z>=167&&z<=169);
      if(axis||lanes) d.put(x,0,z,paving(x,z));
      else if ((x===C-4||x===C+4) && z%3!==0) d.put(x,0,z,B.DARKSLATE_BRICKS);
    }
  });
  add([100,121,108,133],d=>{
    d.box(100,0,121,108,0,133,B.STONE_BRICKS);
    d.box(101,1,121,107,3,133,B.AIR);
  });
  add([100,40,108,54],d=>{
    d.box(100,0,40,108,0,54,B.STONE_BRICKS);
    d.box(101,1,40,107,3,54,B.AIR);
  });
  add([90,177,118,191],d=>{
    for (const [x1,x2,z1,z2] of [[101,107,177,190],[92,97,180,184],[111,116,180,184]]) {
      for (let z=z1;z<=z2;z++)for(let x=x1;x<=x2;x++){
        const natural=gen.column(wx+x,wz+z).h;
        d.box(x,natural-ground+1,z,x,-1,z,stone(x,z));
        d.put(x,0,z,paving(x,z));
        d.box(x,1,z,x,Math.max(natural-ground+7,4),z,B.AIR);
      }
    }
  });
  for(const x of [99,109]) for (const z of [133,146,164,181,25,38]) lampAt(x,z);
  for(const x of [24,44,60,146,170]) for (const z of [88,98,130]) {
    if(!within(x,z,legacyCore) && !within(x,z,legacyWings)) lampAt(x,z);
  }

  for (const b of buildings) {
    const {x,z,plan,kind,box}=b, a=villageBuildingAnchors(plan), [prof,station]=professions[kind];
    resident(prof,x+a.home[0],z+a.home[2],localJob(x+a.job[0],a.job[1],z+a.job[2]));
    if (["cottage","house","manor","smithy","inn","farmhouse"].includes(kind)) {
      const key=cityKey(x+1,z+1);
      if(!chimneys.has(key))chimneys.set(key,[]);
      chimneys.get(key).push([wx+x+1,ground+(plan.upper?14:11),wz+z+1]);
    }
    add(box,d=>{
      const gate=x+a.door[0],front=z+plan.depth-1;
      for(let t=front+1;t<=front+2;t++) for(let a=gate-1;a<=gate+1;a++) d.put(a,0,t,paving(a,t));
      buildVillageBuilding(plan,{
        put:(bx,y,bz,v)=>d.put(x+bx,y,z+bz,v), biome:"stonehaven",seed,x:wx+x,z:wz+z,jobBlock:station,profession:prof,
        decorate:(bx,y,bz,v,c)=>{if(d.contents&&within(x+bx,z+bz,[d.x0,d.z0,d.x1,d.z1]))d.contents(wx+x+bx,ground+y,wz+z+bz,v,c);}
      });
      if (b.district==="civic" && b.kind==="inn") {
        d.box(x+4,0,z+2,x+10,0,z+4,B.DARK_OAK_PLANKS);
        d.put(x+7,1,z+2,B.LECTERN);
        for(const j of [x+4,x+10]){
          d.put(j,1,z+3,B.BOOKSHELF);
          d.put(j,2,z+3,B.LANTERN);
          d.put(j,2,z+1,make(B.CASTLE_BANNER,0));
        }
      }
      if (b.district==="noble") for(const j of [x+2,x+plan.width-3]){
        d.put(j,0,z-1,B.GRASS);
        d.put(j,1,z-1,make(B.AZALEA_LEAVES,LEAF_PERSIST));
      }
    });
  }

  buildSquares();
  buildFarms();
  buildWalls();
  if (plot.shore!==null) buildWaterfront(plot.shore);
  for(const [x,z] of [[94,163],[114,165],[52,97],[160,98],[104,42],[104,118]])resident("golem",x,z);
  for(const [x,z] of [[91,151],[120,155]])resident("fletcher",x+1,z,localJob(x,1,z));
  for(const [x,z] of [[24,135],[24,152],[34,32],[55,148]])resident("farmer",x,z,localJob(x+1,1,z));

  function buildSquares() {
    add([79,134,128,167],d=>{
      d.box(94,0,135,126,0,167,B.STONE_BRICKS);
      d.box(80,0,148,93,0,166,B.COBBLE);
      for(const z of [137,146,154,165]) for(let x=95;x<=125;x++) d.put(x,0,z,(x+z)%3===0?B.DARKSLATE_BRICKS:B.STONE_BRICKS);
      // Fountain and flower court sit beside the avenue and leave the siege route open.
      for(let z=139;z<=148;z++) for(let x=114;x<=125;x++) {
        const edge=x===114||x===125||z===139||z===148||x+z===253||x+z===273;
        d.put(x,-1,z,B.STONE_BRICKS);
        d.put(x,0,z,edge?B.STONE_BRICKS:B.WATER);
        if(edge&&((x+z)%3))d.put(x,1,z,B.STONE_BRICK_SLAB);
      }
      d.box(119,1,143,120,4,144,B.STONE_BRICKS);
      d.box(118,5,142,121,5,145,B.STONE_BRICK_SLAB);
      d.put(119,6,143,B.LANTERN);
      for (const z of [140,143,146]) {
        d.put(127,0,z,B.GRASS);d.put(127,1,z,z%2?B.FLOWER_YELLOW:B.FLOWER_RED);
      }
      for (const [x,z,tint] of [[82,151,B.BLUE_WOOL],[88,155,B.CRIMSON_PLANKS],[82,161,B.WOOL],[89,163,B.WARPED_PLANKS],[119,155,B.CRIMSON_PLANKS],[121,162,B.WARPED_PLANKS]]) {
        for(const ex of [-2,2])for(const ez of [-1,1])d.box(x+ex,1,z+ez,x+ex,3,z+ez,B.OAK_FENCE);
        for(let a=-2;a<=2;a++)d.box(x+a,4,z-1,x+a,4,z+1,a%2?tint:B.WOOL);
        d.put(x,1,z,B.BARREL);d.put(x+1,1,z,B.TABLE);d.put(x-1,1,z,B.CHEST);
      }
      d.put(91,1,151,B.FLETCH_TABLE);
      d.put(120,1,155,B.FLETCH_TABLE);
      for(const x of [83,88]){d.put(x,1,148,make(B.DARK_OAK_LOG,LOG_ALONG_X));d.put(x+1,1,148,B.DARK_OAK_SLAB);}
    });
    // Functioning market display: a permitted existing item sits in each framed rear stall.
    add([81,152,87,154],d=>{
      d.box(82,2,153,87,2,153,B.DARK_OAK_PLANKS);
      for(const x of [83,85,87]) {
        const v=make(B.ITEM_FRAME,0);
        d.put(x,2,152,v);
        if(d.contents&&within(x,152,[d.x0,d.z0,d.x1,d.z1])) {
          d.contents(wx+x,ground+2,wz+152,v,{type:"frame",slots:[{id:x===85?B.HAY:I.WHEAT,n:1}],rot:0});
        }
      }
    });
    add([63,132,81,148],d=>{
      d.box(64,0,133,79,0,134,B.STONE_BRICK_SLAB);
      d.box(65,0,146,78,0,148,B.STONE_BRICKS);
      for(const x of [65,78]) {
        d.box(x,1,147,x,5,147,B.STONE_BRICKS);
        d.put(x,6,147,B.STONE_BRICK_SLAB);
        d.put(x,4,148,make(B.CASTLE_BANNER,0));
      }
    });
  }

  function buildFarms() {
    for(const [ix,f] of farmlands.entries()) {
      const [a,b,c,e]=f;
      const crop=[B.WHEAT,B.CARROTS,B.POTATOES,B.BEETROOTS];
      for(let z=b+1;z<e;z++)for(let x=a+1;x<c;x++){
        if(z===b+4||(x-a)%8===4)continue;
        const k=cityKey(x,z);
        if(!cropChunks.has(k))cropChunks.set(k,[]);
        cropChunks.get(k).push([wx+x,ground+1,wz+z]);
      }
      add(f,d=>{
        for(let z=b;z<=e;z++)for(let x=a;x<=c;x++) {
          if(x<d.x0||x>d.x1||z<d.z0||z>d.z1)continue;
          const ix=x-a, wet=ix%8===4, border=z===b||z===e||x===a||x===c;
          d.put(x,-1,z,B.DIRT);
          d.put(x,0,z,border||z===b+4?B.GRAVEL:wet?B.WATER:make(B.FARMLAND,WET));
          if(!border&&z!==b+4&&!wet)d.put(x,1,z,make(crop[(Math.floor(ix/8)+Math.floor((z-b)/6))%4],5+(x+z)%3));
          if(z===b+4&&wet)d.put(x,0,z,B.DARK_OAK_PLANKS);
        }
        d.put(a,1,b,B.BARREL);d.put(c,1,e,B.HAY);
      });
      const [x,z]=[[24,135],[24,152],[34,32],[55,148]][ix];
      add([x,z,x+1,z],d=>d.put(x+1,1,z,B.COMPOSTER));
      workFields.set(localJob(x+1,1,z).join(","),{x:wx+a+2.5,y:ground+1,z:wz+b+4.5});
    }
    add([15,46,32,57],d=>{
      for(const x of [16,31]) d.box(x,1,47,x,1,56,B.OAK_FENCE);
      for(const z of [47,56])d.box(16,1,z,31,1,z,B.OAK_FENCE);
      d.put(23,1,56,make(B.OAK_GATE,0));
      d.box(17,1,48,18,1,49,B.HAY);
      d.put(29,1,49,B.CAULDRON);
    });
    resident("sheep",21,52,null,true);
    resident("cow",26,52,null,true);
    for (const x of [17,23,28]) for(const z of [109,115]) add([x-2,z-2,x+2,z+2],d=>{
      d.box(x,1,z,x,4,z,B.DARK_OAK_LOG);
      const leaf=make(B.DARK_OAK_LEAVES,LEAF_PERSIST);
      d.box(x-1,3,z-2,x+1,4,z+2,leaf);
      d.box(x-2,3,z-1,x+2,4,z+1,leaf);
      d.put(x,5,z,leaf);
    });
    const x=46,z=144,plan=fitVillageBuilding("storehouse",1,9,8);
    add([x-2,z-1,x+plan.width,z+plan.depth+1],d=>{
      buildVillageBuilding(plan,{put:(a,y,b,v)=>d.put(x+a,y,z+b,v),biome:"stonehaven",seed,x:wx+x,z:wz+z,
        decorate:(a,y,b,v,c)=>{if(d.contents&&within(x+a,z+b,[d.x0,d.z0,d.x1,d.z1]))d.contents(wx+x+a,ground+y,wz+z+b,v,c);}});
      d.box(x+2,4,z+2,x+5,15,z+5,B.STONE_BRICKS);
      d.box(x+1,14,z+1,x+6,14,z+6,B.DARK_OAK_STAIRS);
      d.box(x+2,15,z+2,x+5,16,z+5,B.ROOF_TILES);
      const front=z+plan.depth;
      d.box(x+4,11,z+5,x+4,11,front,B.LOG);
      for(let i=-4;i<=4;i++){
        d.put(x+4+i,11,front,B.DARK_OAK_PLANKS);d.put(x+4,11+i,front,B.DARK_OAK_PLANKS);
        if(i) {d.put(x+4+i,11+Math.sign(i),front,B.WOOL);d.put(x+4-Math.sign(i),11+i,front,B.WOOL);}
      }
      d.put(x+4,11,front+1,B.IRON_BLOCK);
    });
    landmarks.push("Windmill granary");
  }

  function buildWalls() {
    const W=12,E=179,N=12,S=SOUTH;
    const walls=[
      [[W,N,E,N],"north"],[[W,S,E,S],"south"],[[W,N,W,S],"west"],[[E,N,E,S],"east"]
    ];
    for(const [bounds,side] of walls)add(bounds,d=>{
      const horizontal=side==="north"||side==="south";
      const [a,b,c,e]=bounds;
      for(let z=Math.max(b,d.z0);z<=Math.min(e,d.z1);z++)for(let x=Math.max(a,d.x0);x<=Math.min(c,d.x1);x++){
        const gate=horizontal?(x>=99&&x<=109):z>=90&&z<=96||side==="east"&&plot.shore!==null&&Math.abs(z-plot.shore)<=2;
        d.box(x,gate?5:1,z,x,7,z,stone(x,z));
        if(((horizontal?x:z)&1)===0)d.put(x,8,z,B.STONE_BRICKS);
      }
    });
    // Hollow towers with doors and ladder access to battlements.
    for(const [x,z,h,front] of [[13,13,12,true],[171,13,15,true],[13,168,13,false],[171,168,15,false],
      [90,171,16,false],[111,171,18,false],[91,13,14,true],[110,13,14,true]]) {
      add([x-1,z-1,x+8,z+8],d=>{
        d.box(x,0,z,x+7,0,z+7,B.STONE_BRICKS);
        for(let k=0;k<8;k++)for(const [a,b] of [[x+k,z],[x+k,z+7],[x,z+k],[x+7,z+k]]) {
          d.box(a,1,b,a,h-1,b,stone(a,b));
          if(k===3||k===4){d.put(a,5,b,B.IRON_BARS);d.put(a,9,b,B.STAINED_GLASS);}
          if(k%2===0)d.put(a,h+1,b,B.STONE_BRICKS);
        }
        const zz=front?z+7:z;
        d.put(x+3,1,zz,make(B.DOOR,OPEN|(front?0:2)));
        d.put(x+3,2,zz,make(B.DOOR,OPEN|TOP|(front?0:2)));
        d.box(x-1,h,z-1,x+8,h,z+8,B.STONE_BRICKS);
        d.put(x+1,h,z+2,B.AIR);
        for(let y=1;y<=h+1;y++)d.put(x+1,y,z+2,make(B.LADDER,3));
        d.put(x+4,2,z+4,B.LANTERN);
        d.put(x+5,h+1,z+5,B.BRAZIER);
        if(h>=14) {
          for(let i=0;i<4;i++){
            const l=x+i,r=x+7-i,n=z+i,s=z+7-i,y=h+3+i;
            d.box(l,y,n,r,y,n,make(B.BLACKSTONE_BRICK_STAIRS,0));
            d.box(l,y,s,r,y,s,make(B.BLACKSTONE_BRICK_STAIRS,2));
            d.box(l,y,n,l,y,s,make(B.BLACKSTONE_BRICK_STAIRS,1));
            d.box(r,y,n,r,y,s,make(B.BLACKSTONE_BRICK_STAIRS,3));
          }
          d.box(x+1,h+2,z+1,x+1,h+5,z+1,B.STONE_BRICKS);
          d.put(x+3,h+7,z+3,B.LANTERN);
        }
      });
    }
    add([98,172,110,179],d=>{
      d.box(99,5,172,109,8,178,B.STONE_BRICKS);
      d.box(98,8,171,110,8,179,B.BLACKSTONE_BRICKS);
      for(let x=98;x<=110;x+=2){d.put(x,9,179,B.STONE_BRICKS);d.put(x,9,172,B.STONE_BRICKS);}
      for(const x of [101,104,107]) d.put(x,4,176,make(B.LANTERN,1));
      for(const x of [100,108])d.put(x,6,179,make(B.CASTLE_BANNER,0));
    });
    landmarks.push("Grand Gatehouse and eight lookout towers");
  }

  function buildWaterfront(z) {
    add([159,z-6,191,z+6],d=>{
      d.box(159,0,z-2,173,0,z+2,B.STONE_BRICKS);
      d.box(173,0,z-3,191,0,z+3,B.DARK_OAK_PLANKS);
      for (const x of [175,181,188,191]) for(const q of [-3,3]) {
        d.box(x,-5,z+q,x,1,z+q,B.DARK_OAK_LOG);
        d.put(x,2,z+q,B.LANTERN);
      }
      for(let x=182;x<=191;x++) for(const q of [-4,4])if(x!==188)d.put(x,1,z+q,B.OAK_FENCE);
      d.box(184,-1,z-6,190,-1,z-4,B.DARK_OAK_SLAB);
      d.box(184,-1,z+4,190,-1,z+6,B.DARK_OAK_SLAB);
    });
    landmarks.push("Waterfront quay");
  }

  return {
    x:wx,z:wz,size:GRAND_CAPITAL_SIZE,capital:true,buildings:buildings.length+9,
    landmarks,features,residentChunks,chimneys,workFields,cropChunks,gatherPoints,
    apply(worldGen,data,x0,z0,contents){
      const a=x0-wx,b=z0-wz,k=cityKey(a,b);
      const d={x0:a,x1:a+15,z0:b,z1:b+15,key:k,contents,
        put(x,y,z,v){const ay=y+ground;if(x>=a&&x<=a+15&&z>=b&&z<=b+15&&ay>0&&ay<HEIGHT)data[x-a+(z-b)*CHUNK+ay*CHUNK*CHUNK]=v;},
        box(x1,y1,z1,x2,y2,z2,v){
          const first=Math.max(1,y1+ground), last=Math.min(HEIGHT-1,y2+ground);
          for(let z=Math.max(z1,b);z<=Math.min(z2,b+15);z++)for(let x=Math.max(x1,a);x<=Math.min(x2,a+15);x++) {
            const at=x-a+(z-b)*CHUNK;
            for(let y=first;y<=last;y++)data[at+y*CHUNK*CHUNK]=v;
          }
        }
      };
      for(let z=b;z<=b+15;z++)for(let x=a;x<=a+15;x++) {
        if(!within(x,z,[LOWER,LOWER,UPPER,UPPER]))continue;
        const natural=worldGen.column(wx+x,wz+z).h;
        const ditch=plot.shore!==null&&x>=180&&Math.abs(z-plot.shore)<=8&&natural<=SEA-2;
        if(ditch)continue;
        const edge=Math.min(x-LOWER,z-LOWER,UPPER-x,UPPER-z);
        const main=x>=101&&x<=107||z>=91&&z<=95;
        const floor=edge<4&&!main?Math.round(natural+(ground-natural)*(edge+1)/5):ground;
        d.box(x,Math.max(1,Math.min(natural,floor)-2)-ground,z,x,floor-ground-1,z,B.DIRT);
        d.put(x,floor-ground,z,B.GRASS);
        d.box(x,floor-ground+1,z,x,Math.max(ground+2,natural+9)-ground,z,B.AIR);
      }
      for(const draw of features.get(k)||[])draw(d);
    }
  };
}
