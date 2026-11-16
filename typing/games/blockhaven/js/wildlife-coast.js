import { B, HEIGHT, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

export const SEAL = "seal", WALRUS = "walrus";
const shoreBlocks = new Set([B.SAND, B.GRAVEL, B.SNOW, B.STONE]);
const fish = new Set(["minnow", "sunfin", "salmon"]);
const coastDirections = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function isFamily(a, b) {
  return a.sp === b.sp && a.home.every((value, i) => value === b.home[i]);
}

function point(home) {
  return { x: home[0], y: home[1], z: home[2] };
}

function shoreRoom(w, p, def) {
  const x = Math.floor(p.x), z = Math.floor(p.z);
  const radius = def.w > 1.6 ? 1 : 0;
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    if (!w.isLoaded(x + dx, z + dz) || !SOLID[w.id(x + dx, p.y - 1, z + dz)]) return false;
    for (let y = p.y; y < p.y + def.h; y++) {
      const id = w.id(x + dx, y, z + dz);
      if (SOLID[id] || id === B.WATER || id === B.LAVA) return false;
    }
  }
  return true;
}

function coastAccess(w, home) {
  if (home.y < 3 || home.y + 2 >= HEIGHT) return null;
  const x = Math.floor(home.x), z = Math.floor(home.z), y = Math.floor(home.y) - 1;
  for (const [dx, dz] of coastDirections) {
    for (let step = 1; step <= 7; step++) {
      const bx = x + step * dx, bz = z + step * dz;
      if (!w.isLoaded(bx, bz) || SOLID[w.id(bx, y + 1, bz)] || SOLID[w.id(bx, y + 2, bz)]) break;
      if (w.id(bx, y, bz) === B.WATER && w.id(bx, y - 1, bz) === B.WATER) {
        return { x: bx + dx + 0.5, y: y - 0.65, z: bz + dz + 0.5, dx, dz };
      }
    }
  }
  return null;
}

export function coastalSpawnSite(w, def, x, surface, z) {
  if (!shoreBlocks.has(w.id(x, surface, z))) return null;
  const home = { x: x + 0.5, y: surface + 1, z: z + 0.5 };
  if (!shoreRoom(w, home, def)) return null;
  const water = coastAccess(w, home);
  if (!water || !w.isLoaded(Math.floor(water.x), Math.floor(water.z)) ||
      w.id(Math.floor(water.x), Math.floor(water.y), Math.floor(water.z)) !== B.WATER) return null;
  return { home, water };
}

export function spawnCoastalColony(manager, species, def, site, slots, random) {
  const { home, water } = site;
  const yaw = Math.atan2(-water.dx, -water.dz), anchor = [home.x, home.y, home.z];
  const sideX = water.dz, sideZ = -water.dx;
  const spacing = species === WALRUS ? 3 : 1.8;
  const restingPlaces = [];
  const offsets = [[0, 0], [spacing, 0], [-spacing, 0], [spacing, 2],
    [-spacing, 2], [0, spacing], [spacing + 1.5, 0], [-spacing - 1.5, 0]];
  for (const [lateral, inland] of offsets) {
    if (restingPlaces.length >= slots) break;
    const rest = { x: home.x + sideX * lateral - water.dx * inland,
      y: home.y, z: home.z + sideZ * lateral - water.dz * inland };
    if (!shoreRoom(manager.world, rest, def) || restingPlaces.some(other => distance(rest, other) < spacing)) continue;
    const i = restingPlaces.length;
    restingPlaces.push(rest);
    const baby = species === WALRUS && i > 0 && random() < 0.38;
    const animal = manager.add(species, rest.x, rest.y, rest.z,
      { home: anchor, yaw, baby, ...(baby ? { growT: 1500 } : {}), ambient: true });
    animal.wild.rest = rest;
    animal.wild.water = water;
    animal.wild.nextTrip = 8 + i * 4 + random() * 5;
  }
}

