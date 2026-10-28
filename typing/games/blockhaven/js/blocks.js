// Every block and item in Blockhaven: what it is, how it behaves, how it's crafted,
// and the pixel-art textures (all drawn by code, so every picture is original).
import { rng } from "./noise.js";

export const CHUNK = 16, HEIGHT = 80, SEA = 30;

export const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, SAND: 5, GRAVEL: 6, LOG: 7, LEAVES: 8, PLANKS: 9,
  GLASS: 10, WATER: 11, COAL_ORE: 12, IRON_ORE: 13, SKY_ORE: 14, TABLE: 15, FURNACE: 16, CHEST: 17,
  TORCH: 18, BEDROCK: 19, TALL_GRASS: 20, FLOWER_RED: 21, FLOWER_YELLOW: 22, BRICKS: 23, STONE_BRICKS: 24,
  SANDSTONE: 25, MOSSY: 26, IRON_BLOCK: 27, BIRCH_LOG: 28, BIRCH_LEAVES: 29, BIRCH_PLANKS: 30, SNOW: 31,
  CLAY: 32, DOOR: 33, FARMLAND: 34, WHEAT: 35, SAPLING: 36, BED: 37, WOOL: 38, LAVA: 39, OBSIDIAN: 40, CARROTS: 41, TNT: 42,
  // Ember Depths (the underworld)
  EMBERRACK: 43, SOUL_SAND: 44, SHINESTONE: 45, QUARTZ_ORE: 46, NETHER_GOLD_ORE: 47, ANCIENT_SCRAP: 48, BASALT: 49, BLACKSTONE: 50,
  MAGMA: 51, CRIMSON_NYLIUM: 52, WARPED_NYLIUM: 53, CRIMSON_STEM: 54, WARPED_STEM: 55, CRIMSON_WART: 56, WARPED_WART: 57, SHROOMLIGHT: 58,
  EMBER_BRICKS: 59, BLACKSTONE_BRICKS: 60, GOLD_BLOCK: 61, PORTAL: 62, FIRE: 63, EMBER_WART: 64, CRIMSON_PLANKS: 65, WARPED_PLANKS: 66, QUARTZ_BLOCK: 67,
  // the Hollow (the end realm) and strongholds
  HOLLOWSTONE: 68, VIOLET_BRICKS: 69, END_FRAME: 70, END_PORTAL: 71, GATEWAY: 72, WYRM_EGG: 73, CHORUS_PLANT: 74, CHORUS_FLOWER: 75, SHELL_BOX: 76,
  HOLLOW_BRICKS: 77, VIOLET_PILLAR: 78
};
export const I = {
  STICK: 256, COAL: 257, IRON_INGOT: 258, SKYSHARD: 259, APPLE: 260, CLAY_BALL: 261, BRICK: 262,
  WOOD_PICK: 270, WOOD_AXE: 271, WOOD_SHOVEL: 272, WOOD_SWORD: 273,
  STONE_PICK: 274, STONE_AXE: 275, STONE_SHOVEL: 276, STONE_SWORD: 277,
  IRON_PICK: 278, IRON_AXE: 279, IRON_SHOVEL: 280, IRON_SWORD: 281,
  SKY_PICK: 282, SKY_AXE: 283, SKY_SHOVEL: 284, SKY_SWORD: 285,
  WOOD_HOE: 286, STONE_HOE: 287, IRON_HOE: 288, SKY_HOE: 289,
  SEEDS: 300, WHEAT: 301, BREAD: 302, CARROT: 303, RAW_BEEF: 304, STEAK: 305, RAW_PORK: 306, COOKED_PORK: 307,
  RAW_CHICKEN: 308, COOKED_CHICKEN: 309, RAW_MUTTON: 310, COOKED_MUTTON: 311, RAW_RABBIT: 312, COOKED_RABBIT: 313,
  ROTTEN_FLESH: 314, BONE: 315, BONE_MEAL: 316, ARROW: 317, STRING: 318, FEATHER: 319, FLINT: 320, BOOM_POWDER: 321,
  GLOOP_BALL: 322, VOID_PEARL: 323, LEATHER: 324, EGG: 325, BUCKET: 326, WATER_BUCKET: 327, LAVA_BUCKET: 328, MILK_BUCKET: 329,
  BOW: 330, SHEARS: 331, FLINT_STEEL: 336, SPIDER_EYE: 337,
  LEATHER_HELMET: 340, LEATHER_CHEST: 341, LEATHER_LEGS: 342, LEATHER_BOOTS: 343,
  IRON_HELMET: 344, IRON_CHEST: 345, IRON_LEGS: 346, IRON_BOOTS: 347,
  SKY_HELMET: 348, SKY_CHEST: 349, SKY_LEGS: 350, SKY_BOOTS: 351,
  GOLD_NUGGET: 360, GOLD_INGOT: 361, QUARTZ: 362, SHINE_DUST: 363, FLARE_ROD: 364, FLARE_POWDER: 365, WAILER_TEAR: 366, MAGMA_CREAM: 367,
  WART: 368, DUSK_SCRAP: 369, DUSK_INGOT: 370, BLIGHT_SKULL: 371,
  GOLD_HELMET: 372, GOLD_CHEST: 373, GOLD_LEGS: 374, GOLD_BOOTS: 375,
  DUSK_HELMET: 376, DUSK_CHEST: 377, DUSK_LEGS: 378, DUSK_BOOTS: 379,
  DUSK_PICK: 380, DUSK_AXE: 381, DUSK_SHOVEL: 382, DUSK_SWORD: 383, DUSK_HOE: 384,
  EYE: 385, GLIDER: 386, SHELL: 387, CHORUS_FRUIT: 388, WYRM_SCALE: 389,
  SPAWN: 400   // spawn eggs: 400 + index in SPAWN_EGGS
};

