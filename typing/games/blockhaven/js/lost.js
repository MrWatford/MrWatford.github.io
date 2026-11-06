// The Lost Civilization: the Keeper excavation on the Surface, the Deep (with the city of Echohold), the First Gate,
// and the Echo Expanse beyond it. This file runs the adventure: travel (lift and gate), caches, tablets and the
// expedition journal, sound and stealth, the puzzles, and the two boss encounters (the First Warden and the Resonant Sovereign).
// Everything that matters is saved in G.story.lost, and the maps' own blocks are only changed through world.set (saved as mods).
import { B, I, CHUNK, HEIGHT, SEA, SOLID, idOf, metaOf, make, itemDef } from "./blocks.js";
import { loadMap } from "./maps.js";
import { MapGen } from "./worldgen.js";
import { LORE, MURALS, MEMORIES, LORE_STEPS, TEMPLE_LORE } from "./lost-lore.js";

const rand = (a, b) => a + Math.random() * (b - a);
const MAPS = { deep: "maps/deep-v1.bin", expanse: "maps/expanse-v1.bin", surface: "maps/surface-v1.bin", sea: "maps/sea-v1.bin", jungle: "maps/jungle-v1.bin", desert: "maps/desert-v1.bin" };
// The three temples: where their entrance stands on the Surface, what they hold, and what their guardian gives
const TEMPLES = {
  sea: { name: "the Drowned Citadel", boss: "regent", bossName: "the Abyssal Regent", relic: I.TIDAL_HEART, reward: I.TIDE_CHARM, device: "tide valve",
    rewardText: "the Tidecaller Charm (hold it and you can stay underwater much longer)" },
  jungle: { name: "the Verdant Labyrinth", boss: "vcolossus", bossName: "the Verdant Colossus", relic: I.VERDANT_LENS, reward: I.LEAFSTEP_BOOTS, device: "bloom lever",
    rewardText: "Leafstep Boots (no more fall damage)" },
  desert: { name: "the Sunken Pyramid of Aurelis", boss: "scolossus", bossName: "the Solar Colossus", relic: I.SOLAR_SEAL, reward: I.SUNWARD_HELM, device: "great mirror",
    rewardText: "the Sunward Helm (fire can't hurt you)" }
};
const TEMPLE_KEYS = Object.keys(TEMPLES);
const EXTRA = { sea_sign: { title: "Lighthouse Plaque", by: "Keeper builders", where: "the sea lighthouse", text: "BELOW THIS LIGHT: THE DROWNED CITADEL.\n\nThe lift inside goes down to the dock. The sea cavern is deep, so stay on the stone. The Tidal Heart waits past the Tide Hall." },
  jungle_sign: { title: "Signpost in the Clearing", by: "Rosalind Pell's expedition", where: "the forest step temple", text: "The step temple is only the roof. The Keepers' green valley is underneath, with a labyrinth in the middle.\n\nClimb to the top and ride the lift." },
  desert_sign: { title: "Half-Buried Marker", by: "Rosalind Pell's expedition", where: "the desert pyramid", text: "This is only the very top of the Pyramid of Aurelis. The rest is under the sand. The doorway on the south side leads to a lift." },
  dig_sign: { title: "Survey Sign", by: "Rosalind Pell's expedition", where: "the excavation site", text: "KEEPER EXCAVATION. A working lift goes down to the deep caverns and the lost city of Echohold.\n\nPack food, torches, and something soft to walk on. Leave the lamps lit." },
  epilogue: { title: "The Quiet After", by: "Your expedition journal", where: "the Echo Expanse", text: "The crown came apart into a slow ring of light, and the hum stopped. Not silence: the quiet of a place that can finally rest.\n\nBack in Echohold the moss has stopped answering every step. The lamps the Keepers left burning are still burning. Someone should write that down, so here it is: the city is calm, and it was always worth saving." } };
// Which items fit each gate socket: the true relic first, then the city's stand-in (Exploration mode only)
const SOCKETS = { sea: [I.TIDAL_HEART, I.STAB_ARCHIVE], green: [I.VERDANT_LENS, I.STAB_GARDEN], sun: [I.SOLAR_SEAL, I.STAB_FOUNDRY], echo: [I.RESONANCE_CORE] };
const ORDER = ["sea", "green", "sun", "echo"];
const SLOT_NAMES = { sea: "Sea (wave)", green: "Green (leaf)", sun: "Sun", echo: "Echo" };
export const LOST_DIMS = ["deep", "expanse", "sea", "jungle", "desert"];
// How far from spawn (in blocks) new worlds place the four landmarks: the Keeper excavation (Echohold, the Ancient City)
// and the three temple entrances. Raise "far" for longer journeys; lower it for shorter ones.
export const ADVENTURE = { near: 160, far: 720 };

