// THE ENDWATCH CITADEL, Stage 5: THE FALLEN CASTELLAN. An ancient knight in dark, weathered plate with a two-handed
// greatsword and a heavy shield, faintly glowing at the visor. He waits before his throne; when you come near he rises
// (an introduction, a roar, the boss bar), then fights in three phases:
//   1. The Ancient Knight: telegraphed greatsword combos (raised blade + sparks first), and a raised shield that turns
//      aside blows from the front (strike from the side or behind, or wait for it to drop).
//   2. The Guardian's Fury (below 60%): longer combos, a ground slam (a glowing ring marks where it lands), a charge in a
//      straight line (if he hits a wall he's stunned: an opening), and two Castle Guards called in, once.
//   3. The Last Stand (below 30%): faster, no shield, three-strike combos; two more guards, once.
// Beat him: he kneels and fades; you get the Castellan's Greatblade (once per castle) and XP; the ward-stone doorway into
// the keep's Hall of the Seal dissolves and the Castellan's Seal opens onto the stair down to the Hollow portal.
// If you fall or leave the hall, he walks back to his throne at full strength. Saved in story.citadel.spots[i].boss.
import { B, I, make } from "./blocks.js";
import { CITADEL, toLocal, toWorld } from "./citadel.js";

const G0 = CITADEL.ground, F = G0 + 1, KZ0 = -27;
const THRONE = { x: -12.5, y: F + 3, z: -32.5 }, HALL = { x0: -16, x1: 16, z0: -40, z1: -28 }, SEAL = [0, -17];
const part = (name, size, pivot, off, paint, parent) => ({ name, size, pivot, off, paint: { all: paint }, ...(parent ? { parent } : {}) });
const plate = P => { P.fill(["#30333b", "#2b2e35", "#353842"]); P.rect(0, 0, 16, 1, "#5d636e"); P.rect(0, 15, 16, 1, "#1d1f24"); for (const [x, y, c] of [[3, 4, "#6e4a32"], [11, 9, "#5d636e"], [6, 12, "#6e4a32"], [13, 3, "#5d636e"], [2, 10, "#5d636e"]]) P.px(x, y, c); };   // weathered plate (fixed rust spots: the creature painter has no random)
const helm = P => { plate(P); P.rect(2, 6, 12, 2, "#101114"); P.rect(4, 6, 3, 2, "#8fd6ff"); P.rect(9, 6, 3, 2, "#8fd6ff"); P.rect(7, 1, 2, 14, "#454a54"); };
const blade = P => { P.fill(["#c8ccd4", "#b8bcc6"]); P.rect(7, 0, 2, 16, "#e8ecf2"); };
const hilt = P => { P.fill(["#3a2a1a"]); P.rect(0, 6, 16, 4, "#b89040"); };
const shield = P => { P.fill(["#26282e"]); P.rect(0, 0, 16, 1, "#b89040"); P.rect(0, 15, 16, 1, "#b89040"); P.rect(0, 0, 1, 16, "#b89040"); P.rect(15, 0, 1, 16, "#b89040"); P.rect(7, 2, 2, 12, "#9c1f24"); P.rect(3, 6, 10, 2, "#9c1f24"); };
const cape = P => { P.fill(["#5a1418", "#4a1014"]); P.rect(0, 14, 16, 2, "#2a080a"); };

