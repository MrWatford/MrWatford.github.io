import { B, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

export const FLAMINGO = "flamingo";
const sediments = new Set([B.SAND, B.GRAVEL, B.CLAY, B.DIRT, B.GRASS, B.STONE]);
const offsets = [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2], [3, 2], [-3, 2], [3, -2], [-3, -2], [4, 0], [0, 4]];
const predators = new Set(["crocodile", "tiger", "lion", "grizzly_bear"]);

export function flamingoShallow(w, x, y, z) {
  return w.isLoaded(x, z) && w.id(x, y, z) === B.WATER && sediments.has(w.id(x, y - 1, z)) &&
    ![1, 2, 3].some(dy => {
      const id = w.id(x, y + dy, z);
      return SOLID[id] || id === B.WATER || id === B.LAVA;
    });
}

export function flamingoRoom(w, x, y, z) {
  if (!flamingoShallow(w, Math.floor(x), y, Math.floor(z))) return false;
  // The radius covers the bird's collision box throughout a turn.
  const radius = Math.hypot(0.84, 1.6) / 2;
  for (let bz = Math.floor(z - radius); bz <= Math.floor(z + radius); bz++) {
    for (let bx = Math.floor(x - radius); bx <= Math.floor(x + radius); bx++) {
      if (!w.isLoaded(bx, bz)) return false;
      for (let dy = 0; dy <= 3; dy++) {
        const id = w.id(bx, y + dy, bz);
        if (SOLID[id] || id === B.LAVA) return false;
      }
    }
  }
  return true;
}

export function spawnFlamingoFlock(manager, x, y, z, yaw, slots) {
  const w = manager.world, home = [x + 0.5, y, z + 0.5], sites = [];
  for (const [dx, dz] of offsets) {
    if (sites.length >= slots) break;
    if (flamingoRoom(w, x + dx + 0.5, y, z + dz + 0.5)) sites.push([x + dx + 0.5, y, z + dz + 0.5]);
  }
  if (sites.length < 2) return;
  for (const [role, site] of sites.entries()) {
    manager.add(FLAMINGO, ...site, { home, yaw, ambient: true }).wild.role = role;
  }
}

function sameFlock(a, b) {
  return b.sp === FLAMINGO && a.home.every((v, i) => v === b.home[i]);
}

function wadeToward(w, e, target, speed) {
  const dx = target.x - e.pos.x, dz = target.z - e.pos.z;
  const length = Math.hypot(dx, dz), steps = Math.ceil(length * 1.5);
  for (let i = 1; i <= steps; i++) {
    const x = e.pos.x + dx * i / steps, z = e.pos.z + dz * i / steps;
    if (!flamingoRoom(w, x, target.y, z)) return false;
  }
  if (length < 0.4) return false;
  e.goal = { ...target, speed };
  return true;
}

export function thinkFlamingo(manager, e, d, clearPath) {
  const s = e.wild, w = manager.world, now = e.age;
  const x = Math.floor(e.pos.x), y = Math.floor(e.pos.y + 0.15), z = Math.floor(e.pos.z);
  const shallow = flamingoShallow(w, x, y, z);
  const home = { x: e.home[0], y: e.home[1], z: e.home[2] };
  if (!shallow) {
    s.phase = "wade";
    if (Math.hypot(e.pos.x - home.x, e.pos.z - home.z) > 0.55 &&
        flamingoShallow(w, Math.floor(home.x), Math.floor(home.y), Math.floor(home.z))) {
      e.goal = { ...home, speed: 2.1 };
    } else manager.wander(e);
    return;
  }
  if (now >= (s.scanAt ?? 0)) {
    s.scanAt = now + 1.1;
    const threat = manager.near(e.pos.x, e.pos.y, e.pos.z, 8, other => predators.has(other.sp) &&
      clearPath({ ...other.pos, y: other.pos.y + 0.55 }))[0];
    if (threat && now >= (s.alertUntil ?? 0)) {
      const alarm = { ...threat.pos };
      for (const bird of [e, ...manager.near(e.pos.x, e.pos.y, e.pos.z, 12,
        other => other !== e && sameFlock(e, other))]) {
        bird.wild.alertUntil = bird.age + 5;
        bird.wild.alertFrom = alarm;
        bird.wild.routeAt = 0;
      }
      if (d < 24) Sound.mob("flamingocall", d);
    }
  }
  if (now < (s.alertUntil ?? 0)) {
    s.phase = "startled";
    if (now < (s.routeAt ?? 0)) return;
    s.routeAt = now + 0.85;
    e.goal = null;
    const away = Math.atan2(e.pos.z - s.alertFrom.z, e.pos.x - s.alertFrom.x);
    for (const delta of [0, 0.7, -0.7, 1.3, -1.3]) {
      const angle = away + delta;
      if (wadeToward(w, e, { x: e.pos.x + Math.cos(angle) * 3, y, z: e.pos.z + Math.sin(angle) * 3 }, 4.1)) break;
    }
    return;
  }

  const cycle = (now + (s.role ?? 0) * 1.2) % 23;
  if (cycle >= 5) {
    const rest = cycle >= 13;
    s.phase = rest ? "oneLeg" : "filterFeed";
    e.goal = e.path = null;
    if (!rest && now >= (s.rippleAt ?? 0) && d < 18) {
      s.rippleAt = now + 2.1;
      const fx = e.pos.x - Math.sin(e.yaw) * 0.8, fz = e.pos.z - Math.cos(e.yaw) * 0.8;
      if (w.id(Math.floor(fx), y, Math.floor(fz)) === B.WATER) manager.ctx.particles(fx, y + 0.88, fz, "splash");
    }
    return;
  }
  s.phase = "wade";
  if (now < (s.routeAt ?? 0)) return;
  s.routeAt = now + 1.1;
  const leader = manager.near(e.pos.x, e.pos.y, e.pos.z, 12, other =>
    other !== e && sameFlock(e, other) && other.wild.role === 0)[0];
  if (leader && Math.hypot(leader.pos.x - e.pos.x, leader.pos.z - e.pos.z) > 3) {
    const dx = leader.pos.x - e.pos.x, dz = leader.pos.z - e.pos.z, len = Math.hypot(dx, dz);
    if (wadeToward(w, e, { x: e.pos.x + dx * 2 / len, y, z: e.pos.z + dz * 2 / len }, 1.75)) return;
  }
  const angle = (s.role ?? 0) * 1.2 + now * 0.25;
  for (const delta of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
    const x = home.x + Math.cos(angle + delta) * 3, z = home.z + Math.sin(angle + delta) * 3;
    if (Math.hypot(x - e.pos.x, z - e.pos.z) < 7 && wadeToward(w, e, { x, y, z }, 1.75)) return;
  }
  e.goal = null;
}
