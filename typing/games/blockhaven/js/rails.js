// Rails and minecarts (Minecraft Java Edition 1.20.1 rules, Blockhaven-sized).
// A rail's shape (meta bits 0-3) says which two neighbors it joins. Carts follow the straight line between those two
// exits (a curve is a diagonal shortcut, like Java), keep their speed through turns, and speed up downhill.
import { B, idOf, metaOf, make, isRail, RAIL_ON, SOLID, OPAQUE } from "./blocks.js";

export const DIR = [[0, 1], [1, 0], [0, -1], [-1, 0]];   // 0 +z, 1 +x, 2 −z, 3 −x
// For each shape: its two exits as [dx, dy, dz] (dy = 1 on the high end of a slope)
export const EXITS = [
  [[0, 0, -1], [0, 0, 1]],    // 0 along z
  [[-1, 0, 0], [1, 0, 0]],    // 1 along x
  [[-1, 0, 0], [1, 1, 0]],    // 2 up toward +x
  [[1, 0, 0], [-1, 1, 0]],    // 3 up toward −x
  [[0, 0, 1], [0, 1, -1]],    // 4 up toward −z
  [[0, 0, -1], [0, 1, 1]],    // 5 up toward +z
  [[0, 0, 1], [1, 0, 0]],     // 6 curve +z/+x
  [[0, 0, 1], [-1, 0, 0]],    // 7 curve +z/−x
  [[0, 0, -1], [-1, 0, 0]],   // 8 curve −z/−x
  [[0, 0, -1], [1, 0, 0]]     // 9 curve −z/+x
];
export const shapeOf = v => Math.min(9, metaOf(v) & 15);
const CURVE = { "0,1": 6, "1,0": 6, "0,3": 7, "3,0": 7, "2,3": 8, "3,2": 8, "2,1": 9, "1,2": 9 };
const UP = [5, 2, 4, 3];   // sloping up toward DIR[d]
const exitCells = (v, x, y, z) => EXITS[shapeOf(v)].map(([dx, dy, dz]) => [x + dx, y + dy, z + dz]);
// Does the rail N (at nx, ny, nz) lead into cell P? (A flat exit toward a slope's high end counts too.)
function leadsTo(N, nx, ny, nz, px, py, pz) {
  return exitCells(N, nx, ny, nz).some(([cx, cy, cz]) => cx === px && cz === pz && (cy === py || cy === py + 1));
}
// The rail a cart at this exit cell would use: there, or one lower (a slope coming up to meet it)
function railAt(get, x, y, z) { const v = get(x, y, z); if (isRail(idOf(v))) return [v, y]; const u = get(x, y - 1, z); if (isRail(idOf(u))) return [u, y - 1]; return null; }
function satisfied(get, v, x, y, z) {
  return exitCells(v, x, y, z).every(([cx, cy, cz]) => { const r = railAt(get, cx, cy, cz); return r && leadsTo(r[0], cx, r[1], cz, x, y, z); });
}
// Work out a rail's shape from the rails around it. get(x, y, z) reads the world.
export function railShape(get, x, y, z, v, powered) {
  const id = idOf(v), curves = id === B.RAIL;
  const cand = [];
  for (let d = 0; d < 4; d++) {
    const nx = x + DIR[d][0], nz = z + DIR[d][1];
    for (const dy of [1, 0, -1]) {
      const n = get(nx, y + dy, nz);
      if (!isRail(idOf(n))) continue;
      const free = !satisfied(get, n, nx, y + dy, nz) || leadsTo(n, nx, y + dy, nz, x, y, z);
      if (free) { cand.push({ d, up: dy === 1 }); break; }
    }
  }
  if (!cand.length) return shapeOf(v);
  // a T-junction (normal rails): unpowered it bends toward +z/+x, powered toward −z/−x (Java's switch)
  const order = powered ? [2, 3, 0, 1] : [0, 1, 2, 3];
  cand.sort((a, b) => order.indexOf(a.d) - order.indexOf(b.d));
  const up = cand.find(c => c.up);
  if (up) return UP[up.d];
  if (cand.length === 1) return cand[0].d % 2 ? 1 : 0;
  // two (or more): a straight line if two face each other, otherwise a curve (only plain rails can curve)
  for (const a of cand) for (const b of cand) if (a !== b && (a.d + 2) % 4 === b.d && !(curves && cand.length > 2 && order.indexOf(a.d) > 1 && order.indexOf(b.d) > 1)) {
    if (!curves || cand.length === 2) return a.d % 2 ? 1 : 0;
  }
  if (curves) { const k = cand[0].d + "," + cand[1].d; if (CURVE[k] !== undefined) return CURVE[k]; }
  return cand[0].d % 2 ? 1 : 0;
}
// Should this rail be reshaped? Only when one of its ends is loose (Java keeps a finished track as it is), or at a T-junction.
export function needsShape(get, v, x, y, z) {
  if (!satisfied(get, v, x, y, z)) return true;
  if (idOf(v) !== B.RAIL) return false;
  let n = 0;
  for (let d = 0; d < 4; d++) for (const dy of [1, 0, -1]) if (isRail(idOf(get(x + DIR[d][0], y + dy, z + DIR[d][1])))) { n++; break; }
  return n > 2;
}