// A block value stores the block id in the low 8 bits and extra state ("meta") in the high 8 bits.
export const idOf = v => v & 255;
export const metaOf = v => v >> 8;
export const make = (id, meta = 0) => id | (meta << 8);
// Meta bits: facing 0-3 (0 = +z, 1 = +x, 2 = -z, 3 = -x), OPEN for doors, TOP for door tops, LIT for furnaces
export const OPEN = 4, TOP = 8, LIT = 4, HEAD = 8, WET = 1, EYE_IN = 4;

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
block(B.FARMLAND, "Farmland", { shape: "farmland", hardness: 0.6, tool: "shovel", drops: B.DIRT, tex: ["farmland_dry", "dirt", "dirt"], category: "Nature" });
block(B.WHEAT, "Wheat Crop", { shape: "crop", render: "cutout", solid: false, hardness: 0, drops: "crop", tex: "wheat0", category: "Nature", noItem: true });
block(B.CARROTS, "Carrot Crop", { shape: "crop", render: "cutout", solid: false, hardness: 0, drops: "crop", tex: "carrots0", category: "Nature", noItem: true });
block(B.SAPLING, "Oak Sapling", { shape: "cross", render: "cutout", solid: false, hardness: 0, tex: "sapling_oak", category: "Nature" });
block(B.BED, "Bed", { shape: "bed", render: "cutout", hardness: 0.4, tool: "axe", interact: "bed", tex: "bed_foot", category: "Useful" });
block(B.WOOL, "Wool", { hardness: 0.8, tool: "shears", tex: "wool" });
block(B.LAVA, "Lava", { shape: "liquid", render: "opaque", solid: false, hardness: 0, drops: 0, light: 15, tex: "lava", category: "Nature" });
block(B.OBSIDIAN, "Obsidian", { hardness: 15, tool: "pick", tier: 4, tex: "obsidian" });
block(B.TNT, "Blast Block", { hardness: 0, interact: "tnt", tex: ["tnt_top", "tnt_side", "tnt_bottom"], category: "Useful" });
const DEPTHS = "Ember Depths";
block(B.EMBERRACK, "Emberrack", { hardness: 0.4, tool: "pick", tier: 1, tex: "emberrack", category: DEPTHS });
block(B.SOUL_SAND, "Wailing Sand", { hardness: 0.5, tool: "shovel", tex: "soul_sand", category: DEPTHS, slow: true });
block(B.SHINESTONE, "Shinestone", { hardness: 0.3, light: 15, drops: "shine", tex: "shinestone", category: DEPTHS });
block(B.QUARTZ_ORE, "Ember Quartz Ore", { hardness: 3, tool: "pick", tier: 1, drops: I.QUARTZ, tex: "quartz_ore", category: DEPTHS });
block(B.NETHER_GOLD_ORE, "Ember Gold Ore", { hardness: 3, tool: "pick", tier: 1, drops: "goldnuggets", tex: "nether_gold_ore", category: DEPTHS });
block(B.ANCIENT_SCRAP, "Ancient Scrap", { hardness: 20, tool: "pick", tier: 4, tex: ["scrap_top", "scrap_side", "scrap_top"], category: DEPTHS });
block(B.BASALT, "Basalt", { hardness: 1.25, tool: "pick", tier: 1, tex: ["basalt_top", "basalt_side", "basalt_top"], category: DEPTHS });
block(B.BLACKSTONE, "Blackstone", { hardness: 1.5, tool: "pick", tier: 1, tex: "blackstone", category: DEPTHS });
block(B.MAGMA, "Magma Block", { hardness: 0.5, tool: "pick", tier: 1, light: 3, tex: "magma", category: DEPTHS, hot: true });
block(B.CRIMSON_NYLIUM, "Crimson Moss", { hardness: 0.4, tool: "pick", tier: 1, drops: B.EMBERRACK, tex: ["crimson_nylium", "crimson_nylium_side", "emberrack"], category: DEPTHS });
block(B.WARPED_NYLIUM, "Warped Moss", { hardness: 0.4, tool: "pick", tier: 1, drops: B.EMBERRACK, tex: ["warped_nylium", "warped_nylium_side", "emberrack"], category: DEPTHS });
block(B.CRIMSON_STEM, "Crimson Stem", { hardness: 2, tool: "axe", tex: ["crimson_stem_top", "crimson_stem", "crimson_stem_top"], category: DEPTHS });
block(B.WARPED_STEM, "Warped Stem", { hardness: 2, tool: "axe", tex: ["warped_stem_top", "warped_stem", "warped_stem_top"], category: DEPTHS });
block(B.CRIMSON_WART, "Crimson Cap", { hardness: 1, tool: "hoe", tex: "crimson_wart", category: DEPTHS });
block(B.WARPED_WART, "Warped Cap", { hardness: 1, tool: "hoe", tex: "warped_wart", category: DEPTHS });
block(B.SHROOMLIGHT, "Shroomlight", { hardness: 1, tool: "hoe", light: 15, tex: "shroomlight", category: DEPTHS });
block(B.EMBER_BRICKS, "Ember Bricks", { hardness: 2, tool: "pick", tier: 1, tex: "ember_bricks", category: DEPTHS });
block(B.BLACKSTONE_BRICKS, "Blackstone Bricks", { hardness: 1.5, tool: "pick", tier: 1, tex: "blackstone_bricks", category: DEPTHS });
block(B.GOLD_BLOCK, "Block of Gold", { hardness: 3, tool: "pick", tier: 3, tex: "gold_block" });
block(B.PORTAL, "Portal", { shape: "portal", render: "water", solid: false, hardness: 0, drops: 0, light: 11, tex: "portal", noItem: true, category: DEPTHS });
block(B.FIRE, "Fire", { shape: "cross", render: "cutout", solid: false, hardness: 0, drops: 0, light: 15, tex: "fire", noItem: true, replaceable: true, category: DEPTHS });
block(B.EMBER_WART, "Ember Wart Crop", { shape: "crop", render: "cutout", solid: false, hardness: 0, drops: "wart", tex: "wart0", noItem: true, category: DEPTHS });
block(B.CRIMSON_PLANKS, "Crimson Planks", { hardness: 2, tool: "axe", tex: "crimson_planks" });
block(B.WARPED_PLANKS, "Warped Planks", { hardness: 2, tool: "axe", tex: "warped_planks" });
block(B.QUARTZ_BLOCK, "Quartz Block", { hardness: 0.8, tool: "pick", tier: 1, tex: "quartz_block" });
const HOLLOW = "The Hollow";
block(B.HOLLOWSTONE, "Hollowstone", { hardness: 3, tool: "pick", tier: 1, tex: "hollowstone", category: HOLLOW });
block(B.HOLLOW_BRICKS, "Hollowstone Bricks", { hardness: 3, tool: "pick", tier: 1, tex: "hollow_bricks", category: HOLLOW });
block(B.VIOLET_BRICKS, "Violet Bricks", { hardness: 1.5, tool: "pick", tier: 1, tex: "violet_bricks", category: HOLLOW });
block(B.VIOLET_PILLAR, "Violet Pillar", { hardness: 1.5, tool: "pick", tier: 1, tex: ["violet_pillar_top", "violet_pillar", "violet_pillar_top"], category: HOLLOW });
block(B.END_FRAME, "Hollow Portal Frame", { hardness: Infinity, drops: 0, interact: "frame", tex: ["frame_top", "frame_side", "hollowstone"], category: HOLLOW });
block(B.END_PORTAL, "Hollow Portal", { shape: "endportal", render: "water", solid: false, hardness: Infinity, drops: 0, light: 15, tex: "end_portal", noItem: true, category: HOLLOW });
block(B.GATEWAY, "Hollow Gateway", { shape: "glow", render: "water", solid: false, hardness: Infinity, drops: 0, light: 15, tex: "gateway", noItem: true, category: HOLLOW });
block(B.WYRM_EGG, "Wyrm Egg", { hardness: 3, tool: "pick", light: 1, tex: "wyrm_egg", category: HOLLOW });
block(B.CHORUS_PLANT, "Chorus Plant", { render: "cutout", hardness: 0.4, tool: "axe", drops: "chorus", tex: "chorus_plant", category: HOLLOW });
block(B.CHORUS_FLOWER, "Chorus Flower", { render: "cutout", hardness: 0.4, tool: "axe", drops: "chorus", tex: "chorus_flower", category: HOLLOW });
block(B.SHELL_BOX, "Shell Box", { hardness: 2, tool: "pick", interact: "shellbox", drops: 0, tex: ["shellbox_top", "shellbox_side", "shellbox_top"], category: "Useful" });
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
for (const d of Object.values(defs)) if (d.id && !d.noItem) items[d.id] = { id: d.id, name: d.name, kind: "block", stack: d.id === B.BED || d.id === B.SHELL_BOX ? 1 : 64, category: d.category };
function item(id, name, o) { items[id] = Object.assign({ id, name, kind: "item", stack: 64, category: "Items" }, o); }
item(I.STICK, "Stick", { icon: "stick" });
item(I.COAL, "Coal", { icon: "coal" });
item(I.IRON_INGOT, "Iron Ingot", { icon: "ingot" });
item(I.SKYSHARD, "Skyshard", { icon: "skyshard" });
item(I.APPLE, "Apple", { icon: "apple", kind: "food", food: 4 });
item(I.CLAY_BALL, "Clay Ball", { icon: "clay_ball" });
item(I.BRICK, "Brick", { icon: "brick" });
// farming and food (food = hunger points restored)
item(I.SEEDS, "Wheat Seeds", { icon: "seeds", plants: B.WHEAT, category: "Food" });
item(I.WHEAT, "Wheat", { icon: "wheat", category: "Food" });
item(I.BREAD, "Bread", { icon: "bread", kind: "food", food: 5, category: "Food" });
item(I.CARROT, "Carrot", { icon: "carrot", kind: "food", food: 3, plants: B.CARROTS, category: "Food" });
const MEAT = [["RAW_BEEF", "Raw Beef", 3, "#c0443c"], ["STEAK", "Steak", 8, "#7a4424"], ["RAW_PORK", "Raw Porkchop", 3, "#e89a9a"], ["COOKED_PORK", "Cooked Porkchop", 8, "#b8784a"],
  ["RAW_CHICKEN", "Raw Chicken", 2, "#f0c8b0"], ["COOKED_CHICKEN", "Cooked Chicken", 6, "#c88a4a"], ["RAW_MUTTON", "Raw Mutton", 2, "#c8504a"], ["COOKED_MUTTON", "Cooked Mutton", 6, "#8a5030"],
  ["RAW_RABBIT", "Raw Rabbit", 3, "#e0a0a0"], ["COOKED_RABBIT", "Cooked Rabbit", 5, "#b07040"]];
