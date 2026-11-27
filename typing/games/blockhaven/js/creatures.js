// Bestiary expansion. Meshes use the existing articulated box renderer and shared atlases.
import { CREATURES } from './creature-catalog.js';
import { B, I, SOLID, itemDef, BLOCKS } from './blocks.js';
import { POTIONS } from './potions.js';
import { HALL, MONUMENT_SIZE } from './ocean-monument.js';
import { Sound } from './audio.js';

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
  P.rect(2, 6, 4, 2, '#e6dfd2'); P.rect(10, 6, 4, 2, '#e6dfd2');
  P.rect(4, 6, 2, 2, eyes); P.rect(10, 6, 2, 2, eyes);
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
const raiders = new Set(['pillager','vindicator','evoker','ravager']);
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
      def.model.parts.find(part => part.name === 'head').paint = { ...coat(a, b), front: P => {
        P.fill([a]);
        P.rect(2, 11, 12, 1, blend(a, '#272327', 0.5));
      } };
      for (const side of [-1, 1]) def.model.parts.push(box('raisedEye' + side, [3, 3, 3], [side * 4, 3, 3], {
        ...coat(a, b), front: P => {
          P.fill([a]);
          P.rect(3, 4, 10, 8, '#d7b76a');
          P.rect(5, 6, 6, 4, '#252226');
        }
      }, 'head'));
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
    if(id==='salmon'){def.h=.4;def.w=.4;def.food=[];def.school=true;def.drops=()=>[[I.RAW_SALMON,1]];}   // Milestone 17: its own fish
    if(id==='turtle'){def.food=[B.SEAGRASS];}   // Milestone 17, Part D: sea turtles love seagrass, and lay eggs on sand
    if(id==='drowned'){   // Milestone 17, Part D: some Drowned carry a trident (and sometimes drop it)
      model.parts.push(box('trident',[1,17,1],[-1,-9,2],coat('#3aa0a0','#7ad8d0'),'armR'));
      def.drops=e=>[[I.ROTTEN_FLESH,1+Math.floor(Math.random()*2)],...(e?.bestiary?.armed&&Math.random()<0.25?[[I.TRIDENT,1]]:[]),...(Math.random()<0.03?[[I.NAUTILUS_SHELL,1]]:[])];}
    if(['endermite','silverfish'].includes(id)){def.h=.4;def.w=.5;def.hp=8;def.speed=2.8;def.scale=.7;}
    if(id==='elder_guardian'){def.scale=1.5;def.w=1.5;def.h=1.8;def.hp=80;def.dmg=8;def.persist=true;def.speed=0.9;def.xp=10;}
    if(id==='aquatic_guardian'){def.hp=30;def.dmg=6;def.xp=10;def.speed=2.6;}
    // Milestone 17, Part C: Guardians drop prismarine (where shards and crystals come from); Elder Guardians also drop a Wet Sponge
    if(['aquatic_guardian','elder_guardian'].includes(id))def.drops=()=>{const r=Math.random(),out=[[I.PRISMARINE_SHARD,Math.floor(Math.random()*3)]];
      if(r<0.4)out.push([I.PRISMARINE_CRYSTALS,1]);else if(r<0.8)out.push([I.RAW_MINNOW,1]);if(id==='elder_guardian')out.push([B.WET_SPONGE,1]);return out.filter(q=>q[1]>0);};
    // Milestone 24, Part A: Phantoms only come for players who skip sleep; Evokers and Vexes only come from mansions, raids and spawn eggs
    if(id==='phantom'){def.hp=20;def.dmg=4;def.speed=6;def.w=1;def.h=.6;def.noNatural=true;def.flightLift=5;def.diveSpeed=12;}
    if(id==='evoker'){def.hp=24;def.speed=2;def.xp=10;def.noNatural=true;def.drops=()=>[[I.TOTEM,1],...(Math.random()<.5?[[I.JADE,1]]:[])];}
    // Milestone 24, Part D: Glow Squid ink, tougher Ravagers, weaker bites from the little pests
    if(id==='glow_squid')def.drops=()=>[[I.GLOW_INK_SAC,1+Math.floor(Math.random()*3)]];
    if(id==='ravager'){def.hp=100;def.xp=20;def.drops=()=>[[I.SADDLE,1]];}
    if(id==='silverfish')def.dmg=1;
    if(id==='endermite')def.dmg=2;
    // Milestone 24, Part C: the Breeze hops on the ground instead of flying; pandas eat bamboo
    if(id==='breeze'){def.flies=false;def.noFall=true;def.speed=2;def.xp=10;def.drops=()=>[[I.BREEZE_ROD,1+Math.floor(Math.random()*2)]];}
    if(id==='panda')def.food=[B.BAMBOO];
    // Milestone 24, Part B: Husks make you hungry; Snow Golems have a pumpkin you can shear off
    if(id==='husk')def.hunger=true;
    if(id==='snow_golem'){def.drops=()=>[[B.SNOW,1]];def.model.parts.push(box('snowHead',[8,8,8],[0,24,0],facePaint('#eef4f2','#cddde0')));}
    if(id==='vex'){def.noclip=true;def.speed=5;def.dmg=5;def.xp=3;def.noNatural=true;def.drops=()=>[];}
    if(raiders.has(id))def.model.raiderLook=id;
  }
  // Existing animals gain dimensional ears, noses, horns, and consistent face shading.
  for(const id of ['cow','pig','sheep','rabbit','trotter']){
    const m=species[id].model;
    if(id==='cow')addHorns(m,'#c9b59b','#eee7cf');
    if (id === 'pig' || id === 'sheep') {
      const head = m.parts.find(part => part.name === 'head');
      const color = id === 'pig' ? '#e9a2a2' : '#d6c3ad';
      for (const side of [-1, 1]) m.parts.push(box('ear' + side, [2, 2.5, 2],
        [side * (head.size[0] / 2 - 0.2), head.size[1] / 2 + 0.5, 0], coat(color, '#8c6862'), 'head'));
    }
    if (id === 'pig') m.parts.push(box('snout', [5, 3, 1.6], [0, -1.65, 4.55], {
      ...coat('#e5a19f'),
      front: P => {
        P.fill(['#e5a19f']);
        P.rect(3, 5, 3, 5, '#945955');
        P.rect(10, 5, 3, 5, '#945955');
      }
    }, 'head'));
    if(id==='rabbit')m.parts.push(box('muzzle',[3,2,2],[0,-1,3],coat('#debaa0','#f2d8c0'),'head'));
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
  if(e.sp==='drowned'&&P.trident)P.trident.visible=!!e.bestiary?.armed;   // Milestone 17
  if(e.sp==='axolotl'&&e.root){const dead=e.bestiary?.deadT>0;e.root.rotation.z=dead?Math.PI:0;e.root.position.y=dead?e.h:0;}   // Milestone 24, Part D: playing dead (belly up)
  if(e.sp==='allay'&&e.root){const dance=!!e.bestiary?.dance;e.root.rotation.y=dance?t*5:0;e.root.position.y=dance?.15+Math.sin(t*8)*.12:0;}
  if(e.sp==='bat'&&e.root){const up=!!e.bestiary?.roost;e.root.rotation.x=up?Math.PI:0;e.root.position.y=up?e.h+.2:0;}   // Milestone 24, Part C: hanging upside down
  if(e.sp==='panda'&&e.root){const st=e.bestiary||{},a=st.animT>0?st.anim:null;
    e.root.rotation.x=a==='roll'?(1-st.animT)*Math.PI*2:0;e.root.rotation.z=a==='lie'?1.35:0;e.root.position.y=a==='roll'?.8:0;
    if(P.head&&a==='sneeze')P.head.rotation.x=Math.sin(st.animT*12)*.5;}
  if(e.sp==='goat'&&P.hornBase1){const h=e.bestiary?.horns??2;P.hornBase1.visible=P.hornTip1.visible=h>=2;P['hornBase-1'].visible=P['hornTip-1'].visible=h>=1;}   // Milestone 24, Part B
  if(e.sp==='snow_golem'&&P.head)P.head.visible=!e.bestiary?.sheared;
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
  if(e.sp==='allay'){   // Milestone 24, Part D: an Allay dances while a Jukebox plays nearby
    state.dance=!!ctx.jukeboxNear?.(e.pos.x,e.pos.y,e.pos.z,10);
    if(state.dance){e.goal=null;e.vel.x*=.5;e.vel.y*=.5;e.vel.z*=.5;return true;}
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
  if(e.sp==='sniffer')return thinkSniffer(manager,e,state,dt);   // Milestone 24, Part D
  if(e.sp==='bat')return thinkBat(manager,e,state,p,d,dt,daylight);   // Milestone 24, Part C
  if(e.sp==='axolotl'&&thinkAxolotl(manager,e,state,p,d,dt))return true;   // Milestone 24, Part D
  if(e.sp==='glow_squid'){if(state.lastHp!==undefined&&e.hp<state.lastHp)state.dim=5;state.lastHp=e.hp;if(state.dim>0)state.dim-=dt;}
  if(e.sp==='silverfish'&&thinkSilverfish(manager,e,state,d,dt))return true;
  if(e.sp==='endermite'&&state.life!==undefined&&!e.persist){state.life+=dt;if(state.life>120){e.gone=true;return true;}}
  if(e.sp==='ravager'&&thinkRavager(manager,e,state,p,d,dt,difficulty))return true;
  if(e.sp==='zoglin'&&thinkZoglin(manager,e,state,d,difficulty))return true;
  if(e.sp==='panda'&&thinkPanda(manager,e,state,p,d,dt,difficulty))return true;
  if(e.sp==='ocelot'&&thinkOcelot(manager,e,state,dt))return true;
  if(e.sp==='snow_golem')return thinkSnowGolem(manager,e,state,dt);   // Milestone 24, Part B
  if(e.sp==='goat'&&thinkGoat(manager,e,state,p,d,dt))return true;
  if(e.sp==='polar_bear'&&!e.baby&&!e.tame)guardCubs(manager,e,state,d);
  if(e.sp==='frog'||e.sp==='axolotl'){
    const prey=manager.list.find(o=>!o.dead&&(e.sp==='frog'?o.sp==='slime'&&o.size===1:['minnow','salmon'].includes(o.sp))&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<6);
    if(prey){e.goal={...prey.pos,speed:2.5};if(manager.dist(prey)<64&&Math.hypot(prey.pos.x-e.pos.x,prey.pos.y-e.pos.y,prey.pos.z-e.pos.z)<1.4&&e.attackCd<=0){manager.damage(prey,3,e);e.attackCd=1;}return true;}
  }
  if(e.sp==='polar_bear'&&e.angry>0&&manager.targetable()){
    manager.chase(e,p.pos);
    if(d<2&&e.attackCd<=0){ctx.hurtPlayer(def.dmg*difficulty,`A ${def.name} hit you!`,e);e.attackCd=1.5;}
    return true;
  }
  const attackable=manager.targetable()&&d<24&&manager.canSeePlayer(e);
  if(e.sp==='aquatic_guardian'||e.sp==='elder_guardian'){   // Milestone 17, Part C: Guardians keep their distance and charge a laser
    const elder=e.sp==='elder_guardian';
    if(elder&&ctx.settings().difficulty!=='peaceful'&&!ctx.creative()){   // an Elder Guardian's curse reaches 50 blocks, about once a minute
      state.curseT=(state.curseT??3)-dt;
      if(state.curseT<=0&&d<50){state.curseT=60;if(!ctx.playerEffect?.('fatigue')){ctx.effect('fatigue',300);ctx.toast?.('An Elder Guardian cursed you with Mining Fatigue! Digging is very slow until it wears off.');}}
    }
    if(!e.inWater){state.charge=0;return false;}
    const sees=manager.targetable()&&d<(elder?20:16)&&!e.tame&&manager.canSeePlayer(e);
    if(!sees){state.charge=0;if(elder){e.goal=null;e.vel.x*=.5;e.vel.z*=.5;return true;}return false;}
    // swim to stay 6-12 blocks away (an Elder Guardian barely moves)
    const away=d<6?-1:d>12?1:0,dx=p.pos.x-e.pos.x,dz=p.pos.z-e.pos.z,len=Math.hypot(dx,dz)||1;
    if(elder)e.goal=null;
    else e.goal={x:e.pos.x+dx/len*away*4+Math.sin(e.age)*1.5,y:p.pos.y+1,z:e.pos.z+dz/len*away*4+Math.cos(e.age)*1.5,speed:def.speed};
    state.charge=(state.charge||0)+dt;
    if(state.charge>=3){state.charge=0;Sound.mob('laser',d);ctx.hurtPlayer(def.dmg*difficulty,`A ${def.name}'s laser hit you!`,e);}
    return true;
  }
  if(['aquatic_guardian','elder_guardian','drowned','zombie_nautilus'].includes(e.sp)){
    if(e.sp==='drowned'&&state.armed===undefined)state.armed=Math.random()<0.15;   // Milestone 17, Part D: about 1 in 7 carries a trident
    if(!attackable||e.tame||(e.sp==='zombie_nautilus'&&e.angry<=0)){state.charge=0;return false;}
    if(e.sp==='drowned'&&state.armed&&d>3&&d<14&&e.attackCd<=0){   // it throws the trident (a copy: it keeps its own)
      const dx=p.pos.x-e.pos.x,dy=p.pos.y+1-e.eyeY,dz=p.pos.z-e.pos.z,dist=Math.hypot(dx,dy,dz)||1,sp=18/dist;
      manager.addProjectile('arrow',e.pos.x,e.eyeY,e.pos.z,dx*sp,dy*sp+10*dist/18,dz*sp,{owner:e,dmg:8*difficulty,tridentMob:true});e.attackCd=3;return true;
    }
    if(!e.inWater){state.charge=0;return false;}
    e.goal={x:p.pos.x,y:p.pos.y,z:p.pos.z,speed:def.speed};
    if(e.sp.includes('guardian')){
      state.charge=(state.charge||0)+dt;
      if(state.charge>=2.5){state.charge=0;ctx.hurtPlayer(def.dmg*difficulty,`A ${def.name}'s beam hit you!`,e);if(e.sp==='elder_guardian')ctx.effect('queasy',8);}
    }else if(d<2&&e.attackCd<=0){ctx.hurtPlayer(def.dmg*difficulty,`A ${def.name} hit you!`,e);e.attackCd=1.5;}
    return true;
  }
  if(e.sp==='phantom')return thinkPhantom(manager,e,state,def,p,d,difficulty,dt);   // Milestone 24, Part A
  if(e.sp==='vex')return thinkVex(manager,e,state,def,p,d,difficulty,dt);
  if(e.sp==='evoker')return thinkEvoker(manager,e,state,def,p,d,difficulty,dt,attackable);
  if(e.sp==='breeze')return thinkBreeze(manager,e,state,def,p,d,difficulty,dt,attackable);   // Milestone 24, Part C
  if(['witch','breeze'].includes(e.sp)){
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
      if(e.sp==='witch'){   // Milestone 16: Witches throw real splash potions, picked like Java's witches pick them
        const has=k=>ctx.playerEffect?.(k),pot=d>8&&!has('slow')?'slowness':!has('poison')?'poison':Math.random()<.25&&!has('weakness')?'weakness':'harming';
        manager.addProjectile('potion',e.pos.x,e.eyeY,e.pos.z,dx*speed,dy*speed,dz*speed,
          {owner:e,noGrav:true,stack:{id:I.SPLASH_POTION,n:1,pot},color:parseInt(POTIONS[pot].color.slice(1),16)});
      }else manager.addProjectile('windburst',e.pos.x,e.eyeY,e.pos.z,
        dx*speed,dy*speed,dz*speed,{owner:e,dmg:3*difficulty,noGrav:true});
      e.attackCd=e.sp==='witch'?3:2.5;   // Java witches throw every 3 s
      if(e.sp==='witch')e.hp=Math.min(e.maxHp,e.hp+1);
    }else if(d<2.5){ctx.hurtPlayer(4*difficulty,`A ${def.name} struck you!`,e);e.attackCd=1.5;}
    return true;
  }
  return false;
}

