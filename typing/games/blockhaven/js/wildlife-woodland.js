import { hunterLevel } from "./ultra-hardcore.js";
import { B } from "./blocks.js";
import { Sound } from "./audio.js";
import { steerGrassland, thinkGrazingHerd } from "./wildlife-grassland.js";

export const TIGER = "tiger", DEER = "deer";
const preyIds = new Set([DEER, "rabbit", "zebra"]);
const foliage = new Set([B.LOG, B.BIRCH_LOG, B.LEAVES, B.BIRCH_LEAVES, B.TALL_GRASS]);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const living = target => target && !target.dead && !target.gone && target.hp > 0;
const offsets = [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, -3], [3, -3], [-3, 3]];

export function woodlandCover(w, x, y, z) {
  const bx = Math.floor(x), bz = Math.floor(z), by = Math.floor(y);
  return offsets.reduce((total, [dx, dz]) => {
    if (!w.isLoaded(bx + dx, bz + dz)) return total;
    for (let dy = 0; dy < 4; dy++) {
      if (foliage.has(w.id(bx + dx, by + dy, bz + dz))) return total + 1;
    }
    return total;
  }, 0);
}

function tigerThink(manager, e, playerDistance, multiplier, clearPath) {
  const w = manager.world, p = manager.ctx.player(), s = e.wild, now = e.age;
  const [x, y, z] = e.home;
  const home = { x, y, z };
  const run = manager.ctx.ultra?.(), hunt = hunterLevel(run);
  const playerId = p.mpId ?? null;
  const canStrikePlayer = manager.targetable() && s.playerId === playerId;
  const canSee = (pos, lift = 0.65) => clearPath({ ...pos, y: pos.y + lift });
  if (s.phase === "recover" && now < s.until) return;
  if (s.phase === "leap") {
    const target = s.player ? (canStrikePlayer ? p : null) : s.prey;
    const present = target && (s.player || living(target)) && !target.inWater;
    if (present && distance(e.pos, target.pos) < 2.75 && canSee(target.pos)) {
      if (s.player) manager.ctx.hurtPlayer(10 * multiplier, "A tiger lunged from cover.", e);
      else manager.damage(target, 10, e);
      s.until = now;
    }
    if (now >= s.until || !present || !e.goal) {
      s.phase = "recover";
      s.until = now + 1.45;
      s.nextScan = now + 3.5;
      s.prey = null;
      s.player = false;
      e.goal = e.path = null;
    }
    return;
  }
  if (s.phase === "warnTiger") {
    if (!canStrikePlayer) { s.player = false; s.phase = "prowl"; }
    else if (now < s.until) return;
  }
  if (distance(e.pos, home) > 26 + hunt * 2) {
    s.phase = "prowl";
    s.prey = null;
    s.player = false;
    steerGrassland(manager, e, home, 3.2, 3.5);
    return;
  }
  if (s.player && (!canStrikePlayer || p.inWater || playerDistance > 10 + hunt * 3 || now > s.targetUntil)) s.player = false;
  if (!s.player && !e.inWater && manager.targetable() && !p.inWater &&
      playerDistance < (e.angry > 0 ? 8 + hunt * 2 : p.crouch ? 2.55 : 4 + (run ? 1.5 : 0) + hunt) && manager.canSeePlayer(e)) {
    s.player = true;
    s.playerId = playerId;
    s.targetUntil = now + 8 + hunt * 3;
    s.prey = null;
    s.phase = "warnTiger";
    s.until = now + 0.65;
    e.goal = e.path = null;
    e.yaw = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
    Sound.mob("tigerwarn", playerDistance);
    return;
  }
  if (s.prey && (!living(s.prey) || s.prey.inWater || distance(e.pos, s.prey.pos) > 17)) s.prey = null;
  if (!s.player && !s.prey && !e.inWater && now >= (s.nextScan ?? 0)) {
    s.nextScan = now + 2;
    s.prey = manager.near(e.pos.x, e.pos.y, e.pos.z, 14, other =>
      preyIds.has(other.sp) && living(other) && !other.inWater && canSee(other.pos))[0];
  }
  const target = s.player ? p.pos : s.prey?.pos;
  if (!target) {
    s.phase = "prowl";
    if (distance(e.pos, home) > 14 || e.inWater) steerGrassland(manager, e, home, 2.9, 2.5);
    else manager.wander(e);
    return;
  }
  const gap = distance(e.pos, target);
  if (!e.inWater && gap < 4.8 && Math.abs(e.pos.y - target.y) < 1.25 && canSee(target)) {
    s.phase = "leap";
    s.until = now + 0.85;
    e.yaw = Math.atan2(e.pos.x - target.x, e.pos.z - target.z);
    const reach = Math.hypot(target.x - e.pos.x, target.z - e.pos.z) || 1;
    const scale = Math.max(1, 2.8 / reach);
    e.goal = { x: e.pos.x + (target.x - e.pos.x) * scale, z: e.pos.z + (target.z - e.pos.z) * scale, speed: 8.1 };
    e.wantJump = e.onGround && gap > 1.9;
    e.path = null;
    return;
  }
  if (!s.player && now >= (s.coverAt ?? 0)) {
    s.coverAt = now + 1.4;
    const side = Math.atan2(e.pos.x - target.x, e.pos.z - target.z) + 0.8;
    const fx = target.x + Math.sin(side) * 6, fz = target.z + Math.cos(side) * 6;
    const fy = w.gen.column?.(Math.floor(fx), Math.floor(fz))?.h + 1;
    const covered = w.isLoaded(fx, fz) && Number.isFinite(fy) && Math.abs(fy - e.pos.y) < 2 &&
      woodlandCover(w, fx, fy, fz) > 1 && canSee({ x: fx, y: fy, z: fz });
    s.flank = covered ? { x: fx, y: fy, z: fz } : null;
  }
  const running = s.player || s.prey?.wild?.phase === "flee";
  s.phase = running ? "chase" : "stalk";
  const flank = !running && s.flank && distance(e.pos, s.flank) > 1.15;
  steerGrassland(manager, e, flank ? s.flank : target, running ? 7.5 : 2.65, 0.75);
}

export function thinkWoodland(manager, e, d, multiplier, clearPath) {
  if (e.sp === TIGER) tigerThink(manager, e, d, multiplier, clearPath);
  else {
    thinkGrazingHerd(manager, e, clearPath);
    if (e.wild.phase !== "graze") return;
    const w = manager.world, now = e.age, s = e.wild;
    if (now >= (s.checkWaterAt ?? 0)) {
      s.checkWaterAt = now + 3;
      const by = Math.floor(e.pos.y - 0.15);
      s.drinkPoint = offsets.map(([dx, dz]) => [Math.sign(dx) * 1.1, Math.sign(dz) * 1.1])
        .map(([dx, dz]) => ({ x: e.pos.x + dx, y: by + 0.7, z: e.pos.z + dz }))
        .find(pos => w.id(Math.floor(pos.x), by, Math.floor(pos.z)) === B.WATER && clearPath(pos));
    }
    if (s.drinkPoint) {
      s.phase = "drink";
      e.yaw = Math.atan2(e.pos.x - s.drinkPoint.x, e.pos.z - s.drinkPoint.z);
    }
  }
}
