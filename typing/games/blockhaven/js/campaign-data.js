// Blockhaven: The Legacy Campaign: the story, chapters, quests, places, and people (all original writing).
// Quests are data: each has steps the game checks automatically (js/campaign.js). A step's "ev" is the kind of
// event that moves it forward:
//   talk (npc)        right-click that person          visit (place)     walk into that place
//   walk (n)          walk n blocks                    break (ids, n)    break n of those blocks
//   panel (kind)      open that screen                 craft (ids)       craft one of those items
//   eat               eat anything                     kill (sp)         defeat that creature (any monster if no sp)
//   trade             trade with anyone                have (ids, n)     carry n of those items
//   places (list, n)  visit n of the listed places     flag (flag)       a story moment sets the flag
//   soon              coming in a future update (never completes)
import { B, I } from "./blocks.js";

export const CAMPAIGN_SEED = "the-forgotten-kingdoms";
export const CAMPAIGN_WORLD = "The Forgotten Kingdoms";

export const INTRO = {
  title: "The Forgotten Kingdoms",
  text: "Long ago, Blockhaven was shaped by the First Builders. They raised castles of stone, cities beneath the earth, and temples in the desert, the jungle, and the deep sea.\n\nTheir greatest discovery was a power buried far below the world. With it they opened doorways to other realms. But something ancient woke on the other side: the Forgotten King.\n\nTo seal him away, the First Builders poured their power into eight Relics and hid them across the kingdoms. Then their cities fell silent, and their story faded into legend.\n\nNow the seals are weakening. Strange things are happening across the land. And in Legacy Village, an old Elder has been waiting for someone brave enough to listen."
};

export const CHAPTERS = [
  { n: 1, title: "The Awakening", relic: "Relic of Earth", where: "Legacy Village, Stonehaven, the Desert Temple", blurb: "Learn the ways of the builder, then follow an ancient map into the desert." },
  { n: 2, title: "The Lost Jungle", relic: "Relic of Nature", where: "Oakwood and the Jungle Temple", blurb: "Inscriptions point to a forgotten civilization hidden under the jungle leaves." },
  { n: 3, title: "Secrets Beneath the Sea", relic: "Relic of the Tides", where: "Seabreak and the Sea Temple", blurb: "A kingdom lies drowned beneath the waves, and something huge stirs below it." },
  { n: 4, title: "The Curse of the Blightking", relic: "Relic of Decay", where: "Ironhold and its corrupted mines", blurb: "A spreading blight beneath Ironhold has a terrible source." },
  { n: 5, title: "Dragon of the Embers", relic: "Relic of Flame", where: "The Ember Depths and the Cinder Citadel", blurb: "The First Builders powered their portals with fire from the Ember Depths. Cindermaw guards what they left behind." },
  { n: 6, title: "The Shadow of Herobrine", relic: "Relic of Shadows", where: "The haunted lands and the Forsaken World", blurb: "Someone has been watching you all along. He knows what happened to the First Builders." },
  { n: 7, title: "The Ancient City", relic: "Relic of the Abyss", where: "Echohold, the First Gate, and the Echo Expanse", blurb: "Deep beneath the world lies the First Builders' last stronghold, and the First Warden still guards it." },
  { n: 8, title: "The End of the First Builders", relic: "Relic of the Void", where: "The Hollow, Skyreach, and the Ruined Capital", blurb: "The final Relic waits in the Hollow. After that, only the Forgotten King remains." }
];

// Places in Legacy Village (positions come from the village builder; these are the names and short descriptions)
export const PLACES = {
  plaza: { name: "Fountain Plaza", note: "The heart of Legacy Village." },
  market: { name: "Market Stalls", note: "Traders set up around the plaza." },
  castle: { name: "Castle Legacy", note: "The great stone castle north of the plaza." },
  castleGate: { name: "Castle Gate" },
  throne: { name: "Throne Room", note: "The Great Hall's empty throne." },
  vault: { name: "The King's Vault", note: "A secret room behind the Great Hall.", secret: true },
  library: { name: "Library", note: "Histories of Blockhaven and the First Builders." },
  archive: { name: "Forgotten Archive", note: "A hidden room under the library.", secret: true },
  smithy: { name: "Garrick's Forge", note: "The village blacksmith." },
  tower: { name: "Enchanting Tower", note: "A tall round tower with a view." },
  barn: { name: "Barn & Pen", note: "The village animals." },
  farm: { name: "Hollis Farm", note: "Wheat and carrot fields." },
  homes: { name: "Residential Lane", note: "Six cottages along the main road." },
  stable: { name: "Stable", note: "Trotters and riding gear." },
  dock: { name: "Fishing Dock", note: "The pond and the fisher's hut." },
  arena: { name: "Training Arena", note: "Where Captain Rowan trains adventurers." },
  mine: { name: "Old Mine", note: "Stairs down to the village's old mine." },
  mineDeep: { name: "Mine Tunnels", note: "The old mine's main chamber." },
  grove: { name: "Tutorial Grove", note: "Trees and a quiet spot to practice." },
  pavilion: { name: "Crafting Pavilion", note: "A crafting table, furnace, and supplies." },
  watchSW: { name: "Southwest Watchtower", tower: true }, watchSE: { name: "Southeast Watchtower", tower: true },
  watchNW: { name: "Northwest Watchtower", tower: true }, watchNE: { name: "Northeast Watchtower", tower: true }
};

