import { B, I, SOLID, HEIGHT } from "./blocks.js";
import { Sound } from "./audio.js";

export const FALCON = "falcon";
const preyTypes = new Set(["rabbit", "chicken"]);
const food = new Set([I.RAW_RABBIT, I.RAW_CHICKEN]);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const alive = e => e && !e.dead && !e.gone && e.hp > 0;
const clampY = y => Math.max(2, Math.min(HEIGHT - 2, y));
const habitat = {
  plains: "open plains", forest: "forest", birch: "birch woods", peak: "a high peak",
  mountain: "mountain terrain", desert: "dry terrain", ocean: "open water", beach: "a shoreline"
};

function airPoint(w, x, y, z) {
  const bx = Math.floor(x), bz = Math.floor(z);
  if (!w.isLoaded(bx, bz)) return null;
  const fy = clampY(Math.max(y, w.surfaceY(bx, bz) + 3));
  if ([fy, fy + 0.8].some(by => SOLID[w.id(bx, Math.floor(by), bz)])) return null;
  return { x, y: fy, z };
}

function lookout(w, x, z) {
  const bx = Math.floor(x), bz = Math.floor(z);
  if (!w.isLoaded(bx, bz)) return null;
  const y = w.surfaceY(bx, bz) + 1, base = w.id(bx, y - 1, bz);
  if (y >= HEIGHT - 2 || !SOLID[base] || base === B.FIRE || base === B.CACTUS) return null;
  const floor = w.id(bx, y, bz);
  if (SOLID[floor] || floor === B.WATER || floor === B.LAVA || floor === B.FIRE) return null;
  return { x: bx + 0.5, y, z: bz + 0.5 };
}

function pickScout(w, p, e) {
  for (const range of [20, 16, 12]) {
    const x = p.pos.x - Math.sin(p.yaw) * range, z = p.pos.z - Math.cos(p.yaw) * range;
    const site = airPoint(w, x, Math.max(p.pos.y + 6, e.pos.y + 1), z);
    if (site) return site;
  }
  return null;
}

export function interactFalcon(manager, e, slot) {
  if (e.sp !== FALCON || e.baby) return false;
  const ctx = manager.ctx, p = ctx.player(), s = e.wild;
  if (!e.tame) {
    if (!food.has(slot?.id)) {
      ctx.toast("Offer raw rabbit or raw chicken when the falcon lands.");
      return true;
    }
    if (s.phase !== "lookout" || distance(p.pos, e.pos) > 4) {
      ctx.toast("Wait until the falcon is resting on a lookout.");
      return true;
    }
    if (e.age < (s.feedAt ?? 0)) return true;
    s.feedAt = e.age + 1.3;
    ctx.consume();
    e.temper = Math.min(100, e.temper + 34);
    ctx.particles(e.pos.x, e.pos.y + 0.65, e.pos.z, "heart");
    if (e.temper === 100) {
      e.tame = e.persist = true;
      e.sitting = false;
      e.home = [e.pos.x, e.pos.y, e.pos.z];
      s.prey = null;
      ctx.toast("The falcon trusts you. Crouch and interact to send it scouting ahead.", "good");
      ctx.adv?.("tame", e.sp);
    } else ctx.toast("The falcon accepted the food. Give it a moment before offering more.");
    return true;
  }
  if (ctx.crouching()) {
    if (s.scout || e.age < (s.scoutAt ?? 0)) return true;
    const target = pickScout(manager.world, p, e);
    if (!target) { ctx.toast("The falcon needs open sky and loaded terrain ahead to scout."); return true; }
    e.sitting = false;
    s.scout = { target, playerId: p.mpId ?? null, deadline: e.age + 20 };
    s.phase = "scoutOut";
    e.goal = { ...target, speed: 7.2 };
    Sound.mob("falconcall", 2);
    return true;
  }
  if (s.scout) { ctx.toast("The falcon is scouting ahead."); return true; }
  e.sitting = !e.sitting;
  if (e.sitting) e.home = [p.pos.x, p.pos.y, p.pos.z];
  s.perch = null;
  e.goal = null;
  ctx.toast(e.sitting ? "The falcon will wait here." : "The falcon is following you.");
  return true;
}

function describeScout(w, target) {
  const x = Math.floor(target.x), z = Math.floor(target.z), y = w.surfaceY(x, z);
  const type = w.id(x, y, z) === B.WATER ? "water" : habitat[w.gen.column(x, z).biome] ?? "open ground";
  return `Falcon spotted ${type} ahead near ${x}, ${z}.`;
}