export function initLost(api) {
  const { G, ents, UI, Sound, puff, saveNow, changeDim, giveItem, giveXp, placeSafely, hurt } = api;
  const maps = {};
  let loading = null;
  const L = {};
  const st = () => {
    const s = G.story.lost || (G.story.lost = {});
    s.lore = s.lore || {}; s.caches = s.caches || {}; s.districts = s.districts || {}; s.puz = s.puz || {}; s.secrets = s.secrets || {};
    s.sockets = s.sockets || {}; s.anchors = s.anchors || {}; s.cleared = s.cleared || {}; s.cp = s.cp || {};
    s.mode = s.mode || "exploration"; s.alert = s.alert || 0; s.tsites = s.tsites || {}; s.temples = s.temples || {};
    for (const k of TEMPLE_KEYS) s.temples[k] = s.temples[k] || {};
    return s;
  };
  L.data = st;
  const inMap = () => LOST_DIMS.includes(G.dim) && !!maps[G.dim];
  const M = () => maps[G.dim].meta;
  const k3 = (x, y, z) => x + "," + y + "," + z;
  const calm = () => st().sovereign === "calmed";
  const reduced = () => !!G.settings.lostReduced;

  // ---------- the packaged maps ----------
  L.ready = () => {
    if (Object.keys(MAPS).every(k => maps[k])) return Promise.resolve(maps);
    if (!loading) loading = Promise.all(Object.entries(MAPS).map(async ([k, url]) => { maps[k] = await loadMap(url); })).then(() => maps).catch(e => { loading = null; throw new Error("The Lost Civilization maps couldn't be downloaded. Check your connection and try again."); });
    return loading;
  };
  L.loaded = dim => !!maps[dim];
  L.gen = dim => (maps[dim] ? new MapGen(maps[dim], dim) : null);
  // First visit: each cache starts with its curated loot (later changes are the player's own, saved separately)
  L.setupWorld = (w, data) => {
    const m = maps[w.dim] && maps[w.dim].meta;
    if (!m || data.tplId === m.id) return;
    for (const [k, c] of Object.entries(m.chests)) if (!w.containers.has(k)) w.containers.set(k, { type: "chest", cache: c.id, slots: Array.from({ length: 27 }, (_, i) => c.slots[i] ? { ...c.slots[i], ...(itemDef(c.slots[i].id).tool ? { dur: itemDef(c.slots[i].id).tool.dur } : {}) } : null) });
    data.tplId = m.id;
  };

  // ---------- the excavation site on the Surface ----------
  // Chosen once per world, in land nobody has visited yet, so no player building or explored chunk is ever changed.
  // The excavation and the three temple entrances are each chosen once per world, in land that fits (forest for the
  // jungle temple, desert for the pyramid, open water for the lighthouse) and that nobody has visited yet.
  const siteOf = kind => (kind === "excavation" ? st().site : st().tsites[kind]) || null;
  const stampOf = kind => maps.surface.meta.stamps[kind];
  L.prepareOverworld = (gen, data) => {
    const s = st();
    if (!maps.surface) return;
    // placement rules v2 (the Starter Home update): a temple that found no spot before gets one more try, in unvisited land only
    if (!s.siteV) { s.siteV = 2; for (const k of TEMPLE_KEYS) if (s.tsites[k] === null) delete s.tsites[k]; }
    if (s.site === undefined || s.site === null) s.site = chooseSite(gen, data, "excavation");
    for (const k of TEMPLE_KEYS) if (s.tsites[k] === undefined) s.tsites[k] = chooseSite(gen, data, k);
    gen.stamps = []; L.siteChests = {};
    for (const kind of ["excavation", ...TEMPLE_KEYS]) {
      const site = siteOf(kind); if (!site) continue;
      // a sea temple with no open ocean nearby stands in a bay carved for it (the water goes in first, then the lighthouse)
      if (site.lake) gen.stamps.push({ x: site.x + 16 - site.lake.r1, z: site.z + 16 - site.lake.r1, size: site.lake.r1 * 2, lake: { cx: site.x + 16, cz: site.z + 16, r0: site.lake.r0, r1: site.lake.r1 } });
      const st2 = stampOf(kind), sz = st2.size, ox = st2.ox || 0, cells = new Uint16Array(sz * sz * HEIGHT);
      // flatten the stamp's chunks into one block grid (x + z*size + y*size*size)
      for (let cz = 0; cz < sz / CHUNK; cz++) for (let cx = 0; cx < sz / CHUNK; cx++) {
        const d = maps.surface.decode((ox / CHUNK + cx) + "," + cz);
        for (let y = 0; y < HEIGHT; y++) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) cells[(cx * CHUNK + lx) + (cz * CHUNK + lz) * sz + y * sz * sz] = d[lx + lz * CHUNK + y * CHUNK * CHUNK];
      }
      gen.stamps.push({ x: site.x, z: site.z, size: sz, cells, blend: st2.blend });
      for (const [k, c] of Object.entries(maps.surface.meta.chests)) { const [x, y, z] = k.split(",").map(Number); if (x >= ox && x < ox + sz) L.siteChests[k3(x - ox + site.x, y, z + site.z)] = c; }
    }
  };
  function chooseSite(gen, data, kind) {
    const visited = new Set(data.visited || []), mods = data.mods || {}, sp = gen.findSpawn(), s = st();
    // the other sites, plus anything else that must stay clear (the Starter Home)
    const others = [...["excavation", ...TEMPLE_KEYS].filter(k => k !== kind).map(siteOf).filter(Boolean), ...(L.avoid || [])];
    const P5 = [[16, 16], [4, 4], [28, 4], [4, 28], [28, 28]];
    const fits = {
      excavation: (x0, z0) => P5.every(([dx, dz]) => { const c = gen.column(x0 + dx, z0 + dz); return c.h >= 32 && c.h <= 46 && c.biome !== "peak"; }),
      sea: (x0, z0) => P5.every(([dx, dz]) => gen.column(x0 + dx, z0 + dz).h <= SEA - 3) && [0, 1, 2, 3, 4, 5, 6, 7].some(a => gen.column(x0 + 16 + Math.cos(a * 0.785) * 44, z0 + 16 + Math.sin(a * 0.785) * 44).h > SEA + 1),
      jungle: (x0, z0) => P5.every(([dx, dz]) => { const c = gen.column(x0 + dx, z0 + dz); return c.biome === "forest" && c.h >= 34 && c.h <= 43; }),
      desert: (x0, z0) => P5.every(([dx, dz]) => { const c = gen.column(x0 + dx, z0 + dz); return c.biome === "sandy" && c.h >= 32 && c.h <= 41; })
    }[kind];
    const ok = (x0, z0) => {
      for (let cx = 0; cx < 2; cx++) for (let cz = 0; cz < 2; cz++) { const k = (x0 / CHUNK + cx) + "," + (z0 / CHUNK + cz); if (visited.has(k) || mods[k]) return false; }
      if (others.some(o => Math.hypot(o.x - x0, o.z - z0) < 96)) return false;
      return fits(x0, z0);
    };
    // looser matches, used only when the natural spot would be farther than the adventure range
    const loose = {
      excavation: (x0, z0) => P5.every(([dx, dz]) => { const c = gen.column(x0 + dx, z0 + dz); return c.h >= SEA + 2 && c.h <= 52 && c.biome !== "peak"; }),
      sea: (x0, z0) => P5.every(([dx, dz]) => gen.column(x0 + dx, z0 + dz).h <= SEA - 2) && [0, 1, 2, 3, 4, 5, 6, 7].some(a => gen.column(x0 + 16 + Math.cos(a * 0.785) * 44, z0 + 16 + Math.sin(a * 0.785) * 44).h > SEA + 1),
      jungle: (x0, z0) => P5.every(([dx, dz]) => { const c = gen.column(x0 + dx, z0 + dz); return (c.biome === "forest" || c.biome === "birch") && c.h >= 33 && c.h <= 46; }),
      desert: (x0, z0) => P5.every(([dx, dz]) => { const c = gen.column(x0 + dx, z0 + dz); return c.biome === "sandy" && c.h >= SEA + 1 && c.h <= 46; })
    }[kind];
    // last resort inside the range: grassland that the site's own blended ground turns into a clearing (forest temple) or a dune field (pyramid)
    const open = { jungle: ["plains", "forest", "birch"], desert: ["sandy", "plains"] }[kind];
    const any = open && ((x0, z0) => P5.every(([dx, dz]) => { const c = gen.column(x0 + dx, z0 + dz); return open.includes(c.biome) && c.h >= SEA + 2 && c.h <= 44; }));
    const ring = (from, to, fit) => {
      for (let r = from; r <= to; r += 32) for (let a = 0; a < 24 + Math.floor(r / 40); a++) {
        const t = a / (24 + Math.floor(r / 40)) * Math.PI * 2 + r * 0.01, x0 = Math.round((sp.x + Math.cos(t) * r) / CHUNK) * CHUNK, z0 = Math.round((sp.z + Math.sin(t) * r) / CHUNK) * CHUNK;
        if (fit(x0, z0)) return { x: x0, z: z0 };
      }
      return null;
    };
    // A bay for the lighthouse: low, gentle land (no mountains) that nobody has visited, carved into sea water when the world is made
    const LAKE = { r0: 34, r1: 46 };
    const bay = (x0, z0) => {
      const cx = x0 + 16, cz = z0 + 16;
      if (others.some(o => Math.hypot(o.x - x0, o.z - z0) < 120)) return false;
      for (let gx = Math.floor((cx - LAKE.r1) / CHUNK); gx <= Math.floor((cx + LAKE.r1) / CHUNK); gx++) for (let gz = Math.floor((cz - LAKE.r1) / CHUNK); gz <= Math.floor((cz + LAKE.r1) / CHUNK); gz++) if (visited.has(gx + "," + gz) || mods[gx + "," + gz]) return false;
      for (const rr of [0, 18, 34, 46]) for (let a = 0; a < (rr ? 8 : 1); a++) {
        const c = gen.column(Math.round(cx + Math.cos(a * 0.785) * rr), Math.round(cz + Math.sin(a * 0.785) * rr));
        if (c.h > SEA + 14 || c.biome === "mountain" || c.biome === "peak") return false;
      }
      return true;
    };
    const [near, far] = kind === "excavation" ? [ADVENTURE.near, Math.max(ADVENTURE.near, ADVENTURE.far - 160)] : [ADVENTURE.near + 80, ADVENTURE.far];
    let site = ring(near, far, ok) || ring(near, far, (x0, z0) => ok2(x0, z0, loose));
    if (!site && any) site = ring(near, far, (x0, z0) => ok2(x0, z0, any));
    if (!site && kind === "sea") { const b = ring(near, far, bay); if (b) site = { ...b, lake: LAKE }; }
    if (!site) site = ring(far, 1600, ok);   // the old, wide search (only if nothing fits inside the adventure range)
    void s;
    return site;
    function ok2(x0, z0, fit) {
      for (let cx = 0; cx < 2; cx++) for (let cz = 0; cz < 2; cz++) { const k = (x0 / CHUNK + cx) + "," + (z0 / CHUNK + cz); if (visited.has(k) || mods[k]) return false; }
      if (others.some(o => Math.hypot(o.x - x0, o.z - z0) < 96)) return false;
      return fit(x0, z0);
    }
  }
  // Every landmark's real entrance on the Surface, for the Explorer's Map (js/starter.js). Coordinates are the lift block itself.
  L.landmarks = () => {
    if (!maps.surface) return [];
    return ["excavation", ...TEMPLE_KEYS].map(kind => {
      const site = siteOf(kind); if (!site) return null;
      const sm = stampOf(kind), lift = liftOf(kind);
      return { kind, x: lift.x, y: lift.y, z: lift.z, center: { x: site.x + sm.size / 2, z: site.z + sm.size / 2 }, ground: sm.ground, lake: site.lake || null,
        name: kind === "excavation" ? "Echohold" : TEMPLES[kind].name.replace(/^the /, "The "), visited: kind === "excavation" ? !!st().visits : !!st().temples[kind].visits, relic: kind === "excavation" ? st().sovereign === "calmed" : !!st().temples[kind].relic };
    }).filter(Boolean);
  };
  L.loadedSurface = () => !!maps.surface;
  L.site = () => st().site || null;
  const liftOf = kind => { const s = siteOf(kind), l = stampOf(kind).lift; return { x: s.x + l.x, y: l.y, z: s.z + l.z }; };
  const siteLift = () => liftOf("excavation");
  const templeDone = k => !!st().temples[k].relic;

  // The Survey Map points toward the dig site (or, underground, toward the next goal)
  L.surveyReading = () => {
    const p = G.player, s = st();
    let t = null, label = "";
    if (G.dim === "overworld" && s.site && (!s.visits || s.mode !== "campaign" || TEMPLE_KEYS.every(templeDone))) { t = siteLift(); label = "Keeper excavation"; }
    else if (G.dim === "overworld") {   // Campaign: the nearest temple whose relic you haven't taken yet
      const p0 = G.player.pos; let best = null;
      for (const k of TEMPLE_KEYS) { const site = siteOf(k); if (!site || templeDone(k)) continue; const l = liftOf(k), d = Math.hypot(l.x - p0.x, l.z - p0.z); if (!best || d < best.d) best = { d, l, k }; }
      if (best) { t = best.l; label = TEMPLES[best.k].name.replace(/^the /, "The "); } else if (s.site) { t = siteLift(); label = "Keeper excavation"; }
    }
    else if (TEMPLES[G.dim] && maps[G.dim]) { const m = M(), done = s.temples[G.dim].boss === "defeated"; t = done ? m.pedestal : m.arena; label = done ? "the relic" : TEMPLES[G.dim].bossName; }
    else if (G.dim === "deep" && maps.deep) { const m = maps.deep.meta; t = !s.reachedCity ? m.cityArrival : st().warden !== "defeated" ? m.citadel.threshold : m.gate.stand; label = !s.reachedCity ? "Echohold" : st().warden !== "defeated" ? "the Warden's Citadel" : "the First Gate"; }
    else if (G.dim === "expanse" && maps.expanse) { t = maps.expanse.meta.arena; label = "the Crownless Citadel"; }
    if (!t) return { yaw: null, text: "The survey map is blank here" };
    const ang = Math.atan2(-(t.x + 0.5 - p.pos.x), -(t.z + 0.5 - p.pos.z));
    return { yaw: ang - p.yaw, text: `${label}: ${Math.round(Math.hypot(t.x + 0.5 - p.pos.x, t.z + 0.5 - p.pos.z))} blocks` };
  };

  // ---------- travel: the Keeper lift and the First Gate ----------
  async function travel(dim, at, label, done) {
    try { await L.ready(); } catch (e) { UI.toast(e.message, "bad"); return; }
    await saveNow(false);
    await changeDim(dim, Math.floor(at.x), Math.floor(at.z), label, () => {
      Object.assign(G.player.pos, { x: at.x, y: at.y, z: at.z });
      veilCool = true;
      if (done) done();
    });
  }
  L.goDown = (toCamp) => {
    const s = st(), m = maps.deep.meta, at = toCamp ? { ...m.cityArrival } : { ...m.arrival };
    return travel("deep", at, "Riding the Keeper lift down…", () => {
      s.visits = (s.visits || 0) + 1;
      if (s.visits === 1) { UI.toast("The Deep. Read the tablets (right-click), and press J for your expedition journal.", ""); G.adv("lostdeep"); }
      else UI.toast(toCamp ? "The lift sets you down in Echohold's Expedition Camp." : "Back in the Deep.", "good");
    });
  };
  L.goUp = (kind = "excavation") => {
    const site = siteOf(kind), a = stampOf(kind).arrive;
    return travel("overworld", { x: site.x + a.x + 0.5, y: a.y, z: site.z + a.z + 0.5 }, "Riding the Keeper lift up…", () => UI.toast(kind === "excavation" ? "Back on the Surface, at the excavation." : `Back on the Surface, at the entrance to ${TEMPLES[kind].name}.`, "good"));
  };
  L.enterTemple = kind => {
    const s = st(), m = maps[kind].meta;
    return travel(kind, { ...m.arrival }, `Riding down into ${TEMPLES[kind].name}…`, () => {
      const t = s.temples[kind]; t.visits = (t.visits || 0) + 1;
      UI.toast(t.visits === 1 ? `${TEMPLES[kind].name.replace(/^the /, "The ")}. Watch for glowing marks on the floor: every trap warns you first.` : `Back in ${TEMPLES[kind].name}.`, t.visits === 1 ? "" : "good");
      G.adv("temple", kind);
    });
  };
  function useLift(hit) {
    const s = st();
    if (G.dim === "overworld") {
      if (!maps.deep || !maps.sea) { L.ready().then(() => useLift(hit)).catch(e => UI.toast(e.message, "bad")); return; }
      const temple = TEMPLE_KEYS.find(k => { const site = siteOf(k); if (!site) return false; const l = liftOf(k); return l.x === hit.x && l.y === hit.y && l.z === hit.z; });
      if (temple) {
        UI.confirm(`Enter ${TEMPLES[temple].name}?`, `A Keeper temple. Inside: traps (they always glow before they go off), puzzles, caches, and ${TEMPLES[temple].bossName} guarding the ${itemDef(TEMPLES[temple].relic).name}. The lift always brings you back up.` + (G.meta.hardcore ? " This is a Hardcore world: fainting there ends the world." : " If you faint, you wake at the last Keeper Beacon you lit."), () => L.enterTemple(temple), "Go down");
        return;
      }
      if (!s.site) return;
      const toCamp = !!s.cityLift;
      UI.confirm(toCamp ? "Ride down to Echohold?" : "Ride the Keeper lift down?", (toCamp ? "The lift goes straight to the Expedition Camp in the city of Echohold." : "It goes deep underground, to caverns the Keepers mapped long ago, and beyond them their lost city.") + " This is an optional adventure. The lift always brings you back up." + (G.meta.hardcore ? " This is a Hardcore world: fainting down there ends the world, like anywhere else." : " If you faint down there, you wake at the last Keeper Beacon you touched."), () => L.goDown(toCamp), "Go down");
      return;
    }
    if (TEMPLES[G.dim]) { UI.confirm("Ride the lift up?", `Back to the Surface. Everything you've found in ${TEMPLES[G.dim].name} stays as you left it.`, () => L.goUp(G.dim), "Go up"); return; }
    if (G.dim !== "deep") { UI.toast("The lift doesn't answer here."); return; }
    const m = M();
    if (hit.x === m.cityLift.x && hit.z === m.cityLift.z && !s.cityLift) { s.cityLift = true; puff(hit.x + 0.5, hit.y + 1.2, hit.z + 0.5, "pale"); Sound.levelUp(); UI.toast("The camp lift hums to life. From now on the Surface lift comes straight here.", "good"); saveNow(false); }
    UI.confirm("Ride the lift up?", "Back to the Keeper excavation on the Surface. Everything you've found down here stays as you left it.", () => L.goUp(), "Go up");
  }
  let veilCool = false;
  function checkVeil() {
    if (!inMap() || G.traveling || G.state !== "play") return;
    const p = G.player, a = p.aabb(), w = G.world;
    let inside = false;
    for (let y = Math.floor(a[1]); y <= Math.floor(a[4] - 0.01) && !inside; y++) for (let x = Math.floor(a[0]); x <= Math.floor(a[3]) && !inside; x++) for (let z = Math.floor(a[2]); z <= Math.floor(a[5]) && !inside; z++) { const v = w.get(x, y, z); if (idOf(v) === B.GATE_VEIL && (metaOf(v) & 1)) inside = true; }
    if (!inside) { veilCool = false; return; }
    if (veilCool) return;
    veilCool = true;
    if (G.dim === "deep") {
      const s = st(); s.crossings = (s.crossings || 0) + 1;
      travel("expanse", { ...maps.expanse.meta.arrival }, "Stepping through the First Gate…", () => { UI.toast(s.crossings === 1 ? "The Echo Expanse. The gate behind you leads home whenever you want." : "Back in the Echo Expanse.", s.crossings === 1 ? "" : "good"); G.adv("expanse"); });
    } else {
      const g = maps.deep.meta.gate.stand;
      travel("deep", { x: g.x, y: g.y, z: g.z }, "Stepping back through the gate…", () => UI.toast("Back in Echohold, in front of the First Gate.", "good"));
    }
  }

  // ---------- caches, tablets, murals, memories ----------
  L.chestOpened = (key) => {
    const c = inMap() ? M().chests[key] : G.dim === "overworld" && L.siteChests ? L.siteChests[key] : null;
    if (!c) return;
    const s = st();
    if (s.caches[c.id]) return;
    s.caches[c.id] = Date.now();
    const total = inMap() ? Object.keys(M().chests).length : 0, found = inMap() ? Object.values(M().chests).filter(q => s.caches[q.id]).length : 0;
    UI.toast(c.tier === "vault" ? "A Keeper vault! The best finds are in here." : total ? `Cache found (${found} of ${total} in ${G.dim === "deep" ? "the Deep" : "the Expanse"})` : "The expedition's supply cache.", "good");
    G.adv("lostcache", c.id);
  };
  function entry(key) { return LORE[key] || MURALS[key] || MEMORIES[key] || TEMPLE_LORE[key] || EXTRA[key]; }
  L.readLore = (key) => {
    const n = entry(key); if (!n) return;
    const s = st(), first = !s.lore[key]; s.lore[key] = Date.now();
    const text = n.lines ? n.lines.join("\n\n") + "\n\n(A memory. It fades, but you can replay it from your journal.)" : (n.by ? `${n.text}\n\n— ${n.by}` : n.text);
    UI.openNote(n.title, text, first);
    if (first) { G.adv("lostlore", key); if (MURALS[key]) G.adv("lostmural"); if (MEMORIES[key]) G.adv("lostmemory"); }
  };
  function loreAt(x, y, z) {
    if (inMap()) return M().lore[k3(x, y, z)];
    const s = st();
    if (G.dim === "overworld" && maps.surface) for (const kind of ["excavation", ...TEMPLE_KEYS]) { const site = siteOf(kind); if (!site) continue; const k = maps.surface.meta.lore[k3(x - site.x + (stampOf(kind).ox || 0), y, z - site.z)]; if (k) return k; }
    return null;
  }

  // ---------- sound and stealth ----------
  // Loud actions make a sound event. Listeners (the city's creatures) go to it; a Hush Node close to it shrieks,
  // calling everything nearby and raising the alert meter. Crouching and Hush Carpet are quiet.
  let lastSound = null, alertShown = 0;
  L.noise = (x, y, z, r, what = "noise", fromPlayer = true) => {
    if (!inMap() || G.creative || G.spectator) return;
    const m = M();
    if (m.sanctuary && Math.hypot(x - m.sanctuary.x, z - m.sanctuary.z) < m.sanctuary.r) return;   // the Sanctuary's walls keep every sound in
    ents.hear({ x, y, z, r, player: fromPlayer });
    lastSound = { x, z, what, t: 1.5 };
    for (const n of m.nodes) {
      if (Math.hypot(n.x + 0.5 - x, n.y - y, n.z + 0.5 - z) > Math.min(r, 6)) continue;
      if (idOf(G.world.get(n.x, n.y, n.z)) !== B.HUSH_NODE) continue;   // broken nodes are silent
      if ((n.cool || 0) > G.clock) continue;
      n.cool = G.clock + 6;
      for (let k = 0; k < 4; k++) puff(n.x + 0.5, n.y + 1 + k * 0.3, n.z + 0.5, "pale");
      Sound.tone(1400, 0.5, "sine", 0.06, -600);
      ents.hear({ x: n.x, y: n.y + 1, z: n.z, r: 24, player: fromPlayer });
      if (!n.practice) raiseAlert(reduced() ? 12 : 25, "A Hush Node shrieked!");
      else UI.toast("That's a Hush Node: it shrieks when there's noise near it. Crouch or walk on carpet to pass quietly.", "");
    }
  };
  function raiseAlert(n, why) {
    const s = st(); if (calm()) n *= 0.5;
    s.alert = Math.min(100, s.alert + n);
    if (why) UI.toast(why + (s.alert >= 70 ? " The city is stirring. Find a quiet place." : ""), s.alert >= 70 ? "bad" : "");
    if (s.alert >= 100 && !reduced() && !calm() && G.dim === "deep" && !ents.list.some(e => e.sp === "stalker" && !e.dead && e.alertSpawn)) {
      const p = G.player, a = Math.random() * Math.PI * 2;
      for (let t = 0; t < 12; t++) {
        const x = Math.floor(p.pos.x + Math.cos(a + t) * 12), z = Math.floor(p.pos.z + Math.sin(a + t) * 12), y = Math.floor(p.pos.y);
        if (!SOLID[G.world.id(x, y, z)] && !SOLID[G.world.id(x, y + 1, z)] && !SOLID[G.world.id(x, y + 2, z)] && SOLID[G.world.id(x, y - 1, z)]) {
          const e = ents.add("stalker", x + 0.5, y, z + 0.5); if (e) { e.alertSpawn = true; e.heard = { x: p.pos.x, y: p.pos.y, z: p.pos.z, t: 10 }; e.home = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; }
          UI.toast("A Deep Stalker answers the noise. Move away quietly, or hide in the Sanctuary.", "bad"); s.alert = 60; break;
        }
      }
    }
  }
  let stepAcc = 0;
  function tickStealth(dt) {
    const p = G.player, s = st(), w = G.world;
    s.alert = Math.max(0, s.alert - dt * (p.crouch ? 4 : 2));
    if (lastSound) lastSound.t -= dt;
    // footsteps: running is loud, walking is soft, crouching and soft floors are silent
    const sp = Math.hypot(p.vel.x, p.vel.z);
    if (p.onGround && sp > 0.5 && !p.crouch) {
      stepAcc += sp * dt;
      if (stepAcc > 2.4) {
        stepAcc = 0;
        const under = w.id(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.2), Math.floor(p.pos.z));
        const soft = under === B.HUSH_CARPET || under === B.WOOL || under === B.CAVE_MOSS || under === B.LUMEN_GRASS;
        const run = api.keys.has("ShiftLeft") || api.keys.has("ShiftRight"), hush = wearing("hush") ? 0.5 : 1;
        if (!soft) L.noise(p.pos.x, p.pos.y, p.pos.z, (run ? 14 : 6) * hush, run ? "running" : "footsteps");
      }
    }
  }
  const wearing = flag => [36, 37, 38, 39].some(i => G.inv.slots[i] && itemDef(G.inv.slots[i].id)[flag]);
  // the Echo Mantle: drift down gently instead of falling hard
  function tickMantle() {
    const p = G.player;
    if (wearing("mantle") && !p.onGround && !p.flying && p.vel.y < -5) { p.vel.y = -5; p.airTop = p.pos.y; }
    if (wearing("leafstep") && !p.onGround) p.airTop = Math.min(p.airTop ?? p.pos.y, p.pos.y + 2);   // Leafstep Boots: land softly from any height
    if ([G.inv.slots[G.selected], G.inv.slots[40]].some(q => q && q.id === I.TIDE_CHARM) && p.headInWater) p.air = Math.min(10, (p.air ?? 10) + 0.05);   // the Tidecaller Charm keeps your breath topped up
  }
  // ---------- temple traps: every one glows or puffs before it goes off, and there's always a safe moment or a safe way ----------
  const tState = {};
  function tickTraps(dt) {
    const m = M(), p = G.player, warn = reduced() ? 1.7 : 1.05;
    for (const t of m.traps || []) {
      const b = t.box, inside = p.pos.x >= b.x0 - 3 && p.pos.x <= b.x1 + 4 && p.pos.z >= b.z0 - 3 && p.pos.z <= b.z1 + 4;
      const s = tState[t.id] || (tState[t.id] = { cool: 1, phase: 0, cracks: {} });
      if (t.kind === "floor") { tickCracks(t, s, dt); continue; }
      if (!inside) { s.cool = Math.min(s.cool, 1); continue; }
      if (!s.told) { s.told = true; UI.toast(`Careful: ${t.name} ahead. Watch for the glowing marks, then step where there aren't any.`, ""); }
      if ((s.cool -= dt) > 0) continue;
      s.cool = t.period * (reduced() ? 1.3 : 1);
      const hy = t.y != null ? t.y + 1 : Math.floor(p.pos.y);
      if (t.kind === "darts") {   // a volley of marks along the corridor; every other spot each time, so there's always a gap
        const n = Math.max(1, Math.round(Math.hypot(t.b.x - t.a.x, t.b.z - t.a.z) / 2.5)); s.phase ^= 1;
        for (let i = s.phase; i <= n; i += 2) { const x = t.a.x + (t.b.x - t.a.x) * i / n, z = t.a.z + (t.b.z - t.a.z) * i / n; ents.addHazard(x + 0.5, t.y != null ? hy : Math.floor(p.pos.y), z + 0.5, 1.6, warn, 3, `The ${t.name} caught you. Wait for the marks to fade, then move through the gaps.`, 0); }
        Sound.tone(900, 0.08, "square", 0.04, -300);
      } else if (t.kind === "vents") {   // the two sets of vents take turns
        s.phase ^= 1;
        for (const c of s.phase ? t.a : t.b) ents.addHazard(c.x + 0.5, c.y, c.z + 0.5, 0.9, warn * 0.85, 3, `The ${t.name} caught you. They take turns, so cross while the other set is going.`, t.fire ? 1 : 0);
        Sound.noise(t.fire ? 400 : 1200, 0.4, 0.05, 0.8);
      }
    }
  }
  function tickCracks(t, s, dt) {   // cracked floors crumble a moment after you step on them, then grow back
    const p = G.player, w = G.world, fx = Math.floor(p.pos.x), fz = Math.floor(p.pos.z), b = t.box;
    if (p.onGround && Math.floor(p.pos.y - 0.2) === t.y && w.id(fx, t.y, fz) === B.CRACKED_FLOOR && !s.cracks[fx + "," + fz]) {
      s.cracks[fx + "," + fz] = { x: fx, z: fz, t: reduced() ? 1.1 : 0.7, back: 0 };
      puff(fx + 0.5, t.y + 1, fz + 0.5, "crumb"); Sound.noise(700, 0.2, 0.08, 2);
      if (!s.told) { s.told = true; UI.toast("The floor is cracking! Keep moving, or take the steps down and back up.", "bad"); }
    }
    for (const [k, c] of Object.entries(s.cracks)) {
      if (c.t > 0) { c.t -= dt; if (Math.random() < 0.3) puff(c.x + 0.5, t.y + 1, c.z + 0.5, "crumb"); if (c.t <= 0) { w.set(c.x, t.y, c.z, B.AIR); c.back = 5; } continue; }
      if ((c.back -= dt) <= 0 && !(Math.floor(p.pos.x) === c.x && Math.floor(p.pos.z) === c.z && Math.abs(p.pos.y - t.y - 1) < 2)) { w.set(c.x, t.y, c.z, B.CRACKED_FLOOR); delete s.cracks[k]; }
    }
    // any crumbled spot left over from before a save grows back too
    if ((s.fixT = (s.fixT || 0) + dt) > 3) { s.fixT = 0; for (let x = b.x0; x <= b.x1; x++) for (let z = b.z0; z <= b.z1; z++) if (!s.cracks[x + "," + z] && w.isLoaded(x, z) && w.id(x, t.y, z) === B.AIR && !(Math.floor(p.pos.x) === x && Math.floor(p.pos.z) === z)) w.set(x, t.y, z, B.CRACKED_FLOOR); }
  }

  // ---------- the temple guardians ----------
  // Phase 1: learn its attacks. Phase 2: three devices around the arena shield it (use all three). Phase 3: faster, and it calls help once.
  let tf = null;
  const tPhase = e => (e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3);
  const MINION = { regent: "tidecrab", vcolossus: "vinewalker", scolossus: "sunscarab" };
  L._fight = () => (tf ? { sp: tf.e.sp, gone: !!tf.e.gone, dead: tf.e.dead, hp: tf.e.hp } : null);   // for automated tests
  function templeTick() {
    const kind = G.dim, T = TEMPLES[kind], s = st().temples[kind], A = M().arena, p = G.player;
    const d = Math.hypot(p.pos.x - A.x, p.pos.z - A.z);
    if (s.boss === "defeated") { const dr = M().puzzles.vault.door; if (G.world.isLoaded(dr.x0, dr.z0) && G.world.id(dr.x0, dr.y0, dr.z0) === B.KEEPER_STONE) setBox(dr, B.AIR); return; }
    if (!tf && d < A.r - 2 && Math.abs(p.pos.y - A.y) < 5 && !G.spectator) {   // wakes in Survival and Creative
      const e = ents.add(T.boss, A.x, A.y, A.z); if (!e) return;
      tf = { e, kind, dev: [false, false, false] }; e.atkT = 3; e.next = 0;
      for (let k = 0; k < 8; k++) puff(A.x + rand(-2, 2), A.y + rand(0, 4), A.z + rand(-2, 2), kind === "sea" ? "splash" : kind === "jungle" ? "xp" : "ember");
      Sound.mob("roar", 0);
      UI.toast(`${T.bossName.replace(/^the /, "The ")} wakes! Watch the floor: its attacks always glow before they land.`, "bad");
      setDevices(false);
    }
    if (tf && (d > A.r + 10 || Math.abs(p.pos.y - A.y) > 12)) resetTemple(`You left the arena. ${T.bossName.replace(/^the /, "The ")} returns to rest.`);
  }
  function setDevices(on) { for (const dv of M().arena.devices) if (G.world.isLoaded(dv.x, dv.z)) { const v = G.world.get(dv.x, dv.y, dv.z); G.world.set(dv.x, dv.y, dv.z, make(idOf(v), on ? 1 : 0)); } }
  function resetTemple(why) {
    if (!tf) return;
    if (!tf.e.gone) tf.e.gone = true;
    for (const e of ents.list) if (e.templeCall) e.gone = true;
    tf = null; setDevices(false); if (why) UI.toast(why, "");
  }
  function useTempleDevice(hit) {
    const A = M().arena, i = A.devices.findIndex(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (i < 0) return false;
    const T = TEMPLES[G.dim];
    if (!tf) { UI.toast(st().temples[G.dim].boss === "defeated" ? `The ${T.device} rests.` : `A ${T.device}. It feeds the guardian's strength when it's hurt.`); return true; }
    if (!tf.e.shieldUp) { UI.toast(`The ${T.device} is quiet for now. It only shields the guardian once it's badly hurt.`); return true; }
    if (tf.dev[i]) { UI.toast(`This ${T.device} is already turned.`); return true; }
    tf.dev[i] = true; G.world.set(hit.x, hit.y, hit.z, make(idOf(hit.v), 1)); Sound.tone(600 + i * 150, 0.6, "triangle", 0.1, 0);
    for (let k = 0; k < 5; k++) puff(hit.x + 0.5, hit.y + 1 + k * 0.3, hit.z + 0.5, "pale");
    const left = tf.dev.filter(v => !v).length;
    if (!left) { tf.e.shieldUp = false; UI.toast("All three are turned! The guardian's shield breaks. Strike now!", "good"); }
    else UI.toast(`${T.device[0].toUpperCase() + T.device.slice(1)} turned! ${left} left.`, "");
    return true;
  }
  function thinkTemple(E, e, d, dmgMul) {
    if (!tf || tf.e !== e) { e.gone = true; return; }
    const p = G.player, ph = tPhase(e), A = M().arena, step = Math.min(0.6, e.age - (e.lastT ?? e.age)); e.lastT = e.age;
    if (ph >= 2 && !tf.shieldOnce) { tf.shieldOnce = true; e.shieldUp = true; UI.toast(`It draws strength from the three ${TEMPLES[tf.kind].device}s around the arena! Use all three (right-click) to break its shield.`, "bad"); }
    if (ph === 3 && !tf.called) { tf.called = true; for (let k = 0; k < 2; k++) { const m = ents.add(MINION[e.sp], e.pos.x + rand(-4, 4), e.pos.y, e.pos.z + rand(-4, 4)); if (m) { m.templeCall = true; m.angry = 60; } } UI.toast("It calls for help!", "bad"); }
    const fast = ph === 3 ? 0.75 : 1;
    if (e.wind > 0) {   // winding up: a clear tell before every big attack
      e.wind -= step; e.goal = null; e.raise = 1; e.charging = true;
      if (Math.random() < 0.6) puff(e.pos.x + rand(-1, 1), e.pos.y + e.def.h * 0.7, e.pos.z + rand(-1, 1), "pale");
      if (e.wind <= 0) { e.raise = 0; e.charging = false; templeAttack(E, e, ph, dmgMul); }
      return;
    }
    if (e.dash > 0) { e.dash -= step; E.moveTo(e, e.dashTo, 7, 0.5); if (d < 2.6 && !e.dashHit && E.targetable()) { e.dashHit = true; E.ctx.hurtPlayer(6 * dmgMul, "The Regent's charge hit you. When it crouches low, get out of its path!", e); } return; }
    e.atkT -= step;
    if (e.atkT <= 0 && d < 20) { e.wind = (e.sp === "scolossus" ? 1.4 : 1.1) * (reduced() ? 1.4 : 1); e.atkT = (ph === 3 ? 3 : 4.2) * fast; Sound.mob("roar", d); return; }
    E.chase(e, p);
    if (d < e.def.reach + 0.6 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "The guardian's fist caught you. Keep your distance when it's close.", e); e.attackCd = 1.8; e.swing = 0.4; }
    void A;
  }
  function templeAttack(E, e, ph, dmgMul) {
    const p = G.player, A = M().arena, y = A.y, warn = reduced() ? 1.6 : 1.15, pick = (e.next = (e.next || 0) + 1) % 2;
    if (e.sp === "regent") {
      if (pick) {   // a tide wave: a ring of marks with two gaps, then a wider one
        for (const [R, delay] of [[4, 0], [7.5, 0.6]]) { const gap = Math.random() * Math.PI * 2; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap))) < 0.5 || Math.abs(Math.atan2(Math.sin(a - gap - Math.PI), Math.cos(a - gap - Math.PI))) < 0.5) continue; E.addHazard(e.pos.x + Math.cos(a) * R, y, e.pos.z + Math.sin(a) * R, 1.5, warn + delay, 5, "The tide wave caught you. Look for the gaps in the ring!", 0); } }
        Sound.splash();
      } else { e.dash = 1.3; e.dashHit = false; e.dashTo = { x: p.pos.x, y: p.pos.y, z: p.pos.z }; for (let k = 0; k <= 4; k++) puff(e.pos.x + (p.pos.x - e.pos.x) * k / 4, y + 0.3, e.pos.z + (p.pos.z - e.pos.z) * k / 4, "splash"); }
    } else if (e.sp === "vcolossus") {
      if (pick) { for (let k = 0; k < (ph === 3 ? 4 : 3); k++) { const a = Math.random() * Math.PI * 2, r = k ? rand(2.5, 5) : 0; E.addHazard(p.pos.x + Math.cos(a) * r, y, p.pos.z + Math.sin(a) * r, 2, warn + k * 0.15, 5, "Roots burst up under you. Step off the glowing ground!", 0); } Sound.noise(300, 0.6, 0.08, 0.6, "lowpass"); }
      else {   // vine pull toward it, then a slam around it: run back out
        const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, l = Math.hypot(dx, dz) || 1;
        if (E.targetable() && l > 4) E.ctx.push(dx / l * 8, 4, dz / l * 8);
        E.addHazard(e.pos.x, y, e.pos.z, 4.5, warn + 0.35, 6, "The Colossus slammed the ground. After it pulls you in, run back out!", 0);
        UI.toast("Vines pull you in! Get away before the slam.", "");
      }
    } else {
      if (pick) {   // a sun beam: a line of marks from the Colossus through where you're standing
        const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1;
        for (let k = 1; k <= 9; k++) E.addHazard(e.pos.x + dx / l * k * 2.2, y, e.pos.z + dz / l * k * 2.2, 1.3, warn + 0.25, 6, "The sun beam hit you. Step sideways out of the glowing line!", 1);
        Sound.tone(1200, 0.6, "sawtooth", 0.05, -400);
      } else { E.addHazard(e.pos.x, y, e.pos.z, 5.5, warn + 0.4, 6, "The solar flare caught you. When its disk glows, get far away!", 1); Sound.noise(500, 0.8, 0.08, 0.5); }
    }
    void dmgMul;
  }
  function templeDefeated(e) {
    const kind = tf ? tf.kind : G.dim, T = TEMPLES[kind], s = st().temples[kind];
    tf = null; s.boss = "defeated";
    for (const m of ents.list) if (m.templeCall) m.gone = true;
    setBox(M().puzzles.vault.door, B.AIR);
    giveItem(T.reward, 1); giveXp(120); G.adv("templeboss", kind); saveNow(false);
    api.victory(`${T.bossName.replace(/^the /, "The ")} Rests`, `The guardian kneels and turns back to stone. It earned its rest.\n\nYou received ${T.rewardText}. Behind the arena, the vault door has opened: the ${itemDef(T.relic).name} is waiting on its pedestal.`, e.pos);
  }
  function usePedestal() {
    const kind = G.dim, T = TEMPLES[kind], s = st().temples[kind];
    if (!T) return;
    if (s.relic) { UI.toast(`The pedestal is empty. You already carry the ${itemDef(T.relic).name}.`); return; }
    s.relic = Date.now(); giveItem(T.relic, 1); Sound.levelUp();
    const m = M().pedestal; for (let k = 0; k < 8; k++) puff(m.x + 0.5, m.y + 1 + k * 0.25, m.z + 0.5, "pale");
    const n = TEMPLE_KEYS.filter(templeDone).length;
    UI.toast(`You took the ${itemDef(T.relic).name}! (${n} of 3 relics.) It fits the First Gate in Echohold${st().mode === "campaign" ? "" : ", in either mode"}.`, "good");
    G.adv("relic", kind); saveNow(false);
  }
  // the Echo Compass points to the nearest cache you haven't opened yet (in the Deep and the Expanse)
  L.echoReading = () => {
    if (!inMap()) return { yaw: null, text: "The Echo Compass only listens in the Keepers' places" };
    const p = G.player, s = st();
    let best = null, bd = Infinity;
    for (const [k, c] of Object.entries(M().chests)) { if (s.caches[c.id]) continue; const [x, y, z] = k.split(",").map(Number), d = Math.hypot(x - p.pos.x, z - p.pos.z); if (d < bd) { bd = d; best = { x, z }; } }
    if (!best) return { yaw: null, text: "Every cache here is found!" };
    const ang = Math.atan2(-(best.x + 0.5 - p.pos.x), -(best.z + 0.5 - p.pos.z));
    return { yaw: ang - p.yaw, text: `Nearest unopened cache: ${Math.round(bd)} blocks` };
  };
  // Echo Shards: throw one (right-click) to make a sound somewhere else
  L.throwShard = () => {
    if (!inMap()) { UI.toast("Echo Shards only ring in the Keepers' places."); return false; }
    const p = G.player, d = api.lookDir(), w = G.world;
    let x = p.pos.x, y = p.pos.y + p.eye, z = p.pos.z;
    for (let i = 0; i < 48; i++) { const nx = x + d.x * 0.5, ny = y + d.y * 0.5 - i * 0.004, nz = z + d.z * 0.5; if (SOLID[w.id(Math.floor(nx), Math.floor(ny), Math.floor(nz))]) break; x = nx; y = ny; z = nz; }
    puff(x, y, z, "pale"); Sound.tone(1800, 0.3, "triangle", 0.06, 400);
    L.noise(x, y, z, 16, "an echo shard", false);
    UI.toast("The shard rings out. Listeners will go check that spot.", "");
    return true;
  };

  // ---------- puzzles ----------
  function setBox(d, v) { for (let y = d.y0; y <= d.y1; y++) for (let z = d.z0; z <= d.z1; z++) for (let x = d.x0; x <= d.x1; x++) if (G.world.isLoaded(x, z)) G.world.set(x, y, z, v); }
  function openDoor(id, pz) { if (pz.door) setBox(pz.door, B.AIR); st().puz[id] = "solved"; for (let k = 0; k < 6; k++) puff((pz.door ? (pz.door.x0 + pz.door.x1) / 2 : G.player.pos.x) + 0.5, (pz.door ? pz.door.y0 : G.player.pos.y) + 1 + k * 0.3, (pz.door ? (pz.door.z0 + pz.door.z1) / 2 : G.player.pos.z) + 0.5, "pale"); Sound.levelUp(); G.adv("lostpuzzle", id); saveNow(false); }
  const swapBlock = pz => pz.block || B.RESONANT_GLASS;
  const litSwitch = (c, on) => G.world.set(c.x, c.y, c.z, make(idOf(G.world.get(c.x, c.y, c.z)) || B.KEEPER_SWITCH, on ? 1 : 0));
  let progressOrder = {}, timing = {};
  function usePuzzleBlock(hit, kind) {
    const m = M(), s = st();
    for (const [id, pz] of Object.entries(m.puzzles)) {
      const at = c => c.x === hit.x && c.y === hit.y && c.z === hit.z;
      if (pz.kind === "tone" && at(pz.resonator)) {
        Sound.tone(660, 0.8, "sine", 0.1, 0); setTimeout(() => Sound.tone(990, 0.8, "sine", 0.08, 0), 200);
        L.noise(hit.x, hit.y, hit.z, 10, "a resonator", true);
        if (s.puz[id] === "solved") { UI.toast("The resonator hums. The door it opened stays open."); return true; }
        openDoor(id, pz); UI.toast("The resonator rings, and the stone door answers by sliding open. Keeper doors listen for tones.", "good"); return true;
      }
      if (pz.kind === "timing" && pz.resonators.some(at)) {
        Sound.tone(520 + pz.resonators.findIndex(at) * 130, 0.6, "sine", 0.1, 0);
        L.noise(hit.x, hit.y, hit.z, 10, "a resonator", true);
        if (s.puz[id] === "solved") { UI.toast("The chambers are already in tune."); return true; }
        const t = timing[id] || (timing[id] = {}); t[pz.resonators.findIndex(at)] = G.clock;
        const rung = Object.values(t).filter(v => G.clock - v <= pz.window).length;
        if (rung >= pz.resonators.length) { openDoor(id, pz); UI.toast("All three chambers ring together. The pressure door opens!", "good"); }
        else UI.toast(`Resonator ${rung} of ${pz.resonators.length} ringing… (ring them all within ${pz.window} seconds)`, "");
        return true;
      }
      if (pz.kind === "order" && pz.switches.some(at)) {
        const i = pz.switches.findIndex(at), sym = pz.symbols[i];
        if (s.puz[id] === "solved") { UI.toast(`The ${sym} switch. This puzzle is solved.`); return true; }
        const seq = progressOrder[id] || (progressOrder[id] = []);
        if (pz.order[seq.length] === i) {
          seq.push(i); litSwitch(pz.switches[i], true); Sound.tone(440 + seq.length * 110, 0.25, "triangle", 0.1, 0);
          if (seq.length === pz.order.length) {
            if (id === "forgePuzzle") { s.puz[id] = "solved"; UI.toast("The switches click into place. The anchor in the middle can be quieted now.", "good"); Sound.levelUp(); }
            else { openDoor(id, pz); UI.toast("The last switch clicks. Somewhere nearby, stone slides aside.", "good"); }
          } else UI.toast(`Switch: ${sym}. (${seq.length} of ${pz.order.length})`, "");
        } else {
          for (const c of pz.switches) litSwitch(c, false); progressOrder[id] = [];
          Sound.error(); UI.toast(`Switch: ${sym}. The switches reset with a dull clunk. Wrong order. ${pz.clue ? "Look for a clue nearby." : ""}`, "bad");
        }
        return true;
      }
      if (pz.kind === "all" && pz.switches.some(at)) {
        const i = pz.switches.findIndex(at), on = !(metaOf(G.world.get(hit.x, hit.y, hit.z)) & 1);
        if (s.puz[id] === "solved") { UI.toast("The garden is awake."); return true; }
        litSwitch(pz.switches[i], on); Sound.tone(on ? 660 : 330, 0.2, "triangle", 0.08, 0);
        const all = pz.switches.every(c => metaOf(G.world.get(c.x, c.y, c.z)) & 1);
        if (all) { openDoor(id, pz); UI.toast("WATER, LIGHT, and WARMTH all wake. The glass case opens!", "good"); }
        else UI.toast(`${pz.labels[i]}: ${on ? "on" : "off"}`, "");
        return true;
      }
      if (pz.kind === "switch" && pz.switches.some(at)) {
        if (s.puz[id] === "solved") { UI.toast("The sluice is open; the treasury is drained."); return true; }
        litSwitch(pz.switches[0], true);
        const d = pz.drain; for (let y = d.y0; y <= d.y1; y++) for (let z = d.z0; z <= d.z1; z++) for (let x = d.x0; x <= d.x1; x++) if (G.world.id(x, y, z) === B.WATER) G.world.set(x, y, z, B.AIR);
        s.puz[id] = "solved"; Sound.splash(); G.adv("lostpuzzle", id); saveNow(false);
        UI.toast("Water gurgles away down the low pipe. The flooded treasury below is dry now.", "good"); return true;
      }
      if (pz.kind === "swap" && at(pz.switch)) {
        const toA = s.puz[id] !== "A";
        for (const c of pz.setA) G.world.set(c.x, c.y, c.z, toA ? swapBlock(pz) : B.AIR);
        for (const c of pz.setB) G.world.set(c.x, c.y, c.z, toA ? B.AIR : swapBlock(pz));
        s.puz[id] = toA ? "A" : "B"; litSwitch(pz.switch, toA); Sound.tone(toA ? 700 : 500, 0.4, "triangle", 0.08, 0);
        UI.toast("The bridges trade places with a chime.", ""); return true;
      }
    }
    return false;
  }
  // Pulse platforms in the Echo Fields: solid on the beat, gone for a moment in between (there's always a slower solid way around)
  let pulseT = 0, pulseOn = true;
  function tickPulse(dt) {
    const m = M(); if (!m.pulse || !m.pulse.length) return;
    pulseT += dt;
    const period = reduced() ? 6 : 4.5, offFor = reduced() ? 1.2 : 1.5, want = (pulseT % period) < period - offFor;
    const warn = (pulseT % period) > period - offFor - 0.8 && want;
    if (warn && Math.random() < 0.3) { const c = m.pulse[Math.floor(Math.random() * m.pulse.length)]; if (Math.hypot(c.x - G.player.pos.x, c.z - G.player.pos.z) < 24) puff(c.x + 0.5, c.y + 1.1, c.z + 0.5, "pale"); }
    if (want === pulseOn) return;
    pulseOn = want;
    if (Math.hypot(m.pulse[0].x - G.player.pos.x, m.pulse[0].z - G.player.pos.z) < 60) Sound.tone(want ? 520 : 390, 0.2, "sine", 0.05, 0);
    for (const c of m.pulse) if (G.world.isLoaded(c.x, c.z)) G.world.set(c.x, c.y, c.z, want ? B.RESONANT_GLASS : B.AIR);
  }

  // ---------- the First Gate: sockets, calibration, activation ----------
  function useSocket(hit) {
    const s = st(), g = M().gate, sock = g.sockets.find(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (!sock) return;
    const slot = sock.slot, filled = s.sockets[slot];
    if (s.gate === "open") { UI.toast("The First Gate is open. Walk through the light to cross."); return; }
    if (s.gate === "charging") return;
    if (filled) {
      if (G.player.crouch && !s.gate) { giveItem(filled, 1); delete s.sockets[slot]; G.world.set(hit.x, hit.y, hit.z, B.GATE_SOCKET); UI.toast(`You take the ${itemDef(filled).name} back.`); return; }
      const ready = ORDER.every(k => s.sockets[k]);
      if (!ready) { UI.toast(`The ${SLOT_NAMES[slot]} socket holds the ${itemDef(filled).name}. (Crouch and right-click to take it back.)`); return; }
      if (s.gate === "calibrated") { startActivation(); return; }
      // calibration: touch the sockets in the right order (the Stabilization Procedure tablet tells you)
      calib.push(slot); Sound.tone(400 + ORDER.indexOf(slot) * 120, 0.3, "sine", 0.08, 0); puff(hit.x + 0.5, hit.y + 1.2, hit.z + 0.5, "pale");
      if (calib.some((k, i) => k !== ORDER[i])) { calib = []; Sound.error(); UI.toast("The gate's hum wavers out of tune. Start the calibration again. (The Stabilization Procedure tablet below the gate explains the order.)", "bad"); return; }
      if (calib.length === 4) { s.gate = "calibrated"; calib = []; Sound.levelUp(); UI.toast("Calibrated! The four tones hold steady. Right-click any socket once more to activate the gate.", "good"); saveNow(false); }
      else UI.toast(`Calibration: ${calib.length} of 4 tones in tune…`, "");
      return;
    }
    const fits = SOCKETS[slot], allowed = s.mode === "campaign" ? fits.slice(0, 1) : fits;
    const at = [G.useSlot, ...G.inv.slots.keys()].find(i => G.inv.slots[i] && allowed.includes(G.inv.slots[i].id));
    if (at === undefined) {
      const names = allowed.map(id => itemDef(id).name).join(" or ");
      UI.toast(`The ${SLOT_NAMES[slot]} socket is empty. It needs the ${names}.${slot === "echo" ? " The Warden in the Citadel carries it." : s.mode === "campaign" ? " (Campaign mode: only the temple relics fit.)" : ""}`);
      return;
    }
    const id = G.inv.slots[at].id;
    G.inv.slots[at].n--; if (!G.inv.slots[at].n) G.inv.slots[at] = null; G.hudDirty = true;
    s.sockets[slot] = id; G.world.set(hit.x, hit.y, hit.z, make(B.GATE_SOCKET, 1));
    for (let k = 0; k < 4; k++) puff(hit.x + 0.5, hit.y + 1 + k * 0.3, hit.z + 0.5, "pale");
    Sound.tone(500 + ORDER.indexOf(slot) * 140, 0.6, "sine", 0.1, 60);
    const left = ORDER.filter(k => !s.sockets[k]).length;
    UI.toast(left ? `The ${itemDef(id).name} settles into the ${SLOT_NAMES[slot]} socket. ${left} socket${left > 1 ? "s" : ""} to go.` : "All four sockets are filled! Now calibrate: touch the sockets in the order the Keepers' procedure gives.", "good");
    G.adv("lostsocket"); saveNow(false);
  }
  let calib = [], charge = null;
  function startActivation() {
    const s = st(); s.gate = "charging"; charge = { t: 0 };
    UI.toast("Activation! The gate draws power from the sockets. Stand back from the frame…", "good");
  }
  function tickGate(dt) {
    const s = st(), g = M().gate;
    if (s.gate === "charging" && !charge) charge = { t: 0 };   // loaded mid-charge
    if (charge) {
      charge.t += dt;
      if (Math.random() < 0.5) puff(g.x + rand(-5, 5) + 0.5, g.y + rand(1, 15), g.z + 0.5, "pale");
      if (Math.floor(charge.t * 2) !== Math.floor((charge.t - dt) * 2)) Sound.tone(300 + charge.t * 60, 0.3, "sine", 0.06, 40);
      if (charge.t > 5) { charge = null; s.gate = "open"; openVeil(true); Sound.levelUp(); UI.toast("The First Gate opens! Walk into the light to cross to the Echo Expanse.", "good"); G.adv("lostgate"); saveNow(false); }
    }
    if (s.gate === "open" && (s.veilFix = (s.veilFix || 0) + dt) > 2) { s.veilFix = 0; openVeil(false); }   // keep the veil lit (also after loading)
    // sockets show their state (they're re-lit from the story after loading)
    for (const sk of g.sockets) if (G.world.isLoaded(sk.x, sk.z)) { const want = s.sockets[sk.slot] ? 1 : 0; if ((metaOf(G.world.get(sk.x, sk.y, sk.z)) & 1) !== want) G.world.set(sk.x, sk.y, sk.z, make(B.GATE_SOCKET, want)); }
  }
  function openVeil(force) {
    const v = M().gate.veil;
    for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) { if (!G.world.isLoaded(x, v.z)) continue; const cur = G.world.get(x, y, v.z); if (idOf(cur) === B.GATE_VEIL && !(metaOf(cur) & 1)) G.world.set(x, y, v.z, make(B.GATE_VEIL, 1)); }
  }

  // ---------- checkpoints, districts, secrets, guardians ----------
  function useBeacon(hit) {
    const c = M().checkpoints.find(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (!c) return;
    st().cp[G.dim] = c.id; G.player.health = Math.min(20, G.player.health + 4); G.hudDirty = true;
    puff(hit.x + 0.5, hit.y + 1.3, hit.z + 0.5, "pale"); Sound.tone(880, 0.5, "triangle", 0.08, 200);
    UI.toast(`Keeper Beacon lit: ${c.name}. If you faint, you'll wake here.`, "good"); saveNow(false);
  }
  L.respawnSpot = () => {
    if (!inMap()) return null;
    const m = M(), c = m.checkpoints.find(q => q.id === st().cp[G.dim]);
    if (c) return { x: c.x + 1.5, y: c.y, z: c.z + 0.5, name: c.name };
    const a = m.arrival; return { x: a.x, y: a.y, z: a.z, name: G.dim === "deep" ? "the lift landing" : "the Arrival Sanctum" };
  };
  function tickPlaces(dt) {
    const p = G.player, s = st(), m = M();
    for (const d of m.districts || []) if (!s.districts[d.id] && Math.hypot(p.pos.x - d.x, p.pos.z - d.z) < d.r) { s.districts[d.id] = Date.now(); UI.toast(`Discovered: ${d.name}`, "good"); if (G.dim === "deep") G.adv("lostdistrict", d.id); }
    for (const q of m.secrets || []) if (!s.secrets[q.id] && Math.hypot(p.pos.x - q.x, p.pos.z - q.z) < 4 && Math.abs(p.pos.y - q.y) < 4) { s.secrets[q.id] = Date.now(); UI.toast(`Secret found: ${q.name}!`, "good"); G.adv("lostsecret", q.id); }
    if (G.dim === "deep" && !s.reachedCity && Math.hypot(p.pos.x - m.cityArrival.x, p.pos.z - m.cityArrival.z) < 10) { s.reachedCity = true; UI.toast("Echohold. The Keepers' city, silent under the stone. Walk softly.", "good"); G.adv("lostcity"); saveNow(false); }
    // guardians and creatures: each group appears when you come near, once per visit (cleared groups stay cleared)
    for (const g of m.spawns) {
      if (s.cleared[g.id] || (g.alive && g.alive.some(e => !e.dead && !e.gone))) continue;
      if (g.alive && g.alive.length) { s.cleared[g.id] = true; g.alive = null; continue; }   // you quieted them all
      if (calm() && G.dim === "deep" && g.kind !== "guardian") continue;   // after the ending, the city's listeners rest
      if (Math.hypot(p.pos.x - g.x, p.pos.z - g.z) > 40 || !G.world.isLoaded(g.x, g.z)) continue;
      g.alive = [];
      for (let i = 0; i < g.n; i++) { const a = i / g.n * Math.PI * 2, x = g.x + Math.cos(a) * Math.min(g.r, 3) + 0.5, z = g.z + Math.sin(a) * Math.min(g.r, 3) + 0.5; const e = ents.add(g.kind === "scout" ? "shard_scout" : g.kind, x, g.y, z); if (e) { e.home = { x, y: g.y, z }; if (g.dormant) e.dormant = true; g.alive.push(e); } }
    }
  }

  // ---------- the First Warden (the Citadel in Echohold) ----------
  // Phase 1: it hunts by sound (crouch to slip away); it winds up a shockwave ring (back off).
  // Phase 2: three pylons shield it; ring each pylon's resonator. Phase 3: faster, more shockwaves, calls crawlers once.
  let wf = null;   // the fight in progress (not saved: fainting or leaving resets it)
  function wardenTick(dt) {
    const s = st(), c = M().citadel, p = G.player;
    if (!c) return;
    const d = Math.hypot(p.pos.x - c.x, p.pos.z - c.z);
    if (!wf && s.warden !== "defeated" && d < c.r - 2 && Math.abs(p.pos.y - c.y) < 6 && G.mode === "survival") startWarden();
    if (!wf) return;
    if (d > c.r + 10 || wf.e.gone) { if (!wf.e.dead) resetWarden("You left the Citadel. The Warden returns to its post."); return; }
  }
  function startWarden() {
    const c = M().citadel, e = ents.add("warden", c.emerge.x, c.emerge.y, c.emerge.z);
    if (!e) return;
    wf = { e, pylons: [false, false, false], called: false };
    e.shockT = 5; e.hunt = null;
    for (let k = 0; k < 8; k++) puff(c.emerge.x + rand(-2, 2), c.emerge.y + rand(0, 4), c.emerge.z + rand(-2, 2), "pale");
    Sound.mob("roar", 0);
    UI.toast("The First Warden rises from the floor! It hunts by sound. Crouch to move quietly, and back away when its core glows.", "bad");
    for (const py of c.pylons) if (G.world.isLoaded(py.x, py.z)) G.world.set(py.x, py.y, py.z, B.RESONATOR);
  }
  function resetWarden(why) {
    if (!wf) return;
    if (wf.e && !wf.e.gone) { wf.e.gone = true; puff(wf.e.pos.x, wf.e.pos.y + 2, wf.e.pos.z, "pale"); }
    for (const e of ents.list) if (e.wardenCall) e.gone = true;
    wf = null; if (why) UI.toast(why, "");
  }
  const wardenPhase = e => (e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3);
  function usePylon(hit) {
    if (!wf) { UI.toast("A tuning pylon. It hums quietly."); return true; }
    const c = M().citadel, i = c.pylons.findIndex(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (i < 0) return false;
    if (wf.pylons[i]) { UI.toast("This pylon is already rung."); return true; }
    if (!wf.e.shieldUp) { UI.toast("The pylon is quiet for now. It only shields the Warden when it's badly hurt."); return true; }
    wf.pylons[i] = true; Sound.tone(780 + i * 120, 0.8, "sine", 0.1, 0); for (let k = 0; k < 5; k++) puff(hit.x + 0.5, hit.y + 1 + k * 0.3, hit.z + 0.5, "pale");
    L.noise(hit.x, hit.y, hit.z, 20, "a pylon", true);
    const left = wf.pylons.filter(v => !v).length;
    if (!left) { wf.e.shieldUp = false; UI.toast("All three pylons ring out of tune with it. The Warden's shield breaks! Strike now.", "good"); }
    else UI.toast(`Pylon rung! ${left} left. (The Warden heard that. Move!)`, "");
    return true;
  }
  function thinkWarden(E, e, d, dmgMul) {
    const p = G.player, ph = wardenPhase(e), step = Math.min(0.6, e.age - (e.lastT ?? e.age)); e.lastT = e.age;
    if (!wf) { e.gone = true; return; }
    if (ph >= 2 && !wf.shieldOnce) { wf.shieldOnce = true; e.shieldUp = true; UI.toast("The Warden draws power from the three pylons around the hall! Right-click each pylon's resonator to break its shield.", "bad"); }
    if (ph === 3 && !wf.called) { wf.called = true; for (let k = 0; k < 2; k++) { const m = ents.add("crawler", e.pos.x + rand(-4, 4), e.pos.y, e.pos.z + rand(-4, 4)); if (m) { m.wardenCall = true; m.alertT = 30; } } UI.toast("The Warden calls Hush Crawlers to help it!", "bad"); }
    // hearing: it knows where you are if you're noisy or very close; otherwise it goes to the last sound
    const heardYou = e.heard && e.heard.t > 0;
    const sense = d < (p.crouch ? 3 : 7) || (e.alertT || 0) > 0;
    if (e.alertT > 0) e.alertT -= step;
    if (e.charging) {
      e.charging -= step; e.goal = null; e.raise = 1;
      if (Math.random() < 0.6) puff(e.pos.x + rand(-1, 1), e.pos.y + 3, e.pos.z + rand(-1, 1), "pale");
      if (e.charging <= 0) { e.charging = 0; e.raise = 0; Sound.explode(d); const r = ph === 3 ? 7 : 6; E.addHazard(e.pos.x, e.pos.y, e.pos.z, r, 0.01, 6, "The Warden's shockwave hit you. When its core glows, back far away!", 0); e.shockT = ph === 3 ? 5 : 8; }
      return;
    }
    e.shockT = (e.shockT ?? 6) - step;
    if (e.shockT <= 0 && d < 10) { e.charging = 1.6; Sound.mob("roar", d); return; }
    if (sense) { E.chase(e, p); if (d < e.def.reach + 0.5 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "The First Warden caught you. Crouch to move quietly, and keep your distance.", e); e.attackCd = 1.6; e.swing = 0.4; } }
    else if (heardYou) { E.moveTo(e, e.heard, e.def.speed * (ph === 3 ? 1.4 : 1), 1.5); e.heard.t -= step; }
    else { e.goal = null; if (Math.random() < 0.02) puff(e.pos.x, e.pos.y + 4.2, e.pos.z, "pale"); }
  }
  function wardenDefeated(e) {
    const s = st(); wf = null; s.warden = "defeated";
    for (const m of ents.list) if (m.wardenCall) m.gone = true;
    giveItem(I.RESONANCE_CORE, 1); giveItem(I.WARDEN_PLATE, 1); giveItem(B.WARDEN_TROPHY, 1); giveXp(120);
    G.adv("lostwarden"); saveNow(false);
    api.victory("The First Warden Rests", "The guardian kneels and goes still. Its core comes loose: the Warden's Resonance Core, the last key to the First Gate.\n\nYou also found a Warden-Plate (armor that softens the sound of your steps) and a trophy for your base.", e.pos);
  }

  // ---------- the Resonant Sovereign (the Crownless Citadel in the Echo Expanse) ----------
  // Needs all three forge anchors quieted first. Phase 1: marked rings fall around you. Phase 2: its crown shields it;
  // tune all three arena stations (right-click) within 8 seconds of each other to break the crown for a while.
  // Phase 3: its heart opens: faster rings and motes, but no more shield.
  let sf = null;
  function sovereignTick(dt) {
    const s = st(), A = M().arena, p = G.player;
    if (!A) return;
    const d = Math.hypot(p.pos.x - A.x, p.pos.z - A.z);
    if (!sf && s.sovereign !== "calmed" && d < A.r - 2 && G.mode === "survival") {
      if (Object.keys(s.anchors).length < 3) { if (!s.anchorWarnT || G.clock > s.anchorWarnT) { s.anchorWarnT = G.clock + 20; UI.toast(`A crown of floating stone turns over the arena, and nothing stirs. Quiet the three forge anchors first (${Object.keys(s.anchors).length} of 3).`, ""); } }
      else startSovereign();
    }
    if (!sf) return;
    if (d > A.r + 12 || p.pos.y < A.y - 12) { if (!sf.e.dead) resetSovereign("You left the arena. The Sovereign drifts back to its resting place."); return; }
    for (const st2 of A.stations) if (G.world.isLoaded(st2.x, st2.z)) { const on = sf.tuned[st2.i] && G.clock - sf.tuned[st2.i] < 8 ? 1 : 0; if ((metaOf(G.world.get(st2.x, st2.y, st2.z)) & 1) !== on) G.world.set(st2.x, st2.y, st2.z, make(B.ANCHOR_STATION, on)); }
  }
  function startSovereign() {
    const A = M().arena, e = ents.add("sovereign", A.x, A.y + 3, A.z);
    if (!e) return;
    sf = { e, tuned: [0, 0, 0] }; e.ringT = 3; e.moteT = 8;
    Sound.mob("roar", 0);
    UI.toast("The Resonant Sovereign wakes! Watch the floor: glowing rings mark where its pulses land.", "bad");
  }
  function resetSovereign(why) {
    if (!sf) return;
    if (sf.e && !sf.e.gone) sf.e.gone = true;
    for (const e of ents.list) if (e.sovCall) e.gone = true;
    sf = null; if (why) UI.toast(why, "");
  }
  const sovPhase = e => (e.hp > e.maxHp * 0.6 ? 1 : e.hp > e.maxHp * 0.25 ? 2 : 3);
  function useArenaStation(hit) {
    const A = M().arena, i = A.stations.findIndex(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (i < 0) return false;
    if (!sf) { UI.toast("An arena station, waiting for a song."); return true; }
    sf.tuned[i] = G.clock; Sound.tone(520 + i * 160, 0.8, "sine", 0.1, 0); puff(hit.x + 0.5, hit.y + 1.2, hit.z + 0.5, "pale");
    const together = sf.tuned.every(t => t && G.clock - t < 8);
    if (together && sf.e.shieldUp) { sf.e.shieldUp = false; sf.openT = 10; sf.tuned = [0, 0, 0]; Sound.levelUp(); UI.toast("One whole note! The crown comes apart. Strike the Sovereign now!", "good"); }
    else if (sf.e.shieldUp) UI.toast(`Station tuned (${sf.tuned.filter(t => t && G.clock - t < 8).length} of 3). Tune all three within 8 seconds.`, "");
    else UI.toast("The station hums along with the others.", "");
    return true;
  }
  function thinkSovereign(E, e, d, dmgMul) {
    const p = G.player, ph = sovPhase(e), A = M().arena, step = Math.min(0.6, e.age - (e.lastT ?? e.age)); e.lastT = e.age;
    if (!sf) { e.gone = true; return; }
    // it floats over the middle of the arena, turning to face you
    e.goal = { x: A.x, y: A.y + 3, z: A.z, speed: 1 };
    e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z));
    if (ph === 2 && !sf.p2) { sf.p2 = true; e.shieldUp = true; UI.toast("Its crown locks into a shield! Tune all three arena stations (right-click) within 8 seconds of each other.", "bad"); }
    if (ph === 3 && !sf.p3) { sf.p3 = true; e.shieldUp = false; UI.toast("Its heart opens: no more shield. Stay out of the rings and finish this!", "good"); }
    if (ph === 2 && !e.shieldUp && (sf.openT -= step) <= 0) { e.shieldUp = true; UI.toast("The crown pulls itself back together. Tune the stations again!", ""); }
    e.ringT -= step;
    if (e.ringT <= 0 && E.targetable()) {
      const n = ph === 1 ? 3 : 4, fast = ph === 3 ? 1.2 : 1.6;
      for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, r = k === 0 ? 0 : rand(3, 6); E.addHazard(p.pos.x + Math.cos(a) * r, A.y, p.pos.z + Math.sin(a) * r, 2.4, fast + k * 0.15, 5, "A Sovereign pulse landed on you. Step out of the glowing rings!", 0); }
      e.ringT = ph === 3 ? 3 : 4.5; e.raise = 1; setTimeout(() => { e.raise = 0; }, 500);
    }
    e.moteT -= step;
    if (e.moteT <= 0) { e.moteT = ph === 3 ? 7 : 10; if (ents.list.filter(m => m.sovCall && !m.dead && !m.gone).length < 3) { const m = ents.add("mote", e.pos.x + rand(-3, 3), A.y + 2, e.pos.z + rand(-3, 3)); if (m) { m.sovCall = true; m.alertT = 30; } } }
    if (d < 5 && e.attackCd <= 0 && E.targetable()) { E.ctx.hurtPlayer(e.def.dmg * dmgMul, "You got too close to the Sovereign's core.", e); e.attackCd = 2; }
  }
  function sovereignDefeated(e) {
    const s = st(); sf = null; s.sovereign = "calmed";
    for (const m of ents.list) if (m.sovCall) m.gone = true;
    giveItem(I.ECHO_MANTLE, 1); giveItem(B.SOVEREIGN_TROPHY, 1); giveXp(200);
    G.adv("lostsovereign"); saveNow(false);
    api.victory("The Expanse Is Quiet", "The crown comes apart into a slow ring of light, and the hum stops. The Sovereign was never cruel; it only echoed the Keepers' machines.\n\nEchohold is calm now. You earned the Echo Mantle and the Sovereign's crown trophy. Your journal has one last page.", e.pos);
    setTimeout(() => L.readLore("epilogue"), 4500);
  }
  // Forge anchors in the Expanse: combat (quiet the knights that wake), puzzle (switches first), climb (reach the top)
  function useAnchor(hit) {
    const s = st(), m = M(), a = m.anchors.find(q => q.x === hit.x && q.y === hit.y && q.z === hit.z);
    if (!a) return useArenaStation(hit);
    if (s.anchors[a.id]) { UI.toast("This anchor is already quiet."); return true; }
    if (a.kind === "puzzle" && s.puz.forgePuzzle !== "solved") { UI.toast("The anchor won't quiet. Its three switches need setting first. " + m.puzzles.forgePuzzle.clue, ""); return true; }
    if (a.kind === "combat") {
      const alive = ents.list.filter(e => e.anchorTrial === a.id && !e.dead && !e.gone);
      if (alive.length) { UI.toast(`Quiet the Echo Knights first (${alive.length} left).`, "bad"); return true; }
      if (!s.trialStarted) { s.trialStarted = true; for (let k = 0; k < 3; k++) { const e = ents.add("knight", a.x + rand(-4, 4), a.y, a.z + rand(-4, 4)); if (e) { e.anchorTrial = a.id; e.home = { x: a.x, y: a.y, z: a.z }; } } UI.toast("Three Echo Knights step out to guard the anchor! Their shields block hits from the front, so circle around them.", "bad"); return true; }
    }
    s.anchors[a.id] = Date.now(); G.world.set(hit.x, hit.y, hit.z, make(B.ANCHOR_STATION, 1)); Sound.levelUp();
    for (let k = 0; k < 6; k++) puff(hit.x + 0.5, hit.y + 1 + k * 0.3, hit.z + 0.5, "pale");
    const n = Object.keys(s.anchors).length;
    UI.toast(n < 3 ? `Anchor quieted (${n} of 3). The Sovereign's crown flickers.` : "All three anchors are quiet. The Crownless Citadel to the north is open to you.", "good");
    G.adv("lostanchor", a.id); saveNow(false);
    return true;
  }

  // the boss hooks the creature code calls (see entities.js)
  ents.bossAI = {
    warden: thinkWarden, sovereign: thinkSovereign, templeboss: thinkTemple,
    hit(E, e, n, attacker) {
      if (e.shieldUp) { puff(e.pos.x, e.pos.y + e.def.h * 0.6, e.pos.z, "pale"); if (!e.shieldMsgT || G.clock > e.shieldMsgT) { e.shieldMsgT = G.clock + 4; UI.toast(e.sp === "warden" ? "Its shield holds! Ring the three pylons." : "The crown shields it! Tune the three stations.", ""); } return 0; }
      if (e.sp === "warden" && attacker === "player") { e.alertT = 4; }
      if (attacker === "explosion") n *= 0.3;
      return n;
    }
  };
  L.bossDefeated = e => { if (e.sp === "warden") { wardenDefeated(e); return true; } if (e.sp === "sovereign") { sovereignDefeated(e); return true; } if (MINION[e.sp]) { templeDefeated(e); return true; } return false; };
  L.onFaint = () => { if (wf) resetWarden(); if (sf) resetSovereign(); if (tf) resetTemple(); };
  L.bossInfo = () => {
    if (tf && tf.e && !tf.e.gone) { const e = tf.e, ph = tPhase(e); return { e, label: `${e.def.name} • Phase ${ph}${e.shieldUp ? ` • Shielded: use the ${TEMPLES[tf.kind].device}s (${tf.dev.filter(Boolean).length}/3)` : ""}`, frac: e.hp / e.maxHp }; }
    if (wf && wf.e && !wf.e.gone) { const e = wf.e, ph = wardenPhase(e); return { e, label: `The First Warden • Phase ${ph}${e.shieldUp ? ` • Shielded: ring the pylons (${wf.pylons.filter(Boolean).length}/3)` : ""}`, frac: e.hp / e.maxHp }; }
    if (sf && sf.e && !sf.e.gone) { const e = sf.e, ph = sovPhase(e); return { e, label: `The Resonant Sovereign • Phase ${ph}${e.shieldUp ? " • Crowned: tune the 3 stations" : ph === 2 ? " • Crown broken: strike!" : ""}`, frac: e.hp / e.maxHp }; }
    return null;
  };

  // ---------- interactions ----------
  L.interact = (hit, kind) => {
    if (kind === "lore" || kind === "mural") { const k = loreAt(hit.x, hit.y, hit.z); if (k) L.readLore(k); else UI.toast("The carving is too worn to read."); return true; }
    if (kind === "lift") { useLift(hit); return true; }
    if (!inMap()) {
      if (["resonator", "socket", "switch", "checkpoint", "anchorstation"].includes(kind)) { UI.toast("It only works in the Keepers' places."); return true; }
      return false;
    }
    if (kind === "checkpoint") { useBeacon(hit); return true; }
    if (kind === "socket") { useSocket(hit); return true; }
    if (kind === "anchorstation") return useAnchor(hit) || true;
    if (kind === "resonator") { if (G.dim === "deep" && M().citadel.pylons.some(q => q.x === hit.x && q.y === hit.y && q.z === hit.z)) return usePylon(hit); if (!usePuzzleBlock(hit, kind)) UI.toast("A resonator. It hums faintly."); return true; }
    if (kind === "switch" || kind === "mirror") { if (TEMPLES[G.dim] && useTempleDevice(hit)) return true; if (!usePuzzleBlock(hit, kind)) UI.toast(kind === "mirror" ? "A great mirror, turned away from the light." : "A Keeper switch. It doesn't seem connected to anything."); return true; }
    if (kind === "pedestal") { usePedestal(); return true; }
    return false;
  };
  L.blockBroken = (x, y, z, id) => { if (id === B.HUSH_NODE && inMap()) UI.toast("You broke a Hush Node. It won't shriek anymore.", "good"); };
  L.blockChanged = (x, y, z, loud) => { if (inMap()) L.noise(x + 0.5, y + 0.5, z + 0.5, loud ? 10 : 7, loud ? "mining" : "building"); };

  // ---------- atmosphere ----------
  L.sky = () => {
    if (!inMap()) return null;
    if (G.dim === "deep") return { sky: calm() ? 0x101820 : 0x070a10, daylight: 0, ambient: calm() ? 0.3 : 0.24, fogNear: 0.35, fogFar: 0.95 };
    if (G.dim === "sea") return { sky: 0x0a2a3a, daylight: 0, ambient: 0.3, fogNear: 0.35, fogFar: 0.95 };
    if (G.dim === "jungle") return { sky: 0x0e1e12, daylight: 0, ambient: 0.32, fogNear: 0.4, fogFar: 0.95 };
    if (G.dim === "desert") return { sky: 0x20180c, daylight: 0, ambient: 0.32, fogNear: 0.4, fogFar: 0.95 };
    return { sky: calm() ? 0x6a7aa8 : 0x3a3a6a, daylight: 0.55, ambient: 0.25, fogNear: 0.5, fogFar: 1 };
  };
  let ambT = 4;
  function ambience(dt) {
    const v = G.settings.fwAmbient ?? 0.8;
    if (v <= 0 || (ambT -= dt) > 0) return;
    ambT = rand(6, 14);
    if (G.dim === "deep") { if (Math.random() < 0.6) Sound.tone(rand(180, 260), 1.6, "sine", 0.02 * v, -20); else Sound.noise(1800, 0.15, 0.03 * v, 4); }   // a deep hum, a distant drip
    else Sound.tone(rand(500, 800), 1.2, "triangle", 0.02 * v, rand(-80, 80));   // the Expanse's soft chime
  }
  // the Expanse has no ground below: falling off brings you back to the last beacon (a little bruised)
  function tickVoid() {
    const p = G.player;
    if (G.dim !== "expanse" || p.pos.y > 8 || G.spectator) return;
    const s = L.respawnSpot(); Object.assign(p.pos, { x: s.x, y: s.y, z: s.z }); p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
    if (!G.creative) hurt(4, "You fell from the Expanse.", null, true);
    UI.toast(`You fell, and the Keepers' beacon pulled you back to ${s.name}.`, "bad");
  }

  // ---------- HUD ----------
  function hudTick() {
    const el = document.getElementById("lostHud");
    if (!el) return;
    if (!inMap() || TEMPLES[G.dim]) { el.hidden = true; return; }
    el.hidden = false;
    const s = st(), a = Math.round(s.alert), lvl = a >= 70 ? "high" : a >= 35 ? "mid" : "low";
    el.dataset.level = lvl;
    el.querySelector("i").style.width = a + "%";
    el.querySelector("b").textContent = calm() ? "The city is calm" : lvl === "high" ? "The city is stirring!" : lvl === "mid" ? "Something heard you" : G.player.crouch ? "Quiet (crouching)" : "Quiet";
    const snd = el.querySelector("em");
    if (lastSound && lastSound.t > 0 && G.settings.fwWords !== false) {
      const p = G.player, ang = Math.atan2(-(lastSound.x - p.pos.x), -(lastSound.z - p.pos.z)) - p.yaw, rel = Math.atan2(Math.sin(ang), Math.cos(ang));
      const side = Math.abs(rel) < 0.6 ? "ahead" : Math.abs(rel) > 2.5 ? "behind you" : rel > 0 ? "to your left" : "to your right";
      snd.textContent = `🔊 ${lastSound.what}${Math.hypot(lastSound.x - p.pos.x, lastSound.z - p.pos.z) > 2 ? " " + side : ""}`;
    } else snd.textContent = "";
  }

  // ---------- the main tick ----------
  L.tick = dt => {
    if (G.dim === "overworld" && st().site && !st().mapGiven && G.mode === "survival" && G.state === "play" && !(G.story.starter && (G.story.starter.house || G.story.starter.campaign))) {   // worlds with a Starter Home (or a campaign) get the Explorer's Map instead
      st().mapGiven = true; giveItem(I.SURVEY_MAP, 1);
      UI.toast("A Survey Map was tucked into your pack. Hold it to see the way to a Keeper excavation.", "good");
    }
    if (G.mode === "survival") tickMantle();
    if (!inMap()) { if (wf) resetWarden(); if (sf) resetSovereign(); if (tf) resetTemple(); hudTick(); return; }
    if (G.state === "play") checkVeil();
    tickPlaces(dt);
    if (TEMPLES[G.dim]) { if (G.mode === "survival") tickTraps(dt); else for (const t of M().traps || []) if (t.kind === "floor") tickCracks(t, tState[t.id] || (tState[t.id] = { cracks: {} }), dt); templeTick(); ambience(dt); hudTick(); return; }
    if (G.mode === "survival") tickStealth(dt);
    if (G.dim === "deep") { tickGate(dt); wardenTick(dt); }
    else { tickPulse(dt); sovereignTick(dt); tickVoid(); }
    ambience(dt);
    hudTick();
  };

  // ---------- the expedition journal ----------
  L.objective = () => {
    const s = st();
    if (s.sovereign === "calmed") return "Echohold is calm. Explore freely: find every cache, tablet, and secret you missed.";
    if (!s.site) return "No excavation site has been found in this world yet.";
    if (!s.visits) return "Follow your Survey Map to the Keeper excavation on the Surface, and ride the lift down.";
    if (!s.reachedCity) return "Follow the caverns down past the balcony, the dripstone, the crystal gallery, and the ravine to the city of Echohold.";
    if (s.warden !== "defeated") return "Explore Echohold. Find the three stabilizers (Archive, Foundry, Gardens), then face the First Warden in the Citadel for its Resonance Core.";
    if (s.gate !== "open") { const left = ORDER.filter(k => !s.sockets[k]); return left.length ? `Fill the First Gate's sockets (north end of the city). Still empty: ${left.map(k => SLOT_NAMES[k]).join(", ")}.` : s.gate === "calibrated" ? "Activate the gate: right-click any socket." : "Calibrate the gate: touch the four sockets in the order from the Stabilization Procedure tablet."; }
    if (Object.keys(s.anchors).length < 3) return `Cross the First Gate to the Echo Expanse and quiet the three forge anchors (${Object.keys(s.anchors).length} of 3).`;
    return "Go north to the Crownless Citadel and calm the Resonant Sovereign.";
  };
  L.journalHTML = () => {
    const s = st(), d = maps.deep && maps.deep.meta, x = maps.expanse && maps.expanse.meta;
    const all = { ...LORE, ...MURALS, ...MEMORIES, ...EXTRA };
    const story = Object.keys(all).filter(k => s.lore[k]).map(k => `<button class="chip-btn" data-lore="${k}">${all[k].title}</button>`).join("") || `<span class="note" style="color:#555">No tablets read yet.</span>`;
    const steps = LORE_STEPS.slice(1).map((t, i) => { const got = Object.entries(LORE).some(([k, v]) => v.step === i + 1 && s.lore[k]); return `<li class="${got ? "ok" : ""}">${got ? "✔ " + t : "? Not pieced together yet"}</li>`; }).join("");
    const dists = d ? d.districts.map(q => `<li class="${s.districts[q.id] ? "ok" : ""}">${s.districts[q.id] ? "✔ " + q.name : "? Not found yet"}</li>`).join("") : "";
    const cachesD = d ? Object.values(d.chests).filter(c => s.caches[c.id]).length + " / " + Object.keys(d.chests).length : "?";
    const cachesX = x ? Object.values(x.chests).filter(c => s.caches[c.id]).length + " / " + Object.keys(x.chests).length : "?";
    const secrets = [...(d ? d.secrets : []), ...(x ? x.secrets : [])].filter(q => s.secrets[q.id]).length;
    const sockets = ORDER.map(k => `<li class="${s.sockets[k] ? "ok" : ""}">${s.sockets[k] ? "✔" : "○"} ${SLOT_NAMES[k]}${s.sockets[k] ? ": " + itemDef(s.sockets[k]).name : ""}</li>`).join("");
    const test = G.creative && api.devTools ? `<div class="fw-test"><b>Test controls</b> (Creative only): <button class="chip-btn" data-lt="deep">Go to the Deep</button><button class="chip-btn" data-lt="city">Go to the city</button><button class="chip-btn" data-lt="gate">Go to the gate</button><button class="chip-btn" data-lt="items">Give stabilizers + core</button><button class="chip-btn" data-lt="sea">Sea temple</button><button class="chip-btn" data-lt="jungle">Jungle temple</button><button class="chip-btn" data-lt="desert">Desert temple</button><button class="chip-btn" data-lt="relics">Give relics</button><button class="chip-btn" data-lt="expanse">Go to the Expanse</button><button class="chip-btn" data-lt="anchors">Quiet anchors</button><button class="chip-btn" data-lt="alert">Max alert</button></div>` : "";
    return `<div class="fw-journal">
      <div><h4>Now</h4><p class="fw-obj">${L.objective()}</p>
        <h4>The Keepers' story</h4><ul>${steps}</ul>
        <h4>Districts of Echohold</h4><ul>${dists}</ul></div>
      <div><h4>First Gate sockets</h4><ul>${sockets}</ul>
        <h4>Progress</h4><ul><li>Caches in the Deep: ${cachesD}</li><li>Caches in the Expanse: ${cachesX}</li><li>Secrets: ${secrets}</li><li>Forge anchors quieted: ${Object.keys(s.anchors).length} / 3</li><li>First Warden: ${s.warden === "defeated" ? "✔ at rest" : "waiting in the Citadel"}</li><li>Resonant Sovereign: ${s.sovereign === "calmed" ? "✔ calmed" : "not yet"}</li></ul>
        <h4>Temples</h4><ul>${TEMPLE_KEYS.map(k => { const t = s.temples[k], site = siteOf(k); return `<li class="${t.relic ? "ok" : ""}">${t.relic ? "✔" : "○"} ${TEMPLES[k].name.replace(/^the /, "The ")}: ${!site ? "no entrance in this world" : t.relic ? "relic taken" : t.boss === "defeated" ? "guardian at rest, relic waiting" : t.visits ? "explored" : "not visited"}</li>`; }).join("")}</ul>
        <h4>Mode</h4><p class="note" style="color:#333">${s.mode === "campaign" ? "<b>Campaign</b>: only the true temple relics fit the gate." : "<b>Exploration</b>: the city's three stabilizers work in the gate."} <button class="chip-btn" data-lt="mode">Switch to ${s.mode === "campaign" ? "Exploration" : "Campaign"}</button></p>
        <h4>Staying quiet</h4><p class="note" style="color:#333">Running is loud; walking is soft; crouching and Hush Carpet are silent. Hush Nodes shriek at noise near them. Throw an Echo Shard to send listeners somewhere else. The Sanctuary of Silence blocks all sound.</p></div>
      <div class="fw-notes"><h4>Tablets, murals, and memories</h4>${story}</div>${test}</div>`;
  };
  L.testControl = async k => {
    const s = st();
    if (k === "mode") { if (s.gate === "open" || s.gate === "calibrated") { UI.toast("The gate is already set. The mode can't change now."); return; } s.mode = s.mode === "campaign" ? "exploration" : "campaign"; UI.toast(`Mode: ${s.mode === "campaign" ? "Campaign" : "Exploration"}.`, ""); return; }
    if (!G.creative) return;
    await L.ready();
    if (k === "deep") return L.goDown(false);
    if (k === "city") return G.dim === "deep" ? Object.assign(G.player.pos, maps.deep.meta.cityArrival) : L.goDown(true);
    if (k === "gate") { const g = maps.deep.meta.gate.stand; if (G.dim === "deep") Object.assign(G.player.pos, g); else travel("deep", { ...g }, "Going to the gate…"); return; }
    if (k === "items") { for (const id of [I.STAB_ARCHIVE, I.STAB_GARDEN, I.STAB_FOUNDRY, I.RESONANCE_CORE]) giveItem(id, 1); return; }
    if (k === "expanse") return travel("expanse", { ...maps.expanse.meta.arrival }, "Going to the Expanse…");
    if (TEMPLES[k]) return L.enterTemple(k);
    if (k === "relics") { for (const t of Object.values(TEMPLES)) giveItem(t.relic, 1); return; }
    if (k === "anchors") { for (const a of maps.expanse.meta.anchors) s.anchors[a.id] = Date.now(); UI.toast("All three anchors marked quiet (test)."); return; }
    if (k === "alert") { s.alert = 95; raiseAlert(10, "Test: alert raised."); }
  };
  return L;
}
