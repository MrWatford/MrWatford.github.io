// Every block and item in Blockhaven: what it is, how it behaves, how it's crafted,
// and the pixel-art textures (all drawn by code, so every picture is original).
import { rng } from "./noise.js";

export const CHUNK = 16, HEIGHT = 80, SEA = 30;

export const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, SAND: 5, GRAVEL: 6, LOG: 7, LEAVES: 8, PLANKS: 9,
  GLASS: 10, WATER: 11, COAL_ORE: 12, IRON_ORE: 13, SKY_ORE: 14, TABLE: 15, FURNACE: 16, CHEST: 17,
  TORCH: 18, BEDROCK: 19, TALL_GRASS: 20, FLOWER_RED: 21, FLOWER_YELLOW: 22, BRICKS: 23, STONE_BRICKS: 24,
  SANDSTONE: 25, MOSSY: 26, IRON_BLOCK: 27, BIRCH_LOG: 28, BIRCH_LEAVES: 29, BIRCH_PLANKS: 30, SNOW: 31,
  CLAY: 32, DOOR: 33
};
export const I = {
  STICK: 256, COAL: 257, IRON_INGOT: 258, SKYSHARD: 259, APPLE: 260, CLAY_BALL: 261, BRICK: 262,
  WOOD_PICK: 270, WOOD_AXE: 271, WOOD_SHOVEL: 272, WOOD_SWORD: 273,
  STONE_PICK: 274, STONE_AXE: 275, STONE_SHOVEL: 276, STONE_SWORD: 277,
  IRON_PICK: 278, IRON_AXE: 279, IRON_SHOVEL: 280, IRON_SWORD: 281,
  SKY_PICK: 282, SKY_AXE: 283, SKY_SHOVEL: 284, SKY_SWORD: 285
};

// A block value stores the block id in the low 8 bits and extra state ("meta") in the high 8 bits.
export const idOf = v => v & 255;
export const metaOf = v => v >> 8;
export const make = (id, meta = 0) => id | (meta << 8);
// Meta bits: facing 0-3 (0 = +z, 1 = +x, 2 = -z, 3 = -x), OPEN for doors, TOP for door tops, LIT for furnaces
export const OPEN = 4, TOP = 8, LIT = 4;

