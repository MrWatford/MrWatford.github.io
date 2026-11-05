// The Sparkworks signal engine (Blockhaven's redstone). Rules follow Minecraft Java Edition 1.20.1:
// signal strength 0-15 that drops 1 per wire block, strong and weak power through solid blocks, 1 redstone tick = 2 game ticks = 0.1 s.
// Every change is handled from a queue with a hard budget per game tick, so clocks and feedback loops can never freeze the game.
import { B, I, BLOCKS, OPAQUE, idOf, metaOf, make, isDoor, isTrapdoor, isGate, isButton, isPlate, isFence,
  DOT, UNLIT, AXIS_X, ON, LOCKED, SUBTRACT, CMP_ON, INVERT, POWERED, NOTE_ON, OPEN, TOP, EYE_IN, honeyOf, itemDef, ANCHOR_MAX } from "./blocks.js";
import { DIR, conductor, dustConn, dustPoints, supportOf } from "./shapes.js";
import { CHUNK } from "./blocks.js";

const D6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const TICK = 0.05;          // one game tick (20 per second)
export const BUDGET = 6000; // real block updates (parts that react) allowed per game tick
const LOOKS = 120000;        // quick "is anything here?" checks allowed per game tick
const MAX_NET = 4096;       // biggest wire network worked out at once
const MAX_SCHED = 20000;
const POLLED = id => id === B.COMPARATOR || id === B.DAYLIGHT || isPlate(id);
const key = (x, y, z) => x + "," + y + "," + z;
// blocks that do something when their neighbors change (everything else is skipped quickly)
const REACTS = id => id === B.SPARK_DUST || id === B.SPARK_TORCH || id === B.REPEATER || id === B.COMPARATOR || id === B.SPARK_LAMP || id === B.TNT || id === B.NOTE_BLOCK ||
  id === B.LEVER || isButton(id) || isPlate(id) || isDoor(id) || isTrapdoor(id) || isGate(id);
// Note block instruments (Java 1.20.1) and their octave shift from the harp
const INSTRUMENT = id => {
  if ([B.SAND, B.GRAVEL].includes(id)) return "snare";
  if ([B.GLASS, B.RESONANT_GLASS, B.BEACON].includes(id)) return "hat";
  if (id === B.GOLD_BLOCK) return "bell";
  if (id === B.CLAY) return "flute";
  if (id === B.SNOW) return "chime";            // Blockhaven has no packed ice; snow stands in
  if (id === B.WOOL || id === B.BLACK_WOOL) return "guitar";
  if (id === B.QUARTZ_BLOCK) return "xylophone"; // stands in for bone blocks
  if (id === B.IRON_BLOCK) return "iron_xylophone";
  if (id === B.SOUL_SAND) return "cow_bell";
  if (id === B.CRIMSON_WART || id === B.WARPED_WART) return "didgeridoo";   // stands in for pumpkins
  if (id === B.JADE_BLOCK) return "bit";
  if (id === B.HAY) return "banjo";
  if (id === B.SHINESTONE) return "pling";
  const d = BLOCKS[id];
  if (d && d.tool === "axe") return "bass";
  if (d && OPAQUE[id] && d.tool === "pick") return "basedrum";
  return "harp";
};
export const INSTRUMENTS = ["harp", "bass", "snare", "hat", "basedrum", "bell", "flute", "chime", "guitar", "xylophone", "iron_xylophone", "cow_bell", "didgeridoo", "bit", "banjo", "pling"];

