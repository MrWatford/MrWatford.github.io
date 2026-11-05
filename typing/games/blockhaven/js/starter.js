// The Starter Home and the Explorer's Map.
// Every new world gets a furnished cottage beside the spawn point (stamped into the land before any chunk is made, so
// trees, ruins, and villages can never overwrite it), four labeled supply chests filled exactly once, and an Explorer's
// Map in the hotbar that leads to the four real landmarks (Echohold, the Ancient City, through the Keeper excavation,
// and the entrances of the three temples). Older worlds get the same gift once, built in land nobody has visited yet.
// Everything is remembered in G.story.starter, so dying, sleeping, reloading, or switching modes never repeats it.
import { B, I, CHUNK, HEIGHT, SEA, make, idOf, itemDef, OPEN, TOP, HEAD, WET } from "./blocks.js";
import { newStack, OFF } from "./inventory.js";
import { hash3 } from "./noise.js";
import { Generator } from "./worldgen.js";

const KEEP = 65535;
const SIZE = 40, C = 20, R0 = 15, R1 = 20;   // the house stamp: 40 × 40, leveled ground out to 15 blocks, blended out to 20
export const HOUSE_V = 1;                     // raise only with a new builder that keeps old worlds' houses the same

// The landmark types the map knows, in the order the list shows them
const TYPES = {
  excavation: { label: "Ancient City", color: "#3fc8c0", dark: "#155a5a", where: "Underground" },
  sea: { label: "Sea Temple", color: "#3a8ae8", dark: "#163a6a", where: "Under the sea" },
  jungle: { label: "Jungle Temple", color: "#4cbf3a", dark: "#1d5a16", where: "Forest clearing" },
  desert: { label: "Desert Temple", color: "#f0b830", dark: "#6a4a10", where: "Buried in sand" },
  home: { label: "Starter Home", color: "#e8553a", dark: "#6a1e10", where: "Your house" }
};
const ORDER = ["excavation", "sea", "jungle", "desert", "home"];
const ZOOMS = [0.5, 1, 2, 4, 8];   // blocks per map pixel

// ---------- what goes in the four starter chests ----------
const S64 = 64;
const st = (id, n = 1) => ({ id, n });
const stacks = (id, count) => Array.from({ length: count }, () => st(id, S64));
export const STARTER_CHESTS = [
  { label: "Ultimate Starter Chest: Weapons & Armor", items: [
    st(I.DUSK_HELMET), st(I.DUSK_CHEST), st(I.DUSK_LEGS), st(I.DUSK_BOOTS),
    st(I.DUSK_SWORD), st(I.DUSK_PICK), st(I.DUSK_AXE), st(I.DUSK_SHOVEL), st(I.DUSK_HOE),
    st(I.SHIELD), st(I.BOW), ...stacks(I.ARROW, 4), st(I.GOLDEN_APPLE, S64), st(I.TOTEM), st(I.TOTEM)] },
  { label: "Ultimate Starter Chest: Food & Survival", items: [
    ...stacks(I.STEAK, 3), st(I.COOKED_PORK, S64), ...stacks(I.BREAD, 2), ...stacks(I.GOLDEN_CARROT, 2), st(I.GOLDEN_APPLE, S64),
    ...stacks(B.TORCH, 4), st(B.BED), st(I.WATER_BUCKET), st(I.WATER_BUCKET), st(I.WATER_BUCKET), st(I.MILK_BUCKET), st(I.BUCKET), st(I.HONEY_BOTTLE, 16)] },
  { label: "Ultimate Starter Chest: Building Supplies", items: [
    ...stacks(B.LOG, 4), ...stacks(B.PLANKS, 4), ...stacks(B.COBBLE, 6), ...stacks(B.STONE_BRICKS, 2), ...stacks(B.GLASS, 3),
    ...stacks(B.SHINESTONE, 2), ...stacks(I.COAL, 3), st(B.TABLE, 2), st(B.FURNACE, 2), st(B.CHEST, 4)] },
  { label: "Ultimate Starter Chest: Adventure Gear", items: [
    ...stacks(I.IRON_INGOT, 2), st(I.GOLD_INGOT, S64), st(I.SKYSHARD, S64), st(I.DUSK_INGOT, 32),
    st(I.COMPASS), st(I.EXPLORER_MAP), st(I.BOAT), st(I.CHEST_BOAT),
    ...stacks(B.HUSH_CARPET, 2), st(I.ECHO_SHARD, 16), ...stacks(B.DIRT, 2), ...stacks(B.TORCH, 2), st(I.SHEARS), st(I.FISHING_ROD)] }
];

const WELCOME = "Welcome to Block Haven! Your starter home is stocked, your adventure map is ready, and legendary places are waiting to be discovered.";

