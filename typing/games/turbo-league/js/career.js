// Turbo League — Career: XP, levels, career stats, achievements and the garage unlock list.
// Pure rules (no drawing, no storage) so they can be checked in Node and in test.html.
// Everything is saved only on this device (localStorage) — no names, no accounts, nothing sent anywhere.

import { cleanStats } from "./saves.js";

export const MAX_LEVEL = 30;
// XP needed to go from level L to L+1 grows slowly: 300, 400, 500, ...
export const xpToNext = (L) => 300 + 100 * (L - 1);
export function levelInfo(xp) {
  let L = 1, base = 0;
  while (L < MAX_LEVEL && xp >= base + xpToNext(L)) { base += xpToNext(L); L++; }
  const need = L < MAX_LEVEL ? xpToNext(L) : 0;
  return { level: L, into: xp - base, need, frac: need ? (xp - base) / need : 1 };
}
export const TITLES = [[1, "Rookie"], [3, "Contender"], [6, "Pro Driver"], [10, "All-Star"], [15, "Veteran"], [20, "Elite"], [25, "Legend"], [30, "Grand Champion"]];
export const titleFor = (L) => TITLES.filter(([l]) => L >= l).pop()[1];

// XP for one match (only real matches and cup matches count — not free play or watching)
export const XP = { match: 100, win: 50, draw: 25, goal: 40, assist: 25, save: 30, shot: 10, mvp: 50, lessonStar: 40, lessonFirst: 20, cupPlayed: 100, cupWon: 500 };
export function matchXP(s) {
  const b = [["Match played", XP.match]];
  if (s.won) b.push(["Victory", XP.win]); else if (s.draw) b.push(["Draw", XP.draw]);
  const g = Math.min(5, s.goals), a = Math.min(5, s.assists), sv = Math.min(6, s.saves), sh = Math.min(10, s.shots);
  if (g) b.push([`Goals ×${g}`, g * XP.goal]);
  if (a) b.push([`Assists ×${a}`, a * XP.assist]);
  if (sv) b.push([`Saves ×${sv}`, sv * XP.save]);
  if (sh) b.push([`Shots ×${sh}`, sh * XP.shot]);
  if (s.mvp) b.push(["MVP", XP.mvp]);
  return { xp: b.reduce((t, [, v]) => t + v, 0), breakdown: b };
}

export const ARENAS_ALL = ["championship", "neon", "desert", "arctic", "galactic"];
export function newProfile() {
  return { v: 1, xp: 0, created: 0,
    stats: { matches: 0, wins: 0, losses: 0, draws: 0, goals: 0, assists: 0, saves: 0, shots: 0, mvps: 0, aerialGoals: 0, topGoalKph: 0, overtimeWins: 0, comebacks: 0, cleanSheets: 0, hatTricks: 0, cupsPlayed: 0, cupsWon: 0, lessonsDone: 0, lessonStars: 0, tiersDone: 0, arenas: [] },
    achievements: {}, history: [], loadout: defaultLoadout(), unlocks: [], seen: [] };
}
export function loadProfile(raw) { // repair anything missing or broken (old saves, hand edits)
  const p = newProfile();
  if (!raw || typeof raw !== "object") return p;
  p.xp = Math.max(0, Number(raw.xp) || 0); p.created = raw.created || 0; p.backfilled = !!raw.backfilled;
  p.stats = cleanStats(raw.stats, p.stats);
  p.achievements = {}; if (raw.achievements && typeof raw.achievements === "object") for (const [k, v] of Object.entries(raw.achievements)) if (ACHIEVEMENTS.some((a) => a.id === k)) p.achievements[k] = typeof v === "number" ? v : 1;
  p.history = Array.isArray(raw.history) ? raw.history.filter((h) => h && typeof h === "object").slice(0, 20) : [];
  p.unlocks = Array.isArray(raw.unlocks) ? raw.unlocks.filter((u) => typeof u === "string") : [];
  p.seen = Array.isArray(raw.seen) ? raw.seen : [];
  p.loadout = defaultLoadout(); if (raw.loadout && typeof raw.loadout === "object") for (const k of Object.keys(p.loadout)) if (typeof raw.loadout[k] === "string") p.loadout[k] = raw.loadout[k];
  return p;
}

