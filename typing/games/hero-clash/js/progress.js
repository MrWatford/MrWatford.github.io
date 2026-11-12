// Hero Clash — saved progress: settings, statistics, unlocks, mastery, achievements.
// Everything stays in this browser (localStorage). No accounts, no names required.
// Pure logic so it can be tested without a browser: pass any storage-like object.
import { DEFAULT_KEYS, DEFAULT_PAD } from "./input-defaults.js";

export const SAVE_KEY = "hero-clash-save";
export const SAVE_VERSION = 2;

export const RANKS = [[1, "Rookie"], [5, "Challenger"], [10, "Defender"], [15, "Elite"], [20, "Champion"], [25, "Legend"]];
export const MP_PER_LEVEL = 30, MAX_LEVEL = 25;
export const levelOf = (mp) => Math.min(MAX_LEVEL, 1 + Math.floor((mp || 0) / MP_PER_LEVEL));
export const rankOf = (lv) => { let r = RANKS[0][1]; for (const [l, n] of RANKS) if (lv >= l) r = n; return r; };

// Costume slot 0 is always open. The others open by playing (never by paying).
export const COSTUME_RULES = [
  null,
  { text: "Win 5 matches with this fighter", test: (c) => c.wins >= 5 },
  { text: "Finish Arcade with this fighter, or land 10 Ultimate Moves with them", test: (c) => c.arcade >= 1 || c.ults >= 10 },
  { text: "Win a tournament with this fighter, or win 20 matches with them", test: (c) => c.tourney >= 1 || c.wins >= 20 },
];
// Extra mastery rewards (cosmetic only)
export const MASTERY_REWARDS = [
  [5, "Title: Challenger", "title"], [10, "Silver portrait frame", "frame"], [15, "Alternate victory pose", "pose"],
  [20, "Energy aura effect", "aura"], [25, "Gold portrait frame and the title Legend", "frame2"],
];

export const ACHIEVEMENTS = [
  ["firstWin", "First Victory", "Win your first match."],
  ["streak3", "Three-Win Streak", "Win three matches in a row."],
  ["combo", "Combo Master", "Land a combo of 8 hits or more."],
  ["ultChamp", "Ultimate Champion", "Land 25 Ultimate Moves."],
  ["perfect", "Perfect Defense", "Win a round without taking any damage."],
  ["comeback", "Comeback Hero", "Win a match after dropping below 10% health."],
  ["tourney3", "Tournament Legend", "Win three tournaments."],
  ["classChamp", "Classroom Champion", "Win a Classroom Championship bracket."],
  ["arcade", "Arcade Ace", "Finish an Arcade ladder."],
  ["hard", "Tough Customer", "Win a match against a Hard CPU."],
  ["expert", "Expert Slayer", "Win a match against an Expert CPU."],
  ["counter", "Not Today", "Land 20 counters."],
  ["breaker", "Break Free", "Use a combo breaker."],
  ["smash", "Change of Scenery", "Knock an opponent into a second arena area."],
  ["roster", "Meet the Team", "Play a match with 8 different fighters."],
  ["wardrobe", "Wardrobe Upgrade", "Unlock 10 costumes."],
  ["master", "Living Legend", "Reach mastery level 25 with any fighter."],
  ["training", "Homework Done", "Complete a Training combo challenge."],
  ["rival1", "Light Against the Void", "Win the Titan Prime vs. Dark Overlord rivalry match."],
  ["rival2", "Sharper Blade", "Win the Shadow Knight vs. Phantom Ninja rivalry match."],
  ["rival3", "Speed vs. Control", "Win the Velocity vs. Frostbite rivalry match."],
  ["rival4", "Battle of the Machines", "Win the Iron Sentinel vs. Mecha Destroyer rivalry match."],
  ["rival5", "Clash of Storms", "Win the Thunderfist vs. Stormcaller rivalry match."],
  ["exam", "Passed the Final Exam", "Defeat The Professor in the secret challenge."],
];

