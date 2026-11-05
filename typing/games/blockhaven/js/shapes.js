// Shapes of the Sparkworks blocks: the little boxes they're drawn with, the boxes you bump into,
// and how Sparkdust wire connects to its neighbors. Used by the drawing code, the player, and the signal engine.
import { B, OPAQUE, idOf, metaOf, faceTile, TILE, isTrapdoor, isFence, isGate, isButton, isPlate,
  DOT, UNLIT, AXIS_X, ON, LOCKED, SUBTRACT, CMP_ON, OPEN, TOP, EXTENDED, STICKY_HEAD, OBS_ON, ATTACHED, isPiston, isHush } from "./blocks.js";

export const DIR = [[0, 1], [1, 0], [0, -1], [-1, 0]];   // facing 0..3 → (dx, dz)
// 6-way facing for pistons and observers: 0 up, 1 down, 2-5 = DIR[0-3]
export const PF = [[0, 1, 0], [0, -1, 0], [0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0]];
export const oppPF = i => i < 2 ? 1 - i : 2 + ((i - 2 + 2) % 4);
const S = 1 / 16;

// ----- turning a model built for one direction to face another -----
// rotY: turn around the vertical axis so local +z points to DIR[f]. rotX: lay a floor model against a wall (its bottom against +z).
export const rotY = (p, f) => f === 0 ? p : f === 1 ? [p[2], p[1], 1 - p[0]] : f === 2 ? [1 - p[0], p[1], 1 - p[2]] : [1 - p[2], p[1], p[0]];
const wallT = d => p => rotY([p[0], p[2], 1 - p[1]], d);
const ceilT = f => p => rotY([p[0], 1 - p[1], 1 - p[2]], f);
const floorT = f => p => rotY(p, f);
// turn a model built pointing up so it points along PF[i]
export const faceT = i => i === 0 ? floorT(0) : i === 1 ? ceilT(0) : wallT((i - 2 + 2) % 4);
// Lever and button attachment: 0 floor, 1 ceiling, 2-5 wall (support in DIR[a-2])
export function attachT(meta) {
  const a = meta & 7, f = meta & AXIS_X ? 1 : 0;
  return a === 0 ? floorT(f) : a === 1 ? ceilT(f) : wallT(a - 2);
}
// Where the block a lever, button, or torch hangs on is (offset from it)
export function supportOf(v) {
  const id = idOf(v), m = metaOf(v);
  if (id === B.SPARK_TORCH) { const a = m & 7; return a === 0 ? [0, -1, 0] : [DIR[a - 1][0], 0, DIR[a - 1][1]]; }
  if (id === B.LEVER || isButton(id)) { const a = m & 7; return a === 0 ? [0, -1, 0] : a === 1 ? [0, 1, 0] : [DIR[a - 2][0], 0, DIR[a - 2][1]]; }
  if (id === B.SPARK_DUST || isPlate(id) || id === B.REPEATER || id === B.COMPARATOR || id === B.TRIPWIRE || id === B.BELL || (id >= B.RAIL && id <= B.ACTIVATOR_RAIL)) return [0, -1, 0];
  if (id === B.TRIPWIRE_HOOK) { const d = m & 3; return [DIR[d][0], 0, DIR[d][1]]; }
  return null;
}

