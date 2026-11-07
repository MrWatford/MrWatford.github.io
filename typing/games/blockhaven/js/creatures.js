// Bestiary expansion. Meshes use the existing articulated box renderer and shared atlases.
import { CREATURES } from './creature-catalog.js';
import { B, I, SOLID, itemDef } from './blocks.js';

function blend(color, other, amount) {
  const a = Number.parseInt(color.slice(1), 16), b = Number.parseInt(other.slice(1), 16);
  const hex = [16, 8, 0].map(shift => {
    const channel = (a >> shift) & 255, target = (b >> shift) & 255;
    return Math.round(channel + (target - channel) * amount).toString(16).padStart(2, '0');
  });
  return '#' + hex.join('');
}

const coat = (color, trim = color) => {
  const dark = blend(color, '#23202a', .13), light = blend(color, '#fff4dc', .13);
  const edge = blend(color, trim, .35);
  return { all: P => {
    P.fill([color, color, color, dark, light]);
    P.rect(0, 0, 16, 1, edge);
    P.rect(0, 15, 16, 1, dark);
  } };
};
const facePaint = (color, trim, eyes = '#211f29') => ({ ...coat(color, trim), front: P => {
  P.fill([color, color, blend(color, trim, .18)]);
  P.rect(2, 4, 4, 4, '#f4efe1'); P.rect(10, 4, 4, 4, '#f4efe1');
  P.rect(3, 5, 3, 3, eyes); P.rect(10, 5, 3, 3, eyes);
  P.rect(6, 10, 4, 2, trim); P.rect(5, 13, 6, 1, '#443833');
} });
const box = (name, size, pivot, paint, parent, off = [0, 0, 0]) => ({ name, size, pivot, off, paint, ...(parent ? { parent } : {}) });
function quadruped(a, b, body = [12, 9, 17], head = [8, 7, 7], legs = 6) {
  return { type: 'quad', parts: [
    box('body', body, [0, legs + body[1] / 2, 0], coat(a, b)),
    box('head', head, [0, legs + body[1] - 2, body[2] / 2], facePaint(a, b), null, [0, 0, head[2] / 2 - 1]),
    ...[[-1, 1, 'legFR'], [1, 1, 'legFL'], [-1, -1, 'legBR'], [1, -1, 'legBL']].map(([x,z,n]) =>
      box(n, [3, legs, 3], [x * (body[0]/2-2), legs, z * (body[2]/2-2)], coat(b,a), null, [0,-legs/2,0]))
  ] };
}
function humanoid(a,b, slender = false) {
  const limb = slender ? 2 : 4;
  return { type:'humanoid', parts:[
    box('body',[8,12,4],[0,18,0],coat(b,a)),
    box('head',[8,8,8],[0,24,0],facePaint(a,b),null,[0,4,0]),
    box('armR',[limb,12,limb],[-5,22,0],coat(a,b),null,[0,-4,0]),
    box('armL',[limb,12,limb],[5,22,0],coat(a,b),null,[0,-4,0]),
    box('legR',[limb,12,limb],[-2,12,0],coat(b,a),null,[0,-6,0]),
    box('legL',[limb,12,limb],[2,12,0],coat(b,a),null,[0,-6,0])
  ] };
}
function winged(a,b, small = false) {
  return { type:'bestiary', parts:[
    box('body',small?[5,7,4]:[10,5,16],[0,8,0],coat(a,b)),
    box('head',small?[6,6,6]:[8,6,7],[0,12,small?1:9],facePaint(a,b)),
    box('wingL',small?[10,1,7]:[20,1,13],[small?3:5,10,0],coat(b,a),null,[small?5:10,0,-1]),
    box('wingR',small?[10,1,7]:[20,1,13],[small?-3:-5,10,0],coat(b,a),null,[small?-5:-10,0,-1]),
    box('tail',[2,2,10],[0,7,-8],coat(a,b))
  ] };
}
function fish(a,b) {
  return { type:'bestiary', parts:[
    box('body',[5,6,15],[0,5,0],coat(a,b)),
    box('head',[5,5,5],[0,5,8],facePaint(b,a)),
    box('tail',[1,8,7],[0,5,-8],coat(a,b),null,[0,0,-3]),
    box('finL',[5,1,5],[4,4,0],coat(b,a)), box('finR',[5,1,5],[-4,4,0],coat(b,a))
  ] };
}
function shellfish(a,b) {
  const m = {type:'bestiary',parts:[box('body',[13,14,10],[0,10,-2],coat(a,b)),box('head',[8,5,6],[0,5,6],facePaint(b,a))]};
  // Nested stepped rings form the shell's raised spiral on each visible side.
  for (const side of [-1,1]) {
    for(let i=0;i<4;i++) m.parts.push(box('spiral'+side+'_'+i,[1.3,11-i*2.4,8-i*1.6],[side*(6.7+i*.35),10+i*.3,-2],coat(i%2?a:b,i%2?b:a)));
  }
  for(let i=0;i<6;i++) m.parts.push(box('tentacle'+i,[1.5,2,10],[(i-2.5)*1.6,3,9],coat(b,a),null,[0,0,4]));
  return m;
}
function guardianModel(a,b, elder) {
  const m={type:'bestiary',parts:[box('body',[14,14,14],[0,8,0],coat(a,b)),box('eye',[7,7,2],[0,9,8],{
    all:P=>P.fill(['#eee4ce']),front:P=>{P.fill(['#eee4ce']);P.rect(4,3,8,10,'#9b4f76');P.rect(7,4,3,8,'#211b30');}
  }),box('tail',[4,5,11],[0,8,-9],coat(a,b),null,[0,0,-4])]};
  for(let i=0;i<8;i++){const angle=i*Math.PI/4;m.parts.push(box('spike'+i,[3,7,3],[Math.cos(angle)*10,9+Math.sin(angle)*9,i%2?3:-3],coat(b,a)));}
  if(elder)m.parts.push(box('crest',[9,3,7],[0,17,0],coat(b,a)));
  return m;
}
function crawler(a,b) {
  const parts=[];
  for(let i=0;i<5;i++)parts.push(box(i?'segment'+i:'body',[8-i,4,4],[0,3,7-i*3],coat(i%2?a:b,a)));
  parts.push(box('head',[6,4,5],[0,4,10],facePaint(a,b)));
  for(let i=0;i<6;i++)parts.push(box('foot'+i,[5,1,2],[i%2?5:-5,1,7-Math.floor(i/2)*5],coat(b,a)));
  return {type:'bestiary',parts};
}
function cube(a,b) {return {type:'bestiary',parts:[box('body',[16,16,16],[0,8,0],facePaint(a,b)),box('core',[9,9,9],[0,8,0],coat(b,a))]};}
function addEars(m,a,b,length=4) {
  for(const side of [-1,1])m.parts.push(box('ear'+side,[3,length,2],[side*3,5,0],coat(a,b),'head'));
}
function addHorns(m,a,b) {
  for(const side of [-1,1]){
    m.parts.push(box('hornBase'+side,[3,5,3],[side*4,4,0],coat(a,b),'head'));
    m.parts.push(box('hornTip'+side,[2,5,2],[side*5,8,-1],coat(b,a),'head'));
  }
}
const hostile = new Set(['bogged','breeze','creaking','drowned','elder_guardian','endermite','evoker','aquatic_guardian','husk','parched','phantom','pillager','ravager','silverfish','stray','vex','vindicator','witch','zoglin','zombie_villager']);
const aquatic = new Set(['axolotl','drowned','elder_guardian','glow_squid','aquatic_guardian','nautilus','salmon','tadpole','zombie_nautilus']);
const flyers = new Set(['allay','bat','breeze','happy_ghast','phantom','vex']);
const archers = new Set(['bogged','parched','stray','pillager']);
const humanoids = new Set(['bogged','creaking','drowned','evoker','husk','parched','pillager','stray','vindicator','witch','zombie_villager','copper_golem']);

