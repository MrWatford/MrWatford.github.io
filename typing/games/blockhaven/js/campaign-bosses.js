// The Legacy Campaign's chapter bosses: the Ancient Stone Guardian, the Desert Pharaoh, the Jungle Titan, and the
// Ocean Leviathan. Every fight follows the same fair rules as the temple guardians:
//   Phase 1: learn its attacks (every attack glows on the floor before it lands).
//   Phase 2: it raises a shield; touch the arena's three Rune Stones to break it.
//   Phase 3: it fights faster and calls for help once.
// Leaving the arena or fainting resets the fight. Arenas come from js/campaign.js (world coordinates).
const rand = (a, b) => a + Math.random() * (b - a);

export const BOSSES = {
  stoneguard: { sp: "stoneguard", name: "the Ancient Stone Guardian", minion: "cave_spider", deviceText: "Rune Stones", puff: "pale" },
  pharaoh: { sp: "pharaoh", name: "the Desert Pharaoh", minion: "skeleton", deviceText: "Rune Stones", puff: "ember" },
  titan: { sp: "titan", name: "the Jungle Titan", minion: "vinewalker", deviceText: "Rune Stones", puff: "xp" },
  leviathan: { sp: "leviathan", name: "the Ocean Leviathan", minion: "tidecrab", deviceText: "Rune Stones", puff: "splash" }
};
const cap = s => s[0].toUpperCase() + s.slice(1);

