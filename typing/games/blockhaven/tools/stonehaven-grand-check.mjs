import assert from "node:assert/strict";
import { B, CHUNK, HEIGHT, SOLID, isCrop, itemDef } from "../js/blocks.js";
import { Entities, findPath, SPECIES } from "../js/entities.js";
import { buildChunk } from "../js/mesher.js";
import { CURRENT_GEN, Generator } from "../js/worldgen.js";
import { World } from "../js/world.js";
import { prepareStonehaven, stonehavenDestination, stonehavenPlacementData, stonehavenResidents } from "../js/stonehaven.js";
import {
  GRAND_CAPITAL_GEN, GRAND_CAPITAL_SIZE, grandCapitalBlueprint, grandCapitalFestival,
  grandCapitalPlaces, grandCapitalSiege, grandCapitalWorkshop
} from "../js/stonehaven-grand.js";
import { villageBuildingAnchors } from "../js/village-architecture.js";
import { nearestSettlementThreat, settlementChimneys, settlementRoutine, settlementThreatIndex, shelterFromThreat } from "../js/settlement-life.js";
import { initVillageGrowth } from "../js/village-growth.js";
import { initSettlementRaids } from "../js/settlement-raids.js";
import { initSettlementFestivals } from "../js/settlement-festivals.js";
import { SAVE_VERSION, Saves } from "../js/save.js";
import * as THREE from "../lib/three.module.min.js";

const benchmark="Stonehaven Architecture", shoreSeed="Stonehaven Shore 3";
const distance=(a,b)=>Math.abs(a.x-.5-b[0])+Math.abs(a.y-b[1])+Math.abs(a.z-.5-b[2]);
const center=({x,y,z})=>[Math.floor(x),y,Math.floor(z)];
const debug={};
assert.equal(CURRENT_GEN,GRAND_CAPITAL_GEN);
const old=new Generator(benchmark,22), oldStory={};
prepareStonehaven(old,{},oldStory);
assert.equal(oldStory.stonehaven.v,3);
const legacy=old.stamps[0], touched=new Set();
legacy.cells.forEach((v,i)=>{if(v!==65535)touched.add(i%(112*112));});
const nowOld=new Generator(benchmark,CURRENT_GEN);
prepareStonehaven(nowOld,{},JSON.parse(JSON.stringify(oldStory)));
assert.deepEqual(nowOld.stamps[0].cells,legacy.cells);
debug.before={reserved:112**2,developed:touched.size,furnished:8};

