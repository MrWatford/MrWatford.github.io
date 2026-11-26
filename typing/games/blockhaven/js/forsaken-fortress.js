// The fortress uses the existing Vale reservation and stamps only its own chunks.
import { B, CHUNK, HEIGHT, make, idOf } from "./blocks.js";
import { protectedGatewayChunks } from "./forsaken-gateway.js";
import { FALLEN_SITES } from "./forsaken-fallen.js";
import { buildFortressRooms } from "./forsaken-fortress-rooms.js";

export const FORTRESS_LAYOUT = 1;
const towers = [[43,27,13,23,6],[41,-17,16,21,6],[23,17,23,32,5],[23,-19,26,37,5]];
const footprints = [[-13,13,36,63], [-52,52,-24,36], [-35,35,-63,-25]];
const chunk = value => Math.floor(value / CHUNK);
const intersects = (ax, bx, az, bz, [x0,x1,z0,z1]) => ax <= x1 && bx >= x0 && az <= z1 && bz >= z0;
const point = (site, [x,y,z]) => ({ x: site.x+x, y: site.y+y, z: site.z+z });
const pointKey = p => [p.x,p.y,p.z].join(",");

const locations = {
  approach: [0,1,60], gate: [0,1,35], plinth: [5,1,39], gateJournal: [-5,1,39],
  court: [0,1,26], hall: [0,1,10], guard: [-14,1,14], barracks: [29,1,0],
  library: [-30,1,0], libraryLoft: [-33,7,-10], libraryJournal: [-28,1,-5],
  archive: [-30,1,-13], hidden: [-30,1,-17], throne: [0,5,-14], throneJournal: [9,1,-17],
  gallery: [16,8,-8], roof: [24,24,16], watch: [43,14,27], garden: [-31,1,24],
  dungeon: [-30,-9,8], prison: [-15,-9,4], lab: [0,-9,7], labJournal: [-3,-9,5],
  vault: [17,-9,6], vaultJournal: [20,-9,8], passage: [31,-9,9],
};
const arenaAnchors = {
  altar:[4,1,-31], cache:[2,2,-58], entrance: [0,1,-29], checkpoint: [0,1,-32], boss: [0,1,-49],
  reward: [0,2,-58], exitPortal: [0,2,-60],
  camera: [0,5,-32], restoreMin: [-33,0,-62], restoreMax: [33,15,-27],
  minions: [[-20,1,-47],[20,1,-47],[-12,1,-54],[12,1,-54]],
  hazards: [[-9,1,-42],[9,1,-42],[-8,1,-51],[8,1,-51]],
};
export const FORTRESS_NOTES = {
  gateJournal: ["The Gatekeeper’s Last Order", "The Crypt, Bastion, Crater, Nest and Shrine each hold one key. Swear the five oaths at the plinth. Follow the paved roads to the guardian sites marked in your journal."],
  libraryJournal: ["Catalogue of the First Stones", "Before the Vale fell, miners brought violet stones to the archive. They held light long after sunset. The keeper moved the surviving papers behind the worn shelf."],
  throneJournal: ["The Last Audience", "The crimson sun stood still while the banners burned. Those who remained heard the Forsaken King summon his court to the arena beyond the northern doors."],
  labJournal: ["Notes from the Lower Workshop", "The violet crystals answer the crimson ones. Where the two lights met, the guardians woke changed. The display tanks hold models recovered from the workshop, and the living guardians were sent to the five outposts."],
  vaultJournal: ["Quartermaster’s Ledger", "Seal the Royal Vault and leave what supplies remain. The side tunnel climbs to the east wing. The convergence chamber beyond the throne is reserved for the King."],
};

export function fortressPoints(site) {
  return Object.fromEntries(Object.entries(locations).map(([id, coord]) => [id, point(site,coord)]));
}

export function fortressWatchPoints(site) {
  return [-1,1].flatMap(side => towers.map(([x,z,height]) => point(site,[x*side,height+1,z])));
}

export function convergencePoints(site) {
  return Object.fromEntries(Object.entries(arenaAnchors).map(([id, coord]) =>
    [id, Array.isArray(coord[0]) ? coord.map(p => point(site,p)) : point(site,coord)]));
}

