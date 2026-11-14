// Turbo League — match rules (no graphics, so the automated tests can play whole matches in Node).
// Teams, kickoffs, the clock, "ball must touch the ground at 0:00", overtime (next goal wins),
// stats (goals, assists, saves, shots, touches), points and the MVP.
import { World, Ball, V } from "./physics.js";
import { ARENA, BALL, PHYS, MATCH, KICKOFFS } from "./config.js";
import { Bot } from "./ai.js";

export const POINTS = { goal: 100, assist: 50, save: 50, shot: 20, touch: 2 };
const BOT_NAMES = [["Ace", "Bolt", "Sparky", "Rocket"], ["Blaze", "Comet", "Dash", "Zippy"]];
const NOOP = { emit() {} };

// Simulate the ball alone (no cars) to see where it is heading. cb(ball, t) returns true to stop early.
export function simulateBall(src, secs, cb, dt = 1 / 60) {
  const b = new Ball(); b.pos.copy(src.pos); b.vel.copy(src.vel); b.ang.copy(src.ang);
  const n = Math.round(secs / dt);
  for (let i = 1; i <= n; i++) { b.step(dt, NOOP); if (cb(b, i * dt)) return true; }
  return false;
}
// Which goal (0 = Blue's goal at -z, 1 = Orange's goal at +z) the ball will enter within `secs`, or null.
export function goalThreat(ball, secs = 3) {
  let hit = null;
  simulateBall(ball, secs, (b, t) => { if (Math.abs(b.pos.z) > ARENA.hz + BALL.r * 0.5) { hit = { goal: b.pos.z < 0 ? 0 : 1, t }; return true; } return false; });
  return hit;
}

export class Match {
  // opts: { size: players per team, length: seconds (0 = no clock), freePlay, humans: [car indices], blueLevel, orangeLevel, seed, names }
  constructor(opts = {}) {
    this.o = Object.assign({ size: 1, length: MATCH.length, freePlay: false, humans: [0], blueLevel: 2, orangeLevel: 2, seed: 1, opponents: true, styles: [{}, {}] }, opts);
    this.world = new World(); this.players = []; this.seed = this.o.seed;
    for (const team of [0, 1]) {
      const n = team === 1 && this.o.freePlay && !this.o.opponents ? 0 : this.o.size;
      for (let i = 0; i < n; i++) {
        const car = this.world.addCar(team), idx = this.players.length;
        const human = this.o.humans.includes(idx);
        const p = { car, team, idx, human, name: human ? (this.o.names?.[idx] || "YOU") : (this.o.teamNames?.[team]?.[i] || BOT_NAMES[team][i % 4]), level: human ? null : team ? this.o.orangeLevel : this.o.blueLevel, stats: { score: 0, goals: 0, assists: 0, saves: 0, shots: 0, touches: 0 } };
        p.bot = human ? null : new Bot(this, p, p.level, this.o.styles[team] || {});
        this.players.push(p);
      }
    }
    this.clock = this.o.length; this.overtime = false; this.otTime = 0; this.state = "countdown"; this.timer = 0;
    this.events = []; this.threat = null; this.threatTick = 0; this.kickoffTouched = false; this.result = null; this.pred = null; this.predTick = -99;
    this.kickoff();
  }
  rand() { this.seed = (this.seed * 16807) % 2147483647; return this.seed / 2147483647; }
  emit(e) { this.events.push(e); }
  takeEvents() { const e = this.events; this.events = []; return e; }
  playerOf(car) { return this.players.find((p) => p.car === car); }

