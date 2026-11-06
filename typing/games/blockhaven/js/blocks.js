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
  HOLLOW_BRICKS: 77, VIOLET_PILLAR: 78,
  // villages and the Blightking
  SKULL: 79, BEACON: 80, JADE_ORE: 81, JADE_BLOCK: 82, COMPOSTER: 83, FLETCH_TABLE: 84, LOOM: 85, ALTAR: 86, SMITH_TABLE: 87, HAY: 88,
  // water life and wildlife
  BEE_NEST: 89, BEEHIVE: 90, BERRY_BUSH: 91, BLACK_WOOL: 92,
  // Milestone 8: personal storage
  VOID_CHEST: 93,
  // beacons, respawn anchors, lodestones
  SKY_BLOCK: 94, DUSK_BLOCK: 95, RESPAWN_ANCHOR: 96, LODESTONE: 97,
  // the Cinder Citadel and Cindermaw
  CINDER_BRICKS: 98, CINDER_ALTAR: 99, CINDER_EGG: 100,
  // the Forsaken World
  WARD_STONE: 101, WARD_ALTAR: 102, NOTE_STAND: 103, RETURN_GATE: 104, PALE_BRICKS: 105, ARENA_WARD: 106, PALE_ALTAR: 107, PALE_EFFIGY: 108, WARD_CANDLE: 109,
  // the Lost Civilization: the Deep, Echohold, and the Echo Expanse
  DARKSLATE: 110, DARKSLATE_BRICKS: 111, HUSHMOSS: 112, HUSH_NODE: 113, KEEPER_LAMP: 114, KEEPER_COPPER: 115, RESONATOR: 116, GATE_SOCKET: 117, GATE_FRAME: 118, GATE_VEIL: 119,
  LUMEN_CRYSTAL: 120, DRIPSTONE: 121, CAVE_MOSS: 122, ECHOSTONE: 123, RESONANT_GLASS: 124, ROOTWOOD: 125, LORE_TABLET: 126, KEEPER_STONE: 127, LUMEN_GRASS: 128, KEEPER_BEACON: 129,
  DEEP_LIFT: 130, MURAL: 131, ANCHOR_STATION: 132, HUSH_CARPET: 133, WARDEN_TROPHY: 134, SOVEREIGN_TROPHY: 135, KEEPER_SWITCH: 136,
  // the three temples
  TIDE_BRICKS: 137, TIDE_LAMP: 138, VINE_BRICKS: 139, VINES: 140, SUN_BRICKS: 141, SUN_GLYPH: 142, SUN_MIRROR: 143, TRAP_VENT: 144, CRACKED_FLOOR: 145, RELIC_PEDESTAL: 146,
  // Milestone 12 (the Sparkworks Update), part A: signals
  SPARK_ORE: 147, DARK_SPARK_ORE: 148, SPARK_DUST: 149, SPARK_BLOCK: 150, SPARK_TORCH: 151, LEVER: 152,
  STONE_BUTTON: 153, OAK_BUTTON: 154, BIRCH_BUTTON: 155, CRIMSON_BUTTON: 156, WARPED_BUTTON: 157,
  OAK_PLATE: 158, BIRCH_PLATE: 159, CRIMSON_PLATE: 160, WARPED_PLATE: 161, STONE_PLATE: 162, GOLD_PLATE: 163, IRON_PLATE: 164,
  REPEATER: 165, COMPARATOR: 166, SPARK_LAMP: 167, IRON_DOOR: 168,
  OAK_TRAPDOOR: 169, BIRCH_TRAPDOOR: 170, CRIMSON_TRAPDOOR: 171, WARPED_TRAPDOOR: 172, IRON_TRAPDOOR: 173,
  OAK_FENCE: 174, BIRCH_FENCE: 175, CRIMSON_FENCE: 176, WARPED_FENCE: 177, OAK_GATE: 178, BIRCH_GATE: 179, CRIMSON_GATE: 180, WARPED_GATE: 181,
  NOTE_BLOCK: 182, TARGET: 183, DAYLIGHT: 184,
  // part B: movers and sensors
  PISTON: 185, STICKY_PISTON: 186, PISTON_HEAD: 187, MOVING: 188, GLOOP_BLOCK: 189, HONEY_BLOCK: 190, OBSERVER: 191,
  TRIPWIRE_HOOK: 192, TRIPWIRE: 193, TRAPPED_CHEST: 194, HUSH_SENSOR: 195, TUNED_SENSOR: 196, BELL: 197,
  // part C: item machines
  HOPPER: 198, DROPPER: 199, DISPENSER: 200, CRAFTER: 201,
  // part D: rails
  RAIL: 202, POWERED_RAIL: 203, DETECTOR_RAIL: 204, ACTIVATOR_RAIL: 205,
  // the Starter Home (js/starter.js)
  SIGN: 206, BOOKSHELF: 207, MAP_TABLE: 208,
  // the Legacy Campaign (js/campaign.js)
  WAYSTONE: 209, RUNE_STONE: 210
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
  EYE: 385, GLIDER: 386, SHELL: 387, CHORUS_FRUIT: 388, WYRM_SCALE: 389, JADE: 390, RADIANT_STAR: 391, SADDLE: 392,
  SPAWN: 400,   // spawn eggs: 400 + index in SPAWN_EGGS
  FISHING_ROD: 500, RAW_MINNOW: 501, COOKED_MINNOW: 502, SUNFIN: 503, PUFFER: 504, INK_SAC: 505, BOAT: 506, BERRIES: 507,
  HONEYCOMB: 508, BOTTLE: 509, HONEY_BOTTLE: 510,
  SHIELD: 520, TOTEM: 521, GOLDEN_APPLE: 522, GOLDEN_CARROT: 523, COMPASS: 524,
  CINDER_EYE: 525, EMBER_HEART: 526, CINDER_CROWN: 527,
  PALE_SHARD: 528, PALE_LANTERN: 529, SIGIL_HEARTH: 530, SIGIL_STONE: 531, SIGIL_ROOT: 532, WARD_HEART: 533, WARD_LANTERN: 534,
  TIDAL_HEART: 540, VERDANT_LENS: 541, SOLAR_SEAL: 542, RESONANCE_CORE: 543, STAB_ARCHIVE: 544, STAB_FOUNDRY: 545, STAB_GARDEN: 546, SURVEY_MAP: 547,
  ECHO_SHARD: 548, ECHO_COMPASS: 549, WARDEN_PLATE: 550, ECHO_MANTLE: 551, LUMEN_SHARD: 552,
  TIDE_CHARM: 553, LEAFSTEP_BOOTS: 554, SUNWARD_HELM: 555,
  SPARKDUST: 556, MINECART: 557, CHEST_CART: 558, HOPPER_CART: 559, FURNACE_CART: 560, TNT_CART: 561, CHEST_BOAT: 562,
  EXPLORER_MAP: 563,
  // the Legacy Campaign
  RELIC_EARTH: 564, RELIC_NATURE: 565, RELIC_TIDES: 566, ANCIENT_KEY: 567, DESERT_MAP: 568, OCEAN_MAP: 569, EXPEDITION_MAP: 570, TIDE_CHARM: 571
};