for (const [k, name, food, color] of MEAT) item(I[k], name, { icon: "meat", colors: [color, "#f4e6d0"], kind: "food", food, category: "Food", raw: k.startsWith("RAW") });
item(I.ROTTEN_FLESH, "Rotten Flesh", { icon: "meat", colors: ["#6a8a3a", "#4a5a2a"], kind: "food", food: 4, category: "Food", sideEffect: "queasy" });
item(I.SPIDER_EYE, "Skitter Eye", { icon: "eye", kind: "food", food: 2, category: "Food", sideEffect: "poison" });
item(I.EGG, "Egg", { icon: "egg", stack: 16, category: "Food" });
item(I.MILK_BUCKET, "Milk Bucket", { icon: "bucket", colors: ["#ffffff"], kind: "food", food: 0, stack: 1, category: "Food", sideEffect: "cure" });
// creature drops and materials
item(I.BONE, "Bone", { icon: "bone" });
item(I.BONE_MEAL, "Bone Meal", { icon: "bonemeal" });
item(I.ARROW, "Arrow", { icon: "arrow", category: "Tools" });
item(I.STRING, "String", { icon: "string" });
item(I.FEATHER, "Feather", { icon: "feather" });
item(I.FLINT, "Flint", { icon: "flint" });
item(I.BOOM_POWDER, "Boom Powder", { icon: "powder" });
item(I.GLOOP_BALL, "Gloop Ball", { icon: "gloop" });
item(I.VOID_PEARL, "Void Pearl", { icon: "pearl", stack: 16, category: "Tools" });
item(I.LEATHER, "Leather", { icon: "leather" });
// tools without tiers
item(I.BUCKET, "Bucket", { icon: "bucket", colors: [null], stack: 16, category: "Tools" });
item(I.WATER_BUCKET, "Water Bucket", { icon: "bucket", colors: ["#3a6fd8"], stack: 1, category: "Tools" });
item(I.LAVA_BUCKET, "Lava Bucket", { icon: "bucket", colors: ["#ff7a1a"], stack: 1, category: "Tools" });
item(I.BOW, "Bow", { icon: "bow", kind: "tool", stack: 1, category: "Tools", tool: { type: "bow", tier: 0, speed: 1, dur: 384, damage: 1 } });
item(I.SHEARS, "Shears", { icon: "shears", kind: "tool", stack: 1, category: "Tools", tool: { type: "shears", tier: 2, speed: 5, dur: 238, damage: 1 } });
item(I.FLINT_STEEL, "Flint and Steel", { icon: "flintsteel", kind: "tool", stack: 1, category: "Tools", tool: { type: "igniter", tier: 0, speed: 1, dur: 64, damage: 1 } });
// Ember Depths materials
item(I.GOLD_NUGGET, "Gold Nugget", { icon: "nugget" });
item(I.GOLD_INGOT, "Gold Ingot", { icon: "ingot", colors: ["#ffd84a", "#c89a14", "#fff2a0"] });
item(I.QUARTZ, "Ember Quartz", { icon: "quartz" });
item(I.SHINE_DUST, "Shine Dust", { icon: "dust", colors: ["#ffe27a", "#f0b030"] });
item(I.FLARE_ROD, "Flare Rod", { icon: "rod" });
item(I.FLARE_POWDER, "Flare Powder", { icon: "dust", colors: ["#ffb030", "#ff7a1a"] });
item(I.WAILER_TEAR, "Wailer Tear", { icon: "tear" });
item(I.MAGMA_CREAM, "Magma Cream", { icon: "gloop", colors: ["#ff8a2a"] });
item(I.WART, "Ember Wart", { icon: "wart", plants: B.EMBER_WART, category: "Ember Depths" });
item(I.DUSK_SCRAP, "Duskmetal Scrap", { icon: "scrap" });
item(I.DUSK_INGOT, "Duskmetal Ingot", { icon: "ingot", colors: ["#4a3e4e", "#2a2230", "#7a6a80"] });
item(I.BLIGHT_SKULL, "Blight Skull", { icon: "skull", stack: 64 });
item(I.EYE, "Eye of the Void", { icon: "eye_void", stack: 64, category: "Tools" });
item(I.SHELL, "Sheller Shell", { icon: "shell" });
item(I.CHORUS_FRUIT, "Chorus Fruit", { icon: "chorus", kind: "food", food: 4, category: "Food", sideEffect: "blink" });
item(I.WYRM_SCALE, "Wyrm Scale", { icon: "scale" });
const TIERS = [
  { key: "WOOD", label: "Wooden", tier: 1, speed: 2, dur: 60, color: "#b48a52", dark: "#7d5a30" },
  { key: "STONE", label: "Stone", tier: 2, speed: 4, dur: 132, color: "#8d8d8d", dark: "#5b5b5b" },
  { key: "IRON", label: "Iron", tier: 3, speed: 6, dur: 250, color: "#e4e4e4", dark: "#a8a8a8" },
  { key: "SKY", label: "Skyshard", tier: 4, speed: 9, dur: 1200, color: "#62e6ee", dark: "#2a9fb0" },
  { key: "DUSK", label: "Duskmetal", tier: 5, speed: 11, dur: 2000, color: "#5a4a60", dark: "#2a2230" }
];
const KINDS = [["PICK", "Pickaxe", "pick"], ["AXE", "Axe", "axe"], ["SHOVEL", "Shovel", "shovel"], ["SWORD", "Sword", "sword"], ["HOE", "Hoe", "hoe"]];
for (const t of TIERS) for (const [k, label, type] of KINDS) {
  item(I[t.key + "_" + k], t.label + " " + label, {
    kind: "tool", stack: 1, category: "Tools", icon: "tool_" + type, colors: [t.color, t.dark],
    tool: { type, tier: t.tier, speed: t.speed, dur: t.dur, damage: type === "sword" ? 3 + t.tier : 1 + t.tier * 0.5 }
  });
}
// armor: slot 0 helmet, 1 chestplate, 2 leggings, 3 boots. points = protection
const ARMOR = [["LEATHER", "Leather", [1, 3, 2, 1], 60, "#9a5a32"], ["GOLD", "Gold", [1, 5, 3, 1], 90, "#ffd84a"], ["IRON", "Iron", [2, 6, 5, 2], 180, "#dcdcdc"],
  ["SKY", "Skyshard", [3, 8, 6, 3], 500, "#62e6ee"], ["DUSK", "Duskmetal", [3, 8, 7, 3], 700, "#5a4a60"]];
const PIECES = [["HELMET", "Cap", "helmet"], ["CHEST", "Tunic", "chest"], ["LEGS", "Pants", "legs"], ["BOOTS", "Boots", "boots"]];
for (const [k, label, pts, dur, color] of ARMOR) PIECES.forEach(([p, pname, icon], slot) => {
  const nice = k === "LEATHER" ? label + " " + pname : label + " " + { HELMET: "Helmet", CHEST: "Chestplate", LEGS: "Leggings", BOOTS: "Boots" }[p];
  item(I[k + "_" + p], nice, { icon: "armor_" + icon, colors: [color], kind: "armor", stack: 1, category: "Tools", armor: { slot, points: pts[slot], dur } });
});
// spawn eggs (Creative only): key, name, two colors
export const SPAWN_EGGS = [["zombie", "Groaner", "#3d8a4a", "#2d5a9a"], ["skeleton", "Rattler", "#d8d8d0", "#6a6a6a"], ["creeper", "Hisser", "#4caf3a", "#1d1d1d"],
  ["spider", "Skitter", "#3a302a", "#c0202a"], ["cave_spider", "Cave Skitter", "#1d4a5a", "#c0202a"], ["slime", "Gloop", "#6ac85a", "#3a8a3a"], ["voidwalker", "Voidwalker", "#161616", "#b050e0"],
  ["cow", "Cow", "#4a3424", "#e8e8e8"], ["sheep", "Sheep", "#eeeeee", "#f0c0b0"], ["pig", "Pig", "#f0a0a0", "#d07070"], ["chicken", "Chicken", "#f4f4f4", "#e03a2a"], ["rabbit", "Rabbit", "#9a7a5a", "#e8dcc8"],
  ["flare", "Flare", "#f0b030", "#fff07a"], ["wailer", "Wailer", "#f0f0f0", "#b0b0b0"], ["boarkin", "Boarkin", "#e8a090", "#ffd84a"], ["brute", "Boarkin Brute", "#c08070", "#3a3a3a"],
  ["rotboar", "Rotboar", "#e8a090", "#5a8a4a"], ["hogbeast", "Hogbeast", "#c07850", "#f0e0c0"], ["blight", "Blight Rattler", "#2a2a2a", "#5a5a5a"], ["magma", "Magma Gloop", "#4a1a10", "#ff8a1a"], ["strider", "Lavastrider", "#a02a2a", "#5a5a5a"],
  ["sheller", "Sheller", "#9a6aa8", "#e8d0f0"]];
