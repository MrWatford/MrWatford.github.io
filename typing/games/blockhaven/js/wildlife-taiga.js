import { B, I, HEIGHT, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";
import { steerGrassland } from "./wildlife-grassland.js";

export const MOOSE = "moose", RED_PANDA = "red_panda", SLOTH = "sloth", KOALA = "koala";
const trees = new Set([B.LOG, B.BIRCH_LOG]);
const foliage = new Set([B.LEAVES, B.BIRCH_LEAVES]);
const sides = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const position = e => ({ x: e.home[0], y: e.home[1], z: e.home[2] });
const family = (a, b) => b.sp === MOOSE && a.home.every((v, i) => v === b.home[i]);
const blockAt = (w, x, y, z) => w.id(Math.floor(x), Math.floor(y), Math.floor(z));

function clearColumn(w, x, y, z, h) {
  const bx = Math.floor(x), bz = Math.floor(z);
  if (!w.isLoaded(bx, bz)) return false;
  for (let ay = Math.floor(y); ay <= Math.floor(y + h - 0.01); ay++) {
    const block = w.id(bx, ay, bz);
    if (SOLID[block] || block === B.WATER || block === B.LAVA) return false;
  }
  return true;
}

export function mooseSite(w, def, x, y, z) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!clearColumn(w, x + dx, y, z + dz, def.h)) return false;
    if ((dx === 0 || dz === 0) && !SOLID[blockAt(w, x + dx, y - 1, z + dz)]) return false;
  }
  return [B.GRASS, B.SNOW, B.DIRT].includes(blockAt(w, x, y - 1, z));
}

export function spawnMooseFamily(manager, def, x, y, z, yaw, random) {
  const home = [x, y, z];
  manager.add(MOOSE, x, y, z, { home, yaw, variant: Number(random() < 0.48), ambient: true });
  if (manager.list.length >= 110 || random() >= 0.34) return;
  for (const [dx, dz] of sides) {
    const cx = x + dx * 3, cz = z + dz * 3;
    const ground = manager.world.gen.column?.(Math.floor(cx), Math.floor(cz))?.h;
    const cy = (ground ?? manager.world.surfaceY(Math.floor(cx), Math.floor(cz))) + 1;
    if (Math.abs(cy - y) > 1 || !mooseSite(manager.world, def, cx, cy, cz)) continue;
    manager.add(MOOSE, cx, cy, cz, { home, yaw, variant: 0, baby: true, growT: 1400, ambient: true });
    return;
  }
}

export function alertMooseFamily(manager, hurt) {
  if (hurt.sp !== MOOSE) return;
  const p = manager.ctx.player();
  for (const e of manager.near(hurt.pos.x, hurt.pos.y, hurt.pos.z, 14, other => family(hurt, other))) {
    e.wild.defendUntil = e.age + 14;
    e.wild.playerId = p.mpId ?? null;
  }
}

