import { B, I } from "./blocks.js";
import { Sound } from "./audio.js";
import { steerGrassland, thinkGrazingHerd } from "./wildlife-grassland.js";

export const GIRAFFE = "giraffe", RHINO = "rhinoceros", OSTRICH = "ostrich";
const predators = new Set(["lion", "tiger", "grizzly_bear"]);
const banks = new Set([B.GRASS, B.DIRT, B.CLAY]);
const leaves = new Set([B.LEAVES, B.BIRCH_LEAVES]);

export function rhinoProvoked(manager, e, attacker) {
  if (e.sp !== RHINO) return;
  if (attacker === "player") {
    e.wild.provokedBy = { player: true, id: manager.ctx.player().mpId ?? null };
  } else if (attacker?.pos && (attacker.def?.hostile || predators.has(attacker.sp)) && !attacker.def?.boss) {
    e.wild.provokedBy = { mob: attacker };
  } else return;
  e.wild.defendUntil = e.age + 12;
}

function browseAt(w, e) {
  const x = Math.floor(e.pos.x), y = Math.floor(e.pos.y), z = Math.floor(e.pos.z);
  for (let dy = 5; dy >= 3; dy--) {
    for (const [dx, dz] of [[0, 2], [2, 0], [0, -2], [-2, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      if (w.isLoaded(x + dx, z + dz) && leaves.has(w.id(x + dx, y + dy, z + dz))) {
        return { x: x + dx + 0.5, z: z + dz + 0.5 };
      }
    }
  }
  return null;
}

function kickPredator(manager, e, clearPath, damage) {
  const s = e.wild;
  if (s.phase === "flee" && e.age >= (s.kickAt ?? 0)) {
    const close = manager.near(e.pos.x, e.pos.y, e.pos.z, 2.55, other =>
      predators.has(other.sp) && !other.dead && !other.gone &&
      clearPath({ ...other.pos, y: other.pos.y + 0.75 }))[0];
    if (close && Math.abs(close.pos.y - e.pos.y) < 1.2) {
      const dx = close.pos.x - e.pos.x, dz = close.pos.z - e.pos.z;
      const length = Math.hypot(dx, dz) || 1;
      if (manager.damage(close, damage, e, { x: dx / length, z: dz / length })) {
        s.kickAt = e.age + 6;
        s.kickPoseUntil = e.age + 0.42;
      }
    }
  }
}

function thinkGiraffe(manager, e, clearPath) {
  const s = e.wild;
  thinkGrazingHerd(manager, e, clearPath);
  kickPredator(manager, e, clearPath, 6);
  if (s.phase !== "graze") return;
  if (e.age >= (s.browseAt ?? 0)) {
    s.browseAt = e.age + 0.8;
    s.foliage = browseAt(manager.world, e);
    if (s.foliage) Sound.mob("giraffebrowse", manager.dist(e));
  }
  if (s.foliage) {
    s.phase = "treetop";
    e.yaw = Math.atan2(e.pos.x - s.foliage.x, e.pos.z - s.foliage.z);
  }
}

function rhinoTarget(manager, source) {
  if (!source) return null;
  if (source.player) {
    const player = manager.ctx.player();
    return manager.targetable() && (player.mpId ?? null) === source.id ? player : null;
  }
  const mob = source.mob;
  return mob && !mob.dead && !mob.gone && mob.hp > 0 ? mob : null;
}

function atWallowBank(w, e) {
  const x = Math.floor(e.pos.x), y = Math.floor(e.pos.y + 0.1), z = Math.floor(e.pos.z);
  if (!banks.has(w.id(x, y - 1, z))) return false;
  return [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dz]) =>
    w.isLoaded(x + dx, z + dz) && w.id(x + dx, y - 1, z + dz) === B.WATER &&
    banks.has(w.id(x + dx, y - 2, z + dz)));
}