function fits(terrain, site, occupied, fallen = terrain.fallen?.sites) {
  for (const bounds of footprints) {
    const [x0,x1,z0,z1] = bounds;
    if (Math.max(Math.abs(site.x+x0),Math.abs(site.x+x1),Math.abs(site.z+z0),Math.abs(site.z+z1)) >= 382) return false;
    for (let cx=chunk(site.x+x0); cx<=chunk(site.x+x1); cx++) for (let cz=chunk(site.z+z0); cz<=chunk(site.z+z1); cz++) {
      if (!terrain.contains(cx,cz) || occupied.has(cx+","+cz)) return false;
    }
    for (const dx of [x0,Math.floor((x0+x1)/2),x1]) for (const dz of [z0,Math.floor((z0+z1)/2),z1]) {
      const col = terrain.sample(site.x+dx,site.z+dz);
      if (col.biome.id !== "vale" || col.isolated || Math.abs(col.top-site.y)>2) return false;
    }
    for (const p of [terrain.layout.sanctuary, ...Object.values(fallen || {})].filter(Boolean)) {
      const r = FALLEN_SITES[p.id]?.r ?? 17;
      if (intersects(p.x-site.x-r,p.x-site.x+r,p.z-site.z-r,p.z-site.z+r,bounds)) return false;
    }
  }
  return true;
}

export function validFortress(record, terrain, fallen) {
  if (record?.version !== FORTRESS_LAYOUT || typeof record.gateOpen !== "boolean" ||
      typeof record.archiveOpen !== "boolean" || !Array.isArray(record.notes) ||
      record.notes.length > Object.keys(FORTRESS_NOTES).length || new Set(record.notes).size !== record.notes.length ||
      !record.notes.every(id => Object.hasOwn(FORTRESS_NOTES,id))) return false;
  if (record.site === null) return !record.gateOpen && !record.archiveOpen && !record.notes.length;
  const { x, z, level } = terrain.layout.fortress;
  return record.site?.x === x && record.site?.y === level && record.site?.z === z &&
    fits(terrain,record.site,new Set(),fallen);
}

export function prepareFortress(terrain, data) {
  if (data.fortress === undefined) {
    const { x, z, level } = terrain.layout.fortress;
    const site = { x, y: level, z };
    data.fortress = { version: FORTRESS_LAYOUT, site: fits(terrain,site,protectedGatewayChunks(data)) ? site : null,
      gateOpen: false, archiveOpen: false, notes: [] };
  }
  if (validFortress(data.fortress,terrain) && data.fortress.site) terrain.grandFortress = new Fortress(data.fortress);
}

const arch = (builder, x, z, y, radius, height, thickness=1) => {
  const { box, masonry } = builder;
  for (let dx=-radius-1; dx<=radius+1; dx++) {
    const bend = Math.max(0,Math.abs(dx)-radius+2);
    box(x+dx,x+dx,y+height-bend,y+height-bend+1,z,z+thickness-1,masonry);
    if (Math.abs(dx)>radius) box(x+dx,x+dx,y,y+height-bend,z,z+thickness-1,B.BLACKSTONE_BRICKS);
    else box(x+dx,x+dx,y,y+height-bend-1,z,z+thickness-1,B.AIR);
  }
};

const gateCells = Array.from({ length: 54 }, (_,i) => [i%9-4,1+Math.floor(i/9),35]);
const shelfCells = [[-30,1,-13],[-30,2,-13],[-30,3,-13],[-30,0,-19]];
const openings = {
  gate: { cells: gateCells, open: "gateOpen", closedValue: B.PORTCULLIS },
  archive: { cells: shelfCells, open: "archiveOpen", closedValue: B.FORTRESS_SHELF },
};

export class Fortress {
  constructor(record) {
    this.record = record;
    this.site = record.site;
    this.points = fortressPoints(this.site);
    this.arena = convergencePoints(this.site);
    this.actions = new Map(["plinth","archive",...Object.keys(FORTRESS_NOTES)].map(id => [pointKey(this.points[id]),id]));
  }

