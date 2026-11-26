// Bounded, seeded structure stamps for the existing Forsaken dimension.
import { B, I, CHUNK, HEIGHT, make, idOf, metaOf, isStairs, LOG_ALONG_X, LOG_ALONG_Z } from "./blocks.js";
import { hash3 } from "./noise.js";
import { fitVillageBuilding, buildVillageBuilding } from "./village-architecture.js";
import { protectedGatewayChunks } from "./forsaken-gateway.js";

export const FALLEN_LAYOUT = 1;
export const LAIRS = {
  crypt: { name: "Mutant Zombie Crypt", mutant: "groaner", key: "CRYPT_KEY", trophy: "CRYPT_TROPHY", biome: "wastelands", r: 20, depth: 12, nodes: 3,
    lore: "The gravediggers hid the Crypt Key below the burial court. Extinguish the three green seals around the vault. The Groaner has risen once before. When it falls, stay close enough to finish it." },
  bastion: { name: "Mutant Skeleton Bastion", mutant: "rattler", key: "BONE_KEY", trophy: "BASTION_TROPHY", biome: "kingdom", r: 19, depth: 0, nodes: 0,
    lore: "Follow the rampart to the Bone Key. Take cover behind the divided pillars or go through the side barracks. Move on the Rattler's reload." },
  crater: { name: "Mutant Creeper Crater", mutant: "hisser", key: "BLAST_KEY", trophy: "CRATER_TROPHY", biome: "wastelands", r: 20, depth: 7, nodes: 0,
    lore: "The Blast Key lies at the heart of the impact. Descend by the rim steps. Fissures mark the unstable outer ground. If the guardian flashes after falling, back up the broad causeway." },
  nest: { name: "Mutant Spider Nest", mutant: "skitter", key: "WEB_KEY", trophy: "NEST_TROPHY", biome: "caverns", r: 18, depth: 12, nodes: 3,
    lore: "Wooden walkways connect the ledges. The stairs reach the same chamber by the floor. Break the three warded egg sacs, then defeat the Skitter for the Web Key." },
  shrine: { name: "Mutant Enderman Shrine", mutant: "voidwalker", key: "VOID_KEY", trophy: "SHRINE_TROPHY", biome: "shattered", r: 16, depth: 0, nodes: 3,
    lore: "Keep to the fenced causeway across the islands. Align the three violet crystals before challenging the Voidwalker. Watch the sparks for the real guardian. The Void Key is kept by the shrine seal." },
};
const DISTRICTS = {
  market: { name: "Ashmarket", biome: "kingdom", r: 22, lore: "The road once ran between the baker and the smith. The quartermaster sent the Bone Key to the Bastion. The market records name the other four keepers." },
  hamlet: { name: "Briarstead", biome: "kingdom", r: 17, lore: "The fields went grey before the wells stopped. The innkeeper carried his ledger downstairs and never came back." },
  keep: { name: "Cinderwatch Keep", biome: "kingdom", r: 16, lore: "The watch could see the road to the Vale from here. Five trails leave the old market; the sixth belongs to the King. The lower store is still sheltered." },
  watch: { name: "Briarwatch Waystation", biome: "woods", r: 16, lore: "The watch kept a spare lantern for travellers. We marked the routes to the Crypt, Crater, Nest and Shrine before the woods fell silent." },
};
export const FALLEN_SITES = { ...LAIRS, ...DISTRICTS };
const ROOT_EDGE = 128, MAP_EDGE = 384;
const WHOLE_CHUNK = CHUNK * CHUNK;
const chunk = v => Math.floor(v / CHUNK);
const key = (x, z) => x + "," + z;
const pointKey = ({ x, y, z }) => [x, y, z].join(",");
const between = (v, low, high) => v >= low && v <= high;
const sizeOf = p => FALLEN_SITES[p.id].r;
const overlap = (a, ar, b, br) => Math.abs(a.x - b.x) <= ar + br && Math.abs(a.z - b.z) <= ar + br;
const rotate = (x, z, t) => t === 1 ? [z, -x] : t === 2 ? [-x, -z] : t === 3 ? [-z, x] : [x, z];