// Glider Wings go in the chest armor slot: jump while falling to glide
item(I.GLIDER, "Glider Wings", { icon: "glider", kind: "armor", stack: 1, category: "Tools", armor: { slot: 1, points: 0, dur: 432 }, glider: true });
SPAWN_EGGS.forEach(([key, name, a, b], i) => item(I.SPAWN + i, name + " Spawn Egg", { icon: "spawn_egg", colors: [a, b], kind: "spawn", species: key, category: "Creatures" }));
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
  { out: [I.SKY_SWORD, 1], ins: [[I.SKYSHARD, 2], [I.STICK, 1]], table: true },
  { out: [I.WOOD_HOE, 1], ins: [["planks", 2], [I.STICK, 2]], table: true },
  { out: [I.STONE_HOE, 1], ins: [[B.COBBLE, 2], [I.STICK, 2]], table: true },
  { out: [I.IRON_HOE, 1], ins: [[I.IRON_INGOT, 2], [I.STICK, 2]], table: true },
  { out: [I.SKY_HOE, 1], ins: [[I.SKYSHARD, 2], [I.STICK, 2]], table: true },
  { out: [I.BREAD, 1], ins: [[I.WHEAT, 3]] },
  { out: [I.BONE_MEAL, 3], ins: [[I.BONE, 1]] },
  { out: [B.WOOL, 1], ins: [[I.STRING, 4]] },
  { out: [I.ARROW, 4], ins: [[I.FLINT, 1], [I.STICK, 1], [I.FEATHER, 1]], table: true },
  { out: [I.BOW, 1], ins: [[I.STICK, 3], [I.STRING, 3]], table: true },
  { out: [I.SHEARS, 1], ins: [[I.IRON_INGOT, 2]], table: true },
  { out: [I.BUCKET, 1], ins: [[I.IRON_INGOT, 3]], table: true },
  { out: [I.FLINT_STEEL, 1], ins: [[I.IRON_INGOT, 1], [I.FLINT, 1]] },
  { out: [B.BED, 1], ins: [[B.WOOL, 3], ["planks", 3]], table: true },
  { out: [B.TNT, 1], ins: [[I.BOOM_POWDER, 5], [B.SAND, 4]], table: true },
  { out: [I.GOLD_INGOT, 1], ins: [[I.GOLD_NUGGET, 9]] },
  { out: [I.GOLD_NUGGET, 9], ins: [[I.GOLD_INGOT, 1]] },
  { out: [B.GOLD_BLOCK, 1], ins: [[I.GOLD_INGOT, 9]], table: true },
  { out: [I.GOLD_INGOT, 9], ins: [[B.GOLD_BLOCK, 1]], table: true },
  { out: [B.SHINESTONE, 1], ins: [[I.SHINE_DUST, 4]] },
  { out: [B.QUARTZ_BLOCK, 1], ins: [[I.QUARTZ, 4]] },
  { out: [I.FLARE_POWDER, 2], ins: [[I.FLARE_ROD, 1]] },
  { out: [I.MAGMA_CREAM, 1], ins: [[I.GLOOP_BALL, 1], [I.FLARE_POWDER, 1]] },
  { out: [B.CRIMSON_PLANKS, 4], ins: [[B.CRIMSON_STEM, 1]] },
  { out: [B.WARPED_PLANKS, 4], ins: [[B.WARPED_STEM, 1]] },
  { out: [B.EMBER_BRICKS, 1], ins: [[B.EMBERRACK, 4]], table: true },
  { out: [B.BLACKSTONE_BRICKS, 4], ins: [[B.BLACKSTONE, 4]], table: true },
  { out: [I.DUSK_INGOT, 1], ins: [[I.DUSK_SCRAP, 4], [I.GOLD_INGOT, 4]], table: true },
  { out: [I.EYE, 1], ins: [[I.VOID_PEARL, 1], [I.FLARE_POWDER, 1]] },
  { out: [B.SHELL_BOX, 1], ins: [[I.SHELL, 2], [B.CHEST, 1]], table: true },
  { out: [B.HOLLOW_BRICKS, 4], ins: [[B.HOLLOWSTONE, 4]], table: true },
  { out: [B.VIOLET_PILLAR, 1], ins: [[B.VIOLET_BRICKS, 2]], table: true },
  // upgrade Skyshard gear to Duskmetal (the best tier)
  ...["PICK", "AXE", "SHOVEL", "SWORD", "HOE", "HELMET", "CHEST", "LEGS", "BOOTS"].map(k => ({ out: [I["DUSK_" + k], 1], ins: [[I["SKY_" + k], 1], [I.DUSK_INGOT, 1]], table: true, upgrade: true })),
  ...["LEATHER", "GOLD", "IRON", "SKY"].flatMap(k => {
    const mat = { LEATHER: I.LEATHER, GOLD: I.GOLD_INGOT, IRON: I.IRON_INGOT, SKY: I.SKYSHARD }[k];
    return [["HELMET", 5], ["CHEST", 8], ["LEGS", 7], ["BOOTS", 4]].map(([p, n]) => ({ out: [I[k + "_" + p], 1], ins: [[mat, n]], table: true }));
  })
];
export const SMELT = { [B.IRON_ORE]: I.IRON_INGOT, [B.SAND]: B.GLASS, [B.COBBLE]: B.STONE, [I.CLAY_BALL]: I.BRICK, [B.LOG]: I.COAL, [B.BIRCH_LOG]: I.COAL,
  [I.RAW_BEEF]: I.STEAK, [I.RAW_PORK]: I.COOKED_PORK, [I.RAW_CHICKEN]: I.COOKED_CHICKEN, [I.RAW_MUTTON]: I.COOKED_MUTTON, [I.RAW_RABBIT]: I.COOKED_RABBIT,
  [B.NETHER_GOLD_ORE]: I.GOLD_INGOT, [B.QUARTZ_ORE]: I.QUARTZ, [B.ANCIENT_SCRAP]: I.DUSK_SCRAP, [B.EMBERRACK]: B.EMBER_BRICKS, [I.CHORUS_FRUIT]: B.VIOLET_BRICKS };
export const FUEL = { [I.COAL]: 40, [B.LOG]: 8, [B.BIRCH_LOG]: 8, [B.PLANKS]: 7, [B.BIRCH_PLANKS]: 7, [I.STICK]: 2.5, [B.TABLE]: 7, [B.CHEST]: 7,
  [I.FLARE_ROD]: 60, [I.LAVA_BUCKET]: 100, [B.CRIMSON_PLANKS]: 7, [B.WARPED_PLANKS]: 7 };
export const SMELT_TIME = 5;

