// Milestone 15: enchanting. Which enchantments exist, what each one can go on, and how the
// Enchanting Table picks its three offers. The numbers follow Minecraft Java Edition 1.20.1
// (levels, weights, costs, bookshelf power); the wording is Blockhaven's own.
// An enchanted item keeps its enchantments in its inventory slot: { id, n, dur, ench: { sharpness: 3, ... } }.
import { B, I, itemDef } from "./blocks.js";
import { rng, hashSeed } from "./noise.js";

// on: what it can go on at the Enchanting Table. anvil: extra things an Enchanted Book can add it to (the Anvil comes in Part B).
// group: only one enchantment from a group fits on one item. treasure: never offered by the table (found in treasure instead).
const range = (a, step, width) => l => [a + (l - 1) * step, a + (l - 1) * step + width];
export const ENCH = {
  protection: { name: "Protection", max: 4, w: 10, on: "armor", group: "prot", cost: range(1, 11, 11), desc: "Less damage from almost everything" },
  fire_protection: { name: "Fire Protection", max: 4, w: 5, on: "armor", group: "prot", cost: range(10, 8, 8), desc: "Much less damage from fire and lava" },
  blast_protection: { name: "Blast Protection", max: 4, w: 2, on: "armor", group: "prot", cost: range(5, 8, 8), desc: "Much less damage from explosions" },
  projectile_protection: { name: "Projectile Protection", max: 4, w: 5, on: "armor", group: "prot", cost: range(3, 6, 6), desc: "Much less damage from arrows and shots" },
  feather_falling: { name: "Feather Falling", max: 4, w: 5, on: "boots", cost: range(5, 6, 6), desc: "Much less damage from falling" },
  respiration: { name: "Respiration", max: 3, w: 2, on: "helmet", cost: l => [10 * l, 10 * l + 30], desc: "Hold your breath longer underwater" },
  aqua_affinity: { name: "Aqua Affinity", max: 1, w: 2, on: "helmet", cost: () => [1, 41], desc: "Mine at normal speed underwater" },
  thorns: { name: "Thorns", max: 3, w: 1, on: "chest", anvil: "armor", cost: range(10, 20, 50), desc: "Sometimes hurts creatures that hit you" },
  depth_strider: { name: "Depth Strider", max: 3, w: 2, on: "boots", group: "boots", cost: l => [10 * l, 10 * l + 15], desc: "Swim faster" },
  frost_walker: { name: "Frost Walker", max: 2, w: 2, on: "boots", group: "boots", treasure: true, cost: l => [10 * l, 10 * l + 15], desc: "Freezes water around your feet so you can walk across it" },
  binding_curse: { name: "Curse of Binding", max: 1, w: 1, on: "wearable", treasure: true, curse: true, cost: () => [25, 50], desc: "Can't be taken off until it breaks or you faint" },
  vanishing_curse: { name: "Curse of Vanishing", max: 1, w: 1, on: "any", treasure: true, curse: true, cost: () => [25, 50], desc: "Disappears if you faint" },
  sharpness: { name: "Sharpness", max: 5, w: 10, on: "sword", anvil: "axe", group: "dmg", cost: range(1, 11, 20), desc: "More damage" },
  smite: { name: "Smite", max: 5, w: 5, on: "sword", anvil: "axe", group: "dmg", cost: range(5, 8, 20), desc: "Much more damage to undead creatures" },
  bane_of_arthropods: { name: "Bane of Arthropods", max: 5, w: 5, on: "sword", anvil: "axe", group: "dmg", cost: range(5, 8, 20), desc: "Much more damage to spiders, bugs, and scarabs" },
  knockback: { name: "Knockback", max: 2, w: 5, on: "sword", cost: range(5, 20, 50), desc: "Knocks creatures farther back" },
  fire_aspect: { name: "Fire Aspect", max: 2, w: 2, on: "sword", cost: range(10, 20, 50), desc: "Sets creatures on fire" },
  looting: { name: "Looting", max: 3, w: 2, on: "sword", cost: range(15, 9, 50), desc: "Creatures drop more" },
  sweeping: { name: "Sweeping Edge", max: 3, w: 2, on: "sword", cost: range(5, 9, 15), desc: "Also hits creatures standing next to your target" },
  efficiency: { name: "Efficiency", max: 5, w: 10, on: "digger", anvil: "shears", cost: range(1, 10, 50), desc: "Mine faster" },
  silk_touch: { name: "Silk Touch", max: 1, w: 1, on: "digger", group: "drops", cost: () => [15, 65], desc: "Blocks drop themselves (ores, glass, grass…)" },
  fortune: { name: "Fortune", max: 3, w: 2, on: "digger", group: "drops", cost: range(15, 9, 50), desc: "Ores drop more" },
  unbreaking: { name: "Unbreaking", max: 3, w: 5, on: "durable", cost: range(5, 8, 50), desc: "Wears out more slowly" },
  mending: { name: "Mending", max: 1, w: 2, on: "durable", group: "mend", treasure: true, cost: () => [25, 75], desc: "Experience you collect repairs it" },
  power: { name: "Power", max: 5, w: 10, on: "bow", cost: range(1, 10, 15), desc: "Arrows do more damage" },
  punch: { name: "Punch", max: 2, w: 2, on: "bow", cost: range(12, 20, 25), desc: "Arrows knock creatures back" },
  flame: { name: "Flame", max: 1, w: 2, on: "bow", cost: () => [20, 50], desc: "Arrows set creatures on fire" },
  infinity: { name: "Infinity", max: 1, w: 1, on: "bow", group: "mend", cost: () => [20, 50], desc: "Shooting doesn't use up arrows (you need 1)" },
  luck_of_the_sea: { name: "Luck of the Sea", max: 3, w: 2, on: "rod", cost: range(15, 9, 50), desc: "More treasure when fishing" },
  lure: { name: "Lure", max: 3, w: 2, on: "rod", cost: range(15, 9, 50), desc: "Fish bite sooner" },
  // Milestone 17, Part D: tridents
  loyalty: { name: "Loyalty", max: 3, w: 5, on: "trident", group: "tide", cost: l => [5 + 7 * l, 50], desc: "A thrown trident flies back to you" },
  riptide: { name: "Riptide", max: 3, w: 2, on: "trident", group: "tide", cost: l => [10 + 7 * l, 50], desc: "Throwing it while you're in water launches YOU instead" },
  impaling: { name: "Impaling", max: 5, w: 2, on: "trident", cost: range(1, 8, 20), desc: "Much more damage to sea creatures" },
  quick_charge: { name: "Quick Charge", max: 3, w: 5, on: "crossbow", cost: range(12, 20, 50), desc: "Loads the crossbow faster" },   // Milestone 22, Part C
  multishot: { name: "Multishot", max: 1, w: 2, on: "crossbow", group: "xbow", cost: () => [20, 50], desc: "Fires 3 arrows at once (uses only 1)" },
  piercing: { name: "Piercing", max: 4, w: 10, on: "crossbow", group: "xbow", cost: range(1, 10, 50), desc: "Arrows pass through creatures" },
  channeling: { name: "Channeling", max: 1, w: 1, on: "trident", cost: () => [25, 50], desc: "A thrown trident calls lightning onto what it hits during a thunderstorm" }
};
export const ENCH_KEYS = Object.keys(ENCH);

