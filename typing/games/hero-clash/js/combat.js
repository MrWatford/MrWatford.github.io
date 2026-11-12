// Hero Clash: Ultimate Showdown — combat rules.
// Pure logic: no drawing, no sound, no browser features. It runs at a fixed
// 60 steps per second so the same inputs always give the same fight (this is
// what makes it testable in test.html).

export const FPS = 60;
export const STAGE = 7.2;          // half-width of the arena floor
export const GRAV = 0.0165;
export const JUG_MAX = 4;          // air-combo hits allowed after a launch
export const COMBO_MAX = 14;       // hard cap on any combo
const BUF = 8;                     // frames an early button press is remembered
const PARRY_WIN = 6;               // frames after pressing block that count as a counter
const BREAKER_COST = 60;
const DODGE_COST = 22;

export function blankInput() {
  return { l: false, r: false, u: false, d: false, lp: false, hp: false, lk: false, hk: false,
    blk: false, sp: false, dash: false, ult: false, thr: false };
}
const BTN = ["lp", "hp", "lk", "hk", "sp", "dash", "ult", "thr", "u", "blk"];
const NAME = { lp: "LP", hp: "HP", lk: "LK", hk: "HK" };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Fighter {
  constructor(idx, def) {
    this.idx = idx; this.def = def;
    this.wins = 0; this.meter = 0;
    this.stats = { dmg: 0, hits: 0, maxCombo: 0, ults: 0, throws: 0, counters: 0, blocks: 0,
      breakers: 0, taken: 0, specials: 0, transitions: 0, lowestHp: 1 };
    this.reset(idx === 0 ? -2.2 : 2.2);
  }
  reset(x) {
    const d = this.def;
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0;
    this.facing = x < 0 ? 1 : -1;
    this.hp = d.hp; this.stamina = 100; this.stamCd = 0;
    this.state = "idle"; this.st = 0;          // st = frames spent in this state
    this.move = null; this.mt = 0; this.hitN = 0; this.hitConn = false; this.lastHit = -99;
    this.chargeT = 0; this.charged = false; this.str = [];
    this.stun = 0; this.lag = 0; this.low = false; this.blkHeld = false;
    this.parryT = 0; this.lastBlkPress = -99;
    this.combo = 0; this.scale = 1; this.use = {}; this.comboDmg = 0;
    this.juggle = 0; this.jugSafe = false; this.hardKd = false; this.frozeInCombo = false;
    this.inv = 0; this.thrInv = 0; this.shield = 0; this.buffT = 0; this.slowT = 0;
    this.airActs = 0; this.airJumps = 0; this.airDashed = false;
    this.slide = 0; this.breakCd = 0; this.throwDir = 1; this.hitHigh = true;
    this.buf = {}; for (const b of BTN) this.buf[b] = -99;
    this.prev = blankInput(); this.koed = false; this.moveSeq = 0; this.airStart = false; this.parryOK = false; this.getupDir = 0; this.dashDir = 1;
  }
  get grounded() { return this.y <= 0.0001; }
  get crouching() {
    return this.state === "crouch" || (this.state === "block" && this.low) || (this.state === "bstun" && this.low) ||
      (this.state === "atk" && this.move && this.move.crouch);
  }
  // Body box other attacks must touch: [left, bottom, right, top]
  hurt() {
    const d = this.def, hw = d.width;
    if (this.state === "kd" || this.state === "ko") return [this.x - 0.8, this.y, this.x + 0.8, this.y + 0.45];
    if (this.state === "launch") return [this.x - hw - 0.1, this.y, this.x + hw + 0.1, this.y + d.height * 0.75];
    if (this.crouching) return [this.x - hw, this.y, this.x + hw, this.y + d.height * 0.6];
    if (!this.grounded) return [this.x - hw, this.y + 0.15, this.x + hw, this.y + d.height * 0.9];
    return [this.x - hw, this.y, this.x + hw, this.y + d.height];
  }
  // Attack box of the current move this frame, or null
  hitbox() {
    const m = this.move;
    if (this.state !== "atk" || !m || !m.box) return null;
    if (this.mt < m.s || this.mt >= m.s + m.a) return null;
    return boxOf(this, m.box);
  }
}
function boxOf(f, b) {
  const x0 = f.x + f.facing * b[0], x1 = f.x + f.facing * (b[0] + b[2]);
  return [Math.min(x0, x1), f.y + b[1], Math.max(x0, x1), f.y + b[1] + b[3]];
}
const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

export class Match {
  // opts: rounds (wins needed), time (seconds, 0 = no timer), cine ("full"|"short"),
  //       transitions (bool), intro (frames), zone (starting zone)
  constructor(defA, defB, opts = {}) {
    this.opts = Object.assign({ rounds: 2, time: 99, cine: "full", transitions: true, intro: 0 }, opts);
    this.f = [new Fighter(0, defA), new Fighter(1, defB)];
    this.projs = []; this.events = []; this.frame = 0;
    this.round = 0; this.zone = 0; this.transUsed = [false, false];
    this.winner = -1; this.cine = null; this.trans = null; this.hitstop = 0; this.freeze = 0;
    this.training = null;      // { infHp, infMeter } set by Training mode
    this.startRound();
  }
  ev(type, o) { const e = Object.assign({ type }, o); this.events.push(e); return e; }

  startRound() {
    this.round++;
    this.f[0].reset(-2.2); this.f[1].reset(2.2);
    this.projs.length = 0; this.cine = null; this.trans = null; this.hitstop = 0; this.freeze = 0;
    this.timer = this.opts.time * FPS;
    this.roundWinner = -1;
    this.phase = this.round === 1 && this.opts.intro > 0 ? "intro" : "ready"; this.pt = 0;
    this.finalRound = this.f[0].wins === this.opts.rounds - 1 && this.f[1].wins === this.opts.rounds - 1 && this.opts.rounds > 1;
    if (this.phase === "ready") this.ev("round", { n: this.round, final: this.finalRound });
  }
  skipIntro() { if (this.phase === "intro") this.pt = this.opts.intro; }

