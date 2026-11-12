// Echohold Reborn, Phase 4: how Echohold's hunters think.
// - The Deep Stalker ("hunter" AI): a clear set of states, wander → investigate a sound → search the area → pursue →
//   wind up → strike → recover → (retreat). It hunts by sound, notices you only up close (closer still if you crouch),
//   gets bolder after repeated noises, gives up when you stay quiet, and backs away from bright light.
// - Emergence: when the alert meter fills, the moss pulses and the floor rumbles for a few seconds before a Stalker rises,
//   10–16 blocks away. You keep control the whole time.
// - The Echo Watcher ("watcher"): a stone pillar with one eye. It can't move or hurt you, but if it sees you moving
//   (not crouching) its eye charges, and then it rings out: the alert meter jumps and Hush Crawlers come.
// - The Vault Sentinel ("vaultsentinel"): a heavy guardian that sleeps beside vaults. Its shield blocks hits from the
//   front; before each slam its arms rise and a ring glows on the floor.
// Everything is event-driven (sounds come from lost.js L.noise → ents.hear); nothing scans the whole world.
import { B, SOLID } from "./blocks.js";

const rand = (a, b) => a + Math.random() * (b - a);
const BRIGHT = 10;   // block light at which a Stalker backs away (a Keeper lamp post or torch, within a couple of blocks)

