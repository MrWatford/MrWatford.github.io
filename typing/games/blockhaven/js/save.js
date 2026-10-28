// Saves worlds on this device only (IndexedDB), with a fallback when the browser blocks storage.
// Nothing is ever sent anywhere. Worlds can also be downloaded as a file and loaded back.
export const SAVE_VERSION = 2;
const DB_NAME = "blockhaven-worlds", META = "meta", DATA = "data";
let dbPromise = null, memory = null;   // memory = fallback store when IndexedDB isn't available

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { const db = req.result; db.createObjectStore(META, { keyPath: "id" }); db.createObjectStore(DATA, { keyPath: "id" }); };
      req.onsuccess = () => resolve(req.result);
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
  async list() {
    const db = await openDB();
    const all = db ? await tx(db, META, "readonly", s => s.getAll()) : [...memory.meta.values()];
    return (all || []).filter(m => m && m.id).sort((a, b) => (b.played || 0) - (a.played || 0));
  },
  async load(id) {
    const db = await openDB();
    const meta = db ? await tx(db, META, "readonly", s => s.get(id)) : memory.meta.get(id);
    const data = db ? await tx(db, DATA, "readonly", s => s.get(id)) : memory.data.get(id);
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
    if (!db) { memory.meta.set(meta.id, meta); memory.data.set(meta.id, data); return false; }
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
    await new Promise((resolve) => { const t = db.transaction([META, DATA], "readwrite"); t.objectStore(META).delete(id); t.objectStore(DATA).delete(id); t.objectStore(DATA).delete("backup-v1-" + id); t.oncomplete = t.onerror = resolve; });
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
    const w = upgrade(obj);
    w.id = newId(); w.played = Date.now();
    await this.save(w);
    return w;
  }
};

export const newId = () => "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function split(w) {
  const meta = { id: w.id, name: w.name, seed: w.seed, mode: w.mode, created: w.created, played: w.played, version: SAVE_VERSION, day: w.day || 1, gen: w.gen || 1 };
  const data = { id: w.id, player: w.player, inventory: w.inventory, dims: w.dims, xp: w.xp || 0, settings: w.settings, time: w.time, tips: w.tips };
  return { meta, data };
}
// Older save versions get converted here when the game is updated
function upgrade(w) {
  // version 1 → 2: block changes and containers move into the "overworld" dimension; land shapes stay the same (gen 1)
  if (!w.dims) { w.dims = { overworld: { mods: w.mods || {}, containers: w.containers || [] } }; w.gen = w.gen || 1; }
  delete w.mods; delete w.containers;
  w.version = SAVE_VERSION;
  w.inventory = Array.isArray(w.inventory) ? w.inventory : [];
  w.mode = w.mode === "creative" ? "creative" : "survival";
  w.settings = { difficulty: "easy", griefing: true, keepInv: true, ...(w.settings || {}) };
  return w;
}

// Small settings live in localStorage
const SETTINGS_KEY = "blockhaven-settings";
export const DEFAULT_SETTINGS = { sensitivity: 1, volume: 0.6, muted: false, renderDist: 4, quality: "fast", fov: 72, reducedMotion: false };
export function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch (e) { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* storage blocked: settings last until the page closes */ } }
