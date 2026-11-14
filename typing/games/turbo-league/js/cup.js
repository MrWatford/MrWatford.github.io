// Turbo League — THE MR. WATFORD CHAMPIONSHIP CUP (tournament rules; no graphics, so it runs in Node tests).
// 16 teams -> 4 groups of 4 (round robin, 3 points for a win, 1 for a draw) -> top 2 of each group ->
// quarterfinals -> semifinals -> final. The student's matches are played for real; every other match is
// decided instantly from the two teams' strength plus some luck. The cup is saved after every match.

// Original teams. base = strength (0 = scrappy underdogs, 2 = favourites); style feeds the computer players.
export const CUP_TEAMS = [
  { id: "thk", name: "Thunderhawks", short: "THK", primary: "#f2c200", accent: "#1a1a2e", shape: "shield", glyph: "bolt", base: 2, style: { aggression: 0.75, boostGreed: 0.6 }, about: "Lightning-fast attackers who love to fly.", drivers: ["Talon", "Gale", "Striker"] },
  { id: "irt", name: "Iron Titans", short: "IRT", primary: "#8a9099", accent: "#23272e", shape: "hex", glyph: "tower", base: 2, style: { aggression: 0.25, boostGreed: 0.4 }, about: "A wall in front of goal. Patient and tough.", drivers: ["Anvil", "Bolt", "Rivet"] },
  { id: "crv", name: "Crimson Vipers", short: "CRV", primary: "#c8102e", accent: "#121212", shape: "diamond", glyph: "fang", base: 1, style: { aggression: 0.65, boostGreed: 0.5 }, about: "Quick strikes when you least expect them.", drivers: ["Fang", "Coil", "Scarlet"] },
  { id: "stb", name: "Stormbreakers", short: "STB", primary: "#3a6ea5", accent: "#e8eef6", shape: "circle", glyph: "wave", base: 1, style: { aggression: 0.5, boostGreed: 0.5 }, about: "Balanced and steady, like a rolling storm.", drivers: ["Squall", "Tempest", "Drizzle"] },
  { id: "glk", name: "Galactic Knights", short: "GLK", primary: "#5b2a86", accent: "#cfd2ff", shape: "shield", glyph: "planet", base: 2, style: { aggression: 0.55, boostGreed: 0.7 }, about: "Champions of the stars, always hunting boost.", drivers: ["Orion", "Nova", "Comet"] },
  { id: "shf", name: "Shadow Falcons", short: "SHF", primary: "#2a2d34", accent: "#9be7ff", shape: "wing", glyph: "moon", base: 1, style: { aggression: 0.6, boostGreed: 0.5 }, about: "Silent and sneaky. Great at stealing the ball.", drivers: ["Raven", "Dusk", "Shade"] },
  { id: "arw", name: "Arctic Wolves", short: "ARW", primary: "#bfe6ff", accent: "#0b3d5c", shape: "hex", glyph: "snow", base: 1, style: { aggression: 0.45, boostGreed: 0.4 }, about: "They hunt as a pack and never give up.", drivers: ["Husky", "Frost", "Tundra"] },
  { id: "inf", name: "Inferno Racers", short: "INF", primary: "#ff4d00", accent: "#ffd000", shape: "circle", glyph: "flame", base: 1, style: { aggression: 0.9, boostGreed: 0.8 }, about: "All gas, no brakes. Attack, attack, attack!", drivers: ["Blaze", "Ember", "Cinder"] },
  { id: "ggd", name: "Golden Guardians", short: "GGD", primary: "#c9a227", accent: "#2c1a00", shape: "shield", glyph: "crown", base: 2, style: { aggression: 0.3, boostGreed: 0.35 }, about: "Defending champions in spirit. Hard to score on.", drivers: ["Regal", "Sterling", "Aurum"] },
  { id: "neo", name: "Neon Strikers", short: "NEO", primary: "#00e59b", accent: "#ff2bc8", shape: "diamond", glyph: "star", base: 1, style: { aggression: 0.7, boostGreed: 0.6 }, about: "Flashy shooters who light up the scoreboard.", drivers: ["Glow", "Pixel", "Laser"] },
  { id: "stc", name: "Steel Cyclones", short: "STC", primary: "#607d8b", accent: "#ff9800", shape: "circle", glyph: "wave", base: 0, style: { aggression: 0.55, boostGreed: 0.5 }, about: "Spinning, swirling, and always busy.", drivers: ["Twister", "Gear", "Spin"] },
  { id: "dsc", name: "Desert Scorpions", short: "DSC", primary: "#d2a65a", accent: "#5a2d0c", shape: "hex", glyph: "sun", base: 0, style: { aggression: 0.5, boostGreed: 0.45 }, about: "Tough as sand. They sting on the counter.", drivers: ["Dune", "Mirage", "Sandy"] },
  { id: "vlk", name: "Velocity Kings", short: "VLK", primary: "#1e90ff", accent: "#ffd700", shape: "shield", glyph: "crown", base: 1, style: { aggression: 0.7, boostGreed: 0.75 }, about: "The fastest team in the league, and they know it.", drivers: ["Turbo", "Dash", "Zoom"] },
  { id: "frb", name: "Frostbite", short: "FRB", primary: "#7fdbff", accent: "#ffffff", shape: "diamond", glyph: "snow", base: 0, style: { aggression: 0.4, boostGreed: 0.4 }, about: "Cool heads who freeze out attackers.", drivers: ["Icicle", "Chill", "Sleet"] },
  { id: "rpx", name: "Royal Phoenix", short: "RPX", primary: "#b0006e", accent: "#ffb000", shape: "wing", glyph: "flame", base: 1, style: { aggression: 0.6, boostGreed: 0.55 }, about: "Down? Never out. Famous for comebacks.", drivers: ["Ash", "Flare", "Rise"] },
];
export const SHAPES = ["shield", "circle", "hex", "diamond", "wing", "star"];
export const GLYPHS = ["bolt", "star", "flame", "crown", "wing", "snow", "planet", "sun", "moon", "wave", "tower", "fang"];
export const PALETTE = ["#1d6dff", "#e32636", "#2fbf71", "#ffc23a", "#8e44ad", "#ff7a1a", "#00bcd4", "#f4f4f6", "#222831", "#ff4fa3", "#8bc34a", "#795548"];
export const DIFFICULTY = [{ id: "easy", name: "Rookie Cup", add: 0 }, { id: "normal", name: "Pro Cup", add: 1 }, { id: "hard", name: "All-Star Cup", add: 2 }, { id: "legend", name: "Legend Cup", add: 3 }];
export const STAGES = { group: "Group Stage", qf: "Quarterfinals", sf: "Semifinals", final: "The Final", done: "Finished" };