function scoutWaypoint(w, e, target, speed) {
  const dx = target.x - e.pos.x, dz = target.z - e.pos.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 1.4) return { ...target, speed };
  let height = target.y;
  for (let step = 1; step <= 4; step++) {
    const x = Math.floor(e.pos.x + dx * step / 4), z = Math.floor(e.pos.z + dz * step / 4);
    if (!w.isLoaded(x, z)) return null;
    height = Math.max(height, w.surfaceY(x, z) + 2.8);
  }
  height = clampY(height);
  if (height > e.pos.y + 0.35) {
    return { x: e.pos.x, y: height, z: e.pos.z, speed };
  }
  return { ...target, y: height, speed };
}

function scoutThink(manager, e, p) {
  const s = e.wild, now = e.age, w = manager.world, mission = s.scout;
  if (now >= mission.deadline || (p.mpId ?? null) !== mission.playerId || !manager.ctx.alive()) {
    s.scout = null;
    s.scoutAt = now + 4;
    return false;
  }
  if (s.phase === "scoutOut") {
    if (!w.isLoaded(Math.floor(mission.target.x), Math.floor(mission.target.z))) {
      s.scout = null;
      s.scoutAt = now + 4;
      return false;
    }
    if (distance(e.pos, mission.target) > 1.6) {
      e.goal = scoutWaypoint(w, e, mission.target, 7.2);
      return true;
    }
    mission.report = describeScout(w, mission.target);
    s.phase = "scoutReturn";
  }
  const target = airPoint(w, p.pos.x, p.pos.y + 2.6, p.pos.z);
  if (!target || distance(e.pos, target) > 2.3) {
    e.goal = target && scoutWaypoint(w, e, target, 7);
    return true;
  }
  manager.ctx.toast(mission.report, "good");
  s.scout = null;
  s.scoutAt = now + 12;
  return false;
}

function land(manager, e, perch) {
  if (!perch) return false;
  e.wild.phase = distance(e.pos, perch) < 0.34 ? "lookout" : "landFalcon";
  e.goal = { ...perch, speed: 3.1 };
  return true;
}

export function thinkFalcon(manager, e, d, clearPath) {
  const s = e.wild, w = manager.world, now = e.age, p = manager.ctx.player();
  if (e.tame) {
    if (s.scout && scoutThink(manager, e, p)) return;
    if (e.sitting && land(manager, e, lookout(w, e.home[0], e.home[2]))) return;
    const target = airPoint(w, p.pos.x - Math.cos(p.yaw) * 2.4, p.pos.y + 3.65, p.pos.z + Math.sin(p.yaw) * 2.4);
    s.phase = "falconFollow";
    e.goal = target && { ...target, speed: 6.4 };
    return;
  }
  if (s.phase === "dive") {
    const prey = s.prey;
    if (alive(prey) && !prey.inWater && now < s.until) {
      const target = { x: prey.pos.x, y: prey.pos.y + 0.42, z: prey.pos.z };
      if (clearPath(target)) {
        if (distance(e.pos, target) >= 1.17) { e.goal = { ...target, speed: 10.8 }; return; }
        manager.damage(prey, 6, e);
      }
    }
    s.prey = null;
    s.phase = "climb";
    s.huntAt = now + 10;
    e.goal = null;
  }
  const [hx, hy, hz] = e.home;
  if (s.phase === "landFalcon" || s.phase === "lookout" || now >= (s.restAt ?? 18)) {
    if (s.perchAt == null) {
      s.perchAt = now + 18;
      s.perch = lookout(w, hx, hz);
    }
    const valid = s.perch && lookout(w, s.perch.x, s.perch.z)?.y === s.perch.y;
    if (now < s.perchAt && valid && land(manager, e, s.perch)) return;
    s.restAt = now + 26;
    s.perchAt = null;
    s.perch = null;
    s.phase = "falconPatrol";
    e.goal = null;
  }
  if (now >= (s.huntAt ?? 0)) {
    s.huntAt = now + 1.65;
    const prey = manager.near(e.pos.x, e.pos.y, e.pos.z, 18, other =>
      preyTypes.has(other.sp) && !other.inWater && e.pos.y > other.pos.y + 2 &&
      clearPath({ ...other.pos, y: other.pos.y + 0.42 }))[0];
    if (prey) {
      s.phase = "dive";
      s.prey = prey;
      s.until = now + 4.6;
      e.goal = { x: prey.pos.x, y: prey.pos.y + 0.42, z: prey.pos.z, speed: 10.8 };
      if (d < 25) Sound.mob("falconcall", d);
      return;
    }
  }
  if (e.goal && now < (s.routeAt ?? 0)) return;
  const angle = Math.atan2(e.pos.z - hz, e.pos.x - hx) + 0.86;
  const point = airPoint(w, hx + Math.cos(angle) * 10, hy + 1.4, hz + Math.sin(angle) * 10);
  e.goal = (point || airPoint(w, hx, hy + 1.4, hz));
  if (e.goal) e.goal.speed = 6.3;
  s.phase = "falconPatrol";
  s.routeAt = now + 1.8;
}