// ---------- minecart movement ----------
const MAX = 8;            // blocks per second on rails (Java: 0.4 blocks per tick)
const SLOPE = 3.125;      // downhill pull (blocks/s²)
const BOOST = 24;         // powered rail push (blocks/s²)
// One step of a cart on rails. Returns false if it isn't on a rail (then it falls and slides like a boat on land).
// opts: { push: [x,z] or null (a rider pressing forward), rider: bool, fuel: [x,z] or null (furnace cart) }
export function cartStep(world, e, dt, opts) {
  let cx = Math.floor(e.pos.x), cy = Math.floor(e.pos.y + 0.1), cz = Math.floor(e.pos.z);
  const get = (x, y, z) => world.get(x, y, z);
  let r = railAt(get, cx, cy, cz);
  if (!r) return false;
  let [v, ry] = r, budget = 3;
  const hs = Math.hypot(e.vel.x, e.vel.z);
  let speed = hs;
  // which way along this rail are we going?
  let [a, b] = EXITS[shapeOf(v)];
  let p0 = [0.5 + a[0] * 0.5, a[1], 0.5 + a[2] * 0.5], p1 = [0.5 + b[0] * 0.5, b[1], 0.5 + b[2] * 0.5];
  let dir = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(dir[0], dir[2]);
  let sign = (e.vel.x * dir[0] + e.vel.z * dir[2]) >= 0 ? 1 : -1;
  if (hs < 1e-3) { sign = e.lastSign || 1; speed = 0; }
  let s = sign * speed;
  // forces
  if (dir[1]) s -= Math.sign(dir[1]) * SLOPE * dt;
  if (opts.push && Math.abs(s) < 0.5) { const k = opts.push[0] * dir[0] + opts.push[1] * dir[2]; if (Math.abs(k) > 0.2) s += Math.sign(k) * 2; }
  if (opts.fuel) { const k = opts.fuel[0] * dir[0] + opts.fuel[1] * dir[2]; if (Math.abs(k) > 0.2) { const want = Math.sign(k) * 4; if (Math.abs(s) < 4 || Math.sign(s) !== Math.sign(want)) s += (want - s) * Math.min(1, dt * 3); } }
  const id = idOf(v), on = !!(metaOf(v) & RAIL_ON);
  if (id === B.POWERED_RAIL) {
    if (on) {
      if (Math.abs(s) > 0.2) s += Math.sign(s) * BOOST * dt;
      else {   // standing still on a powered rail against a wall: get kicked away from the wall
        const back = [cx + a[0], cy, cz + a[2]], front = [cx + b[0], cy, cz + b[2]];
        if (SOLID[world.id(...back)] && !SOLID[world.id(...front)]) s = 1.5; else if (SOLID[world.id(...front)] && !SOLID[world.id(...back)]) s = -1.5;
      }
    } else s = Math.abs(s) < 0.6 ? 0 : s * Math.pow(0.5, dt * 20);   // an unpowered powered rail is a brake
  }
  s *= Math.pow(opts.rider || opts.fuel ? 0.997 : 0.96, dt * 20);
  if (Math.abs(s) < 0.01) s = 0;
  s = Math.max(-MAX, Math.min(MAX, s));
  // move along the rail, crossing into the next one if we pass an end
  let dist = s * dt;
  let t = ((e.pos.x - cx - p0[0]) * dir[0] + (e.pos.z - cz - p0[2]) * dir[2]) / (L * L);
  t = Math.max(0, Math.min(1, t));
  while (budget-- > 0) {
    t += dist / L;
    if (t >= 0 && t <= 1) break;
    // leaving through an end
    const exit = t > 1 ? b : a, over = (t > 1 ? t - 1 : -t) * L;
    const nx = cx + exit[0], nz = cz + exit[2];
    const nr = railAt(get, nx, ry + exit[1], nz);
    if (!nr || !leadsTo(nr[0], nx, nr[1], nz, cx, ry, cz)) {
      // the track ends: stop at the end of the rail (Java carts roll off; here a dead end stops them unless it's open ground ahead)
      const ahead = world.id(nx, ry + exit[1], nz);
      if (!SOLID[ahead] && !nr) { t = t > 1 ? 1 : 0; const p = [p0[0] + dir[0] * t, p0[1] + dir[1] * t, p0[2] + dir[2] * t]; e.pos.x = cx + p[0] + Math.sign(exit[0]) * 0.02; e.pos.z = cz + p[2] + Math.sign(exit[2]) * 0.02; e.pos.y = ry + p[1] + 0.0625; const u = Math.sign(s); e.vel.x = dir[0] / L * u * Math.abs(s); e.vel.z = dir[2] / L * u * Math.abs(s); e.vel.y = 0; e.lastSign = u; return true; }
      t = t > 1 ? 1 : 0; s = 0; break;
    }
    // continue on the next rail, keeping the same speed
    const fromExit = [-exit[0], 0, -exit[2]];   // the side of the new rail we come in from
    cx = nx; cz = nz; ry = nr[1]; v = nr[0];
    [a, b] = EXITS[shapeOf(v)];
    // orient so we enter at the end that faces where we came from
    const enterA = a[0] === fromExit[0] && a[2] === fromExit[2];
    p0 = [0.5 + a[0] * 0.5, a[1], 0.5 + a[2] * 0.5]; p1 = [0.5 + b[0] * 0.5, b[1], 0.5 + b[2] * 0.5];
    dir = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]; L = Math.hypot(dir[0], dir[2]);
    if (enterA) { s = Math.abs(s); t = 0; } else { s = -Math.abs(s); t = 1; }
    dist = s >= 0 ? over : -over;
  }
  t = Math.max(0, Math.min(1, t));
  const p = [p0[0] + dir[0] * t, p0[1] + dir[1] * t, p0[2] + dir[2] * t];
  e.pos.x = cx + p[0]; e.pos.z = cz + p[2]; e.pos.y = ry + p[1] + 0.0625;
  e.vel.x = dir[0] / L * s; e.vel.z = dir[2] / L * s; e.vel.y = 0;
  if (s) { e.lastSign = Math.sign(s); e.yaw = Math.atan2(-e.vel.x, -e.vel.z); }
  e.onRail = { x: cx, y: ry, z: cz, id: idOf(v), on: !!(metaOf(v) & RAIL_ON) };
  e.onGround = true;
  return true;
}
