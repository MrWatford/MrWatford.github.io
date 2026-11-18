import { B, I, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";
import { REX_HOME } from "./tyrant-canyon.js";
import { reptileSurface, reptileTail } from "./lost-world-model-geometry.js";

const REX = "lost_world_tyrannosaurus";
export const TYRANNOSAURUS_HEIGHT = 10;
const REX_SCALE = TYRANNOSAURUS_HEIGHT / 4.09375;
const hide = P => {
  P.fill(["#856047"]);
  for (let y = 0; y < 15; y += 3) for (let x = y % 2; x < 16; x += 4) {
    P.rect(x, y, 3, 2, (x + y) % 3 ? "#9c744b" : "#79583e");
    P.px(x + 1, y, "#b68a59");
  }
};
const flank = P => {
  hide(P);
  for (const x of [1, 7, 13]) {
    P.rect(x, 0, 3, 8, "#493b2d");
    P.rect(x + 1, 7, 2, 4, "#57422e");
  }
  P.rect(0, 13, 16, 3, "#bea16d");
};
const belly = P => {
  P.fill(["#c3a879"]);
  for (let y = 1; y < 15; y += 5) {
    for (let x = y % 3; x < 15; x += 6) P.rect(x, y, 2, 2, "#d2b988");
  }
};
const ivory = P => {
  P.fill(["#ebddba"]);
  P.rect(3, 0, 10, 10, "#fff1ce");
  P.rect(0, 13, 16, 3, "#a48a62");
};
const dark = P => P.fill(["#30251f"]);
const mouth = P => {
  P.fill(["#4e2527"]);
  P.rect(3, 9, 10, 6, "#9a5250");
};
const eye = P => {
  P.fill(["#dd951d"]);
  P.rect(3, 3, 10, 8, "#ffd673");
  P.rect(8, 2, 3, 11, "#342211");
  P.px(5, 4, "#fff1c9");
};
const part = (name, size, pivot, off = [0, 0, 0], paint = { all: hide }, extra) =>
  ({ name, size, pivot, off, paint, ...extra });
const scaled = (name, size, pivot, off, paint = { all: flank }, extra) =>
  part(name, size, pivot, off, paint, { voxels: reptileSurface(size, 3.5, 0.6), voxelShell: true, ...extra });
const tail = (name, length, sections, pivot, off, parent) => {
  const { size, voxels } = reptileTail(length, sections, 4.5, 0.65);
  return part(name, size, pivot, off, { all: flank }, { voxels, ...(parent ? { parent } : {}) });
};

export function installTyrannosaurus(species) {
  const parts = [
    scaled("body", [35, 31, 52], [0, 38, -1], undefined, { all: flank, bottom: belly }),
    scaled("haunches", [37, 32, 31], [0, 38, -15]),
    scaled("chest", [28, 28, 27], [0, 39, 19], undefined, { all: hide, bottom: belly, front: belly }),
    scaled("neck", [24, 27, 29], [0, 45, 26], undefined, { all: flank, front: belly }),
    scaled("head", [27, 22, 33], [0, 56, 36], undefined, { all: hide, top: flank }),
    scaled("snout", [25, 17, 27], [0, -1, 19], undefined, { all: hide }, { parent: "head" }),
    part("nasalRidge", [22, 5, 24], [0, 7, 15], undefined, { all: flank }, {
      parent: "head", voxels: [[0, 3, -4, 16, 3, 14], [0, 1, 14, 19, 4, 6]]
    }),
    part("mouth", [21, 9, 2], [0, -9, 31], undefined, { all: mouth }, { parent: "head" }),
    scaled("jaw", [23, 8, 36], [0, -9, 2], [0, -5, 14], { all: hide, bottom: belly }, { parent: "head" }),
    tail("tail", 38, [[23, 22], [19, 19], [15, 15]], [0, 41, -22], [0, 0, -17]),
    tail("tailMid", 35, [[16, 16], [12, 13], [9, 10]], [0, -1, -17], [0, -1, -16], "tail"),
    tail("tailTip", 34, [[9, 10], [6, 8], [4, 6]], [0, -1, -16], [0, -1, -15], "tailMid"),
    part("tailPoint", [4, 6, 28], [0, -1, -15], [0, -1, -12], { all: flank }, { parent: "tailTip" })
  ];
  const upperTeeth = [], lowerTeeth = [];
  for (const side of [-1, 1]) {
    parts.push(scaled("cheek" + side, [7, 18, 18], [side * 12, -1, -3], undefined,
      { all: hide }, { parent: "head" }));
    parts.push(part("eyeSocket" + side, [2, 7, 11], [side * 14.5, 4, 3], undefined,
      { all: dark }, { parent: "head" }));
    parts.push(part("eye" + side, [1, 3.5, 5], [side * 15.7, 4.5, 5], undefined,
      { all: eye }, { parent: "head", fullbright: true }));
    parts.push(part("brow" + side, [6, 5, 14], [side * 13, 8, 6], undefined,
      { all: hide }, { parent: "head" }));
    parts.push(part("nostril" + side, [2, 3, 4], [side * 12, 1, 28], undefined,
      { all: dark }, { parent: "head" }));
    parts.push(scaled("thigh" + side, [15, 28, 22], [side * 13, 39, -8], [0, -12, 0]));
    parts.push(scaled("shin" + side, [9, 18, 11], [0, -10, -3], [0, -5, 0], undefined,
      { parent: "thigh" + side }));
    parts.push(part("foot" + side, [14, 6, 21], [0, -6, 2], [0, -1, 6], { all: hide }, {
      parent: "shin" + side,
      voxels: [-4.5, 0, 4.5].map(x => [x, -0.5, 13, 4, 5, 9])
    }));
    parts.push(part("claws" + side, [3, 3, 7], [0, 0, 18], undefined, { all: ivory }, {
      parent: "foot" + side, voxels: [[-4.5, 0, 0, 3, 3, 7], [4.5, 0, 0, 3, 3, 7]]
    }));
    parts.push(part("arm" + side, [5, 12, 6], [side * 12, 37, 21], [0, -4, 3], { all: hide }));
    parts.push(part("hand" + side, [5, 5, 10], [0, -4, 1], [0, -1, 4], { all: hide }, {
      parent: "arm" + side, voxels: [[-1.5, -1, 7, 2, 5, 5], [1.5, -1, 7, 2, 5, 5]]
    }));
    parts.push(part("fingerClaws" + side, [1.5, 3, 3], [-1.5, -3, 10], undefined,
      { all: ivory }, { parent: "hand" + side, voxels: [[3, 0, 0, 1.5, 3, 3]] }));
    for (const z of [3, 9, 15, 21, 27]) {
      upperTeeth.push([side * 9.5, -10, z, 2.5, 5, 3], [side * 9.5, -13, z, 1.5, 2, 2]);
      lowerTeeth.push([side * 9, 6, z - 12, 2, 4, 3], [side * 9, 8.5, z - 12, 1, 1.5, 2]);
    }
  }
  for (const x of [-6, 6]) upperTeeth.push([x, -10, 31, 3, 4.5, 3]);
  parts.push(part("upperTeeth", [3, 4.5, 3], [0, -10, 31], undefined, { all: ivory }, {
    parent: "head", voxels: upperTeeth.map(([x, y, z, ...size]) => [x, y + 10, z - 31, ...size])
  }));
  parts.push(part("lowerTeeth", [2, 4, 3], [0, 6, 17], undefined, { all: ivory }, {
    parent: "jaw", voxels: lowerTeeth.map(([x, y, z, ...size]) => [x, y - 6, z - 17, ...size])
  }));
  // Put the neutral feet on the ground before scaling the detailed rig up.
  for (const p of parts) if (!p.parent) p.pivot[1] -= 2;
  species[REX] = {
    name: "Tyrannosaurus", tyrannosaurus: true, hostile: true, persist: true,
    hp: 135, scale: REX_SCALE, w: 2.35 * REX_SCALE, h: TYRANNOSAURUS_HEIGHT, speed: 3.8, dmg: 12, reach: 3.65,
    xp: 25, sound: "roar", drops: () => [[I.BONE, 8]],
    model: { type: "tyrannosaurus", parts }
  };
}

export function populateTyrannosaurus(manager, { cx, cz }) {
  if (cx !== 0 || cz !== 1) return;
  const [x, y, z] = REX_HOME, world = manager.world;
  if (SOLID[world.id(Math.floor(x), y - 1, Math.floor(z))] &&
      Array.from({ length: TYRANNOSAURUS_HEIGHT }, (_, dy) => dy).every(dy => !SOLID[world.id(Math.floor(x), y + dy, Math.floor(z))])) {
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
  p.tail.rotation.x = 0.18;
  p.tailMid.rotation.y = gait * 0.25;
  p.tailTip.rotation.y = gait * 0.32;
  p.jaw.rotation.x = e.rexBite ? 0.72 : 0.06;
  p.head.rotation.x = e.rexBite ? -0.18 : gait * 0.06;
}