  actionAt(pos) {
    const shelf = this.points.archive;
    if (pos.x === shelf.x && pos.z === shelf.z && pos.y >= shelf.y && pos.y <= shelf.y+2) return "archive";
    return this.actions.get(pointKey(pos));
  }

  open(world, id) {
    const { cells, open, closedValue } = openings[id];
    if (this.record[open]) return true;
    const positions = cells.map(p => point(this.site,p));
    if (positions.some(p => !world.isLoaded(p.x,p.z) || ![closedValue,B.AIR].includes(world.id(p.x,p.y,p.z)))) return false;
    this.record[open] = true;
    // Authored cells are passable in future regenerated chunks as well as in the live world.
    for (const p of positions) world.set(p.x,p.y,p.z,B.AIR);
    return true;
  }

  read(id) {
    if (!Object.hasOwn(FORTRESS_NOTES,id)) return;
    if (!this.record.notes.includes(id)) this.record.notes.push(id);
    return FORTRESS_NOTES[id];
  }

  apply(cx, cz, data, contents) {
    const { x, y, z } = this.site, sx = cx*CHUNK-x, sz = cz*CHUNK-z;
    const ex = sx+CHUNK-1, ez = sz+CHUNK-1;
    if (!footprints.some(r => intersects(sx,ex,sz,ez,r))) return;
    const index = (a,b,c) => a-sx+(c-sz)*CHUNK+(b+y)*CHUNK*CHUNK;
    const here = (a,c) => a>=sx && a<=ex && c>=sz && c<=ez;
    const put = (a,b,c,value) => {
      if (here(a,c) && b+y>=0 && b+y<HEIGHT) data[index(a,b,c)] = value;
    };
    const masonry = (a,b,c) => {
      const n = (a*79+c*113+b*41+a*c*13)&63;
      return n < 5 ? B.FORSAKEN_CRACKED : n < 9 ? B.FORSAKEN_MOSSY : n < 15 ? B.FORSAKEN_STONE : B.FORSAKEN_BRICKS;
    };
    const box = (x0,x1,y0,y1,z0,z1,value) => {
      const a0 = Math.max(sx,x0), a1 = Math.min(ex,x1), c0 = Math.max(sz,z0), c1 = Math.min(ez,z1);
      if (a0>a1 || c0>c1) return;
      if (typeof value === "function") {
        for (let b=y0; b<=y1; b++) for (let c=c0; c<=c1; c++) for (let a=a0; a<=a1; a++) data[index(a,b,c)] = value(a,b,c);
      } else {
        for (let b=y0; b<=y1; b++) for (let c=c0; c<=c1; c++) data.fill(value,index(a0,b,c),index(a1,b,c)+1);
      }
    };
    const furnishing = (a,b,c,value,decoration) => {
      put(a,b,c,value);
      if (contents && here(a,c) && idOf(data[index(a,b,c)]) === idOf(value)) contents(x+a,y+b,z+c,value,decoration);
    };
    const radius = (a,c,r,from,to,value,square = false) => {
      for (let az=Math.max(sz,c-r); az<=Math.min(ez,c+r); az++) {
        const width = square ? r : Math.floor(Math.sqrt(r*r-(az-c)**2));
        box(a-width,a+width,from,to,az,az,value);
      }
    };
    const builder = { box, put, masonry, furnishing, radius };
    exterior(builder);
    buildFortressRooms(builder);
    convergence(builder);
    put(4,1,-31,B.CONVERGENCE_ALTAR);
    put(2,2,-58,B.ROYAL_CACHE);
    put(0,2,-60,B.CONVERGENCE_EXIT);
    for (const { cells, open, closedValue } of Object.values(openings)) {
      for (const [a,b,c] of cells) put(a,b,c,this.record[open] ? B.AIR : closedValue);
    }
  }
}