export function installCreatures(species) {
  for (const [id,name,a,b,habitat] of CREATURES) {
    const enemy=hostile.has(id), swims=aquatic.has(id), flies=flyers.has(id);
    let model=quadruped(a,b);
    if(humanoids.has(id))model=humanoid(a,b,archers.has(id));
    if(flies)model=winged(a,b,['allay','vex','bat'].includes(id));
    if(['salmon','tadpole'].includes(id))model=fish(a,b);
    if(['nautilus','zombie_nautilus'].includes(id))model=shellfish(a,b);
    if(['aquatic_guardian','elder_guardian'].includes(id))model=guardianModel(a,b,id==='elder_guardian');
    if(['silverfish','endermite'].includes(id))model=crawler(a,b);
    if(id==='sulfur_cube')model=cube(a,b);
    const def={name, expansion:true, habitat, hp:enemy?20:10, speed:enemy?2.5:1.7, w:.8,h:1.2,
      ai:archers.has(id)?'archer':enemy?'melee':'animal', animal:!enemy&&!swims, hostile:enemy,
      swims,flies, food:enemy?[]:[I.WHEAT,I.SEEDS], xp:enemy?5:2, dmg:3,reach:1.8,
      sound:enemy?'groan':'chirp', model, drops:()=>enemy?[[I.ROTTEN_FLESH,1]]:[],
      burns:['drowned','zombie_villager','stray','phantom'].includes(id)};
    if(humanoids.has(id)){def.h=2;def.w=.6;}
    if(archers.has(id)){model.bow=true;def.drops=()=>[[I.BONE,1],[I.ARROW,2]];
      model.parts.push(box('bow',[1,12,2],[-1,-4,3],coat('#77513a','#dfc491'),'armR'));
    }
    species[id]=def;
    const parts=model.parts;
    if(['armadillo','turtle'].includes(id)){
      model=def.model=quadruped(b,a,[12,6,16],[6,5,6],3);def.h=.85;def.w=.95;
      for(let i=0;i<4;i++)model.parts.push(box('shellBand'+i,[14,8,3],[0,8,-5+i*3.4],coat(a,b)));
      if(id==='turtle')def.food=[I.SEEDS];
    }
    if(id==='bat'){
      addEars(model,a,b,5);
      for(const side of ['L','R']){
        const wing=parts.find(p=>p.name==='wing'+side);
        wing.size=[12,1,8];
        parts.push(box('wingTip'+side,[5,1,4],[side==='L'?7:-7,0,-3],coat(b,a),'wing'+side));
      }
      def.food=[];
    }
    if(id==='axolotl'){
      def.model=quadruped(a,b,[7,4,13],[9,6,7],2);def.h=.6;def.w=.65;
      def.model.parts.push(box('tail',[2,5,12],[0,4,-10],coat(b,a)));
      for(const side of [-1,1])for(let i=0;i<3;i++)def.model.parts.push(box('gill'+side+'_'+i,[4,1.5,2],[side*6,3-i*2,1+i],coat(b,a),'head'));
      def.food=[I.RAW_MINNOW];
    }
    if(id==='frog'){
      def.model=quadruped(a,b,[10,5,10],[11,5,7],3);def.h=.65;def.w=.75;def.hops=true;def.food=[I.GLOOP_BALL];
      for(const side of [-1,1])def.model.parts.push(box('raisedEye'+side,[3,3,3],[side*4,4,3],facePaint(a,b),'head'));
    }
    if(id==='goat'){def.neutral=true;def.model=quadruped(a,b,[10,9,15],[6,7,6],9);addHorns(def.model,b,a);def.h=1.5;def.hops=true;}
    if(id==='mooshroom'){
      def.model=quadruped(a,b,[12,10,18],[8,8,7],10);def.h=1.5;def.drops=species.cow.drops;
      for(let i=0;i<3;i++){
        def.model.parts.push(box('stalk'+i,[2,4,2],[i%2?3:-3,25,-6+i*6],coat(b,a)));
        def.model.parts.push(box('cap'+i,[7,3,7],[i%2?3:-3,28,-6+i*6],coat(a,b)));
      }
    }
    if(id==='ocelot'){
      def.model=quadruped(a,b,[6,6,15],[6,6,5],5);def.h=.85;def.w=.55;def.skittish=true;def.food=[I.RAW_MINNOW];
      addEars(def.model,a,b);def.model.parts.push(box('tail',[2,2,14],[0,9,-13],coat(b,a)));
      const paint=def.model.parts[0].paint.all;def.model.parts[0].paint.all=P=>{paint(P);for(let i=0;i<5;i++)P.rect(2+(i*5)%12,3+i*2,2,2,b);};
    }
    if(['panda','polar_bear','ravager','zoglin','sniffer'].includes(id)){
      def.model=quadruped(a,b,[17,13,23],[12,10,11],7);def.h=1.65;def.w=1.4;def.hp=enemy?50:30;def.dmg=7;
      addEars(def.model,a,b,3);
      if(id==='ravager'||id==='zoglin')addHorns(def.model,b,'#eee2c7');
      if(id==='panda'){
        def.model.parts.push(box('shoulders',[18,14,6],[0,13,6],coat(b,b)));
        def.model.parts.find(p=>p.name==='head').paint.front=P=>{P.fill([a]);for(const x of [2,10]){P.rect(x,3,4,5,b);P.rect(x+1,4,2,2,'#eee');}P.rect(6,10,4,3,b);};
      }
      if(id==='polar_bear'){def.neutral=true;def.food=[I.RAW_MINNOW];}
      if(id==='sniffer'){
        def.model.parts.push(box('moss',[19,5,24],[0,22,0],coat(b,'#69a574')),box('nose',[12,7,7],[0,-2,9],coat('#dbab4f','#f1d26e'),'head'));
        for(let i=0;i<4;i++)def.model.parts.push(box('sprout'+i,[2,4+i%2,2],[(i-1.5)*4,26,i%2?5:-5],coat('#8dbe67','#c4dc86')));
      }
    }
    if(['evoker','witch','vindicator','pillager','zombie_villager'].includes(id)){
      parts.push(box('nose',[2,4,3],[0,0,5],coat(a,b),'head'),box('belt',[9,2,5],[0,13,0],coat('#3d3531','#c4a257')));
      if(id==='witch')parts.push(box('hatBrim',[13,2,13],[0,8,0],coat('#302838',b),'head'),box('hatCrown',[8,6,8],[0,12,0],coat('#302838',b),'head'),box('hatTip',[4,4,4],[1,17,0],coat('#302838',b),'head'));
      if(id==='evoker')parts.push(box('robe',[10,13,6],[0,12,0],coat('#39313e','#bb9e52')));
      if(id==='vindicator')parts.push(box('axeHandle',[2,13,2],[0,-5,3],coat('#765338','#b8945a'),'armR'),box('axeBlade',[7,5,2],[2,0,3],coat('#b9c4c5','#737f86'),'armR'));
    }
    if(id==='creaking'){
      def.hp=45;def.h=2.5;
      parts.push(box('branchL',[2,12,2],[-6,32,0],coat(a,b)),box('branchR',[2,9,2],[6,31,0],coat(a,b)),box('heart',[3,5,1],[0,18,2.7],coat('#f6a630','#ffe388')));
      parts.find(p=>p.name==='head').paint=facePaint(a,b,'#ffca42');
    }
    if(id==='bogged'||id==='stray'||id==='parched'){
      parts.push(box('mantle',[10,4,6],[0,22,0],coat(b,a)));
      if(id==='bogged')for(const side of [-1,1]){
        parts.push(box('mushroomStem'+side,[1,3,1],[side*3,8,0],coat('#cfbd95',b),'head'));
        parts.push(box('mushroomCap'+side,[4,2,4],[side*3,10,0],coat('#a6544e','#d79b70'),'head'));
      }
    }
    if(id==='copper_golem'){
      def.h=1.3;def.scale=.65;def.hp=20;def.food=[];def.drops=()=>[[I.IRON_INGOT,1]];
      parts.push(box('antenna',[2,5,2],[0,10,0],coat(a,b),'head'),box('antennaTip',[4,3,4],[0,14,0],coat(b,a),'head'),box('nose',[3,4,3],[0,0,5],coat(a,b),'head'));
    }
    if(id==='snow_golem'){
      def.model={type:'bestiary',parts:[box('body',[12,12,12],[0,6,0],coat(a,b)),box('chest',[9,9,9],[0,15,0],coat(a,'#cddde0')),box('head',[9,9,9],[0,24,0],facePaint(b,'#a96525')),box('armL',[10,2,2],[9,16,0],coat('#6d4b32','#9a7750')),box('armR',[10,2,2],[-9,16,0],coat('#6d4b32','#9a7750'))]};
      def.h=1.8;def.food=[];
    }
    if(id==='glow_squid'){
      def.model={type:'bestiary',parts:[box('body',[10,13,10],[0,13,0],facePaint(a,b,'#b9ffff'))]};
      for(let i=0;i<8;i++){const angle=i*Math.PI/4;def.model.parts.push(box('tentacle'+i,[2,12,2],[Math.cos(angle)*5,7,Math.sin(angle)*5],coat(b,a),null,[0,-5,0]));}
      def.h=1.3;def.food=[];
    }
    if(id==='happy_ghast'){
      def.model={type:'bestiary',parts:[box('body',[25,23,25],[0,22,0],facePaint(a,b)),box('goggleL',[9,6,3],[-6,31,13],coat('#765338','#8bd1e3')),box('goggleR',[9,6,3],[6,31,13],coat('#765338','#8bd1e3')),box('saddle',[18,3,18],[0,35,0],coat('#916338','#d4b565'))]};
      for(let i=0;i<6;i++)def.model.parts.push(box('tentacle'+i,[3,12,3],[(i%3-1)*8,10,i<3?-7:7],coat(a,b),null,[0,-5,0]));
      def.h=2.3;def.w=1.6;def.hp=40;def.food=[I.WHEAT];def.mount=true;def.tameWith=[I.WHEAT];def.airMount=true;
    }
    if(['nautilus','zombie_nautilus'].includes(id)){
      def.hp=20;def.h=1.15;def.w=1;def.persist=false;def.mount=true;def.waterMount=true;def.food=[I.RAW_MINNOW];def.tameWith=[I.RAW_MINNOW];
      def.model.parts.push(box('saddle',[9,2,8],[0,18,-2],coat('#775131','#bc975e')));
    }
    if(id==='breeze'){
      def.model={type:'bestiary',parts:[box('head',[9,8,9],[0,21,0],facePaint(a,b,'#eff7ff'))]};
      for(let i=0;i<4;i++)def.model.parts.push(box('wind'+i,[16-i*3,2,16-i*3],[0,17-i*4,0],coat(b,a)));
      def.h=1.7;def.hp=30;
    }
    if(id==='sulfur_cube'){
      model.parts[0].paint={all:P=>P.fill(['rgba(232,209,67,.72)','rgba(255,237,117,.78)']),front:P=>{P.fill(['rgba(238,218,73,.74)']);P.rect(3,5,3,4,'#74672c');P.rect(10,5,3,4,'#74672c');}};
      def.h=1;def.w=1;def.food=[];def.translucent=true;def.hops=true;}
    if(['bat','allay','vex'].includes(id)){def.h=.7;def.w=.5;def.scale=.75;def.hp=id==='bat'?6:14;}
    if(id==='tadpole'){def.h=.3;def.w=.3;def.speed=1.2;def.food=[];def.scale=.45;}
    if(id==='salmon'){def.h=.4;def.w=.4;def.food=[];def.school=true;def.drops=()=>[[I.RAW_MINNOW,1]];}
    if(['endermite','silverfish'].includes(id)){def.h=.4;def.w=.5;def.hp=8;def.speed=2.8;def.scale=.7;}
    if(id==='elder_guardian'){def.scale=1.5;def.w=1.5;def.h=1.8;def.hp=80;def.dmg=6;def.persist=true;}
    if(['aquatic_guardian','elder_guardian'].includes(id))def.drops=()=>[[I.QUARTZ,2],[I.RAW_MINNOW,1]];
  }
  // Existing animals gain dimensional ears, noses, horns, and consistent face shading.
  for(const id of ['cow','pig','sheep','rabbit','trotter']){
    const m=species[id].model;
    if(id==='cow')addHorns(m,'#c9b59b','#eee7cf');
    if(['pig','sheep'].includes(id))addEars(m,id==='pig'?'#e9a2a2':'#d6c3ad','#8c6862',3);
    if(id==='pig')m.parts.push(box('snout',[5,3,2],[0,-1,5],facePaint('#f1b1aa','#b26a65'),'head'));
    if(id==='rabbit')m.parts.push(box('muzzle',[3,2,2],[0,-1,3],coat('#debaa0','#f2d8c0'),'head'));
    if(id==='trotter')m.parts.push(box('bridle',[7,2,2],[0,-3,6],coat('#634631','#b48d55'),'head'));
  }
}

