import { B, I, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";
import { amberFloor } from "./amber-caverns.js";

const CAVE_RAPTOR = "lost_world_cave_raptor";
const SNAPROOT = "lost_world_snaproot";
const rock = P => {
  P.fill(["#4b4855"]);
  for (let y=1;y<13;y+=2) for (let x=y%3;x<16;x+=4) P.px(x,y,"#756779");
  P.rect(0,12,16,4,"#8a6a5d");
};
const eye = P => { rock(P); P.rect(8,4,4,3,"#ffab4c"); P.px(10,5,"#3c2024"); };
const ivory = P => P.fill(["#d8bb88"]);
const stem = P => { P.fill(["#374a32"]); for (const x of [0,4,9,13]) P.rect(x,0,2,16,"#677345"); };
const petal = P => {
  P.fill(["#783d36"]);
  for (const x of [1,5,9,13]) P.rect(x,0,2,12,"#bc6b46");
  P.rect(0,12,16,4,"#ac8550");
};
const part = (name,size,pivot,off,paint,extra) => ({name,size,pivot,off,paint:{all:paint},...extra});

export function installCaveCreatures(species) {
  const crawler = [
    part("body",[13,9,22],[0,10,0],[0,0,0],rock),
    part("head",[10,7,12],[0,13,9],[0,1,4],rock,{paint:{all:rock,left:eye,right:eye}}),
    part("jaw",[8,3,12],[0,10,10],[0,0,4],ivory),
    part("tail",[7,6,17],[0,10,-9],[0,0,-7],rock),
    part("tailTip",[4,5,13],[0,0,-6],[0,0,-5],rock,{parent:"tail"})
  ];
  for (const side of [-1,1]) {
    crawler.push(part("leg"+side,[5,10,8],[side*5,10,-1],[side,-5,0],rock));
    crawler.push(part("arm"+side,[3,6,6],[side*5,9,9],[side,-2,1],rock));
  }
  species[CAVE_RAPTOR] = {
    caveCreature:true, name:"Amber Prowler", hostile:true, persist:true, hp:19, w:0.85, h:1.2,
    speed:3.1, dmg:5, reach:1.9, sound:"chitter", xp:4, drops:()=>[[I.BONE,2]],
    model:{type:"cave_prowler",parts:crawler}
  };

  const plant = [
    part("base",[17,6,17],[0,3,0],[0,0,0],stem),
    part("stem",[8,19,8],[0,5,0],[0,8,0],stem),
    part("crown",[16,10,13],[0,23,0],[0,0,0],petal),
    part("mouth",[12,7,12],[0,20,0],[0,0,5],petal)
  ];
  for (const side of [-1,1]) {
    plant.push(part("leaf"+side,[12,3,5],[side*3,8,0],[side*6,0,2],stem,{rotation:[0,0,side*0.4]}));
    plant.push(part("thorn"+side,[2,4,6],[side*3,3,1],[0,0,0],ivory,{parent:"mouth"}));
  }
  species[SNAPROOT] = {
    caveCreature:true, name:"Snaproot", hostile:true, static:true, persist:true, hp:12, w:1.05, h:1.8,
    speed:0,dmg:4,reach:2.1,sound:"hiss",xp:3,drops:()=>[[I.STRING,1]],
    model:{type:"snaproot",parts:plant}
  };
}

const sites = [
  {x:2,z:12,sp:SNAPROOT}, {x:-3,z:25,sp:CAVE_RAPTOR},
  {x:3,z:37,sp:CAVE_RAPTOR}, {x:-3,z:40,sp:SNAPROOT}
];

export function populateCaveCreatures(manager,{cx,cz}) {
  const w=manager.world;
  for (const {x,z,sp} of sites) {
    if (!w.isLoaded(x,z) || w.chunkAt(x,z).cx !== cx || w.chunkAt(x,z).cz !== cz) continue;
    const y=amberFloor(x,z)+1;
    if (SOLID[w.id(x,y-1,z)] && !SOLID[w.id(x,y,z)] && !SOLID[w.id(x,y+1,z)]) {
      const home=[x+0.5,y,z+0.5];
      manager.add(sp,...home,{home,yaw:Math.PI});
    }
  }
}

export function thinkCaveCreature(manager,e,distance,multiplier) {
  const p=manager.ctx.player().pos, def=e.def;
  const [hx,hy,hz]=Array.isArray(e.home)&&e.home.length===3&&e.home.every(Number.isFinite) ? e.home : [e.pos.x,e.pos.y,e.pos.z];
  const local=Math.hypot(p.x-hx,p.z-hz)<14;
  const canHunt=manager.targetable()&&local;
  const sees=canHunt&&distance<(def.static?def.reach:10)&&manager.canSeePlayer(e);
  const inReach=sees&&distance<def.reach&&Math.abs(p.y-e.pos.y)<1.4;
  const angle=Math.atan2(e.pos.x-p.x,e.pos.z-p.z);
  if (e.caveStrike) {
    if (canHunt&&e.age<e.caveStrike) return;
    if (inReach&&Math.cos(e.yaw-angle)>0.55) manager.ctx.hurtPlayer(def.dmg*multiplier,
      e.sp===SNAPROOT?"A Snaproot caught you near the cave wall.":"An Amber Prowler caught you in the dark.",e);
    e.caveStrike=0;
    e.attackCd=def.static?2.25:1.25;
    return;
  }
  if (inReach&&e.attackCd<=0) {
    e.goal=e.path=null;
    e.yaw=angle;
    e.caveStrike=e.age+(def.static?0.62:0.44);
    Sound.mob(def.sound,distance);
    return;
  }
  if (def.static) return;
  if (sees&&!inReach) manager.moveTo(e,p,def.speed,1.45);
  else if (Math.hypot(e.pos.x-hx,e.pos.z-hz)>1.2) manager.moveTo(e,{x:hx,y:hy,z:hz},def.speed*0.55);
  else e.goal=e.path=null;
}

export function animateCaveCreature(e,swing,reducedMotion) {
  const p=e.parts;
  if (e.sp===SNAPROOT) {
    p.mouth.rotation.x=e.caveStrike?0.68:0.08;
    p.crown.rotation.x=e.caveStrike?-0.25:0;
    p.leaf1.rotation.z=0.4+(reducedMotion?0:Math.sin(e.age*1.3)*0.09);
    p["leaf-1"].rotation.z=-p.leaf1.rotation.z;
  } else {
    const step=swing*(reducedMotion?0.32:0.65);
    p.leg1.rotation.x=step;
    p["leg-1"].rotation.x=-step;
    p.tail.rotation.y=-step*0.45;
    p.tailTip.rotation.y=-step*0.25;
    p.jaw.rotation.x=e.caveStrike?0.58:0;
  }
}
