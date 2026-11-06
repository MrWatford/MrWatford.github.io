// The Forsaken World: Herobrine's optional adventure. This file runs the adventure while you're there:
// loading the packaged map, the wards that keep you safe, Herobrine's "director" (what he does and when),
// eerie events, the story (notes, journal, sigils, shrines), and the final confrontation in his citadel.
// Everything that matters is saved in G.story.fw, and timers only count while you're actually playing there.
import { B, I, HEIGHT, SOLID, idOf, metaOf, make, OPEN, TOP, itemDef, iconURL } from "./blocks.js";
import { lineOfSight } from "./entities.js";
import { NOTES, unpackForsaken } from "./forsaken-author.js";

const rand = (a, b) => a + Math.random() * (b - a);
const MAP_URL = "maps/forsaken-v1.bin";
const SIGILS = { hearth: I.SIGIL_HEARTH, stone: I.SIGIL_STONE, root: I.SIGIL_ROOT };
const QUEST = [I.SIGIL_HEARTH, I.SIGIL_STONE, I.SIGIL_ROOT, I.WARD_HEART];
export const isQuestItem = id => QUEST.includes(id) || !!(itemDef(id) || {}).quest;   // the Lost Civilization's relics and stabilizers too
// Extra notes that appear during the adventure (not part of the map)
const LATE_NOTES = {
  chalk: { title: "Fresh Chalk on the Refuge Wall", text: "Someone was here while you were away. Chalk arrows point north toward the Watchtower, and beyond it, the outpost. Under them, in small letters: \"Read the logs before you go into the mine.\"" },
  free: { title: "The Vale Is Free", text: "His citadel is silent. The mist is thinning, and you can see the sun as a pale coin through it.\n\nThe shrines will keep their light. Come back whenever you like. If you ever want to face him again, the Pale Altar can call him back." }
};

