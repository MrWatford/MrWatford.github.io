import { B, I, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";
import { REX_HOME } from "./tyrant-canyon.js";

const REX = "lost_world_tyrannosaurus";
const hide = P => {
  P.fill(["#705540"]);
  for (let y = 1; y < 13; y += 2) for (let x = y % 3; x < 16; x += 3) P.px(x, y, "#4b4035");
  P.rect(0, 13, 16, 3, "#b19466");
};
const flank = P => {
  hide(P);
  for (const x of [2, 7, 12]) P.rect(x, 0, 2, 7, "#4c4137");
};
const face = P => {
  hide(P);
  P.rect(7, 3, 6, 4, "#3d3028");
  P.rect(9, 4, 3, 2, "#ffd273");
  P.px(10, 4, "#221f1b");
};
const ivory = P => P.fill(["#e7d4aa"]);
const part = (name, size, pivot, off, paint = { all: hide }, extra) => ({ name, size, pivot, off, paint, ...extra });

export function installTyrannosaurus(species) {
  const parts = [
    part("body", [34, 30, 50], [0, 39, 0], [0, 0, 0], { all: flank }),
    part("neck", [25, 29, 26], [0, 44, 18], [0, 6, 5], { all: flank }, { rotation: [-0.23, 0, 0] }),
    part("head", [28, 22, 39], [0, 56, 24], [0, 0, 15], { all: hide, right: face, left: face }),
    part("jaw", [23, 10, 36], [0, 46, 25], [0, 0, 16]),
    part("tail", [22, 20, 29], [0, 40, -20], [0, 0, -13], { all: flank }),
    part("tailMid", [13, 14, 25], [0, 0, -12], [0, 0, -10], { all: flank }, { parent: "tail" }),
    part("tailTip", [6, 8, 23], [0, 0, -10], [0, 0, -10], undefined, { parent: "tailMid" })
  ];
  for (const side of [-1, 1]) {
    parts.push(part("teeth" + side, [2, 3, 30], [side * 9, 5, 1], [0, 0, 0], { all: ivory }, { parent: "jaw" }));
    parts.push(part("thigh" + side, [13, 28, 17], [side * 14, 37, -4], [0, -11, 0], { all: flank }));
    parts.push(part("shin" + side, [8, 18, 10], [0, -11, -1], [0, -6, 0], undefined, { parent: "thigh" + side }));
    parts.push(part("foot" + side, [12, 5, 19], [0, -5, 0], [0, 0, 5], undefined, { parent: "shin" + side }));
    parts.push(part("arm" + side, [5, 12, 7], [side * 11, 34, 20], [0, -4, 3]));
  }
  species[REX] = {
    name: "Tyrannosaurus", tyrannosaurus: true, hostile: true, persist: true,
    hp: 135, w: 2.35, h: 4.25, speed: 3.8, dmg: 12, reach: 3.65,
    xp: 25, sound: "roar", drops: () => [[I.BONE, 8]],
    model: { type: "tyrannosaurus", parts }
  };
}

export function populateTyrannosaurus(manager, { cx, cz }) {
  if (cx !== 0 || cz !== 1) return;
  const [x, y, z] = REX_HOME, world = manager.world;
  if (SOLID[world.id(Math.floor(x), y - 1, Math.floor(z))] &&
      [0, 1, 2, 3, 4].every(dy => !SOLID[world.id(Math.floor(x), y + dy, Math.floor(z))])) {
    manager.add(REX, x, y, z, { home: [...REX_HOME], yaw: Math.PI / 2 });
  }
}

export function thinkTyrannosaurus(manager, e, distance, damageMultiplier) {
  const player = manager.ctx.player(), p = player.pos, def = e.def;
  const [hx, hy, hz] = Array.isArray(e.home) && e.home.length === 3 && e.home.every(Number.isFinite) ? e.home : REX_HOME;
  const canHunt = manager.targetable() && Math.hypot(p.x - hx, p.z - hz) < 24;
  const facing = Math.atan2(e.pos.x - p.x, e.pos.z - p.z);
  const crouching = player.crouch || manager.ctx.crouching?.();
  const audible = !crouching && distance < 8 && Math.hypot(player.vel?.x || 0, player.vel?.z || 0) > 4.7;
  const visible = canHunt && distance < (crouching ? 5 : 18) && manager.canSeePlayer(e);
  const noticed = visible && (distance < 5 || Math.cos(facing - e.yaw) > 0.25) || canHunt && audible;
  const inReach = visible && distance < def.reach && Math.abs(e.pos.y - p.y) < 2.3;
  if (e.rexBite) {
    if (canHunt && e.age < e.rexBite) return;
    if (inReach && Math.cos(facing - e.yaw) > 0.62) {
      manager.ctx.hurtPlayer(def.dmg * damageMultiplier, "A Tyrannosaurus caught you in the canyon!", e);
    }
    e.rexBite = 0;
    e.attackCd = 1.75;
    return;
  }
  if (noticed) e.rexTrail = { ...p, until: e.age + 3.1 };
  if (inReach && (noticed || e.rexTrail?.until > e.age)) {
    e.goal = e.path = null;
    e.yaw = facing;
    if (e.attackCd <= 0) {
      e.rexBite = e.age + 0.72;
      Sound.mob("roar", distance);
    }
    return;
  }
  if (canHunt && e.rexTrail?.until > e.age) {
    manager.moveTo(e, e.rexTrail, def.speed, 2.2);
    return;
  }
  e.rexTrail = null;
  const phase = e.age * 0.19;
  const x = hx + Math.sin(phase) * 4, z = hz + Math.cos(phase) * 5;
  const id = manager.world.id(Math.floor(x), hy - 1, Math.floor(z));
  const route = id === B.GRASS || id === B.GRAVEL || id === B.DIRT ? { x, y: hy, z } : { x: hx, y: hy, z: hz };
  manager.moveTo(e, route, def.speed * 0.46, 1.25);
}

export function animateTyrannosaurus(e, swing, reducedMotion) {
  const p = e.parts;
  const gait = swing * (reducedMotion ? 0.3 : 0.63);
  p.thigh1.rotation.x = gait;
  p["thigh-1"].rotation.x = -gait;
  p.shin1.rotation.x = -Math.max(0, gait) * 0.8;
  p["shin-1"].rotation.x = -Math.max(0, -gait) * 0.8;
  p.tail.rotation.y = -gait * 0.27;
  p.tailMid.rotation.y = gait * 0.25;
  p.tailTip.rotation.y = gait * 0.32;
  p.jaw.rotation.x = e.rexBite ? 0.72 : 0.06;
  p.head.rotation.x = e.rexBite ? -0.18 : gait * 0.06;
}
