import { B, CHUNK, HEIGHT, SEA, LEAF_PERSIST, LOG_ALONG_X, OPEN, WET, make } from "./blocks.js";
import { hash3 } from "./noise.js";
import { buildVillageBuilding } from "./village-architecture.js";
import { villageRoadY } from "./grand-villages.js";
import { GRAND_CAPITAL_GEN } from "./stonehaven-grand.js";

const STYLES = {
  plains: { stone: B.STONE_BRICKS, worn: B.COBBLE, step: B.STONE_BRICK_STAIRS, ground: B.GRASS, log: B.LOG, leaf: B.LEAVES, deck: B.PLANKS },
  forest: { stone: B.COBBLE, worn: B.MOSSY, step: B.COBBLE_STAIRS, ground: B.GRASS, log: B.DARK_OAK_LOG, leaf: B.DARK_OAK_LEAVES, deck: B.SPRUCE_PLANKS },
  birch: { stone: B.COBBLE, worn: B.MOSSY, step: B.COBBLE_STAIRS, ground: B.GRASS, log: B.BIRCH_LOG, leaf: B.BIRCH_LEAVES, deck: B.BIRCH_PLANKS },
  taiga: { stone: B.STONE_BRICKS, worn: B.COBBLE, step: B.STONE_BRICK_STAIRS, ground: B.GRASS, log: B.SPRUCE_LOG, leaf: B.SPRUCE_LEAVES, deck: B.SPRUCE_PLANKS },
  mountain: { stone: B.STONE_BRICKS, worn: B.CRACKED_BRICKS, step: B.STONE_BRICK_STAIRS, ground: B.GRASS, log: B.SPRUCE_LOG, leaf: B.SPRUCE_LEAVES, deck: B.SPRUCE_PLANKS },
  sandy: { stone: B.SANDSTONE, worn: B.TEMPLE_STONE, step: B.SANDSTONE_STAIRS, ground: B.SAND, log: B.ACACIA_LOG, leaf: B.ACACIA_LEAVES, deck: B.ACACIA_PLANKS },
  savanna: { stone: B.COBBLE, worn: B.STONE_BRICKS, step: B.COBBLE_STAIRS, ground: B.GRASS, log: B.ACACIA_LOG, leaf: B.ACACIA_LEAVES, deck: B.ACACIA_PLANKS },
  cherry: { stone: B.STONE_BRICKS, worn: B.MOSSY, step: B.STONE_BRICK_STAIRS, ground: B.GRASS, log: B.CHERRY_LOG, leaf: B.CHERRY_LEAVES, deck: B.CHERRY_PLANKS },
  wetland: { stone: B.COBBLE, worn: B.MOSSY, step: B.MOSSY_STAIRS, ground: B.GRASS, log: B.MANGROVE_LOG, leaf: B.MANGROVE_LEAVES, deck: B.MANGROVE_PLANKS },
  jungle: { stone: B.COBBLE, worn: B.MOSSY, step: B.COBBLE_STAIRS, ground: B.GRASS, log: B.JUNGLE_LOG, leaf: B.JUNGLE_LEAVES, deck: B.JUNGLE_PLANKS }
};
const CROP_ROWS = [B.WHEAT, B.CARROTS, B.POTATOES, B.BEETROOTS];
const CHANNEL = 9;
const DIRS = [[0,1],[1,0],[0,-1],[-1,0]];

export function villageCropCells(plot) {
  const phase = Math.abs(plot.cx + plot.cz) % CROP_ROWS.length;
  const cells = [];
  for (let z = 2; z <= 9; z++) for (let x = 5; x <= 13; x++) {
    if (x === CHANNEL || z === 5) continue;
    cells.push([x,z,CROP_ROWS[(phase + (x > CHANNEL ? 1 : 0) + (z > 5 ? 2 : 0)) % CROP_ROWS.length]]);
  }
  return cells;
}

