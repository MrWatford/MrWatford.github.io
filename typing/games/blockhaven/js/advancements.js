// Advancements: goals that unlock from real gameplay events. Each one is either
//  - checked every second against the game (check: G => true/false), or
//  - met by an event the game reports with G.adv(type, arg) (ev + optional match), or
//  - met after an event happens for `count` different things (distinct) or `count` times (sum).
// An advancement with a parent unlocks only after its parent; progress toward it is kept until then.
import { B, I, itemDef, iconURL } from "./blocks.js";
import { Sound } from "./audio.js";

const has = (G, ...ids) => G.inv.slots.some(s => s && ids.includes(s.id));
const wearing = (G, ids) => [36, 37, 38, 39].some(i => G.inv.slots[i] && ids.includes(G.inv.slots[i].id));

export const CATEGORIES = ["Getting Started", "Farming", "Exploration", "Taming", "Machinery", "Combat & Bosses", "Forsaken World", "Lost Civilization", "Legacy Campaign"];
export const ADVANCEMENTS = [
  // building and getting started
  { id: "start", cat: "Getting Started", icon: B.LOG, title: "Blockhaven", desc: "Chop a log.", check: G => has(G, B.LOG, B.BIRCH_LOG, B.CRIMSON_STEM, B.WARPED_STEM) },
  { id: "bench", cat: "Getting Started", icon: B.TABLE, title: "Benchmark", desc: "Make a Workbench.", parent: "start", check: G => has(G, B.TABLE) },
  { id: "stone", cat: "Getting Started", icon: I.STONE_PICK, title: "Stone Age", desc: "Make a stone pickaxe.", parent: "bench", check: G => has(G, I.STONE_PICK) },
  { id: "iron", cat: "Getting Started", icon: I.IRON_INGOT, title: "Hot Stuff", desc: "Smelt an iron ingot.", parent: "stone", check: G => has(G, I.IRON_INGOT) },
  { id: "suit", cat: "Getting Started", icon: I.IRON_CHEST, title: "Suit Up", desc: "Wear a piece of iron armor or better.", parent: "iron", check: G => wearing(G, [I.IRON_HELMET, I.IRON_CHEST, I.IRON_LEGS, I.IRON_BOOTS, I.SKY_HELMET, I.SKY_CHEST, I.SKY_LEGS, I.SKY_BOOTS, I.DUSK_HELMET, I.DUSK_CHEST, I.DUSK_LEGS, I.DUSK_BOOTS]), reward: { xp: 10 } },
  { id: "sky", cat: "Getting Started", icon: I.SKYSHARD, title: "Shiny!", desc: "Find a Skyshard.", parent: "iron", check: G => has(G, I.SKYSHARD), reward: { xp: 20 } },
  { id: "dusk", cat: "Getting Started", icon: I.DUSK_INGOT, title: "Duskmetal", desc: "Make a Duskmetal Ingot.", parent: "sky", check: G => has(G, I.DUSK_INGOT), reward: { xp: 40 } },
  { id: "builder", cat: "Getting Started", icon: B.BRICKS, title: "Home Builder", desc: "Place 200 blocks.", parent: "start", ev: "place", count: 200, sum: true, reward: { xp: 15 } },
  { id: "sleep", cat: "Getting Started", icon: B.BED, title: "Sweet Dreams", desc: "Sleep through a night in a bed.", parent: "bench", ev: "sleep" },
  { id: "offhand", cat: "Getting Started", icon: I.SHIELD, title: "Two Hands", desc: "Hold something in your offhand.", parent: "iron", check: G => !!G.inv.slots[40] },
  // farming
  { id: "till", cat: "Farming", icon: I.WOOD_HOE, title: "Hoe Down", desc: "Turn grass or dirt into farmland.", ev: "till" },
  { id: "bread", cat: "Farming", icon: I.BREAD, title: "Bake Bread", desc: "Make bread from wheat.", parent: "till", check: G => has(G, I.BREAD) },
  { id: "foods", cat: "Farming", icon: I.STEAK, title: "Taste Tester", desc: "Eat 8 different foods.", parent: "till", ev: "eat", count: 8, reward: { xp: 15 } },
  { id: "golden", cat: "Farming", icon: I.GOLDEN_APPLE, title: "Golden Snack", desc: "Eat a Golden Apple.", parent: "foods", ev: "eat", match: id => id === I.GOLDEN_APPLE, reward: { xp: 20 } },
  { id: "breed", cat: "Farming", icon: I.WHEAT, title: "Matchmaker", desc: "Breed two animals.", ev: "breed" },
  { id: "breed5", cat: "Farming", icon: I.CARROT, title: "Big Family", desc: "Breed 5 different kinds of creatures.", parent: "breed", ev: "breed", count: 5, reward: { xp: 30 } },
  { id: "honey", cat: "Farming", icon: I.HONEY_BOTTLE, title: "Sweet Treat", desc: "Collect a Honey Bottle.", parent: "till", check: G => has(G, I.HONEY_BOTTLE) },
  { id: "fish", cat: "Farming", icon: I.FISHING_ROD, title: "Gone Fishing", desc: "Catch something with a Fishing Rod.", ev: "fish" },
  // exploration
  { id: "walk", cat: "Exploration", icon: I.LEATHER_BOOTS, title: "Wanderlust", desc: "Travel 2,000 blocks on foot.", check: G => (G.stats.walked || 0) >= 2000, progress: G => [Math.min(2000, Math.floor(G.stats.walked || 0)), 2000] },
  { id: "loot", cat: "Exploration", icon: B.CHEST, title: "Treasure Hunter", desc: "Open a treasure chest in a ruin or structure.", ev: "loot" },
  { id: "trade", cat: "Exploration", icon: I.JADE, title: "Fair Trade", desc: "Trade with a villager.", ev: "trade" },
  { id: "nether", cat: "Exploration", icon: B.EMBERRACK, title: "Into the Depths", desc: "Travel to the Ember Depths.", ev: "dim", match: d => d === "nether", reward: { xp: 20 } },
  { id: "eye", cat: "Exploration", icon: I.EYE, title: "Eye Spy", desc: "Throw an Eye of the Void to find a stronghold.", parent: "nether", ev: "eye" },
  { id: "end", cat: "Exploration", icon: B.HOLLOWSTONE, title: "The Hollow", desc: "Enter the Hollow.", parent: "eye", ev: "dim", match: d => d === "end", reward: { xp: 30 } },
  { id: "anchor", cat: "Exploration", icon: B.RESPAWN_ANCHOR, title: "Home Away From Home", desc: "Set your respawn point with a charged Respawn Anchor.", parent: "nether", ev: "anchor", reward: { xp: 15 } },
  { id: "lodestone", cat: "Exploration", icon: I.COMPASS, title: "Find Your Way", desc: "Link a Compass to a Lodestone.", parent: "nether", ev: "lodestone" },
  { id: "glide", cat: "Exploration", icon: I.GLIDER, title: "Sky Rider", desc: "Glide with Glider Wings.", parent: "end", ev: "glide", reward: { xp: 30 } },
  // taming
  { id: "tame", cat: "Taming", icon: I.BONE, title: "Best Friend", desc: "Tame a creature.", ev: "tame" },
  { id: "tame3", cat: "Taming", icon: I.SEEDS, title: "Animal Keeper", desc: "Tame 3 different kinds of creatures.", parent: "tame", ev: "tame", count: 3, reward: { xp: 25 } },
  { id: "ride", cat: "Taming", icon: I.SADDLE, title: "Giddy Up", desc: "Ride a tame, saddled Trotter.", parent: "tame", ev: "ride", reward: { xp: 15 } },
  { id: "boat", cat: "Taming", icon: I.BOAT, title: "Row, Row, Row", desc: "Climb into a boat.", ev: "boat" },
  // machinery
  { id: "furnace", cat: "Machinery", icon: B.FURNACE, title: "Fired Up", desc: "Make a Furnace.", check: G => has(G, B.FURNACE) },
  { id: "portal", cat: "Machinery", icon: B.OBSIDIAN, title: "Portal Builder", desc: "Light a portal frame with Flint and Steel.", parent: "furnace", ev: "portal", reward: { xp: 15 } },
  { id: "tnt", cat: "Machinery", icon: B.TNT, title: "Kaboom", desc: "Light a Blast Block.", parent: "furnace", ev: "tnt" },
  { id: "voidchest", cat: "Machinery", icon: B.VOID_CHEST, title: "Personal Vault", desc: "Open a Void Chest.", parent: "furnace", ev: "voidchest", reward: { xp: 20 } },
  { id: "beaconMax", cat: "Machinery", icon: B.SKY_BLOCK, title: "Beaconator", desc: "Power a Beacon with a full 4-layer pyramid.", parent: "beacon", ev: "beaconPower", match: lv => lv >= 4, reward: { xp: 100 } },
  { id: "beacon", cat: "Machinery", icon: B.BEACON, title: "Light the Way", desc: "Place a Beacon.", parent: "portal", ev: "beacon", reward: { xp: 50 } },
  // combat and bosses
  { id: "kill", cat: "Combat & Bosses", icon: I.WOOD_SWORD, title: "Monster Hunter", desc: "Defeat a monster.", ev: "kill", match: (sp, SPECIES) => SPECIES[sp] && SPECIES[sp].hostile },
  { id: "kill8", cat: "Combat & Bosses", icon: I.IRON_SWORD, title: "Monsters Hunted", desc: "Defeat 8 different kinds of monsters.", parent: "kill", ev: "kill", match: (sp, SPECIES) => SPECIES[sp] && SPECIES[sp].hostile, count: 8, reward: { xp: 50 } },
  { id: "block", cat: "Combat & Bosses", icon: I.SHIELD, title: "Shields Up", desc: "Block an attack with a Shield.", parent: "kill", ev: "block" },
  { id: "totem", cat: "Combat & Bosses", icon: I.TOTEM, title: "Second Chance", desc: "Let a Lifeward Totem save you from fainting.", parent: "kill", ev: "totem", reward: { xp: 30 } },
  { id: "blightking", cat: "Combat & Bosses", icon: I.RADIANT_STAR, title: "Blight Breaker", desc: "Defeat the Blightking.", parent: "kill", ev: "boss", match: s => s === "blightking", reward: { xp: 100 } },
  { id: "cindereye", cat: "Combat & Bosses", icon: I.CINDER_EYE, title: "Follow the Embers", desc: "Throw a Cinder Eye in the Ember Depths.", parent: "wyrm", ev: "cindereye" },
  { id: "citadel", cat: "Combat & Bosses", icon: B.CINDER_BRICKS, title: "Citadel of Cinders", desc: "Find Cindermaw's citadel.", parent: "cindereye", ev: "citadel", reward: { xp: 30 } },
  { id: "cinderwake", cat: "Combat & Bosses", icon: B.CINDER_ALTAR, title: "Wake the Dragon", desc: "Place a Cinder Eye in the Cinder Altar.", parent: "citadel", ev: "cinderwake" },
  { id: "cindermaw", cat: "Combat & Bosses", icon: B.CINDER_EGG, title: "The Final Flame", desc: "Defeat Cindermaw, the Ember Dragon. You beat Blockhaven's Survival story!", parent: "cinderwake", ev: "boss", match: s => s === "cindermaw", reward: { xp: 200 } },
  { id: "crown", cat: "Combat & Bosses", icon: I.CINDER_CROWN, title: "Crowned in Fire", desc: "Make the Cinder Crown.", parent: "cindermaw", check: G => G.inv.slots.some(s => s && s.id === I.CINDER_CROWN) },
  { id: "rekindled", cat: "Combat & Bosses", icon: I.EMBER_HEART, title: "Rekindled", desc: "Defeat Cindermaw a second time.", parent: "cindermaw", ev: "boss", match: s => s === "cindermawAgain" },
  { id: "lantern", cat: "Forsaken World", icon: I.PALE_LANTERN, title: "A Pale Light", desc: "Make a Pale Lantern from Pale Shards (found in Ember Depths fortresses).", check: G => G.inv.slots.some(s => s && s.id === I.PALE_LANTERN) },
  { id: "forsaken", cat: "Forsaken World", icon: B.WARD_STONE, title: "Into the Mist", desc: "Enter the Forsaken World.", parent: "lantern", ev: "dim", match: d => d === "forsaken", reward: { xp: 20 } },
  { id: "sighting", cat: "Forsaken World", icon: B.PALE_EFFIGY, title: "Someone Is Watching", desc: "See Herobrine for the first time.", parent: "forsaken", ev: "sighting" },
  { id: "notes", cat: "Forsaken World", icon: B.NOTE_STAND, title: "Pieces of the Past", desc: "Read 8 notes left by the people of Hollowmere.", parent: "forsaken", ev: "note", count: 8, reward: { xp: 30 } },
  { id: "explorer", cat: "Forsaken World", icon: I.COMPASS, title: "Vale Explorer", desc: "Find all 7 landmarks of the Forsaken World.", parent: "forsaken", ev: "landmark", count: 7, reward: { xp: 40 } },
  { id: "shrine1", cat: "Forsaken World", icon: I.SIGIL_HEARTH, title: "Safe Ground", desc: "Restore a ward shrine.", parent: "forsaken", ev: "shrine" },
  { id: "shrine3", cat: "Forsaken World", icon: I.WARD_HEART, title: "Wardkeeper", desc: "Restore all three ward shrines.", parent: "shrine1", ev: "shrine", count: 3, reward: { xp: 60 } },
  { id: "confront", cat: "Forsaken World", icon: B.PALE_ALTAR, title: "Face Him", desc: "Set the Ward Heart in the Pale Altar.", parent: "shrine3", ev: "confront" },
  { id: "banished", cat: "Forsaken World", icon: B.PALE_EFFIGY, title: "Banished", desc: "Banish Herobrine from the Forsaken World.", parent: "confront", ev: "banished", reward: { xp: 100 } },
  { id: "lostdeep", cat: "Lost Civilization", icon: B.DEEP_LIFT, title: "Going Down", desc: "Ride the Keeper lift into the Deep.", ev: "lostdeep", reward: { xp: 20 } },
  { id: "lostcity", cat: "Lost Civilization", icon: B.KEEPER_LAMP, title: "Echohold", desc: "Reach the Keepers' lost city.", parent: "lostdeep", ev: "lostcity", reward: { xp: 30 } },
  { id: "lostlore", cat: "Lost Civilization", icon: B.LORE_TABLET, title: "The Keepers Remember", desc: "Read 12 Keeper tablets, murals, or memories.", parent: "lostdeep", ev: "lostlore", count: 12, reward: { xp: 40 } },
  { id: "lostdistrict", cat: "Lost Civilization", icon: B.DARKSLATE_BRICKS, title: "City Surveyor", desc: "Discover 12 districts of Echohold.", parent: "lostcity", ev: "lostdistrict", count: 12, reward: { xp: 50 } },
  { id: "lostcache", cat: "Lost Civilization", icon: B.CHEST, title: "Finders, Keepers", desc: "Open 20 Keeper caches.", parent: "lostdeep", ev: "lostcache", count: 20, reward: { xp: 40 } },
  { id: "lostpuzzle", cat: "Lost Civilization", icon: B.KEEPER_SWITCH, title: "Keeper Engineer", desc: "Solve 5 Keeper puzzles.", parent: "lostcity", ev: "lostpuzzle", count: 5, reward: { xp: 40 } },
  { id: "lostsecret", cat: "Lost Civilization", icon: B.RESONANT_GLASS, title: "Off the Map", desc: "Find a secret place.", parent: "lostdeep", ev: "lostsecret" },
  { id: "lostwarden", cat: "Lost Civilization", icon: B.WARDEN_TROPHY, title: "At Rest", desc: "Bring the First Warden to rest.", parent: "lostcity", ev: "lostwarden", reward: { xp: 100 } },
  { id: "lostgate", cat: "Lost Civilization", icon: B.GATE_FRAME, title: "The First Gate", desc: "Fill, calibrate, and open the First Gate.", parent: "lostwarden", ev: "lostgate", reward: { xp: 60 } },
  { id: "expanse", cat: "Lost Civilization", icon: B.ECHOSTONE, title: "The Other Side", desc: "Step into the Echo Expanse.", parent: "lostgate", ev: "expanse" },
  { id: "lostanchor", cat: "Lost Civilization", icon: B.ANCHOR_STATION, title: "Loosening the Crown", desc: "Quiet all three forge anchors.", parent: "expanse", ev: "lostanchor", count: 3, reward: { xp: 60 } },
  { id: "lostfallen", cat: "Lost Civilization", icon: I.SENTINEL_HAMMER, title: "The Last Royal Guard", desc: "Bring the Fallen Sentinel in the Royal Treasury to rest.", parent: "lostcity", ev: "lostfallen", reward: { xp: 80 } },
  { id: "royalvault", cat: "Lost Civilization", icon: B.GOLD_BLOCK, title: "The Crown's Riddle", desc: "Open the Hidden Royal Vault.", parent: "lostcity", ev: "lostpuzzle", match: s => s === "royalVault", reward: { xp: 60 } },
  { id: "hushguard", cat: "Lost Civilization", icon: I.HUSH_HELMET, title: "Quiet as Stone", desc: "Wear all four pieces of Hushguard armor.", parent: "lostcity", check: G => [36, 37, 38, 39].every(i => G.inv.slots[i] && [I.HUSH_HELMET, I.HUSH_CHEST, I.HUSH_LEGS, I.HUSH_BOOTS].includes(G.inv.slots[i].id)), reward: { xp: 60 } },
  { id: "lostsovereign", cat: "Lost Civilization", icon: B.SOVEREIGN_TROPHY, title: "One Whole Note", desc: "Calm the Resonant Sovereign.", parent: "lostanchor", ev: "lostsovereign", reward: { xp: 200 } },
  { id: "temple", cat: "Lost Civilization", icon: B.SUN_GLYPH, title: "Temple Explorer", desc: "Enter one of the three Keeper temples.", ev: "temple", reward: { xp: 20 } },
  { id: "templeboss", cat: "Lost Civilization", icon: B.RELIC_PEDESTAL, title: "Guardians at Rest", desc: "Bring all three temple guardians to rest.", parent: "temple", ev: "templeboss", count: 3, reward: { xp: 150 } },
  { id: "relics", cat: "Lost Civilization", icon: I.SOLAR_SEAL, title: "Keeper of Relics", desc: "Take the Tidal Heart, the Verdant Lens, and the Solar Seal.", parent: "temple", ev: "relic", count: 3, reward: { xp: 100 } },
  { id: "wyrm", cat: "Combat & Bosses", icon: B.WYRM_EGG, title: "Wyrm Slayer", desc: "Defeat the Hollow Wyrm.", parent: "kill", ev: "boss", match: s => s === "dragon", reward: { xp: 100 } },
  // the Legacy Campaign (story mode)
  { id: "cplegend", cat: "Legacy Campaign", icon: I.RELIC_EARTH, title: "A Legend Begins", desc: "Defeat a Legacy Campaign chapter boss and claim its Relic.", check: G => !!(G.meta && G.meta.campaign && G.story.campaign && ["pharaoh", "titan", "leviathan", "tempest", "cindermaw", "herobrine", "sovereign", "wyrm"].some(b => (G.story.campaign.bosses || {})[b])), reward: { xp: 50 } },
  { id: "cpwhole", cat: "Legacy Campaign", icon: I.RELIC_SHADOWS, title: "The Whole Story", desc: "Play the Legacy Campaign from Chapter 1 all the way to the homecoming at the end of Chapter 8 without skipping a chapter.", parent: "cplegend", check: G => !!(G.meta && G.meta.campaign && G.story.campaign && G.story.campaign.fullRun), reward: { xp: 500 } },
  { id: "cpsky", cat: "Legacy Campaign", icon: I.CROWN_KEY, title: "Above the Clouds", desc: "Free the Sky Sovereign in Skyreach and win the Crown Key.", parent: "cplegend", check: G => !!(G.meta && G.meta.campaign && G.story.campaign && G.story.campaign.bosses && G.story.campaign.bosses.skysov), reward: { xp: 150 } },
  { id: "cpking", cat: "Legacy Campaign", icon: I.RELIC_VOID, title: "The Forgotten King", desc: "Defeat the Forgotten King in the Throne Court of the Ruined Capital.", parent: "cpsky", check: G => !!(G.meta && G.meta.campaign && G.story.campaign && G.story.campaign.bosses && G.story.campaign.bosses.king), reward: { xp: 300 } },
  { id: "cpfree", cat: "Legacy Campaign", icon: B.GOLD_BLOCK, title: "The King Set Free", desc: "Choose to set the Forgotten King free.", parent: "cpking", ev: "cpending", match: s => s === "free", reward: { xp: 100 } },
  { id: "cpbanish", cat: "Legacy Campaign", icon: B.OBSIDIAN, title: "The King Banished", desc: "Choose to banish the Forgotten King into the Void.", parent: "cpking", ev: "cpending", match: s => s === "banish", reward: { xp: 100 } },
  { id: "cpboth", cat: "Legacy Campaign", icon: I.RELIC_SHADOWS, title: "Both Sides of the Story", desc: "See both endings of the Legacy Campaign.", parent: "cpking", check: G => !!(G.meta && G.meta.campaign && G.story.campaign && G.story.campaign.endings && G.story.campaign.endings.free && G.story.campaign.endings.banish), reward: { xp: 200 } },
];
const BY_ID = Object.fromEntries(ADVANCEMENTS.map(a => [a.id, a]));

