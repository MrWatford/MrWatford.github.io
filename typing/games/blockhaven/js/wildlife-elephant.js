import { B, I, SOLID } from "./blocks.js";
import { wideMountBounds } from "./player.js";
import { Sound } from "./audio.js";
import { canSpawnGrassland, steerGrassland } from "./wildlife-grassland.js";

export const ELEPHANT = "elephant";
const predators = new Set(["lion", "tiger", "grizzly_bear"]);
const treats = new Set([I.WHEAT, I.APPLE]);
const familyOffsets = [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const family = (a, b) => b.sp === ELEPHANT && a.home.every((v, i) => v === b.home[i]);
const cell = (w, x, y, z) => w.id(Math.floor(x), Math.floor(y), Math.floor(z));

export function spawnElephantFamily(manager, def, x, y, z, yaw, slots, random) {
  const w = manager.world, home = [x, y, z], young = random() < 0.4;
  let count = 0;
  for (const [dx, dz] of familyOffsets) {
    if (count >= slots) break;
    const px = x + dx, pz = z + dz;
    if (!w.isLoaded(Math.floor(px), Math.floor(pz))) continue;
    const py = w.surfaceY(Math.floor(px), Math.floor(pz)) + 1;
    if (Math.abs(y - py) > 1 || !canSpawnGrassland(w, def, px, py, pz)) continue;
    const baby = young && count === 2;
    manager.add(ELEPHANT, px, py, pz, { home, yaw, ambient: true, baby, growT: baby ? 1600 : 0 });
    count++;
  }
}

export function alertElephantFamily(manager, e, attacker) {
  if (e.sp !== ELEPHANT || e.tame || attacker !== "player") return;
  const player = manager.ctx.player();
  for (const member of manager.near(e.pos.x, e.pos.y, e.pos.z, 14, other => family(e, other) && !other.tame)) {
    member.wild.defendUntil = member.age + 10;
    member.wild.playerId = player.mpId ?? null;
  }
}

export function interactElephant(manager, e, slot) {
  if (e.sp !== ELEPHANT) return false;
  const ctx = manager.ctx, id = slot?.id;
  if (e.baby) {
    ctx.toast("This elephant calf is staying with its herd.");
    return true;
  }
  if (e.tame) return false;
  if (!treats.has(id)) {
    ctx.toast("Offer wheat or apples to earn this elephant's trust.");
    return true;
  }
  if (e.wild.phase === "trunkWarn" || e.age < (e.wild.defendUntil ?? 0)) {
    ctx.toast("Give the elephant room to calm down before offering food.");
    return true;
  }
  if (e.age < (e.wild.feedAt ?? 0)) return true;
  e.wild.feedAt = e.age + 1.5;
  ctx.consume();
  e.temper = Math.min(100, e.temper + 25);
  e.hp = Math.min(e.maxHp, e.hp + 4);
  ctx.particles(e.pos.x, e.pos.y + e.h - 0.3, e.pos.z, "heart");
  Sound.mob("elephanttrumpet", 2);
  if (e.temper >= 100) {
    e.tame = e.persist = true;
    e.goal = e.path = null;
    e.angry = 0;
    ctx.adv?.("tame", e.sp);
    ctx.toast("The elephant trusts you. Equip a Saddle to ride, or crouch and interact to open its cargo.", "good");
  } else ctx.toast("The elephant accepted the food. Give it a moment before offering more.");
  return true;
}

export function canRideElephant(w, p, e) {
  if (!e.tame || e.baby || e.dead || e.gone || e.inWater || e.inLava) return false;
  const { x, y, z } = e.pos;
  if (!w.isLoaded(Math.floor(x), Math.floor(z)) || !SOLID[cell(w, x, y - 0.05, z)]) return false;
  const floor = cell(w, x, y + 0.1, z);
  return floor !== B.WATER && floor !== B.LAVA && !p.collides(w, wideMountBounds(e, x, y, z, e.h + 1));
}

function browse(manager, e, d) {
  const w = manager.world, s = e.wild, now = e.age;
  if (now >= (s.browseAt ?? 0)) {
    s.browseAt = now + 2.4;
    s.source = null;
    for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
      const x = e.pos.x + dx, z = e.pos.z + dz;
      if (!w.isLoaded(Math.floor(x), Math.floor(z))) continue;
      if (cell(w, x, e.pos.y - 1, z) === B.WATER || cell(w, x, e.pos.y, z) === B.WATER) {
        s.source = { x, z, phase: "drink" };
        if (d < 18) manager.ctx.particles(x, e.pos.y, z, "splash");
        break;
      }
      if ([B.LEAVES, B.BIRCH_LEAVES].includes(cell(w, x, e.pos.y + 2.35, z))) {
        s.source = { x, z, phase: "browseLeaves" };
        break;
      }
    }
  }
  if (s.source) e.yaw = Math.atan2(e.pos.x - s.source.x, e.pos.z - s.source.z);
  s.phase = s.source?.phase ?? "graze";
  e.goal = e.path = null;
}