// The people of Legacy Village. prof = which villager they are (it sets their robe and trades).
export const NPCS = {
  elder: { name: "Elder Maren", prof: "cleric", role: "Village Elder", hello: "Ah, a traveler! Sit by the fountain a while. These old stones have stories to tell, if you'll listen." },
  smith: { name: "Smith Garrick", prof: "smith", role: "Blacksmith", hello: "Mind the forge, it bites! Good tools make good builders. Iron makes great ones." },
  librarian: { name: "Librarian Odessa", prof: "cleric", role: "Librarian", hello: "Shh... well, not too shh. Most of these books are about the First Builders. Some are only about cheese." },
  farmer: { name: "Farmer Hollis", prof: "farmer", role: "Farmer", hello: "Fine day for growing! Break a ripe crop to harvest it, and always plant the seeds again." },
  captain: { name: "Captain Rowan", prof: "fletcher", role: "Guard Captain", hello: "Stand tall, recruit. A shield up and an eye open will keep you alive out there." },
  stable: { name: "Stablemaster Wren", prof: "shepherd", role: "Stablemaster", hello: "The Trotters are friendly once they know you. Ride one long enough and it'll call you a friend." },
  fisher: { name: "Fisher Juno", prof: "fletcher", role: "Fisher", hello: "Patience is the whole trick. Cast, wait, and pull when the bobber dips." },
  miner: { name: "Miner Brock", prof: "smith", role: "Miner", hello: "The old mine goes down further than anyone remembers. There's iron below, if you bring torches." },
  merchant: { name: "Merchant Pell", prof: "farmer", role: "Merchant", hello: "Welcome, welcome! Jade buys anything in Legacy Village. Well, almost anything." },
  // Stonehaven
  king: { name: "King Aldric", prof: "cleric", role: "King of Stonehaven", hello: "Welcome to Stonehaven, friend of Legacy. These walls have stood for a thousand years. I mean to keep it that way." },
  captainB: { name: "Captain Brenna", prof: "fletcher", role: "Captain of the Stonehaven Guard", hello: "Keep your sword sharp and your boots laced. Trouble doesn't knock." },
  smith2: { name: "Armorer Bram", prof: "smith", role: "Armorer", hello: "Iron plates, iron helms, iron everything. Nothing shiny, just sturdy." },
  baker: { name: "Baker Tilly", prof: "farmer", role: "Baker", hello: "Fresh bread! Well, fresh this morning. Still warm, if you hold it close." },
  innkeeper: { name: "Innkeeper Hob", prof: "farmer", role: "Innkeeper", hello: "A bed, a bowl, and a story. The Sleeping Griffin has all three." },
  townFarmer: { name: "Farmer Joss", prof: "farmer", role: "Farmer", hello: "Best wheat in the kingdom, and I'll arm-wrestle anyone who says otherwise." },
  guardB: { name: "Gate Guard Pim", prof: "fletcher", role: "Gate Guard", hello: "Halt! Oh, it's you. Carry on, hero." },
  // Sandspire
  rasha: { name: "Elder Rasha", prof: "cleric", role: "Elder of Sandspire", hello: "The sand remembers everything, traveler. Even the things we'd rather forget." },
  kadir: { name: "Merchant Kadir", prof: "fletcher", role: "Bazaar Merchant", hello: "Spices, silks, and stories! Two of those are for sale." },
  potter: { name: "Potter Nia", prof: "shepherd", role: "Potter", hello: "Every jar in Sandspire is mine. I count them every morning. There are a lot." },
  // Oakwood
  fenn: { name: "Explorer Fenn", prof: "fletcher", role: "Jungle Explorer", hello: "Mind the roots! I've tripped on every one of them, so you don't have to." },
  elm: { name: "Warden Elm", prof: "cleric", role: "Warden of Oakwood", hello: "The trees here are older than the kingdoms. Treat them kindly and they'll shelter you." },
  lumber: { name: "Woodcutter Ash", prof: "smith", role: "Woodcutter", hello: "We only cut fallen trees in Oakwood. The big ones would never forgive us." },
  // Seabreak
  mira: { name: "Captain Mira", prof: "fletcher", role: "Harbor Captain", hello: "Fair winds, landlubber. The sea gives and the sea takes. Mostly it takes boats." },
  fishmonger: { name: "Fishmonger Dory", prof: "farmer", role: "Fishmonger", hello: "Fresh fish! Today's fish! Possibly yesterday's fish!" },
  shipwright: { name: "Shipwright Tobin", prof: "smith", role: "Shipwright", hello: "A boat is just a house that learned to swim." }
};

