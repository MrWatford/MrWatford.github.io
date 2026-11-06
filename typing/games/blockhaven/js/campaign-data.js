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
  merchant: { name: "Merchant Pell", prof: "farmer", role: "Merchant", hello: "Welcome, welcome! Jade buys anything in Legacy Village. Well, almost anything." }
};

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
  mine: [[I.STONE_PICK, 1], [B.TORCH, 24], [I.BREAD, 4], [I.COAL, 8], [I.IRON_INGOT, 2]]
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
      { ev: "soon", text: "Travel the road to Stonehaven (coming in the next campaign update)" }] },
  secrets: { chapter: 1, side: true, title: "Secrets of Legacy", giver: "librarian",
    text: "Librarian Odessa says the old king hid things all over his village. Two secrets are said to be close by.",
    steps: [{ ev: "places", list: ["vault", "archive"], n: 2, text: "Find the King's Vault and the Forgotten Archive" }],
    reward: { xp: 40, items: [[I.GOLDEN_APPLE, 1]], text: "A golden apple" } },
  lookout: { chapter: 1, side: true, title: "A View From Above", giver: "captain",
    text: "Captain Rowan wants a lookout on the walls. Climb a watchtower and see what's beyond the village.",
    steps: [{ ev: "places", list: ["watchSW", "watchSE", "watchNW", "watchNE"], n: 1, high: true, text: "Climb to the top of any watchtower" }],
    reward: { xp: 20, items: [[I.ARROW, 16]], text: "16 arrows" } }
};
export const QUEST_ORDER = ["welcome", "lessons", "village", "prepare", "rumors", "secrets", "lookout"];
