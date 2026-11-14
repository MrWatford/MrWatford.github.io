// Turbo League — checking saved data before the game uses it.
// Everything is stored in this browser (localStorage). A save can be damaged (an old version, a half-written
// save, someone editing it), so each one is repaired here: unknown or broken values fall back to safe defaults,
// and a save that can't be repaired is dropped instead of crashing the game. Pure functions (Node + test.html).

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const num = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const bool = (v, d) => (typeof v === "boolean" ? v : d);

// settings: keep only known keys, with the right kind of value and a sensible range
const RANGES = { scale: [0.5, 1.25], fov: [80, 115], camDist: [2.2, 4], camHeight: [0.6, 1.8], camStiff: [0, 1], master: [0, 1], sfx: [0, 1], crowd: [0, 1], music: [0, 1] };
export const QUALITIES = ["low", "medium", "high", "ultra"];
export function cleanSettings(raw, defaults, choices = {}) {
  const S = JSON.parse(JSON.stringify(defaults));
  if (!isObj(raw)) return S;
  for (const [k, d] of Object.entries(defaults)) {
    const v = raw[k];
    if (k === "quality") S.quality = oneOf(v, QUALITIES, d);
    else if (RANGES[k]) S[k] = num(v, RANGES[k][0], RANGES[k][1], d);
    else if (typeof d === "boolean") S[k] = bool(v, d);
    else if (isObj(d)) { S[k] = { ...d }; if (isObj(v)) for (const [kk, dd] of Object.entries(d)) { const c = choices[k] && choices[k][kk]; const vv = v[kk]; S[k][kk] = c ? oneOf(vv, c, dd) : typeof dd === typeof vv ? vv : dd; } }
    else if (typeof d === typeof v) S[k] = v;
  }
  return S;
}

// Training Academy progress: { done: {lessonId: stars 0-3}, unlocks: [ids], trail, paint, rims }
export function cleanAcademy(raw, lessonIds) {
  const A = { done: {}, unlocks: [], trail: null };
  if (!isObj(raw)) return A;
  if (isObj(raw.done)) for (const id of lessonIds) { const s = raw.done[id]; if (typeof s === "number" && s >= 1) A.done[id] = Math.min(3, Math.floor(s)); }
  if (Array.isArray(raw.unlocks)) A.unlocks = [...new Set(raw.unlocks.filter((u) => typeof u === "string" && /^[a-z-]{2,30}$/.test(u)))];
  for (const k of ["trail", "paint", "rims"]) if (typeof raw[k] === "string") A[k] = raw[k];
  return A;
}

// the Championship Cup in progress: if anything important is missing, the cup is dropped (the Hall keeps finished cups)
export function cleanCup(raw) {
  if (!isObj(raw)) return null;
  const okGroups = Array.isArray(raw.groups) && raw.groups.length === 4 && raw.groups.every((g) => Array.isArray(g) && g.length === 4 && g.every((x) => typeof x === "string"));
  const okTeams = Array.isArray(raw.teams) && raw.teams.length === 16 && raw.teams.every((t) => isObj(t) && typeof t.id === "string" && typeof t.name === "string");
  const okFix = Array.isArray(raw.fixtures) && raw.fixtures.length >= 24 && raw.fixtures.every((f) => isObj(f) && typeof f.home === "string" && typeof f.away === "string" && (f.score == null || (Array.isArray(f.score) && f.score.length === 2 && f.score.every((n) => Number.isInteger(n) && n >= 0 && n < 100))));
  if (!okGroups || !okTeams || !okFix || typeof raw.stage !== "string") return null;
  return raw;
}

// the Hall of Champions: keep only entries that have what the Hall screen shows
export function cleanHall(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((h) => isObj(h) && isObj(h.champion) && typeof h.champion.name === "string" && isObj(h.record) && typeof h.final === "string").slice(0, 60);
}

// career numbers: every stat must be a whole number (arenas a list of names)
export function cleanStats(stats, defaults) {
  const out = { ...defaults };
  if (!isObj(stats)) return out;
  for (const [k, d] of Object.entries(defaults)) {
    if (Array.isArray(d)) out[k] = Array.isArray(stats[k]) ? stats[k].filter((x) => typeof x === "string").slice(0, 20) : [];
    else out[k] = typeof stats[k] === "number" && Number.isFinite(stats[k]) && stats[k] >= 0 ? Math.floor(Math.min(stats[k], 1e7)) : d;
  }
  return out;
}
