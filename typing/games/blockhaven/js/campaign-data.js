// Blockhaven: The Legacy Campaign: the story, chapters, quests, places, and people (all original writing).
// Quests are data: each has steps the game checks automatically (js/campaign.js). A step's "ev" is the kind of
// event that moves it forward:
//   talk (npc)        right-click that person          visit (place)     walk into that place
//   walk (n)          walk n blocks                    break (ids, n)    break n of those blocks
//   panel (kind)      open that screen                 craft (ids)       craft one of those items
//   eat               eat anything                     kill (sp)         defeat that creature (any monster if no sp)
//   trade             trade with anyone                have (ids, n)     carry n of those items
//   places (list, n)  visit n of the listed places     flag (flag)       a story moment sets the flag
//   lost (key)        an Echohold milestone: city (reached the city), warden (First Warden defeated), gate (First Gate open), anchors (3 forge anchors quieted)
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
  shipwright: { name: "Shipwright Tobin", prof: "smith", role: "Shipwright", hello: "A boat is just a house that learned to swim." },
  // Ironhold (Chapter 4)
  hilda: { name: "Forgemaster Hilda", prof: "smith", role: "Leader of Ironhold", hello: "Ironhold doesn't bend and it doesn't break. Mostly it just makes a lot of noise." },
  dag: { name: "Miner Dag", prof: "smith", role: "Mine Foreman", hello: "Forty years under the mountain and I never saw stone go black like that. Never." },
  rue: { name: "Healer Rue", prof: "cleric", role: "Healer", hello: "Sit down, sit down. Nobody leaves my house hungry or bleeding. Ideally neither." },
  orrin: { name: "Captain Orrin", prof: "fletcher", role: "Gate Captain", hello: "Ironhold's gates stay open to honest folk. The blight is not honest folk." },
  // the Ember Outpost (Chapter 5)
  sable: { name: "Expedition Leader Sable", prof: "fletcher", role: "Royal Expedition", hello: "Welcome to the hottest camp in the five kingdoms. Literally. Don't touch the portal frame." },
  quill: { name: "Scholar Quill", prof: "cleric", role: "Expedition Scholar", hello: "Did you know the First Builders wrote everything twice? Once for people, once for dragons." },
  // Hollowmere (Chapter 6)
  ilsa: { name: "Watcher Ilsa", prof: "shepherd", role: "The Last Villager", hello: "Someone has to keep the lamps lit. The fog doesn't like light, and I don't like the fog." },
  // Skyreach and the Ruined Capital (Chapter 8)
  solenne: { name: "Keeper Solenne", prof: "cleric", role: "The Last Sky Keeper", hello: "The wind told me you were coming. The wind talks a great deal, but this time it was right." },
  brenna8: { name: "Captain Brenna", prof: "fletcher", role: "Captain of the Kingdoms", hello: "Every kingdom you saved sent someone. We're here because of you. Now let's finish this." },
  hilda8: { name: "Forgemaster Hilda", prof: "smith", role: "Ironhold's Forgemaster", hello: "I carried my best anvil all the way from Ironhold. If you need gear, now's the time." },
  sable8: { name: "Expedition Leader Sable", prof: "fletcher", role: "Royal Expedition", hello: "I've camped beside dragons and rivers of lava. A haunted capital? Practically a vacation." }
};

