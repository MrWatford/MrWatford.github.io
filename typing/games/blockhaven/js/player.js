// Player body: walking, jumping, crouching, swimming, flying, and bumping into blocks.
import { B, SOLID, idOf, metaOf, TOP } from "./blocks.js";
const LOW = { [B.BED]: 9 / 16, [B.FARMLAND]: 15 / 16 };   // blocks shorter than a full cube
import { doorBox } from "./mesher.js";

export const GRAVITY = 26, JUMP = 8.2, REACH = 5;
const EPS = 1e-4;

// Collision boxes of the block at (x, y, z), in world coordinates
export function blockBoxes(v, x, y, z, out) {
  const id = idOf(v);
  if (id === B.DOOR) { const b = doorBox(metaOf(v)); out.push([x + b[0], y + b[1], z + b[2], x + b[3], y + b[4], z + b[5]]); return; }
  if (SOLID[id]) out.push([x, y, z, x + 1, y + (LOW[id] || 1), z + 1]);
}

export class Player {
  constructor() {
    this.pos = { x: 0.5, y: 60, z: 0.5 };
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = 0; this.pitch = 0;
    this.onGround = false; this.crouch = false; this.flying = false; this.inWater = false; this.headInWater = false;
    this.health = 20; this.hunger = 20; this.exhaust = 0; this.airTop = null;
    this.spawn = null; this.hurtT = 0;
  }
  get height() { return this.mount ? 2.6 : this.crouch && !this.flying ? 1.5 : 1.8; }
  get eye() { return this.mount ? 2.45 : this.crouch && !this.flying ? 1.27 : 1.62; }   // riding a Trotter puts you up high
  aabb(px = this.pos.x, py = this.pos.y, pz = this.pos.z, h = this.height) { return [px - 0.3, py, pz - 0.3, px + 0.3, py + h, pz + 0.3]; }

  boxesNear(world, a) {
    const out = [];
    for (let y = Math.floor(a[1]) - 1; y <= Math.floor(a[4]); y++)
      for (let z = Math.floor(a[2]); z <= Math.floor(a[5]); z++)
        for (let x = Math.floor(a[0]); x <= Math.floor(a[3]); x++) blockBoxes(world.get(x, y, z), x, y, z, out);
    return out;
  }
  collides(world, a) {
    for (const b of this.boxesNear(world, a)) if (a[0] < b[3] - EPS && a[3] > b[0] + EPS && a[1] < b[4] - EPS && a[4] > b[1] + EPS && a[2] < b[5] - EPS && a[5] > b[2] + EPS) return b;
    return null;
  }