export function thinkElephant(manager, e, d, multiplier, clearPath) {
  const s = e.wild, now = e.age;
  const p = manager.ctx.player();
  const home = { x: e.home[0], y: e.home[1], z: e.home[2] };
  const defending = !e.tame && now < (s.defendUntil ?? 0) && manager.targetable() && s.playerId === (p.mpId ?? null);
  if (e.baby) {
    s.phase = defending ? "retreat" : "herd";
    const adult = manager.near(e.pos.x, e.pos.y, e.pos.z, 17, other => family(e, other) && !other.baby)[0];
    const target = defending ? home : adult?.pos ?? home;
    if (dist(e.pos, target) > 4.3) steerGrassland(manager, e, target, defending ? 3 : 2.2, 3.6);
    else e.goal = null;
    return;
  }
  if (s.phase === "trunkWarn") {
    if (now < s.until) return;
    const foe = s.strikePlayer ? defending && p : s.foe && !s.foe.dead && !s.foe.gone && s.foe;
    if (foe && dist(e.pos, foe.pos) < 4 && clearPath({ ...foe.pos, y: foe.pos.y + 0.9 })) {
      const dx = foe.pos.x - e.pos.x, dz = foe.pos.z - e.pos.z, n = Math.hypot(dx, dz) || 1;
      if ((-Math.sin(e.yaw) * dx - Math.cos(e.yaw) * dz) / n > 0.62) {
        if (s.strikePlayer) {
          manager.ctx.hurtPlayer(9 * multiplier, "An elephant swung its trunk to defend the herd.", e);
          manager.ctx.push(dx / n * 7, 2.7, dz / n * 7);
        } else manager.damage(foe, 10, e, { x: dx / n, z: dz / n });
      }
    }
    s.foe = null;
    s.phase = "trunkSwing";
    s.until = now + 0.65;
    s.nextSwing = now + 4;
    return;
  }
  if (s.phase === "trunkSwing" && now < s.until) return;
  if (now >= (s.nextSwing ?? 0) && now >= (s.scanAt ?? 0)) {
    s.scanAt = now + 0.6;
    const foe = defending && d < 3.85 ? p :
      manager.near(e.pos.x, e.pos.y, e.pos.z, 3.85, other => !other.def.boss &&
        (other.def.hostile || predators.has(other.sp)) && clearPath({ ...other.pos, y: other.pos.y + 0.9 }))[0];
    if (foe && clearPath({ ...foe.pos, y: foe.pos.y + 0.9 })) {
      s.phase = "trunkWarn";
      s.until = now + 0.9;
      s.strikePlayer = foe === p;
      s.foe = foe === p ? null : foe;
      e.yaw = Math.atan2(e.pos.x - foe.pos.x, e.pos.z - foe.pos.z);
      e.goal = e.path = null;
      Sound.mob("elephanttrumpet", d);
      return;
    }
  }
  if (e.tame) {
    s.phase = "stay";
    e.goal = e.path = null;
    return;
  }
  const adult = manager.near(e.pos.x, e.pos.y, e.pos.z, 15, other =>
    family(e, other) && !other.baby && other !== e && other.uid < e.uid)[0];
  if (adult && dist(e.pos, adult.pos) > 6) {
    s.phase = "herd";
    steerGrassland(manager, e, adult.pos, 2.1, 5);
  } else if (dist(e.pos, home) > 18 || e.inWater) {
    s.phase = "herd";
    steerGrassland(manager, e, home, 2.2, 4);
  } else if (now % 15 > 7) browse(manager, e, d);
  else {
    s.phase = "herd";
    manager.wander(e);
  }
}