function point(site, x, y, z) {
  const [dx, dz] = rotate(x, z, site.turn);
  return { x: site.x + dx, y: site.y + y, z: site.z + dz };
}
function radialPoint(anchor, forward, side) {
  const norm = Math.hypot(anchor.x, anchor.z);
  return { x: Math.round(anchor.x + (anchor.x * forward - anchor.z * side) / norm),
    z: Math.round(anchor.z + (anchor.z * forward + anchor.x * side) / norm) };
}

function footprintFree(x, z, radius, terrain, protectedChunks) {
  for (let cx = chunk(x - radius); cx <= chunk(x + radius); cx++) for (let cz = chunk(z - radius); cz <= chunk(z + radius); cz++) {
    if (!terrain.contains(cx, cz) || protectedChunks.has(key(cx, cz))) return false;
  }
  return true;
}

export function planFallen(terrain, saved = {}) {
  const occupied = protectedGatewayChunks(saved);
  const { layout } = terrain, placed = {};
  const desired = { ...layout.lairs,
    market: radialPoint(layout.anchors.kingdom, 10, -34),
    hamlet: radialPoint(layout.anchors.kingdom, -27, 37),
    keep: radialPoint(layout.anchors.kingdom, 50, 12),
    watch: radialPoint(layout.anchors.woods, -17, 21)
  };
  for (const [id, def] of Object.entries(FALLEN_SITES)) {
    const preferred = desired[id], a = layout.anchors[def.biome], r = def.r;
    const candidates = [{ x: preferred.x, z: preferred.z }];
    if (id === "shrine") {
      for (const [x, z, size] of terrain.islands) if (size >= 15) candidates.push({ x: Math.round(x), z: Math.round(z) });
    } else {
      for (let along = -44; along <= 79; along += 14) for (let sideways = -74; sideways <= 74; sideways += 15) {
        candidates.push(radialPoint(a, along, sideways));
      }
    }
    const scored = candidates.map(p => ({ ...p, dist: Math.hypot(p.x - preferred.x, p.z - preferred.z) }))
      .sort((p, q) => p.dist - q.dist || p.x - q.x || p.z - q.z);
    for (const { x, z } of scored) {
      if (Math.max(Math.abs(x), Math.abs(z)) + r + 2 >= MAP_EDGE ||
          Math.max(Math.abs(x), Math.abs(z)) - r < ROOT_EDGE ||
          !footprintFree(x, z, r, terrain, occupied)) continue;
      const probe = { x, z };
      if (overlap(probe, r + 2, layout.fortress, layout.fortress.radius) ||
          layout.sanctuary && overlap(probe, r, layout.sanctuary, 17) ||
          Object.values(placed).some(p => p && overlap(probe, r + 2, p, sizeOf(p)))) continue;
      const center = terrain.sample(x, z);
      if (center.biome.id !== def.biome || center.top < 26 || center.top > HEIGHT - 26) continue;
      const turn = Math.abs(x) >= Math.abs(z) ? (x > 0 ? 3 : 1) : (z > 0 ? 2 : 0);
      const site = { id, x, y: center.top, z, turn };
      const approach = point(site, 0, 0, r + 1);
      const entry = terrain.sample(approach.x, approach.z);
      if (id !== "shrine" && (entry.top < 24 || entry.biome.id !== def.biome || Math.abs(entry.top - center.top) > 8)) continue;
      if (id === "shrine") {
        const access = terrain.sample(approach.x, approach.z);
        if (access.top < 30 || Math.abs(access.top - center.top) > 6) continue;
      }
      placed[id] = site;
      break;
    }
    placed[id] ??= null;
  }
  return { version: FALLEN_LAYOUT, sites: placed };
}