function thinkRhino(manager, e, multiplier, clearPath) {
  const s = e.wild, now = e.age;
  const active = s.phase === "rhinoWarn" || s.phase === "rhinoCharge";
  const source = active ? s.chargeSource : now < (s.defendUntil ?? 0) ? s.provokedBy : null;
  const target = rhinoTarget(manager, source);
  const dx = target ? target.pos.x - e.pos.x : 0, dz = target ? target.pos.z - e.pos.z : 0;
  const range = Math.hypot(dx, dz);
  const visible = target && range < 9 && Math.abs(target.pos.y - e.pos.y) < 1.5 &&
    (source.player ? manager.canSeePlayer(e) : clearPath({ ...target.pos, y: target.pos.y + 0.8 }));
  const recover = () => {
    s.phase = "rhinoRecover";
    s.until = now + 4;
    s.chargeSource = null;
    e.goal = e.path = null;
  };

  if (s.phase === "rhinoCharge") {
    const { x, z } = s.heading;
    const forward = dx * x + dz * z;
    if (visible && forward >= -0.35 && forward <= 2.25 && Math.abs(dx * z - dz * x) < 1.05) {
      if (source.player) {
        manager.ctx.hurtPlayer(12 * multiplier, "A rhinoceros charged to defend itself.", e);
        manager.ctx.push(x * 7, 2.6, z * 7);
      } else manager.damage(target, 10, e, { x, z });
      recover();
    } else if (!target || now >= s.until || !e.goal) recover();
    return;
  }
  if (s.phase === "rhinoWarn") {
    if (!visible || e.inWater) { recover(); return; }
    if (now >= s.until) {
      s.phase = "rhinoCharge";
      s.until = now + 1.25;
      e.goal = { x: e.pos.x + s.heading.x * 8, y: e.pos.y, z: e.pos.z + s.heading.z * 8, speed: 8.1 };
    }
    return;
  }
  if (s.phase === "rhinoRecover" && now < s.until) return;
  if (visible && !e.inWater && range > 0.05) {
    s.phase = "rhinoWarn";
    s.heading = { x: dx / range, z: dz / range };
    s.chargeSource = source;
    s.until = now + 1;
    e.goal = e.path = null;
    e.yaw = Math.atan2(-dx, -dz);
    Sound.mob("rhinowarn", manager.dist(e));
    return;
  }

  if (s.phase === "wallow" && now < s.until && !e.inWater) return;
  if (e.onGround && !e.inWater && now >= (s.wallowAt ?? 0) && now % 23 > 17 &&
      atWallowBank(manager.world, e)) {
    s.phase = "wallow";
    s.until = now + 3.8;
    s.wallowAt = now + 65;
    e.goal = e.path = null;
    return;
  }

  const [x, y, z] = e.home;
  if (Math.hypot(e.pos.x - x, e.pos.z - z) > 20) {
    s.phase = "roam";
    steerGrassland(manager, e, { x, y, z }, 2.4, 3);
  } else if (now % 14 >= 9) {
    s.phase = "rhinoGraze";
    e.goal = e.path = null;
  } else {
    s.phase = "roam";
    manager.wander(e);
  }
}

export function stepOstrichEgg(manager, e, dt) {
  if (e.variant !== 1 || e.baby || e.inWater || e.inLava || !e.onGround) return;
  e.eggT = Math.max(0, e.eggT - dt);
  if (e.eggT > 0 || e.wild.phase !== "graze") return;
  e.eggT = 420 + Math.random() * 240;
  e.wild.layUntil = e.age + 1;
  e.wild.phase = "lay";
  manager.ctx.drop(I.OSTRICH_EGG, 1, e.pos.x, e.pos.y + 0.3, e.pos.z);
  Sound.mob("ostrichboom", manager.dist(e));
}

export function thinkSavanna(manager, e, multiplier, clearPath) {
  if (e.sp === GIRAFFE) thinkGiraffe(manager, e, clearPath);
  else if (e.sp === RHINO) thinkRhino(manager, e, multiplier, clearPath);
  else {
    thinkGrazingHerd(manager, e, clearPath);
    kickPredator(manager, e, clearPath, 7);
    if (e.wild.phase === "graze" && e.age < (e.wild.layUntil ?? 0)) e.wild.phase = "lay";
  }
}