// ----- Sparkdust wire -----
export const conductor = id => OPAQUE[id] === 1 && id !== B.SPARK_BLOCK && id !== B.CHEST && id !== B.TRAPPED_CHEST;
// Does a part next to the wire (in direction d from the wire) make the wire bend toward it?
export function dustLinks(v, d) {
  const id = idOf(v);
  if (id === B.SPARK_DUST || id === B.SPARK_TORCH || id === B.LEVER || id === B.SPARK_BLOCK || id === B.DAYLIGHT || id === B.TARGET || id === B.COMPARATOR || isButton(id) || isPlate(id)) return true;
  if (id === B.REPEATER) return ((metaOf(v) & 3) % 2) === (d % 2);
  if (id === B.OBSERVER) return (metaOf(v) & 7) === 2 + d;   // only its output side
  if (id === B.TRIPWIRE_HOOK || id === B.TRAPPED_CHEST || isHush(id) || id === B.DETECTOR_RAIL) return true;
  return false;
}
// conn[d] for the 4 sides: 0 none, 1 flat (or stepping down), 2 climbing up the side block. get(dx, dy, dz) reads a neighbor.
export function dustConn(get) {
  const above = idOf(get(0, 1, 0)), out = [0, 0, 0, 0];
  for (let d = 0; d < 4; d++) {
    const [dx, dz] = DIR[d], n = get(dx, 0, dz), nid = idOf(n);
    if (dustLinks(n, d)) { out[d] = 1; continue; }
    if (!conductor(above) && idOf(get(dx, 1, dz)) === B.SPARK_DUST && conductor(nid)) { out[d] = 2; continue; }
    if (!conductor(nid) && idOf(get(dx, -1, dz)) === B.SPARK_DUST) out[d] = 1;
  }
  return out;
}
// Which sides the wire "points" at (and so powers): a lone wire points everywhere unless it's a dot; one link makes a straight line.
export function dustPoints(v, conn) {
  const n = conn.filter(c => c).length;
  if (n === 0) return metaOf(v) & DOT ? [0, 0, 0, 0] : [1, 1, 1, 1];
  if (n === 1) { const d = conn.findIndex(c => c); const o = [0, 0, 0, 0]; o[d] = 1; o[(d + 2) % 4] = 1; return o; }
  return conn.map(c => c ? 1 : 0);
}

// ----- fences and gates -----
function fenceLinks(n, d) {
  const id = idOf(n);
  if (isFence(id)) return true;
  if (isGate(id)) return ((metaOf(n) & 3) % 2) !== (d % 2);   // a gate joins fences along its width
  return OPAQUE[id] === 1;
}