// ----- Milestone 24, Part D: Axolotls, Sniffers, silverfish, Ravagers and Zoglins -----
// Axolotls hunt Drowned and Guardians in the water. If one of their foes dies, a player nearby gets Regeneration (and loses Mining Fatigue).
// When hurt, an Axolotl sometimes plays dead for 10 seconds, healing.
function thinkAxolotl(manager,e,st,p,d,dt){
  if(st.lastHp!==undefined&&e.hp<st.lastHp&&e.hp>0&&!(st.deadT>0)&&Math.random()<1/3)st.deadT=10;
  st.lastHp=e.hp;
  if(e._foe&&(e._foe.dead||e._foe.gone)){if(e._foe.dead&&d<20)manager.ctx.axolotlHelp?.();e._foe=null;}
  if(st.deadT>0){st.deadT-=dt;e.goal=null;e.vel.x*=.3;e.vel.y*=.3;e.vel.z*=.3;e.hp=Math.min(e.maxHp,e.hp+dt*.4);st.lastHp=e.hp;return true;}
  if(!e.inWater||e.baby)return false;
  const foe=manager.list.find(o=>!o.dead&&!o.gone&&['drowned','aquatic_guardian','elder_guardian'].includes(o.sp)&&Math.hypot(o.pos.x-e.pos.x,o.pos.y-e.pos.y,o.pos.z-e.pos.z)<10);
  if(!foe)return false;
  e._foe=foe;
  e.goal={x:foe.pos.x,y:foe.pos.y+.4,z:foe.pos.z,speed:3};
  if(Math.hypot(foe.pos.x-e.pos.x,foe.pos.y+foe.h/2-e.pos.y,foe.pos.z-e.pos.z)<1.8+foe.w/2&&e.attackCd<=0){manager.damage(foe,2,e);e.attackCd=1;}
  return true;
}
// A Sniffer sniffs the ground (head down), then digs, and finds an ancient seed: Torchflower Seeds or a Pitcher Pod. About every 5 minutes.
function thinkSniffer(manager,e,st,dt){
  const ctx=manager.ctx,w=manager.world;
  if(e.baby)return false;
  if(st.phase){
    st.t-=dt;e.goal=null;e.vel.x*=.4;e.vel.z*=.4;e.grazeT=.3;
    if(st.phase==='dig'&&Math.random()<.4)ctx.particles(e.pos.x-Math.sin(e.yaw)*1.2,e.pos.y+.2,e.pos.z-Math.cos(e.yaw)*1.2,'poof');
    if(st.t<=0){
      if(st.phase==='sniff'){st.phase='dig';st.t=2.5;Sound.mob('snort',manager.dist(e));}
      else{st.phase=null;st.digT=300;ctx.drop(Math.random()<.5?I.TORCHFLOWER_SEEDS:I.PITCHER_POD,1,e.pos.x-Math.sin(e.yaw)*1.2,e.pos.y+.4,e.pos.z-Math.cos(e.yaw)*1.2);ctx.adv?.('sniffer');}
    }
    return true;
  }
  st.digT=(st.digT??60+Math.random()*120)-dt;
  if(st.digT<=0&&e.onGround){
    const below=w.id(Math.floor(e.pos.x),Math.floor(e.pos.y)-1,Math.floor(e.pos.z));
    if([B.GRASS,B.DIRT,B.MUD,B.PODZOL,B.MOSS].filter(Boolean).includes(below)){st.phase='sniff';st.t=3;}
    else st.digT=10;
  }
  return false;
}
// Silverfish slip into nearby Stone to hide (it becomes Infested Stone) when nobody is close. Hurting one wakes the others hiding nearby.
function thinkSilverfish(manager,e,st,d,dt){
  const w=manager.world,bx=Math.floor(e.pos.x),by=Math.floor(e.pos.y),bz=Math.floor(e.pos.z);
  if(st.lastHp!==undefined&&e.hp<st.lastHp&&!e.dead){
    let woke=0;
    for(let x=-4;x<=4&&woke<5;x++)for(let y=-2;y<=2&&woke<5;y++)for(let z=-4;z<=4&&woke<5;z++)if(w.id(bx+x,by+y,bz+z)===B.INFESTED_STONE){w.set(bx+x,by+y,bz+z,B.STONE);manager.add('silverfish',bx+x+.5,by+y,bz+z+.5);woke++;}
  }
  st.lastHp=e.hp;
  if((manager.targetable()&&d<12)||e.persist||e.tame)return false;
  st.hideT=(st.hideT??3)-dt;
  if(st.hideT>0)return false;
  st.hideT=2+Math.random()*3;
  if(Math.random()<.5)return false;
  for(const [x,y,z] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0],[1,-1,0],[-1,-1,0]])if(w.id(bx+x,by+y,bz+z)===B.STONE){
    w.set(bx+x,by+y,bz+z,B.INFESTED_STONE);manager.ctx.particles(bx+x+.5,by+y+.5,bz+z+.5,'poof');e.gone=true;return true;
  }
  return false;
}
// A Ravager tramples leaves and crops in its way. If its bite hits a raised shield it's stunned for 2 seconds, then it roars:
// everything within 4 blocks is hurt and thrown back (other raiders aren't hurt).
const RAIDERS=new Set(['ravager','pillager','vindicator','evoker','witch','vex']);
function thinkRavager(manager,e,st,p,d,dt,difficulty){
  const w=manager.world,ctx=manager.ctx;
  if(st.stunT>0){
    if(e.raiderRig)e.raiderPrep=true;
    st.stunT-=dt;e.goal=null;e.vel.x*=.3;e.vel.z*=.3;
    if(Math.random()<.3)ctx.particles(e.pos.x,e.pos.y+e.h+.3,e.pos.z,'crit');
    if(st.stunT<=0){
      if(e.raiderRig){
        e.raiderPrep=false;e.raiderReleaseAt=e.age;e.raiderDischarge='roar';
      }
      Sound.mob('roar',d);
      if(d<4&&manager.targetable()){const hx=p.pos.x-e.pos.x,hz=p.pos.z-e.pos.z,l=Math.hypot(hx,hz)||1;ctx.hurtPlayer(6*difficulty,'The Ravager roared and knocked you back!',e);ctx.push(hx/l*10,5,hz/l*10);}
      for(const o of manager.list){if(o===e||o.dead||o.gone||RAIDERS.has(o.sp)||o.def.boss||o.def.object)continue;const hx=o.pos.x-e.pos.x,hz=o.pos.z-e.pos.z,l=Math.hypot(hx,hz);if(l>=4)continue;manager.damage(o,6,e);o.vel.x+=hx/(l||1)*10;o.vel.z+=hz/(l||1)*10;o.vel.y=Math.max(o.vel.y,5);o.knock=.5;}
    }
    return true;
  }
  st.chompT=(st.chompT??0)-dt;
  if(st.chompT<=0&&Math.hypot(e.vel.x,e.vel.z)>.5){
    st.chompT=.3;
    const fx=Math.floor(e.pos.x-Math.sin(e.yaw)*(e.w/2+.5)),fz=Math.floor(e.pos.z-Math.cos(e.yaw)*(e.w/2+.5)),fy=Math.floor(e.pos.y);
    for(let k=0;k<3;k++){const id=w.id(fx,fy+k,fz),bd=BLOCKS[id];if(bd&&(/Leaves$/.test(bd.name)||bd.shape==='crop')){w.set(fx,fy+k,fz,B.AIR);ctx.particles(fx+.5,fy+k+.5,fz+.5,'poof');}}
  }
  return false;
}
// A Zoglin attacks every creature it can reach (except Hissers and other Zoglins), not just you.
function thinkZoglin(manager,e,st,d,difficulty){
  if(manager.targetable()&&d<16)return false;
  let prey=null,best=12;
  for(const o of manager.list){
    if(o===e||o.dead||o.gone||o.def.object||o.def.boss||o.def.static||o.sp==='zoglin'||o.sp==='creeper'||o.def.flies||Math.abs(o.pos.y-e.pos.y)>=4)continue;
    const dd=Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z);if(dd<best){best=dd;prey=o;}
  }
  if(!prey)return false;
  manager.chase(e,prey.pos);
  if(Math.hypot(prey.pos.x-e.pos.x,prey.pos.z-e.pos.z)<1.4+(prey.w+e.w)/2&&e.attackCd<=0){manager.damage(prey,6,e);prey.vel.y=Math.max(prey.vel.y,4);prey.knock=.4;e.attackCd=1.2;}
  return true;
}

