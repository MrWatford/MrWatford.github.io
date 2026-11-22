// Every block and item in Blockhaven: what it is, how it behaves, how it's crafted,
// and the pixel-art textures (all drawn by code, so every picture is original).
import { CREATURES } from "./creature-catalog.js";
import { DESERT_MOBS } from "./desert-mob-catalog.js";
import { rng } from "./noise.js";
import { drawLeviathanWeapon } from "./leviathan-weapon-art.js";
import { drawLeviathanArmor } from "./leviathan-armor-art.js";
import { LEVIATHAN_ARMOR_STYLE } from "./leviathan-armor-style.js";

import { WILDLIFE_EGGS } from "./wildlife-catalog.js";

export const CHUNK = 16, HEIGHT = 80, SEA = 30;

// Block numbers 256 and up keep their extra bits above the 8 settings bits (see NB below); nb is the same, needed this early.
const nb = k => (k & 255) | ((k >> 8) << 16);
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
  WAYSTONE: 209, RUNE_STONE: 210, SOLKARA_GATE: 211,
  BLACK_SAND: 212, EMBER_CRYSTAL: 213, OBSIDIAN_TROPHY: 214,
  WYRM_HEAD: 215,   // Milestone 14: a trophy from the Hollow ships
  // the Grand Desert Temple (js/desert-monument.js)
  TEMPLE_STONE: 216, TEMPLE_TRIM: 217, TEMPLE_PILLAR: 218, TEMPLE_STEP: 219, BRAZIER: 220,
  // the Endwatch Citadel (js/citadel.js)
  ROOF_TILES: 221, CRACKED_BRICKS: 222, STONE_STEP: 223, CASTLE_BANNER: 224, WARD_BRICKS: 225, CASTELLAN_SEAL: 226,
  PORTCULLIS: 227, GATE_WINCH: 228, CASTLE_TOME: 229, WATCHFIRE: 230, WORN_BOOKSHELF: 231, CASTLE_LEVER: 232, STAINED_GLASS: 233,
  // Milestone 15: enchanting (js/enchanting.js)
  LAPIS_ORE: 234, SUGAR_CANE: 235, ENCH_TABLE: 236,
  ANVIL: 237, GRINDSTONE: 238, FROSTED_ICE: 239,   // Milestone 15, Part B
  // Milestone 16: brewing (js/potions.js)
  MELON: 240, MELON_STEM: 241, BREWING_STAND: 242, CAULDRON: 243,
  // Milestone 20, Part B: six new woods (the first blocks numbered 256 and up)
  SPRUCE_LOG: nb(256), SPRUCE_LEAVES: nb(257), SPRUCE_PLANKS: nb(258), SPRUCE_SAPLING: nb(259),
  JUNGLE_LOG: nb(260), JUNGLE_LEAVES: nb(261), JUNGLE_PLANKS: nb(262), JUNGLE_SAPLING: nb(263),
  ACACIA_LOG: nb(264), ACACIA_LEAVES: nb(265), ACACIA_PLANKS: nb(266), ACACIA_SAPLING: nb(267),
  DARK_OAK_LOG: nb(268), DARK_OAK_LEAVES: nb(269), DARK_OAK_PLANKS: nb(270), DARK_OAK_SAPLING: nb(271),
  CHERRY_LOG: nb(272), CHERRY_LEAVES: nb(273), CHERRY_PLANKS: nb(274), CHERRY_SAPLING: nb(275),
  MANGROVE_LOG: nb(276), MANGROVE_LEAVES: nb(277), MANGROVE_PLANKS: nb(278), MANGROVE_SAPLING: nb(279), MANGROVE_ROOTS: nb(280),
  // Milestone 20, Part C: the new land biomes
  SNOW_LAYER: nb(281), ICE: nb(282), BAMBOO: nb(283), COCOA: nb(284), MUD: nb(285), LILY_PAD: nb(286), RED_SAND: nb(287),
  TERRACOTTA: nb(288), ORANGE_TERRACOTTA: nb(289), YELLOW_TERRACOTTA: nb(290), WHITE_TERRACOTTA: nb(291), RED_TERRACOTTA: nb(292), BROWN_TERRACOTTA: nb(293), LIGHT_GRAY_TERRACOTTA: nb(294),
  CACTUS: nb(295), DEAD_BUSH: nb(296), MYCELIUM: nb(297), BROWN_MUSHROOM: nb(298), RED_MUSHROOM: nb(299), BROWN_MUSHROOM_BLOCK: nb(300), RED_MUSHROOM_BLOCK: nb(301),
  MUSHROOM_STEM: nb(302), PINK_PETALS: nb(303), PACKED_ICE: nb(304),
  // Milestone 20, Part D: lush caves and dripstone caves
  MOSS_BLOCK: nb(305), MOSS_CARPET: nb(306), AZALEA: nb(307), FLOWERING_AZALEA: nb(308), AZALEA_LEAVES: nb(309), CAVE_VINES: nb(310), SPORE_BLOSSOM: nb(311), POINTED_DRIPSTONE: nb(312),
  // Milestone 17, Part A: the ocean floor (coral ids are filled in just below: block, dead block, plant, dead plant, fan, dead fan)
  KELP: nb(313), SEAGRASS: nb(314), SEA_PICKLE: nb(315), SPONGE: nb(316), WET_SPONGE: nb(317), DRIED_KELP_BLOCK: nb(318),
  PRISMARINE: nb(319), PRISMARINE_BRICKS: nb(320), DARK_PRISMARINE: nb(321), SEA_LANTERN: nb(322), BLUE_ICE: nb(323),
  CONDUIT: nb(354),   // Milestone 17, Part B (324-353 are the corals)
  TURTLE_EGG: nb(355),   // Milestone 17, Part D
  LIGHTNING_ROD: nb(356)   // Milestone 19, Part B
};
// Milestone 17, Part A: five corals, each with six blocks (living and dead block, plant, and fan)
export const CORALS = [["TUBE", "Tube", "#3050d8"], ["BRAIN", "Brain", "#e070b0"], ["BUBBLE", "Bubble", "#a040c0"], ["FIRE", "Fire", "#d03030"], ["HORN", "Horn", "#e8d040"]];
CORALS.forEach(([K], i) => { const n = 324 + i * 6; Object.assign(B, { [K + "_CORAL_BLOCK"]: nb(n), ["DEAD_" + K + "_CORAL_BLOCK"]: nb(n + 1), [K + "_CORAL"]: nb(n + 2), ["DEAD_" + K + "_CORAL"]: nb(n + 3), [K + "_CORAL_FAN"]: nb(n + 4), ["DEAD_" + K + "_CORAL_FAN"]: nb(n + 5) }); });
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
  SPAWN: 400, SPAWN_OVERFLOW: 700,   // preserve the original egg range below the Fishing Rod
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
  RELIC_EARTH: 564, RELIC_NATURE: 565, RELIC_TIDES: 566, ANCIENT_KEY: 567, DESERT_MAP: 568, OCEAN_MAP: 569, EXPEDITION_MAP: 570, CP_CHARM: 571,
  RELIC_DECAY: 572, RELIC_FLAME: 573, RELIC_SHADOWS: 574, DRAGON_SEAL: 575,
  LEVIATHAN_SCALE: 576, LEVIATHAN_FANG: 577, SANDCALLER_HORN: 578,
  DUNE_RELIC: 579, SUN_RELIC: 580, TOMB_RELIC: 581, ANCIENT_DESERT_CORE: 582,
  OBSIDIAN_SCALE: 583, MOLTEN_HEART: 584, INFERNO_FANG: 585, VOLCANIC_ESSENCE: 586,
  SAND_HELMET: 587, SAND_CHEST: 588, SAND_LEGS: 589, SAND_BOOTS: 590,
  OBSIDIAN_HELMET: 591, OBSIDIAN_CHEST: 592, OBSIDIAN_LEGS: 593, OBSIDIAN_BOOTS: 594,
  FANGBLADE: 595, INFERNO_GREATBLADE: 596, ANCIENT_HEART: 597, ANCIENT_CROWN: 598,
  ETERNAL_SAND_CORE: 599, ANCIENT_PLATE: 600, ANCIENT_TROPHY: 601, ANCIENT_COMPANION_RELIC: 602,
  ANCIENT_HELMET: 603, ANCIENT_CHEST: 604, ANCIENT_LEGS: 605, ANCIENT_BOOTS: 606, BURIED_SCEPTER: 607,
  HUSH_HELMET: 608, HUSH_CHEST: 609, HUSH_LEGS: 610, HUSH_BOOTS: 611, ECHO_BLADE: 612, SENTINEL_HAMMER: 613,
  RELIC_ABYSS: 614, RELIC_VOID: 615, CROWN_KEY: 616,   // Legacy Campaign, Chapters 7 and 8
  // Milestone 14 (smaller gaps): leads, name tags, horse armor, and the crystal that calls the Hollow Wyrm back
  LEAD: 617, NAME_TAG: 618, LEATHER_HORSE_ARMOR: 619, IRON_HORSE_ARMOR: 620, GOLD_HORSE_ARMOR: 621, SKY_HORSE_ARMOR: 622, VOID_CRYSTAL: 623,
  // The Forsaken Mutants (ids 624-639 are kept for this expansion)
  CORRUPTED_FLESH: 624, FORSAKEN_SHARD: 625, GROANER_TROPHY: 626,
  FORSAKEN_BONE: 627, BOW_LIMB: 628, RATTLER_TROPHY: 629, CORRUPTED_SILK: 630, VENOM_FANG: 631, SKITTER_TROPHY: 632,
  VOLATILE_MUTAGEN: 633, BLAST_CORE: 634, HISSER_TROPHY: 635, FORSAKEN_PEARL: 636, VOID_ESSENCE: 637, VOIDWALKER_TROPHY: 638,
  OSTRICH_EGG: 640,
  // the Endwatch Citadel
  CASTELLAN_GREATBLADE: 641,
  // Milestone 15: enchanting
  LAPIS: 650, PAPER: 651, BOOK: 652, ENCH_BOOK: 653,
  // Milestone 16: brewing
  MELON_SLICE: 654, MELON_SEEDS: 655, GLISTERING_MELON: 656, SUGAR: 657, FERMENTED_EYE: 658, RABBIT_FOOT: 659, PHANTOM_MEMBRANE: 660,
  POTION: 661, SPLASH_POTION: 662, LINGERING_POTION: 663, DRAGON_BREATH: 664,
  TIPPED_ARROW: 665,   // 665-679: one tipped arrow per potion (TIPPED_KEYS order)
  // Milestone 20, Part C
  COCOA_BEANS: 680, COOKIE: 681, BOWL: 682, MUSHROOM_STEW: 683,
  GLOW_BERRIES: 684,   // Milestone 20, Part D
  DRIED_KELP: 685, PRISMARINE_SHARD: 686, PRISMARINE_CRYSTALS: 687,   // Milestone 17, Part A
  HEART_OF_THE_SEA: 688, NAUTILUS_SHELL: 689, TREASURE_MAP: 690,   // Milestone 17, Part B
  RAW_SALMON: 691, COOKED_SALMON: 692, TRIDENT: 693, SCUTE: 694, TURTLE_HELMET: 695,   // Milestone 17, Part D
  MINNOW_BUCKET: 696, SALMON_BUCKET: 697, SUNFIN_BUCKET: 698, PUFFER_BUCKET: 699, AXOLOTL_BUCKET: 730, TADPOLE_BUCKET: 731
};

// A block value stores the block id in the low 8 bits and extra state ("meta") in the next 8 bits.
// The block limit step (2026-11-21) made room for 1,024 kinds of blocks without changing any existing number:
// blocks 256 and up keep their extra id bits ABOVE the meta (bits 16-17), so block 256 is the number 65536.
// Use idOf/metaOf/make, never "& 255", to read a block value. NB(k) turns a plain number k into a block id.
export const ID_MASK = 0xFFFF00FF, ID_SPACE = 1 << 18;
export const idOf = v => v & ID_MASK;
export const metaOf = v => (v >> 8) & 255;
export const make = (id, meta = 0) => id | (meta << 8);
export const NB = k => (k & 255) | ((k >> 8) << 16);
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
block(B.ANCHOR_STATION, "Resonance Anchor", { hardness: Infinity, drops: 0, light: 4, interact: "anchorstation", tex: ["anchor_s_top", "anchor_s_side", "echostone"], category: LOST });
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
block(B.SOLKARA_GATE, "Solkara Gateway", { hardness: Infinity, drops: 0, light: 12, interact: "solkara_gate", tex: "return_gate", category: LOST, noItem: true });
block(B.BLACK_SAND, "Black Sand", { hardness: 0.55, tool: "shovel", tex: "black_sand" });
block(B.EMBER_CRYSTAL, "Ember Crystal", { hardness: 1.8, tool: "pick", light: 13, render: "cutout", tex: "ember_crystal" });
block(B.WYRM_HEAD, "Wyrm Head", { hardness: 1, tool: "pick", tex: ["wyrm_head_top", "wyrm_head_side", "wyrm_head_top"], category: HOLLOW });
block(B.OBSIDIAN_TROPHY, "Obsidian Leviathan Trophy", { hardness: 2, tool: "pick", light: 6, tex: ["basalt_top", "obsidian_trophy", "blackstone"] });
// the Grand Desert Temple's stone (pale cream, orange trim) — buildable in Creative and mined like sandstone
block(B.TEMPLE_STONE, "Pale Temple Stone", { hardness: 1.5, tool: "pick", tier: 1, tex: ["temple_stone_top", "temple_stone", "temple_stone_top"] });
block(B.TEMPLE_TRIM, "Sunfire Terracotta", { hardness: 1.5, tool: "pick", tier: 1, tex: "temple_trim" });
block(B.TEMPLE_PILLAR, "Pale Temple Pillar", { hardness: 1.5, tool: "pick", tier: 1, tex: ["temple_pillar_top", "temple_pillar", "temple_pillar_top"] });
block(B.TEMPLE_STEP, "Pale Temple Step", { shape: "model", render: "cutout", hardness: 1.5, tool: "pick", tier: 1, tex: ["temple_stone_top", "temple_stone", "temple_stone_top"], iconBox: 8 / 16 });
// the Endwatch Citadel: red roofs, weathered brick, banners; ward bricks and the seal guard the Hollow portal until the Castellan falls
block(B.ROOF_TILES, "Red Roof Tiles", { hardness: 1.5, tool: "pick", tex: ["roof_tiles_top", "roof_tiles", "roof_tiles_top"] });
block(B.CRACKED_BRICKS, "Cracked Stone Bricks", { hardness: 1.5, tool: "pick", tier: 1, tex: "cracked_bricks" });
block(B.STONE_STEP, "Stone Brick Step", { shape: "model", render: "cutout", hardness: 1.5, tool: "pick", tier: 1, tex: "stone_bricks", iconBox: 8 / 16 });
block(B.CASTLE_BANNER, "Castle Banner", { shape: "model", render: "cutout", solid: false, hardness: 0.3, tex: "castle_banner", category: "Useful" });
block(B.WARD_BRICKS, "Ancient Ward Bricks", { hardness: Infinity, drops: 0, light: 2, tex: "ward_bricks", noItem: true });
block(B.PORTCULLIS, "Iron Portcullis", { shape: "model", render: "cutout", hardness: Infinity, drops: 0, tex: "portcullis", noItem: true });   // the gate's bars (js/citadel-gate.js raises them)
block(B.GATE_WINCH, "Gate Winch", { hardness: Infinity, drops: 0, light: 3, interact: "winch", tex: ["winch_top", "winch_side", "stone_bricks"], noItem: true });
block(B.CASTLE_TOME, "Ancient Tome", { shape: "model", render: "cutout", hardness: Infinity, drops: 0, interact: "tome", tex: ["tome_top", "tome_side", "planks"], noItem: true });   // lore of the Endwatch Citadel (js/citadel-keep.js)
block(B.WATCHFIRE, "Watchfire", { hardness: Infinity, drops: 0, light: 6, interact: "watchfire", tex: ["watchfire_top", "watchfire_side", "stone_bricks"], noItem: true });   // a dungeon checkpoint (js/citadel-dungeon.js)
block(B.WORN_BOOKSHELF, "Worn Bookshelf", { hardness: Infinity, drops: 0, interact: "secretshelf", tex: ["planks", "worn_bookshelf", "planks"], noItem: true });
block(B.CASTLE_LEVER, "Old Iron Lever", { hardness: Infinity, drops: 0, interact: "clever", tex: ["stone_bricks", "castle_lever", "stone_bricks"], noItem: true });
block(B.STAINED_GLASS, "Stained Glass", { hardness: 0.3, render: "cutout", drops: 0, tex: "stained_glass" });
block(B.CASTELLAN_SEAL, "Castellan's Seal", { hardness: Infinity, drops: 0, light: 7, tex: ["seal_top", "seal_side", "ward_bricks"], noItem: true });
block(B.BRAZIER, "Temple Brazier", { hardness: 2, tool: "pick", tier: 1, light: 13, tex: ["brazier_top", "brazier_side", "brazier_side"], category: "Useful" });