export function validFallen(record, terrain) {
  if (record?.version !== FALLEN_LAYOUT || !record.sites || Array.isArray(record.sites)) return false;
  const previous = [];
  for (const [id, def] of Object.entries(FALLEN_SITES)) {
    const p = record.sites[id];
    if (p === null) continue;
    if (p?.id !== id || ![p.x, p.y, p.z, p.turn].every(Number.isInteger) || !between(p.turn, 0, 3) ||
        Math.max(Math.abs(p.x), Math.abs(p.z)) + def.r + 2 >= MAP_EDGE ||
        !between(p.y, 26, HEIGHT - 26) || !footprintFree(p.x, p.z, def.r, terrain, new Set()) ||
        overlap(p, def.r + 2, terrain.layout.fortress, terrain.layout.fortress.radius) ||
        terrain.layout.sanctuary && overlap(p, def.r, terrain.layout.sanctuary, 17) ||
        terrain.sample(p.x, p.z).biome.id !== def.biome || previous.some(q => overlap(p, def.r + 2, q, sizeOf(q)))) return false;
    previous.push(p);
  }
  return true;
}

const marks = {
  crypt: [[-9, -3], [9, -3], [0, -12]],
  nest: [[-8, 0], [8, 0], [0, -11]],
  shrine: [[-6, -3], [6, -3], [0, -8]],
};
export function fallenPoints(site) {
  const def = FALLEN_SITES[site.id], depth = def.depth || 0;
  return {
    entry: point(site, 0, 1, def.r - 8),
    journal: point(site, -3, 1, def.r - 8),
    arena: point(site, 0, 1 - depth, -6),
    seal: point(site, 3, 1 - depth, -1),
    nodes: (marks[site.id] || []).map(([x, z]) => point(site, x, 1 - depth, z)),
  };
}

export function prepareFallen(terrain, data) {
  data.fallen ??= planFallen(terrain, data);
  if (!validFallen(data.fallen, terrain)) return;
  terrain.fallen = new FallenStructures(terrain, data.fallen);
}

export class FallenStructures {
  constructor(terrain, record) {
    this.terrain = terrain;
    this.sites = Object.fromEntries(Object.keys(FALLEN_SITES).map(id => [id, record.sites[id]]));
    this.cache = new Map();
    this.interactions = new Map();
    for (const site of Object.values(this.sites).filter(Boolean)) {
      const { journal, seal, nodes } = fallenPoints(site);
      this.interactions.set(pointKey(journal), { id: site.id, kind: "journal" });
      if (!LAIRS[site.id]) continue;
      this.interactions.set(pointKey(seal), { id: site.id, kind: "seal" });
      for (let i = 0; i < nodes.length; i++) this.interactions.set(pointKey(nodes[i]), { id: site.id, kind: "node", index: i });
    }
  }

  at(pos) { return this.interactions.get(pointKey(pos)); }

  apply(cx, cz, data, contents) {
    for (const site of Object.values(this.sites)) {
      if (!site) continue;
      const r = sizeOf(site), x = cx * CHUNK, z = cz * CHUNK;
      if (x > site.x + r || x + CHUNK <= site.x - r || z > site.z + r || z + CHUNK <= site.z - r) continue;
      if (!this.cache.has(site.id)) this.cache.set(site.id, buildSite(this.terrain, site));
      const row = this.cache.get(site.id).get(key(cx, cz));
      if (!row) continue;
      for (let i = 0; i < row.cells.length; i += 2) data[row.cells[i]] = row.cells[i + 1];
      if (contents) for (const args of row.contents) contents(...args);
    }
  }
}