// ---------- what an item is, for enchanting ----------
// "sword", "axe", "digger" (pickaxe, shovel, hoe), "bow", "rod", "shears", "helmet", "chest", "legs", "boots", "glider", "book", "durable", or null
export function kindOf(id) {
  if (id === I.BOOK || id === I.ENCH_BOOK) return "book";
  const d = itemDef(id);
  if (!d) return null;
  if (d.glider) return "glider";
  if (d.armor) return ["helmet", "chest", "legs", "boots"][d.armor.slot];
  if (d.tool) {
    const t = d.tool.type;
    if (t === "sword" || t === "axe" || t === "bow" || t === "rod" || t === "shears" || t === "trident" || t === "crossbow") return t;
    if (t === "pick" || t === "shovel" || t === "hoe") return "digger";
    return "durable";   // shields, flint and steel, staffs
  }
  return null;
}
const ARMOR_KINDS = ["helmet", "chest", "legs", "boots"];
function targetFits(target, kind) {
  if (!kind || kind === "book") return false;
  switch (target) {
    case "armor": return ARMOR_KINDS.includes(kind);
    case "wearable": return ARMOR_KINDS.includes(kind) || kind === "glider";
    case "helmet": case "chest": case "boots": case "sword": case "bow": case "rod": case "shears": case "axe": case "trident": case "crossbow": return kind === target;
    case "digger": return kind === "digger" || kind === "axe";
    case "durable": case "any": return true;
  }
  return false;
}
// Can this enchantment go on this item? table = the Enchanting Table's rules; otherwise an Enchanted Book on the Anvil.
export function fits(key, id, table = false) {
  const e = ENCH[key], kind = kindOf(id);
  if (!e || !kind) return false;
  if (kind === "book") return true;
  if (targetFits(e.on, kind)) return true;
  return !table && !!e.anvil && targetFits(e.anvil, kind);
}
export function clash(a, b) { return a === b || (!!ENCH[a].group && ENCH[a].group === ENCH[b].group); }