// ---- achievements ----
// test(stats, ctx): ctx is the match/lesson/cup that just happened (may be empty)
export const ACHIEVEMENTS = [
  { id: "first_goal", icon: "⚽", name: "First Goal", text: "Score your first goal.", test: (s) => s.goals >= 1 },
  { id: "first_win", icon: "🏁", name: "First Win", text: "Win a match.", test: (s) => s.wins >= 1 },
  { id: "hat_trick", icon: "🎩", name: "Hat Trick", text: "Score 3 goals in one match.", test: (s) => s.hatTricks >= 1 },
  { id: "clean_sheet", icon: "🧱", name: "Clean Sheet", text: "Win without letting in a goal.", test: (s) => s.cleanSheets >= 1 },
  { id: "comeback", icon: "🔥", name: "Never Give Up", text: "Win a match after being behind.", test: (s) => s.comebacks >= 1 },
  { id: "overtime_win", icon: "⏱️", name: "Sudden Victory", text: "Win a match in overtime.", test: (s) => s.overtimeWins >= 1 },
  { id: "aerial_goal", icon: "🚀", name: "Sky High", text: "Score a goal from up in the air.", test: (s) => s.aerialGoals >= 1 },
  { id: "speed_demon", icon: "💨", name: "Rocket Shot", text: "Score a goal faster than 100 km/h.", test: (s) => s.topGoalKph >= 100 },
  { id: "matches_10", icon: "🎮", name: "Warmed Up", text: "Play 10 matches.", test: (s) => s.matches >= 10 },
  { id: "matches_50", icon: "📅", name: "Regular", text: "Play 50 matches.", test: (s) => s.matches >= 50 },
  { id: "wins_10", icon: "🥉", name: "Winner", text: "Win 10 matches.", test: (s) => s.wins >= 10 },
  { id: "wins_25", icon: "🥈", name: "Serial Winner", text: "Win 25 matches.", test: (s) => s.wins >= 25 },
  { id: "goals_50", icon: "🎯", name: "Goal Machine", text: "Score 50 career goals.", test: (s) => s.goals >= 50 },
  { id: "assists_10", icon: "🤝", name: "Team Player", text: "Make 10 career assists.", test: (s) => s.assists >= 10 },
  { id: "saves_25", icon: "🧤", name: "Brick Wall", text: "Make 25 career saves.", test: (s) => s.saves >= 25 },
  { id: "mvp_5", icon: "⭐", name: "Star Player", text: "Be the MVP 5 times.", test: (s) => s.mvps >= 5 },
  { id: "academy_1", icon: "🎓", name: "Beginner Graduate", text: "Finish every Beginner lesson.", test: (s) => s.tiersDone >= 1 },
  { id: "academy_2", icon: "📘", name: "Intermediate Graduate", text: "Finish every Intermediate lesson.", test: (s) => s.tiersDone >= 2 },
  { id: "academy_3", icon: "📕", name: "Academy Graduate", text: "Finish every Advanced lesson.", test: (s) => s.tiersDone >= 3 },
  { id: "all_stars", icon: "🌟", name: "Perfect Student", text: "Earn 3 stars on every lesson.", test: (s, c, max) => max.lessonStars > 0 && s.lessonStars >= max.lessonStars },
  { id: "cup_champion", icon: "🏆", name: "Cup Champion", text: "Win the Mr. Watford Championship Cup.", test: (s) => s.cupsWon >= 1 },
  { id: "cup_legend", icon: "👑", name: "Cup Legend", text: "Win the Cup on the hardest difficulty.", test: (s, c) => !!(c && c.cupWon && c.hardest) },
  { id: "arena_tourist", icon: "🗺️", name: "World Tour", text: "Play a match in all 5 arenas.", test: (s) => ARENAS_ALL.every((a) => s.arenas.includes(a)) },
  { id: "garage_fresh", icon: "🔧", name: "Fresh Look", text: "Change your car in the Garage.", test: (s, c) => !!(c && c.garage) },
  { id: "level_5", icon: "5️⃣", name: "Level 5", text: "Reach level 5.", test: (s, c, max, L) => L >= 5 },
  { id: "level_10", icon: "🔟", name: "Level 10", text: "Reach level 10.", test: (s, c, max, L) => L >= 10 },
  { id: "level_20", icon: "💎", name: "Level 20", text: "Reach level 20.", test: (s, c, max, L) => L >= 20 },
];
export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id);