function exterior(b) {
  const { box, put, masonry, radius } = b;
  const dark = B.BLACKSTONE_BRICKS, brick = B.FORSAKEN_BRICKS, trim = B.DARKSLATE_BRICKS;
  // Foundation, lava ravine and a six-wide dry road with defensible bridge piers.
  box(-12,12,-9,11,39,51,B.AIR);
  box(-12,12,-10,-10,39,51,B.BASALT);
  box(-12,12,-8,-8,39,51,B.LAVA);
  box(-12,-12,-9,0,39,51,masonry); box(12,12,-9,0,39,51,masonry);
  for (const z of [39,50]) box(-12,12,-9,-2,z,z,masonry);
  box(-6,6,-1,0,36,58,masonry); box(-4,4,0,0,36,60,dark);
  box(-3,3,1,7,36,63,B.AIR);
  for (const x of [-6,6]) {
    box(x,x,1,1,37,55,B.FORSAKEN_WALL);
    for (const z of [40,48,54]) {
      box(x,x,-10,2,z-1,z+1,masonry);
      put(x,3,z,B.CRIMSON_LAMP);
    }
  }
  for (const x of [-10,10]) for (const z of [41,47,53,59]) {
    box(x,x,0,2,z,z,dark); put(x,3,z,z%3 ? B.CRIMSON_LAMP : B.VIOLET_LAMP);
  }
  put(5,1,39,B.FORTRESS_PLINTH); put(-5,1,39,B.NOTE_STAND);
  // Five visible sockets above the gate, with stone voussoirs and two guard platforms.
  box(-13,13,0,11,31,36,masonry);
  arch(b,0,31,1,4,8,6);
  box(-12,-9,11,12,31,36,dark); box(9,12,11,12,31,36,dark);
  for (let x=-4;x<=4;x+=2) put(x,10,36,make(B.FORSAKEN_EYE,1));
  box(-4,4,14,14,32,35,trim); put(0,15,35,make(B.FORSAKEN_EYE,1));
  // Curtain walks, rhythm of buttresses and the paved inner court.
  box(-44,44,0,0,18,33,masonry);
  box(-43,43,1,8,18,30,B.AIR);
  box(-44,44,0,0,22,29,dark);
  box(-4,4,0,0,18,32,B.FORSAKEN_RUNE);
  for (const side of [-1,1]) {
    const at = (a1,a2,y0,y1,z0,z1,value) => box(Math.min(side*a1,side*a2),Math.max(side*a1,side*a2),y0,y1,z0,z1,value);
    at(13,43,-3,9,32,35,masonry);
    at(44,47,-4,10,-24,34,masonry);
    at(30,47,0,10,-25,-24,masonry);
    at(43,48,9,9,-24,35,dark);
    at(12,45,9,9,31,36,dark);
    for (let z=-22;z<=32;z+=4) {
      at(47,48,10,11,z,z+1,trim);
      if (z%8===2) at(47,49,0,8,z,z+1,brick);
    }
    for (let x=15;x<43;x+=4) {
      at(x,x+1,10,11,35,36,trim);
      if (x%8===3) {
        at(x,x,1,7,36,36,brick);
        put(side*x,6,35,B.FORSAKEN_GLASS);
      }
    }
    for (const [x,z,floor,top,radius] of towers) {
      tower(b,side*x,z,floor,top,radius,(x+side)%4);
    }
    for (const x of [17,28,37]) {
      const px = side*x;
      radius(px,23,3,0,0,B.ASH_SOIL);
      put(px,1,23,B.DEADWOOD_LOG); put(px,2,23,B.DEADWOOD_LOG); put(px,3,23,B.DEADWOOD_LOG);
      put(px,4,23,B.DEADWOOD_LOG);
      radius(px,23,3,4,5,(a,h,z) => (a+h+z)%4===0 ? B.CRIMSON_BRIAR : B.CRIMSON_LEAVES);
      radius(px-1,22,2,6,6,B.CRIMSON_LEAVES);
      put(px+2,1,22,B.VIOLET_CLUSTER); put(px-1,1,25,B.SCARLET_CLUSTER);
    }
    // A shallow dark reflecting trough sits flush with the court walk.
    at(23,37,-1,-1,19,20,B.BLACKSTONE);
    at(24,36,0,0,19,20,B.WATER);
    at(23,37,1,1,20,20,B.FORSAKEN_WALL);
    for (const x of [20,34]) {
      at(x,x+2,1,1,26,26,make(B.DARK_OAK_STAIRS,0));
      put(side*(x+1),0,25,B.FORSAKEN_RUNE);
    }
    for (const x of [11,22,36]) {
      put(side*x,1,30,B.FORSAKEN_WALL); put(side*x,2,30,B.LANTERN);
    }
  }
}

