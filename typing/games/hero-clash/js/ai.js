// Hero Clash — computer-controlled fighter.
// The CPU plays through the same inputs a person does. Difficulty changes how
// quickly it reacts, how often it guesses right, and how long its combos are.
// It never gets extra health or damage, and it only "sees" the opponent after a
// reaction delay, so it cannot read button presses the instant they happen.
import { blankInput, reach, STAGE } from "./combat.js";
import { combosFor } from "./fighters.js";

export const LEVELS = {
  rookie: { name: "Rookie", react: 28, block: 0.1, punish: 0.12, combo: 0.1, special: 0.12, aggro: 0.3, antiAir: 0.05, ult: 0.25, tech: 0.03, slip: 0.55, breaker: 0 },
  easy: { name: "Easy", react: 21, block: 0.28, punish: 0.3, combo: 0.3, special: 0.22, aggro: 0.45, antiAir: 0.2, ult: 0.45, tech: 0.12, slip: 0.35, breaker: 0.05 },
  normal: { name: "Normal", react: 15, block: 0.48, punish: 0.55, combo: 0.55, special: 0.35, aggro: 0.6, antiAir: 0.45, ult: 0.7, tech: 0.3, slip: 0.18, breaker: 0.2 },
  hard: { name: "Hard", react: 11, block: 0.66, punish: 0.78, combo: 0.78, special: 0.45, aggro: 0.72, antiAir: 0.66, ult: 0.85, tech: 0.5, slip: 0.08, breaker: 0.4 },
  expert: { name: "Expert", react: 8, block: 0.8, punish: 0.92, combo: 0.94, special: 0.55, aggro: 0.82, antiAir: 0.82, ult: 0.95, tech: 0.7, slip: 0.03, breaker: 0.6 },
};
export const LEVEL_ORDER = ["rookie", "easy", "normal", "hard", "expert"];