// ---------- Block definitions ----------
// shape: cube | cross | torch | water | door      render: opaque | cutout | water
// tool: preferred tool type; tier: tool tier needed to get a drop (1 wood, 2 stone, 3 iron)
const defs = {};
function block(id, name, o) {
  defs[id] = Object.assign({ id, name, shape: "cube", render: "opaque", solid: true, hardness: 1, tool: null, tier: 0, light: 0, drops: id, interact: null, category: "Building" }, o);
}
block(B.AIR, "Air", { shape: "none", render: "none", solid: false, hardness: 0, drops: 0 });
block(B.GRASS, "Grassy Dirt", { hardness: 0.6, tool: "shovel", drops: B.DIRT, tex: ["grass_top", "grass_side", "dirt"], category: "Nature" });
block(B.DIRT, "Dirt", { hardness: 0.5, tool: "shovel", tex: "dirt", category: "Nature" });
block(B.STONE, "Stone", { hardness: 1.5, tool: "pick", tier: 1, drops: B.COBBLE, tex: "stone", category: "Nature" });
block(B.COBBLE, "Cobblestone", { hardness: 2, tool: "pick", tier: 1, tex: "cobble" });
block(B.SAND, "Sand", { hardness: 0.5, tool: "shovel", tex: "sand", category: "Nature" });
block(B.GRAVEL, "Gravel", { hardness: 0.6, tool: "shovel", tex: "gravel", category: "Nature" });
block(B.LOG, "Oak Log", { hardness: 2, tool: "axe", tex: ["log_top", "log_side", "log_top"], category: "Nature" });
block(B.LEAVES, "Oak Leaves", { hardness: 0.2, render: "cutout", drops: "leaves", tex: "leaves", category: "Nature" });
block(B.PLANKS, "Oak Planks", { hardness: 2, tool: "axe", tex: "planks" });
block(B.GLASS, "Glass", { hardness: 0.3, render: "cutout", drops: 0, tex: "glass" });
block(B.WATER, "Water", { shape: "water", render: "water", solid: false, hardness: 0, drops: 0, tex: "water", category: "Nature" });
block(B.COAL_ORE, "Coal Ore", { hardness: 3, tool: "pick", tier: 1, drops: I.COAL, tex: "coal_ore", category: "Nature" });
block(B.IRON_ORE, "Iron Ore", { hardness: 3, tool: "pick", tier: 2, tex: "iron_ore", category: "Nature" });
block(B.SKY_ORE, "Skyshard Ore", { hardness: 3.5, tool: "pick", tier: 3, drops: I.SKYSHARD, light: 3, tex: "sky_ore", category: "Nature" });
block(B.TABLE, "Workbench", { hardness: 2.5, tool: "axe", interact: "table", tex: ["table_top", "table_side", "planks"], category: "Useful" });
block(B.FURNACE, "Furnace", { hardness: 3.5, tool: "pick", tier: 1, interact: "furnace", tex: ["furnace_top", "furnace_side", "furnace_top"], front: "furnace_front", category: "Useful" });
block(B.CHEST, "Chest", { hardness: 2.5, tool: "axe", interact: "chest", tex: ["chest_top", "chest_side", "chest_top"], front: "chest_front", category: "Useful" });
block(B.TORCH, "Torch", { shape: "torch", render: "cutout", solid: false, hardness: 0, light: 14, tex: "torch", category: "Useful" });
block(B.BEDROCK, "Deepstone", { hardness: Infinity, drops: 0, tex: "bedrock", category: "Nature" });
block(B.TALL_GRASS, "Tall Grass", { shape: "cross", render: "cutout", solid: false, hardness: 0, drops: 0, tex: "tall_grass", replaceable: true, category: "Nature" });
block(B.FLOWER_RED, "Red Poppy", { shape: "cross", render: "cutout", solid: false, hardness: 0, tex: "flower_red", category: "Nature" });
block(B.FLOWER_YELLOW, "Sunbell", { shape: "cross", render: "cutout", solid: false, hardness: 0, tex: "flower_yellow", category: "Nature" });
block(B.BRICKS, "Bricks", { hardness: 2, tool: "pick", tier: 1, tex: "bricks" });
block(B.STONE_BRICKS, "Stone Bricks", { hardness: 1.5, tool: "pick", tier: 1, tex: "stone_bricks" });
block(B.SANDSTONE, "Sandstone", { hardness: 0.8, tool: "pick", tier: 1, tex: ["sandstone_top", "sandstone_side", "sandstone_top"] });
block(B.MOSSY, "Mossy Cobblestone", { hardness: 2, tool: "pick", tier: 1, tex: "mossy" });
block(B.IRON_BLOCK, "Block of Iron", { hardness: 5, tool: "pick", tier: 2, tex: "iron_block" });
block(B.BIRCH_LOG, "Birch Log", { hardness: 2, tool: "axe", tex: ["birch_top", "birch_side", "birch_top"], category: "Nature" });
block(B.BIRCH_LEAVES, "Birch Leaves", { hardness: 0.2, render: "cutout", drops: "leaves", tex: "birch_leaves", category: "Nature" });
block(B.BIRCH_PLANKS, "Birch Planks", { hardness: 2, tool: "axe", tex: "birch_planks" });
block(B.SNOW, "Snow", { hardness: 0.3, tool: "shovel", tex: "snow", category: "Nature" });
block(B.CLAY, "Clay", { hardness: 0.6, tool: "shovel", drops: [I.CLAY_BALL, 4], tex: "clay", category: "Nature" });
block(B.DOOR, "Wooden Door", { shape: "door", render: "cutout", hardness: 3, tool: "axe", interact: "door", tex: "door_bottom", category: "Useful" });
export const BLOCKS = defs;
export const blockDef = v => defs[v & 255] || defs[0];

// Lookup tables for speed (used thousands of times per frame by the mesher and physics)
export const OPAQUE = new Uint8Array(256);     // full cube that hides neighbors and blocks light
export const SOLID = new Uint8Array(256);      // player collides with it
export const EMIT = new Uint8Array(256);       // light given off
for (const d of Object.values(defs)) {
  OPAQUE[d.id] = d.shape === "cube" && d.render === "opaque" ? 1 : 0;
  SOLID[d.id] = d.solid ? 1 : 0;
  EMIT[d.id] = d.light;
}
export const lightOf = v => (idOf(v) === B.FURNACE && (metaOf(v) & LIT)) ? 13 : EMIT[v & 255];

