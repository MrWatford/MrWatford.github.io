// The Sparkworks signal engine (Blockhaven's redstone). Rules follow Minecraft Java Edition 1.20.1:
// signal strength 0-15 that drops 1 per wire block, strong and weak power through solid blocks, 1 redstone tick = 2 game ticks = 0.1 s.
// Every change is handled from a queue with a hard budget per game tick, so clocks and feedback loops can never freeze the game.
import { B, I, BLOCKS, OPAQUE, idOf, metaOf, make, isDoor, isTrapdoor, isGate, isButton, isPlate, isFence,
  DOT, UNLIT, AXIS_X, ON, LOCKED, SUBTRACT, CMP_ON, INVERT, POWERED, NOTE_ON, OPEN, TOP, EYE_IN, honeyOf, itemDef, ANCHOR_MAX,
  EXTENDED, STICKY_HEAD, OBS_ON, ATTACHED, HOOK_ON, DISARMED, OPENED, BELL_POWERED, isPiston, isHush, SOLID } from "./blocks.js";
import { DIR, PF, oppPF, conductor, dustConn, dustPoints, supportOf } from "./shapes.js";
import { CHUNK } from "./blocks.js";

const D6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const TICK = 0.05;          // one game tick (20 per second)
export const BUDGET = 6000; // real block updates (parts that react) allowed per game tick
const LOOKS = 120000;        // quick "is anything here?" checks allowed per game tick
const MAX_NET = 4096;       // biggest wire network worked out at once
const MAX_SCHED = 20000;
const POLLED = id => id === B.COMPARATOR || id === B.DAYLIGHT || isPlate(id) || id === B.TRIPWIRE_HOOK;
const key = (x, y, z) => x + "," + y + "," + z;
// blocks that do something when their neighbors change (everything else is skipped quickly)
const REACTS = id => id === B.SPARK_DUST || id === B.SPARK_TORCH || id === B.REPEATER || id === B.COMPARATOR || id === B.SPARK_LAMP || id === B.TNT || id === B.NOTE_BLOCK ||
  id === B.LEVER || isButton(id) || isPlate(id) || isDoor(id) || isTrapdoor(id) || isGate(id) ||
  isPiston(id) || id === B.PISTON_HEAD || id === B.TRIPWIRE_HOOK || id === B.TRIPWIRE || id === B.BELL;
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
    const st = w.rs = { tick: data.tick || 0, acc: 0, seq: 0, sched: new Map(), queue: [], head: 0, queued: new Set(), cmp: new Map(data.cmp || []), seen: new Map(), poll: new Set(), hist: new Map(), burnt: new Map(), used: 0, looks: 0, overload: false, ver: 0, netVer: new Map(),
      moves: new Map(), pulse: new Map(), hush: new Set(), hushPend: new Map(), hushFreq: new Map(), openChest: null };
    for (const [x, y, z, kind, dt] of data.sched || []) schedule(st, x, y, z, Math.max(1, dt), kind);
    // find comparators, sensors, and plates the player has placed (they're all in the change list)
    for (const [ck, m] of w.mods) {
      const [cx, cz] = ck.split(",").map(Number);
      for (const [i, v] of m) if (isHush(idOf(v))) st.hush.add(key(cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + Math.floor(i / CHUNK) % CHUNK));
      for (const [i, v] of m) if (POLLED(idOf(v))) st.poll.add(key(cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + Math.floor(i / CHUNK) % CHUNK));
    }
    w.onSet = (x, y, z, v, old) => {
      st.ver++;
      if (POLLED(idOf(old)) && idOf(old) !== idOf(v)) { st.poll.delete(key(x, y, z)); st.cmp.delete(key(x, y, z)); }
      if (POLLED(idOf(v))) st.poll.add(key(x, y, z));
      if (isHush(idOf(v))) st.hush.add(key(x, y, z));
      if (idOf(old) === B.TRIPWIRE && idOf(v) !== B.TRIPWIRE && (metaOf(old) & ATTACHED) && !(metaOf(old) & DISARMED)) stringCut(x, y, z);
      if (idOf(old) !== idOf(v) || !isHush(idOf(v))) watchers(x, y, z);   // observers see every change (a sensor's own timer doesn't count)
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
      case B.OBSERVER: { if (!(m & OBS_ON)) return 0; const b = PF[oppPF(m & 7)]; return b[0] === dx && b[1] === dy && b[2] === dz ? 15 : 0; }
      case B.TRIPWIRE_HOOK: return m & HOOK_ON ? 15 : 0;
      case B.TRAPPED_CHEST: return m & OPENED ? 1 : 0;
      case B.HUSH_SENSOR: case B.TUNED_SENSOR: return (m & 3) === 1 ? (m >> 2) & 15 : 0;
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
      else if (id === B.TRAPPED_CHEST) p = dy === 1 && (m & OPENED) ? 1 : 0;
      else if (id === B.LEVER || isButton(id) || id === B.TRIPWIRE_HOOK) { const s = supportOf(v); p = (id === B.TRIPWIRE_HOOK ? m & HOOK_ON : m & ON) && nx + s[0] === x && ny + s[1] === y && nz + s[2] === z ? 15 : 0; }
      else if (isPlate(id)) p = dy === 1 ? m & 15 : 0;
      else if (id === B.REPEATER || id === B.COMPARATOR || id === B.OBSERVER) p = emitDirect(nx, ny, nz, v, -dx, -dy, -dz, false);
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
    if (isHush(id)) return S().hushFreq.get(key(x, y, z)) || 0;
    if (id === B.CHEST || id === B.TRAPPED_CHEST || id === B.FURNACE || id === B.SHELL_BOX) {
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
    if (id === B.TRIPWIRE || id === B.BELL) return SOLID[sid] === 1;
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
    if (isPiston(id)) return pistonCheck(x, y, z, v);
    if (id === B.PISTON_HEAD) return headCheck(x, y, z, v);
    if (id === B.TRIPWIRE_HOOK) return hookCheck(x, y, z, v);
    if (id === B.BELL) { const p = isPowered(x, y, z), m = metaOf(v); if (p !== !!(m & BELL_POWERED)) { setState(x, y, z, make(id, p ? m | BELL_POWERED : m & ~BELL_POWERED)); if (p) ring(x, y, z); } return; }
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
        vibrate(x + 0.5, y + 0.5, z + 0.5, open ? 11 : 10);
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
    if (!!(m & OPEN) !== p) { ctx.Sound.door(p); vibrate(x + 0.5, by + 0.5, z + 0.5, p ? 11 : 10); }
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

  // ---------- Part B: pistons (Java rules: push up to 12 blocks, sticky blocks drag their neighbors, 2 game ticks to move) ----------
  const PUSH_LIMIT = 12;
  const IMMOVABLE = new Set([B.OBSIDIAN, B.BEDROCK, B.PORTAL, B.END_PORTAL, B.GATEWAY, B.END_FRAME, B.CHEST, B.TRAPPED_CHEST, B.FURNACE, B.SHELL_BOX, B.VOID_CHEST, B.BEACON, B.RESPAWN_ANCHOR, B.PISTON_HEAD, B.MOVING]);
  const SMASH = new Set([B.REPEATER, B.COMPARATOR, B.HUSH_SENSOR, B.TUNED_SENSOR, B.BELL, B.SKULL, B.BED, B.FIRE]);
  const STICKY = id => id === B.GLOOP_BLOCK || id === B.HONEY_BLOCK;
  const sticks = (a, b) => !((a === B.GLOOP_BLOCK && b === B.HONEY_BLOCK) || (a === B.HONEY_BLOCK && b === B.GLOOP_BLOCK));
  // what happens to a block in a piston's way: "air" (nothing there), "move", "smash" (pops off as an item), or "stop"
  function reaction(v) {
    const id = idOf(v), d = BLOCKS[id];
    if (!id || id === B.WATER || id === B.LAVA) return "air";
    if (!d || d.hardness === Infinity || IMMOVABLE.has(id)) return "stop";
    if (isPiston(id)) return metaOf(v) & EXTENDED ? "stop" : "move";
    if (SMASH.has(id) || !d.solid || isDoor(id) || d.replaceable) return "smash";
    return "move";
  }
  // Work out every block that moves (or "null" if something can't)
  function resolve(base, start, dir, pulling) {
    const w = W(), moving = new Map(), smash = [], q = [[start[0], start[1], start[2], pulling ? "stick" : "push"]];
    for (let qi = 0; qi < q.length; qi++) {
      const [x, y, z, why] = q[qi], k = key(x, y, z);
      if (moving.has(k)) continue;
      if (x === base[0] && y === base[1] && z === base[2]) { if (why === "push") return null; continue; }
      if (y + dir[1] < 1 || y + dir[1] >= 79) { if (why === "push" && reaction(w.get(x, y, z)) === "move") return null; }
      const v = w.get(x, y, z), r = reaction(v);
      if (r === "air") continue;
      if (r === "stop") { if (why === "push") return null; continue; }
      if (r === "smash") { if (why === "push" && !smash.some(s => s[0] === x && s[1] === y && s[2] === z)) smash.push([x, y, z]); continue; }
      if (y + dir[1] < 1 || y + dir[1] >= 79) return null;
      moving.set(k, { x, y, z, v });
      if (moving.size > PUSH_LIMIT) return null;
      q.push([x + dir[0], y + dir[1], z + dir[2], "push"]);
      if (STICKY(idOf(v))) for (const e of D6) {
        if (e[0] === dir[0] && e[1] === dir[1] && e[2] === dir[2]) continue;
        const nx = x + e[0], ny = y + e[1], nz = z + e[2], nv = w.get(nx, ny, nz);
        if (reaction(nv) === "move" && sticks(idOf(v), idOf(nv))) q.push([nx, ny, nz, "stick"]);
      }
    }
    return { cells: [...moving.values()], smash };
  }
  const pistonKey = (x, y, z) => key(x, y, z);
  function pistonPowered(x, y, z, face) {
    for (let i = 0; i < 6; i++) { if (i === face) continue; const e = PF[i]; if (powerFrom(x, y, z, e[0], e[1], e[2], false) > 0) return true; }
    return powerAt(x, y + 1, z, false) > 0;   // Java's quirk: a piston also notices power at the block above it
  }
  function pistonCheck(x, y, z, v) {
    const st = S(), m = metaOf(v), face = m & 7, want = pistonPowered(x, y, z, face), ext = !!(m & EXTENDED), mv = st.moves.get(pistonKey(x, y, z));
    if (mv && mv.extending !== want) { schedule(st, x, y, z, 0, "piston"); return; }
    if (!mv && want !== ext) schedule(st, x, y, z, 0, "piston");
    // an extended piston whose head is gone breaks
    if (!mv && ext) { const f = PF[face], hv = get(x + f[0], y + f[1], z + f[2]); if (idOf(hv) !== B.PISTON_HEAD || (metaOf(hv) & 7) !== face) ctx.breakBlock(x, y, z, true); }
  }
  function headCheck(x, y, z, v) {
    const face = metaOf(v) & 7, f = PF[face], bx = x - f[0], by = y - f[1], bz = z - f[2], bv = get(bx, by, bz);
    if (!(isPiston(idOf(bv)) && (metaOf(bv) & EXTENDED) && (metaOf(bv) & 7) === face) && !S().moves.has(pistonKey(bx, by, bz))) W().set(x, y, z, B.AIR);
  }
  function startMove(rec) {
    const w = W(), st = S(), { cells, dir } = rec;
    mute = true;
    try {
      for (const c of cells) w.set(c.x, c.y, c.z, B.AIR);
      for (const c of cells) w.set(c.x + dir[0], c.y + dir[1], c.z + dir[2], B.MOVING);
      if (rec.headAt) w.set(rec.headAt[0], rec.headAt[1], rec.headAt[2], B.MOVING);
    } finally { mute = false; }
    for (const c of cells) { changed(c.x, c.y, c.z); changed(c.x + dir[0], c.y + dir[1], c.z + dir[2]); }
    rec.end = st.tick + 2;
    st.moves.set(pistonKey(...rec.base), rec);
    schedule(st, rec.base[0], rec.base[1], rec.base[2], 2, "pfin");
    ctx.moveFx(cells, dir, 0.1);
    ctx.pushEntities(rec.headAt ? [...cells, { x: rec.base[0], y: rec.base[1], z: rec.base[2], v: B.STONE }] : cells, dir);   // the head itself shoves too
  }
  function finishMove(rec) {
    const w = W(), st = S(), { cells, dir } = rec;
    st.moves.delete(pistonKey(...rec.base));
    st.sched.delete(key(...rec.base) + ":pfin");
    for (const c of cells) { const dx = c.x + dir[0], dy = c.y + dir[1], dz = c.z + dir[2]; if (w.id(dx, dy, dz) === B.MOVING) w.set(dx, dy, dz, c.v); }
    if (rec.headAt && w.id(...rec.headAt) === B.MOVING) w.set(rec.headAt[0], rec.headAt[1], rec.headAt[2], rec.headV);
    for (const c of cells) if (idOf(c.v) === B.OBSERVER) observerTrigger(c.x + dir[0], c.y + dir[1], c.z + dir[2]);   // a moved observer fires
  }
  function extend(x, y, z, v) {
    const w = W(), m = metaOf(v), face = m & 7, f = PF[face], front = [x + f[0], y + f[1], z + f[2]];
    if (front[1] < 1 || front[1] >= 79) return false;
    const res = resolve([x, y, z], front, f, false);
    if (!res) return false;
    for (const [sx, sy, sz] of res.smash) ctx.breakBlock(sx, sy, sz, true);
    w.set(x, y, z, make(idOf(v), m | EXTENDED));
    startMove({ base: [x, y, z], cells: res.cells, dir: f, extending: true, headAt: front, headV: make(B.PISTON_HEAD, face | (idOf(v) === B.STICKY_PISTON ? STICKY_HEAD : 0)) });
    ctx.Sound.piston(true, dist(x, y, z)); vibrate(x + 0.5, y + 0.5, z + 0.5, 11);
    G.adv && G.adv("piston");
    return true;
  }
  function retract(x, y, z, v, pull) {
    const w = W(), m = metaOf(v), face = m & 7, f = PF[face], hx = x + f[0], hy = y + f[1], hz = z + f[2];
    mute = true;
    try { if (w.id(hx, hy, hz) === B.PISTON_HEAD) w.set(hx, hy, hz, B.AIR); w.set(x, y, z, make(idOf(v), m & ~EXTENDED)); } finally { mute = false; }
    changed(hx, hy, hz); changed(x, y, z);
    ctx.Sound.piston(false, dist(x, y, z)); vibrate(x + 0.5, y + 0.5, z + 0.5, 10);
    if (!pull || idOf(v) !== B.STICKY_PISTON) return;
    const back = [-f[0], -f[1], -f[2]], res = resolve([x, y, z], [hx + f[0], hy + f[1], hz + f[2]], back, true);
    if (res && res.cells.length) startMove({ base: [x, y, z], cells: res.cells, dir: back, extending: false });
  }
  function pistonFire(x, y, z) {
    const st = S(), v = get(x, y, z);
    if (!isPiston(idOf(v))) return;
    const m = metaOf(v), want = pistonPowered(x, y, z, m & 7), mv = st.moves.get(pistonKey(x, y, z));
    if (mv) {
      finishMove(mv);
      // switched off before it finished pushing: a sticky piston lets go of its block ("spitting"). Off right as it finishes: a normal pull.
      if (mv.extending && !want) retract(x, y, z, get(x, y, z), st.tick >= mv.end);
      else if (!mv.extending && want) extend(x, y, z, get(x, y, z));
      return;
    }
    const ext = !!(m & EXTENDED);
    if (want && !ext) extend(x, y, z, v);
    else if (!want && ext) retract(x, y, z, v, true);
  }
  function settle() { const st = S(); if (!st) return; for (const rec of [...st.moves.values()]) finishMove(rec); }

  // ---------- observers: a 1-redstone-tick pulse out the back when the block in front changes ----------
  function observerTrigger(x, y, z) { const st = S(); if (st && idOf(get(x, y, z)) === B.OBSERVER) schedule(st, x, y, z, 2, "obs"); }
  function watchers(x, y, z) {   // observers looking at (x, y, z)
    for (let i = 0; i < 6; i++) { const e = PF[i], ox = x - e[0], oy = y - e[1], oz = z - e[2], ov = get(ox, oy, oz); if (idOf(ov) === B.OBSERVER && (metaOf(ov) & 7) === i) observerTrigger(ox, oy, oz); }
  }

  // ---------- tripwire: two hooks facing each other (up to 40 apart) with string between ----------
  function hookLine(x, y, z, v) {
    const d = metaOf(v) & 3, [sx, sz] = [-DIR[d][0], -DIR[d][1]], cells = [];
    for (let i = 1; i <= 41; i++) {
      const cx = x + sx * i, cz = z + sz * i, cv = get(cx, y, cz), id = idOf(cv);
      if (id === B.TRIPWIRE) { cells.push([cx, y, cz]); continue; }
      if (id === B.TRIPWIRE_HOOK && (metaOf(cv) & 3) === (d + 2) % 4 && cells.length) return cells;
      return null;
    }
    return null;
  }
  function hookCheck(x, y, z, v) {
    const st = S(), w = W(), m = metaOf(v), k = key(x, y, z), line = hookLine(x, y, z, v);
    let seen = false;
    if (line) for (const [cx, cy, cz] of line) if (entitiesIn([cx, cy, cz, cx + 1, cy + 0.25, cz + 1], "all")) { seen = true; break; }
    if (seen) st.seen.set(k, st.tick);
    const on = (line && (seen || st.tick - (st.seen.get(k) ?? -99) < 10)) || (st.pulse.get(k) || 0) > st.tick;
    const nm = (m & 3) | (line ? ATTACHED : 0) | (on ? HOOK_ON : 0);
    if (nm !== m) {
      setState(x, y, z, make(B.TRIPWIRE_HOOK, nm));
      if (!!(m & HOOK_ON) !== on) { ctx.Sound.switchClick(on, dist(x, y, z)); if (on) vibrate(x + 0.5, y + 0.5, z + 0.5, 11); }
    }
    if (line) for (const [cx, cy, cz] of line) { const sv = w.get(cx, cy, cz), sm = metaOf(sv), want = (sm & ~(ATTACHED | HOOK_ON)) | ATTACHED | (on ? HOOK_ON : 0); if (want !== sm) { mute = true; try { w.set(cx, cy, cz, make(B.TRIPWIRE, want), true); } finally { mute = false; } } }
  }
  // cutting an armed string (without shears) trips the hooks for a moment
  function stringCut(x, y, z) {
    const st = S();
    for (let d = 0; d < 4; d++) for (let i = 1; i <= 41; i++) {
      const cx = x + DIR[d][0] * i, cz = z + DIR[d][1] * i, cv = get(cx, y, cz), id = idOf(cv);
      if (id === B.TRIPWIRE) continue;
      if (id === B.TRIPWIRE_HOOK && (metaOf(cv) & 3) === d) { st.pulse.set(key(cx, y, cz), st.tick + 10); enqueue(cx, y, cz); schedule(st, cx, y, cz, 11, "hook"); }
      break;
    }
  }
  function beforeBreak(x, y, z, tool) {
    const v = get(x, y, z);
    if (idOf(v) === B.TRIPWIRE && tool === "shears") { mute = true; try { W().set(x, y, z, make(B.TRIPWIRE, metaOf(v) | DISARMED), true); } finally { mute = false; } }
  }

  // ---------- trapped chests: power 1 while you have it open ----------
  function trappedTick() {
    const st = S(), open = G.state === "panel" && G.panelKind === "chest" && G.panelCtx ? G.panelCtx : null;
    if (open === st.openChest) return;
    for (const [k, on] of [[st.openChest, false], [open, true]]) {
      if (!k) continue;
      const [x, y, z] = k.split(",").map(Number), v = get(x, y, z);
      if (idOf(v) === B.CHEST || idOf(v) === B.TRAPPED_CHEST) vibrate(x + 0.5, y + 0.5, z + 0.5, on ? 11 : 10);
      if (idOf(v) === B.TRAPPED_CHEST) setState(x, y, z, make(B.TRAPPED_CHEST, on ? metaOf(v) | OPENED : metaOf(v) & ~OPENED));
    }
    st.openChest = open;
  }

  // ---------- Hush Sensors (sculk sensors): hear vibrations within 8 blocks (Tuned: 16, one frequency) ----------
  function occluded(ax, ay, az, bx, by, bz) {
    const n = Math.ceil(Math.hypot(bx - ax, by - ay, bz - az) / 0.4);
    for (let i = 1; i < n; i++) { const t = i / n, id = W().id(Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t), Math.floor(az + (bz - az) * t)); if (id === B.WOOL || id === B.BLACK_WOOL || id === B.HUSH_CARPET) return true; }
    return false;
  }
  function vibrate(x, y, z, freq) {
    const st = S();
    if (!st || !st.hush.size) return;
    for (const k of st.hush) {
      const [sx, sy, sz] = k.split(",").map(Number);
      if (!W().isLoaded(sx, sz)) continue;
      const v = get(sx, sy, sz), id = idOf(v), m = metaOf(v);
      if (!isHush(id)) { st.hush.delete(k); continue; }
      const range = id === B.TUNED_SENSOR ? 16 : 8, d = Math.hypot(sx + 0.5 - x, sy + 0.5 - y, sz + 0.5 - z);
      if (d > range || (m & 3) !== 0 || st.hushPend.has(k)) continue;
      if (id === B.TUNED_SENSOR) { const b = DIR[(((m >> 6) & 3) + 2) % 4], inp = powerFrom(sx, sy, sz, b[0], 0, b[1], false); if (inp > 0 && inp !== freq) continue; }
      if (occluded(x, y, z, sx + 0.5, sy + 0.5, sz + 0.5)) continue;
      st.hushPend.set(k, { freq, d, range });
      schedule(st, sx, sy, sz, Math.max(1, Math.floor(d)), "hush");
    }
  }
  function hushFire(x, y, z, kind) {
    const st = S(), k = key(x, y, z), v = get(x, y, z), id = idOf(v), m = metaOf(v);
    if (!isHush(id)) { st.hushPend.delete(k); return; }
    if (kind === "hush") {
      const p = st.hushPend.get(k); st.hushPend.delete(k);
      if (!p || (m & 3) !== 0) return;
      const power = Math.max(1, 15 - Math.floor(p.d / p.range * 15));
      setState(x, y, z, make(id, (m & ~63) | 1 | (power << 2)));
      st.hushFreq.set(k, p.freq);
      schedule(st, x, y, z, id === B.TUNED_SENSOR ? 10 : 30, "hushoff");
      ctx.Sound.hush(dist(x, y, z)); ctx.puff(x + 0.5, y + 0.9, z + 0.5, "hush");
      G.adv && G.adv("hush", id);
    } else if (kind === "hushoff") { setState(x, y, z, make(id, (m & ~63) | 2)); schedule(st, x, y, z, 10, "hushrest"); }
    else setState(x, y, z, make(id, m & ~63));
  }
  function chunkLoaded(w, c) {   // sensors that came with the land (the Deep) join the list when their land loads
    const st = w.rs;
    if (!st) return;
    const d = c.data;
    for (let i = 0; i < d.length; i++) { const id = d[i] & 255; if (id === B.HUSH_SENSOR || id === B.TUNED_SENSOR) st.hush.add(key(c.cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), c.cz * CHUNK + Math.floor(i / CHUNK) % CHUNK)); }
  }

  // ---------- bells ----------
  function ring(x, y, z) {
    ctx.Sound.bell(dist(x, y, z)); ctx.puff(x + 0.5, y + 0.6, z + 0.5, "spark");
    for (const e of ctx.ents.list) if (e.def.villager && !e.dead && Math.hypot(e.pos.x - x, e.pos.z - z) < 48) e.bellT = 30;   // villagers hurry home
    vibrate(x + 0.5, y + 0.5, z + 0.5, 11);
    G.adv && G.adv("bell");
  }
  function entitiesIn(b, kinds) {
    const over = a => a[0] < b[3] && a[3] > b[0] && a[1] < b[4] && a[4] > b[1] && a[2] < b[5] && a[5] > b[2];
    const p = G.player;
    if (p && !G.spectator && G.state !== "dead" && over(p.aabb())) return true;
    for (const e of ctx.ents.list) if (!e.dead && !e.gone && over([e.pos.x - e.w / 2, e.pos.y, e.pos.z - e.w / 2, e.pos.x + e.w / 2, e.pos.y + e.h, e.pos.z + e.w / 2])) return true;
    if (kinds === "all") for (const d of G.drops) if (d.x > b[0] && d.x < b[3] && d.z > b[2] && d.z < b[5] && d.y >= b[1] - 0.1 && d.y < b[4]) return true;
    return false;
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
      case "piston": pistonFire(e.x, e.y, e.z); break;
      case "pfin": { const rec = S().moves.get(key(e.x, e.y, e.z)); if (rec) finishMove(rec); break; }
      // Java observer: one timer. Off: turn on and check again in 2 ticks. On: turn off.
      case "obs": if (id === B.OBSERVER) { if (m & OBS_ON) setState(e.x, e.y, e.z, make(id, m & ~OBS_ON)); else { setState(e.x, e.y, e.z, make(id, m | OBS_ON)); schedule(S(), e.x, e.y, e.z, 2, "obs"); } } break;
      case "hook": if (id === B.TRIPWIRE_HOOK) hookCheck(e.x, e.y, e.z, v); break;
      case "hush": case "hushoff": case "hushrest": hushFire(e.x, e.y, e.z, e.kind); break;
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
      else if (id === B.TRIPWIRE_HOOK) hookCheck(x, y, z, w.get(x, y, z));   // also notices a string line being finished
      else if (id === B.COMPARATOR) enqueue(x, y, z);
      else if (id === B.DAYLIGHT && st.tick % 20 === 0) daylightCheck(x, y, z);
    }
    trappedTick();
    // creatures walking near Hush Sensors make vibrations (checked twice a second)
    if (st.hush.size && st.tick % 10 === 0) for (const e of ctx.ents.list) if (!e.dead && e.onGround !== false && Math.hypot(e.vel ? e.vel.x : 0, e.vel ? e.vel.z : 0) > 0.6) vibrate(e.pos.x, e.pos.y + 0.1, e.pos.z, 1);
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
    if (!old || !level) { ctx.Sound.switchClick(!!level, dist(x, y, z), true); vibrate(x + 0.5, y + 0.2, z + 0.5, level ? 11 : 10); }
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
    ctx.Sound.switchClick(true, dist(x, y, z)); vibrate(x + 0.5, y + 0.5, z + 0.5, 11);
    schedule(S(), x, y, z, BLOCKS[id].wood ? 30 : 20, "btn");
  }

  // ---------- right-clicking Sparkworks blocks. Returns true if the click was used up. ----------
  const KINDS = new Set(["sparkore", "dust", "lever", "button", "trapdoor", "irontrapdoor", "gate", "repeater", "comparator", "irondoor", "note", "daylight", "bell"]);
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
        setState(x, y, z, make(id, m ^ ON)); ctx.Sound.switchClick(!(m & ON), 0); vibrate(x + 0.5, y + 0.5, z + 0.5, m & ON ? 10 : 11);
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
      case "bell": ring(x, y, z); return true;
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
    if (isPiston(id)) return make2(oppPF(ctx.lookFacing3()));   // the pushing face points back at you
    if (id === B.OBSERVER) return make2(ctx.lookFacing3());     // the face watches the way you look; the output points at you
    if (id === B.TRIPWIRE_HOOK) return ny === 0 && side >= 0 && OPAQUE[w.id(x + DIR[side][0], y, z + DIR[side][1])] ? make2(side) : "A Tripwire Hook goes on the side of a solid block.";
    if (id === B.TRIPWIRE) return SOLID[idOf(below)] ? make2(0) : "String needs a block under it to be laid as a tripwire.";
    if (id === B.BELL) return SOLID[idOf(below)] ? make2(look) : "A Bell needs a solid block under it.";
    if (id === B.TUNED_SENSOR) return make2(((look + 2) % 4) << 6);
    if (id === B.HUSH_SENSOR) return make2(0);
    if (id === B.SPARK_LAMP || id === B.NOTE_BLOCK || id === B.TARGET || id === B.DAYLIGHT || id === B.SPARK_BLOCK || isFence(id) || id === B.SPARK_ORE || id === B.DARK_SPARK_ORE) return make2(0);
    return null;
  }
  // after placing: let the engine settle the new block (a torch next to power, a lamp already powered…)
  function placed(x, y, z) { if (S()) { changed(x, y, z); process(); } }

  return { attach, toJSON, tick, interact, placeValue, placed, projectileHit, touchOre, kinds: KINDS, settle, vibrate, beforeBreak, chunkLoaded, reaction, isPowered: (x, y, z) => isPowered(x, y, z), powerAt: (x, y, z) => powerAt(x, y, z, false), blockPower, strongPower, comparatorOutput: (x, y, z) => (S().cmp.get(key(x, y, z)) || 0), process, state: S };
}