export function animateCreature(e) {
  if(!e.def.expansion)return;
  const P=e.parts,t=e.age;
  for(const side of ['L','R'])if(P['wing'+side])P['wing'+side].rotation.z=Math.sin(t*(e.sp==='bat'?15:8))*.5*(side==='L'?1:-1);
  for(let i=0;i<8;i++)if(P['tentacle'+i])P['tentacle'+i].rotation.x=Math.sin(t*3+i*.7)*.3;
  for(let i=0;i<4;i++)if(P['wind'+i])P['wind'+i].rotation.y=t*(i%2?2:-2)+i;
  if(P.tail&&e.def.swims)P.tail.rotation.y=Math.sin(t*5)*.3;
  if(P.saddle)P.saddle.visible=e.saddled;
  if(e.sp==='armadillo'&&e.rolled){e.root.scale.set(e.scale,e.scale*.7,e.scale);P.head.visible=false;}
  else if(e.sp==='armadillo')P.head.visible=true;
  if(e.sp==='sulfur_cube'){const squash=1+Math.sin(t*5)*.06;e.root.scale.set(e.scale/squash,e.scale*squash,e.scale/squash);}
  if(e.sp==='creaking'&&e.frozen)for(const limb of ['armR','armL','legR','legL'])P[limb].rotation.x=0;
}