function buildSite(terrain, site) {
  const chunks = new Map(), r = sizeOf(site), def = LAIRS[site.id], depth = def?.depth || 0;
  function blockValue(value, t) {
    const id = idOf(value), meta = metaOf(value);
    if ((id === B.DEADWOOD_LOG || id === B.LOG) && t % 2 && (meta & (LOG_ALONG_X | LOG_ALONG_Z))) return make(id, meta ^ (LOG_ALONG_X | LOG_ALONG_Z));
    if (isStairs(id) || [B.DOOR, B.BED, B.ITEM_FRAME, B.PAINTING, B.ARMOR_STAND, B.LADDER, B.FORSAKEN_BANNER,
      B.RED_BANNER, B.OAK_TRAPDOOR, B.FURNACE, B.BLAST_FURNACE, B.SMOKER, B.CHEST].includes(id)) return make(id, (meta & ~3) | ((meta + t) & 3));
    return value;
  }
  const rowAt = (x, z) => {
    const cx = chunk(x), cz = chunk(z), k = key(cx, cz);
    if (!chunks.has(k)) chunks.set(k, { cells: new Map(), contents: [] });
    return { cx, cz, row: chunks.get(k) };
  };
  function put(x, h, z, value, decoration) {
    if (value === undefined || Math.max(Math.abs(x), Math.abs(z)) > r) return;
    const p = point(site, x, h, z);
    if (!between(p.y, 1, HEIGHT - 2)) return;
    const { cx, cz, row } = rowAt(p.x, p.z);
    const index = p.x - cx * CHUNK + (p.z - cz * CHUNK) * CHUNK + p.y * WHOLE_CHUNK;
    const v = blockValue(value, site.turn);
    row.cells.set(index, v);
    if (decoration) row.contents.push([p.x, p.y, p.z, v, decoration]);
  }
  const fill = (x0, y0, z0, x1, y1, z1, v) => {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++)
      put(x, y, z, typeof v === "function" ? v(x, y, z) : v);
  };
  const roll = (x, h, z) => hash3(terrain.seed, site.x + x, h, site.z + z);
  const stone = (x,y,z) => roll(x, 40+y, z) < .23 ? B.FORSAKEN_CRACKED : roll(x, 42+y, z) < .17 ? B.FORSAKEN_MOSSY : B.FORSAKEN_BRICKS;
  const light = (x,y,z, id = B.LANTERN) => put(x,y,z,id);
  const chair = (x,y,z,facing) => put(x,y,z,make(B.FORSAKEN_STAIRS,facing));
  const cache = (x,y,z, supplies) => put(x,y,z,B.BARREL, { type: "chest", slots: Array.from({ length: 27 }, (_, i) =>
    supplies[i] && { id: supplies[i][0], n: supplies[i][1] } || null) });

  const openPlatform = site.id === "shrine";
  const outside = point(site,0,0,r + 1);
  const approachHeight = terrain.sample(outside.x, outside.z).top - site.y;
  for (let z = -r; z <= r; z++) for (let x = -r; x <= r; x++) {
    const edge = Math.max(Math.abs(x), Math.abs(z)), p = point(site,x,0,z);
    const h = terrain.column(p.x,p.z).h - site.y;
    const apron = (edge > r - 5 ? (edge - (r - 5)) / 5 : 0);
    if (openPlatform && (Math.abs(x) > 10 || z < -11) && Math.abs(x) + Math.abs(z) > 23) continue;
    const approach = Math.abs(x) <= 4 && z >= r - 8;
    const top = approach ? Math.round(approachHeight * (z - r + 8) / 8) :
      openPlatform && h < -30 ? 0 : Math.round(h * apron);
    const under = openPlatform ? top - 2 - Math.max(0, 5 - Math.floor(edge / 3)) : Math.min(h, top) - 2;
    for (let y = under; y <= top; y++) put(x,y,z, y === top && Math.abs(x) <= 2 ? B.COBBLE : stone(x,y,z));
    for (let y = top + 1; y <= Math.max(h + 7, top + 6); y++) put(x,y,z,B.AIR);
  }

  function columns(left, right, floor, z0, z1, top, tint = B.FORSAKEN_BRICKS) {
    for (const x of [left,right]) for (let z = z0; z <= z1; z += 5) {
      fill(x-1, floor + 1, z, x+1, floor + 1, z, B.FORSAKEN_CRACKED);
      fill(x, floor + 2, z, x, top - 1, z, tint);
      put(x,top,z,B.FORSAKEN_SLAB);
      light(x + (x < 0 ? 1 : -1),floor+2,z, x < 0 ? B.LANTERN : B.VIOLET_LAMP);
    }
  }
  function arch(z, low, width, height, material = stone) {
    for (let y = 1; y <= height; y++) {
      const inset = y > height - 2 ? y - (height - 2) : 0;
      for (const side of [-1,1]) {
        const x = side * (width - inset);
        put(x,low+y,z,typeof material === "function" ? material(x,y,z) : material);
        put(x+side,low+y,z, B.FORSAKEN_CRACKED);
      }
    }
    fill(-width+2,low+height,z,width-2,low+height,z,B.FORSAKEN_BRICKS);
    put(0,low+height+1,z,B.FORSAKEN_EYE);
  }
  function descend(width, entry, floor, pathMat = B.FORSAKEN_STAIRS) {
    for (let z = entry; z >= entry + floor; z--) {
      const level = z - entry;
      fill(-width, level - 1, z, width, level - 1, z, B.FORSAKEN_STONE);
      for (let x = -width; x <= width; x++) put(x,level,z,make(pathMat,0));
      fill(-width, level + 1, z, width, level + 7, z, B.AIR);
      if (z % 3 === 0) light(width + 1,level+1,z,B.LANTERN);
    }
  }
  function house(kind, variant, x, z, width, length, ruined = 0) {
    const plan = fitVillageBuilding(kind, variant, width,length);
    const decor = [];
    buildVillageBuilding(plan, {
      biome: "forsaken", seed: terrain.seed, x: site.x+x, z:site.z+z,
      put(a,b,c,v) {
        if (ruined && b >= (plan.upper ? 9 : 5) && a >= plan.width-3 && c < 3 && roll(a+x, b, c+z) < ruined) return;
        if (ruined && b === 3 && (a === 0 || a === plan.width - 1) && roll(a+x, 95, c+z) < ruined / 2) return;
        put(x+a,b,z+c,v);
      },
      decorate(a,b,c,v,d) { decor.push([a,b,c,v,d]); },
    });
    for (const [a,b,c,v,d] of decor) put(x+a,b,z+c,v,d);
  }

  switch (site.id) {
  case "crypt": {
    const f = -depth;
    fill(-14,f-1,-15,14,f-1,8,stone);
    fill(-13,f,-14,13,f,7,stone);
    fill(-13,f+1,-14,13,f+8,7,B.AIR);
    for (const x of [-14,14]) fill(x,f,-15,x,f+9,8,stone);
    for (const z of [-15,8]) fill(-14,f,z,14,f+9,z,stone);
    for (let z = -14; z <= 8; z++) for (let x = -13; x <= 13; x++) {
      const top = f+10-Math.floor(Math.abs(x)/4);
      put(x,top,z,stone(x,top,z));
      if (z % 5 === 0) put(x,top-1,z,B.FORSAKEN_CRACKED);
    }
    columns(-6,6,f,-13,6,f+7);
    for (const x of [-10,10]) for (let z=-11;z<=5;z+=4) {
      fill(x-1,f+1,z,x+1,f+1,z+2,B.DEADWOOD_PLANKS);
      fill(x-1,f+2,z,x+1,f+2,z+2,B.FORSAKEN_SLAB);
      put(x,f+1,z-1,B.QUARTZ_BLOCK);
    }
    for (const x of [-11,11]) {
      for (const z of [-6, 2]) {
        fill(x-1,f+5,z,x+1,f+5,z,B.FORSAKEN_SLAB);
        put(x,f+4,z,make(B.PALE_LAMP,1));
        for(let y=f+2;y<=f+4;y++)for(const a of [x-1,x+1])put(a,y,z,B.IRON_BARS);
      }
      for(let z=-13;z<=5;z++)put(x,f,z,z%4===0?B.FORSAKEN_RUNE:B.FORSAKEN_MOSSY);
    }
    for (const x of [-4,4]) for (let z=-12;z<=-5;z++) {
      put(x,f,z,B.LIME_STAINED_GLASS);
      if (z%3===0) put(x,f-1,z,B.SHROOMLIGHT);
    }
    arch(7,f,4,7);
    arch(-10,f,5,8);
    for(const x of [-3,3]) {
      put(x,f+1,-9,B.CRIMSON_LAMP);
      put(x,f+1,1,B.PALE_LAMP);
      put(x,f+6,-14,make(B.FORSAKEN_BANNER,4));
    }
    cache(11,f+1,-12,[[I.BREAD,4],[I.TORCH,8],[I.IRON_INGOT,2]]);
    descend(2,r-8,f);
    arch(r-7,0,3,5);
    break;
  }
  case "bastion": {
    for (let z=-14;z<=12;z++) for (let x=-15;x<=15;x++) {
      const rim = Math.abs(x)===15 || z===-14 || z===12;
      if (!rim || (z===12 && Math.abs(x)<=2)) continue;
      for (let y=1;y<=9;y++) if (!(y>3&&y<7&&(x+z)%5===0)) put(x,y,z,y===8?B.QUARTZ_BLOCK:stone(x,y,z));
      if ((x+z)%2===0) put(x,10,z,B.FORSAKEN_WALL);
    }
    for (const x of [-13,13]) for (const z of [-12,10]) {
      fill(x-2,7,z-2,x+2,7,z+2,B.FORSAKEN_BRICKS);
      for (let y=1;y<=8;y++) put(x, y,z+2, make(B.LADDER,0));
      put(x,9,z,B.CRIMSON_LAMP);
    }
    columns(-6,6,0,-12,7,5,B.QUARTZ_BLOCK);
    for (const side of [-1,1]) for(const z of [-9,-2,5]) {
      const x=side*15;
      fill(x,1,z-1,x,6,z+1,B.FORSAKEN_BRICKS);
      put(x+side,1,z,B.FORSAKEN_CRACKED);
      put(x+side,2,z,make(B.FORSAKEN_STAIRS,side>0?3:1));
      put(x,6,z,B.PALE_LAMP);
    }
    for (const x of [-9,9]) {
      fill(x-3,6,-12,x+3,6,3,B.DEADWOOD_PLANKS);
      for (let z=-12;z<=3;z++) put(x+(x<0?3:-3),7,z,B.FORSAKEN_WALL);
      put(x,1,-2,B.BARREL);
      put(x,1,1,B.BED);
      put(x,1,2,make(B.BED,2|8));
      put(x,2,-6,make(B.TARGET,0));
      put(x,2,-7,make(B.FORSAKEN_BANNER,4));
    }
    arch(12,0,3,8);
    arch(-10,0,5,10);
    fill(-2,0,-9,2,0,10,B.FORSAKEN_RUNE);
    cache(-10,1,-10,[[I.ARROW,12],[I.BREAD,3]]);
    break;
  }
  case "crater": {
    const f=-depth;
    for(let z=-16;z<=16;z++) for(let x=-16;x<=16;x++){
      const d=Math.hypot(x,z+1);
      if(d>17) continue;
      const tier = d < 10 ? f : Math.min(0, f+Math.floor((d-9)/2)*2);
      fill(x,tier+1,z,x,5,z,B.AIR);
      put(x,tier,z,Math.abs(x)<3?B.FORSAKEN_BRICKS:roll(x,34,z)<.48?B.BASALT:B.BLACKSTONE);
      if(d>10&&roll(x,134,z)>.9) put(x,tier+1,z,z%2===0?B.SCARLET_CLUSTER:B.EMERALD_BLOCK);
      if(d>12&&roll(x,140,z)>.89) put(x,tier,z,B.MAGMA);
    }
    descend(3,r-8,f);
    for (const x of [-8,8]) {
      for (let z=-9;z<=4;z+=6) {
        fill(x-1,f+1,z-1,x+1,f+4,z+1,stone);
        light(x,f+5,z,B.CRIMSON_LAMP);
      }
    }
    arch(r-7,0,4,6);
    arch(-12,f+3,4,7);
    cache(-6,f+1,2,[[I.BREAD,3],[I.IRON_INGOT,2]]);
    break;
  }
  case "nest": {
    const f=-depth;
    for(let z=-14;z<=9;z++) for(let x=-14;x<=14;x++){
      if(Math.hypot(x,z+4)>17) continue;
      const top = f+10+Math.floor(roll(x,43,z)*4)-Math.floor(Math.abs(x)/5);
      fill(x,f-1,z,x,f,z,x%4===0?B.FORSAKEN_CRACKED:B.DARKSLATE);
      fill(x,f+1,z,x,top-1,z,B.AIR);
      put(x,top,z,B.DARKSLATE);
      if (Math.abs(x)>9&&roll(x,231,z)>.73) {
        put(x,f+1,z,B.VIOLET_CLUSTER);
        if (z%4===0) put(x,top-1,z,B.CAVE_VINES);
      }
    }
    for(const x of [-9,9]){
      for(let z=-12;z<=6;z++){
        fill(x-1,f+4,z,x+1,f+4,z,B.DEADWOOD_PLANKS);
        if(z!==4) put(x+(x<0?1:-1),f+5,z,B.OAK_FENCE);
        if(z%6===0) light(x,f+5,z,B.VIOLET_LAMP);
      }
      fill(x,f+1,4,x,f+4,4,make(B.LADDER,2));
      fill(x,f+1,5,x,f+3,5,B.DEADWOOD_LOG);
    }
    fill(-9,f+4,-12,9,f+4,-12,B.DEADWOOD_PLANKS);
    fill(-9,f+5,-13,9,f+5,-13,B.OAK_FENCE);
    for (const x of [-11,11]) {
      put(x,f+6,-6,B.LAIR_WEB);
      for (const z of [-12,-7,-2,3]) {
        put(x,f+1,z,B.VIOLET_CLUSTER);
        put(x,f+6,z,B.LAIR_WEB);
        put(x+(x<0?1:-1),f+7,z,B.LAIR_WEB);
      }
    }
    for (const z of [-9, -1]) {
      for (const x of [-7,7]) {
        fill(x, f+6, z, x, f+8, z, B.DEADWOOD_LOG);
        put(x,f+5,z,make(B.VIOLET_LAMP,1));
      }
      fill(-7,f+8,z,7,f+8,z,make(B.DEADWOOD_LOG,LOG_ALONG_X));
    }
    for (let x=-12;x<=12;x+=4) for(let z=-14;z<7;z+=6) {
      if(Math.abs(x)>3) put(x,f+8,z,B.LAIR_WEB);
    }
    descend(2,r-8,f);
    arch(r-7,0,3,5);
    cache(10,f+1,-8,[[I.STRING,6],[I.BREAD,4],[I.TORCH,8]]);
    break;
  }
  case "shrine": {
    const rings = [-8,0,8];
    for (const z of rings) {
      arch(z,0,z===-8?6:4,z===-8?11:8,B.OBSIDIAN);
      for(const x of [-7,7]){
        fill(x,1,z,x,3,z,B.VIOLET_PILLAR);
        put(x,4,z,B.VIOLET_CLUSTER);
        for(let y=7;y<=9;y++) if(roll(x,y,z)>.43) put(x,y,z,B.OBSIDIAN);
      }
    }
    fill(-2,0,-11,2,0,r,B.FORSAKEN_RUNE);
    for(const x of [-4,4]) for(let z=5;z<=r;z++) put(x,1,z,B.FORSAKEN_WALL);
    cache(-7,1,-7,[[I.BREAD,4],[I.GLOW_BERRIES,4]]);
    break;
  }
  case "market":
    house("smithy",0,-16,-15,10,9,.42);
    house("library",2,7,-15,10,9,.37);
    house("inn",1,7,-2,10,9,.31);
    for(let x=-17;x<=17;x++) put(x,0,10,B.COBBLE);
    for(let z=-14;z<=17;z++) {
      fill(-2,0,z,2,0,z,(x,y,z)=>roll(x,103,z)>.82?B.CRACKED_BRICKS:B.COBBLE);
      for(const x of [-3,3]) {
        put(x,0,z,B.FORSAKEN_STONE);
        if(z%5===0){
          put(x,1,z,B.FORSAKEN_WALL);
          if(z>1)light(x,2,z,B.LANTERN);
        }
      }
    }
    for (const x of [-13,-8]) {
      fill(x,3,4,x+3,3,7,x===-13?B.RED_WOOL:B.BLACK_WOOL);
      for(const a of [x,x+3])for(const b of [4,7])fill(a,1,b,a,2,b,B.OAK_FENCE);
      put(x+1,1,5,B.BARREL);
    }
    fill(-12,0,-3,-9,1,0,B.FORSAKEN_CRACKED);
    put(-11,1,-2,B.WATER);
    arch(-16,0,5,8);
    cache(-15,1,12,[[I.BREAD,3],[I.TORCH,8]]);
    break;
  case "hamlet":
    house("farmhouse",3,-12,-9,9,8,.55);
    house("cottage",0,4,-10,8,7,.58);
    house("storehouse",1,5,3,9,8,.47);
    for(let x=-13;x<=-5;x++) for(let z=3;z<=10;z++){
      put(x,0,z,(x+13)%3===0?B.DEADWOOD_PLANKS:B.ASH_SOIL);
      if(roll(x,82,z)>.65)put(x,1,z,B.DEAD_BUSH);
    }
    for (let z=-1;z<=13;z++) fill(-2,0,z,2,0,z,B.COBBLE);
    descend(1,3,-4);
    fill(-3,-5,-5,3,-5,-1,stone);
    fill(-3,-4,-5,3,-1,-2,B.AIR);
    cache(-2,-4,-4,[[I.BREAD,3],[I.COAL,4],[I.TORCH,6]]);
    break;
  case "keep":
    for (let z=-13;z<=6;z++) for(let x=-11;x<=11;x++){
      if(Math.abs(x)<11&&z>-13&&z<6)continue;
      if(z===6&&Math.abs(x)<=2)continue;
      const h=4+Math.floor(roll(x,153,z)*5);
      for(let y=1;y<=h;y++){
        const slit=y===4&&((Math.abs(x)===11&&z%4===0)||(z===6&&x%4===0));
        put(x,y,z,slit?B.IRON_BARS:stone(x,y,z));
      }
      if((x+z)%3===0)put(x,h+1,z,B.FORSAKEN_SLAB);
    }
    for(const side of [-1,1]){
      const x=side*8;
      fill(x-2,5,-11,x+2,5,-7,B.DEADWOOD_PLANKS);
      for(let y=1;y<=5;y++)put(x,y,-7,make(B.LADDER,0));
      fill(x-2,6,-11,x+2,6,-11,B.FORSAKEN_WALL);
      light(x,6,-9,B.LANTERN);
    }
    arch(6,0,3,7);
    put(-6,1,-8,B.WORN_BOOKSHELF);
    put(-5,1,-8,B.WORN_BOOKSHELF);
    put(-6,1,-3,B.TABLE);
    put(-5,1,-3,B.FORSAKEN_STAIRS);
    fill(5,5,-5,10,5,2,B.FORSAKEN_SLAB);
    put(8,1,-3,B.FURNACE);
    put(8,1,-2,B.ANVIL);
    cache(9,1,-2,[[I.BREAD,4],[I.IRON_INGOT,2],[B.TORCH,6]]);
    break;
  case "watch":
    house("cottage",3,-9,-7,9,8,.42);
    house("storehouse",2,4,-8,7,7,.55);
    for(let z=-10;z<=12;z++) put(0,0,z,B.COBBLE);
    fill(4,0,5,8,0,9,stone);
    for (const x of [4,8]) for(const z of [5,9]) fill(x,1,z,x,9,z,B.DEADWOOD_LOG);
    fill(4,7,5,8,7,9,B.DEADWOOD_PLANKS);
    for(let y=1;y<=7;y++) put(4,y,8,make(B.LADDER,1));
    fill(3,10,4,9,10,10,B.FORSAKEN_SLAB);
    light(6,8,7,B.LANTERN);
    cache(-7,1,-5,[[I.BREAD,3],[I.TORCH,6]]);
    for (let dz=9;dz<15;dz++) for(let dx=-12;dx<=-8;dx++){
      if(dz!==12)put(dx,0,dz,Math.abs(dx+10)===2?B.DEADWOOD_LOG:B.DEADWOOD_PLANKS);
      if((dx===-12||dx===-8)&&dz!==12)put(dx,1,dz,B.OAK_FENCE);
    }
    break;
  }

  put(-3,1,r-8,B.NOTE_STAND);
  if (def) {
    put(3,1-depth,-1,B.LAIR_SEAL);
    (marks[site.id] || []).forEach(([x,z], i) => put(x,1-depth,z,make(B.LAIR_NODE, (site.id === "nest" ? 2 : site.id === "shrine" ? 1 : 0) | i << 2)));
    for (const x of [-3,3]) light(x,1,r-9,B.PALE_LAMP);
  }
  for (const row of chunks.values()) {
    const packed = new Uint32Array(row.cells.size * 2);
    let i = 0;
    for (const [index, value] of row.cells) {
      packed[i++] = index;
      packed[i++] = value;
    }
    row.cells = packed;
  }
  return chunks;
}
