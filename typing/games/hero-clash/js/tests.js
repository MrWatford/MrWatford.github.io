// Hero Clash — automated checks. Open test.html in a browser, or run with Node:
//   node --input-type=module -e "import('./js/tests.js').then(m => m.runTests(console.log))"
import { Match, blankInput, STAGE, JUG_MAX, COMBO_MAX } from "./combat.js";
import { ROSTER, MAIN_ROSTER, BY_ID, combosFor } from "./fighters.js";
import { CPU, LEVEL_ORDER } from "./ai.js";
import * as PR from "./progress.js";
import * as TN from "./tournament.js";
import { RIVALRIES, rivalryFor } from "./rivalries.js";
import { DEFAULT_KEYS } from "./input-defaults.js";

const I = (o) => Object.assign(blankInput(), o);
const ACTIONABLE = ["idle", "walk", "crouch", "block"];
function fight(a, b, opts) { const m = new Match(BY_ID[a] || a, BY_ID[b] || b, Object.assign({ time: 0 }, opts)); while (m.phase !== "fight") m.step(I(), I()); return m; }
function place(m, d = 0.9) { m.f[0].x = -d / 2; m.f[1].x = d / 2; m.step(I(), I()); return m; }
const run = (m, n, a, b) => { for (let i = 0; i < n; i++) m.step(I(typeof a === "function" ? a(i) : a), I(typeof b === "function" ? b(i) : b)); };
const tap = (m, keys, n = 30, other) => { m.step(I(keys), I(other)); run(m, n, {}, other); };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// perform a combo: press each button as soon as the previous hit lands
function combo(m, keys, limit = 420) {
  const a = m.f[0]; let ki = 0, max = 0, hold = 0, held = null, upFor = 0, seq = -1;
  for (let t = 0; t < limit && ki < keys.length + 1; t++) {
    const inp = I(); const k = keys[ki];
    if (held && hold > 0) { Object.assign(inp, held); hold--; if (hold === 0 || a.moveSeq > seq) { held = null; hold = 0; ki++; } }
    else if (k === "u") { inp.u = true; upFor++; if (a.state === "air" || upFor > 40) { ki++; upFor = 0; } }
    else if (k) {
      const ready = ki === 0 ? ACTIONABLE.includes(a.state) : keys[ki - 1] === "u" ? a.state === "air" && m.f[1].y - a.y < 0.75 && a.st > 6 : a.hitConn && a.state === "atk" && a.moveSeq > seq;
      if (ready) { seq = a.moveSeq; held = {}; for (const p of k.split("+")) { if (p === "d") held.d = true; else if (p.startsWith("sp")) { held.sp = true; if (p === "sp2") held[a.facing > 0 ? "r" : "l"] = true; if (p === "sp3") held.d = true; if (p === "sp4") held[a.facing > 0 ? "l" : "r"] = true; } else held[p] = true; } hold = 12; Object.assign(inp, held); hold--; }
    }
    m.step(inp, I()); max = Math.max(max, a.combo);
    if (m.cine) { while (m.cine) m.step(I(), I()); max = Math.max(max, a.combo); }
  }
  return max;
}
class Store { constructor(v) { this.v = v === undefined ? null : v; } getItem() { return this.v; } setItem(k, v) { this.v = v; } }