// ---------- Items ----------
const items = {};
for (const d of Object.values(defs)) if (d.id) items[d.id] = { id: d.id, name: d.name, kind: "block", stack: 64, category: d.category };
function item(id, name, o) { items[id] = Object.assign({ id, name, kind: "item", stack: 64, category: "Items" }, o); }
item(I.STICK, "Stick", { icon: "stick" });
item(I.COAL, "Coal", { icon: "coal" });
item(I.IRON_INGOT, "Iron Ingot", { icon: "ingot" });
item(I.SKYSHARD, "Skyshard", { icon: "skyshard" });
item(I.APPLE, "Apple", { icon: "apple", kind: "food", food: 4 });
item(I.CLAY_BALL, "Clay Ball", { icon: "clay_ball" });
item(I.BRICK, "Brick", { icon: "brick" });
const TIERS = [
  { key: "WOOD", label: "Wooden", tier: 1, speed: 2, dur: 60, color: "#b48a52", dark: "#7d5a30" },
  { key: "STONE", label: "Stone", tier: 2, speed: 4, dur: 132, color: "#8d8d8d", dark: "#5b5b5b" },
  { key: "IRON", label: "Iron", tier: 3, speed: 6, dur: 250, color: "#e4e4e4", dark: "#a8a8a8" },
  { key: "SKY", label: "Skyshard", tier: 4, speed: 9, dur: 1200, color: "#62e6ee", dark: "#2a9fb0" }
];
const KINDS = [["PICK", "Pickaxe", "pick"], ["AXE", "Axe", "axe"], ["SHOVEL", "Shovel", "shovel"], ["SWORD", "Sword", "sword"]];
for (const t of TIERS) for (const [k, label, type] of KINDS) {
  item(I[t.key + "_" + k], t.label + " " + label, {
    kind: "tool", stack: 1, category: "Tools", icon: "tool_" + type, colors: [t.color, t.dark],
    tool: { type, tier: t.tier, speed: t.speed, dur: t.dur, damage: type === "sword" ? 3 + t.tier : 1 + t.tier * 0.5 }
  });
}
export const ITEMS = items;
export const itemDef = id => items[id];
export const isBlockItem = id => id > 0 && id < 256;

// ---------- Crafting ----------
// Ingredient ids can be a tag like "planks" meaning any kind of planks.
export const TAGS = { planks: [B.PLANKS, B.BIRCH_PLANKS], logs: [B.LOG, B.BIRCH_LOG] };
export const RECIPES = [
  { out: [B.PLANKS, 4], ins: [[B.LOG, 1]] },
  { out: [B.BIRCH_PLANKS, 4], ins: [[B.BIRCH_LOG, 1]] },
  { out: [I.STICK, 4], ins: [["planks", 2]] },
  { out: [B.TABLE, 1], ins: [["planks", 4]] },
  { out: [B.TORCH, 4], ins: [[I.STICK, 1], [I.COAL, 1]] },
  { out: [B.SANDSTONE, 1], ins: [[B.SAND, 4]] },
  { out: [I.WOOD_PICK, 1], ins: [["planks", 3], [I.STICK, 2]], table: true },
  { out: [I.WOOD_AXE, 1], ins: [["planks", 3], [I.STICK, 2]], table: true },
  { out: [I.WOOD_SHOVEL, 1], ins: [["planks", 1], [I.STICK, 2]], table: true },
  { out: [I.WOOD_SWORD, 1], ins: [["planks", 2], [I.STICK, 1]], table: true },
  { out: [B.CHEST, 1], ins: [["planks", 8]], table: true },
  { out: [B.DOOR, 1], ins: [["planks", 6]], table: true },
  { out: [B.FURNACE, 1], ins: [[B.COBBLE, 8]], table: true },
  { out: [I.STONE_PICK, 1], ins: [[B.COBBLE, 3], [I.STICK, 2]], table: true },
  { out: [I.STONE_AXE, 1], ins: [[B.COBBLE, 3], [I.STICK, 2]], table: true },
  { out: [I.STONE_SHOVEL, 1], ins: [[B.COBBLE, 1], [I.STICK, 2]], table: true },
  { out: [I.STONE_SWORD, 1], ins: [[B.COBBLE, 2], [I.STICK, 1]], table: true },
  { out: [B.STONE_BRICKS, 4], ins: [[B.STONE, 4]], table: true },
  { out: [B.MOSSY, 1], ins: [[B.COBBLE, 1], [B.LEAVES, 1]], table: true },
  { out: [B.BRICKS, 1], ins: [[I.BRICK, 4]], table: true },
  { out: [I.IRON_PICK, 1], ins: [[I.IRON_INGOT, 3], [I.STICK, 2]], table: true },
  { out: [I.IRON_AXE, 1], ins: [[I.IRON_INGOT, 3], [I.STICK, 2]], table: true },
  { out: [I.IRON_SHOVEL, 1], ins: [[I.IRON_INGOT, 1], [I.STICK, 2]], table: true },
  { out: [I.IRON_SWORD, 1], ins: [[I.IRON_INGOT, 2], [I.STICK, 1]], table: true },
  { out: [B.IRON_BLOCK, 1], ins: [[I.IRON_INGOT, 9]], table: true },
  { out: [I.IRON_INGOT, 9], ins: [[B.IRON_BLOCK, 1]], table: true },
  { out: [I.SKY_PICK, 1], ins: [[I.SKYSHARD, 3], [I.STICK, 2]], table: true },
  { out: [I.SKY_AXE, 1], ins: [[I.SKYSHARD, 3], [I.STICK, 2]], table: true },
  { out: [I.SKY_SHOVEL, 1], ins: [[I.SKYSHARD, 1], [I.STICK, 2]], table: true },
  { out: [I.SKY_SWORD, 1], ins: [[I.SKYSHARD, 2], [I.STICK, 1]], table: true }
];
export const SMELT = { [B.IRON_ORE]: I.IRON_INGOT, [B.SAND]: B.GLASS, [B.COBBLE]: B.STONE, [I.CLAY_BALL]: I.BRICK, [B.LOG]: I.COAL, [B.BIRCH_LOG]: I.COAL };
export const FUEL = { [I.COAL]: 40, [B.LOG]: 8, [B.BIRCH_LOG]: 8, [B.PLANKS]: 7, [B.BIRCH_PLANKS]: 7, [I.STICK]: 2.5, [B.TABLE]: 7, [B.CHEST]: 7 };
export const SMELT_TIME = 5;