// Milestone 15: enchanting
block(B.LAPIS_ORE, "Lapis Ore", { hardness: 3, tool: "pick", tier: 2, drops: "lapis", tex: "lapis_ore", category: "Nature" });
block(B.SUGAR_CANE, "Sugar Cane", { shape: "cross", render: "cutout", solid: false, hardness: 0, tex: "sugar_cane", category: "Nature" });
block(B.ANVIL, "Anvil", { shape: "model", render: "cutout", hardness: 5, tool: "pick", tier: 1, interact: "anvil", faces: true, icon: "anvil", tex: ["anvil_top", "anvil_side", "anvil_side"], category: "Useful" });
block(B.GRINDSTONE, "Grindstone", { shape: "model", render: "cutout", hardness: 2, tool: "pick", tier: 1, interact: "grindstone", faces: true, icon: "grindstone", tex: ["grind_side", "grind_wheel", "grind_side"], category: "Useful" });
block(B.FROSTED_ICE, "Frosted Ice", { hardness: 0.5, drops: 0, tex: "frosted_ice", noItem: true, category: "Nature" });   // made by Frost Walker boots; melts back into water
// Milestone 20, Part B: six new woods. Leaves remember their sapling (saplingOf); saplings remember their tree (tree, see js/trees.js).
export const NEW_WOODS = [["SPRUCE", "Spruce", "spruce"], ["JUNGLE", "Jungle", "jungle"], ["ACACIA", "Acacia", "acacia"], ["DARK_OAK", "Dark Oak", "dark_oak"], ["CHERRY", "Cherry", "cherry"], ["MANGROVE", "Mangrove", "mangrove"]];
for (const [K, name, t] of NEW_WOODS) {
  block(B[K + "_LOG"], name + " Log", { hardness: 2, tool: "axe", tex: [t + "_log_top", t + "_log_side", t + "_log_top"], category: "Nature", log: true });
  block(B[K + "_LEAVES"], name + " Leaves", { hardness: 0.2, render: "cutout", drops: "leaves", tex: t + "_leaves", category: "Nature", saplingOf: B[K + "_SAPLING"] });
  block(B[K + "_PLANKS"], name + " Planks", { hardness: 2, tool: "axe", tex: t + "_planks" });
  block(B[K + "_SAPLING"], K === "MANGROVE" ? "Mangrove Propagule" : name + " Sapling", { shape: "cross", render: "cutout", solid: false, hardness: 0, tex: t + "_sapling", category: "Nature", tree: t });
}
// Milestone 20, Part C: blocks of the new land biomes
block(B.SNOW_LAYER, "Snow Layer", { shape: "model", render: "cutout", solid: false, replaceable: true, hardness: 0.1, tool: "shovel", drops: 0, tex: "snow", iconBox: 2 / 16, category: "Nature" });
block(B.ICE, "Ice", { hardness: 0.5, tool: "pick", render: "cutout", drops: 0, tex: "ice", category: "Nature", slippery: true });
block(B.PACKED_ICE, "Packed Ice", { hardness: 0.5, tool: "pick", drops: 0, tex: "packed_ice", category: "Nature", slippery: true });
block(B.BAMBOO, "Bamboo", { shape: "model", render: "cutout", hardness: 1, tool: "axe", tex: ["bamboo_top", "bamboo", "bamboo_top"], icon: "bamboo", category: "Nature" });
block(B.COCOA, "Cocoa", { shape: "model", render: "cutout", solid: false, hardness: 0.2, tool: "axe", drops: "cocoa", tex: "cocoa0", noItem: true, category: "Nature" });
block(B.MUD, "Mud", { hardness: 0.5, tool: "shovel", tex: "mud", category: "Nature" });
block(B.LILY_PAD, "Lily Pad", { shape: "model", render: "cutout", hardness: 0, tex: "lily_pad", icon: "tile:lily_pad", category: "Nature" });
block(B.RED_SAND, "Red Sand", { hardness: 0.5, tool: "shovel", tex: "red_sand", category: "Nature" });
for (const [k, name] of [["TERRACOTTA", "Terracotta"], ["ORANGE_TERRACOTTA", "Orange Terracotta"], ["YELLOW_TERRACOTTA", "Yellow Terracotta"], ["WHITE_TERRACOTTA", "White Terracotta"],
  ["RED_TERRACOTTA", "Red Terracotta"], ["BROWN_TERRACOTTA", "Brown Terracotta"], ["LIGHT_GRAY_TERRACOTTA", "Light Gray Terracotta"]])
  block(B[k], name, { hardness: 1.25, tool: "pick", tier: 1, tex: k.toLowerCase(), category: "Building" });
block(B.CACTUS, "Cactus", { shape: "model", render: "cutout", hardness: 0.4, tex: ["cactus_top", "cactus_side", "cactus_top"], category: "Nature", prickly: true });
block(B.DEAD_BUSH, "Dead Bush", { shape: "cross", render: "cutout", solid: false, replaceable: true, hardness: 0, drops: "deadbush", tex: "dead_bush", category: "Nature" });
block(B.MYCELIUM, "Mycelium", { hardness: 0.6, tool: "shovel", drops: B.DIRT, tex: ["mycelium_top", "mycelium_side", "dirt"], category: "Nature" });
block(B.BROWN_MUSHROOM, "Brown Mushroom", { shape: "cross", render: "cutout", solid: false, hardness: 0, light: 1, tex: "brown_mushroom", category: "Nature", tree: "brown_mushroom" });
block(B.RED_MUSHROOM, "Red Mushroom", { shape: "cross", render: "cutout", solid: false, hardness: 0, tex: "red_mushroom", category: "Nature", tree: "red_mushroom" });
block(B.BROWN_MUSHROOM_BLOCK, "Brown Mushroom Block", { hardness: 0.2, tool: "axe", drops: "bigmushroom", tex: "brown_mushroom_block", category: "Nature" });
block(B.RED_MUSHROOM_BLOCK, "Red Mushroom Block", { hardness: 0.2, tool: "axe", drops: "bigmushroom", tex: "red_mushroom_block", category: "Nature" });
block(B.MUSHROOM_STEM, "Mushroom Stem", { hardness: 0.2, tool: "axe", drops: 0, tex: "mushroom_stem", category: "Nature" });
block(B.PINK_PETALS, "Pink Petals", { shape: "model", render: "cutout", solid: false, replaceable: true, hardness: 0, tex: "pink_petals", icon: "tile:pink_petals", category: "Nature" });
// Milestone 20, Part D: lush caves and dripstone caves
block(B.MOSS_BLOCK, "Moss Block", { hardness: 0.1, tool: "hoe", tex: "moss_block", category: "Nature" });
block(B.MOSS_CARPET, "Moss Carpet", { shape: "model", render: "cutout", solid: false, hardness: 0.1, tex: "moss_block", iconBox: 1 / 16, category: "Nature" });
block(B.AZALEA, "Azalea", { render: "cutout", hardness: 0, tex: ["azalea_top", "azalea_side", "azalea_side"], category: "Nature", tree: "azalea" });
block(B.FLOWERING_AZALEA, "Flowering Azalea", { render: "cutout", hardness: 0, tex: ["flowering_azalea_top", "flowering_azalea_side", "azalea_side"], category: "Nature", tree: "azalea" });
block(B.AZALEA_LEAVES, "Azalea Leaves", { hardness: 0.2, render: "cutout", drops: "leaves", tex: "azalea_leaves", category: "Nature", saplingOf: B.AZALEA });
block(B.CAVE_VINES, "Cave Vines", { shape: "cross", render: "cutout", solid: false, hardness: 0, drops: "vines", interact: "berries_vine", tex: "cave_vines", noItem: true, category: "Nature" });
block(B.SPORE_BLOSSOM, "Spore Blossom", { shape: "cross", render: "cutout", solid: false, hardness: 0, tex: "spore_blossom", category: "Nature" });
block(B.POINTED_DRIPSTONE, "Pointed Dripstone", { shape: "model", render: "cutout", hardness: 1.5, tool: "pick", tex: "pointed_dripstone", icon: "tile:pointed_dripstone", category: "Nature" });
block(B.MANGROVE_ROOTS, "Mangrove Roots", { hardness: 0.7, tool: "axe", render: "cutout", tex: "mangrove_roots", category: "Nature" });
// Milestone 17, Part A: the ocean floor. "aquatic" blocks are water with something growing in it: you swim through them,
// they're drawn with water around them, and breaking one leaves the water behind. They can only be placed in water.
block(B.KELP, "Kelp", { shape: "cross", render: "cutout", solid: false, aquatic: true, hardness: 0, tex: "kelp", category: "Nature" });
block(B.SEAGRASS, "Seagrass", { shape: "cross", render: "cutout", solid: false, aquatic: true, replaceable: true, hardness: 0, drops: 0, tex: "seagrass", category: "Nature" });
block(B.SEA_PICKLE, "Sea Pickle", { shape: "model", render: "cutout", solid: false, aquatic: true, hardness: 0, drops: "pickles", tex: "sea_pickle", icon: "tile:sea_pickle", category: "Nature" });
block(B.SPONGE, "Sponge", { hardness: 0.6, tool: "hoe", tex: "sponge", category: "Useful" });
block(B.WET_SPONGE, "Wet Sponge", { hardness: 0.6, tool: "hoe", tex: "wet_sponge", category: "Useful" });
block(B.DRIED_KELP_BLOCK, "Dried Kelp Block", { hardness: 0.5, tool: "hoe", tex: ["dried_kelp_top", "dried_kelp_side", "dried_kelp_top"] });
block(B.PRISMARINE, "Prismarine", { hardness: 1.5, tool: "pick", tier: 1, tex: "prismarine" });
block(B.PRISMARINE_BRICKS, "Prismarine Bricks", { hardness: 1.5, tool: "pick", tier: 1, tex: "prismarine_bricks" });
block(B.DARK_PRISMARINE, "Dark Prismarine", { hardness: 1.5, tool: "pick", tier: 1, tex: "dark_prismarine" });
block(B.SEA_LANTERN, "Sea Lantern", { hardness: 0.3, light: 15, drops: "crystals", tex: "sea_lantern", category: "Useful" });
block(B.BLUE_ICE, "Blue Ice", { hardness: 2.8, tool: "pick", drops: 0, tex: "blue_ice", category: "Nature", slippery: 2 });
// Milestone 17, Part B: the Conduit lives in water too. Framed with prismarine it gives Conduit Power (main.js).
block(B.CONDUIT, "Conduit", { shape: "model", render: "cutout", solid: false, aquatic: true, floats: true, hardness: 3, tool: "pick", light: 15, tex: "conduit", icon: "tile:conduit", category: "Useful" });
// Milestone 17, Part D: sea turtle eggs on the beach (meta bits 0-1 = how many more than one, bits 2-3 = how close to hatching)
block(B.LIGHTNING_ROD, "Lightning Rod", { shape: "model", render: "cutout", solid: false, hardness: 3, tool: "pick", tier: 1, tex: "lightning_rod", icon: "tile:lightning_rod", category: MECH });   // Milestone 19, Part B: lightning nearby strikes it instead
block(B.TURTLE_EGG, "Turtle Egg", { shape: "model", render: "cutout", solid: false, hardness: 0.5, drops: 0, tex: "turtle_egg", icon: "tile:turtle_egg", category: "Nature" });
for (const [K, name] of CORALS) {
  const k = K.toLowerCase(), plant = { shape: "cross", render: "cutout", solid: false, aquatic: true, hardness: 0, drops: 0, category: "Nature" };
  // a living coral block turns into its dead block a few seconds after nothing watery touches it (main.js)
  block(B[K + "_CORAL_BLOCK"], name + " Coral Block", { hardness: 1.5, tool: "pick", tier: 1, drops: B["DEAD_" + K + "_CORAL_BLOCK"], tex: k + "_coral_block", category: "Nature", deadAs: B["DEAD_" + K + "_CORAL_BLOCK"] });
  block(B["DEAD_" + K + "_CORAL_BLOCK"], "Dead " + name + " Coral Block", { hardness: 1.5, tool: "pick", tier: 1, tex: "dead_" + k + "_coral_block", category: "Nature" });
  block(B[K + "_CORAL"], name + " Coral", { ...plant, tex: k + "_coral" });
  block(B["DEAD_" + K + "_CORAL"], "Dead " + name + " Coral", { ...plant, tex: "dead_coral" });
  block(B[K + "_CORAL_FAN"], name + " Coral Fan", { ...plant, tex: k + "_coral_fan" });
  block(B["DEAD_" + K + "_CORAL_FAN"], "Dead " + name + " Coral Fan", { ...plant, tex: "dead_coral_fan" });
}
// Milestone 16: brewing
block(B.MELON, "Melon", { hardness: 1, tool: "axe", drops: "melon", tex: ["melon_top", "melon_side", "melon_top"], category: "Nature" });
block(B.MELON_STEM, "Melon Stem", { shape: "crop", render: "cutout", solid: false, hardness: 0, drops: "crop", tex: "melon_stem0", category: "Nature", noItem: true });
block(B.BREWING_STAND, "Brewing Stand", { shape: "model", render: "cutout", hardness: 0.5, tool: "pick", tier: 1, light: 1, interact: "brew", icon: "brewing_stand", tex: ["brew_base", "brew_rod", "brew_base"], category: "Useful" });
block(B.CAULDRON, "Cauldron", { shape: "model", render: "cutout", hardness: 2, tool: "pick", tier: 1, interact: "cauldron", icon: "cauldron", tex: ["cauldron_top", "cauldron_side", "cauldron_side"], category: "Useful" });
block(B.ENCH_TABLE, "Enchanting Table", { shape: "model", render: "cutout", hardness: 5, tool: "pick", tier: 1, light: 7, interact: "enchant", tex: ["ench_top", "ench_side", "obsidian"], iconBox: 12 / 16, category: "Useful" });

export const BEACON_BASE =[B.IRON_BLOCK, B.GOLD_BLOCK, B.JADE_BLOCK, B.SKY_BLOCK, B.DUSK_BLOCK];
export const ANCHOR_MAX = 4;
for (const id of [B.SAND, B.RED_SAND, B.GRAVEL]) defs[id].falls = true;   // Milestone 18, Part B: they fall when nothing holds them up
// Milestone 18, Part B: what fire can burn (things made of wood, leaves, wool, hay, dry plants), but never containers or anything you use
export const flammable = id => { const d = defs[id]; return !!d && !d.interact && id !== B.AIR && (d.tool === "axe" || d.drops === "leaves" || d.tool === "shears" || id === B.HAY || id === B.TALL_GRASS || id === B.DEAD_BUSH || id === B.TNT || id === B.BOOKSHELF || id === B.BAMBOO); };
export const LEAF_PERSIST = 1;   // leaves a player placed never drop away
export const BLOCKS = defs;
export const blockDef = v => defs[v & ID_MASK] || defs[0];

// Lookup tables for speed (used thousands of times per frame by the mesher and physics)
export const OPAQUE = new Uint8Array(ID_SPACE);     // full cube that hides neighbors and blocks light
export const SOLID = new Uint8Array(ID_SPACE);      // player collides with it
export const EMIT = new Uint8Array(ID_SPACE);       // light given off
for (const d of Object.values(defs)) {
  OPAQUE[d.id] = d.shape === "cube" && d.render === "opaque" ? 1 : 0;
  SOLID[d.id] = d.solid ? 1 : 0;
  EMIT[d.id] = d.light;
}
// Milestone 17, Part A: water, and water with a plant in it (kelp, seagrass, sea pickles, coral plants and fans)
export const WATERY = new Uint8Array(ID_SPACE);
for (const d of Object.values(defs)) if (d.id === B.WATER || d.aquatic) WATERY[d.id] = 1;
// Milestone 18, Part C: fences, gates, trapdoors and signs can hold water (meta bit WATERLOGGED); isWet(v) is true for any watery spot
export const WATERLOGGED = 128;
export const LOGGABLE = new Uint8Array(ID_SPACE);
for (let id = B.OAK_TRAPDOOR; id <= B.WARPED_GATE; id++) LOGGABLE[id] = 1;
LOGGABLE[B.SIGN] = 1;
export const isWet = v => WATERY[v & ID_MASK] === 1 || (!!(v & (WATERLOGGED << 8)) && LOGGABLE[v & ID_MASK] === 1);
// Echohold Reborn: blocks whose light is cool teal instead of warm torchlight, and blocks whose own faces glow faintly
// (that glow pulses slowly in the shader). Their light still counts as light for creatures and spawning.
export const COOL = new Uint8Array(ID_SPACE);
export const FACEGLOW = new Float32Array(ID_SPACE);
for (const id of [B.HUSH_NODE, B.RESONATOR, B.GATE_SOCKET, B.GATE_FRAME, B.GATE_VEIL, B.LUMEN_CRYSTAL, B.KEEPER_BEACON, B.ANCHOR_STATION,
  B.WARDEN_TROPHY, B.SOVEREIGN_TROPHY, B.TIDE_LAMP, B.HUSH_SENSOR, B.TUNED_SENSOR, B.SKY_ORE]) if (id != null) COOL[id] = 1;
