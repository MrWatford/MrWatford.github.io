// Ringfall: saving. Three local slots in this browser's localStorage (saves are small: a few KB).
// Every load is checked: unknown keys are dropped, numbers are clamped, lists are filtered to known ids.
import { MISSIONS, WEAPON_ORDER, CORES_HIDDEN, EMBLEMS, RECORDINGS, SUITS, UPGRADES, VEHICLES } from "./content.js";

export const SAVE_VERSION = 1;
const KEY = (n) => `aegis-frontier-slot-${n}`;
const SETTINGS_KEY = "aegis-frontier-settings";
export const MAX_IMPORT = 200000;

export const DEFAULT_SETTINGS = {
  sens: 1, invert: false, fov: 75, quality: "low", music: 0.4, sfx: 0.7, mute: false,
  subtitles: true, textScale: 1, reduceMotion: false, reducedFlash: false, showPerf: false, headBob: true, shake: 1, aimAssist: true, ctrlCrouch: false,
  mods: {},
};

export function newState(difficulty = "standard") {
  return {
    v: SAVE_VERSION, created: Date.now(), saved: Date.now(), playtime: 0,
    difficulty, mode: "campaign",
    mission: "m1", obj: 0, completed: [],
    flags: [], collected: [], coreIds: [], read: [],
    cores: 0, sp: 0,
    upgrades: { tether: 0, beacon: 0, barrier: 0, dash: 0, shield: 0 },
    weapons: ["pistol"], loadout: ["pistol", null], ammo: {},
    throwables: { emp: 2, stasis: 2 },
    suit: "suit:classic", unlockedSuits: ["suit:classic"],
    checkpoint: null, // { x, y, z, yaw }
    discovered: [],    // site ids seen
    stats: { takedowns: 0, rescues: 0, bases: 0, strongholds: 0, commanders: 0, deaths: 0 },
    campaignDone: false,
    courses: {},       // best times
  };
}

const ID_SETS = () => ({
  mission: new Set(MISSIONS.map((m) => m.id).concat(["done"])),
  weapons: new Set(WEAPON_ORDER),
  collect: new Set([...CORES_HIDDEN, ...EMBLEMS, ...RECORDINGS].map((d) => d.id)),
  recs: new Set(RECORDINGS.map((r) => r.id)),
  suits: new Set(SUITS.map((s) => s.id)),
});