  // Advance the fight by one frame. in0/in1 are input objects (see blankInput).
  step(in0, in1) {
    this.events.length = 0; this.frame++;
    const [a, b] = this.f;
    if (this.phase === "over") return;
    if (this.phase !== "fight") { this._phase(); return; }
    if (this.freeze > 0) { this.freeze--; this._read(a, in0); this._read(b, in1); return; }
    if (this.cine) { this._cine(); return; }
    if (this.trans) { this._trans(); return; }
    this._read(a, in0); this._read(b, in1);
    if (this.hitstop > 0) { this.hitstop--; return; }
    this._state(a, in0, b); this._state(b, in1, a);
    this._physics(a, b);
    this._projectiles();
    this._hits(a, b);
    this._face(a, b); this._face(b, a);
    this._upkeep(a, b); this._upkeep(b, a);
    if (this.training) this._refill();
    if (this.timer > 0 && this.opts.time > 0 && !this.cine && !this.trans) { this.timer--; if (this.timer === 0) this._timeUp(); }
    if (this.phase === "fight" && !this.cine && !this.trans && (a.hp <= 0 || b.hp <= 0)) this._ko();
  }

  _refill() {
    for (const f of this.f) {
      if (this.training.infHp && f.state !== "hstun" && f.state !== "launch" && f.state !== "frozen" && f.hp < f.def.hp) {
        const o = this.f[1 - f.idx]; if (o.combo === 0) f.hp = f.def.hp;
      }
      if (this.training.infHp && f.hp < 1) f.hp = 1;
      if (this.training.infMeter) f.meter = 100;
    }
  }

  // ---------- round flow ----------
  _phase() {
    const [a, b] = this.f; this.pt++;
    if (this.phase === "intro") {
      if (this.pt >= this.opts.intro) { this.phase = "ready"; this.pt = 0; this.ev("round", { n: this.round, final: this.finalRound }); }
      return;
    }
    if (this.phase === "ready") {
      if (this.pt === 70) this.ev("fight");
      if (this.pt >= 100) { this.phase = "fight"; this.pt = 0; }
      return;
    }
    // "ko" and "outro": keep bodies moving so the loser finishes falling
    const blank = blankInput();
    this._state(a, blank, b); this._state(b, blank, a); this._physics(a, b);
    for (const p of this.projs) p.life = 0; this.projs.length = 0;
    if (this.phase === "ko") {
      if (this.pt >= 110) {
        this.phase = "outro"; this.pt = 0;
        const w = this.roundWinner;
        if (w >= 0) {
          this.f[w].wins++;
          if (this.f[w].grounded) { this.f[w].state = "win"; this.f[w].st = 0; this.f[w].move = null; this.f[w].vx = 0; }
          this.ev("roundWin", { who: w, perfect: this.f[w].hp >= this.f[w].def.hp, wins: this.f[w].wins });
        } else this.ev("draw");
      }
      return;
    }
    if (this.phase === "outro") {
      const w = this.roundWinner;
      if (w >= 0 && this.f[w].state !== "win" && this.f[w].grounded && this.pt > 10) { this.f[w].state = "win"; this.f[w].st = 0; this.f[w].move = null; }
      if (this.pt >= 170) {
        if (w >= 0 && this.f[w].wins >= this.opts.rounds) { this.phase = "over"; this.winner = w; this.ev("matchEnd", { who: w }); }
        else if (this.round >= this.opts.rounds * 2 + 2) { // too many drawn rounds: more health left wins
          this.winner = a.wins >= b.wins ? 0 : 1; this.phase = "over"; this.ev("matchEnd", { who: this.winner });
        } else this.startRound();
      }
    }
  }
  _ko() {
    const [a, b] = this.f;
    this.roundWinner = a.hp <= 0 && b.hp <= 0 ? -1 : a.hp <= 0 ? 1 : 0;
    for (const f of this.f) if (f.hp <= 0) { f.hp = 0; f.koed = true; if (f.state !== "launch") { f.state = "launch"; f.vy = 0.2; f.vx = -f.facing * 0.1; f.y = Math.max(f.y, 0.02); } f.move = null; }
    this.phase = "ko"; this.pt = 0;
    this.ev("ko", { who: this.roundWinner });
  }
  _timeUp() {
    const [a, b] = this.f, ra = a.hp / a.def.hp, rb = b.hp / b.def.hp;
    this.roundWinner = Math.abs(ra - rb) < 0.001 ? -1 : ra > rb ? 0 : 1;
    this.phase = "ko"; this.pt = 40;
    for (const f of this.f) { if (f.idx !== this.roundWinner && f.grounded) { f.state = "lose"; f.st = 0; f.move = null; f.vx = 0; } }
    this.ev("timeUp", { who: this.roundWinner });
  }

  // ---------- input ----------
  _read(f, inp) {
    for (const b of BTN) if (inp[b] && !f.prev[b]) f.buf[b] = this.frame;
    if (inp.lp && inp.lk && (this.frame - f.buf.lp <= 3 && this.frame - f.buf.lk <= 3)) { f.buf.thr = this.frame; f.buf.lp = f.buf.lk = -99; }
    if (inp.blk && !f.prev.blk) {
      // a fresh block press opens the counter window, but mashing does not
      f.parryOK = this.frame - f.lastBlkPress > 26; f.lastBlkPress = this.frame;
    }
    Object.assign(f.prev, inp);
  }
  _pressed(f, b) { return this.frame - f.buf[b] <= BUF; }
  _use(f, b) { f.buf[b] = -99; }

