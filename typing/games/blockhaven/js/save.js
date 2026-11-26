// Saves worlds on this device only (IndexedDB), with a fallback when the browser blocks storage.
// Nothing is ever sent anywhere. Worlds can also be downloaded as a file and loaded back.
import { validBondPreferences } from "./leviathan-bonds.js";
import { validArmorShieldRecord } from "./leviathan-armor-effects.js";
import { validStormCall } from "./leviathan-storm.js";
import { DESERT_VAULT_LAYOUT, validDesertVaultProgress } from "./desert-vaults.js";
import { SANDS_LANDMARK_LAYOUT } from "./hollow-sands-landmarks.js";
import { OBSIDIAN_BADLANDS_LAYOUT } from "./obsidian-badlands.js";
import { OBSIDIAN_VENT_LAYOUT } from "./obsidian-vent.js";
import { SOLKARA_SCENERY_LAYOUT } from "./solkara-scenery.js";
import { restoreWildlifeJournal } from "./wildlife-journal.js";
import { LOST_WORLD_REGIONS, isLostWorldDimension, isLostWorldRegion } from "./lost-world-regions.js";
import { GODZILLA_CALDERA, GODZILLA_START } from "./godzilla-caldera.js";
import { validGodzillaRecord } from "./godzilla-encounter.js";
import { validExpedition } from "./lost-world-campaign.js";
import { LOST_WORLD_GEN } from "./lost-world.js";
import { applyChallengeRewards, challengeSummary, checkChallengeWrite } from "./ultra-hardcore.js";
import { validGateway } from "./forsaken-gateway.js";
import { validFallen } from "./forsaken-fallen.js";
import { validPersonalGates } from "./forsaken-personal-gates.js";
import { validReign, reignWon, applyReignProfile } from "./forsaken-reign.js";
import { validFortress } from "./forsaken-fortress.js";
import { KingdomTerrain, validKingdomLayout } from "./forsaken-kingdom.js";
export const SAVE_VERSION = 4;
const DB_NAME = "blockhaven-worlds", META = "meta", DATA = "data", PROFILE = "profile", RUNS = "ultra-runs";
let dbPromise = null, memory = null;   // memory = fallback store when IndexedDB isn't available

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = ({ oldVersion }) => {
        const db = req.result;
        if (oldVersion < 1) {
          db.createObjectStore(META, { keyPath: "id" });
          db.createObjectStore(DATA, { keyPath: "id" });
        }
        db.createObjectStore(PROFILE, { keyPath: "id" });
        db.createObjectStore(RUNS, { keyPath: "id" });
      };
      req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
      req.onerror = req.onblocked = () => resolve(null);
    } catch (e) { resolve(null); }
  }).then(db => { if (!db) memory = memory || { meta: new Map(), data: new Map() }; return db; });
  return dbPromise;
}
const tx = (db, store, mode, fn) => new Promise((resolve, reject) => {
  const t = db.transaction(store, mode), s = t.objectStore(store), r = fn(s);
  t.oncomplete = () => resolve(r && r.result); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error);
});

