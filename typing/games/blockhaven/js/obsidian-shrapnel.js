import { B, CHUNK, idOf } from './blocks.js';
import { projectileBlockHit } from './projectile-collision.js';

export const OBSIDIAN_SHARD_SPEED = 13;
export const OBSIDIAN_SHARD_PREVIEW_RANGE = 32;

// The warning and release share this immutable launch record. Moving the
// player or boss afterward cannot silently retarget the five-shot spread.
export function planObsidianShrapnel(e, target) {
  if (!e?.pos || !target || ![e.pos.x, e.pos.z, e.eyeY, target.x, target.y, target.z].every(Number.isFinite)) return null;
  const origin = Object.freeze({ x: e.pos.x, y: e.eyeY - 1, z: e.pos.z });
  const dx = target.x - origin.x, dz = target.z - origin.z, horizontal = Math.hypot(dx, dz) || 1;
  const angle = Math.atan2(dx, dz), pitch = (target.y - origin.y) / horizontal, length = Math.hypot(1, pitch);
  const shots = [];
  for (let i = -2; i <= 2; i++) {
    const yaw = angle + i * .15;
    shots.push(Object.freeze({ vx: Math.sin(yaw) / length * OBSIDIAN_SHARD_SPEED,
      vy: pitch / length * OBSIDIAN_SHARD_SPEED, vz: Math.cos(yaw) / length * OBSIDIAN_SHARD_SPEED }));
  }
  return Object.freeze({ origin, shots: Object.freeze(shots) });
}

export function validObsidianVolley(volley) {
  return !!volley?.origin && [volley.origin.x, volley.origin.y, volley.origin.z].every(v => Number.isFinite(v) && Math.abs(v) < Number.MAX_SAFE_INTEGER - 128) &&
    Array.isArray(volley.shots) && volley.shots.length === 5 && volley.shots.every(s => s &&
      [s.vx, s.vy, s.vz].every(Number.isFinite) && Math.abs(Math.hypot(s.vx, s.vy, s.vz) - OBSIDIAN_SHARD_SPEED) < 1e-7);
}

export function traceObsidianVolley(world, volley) {
  if (!validObsidianVolley(volley) || !world.isLoaded(volley.origin.x, volley.origin.z)) return null;
  // Use the projectile collision routine and quarter-block substeps, including
  // partial blocks. Unloaded neighbours are barriers, never generation requests.
  const bounded = { isLoaded: (x, z) => world.isLoaded(x, z),
    get: (x, y, z) => world.isLoaded(x, z) ? world.get(x, y, z) : B.BEDROCK };
  bounded.id = (x, y, z) => idOf(bounded.get(x, y, z));
  return volley.shots.map(shot => {
    const d = { x: shot.vx / OBSIDIAN_SHARD_SPEED, y: shot.vy / OBSIDIAN_SHARD_SPEED, z: shot.vz / OBSIDIAN_SHARD_SPEED };
    let point = { ...volley.origin }, distance = 0;
    for (let step = 0; step < 128; step++) {
      const next = { x: point.x + d.x * .25, y: point.y + d.y * .25, z: point.z + d.z * .25 };
      const hit = projectileBlockHit(bounded, point.x, point.y, point.z, next.x, next.y, next.z, {});
      if (hit) { distance += .25 * hit.t; point = { x: hit.hx, y: hit.hy, z: hit.hz }; break; }
      point = next; distance += .25;
    }
    return { origin: volley.origin, end: point, distance };
  });
}

// At most 25 chunk probes. Catch streaming changes even when the total loaded
// chunk count stays constant; detailed collision traces remain cached/throttled.
export function obsidianVolleyLoadedKey(world, volley) {
  if (!validObsidianVolley(volley)) return null;
  const o = volley.origin;
  let minX=o.x,maxX=o.x,minZ=o.z,maxZ=o.z;
  for (const s of volley.shots) {
    const x=o.x+s.vx/OBSIDIAN_SHARD_SPEED*OBSIDIAN_SHARD_PREVIEW_RANGE,z=o.z+s.vz/OBSIDIAN_SHARD_SPEED*OBSIDIAN_SHARD_PREVIEW_RANGE;
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
  }
  let mask=0,bit=0;
  for(let cz=Math.floor(minZ/CHUNK);cz<=Math.floor(maxZ/CHUNK);cz++)for(let cx=Math.floor(minX/CHUNK);cx<=Math.floor(maxX/CHUNK);cx++) {
    if(world.isLoaded(cx*CHUNK,cz*CHUNK))mask|=1<<bit;
    bit++;
  }
  return mask;
}