// How easily an item takes enchantments at the table (Java "enchantability"). 0 = not at the table.
const TOOL_ENCH = [0, 15, 5, 14, 10, 15];   // by tier: wood, stone, iron, Skyshard, Duskmetal
const ARMOR_ENCH = { LEATHER: 15, GOLD: 25, IRON: 9, SKY: 10, DUSK: 15 };
const armorMaterial = new Map();
for (const [mat, val] of Object.entries(ARMOR_ENCH)) for (const p of ["HELMET", "CHEST", "LEGS", "BOOTS"]) armorMaterial.set(I[mat + "_" + p], val);
export function enchantability(id) {
  const kind = kindOf(id), d = itemDef(id);
  if (!kind || kind === "glider" || kind === "shears" || kind === "durable") return 0;
  if (kind === "book" || kind === "bow" || kind === "rod" || kind === "trident") return 1;
  if (d.armor) return armorMaterial.get(id) || 10;
  return TOOL_ENCH[Math.max(1, Math.min(5, d.tool.tier || 1))];
}

// ---------- reading an item's enchantments ----------
export const lvl = (s, key) => (s && s.ench && s.ench[key]) || 0;
export const isEnchanted = s => !!(s && s.ench && Object.keys(s.ench).length);
export const enchList = s => (s && s.ench ? Object.entries(s.ench).filter(([k, l]) => ENCH[k] && l > 0) : []);
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
export const roman = n => ROMAN[n] || String(n);
export const enchName = (key, l) => ENCH[key].name + (ENCH[key].max > 1 || l > 1 ? " " + roman(l) : "");
// a copy of a stack whose ench object is its own (so moving or splitting never shares it)
export const cloneStack = s => (s ? { ...s, ...(s.ench ? { ench: { ...s.ench } } : {}) } : s);

// ---------- creatures that Smite and Bane of Arthropods know ----------
export const UNDEAD = new Set(["zombie", "skeleton", "blight", "blightking", "rotboar", "zoglin", "husk", "stray", "drowned", "bogged", "parched",
  "phantom", "zombie_villager", "zombie_nautilus", "bone_trotter", "rot_trotter", "dune_husk", "sand_wraith", "tomb_guardian", "dragon"]);
export const ARTHROPOD = new Set(["spider", "cave_spider", "bee", "endermite", "silverfish", "sunscarab", "dune_scarab", "tidecrab"]);
export const isUndead = e => UNDEAD.has(e.sp) || !!e.def?.undead || /groaner|rattler/.test(e.sp);
export const isArthropod = e => ARTHROPOD.has(e.sp) || !!e.def?.arthropod || /skitter/.test(e.sp);