  // ---------- per-fighter state machine ----------
  _state(f, inp, o) {
    f.st++;
    const d = f.def;
    const fwd = f.facing > 0 ? inp.r : inp.l, back = f.facing > 0 ? inp.l : inp.r;
    f.blkHeld = inp.blk;
    switch (f.state) {
      case "idle": case "walk": case "crouch": case "block": this._neutral(f, inp, o, fwd, back); break;
      case "air": {
        if (this._pressed(f, "u") && f.airJumps < (d.airJumps || 0) && f.st > 6) {
          this._use(f, "u"); f.airJumps++; f.vy = d.jumpV * 0.92; f.vx = (inp.r ? 1 : inp.l ? -1 : 0) * d.jumpX; this.ev("jump", { who: f.idx, air: true });
        } else if (this._pressed(f, "u") && d.wallJump && Math.abs(f.x) > STAGE - 0.5 && f.st > 4) {
          this._use(f, "u"); f.vy = d.jumpV; f.vx = -Math.sign(f.x) * d.jumpX * 1.6; f.airActs = 0; this.ev("jump", { who: f.idx, wall: true });
        } else if (this._pressed(f, "dash") && d.airDash && !f.airDashed) {
          this._use(f, "dash"); f.airDashed = true; f.vx = (back ? -1 : 1) * f.facing * d.dashV * 0.9; f.vy = 0.04; this.ev("dash", { who: f.idx, air: true });
        } else if (f.airActs < 2) {
          const id = this._pick(f, inp, "air", fwd, back);
          if (id) { f.airActs += d.moves[id].tier >= 3 ? 2 : 1; this._start(f, id); }
        }
        break;
      }
      case "atk": this._attack(f, inp, o, fwd, back); break;
      case "dash": {
        if (f.st <= 3 && f.dashDir > 0) { /* brief start */ }
        if (f.dashDir > 0 && f.st >= 3) {
          for (const b of ["hp", "hk", "lp", "lk"]) if (this._pressed(f, b)) { this._use(f, b); this._start(f, "dashAtk"); return; }
        }
        if (f.st >= d.dashLen) { f.state = "idle"; f.st = 0; f.vx *= 0.4; }
        break;
      }
      case "dodge": if (f.st >= 24) { f.state = "idle"; f.st = 0; } break;
      case "lag": if (--f.lag <= 0) { f.state = f.grounded ? "idle" : "air"; f.st = 0; } break;
      case "bstun":
        f.low = inp.blk ? inp.d : f.low;
        if (--f.stun <= 0) { f.state = "idle"; f.st = 0; }
        break;
      case "hstun": case "stagger": case "frozen":
        if (f.state !== "stagger" && this._breaker(f, o)) break;
        if (--f.stun <= 0) { f.state = "idle"; f.st = 0; }
        break;
      case "launch": this._breaker(f, o); break;
      case "kd":
        if (f.koed) { f.state = "ko"; break; }
        if (!f.hardKd && f.st < 12 && f.stun > 8 && (this._pressed(f, "lp") || this._pressed(f, "lk") || this._pressed(f, "hp") || this._pressed(f, "hk") || this._pressed(f, "u"))) { f.stun = 8; this.ev("quickRise", { who: f.idx }); }
        if (--f.stun <= 0) { f.state = "getup"; f.st = 0; f.getupDir = back ? -1 : fwd ? 1 : 0; }
        break;
      case "getup":
        if (f.getupDir) f.vx = f.facing * f.getupDir * 0.07;   // roll forward or back while rising
        if (f.st >= 18) { f.state = "idle"; f.st = 0; f.thrInv = 10; f.inv = 6; f.jugSafe = false; f.juggle = 0; f.hardKd = false; }
        break;
      case "throwing":
        if (f.st === 18 && o.state === "thrown") this._throwHit(f, o);
        if (f.st >= 40) { f.state = "idle"; f.st = 0; }
        break;
      case "thrown":
        if (f.st <= 12 && this._pressed(f, "thr")) {
          this._use(f, "thr");
          for (const p of [f, o]) { p.state = "lag"; p.lag = 16; p.st = 0; p.move = null; }
          f.vx = o.facing * 0.13; o.vx = -o.facing * 0.13;
          this.ev("tech", { x: (f.x + o.x) / 2, y: 1.1 });
        } else if (o.state !== "throwing") { f.state = "idle"; f.st = 0; }
        else { f.x = clamp(o.x + o.facing * 0.62, -STAGE, STAGE); f.y = 0; f.vx = f.vy = 0; }
        break;
      case "win": case "lose": case "ko": case "cine": f.vx = 0; break;
    }
  }

  _neutral(f, inp, o, fwd, back) {
    const d = f.def;
    if (!f.grounded) { f.state = "air"; return; }
    // 1) attacks / specials / throws
    const id = this._pick(f, inp, "ground", fwd, back);
    if (id) { f.str = []; this._start(f, id); return; }
    // 2) dash / dodge
    if (this._pressed(f, "dash")) {
      this._use(f, "dash");
      if (fwd || back) { f.state = "dash"; f.st = 0; f.dashDir = fwd ? 1 : -1; f.vx = f.facing * f.dashDir * d.dashV * (back ? 0.85 : 1); this.ev("dash", { who: f.idx }); return; }
      if (f.stamina >= DODGE_COST) { f.state = "dodge"; f.st = 0; f.vx = 0; f.stamina -= DODGE_COST; f.stamCd = 50; this.ev("dodge", { who: f.idx }); return; }
    }
    // 3) block
    if (inp.blk) {
      if (f.state !== "block") { f.state = "block"; f.st = 0; f.parryT = f.parryOK ? PARRY_WIN : 0; }
      f.low = inp.d; f.vx = 0; return;
    }
    // 4) jump
    if (inp.u) {
      this._use(f, "u");
      f.state = "air"; f.st = 0; f.vy = d.jumpV; f.vx = (inp.r ? 1 : inp.l ? -1 : 0) * d.jumpX; f.y = 0.001;
      f.airActs = 0; f.airJumps = 0; f.airDashed = false; this.ev("jump", { who: f.idx }); return;
    }
    // 5) crouch / walk
    if (inp.d) { if (f.state !== "crouch") { f.state = "crouch"; f.st = 0; } f.vx = 0; return; }
    const dir = inp.r ? 1 : inp.l ? -1 : 0;
    if (dir) {
      if (f.state !== "walk") { f.state = "walk"; f.st = 0; }
      const sp = d.walk * (dir === f.facing ? 1 : 0.8) * (f.slowT > 0 ? 0.55 : 1) * (f.buffT > 0 ? 1.4 : 1);
      f.vx = dir * sp;
    } else { if (f.state !== "idle") { f.state = "idle"; f.st = 0; } f.vx = 0; }
  }

