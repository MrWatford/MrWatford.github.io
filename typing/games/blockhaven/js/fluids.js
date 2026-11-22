// Milestone 18, Part A: flowing water and lava.
// A water or lava block keeps its flow in its meta: 0 = a full ("source") block, 1-7 = how far it has flowed (shallower
// as the number grows), FALLING = pouring straight down. Every block made before this update is a full block, so old
// worlds don't change until something wakes them: a player breaking or placing a block, a bucket, or an explosion.
import { B, BLOCKS, SOLID, WATERY, idOf, metaOf, make, isWet } from "./blocks.js";

export const FALLING = 8;
export const levelOf = v => metaOf(v) & 7;
export const isSource = v => (metaOf(v) & 15) === 0;
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
const AROUND = [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const WASH_SHAPES = new Set(["cross", "torch", "crop"]);

// What kind of fluid a block is: water (water plants count as water), lava, or 0
export const fluidOf = v => { const id = idOf(v); return id === B.LAVA ? B.LAVA : isWet(v) ? B.WATER : 0; };   // (a waterlogged fence counts as a full block of water)
// How tall the fluid surface in a block is (0-1), for drawing. Water with more water above is full height.
export function fluidHeight(v, above) {
  if (fluidOf(above) && fluidOf(above) === fluidOf(v)) return 1;
  const id = idOf(v);
  if (id !== B.WATER && id !== B.LAVA) return 0.88;   // a water plant's water is always full
  const m = metaOf(v);
  if (m & FALLING || !(m & 7)) return 0.88;
  return Math.max(0.12, (8 - (m & 7)) / 9 * 0.92);
}
// Which way flowing water pushes things in a block ([dx, dz], or null): toward its shallower neighbors
export function flowPush(w, x, y, z) {
  const v = w.get(x, y, z), k = fluidOf(v);
  if (k !== B.WATER || idOf(v) !== B.WATER || isSource(v) || metaOf(v) & FALLING) return null;
  const lv = levelOf(v);
  let px = 0, pz = 0;
  for (const [dx, , dz] of SIDES) {
    const n = w.get(x + dx, y, z + dz), nk = fluidOf(n);
    if (nk === B.WATER && idOf(n) === B.WATER) { const nl = metaOf(n) & FALLING ? 8 : levelOf(n); if (nl > lv) { px += dx; pz += dz; } else if (nl < lv) { px -= dx; pz -= dz; } }
    else if (!SOLID[idOf(n)] && !nk) { px += dx * 2; pz += dz * 2; }   // it pours out into the open
  }
  const l = Math.hypot(px, pz);
  return l ? [px / l, pz / l] : null;
}

// api: { G, washAway(x, y, z), mixed(x, y, z, made), off(), fall(x, y, z, v), lavaHeat(x, y, z) }
// Milestone 18, Part B: the same wake-ups also make sand and gravel fall (blocks with `falls`).
export function initFluids(api) {
  const G = api.G, queue = new Map();
  let clock = 0, world = null, hissT = 0;
  const key = (x, y, z) => x + "," + y + "," + z;
  const nether = () => !!G.world?.gen?.isNether?.();
  const delay = k => k === B.LAVA ? (nether() ? 0.5 : 1.5) : 0.25;
  const reach = k => k === B.LAVA ? (nether() ? 7 : 3) : 7;
  const here = () => !!G.world && !G.guest && ["overworld", "nether", "end"].includes(G.dim);
  const active = () => here() && !api.off();   // water and lava flowing (falling blocks don't need this)
  function schedule(x, y, z, d) { const k = key(x, y, z), due = clock + d, old = queue.get(k); if (old === undefined || due < old) queue.set(k, due); }
  // something changed at (x, y, z): any water or lava there or right beside it takes a look around soon
  function wake(x, y, z) {
    if (!here()) return;
    const w = G.world, flow = !api.off();
    if (w.id(x, y + 1, z) === B.LILY_PAD && !fluidOf(w.get(x, y, z))) api.washAway(x, y + 1, z);   // Part C: no water, no lily pad
    for (const [dx, dy, dz] of AROUND) {
      const v = w.get(x + dx, y + dy, z + dz), k = fluidOf(v);
      if (k) { if (flow) schedule(x + dx, y + dy, z + dz, delay(k)); }
      else if (BLOCKS[idOf(v)]?.falls) schedule(x + dx, y + dy, z + dz, 0.05);
    }
  }
  // sand or gravel with nothing under it starts to fall (main.js animates it and sets it down where it lands)
  function fallStep(w, x, y, z, v) {
    if (y <= 1) return;
    const b = w.get(x, y - 1, z), id = idOf(b), d = BLOCKS[id];
    if (id === B.AIR || fluidOf(b) || (d && !d.solid && (d.replaceable || WASH_SHAPES.has(d.shape)))) { w.set(x, y, z, B.AIR); wake(x, y, z); api.fall(x, y, z, v); }
  }
  // can fluid move into this block? 1 = empty, 2 = a small plant or torch it washes away, 0 = no
  function room(w, x, y, z) {
    if (y <= 0 || !w.isLoaded(x, z)) return 0;
    const id = w.id(x, y, z);
    if (id === B.AIR) return 1;
    if (fluidOf(make(id))) return 0;
    const d = BLOCKS[id];
    if (!d || d.solid) return 0;
    return d.replaceable || WASH_SHAPES.has(d.shape) ? 2 : 0;
  }
  function put(w, x, y, z, v, how) { if (how === 2) api.washAway(x, y, z); w.set(x, y, z, v); wake(x, y, z); }
  function mix(w, x, y, z, made) {
    w.set(x, y, z, made); wake(x, y, z);
    if (clock - hissT > 0.4) { hissT = clock; api.mixed(x, y, z, made); }
  }
  // one block of water or lava settles itself, then spreads
  function step(x, y, z) {
    const w = G.world;
    if (!w.isLoaded(x, z)) return;
    let v = w.get(x, y, z);
    const fd = BLOCKS[idOf(v)];
    if (fd?.falls) {   // Milestone 21: concrete powder touching water hardens into concrete
      if (fd.hardens && AROUND.some(([a, b, c]) => (a || b || c) && fluidOf(w.get(x + a, y + b, z + c)) === B.WATER)) { w.set(x, y, z, fd.hardens); api.hardened?.(x, y, z); return; }
      fallStep(w, x, y, z, v); return;
    }
    const K = fluidOf(v);
    if (!K || api.off()) return;
    const plant = idOf(v) !== K;   // water with a plant in it acts like a full block of water and never changes
    // lava that touches water hardens: a full block into obsidian, flowing lava into cobblestone
    if (K === B.LAVA) for (const [dx, dy, dz] of [...SIDES, [0, 1, 0]]) if (fluidOf(w.get(x + dx, y + dy, z + dz)) === B.WATER) { mix(w, x, y, z, isSource(v) ? B.OBSIDIAN : B.COBBLE); return; }
    if (K === B.LAVA) api.lavaHeat?.(x, y, z);   // Part B: lava can set things beside it on fire
    if (!plant && !isSource(v)) {   // is this flowing block still being fed?
      let want;
      if (fluidOf(w.get(x, y + 1, z)) === K) want = make(K, FALLING);
      else {
        let best = 99, sources = 0;
        for (const [dx, , dz] of SIDES) {
          const n = w.get(x + dx, y, z + dz);
          if (fluidOf(n) !== K) continue;
          const full = idOf(n) !== K || isSource(n);
          if (full) sources++;
          best = Math.min(best, full || metaOf(n) & FALLING ? 0 : levelOf(n));
        }
        const below = w.get(x, y - 1, z);
        if (K === B.WATER && sources >= 2 && (SOLID[idOf(below)] || (fluidOf(below) === B.WATER && (idOf(below) !== B.WATER || isSource(below))))) { want = make(K, 0); api.newSource?.(x, y, z); }   // two full water blocks beside it make a new one
        else want = best + 1 <= reach(K) ? make(K, best + 1) : B.AIR;
      }
      if (want !== v) { w.set(x, y, z, want); wake(x, y, z); if (want === B.AIR) return; v = want; }
    }
    // pour straight down if it can (into lava below, flowing water turns it to stone)
    if (y > 1) {
      const bv = w.get(x, y - 1, z);
      if (K === B.WATER && fluidOf(bv) === B.LAVA) { mix(w, x, y - 1, z, isSource(bv) ? B.OBSIDIAN : B.COBBLE); return; }
      if (K === B.LAVA && fluidOf(bv) === B.WATER) { mix(w, x, y - 1, z, B.STONE); return; }
      const r = room(w, x, y - 1, z);
      if (r) { put(w, x, y - 1, z, make(K, FALLING), r); return; }
      if (fluidOf(bv) === K && (idOf(bv) !== K || isSource(bv) || metaOf(bv) & FALLING)) { if (!plant && !isSource(v)) return; }   // resting on more of itself
    }
    // then spread out sideways, one step shallower
    const next = (plant || isSource(v) || metaOf(v) & FALLING ? 0 : levelOf(v)) + 1;
    if (next > reach(K)) return;
    for (const [dx, , dz] of SIDES) {
      const nx = x + dx, nz = z + dz, n = w.get(nx, y, nz), nk = fluidOf(n);
      if (nk && nk !== K) { if (K === B.WATER) mix(w, nx, y, nz, isSource(n) ? B.OBSIDIAN : B.COBBLE); continue; }
      if (nk === K) { if (idOf(n) === K && !isSource(n) && !(metaOf(n) & FALLING) && levelOf(n) > next) put(w, nx, y, nz, make(K, next), 1); continue; }
      const r = room(w, nx, y, nz);
      if (r) put(w, nx, y, nz, make(K, next), r);
    }
  }
  function tick(dt) {
    if (G.world !== world) { world = G.world; queue.clear(); }
    if (!queue.size || !here()) return;
    clock += dt;
    let budget = 400;
    const due = [];
    for (const [k, t] of queue) { if (t <= clock) { due.push(k); if (due.length >= budget) break; } }
    for (const k of due) { queue.delete(k); const [x, y, z] = k.split(",").map(Number); step(x, y, z); }
  }
  return { wake, tick, pending: () => queue.size, active, here };
}