// A block value stores the block id in the low 8 bits and extra state ("meta") in the high 8 bits.
export const idOf = v => v & 255;
export const metaOf = v => v >> 8;
export const make = (id, meta = 0) => id | (meta << 8);
// Meta bits: facing 0-3 (0 = +z, 1 = +x, 2 = -z, 3 = -x), OPEN for doors, TOP for door tops, LIT for furnaces
export const OPEN = 4, TOP = 8, LIT = 4, HEAD = 8, WET = 1, EYE_IN = 4;
// Bee nests and hives keep their honey level (0-5) above the facing bits
export const HONEY_MAX = 5, honeyOf = v => (metaOf(v) >> 2) & 7;

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
block(B.SKULL, "Blight Skull", { shape: "head", render: "cutout", hardness: 1, drops: I.BLIGHT_SKULL, tex: "skull_face", noItem: true, category: "Ember Depths" });
block(B.BEACON, "Beacon", { shape: "glow", render: "water", hardness: 3, light: 15, interact: "beacon", tex: "beacon", category: "Useful" });
block(B.JADE_ORE, "Jade Ore", { hardness: 3, tool: "pick", tier: 3, drops: I.JADE, tex: "jade_ore", category: "Nature" });
block(B.JADE_BLOCK, "Block of Jade", { hardness: 5, tool: "pick", tier: 3, tex: "jade_block" });
block(B.COMPOSTER, "Composter", { hardness: 0.6, tool: "axe", tex: ["composter_top", "composter_side", "planks"], category: "Village", job: "farmer" });
block(B.FLETCH_TABLE, "Fletching Table", { hardness: 2.5, tool: "axe", tex: ["fletch_top", "fletch_side", "planks"], category: "Village", job: "fletcher" });
block(B.LOOM, "Loom", { hardness: 2.5, tool: "axe", tex: ["loom_top", "loom_side", "planks"], category: "Village", job: "shepherd" });
block(B.ALTAR, "Healing Altar", { hardness: 2, tool: "pick", tier: 1, light: 6, tex: ["altar_top", "altar_side", "cobble"], category: "Village", job: "cleric" });
block(B.SMITH_TABLE, "Smithing Anvil", { hardness: 5, tool: "pick", tier: 1, tex: ["smith_top", "smith_side", "iron_block"], category: "Village", job: "smith" });
block(B.HAY, "Hay Bale", { hardness: 0.5, tool: "hoe", tex: ["hay_top", "hay_side", "hay_top"], category: "Village" });
block(B.BEE_NEST, "Bee Nest", { hardness: 0.3, tool: "axe", interact: "hive", tex: ["nest_top", "nest_side", "nest_top"], front: "nest_front", category: "Nature" });
block(B.BEEHIVE, "Beehive", { hardness: 0.6, tool: "axe", interact: "hive", tex: ["hive_top", "hive_side", "hive_top"], front: "hive_front", category: "Useful" });
block(B.BERRY_BUSH, "Berry Bush", { shape: "cross", render: "cutout", solid: false, hardness: 0, drops: "berries", interact: "berries", tex: "berry0", noItem: true, category: "Nature" });
block(B.BLACK_WOOL, "Black Wool", { hardness: 0.8, tool: "shears", tex: "black_wool" });
block(B.SHELL_BOX, "Shell Box", { hardness: 2, tool: "pick", interact: "shellbox", drops: 0, tex: ["shellbox_top", "shellbox_side", "shellbox_top"], category: "Useful" });
// Every Void Chest opens the same personal storage, in any dimension. Breaking one drops the chest; the storage stays with you.
block(B.VOID_CHEST, "Void Chest", { hardness: 8, tool: "pick", tier: 1, light: 7, interact: "voidchest", tex: ["voidchest_top", "voidchest_side", "voidchest_top"], front: "voidchest_front", category: "Useful" });
// Mineral blocks hold up a Beacon's pyramid
block(B.SKY_BLOCK, "Block of Skyshard", { hardness: 5, tool: "pick", tier: 3, tex: "sky_block" });
block(B.DUSK_BLOCK, "Block of Duskmetal", { hardness: 8, tool: "pick", tier: 4, tex: "dusk_block" });
// Respawn Anchor (meta = charges 0–4): only works in the Ember Depths
block(B.RESPAWN_ANCHOR, "Respawn Anchor", { hardness: 8, tool: "pick", tier: 3, interact: "anchor", tex: ["anchor_top", "anchor_side", "anchor_bottom"], category: DEPTHS });
block(B.LODESTONE, "Lodestone", { hardness: 3.5, tool: "pick", tier: 1, interact: "lodestone", tex: ["lodestone_top", "lodestone_side", "lodestone_top"], category: "Useful" });
// The Cinder Citadel: its bricks are very tough (Duskmetal pickaxe, slow), and the altar can't be broken
block(B.CINDER_BRICKS, "Cinder Bricks", { hardness: 40, tool: "pick", tier: 5, tex: "cinder_bricks", category: DEPTHS });
block(B.CINDER_ALTAR, "Cinder Altar", { hardness: Infinity, drops: 0, light: 9, interact: "cinderaltar", tex: ["cinder_altar_top", "cinder_altar_side", "cinder_bricks"], category: DEPTHS });
block(B.CINDER_EGG, "Cindermaw Egg", { hardness: 3, tool: "pick", tier: 1, light: 12, tex: "cinder_egg", category: DEPTHS });
// The Forsaken World (Herobrine's adventure). Story blocks can't be broken so the adventure can always be finished.
const FORSAKEN = "Forsaken World";
block(B.WARD_STONE, "Ward Stone", { hardness: Infinity, drops: 0, light: 12, interact: "wardstone", tex: ["ward_top", "ward_side", "stone_bricks"], category: FORSAKEN });
block(B.WARD_ALTAR, "Ward Altar", { hardness: Infinity, drops: 0, light: 4, interact: "wardaltar", tex: ["ward_altar_top", "ward_altar_side", "stone_bricks"], category: FORSAKEN });
block(B.NOTE_STAND, "Old Note", { hardness: Infinity, drops: 0, interact: "note", tex: ["note_top", "planks", "planks"], category: FORSAKEN });
block(B.RETURN_GATE, "Return Gate", { hardness: Infinity, drops: 0, light: 10, interact: "returngate", tex: "return_gate", category: FORSAKEN });
block(B.PALE_BRICKS, "Pale Bricks", { hardness: 30, tool: "pick", tier: 4, tex: "pale_bricks", category: FORSAKEN });
block(B.ARENA_WARD, "Arena Ward", { hardness: Infinity, drops: 0, interact: "arenaward", tex: ["arena_ward_top", "arena_ward_side", "pale_bricks"], category: FORSAKEN });
block(B.PALE_ALTAR, "Pale Altar", { hardness: Infinity, drops: 0, light: 6, interact: "palealtar", tex: ["pale_altar_top", "pale_altar_side", "pale_bricks"], category: FORSAKEN });
block(B.PALE_EFFIGY, "Pale Effigy", { hardness: 2, tool: "pick", tier: 1, light: 5, tex: ["pale_effigy_top", "pale_effigy", "pale_effigy_top"], front: "pale_effigy_front", category: FORSAKEN });
block(B.WARD_CANDLE, "Ward Candle", { shape: "torch", render: "cutout", solid: false, hardness: 0, light: 11, interact: "candle", tex: "ward_candle", category: FORSAKEN });
// The Lost Civilization. Keeper Stone, gate frames, sockets, tablets, beacons, and the lift can't be broken, so the adventure can't be softlocked.
const LOST = "Lost Civilization";
block(B.DARKSLATE, "Darkslate", { hardness: 3, tool: "pick", tier: 1, tex: "darkslate", category: LOST });
block(B.DARKSLATE_BRICKS, "Darkslate Bricks", { hardness: 3.5, tool: "pick", tier: 1, tex: "darkslate_bricks", category: LOST });
block(B.HUSHMOSS, "Hushmoss", { hardness: 0.6, tool: "shovel", tex: ["hushmoss", "hushmoss_side", "darkslate"], category: LOST });
block(B.HUSH_NODE, "Hush Node", { hardness: 1.5, tool: "shovel", light: 4, tex: ["hush_node", "hushmoss_side", "darkslate"], category: LOST });
block(B.KEEPER_LAMP, "Keeper Lamp", { hardness: 1, tool: "pick", light: 13, tex: "keeper_lamp", category: LOST });
block(B.KEEPER_COPPER, "Keeper Copper", { hardness: 3, tool: "pick", tier: 1, tex: "keeper_copper", category: LOST });
block(B.RESONATOR, "Resonator", { hardness: Infinity, drops: 0, light: 5, interact: "resonator", tex: ["resonator_top", "resonator_side", "keeper_copper"], category: LOST });
block(B.GATE_SOCKET, "Gate Socket", { hardness: Infinity, drops: 0, light: 3, interact: "socket", tex: ["socket_top", "socket_side", "keeper_stone"], category: LOST });
block(B.GATE_FRAME, "First Gate Frame", { hardness: Infinity, drops: 0, light: 2, tex: "gate_frame", category: LOST });
block(B.GATE_VEIL, "First Gate", { shape: "water", render: "water", solid: false, hardness: Infinity, drops: 0, light: 6, tex: "gate_veil", noItem: true, category: LOST });
block(B.LUMEN_CRYSTAL, "Lumen Crystal", { hardness: 1.5, tool: "pick", light: 12, render: "cutout", drops: "lumen", tex: "lumen_crystal", category: LOST });
block(B.DRIPSTONE, "Dripstone", { hardness: 1.5, tool: "pick", tier: 1, tex: "dripstone", category: LOST });
block(B.CAVE_MOSS, "Cave Moss", { hardness: 0.4, tool: "shovel", tex: "cave_moss", category: LOST });
block(B.ECHOSTONE, "Echostone", { hardness: 2, tool: "pick", tier: 1, tex: "echostone", category: LOST });
block(B.RESONANT_GLASS, "Resonant Glass", { hardness: 0.5, render: "cutout", drops: 0, tex: "resonant_glass", category: LOST });
block(B.ROOTWOOD, "Pale Rootwood", { hardness: 2, tool: "axe", tex: ["rootwood_top", "rootwood", "rootwood_top"], category: LOST });
block(B.LORE_TABLET, "Keeper Tablet", { hardness: Infinity, drops: 0, light: 3, interact: "lore", tex: ["tablet_top", "tablet_side", "keeper_stone"], category: LOST });
block(B.KEEPER_STONE, "Keeper Stone", { hardness: Infinity, drops: 0, tex: "keeper_stone", category: LOST });
block(B.LUMEN_GRASS, "Lumen Grass", { hardness: 0.6, tool: "shovel", drops: B.ECHOSTONE, tex: ["lumen_grass", "lumen_grass_side", "echostone"], category: LOST });
block(B.KEEPER_BEACON, "Keeper Beacon", { hardness: Infinity, drops: 0, light: 11, interact: "checkpoint", tex: ["beacon_k_top", "beacon_k_side", "keeper_stone"], category: LOST });
block(B.DEEP_LIFT, "Keeper Lift", { hardness: Infinity, drops: 0, light: 8, interact: "lift", tex: ["lift_top", "lift_side", "keeper_stone"], category: LOST });
block(B.MURAL, "Keeper Mural", { hardness: Infinity, drops: 0, interact: "mural", tex: "mural", category: LOST });
block(B.ANCHOR_STATION, "Resonance Anchor", { hardness: Infinity, drops: 0, light: 4, interact: "anchorstation", tex: ["anchor_top", "anchor_s_side", "echostone"], category: LOST });
block(B.HUSH_CARPET, "Hush Carpet", { hardness: 0.3, tex: "hush_carpet", category: LOST });
block(B.WARDEN_TROPHY, "First Warden Trophy", { hardness: 3, tool: "pick", tier: 1, light: 6, tex: ["warden_t_top", "warden_t_side", "darkslate"], front: "warden_t_front", category: LOST });
block(B.SOVEREIGN_TROPHY, "Sovereign's Crown", { hardness: 3, tool: "pick", tier: 1, light: 10, tex: ["crown_top", "crown_side", "echostone"], category: LOST });
block(B.KEEPER_SWITCH, "Keeper Switch", { hardness: Infinity, drops: 0, light: 2, interact: "switch", tex: ["switch_top", "switch_side", "keeper_stone"], category: LOST });
// The temples (sea, jungle, desert). Vents, cracked floors, mirrors, and pedestals can't be broken, so no trap or puzzle can be skipped into a softlock.
block(B.TIDE_BRICKS, "Tide Bricks", { hardness: 3, tool: "pick", tier: 1, tex: "tide_bricks", category: LOST });
block(B.TIDE_LAMP, "Tide Lamp", { hardness: 1, tool: "pick", light: 13, tex: "tide_lamp", category: LOST });
block(B.VINE_BRICKS, "Overgrown Temple Bricks", { hardness: 3, tool: "pick", tier: 1, tex: "vine_bricks", category: LOST });
block(B.VINES, "Hanging Vines", { shape: "cross", render: "cutout", solid: false, hardness: 0.2, drops: 0, tex: "vines", replaceable: true, category: LOST });
block(B.SUN_BRICKS, "Sun Bricks", { hardness: 3, tool: "pick", tier: 1, tex: "sun_bricks", category: LOST });
block(B.SUN_GLYPH, "Carved Sun Glyph", { hardness: 3, tool: "pick", tier: 1, light: 4, tex: ["sun_bricks", "sun_glyph", "sun_bricks"], category: LOST });
block(B.SUN_MIRROR, "Sun Mirror", { hardness: Infinity, drops: 0, light: 3, interact: "mirror", tex: ["mirror_top", "mirror_side", "sun_bricks"], category: LOST });
block(B.TRAP_VENT, "Trap Vent", { hardness: Infinity, drops: 0, tex: "trap_vent", category: LOST });
block(B.CRACKED_FLOOR, "Cracked Floor", { hardness: Infinity, drops: 0, tex: "cracked_floor", category: LOST });
block(B.RELIC_PEDESTAL, "Relic Pedestal", { hardness: Infinity, drops: 0, light: 6, interact: "pedestal", tex: ["pedestal_top", "pedestal_side", "keeper_stone"], category: LOST });
// ----- Milestone 12: Sparkworks (signals). Rules follow Minecraft Java Edition 1.20.1; "Sparkdust" is Blockhaven's name for redstone.
// shape "model" blocks are drawn from small boxes (see js/shapes.js); "dust" is the flat wire.
const MECH = "Mechanisms";
block(B.SPARK_ORE, "Spark Ore", { hardness: 3, tool: "pick", tier: 3, drops: "spark", tex: "spark_ore", interact: "sparkore", category: "Nature" });
block(B.DARK_SPARK_ORE, "Darkslate Spark Ore", { hardness: 4.5, tool: "pick", tier: 3, drops: "spark", tex: "dark_spark_ore", interact: "sparkore", category: LOST });
block(B.SPARK_DUST, "Sparkdust", { shape: "dust", render: "cutout", solid: false, hardness: 0, drops: I.SPARKDUST, tex: "dust_line0", noItem: true, interact: "dust", category: MECH });
block(B.SPARK_BLOCK, "Block of Sparkdust", { hardness: 5, tool: "pick", tier: 1, tex: "spark_block", category: MECH });
block(B.SPARK_TORCH, "Spark Torch", { shape: "model", render: "cutout", solid: false, hardness: 0, tex: "spark_torch", category: MECH, icon: "tile:spark_torch" });
block(B.LEVER, "Lever", { shape: "model", render: "cutout", solid: false, hardness: 0.5, interact: "lever", tex: "cobble", category: MECH, icon: "lever" });
const WOODS = [["OAK", "Oak", "planks"], ["BIRCH", "Birch", "birch_planks"], ["CRIMSON", "Crimson", "crimson_planks"], ["WARPED", "Warped", "warped_planks"]];
block(B.STONE_BUTTON, "Stone Button", { shape: "model", render: "cutout", solid: false, hardness: 0.5, tool: "pick", interact: "button", tex: "stone", category: MECH, icon: "button" });
for (const [k, n, t] of WOODS) {
  block(B[k + "_BUTTON"], n + " Button", { shape: "model", render: "cutout", solid: false, hardness: 0.5, tool: "axe", interact: "button", tex: t, category: MECH, icon: "button", wood: true });
  block(B[k + "_PLATE"], n + " Pressure Plate", { shape: "model", render: "cutout", solid: false, hardness: 0.5, tool: "axe", tex: t, category: MECH, iconBox: 1 / 16, wood: true });
  block(B[k + "_TRAPDOOR"], n + " Trapdoor", { shape: "model", render: "cutout", hardness: 3, tool: "axe", interact: "trapdoor", tex: "trap_" + k.toLowerCase(), category: MECH, icon: "tile:trap_" + k.toLowerCase() });
  block(B[k + "_FENCE"], n + " Fence", { shape: "model", render: "cutout", hardness: 2, tool: "axe", tex: t, category: "Building", icon: "fence", fence: true });
  block(B[k + "_GATE"], n + " Fence Gate", { shape: "model", render: "cutout", hardness: 2, tool: "axe", interact: "gate", tex: t, category: MECH, icon: "gate" });
}
block(B.STONE_PLATE, "Stone Pressure Plate", { shape: "model", render: "cutout", solid: false, hardness: 0.5, tool: "pick", tex: "stone", category: MECH, iconBox: 1 / 16 });
block(B.GOLD_PLATE, "Light Weighted Pressure Plate", { shape: "model", render: "cutout", solid: false, hardness: 0.5, tool: "pick", tex: "gold_block", category: MECH, iconBox: 1 / 16 });
block(B.IRON_PLATE, "Heavy Weighted Pressure Plate", { shape: "model", render: "cutout", solid: false, hardness: 0.5, tool: "pick", tex: "iron_block", category: MECH, iconBox: 1 / 16 });
block(B.REPEATER, "Repeater", { shape: "model", render: "cutout", hardness: 0, interact: "repeater", tex: ["repeater_top", "slab_side", "slab_side"], category: MECH, iconBox: 2 / 16 });
block(B.COMPARATOR, "Comparator", { shape: "model", render: "cutout", hardness: 0, interact: "comparator", tex: ["comparator_top", "slab_side", "slab_side"], category: MECH, iconBox: 2 / 16 });
block(B.SPARK_LAMP, "Spark Lamp", { hardness: 0.3, tex: "lamp_off", category: MECH });
block(B.IRON_DOOR, "Iron Door", { shape: "door", render: "cutout", hardness: 5, tool: "pick", tier: 1, interact: "irondoor", tex: "iron_door_bottom", category: MECH });
block(B.IRON_TRAPDOOR, "Iron Trapdoor", { shape: "model", render: "cutout", hardness: 5, tool: "pick", tier: 1, interact: "irontrapdoor", tex: "trap_iron", category: MECH, icon: "tile:trap_iron" });
block(B.NOTE_BLOCK, "Note Block", { hardness: 0.8, tool: "axe", interact: "note", tex: "note_block", category: MECH });
block(B.TARGET, "Target", { hardness: 0.5, tool: "hoe", tex: ["target_top", "target_side", "target_top"], category: MECH });
// part B. Pistons, observers, and heads face one of 6 ways (meta bits 0-2: 0 up, 1 down, 2-5 = DIR[0-3]).
block(B.PISTON, "Piston", { shape: "model", render: "cutout", hardness: 1.5, tool: "pick", tex: "piston_side", category: MECH, icon: "piston" });
block(B.STICKY_PISTON, "Sticky Piston", { shape: "model", render: "cutout", hardness: 1.5, tool: "pick", tex: "piston_side", category: MECH, icon: "piston", colors: ["#6ac85a"] });
block(B.PISTON_HEAD, "Piston Head", { shape: "model", render: "cutout", hardness: 1.5, tool: "pick", drops: 0, tex: "piston_top", noItem: true, category: MECH });
block(B.MOVING, "Moving Block", { shape: "none", render: "none", solid: false, hardness: Infinity, drops: 0, tex: "stone", noItem: true, category: MECH });
block(B.GLOOP_BLOCK, "Gloop Block", { shape: "jelly", render: "water", hardness: 0, tex: "gloop_block", category: MECH });
block(B.HONEY_BLOCK, "Honey Block", { shape: "jelly", render: "water", hardness: 0, tex: "honey_block", category: MECH });
block(B.OBSERVER, "Observer", { shape: "model", render: "cutout", hardness: 3, tool: "pick", tier: 1, tex: "observer_side", category: MECH, icon: "tile:observer_front" });
block(B.TRIPWIRE_HOOK, "Tripwire Hook", { shape: "model", render: "cutout", solid: false, hardness: 0, tex: "hook", category: MECH, icon: "hook" });
block(B.TRIPWIRE, "Tripwire", { shape: "model", render: "cutout", solid: false, hardness: 0, drops: I.STRING, tex: "tripwire", noItem: true, category: MECH });
block(B.TRAPPED_CHEST, "Trapped Chest", { hardness: 2.5, tool: "axe", interact: "chest", tex: ["chest_top", "trapped_side", "chest_top"], front: "trapped_front", category: MECH });
block(B.HUSH_SENSOR, "Hush Sensor", { shape: "model", render: "cutout", hardness: 1.5, tool: "hoe", light: 1, tex: ["hush_sensor_top", "hush_sensor_side", "hush_sensor_side"], category: LOST, iconBox: 8 / 16 });
block(B.TUNED_SENSOR, "Tuned Hush Sensor", { shape: "model", render: "cutout", hardness: 1.5, tool: "hoe", light: 1, tex: ["tuned_sensor_top", "hush_sensor_side", "hush_sensor_side"], category: MECH, iconBox: 8 / 16 });
block(B.BELL, "Bell", { shape: "model", render: "cutout", hardness: 5, tool: "pick", interact: "bell", tex: "bell", category: "Village", icon: "bell" });
// part C. Hoppers point down or to a side (meta bits 0-2, same 6-way numbers as pistons) + HOPPER_LOCKED.
// Droppers, dispensers, and crafters face 6 ways (bits 0-2) + TRIGGERED (and CRAFTING for the crafter's flash).
block(B.HOPPER, "Hopper", { shape: "model", render: "cutout", hardness: 3, tool: "pick", tier: 1, interact: "hopper", tex: "hopper_outside", category: MECH, icon: "hopper" });
block(B.DROPPER, "Dropper", { hardness: 3.5, tool: "pick", tier: 1, interact: "dropper", tex: ["furnace_top", "furnace_side", "furnace_top"], front: "dropper_front", front6: true, category: MECH });
block(B.DISPENSER, "Dispenser", { hardness: 3.5, tool: "pick", tier: 1, interact: "dispenser", tex: ["furnace_top", "furnace_side", "furnace_top"], front: "dispenser_front", front6: true, category: MECH });
block(B.CRAFTER, "Crafter", { hardness: 1.5, tool: "pick", tier: 1, interact: "crafter", tex: ["crafter_top", "crafter_side", "crafter_bottom"], front: "crafter_front", front6: true, category: MECH });
// part D. Rails: bits 0-3 shape (0 along z, 1 along x, 2-5 sloping up toward +x, −x, −z, +z, 6-9 curves +z/+x, +z/−x, −z/−x, −z/+x) + RAIL_ON.
block(B.RAIL, "Rail", { shape: "rail", render: "cutout", solid: false, hardness: 0.7, tool: "pick", tex: "rail", category: MECH, icon: "tile:rail" });
block(B.POWERED_RAIL, "Powered Rail", { shape: "rail", render: "cutout", solid: false, hardness: 0.7, tool: "pick", tex: "rail_powered", category: MECH, icon: "tile:rail_powered" });
block(B.DETECTOR_RAIL, "Detector Rail", { shape: "rail", render: "cutout", solid: false, hardness: 0.7, tool: "pick", tex: "rail_detector", category: MECH, icon: "tile:rail_detector" });
block(B.ACTIVATOR_RAIL, "Activator Rail", { shape: "rail", render: "cutout", solid: false, hardness: 0.7, tool: "pick", tex: "rail_activator", category: MECH, icon: "tile:rail_activator" });
block(B.DAYLIGHT, "Daylight Sensor", { shape: "model", render: "cutout", hardness: 0.2, tool: "axe", interact: "daylight", tex: ["daylight_top", "daylight_side", "daylight_side"], category: MECH, iconBox: 6 / 16 });
// ----- the Starter Home: signs you can read (and write on), bookshelves, and the Expedition Table (it holds your Explorer's Map)
block(B.SIGN, "Wooden Sign", { shape: "model", render: "cutout", solid: false, hardness: 1, tool: "axe", interact: "sign", tex: "sign", faces: true, category: "Useful", icon: "sign" });
block(B.BOOKSHELF, "Bookshelf", { hardness: 1.5, tool: "axe", tex: ["planks", "bookshelf", "planks"], category: "Building" });
block(B.MAP_TABLE, "Expedition Table", { hardness: 2.5, tool: "axe", interact: "maptable", tex: ["map_table_top", "map_table_side", "planks"], category: "Useful" });
block(B.WAYSTONE, "Waystone", { hardness: Infinity, drops: 0, light: 10, interact: "waystone", tex: ["waystone_top", "waystone_side", "stone_bricks"], category: "Useful" });   // campaign fast travel (js/campaign.js)
block(B.RUNE_STONE, "Rune Stone", { hardness: Infinity, drops: 0, light: 7, interact: "rune", tex: "rune_stone", category: "Useful" });             // a campaign boss arena device

