// Blockhaven: The Legacy Campaign (Milestone 13).
// A campaign world is an ordinary world with meta.campaign set, a fixed seed, and hand-built places stamped into
// the land: Legacy Village around the spawn point, plus (Part D) Stonehaven, the Ruined Watchtower and its mine,
// Sandspire, Oakwood, Seabreak, three jungle ruins, a shipwreck, and three boss chambers inside the temples.
// Everything the story remembers lives in G.story.campaign:
//   village { cx, cz, g, v }       sites { id: { cx, cz, g, rot } }  (chosen once, in land nobody had visited)
//   active [quest ids]   done { id: time }   prog { id: { i, n, seen } }   places { id: true }   spawned { key: true }
//   filled / filledSites   chests given their supplies once      ways { id: true }  activated Waystones
//   bosses { id: time }    relics [chapter numbers]               flags { name: true }
// The game reports events with G.campaign.event(type, arg); quests move forward on their own.
import { B, I, CHUNK, SEA, itemDef, make } from "./blocks.js";
import { newStack } from "./inventory.js";
import { buildVillage, VSIZE, VC, VILLAGE_V } from "./campaign-village.js";
import { buildStonehaven, buildRuin, buildSandspire, buildOakwood, buildSeabreak, buildKeyRuin, buildWreck, buildThrone, SIZES, TOWNS_V, THRONE_Z } from "./campaign-towns.js";
import { buildIronhold, buildBlightCitadel, buildOutpost, buildSealShrine, buildHollowmere, SIZES2, TOWNS2_V } from "./campaign-towns2.js";
import { initBosses, BOSSES } from "./campaign-bosses.js";
import { CAMPAIGN_SEED, CAMPAIGN_WORLD, INTRO, CHAPTERS, PLACES, NPCS, LOOT, START_KIT, SKIP_KIT, QUESTS, QUEST_ORDER, NEXT, CHAPTER_AFTER, BOSS_REWARDS, BOSS_NAMES, CHAPTER_START, PLAYABLE, FINAL_QUEST } from "./campaign-data.js";
export { CAMPAIGN_SEED, CAMPAIGN_WORLD };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const k3 = (x, y, z) => x + "," + y + "," + z;
const TEMPLE_DIMS = ["desert", "jungle", "sea"];
const WAY_NAMES = { village: "Legacy Village", stonehaven: "Stonehaven", ruin: "The Ruined Watchtower", sandspire: "Sandspire", oakwood: "Oakwood", seabreak: "Seabreak",
  ironhold: "Ironhold", blightcitadel: "The Blight Citadel", outpost: "The Ember Outpost", hollowmere: "Hollowmere" };
const TOWN_SITES = ["stonehaven", "ruin", "sandspire", "oakwood", "seabreak", "ironhold", "blightcitadel", "outpost", "hollowmere"];
const SZ = { ...SIZES, ...SIZES2 };   // every site kind's stamp size
const SEAL_F = 38;   // the Dragon Seal shrines' floor height in the Ember Depths
const RAID_WAVES = [["zombie", "zombie", "skeleton"], ["zombie", "spider", "skeleton", "zombie"], ["zombie", "zombie", "skeleton", "skeleton", "spider"]];