export function initStarter(api) {
  const { G, UI, Sound, L, openPanel, closePanel } = api;
  const S = {};
  const data = () => G.story.starter || null;
  const k3 = (x, y, z) => x + "," + y + "," + z;
  // the Surface's land shape (the map reads it even while you're in another dimension)
  let ow = null;
  const surf = () => { if (!ow || ow.seed !== G.meta.seed) { ow = { seed: G.meta.seed, gen: new Generator(G.meta.seed, G.meta.gen || 1) }; colCache.clear(); shoreMemo = null; } return ow.gen; };

  // ---------- choosing the spot ----------
  // A flat, dry patch (no mountain, water, village, ruin, stronghold, or landmark nearby). New worlds look right by the
  // spawn point; older worlds look farther out, in chunks nobody has visited or changed, so no player build is touched.
  function landmarkCenters() {
    const s = G.story.lost || {}, out = [];
    if (s.site) out.push({ x: s.site.x + 16, z: s.site.z + 16, r: 20 });
    for (const t of Object.values(s.tsites || {})) if (t) out.push({ x: t.x + 16, z: t.z + 16, r: t.lake ? t.lake.r1 + 4 : 20 });
    return out;
  }
  function findSite(gen, wdata, fresh, from) {
    const visited = new Set(wdata.visited || []), mods = wdata.mods || {}, marks = landmarkCenters();
    const check = (cx, cz, strict) => {
      for (let gx = Math.floor((cx - R1 - 1) / CHUNK); gx <= Math.floor((cx + R1) / CHUNK); gx++) for (let gz = Math.floor((cz - R1 - 1) / CHUNK); gz <= Math.floor((cz + R1) / CHUNK); gz++) {
        const k = gx + "," + gz;
        if (visited.has(k) || mods[k]) return null;
        if (gen.villagePiece && gen.villagePiece(gx, gz)) return null;   // never inside a village
        if (hash3(gen.seed, gx, 99, gz) < 0.035 || hash3(gen.seed, gx, 77, gz) < 0.02) return null;   // or on a ruin
      }
      for (const s of gen.strongholds || []) if (Math.hypot(s.x - cx, s.z - cz) < 110) return null;
      for (const m of marks) if (Math.hypot(m.x - cx, m.z - cz) < m.r + R1 + 24) return null;
      const hs = [];
      for (let dz = -R0 - 2; dz <= R0 + 2; dz += 4) for (let dx = -R0 - 2; dx <= R0 + 2; dx += 4) {
        if (dx * dx + dz * dz > (R0 + 2) ** 2) continue;
        const c = gen.column(cx + dx, cz + dz);
        if (c.h <= SEA + 1 || c.biome === "peak" || c.biome === "mountain" || c.h > SEA + 20) return null;
        hs.push(c.h);
      }
      hs.sort((a, b) => a - b);
      if (hs[hs.length - 1] - hs[0] > (strict ? 4 : 8)) return null;
      return { cx, cz, g: Math.max(SEA + 2, hs[Math.floor(hs.length / 2)]) };
    };
    const [r0, r1] = fresh ? [0, 200] : [64, 520];
    for (const strict of [true, false]) for (let r = r0; r <= r1; r += 6) {
      const n = Math.max(1, Math.round(Math.PI * 2 * r / 10));
      for (let a = 0; a < n; a++) {
        const t = a / n * Math.PI * 2 + r * 0.37, x = Math.round(from.x + Math.cos(t) * r), z = Math.round(from.z + Math.sin(t) * r);
        const site = check(x, z, strict);
        if (site) return site;
      }
    }
    if (!fresh) return null;
    // nothing flat nearby at all: build right at spawn anyway (the leveled plot and blended edges still make it safe)
    const x = Math.round(from.x), z = Math.round(from.z);
    return { cx: x, cz: z, g: Math.max(SEA + 2, Math.min(SEA + 20, gen.column(x, z).h)) };
  }

  // ---------- the cottage ----------
  // Built into a 40 × 40 stamp around the house's middle (cx, cz). X runs east, Z runs south; the front door faces south.
  function buildHouse(h) {
    const cells = new Uint16Array(SIZE * SIZE * HEIGHT).fill(KEEP), g = h.g;
    const set = (X, y, Z, v) => { const lx = C + X, lz = C + Z; if (lx < 0 || lz < 0 || lx >= SIZE || lz >= SIZE || y < 1 || y >= HEIGHT) return; cells[lx + lz * SIZE + y * SIZE * SIZE] = v; };
    const box = (x0, y0, z0, x1, y1, z1, v) => { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) set(x, y, z, typeof v === "function" ? v(x, y, z) : v); };
    const info = { chests: [], signs: [], table: null };
    // the leveled plot: solid ground under it (no floating), open sky over it (no trees, no buried rooms)
    for (let Z = -C; Z < C; Z++) for (let X = -C; X < C; X++) {
      if (Math.hypot(X + 0.5, Z + 0.5) > R0) continue;
      for (let y = g - 8; y < HEIGHT; y++) set(X, y, Z, y < g - 3 ? B.STONE : y < g ? B.DIRT : y === g ? B.GRASS : B.AIR);
    }
    // foundation and floor
    box(-7, g - 1, -6, 7, g - 1, 4, B.COBBLE);
    box(-7, g, -6, 7, g, 4, (x, y, z) => (Math.abs(x) === 7 || z === -6 || z === 4 ? B.STONE_BRICKS : B.PLANKS));
    box(-6, g, -5, 6, g, 3, (x, y, z) => (Math.abs(x) === 6 || z === -5 || z === 3 ? B.STONE_BRICKS : B.PLANKS));
    box(-1, g, -1, 1, g, 0, B.WOOL);   // a rug
    // walls: a stone course, plank walls, log corners and a log beam on top
    for (let y = g + 1; y <= g + 4; y++) for (let Z = -5; Z <= 3; Z++) for (let X = -6; X <= 6; X++) {
      const edge = Math.abs(X) === 6 || Z === -5 || Z === 3, corner = Math.abs(X) === 6 && (Z === -5 || Z === 3);
      if (!edge) { set(X, y, Z, y === g + 4 ? B.PLANKS : B.AIR); continue; }
      set(X, y, Z, corner || y === g + 4 ? B.LOG : y === g + 1 ? B.STONE_BRICKS : B.PLANKS);
    }
    // windows
    for (const y of [g + 2, g + 3]) {
      for (const X of [-4, -3, 3, 4]) set(X, y, 3, B.GLASS);          // front
      for (const X of [-3, -2, 2, 3]) set(X, y, -5, B.GLASS);         // back
      for (const Z of [-4, -3]) set(-6, y, Z, B.GLASS);               // west, over the bed
      for (const Z of [0, 1]) set(6, y, Z, B.GLASS);                  // east, over the map table
    }
    // the front door (closed; right-click to open)
    set(0, g + 1, 3, make(B.DOOR, 0)); set(0, g + 2, 3, make(B.DOOR, TOP)); set(0, g + 3, 3, B.PLANKS);
    // ceiling lights
    for (const [X, Z] of [[-3, -2], [3, -2], [0, 1]]) set(X, g + 4, Z, B.SHINESTONE);
    // a gable roof of red brick (ridge runs east to west) with plank gable ends, and a chimney
    for (let k = 0; k <= 5; k++) {
      const y = g + 5 + k, za = -6 + k, zb = 4 - k;
      for (let Z = za; Z <= zb; Z++) for (let X = -7; X <= 7; X++) {
        if (Z === za || Z === zb) set(X, y, Z, B.BRICKS);
        else set(X, y, Z, Math.abs(X) === 6 ? B.PLANKS : B.AIR);
      }
    }
    for (let y = g + 5; y <= g + 10; y++) set(4, y, -3, B.COBBLE);
    // furniture
    set(-5, g + 1, -3, make(B.BED, 2)); set(-5, g + 1, -4, make(B.BED, 2 | HEAD));   // head against the back wall
    set(-4, g + 1, -4, B.BOOKSHELF);                                                  // a bedside shelf
    for (const Z of [-1, 0, 1]) { set(-5, g + 1, Z, B.BOOKSHELF); set(-5, g + 2, Z, B.BOOKSHELF); }   // the library wall
    set(-1, g + 1, -4, B.TABLE); set(0, g + 1, -4, make(B.FURNACE, 0)); set(1, g + 1, -4, make(B.FURNACE, 0));   // the kitchen and workshop
    for (let i = 0; i < 4; i++) { set(5, g + 1, -4 + i, make(B.CHEST, 3)); info.chests.push({ X: 5, y: g + 1, Z: -4 + i }); }   // the four supply chests, facing into the room
    set(5, g + 1, 1, B.MAP_TABLE); info.table = { X: 5, y: g + 1, Z: 1 };            // the expedition corner
    set(5, g + 1, 2, B.BOOKSHELF); set(5, g + 2, 2, B.BOOKSHELF);
    // the front porch: plank floor, fence posts, a roof with a light
    box(-3, g, 4, 3, g, 5, B.PLANKS); box(-3, g - 1, 5, 3, g - 1, 5, B.COBBLE);
    for (const X of [-3, 3]) for (let y = g + 1; y <= g + 3; y++) set(X, y, 5, B.OAK_FENCE);
    box(-3, g + 4, 4, 3, g + 4, 5, B.PLANKS); set(0, g + 4, 5, B.SHINESTONE);
    // flower beds along the front
    for (const X of [-6, -5, -4, 4, 5, 6]) set(X, g + 1, 5, X % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
    // the entrance path with lamp posts
    box(-1, g, 6, 1, g, 13, B.GRAVEL);
    for (const [X, Z] of [[-2, 9], [2, 9], [-2, 13], [2, 13]]) { set(X, g + 1, Z, B.OAK_FENCE); set(X, g + 2, Z, B.OAK_FENCE); set(X, g + 3, Z, B.TORCH); }
    // two signs by the path, facing the way you arrive
    set(-2, g + 1, 6, make(B.SIGN, 0)); info.signs.push({ X: -2, y: g + 1, Z: 6, title: "Sign", text: "Welcome to Block Haven!" });
    set(2, g + 1, 6, make(B.SIGN, 0)); info.signs.push({ X: 2, y: g + 1, Z: 6, title: "Sign", text: "Starter Home\n\nThis house is yours. Supplies are in the four chests along the right-hand wall. The Expedition Table beside them keeps a spare Explorer's Map." });
    // the garden: fenced, with a water channel, ripe wheat and carrots, and a gate on the front side
    for (let Z = -3; Z <= 3; Z++) for (let X = 9; X <= 14; X++) {
      const edge = X === 9 || X === 14 || Z === -3 || Z === 3;
      if (edge) { set(X, g + 1, Z, X === 11 && Z === 3 ? make(B.OAK_GATE, 0) : B.OAK_FENCE); continue; }
      if (Z === 0) { set(X, g, Z, B.WATER); set(X, g - 1, Z, B.DIRT); continue; }
      set(X, g, Z, make(B.FARMLAND, WET)); set(X, g + 1, Z, make(Z < 0 ? B.WHEAT : B.CARROTS, 7));
    }
    set(9, g + 2, -3, B.TORCH); set(14, g + 2, -3, B.TORCH); set(9, g + 2, 3, B.TORCH); set(14, g + 2, 3, B.TORCH);
    box(8, g, 1, 8, g, 4, B.GRAVEL); box(9, g, 4, 13, g, 4, B.GRAVEL);   // a little path from the porch to the garden gate
    box(2, g, 6, 8, g, 6, B.GRAVEL);
    set(12, g + 1, -5, B.HAY); set(13, g + 1, -5, B.COMPOSTER);
    return { cells, info };
  }
  let built = null;   // { key, cells, info } (the stamp is rebuilt from the saved plan each time the world opens)
  function houseStamp() {
    const h = data().house, key = [h.cx, h.cz, h.g, h.v].join(",");
    if (!built || built.key !== key) built = { key, ...buildHouse(h) };
    return built;
  }
  const world = (X, y, Z) => { const h = data().house; return { x: h.cx + X, y, z: h.cz + Z }; };

  // ---------- planning, before the Surface's land is made (called from makeWorld) ----------
  S.plan = (gen, wdata) => {
    let s = data();
    if (!s) {
      const fresh = !(wdata.visited && wdata.visited.length) && !Object.keys(wdata.mods || {}).length;
      const from = fresh ? gen.findSpawn() : ((G.meta.player && G.meta.player.spawn) || gen.findSpawn());
      const site = findSite(gen, wdata, fresh, from);
      s = G.story.starter = { v: 1, fresh, house: site ? { ...site, v: HOUSE_V } : null, waypoint: true, zoom: 2 };
      if (!site) { s.none = true; return; }
      // the house's signs keep their writing in the world's sign list
      const signs = wdata.signs || (wdata.signs = {});
      for (const q of buildHouse(s.house).info.signs) { const p = world(q.X, q.y, q.Z); signs[k3(p.x, p.y, p.z)] = q.text; }
    }
    // the landmarks must stay clear of the house (chooseSite measures from 32-block stamp corners)
    if (s.house) L.avoid = [{ x: s.house.cx - 16, z: s.house.cz - 16 }];
  };
  // after the landmarks are placed: add the house to the land's stamps (last, so nothing else draws over it)
  S.stamp = gen => {
    const s = data(); if (!s || !s.house) return;
    const b = houseStamp();
    gen.stamps = gen.stamps || [];
    gen.stamps.push({ x: s.house.cx - C, z: s.house.cz - C, size: SIZE, cells: b.cells, blend: { g: s.house.g, r0: R0, r1: R1, top: B.GRASS, under: B.DIRT } });
  };
  // where a new player first stands: on the path just outside the front door, looking at the house
  S.spawnPoint = () => {
    const s = data(); if (!s || !s.house || !s.fresh) return null;
    const p = world(0, s.house.g + 1, 7); return { x: p.x + 0.5, y: p.y, z: p.z + 0.5, yaw: 0 };
  };
  S.house = () => { const s = data(); if (!s || !s.house) return null; const d = world(0, s.house.g + 1, 7); return { x: d.x + 0.5, y: d.y, z: d.z + 0.5, door: world(0, s.house.g + 1, 3) }; };

  // ---------- the one-time gift: chests filled once, a map in the hotbar ----------
  const hasMap = () => G.inv.slots.some(q => q && q.id === I.EXPLORER_MAP);
  function grant() {
    const s = data(), w = G.world, b = houseStamp();
    b.info.chests.forEach((c, i) => {
      const p = world(c.X, c.y, c.Z), key = k3(p.x, p.y, p.z);
      if (w.containers.has(key)) return;   // never refill a chest that already exists
      const def = STARTER_CHESTS[i], slots = new Array(27).fill(null);
      def.items.forEach((q, j) => { if (j < 27 && itemDef(q.id)) slots[j] = newStack(q.id, q.n); });
      w.containers.set(key, { type: "chest", slots, label: def.label });
    });
    // the map goes in the hotbar (the first empty slot there, or the first slot if a new world's hotbar is somehow full)
    let given = false;
    if (!hasMap()) {
      const free = [...Array(9).keys()].find(i => !G.inv.slots[i]);
      if (free !== undefined) { G.inv.slots[free] = newStack(I.EXPLORER_MAP, 1); given = true; }
      else if (!G.inv.add(I.EXPLORER_MAP, 1)) given = true;
    }
    s.mapGiven = given; s.granted = Date.now();
    s.dest = nearestKind(s.fresh ? S.house() : G.player.pos) || "home";
    if (G.story.lost) G.story.lost.mapGiven = true;   // the Explorer's Map replaces the Keeper Survey Map for new players
    G.hudDirty = true;
  }
  function nearestKind(from) {
    let best = null;
    for (const m of L.landmarks()) { const d = Math.hypot(m.x - from.x, m.z - from.z); if (!best || d < best.d) best = { d, kind: m.kind }; }
    return best && best.kind;
  }
  S.nearestKind = nearestKind;

  let startT = 0;
  S.tick = dt => {
    const s = data(); if (!s || !s.house) return;
    if (!s.granted && G.dim === "overworld" && G.world && G.inv) grant();
    if (G.state === "play") startT += dt; else if (!s.welcomed) startT = Math.min(startT, 0.6);
    if (s.granted && !s.welcomed && G.state === "play" && startT > 0.8 && !G.spectator) { s.welcomed = true; showWelcome(); }
    hudTick();
  };
  S.resetClock = () => { startT = 0; };

  function controlsText() {
    const touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    return [
      "• Open the Explorer's Map: press M (or hold the map and right-click; F works too if you have no mouse). Press M or Esc to close it.",
      "• Choose where to go: click (or tap) a landmark in the map's list, or its picture on the map. Press N to show or hide the on-screen waypoint arrow.",
      "• Your supplies: the four labeled chests along the right-hand wall inside the house. Right-click a chest to open it.",
      "• Going home: pick \"Starter Home\" in the map's list and follow the waypoint. Lost the map? Right-click the Expedition Table next to the chests for a new one.",
      touch ? "• On a touchscreen, tap the map's buttons. Moving around still needs a keyboard and mouse or trackpad." : ""
    ].filter(Boolean).join("\n\n");
  }
  function showWelcome() {
    const s = data();
    let text;
    if (s.fresh) text = WELCOME + "\n\n" + controlsText();
    else {
      const h = S.house(), d = Math.round(Math.hypot(h.x - G.player.pos.x, h.z - G.player.pos.z));
      text = "Block Haven has a new welcome gift for this world: a furnished Starter Home, stocked supply chests, and an Explorer's Map that leads to the legendary places.\n\n" +
        `Your Starter Home was built about ${d} blocks to the ${compass8(h.x - G.player.pos.x, h.z - G.player.pos.z)}, on open land nobody had visited, so none of your builds were touched.` +
        (s.mapGiven ? " The map is in your inventory." : " Your inventory was full, so pick up the map from the Expedition Table inside the house (the map's waypoint arrow is already on).") + "\n\n" + controlsText();
    }
    openPanel("note", { title: "Welcome to Block Haven!", text });
    Sound.levelUp();
  }

  // ---------- signs and the Expedition Table ----------
  S.readSign = hit => {
    const wd = G.dimData[G.dim] || (G.dimData[G.dim] = {}), signs = wd.signs || (wd.signs = {}), key = k3(hit.x, hit.y, hit.z), text = signs[key];
    if (text) { UI.openNote("Sign", text, false); return; }
    // a blank sign: write on it (once; break and replace the sign to start over)
    const t = window.prompt("Write on the sign (up to 90 letters):", "");
    if (t && t.trim()) { signs[key] = t.trim().slice(0, 90); UI.toast("Written on the sign. Right-click it to read it.", "good"); }
  };
  S.blockBroken = (x, y, z, id) => { if (id === B.SIGN) { const wd = G.dimData[G.dim]; if (wd && wd.signs) delete wd.signs[k3(x, y, z)]; } };
  S.useTable = () => {
    if (!hasMap()) {
      const left = G.inv.add(I.EXPLORER_MAP, 1);
      if (left) { G.dropItem(I.EXPLORER_MAP, 1); UI.toast("A fresh Explorer's Map (your inventory is full, so it dropped at your feet).", "good"); }
      else UI.toast("A fresh copy of your Explorer's Map. Press M to open it.", "good");
      G.hudDirty = true; Sound.click();
    }
    S.openMap();
  };
  S.openMap = () => { if (G.state === "play" || G.state === "panel") openPanel("xmap"); };
  S.canOpen = () => G.creative || hasMap();
  S.toggleWaypoint = () => {
    const s = data(); if (!s || !s.house) return;
    s.waypoint = !s.waypoint;
    UI.toast(s.waypoint ? `Waypoint on: ${destOf(s.dest) ? destOf(s.dest).title : "Starter Home"}` : "Waypoint hidden. Press N to show it again.");
  };

  // ---------- destinations ----------
  // Each one is a real place in this world: the lift that leads into the landmark (or the house's front path).
  let destCache = { t: -1, list: [] };
  function destinations() {
    const ck = (G.meta && G.meta.id) + ":" + G.clock;
    if (destCache.t === ck && destCache.list.length) return destCache.list;
    const out = [];
    for (const m of L.landmarks()) {
      const T = TYPES[m.kind], d = { kind: m.kind, title: T.label, name: m.name, x: m.x + 0.5, y: m.y, z: m.z + 0.5, center: m.center, visited: m.visited, relic: m.relic, lake: m.lake };
      if (m.kind === "sea") d.shore = shorePoint(m);
      out.push(d);
    }
    const h = S.house();
    if (h) out.push({ kind: "home", title: "Starter Home", name: "Your house", x: h.x, y: h.y, z: h.z });
    destCache = { t: ck, list: out.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind)) };
    return out;
  }
  const destOf = kind => destinations().find(d => d.kind === kind) || null;
  S.destinations = destinations;
  // The best place to set off by boat for the lighthouse: the nearest real shore, nudged toward home
  let shoreMemo = null;
  function shorePoint(m) {
    surf();   // (a different world clears the memo)
    const key = G.meta.seed + ":" + m.center.x + "," + m.center.z;
    if (shoreMemo && shoreMemo.key === key) return shoreMemo.p;
    const home = S.house() || G.player.pos, gen = surf();
    let best = null;
    if (m.lake) {   // a carved bay: its beach is a ring around it
      const a = Math.atan2(home.z - m.center.z, home.x - m.center.x), r = m.lake.r1 - 3;
      best = { x: Math.round(m.center.x + Math.cos(a) * r), z: Math.round(m.center.z + Math.sin(a) * r) };
    } else {
      for (let a = 0; a < 32; a++) {
        const t = a / 32 * Math.PI * 2;
        for (let r = 10; r <= 200; r += 2) {
          const x = Math.round(m.center.x + Math.cos(t) * r), z = Math.round(m.center.z + Math.sin(t) * r);
          if (gen.column(x, z).h > SEA) {
            const score = r + 0.25 * Math.hypot(x - home.x, z - home.z);
            if (!best || score < best.score) best = { x, z, score, r };
            break;
          }
        }
      }
    }
    if (best) best = { x: best.x + 0.5, z: best.z + 0.5, row: Math.round(Math.hypot(best.x - m.center.x, best.z - m.center.z)) };
    shoreMemo = { key, p: best };
    return best;
  }
  // A plain-language look along the straight line: water, high ground, and how far
  function travelNotes(d) {
    const p = G.player.pos, gen = surf(), dist = Math.hypot(d.x - p.x, d.z - p.z), n = Math.max(1, Math.floor(dist / 8));
    let water = 0, high = 0, top = 0, lakes = destinations().filter(q => q.lake);
    for (let i = 1; i < n; i++) {
      const x = p.x + (d.x - p.x) * i / n, z = p.z + (d.z - p.z) * i / n;
      const inLake = lakes.some(q => Math.hypot(x - q.center.x, z - q.center.z) < q.lake.r0 + 4);
      const c = gen.column(Math.floor(x), Math.floor(z));
      if (inLake || c.h < SEA) water += dist / n;
      else if (c.biome === "mountain" || c.biome === "peak" || c.h >= SEA + 22) { high += dist / n; top = Math.max(top, c.h); }
    }
    const notes = [];
    if (dist < 8) notes.push("You're here!");
    else {
      notes.push(`About ${fmt(dist)} blocks to the ${compass8(d.x - p.x, d.z - p.z)} in a straight line. The dashed line on the map only shows the direction; it is not a checked walking path.`);
      if (water >= 24) notes.push(`That line crosses about ${fmt(water)} blocks of water. Use the Boat from the Adventure Gear chest, or build a bridge.`);
      if (high >= 24) notes.push(`It also crosses about ${fmt(high)} blocks of hills or mountains (up to height ${top}). Walk around them, or tunnel through with your pickaxe.`);
      if (water < 24 && high < 24) notes.push("The land along that line is mostly low and open, but watch for rivers, caves, and cliffs.");
    }
    return notes;
  }
  function guide(d) {
    if (d.kind === "excavation") return `Echohold, the Ancient City, is deep underground: you can't walk to it across the Surface. Its only entrance is the Keeper excavation, a round dig site with a tall dark stone obelisk and a timber crane. Walk down the steps into the pit and right-click the Keeper Lift (at ${pos(d)}). The lift takes you to the Deep; follow the caverns from there to the city. Bring torches and food, and walk on Hush Carpet or crouch so the city doesn't hear you.`;
    if (d.kind === "sea") {
      const sh = d.shore;
      return `The Drowned Citadel lies under the sea. Its entrance is a lighthouse on a stone pier out in deep water (the lift is at ${pos(d)}).` +
        (sh ? ` Leave from the shore point marked with the boat icon (${Math.round(sh.x)}, ${Math.round(sh.z)}), about ${sh.row} blocks from the lighthouse: place your Boat on the water there, right-click to get in, and row straight to the pier.` : " Place your Boat on the water at the nearest beach and row to the pier.") +
        " Climb the steps at the gap in the pier wall, go into the lighthouse, and right-click the lift. Swimming the whole way is risky: you'll run out of air in deep water.";
    }
    if (d.kind === "jungle") return `The Verdant Labyrinth's entrance is a vine-covered step temple in a forest clearing. Climb the stairs on its south face to the very top, where the lift waits (at ${pos(d)}). The labyrinth itself is underneath.`;
    if (d.kind === "desert") return `Only the tip of the Sunken Pyramid of Aurelis shows above the sand. Go in through the doorway on its south side to the lift chamber (the lift is at ${pos(d)}). The rest of the pyramid is buried below.`;
    return `Your Starter Home: bed, workbench, two furnaces, the four supply chests, and the Expedition Table (right-click it for a spare Explorer's Map). You first arrived on the path at ${pos(d)}.`;
  }
  const pos = d => `x ${Math.floor(d.x)}, y ${d.y}, z ${Math.floor(d.z)}`;
  const fmt = n => Math.round(n).toLocaleString();
  function compass8(dx, dz) {
    const a = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;   // 0 = north (-z), 90 = east (+x)
    return ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"][Math.round(a / 45) % 8];
  }
  S.compass8 = compass8;

  // ---------- the held map's dial and the on-screen waypoint ----------
  S.reading = () => {
    const s = data(), d = s && destOf(s.dest);
    if (!d) return { yaw: null, text: "The map is blank here" };
    if (G.dim !== "overworld") return { yaw: null, text: "The map only shows the Surface" };
    const p = G.player, ang = Math.atan2(-(d.x - p.pos.x), -(d.z - p.pos.z));
    return { yaw: ang - p.yaw, text: `${d.title}: ${fmt(Math.hypot(d.x - p.pos.x, d.z - p.pos.z))} blocks` };
  };
  let hudEl = null;
  function hudTick() {
    hudEl = hudEl || document.getElementById("waypoint");
    if (!hudEl) return;
    const s = data(), d = s && s.waypoint && G.dim === "overworld" && (G.state === "play" || G.state === "panel") && !G.cutscene ? destOf(s.dest) : null;
    hudEl.hidden = !d;
    if (!d) return;
    const p = G.player, dist = Math.hypot(d.x - p.pos.x, d.z - p.pos.z), ang = Math.atan2(-(d.x - p.pos.x), -(d.z - p.pos.z)) - p.yaw;
    hudEl.querySelector("i").style.transform = `rotate(${-ang}rad)`;
    hudEl.querySelector("i").style.background = TYPES[d.kind].color;
    hudEl.querySelector("b").textContent = d.title + (d.kind === "excavation" ? " (entrance)" : "");
    hudEl.querySelector("em").textContent = dist < 8 ? "You're here!" : `${fmt(dist)} blocks ${compass8(d.x - p.pos.x, d.z - p.pos.z)}` + (d.kind === "excavation" ? " · underground" : "");
  }

  // ---------- the map screen ----------
  const view = { cx: 0, cz: 0, follow: true };
  S.mapHTML = () => {
    const s = data();
    if (!s || !s.house) return `<div class="inv-card"><h3>Explorer's Map</h3><p class="help">This world has no Starter Home or map data yet.</p></div>`;
    const legend = ORDER.map(k => `<span><canvas class="xm-ico" data-ico="${k}" width="22" height="22"></canvas>${TYPES[k].label}</span>`).join("") +
      `<span><canvas class="xm-ico" data-ico="you" width="22" height="22"></canvas>You (arrow = facing)</span><span><canvas class="xm-ico" data-ico="shore" width="22" height="22"></canvas>Boat launch (shore)</span><span><i class="xm-dash"></i>Direction only, not a path</span>` +
      `<span><i class="xm-sw" style="background:#7cbd56"></i>Grass</span><span><i class="xm-sw" style="background:#3f8a2c"></i>Forest</span><span><i class="xm-sw" style="background:#e2d39b"></i>Sand</span><span><i class="xm-sw" style="background:#2f62b8"></i>Water</span><span><i class="xm-sw" style="background:#96988c"></i>Mountain</span><span><i class="xm-sw" style="background:#f2f2f2"></i>Snow</span>`;
    return `<div class="inv-card xmap"><h3>Explorer's Map <span class="note" style="color:#444">M or Esc to close</span></h3>
      <div class="xm-body">
        <div class="xm-left"><div class="xm-wrap"><canvas id="xmCanvas" width="480" height="480"></canvas>
          <div class="xm-zoom"><button class="btn small" data-xz="-1" title="Zoom in">+</button><button class="btn small" data-xz="1" title="Zoom out">−</button><button class="btn small" data-xz="0" title="Center on you">◎</button></div></div>
          <div class="xm-legend">${legend}</div></div>
        <div class="xm-right"><div class="xm-list" id="xmList"></div><div class="xm-info" id="xmInfo"></div>
          <button class="btn small" id="xmWay"></button></div>
      </div></div>`;
  };
  let mapEl = null, tickT = null;
  S.mountMap = root => {
    mapEl = root; const s = data(); if (!s || !s.house) return;
    if (view.follow) { view.cx = G.player.pos.x; view.cz = G.player.pos.z; }
    if (G.dim !== "overworld") { const h = S.house(); view.cx = h.x; view.cz = h.z; view.follow = false; }
    root.querySelectorAll("[data-ico]").forEach(c => drawIcon(c.getContext("2d"), c.dataset.ico, 11, 11, 9, false));
    root.querySelectorAll("[data-xz]").forEach(b => b.onclick = () => {
      Sound.click(); const k = +b.dataset.xz;
      if (k) s.zoom = Math.max(0, Math.min(ZOOMS.length - 1, (s.zoom ?? 2) + k));
      else if (G.dim === "overworld") { view.follow = true; view.cx = G.player.pos.x; view.cz = G.player.pos.z; }
      draw();
    });
    root.querySelector("#xmWay").onclick = () => { Sound.click(); S.toggleWaypoint(); renderSide(); };
    const cv = root.querySelector("#xmCanvas");
    cv.addEventListener("wheel", e => { e.preventDefault(); s.zoom = Math.max(0, Math.min(ZOOMS.length - 1, (s.zoom ?? 2) + (e.deltaY > 0 ? 1 : -1))); draw(); }, { passive: false });
    // drag to look around; a click without dragging picks the landmark under the pointer
    let drag = null;
    cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, cx: view.cx, cz: view.cz, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => {
      if (!drag) return;
      const k = ZOOMS[s.zoom ?? 2] * cv.width / cv.clientWidth, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved) { view.follow = false; view.cx = drag.cx - dx * k; view.cz = drag.cz - dy * k; draw(); }
    });
    cv.addEventListener("pointerup", e => {
      if (drag && !drag.moved) {
        const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * cv.width / r.width, py = (e.clientY - r.top) * cv.height / r.height;
        let best = null;
        for (const d of destinations()) { const q = toPx(d.x, d.z); const dd = Math.hypot(q.x - px, q.y - py); if (dd < 18 && (!best || dd < best.dd)) best = { dd, d }; }
        if (best) pick(best.d.kind);
      }
      drag = null;
    });
    draw(); renderSide();
    clearInterval(tickT);
    tickT = setInterval(() => { if (G.panelKind !== "xmap" || !document.body.contains(cv)) { clearInterval(tickT); return; } if (view.follow && G.dim === "overworld") { view.cx = G.player.pos.x; view.cz = G.player.pos.z; } draw(true); }, 400);
  };
  function pick(kind) {
    const s = data(); s.dest = kind; Sound.click();
    if (!s.waypoint) s.waypoint = true;
    UI.toast(`Destination: ${destOf(kind).title}`, "good");
    draw(); renderSide();
  }
  S.pick = pick;
  function renderSide() {
    if (!mapEl) return;
    const s = data(), list = mapEl.querySelector("#xmList"), info = mapEl.querySelector("#xmInfo"), way = mapEl.querySelector("#xmWay");
    if (!list) return;
    const p = G.player.pos, here = G.dim === "overworld";
    const all = destinations();
    const missing = all.some(d => d.kind !== "home") ? "" : `<p class="help">The landmarks couldn't be loaded right now (they need the Keepers' map files). Check your connection and reopen the world.</p>`;
    list.innerHTML = missing + all.map(d => {
      const dist = here ? fmt(Math.hypot(d.x - p.x, d.z - p.z)) + " blocks" : "on the Surface";
      const badge = d.relic ? " ✔ done" : d.visited ? " ✔ visited" : "";
      return `<button class="xm-dest${d.kind === s.dest ? " on" : ""}" data-dest="${d.kind}"><canvas width="22" height="22" data-ico="${d.kind}"></canvas><span><b>${d.title}</b><small>${d.name}${badge}</small></span><em>${dist}</em></button>`;
    }).join("");
    list.querySelectorAll("canvas[data-ico]").forEach(c => drawIcon(c.getContext("2d"), c.dataset.ico, 11, 11, 9, false));
    list.querySelectorAll("[data-dest]").forEach(b => b.onclick = () => pick(b.dataset.dest));
    const d = destOf(s.dest);
    if (d) {
      const notes = here ? travelNotes(d) : [`You're ${G.dim === "nether" ? "in the Ember Depths" : "away from the Surface"}. The map works again when you return.`];
      info.innerHTML = `<h4>${d.title}: ${d.name}</h4><p class="xm-coords">${pos(d)} · ${TYPES[d.kind].where}</p>${notes.map(n => `<p>${n}</p>`).join("")}<p class="xm-guide"></p>`;
      info.querySelector(".xm-guide").textContent = guide(d);
    } else info.innerHTML = "";
    way.textContent = s.waypoint ? "On-screen waypoint: ON (N)" : "On-screen waypoint: OFF (N)";
  }
  // ----- drawing -----
  const colCache = new Map();
  function columnAt(x, z) {
    const k = x + "," + z; let c = colCache.get(k);
    if (!c) { const q = surf().column(x, z); c = { h: q.h, b: q.biome }; if (colCache.size > 60000) colCache.clear(); colCache.set(k, c); }
    return c;
  }
  let toPx = () => ({ x: 0, y: 0 });
  let lastTerrain = null;
  function draw(markersOnly) {
    const cv = mapEl && mapEl.querySelector("#xmCanvas"); if (!cv) return;
    const s = data(), ctx = cv.getContext("2d"), W = cv.width, bpp = ZOOMS[s.zoom ?? 2];
    const ox = view.cx - W / 2 * bpp, oz = view.cz - W / 2 * bpp;
    toPx = (x, z) => ({ x: (x - ox) / bpp, y: (z - oz) / bpp });
    const terrainKey = [Math.round(ox), Math.round(oz), bpp, G.dim].join(",");
    if (!markersOnly || !lastTerrain || lastTerrain.key !== terrainKey) {
      // the land: one sample per 4 map pixels, shaded by height, with the carved bays drawn as water
      const off = document.createElement("canvas"); off.width = off.height = W; const octx = off.getContext("2d");
      const cell = 4, step = cell * bpp, lakes = destinations().filter(q => q.lake);
      {
        const gen = G.dim === "overworld";
        for (let py = 0; py < W; py += cell) for (let px = 0; px < W; px += cell) {
          const wx = Math.floor((ox + px * bpp) / step) * step, wz = Math.floor((oz + py * bpp) / step) * step;
          const col = columnAt(wx, wz), west = columnAt(wx - step, wz);
          const inLake = lakes.find(q => Math.hypot(wx - q.center.x, wz - q.center.z) < q.lake.r0 + (q.lake.r1 - q.lake.r0) * 0.5);
          octx.fillStyle = inLake ? "#2f62b8" : terrainColor(col, col.h - west.h);
          octx.fillRect(px, py, cell, cell);
        }
        if (!gen) { octx.fillStyle = "rgba(20,20,30,.55)"; octx.fillRect(0, 0, W, W); }
      }
      lastTerrain = { key: terrainKey, img: off };
    }
    ctx.clearRect(0, 0, W, W);
    ctx.drawImage(lastTerrain.img, 0, 0);
    // grid every 100 blocks (in a light ink)
    ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1;
    const gs = bpp >= 4 ? 500 : 100;
    for (let gx = Math.ceil(ox / gs) * gs; gx < ox + W * bpp; gx += gs) { const x = (gx - ox) / bpp; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, W); ctx.stroke(); }
    for (let gz = Math.ceil(oz / gs) * gs; gz < oz + W * bpp; gz += gs) { const y = (gz - oz) / bpp; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const here = G.dim === "overworld", p = G.player, sel = destOf(s.dest), inside = q => q.x >= 0 && q.y >= 0 && q.x <= W && q.y <= W;
    // the bearing toward the destination: dashed, because it's a direction, not a checked route
    if (here && sel) {
      const a = toPx(p.pos.x, p.pos.z), b = toPx(sel.x, sel.z);
      ctx.save(); ctx.setLineDash([8, 6]); ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(0,0,0,.85)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.strokeStyle = "#fff36a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
    }
    // the sea temple's boat launch, with a dotted line out to the lighthouse
    for (const d of destinations()) if (d.shore) {
      const a = toPx(d.shore.x, d.shore.z), b = toPx(d.x, d.z);
      ctx.save(); ctx.setLineDash([2, 4]); ctx.strokeStyle = "#cfe8ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
      if (inside(a)) { drawIcon(ctx, "shore", a.x, a.y, 7, false); if (bpp <= 1 || d.kind === s.dest) label(ctx, "Boat launch", a.x, a.y + 18, "#cfe8ff"); }
    }
    // landmarks and home (the selected one gets a bright ring and a bold label)
    for (const d of destinations()) {
      const q = toPx(d.x, d.z), on = d.kind === s.dest;
      if (!inside(q)) continue;
      if (on) { ctx.beginPath(); ctx.arc(q.x, q.y, 16 + Math.sin(performance.now() / 300) * 2, 0, Math.PI * 2); ctx.strokeStyle = "#fff36a"; ctx.lineWidth = 3; ctx.stroke(); }
      drawIcon(ctx, d.kind, q.x, q.y, on ? 11 : 9, on);
      label(ctx, d.title + (d.kind === "excavation" ? " (entrance; city is underground)" : ""), q.x, q.y - (on ? 20 : 17), on ? "#fff36a" : "#fff", on);
    }
    // the selected destination is off this view: an arrow on the edge pointing at it
    if (here && sel) {
      const q = toPx(sel.x, sel.z);
      if (!inside(q)) {
        const c = W / 2, dx = q.x - c, dy = q.y - c, k = (c - 26) / Math.max(Math.abs(dx), Math.abs(dy)), ex = c + dx * k, ey = c + dy * k, a = Math.atan2(dy, dx);
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = TYPES[sel.kind].color; ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -10); ctx.lineTo(-3, 0); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        const tx = Math.max(110, Math.min(W - 160, ex - Math.cos(a) * 28)), ty = Math.max(30, Math.min(W - 40, ey - Math.sin(a) * 30));
        label(ctx, `${sel.title}: ${fmt(Math.hypot(sel.x - p.pos.x, sel.z - p.pos.z))} blocks (off map)`, tx, ty, "#fff36a", true);
      }
    }
    // you: an arrow showing which way you face
    if (here) {
      const q = toPx(p.pos.x, p.pos.z);
      if (inside(q)) {
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(-p.yaw); ctx.fillStyle = "#fff"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    } else label(ctx, "You're not on the Surface right now", W / 2, W / 2, "#fff", true);
    // compass letters and a scale bar
    ctx.font = "bold 15px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000"; ctx.lineWidth = 3;
    for (const [t, x, y] of [["N", W / 2, 16], ["S", W / 2, W - 6], ["W", 10, W / 2 + 5], ["E", W - 10, W / 2 + 5]]) { ctx.strokeText(t, x, y); ctx.fillText(t, x, y); }
    const bar = bpp >= 4 ? 500 : 100;
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(10, W - 30, bar / bpp + 12, 22);
    ctx.fillStyle = "#fff"; ctx.fillRect(16, W - 16, bar / bpp, 3); ctx.font = "bold 11px system-ui, sans-serif"; ctx.textAlign = "left"; ctx.fillText(`${bar} blocks`, 16, W - 20);
  }
  function terrainColor(c, slope) {
    let base;
    if (c.h < SEA) { const d = Math.min(1, (SEA - c.h) / 12); return `rgb(${Math.round(60 - d * 30)},${Math.round(120 - d * 50)},${Math.round(220 - d * 50)})`; }
    if (c.b === "peak") base = [242, 242, 242];          // snow caps, as in the game
    else if (c.b === "mountain") base = [150, 152, 140];   // bare rock and patchy grass
    else if (c.b === "sandy" || c.h <= SEA + 1) base = [226, 211, 155];
    else if (c.b === "forest") base = [63, 138, 44];
    else if (c.b === "birch") base = [106, 168, 74];
    else base = [124, 189, 86];
    const k = Math.max(0.72, Math.min(1.12, 1 + Math.max(-0.2, Math.min(0.2, slope * 0.06)) - (c.h - SEA - 8) * 0.004));   // higher ground a little darker, slopes shaded
    return `rgb(${base.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`;
  }
  function label(ctx, text, x, y, color, bold) {
    ctx.font = `${bold ? "bold " : ""}12px system-ui, sans-serif`; ctx.textAlign = "center";
    const w = ctx.measureText(text).width + 10;
    const lx = Math.max(w / 2 + 2, Math.min(ctx.canvas.width - w / 2 - 2, x));
    ctx.fillStyle = "rgba(10,12,14,.78)"; ctx.fillRect(lx - w / 2, y - 12, w, 17);
    ctx.fillStyle = color; ctx.fillText(text, lx, y + 1);
  }
  // Each landmark type has its own symbol so it reads at a glance (and matches the legend)
  function drawIcon(ctx, kind, x, y, r, big) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = big ? 2.5 : 2; ctx.strokeStyle = "#111";
    const T = TYPES[kind];
    if (kind === "excavation") {   // a dark diamond with a downward arrow: the way in goes down
      ctx.fillStyle = T.color; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#082a2a"; ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 0.2); ctx.lineTo(r * 0.45, -r * 0.2); ctx.lineTo(0, r * 0.55); ctx.closePath(); ctx.fill();
    } else if (kind === "sea") {   // a lighthouse on blue
      ctx.fillStyle = T.color; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillRect(-r * 0.25, -r * 0.6, r * 0.5, r * 1.1); ctx.fillStyle = "#ffe066"; ctx.fillRect(-r * 0.35, -r * 0.8, r * 0.7, r * 0.3);
    } else if (kind === "jungle") {   // a stepped green temple
      ctx.fillStyle = T.color; ctx.beginPath(); ctx.moveTo(-r, r * 0.8); ctx.lineTo(-r, r * 0.3); ctx.lineTo(-r * 0.6, r * 0.3); ctx.lineTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.25, -r * 0.2); ctx.lineTo(-r * 0.25, -r * 0.8); ctx.lineTo(r * 0.25, -r * 0.8); ctx.lineTo(r * 0.25, -r * 0.2); ctx.lineTo(r * 0.6, -r * 0.2); ctx.lineTo(r * 0.6, r * 0.3); ctx.lineTo(r, r * 0.3); ctx.lineTo(r, r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === "desert") {   // a gold pyramid
      ctx.fillStyle = T.color; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, r * 0.8); ctx.lineTo(-r, r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.2, r * 0.8); ctx.stroke();
    } else if (kind === "home") {   // a little house with a red roof
      ctx.fillStyle = "#f4ead8"; ctx.fillRect(-r * 0.7, -r * 0.1, r * 1.4, r * 0.95); ctx.strokeRect(-r * 0.7, -r * 0.1, r * 1.4, r * 0.95);
      ctx.fillStyle = T.color; ctx.beginPath(); ctx.moveTo(-r, -r * 0.05); ctx.lineTo(0, -r); ctx.lineTo(r, -r * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#6a4825"; ctx.fillRect(-r * 0.18, r * 0.3, r * 0.36, r * 0.55);
    } else if (kind === "shore") {   // a boat
      ctx.fillStyle = "#a8743a"; ctx.beginPath(); ctx.moveTo(-r, -r * 0.1); ctx.lineTo(r, -r * 0.1); ctx.lineTo(r * 0.6, r * 0.6); ctx.lineTo(-r * 0.6, r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.5, -r * 0.2); ctx.lineTo(0, -r * 0.2); ctx.closePath(); ctx.fill();
    } else if (kind === "you") {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.65, r * 0.75); ctx.lineTo(0, r * 0.35); ctx.lineTo(-r * 0.65, r * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- test helpers (automated checks only) ----------
  S._t = { findSite, buildHouse, grant, houseStamp, world, shorePoint, travelNotes, destinations };
  void closePanel; void OPEN; void idOf; void OFF;
  return S;
}