// How each kind of fighter likes to play
const PROFILE = {
  aggressive: { keep: 0.9, zone: 0.15, throw: 0.18, jump: 0.2, guard: 0.85 },
  defensive: { keep: 1.9, zone: 0.4, throw: 0.1, jump: 0.06, guard: 1.2 },
  balanced: { keep: 1.3, zone: 0.3, throw: 0.14, jump: 0.12, guard: 1.0 },
  grappler: { keep: 0.75, zone: 0.12, throw: 0.34, jump: 0.05, guard: 0.95 },
  ranged: { keep: 3.3, zone: 0.8, throw: 0.1, jump: 0.1, guard: 1.1 },
};

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class CPU {
  constructor(level = "normal", def, seed = 1, opts = {}) {
    this.L = Object.assign({}, LEVELS[level] || LEVELS.normal, opts.tune || {});
    this.P = PROFILE[opts.profile || def.ai] || PROFILE.balanced;
    this.rand = rng(seed * 7919 + 13);
    this.hist = []; this.seq = 0; this.plan = []; this.cool = 0; this.seenMove = null; this.lastKinds = []; this.blockSeen = 0;
    this.def = def;
    const M = def.moves;
    this.shots = ["sp1", "sp2", "sp3", "sp4", "sp5"].filter((k) => M[k] && M[k].proj);
    this.rushes = ["sp1", "sp2", "sp3", "sp4"].filter((k) => M[k] && M[k].box && M[k].type !== "counter" && (M[k].mv || M[k].hop) && !M[k].launch);
    this.antiAirs = ["sp1", "sp2", "sp3", "sp4"].filter((k) => M[k] && M[k].launch && M[k].box);
    this.counters = ["sp1", "sp2", "sp3", "sp4"].filter((k) => M[k] && (M[k].type === "counter" || M[k].buff === "shield"));
    this.escapes = ["sp1", "sp2", "sp3", "sp4"].filter((k) => M[k] && M[k].tele && !M[k].box);
    this.buffs = ["sp1", "sp2", "sp3", "sp4"].filter((k) => M[k] && M[k].buff === "haste");
    this.combos = combosFor(def);
    this.poke = reach(M["5LK"]); this.far = reach(M["5HK"]);
  }
  key(inp, me, k) {
    if (k === "f") inp[me.facing > 0 ? "r" : "l"] = true; else if (k === "b") inp[me.facing > 0 ? "l" : "r"] = true;
    else if (k.startsWith("sp")) { inp.sp = true; if (k === "sp2") this.key(inp, me, "f"); if (k === "sp3") inp.d = true; if (k === "sp4") this.key(inp, me, "b"); if (k === "sp5") inp.blk = true; }
    else inp[k] = true;
  }
  // queue helpers: each step is { keys:[...], n: frames to hold, wait: "conn" | "air" | "fall" | null }
  tap(keys, n = 2) { this.plan.push({ keys, n, tap: true }); }
  wait(kind, timeout = 26) { this.plan.push({ keys: [], n: timeout, wait: kind }); }
  hold(keys, n) { this.plan.push({ keys, n }); }
  comboPlan(keys) {
    keys.forEach((k, i) => {
      if (i > 0 && keys[i - 1] !== "u") this.wait("conn");
      if (k === "u") { this.plan.push({ keys: ["u"], n: 40, wait: "air" }); this.wait("fall", 30); }
      else this.plan.push({ keys: k.split("+"), n: 12, tap: true, start: true });   // hold the direction until the move actually starts
    });
  }

  think(match, me) {
    const inp = blankInput(), opp = match.f[1 - me.idx], L = this.L, P = this.P, r = this.rand;
    // remember what the opponent was doing, so reactions are delayed like a person's
    this.hist.push({ state: opp.state, move: opp.move, mt: opp.mt, x: opp.x, y: opp.y, st: opp.st, blk: opp.state === "block" || opp.state === "bstun" });
    if (this.hist.length > 40) this.hist.shift();
    const seen = this.hist[Math.max(0, this.hist.length - 1 - L.react)];
    const dx = opp.x - me.x, dist = Math.abs(dx), toward = dx > 0 ? "r" : "l", away = dx > 0 ? "l" : "r";
    if (seen.blk) this.blockSeen = Math.min(120, this.blockSeen + 2); else if (this.blockSeen > 0) this.blockSeen--;
    if (match.phase !== "fight" || match.cine || match.trans) { this.plan.length = 0; return inp; }

    // being thrown: try to break free in time
    if (me.state === "thrown") { if (me.st === 6 && r() < L.tech) inp.thr = true; return inp; }
    // being comboed: maybe spend stamina on a combo breaker
    if ((me.state === "hstun" || me.state === "launch") && opp.combo >= 3 && me.stamina >= 60 && me.breakCd === 0) { if (r() < L.breaker * 0.08) inp.dash = true; this.plan.length = 0; return inp; }
    if (["hstun", "launch", "stagger", "frozen", "getup", "bstun"].includes(me.state)) {
      this.plan.length = 0;
      if (me.state === "bstun" || me.state === "getup") { inp.blk = r() < L.block + 0.25; if (seen.move && seen.move.lvl === "low") inp.d = true; }
      return inp;
    }
    if (me.state === "kd") { if (me.st === 3 && r() < L.punish) inp.lp = true; return inp; }

    // carry on with a queued plan (a combo, a retreat, a held block...)
    if (this.plan.length) {
      const s = this.plan[0];
      if (s.wait) {
        const ok = s.wait === "conn" ? me.hitConn && me.state === "atk" && me.moveSeq > this.seq : s.wait === "air" ? me.state === "air" : s.wait === "fall" ? me.state === "air" && (opp.grounded ? me.vy < 0.12 : opp.y - me.y < 0.75 && me.st > 6) : false;
        if (ok) { this.plan.shift(); return this.think2(inp, me, s.keys); }
        if (--s.n <= 0 || (s.wait === "conn" && me.state !== "atk" && me.moveSeq > this.seq)) this.plan.length = 0;
        for (const k of s.keys) this.key(inp, me, k);
        return inp;
      }
      if (s.tap && !s.sent) { s.sent = true; this.seq = me.moveSeq; }
      for (const k of s.keys) this.key(inp, me, k);
      if (--s.n <= 0 || (s.start && me.moveSeq > this.seq)) this.plan.shift();
      return inp;
    }
    if (this.cool > 0) this.cool--;
    const canAct = ["idle", "walk", "crouch", "block"].includes(me.state);
    if (!canAct) return inp;

    // ---- defense: react to an attack we have had time to notice ----
    const sm = seen.move;
    if (sm && seen.state === "atk" && sm !== this.seenMove && opp.state === "atk" && opp.move === sm) {
      this.seenMove = sm;
      const threat = sm.proj ? dist < 9 : dist < reach(sm) + 0.7;
      if (threat && sm.type !== "counter" && !sm.buff) {
        const roll = r(), want = Math.min(0.95, L.block * P.guard);
        const left = Math.max(6, sm.s + sm.a - opp.mt + 8);
        if (sm.type === "throw") { if (roll < L.tech) { this.tap(["u"], 3); return inp; } }
        else if (roll < want) {
          const low = sm.lvl === "low" && r() < 0.5 + L.block * 0.5;
          if (this.counters.length && r() < L.special * 0.35 && !sm.proj) this.tap([this.counters[0]], 2);
          else if (r() < 0.12 * (1 + L.block) && me.stamina > 40 && !sm.proj) this.tap(["dash"], 2);
          else this.hold(low ? ["blk", "d"] : ["blk"], sm.proj ? Math.min(50, Math.ceil(dist / 0.2) + 10) : left);
          return inp;
        }
      }
    }
    if (opp.state !== "atk") this.seenMove = null;
    // a projectile about to arrive
    for (const p of match.projs) {
      if (p.owner === me.idx || p.arm > 14) continue;
      const pd = Math.abs(p.x - me.x);
      if (pd < 2.2 && (p.vx === 0 || Math.sign(p.vx) === Math.sign(me.x - p.x)) && r() < L.block * 0.5) { if (p.vx === 0) this.hold([away], 14); else this.hold(p.lvl === "low" ? ["blk", "d"] : ["blk"], 12); return inp; }
    }
    // ---- anti-air ----
    if (!opp.grounded && opp.state === "air" && dist < 1.7 && opp.vy < 0.05 && this.cool === 0 && r() < L.antiAir * 0.25) {
      if (this.antiAirs.length && r() < 0.5) this.tap([this.antiAirs[0]], 2); else this.tap(["d", "hp"], 2);
      this.cool = 20; return inp;
    }
    // ---- punish a missed attack or a stunned opponent ----
    const open = (opp.state === "atk" && opp.move && opp.mt > opp.move.s + opp.move.a + 2 && opp.move.r > 12) || opp.state === "stagger" || opp.state === "frozen";
    if (open && dist < this.poke && r() < L.punish) { this.attack(me, opp, true); return inp; }
    if (open && dist < 3 && r() < L.punish * 0.5) { this.hold(["f", "dash"], 2); return inp; }

    // ---- neutral game ----
    if (r() < L.slip * 0.06) { this.hold([], 8 + Math.floor(r() * 16)); return inp; }     // hesitation
    const wantDist = P.keep, zoner = this.shots.length && r() < P.zone;
    if (opp.state === "kd" || opp.state === "getup") {               // wait just outside reach, then press the advantage
      if (dist > this.poke + 0.5) inp[toward] = true; else if (dist < this.poke - 0.4) inp[away] = true;
      else if (opp.state === "getup" && opp.st > 10 && r() < L.aggro * 0.3) { if (r() < P.throw) this.tap(["thr"], 2); else this.attack(me, opp, false); }
      return inp;
    }
    if (zoner && dist > 2.6 && this.cool === 0) {
      const id = this.shots[Math.floor(r() * this.shots.length)];
      if (r() < L.special * 0.2) { this.tap([id], 2); this.cool = 34 + Math.floor(r() * 40 * (1.3 - L.special)); return inp; }
    }
    if (this.buffs.length && dist > 3 && me.buffT === 0 && r() < 0.01 * L.special) { this.tap([this.buffs[0]], 2); return inp; }
    if (dist > Math.max(this.poke - 0.15, wantDist)) {
      // too far: close in (or hold ground if this fighter prefers range)
      if (P.keep > 3 && dist < P.keep + 2 && Math.abs(me.x) < STAGE - 1) { if (dist < P.keep - 0.6) inp[away] = true; return inp; }
      if (this.rushes.length && dist > 1.6 && dist < 3.6 && this.cool === 0 && r() < L.special * 0.05) { this.tap([this.rushes[Math.floor(r() * this.rushes.length)]], 2); this.cool = 50; return inp; }
      if (dist > 3.2 && r() < 0.03 * L.aggro) { this.hold(["f", "dash"], 2); return inp; }
      if (dist > 1.8 && dist < 3.2 && r() < 0.012 * P.jump * 5) { this.hold(["u", "f"], 4); this.plan.push({ keys: [], n: 30, wait: "fall" }); this.tap([r() < 0.5 ? "hk" : "hp"], 2); return inp; }
      if (r() < 0.5 + L.aggro * 0.5) inp[toward] = true;
      return inp;
    }
    // in range
    if (P.keep > 3 && Math.abs(me.x) < STAGE - 0.8 && r() < 0.06) { if (this.escapes.length && r() < 0.4) this.tap([this.escapes[0]], 2); else this.hold(["b", "dash"], 2); return inp; }
    if (this.cool === 0 && r() < 0.1 + L.aggro * 0.25) {
      if (this.blockSeen > 30 && r() < P.throw * 2.2) this.tap(["thr"], 2);
      else if (r() < P.throw * 0.5 && dist < 0.95) this.tap(["thr"], 2);
      else this.attack(me, opp, false);
      this.cool = Math.floor((1 - L.aggro) * 26 + r() * 10);
      return inp;
    }
    if (dist < 0.9 && r() < 0.1) inp[away] = true;
    else if (r() < 0.02 * P.guard) this.hold(["blk"], 10);
    return inp;
  }
  think2(inp, me, keys) { for (const k of keys) this.key(inp, me, k); return this.plan.length ? this.planStep(inp, me) : inp; }
  planStep(inp, me) { const s = this.plan[0]; if (s && !s.wait) { if (s.tap && !s.sent) { s.sent = true; this.seq = me.moveSeq; } for (const k of s.keys) this.key(inp, me, k); if (--s.n <= 0) this.plan.shift(); } return inp; }

  // choose an attack or combo that suits the skill level
  attack(me, opp, punish) {
    const L = this.L, r = this.rand;
    const good = r() < L.combo;
    let pool = this.combos.filter((c) => !c.keys.includes("ult"));
    if (me.meter >= 100 && r() < L.ult * (punish ? 1 : 0.5)) pool = this.combos.filter((c) => c.keys.includes("ult"));
    else if (!good) { // unskilled: single pokes and short strings
      const singles = [["lp"], ["lk"], ["hp"], ["hk"], ["d", "lk"], ["d", "hk"], ["lp", "lp"], ["lp", "hp"]];
      const s = singles[Math.floor(r() * singles.length)];
      if (s.length === 2 && s[0] !== "d") this.comboPlan(s); else this.tap(s, 2);
      return;
    } else {
      const max = L.combo > 0.9 ? 9 : L.combo > 0.7 ? 5 : L.combo > 0.5 ? 4 : 3;
      pool = pool.filter((c) => c.keys.length <= max);
      // do not repeat the same string over and over
      const fresh = pool.filter((c) => !this.lastKinds.includes(c.name)); if (fresh.length) pool = fresh;
    }
    const c = pool[Math.floor(r() * pool.length)] || this.combos[0];
    this.lastKinds.push(c.name); if (this.lastKinds.length > 2) this.lastKinds.shift();
    if (r() < 0.25 && !punish) { this.tap(["d", "lk"], 2); this.wait("conn", 14); this.comboPlan(c.keys.slice(1)); }   // start low sometimes
    else this.comboPlan(c.keys);
  }
}

// Practice dummy behaviours for Training mode
export function dummyInput(mode, match, me) {
  const inp = blankInput(), opp = match.f[1 - me.idx];
  if (mode === "block") { inp.blk = true; if (opp.move && opp.move.lvl === "low") inp.d = true; }
  else if (mode === "crouch") inp.d = true;
  else if (mode === "jump") inp.u = me.grounded && match.frame % 50 < 3;
  else if (mode === "attack") { if (match.frame % 90 < 3) inp.hp = true; }
  return inp;
}