  // One physics step. input: { f, r (−1..1), jump, sprint, crouch, flyUp, flyDown }
  step(world, input, dt, creative) {
    const p = this.pos, v = this.vel;
    const feet = world.id(Math.floor(p.x), Math.floor(p.y + 0.1), Math.floor(p.z)), body = world.id(Math.floor(p.x), Math.floor(p.y + 0.9), Math.floor(p.z));
    this.inLava = feet === B.LAVA || body === B.LAVA;
    this.inWater = feet === B.WATER || body === B.WATER || this.inLava;   // lava is swum through like (very slow) water
    this.headInWater = world.id(Math.floor(p.x), Math.floor(p.y + this.eye), Math.floor(p.z)) === B.WATER;
    // crouching: only stand back up if there is head room
    const wantCrouch = !!input.crouch && !this.flying;
    if (this.crouch && !wantCrouch) { if (!this.collides(world, this.aabb(p.x, p.y, p.z, 1.8))) this.crouch = false; }
    else this.crouch = wantCrouch;

    if (this.gliding && (this.onGround || this.inWater || this.flying)) this.gliding = false;
    if (this.gliding) {
      // Glider Wings: look down to dive and speed up, look up to climb and slow down
      const cp = Math.cos(this.pitch), dx = -Math.sin(this.yaw) * cp, dy = Math.sin(this.pitch), dz = -Math.cos(this.yaw) * cp;
      let sp = Math.hypot(v.x, v.y, v.z);
      sp += -dy * 14 * dt - 0.8 * dt;
      sp = Math.max(3, Math.min(30, sp));
      v.x += (dx * sp - v.x) * 0.06; v.z += (dz * sp - v.z) * 0.06; v.y += (dy * sp - v.y) * 0.06;
      v.y -= 4 * dt;
      this.airTop = p.y;   // gliding never builds up fall damage
    } else {
    let speed = this.flying ? (input.sprint ? 16 : 9) : this.mount ? (input.sprint ? 11 : 7.5) : this.crouch ? 1.6 : input.sprint ? 5.8 : 4.3;
    if (this.inWater && !this.flying) speed *= this.inLava ? 0.3 : 0.55;
    speed *= this.speedMul || 1;
    if (this.onGround && !this.flying && world.id(Math.floor(p.x), Math.floor(p.y - 0.1), Math.floor(p.z)) === B.SOUL_SAND) speed *= 0.5;   // Wailing Sand slows you down
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let mx = -sin * input.f + cos * input.r, mz = -cos * input.f - sin * input.r;
    const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
    const grip = this.flying ? 0.2 : this.onGround ? 0.35 : this.inWater ? 0.12 : 0.08;
    v.x += (mx * speed - v.x) * grip; v.z += (mz * speed - v.z) * grip;

    if (this.flying) {
      const vy = (input.flyUp ? 8 : 0) - (input.flyDown ? 8 : 0);
      v.y += (vy - v.y) * 0.3;
    } else if (this.inWater) {
      v.y -= GRAVITY * 0.25 * dt; v.y *= 0.9;
      if (input.jump) v.y = Math.min(v.y + 30 * dt, 3.2);
      this.airTop = null;
    } else {
      v.y -= GRAVITY * dt;
      if (v.y < -40) v.y = -40;
      if (input.jump && this.onGround) { v.y = this.mount ? JUMP * 1.4 : JUMP; this.exhaust += this.mount ? 0 : 0.05 * (input.sprint ? 4 : 1); }
    }
    if (input.sprint && (mx || mz) && this.onGround && !this.mount) this.exhaust += 0.1 * dt;
    }
    if (this.levitate && !this.flying) { v.y += (1.8 - v.y) * 0.25; this.airTop = null; }   // a Sheller's bullet makes you float up

    // move one axis at a time and stop at blocks
    const wasGround = this.onGround;
    this.onGround = false;
    let landed = 0, crash = 0;
    p.y += v.y * dt;
    let hit = null;
    { const a = this.aabb();
      for (const b of this.boxesNear(world, a)) if (a[0] < b[3] - EPS && a[3] > b[0] + EPS && a[1] < b[4] - EPS && a[4] > b[1] + EPS && a[2] < b[5] - EPS && a[5] > b[2] + EPS)
        if (!hit || (v.y < 0 ? b[4] > hit[4] : b[1] < hit[1])) hit = b; }
    if (hit) {
      if (v.y < 0) { p.y = hit[4]; this.onGround = true; landed = 1; } else p.y = hit[1] - this.height - EPS;
      v.y = 0;
    }
    for (const axis of ["x", "z"]) {
      const d = v[axis] * dt;
      if (!d) continue;
      const before = p[axis];
      p[axis] += d;
      if (this.collides(world, this.aabb())) { if (this.gliding) crash = Math.max(crash, Math.abs(v[axis])); p[axis] = before; v[axis] = 0; continue; }
      // crouching keeps you from walking off edges
      if (this.crouch && wasGround && !this.flying) {
        const a = this.aabb(); a[1] -= 0.6; a[4] = p.y;
        if (!this.collides(world, a)) { p[axis] = before; v[axis] = 0; }
      }
    }
    if (!this.onGround && !hit) {   // still standing on something just below?
      const a = this.aabb(); a[1] -= 0.02; a[4] = p.y + 0.01;
      if (v.y <= 0 && this.collides(world, a)) this.onGround = true;
    }

    // fall damage
    let fall = 0;
    if (this.onGround || this.inWater || this.flying || creative) {
      if (this.airTop !== null && (this.onGround && landed) && !this.inWater && !this.flying && !creative) fall = this.airTop - p.y;
      this.airTop = null;
    } else this.airTop = this.airTop === null ? p.y : Math.max(this.airTop, p.y);
    return { fall, crash };
  }
}

// Walk through the grid along the look direction and return the first block hit, and which face.
export function raycast(world, o, d, maxDist, skipWater = true) {
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const sx = Math.sign(d.x), sy = Math.sign(d.y), sz = Math.sign(d.z);
  const tdx = sx ? Math.abs(1 / d.x) : Infinity, tdy = sy ? Math.abs(1 / d.y) : Infinity, tdz = sz ? Math.abs(1 / d.z) : Infinity;
  let tx = sx ? (sx > 0 ? x + 1 - o.x : o.x - x) * tdx : Infinity;
  let ty = sy ? (sy > 0 ? y + 1 - o.y : o.y - y) * tdy : Infinity;
  let tz = sz ? (sz > 0 ? z + 1 - o.z : o.z - z) * tdz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  for (let i = 0; i < 64 && t <= maxDist; i++) {
    const v = world.get(x, y, z), id = idOf(v);
    if (id && !(skipWater && id === B.WATER) && !(id === B.BEDROCK && !world.isLoaded(x, z))) {
      if (id !== B.DOOR || doorHit(v, x, y, z, o, d)) return { x, y, z, nx, ny, nz, v, dist: t };
    }
    if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; nx = -sx; ny = 0; nz = 0; }
    else if (ty < tz) { y += sy; t = ty; ty += tdy; nx = 0; ny = -sy; nz = 0; }
    else { z += sz; t = tz; tz += tdz; nx = 0; ny = 0; nz = -sz; }
  }
  return null;
}
// Is the look line actually touching the thin door slab inside this cell?
function doorHit(v, x, y, z, o, d) {
  const b = doorBox(metaOf(v));
  let t0 = 0, t1 = Infinity;
  for (const [a, lo, hi] of [["x", x + b[0], x + b[3]], ["y", y + b[1], y + b[4]], ["z", z + b[2], z + b[5]]]) {
    if (Math.abs(d[a]) < 1e-9) { if (o[a] < lo || o[a] > hi) return false; continue; }
    let ta = (lo - o[a]) / d[a], tb = (hi - o[a]) / d[a];
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}
export { TOP };