export const BEACON_BASE =[B.IRON_BLOCK, B.GOLD_BLOCK, B.JADE_BLOCK, B.SKY_BLOCK, B.DUSK_BLOCK];
export const ANCHOR_MAX = 4;
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
// ----- Sparkworks block state ("meta") layouts -----
// Sparkdust: bits 0-3 power, DOT = drawn as a dot instead of a cross when nothing connects.
// Spark Torch: bits 0-2 attach (0 floor, 1-4 wall: support is in direction DIR[attach-1]), UNLIT.
// Lever and buttons: bits 0-2 attach (0 floor, 1 ceiling, 2-5 wall: support in DIR[attach-2]), AXIS_X, ON.
// Plates, Target, Daylight Sensor: bits 0-3 power (Daylight: INVERT). Repeater: bits 0-1 facing (the way its output points), bits 2-3 delay-1, ON, LOCKED.
// Comparator: bits 0-1 facing, SUBTRACT, ON (output is kept by the signal engine). Doors, trapdoors, gates: OPEN, TOP (door top / trapdoor upper half), POWERED.
// Spark Ore and Spark Lamp: bit 0 = lit. Note Block: bits 0-4 pitch (0-24), NOTE_ON.
// Part B: pistons EXTENDED, heads STICKY_HEAD, observers OBS_ON; tripwire hooks bits 0-1 support side + ATTACHED + HOOK_ON; strings ATTACHED + HOOK_ON + DISARMED;
// trapped chest OPENED; Hush Sensors bits 0-1 phase (0 waiting, 1 active, 2 resting), bits 2-5 power, bits 6-7 facing (tuned); bells bits 0-1 facing + BELL_POWERED.
export const RAIL_ON = 16;
export const isRail = id => id >= B.RAIL && id <= B.ACTIVATOR_RAIL;
export const HOPPER_LOCKED = 8, TRIGGERED = 8, CRAFTING = 16;
export const isMachine = id => id === B.HOPPER || id === B.DROPPER || id === B.DISPENSER || id === B.CRAFTER;
export const EXTENDED = 8, STICKY_HEAD = 8, OBS_ON = 8, ATTACHED = 4, HOOK_ON = 8, DISARMED = 16, OPENED = 16, BELL_POWERED = 4;
export const isPiston = id => id === B.PISTON || id === B.STICKY_PISTON;
export const isHush = id => id === B.HUSH_SENSOR || id === B.TUNED_SENSOR;
export const DOT = 16, UNLIT = 8, AXIS_X = 8, ON = 16, INVERT = 16, LOCKED = 32, SUBTRACT = 4, CMP_ON = 8, POWERED = 16, NOTE_ON = 32;
export const isDoor = id => id === B.DOOR || id === B.IRON_DOOR;
export const isTrapdoor = id => id >= B.OAK_TRAPDOOR && id <= B.IRON_TRAPDOOR;
export const isFence = id => id >= B.OAK_FENCE && id <= B.WARPED_FENCE;
export const isGate = id => id >= B.OAK_GATE && id <= B.WARPED_GATE;
export const isButton = id => id >= B.STONE_BUTTON && id <= B.WARPED_BUTTON;
export const isPlate = id => id >= B.OAK_PLATE && id <= B.IRON_PLATE;
export const lightOf = v => (idOf(v) === B.FURNACE && (metaOf(v) & LIT)) ? 13 : idOf(v) === B.SPARK_LAMP ? (metaOf(v) & 1 ? 15 : 0) : idOf(v) === B.SPARK_TORCH ? (metaOf(v) & UNLIT ? 0 : 7) :
  (idOf(v) === B.SPARK_ORE || idOf(v) === B.DARK_SPARK_ORE) ? (metaOf(v) & 1 ? 9 : 0) : idOf(v) === B.RESPAWN_ANCHOR ? [0, 3, 7, 11, 15][Math.min(4, metaOf(v) & 7)] : (idOf(v) === B.WARD_ALTAR || idOf(v) === B.ARENA_WARD) && (metaOf(v) & 1) ? 14 : EMIT[v & 255];

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
item(I.JADE, "Jade", { icon: "jade" });
item(I.RADIANT_STAR, "Radiant Star", { icon: "star" });
item(I.SADDLE, "Saddle", { icon: "saddle" });
// water life and wildlife
item(I.FISHING_ROD, "Fishing Rod", { icon: "fishing_rod", kind: "tool", stack: 1, category: "Tools", tool: { type: "rod", tier: 0, speed: 1, dur: 64, damage: 1 } });
item(I.RAW_MINNOW, "Raw Minnow", { icon: "fish", colors: ["#9aa8b0", "#d8dce0"], kind: "food", food: 2, category: "Food", raw: true });
item(I.COOKED_MINNOW, "Cooked Minnow", { icon: "fish", colors: ["#b8844a", "#e0b878"], kind: "food", food: 5, category: "Food" });
item(I.SUNFIN, "Sunfin", { icon: "fish", colors: ["#f08a1a", "#ffffff"], kind: "food", food: 1, category: "Food" });
item(I.PUFFER, "Puffer", { icon: "puffer", kind: "food", food: 1, category: "Food", sideEffect: "puffer" });
item(I.INK_SAC, "Ink Sac", { icon: "inksac" });
item(I.BOAT, "Boat", { icon: "boat", stack: 1, category: "Tools" });
item(I.BERRIES, "Sweet Berries", { icon: "berries", kind: "food", food: 2, plants: B.BERRY_BUSH, category: "Food" });
item(I.HONEYCOMB, "Honeycomb", { icon: "comb" });
item(I.BOTTLE, "Glass Bottle", { icon: "bottle", colors: [null], stack: 16, category: "Tools" });
item(I.HONEY_BOTTLE, "Honey Bottle", { icon: "bottle", colors: ["#f0a820"], kind: "food", food: 6, stack: 16, category: "Food", sideEffect: "honey" });
// Milestone 8: shields, the Lifeward Totem, golden foods
item(I.SHIELD, "Shield", { icon: "shield", kind: "tool", stack: 1, category: "Tools", tool: { type: "shield", tier: 0, speed: 1, dur: 336, damage: 1 }, offhand: true });
item(I.TOTEM, "Lifeward Totem", { icon: "totem", stack: 1, category: "Tools", offhand: true });
item(I.GOLDEN_APPLE, "Golden Apple", { icon: "apple", colors: ["gold"], kind: "food", food: 4, category: "Food", sideEffect: "golden", alwaysEat: true });
item(I.PALE_SHARD, "Pale Shard", { icon: "pale_shard" });
item(I.PALE_LANTERN, "Pale Lantern", { icon: "pale_lantern", stack: 1, category: "Tools" });
item(I.SIGIL_HEARTH, "Hearth Sigil", { icon: "sigil", colors: ["#f0a040"], stack: 1, quest: true });
item(I.SIGIL_STONE, "Stone Sigil", { icon: "sigil", colors: ["#a0a8b8"], stack: 1, quest: true });
item(I.SIGIL_ROOT, "Root Sigil", { icon: "sigil", colors: ["#6ac85a"], stack: 1, quest: true });
item(I.WARD_HEART, "Ward Heart", { icon: "ward_heart", stack: 1, quest: true });
item(I.WARD_LANTERN, "Wardlight Lantern", { icon: "pale_lantern", colors: ["#7ad8ff"], stack: 1, category: "Tools", offhand: true });
item(I.TIDAL_HEART, "Tidal Heart", { icon: "relic", colors: ["#3ab0c8", "#c8f4ff"], stack: 1, quest: true });
item(I.VERDANT_LENS, "Verdant Lens", { icon: "relic", colors: ["#4ac85a", "#e0ffc8"], stack: 1, quest: true });
item(I.SOLAR_SEAL, "Solar Seal", { icon: "relic", colors: ["#f0b830", "#fff4c0"], stack: 1, quest: true });
item(I.RESONANCE_CORE, "Warden's Resonance Core", { icon: "relic", colors: ["#2ad0c8", "#ffffff"], stack: 1, quest: true });
item(I.STAB_ARCHIVE, "Archive Stabilizer", { icon: "stabilizer", colors: ["#8ab0e8"], stack: 1, quest: true });
item(I.STAB_FOUNDRY, "Foundry Stabilizer", { icon: "stabilizer", colors: ["#e09a5a"], stack: 1, quest: true });
item(I.STAB_GARDEN, "Garden Stabilizer", { icon: "stabilizer", colors: ["#9ae0a0"], stack: 1, quest: true });
item(I.SURVEY_MAP, "Keeper Survey Map", { icon: "survey_map", stack: 1, category: "Tools", offhand: true });
item(I.ECHO_SHARD, "Echo Shard", { icon: "echo_shard", stack: 16, category: "Tools" });
item(I.ECHO_COMPASS, "Echo Compass", { icon: "compass", stack: 1, category: "Tools", offhand: true });
item(I.WARDEN_PLATE, "Warden-Plate Chestplate", { icon: "armor_chest", colors: ["#2a5a6a"], kind: "armor", stack: 1, category: "Tools", armor: { slot: 1, points: 8, dur: 900 }, hush: true });
item(I.ECHO_MANTLE, "Echo Mantle", { icon: "glider", colors: ["#2ad0c8"], kind: "armor", stack: 1, category: "Tools", armor: { slot: 1, points: 7, dur: 1200 }, mantle: true });
item(I.LUMEN_SHARD, "Lumen Shard", { icon: "pale_shard" });
item(I.TIDE_CHARM, "Tidecaller Charm", { icon: "relic", colors: ["#2a8aa8", "#8af0ff"], stack: 1, category: "Tools", offhand: true });
item(I.LEAFSTEP_BOOTS, "Leafstep Boots", { icon: "armor_boots", colors: ["#4a9a3a"], kind: "armor", stack: 1, category: "Tools", armor: { slot: 3, points: 4, dur: 900 }, leafstep: true });
item(I.SUNWARD_HELM, "Sunward Helm", { icon: "armor_helmet", colors: ["#f0b830"], kind: "armor", stack: 1, category: "Tools", armor: { slot: 0, points: 5, dur: 1100 }, fireproof: true });
item(I.CINDER_EYE, "Cinder Eye", { icon: "eye_cinder", stack: 16, category: "Tools" });
item(I.EMBER_HEART, "Ember Heart", { icon: "ember_heart", stack: 16 });
item(I.CINDER_CROWN, "Cinder Crown", { icon: "armor_helmet", colors: ["#e0702a"], kind: "armor", stack: 1, category: "Tools", armor: { slot: 0, points: 4, dur: 900 }, fireproof: true });
item(I.COMPASS, "Compass", { icon: "compass", stack: 1, category: "Tools", offhand: true });
item(I.GOLDEN_CARROT, "Golden Carrot", { icon: "carrot", colors: ["gold"], kind: "food", food: 6, category: "Food" });
items[I.STRING].places = B.TRIPWIRE;
item(I.MINECART, "Minecart", { icon: "cart", stack: 1, category: "Mechanisms", cart: "minecart" });
item(I.CHEST_CART, "Minecart with Chest", { icon: "cart", colors: ["chest"], stack: 1, category: "Mechanisms", cart: "chest_cart" });
item(I.HOPPER_CART, "Minecart with Hopper", { icon: "cart", colors: ["hopper"], stack: 1, category: "Mechanisms", cart: "hopper_cart" });
item(I.FURNACE_CART, "Minecart with Furnace", { icon: "cart", colors: ["furnace"], stack: 1, category: "Mechanisms", cart: "furnace_cart" });
item(I.TNT_CART, "Minecart with Blast Block", { icon: "cart", colors: ["tnt"], stack: 1, category: "Mechanisms", cart: "tnt_cart" });
item(I.RELIC_EARTH, "Relic of Earth", { icon: "relic", colors: ["#8a6a3a", "#e8c890"], stack: 1, quest: true });
item(I.RELIC_NATURE, "Relic of Nature", { icon: "relic", colors: ["#2f8a2c", "#b8f0a0"], stack: 1, quest: true });
item(I.RELIC_TIDES, "Relic of the Tides", { icon: "relic", colors: ["#1a5ab0", "#a8e0ff"], stack: 1, quest: true });
item(I.ANCIENT_KEY, "Ancient Key", { icon: "ancient_key", stack: 3, quest: true });
item(I.DESERT_MAP, "Ancient Desert Map", { icon: "survey_map", stack: 1, quest: true });
item(I.OCEAN_MAP, "Ancient Ocean Map", { icon: "survey_map", stack: 1, quest: true });
item(I.EXPEDITION_MAP, "Expedition Map", { icon: "survey_map", stack: 1, quest: true });
item(I.TIDE_CHARM, "Tide Charm", { icon: "relic", colors: ["#3ab0c8", "#e8ffff"], stack: 1, quest: true });   // carry it and you never run out of air
item(I.EXPLORER_MAP, "Explorer's Map", { icon: "explorer_map", stack: 1, category: "Tools", offhand: true });   // press M (or right-click it) to open; see js/starter.js
item(I.CHEST_BOAT, "Boat with Chest",{ icon: "boat", colors: ["chest"], stack: 1, category: "Tools" });   // string can be laid down as tripwire between two hooks
item(I.SPARKDUST, "Sparkdust", { icon: "dust", colors: ["#ff5a2a", "#c2361a", "#ff8a4a"], category: "Mechanisms", places: B.SPARK_DUST });
// Saturation ("fullness") from each food, following Minecraft Java Edition 1.20.1. Fullness is used up before the food bar drops.
const SATURATION = { [I.APPLE]: 2.4, [I.BREAD]: 6, [I.CARROT]: 3.6, [I.RAW_BEEF]: 1.8, [I.STEAK]: 12.8, [I.RAW_PORK]: 1.8, [I.COOKED_PORK]: 12.8,
  [I.RAW_CHICKEN]: 1.2, [I.COOKED_CHICKEN]: 7.2, [I.RAW_MUTTON]: 1.2, [I.COOKED_MUTTON]: 9.6, [I.RAW_RABBIT]: 1.8, [I.COOKED_RABBIT]: 6,
  [I.ROTTEN_FLESH]: 0.8, [I.SPIDER_EYE]: 3.2, [I.CHORUS_FRUIT]: 2.4, [I.RAW_MINNOW]: 0.4, [I.COOKED_MINNOW]: 6, [I.SUNFIN]: 0.2, [I.PUFFER]: 0.2,
  [I.BERRIES]: 0.4, [I.HONEY_BOTTLE]: 1.2, [I.GOLDEN_APPLE]: 9.6, [I.GOLDEN_CARROT]: 14.4, [I.MILK_BUCKET]: 0 };
for (const [id, s] of Object.entries(SATURATION)) items[id].sat = s;
items[I.CHORUS_FRUIT].alwaysEat = true; items[I.MILK_BUCKET].alwaysEat = true;
items[I.BLIGHT_SKULL].places = B.SKULL;   // skulls can be set down as blocks (three on Wailing Sand summon the Blightking)
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
  ["sheller", "Sheller", "#9a6aa8", "#e8d0f0"], ["villager", "Villager", "#8a5a3a", "#e8b890"], ["golem", "Ironwarden", "#d8d4cc", "#6a8a4a"], ["blightking", "Blightking", "#1a1a1a", "#5a5a5a"],
  ["scout", "Scout", "#a8a8a4", "#6a6a66"], ["whisker", "Whisker", "#e0902a", "#f4e8d8"], ["trotter", "Trotter", "#8a5a32", "#2a1a10"],
  ["minnow", "Minnow", "#9aa8b0", "#5a6a74"], ["sunfin", "Sunfin", "#f08a1a", "#ffffff"], ["puffer", "Puffer", "#e8c840", "#5a8ab0"], ["squid", "Inkling", "#2a3a5a", "#5a6a8a"],
  ["dolphin", "Splasher", "#8a9ab0", "#e8ecf0"], ["fox", "Pouncer", "#e0782a", "#f4ece0"], ["bee", "Buzzer", "#f0c020", "#2a2018"], ["parrot", "Chatterbird", "#d8302a", "#2a8ad8"]];
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
  { out: [B.SIGN, 3], ins: [["planks", 6], [I.STICK, 1]], table: true },
  { out: [B.BOOKSHELF, 1], ins: [["planks", 6], [I.LEATHER, 3]], table: true },
  { out: [B.MAP_TABLE, 1], ins: [["planks", 4], [I.COMPASS, 1]], table: true },
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
  { out: [B.JADE_BLOCK, 1], ins: [[I.JADE, 9]], table: true },
  { out: [I.JADE, 9], ins: [[B.JADE_BLOCK, 1]], table: true },
  { out: [B.BEACON, 1], ins: [[I.RADIANT_STAR, 1], [B.GLASS, 5], [B.OBSIDIAN, 3]], table: true },
  { out: [B.COMPOSTER, 1], ins: [["planks", 7]], table: true },
  { out: [B.FLETCH_TABLE, 1], ins: [[I.FLINT, 2], ["planks", 4]], table: true },
  { out: [B.LOOM, 1], ins: [[I.STRING, 2], ["planks", 2]], table: true },
  { out: [B.ALTAR, 1], ins: [[B.COBBLE, 4], [I.SHINE_DUST, 1]], table: true },
  { out: [B.SMITH_TABLE, 1], ins: [[I.IRON_INGOT, 2], ["planks", 4]], table: true },
  { out: [B.HAY, 1], ins: [[I.WHEAT, 9]] },
  { out: [I.SADDLE, 1], ins: [[I.LEATHER, 5], [I.IRON_INGOT, 1]], table: true },
  { out: [I.WHEAT, 9], ins: [[B.HAY, 1]] },
  { out: [I.FISHING_ROD, 1], ins: [[I.STICK, 3], [I.STRING, 2]], table: true },
  { out: [I.BOAT, 1], ins: [["planks", 5]], table: true },
  { out: [I.BOTTLE, 3], ins: [[B.GLASS, 3]], table: true },
  { out: [B.BEEHIVE, 1], ins: [[I.HONEYCOMB, 3], ["planks", 6]], table: true },
  { out: [B.BLACK_WOOL, 1], ins: [[B.WOOL, 1], [I.INK_SAC, 1]] },
  { out: [B.SHELL_BOX, 1], ins: [[I.SHELL, 2], [B.CHEST, 1]], table: true },
  { out: [I.SHIELD, 1], ins: [["planks", 6], [I.IRON_INGOT, 1]], table: true },
  { out: [I.PALE_LANTERN, 1], ins: [[I.PALE_SHARD, 4], [B.SHINESTONE, 1], [I.IRON_INGOT, 2]], table: true },
  { out: [B.WARD_CANDLE, 2], ins: [[I.PALE_SHARD, 1], [I.HONEYCOMB, 1], [I.STRING, 1]], table: true },
  { out: [B.WARD_CANDLE, 1], ins: [[I.PALE_SHARD, 1], [I.STRING, 1], [I.COAL, 1]], table: true },
  { out: [B.PALE_BRICKS, 4], ins: [[B.STONE_BRICKS, 4], [I.PALE_SHARD, 1]], table: true },
  { out: [I.ECHO_SHARD, 4], ins: [[I.LUMEN_SHARD, 1], [B.DARKSLATE, 1]], table: true },
  { out: [I.ECHO_COMPASS, 1], ins: [[I.COMPASS, 1], [I.LUMEN_SHARD, 2]], table: true },
  { out: [B.KEEPER_LAMP, 2], ins: [[I.LUMEN_SHARD, 1], [B.DARKSLATE_BRICKS, 2]], table: true },
  { out: [B.HUSH_CARPET, 3], ins: [[B.WOOL, 2], [B.HUSHMOSS, 1]], table: true },
  { out: [B.RESONANT_GLASS, 4], ins: [[B.GLASS, 4], [I.LUMEN_SHARD, 1]], table: true },
  { out: [I.CINDER_EYE, 1], ins: [[I.WYRM_SCALE, 1], [I.EYE, 1], [I.MAGMA_CREAM, 1], [I.FLARE_POWDER, 2]], table: true },
  { out: [I.CINDER_CROWN, 1], ins: [[I.DUSK_HELMET, 1], [I.EMBER_HEART, 1]], table: true, upgrade: true },
  { out: [B.SKY_BLOCK, 1], ins: [[I.SKYSHARD, 9]], table: true },
  { out: [I.SKYSHARD, 9], ins: [[B.SKY_BLOCK, 1]], table: true },
  { out: [B.DUSK_BLOCK, 1], ins: [[I.DUSK_INGOT, 9]], table: true },
  { out: [I.DUSK_INGOT, 9], ins: [[B.DUSK_BLOCK, 1]], table: true },
  { out: [B.RESPAWN_ANCHOR, 1], ins: [[B.OBSIDIAN, 6], [B.SHINESTONE, 3]], table: true },
  { out: [I.COMPASS, 1], ins: [[I.IRON_INGOT, 4], [I.SHINE_DUST, 1]], table: true },
  { out: [B.LODESTONE, 1], ins: [[B.STONE_BRICKS, 8], [I.DUSK_INGOT, 1]], table: true },
  { out: [B.VOID_CHEST, 1], ins: [[B.OBSIDIAN, 8], [I.EYE, 1]], table: true },
  { out: [I.GOLDEN_APPLE, 1], ins: [[I.APPLE, 1], [I.GOLD_INGOT, 8]], table: true },
  { out: [I.GOLDEN_CARROT, 1], ins: [[I.CARROT, 1], [I.GOLD_NUGGET, 8]], table: true },
  { out: [B.HOLLOW_BRICKS, 4], ins: [[B.HOLLOWSTONE, 4]], table: true },
  { out: [B.VIOLET_PILLAR, 1], ins: [[B.VIOLET_BRICKS, 2]], table: true },
  // Sparkworks
  { out: [B.SPARK_BLOCK, 1], ins: [[I.SPARKDUST, 9]], table: true },
  { out: [I.SPARKDUST, 9], ins: [[B.SPARK_BLOCK, 1]] },
  { out: [B.SPARK_TORCH, 1], ins: [[I.SPARKDUST, 1], [I.STICK, 1]] },
  { out: [B.LEVER, 1], ins: [[I.STICK, 1], [B.COBBLE, 1]] },
  { out: [B.STONE_BUTTON, 1], ins: [[B.STONE, 1]] },
  { out: [B.STONE_PLATE, 1], ins: [[B.STONE, 2]], table: true },
  { out: [B.GOLD_PLATE, 1], ins: [[I.GOLD_INGOT, 2]], table: true },
  { out: [B.IRON_PLATE, 1], ins: [[I.IRON_INGOT, 2]], table: true },
  ...[["OAK", B.PLANKS], ["BIRCH", B.BIRCH_PLANKS], ["CRIMSON", B.CRIMSON_PLANKS], ["WARPED", B.WARPED_PLANKS]].flatMap(([k, pl]) => [
    { out: [B[k + "_BUTTON"], 1], ins: [[pl, 1]] },
    { out: [B[k + "_PLATE"], 1], ins: [[pl, 2]], table: true },
    { out: [B[k + "_TRAPDOOR"], 2], ins: [[pl, 6]], table: true },
    { out: [B[k + "_FENCE"], 3], ins: [[pl, 4], [I.STICK, 2]], table: true },
    { out: [B[k + "_GATE"], 1], ins: [[pl, 2], [I.STICK, 4]], table: true }]),
  { out: [B.REPEATER, 1], ins: [[B.STONE, 3], [B.SPARK_TORCH, 2], [I.SPARKDUST, 1]], table: true },
  { out: [B.COMPARATOR, 1], ins: [[B.STONE, 3], [B.SPARK_TORCH, 3], [I.QUARTZ, 1]], table: true },
  { out: [B.SPARK_LAMP, 1], ins: [[I.SPARKDUST, 4], [B.SHINESTONE, 1]], table: true },
  { out: [B.IRON_DOOR, 3], ins: [[I.IRON_INGOT, 6]], table: true },
  { out: [B.IRON_TRAPDOOR, 1], ins: [[I.IRON_INGOT, 4]], table: true },
  { out: [B.NOTE_BLOCK, 1], ins: [["planks", 8], [I.SPARKDUST, 1]], table: true },
  { out: [B.TARGET, 1], ins: [[I.SPARKDUST, 4], [B.HAY, 1]], table: true },
  { out: [B.DAYLIGHT, 1], ins: [[B.GLASS, 3], [I.QUARTZ, 3], ["planks", 3]], table: true },
  { out: [B.PISTON, 1], ins: [["planks", 3], [B.COBBLE, 4], [I.IRON_INGOT, 1], [I.SPARKDUST, 1]], table: true },
  { out: [B.STICKY_PISTON, 1], ins: [[B.PISTON, 1], [I.GLOOP_BALL, 1]] },
  { out: [B.GLOOP_BLOCK, 1], ins: [[I.GLOOP_BALL, 9]], table: true },
  { out: [I.GLOOP_BALL, 9], ins: [[B.GLOOP_BLOCK, 1]] },
  { out: [B.HONEY_BLOCK, 1], ins: [[I.HONEY_BOTTLE, 4]] },
  { out: [I.HONEY_BOTTLE, 4], ins: [[B.HONEY_BLOCK, 1], [I.BOTTLE, 4]] },
  { out: [B.OBSERVER, 1], ins: [[B.COBBLE, 6], [I.SPARKDUST, 2], [I.QUARTZ, 1]], table: true },
  { out: [B.TRIPWIRE_HOOK, 2], ins: [[I.IRON_INGOT, 1], [I.STICK, 1], ["planks", 1]], table: true },
  { out: [B.TRAPPED_CHEST, 1], ins: [[B.CHEST, 1], [B.TRIPWIRE_HOOK, 1]] },
  { out: [B.TUNED_SENSOR, 1], ins: [[B.HUSH_SENSOR, 1], [I.LUMEN_SHARD, 3]], table: true },
  { out: [B.HOPPER, 1], ins: [[I.IRON_INGOT, 5], [B.CHEST, 1]], table: true },
  { out: [B.RAIL, 16], ins: [[I.IRON_INGOT, 6], [I.STICK, 1]], table: true },
  { out: [B.POWERED_RAIL, 6], ins: [[I.GOLD_INGOT, 6], [I.STICK, 1], [I.SPARKDUST, 1]], table: true },
  { out: [B.DETECTOR_RAIL, 6], ins: [[I.IRON_INGOT, 6], [B.STONE_PLATE, 1], [I.SPARKDUST, 1]], table: true },
  { out: [B.ACTIVATOR_RAIL, 6], ins: [[I.IRON_INGOT, 6], [I.STICK, 2], [B.SPARK_TORCH, 1]], table: true },
  { out: [I.MINECART, 1], ins: [[I.IRON_INGOT, 5]], table: true },
  { out: [I.CHEST_CART, 1], ins: [[I.MINECART, 1], [B.CHEST, 1]] },
  { out: [I.HOPPER_CART, 1], ins: [[I.MINECART, 1], [B.HOPPER, 1]] },
  { out: [I.FURNACE_CART, 1], ins: [[I.MINECART, 1], [B.FURNACE, 1]] },
  { out: [I.TNT_CART, 1], ins: [[I.MINECART, 1], [B.TNT, 1]] },
  { out: [I.CHEST_BOAT, 1], ins: [[I.BOAT, 1], [B.CHEST, 1]] },
  { out: [B.DROPPER, 1], ins: [[B.COBBLE, 7], [I.SPARKDUST, 1]], table: true },
  { out: [B.DISPENSER, 1], ins: [[B.DROPPER, 1], [I.BOW, 1]], table: true },
  { out: [B.DISPENSER, 1], ins: [[B.COBBLE, 7], [I.SPARKDUST, 1], [I.BOW, 1]], table: true },
  { out: [B.CRAFTER, 1], ins: [[I.IRON_INGOT, 5], [B.TABLE, 1], [B.DROPPER, 1], [I.SPARKDUST, 2]], table: true },
  // upgrade Skyshard gear to Duskmetal (the best tier)
  ...["PICK", "AXE", "SHOVEL", "SWORD", "HOE", "HELMET", "CHEST", "LEGS", "BOOTS"].map(k => ({ out: [I["DUSK_" + k], 1], ins: [[I["SKY_" + k], 1], [I.DUSK_INGOT, 1]], table: true, upgrade: true })),
  ...["LEATHER", "GOLD", "IRON", "SKY"].flatMap(k => {
    const mat = { LEATHER: I.LEATHER, GOLD: I.GOLD_INGOT, IRON: I.IRON_INGOT, SKY: I.SKYSHARD }[k];
    return [["HELMET", 5], ["CHEST", 8], ["LEGS", 7], ["BOOTS", 4]].map(([p, n]) => ({ out: [I[k + "_" + p], 1], ins: [[mat, n]], table: true }));
  })
];
export const SMELT = { [B.IRON_ORE]: I.IRON_INGOT, [B.SAND]: B.GLASS, [B.COBBLE]: B.STONE, [I.CLAY_BALL]: I.BRICK, [B.LOG]: I.COAL, [B.BIRCH_LOG]: I.COAL,
  [I.RAW_BEEF]: I.STEAK, [I.RAW_PORK]: I.COOKED_PORK, [I.RAW_CHICKEN]: I.COOKED_CHICKEN, [I.RAW_MUTTON]: I.COOKED_MUTTON, [I.RAW_RABBIT]: I.COOKED_RABBIT,
  [B.NETHER_GOLD_ORE]: I.GOLD_INGOT, [B.QUARTZ_ORE]: I.QUARTZ, [B.ANCIENT_SCRAP]: I.DUSK_SCRAP, [B.EMBERRACK]: B.EMBER_BRICKS, [I.CHORUS_FRUIT]: B.VIOLET_BRICKS, [I.RAW_MINNOW]: I.COOKED_MINNOW,
  [B.SPARK_ORE]: I.SPARKDUST, [B.DARK_SPARK_ORE]: I.SPARKDUST };