export function villageStreet(plot, x, z) {
  const { cx, cz, dx, dz, settlement: s } = plot;
  const has = (a, b) => s.plots.has((cx + a) + "," + (cz + b));
  const mainRow = dz === 0, mainCol = dx === 0;
  const west = has(-1,0) || mainRow && cx === s.minX;
  const east = has(1,0) || mainRow && cx === s.maxX;
  const north = has(0,-1) || mainCol && cz === s.minZ;
  const south = has(0,1) || mainCol && cz === s.maxZ;
  const rowBend = !mainRow && (cx + cz & 1) && x >= 6 && x <= 11;
  const alleyBend = !mainCol && (cx - cz & 1) && z >= 4 && z <= 8;
  const across = z >= (mainRow || rowBend ? 12 : 13) && z <= (rowBend ? 13 : 14) && x >= (west ? 0 : 1) &&
    x <= (east ? 15 : 13);
  const along = x >= (alleyBend ? 2 : 1) && x <= (mainCol || alleyBend ? 3 : 2) &&
    z >= (north ? 0 : 1) && z <= (south ? 15 : 14) &&
    (north || z >= 9);
  return across || along;
}

export function buildGrandVillage(data, plot, cols, seed, addContents) {
  const { cx, cz, y: ground, biome, settlement: group } = plot;
  const x0 = cx * CHUNK, z0 = cz * CHUNK, style = STYLES[biome];
  const { stone, worn, log, leaf, deck, step } = style;
  const fixtures = group.generation>=GRAND_CAPITAL_GEN && {
    sandy: [B.SANDSTONE_WALL,B.SANDSTONE_SLAB,B.SANDSTONE_STAIRS],
    mountain: [B.STONE_BRICK_WALL,B.STONE_BRICK_SLAB,B.STONE_BRICK_STAIRS],
    birch: [B.BIRCH_FENCE,B.BIRCH_SLAB,B.BIRCH_STAIRS],
    taiga: [B.COBBLE_WALL,B.SPRUCE_SLAB,B.SPRUCE_STAIRS],
    forest: [B.MOSSY_WALL,B.SPRUCE_SLAB,B.SPRUCE_STAIRS],
    cherry: [B.BIRCH_FENCE,B.CHERRY_SLAB,B.CHERRY_STAIRS],
    savanna: [B.COBBLE_WALL,B.ACACIA_SLAB,B.ACACIA_STAIRS],
    wetland: [B.MOSSY_WALL,B.MANGROVE_SLAB,B.MANGROVE_STAIRS],
    jungle: [B.MOSSY_WALL,B.JUNGLE_SLAB,B.JUNGLE_STAIRS]
  }[biome];
  const [post,cap,seat]=fixtures||[B.OAK_FENCE,B.OAK_SLAB,B.OAK_STAIRS];
  const index = (x, y, z) => x + z * CHUNK + y * CHUNK * CHUNK;
  const put = (x, y, z, value) => {
    if (x >= 0 && x < CHUNK && z >= 0 && z < CHUNK && y > 0 && y < HEIGHT) data[index(x,y,z)] = value;
  };
  const fill = (x1,y1,z1,x2,y2,z2,v) => {
    for (let x=x1; x<=x2; x++) for (let z=z1; z<=z2; z++) for (let y=y1; y<=y2; y++) put(x,y,z,v);
  };
  const at = (x,y,z,v) => put(x,ground+y,z,v);
  const box = (x1,y1,z1,x2,y2,z2,v) => fill(x1,ground+y1,z1,x2,ground+y2,z2,v);
  const rock = (x,z) => hash3(seed,x0+x,2227,z0+z) < .26 ? worn : stone;
  const height = (x,z) => cols[x+z*CHUNK].h;
  const grade = (x,z) => villageRoadY(group,x0+x,z0+z);
  const bridge = (x,z) => height(x,z) < SEA;
  const clear = (x,z,level,roof) => {
    const natural = height(x,z);
    fill(x,level+1,z,x,Math.max(natural+9,level+roof),z,B.AIR);
  };
  const foundation = (x,z,y,material,dense = true) => {
    const h = height(x,z);
    if (dense || (x+z)%4 === 0) fill(x,h+1,z,x,y-1,z,dense ? rock(x,z) : log);
    put(x,y,z,material);
  };
  const lamp = (x,z,y = ground) => {
    put(x,y,z,rock(x,z));
    fill(x,y+1,z,x,y+3,z,post);
    put(x,y+3,z+1,cap);
    put(x,y+2,z+1,make(B.LANTERN,1));
  };
  const paving = (x,z) => biome === "sandy" ? rock(x,z) :
    plot.dx === 0 || plot.dz === 0 ? rock(x,z) : (x+z)%3 === 0 ? B.GRAVEL : B.DIRT;
  const road = (x,z) => villageStreet(plot,x,z);
  const connectedRoad = (x,z) => {
    const dx = Math.floor(x / CHUNK), dz = Math.floor(z / CHUNK);
    const neighbor = dx || dz ? group.plots.get((cx+dx) + "," + (cz+dz)) : plot;
    return !!neighbor && villageStreet(neighbor, x - dx*CHUNK, z - dz*CHUNK);
  };
  const doorstep = plot.building ? Math.floor(plot.entry[0]) - x0 : plot.type === "farm" ? 4 : 8;
  for (let z=0;z<CHUNK;z++) for (let x=0;x<CHUNK;x++) {
    if (road(x,z)) {
      const y = grade(x,z);
      clear(x,z,y,4);
      const wet = bridge(x,z);
      foundation(x,z,y, wet ? deck : paving(x,z), !wet);
      const edge = DIRS.findIndex(([dx,dz]) => connectedRoad(x-dx,z-dz) && grade(x-dx,z-dz) < y);
      if (edge >= 0) put(x,y,z,make(wet ? B.OAK_STAIRS : step,edge));
    } else if (x>=4 && x<=14 && z>=1 && z<=11) {
      clear(x,z,ground,plot.building ? 18 : 9);
      const edge = x === 4 || x === 14 || z === 1;
      foundation(x,z,ground,edge && height(x,z)<ground ? rock(x,z) : style.ground);
    } else if (z === 12 && x >= 4 && x <= 14) {
      const y = grade(x,z);
      clear(x,z,y,4);
      foundation(x,z,y,Math.abs(x-doorstep) <= 1 ? paving(x,z) : style.ground);
    }
  }
  if (group.kind !== "fortified") for (let z=2;z<=9;z++) {
    if (road(1,z) && height(0,z) < SEA && bridge(1,z)) {
      const y = grade(1,z);
      foundation(0,z,y,deck,false);
      put(0,y+1,z,B.OAK_FENCE);
    }
  }
  const bench = (x,z) => at(x,1,z,make(seat,2));
  const bush = (x,z,flower) => {
    at(x,0,z,biome === "sandy" ? B.SAND : B.GRASS);
    at(x,1,z,biome === "sandy" ? B.DEAD_BUSH : flower);
  };
  const tree = (x,z) => {
    box(x,1,z,x,4,z,log);
    const value=make(leaf,LEAF_PERSIST);
    for (let dx=-2; dx<=2; dx++) for (let dz=-2;dz<=2;dz++) {
      if (Math.abs(dx)+Math.abs(dz)<4 && (dx || dz)) at(x+dx,3,z+dz,value);
      if (Math.abs(dx)+Math.abs(dz)<3 && (dx || dz)) at(x+dx,4,z+dz,value);
    }
    at(x,5,z,value);
  };
  if (plot.building) {
    const front = 2 + plot.building.depth - 1;
    box(doorstep-1,0,front+1,doorstep+1,0,11,stone);
    buildVillageBuilding(plot.building, {
      put: (x,y,z,v) => at(x+5,y,z+2,v),
      decorate: (x,y,z,v,c) => addContents?.(x0+x+5,ground+y,z0+z+2,v,c),
      biome, seed, x:x0+5,z:z0+2, jobBlock:plot.jobBlock, profession:plot.prof
    });
    if (plot.kind === "windmill") {
      const x=10, z=front+1;
      box(x-1,3,5,x+1,13,7,stone);
      box(x-2,11,4,x+2,11,8,deck);
      box(x-1,12,5,x+1,14,7,B.ROOF_TILES);
      box(x,9,8,x,9,z,log);
      for (let a=-3;a<=3;a++) {
        at(x+a,9,z,log); at(x,9+a,z,log);
        if (!a) continue;
        at(x+a,9+(a<0?-1:1),z,B.WOOL);
        at(x+(a<0?1:-1),9+a,z,B.WOOL);
      }
      at(x,9,z+1,B.IRON_BLOCK);
    } else if (plot.type === "market") {
      for (const x of [5,13]) {
        at(x,1,11,B.BARREL);
        at(x,2,11,B.LANTERN);
      }
    }
  } else if (plot.type === "farm") {
    box(5,-1,1,13,-1,10,stone);
    for (let z=1;z<=10;z++) for (let x=5;x<=13;x++) {
      const water=x===CHANNEL && z>=2 && z<=9;
      at(x,0,z,water ? B.WATER : paving(x,z));
      if (water && z===5) at(x,1,z,B.OAK_SLAB);
    }
    for (const [x,z,crop] of villageCropCells(plot)) {
      at(x,0,z,make(B.FARMLAND,WET));
      at(x,1,z,make(crop,4+(x+z)%4));
    }
    at(4,1,9,B.COMPOSTER);
    at(13,1,10,B.BARREL);
    at(12,1,10,B.HAY);
    // A parked farm cart with wood axles and an open bed.
    at(11,1,11,make(log,LOG_ALONG_X)); at(13,1,11,make(log,LOG_ALONG_X));
    at(12,1,11,B.OAK_SLAB);
    at(12,2,11,B.LANTERN);
  } else if (plot.type === "plaza") {
    box(4,0,1,14,0,11,stone);
    box(6,-1,3,10,-1,7,stone);
    for(let x=6;x<=10;x++) for(let z=3;z<=7;z++) {
      const edge=x===6||x===10||z===3||z===7;
      at(x,0,z,edge ? worn : B.WATER);
      if(edge) at(x,1,z,B.STONE_BRICK_SLAB);
    }
    box(8,1,5,8,4,5,stone);
    at(8,5,5,B.BELL);
    for (const x of [5,11]) for (const z of [2,8]) box(x,1,z,x,4,z,log);
    for(let x=4;x<=12;x++) {
      const rise=Math.min(x-4,12-x);
      box(x,5+rise,1,x,5+rise,9,rise===4?B.BRICK_SLAB:make(B.BRICK_STAIRS,x<8?1:3));
    }
    for (const z of [2,7]) {
      box(12,1,z,12,3,z,B.OAK_FENCE);
      box(14,1,z,14,3,z,B.OAK_FENCE);
      at(13,1,z,B.TABLE);
      for (let x=12;x<=14;x++) for(let zz=z-1;zz<=z+1;zz++) at(x,4,zz,x%2?B.CRIMSON_PLANKS:B.WOOL);
    }
    for (const x of [6,8,10]) bench(x,10);
  } else if (plot.type === "pen") {
    for (const x of [5,13]) for(let z=2;z<=10;z++) at(x,1,z,B.OAK_FENCE);
    for (const z of [2,10]) for(let x=6;x<=12;x++) at(x,1,z,B.OAK_FENCE);
    at(9,1,10,make(B.OAK_GATE,0));
    box(6,1,3,6,2,4,B.HAY);
    at(12,1,8,B.BARREL);
    at(12,1,9,B.CAULDRON);
  } else if (plot.type === "orchard") {
    for (const x of [6,12]) for (const z of [3,8]) tree(x,z);
    for (let z=1;z<=11;z++) at(9,0,z,B.GRAVEL);
    bench(10,10);
    lamp(5,10);
  } else if (plot.type === "garden") {
    box(5,0,2,13,0,10,stone);
    box(7,-1,4,11,-1,7,stone);
    box(8,0,5,10,0,6,B.WATER);
    at(9,1,6,stone); at(9,2,6,B.LANTERN);
    for(const x of [5,13]) for(let z=3;z<=9;z++) {
      bush(x,z,z%2?B.FLOWER_RED:B.FLOWER_YELLOW);
      if(z%3===0) at(x,1,z,make(leaf,LEAF_PERSIST));
    }
    for (const x of [7,11]) bench(x,9);
    lamp(5,10);
  } else {
    // The trade-funded construction projects retain a public greenspace of their own.
    for(let x=4;x<=13;x++) at(x,0,8,B.GRAVEL);
    for(const x of [4,12,13]) bush(x,5,B.FLOWER_YELLOW);
    bench(12,10);
  }
  if ((plot.dz === 0 || plot.dx === 0) && plot.type !== "farm") lamp(4,10);
  // House and field entrances join the graded local road through a short paved apron.
  if (plot.entry || plot.type === "farm") for (let x=doorstep-1;x<=doorstep+1;x++) {
    const entryY=grade(x,12);
    if (entryY > ground && !road(x,12)) put(x,entryY,12,make(step,0));
    else if (entryY < ground) put(x,ground,11,make(step,2));
  }
  if (group.kind === "fortified") buildDefenses(plot, { rock, grade, put, fill, foundation, clear });
}