// ---------- Textures ----------
// One 256×256 picture ("atlas") holds every 16×16 block texture.
const TILE_NAMES = ["grass_top", "grass_side", "dirt", "stone", "cobble", "sand", "gravel", "log_top", "log_side", "leaves", "planks", "glass", "water",
  "coal_ore", "iron_ore", "sky_ore", "table_top", "table_side", "furnace_top", "furnace_side", "furnace_front", "furnace_front_lit", "chest_top", "chest_side",
  "chest_front", "torch", "bedrock", "tall_grass", "flower_red", "flower_yellow", "bricks", "stone_bricks", "sandstone_top", "sandstone_side", "mossy",
  "iron_block", "birch_top", "birch_side", "birch_leaves", "birch_planks", "snow", "clay", "door_bottom", "door_top",
  "crack0", "crack1", "crack2", "crack3", "crack4", "crack5", "crack6", "crack7"];
export const TILE = {};
TILE_NAMES.forEach((n, i) => { TILE[n] = i; });

// texture tile for each face: dir 0 = top, 1 = side, 2 = bottom
export function faceTile(v, dir, front) {
  const d = blockDef(v), t = d.tex;
  if (front && d.front) return TILE[idOf(v) === B.FURNACE && (metaOf(v) & LIT) ? "furnace_front_lit" : d.front];
  if (idOf(v) === B.DOOR) return TILE[metaOf(v) & TOP ? "door_top" : "door_bottom"];
  if (Array.isArray(t)) return TILE[t[dir]];
  return TILE[t];
}

function painter(ctx, ox, oy, seed) {
  const r = rng(seed * 7919 + 13);
  const P = {
    r,
    px(x, y, c) { if (x < 0 || y < 0 || x > 15 || y > 15) return; ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); },
    clear(x, y) { ctx.clearRect(ox + x, oy + y, 1, 1); },
    fill(pal, weights) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, P.pick(pal, weights));
    },
    pick(pal, weights) {
      if (!weights) return pal[Math.floor(r() * pal.length)];
      let t = r() * weights.reduce((a, b) => a + b, 0);
      for (let i = 0; i < pal.length; i++) { t -= weights[i]; if (t <= 0) return pal[i]; }
      return pal[0];
    },
    specks(n, pal, size = 1) {
      for (let i = 0; i < n; i++) {
        const x = Math.floor(r() * 15), y = Math.floor(r() * 15);
        P.px(x, y, P.pick(pal)); if (size > 1) { P.px(x + 1, y, P.pick(pal)); P.px(x, y + 1, P.pick(pal)); if (r() < 0.6) P.px(x + 1, y + 1, P.pick(pal)); }
      }
    },
    rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); }
  };
  return P;
}

const STONE = ["#8b8b8b", "#7f7f7f", "#959595", "#868686", "#747474"];
const DIRT = ["#8b5e3c", "#7c5233", "#966845", "#73492d"];
const GREEN = ["#5ea83b", "#69b443", "#579c37", "#73bd4b", "#4f9132"];
const PLANK = ["#b98d55", "#ad824c", "#c2965d"];