// Places in the other towns and dungeons (Chapters 1–3)
Object.assign(PLACES, {
  stonehaven: { name: "Stonehaven" }, shCastle: { name: "Castle Stonehaven" }, shMarket: { name: "Stonehaven Market" }, shBarracks: { name: "Stonehaven Barracks" }, shInn: { name: "The Sleeping Griffin Inn" },
  watchtower: { name: "The Ruined Watchtower" }, oldMine: { name: "The Old Watch Mine" }, guardianHall: { name: "The Hall of the Guardian" },
  sandspire: { name: "Sandspire" }, spPalace: { name: "The Sun Palace" }, spire: { name: "The Sandspire" }, spireTop: { name: "Top of the Sandspire", tower: true }, bazaar: { name: "The Bazaar" },
  oakwood: { name: "Oakwood" }, camp: { name: "Explorers' Camp" }, tree0: { name: "Oakwood Treetops", tower: true }, tree1: { name: "Oakwood Treetops", tower: true }, tree2: { name: "Oakwood Treetops", tower: true }, tree3: { name: "Oakwood Treetops", tower: true },
  keyRuin0: { name: "The Overgrown Shrine" }, keyRuin1: { name: "The Abandoned Village" }, keyRuin2: { name: "The Vine Pillars" },
  seabreak: { name: "Seabreak" }, harbor: { name: "Seabreak Harbor" }, lighthouse: { name: "Seabreak Lighthouse" }, harborOffice: { name: "Harbor Office" }, wreck: { name: "The Shipwreck" },
  throne_desert: { name: "The Pharaoh's Throne Room" }, throne_jungle: { name: "The Titan's Grove" }, throne_sea: { name: "The Leviathan's Grotto" },
  // Chapters 4–6
  ironhold: { name: "Ironhold" }, ihForge: { name: "The Forge Hall" }, ihMineHead: { name: "The Mine Head" }, blightMine: { name: "The Deep Mine" },
  mineGallery0: { name: "The West Gallery" }, mineGallery1: { name: "The South Gallery" }, mineGallery2: { name: "The East Gallery" },
  blightCitadel: { name: "The Blight Citadel" }, outpost: { name: "The Ember Outpost" },
  seal0: { name: "The First Dragon Shrine" }, seal1: { name: "The Second Dragon Shrine" }, seal2: { name: "The Third Dragon Shrine" }, cinderCitadel: { name: "The Cinder Citadel" },
  hollowmere: { name: "Hollowmere" }, hmHall: { name: "The Meeting Hall" }, hmWell: { name: "The Old Well" }, hmLab: { name: "Dr. Vell's Observatory" },
  // Chapter 8
  skyreach: { name: "Skyreach Landing" }, skyreachIsle: { name: "Skyreach" }, skyForge: { name: "The Relic Forge" }, skyGarden: { name: "The Sky Gardens" }, stormSpire: { name: "The Storm Spire" },
  capital: { name: "The Ruined Capital" }, avenue: { name: "The Grand Avenue" }, capitalGate: { name: "The Gate of Eight" }, throneCourt: { name: "The Throne Court" }
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
  leviathanVault: [[I.SKYSHARD, 5], [I.SKY_CHEST, 1], [I.JADE, 16], [I.GOLDEN_APPLE, 2]],
  // Ironhold and its mine
  ihForge: [[I.IRON_INGOT, 8], [I.IRON_PICK, 1], [I.IRON_AXE, 1], [I.COAL, 16]],
  ihForge2: [[I.IRON_HELMET, 1], [I.IRON_BOOTS, 1], [I.SHIELD, 1], [I.IRON_INGOT, 4]],
  ihYard: [[I.IRON_INGOT, 4], [I.COAL, 12], [B.RAIL, 16], [I.MINECART, 1]],
  ihHome: [[I.BREAD, 3], [B.TORCH, 6], [I.COAL, 4]],
  ihHealer: [[I.GOLDEN_APPLE, 1], [I.BREAD, 6], [I.HONEY_BOTTLE, 3], [I.GOLDEN_CARROT, 4]],
  ihGuard: [[I.IRON_SWORD, 1], [I.BOW, 1], [I.ARROW, 24]],
  ihMine: [[B.TORCH, 24], [I.BREAD, 4], [I.IRON_PICK, 1]],
  mineSkull0: [[I.BLIGHT_SKULL, 1], [I.IRON_INGOT, 4], [I.GOLD_INGOT, 2]],
  mineSkull1: [[I.BLIGHT_SKULL, 1], [I.JADE, 5], [I.BREAD, 4]],
  mineSkull2: [[I.BLIGHT_SKULL, 1], [I.IRON_INGOT, 3], [I.GOLDEN_APPLE, 1]],
  citadelSupplies: [[I.GOLDEN_APPLE, 2], [I.ARROW, 32], [I.BREAD, 8], [I.GOLDEN_CARROT, 6]],
  citadelSand: [[B.SOUL_SAND, 4], [B.TORCH, 8]],
  // the Ember Outpost and the Dragon Seal shrines
  outpost: [[I.FLINT_STEEL, 1], [I.GOLDEN_CARROT, 8], [B.TORCH, 24], [B.COBBLE, 32], [I.BREAD, 6]],
  outpost2: [[I.GOLD_HELMET, 1], [I.ARROW, 32], [I.GOLDEN_APPLE, 1], [B.OBSIDIAN, 10]],
  seal0: [[I.DRAGON_SEAL, 1], [I.GOLD_INGOT, 4], [I.JADE, 4]],
  seal1: [[I.DRAGON_SEAL, 1], [I.GOLD_INGOT, 6], [I.GOLDEN_APPLE, 1]],
  seal2: [[I.DRAGON_SEAL, 1], [I.JADE, 8], [I.GOLDEN_CARROT, 6]],
  // Hollowmere
  hmHome: [[I.BREAD, 2], [B.TORCH, 4], [I.STRING, 3]],
  hmIlsa: [[I.BREAD, 6], [I.APPLE, 6], [I.COOKED_CHICKEN, 4]],
  hmLab: [[I.PALE_LANTERN, 1], [I.PALE_SHARD, 3], [I.GOLDEN_APPLE, 1], [B.TORCH, 16]],
  // Skyreach and the Ruined Capital (Chapter 8)
  skyLanding: [[I.BREAD, 8], [B.TORCH, 16], [I.ARROW, 32]],
  skyForge: [[I.GOLDEN_APPLE, 2], [I.SKYSHARD, 6], [I.GOLD_INGOT, 8]],
  skyHouse: [[I.COOKED_CHICKEN, 6], [I.GOLDEN_CARROT, 6]],
  capSupplies: [[I.GOLDEN_APPLE, 4], [I.STEAK, 12], [I.ARROW, 64], [I.GOLDEN_CARROT, 8]],
  capArmory: [[I.SKY_HELMET, 1], [I.SKY_CHEST, 1], [I.SKY_LEGS, 1], [I.SKY_BOOTS, 1], [I.SKY_SWORD, 1], [I.SHIELD, 1]],
  capRuin1: [[I.GOLD_INGOT, 6], [I.JADE, 6]],
  capRuin2: [[I.SKYSHARD, 3], [I.GOLDEN_APPLE, 1]]
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
    steps: [{ ev: "have", ids: [I.ANCIENT_KEY], n: 3, skip: "rootDoor", places: ["keyRuin0", "keyRuin1", "keyRuin2"], text: "Find the three Ancient Keys: the Overgrown Shrine, the Abandoned Village, and the Vine Pillars" }],
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
  // ======================= Chapter 4: The Curse of the Blightking =======================
  ironhold: { chapter: 4, main: true, title: "Black Stone", giver: "elder",
    text: "Three Relics are safe. But word has come from Ironhold, the mining town under Mount Ferrum: the stone in its deep mine is turning black, and the miners hear whispers in the dark.",
    steps: [{ ev: "talk", npc: "elder", text: "Talk to Elder Maren about the news from Ironhold" },
      { ev: "visit", place: "ironhold", text: "Travel to Ironhold, the mining town under Mount Ferrum" },
      { ev: "talk", npc: "hilda", text: "Find Forgemaster Hilda in the Forge Hall" }],
    reward: { xp: 40, items: [[I.IRON_INGOT, 6], [I.BREAD, 6]], text: "6 iron ingots and bread" } },
  blightmines: { chapter: 4, main: true, title: "The Corrupted Mines", giver: "hilda",
    text: "Hilda's three mining crews dug into something old under the mountain and fled. Whatever they found is where the blight comes from.",
    steps: [{ ev: "visit", place: "blightMine", text: "Take the stairs in the Mine Head down to the Deep Mine" },
      { ev: "have", ids: [I.BLIGHT_SKULL], n: 3, places: ["mineGallery0", "mineGallery1", "mineGallery2"], text: "Search the west, south, and east galleries for three Blight Skulls" },
      { ev: "talk", npc: "hilda", text: "Bring the Blight Skulls to Forgemaster Hilda" }],
    reward: { xp: 80, items: [[I.GOLDEN_APPLE, 2], [I.ARROW, 32]], text: "Two golden apples and 32 arrows" } },
  blightking: { chapter: 4, main: true, title: "The Curse of the Blightking", giver: "hilda",
    text: "The skulls want to go home to the Blight Citadel, where the First Builders sealed the Blightking long ago. The only way to end the curse is to wake him there, and win.",
    steps: [{ ev: "visit", place: "blightCitadel", text: "Find the Blight Citadel (follow the marker)" },
      { ev: "flag", flag: "blightWoke", place: "blightCitadel", text: "Place the three Blight Skulls on top of the Wailing Sand altar in the courtyard" },
      { ev: "boss", boss: "blightking", place: "blightCitadel", text: "Defeat the Blightking (stay inside the courtyard)" },
      { ev: "boss", boss: "tempest", place: "blightCitadel", text: "Survive the Blight Tempest: dodge the glowing ground, light the three Rune Stones, and strike it" }],
    reward: { xp: 200, items: [[I.GOLDEN_APPLE, 2]], text: "Two golden apples (and the Relic of Decay)" } },
  ironVeins: { chapter: 4, side: true, title: "Ironhold Iron", giver: "dag",
    text: "Miner Dag says no visitor leaves Ironhold without digging a little iron of their own. Mount Ferrum is full of it.",
    steps: [{ ev: "break", ids: [B.IRON_ORE], n: 6, text: "Mine 6 iron ore (Mount Ferrum, behind the town, is full of it)" }],
    reward: { xp: 30, items: [[I.JADE, 6]], text: "6 Jade" } },
  // ======================= Chapter 5: Dragon of the Embers =======================
  embers: { chapter: 5, main: true, title: "Fire Beneath the World", giver: "hilda",
    text: "The Blightking's crown was forged in fire from the Ember Depths. The fifth Relic is down there too, guarded by Cindermaw. A royal expedition has set up camp beside a portal frame.",
    steps: [{ ev: "visit", place: "outpost", text: "Travel to the Ember Outpost" },
      { ev: "talk", npc: "sable", text: "Talk to Expedition Leader Sable" },
      { ev: "dim", dim: "nether", place: "outpost", text: "Light the Ember Gate with Flint and Steel (from the supply chest) and step through" }],
    reward: { xp: 40, items: [[I.GOLDEN_CARROT, 8]], text: "Golden carrots" } },
  seals: { chapter: 5, main: true, title: "Three Dragon Seals", giver: "sable",
    text: "The First Builders locked Cindermaw's altar with three Dragon Seals and hid them in shrines across the Ember Depths. Together, the seals become a key.",
    steps: [{ ev: "have", ids: [I.DRAGON_SEAL], n: 3, places: ["seal0", "seal1", "seal2"], text: "Find the three Dragon Seal shrines in the Ember Depths (the marker shows the next one)" }],
    reward: { xp: 80, items: [[I.CINDER_EYE, 1]], take: [[I.DRAGON_SEAL, 3]], text: "The three seals melt together into a Cinder Eye" } },
  cindermaw: { chapter: 5, main: true, title: "Dragon of the Embers", giver: "sable",
    text: "The Cinder Eye opens the altar in Cindermaw's citadel. Defeat the Ember Dragon, and the fifth Relic is yours.",
    steps: [{ ev: "visit", place: "cinderCitadel", text: "Find the Cinder Citadel in the Ember Depths (follow the marker)" },
      { ev: "boss", boss: "cindermaw", text: "Place the Cinder Eye in the Cinder Altar and defeat Cindermaw" }],
    reward: { xp: 150, items: [[I.GOLDEN_APPLE, 3]], text: "Three golden apples (and the Relic of Flame)" } },
  // ======================= Chapter 6: The Shadow of Herobrine =======================
  hollowmere: { chapter: 6, main: true, title: "Whispers in the Fog", giver: "sable",
    text: "Travelers speak of a village swallowed by fog, and of a tall stranger with white eyes who watches from the hills. Someone there may know where the sixth Relic is.",
    steps: [{ ev: "visit", place: "hollowmere", text: "Travel to Hollowmere, the village in the fog" },
      { ev: "talk", npc: "ilsa", text: "Talk to Watcher Ilsa, the last villager" },
      { ev: "places", list: ["hmHall", "hmWell", "hmLab"], n: 3, text: "Search the Meeting Hall, the Old Well, and Dr. Vell's observatory on the hill" }],
    reward: { xp: 50, items: [[I.BREAD, 6]], text: "Ilsa's bread" } },
  shadow: { chapter: 6, main: true, title: "The Shadow of Herobrine", giver: "ilsa",
    text: "Dr. Vell's lantern finds the way into the Forsaken World, where Herobrine waits. Ilsa is sure the Relic of Shadows is hidden there.",
    steps: [{ ev: "have", ids: [I.PALE_LANTERN], n: 1, place: "hmLab", text: "Take Dr. Vell's Pale Lantern from the cabinet in the observatory" },
      { ev: "dim", dim: "forsaken", text: "Hold the Pale Lantern and right-click to step into the Forsaken World" },
      { ev: "boss", boss: "herobrine", text: "Restore the shrines, gather the three sigils, and banish Herobrine in his Pale Citadel (press J for the Forsaken World journal)" }],
    reward: { xp: 200, items: [[I.GOLDEN_APPLE, 3]], text: "Three golden apples (and the Relic of Shadows)" } },
  // ======================= Chapter 7: The Ancient City =======================
  deepcall: { chapter: 7, main: true, title: "The City That Listens", giver: "elder",
    text: "Six Relics are safe. The Relic of Shadows hums like a far-off bell, and its carving points to a city deep below the world, where the First Builders made their last stand.",
    steps: [{ ev: "talk", npc: "elder", text: "Show the Relic of Shadows to Elder Maren in Legacy Village" },
      { ev: "dim", dim: "deep", text: "Find the Keeper excavation (follow the marker) and ride its lift down into the Deep" }],
    reward: { xp: 50, items: [[I.GOLDEN_CARROT, 8], [B.TORCH, 32]], text: "Golden carrots and 32 torches" } },
  echohold: { chapter: 7, main: true, title: "The First Warden", giver: "elder",
    text: "Echohold was the First Builders' greatest city. It has been silent for a thousand years, but it is not empty. Its guardian, the First Warden, still listens for footsteps, and it carries the last key to the First Gate.",
    steps: [{ ev: "lost", key: "city", text: "Follow the caverns down past the balcony, the dripstone, and the ravine to the city of Echohold" },
      { ev: "lost", key: "warden", text: "Move quietly (crouch, and keep off the hushmoss), find the Citadel, and defeat the First Warden for its Resonance Core" }],
    reward: { xp: 120, items: [[I.GOLDEN_APPLE, 2]], text: "Two golden apples" } },
  firstgate: { chapter: 7, main: true, title: "Beyond the First Gate", giver: "elder",
    text: "The First Gate was the doorway the First Builders opened long ago. The temple relics and the Warden's core can open it one more time. On the other side, the seventh Relic waits with the Resonant Sovereign.",
    steps: [{ ev: "lost", key: "gate", text: "Set the Solar Seal, Verdant Lens, Tidal Heart, and Resonance Core in the First Gate (follow the marker), tune it, and open it" },
      { ev: "dim", dim: "expanse", text: "Walk into the light of the First Gate to cross to the Echo Expanse" },
      { ev: "lost", key: "anchors", text: "Quiet the three forge anchors in the Expanse" },
      { ev: "boss", boss: "sovereign", text: "Calm the Resonant Sovereign in the Crownless Citadel and claim the Relic of the Abyss" }],
    reward: { xp: 250, items: [[I.GOLDEN_APPLE, 3]], text: "Three golden apples (and the Relic of the Abyss)" } },
  // ======================= Chapter 8: The End of the First Builders =======================
  voidcall: { chapter: 8, main: true, title: "The Last Relic", giver: "elder",
    text: "Seven Relics are safe, and they hum together like a choir missing one voice. The last one, the Relic of the Void, lies in the Hollow: the pale islands past the edge of the world, where the Hollow Wyrm keeps watch.",
    steps: [{ ev: "talk", npc: "elder", text: "Talk to Elder Maren about the last Relic" },
      { ev: "dim", dim: "end", text: "Throw an Eye of the Void to find a stronghold (the marker shows the nearest one), fill its portal frame, and jump in" }],
    reward: { xp: 60, items: [[I.ARROW, 64], [I.GOLDEN_CARROT, 8]], text: "64 arrows and golden carrots" } },
  wyrm: { chapter: 8, main: true, title: "Beyond the World's Edge", giver: "elder",
    text: "The Hollow Wyrm has guarded the Relic of the Void since the First Builders hid it. The crystals on the tall pillars heal it, so break them first.",
    steps: [{ ev: "boss", boss: "wyrm", text: "Break the crystals on the tall pillars, then defeat the Hollow Wyrm for the Relic of the Void" }],
    reward: { xp: 150, items: [[I.GOLDEN_APPLE, 2]], text: "Two golden apples (and the Relic of the Void)" } },
  skyreach: { chapter: 8, main: true, title: "The City Above the Clouds", giver: "elder",
    text: "When all eight Relics shone together, they showed you a city floating above the clouds: Skyreach, where the First Builders forged the Relics. Someone there is still keeping watch.",
    steps: [{ ev: "visit", place: "skyreach", text: "Travel to Skyreach Landing (follow the marker)" },
      { ev: "visit", place: "skyreachIsle", text: "Climb the Sky Stair to the floating city" },
      { ev: "talk", npc: "solenne", text: "Find Keeper Solenne in the Relic Forge" }],
    reward: { xp: 80, items: [[I.GLIDER, 1]], text: "Glider Wings (just in case)" } },
  skysov: { chapter: 8, main: true, title: "Storm Over Skyreach", giver: "solenne",
    text: "The Sky Sovereign once guarded the Relic Forge. Now the Forgotten King's whisper holds it, and it holds the Crown Key, the only key to the King's sealed gate.",
    steps: [{ ev: "boss", boss: "skysov", place: "stormSpire", text: "Go to the Storm Spire at the north end of the island and defeat the Sky Sovereign" },
      { ev: "talk", npc: "solenne", text: "Bring the Crown Key back to Keeper Solenne" }],
    reward: { xp: 100, items: [[I.GOLDEN_APPLE, 3]], text: "Three golden apples" } },
  capital: { chapter: 8, main: true, title: "The Ruined Capital", giver: "solenne",
    text: "The Crown Key opens the Gate of Eight in the Ruined Capital, where the Forgotten King waits on his broken throne. Friends from every kingdom have gathered there to help you.",
    steps: [{ ev: "visit", place: "capital", text: "Travel to the kingdoms' camp in the Ruined Capital (follow the marker)" },
      { ev: "talk", npc: "brenna8", text: "Talk to Captain Brenna at the camp" },
      { ev: "flag", flag: "capitalOpen", place: "capitalGate", text: "Walk the Grand Avenue to the Gate of Eight. Carrying all eight Relics and the Crown Key, right-click the Rune Stone in front of the sealed gate" }],
    reward: { xp: 100, items: [[I.GOLDEN_APPLE, 3], [I.TOTEM, 1]], text: "Three golden apples and a Lifeward Totem" } },
  forgottenking: { chapter: 8, main: true, title: "The Forgotten King", giver: "brenna8",
    text: "This is it. The Forgotten King has waited a thousand years for the Relics to come home. End it, and decide what becomes of him.",
    steps: [{ ev: "boss", boss: "king", place: "throneCourt", text: "Enter the Throne Court and defeat the Forgotten King (4 phases)" },
      { ev: "flag", flag: "endingChosen", text: "Decide the Forgotten King's fate" }],
    reward: { xp: 500, items: [[I.GOLDEN_APPLE, 3]], text: "500 XP and three golden apples" } },
  homecoming: { chapter: 8, main: true, title: "Homecoming", giver: "elder",
    text: "It's over. Every kingdom is safe, and everyone you met along the way is waiting for you at home.",
    steps: [{ ev: "visit", place: "plaza", fresh: true, text: "Return to Legacy Village. Everyone is waiting at the Fountain Plaza!" }],
    reward: { xp: 300, items: [[I.GOLDEN_APPLE, 5], [I.JADE, 30]], text: "Five golden apples and 30 Jade" } },
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
export const QUEST_ORDER = ["welcome", "lessons", "village", "prepare", "rumors", "watchtower", "raid", "guardian", "sandspire", "pyramid", "oakwood", "keys", "jungletemple", "seabreak", "shipwreck", "seatemple",
  "ironhold", "blightmines", "blightking", "embers", "seals", "cindermaw", "hollowmere", "shadow", "deepcall", "echohold", "firstgate", "voidcall", "wyrm", "skyreach", "skysov", "capital", "forgottenking", "homecoming", "secrets", "lookout", "spireClimb", "treetops", "ironVeins"];
// which quest each one leads to, and where a new chapter begins
export const NEXT = { lessons: ["village", "secrets", "lookout"], village: ["prepare"], prepare: ["rumors"], rumors: ["watchtower"], watchtower: ["raid"], raid: ["guardian"], guardian: ["sandspire"], sandspire: ["pyramid", "spireClimb"], pyramid: ["oakwood"], oakwood: ["keys", "treetops"], keys: ["jungletemple"], jungletemple: ["seabreak"], seabreak: ["shipwreck"], shipwreck: ["seatemple"], seatemple: ["ironhold"],
  ironhold: ["blightmines", "ironVeins"], blightmines: ["blightking"], blightking: ["embers"], embers: ["seals"], seals: ["cindermaw"], cindermaw: ["hollowmere"], hollowmere: ["shadow"], shadow: ["deepcall"],
  deepcall: ["echohold"], echohold: ["firstgate"], firstgate: ["voidcall"],
  voidcall: ["wyrm"], wyrm: ["skyreach"], skyreach: ["skysov"], skysov: ["capital"], capital: ["forgottenking"], forgottenking: ["homecoming"] };
export const CHAPTER_AFTER = { pyramid: 2, jungletemple: 3, seatemple: 4, blightking: 5, cindermaw: 6, shadow: 7, firstgate: 8 };
// Chapter select: the quest each playable chapter starts with, and the quest that ends the story so far
// (finishing FINAL_QUEST, the homecoming after the Forgotten King, without ever skipping ahead earns "The Whole Story")
export const CHAPTER_START = { 1: "welcome", 2: "oakwood", 3: "seabreak", 4: "ironhold", 5: "embers", 6: "hollowmere", 7: "deepcall", 8: "voidcall" };
export const PLAYABLE = 8;
export const FINAL_QUEST = "homecoming";
// the chapter bosses: where they live and what they leave behind
export const BOSS_REWARDS = {
  stoneguard: { chapter: 0, items: [[I.DESERT_MAP, 1], [I.IRON_INGOT, 6]], xp: 100, title: "The Guardian Falls", text: "The Ancient Stone Guardian crumbles into rubble. In the dust lies a rolled-up map, drawn by the First Builders: the Ancient Desert Map." },
  pharaoh: { chapter: 1, relic: I.RELIC_EARTH, items: [[I.GOLD_INGOT, 12]], xp: 200, title: "The Pharaoh Rests", text: "The Desert Pharaoh sinks back into his sarcophagus with a sigh of sand. On his throne lies the first Relic: the Relic of Earth." },
  titan: { chapter: 2, relic: I.RELIC_NATURE, items: [[I.SKYSHARD, 4]], xp: 250, title: "The Titan Sleeps", text: "The Jungle Titan kneels, and roots and moss cover it gently. Where its heart glowed, the second Relic waits: the Relic of Nature." },
  leviathan: { chapter: 3, relic: I.RELIC_TIDES, items: [[I.SKYSHARD, 6]], xp: 300, title: "The Leviathan Returns to the Deep", text: "The Ocean Leviathan sinks into the dark water, calm at last. A wave carries the third Relic to your feet: the Relic of the Tides." },
  tempest: { chapter: 4, relic: I.RELIC_DECAY, items: [[I.RADIANT_STAR, 1], [I.GOLDEN_APPLE, 2]], xp: 350, title: "The Storm Breaks", text: "The Blight Tempest tears itself apart. Stones, logs, and earth fall gently back to the ground, and the black stain fades from the land. Where the Blightking's crown fell lies the fourth Relic: the Relic of Decay." },
  // bosses with their own victory scenes (the campaign only adds the Relic and a note afterward)
  cindermaw: { chapter: 5, relic: I.RELIC_FLAME, items: [], xp: 0, external: true, title: "The Relic of Flame", text: "As Cindermaw falls, the altar cracks open. Inside, wrapped in cooling cinders, is the fifth Relic: the Relic of Flame. The First Builders' fire is safe at last." },
  herobrine: { chapter: 6, relic: I.RELIC_SHADOWS, items: [], xp: 0, external: true, title: "The Relic of Shadows", text: "Where Herobrine stood, the mist leaves something behind: a cold, dark stone that hums like a far-off bell. The sixth Relic, the Relic of Shadows.\n\nCarved on it, in the First Builders' script: \"The last two Relics wait below the world and beyond it. Seek the city that listens.\"" },
  wyrm: { chapter: 8, relic: I.RELIC_VOID, items: [], xp: 0, external: true, title: "The Relic of the Void", text: "As the Hollow Wyrm falls, the pale islands go quiet. Where it rested lies a stone as dark as the space between stars: the eighth and last Relic, the Relic of the Void.\n\nAll eight Relics shine together in your pack, and for one moment you see far away: a city floating above the clouds, and beneath the sky a broken capital, where something stirs on an empty throne..." },
  skysov: { chapter: 8, items: [[I.CROWN_KEY, 1], [I.GOLDEN_APPLE, 2]], xp: 300, title: "The Storm Clears", text: "The Sky Sovereign's wings drift apart like clouds after rain, and its eyes turn from storm-blue to soft white.\n\n\"Thank you, builder. The King's whisper held me for a thousand years. He was not always cruel... remember that, when you stand before him.\"\n\nIt leaves the Crown Key in your hands: the key to the Gate of Eight." },
  king: { chapter: 8, items: [], xp: 0, title: "The Forgotten King Falls", text: "" },
  sovereign: { chapter: 7, relic: I.RELIC_ABYSS, items: [], xp: 0, external: true, title: "The Relic of the Abyss", text: "As the Sovereign's crown drifts apart, one stone in it keeps glowing. It sinks slowly into your hands: the seventh Relic, the Relic of the Abyss, cool and bright as deep water.\n\nThe ring of light around the arena shows one last picture before it fades: a pale island floating in darkness, a city in the clouds, and a broken capital with an empty throne. A voice like distant thunder whispers: \"Seven... only one more.\"" }
};
// names for the journal's "Bosses defeated" line (bosses fought outside js/campaign-bosses.js)
export const BOSS_NAMES = { blightking: "The Blightking", tempest: "The Blight Tempest", cindermaw: "Cindermaw", herobrine: "Herobrine", sovereign: "The Resonant Sovereign", wyrm: "The Hollow Wyrm" };
// The two endings (Chapter 8): what happens after the Forgotten King falls, and how Legacy Village celebrates
export const ENDINGS = {
  free: { title: "The King Set Free", choice: "Set him free",
    text: "You raise the eight Relics. Their light pours over the Forgotten King, and the Void drains out of his armor like smoke on the wind.\n\nUnderneath is an old man in a gold crown. He looks at his hands as if he hasn't seen them in a thousand years.\n\n\"I remember now. I was Elarion, the first king of Blockhaven. The Void promised me a kingdom that would never end, and I listened. Thank you, builder. You gave back what I lost.\"\n\nHe bows to you, smiles, and fades into golden light. Somewhere far away, a bell rings.",
    party: "Elder Maren is waiting at the fountain with tears in her eyes. \"Set free... the old king himself! The First Builders would be so proud of you. I am too.\"\n\nThe whole village has turned out: Smith Garrick, Captain Rowan, Farmer Hollis, and friends from every kingdom you saved. Lanterns float over the plaza, and the fountain glows gold.\n\nThe Legacy Campaign is complete. Thank you for playing!" },
  banish: { title: "The King Banished", choice: "Banish him",
    text: "You raise the eight Relics. Their light turns cold and white, and a crack opens in the air behind the Forgotten King.\n\n\"No... not the dark again. Not alone!\"\n\nThe Void pulls him in, crown and all, and the crack seals shut. The Throne Court is silent. The kingdoms are safe forever, but the empty throne feels very cold.",
    party: "Elder Maren meets you at the fountain. \"Banished. The kingdoms are safe, and that's what matters.\" She looks toward the horizon for a long moment. \"He was a king once, you know. A good one. I wonder if he'll ever find his way back.\"\n\nThen she smiles and takes your hand. The village has turned out to cheer, with friends from every kingdom you saved.\n\nThe Legacy Campaign is complete. Thank you for playing!" }
};