export function thinkCreature(manager,e,daylight) {
  if(!e.def.expansion)return false;
  const ctx=manager.ctx,p=ctx.player(),w=manager.world,d=manager.dist(e),dt=e.thinkT||.15;
  const state=e.bestiary,def=e.def;
  const difficulty={peaceful:0,easy:.67,normal:1,hard:1.5}[ctx.settings().difficulty]??1;
  if(def.hostile&&ctx.settings().difficulty==='peaceful'){e.gone=true;return true;}
  if(e.angry>0)e.angry=Math.max(0,e.angry-dt);
  if(e.sp==='tadpole'&&e.inWater){
    state.growth=(state.growth||0)+dt;
    if(state.growth>=180){manager.add('frog',e.pos.x,e.pos.y,e.pos.z,{name:e.name,persist:e.persist});e.gone=true;}
    return false;
  }
  if(def.swims&&!def.hostile&&def.food.length){
    if(e.baby&&(e.growT-=dt)<=0)e.baby=false;
    e.breedCd=Math.max(0,e.breedCd-dt);e.love=Math.max(0,e.love-dt);
    if(manager.seekMate(e,d))return true;
  }
  if(e.sp==='creaking'){
    const dx=e.pos.x-p.pos.x,dz=e.pos.z-p.pos.z,len=Math.hypot(dx,dz)||1;
    e.frozen=(-Math.sin(p.yaw)*dx-Math.cos(p.yaw)*dz)/len>.45&&d<32&&manager.canSeePlayer(e);
    if(e.frozen){e.goal=null;e.vel.x=e.vel.z=0;return true;}
  }
  if(e.sp==='armadillo'){
    e.rolled=manager.list.some(o=>o.def.hostile&&!o.dead&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<5);
    if(e.rolled){e.goal=null;return true;}
  }
  if(e.sp==='sulfur_cube'){
    if(state.bounceUntil>e.age){e.goal=null;return true;}
    e.wantJump=e.onGround&&Math.random()<.12;
    return false;
  }
  if(e.sp==='allay'){
    if(!e.held)return false;
    const drop=(ctx.droppedItems?ctx.droppedItems():[]).find(q=>q.id===e.held&&!q.stack&&q.pickDelay<=0&&Math.hypot(q.x-p.pos.x,q.y-p.pos.y,q.z-p.pos.z)>2&&Math.hypot(q.x-e.pos.x,q.y-e.pos.y,q.z-e.pos.z)<12);
    if(drop&&!state.carry){
      e.goal={x:drop.x,y:drop.y,z:drop.z,speed:3};
      if(Math.hypot(drop.x-e.pos.x,drop.y-e.pos.y,drop.z-e.pos.z)<1){state.carry=drop.n;ctx.dropGone(drop);}
    }else{
      e.goal=d>2?{x:p.pos.x,y:p.pos.y+1.5,z:p.pos.z,speed:3}:null;
      if(state.carry&&d<2){ctx.drop(e.held,state.carry,p.pos.x,p.pos.y+1,p.pos.z);state.carry=0;}
    }
    return true;
  }
  if(e.sp==='copper_golem'){
    state.timer=(state.timer||0)-dt;
    if(state.timer>0)return false;
    state.timer=3;
    const chests=[...w.containers].filter(([key,c])=>c.type==='chest'&&Array.isArray(c.slots)&&key.split(',').length===3)
      .map(([key,c])=>({pos:key.split(',').map(Number),c})).filter(({pos})=>Math.hypot(pos[0]-e.pos.x,pos[1]-e.pos.y,pos[2]-e.pos.z)<6);
    for(const source of chests){
      const stack=source.c.slots.find(q=>q&&q.n>0);if(!stack)continue;
      const max=itemDef(stack.id)?.stack||1;
      const target=chests.find(other=>other!==source&&other.c.slots.some(q=>q&&q.id===stack.id&&q.n>=stack.n&&q.n<max));
      if(!target)continue;
      const slot=target.c.slots.find(q=>q&&q.id===stack.id&&q.n>=stack.n&&q.n<max);
      // Only merge ordinary stackable items; equipment keeps its own metadata.
      if(stack.dur!==undefined)continue;
      slot.n++;if(--stack.n===0)source.c.slots[source.c.slots.indexOf(stack)]=null;e.goal={x:target.pos[0]+.5,z:target.pos[2]+.5,speed:def.speed};
      ctx.particles(e.pos.x,e.pos.y+1,e.pos.z,'xp');return true;
    }
    return false;
  }
  if(e.sp==='sniffer'){
    state.dig=(state.dig||0)+dt;
    if(state.dig>45&&e.onGround&&w.id(Math.floor(e.pos.x),Math.floor(e.pos.y)-1,Math.floor(e.pos.z))===B.GRASS){
      state.dig=0;e.grazeT=2;ctx.drop(I.SEEDS,1,e.pos.x,e.pos.y+.4,e.pos.z);ctx.particles(e.pos.x,e.pos.y,e.pos.z,'poof');
    }
    return false;
  }
  if(e.sp==='snow_golem'){
    const foe=manager.list.find(o=>o.def.hostile&&!o.dead&&!o.gone&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<12);
    if(foe&&e.attackCd<=0){manager.shootArrow(e,foe,1/3);e.attackCd=2;}
    manager.wander(e);return true;
  }
  if(e.sp==='frog'||e.sp==='axolotl'){
    const prey=manager.list.find(o=>!o.dead&&(e.sp==='frog'?o.sp==='slime'&&o.size===1:['minnow','salmon'].includes(o.sp))&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<6);
    if(prey){e.goal={...prey.pos,speed:2.5};if(manager.dist(prey)<64&&Math.hypot(prey.pos.x-e.pos.x,prey.pos.y-e.pos.y,prey.pos.z-e.pos.z)<1.4&&e.attackCd<=0){manager.damage(prey,3,e);e.attackCd=1;}return true;}
  }
  if(['polar_bear','goat'].includes(e.sp)&&e.angry>0&&manager.targetable()){
    manager.chase(e,p.pos);
    if(d<2&&e.attackCd<=0){ctx.hurtPlayer(def.dmg*difficulty,`A ${def.name} hit you!`,e);e.attackCd=1.5;}
    return true;
  }
  const attackable=manager.targetable()&&d<24&&manager.canSeePlayer(e);
  if(['aquatic_guardian','elder_guardian','drowned','zombie_nautilus'].includes(e.sp)){
    if(!attackable||e.tame||(e.sp==='zombie_nautilus'&&e.angry<=0)){state.charge=0;return false;}
    if(!e.inWater){state.charge=0;return false;}
    e.goal={x:p.pos.x,y:p.pos.y,z:p.pos.z,speed:def.speed};
    if(e.sp.includes('guardian')){
      state.charge=(state.charge||0)+dt;
      if(state.charge>=2.5){state.charge=0;ctx.hurtPlayer(def.dmg*difficulty,`A ${def.name}'s beam hit you!`,e);if(e.sp==='elder_guardian')ctx.effect('queasy',8);}
    }else if(d<2&&e.attackCd<=0){ctx.hurtPlayer(def.dmg*difficulty,`A ${def.name} hit you!`,e);e.attackCd=1.5;}
    return true;
  }
  if(['witch','evoker','breeze','phantom','vex'].includes(e.sp)){
    if(!attackable){manager.wander(e);return true;}
    if(def.flies)e.goal={x:p.pos.x,y:p.pos.y+(e.sp==='phantom'?(Math.sin(e.age*.5)>0?6:1):1),z:p.pos.z,speed:3.5};
    else manager.chase(e,p.pos);
    if(e.attackCd>0)return true;
    if(e.sp==='evoker'){
      const count=manager.list.filter(o=>o.sp==='vex'&&!o.dead&&!o.gone).length;
      if(count<4){manager.add('vex',e.pos.x+1,e.pos.y+2,e.pos.z);e.attackCd=10;}
      else {manager.shootArrow(e,p,difficulty);e.attackCd=3;}
    }else if(e.sp==='witch'||e.sp==='breeze'){
      const dx=p.pos.x-e.pos.x,dy=p.pos.y+.9-e.eyeY,dz=p.pos.z-e.pos.z;
      const speed=10/(Math.hypot(dx,dy,dz)||1);
      manager.addProjectile(e.sp==='witch'?'witchbrew':'windburst',e.pos.x,e.eyeY,e.pos.z,
        dx*speed,dy*speed,dz*speed,{owner:e,dmg:3*difficulty,noGrav:true});
      e.attackCd=2.5;
      if(e.sp==='witch')e.hp=Math.min(e.maxHp,e.hp+1);
    }else if(d<2.5){ctx.hurtPlayer(4*difficulty,`A ${def.name} struck you!`,e);e.attackCd=1.5;}
    return true;
  }
  return false;
}