// ---------- the Enchanting Table ----------
// Bookshelves two blocks away (a ring around the table, at its level and one up) with an empty block between.
export function bookshelfPower(world, x, y, z) {
  let n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (Math.abs(dx) !== 2 && Math.abs(dz) !== 2) continue;
    for (let dy = 0; dy <= 1; dy++) {
      if (world.id(x + dx, y + dy, z + dz) !== B.BOOKSHELF) continue;
      const mx = x + Math.trunc(dx / 2), mz = z + Math.trunc(dz / 2);
      if (world.id(mx, y + dy, mz) === B.AIR) n++;
    }
  }
  return Math.min(15, n);
}
const nextInt = (r, n) => Math.floor(r() * n);
function pickWeighted(r, list) {
  let total = 0; for (const o of list) total += ENCH[o[0]].w;
  let k = nextInt(r, total);
  for (const o of list) { k -= ENCH[o[0]].w; if (k < 0) return o; }
  return list[list.length - 1];
}
// Every enchantment that could come out at this power level, each at its highest fitting level
function available(id, power, treasure) {
  const out = [];
  for (const key of ENCH_KEYS) {
    const e = ENCH[key];
    if ((e.treasure && !treasure) || !fits(key, id, true)) continue;
    for (let l = e.max; l >= 1; l--) { const [lo, hi] = e.cost(l); if (power >= lo && power <= hi) { out.push([key, l]); break; } }
  }
  return out;
}
// Java's selectEnchantment: a list of [key, level]
export function rollEnchantments(r, id, level, treasure = false) {
  const e = enchantability(id);
  if (e <= 0) return [];
  level += 1 + nextInt(r, Math.floor(e / 4) + 1) + nextInt(r, Math.floor(e / 4) + 1);
  const f = (r() + r() - 1) * 0.15;
  level = Math.max(1, Math.round(level + level * f));
  let pool = available(id, level, treasure);
  const out = [];
  if (!pool.length) return out;
  out.push(pickWeighted(r, pool));
  while (nextInt(r, 50) <= level) {
    pool = pool.filter(([k]) => !out.some(([o]) => clash(o, k)));
    if (!pool.length) break;
    out.push(pickWeighted(r, pool));
    level = Math.floor(level / 2);
  }
  if ((id === I.BOOK) && out.length > 1) out.splice(nextInt(r, out.length), 1);   // books get one fewer, like Java
  return out;
}
// The three offers: [{ cost, ench: [[key, level]...], hint: [key, level] } | null]
export function tableOffers(seed, stack, shelves) {
  if (!stack || stack.n !== 1 || isEnchanted(stack) || enchantability(stack.id) <= 0) return [null, null, null];
  const r = rng((seed ^ (stack.id * 0x9E3779B1)) >>> 0);
  const base = 1 + nextInt(r, 8) + (shelves >> 1) + nextInt(r, shelves + 1);
  const costs = [Math.max(Math.floor(base / 3), 1), Math.floor(base * 2 / 3) + 1, Math.max(base, shelves * 2)];
  return costs.map((cost, j) => {
    if (cost < j + 1) return null;
    const list = rollEnchantments(rng((seed + j * 7919 + stack.id) >>> 0), stack.id, cost);
    if (!list.length) return null;
    return { cost, ench: list, hint: list[Math.floor(rng((seed + j) >>> 0)() * list.length)] };
  });
}

// ---------- armor ----------
// Protection points from enchanted armor for this kind of hit (Java "EPF"): each point takes 4% off, up to 20 points (80%).
export function protectionPoints(armorSlots, kind) {
  if (kind === "void" || kind === "starve") return 0;
  let p = 0;
  for (const s of armorSlots) {
    if (!s) continue;
    p += lvl(s, "protection");
    if (kind === "fire") p += 2 * lvl(s, "fire_protection");
    if (kind === "blast") p += 2 * lvl(s, "blast_protection");
    if (kind === "projectile") p += 2 * lvl(s, "projectile_protection");
    if (kind === "fall") p += 3 * lvl(s, "feather_falling");
  }
  return Math.min(20, p);
}
// Unbreaking: does this use actually wear the item down?
export function wears(s, armor = false) {
  const u = lvl(s, "unbreaking");
  if (!u) return true;
  return armor ? Math.random() < 0.6 + 0.4 / (u + 1) : Math.random() < 1 / (u + 1);
}
// Fortune on ores (Java's ore formula): how many times the normal drop
export function fortuneMultiplier(level) {
  if (!level) return 1;
  return Math.max(0, Math.floor(Math.random() * (level + 2)) - 1) + 1;
}