// Places in the other towns and dungeons (Chapters 1–3)
Object.assign(PLACES, {
  stonehaven: { name: "Stonehaven" }, shCastle: { name: "Castle Stonehaven" }, shMarket: { name: "Stonehaven Market" }, shBarracks: { name: "Stonehaven Barracks" }, shInn: { name: "The Sleeping Griffin Inn" },
  watchtower: { name: "The Ruined Watchtower" }, oldMine: { name: "The Old Watch Mine" }, guardianHall: { name: "The Hall of the Guardian" },
  sandspire: { name: "Sandspire" }, spPalace: { name: "The Sun Palace" }, spire: { name: "The Sandspire" }, spireTop: { name: "Top of the Sandspire", tower: true }, bazaar: { name: "The Bazaar" },
  oakwood: { name: "Oakwood" }, camp: { name: "Explorers' Camp" }, tree0: { name: "Oakwood Treetops", tower: true }, tree1: { name: "Oakwood Treetops", tower: true }, tree2: { name: "Oakwood Treetops", tower: true }, tree3: { name: "Oakwood Treetops", tower: true },
  keyRuin0: { name: "The Overgrown Shrine" }, keyRuin1: { name: "The Abandoned Village" }, keyRuin2: { name: "The Vine Pillars" },
  seabreak: { name: "Seabreak" }, harbor: { name: "Seabreak Harbor" }, lighthouse: { name: "Seabreak Lighthouse" }, harborOffice: { name: "Harbor Office" }, wreck: { name: "The Shipwreck" },
  throne_desert: { name: "The Pharaoh's Throne Room" }, throne_jungle: { name: "The Titan's Grove" }, throne_sea: { name: "The Leviathan's Grotto" }
});