export function createHunt({ G, ents, UI, Sound, puff, reduced, calm, alert, st }) {
  let emergence = null, tipT = 0;
  const once = (key, text, kind = "") => { const s = st(); s.tips = s.tips || {}; if (s.tips[key]) return; s.tips[key] = 1; UI.toast(text, kind); };
  const stepOf = e => { const s = Math.min(0.6, e.age - (e.lastT ?? e.age)); e.lastT = e.age; return s; };
  const lightLevel = (E, x, y, z) => { const L = E.world.lightAt(Math.floor(x), Math.floor(y), Math.floor(z)); return L ? L[1] : 0; };
  const faceTo = (e, t) => { e.yaw = Math.atan2(-(t.x - e.pos.x), -(t.z - e.pos.z)); };

  // ---------------- the Deep Stalker ----------------
  function thinkHunter(E, e, d, dmgMul) {
    const p = G.player, step = stepOf(e), can = E.targetable(), def = e.def;
    if (!e.home) e.home = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
    if (!e.st) { e.st = e.alertSpawn ? "emerging" : "wander"; e.stT = e.alertSpawn ? 1.2 : 0; e.anger = 0; e.quietT = 0; }
    e.stT -= step; if (e.alertT > 0) e.alertT -= step; if (e.heard) e.heard.t -= step;
    const set = (s, t) => { e.st = s; e.stT = t; };
    // a new sound since last time? It gets bolder each time (up to 3)
    const fresh = e.heard && e.heard !== e.lastHeard && e.heard.t > 0;
    if (fresh) { e.lastHeard = e.heard; e.anger = Math.min(3, (e.anger || 0) + 0.5); e.quietT = 0; } else e.quietT += step;
    const bold = 1 + (e.anger || 0) * 0.08;
    // up close it senses you (crouching gets you much closer)
    if (can && d < (p.crouch ? 1.6 : 3.2)) e.alertT = Math.max(e.alertT || 0, 6);
    const lit = lightLevel(E, e.pos.x, e.pos.y + 1, e.pos.z), dark = lit < 6;
    // bright light drives it back; badly hurt, it flees once
    if (e.st !== "emerging" && e.st !== "retreating" && lit >= BRIGHT) {
      set("retreating", 3); e.leave = false;
      if (d < 16) once("stalkerLight", "The Deep Stalker flinches away from the light! Stalkers hate bright lamps and torches.", "good");
    }
    if (!e.fled && e.hp < e.maxHp * 0.35 && e.st !== "retreating") { e.fled = true; set("retreating", 4); e.leave = false; }
    const speed = def.speed * bold * (dark ? 1.2 : 0.9);
    switch (e.st) {
      case "emerging":
        e.goal = null; if (Math.random() < 0.6) puff(e.pos.x + rand(-0.6, 0.6), e.pos.y + rand(0, 2), e.pos.z + rand(-0.6, 0.6), "hush");
        if (e.stT <= 0) { Sound.mob("warble", d); set(e.heard ? "investigating" : "searching", 6); e.search = e.heard ? { ...e.heard } : { x: p.pos.x, y: p.pos.y, z: p.pos.z }; }
        return;
      case "wander":
        if (e.alertT > 0 && can) { set("pursuing", 0); break; }
        if (e.heard && e.heard.t > 0) { set("investigating", 8); break; }
        if (Math.hypot(e.pos.x - e.home.x, e.pos.z - e.home.z) > (def.leash || 30)) { E.moveTo(e, e.home, speed * 0.6, 1); return; }
        if (e.stT <= 0) { e.stT = rand(2, 5); const a = Math.random() * Math.PI * 2; e.goal = { x: e.home.x + Math.cos(a) * 5, y: e.home.y, z: e.home.z + Math.sin(a) * 5, speed: def.speed * 0.4 }; }
        return;
      case "investigating":
        if (e.alertT > 0 && can) { set("pursuing", 0); break; }
        if (!e.heard || e.heard.t <= 0 || Math.hypot(e.pos.x - e.heard.x, e.pos.z - e.heard.z) < 1.8 || e.stT <= 0) { e.search = e.heard ? { ...e.heard } : { x: e.pos.x, y: e.pos.y, z: e.pos.z }; set("searching", 6 - (e.anger || 0)); e.searchT = 0; break; }
        E.moveTo(e, e.heard, speed * 0.9, 1);
        return;
      case "searching":   // poke around where the sound was: corners, doorways, behind things
        if (e.alertT > 0 && can) { set("pursuing", 0); break; }
        if (fresh) { set("investigating", 8); break; }
        if ((e.searchT = (e.searchT || 0) - step) <= 0) { e.searchT = 1.6; const a = Math.random() * Math.PI * 2, c = e.search || e.pos; e.goal = { x: c.x + Math.cos(a) * rand(2, 5), y: c.y, z: c.z + Math.sin(a) * rand(2, 5), speed: speed * 0.6 }; }
        if (e.stT <= 0) {
          if (e.alertSpawn && e.quietT > 8) { set("retreating", 3); e.leave = true; }   // you stayed quiet: it gives up and sinks back down
          else set("wander", 0);
        }
        return;
      case "pursuing":
        if (!can) { set("searching", 5); return; }
        if (e.alertT <= 0) { e.search = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; set("searching", 7); return; }   // lost you: search where it last sensed you
        E.chase(e, p.pos); if (e.goal) e.goal.speed = speed * 1.1;
        if (d < def.reach + 0.4 && e.attackCd <= 0) { set("windup", 0.45); e.raise = 1; Sound.mob(def.sound, d); }
        return;
      case "windup":   // a short, visible wind-up before every strike
        e.goal = null; faceTo(e, p.pos);
        if (e.stT <= 0) {
          e.raise = 0; e.swing = 0.4; e.attackCd = 1.4;
          if (can && d < def.reach + 1) E.ctx.hurtPlayer(def.dmg * dmgMul, "A Deep Stalker struck you. Stalkers hunt by sound: crouch, walk on soft floors, and stay near bright light.", e);
          set("recovering", 1.2);
        }
        return;
      case "recovering":   // a moment where it stands still: your chance to strike back or slip away
        e.goal = null;
        if (e.stT <= 0) set(e.alertT > 0 ? "pursuing" : "searching", 5);
        return;
      case "retreating": {
        const ax = e.pos.x - p.pos.x, az = e.pos.z - p.pos.z, l = Math.hypot(ax, az) || 1;
        e.goal = { x: e.pos.x + ax / l * 6, y: e.pos.y, z: e.pos.z + az / l * 6, speed: def.speed * 1.2 };
        if (e.leave && e.stT < 1.5 && Math.random() < 0.7) puff(e.pos.x, e.pos.y + rand(0, 2), e.pos.z, "hush");
        if (e.stT <= 0) {
          if (e.leave) { e.gone = true; for (let k = 0; k < 8; k++) puff(e.pos.x + rand(-0.5, 0.5), e.pos.y + k * 0.3, e.pos.z + rand(-0.5, 0.5), "hush"); if (d < 24) UI.toast("The Deep Stalker sinks back into the moss. It lost interest.", "good"); }
          else if (lit >= BRIGHT) set("retreating", 1.5);
          else set("searching", 5);
        }
        return;
      }
    }
  }

  // ---------------- emergence (the alert meter filled up) ----------------
  function findRise() {
    const p = G.player, w = G.world;
    let best = null;
    for (let t = 0; t < 40; t++) {
      const a = Math.random() * Math.PI * 2, r = rand(10, 16), x = Math.floor(p.pos.x + Math.cos(a) * r), z = Math.floor(p.pos.z + Math.sin(a) * r);
      for (let dy = 3; dy >= -3; dy--) {
        const y = Math.floor(p.pos.y) + dy;
        if (SOLID[w.id(x, y - 1, z)] && !SOLID[w.id(x, y, z)] && !SOLID[w.id(x, y + 1, z)] && !SOLID[w.id(x, y + 2, z)]) {
          const moss = w.id(x, y - 1, z) === B.HUSHMOSS || w.id(x, y - 1, z) === B.HUSH_NODE;
          if (!best || (moss && !best.moss)) best = { x: x + 0.5, y, z: z + 0.5, moss };
          break;
        }
      }
      if (best && best.moss) break;
    }
    return best;
  }
  function emerge() {
    if (emergence || reduced() || calm() || G.dim !== "deep") return false;
    if (ents.list.some(e => e.sp === "stalker" && !e.dead && !e.gone && e.alertSpawn)) return false;
    const at = findRise(); if (!at) return false;
    emergence = { ...at, t: 3.2, puffT: 0, rumbleT: 0 };
    UI.toast("The moss is pulsing and the floor is shaking. Something is rising nearby! Move away quietly, or get to a bright light or the Sanctuary.", "bad");
    return true;
  }
  function tickEmergence(dt) {
    const q = emergence; if (!q) return;
    if (G.dim !== "deep") { emergence = null; return; }
    q.t -= dt; q.puffT -= dt; q.rumbleT -= dt;
    if (q.puffT <= 0) { q.puffT = 0.12; puff(q.x + rand(-0.8, 0.8), q.y + rand(0, 0.6), q.z + rand(-0.8, 0.8), "hush"); }
    if (q.rumbleT <= 0) { q.rumbleT = 0.8; Sound.tone(rand(40, 52), 0.7, "sine", 0.07 * (G.settings.fwAmbient ?? 0.8), -6); }
    if (q.t <= 0) {
      emergence = null;
      const p = G.player, e = ents.add("stalker", q.x, q.y, q.z);
      if (e) { e.alertSpawn = true; e.heard = { x: p.pos.x, y: p.pos.y, z: p.pos.z, t: 10 }; e.home = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; }
    }
  }

  // ---------------- the Echo Watcher ----------------
  function thinkWatcher(E, e, d, dmgMul) {
    const p = G.player, step = stepOf(e), can = E.targetable();
    e.goal = null; if (e.home) { e.pos.x = e.home.x; e.pos.z = e.home.z; }
    e.cd = (e.cd || 0) - step;
    const moving = Math.hypot(p.vel.x, p.vel.z) > 0.6 && !p.crouch;
    const rel = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z)) - e.yaw, front = Math.abs(Math.atan2(Math.sin(rel), Math.cos(rel))) < 1.2;
    const sees = can && d < 11 && Math.abs(p.pos.y - e.pos.y) < 6 && front && moving && E.canSeePlayer(e);
    if (sees && e.cd <= 0) {
      if (!e.charge) Sound.tone(700, 0.5, "triangle", 0.06, 300);
      e.charge = (e.charge || 0) + step; faceTo(e, p.pos);
      if (Math.random() < 0.5) puff(e.pos.x, e.pos.y + 2.2, e.pos.z, "hush");
      if (e.charge >= 0.9) {
        e.charge = 0; e.cd = 10; Sound.mob("clank", d); Sound.tone(980, 0.9, "triangle", 0.08, -200);
        alert(reduced() ? 15 : 30, "An Echo Watcher saw you move! Its ring echoes through the streets.");
        if (!reduced()) { const n = ents.list.filter(m => m.watcherCall === e && !m.dead && !m.gone).length; for (let k = n; k < 2; k++) { const a = Math.random() * Math.PI * 2, m = ents.add("crawler", e.pos.x + Math.cos(a) * 3, e.pos.y, e.pos.z + Math.sin(a) * 3); if (m) { m.watcherCall = e; m.alertT = 8; } } }
        once("watcherTip", "Tip: Echo Watchers only see movement in front of them. Crouch to slip past, or break the pillar from behind.");
      }
    } else { e.charge = Math.max(0, (e.charge || 0) - step * 0.5); if (!sees) e.yaw += step * 0.45; }   // slowly scanning
    if (e.mat && e.mat.color) { const c = Math.min(1, (e.charge || 0) / 0.9); e.mat.color.setRGB(1, 1 + c * 0.5, 1 + c * 0.7); }
  }

  // ---------------- the Vault Sentinel ----------------
  function thinkSentinel(E, e, d, dmgMul) {
    const p = G.player, step = stepOf(e), can = E.targetable(), def = e.def;
    if (!e.home) e.home = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
    if (e.alertT > 0) e.alertT -= step;
    const near = e.heard && e.heard.t > 0 && Math.hypot(e.pos.x - e.heard.x, e.pos.z - e.heard.z) < 6;
    if (e.dormant) {
      e.goal = null;
      if ((can && d < 6) || near || e.alertT > 0) {
        e.dormant = false; e.ss = "guard"; Sound.mob("clank", d); for (let k = 0; k < 5; k++) puff(e.pos.x, e.pos.y + k * 0.5, e.pos.z, "pale");
        if (d < 20) once("sentinelTip", "A Vault Sentinel wakes! Its shield blocks hits from the front. When its arms rise and a ring glows, step back.", "bad");
      } else return;
    }
    e.ssT = (e.ssT || 0) - step; e.slamCd = (e.slamCd || 0) - step;
    const fromHome = Math.hypot(e.pos.x - e.home.x, e.pos.z - e.home.z);
    if (e.ss === "windup") { e.goal = null; faceTo(e, p.pos); if (e.ssT <= 0) { e.raise = 0; e.swing = 0.5; Sound.explode(d); e.ss = "recover"; e.ssT = 1.4; } return; }
    if (e.ss === "recover") { e.goal = null; if (e.ssT <= 0) e.ss = "guard"; return; }
    if (fromHome > (def.leash || 14) || !can || d > 16) {   // too far from its post (or you left): it walks back and goes still again
      if (fromHome > 1.5) E.moveTo(e, e.home, def.speed, 1); else { e.goal = null; if (!can || d > 16) e.dormant = true; }
      return;
    }
    E.chase(e, p.pos);
    if (d < 3.4 && e.slamCd <= 0) {   // the slam: arms up, a glowing ring under it, then the hit lands inside the ring
      e.ss = "windup"; e.ssT = 0.9; e.raise = 1; e.slamCd = 3.2; Sound.mob("roar", d);
      E.addHazard(e.pos.x, e.pos.y, e.pos.z, 3.3, 0.9, 6 * dmgMul, "A Vault Sentinel's slam hit you. When its arms rise and the ring glows, step out of the ring!", 0);
    }
  }

  return {
    ai: { hunter: thinkHunter, watcher: thinkWatcher, vaultsentinel: thinkSentinel },
    emerge, emerging: () => !!emergence,
    // how close danger is (0..1): the Stalker hunting near you, or one rising. It drives the moss glow and the heartbeat.
    tick(dt) {
      tickEmergence(dt);
      let k = emergence ? 0.85 : 0;
      if (G.dim === "deep") for (const e of ents.list) {
        if (e.sp !== "stalker" || e.dead || e.gone) continue;
        const d = Math.hypot(e.pos.x - G.player.pos.x, e.pos.z - G.player.pos.z), near = Math.max(0, 1 - d / 30);
        const w = e.st === "pursuing" || e.st === "windup" || e.st === "recovering" || e.st === "emerging" ? 1 : e.st === "investigating" || e.st === "searching" ? 0.55 : 0.2;
        k = Math.max(k, near * w);
      }
      G.echoDanger = G.dim === "deep" ? k : 0;
    }
  };
}