function tower(b,x,z,floor,top,r,style) {
  const { box, put, masonry } = b;
  const trim = B.BLACKSTONE_BRICKS, ring = B.DARKSLATE_BRICKS;
  for (let dz=-r; dz<=r; dz++) {
    const inset = Math.max(0,Math.abs(dz)-r+2);
    box(x-r+inset,x+r-inset,-3,floor+2,z+dz,z+dz,masonry);
    if (Math.abs(dz)<r-1) box(x-r+2,x+r-2,1,floor-1,z+dz,z+dz,B.AIR);
    box(x-r+inset-1,x+r-inset+1,floor,floor,z+dz,z+dz,trim);
  }
  for (const h of [4,10,16,22].filter(h => h<floor-3)) {
    box(x-r,x+r,h,h,z-r+2,z-r+2,ring); box(x-r,x+r,h,h,z+r-2,z+r-2,ring);
    box(x-1,x+1,h+1,h+2,z+r,z+r,B.FORSAKEN_GLASS);
    box(x-1,x+1,h+1,h+2,z-r,z-r,B.FORSAKEN_GLASS);
    put(x,h+2,z+r-1,h%3 ? B.CRIMSON_LAMP : B.VIOLET_LAMP);
  }
  // Side door and ladder shaft leave the rooftop crow's nest accessible.
  const side = Math.sign(x);
  // Curtain towers open to the inner court. Keep towers also connect to the wings.
  const inner = x-r*side, outer = Math.abs(x)>30 ? x+side : x+r*side;
  box(Math.min(inner,outer),Math.max(inner,outer),1,3,z-1,z+1,B.AIR);
  box(x+side,x+side,1,floor+1,z-2,z-2,make(B.LADDER,2));
  box(x+side,x+side,1,floor,z-3,z-3,trim);
  box(x-r+1,x+r-1,floor+1,floor+2,z-r+2,z+r-2,B.AIR);
  for (const dz of [-r+2,r-2]) for (let dx=-r+1;dx<r;dx+=2) put(x+dx,floor+2,z+dz,ring);
  // Open loggias face the Vale from under raised eaves, with a stone sill at every drop.
  const watchTop = Math.abs(x)>30 ? floor+5 : floor+4;
  for (const drift of [-1,1]) {
    box(x-2,x+2,floor+1,floor+1,z+drift*(r-1),z+drift*(r-1),B.FORSAKEN_WALL);
    box(x-2,x+2,floor+2,watchTop-1,z+drift*(r-1),z+drift*(r-1),B.AIR);
    box(x+drift*r,x+drift*r,floor+2,watchTop-1,z-2,z+2,B.AIR);
    box(x+drift*r,x+drift*r,floor+1,floor+1,z-2,z+2,B.FORSAKEN_WALL);
    put(x+drift*(r-2),floor+3,z+2,make(B.LANTERN,1));
  }
  for (const dx of [-r+2,r-2]) for (const dz of [-r+2,r-2]) {
    box(x+dx,x+dx,floor+1,watchTop-1,z+dz,z+dz,masonry);
    put(x+dx,floor+1,z+dz,ring);
    put(x+dx,watchTop-1,z+dz,ring);
  }
  box(x-r+1,x+r-1,watchTop,watchTop,z-r+1,z+r-1,trim);
  // Overhanging eaves taper into alternating steep spires and squat hipped roofs.
  for (let h=watchTop;h<=top;h++) {
    const radius = Math.floor((top-h)*r/(top-watchTop+1));
    for (let dz=-radius;dz<=radius;dz++) {
      const half = radius-Math.max(0,Math.abs(dz)-radius+(style%2 ? 1:2));
      if (half>=0) box(x-half,x+half,h,h,z+dz,z+dz,h%4===0 ? ring : trim);
    }
  }
  put(x,top,z,B.FORSAKEN_WALL); put(x,top+1,z,style%2 ? B.VIOLET_LAMP : B.CRIMSON_LAMP);
}