for (const [id, g] of [[B.HUSHMOSS, 0.4], [B.HUSH_NODE, 0.65], [B.LUMEN_GRASS, 0.5], [B.HUSH_CARPET, 0.18], [B.LUMEN_CRYSTAL, 0.7], [B.GATE_FRAME, 0.35]]) if (id != null) FACEGLOW[id] = g;
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
export const lightOf = v => (idOf(v) === B.FURNACE && (metaOf(v) & LIT)) ? 13 : idOf(v) === B.SEA_PICKLE ? 6 + 3 * (metaOf(v) & 3) : idOf(v) === B.CAVE_VINES ? (metaOf(v) & 1 ? 14 : 0) : idOf(v) === B.SPARK_LAMP ? (metaOf(v) & 1 ? 15 : 0) : idOf(v) === B.SPARK_TORCH ? (metaOf(v) & UNLIT ? 0 : 7) :
  (idOf(v) === B.SPARK_ORE || idOf(v) === B.DARK_SPARK_ORE) ? (metaOf(v) & 1 ? 9 : 0) : idOf(v) === B.RESPAWN_ANCHOR ? [0, 3, 7, 11, 15][Math.min(4, metaOf(v) & 7)] : (idOf(v) === B.WARD_ALTAR || idOf(v) === B.ARENA_WARD) && (metaOf(v) & 1) ? 14 : EMIT[v & ID_MASK];

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
item(I.OSTRICH_EGG, "Ostrich Egg", { icon: "ostrich_egg", stack: 8, category: "Food" });
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
// Milestone 14: leads, name tags, Trotter armor, and the Void Crystal
item(I.LEAD, "Lead", { icon: "lead", category: "Tools" });
item(I.NAME_TAG, "Name Tag", { icon: "nametag", category: "Tools" });
item(I.LEATHER_HORSE_ARMOR, "Leather Trotter Armor", { icon: "horse_armor", colors: ["#9a5a32", "#7a4424"], stack: 1, category: "Tools", horseArmor: 3 });
item(I.IRON_HORSE_ARMOR, "Iron Trotter Armor", { icon: "horse_armor", colors: ["#dcdcdc", "#a8a8a8"], stack: 1, category: "Tools", horseArmor: 5 });
item(I.GOLD_HORSE_ARMOR, "Gold Trotter Armor", { icon: "horse_armor", colors: ["#ffd84a", "#c9a227"], stack: 1, category: "Tools", horseArmor: 7 });
item(I.SKY_HORSE_ARMOR, "Skyshard Trotter Armor", { icon: "horse_armor", colors: ["#6ae0e8", "#2fa8b8"], stack: 1, category: "Tools", horseArmor: 11 });
item(I.VOID_CRYSTAL, "Void Crystal", { icon: "void_crystal", category: "Tools" });
// The Forsaken Mutants (js/mutants.js): what Herobrine's elite servants leave behind
item(I.CORRUPTED_FLESH, "Corrupted Flesh", { icon: "meat", colors: ["#5a8a3a", "#a8ff5a"], kind: "food", food: 3, category: "Food", sideEffect: "queasy" });
item(I.FORSAKEN_SHARD, "Forsaken Shard", { icon: "fs_shard" });
item(I.GROANER_TROPHY, "Forsaken Groaner Trophy", { icon: "fs_trophy", colors: ["#5d8a3a", "#f0fff0", "#a8ff5a"], stack: 16 });
item(I.FORSAKEN_BONE, "Forsaken Bone", { icon: "fs_bone" });
item(I.BOW_LIMB, "Forsaken Bow Limb", { icon: "fs_limb" });
item(I.RATTLER_TROPHY, "Forsaken Rattler Trophy", { icon: "fs_trophy", colors: ["#d8d2bc", "#e8f4ff", "#a8c8e8"], stack: 16 });
item(I.CORRUPTED_SILK, "Corrupted Silk", { icon: "fs_silk" });
item(I.VENOM_FANG, "Venom Fang", { icon: "fs_fang" });
item(I.SKITTER_TROPHY, "Forsaken Skitter Trophy", { icon: "fs_trophy", colors: ["#2e2e34", "#ff3040", "#ff3040"], stack: 16 });
item(I.VOLATILE_MUTAGEN, "Volatile Mutagen", { icon: "fs_mutagen" });
item(I.BLAST_CORE, "Corrupted Blast Core", { icon: "fs_blastcore" });
item(I.HISSER_TROPHY, "Forsaken Hisser Trophy", { icon: "fs_trophy", colors: ["#4f8a32", "#0c1408", "#9cff3a"], stack: 16 });
item(I.FORSAKEN_PEARL, "Forsaken Pearl", { icon: "fs_pearl" });
item(I.VOID_ESSENCE, "Void Essence", { icon: "fs_essence" });
item(I.VOIDWALKER_TROPHY, "Forsaken Voidwalker Trophy", { icon: "fs_trophy", colors: ["#1a1520", "#c060ff", "#c060ff"], stack: 16 });
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
item(I.CP_CHARM, "Tide Charm", { icon: "relic", colors: ["#3ab0c8", "#e8ffff"], stack: 1, quest: true });   // carry it and you never run out of air
item(I.RELIC_DECAY, "Relic of Decay", { icon: "relic", colors: ["#3a4a2a", "#b8e070"], stack: 1, quest: true });
item(I.RELIC_FLAME, "Relic of Flame", { icon: "relic", colors: ["#b8301a", "#ffc850"], stack: 1, quest: true });
item(I.RELIC_SHADOWS, "Relic of Shadows", { icon: "relic", colors: ["#2a2a3a", "#c8c8e8"], stack: 1, quest: true });
item(I.RELIC_ABYSS, "Relic of the Abyss", { icon: "relic", colors: ["#0e3a40", "#5ff0e0"], stack: 1, quest: true });
item(I.RELIC_VOID, "Relic of the Void", { icon: "relic", colors: ["#1a1030", "#b080ff"], stack: 1, quest: true });
item(I.CROWN_KEY, "Crown Key", { icon: "ancient_key", stack: 1, quest: true });   // opens the Gate of Eight in the Ruined Capital
item(I.DRAGON_SEAL, "Dragon Seal", { icon: "relic", colors: ["#6a1a10", "#ff8a3a"], stack: 3, quest: true });   // three of them fuse into a Cinder Eye
item(I.LEVIATHAN_SCALE, "Leviathan Scale", { icon: "relic", colors: ["#70482a", "#dca35a"], category: "Items" });
item(I.LEVIATHAN_FANG, "Leviathan Fang", { icon: "relic", colors: ["#966647", "#ffe6a5"], category: "Items" });
item(I.SANDCALLER_HORN, "Sandcaller Horn", { icon: "relic", colors: ["#8c5831", "#f1cc86"], stack: 1,
  desc: "Use on wide, flat desert sand to call or dismiss Dune. Crouch + use selects your bonded Obsidian Leviathan. Near the Citadel court, selects Obsidian. Dismount first. 12s settling cooldown per bond." });
item(I.DUNE_RELIC, "Relic of the Dunes", { icon: "relic", colors: ["#8d5736", "#ffd688"], quest: true });
item(I.SUN_RELIC, "Relic of the Sun", { icon: "relic", colors: ["#a33f24", "#ffe064"], quest: true });
item(I.TOMB_RELIC, "Relic of the Tomb", { icon: "relic", colors: ["#53484b", "#78d5cb"], quest: true });
item(I.ANCIENT_DESERT_CORE, "Ancient Desert Core", { icon: "relic", colors: ["#855641", "#78e0d6"], stack: 1, quest: true });
item(I.OBSIDIAN_SCALE, "Obsidian Leviathan Scale", { icon: "relic", colors: ["#302838", "#ad593a"] });
item(I.MOLTEN_HEART, "Molten Heart", { icon: "relic", colors: ["#682c2e", "#ff9c44"], stack: 1 });
item(I.INFERNO_FANG, "Inferno Fang", { icon: "relic", colors: ["#4a3541", "#ff7344"] });
item(I.VOLCANIC_ESSENCE, "Volcanic Essence", { icon: "relic", colors: ["#773d3a", "#f6ac62"] });
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
for (const [key, label, points, dur, set] of [
  ["SAND", "Sand Warrior", [3, 7, 5, 3], 520, "sand"],
  ["OBSIDIAN", "Obsidian Warden", [3, 8, 6, 3], 680, "obsidian"],
  ["ANCIENT", "Ancient Guardian", [3, 8, 6, 3], 850, "ancient"]
]) PIECES.forEach(([piece, , icon], slot) => {
  item(I[key + "_" + piece], label + " " + ["Helmet", "Chestplate", "Leggings", "Boots"][slot], {
    icon: "armor_" + icon, colors: [LEVIATHAN_ARMOR_STYLE[set].base], kind: "armor", stack: 1, category: "Tools",
    armor: { slot, points: points[slot], dur }, leviathanSet: set,
    desc: set === "ancient" ? "2: 25% less sand and crystal hazard damage in Hollow Sands. 4: 20% less Leviathan damage. Crouch + use empty hand: shield and burst, 45s cooldown, 6 durability per piece." :
      set === "sand" ? "2: lighter storm and vortex drag. 4: faster on sand, no vortex drag and 25% sand attack resistance. Crouch + use empty hand: shockwave, 20s cooldown, 3 durability per piece." :
      "2: 25% less fire damage. 4: 60% less fire damage and +2 melee damage to Sand Stalkers, Sand Wraiths, Desert Burrowers and Obsidian Crawlers. Crouch + use empty hand: 5s shield, 30s cooldown, 3 durability per piece."
  });
});
item(I.FANGBLADE, "Leviathan Fangblade", { icon: "sword", colors: ["#efd092", "#97693c"], kind: "tool", stack: 1, category: "Tools",
  tool: { type: "sword", tier: 4, speed: 9, dur: 900, damage: 7 }, desc: "Right-click: sand wave. 8 second cooldown. Costs 3 durability." });
item(I.INFERNO_GREATBLADE, "Inferno Greatblade", { icon: "sword", colors: ["#e7864b", "#453040"], kind: "tool", stack: 1, category: "Tools",
  tool: { type: "sword", tier: 5, speed: 10, dur: 1300, damage: 8, attackCooldown: 0.8, swingDuration: 0.6, heavy: true }, desc: "Heavy melee: 0.8s between strikes. Right-click: fiery wave. 12 second cooldown. Costs 4 durability." });
item(I.BURIED_SCEPTER, "Scepter of the Buried King", { icon: "rod", colors: ["#d4c4b0", "#9fcde9"], kind: "tool", stack: 1, category: "Tools",
  tool: { type: "staff", tier: 5, speed: 1, dur: 900, damage: 4 }, desc: "Right-click: six ancient energy spikes. 14 second cooldown. Costs 5 durability." });
// Echohold Reborn (Phase 5): Hushguard armor and two Keeper weapons. Each Hushguard piece takes 8% off damage from
// Echohold's creatures and bosses (up to 32%); the boots also soften your footsteps like the Warden-Plate.
PIECES.forEach(([piece, , icon], slot) => {
  item(I["HUSH_" + piece], "Hushguard " + ["Helm", "Chestplate", "Leggings", "Boots"][slot], {
    icon: "armor_" + icon, colors: ["#3a6a72"], kind: "armor", stack: 1, category: "Tools", armor: { slot, points: [3, 7, 6, 3][slot], dur: 650 }, hushguard: true, ...(slot === 3 ? { hush: true } : {}),
    desc: "Each Hushguard piece: 8% less damage from Echohold's creatures and guardians." + (slot === 3 ? " These boots also soften your footsteps." : "")
  });
});
item(I.CASTELLAN_GREATBLADE, "Castellan's Greatblade", { icon: "sword", colors: ["#d8dce4", "#2b2e35"], kind: "tool", stack: 1, category: "Tools",
  tool: { type: "sword", tier: 4, speed: 9, dur: 1100, damage: 8, attackCooldown: 0.75, swingDuration: 0.55, heavy: true }, desc: "Heavy: 0.75s between strikes. Right-click: Sweeping Cleave, hitting every enemy in front of you and driving them back. 8 second cooldown. Costs 3 durability." });
item(I.ECHO_BLADE, "Echo Blade", { icon: "tool_sword", colors: ["#7fe8ff", "#2a5a6a"], kind: "tool", stack: 1, category: "Tools", echoBlade: true,
  tool: { type: "sword", tier: 4, speed: 9, dur: 900, damage: 7 }, desc: "+50% damage to Echohold's creatures and guardians, and its strikes make no sound." });
item(I.SENTINEL_HAMMER, "Sentinel Hammer", { icon: "hammer", colors: ["#b87333", "#2a2e36"], kind: "tool", stack: 1, category: "Tools", breaksGuard: true,
  tool: { type: "sword", tier: 4, speed: 6, dur: 1000, damage: 9, attackCooldown: 1, swingDuration: 0.7, heavy: true }, desc: "Heavy: 1 second between strikes. Its blows go straight through shields held up in front." });