export function initCampaign(api) {
  const { G, UI, Sound, L, ents, openPanel, closePanel, giveXp, puff, victory, saveNow } = api;
  const C = {};
  const on = () => !!(G.meta && G.meta.campaign);
  C.on = on;
  // unbroken: still on track for "The Whole Story" (played from Chapter 1 without jumping ahead)   startAt: a chapter picked on the new-campaign screen
  const fresh = () => {
    const startAt = Math.max(1, Math.min(PLAYABLE, +((G.meta && G.meta.campaign && G.meta.campaign.startAt) || 1)));
    return { v: 1, chapter: 1, active: ["welcome"], done: {}, prog: {}, places: {}, spawned: {}, filled: false, track: true, intro: false, walked: 0, given: {}, flags: {}, unbroken: true, startAt: startAt > 1 ? startAt : 0 };
  };
  const st = () => {
    const s = G.story.campaign || (G.story.campaign = fresh());
    s.bosses = s.bosses || {}; s.relics = s.relics || []; s.ways = s.ways || {}; s.filledSites = s.filledSites || {}; s.flags = s.flags || {}; s.given = s.given || {}; s.paid = s.paid || {};
    if (s.done[FINAL_QUEST] && s.unbroken !== false && !s.fullRun) s.fullRun = Date.now();   // saves that finished the story before chapter select existed
    return s;
  };

  // ======================= where everything goes =======================
  function findVillageSite(gen) {
    const sp = gen.findSpawn();
    let best = null;
    const score = (x, z, r) => {
      for (const s of gen.strongholds || []) if (Math.hypot(s.x - x, s.z - z) < 120) return null;
      const hs = []; let water = 0, steep = 0;
      for (let dz = -60; dz <= 60; dz += 12) for (let dx = -60; dx <= 60; dx += 12) {
        const c = gen.column(x + dx, z + dz);
        if (c.h <= SEA) water++;
        if (c.biome === "peak" || c.biome === "mountain") steep++;
        hs.push(c.h);
      }
      hs.sort((a, b) => a - b);
      const spread = hs[Math.floor(hs.length * 0.9)] - hs[Math.floor(hs.length * 0.1)];
      return { x, z, s: spread + water * 2 + steep * 3 + r / 80, g: Math.max(SEA + 2, Math.min(SEA + 12, hs[Math.floor(hs.length / 2)])) };
    };
    for (let r = 0; r <= 400; r += 40) {
      const n = r ? Math.max(6, Math.round(Math.PI * 2 * r / 60)) : 1;
      for (let a = 0; a < n; a++) {
        const t = a / n * Math.PI * 2, x = Math.round(sp.x + Math.cos(t) * r), z = Math.round(sp.z + Math.sin(t) * r);
        const c = score(x, z, r);
        if (c && (!best || c.s < best.s)) best = c;
      }
      if (best && best.s <= 6) break;
    }
    best = best || { x: Math.round(sp.x), z: Math.round(sp.z), g: SEA + 4 };
    return { cx: best.x, cz: best.z, g: best.g, v: VILLAGE_V };
  }
  // The other places, chosen once (after the temples, so they can sit near them), only in land nobody has visited
  function planSites(gen, wdata) {
    const s = st(), v = s.village, lost = G.story.lost || {}, ts = lost.tsites || {};
    s.sites = s.sites || {};
    const visited = new Set(wdata.visited || []), mods = wdata.mods || {};
    const occ = [{ x: v.cx, z: v.cz, r: 82 }];
    if (lost.site) occ.push({ x: lost.site.x + 16, z: lost.site.z + 16, r: 22 });
    for (const t of Object.values(ts)) if (t) occ.push({ x: t.x + 16, z: t.z + 16, r: t.lake ? t.lake.r1 + 4 : 22 });
    for (const [id, q] of Object.entries(s.sites)) occ.push({ x: q.cx, z: q.cz, r: SZ[q.kind || id] / 2 + 2 });
    const fresh = (x, z, half) => {
      for (let gx = Math.floor((x - half) / CHUNK); gx <= Math.floor((x + half - 1) / CHUNK); gx++) for (let gz = Math.floor((z - half) / CHUNK); gz <= Math.floor((z + half - 1) / CHUNK); gz++) { const k = gx + "," + gz; if (visited.has(k) || mods[k]) return false; }
      return true;
    };
    const search = (from, kind, rMin, rMax, scoreAt) => {
      const half = SZ[kind] / 2; let best = null;
      for (let r = rMin; r <= rMax; r += 12) {
        const n = r ? Math.max(8, Math.round(Math.PI * 2 * r / 16)) : 1;
        for (let a = 0; a < n; a++) {
          const t = a / n * Math.PI * 2 + r * 0.13, x = Math.round(from.x + Math.cos(t) * r), z = Math.round(from.z + Math.sin(t) * r);
          if (occ.some(o => Math.hypot(o.x - x, o.z - z) < o.r + half * 1.42 + 6)) continue;
          if (!fresh(x, z, half)) continue;
          const sc = scoreAt(x, z, half, r); if (!sc) continue;
          if (!best || sc.s < best.s) best = { x, z, ...sc };
        }
        if (best && best.s < 8) break;
      }
      return best;
    };
    const land = (x, z, half, r, want) => {
      const hs = []; let water = 0, match = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = gen.column(x + dx * half * 0.7, z + dz * half * 0.7); hs.push(c.h); if (c.h <= SEA) water++; if (want && want.includes(c.biome)) match++; if (c.biome === "peak") return null; }
      if (water > 2) return null;
      hs.sort((a, b) => a - b);
      return { s: (hs[8] - hs[0]) + water * 4 - match * 1.5 + r / 60, g: Math.max(SEA + 2, Math.min(SEA + 14, hs[4])) };
    };
    const add = (id, kind, p, extra) => { if (!p) return; s.sites[id] = { cx: p.x, cz: p.z, g: p.g, kind, v: TOWNS_V, ...extra }; occ.push({ x: p.x, z: p.z, r: SZ[kind] / 2 + 2 }); };
    const toward = (a, b, k) => ({ x: Math.round(a.x + (b.x - a.x) * k), z: Math.round(a.z + (b.z - a.z) * k) });
    const vc = { x: v.cx, z: v.cz }, desert = ts.desert && { x: ts.desert.x + 16, z: ts.desert.z + 16 }, jungle = ts.jungle && { x: ts.jungle.x + 16, z: ts.jungle.z + 16 }, sea = ts.sea && { x: ts.sea.x + 16, z: ts.sea.z + 16 };
    if (!s.sites.stonehaven) add("stonehaven", "stonehaven", search(desert ? toward(vc, desert, 0.75) : { x: vc.x - 200, z: vc.z }, "stonehaven", 0, 260, (x, z, h, r) => land(x, z, h, r, ["plains"])));
    const sh = s.sites.stonehaven;
    if (!s.sites.ruin && sh) add("ruin", "ruin", search(toward(vc, { x: sh.cx, z: sh.cz }, 0.5), "ruin", 0, 160, (x, z, h, r) => land(x, z, h, r)));
    if (!s.sites.sandspire && desert) add("sandspire", "sandspire", search(desert, "sandspire", 60, 260, (x, z, h, r) => land(x, z, h, r, ["sandy"])));
    if (!s.sites.oakwood && jungle) add("oakwood", "oakwood", search(jungle, "oakwood", 60, 260, (x, z, h, r) => land(x, z, h, r, ["forest", "birch"])));
    if (!s.sites.seabreak && sea) {
      const p = search(sea, "seabreak", 50, 260, (x, z, h, r) => { const c = gen.column(x, z); if (c.h <= SEA + 1) return null; let water = 0; for (let a = 0; a < 8; a++) if (gen.column(x + Math.cos(a * 0.785) * 44, z + Math.sin(a * 0.785) * 44).h <= SEA) water++; if (!water || water > 5) return null; return { s: Math.abs(water - 3) * 2 + r / 50, g: SEA + 2 }; });
      if (p) {   // turn the town so its harbor (local +Z) faces the open water
        const dirs = [[0, 1], [-1, 0], [0, -1], [1, 0]]; let rot = 0, bestW = -1;
        dirs.forEach(([dx, dz], k) => { let w = 0; for (let d = 30; d <= 60; d += 6) for (const o of [-12, 0, 12]) if (gen.column(p.x + dx * d + dz * o, p.z + dz * d + dx * o).h <= SEA) w++; if (w > bestW) { bestW = w; rot = k; } });
        add("seabreak", "seabreak", p, { rot });
      }
    }
    if (jungle) for (let n = 0; n < 3; n++) {
      const id = "keyruin" + n; if (s.sites[id]) continue;
      const t = n * Math.PI * 2 / 3 + 0.6, from = { x: Math.round(jungle.x + Math.cos(t) * 70), z: Math.round(jungle.z + Math.sin(t) * 70) };
      add(id, "keyruin", search(from, "keyruin", 0, 120, (x, z, h, r) => land(x, z, h, r, ["forest", "birch"])), { n });
    }
    const sb = s.sites.seabreak;
    if (!s.sites.wreck && sb) {
      const wet = (x, z, h, r) => { let lo = 99, hi = -99; for (const [dx, dz] of [[0, 0], [-9, 0], [9, 0], [0, -5], [0, 5]]) { const c = gen.column(x + dx, z + dz); lo = Math.min(lo, c.h); hi = Math.max(hi, c.h); } if (hi > SEA - 2) return null; return { s: (hi - lo) + Math.abs(lo - (SEA - 8)) * 0.6 + r / 40, g: Math.max(3, gen.column(x, z).h + 1) }; };
      const p = (sea && search(sea, "wreck", 30, 200, wet)) || search({ x: sb.cx, z: sb.cz }, "wreck", 30, 320, wet);
      add("wreck", "wreck", p);
    }
    // Chapters 4–6: Ironhold sits away from the first three chapters' towns; the citadel and the outpost near it; Hollowmere off to one side
    const v2 = { v: TOWNS2_V };
    let ax = 0, az = 0; for (const q of Object.values(s.sites)) { ax += q.cx - vc.x; az += q.cz - vc.z; }
    const al = Math.hypot(ax, az) || 1, away = { x: -ax / al, z: -az / al };
    if (!s.sites.ironhold) add("ironhold", "ironhold", search({ x: Math.round(vc.x + away.x * 280), z: Math.round(vc.z + away.z * 280) }, "ironhold", 0, 260, (x, z, h, r) => land(x, z, h, r, ["plains", "forest"])), v2);
    const ih = s.sites.ironhold;
    if (ih && !s.sites.blightcitadel) add("blightcitadel", "blightcitadel", search({ x: Math.round(ih.cx + away.x * 130), z: Math.round(ih.cz + away.z * 130) }, "blightcitadel", 0, 200, (x, z, h, r) => land(x, z, h, r)), v2);
    if (ih && !s.sites.outpost) add("outpost", "outpost", search(toward({ x: ih.cx, z: ih.cz }, vc, 0.3), "outpost", 0, 160, (x, z, h, r) => land(x, z, h, r)), v2);
    if (!s.sites.hollowmere) add("hollowmere", "hollowmere", search({ x: Math.round(vc.x - away.z * 260), z: Math.round(vc.z + away.x * 260) }, "hollowmere", 0, 260, (x, z, h, r) => land(x, z, h, r, ["forest", "birch"])), v2);
  }
  // every built place (stamp) in a dimension: { id, kind, dim, cx, cz, size, built: { cells, info } }
  const builtCache = new Map();
  function built(id, rec, make) {
    const key = id + ":" + JSON.stringify(rec);
    let b = builtCache.get(id);
    if (!b || b.key !== key) { b = { key, ...make() }; builtCache.set(id, b); }
    return b;
  }
  let genRef = null;   // the Surface generator (for sloping town edges into the land)
  const groundFor = (gen, rec) => (X, Z) => gen.column(rec.cx + X, rec.cz + Z).h;
  function siteBuild(id, rec, gen) {
    if (id === "village") return built(id, rec, () => buildVillage(rec.g, groundFor(gen, rec)));
    const k = rec.kind || id, gnd = groundFor(gen, rec);
    return built(id, rec, () => k === "stonehaven" ? buildStonehaven(rec.g, gnd) : k === "ruin" ? buildRuin(rec.g, gnd) : k === "sandspire" ? buildSandspire(rec.g, gnd) : k === "oakwood" ? buildOakwood(rec.g, gnd)
      : k === "seabreak" ? buildSeabreak(rec.g, gnd, rec.rot || 0) : k === "keyruin" ? buildKeyRuin(rec.n, rec.g, gnd)
      : k === "ironhold" ? buildIronhold(rec.g, gnd) : k === "blightcitadel" ? buildBlightCitadel(rec.g, gnd) : k === "outpost" ? buildOutpost(rec.g, gnd) : k === "hollowmere" ? buildHollowmere(rec.g, gnd) : buildWreck(rec.g));
  }
  function sitesIn(dim) {
    const s = st(), out = [];
    if (dim === "overworld") {
      if (!s.village) return out;
      const gen = genRef || (G.world && G.dim === "overworld" && G.world.gen);
      if (!gen) return out;
      out.push({ id: "village", kind: "village", dim, cx: s.village.cx, cz: s.village.cz, size: VSIZE, g: s.village.g, built: siteBuild("village", s.village, gen) });
      for (const [id, rec] of Object.entries(s.sites || {})) out.push({ id, kind: rec.kind || id, dim, cx: rec.cx, cz: rec.cz, size: SZ[rec.kind || id], g: rec.g, built: siteBuild(id, rec, gen) });
    } else if (dim === "nether") {   // the three Dragon Seal shrines
      for (const [id, rec] of Object.entries(s.nsites || {})) out.push({ id, kind: "sealshrine", dim, cx: rec.cx, cz: rec.cz, size: SZ.sealshrine, g: rec.F, built: built(id, rec, () => buildSealShrine(rec.n, rec.F)) });
    } else if (TEMPLE_DIMS.includes(dim)) {
      const gen = L.gen(dim); if (!gen) return out;
      const ped = gen.map.meta.pedestal, rec = { kind: "throne", t: dim, y: ped.y, z: ped.z, v: TOWNS_V };
      out.push({ id: "throne_" + dim, kind: "throne", dim, cx: 0, cz: THRONE_Z, size: SIZES.throne, g: ped.y, built: built("throne_" + dim, rec, () => buildThrone(dim, ped)) });
    }
    return out;
  }
  const W = (site, X, y, Z) => ({ x: site.cx + X, y, z: site.cz + Z });
  C.info = () => (on() && st().village ? siteBuild("village", st().village, genRef || G.world.gen).info : null);

  // ======================= called from makeWorld (before any land is made) =======================
  C.plan = (gen, wdata) => {
    if (!on()) return false;
    const s = st(); genRef = gen;
    if (!s.village) s.village = findVillageSite(gen);
    const v = s.village;
    if (gen.villagePiece && !gen._cpWrapped) {   // no natural village inside Legacy Village (its villagers would move into our streets)
      const vp = gen.villagePiece, x0 = v.cx - VC, z0 = v.cz - VC;
      gen.villagePiece = function (gx, gz) {
        const hit = (ax, az, size) => gx * CHUNK < ax + size && gx * CHUNK + CHUNK > ax && gz * CHUNK < az + size && gz * CHUNK + CHUNK > az;
        if (hit(x0, z0, VSIZE)) return null;
        for (const q of Object.values(st().sites || {})) { const sz = SZ[q.kind]; if (hit(q.cx - sz / 2, q.cz - sz / 2, sz)) return null; }
        return vp.call(this, gx, gz);
      };
      gen._cpWrapped = true;
    }
    L.avoid = [];
    for (const a of [-64, -32, 0, 32, 64]) for (const c of [-64, -32, 0, 32, 64]) L.avoid.push({ x: v.cx + a - 16, z: v.cz + c - 16 });
    if (!G.story.starter) G.story.starter = { v: 1, fresh: true, house: null, campaign: true, waypoint: true, zoom: 2, granted: Date.now(), welcomed: true, mapGiven: true, dest: "home" };
    return true;
  };
  C.stamp = (gen, wdata) => {
    if (!on() || !st().village) return;
    genRef = gen;
    try { planSites(gen, wdata || {}); } catch (e) { console.warn("campaign sites", e); }
    gen.stamps = gen.stamps || [];
    writeSigns("overworld", wdata || G.dimData.overworld || {});
    for (const site of sitesIn("overworld")) gen.stamps.push({ x: site.cx - site.size / 2, z: site.cz - site.size / 2, size: site.size, cells: site.built.cells });
  };
  C.stampDim = (dim, gen) => {   // the boss chambers behind the temple vaults (campaign worlds only)
    if (!on() || !TEMPLE_DIMS.includes(dim) || !gen || !gen.map) return;
    const site = sitesIn(dim)[0]; if (!site) return;
    gen.stamps = [{ x: site.cx - site.size / 2, z: site.cz - site.size / 2, size: site.size, cells: site.built.cells }];
    writeSigns(dim, G.dimData[dim] || (G.dimData[dim] = {}));
  };
  // the Ember Depths: three Dragon Seal shrines, chosen once (between the arrival area and the Cinder Citadel), in rock nobody has dug yet
  C.stampNether = (gen, wdata) => {
    if (!on() || !gen || !gen.citadel) return;
    const s = st(), c = gen.citadel;
    if (!s.nsites) {
      const visited = new Set((wdata && wdata.visited) || []), mods = (wdata && wdata.mods) || {}, half = SZ.sealshrine / 2, out = {};
      const clear = (x, z) => {
        for (let gx = Math.floor((x - half) / CHUNK); gx <= Math.floor((x + half - 1) / CHUNK); gx++) for (let gz = Math.floor((z - half) / CHUNK); gz <= Math.floor((z + half - 1) / CHUNK); gz++) if (visited.has(gx + "," + gz) || mods[gx + "," + gz]) return false;
        if (x + half > c.x - 40 && x - half < c.x + 80 && z + half > c.z - 40 && z - half < c.z + 40) return false;   // keep clear of the citadel and its tunnel
        return Object.values(out).every(o => Math.hypot(o.cx - x, o.cz - z) > half * 2 + 8);
      };
      const base = Math.atan2(-c.z, -c.x);   // toward the middle of the Ember Depths, where travelers usually arrive
      for (let n = 0; n < 3; n++) {
        let spot = null;
        for (let t = 0; t < 60 && !spot; t++) { const a = base + (n - 1) * 0.95 + (t % 2 ? 1 : -1) * Math.floor(t / 2) * 0.07, r = 90 + (t % 5) * 12, x = Math.round(c.x + Math.cos(a) * r), z = Math.round(c.z + Math.sin(a) * r); if (clear(x, z)) spot = { x, z }; }
        if (spot) out["seal" + n] = { cx: spot.x, cz: spot.z, F: SEAL_F, n, v: TOWNS2_V };
      }
      s.nsites = out;
    }
    gen.stamps = sitesIn("nether").map(site => ({ x: site.cx - site.size / 2, z: site.cz - site.size / 2, size: site.size, cells: site.built.cells }));
    writeSigns("nether", wdata || G.dimData.nether || {});
  };
  function writeSigns(dim, wdata) {
    const s = st(); s.signsDone = s.signsDone || {};
    const signs = wdata.signs || (wdata.signs = {});
    for (const site of sitesIn(dim)) {
      const key = site.id + ":" + (site.built.key || "");
      if (s.signsDone[site.id] === key && site.id !== "village") continue;
      if (site.id === "village" && s.signs) continue;
      for (const q of site.built.info.signs) { const p = W(site, q.X, q.y, q.Z); signs[k3(p.x, p.y, p.z)] = q.text; }
      if (site.id === "village") s.signs = true; else s.signsDone[site.id] = key;
    }
  }
  C.spawnPoint = () => {
    if (!on() || !st().village) return null;
    const v = st().village, sp = siteBuild("village", v, genRef || G.world.gen).info.spawn;
    return { x: v.cx + sp.X + 0.5, y: sp.y, z: v.cz + sp.Z + 0.5, yaw: sp.yaw };
  };
  C.home = () => { const p = C.spawnPoint(); return p && { x: p.x, y: p.y, z: p.z }; };
  C.towns = () => {   // for the Explorer's Map: the towns (and the watchtower) on the Surface
    if (!on()) return [];
    return sitesIn("overworld").filter(q => TOWN_SITES.includes(q.id)).map(q => {
      const w = q.built.info.waystones[0], p = w ? W(q, w.X, w.y, w.Z) : { x: q.cx, y: q.g + 1, z: q.cz };
      return { kind: "t_" + q.id, name: WAY_NAMES[q.id], x: p.x, y: p.y, z: p.z + 2 };
    });
  };

  // ======================= one-time setup inside the world: chests, people, animals =======================
  function fillSite(site) {
    const s = st(), w = G.world, info = site.built.info;
    for (const c of info.chests) {
      const p = W(site, c.X, c.y, c.Z), key = k3(p.x, p.y, p.z);
      if (w.containers.has(key)) continue;
      const slots = new Array(27).fill(null);
      (LOOT[c.loot] || []).forEach(([id, n], j) => { if (j < 27 && id && itemDef(id)) slots[j] = newStack(id, n); });
      w.containers.set(key, { type: "chest", slots, label: c.label });
    }
    for (const c of info.crops) { const p = W(site, c.X, c.y, c.Z); w.crops.add(k3(p.x, p.y, p.z)); }
    if (site.id === "ironhold") s.blightSkullsFixed = true;
    if (site.id === "village") s.filled = true; else s.filledSites[site.id] = true;
  }
  // Older chest tables used B.SKULL, which has no inventory definition and was skipped.
  // Restore missing quest supplies without replacing existing loot or edited terrain.
  function repairMineSkulls(site) {
    const s = st(), w = G.world;
    if (s.blightSkullsFixed || !G.inv) return;
    for (const slot of G.inv.slots) if (slot && slot.id === B.SKULL) { slot.id = I.BLIGHT_SKULL; G.hudDirty = true; }
    if (s.done.blightmines || (s.prog.blightmines && s.prog.blightmines.i >= 2) || s.flags.blightWoke || s.bosses.blightking) {
      s.blightSkullsFixed = true; return;
    }
    const repaired = s.blightSkullRepairs || (s.blightSkullRepairs = {});
    const boxes = site.built.info.chests.filter(c => /^mineSkull[0-2]$/.test(c.loot)).map(c => {
      const p = W(site, c.X, c.y, c.Z);
      const box = w.containers.get(k3(p.x, p.y, p.z));
      return box && box.type === "chest" ? { box, p, loot: c.loot } : null;
    }).filter(Boolean);
    let total = countItem(I.BLIGHT_SKULL);
    for (const { box, loot } of boxes) for (const slot of box.slots) if (slot) {
      if (slot.id === B.SKULL) slot.id = I.BLIGHT_SKULL;
      if (slot.id === I.BLIGHT_SKULL) { total += slot.n; repaired[loot] = true; }
    }
    for (const { box, p, loot } of boxes) {
      if (total >= 3) break;
      if (repaired[loot] || w.id(p.x, p.y, p.z) !== B.CHEST) continue;
      const free = box.slots.findIndex(slot => !slot);
      if (free < 0) continue; // Retry after space is freed; never replace a player's items.
      box.slots[free] = newStack(I.BLIGHT_SKULL, 1); repaired[loot] = true; total++;
    }
    if (total >= 3 || Object.keys(repaired).length === 3) s.blightSkullsFixed = true;
  }
  function giveStartKit() {
    for (const [id, n] of START_KIT) if (itemDef(id)) {
      if (id === I.EXPLORER_MAP) { const free = [...Array(9).keys()].find(i => !G.inv.slots[i]); if (free !== undefined) { G.inv.slots[free] = newStack(id, 1); continue; } }
      give(id, n);
    }
    G.hudDirty = true;
  }
  function moveIn(site) {
    const s = st(), w = G.world, info = site.built.info;
    const loaded = (x, z) => w.chunks.has(Math.floor(x / CHUNK) + "," + Math.floor(z / CHUNK));
    for (const n of info.npcs) {
      if (s.spawned[n.id]) continue;
      const p = W(site, n.X, n.y, n.Z); if (!loaded(p.x, p.z)) continue;
      const d = NPCS[n.id]; if (!d) continue;
      ents.add(d.prof, p.x + 0.5, p.y, p.z + 0.5, { name: d.name, npc: n.id, home: [p.x + 0.5, p.y, p.z + 0.5] });
      s.spawned[n.id] = true;
    }
    info.animals.forEach((a, i) => {
      const key = site.id === "village" ? "a" + i : site.id + ":a" + i; if (s.spawned[key]) return;
      const p = W(site, a.X, a.y, a.Z); if (!loaded(p.x, p.z)) return;
      ents.add(a.sp, p.x + 0.5, p.y, p.z + 0.5, {});
      s.spawned[key] = true;
    });
  }

  // ======================= quests =======================
  const prog = q => st().prog[q] || (st().prog[q] = { i: 0, n: 0, seen: [] });
  const stepOf = q => QUESTS[q] && QUESTS[q].steps[prog(q).i];
  C.active = () => (on() ? st().active.filter(q => QUESTS[q]) : []);
  function give(id, n) {
    if (!itemDef(id)) return;
    const left = G.inv.add(id, n);
    if (left) G.dropItem(id, left);
    G.hudDirty = true;
  }
  const countItem = id => { let n = 0; for (const sl of G.inv.slots) if (sl && sl.id === id) n += sl.n; return n; };
  function takeItem(id, n) { for (let i = 0; i < G.inv.slots.length && n > 0; i++) { const sl = G.inv.slots[i]; if (sl && sl.id === id) { const t = Math.min(n, sl.n); sl.n -= t; n -= t; if (!sl.n) G.inv.slots[i] = null; } } G.hudDirty = true; }
  let lastTalk = null;   // { q, i } when talking just moved a quest forward (the dialogue reacts to it)
  function start(q, quiet) {
    const s = st();
    if (!QUESTS[q] || s.done[q] || s.active.includes(q)) return;
    s.active.push(q); s.prog[q] = { i: 0, n: 0, seen: [] };
    if (!quiet) { UI.toast(`${QUESTS[q].side ? "Side quest" : "New quest"}: ${QUESTS[q].title}`, "good"); Sound.craft(); }
    stepStarted(q);
    summary();
  }
  const lostT = kind => ((G.story.lost || {}).temples || {})[kind] || {};
  function already(step) {   // things that may have happened before this step began
    const s = st();
    if (step.skip && s.flags[step.skip]) return true;   // e.g. the Ancient Keys aren't needed once the Root Seal is open
    switch (step.ev) {
      case "visit": return !!s.places[step.place];
      case "boss": return !!s.bosses[step.boss];
      case "temple": return !!lostT(step.kind).visits;
      case "templeboss": return lostT(step.kind).boss === "defeated";
      case "relic": return !!lostT(step.kind).relic;
      case "flag": return !!s.flags[step.flag];
      case "dim": return G.dim === step.dim;
      case "have": return step.ids.reduce((a, id) => a + countItem(id), 0) >= step.n;
      default: return false;
    }
  }
  function stepStarted(q) {
    const s = st(), step = stepOf(q), p = prog(q);
    if (!step) return;
    if (step.ev === "places" && !step.high) { p.seen = step.list.filter(x => s.places[x]); if (p.seen.length >= step.n) return advance(q); }
    if (already(step)) return advance(q);
    hudDirty = true;
  }
  function advance(q) {
    const p = prog(q), def = QUESTS[q];
    p.i++; p.n = 0; p.seen = [];
    if (talking) lastTalk = { q, i: p.i };
    if (p.i >= def.steps.length) return complete(q);
    const step = stepOf(q);
    UI.toast("✔ Done! Next: " + step.text, "good"); Sound.click();
    stepStarted(q);
  }
  function complete(q) {
    const s = st(), def = QUESTS[q];
    s.active = s.active.filter(x => x !== q); s.done[q] = Date.now(); s.paid[q] = true;
    if (q === FINAL_QUEST && s.unbroken !== false && !s.fullRun) {
      s.fullRun = Date.now();
      setTimeout(() => UI.toast("🏆 The Whole Story! You played the Legacy Campaign from Chapter 1 without skipping a single chapter.", "good"), 3000);
    }
    if (def.reward) { for (const [id, n] of def.reward.take || []) takeItem(id, n); if (def.reward.xp) giveXp(def.reward.xp); for (const [id, n] of def.reward.items || []) give(id, n); }
    UI.toast(`Quest complete: ${def.title}!${def.reward ? " Reward: " + def.reward.text + "." : ""}`, "good"); Sound.levelUp();
    G.adv && G.adv("cpquest", q);
    if (CHAPTER_AFTER[q]) { s.chapter = CHAPTER_AFTER[q]; titleCard(s.chapter); }
    for (const n of NEXT[q] || []) start(n, QUESTS[n] && QUESTS[n].side);
    hudDirty = true; summary();
  }
  function summary() {   // a short progress line for the campaign list on the title screen
    if (!G.meta || !G.meta.campaign) return;
    const s = st(), main = QUEST_ORDER.find(q => s.active.includes(q) && QUESTS[q].main);
    G.meta.campaign = { ...G.meta.campaign, chapter: s.chapter, done: Object.keys(s.done).length, quest: main ? QUESTS[main].title : "", relics: s.relics.length, fullRun: !!s.fullRun };
  }

  // ======================= chapter select =======================
  // Any playable chapter can be chosen at any time, on any save. Jumping AHEAD counts the earlier chapters as finished
  // and hands over what they would have given (quest rewards, Relics, the Tide Charm), once per save, never twice.
  // Jumping BACK forgets the main quests, bosses, and Relics from that chapter on, so they can be played (and fought) again;
  // things the old quests used up (Blight Skulls, Dragon Seals, ...) come back so nothing gets stuck.
  // Places you've found and doors you've opened stay found and open, so replayed steps can finish on their own.
  const RELIC_CH = {}, BOSS_CH = {};
  for (const R of Object.values(BOSS_REWARDS)) if (R.relic) RELIC_CH[R.chapter] = R.relic;
  for (const d of Object.values(QUESTS)) for (const sp of d.steps) if (sp.ev === "boss") BOSS_CH[sp.boss] = d.chapter;
  const KEEP_FLAGS = ["rootDoor"];   // the Root Seal's door is already open in the world
  C.canJump = () => (BS.active() ? "You can't change chapters in the middle of a boss fight!" : raid ? "Finish the raid on Stonehaven first!" : "");
  function jumpTo(n, quiet) {
    const s = st(); n = Math.max(1, Math.min(PLAYABLE, Math.floor(+n) || 1));
    const why = C.canJump(); if (why) { UI.toast(why, "bad"); return false; }
    const mains = QUEST_ORDER.filter(q => QUESTS[q] && QUESTS[q].main);
    s.skipped = s.skipped || {};
    for (const q of Object.keys(s.done)) s.paid[q] = true;
    // still a "whole story" run only if every earlier chapter was really played (Chapter 1 starts a new run)
    s.unbroken = n === 1 || (s.unbroken !== false && mains.every(q => QUESTS[q].chapter >= n || (s.done[q] && !s.skipped[q])));
    const forward = n > s.chapter;
    // 1. this chapter and the ones after it: ready to be played again
    let back = false;
    for (const q of mains.filter(q => QUESTS[q].chapter >= n)) {
      const d = QUESTS[q], reached = s.done[q] ? 99 : s.active.includes(q) ? prog(q).i : -1;
      if (reached >= 0) back = true;
      d.steps.forEach((sp, k) => {
        if (k < reached && sp.ev === "have" && !(sp.skip && s.flags[sp.skip])) {
          const id = sp.ids[0], need = sp.n - countItem(id);
          if (need > 0) { const left = G.inv.add(id, need); if (left) G.dropItem(id, left); G.hudDirty = true; }   // preserve any overflow as a world drop
        }
        if (sp.ev === "flag" && !KEEP_FLAGS.includes(sp.flag)) delete s.flags[sp.flag];
      });
      delete s.done[q]; delete s.prog[q]; delete s.skipped[q];
      s.active = s.active.filter(x => x !== q);
    }
    for (const [b, c] of Object.entries(BOSS_CH)) if (c >= n) delete s.bosses[b];
    for (const [c, relic] of Object.entries(RELIC_CH)) if (+c >= n) { takeItem(relic, countItem(relic)); s.relics = s.relics.filter(x => x !== +c); }
    // 2. the chapters before it: finished, with their rewards (only ones this save never got)
    let caught = 0;
    for (const q of mains.filter(q => QUESTS[q].chapter < n)) {
      const d = QUESTS[q];
      s.active = s.active.filter(x => x !== q);
      if (s.done[q]) continue;
      s.done[q] = Date.now(); s.skipped[q] = true;
      if (q === "welcome") s.flags.chose = true;
      if (q === "lessons") { s.tutorial = "skipped"; if (!s.paid.lessons) for (const [id, k] of SKIP_KIT) give(id, k); }
      if (!s.paid[q] && d.reward) { for (const [id, k] of d.reward.items || []) give(id, k); caught++; }
      s.paid[q] = true;
    }
    for (const q of QUEST_ORDER) if (QUESTS[q] && QUESTS[q].side && QUESTS[q].chapter < n) start(q, true);   // their side quests are open too
    for (const [c, relic] of Object.entries(RELIC_CH)) if (+c < n && !s.relics.includes(+c)) { s.relics.push(+c); if (!countItem(relic)) give(relic, 1); }
    if (n > 3 && !s.given.charm) { give(I.CP_CHARM, 1); s.given.charm = true; }   // Captain Mira's Tide Charm (breathe underwater)
    // 3. begin
    s.chapter = n;
    start(CHAPTER_START[n], true);
    hudDirty = true; summary();
    const msg = forward ? `Welcome to Chapter ${n}! The earlier chapters count as finished${caught ? ", and you got their rewards and Relics" : ""}.`
      : back ? `Chapter ${n} begins again. Its bosses, and every boss after it, are waiting to be fought.` : `Chapter ${n} begins.`;
    if (quiet) setTimeout(() => UI.toast(msg, "good"), 6000);
    else { titleCard(n); UI.toast(msg, "good"); Sound.levelUp(); saveNow(false); }
    return true;
  }
  C.jumpTo = jumpTo;
  function matches(step, type, arg) {
    switch (step.ev) {
      case "talk": return type === "talk" && arg === step.npc;
      case "visit": return type === "visit" && arg === step.place;
      case "places": return (type === (step.high ? "visitHigh" : "visit")) && step.list.includes(arg);
      case "break": case "craft": return type === step.ev && step.ids.includes(arg);
      case "panel": return type === "panel" && arg === step.kind;
      case "eat": case "trade": return type === step.ev;
      case "kill": return type === "kill" && (!step.sp || arg === step.sp);
      case "flag": return type === "flag" && arg === step.flag;
      case "walk": return type === "walk";
      case "dim": return type === "dim" && arg === step.dim;
      case "boss": return type === "boss" && arg === step.boss;
      case "temple": case "templeboss": case "relic": return type === step.ev && arg === step.kind;
      default: return false;
    }
  }
  C.event = (type, arg) => {
    if (!on() || !G.story || !G.story.campaign) return;
    if (type === "flag") st().flags[arg] = true;
    for (const q of [...st().active]) {
      const step = stepOf(q); if (!step || !matches(step, type, arg)) continue;
      const p = prog(q);
      if (step.ev === "places") { if (!p.seen.includes(arg)) { p.seen.push(arg); hudDirty = true; if (p.seen.length >= step.n) advance(q); } continue; }
      p.n += type === "walk" ? arg : 1; hudDirty = true;
      if (p.n >= (step.n || 1)) advance(q);
    }
  };
  C.blockBroken = (x, y, z, id) => C.event("break", id);
  C.panelOpened = kind => C.event("panel", kind);
  const curStep = q => (st().active.includes(q) ? prog(q).i : -1);

  // ======================= talking to people =======================
  const findEnt = uid => ents.list.find(e => e.uid === uid && !e.dead);
  let talking = false;
  C.talk = e => {
    if (!on() || !e.npc || !NPCS[e.npc]) return false;
    lastTalk = null; talking = true;
    C.event("talk", e.npc);
    talking = false;
    openPanel("talk", e.uid);
    return true;
  };
  const just = (q, i) => lastTalk && lastTalk.q === q && lastTalk.i === i;
  function placeDir(from, siteId) {
    const q = (st().sites || {})[siteId]; if (!q) return "";
    const dx = q.cx - from.pos.x, dz = q.cz - from.pos.z, d = Math.round(Math.hypot(dx, dz));
    return ` It's about ${d} blocks to the ${dir8(dx, dz)}.`;
  }
  function lines(id, e) {
    const s = st(), d = NPCS[id], cur = curStep, opts = [];
    const tradeOpt = { label: "Trade", act: "trade" };
    let text = d.hello;
    if (id === "elder") {
      if (!s.done.welcome) {
        text = "So you're awake at last! Welcome to Legacy Village, traveler. I'm Maren, Elder of this village.\n\nStrange things have been happening across Blockhaven, and I think you arrived here for a reason. But first things first: do you know the ways of a builder? Chopping, crafting, farming, fighting?";
        opts.push({ label: "Teach me the basics", act: "lessons" }, { label: "I already know (skip the lessons)", act: "skip" });
        return { text, opts };
      }
      if (cur("lessons") >= 0) text = "Keep at your lessons, little builder. Right now: " + stepOf("lessons").text + ".";
      else if (cur("village") === 0) text = "Go and see our village! Meet the people, look inside the buildings. Every chest in Legacy Village is yours to use. Come back to me when you've seen it.";
      else if (cur("prepare") >= 0) text = s.flags.elderRelics ? "Smith Garrick's forge is just west of the fountain. Iron tools first, then we'll talk about the road ahead." : "You've seen our little kingdom, and it has seen you.\n\nNow listen. Long ago, the First Builders made all of this, and much more. When their greatest work went wrong, they hid their power in eight Relics to seal away something terrible: the Forgotten King.\n\nThe seals are weakening. I can feel it. Before you can help, you'll need better gear. Go and see Smith Garrick.";
      else if (just("rumors", 1) || cur("rumors") === 1) text = "A traveler came through last night, pale as milk. The watchtower on the road to Stonehaven was smashed to rubble in a single night, and nobody saw what did it.\n\nGo to Stonehaven and speak with King Aldric. He is an old friend of this village." + placeDir(e, "stonehaven") + "\n\nTip: touch the Waystone on our plaza first. Waystones let you travel back here in an instant.";
      else if (cur("ironhold") === 0 || just("ironhold", 1)) text = "Three Relics, safe in your pack. I knew you were the one.\n\nBut a rider came from Ironhold this morning, covered in black dust. The mining town under Mount Ferrum has dug into something old. Their stone is turning black, and the blight is spreading. Forgemaster Hilda asks for help." + placeDir(e, "ironhold");
      else if (s.relics.length) text = `You carry ${s.relics.length} of the eight Relics! I can feel their warmth from here. The First Builders would be proud.`;
      if (cur("prepare") >= 0) s.flags.elderRelics = true;
    } else if (id === "smith") {
      if (cur("prepare") === 1 || cur("prepare") === 2) text = "Iron, that's what you need. There's iron ore in the Old Mine, north-east of here, down the stairs. Mine it with a stone pickaxe, smelt it in a furnace with coal, then make yourself something sharp.";
      else if (s.done.prepare && !s.flags.smithThanks) { text = "Ha! Look at that edge. You'd make a fine smith. Take this shield and helmet; they've been gathering dust on my wall. You'll need them where you're going."; s.flags.smithThanks = true; }
      opts.push(tradeOpt);
    } else if (id === "captain") {
      const sparStep = s.active.includes("lessons") && stepOf("lessons").ev === "kill";
      if (sparStep) { text = "So you want to spar? Good! I'll let a Gloop into the arena. Hit it with your sword (left-click) until it's gone. Gloops split when they're hit hard, so finish all the pieces!"; opts.push({ label: "I'm ready to spar!", act: "spar" }); }
      else text = d.hello + (s.done.lessons ? " If you want a job, climb a watchtower and tell me what you see." : "");
      opts.push(tradeOpt);
    } else if (id === "merchant") {
      if (s.active.includes("lessons") && stepOf("lessons").ev === "trade") {
        if (!s.given.jade) { give(I.JADE, 3); s.given.jade = true; text = "A new face! Here, take these 3 Jade. Jade is the money of Blockhaven. Now try buying something from me. Choose Trade below."; }
        else text = "Choose Trade below and pick something you can afford.";
      }
      opts.push(tradeOpt);
    } else if (id === "librarian") {
      text = d.hello + (s.active.includes("secrets") ? "\n\nThey say the old king hid two secrets close by: one behind the Great Hall, one under this very library. If you find them, I'd love to hear about it!" : "");
      opts.push(tradeOpt);
    } else if (id === "king") {
      if (just("rumors", 3) || cur("watchtower") === 0) text = "So Maren sent you. Good. She was never wrong about people.\n\nMy watchtower on the old road was torn apart three nights ago. My guards found only broken stone and footprints, each one bigger than a cart. I need someone brave to look for clues." + placeDir(e, "ruin");
      else if (just("guardian", 3)) text = "A Guardian of the First Builders, awake after all these years... and this map was inside it? Look here: a pyramid beneath the desert, and the town of Sandspire beside it.\n\nElder Rasha of Sandspire knows the desert better than anyone. Take the map to her." + placeDir(e, "sandspire") + "\n\nTake my own sword, too. You've earned it.";
      else if (cur("guardian") >= 0) text = "The footprints lead into the old watch mine, Brenna says. Whatever is down there, it was made by the First Builders. Be careful.";
      else if (cur("raid") >= 0) text = "Captain Brenna is gathering the guard. Monsters are massing outside our walls! Speak with her at the barracks.";
      else if (s.relics.length) text = `${s.relics.length} Relics recovered! Stonehaven will sing songs about you. Very long ones.`;
    } else if (id === "captainB") {
      if (just("watchtower", 2) || (cur("raid") === 0 && !raid)) {
        text = (just("watchtower", 2) ? "Torn apart, you say? And giant stone footprints leading to the old mine? That explains a lot.\n\n" : "") + "But first, we have a bigger problem: scouts report monsters gathering outside our gates. They'll attack soon. Will you help us hold the walls?";
        if (s.flags.raidWon) text = "We already drove them off. Thank you!"; else opts.push({ label: "We're ready. Let them come!", act: "raid" });
      } else if (raid) text = "Hold the line! Don't let them reach the square!";
      else if (cur("guardian") >= 0) text = "You saved Stonehaven! Now, those footprints: they lead into the old watch mine beside the Ruined Watchtower. Whatever made them is down there." + placeDir(e, "ruin");
      opts.push(tradeOpt);
    } else if (id === "rasha") {
      if (just("sandspire", 2)) text = "The First Builders' own map! I have not seen one since I was a girl.\n\nThe Sunken Pyramid of Aurelis lies beneath the dunes. Its tip shows above the sand, and a Keeper lift will take you down. Inside, the Solar Colossus guards the Solar Seal, and behind it... my grandmother spoke of a Pharaoh who never died.";
      else if (cur("pyramid") >= 0) text = "The pyramid's tip pokes out of the sand nearby. Your Explorer's Map marks it as the Desert Temple. Take water, take torches, and watch the floor: the old traps always glow before they strike.";
      else if (s.done.pyramid && !s.done.oakwood) text = "The Relic of Earth! The carvings in the Pharaoh's tomb speak of a jungle people far away, and a forest town at its edge called Oakwood. That is where you must go next." + placeDir(e, "oakwood");
      opts.push(tradeOpt);
    } else if (id === "fenn") {
      if (just("oakwood", 2)) {
        text = "The Relic of Earth? Then the old stories are TRUE!\n\nHere, take my Expedition Map. I marked three ruins around the jungle temple: the Overgrown Shrine, the Abandoned Village, and the Vine Pillars. Each one hides an Ancient Key. You'll need all three to open the Root Seal inside the temple.";
        if (!s.given.expmap) { give(I.EXPEDITION_MAP, 1); s.given.expmap = true; }
      } else if (cur("keys") >= 0) text = `You have ${countItem(I.ANCIENT_KEY)} of 3 Ancient Keys. The ruins are scattered around the jungle temple. Watch out for Vinewalkers!`;
      else if (cur("jungletemple") >= 0) text = "The step temple is hidden in the forest clearing. Its lift goes down into the Verdant Labyrinth. The Root Seal is beyond the Colossus's vault.";
      opts.push(tradeOpt);
    } else if (id === "elm") {
      if (cur("seabreak") >= 0 && !s.places.seabreak) text = "The Titan's roots grew around a carving of a city beneath the waves. Seabreak, the harbor city, is where every sea journey begins." + placeDir(e, "seabreak");
      opts.push(tradeOpt);
    } else if (id === "mira") {
      if (just("seabreak", 2)) {
        text = "A drowned kingdom, eh? I've heard the stories. Before you go poking around under the sea, you'll want this: a Tide Charm. Keep it in your pack and you'll never run out of air.\n\nYears ago a ship called the Gull's Promise sank just off the coast with an ancient ocean map aboard. Find the wreck, find the map.";
        if (!s.given.charm) { give(I.CP_CHARM, 1); give(I.BOAT, 1); s.given.charm = true; }
      } else if (just("shipwreck", 3)) text = "That's it! The Drowned Citadel, right under the lighthouse rocks out on the open sea. And look: a grotto below it, marked with a sea serpent. Row out to the lighthouse and ride its lift down. Good luck, sailor.";
      else if (cur("shipwreck") >= 0) text = "The wreck lies in the shallows off the coast. Swim down; the Tide Charm will keep you breathing.";
      opts.push(tradeOpt);
    } else if (id === "hilda") {
      if (just("ironhold", 3)) text = "Maren sent you? Then you're the one who brought back three Relics. Good. We need someone like that.\n\nThree nights ago my miners broke into old tunnels under the mountain. The stone down there is turning black, and it's spreading. My crews heard whispering and ran, and I don't blame them.\n\nThe stairs in the Mine Head lead to the Deep Mine. Find out what they found.";
      else if (cur("blightmines") >= 0 && cur("blightmines") < 2) text = `The west, south, and east galleries. Each crew found something at the end of its tunnel. You have ${countItem(I.BLIGHT_SKULL)} of 3 so far.`;
      else if (just("blightmines", 3)) text = "Blight Skulls. Three of them. I've heard the old songs about these: the First Builders locked away a creature called the Blightking, in a citadel past the mountain.\n\nThe skulls are pulling toward it, like iron to a lodestone. As long as he sleeps, the blight will keep spreading. We end it the hard way: wake him on his own altar, and beat him." + placeDir(e, "blightcitadel") + "\n\nTake food. Take your best sword. Healer Rue will patch you up first.";
      else if (cur("blightking") >= 0) text = "The Blight Citadel is past Mount Ferrum. Put the three skulls on the Wailing Sand altar in the middle of the courtyard, and be ready. Remember: the First Builders' Rune Stones are there for a reason.";
      else if (cur("embers") === 0) text = "You did it! The stone in the mine is turning grey again. Ironhold owes you everything.\n\nThat crown of his was forged in fire from the Ember Depths, down below the world. A royal expedition has camped by an old portal frame, hunting for the fifth Relic. Go and find Expedition Leader Sable." + placeDir(e, "outpost");
      opts.push(tradeOpt);
    } else if (id === "dag") {
      if (cur("blightmines") >= 0 && cur("blightmines") < 2) text = "The stairs are inside the Mine Head, right behind me. Down at the bottom, the main hall splits three ways: west, south, east. Take torches. And don't listen to the whispering. It's lying.";
      else if (s.active.includes("ironVeins")) text = d.hello + " If you want real Ironhold iron, dig into Mount Ferrum behind the town. It's full of it.";
      opts.push(tradeOpt);
    } else if (id === "rue") {
      if (cur("blightking") >= 0) text = "Going to the citadel? Eat well first, and carry golden apples. When the Blightking gets armored, arrows bounce off him: use your sword. And whatever rises after him, don't stand in the glowing places.";
      opts.push(tradeOpt);
    } else if (id === "sable") {
      if (just("embers", 2)) text = "Hilda sent word you were coming. Good, I need someone brave and a little bit fireproof.\n\nThat obsidian frame is the Ember Gate. Light it with the Flint and Steel in our supply chest, and it opens a path to the Ember Depths. It's hot down there, and the Boarkin love gold, so wear the golden helmet.\n\nThe First Builders hid three Dragon Seals in shrines down below. Bring all three together and they'll open Cindermaw's altar.";
      else if (cur("embers") === 2) text = "The Flint and Steel is in the supply chest by the tents. Strike the inside of the obsidian frame, then step in and wait a moment.";
      else if (cur("seals") >= 0) text = `You have ${countItem(I.DRAGON_SEAL)} of 3 Dragon Seals. Quill says the shrines are carved into great caverns, with tunnels leading in from every side. Your marker will point to the nearest one once you're down there.`;
      else if (cur("cindermaw") >= 0) text = "A Cinder Eye! Put it in the Cinder Altar in the dragon's citadel. Cindermaw is the most dangerous thing in the Depths, so watch for its warnings: a roar before it dives, glowing rings before fire.";
      else if (s.bosses.cindermaw && !s.places.hollowmere) text = "The Relic of Flame! Quill nearly fainted.\n\nThere's something else, though. Travelers keep talking about a village called Hollowmere, swallowed by fog, and a tall stranger with white eyes who watches from the hills. I don't like it. Somebody should look." + placeDir(e, "hollowmere");
      opts.push(tradeOpt);
    } else if (id === "quill") {
      text = s.bosses.cindermaw ? "The dragon guarded the First Builders' fire for a thousand years. Now that fire is ours to protect. I'm writing all of this down. Twice." : "Did you know the First Builders wrote everything twice? Once for people, once for dragons. The dragon version is mostly about fire.\n\nThe seal shrines are deep inside the rock of the Ember Depths, each in a cavern with four tunnels. If you see black stone and fiery pillars, you're close.";
      opts.push(tradeOpt);
    } else if (id === "ilsa") {
      if (just("hollowmere", 2)) text = "A visitor! Nobody visits anymore. They're all scared of the fog, and of him.\n\nDr. Vell lived in the observatory on the hill. She studied the mist, and the tall man with the white eyes who walks in it. She called him Herobrine. One night she went into the fog with a lantern she'd built, and never came back.\n\nLook around: the Meeting Hall, the Old Well, and her observatory. You'll see what I mean.";
      else if (cur("hollowmere") === 2) text = "The Meeting Hall is to the north-west, the Old Well is right in the middle of the village, and Dr. Vell's observatory is up on the hill.";
      else if (cur("shadow") >= 0) text = "Dr. Vell's lantern opens the way into his valley, the Forsaken World. Inside a ward, he can't hurt you. Outside... keep your eyes open, and your lantern lit.\n\nIf the Relic of Shadows is anywhere, it's in his citadel.";
      else if (s.bosses.herobrine) text = "The fog is lifting! I heard a bird this morning. A real one! Thank you, friend.";
      opts.push(tradeOpt);
    } else opts.push(tradeOpt);
    return { text, opts };
  }
  C.talkHTML = uid => {
    const e = findEnt(uid);
    if (!e || !NPCS[e.npc]) return `<div class="inv-card note-card"><p class="note">They wandered off.</p></div>`;
    const d = NPCS[e.npc], { text, opts } = lines(e.npc, e);
    C._opts = opts; C._uid = uid;
    return `<div class="inv-card note-card cp-talk"><h3>${esc(d.name)} <span class="note" style="color:#444">${esc(d.role)}</span></h3><div class="note-text">${esc(text)}</div>
      <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:10px">${opts.map((o, i) => `<button class="btn small ${i === 0 ? "primary" : ""}" data-cpo="${i}">${esc(o.label)}</button>`).join("")}<button class="btn small" data-cpo="x">Goodbye</button></div>
      <p class="help">Press Esc or E to close.</p></div>`;
  };
  C.mountTalk = panel => { panel.querySelectorAll("[data-cpo]").forEach(b => b.onclick = () => { Sound.click(); choose(b.dataset.cpo); }); };
  function choose(i) {
    if (i === "x") { closePanel(); return; }
    const o = C._opts && C._opts[+i], s = st(), e = findEnt(C._uid);
    if (!o) return;
    if (o.act === "trade") { if (e) openPanel("trade", e.uid); return; }
    if (o.act === "lessons") { s.tutorial = "on"; C.event("flag", "chose"); start("lessons"); closePanel(); return; }
    if (o.act === "skip") {
      s.tutorial = "skipped"; C.event("flag", "chose");
      for (const [id, n] of SKIP_KIT) give(id, n);
      const q = QUESTS.lessons; if (q.reward) { giveXp(q.reward.xp); for (const [id, n] of q.reward.items) give(id, n); }
      s.done.lessons = Date.now();
      UI.toast("Lessons skipped. You got the lesson rewards and some basic tools.", "good");
      for (const n of NEXT.lessons) start(n, QUESTS[n].side);
      closePanel(); return;
    }
    if (o.act === "spar") { spar(); closePanel(); return; }
    if (o.act === "raid") { startRaid(); closePanel(); return; }
  }
  function spar() {
    if (G.wset.difficulty === "peaceful") { UI.toast("Peaceful world: Captain Rowan shows you the moves instead of letting a monster in.", "good"); C.event("kill", "slime"); return; }
    const v = st().village, a = siteBuild("village", v, genRef || G.world.gen).info.places.find(p => p.id === "arena");
    ents.add("slime", v.cx + a.X + 0.5, v.g + 2, v.cz + a.Z + 0.5, { size: 2 });
    UI.toast("A Gloop bounces into the arena! Defeat it (and its pieces).", "");
  }
  C.skipTutorial = () => { const s = st(); if (!s.active.includes("lessons")) return; s.active = s.active.filter(q => q !== "lessons"); C._opts = [{ act: "skip" }]; choose(0); };

  // ======================= the raid on Stonehaven =======================
  let raid = null;   // { wave, gap }
  function stonehaven() { return sitesIn("overworld").find(q => q.id === "stonehaven"); }
  function startRaid() {
    if (raid || st().flags.raidWon) return;
    if (G.wset.difficulty === "peaceful") { UI.toast("Peaceful world: the monsters see the guard on the walls and run away. The raid is over!", "good"); C.event("flag", "raidWon"); return; }
    raid = { wave: 0, gap: 2 };
    UI.toast("Horns sound from the walls! The raid begins. Three waves are coming!", "bad"); Sound.mob("roar", 10);
  }
  function raidTick(dt) {
    if (!raid) return;
    const sh = stonehaven(), p = G.player;
    if (!sh || G.dim !== "overworld" || Math.hypot(p.pos.x - sh.cx, p.pos.z - sh.cz) > 100) return stopRaid("You left Stonehaven, and the raiders scattered. Talk to Captain Brenna to try again.");
    const alive = ents.list.filter(e => e.cpRaid && !e.dead && !e.gone).length;
    if (alive) return;
    if ((raid.gap -= dt) > 0) return;
    if (raid.wave >= RAID_WAVES.length) { raid = null; UI.toast("The last raider falls. Stonehaven is safe! Cheers ring out from the walls.", "good"); Sound.levelUp(); C.event("flag", "raidWon"); return; }
    const list = RAID_WAVES[raid.wave++], w = G.world;
    list.forEach((sp, k) => {
      const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 6, x = Math.floor(p.pos.x + Math.cos(a) * r), z = Math.floor(p.pos.z + Math.sin(a) * r);
      if (!w.isLoaded(x, z)) return;
      const y = w.surfaceY(x, z) + 1, e = ents.add(sp, x + 0.5, y, z + 0.5, {});
      if (e) { e.cpRaid = true; e.angry = 120; }
    });
    UI.toast(`Wave ${raid.wave} of ${RAID_WAVES.length}! Raiders charge in!`, "bad");
    raid.gap = 4;
  }
  function stopRaid(why) { if (!raid) return; for (const e of ents.list) if (e.cpRaid) e.gone = true; raid = null; if (why) UI.toast(why, ""); }

  // ======================= Waystones =======================
  function waystones() {
    const out = [];
    for (const site of sitesIn("overworld")) for (const w of site.built.info.waystones) { const p = W(site, w.X, w.y, w.Z); out.push({ id: w.id, name: WAY_NAMES[w.id] || w.id, x: p.x, y: p.y, z: p.z }); }
    return out;
  }
  C.interact = (hit, kind) => {
    if (!on()) return false;
    if (kind === "waystone") {
      if (G.dim !== "overworld") return false;
      const w = waystones().find(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
      if (!w) { UI.toast("This Waystone is silent."); return true; }
      const s = st();
      if (!s.ways[w.id]) { s.ways[w.id] = true; Sound.levelUp(); for (let k = 0; k < 8; k++) puff(hit.x + 0.5, hit.y + 1 + k * 0.25, hit.z + 0.5, "pale"); UI.toast(`Waystone activated: ${w.name}!`, "good"); }
      openPanel("waystones", w.id);
      return true;
    }
    if (kind === "rune") {
      const kd = keyDoor();
      if (kd && kd.rune.x === hit.x && kd.rune.y === hit.y && kd.rune.z === hit.z) { useKeyDoor(kd); return true; }
      return BS.idleRune(hit);
    }
    return false;
  };
  C.waystoneHTML = from => {
    const s = st(), list = waystones().filter(w => s.ways[w.id]);
    const rows = list.map(w => `<div class="recipe" style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 8px;border-bottom:1px solid #ccc"><div><b>${esc(w.name)}</b>${w.id === from ? ' <span class="note" style="color:#555">(you are here)</span>' : ""}</div>${w.id === from ? "" : `<button class="btn small primary" data-way="${esc(w.id)}">Travel</button>`}</div>`).join("");
    const unknown = waystones().length - list.length;
    return `<div class="inv-card note-card"><h3>Waystones <span class="note" style="color:#444">Fast travel</span></h3><div>${rows}</div>
      <p class="help">${unknown ? `${unknown} more Waystone${unknown > 1 ? "s are" : " is"} waiting to be found. Touch one to remember it.` : "You've found every Waystone."} Travel only works between Waystones you've touched.</p>
      <button class="btn small" data-way="x">Close</button></div>`;
  };
  C.mountWaystones = panel => panel.querySelectorAll("[data-way]").forEach(b => b.onclick = () => { Sound.click(); if (b.dataset.way === "x") closePanel(); else travelTo(b.dataset.way); });
  async function travelTo(id) {
    const w = waystones().find(q => q.id === id); if (!w) return;
    if (BS.active()) { UI.toast("You can't travel in the middle of a boss fight!", "bad"); return; }
    if (raid) { UI.toast("Stonehaven needs you! Finish the raid first.", "bad"); return; }
    closePanel();
    await api.teleport(w.x + 0.5, w.y, w.z + 2.5, `Traveling to ${w.name}…`);
    UI.toast(`You arrive at ${w.name}.`, "good");
  }

  // ======================= the Root Seal (three Ancient Keys) =======================
  function keyDoor() {
    if (G.dim !== "jungle") return null;
    const site = sitesIn("jungle")[0], m = site && site.built.info.marks.keyDoor; if (!m) return null;
    return { ...m, rune: W(site, m.rune.X, m.rune.y, m.rune.Z), site };
  }
  function useKeyDoor(kd) {
    const s = st();
    if (s.flags.rootDoor) { UI.toast("The Root Seal is open."); return; }
    const n = countItem(I.ANCIENT_KEY);
    if (n < 3) { UI.toast(`Three keyholes glow faintly. You have ${n} of 3 Ancient Keys.`, ""); return; }
    takeItem(I.ANCIENT_KEY, 3);
    for (let x = kd.x0; x <= kd.x1; x++) for (let y = kd.y0; y <= kd.y1; y++) { const p = W(kd.site, x, y, kd.z0); G.world.set(p.x, p.y, p.z, B.AIR); puff(p.x + 0.5, p.y + 0.5, p.z + 0.5, "xp"); }
    Sound.levelUp(); UI.toast("The three keys turn together. Roots pull back, and the Root Seal opens!", "good");
    C.event("flag", "rootDoor");
  }

  // ======================= the chapter bosses =======================
  const BS = initBosses({
    G, UI, Sound, ents, puff,
    isDefeated: id => !!st().bosses[id],
    canWake: id => (id === "tempest" ? !!st().bosses.blightking : true),   // the Tempest only rises after the Blightking falls in its citadel
    runeBlock: lit => make(B.RUNE_STONE, lit ? 1 : 0),
    onDefeat: (id, e) => {
      const s = st(), R = BOSS_REWARDS[id]; if (!R) return;
      s.bosses[id] = Date.now();
      if (R.relic) { if (!countItem(R.relic)) give(R.relic, 1); if (!s.relics.includes(R.chapter)) s.relics.push(R.chapter); }
      for (const [it, n] of R.items) give(it, n);
      giveXp(R.xp); Sound.levelUp();
      C.event("boss", id); summary();
      saveNow(false);
      victory(R.title, R.text + (R.relic ? `\n\nRelics recovered: ${s.relics.length} of 8.` : ""), e.pos);
    }
  });
  C.arenas = dim => {
    const out = [];
    for (const site of sitesIn(dim)) for (const [id, A] of Object.entries(site.built.info.arenas)) {
      const c = W(site, A.X, A.y, A.Z);
      out.push({ id, dim, x: c.x + 0.5, y: A.y, z: c.z + 0.5, r: A.r, devices: A.devices.map(d => W(site, d.X, d.y, d.Z)), tele: (A.tele || []).map(t => W(site, t.X, t.y, t.Z)), pool: A.pool, manual: !!A.manual });
    }
    return out;
  };
  const prevHit = ents.bossAI && ents.bossAI.hit;
  if (ents.bossAI) {
    ents.bossAI.cpboss = BS.think;
    ents.bossAI.hit = (E, e, n, attacker) => (e.def.cpBoss ? BS.hit(E, e, n, attacker) : prevHit(E, e, n, attacker));
  }
  C.bossDefeated = e => {
    if (!on()) return false;
    if (e.sp === "blightking" && e.cpCitadel) {   // Chapter 4: the Blightking falls in his citadel... and the land rises as the Blight Tempest
      const s = st();
      if (!s.bosses.blightking) { s.bosses.blightking = Date.now(); giveXp(60); }
      for (let k = 0; k < 16; k++) puff(e.pos.x + (Math.random() - 0.5) * 3, e.pos.y + Math.random() * 3, e.pos.z + (Math.random() - 0.5) * 3, "pale");
      Sound.mob("roar", 0);
      UI.toast("The Blightking falls... but his crown keeps burning. The ground shakes, and the courtyard tears itself loose!", "bad");
      C.event("boss", "blightking"); saveNow(false);
      return true;   // no Radiant Star yet: it comes with the Relic, after the Tempest
    }
    return BS.defeated(e);
  };
  // Bosses with their own fights and victory scenes (Cindermaw, Herobrine): the campaign adds its Relic and a note
  C.externalBoss = id => {
    if (!on()) return;
    const s = st(), R = BOSS_REWARDS[id]; if (!R || s.bosses[id]) return;
    s.bosses[id] = Date.now();
    if (R.relic) { if (!countItem(R.relic)) give(R.relic, 1); if (!s.relics.includes(R.chapter)) s.relics.push(R.chapter); }
    for (const [it, n] of R.items) give(it, n);
    C.event("boss", id); summary(); saveNow(false);
    setTimeout(() => { UI.toast(`You found the ${itemDef(R.relic).name}!`, "good"); openPanel("note", { title: R.title, text: R.text + `\n\nRelics recovered: ${s.relics.length} of 8.` }); }, 9800);
  };
  C.bossInfo = () => (on() ? BS.info() : null);
  C.onFaint = () => { BS.onFaint(); stopRaid("You fainted, and the raiders scattered. Talk to Captain Brenna to try again."); };
  C.breathes = () => on() && countItem(I.CP_CHARM) > 0;
  C._bosses = BS; C._raid = () => raid;

  // ======================= each frame =======================
  let placeT = 0, hudT = 0, introT = 0, last = null, hudDirty = true, introPending = false, arenaCache = { dim: null, list: [] };
  C.tick = dt => {
    if (!on() || !G.world || !G.player) return;
    const s = st(), p = G.player;
    if (G.dim === "overworld" && G.world.gen) genRef = G.world.gen;
    const sites = (G.dim === "overworld" && s.village) || TEMPLE_DIMS.includes(G.dim) || G.dim === "nether" ? sitesIn(G.dim) : [];
    if (s.active.includes("next4")) { s.active = s.active.filter(q => q !== "next4"); start("ironhold"); }   // worlds saved before Chapter 4 existed
    if (G.dim === "overworld" && s.village && !s.kitGiven && G.inv) { s.kitGiven = true; if (!s.filled) giveStartKit(); }
    if (s.startAt && s.kitGiven) { const n = s.startAt; s.startAt = 0; jumpTo(n, true); }   // a new campaign that starts at a later chapter
    for (const site of sites) { if (!(site.id === "village" ? s.filled : s.filledSites[site.id])) fillSite(site); if (site.id === "ironhold") repairMineSkulls(site); moveIn(site); }
    if ((placeT -= dt) <= 0) {
      placeT = 0.4;
      for (const site of sites) for (const pl of site.built.info.places) {
        const d = Math.hypot(p.pos.x - (site.cx + pl.X + 0.5), p.pos.z - (site.cz + pl.Z + 0.5));
        if (d > pl.r) continue;
        const P = PLACES[pl.id] || {};
        if (pl.y != null && !P.tower && Math.abs(p.pos.y - pl.y) > 6) continue;   // underground halls count only when you're down there
        if (!s.places[pl.id]) {
          s.places[pl.id] = true;
          if (P.name && !P.tower && pl.id !== "castleGate") UI.toast(`${P.secret ? "Secret found" : "Discovered"}: ${P.name}`, P.secret ? "good" : "");
        }
        C.event("visit", pl.id);
        if (P.tower && p.pos.y >= (pl.y != null ? pl.y : site.g + 16) - 0.5) C.event("visitHigh", pl.id);
      }
      for (const q of [...s.active]) { const step = stepOf(q); if (step && step.ev === "have" && already(step)) advance(q); }
      C.event("dim", G.dim);
      const cit = G.dim === "nether" && G.dimData.nether && G.dimData.nether.citadel;
      if (cit && Math.hypot(p.pos.x - cit.x, p.pos.z - cit.z) < 60) { if (!s.places.cinderCitadel) { s.places.cinderCitadel = true; UI.toast("Discovered: The Cinder Citadel"); } C.event("visit", "cinderCitadel"); }
      const T = arenaCache.list.find(a => a.id === "tempest");
      if (T) for (const e of ents.list) if (e.sp === "blightking" && !e.cpCitadel && !e.dead && Math.hypot(e.pos.x - T.x, e.pos.z - T.z) < T.r + 4) { e.cpCitadel = true; C.event("flag", "blightWoke"); UI.toast("The Blightking rises in his own citadel! Stay inside the courtyard.", "bad"); }
      if (arenaCache.dim !== G.dim) arenaCache = { dim: G.dim, list: C.arenas(G.dim) };
    }
    BS.tick(dt, arenaCache.list);
    raidTick(dt);
    if (last && G.state === "play") { const d = Math.hypot(p.pos.x - last.x, p.pos.z - last.z); if (d > 0.01 && d < 2) C.event("walk", d); }
    last = { x: p.pos.x, z: p.pos.z };
    if (!s.intro && G.state === "play") { introT += dt; if (introT > 0.8) { s.intro = true; titleCard(s.chapter || 1, () => { introPending = true; }); } }
    if (introPending && G.state === "play" && !G.panelKind) { introPending = false; openPanel("note", { title: INTRO.title, text: INTRO.text + "\n\n(Your quest journal is on J. The current objective is shown at the top of the screen.)" }); }
    if ((hudT -= dt) <= 0 || hudDirty) { hudT = 0.25; hudDirty = false; drawHud(); }
  };

  // ======================= the objective tracker (top of the screen) =======================
  let hudEl = null;
  function drawHud() {
    if (!hudEl) {
      hudEl = document.createElement("div"); hudEl.id = "cpHud";
      hudEl.style.cssText = "position:absolute;left:50%;top:8px;transform:translateX(-50%);max-width:min(560px,92vw);background:rgba(20,16,10,.72);color:#fff;border:2px solid #c9a24a;border-radius:6px;padding:5px 12px;font:13px/1.35 system-ui,sans-serif;text-align:center;pointer-events:none;z-index:5";
      (document.getElementById("hud") || document.body).appendChild(hudEl);
    }
    const s = on() && G.story.campaign;
    if (!s || !s.track || G.state === "title" || BS.active()) { hudEl.hidden = true; return; }
    const q = QUEST_ORDER.find(id => s.active.includes(id) && QUESTS[id].main) || s.active.find(id => QUESTS[id]);
    if (!q) { hudEl.hidden = true; return; }
    const step = stepOf(q), p = prog(q);
    let extra = "";
    if (step.ev === "places") extra = ` (${p.seen.length} of ${step.n})`;
    else if (step.ev === "walk") extra = ` (${Math.min(step.n, Math.floor(p.n))} of ${step.n})`;
    else if (step.ev === "have" && step.n > 1) extra = ` (${step.ids.reduce((a, id) => a + countItem(id), 0)} of ${step.n})`;
    else if ((step.n || 1) > 1) extra = ` (${p.n} of ${step.n})`;
    if (raid && q === "raid") extra = ` • Wave ${raid.wave} of ${RAID_WAVES.length}`;
    const target = targetOf(q, step);
    if (target) {
      const dx = target.x - G.player.pos.x, dz = target.z - G.player.pos.z, d = Math.round(Math.hypot(dx, dz));
      if (d > 6) extra += ` • ${d} m ${dir8(dx, dz)}`;
    }
    hudEl.hidden = false;
    hudEl.innerHTML = `<b style="color:#f5d36a">${esc(QUESTS[q].title)}</b><br>▶ ${esc(step.text)}${esc(extra)}`;
  }
  function targetOf(q, step) {
    const npcId = step.npc || step.talk;
    if (npcId) { const e = ents.list.find(x => x.npc === npcId && !x.dead); if (e) return { x: e.pos.x, z: e.pos.z }; }
    if (G.dim === "overworld" && ["temple", "templeboss", "relic"].includes(step.ev) || (G.dim === "overworld" && step.ev === "visit" && /^throne_/.test(step.place || ""))) {
      const kind = step.kind || (step.place || "").replace("throne_", ""), m = L.landmarks().find(x => x.kind === kind);
      if (m) return { x: m.x + 0.5, z: m.z + 0.5 };
    }
    if (G.dim === "nether" && (step.place === "cinderCitadel" || step.boss === "cindermaw")) { const c = G.dimData.nether && G.dimData.nether.citadel; if (c) return { x: c.x + 0.5, z: c.z + 0.5 }; }
    if (G.dim === "overworld" && ((step.ev === "dim" && step.dim === "nether") || (step.places || []).some(x => /^seal/.test(x)) || step.place === "cinderCitadel" || step.boss === "cindermaw")) {   // the way to the Ember Depths starts at the outpost's gate
      const op = sitesIn("overworld").find(x => x.id === "outpost"), m = op && op.built.info.marks.portal;
      if (m) return { x: op.cx + m.X + 0.5, z: op.cz + m.Z + 0.5 };
    }
    const ids = step.place ? [step.place] : step.list || step.places || [];
    const seen = prog(q).seen || [], s = st();
    for (const site of sitesIn(G.dim)) for (const pl of site.built.info.places) {
      if (!ids.includes(pl.id)) continue;
      if ((step.list || step.places) && (seen.includes(pl.id) || (step.places && s.places[pl.id]))) continue;
      return { x: site.cx + pl.X + 0.5, z: site.cz + pl.Z + 0.5 };
    }
    // a town that isn't loaded as a place yet: aim at the site's middle
    if (G.dim === "overworld" && step.ev === "visit") { const site = sitesIn("overworld").find(x => x.id === step.place || x.built.info.places.some(pl => pl.id === step.place)); if (site) return { x: site.cx, z: site.cz }; }
    return null;
  }
  const dir8 = (dx, dz) => ["east", "south-east", "south", "south-west", "west", "north-west", "north", "north-east"][((Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) % 8) + 8) % 8];

  // ======================= the chapter title card =======================
  function titleCard(n, then) {
    const ch = CHAPTERS[n - 1]; if (!ch) return;
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.55);color:#fff;z-index:40;font-family:system-ui,sans-serif;text-align:center;transition:opacity .8s;opacity:0;cursor:pointer;padding:16px";
    el.innerHTML = `<div style="letter-spacing:.3em;font-size:14px;color:#f5d36a">BLOCKHAVEN: THE LEGACY CAMPAIGN</div><div style="font-size:clamp(28px,6vw,54px);font-weight:800;margin:10px 0;text-shadow:0 3px 0 #000">Chapter ${n}: ${esc(ch.title)}</div><div style="font-size:16px;opacity:.9">${esc(ch.blurb)}</div><div style="font-size:12px;opacity:.6;margin-top:18px">Click to continue</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; });
    let gone = false;
    const done = () => { if (gone) return; gone = true; el.style.opacity = "0"; setTimeout(() => el.remove(), 800); then && then(); };
    el.onclick = done; setTimeout(done, 4500);
  }

  // ======================= the journal's Campaign tab =======================
  C.journalHTML = () => {
    const s = st(), stepRow = (q) => QUESTS[q].steps.map((sp, i) => {
      const pi = s.done[q] ? 99 : prog(q).i;
      return `<li style="${i < pi ? "color:#4a7a2a" : i === pi ? "font-weight:700" : "color:#777"}">${i < pi ? "✔" : i === pi ? "▶" : "○"} ${esc(sp.text)}</li>`;
    }).join("");
    const card = q => `<div style="border:1px solid #c9b48a;border-radius:6px;padding:6px 10px;margin:6px 0;background:#fffaf0"><b>${esc(QUESTS[q].title)}</b> ${QUESTS[q].side ? '<span class="note" style="color:#7a5a20">side quest</span>' : ""}${s.done[q] ? ' <span style="color:#4a7a2a">✔ complete</span>' : ""}<div class="note" style="color:#444;margin:2px 0">${esc(QUESTS[q].text)}</div><ul style="margin:4px 0 0 0;padding-left:18px;list-style:none">${stepRow(q)}</ul>${QUESTS[q].reward ? `<div class="note" style="color:#7a5a20">Reward: ${esc(QUESTS[q].reward.text)}</div>` : ""}</div>`;
    const active = QUEST_ORDER.filter(q => s.active.includes(q)), done = QUEST_ORDER.filter(q => s.done[q] && !(q === "lessons" && s.tutorial === "skipped"));
    const ch = Math.min(8, s.chapter), chapters = CHAPTERS.map(c => {
      const btn = c.n > PLAYABLE ? '<span class="note" style="color:#888">coming soon</span>' : `<button class="chip-btn" data-cp="ch${c.n}" style="padding:1px 8px">${c.n === ch ? "Restart" : "Play"}</button>`;
      return `<li style="margin:3px 0;${c.n === ch ? "font-weight:700" : c.n > ch ? "color:#666" : ""}">${c.n > PLAYABLE ? "🔒" : c.n === ch ? "▶" : c.n < ch ? "✔" : "○"} Chapter ${c.n}: ${esc(c.title)} ${btn}<br><span class="note" style="color:#555;font-weight:400">${esc(c.where)}</span></li>`;
    }).join("");
    const run = s.fullRun ? "🏆 Earned! You played the whole story from Chapter 1 without skipping." : s.unbroken !== false ? "✔ Still on track: you haven't skipped any chapters. Finish Chapter 6 to earn it." : "✖ Not this time: you skipped ahead. Choose Play on Chapter 1 to start a new full run (your world, gear, and places found are kept).";
    const relics = CHAPTERS.map(c => `<span title="${esc(c.relic)}" style="display:inline-block;width:30px;height:30px;line-height:30px;margin:2px;border-radius:50%;text-align:center;border:2px solid ${s.relics.includes(c.n) ? "#c9a24a" : "#bbb"};background:${s.relics.includes(c.n) ? "#f5d36a" : "#eee"}">${s.relics.includes(c.n) ? "★" : "?"}</span>`).join("");
    const names = [...new Set(Object.keys(s.places).filter(k => PLACES[k] && !PLACES[k].tower && k !== "castleGate").map(k => PLACES[k].name))];
    const bosses = Object.keys(s.bosses).map(k => esc(BOSSES[k] ? BOSSES[k].name.replace(/^the /, "The ") : BOSS_NAMES[k] || k)).join(", ") || "None yet";
    const ways = waystones().filter(w => s.ways[w.id]).map(w => esc(w.name)).join(", ") || "None yet (touch a Waystone to remember it)";
    return `<div style="color:#222">
      <h4 style="margin:4px 0">Chapter ${ch}: ${esc(CHAPTERS[ch - 1].title)}</h4>
      <p class="note" style="color:#444">${esc(CHAPTERS[ch - 1].blurb)}</p>
      <h4>Current quests</h4>${active.length ? active.map(card).join("") : '<p class="note" style="color:#444">No quests right now. Talk to the people of the kingdoms.</p>'}
      <h4>Relics recovered (${s.relics.length} of 8)</h4><div>${relics}</div>
      <h4>Bosses defeated</h4><p class="note" style="color:#333">${bosses}</p>
      <h4>Waystones</h4><p class="note" style="color:#333">${ways}</p>
      <h4>Chapters</h4><p class="note" style="color:#444;margin:2px 0">Pick any chapter to play from there. Earlier chapters count as finished (you get their rewards and Relics once), and going back lets you fight a chapter's bosses again.</p><ul style="list-style:none;padding-left:4px;margin:4px 0">${chapters}</ul>
      <h4>The Whole Story</h4><p class="note" style="color:#333">${run}</p>
      <h4>Places found</h4><p class="note" style="color:#333">${names.map(esc).join(", ") || "None yet"}</p>
      ${done.length ? `<details><summary><b>Finished quests (${done.length})</b></summary>${done.map(card).join("")}</details>` : ""}
      <h4>Options</h4><p class="note" style="color:#333"><button class="chip-btn" data-cp="track">${s.track ? "Hide" : "Show"} the objective at the top of the screen</button>
      ${s.active.includes("lessons") ? ' <button class="chip-btn" data-cp="skip">Skip the lessons</button>' : ""} <button class="chip-btn" data-cp="story">Read the story so far</button></p>
    </div>`;
  };
  C.journalAction = k => {
    const s = st();
    if (k === "track") { s.track = !s.track; hudDirty = true; }
    if (k === "skip") C.skipTutorial();
    if (k === "story") openPanel("note", { title: INTRO.title, text: INTRO.text });
    if (/^ch\d$/.test(k)) {
      const n = +k.slice(2), c = CHAPTERS[n - 1], why = C.canJump();
      if (why) { UI.toast(why, "bad"); return; }
      const ahead = mainsBefore(n).some(q => !s.done[q]), back = n <= s.chapter;
      const text = (n === s.chapter ? `Start Chapter ${n} over from its first quest?` : `Jump to Chapter ${n}: ${c.title}?`)
        + (ahead ? " The chapters before it will count as finished, and you'll get their quest rewards and Relics (only once per save)." : "")
        + (back ? ` Quests, bosses, and Relics from Chapter ${n} on will be reset so you can play them again.` : "")
        + " Your world, buildings, gear, and the places you've found stay the same."
        + (n === 1 ? " Playing from here to the end without skipping earns The Whole Story." : ahead && !s.fullRun && s.unbroken !== false ? " Skipping ahead means this run can't earn The Whole Story (you can always start a new run at Chapter 1)." : "");
      UI.confirm(n === s.chapter ? "Restart this chapter?" : `Play Chapter ${n}?`, text, () => { closePanel(); jumpTo(n); }, n === s.chapter ? "Restart" : "Play");
    }
  };
  const mainsBefore = n => QUEST_ORDER.filter(q => QUESTS[q] && QUESTS[q].main && QUESTS[q].chapter < n);
  C.resetSession = () => { last = null; introT = 0; hudDirty = true; arenaCache = { dim: null, list: [] }; raid = null; if (hudEl) hudEl.hidden = true; };
  C.hideHud = () => { if (hudEl) hudEl.hidden = true; };
  C._test = { st, start, complete, sitesIn, waystones, travelTo, startRaid, planSites, jumpTo };
  return C;
}