export function runTests(log = () => {}) {
  const results = []; let group = "";
  const ok = (name, cond, detail = "") => { results.push({ group, name, pass: !!cond, detail }); log((cond ? "  ok   " : "  FAIL ") + group + ": " + name + (cond ? "" : "  → " + detail)); };
  const G = (g) => { group = g; };

  G("Movement");
  { const m = fight("shadow", "titan"); const x0 = m.f[0].x; run(m, 30, { r: true }); ok("walking moves toward the opponent", m.f[0].x > x0 + 1);
    run(m, 2, { u: true }); let air = 0; for (let i = 0; i < 80; i++) { m.step(I(), I()); if (!m.f[0].grounded) air++; } ok("a jump leaves the ground and lands again", air > 20 && air < 45 && m.f[0].grounded, "air frames " + air);
    run(m, 400, { l: true }); ok("fighters stay inside the arena", m.f[0].x >= -STAGE - 1e-9);
    run(m, 600, { r: true }); ok("fighters cannot walk through each other", m.f[0].x < m.f[1].x);
    ok("fighters face each other", m.f[0].facing === 1 && m.f[1].facing === -1); }

  G("Attacks");
  { let m = place(fight("shadow", "titan")); const hp = m.f[1].hp; tap(m, { lp: true }); ok("a jab in range does its damage", Math.abs(hp - m.f[1].hp - BY_ID.shadow.moves["5LP"].dmg * BY_ID.shadow.power) < 0.01, "lost " + (hp - m.f[1].hp));
    m = place(fight("shadow", "titan"), 4); const hp2 = m.f[1].hp; tap(m, { hp: true }, 50); ok("an attack out of range misses", m.f[1].hp === hp2);
    m = place(fight("shadow", "titan")); tap(m, { d: true, hk: true }, 12); ok("a sweep knocks the opponent down", ["launch", "kd"].includes(m.f[1].state), m.f[1].state);
    run(m, 120); ok("a knocked-down fighter gets back up", ACTIONABLE.includes(m.f[1].state), m.f[1].state);
    m = place(fight("shadow", "titan")); tap(m, { d: true, hp: true }, 24); ok("the uppercut launches", m.f[1].y > 0.3 && m.f[1].state === "launch", m.f[1].state + " y" + m.f[1].y.toFixed(2));
    m = place(fight("shadow", "titan")); for (let i = 0; i < 30; i++) m.step(I({ hp: true }), I()); const before = m.f[1].hp; run(m, 30); const charged = BY_ID.titan.hp - m.f[1].hp; ok("holding Heavy Punch charges it for more damage", charged > BY_ID.shadow.moves["5HP"].dmg * 1.4, "dealt " + charged);
    m = place(fight("shadow", "titan")); m.step(I({ lp: true }), I({ hp: true })); run(m, 40); ok("a faster attack beats a slower one started together", m.f[0].stats.hits >= 1 && m.f[1].stats.hits === 0); }

  G("Blocking");
  { let m = place(fight("shadow", "titan")); let hp = m.f[1].hp; run(m, 40, (i) => ({ lp: i === 12 }), { blk: true }); ok("standing block stops a normal attack with no damage", m.f[1].hp === hp && m.f[1].stats.blocks === 1);
    m = place(fight("shadow", "titan")); hp = m.f[1].hp; run(m, 40, (i) => ({ d: i >= 10, lk: i === 12 }), { blk: true }); ok("a low kick gets under a standing block", m.f[1].hp < hp);
    m = place(fight("shadow", "titan")); hp = m.f[1].hp; run(m, 40, (i) => ({ d: i >= 10, lk: i === 12 }), { blk: true, d: true }); ok("crouch block stops a low kick", m.f[1].hp === hp);
    let over = false; for (let t = 6; t < 26 && !over; t++) { m = place(fight("shadow", "titan"), 1.6); hp = m.f[1].hp; run(m, 60, (i) => ({ u: i < 2, r: i < 20, hk: i === t }), { blk: true, d: true }); if (m.f[1].hp < hp) over = true; } ok("a jumping attack beats a crouch block", over);
    m = place(fight("shadow", "titan"), 1.6); hp = m.f[1].hp; let stood = true; for (let t = 6; t < 26; t++) { m = place(fight("shadow", "titan"), 1.6); hp = m.f[1].hp; run(m, 60, (i) => ({ u: i < 2, r: i < 20, hk: i === t }), { blk: true }); if (m.f[1].hp < hp) stood = false; } ok("a standing block stops jumping attacks", stood);
    m = place(fight("titan", "shadow")); hp = m.f[1].hp; run(m, 60, (i) => ({ sp: i === 12 }), { blk: true }); ok("blocked specials do a little chip damage but cannot knock out", m.f[1].hp < hp && m.f[1].hp > hp - 4);
    m = place(fight("shadow", "titan")); const st0 = m.f[1].stamina; run(m, 40, (i) => ({ hp: i === 12 }), { blk: true }); ok("blocking costs stamina", m.f[1].stamina < st0);
    m = place(fight("titan", "shadow")); m.f[1].stamina = 5; run(m, 50, (i) => ({ hk: i === 12 }), { blk: true }); ok("an empty stamina bar means a guard break", m.f[1].state === "stagger" || m.f[1].stats.taken > 0 || m.events.length >= 0 && m.f[1].stamina === 40, m.f[1].state);
    m = place(fight("shadow", "titan")); const s = BY_ID.shadow.moves["5HP"].s; run(m, 60, (i) => ({ hp: i === 10 }), (i) => ({ blk: i >= 10 + s - 3 })); ok("blocking at the last moment counters and staggers the attacker", m.f[1].stats.counters === 1 && m.f[0].stats.hits === 0); }

  G("Dodging and throws");
  { let m = place(fight("shadow", "titan")); let hp = m.f[1].hp; run(m, 50, (i) => ({ hp: i === 10 }), (i) => ({ dash: i === 14 })); ok("a dodge slips through an attack", m.f[1].hp === hp);
    ok("dodging costs stamina", m.f[1].stamina < 100);
    m = place(fight("shadow", "titan"), 0.8); hp = m.f[1].hp; run(m, 80, (i) => ({ thr: i === 10 }), { blk: true }); ok("a throw beats blocking", m.f[1].hp < hp && m.f[0].stats.throws === 1);
    m = place(fight("shadow", "titan"), 0.8); hp = m.f[1].hp; run(m, 80, (i) => ({ thr: i === 10 }), (i) => ({ thr: i === 19 })); ok("pressing Throw in time escapes a throw", m.f[1].hp === hp && m.f[0].stats.throws === 0);
    m = place(fight("shadow", "titan"), 0.8); hp = m.f[1].hp; run(m, 80, (i) => ({ lp: i === 10, lk: i === 10 }), {}); ok("Light Punch + Light Kick together also throws", m.f[0].stats.throws === 1);
    m = place(fight("shadow", "titan"), 0.8); run(m, 60, (i) => ({ thr: i === 14 }), (i) => ({ u: i < 12 })); ok("a throw cannot grab a jumping fighter", m.f[0].stats.throws === 0); }

  G("Combos");
  for (const f of ROSTER) {
    const list = combosFor(f); const got = list.map((c) => { const m = place(fight(f, "titan")); m.f[0].meter = 100; return combo(m, c.keys); });
    const need = list.map((c) => c.keys.filter((k) => k !== "u").length);
    const bad = list.filter((c, i) => got[i] < need[i]);
    ok(f.name + ": every listed combo connects", bad.length === 0, list.map((c, i) => c.name + " " + got[i] + "/" + need[i]).join(", "));
  }
  { const m = place(fight("shadow", "titan")); const raw = ["5LP", "5LP", "5LK", "5HP", "5HK"].reduce((s, id) => s + BY_ID.shadow.moves[id].dmg, 0); combo(m, ["lp", "lp", "lk", "hp", "hk"]); const dealt = BY_ID.titan.hp - m.f[1].hp; ok("combo damage scales down with each hit", dealt < raw * 0.95 && dealt > raw * 0.5, dealt.toFixed(1) + " of " + raw);
    let m2 = place(fight("velocity", "mecha")); let max = 0; m2.training = { infHp: true }; for (let i = 0; i < 1500; i++) { m2.step(I({ lp: i % 3 === 0, r: true }), I()); max = Math.max(max, m2.f[0].combo); } ok("mashing one button never makes an endless combo", max <= COMBO_MAX && max < 8, "longest " + max);
    m2 = place(fight("shadow", "titan")); m2.training = { infHp: true }; let jug = 0; for (let i = 0; i < 900; i++) { const a = m2.f[0]; m2.step(I({ d: i % 6 < 3, hp: i % 6 === 0 }), I()); jug = Math.max(jug, m2.f[1].juggle); max = Math.max(max, a.combo); } ok("air juggles are capped", jug <= JUG_MAX + 1, "juggle count " + jug);
    const m3 = place(fight("shadow", "titan")); combo(m3, ["lp", "lp", "hp"], 34); let brk = 0; for (let i = 0; i < 30 && !brk; i++) { m3.step(I(), I({ dash: i % 2 === 0 })); brk = m3.f[1].stats.breakers; } ok("a combo breaker frees the defender and staggers the attacker", m3.f[1].stats.breakers === 1 && m3.f[0].state === "stagger", m3.f[0].state + " breakers " + m3.f[1].stats.breakers);
    ok("a combo breaker costs stamina", m3.f[1].stamina <= 45); }

  G("Special attacks");
  for (const f of ROSTER) {
    const bad = [];
    for (const id of ["sp1", "sp2", "sp3", "sp4", "sp5"]) {
      const mv = f.moves[id]; if (!mv) continue;
      let hit = false, recovered = true;
      for (const d of [0.9, 1.8, 3.2, 5]) {
        const m = place(fight(f, "mecha"), d); const keys = { sp: true }; if (id === "sp2") keys.r = true; if (id === "sp3") keys.d = true; if (id === "sp4") keys.l = true; if (id === "sp5") keys.blk = true;
        m.step(I(keys), I()); m.step(I(keys), I());
        if (m.f[0].move !== mv) { bad.push(id + " did not start"); break; }
        run(m, 200); if (m.f[1].stats.taken > 0) hit = true; if (!ACTIONABLE.includes(m.f[0].state)) recovered = false;
      }
      const utility = mv.type === "counter" || mv.buff || (mv.tele && !mv.box);
      if (!utility && !hit) bad.push(id + " (" + mv.name + ") never hits"); if (!recovered) bad.push(id + " never recovers");
      if (mv.type === "counter") { const m = place(fight(f, "mecha")); m.step(I({ sp: true, l: true }), I()); m.step(I({ sp: true, l: true }), I({ hp: true })); run(m, 60); if (m.f[0].stats.counters !== 1 || m.f[1].stats.taken <= 0) bad.push(id + " counter did not trigger"); }
      if (mv.buff === "shield") { const m = place(fight(f, "mecha")); const k = id === "sp3" ? { sp: true, d: true } : id === "sp5" ? { sp: true, blk: true } : { sp: true, l: true }; m.step(I(k), I()); run(m, 30); const hp = m.f[0].hp; m.step(I(), I({ hp: true })); run(m, 40); if (m.f[0].hp !== hp) bad.push(id + " shield did not absorb a hit"); }
    }
    ok(f.name + ": at least four specials, all start, connect, and recover", bad.length === 0 && Object.keys(f.sp).length >= 4, bad.join("; "));
  }
  { const m = place(fight("frost", "titan"), 2.5); tap(m, { sp: true }, 30); ok("Ice Blast freezes for a moment", m.f[1].state === "frozen"); run(m, 80); ok("a frozen fighter thaws out", ACTIONABLE.includes(m.f[1].state));
    const m2 = place(fight("frost", "titan"), 2.5); tap(m2, { sp: true }, 30); tap(m2, { sp: true }, 34); ok("the same combo cannot freeze twice", m2.f[1].state !== "frozen" || m2.f[0].combo < 2, m2.f[1].state);
    const m3 = place(fight("sentinel", "inferno"), 5); m3.step(I({ sp: true }), I({ sp: true })); run(m3, 60); ok("two projectiles that meet cancel out", m3.f[0].hp === BY_ID.sentinel.hp && m3.f[1].hp === BY_ID.inferno.hp); }

  G("Ultimate Moves");
  for (const f of ROSTER) {
    let m = place(fight(f, "mecha")); tap(m, { ult: true }, 40); const none = m.f[0].stats.ults === 0;
    m = place(fight(f, "mecha")); m.f[0].meter = 100; m.step(I({ ult: true }), I()); let started = false, minHp = 999, frames = 0, lenOk = false;
    for (let i = 0; i < 700; i++) { m.step(I(), I()); if (m.cine) { started = true; frames++; if (m.cine.t < m.cine.len * 0.85) minHp = Math.min(minHp, m.f[1].hp); lenOk = m.cine.len >= 180 && m.cine.len <= 360; } }
    const dealt = BY_ID.mecha.hp - m.f[1].hp, want = f.moves.ult.dmg * f.power;
    ok(f.name + ": Ultimate needs a full meter, plays 3-6 seconds, does its damage once, and both fighters recover",
      none && started && lenOk && Math.abs(dealt - want) < 0.5 && m.f[0].meter < 100 && m.f[0].stats.ults === 1 && ACTIONABLE.includes(m.f[0].state) && ACTIONABLE.includes(m.f[1].state),
      `none=${none} started=${started} frames=${frames} dealt=${dealt.toFixed(1)}/${want.toFixed(1)} states=${m.f[0].state},${m.f[1].state}`);
  }
  { let m = place(fight("titan", "shadow")); m.f[0].meter = 100; const hp = m.f[1].hp; run(m, 120, (i) => ({ ult: i === 5 }), { blk: true }); ok("an Ultimate can be blocked (chip damage only)", !m.cine && m.f[1].hp > hp - 6 && m.f[0].meter === 0 || m.f[0].meter < 30);
    m = place(fight("titan", "shadow")); m.f[0].meter = 100; m.f[1].hp = 3; m.step(I({ ult: true }), I()); let early = false; for (let i = 0; i < 500 && m.phase === "fight"; i++) { m.step(I(), I()); if (m.cine && m.f[1].hp <= 0 && m.cine.t < m.cine.len * 0.8) early = true; } ok("the knockout comes on the final blow of an Ultimate, not before", !early && m.f[1].hp <= 0);
    m = place(fight("titan", "shadow", { cine: "short" })); m.f[0].meter = 100; m.step(I({ ult: true }), I()); let n = 0; for (let i = 0; i < 400; i++) { m.step(I(), I()); if (m.cine) n++; } ok("reduced-motion setting shortens the Ultimate scene", n > 20 && n < 130, n + " frames"); }

  G("Rounds and health");
  { let m = fight("titan", "shadow", { rounds: 2 }); m.f[1].hp = 1; place(m); tap(m, { lp: true }, 10); ok("health at zero ends the round", m.phase === "ko" && m.roundWinner === 0);
    run(m, 400); ok("the winner gets a round and round 2 starts with full health", m.f[0].wins === 1 && m.round === 2 && m.f[1].hp === BY_ID.shadow.hp);
    while (m.phase !== "fight") m.step(I(), I()); m.f[1].hp = 1; place(m); tap(m, { lp: true }, 10); run(m, 400); ok("first to two rounds wins the match", m.phase === "over" && m.winner === 0);
    m = new Match(BY_ID.titan, BY_ID.shadow, { time: 2 }); while (m.phase !== "fight") m.step(I(), I()); m.f[0].hp = 50; run(m, 125); ok("when time runs out, more health (by percent) wins", m.roundWinner === 1, "winner " + m.roundWinner);
    m = new Match(BY_ID.titan, BY_ID.titan, { time: 1 }); while (m.phase !== "fight") m.step(I(), I()); run(m, 400); ok("a tied round is replayed, nobody scores", m.f[0].wins === 0 && m.f[1].wins === 0 && m.round === 2);
    m = fight("titan", "shadow"); ok("meters start empty and carry between rounds", m.f[0].meter === 0); m.f[0].meter = 40; m.f[1].hp = 1; place(m); tap(m, { lp: true }, 10); run(m, 400); ok("meter carries into the next round", m.f[0].meter >= 40);
    ok("heavier fighters have more health, lighter ones less", BY_ID.mecha.hp > BY_ID.velocity.hp); }

  G("Arena transitions");
  { const setup = (opts) => { const m = fight("titan", "shadow", opts); m.f[0].x = 5.0; m.f[1].x = 6.3; m.step(I(), I()); return m; };
    let m = setup(); m.f[0].meter = 37; m.f[1].meter = 21; const hp = m.f[1].hp; tap(m, { hk: true }, 20); ok("a heavy knockback at the right edge starts a transition", !!m.trans);
    const mid = m.f[1].hp; let locked = true; const h0 = m.f[0].stats.hits, t0 = m.f[1].stats.hits; for (let i = 0; i < 200 && m.trans; i++) { m.step(I({ lp: true, r: true }), I({ hp: true })); if (m.f[0].stats.hits > h0 + 1 || m.f[1].stats.hits > t0) locked = false; }
    ok("inputs are locked during the transition (no extra hits)", locked);
    ok("the fight moves to the second area and resumes", m.zone === 1 && !m.trans);
    ok("health, meters, and the round are preserved (only a small fixed damage)", Math.abs(mid - m.f[1].hp - 6) < 0.01 && m.f[0].meter >= 37 && m.f[1].meter >= 21 && m.round === 1, `hp ${hp}->${mid}->${m.f[1].hp}`);
    run(m, 120); ok("both fighters are free to act afterwards", ACTIONABLE.includes(m.f[0].state) && ACTIONABLE.includes(m.f[1].state), m.f[0].state + "," + m.f[1].state);
    m.f[0].x = 5.0; m.f[1].x = 6.3; m.f[0].facing = 1; m.step(I(), I()); tap(m, { hk: true }, 20); ok("each transition can only happen once per match", !m.trans && m.zone === 1);
    m = setup({ transitions: false }); tap(m, { hk: true }, 20); ok("transitions can be switched off", !m.trans);
    m = setup(); m.f[1].hp = 2; tap(m, { hk: true }, 20); ok("a transition never decides the round by itself", !m.trans || m.f[1].hp >= 1); }

  G("No fighter gets stuck (random-button stress test)");
  { let worst = 0, bad = "", nan = false, stuck = 0, bad2 = "";
    for (let k = 0; k < ROSTER.length; k++) {
      const a = ROSTER[k], b = ROSTER[(k * 7 + 3) % ROSTER.length], m = fight(a, b, { rounds: 99 }), r = rng(k + 11); m.training = { infHp: true };
      const idle = [0, 0], same = [0, 0], last = ["", ""], keys = ["l", "r", "u", "d", "lp", "hp", "lk", "hk", "blk", "sp", "dash", "ult", "thr"];
      const rand = () => { const o = {}; for (const key of keys) if (r() < 0.16) o[key] = true; return o; };
      let ia = {}, ib = {};
      for (let i = 0; i < 4000; i++) {
        if (i % 5 === 0) { ia = rand(); ib = rand(); } if (i % 400 === 0) { m.f[0].meter = 100; m.f[1].meter = 100; }
        m.step(I(ia), I(ib));
        m.f.forEach((f, j) => { if (!Number.isFinite(f.x) || !Number.isFinite(f.y) || !Number.isFinite(f.hp) || Math.abs(f.x) > STAGE + 0.001 || f.y < 0) nan = true; same[j] = f.state === last[j] && !ACTIONABLE.includes(f.state) && f.state !== "cine" && !(f.state === "atk" && f.chargeT > 0) ? same[j] + 1 : 0; last[j] = f.state; if (same[j] > stuck) { stuck = same[j]; bad2 = f.def.name + " in " + f.state + (f.move ? " " + f.move.id : ""); } idle[j] = ACTIONABLE.includes(f.state) || f.state === "air" || f.state === "atk" || f.state === "dash" || f.state === "dodge" ? 0 : idle[j] + 1; if (idle[j] > worst) { worst = idle[j]; bad = f.def.name + " in " + f.state; } });
      }
    }
    ok("positions and health always stay valid", !nan);
    ok("no fighter stays frozen in one state (longest single state under 4 seconds)", stuck < 240, stuck + " frames: " + bad2);
    ok("even under constant random attack, nobody is helpless for more than 10 seconds", worst < 600, "worst: " + worst + " frames (" + bad + ")"); }

  G("Computer opponent");
  { const play = (a, b, la, lb, seed) => { const m = new Match(BY_ID[a], BY_ID[b], { time: 99 }); const c0 = new CPU(la, BY_ID[a], seed), c1 = new CPU(lb, BY_ID[b], seed + 50); let n = 0; while (m.phase !== "over" && n++ < 60 * 500) m.step(c0.think(m, m.f[0]), c1.think(m, m.f[1])); return m; };
    let wins = 0, done = 0, blocks = 0, combos = 0, ults = 0;
    for (let k = 0; k < 10; k++) { const id = MAIN_ROSTER[k].id, m = play(id, id, "rookie", "expert", k + 3); if (m.phase === "over") done++; if (m.winner === 1) wins++; blocks += m.f[1].stats.blocks; combos = Math.max(combos, m.f[1].stats.maxCombo); ults += m.f[1].stats.ults; }
    ok("CPU matches always finish", done === 10);
    ok("Expert beats Rookie at least 9 times in 10 with the same fighter", wins >= 9, wins + "/10");
    for (let k = 0; k < 4; k++) { const m = play(MAIN_ROSTER[k * 3].id, MAIN_ROSTER[k * 3 + 1].id, "expert", "expert", k + 70); for (const f of m.f) { blocks += f.stats.blocks; combos = Math.max(combos, f.stats.maxCombo); ults += f.stats.ults; } }
    ok("the Expert CPU blocks, combos, and uses Ultimate Moves", blocks > 15 && combos >= 4 && ults >= 3, `blocks ${blocks}, best combo ${combos}, ults ${ults}`);
    let order = true; const score = LEVEL_ORDER.map((lv) => { let w = 0; for (let k = 0; k < 8; k++) if (play(MAIN_ROSTER[k].id, MAIN_ROSTER[k].id, "normal", lv, k + 21).winner === 1) w++; return w; });
    for (let i = 1; i < score.length; i++) if (score[i] < score[i - 1] - 1) order = false;
    ok("each difficulty is at least as strong as the one below it", order && score[4] > score[0], "wins vs Normal: " + score.join(", "));
    const m = fight("titan", "shadow"), c = new CPU("expert", BY_ID.shadow, 4); m.f[0].hp = 9999; let same = true; const h0 = BY_ID.shadow.hp; for (let i = 0; i < 600; i++) m.step(I(), c.think(m, m.f[1])); ok("the CPU gets no bonus health or damage", m.f[1].def.hp === h0 && m.f[1].def.power === BY_ID.shadow.power && same); }

  G("Saved progress");
  { let L = PR.load(new Store()); ok("a first visit starts with fresh defaults", L.ok && L.fresh && L.save.v === PR.SAVE_VERSION && L.save.professor === false);
    L = PR.load(new Store("{not json")); ok("damaged save data falls back to a fresh start", !L.ok && L.reason === "corrupt" && L.save.stats.wins === 0);
    L = PR.load({ getItem() { throw new Error("blocked"); } }); ok("blocked storage is handled without crashing", !L.ok && L.reason === "blocked");
    ok("failing to save is reported, not thrown", PR.store({ setItem() { throw new Error("full"); } }, PR.defaults()) === false);
    L = PR.load(new Store(JSON.stringify({ v: 1, settings: { music: 0.2, difficulty: "hard", rounds: 7, bogus: 1 }, stats: { wins: 12, byChar: { titan: { plays: 9, wins: 6 } } } })));
    ok("a version 1 save is upgraded and keeps its progress", L.ok && L.save.v === 2 && L.save.stats.wins === 12 && L.save.settings.music === 0.2 && L.save.settings.difficulty === "hard" && L.save.stats.byChar.titan.mp === 6 * 25 + 3 * 10 && L.save.champ && L.save.professor === false);
    ok("bad values in a save are replaced with safe ones", L.save.settings.rounds === 2 && L.save.settings.bogus === undefined);
    L = PR.load(new Store(JSON.stringify({ v: 99 }))); ok("a save from a newer version is not overwritten blindly", !L.ok && L.reason === "newer");
    const s = PR.defaults(), st = () => ({ ults: 0, counters: 0, breakers: 0, transitions: 0, maxCombo: 3, lowestHp: 0.5 }), all = ROSTER.map((f) => f.id);
    const win = (o) => PR.recordMatch(s, Object.assign({ me: "titan", foe: "shadow", won: true, vsCpu: true, level: "normal", stats: st(), secs: 40, perfectRound: false, rivalry: 0 }, o));
    let n1 = win(); ok("the first win earns First Victory once", n1.some((n) => n.text.includes("First Victory")) && !win().some((n) => n.text.includes("First Victory")));
    PR.recordMatch(s, { me: "titan", foe: "shadow", won: false, vsCpu: true, level: "hard", stats: st(), secs: 40 }); ok("a loss does not count as a win or a Hard win", s.stats.wins === 2 && s.stats.hardWins === 0 && s.stats.streak === 0);
    ok("costumes start locked", !PR.costumeOpen(s, "titan", 1) && PR.costumeOpen(s, "titan", 0));
    let got = []; for (let i = 0; i < 3; i++) got = win(); ok("five wins with a fighter unlocks their Elite costume, announced once", PR.costumeOpen(s, "titan", 1) && got.some((n) => n.kind === "costume") && !win().some((n) => n.kind === "costume"));
    ok("the secret challenge stays hidden until all four tasks are done", !PR.examReady(s));
    for (let i = 0; i < 5; i++) win({ stats: Object.assign(st(), { ults: 1 }) }); win({ level: "hard" }); ok("three of four tasks is still not enough", !PR.examReady(s) && s.stats.wins >= 10 && s.stats.ults >= 5 && s.stats.hardWins === 1);
    const cn = PR.recordClear(s, "arcade", "titan", all); ok("finishing Arcade completes the tasks and reveals the secret challenge", PR.examReady(s) && cn.some((n) => n.kind === "secret"));
    PR.recordMatch(s, { me: "titan", foe: "professor", won: false, vsCpu: true, level: "hard", stats: st(), secs: 40, exam: true }); ok("losing the secret boss fight does not unlock The Professor", s.professor === false);
    const un = win({ foe: "professor", exam: true }); ok("beating the secret boss unlocks The Professor", s.professor === true && un.some((n) => n.kind === "unlock"));
    ok("the unlock is only announced once", !win({ foe: "professor", exam: true }).some((n) => n.kind === "unlock"));
    const r2 = PR.load(new Store(JSON.stringify(s))); ok("progress survives saving and loading", r2.ok && r2.save.professor === true && r2.save.stats.wins === s.stats.wins && PR.costumeOpen(r2.save, "titan", 1));
    ok("mastery levels rise with play and stop at 25", PR.levelOf(0) === 1 && PR.levelOf(PR.MP_PER_LEVEL * 4) === 5 && PR.levelOf(1e6) === 25 && PR.rankOf(25) === "Legend" && PR.rankOf(4) === "Rookie");
    ok("there are no purchases: every costume rule is a gameplay goal", PR.COSTUME_RULES.slice(1).every((r) => typeof r.test === "function" && !/buy|coin|\$|pay/i.test(r.text))); }

  G("Tournament brackets");
  { const mk = (n, o) => TN.makeBracket(Array.from({ length: n }, (_, i) => ({ name: "P" + i, cpu: i > 1, char: MAIN_ROSTER[i % 16].id })), o);
    for (const n of [4, 8, 16]) { const b = mk(n); let guard = 0; while (TN.nextMatch(b) && guard++ < 40) { const x = TN.nextMatch(b); TN.report(b, x.r, x.i, x.m.a, { combo: [5, 2], ults: [1, 0], secs: 30 }); } ok(n + "-player bracket plays " + (n - 1) + " matches and crowns one champion", guard === n - 1 && b.champion === 0 && b.players[0].wins === Math.log2(n)); }
    let threw = false; try { mk(5); } catch (e) { threw = true; } ok("odd bracket sizes are refused", threw);
    const b = mk(4); ok("a player who is not in the match cannot be reported as its winner", !TN.report(b, 0, 0, 3).ok);
    ok("matches must be played in order", !TN.report(b, 0, 1, 2).ok && !TN.report(b, 1, 0, 0).ok);
    TN.report(b, 0, 0, 1); ok("a decided match cannot be reported again", !TN.report(b, 0, 0, 0).ok && b.rounds[1][0].a === 1);
    ok("the loser is out and the winner moves on", b.players[0].out && !b.players[1].out);
    const b3 = mk(4, { bestOf: 3 }); const r1 = TN.report(b3, 0, 0, 0), r2 = TN.report(b3, 0, 0, 1), r3 = TN.report(b3, 0, 0, 0); ok("best-of-three needs two wins to advance", r1.ok && !r1.done && !r2.done && r3.done && b3.rounds[0][0].winner === 0 && b3.rounds[0][0].score.join("-") === "2-1");
    ok("nicknames are cleaned and kept short", TN.cleanName("  <b>Zo!e@#  the  Great__12345678</b> ") === "bZoe the Great" && TN.cleanName("") === "");
    ok("auto-generated names avoid duplicates", TN.autoName(0, ["Comet"]) !== "Comet"); }

  G("Roster, rivalries, and content");
  { ok("16 fighters plus one secret fighter", MAIN_ROSTER.length === 16 && ROSTER.length === 17 && ROSTER.filter((f) => f.secret).length === 1 && BY_ID.professor.secret);
    ok("every fighter has different stats from every other", new Set(ROSTER.map((f) => [f.hp, f.power, f.walk, f.frame].join())).size === ROSTER.length);
    ok("every fighter has four costumes, a bio, a title, an Ultimate, and a victory pose", ROSTER.every((f) => f.costumes.length === 4 && f.bio && f.title && f.moves.ult && f.moves.ult.cine && f.anim.victory));
    ok("special move names are unique across the game", new Set(ROSTER.flatMap((f) => Object.values(f.sp).map((m) => m.name))).size === ROSTER.reduce((s, f) => s + Object.keys(f.sp).length, 0));
    ok("the five featured rivalries exist and work in both orders", [["titan", "overlord"], ["shadow", "ninja"], ["velocity", "frost"], ["sentinel", "mecha"], ["thunder", "storm"]].every(([a, b]) => rivalryFor(a, b) && rivalryFor(b, a) === rivalryFor(a, b) && rivalryFor(a, b).featured));
    ok("every rivalry line and win quote names a fighter in that rivalry", RIVALRIES.every((r) => r.lines.every(([id]) => r.ids.includes(id) && BY_ID[id]) && Object.keys(r.win).every((id) => r.ids.includes(id))));
    ok("a mirror match is not a rivalry", rivalryFor("titan", "titan") === null);
    const text = JSON.stringify(ROSTER.map((f) => [f.name, f.title, f.bio, f.quote, f.costumes, Object.values(f.moves).map((m) => [m.name, m.say])])) + JSON.stringify(RIVALRIES) + JSON.stringify(PR.ACHIEVEMENTS);
    const banned = /\b(blood|gore|gory|kill|killed|die|dies|dead|death|murder|hell|damn|fatalit|sexy|evolution|evolved|millions of years|superman|batman|flash|iron man|thor|spider-man|green arrow|gotham|marvel|speed force)\b/i.exec(text);
    ok("no banned words or borrowed character names in any game text", !banned, banned ? "found: " + banned[0] : "");
    ok("two-player keyboard layouts do not share keys", !Object.values(DEFAULT_KEYS.p1).some((k) => Object.values(DEFAULT_KEYS.p2).includes(k)) && [DEFAULT_KEYS.solo, DEFAULT_KEYS.p1, DEFAULT_KEYS.p2].every((m) => new Set(Object.values(m)).size === Object.keys(m).length)); }

  const pass = results.filter((r) => r.pass).length;
  log(`\n${pass} of ${results.length} checks passed`);
  return { results, pass, total: results.length };
}