function city(seed){
  const gen=new Generator(seed),story={};
  const start=performance.now();
  prepareStonehaven(gen,{},story);
  const planned=performance.now()-start, p=story.stonehaven;
  assert.equal(p.v,4);
  const w=new World(gen);w.dim="overworld";
  const loadStart=performance.now();
  let touched=0,buildings=new Map(),routes=0,crops=0,residents=0,fixtures=0;
  for(let dz=-1;dz<=12;dz++)for(let dx=-1;dx<=12;dx++) {
    const cx=p.x/16+dx,cz=p.z/16+dz,c=w.load(cx,cz);
    if(dx<0||dz<0||dx>=12||dz>=12)continue;
    const mem=new Uint32Array(CHUNK*CHUNK*HEIGHT).fill(0xffffffff);
    gen.grandCapital.apply(gen,mem,cx*16,cz*16);
    const columns=new Set();
    mem.forEach((v,i)=>{if(v!==0xffffffff)columns.add(i%(CHUNK*CHUNK));});
    touched+=columns.size;
    for(const resident of stonehavenResidents(gen,cx,cz)){
      assert.ok(w.id(...center({x:resident.home[0],y:resident.home[1],z:resident.home[2]}))===B.AIR ||
        !SOLID[w.id(Math.floor(resident.home[0]),resident.home[1],Math.floor(resident.home[2]))],JSON.stringify(resident));
      residents++;
    }
    Entities.prototype.populate.call({world:w,add(){return {};},leaveHive(){}},c);
    for(const [x,y,z] of gen.grandCapital.cropChunks.get(c.key)||[]) {
      assert.ok(isCrop(w.id(x,y,z)));assert.equal(w.id(x,y-1,z),B.FARMLAND);crops++;
    }
  }
  assert.equal(w.crops.size,crops);
  const loaded=performance.now()-loadStart;
  assert.ok(touched>=legacy.size**2*2);
  assert.equal(gen.grandCapital.size,GRAND_CAPITAL_SIZE);
  assert.equal(stonehavenPlacementData(gen,{},story).visited.length,144);
  for(const b of grandCapitalBlueprint(gen.seed,p.shore)){
    buildings.set(b.district,(buildings.get(b.district)||0)+1);
    const a=villageBuildingAnchors(b.plan), wx=p.x+b.x,wz=p.z+b.z;
    assert.equal(w.id(wx+a.door[0],p.y+a.door[1],wz+a.door[2]),B.DOOR);
    const end=[wx+a.job[0],p.y+a.job[1],wz+a.job[2]];
    const result=findPath(w,wx+a.home[0],p.y+a.home[1],wz+a.home[2],...end,2,350,true).at(-1);
    assert.ok(result&&distance(result,end)<=1,b.kind+" "+b.x+","+b.z);
    routes++;
  }
  for(const c of w.containers.values())if(c.type==="frame"||c.type==="stand"){
    assert.ok(c.slots.some(s=>s&&itemDef(s.id)));fixtures++;
  }
  assert.ok(fixtures>30);
  const gate=stonehavenDestination({seed,gen:CURRENT_GEN},story), startPos=center(gate);
  assert.ok(!SOLID[w.id(...startPos)]);
  const waypoints=grandCapitalPlaces(p);
  for(const point of waypoints) {
    const end=center(point);
    assert.ok(!SOLID[w.id(...end)],point.title+" has headroom");
    assert.ok(SOLID[w.id(end[0],end[1]-1,end[2])],point.title+" has a solid floor");
    const route=findPath(w,...startPos,...end,2,20000,true).at(-1);
    assert.ok(route&&distance(route,end)<=1,point.title+" reachable from the gate "+JSON.stringify(route));
  }
  const [cx,cz]=[Math.floor(gate.x/16),Math.floor((p.z+151)/16)];
  const meshStart=performance.now(), mesh=buildChunk(w,w.load(cx,cz),true), meshMs=performance.now()-meshStart;
  assert.ok(mesh.solid.pos.length && mesh.solid.uv.every(Number.isFinite));
  assert.ok(w.lightAt(p.x+103,p.y+2,p.z+148)[1]>0);
  debug[seed]={plot:p,landmarks:waypoints.length,developed:touched,furnished:gen.grandCapital.buildings,
    buildings:Object.fromEntries(buildings),residents,crops,fixtures,routes,planMs:+planned.toFixed(1),
    loadingAndAuditMs:+loaded.toFixed(1),marketMeshMs:+meshMs.toFixed(1),marketTriangles:mesh.solid.index.length/3};
  return {gen,story,p,w};
}
const a=city(benchmark), coast=city(shoreSeed);
assert.equal(a.p.shore,null);assert.equal(coast.p.shore,151);
assert.equal(coast.w.id(coast.p.x+187,coast.p.y,coast.p.z+151),B.DARK_OAK_PLANKS);
for(const {p,w} of [a,coast]){
  const y=p.y;
  assert.equal(w.id(p.x+91,y+10,p.z+173),B.LADDER);
  assert.equal(w.id(p.x+93,y+1,p.z+171),B.DOOR);
  assert.equal(w.id(p.x+104,y+1,p.z+176),B.AIR);
  assert.equal(w.id(p.x+104,y+5,p.z+176),B.STONE_BRICKS);
}
const reserved=new Generator(benchmark), reservedStory={};
prepareStonehaven(reserved,{visited:[a.p.x/16+","+a.p.z/16]},reservedStory);
assert.notDeepEqual(reservedStory.stonehaven,a.p);
assert.ok(!reserved.grandCapital || !(a.p.x>=reserved.stonehavenSite.x&&a.p.x<reserved.stonehavenSite.x+192&&
  a.p.z>=reserved.stonehavenSite.z&&a.p.z<reserved.stonehavenSite.z+192));

const farm=[...a.gen.grandCapital.residentChunks.values()].flat().find(e=>e.job&&a.gen.grandCapital.workFields.has(e.job.join(",")));
const farmer={...farm,sp:"farmer",pos:{x:farm.home[0],y:farm.home[1],z:farm.home[2]}};
assert.equal(settlementRoutine(a.w,farmer,.22).task,"field");
assert.equal(settlementRoutine(a.w,farmer,.12).task,"work");
assert.ok(shelterFromThreat(a.w,farmer,{x:farmer.pos.x-4,z:farmer.pos.z}));
const chims=settlementChimneys(a.w,{x:a.p.x+67,z:a.p.z+145},6);
assert.ok(chims.length>=1 && chims.length<=6);
const hostile={def:{hostile:true},pos:{x:farmer.pos.x+1,y:farmer.pos.y,z:farmer.pos.z}};
const remote={def:{hostile:true},pos:{x:farmer.pos.x+1,y:farmer.pos.y-9,z:farmer.pos.z}};
assert.equal(nearestSettlementThreat(settlementThreatIndex([remote,hostile]),farmer.pos,10),hostile);