function shoreCycle(manager, e, clearPath) {
  const s = e.wild, w = manager.world, now = e.age, rest = s.rest || point(e.home);
  if (now >= (s.accessCheck ?? 0)) {
    s.accessCheck = now + 3;
    s.water = coastAccess(w, point(e.home));
  }
  if (!e.inWater) {
    if (s.phase === "haulOut") {
      if (distance(e.pos, rest) > 0.7) { e.goal = { ...rest, speed: 1.8 }; return; }
      s.nextTrip = now + 13;
      s.ashoreAt = null;
      s.prey = null;
    }
    s.nextTrip ??= now + 7;
    if (s.water && now >= s.nextTrip) {
      s.phase = e.sp === SEAL && shoreBlocks.has(w.id(Math.floor(e.pos.x), Math.floor(e.pos.y - 0.1), Math.floor(e.pos.z))) ?
        "slide" : "enterWater";
      e.goal = { ...s.water, speed: s.phase === "slide" ? 3.85 : 1.75 };
      return;
    }
    s.phase = "rest";
    e.goal = null;
    if (e.sp === SEAL && manager.dist(e) < 22 && now >= (s.callAt ?? 4)) {
      Sound.mob("sealcall", manager.dist(e));
      s.callAt = now + 17 + (s.nextTrip % 7);
    }
    return;
  }
  if (s.phase === "haulOut" || now >= (s.ashoreAt ?? Infinity)) {
    s.phase = "haulOut";
    if (shoreRoom(w, rest, e.def)) {
      e.goal = { ...rest, speed: e.sp === SEAL ? 3.2 : 2.7 };
      return;
    }
    s.ashoreAt = now + 8;
  }
  if (s.phase === "slide" || s.phase === "enterWater" || !s.ashoreAt) {
    s.ashoreAt = now + (e.sp === SEAL ? 18 : 13);
    s.phase = "swim";
    e.goal = null;
    Sound.mob("coastsplash", manager.dist(e));
  }
  const prey = s.prey;
  if (prey && !prey.dead && !prey.gone && prey.inWater &&
      distance(e.pos, prey.pos) < 10 && clearPath(prey.pos)) {
    if (distance(e.pos, prey.pos) > 1.45) {
      s.phase = "dive";
      e.goal = { ...prey.pos, speed: 4.1 };
      return;
    }
    manager.damage(prey, 5, e);
  }
  if (prey) {
    s.prey = null;
    s.fishAt = now + 5;
    e.goal = null;
  }
  if (e.sp === SEAL && now >= (s.fishAt ?? 0)) {
    s.fishAt = now + 2;
    s.prey = manager.near(e.pos.x, e.pos.y, e.pos.z, 8, other =>
      fish.has(other.sp) && other.inWater && clearPath(other.pos))[0] || null;
    if (s.prey) {
      s.phase = "dive";
      e.goal = { ...s.prey.pos, speed: 4.1 };
      return;
    }
  }
  s.phase = "swim";
  if (!e.goal && now >= (s.routeAt ?? 0)) {
    s.routeAt = now + 1.2;
    manager.waterGoal(e, 4.5, e.def.speed);
  }
}

export function alertWalrusColony(manager, hurt) {
  if (hurt.sp !== WALRUS) return;
  const p = manager.ctx.player();
  const members = manager.near(hurt.pos.x, hurt.pos.y, hurt.pos.z, 12, other => isFamily(hurt, other));
  for (const e of members) {
    e.wild.defendUntil = Math.max(e.wild.defendUntil ?? 0, e.age + 14);
    e.wild.playerId = p.mpId ?? null;
  }
}

function defendColony(manager, e, multiplier) {
  const s = e.wild, now = e.age, p = manager.ctx.player();
  const targetable = manager.targetable() && s.playerId === (p.mpId ?? null);
  const playerDistance = distance(e.pos, p.pos);
  if (s.phase === "defend") {
    const ahead = (p.pos.x - e.pos.x) * s.direction.x + (p.pos.z - e.pos.z) * s.direction.z;
    if (targetable && playerDistance < 2.9 && ahead >= -0.25 && manager.canSeePlayer(e)) {
      manager.ctx.hurtPlayer(8 * multiplier, "A walrus drove you away from its colony.", e);
      manager.ctx.push(s.direction.x * 5.5, 2.1, s.direction.z * 5.5);
      s.until = now;
    }
    if (!targetable || now >= s.until || !e.goal) {
      s.phase = "recover";
      s.until = now + 3;
      e.goal = null;
    }
    return true;
  }
  if (s.phase === "warning") {
    if (targetable && now < s.until) return true;
    if (targetable && playerDistance < 7 && manager.canSeePlayer(e)) {
      const { x, z } = s.direction;
      e.goal = { x: e.pos.x + x * 5.4, y: p.pos.y, z: e.pos.z + z * 5.4, speed: 5.4 };
      s.phase = "defend";
      s.until = now + 1.05;
      return true;
    }
    s.phase = "recover";
    s.until = now + 3;
  }
  if (s.phase === "recover" && now < s.until) return true;
  if (!manager.targetable() || distance(e.pos, point(e.home)) >= 13 || playerDistance >= 6.5 ||
      now < (s.guardCheck ?? 0)) return false;
  s.guardCheck = now + 0.5;
  const protectingYoung = manager.near(p.pos.x, p.pos.y, p.pos.z, 3.4, other => other.baby && isFamily(e, other)).length > 0;
  if ((!protectingYoung && (!targetable || now >= (s.defendUntil ?? 0))) || !manager.canSeePlayer(e)) return false;
  const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, span = Math.hypot(dx, dz) || 1;
  s.direction = { x: dx / span, z: dz / span };
  s.phase = "warning";
  s.playerId = p.mpId ?? null;
  s.until = now + 0.85;
  e.yaw = Math.atan2(-dx, -dz);
  e.goal = e.path = null;
  Sound.mob("walruswarn", playerDistance);
  return true;
}

export function thinkCoastWildlife(manager, e, multiplier, clearPath) {
  if (e.sp === WALRUS) {
    const s = e.wild, p = manager.ctx.player();
    if (e.baby && e.age < (s.defendUntil ?? 0) && s.playerId === (p.mpId ?? null)) {
      s.phase = "retreat";
      const home = s.rest || point(e.home);
      e.goal = { ...home, speed: 2.3 };
      return;
    }
    if (!e.baby && defendColony(manager, e, multiplier)) return;
  }
  shoreCycle(manager, e, clearPath);
}
