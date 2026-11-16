import { B, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

export const OCTOPUS = "octopus", MANTA = "manta_ray";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const predators = new Set(["great_white_shark", "orca", "crocodile"]);
const shelves = new Set([B.CLAY, B.STONE, B.SAND, B.GRAVEL]);
const water = (w, x, y, z) => w.id(Math.floor(x), Math.floor(y), Math.floor(z)) === B.WATER;

export function reefWaterFit(w, def, x, y, z, yaw) {
  const bx = Math.floor(x), bz = Math.floor(z);
  if (!w.isLoaded(bx, bz) || !water(w, x, y + 0.05, z) || !water(w, x, y + def.h - 0.04, z)) return false;
  if (!def.finSpan) return true;
  const dx = Math.cos(yaw) * def.finSpan / 2, dz = -Math.sin(yaw) * def.finSpan / 2;
  return water(w, x + dx, y + def.h / 2, z + dz) && water(w, x - dx, y + def.h / 2, z - dz);
}

// Floor position just above the walkable substrate in a continuous water column.
function seabed(w, x, y, z, depth) {
  const bx = Math.floor(x), bz = Math.floor(z);
  if (!w.isLoaded(bx, bz)) return null;
  for (let at = Math.floor(y); at >= Math.max(1, Math.floor(y) - depth); at--) {
    const id = w.id(bx, at, bz);
    if (id === B.WATER) continue;
    return SOLID[id] && water(w, x, at + 1, z) ? { x, y: at + 1.03, z, id } : null;
  }
  return null;
}

function camouflage(block) {
  if (block === B.SAND || block === B.SANDSTONE) return 1;
  if (block === B.STONE || block === B.GRAVEL || block === B.COBBLE) return 2;
  if (block === B.CLAY) return 3;
  return 0;
}

function releaseInk(manager, e, threat) {
  const s = e.wild, now = e.age;
  s.phase = "escape";
  s.inkUntil = now + 3.3;
  s.nextInk = now + 13;
  e.goal = null;
  manager.ctx.particles(e.pos.x, e.pos.y + 0.7, e.pos.z, "ink");
  Sound.mob("octopusink", manager.dist(e));
  const dx = e.pos.x - threat.x, dz = e.pos.z - threat.z, len = Math.hypot(dx, dz);
  const away = len > 0.1 ? { x: dx / len, z: dz / len } : null;
  manager.waterGoal(e, 5.4, 4.7, away);
}

function octopusThink(manager, e, clearPath) {
  const s = e.wild, w = manager.world, now = e.age;
  if (now >= (s.nextInk ?? 0) && (e.hurtT > 0 || now >= (s.threatCheck ?? 0))) {
    s.threatCheck = now + 0.9;
    const threat = manager.near(e.pos.x, e.pos.y, e.pos.z, 5.5, other =>
      predators.has(other.sp) && other.inWater && clearPath(other.pos))[0];
    if (threat || e.hurtT > 0) {
      releaseInk(manager, e, threat?.pos || manager.ctx.player().pos);
      return;
    }
  }
  if (s.phase === "escape" && now < s.inkUntil) {
    if (!e.goal) manager.waterGoal(e, 3.6, 4);
    return;
  }
  const floor = seabed(w, e.pos.x, e.pos.y + 0.22, e.pos.z, 8);
  if (!floor) {
    e.goal ||= { ...e.pos, y: e.pos.y - 2, speed: 1.25 };
    s.phase = "crawl";
    return;
  }
  const grounded = e.pos.y < floor.y + 0.38;
  s.skin = camouflage(floor.id);
  if (grounded && (!e.goal || s.phase === "escape") && now < (s.routeAt ?? 0)) {
    s.phase = "camouflage";
    return;
  }
  if (now < (s.routeAt ?? 0) && e.goal) return;
  s.routeAt = now + 3.5;
  s.phase = grounded ? "camouflage" : "crawl";
  e.goal = grounded ? null : { ...floor, speed: 1.35 };
  if (!grounded) return;
  const bearing = e.yaw + Math.sin(now * 0.8) * 1.3;
  for (const turn of [0, -0.85, 0.85, Math.PI]) {
    const a = bearing + turn;
    const x = e.pos.x - Math.sin(a) * 3.8, z = e.pos.z - Math.cos(a) * 3.8;
    const next = seabed(w, x, e.pos.y + 1.1, z, 4);
    if (!next || Math.abs(next.y - floor.y) > 1.3 || !reefWaterFit(w, e.def, x, next.y, z, a) ||
        !clearPath({ x, y: next.y + 0.75, z })) continue;
    e.goal = { ...next, speed: 1.35 };
    s.phase = "crawl";
    return;
  }
}

function mantaWaypoint(w, e, bearing, preferShelf) {
  const start = e.pos, length = preferShelf ? 9 : 7;
  for (const turn of [0, 0.6, -0.6, 1.2, -1.2, Math.PI]) {
    const yaw = bearing + turn, dx = -Math.sin(yaw), dz = -Math.cos(yaw);
    const x = start.x + dx * length, z = start.z + dz * length;
    const floor = seabed(w, x, start.y + 1.15, z, 12);
    if (!floor || (preferShelf && !shelves.has(floor.id))) continue;
    const y = preferShelf ? floor.y + 1.15 :
      Math.max(start.y - 0.5 + Math.sin(e.age * 0.6), floor.y + 1.4);
    if (!reefWaterFit(w, e.def, x, y, z, yaw) ||
        !reefWaterFit(w, e.def, start.x + dx * length / 2, (start.y + y) / 2, start.z + dz * length / 2, yaw)) continue;
    return { x, y, z };
  }
  return null;
}

function mantaThink(manager, e, clearPath) {
  const s = e.wild, w = manager.world, now = e.age, p = manager.ctx.player();
  if (s.phase === "guide") {
    if (p.inWater && !p.inLava && now < s.guideUntil && distance(e.pos, p.pos) < 14 &&
        s.destination && distance(e.pos, s.destination) > 0.75) {
      e.goal = { ...s.destination, speed: distance(e.pos, p.pos) > 8 ? 1.4 : 2.75 };
      return;
    }
    s.phase = "glide";
    s.nextGuide = now + 20;
    s.destination = null;
    e.goal = null;
  }
  if (now < (s.routeAt ?? 0)) return;
  s.routeAt = now + 3.5;
  const bearing = e.yaw + Math.sin(now * 0.36) * 0.7;
  if (p.inWater && !p.inLava && !manager.ctx.spectator?.() && distance(e.pos, p.pos) < 6 &&
      now >= (s.nextGuide ?? 0) && clearPath({ ...p.pos, y: p.pos.y + 0.5 })) {
    const destination = mantaWaypoint(w, e, bearing, true);
    s.nextGuide = now + 6;
    if (destination) {
      s.destination = destination;
      s.phase = "guide";
      s.guideUntil = now + 8;
      e.goal = { ...destination, speed: 2.6 };
      Sound.mob("rayglide", manager.dist(e));
      return;
    }
  }
  s.phase = "glide";
  const target = mantaWaypoint(w, e, bearing, false);
  if (target) e.goal = { ...target, speed: e.def.speed };
}

export function thinkReefWildlife(manager, e, clearPath) {
  if (!e.inWater) return;
  if (e.sp === OCTOPUS) octopusThink(manager, e, clearPath);
  else mantaThink(manager, e, clearPath);
}

export function reefSpawnSite(w, def, x, surface, z, yaw) {
  const floor = seabed(w, x, surface, z, 11);
  if (!floor || !shelves.has(floor.id)) return null;
  const y = floor.y + (def.finSpan ? 1.25 : 0.08);
  if (surface + 1 - floor.y < (def.finSpan ? 4 : 2.1)) return null;
  if (!reefWaterFit(w, def, x, y, z, yaw)) return null;
  return { x, y, z, yaw };
}