export const Adv = {
  G: null, species: {}, data: { done: {}, prog: {}, met: {} },
  init(G, species, hooks) { this.G = G; this.species = species; this.hooks = hooks; },
  load(data) { this.data = { done: {}, prog: {}, met: {}, ...(data || {}) }; this.pollT = 0; },
  toJSON() { return this.data; },
  done(id) { return !!this.data.done[id]; },
  // the game reports something that happened
  event(type, arg) {
    if (!this.G || !this.G.meta || this.G.mode !== "survival") return;
    for (const a of ADVANCEMENTS) {
      if (a.ev !== type || this.data.done[a.id] || this.data.met[a.id]) continue;
      if (a.match && !a.match(arg, this.species)) continue;
      if (a.count) {
        if (a.sum) this.data.prog[a.id] = (this.data.prog[a.id] || 0) + 1;
        else { const list = this.data.prog[a.id] || (this.data.prog[a.id] = []); if (!list.includes(arg)) list.push(arg); }
        if (this.count(a) < a.count) continue;
      }
      this.data.met[a.id] = 1;
    }
    this.unlockReady();
  },
  count(a) { const p = this.data.prog[a.id]; return a.sum ? p || 0 : (p || []).length; },
  // called about once a second from the game loop
  poll(dt) {
    if ((this.pollT = (this.pollT || 0) + dt) < 1) return;
    this.pollT = 0;
    if (!this.G || this.G.mode !== "survival") return;
    for (const a of ADVANCEMENTS) if (a.check && !this.data.done[a.id] && !this.data.met[a.id] && a.check(this.G)) this.data.met[a.id] = 1;
    this.unlockReady();
  },
  unlockReady() {
    let again = true;
    while (again) {
      again = false;
      for (const a of ADVANCEMENTS) {
        if (this.data.done[a.id] || !this.data.met[a.id] || (a.parent && !this.data.done[a.parent])) continue;
        this.data.done[a.id] = Date.now(); delete this.data.met[a.id]; again = true;
        this.announce(a);
        if (a.reward && a.reward.xp) this.hooks.xp(a.reward.xp);
        if (a.reward && a.reward.item) this.hooks.give(a.reward.item[0], a.reward.item[1]);
      }
    }
  },
  announce(a) {
    const box = document.getElementById("advToasts");
    if (!box) return;
    const t = document.createElement("div"); t.className = "adv-toast";
    t.innerHTML = `<img src="${iconURL(a.icon)}" alt=""><div><small>Advancement made!</small><b></b></div>`;
    t.querySelector("b").textContent = a.title;
    box.appendChild(t); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => t.remove(), 4200);
    Sound.levelUp();
  },
  // the advancement screen
  html(cat) {
    const total = ADVANCEMENTS.length, got = ADVANCEMENTS.filter(a => this.data.done[a.id]).length;
    const tabs = CATEGORIES.map(c => { const n = ADVANCEMENTS.filter(a => a.cat === c), d = n.filter(a => this.data.done[a.id]).length; return `<button class="chip-btn" data-advcat="${c}" aria-pressed="${c === cat}">${c} ${d}/${n.length}</button>`; }).join("");
    const cards = ADVANCEMENTS.filter(a => a.cat === cat).map(a => {
      const done = this.data.done[a.id], parent = a.parent && BY_ID[a.parent];
      let status;
      if (done) status = `<span class="adv-ok">✔ Unlocked ${new Date(done).toLocaleDateString()}</span>`;
      else if (this.data.met[a.id] && parent) status = `<span class="adv-wait">Done! Unlocks after “${parent.title}”</span>`;
      else if (a.count) status = `<span>${Math.min(a.count, this.count(a))} / ${a.count}</span>`;
      else if (a.progress) { const [n, m] = a.progress(this.G); status = `<span>${n} / ${m}</span>`; }
      else status = parent && !this.data.done[a.parent] ? `<span>Needs “${parent.title}” first</span>` : `<span>Not yet</span>`;
      const rw = a.reward && a.reward.xp ? ` <span class="adv-rw">+${a.reward.xp} XP</span>` : "";
      return `<div class="adv ${done ? "done" : ""}"><img src="${iconURL(a.icon)}" alt=""><div><b>${a.title}</b>${rw}<p>${a.desc}</p>${status}</div></div>`;
    }).join("");
    return `<div class="inv-card adv-card"><h3>Advancements <span class="note" style="color:#444">${got} of ${total} unlocked</span></h3>
      <div class="filters">${tabs}</div><div class="adv-grid">${cards}</div>
      <p class="help">Advancements unlock as you play. Some need an earlier one first. Press <b>L</b> or <b>Esc</b> to close.</p></div>`;
  }
};