// ---------- Textures ----------
// One 256×256 picture ("atlas") holds every 16×16 block texture.
const TILE_NAMES = ["grass_top", "grass_side", "dirt", "stone", "cobble", "sand", "gravel", "log_top", "log_side", "leaves", "planks", "glass", "water",
  "coal_ore", "iron_ore", "sky_ore", "table_top", "table_side", "furnace_top", "furnace_side", "furnace_front", "furnace_front_lit", "chest_top", "chest_side",
  "chest_front", "torch", "bedrock", "tall_grass", "flower_red", "flower_yellow", "bricks", "stone_bricks", "sandstone_top", "sandstone_side", "mossy",
  "iron_block", "birch_top", "birch_side", "birch_leaves", "birch_planks", "snow", "clay", "door_bottom", "door_top",
  "crack0", "crack1", "crack2", "crack3", "crack4", "crack5", "crack6", "crack7",
  "farmland_dry", "farmland_wet", "wheat0", "wheat1", "wheat2", "wheat3", "carrots0", "carrots1", "carrots2", "carrots3", "sapling_oak", "sapling_birch",
  "bed_head", "bed_foot", "bed_side", "wool", "lava", "obsidian", "tnt_top", "tnt_side", "tnt_bottom",
  "emberrack", "soul_sand", "shinestone", "quartz_ore", "nether_gold_ore", "scrap_top", "scrap_side", "basalt_top", "basalt_side", "blackstone", "magma",
  "crimson_nylium", "crimson_nylium_side", "warped_nylium", "warped_nylium_side", "crimson_stem", "crimson_stem_top", "warped_stem", "warped_stem_top",
  "crimson_wart", "warped_wart", "shroomlight", "ember_bricks", "blackstone_bricks", "gold_block", "portal", "fire", "wart0", "wart1", "wart2",
  "crimson_planks", "warped_planks", "quartz_block",
  "hollowstone", "hollow_bricks", "violet_bricks", "violet_pillar", "violet_pillar_top", "frame_top", "frame_top_eye", "frame_side", "end_portal", "gateway",
  "wyrm_egg", "chorus_plant", "chorus_flower", "shellbox_top", "shellbox_side"];
export const TILE = {};
TILE_NAMES.forEach((n, i) => { TILE[n] = i; });

