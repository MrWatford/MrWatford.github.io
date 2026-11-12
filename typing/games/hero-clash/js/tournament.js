// Hero Clash — single-elimination bracket engine (Tournament and Classroom Championship).
// Pure logic: no drawing. A bracket is a list of rounds; each round is a list of matches.

const NAMES = ["Comet", "Falcon", "Blaze", "Nova", "Rocket", "Tiger", "Storm", "Ace", "Pixel", "Turbo", "Echo", "Jet", "Maverick", "Spark", "Orbit", "Dash"];
export function autoName(i, taken = []) { let n = NAMES[i % NAMES.length], k = 2; while (taken.includes(n)) n = NAMES[i % NAMES.length] + " " + k++; return n; }
// Nicknames only: short, letters/numbers/spaces. Nothing else is stored about a player.
export function cleanName(s) { return String(s || "").replace(/[^A-Za-z0-9 .'-]/g, "").replace(/\s+/g, " ").trim().slice(0, 14); }

// players: [{ name, cpu (bool), char (fighter id), level }]  size: 4 | 8 | 16
export function makeBracket(players, opts = {}) {
  const size = players.length;
  if (![4, 8, 16].includes(size)) throw new Error("A bracket needs 4, 8, or 16 players");
  const order = players.map((_, i) => i);
  if (opts.shuffle) { const r = opts.rand || Math.random; for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
  const rounds = []; let n = size / 2;
  while (n >= 1) { rounds.push(Array.from({ length: n }, () => ({ a: null, b: null, winner: null, score: null }))); n /= 2; }
  rounds[0].forEach((m, i) => { m.a = order[i * 2]; m.b = order[i * 2 + 1]; });
  return { size, players: players.map((p) => Object.assign({ wins: 0, losses: 0, maxCombo: 0, ults: 0, fastest: 0, out: false }, p)), rounds, champion: null,
    title: opts.title || "Tournament", room: opts.room || "", bestOf: opts.bestOf || 1, series: null };
}
export const roundName = (b, r) => { const left = b.rounds.length - r; return left === 1 ? "Final" : left === 2 ? "Semifinals" : left === 3 ? "Quarterfinals" : "Round of " + b.rounds[r].length * 2; };

// The next match that can be played, or null when the bracket is finished.
export function nextMatch(b) {
  for (let r = 0; r < b.rounds.length; r++) for (let i = 0; i < b.rounds[r].length; i++) {
    const m = b.rounds[r][i];
    if (m.winner === null && m.a !== null && m.b !== null) return { r, i, m };
  }
  return null;
}
// Report a result. `winner` must be one of the two players in that match, and
// matches can only be reported once and in order: anything else is refused.
export function report(b, r, i, winner, info = {}) {
  const m = b.rounds[r] && b.rounds[r][i];
  if (!m) return { ok: false, why: "No such match" };
  if (m.winner !== null) return { ok: false, why: "That match is already decided" };
  if (m.a === null || m.b === null) return { ok: false, why: "That match is not ready yet" };
  if (winner !== m.a && winner !== m.b) return { ok: false, why: "That player is not in this match" };
  const nx = nextMatch(b); if (!nx || nx.r !== r || nx.i !== i) return { ok: false, why: "Earlier matches must be played first" };
  // best-of-three series: a player needs two match wins before moving on
  if (b.bestOf === 3) {
    b.series = b.series && b.series.r === r && b.series.i === i ? b.series : { r, i, a: 0, b: 0 };
    b.series[winner === m.a ? "a" : "b"]++;
    track(b, m, winner, info);
    if (b.series.a < 2 && b.series.b < 2) return { ok: true, done: false, series: [b.series.a, b.series.b] };
    m.score = [b.series.a, b.series.b]; b.series = null;
  } else { track(b, m, winner, info); m.score = winner === m.a ? [1, 0] : [0, 1]; }
  m.winner = winner;
  const loser = winner === m.a ? m.b : m.a; b.players[loser].out = true;
  if (r + 1 < b.rounds.length) { const up = b.rounds[r + 1][Math.floor(i / 2)]; if (i % 2 === 0) up.a = winner; else up.b = winner; }
  else b.champion = winner;
  return { ok: true, done: true, champion: b.champion };
}
function track(b, m, winner, info) {
  const loser = winner === m.a ? m.b : m.a, w = b.players[winner], l = b.players[loser];
  w.wins++; l.losses++;
  if (info.combo) { w.maxCombo = Math.max(w.maxCombo, info.combo[winner === m.a ? 0 : 1] || 0); l.maxCombo = Math.max(l.maxCombo, info.combo[winner === m.a ? 1 : 0] || 0); }
  if (info.ults) { w.ults += info.ults[winner === m.a ? 0 : 1] || 0; l.ults += info.ults[winner === m.a ? 1 : 0] || 0; }
  if (info.secs && (w.fastest === 0 || info.secs < w.fastest)) w.fastest = info.secs;
}
// A quick, fair coin-flip result for two CPU players the class does not want to watch.
export function simulate(b, r, i, rand = Math.random) { const m = b.rounds[r][i]; return report(b, r, i, rand() < 0.5 ? m.a : m.b, {}); }

export function awards(b) {
  const P = b.players, best = (key, min = 1) => { let top = null; for (const p of P) if (p[key] >= min && (!top || p[key] > top[key])) top = p; return top; };
  let quick = null; for (const p of P) if (p.fastest > 0 && (!quick || p.fastest < quick.fastest)) quick = p;
  const out = [];
  const c = best("maxCombo", 2); if (c) out.push(["Longest combo", `${c.name}: ${c.maxCombo} hits`]);
  const u = best("ults"); if (u) out.push(["Most Ultimate Moves", `${u.name}: ${u.ults}`]);
  if (quick) out.push(["Fastest victory", `${quick.name}: ${quick.fastest} seconds`]);
  return out;
}