// ----- Milestone 24, Part C: the Breeze, bats, pandas and ocelots -----
// The Breeze bounces around on the ground (circling you at 5-12 blocks) and fires Wind Charges that sting and throw you back.
function thinkBreeze(manager,e,st,def,p,d,difficulty,dt,attackable){
  st.hopT=(st.hopT??1+Math.random()*2)-dt;
  if(e.onGround&&st.hopT<=0){
    st.hopT=1.2+Math.random()*2.3;
    let ax=Math.random()-.5,az=Math.random()-.5;
    if(attackable){const dx=p.pos.x-e.pos.x,dz=p.pos.z-e.pos.z,l=Math.hypot(dx,dz)||1,side=Math.random()<.5?1:-1,toward=d>12?1:d<5?-1:0;ax=-dz/l*side+dx/l*toward*1.5;az=dx/l*side+dz/l*toward*1.5;}
    const al=Math.hypot(ax,az)||1;e.vel.x=ax/al*4;e.vel.z=az/al*4;e.vel.y=7+Math.random()*4;e.knock=.6;e.goal=null;Sound.mob('warble',d);
  }
  if(!attackable){if(e.onGround&&!(e.knock>0))manager.wander(e);return true;}
  e.goal=null;e.yaw=Math.atan2(-(p.pos.x-e.pos.x),-(p.pos.z-e.pos.z));
  if(e.attackCd<=0&&d<16&&manager.canSeePlayer(e)){
    const dx=p.pos.x-e.pos.x,dy=p.pos.y+.9-e.eyeY,dz=p.pos.z-e.pos.z,speed=14/(Math.hypot(dx,dy,dz)||1);
    manager.addProjectile('windburst',e.pos.x,e.eyeY,e.pos.z,dx*speed,dy*speed,dz*speed,{owner:e,dmg:1*difficulty,noGrav:true});
    e.attackCd=2.5;Sound.mob('cast',d);
  }
  return true;
}
// Bats flit about. Under a ceiling they may hang upside down to rest (most of all in the daytime); you waking one up comes from walking within 4 blocks.
function thinkBat(manager,e,st,p,d,dt,daylight){
  const w=manager.world,bx=Math.floor(e.pos.x),bz=Math.floor(e.pos.z);
  if(st.roost){
    const cy=st.roost;
    if(!SOLID[w.id(bx,cy,bz)]||(d<4&&!manager.ctx.creative())){st.roost=0;st.restT=5+Math.random()*10;e.vel.y=-1;return true;}
    e.goal=null;e.vel.x=e.vel.y=e.vel.z=0;e.pos.y=cy-e.h;return true;
  }
  st.restT=(st.restT??3)-dt;
  st.flitT=(st.flitT??0)-dt;
  if(st.flitT<=0){
    st.flitT=.6+Math.random()*1.2;
    const x=e.pos.x+(Math.random()-.5)*6,z=e.pos.z+(Math.random()-.5)*6,y=e.pos.y+(Math.random()-.4)*3;
    e.goal={x,y,z,speed:e.def.speed*1.4};
  }
  if(st.restT<=0){
    st.restT=2;
    const top=Math.floor(e.pos.y+e.h+.3);
    if(SOLID[w.id(bx,top,bz)]&&!SOLID[w.id(bx,top-1,bz)]&&d>5&&Math.random()<(daylight>.5?.6:.2)){st.roost=top;e.pos.x=bx+.5;e.pos.z=bz+.5;}
    else if(SOLID[w.id(bx,top+1,bz)]||SOLID[w.id(bx,top+2,bz)])e.goal={x:e.pos.x,y:e.pos.y+1.5,z:e.pos.z,speed:e.def.speed};   // a ceiling close above: fly up to it
  }
  return true;
}
// Pandas each have a mood: normal, lazy (lies down for naps), worried (hides its face in thunderstorms), playful (rolls over),
// aggressive (fights back when hit) or weak (sneezes). Baby pandas sneeze too, and a sneeze can shake loose a Gloop Ball.
const PANDA_MOODS=[['normal',.4],['lazy',.15],['worried',.15],['playful',.15],['aggressive',.1],['weak',.05]];
function thinkPanda(manager,e,st,p,d,dt,difficulty){
  const ctx=manager.ctx;
  if(!st.mood){let r=Math.random();st.mood=(PANDA_MOODS.find(([,c])=>(r-=c)<0)||PANDA_MOODS[0])[0];}
  if(st.mood==='aggressive'&&e.hurtT>0&&!e.tame)e.angry=10;
  if(e.angry>0&&st.mood==='aggressive'&&manager.targetable()){
    st.animT=0;manager.chase(e,p.pos);
    if(d<2.3&&e.attackCd<=0){ctx.hurtPlayer(6*difficulty,'An angry panda swatted you!',e);e.attackCd=1.5;}
    return true;
  }
  if(e.baby||st.mood==='weak'){
    st.sneezeT=(st.sneezeT??20+Math.random()*60)-dt;
    if(st.sneezeT<=0){st.sneezeT=40+Math.random()*80;st.anim='sneeze';st.animT=.8;ctx.particles(e.pos.x,e.pos.y+1,e.pos.z,'poof');Sound.mob('squeak',d);
      if(Math.random()<.7)ctx.drop(I.GLOOP_BALL,1,e.pos.x,e.pos.y+.8,e.pos.z);}
  }
  if(st.mood==='worried'&&ctx.thunder?.()){st.anim='hide';st.animT=1;}
  if(st.mood==='lazy'){st.lazyT=(st.lazyT??10+Math.random()*20)-dt;if(st.lazyT<=0&&!(st.animT>0)){st.lazyT=25+Math.random()*40;st.anim='lie';st.animT=8+Math.random()*10;}}
  if(st.mood==='playful'){st.rollT=(st.rollT??5+Math.random()*10)-dt;if(st.rollT<=0&&!(st.animT>0)&&e.onGround){st.rollT=8+Math.random()*15;st.anim='roll';st.animT=1;e.vel.x=-Math.sin(e.yaw)*3;e.vel.z=-Math.cos(e.yaw)*3;e.knock=.6;}}
  if(st.animT>0){
    st.animT-=dt;e.goal=null;
    if(st.anim==='hide')e.grazeT=.3;
    if(st.anim!=='roll'){e.vel.x*=.4;e.vel.z*=.4;}
    if(st.animT<=0)st.anim=null;
    return true;
  }
  return false;
}
// Ocelots are shy until you win their trust (feed them raw fish: 1 try in 3 works). They hunt chickens,
// and Hissers keep away from them.
function thinkOcelot(manager,e,st,dt){
  if(e.baby)return false;
  const prey=manager.list.find(o=>o.sp==='chicken'&&!o.dead&&!o.gone&&!o.tame&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<10&&Math.abs(o.pos.y-e.pos.y)<3);
  if(!prey)return false;
  e.goal={x:prey.pos.x,z:prey.pos.z,speed:e.def.speed*1.5};
  if(Math.hypot(prey.pos.x-e.pos.x,prey.pos.z-e.pos.z)<1.2&&e.attackCd<=0){manager.damage(prey,3,e);e.attackCd=1;}
  return true;
}