export function interactCreature(manager,e,slot) {
  if(!e.def.expansion)return false;
  const ctx=manager.ctx,id=slot?.id;
  if(e.sp==='allay'&&!id&&e.held){
    ctx.drop(e.held,1+(e.bestiary.carry||0),e.pos.x,e.pos.y+.5,e.pos.z);
    e.held=0;e.bestiary.carry=0;return true;
  }
  if(e.sp==='allay'&&id&&itemDef(id)?.stack>1){
    if(e.held){ctx.drop(e.held,1+(e.bestiary.carry||0),e.pos.x,e.pos.y+1,e.pos.z);e.bestiary.carry=0;}
    e.held=id;ctx.consume();e.persist=true;ctx.toast('Your Allay will collect matching dropped items and bring them to you.');return true;
  }
  if(e.def.mount&&e.def.tameWith.includes(id)&&!e.tame){
    ctx.consume();e.tame=true;e.persist=true;ctx.particles(e.pos.x,e.pos.y+1,e.pos.z,'heart');ctx.toast(`Your ${e.def.name} trusts you. Equip a Saddle to ride.`);return true;
  }
  if(e.sp==='mooshroom'&&id===I.BUCKET&&!e.baby){ctx.swapHeld(I.MILK_BUCKET);return true;}
  if(e.sp==='sulfur_cube'&&!e.bestiary.absorbed&&id&&id<256){
    ctx.consume();e.bestiary.absorbed=id;ctx.toast('The Sulfur Cube absorbed the block. Hit it to bounce it away!');return true;
  }
  return false;
}