export function defaults() {
  return {
    v: SAVE_VERSION,
    settings: { music: 0.5, sfx: 0.8, voice: 0.8, mute: false, quality: "auto", difficulty: "normal", time: 99, rounds: 2,
      reducedMotion: false, reducedFlash: false, highContrast: false, transitions: true, intros: true, speech: true,
      touch: "auto", touchSize: 1, touchOpacity: 0.75, touchSwap: false, hitboxes: false, frameData: false },
    keys: JSON.parse(JSON.stringify(DEFAULT_KEYS)), pad: Object.assign({}, DEFAULT_PAD),
    stats: { matches: 0, wins: 0, losses: 0, ults: 0, maxCombo: 0, perfects: 0, fastest: 0, hardWins: 0, expertWins: 0, counters: 0, breakers: 0, transitions: 0,
      streak: 0, bestStreak: 0, tournaments: 0, arcadeClears: 0, training: 0, byChar: {} },
    costume: {}, pose: {}, ach: {}, professor: false, examSeen: false,
    arcade: null, champ: { last: null, players: {}, titles: 0 },
  };
}
const charRow = () => ({ plays: 0, wins: 0, ults: 0, mp: 0, arcade: 0, tourney: 0 });
export function charStats(save, id) { return save.stats.byChar[id] || (save.stats.byChar[id] = charRow()); }