  // Which move do the remembered button presses ask for?  ctx: ground | air | cancel
  _pick(f, inp, ctx, fwd, back) {
    const d = f.def, M = d.moves, air = ctx === "air" || (ctx === "cancel" && !f.grounded);
    if (this._pressed(f, "ult") && f.meter >= 100 && !air && M.ult) {
      if (ctx !== "cancel" || f.hitConn) { this._use(f, "ult"); return "ult"; }
    }
    if (this._pressed(f, "sp")) {
      let id = inp.blk && M.sp5 ? "sp5" : inp.d ? "sp3" : fwd ? "sp2" : back ? "sp4" : "sp1";
      let m = M[id];
      if (m && air && !m.air) { id = null; for (const k of ["sp1", "sp2", "sp3", "sp4"]) if (M[k] && M[k].air) { id = k; break; } m = id && M[id]; }
      if (m && !air && m.airOnly) m = null;
      if (m && (ctx !== "cancel" || this._canCancel(f, m))) { this._use(f, "sp"); return id; }
    }
    if (!air && ctx !== "cancel" && this._pressed(f, "thr") && M.throw) { this._use(f, "thr"); return "throw"; }
    for (const b of ["hk", "hp", "lk", "lp"]) {
      if (!this._pressed(f, b)) continue;
      const id = (air ? "j" : inp.d ? "2" : "5") + NAME[b];
      const m = M[id]; if (!m) continue;
      if (ctx === "cancel" && !this._canCancel(f, m)) continue;
      this._use(f, b); return id;
    }
    return null;
  }
  // Combo rules: light -> light -> heavy -> special -> ultimate, plus each fighter's own links.
  _canCancel(f, m) {
    const cur = f.move;
    if (!cur || !f.hitConn) return false;
    if (cur.tier >= 3) return false;
    if (m.tier >= 3) return true;
    const used = f.str.filter((x) => x === m.id).length;
    if (used >= (m.tier === 1 && m.id === "5LP" ? 2 : 1)) return false;
    if (f.str.length >= 5) return false;
    if (m.tier > cur.tier) return true;
    if (m.tier === 1 && cur.tier === 1) return true;
    const links = f.def.links && f.def.links[cur.id];
    return !!(links && links.includes(m.id));
  }
  _start(f, id) {
    const m = f.def.moves[id];
    f.state = "atk"; f.st = 0; f.move = m; f.mt = 0; f.hitN = 0; f.hitConn = false; f.lastHit = -99;
    f.chargeT = 0; f.charged = false; f.str.push(id); f.moveSeq++; f.airStart = !f.grounded;
    if (f.grounded && !m.keepV) f.vx = 0;
    if (m.tier >= 3) f.stats.specials++;
    if (m.tier === 4) { f.meter = 0; f.stats.ults++; this.freeze = this.opts.cine === "short" ? 12 : 34; this.ev("ultStart", { who: f.idx }); }
    else this.ev("move", { who: f.idx, id, el: m.el, tier: m.tier });
  }

  _attack(f, inp, o, fwd, back) {
    const m = f.move, total = m.s + m.a + m.r;
    // hold the heavy button to charge it up
    if (m.charge && f.mt === m.s - 1 && inp[m.charge] && f.chargeT < 32) {
      f.chargeT++; if (f.chargeT === 16) { f.charged = true; this.ev("charge", { who: f.idx }); }
      return;
    }
    f.mt++;
    const t = f.mt;
    if (m.mv && t >= (m.mv[2] || 0) && t < (m.mv[3] || m.s + m.a)) { f.vx = f.facing * m.mv[0]; if (m.mv[1]) f.vy = m.mv[1]; if (m.mv[1] > 0 && f.grounded) f.y = 0.001; }
    if (m.mv && t === (m.mv[3] || m.s + m.a)) f.vx *= 0.25;
    if (m.hop && t === m.hop[2]) { f.vy = m.hop[1]; f.vx = f.facing * m.hop[0]; f.y = Math.max(f.y, 0.001); }
    if (m.tele && t === m.tele.t) {
      const side = Math.sign(o.x - f.x) || f.facing;
      let nx = m.tele.to === "behind" ? o.x + side * 0.95 : m.tele.to === "front" ? o.x - side * 1.0 : m.tele.to === "above" ? o.x - side * 0.2 : f.x - side * m.tele.to;
      if (Math.abs(nx) > STAGE) nx = m.tele.to === "behind" ? o.x - side * 0.95 : clamp(nx, -STAGE, STAGE);
      f.x = nx; if (m.tele.to === "above") { f.y = 2.3; f.vy = 0; }
      f.facing = Math.sign(o.x - f.x) || f.facing;
      this.ev("tele", { who: f.idx, x: f.x, y: f.y + 1, el: m.el });
    }
    if (m.proj) for (const p of m.proj) if (p.t === t) this._spawn(f, o, p, m);
    if (m.buff && t === m.s) {
      if (m.buff === "haste") f.buffT = m.buffT || 300;
      if (m.buff === "shield") f.shield = m.buffT || 150;
      this.ev("buff", { who: f.idx, kind: m.buff, el: m.el });
    }
    // cancel into the next hit of a combo
    if (f.hitConn && t >= m.s + 1 && t < total - 1) {
      const id = this._pick(f, inp, "cancel", fwd, back);
      if (id) { this._start(f, id); return; }
    }
    if (m.jc && f.hitConn && inp.u && t >= m.s + 2 && f.grounded) { // jump after a launcher to keep the combo going
      f.move = null; f.state = "air"; f.st = 0; f.vy = f.def.jumpV; f.vx = f.facing * f.def.jumpX; f.y = 0.001; f.airActs = 0; f.airJumps = 0; f.airDashed = false;
      this.ev("jump", { who: f.idx }); return;
    }
    if (m.air && f.airStart && f.grounded && t > 2) { f.state = "lag"; f.lag = m.landR || 4; f.move = null; return; }
    if (t >= total) {
      f.move = null; f.charged = false;
      if (f.grounded) { f.state = "idle"; f.st = 0; } else { f.state = "air"; }
    }
  }