// ----- Milestone 24, Part B: goats, Snow Golems and polar bears -----
// Goats ram now and then (a player in Survival, or another creature), every 30 s to 5 min (a rare "screaming" goat much more often).
// A goat that rams into stone, ore, logs or ice loses a horn: it drops as a Goat Horn. Goats also take big leaps.
const ramBlock=id=>id===B.STONE||id===B.ICE||id===B.PACKED_ICE||id===B.BLUE_ICE||/ (Log|Ore)$/.test(BLOCKS[id]?.name||'');
function endRam(st){st.ram=null;st.ramT=st.scream?5+Math.random()*10:30+Math.random()*270;}
function thinkGoat(manager,e,st,p,d,dt){
  if(e.baby||e.ridden)return false;
  const ctx=manager.ctx,w=manager.world;
  st.horns??=2;st.scream??=Math.random()<.02;st.ramT??=st.scream?5+Math.random()*10:30+Math.random()*270;
  const r=st.ram;
  if(r){
    const tgt=r.player?p:r.target;
    if(!tgt||(!r.player&&(tgt.dead||tgt.gone))||(r.player&&!manager.targetable())){endRam(st);return false;}
    r.t+=dt;
    if(r.phase==='aim'){   // lower its head and line up, then charge
      const dx=tgt.pos.x-e.pos.x,dz=tgt.pos.z-e.pos.z,l=Math.hypot(dx,dz)||1;r.dx=dx/l;r.dz=dz/l;
      e.goal=null;e.vel.x*=.4;e.vel.z*=.4;e.yaw=Math.atan2(-r.dx,-r.dz);e.grazeT=.3;
      if(r.t>1.1){r.phase='run';r.t=0;Sound.mob(st.scream?'scream':'snort',d);}
      return true;
    }
    e.goal=null;e.yaw=Math.atan2(-r.dx,-r.dz);e.grazeT=.3;
    e.vel.x=r.dx*7;e.vel.z=r.dz*7;e.knock=.3;
    const near=Math.hypot(tgt.pos.x-e.pos.x,tgt.pos.z-e.pos.z)<1.1+(tgt.w||.6)/2&&Math.abs(tgt.pos.y-e.pos.y)<1.5;
    if(near){
      if(r.player){ctx.hurtPlayer(2,'A goat rammed you!',e);ctx.push(r.dx*10,5,r.dz*10);}
      else{manager.damage(tgt,2,e);tgt.vel.x+=r.dx*10;tgt.vel.z+=r.dz*10;tgt.vel.y=Math.max(tgt.vel.y,5);tgt.knock=.5;}
      Sound.mob('clank',d);endRam(st);return true;
    }
    if(r.t>.35&&Math.hypot(e.pos.x-r.lx,e.pos.z-r.lz)<.15){   // it stopped: it hit something
      const fx=Math.floor(e.pos.x+r.dx*(e.w/2+.5)),fz=Math.floor(e.pos.z+r.dz*(e.w/2+.5)),fy=Math.floor(e.pos.y);
      const hit=[0,1].map(k=>w.id(fx,fy+k,fz)).find(ramBlock);
      if(hit&&st.horns>0){st.horns--;ctx.drop(I.GOAT_HORN,1,e.pos.x-r.dx*.4,e.pos.y+1,e.pos.z-r.dz*.4);ctx.particles(e.pos.x+r.dx,e.pos.y+1,e.pos.z+r.dz,'poof');}
      Sound.mob('clank',d);endRam(st);return true;
    }
    r.lx=e.pos.x;r.lz=e.pos.z;
    if(r.t>2.5)endRam(st);
    return true;
  }
  st.ramT-=dt;
  if(st.ramT<=0){
    let target=null,player=false;
    if(manager.targetable()&&d<16&&manager.canSeePlayer(e))player=true;
    else target=manager.list.find(o=>o!==e&&!o.dead&&!o.gone&&o.sp!=='goat'&&!o.def.object&&!o.def.boss&&!o.def.flies&&!o.def.swims&&!o.ridden&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<12);
    if(player||target){st.ram={phase:'aim',t:0,player,target,dx:0,dz:1,lx:e.pos.x,lz:e.pos.z};return true;}
    st.ramT=5;
  }
  st.leapT=(st.leapT??8+Math.random()*12)-dt;
  if(st.leapT<=0&&e.onGround){st.leapT=10+Math.random()*20;e.vel.y=8;e.vel.x=-Math.sin(e.yaw)*4;e.vel.z=-Math.cos(e.yaw)*4;e.knock=.6;}
  return false;
}
// Snow Golems throw snowballs at monsters within 10 blocks (once a second). Snowballs don't hurt, they push monsters back
// (fiery creatures take damage). They leave snow where it's cool enough, and melt in hot places, rain and water.
const COOL=new Set(['forest','birch','taiga','snowy_plains','peak','mountain','dark_forest','cherry_grove','frozen_ocean']);
const HOT=new Set(['sandy','badlands','savanna']);
function thinkSnowGolem(manager,e,st,dt){
  const ctx=manager.ctx,w=manager.world,bx=Math.floor(e.pos.x),by=Math.floor(e.pos.y+.05),bz=Math.floor(e.pos.z);
  const biome=w.biomeAt?.(bx,bz)||w.gen.column?.(bx,bz)?.biome;
  const hot=w.gen.isNether()||HOT.has(biome),wet=e.inWater||ctx.inRain?.(e.pos.x,e.eyeY,e.pos.z);
  if(hot||wet){st.meltT=(st.meltT??1)-dt;if(st.meltT<=0){st.meltT=1;e.iframes=0;manager.damage(e,1,null);if(Math.random()<.5)ctx.particles(e.pos.x,e.pos.y+1,e.pos.z,'poof');}}
  if(e.onGround&&COOL.has(biome)&&(st.cell!==bx+','+bz)){
    st.cell=bx+','+bz;
    if(!w.id(bx,by,bz)&&SOLID[w.id(bx,by-1,bz)]&&(BLOCKS[w.id(bx,by-1,bz)]?.shape||'cube')==='cube')w.set(bx,by,bz,B.SNOW_LAYER);
  }
  const foe=manager.list.find(o=>o.def.hostile&&!o.tame&&!o.dead&&!o.gone&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<10&&Math.abs(o.pos.y-e.pos.y)<6);
  if(foe&&e.attackCd<=0){
    const sx=e.pos.x,sy=e.eyeY-.2,sz=e.pos.z,dx=foe.pos.x-sx,dz=foe.pos.z-sz,horiz=Math.hypot(dx,dz)||.01,speed=16,t=Math.max(.1,horiz/speed);
    const vy=(foe.pos.y+foe.h*.6-sy)/t+.5*20*t;
    manager.addProjectile('snowball',sx+dx/horiz*.5,sy,sz+dz/horiz*.5,dx/horiz*speed,vy,dz/horiz*speed,{owner:e,golemBall:true});
    e.attackCd=1;e.yaw=Math.atan2(-dx,-dz);e.goal=null;return true;
  }
  manager.wander(e);return true;
}
// A grown polar bear gets angry if you come close while one of its cubs is near. About 1 in 4 grown bears has a cub with it.
function guardCubs(manager,e,st,d){
  if(st.cub===undefined){
    st.cub=Math.random()<.25;
    if(st.cub)manager.add('polar_bear',e.pos.x+1,e.pos.y,e.pos.z+.5,{baby:true,persist:e.persist});
  }
  if(d<8&&manager.targetable()&&manager.list.some(o=>o.sp==='polar_bear'&&o.baby&&!o.dead&&!o.gone&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<10)){
    if(!(e.angry>0))Sound.mob('roar',d);
    e.angry=Math.max(e.angry||0,4);
  }
}