function mooseThink(manager, e, d, multiplier) {
  const s = e.wild, p = manager.ctx.player(), now = e.age, home = position(e), w = manager.world;
  const playerId = p.mpId ?? null;
  const targetable = manager.targetable();
  const canStrike = targetable && s.playerId === playerId;
  if (e.baby) {
    const adult = manager.near(e.pos.x, e.pos.y, e.pos.z, 16, other => family(e, other) && !other.baby)[0];
    const retreat = now < (s.defendUntil ?? 0), target = retreat ? home : adult?.pos || home;
    s.phase = retreat ? "retreat" : "browse";
    if (distance(e.pos, target) > 2.4) steerGrassland(manager, e, target, retreat ? 3.3 : 2.15, 1.9);
    else e.goal = null;
    return;
  }
  if (s.phase === "charge") {
    const dir = s.charge;
    const forward = (p.pos.x - e.pos.x) * dir.x + (p.pos.z - e.pos.z) * dir.z;
    if (canStrike && d < 3.25 && Math.abs(p.pos.y - e.pos.y) < 2.25 && forward > -0.45 && manager.canSeePlayer(e)) {
      manager.ctx.hurtPlayer(11 * multiplier, "A moose charged to defend itself.", e);
      manager.ctx.push(dir.x * 7, 2.65, dir.z * 7);
      s.until = now;
    }
    if (!canStrike || now >= s.until || !e.goal) {
      s.phase = "recover";
      s.until = now + 4.6;
      e.goal = e.path = null;
    }
    return;
  }
  if (s.phase === "warning") {
    if (canStrike && now < s.until) return;
    if (canStrike && d < 9 && manager.canSeePlayer(e)) {
      const dir = s.charge;
      e.goal = { x: e.pos.x + dir.x * 7.3, y: p.pos.y, z: e.pos.z + dir.z * 7.3, speed: 7.2 };
      s.phase = "charge";
      s.until = now + 1.35;
      return;
    }
    s.phase = "recover";
    s.until = now + 2.8;
  }
  if (s.phase === "recover" && now < s.until) return;
  if (targetable && d < 8 && distance(e.pos, home) < 20 && now >= (s.senseAt ?? 0)) {
    s.senseAt = now + 0.6;
    const nearCalf = manager.near(p.pos.x, p.pos.y, p.pos.z, 3.3, other => other.baby && family(e, other)).length > 0;
    if ((nearCalf || canStrike && now < (s.defendUntil ?? 0)) && manager.canSeePlayer(e)) {
      const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, len = Math.hypot(dx, dz) || 1;
      s.charge = { x: dx / len, z: dz / len };
      s.playerId = playerId;
      s.phase = "warning";
      s.until = now + 1;
      e.yaw = Math.atan2(-dx, -dz);
      e.goal = e.path = null;
      Sound.mob("moosewarn", d);
      return;
    }
  }
  const nearSurface = s.phase === "wade" && !e.onGround && blockAt(w, e.pos.x, e.pos.y - 0.55, e.pos.z) === B.WATER;
  if (e.inWater || nearSurface) {
    s.phase = "wade";
    if (distance(e.pos, home) < 14) {
      e.path = null;
      e.goal = { ...home, speed: 2.65 };
    } else if (!e.goal || distance(e.pos, home) > 17) {
      steerGrassland(manager, e, home, 2.6, 2);
    }
    return;
  }
  if (distance(e.pos, home) > 17) {
    s.phase = "browse";
    steerGrassland(manager, e, home, 2.5, 2);
    return;
  }
  if (now >= (s.waterAt ?? 0)) {
    s.waterAt = now + 3.5;
    s.drink = sides.find(([dx, dz]) => blockAt(w, e.pos.x + dx * 1.65, e.pos.y - 0.25, e.pos.z + dz * 1.65) === B.WATER);
  }
  if (s.drink && now % 16 > 7 && now % 16 < 12) {
    s.phase = "drink";
    e.yaw = Math.atan2(-s.drink[0], -s.drink[1]);
    e.goal = e.path = null;
  } else {
    s.phase = "browse";
    manager.wander(e);
  }
}

function canopyBodyRoom(w, def, from, top, branch) {
  const radius = Math.hypot(def.w, def.length) / 2;
  for (const [x, z, base] of [[from.x, from.z, from.y], [branch.x, branch.z, top]]) {
    for (let dz = Math.floor(z - radius); dz <= Math.floor(z + radius); dz++) {
      for (let dx = Math.floor(x - radius); dx <= Math.floor(x + radius); dx++) {
        if (!clearColumn(w, dx, base, dz, top + def.h - base)) return false;
      }
    }
  }
  return true;
}

export function findCanopyTree(w, origin, def, perch = null) {
  const cx = Math.floor(origin.x), cz = Math.floor(origin.z);
  for (let ring = 1; ring <= 7; ring++) {
    for (let dz = -ring; dz <= ring; dz++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.abs(dx) + Math.abs(dz) !== ring) continue;
      const x = cx + dx, z = cz + dz;
      if (!w.isLoaded(x, z)) continue;
      const base = (w.gen.column?.(x, z)?.h ?? Math.floor(origin.y) - 1) + 1;
      if (Math.abs(origin.y - base) > 2.4 || base + 6 >= HEIGHT) continue;
      const trunk = w.id(x, base, z);
      if (def.trunkDweller && trunk !== B.BIRCH_LOG) continue;
      if (!Array.from({ length: 4 }, (_, i) => trees.has(w.id(x, base + i, z))).every(Boolean)) continue;
      for (const [sx, sz] of sides) {
        const reach = def.trunkDweller ? 1.10 : 1.20;
        const from = { x: x + sx * reach + 0.5, y: base, z: z + sz * reach + 0.5 };
        if (!SOLID[blockAt(w, from.x, base - 1, from.z)] || !clearColumn(w, from.x, base, from.z, def.h)) continue;
        let y = base + 1;
        while (y < base + 7 && clearColumn(w, from.x, y, from.z, 0.95) && trees.has(w.id(x, y, z))) y++;
        const top = y - def.h - 0.11;
        if (top - base < 1.65 || !foliage.has(blockAt(w, from.x, y, from.z))) continue;
        const branch = { x: from.x + sz, y: top, z: from.z - sx };
        const branchClear = clearColumn(w, branch.x, top, branch.z, def.h);
        if (def.canopyHanger && (!branchClear || !foliage.has(blockAt(w, branch.x, y, branch.z)) ||
            !canopyBodyRoom(w, def, from, top, branch))) continue;
        const grip = { ...from, y: top };
        if (def.trunkDweller && !canopyBodyRoom(w, def, from, top, grip)) continue;
        if (perch && distance(perch, def.trunkDweller ? grip : branch) > 0.55) continue;
        return { x, z, base, from, top, branch: branchClear ? branch : null };
      }
    }
  }
  return null;
}