  _breaker(f, o) {
    if (!this._pressed(f, "dash") || f.stamina < BREAKER_COST || o.combo < 2 || f.breakCd > 0 || f.koed) return false;
    this._use(f, "dash");
    f.stamina -= BREAKER_COST; f.stamCd = 90; f.breakCd = 240; f.stats.breakers++;
    f.state = f.grounded ? "lag" : "air"; f.lag = 10; f.inv = 24; f.vx = 0; if (!f.grounded) f.vy = 0.1;
    f.jugSafe = false; f.juggle = 0;
    if (o.state !== "cine") { o.state = "stagger"; o.stun = 26; o.move = null; o.vx = -o.facing * 0.2; }
    this.hitstop = 8;
    this.ev("breaker", { who: f.idx, x: f.x, y: f.y + 1 });
    return true;
  }

  // ---------- movement ----------
  _physics(a, b) {
    for (const f of [a, b]) {
      if (f.state === "thrown" || f.state === "cine") continue;
      if (!f.grounded || f.vy > 0) {
        const g = f.state === "launch" ? GRAV * (0.82 + 0.16 * f.juggle) * f.def.weight : GRAV * (f.state === "atk" && f.move && f.move.float ? 0.25 : 1);
        f.vy -= g; f.y += f.vy;
        if (f.y <= 0) {
          f.y = 0; f.vy = 0;
          if (f.state === "launch") { f.state = "kd"; f.st = 0; f.stun = f.hardKd ? 44 : 30; f.vx *= 0.3; this.ev("knockdown", { who: f.idx, x: f.x }); }
          else if (f.state === "air") { f.state = "idle"; f.st = 0; f.vx = 0; this.ev("land", { who: f.idx }); }
        }
      }
      f.x += f.vx;
      // friction for knockback / dash drift
      if (f.grounded) {
        if (f.slide > 0) f.slide--;
        else if (["hstun", "bstun", "stagger", "lag", "kd", "atk", "frozen", "getup", "dodge", "ko"].includes(f.state)) f.vx *= f.state === "atk" && f.move && f.move.mv && f.mt < (f.move.mv[3] || f.move.s + f.move.a) ? 1 : 0.82;
      }
      if (f.x > STAGE) { f.x = STAGE; if (f.state === "launch") f.vx *= -0.3; }
      if (f.x < -STAGE) { f.x = -STAGE; if (f.state === "launch") f.vx *= -0.3; }
    }
    // fighters cannot stand inside each other
    const thru = (f) => f.state === "dodge" || f.state === "thrown" || f.state === "throwing" || f.state === "cine" || f.state === "kd" || f.state === "ko" || (f.state === "atk" && f.move && f.move.thru);
    if (!thru(a) && !thru(b) && Math.abs(a.y - b.y) < 1.0) {
      const min = a.def.width + b.def.width, dx = b.x - a.x;
      if (Math.abs(dx) < min) {
        const s = dx === 0 ? (a.facing > 0 ? 1 : -1) : Math.sign(dx), push = (min - Math.abs(dx)) / 2;
        a.x -= s * push; b.x += s * push;
        if (a.x < -STAGE) { b.x += -STAGE - a.x; a.x = -STAGE; } if (a.x > STAGE) { b.x -= a.x - STAGE; a.x = STAGE; }
        if (b.x < -STAGE) { a.x += -STAGE - b.x; b.x = -STAGE; } if (b.x > STAGE) { a.x -= b.x - STAGE; b.x = STAGE; }
        a.x = clamp(a.x, -STAGE, STAGE); b.x = clamp(b.x, -STAGE, STAGE);
      }
    }
  }
  _face(f, o) {
    if (["idle", "walk", "crouch", "block", "getup"].includes(f.state) && f.grounded && Math.abs(o.x - f.x) > 0.05) f.facing = o.x > f.x ? 1 : -1;
  }
  _upkeep(f, o) {
    if (f.inv > 0) f.inv--; if (f.thrInv > 0) f.thrInv--; if (f.parryT > 0) f.parryT--;
    if (f.shield > 0) f.shield--; if (f.buffT > 0) f.buffT--; if (f.slowT > 0) f.slowT--; if (f.breakCd > 0) f.breakCd--;
    if (f.stamCd > 0) f.stamCd--; else if (f.stamina < 100 && f.state !== "block" && f.state !== "bstun") f.stamina = Math.min(100, f.stamina + 0.3);
    // my combo ends when the other fighter is back on their feet
    if (f.combo > 0 && !["hstun", "launch", "frozen", "kd", "thrown", "cine", "stagger"].includes(o.state)) {
      if (f.combo > 1) this.ev("comboEnd", { who: f.idx, n: f.combo, dmg: f.comboDmg });
      f.combo = 0; f.scale = 1; f.use = {}; f.comboDmg = 0; o.frozeInCombo = false;
    }
    f.stats.lowestHp = Math.min(f.stats.lowestHp, f.hp / f.def.hp);
  }