// the creature itself (called from entities.js, next to the desert mobs)
export function installCastellan(species) {
  species.castellan = {
    name: "The Fallen Castellan", boss: true, noSave: true, hostile: true, hp: 260, speed: 2.4, w: 1.1, h: 3, ai: "castellan",
    fireproof: true, dmg: 5, reach: 3.4, xp: 0, sound: "clank", deathPuff: "pale", drops: () => [], knockResist: 0.8,
    model: { type: "humanoid", parts: [
      part("head", [11, 11, 11], [0, 37, 0], [0, 5.5, 0], helm),
      part("crest", [2, 6, 10], [0, 0, 0], [0, 7, 0], P => { P.fill(["#9c1f24"]); }, "head"),
      part("body", [17, 18, 10], [0, 18, 0], [0, 9, 0], plate),
      part("cape", [16, 24, 1], [0, 36, -5.5], [0, -12, 0], cape),
      part("pauldronR", [7, 5, 12], [11, 34, 0], [0, 0, 0], plate), part("pauldronL", [7, 5, 12], [-11, 34, 0], [0, 0, 0], plate),
      part("armR", [6, 19, 7], [11, 33, 0], [0, -9, 0], plate), part("armL", [6, 19, 7], [-11, 33, 0], [0, -9, 0], plate),
      part("hilt", [2, 7, 2], [0, -19, 0], [0, 0, 0], hilt, "armR"),
      part("guard", [8, 2, 2], [0, -16, 0], [0, 0, 0], hilt, "armR"),
      part("blade", [2, 30, 4], [0, -16, 0], [0, -15, 0], blade, "armR"),
      part("shield", [14, 18, 2], [-1, -11, 4.5], [0, 0, 0], shield, "armL"),
      part("legR", [7, 18, 8], [4, 18, 0], [0, -9, 0], plate), part("legL", [7, 18, 8], [-4, 18, 0], [0, -9, 0], plate)
    ] }
  };
}
// poses on top of the normal walking animation (called from entities.js every frame)
export function animateCastellan(e) {
  if (e.sp !== "castellan" || !e.parts) return;
  const P = e.parts, cs = e.cs || {};
  if (cs.mode === "throne") { P.legR.rotation.x = P.legL.rotation.x = -1.4; P.armR.rotation.x = -0.9; P.armL.rotation.x = -0.4; e.root.position.y = -0.55; return; }   // seated, sword across his knees
  e.root.position.y = cs.mode === "rising" ? -0.55 * Math.max(0, cs.t / 2.4) : cs.mode === "kneel" ? -0.6 * Math.min(1, (2.4 - cs.t) / 1.2) : 0;
  if (cs.mode === "windup") { const k = cs.kind; P.armR.rotation.x = k === "slam" ? -3 : k === "charge" ? -1.2 : -2.6; P.armL.rotation.x = k === "slam" ? -3 : -0.5; }
  else if (cs.mode === "strike") { P.armR.rotation.x = 0.4; }
  else if (cs.mode === "guard") { P.armL.rotation.x = -1.4; P.armL.rotation.y = 0.5; P.armR.rotation.x = -0.6; }
  else if (cs.mode === "charging") { P.armR.rotation.x = -1.5; P.armL.rotation.x = -1.4; }
  else if (cs.mode === "stunned") { P.armR.rotation.x = 0.3; P.armL.rotation.x = 0.3; e.root.rotation.z = Math.sin(e.age * 8) * 0.06; }
  else if (cs.mode === "kneel") { P.legR.rotation.x = -1.2; P.armR.rotation.x = 0.2; }
  if (cs.mode !== "guard") P.armL.rotation.y = 0;
  if (cs.mode !== "stunned") e.root.rotation.z = 0;
}