function supportedTree(w, tree, e) {
  for (let y = tree.base; y <= Math.floor(tree.top); y++) {
    if (!trees.has(w.id(tree.x, y, tree.z))) return false;
  }
  return clearColumn(w, tree.from.x, tree.top, tree.from.z, e.h);
}
function aimTree(e, tree) {
  e.yaw = Math.atan2(e.pos.x - tree.x - 0.5, e.pos.z - tree.z - 0.5);
}

function pandaThink(manager, e, d) {
  const w = manager.world, s = e.wild, now = e.age, p = manager.ctx.player();
  let tree = s.tree;
  if (!tree && now >= (s.treeAt ?? 0)) {
    s.treeAt = now + 4.5;
    s.tree = tree = findCanopyTree(w, e.pos, e.def);
  }
  if (tree && !supportedTree(w, tree, e)) {
    s.tree = tree = null;
    s.treeAt = now + 2;
    s.phase = "forage";
    e.goal = e.path = null;
  }
  if (tree && !e.inWater && now >= (s.groundUntil ?? 0)) {
    const top = { ...tree.from, y: tree.top };
    if (s.phase === "branch") {
      if (!tree.branch || !clearColumn(w, tree.branch.x, tree.branch.y, tree.branch.z, e.h)) {
        s.phase = "descendTree";
      } else if (distance(e.pos, tree.branch) > 0.38 && now < s.until) {
        e.goal = { ...tree.branch, speed: 1.1 };
        return;
      } else s.phase = "treeRest";
    }
    if (s.phase === "treeRest") {
      const perch = tree.branch && distance(e.pos, tree.branch) < 0.65 ? tree.branch : top;
      s.restUntil ??= now + 6.5;
      if (now < s.restUntil) { e.goal = { ...perch, speed: 0.85 }; aimTree(e, tree); return; }
      s.phase = "descendTree";
    }
    if (s.phase === "descendTree") {
      if (distance(e.pos, tree.from) > 0.55) {
        e.goal = distance(e.pos, top) > 0.62 && e.pos.y > tree.base + 0.65 &&
          Math.hypot(e.pos.x - top.x, e.pos.z - top.z) > 0.42 ? { ...top, speed: 1.3 } : { ...tree.from, speed: 1.2 };
        aimTree(e, tree);
        return;
      }
      s.groundUntil = now + 13;
      s.restUntil = null;
      e.goal = null;
    } else if (s.phase === "climbTree" || distance(e.pos, tree.from) < 0.16) {
      s.phase = "climbTree";
      if (distance(e.pos, top) > 0.36) { e.goal = { ...top, speed: 1.45 }; aimTree(e, tree); return; }
      s.phase = tree.branch ? "branch" : "treeRest";
      if (d < 18) Sound.mob("pandachirp", d);
      s.until = now + 3.8;
      e.goal = { ...(tree.branch || top), speed: 1.1 };
      return;
    } else {
      s.phase = "approachTree";
      steerGrassland(manager, e, tree.from, 1.8, 0.11);
      return;
    }
  }
  if (d < 5.5 && d > 1.2 && manager.ctx.heldId?.() === I.BERRIES && manager.canSeePlayer(e)) {
    s.phase = "berries";
    steerGrassland(manager, e, p.pos, 1.55, 1.15);
    return;
  }
  s.phase = "forage";
  if (distance(e.pos, position(e)) > 14) steerGrassland(manager, e, position(e), 1.8, 2.5);
  else manager.wander(e);
}

function findArborealHome(w, e) {
  const s = e.wild, now = e.age;
  if (!s.tree && now >= (s.treeAt ?? 0)) {
    s.treeAt = now + 6;
    if (now < 0.75 && !e.onGround) {
      s.tree = findCanopyTree(w, { ...e.pos, y: e.home[1] }, e.def, e.pos);
      if (s.tree) s.phase = "treeRest";
    }
    s.tree ??= findCanopyTree(w, e.pos, e.def);
  }
}