const num = (v, lo, hi, def) => (typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
const strList = (v, ok, max = 400) => (Array.isArray(v) ? [...new Set(v.filter((s) => typeof s === "string" && s.length < 60 && (!ok || ok(s))))].slice(0, max) : []);

// Returns a clean state, or throws an Error with a friendly message.
export function validate(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("This isn't a Ringfall save.");
  if (typeof raw.v !== "number") throw new Error("This save is missing its version number.");
  if (raw.v > SAVE_VERSION) throw new Error("This save comes from a newer version of the game.");
  const S = newState(["explorer", "standard", "veteran"].includes(raw.difficulty) ? raw.difficulty : "standard");
  const I = ID_SETS();
  S.created = num(raw.created, 0, 9e15, Date.now()); S.saved = num(raw.saved, 0, 9e15, Date.now());
  S.playtime = num(raw.playtime, 0, 1e8, 0);
  S.mission = I.mission.has(raw.mission) ? raw.mission : "m1";
  S.obj = Math.floor(num(raw.obj, 0, 20, 0));
  S.completed = strList(raw.completed, (s) => I.mission.has(s));
  S.flags = strList(raw.flags, (s) => /^[a-z0-9:_]+$/i.test(s), 600);
  S.collected = strList(raw.collected, (s) => I.collect.has(s));
  S.coreIds = strList(raw.coreIds, (s) => /^[a-z0-9]+$/i.test(s), 30).slice(0, 30);
  S.read = strList(raw.read, (s) => I.recs.has(s));
  S.cores = Math.floor(num(raw.cores, 0, 30, 0));
  S.sp = Math.floor(num(raw.sp, 0, 99999, 0));
  if (raw.upgrades && typeof raw.upgrades === "object") for (const k of Object.keys(UPGRADES)) S.upgrades[k] = Math.floor(num(raw.upgrades[k], 0, 4, 0));
  // spent cores can never exceed earned cores
  const spent = Object.values(S.upgrades).reduce((a, t) => a + [0, 1, 2, 4, 6][t], 0);
  if (spent > S.coreIds.length) { for (const k in S.upgrades) S.upgrades[k] = 0; }
  S.cores = Math.max(0, S.coreIds.length - Object.values(S.upgrades).reduce((a, t) => a + [0, 1, 2, 4, 6][t], 0));
  S.weapons = strList(raw.weapons, (s) => I.weapons.has(s));
  if (!S.weapons.includes("pistol")) S.weapons.unshift("pistol");
  const lo = Array.isArray(raw.loadout) ? raw.loadout : [];
  S.loadout = [S.weapons.includes(lo[0]) ? lo[0] : "pistol", S.weapons.includes(lo[1]) && lo[1] !== lo[0] ? lo[1] : null];
  if (raw.ammo && typeof raw.ammo === "object") for (const w of S.weapons) {
    const a = raw.ammo[w];
    if (Array.isArray(a) && a.length === 2) S.ammo[w] = [Math.floor(num(a[0], 0, 500, 0)), Math.floor(num(a[1], 0, 1000, 0))];
  }
  if (raw.throwables && typeof raw.throwables === "object") { S.throwables.emp = Math.floor(num(raw.throwables.emp, 0, 3, 2)); S.throwables.stasis = Math.floor(num(raw.throwables.stasis, 0, 3, 2)); }
  S.unlockedSuits = strList(raw.unlockedSuits, (s) => I.suits.has(s));
  if (!S.unlockedSuits.includes("suit:classic")) S.unlockedSuits.unshift("suit:classic");
  S.suit = S.unlockedSuits.includes(raw.suit) ? raw.suit : "suit:classic";
  if (raw.checkpoint && typeof raw.checkpoint === "object") {
    const c = raw.checkpoint;
    if ([c.x, c.y, c.z].every((v) => typeof v === "number" && isFinite(v) && Math.abs(v) < 700)) S.checkpoint = { x: c.x, y: c.y, z: c.z, yaw: num(c.yaw, -10, 10, 0) };
  }
  S.discovered = strList(raw.discovered, (s) => /^[A-Za-z0-9]+$/.test(s), 80);
  if (raw.stats && typeof raw.stats === "object") for (const k of Object.keys(S.stats)) S.stats[k] = Math.floor(num(raw.stats[k], 0, 1e7, 0));
  S.campaignDone = raw.campaignDone === true;
  if (raw.courses && typeof raw.courses === "object") for (const k of ["rc1", "rc2", "gr1", "gr2"]) if (typeof raw.courses[k] === "number") S.courses[k] = num(raw.courses[k], 1, 9999, 9999);
  return S;
}

export const Saves = {
  available() { try { localStorage.setItem("aegis-test", "1"); localStorage.removeItem("aegis-test"); return true; } catch (e) { return false; } },
  read(n) {
    let txt;
    try { txt = localStorage.getItem(KEY(n)); } catch (e) { return { empty: true }; }
    if (!txt) return { empty: true };
    try { return { state: validate(JSON.parse(txt)) }; }
    catch (e) { return { corrupt: true, error: e.message }; }
  },
  write(n, state) {
    try { state.saved = Date.now(); localStorage.setItem(KEY(n), JSON.stringify(state)); return true; }
    catch (e) { return false; }
  },
  remove(n) { try { localStorage.removeItem(KEY(n)); } catch (e) {} },
  exportText(state) { return JSON.stringify({ game: "aegis-frontier", ...state }, null, 1); },
  importText(txt) {
    if (typeof txt !== "string" || txt.length > MAX_IMPORT) throw new Error("That file is too large to be a save.");
    let raw;
    try { raw = JSON.parse(txt); } catch (e) { throw new Error("That file isn't readable save data."); }
    if (!raw || raw.game !== "aegis-frontier") throw new Error("That file isn't a Ringfall save.");
    delete raw.game;
    return validate(raw);
  },
  loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      const out = { ...DEFAULT_SETTINGS, mods: {} };
      for (const k in DEFAULT_SETTINGS) if (k !== "mods" && typeof s[k] === typeof DEFAULT_SETTINGS[k]) out[k] = s[k];
      out.sens = num(out.sens, 0.2, 3, 1); out.fov = num(out.fov, 60, 100, 75); out.music = num(out.music, 0, 1, 0.4); out.sfx = num(out.sfx, 0, 1, 0.7);
      out.textScale = num(out.textScale, 0.9, 1.5, 1); out.shake = num(out.shake, 0, 1, 1);
      if (!["low", "medium", "high"].includes(out.quality)) out.quality = "low";
      if (s.mods && typeof s.mods === "object") for (const k of ["confetti", "boost", "cooldown", "minimal", "banter"]) out.mods[k] = s.mods[k] === true;
      return out;
    } catch (e) { return { ...DEFAULT_SETTINGS, mods: {} }; }
  },
  saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} },
};