export function initRedstone(ctx) {
  const { G } = ctx;
  const W = () => G.world;
  const S = () => G.world && G.world.rs;
  let mute = false, warnT = -999;

  // ---------- per-world state ----------
  function attach(w, data) {
    data = data || {};
    const st = w.rs = { tick: data.tick || 0, acc: 0, seq: 0, sched: new Map(), queue: [], head: 0, queued: new Set(), cmp: new Map(data.cmp || []), seen: new Map(), poll: new Set(), hist: new Map(), burnt: new Map(), used: 0, looks: 0, overload: false, ver: 0, netVer: new Map() };
    for (const [x, y, z, kind, dt] of data.sched || []) schedule(st, x, y, z, Math.max(1, dt), kind);
    // find comparators, sensors, and plates the player has placed (they're all in the change list)
    for (const [ck, m] of w.mods) {
      const [cx, cz] = ck.split(",").map(Number);
      for (const [i, v] of m) if (POLLED(idOf(v))) st.poll.add(key(cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + Math.floor(i / CHUNK) % CHUNK));
    }
    w.onSet = (x, y, z, v, old) => {
      st.ver++;
      if (POLLED(idOf(old)) && idOf(old) !== idOf(v)) { st.poll.delete(key(x, y, z)); st.cmp.delete(key(x, y, z)); }
      if (POLLED(idOf(v))) st.poll.add(key(x, y, z));
      if (!mute) changed(x, y, z);
    };
  }
  function toJSON(w) {
    const st = w.rs;
    if (!st) return undefined;
    return { tick: st.tick, cmp: [...st.cmp].filter(([, o]) => o > 0), sched: [...st.sched.values()].map(e => [e.x, e.y, e.z, e.kind, e.t - st.tick]) };
  }
  function schedule(st, x, y, z, delay, kind) {
    const k = key(x, y, z) + ":" + kind;
    if (st.sched.has(k)) return false;
    if (st.sched.size >= MAX_SCHED) { warn(); return false; }
    st.sched.set(k, { x, y, z, kind, t: st.tick + delay, seq: st.seq++ });
    return true;
  }
  const scheduled = (x, y, z, kind) => S().sched.has(key(x, y, z) + ":" + kind);
  function enqueue(x, y, z) {
    const st = S(), k = key(x, y, z);
    if (st.queued.has(k)) return;
    st.queued.add(k); st.queue.push([x, y, z]);
  }
  // Something changed at (x, y, z): everything that might read it needs a look
  function changed(x, y, z, skip) {
    const w = W();
    enqueue(x, y, z);
    for (const [dx, dy, dz] of D6) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (!skip || !skip.has(key(nx, ny, nz))) enqueue(nx, ny, nz);
      if (conductor(w.id(nx, ny, nz))) for (const [ex, ey, ez] of D6) if (!skip || !skip.has(key(nx + ex, ny + ey, nz + ez))) enqueue(nx + ex, ny + ey, nz + ez);
    }
    // wire that steps up or down a block connects diagonally
    for (const [dx, dz] of DIR) for (const dy of [-1, 1]) if (!skip || !skip.has(key(x + dx, y + dy, z + dz))) enqueue(x + dx, y + dy, z + dz);
  }
  function setState(x, y, z, v, hard) { W().set(x, y, z, v, !hard); }
  function warn() {
    S().overload = true;
    if (G.clock - warnT > 12) { warnT = G.clock; ctx.UI.toast("A machine is running too fast, so it's paused for a moment. Slow its clock down.", "bad"); }
  }

  // ---------- how much power reaches where ----------
  const get = (x, y, z) => W().get(x, y, z);
  const getter = (x, y, z) => (dx, dy, dz) => W().get(x + dx, y + dy, z + dz);
  const facingVec = f => [DIR[f][0], 0, DIR[f][1]];
  function dustLevelToward(x, y, z, v, dx, dy, dz) {   // a wire at (x,y,z) powering the spot (x+dx, y+dy, z+dz)
    if (dy === -1) return metaOf(v) & 15;
    if (dy === 1) return 0;
    const pts = dustPoints(v, dustConn(getter(x, y, z))), d = DIR.findIndex(q => q[0] === dx && q[1] === dz);
    return pts[d] ? metaOf(v) & 15 : 0;
  }
  // Power a non-solid part at (x,y,z) sends straight into its neighbor in direction (dx,dy,dz)
  function emitDirect(x, y, z, v, dx, dy, dz, forDust) {
    const id = idOf(v), m = metaOf(v);
    switch (id) {
      case B.SPARK_BLOCK: return 15;
      case B.SPARK_TORCH: { if (m & UNLIT) return 0; const s = supportOf(v); return s[0] === dx && s[1] === dy && s[2] === dz ? 0 : 15; }
      case B.LEVER: return m & ON ? 15 : 0;
      case B.DAYLIGHT: case B.TARGET: return m & 15;
      case B.REPEATER: { if (!(m & ON)) return 0; const f = facingVec(m & 3); return f[0] === dx && dy === 0 && f[2] === dz ? 15 : 0; }
      case B.COMPARATOR: { const f = facingVec(m & 3); return f[0] === dx && dy === 0 && f[2] === dz ? (S().cmp.get(key(x, y, z)) || 0) : 0; }
      case B.SPARK_DUST: return forDust ? 0 : dustLevelToward(x, y, z, v, dx, dy, dz);
    }
    if (isButton(id)) return m & ON ? 15 : 0;
    if (isPlate(id)) return m & 15;
    return 0;
  }
  // Strong power in a solid block: from a torch under it, a switch on it, a plate on top, or a repeater/comparator facing into it
  function strongPower(x, y, z) {
    let best = 0;
    for (const [dx, dy, dz] of D6) {
      const nx = x + dx, ny = y + dy, nz = z + dz, v = get(nx, ny, nz), id = idOf(v), m = metaOf(v);
      let p = 0;
      if (id === B.SPARK_TORCH) p = !(m & UNLIT) && dy === -1 ? 15 : 0;
      else if (id === B.LEVER || isButton(id)) { const s = supportOf(v); p = m & ON && nx + s[0] === x && ny + s[1] === y && nz + s[2] === z ? 15 : 0; }
      else if (isPlate(id)) p = dy === 1 ? m & 15 : 0;
      else if (id === B.REPEATER || id === B.COMPARATOR) p = emitDirect(nx, ny, nz, v, -dx, -dy, -dz, false);
      if (p > best) { best = p; if (best >= 15) return 15; }
    }
    return best;
  }
  // Weak power in a solid block: wire on top of it or pointing into it
  function weakPower(x, y, z) {
    let best = 0;
    for (const [dx, dy, dz] of D6) {
      if (dy === -1) continue;
      const nx = x + dx, ny = y + dy, nz = z + dz, v = get(nx, ny, nz);
      if (idOf(v) !== B.SPARK_DUST || !(metaOf(v) & 15)) continue;
      const p = dustLevelToward(nx, ny, nz, v, -dx, -dy, -dz);
      if (p > best) best = p;
    }
    return best;
  }
  const blockPower = (x, y, z) => Math.max(strongPower(x, y, z), weakPower(x, y, z));
  // What the neighbor at (x+dx,...) gives the spot (x,y,z)
  function powerFrom(x, y, z, dx, dy, dz, forDust) {
    const nx = x + dx, ny = y + dy, nz = z + dz, v = get(nx, ny, nz), id = idOf(v);
    if (conductor(id)) return forDust ? strongPower(nx, ny, nz) : blockPower(nx, ny, nz);
    return emitDirect(nx, ny, nz, v, -dx, -dy, -dz, forDust);
  }
  function powerAt(x, y, z, forDust) {
    let best = 0;
    for (const [dx, dy, dz] of D6) { const p = powerFrom(x, y, z, dx, dy, dz, forDust); if (p > best) { best = p; if (best >= 15) return 15; } }
    return best;
  }
  const isPowered = (x, y, z) => powerAt(x, y, z, false) > 0;

  // ---------- what comparators read from containers and other blocks ----------
  function readable(x, y, z) {
    const w = W(), v = w.get(x, y, z), id = idOf(v), m = metaOf(v);
    if (id === B.CHEST || id === B.FURNACE || id === B.SHELL_BOX) {
      const box = w.containers.get(key(x, y, z));
      if (!box || !box.slots) return 0;
      let sum = 0, any = false;
      for (const s of box.slots) if (s) { any = true; sum += s.n / ((itemDef(s.id) || {}).stack || 64); }
      return any ? Math.floor(1 + sum / box.slots.length * 14) : 0;
    }
    if (id === B.RESPAWN_ANCHOR) return Math.floor(Math.min(ANCHOR_MAX, m & 7) / ANCHOR_MAX * 15);
    if (id === B.END_FRAME) return m & EYE_IN ? 15 : 0;
    if (id === B.BEE_NEST || id === B.BEEHIVE) return honeyOf(v);
    return -1;   // not something a comparator can read
  }

  // ---------- updating one block ----------
  function supports(v, s) {
    const id = idOf(v), sid = idOf(s);
    if (id === B.SPARK_DUST || id === B.REPEATER || id === B.COMPARATOR) return OPAQUE[sid] === 1 || sid === B.GLASS || sid === B.RESONANT_GLASS;
    if (isPlate(id)) return OPAQUE[sid] === 1 || isFence(sid) || sid === B.GLASS;
    return OPAQUE[sid] === 1;
  }
  function update(x, y, z) {
    const w = W();
    if (y < 0 || y >= 80 || !w.isLoaded(x, z)) return;
    const v = w.get(x, y, z), id = idOf(v);
    if (!id || !REACTS(id)) return;
    S().used++;
    const sup = supportOf(v);
    if (sup && !supports(v, w.get(x + sup[0], y + sup[1], z + sup[2]))) { ctx.breakBlock(x, y, z, true); return; }
    if (id === B.SPARK_DUST) return dustNetwork(x, y, z);
    if (id === B.SPARK_TORCH) return torchCheck(x, y, z, v);
    if (id === B.REPEATER) return repeaterCheck(x, y, z, v);
    if (id === B.COMPARATOR) return comparatorCheck(x, y, z, v);
    if (id === B.SPARK_LAMP) {
      const p = isPowered(x, y, z), lit = metaOf(v) & 1;
      if (p && !lit) setState(x, y, z, make(id, 1));
      else if (!p && lit) schedule(S(), x, y, z, 4, "lamp");
      return;
    }
    if (isDoor(id)) return doorCheck(x, y, z, v);
    if (isTrapdoor(id) || isGate(id)) {
      const p = isPowered(x, y, z), m = metaOf(v);
      if (p !== !!(m & POWERED)) {
        const open = p;
        setState(x, y, z, make(id, (m & ~(OPEN | POWERED)) | (open ? OPEN : 0) | (p ? POWERED : 0)), true);
        if (!!(m & OPEN) !== open) ctx.Sound.door(open);
      }
      return;
    }
    if (id === B.TNT) { if (isPowered(x, y, z)) { w.set(x, y, z, B.AIR); ctx.primeTNT(x, y, z); } return; }
    if (id === B.NOTE_BLOCK) {
      const p = isPowered(x, y, z), m = metaOf(v);
      if (p !== !!(m & NOTE_ON)) { setState(x, y, z, make(id, p ? m | NOTE_ON : m & ~NOTE_ON)); if (p) playNote(x, y, z); }
    }
  }
  function doorCheck(x, y, z, v) {
    const w = W(), by = metaOf(v) & TOP ? y - 1 : y, bv = w.get(x, by, z), id = idOf(v);
    if (!isDoor(idOf(bv))) return;
    const p = isPowered(x, by, z) || isPowered(x, by + 1, z), m = metaOf(bv);
    if (p === !!(m & POWERED)) return;
    for (const yy of [by, by + 1]) {
      const hv = w.get(x, yy, z);
      if (idOf(hv) !== id) continue;
      const hm = metaOf(hv);
      w.set(x, yy, z, make(id, (hm & ~(OPEN | POWERED)) | (p ? OPEN | POWERED : 0)));
    }
    if (!!(m & OPEN) !== p) ctx.Sound.door(p);
  }

  // ----- Sparkdust: work out a whole connected network at once -----
  function dustNetwork(sx, sy, sz) {
    const w = W(), st = S(), net = new Map(), list = [];
    if (st.netVer.get(key(sx, sy, sz)) === st.ver) return;   // already worked out, and nothing has changed since
    const add = (x, y, z) => { const k = key(x, y, z); if (net.has(k) || net.size >= MAX_NET) return; const c = { x, y, z, k, v: w.get(x, y, z), links: [] }; net.set(k, c); list.push(c); };
    add(sx, sy, sz);
    for (let i = 0; i < list.length; i++) {
      const c = list[i], conn = dustConn(getter(c.x, c.y, c.z));
      c.conn = conn;
      for (let d = 0; d < 4; d++) {
        if (!conn[d]) continue;
        const nx = c.x + DIR[d][0], nz = c.z + DIR[d][1];
        let ny = null;
        if (w.id(nx, c.y, nz) === B.SPARK_DUST) ny = c.y;
        else if (conn[d] === 2) ny = c.y + 1;
        else if (w.id(nx, c.y - 1, nz) === B.SPARK_DUST) ny = c.y - 1;
        if (ny === null || !w.isLoaded(nx, nz)) continue;
        add(nx, ny, nz); const n = net.get(key(nx, ny, nz)); if (n) c.links.push(n);
      }
    }
    st.used += list.length;
    // strength = the best of what feeds each wire directly, or a linked wire's strength minus 1
    const buckets = Array.from({ length: 16 }, () => []);
    for (const c of list) { c.level = powerAt(c.x, c.y, c.z, true); buckets[c.level].push(c); }
    for (let l = 15; l > 1; l--) for (const c of buckets[l]) {
      if (c.level !== l) continue;
      for (const n of c.links) if (n.level < l - 1) { n.level = l - 1; buckets[l - 1].push(n); }
    }
    const changedCells = [];
    mute = true;
    try {
      for (const c of list) {
        const m = metaOf(c.v);
        if ((m & 15) !== c.level) { w.set(c.x, c.y, c.z, make(B.SPARK_DUST, (m & ~15) | c.level), true); changedCells.push(c); }
      }
    } finally { mute = false; }
    for (const c of list) st.netVer.set(c.k, st.ver);
    for (const c of changedCells) changed(c.x, c.y, c.z, net);
  }

  // ----- Spark Torch: turns off when the block it hangs on is powered (1 redstone tick later) -----
  function torchCheck(x, y, z, v) {
    const st = S(), k = key(x, y, z);
    if ((st.burnt.get(k) || 0) > st.tick) return;
    const s = supportOf(v), sx = x + s[0], sy = y + s[1], sz = z + s[2];
    const want = !(conductor(W().id(sx, sy, sz)) && blockPower(sx, sy, sz) > 0), lit = !(metaOf(v) & UNLIT);
    if (want !== lit) schedule(st, x, y, z, 2, "torch");
  }
  function torchFire(x, y, z) {
    const st = S(), v = get(x, y, z), k = key(x, y, z);
    if (idOf(v) !== B.SPARK_TORCH) return;
    if ((st.burnt.get(k) || 0) > st.tick) return;
    const s = supportOf(v), sx = x + s[0], sy = y + s[1], sz = z + s[2];
    const want = !(conductor(W().id(sx, sy, sz)) && blockPower(sx, sy, sz) > 0), lit = !(metaOf(v) & UNLIT);
    if (want === lit) return;
    // a torch flipped more than 8 times in 3 seconds burns out for a while (Java's rule)
    const h = (st.hist.get(k) || []).filter(t => t > st.tick - 60);
    h.push(st.tick); st.hist.set(k, h);
    if (h.length > 8) {
      st.burnt.set(k, st.tick + 160); st.hist.delete(k);
      setState(x, y, z, make(B.SPARK_TORCH, metaOf(v) | UNLIT));
      ctx.puff(x + 0.5, y + 0.8, z + 0.5, "ash"); ctx.Sound.fizz(dist(x, y, z));
      schedule(st, x, y, z, 161, "torch");
      return;
    }
    setState(x, y, z, make(B.SPARK_TORCH, want ? metaOf(v) & ~UNLIT : metaOf(v) | UNLIT));
  }

  // ----- Repeater: one-way, refreshes to 15, delay 1-4 redstone ticks, locked by a powered repeater or comparator at its side -----
  function repeaterInput(x, y, z, f) { const b = DIR[f]; return powerFrom(x, y, z, -b[0], 0, -b[1], false); }
  function sideLock(x, y, z, f) {
    for (const sd of [(f + 1) % 4, (f + 3) % 4]) {
      const [dx, dz] = DIR[sd], v = get(x + dx, y, z + dz), id = idOf(v);
      if ((id === B.REPEATER || id === B.COMPARATOR) && emitDirect(x + dx, y, z + dz, v, -dx, 0, -dz, false) > 0) return true;
    }
    return false;
  }
  function repeaterCheck(x, y, z, v) {
    const m = metaOf(v), f = m & 3, locked = sideLock(x, y, z, f);
    if (locked !== !!(m & LOCKED)) { setState(x, y, z, make(B.REPEATER, locked ? m | LOCKED : m & ~LOCKED)); return; }
    if (locked) return;
    const want = repeaterInput(x, y, z, f) > 0;
    if (want !== !!(m & ON)) schedule(S(), x, y, z, (((m >> 2) & 3) + 1) * 2, "rep");
  }
  function repeaterFire(x, y, z) {
    const v = get(x, y, z);
    if (idOf(v) !== B.REPEATER) return;
    const m = metaOf(v), f = m & 3;
    if (m & LOCKED) return;
    const input = repeaterInput(x, y, z, f) > 0, delay = (((m >> 2) & 3) + 1) * 2;
    if (!(m & ON)) { setState(x, y, z, make(B.REPEATER, m | ON)); if (!input) schedule(S(), x, y, z, delay, "rep"); }   // short pulses get stretched to the delay
    else if (!input) setState(x, y, z, make(B.REPEATER, m & ~ON));
  }

  // ----- Comparator: compare (back ≥ side ? back : 0) or subtract (back − side); reads containers behind it -----
  function comparatorOut(x, y, z, v) {
    const m = metaOf(v), f = m & 3, [bx, bz] = DIR[f];
    let back = powerFrom(x, y, z, -bx, 0, -bz, false);
    const r1 = readable(x - bx, y, z - bz);
    if (r1 >= 0) back = Math.max(back, r1);
    else if (conductor(W().id(x - bx, y, z - bz)) && back < 15) { const r2 = readable(x - 2 * bx, y, z - 2 * bz); if (r2 >= 0) back = Math.max(back, r2); }
    let side = 0;
    for (const sd of [(f + 1) % 4, (f + 3) % 4]) {
      const [dx, dz] = DIR[sd], sv = get(x + dx, y, z + dz), sid = idOf(sv);
      if (sid === B.SPARK_DUST || sid === B.REPEATER || sid === B.COMPARATOR || sid === B.SPARK_BLOCK) side = Math.max(side, emitDirect(x + dx, y, z + dz, sv, -dx, 0, -dz, false));
    }
    return m & SUBTRACT ? Math.max(0, back - side) : back >= side ? back : 0;
  }
  function comparatorCheck(x, y, z, v) {
    const out = comparatorOut(x, y, z, v), k = key(x, y, z);
    if (out !== (S().cmp.get(k) || 0)) schedule(S(), x, y, z, 2, "cmp");
  }
  function comparatorFire(x, y, z) {
    const v = get(x, y, z), k = key(x, y, z), st = S();
    if (idOf(v) !== B.COMPARATOR) return;
    const out = comparatorOut(x, y, z, v);
    if (out === (st.cmp.get(k) || 0)) return;
    if (out) st.cmp.set(k, out); else st.cmp.delete(k);
    const m = metaOf(v), nv = make(B.COMPARATOR, out ? m | CMP_ON : m & ~CMP_ON);
    if (nv !== v) setState(x, y, z, nv); else changed(x, y, z);
  }

  // ---------- note blocks ----------
  function dist(x, y, z) { const p = G.player.pos; return Math.hypot(p.x - x - 0.5, p.y - y, p.z - z - 0.5); }
  function playNote(x, y, z) {
    const above = idOf(get(x, y + 1, z));
    if (above && above !== B.SKULL) return;   // something on top muffles it
    const pitch = metaOf(get(x, y, z)) & 31;
    if (above === B.SKULL) ctx.Sound.mob("rattle", dist(x, y, z));
    else ctx.Sound.note(INSTRUMENT(idOf(get(x, y - 1, z))), pitch, dist(x, y, z));
    ctx.noteFx(x + 0.5, y + 1.2, z + 0.5, pitch);
    if (G.adv) G.adv("note", INSTRUMENT(idOf(get(x, y - 1, z))));
  }

  // ---------- running the engine ----------
  function process() {
    const st = S();
    while (st.head < st.queue.length) {
      if (st.used >= BUDGET || st.looks >= LOOKS) { warn(); break; }
      const [x, y, z] = st.queue[st.head++];
      st.queued.delete(key(x, y, z));
      st.looks++;
      update(x, y, z);
    }
    if (st.head > 2000 && st.head > st.queue.length / 2) { st.queue.splice(0, st.head); st.head = 0; }
  }
  function fire(e) {
    const w = W();
    if (!w.isLoaded(e.x, e.z)) { schedule(S(), e.x, e.y, e.z, 20, e.kind); return; }   // wait until that land is loaded again
    const v = w.get(e.x, e.y, e.z), id = idOf(v), m = metaOf(v);
    switch (e.kind) {
      case "torch": torchFire(e.x, e.y, e.z); break;
      case "rep": repeaterFire(e.x, e.y, e.z); break;
      case "cmp": comparatorFire(e.x, e.y, e.z); break;
      case "lamp": if (id === B.SPARK_LAMP && (m & 1) && !isPowered(e.x, e.y, e.z)) setState(e.x, e.y, e.z, make(id, 0)); break;
      case "btn":
        if (!isButton(id) || !(m & ON)) break;
        if (BLOCKS[id].wood && arrowIn(e.x, e.y, e.z)) { schedule(S(), e.x, e.y, e.z, 20, "btn"); break; }
        setState(e.x, e.y, e.z, make(id, m & ~ON)); ctx.Sound.switchClick(false, dist(e.x, e.y, e.z)); break;
      case "target": if (id === B.TARGET && (m & 15)) setState(e.x, e.y, e.z, make(id, 0)); break;
      case "ore": if ((id === B.SPARK_ORE || id === B.DARK_SPARK_ORE) && (m & 1)) setState(e.x, e.y, e.z, make(id, 0)); break;
    }
  }
  function gameTick() {
    const st = S(), w = W();
    st.tick++;
    st.used = 0; st.looks = 0; st.overload = false; st.netVer.clear();
    if (st.sched.size) {
      const due = [];
      for (const [k, e] of st.sched) if (e.t <= st.tick) { due.push(e); st.sched.delete(k); }
      due.sort((a, b) => a.t - b.t || a.seq - b.seq);
      for (const e of due) { fire(e); process(); }
    }
    // things that watch the world: plates (every 2 ticks), comparators reading containers (every 2), daylight (every 20)
    if (st.tick % 2 === 0) for (const k of st.poll) {
      const [x, y, z] = k.split(",").map(Number);
      if (!w.isLoaded(x, z)) continue;
      const id = w.id(x, y, z);
      if (isPlate(id)) plateCheck(x, y, z);
      else if (id === B.COMPARATOR) enqueue(x, y, z);
      else if (id === B.DAYLIGHT && st.tick % 20 === 0) daylightCheck(x, y, z);
    }
    // stepping on Spark Ore makes it glow
    const p = G.player;
    if (p && p.onGround && !G.spectator) { const fx = Math.floor(p.pos.x), fy = Math.floor(p.pos.y - 0.1), fz = Math.floor(p.pos.z); if ([B.SPARK_ORE, B.DARK_SPARK_ORE].includes(w.id(fx, fy, fz))) touchOre(fx, fy, fz); }
    process();
  }
  function tick(dt) {
    const st = S();
    if (!st) return;
    process();   // react to the player's clicks right away
    st.acc += dt;
    if (st.acc > 0.5) st.acc = 0.5;   // after a long pause, don't try to catch up all at once
    let n = 0;
    while (st.acc >= TICK && n < 4) { st.acc -= TICK; gameTick(); n++; }
  }

  // ---------- sensors ----------
  function entitiesOn(x, y, z, kinds) {   // count things standing on a plate
    const x0 = x + 1 / 16, x1 = x + 15 / 16, z0 = z + 1 / 16, z1 = z + 15 / 16, y0 = y, y1 = y + 0.3;
    const over = (a) => a[0] < x1 && a[3] > x0 && a[1] < y1 && a[4] > y0 && a[2] < z1 && a[5] > z0;
    let n = 0;
    const p = G.player;
    if (p && !G.spectator && G.state !== "dead" && over(p.aabb())) n++;
    for (const e of ctx.ents.list) if (!e.dead && !e.gone && over([e.pos.x - e.w / 2, e.pos.y, e.pos.z - e.w / 2, e.pos.x + e.w / 2, e.pos.y + e.h, e.pos.z + e.w / 2])) n++;
    if (kinds !== "mobs") {
      for (const d of G.drops) if (d.x > x0 && d.x < x1 && d.z > z0 && d.z < z1 && d.y >= y0 - 0.1 && d.y < y1) n++;
      for (const pr of ctx.ents.projectiles) if (pr.kind === "arrow" && !pr.gone && pr.x > x0 && pr.x < x1 && pr.z > z0 && pr.z < z1 && pr.y >= y0 - 0.05 && pr.y < y1) n++;
    }
    return n;
  }
  function plateCheck(x, y, z) {
    const st = S(), v = get(x, y, z), id = idOf(v), m = metaOf(v), k = key(x, y, z);
    const n = entitiesOn(x, y, z, id === B.STONE_PLATE ? "mobs" : "all");
    let level = id === B.GOLD_PLATE ? Math.min(15, n) : id === B.IRON_PLATE ? Math.min(15, Math.ceil(n / 10)) : n ? 15 : 0;
    if (n) st.seen.set(k, st.tick);
    const old = m & 15;
    if (!level && old && st.tick - (st.seen.get(k) || 0) < (id === B.GOLD_PLATE || id === B.IRON_PLATE ? 10 : 20)) return;   // plates hold on a moment after you step off
    if (level === old) return;
    setState(x, y, z, make(id, (m & ~15) | level));
    if (!old || !level) ctx.Sound.switchClick(!!level, dist(x, y, z), true);
    if (level && !old) G.adv && G.adv("plate");
  }
  function daylightCheck(x, y, z) {
    const w = W(), v = get(x, y, z), m = metaOf(v);
    let sky = 0;
    if (!w.gen.isNether() && !(w.gen.isEnd && w.gen.isEnd()) && !(w.gen.isMap && w.gen.isMap())) { const l = w.lightAt(x, y, z); sky = l ? l[0] : 0; }
    const h = Math.sin(G.time * Math.PI * 2), f = Math.min(1, Math.max(0, (h + 0.1) / 0.6));
    let p = Math.round(sky * f);
    if (m & INVERT) p = 15 - p;
    if (p !== (m & 15)) setState(x, y, z, make(B.DAYLIGHT, (m & ~15) | p));
  }
  function arrowIn(x, y, z) { return ctx.ents.projectiles.some(pr => pr.kind === "arrow" && pr.stuck && !pr.gone && Math.floor(pr.prevX ?? pr.x) === x && Math.floor(pr.prevY ?? pr.y) === y && Math.floor(pr.prevZ ?? pr.z) === z); }
  function touchOre(x, y, z) {
    const v = get(x, y, z), id = idOf(v);
    if (id !== B.SPARK_ORE && id !== B.DARK_SPARK_ORE) return;
    if (!(metaOf(v) & 1)) setState(x, y, z, make(id, 1));
    for (let i = 0; i < 3; i++) ctx.puff(x + Math.random(), y + 0.6 + Math.random() * 0.6, z + Math.random(), "spark");
    S().sched.delete(key(x, y, z) + ":ore");
    schedule(S(), x, y, z, 100 + Math.floor(Math.random() * 140), "ore");
  }
  // An arrow (or other thrown thing) hitting a block: targets light up, wooden buttons get pressed
  function projectileHit(pr, bx, by, bz, hx, hy, hz) {
    if (!S()) return;
    const w = W(), v = w.get(bx, by, bz), id = idOf(v);
    const px = Math.floor(pr.x), py = Math.floor(pr.y), pz = Math.floor(pr.z), pv = w.get(px, py, pz);
    pr.prevX = pr.x; pr.prevY = pr.y; pr.prevZ = pr.z;
    if (isButton(idOf(pv)) && BLOCKS[idOf(pv)].wood && pr.kind === "arrow") press(px, py, pz, pv);
    if (id === B.TARGET) {
      // which face was hit, and how close to its center
      const fx = hx - bx, fy = hy - by, fz = hz - bz;
      const ox = pr.x < bx || pr.x > bx + 1, oy = pr.y < by || pr.y > by + 1;
      const [u, t] = ox ? [fy, fz] : oy ? [fx, fz] : [fx, fy];
      const d = Math.hypot(u - 0.5, t - 0.5), power = Math.max(1, Math.ceil(15 * Math.min(1, Math.max(0, (0.5 - d) / 0.5))));
      setState(bx, by, bz, make(B.TARGET, power));
      S().sched.delete(key(bx, by, bz) + ":target");
      schedule(S(), bx, by, bz, pr.kind === "arrow" ? 20 : 8, "target");
      if (power === 15 && G.adv) G.adv("bullseye");
    }
  }
  function press(x, y, z, v) {
    const id = idOf(v), m = metaOf(v);
    if (m & ON) return;
    setState(x, y, z, make(id, m | ON));
    ctx.Sound.switchClick(true, dist(x, y, z));
    schedule(S(), x, y, z, BLOCKS[id].wood ? 30 : 20, "btn");
  }

  // ---------- right-clicking Sparkworks blocks. Returns true if the click was used up. ----------
  const KINDS = new Set(["sparkore", "dust", "lever", "button", "trapdoor", "irontrapdoor", "gate", "repeater", "comparator", "irondoor", "note", "daylight"]);
  function interact(hit, kind) {
    const w = W(), { x, y, z } = hit, v = w.get(x, y, z), id = idOf(v), m = metaOf(v);
    switch (kind) {
      case "sparkore": touchOre(x, y, z); return false;   // it glows, and you can still build against it
      case "dust": {
        const conn = dustConn(getter(x, y, z));
        if (conn.some(c => c)) return false;
        setState(x, y, z, make(id, m ^ DOT)); changed(x, y, z); return true;
      }
      case "lever":
        setState(x, y, z, make(id, m ^ ON)); ctx.Sound.switchClick(!(m & ON), 0);
        ctx.puff(x + 0.5, y + 0.5, z + 0.5, "spark"); G.adv && G.adv("lever"); return true;
      case "button": press(x, y, z, v); return true;
      case "trapdoor": case "gate": {
        let nm = m ^ OPEN;
        if (kind === "gate" && !(m & OPEN)) { const d = ctx.lookFacing(); if (d === ((m & 3) + 2) % 4) nm = (nm & ~3) | d; }   // swings away from you
        setState(x, y, z, make(id, nm), true); ctx.Sound.door(!(m & OPEN)); return true;
      }
      case "irontrapdoor": case "irondoor": return false;   // only a signal opens iron
      case "repeater": setState(x, y, z, make(id, (m & ~12) | ((((m >> 2) & 3) + 1) & 3) << 2)); ctx.Sound.click(); return true;
      case "comparator": setState(x, y, z, make(id, m ^ SUBTRACT)); ctx.Sound.click(); enqueue(x, y, z); return true;
      case "daylight": setState(x, y, z, make(id, m ^ INVERT)); daylightCheck(x, y, z); ctx.Sound.click(); return true;
      case "note": setState(x, y, z, make(id, (m & ~31) | (((m & 31) + 1) % 25))); playNote(x, y, z); return true;
    }
    return false;
  }

  // ---------- placing: work out the new block's state from where you clicked ----------
  // hit = the block you pointed at (with nx, ny, nz = the face), fy = how high on that face you clicked (0..1)
  // Returns a block value, or a string explaining why it can't go there, or null if it isn't a Sparkworks block.
  function placeValue(id, hit, x, y, z, fy, replaced) {
    const w = W(), look = ctx.lookFacing();
    const nx = replaced ? 0 : hit.nx, ny = replaced ? 1 : hit.ny, nz = replaced ? 0 : hit.nz;
    const below = w.get(x, y - 1, z);
    const side = DIR.findIndex(q => q[0] === -nx && q[1] === -nz);   // the wall you clicked on, for side clicks
    const make2 = (meta) => make(id, meta);
    if (id === B.SPARK_DUST) return supports(make(id), below) ? make2(0) : "Sparkdust needs a solid block under it.";
    if (id === B.REPEATER || id === B.COMPARATOR) return supports(make(id), below) ? make2(look) : `A ${BLOCKS[id].name} needs a solid block under it.`;
    if (isPlate(id)) return supports(make(id), below) ? make2(0) : "Pressure plates go on top of a solid block.";
    if (id === B.SPARK_TORCH) {
      if (ny === 1 && OPAQUE[idOf(below)]) return make2(0);
      if (ny === 0 && side >= 0 && OPAQUE[w.id(x + DIR[side][0], y, z + DIR[side][1])]) return make2(1 + side);
      if (OPAQUE[idOf(below)]) return make2(0);
      return "A Spark Torch needs a solid block to stand on or hang from.";
    }
    if (id === B.LEVER || isButton(id)) {
      const axis = look % 2 ? AXIS_X : 0;
      if (ny === 1 && OPAQUE[idOf(below)]) return make2(0 | axis);
      if (ny === -1 && OPAQUE[w.id(x, y + 1, z)]) return make2(1 | axis);
      if (ny === 0 && side >= 0 && OPAQUE[w.id(x + DIR[side][0], y, z + DIR[side][1])]) return make2(2 + side);
      return `A ${BLOCKS[id].name} has to go on the face of a solid block.`;
    }
    if (isTrapdoor(id)) {
      const hinge = ny === 0 && side >= 0 ? side : (look + 2) % 4;
      const top = ny === -1 || (ny === 0 && fy > 0.5);
      return make2(hinge | (top ? TOP : 0));
    }
    if (isGate(id)) return make2(look);
    if (id === B.SPARK_LAMP || id === B.NOTE_BLOCK || id === B.TARGET || id === B.DAYLIGHT || id === B.SPARK_BLOCK || isFence(id) || id === B.SPARK_ORE || id === B.DARK_SPARK_ORE) return make2(0);
    return null;
  }
  // after placing: let the engine settle the new block (a torch next to power, a lamp already powered…)
  function placed(x, y, z) { if (S()) { changed(x, y, z); process(); } }

  return { attach, toJSON, tick, interact, placeValue, placed, projectileHit, touchOre, kinds: KINDS, isPowered: (x, y, z) => isPowered(x, y, z), powerAt: (x, y, z) => powerAt(x, y, z, false), blockPower, strongPower, comparatorOutput: (x, y, z) => (S().cmp.get(key(x, y, z)) || 0), process, state: S };
}