const PAINT = {
  grass_top(P) { P.fill(GREEN, [3, 3, 2, 1, 1]); P.specks(6, ["#7fca55", "#4a8a2f"]); },
  grass_side(P) {
    P.fill(DIRT); P.specks(5, ["#5e3e26", "#a3754f"]);
    for (let x = 0; x < 16; x++) { const h = 3 + Math.floor(P.r() * 3); for (let y = 0; y < h; y++) P.px(x, y, P.pick(GREEN)); }
  },
  dirt(P) { P.fill(DIRT); P.specks(7, ["#5e3e26", "#a3754f", "#6b6b6b"]); },
  stone(P) {
    P.fill(STONE, [3, 3, 2, 2, 1]);
    for (let i = 0; i < 4; i++) { let x = Math.floor(P.r() * 16), y = Math.floor(P.r() * 16); for (let k = 0; k < 4; k++) { P.px(x, y, "#6a6a6a"); x += P.r() < 0.5 ? 1 : 0; y += 1; } }
  },
  cobble(P) {
    P.fill(["#6d6d6d"]);
    const stones = [[1, 1, 6, 4], [8, 0, 7, 5], [0, 6, 5, 5], [6, 6, 6, 4], [12, 6, 4, 5], [2, 12, 7, 4], [10, 11, 6, 5]];
    for (const [x, y, w, h] of stones) for (let yy = y; yy < y + h - 1; yy++) for (let xx = x; xx < x + w - 1; xx++) P.px(xx, yy, P.pick(["#9a9a9a", "#a5a5a5", "#8e8e8e"]));
    for (const [x, y] of stones) P.px(x, y, "#bdbdbd");
  },
  sand(P) { P.fill(["#e2d39b", "#dbca8f", "#e9daa8", "#d6c487"]); },
  gravel(P) { P.fill(["#8a8480", "#7a7470"]); P.specks(22, ["#a39d98", "#5f5955", "#9a8670", "#bdb6ae"], 2); },
  log_top(P) {
    P.fill(["#6b4f2e"]);
    for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      P.px(x, y, Math.round(d) % 3 === 0 ? "#9a7446" : P.pick(["#b88d58", "#c09560"]));
    }
  },
  log_side(P) { for (let x = 0; x < 16; x++) { const c = P.pick(["#6b4f2e", "#5c4327", "#7a5a35", "#634929"]); for (let y = 0; y < 16; y++) P.px(x, y, P.r() < 0.12 ? "#4e3820" : c); } },
  leaves(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { if (P.r() < 0.13) P.clear(x, y); else P.px(x, y, P.pick(["#3f8a2c", "#4a9a33", "#357a25", "#56a63b"])); } },
  planks(P, pal = PLANK, seam = "#7f5a31") {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, P.pick(pal));
    for (let row = 0; row < 4; row++) { const y = row * 4 + 3; P.rect(0, y, 16, 1, seam); const off = (row * 7 + 3) % 16; P.px(off, y - 1, seam); P.px(off, y - 2, seam); P.px(off, y - 3, seam); }
  },
  glass(P) {
    P.rect(0, 0, 16, 1, "#dff3f7"); P.rect(0, 15, 16, 1, "#dff3f7"); P.rect(0, 0, 1, 16, "#dff3f7"); P.rect(15, 0, 1, 16, "#dff3f7");
    P.px(3, 3, "#ffffff"); P.px(4, 4, "#ffffff"); P.px(5, 5, "#eefbff"); P.px(11, 9, "#ffffff"); P.px(12, 10, "#eefbff");
  },
  water(P) { P.fill(["rgba(52,110,214,.78)", "rgba(60,122,224,.78)", "rgba(46,100,200,.8)"]); for (let i = 0; i < 6; i++) { const x = Math.floor(P.r() * 12), y = Math.floor(P.r() * 16); P.rect(x, y, 3, 1, "rgba(130,180,255,.8)"); } },
  coal_ore(P) { PAINT.stone(P); oreSpots(P, ["#262626", "#3a3a3a", "#1b1b1b"]); },
  iron_ore(P) { PAINT.stone(P); oreSpots(P, ["#d9a37e", "#c48a63", "#e8bf9f"]); },
  sky_ore(P) { PAINT.stone(P); oreSpots(P, ["#5fe3ea", "#9df4f7", "#2fb8c6"]); },
  table_top(P) { PAINT.planks(P); P.rect(1, 1, 14, 1, "#5e4022"); P.rect(1, 14, 14, 1, "#5e4022"); P.rect(1, 1, 1, 14, "#5e4022"); P.rect(14, 1, 1, 14, "#5e4022"); P.rect(5, 1, 1, 14, "#5e4022"); P.rect(10, 1, 1, 14, "#5e4022"); },
  table_side(P) {
    PAINT.planks(P); P.rect(0, 0, 16, 3, "#7a5530");
    P.rect(3, 5, 1, 8, "#5e4022"); P.rect(2, 5, 3, 2, "#9a9a9a");             // hammer
    P.rect(11, 5, 1, 8, "#5e4022"); P.rect(10, 5, 1, 3, "#c9c9c9"); P.rect(12, 5, 1, 3, "#c9c9c9"); // saw
  },
  furnace_top(P) { P.fill(["#7a7a7a", "#858585", "#6f6f6f"]); P.rect(0, 0, 16, 1, "#5d5d5d"); P.rect(0, 15, 16, 1, "#5d5d5d"); },
  furnace_side(P) { PAINT.cobble(P); },
  furnace_front(P, lit) {
    PAINT.cobble(P); P.rect(3, 8, 10, 6, "#202020"); P.rect(3, 7, 10, 1, "#555"); P.rect(4, 2, 8, 3, "#555");
    if (lit) { P.rect(4, 10, 8, 4, "#ff8a1e"); P.rect(5, 11, 6, 2, "#ffd34d"); P.px(7, 9, "#ff8a1e"); P.px(9, 9, "#ffb03a"); }
  },
  furnace_front_lit(P) { PAINT.furnace_front(P, true); },
  chest_top(P) { PAINT.planks(P, ["#a8733a", "#9c6a34", "#b27c41"], "#6a4520"); P.rect(0, 0, 16, 1, "#5a3a1a"); P.rect(0, 15, 16, 1, "#5a3a1a"); P.rect(0, 0, 1, 16, "#5a3a1a"); P.rect(15, 0, 1, 16, "#5a3a1a"); },
  chest_side(P) { PAINT.chest_top(P); P.rect(0, 5, 16, 2, "#5a3a1a"); },
  chest_front(P) { PAINT.chest_side(P); P.rect(6, 4, 4, 5, "#d9c35a"); P.rect(7, 6, 2, 2, "#5a4a10"); },
  torch(P) { P.rect(7, 6, 2, 10, "#7a5530"); P.rect(7, 6, 2, 1, "#5a3d20"); P.rect(6, 3, 4, 3, "#ffb52e"); P.rect(7, 2, 2, 2, "#ffe27a"); P.px(7, 4, "#fff4c2"); },
  bedrock(P) { P.fill(["#3a3a3a", "#2b2b2b", "#4a4a4a", "#1f1f1f"]); P.specks(10, ["#5a5a5a", "#151515"], 2); },
  tall_grass(P) { for (let i = 0; i < 9; i++) { let x = 1 + Math.floor(P.r() * 14); const h = 6 + Math.floor(P.r() * 9); for (let y = 15; y > 15 - h; y--) { P.px(x, y, P.pick(["#5ea83b", "#4f9132", "#73bd4b"])); if (P.r() < 0.2) x += P.r() < 0.5 ? -1 : 1; } } },
  flower_red(P) { stem(P); P.rect(6, 3, 4, 3, "#e0342c"); P.rect(5, 4, 6, 1, "#e0342c"); P.px(7, 4, "#2a1a10"); P.px(8, 4, "#2a1a10"); P.px(6, 3, "#ff5a4f"); },
  flower_yellow(P) { stem(P); P.rect(6, 3, 4, 4, "#f2c52b"); P.px(6, 3, "#fff07a"); P.px(9, 6, "#c89a14"); P.rect(7, 2, 2, 1, "#f2c52b"); },
  bricks(P) {
    P.fill(["#b0b0a8"]);
    for (let row = 0; row < 4; row++) { const off = row % 2 ? 4 : 0; for (let b = -1; b < 3; b++) { const x = b * 8 + off; for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(x + xx, row * 4 + yy, P.pick(["#a4473a", "#b04f40", "#963f33"])); } }
  },
  stone_bricks(P) {
    P.fill(["#5f5f5f"]);
    for (let row = 0; row < 2; row++) { const off = row % 2 ? 4 : 0; for (let b = -1; b < 2; b++) { const x = b * 8 + off; for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) P.px(x + xx, row * 8 + yy, P.pick(["#8f8f8f", "#9a9a9a", "#868686"])); } }
  },
  sandstone_top(P) { P.fill(["#dcc98f", "#d6c286", "#e2d09a"]); },
  sandstone_side(P) { PAINT.sandstone_top(P); P.rect(0, 0, 16, 2, "#e8d8a4"); P.rect(0, 6, 16, 1, "#c8b278"); P.rect(0, 13, 16, 3, "#c4ad72"); },
  mossy(P) { PAINT.cobble(P); P.specks(18, ["#4f8a32", "#5e9c3b", "#3f7428"], 2); },
  iron_block(P) { P.fill(["#e2e2e2", "#d8d8d8"]); P.rect(0, 0, 16, 1, "#f5f5f5"); P.rect(0, 15, 16, 1, "#9a9a9a"); P.rect(0, 0, 1, 16, "#f5f5f5"); P.rect(15, 0, 1, 16, "#9a9a9a"); P.rect(3, 7, 10, 1, "#bdbdbd"); },
  birch_top(P) { P.fill(["#e9e3d3"]); for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); P.px(x, y, Math.round(d) % 3 === 0 ? "#c6ab78" : P.pick(["#dcc58f", "#e2cd99"])); } },
  birch_side(P) { P.fill(["#ece8dc", "#e3dfd2", "#f2efe6"]); for (let i = 0; i < 7; i++) { const x = Math.floor(P.r() * 13), y = Math.floor(P.r() * 16); P.rect(x, y, 2 + Math.floor(P.r() * 3), 1, "#2f2f2f"); } },
  birch_leaves(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { if (P.r() < 0.13) P.clear(x, y); else P.px(x, y, P.pick(["#7ab449", "#86c052", "#6aa33e", "#93c95e"])); } },
  birch_planks(P) { PAINT.planks(P, ["#d9c591", "#d0bb85", "#e0cd9b"], "#a8925e"); },
  snow(P) { P.fill(["#f4f8fb", "#eaf1f6", "#ffffff"]); P.specks(5, ["#d8e4ee"]); },
  clay(P) { P.fill(["#a3aab8", "#9aa1b0", "#aab1bf"]); P.specks(6, ["#8d94a3"]); },
  door_bottom(P) { PAINT.planks(P); P.rect(0, 0, 1, 16, "#6e4b26"); P.rect(15, 0, 1, 16, "#6e4b26"); P.rect(0, 15, 16, 1, "#6e4b26"); P.rect(12, 1, 2, 2, "#3a3a3a"); },
  door_top(P) { PAINT.planks(P); P.rect(0, 0, 1, 16, "#6e4b26"); P.rect(15, 0, 1, 16, "#6e4b26"); P.rect(0, 0, 16, 1, "#6e4b26"); for (const [x, y] of [[3, 3], [9, 3], [3, 8], [9, 8]]) { P.clear(x, y); for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) P.clear(x + xx, y + yy); } }
};
function oreSpots(P, pal) { for (let i = 0; i < 5; i++) { const x = 1 + Math.floor(P.r() * 12), y = 1 + Math.floor(P.r() * 12); P.px(x, y, pal[0]); P.px(x + 1, y, pal[1]); P.px(x, y + 1, pal[1]); if (P.r() < 0.7) P.px(x + 1, y + 1, pal[2]); } }
function stem(P) { P.rect(7, 6, 2, 10, "#3f8a2c"); P.px(6, 11, "#4f9a33"); P.px(9, 9, "#4f9a33"); P.px(5, 10, "#4f9a33"); }
for (let s = 0; s < 8; s++) {
  PAINT["crack" + s] = P => {
    const n = 3 + s * 3; let x = 8, y = 8;
    for (let i = 0; i < n * 4; i++) { P.px(x, y, "rgba(0,0,0,.55)"); const d = Math.floor(P.r() * 4); x += [1, -1, 0, 0][d]; y += [0, 0, 1, -1][d]; if (i % 6 === 5) { x = 8; y = 8; } }
  };
}