// Older saves are upgraded step by step so nobody loses progress when the game updates.
const MIGRATIONS = {
  1: (s) => { // version 1 (base game) -> 2 (Legends Collide): costumes, mastery, championship, the Professor
    s.costume = s.costume || {}; s.pose = s.pose || {}; s.ach = s.ach || {}; s.professor = !!s.professor;
    s.champ = s.champ || { last: null, players: {}, titles: 0 };
    if (s.stats && s.stats.byChar) for (const k in s.stats.byChar) { const c = s.stats.byChar[k]; c.mp = c.mp || (c.wins || 0) * 25 + ((c.plays || 0) - (c.wins || 0)) * 10; c.arcade = c.arcade || 0; c.tourney = c.tourney || 0; c.ults = c.ults || 0; }
    s.v = 2; return s;
  },
};
// Copy only known, correctly typed values from stored data onto fresh defaults.
function fill(def, src) {
  if (src === null || typeof src !== "object" || Array.isArray(src)) return def;
  for (const k in def) {
    const d = def[k], s = src[k];
    if (s === undefined || s === null) continue;
    if (d !== null && typeof d === "object" && !Array.isArray(d)) { if (Object.keys(d).length === 0) { if (typeof s === "object" && !Array.isArray(s)) def[k] = s; } else fill(d, s); }
    else if (d === null) def[k] = s;
    else if (typeof d === typeof s && (typeof s !== "number" || Number.isFinite(s))) def[k] = s;
  }
  return def;
}
export function load(storage) {
  let raw = null;
  try { raw = storage.getItem(SAVE_KEY); } catch (e) { return { save: defaults(), ok: false, reason: "blocked" }; }
  if (!raw) return { save: defaults(), ok: true, fresh: true };
  try {
    let s = JSON.parse(raw);
    if (!s || typeof s !== "object") throw new Error("bad");
    let v = Number.isInteger(s.v) ? s.v : 1;
    if (v > SAVE_VERSION) return { save: defaults(), ok: false, reason: "newer" };
    while (v < SAVE_VERSION) { s = MIGRATIONS[v](s); v = s.v; }
    const save = fill(defaults(), s);
    for (const k in save.stats.byChar) save.stats.byChar[k] = fill(charRow(), save.stats.byChar[k]);
    const st = save.settings; st.music = clamp01(st.music); st.sfx = clamp01(st.sfx); st.voice = clamp01(st.voice);
    if (![1, 2, 3].includes(st.rounds)) st.rounds = 2; if (![0, 60, 99].includes(st.time)) st.time = 99;
    return { save, ok: true };
  } catch (e) { return { save: defaults(), ok: false, reason: "corrupt" }; }
}
const clamp01 = (n) => Math.max(0, Math.min(1, n));
export function store(storage, save) { try { storage.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch (e) { return false; } }

export function costumeOpen(save, id, i) { return i === 0 || !!COSTUME_RULES[i].test(charStats(save, id)); }
export function costumesOpen(save, ids) { let n = 0; for (const id of ids) for (let i = 1; i < 4; i++) if (costumeOpen(save, id, i)) n++; return n; }

// The secret challenge appears once all four are done; beating it unlocks the Professor.
export function examTasks(save) {
  const s = save.stats;
  return [
    { text: "Win 10 matches", have: Math.min(s.wins, 10), need: 10 },
    { text: "Finish Arcade with any hero", have: Math.min(s.arcadeClears, 1), need: 1 },
    { text: "Land 5 Ultimate Moves", have: Math.min(s.ults, 5), need: 5 },
    { text: "Win a match on Hard difficulty", have: Math.min(s.hardWins, 1), need: 1 },
  ];
}
export const examReady = (save) => examTasks(save).every((t) => t.have >= t.need);

// Record a finished match. `r` describes what happened; only real, completed matches count.
// r: { mode, me (fighter id), foe, won, level, humanVsCpu, stats (my Fighter.stats), secs, perfectRound, rivalry (1-5 or 0), exam }
// Returns a list of things newly earned, for the results screen: [{ kind, text }]
export function recordMatch(save, r) {
  const news = [], s = save.stats, c = charStats(save, r.me);
  const before = { lv: levelOf(c.mp), cos: [1, 2, 3].map((i) => costumeOpen(save, r.me, i)), exam: examReady(save) };
  s.matches++; c.plays++;
  s.ults += r.stats.ults; c.ults += r.stats.ults; s.counters += r.stats.counters; s.breakers += r.stats.breakers; s.transitions += r.stats.transitions;
  s.maxCombo = Math.max(s.maxCombo, r.stats.maxCombo);
  c.mp += (r.won ? 25 : 10) + Math.min(5, r.stats.ults) * 3;
  if (r.won) {
    s.wins++; c.wins++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak);
    if (r.secs > 0 && (s.fastest === 0 || r.secs < s.fastest)) s.fastest = r.secs;
    if (r.vsCpu && (r.level === "hard" || r.level === "expert")) s.hardWins++;
    if (r.vsCpu && r.level === "expert") s.expertWins++;
    if (r.perfectRound) s.perfects++;
  } else { s.losses++; s.streak = 0; }
  const give = (id) => { if (!save.ach[id]) { save.ach[id] = Date.now(); const a = ACHIEVEMENTS.find((x) => x[0] === id); news.push({ kind: "ach", text: "Achievement: " + a[1] }); } };
  if (r.won) {
    give("firstWin"); if (s.streak >= 3) give("streak3"); if (r.perfectRound) give("perfect");
    if (r.stats.lowestHp < 0.1) give("comeback"); if (s.hardWins > 0) give("hard"); if (s.expertWins > 0) give("expert");
    if (r.rivalry) give("rival" + r.rivalry);
    if (r.exam && !save.professor) { save.professor = true; give("exam"); news.push({ kind: "unlock", text: "The Professor is now a playable fighter!" }); }
  }
  if (s.maxCombo >= 8) give("combo"); if (s.ults >= 25) give("ultChamp"); if (s.counters >= 20) give("counter");
  if (s.breakers > 0) give("breaker"); if (s.transitions > 0) give("smash");
  if (Object.values(s.byChar).filter((x) => x.plays > 0).length >= 8) give("roster");
  finishChar(save, r.me, before, news);
  if (!before.exam && examReady(save) && !save.professor) news.push({ kind: "secret", text: "A secret challenge has appeared on the main menu..." });
  return news;
}
function finishChar(save, id, before, news) {
  const c = charStats(save, id), lv = levelOf(c.mp);
  if (lv > before.lv) { news.push({ kind: "level", text: `Mastery level ${lv} (${rankOf(lv)})` }); for (const [l, t] of MASTERY_REWARDS) if (l > before.lv && l <= lv) news.push({ kind: "reward", text: "Mastery reward: " + t }); }
  [1, 2, 3].forEach((i, k) => { if (!before.cos[k] && costumeOpen(save, id, i)) news.push({ kind: "costume", text: "New costume unlocked!", costume: i }); });
  if (lv >= MAX_LEVEL && !save.ach.master) { save.ach.master = Date.now(); news.push({ kind: "ach", text: "Achievement: Living Legend" }); }
}
// Arcade ladder or tournament finished with a fighter. Each call counts once per completed run.
export function recordClear(save, kind, id, allIds) {
  const news = [], c = charStats(save, id), before = { lv: levelOf(c.mp), cos: [1, 2, 3].map((i) => costumeOpen(save, id, i)), exam: examReady(save) };
  const give = (aid) => { if (!save.ach[aid]) { save.ach[aid] = Date.now(); news.push({ kind: "ach", text: "Achievement: " + ACHIEVEMENTS.find((x) => x[0] === aid)[1] }); } };
  if (kind === "arcade") { save.stats.arcadeClears++; c.arcade++; c.mp += 40; give("arcade"); }
  if (kind === "tourney" || kind === "champ") { save.stats.tournaments++; c.tourney++; c.mp += 40; if (save.stats.tournaments >= 3) give("tourney3"); if (kind === "champ") give("classChamp"); }
  if (kind === "training") { save.stats.training++; c.mp += 20; give("training"); }
  finishChar(save, id, before, news);
  if (allIds && costumesOpen(save, allIds) >= 10) give("wardrobe");
  if (!before.exam && examReady(save) && !save.professor) news.push({ kind: "secret", text: "A secret challenge has appeared on the main menu..." });
  return news;
}