function convergence(b) {
  const { box, put, masonry, radius } = b;
  const dark = B.BLACKSTONE_BRICKS, runes = B.FORSAKEN_RUNE;
  box(-31,31,1,13,-62,-26,B.AIR);
  box(-31,31,-4,0,-62,-26,masonry);
  for (const [x,z,r] of [[0,-45,15],[0,-45,8],[-21,-47,4],[21,-47,4]]) {
    radius(x,z,r,0,0,(a,_,c) => Math.abs(Math.hypot(a-x,c-z)-r)<1.6 ? runes : (a+c)%5===0 ? B.FORSAKEN_CRACKED : dark);
  }
  box(-2,2,0,0,-59,-25,dark);
  for (const side of [-1,1]) {
    const wallX = side*30;
    box(wallX-1,wallX+1,0,7,-63,-25,masonry);
    for (const z of [-57,-48,-39,-30]) {
      const x=side*28;
      box(x-1,x+1,0,9,z-1,z+1,masonry);
      box(x-2,x+2,8,8,z-2,z+2,dark);
      put(x,10,z,B.VIOLET_LAMP);
      for (let i=0;i<4;i++) {
        box(x,x,5+i,6+i,z+i+1,z+i+1,dark);
        box(x,x,5+i,6+i,z-i-1,z-i-1,dark);
      }
      put(x-side*2,6,z,make(B.FORSAKEN_BANNER,side>0?3:1));
    }
    for (const [x,z] of [[19,-41],[21,-52],[14,-56],[26,-33]]) {
      radius(side*x,z,2,0,0,B.OBSIDIAN);
      put(side*x,1,z,B.VIOLET_CLUSTER); put(side*x,0,z+1,B.VIOLET_LAMP);
    }
    for (const [x,z] of [[9,-42],[8,-51]]) {
      for (let i=-2;i<=2;i++) put(side*x,0,z+i,i%2 ? B.OBSIDIAN : B.FORSAKEN_GLASS);
      put(side*x,0,z,B.CRIMSON_LAMP);
    }
    for (const z of [-36,-50]) {
      box(side*24-1,side*24+1,0,2,z-1,z+1,masonry);
      box(side*24-2,side*24+2,3,3,z,z,dark);
    }
  }
  // Broken colonnade around a monumental eye, facing the throne room.
  box(-31,31,0,6,-63,-63,masonry);
  box(-31,31,0,3,-62,-61,masonry);
  for (const x of [-23,-16,16,23]) {
    arch(b,x,-62,3,2,7);
    put(x,10,-62,B.CRIMSON_LAMP);
  }
  for (const x of [-26,-19,-12,12,19,26]) {
    box(x-1,x+1,0,5+(Math.abs(x)%4),-62,-60,masonry);
    put(x,6+Math.abs(x)%4,-61,B.CRIMSON_LAMP);
  }
  box(-9,9,0,1,-61,-56,dark);
  for (const x of [-10,10]) {
    put(x,1,-55,B.VIOLET_LAMP); put(x,2,-56,B.VIOLET_CLUSTER);
    put(x,1,-56,B.OBSIDIAN);
  }
  arch(b,0,-62,2,7,13,2);
  for (let x=-6;x<=6;x++) {
    const half = 3-Math.floor(Math.abs(x)*0.52);
    box(x,x,9-half,9+half,-61,-61,Math.abs(x)<2 ? make(B.FORSAKEN_EYE,1) : B.FORSAKEN_GLASS);
    put(x,10+half,-61,B.FORSAKEN_RUNE);
    put(x,8-half,-61,B.FORSAKEN_RUNE);
  }
  for (const x of [-21,-12,12,21]) put(x,0,-47,B.VIOLET_LAMP);
  box(-3,3,0,0,-32,-28,runes);
}