const {w,p}=a;
const active=grandCapitalSiege(p), merchant={uid:"merchant-qa",def:{villager:true},pos:active.rally,home:[active.rally.x,active.rally.y,active.rally.z]};
const messages=[];
let jade=0;
const G={dim:"overworld",mode:"survival",wset:{difficulty:"normal"},meta:{day:2,gen:23},time:.2,world:w,
  story:{},state:"panel",panelKind:"trade",panelCtx:merchant.uid,saveNow(){},player:{pos:active.rally,aabb:()=>[0,0,0,0,0,0]},
  ents:{list:[],projectiles:[],add(sp,x,y,z){const actor={sp,pos:{x,y,z},hp:SPECIES[sp].hp};this.list.push(actor);return actor;}},
  inv:{count:()=>20,roomFor:()=>true,remove(){},add(id,n){jade+=n;}}};
const UI={toast(t){messages.push(t);},refreshPanel(){}}, Sound={mob(){},levelUp(){},craft(){},error(){}};
const raid=initSettlementRaids({G,UI,Sound,SPECIES,closePanel:()=>{G.state="play";}});
assert.equal(raid.offer(merchant).action,"Start siege");
raid.interact(merchant);
let defeated=0;
for(let i=0;i<45&&G.story.settlementRaids.active;i++){
  raid.update(2.2);
  for(const e of G.ents.list)if(!e.dead&&!e.gone&&e.settlementRaid){raid.defeated(e);e.dead=true;defeated++;}
}
assert.equal(defeated,15);
assert.equal(G.story.settlementRaids.sites.stonehaven.state,"won");
G.state="panel";
raid.interact(merchant);raid.interact(merchant);
assert.equal(jade,24);
const siegeReward=jade;

const festival=initSettlementFestivals({THREE,scene:new THREE.Scene(),G,UI,Sound});
const market=grandCapitalFestival(p);
G.state="play";G.player.pos={x:market.x+.5,y:market.y+1,z:market.z+.5};merchant.pos=G.player.pos;
festival.update(.3);
assert.ok(festival.gatheringPoint(merchant));assert.match(festival.calendar(),/Spring Blossom Fair/);
const offer=festival.offer(merchant);assert.equal(offer.remaining,4);
G.state="panel";festival.buy(merchant);assert.equal(festival.offer(merchant).remaining,3);
G.meta.day=3;festival.update(.3);assert.equal(festival.offer(merchant),null);festival.clear();

G.state="panel";G.story.villageGrowth={stonehaven:{tier:0,paid:[36,32,12]}};
const grow=initVillageGrowth({G,UI,Sound}), reserve=grandCapitalWorkshop(p);
assert.ok(grow.status(merchant).funded);
const test=[reserve.cx*CHUNK+6,p.y+1,reserve.cz*CHUNK+6], original=w.get(...test);
w.set(...test,B.IRON_BLOCK);
grow.build(merchant);
assert.equal(w.id(...test),B.IRON_BLOCK);
assert.equal(G.story.villageGrowth.stonehaven.tier,0);
w.set(...test,original);
grow.build(merchant);
assert.equal(G.story.villageGrowth.stonehaven.tier,1);
assert.equal(grow.status(merchant).project,undefined);
assert.ok(messages.some(x=>x.includes("Construction paused")));

for(const mode of ["survival","creative"]){
  const saved=await Saves.importFile(new Blob([JSON.stringify({blockhaven:SAVE_VERSION,name:"Capital "+mode,seed:benchmark,mode,
    gen:CURRENT_GEN,story:a.story,dims:{overworld:{mods:w.modsToJSON(),containers:[...w.containers],crops:[...w.crops]}}})]));
  const reopened=await Saves.load(saved.id), newGen=new Generator(benchmark,reopened.gen);
  prepareStonehaven(newGen,reopened.dims.overworld,reopened.story);
  assert.equal(reopened.mode,mode);assert.deepEqual(newGen.stonehavenSite,p);
  const u=new World(newGen);u.modsFromJSON(reopened.dims.overworld.mods);for(const [k,v] of reopened.dims.overworld.containers)u.containers.set(k,v);
  u.load(reserve.cx,reserve.cz);
  assert.equal(u.get(...test),w.get(...test));
  assert.deepEqual(u.containers.size,w.containers.size);
}
console.log(JSON.stringify({measurements:debug,siegeDefeated:defeated,repeatSafeReward:siegeReward,cropsRegistered:w.crops.size},null,2));