export function initBosses(api) {
  const { G, UI, Sound, ents, puff, onDefeat, isDefeated } = api;
  const BS = {};
  let bf = null;   // the fight in progress: { id, e, A, dev: [bool × 3], ... }
  const reduced = () => !!(G.settings && G.settings.reducedMotion);
  const phase = e => (e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3);

  // ---------- waking and resetting ----------
  BS.tick = (dt, arenas) => {
    const p = G.player; if (!p) return;
    if (bf && (bf.e.gone || (bf.e.dead && !bf.e.def.cpBoss))) reset("");   // it vanished (it should never happen, but don't get stuck)
    if (bf) {
      const A = bf.A, d = Math.hypot(p.pos.x - A.x, p.pos.z - A.z);
      if (G.dim !== A.dim || d > A.r + 10 || Math.abs(p.pos.y - A.y) > 14) reset(`You left the arena. ${cap(BOSSES[bf.id].name)} waits for your return.`);
      return;
    }
    if (G.spectator) return;
    for (const A of arenas) {
      if (A.dim !== G.dim || isDefeated(A.id)) continue;
      const d = Math.hypot(p.pos.x - A.x, p.pos.z - A.z);
      if (d < A.r - 2 && Math.abs(p.pos.y - A.y) < 5) { wake(A); return; }
    }
  };
  function wake(A) {
    const def = BOSSES[A.id];
    const at = A.id === "leviathan" ? { x: A.x + A.pool.r - 3, y: A.pool.y - 0.9, z: A.z } : A.id === "pharaoh" ? { x: A.x, y: A.y, z: A.z - A.r + 4 } : { x: A.x, y: A.y, z: A.z };
    const e = ents.add(def.sp, at.x, at.y, at.z); if (!e) return;
    bf = { id: A.id, e, A, dev: [false, false, false] };
    e.atkT = 3; e.next = 0; e.later = []; e.lstate = "circle"; e.lt = 5; e.submerged = A.id === "leviathan";
    setDevices(false);
    for (let k = 0; k < 10; k++) puff(at.x + rand(-2, 2), at.y + rand(0, 4), at.z + rand(-2, 2), def.puff);
    Sound.mob("roar", 0);
    const intro = {
      stoneguard: "The Ancient Stone Guardian rises from the floor! Watch the glowing ground: every attack warns you first.",
      pharaoh: "The Desert Pharaoh wakes from his long sleep! \"Who dares enter my tomb?\" Watch for glowing sand!",
      titan: "The Jungle Titan tears free of the roots! Stay out of the glowing rings.",
      leviathan: "The water churns... the Ocean Leviathan rises! It can only be hurt when it surfaces. Stay on the stone ring."
    }[A.id];
    UI.toast(intro, "bad");
    if (api.bossIntro) api.bossIntro(A.id);
  }
  function reset(why) {
    if (!bf) return;
    if (!bf.e.gone) bf.e.gone = true;
    for (const e of ents.list) if (e.cpCall) e.gone = true;
    setDevices(false); bf = null;
    if (why) UI.toast(why, "");
  }
  BS.onFaint = () => reset("");
  BS.active = () => !!bf;
  function setDevices(on) {
    if (!bf) return;
    for (const dv of bf.A.devices) if (G.world.isLoaded(dv.x, dv.z)) G.world.set(dv.x, dv.y, dv.z, api.runeBlock(on));
  }

  // ---------- the three Rune Stones (phase 2 shield) ----------
  BS.useRune = hit => {
    if (!bf) return false;
    const i = bf.A.devices.findIndex(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (i < 0) return false;
    if (!bf.e.shieldUp) { UI.toast("The Rune Stone hums quietly. It only matters once the boss raises its shield."); return true; }
    if (bf.dev[i]) { UI.toast("This Rune Stone is already glowing."); return true; }
    bf.dev[i] = true; G.world.set(hit.x, hit.y, hit.z, api.runeBlock(true)); Sound.tone(600 + i * 150, 0.6, "triangle", 0.1, 0);
    for (let k = 0; k < 5; k++) puff(hit.x + 0.5, hit.y + 1 + k * 0.3, hit.z + 0.5, "pale");
    const left = bf.dev.filter(v => !v).length;
    if (!left) { bf.e.shieldUp = false; UI.toast("All three Rune Stones glow! The shield shatters. Strike now!", "good"); }
    else UI.toast(`Rune Stone lit! ${left} left.`, "");
    return true;
  };
  BS.idleRune = hit => { if (!bf) { UI.toast("A Rune Stone, carved by the First Builders. It seems connected to whatever sleeps here."); return true; } return BS.useRune(hit) || false; };

  // ---------- damage rules ----------
  BS.hit = (E, e, n, attacker) => {
    if (e.shieldUp) { puff(e.pos.x, e.pos.y + e.def.h * 0.6, e.pos.z, "pale"); if (!e.shieldMsgT || G.clock > e.shieldMsgT) { e.shieldMsgT = G.clock + 4; UI.toast("Its shield holds! Touch the three Rune Stones around the arena (right-click).", ""); } return 0; }
    if (e.submerged) { if (!e.subMsgT || G.clock > e.subMsgT) { e.subMsgT = G.clock + 4; UI.toast("It's deep underwater! Wait for it to surface.", ""); } return 0; }
    if (attacker === "explosion") n *= 0.3;
    return n;
  };

  // ---------- the fight ----------
  const hz = (E, x, z, r, delay, dmg, why, burn) => E.addHazard(x, bf.A.y, z, r, (reduced() ? 1.6 : 1.15) + delay, dmg, why, burn ? 1 : 0);
  BS.think = (E, e, d, dmgMul) => {
    if (!bf || bf.e !== e) { e.gone = true; return; }
    const p = G.player, ph = phase(e), A = bf.A, step = Math.min(0.6, e.age - (e.lastT ?? e.age)); e.lastT = e.age;
    for (const l of e.later) l.t -= step;
    for (const l of e.later.filter(l => l.t <= 0)) l.fn();
    e.later = e.later.filter(l => l.t > 0);
    if (ph >= 2 && !bf.shieldOnce) {
      bf.shieldOnce = true; e.shieldUp = true;
      UI.toast(`${cap(BOSSES[bf.id].name)} raises a shield! Touch the three Rune Stones around the arena (right-click) to break it.`, "bad");
      if (bf.id === "pharaoh") summon(e, 2, "skeleton");
    }
    if (ph === 3 && !bf.called) { bf.called = true; summon(e, 2, BOSSES[bf.id].minion); UI.toast(bf.id === "titan" ? "The Titan roars in fury and calls the jungle to help!" : "It calls for help!", "bad"); }
    if (bf.id === "leviathan") return thinkLeviathan(E, e, d, ph, step, dmgMul);
    const fast = ph === 3 ? 0.72 : 1;
    if (e.wind > 0) {
      e.wind -= step; e.goal = null; e.raise = 1; e.charging = true;
      if (Math.random() < 0.6) puff(e.pos.x + rand(-1, 1), e.pos.y + e.def.h * 0.7, e.pos.z + rand(-1, 1), "pale");
      if (e.wind <= 0) { e.raise = 0; e.charging = false; attack(E, e, ph); }
      return;
    }
    if (e.dash > 0) { e.dash -= step; E.moveTo(e, e.dashTo, 7, 0.5); if (d < 2.6 && !e.dashHit && E.targetable()) { e.dashHit = true; E.ctx.hurtPlayer(6 * dmgMul, "The charge hit you. When it crouches low, step out of its path!", e); } return; }
    e.atkT -= step;
    if (e.atkT <= 0 && d < 26) { e.wind = (bf.id === "titan" ? 1.3 : 1.1) * (reduced() ? 1.4 : 1); e.atkT = (ph === 3 ? 3 : 4.2) * fast; Sound.mob("roar", d); return; }
    E.chase(e, p);
    if (d < e.def.reach + 0.6 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "Its fist caught you. Keep your distance when it's close!", e); e.attackCd = 1.8; e.swing = 0.4; }
    void A;
  };
  function summon(e, n, sp) {
    for (let k = 0; k < n; k++) { const m = ents.add(sp, e.pos.x + rand(-4, 4), bf.A.y + 0.5, e.pos.z + rand(-4, 4)); if (m) { m.cpCall = true; m.angry = 60; } }
  }
  function attack(E, e, ph) {
    const p = G.player, A = bf.A, pick = (e.next = (e.next || 0) + 1);
    const line = (n, gap, r, delay, dmg, why) => { const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1; for (let k = 1; k <= n; k++) hz(E, e.pos.x + dx / l * k * gap, e.pos.z + dz / l * k * gap, r, delay + k * 0.03, dmg, why, 1); };
    if (bf.id === "stoneguard") {
      if (pick % 2) { hz(E, e.pos.x, e.pos.z, 4.5, 0.3, 6, "The Guardian's slam shook the ground. When it raises its arms, run!"); Sound.noise(200, 0.7, 0.1, 0.5, "lowpass"); }
      else { for (let k = 0; k < (ph === 3 ? 4 : 3); k++) { const a = Math.random() * Math.PI * 2, r = k ? rand(2, 4.5) : 0; hz(E, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 1.8, k * 0.2, 5, "A falling boulder hit you. Step out of the glowing circle!"); } UI.toast("It hurls boulders into the air!", ""); }
    } else if (bf.id === "pharaoh") {
      const k = pick % 3;
      if (k === 1) { line(9, 2.2, 1.3, 0.2, 5, "The Pharaoh's sand bolt hit you. Step sideways out of the glowing line!"); Sound.tone(900, 0.5, "sawtooth", 0.05, -300); }
      else if (k === 2) { for (let j = 0; j < (ph === 3 ? 8 : 6); j++) { const a = Math.random() * Math.PI * 2, r = rand(1, 6); hz(E, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 1.6, j * 0.15, 4, "Falling sand buried you for a moment. Watch the glowing spots!"); } UI.toast("A sandstorm swirls through the tomb! Sand is falling!", ""); Sound.noise(1200, 1.2, 0.08, 0.4, "highpass"); }
      else {   // vanishes and reappears beside another sarcophagus, then fires right away
        const spots = A.tele.filter(t => Math.hypot(t.x - e.pos.x, t.z - e.pos.z) > 4), t = spots[Math.floor(Math.random() * spots.length)] || A.tele[0];
        for (let j = 0; j < 8; j++) puff(e.pos.x + rand(-1, 1), e.pos.y + rand(0, 3), e.pos.z + rand(-1, 1), "ember");
        e.pos.x = t.x + 0.5; e.pos.z = t.z + 0.5; e.pos.y = t.y; e.vel.x = e.vel.z = 0;
        for (let j = 0; j < 8; j++) puff(e.pos.x + rand(-1, 1), e.pos.y + rand(0, 3), e.pos.z + rand(-1, 1), "ember");
        UI.toast("The Pharaoh vanishes in a swirl of sand... and reappears by a sarcophagus!", "");
        e.later.push({ t: 0.6, fn: () => line(9, 2.2, 1.3, 0.1, 5, "The Pharaoh's sand bolt hit you. Step sideways out of the glowing line!") });
      }
    } else if (bf.id === "titan") {
      const k = pick % 4;
      if (k === 1) { hz(E, e.pos.x, e.pos.z, 5.5, 0.4, 7, "The Titan's ground slam caught you. When it raises both arms, get far away!"); Sound.noise(150, 0.9, 0.12, 0.5, "lowpass"); }
      else if (k === 2) { for (let j = 0; j < (ph === 3 ? 7 : 5); j++) { const a = Math.random() * Math.PI * 2, r = rand(2, A.r - 2); hz(E, A.x + Math.cos(a) * r, A.z + Math.sin(a) * r, 2, j * 0.12, 5, "Falling stone hit you. Watch the ceiling's shadows on the floor!"); } UI.toast("Stones crash down from the ceiling!", ""); }
      else if (k === 3) {   // poison spores: clouds that sting and make you sick if you stay
        for (let j = 0; j < 3; j++) {
          const a = Math.random() * Math.PI * 2, r = j ? rand(2, 4) : 0, x = p.pos.x + Math.cos(a) * r, z = p.pos.z + Math.sin(a) * r;
          hz(E, x, z, 2.2, j * 0.2, 2, "Poison spores! Get out of the green cloud.");
          e.later.push({ t: (reduced() ? 1.6 : 1.15) + j * 0.2 + 0.1, fn: () => { if (Math.hypot(G.player.pos.x - x, G.player.pos.z - z) < 2.2 && E.targetable()) { E.ctx.effect("poison", 4); } for (let q = 0; q < 6; q++) puff(x + rand(-1.5, 1.5), A.y + 0.5 + rand(0, 1), z + rand(-1.5, 1.5), "xp"); } });
        }
        UI.toast("The Titan shakes loose a cloud of spores!", "");
      } else {   // vines pull you in, then a slam: run back out
        const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
        if (E.targetable() && l > 4) E.ctx.push(dx / l * 8, 4, dz / l * 8);
        hz(E, e.pos.x, e.pos.z, 4.5, 0.4, 6, "The Titan slammed the ground. After the vines pull you in, run back out!");
        UI.toast("Vines pull you in! Get away before the slam.", "");
      }
    }
  }
  // the Leviathan circles in its pool (safe from swords), then surfaces beside you: that's when to strike
  function thinkLeviathan(E, e, d, ph, step, dmgMul) {
    const A = bf.A, P = A.pool, p = G.player;
    e.vel.x = e.vel.y = e.vel.z = 0; e.goal = null;
    e.lt -= step; e.atkT -= step;
    if (e.lstate === "circle") {
      bf.ang = (bf.ang || 0) + step * (ph === 3 ? 0.6 : 0.42);
      const r = P.r - 3; e.pos.x = A.x + Math.cos(bf.ang) * r; e.pos.z = A.z + Math.sin(bf.ang) * r; e.pos.y = P.y - 1.4;
      e.yaw = -bf.ang; e.submerged = true;
      if (Math.random() < 0.3) puff(e.pos.x, P.y + 1, e.pos.z, "splash");
      if (e.atkT <= 0) {
        e.atkT = ph === 3 ? 3.2 : 4.4;
        const k = (e.next = (e.next || 0) + 1) % 3;
        if (k === 1) {   // a tidal wave across the stone ring, with two gaps to stand in
          const gap = Math.random() * Math.PI * 2;
          for (let j = 0; j < 16; j++) { const a = j / 16 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.45 || Math.abs(Math.atan2(Math.sin(a - gap - Math.PI), Math.cos(a - gap - Math.PI))) < 0.45) continue; hz(E, A.x + Math.cos(a) * 12.5, A.z + Math.sin(a) * 12.5, 1.9, 0, 5, "The tidal wave knocked you down. Look for the gaps in the ring!"); }
          UI.toast("A tidal wave rolls across the stone ring! Find a gap!", ""); Sound.splash();
        } else if (k === 2) {   // a whirlpool tugs you toward the water, and the pool's edge churns
          if (E.targetable()) { const dx = A.x - p.pos.x, dz = A.z - p.pos.z, l = Math.hypot(dx, dz) || 1; E.ctx.push(dx / l * 4, 2, dz / l * 4); }
          for (let j = 0; j < 10; j++) { const a = j / 10 * Math.PI * 2 + bf.ang; hz(E, A.x + Math.cos(a) * (P.r + 1.5), A.z + Math.sin(a) * (P.r + 1.5), 1.5, 0.2, 4, "The whirlpool's edge churned around you. Step back from the water!"); }
          UI.toast("A whirlpool pulls toward the pool! Step back from the edge!", "");
        } else { for (let j = 0; j < 2; j++) hz(E, p.pos.x + rand(-1.5, 1.5), p.pos.z + rand(-1.5, 1.5), 2.5, j * 0.4, 5, "A shockwave burst up from below. Keep moving!"); Sound.tone(220, 0.6, "sine", 0.1, -80); }
      }
      if (e.lt <= 0) {   // surface beside the player
        const a = Math.atan2(p.pos.z - A.z, p.pos.x - A.x), r = P.r - 2.4;   // (its body must stay clear of the stone rim)
        e.pos.x = A.x + Math.cos(a) * r; e.pos.z = A.z + Math.sin(a) * r; e.pos.y = P.y - 0.2; e.yaw = Math.atan2(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
        e.lstate = "surface"; e.lt = ph === 3 ? 3.2 : 4.2; e.submerged = false; e.bit = false; e.anchor = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
        for (let j = 0; j < 12; j++) puff(e.pos.x + rand(-2, 2), P.y + 1 + rand(0, 1.5), e.pos.z + rand(-2, 2), "splash");
        Sound.splash(); if (!bf.surfaceMsg) { bf.surfaceMsg = true; UI.toast("It surfaces! Strike it now, before it dives!", "good"); }
      }
      return;
    }
    // surfaced: it holds still (snapping at you once after a warning), then dives
    if (e.anchor) { e.pos.x = e.anchor.x; e.pos.y = e.anchor.y; e.pos.z = e.anchor.z; }
    if (!e.bit && e.lt < (ph === 3 ? 2.2 : 3) && d < 5) { e.bit = true; hz(E, e.pos.x + Math.sin(e.yaw) * 2.5, e.pos.z + Math.cos(e.yaw) * 2.5, 2.5, 0, 6 * dmgMul, "The Leviathan's bite caught you. Step back when it opens its jaws!"); }
    if (e.lt <= 0) { e.lstate = "circle"; e.lt = rand(6, 8) * (ph === 3 ? 0.75 : 1); e.submerged = true; bf.ang = Math.atan2(e.pos.z - A.z, e.pos.x - A.x); Sound.splash(); }
  }

  // ---------- victory ----------
  BS.defeated = e => {
    if (!e.def.cpBoss) { if (e.cpCall) return true; return false; }
    const id = bf && bf.e === e ? bf.id : Object.keys(BOSSES).find(k => BOSSES[k].sp === e.sp);
    for (const m of ents.list) if (m.cpCall) m.gone = true;
    setDevices(true); bf = null;
    onDefeat(id, e);
    return true;
  };
  BS.info = () => {
    if (!bf || !bf.e || bf.e.gone) return null;
    const e = bf.e, ph = phase(e);
    return { e, label: `${e.def.name} • Phase ${ph}${e.shieldUp ? ` • Shielded: touch the Rune Stones (${bf.dev.filter(Boolean).length}/3)` : e.submerged ? " • Underwater" : ""}`, frac: e.hp / e.maxHp };
  };
  BS._fight = () => (bf ? { id: bf.id, hp: bf.e.hp, max: bf.e.maxHp, shield: !!bf.e.shieldUp, sub: !!bf.e.submerged } : null);
  return BS;
}
