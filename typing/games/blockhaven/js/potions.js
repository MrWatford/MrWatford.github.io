// Milestone 16: brewing and potions. Every potion, what goes in the Brewing Stand to make it, and the potion pictures.
// Recipes, times, and strengths follow Minecraft Java Edition 1.20.1; names and wording are Blockhaven's own.
// A potion in a slot: { id: I.POTION (or SPLASH_POTION / LINGERING_POTION), n: 1, pot: "swiftness", mod: "long" | "strong" | undefined }
import { I } from "./blocks.js";

// eff: [effect key, level] pairs (keys match main.js effects). dur/long/strongDur in seconds. instant: "heal" | "harm".
export const POTIONS = {
  water: { name: "Water Bottle", color: "#385dc6" },
  awkward: { name: "Awkward Potion", color: "#385dc6", note: "A starting point for most potions" },
  mundane: { name: "Mundane Potion", color: "#385dc6", note: "Does nothing" },
  thick: { name: "Thick Potion", color: "#385dc6", note: "Does nothing" },
  night_vision: { name: "Night Vision", color: "#1f1fa1", eff: [["nightVision", 1]], dur: 180, long: 480 },
  invisibility: { name: "Invisibility", color: "#7f8392", eff: [["invis", 1]], dur: 180, long: 480 },
  leaping: { name: "Leaping", color: "#22ff4c", eff: [["jump", 1]], dur: 180, long: 480, strongDur: 90 },
  fire_resistance: { name: "Fire Resistance", color: "#e49a3a", eff: [["fireRes", 1]], dur: 180, long: 480 },
  swiftness: { name: "Swiftness", color: "#7cafc6", eff: [["swift", 1]], dur: 180, long: 480, strongDur: 90 },
  slowness: { name: "Slowness", color: "#5a6c81", eff: [["slow", 1]], dur: 90, long: 240, strongDur: 20, strongLv: 4 },
  turtle_master: { name: "the Turtle Master", color: "#8a6a8a", eff: [["slow", 4], ["resist", 3]], dur: 20, long: 40, strongDur: 20, strongEff: [["slow", 6], ["resist", 4]] },
  water_breathing: { name: "Water Breathing", color: "#2e5299", eff: [["waterBreath", 1]], dur: 180, long: 480 },
  healing: { name: "Healing", color: "#f82423", instant: "heal", strong: true },
  harming: { name: "Harming", color: "#430a09", instant: "harm", strong: true },
  poison: { name: "Poison", color: "#4e9331", eff: [["poison", 1]], dur: 45, long: 90, strongDur: 21.6 },
  regeneration: { name: "Regeneration", color: "#cd5cab", eff: [["regen", 1]], dur: 45, long: 90, strongDur: 22.5 },
  strength: { name: "Strength", color: "#932423", eff: [["strength", 1]], dur: 180, long: 480, strongDur: 90 },
  weakness: { name: "Weakness", color: "#484d48", eff: [["weakness", 1]], dur: 90, long: 240 },
  slow_falling: { name: "Slow Falling", color: "#f7f8e0", eff: [["slowFall", 1]], dur: 90, long: 240 }
};
export const POTION_KEYS = Object.keys(POTIONS);
export const canLong = k => !!POTIONS[k]?.long;
export const canStrong = k => !!(POTIONS[k]?.strongDur || POTIONS[k]?.strong);
// What each effect is called on screen
export const EFFECT_NAMES = { nightVision: "Night Vision", invis: "Invisibility", jump: "Jump Boost", fireRes: "Fire Resistance", swift: "Speed", slow: "Slowness",
  resist: "Resistance", waterBreath: "Water Breathing", poison: "Poison", regen: "Regeneration", strength: "Strength", weakness: "Weakness", slowFall: "Slow Falling" };
const ROMAN = ["", "", " II", " III", " IV", " V", " VI"];

