import { B, I } from "./blocks.js";
import { canArrive, nearbyLanding } from "./forsaken-gateway.js";

export const REIGN_VERSION = 1;
export const REIGN_HEALTH = 150;
export const REIGN_PHASES = ["The Watcher", "The Corrupted", "The Forsaken King", "The Shadow", "The Anomaly"];
export const REIGN_SKINS = ["herobrine", "forsaken_king"];
export const REIGN_ACHIEVEMENT = "Conqueror of the Forsaken";
const THRESHOLDS = [150,120,90,60,30,0];
const LOOT = [
  [I.FORSAKEN_BLADE,1], [I.HEROBRINE_CROWN,1], [B.HEROBRINE_TROPHY,1], [I.CORRUPTION_CRYSTAL,5],
  [I.FORSAKEN_HELMET,1], [I.FORSAKEN_CHEST,1], [I.FORSAKEN_LEGS,1], [I.FORSAKEN_BOOTS,1],
];
const LOOT_MASK = (1 << LOOT.length)-1;

export function validReign(r) {
  if (r?.version !== REIGN_VERSION || !["ready","active","won"].includes(r.status) ||
      typeof r.introSeen !== "boolean" || typeof r.checkpoint !== "boolean" ||
      !Number.isInteger(r.claimed) || r.claimed<0 || r.claimed>LOOT_MASK ||
      !Number.isInteger(r.summoned) || r.summoned<0 || r.summoned>3) return false;
  if (r.status==="won") return r.hp===0 && r.phase===4 && r.checkpoint && Number.isSafeInteger(r.victory) && r.victory>0;
  if (r.claimed || r.victory || r.status==="ready" && (r.hp !== REIGN_HEALTH || r.phase!==0 || r.summoned!==0)) return false;
  return Number.isInteger(r.phase) && r.phase>=0 && r.phase<5 && Number.isFinite(r.hp) &&
    r.hp<=THRESHOLDS[r.phase] && r.hp>THRESHOLDS[r.phase+1];
}

export function reignWon(fw) { return fw?.reign?.status==="won" && validReign(fw.reign); }
export function reignGatewaysUnlocked(fw) { return reignWon(fw) || fw?.legacyGatewayUnlock===true || fw?.legacySurvivalVictory!==false && Number.isSafeInteger(fw?.banished) && fw.banished>0 && !!fw.rewarded; }

export function beginReign(previous) {
  return { version:REIGN_VERSION, status:"active", phase:0, hp:REIGN_HEALTH, claimed:0,
    introSeen:!!previous?.introSeen, checkpoint:true, summoned:0 };
}

export function hitReign(r, amount, stamp) {
  if (r.status!=="active" || !Number.isFinite(amount) || amount<=0) return 0;
  const previous = r.hp, threshold = THRESHOLDS[r.phase+1];
  r.hp = Math.max(threshold,previous-amount);
  if (r.hp===0) { r.status="won"; r.victory=stamp; }
  else if (r.hp===threshold) r.phase++;
  return previous-r.hp;
}

export function claimReignLoot(r, inv) {
  if (r?.status!=="won") return 0;
  let given=0;
  for (const [i,[id,count]] of LOOT.entries()) {
    if (r.claimed & 1<<i || !inv.roomFor(id,count)) continue;
    inv.add(id,count);
    r.claimed |= 1<<i;
    given++;
  }
  return given;
}

export function applyReignProfile(profile) {
  return { ...profile, id:"local", conqueror:true, skins:[...new Set([...(profile?.skins || []),...REIGN_SKINS])] };
}

export function reignChapter(fw, gate, fortress, guardianCount, clues) {
  if (reignWon(fw)) return ["VII · Liberation", "Collect the royal cache. Build personal Forsaken gateways from the Overworld."];
  if (fw?.reign?.status==="active") return ["VI · The Reign of Herobrine", "Fight in the Crimson Convergence. Leave the arena to retreat."];
  if (fortress?.gateOpen) return ["V · The Forsaken Fortress", "Read the journals. When prepared, challenge the King at the Convergence altar beyond the throne."];
  if (guardianCount>=5) return ["V · The Forsaken Fortress", fortress?.site===null ? "This world’s protected Vale has no fortress placement. The Pale Citadel route remains available." : "Swear all five oaths at the Vale bridge plinth."];
  if (guardianCount>0 || clues) return ["IV · The Mutant Guardians", `Defeat the five guardians in any order (${guardianCount}/5). Read your chart for their locations.`];
  if (Object.entries(fw?.fallen || {}).some(([,p]) => p?.seen))
    return ["III · The Forgotten Kingdom", "Read the Ashmarket or Briarwatch ledgers for all five guardian routes."];
  if (fw?.kingdomSeen?.woods) return ["III · The Forgotten Kingdom", "Follow the paved ring to abandoned settlements. Their ledgers describe the crystals and guardians."];
  if (fw?.visits || fw?.arrived || fw?.notes?.welcome) return ["II · The Watcher", "Read the ward logbook, then visit the Hollow Woods. Keep an eye on distant ridges."];
  return ["I · The Arrival", gate?.socketed ? "Step through the activated Forsaken Stronghold gateway." : "Find the Forsaken Stronghold and socket a Pale Lantern."];
}