// ---------- how each enchantment changes a hit, used by main.js ----------
export function meleeBonus(s, e) {
  let b = 0;
  const sh = lvl(s, "sharpness"); if (sh) b += 0.5 * sh + 0.5;
  const sm = lvl(s, "smite"); if (sm && isUndead(e)) b += 2.5 * sm;
  const ba = lvl(s, "bane_of_arthropods"); if (ba && isArthropod(e)) b += 2.5 * ba;
  return b;
}

// ---------- the shimmer on enchanted items, and tooltip lines ----------
export function tooltipLines(s) {
  return enchList(s).map(([k, l]) => ({ text: enchName(k, l), curse: !!ENCH[k].curse, desc: ENCH[k].desc }));
}

// ======================================================================
// Milestone 15, Part B: the Anvil, the Grindstone, and enchanted treasure
// ======================================================================
export const maxDurOf = id => { const d = itemDef(id); return d ? (d.tool ? d.tool.dur : d.armor ? d.armor.dur : 0) : 0; };
// What fixes what on the Anvil (each piece repairs a quarter of the item)
const PLANKS = [B.PLANKS, B.BIRCH_PLANKS, B.CRIMSON_PLANKS, B.WARPED_PLANKS];
const MAT_BY_TIER = [null, PLANKS, [B.COBBLE], [I.IRON_INGOT], [I.SKYSHARD], [I.DUSK_INGOT]];
const ARMOR_MAT = { LEATHER: [I.LEATHER], GOLD: [I.GOLD_INGOT], IRON: [I.IRON_INGOT], SKY: [I.SKYSHARD], DUSK: [I.DUSK_INGOT] };
const repairMat = new Map();
for (const [k, mats] of Object.entries(ARMOR_MAT)) for (const p of ["HELMET", "CHEST", "LEGS", "BOOTS"]) repairMat.set(I[k + "_" + p], mats);
for (const [k, t] of [["WOOD", 1], ["STONE", 2], ["IRON", 3], ["SKY", 4], ["DUSK", 5]]) for (const p of ["PICK", "AXE", "SHOVEL", "SWORD", "HOE"]) repairMat.set(I[k + "_" + p], MAT_BY_TIER[t]);
repairMat.set(I.SHIELD, PLANKS);
export const repairsWith = (id, mat) => !!(repairMat.get(id) || []).includes(mat);
export const repairMaterialName = id => { const m = repairMat.get(id); return m ? itemDef(m[0]).name : null; };
const RARITY = { 10: 1, 5: 2, 2: 4, 1: 8 };   // the anvil charges more for rarer enchantments (Java)

// What the Anvil would make. Returns null (nothing to do) or { out, cost, used, too, note }.
//   used = how many of the right-hand item get used up. too = "Too expensive!" (40 levels or more, Survival only).
export function anvilResult(left, right, name, creative) {
  if (!left) return null;
  if (left.id === I.BOOK && right) return { note: "Put the Book in the Enchanting Table instead." };
  const out = cloneStack(left), max = maxDurOf(left.id);
  if (!out.ench) out.ench = {};
  let cost = 0, used = 0, changed = false, note = "";
  if (right) {
    if (max && repairsWith(left.id, right.id)) {   // repair with the material
      if ((left.dur ?? max) >= max) return { note: "It isn't worn out." };
      const per = Math.max(1, Math.floor(max / 4));
      let dur = left.dur ?? max;
      while (used < right.n && dur < max) { dur = Math.min(max, dur + per); used++; }
      out.dur = dur; cost += used; changed = true;
    } else if (right.id === left.id || right.id === I.ENCH_BOOK) {
      const fromBook = right.id === I.ENCH_BOOK;   // enchantments from a book cost half
      if (right.id === left.id && max && (left.dur ?? max) < max) {   // two of the same: join them, plus a little extra
        out.dur = Math.min(max, (left.dur ?? max) + (right.dur ?? max) + Math.floor(max * 0.12));
        cost += 2; changed = true;
      }
      let added = false, fitted = 0, clashed = 0;
      for (const [k, rl] of enchList(right)) {
        if (!fits(k, left.id)) { cost += 1; continue; }
        if (Object.keys(out.ench).some(o => o !== k && clash(o, k))) { cost += 1; clashed++; continue; }
        fitted++;
        const ll = out.ench[k] || 0, nl = ll === rl ? Math.min(ENCH[k].max, rl + 1) : Math.max(ll, rl);
        if (nl !== ll) { out.ench[k] = nl; added = true; }
        let mult = RARITY[ENCH[k].w] || 1; if (fromBook) mult = Math.max(1, mult / 2);
        cost += nl * mult;
      }
      if (fromBook && !added) return { note: fitted ? "That wouldn't make it any stronger." : clashed ? "That enchantment can't go with one it already has." : "That enchantment doesn't fit this item." };
      changed = changed || added;
      used = 1;
    } else return { note: "These two can't be combined." };
  }
  const want = (name || "").trim().slice(0, 30), had = left.name || "";
  if (want !== had) { if (want && want !== itemDef(left.id).name) out.name = want; else delete out.name; cost += 1; changed = true; }
  if (!changed) return null;
  if (!Object.keys(out.ench).length) delete out.ench;
  const penalty = (left.rc || 0) + (right ? right.rc || 0 : 0);
  cost += penalty;
  if (right) out.rc = Math.max(left.rc || 0, right.rc || 0) * 2 + 1;   // each trip to the anvil costs more next time
  return { out, cost, used, too: !creative && cost >= 40 };
}