// ----- the drawn model: { T, parts: [{ b: [x0,y0,z0,x1,y1,z1] in 1/16ths, tiles: [top, side, bottom], shear: [sx, sz] }] } -----
const p = (b, tiles, shear) => ({ b: b.map(k => k * S), tiles: Array.isArray(tiles) ? tiles : [tiles, tiles, tiles], shear });
export function model(v, get) {
  const id = idOf(v), m = metaOf(v), tex = faceTile(v, 1);
  if (id === B.SPARK_TORCH) {
    const lit = !(m & UNLIT), head = lit ? TILE.spark_block : TILE.dust_line0, a = m & 7;
    const stick = p([7, 0, 7, 9, 10, 9], [head, tex, tex]);
    if (a === 0) return { T: floorT(0), parts: [stick] };
    // a wall torch leans out from the wall it hangs on
    return { T: floorT(a - 1), parts: [p([7, 3.5, 11.5, 9, 13.5, 13.5], [head, tex, tex], [0, -0.45])] };
  }
  if (id === B.LEVER) {
    const lean = m & ON ? 0.55 : -0.55;
    return { T: attachT(m), parts: [p([5, 0, 4, 11, 3, 12], TILE.cobble), p([7, 1, 7, 9, 11, 9], [TILE.lever_handle, TILE.lever_handle, TILE.lever_handle], [0, lean])] };
  }
  if (isButton(id)) return { T: attachT(m), parts: [p([5, 0, 6, 11, m & ON ? 1 : 2, 10], tex)] };
  if (isPlate(id)) return { T: floorT(0), parts: [p([1, 0, 1, 15, (m & 15) ? 0.5 : 1, 15], tex)] };
  if (id === B.REPEATER || id === B.COMPARATOR) {
    const top = faceTile(v, 0), side = TILE.slab_side, f = m & 3;
    const nub = lit => lit ? TILE.spark_block : TILE.note_block;
    const parts = [p([0, 0, 0, 16, 2, 16], [top, side, side])];
    if (id === B.REPEATER) {
      const on = !!(m & ON), z = [6, 4, 2, 0.5][(m >> 2) & 3];
      parts.push(p([7, 2, 11, 9, 7, 13], nub(on)));
      if (m & LOCKED) parts.push(p([2, 2, z + 0.5, 14, 4, z + 2.5], TILE.bedrock));
      else parts.push(p([7, 2, z, 9, 7, z + 2], nub(on)));
    } else {
      const on = !!(m & CMP_ON);
      parts.push(p([3, 2, 2, 5, 7, 4], nub(on)), p([11, 2, 2, 13, 7, 4], nub(on)), p([7, 2, 11, 9, 5, 13], nub(!!(m & SUBTRACT))));
    }
    return { T: floorT(f), parts };
  }
  if (id === B.DAYLIGHT) return { T: floorT(0), parts: [p([0, 0, 0, 16, 6, 16], [faceTile(v, 0), TILE.daylight_side, TILE.daylight_side])] };
  if (isTrapdoor(id)) {
    const b = m & OPEN ? [0, 0, 13, 16, 16, 16] : m & TOP ? [0, 13, 0, 16, 16, 16] : [0, 0, 0, 16, 3, 16];
    return { T: floorT(m & 3), parts: [p(b, tex)] };
  }
  if (isFence(id)) {
    const parts = [p([6, 0, 6, 10, 16, 10], tex)], arms = [];
    for (let d = 0; d < 4; d++) if (get && fenceLinks(get(DIR[d][0], 0, DIR[d][1]), d)) arms.push(d);
    return { T: floorT(0), parts, arms: arms.map(d => ({ T: floorT(d), parts: [p([7, 6, 10, 9, 9, 16], tex), p([7, 12, 10, 9, 15, 16], tex)] })) };
  }
  if (isPiston(id)) {
    const top = m & EXTENDED ? TILE.piston_inner : id === B.STICKY_PISTON ? TILE.piston_top_sticky : TILE.piston_top;
    return { T: faceT(m & 7), parts: [p([0, 0, 0, 16, m & EXTENDED ? 12 : 16, 16], [top, TILE.piston_side, TILE.piston_bottom])] };
  }
  if (id === B.PISTON_HEAD) {
    const top = m & STICKY_HEAD ? TILE.piston_top_sticky : TILE.piston_top;
    return { T: faceT(m & 7), parts: [p([0, 12, 0, 16, 16, 16], [top, TILE.piston_side, TILE.piston_top]), p([6, -4, 6, 10, 12, 10], TILE.planks)] };
  }
  if (id === B.OBSERVER) return { T: faceT(m & 7), parts: [p([0, 0, 0, 16, 16, 16], [TILE.observer_front, TILE.observer_side, m & OBS_ON ? TILE.observer_back_on : TILE.observer_back])] };
  if (id === B.TRIPWIRE_HOOK) return { T: floorT(m & 3), parts: [p([6, 1, 14, 10, 10, 16], TILE.hook), p([7, 5, 9, 9, 6, 14], TILE.iron_block), p([6, 4, 7, 10, 7, 9], TILE.iron_block)] };
  if (id === B.TRIPWIRE) {
    const h = m & ATTACHED ? 1 : 2, arms = [];
    for (let d = 0; d < 4; d++) { const n = get ? get(DIR[d][0], 0, DIR[d][1]) : 0, nid = idOf(n); if (nid === B.TRIPWIRE || (nid === B.TRIPWIRE_HOOK && (metaOf(n) & 3) === d)) arms.push(d); }
    const dirs = arms.length ? arms : [0, 1, 2, 3];
    return { T: floorT(0), parts: [p([7.5, h, 7.5, 8.5, h + 0.5, 8.5], TILE.wool)], arms: dirs.map(d => ({ T: floorT(d), parts: [p([7.75, h, 8.5, 8.25, h + 0.5, 16], TILE.wool)] })) };
  }
  if (isHush(id)) {
    const on = (m & 3) === 1, ten = on ? TILE.tendril_on : TILE.tendril;
    const parts = [p([0, 0, 0, 16, 8, 16], [faceTile(v, 0), TILE.hush_sensor_side, TILE.hush_sensor_side])];
    for (const [x, z] of [[3, 3], [12, 3], [3, 12], [12, 12]]) parts.push(p([x, 8, z, x + 1, on ? 14 : 12, z + 1], ten));
    if (id === B.TUNED_SENSOR) parts.push(p([6, 8, 6, 10, 13, 10], TILE.lumen_crystal));
    return { T: floorT(id === B.TUNED_SENSOR ? (m >> 6) & 3 : 0), parts };
  }
  if (id === B.HOPPER) {
    const f = m & 7, out = TILE.hopper_outside, parts = [p([0, 10, 0, 16, 16, 16], [TILE.hopper_top, out, out]), p([4, 4, 4, 12, 10, 12], out)];
    if (f === 1) return { T: floorT(0), parts: [...parts, p([6, 0, 6, 10, 4, 10], out)] };
    return { T: floorT(0), parts, arms: [{ T: floorT(f - 2), parts: [p([6, 4, 12, 10, 8, 16], out)] }] };
  }
  if (id === B.BELL) return { T: floorT(m & 3), parts: [p([0, 0, 7, 2, 16, 9], TILE.bell_post), p([14, 0, 7, 16, 16, 9], TILE.bell_post), p([2, 13, 7, 14, 15, 9], TILE.bell_post), p([5, 5, 5, 11, 13, 11], TILE.bell), p([4, 4, 4, 12, 6, 12], TILE.bell)] };
  if (isGate(id)) {
    const parts = [p([0, 5, 7, 2, 16, 9], tex), p([14, 5, 7, 16, 16, 9], tex)];
    if (m & OPEN) parts.push(p([0, 6, 9, 2, 9, 15], tex), p([0, 12, 9, 2, 15, 15], tex), p([14, 6, 9, 16, 9, 15], tex), p([14, 12, 9, 16, 15, 15], tex));
    else parts.push(p([2, 6, 7, 14, 9, 9], tex), p([2, 12, 7, 14, 15, 9], tex), p([6, 9, 7, 8, 12, 9], tex), p([8, 9, 7, 10, 12, 9], tex));
    return { T: floorT(m & 3), parts };
  }
  return null;
}

