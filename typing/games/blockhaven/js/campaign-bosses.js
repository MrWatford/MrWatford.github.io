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
  leviathan: { sp: "leviathan", name: "the Ocean Leviathan", minion: "tidecrab", deviceText: "Rune Stones", puff: "splash" },
  tempest: { sp: "tempest", name: "the Blight Tempest", minion: "blight", deviceText: "Rune Stones", puff: "pale" },
  skysov: { sp: "skysov", name: "the Sky Sovereign", minion: "skeleton", deviceText: "Rune Stones", puff: "pale" },
  king: { sp: "king", name: "the Forgotten King", minion: "skeleton", deviceText: "Rune Stones", puff: "pale" }
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
      if (A.manual && !(api.canWake && api.canWake(A.id))) continue;   // some bosses only rise when the story says so
      const d = Math.hypot(p.pos.x - A.x, p.pos.z - A.z);
      if (d < A.r - 2 && Math.abs(p.pos.y - A.y) < 5) { wake(A); return; }
    }
  };
  function wake(A) {
    const def = BOSSES[A.id];
    const at = A.id === "skysov" ? { x: A.x, y: A.y + 3, z: A.z } : A.id === "king" ? { x: A.x, y: A.y, z: A.z - A.r + 6 } : A.id === "tempest" ? { x: A.x, y: A.y + 0.3, z: A.z } : A.id === "leviathan" ? { x: A.x + A.pool.r - 3, y: A.pool.y - 0.9, z: A.z } : A.id === "pharaoh" ? { x: A.x, y: A.y, z: A.z - A.r + 4 } : { x: A.x, y: A.y, z: A.z };
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
      leviathan: "The water churns... the Ocean Leviathan rises! It can only be hurt when it surfaces. Stay on the stone ring.",
      tempest: "The courtyard tears loose and spins around the Blightking's crown: the Blight Tempest! Watch the glowing ground, and strike its glowing heart!",
      skysov: "Thunder rolls across Skyreach... the Sky Sovereign descends! Every strike glows on the floor first. Stay inside the wall!",
      king: "The Forgotten King rises from his throne. \"So, little builder. You have brought my Relics home.\" Every attack glows on the floor first!"
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
    if (e.finalForm && !(e.stunT > 0)) { n *= 0.3; if (!e.armorMsgT || G.clock > e.armorMsgT) { e.armorMsgT = G.clock + 5; UI.toast("The Relic light makes him too strong right now. Survive the Void Wave, then strike while he staggers!", ""); } }
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
    if (bf.id === "king") return thinkKing(E, e, d, step, dmgMul);
    if (ph >= 2 && !bf.shieldOnce) {
      bf.shieldOnce = true; e.shieldUp = true;
      UI.toast(`${cap(BOSSES[bf.id].name)} raises a shield! Touch the three Rune Stones around the arena (right-click) to break it.`, "bad");
      if (bf.id === "pharaoh") summon(e, 2, "skeleton");
    }
    if (ph === 3 && !bf.called) { bf.called = true; summon(e, 2, BOSSES[bf.id].minion); UI.toast(bf.id === "titan" ? "The Titan roars in fury and calls the jungle to help!" : bf.id === "tempest" ? "Blight Rattlers climb out of the spinning earth!" : bf.id === "skysov" ? "Storm-touched skeletons climb over the wall!" : "It calls for help!", "bad"); }
    if (bf.id === "leviathan") return thinkLeviathan(E, e, d, ph, step, dmgMul);
    if (bf.id === "tempest") return thinkTempest(E, e, d, ph, step, dmgMul);
    if (bf.id === "skysov") return thinkSkySov(E, e, d, ph, step, dmgMul);
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
    E.chase(e, p.pos);   // (was the player instead of its position, so the boss never walked toward you)
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
  // The Blight Tempest drifts toward you (never leaving its courtyard), winds up with a glow, then strikes the ground
  function thinkTempest(E, e, d, ph, step, dmgMul) {
    const A = bf.A, p = G.player;
    e.vel.x = e.vel.y = e.vel.z = 0; e.goal = null;
    const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1;
    if (!(e.windT > 0) && l > 9) { const v = (ph === 3 ? 1.8 : 1.3) * step; e.pos.x += dx / l * v; e.pos.z += dz / l * v; }
    const ox = e.pos.x - A.x, oz = e.pos.z - A.z, o = Math.hypot(ox, oz), lim = A.r - 11;
    if (o > lim) { e.pos.x = A.x + ox / o * lim; e.pos.z = A.z + oz / o * lim; }
    e.pos.y = A.y + 0.3 + Math.sin(e.age * 1.5) * 0.3;
    e.yaw = Math.atan2(-dx, -dz);
    if (Math.random() < 0.25) puff(e.pos.x + rand(-2, 2), e.pos.y + rand(0, 5), e.pos.z + rand(-2, 2), "pale");
    if (e.windT > 0) {
      e.windT -= step; e.charging = true;
      if (e.windT <= 0) { e.charging = false; tempestAttack(E, e, ph, dmgMul); }
      return;
    }
    e.atkT -= step;
    if (e.atkT <= 0) { e.windT = (reduced() ? 1.3 : 0.9); e.atkT = ph === 3 ? 3 : 4; Sound.mob("roar", d); return; }
    if (d < e.def.reach + 0.6 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "The spinning debris struck you. Don't stand right next to the storm!", e); e.attackCd = 1.8; }
  }
  function tempestAttack(E, e, ph, dmgMul) {
    const A = bf.A, p = G.player, k = (e.next = (e.next || 0) + 1) % 4;
    if (k === 1) {   // chunks of land rain down around you
      for (let j = 0; j < (ph === 3 ? 7 : 5); j++) { const a = Math.random() * Math.PI * 2, r = j ? rand(1.5, 5) : 0; hz(E, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 1.8, j * 0.18, 5, "A chunk of land fell out of the storm. Step out of the glowing circles!"); }
      UI.toast("The storm hurls chunks of land into the sky! Watch the ground!", ""); Sound.noise(300, 0.8, 0.1, 0.5, "lowpass");
    } else if (k === 2) {   // it pulls you in, then slams: run back out
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
      if (E.targetable() && l > 8) E.ctx.push(dx / l * 7, 3, dz / l * 7);
      hz(E, e.pos.x, e.pos.z, 7.5, 0.55, 7, "The storm slammed down. After it pulls you in, run back out!");
      UI.toast("The storm pulls you in! Run back out before it slams down!", "");
    } else if (k === 3) {   // a ring of blight rolls out, with two gaps to stand in
      const dist = Math.max(8, Math.min(A.r - 3, Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z))), gap = Math.atan2(p.pos.z - e.pos.z, p.pos.x - e.pos.x) + rand(0.6, 1.4) * (Math.random() < 0.5 ? 1 : -1);
      const n = Math.max(14, Math.round(dist * 1.6));
      for (let j = 0; j < n; j++) {
        const a = j / n * Math.PI * 2, off = q => Math.abs(Math.atan2(Math.sin(a - q), Math.cos(a - q)));
        if (off(gap) < 0.42 || off(gap + Math.PI) < 0.42) continue;
        hz(E, e.pos.x + Math.cos(a) * dist, e.pos.z + Math.sin(a) * dist, 1.7, 0.1, 5, "The ring of blight caught you. Look for the gaps!");
      }
      e.later.push({ t: (reduced() ? 1.6 : 1.15) + 0.2, fn: () => { const q = Math.hypot(G.player.pos.x - e.pos.x, G.player.pos.z - e.pos.z); if (Math.abs(q - dist) < 1.7 && E.targetable() && Math.random() < 0.5) E.ctx.effect("blight", 4); } });
      UI.toast("A ring of blight spreads out! Stand in one of the gaps!", "");
    } else {   // a stream of debris flies straight at you
      const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1;
      for (let j = 2; j <= 9; j++) hz(E, e.pos.x + dx / l * (2 + j * 2), e.pos.z + dz / l * j * 2, 1.4, j * 0.04, 5, "The stream of debris hit you. Step sideways out of the glowing line!");
      UI.toast("A stream of debris flies at you! Step sideways!", ""); Sound.tone(260, 0.5, "sawtooth", 0.05, -120);
    }
    void dmgMul;
  }
  // the Leviathan circles in its pool (safe from swords), then surfaces beside you: that's when to strike
  function thinkLeviathan(E, e, d, ph, step, dmgMul) {
    const A = bf.A, P = A.pool, p = G.player;
    e.vel.x = e.vel.y = e.vel.z = 0; e.goal = null;
    e.lt -= step; e.atkT -= step;
    if (e.lstate === "circle") {
      bf.ang = (bf.ang || 0) + step * (ph === 3 ? 0.6 : 0.42);
      const r = P.r - 3; e.pos.x = A.x + Math.cos(bf.ang) * r; e.pos.z = A.z + Math.sin(bf.ang) * r; e.pos.y = P.y - 1.4;
      e.yaw = Math.PI - bf.ang; e.submerged = true;   // head points the way it swims (models face (-sin yaw, -cos yaw))
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
        e.pos.x = A.x + Math.cos(a) * r; e.pos.z = A.z + Math.sin(a) * r; e.pos.y = P.y - 0.2; e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z));
        e.lstate = "surface"; e.lt = ph === 3 ? 3.2 : 4.2; e.submerged = false; e.bit = false; e.anchor = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
        for (let j = 0; j < 12; j++) puff(e.pos.x + rand(-2, 2), P.y + 1 + rand(0, 1.5), e.pos.z + rand(-2, 2), "splash");
        Sound.splash(); if (!bf.surfaceMsg) { bf.surfaceMsg = true; UI.toast("It surfaces! Strike it now, before it dives!", "good"); }
      }
      return;
    }
    // surfaced: it holds still (snapping at you once after a warning), then dives
    if (e.anchor) { e.pos.x = e.anchor.x; e.pos.y = e.anchor.y; e.pos.z = e.anchor.z; }
    if (!e.bit && e.lt < (ph === 3 ? 2.2 : 3) && d < 5) { e.bit = true; hz(E, e.pos.x - Math.sin(e.yaw) * 2.5, e.pos.z - Math.cos(e.yaw) * 2.5, 2.5, 0, 6 * dmgMul, "The Leviathan's bite caught you. Step back when it opens its jaws!"); }
    if (e.lt <= 0) { e.lstate = "circle"; e.lt = rand(6, 8) * (ph === 3 ? 0.75 : 1); e.submerged = true; bf.ang = Math.atan2(e.pos.z - A.z, e.pos.x - A.x); Sound.splash(); }
  }

  // ---------- Chapter 8: the Sky Sovereign ----------
  // It glides over its arena (never past the wall), winds up with raised wings, then: lightning, a gust and a line of
  // feathers, a dive (it lands low for a moment: strike it then), or a storm ring with two gaps.
  function thinkSkySov(E, e, d, ph, step, dmgMul) {
    const A = bf.A, p = G.player;
    e.vel.x = e.vel.y = e.vel.z = 0; e.goal = null;
    const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1;
    e.yaw = Math.atan2(-dx, -dz);
    if (e.dive) {   // swooping down to where the glow was
      e.dive.t -= step;
      const tx = e.dive.x - e.pos.x, tz = e.dive.z - e.pos.z, tl = Math.hypot(tx, tz) || 1, v = Math.min(tl, 14 * step);
      e.pos.x += tx / tl * v; e.pos.z += tz / tl * v; e.pos.y += (A.y + 0.2 - e.pos.y) * Math.min(1, step * 6);
      if (e.dive.t <= 0) { e.dive = null; e.low = reduced() ? 3.4 : 2.6; for (let j = 0; j < 10; j++) puff(e.pos.x + rand(-2, 2), A.y + 0.5, e.pos.z + rand(-2, 2), "pale"); if (!bf.lowMsg) { bf.lowMsg = true; UI.toast("It landed! Strike it before it rises!", "good"); } }
      return;
    }
    if (e.low > 0) { e.low -= step; e.pos.y = A.y + 0.2; return; }
    const hoverY = A.y + 2.5 + Math.sin(e.age * 1.3) * 0.4;
    e.pos.y += (hoverY - e.pos.y) * Math.min(1, step * 2);
    if (!(e.windT > 0) && l > 6) { const v = (ph === 3 ? 3 : 2.2) * step; e.pos.x += dx / l * v; e.pos.z += dz / l * v; }
    const ox = e.pos.x - A.x, oz = e.pos.z - A.z, o = Math.hypot(ox, oz), lim = A.r - 3;
    if (o > lim) { e.pos.x = A.x + ox / o * lim; e.pos.z = A.z + oz / o * lim; }
    if (Math.random() < 0.15) puff(e.pos.x + rand(-1.5, 1.5), e.pos.y + rand(1, 4), e.pos.z + rand(-1.5, 1.5), "pale");
    if (e.windT > 0) { e.windT -= step; e.charging = true; if (e.windT <= 0) { e.charging = false; skysovAttack(E, e, ph); } return; }
    e.atkT -= step;
    if (e.atkT <= 0) { e.windT = reduced() ? 1.3 : 0.9; e.atkT = ph === 3 ? 3 : 4.2; Sound.mob("roar", d); return; }
    if (d < e.def.reach + 0.6 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "The Sky Sovereign's gauntlet struck you. Don't stand right under it!", e); e.attackCd = 1.8; }
  }
  function skysovAttack(E, e, ph) {
    const A = bf.A, p = G.player, k = (e.next = (e.next || 0) + 1) % 4;
    if (k === 1) {   // lightning: glowing spots around you, one after another
      for (let j = 0; j < (ph === 3 ? 7 : 5); j++) { const a = Math.random() * Math.PI * 2, r = j ? rand(1.5, 5) : 0; hz(E, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 1.7, j * 0.22, 5, "Lightning struck you. Step out of the glowing circles!"); }
      UI.toast("Storm clouds gather! Lightning is coming down!", ""); Sound.noise(2200, 0.4, 0.1, 0.3, "highpass");
    } else if (k === 2) {   // a gust shoves you back, then a line of feathers flies straight at you
      const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1;
      if (E.targetable()) E.ctx.push(dx / l * 5, 2.5, dz / l * 5);
      e.later.push({ t: 0.5, fn: () => { const ex = G.player.pos.x - e.pos.x, ez = G.player.pos.z - e.pos.z, el = Math.hypot(ex, ez) || 1; for (let j = 1; j <= 9; j++) hz(E, e.pos.x + ex / el * j * 2, e.pos.z + ez / el * j * 2, 1.3, j * 0.03, 5, "Its razor feathers hit you. Step sideways out of the glowing line!", 0); } });
      UI.toast("A gust of wind! Then feathers fly at you: step sideways!", ""); Sound.noise(500, 0.8, 0.12, 0.4, "bandpass");
    } else if (k === 3) {   // a dive onto the glowing spot
      const tx = p.pos.x, tz = p.pos.z;
      hz(E, tx, tz, 3, 0.25, 7, "The Sky Sovereign dove onto you. When a big circle glows under you, run!");
      e.later.push({ t: (reduced() ? 1.6 : 1.15) + 0.1, fn: () => { e.dive = { x: tx, z: tz, t: 0.45 }; } });
      UI.toast("It rises high... and dives! Get out of the big circle!", "");
    } else {   // a storm ring rolls out, with two gaps
      const dist = Math.max(5, Math.min(A.r - 2, Math.hypot(p.pos.x - e.pos.x, p.pos.z - e.pos.z))), gap = Math.atan2(p.pos.z - e.pos.z, p.pos.x - e.pos.x) + rand(0.6, 1.4) * (Math.random() < 0.5 ? 1 : -1);
      const n = Math.max(12, Math.round(dist * 1.6));
      for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2, off = q => Math.abs(Math.atan2(Math.sin(a - q), Math.cos(a - q))); if (off(gap) < 0.45 || off(gap + Math.PI) < 0.45) continue; hz(E, e.pos.x + Math.cos(a) * dist, e.pos.z + Math.sin(a) * dist, 1.6, 0.1, 5, "The storm ring caught you. Look for the gaps!"); }
      UI.toast("A ring of storm wind spreads out! Stand in a gap!", "");
    }
  }

  // ---------- Chapter 8: the Forgotten King (4 phases) ----------
  //   1 The King Wakes: sweeps, a ground slam, crown bolts, a charge.
  //   2 Echoes of the Fallen: his shield rises (light the 3 Rune Stones); he borrows the old bosses' attacks.
  //   3 The Hollow Crown: he steps between the broken pillars, fires void bolts, and the arena's edge crumbles.
  //   4 The Last Stand: he grows, the Relics circle him, and every few seconds a Void Wave fills the court. Only the
  //     golden Relic Light is safe. After each wave he staggers: that is when he can really be hurt.
  const kingPhase = e => (e.hp > e.maxHp * 0.75 ? 1 : e.hp > e.maxHp * 0.5 ? 2 : e.hp > e.maxHp * 0.25 ? 3 : 4);
  function thinkKing(E, e, d, step, dmgMul) {
    const A = bf.A, p = G.player, ph = kingPhase(e);
    if (ph >= 2 && !bf.k2) { bf.k2 = true; e.shieldUp = true; summon(e, 2, "skeleton"); Sound.mob("roar", 0); UI.toast("ECHOES OF THE FALLEN! His shield rises, and he calls on the bosses you defeated. Light the three Rune Stones (right-click) to break it!", "bad"); }
    if (ph >= 3 && !bf.k3) { bf.k3 = true; e.shieldUp = false; summon(e, 2, "skeleton"); Sound.mob("roar", 0); UI.toast("THE HOLLOW CROWN! He steps through the shadows between the pillars. The edge of the court is crumbling: stay near the middle!", "bad"); }
    if (ph >= 4 && !bf.k4) {
      bf.k4 = true; e.shieldUp = false; e.finalForm = true; e.waveT = 3; e.boltT = 5; e.stunT = 0; e.wind = 0; e.dash = 0;
      for (let j = 0; j < 30; j++) puff(e.pos.x + rand(-3, 3), e.pos.y + rand(0, 9), e.pos.z + rand(-3, 3), j % 2 ? "xp" : "pale");
      Sound.mob("roar", 0); Sound.levelUp();
      UI.toast("THE LAST STAND! He grows huge, and your eight Relics circle his crown. When the Void Wave comes, stand in the golden Relic Light. Strike him while he staggers!", "bad");
    }
    if (e.finalForm && (e.grow || 1) < 1.35) e.grow = Math.min(1.35, (e.grow || 1) + step * 0.25);
    if (ph === 4) return kingFinal(E, e, d, step, dmgMul);
    const fast = ph === 3 ? 0.8 : 1;
    if (e.wind > 0) {
      e.wind -= step; e.goal = null; e.charging = true;
      if (Math.random() < 0.5) puff(e.pos.x + rand(-1, 1), e.pos.y + e.def.h * 0.7, e.pos.z + rand(-1, 1), ph === 3 ? "portal" : "pale");
      if (e.wind <= 0) { e.charging = false; kingAttack(E, e, ph); }
      return;
    }
    if (e.dash > 0) { e.dash -= step; E.moveTo(e, e.dashTo, 7, 0.5); if (d < 3.2 && !e.dashHit && E.targetable()) { e.dashHit = true; E.ctx.hurtPlayer(7 * dmgMul, "The King's charge hit you. When he lowers his shoulder, step out of his path!", e); } return; }
    if (ph === 3 && (bf.edgeT = (bf.edgeT ?? 6) - step) <= 0) {   // the crumbling edge
      bf.edgeT = 9;
      const n = 18; for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2; hz(E, A.x + Math.cos(a) * (A.r - 2), A.z + Math.sin(a) * (A.r - 2), 2, 0.2, 5, "The edge of the court crumbled under you. Stay near the middle!"); }
      Sound.noise(180, 1, 0.1, 0.5, "lowpass");
    }
    e.atkT = (e.atkT ?? 3) - step;
    if (e.atkT <= 0 && d < 30) { e.wind = (reduced() ? 1.5 : 1.1); e.atkT = (ph === 1 ? 4 : 3.4) * fast; Sound.mob("roar", d); return; }
    E.chase(e, p.pos);
    if (d < e.def.reach + 0.6 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "The King's fist caught you. Keep your distance!", e); e.attackCd = 1.8; e.swing = 0.4; }
  }
  function kingAttack(E, e, ph) {
    const A = bf.A, p = G.player, pick = (e.next = (e.next || 0) + 1);
    const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
    const bolts = (n, dmg) => { for (let j = 0; j < n; j++) { const a = Math.random() * Math.PI * 2, r = j ? rand(1.5, 4.5) : 0; hz(E, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 1.8, j * 0.2, dmg, "A bolt from the King's crown hit you. Step out of the glowing circles!"); } };
    if (ph === 1) {
      const k = pick % 4;
      if (k === 1) { for (const t of [-0.7, 0, 0.7]) { const c = Math.cos(t), s = Math.sin(t), vx = ux * c - uz * s, vz = ux * s + uz * c; hz(E, e.pos.x + vx * 4, e.pos.z + vz * 4, 2.4, 0.15, 6, "The King's sweep caught you. When he raises his arm, back away or step around him!"); } UI.toast("He sweeps his great fist in front of him! Back away!", ""); }
      else if (k === 2) { hz(E, e.pos.x, e.pos.z, 6, 0.4, 7, "The King's slam shook the ground. When both his fists rise, run!"); Sound.noise(160, 0.9, 0.12, 0.5, "lowpass"); UI.toast("Both fists rise... GROUND SLAM! Run!", ""); }
      else if (k === 3) { bolts(4, 5); UI.toast("His crown flashes! Bolts are falling!", ""); }
      else { e.dash = 1.2; e.dashHit = false; e.dashTo = { x: p.pos.x, y: A.y, z: p.pos.z }; for (let j = 1; j <= 6; j++) hz(E, e.pos.x + ux * j * 2, e.pos.z + uz * j * 2, 1.6, j * 0.04, 0, "", 0); UI.toast("He lowers his shoulder and charges! Step aside!", ""); }
    } else if (ph === 2) {   // the echoes of the bosses you beat
      const k = pick % 4;
      if (k === 1) { for (let j = 1; j <= 9; j++) hz(E, e.pos.x + ux * j * 2.2, e.pos.z + uz * j * 2.2, 1.3, 0.2 + j * 0.03, 5, "An echo of the Pharaoh's sand bolt hit you. Step sideways!", 1); UI.toast("The Pharaoh's sand bolt, in his hand! Step sideways!", ""); }
      else if (k === 2) { const gap = Math.random() * Math.PI * 2, dist = Math.max(6, Math.min(A.r - 2, l)); for (let j = 0; j < 24; j++) { const a = j / 24 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.45 || Math.abs(Math.atan2(Math.sin(a - gap - Math.PI), Math.cos(a - gap - Math.PI))) < 0.45) continue; hz(E, e.pos.x + Math.cos(a) * dist, e.pos.z + Math.sin(a) * dist, 1.7, 0.1, 5, "An echo of the Leviathan's tidal wave knocked you down. Find a gap!"); } UI.toast("The Leviathan's tidal ring rolls out! Find a gap!", ""); Sound.splash(); }
      else if (k === 3) { for (let j = 0; j < 6; j++) { const a = Math.random() * Math.PI * 2, r = j ? rand(1.5, 5) : 0; hz(E, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 1.8, j * 0.18, 5, "An echo of the Blight Tempest's falling earth hit you. Watch the circles!"); } UI.toast("The Tempest's falling earth! Watch the ground!", ""); }
      else { hz(E, e.pos.x, e.pos.z, 6, 0.4, 7, "The King's slam shook the ground. When both his fists rise, run!"); UI.toast("GROUND SLAM! Run!", ""); }
    } else {   // phase 3: step to another pillar, then void bolts
      const spots = (A.tele || []).filter(t => Math.hypot(t.x - e.pos.x, t.z - e.pos.z) > 5);
      if (spots.length && pick % 2) {
        const t = spots[Math.floor(Math.random() * spots.length)];
        for (let j = 0; j < 10; j++) puff(e.pos.x + rand(-1.5, 1.5), e.pos.y + rand(0, 6), e.pos.z + rand(-1.5, 1.5), "portal");
        e.pos.x = t.x + 0.5; e.pos.z = t.z + 0.5; e.pos.y = t.y; e.vel.x = e.vel.z = 0;
        for (let j = 0; j < 10; j++) puff(e.pos.x + rand(-1.5, 1.5), e.pos.y + rand(0, 6), e.pos.z + rand(-1.5, 1.5), "portal");
        UI.toast("He melts into shadow... and steps out by a pillar!", "");
      }
      const ex = p.pos.x - e.pos.x, ez = p.pos.z - e.pos.z, el = Math.hypot(ex, ez) || 1;
      for (const t of [-0.35, 0, 0.35]) { const c = Math.cos(t), s = Math.sin(t), vx = (ex * c - ez * s) / el, vz = (ex * s + ez * c) / el; for (let j = 1; j <= 8; j++) hz(E, e.pos.x + vx * j * 2.3, e.pos.z + vz * j * 2.3, 1.2, 0.35 + j * 0.04, 5, "A void bolt hit you. Step between the glowing lines!"); }
      bolts(2, 4);
      UI.toast("Three void bolts! Stand between the lines!", ""); Sound.tone(180, 0.7, "sawtooth", 0.05, -60);
    }
  }
  function kingFinal(E, e, d, step, dmgMul) {
    const A = bf.A, p = G.player;
    e.dash = 0;
    e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z));
    if (e.stunT > 0) {   // staggered: he kneels for a moment
      e.stunT -= step; e.goal = null; e.vel.x = e.vel.z = 0; e.charging = false;
      if (Math.random() < 0.3) puff(e.pos.x + rand(-2, 2), e.pos.y + rand(2, 8), e.pos.z + rand(-2, 2), "xp");
      return;
    }
    if (Math.hypot(e.pos.x - A.x, e.pos.z - A.z) > 2.5) E.moveTo(e, { x: A.x, y: A.y, z: A.z }, 1.2, 2);   // he holds the middle of the court
    else { e.goal = null; e.vel.x = e.vel.z = 0; }
    e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z));   // and always faces you
    const sx = (bf.safe || {}).x, sz = (bf.safe || {}).z;
    if (bf.safe) {   // the warning: the Relic Light shines; everything else is about to fill with the Void
      bf.safe.t -= step; e.charging = true;
      for (let j = 0; j < 3; j++) { const a = Math.random() * Math.PI * 2; puff(sx + Math.cos(a) * 2.6, A.y + 0.3 + Math.random() * 3, sz + Math.sin(a) * 2.6, "xp"); }
      if (Math.random() < 0.5) { const a = Math.random() * Math.PI * 2, r = rand(4, A.r - 1); puff(A.x + Math.cos(a) * r, A.y + 0.4, A.z + Math.sin(a) * r, "portal"); }
      if (bf.safe.t <= 0) {
        if (Math.hypot(p.pos.x - sx, p.pos.z - sz) > 3.2 && E.targetable()) E.ctx.hurtPlayer(14 * dmgMul, "The Void Wave hit you. When the golden Relic Light appears, run into it!", e);
        for (let j = 0; j < 40; j++) { const a = Math.random() * Math.PI * 2, r = rand(0, A.r); puff(A.x + Math.cos(a) * r, A.y + 0.6 + Math.random(), A.z + Math.sin(a) * r, "portal"); }
        Sound.noise(120, 1.2, 0.14, 0.6, "lowpass");
        bf.safe = null; e.charging = false; e.stunT = reduced() ? 5.5 : 4.5; e.waveT = reduced() ? 9 : 7.5; bf.waves = (bf.waves || 0) + 1;
        UI.toast(bf.waves === 1 ? "The Relics' light held back the Void! He staggers: STRIKE NOW!" : "He staggers! Strike now!", "good");
      }
      return;
    }
    e.waveT -= step;
    if (e.waveT <= 0) {   // a new Void Wave: the Relic Light appears somewhere on the floor, away from where you stand
      let a = Math.random() * Math.PI * 2, r = rand(5, A.r - 5), x = A.x + Math.cos(a) * r, z = A.z + Math.sin(a) * r;
      for (let k = 0; k < 6 && Math.hypot(x - p.pos.x, z - p.pos.z) < 5; k++) { a += 1.1; x = A.x + Math.cos(a) * r; z = A.z + Math.sin(a) * r; }
      bf.safe = { x, z, t: reduced() ? 4.2 : 3.4 };
      const n = 9; for (let j = 0; j < n; j++) { const q = j / n * Math.PI * 2; for (const rr of [7, 14]) { const hx = A.x + Math.cos(q) * rr, hz2 = A.z + Math.sin(q) * rr; if (Math.hypot(hx - x, hz2 - z) > 4) E.addHazard(hx, A.y, hz2, 1.8, bf.safe.t, 0, "", 0); } }
      Sound.mob("roar", 0); Sound.tone(110, 2, "sine", 0.1, -30);
      UI.toast("THE VOID WAVE IS COMING! Run into the golden Relic Light!", "bad");
      return;
    }
    e.boltT -= step;
    if (e.boltT <= 0 && e.waveT > 2) { e.boltT = 3.2; for (let j = 0; j < 3; j++) { const a = Math.random() * Math.PI * 2, r = j ? rand(1.5, 4) : 0; hz(E, p.pos.x + Math.cos(a) * r, p.pos.z + Math.sin(a) * r, 1.8, j * 0.2, 4, "A bolt from the King's crown hit you. Watch the circles!"); } }
    if (d < e.def.reach * 1.35 + 0.6 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "The giant King's fist caught you. Don't stand right next to him!", e); e.attackCd = 2; e.swing = 0.4; }
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
    const e = bf.e, ph = bf.id === "king" ? kingPhase(e) : phase(e);
    return { e, label: `${e.def.name} • Phase ${ph}${bf.id === "king" ? " of 4" : ""}${e.stunT > 0 ? " • Staggered: strike now!" : ""}${e.shieldUp ? ` • Shielded: touch the Rune Stones (${bf.dev.filter(Boolean).length}/3)` : e.submerged ? " • Underwater" : ""}`, frac: e.hp / e.maxHp };
  };
  BS._fight = () => (bf ? { id: bf.id, hp: bf.e.hp, max: bf.e.maxHp, shield: !!bf.e.shieldUp, sub: !!bf.e.submerged, safe: bf.safe ? { ...bf.safe } : null, stun: bf.e.stunT || 0 } : null);   // (for tests)
  return BS;
}
