import { B, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";
import { canSpawnGrassland } from "./wildlife-grassland.js";

export const KANGAROO = "kangaroo";
const predators = new Set(["lion", "tiger", "grizzly_bear"]);

export function kangarooProvoked(manager, e, attacker) {
  if (e.sp !== KANGAROO || attacker !== "player") return;
  e.wild.threatId = manager.ctx.player().mpId ?? null;
  e.wild.provokedUntil = e.age + 9;
}

function boundGoal(w, e, direction, sprint) {
  const length = sprint ? 5.7 : 4.35;
  for (const turn of [0, 0.55, -0.55, 1.08, -1.08]) {
    const angle = direction + turn;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const x = e.pos.x + dx * length, z = e.pos.z + dz * length;
    if (!w.isLoaded(Math.floor(x), Math.floor(z))) continue;
    const y = w.surfaceY(Math.floor(x), Math.floor(z)) + 1;
    if (Math.abs(y - e.pos.y) > 1 || !canSpawnGrassland(w, e.def, x, y, z)) continue;
    let clear = true;
    for (let step = 1; step < length; step++) {
      const bx = Math.floor(e.pos.x + dx * step), bz = Math.floor(e.pos.z + dz * step);
      if (!w.isLoaded(bx, bz)) { clear = false; break; }
      const ground = w.surfaceY(bx, bz);
      if (ground < e.pos.y - 2 || ground > e.pos.y ||
          w.id(bx, ground, bz) === B.WATER || w.id(bx, ground, bz) === B.LAVA ||
          SOLID[w.id(bx, Math.floor(e.pos.y + e.h + 0.6), bz)]) { clear = false; break; }
    }
    if (clear) return { x, y, z, speed: sprint ? 7.8 : 5.9 };
  }
  return null;
}

export function thinkKangaroo(manager, e, d, multiplier, clearPath) {
  const s = e.wild, now = e.age, w = manager.world, player = manager.ctx.player();
  const playerThreat = now < (s.provokedUntil ?? 0) && d < 12 &&
    s.threatId === (player.mpId ?? null) && manager.targetable();
  if (now >= (s.scanAt ?? 0)) {
    s.scanAt = now + 0.85;
    s.predator = manager.near(e.pos.x, e.pos.y, e.pos.z, 9, other => predators.has(other.sp) &&
      clearPath({ ...other.pos, y: other.pos.y + 0.75 }))[0];
  }
  const predator = s.predator && !s.predator.dead && !s.predator.gone ? s.predator : null;
  if (s.phase === "kickWarn") {
    e.goal = null;
    if (now < s.until) return;
    const target = s.kickPlayer ? playerThreat && player : s.kickMob && !s.kickMob.dead && !s.kickMob.gone && s.kickMob;
    if (target && Math.hypot(target.pos.x - e.pos.x, target.pos.y - e.pos.y, target.pos.z - e.pos.z) < 2.6 &&
        clearPath({ ...target.pos, y: target.pos.y + 0.75 })) {
      const dx = target.pos.x - e.pos.x, dz = target.pos.z - e.pos.z, len = Math.hypot(dx, dz) || 1;
      const facing = (-Math.sin(e.yaw) * dx - Math.cos(e.yaw) * dz) / len;
      if (facing > 0.62) {
        if (s.kickPlayer) {
          manager.ctx.hurtPlayer(7 * multiplier, "A kangaroo kicked to defend itself.", e);
          manager.ctx.push(dx / len * 6.2, 2.4, dz / len * 6.2);
        } else manager.damage(target, 7, e, { x: dx / len, z: dz / len });
      }
    }
    s.kickMob = null;
    s.phase = "kick";
    s.until = now + 0.45;
    s.kickAt = now + 4.5;
    return;
  }
  if (s.phase === "kick" && now < s.until) return;
  if ((s.phase === "bound" || s.phase === "escapeBound") && (!e.onGround || e.wantJump) && now < s.until) return;
  if ((s.phase === "bound" || s.phase === "escapeBound") && e.onGround) {
    e.goal = null;
    s.nextBound = now + (s.phase === "bound" ? 0.42 : 0.18);
    s.phase = "land";
  }
  const home = { x: e.home[0], y: e.home[1], z: e.home[2] };
  if (e.inWater) {
    e.goal = { ...home, speed: 2.7 };
    s.phase = "roam";
    return;
  }
  if (!e.onGround || e.knock > 0 || now < (s.nextBound ?? 0)) return;
  const threat = playerThreat ? player : predator;
  const direction = threat ? Math.atan2(e.pos.z - threat.pos.z, e.pos.x - threat.pos.x) :
    Math.hypot(e.pos.x - home.x, e.pos.z - home.z) > 11 ?
      Math.atan2(home.z - e.pos.z, home.x - e.pos.x) : (s.heading ??= Math.random() * Math.PI * 2) + now * 0.38;
  const close = threat && Math.hypot(threat.pos.x - e.pos.x, threat.pos.y - e.pos.y, threat.pos.z - e.pos.z) < 2.45;
  const goal = threat || (now % 12 < 5) ? boundGoal(w, e, direction, !!threat) : null;
  if (close && (playerThreat || !goal) && now >= (s.kickAt ?? 0) &&
      clearPath({ ...threat.pos, y: threat.pos.y + 0.75 })) {
    s.phase = "kickWarn";
    s.until = now + 0.65;
    s.kickPlayer = !!playerThreat;
    s.kickMob = playerThreat ? null : predator;
    e.yaw = Math.atan2(e.pos.x - threat.pos.x, e.pos.z - threat.pos.z);
    e.goal = e.path = null;
    Sound.mob("kangaroowarn", d);
    return;
  }
  if (goal) {
    e.goal = goal;
    e.path = null;
    e.wantJump = true;
    s.until = now + 1.3;
    s.phase = threat ? "escapeBound" : "bound";
    return;
  }
  e.goal = null;
  s.nextBound = now + 0.45;
  s.phase = "graze";
}
