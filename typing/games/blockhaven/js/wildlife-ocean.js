import { B, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

export const WHALE = "blue_whale", ORCA = "orca";
const fish = new Set(["minnow", "sunfin", "salmon"]);
const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function marineWaterRoom(world, def, x, y, z, yaw, surfacing = false) {
  const sx = Math.sin(yaw), sz = Math.cos(yaw);
  for (const [dx, dz] of [[0, 0], [sx * def.length / 2, sz * def.length / 2],
    [-sx * def.length / 2, -sz * def.length / 2], [sz * def.w / 2, -sx * def.w / 2],
    [-sz * def.w / 2, sx * def.w / 2]]) {
    const bx = Math.floor(x + dx), bz = Math.floor(z + dz);
    if (!world.isLoaded(bx, bz) || world.id(bx, Math.floor(y + 0.2), bz) !== B.WATER) return false;
    const top = world.id(bx, Math.floor(y + def.h - 0.1), bz);
    if (top !== B.WATER && (!surfacing || SOLID[top] || top === B.LAVA)) return false;
  }
  return true;
}

function waterBearing(manager, e, bearing, depth, speed) {
  const w = manager.world;
  for (const turn of [0, 0.65, -0.65, 1.4, -1.4, Math.PI]) {
    const yaw = bearing + turn, dx = -Math.sin(yaw), dz = -Math.cos(yaw);
    const x = e.pos.x + dx * 10, z = e.pos.z + dz * 10;
    const y = Math.min(depth, w.surfaceY(Math.floor(x), Math.floor(z)) + 1 - e.h);
    const midY = (e.pos.y + y) / 2;
    if (!marineWaterRoom(w, e.def, x, y, z, yaw) ||
        !marineWaterRoom(w, e.def, e.pos.x + dx * 5, midY, e.pos.z + dz * 5, yaw)) continue;
    e.goal = { x, y, z, speed };
    return true;
  }
  return false;
}

function whaleThink(manager, e, d) {
  const w = manager.world, s = e.wild, now = e.age;
  const surface = w.surfaceY(Math.floor(e.pos.x), Math.floor(e.pos.z)) + 1;
  const height = surface - e.h * 0.71;
  if (s.phase === "dive") {
    if (e.pos.y > surface - e.h - 0.5 && e.goal) return;
    s.phase = "migration";
    e.goal = null;
  }
  if (s.phase === "surface") {
    if (now >= s.until || !marineWaterRoom(w, e.def, e.pos.x, height, e.pos.z, e.yaw, true)) {
      s.breatheAt = now + 28;
      const y = surface - e.h - 1.5;
      if (marineWaterRoom(w, e.def, e.pos.x, y, e.pos.z, e.yaw)) {
        s.phase = "dive";
        e.goal = { x: e.pos.x, y, z: e.pos.z, speed: 2.5 };
        e.vel.y = Math.min(0, e.vel.y);
        return;
      }
      s.phase = "migration";
      e.goal = null;
    } else {
      const x = e.pos.x - Math.sin(e.yaw) * 1.3, z = e.pos.z - Math.cos(e.yaw) * 1.3;
      if (Math.abs(e.pos.y - height) < 0.65 && !s.spouted) {
        s.spouted = true;
        if (d < 48) {
          manager.ctx.particles(e.pos.x - Math.sin(e.yaw) * 2.9, surface + 0.2,
            e.pos.z - Math.cos(e.yaw) * 2.9, "whalespout");
          Sound.mob("whalebreath", d);
        }
      }
      e.goal = { x, y: height, z, speed: 2.4 };
      return;
    }
  }
  if (now >= (s.breatheAt ?? 7) && marineWaterRoom(w, e.def, e.pos.x, height, e.pos.z, e.yaw, true)) {
    s.phase = "surface";
    s.spouted = false;
    s.until = now + 8;
    e.goal = { x: e.pos.x, y: height, z: e.pos.z, speed: 2.7 };
    return;
  }
  if (now >= (s.callAt ?? 2) && d < 54) {
    Sound.mob("whalesong", d * 0.65);
    s.callAt = now + 18;
  }
  if (now >= (s.routeAt ?? 0)) {
    s.phase = "migration";
    s.routeAt = now + 4.5;
    const companion = s.podKey && manager.list.find(o => o.uid === s.podKey && !o.dead && !o.gone);
    const follow = companion && length(e.pos, companion.pos) > 9;
    const yaw = follow ? Math.atan2(e.pos.x - companion.pos.x, e.pos.z - companion.pos.z) :
      e.yaw + Math.sin(now * 0.16) * 0.38;
    waterBearing(manager, e, yaw, surface - 6.1, e.def.speed);
  }
}

function leadOrcaHunt(manager, e, clearPath) {
  const s = e.wild, now = e.age;
  if (s.prey || now < (s.scanAt ?? 0)) return;
  s.scanAt = now + 3;
  const w = manager.world;
  const prey = manager.near(e.pos.x, e.pos.y, e.pos.z, 17, o =>
    fish.has(o.sp) && o.inWater && o.hp > 0 && clearPath(o.pos) &&
    marineWaterRoom(w, e.def, o.pos.x, o.pos.y - 1, o.pos.z, e.yaw))[0];
  if (!prey) return;
  for (const member of manager.list) {
    if (member !== e && (!s.podKey || member.sp !== ORCA || member.wild.podKey !== s.podKey)) continue;
    if (member.gone || member.dead || !member.inWater || length(member.pos, e.pos) > 18) continue;
    const pod = member.wild;
    pod.prey = prey;
    pod.phase = "herd";
    pod.until = member.age + 2.15 + (pod.podIndex ?? 0) * 0.35;
    pod.huntEnd = member.age + 7;
  }
}

function orcaThink(manager, e, d, clearPath) {
  const w = manager.world, s = e.wild, now = e.age;
  const leader = s.podKey && manager.list.find(o => o.uid === s.podKey && !o.dead && !o.gone);
  if (!leader || leader === e) leadOrcaHunt(manager, e, clearPath);
  const prey = s.prey;
  if (prey && !prey.gone && !prey.dead && prey.inWater && now < s.huntEnd && length(e.pos, prey.pos) < 20) {
    const target = { ...prey.pos, y: prey.pos.y - 1 };
    if (marineWaterRoom(w, e.def, target.x, target.y, target.z, e.yaw) && clearPath(prey.pos)) {
      if (s.phase === "herd" && now < s.until) {
        const side = s.podIndex ? -1 : 1;
        const a = Math.atan2(e.pos.z - target.z, e.pos.x - target.x) + side * 0.8;
        const x = target.x + Math.cos(a) * 5.5, z = target.z + Math.sin(a) * 5.5;
        e.goal = marineWaterRoom(w, e.def, x, target.y, z, e.yaw) ?
          { x, y: target.y, z, speed: 4.2 } : { ...target, speed: 3.3 };
        return;
      }
      if (s.phase !== "rush") Sound.mob("orcacall", d);
      s.phase = "rush";
      if (length(e.pos, target) > 1.95) { e.goal = { ...target, speed: 7.7 }; return; }
      manager.damage(prey, 7, e);
    }
  }
  if (prey) {
    s.prey = null;
    s.scanAt = now + 12;
    e.goal = null;
  }
  s.phase = "pod";
  if (now >= (s.routeAt ?? 0)) {
    s.routeAt = now + 3;
    const follow = leader && leader !== e && length(e.pos, leader.pos) > 6;
    const yaw = follow ? Math.atan2(e.pos.x - leader.pos.x, e.pos.z - leader.pos.z) :
      e.yaw + Math.sin(now * 0.28) * 0.55;
    waterBearing(manager, e, yaw, follow ? leader.pos.y : e.pos.y, e.def.speed);
  }
}

export function thinkMarine(manager, e, d, clearPath) {
  if (!e.inWater) return;
  if (e.sp === WHALE) whaleThink(manager, e, d);
  else orcaThink(manager, e, d, clearPath);
}

export function spawnMarine(manager, species, def, x, surface, z, yaw, random) {
  const w = manager.world;
  const whale = species === WHALE;
  const depth = whale ? 7 : 6;
  const y = surface + 1 - depth;
  if (!marineWaterRoom(w, def, x, y, z, yaw) ||
      !marineWaterRoom(w, def, x + 4, y, z, yaw) ||
      !marineWaterRoom(w, def, x, y, z + 4, yaw)) return false;
  const head = manager.add(species, x, y, z, { yaw, ambient: true });
  head.wild.podKey = head.uid;
  if (!whale || random() < 0.28) {
    const side = random() < 0.5 ? 1 : -1;
    const gap = whale ? 8 : 5.5;
    const sx = x + side * Math.cos(yaw) * gap, sz = z - side * Math.sin(yaw) * gap;
    if (marineWaterRoom(w, def, sx, y, sz, yaw)) {
      const follower = manager.add(species, sx, y, sz, { yaw, ambient: true });
      follower.wild.podKey = head.uid;
      follower.wild.podIndex = 1;
      if (whale) follower.wild.breatheAt = 13;
    }
  }
  return true;
}