function slothThink(manager, e, d) {
  const { world: w } = manager, s = e.wild, now = e.age;
  findArborealHome(w, e);
  const tree = s.tree, branch = tree?.branch;
  const valid = branch && supportedTree(w, tree, e) &&
    clearColumn(w, branch.x, branch.y, branch.z, e.h) &&
    foliage.has(blockAt(w, branch.x, branch.y + e.h + 0.12, branch.z));
  if (s.tree && !valid) {
    s.tree = null;
    s.treeAt = now + 3;
    s.phase = "forage";
    e.goal = e.path = null;
  }
  if (!valid || e.inWater || now < (s.groundUntil ?? 0)) {
    s.phase = "forage";
    if (!e.onGround && !e.inWater) { e.goal = e.path = null; return; }
    if (distance(e.pos, position(e)) > 9) steerGrassland(manager, e, position(e), 0.7, 1.5);
    else manager.wander(e);
    return;
  }

  const top = { ...tree.from, y: tree.top };
  if (s.phase === "treeRest") {
    s.restUntil ??= now + 45 + Math.random() * 35;
    if (now < s.restUntil) {
      e.goal = { ...branch, speed: 0.45 };
      aimTree(e, tree);
      return;
    }
    s.phase = "descendTree";
  }
  if (s.phase === "descendTree") {
    if (distance(e.pos, tree.from) < 0.32) {
      s.phase = "forage";
      s.groundUntil = now + 10;
      s.restUntil = null;
      e.goal = e.path = null;
      return;
    }
    const atTrunk = Math.hypot(e.pos.x - top.x, e.pos.z - top.z) < 0.13;
    e.goal = { ...(atTrunk ? tree.from : top), speed: 0.65 };
    aimTree(e, tree);
    return;
  }
  if (s.phase === "branch") {
    if (distance(e.pos, branch) < 0.16) {
      s.phase = "treeRest";
      if (d < 18) Sound.mob("slothcall", d);
      aimTree(e, tree);
    }
    e.goal = { ...branch, speed: 0.55 };
    return;
  }
  if (s.phase === "climbTree" || distance(e.pos, tree.from) < 0.16) {
    s.approachUntil = null;
    s.phase = distance(e.pos, top) < 0.22 ? "branch" : "climbTree";
    e.goal = { ...(s.phase === "branch" ? branch : top), speed: 0.65 };
    aimTree(e, tree);
    return;
  }
  s.approachUntil ??= now + 14;
  if (now >= s.approachUntil) {
    s.tree = null;
    s.approachUntil = null;
    s.treeAt = now + 7;
    s.phase = "forage";
    e.goal = e.path = null;
    return;
  }
  s.phase = "approachTree";
  steerGrassland(manager, e, tree.from, 0.8, 0.1);
}

function koalaThink(manager, e, d) {
  const { world: w } = manager, s = e.wild, now = e.age;
  findArborealHome(w, e);
  const tree = s.tree;
  const grip = tree && { ...tree.from, y: tree.top };
  if (tree && (!supportedTree(w, tree, e) ||
      !foliage.has(blockAt(w, grip.x, grip.y + e.h + 0.12, grip.z)))) {
    s.tree = null;
    s.treeAt = now + 3;
    s.until = s.approachUntil = null;
    e.goal = e.path = null;
  }
  if (!s.tree || e.inWater || now < (s.groundUntil ?? 0)) {
    s.phase = "forage";
    if (!e.onGround && !e.inWater) { e.goal = e.path = null; return; }
    if (distance(e.pos, position(e)) > 7) steerGrassland(manager, e, position(e), 0.85, 2);
    else manager.wander(e);
    return;
  }
  if (s.phase === "treeRest" || s.phase === "leafFeed") {
    const feeding = s.phase === "leafFeed";
    if (s.until == null) {
      s.until = now + (feeding ? 5 : 30 + Math.random() * 24);
      if (feeding && d < 18) Sound.mob("koalacall", d);
    }
    e.goal = { ...grip, speed: 0.55 };
    aimTree(e, tree);
    if (now < s.until) return;
    s.phase = feeding ? "treeRest" : "descendTree";
    s.until = null;
    return;
  }
  if (s.phase === "descendTree") {
    if (distance(e.pos, tree.from) > 0.3) {
      e.goal = { ...tree.from, speed: 0.55 };
      aimTree(e, tree);
      return;
    }
    s.groundUntil = now + 8;
    s.phase = "forage";
    e.goal = e.path = null;
    return;
  }
  if (s.phase === "climbTree" || distance(e.pos, tree.from) < 0.16) {
    s.approachUntil = null;
    e.goal = { ...grip, speed: 0.65 };
    aimTree(e, tree);
    if (distance(e.pos, grip) < 0.18) {
      s.phase = "leafFeed";
      s.until = null;
    } else s.phase = "climbTree";
    return;
  }
  s.approachUntil ??= now + 12;
  if (now >= s.approachUntil) {
    s.tree = null;
    s.approachUntil = null;
    s.treeAt = now + 6;
    e.goal = e.path = null;
    return;
  }
  s.phase = "approachTree";
  steerGrassland(manager, e, tree.from, 0.8, 0.1);
}

export function thinkTaiga(manager, e, d, multiplier) {
  if (e.sp === MOOSE) mooseThink(manager, e, d, multiplier);
  else if (e.sp === SLOTH) slothThink(manager, e, d);
  else if (e.sp === KOALA) koalaThink(manager, e, d);
  else pandaThink(manager, e, d);
}