export function initCitadelBoss({ G, ents, UI, Sound, saveNow, puff, giveItem, giveXp }) {
  const A = {};
  let boss = null, castle = null, tick = 0, guards = [];
  function castles() {
    const out = [], s = (G.story.citadel && G.story.citadel.spots) || {};
    if (!G.gen || !G.gen.strongholds) return out;
    G.gen.strongholds.forEach((sh, i) => { const d = s[i]; if (d && d.on) out.push({ i, cx: sh.x, cz: sh.z, rot: d.rot, d }); });
    return out;
  }
  const at = (c, u, v) => { const [x, z] = toWorld(u, v, c.rot); return [c.cx + x, c.cz + z]; };
  const atF = (c, u, v) => { const [x, z] = toWorld(u, v, c.rot); return [c.cx + x + (u % 1 ? 0 : 0), c.cz + z]; };
  const local = (c, x, z) => toLocal(x - c.cx, z - c.cz, c.rot);
  const rec = c => c.d.boss || (c.d.boss = { defeated: false });
  const inHall = (c, p) => { const [u, v] = local(c, Math.floor(p.x), Math.floor(p.z)); return u >= HALL.x0 && u <= HALL.x1 && v >= HALL.z0 && v <= HALL.z1 && p.y >= F - 1 && p.y < F + 18; };
  const throneWorld = c => { const [x, z] = toWorld(THRONE.x + 0.5, THRONE.z + 0.5, c.rot); return { x: c.cx + x, y: THRONE.y, z: c.cz + z }; };
  const faceToward = (e, x, z) => { e.yaw = Math.atan2(-(x - e.pos.x), -(z - e.pos.z)); };

  // ---------- after the victory: the doorway into the keep and the Seal ----------
  function openWay(c, quiet) {
    const w = G.world; let any = false;
    for (let x = -2; x <= 2; x++) for (let z = KZ0; z <= KZ0 + 1; z++) for (let y = F; y <= F + 4; y++) { const [wx, wz] = at(c, x, z); if (w.isLoaded(wx, wz) && w.id(wx, y, wz) === B.WARD_BRICKS) { w.set(wx, y, wz, 0); any = true; } }
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const [wx, wz] = at(c, SEAL[0] + dx, SEAL[1] + dz); if (w.isLoaded(wx, wz) && w.id(wx, G0, wz) === B.CASTELLAN_SEAL) { w.set(wx, G0, wz, 0); any = true; } }
    if (any && !quiet) { const [x, z] = at(c, SEAL[0], SEAL[1]); Sound.tone(55, 1.6, "sawtooth", 0.14, -20); puff && puff(x + 0.5, G0 + 1, z + 0.5, "portal"); }
  }

  // ---------- the fight ----------
  function spawn(c) {
    const t = throneWorld(c);
    const e = ents.add("castellan", t.x, t.y, t.z); if (!e) return null;
    e.persist = false; e.noBurn = true; e.citadelBoss = c.i; e.home = { ...t };
    e.cs = { mode: "throne", t: 0, cd: 2, phase: 1, called: {}, hits: 0 };
    const [fx, fz] = at(c, 10, -33); faceToward(e, fx + 0.5, fz + 0.5);
    return e;
  }
  function phaseOf(e) { const f = e.hp / e.maxHp; return f > 0.6 ? 1 : f > 0.3 ? 2 : 3; }
  function callGuards(e, sp) {
    for (const k of [-1, 1]) {
      const g = ents.add(sp, e.pos.x + k * 3, e.pos.y, e.pos.z + 2); if (!g) continue;
      g.persist = false; g.noBurn = true; g.angry = 60; g.alertT = 30; guards.push(g); puff && puff(g.pos.x, g.pos.y + 1, g.pos.z, "pale");
    }
    UI.toast("\"To me, Endwatch!\" Castle guards answer the Castellan's call.", "bad");
  }
  function think(mgr, e, d, dmgMul) {
    const p = mgr.ctx.player(), cs = e.cs || (e.cs = { mode: "idle", t: 0, cd: 1, phase: 1, called: {}, hits: 0 });
    const step = Math.min(0.6, e.age - (cs.last ?? e.age)); cs.last = e.age;
    cs.t -= step; cs.cd -= step; e.guarding = cs.mode === "guard";
    if (cs.mode === "throne") { e.goal = null; return; }
    if (cs.mode === "rising") { e.goal = null; faceToward(e, p.pos.x, p.pos.z); if (cs.t <= 0) { cs.mode = "idle"; cs.cd = 1; } return; }
    if (cs.mode === "kneel") { e.goal = null; return; }
    const ph = phaseOf(e);
    if (ph !== cs.phase) {
      cs.phase = ph; Sound.mob("roar", d);
      UI.toast(ph === 2 ? "The Guardian's Fury: the Castellan's armor glows. He strikes harder now." : "The Last Stand: the Castellan casts his shield aside!", "bad");
      if (!cs.called[ph]) { cs.called[ph] = true; callGuards(e, ph === 2 ? "zombie" : "skeleton"); }
      cs.mode = "idle"; cs.cd = 0.8;
    }
    const fast = [1, 1.15, 1.35][ph - 1], canHit = mgr.targetable() && Math.abs(p.pos.y - e.pos.y) < 2.2;
    if (Math.random() < 0.15) puff && puff(e.pos.x, e.pos.y + 2.6, e.pos.z, ph === 3 ? "ember" : "pale");   // a faint, cold glow
    switch (cs.mode) {
      case "idle": {
        if (!mgr.targetable()) { e.goal = null; return; }
        if (cs.cd <= 0) {
          const r = Math.random();
          if (ph >= 2 && d > 6 && d < 18 && r < 0.45) return windup(cs, "charge", 0.9 / fast, mgr, e, p);
          if (ph >= 2 && d < 6 && r < 0.35) { mgr.addHazard(e.pos.x, e.pos.y, e.pos.z, 4.6, 1.1 / fast, 6, "The Castellan's slam knocked you flat."); return windup(cs, "slam", 1.1 / fast, mgr, e, p); }
          if (ph <= 2 && d < 7 && r < (ph === 1 ? 0.3 : 0.15)) { cs.mode = "guard"; cs.t = 1.6; e.goal = null; Sound.mob("clank", d); return; }
          if (d < 4) { cs.hits = 0; return windup(cs, "combo", (ph === 3 ? 0.45 : 0.65), mgr, e, p); }
        }
        mgr.chase(e, p.pos); if (e.goal) e.goal.speed = e.def.speed * fast;
        return;
      }
      case "guard": e.goal = null; faceToward(e, p.pos.x, p.pos.z); if (cs.t <= 0) { cs.mode = "idle"; cs.cd = 0.4; } return;
      case "windup":
        e.goal = null; if (cs.kind !== "charge" || cs.t > 0.25) faceToward(e, p.pos.x, p.pos.z);
        if (Math.random() < 0.6) puff && puff(e.pos.x, e.pos.y + 2.8, e.pos.z, "spark");
        if (cs.t > 0) return;
        if (cs.kind === "combo") {
          cs.mode = "strike"; cs.t = 0.25; Sound.mob("clank", d);
          if (d < e.def.reach + 0.4 && canHit) mgr.ctx.hurtPlayer((ph === 3 ? 6 : 5) * dmgMul, "The Fallen Castellan's greatsword struck you.", e);
          cs.hits++;
          return;
        }
        if (cs.kind === "slam") { cs.mode = "recover"; cs.t = 1.3; Sound.mob("rumble", d); return; }
        if (cs.kind === "charge") { cs.mode = "charging"; cs.t = 0.75; cs.dir = { x: -Math.sin(e.yaw), z: -Math.cos(e.yaw) }; cs.start = { x: e.pos.x, z: e.pos.z }; cs.hit = false; Sound.mob("roar", d); return; }
        return;
      case "strike": {
        e.goal = null; if (cs.t > 0) return;
        const combo = ph === 1 ? 1 : ph === 2 ? 2 : 3;
        if (cs.hits < combo && d < 5) return windup(cs, "combo", ph === 3 ? 0.35 : 0.45, mgr, e, p);
        cs.mode = "recover"; cs.t = ph === 3 ? 0.7 : 1.1; return;   // an opening after every combo
      }
      case "charging": {
        e.goal = { x: e.pos.x + cs.dir.x * 4, z: e.pos.z + cs.dir.z * 4, speed: 11 };
        if (!cs.hit && d < 1.9 && canHit) { cs.hit = true; mgr.ctx.hurtPlayer(6 * dmgMul, "The Fallen Castellan charged into you.", e); }
        const moved = Math.hypot(e.pos.x - cs.start.x, e.pos.z - cs.start.z);
        if (cs.t <= 0 || (cs.t < 0.45 && moved < 1.5)) {
          if (!cs.hit && cs.t > 0) { cs.mode = "stunned"; cs.t = 2.2; e.goal = null; Sound.mob("clank", d); UI.toast("The Castellan slammed into the wall. He's stunned: strike now!", "good"); }
          else { cs.mode = "recover"; cs.t = 0.9; e.goal = null; }
        }
        cs.start2 = moved; return;
      }
      case "recover": case "stunned": e.goal = null; if (Math.random() < 0.3 && cs.mode === "stunned") puff && puff(e.pos.x, e.pos.y + 3.1, e.pos.z, "spark"); if (cs.t <= 0) { cs.mode = "idle"; cs.cd = ph === 3 ? 0.5 : 1; } return;
    }
  }
  function windup(cs, kind, time, mgr, e, p) { cs.mode = "windup"; cs.kind = kind; cs.t = time; cs.cd = 2; e.goal = null; faceToward(e, p.pos.x, p.pos.z); }
  if (ents.bossAI) ents.bossAI.castellan = think;

  // ---------- every half second (and the intro / the end every frame) ----------
  A.update = dt => {
    if (boss && boss.cs) { const cs = boss.cs; if (cs.mode === "rising" || cs.mode === "kneel") cs.t -= dt; if (cs.mode === "kneel" && cs.t <= 0) finish(); }
    if ((tick -= dt) > 0) return; tick = 0.5;
    if (G.dim !== "overworld" || !G.world) { despawn(); return; }
    const p = G.player.pos;
    let c = null; for (const q of castles()) if (Math.hypot(p.x - q.cx, p.z - q.cz) < 80) c = q;
    if (!c) { despawn(); return; }
    const r = rec(c);
    if (r.defeated) { openWay(c, true); despawn(); return; }
    const inside = inHall(c, p);
    if (boss && (boss.dead || boss.gone || !ents.list.includes(boss))) { if (boss.dead && boss.citadelBoss === c.i && !r.defeated) beginEnd(c, boss); else boss = null; }
    if (!boss && inside) { boss = spawn(c); castle = c; }
    if (!boss) return;
    const cs = boss.cs, t = throneWorld(c);
    if (cs.mode === "throne") {
      const d = Math.hypot(p.x - boss.pos.x, p.z - boss.pos.z);
      if (inside && d < 15 && !G.spectator) intro(boss);
      return;
    }
    if (!inside && cs.mode !== "kneel") {   // you left the hall (or fell): he returns to his throne, whole again
      if (Math.hypot(p.x - t.x, p.z - t.z) > 30 || G.player.health <= 0) { boss.gone = true; boss = null; for (const g of guards) g.gone = true; guards = []; }
    }
  };
  function intro(e) {
    e.cs.mode = "rising"; e.cs.t = 2.4;
    Sound.mob("roar", 4); Sound.tone(70, 2, "sawtooth", 0.12, -10);
    UI.toast("THE FALLEN CASTELLAN rises from his throne. \"Another who would pass? Show me you are ready.\"", "bad");
    G.adv && G.adv("castellanmet");
  }
  function despawn() { if (boss && !boss.dead && boss.cs && boss.cs.mode !== "kneel") boss.gone = true; if (!boss || boss.gone) boss = null; for (const g of guards) if (!g.dead) g.gone = true; guards = []; }
  let ending = null;
  function beginEnd(c, e) {
    // a defeat that plays out: he kneels, the glow fades, then he's gone
    const ghost = ents.add("castellan", e.pos.x, e.pos.y, e.pos.z); if (ghost) { ghost.persist = false; ghost.hp = 1; ghost.cs = { mode: "kneel", t: 2.4 }; ghost.yaw = e.yaw; ghost.invulnerable = true; }
    boss = ghost; ending = c;
    Sound.mob("roar", 2); UI.toast("The Castellan sinks to one knee. \"At last… someone to finish the watch.\"", "good");
    if (!ghost) finish();
  }
  function finish() {
    const c = ending || castle; if (!c) return;
    const r = rec(c); if (r.defeated) return;
    r.defeated = true; r.at = Date.now();
    if (boss) { puff && puff(boss.pos.x, boss.pos.y + 1.5, boss.pos.z, "pale"); boss.gone = true; }
    boss = null; ending = null; for (const g of guards) if (!g.dead) g.gone = true; guards = [];
    const first = !G.story.citadel.greatblade; G.story.citadel.greatblade = (G.story.citadel.greatblade || 0) + 1;
    giveItem(I.CASTELLAN_GREATBLADE, 1); giveXp(120);
    Sound.levelUp(); openWay(c);
    UI.toast("You defeated the Fallen Castellan! You received the Castellan's Greatblade. The Seal in the Hall of the Seal has opened: the stair to the Hollow portal is free.", "good");
    G.adv && G.adv("castellan");
    if (first) setTimeout(() => UI.openNote("The Castellan's Greatblade", "Aldric's own sword, heavy and old, still sharp.\n\nRight-click with it in your hand: Sweeping Cleave. It strikes every enemy in front of you (out to about 3½ blocks) and drives them back. It needs 8 seconds to ready again and costs 3 durability.\n\nThe way down is open now. Bring Eyes of the Void to fill the portal frame.", true), 1200);
    saveNow && saveNow(false);
  }
  // the boss bar (main.js asks every frame)
  A.bossInfo = () => {
    if (!boss || boss.gone || G.dim !== "overworld") return null;
    const cs = boss.cs || {};
    if (cs.mode === "throne") return null;
    if (cs.mode === "kneel") return { label: "The Fallen Castellan • Defeated", frac: 0 };
    const ph = phaseOf(boss);
    return { label: `The Fallen Castellan • ${["The Ancient Knight", "The Guardian's Fury", "The Last Stand"][ph - 1]}${cs.mode === "guard" ? " • Shield raised" : cs.mode === "stunned" ? " • Stunned!" : ""}`, frac: boss.hp / boss.maxHp };
  };
  // the Greatblade's Sweeping Cleave (right-click)
  let cleaveReady = 0;
  A.useGreatblade = slot => {
    const now = performance.now() / 1000;
    if (now < cleaveReady) { UI.toast(`Sweeping Cleave is ready in ${Math.ceil(cleaveReady - now)} s.`); return true; }
    cleaveReady = now + 8;
    const p = G.player, fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw); let n = 0;
    for (const e of ents.list) {
      if (e.dead || e.gone || !e.def.hostile || e.invulnerable) continue;
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d = Math.hypot(dx, dz);
      if (d > 3.6 || Math.abs(e.pos.y - p.pos.y) > 2 || (dx * fx + dz * fz) / (d || 1) < 0.2) continue;
      ents.damage(e, 6, "player", { x: dx / (d || 1) * 1.4, z: dz / (d || 1) * 1.4 }); n++;
    }
    for (let k = -2; k <= 2; k++) { const a = Math.atan2(fx, fz) + k * 0.35; puff && puff(p.pos.x + Math.sin(a) * 2, p.pos.y + 1.1, p.pos.z + Math.cos(a) * 2, "spark"); }
    Sound.tone(220, 0.25, "sawtooth", 0.1, 40);
    if (!G.creative && slot.dur !== undefined) { slot.dur -= 3; if (slot.dur <= 0) { G.inv.slots[G.selected] = null; UI.toast("The Castellan's Greatblade broke."); } }
    G.hudDirty = true;
    if (!n) UI.toast("Your cleave sweeps through the air.");
    return true;
  };
  // a soft glow over the portal once it's reachable
  A.reset = () => { despawn(); boss = null; ending = null; };
  A.state = i => { const c = castles().find(q => q.i === i); return c ? { ...rec(c), boss: boss ? { hp: boss.hp, max: boss.maxHp, mode: boss.cs && boss.cs.mode, phase: phaseOf(boss) } : null } : null; };
  A.boss = () => boss;
  return A;
}