export const FUEL = { [I.COAL]: 40, [B.LOG]: 8, [B.BIRCH_LOG]: 8, [B.PLANKS]: 7, [B.BIRCH_PLANKS]: 7, [I.STICK]: 2.5, [B.TABLE]: 7, [B.CHEST]: 7,
  [I.FLARE_ROD]: 60, [I.LAVA_BUCKET]: 100, [B.CRIMSON_PLANKS]: 7, [B.WARPED_PLANKS]: 7,
  [B.OAK_FENCE]: 7, [B.BIRCH_FENCE]: 7, [B.OAK_GATE]: 7, [B.BIRCH_GATE]: 7, [B.OAK_TRAPDOOR]: 7, [B.BIRCH_TRAPDOOR]: 7, [B.NOTE_BLOCK]: 7, [B.DAYLIGHT]: 7,
  [B.OAK_BUTTON]: 2.5, [B.BIRCH_BUTTON]: 2.5, [B.OAK_PLATE]: 7, [B.BIRCH_PLATE]: 7, [B.LEVER]: 1.5 };
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
  "wyrm_egg", "chorus_plant", "chorus_flower", "shellbox_top", "shellbox_side",
  "skull_face", "beacon", "jade_ore", "jade_block", "composter_top", "composter_side", "fletch_top", "fletch_side", "loom_top", "loom_side",
  "altar_top", "altar_side", "smith_top", "smith_side", "hay_top", "hay_side",
  "nest_top", "nest_side", "nest_front", "nest_front_honey", "hive_top", "hive_side", "hive_front", "hive_front_honey", "berry0", "berry1", "berry2", "berry3", "black_wool",
  "voidchest_top", "voidchest_side", "voidchest_front", "sky_block", "dusk_block", "anchor_top", "anchor_top_lit", "anchor_side", "anchor_bottom", "lodestone_top", "lodestone_side", "cinder_bricks", "cinder_altar_top", "cinder_altar_side", "cinder_egg",
  "ward_top", "ward_side", "ward_altar_top", "ward_altar_side", "ward_altar_lit", "note_top", "return_gate", "pale_bricks", "arena_ward_top", "arena_ward_side", "arena_ward_lit",
  "pale_altar_top", "pale_altar_side", "pale_effigy", "pale_effigy_top", "pale_effigy_front", "ward_candle",
  "darkslate", "darkslate_bricks", "hushmoss", "hushmoss_side", "hush_node", "keeper_lamp", "keeper_copper", "resonator_top", "resonator_side", "socket_top", "socket_top_on", "socket_side",
  "gate_frame", "gate_veil", "gate_veil_open", "lumen_crystal", "dripstone", "cave_moss", "echostone", "resonant_glass", "rootwood", "rootwood_top", "tablet_top", "tablet_side", "keeper_stone",
  "lumen_grass", "lumen_grass_side", "beacon_k_top", "beacon_k_side", "lift_top", "lift_side", "mural", "anchor_top", "anchor_top_on", "anchor_s_side", "hush_carpet",
  "warden_t_top", "warden_t_side", "warden_t_front", "crown_top", "crown_side", "switch_top", "switch_top_on", "switch_side",
  "tide_bricks", "tide_lamp", "vine_bricks", "vines", "sun_bricks", "sun_glyph", "mirror_top", "mirror_top_on", "mirror_side", "trap_vent", "cracked_floor", "pedestal_top", "pedestal_side",
  // Sparkworks (the atlas grew to 16 × 32 tiles for these)
  "spark_ore", "spark_ore_lit", "dark_spark_ore", "dark_spark_ore_lit", "spark_block", "spark_torch", "spark_torch_off", "lever_handle",
  "dust_line0", "dust_line1", "dust_line2", "dust_line3", "dust_line4", "dust_line5", "dust_dot0", "dust_dot1", "dust_dot2", "dust_dot3", "dust_dot4", "dust_dot5",
  "repeater_top", "repeater_top_on", "comparator_top", "comparator_top_on", "slab_side", "lamp_off", "lamp_on", "iron_door_bottom", "iron_door_top",
  "trap_oak", "trap_birch", "trap_crimson", "trap_warped", "trap_iron", "note_block", "target_top", "target_side", "daylight_top", "daylight_inv_top", "daylight_side",
  "piston_side", "piston_top", "piston_top_sticky", "piston_bottom", "piston_inner", "gloop_block", "honey_block", "observer_front", "observer_back", "observer_back_on", "observer_side", "observer_top",
  "hook", "tripwire", "trapped_front", "trapped_side", "hush_sensor_top", "hush_sensor_top_on", "hush_sensor_side", "tuned_sensor_top", "tendril", "tendril_on", "bell", "bell_post",
  "hopper_outside", "hopper_top", "hopper_inside", "dropper_front", "dispenser_front", "crafter_front", "crafter_front_on", "crafter_top", "crafter_side", "crafter_bottom",
  "rail", "rail_curve", "rail_powered", "rail_powered_on", "rail_detector", "rail_detector_on", "rail_activator", "rail_activator_on",
  // the Starter Home
  "sign", "bookshelf", "map_table_top", "map_table_side",
  // the Legacy Campaign
  "waystone_top", "waystone_side", "rune_stone"];
export const ATLAS_W = 256, ATLAS_H = 512;   // pixels: 16 tiles across, 32 down
export const TILE = {};
TILE_NAMES.forEach((n, i) => { TILE[n] = i; });

// texture tile for each face: dir 0 = top, 1 = side, 2 = bottom
export function faceTile(v, dir, front) {
  const d = blockDef(v), t = d.tex;
  if (front && idOf(v) === B.CRAFTER && (metaOf(v) & CRAFTING)) return TILE.crafter_front_on;
  if (front && d.front) return TILE[idOf(v) === B.FURNACE && (metaOf(v) & LIT) ? "furnace_front_lit" : (idOf(v) === B.BEE_NEST || idOf(v) === B.BEEHIVE) && honeyOf(v) >= HONEY_MAX ? d.front + "_honey" : d.front];
  if (idOf(v) === B.BERRY_BUSH) return TILE["berry" + (metaOf(v) & 3)];
  if (idOf(v) === B.RESPAWN_ANCHOR && dir === 0 && (metaOf(v) & 7)) return TILE.anchor_top_lit;
  if (idOf(v) === B.WARD_ALTAR && dir === 0 && (metaOf(v) & 1)) return TILE.ward_altar_lit;   // a restored shrine glows
  if (idOf(v) === B.GATE_SOCKET && dir === 0 && (metaOf(v) & 1)) return TILE.socket_top_on;
  if (idOf(v) === B.GATE_VEIL && (metaOf(v) & 1)) return TILE.gate_veil_open;
  if (idOf(v) === B.ANCHOR_STATION && dir === 0 && (metaOf(v) & 1)) return TILE.anchor_top_on;
  if (idOf(v) === B.KEEPER_SWITCH && dir === 0 && (metaOf(v) & 1)) return TILE.switch_top_on;
  if (idOf(v) === B.SUN_MIRROR && dir === 0 && (metaOf(v) & 1)) return TILE.mirror_top_on;
  if (idOf(v) === B.ARENA_WARD && dir !== 2 && (metaOf(v) & 1)) return TILE.arena_ward_lit;
  if (idOf(v) === B.DOOR) return TILE[metaOf(v) & TOP ? "door_top" : "door_bottom"];
  if (idOf(v) === B.IRON_DOOR) return TILE[metaOf(v) & TOP ? "iron_door_top" : "iron_door_bottom"];
  if ((idOf(v) === B.SPARK_ORE || idOf(v) === B.DARK_SPARK_ORE) && (metaOf(v) & 1)) return TILE[t + "_lit"];
  if (idOf(v) === B.SPARK_LAMP) return TILE[metaOf(v) & 1 ? "lamp_on" : "lamp_off"];
  if (idOf(v) === B.SPARK_TORCH) return TILE[metaOf(v) & UNLIT ? "spark_torch_off" : "spark_torch"];
  if (idOf(v) === B.REPEATER && dir === 0) return TILE[metaOf(v) & ON ? "repeater_top_on" : "repeater_top"];
  if (idOf(v) === B.COMPARATOR && dir === 0) return TILE[metaOf(v) & CMP_ON ? "comparator_top_on" : "comparator_top"];
  if (idOf(v) === B.DAYLIGHT && dir === 0) return TILE[metaOf(v) & INVERT ? "daylight_inv_top" : "daylight_top"];
  if (idOf(v) >= B.POWERED_RAIL && idOf(v) <= B.ACTIVATOR_RAIL && (metaOf(v) & RAIL_ON)) return TILE[t + "_on"];
  if (idOf(v) === B.HUSH_SENSOR && dir === 0) return TILE[(metaOf(v) & 3) === 1 ? "hush_sensor_top_on" : "hush_sensor_top"];
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

const STONE = ["#898987", "#818180", "#929290", "#858584", "#777776"];
const DIRT = ["#866047", "#78533c", "#926b50", "#6c4d39", "#9d785c"];
const GREEN = ["#72a846", "#699c40", "#7bb44d", "#60923a", "#86b855"];
const PLANK = ["#af8956", "#a68150", "#ba955f"];

// Small clusters give a tile grain without the TV-static look of independent pixels.
function patches(P, palette, count, wide, tall) {
  P.rect(0, 0, 16, 16, palette[0]);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(P.r() * 16), y = Math.floor(P.r() * 16);
    const w = 1 + Math.floor(P.r() * wide), h = 1 + Math.floor(P.r() * tall);
    const color = P.pick(palette);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w - (row === h - 1 && w > 1 ? 1 : 0); col++) {
        P.px((x + col) & 15, (y + row) & 15, color);
      }
    }
  }
}

function foliage(P, palette) {
  patches(P, palette, 56, 4, 3);
  for (let i = 0; i < 15; i++) {
    const x = Math.floor(P.r() * 16), y = Math.floor(P.r() * 16);
    P.clear(x, y);
    P.clear((x + 1) & 15, y);
  }
}