// Loot for the village's chests (early-game supplies only; nothing that skips ahead)
export const LOOT = {
  tutorial: [[I.APPLE, 6], [I.BREAD, 4], [B.TORCH, 16], [I.COAL, 8], [I.SEEDS, 8]],
  market: [[I.BREAD, 6], [I.APPLE, 8], [I.CARROT, 6], [B.WOOL, 4]],
  market2: [[B.TORCH, 12], [I.STRING, 4], [I.ARROW, 8], [I.LEATHER, 4]],
  smith: [[I.STONE_PICK, 1], [I.STONE_AXE, 1], [I.STONE_SHOVEL, 1], [I.IRON_INGOT, 3], [I.COAL, 16]],
  armory: [[I.LEATHER_HELMET, 1], [I.LEATHER_CHEST, 1], [I.LEATHER_LEGS, 1], [I.LEATHER_BOOTS, 1], [I.STONE_SWORD, 1], [I.BOW, 1], [I.ARROW, 16]],
  royal: [[I.GOLD_INGOT, 4], [I.JADE, 4], [I.BREAD, 6], [B.TORCH, 8]],
  vault: [[I.GOLD_INGOT, 10], [I.JADE, 8], [I.IRON_INGOT, 6], [I.GOLDEN_APPLE, 1], [I.COMPASS, 1]],
  archive: [[I.IRON_INGOT, 4], [I.JADE, 5], [I.BREAD, 4], [I.GOLD_INGOT, 3]],
  home: [[I.BREAD, 3], [I.APPLE, 2], [B.TORCH, 4], [I.COAL, 2]],
  barn: [[I.WHEAT, 8], [I.SEEDS, 12], [I.SHEARS, 1], [I.BUCKET, 1]],
  farm: [[I.SEEDS, 16], [I.CARROT, 6], [I.WOOD_HOE, 1], [I.BREAD, 4]],
  stable: [[I.SADDLE, 1], [I.WHEAT, 12], [I.APPLE, 6]],
  fish: [[I.FISHING_ROD, 1], [I.COOKED_MINNOW, 6], [I.BOAT, 1]],
  arena: [[I.WOOD_SWORD, 1], [I.STONE_SWORD, 1], [I.SHIELD, 1], [I.BOW, 1], [I.ARROW, 12]],
  mine: [[I.STONE_PICK, 1], [B.TORCH, 24], [I.BREAD, 4], [I.COAL, 8], [I.IRON_INGOT, 2]],
  // Stonehaven (iron gear: Chapter 1 heads into the first temple)
  shRoyal: [[I.GOLD_INGOT, 8], [I.JADE, 10], [I.GOLDEN_APPLE, 1], [I.GOLDEN_CARROT, 4]],
  shArmory: [[I.IRON_SWORD, 1], [I.IRON_CHEST, 1], [I.IRON_LEGS, 1], [I.SHIELD, 1], [I.ARROW, 16]],
  shopArmor: [[I.IRON_HELMET, 1], [I.IRON_BOOTS, 1], [I.IRON_INGOT, 4], [I.SHIELD, 1]],
  shopGeneral: [[B.TORCH, 32], [I.BUCKET, 1], [I.COMPASS, 1], [B.CHEST, 2], [I.COAL, 12]],
  shopBakery: [[I.BREAD, 16], [I.APPLE, 8], [I.GOLDEN_CARROT, 2]],
  shopTailor: [[B.WOOL, 16], [I.LEATHER, 8], [I.STRING, 8], [B.BED, 1]],
  shBarracks: [[I.IRON_SWORD, 1], [I.BOW, 1], [I.ARROW, 24], [I.BREAD, 4]],
  shBarracks2: [[I.STONE_SWORD, 2], [I.LEATHER_CHEST, 1], [I.COOKED_PORK, 6]],
  inn: [[I.STEAK, 6], [I.BREAD, 8], [I.APPLE, 6], [I.HONEY_BOTTLE, 2]],
  hoard: [[I.IRON_INGOT, 8], [I.JADE, 6], [I.GOLDEN_APPLE, 1], [I.IRON_PICK, 1], [B.TORCH, 16]],
  // Sandspire
  spPalace: [[I.GOLD_INGOT, 6], [I.JADE, 6], [I.GOLDEN_APPLE, 1], [I.BREAD, 6]],
  spPalace2: [[I.IRON_INGOT, 6], [I.ARROW, 24], [I.SHIELD, 1], [B.TORCH, 16]],
  bazaar: [[I.COOKED_MUTTON, 8], [I.APPLE, 8], [B.WOOL, 8], [I.GOLD_NUGGET, 12]],
  spHome: [[I.BREAD, 4], [I.WATER_BUCKET, 1], [B.TORCH, 6]],
  pharaohVault: [[I.SKYSHARD, 3], [I.GOLD_INGOT, 16], [I.JADE, 12], [I.GOLDEN_APPLE, 2], [I.IRON_CHEST, 1]],
  // Oakwood
  treehouse: [[I.APPLE, 6], [I.BREAD, 3], [I.ARROW, 12], [B.TORCH, 6]],
  camp: [[B.TORCH, 24], [I.BREAD, 8], [I.COOKED_CHICKEN, 6], [I.IRON_AXE, 1], [I.SHEARS, 1]],
  cabin: [[B.LOG, 16], [I.COOKED_RABBIT, 4], [I.APPLE, 4]],
  key0: [[I.ANCIENT_KEY, 1], [I.JADE, 4], [I.GOLDEN_APPLE, 1]],
  key1: [[I.ANCIENT_KEY, 1], [I.IRON_INGOT, 4], [I.BREAD, 4]],
  key2: [[I.ANCIENT_KEY, 1], [I.GOLD_INGOT, 6], [I.ARROW, 16]],
  titanVault: [[I.SKYSHARD, 4], [I.SKY_SWORD, 1], [I.JADE, 12], [I.GOLDEN_APPLE, 2]],
  // Seabreak
  ship: [[I.BOAT, 1], [I.CHEST_BOAT, 1], [I.COOKED_MINNOW, 8], [I.FISHING_ROD, 1]],
  harbor: [[I.BOAT, 2], [I.COOKED_MINNOW, 12], [I.BREAD, 6]],
  harbor2: [[I.IRON_INGOT, 6], [I.GOLDEN_CARROT, 6], [B.TORCH, 16], [I.COMPASS, 1]],
  sbHome: [[I.COOKED_MINNOW, 4], [I.BREAD, 2], [B.TORCH, 4]],
  wreck: [[I.OCEAN_MAP, 1], [I.GOLD_INGOT, 8], [I.JADE, 6]],
  wreck2: [[I.IRON_INGOT, 6], [I.GOLDEN_APPLE, 1], [I.COOKED_MINNOW, 6]],
  leviathanVault: [[I.SKYSHARD, 5], [I.SKY_CHEST, 1], [I.JADE, 16], [I.GOLDEN_APPLE, 2]]
};