let atlasCanvas = null;
export function buildAtlas() {
  if (atlasCanvas) return atlasCanvas;
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const ctx = c.getContext("2d");
  TILE_NAMES.forEach((name, i) => PAINT[name](painter(ctx, (i % 16) * 16, Math.floor(i / 16) * 16, i + 1)));
  atlasCanvas = c;
  return c;
}
export const tileUV = t => [(t % 16) / 16, Math.floor(t / 16) / 16];

// ---------- Item pictures (inventory icons) ----------
const ICON_PAINT = {
  stick(P) { for (let i = 0; i < 11; i++) { P.px(3 + i, 13 - i, "#8a6235"); P.px(4 + i, 13 - i, "#6a4825"); } },
  coal(P) { blob(P, ["#2b2b2b", "#3c3c3c", "#1a1a1a"]); P.px(6, 6, "#5a5a5a"); },
  ingot(P) { for (let y = 6; y < 11; y++) for (let x = 3; x < 13; x++) P.px(x, y, y === 6 ? "#ffffff" : y === 10 ? "#a0a0a0" : "#dcdcdc"); P.rect(4, 5, 8, 1, "#f2f2f2"); },
  skyshard(P) { const pts = [[8, 2], [7, 3], [8, 3], [9, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4]]; for (let y = 4; y < 13; y++) { const w = y < 8 ? y - 2 : 14 - y; for (let x = 8 - w; x <= 8 + w; x++) P.px(x, y, x < 8 ? "#3fc5d3" : "#7ef0f5"); } pts.forEach(([x, y]) => P.px(x, y, "#c9fbfd")); },
  apple(P) { for (let y = 5; y < 14; y++) for (let x = 3; x < 13; x++) { const dx = x - 7.5, dy = y - 9.5; if (dx * dx + dy * dy < 22) P.px(x, y, x < 6 && y < 9 ? "#ff6a5e" : "#d8302a"); } P.rect(8, 2, 1, 4, "#6a4825"); P.rect(9, 3, 3, 2, "#4f9a33"); },
  clay_ball(P) { blob(P, ["#a3aab8", "#b4bbc8", "#8d94a3"]); },
  brick(P) { for (let y = 6; y < 11; y++) for (let x = 2; x < 14; x++) P.px(x, y, y === 6 ? "#c45a48" : y === 10 ? "#7d3328" : "#a4473a"); },
  tool_pick(P, c) { handle(P); for (let x = 2; x < 14; x++) { const y = 3 + Math.round(Math.pow((x - 8) / 6, 2) * 3); P.px(x, y, c[0]); P.px(x, y + 1, c[1]); } },
  tool_axe(P, c) { handle(P); for (let y = 2; y < 8; y++) for (let x = 6; x < 12; x++) if (x - 6 + (7 - y) < 9) P.px(x, y, y === 2 || x === 6 ? c[1] : c[0]); },
  tool_shovel(P, c) { handle(P); for (let y = 1; y < 6; y++) for (let x = 9; x < 14; x++) if ((x - 11.5) ** 2 + (y - 3.5) ** 2 < 6.5) P.px(x, y, x === 9 ? c[1] : c[0]); },
  tool_sword(P, c) { for (let i = 0; i < 9; i++) { P.px(5 + i, 10 - i, c[0]); P.px(6 + i, 10 - i, c[1]); } P.px(14, 1, c[0]); P.rect(3, 10, 4, 1, "#5a3d20"); P.rect(5, 8, 1, 4, "#5a3d20"); P.px(3, 12, "#8a6235"); P.px(2, 13, "#8a6235"); }
};
function blob(P, pal) { for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) { const dx = x - 8, dy = y - 8.5; if (dx * dx + dy * dy < 16 + P.r() * 6) P.px(x, y, P.pick(pal)); } }
function handle(P) { for (let i = 0; i < 10; i++) P.px(3 + i, 14 - i, i % 2 ? "#6a4825" : "#8a6235"); }

