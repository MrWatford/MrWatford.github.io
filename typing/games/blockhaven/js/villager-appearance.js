// Existing trade IDs and authored visual roles (Gus's watchkeeper is not a trade).
const STANDARD_OUTFITS = {
  villager:     [0x526574, 0xc9b48c, 0x88714f, "cap", "tunic"],
  farmer:       [0x657545, 0xc6a75c, 0x695036, "straw", "apron", "hoe"],
  fletcher:     [0x53614a, 0xbb9864, 0x6c4730, "hood", "quiver", "arrow"],
  shepherd:     [0x7d5245, 0xc9ad84, 0x8c7b66, "fur", "cloak"],
  cleric:       [0x633c79, 0xd5ab5f, 0x89608e, "mitre", "robe"],
  smith:        [0x4b4b52, 0xbb8a5c, 0x553427, "smith", "apron", "hammer"],
  scribe:       [0x325a75, 0xd6b67d, 0xc7af85, "scribe", "robe", "book"],
  beekeeper:    [0x996944, 0xe4bd6f, 0xd4bb87, "veil", "apron"],
  wanderer:     [0x366277, 0xd2a95f, 0x91584a, "hood", "cloak"],
  butcher:      [0x78424a, 0xcda58c, 0xd6c3a4, "linen", "apron"],
  armorer:      [0x465b62, 0xb3a38b, 0x89949a, "iron", "armor", "hammer"],
  fisherman:    [0x356d77, 0xb7bc9e, 0x5d5141, "sailor", "tunic", "net"],
  mason:        [0x706455, 0xd3ba8d, 0xa69a88, "mason", "apron", "mallet"],
  leatherworker:[0x8a593b, 0xcf9b59, 0x63422b, "cap", "apron", "leather"]
};
const OUTFITS = {
  ...STANDARD_OUTFITS,
  librarian:    [0x794346, 0xccaa75, 0xc2a784, "scribe", "robe", "book"],
  mapmaker:     [0x3a647c, 0xd8ae66, 0xa28b6d, "cap", "robe", "map"],
  merchant:     [0x894c39, 0xd0ad63, 0x9b725b, "hood", "cloak"],
  guard:        [0x396369, 0xc2a276, 0x858f91, "iron", "armor"],
  miner:        [0x59514a, 0xae814e, 0x71513b, "smith", "apron"],
  baker:        [0x926345, 0xd3b48d, 0xd2c3a5, "linen", "apron"]
};

const SKINS = [
  [0xc68965, 0xb57052, 0xd69a74, 0x55372d],
  [0xb27354, 0x9c5d46, 0xc48b64, 0x48302a],
  [0x8d543d, 0x794535, 0xa5684c, 0x3d2924],
  [0xd39f7c, 0xbd8166, 0xe0ad89, 0x654537]
];
const BIOMES = {
  plains: "plains", grassland: "plains", meadow: "plains", savanna: "plains", prairie: "plains",
  forest: "forest", birch: "forest", birch_forest: "forest", dark_forest: "forest", jungle: "forest",
  swamp: "forest", cherry: "forest", cherry_grove: "forest", flower_forest: "forest", mangrove_swamp: "forest",
  snow: "snow", taiga: "snow", snowy_taiga: "snow", snowy_plains: "snow", ice_spikes: "snow", tundra: "snow",
  desert: "desert", sandy: "desert", badlands: "desert", beach: "desert",
  peak: "mountain", mountain: "mountain", mountains: "mountain", highland: "mountain", stony_peaks: "mountain", grove: "mountain"
};
const DISTRICTS = new Set(["artisan", "residential", "noble", "agricultural", "market", "civic",
  "waterfront", "entrance", "defensive"]);
const BIOME_CLOTH = { forest: 0x3d5436, snow: 0x8a4941, desert: 0xe5c789, mountain: 0x5d5b54 };
const STORY_OUTFITS = {
  librarian: "librarian", quill: "librarian", sandspireMapmaker: "mapmaker", seabreakChartmaker: "mapmaker",
  merchant: "merchant", kadir: "merchant", innkeeper: "merchant", baker: "baker", emberProvisioner: "baker",
  captain: "guard", captainB: "guard", guardB: "guard", orrin: "guard", brenna8: "guard",
  fisher: "fisherman", mira: "fisherman", fishmonger: "fisherman", smith2: "armorer", miner: "miner",
  dag: "miner", potter: "mason", oakwoodWoodworker: "leatherworker", shipwright: "leatherworker"
};
export const villagerRoles = Object.keys(STANDARD_OUTFITS);
export const villagerBiomes = ["plains", "forest", "snow", "desert", "mountain"];

export function villagerBiome(value) {
  return Object.hasOwn(BIOMES, value) ? BIOMES[value] : "plains";
}

export function villagerDistrict(value) {
  return DISTRICTS.has(value) ? value : undefined;
}

function stableHash(value) {
  let hash = 2166136261;
  for (const c of String(value)) hash = Math.imul(hash ^ c.codePointAt(0), 16777619);
  return (hash ^ hash >>> 16) >>> 0;
}

function mix(a, b, portion) {
  const shift = n => Math.round((a >> n & 255) * (1 - portion) + (b >> n & 255) * portion) << n;
  return shift(16) | shift(8) | shift(0);
}

export function villagerAppearance({ role, id = "", biome, district, npc }) {
  role = Object.hasOwn(STORY_OUTFITS, npc) ? STORY_OUTFITS[npc] : role;
  role = Object.hasOwn(OUTFITS, role) ? role : "villager";
  if (npc === "king" || npc === "elder") district ||= "civic";
  if (role === "guard") district ||= "defensive";
  biome = villagerBiome(biome);
  district = villagerDistrict(district);
  const seed = stableHash(npc ? "story-" + npc : id);
  const variation = seed % 3;
  const skinTone = (seed >>> 8) % SKINS.length;
  let [cloth, trim, apron, hat, style, tool] = OUTFITS[role];
  if (role === "villager") cloth = [cloth, 0x824f46, 0x626c51][variation];
  cloth = mix(cloth, [0xb6a98a, cloth, 0x292a26][variation], 0.22);
  const climateCloth = BIOME_CLOTH[biome];
  const weatherLayer = climateCloth ? mix(cloth, climateCloth, biome === "desert" ? .78 : .59) : cloth;
  if (climateCloth) cloth = mix(cloth, weatherLayer, .55);
  const formal = district === "noble" || district === "civic" || ["cleric", "scribe", "librarian", "mapmaker"].includes(role);
  if (formal) trim = mix(trim, 0xe4b765, 0.34);
  const green = role === "farmer" || biome === "forest" && variation === 0 && !formal;
  return {
    key: [role, biome, district || "", variation, skinTone].join("/"),
    role, biome, district, hat, style, tool, formal, green, variation,
    cloth, trim, apron, weatherLayer, skin: SKINS[skinTone],
    phase: (seed >>> 16) / 65536
  };
}