export function initForsaken(api) {
  const { G, THREE, scene, ents, UI, Sound, hurt, puff, saveNow, changeDim, lookDir, addEffect, giveItem, giveXp, OFF } = api;
  let tpl = null, loading = null;
  const F = {};
  const fw = () => {
    const s = G.story.fw || (G.story.fw = {});
    s.notes = s.notes || {}; s.seen = s.seen || {}; s.shrines = s.shrines || {}; s.sigils = s.sigils || {};
    s.arena = s.arena || { active: false, lit: [0, 0, 0, 0], hp: null };
    s.hero = s.hero || { state: "dormant", aw: 0, cool: 60, grace: 90, eventCool: 40, sightings: 0, hunts: 0, log: [] };
    s.candles = s.candles || [];
    return s;
  };
  F.data = fw;
  const inFw = () => G.dim === "forsaken" && !!tpl;
  const meta = () => tpl.meta;
  const vol = k => (G.settings[k] ?? 1);

  // ---------- the packaged map ----------
  F.loadTemplate = () => {
    if (tpl) return Promise.resolve(tpl);
    if (!loading) loading = (async () => {
      const res = await fetch(MAP_URL);
      if (!res.ok) throw new Error("The Forsaken World map couldn't be downloaded.");
      const bytes = new Uint8Array(await new Response(res.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
      tpl = unpackForsaken(bytes);
      G.forsakenTpl = tpl;
      scanDoors();
      return tpl;
    })().catch(e => { loading = null; throw e; });
    return loading;
  };
  F.template = () => tpl;
  // First visit: the chests start with the map's supplies (later changes are the player's own, saved separately)
  F.setupWorld = (w, data) => {
    if (data.tplId === tpl.meta.id) return;
    for (const [k, slots] of Object.entries(tpl.meta.containers)) if (!w.containers.has(k)) w.containers.set(k, { type: "chest", slots: Array.from({ length: 27 }, (_, i) => slots[i] ? { ...slots[i], ...(itemDef(slots[i].id).tool ? { dur: itemDef(slots[i].id).tool.dur } : {}) } : null) });
    data.tplId = tpl.meta.id;
  };
  let doors = [];
  function scanDoors() {   // the map's doors, for the "door opens by itself" event
    doors = [];
    for (const [key, data] of tpl.chunks) {
      const [cx, cz] = key.split(",").map(Number);
      for (let i = 0; i < data.length; i++) if ((data[i] & 255) === B.DOOR && !((data[i] >> 8) & TOP)) doors.push({ x: cx * 16 + (i % 16), y: Math.floor(i / 256), z: cz * 16 + (Math.floor(i / 16) % 16) });
    }
  }

  // ---------- going in and coming home ----------
  F.enter = () => {
    if (G.dim === "forsaken") { UI.toast("You're already in the Forsaken World."); return; }
    if (G.dim !== "overworld") { UI.toast("The lantern's light flickers out. It only opens the way from the Surface.", "bad"); return; }
    const hc = G.meta.hardcore;
    UI.confirm("Enter the Forsaken World?", "An abandoned valley where Herobrine watches from the mist. It's an optional adventure, separate from the main story. You'll start in a safe refuge with a way home. Inside a ward you're always safe; outside, keep your eyes open." + (hc ? " This is a Hardcore world: fainting there ends the world, like anywhere else." : " If you faint there, you wake at the refuge or a shrine you restored, and anything you drop waits for you in a satchel chest.") + " Press J inside to open your journal.", async () => {
      try { await F.loadTemplate(); } catch (e) { UI.toast(e.message, "bad"); return; }
      const p = G.player, s = fw();
      s.returnTo = { dim: G.dim, x: p.pos.x, y: p.pos.y, z: p.pos.z };
      const a = tpl.meta.arrival;
      await changeDim("forsaken", Math.floor(a.x), Math.floor(a.z), "Stepping into the mist…", () => {
        Object.assign(G.player.pos, { x: a.x, y: a.y, z: a.z }); G.player.yaw = a.yaw || 0;
        s.visits = (s.visits || 0) + 1; s.arrived = Date.now();
        s.hero.grace = Math.max(s.hero.grace || 0, 90);   // a quiet start, every visit
        if (s.hero.state !== "banished") s.hero.state = "dormant";
        UI.toast(s.visits === 1 ? "The Forsaken World. Read the notes in the refuge, and press J for your journal." : s.banished ? "Back in the Vale. The mist is thin now." : "Back in the Forsaken World. The refuge's ward still holds.", s.visits === 1 ? "" : "good");
      });
    }, "Enter");
  };
  F.leave = () => {
    const s = fw(), r = s.returnTo || { dim: "overworld", x: G.player.spawn.x, z: G.player.spawn.z };
    clearHero();
    return changeDim(r.dim || "overworld", Math.floor(r.x), Math.floor(r.z), "Returning home…", () => {
      api.placeSafely(G.player, r.x, r.z); UI.toast("Home again. Your Pale Lantern can take you back any time.", "good");
    });
  };

  // ---------- wards: rings of safety ----------
  // Permanent: the refuge's Ward Stone and every restored shrine. Temporary: Ward Candles (about 2 minutes each).
  F.wards = () => {
    if (!inFw()) return [];
    const s = fw(), list = tpl.meta.wards.map(w => ({ ...w, name: "the Ward Stone" }));
    for (const sh of tpl.meta.shrines) if (s.shrines[sh.id]) list.push({ x: sh.x, y: sh.y, z: sh.z, r: sh.r, permanent: true, name: sh.name });
    for (const c of s.candles) list.push({ x: c.x, y: c.y, z: c.z, r: 5, t: c.t, candle: true, name: "a Ward Candle" });
    return list;
  };
  const wardAt = (x, z, margin = 0) => F.wards().find(w => Math.hypot(x - w.x - 0.5, z - w.z - 0.5) < w.r + margin);
  F.warded = (x, z) => inFw() && !!wardAt(x, z);
  F.placeCandle = (x, y, z) => { if (!inFw()) return; fw().candles.push({ x, y, z, t: 120 }); UI.toast("Ward Candle lit: a small safe ring for about 2 minutes.", "good"); Sound.tone(880, 0.4, "triangle", 0.08, 300); };
  F.blockBroken = (x, y, z, id) => { if (id === B.WARD_CANDLE && inFw()) fw().candles = fw().candles.filter(c => !(c.x === x && c.y === y && c.z === z)); };
  function tickCandles(dt) {
    const s = fw();
    for (const c of s.candles) {
      const before = c.t; c.t -= dt;
      if (before > 15 && c.t <= 15) UI.toast("Your Ward Candle is about to burn out (15 seconds).", "bad");
      if (c.t <= 0 && G.world.id(c.x, c.y, c.z) === B.WARD_CANDLE) { G.world.set(c.x, c.y, c.z, B.AIR); puff(c.x + 0.5, c.y + 0.5, c.z + 0.5, "poof"); }
    }
    s.candles = s.candles.filter(c => c.t > 0 && (!G.world.isLoaded(c.x, c.z) || G.world.id(c.x, c.y, c.z) === B.WARD_CANDLE));
  }

  // ---------- safe spots for Herobrine to appear: standing room, solid ground, never inside a ward or right on top of you ----------
  function standable(x, y, z) {
    const w = G.world, bad = id => id === B.LAVA || id === B.WATER || id === B.FIRE;
    return SOLID[w.id(x, y - 1, z)] && !bad(w.id(x, y - 1, z)) && !SOLID[w.id(x, y, z)] && !SOLID[w.id(x, y + 1, z)] && !bad(w.id(x, y, z)) && !bad(w.id(x, y + 1, z));
  }
  function findSpot(cx, cz, rmin, rmax, opts = {}) {
    const p = G.player, w = G.world;
    for (let t = 0; t < 30; t++) {
      const a = opts.behind ? p.yaw + rand(-0.8, 0.8) : Math.random() * Math.PI * 2, r = rand(rmin, rmax);
      const x = Math.floor(cx + (opts.behind ? Math.sin(a) : Math.cos(a)) * r), z = Math.floor(cz + (opts.behind ? Math.cos(a) : Math.sin(a)) * r);
      if (!w.isLoaded(x, z)) continue;
      // near the player's height first (caves and the mine), then the surface
      const ys = []; for (let k = 0; k <= 6; k++) ys.push(Math.floor(p.pos.y) + k, Math.floor(p.pos.y) - k);
      if (!opts.under) ys.push(w.surfaceY(x, z) + 1);
      const y = ys.find(yy => yy > 1 && yy < HEIGHT - 2 && standable(x, yy, z));
      if (y === undefined) continue;
      if (wardAt(x + 0.5, z + 0.5, 2)) continue;
      const d = Math.hypot(x + 0.5 - p.pos.x, z + 0.5 - p.pos.z);
      if (d < rmin * 0.8 || d < 2.2) continue;
      const sees = lineOfSight(w, { x: x + 0.5, y: y + 1.6, z: z + 0.5 }, { x: p.pos.x, y: p.pos.y + 1.6, z: p.pos.z });
      if (opts.visible && !sees) continue;
      if (opts.hidden && sees && inView(x + 0.5, y + 1, z + 0.5)) continue;
      return { x: x + 0.5, y, z: z + 0.5 };
    }
    return null;
  }
  function inView(x, y, z, cone = 0.55) { const p = G.player, d = lookDir(), dx = x - p.pos.x, dy = y - p.pos.y - p.eye, dz = z - p.pos.z, l = Math.hypot(dx, dy, dz) || 1; return (dx * d.x + dy * d.y + dz * d.z) / l > cone; }

  // ---------- Herobrine himself ----------
  let hero = null;   // the creature in the world right now (null when he's elsewhere)
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"); const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(235,245,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 32, 32); const t = new THREE.CanvasTexture(c); return t; })();
  function addEyeGlow(e, strength = 1) {
    // a soft white glow in front of each eye, drawn without fog so the eyes read from far away in the mist
    const head = e.parts.head.children[0];
    e.glows = [-0.15, 0.15].map(dx => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0.85 * strength, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      s.position.set(dx, 0.05, 0.27); s.scale.setScalar(0.22); head.add(s); return s;
    });
  }
  function spawnHero(spot, opts = {}) {
    clearHero();
    hero = ents.add("herobrine", spot.x, spot.y, spot.z, {});
    hero.still = true; hero.flare = 0; hero.decoy = false;
    addEyeGlow(hero);
    faceHero(hero);
    puff(spot.x, spot.y + 1, spot.z, "pale");
    if (opts.quiet !== true && vol("fwSudden") > 0) Sound.noise(5200, 0.5, 0.12 * vol("fwSudden"), 0.6, "highpass");
    return hero;
  }
  function clearHero() {
    if (hero && !hero.gone) { puff(hero.pos.x, hero.pos.y + 1, hero.pos.z, "pale"); hero.gone = true; }
    hero = null;
    for (const e of ents.list) if (e.sp === "herobrine" && !e.gone) e.gone = true;
  }
  F.clearAll = () => { clearHero(); clearArenaExtras(); };
  function faceHero(e) { const p = G.player; e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z)); const d = Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z) || 1; e.headPitch = Math.max(-0.5, Math.min(0.5, Math.atan2(p.pos.y - e.pos.y, d))); }
  function teleportHero(spot) { if (!hero) return; puff(hero.pos.x, hero.pos.y + 1, hero.pos.z, "pale"); Object.assign(hero.pos, { x: spot.x, y: spot.y, z: spot.z }); hero.vel.x = hero.vel.y = hero.vel.z = 0; hero.path = null; puff(spot.x, spot.y + 1, spot.z, "pale"); hero.flare = 0.9; Sound.noise(4000, 0.25, 0.1 * vol("fwSudden"), 1, "bandpass"); }

  // ---------- the director: Herobrine's moods ----------
  // States: dormant → observing → (investigating / stalking) → warning → hunting → retreating, plus confrontation and banished.
  const H = () => fw().hero;
  function setState(st, why) { const h = H(); if (h.state === st) return; h.state = st; h.stateT = 0; h.log = (h.log || []).slice(-19); h.log.push({ st, why: why || "", t: Math.round(h.clock || 0) }); }
  F.state = () => (inFw() ? H().state : null);
  let dirT = 0, stareT = 0, stepT = 0, warnFx = 0;
  function region() { const p = G.player, r = (tpl.meta.regions || []).find(q => p.pos.x >= q.x0 && p.pos.x <= q.x1 && p.pos.z >= q.z0 && p.pos.z <= q.z1); return r || null; }
  function progress() { return Object.keys(fw().shrines).length; }
  function director(dt) {
    const s = fw(), h = H(), p = G.player;
    h.clock = (h.clock || 0) + dt; h.stateT = (h.stateT || 0) + dt;
    if (h.grace > 0) h.grace -= dt;
    if (h.cool > 0) h.cool -= dt;
    if (h.eventCool > 0) h.eventCool -= dt;
    if (s.banished || h.state === "banished" || h.state === "confrontation") return;
    const safe = !!wardAt(p.pos.x, p.pos.z), pale = region();
    // awareness: noise and danger raise it; quiet and wards let it fade
    const sprint = (api.keys.has("ShiftLeft") || api.keys.has("ShiftRight")) && Math.hypot(p.vel.x, p.vel.z) > 5;
    let gain = 0;
    if (sprint) gain += 1.2;
    if (G.mining) gain += 1.6;
    if (G.attackCd > 0.2) gain += 2;
    if (pale) gain += 0.8 + (G.inv.slots.some(q => q && QUEST.includes(q.id)) ? 0.5 : 0);
    gain += progress() * 0.15;
    const fade = safe ? 3 : p.crouch || Math.hypot(p.vel.x, p.vel.z) < 0.3 ? 0.9 : 0.4;
    h.aw = Math.max(0, Math.min(100, h.aw + (gain - (gain ? 0.1 : fade)) * dt));
    const look = hero && inView(hero.pos.x, hero.pos.y + 1.5, hero.pos.z, 0.97) && lineOfSight(G.world, { x: hero.pos.x, y: hero.pos.y + 1.6, z: hero.pos.z }, { x: p.pos.x, y: p.pos.y + 1.6, z: p.pos.z });
    stareT = look ? stareT + dt : 0;
    if (hero && hero.flare > 0) hero.flare -= dt;
    switch (h.state) {
      case "dormant": {
        if (hero) clearHero();
        if (safe) break;
        if (h.grace > 45 || h.cool > 0) { if (h.grace <= 0) randomEvent(dt); break; }
        if (h.aw > 70 && h.grace <= 0) { setState("warning", "awareness"); break; }
        if (h.aw > 40 && h.grace <= 0) { startStalk(); break; }
        if (h.aw > 22 && h.lastNoise && Math.random() < dt * 0.15) { startInvestigate(); break; }
        if ((h.aw > 8 && Math.random() < dt * 0.05) || h.stateT > rand(80, 110)) { startObserve(); break; }
        randomEvent(dt);
        break;
      }
      case "observing": {   // perfectly still, watching from far away
        if (!hero) { setState("dormant"); break; }
        hero.still = true; hero.chase = null; faceHero(hero);
        const d = Math.hypot(hero.pos.x - p.pos.x, hero.pos.z - p.pos.z);
        if (d < 12 || stareT > 1.4 || h.stateT > h.watchFor || safe) { clearHero(); h.cool = Math.max(h.cool, 25); setState("dormant", d < 12 ? "approached" : stareT > 1.4 ? "stared at" : "done watching"); }
        break;
      }
      case "investigating": {   // walks slowly toward where you made noise
        if (!hero) { setState("dormant"); break; }
        hero.still = false; hero.chase = h.lastNoise; hero.chaseSpeed = 2;
        if (h.aw > 40 && h.grace <= 0) { startStalk(); break; }
        if (stareT > 1.2 || h.stateT > 25 || safe || Math.hypot(hero.pos.x - h.lastNoise.x, hero.pos.z - h.lastNoise.z) < 2) { clearHero(); h.cool = Math.max(h.cool, 30); setState("dormant", "lost interest"); }
        break;
      }
      case "stalking": {   // follows behind you, stepping somewhere else if you catch him looking
        if (!hero) { setState("dormant"); break; }
        hero.still = false;
        const back = { x: p.pos.x + Math.sin(p.yaw) * 14, y: p.pos.y, z: p.pos.z + Math.cos(p.yaw) * 14 };
        hero.chase = back; hero.chaseSpeed = 3.4;
        if ((stareT > 0.8 || Math.hypot(hero.pos.x - p.pos.x, hero.pos.z - p.pos.z) > 32) && (h.tpCool = (h.tpCool || 0) - dt) <= 0) {
          const spot = findSpot(p.pos.x, p.pos.z, 13, 19, { behind: true, hidden: true });
          if (spot) { teleportHero(spot); h.tpCool = 6; }
        } else if (h.tpCool > 0) h.tpCool -= dt;
        if ((stepT -= dt) <= 0) { stepT = rand(3, 6); footsteps(Math.hypot(hero.pos.x - p.pos.x, hero.pos.z - p.pos.z)); }
        if (safe || h.aw < 20) { clearHero(); h.cool = 40; setState("dormant", safe ? "reached a ward" : "lost track"); break; }
        if (h.aw > 65 && h.grace <= 0) setState("warning", "stalked long enough");
        break;
      }
      case "warning": {   // the air goes still: readable signs before a hunt
        if (h.stateT < dt * 1.5) { warnFx = 1; UI.toast("The air goes very still… something is coming. Get to a ward or get ready!", "bad"); if (vol("fwSudden") > 0) Sound.tone(110, 1.6, "sine", 0.12 * vol("fwSudden"), -30); }
        if (safe) { clearHero(); h.aw = 25; h.cool = 60; setState("dormant", "safe in a ward"); UI.toast("The stillness passes. The ward kept you hidden.", "good"); break; }
        if (h.stateT > 8) startHunt();
        break;
      }
      case "hunting": {   // a bounded chase with telegraphed strikes, then he backs off
        if (!hero) { const spot = findSpot(p.pos.x, p.pos.z, 10, 16, { hidden: true }); if (spot) spawnHero(spot); else break; }
        hero.still = false; hero.chase = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; hero.chaseSpeed = 4.3;
        const d = Math.hypot(hero.pos.x - p.pos.x, hero.pos.z - p.pos.z);
        if ((h.strikeT = (h.strikeT ?? 6) - dt) <= 0 && !safe) {
          h.strikeT = 9;
          const spot = findSpot(p.pos.x, p.pos.z, 3, 4.5, {});
          if (spot) { teleportHero(spot); h.strikeAt = 0.9; }
        }
        if (h.strikeAt > 0) { h.strikeAt -= dt; hero.still = true; hero.chase = null; faceHero(hero); if (h.strikeAt <= 0 && d < 2.8 && !safe && G.respawnGuard <= 0) heroHurt(4, "Herobrine struck you! When his eyes flare after he appears, step away."); }
        else if (d < 1.6 && (h.hitT = (h.hitT || 0) - dt) <= 0 && !safe) { h.hitT = 1.5; heroHurt(3, "Herobrine caught you. Sprint for a ward when the eye turns red!"); }
        if ((stepT -= dt) <= 0) { stepT = 1.2; footsteps(d); }
        if (safe || h.stateT > 40 || d > 42) endHunt(safe ? "you reached a ward" : h.stateT > 40 ? "the hunt ran out" : "you got away");
        break;
      }
      case "retreating": if (h.stateT > 1) setState("dormant"); break;
    }
  }
  function heroHurt(n, why) {
    if (G.respawnGuard > 0 || wardAt(G.player.pos.x, G.player.pos.z)) return;   // never through a ward, never right after waking up
    const mul = { peaceful: 0.5, easy: 0.67, normal: 1, hard: 1.5 }[G.wset.difficulty] ?? 1;
    hurt(n * mul, why, hero, false);
  }
  function startObserve() {
    const p = G.player, wps = (tpl.meta.watchPoints || []).filter(w => { const d = Math.hypot(w.x - p.pos.x, w.z - p.pos.z); return d > 20 && d < 48 && G.world.isLoaded(w.x, w.z) && !wardAt(w.x, w.z, 2); });
    let spot = wps.length && Math.random() < 0.6 ? wps[Math.floor(Math.random() * wps.length)] : null;
    if (spot && !lineOfSight(G.world, { x: spot.x, y: spot.y + 1.6, z: spot.z }, { x: p.pos.x, y: p.pos.y + 1.6, z: p.pos.z })) spot = null;
    spot = spot || findSpot(p.pos.x, p.pos.z, 22, 38, { visible: true });
    if (!spot) return;
    spawnHero(spot, { quiet: true }); H().watchFor = rand(7, 12); setState("observing", "watching");
    const h = H(); h.sightings = (h.sightings || 0) + 1; G.adv("sighting");
  }
  function startInvestigate() { const n = H().lastNoise, spot = findSpot(n.x, n.z, 14, 22, { hidden: true }); if (!spot) return; spawnHero(spot, { quiet: true }); setState("investigating", "heard something"); }
  function startStalk() { const p = G.player, spot = findSpot(p.pos.x, p.pos.z, 14, 20, { behind: true, hidden: true }); if (!spot) return; spawnHero(spot, { quiet: true }); setState("stalking", "following"); }
  function startHunt() {
    const h = H(), p = G.player, spot = findSpot(p.pos.x, p.pos.z, 12, 18, { hidden: true });
    if (spot) spawnHero(spot); setState("hunting", "hunt"); h.strikeT = 6; h.hunts = (h.hunts || 0) + 1;
    if (vol("fwSudden") > 0) Sound.mob("roar", 30);
    // a few Pale Sentinels join later hunts (never more than 3 nearby)
    if (progress() >= 1 && ents.list.filter(e => e.sp === "sentinel" && !e.dead).length < 3) for (let k = 0; k < Math.min(2, progress()); k++) { const sp = findSpot(p.pos.x, p.pos.z, 10, 16, { hidden: true }); if (sp) { const e = ents.add("sentinel", sp.x, sp.y, sp.z, {}); e.angry = 60; } }
  }
  function endHunt(why) {
    const h = H(); clearHero(); h.aw = 15; h.cool = Math.max(70, 150 - progress() * 20); h.grace = Math.max(h.grace, 20);
    setState("retreating", why);
    UI.toast(why === "you reached a ward" ? "He stops at the edge of the ward and is gone." : "The mist settles. He's gone, for now.", "good");
  }
  F.noise = (x, y, z) => { if (inFw()) H().lastNoise = { x, y, z }; };   // mining and fighting leave a spot he may come to look at
  F.onRespawn = () => { const h = H(); clearHero(); h.grace = Math.max(h.grace, 30); h.aw = Math.min(h.aw, 15); if (h.state !== "banished" && h.state !== "confrontation") setState("dormant", "you woke up"); };

  // ---------- events: small scary moments with rules (cooldowns, conditions, never trapping you) ----------
  const EVENTS = [
    { id: "footsteps", ok: () => H().aw > 5, run: () => footsteps(6) },
    { id: "silhouette", ok: () => !region() && G.player.pos.y > 30, run: silhouette },
    { id: "mist", ok: () => G.settings.fwEffects !== false, run: () => { warnFx = 0.6; } },
    { id: "door", ok: () => doors.length > 0, run: doorEvent },
    { id: "moved", ok: () => true, run: movedObject }
  ];
  function randomEvent(dt) {
    const h = H();
    if (h.eventCool > 0 || Math.random() > dt * 0.08) return;
    const list = EVENTS.filter(e => (h["ev_" + e.id] || 0) <= h.clock && e.ok());
    if (!list.length) return;
    const e = list[Math.floor(Math.random() * list.length)];
    if (e.run() === false) return;
    h.eventCool = rand(35, 60); h["ev_" + e.id] = h.clock + 90;
  }
  function footsteps(dist) {
    const v = vol("fwSudden") * Math.max(0.15, 1 - dist / 30);
    if (v <= 0.01) return;
    for (let i = 0; i < 3; i++) setTimeout(() => Sound.noise(380, 0.07, 0.25 * v, 1.5), i * 420);
  }
  function silhouette() {   // he crosses an opening far away, then he's gone
    const p = G.player, spot = findSpot(p.pos.x, p.pos.z, 24, 32, { visible: true });
    if (!spot) return false;
    spawnHero(spot, { quiet: true }); hero.still = false;
    const side = p.yaw + Math.PI / 2; hero.chase = { x: spot.x + Math.sin(side) * 8, y: spot.y, z: spot.z + Math.cos(side) * 8 }; hero.chaseSpeed = 2.2;
    setTimeout(() => { if (hero && H().state === "dormant") clearHero(); }, 3200);
    return true;
  }
  function doorEvent() {   // a door swings open somewhere nearby (only opens, and only when you're not standing in it)
    const p = G.player, d = doors.filter(o => { const dd = Math.hypot(o.x - p.pos.x, o.z - p.pos.z); return dd > 5 && dd < 22 && G.world.isLoaded(o.x, o.z) && idOf(G.world.get(o.x, o.y, o.z)) === B.DOOR && !(metaOf(G.world.get(o.x, o.y, o.z)) & OPEN); });
    if (!d.length) return false;
    const o = d[Math.floor(Math.random() * d.length)];
    for (const yy of [o.y, o.y + 1]) { const v = G.world.get(o.x, yy, o.z); if (idOf(v) === B.DOOR) G.world.set(o.x, yy, o.z, make(B.DOOR, metaOf(v) | OPEN)); }
    Sound.door(true);
    return true;
  }
  function movedObject() {   // the skull in Hollowmere's square is never where you left it
    const s = fw(), v = tpl.meta.landmarks.find(l => l.key === "village"), p = G.player;
    if (!v || Math.hypot(p.pos.x - v.x, p.pos.z - v.z) < 20 || !G.world.isLoaded(v.x, v.z)) return false;
    const spots = [[-5, -5], [5, -5], [5, 5], [-5, 5]].map(([dx, dz]) => ({ x: v.x + dx, y: v.h + 1, z: v.z + dz }));
    const cur = spots[s.skull || 0], next = (s.skull || 0) + 1 + Math.floor(Math.random() * 2);
    if (G.world.id(cur.x, cur.y, cur.z) === B.SKULL) G.world.set(cur.x, cur.y, cur.z, B.AIR);
    s.skull = next % spots.length; const n = spots[s.skull];
    if (!G.world.id(n.x, n.y, n.z)) G.world.set(n.x, n.y, n.z, B.SKULL);
    return true;
  }
  F.ensureSkull = () => { const s = fw(), v = tpl.meta.landmarks.find(l => l.key === "village"); if (!v || s.skullPlaced || !G.world.isLoaded(v.x - 5, v.z - 5)) return; G.world.set(v.x - 5, v.h + 1, v.z - 5, B.SKULL); s.skull = 0; s.skullPlaced = true; };

  // ---------- story: notes, landmarks, sigils, shrines ----------
  F.readNote = (key) => {
    const s = fw(), n = NOTES[key] || LATE_NOTES[key];
    if (!n) return;
    const first = !s.notes[key]; s.notes[key] = Date.now();
    UI.openNote(n.title, n.text, first);
    if (first) G.adv("note", key);
  };
  function noteAt(x, y, z) { const k = x + "," + y + "," + z; return tpl.meta.notes[k] || (fw().extraNotes || {})[k]; }
  function tickStory(dt) {
    const s = fw(), p = G.player;
    for (const l of tpl.meta.landmarks) if (!s.seen[l.key] && Math.hypot(p.pos.x - l.x, p.pos.z - l.z) < l.r + 6) { s.seen[l.key] = Date.now(); UI.toast(`Discovered: ${l.name}`, "good"); G.adv("landmark", l.key); if (l.key === "tower") G.adv("tower"); }
    // the first time you climb the Watchtower, he watches you from beyond the ridge
    const tt = tpl.meta.towerTop;
    if (!s.towerSeen && Math.hypot(p.pos.x - tt.x, p.pos.z - tt.z) < 4 && p.pos.y >= tt.y - 0.5 && H().state !== "banished" && !s.banished) {
      s.towerSeen = true;
      const c = tpl.meta.citadel, spot = { x: c.x + 0.5, y: G.world.surfaceY(c.x, c.gate.z - 6) + 1, z: c.gate.z - 6 + 0.5 };
      if (G.world.isLoaded(spot.x, spot.z)) { spawnHero(spot, { quiet: true }); H().watchFor = 9; setState("observing", "the watchtower"); G.adv("sighting"); }
    }
    // sigils: mark them found; if one goes missing (it can't be dropped or stored), it comes back to you
    for (const [id, item] of Object.entries(SIGILS)) {
      const has = G.inv.slots.some(q => q && q.id === item);
      if (has && !s.sigils[id]) { s.sigils[id] = "found"; UI.toast(`You found the ${itemDef(item).name}! Set it into its shrine's Ward Altar.`, "good"); }
      if (!has && s.sigils[id] === "found" && (s.recoverT = (s.recoverT || 0) + dt) > 3) { s.recoverT = 0; giveItem(item, 1); UI.toast(`The ${itemDef(item).name} found its way back to you.`, ""); }
    }
    if (s.heart === "have" && !G.inv.slots.some(q => q && q.id === I.WARD_HEART) && (s.heartT = (s.heartT || 0) + dt) > 3) { s.heartT = 0; giveItem(I.WARD_HEART, 1); }
    // the chalk clue appears at the refuge after the first shrine wakes
    if (progress() >= 1 && !s.chalk) {
      const r = tpl.meta.landmarks.find(l => l.key === "refuge"), at = { x: r.x, y: r.h + 1, z: r.z - 5 };
      if (G.world.isLoaded(at.x, at.z) && !G.world.id(at.x, at.y, at.z)) { G.world.set(at.x, at.y, at.z, B.NOTE_STAND); (s.extraNotes = s.extraNotes || {})[at.x + "," + at.y + "," + at.z] = "chalk"; s.chalk = true; UI.toast("You feel that something changed back at the refuge.", ""); }
    }
  }
  function restoreShrine(hit) {
    const s = fw(), sh = tpl.meta.shrines.find(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (!sh) return;
    if (s.shrines[sh.id]) { UI.toast(`${sh.name} is awake. You're safe within ${sh.r} blocks of it, and you'll wake here if you faint.`, "good"); s.checkpoint = sh.id; return; }
    const item = I[sh.sigil], at = G.inv.slots.findIndex(q => q && q.id === item);
    if (at < 0) { UI.toast(`This ${sh.name} is dark. It needs the ${itemDef(item).name}.`); return; }
    G.inv.slots[at] = null; s.sigils[Object.keys(SIGILS).find(k => SIGILS[k] === item)] = "used";
    s.shrines[sh.id] = Date.now(); s.checkpoint = sh.id;
    G.world.set(hit.x, hit.y, hit.z, make(B.WARD_ALTAR, 1));
    for (let i = 0; i < 6; i++) puff(hit.x + 0.5, hit.y + 1 + i * 0.3, hit.z + 0.5, "pale");
    Sound.levelUp(); G.hudDirty = true;
    UI.toast(`${sh.name} wakes! Safe ground, and your new checkpoint.`, "good");
    G.adv("shrine", sh.id);
    if (progress() >= 3 && !s.heart) { s.heart = "have"; giveItem(I.WARD_HEART, 1); setTimeout(() => { UI.toast("The three shrines' light joins into a Ward Heart!", "good"); F.readNote("heart"); }, 1200); }
    H().aw = Math.max(0, H().aw - 20);
    saveNow(false);
  }

  // ---------- interactions with the adventure's blocks ----------
  F.interact = (hit, kind) => {
    if (kind === "note") { const k = inFw() ? noteAt(hit.x, hit.y, hit.z) : null; if (k) F.readNote(k); else UI.toast("The writing has faded."); return true; }
    if (kind === "wardstone") { UI.toast(inFw() ? "The Ward Stone hums. Within its blue ring you are completely safe, always." : "A Ward Stone. It only matters in the Forsaken World."); return true; }
    if (kind === "returngate") { if (inFw()) F.leave(); else UI.toast("The gate is quiet here."); return true; }
    if (kind === "wardaltar") { if (inFw()) restoreShrine(hit); return true; }
    if (kind === "candle") { const c = fw().candles.find(q => q.x === hit.x && q.y === hit.y && q.z === hit.z); UI.toast(c ? `This Ward Candle has about ${Math.ceil(c.t)} seconds left.` : "This candle has gone out."); return true; }
    if (kind === "palealtar") { if (inFw()) useAltar(); return true; }
    if (kind === "arenaward") { if (inFw()) startChannel(hit); return true; }
    return false;
  };

  // ---------- the final confrontation in the Pale Citadel ----------
  // Phase 1 (no arena wards lit): learn his attacks; he can't be hurt. Phase 2 (some lit): illusions, marked lightning,
  // sentinels, and he snuffs out lit wards unless you guard them. Phase 3 (all four lit at once): he's solid and can be banished.
  let decoys = [], bolts = [], waves = [], channel = null, beam = null;
  const A = () => fw().arena;
  const C = () => tpl.meta.citadel;
  const inCitadel = (pad = 0) => { const c = C(), p = G.player; return p.pos.x > c.x0 - pad && p.pos.x < c.x1 + 1 + pad && p.pos.z > c.z0 - pad && p.pos.z < c.z1 + 1 + pad; };
  const litCount = () => A().lit.filter(Boolean).length;
  F.arenaPhase = () => (!A().active ? 0 : litCount() === 4 ? 3 : litCount() > 0 ? 2 : 1);
  function setDevice(i, on) {
    const d = C().devices[i]; A().lit[i] = on ? 1 : 0;
    if (G.world.isLoaded(d.x, d.z)) G.world.set(d.x, d.y, d.z, make(B.ARENA_WARD, on ? 1 : 0));
    puff(d.x + 0.5, d.y + 1, d.z + 0.5, on ? "pale" : "poof");
  }
  function useAltar() {
    const s = fw(), a = A();
    if (a.active) { UI.toast("He's already here! Light the four arena wards."); return; }
    if (s.banished) {
      UI.confirm("Call him back?", "Herobrine is banished. Placing your hand on the Pale Altar calls him back for a rematch (no new trophy, just experience). The Vale stays safe outside the citadel.", () => startFight(true), "Rematch");
      return;
    }
    if (s.heart !== "placed") {
      const at = G.inv.slots.findIndex(q => q && q.id === I.WARD_HEART);
      if (at < 0) { UI.toast("A cold, empty altar. Something made of light belongs here: the Ward Heart from the three shrines."); return; }
      G.inv.slots[at] = null; s.heart = "placed"; G.hudDirty = true;
    }
    startFight(false);
  }
  function startFight(rematch) {
    const a = A(), c = C();
    a.active = true; a.hp = 120; a.rematch = !!rematch; a.lit = [0, 0, 0, 0]; a.cool = 3; a.attack = null;
    for (let i = 0; i < 4; i++) setDevice(i, false);
    setState("confrontation", "the altar");
    clearHero();
    spawnHero({ x: c.altar.x + 0.5, y: c.altar.y + 1, z: c.altar.z + 0.5 }); hero.boss = true; hero.hp = a.hp;
    Sound.mob("roar", 0); warnFx = 1;
    UI.toast("Herobrine appears! Light the four arena wards (right-click each and stay close) to make him solid.", "bad");
    G.adv("confront");
    saveNow(false);
  }
  function resumeFight() { const a = A(), c = C(); if (hero) return; spawnHero({ x: c.altar.x + 0.5, y: c.altar.y + 1, z: c.altar.z + 0.5 }); hero.boss = true; hero.hp = a.hp; a.cool = 2; for (let i = 0; i < 4; i++) setDevice(i, !!a.lit[i]); }
  function clearArenaExtras() {
    for (const d of decoys) d.gone = true; decoys = [];
    for (const b of bolts) { scene.remove(b.mark); b.mark.geometry.dispose(); b.mark.material.dispose(); if (b.col) { scene.remove(b.col); b.col.material.dispose(); } }
    bolts = [];
    for (const w of waves) { scene.remove(w.mesh); w.mesh.geometry.dispose(); w.mesh.material.dispose(); } waves = [];
    for (const e of ents.list) if (e.sp === "sentinel" && e.arena) e.gone = true;
    channel = null; if (beam) beam.visible = false;
  }
  F.resetFight = (why) => {   // fainting or leaving for good: everything goes back to how it was before you started
    const a = A(); if (!a.active) return;
    a.active = false; a.hp = null; clearHero(); clearArenaExtras();
    for (let i = 0; i < 4; i++) setDevice(i, false);
    a.lit = [0, 0, 0, 0];
    setState("dormant", why);
  };
  // Arena wards: right-click and stay within 3 blocks for 2 seconds
  function startChannel(hit) {
    const a = A(), i = C().devices.findIndex(d => d.x === hit.x && d.y === hit.y && d.z === hit.z);
    if (!a.active) { UI.toast("An arena ward, cold and dark. It will only light while he is here."); return; }
    if (i < 0 || a.lit[i]) { UI.toast("This ward is already burning."); return; }
    channel = { i, t: 0 };
  }
  function tickChannel(dt) {
    if (!channel) return;
    const d = C().devices[channel.i], p = G.player;
    if (Math.hypot(p.pos.x - d.x - 0.5, p.pos.z - d.z - 0.5) > 3.2) { channel = null; UI.toast("You moved away. Stay close to light the ward.", "bad"); return; }
    channel.t += dt;
    if (Math.random() < 0.4) puff(d.x + 0.5, d.y + 1, d.z + 0.5, "pale");
    if (channel.t >= 2) {
      setDevice(channel.i, true); Sound.tone(660, 0.4, "triangle", 0.12, 300); channel = null;
      const n = litCount();
      UI.toast(n === 4 ? "All four wards burn! He's solid now. Strike him!" : `Arena ward lit (${n} of 4).`, n === 4 ? "good" : "");
    }
  }
  function tickFight(dt) {
    const a = A(), p = G.player, c = C();
    if (!a.active) return;
    if (!inCitadel(6)) { if (hero) { a.hp = hero.hp ?? a.hp; clearHero(); clearArenaExtras(); UI.toast("He waits in his citadel. Your progress there is kept.", ""); } return; }
    if (!hero) resumeFight();
    tickChannel(dt);
    const ph = F.arenaPhase(), bound = ph === 3;
    hero.bossPhase = ph;
    // decoys flicker and fade; the real one never flickers
    for (const dcy of decoys) { dcy.life -= dt; if (dcy.mat) dcy.mat.opacity = 0.55 + Math.sin(dcy.age * 18) * 0.25; if (dcy.life <= 0 || dcy.dead) { puff(dcy.pos.x, dcy.pos.y + 1, dcy.pos.z, "poof"); dcy.gone = true; } }
    decoys = decoys.filter(d => !d.gone);
    tickBolts(dt); tickWaves(dt);
    if (!hero || !a.active) return;   // you may have fainted from a bolt or a shockwave just now
    // the ongoing attack
    const at = a.attack;
    if (at) {
      at.t += dt;
      if (at.kind === "strike") { hero.still = true; hero.chase = null; faceHero(hero); if (at.t >= 0.9 && !at.done) { at.done = true; if (Math.hypot(hero.pos.x - p.pos.x, hero.pos.z - p.pos.z) < 2.8) heroHurt(5, "Herobrine's strike hit you. When his eyes flare, step back!"); a.attack = null; } }
      else if (at.kind === "wave") { hero.still = true; hero.chase = null; hero.raise = Math.min(1, at.t / 0.8); if (at.t >= 0.9) { hero.raise = 0; shockwave(hero.pos.x, hero.pos.y, hero.pos.z); a.attack = null; } }
      else if (at.kind === "disrupt") {
        hero.still = true; hero.chase = null; hero.point = true; faceDevice(at.i);
        showBeam(hero, C().devices[at.i]);
        if (at.t >= 2) {
          hero.point = false; if (beam) beam.visible = false;
          const d = C().devices[at.i];
          if (Math.hypot(p.pos.x - d.x - 0.5, p.pos.z - d.z - 0.5) < 3.2) UI.toast("You guarded the ward! It keeps burning.", "good");
          else if (a.lit[at.i]) { setDevice(at.i, false); UI.toast("He snuffed out an arena ward! Light it again.", "bad"); }
          a.attack = null;
        }
      }
      if (!a.attack) a.cool = bound ? 3.6 : ph === 2 ? 2.8 : 3.2;
      return;
    }
    // moving between attacks: bound and slow once all four wards burn
    hero.still = false; hero.point = false;
    hero.chase = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; hero.chaseSpeed = bound ? 1.6 : 3.2;
    if ((a.cool -= dt) > 0) return;
    const pick = [];
    pick.push(bound ? "wave" : "strike", "wave");
    if (ph >= 2) { pick.push("bolts", "disrupt"); if (decoys.length === 0) pick.push("decoys"); if (ents.list.filter(e => e.sp === "sentinel" && e.arena && !e.dead).length < 2) pick.push("sentinels"); }
    if (bound) pick.push("bolts");
    const k = pick[Math.floor(Math.random() * pick.length)];
    if (k === "strike") { const spot = findSpot(p.pos.x, p.pos.z, 2.5, 3.5, {}); if (spot && inside(spot)) teleportHero(spot); a.attack = { kind: "strike", t: 0 }; }
    else if (k === "wave") a.attack = { kind: "wave", t: 0 };
    else if (k === "bolts") { for (let n = 0; n < (bound ? 2 : 3); n++) { const ang = Math.random() * Math.PI * 2, r = n === 0 ? 0 : rand(2.5, 6); markBolt(p.pos.x + Math.cos(ang) * r, c.y, p.pos.z + Math.sin(ang) * r); } a.cool = 2.5; }
    else if (k === "decoys") { makeDecoys(); a.cool = 2; }
    else if (k === "sentinels") { for (let n = 0; n < 2; n++) { const spot = findSpot(c.x, c.z + 0.5, 6, 11, {}); if (spot && inside(spot)) { const e = ents.add("sentinel", spot.x, spot.y, spot.z, {}); e.arena = true; e.angry = 60; puff(spot.x, spot.y + 1, spot.z, "pale"); } } a.cool = 2.5; }
    else if (k === "disrupt") { const litNow = a.lit.map((v, i) => v ? i : -1).filter(i => i >= 0); if (litNow.length) { a.attack = { kind: "disrupt", t: 0, i: litNow[Math.floor(Math.random() * litNow.length)] }; UI.toast("He's reaching for a ward! Stand next to it to guard it.", "bad"); } else a.cool = 0.5; }
  }
  const inside = s => s.x > C().x0 + 1 && s.x < C().x1 && s.z > C().z0 + 1 && s.z < C().z1;
  function faceDevice(i) { const d = C().devices[i]; hero.yaw = Math.atan2(-(d.x + 0.5 - hero.pos.x), -(d.z + 0.5 - hero.pos.z)); }
  function showBeam(from, d) {
    if (!beam) { beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff })); beam.frustumCulled = false; scene.add(beam); }
    beam.visible = true; const a = beam.geometry.attributes.position; a.setXYZ(0, from.pos.x, from.pos.y + 1.4, from.pos.z); a.setXYZ(1, d.x + 0.5, d.y + 0.6, d.z + 0.5); a.needsUpdate = true;
  }
  // a ring that spreads out along the floor: jump over it, or put a pillar between you and him
  function shockwave(x, y, z) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y + 0.08, z); scene.add(mesh);
    waves.push({ x, y, z, r: 1, mesh, hit: false });
    Sound.noise(160, 0.6, 0.35 * Math.max(0.3, vol("fwSudden")), 0.8, "lowpass");
    if (G.settings.reducedMotion !== true && G.settings.fwShake !== false) G.player.hurtT = Math.max(G.player.hurtT, 0.2);
  }
  function tickWaves(dt) {
    const p = G.player;
    for (const w of waves) {
      w.r += 8.5 * dt; w.mesh.scale.setScalar(w.r); w.mesh.material.opacity = Math.max(0, 0.85 * (1 - w.r / 15));
      const d = Math.hypot(p.pos.x - w.x, p.pos.z - w.z);
      if (!w.hit && Math.abs(d - w.r) < 0.7 && p.onGround && Math.abs(p.pos.y - w.y) < 1.2 && lineOfSight(G.world, { x: w.x, y: w.y + 0.6, z: w.z }, { x: p.pos.x, y: p.pos.y + 0.6, z: p.pos.z })) {
        w.hit = true; heroHurt(4, "The shockwave knocked you down. Jump over the ring, or hide behind a pillar!");
        const l = d || 1; G.player.vel.x += (p.pos.x - w.x) / l * 6; G.player.vel.y = 5; G.player.vel.z += (p.pos.z - w.z) / l * 6;
      }
      if (w.r > 15) { w.done = true; scene.remove(w.mesh); w.mesh.geometry.dispose(); w.mesh.material.dispose(); }
    }
    waves = waves.filter(w => !w.done);
  }
  // marked lightning: a ring on the floor first, then a bolt
  function markBolt(x, y, z) {
    const mark = new THREE.Mesh(new THREE.RingGeometry(1.6, 2, 28), new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    mark.rotation.x = -Math.PI / 2; mark.position.set(x, y + 0.06, z); scene.add(mark);
    bolts.push({ x, y, z, t: 1.5, mark, col: null });
  }
  function tickBolts(dt) {
    const p = G.player;
    for (const b of bolts) {
      b.t -= dt;
      if (b.t > 0) { b.mark.material.opacity = 0.4 + Math.abs(Math.sin(b.t * 8)) * 0.4; continue; }
      if (!b.col) {
        b.col = new THREE.Mesh(new THREE.BoxGeometry(0.35, 24, 0.35), new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
        b.col.position.set(b.x, b.y + 12, b.z); scene.add(b.col);
        Sound.noise(2600, 0.4, 0.3 * Math.max(0.3, vol("fwSudden")), 0.5, "highpass");
        if (Math.hypot(p.pos.x - b.x, p.pos.z - b.z) < 2 && Math.abs(p.pos.y - b.y) < 3) { heroHurt(6, "Lightning struck where the ring was. Step out of the blue rings!"); addEffect("fire", 2); }
      }
      if (b.t < -0.3) { b.done = true; scene.remove(b.mark); b.mark.geometry.dispose(); b.mark.material.dispose(); scene.remove(b.col); b.col.geometry.dispose(); b.col.material.dispose(); }
    }
    bolts = bolts.filter(b => !b.done);
  }
  // illusions: copies that look like him but flicker, and whose eyes don't glow
  function makeDecoys() {
    const c = C();
    for (let n = 0; n < 2; n++) {
      const spot = findSpot(c.x, c.z + 0.5, 4, 11, {});
      if (!spot || !inside(spot)) continue;
      const d = ents.add("herobrine", spot.x, spot.y, spot.z, {});
      d.decoy = true; d.life = 12; d.still = false; d.chase = { x: G.player.pos.x, y: G.player.pos.y, z: G.player.pos.z }; d.chaseSpeed = 2.8;
      d.mat = d.mat || null; if (d.mat) { d.mat.transparent = true; d.mat.opacity = 0.7; }
      decoys.push(d); puff(spot.x, spot.y + 1, spot.z, "pale");
    }
    const spot = findSpot(c.x, c.z + 0.5, 4, 11, {}); if (spot && inside(spot)) teleportHero(spot);
    UI.toast("Illusions! The real Herobrine's eyes glow, and he doesn't flicker.", "");
  }
  // hitting Herobrine: decoys pop; the real one only takes damage while all four wards burn
  let passMsgT = 0;
  F.heroHit = (e, n) => {
    if (e.decoy) { e.life = 0; return 0; }
    if (!A().active || e !== hero) { if (performance.now() - passMsgT > 4000) { passMsgT = performance.now(); UI.toast("Your hit passes right through him. In his world, only his citadel's wards can make him solid.", "bad"); } return 0; }
    if (F.arenaPhase() !== 3) { if (performance.now() - passMsgT > 3000) { passMsgT = performance.now(); UI.toast(`He can't be hurt yet: light all four arena wards (${litCount()} of 4 lit).`, "bad"); } return 0; }
    if (e.hp - n <= 0) { banish(); return 0; }
    A().hp = e.hp - n;
    return n;
  };
  function banish() {
    const s = fw(), a = A(), first = !s.banished;
    a.active = false; a.hp = null;
    const h = hero; hero = null;
    if (h) { h.still = true; h.chase = null; let t = 0; const rise = setInterval(() => { t += 0.05; h.pos.y += 0.05; puff(h.pos.x, h.pos.y + 1, h.pos.z, "pale"); if (h.mat) { h.mat.transparent = true; h.mat.opacity = Math.max(0, 1 - t / 2.5); } if (t > 2.5) { clearInterval(rise); h.gone = true; } }, 50); }
    clearArenaExtras();
    for (let i = 0; i < 4; i++) setDevice(i, false);
    s.banished = Date.now(); H().state = "banished"; s.wins = (s.wins || 0) + 1;
    const flash = document.getElementById("flash"); flash.style.background = "rgba(235,245,255,.55)"; flash.classList.add("on"); setTimeout(() => { flash.classList.remove("on"); setTimeout(() => flash.style.background = "", 500); }, 400);
    Sound.levelUp(); setTimeout(() => Sound.levelUp(), 450);
    if (first && !s.rewarded) {   // unique rewards, given once and saved right away
      s.rewarded = Date.now();
      giveItem(B.PALE_EFFIGY, 1); giveItem(I.WARD_LANTERN, 1); giveItem(B.PALE_BRICKS, 32); giveXp(300);
      G.settings.unlocked = [...new Set([...(G.settings.unlocked || []), "wardkeeper"])]; api.saveSettings(G.settings);
      (s.extraNotes = s.extraNotes || {}); s.notes.free = Date.now();
    } else giveXp(100);
    G.adv("banished", first ? 1 : 2);
    if (G.campaign && G.campaign.externalBoss) G.campaign.externalBoss("herobrine");   // Legacy Campaign, Chapter 6: the Relic of Shadows
    saveNow(true);
    api.victory(first ? "Herobrine is banished!" : "Herobrine is banished again!", first ? "His watch is over. Your rewards: a Pale Effigy trophy, the Wardlight Lantern (hold it and monsters won't appear near you), 32 Pale Bricks, the new Wardkeeper skin, and experience. The mist is lifting. Visit any time." : "The Vale is quiet again. You earned more experience.", { x: C().x + 0.5, y: C().y, z: C().z + 0.5 });
    setTimeout(() => F.readNote("free"), 9500);
  }
  F.onFaint = () => { if (inFw() && A().active) F.resetFight("you fainted"); clearHero(); };

  // ---------- fainting there: a checkpoint to wake at, and a satchel chest holding what you dropped ----------
  F.respawnSpot = () => {
    const s = fw(), sh = s.checkpoint && tpl.meta.shrines.find(q => q.id === s.checkpoint && s.shrines[q.id]);
    if (sh) return { x: sh.x + 2.5, y: sh.y, z: sh.z + 0.5, name: sh.name };
    const a = tpl.meta.arrival; return { x: a.x, y: a.y, z: a.z, name: "the refuge" };
  };
  F.satchel = (items, pos) => {   // returns true if it handled the items
    if (!inFw() || !items.length) return false;
    const w = G.world; let x = Math.floor(pos.x), y = Math.floor(pos.y), z = Math.floor(pos.z);
    while (y < HEIGHT - 3 && (SOLID[w.id(x, y, z)] || w.id(x, y, z) === B.LAVA || w.id(x, y, z) === B.WATER)) y++;
    const chunks = []; for (let i = 0; i < items.length; i += 27) chunks.push(items.slice(i, i + 27));
    chunks.forEach((list, n) => {
      const cx = x + n, key = cx + "," + y + "," + z;
      w.set(cx, y, z, B.CHEST);
      w.containers.set(key, { type: "chest", slots: Array.from({ length: 27 }, (_, i) => list[i] ? { ...list[i] } : null) });
    });
    (fw().satchels = fw().satchels || []).push({ x, y, z });
    UI.toast("Everything you dropped is waiting in a satchel chest where you fainted.", "");
    return true;
  };

  // ---------- atmosphere ----------
  // Returns the sky settings for this frame (main.js applies them)
  F.sky = () => {
    const s = fw(), freed = !!s.banished, pale = region(), st = H().state;
    const danger = st === "warning" ? 1 : st === "hunting" || st === "confrontation" ? 0.8 : st === "stalking" ? 0.35 : 0;
    const effects = G.settings.fwEffects !== false;
    if (warnFx > 0) warnFx = Math.max(0, warnFx - 1 / 60 / 8);
    const mist = freed ? 0 : Math.min(1, (pale ? 0.5 : 0) + (effects ? danger * 0.5 + warnFx * 0.5 : 0));
    return { sky: freed ? 0x8a98a8 : 0x4e555c, daylight: freed ? 0.75 : 0.5, ambient: freed ? 0.16 : 0.13, desat: freed ? 0.2 : 0.62, fogNear: freed ? 0.5 : 0.22 - mist * 0.12, fogFar: freed ? 0.95 : 0.72 - mist * 0.3 };
  };
  let ambT = 4;
  function ambience(dt) {
    const v = vol("fwAmbient"), st = H().state, freed = fw().banished;
    if (v <= 0 || (ambT -= dt) > 0) return;
    ambT = rand(5, 12) * (st === "warning" ? 3 : 1);   // the world goes quiet before a hunt
    if (st === "warning") return;
    const r = Math.random();
    if (r < 0.5) Sound.noise(260, 2.4, 0.09 * v, 0.4, "lowpass");                                   // wind through the trees
    else if (r < 0.75 && !freed) Sound.tone(rand(380, 520), 0.5, "sine", 0.02 * v, -60);            // a far-off bird
    else if (r < 0.9) Sound.noise(900, 0.2, 0.04 * v, 2);                                           // a branch creaks
    else if (freed) Sound.tone(rand(700, 900), 0.25, "triangle", 0.03 * v, 80);                    // birdsong once he's gone
  }

  // ---------- HUD: danger eye, ward ring, candles ----------
  function hud() {
    const el = document.getElementById("fwHud");
    if (!inFw()) { el.hidden = true; return; }
    el.hidden = false;
    const p = G.player, ward = wardAt(p.pos.x, p.pos.z), st = H().state, s = fw();
    const lvl = s.banished || st === "banished" ? "free" : ward ? "safe" : st === "hunting" || st === "confrontation" ? "hunted" : st === "warning" ? "warning" : ["observing", "investigating", "stalking"].includes(st) ? "watched" : "quiet";
    const words = { free: "The Vale is free", safe: "Protected", quiet: "Quiet", watched: "Watched", warning: "Something is coming", hunted: "Hunted!" };
    el.dataset.level = lvl;
    el.querySelector(".fw-eye b").textContent = G.settings.fwWords === false ? "" : words[lvl];
    el.querySelector(".fw-ward").textContent = ward ? `🛡️ Safe inside ${ward.name}${ward.candle ? ` (${Math.ceil(ward.t)} s left)` : ""}` : "";
    const ch = channel ? `Lighting the arena ward… ${Math.round(channel.t / 2 * 100)}%` : A().active ? `Arena wards lit: ${litCount()} of 4` : "";
    el.querySelector(".fw-task").textContent = ch;
  }

  // ---------- the main tick (only while playing in the Forsaken World) ----------
  F.tick = dt => {
    if (!inFw()) { if (hero) clearHero(); hud(); return; }
    tickCandles(dt);
    if (G.mode === "survival") { director(dt); tickStory(dt); }
    else if (G.creative) tickStory(dt);
    tickFight(dt);
    if (hero && hero.glows) { const k = hero.flare > 0 ? 1.8 : 1; for (const g of hero.glows) g.scale.setScalar(0.22 * k); }
    ambience(dt);
    if ((dirT += dt) > 2) { dirT = 0; F.ensureSkull(); }
    hud();
  };
  F.bossInfo = () => (hero && hero.boss && A().active ? { e: hero, label: `Herobrine • ${F.arenaPhase() === 3 ? "SOLID: strike now!" : `can't be hurt yet • arena wards ${litCount()}/4`}`, frac: (hero.hp ?? 120) / 120 } : null);

  // ---------- the journal (J) ----------
  F.objective = () => {
    const s = fw(), n = progress();
    if (s.banished) return "Herobrine is banished. Explore the Vale freely, or call him back at the Pale Altar for a rematch.";
    if (A().active) return "Light all four arena wards around the Pale Altar, guard them, and strike Herobrine while he's solid.";
    if (s.heart === "have") return "Carry the Ward Heart north along the gravel road to the Pale Citadel, and set it in the Pale Altar.";
    if (s.heart === "placed") return "Right-click the Pale Altar to face him again.";
    if (!s.notes.welcome) return "Read the notes in the refuge.";
    if (!s.shrines.hearth) return s.sigils.hearth ? "Set the Hearth Sigil into the Ward Altar in Hollowmere's square." : "Follow the gravel road east to Hollowmere village and find the Hearth Sigil.";
    if (!s.notes.log1 || !s.notes.log2 || !s.notes.log3) return "Read the research logs at the outpost, northeast of the refuge.";
    if (!s.shrines.stone) return s.sigils.stone ? "Set the Stone Sigil into the Ward Altar in the mine's lower chamber." : "Go down into Deepvein Mine (west) and find the Stone Sigil in the lower chamber.";
    if (!s.shrines.root) return s.sigils.root ? "Set the Root Sigil into the Pale Wood Shrine." : "Find the Root Sigil in the grove at the heart of the Pale Wood (northwest).";
    return `Restore the remaining shrines (${n} of 3).`;
  };
  F.journalHTML = () => {
    const s = fw(), m = tpl ? tpl.meta : null;
    if (!m) return `<p class="note" style="color:#444">The journal fills in once you've been to the Forsaken World.</p>`;
    const places = m.landmarks.map(l => `<li class="${s.seen[l.key] ? "ok" : ""}">${s.seen[l.key] ? "✔" : "?"} ${s.seen[l.key] ? l.name : "Not found yet"}</li>`).join("");
    const shrines = m.shrines.map(sh => `<li class="${s.shrines[sh.id] ? "ok" : ""}">${s.shrines[sh.id] ? "✔ " + sh.name + " (awake)" : "○ " + sh.name}</li>`).join("");
    const notes = Object.keys({ ...NOTES, ...LATE_NOTES }).filter(k => s.notes[k]).map(k => `<button class="chip-btn" data-note="${k}">${(NOTES[k] || LATE_NOTES[k]).title}</button>`).join("") || `<span class="note" style="color:#555">No notes yet.</span>`;
    const test = G.creative ? `<div class="fw-test"><b>Creative test controls</b> (only in Creative): <button class="chip-btn" data-fwt="observe">Observe</button><button class="chip-btn" data-fwt="stalk">Stalk</button><button class="chip-btn" data-fwt="hunt">Hunt</button><button class="chip-btn" data-fwt="sigils">Give sigils</button><button class="chip-btn" data-fwt="fight">Start finale</button><button class="chip-btn" data-fwt="light">Light all wards</button></div>` : "";
    return `<div class="fw-journal">
      <div><h4>Now</h4><p class="fw-obj">${F.objective()}</p>
        <h4>Shrines</h4><ul>${shrines}</ul><h4>Places</h4><ul>${places}</ul></div>
      <div><h4>Map</h4><canvas id="fwMap" width="240" height="240"></canvas>
        <h4>Staying safe</h4><p class="note" style="color:#333">Inside a ward's blue ring you're always safe. Walking and crouching are quiet; running, mining, and fighting draw his attention. When the eye turns red, get to a ward. After he appears he pauses, and his eyes flare before he strikes.</p></div>
      <div class="fw-notes"><h4>Notes found</h4>${notes}</div>${test}
      <p class="help">${G.inv.slots.some(q => q && q.id === I.PALE_LANTERN) || G.dim === "forsaken" ? "" : ""}<button class="chip-btn" data-fwt="reset">Start this adventure over…</button> resets only the Forsaken World in this world.</p></div>`;
  };
  F.drawMap = (canvas) => {
    if (!canvas || !tpl) return;
    const x = canvas.getContext("2d"), m = tpl.meta, s = fw(), sc = canvas.width / m.core.size, X = v => (v - m.core.min) * sc;
    x.fillStyle = "#3a4038"; x.fillRect(0, 0, canvas.width, canvas.height);
    x.fillStyle = "#2a2a30"; const r = (m.regions || [])[0]; if (r) x.fillRect(X(r.x0), X(r.z0), (r.x1 - r.x0) * sc, (r.z1 - r.z0) * sc);
    for (const l of m.landmarks) { if (!s.seen[l.key]) continue; x.fillStyle = l.key === "citadel" ? "#1a1a20" : l.key === "refuge" ? "#4a8ac8" : "#c8b890"; x.beginPath(); x.arc(X(l.x), X(l.z), 5, 0, 7); x.fill(); x.fillStyle = "#fff"; x.font = "bold 9px sans-serif"; x.fillText(l.name.replace(/^The /, ""), X(l.x) + 6, X(l.z) + 3); }
    for (const sh of m.shrines) if (s.shrines[sh.id]) { x.strokeStyle = "#8ad8ff"; x.beginPath(); x.arc(X(sh.x), X(sh.z), sh.r * sc, 0, 7); x.stroke(); }
    if (G.dim === "forsaken") { const p = G.player; x.fillStyle = "#ff4040"; x.beginPath(); x.arc(X(p.pos.x), X(p.pos.z), 3.5, 0, 7); x.fill(); }
  };
  F.testControl = k => {
    if (k === "reset") {
      UI.confirm("Start the Forsaken World over?", "This puts the whole Forsaken World in this world back to how it began: its map changes, shrines, notes, and Herobrine's progress. Your inventory and the rest of your world aren't touched. (If you're inside, you'll be sent home first.)", async () => {
        if (G.dim === "forsaken") await F.leave();
        delete G.dimData.forsaken; const keep = { returnTo: null }; G.story.fw = keep; UI.toast("The Forsaken World is fresh again.", "good"); saveNow(false);
      }, "Start over");
      return;
    }
    if (!G.creative || !inFw()) return;
    const p = G.player, h = H(); h.grace = 0; h.cool = 0;
    if (k === "observe") startObserve();
    if (k === "stalk") { h.aw = 50; startStalk(); }
    if (k === "hunt") { h.aw = 80; setState("warning", "test"); }
    if (k === "sigils") for (const it of Object.values(SIGILS)) giveItem(it, 1);
    if (k === "fight") { const c = C(); Object.assign(p.pos, { x: c.x + 0.5, y: c.y, z: c.z - 6 }); fw().heart = "placed"; startFight(false); }
    if (k === "light") for (let i = 0; i < 4; i++) setDevice(i, true);
  };
  return F;
}