for (const [id, name] of [
  [I.ANCIENT_HEART, "Heart of the Ancient"], [I.ANCIENT_CROWN, "Ancient Leviathan Crown"],
  [I.ETERNAL_SAND_CORE, "Eternal Sand Core"], [I.ANCIENT_PLATE, "Ancient Guardian Plate"],
  [I.ANCIENT_TROPHY, "Buried King's Trophy"], [I.ANCIENT_COMPANION_RELIC, "Ancient Companion Relic"]
]) item(id, name, { icon: "relic", colors: ["#c9bda7", "#a5ccf0"], stack: id === I.ANCIENT_PLATE ? 64 : 1,
  ...(id === I.ANCIENT_COMPANION_RELIC ? { desc: "Right-click to summon or dismiss Runecrest. Right-click the companion to sit or follow. Heal with Skyshards." } : {})
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
  ["dolphin", "Splasher", "#8a9ab0", "#e8ecf0"], ["fox", "Pouncer", "#e0782a", "#f4ece0"], ["bee", "Buzzer", "#f0c020", "#2a2018"], ["parrot", "Chatterbird", "#d8302a", "#2a8ad8"],
  ["packass", "Long Ear", "#756258", "#c2af9a"], ["mule", "Trail Mule", "#814b31", "#af8f79"],
  ["camel", "Dune Strider", "#bc843d", "#e4b66f"], ["camel_husk", "Dune Husk", "#9d8866", "#c6b591"],
  ["llama", "Woolneck", "#dbc7a6", "#baa581"], ["trader_llama", "Caravan Woolneck", "#d7c49f", "#264887"],
  ["bone_trotter", "Bone Trotter", "#bfb5a0", "#867e70"], ["rot_trotter", "Rot Trotter", "#546a38", "#819757"]];
SPAWN_EGGS.push(...CREATURES.map(([id, name, color, accent]) => [id, name, color, accent]));
SPAWN_EGGS.push(["leviathan_dune", "Dune Leviathan", "#a97540", "#ffc664"]);
SPAWN_EGGS.push(...DESERT_MOBS);
SPAWN_EGGS.push(
  ["leviathan_obsidian", "Obsidian Leviathan", "#382b3a", "#ff7942"],
  ["leviathan_ancient", "Ancient Leviathan", "#c6baa3", "#8cc8ff"]
);
// Glider Wings go in the chest armor slot: jump while falling to glide
item(I.GLIDER, "Glider Wings", { icon: "glider", kind: "armor", stack: 1, category: "Tools", armor: { slot: 1, points: 0, dur: 432 }, glider: true });
// Milestone 15: enchanting (js/enchanting.js)
item(I.LAPIS, "Lapis", { icon: "lapis", category: "Items", desc: "A blue gem from deep underground. The Enchanting Table uses 1 to 3 for each enchantment" });
item(I.PAPER, "Paper", { icon: "paper", category: "Items" });
item(I.BOOK, "Book", { icon: "book", category: "Items", desc: "Put one in an Enchanting Table to make an Enchanted Book" });
item(I.ENCH_BOOK, "Enchanted Book", { icon: "ench_book", stack: 1, category: "Items" });
// Milestone 16: brewing (js/potions.js). Potions drink like food (1.6 s) and give the bottle back.
item(I.MELON_SLICE, "Melon Slice", { icon: "melon_slice", kind: "food", food: 2, category: "Food" });
item(I.MELON_SEEDS, "Melon Seeds", { icon: "seeds", colors: ["#2a2a1a", "#4a4a2a"], plants: B.MELON_STEM, category: "Food", desc: "Plant on farmland. The grown stem makes melons on the ground next to it" });
item(I.GLISTERING_MELON, "Glistering Melon Slice", { icon: "melon_slice", colors: ["gold"], category: "Items", desc: "A brewing ingredient (Healing)" });
item(I.SUGAR, "Sugar", { icon: "dust", colors: ["#f4f4f4", "#d8d8dc", "#ffffff"], category: "Items", desc: "A brewing ingredient (Swiftness)" });
item(I.FERMENTED_EYE, "Fermented Skitter Eye", { icon: "eye", colors: ["ferment"], category: "Items", desc: "A brewing ingredient: turns a potion into its opposite" });
item(I.RABBIT_FOOT, "Rabbit's Foot", { icon: "rabbit_foot", category: "Items", desc: "A brewing ingredient (Leaping)" });
item(I.PHANTOM_MEMBRANE, "Phantom Membrane", { icon: "membrane", category: "Items", desc: "A brewing ingredient (Slow Falling)" });
item(I.POTION, "Potion", { icon: "potion", stack: 1, kind: "food", food: 0, alwaysEat: true, sideEffect: "potion", potion: true, category: "Food" });
item(I.SPLASH_POTION, "Splash Potion", { icon: "potion", stack: 1, potion: true, category: "Food" });
item(I.LINGERING_POTION, "Lingering Potion", { icon: "potion", stack: 1, potion: true, category: "Food" });
// Milestone 16, Part B: tipped arrows. Each kind is its own item so different ones never stack together.
export const TIPPED_KEYS = ["night_vision", "invisibility", "leaping", "fire_resistance", "swiftness", "slowness", "turtle_master", "water_breathing",
  "healing", "harming", "poison", "regeneration", "strength", "weakness", "slow_falling"];
const TIP_COLORS = ["#1f1fa1", "#7f8392", "#22ff4c", "#e49a3a", "#7cafc6", "#5a6c81", "#8a6a8a", "#2e5299", "#f82423", "#430a09", "#4e9331", "#cd5cab", "#932423", "#484d48", "#f7f8e0"];
const TIP_NAMES = ["Night Vision", "Invisibility", "Leaping", "Fire Resistance", "Swiftness", "Slowness", "the Turtle Master", "Water Breathing", "Healing", "Harming", "Poison", "Regeneration", "Strength", "Weakness", "Slow Falling"];
TIPPED_KEYS.forEach((k, i) => item(I.TIPPED_ARROW + i, "Arrow of " + TIP_NAMES[i], { icon: "tipped_arrow", colors: [TIP_COLORS[i]], tip: k, arrow: true, category: "Tools",
  desc: "Shoot it from a bow: whatever it hits gets a short dose of the potion. Made from 8 arrows around a lingering potion" }));
items[I.ARROW].arrow = true;
// Milestone 20, Part C
item(I.DRIED_KELP, "Dried Kelp", { icon: "dried_kelp", kind: "food", food: 1, category: "Food", desc: "Cook kelp in a furnace. Nine make a Dried Kelp Block, a long-burning fuel." });   // Milestone 17, Part A
item(I.PRISMARINE_SHARD, "Prismarine Shard", { icon: "prismarine_shard" });
item(I.PRISMARINE_CRYSTALS, "Prismarine Crystals", { icon: "prismarine_crystals" });
item(I.HEART_OF_THE_SEA, "Heart of the Sea", { icon: "heart_sea", desc: "Found in buried treasure. With 8 Nautilus Shells it makes a Conduit." });   // Milestone 17, Part B
item(I.NAUTILUS_SHELL, "Nautilus Shell", { icon: "nautilus", desc: "From fishing, sunken ruins, shipwrecks, and the Wanderer." });
item(I.TREASURE_MAP, "Treasure Map", { icon: "treasure_map", stack: 1, category: "Tools", desc: "Hold it and follow the arrow at the top of the screen to the X on a beach, then dig down." });
// Milestone 17, Part D
item(I.RAW_SALMON, "Raw Salmon", { icon: "fish", colors: ["#c05a48", "#f0b8a0"], kind: "food", food: 2, category: "Food", raw: true });
item(I.COOKED_SALMON, "Cooked Salmon", { icon: "fish", colors: ["#a8603a", "#e8c090"], kind: "food", food: 6, category: "Food" });
item(I.TRIDENT, "Trident", { icon: "trident", kind: "tool", stack: 1, category: "Tools", tool: { type: "trident", tier: 3, speed: 1, dur: 250, damage: 9 }, desc: "A strong weapon. Hold right-click, then let go to throw it. Drowned sometimes drop one." });
item(I.SCUTE, "Scute", { icon: "scute", desc: "A baby sea turtle drops one when it grows up. Five make a Turtle Shell." });
item(I.TURTLE_HELMET, "Turtle Shell", { icon: "armor_helmet", colors: ["#4f9a4a"], kind: "armor", stack: 1, category: "Tools", armor: { slot: 0, points: 2, dur: 275 }, desc: "Lets you breathe for 10 more seconds after you go underwater." });
export const FISH_BUCKETS = { minnow: I.MINNOW_BUCKET, salmon: I.SALMON_BUCKET, sunfin: I.SUNFIN_BUCKET, puffer: I.PUFFER_BUCKET, axolotl: I.AXOLOTL_BUCKET, tadpole: I.TADPOLE_BUCKET };
for (const [sp, id, name, c] of [["minnow", I.MINNOW_BUCKET, "Bucket of Minnow", "#9aa8b0"], ["salmon", I.SALMON_BUCKET, "Bucket of Salmon", "#c05a48"], ["sunfin", I.SUNFIN_BUCKET, "Bucket of Sunfin", "#f08a1a"],
  ["puffer", I.PUFFER_BUCKET, "Bucket of Puffer", "#e8c040"], ["axolotl", I.AXOLOTL_BUCKET, "Bucket of Axolotl", "#f2a0b5"], ["tadpole", I.TADPOLE_BUCKET, "Bucket of Tadpole", "#74553a"]])
  item(id, name, { icon: "fish_bucket", colors: ["#3a6fd8", c], stack: 1, category: "Tools", holds: sp, desc: "Empty it into water (or onto the ground) to let the creature out." });
item(I.GLOW_BERRIES, "Glow Berries", { icon: "glow_berries", kind: "food", food: 2, category: "Food", desc: "Right-click the underside of a block to plant cave vines. Ripe vines glow" });   // Milestone 20, Part D
item(I.COCOA_BEANS, "Cocoa Beans", { icon: "cocoa_beans", category: "Food", desc: "Right-click the side of a Jungle Log to plant them" });
item(I.COOKIE, "Cookie", { icon: "cookie", kind: "food", food: 2, category: "Food" });
item(I.BOWL, "Bowl", { icon: "bowl", category: "Items" });
item(I.MUSHROOM_STEW, "Mushroom Stew", { icon: "bowl", colors: ["stew"], kind: "food", food: 6, stack: 1, sideEffect: "bowl", category: "Food" });
item(I.DRAGON_BREATH, "Wyrm's Breath", { icon: "bottle", colors: ["#c060ff"], category: "Items", desc: "Bottled from the Hollow Wyrm's breath. Turns splash potions into lingering ones" });
SPAWN_EGGS.push(...WILDLIFE_EGGS);
export const spawnEggId = index => index < I.FISHING_ROD - I.SPAWN ? I.SPAWN + index : I.SPAWN_OVERFLOW + index - (I.FISHING_ROD - I.SPAWN);
SPAWN_EGGS.forEach(([key, name, a, b], i) => item(spawnEggId(i), name + " Spawn Egg", { icon: "spawn_egg", colors: [a, b], kind: "spawn", species: key, category: "Creatures" }));
export const ITEMS = items;
export const itemDef = id => items[id];
export const isBlockItem = id => id > 0 && (id < 256 || (id >= 65536 && !!defs[id]));

// ---------- Crafting ----------
// Ingredient ids can be a tag like "planks" meaning any kind of planks.
export const TAGS = { planks: [B.PLANKS, B.BIRCH_PLANKS, ...NEW_WOODS.map(([K]) => B[K + "_PLANKS"])], logs: [B.LOG, B.BIRCH_LOG, ...NEW_WOODS.map(([K]) => B[K + "_LOG"])] };
export const RECIPES = [
  ...["HELMET", "CHEST", "LEGS", "BOOTS"].map((piece, slot) => ({
    out: [I["ANCIENT_" + piece], 1], ins: [[I.ANCIENT_PLATE, [1, 3, 2, 2][slot]], [I.SKYSHARD, [3, 5, 4, 2][slot]]], table: true
  })),
  { out: [I.BURIED_SCEPTER, 1], ins: [[I.ANCIENT_HEART, 1], [I.ETERNAL_SAND_CORE, 1], [I.STICK, 2]], table: true },
  ...["HELMET", "CHEST", "LEGS", "BOOTS"].flatMap((piece, slot) => [
    { out: [I["SAND_" + piece], 1], ins: [[I.LEVIATHAN_SCALE, [1, 2, 2, 1][slot]], [I.GOLD_INGOT, [3, 5, 4, 2][slot]]], table: true },
    { out: [I["OBSIDIAN_" + piece], 1], ins: [[I.OBSIDIAN_SCALE, [1, 2, 2, 1][slot]], [B.OBSIDIAN, [3, 5, 4, 2][slot]]], table: true }
  ]),
  { out: [I.FANGBLADE, 1], ins: [[I.LEVIATHAN_FANG, 1], [I.GOLD_INGOT, 3], [I.STICK, 1]], table: true },
  { out: [I.INFERNO_GREATBLADE, 1], ins: [[I.INFERNO_FANG, 1], [I.MOLTEN_HEART, 1], [I.DUSK_INGOT, 2]], table: true },
  { out: [I.SANDCALLER_HORN, 1], ins: [[I.BONE, 3], [I.GOLD_INGOT, 2], [I.LEATHER, 1]], table: true },
  { out: [B.PLANKS, 4], ins: [[B.LOG, 1]] },
  { out: [B.BIRCH_PLANKS, 4], ins: [[B.BIRCH_LOG, 1]] },
  ...NEW_WOODS.map(([K]) => ({ out: [B[K + "_PLANKS"], 4], ins: [[B[K + "_LOG"], 1]] })),   // Milestone 20
  // Milestone 20, Part C
  { out: [I.STICK, 1], ins: [[B.BAMBOO, 2]] },
  { out: [I.COOKIE, 8], ins: [[I.WHEAT, 2], [I.COCOA_BEANS, 1]], table: true },
  { out: [I.BOWL, 4], ins: [["planks", 3]], table: true },
  { out: [I.MUSHROOM_STEW, 1], ins: [[B.BROWN_MUSHROOM, 1], [B.RED_MUSHROOM, 1], [I.BOWL, 1]] },
  { out: [B.PACKED_ICE, 1], ins: [[B.ICE, 9]], table: true },
  { out: [B.DRIPSTONE, 1], ins: [[B.POINTED_DRIPSTONE, 4]] },
  { out: [B.MOSS_CARPET, 3], ins: [[B.MOSS_BLOCK, 2]] },
  // Milestone 17, Part A
  { out: [B.PRISMARINE, 1], ins: [[I.PRISMARINE_SHARD, 4]] },
  { out: [B.PRISMARINE_BRICKS, 1], ins: [[I.PRISMARINE_SHARD, 9]], table: true },
  { out: [B.DARK_PRISMARINE, 1], ins: [[I.PRISMARINE_SHARD, 8], [I.INK_SAC, 1]], table: true },
  { out: [B.SEA_LANTERN, 1], ins: [[I.PRISMARINE_SHARD, 4], [I.PRISMARINE_CRYSTALS, 5]], table: true },
  { out: [B.DRIED_KELP_BLOCK, 1], ins: [[I.DRIED_KELP, 9]], table: true },
  { out: [I.DRIED_KELP, 9], ins: [[B.DRIED_KELP_BLOCK, 1]] },
  { out: [B.BLUE_ICE, 1], ins: [[B.PACKED_ICE, 9]], table: true },
  { out: [B.CONDUIT, 1], ins: [[I.NAUTILUS_SHELL, 8], [I.HEART_OF_THE_SEA, 1]], table: true },
  { out: [B.LIGHTNING_ROD, 1], ins: [[I.IRON_INGOT, 3]], table: true },   // Milestone 19, Part B (iron, since Blockhaven has no copper)   // Milestone 17, Part B
  { out: [I.TURTLE_HELMET, 1], ins: [[I.SCUTE, 5]], table: true },   // Milestone 17, Part D
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
  { out: [B.BOOKSHELF, 1], ins: [["planks", 6], [I.BOOK, 3]], table: true },
  { out: [I.PAPER, 3], ins: [[B.SUGAR_CANE, 3]], table: true },
  { out: [I.BOOK, 1], ins: [[I.PAPER, 3], [I.LEATHER, 1]] },
  { out: [B.ENCH_TABLE, 1], ins: [[B.OBSIDIAN, 4], [I.SKYSHARD, 2], [I.BOOK, 1]], table: true },
  { out: [B.ANVIL, 1], ins: [[B.IRON_BLOCK, 3], [I.IRON_INGOT, 4]], table: true },
  // Milestone 16: brewing
  { out: [B.BREWING_STAND, 1], ins: [[I.FLARE_ROD, 1], [B.COBBLE, 3]], table: true },
  { out: [B.CAULDRON, 1], ins: [[I.IRON_INGOT, 7]], table: true },
  // Part B: 8 arrows + a lingering potion = 8 tipped arrows of that potion (main.js G.craft checks the potion kind)
  ...TIPPED_KEYS.map((k, i) => ({ out: [I.TIPPED_ARROW + i, 8], ins: [[I.ARROW, 8], [I.LINGERING_POTION, 1]], table: true, tip: k })),
  { out: [B.MELON, 1], ins: [[I.MELON_SLICE, 9]], table: true },
  { out: [I.MELON_SEEDS, 1], ins: [[I.MELON_SLICE, 1]] },
  { out: [I.GLISTERING_MELON, 1], ins: [[I.MELON_SLICE, 1], [I.GOLD_NUGGET, 8]], table: true },
  { out: [I.SUGAR, 1], ins: [[B.SUGAR_CANE, 1]] },
  { out: [I.FERMENTED_EYE, 1], ins: [[I.SPIDER_EYE, 1], [I.SUGAR, 1], [I.WART, 1]] },
  { out: [B.GRINDSTONE, 1], ins: [[I.STICK, 2], [B.STONE, 1], ["planks", 2]], table: true },
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
  { out: [I.LEAD, 2], ins: [[I.STRING, 4], [I.GLOOP_BALL, 1]], table: true },
  { out: [I.LEATHER_HORSE_ARMOR, 1], ins: [[I.LEATHER, 7]], table: true },
  { out: [I.VOID_CRYSTAL, 1], ins: [[B.GLASS, 7], [I.EYE, 1], [I.WAILER_TEAR, 1]], table: true },
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
  // the Forsaken Mutants' drops (js/mutants.js): useful, but never better than what you could already make
  { out: [I.BOW, 1], ins: [[I.BOW_LIMB, 2], [I.CORRUPTED_SILK, 1]], table: true },
  { out: [I.ARROW, 8], ins: [[I.FORSAKEN_BONE, 1], [I.FLINT, 1], [I.FEATHER, 1]], table: true },
  { out: [I.ARROW, 8], ins: [[I.VENOM_FANG, 1], [I.STICK, 2], [I.FEATHER, 2]], table: true },
  { out: [I.STRING, 4], ins: [[I.CORRUPTED_SILK, 1]], table: true },
  { out: [B.WARD_CANDLE, 3], ins: [[I.FORSAKEN_SHARD, 1], [I.CORRUPTED_SILK, 1], [I.COAL, 1]], table: true },
  { out: [B.TNT, 2], ins: [[I.BLAST_CORE, 1], [B.SAND, 4]], table: true },
  { out: [B.TNT, 1], ins: [[I.VOLATILE_MUTAGEN, 2], [B.SAND, 4]], table: true },
  { out: [I.PALE_LANTERN, 1], ins: [[I.FORSAKEN_PEARL, 1], [I.VOID_ESSENCE, 2], [I.IRON_INGOT, 2]], table: true },
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
SMELT[B.RED_SAND] = B.GLASS; SMELT[B.CLAY] = B.TERRACOTTA; FUEL[B.BAMBOO] = 1.5;   // Milestone 20, Part C
SMELT[I.RAW_SALMON] = I.COOKED_SALMON; SMELT[B.KELP] = I.DRIED_KELP; SMELT[B.WET_SPONGE] = B.SPONGE; FUEL[B.DRIED_KELP_BLOCK] = 100;   // Milestone 17, Part A
for (const [K] of NEW_WOODS) { SMELT[B[K + "_LOG"]] = I.COAL; FUEL[B[K + "_LOG"]] = 8; FUEL[B[K + "_PLANKS"]] = 7; }   // Milestone 20: new woods cook into coal and burn

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
  "lumen_grass", "lumen_grass_side", "beacon_k_top", "beacon_k_side", "lift_top", "lift_side", "mural", "anchor_s_top", "anchor_top_on", "anchor_s_side", "hush_carpet",
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
  "waystone_top", "waystone_side", "rune_stone",
  "black_sand", "ember_crystal", "obsidian_trophy", "wyrm_head_top", "wyrm_head_side",
  // the Grand Desert Temple
  "temple_stone", "temple_stone_top", "temple_trim", "temple_pillar", "temple_pillar_top", "brazier_top", "brazier_side",
  // the Endwatch Citadel
  "roof_tiles", "roof_tiles_top", "cracked_bricks", "castle_banner", "ward_bricks", "seal_top", "seal_side", "portcullis", "winch_top", "winch_side", "tome_top", "tome_side", "watchfire_top", "watchfire_side", "worn_bookshelf", "castle_lever", "stained_glass",
  // Milestone 15: enchanting
  "lapis_ore", "sugar_cane", "ench_top", "ench_side",
  "anvil_top", "anvil_top_chipped", "anvil_top_damaged", "anvil_side", "grind_side", "grind_wheel", "frosted_ice",
  // Milestone 16: brewing
  "melon_top", "melon_side", "melon_stem0", "melon_stem1", "melon_stem2", "melon_stem3", "brew_base", "brew_rod", "cauldron_top", "cauldron_side", "cauldron_inner",
  // Milestone 20, Part B: six new woods
  ...["spruce", "jungle", "acacia", "dark_oak", "cherry", "mangrove"].flatMap(t => [t + "_log_top", t + "_log_side", t + "_leaves", t + "_planks", t + "_sapling"]), "mangrove_roots",
  // Milestone 20, Part C
  "ice", "packed_ice", "bamboo", "bamboo_top", "cocoa0", "cocoa1", "cocoa2", "mud", "lily_pad", "red_sand", "terracotta", "orange_terracotta", "yellow_terracotta", "white_terracotta", "red_terracotta", "brown_terracotta", "light_gray_terracotta",
  "cactus_top", "cactus_side", "dead_bush", "mycelium_top", "mycelium_side", "brown_mushroom", "red_mushroom", "brown_mushroom_block", "red_mushroom_block", "mushroom_stem", "pink_petals",
  // Milestone 20, Part D
  "moss_block", "azalea_top", "azalea_side", "flowering_azalea_top", "flowering_azalea_side", "azalea_leaves", "cave_vines", "cave_vines_berries", "spore_blossom", "pointed_dripstone",
  // Milestone 17, Part A
  "kelp", "seagrass", "sea_pickle", "sponge", "wet_sponge", "dried_kelp_top", "dried_kelp_side", "prismarine", "prismarine_bricks", "dark_prismarine", "sea_lantern", "blue_ice",
  ...CORALS.flatMap(([K]) => { const k = K.toLowerCase(); return [k + "_coral_block", "dead_" + k + "_coral_block", k + "_coral", k + "_coral_fan"]; }), "dead_coral", "dead_coral_fan",
  "conduit",   // Milestone 17, Part B
  "turtle_egg",   // Milestone 17, Part D
  "lightning_rod"];   // Milestone 19, Part B
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
  if (idOf(v) === B.CAVE_VINES) return TILE[metaOf(v) & 1 ? "cave_vines_berries" : "cave_vines"];
  if (idOf(v) === B.COCOA) return TILE["cocoa" + Math.min(2, (metaOf(v) >> 2) & 3)];
  if (idOf(v) === B.MELON_STEM) return TILE["melon_stem" + Math.min(3, (metaOf(v) & 7) >> 1)];
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
  black_sand(P) {
    P.fill(["#252029", "#2d2830", "#332c32", "#393037"]);
    P.specks(28, ["#51434a", "#66505a", "#1b171f"]);
    P.specks(4, ["#805442", "#a36d4c"]);
  },
  ember_crystal(P) {
    for (const [left, tip, width] of [[2, 8, 4], [6, 1, 5], [11, 6, 4]]) {
      P.rect(left, tip + 3, width, 13 - tip, "#8d302b");
      P.rect(left + 1, tip, width - 2, 15 - tip, "#ed7738");
      P.rect(left + 2, tip + 2, 1, 13 - tip, "#ffbc68");
      P.rect(left + 2, tip + 2, 1, 3, "#ffe3a3");
    }
    P.rect(1, 14, 14, 2, "#382b39");
  },
  // Wyrm Head (Milestone 14): dark violet scales, with glowing purple eyes on every side
  roof_tiles(P) { P.fill(["#b8322a", "#c23a2e", "#ad2c25"]); for (let r = 0; r < 4; r++) { P.rect(0, r * 4 + 3, 16, 1, "#7e1c18"); for (let x = (r % 2) * 4; x < 16; x += 8) P.rect(x, r * 4, 1, 3, "#8e2019"); P.rect(0, r * 4, 16, 1, "#d9564a"); } },
  roof_tiles_top(P) { P.fill(["#bd352c", "#c63d30"]); for (let y = 0; y < 16; y += 4) P.rect(0, y, 16, 1, "#8e2019"); for (let x = 0; x < 16; x += 4) P.rect(x, 0, 1, 16, "#9a241c"); },
  cracked_bricks(P) { PAINT.stone_bricks(P); for (const [x, y] of [[3, 2], [4, 3], [5, 4], [5, 5], [6, 6], [10, 9], [11, 10], [11, 11], [12, 12], [2, 12], [3, 13]]) P.px(x, y, "#3e3e3e"); P.rect(13, 4, 2, 2, "#5f5f5f"); },
  castle_banner(P) { P.rect(3, 0, 10, 15, "#9c1f24"); P.rect(3, 0, 10, 1, "#5a3a1a"); P.rect(7, 2, 2, 10, "#e8c048"); P.rect(4, 5, 8, 2, "#e8c048"); P.rect(3, 13, 3, 2, "#7a161a"); P.rect(10, 13, 3, 2, "#7a161a"); P.px(8, 14, "#7a161a"); },
  watchfire_top(P) { P.fill(["#2a2a30"]); P.rect(1, 1, 14, 14, "#3a3a42"); for (let i = 0; i < 30; i++) P.px(2 + Math.floor(P.r() * 12), 2 + Math.floor(P.r() * 12), P.pick(["#5a5a60", "#7ad0ff", "#4a90c8", "#2a2a30"])); },
  watchfire_side(P) { PAINT.stone_bricks(P); P.rect(0, 0, 16, 3, "#3a3a42"); P.rect(0, 13, 16, 3, "#3a3a42"); P.rect(6, 5, 4, 6, "#4a90c8"); P.rect(7, 6, 2, 4, "#bfe8ff"); },
  worn_bookshelf(P) { PAINT.bookshelf(P); P.rect(9, 2, 2, 6, "#b03a2a"); P.rect(9, 1, 2, 1, "#d86a4a"); },
  castle_lever(P) { PAINT.stone_bricks(P); P.rect(5, 9, 6, 4, "#3a3a42"); P.rect(7, 3, 2, 8, "#6e4b26"); P.rect(6, 2, 4, 2, "#8a8a94"); },
  // Milestone 15: enchanting
  lapis_ore(P) { PAINT.stone(P); for (const [x, y, w, h] of [[2, 2, 3, 2], [9, 1, 2, 3], [5, 6, 3, 3], [12, 7, 3, 2], [2, 11, 2, 3], [8, 11, 3, 2], [13, 12, 2, 2]]) { P.rect(x, y, w, h, "#1f4fb4"); P.px(x, y, "#5a8cf0"); P.px(x + w - 1, y + h - 1, "#163a86"); } },
  sugar_cane(P) { for (const [x, c, d] of [[3, "#8fd060", "#6aa840"], [8, "#a2dc70", "#78b84a"], [12, "#86c858", "#62a03c"]]) { P.rect(x, 0, 2, 16, c); P.rect(x + 1, 0, 1, 16, d); for (const y of [3, 9, 14]) P.rect(x, y + (x % 3) - 1, 2, 1, "#c8e8a0"); } P.rect(5, 4, 3, 1, "#78b84a"); P.rect(10, 11, 2, 1, "#78b84a"); },
  ench_top(P) { P.fill(["#7a1a24", "#701820", "#842030"]); P.rect(0, 0, 16, 1, "#2a1e3a"); P.rect(0, 15, 16, 1, "#2a1e3a"); P.rect(0, 0, 1, 16, "#2a1e3a"); P.rect(15, 0, 1, 16, "#2a1e3a"); P.rect(2, 2, 12, 1, "#d8a830"); P.rect(2, 13, 12, 1, "#d8a830"); P.rect(2, 2, 1, 12, "#d8a830"); P.rect(13, 2, 1, 12, "#d8a830"); for (const [x, y] of [[1, 1], [13, 1], [1, 13], [13, 13]]) { P.rect(x, y, 2, 2, "#62e6ee"); P.px(x, y, "#c8fcff"); } P.rect(6, 6, 4, 4, "#5a1018"); P.rect(7, 7, 2, 2, "#d8a830"); },
  ench_side(P) { PAINT.obsidian(P); P.rect(0, 0, 16, 4, "#7a1a24"); P.rect(0, 3, 16, 1, "#d8a830"); for (let x = 1; x < 16; x += 3) P.px(x, 1, "#a03040"); P.rect(2, 7, 1, 1, "#9a6ae0"); P.rect(12, 10, 1, 1, "#9a6ae0"); },
  anvil_top(P) { P.fill(["#4a4a4e", "#444448", "#505054"]); P.rect(0, 0, 16, 1, "#68686e"); P.rect(0, 15, 16, 1, "#2e2e32"); P.rect(2, 3, 12, 10, "#3c3c40"); P.rect(3, 4, 10, 8, "#56565a"); P.px(4, 5, "#78787e"); P.px(11, 10, "#2a2a2e"); },
  anvil_top_chipped(P) { PAINT.anvil_top(P); for (const [x, y] of [[5, 6], [6, 7], [7, 7], [10, 4], [11, 5]]) P.px(x, y, "#1e1e22"); },
  anvil_top_damaged(P) { PAINT.anvil_top_chipped(P); for (const [x, y] of [[4, 9], [5, 10], [6, 10], [7, 11], [9, 8], [10, 9], [12, 10], [3, 4], [8, 5]]) P.px(x, y, "#1e1e22"); P.rect(13, 6, 2, 2, "#2a2a2e"); },
  anvil_side(P) { P.fill(["#48484c", "#424246", "#4e4e52"]); P.rect(0, 0, 16, 1, "#66666c"); P.rect(0, 15, 16, 1, "#2a2a2e"); for (let x = 1; x < 16; x += 4) P.px(x, 7, "#5c5c62"); },
  grind_side(P) { patches(P, ["#8e8e8c", "#868684", "#969694", "#7e7e7c"], 40, 3, 2); P.rect(0, 0, 16, 1, "#a8a8a6"); P.rect(0, 15, 16, 1, "#6a6a68"); },
  grind_wheel(P) { PAINT.grind_side(P); for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) { const d = (x - 7.5) ** 2 + (y - 7.5) ** 2; if (d < 36 && d > 30) P.px(x, y, "#6a6a68"); } P.rect(6, 6, 4, 4, "#8a6235"); P.rect(7, 7, 2, 2, "#5a3d20"); },
  frosted_ice(P) { P.fill(["#a8d4f4", "#9ccaee", "#b4dcf8"]); for (const [x, y, w] of [[2, 3, 5], [9, 6, 4], [4, 11, 6], [12, 12, 3]]) P.rect(x, y, w, 1, "#e4f4ff"); for (const [x, y] of [[6, 8], [7, 9], [8, 9], [11, 2], [3, 6]]) P.px(x, y, "#78a8d0"); },
  // Milestone 16: brewing
  melon_top(P) { P.fill(["#7aa23a", "#86ae42", "#6e9632"]); for (let i = 0; i < 16; i += 4) P.rect(i, 0, 1, 16, "#5a7e2a"); P.rect(6, 6, 4, 4, "#8eb84a"); P.rect(7, 7, 2, 2, "#4e6e24"); },
  melon_side(P) { P.fill(["#6e9a32", "#7aa83a", "#64902e"]); for (let x = 1; x < 16; x += 4) { P.rect(x, 0, 2, 16, "#9cc450"); P.rect(x + 2, 0, 1, 16, "#56802a"); } },
  melon_stem0(P) { P.rect(7, 12, 2, 4, "#6aa83a"); P.px(6, 12, "#7ab84a"); },
  melon_stem1(P) { P.rect(7, 8, 2, 8, "#78a83a"); P.rect(5, 9, 2, 1, "#78a83a"); P.rect(9, 11, 2, 1, "#78a83a"); },
  melon_stem2(P) { P.rect(7, 4, 2, 12, "#90a838"); P.rect(4, 6, 3, 1, "#90a838"); P.rect(9, 9, 3, 1, "#90a838"); P.rect(4, 12, 3, 1, "#90a838"); },
  melon_stem3(P) { P.rect(7, 2, 2, 14, "#b89a30"); P.rect(3, 4, 4, 1, "#a88a2a"); P.rect(9, 7, 4, 1, "#a88a2a"); P.rect(3, 11, 4, 1, "#a88a2a"); P.rect(2, 3, 2, 2, "#6e9a32"); },
  brew_base(P) { patches(P, ["#7a7a78", "#727270", "#848482"], 30, 3, 2); P.rect(0, 0, 16, 1, "#9a9a98"); },
  brew_rod(P) { P.fill(["#e8b830", "#f0c840", "#d8a820"]); P.rect(0, 0, 16, 2, "#fff0a0"); for (let y = 3; y < 16; y += 4) P.rect(0, y, 16, 1, "#b88a18"); },
  cauldron_side(P) { P.fill(["#3c3c40", "#36363a", "#424246"]); P.rect(0, 0, 16, 2, "#56565c"); P.rect(0, 14, 16, 2, "#2a2a2e"); P.rect(0, 12, 3, 4, "#1e1e22"); P.rect(13, 12, 3, 4, "#1e1e22"); for (let x = 2; x < 16; x += 5) P.px(x, 6, "#4e4e54"); },
  cauldron_top(P) { P.fill(["#46464a", "#404044"]); P.rect(2, 2, 12, 12, "#232327"); P.rect(0, 0, 16, 1, "#5a5a60"); },
  cauldron_inner(P) { P.fill(["#2e2e32", "#2a2a2e", "#323236"]); },
  stained_glass(P) { const C = ["#b8323a", "#2f5fb8", "#e0b030", "#3a8a4a", "#7a3ab0"]; for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x += 4) P.rect(x, y, 4, 4, C[((x >> 2) * 3 + (y >> 2) * 2) % C.length]); for (let i = 0; i < 16; i += 4) { P.rect(i, 0, 1, 16, "#1a1a20"); P.rect(0, i, 16, 1, "#1a1a20"); } P.rect(15, 0, 1, 16, "#1a1a20"); P.rect(0, 15, 16, 1, "#1a1a20"); },
  tome_top(P) { P.rect(1, 2, 14, 12, "#5a2a1a"); P.rect(2, 3, 5, 10, "#efe4c8"); P.rect(9, 3, 5, 10, "#efe4c8"); for (let y = 4; y < 12; y += 2) { P.rect(3, y, 3, 1, "#8a7a60"); P.rect(10, y, 3, 1, "#8a7a60"); } P.rect(7, 2, 2, 12, "#3a1a0e"); },
  tome_side(P) { PAINT.planks(P); P.rect(0, 0, 16, 2, "#5a2a1a"); P.rect(5, 2, 6, 14, "#6e4b26"); },
  portcullis(P) { for (const x of [1, 5, 10, 14]) P.rect(x, 0, 2, 16, "#3a3a42"); for (const y of [3, 9]) P.rect(0, y, 16, 2, "#2c2c34"); for (const x of [1, 5, 10, 14]) P.rect(x, 15, 2, 1, "#8a8a94"); },
  winch_top(P) { PAINT.planks(P); P.rect(2, 2, 12, 12, "#5a3a1a"); P.rect(4, 4, 8, 8, "#8a8a94"); P.rect(7, 1, 2, 14, "#3a2410"); P.rect(1, 7, 14, 2, "#3a2410"); },
  winch_side(P) { PAINT.planks(P); for (let y = 2; y < 14; y += 3) P.rect(3, y, 10, 2, "#7a7a84"); P.rect(0, 0, 16, 1, "#3a2410"); P.rect(0, 15, 16, 1, "#3a2410"); },
  ward_bricks(P) { P.fill(["#46485a", "#4c4e62", "#42445a"]); for (let r = 0; r < 4; r++) { P.rect(0, r * 4 + 3, 16, 1, "#2c2d3a"); P.rect((r % 2) * 8, r * 4, 1, 3, "#2c2d3a"); } P.px(4, 6, "#8fd6ff"); P.px(11, 1, "#8fd6ff"); P.px(12, 10, "#8fd6ff"); },
  seal_top(P) { PAINT.ward_bricks(P); P.rect(3, 3, 10, 10, "#2a2236"); P.rect(5, 5, 6, 6, "#9b7bff"); P.rect(7, 4, 2, 8, "#d8c8ff"); P.rect(4, 7, 8, 2, "#d8c8ff"); },
  seal_side(P) { PAINT.ward_bricks(P); P.rect(6, 3, 4, 10, "#2a2236"); P.rect(7, 5, 2, 6, "#b49bff"); },
  temple_stone(P) { P.fill(["#efe6d4", "#ebe1ce", "#f3ebdb"]); P.rect(0, 0, 16, 1, "#f8f2e6"); P.rect(0, 15, 16, 1, "#d9ccb2"); P.rect(0, 7, 16, 1, "#e2d6bf"); },
  temple_stone_top(P) { P.fill(["#f1e8d8", "#ede4d2", "#f5eddf"]); P.rect(0, 0, 16, 1, "#dccfb6"); P.rect(0, 0, 1, 16, "#dccfb6"); P.rect(15, 0, 1, 16, "#f9f4ea"); P.rect(0, 15, 16, 1, "#f9f4ea"); },
  temple_trim(P) { P.fill(["#c9652c", "#c35f27", "#ce6b31"]); for (let i = 0; i < 12; i++) P.px(Math.floor(P.r() * 16), Math.floor(P.r() * 16), "#ad5120"); P.rect(0, 0, 16, 1, "#d9783a"); P.rect(0, 15, 16, 1, "#a64c1d"); },
  temple_pillar(P) { P.fill(["#f2eadb", "#eee5d4"]); for (const x of [2, 6, 9, 13]) P.rect(x, 1, 1, 14, "#d6c9af"); P.rect(0, 0, 16, 1, "#e0d3ba"); P.rect(0, 15, 16, 1, "#e0d3ba"); },
  temple_pillar_top(P) { P.fill(["#f1e9d9"]); P.rect(2, 2, 12, 12, "#e4d8c1"); P.rect(4, 4, 8, 8, "#f3ecde"); },
  brazier_top(P) { P.fill(["#3a2a1a"]); P.rect(1, 1, 14, 14, "#5a3a1a"); for (let i = 0; i < 40; i++) P.px(2 + Math.floor(P.r() * 12), 2 + Math.floor(P.r() * 12), P.pick(["#ff9a2a", "#ffcf4a", "#e25a14", "#7a2a0a"])); P.rect(0, 0, 16, 1, "#d8a840"); P.rect(0, 15, 16, 1, "#d8a840"); P.rect(0, 0, 1, 16, "#d8a840"); P.rect(15, 0, 1, 16, "#d8a840"); },
  brazier_side(P) { P.fill(["#7a5428", "#74502a", "#805a2c"]); P.rect(0, 0, 16, 3, "#e0b048"); P.rect(0, 3, 16, 1, "#9a6a24"); P.rect(0, 12, 16, 4, "#4a3218"); for (const x of [3, 8, 12]) P.rect(x, 5, 1, 6, "#5e4020"); },
  wyrm_head_top(P) { P.fill(["#1c1424", "#241a2e", "#2a1f36"]); for (let i = 0; i < 10; i++) P.px(Math.floor(P.r() * 16), Math.floor(P.r() * 16), "#3a2a4a"); P.rect(3, 3, 2, 10, "#140e1a"); P.rect(11, 3, 2, 10, "#140e1a"); },
  wyrm_head_side(P) {
    P.fill(["#1c1424", "#241a2e", "#2a1f36"]);
    for (let y = 1; y < 16; y += 3) for (let x = (y % 2) * 2; x < 16; x += 4) P.rect(x, y, 2, 1, "#33264a");
    P.rect(2, 5, 4, 2, "#c050ff"); P.rect(10, 5, 4, 2, "#c050ff"); P.rect(3, 5, 2, 1, "#f0c0ff"); P.rect(11, 5, 2, 1, "#f0c0ff");
    P.rect(2, 11, 12, 2, "#120c18"); for (let x = 3; x < 13; x += 2) P.px(x, 12, "#e8e0d0");
  },
  obsidian_trophy(P) {
    P.fill(["#231e28", "#2d2530", "#352933"]);
    P.rect(1, 1, 14, 1, "#69505a"); P.rect(1, 14, 14, 1, "#60454b");
    P.rect(3, 4, 10, 8, "#784438"); P.rect(4, 3, 8, 10, "#b66442");
    P.rect(5, 5, 6, 6, "#20141b");
    for (const x of [5, 7, 9]) { P.rect(x, 5, 1, 2, "#fbd295"); P.rect(x, 9, 1, 2, "#df9c63"); }
    P.rect(7, 7, 2, 2, "#e86c40");
  },
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
  anchor_s_top(P) { PAINT.echostone(P); P.rect(3, 3, 10, 10, "#2a2c34"); P.rect(6, 6, 4, 4, "#5a6a8a"); },
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

