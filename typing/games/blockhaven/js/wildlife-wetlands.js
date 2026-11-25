import { hunterLevel } from "./ultra-hardcore.js";
import { B, HEIGHT, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

export const CROC = "crocodile", HIPPO = "hippopotamus";
const fish = new Set(["minnow", "sunfin", "salmon"]);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const habitatBlocks = new Set([B.GRASS, B.DIRT, B.SAND, B.GRAVEL, B.CLAY, B.STONE]);
const shoreDirections = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

export function wetlandDepth(world, pos, height) {
  const x = Math.floor(pos.x), z = Math.floor(pos.z);
  let y = Math.floor(pos.y + 0.3);
  if (world.id(x, y, z) !== B.WATER) return pos.y;
  while (y < HEIGHT && world.id(x, y, z) === B.WATER) y++;
  return y - height * 0.93;
}

function swimRest(w, e, speed) {
  const x = e.home[0], z = e.home[2];
  const distanceHome = Math.hypot(e.pos.x - x, e.pos.z - z);
  if (distanceHome > 4 || !e.inWater) return { x, y: e.home[1], z, speed };
  return { x: e.pos.x, y: wetlandDepth(w, e.pos, e.h), z: e.pos.z, speed };
}

function couldReach(e, target, range) {
  return distance(e.pos, target) < range && Math.abs(e.pos.y - target.y) < 2.1;
}

function beginRush(e, target, distance, speed) {
  const dx = target.x - e.pos.x, dz = target.z - e.pos.z;
  const length = Math.hypot(dx, dz) || 1;
  const dir = { x: dx / length, z: dz / length };
  e.yaw = Math.atan2(-dir.x, -dir.z);
  e.path = null;
  e.wild.rush = dir;
  e.goal = { x: e.pos.x + dir.x * distance, y: target.y, z: e.pos.z + dir.z * distance, speed };
}

function hitInFront(e, target, reach) {
  const dx = target.x - e.pos.x, dz = target.z - e.pos.z;
  return couldReach(e, target, reach) && dx * e.wild.rush.x + dz * e.wild.rush.z >= -0.55;
}

function crocodileThink(manager, e, p, d, multiplier, clearPath) {
  const s = e.wild, now = e.age, w = manager.world;
  if (s.phase === "roll") {
    if (now < s.until) return;
    s.phase = "recover";
    s.until = now + 4.4;
  }
  if (s.phase === "lunge") {
    const fish = s.prey;
    const player = s.player && s.playerId === (p.mpId ?? null) && manager.targetable();
    const target = player ? p.pos : fish?.pos;
    const live = player || fish && !fish.dead && !fish.gone && fish.inWater;
    if (live && hitInFront(e, target, 2.65) && clearPath({ ...target, y: target.y + 0.35 })) {
      if (player) {
        manager.ctx.hurtPlayer(8 * multiplier, "A crocodile lunged from the river.", e);
        manager.ctx.push(s.rush.x * 3, 1.6, s.rush.z * 3);
      } else manager.damage(fish, 7, e);
      if (e.inWater) {
        s.phase = "roll";
        s.rollAt = now;
        s.until = now + 0.55;
        s.prey = null;
        s.player = false;
        e.goal = null;
        return;
      }
      s.until = now;
    }
    if (now >= s.until || !e.goal) {
      s.phase = "recover";
      s.until = now + 4.4;
      s.prey = null;
      s.player = false;
      e.goal = null;
    }
    return;
  }
  const resting = swimRest(w, e, 1.65);
  if (s.phase === "recover" && now < s.until) { e.goal = resting; return; }
  s.phase = "ambush";
  e.goal = resting;
  const fromHome = distance(e.pos, { x: e.home[0], y: e.home[1], z: e.home[2] });
  const run = manager.ctx.ultra?.(), hunt = hunterLevel(run);
  const pCanTrigger = e.inWater ? couldReach(e, p.pos, (p.inWater ? 6.6 : 3.7) + (run ? .7 : 0) + hunt * .6)
    : e.angry > 0 && d < 5.5 + hunt;
  if (run && pCanTrigger && manager.targetable() && !(s.rippleAt > now)) {
    s.rippleAt = now + 4;
    manager.ctx.particles(e.pos.x, e.pos.y + e.h * .8, e.pos.z, "splash");
  }
  if (fromHome > 12 + hunt || now < (s.scanAt ?? 0)) return;
  s.scanAt = now + 0.6;
  s.player = pCanTrigger && manager.targetable() && manager.canSeePlayer(e);
  s.prey = !s.player && e.inWater ? manager.near(e.pos.x, e.pos.y, e.pos.z, 6.5, o =>
    fish.has(o.sp) && o.inWater && couldReach(e, o.pos, 6.5) && clearPath(o.pos))[0] : null;
  if (s.player || s.prey) {
    s.phase = "lunge";
    s.playerId = p.mpId ?? null;
    s.until = now + 1;
    const target = s.player ? p.pos : s.prey.pos;
    beginRush(e, target, 6.5, e.inWater ? 7.4 : 5.2);
    Sound.mob("croclunge", d);
    if (e.inWater) manager.ctx.particles(e.pos.x, e.pos.y + e.h, e.pos.z, "splash");
  }
}

function hippoThink(manager, e, p, d, multiplier) {
  const s = e.wild, w = manager.world, now = e.age, targetable = manager.targetable();
  if (!targetable && (s.phase === "charge" || s.phase === "warning")) {
    s.phase = "rest";
    e.goal = null;
  }
  if (s.phase === "charge") {
    if (s.playerId === (p.mpId ?? null) && hitInFront(e, p.pos, 2.75) && manager.canSeePlayer(e)) {
      manager.ctx.hurtPlayer(11 * multiplier, "A hippo charged to defend its territory.", e);
      manager.ctx.push(s.rush.x * 6, 3.2, s.rush.z * 6);
      s.until = now;
    }
    if (now >= s.until || !e.goal) {
      s.phase = "recover";
      s.until = now + 5;
      e.goal = null;
    }
    return;
  }
  if (s.phase === "warning") {
    e.goal = null;
    if (now < s.until) return;
    if (s.playerId === (p.mpId ?? null) && d < 8 && manager.canSeePlayer(e)) {
      s.phase = "charge";
      s.until = now + 1.25;
      beginRush(e, s.warnAt, 7.5, e.inWater ? 6.3 : 7.4);
      return;
    }
    s.phase = "recover";
    s.until = now + 3.5;
  }
  const home = { x: e.home[0], y: e.home[1], z: e.home[2] };
  const inTerritory = distance(e.pos, home) < 14;
  const intruder = (e.inWater || p.inWater) && distance(p.pos, home) < 7 && d < 6.5;
  if ((s.phase !== "recover" || now >= s.until) && targetable && inTerritory &&
      (intruder || (e.angry > 0 && d < 8)) && couldReach(e, p.pos, 8) && manager.canSeePlayer(e)) {
    s.phase = "warning";
    s.playerId = p.mpId ?? null;
    s.warnAt = { ...p.pos };
    s.until = now + 0.9;
    e.yaw = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
    e.goal = e.path = null;
    Sound.mob("hippowarn", d);
    return;
  }
  e.goal = swimRest(w, e, 1.9);
  if (s.phase !== "recover" || now >= s.until) s.phase = e.inWater ? "wallow" : "rest";
}

export function thinkWetland(manager, e, d, multiplier, clearPath) {
  const p = manager.ctx.player();
  if (e.sp === CROC) crocodileThink(manager, e, p, d, multiplier, clearPath);
  else hippoThink(manager, e, p, d, multiplier);
}

export function wetlandSpawnSite(w, x, surface, z, def) {
  const depth = def.w > 1.9 ? 2 : 1;
  const y = surface + 1 - Math.max(depth, def.h * 0.93);
  const sampleY = Math.floor(y + 0.25);
  let water = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!w.isLoaded(x + dx, z + dz) || w.id(x + dx, sampleY, z + dz) !== B.WATER) return null;
    const above = w.id(x + dx, Math.floor(y + def.h - 0.1), z + dz);
    if (SOLID[above] || above === B.LAVA) return null;
    if (w.id(x + dx, sampleY - 1, z + dz) === B.WATER) water++;
  }
  if (water < 3) return null;
  for (const [dx, dz] of shoreDirections) {
    for (let step = 2; step <= 7; step++) {
      const tx = x + dx * step, tz = z + dz * step;
      if (!w.isLoaded(tx, tz)) break;
      const ground = w.id(tx, surface, tz), upper = w.id(tx, surface + 1, tz);
      if (habitatBlocks.has(ground) && !SOLID[upper] && upper !== B.WATER && upper !== B.LAVA) {
        return { x: x + 0.5, y, z: z + 0.5, yaw: Math.atan2(-dx, -dz) };
      }
      if (ground !== B.WATER) break;
    }
  }
  return null;
}