// ----- collision boxes (in the block's own 0..1 space; fences and gates are 1.5 tall) -----
const box = (T, b) => { const a = T([b[0], b[1], b[2]]), c = T([b[3], b[4], b[5]]); return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.min(a[2], c[2]), Math.max(a[0], c[0]), Math.max(a[1], c[1]), Math.max(a[2], c[2])]; };
export function shapeBoxes(v, get) {
  const id = idOf(v), m = metaOf(v);
  if (id === B.REPEATER || id === B.COMPARATOR) return [[0, 0, 0, 1, 2 * S, 1]];
  if (id === B.DAYLIGHT) return [[0, 0, 0, 1, 6 * S, 1]];
  if (isHush(id)) return [[0, 0, 0, 1, 0.5, 1]];
  if (isPiston(id) && (m & EXTENDED)) return [box(faceT(m & 7), [0, 0, 0, 1, 12 * S, 1])];
  if (id === B.PISTON_HEAD) { const T = faceT(m & 7); return [box(T, [0, 12 * S, 0, 1, 1, 1]), box(T, [6 * S, 0, 6 * S, 10 * S, 12 * S, 10 * S])]; }
  if (isTrapdoor(id)) { const mo = model(v); return [box(mo.T, mo.parts[0].b)]; }
  if (isFence(id)) {
    const out = [[6 * S, 0, 6 * S, 10 * S, 1.5, 10 * S]];
    for (let d = 0; d < 4; d++) if (get && fenceLinks(get(DIR[d][0], 0, DIR[d][1]), d)) out.push(box(floorT(d), [6 * S, 0, 10 * S, 10 * S, 1.5, 1]));
    return out;
  }
  if (isGate(id)) return m & OPEN ? [] : [box(floorT(m & 3), [0, 0, 6 * S, 1, 1.5, 10 * S])];
  return null;   // not a Sparkworks shape
}
// The outline drawn around a block you point at (null = the whole cube)
export function selectBox(v) {
  const id = idOf(v);
  if (id === B.SPARK_DUST) return [0, 0, 0, 1, S, 1];
  if (id >= B.RAIL && id <= B.ACTIVATOR_RAIL) { const sh = metaOf(v) & 15; return sh >= 2 && sh <= 5 ? [0, 0, 0, 1, 0.6, 1] : [0, 0, 0, 1, 2 * S, 1]; }
  if (isFence(id)) return [6 * S, 0, 6 * S, 10 * S, 1, 10 * S];
  if (isGate(id)) return box(floorT(metaOf(v) & 3), [0, 5 * S, 7 * S, 1, 1, 9 * S]);
  const mo = model(v);
  if (!mo) return null;
  let b = null;
  for (const part of mo.parts) {
    const q = box(mo.T, part.b);
    b = b ? [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.min(b[2], q[2]), Math.max(b[3], q[3]), Math.max(b[4], q[4]), Math.max(b[5], q[5])] : q;
  }
  return b;
}