export const isPotion = id => id === I.POTION || id === I.SPLASH_POTION || id === I.LINGERING_POTION;
// The effects a potion gives: [{ key, lv, dur }] or [{ instant, lv }]. mul shrinks times (splash/lingering clouds use less)
export function effectsOf(s, mul = 1) {
  const p = POTIONS[s && s.pot];
  if (!p) return [];
  const strong = s.mod === "strong", long = s.mod === "long";
  if (p.instant) return [{ instant: p.instant, lv: strong ? 2 : 1 }];
  if (!p.eff) return [];
  const eff = strong && p.strongEff ? p.strongEff : p.eff;
  const dur = (strong ? p.strongDur : long ? p.long : p.dur) * mul;
  return eff.map(([key, lv]) => ({ key, lv: strong && !p.strongEff ? (p.strongLv || 2) : lv, dur }));
}
const clock = t => { t = Math.round(t); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
export function potionName(s) {
  const p = POTIONS[s.pot] || POTIONS.water, form = s.id === I.SPLASH_POTION ? "Splash " : s.id === I.LINGERING_POTION ? "Lingering " : "";
  if (!p.eff && !p.instant) return form + p.name;
  return `${form}Potion of ${p.name}${s.mod === "strong" ? " II" : ""}`;
}
// Tooltip lines like "Speed (8:00)" or "Instant Health II"
export function potionLines(s) {
  const p = POTIONS[s.pot];
  if (!p) return [];
  if (p.instant) return [(p.instant === "heal" ? "Instant Health" : "Instant Damage") + (s.mod === "strong" ? " II" : "")];
  if (!p.eff) return [p.note || "No effects"];
  const mul = s.id === I.LINGERING_POTION ? 0.25 : 1;
  return effectsOf(s, mul).map(e => `${EFFECT_NAMES[e.key] || e.key}${ROMAN[e.lv] || ""} (${clock(e.dur)})`);
}
export const hasEffect = s => { const p = POTIONS[s && s.pot]; return !!(p && (p.eff || p.instant)); };

// ---------- the Brewing Stand ----------
let AWKWARD_TO = null, WATER_TO_MUNDANE = null;
function tables() {
  if (AWKWARD_TO) return;
  AWKWARD_TO = { [I.GOLDEN_CARROT]: "night_vision", [I.RABBIT_FOOT]: "leaping", [I.MAGMA_CREAM]: "fire_resistance", [I.SUGAR]: "swiftness",
    [I.SHELL]: "turtle_master", [I.PUFFER]: "water_breathing", [I.GLISTERING_MELON]: "healing", [I.SPIDER_EYE]: "poison",
    [I.WAILER_TEAR]: "regeneration", [I.FLARE_POWDER]: "strength", [I.PHANTOM_MEMBRANE]: "slow_falling" };
  WATER_TO_MUNDANE = new Set([I.SUGAR, I.RABBIT_FOOT, I.GLISTERING_MELON, I.SPIDER_EYE, I.PUFFER, I.MAGMA_CREAM, I.FLARE_POWDER, I.WAILER_TEAR]);
}
// Fermented Skitter Eye turns a potion into its opposite
const CORRUPT = { night_vision: "invisibility", leaping: "slowness", swiftness: "slowness", healing: "harming", poison: "harming", water: "weakness" };
export function isIngredient(id) {
  tables();
  return id === I.WART || id === I.SPARKDUST || id === I.SHINE_DUST || id === I.FERMENTED_EYE || id === I.BOOM_POWDER || id === I.DRAGON_BREATH ||
    AWKWARD_TO[id] !== undefined || WATER_TO_MUNDANE.has(id);
}
// What this bottle turns into with this ingredient, or null if nothing happens
export function brew(s, ing) {
  if (!s || !isPotion(s.id) || !POTIONS[s.pot]) return null;
  tables();
  const k = s.pot, out = (pot, mod = undefined, id = s.id) => ({ id, n: 1, pot, ...(mod ? { mod } : {}) });
  if (ing === I.BOOM_POWDER) return s.id === I.POTION ? out(k, s.mod, I.SPLASH_POTION) : null;                       // Part B: splash
  if (ing === I.DRAGON_BREATH) return s.id === I.SPLASH_POTION ? out(k, s.mod, I.LINGERING_POTION) : null;           // Part B: lingering
  if (k === "water") {
    if (ing === I.WART) return out("awkward");
    if (ing === I.SPARKDUST) return out("mundane");
    if (ing === I.SHINE_DUST) return out("thick");
    if (ing === I.FERMENTED_EYE) return out("weakness");
    if (WATER_TO_MUNDANE.has(ing)) return out("mundane");
    return null;
  }
  if (k === "awkward") return AWKWARD_TO[ing] ? out(AWKWARD_TO[ing]) : null;
  if (ing === I.FERMENTED_EYE && CORRUPT[k]) {
    const to = CORRUPT[k], mod = s.mod === "long" && canLong(to) ? "long" : s.mod === "strong" && canStrong(to) ? "strong" : undefined;
    return out(to, mod);
  }
  if (ing === I.SPARKDUST && canLong(k) && s.mod !== "long") return out(k, "long");
  if (ing === I.SHINE_DUST && canStrong(k) && s.mod !== "strong") return out(k, "strong");
  return null;
}
export const BREW_TIME = 20, FUEL_BREWS = 20;   // seconds per brew; one Flare Powder lasts 20 brews

// ---------- pictures ----------
const iconCache = new Map();
// A bottle (drinking), a round flask (splash) or a tall flask (lingering), filled with the potion's color
export function potionIconURL(s) {
  const color = (POTIONS[s.pot] || POTIONS.water).color, form = s.id === I.SPLASH_POTION ? 1 : s.id === I.LINGERING_POTION ? 2 : 0, key = color + form;
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d"), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x * 2, y * 2, 2, 2); };
  const glass = "#c8dce8", rim = "#8aa4b8", cork = "#8a6235";
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const neck = form === 2 ? x >= 6 && x <= 9 && y >= 2 && y <= 7 : x >= 6 && x <= 9 && y >= 2 && y <= 5;
    const cx = x - 7.5, cy = y - (form === 1 ? 10 : 10.5), r2 = cx * cx + cy * cy * (form === 2 ? 0.7 : 1);
    const body = form === 1 ? r2 < 26 && y >= 5 : form === 2 ? r2 < 18 && y >= 7 : r2 < 24 && y >= 6;
    if (y <= 2 && x >= 6 && x <= 9) px(x, y, cork);
    else if (neck) px(x, y, x === 6 || x === 9 ? rim : glass);
    else if (body) {
      const edge = form === 1 ? r2 > 19 : form === 2 ? r2 > 12 : r2 > 17;
      px(x, y, edge ? rim : y > (form === 1 ? 7 : 8) ? color : glass);
    }
  }
  g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(10, 18, 2, 4);   // a shine on the glass
  const url = c.toDataURL();
  iconCache.set(key, url);
  return url;
}