// Milestone 20, Part B: the six new woods share the oak/birch painters with their own colors
// [ring/center, ring line, bark colors, bark line, leaves, planks, plank seam, sapling leaves]
const WOOD_PAL = {
  spruce: ["#7a5a34", "#4e3820", ["#3e2c1a", "#352616", "#4a3520", "#2e2113"], "#24190e", ["#2f5a3a", "#28503a", "#386544", "#21452e", "#3e6e4a"], ["#7a5a36", "#714f2f", "#83633d"], "#4e3720", ["#2f5a3a", "#386544"]],
  jungle: ["#b0844a", "#7a5a2e", ["#5f4b2a", "#6b5534", "#55432a", "#4a6a2a"], "#3e3018", ["#3fa034", "#36912c", "#4ab03c", "#2f8226", "#56b844"], ["#b0784a", "#a56e42", "#bb8352"], "#7a5030", ["#3fa034", "#56b844"]],
  acacia: ["#b85a2a", "#7a3a18", ["#6a645c", "#5f5a52", "#757068", "#545048"], "#45413a", ["#6a8a2a", "#5f7f24", "#769632", "#53701e", "#82a23a"], ["#c0602e", "#b55828", "#ca6a36"], "#8a3e1a", ["#6a8a2a", "#82a23a"]],
  dark_oak: ["#5a4026", "#3a2816", ["#3a2a1a", "#332414", "#423020", "#2a1e10"], "#1e150a", ["#2e5a1e", "#285219", "#356624", "#224814", "#3e702a"], ["#4a321c", "#422c18", "#543a22"], "#2a1c0e", ["#2e5a1e", "#3e702a"]],
  cherry: ["#c88a9a", "#8a5060", ["#3a2230", "#331e2a", "#432838", "#2b1824"], "#22121c", ["#f0a8c8", "#e898bc", "#f8b8d4", "#dc88b0", "#fcc8dc"], ["#e8b8b0", "#dfaea6", "#f0c2ba"], "#b88078", ["#f0a8c8", "#fcc8dc"]],
  mangrove: ["#7a3a2e", "#4e2018", ["#4a3a2a", "#423224", "#544232", "#3a2c1e"], "#2a1e14", ["#4a8a2e", "#427e28", "#549836", "#3a7022", "#5ea43e"], ["#7a3028", "#702a22", "#843830"], "#4e1a14", ["#4a8a2e", "#5ea43e"]]
};
for (const [t, [ring, line, bark, barkLine, leaf, plank, seam, sap]] of Object.entries(WOOD_PAL)) {
  PAINT[t + "_log_top"] = P => { P.fill([barkLine]); for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); P.px(x, y, Math.round(d) % 3 === 0 ? line : ring); } };
  PAINT[t + "_log_side"] = P => { patches(P, bark, 45, 2, 10); for (const [x, y, h] of [[1, 1, 8], [5, 4, 7], [9, 9, 7], [13, 0, 11]]) { P.rect(x, y, 1, h, barkLine); P.rect(x + 1, y + 2, 1, h - 3, bark[2]); } if (t === "jungle") P.specks(6, ["#4a7a2a", "#5a8a32"]); };
  PAINT[t + "_leaves"] = P => foliage(P, leaf);
  PAINT[t + "_planks"] = P => PAINT.planks(P, plank, seam);
  PAINT[t + "_sapling"] = P => { P.rect(7, 9, 2, 7, bark[0]); for (const [x, y] of [[6, 4], [4, 6], [9, 5], [7, 2], [10, 7], [5, 8]]) P.rect(x, y, 3, 3, P.pick(sap)); };
}
// Milestone 20, Part C: textures for the new land biomes
Object.assign(PAINT, {
  ice(P) { P.fill(["rgba(150,200,245,.85)", "rgba(140,190,240,.85)", "rgba(165,210,250,.85)"]); for (const [x, y, w] of [[2, 3, 6], [8, 9, 5], [3, 12, 4]]) P.rect(x, y, w, 1, "rgba(230,245,255,.95)"); },
  packed_ice(P) { P.fill(["#8eb8e8", "#84aee0", "#98c2ef"]); for (const [x, y] of [[3, 4], [10, 2], [6, 11], [12, 12]]) P.rect(x, y, 3, 1, "#c8e0fa"); },
  bamboo(P) { for (let y = 0; y < 16; y++) { P.rect(6, y, 4, 1, y % 5 === 0 ? "#4a7a1e" : "#6aa832"); P.px(9, y, "#4f8a24"); } P.rect(10, 6, 3, 1, "#6aa832"); P.rect(3, 11, 3, 1, "#6aa832"); },
  bamboo_top(P) { P.rect(6, 6, 4, 4, "#8ac04a"); P.rect(7, 7, 2, 2, "#c8e098"); },
  cocoa0(P) { P.rect(6, 6, 4, 5, "#7aa83a"); P.rect(7, 7, 2, 3, "#9ac85a"); },
  cocoa1(P) { P.rect(5, 5, 6, 7, "#b89040"); P.rect(6, 6, 2, 5, "#d0a85a"); },
  cocoa2(P) { P.rect(4, 4, 8, 9, "#8a4a1e"); P.rect(5, 5, 2, 7, "#a8602a"); P.rect(9, 6, 2, 5, "#6a3814"); },
  mud(P) { patches(P, ["#3c3237", "#362c31", "#44393e", "#2e2629"], 50, 3, 2); },
  lily_pad(P) { for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 7 && !(x > 7 && Math.abs(y - 7.5) < 1)) P.px(x, y, d < 2 ? "#4a8a2a" : (x + y) % 3 ? "#2f6e1e" : "#3a7e26"); } },
  red_sand(P) { patches(P, ["#be6621", "#b25e1c", "#c87028", "#a85618"], 60, 2, 2); },
  terracotta(P) { patches(P, ["#985e43", "#8e573e", "#a06648"], 40, 3, 2); },
  orange_terracotta(P) { patches(P, ["#a1532a", "#974d26", "#aa5a2f"], 40, 3, 2); },
  yellow_terracotta(P) { patches(P, ["#b9852b", "#ae7d27", "#c28c31"], 40, 3, 2); },
  white_terracotta(P) { patches(P, ["#d1b2a1", "#c8a998", "#d8b9a8"], 40, 3, 2); },
  red_terracotta(P) { patches(P, ["#8f3c2e", "#86372a", "#984234"], 40, 3, 2); },
  brown_terracotta(P) { patches(P, ["#4d3324", "#462f21", "#553828"], 40, 3, 2); },
  light_gray_terracotta(P) { patches(P, ["#876b62", "#7f645b", "#8f7269"], 40, 3, 2); },
  cactus_top(P) { P.fill(["#5a8a2a"]); P.rect(1, 1, 14, 14, "#6a9a34"); P.rect(4, 4, 8, 8, "#7aaa40"); },
  cactus_side(P) { P.fill(["#4f7e24", "#558a28"]); for (let x = 2; x < 16; x += 4) { P.rect(x, 0, 1, 16, "#3a6218"); for (let y = 2; y < 16; y += 5) P.px(x - 1, y, "#e8e0b8"); } },
  dead_bush(P) { for (const [x0, y0, dx] of [[8, 15, 0], [8, 10, -1], [8, 9, 1], [6, 7, -1], [10, 6, 1]]) for (let k = 0; k < 5; k++) P.px(Math.max(0, Math.min(15, x0 + dx * k)), Math.max(0, y0 - k), "#8a5a2a"); },
  mycelium_top(P) { patches(P, ["#6f6265", "#675a5d", "#7a6c70", "#5e5154"], 55, 3, 2); P.specks(8, ["#9a8ea0", "#8a7c8a"]); },
  mycelium_side(P) { PAINT.dirt(P); for (let x = 0; x < 16; x++) { const h = 2 + ((x * 7) % 3); P.rect(x, 0, 1, h, x % 2 ? "#6f6265" : "#7a6c70"); } },
  brown_mushroom(P) { P.rect(7, 10, 2, 5, "#e0d4c0"); P.rect(4, 7, 8, 3, "#a07050"); P.rect(5, 6, 6, 1, "#b08060"); },
  red_mushroom(P) { P.rect(7, 10, 2, 5, "#e0d4c0"); P.rect(4, 5, 8, 5, "#d83a2a"); P.rect(5, 4, 6, 1, "#e84a3a"); P.px(6, 6, "#ffffff"); P.px(9, 7, "#ffffff"); },
  brown_mushroom_block(P) { patches(P, ["#957051", "#8a674b", "#9f7a59"], 40, 3, 2); },
  red_mushroom_block(P) { P.fill(["#c8302a", "#be2c26", "#d23630"]); for (const [x, y, s] of [[2, 2, 3], [9, 3, 2], [5, 9, 3], [12, 11, 2]]) P.rect(x, y, s, s, "#f0ece0"); },
  mushroom_stem(P) { P.fill(["#e0d8c8", "#d8d0c0", "#e8e0d0"]); for (let x = 1; x < 16; x += 3) P.rect(x, 0, 1, 16, "#cfc4b0"); },
  moss_block(P) { patches(P, ["#596e2d", "#52672a", "#637a33", "#4a5e25"], 55, 3, 3); },
  azalea_top(P) { foliage(P, ["#6a8e2e", "#5e8228", "#76a034", "#527622"]); },
  azalea_side(P) { foliage(P, ["#6a8e2e", "#5e8228", "#76a034", "#527622"]); P.rect(6, 10, 4, 6, "#6a4e2e"); P.rect(7, 10, 2, 6, "#7e603a"); },
  flowering_azalea_top(P) { PAINT.azalea_top(P); for (const [x, y] of [[3, 3], [10, 2], [6, 7], [12, 10], [3, 12], [9, 13]]) { P.rect(x, y, 2, 2, "#d870c8"); P.px(x, y, "#f4a8e8"); } },
  flowering_azalea_side(P) { PAINT.azalea_side(P); for (const [x, y] of [[2, 2], [11, 3], [5, 6]]) { P.rect(x, y, 2, 2, "#d870c8"); P.px(x, y, "#f4a8e8"); } },
  azalea_leaves(P) { foliage(P, ["#6a8e2e", "#5e8228", "#76a034", "#527622", "#80aa3c"]); },
  cave_vines(P) { for (let y = 0; y < 16; y++) { const x = 7 + Math.round(Math.sin(y * 0.7) * 2); P.rect(x, y, 2, 1, y % 3 ? "#4a7a22" : "#5e9230"); } P.rect(4, 5, 3, 2, "#4a7a22"); P.rect(10, 11, 3, 2, "#4a7a22"); },
  cave_vines_berries(P) { PAINT.cave_vines(P); for (const [x, y] of [[4, 7], [10, 3], [6, 12], [11, 13]]) { P.rect(x, y, 3, 3, "#f0a020"); P.px(x, y, "#fff0a0"); } },
  spore_blossom(P) { for (let y = 0; y < 4; y++) P.rect(7, y, 2, 1, "#4a7a22"); for (const [x, y] of [[2, 4], [11, 4], [4, 8], [10, 9], [6, 6], [8, 11]]) { P.rect(x, y, 3, 3, "#e870b0"); P.px(x + 1, y + 1, "#f8b0d8"); } P.rect(6, 4, 4, 3, "#7aaa3a"); },
  pointed_dripstone(P) { for (let y = 0; y < 16; y++) { const w = Math.max(1, Math.round((16 - y) / 3)); P.rect(8 - w, y, w * 2, 1, y % 3 ? "#7a6a5a" : "#8a7a68"); P.px(8 - w, y, "#5e5044"); } },
  pink_petals(P) { for (const [x, y] of [[2, 3], [7, 2], [11, 5], [4, 9], [9, 10], [13, 12], [2, 13], [6, 6]]) { P.rect(x, y, 2, 2, "#f4a8cc"); P.px(x, y, "#fcd0e4"); } }
});
PAINT.mangrove_roots = P => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const a = (x + y) % 5 < 2, b = (x - y + 16) % 6 < 2; if (a || b) P.px(x, y, (x * 3 + y) % 4 ? "#4a3a2a" : "#5a4834"); } };
// ----- Milestone 17, Part A: the ocean floor's pictures -----
const tone = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * k))); return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, "0")).join(""); };
Object.assign(PAINT, {
  kelp(P) { for (let y = 0; y < 16; y++) { const x = 7 + Math.round(Math.sin(y * 0.55) * 1.5); P.rect(x, y, 2, 1, y % 4 ? "#3f6e1c" : "#4c8022"); }
    for (const [x, y, d] of [[3, 2, 1], [10, 6, -1], [4, 10, 1], [10, 13, -1]]) for (let i = 0; i < 4; i++) P.px(x + d * i, y - (i >> 1), i === 0 ? "#5f9a2c" : "#4c8022"); },
  seagrass(P) { for (const [x, h, c] of [[3, 11, "#3c8a2a"], [6, 15, "#47a032"], [9, 13, "#3c8a2a"], [12, 9, "#52aa3a"], [8, 7, "#47a032"]]) for (let y = 16 - h; y < 16; y++) P.px(x + Math.round(Math.sin((y + x) * 0.5) * 0.8), y, c); },
  sea_pickle(P) { P.fill(["#5a8a2a", "#628f30", "#548228"]); for (let y = 0; y < 16; y += 3) P.rect(0, y, 16, 1, "#4a7420"); P.specks(6, ["#7ab040", "#86c048"]); P.rect(6, 0, 4, 2, "#c8f070"); },
  sponge(P) { patches(P, ["#cdbb46", "#c4b23e", "#d6c450", "#bba838"], 40, 2, 2); for (let i = 0; i < 14; i++) { const x = Math.floor(P.r() * 15), y = Math.floor(P.r() * 15); P.rect(x, y, 2, 2, "#9c8a2a"); P.px(x, y, "#7e6e1e"); } },
  wet_sponge(P) { patches(P, ["#a8a034", "#9e962e", "#b2aa3c", "#94882a"], 40, 2, 2); for (let i = 0; i < 14; i++) { const x = Math.floor(P.r() * 15), y = Math.floor(P.r() * 15); P.rect(x, y, 2, 2, "#6e6a24"); P.px(x, y + 1, "#5a8ab0"); } },
  dried_kelp_top(P) { P.fill(["#3e4a24", "#424e26", "#3a4520"]); for (let r = 2; r < 8; r += 2) for (let a = 0; a < 24; a++) P.px(Math.round(7.5 + Math.cos(a / 24 * 6.28) * r), Math.round(7.5 + Math.sin(a / 24 * 6.28) * r), "#2e3818"); },
  dried_kelp_side(P) { P.fill(["#3e4a24", "#424e26", "#3a4520"]); for (let x = 1; x < 16; x += 3) P.rect(x, 0, 1, 16, "#2e3818"); P.rect(0, 3, 16, 1, "#565e30"); P.rect(0, 12, 16, 1, "#565e30"); },
  prismarine(P) { patches(P, ["#63a594", "#5a9c8c", "#6cae9c", "#56a0a0", "#4e9284", "#76b4a8"], 60, 3, 3); },
  prismarine_bricks(P) { P.fill(["#63ab9c", "#5ea494", "#6ab4a4"]); for (const y of [0, 8]) P.rect(0, y, 16, 1, "#3e7e70"); for (const [x, y] of [[0, 0], [8, 0], [4, 8], [12, 8]]) P.rect(x, y, 1, 8, "#3e7e70"); P.specks(10, ["#8ad0c0", "#4e9484"]); },
  dark_prismarine(P) { P.fill(["#335a4c", "#2e5446", "#386052"]); P.rect(0, 0, 16, 1, "#1e3a30"); P.rect(0, 15, 16, 1, "#1e3a30"); P.rect(0, 0, 1, 16, "#1e3a30"); P.rect(15, 0, 1, 16, "#1e3a30"); for (const x of [5, 10]) P.rect(x, 1, 1, 14, "#264a3e"); P.specks(8, ["#4a7a68"]); },
  sea_lantern(P) { P.fill(["#d8ece4", "#cfe6de", "#e4f4ee"]); for (const [x, y] of [[0, 0], [8, 0], [0, 8], [8, 8]]) { P.rect(x + 1, y + 1, 6, 6, "#f4fffa"); P.rect(x + 3, y + 3, 2, 2, "#a8d4c8"); } P.rect(0, 7, 16, 2, "#8ab8ac"); P.rect(7, 0, 2, 16, "#8ab8ac"); },
  blue_ice(P) { P.fill(["#74a8f0", "#6c9ee8", "#7cb0f6"]); for (const [x, y, w] of [[2, 3, 5], [9, 6, 4], [4, 11, 6], [11, 12, 3]]) P.rect(x, y, w, 1, "#b4d4ff"); for (const [x, y] of [[6, 8], [12, 2], [3, 6]]) P.px(x, y, "#5482c8"); },
  dead_coral(P) { PAINT._coralPlant(P, "#8a8580", 0); },
  dead_coral_fan(P) { PAINT._coralFan(P, "#8a8580"); },
  _coralPlant(P, c, kind) {   // five different growth shapes: tubes, a brain-like clump, bubbles, flames, antlers
    const lo = tone(c, 0.7), hi = tone(c, 1.25);
    if (kind === 0) for (const [x, h] of [[3, 9], [6, 13], [9, 11], [12, 8]]) { P.rect(x, 16 - h, 2, h, c); P.rect(x, 16 - h, 2, 1, hi); P.px(x + 1, 16 - h + 2, lo); }
    else if (kind === 1) { for (let y = 6; y < 16; y++) for (let x = 2; x < 14; x++) if (Math.hypot(x - 7.5, (y - 11) * 1.3) < 6) P.px(x, y, (x + y * 2) % 4 ? c : lo); }
    else if (kind === 2) for (const [x, y, r] of [[5, 6, 2], [10, 5, 2], [7, 10, 2], [11, 11, 1], [4, 12, 1]]) { P.rect(x - r, y - r, r * 2 + 1, r * 2 + 1, c); P.px(x - r + 1, y - r + 1, hi); P.rect(x, y + r, 1, 16 - y - r, lo); }
    else if (kind === 3) for (const x0 of [4, 8, 12]) for (let y = 3; y < 16; y++) { const x = x0 + Math.round(Math.sin(y * 0.9 + x0) * 1.2); P.px(x, y, y < 6 ? hi : c); if (y > 9) P.px(x - 1, y, lo); }
    else { for (let y = 4; y < 16; y++) P.rect(7, y, 2, 1, c); for (const [x, y, d] of [[6, 8, -1], [9, 6, 1], [6, 11, -1], [9, 10, 1]]) for (let i = 0; i < 4; i++) P.px(x + d * i, y - i, i === 3 ? hi : c); }
  },
  _coralFan(P, c) { const lo = tone(c, 0.72), hi = tone(c, 1.25); for (let y = 2; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x - 7.5, dy = 15 - y, a = Math.atan2(dx, dy); if (Math.hypot(dx, dy) < 12.5 && Math.abs(a) < 1.05) P.px(x, y, (Math.round(a * 9) % 2) ? c : (y < 6 ? hi : lo)); } P.rect(7, 12, 2, 4, lo); }
});
PAINT.lightning_rod = P => { P.fill(["#c9ccd1", "#b7bbc2", "#d8dbe0"]); P.rect(0, 0, 16, 2, "#eef0f3"); P.rect(0, 14, 16, 2, "#8c9098"); };   // Milestone 19, Part B: a polished iron rod
PAINT.turtle_egg = P => { P.fill(["#f2ecd2", "#ece4c6", "#f6f0dc"]); P.specks(14, ["#8fb878", "#7aa864"], 2); };   // Milestone 17, Part D
PAINT.conduit = P => {   // a shell-like cage around a glowing heart
  P.fill(["#7a6a50", "#86765a", "#6e5e46"]); for (let i = 0; i < 16; i += 4) { P.rect(i, 0, 1, 16, "#a89270"); P.rect(0, i, 16, 1, "#a89270"); }
  P.rect(5, 5, 6, 6, "#2a8aa8"); P.rect(6, 6, 4, 4, "#6ae0f0"); P.rect(7, 7, 2, 2, "#ffffff");
};
CORALS.forEach(([K, , c], i) => {
  const k = K.toLowerCase();
  PAINT[k + "_coral_block"] = P => { patches(P, [c, tone(c, 0.88), tone(c, 1.12), tone(c, 0.8)], 45, 2, 2); for (let n = 0; n < 12; n++) P.px(Math.floor(P.r() * 16), Math.floor(P.r() * 16), tone(c, 0.6)); };
  PAINT["dead_" + k + "_coral_block"] = P => { const g = ["#8a8580", "#827d78", "#938e89", "#7a7570"][i % 4]; patches(P, [g, tone(g, 0.9), tone(g, 1.08)], 45, 2, 2); for (let n = 0; n < 12; n++) P.px(Math.floor(P.r() * 16), Math.floor(P.r() * 16), tone(g, 0.7)); };
  PAINT[k + "_coral"] = P => PAINT._coralPlant(P, c, i);
  PAINT[k + "_coral_fan"] = P => PAINT._coralFan(P, c);
});
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
  fs_bone(P) { for (let i = 0; i < 9; i++) { P.px(4 + i, 11 - i, "#c8c0a8"); P.px(5 + i, 11 - i, "#a8a08a"); } for (const [x, y] of [[3, 11], [4, 12], [3, 12], [12, 3], [13, 4], [13, 3]]) P.px(x, y, "#d8d2bc"); P.px(8, 7, "#d8ecff"); P.px(9, 6, "#d8ecff"); },
  fs_limb(P) { for (let i = 0; i < 12; i++) { const x = 3 + Math.round(Math.sin(i / 11 * Math.PI) * 3), y = 2 + i; P.px(x, y, "#3a2a24"); P.px(x + 1, y, "#5a4232"); } P.rect(3, 1, 2, 2, "#d8d2bc"); P.rect(3, 13, 2, 2, "#d8d2bc"); for (let y = 3; y < 13; y++) P.px(10, y, "#d8ecff"); },
  fs_silk(P) { for (let i = 0; i < 4; i++) for (let t = 0; t < 12; t++) P.px(2 + t, 3 + i * 3 + Math.round(Math.sin(t * 0.7 + i) * 1), i % 2 ? "#f0f0f8" : "#d8d8e4"); P.px(7, 6, "#ff3040"); P.px(10, 10, "#ff3040"); },
  fs_fang(P) { for (let y = 2; y < 14; y++) { const w = Math.max(0, Math.floor((14 - y) / 3)); for (let x = 7 - w; x <= 7 + w - (y > 10 ? 1 : 0); x++) P.px(x + Math.floor((y - 2) / 4), y, y < 6 ? "#2a2a30" : "#e4dccb"); } P.px(9, 12, "#ff3040"); P.px(10, 13, "#ff3040"); },
  fs_mutagen(P) { P.rect(6, 2, 4, 2, "#5a4a3a"); P.rect(7, 4, 2, 2, "#c8d8c8"); for (let y = 6; y < 14; y++) for (let x = 4; x < 12; x++) if ((x - 7.5) ** 2 + (y - 9.5) ** 2 < 15) P.px(x, y, y < 8 ? "#c8d8c8" : (x + y) % 3 ? "#8aff3a" : "#c8ff8a"); P.px(6, 9, "#f0ffd0"); },
  fs_blastcore(P) { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) { const d = (x - 7.5) ** 2 + (y - 7.5) ** 2; if (d < 30) P.px(x, y, d < 9 ? "#c8ff6a" : d < 16 ? "#6ab83a" : (x * y) % 3 ? "#1c1f1a" : "#2e3a26"); } P.px(7, 7, "#ffffff"); },
  fs_pearl(P) { for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) { const d = (x - 7.5) ** 2 + (y - 7.5) ** 2; if (d < 24) P.px(x, y, d < 6 ? "#e0a0ff" : d < 14 ? "#9a40e0" : "#4a1a70"); } P.px(6, 6, "#ffffff"); },
  fs_essence(P) { for (let i = 0; i < 12; i++) { const y = 13 - i, x = 7 + Math.round(Math.sin(i * 0.8) * 2.5); P.px(x, y, i % 3 ? "#c060ff" : "#e8c0ff"); P.px(x + 1, y, "#7a30c0"); } P.px(5, 4, "#e8c0ff"); P.px(11, 7, "#e8c0ff"); },
  fs_shard(P) { for (let y = 2; y < 14; y++) { const w = y < 7 ? (y - 1) >> 1 : (14 - y) >> 1; for (let x = 8 - w; x <= 8 + w; x++) P.px(x, y, x < 8 ? "#2a3a22" : "#3c5a2c"); } P.rect(8, 3, 1, 9, "#a8ff5a"); P.rect(7, 6, 1, 2, "#d8ffb0"); P.px(9, 9, "#a8ff5a"); },
  fs_trophy(P, c) { P.rect(3, 3, 10, 9, c[0]); P.rect(3, 3, 10, 2, "#3e6326"); P.rect(4, 6, 3, 2, c[1]); P.rect(9, 6, 3, 2, c[1]); P.rect(5, 10, 6, 1, "#1c2a14"); P.rect(7, 4, 1, 4, c[2]); P.rect(2, 12, 12, 2, "#4a3a2a"); P.rect(3, 14, 10, 1, "#2a2018"); },
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
  seeds(P, c) { c = c && c.length === 2 ? c : ["#5a9a2a", "#3a7a1a"]; for (const [x, y] of [[4, 6], [8, 4], [11, 8], [6, 10], [9, 12], [3, 12]]) { P.px(x, y, c[0]); P.px(x + 1, y, c[1]); } },
  wheat(P) { for (let i = 0; i < 4; i++) { const x = 4 + i * 2; P.rect(x, 7, 1, 8, "#8a7a2a"); P.rect(x - 1, 2, 3, 6, i % 2 ? "#e0c060" : "#c9a640"); } },
  bread(P) { for (let y = 6; y < 12; y++) for (let x = 2; x < 14; x++) if ((x - 8) ** 2 / 36 + (y - 9) ** 2 / 9 < 1) P.px(x, y, y < 8 ? "#d8a050" : "#b07830"); P.rect(5, 7, 1, 2, "#8a5a20"); P.rect(8, 7, 1, 2, "#8a5a20"); P.rect(11, 7, 1, 2, "#8a5a20"); },
  carrot(P, c) { const g = c && c[0] === "gold"; for (let i = 0; i < 9; i++) { P.px(4 + i, 12 - i, g ? "#ffd84a" : "#f08a1a"); P.px(5 + i, 12 - i, g ? "#c89a14" : "#d86a10"); } P.rect(12, 1, 2, 3, "#4f9a33"); P.rect(13, 3, 2, 1, "#6bb544"); },
  meat(P, c) { for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) if ((x - 8) ** 2 / 25 + (y - 8.5) ** 2 / 18 < 1) P.px(x, y, c[0]); P.rect(10, 9, 3, 2, c[1]); P.rect(12, 10, 2, 3, c[1]); },
  eye(P, c) { const f = c && c[0] === "ferment"; for (let y = 5; y < 12; y++) for (let x = 4; x < 12; x++) if ((x - 8) ** 2 + (y - 8.5) ** 2 < 12) P.px(x, y, f ? ((x + y) % 3 ? "#7a3a4a" : "#a0604a") : "#b02030"); P.rect(7, 7, 2, 2, f ? "#3a1a2a" : "#1a1a1a"); },
  ostrich_egg(P) {
    for (let y = 1; y < 15; y++) for (let x = 2; x < 14; x++) {
      const shell = (x - 7.5) ** 2 / (y < 8 ? 25 : 32) + (y - 7.7) ** 2 / 48;
      if (shell >= 1) continue;
      P.px(x, y, shell > 0.72 && (x > 8 || y > 10) ? "#b6a17c" :
        x < 7 && y < 8 ? "#fff3d4" : (x * 3 + y * 5) % 11 === 0 ? "#c8b293" : "#e5d4ad");
    }
  },
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
  hammer(P, c) { for (let i = 0; i < 10; i++) { P.px(2 + i, 13 - i, c[1] || "#2a2e36"); P.px(3 + i, 13 - i, c[1] || "#2a2e36"); } for (let y = 1; y < 7; y++) for (let x = 8; x < 15; x++) P.px(x, y, (x + y) % 5 ? (c[0] || "#b87333") : "#5ae0d0"); },
  rod(P) { for (let i = 0; i < 11; i++) { P.px(3 + i, 13 - i, "#ffb030"); P.px(4 + i, 13 - i, "#fff07a"); } },
  tear(P) { for (let y = 3; y < 14; y++) { const w = y < 8 ? (y - 3) / 2 : 3 - (y - 8) * 0.4; for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) P.px(x, y, x < 8 ? "#d8f4ff" : "#a8d8f0"); } },
  wart(P) { for (const [x, y] of [[5, 6], [9, 5], [7, 9]]) { P.rect(x, y, 3, 3, "#a01e1e"); P.px(x, y, "#d83a3a"); } },
  scrap(P) { blob(P, ["#4a3a34", "#56443c", "#3e302a"]); P.rect(6, 6, 4, 1, "#7a6a60"); },
  eye_void(P) { for (let y = 3; y < 14; y++) for (let x = 3; x < 14; x++) if ((x - 8.5) ** 2 + (y - 8.5) ** 2 < 25) P.px(x, y, x + y < 15 ? "#5af0c0" : "#2a9a7a"); P.rect(7, 5, 3, 7, "#0a2a22"); P.rect(6, 7, 1, 3, "#0a2a22"); P.rect(10, 7, 1, 3, "#0a2a22"); },
  shell(P) { for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) if ((x - 8) ** 2 / 36 + (y - 8.5) ** 2 / 30 < 1) P.px(x, y, y < 8 ? "#b088c0" : "#9a6aa8"); P.rect(2, 8, 12, 1, "#5a3a68"); },
  chorus(P) { for (let y = 4; y < 13; y++) for (let x = 4; x < 13; x++) if ((x - 8.5) ** 2 + (y - 8.5) ** 2 < 18) P.px(x, y, P.pick(["#9a6aa8", "#b088c0", "#7a5a8a"])); P.rect(8, 2, 1, 3, "#5a3a68"); },
  scale(P) { for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) if ((x - 8) ** 2 + (y - 8.5) ** 2 < 20) P.px(x, y, (x + y) % 3 ? "#2a1a3a" : "#5a2a7a"); },
  glider(P) { for (let x = 1; x < 15; x++) { const h = Math.round(6 - Math.abs(x - 7.5) * 0.6); for (let y = 4; y < 4 + h + 4; y++) if (Math.abs(x - 7.5) > 1) P.px(x, y + Math.abs(x - 7.5) * 0.3, y === 4 ? "#9a8aa8" : "#6a5a7a"); } P.rect(7, 4, 2, 8, "#4a3a5a"); },
  lead(P) { const pts = [[2, 13], [3, 11], [5, 10], [7, 10], [9, 9], [10, 7], [10, 5], [9, 3], [7, 2], [5, 3], [4, 5], [5, 7], [7, 8], [9, 8], [11, 9], [13, 11], [14, 13]]; for (const [x, y] of pts) { P.rect(x, y, 2, 2, "#8a6a3a"); P.px(x, y, "#b89060"); } P.rect(12, 12, 3, 3, "#5aa830"); },
  // Milestone 15: enchanting
  lapis(P) { for (let y = 3; y < 13; y++) { const w = y < 8 ? y - 2 : 13 - y; for (let x = 8 - w; x <= 7 + w; x++) P.px(x, y, x < 7 ? "#2a5ccc" : x > 9 ? "#163a86" : "#1f4fb4"); } P.rect(6, 5, 2, 2, "#8ab4ff"); P.px(10, 9, "#5a8cf0"); },
  paper(P) { P.rect(3, 2, 10, 12, "#f4f0e4"); P.rect(3, 2, 10, 1, "#ffffff"); P.rect(12, 2, 1, 12, "#d8d2c0"); P.rect(3, 13, 10, 1, "#c8c2b0"); for (const y of [5, 7, 9, 11]) P.rect(5, y, 6, 1, "#c4c8d8"); },
  book(P, c) { c = c && c.length === 3 ? c : ["#8a4a2a", "#5e3018", "#e8e0c8"]; P.rect(3, 2, 10, 12, c[0]); P.rect(3, 2, 2, 12, c[1]); P.rect(12, 3, 1, 10, c[2]); P.rect(5, 13, 8, 1, c[2]); P.rect(7, 5, 4, 1, "#d8a830"); P.rect(7, 7, 4, 1, "#d8a830"); },
  ench_book(P) { ICON_PAINT.book(P, ["#6a2aa8", "#3e1470", "#f0e8d0"]); P.rect(7, 5, 4, 3, "#e8c040"); P.px(8, 6, "#fff4b0"); P.px(4, 4, "#d8b0ff"); P.px(11, 10, "#d8b0ff"); },
  anvil(P) { P.rect(1, 3, 14, 4, "#56565a"); P.rect(1, 3, 14, 1, "#76767c"); P.rect(0, 4, 2, 2, "#48484c"); P.rect(5, 7, 6, 4, "#444448"); P.rect(3, 11, 10, 3, "#4a4a4e"); P.rect(3, 13, 10, 1, "#2e2e32"); },
  grindstone(P) { P.rect(2, 9, 2, 6, "#7a5530"); P.rect(12, 9, 2, 6, "#7a5530"); for (let y = 1; y < 14; y++) for (let x = 3; x < 13; x++) { const d = (x - 7.5) ** 2 + (y - 7.5) ** 2; if (d < 26) P.px(x, y, d > 18 ? "#6a6a68" : "#9a9a98"); } P.rect(7, 7, 2, 2, "#5a3d20"); P.rect(2, 6, 12, 2, "#a07a48"); },
  // Milestone 16: brewing
  melon_slice(P, c) { const gold = c && c[0] === "gold"; for (let y = 4; y < 14; y++) for (let x = 2; x < 14; x++) { const d = (x - 8) ** 2 + (y - 14) ** 2; if (d < 64 && y < 13) P.px(x, y, d > 50 ? (gold ? "#f0c020" : "#5a9a2a") : d > 42 ? (gold ? "#fff2a0" : "#e8f0c0") : (gold ? "#ffd84a" : "#e8403a")); } for (const [x, y] of [[6, 9], [9, 8], [11, 10], [5, 11]]) P.px(x, y, "#2a1a10"); },
  tipped_arrow(P, c) { ICON_PAINT.arrow(P); P.rect(11, 2, 3, 3, c && c[0] || "#8a8a8a"); P.rect(6, 7, 3, 3, c && c[0] || "#8a6235"); P.px(12, 3, "#ffffff"); },
  rabbit_foot(P) { P.rect(6, 3, 4, 7, "#c8a878"); P.rect(5, 9, 6, 4, "#d8bc90"); P.rect(4, 12, 3, 2, "#e8d4b0"); P.rect(9, 12, 3, 2, "#e8d4b0"); P.rect(6, 2, 4, 2, "#8a6a4a"); },
  membrane(P) { for (let y = 3; y < 13; y++) for (let x = 2; x < 14; x++) if (Math.abs(x - 8) + Math.abs(y - 8) * 0.8 < 7) P.px(x, y, (x + y) % 3 ? "#d8d8c8" : "#b8c8a8"); P.rect(3, 7, 10, 1, "#9aa88a"); },
  potion(P) { P.rect(6, 1, 4, 2, "#8a6235"); P.rect(6, 3, 4, 3, "#c8dce8"); for (let y = 6; y < 15; y++) for (let x = 2; x < 14; x++) { const d = (x - 7.5) ** 2 + (y - 10.5) ** 2; if (d < 24) P.px(x, y, d > 17 ? "#8aa4b8" : y > 8 ? "#385dc6" : "#c8dce8"); } },
  brewing_stand(P) { P.rect(7, 1, 2, 12, "#e8b830"); P.rect(1, 13, 14, 2, "#7a7a78"); for (const x of [2, 11]) { P.rect(x, 8, 3, 5, "#c8dce8"); P.rect(x, 10, 3, 3, "#385dc6"); } },
  cauldron(P) { P.rect(2, 3, 12, 10, "#3c3c40"); P.rect(2, 3, 12, 2, "#56565c"); P.rect(4, 4, 8, 1, "#232327"); P.rect(2, 13, 3, 2, "#2a2a2e"); P.rect(11, 13, 3, 2, "#2a2a2e"); },
  // Milestone 20, Part C
  bamboo(P) { for (let y = 1; y < 15; y++) { P.rect(7, y, 2, 1, y % 4 === 0 ? "#4a7a1e" : "#6aa832"); } P.rect(9, 3, 3, 1, "#6aa832"); P.rect(4, 8, 3, 1, "#6aa832"); },
  glow_berries(P) { for (const [x, y] of [[4, 5], [9, 4], [6, 9], [10, 10]]) { P.rect(x, y, 3, 3, "#f0a020"); P.px(x, y, "#fff0a0"); } P.rect(7, 1, 2, 4, "#4a7a22"); },
  cocoa_beans(P) { for (const [x, y] of [[4, 6], [8, 5], [6, 9], [10, 9]]) { P.rect(x, y, 3, 2, "#6a3814"); P.px(x, y, "#8a4a1e"); } },
  cookie(P) { for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 24) P.px(x, y, "#d8a050"); for (const [x, y] of [[5, 5], [9, 6], [6, 9], [10, 10], [8, 8]]) P.px(x, y, "#5a3010"); },
  bowl(P, c) { const stew = c && c[0] === "stew"; P.rect(2, 7, 12, 2, stew ? "#c09060" : "#7a5530"); for (let y = 9; y < 13; y++) P.rect(2 + (y - 9), y, 12 - 2 * (y - 9), 1, y === 12 ? "#5a3d20" : "#8a6235"); if (stew) { P.rect(3, 6, 10, 2, "#b08048"); P.px(5, 6, "#d8c0a0"); P.px(9, 6, "#7a5030"); } },
  nametag(P) { P.rect(4, 3, 9, 11, "#e8dcc0"); P.rect(4, 3, 9, 1, "#c8b890"); P.rect(4, 13, 9, 1, "#b8a880"); P.rect(5, 1, 7, 2, "#e8dcc0"); P.rect(7, 2, 3, 2, "#6a5a3a"); for (const y of [6, 8, 10]) P.rect(6, y, 5, 1, "#8a7a5a"); P.rect(2, 1, 4, 1, "#9a9a9a"); P.rect(2, 1, 1, 4, "#9a9a9a"); },
  horse_armor(P, c) { const a = (c && c[0]) || "#dcdcdc", b = (c && c[1]) || "#a8a8a8"; P.rect(2, 6, 12, 6, a); P.rect(2, 11, 12, 1, b); P.rect(10, 2, 4, 6, a); P.rect(13, 3, 1, 4, b); P.rect(3, 12, 2, 3, b); P.rect(11, 12, 2, 3, b); P.rect(4, 7, 5, 1, "#ffffff"); },
  void_crystal(P) { for (let y = 1; y < 15; y++) { const w = 7 - Math.abs(y - 8); for (let x = 8 - w; x < 8 + w; x++) P.px(x, y, (x + y) % 3 ? "#d8b8f8" : "#f4e8ff"); } P.rect(6, 6, 4, 4, "#8a3ad0"); P.rect(7, 7, 2, 2, "#f070ff"); for (const [x, y] of [[8, 1], [8, 14], [1, 8], [14, 8]]) P.px(x, y, "#ffffff"); },
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