function buildDefenses(p, { rock, grade, put, fill, foundation, clear }) {
  const s=p.settlement;
  function wall(x,z,gate,tower) {
    const y=grade(x,z), block=rock(x,z);
    foundation(x,z,y,block);
    if (gate) clear(x,z,y,3);
    else fill(x,y+1,z,x,y+(tower?8:5),z,block);
    if(gate) fill(x,y+4,z,x,y+6,z,block);
    const top=y+(gate?7:tower?9:6);
    if ((x+z)%2===0 || tower) put(x,top,z,B.STONE_BRICKS);
    if (tower && (x+z)%3===0) put(x,top+1,z,B.BRAZIER);
  }
  for(let k=0;k<CHUNK;k++) {
    if(p.cx===s.minX) wall(0,k,p.dz===0&&k>=12&&k<=14,p.dz===0&&[10,11,15].includes(k));
    if(p.cx===s.maxX) wall(15,k,p.dz===0&&k>=12&&k<=14,p.dz===0&&[10,11,15].includes(k));
    if(p.cz===s.minZ) wall(k,0,p.dx===0&&k>=1&&k<=3,p.dx===0&&[0,4,5].includes(k));
    if(p.cz===s.maxZ) wall(k,15,p.dx===0&&k>=1&&k<=3,p.dx===0&&[0,4,5].includes(k));
  }
  for (const [side, active] of [["w",p.cx===s.minX&&p.dz===0],["e",p.cx===s.maxX&&p.dz===0],
    ["n",p.cz===s.minZ&&p.dx===0],["s",p.cz===s.maxZ&&p.dx===0]]) {
    if (!active) continue;
    const transform = (a,b) => side==="w" ? [a,13+b] : side==="e" ? [15-a,13+b] :
      side==="n" ? [2+b,a] : [2+b,15-a];
    for(let a=0;a<=3;a++) for(let b=-2;b<=2;b++) {
      const [x,z]=transform(a,b), y=grade(x,z);
      fill(x,y+4,z,x,y+5,z,rock(x,z));
      if(a===0||a===3||Math.abs(b)===2) {
        put(x,y+6,z,B.STONE_BRICKS);
        if((a+b)%2===0) put(x,y+7,z,B.STONE_BRICKS);
      }
      if(a===2&&b===0) put(x,y+3,z,make(B.LANTERN,1));
    }
  }
  if ((p.cx===s.minX || p.cx===s.maxX) && (p.cz===s.minZ || p.cz===s.maxZ)) {
    const cornerX=p.cx===s.minX?0:15, cornerZ=p.cz===s.minZ?0:15;
    const xm=cornerX===0?1:-1, zm=cornerZ===0?1:-1;
    const y=grade(cornerX,cornerZ);
    // The ground-level apron remains open toward the adjacent two roads.
    for(let a=0;a<=3;a++) for(let b=0;b<=3;b++) {
      const x=cornerX+a*xm, z=cornerZ+b*zm;
      if (a===0 || b===0) fill(x,y+5,z,x,y+9,z,B.STONE_BRICKS);
      else if (a===3 || b===3) fill(x,y+5,z,x,y+9,z,B.STONE_BRICKS);
      put(x,y+10,z,B.DARKSLATE_BRICKS);
      if((a===0||a===3||b===0||b===3) && (a+b)%2===0) put(x,y+11,z,B.STONE_BRICKS);
    }
    put(cornerX+xm,y+11,cornerZ+zm,B.BRAZIER);
  }
}