export function spawnCreatures(manager,dt,daylight,species) {
  manager.bestiarySpawnT=(manager.bestiarySpawnT||0)-dt;
  if(manager.bestiarySpawnT>0)return;
  manager.bestiarySpawnT=5;
  const w=manager.world,p=manager.ctx.player(),living=manager.list.filter(e=>!e.dead&&!e.gone);
  if(w.gen.isNether()||w.gen.isForsaken||w.gen.isMap?.()||living.length>=120||living.filter(e=>e.def.expansion).length>=24)return;
  const angle=Math.random()*Math.PI*2,radius=24+Math.random()*14;
  const x=Math.floor(p.pos.x+Math.cos(angle)*radius),z=Math.floor(p.pos.z+Math.sin(angle)*radius);
  if(!w.isLoaded(x,z))return;
  const end=w.gen.isEnd?.(),biome=w.gen.column?.(x,z)?.biome;
  let y=w.surfaceY(x,z)+1;
  const water=w.id(x,y-1,z)===B.WATER;
  const cave=p.pos.y<y-8&&!water;
  if(cave){y=Math.floor(p.pos.y);while(y>3&&!SOLID[w.id(x,y-1,z)])y--;}
  const night=daylight<.45,woods=['forest','birch'].includes(biome),dry=biome==='sandy',peak=biome==='peak';
  const habitats=new Set();
  if(end)habitats.add('end');
  else if(water){
    let depth=0;
    while(depth<10&&w.id(x,y-depth-1,z)===B.WATER)depth++;
    habitats.add('water');
    if(night)habitats.add('waterNight');
    if(depth>=5){habitats.add('deep');if(night)habitats.add('deepNight');}
    y-=Math.min(3,depth);
  }
  else if(cave){habitats.add('cave');habitats.add('caveNight');}
  else{
    habitats.add(night?'night':'plains');
    if(w.gen.villagePiece?.(Math.floor(x/16),Math.floor(z/16))&&daylight>.65)habitats.add('plains');
    if(woods)habitats.add(night?'forestNight':'woods');
    if(dry)habitats.add(night?'dryNight':'dry');
    if(peak)habitats.add(night?'peakNight':'peak');
    if([[3,0],[-3,0],[0,3],[0,-3]].some(([dx,dz])=>w.id(x+dx,y-1,z+dz)===B.WATER))habitats.add('shore');
    if(Math.random()<.12)habitats.add(night?'skyNight':'sky');
  }
  const peaceful=manager.ctx.settings().difficulty==='peaceful';
  const creative=manager.ctx.creative();
  const pool=CREATURES.filter(([id,,,,habitat])=>habitats.has(habitat)&&
    (!(peaceful||creative)||!hostile.has(id))&&living.filter(e=>e.sp===id).length<(id==='elder_guardian'?1:3));
  if(!pool.length)return;
  const [id]=pool[Math.floor(Math.random()*pool.length)];
  const def=species[id];
  if(def.flies)y+=4;
  for(let height=0;height<=Math.ceil(def.h);height++){
    const block=w.id(x,y+height,z);
    if(SOLID[block]||block===B.LAVA||(def.swims&&block!==B.WATER))return;
  }
  if(!def.flies&&!def.swims&&!SOLID[w.id(x,y-1,z)])return;
  manager.add(id,x+.5,y,z+.5);
}