// ---- the garage: every item and how it is earned ----
// req: null = free from the start; { level: n }; { ach: id }; { unlock: id } (Academy / Cup rewards)
const I = (id, name, req = null, extra = {}) => ({ id, name, req, ...extra });
export const GARAGE = {
  body: [I("striker", "Striker", null, { about: "Sports coupe. Balanced and sharp." }), I("sprite", "Sprite", null, { about: "Compact racer. Small and nimble-looking." }),
    I("hammer", "Hammerhead", { level: 2 }, { about: "Muscle car with a long hood and wide hips." }), I("trail", "Trailblazer", { level: 3 }, { about: "Off-road racer on tall chunky tires." }),
    I("vortex", "Vortex", { level: 4 }, { about: "Low, wide supercar with a big wing." }), I("nova", "Nova-X", { level: 6 }, { about: "Futuristic wedge with glowing light strips." }),
    I("bastion", "Bastion", { level: 8 }, { about: "Armored sports car with plated sides." }), I("apex", "Apex F", { level: 10 }, { about: "Formula-inspired racer with open wheels." })],
  finish: [I("gloss", "Gloss"), I("metallic", "Metallic"), I("matte", "Matte", { level: 3 }), I("pearl", "Pearl", { level: 5 }), I("gold", "Champion Gold", { unlock: "paint-gold" })],
  decal: [I("stripes", "Racing Stripes"), I("none", "Clean"), I("number", "Big Number"), I("lightning", "Lightning", { level: 2 }), I("flames", "Flames", { level: 4 }), I("checker", "Checkered", { level: 7 }), I("split", "Two-Tone", { level: 9 })],
  rims: [I("twin5", "Twin Five"), I("star", "Star"), I("mesh", "Mesh", { level: 3 }), I("turbine", "Turbine", { level: 6 }), I("dish", "Deep Dish", { level: 9 })],
  rimColor: [I("silver", "Silver"), I("black", "Black"), I("accent", "Team Accent", { level: 2 }), I("gold", "Champion Gold", { unlock: "rims-gold" })],
  tires: [I("street", "Street"), I("slick", "Racing Slick", { level: 2 }), I("rugged", "Off-Road", { level: 4 }), I("whitewall", "Whitewall", { level: 7 })],
  trail: [I("standard", "Standard"), I("trail-sky", "Sky Blue", { unlock: "trail-sky" }), I("trail-gold", "Golden", { unlock: "trail-gold" }), I("trail-legend", "Legend", { unlock: "trail-legend" }), I("aurora", "Aurora", { level: 12 }), I("trail-champion", "Champion", { unlock: "trail-champion" })],
  boom: [I("classic", "Classic"), I("starburst", "Starburst", { level: 3 }), I("confetti", "Confetti", { level: 5 }), I("fireworks", "Fireworks", { ach: "hat_trick" }), I("galaxy", "Galaxy", { level: 11 })],
  topper: [I("none", "None"), I("cap", "Ball Cap", { level: 2 }), I("cone", "Traffic Cone", { level: 4 }), I("propeller", "Propeller", { level: 6 }), I("halo", "Halo Ring", { level: 8 }), I("graduate", "Graduate Cap", { ach: "academy_3" }), I("crown", "Champion Crown", { unlock: "banner-champion" })],
  antenna: [I("none", "None"), I("flag", "Team Flag"), I("ball", "Mini Ball", { level: 2 }), I("star", "Star", { level: 5 })],
  engine: [I("classic", "Classic"), I("turbo", "Turbo", { level: 3 }), I("electric", "Electric", { level: 5 }), I("rally", "Rally", { level: 7 })],
  banner: [I("classic", "Classic"), I("lightning", "Lightning", { level: 2 }), I("starfield", "Starfield", { level: 6 }), I("academy", "Academy", { ach: "academy_3" }), I("champion", "Champion", { unlock: "banner-champion" })],
};
export const PAINTS = ["#1d6dff", "#ff6a10", "#e8333c", "#14a35a", "#ffc23a", "#8a3ffc", "#00b8d9", "#ff4fa3", "#f4f4f6", "#2a2d34", "#0b2a5b", "#7a4a1d"];
export const ACCENTS = ["#ffc23a", "#f4f4f6", "#15161a", "#1d6dff", "#ff6a10", "#e8333c", "#14a35a", "#00e0ff"];
export function defaultLoadout() {
  return { body: "striker", paint: "#1d6dff", accent: "#ffc23a", finish: "metallic", decal: "stripes", rims: "twin5", rimColor: "silver", tires: "street", trail: "standard", boom: "classic", topper: "none", antenna: "none", engine: "classic", banner: "classic", light: "showroom" };
}
export function itemUnlocked(p, item, extraUnlocks = []) {
  const r = item.req; if (!r) return true;
  if (r.level) return levelInfo(p.xp).level >= r.level;
  if (r.ach) return !!p.achievements[r.ach];
  if (r.unlock) return p.unlocks.includes(r.unlock) || extraUnlocks.includes(r.unlock);
  return false;
}
export function reqText(item) {
  const r = item.req; if (!r) return "";
  if (r.level) return `Reach level ${r.level}`;
  if (r.ach) return `Achievement: ${achievementById(r.ach).name}`;
  return { "paint-gold": "Win the Championship Cup", "rims-gold": "Win the Championship Cup", "trail-champion": "Win the Championship Cup", "banner-champion": "Win the Championship Cup", "trail-sky": "Finish the Beginner lessons", "trail-gold": "Finish the Intermediate lessons", "trail-legend": "Finish the Advanced lessons" }[r.unlock] || "Special reward";
}
// make sure every equipped item is still allowed (e.g. after a save was edited)
export function cleanLoadout(p, extra = []) {
  const L = p.loadout, D = defaultLoadout();
  for (const [slot, list] of Object.entries(GARAGE)) { const it = list.find((x) => x.id === L[slot]); if (!it || !itemUnlocked(p, it, extra)) L[slot] = D[slot]; }
  if (!/^#[0-9a-f]{6}$/i.test(L.paint)) L.paint = D.paint; if (!/^#[0-9a-f]{6}$/i.test(L.accent)) L.accent = D.accent;
  return L;
}
const allItems = () => Object.entries(GARAGE).flatMap(([slot, list]) => list.map((it) => ({ slot, ...it })));

// ---- applying results ----
// shared tail: new achievements, level-ups and newly unlocked garage items
function settle(p, beforeXp, ctx, max, extra) {
  const L0 = levelInfo(beforeXp).level, L1 = levelInfo(p.xp).level;
  const lockedBefore = allItems().filter((it) => !itemUnlocked({ ...p, xp: beforeXp, achievements: { ...ctx._achBefore }, unlocks: ctx._unlBefore || p.unlocks }, it, extra));
  const achievements = [];
  for (let pass = 0; pass < 2; pass++) for (const a of ACHIEVEMENTS) if (!p.achievements[a.id] && a.test(p.stats, ctx, max, levelInfo(p.xp).level)) { p.achievements[a.id] = ctx.now || 1; achievements.push(a.id); }
  const unlocked = lockedBefore.filter((it) => itemUnlocked(p, it, extra)).map((it) => ({ slot: it.slot, id: it.id, name: it.name }));
  const levelUps = []; for (let l = L0 + 1; l <= L1; l++) levelUps.push(l);
  return { levelUps, achievements, unlocked };
}
const MAXES = (max) => Object.assign({ lessonStars: 0 }, max || {});

// s = { won, draw, goals, assists, saves, shots, mvp, overtime, score:[mine, theirs], wasBehind, aerialGoals, topGoalKph, arena, mode, opponent }
export function recordMatch(p, s, ctx = {}, max) {
  const before = p.xp, achBefore = { ...p.achievements };
  const { xp, breakdown } = matchXP(s);
  const st = p.stats;
  st.matches++; if (s.won) st.wins++; else if (s.draw) st.draws++; else st.losses++;
  st.goals += s.goals; st.assists += s.assists; st.saves += s.saves; st.shots += s.shots;
  if (s.mvp) st.mvps++;
  st.aerialGoals += s.aerialGoals || 0; st.topGoalKph = Math.max(st.topGoalKph, s.topGoalKph || 0);
  if (s.won && s.overtime) st.overtimeWins++;
  if (s.won && s.wasBehind) st.comebacks++;
  if (s.won && s.score && s.score[1] === 0) st.cleanSheets++;
  if (s.goals >= 3) st.hatTricks++;
  if (s.arena && !st.arenas.includes(s.arena)) st.arenas.push(s.arena);
  p.xp += xp;
  p.history.unshift({ t: ctx.now || 0, mode: s.mode || "match", score: s.score, won: !!s.won, draw: !!s.draw, ot: !!s.overtime, goals: s.goals, assists: s.assists, saves: s.saves, mvp: !!s.mvp, xp, vs: s.opponent || "", arena: s.arena || "" });
  p.history = p.history.slice(0, 20);
  return { xp, breakdown, ...settle(p, before, { ...ctx, _achBefore: achBefore }, MAXES(max), ctx.extra || []) };
}
// lessons: XP only for NEW stars (no farming the same lesson)
export function recordLesson(p, { stars, prevStars = 0, tiersDone, totalStars }, ctx = {}, max) {
  const before = p.xp, achBefore = { ...p.achievements };
  const gained = Math.max(0, stars - prevStars), first = prevStars === 0 && stars > 0;
  const breakdown = []; if (first) breakdown.push(["Lesson complete", XP.lessonFirst]); if (gained) breakdown.push([`New stars ×${gained}`, gained * XP.lessonStar]);
  const xp = breakdown.reduce((t, [, v]) => t + v, 0);
  if (first) p.stats.lessonsDone++;
  if (totalStars !== undefined) p.stats.lessonStars = totalStars; else p.stats.lessonStars += gained;
  if (tiersDone !== undefined) p.stats.tiersDone = Math.max(p.stats.tiersDone, tiersDone);
  p.xp += xp;
  return { xp, breakdown, ...settle(p, before, { ...ctx, _achBefore: achBefore }, MAXES(max), ctx.extra || []) };
}
export function recordCup(p, { won, hardest }, ctx = {}, max) {
  const before = p.xp, achBefore = { ...p.achievements }, unlBefore = [...p.unlocks];
  const breakdown = [["Cup finished", XP.cupPlayed]]; if (won) breakdown.push(["Cup champion!", XP.cupWon]);
  const xp = breakdown.reduce((t, [, v]) => t + v, 0);
  p.stats.cupsPlayed++; if (won) p.stats.cupsWon++;
  if (won) for (const id of ["paint-gold", "rims-gold", "trail-champion", "trophy-garage", "banner-champion"]) if (!p.unlocks.includes(id)) p.unlocks.push(id);
  p.xp += xp;
  return { xp, breakdown, ...settle(p, before, { ...ctx, cupWon: won, hardest, _achBefore: achBefore, _unlBefore: unlBefore }, MAXES(max), ctx.extra || []) };
}
// the garage: changing the car for the first time earns "Fresh Look"
export function recordGarage(p, ctx = {}) {
  const achBefore = { ...p.achievements };
  return settle(p, p.xp, { ...ctx, garage: true, _achBefore: achBefore }, MAXES(), ctx.extra || []);
}
// one-time catch-up for players who already had Academy / Cup progress before the career existed
export function backfill(p, { lessonStars = 0, lessonsDone = 0, tiersDone = 0, cupsWon = 0, cupsPlayed = 0, unlocks = [] }, max) {
  if (p.backfilled) return null;
  p.backfilled = true;
  const before = p.xp, achBefore = { ...p.achievements }, unlBefore = [...p.unlocks];
  p.stats.lessonStars = Math.max(p.stats.lessonStars, lessonStars); p.stats.lessonsDone = Math.max(p.stats.lessonsDone, lessonsDone);
  p.stats.tiersDone = Math.max(p.stats.tiersDone, tiersDone); p.stats.cupsWon = Math.max(p.stats.cupsWon, cupsWon); p.stats.cupsPlayed = Math.max(p.stats.cupsPlayed, cupsPlayed);
  for (const u of unlocks) if (!p.unlocks.includes(u)) p.unlocks.push(u);
  p.xp += lessonStars * XP.lessonStar + lessonsDone * XP.lessonFirst + cupsWon * XP.cupWon + cupsPlayed * XP.cupPlayed;
  return settle(p, before, { _achBefore: achBefore, _unlBefore: unlBefore }, MAXES(max), []);
}