// What every new campaign starts with (the Explorer's Map goes in the hotbar)
export const START_KIT = [[I.EXPLORER_MAP, 1], [I.APPLE, 3]];
// Given when you skip the lessons (so skipping never leaves you behind)
export const SKIP_KIT = [[I.WOOD_PICK, 1], [I.STONE_SWORD, 1], [I.STONE_PICK, 1], [B.LOG, 8], [I.BREAD, 6], [B.TABLE, 1]];

const LOGS = [B.LOG, B.BIRCH_LOG], CROPS = [B.WHEAT, B.CARROTS];
export const QUESTS = {
  welcome: { chapter: 1, main: true, title: "A Traveler Arrives", giver: "elder",
    text: "You woke beside the fountain of Legacy Village with no memory of how you got here. An old woman by the fountain is watching you kindly.",
    steps: [{ ev: "flag", flag: "chose", talk: "elder", text: "Talk to Elder Maren by the fountain (right-click her)" }] },
  lessons: { chapter: 1, main: true, tutorial: true, title: "Lessons of the Builder", giver: "elder",
    text: "Elder Maren wants to see that you can take care of yourself before she tells you the whole story.",
    steps: [
      { ev: "walk", n: 12, text: "Walk around: W A S D to move, the mouse to look, Space to jump" },
      { ev: "break", ids: LOGS, n: 3, place: "grove", text: "Chop 3 logs in the Tutorial Grove (hold the left mouse button on a trunk)" },
      { ev: "panel", kind: "inventory", text: "Open your inventory: press E" },
      { ev: "craft", ids: [B.PLANKS, B.BIRCH_PLANKS], text: "Craft planks from a log (in your inventory's crafting list)" },
      { ev: "craft", ids: [I.STICK], text: "Craft sticks from planks" },
      { ev: "craft", ids: [I.WOOD_PICK], place: "pavilion", text: "Craft a wooden pickaxe at a Crafting Table (there's one in the Crafting Pavilion)" },
      { ev: "break", ids: [B.STONE, B.COAL_ORE], n: 3, place: "pavilion", text: "Mine 3 stone with your pickaxe (the rocks beside the pavilion)" },
      { ev: "craft", ids: [I.STONE_SWORD, I.STONE_PICK, I.STONE_AXE], text: "Craft a stone tool or sword from your cobblestone" },
      { ev: "eat", text: "Eat something when you're hungry (hold food and hold the right mouse button). The pavilion's chest has apples" },
      { ev: "break", ids: CROPS, place: "farm", text: "Harvest a ripe crop at Hollis Farm" },
      { ev: "kill", sp: "slime", place: "arena", talk: "captain", text: "Ask Captain Rowan for a sparring match in the Training Arena, and win it" },
      { ev: "trade", talk: "merchant", place: "pavilion", text: "Trade with Merchant Pell (talk to him, then choose Trade)" },
      { ev: "visit", place: "throne", text: "Visit the Throne Room inside the castle" }
    ],
    reward: { xp: 60, items: [[I.LEATHER_HELMET, 1], [I.LEATHER_CHEST, 1], [I.BREAD, 8], [B.TORCH, 16]], text: "Leather armor, bread, and torches" } },
  village: { chapter: 1, main: true, title: "The Legacy Village", giver: "elder",
    text: "Elder Maren asked you to see the whole village and meet its people. Every building has something useful inside.",
    steps: [{ ev: "places", list: ["library", "smithy", "farm", "barn", "stable", "dock", "arena", "mine", "tower", "castle", "homes", "market"], n: 9, text: "Explore Legacy Village: visit 9 of its places" },
      { ev: "talk", npc: "elder", text: "Return to Elder Maren" }],
    reward: { xp: 40, items: [[I.IRON_INGOT, 3], [I.JADE, 5]], text: "3 iron ingots and 5 Jade" } },
  prepare: { chapter: 1, main: true, title: "Iron and Fire", giver: "elder",
    text: "\"Nobody walks the old roads with stone tools,\" says the Elder. Smith Garrick can help you make something better.",
    steps: [
      { ev: "talk", npc: "smith", text: "Talk to Smith Garrick at the forge" },
      { ev: "break", ids: [B.IRON_ORE], n: 2, place: "mineDeep", text: "Mine 2 iron ore in the Old Mine (take the stairs down)" },
      { ev: "have", ids: [I.IRON_INGOT], n: 3, text: "Smelt iron ore in a furnace until you have 3 iron ingots" },
      { ev: "craft", ids: [I.IRON_SWORD, I.IRON_PICK], text: "Craft an iron sword or an iron pickaxe" },
      { ev: "talk", npc: "smith", text: "Show Smith Garrick your work" }
    ],
    reward: { xp: 50, items: [[I.SHIELD, 1], [I.IRON_HELMET, 1]], text: "A shield and an iron helmet" } },
  rumors: { chapter: 1, main: true, title: "The Broken Watchtower", giver: "elder",
    text: "Travelers say a watchtower on the road to Stonehaven was smashed in a single night. The Elder thinks the First Builders' seals are failing.",
    steps: [{ ev: "talk", npc: "elder", text: "Hear the Elder's story" },
      { ev: "visit", place: "stonehaven", text: "Travel the road to Stonehaven, the walled kingdom (follow the marker)" },
      { ev: "talk", npc: "king", text: "Speak with King Aldric in Castle Stonehaven" }],
    reward: { xp: 30, items: [[I.BREAD, 8]], text: "Bread for the road" } },
  watchtower: { chapter: 1, main: true, title: "Footprints of Stone", giver: "king",
    text: "King Aldric's watchtower on the old road was torn apart. Nobody saw what did it. He asks you to look for clues.",
    steps: [{ ev: "visit", place: "watchtower", text: "Investigate the Ruined Watchtower" },
      { ev: "talk", npc: "captainB", text: "Report what you found to Captain Brenna at the barracks" }],
    reward: { xp: 30, items: [[I.ARROW, 16]], text: "16 arrows" } },
  raid: { chapter: 1, main: true, title: "Defend Stonehaven", giver: "captainB",
    text: "Monsters are gathering outside Stonehaven's gates, stirred up by whatever broke the seals. Captain Brenna needs every sword on the walls.",
    steps: [{ ev: "flag", flag: "raidWon", talk: "captainB", place: "stonehaven", text: "Tell Captain Brenna you're ready, then drive off all three waves of the raid" }],
    reward: { xp: 60, items: [[I.IRON_CHEST, 1], [I.GOLDEN_APPLE, 1]], text: "An iron chestplate and a golden apple" } },
  guardian: { chapter: 1, main: true, title: "The Guardian Below", giver: "captainB",
    text: "The stone footprints lead into the old watch mine. Something built by the First Builders is awake down there.",
    steps: [{ ev: "visit", place: "oldMine", text: "Find the Old Watch Mine beside the Ruined Watchtower" },
      { ev: "boss", boss: "stoneguard", place: "guardianHall", text: "Defeat the Ancient Stone Guardian at the bottom of the mine" },
      { ev: "talk", npc: "king", text: "Bring the Ancient Desert Map to King Aldric" }],
    reward: { xp: 60, items: [[I.IRON_SWORD, 1], [I.JADE, 8]], text: "The king's own iron sword and 8 Jade" } },
  sandspire: { chapter: 1, main: true, title: "Road to Sandspire", giver: "king",
    text: "The Ancient Desert Map shows a great pyramid beneath the sands, and a desert town called Sandspire that guards the way.",
    steps: [{ ev: "visit", place: "sandspire", text: "Travel to Sandspire, the desert town" },
      { ev: "talk", npc: "rasha", text: "Show the map to Elder Rasha in the Sun Palace" }],
    reward: { xp: 30, items: [[I.WATER_BUCKET, 1], [I.GOLDEN_CARROT, 6]], text: "Water and golden carrots" } },
  pyramid: { chapter: 1, main: true, title: "The Sunken Pyramid", giver: "rasha",
    text: "The Sunken Pyramid of Aurelis holds the Solar Seal, and somewhere deeper, the first of the eight Relics. Something old sleeps beside it.",
    steps: [{ ev: "temple", kind: "desert", text: "Find the pyramid tip in the desert and ride its lift down (the Explorer's Map shows it)" },
      { ev: "templeboss", kind: "desert", text: "Make your way through the pyramid and defeat the Solar Colossus" },
      { ev: "relic", kind: "desert", text: "Take the Solar Seal from its pedestal" },
      { ev: "visit", place: "throne_desert", text: "Follow the hidden passage behind the pedestal" },
      { ev: "boss", boss: "pharaoh", place: "throne_desert", text: "Defeat the Desert Pharaoh and claim the Relic of Earth" }],
    reward: { xp: 120, items: [[I.GOLDEN_APPLE, 2]], text: "Two golden apples (and the Relic of Earth)" } },
  oakwood: { chapter: 2, main: true, title: "Into the Green", giver: "rasha",
    text: "Carvings in the Pharaoh's tomb point to a jungle civilization far away. The forest town of Oakwood stands at its edge.",
    steps: [{ ev: "visit", place: "oakwood", text: "Travel to Oakwood, the town in the trees" },
      { ev: "talk", npc: "fenn", text: "Find Explorer Fenn at the Explorers' Camp" }],
    reward: { xp: 30, items: [[I.COOKED_CHICKEN, 8]], text: "Trail food" } },
  keys: { chapter: 2, main: true, title: "Three Ancient Keys", giver: "fenn",
    text: "Fenn's Expedition Map marks three ruins around the jungle temple. Each one hides an Ancient Key. Together they open the Root Seal.",
    steps: [{ ev: "have", ids: [I.ANCIENT_KEY], n: 3, places: ["keyRuin0", "keyRuin1", "keyRuin2"], text: "Find the three Ancient Keys: the Overgrown Shrine, the Abandoned Village, and the Vine Pillars" }],
    reward: { xp: 60, items: [[I.IRON_LEGS, 1]], text: "Iron leggings" } },
  jungletemple: { chapter: 2, main: true, title: "The Lost Jungle", giver: "fenn",
    text: "The Verdant Labyrinth hides the Verdant Lens. Beyond its vault, behind a door sealed by roots, the Jungle Titan guards the second Relic.",
    steps: [{ ev: "temple", kind: "jungle", text: "Find the overgrown step temple and ride its lift down" },
      { ev: "templeboss", kind: "jungle", text: "Get through the Labyrinth and defeat the Verdant Colossus" },
      { ev: "relic", kind: "jungle", text: "Take the Verdant Lens from its pedestal" },
      { ev: "flag", flag: "rootDoor", text: "Open the Root Seal behind the pedestal with your three Ancient Keys (touch its rune stone)" },
      { ev: "boss", boss: "titan", place: "throne_jungle", text: "Defeat the Jungle Titan and claim the Relic of Nature" }],
    reward: { xp: 140, items: [[I.GOLDEN_APPLE, 2]], text: "Two golden apples (and the Relic of Nature)" } },
  seabreak: { chapter: 3, main: true, title: "The Harbor at World's Edge", giver: "elm",
    text: "The Titan's roots grew around an old carving of a city under the sea. Seabreak, the last harbor before open water, is the place to start.",
    steps: [{ ev: "visit", place: "seabreak", text: "Travel to Seabreak, the harbor city" },
      { ev: "talk", npc: "mira", text: "Meet Captain Mira at the Harbor Office" }],
    reward: { xp: 30, items: [[I.COOKED_MINNOW, 8]], text: "Fish for the voyage" } },
  shipwreck: { chapter: 3, main: true, title: "The Sunken Ship", giver: "mira",
    text: "A ship carrying an ancient ocean map sank near Seabreak years ago. With the Tide Charm, you can breathe underwater long enough to search it.",
    steps: [{ ev: "visit", place: "wreck", text: "Find the shipwreck off the coast (swim down; the Tide Charm keeps you breathing)" },
      { ev: "have", ids: [I.OCEAN_MAP], n: 1, place: "wreck", text: "Recover the Ancient Ocean Map from the Captain's Chest" },
      { ev: "talk", npc: "mira", text: "Bring the map back to Captain Mira" }],
    reward: { xp: 50, items: [[I.SKY_HELMET, 1]], text: "A Skyshard helmet from Mira's own sea chest" } },
  seatemple: { chapter: 3, main: true, title: "Secrets Beneath the Sea", giver: "mira",
    text: "The map shows the Drowned Citadel under the lighthouse on the open sea, and a grotto beneath it where the Ocean Leviathan sleeps.",
    steps: [{ ev: "temple", kind: "sea", text: "Row out to the lighthouse on the open water and ride its lift down" },
      { ev: "templeboss", kind: "sea", text: "Explore the Drowned Citadel and defeat the Abyssal Regent" },
      { ev: "relic", kind: "sea", text: "Take the Tidal Heart from its pedestal" },
      { ev: "visit", place: "throne_sea", text: "Follow the passage behind the pedestal down to the grotto" },
      { ev: "boss", boss: "leviathan", place: "throne_sea", text: "Defeat the Ocean Leviathan and claim the Relic of the Tides" }],
    reward: { xp: 160, items: [[I.GOLDEN_APPLE, 3]], text: "Three golden apples (and the Relic of the Tides)" } },
  next4: { chapter: 4, main: true, title: "The Curse of the Blightking", giver: "elder",
    text: "Three Relics are safe. But a blight is spreading beneath Ironhold, and its source is something terrible.",
    steps: [{ ev: "soon", text: "Chapter 4 arrives in the next campaign update. Until then, explore, build, and finish your side quests!" }] },
  spireClimb: { chapter: 1, side: true, title: "Top of the World", giver: "potter",
    text: "Potter Nia says the view from the top of the Sandspire shows the whole desert.",
    steps: [{ ev: "places", list: ["spireTop"], n: 1, high: true, text: "Climb to the top of the Sandspire" }],
    reward: { xp: 25, items: [[I.GOLD_INGOT, 4]], text: "4 gold ingots" } },
  treetops: { chapter: 2, side: true, title: "Life in the Treetops", giver: "elm",
    text: "Warden Elm challenges you to visit all four treehouses of Oakwood without touching the ground... or at least to visit them.",
    steps: [{ ev: "places", list: ["tree0", "tree1", "tree2", "tree3"], n: 4, high: true, text: "Visit all four treetop platforms in Oakwood" }],
    reward: { xp: 30, items: [[I.GLIDER, 1]], text: "Glider Wings" } },
  secrets: { chapter: 1, side: true, title: "Secrets of Legacy", giver: "librarian",
    text: "Librarian Odessa says the old king hid things all over his village. Two secrets are said to be close by.",
    steps: [{ ev: "places", list: ["vault", "archive"], n: 2, text: "Find the King's Vault and the Forgotten Archive" }],
    reward: { xp: 40, items: [[I.GOLDEN_APPLE, 1]], text: "A golden apple" } },
  lookout: { chapter: 1, side: true, title: "A View From Above", giver: "captain",
    text: "Captain Rowan wants a lookout on the walls. Climb a watchtower and see what's beyond the village.",
    steps: [{ ev: "places", list: ["watchSW", "watchSE", "watchNW", "watchNE"], n: 1, high: true, text: "Climb to the top of any watchtower" }],
    reward: { xp: 20, items: [[I.ARROW, 16]], text: "16 arrows" } }
};
export const QUEST_ORDER = ["welcome", "lessons", "village", "prepare", "rumors", "watchtower", "raid", "guardian", "sandspire", "pyramid", "oakwood", "keys", "jungletemple", "seabreak", "shipwreck", "seatemple", "next4", "secrets", "lookout", "spireClimb", "treetops"];
// which quest each one leads to, and where a new chapter begins
export const NEXT = { lessons: ["village", "secrets", "lookout"], village: ["prepare"], prepare: ["rumors"], rumors: ["watchtower"], watchtower: ["raid"], raid: ["guardian"], guardian: ["sandspire"], sandspire: ["pyramid", "spireClimb"], pyramid: ["oakwood"], oakwood: ["keys", "treetops"], keys: ["jungletemple"], jungletemple: ["seabreak"], seabreak: ["shipwreck"], shipwreck: ["seatemple"], seatemple: ["next4"] };
export const CHAPTER_AFTER = { pyramid: 2, jungletemple: 3, seatemple: 4 };
// the chapter bosses: where they live and what they leave behind
export const BOSS_REWARDS = {
  stoneguard: { chapter: 0, items: [[I.DESERT_MAP, 1], [I.IRON_INGOT, 6]], xp: 100, title: "The Guardian Falls", text: "The Ancient Stone Guardian crumbles into rubble. In the dust lies a rolled-up map, drawn by the First Builders: the Ancient Desert Map." },
  pharaoh: { chapter: 1, relic: I.RELIC_EARTH, items: [[I.GOLD_INGOT, 12]], xp: 200, title: "The Pharaoh Rests", text: "The Desert Pharaoh sinks back into his sarcophagus with a sigh of sand. On his throne lies the first Relic: the Relic of Earth." },
  titan: { chapter: 2, relic: I.RELIC_NATURE, items: [[I.SKYSHARD, 4]], xp: 250, title: "The Titan Sleeps", text: "The Jungle Titan kneels, and roots and moss cover it gently. Where its heart glowed, the second Relic waits: the Relic of Nature." },
  leviathan: { chapter: 3, relic: I.RELIC_TIDES, items: [[I.SKYSHARD, 6]], xp: 300, title: "The Leviathan Returns to the Deep", text: "The Ocean Leviathan sinks into the dark water, calm at last. A wave carries the third Relic to your feet: the Relic of the Tides." }
};