function rng(seed) { let s = (seed >>> 0) % 2147483646 + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
export function teamLevel(cup, t) { return t.id === "you" ? cup.mateLevel : Math.max(0, Math.min(5, t.base + DIFFICULTY[cup.difficulty].add)); }
export const teamById = (cup, id) => cup.teams.find((t) => t.id === id);

// make a fresh cup. team = the student's team {name, short, primary, accent, shape, glyph}
export function newCup({ team, size = 2, length = 180, difficulty = 1, mateLevel = 2 } = {}, seed = Date.now()) {
  const r = rng(seed);
  const you = { id: "you", name: (team && team.name) || "My Team", short: (team && team.short) || "YOU", primary: (team && team.primary) || "#1d6dff", accent: (team && team.accent) || "#ffc23a", shape: (team && team.shape) || "shield", glyph: (team && team.glyph) || "bolt", base: 1, style: {}, about: "Your team!", drivers: ["YOU", "Ace", "Rocket", "Sparky"] };
  const teams = [you, ...CUP_TEAMS.map((t) => ({ ...t, style: { ...t.style }, drivers: [...t.drivers] }))];
  // seeded draw: favourites are spread across the groups; you are always in Group A
  const others = teams.slice(1).map((t) => ({ t, k: r() })).sort((a, b) => b.t.base - a.t.base || a.k - b.k).map((x) => x.t);
  const groups = [[you.id], [], [], []];
  let gi = 1; for (const t of others) { while (groups[gi % 4].length >= 4) gi++; groups[gi % 4].push(t.id); gi++; }
  const fixtures = [];
  groups.forEach((g, gIdx) => {
    for (const [round, pairs] of [[1, [[0, 1], [2, 3]]], [2, [[0, 2], [1, 3]]], [3, [[0, 3], [1, 2]]]]) for (const [a, b] of pairs) fixtures.push({ id: `g${gIdx}r${round}${a}${b}`, stage: "group", group: gIdx, round, home: g[a], away: g[b], score: null, ot: false });
  });
  return { version: 1, created: new Date().toISOString(), seed, size, length, difficulty, mateLevel, teams, groups, fixtures, stage: "group", champion: null, eliminated: false, stats: {}, log: [] };
}

// group table: points, then goal difference, goals scored, head-to-head, then team id (stable)
export function standings(cup, gIdx) {
  const ids = cup.groups[gIdx], row = Object.fromEntries(ids.map((id) => [id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }]));
  for (const f of cup.fixtures) if (f.stage === "group" && f.group === gIdx && f.score) {
    const [a, b] = f.score, H = row[f.home], A = row[f.away];
    H.p++; A.p++; H.gf += a; H.ga += b; A.gf += b; A.ga += a;
    if (a > b) { H.w++; A.l++; H.pts += 3; } else if (b > a) { A.w++; H.l++; A.pts += 3; } else { H.d++; A.d++; H.pts++; A.pts++; }
  }
  const h2h = (x, y) => { const f = cup.fixtures.find((q) => q.stage === "group" && q.score && ((q.home === x && q.away === y) || (q.home === y && q.away === x))); if (!f) return 0; const gx = f.home === x ? f.score[0] : f.score[1], gy = f.home === x ? f.score[1] : f.score[0]; return gy - gx; };
  return Object.values(row).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || h2h(x.id, y.id) || (x.id < y.id ? -1 : 1));
}
export const winnerOf = (f) => (!f.score ? null : f.score[0] > f.score[1] ? f.home : f.away);
export const loserOf = (f) => (!f.score ? null : f.score[0] > f.score[1] ? f.away : f.home);

