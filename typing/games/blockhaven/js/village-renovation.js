import { B, CHUNK, HEIGHT, idOf } from "./blocks.js";

import { LEGACY_CHUNK_GEN } from "./worldgen.js";
import { VILLAGE_TERRAIN_GEN } from "./village-overhaul.js";

const NATIVE = new Set(["villager", "farmer", "fletcher", "shepherd", "cleric", "smith", "scribe", "beekeeper", "golem"]);
const keyAt = (x, z) => Math.floor(x / CHUNK) + "," + Math.floor(z / CHUNK);
const blockKey = p => p && Number.isFinite(p.x) && Number.isFinite(p.z) ? keyAt(p.x, p.z) : null;
const supports = meta => !meta?.campaign && !meta?.lostWorldGen &&
  meta?.gen >= 1 && meta.gen < VILLAGE_TERRAIN_GEN;

function protection(data, player) {
  const blocked = new Set();
  for (const [k, edits] of Object.entries(data.mods || {})) if (edits?.length) blocked.add(k);
  for (const [position] of data.containers || []) {
    const [x, , z] = String(position).split(",").map(Number);
    if (Number.isFinite(x) && Number.isFinite(z)) blocked.add(keyAt(x, z));
  }
  for (const [key, entities] of Object.entries(data.entities || {})) {
    if (entities.some(e => !NATIVE.has(e.sp) || e.npc || e.tame || e.leash || e.inCart)) blocked.add(key);
  }
  for (const drop of data.drops || []) blocked.add(blockKey(drop));
  for (const portal of data.portals || []) {
    if (!blockKey(portal)) continue;
    const width = Number.isInteger(portal.w) ? Math.max(1, Math.min(24, portal.w)) : 1;
    for (let i = -1; i <= width; i++) {
      blocked.add(keyAt(portal.x + (portal.axis === 0 ? i : 0), portal.z + (portal.axis === 0 ? 0 : i)));
    }
  }
  for (const position of [player?.spawn, player?.anchor]) blocked.add(blockKey(position));
  return blocked;
}

function street(gen, key) {
  const [cx, cz] = key.split(",").map(Number);
  const blocks = gen.generate(cx, cz, { version: Math.max(LEGACY_CHUNK_GEN, gen.version) });
  const x = 2, z = 13;
  let y = HEIGHT - 2;
  while (y > 1 && [B.AIR, B.FLOWER_RED, B.FLOWER_YELLOW, B.TALL_GRASS].includes(idOf(blocks[x + z * CHUNK + y * CHUNK * CHUNK]))) y--;
  return [cx * CHUNK + x + .5, y + 1, cz * CHUNK + z + .5];
}

function relocateResidents(gen, data, changed) {
  // Preserve saved villagers and their trades while reconnecting them to the new furnishings.
  const entities = {};
  const placements = new Map();
  for (const [key, list] of Object.entries(data.entities || {})) {
    entities[key] = list.map(saved => {
      const oldHome = Array.isArray(saved.home) ? keyAt(saved.home[0], saved.home[2]) : null;
      const newHome = changed.get(oldHome);
      const newGround = changed.get(key);
      if (!NATIVE.has(saved.sp) || !(newGround || newHome)) return saved;
      const entry = { ...saved };
      if (newGround) {
        if (!placements.has(key)) placements.set(key, newGround.entry || street(gen, key));
        [entry.x, entry.y, entry.z] = placements.get(key);
      }
      if (newHome) {
        const { bed, home, job, prof } = newHome;
        entry.home = saved.sp !== "golem" && bed ? [bed[0] + .5, bed[1], bed[2] + 2.5] : home;
        if (saved.sp === prof || saved.sp === "villager") entry.job = job || null;
      }
      return entry;
    });
  }
  data.entities = entities;
}

export function prepareVillageRenovations(gen, data, meta, story, applyPending = true) {
  const r = story.villageRenovation;
  if (!supports(meta) || r?.v !== 1) return;
  const applied = new Set(Array.isArray(r.applied) ? r.applied : []);
  gen.renovatedVillages = applied;
  if (!applyPending || !Array.isArray(r.pending) || !r.pending.length) return;
  const blocked = protection(data, meta.player);
  const changed = new Map();
  const skipped = [];
  for (const key of r.pending.slice(0, 9)) {
    if (typeof key !== "string" || !/^-?\d+,-?\d+$/.test(key) || applied.has(key)) continue;
    const [x, z] = key.split(",").map(Number);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(z)) continue;
    const plot = !blocked.has(key) && gen.renovationPiece(x, z);
    if (!plot) { skipped.push(key); continue; }
    applied.add(key);
    changed.set(key, plot);
  }
  gen.renovatedNow = changed;
  relocateResidents(gen, data, changed);
  story.villageRenovation = { v: 1, applied: [...applied], pending: [], skipped };
}

export function initVillageRenovation({ G, UI }) {
  function status(e) {
    const w = G.world, p = G.player.pos;
    if (!w || G.dim !== "overworld" || !supports(G.meta) || G.guest || G.spectator ||
        !e?.def.villager || e.dead || e.gone || !e.home ||
        Math.hypot(e.pos.x - p.x, e.pos.y - p.y, e.pos.z - p.z) > 6) return null;
    const plot = w.gen.villagePiece(Math.floor(e.home[0] / CHUNK), Math.floor(e.home[2] / CHUNK));
    if (!plot || plot.lanternVale) return null;
    const r = G.story.villageRenovation;
    if (r?.pending?.length) return { text: "Renovation queued for the next time you open this world." };
    const [cx, cz] = plot.center.map(n => Math.floor(n / CHUNK));
    const applied = new Set(r?.applied);
    const blocked = protection({
      portals: G.dimData.overworld?.portals,
      mods: Object.fromEntries([...w.mods].map(([key, edits]) => [key, { length: edits.size }])),
      containers: w.containers, entities: G.ents.toJSON(), drops: G.drops
    }, G.player);
    const eligible = [];
    let protectedCount = 0;
    for (let z = cz - 1; z <= cz + 1; z++) for (let x = cx - 1; x <= cx + 1; x++) {
      const key = x + "," + z;
      if (applied.has(key) || w.gen.villagePiece(x, z)?.detailed) continue;
      if (blocked.has(key) || !w.gen.renovationPiece(x, z)) protectedCount++;
      else eligible.push(key);
    }
    if (!eligible.length) return { text: protectedCount ? "Remaining plots are protected by terrain or saved changes." : "All plots have been renovated." };
    return { eligible, text: eligible.length + " plot" + (eligible.length === 1 ? "" : "s") + " ready to renovate on reopen." +
      (protectedCount ? " " + protectedCount + " protected." : "") };
  }
  function queue(e) {
    if (G.state !== "panel" || G.panelKind !== "trade" || G.panelCtx !== e?.uid) return;
    if (!status(e)?.eligible?.length) return;
    const world = G.world;
    UI.confirm("Renovate this village?", "Eligible plots will get the updated layout when you reopen this world. Plots with saved edits, containers, or protected occupants are skipped.", async () => {
      if (G.world !== world || G.panelKind !== "trade" || G.panelCtx !== e.uid) return;
      const current = status(e);
      if (!current?.eligible?.length) return;
      const r = G.story.villageRenovation;
      G.story.villageRenovation = { v: 1, applied: r?.applied || [], pending: current.eligible, skipped: [] };
      await G.saveNow(false);
      UI.refreshPanel();
      UI.toast("Village renovation queued. Reopen this world to apply it.", "good");
    }, "Queue renovation");
  }
  return { status, queue };
}