  // ---------- projectiles ----------
  _spawn(f, o, p, m) {
    if (this.projs.filter((q) => q.owner === f.idx).length >= 5) return;
    const q = Object.assign({}, p);
    q.owner = f.idx; q.dir = f.facing;
    q.x = p.at === "opp" ? clamp(o.x + (p.x || 0) * f.facing, -STAGE, STAGE) : f.x + f.facing * (p.x || 0.6);
    q.y = (p.at === "opp" ? 0 : f.y) + (p.y === undefined ? 1.1 : p.y);
    q.vx = (p.vx || 0) * f.facing; q.vy = p.vy || 0; q.g = p.g || 0;
    q.w = p.w || 0.5; q.h = p.h || 0.4; q.life = p.life || 120; q.arm = p.arm || 0; q.pierce = p.pierce || 1; q.cool = 0;
    q.id = m.id + "p"; q.tier = 3; q.el = p.el || m.el; q.age = 0;
    q.charged = false;
    this.projs.push(q);
    this.ev("proj", { who: f.idx, x: q.x, y: q.y, el: q.el, shape: q.shape });
  }
  _projectiles() {
    const P = this.projs;
    for (const p of P) {
      p.age++; p.life--;
      if (p.arm > 0) { p.arm--; continue; }
      if (p.homing) { const o = this.f[1 - p.owner]; p.vy += clamp((o.y + 1 - p.y) * p.homing, -0.01, 0.01); }
      p.vy -= p.g; p.x += p.vx; p.y += p.vy;
      if (p.cool > 0) p.cool--;
      if (p.g && p.y <= 0.1) { if (p.bounce) { p.y = 0.1; p.vy = Math.abs(p.vy) * 0.6; p.bounce--; } else p.life = 0; }
      if (Math.abs(p.x) > STAGE + 2.5) p.life = 0;
    }
    // two projectiles that meet cancel each other out
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const p = P[i], q = P[j];
      if (p.owner === q.owner || p.life <= 0 || q.life <= 0 || p.arm > 0 || q.arm > 0 || p.noClash || q.noClash) continue;
      if (Math.abs(p.x - q.x) < (p.w + q.w) / 2 && Math.abs(p.y - q.y) < (p.h + q.h) / 2) {
        if (!p.strong || q.strong) p.life = 0; if (!q.strong || p.strong) q.life = 0;
        this.ev("clash", { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
      }
    }
    for (let i = P.length - 1; i >= 0; i--) if (P[i].life <= 0) P.splice(i, 1);
  }

  // ---------- hit detection ----------
  _hits(a, b) {
    // throws first
    for (const [f, o] of [[a, b], [b, a]]) {
      const m = f.move;
      if (f.state !== "atk" || !m || m.type !== "throw" || f.hitConn) continue;
      if (f.mt < m.s || f.mt >= m.s + m.a) continue;
      const okState = ["idle", "walk", "crouch", "block", "dash", "lag", "atk"].includes(o.state);
      if (!okState || !o.grounded || o.thrInv > 0 || o.inv > 0 || Math.abs(o.x - f.x) > m.range + o.def.width) continue;
      if (o.state === "atk" && o.move.type === "throw" && o.mt >= o.move.s - 2) { // both grabbed: nobody wins
        for (const p of [f, o]) { p.state = "lag"; p.lag = 16; p.move = null; p.vx = -p.facing * 0.13; }
        this.ev("tech", { x: (f.x + o.x) / 2, y: 1.1 }); continue;
      }
      if (o.state === "atk" && o.move.inv && o.mt >= o.move.inv[0] && o.mt < o.move.inv[1]) continue;
      f.hitConn = true; f.state = "throwing"; f.st = 0; f.vx = 0; f.move = m;
      const back = f.facing > 0 ? f.prev.l : f.prev.r; f.throwDir = back ? -1 : 1;
      o.state = "thrown"; o.st = 0; o.move = null; o.vx = 0; o.buf.thr = -99;
      this.ev("grab", { who: f.idx, x: (f.x + o.x) / 2, y: 1.1 });
    }
    // strikes: work out both sides first so two attacks can trade
    const pend = [];
    for (const [f, o] of [[a, b], [b, a]]) {
      const m = f.move, hb = f.hitbox();
      if (!hb || m.type === "throw" || m.type === "counter") continue;
      const hits = m.hits || 1;
      if (f.hitN >= hits || f.mt - f.lastHit < (m.gap || 99) && f.hitN > 0) continue;
      if (!overlap(hb, o.hurt())) continue;
      pend.push({ f, o, m });
    }
    if (pend.length === 2) { // attack priority: the stronger kind of move wins a clash
      const p0 = pend[0].m.prio || pend[0].m.tier, p1 = pend[1].m.prio || pend[1].m.tier;
      if (p0 > p1) pend.pop(); else if (p1 > p0) pend.shift();
    }
    for (const h of pend) {
      if (h.f.state !== "atk" && pend.length === 2) { /* already hit by the trade: still lands */ }
      const r = this._hit(h.f, h.o, h.m, { dir: h.f.facing, x: h.o.x - h.f.facing * 0.3, y: h.f.y + h.m.box[1] + h.m.box[3] / 2 });
      if (r) { h.f.hitN++; h.f.lastHit = h.f.mt; if (r !== "miss") h.f.hitConn = true; }
    }
    // projectiles
    for (const p of this.projs) {
      if (p.arm > 0 || p.cool > 0 || p.life <= 0) continue;
      const o = this.f[1 - p.owner], own = this.f[p.owner];
      const box = [p.x - p.w / 2, p.y - p.h / 2, p.x + p.w / 2, p.y + p.h / 2];
      if (!overlap(box, o.hurt())) continue;
      const r = this._hit(own, o, p, { proj: true, dir: p.vx ? Math.sign(p.vx) : (Math.sign(o.x - own.x) || 1), x: clamp(p.x, o.x - 0.3, o.x + 0.3), y: clamp(p.y, o.y + 0.3, o.y + 1.6) });
      if (r) { p.pierce--; p.cool = p.gap || 10; if (p.pierce <= 0) p.life = 0; }
    }
  }

  // One attack touching one fighter. Returns "hit" | "block" | "parry" | "absorb" | "counter" | null (no contact).
  _hit(a, d, m, o) {
    const dir = o.dir, proj = !!o.proj;
    if (d.inv > 0 || d.jugSafe || ["getup", "thrown", "throwing", "cine", "ko", "win"].includes(d.state)) return null;
    if (d.state === "kd" && !m.otg) return null;
    if (d.state === "dodge" && d.st >= 3 && d.st <= 17 && m.tier < 4) return null;
    if (d.state === "atk" && d.move.inv && d.mt >= d.move.inv[0] && d.mt < d.move.inv[1]) return null;
    if (proj && d.state === "atk" && d.move.projInv) return null;
    if (m.groundOnly && !d.grounded) return null;

    if (d.shield > 0 && m.tier < 4) {
      d.shield = 0; if (!proj) { a.vx = -a.facing * 0.16; }
      this.hitstop = 5; this.ev("absorb", { who: d.idx, x: o.x, y: o.y });
      return "absorb";
    }
    if (d.state === "atk" && d.move.type === "counter" && d.mt >= d.move.s && d.mt < d.move.s + d.move.a && m.tier < 4 && (!proj || d.move.reflect)) {
      const cm = d.move;
      d.state = "lag"; d.lag = cm.retLag || 18; d.inv = 14; d.move = null; d.stats.counters++;
      this.ev("counter", { who: d.idx, x: o.x, y: o.y, el: cm.el });
      if (!proj) { if (cm.ret.tele) { d.x = clamp(a.x + a.facing * -0.9, -STAGE, STAGE); d.facing = Math.sign(a.x - d.x) || d.facing; } this._hit(d, a, cm.ret, { dir: Math.sign(a.x - d.x) || d.facing, x: a.x, y: a.y + 1.1 }); }
      return "counter";
    }

    const blocking = (d.state === "block" || d.state === "bstun") && d.blkHeld && !m.unblock &&
      (m.lvl === "low" ? d.low : m.lvl === "over" ? !d.low : true);
    if (blocking) {
      if (d.state === "block" && d.parryT > 0 && m.tier < 4) {   // perfectly timed block = counter
        d.parryT = 0; d.meter = Math.min(100, d.meter + 8); d.stamina = Math.min(100, d.stamina + 15); d.stats.counters++;
        d.state = "idle"; d.st = 0;
        if (!proj) { a.state = "stagger"; a.stun = 36; a.move = null; a.vx = -a.facing * 0.06; a.charged = false; }
        this.hitstop = 10; this.ev("parry", { who: d.idx, x: o.x, y: o.y });
        return "parry";
      }
      const base = m.dmg * a.def.power;
      const chip = m.tier >= 3 ? base * 0.12 : 0;
      d.hp = Math.max(1, d.hp - chip);
      d.stamina -= (m.gd !== undefined ? m.gd : m.dmg * 1.1) * (a.charged ? 4 : 1); d.stamCd = 60;
      d.stats.blocks++;
      a.meter = Math.min(100, a.meter + m.dmg * 0.25); d.meter = Math.min(100, d.meter + m.dmg * 0.15);
      if (d.stamina <= 0) {
        d.stamina = 40; d.state = "stagger"; d.stun = 55; d.vx = dir * 0.05;
        this.hitstop = 10; this.ev("guardBreak", { who: d.idx, x: o.x, y: o.y });
      } else {
        d.state = "bstun"; d.stun = m.bs || 10; d.vx = dir * (m.kb || 0.06) * 0.8;
        this.hitstop = 3; this.ev("block", { who: d.idx, x: o.x, y: o.y, heavy: m.tier >= 2 });
      }
      if (!proj && Math.abs(d.x) > STAGE - 0.1) a.vx = -a.facing * 0.09;
      return "block";
    }

    const armored = d.state === "atk" && d.move.armor && d.mt >= d.move.armor[0] && d.mt < d.move.armor[1] && m.tier < 4;
    const counterHit = d.state === "atk" && d.move && d.mt < d.move.s + d.move.a;
    const inCombo = ["hstun", "launch", "frozen"].includes(d.state);
    if (!inCombo) { a.combo = 0; a.use = {}; a.comboDmg = 0; }
    a.combo++;
    a.scale = a.combo === 1 ? 1 : Math.max(0.35, Math.pow(0.88, a.combo - 1));
    a.use[m.id] = (a.use[m.id] || 0) + 1;
    const forceEnd = a.use[m.id] >= 3 || a.combo >= COMBO_MAX;
    a.stats.maxCombo = Math.max(a.stats.maxCombo, a.combo);

    if (m.tier === 4) { a.hitConn = true; this._startCine(a, d, m); return "hit"; }

    const charged = !proj && a.charged;
    let dmg = m.dmg * a.def.power * a.scale * (counterHit ? 1.2 : 1) * (charged ? 1.5 : 1) * (armored ? 0.7 : 1);
    this._damage(a, d, dmg);
    this.hitstop = charged ? 12 : m.tier >= 3 ? 9 : m.tier === 2 ? 8 : 5;
    const str = charged || m.tier >= 3 ? 2 : m.tier === 2 ? 1 : 0;
    this.ev("hit", { who: a.idx, x: o.x, y: o.y, str, el: m.el, ch: counterHit && !inCombo, combo: a.combo, dmg, proj });
    if (armored && d.hp > 0) { this.ev("armor", { who: d.idx }); return "hit"; }

    const airborne = !d.grounded || d.state === "launch";
    if (d.state === "launch") d.juggle++;
    d.move = null; d.charged = false; d.hitHigh = o.y - d.y > 0.9; d.st = 0;
    const kb = (m.kb || 0.05) * (charged ? 1.6 : 1);
    if (m.eff === "freeze" && !d.frozeInCombo && !airborne && d.hp > 0) {
      d.state = "frozen"; d.stun = 56; d.frozeInCombo = true; d.vx = 0; this.ev("freeze", { who: d.idx });
    } else if (airborne || m.launch || m.kd || d.hp <= 0 || forceEnd) {
      d.state = "launch";
      d.vy = m.launch ? m.launch * Math.pow(0.9, d.juggle) : airborne ? 0.13 : 0.11;
      d.vx = dir * kb; d.y = Math.max(d.y, 0.02);
      d.hardKd = !!m.kd || forceEnd;
      if (d.juggle >= JUG_MAX || forceEnd) d.jugSafe = true;
    } else {
      d.state = "hstun";
      d.stun = Math.round(m.hs * Math.max(0.55, 1 - 0.05 * (a.combo - 1))) + (counterHit ? 5 : 0);
      d.vx = dir * kb;
    }
    if (m.eff === "slow") d.slowT = 150;
    if (m.eff === "pull" && d.state === "hstun") { const gap = Math.abs(d.x - a.x) - 1.0; if (gap > 0) { d.vx = -dir * gap / 12; d.slide = 12; d.stun = Math.max(d.stun, 30); } }
    if (!proj && Math.abs(d.x) > STAGE - 0.1) a.vx = -a.facing * kb * 0.8;

    // arena transition: a heavy knockback into the breakable edge
    if (this.opts.transitions && (m.wb || charged) && d.hp > 0 && !this.transUsed[this.zone] && !proj) {
      const edge = this.zone === 0 ? 1 : -1;
      if (dir === edge && d.x * edge > STAGE - 1.6) this._startTrans(a, d);
    }
    return "hit";
  }
  _damage(a, d, dmg) {
    d.hp -= dmg; a.stats.dmg += dmg; a.stats.hits++; d.stats.taken += dmg; a.comboDmg += dmg;
    const m0 = a.meter, d0 = d.meter;
    a.meter = Math.min(100, a.meter + dmg * 0.62 * (a.buffT > 0 ? 1.3 : 1)); d.meter = Math.min(100, d.meter + dmg * 0.4);
    if (m0 < 100 && a.meter >= 100) this.ev("meterFull", { who: a.idx });
    if (d0 < 100 && d.meter >= 100) this.ev("meterFull", { who: d.idx });
  }
  _throwHit(a, d) {
    const m = a.move;
    a.combo = 1; a.scale = 1; a.use = {}; a.comboDmg = 0; a.stats.throws++;
    this._damage(a, d, m.dmg * a.def.power);
    if (a.throwDir < 0) { d.x = clamp(a.x - a.facing * 0.5, -STAGE, STAGE); }
    d.state = "launch"; d.st = 0; d.y = 0.3; d.vy = 0.2; d.vx = a.facing * a.throwDir * 0.15; d.hardKd = true; d.jugSafe = true;
    this.hitstop = 8;
    this.ev("throw", { who: a.idx, x: d.x, y: 1.0, el: m.el });
  }

  // ---------- ultimate move cinematic ----------
  _startCine(a, d, m) {
    const k = this.opts.cine === "short" ? 0.3 : 1;
    this.cine = { att: a.idx, t: 0, len: Math.round(m.cine.len * k), k, beats: m.cine.beats, scale: Math.max(0.6, a.scale), total: m.dmg * a.def.power, x: clamp((a.x + d.x) / 2, -STAGE + 2, STAGE - 2) };
    for (const f of [a, d]) { f.state = "cine"; f.st = 0; f.move = f === a ? m : null; f.vx = f.vy = 0; f.y = 0; }
    this.projs.length = 0;
    this.ev("cineStart", { who: a.idx, len: this.cine.len });
  }
  _cine() {
    const c = this.cine, a = this.f[c.att], d = this.f[1 - c.att];
    c.t++; a.st++; d.st++;
    const sum = c.beats.reduce((s, b) => s + b.w, 0);
    for (const b of c.beats) if (Math.round(b.t * c.k) === c.t) {
      const last = b === c.beats[c.beats.length - 1];
      const dmg = c.total * c.scale * b.w / sum;
      this._damage(a, d, dmg);
      if (!last && d.hp < 1) d.hp = 1;
      this.ev("cineBeat", { who: a.idx, last, x: d.x, y: 1.1, i: c.beats.indexOf(b) });
    }
    if (c.t >= c.len) {
      this.cine = null;
      const side = a.facing;
      a.x = clamp(c.x - side * 1.2, -STAGE, STAGE); d.x = clamp(c.x + side * 1.6, -STAGE, STAGE);
      a.state = "idle"; a.st = 0; a.move = null; a.y = 0;
      d.state = "launch"; d.y = 0.4; d.vy = 0.12; d.vx = side * 0.12; d.hardKd = true; d.jugSafe = true; d.st = 0;
      this.ev("cineEnd", { who: a.idx });
    }
  }

  // ---------- arena transition ----------
  _startTrans(a, d) {
    this.transUsed[this.zone] = true;
    const len = this.opts.cine === "short" ? 50 : 150;
    this.trans = { att: a.idx, t: 0, len, from: this.zone, dir: this.zone === 0 ? 1 : -1 };
    this.projs.length = 0; a.stats.transitions++;
    for (const f of [a, d]) { f.state = "cine"; f.st = 0; f.move = null; f.vx = f.vy = 0; }
    this.ev("transStart", { who: a.idx, from: this.zone, len });
  }
  _trans() {
    const t = this.trans, a = this.f[t.att], d = this.f[1 - t.att];
    t.t++;
    if (t.t === Math.floor(t.len * 0.5)) {
      this._damage(a, d, 6); if (d.hp < 1) d.hp = 1;
      this.zone = 1 - t.from;
      // arrive on the far side of the new area, attacker still chasing from behind
      d.x = -t.dir * 1.5; a.x = -t.dir * 4.6;
      for (const f of [a, d]) { f.y = 0; f.vx = f.vy = 0; f.move = null; f.charged = false; f.combo = 0; f.use = {}; f.scale = 1; }
      a.facing = t.dir; d.facing = -t.dir;
      this.ev("zone", { zone: this.zone });
    }
    if (t.t >= t.len) {
      this.trans = null;
      a.state = "idle"; a.st = 0;
      d.state = "kd"; d.st = 0; d.stun = 14; d.hardKd = true; d.jugSafe = true; d.juggle = 0;
      this.ev("transEnd", {});
    }
  }
}

// How far in front of a fighter a move reaches (used by the CPU and the training screen).
export function reach(m) {
  if (!m) return 0;
  if (m.type === "throw") return m.range;
  if (m.box) return m.box[0] + m.box[2] + (m.mv ? m.mv[0] * (m.s + m.a) * 0.8 : 0);
  if (m.proj) return 9;
  return 0;
}