// texture tile for each face: dir 0 = top, 1 = side, 2 = bottom
export function faceTile(v, dir, front) {
  const d = blockDef(v), t = d.tex;
  if (front && d.front) return TILE[idOf(v) === B.FURNACE && (metaOf(v) & LIT) ? "furnace_front_lit" : d.front];
  if (idOf(v) === B.DOOR) return TILE[metaOf(v) & TOP ? "door_top" : "door_bottom"];
  if (idOf(v) === B.WHEAT || idOf(v) === B.CARROTS) return TILE[(idOf(v) === B.WHEAT ? "wheat" : "carrots") + Math.min(3, (metaOf(v) & 7) >> 1)];
  if (idOf(v) === B.FARMLAND && dir === 0) return TILE[metaOf(v) & WET ? "farmland_wet" : "farmland_dry"];
  if (idOf(v) === B.BED) return TILE[dir === 0 ? (metaOf(v) & HEAD ? "bed_head" : "bed_foot") : "bed_side"];
  if (idOf(v) === B.SAPLING && (metaOf(v) & 1)) return TILE.sapling_birch;
  if (idOf(v) === B.EMBER_WART) return TILE["wart" + Math.min(2, (metaOf(v) & 7) >> 1)];
  if (idOf(v) === B.END_FRAME && dir === 0 && (metaOf(v) & EYE_IN)) return TILE.frame_top_eye;
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
Object.assign(PAINT, {
  farmland_dry(P) { P.fill(["#7a5232", "#6e482b", "#845a38"]); for (let y = 1; y < 16; y += 3) P.rect(0, y, 16, 1, "#5a3a20"); },
  farmland_wet(P) { P.fill(["#4e321c", "#462c18", "#553820"]); for (let y = 1; y < 16; y += 3) P.rect(0, y, 16, 1, "#36210f"); },
  wheat0(P) { crop(P, 4, ["#4f9a33", "#6bb544"]); }, wheat1(P) { crop(P, 8, ["#6aa33e", "#88b24a"]); },
  wheat2(P) { crop(P, 12, ["#a8a83a", "#c0b04a"]); }, wheat3(P) { crop(P, 15, ["#c9a640", "#e0c060"]); for (let x = 1; x < 16; x += 3) { P.rect(x, 1, 2, 4, "#d8b04a"); P.px(x, 0, "#f0d070"); } },
  carrots0(P) { crop(P, 3, ["#4f9a33"]); }, carrots1(P) { crop(P, 6, ["#4f9a33", "#5ea83b"]); }, carrots2(P) { crop(P, 9, ["#4f9a33", "#5ea83b"]); },
  carrots3(P) { crop(P, 10, ["#4f9a33", "#5ea83b"]); for (let x = 2; x < 16; x += 4) P.rect(x, 12, 2, 4, "#f08a1a"); },
  sapling_oak(P) { P.rect(7, 9, 2, 7, "#6b4f2e"); for (const [x, y] of [[6, 4], [4, 6], [9, 5], [7, 2], [10, 7], [5, 8]]) P.rect(x, y, 3, 3, P.pick(["#3f8a2c", "#4a9a33"])); },
  sapling_birch(P) { P.rect(7, 9, 2, 7, "#e8e4d8"); for (const [x, y] of [[6, 4], [4, 6], [9, 5], [7, 2], [10, 7], [5, 8]]) P.rect(x, y, 3, 3, P.pick(["#7ab449", "#86c052"])); },
  bed_head(P) { P.fill(["#c8302a", "#b82a24"]); P.rect(1, 1, 14, 6, "#f2f2f2"); P.rect(1, 6, 14, 1, "#d8d8d8"); },
  bed_foot(P) { P.fill(["#c8302a", "#b82a24", "#d23a32"]); P.rect(0, 0, 16, 1, "#a82018"); },
  bed_side(P) { P.fill(["#c8302a"]); P.rect(0, 8, 16, 8, "#9a6a3a"); P.rect(0, 13, 2, 3, "#7a5028"); P.rect(14, 13, 2, 3, "#7a5028"); },
  wool(P) { P.fill(["#ececec", "#e2e2e2", "#f6f6f6", "#dadada"]); },
  lava(P) { P.fill(["#ff7a1a", "#ff9a2a", "#e85a10", "#ffb03a"]); for (let i = 0; i < 6; i++) P.rect(Math.floor(P.r() * 12), Math.floor(P.r() * 16), 4, 1, "#ffd860"); },
  obsidian(P) { P.fill(["#1a1426", "#120e1c", "#221a32"]); P.specks(8, ["#3a2a5a", "#4a3a6a"], 2); },
  tnt_side(P) { P.fill(["#d8402a", "#c8382a"]); P.rect(0, 5, 16, 6, "#f2f2e8"); P.rect(3, 7, 10, 2, "#1d1d1d"); },
  tnt_top(P) { P.fill(["#d8402a"]); P.rect(5, 5, 6, 6, "#f2f2e8"); P.rect(7, 7, 2, 2, "#3a3a3a"); },
  tnt_bottom(P) { P.fill(["#c8382a", "#b8302a"]); }
});
const RACK = ["#7a2a2a", "#6a2424", "#8a3030", "#5a1e1e", "#94383a"];
Object.assign(PAINT, {
  emberrack(P) { P.fill(RACK); P.specks(10, ["#4a1414", "#a84444"]); },
  soul_sand(P) { P.fill(["#5a4434", "#4e3a2c", "#664e3c"]); for (const [x, y] of [[3, 4], [10, 6], [6, 11]]) { P.rect(x, y, 3, 1, "#2a1e16"); P.px(x, y + 1, "#2a1e16"); P.px(x + 2, y + 1, "#2a1e16"); P.rect(x, y + 3, 3, 1, "#2a1e16"); } },
  shinestone(P) { P.fill(["#c8962a", "#e0b040", "#f0d070", "#a87a20"]); P.specks(12, ["#fff2a0", "#ffe27a"], 2); },
  quartz_ore(P) { P.fill(RACK); oreSpots(P, ["#f2ece0", "#dcd2c0", "#ffffff"]); },
  nether_gold_ore(P) { P.fill(RACK); oreSpots(P, ["#ffd84a", "#f0b020", "#fff2a0"]); },
  scrap_side(P) { P.fill(["#4a3a34", "#3e302a", "#56443c"]); for (let y = 2; y < 16; y += 4) P.rect(0, y, 16, 1, "#6a5a50"); P.rect(3, 0, 1, 16, "#2a201c"); P.rect(11, 0, 1, 16, "#2a201c"); },
  scrap_top(P) { P.fill(["#4a3a34", "#56443c"]); for (let r = 2; r < 8; r += 2) { P.rect(8 - r, 8 - r, r * 2, 1, "#6a5a50"); P.rect(8 - r, 7 + r, r * 2, 1, "#2a201c"); } },
  basalt_side(P) { for (let x = 0; x < 16; x++) { const c = P.pick(["#4a4a50", "#3e3e44", "#56565c"]); for (let y = 0; y < 16; y++) P.px(x, y, P.r() < 0.1 ? "#2e2e34" : c); } },
  basalt_top(P) { P.fill(["#4a4a50", "#3e3e44"]); P.rect(2, 2, 12, 12, "#56565c"); P.rect(4, 4, 8, 8, "#4a4a50"); },
  blackstone(P) { P.fill(["#2a2630", "#221e28", "#34303a", "#1c1820"]); P.specks(6, ["#4a4452"]); },
  magma(P) { P.fill(["#5a1a10", "#4a140c"]); for (let i = 0; i < 9; i++) { const x = Math.floor(P.r() * 13), y = Math.floor(P.r() * 13); P.rect(x, y, 3, 2, P.pick(["#ff7a1a", "#ffb030", "#e85a10"])); } },
  crimson_nylium(P) { P.fill(["#a01e1e", "#b42828", "#8c1818", "#c43232"]); },
  crimson_nylium_side(P) { P.fill(RACK); for (let x = 0; x < 16; x++) { const h = 3 + Math.floor(P.r() * 3); for (let y = 0; y < h; y++) P.px(x, y, P.pick(["#a01e1e", "#b42828"])); } },
  warped_nylium(P) { P.fill(["#1e7a6a", "#24907c", "#186a5c", "#2aa08a"]); },
  warped_nylium_side(P) { P.fill(RACK); for (let x = 0; x < 16; x++) { const h = 3 + Math.floor(P.r() * 3); for (let y = 0; y < h; y++) P.px(x, y, P.pick(["#1e7a6a", "#24907c"])); } },
  crimson_stem(P) { for (let x = 0; x < 16; x++) { const c = P.pick(["#6a1e2e", "#7a2436", "#5a1826"]); for (let y = 0; y < 16; y++) P.px(x, y, P.r() < 0.12 ? "#ff6a4a" : c); } },
  crimson_stem_top(P) { P.fill(["#6a1e2e"]); P.rect(2, 2, 12, 12, "#9a4a5a"); P.rect(5, 5, 6, 6, "#7a3444"); },
  warped_stem(P) { for (let x = 0; x < 16; x++) { const c = P.pick(["#2a4a5a", "#305468", "#24404e"]); for (let y = 0; y < 16; y++) P.px(x, y, P.r() < 0.12 ? "#3ae0c0" : c); } },
  warped_stem_top(P) { P.fill(["#2a4a5a"]); P.rect(2, 2, 12, 12, "#4a7a7a"); P.rect(5, 5, 6, 6, "#3a6464"); },
  crimson_wart(P) { P.fill(["#8a1414", "#9a1a1a", "#7a1010", "#a82020"]); },
  warped_wart(P) { P.fill(["#147a6a", "#1a8a78", "#106a5c", "#20a08a"]); },
  shroomlight(P) { P.fill(["#f0a040", "#ffb850", "#e08a30", "#ffd070"]); P.specks(6, ["#fff0b0"], 2); },
  ember_bricks(P) {
    P.fill(["#2a1014"]);
    for (let row = 0; row < 4; row++) { const off = row % 2 ? 4 : 0; for (let b = -1; b < 3; b++) { const x = b * 8 + off; for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(x + xx, row * 4 + yy, P.pick(["#4a1a20", "#561e26", "#40161c"])); } }
  },
  blackstone_bricks(P) {
    P.fill(["#141218"]);
    for (let row = 0; row < 2; row++) { const off = row % 2 ? 4 : 0; for (let b = -1; b < 2; b++) { const x = b * 8 + off; for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) P.px(x + xx, row * 8 + yy, P.pick(["#34303a", "#2a2630", "#3a3640"])); } }
  },
  gold_block(P) { P.fill(["#ffd84a", "#f8cc3a"]); P.rect(0, 0, 16, 1, "#fff2a0"); P.rect(0, 15, 16, 1, "#c89a14"); P.rect(0, 0, 1, 16, "#fff2a0"); P.rect(15, 0, 1, 16, "#c89a14"); P.rect(3, 7, 10, 1, "#e8b830"); },
  portal(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const s = Math.sin((x + y * 0.6) * 0.9) + Math.cos((y - x * 0.4) * 0.7); P.px(x, y, s > 0.6 ? "rgba(210,140,255,.85)" : s > -0.3 ? "rgba(140,60,220,.75)" : "rgba(90,30,170,.7)"); } },
  fire(P) { for (let i = 0; i < 7; i++) { const x = 1 + i * 2, h = 6 + Math.floor(P.r() * 9); for (let y = 15; y > 15 - h; y--) P.px(x + (y % 3 === 0 ? 1 : 0), y, y > 15 - h * 0.4 ? "#ff7a1a" : y > 15 - h * 0.75 ? "#ffb030" : "#fff07a"); } },
  wart0(P) { for (const x of [4, 8, 11]) P.rect(x, 12, 2, 4, "#8a1a1a"); },
  wart1(P) { for (const x of [3, 7, 11]) { P.rect(x, 9, 2, 7, "#9a1a1a"); P.rect(x - 1, 9, 4, 2, "#b02424"); } },
  wart2(P) { for (const x of [2, 6, 10]) { P.rect(x, 6, 3, 10, "#a01e1e"); P.rect(x - 1, 5, 5, 3, "#c82a2a"); } },
  crimson_planks(P) { PAINT.planks(P, ["#6a2a40", "#5e2438", "#743048"], "#401828"); },
  warped_planks(P) { PAINT.planks(P, ["#2a6a64", "#245e58", "#30766e"], "#164440"); },
  quartz_block(P) { P.fill(["#ece6da", "#e4ded2", "#f2ece2"]); P.rect(0, 0, 16, 1, "#ffffff"); P.rect(0, 15, 16, 1, "#c8c0b0"); }
});
const HSTONE = ["#e8e4b0", "#dcd8a2", "#f0ecbc", "#d2ce96"], VIOLET = ["#a77aa8", "#9c6e9e", "#b088b2"];
Object.assign(PAINT, {
  hollowstone(P) { P.fill(HSTONE); P.specks(10, ["#c4c088", "#f8f4cc"]); },
  hollow_bricks(P) { P.fill(["#bcb884"]); for (let row = 0; row < 2; row++) { const off = row % 2 ? 4 : 0; for (let b = -1; b < 2; b++) { const x = b * 8 + off; for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 7; xx++) P.px(x + xx, row * 8 + yy, P.pick(HSTONE)); } } },
  violet_bricks(P) { P.fill(["#7a5a7c"]); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) P.px(c * 4 + xx, r * 4 + yy, P.pick(VIOLET)); },
  violet_pillar(P) { for (let x = 0; x < 16; x++) { const c = x % 4 === 0 ? "#7a5a7c" : P.pick(VIOLET); for (let y = 0; y < 16; y++) P.px(x, y, c); } },
  violet_pillar_top(P) { P.fill(VIOLET); P.rect(2, 2, 12, 12, "#8c6890"); P.rect(5, 5, 6, 6, "#b088b2"); },
  frame_side(P) { P.fill(["#3a6a5a", "#346050"]); P.rect(0, 0, 16, 4, "#e8e4b0"); P.rect(0, 12, 16, 4, "#dcd8a2"); },
  frame_top(P) { P.fill(["#3a6a5a"]); P.rect(0, 0, 16, 2, "#e8e4b0"); P.rect(0, 14, 16, 2, "#e8e4b0"); P.rect(4, 4, 8, 8, "#1e3a32"); },
  frame_top_eye(P) { PAINT.frame_top(P); P.rect(5, 5, 6, 6, "#3ad0a0"); P.rect(7, 6, 2, 4, "#0a2a2a"); },
  end_portal(P) { P.fill(["#060614", "#0a0a1e", "#04040c"]); for (let i = 0; i < 9; i++) P.px(Math.floor(P.r() * 16), Math.floor(P.r() * 16), P.pick(["#5ae0d0", "#9a7aff", "#ffffff"])); },
  gateway(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, P.r() < 0.08 ? "rgba(255,255,255,.9)" : "rgba(30,20,60,.8)"); },
  wyrm_egg(P) { P.fill(["#1a1020", "#141018", "#221828"]); P.specks(8, ["#5a2a7a", "#7a3aa0"]); },
  chorus_plant(P) { P.fill(["#6a4a7a", "#5e4270", "#7a5a8a"]); P.rect(2, 2, 12, 12, "#8a6a9a"); P.rect(5, 5, 6, 6, "#5e4270"); },
  chorus_flower(P) { P.fill(["#c8a8d8", "#d8b8e8", "#b898c8"]); P.rect(4, 4, 8, 8, "#e8d0f0"); },
  shellbox_side(P) { P.fill(["#9a6aa8", "#8e609c"]); P.rect(0, 7, 16, 2, "#5a3a68"); },
  shellbox_top(P) { P.fill(["#9a6aa8", "#a676b4"]); P.rect(3, 3, 10, 10, "#b088c0"); }
});
function crop(P, h, pal) { for (let x = 1; x < 16; x += 2) { const hh = Math.max(2, h - Math.floor(P.r() * 3)); for (let y = 15; y > 15 - hh; y--) P.px(x + (y % 3 === 0 ? 0 : 0), y, P.pick(pal)); } }
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
  ingot(P, c) { c = c || ["#dcdcdc", "#a0a0a0", "#ffffff"]; for (let y = 6; y < 11; y++) for (let x = 3; x < 13; x++) P.px(x, y, y === 6 ? c[2] : y === 10 ? c[1] : c[0]); P.rect(4, 5, 8, 1, c[2]); },
  skyshard(P) { const pts = [[8, 2], [7, 3], [8, 3], [9, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4]]; for (let y = 4; y < 13; y++) { const w = y < 8 ? y - 2 : 14 - y; for (let x = 8 - w; x <= 8 + w; x++) P.px(x, y, x < 8 ? "#3fc5d3" : "#7ef0f5"); } pts.forEach(([x, y]) => P.px(x, y, "#c9fbfd")); },
  apple(P) { for (let y = 5; y < 14; y++) for (let x = 3; x < 13; x++) { const dx = x - 7.5, dy = y - 9.5; if (dx * dx + dy * dy < 22) P.px(x, y, x < 6 && y < 9 ? "#ff6a5e" : "#d8302a"); } P.rect(8, 2, 1, 4, "#6a4825"); P.rect(9, 3, 3, 2, "#4f9a33"); },
  clay_ball(P) { blob(P, ["#a3aab8", "#b4bbc8", "#8d94a3"]); },
  brick(P) { for (let y = 6; y < 11; y++) for (let x = 2; x < 14; x++) P.px(x, y, y === 6 ? "#c45a48" : y === 10 ? "#7d3328" : "#a4473a"); },
  tool_pick(P, c) { handle(P); for (let x = 2; x < 14; x++) { const y = 3 + Math.round(Math.pow((x - 8) / 6, 2) * 3); P.px(x, y, c[0]); P.px(x, y + 1, c[1]); } },
  tool_axe(P, c) { handle(P); for (let y = 2; y < 8; y++) for (let x = 6; x < 12; x++) if (x - 6 + (7 - y) < 9) P.px(x, y, y === 2 || x === 6 ? c[1] : c[0]); },
  tool_shovel(P, c) { handle(P); for (let y = 1; y < 6; y++) for (let x = 9; x < 14; x++) if ((x - 11.5) ** 2 + (y - 3.5) ** 2 < 6.5) P.px(x, y, x === 9 ? c[1] : c[0]); },
  tool_sword(P, c) { for (let i = 0; i < 9; i++) { P.px(5 + i, 10 - i, c[0]); P.px(6 + i, 10 - i, c[1]); } P.px(14, 1, c[0]); P.rect(3, 10, 4, 1, "#5a3d20"); P.rect(5, 8, 1, 4, "#5a3d20"); P.px(3, 12, "#8a6235"); P.px(2, 13, "#8a6235"); }
};
Object.assign(ICON_PAINT, {
  seeds(P) { for (const [x, y] of [[4, 6], [8, 4], [11, 8], [6, 10], [9, 12], [3, 12]]) { P.px(x, y, "#5a9a2a"); P.px(x + 1, y, "#3a7a1a"); } },
  wheat(P) { for (let i = 0; i < 4; i++) { const x = 4 + i * 2; P.rect(x, 7, 1, 8, "#8a7a2a"); P.rect(x - 1, 2, 3, 6, i % 2 ? "#e0c060" : "#c9a640"); } },
  bread(P) { for (let y = 6; y < 12; y++) for (let x = 2; x < 14; x++) if ((x - 8) ** 2 / 36 + (y - 9) ** 2 / 9 < 1) P.px(x, y, y < 8 ? "#d8a050" : "#b07830"); P.rect(5, 7, 1, 2, "#8a5a20"); P.rect(8, 7, 1, 2, "#8a5a20"); P.rect(11, 7, 1, 2, "#8a5a20"); },
  carrot(P) { for (let i = 0; i < 9; i++) { P.px(4 + i, 12 - i, "#f08a1a"); P.px(5 + i, 12 - i, "#d86a10"); } P.rect(12, 1, 2, 3, "#4f9a33"); P.rect(13, 3, 2, 1, "#6bb544"); },
  meat(P, c) { for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) if ((x - 8) ** 2 / 25 + (y - 8.5) ** 2 / 18 < 1) P.px(x, y, c[0]); P.rect(10, 9, 3, 2, c[1]); P.rect(12, 10, 2, 3, c[1]); },
  eye(P) { for (let y = 5; y < 12; y++) for (let x = 4; x < 12; x++) if ((x - 8) ** 2 + (y - 8.5) ** 2 < 12) P.px(x, y, "#b02030"); P.rect(7, 7, 2, 2, "#1a1a1a"); },
  egg(P) { for (let y = 3; y < 14; y++) for (let x = 4; x < 12; x++) if ((x - 8) ** 2 / 14 + (y - 8.5) ** 2 / 28 < 1) P.px(x, y, x < 7 && y < 8 ? "#ffffff" : "#e8dcc0"); },
  bucket(P, c) { for (let y = 5; y < 14; y++) { const w = 5 - Math.floor((y - 5) / 3); P.rect(8 - w, y, w * 2, 1, y === 13 ? "#8a8a8a" : "#c8c8c8"); } P.rect(3, 4, 10, 1, "#8a8a8a"); if (c && c[0]) P.rect(4, 5, 8, 2, c[0]); P.rect(3, 2, 1, 2, "#8a8a8a"); P.rect(12, 2, 1, 2, "#8a8a8a"); P.rect(4, 1, 8, 1, "#8a8a8a"); },
  bone(P) { for (let i = 0; i < 9; i++) P.px(4 + i, 11 - i, "#eeeadc"); for (const [x, y] of [[3, 11], [4, 12], [3, 12], [12, 3], [13, 2], [13, 3]]) P.px(x, y, "#ffffff"); },
  bonemeal(P) { for (let i = 0; i < 18; i++) P.px(4 + Math.floor(P.r() * 8), 5 + Math.floor(P.r() * 8), P.pick(["#ffffff", "#e8e4d8"])); },
  arrow(P) { for (let i = 0; i < 10; i++) P.px(3 + i, 12 - i, "#8a6235"); P.rect(12, 2, 2, 2, "#8a8a8a"); P.px(11, 2, "#6a6a6a"); P.px(13, 4, "#6a6a6a"); P.rect(2, 12, 2, 2, "#ffffff"); P.px(4, 13, "#e8e8e8"); },
  string(P) { let x = 3, y = 3; for (let i = 0; i < 14; i++) { P.px(x, y, "#f0f0f0"); x += i % 3 ? 1 : 0; y += i % 2 ? 1 : 0; } },
  feather(P) { for (let i = 0; i < 10; i++) { P.px(4 + i, 13 - i, "#c8c8c8"); P.px(5 + i, 13 - i, "#ffffff"); P.px(4 + i, 12 - i, "#f0f0f0"); } },
  flint(P) { blob(P, ["#3a3a3a", "#2a2a2a", "#4a4a4a"]); P.px(6, 6, "#6a6a6a"); },
  powder(P) { for (let i = 0; i < 24; i++) P.px(4 + Math.floor(P.r() * 9), 6 + Math.floor(P.r() * 7), P.pick(["#5a5a5a", "#7a7a7a", "#3a3a3a"])); },
  gloop(P, c) { blob(P, c ? [c[0], "#ffb050", "#e06a1a"] : ["#6ac85a", "#7ad86a", "#5ab84a"]); P.rect(6, 6, 2, 2, c ? "#ffe0a0" : "#b8f0a8"); },
  pearl(P) { for (let y = 4; y < 13; y++) for (let x = 4; x < 13; x++) if ((x - 8.5) ** 2 + (y - 8.5) ** 2 < 16) P.px(x, y, x + y < 14 ? "#3ad0a0" : "#1a7a6a"); P.rect(7, 7, 3, 3, "#0a3a3a"); },
  leather(P) { for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) if ((x + y) % 7 !== 0) P.px(x, y, P.pick(["#9a5a32", "#8a4e2a"])); },
  bow(P) { for (let i = 0; i < 11; i++) { const t = i / 10, x = 2 + Math.round(t * 11), y = 13 - Math.round(t * 11) - Math.round(Math.sin(t * Math.PI) * 3); P.px(x, y, "#8a6235"); P.px(x, y - 1, "#6a4825"); } for (let i = 0; i < 11; i++) P.px(3 + i, 12 - i, "#e8e8e8"); },
  shears(P) { P.rect(5, 3, 2, 6, "#dcdcdc"); P.rect(9, 3, 2, 6, "#c0c0c0"); P.rect(4, 9, 3, 4, "#b03a2a"); P.rect(9, 9, 3, 4, "#b03a2a"); },
  flintsteel(P) { P.rect(3, 4, 6, 3, "#c8c8c8"); P.rect(3, 4, 2, 8, "#c8c8c8"); blob(P, ["#3a3a3a"]); },
  armor_helmet(P, c) { P.rect(3, 4, 10, 6, c[0]); P.rect(5, 8, 6, 2, "rgba(0,0,0,0)"); P.clear(5, 8); for (let x = 5; x < 11; x++) for (let y = 8; y < 10; y++) P.clear(x, y); P.rect(3, 4, 10, 1, "rgba(255,255,255,.4)"); },
  armor_chest(P, c) { P.rect(3, 3, 10, 10, c[0]); for (let y = 3; y < 6; y++) for (let x = 6; x < 10; x++) P.clear(x, y); P.rect(1, 3, 2, 5, c[0]); P.rect(13, 3, 2, 5, c[0]); P.rect(3, 12, 10, 1, "rgba(0,0,0,.25)"); },
  armor_legs(P, c) { P.rect(4, 3, 8, 3, c[0]); P.rect(4, 6, 3, 8, c[0]); P.rect(9, 6, 3, 8, c[0]); P.rect(4, 3, 8, 1, "rgba(255,255,255,.4)"); },
  armor_boots(P, c) { P.rect(3, 8, 3, 4, c[0]); P.rect(10, 8, 3, 4, c[0]); P.rect(2, 12, 5, 2, c[0]); P.rect(9, 12, 5, 2, c[0]); },
  spawn_egg(P, c) { for (let y = 2; y < 15; y++) for (let x = 3; x < 13; x++) if ((x - 8) ** 2 / 20 + (y - 8.5) ** 2 / 38 < 1) P.px(x, y, c[0]); for (let i = 0; i < 7; i++) P.rect(4 + Math.floor(P.r() * 7), 4 + Math.floor(P.r() * 9), 2, 2, c[1]); },
  tool_hoe(P, c) { handle(P); P.rect(7, 2, 6, 2, c[0]); P.rect(7, 4, 2, 2, c[1]); },
  nugget(P) { for (const [x, y] of [[6, 7], [9, 8], [7, 10]]) { P.rect(x, y, 2, 2, "#ffd84a"); P.px(x, y, "#fff2a0"); } },
  quartz(P) { for (let i = 0; i < 7; i++) { P.rect(5 + i, 11 - i, 2, 2, i % 2 ? "#f2ece0" : "#dcd2c0"); } P.rect(9, 4, 3, 2, "#ffffff"); },
  dust(P, c) { for (let i = 0; i < 26; i++) P.px(4 + Math.floor(P.r() * 9), 6 + Math.floor(P.r() * 7), P.pick(c)); },
  rod(P) { for (let i = 0; i < 11; i++) { P.px(3 + i, 13 - i, "#ffb030"); P.px(4 + i, 13 - i, "#fff07a"); } },
  tear(P) { for (let y = 3; y < 14; y++) { const w = y < 8 ? (y - 3) / 2 : 3 - (y - 8) * 0.4; for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) P.px(x, y, x < 8 ? "#d8f4ff" : "#a8d8f0"); } },
  wart(P) { for (const [x, y] of [[5, 6], [9, 5], [7, 9]]) { P.rect(x, y, 3, 3, "#a01e1e"); P.px(x, y, "#d83a3a"); } },
  scrap(P) { blob(P, ["#4a3a34", "#56443c", "#3e302a"]); P.rect(6, 6, 4, 1, "#7a6a60"); },
  eye_void(P) { for (let y = 3; y < 14; y++) for (let x = 3; x < 14; x++) if ((x - 8.5) ** 2 + (y - 8.5) ** 2 < 25) P.px(x, y, x + y < 15 ? "#5af0c0" : "#2a9a7a"); P.rect(7, 5, 3, 7, "#0a2a22"); P.rect(6, 7, 1, 3, "#0a2a22"); P.rect(10, 7, 1, 3, "#0a2a22"); },
  shell(P) { for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) if ((x - 8) ** 2 / 36 + (y - 8.5) ** 2 / 30 < 1) P.px(x, y, y < 8 ? "#b088c0" : "#9a6aa8"); P.rect(2, 8, 12, 1, "#5a3a68"); },
  chorus(P) { for (let y = 4; y < 13; y++) for (let x = 4; x < 13; x++) if ((x - 8.5) ** 2 + (y - 8.5) ** 2 < 18) P.px(x, y, P.pick(["#9a6aa8", "#b088c0", "#7a5a8a"])); P.rect(8, 2, 1, 3, "#5a3a68"); },
  scale(P) { for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) if ((x - 8) ** 2 + (y - 8.5) ** 2 < 20) P.px(x, y, (x + y) % 3 ? "#2a1a3a" : "#5a2a7a"); },
  glider(P) { for (let x = 1; x < 15; x++) { const h = Math.round(6 - Math.abs(x - 7.5) * 0.6); for (let y = 4; y < 4 + h + 4; y++) if (Math.abs(x - 7.5) > 1) P.px(x, y + Math.abs(x - 7.5) * 0.3, y === 4 ? "#9a8aa8" : "#6a5a7a"); } P.rect(7, 4, 2, 8, "#4a3a5a"); },
  skull(P) { P.rect(4, 3, 8, 8, "#2a2a2a"); P.rect(5, 11, 6, 3, "#2a2a2a"); P.rect(5, 6, 2, 2, "#0a0a0a"); P.rect(9, 6, 2, 2, "#0a0a0a"); P.rect(6, 12, 1, 2, "#5a5a5a"); P.rect(9, 12, 1, 2, "#5a5a5a"); }
});
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