// ----- Milestone 24, Part A: Phantoms, Vexes and Evokers -----
// A Phantom circles high above you, then swoops down to bite and climbs away again. Hitting it during a swoop sends it back up.
function thinkPhantom(manager,e,st,def,p,d,difficulty,dt){
  const ctx=manager.ctx;
  if(!manager.targetable()||d>64){st.mode='circle';manager.wander(e);return true;}
  st.r??=8+Math.random()*5;st.h??=12+Math.random()*6;st.ang??=Math.random()*Math.PI*2;
  if(st.mode==='swoop'){
    st.dive-=dt;
    e.goal={x:p.pos.x,y:p.pos.y+.7,z:p.pos.z,speed:def.speed*1.7};
    const reach=Math.hypot(p.pos.x-e.pos.x,p.pos.y+.9-e.pos.y,p.pos.z-e.pos.z);
    if(reach<1.7&&e.attackCd<=0){ctx.hurtPlayer(def.dmg*difficulty,'A Phantom swooped down and bit you! Sleep in a bed to keep Phantoms away.',e);e.attackCd=1;st.mode='rise';st.dive=2.5;}
    else if(st.dive<=0||e.hurtT>0){st.mode='rise';st.dive=2.5;}
  }else if(st.mode==='rise'){
    st.dive-=dt;
    const dx=e.pos.x-p.pos.x,dz=e.pos.z-p.pos.z,len=Math.hypot(dx,dz)||1;
    e.goal={x:p.pos.x+dx/len*st.r,y:p.pos.y+st.h,z:p.pos.z+dz/len*st.r,speed:def.speed};
    if(st.dive<=0){st.mode='circle';st.ang=Math.atan2(dz,dx);}
  }else{
    st.mode='circle';
    st.ang+=dt*.5;
    e.goal={x:p.pos.x+Math.cos(st.ang)*st.r,y:p.pos.y+st.h,z:p.pos.z+Math.sin(st.ang)*st.r,speed:def.speed};
    st.swoopT=(st.swoopT??4+Math.random()*4)-dt;
    if(st.swoopT<=0&&manager.canSeePlayer(e)){st.swoopT=5+Math.random()*5;st.mode='swoop';st.dive=4;Sound.mob('scream',d);}
  }
  return true;
}
// A Vex flies straight through walls. It hovers near you, then darts in to strike. A summoned Vex fades away after 30 to 120 seconds.
function thinkVex(manager,e,st,def,p,d,difficulty,dt){
  const ctx=manager.ctx;
  if(st.life!==undefined){st.life-=dt;if(st.life<=0){st.fadeT=(st.fadeT??0)-dt;if(st.fadeT<=0){st.fadeT=1;e.iframes=0;manager.damage(e,1,null);}}}
  if(!manager.targetable()||d>24){
    const home=st.home||[e.pos.x,e.pos.y,e.pos.z];st.home=home;
    e.goal={x:home[0]+Math.cos(e.age*.6)*4,y:home[1]+1+Math.sin(e.age)*.8,z:home[2]+Math.sin(e.age*.6)*4,speed:2};return true;
  }
  if(st.dash>0){
    st.dash-=dt;
    e.goal={x:p.pos.x,y:p.pos.y+1,z:p.pos.z,speed:9};
    if(Math.hypot(p.pos.x-e.pos.x,p.pos.y+1-e.pos.y,p.pos.z-e.pos.z)<1.3&&e.attackCd<=0){ctx.hurtPlayer(def.dmg*difficulty,'A Vex struck you!',e);e.attackCd=1.2;st.dash=0;}
    return true;
  }
  const a=e.age*1.3+(e.uid?String(e.uid).length:0);
  e.goal={x:p.pos.x+Math.cos(a)*3,y:p.pos.y+2.2,z:p.pos.z+Math.sin(a)*3,speed:4};
  st.wait=(st.wait??1+Math.random()*2)-dt;
  if(st.wait<=0){st.wait=2+Math.random()*2;st.dash=1.2;Sound.mob('chitter',d);}
  return true;
}
// An Evoker keeps its distance and casts spells: a line of fangs along the ground toward you (a ring of fangs if you're close),
// or 3 Vexes (every 17 seconds, if there are fewer than 8 around). It stands still and glows while it casts.
function groundAt(w,x,y0,z){
  const bx=Math.floor(x),bz=Math.floor(z);
  for(let y=Math.floor(y0)+1;y>=Math.floor(y0)-4;y--)if(SOLID[w.id(bx,y-1,bz)]&&!SOLID[w.id(bx,y,bz)])return y;
  return null;
}
function thinkEvoker(manager,e,st,def,p,d,difficulty,dt,attackable){
  const w=manager.world;
  if(!attackable&&!(st.cast>0)){manager.wander(e);return true;}
  st.vexT=(st.vexT??2)-dt;st.fangT=(st.fangT??1)-dt;
  if(st.cast>0){
    st.cast-=dt;e.goal=null;e.vel.x*=.5;e.vel.z*=.5;e.yaw=Math.atan2(-(p.pos.x-e.pos.x),-(p.pos.z-e.pos.z));
    if(Math.random()<.6)manager.ctx.particles(e.pos.x+(Math.random()-.5),e.pos.y+2.1,e.pos.z+(Math.random()-.5),st.spell==='vex'?'crystal':'pale');
    if(st.cast>0){
      if(e.raiderRig)e.raiderPrep=true;
      return true;
    }
    if(e.raiderRig){
      e.raiderPrep=false;e.raiderReleaseAt=e.age;
      e.raiderDischarge=st.spell==='vex'?'summon':'fangs';
      e.raiderSummonOrigin=null;
    }
    if(st.spell==='vex'){
      for(let k=0;k<3;k++){
        const v=manager.add('vex',e.pos.x+(Math.random()-.5)*2,e.pos.y+1.5,e.pos.z+(Math.random()-.5)*2,{bestiary:{life:30+Math.random()*89}});
        if(v){
          v.persist=false;
          if(e.raiderRig&&!e.raiderSummonOrigin)e.raiderSummonOrigin={...v.pos};
        }
      }
      Sound.mob('wail',d);
    }else{
      const dmg=6*difficulty;
      if(d<3){   // a ring of fangs around itself
        for(let k=0;k<5;k++){const a=k/5*Math.PI*2,x=e.pos.x+Math.cos(a)*1.5,z=e.pos.z+Math.sin(a)*1.5,y=groundAt(w,x,e.pos.y,z);if(y!==null)manager.addFang(Math.floor(x)+.5,y,Math.floor(z)+.5,0,e,dmg);}
        for(let k=0;k<8;k++){const a=k/8*Math.PI*2+.4,x=e.pos.x+Math.cos(a)*2.5,z=e.pos.z+Math.sin(a)*2.5,y=groundAt(w,x,e.pos.y,z);if(y!==null)manager.addFang(Math.floor(x)+.5,y,Math.floor(z)+.5,.15,e,dmg);}
      }else{   // a line of 16 fangs toward you
        const dx=p.pos.x-e.pos.x,dz=p.pos.z-e.pos.z,len=Math.hypot(dx,dz)||1;
        let y=e.pos.y;
        for(let k=0;k<16;k++){const x=e.pos.x+dx/len*(1.25+k*1.25),z=e.pos.z+dz/len*(1.25+k*1.25),g=groundAt(w,x,y,z);if(g===null)continue;y=g;manager.addFang(x,g,z,k*.05,e,dmg);}
      }
    }
    return true;
  }
  // keep 8-14 blocks away: back off when you come close, step in when you're far
  const dx=p.pos.x-e.pos.x,dz=p.pos.z-e.pos.z,len=Math.hypot(dx,dz)||1;
  if(d<8)e.goal={x:e.pos.x-dx/len*6,z:e.pos.z-dz/len*6,speed:def.speed*1.3};
  else if(d>14)manager.chase(e,p.pos);
  else{e.goal=null;e.yaw=Math.atan2(-dx,-dz);}
  const vexes=manager.list.filter(o=>o.sp==='vex'&&!o.dead&&!o.gone&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<16).length;
  if(st.vexT<=0&&vexes<8){st.spell='vex';st.cast=1.2;st.vexT=17;Sound.mob('cast',d);}
  else if(st.fangT<=0&&d<20){st.spell='fangs';st.cast=.8;st.fangT=5;Sound.mob('cast',d);}
  if(e.raiderRig)e.raiderPrep=st.cast>0;
  return true;
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
  if(e.sp==='ocelot'&&!e.bestiary.trust&&(id===I.RAW_MINNOW||id===I.RAW_SALMON)){   // Milestone 24, Part C
    ctx.consume();
    if(Math.random()<1/3){e.bestiary.trust=true;e.persist=true;ctx.particles(e.pos.x,e.pos.y+.8,e.pos.z,'heart');ctx.toast('The Ocelot trusts you now. It won\'t run away, and Hissers stay away from it.');ctx.adv?.('ocelot');}
    else ctx.particles(e.pos.x,e.pos.y+.8,e.pos.z,'poof');
    return true;
  }
  if(e.sp==='snow_golem'&&id===I.SHEARS&&!e.bestiary.sheared){   // Milestone 24, Part B
    e.bestiary.sheared=true;ctx.drop(B.CARVED_PUMPKIN,1,e.pos.x,e.pos.y+2,e.pos.z);ctx.wear?.();return true;
  }
  if(e.sp==='mooshroom'&&id===I.BUCKET&&!e.baby){ctx.swapHeld(I.MILK_BUCKET);return true;}
  if(e.sp==='sulfur_cube'&&!e.bestiary.absorbed&&id&&id<256){
    ctx.consume();e.bestiary.absorbed=id;ctx.toast('The Sulfur Cube absorbed the block. Hit it to bounce it away!');return true;
  }
  return false;
}

