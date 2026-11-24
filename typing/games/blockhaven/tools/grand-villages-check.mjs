import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { B, CHUNK, HEIGHT, OPEN, WET, SOLID, idOf, metaOf, isCrop, isDoor, isStairs } from "../js/blocks.js";
import { Entities, SPECIES } from "../js/entities.js";
import { buildChunk } from "../js/mesher.js";
import { CURRENT_GEN, Generator, idx } from "../js/worldgen.js";
import { villageCropCells, villageStreet } from "../js/grand-village-build.js";
import { GRAND_VILLAGE_GEN, SETTLEMENT_CLASSES, reserveSurveyedVillages, restoreVillageRecords, villageRoadY } from "../js/grand-villages.js";
import { prepareStonehaven } from "../js/stonehaven.js";
import { Saves, SAVE_VERSION } from "../js/save.js";
import { World } from "../js/world.js";

const key = (x,z) => x + "," + z;
const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
const passable = v => !SOLID[idOf(v)] || isDoor(idOf(v)) && Boolean(metaOf(v) & OPEN);
const seeds = ["Grand Village Benchmark","Stonehaven Architecture","Riverbend"];
const examples = new Map(), observed = new Map(), biomeExamples = new Map();
assert.ok(CURRENT_GEN >= GRAND_VILLAGE_GEN);
for (const seed of seeds) {
  const gen = new Generator(seed);
  for (let rz=-8;rz<=8;rz++) for (let rx=-8;rx<=8;rx++) {
    const p = gen.villagePiece(rx*10+4,rz*10+4);
    if (!p) continue;
    const g = p.settlement;
    const kind = g.kind;
    const metric = observed.get(kind) || { n:0, minLots: Infinity, maxLots:0, minBuildings:Infinity, maxBuildings:0 };
    metric.n++;
    metric.minLots = Math.min(metric.minLots, g.plots.size);
    metric.maxLots = Math.max(metric.maxLots, g.plots.size);
    metric.minBuildings = Math.min(metric.minBuildings, g.buildings);
    metric.maxBuildings = Math.max(metric.maxBuildings, g.buildings);
    observed.set(kind, metric);
    assert.ok(g.plots.size >= 18 && g.buildings >= Math.max(12, SETTLEMENT_CLASSES[kind].homes));
    assert.equal(g.plots.get(g.id).type,"plaza");
    if (!examples.has(kind) || seed === seeds[0] && Math.hypot(...g.center) < Math.hypot(...examples.get(kind).g.center)) examples.set(kind,{seed,g});
    if (!biomeExamples.has(g.biome)) biomeExamples.set(g.biome,{seed,g});
  }
}
assert.equal(examples.size,3);
assert.equal(biomeExamples.size,10);

function roadProof(world,g) {
  const roads = new Map(), buildingDoor = [];
  const traversable = (x,y,z) => passable(world.get(x,y+1,z)) && passable(world.get(x,y+2,z)) && SOLID[world.id(x,y,z)];
  let steps=0, bridges=0, cropTiles=0, cropKinds=new Set(), population=0;
  for (const p of g.plots.values()) {
    const c=world.load(p.cx,p.cz);
    const wx=p.cx*CHUNK, wz=p.cz*CHUNK;
    const spawned = [];
    Entities.prototype.populate.call({ world, leaveHive() {}, add(sp,...args) { spawned.push([sp,...args]); return {}; } },c);
    for (const [sp] of spawned) assert.ok(SPECIES[sp], sp);
    population += spawned.filter(([sp]) => SPECIES[sp]?.villager || sp === "golem").length;
    for (let z=0;z<CHUNK;z++) for (let x=0;x<CHUNK;x++) {
      if (!villageStreet(p,x,z)) continue;
      const a=wx+x, b=wz+z, y=villageRoadY(g,a,b);
      const value=world.get(a,y,b);
      if (isStairs(idOf(value))) steps++;
      if (world.gen.column(a,b).h < 30 && [B.PLANKS,B.BIRCH_PLANKS,B.SPRUCE_PLANKS,B.OAK_STAIRS,B.ACACIA_PLANKS,B.CHERRY_PLANKS,B.JUNGLE_PLANKS,B.MANGROVE_PLANKS].includes(idOf(value))) bridges++;
      if (traversable(a,y,b)) roads.set(key(a,b),[a,y,b]);
    }
    if (p.building) {
      const [x,y,z]=p.entry.map(Math.floor);
      assert.equal(world.id(x,y,z), B.DOOR, p.kind+" at "+p.cx+","+p.cz);
      assert.ok(passable(world.get(x,y,z)) && passable(world.get(x,y+1,z)));
      assert.equal(world.id(...p.job),p.jobBlock);
      buildingDoor.push([x,y,z,p.kind]);
    }
    if (p.type==="farm") for (const [x,z,crop] of villageCropCells(p)) {
      const soil=world.get(wx+x,p.y,wz+z);
      assert.equal(idOf(soil),B.FARMLAND);
      assert.ok(metaOf(soil)&WET);
      assert.ok(isCrop(crop));
      assert.equal(world.id(wx+x,p.y+1,wz+z),crop);
      assert.ok(world.crops.has([wx+x,p.y+1,wz+z].join(",")));
      const waterX=9;
      assert.ok(Math.abs(x-waterX)<=4 && world.id(wx+waterX,p.y,wz+z) === B.WATER);
      cropTiles++; cropKinds.add(crop);
    }
    if(p.stock) assert.ok(spawned.some(([sp])=>sp===p.stock[0]));
  }
  const market = world.settlements.get(g.id);
  const start = key(Math.floor(market.x),Math.floor(market.z));
  assert.ok(roads.has(start), "walkable map arrival");
  const queue=[roads.get(start)], seen=new Set([start]);
  for(let i=0;i<queue.length;i++) for(const [dx,dz] of dirs) {
    const [x,y,z]=queue[i], id=key(x+dx,z+dz), next=roads.get(id);
    if (next && !seen.has(id) && Math.abs(next[1]-y)<=1) { seen.add(id);queue.push(next); }
  }
  for (const [x,y,z,name] of buildingDoor) {
    let previous=y-1, joins=false;
    for(let j=z+1;j<=z+5;j++) {
      if (seen.has(key(x,j))) {
        joins=Math.abs(roads.get(key(x,j))[1]-previous)<=1;
        break;
      }
      const at=[previous,previous-1,previous+1].find(h=>traversable(x,h,j));
      if(at===undefined) break;
      previous=at;
    }
    assert.ok(joins,"door joins connected roads "+name+" "+x+","+y+","+z);
  }
  assert.equal(cropKinds.size,4);
  assert.ok(population>=g.buildings);
  if (g.kind === "fortified") {
    const z = g.vz * CHUNK + 13, x = g.minX * CHUNK;
    const y = villageRoadY(g,x,z);
    assert.equal(world.id(x,y+1,z),B.AIR,"gate stays open");
    assert.ok(SOLID[world.id(x,y+4,z)],"gate has an overhead lintel");
    assert.ok(SOLID[world.id(x,villageRoadY(g,x,z-3)+3,z-3)],"battlement has a solid curtain wall");
  }
  return { steps, bridges, cropTiles, roads: seen.size, population };
}