const PAINT = {
  grass_top(P) { patches(P, GREEN, 58, 4, 3); },
  grass_side(P) {
    PAINT.dirt(P);
    const fringe = [3, 4, 4, 5, 4, 3, 3, 4, 6, 5, 4, 3, 3, 5, 4, 3];
    for (let x = 0; x < 16; x++) {
      const h = fringe[x], blade = GREEN[Math.floor(P.r() * 3)];
      P.rect(x, 0, 1, h - 1, blade);
      P.px(x, h - 1, GREEN[3]);
      P.px(x, h, DIRT[3]);
    }
  },
  dirt(P) { patches(P, DIRT, 67, 3, 3); P.specks(5, ["#77716a", "#a78362"]); },
  stone(P) { patches(P, STONE, 56, 5, 3); },
  cobble(P) {
    P.rect(0, 0, 16, 16, "#656562");
    const stones = [[0, 0, 5, 4], [6, 0, 6, 5], [13, 0, 4, 4], [1, 5, 4, 5], [5, 6, 5, 4],
      [11, 5, 5, 6], [-2, 11, 6, 5], [5, 11, 6, 5], [12, 12, 5, 4]];
    for (const [x, y, w, h] of stones) {
      const base = P.pick(STONE);
      for (let row = 0; row < h; row++) {
        const inset = row === 0 || row === h - 1 ? 1 : 0;
        for (let col = inset; col < w - inset; col++) {
          P.px((x + col) & 15, y + row, row === 0 ? "#a3a3a0" : row === h - 1 ? "#747471" : base);
        }
      }
    }
  },
  sand(P) { patches(P, ["#dfd0a3", "#d7c89b", "#e8d9ae", "#d1bf92"], 64, 3, 2); },
  gravel(P) { P.fill(["#8a8480", "#7a7470"]); P.specks(22, ["#a39d98", "#5f5955", "#9a8670", "#bdb6ae"], 2); },
  log_top(P) {
    P.fill(["#6b4f2e"]);
    for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      P.px(x, y, Math.round(d) % 3 === 0 ? "#9a7446" : P.pick(["#b88d58", "#c09560"]));
    }
  },
  log_side(P) {
    patches(P, ["#6a5237", "#5c452e", "#7c6242", "#705639", "#4f3b28"], 45, 2, 10);
    for (const [x, y, h] of [[1, 1, 8], [5, 4, 7], [9, 9, 7], [13, 0, 11]]) {
      P.rect(x, y, 1, h, "#4e3a26");
      P.rect(x + 1, y + 2, 1, h - 3, "#896d4a");
    }
  },
  leaves(P) { foliage(P, ["#4a8437", "#568e3c", "#39732d", "#659a45", "#30672a"]); },
  planks(P, pal = PLANK, seam = "#7f5a31") {
    patches(P, pal, 36, 7, 1);
    for (let row = 0; row < 4; row++) {
      const y = row * 4, joint = (row * 7 + 3) & 15;
      P.rect(0, y, 16, 1, pal[2]);
      P.rect(0, y + 3, 16, 1, seam);
      P.rect(joint, y, 1, 3, seam);
    }
  },
  glass(P) {
    P.rect(0, 0, 16, 1, "#dff3f7"); P.rect(0, 15, 16, 1, "#dff3f7"); P.rect(0, 0, 1, 16, "#dff3f7"); P.rect(15, 0, 1, 16, "#dff3f7");
    P.px(3, 3, "#ffffff"); P.px(4, 4, "#ffffff"); P.px(5, 5, "#eefbff"); P.px(11, 9, "#ffffff"); P.px(12, 10, "#eefbff");
  },
  water(P) {
    P.rect(0, 0, 16, 16, "rgba(47,101,182,.62)");
    for (const [x, y, w] of [[1, 2, 6], [11, 5, 8], [5, 8, 6], [14, 11, 7], [7, 14, 6]]) {
      for (let i = 0; i < w; i++) {
        const u = (x + i) & 15;
        P.clear(u, y);
        P.px(u, y, "rgba(85,150,220,.61)");
      }
    }
  },
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
  birch_leaves(P) { foliage(P, ["#739d42", "#81aa49", "#638d3b", "#90b653", "#587d33"]); },
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
Object.assign(PAINT, {
  skull_face(P) { P.fill(["#2a2a2a", "#222", "#333"]); P.rect(3, 5, 3, 3, "#0a0a0a"); P.rect(10, 5, 3, 3, "#0a0a0a"); P.rect(5, 11, 6, 2, "#0a0a0a"); P.rect(6, 11, 1, 2, "#5a5a5a"); P.rect(9, 11, 1, 2, "#5a5a5a"); },
  beacon(P) { P.fill(["rgba(200,240,255,.55)"]); P.rect(0, 0, 16, 1, "rgba(255,255,255,.9)"); P.rect(0, 15, 16, 1, "rgba(255,255,255,.9)"); P.rect(0, 0, 1, 16, "rgba(255,255,255,.9)"); P.rect(15, 0, 1, 16, "rgba(255,255,255,.9)"); P.rect(5, 5, 6, 6, "rgba(120,255,240,.95)"); },
  jade_ore(P) { PAINT.stone(P); oreSpots(P, ["#2ac86a", "#5ae08a", "#18a050"]); },
  jade_block(P) { P.fill(["#2ac86a", "#24b85e"]); P.rect(2, 2, 12, 12, "#3ad87a"); P.rect(5, 5, 6, 6, "#5ae08a"); },
  composter_side(P) { PAINT.planks(P); P.rect(0, 0, 16, 2, "#6a4a28"); for (let x = 3; x < 16; x += 5) P.rect(x, 2, 1, 14, "#6a4a28"); },
  composter_top(P) { P.fill(["#6a4a28"]); P.rect(2, 2, 12, 12, "#4a6a2a"); P.specks(8, ["#5a3a1a", "#6a8a3a"]); },
  fletch_side(P) { PAINT.birch_planks(P); P.rect(3, 4, 2, 8, "#ffffff"); P.rect(10, 5, 1, 8, "#8a6235"); P.px(9, 4, "#8a8a8a"); },
  fletch_top(P) { PAINT.birch_planks(P); P.rect(4, 4, 8, 8, "#e8d8a0"); P.rect(7, 2, 1, 12, "#8a6235"); },
  loom_side(P) { PAINT.planks(P); for (let x = 2; x < 15; x += 2) P.rect(x, 3, 1, 10, "#e8e8e8"); },
  loom_top(P) { PAINT.planks(P); P.rect(2, 2, 12, 12, "#c8302a"); P.rect(4, 4, 8, 8, "#f2f2f2"); },
  altar_side(P) { PAINT.stone_bricks(P); P.rect(6, 4, 4, 8, "#ffe27a"); P.rect(4, 6, 8, 4, "#ffe27a"); },
  altar_top(P) { P.fill(["#8f8f8f"]); P.rect(3, 3, 10, 10, "#b8a8e8"); P.rect(6, 6, 4, 4, "#ffe27a"); },
  smith_side(P) { P.fill(["#5a5a5a", "#505050"]); P.rect(0, 0, 16, 4, "#3a3a3a"); P.rect(5, 4, 6, 9, "#4a4a4a"); P.rect(2, 13, 12, 3, "#3a3a3a"); },
  smith_top(P) { P.fill(["#4a4a4a"]); P.rect(1, 3, 14, 10, "#6a6a6a"); P.rect(3, 6, 10, 4, "#7a7a7a"); },
  hay_side(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, (x + Math.floor(P.r() * 2)) % 3 ? "#d8b030" : "#c09a20"); P.rect(0, 3, 16, 1, "#8a3a20"); P.rect(0, 12, 16, 1, "#8a3a20"); },
  hay_top(P) { P.fill(["#d8b030", "#c8a028", "#e0bc40"]); P.rect(3, 0, 1, 16, "#8a3a20"); P.rect(12, 0, 1, 16, "#8a3a20"); }
});
// water life and wildlife
const NEST = ["#d8a840", "#c89830", "#e0b450"], COMB = ["#f0b828", "#e0a020"];
const bush = (P, berries) => { for (let i = 0; i < 40; i++) { const x = 1 + Math.floor(P.r() * 14), y = 4 + Math.floor(P.r() * 12); P.px(x, y, P.pick(["#2f6a2a", "#3a7a30", "#28582a"])); } for (let i = 0; i < berries; i++) { const x = 2 + Math.floor(P.r() * 11), y = 5 + Math.floor(P.r() * 9); P.rect(x, y, 2, 2, "#c8203a"); P.px(x, y, "#f06070"); } };
Object.assign(PAINT, {
  nest_side(P) { P.fill(NEST); for (let y = 2; y < 16; y += 4) P.rect(0, y, 16, 1, "#a87820"); },
  nest_top(P) { P.fill(NEST); P.rect(3, 3, 10, 10, "#b88828"); P.rect(5, 5, 6, 6, "#d8a840"); },
  nest_front(P) { PAINT.nest_side(P); P.rect(5, 6, 6, 5, "#3a2a10"); },
  nest_front_honey(P) { PAINT.nest_front(P); P.rect(5, 6, 6, 5, "#f0a820"); P.rect(6, 11, 2, 3, "#f0a820"); P.rect(10, 11, 1, 2, "#f0a820"); },
  hive_side(P) { PAINT.planks(P); P.rect(0, 0, 16, 3, "#e0b450"); P.rect(0, 13, 16, 3, "#e0b450"); },
  hive_top(P) { P.fill(COMB); for (let y = 1; y < 16; y += 4) for (let x = (y % 8 === 1 ? 0 : 2); x < 16; x += 4) P.rect(x, y, 2, 2, "#c88a18"); },
  hive_front(P) { PAINT.hive_side(P); P.rect(4, 6, 8, 2, "#2a1a10"); },
  hive_front_honey(P) { PAINT.hive_front(P); P.rect(4, 6, 8, 2, "#f0a820"); P.rect(5, 8, 2, 4, "#f0a820"); P.rect(9, 8, 1, 3, "#f0a820"); },
  berry0(P) { for (let i = 0; i < 14; i++) P.px(5 + Math.floor(P.r() * 6), 10 + Math.floor(P.r() * 6), P.pick(["#2f6a2a", "#3a7a30"])); },
  berry1(P) { bush(P, 0); },
  berry2(P) { bush(P, 3); },
  berry3(P) { bush(P, 9); },
  black_wool(P) { P.fill(["#1e1e24", "#26262c", "#18181e", "#2c2c32"]); },
  voidchest_top(P) { PAINT.obsidian(P); P.rect(0, 0, 16, 1, "#0a0612"); P.rect(0, 15, 16, 1, "#0a0612"); P.rect(0, 0, 1, 16, "#0a0612"); P.rect(15, 0, 1, 16, "#0a0612"); P.rect(6, 6, 4, 4, "#2a7a6a"); },
  voidchest_side(P) { PAINT.voidchest_top(P); P.rect(0, 5, 16, 2, "#0a0612"); },
  darkslate(P) { P.fill(["#3a3c44", "#34363e", "#40424a", "#2e3038"]); for (let y = 2; y < 16; y += 4) for (let x = 0; x < 16; x++) if (P.r() < 0.4) P.px(x, y, "#2a2c32"); },
  darkslate_bricks(P) { P.fill(["#26282e"]); for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 0; for (let b = -1; b < 3; b++) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(b * 8 + off + xx, r * 4 + yy, P.pick(["#3c3e46", "#44464e", "#383a42"])); } },
  hushmoss(P) { P.fill(["#0e2a30", "#103036", "#0a2228"]); P.specks(10, ["#1a6a70", "#2a8a8a"]); P.specks(3, ["#5ae0d0"]); },
  hushmoss_side(P) { PAINT.darkslate(P); for (let x = 0; x < 16; x++) { const h = 2 + Math.floor(P.r() * 4); for (let y = 0; y < h; y++) P.px(x, y, P.pick(["#0e2a30", "#103036", "#1a6a70"])); } },
  hush_node(P) { PAINT.hushmoss(P); P.rect(4, 4, 8, 8, "#14454a"); P.rect(6, 6, 4, 4, "#5ae0d0"); P.rect(7, 7, 2, 2, "#e0fffa"); },
  keeper_lamp(P) { P.fill(["#2a2c34"]); P.rect(2, 2, 12, 12, "#c8e8f0"); P.rect(4, 4, 8, 8, "#eef8ff"); P.rect(7, 2, 2, 12, "#9ac0d0"); P.rect(2, 7, 12, 2, "#9ac0d0"); },
  keeper_copper(P) { P.fill(["#b8703a", "#a8642e", "#c87e44"]); P.specks(6, ["#4a9a7a", "#5aaa8a"], 2); P.rect(0, 0, 16, 1, "#d8925a"); P.rect(0, 15, 16, 1, "#7a4420"); },
  resonator_side(P) { PAINT.keeper_copper(P); P.rect(5, 3, 6, 10, "#2a2c34"); for (let y = 4; y < 12; y += 2) P.rect(6, y, 4, 1, "#5ae0d0"); },
  resonator_top(P) { PAINT.keeper_copper(P); for (let r = 6; r > 0; r -= 2) { P.rect(8 - r, 8 - r, r * 2, 1, "#5ae0d0"); P.rect(8 - r, 7 + r, r * 2, 1, "#5ae0d0"); P.rect(8 - r, 8 - r, 1, r * 2, "#5ae0d0"); P.rect(7 + r, 8 - r, 1, r * 2, "#5ae0d0"); } },
  socket_side(P) { PAINT.keeper_stone(P); P.rect(4, 4, 8, 8, "#1a1c22"); P.rect(6, 6, 4, 4, "#3a4a5a"); },
  socket_top(P) { PAINT.keeper_stone(P); P.rect(3, 3, 10, 10, "#1a1c22"); P.rect(5, 5, 6, 6, "#3a4a5a"); },
  socket_top_on(P) { PAINT.keeper_stone(P); P.rect(3, 3, 10, 10, "#1a1c22"); P.rect(5, 5, 6, 6, "#5ae0d0"); P.rect(7, 7, 2, 2, "#ffffff"); },
  gate_frame(P) { P.fill(["#1e2026", "#22242a"]); P.rect(0, 0, 16, 2, "#3a3c44"); P.rect(0, 14, 16, 2, "#3a3c44"); P.rect(7, 2, 2, 12, "#2a6a70"); P.px(7, 8, "#5ae0d0"); },
  gate_veil(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, P.r() < 0.06 ? "rgba(140,220,230,.5)" : "rgba(20,30,40,.55)"); },
  gate_veil_open(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, P.r() < 0.12 ? "rgba(255,255,255,.85)" : P.pick(["rgba(40,200,200,.75)", "rgba(60,140,220,.75)", "rgba(120,90,220,.7)"])); },
  lumen_crystal(P) { for (let i = 0; i < 4; i++) { const x = 2 + Math.floor(P.r() * 10), h = 6 + Math.floor(P.r() * 8); for (let y = 15; y > 15 - h; y--) { P.px(x, y, "#7ab8ff"); P.px(x + 1, y, "#a8d8ff"); if (y < 15 - h + 2) P.px(x, y, "#e8f4ff"); } } },
  dripstone(P) { P.fill(["#8a7258", "#7e6850", "#967c60"]); for (let x = 1; x < 16; x += 3) for (let y = 0; y < 16; y++) if (P.r() < 0.5) P.px(x, y, "#6a5440"); },
  cave_moss(P) { P.fill(["#4a7a2a", "#548a30", "#3e6a24"]); P.specks(6, ["#6aa83a"]); },
  echostone(P) { P.fill(["#5a6a8a", "#52627e", "#647494"]); P.specks(5, ["#7a8ab0", "#3a4a6a"]); },
  resonant_glass(P) { P.fill(["rgba(120,220,230,.35)"]); P.rect(0, 0, 16, 1, "rgba(200,255,255,.9)"); P.rect(0, 15, 16, 1, "rgba(200,255,255,.9)"); P.rect(0, 0, 1, 16, "rgba(200,255,255,.9)"); P.rect(15, 0, 1, 16, "rgba(200,255,255,.9)"); P.rect(3, 3, 2, 2, "rgba(255,255,255,.8)"); },
  rootwood(P) { for (let x = 0; x < 16; x++) { const c = x % 4 === 0 ? "#b8b0a0" : P.pick(["#d8d0c0", "#ccc4b4", "#e0d8c8"]); for (let y = 0; y < 16; y++) P.px(x, y, c); } },
  rootwood_top(P) { P.fill(["#c8c0b0"]); P.rect(3, 3, 10, 10, "#e0d8c8"); P.rect(6, 6, 4, 4, "#b8b0a0"); },
  tablet_side(P) { PAINT.keeper_stone(P); P.rect(3, 2, 10, 12, "#2a3a44"); for (let y = 4; y < 13; y += 2) P.rect(4, y, 8, 1, "#5ae0d0"); },
  tablet_top(P) { PAINT.keeper_stone(P); P.rect(3, 3, 10, 10, "#2a3a44"); P.rect(5, 6, 6, 1, "#5ae0d0"); P.rect(5, 9, 6, 1, "#5ae0d0"); },
  keeper_stone(P) { P.fill(["#4a4e58", "#464a54", "#50545e"]); P.rect(0, 0, 16, 1, "#5a5e68"); P.rect(0, 15, 16, 1, "#30343c"); P.rect(0, 7, 16, 1, "#3a3e46"); P.px(4, 3, "#2a6a70"); P.px(11, 11, "#2a6a70"); },
  lumen_grass(P) { P.fill(["#2a8a9a", "#3a9aaa", "#24808e"]); P.specks(8, ["#8af0f0", "#c8ffff"]); },
  lumen_grass_side(P) { PAINT.echostone(P); for (let x = 0; x < 16; x++) { const h = 3 + Math.floor(P.r() * 3); for (let y = 0; y < h; y++) P.px(x, y, P.pick(["#2a8a9a", "#3a9aaa"])); } },
  beacon_k_side(P) { PAINT.keeper_stone(P); P.rect(5, 2, 6, 12, "#2a3a44"); P.rect(7, 3, 2, 10, "#8af0f0"); },
  beacon_k_top(P) { PAINT.keeper_stone(P); P.rect(4, 4, 8, 8, "#8af0f0"); P.rect(6, 6, 4, 4, "#ffffff"); },
  lift_side(P) { PAINT.keeper_copper(P); P.rect(3, 0, 2, 16, "#2a2c34"); P.rect(11, 0, 2, 16, "#2a2c34"); P.rect(6, 6, 4, 4, "#5ae0d0"); },
  lift_top(P) { P.fill(["#2a2c34"]); P.rect(1, 1, 14, 14, "#b8703a"); P.rect(4, 4, 8, 8, "#2a2c34"); P.rect(7, 4, 2, 8, "#5ae0d0"); },
  mural(P) { P.fill(["#3a3e48"]); P.rect(1, 1, 14, 14, "#c8b890"); P.rect(3, 9, 10, 4, "#4a6a8a"); P.rect(6, 3, 4, 6, "#2a6a70"); P.rect(7, 2, 2, 2, "#5ae0d0"); P.rect(2, 12, 12, 1, "#8a7a5a"); },
  anchor_s_side(P) { PAINT.echostone(P); P.rect(5, 2, 6, 12, "#2a2c34"); P.rect(7, 3, 2, 10, "#5a6a8a"); },
  anchor_top(P) { PAINT.echostone(P); P.rect(3, 3, 10, 10, "#2a2c34"); P.rect(6, 6, 4, 4, "#5a6a8a"); },
  anchor_top_on(P) { PAINT.echostone(P); P.rect(3, 3, 10, 10, "#2a2c34"); P.rect(5, 5, 6, 6, "#5ae0d0"); P.rect(7, 7, 2, 2, "#ffffff"); },
  hush_carpet(P) { P.fill(["#2a4a5a", "#264656", "#2e4e5e"]); for (let i = 0; i < 16; i += 4) P.rect(0, i, 16, 1, "#1e3a48"); },
  warden_t_side(P) { P.fill(["#1a3a44", "#16343e"]); P.rect(5, 4, 6, 8, "#2a5a6a"); },
  warden_t_top(P) { P.fill(["#1a3a44"]); P.rect(4, 4, 8, 8, "#5ae0d0"); },
  warden_t_front(P) { P.fill(["#1a3a44", "#16343e"]); P.rect(3, 5, 10, 6, "#0a1a20"); P.rect(6, 6, 4, 4, "#5ae0d0"); P.rect(7, 7, 2, 2, "#ffffff"); },
  crown_side(P) { P.fill(["#4a5a7a"]); for (let x = 0; x < 16; x += 4) P.rect(x, 0, 2, 6, "#c8e8ff"); P.rect(0, 8, 16, 3, "#5ae0d0"); },
  crown_top(P) { P.fill(["#4a5a7a"]); P.rect(4, 4, 8, 8, "#c8e8ff"); P.rect(6, 6, 4, 4, "#ffffff"); },
  switch_side(P) { PAINT.keeper_stone(P); P.rect(6, 3, 4, 10, "#2a2c34"); P.rect(7, 4, 2, 4, "#b8703a"); },
  switch_top(P) { PAINT.keeper_stone(P); P.rect(5, 5, 6, 6, "#2a2c34"); P.rect(7, 4, 2, 6, "#b8703a"); },
  tide_bricks(P) { P.fill(["#2a6a78"]); for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 0; for (let b = -1; b < 3; b++) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(b * 8 + off + xx, r * 4 + yy, P.pick(["#3a8a96", "#4296a0", "#368290"])); } P.specks(4, ["#8af0e0"]); },
  tide_lamp(P) { P.fill(["#2a6a78"]); P.rect(2, 2, 12, 12, "#a8f0f0"); P.rect(4, 4, 8, 8, "#e8ffff"); P.rect(6, 6, 4, 4, "#c8fff8"); },
  vine_bricks(P) { P.fill(["#4a5446"]); for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 0; for (let b = -1; b < 3; b++) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(b * 8 + off + xx, r * 4 + yy, P.pick(["#6a7462", "#727c6a", "#646e5c"])); } for (let x = 0; x < 16; x++) { const h = Math.floor(P.r() * 7); for (let y = 0; y < h; y++) P.px(x, y, P.pick(["#3f8a2c", "#4a9a33", "#357a25"])); } },
  vines(P) { for (let i = 0; i < 6; i++) { const x = 1 + Math.floor(P.r() * 14), h = 8 + Math.floor(P.r() * 8); for (let y = 0; y < h; y++) { P.px(x, y, P.pick(["#3f8a2c", "#4a9a33", "#2f6a20"])); if (P.r() < 0.25) P.px(x + 1, y, "#56a63b"); } } },
  sun_bricks(P) { P.fill(["#b8944a"]); for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 0; for (let b = -1; b < 3; b++) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(b * 8 + off + xx, r * 4 + yy, P.pick(["#e0c47a", "#d8bc72", "#e8cc84"])); } },
  sun_glyph(P) { PAINT.sun_bricks(P); P.rect(3, 3, 10, 10, "#c8a050"); for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; P.px(8 + Math.round(Math.cos(t) * 4), 8 + Math.round(Math.sin(t) * 4), "#7a4a10"); } P.rect(6, 6, 4, 4, "#f8d860"); },
  mirror_side(P) { PAINT.sun_bricks(P); P.rect(5, 2, 6, 12, "#6a4a20"); },
  mirror_top(P) { PAINT.sun_bricks(P); P.rect(2, 2, 12, 12, "#6a4a20"); P.rect(3, 3, 10, 10, "#a8b8c8"); P.rect(4, 4, 4, 2, "#e8f0f8"); },
  mirror_top_on(P) { PAINT.sun_bricks(P); P.rect(2, 2, 12, 12, "#6a4a20"); P.rect(3, 3, 10, 10, "#fff4a0"); P.rect(5, 5, 6, 6, "#ffffff"); },
  trap_vent(P) { P.fill(["#5a5a5a", "#545454"]); P.rect(2, 2, 12, 12, "#2a2a2a"); for (let y = 4; y < 13; y += 3) P.rect(3, y, 10, 1, "#141414"); P.rect(0, 0, 16, 1, "#7a6a3a"); P.rect(0, 15, 16, 1, "#7a6a3a"); },
  cracked_floor(P) { P.fill(["#b8a070", "#b09868", "#c0a878"]); let x = 2, y = 1; for (let i = 0; i < 14; i++) { P.px(x, y, "#4a3a20"); x += P.r() < 0.5 ? 1 : 0; y += 1; if (x > 14) x = 14; } x = 13; y = 2; for (let i = 0; i < 10; i++) { P.px(x, y, "#4a3a20"); x -= P.r() < 0.6 ? 1 : 0; y += 1; } },
  pedestal_top(P) { PAINT.keeper_stone(P); P.rect(3, 3, 10, 10, "#c8a050"); P.rect(5, 5, 6, 6, "#fff4c0"); },
  pedestal_side(P) { PAINT.keeper_stone(P); P.rect(2, 0, 12, 3, "#c8a050"); P.rect(4, 3, 8, 13, "#5a5e68"); },
  switch_top_on(P) { PAINT.keeper_stone(P); P.rect(5, 5, 6, 6, "#2a2c34"); P.rect(7, 6, 2, 6, "#5ae0d0"); },
  ward_side(P) { PAINT.stone_bricks(P); P.rect(6, 3, 4, 10, "#2a5a8a"); P.rect(7, 4, 2, 8, "#8ad8ff"); },
  ward_top(P) { P.fill(["#5f5f5f"]); P.rect(3, 3, 10, 10, "#2a5a8a"); P.rect(5, 5, 6, 6, "#8ad8ff"); P.rect(7, 7, 2, 2, "#ffffff"); },
  ward_altar_side(P) { PAINT.stone_bricks(P); P.rect(5, 5, 6, 6, "#3a3a44"); P.rect(7, 7, 2, 2, "#6a6a7a"); },
  ward_altar_top(P) { P.fill(["#6a6a6a"]); P.rect(3, 3, 10, 10, "#3a3a44"); P.rect(6, 6, 4, 4, "#1a1a22"); },
  ward_altar_lit(P) { P.fill(["#6a6a6a"]); P.rect(3, 3, 10, 10, "#2a5a8a"); P.rect(5, 5, 6, 6, "#8ad8ff"); P.rect(7, 7, 2, 2, "#ffffff"); },
  note_top(P) { PAINT.planks(P); P.rect(3, 2, 10, 12, "#e8dcc0"); for (let y = 4; y < 13; y += 2) P.rect(4, y, 8, 1, "#8a7a60"); },
  return_gate(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, P.r() < 0.12 ? "#ffffff" : P.pick(["#4a8ac8", "#3a6ab0", "#5a9ad8"])); P.rect(0, 0, 16, 1, "#c8e8ff"); P.rect(0, 15, 16, 1, "#c8e8ff"); },
  pale_bricks(P) { P.fill(["#1e1e24"]); for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 0; for (let b = -1; b < 3; b++) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(b * 8 + off + xx, r * 4 + yy, P.pick(["#2a2a32", "#303038", "#26262e"])); } },
  arena_ward_side(P) { PAINT.pale_bricks(P); P.rect(5, 3, 6, 10, "#14141a"); P.rect(7, 5, 2, 6, "#3a3a4a"); },
  arena_ward_top(P) { P.fill(["#2a2a32"]); P.rect(3, 3, 10, 10, "#14141a"); P.rect(6, 6, 4, 4, "#3a3a4a"); },
  arena_ward_lit(P) { P.fill(["#2a2a32"]); P.rect(3, 3, 10, 10, "#2a5a8a"); P.rect(5, 5, 6, 6, "#8ad8ff"); P.rect(7, 7, 2, 2, "#ffffff"); },
  pale_altar_side(P) { PAINT.pale_bricks(P); P.rect(4, 4, 8, 8, "#0a0a0e"); P.rect(6, 6, 1, 1, "#ffffff"); P.rect(9, 6, 1, 1, "#ffffff"); },
  pale_altar_top(P) { P.fill(["#14141a"]); P.rect(3, 3, 10, 10, "#26262e"); P.rect(6, 6, 4, 4, "#8ad8ff"); },
  pale_effigy(P) { P.fill(["#2fa0a8", "#2a929a"]); P.rect(0, 0, 16, 4, "#5a3a20"); },
  pale_effigy_top(P) { P.fill(["#5a3a20", "#4a2e18"]); },
  pale_effigy_front(P) { P.fill(["#c8946a"]); P.rect(0, 0, 16, 4, "#5a3a20"); P.rect(3, 6, 3, 2, "#ffffff"); P.rect(10, 6, 3, 2, "#ffffff"); P.rect(6, 11, 4, 1, "#8a5a3a"); },
  ward_candle(P) { P.rect(7, 7, 2, 9, "#e8e4d8"); P.rect(7, 7, 2, 1, "#c8c4b8"); P.rect(6, 3, 4, 4, "#8ad8ff"); P.rect(7, 2, 2, 2, "#ffffff"); },
  cinder_bricks(P) { P.fill(["#2a1a1a"]); for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 0; for (let b = -1; b < 3; b++) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 7; xx++) P.px(b * 8 + off + xx, r * 4 + yy, P.pick(["#3a2420", "#42281f", "#34201c"])); } P.specks(4, ["#ff7a1a", "#c84a10"]); },
  cinder_altar_side(P) { PAINT.cinder_bricks(P); P.rect(5, 3, 6, 10, "#1a1010"); P.rect(7, 5, 2, 6, "#ff7a1a"); P.rect(6, 7, 4, 2, "#ff7a1a"); },
  cinder_altar_top(P) { P.fill(["#2a1a1a"]); P.rect(2, 2, 12, 12, "#3a2420"); P.rect(5, 5, 6, 6, "#120808"); P.rect(6, 6, 4, 4, "#ff9a2a"); P.rect(7, 7, 2, 2, "#fff2a0"); },
  cinder_egg(P) { P.fill(["#2a1410", "#341a12", "#20100c"]); for (let i = 0; i < 6; i++) { let x = Math.floor(P.r() * 16), y = Math.floor(P.r() * 16); for (let k = 0; k < 5; k++) { P.px(x, y, P.pick(["#ff7a1a", "#ffb030"])); x += P.r() < 0.5 ? 1 : -1; y += 1; } } },
  sky_block(P) { P.fill(["#62e6ee", "#58dce4"]); P.rect(0, 0, 16, 1, "#c9fbfd"); P.rect(0, 15, 16, 1, "#2a9fb0"); P.rect(0, 0, 1, 16, "#c9fbfd"); P.rect(15, 0, 1, 16, "#2a9fb0"); P.rect(4, 4, 8, 8, "#7ef0f5"); },
  dusk_block(P) { P.fill(["#4a3e4e", "#42364a"]); P.rect(0, 0, 16, 1, "#7a6a80"); P.rect(0, 15, 16, 1, "#2a2230"); P.rect(0, 0, 1, 16, "#7a6a80"); P.rect(15, 0, 1, 16, "#2a2230"); P.rect(2, 6, 12, 2, "#5a4a60"); },
  anchor_side(P) { PAINT.obsidian(P); P.rect(0, 0, 16, 3, "#2a1a3a"); P.rect(0, 13, 16, 3, "#2a1a3a"); P.rect(6, 5, 4, 6, "#ffb030"); },
  anchor_bottom(P) { PAINT.obsidian(P); },
  anchor_top(P) { PAINT.obsidian(P); P.rect(3, 3, 10, 10, "#120a1a"); P.rect(5, 5, 6, 6, "#3a2a4a"); },
  anchor_top_lit(P) { PAINT.obsidian(P); P.rect(3, 3, 10, 10, "#120a1a"); P.rect(5, 5, 6, 6, "#ffd34d"); P.rect(6, 6, 4, 4, "#fff2a0"); },
  lodestone_side(P) { PAINT.stone_bricks(P); P.rect(0, 6, 16, 4, "#3a3a3a"); P.rect(7, 6, 2, 4, "#c8c8c8"); },
  lodestone_top(P) { P.fill(["#6a6a6a", "#5e5e5e"]); P.rect(2, 2, 12, 12, "#3a3a3a"); P.rect(6, 6, 4, 4, "#d8d8d8"); P.rect(7, 4, 2, 8, "#e04030"); },
  voidchest_front(P) { PAINT.voidchest_side(P); P.rect(6, 3, 4, 5, "#3ad0a0"); P.rect(7, 5, 2, 2, "#0a2a2a"); }
});
// ----- Sparkworks textures (original designs) -----
export const DUST_LEVEL = p => p <= 0 ? 0 : Math.min(5, 1 + Math.floor((p - 1) / 3));   // power 0-15 → texture 0-5
const DUST_COLS = ["#5a1608", "#7a200c", "#9a2a10", "#c2361a", "#e2461f", "#ff5a2a"];
const SPARK = ["#ff5a2a", "#c2361a", "#5a1608"];
function sparkFlecks(P, lit) {
  for (let i = 0; i < 6; i++) {
    const x = 1 + Math.floor(P.r() * 12), y = 1 + Math.floor(P.r() * 12);
    P.rect(x, y, 2, 2, lit ? "#ff8a4a" : SPARK[1]); P.px(x, y, lit ? "#ffd0a0" : SPARK[0]);
    P.px(x + 2, y + 1, lit ? SPARK[0] : SPARK[2]); P.px(x - 1, y, SPARK[2]);
  }
}
const IRON = ["#dcdcdc", "#d0d0d0", "#e6e6e6"];
function trapGrid(P, pal, dark) {
  P.fill(pal); P.rect(0, 0, 16, 1, dark); P.rect(0, 15, 16, 1, dark); P.rect(0, 0, 1, 16, dark); P.rect(15, 0, 1, 16, dark);
  for (const [x, y] of [[3, 3], [10, 3], [3, 10], [10, 10]]) for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) P.clear(x + xx, y + yy);
  P.rect(7, 1, 2, 14, dark); P.rect(1, 7, 14, 2, dark);
}
Object.assign(PAINT, {
  spark_ore(P) { PAINT.stone(P); sparkFlecks(P, false); },
  spark_ore_lit(P) { PAINT.stone(P); sparkFlecks(P, true); },
  dark_spark_ore(P) { PAINT.darkslate(P); sparkFlecks(P, false); },
  dark_spark_ore_lit(P) { PAINT.darkslate(P); sparkFlecks(P, true); },
  spark_block(P) {
    P.fill(["#b02a12", "#a82610", "#b8301a"]); P.rect(0, 0, 16, 1, "#ff6a3a"); P.rect(0, 0, 1, 16, "#ff6a3a"); P.rect(0, 15, 16, 1, "#6a1608"); P.rect(15, 0, 1, 16, "#6a1608");
    for (const [x, y, w, h] of [[3, 3, 6, 1], [8, 3, 1, 5], [8, 7, 5, 1], [3, 3, 1, 9], [3, 11, 8, 1], [12, 7, 1, 6]]) P.rect(x, y, w, h, "#ff8a4a");
    for (const [x, y] of [[3, 3], [8, 7], [12, 12], [10, 11]]) P.rect(x, y, 1, 1, "#ffe0b0");
  },
  spark_torch(P) { P.rect(7, 8, 2, 8, "#6a4a2a"); P.rect(7, 8, 1, 8, "#8a6235"); P.rect(7, 6, 2, 2, "#ff5a2a"); P.px(7, 6, "#ffd0a0"); P.px(6, 5, "rgba(255,120,60,.8)"); P.px(9, 5, "rgba(255,120,60,.8)"); },
  spark_torch_off(P) { P.rect(7, 8, 2, 8, "#6a4a2a"); P.rect(7, 8, 1, 8, "#8a6235"); P.rect(7, 6, 2, 2, "#5a1a10"); P.px(7, 6, "#7a2a1a"); },
  lever_handle(P) { P.rect(7, 8, 2, 8, "#8a6235"); P.rect(8, 8, 1, 8, "#6a4825"); P.rect(7, 6, 2, 2, "#5a5a5a"); },
  slab_side(P) { P.fill(["#a8a8a8", "#a2a2a2", "#aeaeae"]); P.rect(0, 0, 16, 1, "#c8c8c8"); P.rect(0, 15, 16, 1, "#7a7a7a"); },
  repeater_top(P) { PAINT.slab_side(P); P.fill(["#a8a8a8", "#a2a2a2"]); P.rect(7, 1, 2, 14, "#5a1608"); P.rect(5, 12, 6, 1, "#5a1608"); P.rect(6, 13, 4, 1, "#5a1608"); P.rect(0, 0, 16, 1, "#8a8a8a"); P.rect(0, 15, 16, 1, "#8a8a8a"); },
  repeater_top_on(P) { PAINT.repeater_top(P); P.rect(7, 1, 2, 14, "#ff5a2a"); P.rect(5, 12, 6, 1, "#ff5a2a"); P.rect(6, 13, 4, 1, "#ff5a2a"); },
  comparator_top(P) { P.fill(["#a8a8a8", "#a2a2a2"]); P.rect(4, 2, 1, 10, "#5a1608"); P.rect(11, 2, 1, 10, "#5a1608"); P.rect(4, 11, 8, 1, "#5a1608"); P.rect(7, 11, 2, 3, "#5a1608"); P.rect(0, 0, 16, 1, "#8a8a8a"); P.rect(0, 15, 16, 1, "#8a8a8a"); },
  comparator_top_on(P) { PAINT.comparator_top(P); P.rect(4, 2, 1, 10, "#ff5a2a"); P.rect(11, 2, 1, 10, "#ff5a2a"); P.rect(4, 11, 8, 1, "#ff5a2a"); P.rect(7, 11, 2, 3, "#ff5a2a"); },
  lamp_off(P) { P.fill(["#5a3a1e", "#62421f", "#523418"]); P.rect(0, 0, 16, 2, "#3a2614"); P.rect(0, 14, 16, 2, "#3a2614"); P.rect(0, 0, 2, 16, "#3a2614"); P.rect(14, 0, 2, 16, "#3a2614"); P.rect(7, 2, 2, 12, "#3a2614"); P.rect(2, 7, 12, 2, "#3a2614"); },
  lamp_on(P) { P.fill(["#ffd86a", "#ffe08a", "#f8c850"]); P.rect(5, 5, 6, 6, "#fff4c8"); P.rect(0, 0, 16, 2, "#8a5a2a"); P.rect(0, 14, 16, 2, "#8a5a2a"); P.rect(0, 0, 2, 16, "#8a5a2a"); P.rect(14, 0, 2, 16, "#8a5a2a"); P.rect(7, 2, 2, 12, "#c88a3a"); P.rect(2, 7, 12, 2, "#c88a3a"); },
  iron_door_bottom(P) { P.fill(IRON); P.rect(0, 0, 1, 16, "#a0a0a0"); P.rect(15, 0, 1, 16, "#a0a0a0"); P.rect(0, 15, 16, 1, "#a0a0a0"); P.rect(3, 3, 10, 10, "#c8c8c8"); for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) P.px(x, y, "#8a8a8a"); P.rect(11, 6, 2, 1, "#6a6a6a"); },
  iron_door_top(P) { P.fill(IRON); P.rect(0, 0, 1, 16, "#a0a0a0"); P.rect(15, 0, 1, 16, "#a0a0a0"); P.rect(0, 0, 16, 1, "#a0a0a0"); for (const [x, y] of [[3, 3], [9, 3], [3, 9], [9, 9]]) for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) P.clear(x + xx, y + yy); },
  trap_oak(P) { trapGrid(P, PLANK, "#7d5a30"); },
  trap_birch(P) { trapGrid(P, ["#d8c890", "#cfbe84", "#e0d29c"], "#9a8a5a"); },
  trap_crimson(P) { trapGrid(P, ["#7a3a50", "#6e3448", "#864258"], "#4a1e2e"); },
  trap_warped(P) { trapGrid(P, ["#2a7a74", "#26706a", "#2e847e"], "#164a46"); },
  trap_iron(P) { trapGrid(P, IRON, "#9a9a9a"); },
  note_block(P) { P.fill(["#5a3a22", "#62402a", "#523420"]); P.rect(0, 0, 16, 1, "#3a2414"); P.rect(0, 15, 16, 1, "#3a2414"); P.rect(9, 3, 1, 8, "#1e120a"); P.rect(10, 3, 3, 1, "#1e120a"); P.rect(12, 4, 1, 2, "#1e120a"); P.rect(6, 10, 4, 3, "#1e120a"); },
  target_side(P) { P.fill(["#e8e0c8", "#f0e8d4"]); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 2) P.px(x, y, "#d8302a"); else if (d > 3.5 && d < 5.5) P.px(x, y, "#d8302a"); else if (d > 7) P.px(x, y, P.pick(["#d8c070", "#c8b060"])); } },
  target_top(P) { PAINT.target_side(P); },
  daylight_side(P) { P.fill(PLANK); P.rect(0, 0, 16, 10, "rgba(0,0,0,0)"); for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) P.clear(x, y); P.rect(0, 10, 16, 1, "#7d5a30"); },
  daylight_top(P) { P.fill(["#c8d8e0"]); P.rect(1, 1, 14, 14, "#5a8ab8"); for (const [x, y] of [[1, 1], [8, 1], [1, 8], [8, 8]]) P.rect(x + 1, y + 1, 5, 5, "#7ab0d8"); P.rect(7, 1, 2, 14, "#e8e4d8"); P.rect(1, 7, 14, 2, "#e8e4d8"); },
  daylight_inv_top(P) { P.fill(["#c8d8e0"]); P.rect(1, 1, 14, 14, "#3a2a5a"); for (const [x, y] of [[1, 1], [8, 1], [1, 8], [8, 8]]) P.rect(x + 1, y + 1, 5, 5, "#5a3a8a"); P.rect(7, 1, 2, 14, "#e8e4d8"); P.rect(1, 7, 14, 2, "#e8e4d8"); }
});
Object.assign(PAINT, {
  piston_side(P) { PAINT.cobble(P); P.rect(0, 0, 16, 4, "#b98d55"); P.rect(0, 3, 16, 1, "#7d5a30"); for (let x = 1; x < 16; x += 4) P.px(x, 1, "#d8b07a"); },
  piston_top(P) { P.fill(PLANK); P.rect(0, 0, 16, 1, "#7d5a30"); P.rect(0, 15, 16, 1, "#7d5a30"); P.rect(5, 5, 6, 6, "#a8a8a8"); P.rect(6, 6, 4, 4, "#d8d8d8"); },
  piston_top_sticky(P) { PAINT.piston_top(P); for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 30 && P.r() < 0.8) P.px(x, y, P.pick(["#6ac85a", "#5ab84a", "#7ad86a"])); },
  piston_bottom(P) { PAINT.cobble(P); P.rect(5, 5, 6, 6, "#5a5a5a"); },
  piston_inner(P) { PAINT.cobble(P); P.rect(6, 6, 4, 4, "#b98d55"); },
  gloop_block(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, x === 0 || y === 0 || x === 15 || y === 15 ? "rgba(70,170,60,.85)" : "rgba(110,210,95,.55)"); P.rect(4, 4, 8, 8, "rgba(80,180,70,.75)"); P.rect(5, 5, 2, 2, "rgba(220,255,210,.8)"); },
  honey_block(P) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, x === 0 || y === 0 || x === 15 || y === 15 ? "rgba(210,130,30,.9)" : "rgba(245,170,50,.6)"); P.rect(4, 4, 8, 8, "rgba(230,145,35,.8)"); for (const x of [3, 9, 12]) P.rect(x, 15, 1, 1, "rgba(200,120,20,.95)"); P.rect(5, 5, 2, 1, "rgba(255,235,180,.85)"); },
  observer_side(P) { P.fill(["#6a6a6a", "#646464", "#707070"]); P.rect(0, 0, 16, 2, "#4a4a4a"); P.rect(0, 14, 16, 2, "#4a4a4a"); P.rect(7, 4, 2, 7, "#3a3a3a"); P.rect(5, 4, 6, 2, "#3a3a3a"); },
  observer_top(P) { PAINT.observer_side(P); },
  observer_front(P) { P.fill(["#6a6a6a", "#646464"]); P.rect(0, 0, 16, 2, "#4a4a4a"); P.rect(0, 14, 16, 2, "#4a4a4a"); P.rect(2, 5, 4, 3, "#1e1e1e"); P.rect(10, 5, 4, 3, "#1e1e1e"); P.rect(3, 6, 2, 1, "#9a9a9a"); P.rect(11, 6, 2, 1, "#9a9a9a"); P.rect(4, 11, 8, 2, "#2a2a2a"); P.rect(4, 3, 3, 1, "#3a3a3a"); P.rect(9, 3, 3, 1, "#3a3a3a"); },
  observer_back(P) { PAINT.observer_side(P); P.fill(["#6a6a6a", "#646464"]); P.rect(0, 0, 16, 2, "#4a4a4a"); P.rect(0, 14, 16, 2, "#4a4a4a"); P.rect(6, 6, 4, 4, "#2a2a2a"); P.rect(7, 7, 2, 2, "#5a1608"); },
  observer_back_on(P) { PAINT.observer_back(P); P.rect(6, 6, 4, 4, "#ff5a2a"); P.rect(7, 7, 2, 2, "#ffd0a0"); },
  hook(P) { P.fill(PLANK); P.rect(0, 0, 16, 1, "#7d5a30"); P.rect(6, 4, 4, 8, "#c8c8c8"); P.rect(7, 5, 2, 6, "#8a8a8a"); },
  tripwire(P) { P.rect(0, 7, 16, 2, "rgba(235,235,235,.95)"); P.rect(0, 8, 16, 1, "rgba(180,180,180,.95)"); },
  trapped_side(P) { PAINT.chest_side(P); P.rect(0, 7, 16, 1, "#b02a12"); },
  trapped_front(P) { PAINT.chest_front(P); P.rect(0, 7, 16, 1, "#b02a12"); P.rect(6, 5, 4, 5, "#c2361a"); P.rect(7, 7, 2, 2, "#ff8a4a"); },
  hush_sensor_side(P) { P.fill(["#0e2a30", "#12323a", "#0c2228"]); P.specks(6, ["#1d5a60", "#2a8a8a"]); P.rect(0, 0, 16, 1, "#2a8a8a"); },
  hush_sensor_top(P) { P.fill(["#0e2a30", "#12323a"]); P.rect(3, 3, 10, 10, "#163c44"); P.rect(6, 6, 4, 4, "#1d5a60"); P.rect(7, 7, 2, 2, "#2a8a8a"); },
  hush_sensor_top_on(P) { PAINT.hush_sensor_top(P); P.rect(6, 6, 4, 4, "#5af0e0"); P.rect(7, 7, 2, 2, "#e0fffa"); },
  tuned_sensor_top(P) { PAINT.hush_sensor_top(P); for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) P.rect(x, y, 2, 2, "#c8a8f0"); },
  tendril(P) { P.fill(["#1d5a60", "#2a6a70"]); },
  tendril_on(P) { P.fill(["#5af0e0", "#8af8f0"]); },
  bell(P) { P.fill(["#f0c020", "#e0b018", "#f8d040"]); P.rect(0, 0, 16, 1, "#fff2a0"); P.rect(0, 15, 16, 1, "#a87a10"); P.rect(3, 4, 2, 6, "#fff2a0"); },
  bell_post(P) { PAINT.stone(P); P.rect(0, 0, 16, 2, "#5a5a5a"); },
  hopper_outside(P) { P.fill(["#4a4a4e", "#424246", "#505054"]); P.rect(0, 0, 16, 1, "#6a6a70"); P.rect(0, 15, 16, 1, "#2a2a2e"); for (const x of [2, 13]) P.rect(x, 2, 1, 12, "#5a5a60"); },
  hopper_top(P) { P.fill(["#4a4a4e"]); P.rect(2, 2, 12, 12, "#1e1e22"); P.rect(4, 4, 8, 8, "#2a2a2e"); P.rect(0, 0, 16, 1, "#6a6a70"); },
  hopper_inside(P) { P.fill(["#2a2a2e", "#26262a"]); },
  dropper_front(P) { PAINT.furnace_side(P); P.rect(4, 4, 8, 8, "#3a3a3a"); P.rect(5, 5, 6, 6, "#1a1a1a"); },
  dispenser_front(P) { PAINT.furnace_side(P); P.rect(4, 4, 8, 8, "#3a3a3a"); P.rect(5, 5, 6, 6, "#1a1a1a"); P.rect(7, 3, 2, 10, "#8a6235"); P.rect(3, 7, 10, 1, "#e8e8e8"); },
  crafter_side(P) { P.fill(["#6a6a6a", "#646464", "#707070"]); P.rect(0, 0, 16, 2, "#9a9a9a"); P.rect(0, 14, 16, 2, "#3a3a3a"); P.rect(3, 5, 10, 6, "#b98d55"); P.rect(4, 6, 8, 4, "#8a6235"); },
  crafter_bottom(P) { P.fill(["#5a5a5a", "#545454"]); },
  crafter_top(P) { P.fill(["#9a9a9a"]); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) P.rect(1 + i * 5, 1 + j * 5, 4, 4, "#b98d55"); },
  crafter_front(P) { PAINT.crafter_side(P); P.rect(3, 4, 4, 3, "#1a1a1a"); P.rect(9, 4, 4, 3, "#1a1a1a"); P.rect(4, 5, 2, 1, "#5a1608"); P.rect(10, 5, 2, 1, "#5a1608"); P.rect(5, 10, 6, 2, "#2a2a2a"); },
  rail(P) { railTies(P); railBars(P, "#a0a0a0", "#d8d8d8"); },
  rail_curve(P) { for (let i = 0; i < 16; i += 4) { P.rect(i, 15 - i - 2, 3, 2, "#6a4825"); } for (let a = 0; a < 16; a++) { const r1 = 12.5, r2 = 6.5; for (const r of [r1, r2]) { const t = a / 15 * Math.PI / 2, x = Math.round(16 - Math.cos(t) * r), y = Math.round(16 - Math.sin(t) * r); P.rect(x - 1, y - 1, 2, 2, "#c0c0c0"); } } },
  rail_powered(P) { railTies(P); railBars(P, "#b8901a", "#f0c020"); P.rect(7, 0, 2, 16, "#5a1608"); },
  rail_powered_on(P) { railTies(P); railBars(P, "#b8901a", "#f0c020"); P.rect(7, 0, 2, 16, "#ff5a2a"); },
  rail_detector(P) { railTies(P); railBars(P, "#a0a0a0", "#d8d8d8"); P.rect(5, 5, 6, 6, "#8a8a8a"); P.rect(6, 6, 4, 4, "#5a1608"); },
  rail_detector_on(P) { railTies(P); railBars(P, "#a0a0a0", "#d8d8d8"); P.rect(5, 5, 6, 6, "#8a8a8a"); P.rect(6, 6, 4, 4, "#ff5a2a"); },
  rail_activator(P) { railTies(P); railBars(P, "#a0a0a0", "#d8d8d8"); for (let y = 1; y < 16; y += 4) P.rect(7, y, 2, 2, "#5a1608"); },
  rail_activator_on(P) { railTies(P); railBars(P, "#a0a0a0", "#d8d8d8"); for (let y = 1; y < 16; y += 4) P.rect(7, y, 2, 2, "#ff5a2a"); },
  // the Starter Home
  sign(P) { PAINT.planks(P, ["#c49a5e", "#b98f55", "#cca468"], "#9a7442"); for (const y of [4, 7, 10]) P.rect(3, y, 10 - (y % 3) * 2, 1, "#5a3a1a"); },
  bookshelf(P) {
    PAINT.planks(P); P.rect(0, 7, 16, 2, "#7f5a31");
    const spines = ["#a8322a", "#2a5aa8", "#3a8a3a", "#c89a2a", "#6a3a8a", "#2a7a7a", "#8a4a2a"];
    for (const y0 of [1, 9]) { let x = 1; while (x < 15) { const w = 1 + Math.floor(P.r() * 2), h = 5 - Math.floor(P.r() * 2); P.rect(x, y0 + 6 - h, w, h, P.pick(spines)); x += w + (P.r() < 0.2 ? 1 : 0); } }
  },
  map_table_top(P) {
    PAINT.planks(P); P.rect(2, 2, 12, 12, "#e8dcc0"); P.rect(2, 2, 12, 1, "#b8a880");
    for (let i = 0; i < 10; i++) P.px(3 + i, 8 + Math.round(Math.sin(i * 0.9) * 2), "#4a7aa8");
    P.rect(4, 4, 3, 2, "#5a9a4a"); P.rect(9, 10, 3, 2, "#d8c070"); P.px(10, 5, "#c83a2a"); P.px(11, 4, "#c83a2a"); P.px(9, 4, "#c83a2a"); P.px(10, 3, "#c83a2a");
  },
  map_table_side(P) { PAINT.planks(P); P.rect(0, 0, 16, 2, "#e8dcc0"); P.rect(1, 2, 2, 14, "#6a4825"); P.rect(13, 2, 2, 14, "#6a4825"); },
  waystone_top(P) { P.fill(["#8a8a8a", "#7e7e7e", "#949494"]); P.rect(3, 3, 10, 10, "#5a5a6a"); P.rect(5, 5, 6, 6, "#7ad8ff"); P.rect(7, 7, 2, 2, "#ffffff"); },
  waystone_side(P) { P.fill(["#8a8a8a", "#7e7e7e", "#949494"]); P.rect(0, 0, 16, 2, "#5a5a6a"); P.rect(0, 14, 16, 2, "#5a5a6a"); P.rect(6, 4, 4, 8, "#3a5a7a"); P.rect(7, 5, 2, 2, "#7ad8ff"); P.rect(7, 8, 2, 3, "#7ad8ff"); },
  rune_stone(P) { P.fill(["#5a5048", "#524840", "#625850"]); P.rect(4, 3, 8, 1, "#f0c050"); P.rect(7, 3, 2, 10, "#f0c050"); P.rect(4, 8, 8, 1, "#f0c050"); P.rect(5, 12, 6, 1, "#f0c050"); },
  crafter_front_on(P) { PAINT.crafter_front(P); P.rect(4, 5, 2, 1, "#ff5a2a"); P.rect(10, 5, 2, 1, "#ff5a2a"); P.rect(3, 4, 4, 1, "#ff8a4a"); P.rect(9, 4, 4, 1, "#ff8a4a"); }
});
for (let k = 0; k < 6; k++) {
  const c = DUST_COLS[k], hi = DUST_COLS[Math.min(5, k + 1)];
  PAINT["dust_line" + k] = P => { P.rect(0, 6, 16, 4, c); for (let x = 0; x < 16; x += 3) P.px(x, 7, hi); P.rect(0, 6, 16, 1, DUST_COLS[Math.max(0, k - 1)]); };
  PAINT["dust_dot" + k] = P => { for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 11) P.px(x, y, (x + y) % 3 ? c : hi); };
}
function railTies(P) { for (let y = 1; y < 16; y += 4) P.rect(1, y, 14, 2, "#7d5a30"); }
function railBars(P, dark, light) { for (const x of [2, 12]) { P.rect(x, 0, 2, 16, dark); P.rect(x, 0, 1, 16, light); } }
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
  const c = document.createElement("canvas"); c.width = ATLAS_W; c.height = ATLAS_H;
  const ctx = c.getContext("2d");
  TILE_NAMES.forEach((name, i) => PAINT[name](painter(ctx, (i % 16) * 16, Math.floor(i / 16) * 16, i + 1)));
  atlasCanvas = c;
  return c;
}
export const tileUV = t => [(t % 16) / 16, Math.floor(t / 16) * 16 / ATLAS_H];