// the student's next match (or null when out / finished)
export function nextFixture(cup) { return cup.fixtures.find((f) => !f.score && (f.home === "you" || f.away === "you")) || null; }

// instant result for a match the student isn't in
function simScore(cup, f, r) {
  const A = teamById(cup, f.home), B = teamById(cup, f.away), d = teamLevel(cup, A) - teamLevel(cup, B);
  const pois = (lam) => { let L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; };
  const len = cup.length / 180, la = 1.3 * len * Math.exp(0.17 * d), lb = 1.3 * len * Math.exp(-0.17 * d);
  let a = pois(la), b = pois(lb), ot = false;
  if (f.stage !== "group" && a === b) { ot = true; if (r() < 1 / (1 + Math.exp(-0.35 * d))) a++; else b++; }
  return { score: [a, b], ot };
}
// record the student's result, decide every other match of that round, and move the cup on when a stage ends
export function playRound(cup, fx, result) {
  const r = rng(cup.seed + cup.fixtures.filter((f) => f.score).length * 7919 + 13);
  const f = cup.fixtures.find((q) => q.id === fx.id);
  // the student always plays on the blue side; turn the result round if they are the "away" team
  f.score = f.home === "you" ? [...result.score] : [result.score[1], result.score[0]]; f.ot = !!result.ot;
  for (const p of result.players || []) { const s = cup.stats[p.name] || (cup.stats[p.name] = { name: p.name, goals: 0, assists: 0, saves: 0, shots: 0, score: 0, games: 0 }); for (const k of ["goals", "assists", "saves", "shots", "score"]) s[k] += p.stats[k] || 0; s.games++; }
  const others = [];
  for (const q of cup.fixtures) if (!q.score && q.stage === f.stage && (f.stage !== "group" || q.round === f.round)) { Object.assign(q, simScore(cup, q, r)); others.push(q); }
  if (f.stage !== "group" && winnerOf(f) !== "you") cup.eliminated = true;
  advance(cup);
  return { fixture: f, others };
}
// build the next knockout round when the current stage is complete
export function advance(cup) {
  const open = (st) => cup.fixtures.filter((f) => f.stage === st);
  const doneStage = (st) => open(st).length > 0 && open(st).every((f) => f.score);
  if (cup.stage === "group" && cup.fixtures.filter((f) => f.stage === "group").every((f) => f.score)) {
    const t = [0, 1, 2, 3].map((g) => standings(cup, g).map((x) => x.id));
    const qf = [[t[0][0], t[1][1]], [t[2][0], t[3][1]], [t[1][0], t[0][1]], [t[3][0], t[2][1]]]; // A1-B2, C1-D2, B1-A2, D1-C2
    qf.forEach(([h, a], i) => cup.fixtures.push({ id: `qf${i}`, stage: "qf", slot: i, home: h, away: a, score: null, ot: false }));
    cup.stage = "qf";
    if (!qf.flat().includes("you")) cup.eliminated = true;
  } else if (cup.stage === "qf" && doneStage("qf")) {
    const w = open("qf").sort((a, b) => a.slot - b.slot).map(winnerOf);
    [[w[0], w[1]], [w[2], w[3]]].forEach(([h, a], i) => cup.fixtures.push({ id: `sf${i}`, stage: "sf", slot: i, home: h, away: a, score: null, ot: false }));
    cup.stage = "sf";
  } else if (cup.stage === "sf" && doneStage("sf")) {
    const w = open("sf").sort((a, b) => a.slot - b.slot).map(winnerOf);
    cup.fixtures.push({ id: "final", stage: "final", slot: 0, home: w[0], away: w[1], score: null, ot: false });
    cup.stage = "final";
  } else if (cup.stage === "final" && doneStage("final")) {
    cup.stage = "done"; cup.champion = winnerOf(open("final")[0]);
    const fin = open("final")[0]; cup.runnerUp = loserOf(fin);
  } else return false;
  return true;
}
// student knocked out (or watching): decide everything that's left
export function simulateRest(cup) {
  const r = rng(cup.seed + 99991); let guard = 0;
  while (cup.stage !== "done" && guard++ < 50) {
    for (const q of cup.fixtures) if (!q.score) Object.assign(q, simScore(cup, q, r));
    advance(cup);
  }
  return cup;
}
export function playerRecord(cup) {
  const rec = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
  for (const f of cup.fixtures) if (f.score && (f.home === "you" || f.away === "you")) {
    const us = f.home === "you" ? f.score[0] : f.score[1], them = f.home === "you" ? f.score[1] : f.score[0];
    rec.gf += us; rec.ga += them; if (us > them) rec.w++; else if (us < them) rec.l++; else rec.d++;
  }
  return rec;
}
export function tournamentMVP(cup) { return Object.values(cup.stats).sort((a, b) => b.score - a.score)[0] || null; }
export function stageLabel(cup, f) { if (!f) return STAGES[cup.stage]; return f.stage === "group" ? `Group ${"ABCD"[f.group]} • Round ${f.round}` : STAGES[f.stage]; }
// a Hall of Champions entry for a finished cup
export function hallEntry(cup) {
  const champ = teamById(cup, cup.champion), runner = teamById(cup, cup.runnerUp), fin = cup.fixtures.find((f) => f.id === "final");
  const pick = (t) => t && { name: t.name, short: t.short, primary: t.primary, accent: t.accent, shape: t.shape, glyph: t.glyph };
  const mvp = cup.champion === "you" ? tournamentMVP(cup) : null;
  return { date: new Date().toISOString(), champion: pick(champ), runnerUp: pick(runner), playerWon: cup.champion === "you", final: fin ? `${Math.max(...fin.score)}–${Math.min(...fin.score)}${fin.ot ? " OT" : ""}` : "", mvp: mvp ? { name: mvp.name, goals: mvp.goals, score: mvp.score } : null, record: playerRecord(cup), size: cup.size, difficulty: DIFFICULTY[cup.difficulty].name, yourTeam: pick(teamById(cup, "you")) };
}