const stats = [];
for (const [kind, example] of examples) {
  const {seed,g}=example;
  const gen=new Generator(seed), world=new World(gen);
  world.dim="overworld";
  const cloned=gen.villagePiece(g.vx,g.vz).settlement;
  assert.deepEqual([...cloned.plots.keys()],[...g.plots.keys()]);
  const result=roadProof(world,cloned);
  const c=world.load(g.vx,g.vz);
  for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) world.load(c.cx+dx,c.cz+dz);
  const mesh=buildChunk(world,c,true);
  assert.ok(mesh.solid.pos.length && mesh.solid.uv.every(Number.isFinite));
  const initial = [...c.data], before = world.settlements.size;
  world.unload(c);
  assert.deepEqual([...world.load(c.cx,c.cz).data],initial);
  assert.equal(world.settlements.size,before);
  stats.push({kind,seed,biome:g.biome,center:g.center, lots:g.plots.size,buildings:g.buildings, ...result});
}
const {seed,g}=examples.get("village");
const world=new World(new Generator(seed));
world.load(g.vx,g.vz);
const [village]=world.settlements.values();
const save=await Saves.importFile(new Blob([JSON.stringify({ blockhaven:SAVE_VERSION,
  seed,gen:CURRENT_GEN,name:"Grand Village QA",mode:"survival",
  dims:{overworld:{villages:[village],mods:{[g.id]:[[idx(7,61,7),B.COBBLE]]},visited:[g.id]}} })]));
const reopened=await Saves.load(save.id), restored=new World(new Generator(seed,reopened.gen));
restored.settlements=restoreVillageRecords(reopened.dims.overworld.villages);
restored.modsFromJSON(reopened.dims.overworld.mods);
assert.deepEqual(restored.settlements,world.settlements);
assert.equal(restored.load(g.vx,g.vz).data[idx(7,61,7)],B.COBBLE);
assert.deepEqual([...restored.settlements.values()],[village]);
const requests=reserveSurveyedVillages(restored.gen,reopened.dims.overworld,restored.settlements);
assert.equal(new Set(requests.visited).size,g.spec.size ** 2);
assert.equal(restored.gen.villagePiece(g.vx,g.vz).settlement.kind,g.kind);
const legacyExport = await readFile(new URL("./fixtures/ea1-public-world.json", import.meta.url), "utf8")
  .catch(error => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
if (legacyExport !== null) {
  const legacyFixture = JSON.parse(legacyExport);
  const oldExport = await Saves.importFile(new Blob([legacyExport]));
  assert.equal((await Saves.load(oldExport.id)).gen, legacyFixture.gen || 1);
}

const reserved=new Generator(seed);
reserved.stamps=[{x:g.minX*CHUNK,z:g.minZ*CHUNK,size:g.spec.size*CHUNK}];
for(const p of g.plots.values()) assert.equal(reserved.villagePiece(p.cx,p.cz),null,"reserved square has priority");

const old = new Generator("Stonehaven Architecture",21), fresh=new Generator("Stonehaven Architecture",22);
const story21={},story22={};
prepareStonehaven(old,{},story21);
prepareStonehaven(fresh,{},story22);
assert.deepEqual(story21,story22);
assert.deepEqual(old.stamps[0].cells,fresh.stamps[0].cells);
for(let z=fresh.stonehavenSite.z / CHUNK;z<(fresh.stonehavenSite.z+112)/CHUNK;z++) {
  for (let x=fresh.stonehavenSite.x/CHUNK;x<(fresh.stonehavenSite.x+112)/CHUNK;x++) {
    assert.equal(fresh.villagePiece(x,z),null);
  }
}
const coverage=[];
for (const {g,seed} of biomeExamples.values()) {
  const w=new World(new Generator(seed)); w.dim="overworld";
  const t=performance.now();
  const result=roadProof(w,w.gen.villagePiece(g.vx,g.vz).settlement);
  coverage.push({biome:g.biome,terrainRange:Math.max(...g.levels)-Math.min(...g.levels),steps:result.steps,
    buildingChecks:g.buildings,ms:Math.round(performance.now()-t)});
}
console.log(JSON.stringify({coverage,observed:Object.fromEntries(observed), benchmarks:stats, biomes:[...biomeExamples.keys()].sort()},null,2));