const ATTACKS = [
  ["strike","blink"], ["burst","strike"], ["lightning","strike"], ["shadows","blink"], ["shockwave","burst"]
];
const HINT = {
  strike:"Back away from the held strike", blink:"Watch for the white eyes", burst:"Step out of the violet ring",
  lightning:"Leave the marked lightning rings", shadows:"The solid silhouette is the King", shockwave:"Move clear of the staggered rings",
};
const center = p => ({ x:p.x+.5, y:p.y, z:p.z+.5 });
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const within = (p,a) => !!p && !!a && p.x>=a.restoreMin.x && p.x<a.restoreMax.x+1 &&
  p.z>=a.restoreMin.z && p.z<a.restoreMax.z+1 && p.y>=a.restoreMin.y+.5 && p.y<=a.restoreMax.y+6;

export function initReign(api, hooks) {
  const {G, UI, Sound, ents, saveNow, puff, hurt, keys, giveXp, THREE, scene} = api;
  let boss=null, world=null, time=0, cooldown=0, intro=0, departure=0, attack=null, turn=0, guard=0;
  let images=[], adds=[], defeat=null, debris=null;
  const movingVoxel=new THREE.Object3D();
  function clearDebris(){
    if (!debris) return;
    scene.remove(debris);
    debris.geometry.dispose(); debris.material.dispose(); debris.dispose();
    debris=null;
  }
  function updateDebris() {
    if (state().phase!==4 || soft() || G.settings.quality==="fast" || G.settings.fx==="low") {
      clearDebris(); return;
    }
    if (!debris) {
      debris=new THREE.InstancedMesh(new THREE.BoxGeometry(.19,.19,.19),new THREE.MeshBasicMaterial({color:0x81345e}),10);
      debris.frustumCulled=false;
      scene.add(debris);
    }
    for (let i=0;i<debris.count;i++) {
      const theta=i*2.4+time*.66, radius=2.3+(i%3)*.53, size=.75+(i%4)*.26;
      movingVoxel.position.set(boss.pos.x+Math.cos(theta)*radius,boss.pos.y+.65+(i%5)*.34+Math.sin(theta*1.62)*.4,
        boss.pos.z+Math.sin(theta)*radius);
      movingVoxel.rotation.set(theta*.5,theta,i*.4);
      movingVoxel.scale.setScalar(size);
      movingVoxel.updateMatrix();
      debris.setMatrixAt(i,movingVoxel.matrix);
    }
    debris.instanceMatrix.needsUpdate=true;
  }
  const state=()=>hooks.story().reign;
  const arena=()=>hooks.fortress()?.arena;
  const eligible=()=>G.mode==="survival" && !G.creative && !G.spectator && !G.guest &&
    !G.campaign?.on() && G.wset.difficulty!=="peaceful" && !G.meta?.hardcoreOver;
  const canFight=()=>eligible() && hooks.fortress()?.record.gateOpen && !hooks.legacyActive();
  const soft=()=>G.settings.reducedMotion || G.settings.fwEffects===false;
  const volume=()=>G.settings.fwSudden ?? 1;
  const player=()=>G.player.pos;
  const close=(p,r)=>p && distance(player(),center(p))<=r && Math.abs(player().y-p.y)<3.5;
  const active=()=>state()?.status==="active";
  function showTitle(title) {
    const el=document.getElementById("reignTitle");
    if (el) { el.textContent=title; el.hidden=!title; }
  }
  function face(e,p) { e.yaw=Math.atan2(e.pos.x-p.x,e.pos.z-p.z); }
  function effect(p, type, count=6) {
    for (let i=0; i<(soft()?Math.min(count,3):count); i++) puff(p.x+Math.cos(i*2.4)*.65,p.y+1+Math.sin(i*1.3)*.65,p.z+Math.sin(i*2.4)*.65,type);
  }
  function nearest(p,radius) { return p && nearbyLanding(G.world,center(p),radius); }
  function changeForm(e,i) {
    e.reignForm=i;
    e.mat.map=e.def.texs[i];
    if (e.glowMat) e.glowMat.map=e.def.texs[i];
  }
  function spawn(r,a) {
    const p=nearest(a.boss,5) || nearest(a.checkpoint,4);
    if (!p || !canFight()) return null;
    hooks.clearWatcher();
    const e=ents.add("herobrine",p.x,p.y,p.z,{variant:0});
    e.convergence=true;
    e.boss=true;
    e.hp=r.hp;
    e.still=true;
    face(e,player());
    changeForm(e,r.phase);
    return e;
  }
  function cancelAttack() {
    if (attack) attack.cancelled=true;
    attack=null;
    if (boss) { boss.raise=0; boss.point=false; boss.reignLift=0; }
  }
  function clearActors() {
    cancelAttack(); clearDebris();
    for (const e of [...images,...adds]) e.gone=true;
    for (const e of ents.list) if (e.mutCaller?.convergenceAdd) e.gone=true;
    for (const p of ents.projectiles) if (p.owner?.convergenceAdd) p.gone=true;
    images=[]; adds=[];
  }
  function clear() {
    clearActors();
    if (boss) boss.gone=true;
    if (defeat) defeat.entity.gone=true;
    boss=null; defeat=null; intro=0; departure=0; guard=0; world=null;
    showTitle("");
  }
  function retry(label,write=true) {
    const r=state();
    if (r?.status==="active") Object.assign(r,{status:"ready", phase:0, hp:REIGN_HEALTH, summoned:0});
    clear();
    if (label) UI.toast(label);
    if (write) saveNow(false);
  }
  function prepare() {
    const a=arena(), r=state();
    if (!canFight() || !close(a?.altar,7) || r?.status==="won" || active()) return;
    if (G.panelKind) G.closePanel();
    const next=beginReign(r);
    world=G.world; time=0; turn=0; cooldown=3;
    boss=spawn(next,a);
    if (!boss) { UI.toast("Clear the arena floor and try again.","bad"); return; }
    hooks.story().reign=next;
    intro=next.introSeen?0:3.1;
    next.introSeen=true;
    if (intro) showTitle("HEROBRINE — THE FORSAKEN KING");
    Sound.noise(130,.7,.09*volume(),.7,"lowpass");
    effect(boss.pos,"pale",9);
    UI.toast("The Convergence begins. Keep the marked rings clear.","good");
    saveNow(false);
  }
  function challenge() {
    const a=arena();
    if (!close(a?.altar,7)) { UI.toast("Approach the Convergence altar beyond the throne."); return; }
    if (reignWon(hooks.story())) { UI.toast("The King has fallen. Find the royal cache by the northern eye."); return; }
    if (active()) { UI.toast("The King is already in the arena."); return; }
    if (!canFight()) { UI.toast("Swear all five oaths and enter in Survival with combat enabled.","bad"); return; }
    UI.confirm("Challenge the Forsaken King?", "Five forms await. Bring iron or better armor, a shield, food, and a blade or bow. The southern passage stays open if you need to retreat.", prepare, "Challenge");
  }
  function claim() {
    const a=arena(), r=state();
    if (G.guest || G.creative || G.spectator || G.mode!=="survival" || !close(a?.cache,7) || !reignWon(hooks.story())) { UI.toast("The royal cache opens after the King falls."); return; }
    const given=claimReignLoot(r,G.inv);
    if (given) {
      G.hudDirty=true; Sound.pickup();
      UI.toast(r.claimed===LOOT_MASK ? "The royal rewards are yours." : "Some royal drops remain in the cache.","good");
      saveNow(false);
    } else UI.toast(r.claimed===LOOT_MASK ? "You have claimed the royal cache." : "Make inventory space and use the cache again.");
  }
  function interact(hit,kind) {
    if (kind!=="reignAltar" && kind!=="reignCache") return false;
    const a=arena(), p=kind==="reignAltar"?a?.altar:a?.cache;
    if (p && hit.x===p.x && hit.y===p.y && hit.z===p.z) {
      if (kind==="reignAltar") challenge(); else claim();
    }
    return true;
  }
  function finish(r,e) {
    clearActors();
    e.hp=0; e.still=true; e.chase=null; e.goal=null; e.reignLift=0;
    defeat={entity:e,remaining:1.8};
    boss=null;
    showTitle("");
    if (eligible()) {
      giveXp(180);
      Sound.levelUp();
      UI.toast("Liberation · The Forsaken King has fallen. Claim the cache at the northern eye.","good");
      api.persistReignVictory();
    }
  }
  function hit(e,n,attacker) {
    if (images.includes(e)) { e.gone=true; effect(e.pos,"portal"); return 0; }
    const r=state();
    if (e!==boss || !active() || !eligible() || !within(player(),arena()) || guard>0 || intro>0 || attacker!=="player") return 0;
    const phase=r.phase, amount=hitReign(r,n,Date.now());
    if (r.status==="won") { finish(r,e); return 0; }
    if (phase!==r.phase) {
      clearActors();
      guard=1.15; cooldown=2.5; turn=0;
      changeForm(e,r.phase);
      effect(e.pos,r.phase===2?"ember":"portal",12);
      Sound.tone(r.phase===2?100:160,.45,"triangle",.10*volume(),-55);
      UI.toast(REIGN_PHASES[r.phase],"bad");
      saveNow(false);
    }
    return amount;
  }
  function blink(a) {
    const candidates=[a.boss,...a.hazards];
    for (let i=0; i<candidates.length; i++) {
      const p=nearest(candidates[(turn+i)%candidates.length],2);
      if (!p || distance(p,player())<4.5 || !within(p,a)) continue;
      effect(boss.pos,"portal");
      Object.assign(boss.pos,p);
      boss.vel.x=boss.vel.y=boss.vel.z=0;
      boss.goal=null; boss.path=null;
      face(boss,player());
      effect(p,"portal");
      return;
    }
  }
  function summon(r,a) {
    const flag=r.phase===1?1:r.phase===4?2:0;
    if (!flag || r.summoned&flag || adds.some(e=>!e.gone&&!e.dead) || G.settings.fwMutants==="off") return false;
    for (const mark of a.minions) {
      const spot=nearest(mark,2);
      if (!spot || distance(spot,player())<5) continue;
      const add=G.mutants?.spawnConvergence(r.phase===1?"rattler":"groaner",spot,a);
      if (!add) continue;
      adds=adds.filter(e=>!e.gone&&!e.dead);
      add.reignExpiry=time+24;
      adds.push(add);
      r.summoned|=flag;
      saveNow(false);
      UI.toast("A guardian answers the King.");
      return true;
    }
    return false;
  }
  function illusions(a) {
    for (const e of images) e.gone=true;
    images=[];
    for (const mark of [a.hazards[0],a.hazards[1]]) {
      const p=nearest(mark,2);
      if (!p || distance(p,player())<3) continue;
      const e=ents.add("herobrine",p.x,p.y,p.z,{variant:3});
      e.convergence=true; e.decoy=true; e.still=true;
      e.mat.transparent=true; e.mat.opacity=.45; e.mat.depthWrite=false;
      if (e.glowMat) { e.glowMat.transparent=true; e.glowMat.opacity=.45; e.glowMat.depthWrite=false; }
      face(e,player());
      images.push(e);
      effect(p,"portal",4);
    }
    blink(a);
  }
  function ring(mark,radius,delay,dmg,color,particle) {
    const a=arena(), x=Math.floor(mark.x), y=a.boss.y, z=Math.floor(mark.z);
    if (!within({x,y,z},a) || !canArrive(G.world,{x,y,z})) return;
    const stage=attack, phase=state().phase;
    ents.addHazard(mark.x,y,mark.z,radius,delay,dmg,"The King’s marked energy struck you. Leave the ring before impact.",0,{
      owner:boss,cancelled:()=>stage.cancelled || !active() || state().phase!==phase || !within(player(),a), color,particle,statusEffect:null,steadyWarning:soft()?"always":true,
    });
  }
  function wind(kind,a) {
    const p=player(), delay=kind==="strike"?1.02:kind==="shockwave"?1.9:1.45;
    attack={kind,left:delay,total:delay,x:p.x,z:p.z,cancelled:false};
    boss.still=true; boss.chase=null; boss.goal=null;
    face(boss,p);
    if (kind==="burst") ring(p,2.55,delay,5,0xc57fff,"portal");
    if (kind==="lightning") {
      ring(p,2.4,delay,6,0xff6360,"ember");
      for (const dx of [-5,5]) ring({x:p.x+dx,z:p.z-3},1.9,delay,5,0xff7848,"ember");
    }
    if (kind==="shockwave") {
      ring(p,2.65,1.24,6,0xe783ff,"portal");
      const direction=p.x<a.boss.x+.5?1:-1;
      ring({x:p.x+direction*4,z:p.z-3},2.35,1.62,5,0xef678d,"portal");
      ring({x:p.x-direction*4,z:p.z+3},2.3,1.9,5,0xff845c,"ember");
    }
    Sound.tone(kind==="strike"?140:220,.22,"sine",.09*volume(),kind==="strike"?-25:52);
  }
  function impact(a,move) {
    if (move.kind==="blink") blink(a);
    else if (move.kind==="shadows") illusions(a);
    else if (move.kind==="strike") {
      const p=player(), d=distance(p,boss.pos);
      const targetYaw=Math.atan2(boss.pos.x-p.x,boss.pos.z-p.z);
      if (d<=2.7 && Math.abs(boss.pos.y-p.y)<1.6 && Math.cos(targetYaw-boss.yaw)>.24 && ents.canSeePlayer(boss))
        hurt(5*({easy:.67,normal:1,hard:1.38}[G.wset.difficulty]??1),"The Forsaken King struck. Retreat when he raises his arms.",boss);
      effect(boss.pos,"pale",4);
    } else {
      if (move.kind==="lightning" && !soft()) api.weatherFlash({x:move.x,z:move.z});
      effect(boss.pos,move.kind==="lightning"?"ember":"portal",10);
    }
  }
  function tick(dt) {
    if (world && world!==G.world) clear();
    if (G.dim!=="forsaken" || !active() && !defeat) return;
    const r=state(), a=arena();
    if (defeat) {
      defeat.remaining-=dt;
      const e=defeat.entity;
      e.reignLift=(1.8-defeat.remaining)*.45;
      e.mat.transparent=true;
      e.mat.opacity=Math.max(0,defeat.remaining/1.8);
      if (e.glowMat) { e.glowMat.transparent=true; e.glowMat.opacity=e.mat.opacity; }
      if (defeat.remaining<=0) { effect(e.pos,"portal",12); e.gone=true; defeat=null; }
      return;
    }
    if (!canFight() || !a) { retry(null); return; }
    if (!within(player(),a)) {
      if (boss) {
        clearActors();
        boss.chase=null; boss.goal=null;
      }
      if ((departure+=dt)>3) retry("You retreated. Return to the altar for a new attempt.");
      return;
    }
    departure=0;
    world=G.world;
    if (!boss || boss.gone) {
      boss=spawn(r,a);
      if (!boss) { retry("An obstruction interrupted the encounter. Clear the arena and try again."); return; }
      cooldown=3; guard=.65; turn=0;
    }
    time+=dt;
    boss.hp=r.hp;
    updateDebris();
    guard=Math.max(0,guard-dt);
    if (intro>0) {
      intro=keys.has("Space")||keys.has("Escape")?0:Math.max(0,intro-dt);
      if (!intro) showTitle("");
      return;
    }
    for (const e of images) if (time>e.reignExpiry) e.gone=true;
    for (const e of adds) if (time>e.reignExpiry) e.gone=true;
    if (attack) {
      const move=attack;
      move.left-=dt;
      const progress=1-Math.max(0,move.left)/move.total;
      boss.raise=.25+progress*.65;
      boss.reignLift=soft()?0:(r.phase===2||r.phase===4)&&move.kind!=="strike" ? Math.sin(Math.PI*progress)*.22 : 0;
      if (move.left<=0) {
        impact(a,move);
        attack=null;
        boss.raise=0; boss.reignLift=0;
        cooldown=move.kind==="shockwave"?2.7:2.2;
        for (const e of images) if (e.reignExpiry===undefined) e.reignExpiry=time+3.8;
      }
      return;
    }
    cooldown-=dt;
    const d=distance(player(),boss.pos);
    if (!within(boss.pos,a)) blink(a);
    boss.still=d<2;
    boss.chase=d>2?player():null;
    boss.chaseSpeed=r.phase===4?3.7:3.25;
    if (d<3) face(boss,player());
    if (cooldown<=0) {
      if (summon(r,a)) { cooldown=2.6; return; }
      let kind=ATTACKS[r.phase][turn++%2];
      if (kind==="strike" && d>4) {
        if (r.phase<=1 && d<10) { turn--; cooldown=.5; return; }
        kind=r.phase<2?"blink":r.phase===2?"lightning":r.phase===3?"shadows":"burst";
      }
      wind(kind,a);
    }
  }

  return { tick, clear, hit, interact, challenge, claim, within:()=>within(player(),arena()),
    active:()=>active() && !!boss, eclipse:()=>active() && within(player(),arena()) ? state().phase+1 : 0,
    title:()=> intro>0 ? "Space to skip the introduction" : attack ? HINT[attack.kind] : active() ? "Use the openings between attacks" : "",
    checkpoint:()=>state()?.checkpoint && nearest(arena()?.checkpoint,4),
    faint:()=>active() && retry(null,false),
    info:()=>boss && active() ? { e:boss,label:"Herobrine · "+REIGN_PHASES[state().phase],frac:state().hp/REIGN_HEALTH,reign:true } : null,
  };
}
