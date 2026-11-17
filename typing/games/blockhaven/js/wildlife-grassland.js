import { B, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

export const LION = "lion", ZEBRA = "zebra";
const preySpecies = new Set([ZEBRA, "deer", "rabbit", "giraffe", "ostrich"]);
const herdGrazers = new Set([ZEBRA, "deer", "giraffe", "ostrich", "peacock"]);
const predators = new Set([LION, "grizzly_bear", "tiger"]);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const homePoint = e => ({ x: e.home[0], y: e.home[1], z: e.home[2] });
const active = e => e && !e.dead && !e.gone && e.hp > 0;

function inGroup(a, b) {
  return a.sp === b.sp && a.home.every((v, i) => v === b.home[i]);
}

function grassyRoom(w, x, y, z, h) {
  if (!w.isLoaded(x, z) || w.id(x, y - 1, z) !== B.GRASS) return false;
  for (let dy = 0; dy < Math.ceil(h); dy++) {
    const id = w.id(x, y + dy, z);
    if (SOLID[id] || id === B.WATER || id === B.LAVA) return false;
  }
  return true;
}

export function canSpawnGrassland(w, def, x, y, z) {
  const cellX = Math.floor(x), cellZ = Math.floor(z);
  if (def.spawnRadius) {
    for (let dz = -def.spawnRadius; dz <= def.spawnRadius; dz++) {
      for (let dx = -def.spawnRadius; dx <= def.spawnRadius; dx++) {
        if (!grassyRoom(w, cellX + dx, y, cellZ + dz, def.h)) return false;
      }
    }
    return true;
  }
  return grassyRoom(w, cellX, y, cellZ, def.h) &&
    [[-0.35, 0], [0.35, 0], [0, -0.35], [0, 0.35]].every(([dx, dz]) =>
      grassyRoom(w, Math.floor(x + dx), y, Math.floor(z + dz), def.h));
}

export function spawnGrasslandGroup(manager, species, def, x, y, z, yaw, slots, random) {
  const home = [x, y, z], w = manager.world;
  const offsets = [[0, 0], [-3, 0], [3, 0], [0, 3], [0, -3], [-3, -3], [3, 3]];
  let spawned = 0;
  for (const [dx, dz] of offsets) {
    if (spawned >= slots) break;
    const px = x + dx, pz = z + dz;
    if (!w.isLoaded(Math.floor(px), Math.floor(pz))) continue;
    const ground = species === "deer" || species === "giraffe" || species === "peacock" ?
      w.gen.column?.(Math.floor(px), Math.floor(pz))?.h : undefined;
    const py = (ground ?? w.surfaceY(Math.floor(px), Math.floor(pz))) + 1;
    if (Math.abs(py - y) > 1 || !canSpawnGrassland(w, def, px, py, pz)) continue;
    const variant = species === LION ? Number(spawned > 0 || random() > 0.6) : species === "deer" ? Number(random() < 0.42) :
      species === "ostrich" ? Number(spawned === 1 || random() < 0.42) :
      species === "peacock" ? Number(spawned > 0) : species === "kangaroo" ? Number(random() < 0.28) : 0;
    const animal = manager.add(species, px, py, pz, { home, yaw, variant, ambient: true });
    animal.wild.role = spawned++;
  }
}

export function steerGrassland(manager, e, target, speed, stop = 1.25) {
  if (e.age < (e.wild.routeAt ?? 0) && e.goal) return;
  e.wild.routeAt = e.age + 0.65;
  manager.moveTo(e, target, speed, stop);
  const w = manager.world;
  if (e.goal && w.id(Math.floor(e.goal.x), Math.floor(e.pos.y), Math.floor(e.goal.z)) === B.LAVA) e.goal = null;
}

function fleeGrazer(manager, e, source) {
  const s = e.wild, now = e.age;
  s.fleeFrom = { ...source };
  s.fleeUntil = Math.max(s.fleeUntil ?? 0, now + 6);
  if (s.phase !== "flee") {
    e.path = e.goal = null;
    s.routeAt = 0;
  }
  s.phase = "flee";
  if (now < (s.alertAt ?? 0)) return;
  s.alertAt = now + 1.5;
  Sound.mob(e.def.sound, manager.dist(e));
  for (const member of manager.near(e.pos.x, e.pos.y, e.pos.z, 12, other => other !== e && inGroup(e, other))) {
    member.wild.fleeFrom = { ...source };
    member.wild.fleeUntil = Math.max(member.wild.fleeUntil ?? 0, member.age + 6);
    if (member.wild.phase !== "flee") {
      member.goal = member.path = null;
      member.wild.routeAt = 0;
    }
    member.wild.phase = "flee";
    member.wild.alertAt = member.age + 1.5;
  }
}

export function alertGrazingHerd(manager, grazer, attacker) {
  if (!herdGrazers.has(grazer.sp)) return;
  if (attacker === "player") fleeGrazer(manager, grazer, manager.ctx.player().pos);
  else if (predators.has(attacker?.sp)) fleeGrazer(manager, grazer, attacker.pos);
}

export function thinkGrazingHerd(manager, e, clearPath) {
  const s = e.wild, now = e.age, w = manager.world;
  if (now >= (s.scanAt ?? 0)) {
    s.scanAt = now + 1;
    const predator = manager.near(e.pos.x, e.pos.y, e.pos.z, 10, other =>
      predators.has(other.sp) && active(other) && !other.inWater &&
      (other.wild.phase !== "sleep" && other.wild.phase !== "stalk" || distance(e.pos, other.pos) < 5.25) &&
      clearPath({ ...other.pos, y: other.pos.y + 0.75 }))[0];
    if (predator) fleeGrazer(manager, e, predator.pos);
  }
  if (s.fleeFrom && now < s.fleeUntil) {
    s.phase = "flee";
    if (now < (s.routeAt ?? 0) && e.goal) return;
    const away = Math.atan2(e.pos.z - s.fleeFrom.z, e.pos.x - s.fleeFrom.x);
    for (const offset of [0, 0.65, -0.65, 1.2, -1.2]) {
      const angle = away + offset;
      const x = e.pos.x + Math.cos(angle) * 7, z = e.pos.z + Math.sin(angle) * 7;
      if (!w.isLoaded(Math.floor(x), Math.floor(z))) continue;
      const ground = e.sp === "deer" || e.sp === "peacock" ? w.gen.column?.(Math.floor(x), Math.floor(z))?.h : undefined;
      const y = (ground ?? w.surfaceY(Math.floor(x), Math.floor(z))) + 1;
      if (Math.abs(e.pos.y - y) > 1.25 ||
          !canSpawnGrassland(w, e.def, x, y, z) || !clearPath({ x, y: y + 0.75, z })) continue;
      steerGrassland(manager, e, { x, y, z }, e.def.fleeSpeed ?? 6.25, 0.55);
      return;
    }
    e.goal = null;
    s.routeAt = now + 0.65;
    return;
  }
  if (s.phase === "flee") {
    s.fleeFrom = null;
    e.goal = e.path = null;
    s.routeAt = 0;
  }
  const herd = manager.near(e.pos.x, e.pos.y, e.pos.z, 16, other =>
    other !== e && inGroup(e, other) && (other.wild.role ?? 0) < (s.role ?? 0));
  const lead = herd[0];
  if (lead && distance(e.pos, lead.pos) > 4.4) {
    s.phase = "herd";
    steerGrassland(manager, e, lead.pos, 2.75, 3.2);
  } else if (distance(e.pos, homePoint(e)) > 21) {
    s.phase = "herd";
    steerGrassland(manager, e, homePoint(e), 2.75, 4.5);
  } else if (now % 11 > 6.0) {
    s.phase = "graze";
    e.goal = e.path = null;
  } else {
    s.phase = "herd";
    manager.wander(e);
  }
}

function alertPride(manager, lion, prey) {
  for (const member of manager.near(lion.pos.x, lion.pos.y, lion.pos.z, 16,
    other => active(other) && inGroup(lion, other) && other.wild.phase !== "warnPlayer" && other.wild.phase !== "guard")) {
    const s = member.wild;
    s.prey = prey;
    s.huntUntil = member.age + 15;
    s.phase = "stalk";
    s.routeAt = 0;
    member.goal = member.path = null;
  }
}

function stopHunt(e, delay) {
  const s = e.wild;
  s.prey = null;
  s.huntUntil = 0;
  s.nextHunt = e.age + delay;
  s.phase = "patrol";
  s.routeAt = 0;
  e.goal = e.path = null;
}

function guardPlayer(manager, e, p, d, multiplier) {
  const s = e.wild, now = e.age;
  const canGuard = manager.targetable() && d < 9 && distance(e.pos, homePoint(e)) < 20;
  if (!canGuard) {
    if (s.phase === "warnPlayer" || s.phase === "guard") stopHunt(e, 4);
    return false;
  }
  if (s.phase === "warnPlayer" && s.playerId === (p.mpId ?? null)) {
    if (now < s.until) return true;
    s.phase = "guard";
  }
  if (s.phase === "guard" && s.playerId === (p.mpId ?? null)) {
    if (d < 2.5 && manager.canSeePlayer(e) && e.attackCd <= 0) {
      e.goal = null;
      e.yaw = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
      e.attackCd = 1.65;
      manager.ctx.hurtPlayer(8 * multiplier, "A lion defended its territory.", e);
    } else steerGrassland(manager, e, p.pos, 4.85, 1.75);
    return true;
  }
  if ((d < 3.2 || e.angry > 0) && manager.canSeePlayer(e)) {
    stopHunt(e, 8);
    s.playerId = p.mpId ?? null;
    s.phase = "warnPlayer";
    s.until = now + 0.85;
    e.yaw = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
    Sound.mob("lionroar", d);
    return true;
  }
  return false;
}

function lionThink(manager, e, d, multiplier, daylight, clearPath) {
  const s = e.wild, now = e.age, p = manager.ctx.player(), w = manager.world;
  if (guardPlayer(manager, e, p, d, multiplier)) return;
  if (s.prey && (!active(s.prey) || s.prey.inWater || distance(e.pos, s.prey.pos) > 21 || now >= s.huntUntil)) {
    stopHunt(e, active(s.prey) ? 7 : 19);
  }
  const prey = s.prey;
  if (prey) {
    const target = prey.pos, gap = distance(e.pos, target);
    if (gap < 2.55 && Math.abs(e.pos.y - target.y) < 1.5 && clearPath({ ...target, y: target.y + 0.65 })) {
      s.phase = "pounce";
      e.goal = e.path = null;
      e.yaw = Math.atan2(e.pos.x - target.x, e.pos.z - target.z);
      if (e.attackCd <= 0) {
        e.attackCd = 1.5;
        manager.damage(prey, 8, e);
        if (!active(prey)) stopHunt(e, 19);
      }
      return;
    }
    if (gap < 8 || prey.wild?.phase === "flee" || s.phase === "pounce") {
      s.phase = "chase";
      steerGrassland(manager, e, target, 7.45, 1.0);
      return;
    }
    s.phase = "stalk";
    const side = (s.role ?? 0) % 2 ? 1 : -1;
    const a = Math.atan2(e.pos.z - target.z, e.pos.x - target.x) + side * 0.84;
    const flank = { x: target.x + Math.cos(a) * 4.4, y: target.y, z: target.z + Math.sin(a) * 4.4 };
    const route = w.isLoaded(Math.floor(flank.x), Math.floor(flank.z)) &&
      clearPath({ ...flank, y: flank.y + 0.75 }) ? flank : target;
    steerGrassland(manager, e, route, 2.35, 0.8);
    return;
  }
  if (daylight > 0.77 && now % 26 > 12 && now % 26 < 18) {
    s.phase = "sleep";
    e.goal = e.path = null;
    return;
  }
  s.phase = "patrol";
  if ((!s.role || !manager.near(e.pos.x, e.pos.y, e.pos.z, 16, o =>
      o !== e && active(o) && inGroup(e, o) && (o.wild.role ?? 0) < s.role).length) && now >= (s.nextHunt ?? 0)) {
    s.nextHunt = now + 3.4;
    const found = manager.near(e.pos.x, e.pos.y, e.pos.z, 17, o =>
      preySpecies.has(o.sp) && active(o) && !o.inWater &&
      Math.abs(o.pos.y - e.pos.y) < 3 && clearPath({ ...o.pos, y: o.pos.y + 0.65 }))[0];
    if (found) {
      alertPride(manager, e, found);
      return;
    }
  }
  if (distance(e.pos, homePoint(e)) > 16) steerGrassland(manager, e, homePoint(e), 2.8, 3);
  else manager.wander(e);
}

export function thinkGrassland(manager, e, distanceToPlayer, multiplier, daylight, clearPath) {
  if (e.sp === LION) lionThink(manager, e, distanceToPlayer, multiplier, daylight, clearPath);
  else thinkGrazingHerd(manager, e, clearPath);
}