// ---------- Item pictures (inventory icons) ----------
const ICON_PAINT = {
  stick(P) { for (let i = 0; i < 11; i++) { P.px(3 + i, 13 - i, "#8a6235"); P.px(4 + i, 13 - i, "#6a4825"); } },
  coal(P) { blob(P, ["#2b2b2b", "#3c3c3c", "#1a1a1a"]); P.px(6, 6, "#5a5a5a"); },
  ingot(P, c) { c = c || ["#dcdcdc", "#a0a0a0", "#ffffff"]; for (let y = 6; y < 11; y++) for (let x = 3; x < 13; x++) P.px(x, y, y === 6 ? c[2] : y === 10 ? c[1] : c[0]); P.rect(4, 5, 8, 1, c[2]); },
  skyshard(P) { const pts = [[8, 2], [7, 3], [8, 3], [9, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4]]; for (let y = 4; y < 13; y++) { const w = y < 8 ? y - 2 : 14 - y; for (let x = 8 - w; x <= 8 + w; x++) P.px(x, y, x < 8 ? "#3fc5d3" : "#7ef0f5"); } pts.forEach(([x, y]) => P.px(x, y, "#c9fbfd")); },
  apple(P, c) { const g = c && c[0] === "gold"; for (let y = 5; y < 14; y++) for (let x = 3; x < 13; x++) { const dx = x - 7.5, dy = y - 9.5; if (dx * dx + dy * dy < 22) P.px(x, y, x < 6 && y < 9 ? (g ? "#fff2a0" : "#ff6a5e") : (g ? "#f0c020" : "#d8302a")); } P.rect(8, 2, 1, 4, "#6a4825"); P.rect(9, 3, 3, 2, "#4f9a33"); },
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
  carrot(P, c) { const g = c && c[0] === "gold"; for (let i = 0; i < 9; i++) { P.px(4 + i, 12 - i, g ? "#ffd84a" : "#f08a1a"); P.px(5 + i, 12 - i, g ? "#c89a14" : "#d86a10"); } P.rect(12, 1, 2, 3, "#4f9a33"); P.rect(13, 3, 2, 1, "#6bb544"); },
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
  saddle(P) { P.rect(2, 5, 12, 6, "#6e4422"); P.rect(3, 4, 4, 2, "#8a5a32"); P.rect(10, 3, 3, 3, "#8a5a32"); P.rect(4, 6, 8, 3, "#8a5a32"); P.rect(7, 11, 2, 3, "#3a2414"); P.rect(6, 13, 4, 2, "#b8b8b8"); },
  jade(P) { for (let y = 3; y < 14; y++) { const w = y < 8 ? y - 3 : 13 - y; for (let x = 8 - w; x <= 8 + w; x++) P.px(x, y, x < 8 ? "#2ac86a" : "#18a050"); } P.rect(7, 5, 2, 2, "#a8f8c0"); },
  star(P) { for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 3 : 7; P.rect(Math.round(8 + Math.cos(a) * r) - 1, Math.round(8 + Math.sin(a) * r) - 1, 2, 2, "#fff6c0"); } P.rect(5, 5, 6, 6, "#fffbe0"); P.rect(7, 7, 2, 2, "#ffffff"); },
  skull(P) { P.rect(4, 3, 8, 8, "#2a2a2a"); P.rect(5, 11, 6, 3, "#2a2a2a"); P.rect(5, 6, 2, 2, "#0a0a0a"); P.rect(9, 6, 2, 2, "#0a0a0a"); P.rect(6, 12, 1, 2, "#5a5a5a"); P.rect(9, 12, 1, 2, "#5a5a5a"); }
});
Object.assign(ICON_PAINT, {
  fishing_rod(P) { for (let i = 0; i < 11; i++) { P.px(2 + i, 13 - i, "#8a6235"); P.px(3 + i, 13 - i, "#6a4825"); } for (let y = 3; y < 13; y++) P.px(13, y, "#e8e8e8"); P.rect(12, 12, 3, 2, "#c8302a"); },
  fish(P, c) { for (let y = 5; y < 12; y++) for (let x = 3; x < 12; x++) if ((x - 7.5) ** 2 / 20 + (y - 8.5) ** 2 / 9 < 1) P.px(x, y, y < 8 ? c[1] : c[0]); P.rect(11, 6, 2, 5, c[0]); P.rect(13, 5, 2, 7, c[0]); P.rect(5, 7, 1, 1, "#1a1a1a"); },
  puffer(P) { for (let y = 3; y < 14; y++) for (let x = 3; x < 14; x++) if ((x - 8.5) ** 2 + (y - 8.5) ** 2 < 24) P.px(x, y, y < 8 ? "#e8c840" : "#f4e8b0"); for (const [x, y] of [[2, 8], [14, 8], [8, 2], [8, 14], [4, 4], [12, 4], [4, 12], [12, 12]]) P.px(x, y, "#8a7a3a"); P.rect(5, 7, 2, 2, "#1a1a1a"); P.rect(10, 7, 2, 2, "#1a1a1a"); },
  inksac(P) { blob(P, ["#1a1a2a", "#24243a", "#101018"]); P.rect(6, 6, 2, 2, "#4a4a6a"); },
  boat(P, c) { if (c && c[0] === "chest") { P.rect(9, 3, 5, 5, "#9a6a35"); P.rect(9, 5, 5, 1, "#5a3a1a"); } P.rect(1, 8, 14, 3, "#a87a48"); P.rect(2, 11, 12, 2, "#8a5e32"); P.rect(1, 6, 2, 2, "#a87a48"); P.rect(13, 6, 2, 2, "#a87a48"); P.rect(3, 9, 10, 1, "#6a4825"); P.rect(10, 2, 1, 7, "#6a4825"); P.rect(6, 4, 7, 1, "#6a4825"); },
  berries(P) { for (const [x, y] of [[4, 7], [8, 5], [10, 9], [6, 10], [9, 12]]) { P.rect(x, y, 3, 3, "#c8203a"); P.px(x, y, "#f06070"); } P.rect(8, 2, 1, 3, "#3a7a30"); P.rect(6, 3, 2, 1, "#3a7a30"); },
  comb(P) { for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) P.px(x, y, (x + (y % 4 < 2 ? 0 : 2)) % 4 === 0 || y % 4 === 0 ? "#c88a18" : P.pick(COMB)); },
  bottle(P, c) { P.rect(6, 2, 4, 2, "#a07040"); P.rect(7, 4, 2, 3, "rgba(220,240,255,.8)"); for (let y = 7; y < 15; y++) P.rect(4, y, 8, 1, "rgba(220,240,255,.75)"); if (c && c[0]) P.rect(5, 9, 6, 5, c[0]); P.rect(5, 8, 1, 4, "rgba(255,255,255,.9)"); }
});
Object.assign(ICON_PAINT, {
  shield(P) { for (let y = 1; y < 15; y++) { const w = y < 10 ? 6 : 6 - (y - 9); for (let x = 8 - w; x < 8 + w; x++) P.px(x, y, x === 8 - w || x === 7 + w || y === 1 ? "#9a9a9a" : (x + y) % 5 ? "#a87a48" : "#8a5e32"); } P.rect(7, 2, 2, 11, "#bcbcbc"); },
  relic(P, c) { for (let y = 2; y < 15; y++) for (let x = 2; x < 15; x++) { const d = (x - 8.5) ** 2 + (y - 8.5) ** 2; if (d < 40) P.px(x, y, d > 26 ? "#2a2c34" : d > 12 ? c[0] : c[1]); } P.rect(7, 4, 2, 9, "#ffffff"); },
  stabilizer(P, c) { P.rect(4, 2, 8, 12, "#2a2c34"); P.rect(5, 3, 6, 10, c[0]); P.rect(7, 5, 2, 6, "#ffffff"); P.rect(3, 13, 10, 2, "#b8703a"); },
  ancient_key(P) { P.rect(3, 3, 5, 5, "#c8a040"); P.rect(4, 4, 3, 3, "#2a2c34"); P.rect(7, 5, 7, 2, "#c8a040"); P.rect(11, 7, 2, 3, "#c8a040"); P.rect(13, 7, 1, 2, "#c8a040"); P.px(5, 5, "#7ae070"); },
  survey_map(P) { P.rect(2, 3, 12, 10, "#e8dcc0"); P.rect(2, 3, 12, 1, "#a89870"); for (let i = 0; i < 8; i++) P.px(4 + i, 8 + Math.round(Math.sin(i) * 2), "#4a6a8a"); P.rect(10, 5, 2, 2, "#c83a2a"); },
  echo_shard(P) { for (let i = 0; i < 8; i++) { P.px(5 + i, 11 - i, "#5ae0d0"); P.px(6 + i, 11 - i, "#2a8a8a"); } P.rect(4, 11, 2, 2, "#c8ffff"); },
  pale_shard(P) { for (let i = 0; i < 9; i++) { P.px(5 + i, 12 - i, "#e8eef8"); P.px(6 + i, 12 - i, "#b8c4d8"); P.px(5 + i, 11 - i, "#ffffff"); } P.rect(4, 12, 2, 2, "#8a96a8"); },
  pale_lantern(P, c) { const glow = c && c[0] ? c[0] : "#ffffff"; P.rect(6, 1, 4, 2, "#5a5a64"); P.rect(4, 3, 8, 11, "#3a3a44"); P.rect(5, 4, 6, 9, glow); P.rect(7, 6, 2, 5, "#ffffff"); P.rect(4, 14, 8, 1, "#5a5a64"); },
  sigil(P, c) { for (let y = 2; y < 15; y++) for (let x = 2; x < 15; x++) { const d = Math.abs(x - 8.5) + Math.abs(y - 8.5); if (d < 7) P.px(x, y, d > 5 ? "#3a3a44" : c[0]); } P.rect(7, 5, 3, 7, "#ffffff"); P.rect(5, 7, 7, 3, "#ffffff"); },
  ward_heart(P) { for (const [y, a, b] of [[3, 3, 6], [3, 9, 12], [4, 2, 13], [5, 2, 13], [6, 2, 13], [7, 3, 12], [8, 4, 11], [9, 5, 10], [10, 6, 9], [11, 7, 8]]) for (let x = a; x <= b; x++) P.px(x, y, P.pick(["#3a7ad8", "#5a9ae8", "#2a5ab8"])); P.rect(5, 5, 2, 2, "#ffffff"); P.rect(8, 6, 3, 1, "#c8e8ff"); },
  eye_cinder(P) { for (let y = 3; y < 14; y++) for (let x = 3; x < 14; x++) if ((x - 8.5) ** 2 + (y - 8.5) ** 2 < 25) P.px(x, y, x + y < 15 ? "#ff9a2a" : "#c84a10"); P.rect(7, 5, 3, 7, "#2a0a04"); P.rect(6, 7, 1, 3, "#2a0a04"); P.rect(10, 7, 1, 3, "#2a0a04"); P.rect(8, 7, 1, 2, "#fff2a0"); },
  ember_heart(P) { for (const [y, a, b] of [[3, 3, 6], [3, 9, 12], [4, 2, 13], [5, 2, 13], [6, 2, 13], [7, 3, 12], [8, 4, 11], [9, 5, 10], [10, 6, 9], [11, 7, 8]]) for (let x = a; x <= b; x++) P.px(x, y, P.pick(["#c83a10", "#e05a1a", "#a82a0a"])); P.rect(5, 5, 2, 2, "#ffd34d"); P.rect(8, 6, 3, 1, "#ffb030"); P.rect(6, 8, 2, 1, "#ffb030"); },
  compass(P) { for (let y = 2; y < 15; y++) for (let x = 2; x < 15; x++) { const d = (x - 8.5) ** 2 + (y - 8.5) ** 2; if (d < 42) P.px(x, y, d > 30 ? "#8a8a8a" : "#e8e8e8"); } P.rect(8, 4, 1, 5, "#e04030"); P.rect(8, 9, 1, 4, "#3a3a3a"); P.px(8, 8, "#222"); },
  totem(P) { P.rect(5, 1, 6, 5, "#f0c020"); P.rect(6, 3, 1, 1, "#3ad07a"); P.rect(9, 3, 1, 1, "#3ad07a"); P.rect(4, 6, 8, 6, "#e0b018"); P.rect(2, 7, 2, 3, "#e0b018"); P.rect(12, 7, 2, 3, "#e0b018"); P.rect(6, 7, 4, 2, "#3ad07a"); P.rect(5, 12, 2, 3, "#c89a14"); P.rect(9, 12, 2, 3, "#c89a14"); P.rect(5, 1, 6, 1, "#fff2a0"); }
});
// colors for wooden (and stone) mechanism icons, by the block's texture
Object.assign(ICON_PAINT, {
  explorer_map(P) {
    P.rect(1, 2, 14, 12, "#efe2c2"); P.rect(1, 2, 14, 1, "#b8a078"); P.rect(1, 13, 14, 1, "#b8a078"); P.rect(1, 2, 1, 12, "#c8b088"); P.rect(14, 2, 1, 12, "#c8b088");
    P.rect(3, 4, 4, 3, "#6ab04a"); P.rect(9, 9, 4, 3, "#e0c878"); for (let i = 0; i < 9; i++) P.px(3 + i, 10 - Math.round(Math.sin(i * 0.8) * 1.5), "#3a7ac8");
    P.px(11, 4, "#d83a2a"); P.px(12, 5, "#d83a2a"); P.px(10, 5, "#d83a2a"); P.px(11, 6, "#d83a2a"); P.px(11, 5, "#ffffff");
  },
  sign(P) { P.rect(2, 2, 12, 8, "#c49a5e"); P.rect(2, 9, 12, 1, "#8a6235"); for (const y of [4, 6]) P.rect(4, y, 8, 1, "#5a3a1a"); P.rect(7, 10, 2, 5, "#7a5530"); }
});
const WOOD_ICON = { planks: ["#b98d55", "#7d5a30"], birch_planks: ["#d8c890", "#9a8a5a"], crimson_planks: ["#7a3a50", "#4a1e2e"], warped_planks: ["#2a7a74", "#164a46"], stone: ["#9a9a9a", "#6a6a6a"], cobble: ["#8a8a8a", "#5a5a5a"] };
Object.assign(ICON_PAINT, {
  lever(P) { P.rect(4, 11, 8, 3, "#8a8a8a"); P.rect(4, 13, 8, 1, "#5a5a5a"); for (let i = 0; i < 8; i++) { P.px(7 + Math.floor(i / 2), 11 - i, "#8a6235"); P.px(8 + Math.floor(i / 2), 11 - i, "#6a4825"); } P.rect(10, 2, 2, 2, "#5a5a5a"); },
  button(P, c) { P.rect(5, 6, 6, 4, c[0]); P.rect(5, 9, 6, 1, c[1]); P.rect(5, 6, 6, 1, "rgba(255,255,255,.35)"); },
  fence(P, c) { for (const x of [2, 12]) { P.rect(x, 2, 3, 13, c[0]); P.rect(x + 2, 2, 1, 13, c[1]); } P.rect(5, 4, 7, 2, c[0]); P.rect(5, 9, 7, 2, c[0]); P.rect(5, 5, 7, 1, c[1]); P.rect(5, 10, 7, 1, c[1]); },
  cart(P, c) {
    const k = c && c[0];
    if (k === "chest") { P.rect(4, 1, 8, 7, "#9a6a35"); P.rect(4, 4, 8, 1, "#5a3a1a"); P.rect(7, 3, 2, 3, "#c8c8c8"); }
    if (k === "hopper") { P.rect(3, 2, 10, 3, "#4a4a4e"); P.rect(5, 5, 6, 3, "#3a3a3e"); }
    if (k === "furnace") { P.rect(4, 1, 8, 7, "#7a7a7a"); P.rect(6, 4, 4, 3, "#2a2a2a"); P.rect(7, 5, 2, 1, "#ff9a2a"); }
    if (k === "tnt") { P.rect(4, 1, 8, 7, "#c83a2a"); P.rect(4, 3, 8, 2, "#e8e8e8"); }
    P.rect(1, 7, 14, 6, "#8a8a8a"); P.rect(2, 8, 12, 4, "#5a5a5a"); P.rect(1, 7, 14, 1, "#c8c8c8"); P.rect(3, 13, 3, 2, "#3a3a3a"); P.rect(10, 13, 3, 2, "#3a3a3a");
  },
  hopper(P) { P.rect(1, 2, 14, 4, "#4a4a4e"); P.rect(1, 2, 14, 1, "#6a6a70"); P.rect(3, 3, 10, 2, "#1e1e22"); P.rect(4, 6, 8, 4, "#424246"); P.rect(6, 10, 4, 4, "#3a3a3e"); },
  piston(P, c) { P.rect(2, 2, 12, 4, c && c[0] ? c[0] : "#b98d55"); P.rect(2, 6, 12, 8, "#7a7a7a"); P.rect(2, 6, 12, 1, "#5a5a5a"); P.rect(6, 4, 4, 2, "#d8d8d8"); P.rect(3, 9, 10, 1, "#6a6a6a"); },
  hook(P) { P.rect(6, 1, 4, 9, "#b98d55"); P.rect(7, 10, 2, 3, "#8a8a8a"); P.rect(5, 12, 6, 2, "#c8c8c8"); P.rect(5, 10, 1, 3, "#c8c8c8"); P.rect(10, 10, 1, 3, "#c8c8c8"); },
  bell(P) { P.rect(5, 2, 6, 2, "#c89a14"); for (let y = 4; y < 12; y++) { const w = 3 + Math.floor((y - 4) / 3); P.rect(8 - w, y, w * 2, 1, y < 6 ? "#fff2a0" : "#f0c020"); } P.rect(2, 12, 12, 2, "#c89a14"); P.rect(7, 14, 2, 1, "#8a6a10"); },
  gate(P, c) { for (const x of [1, 13]) { P.rect(x, 2, 2, 12, c[1]); } P.rect(3, 3, 10, 2, c[0]); P.rect(3, 10, 10, 2, c[0]); P.rect(5, 5, 2, 5, c[0]); P.rect(9, 5, 2, 5, c[0]); }
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
  const bdi = d.kind === "block" ? BLOCKS[id] : null;
  try { drawIcon(ctx, id, d, bdi); }
  catch (e) {   // one broken picture must never stop a whole inventory from opening: show a plain "?" tile instead
    console.warn("Icon failed for item " + id, e);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, 32, 32);
    ctx.fillStyle = "#6a6a6a"; ctx.fillRect(4, 4, 24, 24); ctx.fillStyle = "#fff"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center"; ctx.fillText("?", 16, 23);
  }
  iconCache.set(id, c);
  return c;
}
function drawIcon(ctx, id, d, bdi) {
  if (d.kind !== "block" || (bdi.icon && !bdi.icon.startsWith("tile:"))) {
    const s = document.createElement("canvas"); s.width = s.height = 16;
    ICON_PAINT[d.icon || bdi.icon](painter(s.getContext("2d"), 0, 0, id), d.colors || (bdi && (bdi.colors || WOOD_ICON[bdi.tex])));
    ctx.drawImage(s, 0, 0, 32, 32);
  } else {
    const bd = BLOCKS[id], atlas = buildAtlas();
    const tileAt = t => [(t % 16) * 16, Math.floor(t / 16) * 16];
    if (bd.icon) { const [sx, sy] = tileAt(TILE[bd.icon.slice(5)]); ctx.drawImage(atlas, sx, sy, 16, 16, 0, 0, 32, 32); }
    else if (bd.iconBox) {   // a thin box (plates, repeaters, sensors)
      const h = bd.iconBox * 16, top = tileAt(faceTile(make(id), 0)), side = tileAt(faceTile(make(id), 1)), dy = 16 - h;
      ctx.save(); ctx.setTransform(1, 0.5, -1, 0.5, 16, dy); ctx.drawImage(atlas, top[0], top[1], 16, 16, 0, 0, 16, 16); ctx.restore();
      ctx.save(); ctx.setTransform(1, 0.5, 0, 1, 0, 8 + dy); ctx.drawImage(atlas, side[0], side[1] + 16 - h, 16, h, 0, 0, 16, h); ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(0, 0, 16, h); ctx.restore();
      ctx.save(); ctx.setTransform(1, -0.5, 0, 1, 16, 16 + dy); ctx.drawImage(atlas, side[0], side[1] + 16 - h, 16, h, 0, 0, 16, h); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, 16, h); ctx.restore();
    } else if (bd.shape !== "cube" && bd.shape !== "water" && bd.shape !== "jelly") {
      const [sx, sy] = tileAt(faceTile(make(id, 0), 1));
      if (id === B.DOOR || id === B.IRON_DOOR) { const [tx, ty] = tileAt(TILE[id === B.DOOR ? "door_top" : "iron_door_top"]); ctx.drawImage(atlas, tx, ty, 16, 16, 8, 0, 16, 16); ctx.drawImage(atlas, sx, sy, 16, 16, 8, 16, 16, 16); }
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
}
const urlCache = new Map();
export function iconURL(id) { if (!urlCache.has(id)) urlCache.set(id, iconCanvas(id).toDataURL()); return urlCache.get(id); }