  kickoff() {
    const W = this.world;
    // pick distinct kickoff spots; Orange gets the mirror image of Blue's spots (fair)
    const spots = KICKOFFS.map((s, i) => ({ s, r: this.rand() + (i === 4 && this.o.size < 4 ? 0.5 : 0) })).sort((a, b) => a.r - b.r).map((x) => x.s);
    for (const team of [0, 1]) {
      const mates = this.players.filter((p) => p.team === team);
      mates.forEach((p, i) => {
        let [x, z] = spots[i % spots.length]; if (team === 1) { x = -x; z = -z; }
        if (i >= spots.length) x += 3;
        p.car.place(x, z, Math.atan2(-x, -z)); p.car.frozen = true;
      });
    }
    W.ball.reset(); W.goal = null; W.touches = []; W.resetPads(); W.ballFrozen = true;
    this.state = "countdown"; this.timer = 0; this.kickoffTouched = false; this.threat = null;
    for (const p of this.players) if (p.bot) p.bot.reset();
    this.emit({ type: "kickoff" });
  }
  // the ball's future path (shared by all bots, refreshed a few times per second)
  prediction() {
    if (this.world.tick - this.predTick >= 4 || !this.pred) {
      this.predTick = this.world.tick; const arr = [];
      arr.push({ t: 0, p: this.world.ball.pos.clone(), v: this.world.ball.vel.clone() });
      simulateBall(this.world.ball, 4, (b, t) => { arr.push({ t, p: b.pos.clone(), v: b.vel.clone() }); return false; });
      this.pred = arr;
    }
    return this.pred;
  }
  // one physics step (1/120 s). humanInputs: map of player index -> input
  step(humanInputs = {}) {
    const W = this.world, dt = 1 / PHYS.hz;
    this.timer += dt;
    const live = this.state === "play" || this.state === "goal";
    const inputs = this.players.map((p) => (live ? (p.human ? humanInputs[p.idx] : p.bot.update(dt)) : null));
    if (this.state === "countdown" && this.timer >= MATCH.kickoffCountdown) {
      this.state = "play"; this.timer = 0; W.ballFrozen = false; for (const p of this.players) p.car.frozen = false;
      this.emit({ type: "go" });
    }
    if (this.state === "over") { for (const p of this.players) p.car.frozen = true; W.ballFrozen = true; }
    W.step(inputs);
    for (const e of W.takeEvents()) this.handle(e);
    if (this.state === "play" && !this.o.freePlay && this.o.length > 0) {
      if (this.overtime) this.otTime += dt;
      else {
        this.clock = Math.max(0, this.clock - dt);
        // at 0:00 the match ends when the ball next touches the floor
        if (this.clock <= 0 && W.ball.contact && W.ball.pos.y < BALL.r + 0.3) this.timeUp();
      }
    }
    if (this.state === "goal" && this.timer > (this.o.goalPause ?? MATCH.goalReplay)) this.afterGoal();
    // keep a "where is the ball heading" note fresh for shot/save stats
    if (this.state === "play" && W.tick - this.threatTick >= 10) { this.threatTick = W.tick; this.threat = goalThreat(W.ball, 2.5); }
  }
  handle(e) {
    const W = this.world;
    if (e.type === "ballHit") {
      const p = this.playerOf(e.car); if (!p) return;
      this.kickoffTouched = true;
      p.stats.touches++; p.stats.score += POINTS.touch;
      const before = this.threat, after = goalThreat(W.ball, 3);
      const own = p.team; // the goal this player defends has the same number as its team
      if (after && after.goal !== own) { p.stats.shots++; p.stats.score += POINTS.shot; this.emit({ type: "shot", player: p }); }
      if (before && before.goal === own && before.t < 2.5 && !(after && after.goal === own)) { p.stats.saves++; p.stats.score += POINTS.save; this.emit({ type: "save", player: p }); }
      this.threat = after; this.threatTick = W.tick;
    }
    if (e.type === "goal" && this.state !== "goal" && this.state !== "over") {
      const scoringTeam = e.team;
      const last = [...W.touches].reverse();
      const t0 = last.find((t) => t.team === scoringTeam);
      const scorer = t0 ? this.players.find((p) => p.car.id === t0.car) : null;
      let assist = null;
      if (scorer) {
        const prevMate = last.find((t) => t.team === scoringTeam && t.car !== scorer.car.id && t.time > t0.time - 5 && t.time <= t0.time);
        if (prevMate) assist = this.players.find((p) => p.car.id === prevMate.car);
      }
      const ownGoal = W.touches.length && last[0].team !== scoringTeam && !scorer;
      if (scorer) { scorer.stats.goals++; scorer.stats.score += POINTS.goal; }
      if (assist) { assist.stats.assists++; assist.stats.score += POINTS.assist; }
      this.state = "goal"; this.timer = 0;
      this.emit({ type: "goal", team: scoringTeam, scorer, assist, ownGoal, speed: e.speed, pos: e.pos, score: [...W.score], time: W.time, aerial: !!(t0 && t0.y > 3) });
    }
    if (e.type !== "goal") this.emit(e);
  }
  timeUp() {
    const [b, o] = this.world.score;
    if (b === o && !this.o.allowDraw) this.startOvertime(); else this.finish();
  }
  afterGoal() {
    // lessons handle what happens after a goal themselves (no kickoff reset)
    if (this.o.onGoalReset) { this.state = "play"; this.timer = 0; this.world.goal = null; this.o.onGoalReset(); return; }
    if (this.overtime) return this.finish();
    if (!this.o.freePlay && this.o.length > 0 && this.clock <= 0) return this.timeUp();
    this.kickoff();
  }
  startOvertime() { this.overtime = true; this.otTime = 0; this.emit({ type: "overtime" }); this.kickoff(); }
  finish() {
    this.state = "over";
    const [b, o] = this.world.score, winner = b > o ? 0 : o > b ? 1 : -1;
    const pool = this.players.filter((p) => winner < 0 || p.team === winner);
    const mvp = pool.slice().sort((x, y) => y.stats.score - x.stats.score)[0] || null;
    this.result = { winner, score: [b, o], mvp, overtime: this.overtime, otTime: this.otTime };
    this.emit({ type: "over", result: this.result });
  }
  clockText() {
    const s = this.overtime ? this.otTime : this.clock, n = this.overtime ? Math.floor(s) : Math.ceil(s);
    return `${this.overtime ? "+" : ""}${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  }
}