// What the Grindstone would make: enchantments off (curses stay), experience back. { out, xp } or { note }.
export function grindResult(a, b) {
  if (!a && !b) return null;
  const items = [a, b].filter(Boolean);
  if (items.length === 2 && (a.id !== b.id || !maxDurOf(a.id))) return { note: "Only two of the same tool, weapon, or armor can be joined here." };
  const base = items[0], max = maxDurOf(base.id);
  if (items.length === 1 && !isEnchanted(base)) return { note: "That has no enchantments to remove." };
  let xpPoints = 0;
  const curses = {};
  for (const s of items) for (const [k, l] of enchList(s)) { if (ENCH[k].curse) curses[k] = Math.max(curses[k] || 0, l); else xpPoints += ENCH[k].cost(l)[0]; }
  if (items.length === 1 && !xpPoints) return { note: "Curses can't be ground off." };
  const out = { id: base.id === I.ENCH_BOOK && !Object.keys(curses).length ? I.BOOK : base.id, n: 1 };
  if (max) out.dur = items.length === 2 ? Math.min(max, (a.dur ?? max) + (b.dur ?? max) + Math.floor(max * 0.05)) : base.dur ?? max;
  if (base.name) out.name = base.name;
  if (Object.keys(curses).length) out.ench = curses;
  return { out, xp: Math.ceil(xpPoints * 0.75) };   // Java gives a random amount between half and all; this is its average, so the button can show it
}

// ---------- enchanted treasure ----------
// A book with one random enchantment at a random level (Java "enchant randomly"); curses allowed unless noCurse
export function randomBookEnch(r, noCurse = false) {
  const keys = ENCH_KEYS.filter(k => !(noCurse && ENCH[k].curse));
  const k = keys[Math.floor(r() * keys.length)], l = 1 + Math.floor(r() * ENCH[k].max);
  return { [k]: l };
}
// Enchant an item as if at a table of this level (treasure enchantments allowed), for loot
export function enchantForLoot(r, id, level) {
  const list = rollEnchantments(r, id, level, true);
  return list.length ? Object.fromEntries(list) : null;
}
// The book a Scribe (or the Wanderer) sells: decided by who they are, so it stays the same for that villager
export function villagerBook(key, pricier = false) {
  const r = rng(hashSeed(String(key)));
  const keys = ENCH_KEYS.filter(k => !ENCH[k].curse);
  const k = keys[Math.floor(r() * keys.length)], l = 1 + Math.floor(r() * ENCH[k].max);
  let price = 3 + 3 * l + Math.floor(r() * (3 + 2 * l));
  if (ENCH[k].treasure) price *= 2;
  if (pricier) price += 4;
  return { ench: { [k]: l }, price: Math.min(48, price) };
}