export const Saves = {
  async persistent() { return !!(await openDB()); },
  async profile() {
    const db = await openDB();
    return db ? await tx(db, PROFILE, "readonly", s => s.get("local")) : undefined;
  },
  async recordReignProfile(id) {
    const db=await openDB();
    if (!db) return;
    return new Promise((resolve,reject)=>{
      const tr=db.transaction([META,DATA,PROFILE],"readwrite");
      const profileStore=tr.objectStore(PROFILE), meta=tr.objectStore(META).get(id), data=tr.objectStore(DATA).get(id);
      let result;
      data.onsuccess=()=>{
        if (meta.result?.mode!=="survival" || meta.result?.campaign || !reignWon(data.result?.story?.fw)) return;
        const old=profileStore.get("local");
        old.onsuccess=()=>{ result=applyReignProfile(old.result); profileStore.put(result); };
      };
      tr.oncomplete=()=>resolve(result);
      tr.onerror=tr.onabort=()=>reject(tr.error || new Error("The profile update was interrupted."));
    });
  },
  async challengeHistory() {
    const db = await openDB();
    return db ? await tx(db, RUNS, "readonly", s => s.getAll()) : [];
  },
  async saveChallenge(world) {
    const db = await openDB();
    if (!db) throw new Error("Ultra Hardcore requires browser storage for its one-life saves and rewards.");
    return new Promise((resolve, reject) => {
      const t = db.transaction([META, DATA, PROFILE, RUNS], "readwrite");
      const metaStore = t.objectStore(META), dataStore = t.objectStore(DATA);
      const profileStore = t.objectStore(PROFILE), runs = t.objectStore(RUNS);
      let profile, failure;
      const old = dataStore.get(world.id);
      old.onsuccess = () => {
        try {
          checkChallengeWrite(old.result?.ultra, world.ultra);
          if (old.result && !old.result.ultra) throw new Error("The world ID is already in use.");
          const { meta, data } = split(world);
          data.ultra = { ...world.ultra, revision: world.ultra.revision + 1 };
          metaStore.put(meta);
          dataStore.put(data);
          if (data.ultra.status !== "active") runs.put(challengeSummary(world));
          const current = profileStore.get("local");
          current.onsuccess = () => {
            profile = applyChallengeRewards(current.result, world);
            profileStore.put(profile);
          };
        } catch (error) { failure = error; t.abort(); }
      };
      t.oncomplete = () => resolve(profile);
      t.onabort = t.onerror = () => reject(failure || t.error || new Error("The checkpoint could not be saved."));
    });
  },
  async list() {
    const db = await openDB();
    const all = db ? await tx(db, META, "readonly", s => s.getAll()) : [...memory.meta.values()];
    return (all || []).filter(m => m && m.id).sort((a, b) => (b.played || 0) - (a.played || 0));
  },
  async load(id) {
    const db = await openDB();
    // Read both halves from one committed version, even while autosave runs.
    const [meta, data] = db ? await new Promise((resolve, reject) => {
      const t = db.transaction([META, DATA], "readonly");
      const metaRequest = t.objectStore(META).get(id), dataRequest = t.objectStore(DATA).get(id);
      t.oncomplete = () => resolve([metaRequest.result, dataRequest.result]);
      t.onerror = t.onabort = () => reject(t.error || new Error("The world load was interrupted."));
    }) : structuredClone([memory.meta.get(id), memory.data.get(id)]);
    if (!meta || !data) throw new Error("This world could not be found.");
    // keep an untouched copy of an older save before it is converted to the new format
    if ((meta.version || 1) < SAVE_VERSION && db) {
      const backupId = "backup-v" + (meta.version || 1) + "-" + id;
      const has = await tx(db, DATA, "readonly", s => s.get(backupId));
      if (!has) await tx(db, DATA, "readwrite", s => s.put({ ...data, id: backupId, meta: { ...meta } }));
    }
    return upgrade({ ...data, ...meta });
  },
  async save(world) {
    const { meta, data } = split(world);
    const db = await openDB();
    if (!db) {
      const [metaCopy, dataCopy] = structuredClone([meta, data]);
      memory.meta.set(meta.id, metaCopy); memory.data.set(meta.id, dataCopy);
      return false;
    }
    await new Promise((resolve, reject) => {
      const t = db.transaction([META, DATA], "readwrite");
      t.objectStore(META).put(meta); t.objectStore(DATA).put(data);
      t.oncomplete = resolve; t.onerror = () => reject(t.error);
    });
    return true;
  },
  async remove(id) {
    const db = await openDB();
    if (!db) { memory.meta.delete(id); memory.data.delete(id); return; }
    await new Promise((resolve, reject) => {
      const t = db.transaction([META, DATA], "readwrite");
      t.objectStore(META).delete(id);
      const data = t.objectStore(DATA);
      data.delete(id);
      for (const version of [1, 2, 3]) data.delete("backup-v" + version + "-" + id);
      t.oncomplete = resolve;
      t.onabort = () => reject(t.error || new Error("The delete was interrupted."));
    });
  },
  exportFile(world) {
    const blob = new Blob([JSON.stringify({ blockhaven: SAVE_VERSION, ...world })], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "blockhaven-" + String(world.name || "world").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  async importFile(file) {
    let obj;
    try { obj = JSON.parse(await file.text()); } catch (e) { throw new Error("That file isn't a Blockhaven world."); }
    if (!obj || !obj.blockhaven || !obj.seed || !obj.name) throw new Error("That file isn't a Blockhaven world.");
    if (obj.ultra || obj.ultraStatus) throw new Error("Ultra Hardcore runs can only be resumed from their original browser save.");
    const w = upgrade(obj);
    validateDimensions(w.dims);
    const reign=w.story?.fw?.reign;
    if (reign!==undefined && !validReign(reign)) throw new Error("This world file contains an invalid Convergence encounter.");
    const personal=w.dims.overworld?.personalForsaken;
    if (personal!==undefined && !validPersonalGates(personal)) throw new Error("This world file contains invalid personal Forsaken gateways.");
    const gateway = w.dims.overworld?.forsakenGateway;
    if (gateway != null && !validGateway(gateway, w.id)) throw new Error("This world file contains an invalid Forsaken Gateway.");
    const kingdom = w.dims.forsaken?.kingdom;
    if (kingdom !== undefined && !validKingdomLayout(kingdom, w.seed)) throw new Error("This world file contains an unsupported Forsaken Kingdom layout.");
    const fallen = w.dims.forsaken?.fallen;
    if (fallen !== undefined && (!kingdom || !validFallen(fallen, new KingdomTerrain(kingdom))))
      throw new Error("This world file contains an invalid Fallen Kingdom layout.");
    const fortress = w.dims.forsaken?.fortress;
    if (fortress !== undefined && (!kingdom || !validFortress(fortress, new KingdomTerrain(kingdom), fallen?.sites)))
      throw new Error("This world file contains an invalid Forsaken Fortress layout.");
    w.id = newId(); w.played = Date.now();
    if (gateway) gateway.worldId = w.id;
    await this.save(w);
    return w;
  }
};

function validateLeviathan(expansion) {
  if (expansion === undefined) return;
  if (!isRecord(expansion)) {
    throw new Error("This world file contains invalid Leviathan progress.");
  }
  if (!validStormCall(expansion.stormCall)) throw new Error("This world file contains an invalid called sandstorm.");
  if (!validArmorShieldRecord(expansion.armorShield)) throw new Error("This world file contains an invalid legendary armor shield.");
  const flags = ["discovered", "relics", "sandsLore", "sandsRegions", "solkaraLore"];
  if (expansion.gatewayDim !== undefined && !["desert", "solkara_sanctuary"].includes(expansion.gatewayDim)) {
    throw new Error("This world file contains an invalid Solkara gateway link.");
  }
  if (flags.some(key => expansion[key] !== undefined &&
    (!isRecord(expansion[key]) || Object.values(expansion[key]).some(value => typeof value !== "boolean"))) ||
    ["shrineRead", "stormWitnessed", "hornCrafted"].some(key =>
      expansion[key] !== undefined && typeof expansion[key] !== "boolean") ||
    ["bladeReadyAt", "armorReadyAt"].some(key =>
      expansion[key] !== undefined && (!Number.isFinite(expansion[key]) || expansion[key] < 0))) {
    throw new Error("This world file contains invalid Leviathan discoveries or cooldowns.");
  }
  const annex = expansion.annex;
  if (annex !== undefined && (!isRecord(annex) ||
    (annex.next !== undefined && (!Number.isInteger(annex.next) || annex.next < 0 || annex.next > 3)) ||
    ["solved", "coreClaimed", "gateOpen"].some(key => annex[key] !== undefined && typeof annex[key] !== "boolean"))) {
    throw new Error("This world file contains invalid Solkara puzzle progress.");
  }
  const wing = expansion.wing;
  if (wing !== undefined && (!isRecord(wing) ||
    ["trapDisabled", "vaultCleared", "vaultClaimed"].some(key => wing[key] !== undefined && typeof wing[key] !== "boolean") ||
    (wing.trapReadyAt !== undefined && (!Number.isFinite(wing.trapReadyAt) || wing.trapReadyAt < 0)))) {
    throw new Error("This world file contains invalid Solkara library progress.");
  }
  const sites = expansion.sites;
  if (sites !== undefined && (!isRecord(sites) || Object.entries(sites).some(([key, s]) =>
    !isRecord(s) || ![s.x, s.y, s.z].every(Number.isSafeInteger) ||
    s.x % 16 !== 0 || s.z % 16 !== 0 || s.y < 2 || s.y > 68 ||
    (s.vaultLayout !== undefined && s.vaultLayout !== DESERT_VAULT_LAYOUT) ||
    (s.volcanicLayout !== undefined && (key !== "citadel" || s.volcanicLayout !== OBSIDIAN_BADLANDS_LAYOUT)) ||
    (s.ventLayout !== undefined && (key !== "citadel" || s.ventLayout !== OBSIDIAN_VENT_LAYOUT || s.volcanicLayout !== OBSIDIAN_BADLANDS_LAYOUT))
  ))) throw new Error("This world file contains invalid desert relic sites.");
  if (!validDesertVaultProgress(expansion.vaults, sites)) throw new Error("This world file contains invalid desert vault progress.");
  const { dune, obsidian, ancient, companion } = expansion;
  for (const record of [dune, obsidian]) if (isRecord(record) && !validBondPreferences(record)) {
    throw new Error("This world file contains invalid Leviathan bond preferences.");
  }
  if (companion !== undefined && (!isRecord(companion) || typeof companion.uid !== "string" || !companion.uid ||
      !Number.isFinite(companion.hp) || companion.hp <= 0 || companion.hp > 24 ||
      typeof companion.sitting !== "boolean" ||
      (companion.readyAt !== undefined && (!Number.isFinite(companion.readyAt) || companion.readyAt < 0)))) {
    throw new Error("This world file contains invalid Ancient companion progress.");
  }
  if (ancient !== undefined && (!isRecord(ancient) || !Number.isFinite(ancient.hp) || ancient.hp < 0 || ancient.hp > 400 ||
      (ancient.rewardsClaimed !== undefined && (typeof ancient.rewardsClaimed !== "boolean" || ancient.defeated !== true)) ||
      (ancient.defeated !== undefined && typeof ancient.defeated !== "boolean") ||
      (ancient.hp === 0) !== (ancient.defeated === true))) {
    throw new Error("This world file contains invalid Ancient Leviathan progress.");
  }
  if (obsidian !== undefined && (!isRecord(obsidian) || !Number.isFinite(obsidian.hp) || obsidian.hp < 0 || obsidian.hp > 260 ||
      (obsidian.defeated !== undefined && typeof obsidian.defeated !== "boolean") ||
      ["bonded", "saddled", "ritualOffered"].some(k => obsidian[k] !== undefined && typeof obsidian[k] !== "boolean") ||
      (obsidian.recallAt !== undefined && (!Number.isFinite(obsidian.recallAt) || obsidian.recallAt < 0)) ||
      (obsidian.bonded && obsidian.defeated) ||
      (obsidian.hp === 0) !== (obsidian.defeated === true))) {
    throw new Error("This world file contains invalid Obsidian Leviathan progress.");
  }
  if (dune !== undefined && (!isRecord(dune) || !Number.isFinite(dune.hp) || dune.hp < 0 || dune.hp > 180 ||
      (dune.defeated !== undefined && typeof dune.defeated !== "boolean") ||
      (dune.bonded !== undefined && typeof dune.bonded !== "boolean") ||
      (dune.saddled !== undefined && typeof dune.saddled !== "boolean") ||
      (dune.recallAt !== undefined && (!Number.isFinite(dune.recallAt) || dune.recallAt < 0)) ||
      (dune.bonded && dune.defeated) ||
      (dune.hp === 0) !== (dune.defeated === true))) {
    throw new Error("This world file contains invalid Dune Leviathan progress.");
  }
}

export const newId = () => "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function split(w) {
  const meta = { id: w.id, name: w.name, seed: w.seed, mode: w.mode, created: w.created, played: w.played, version: SAVE_VERSION, day: w.day || 1, gen: w.gen || 1, hardcore: !!w.hardcore, hardcoreOver: !!w.hardcoreOver, campaign: w.campaign || null };
  if (w.ultra) meta.ultraStatus = w.ultra.fallen ? (w.ultra.status === "completed" ? "completed-fallen" : "failed") : w.ultra.status;
  if (w.lostWorldGen !== undefined) {
    meta.lostWorldGen = w.lostWorldGen;
    if (w.story?.lostWorld) meta.lostWorldExpedition = true;
  }
  const data = { id: w.id, player: w.player, inventory: w.inventory, dims: w.dims, xp: w.xp || 0, settings: w.settings, time: w.time, tips: w.tips, voidInv: w.voidInv, adv: w.adv, story: w.story, stats: w.stats, ...(w.ultra ? { ultra: w.ultra } : {}) };
  return { meta, data };
}
const isRecord = v => v && typeof v === "object" && !Array.isArray(v);
function validateDimensions(dims) {
  const list = v => v == null || Array.isArray(v);
  const pairs = v => list(v) && (!v || v.every(pair => Array.isArray(pair) && pair.length === 2));
  if (!isRecord(dims) || Object.values(dims).some(d =>
    !isRecord(d) || !pairs(d.containers) || !list(d.visited) || !list(d.crops) ||
    !list(d.newGen) || !list(d.beacons) || !list(d.drops) || !list(d.villages) ||
    (d.mods != null && (!isRecord(d.mods) || !Object.values(d.mods).every(pairs)))
  )) throw new Error("This world file contains invalid dimension data.");
  const layout = dims.hollow_sands?.sandsLandmarks;
  if (layout !== undefined && layout !== SANDS_LANDMARK_LAYOUT) throw new Error("This world file contains an unsupported Hollow Sands layout.");
  if (Object.entries(dims).some(([dim, data]) => data.solkaraScenery !== undefined &&
      (!["desert", "solkara_sanctuary", "hollow_sands"].includes(dim) || data.solkaraScenery !== SOLKARA_SCENERY_LAYOUT))) {
    throw new Error("This world file contains an unsupported Solkara scenery layout.");
  }
}

// Older save versions get converted here when the game is updated
function upgrade(w) {
  if ((w.lostWorldGen !== undefined && w.lostWorldGen !== LOST_WORLD_GEN) ||
      (w.lostWorldGen === undefined && (isLostWorldDimension(w.player?.dim) || isLostWorldRegion(w.player?.spawn?.dim) || Object.keys(w.dims || {}).some(isLostWorldRegion))) ||
      (w.lostWorldGen !== undefined && (w.hardcore || w.campaign))) {
    throw new Error("This world has an unsupported Lost World configuration.");
  }
  // version 1 → 2: block changes and containers move into the "overworld" dimension; land shapes stay the same (gen 1)
  if (!w.dims) { w.dims = { overworld: { mods: w.mods || {}, containers: w.containers || [] } }; w.gen = w.gen || 1; }
  for (const [dim, region] of Object.entries(LOST_WORLD_REGIONS)) {
    if (Object.hasOwn(w.dims, dim) && w.dims[dim]?.layout !== region.layout) {
      throw new Error("This world has an unsupported terrain version for " + region.name + ".");
    }
  }
  delete w.mods; delete w.containers;
  // version 2 → 3: offhand slot (inventory index 40), personal Void Chest storage, fullness (saturation), Hardcore, advancements, story progress
  w.inventory = Array.isArray(w.inventory) ? w.inventory : [];
  w.voidInv = Array.isArray(w.voidInv) ? w.voidInv.slice(0, 27) : [];
  while (w.voidInv.length < 27) w.voidInv.push(null);
  w.adv = w.adv && typeof w.adv === "object" ? { done: {}, prog: {}, ...w.adv } : { done: {}, prog: {} };
  w.story = w.story && typeof w.story === "object" ? w.story : {};
  if (Object.hasOwn(w.story, "lostWorld") && (w.lostWorldGen !== LOST_WORLD_GEN || !validExpedition(w.story.lostWorld))) {
    throw new Error("This world contains invalid Lost World expedition progress.");
  }
  const fight = w.story.caldera, expeditionStage = w.story.lostWorld?.stage;
  if (fight !== undefined && (!w.lostWorldGen || !Object.hasOwn(w.dims, GODZILLA_CALDERA) || !validGodzillaRecord(fight)) ||
      expeditionStage > GODZILLA_START && (!fight || (expeditionStage === GODZILLA_START + 2) !== (fight.hp === 0)) ||
      fight && expeditionStage <= GODZILLA_START) {
    throw new Error("This world contains invalid Godzilla encounter progress.");
  }
  validateLeviathan(w.story.leviathan);
  if (Object.hasOwn(w.story, "wildlife")) w.story = { ...w.story, wildlife: restoreWildlifeJournal(w.story.wildlife) };
  if (w.player && w.player.sat === undefined) w.player.sat = 5;
  w.hardcore = !!w.hardcore; w.hardcoreOver = !!w.hardcoreOver;
  // version 3 → 4: Sparkworks (signal timers and comparator outputs live in each dimension as dims[dim].rs; nothing old needs changing)
  w.version = SAVE_VERSION;
  w.mode = w.mode === "creative" ? "creative" : w.mode === "spectator" && w.hardcore ? "spectator" : "survival";
  w.settings = { difficulty: "easy", griefing: true, keepInv: true, fireSpread: true, liquidFlow: true, weather: true, ...(w.settings || {}) };
  if (w.hardcore) { w.settings.difficulty = "hard"; w.settings.keepInv = false; }
  return w;
}

// Small settings live in localStorage
const SETTINGS_KEY = "blockhaven-settings";
export const DEFAULT_SETTINGS = { sensitivity: 1, volume: 0.6, music: 0.5, muted: false, renderDist: 4, quality: "fast", fx: "medium", fov: 72, reducedMotion: false, keySwap: "KeyX", skin: "explorer", fwAmbient: 0.8, fwSudden: 0.8, fwEffects: true, fwShake: true, fwWords: true, unlocked: [], titleCinema: true, titleParticles: true, titleMotion: true, titleCaptions: true, titleReduce: "system" };
export function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch (e) { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: settings last until the page closes */ } }