// Milestone 17, Part A
Object.assign(ICON_PAINT, {
  dried_kelp(P) { for (let y = 2; y < 15; y++) { const x = 6 + Math.round(Math.sin(y * 0.6) * 1.5); P.rect(x, y, 4, 1, y % 3 ? "#3e4a24" : "#4e5a2e"); } P.px(7, 3, "#68743c"); },
  prismarine_shard(P) { for (const [x, y, w] of [[7, 2, 2], [6, 4, 4], [5, 6, 5], [5, 8, 5], [6, 10, 4], [7, 12, 2]]) P.rect(x, y, w, 2, "#5ea898"); P.rect(6, 5, 1, 6, "#8ad4c4"); P.rect(9, 7, 1, 5, "#3e7e70"); },
  trident(P) { for (let i = 0; i < 11; i++) P.rect(3 + i, 12 - i, 1, 1, "#3aa0a0"); P.rect(10, 2, 1, 5, "#7ad8d0"); P.rect(12, 4, 3, 1, "#7ad8d0"); P.rect(11, 1, 3, 3, "#5ac0b8"); P.px(14, 1, "#bff8f0"); P.px(10, 1, "#bff8f0"); P.px(14, 5, "#bff8f0"); P.rect(2, 12, 2, 2, "#2a7070"); },
  scute(P) { for (let y = 4; y < 13; y++) { const w = 6 - Math.abs(y - 8); P.rect(8 - w, y, w * 2, 1, y < 7 ? "#6ab84a" : "#4a9a38"); } P.rect(7, 5, 2, 7, "#3a7a2a"); },
  fish_bucket(P, c) { ICON_PAINT.bucket(P, [c[0]]); for (let y = 6; y < 10; y++) for (let x = 5; x < 11; x++) if ((x - 8) ** 2 / 6 + (y - 8) ** 2 / 2 < 1) P.px(x, y, c[1]); P.px(10, 7, c[1]); P.px(10, 9, c[1]); P.px(6, 7, "#1a1a1a"); },
  heart_sea(P) { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 5.8) P.px(x, y, d < 2 ? "#e8fbff" : d < 3.6 ? "#5ad0f0" : "#1e6ab0"); } P.px(5, 5, "#ffffff"); for (const [x, y] of [[1, 7], [14, 8], [7, 1], [8, 14]]) P.px(x, y, "#3aa0d8"); },
  nautilus(P) { for (let a = 0; a < 60; a++) { const t = a / 60 * 12, r = 1 + t * 0.55, x = 8 + Math.cos(t) * r, y = 8 + Math.sin(t) * r; P.rect(Math.round(x), Math.round(y), 2, 2, a % 6 < 3 ? "#e8d8c0" : "#c06a40"); } },
  treasure_map(P) { P.rect(2, 2, 12, 12, "#e6d2a0"); P.rect(2, 2, 12, 1, "#c0a870"); P.rect(2, 13, 12, 1, "#c0a870"); P.rect(3, 4, 5, 4, "#7cb8d8"); P.rect(8, 7, 4, 5, "#9cc070"); for (let i = 0; i < 4; i++) { P.px(9 + i, 8 + i, "#c02020"); P.px(12 - i, 8 + i, "#c02020"); } P.px(5, 10, "#8a6a40"); P.px(6, 11, "#8a6a40"); P.px(7, 10, "#8a6a40"); },
  prismarine_crystals(P) { for (const [x, y] of [[3, 4], [9, 2], [6, 9], [11, 9], [3, 11]]) { P.rect(x, y, 3, 3, "#bfe8dc"); P.px(x + 1, y + 1, "#ffffff"); P.px(x + 2, y + 2, "#7cbcae"); } }
});
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
  if (d.leviathanSet && d.armor) { drawLeviathanArmor(ctx, d.leviathanSet, d.armor.slot); return; }
  const legendary = id === I.FANGBLADE ? "fang" : id === I.INFERNO_GREATBLADE ? "inferno" : id === I.BURIED_SCEPTER ? "scepter" : null;
  if (legendary) { drawLeviathanWeapon(ctx, legendary); return; }
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