// Milestone 17, Part C: while you're in or right next to an Ocean Monument, Guardians swim in to guard its big hall (up to 6 near you)
function spawnMonumentGuardian(manager,w,p,living,species){
  const s=w.monumentAt?.(Math.floor(p.pos.x/16),Math.floor(p.pos.z/16));
  if(!s||manager.ctx.settings().difficulty==='peaceful'||manager.ctx.creative())return false;
  if(p.pos.x<s.x0-8||p.pos.x>s.x0+MONUMENT_SIZE+8||p.pos.z<s.z0-8||p.pos.z>s.z0+MONUMENT_SIZE+8)return false;
  manager.ctx.adv?.('monument');   // Milestone 17, Part E
  if(living.filter(e=>e.sp==='aquatic_guardian'&&Math.hypot(e.pos.x-p.pos.x,e.pos.z-p.pos.z)<40).length>=6)return true;
  for(let t=0;t<6;t++){
    const x=s.x0+HALL.x0+Math.floor(Math.random()*(HALL.x1-HALL.x0+1)),z=s.z0+HALL.z0+Math.floor(Math.random()*(HALL.z1-HALL.z0+1)),y=s.y0+HALL.y0+1+Math.floor(Math.random()*6);
    if(Math.hypot(x-p.pos.x,z-p.pos.z)<8||!w.isLoaded(x,z))continue;
    if(w.id(x,y,z)!==B.WATER||w.id(x,y+1,z)!==B.WATER)continue;
    manager.add('aquatic_guardian',x+.5,y,z+.5);return true;
  }
  return true;
}
// Milestone 24, Part A: after 3 or more days without sleep, Phantoms may come at night when you're under the open sky
// (a bigger chance the longer you stay awake; 1-2 on Easy, up to 3 on Normal, up to 4 on Hard). Sleeping or dying resets the count.
function spawnPhantoms(manager,w,p,living,daylight){
  const ctx=manager.ctx;
  manager.phantomT=(manager.phantomT??30)-5;
  if(manager.phantomT>0)return false;
  manager.phantomT=60+Math.random()*60;
  const awake=ctx.restless?.()||0,diff=ctx.settings().difficulty;
  if(awake<3||daylight>=.45||diff==='peaceful'||ctx.creative()||!ctx.alive())return false;
  if(w.gen.isNether()||w.gen.isEnd?.()||w.gen.isForsaken||w.gen.isMap?.())return false;
  if(Math.random()>1-3/awake)return false;
  const px=Math.floor(p.pos.x),pz=Math.floor(p.pos.z);
  if(w.surfaceY(px,pz)>p.pos.y+.5)return false;   // a roof over your head keeps them away
  if(living.filter(e=>e.sp==='phantom').length>=6)return false;
  const n=1+Math.floor(Math.random()*({easy:2,normal:3,hard:4}[diff]||3));
  let made=0;
  for(let k=0;k<n;k++){
    const x=p.pos.x+(Math.random()-.5)*20,z=p.pos.z+(Math.random()-.5)*20,y=Math.min(250,p.pos.y+20+Math.random()*14);
    if(!w.isLoaded(Math.floor(x),Math.floor(z))||SOLID[w.id(Math.floor(x),Math.floor(y),Math.floor(z))])continue;
    if(manager.add('phantom',x,y,z))made++;
  }
  if(made&&!manager.phantomTold){manager.phantomTold=true;ctx.toast('Phantoms are coming! You haven\'t slept in '+Math.floor(awake)+' days. Sleep in a bed to keep them away.');}
  return made>0;
}
export function spawnCreatures(manager,dt,daylight,species) {
  manager.bestiarySpawnT=(manager.bestiarySpawnT||0)-dt;
  if(manager.bestiarySpawnT>0)return;
  manager.bestiarySpawnT=5;
  const w=manager.world,p=manager.ctx.player(),living=manager.list.filter(e=>!e.dead&&!e.gone);
  if(spawnMonumentGuardian(manager,w,p,living,species))return;   // Milestone 17, Part C
  if(spawnPhantoms(manager,w,p,living,daylight))return;   // Milestone 24, Part A
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
  const nb=w.biomeAt?.(x,z);   // Milestone 20, Part E: no monsters in mushroom fields; axolotls and frogs by their homes
  if(nb==='mushroom_fields')for(const h of [...habitats])if(/Night$|^night$/.test(h))habitats.delete(h);
  if(water&&(nb==='swamp'||w.caveBiomeAt?.(x,z)==='lush_caves'))habitats.add('lushwater');
  const pool=CREATURES.filter(([id,,,,habitat])=>!species[id].noNatural&&(habitats.has(habitat)||(habitats.has('lushwater')&&['axolotl','tadpole','frog'].includes(id)))&&
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