const iconCache = new Map();
// Returns a canvas (32×32) picture of an item for the inventory.
export function iconCanvas(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const ctx = c.getContext("2d"); ctx.imageSmoothingEnabled = false;
  const d = itemDef(id);
  if (!d) return c;
  if (d.kind !== "block") {
    const s = document.createElement("canvas"); s.width = s.height = 16;
    ICON_PAINT[d.icon](painter(s.getContext("2d"), 0, 0, id), d.colors);
    ctx.drawImage(s, 0, 0, 32, 32);
  } else {
    const bd = BLOCKS[id], atlas = buildAtlas();
    const tileAt = t => [(t % 16) * 16, Math.floor(t / 16) * 16];
    if (bd.shape !== "cube" && bd.shape !== "water") {
      const [sx, sy] = tileAt(faceTile(make(id, id === B.DOOR ? 0 : 0), 1));
      if (id === B.DOOR) { const [tx, ty] = tileAt(TILE.door_top); ctx.drawImage(atlas, tx, ty, 16, 16, 8, 0, 16, 16); ctx.drawImage(atlas, sx, sy, 16, 16, 8, 16, 16, 16); }
      else ctx.drawImage(atlas, sx, sy, 16, 16, 0, 0, 32, 32);
    } else {
      // little 3D cube: top, left side, right side
      const top = tileAt(faceTile(id, 0)), side = tileAt(faceTile(id, 1)), front = tileAt(faceTile(id, 1, true));
      ctx.save(); ctx.setTransform(1, 0.5, -1, 0.5, 16, 0); ctx.drawImage(atlas, top[0], top[1], 16, 16, 0, 0, 16, 16); ctx.restore();
      ctx.save(); ctx.setTransform(1, 0.5, 0, 1, 0, 8); ctx.drawImage(atlas, side[0], side[1], 16, 16, 0, 0, 16, 16);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(0, 0, 16, 16); ctx.restore();
      ctx.save(); ctx.setTransform(1, -0.5, 0, 1, 16, 16); ctx.drawImage(atlas, front[0], front[1], 16, 16, 0, 0, 16, 16);
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, 16, 16); ctx.restore();
    }
  }
  iconCache.set(id, c);
  return c;
}
const urlCache = new Map();
export function iconURL(id) { if (!urlCache.has(id)) urlCache.set(id, iconCanvas(id).toDataURL()); return urlCache.get(id); }
