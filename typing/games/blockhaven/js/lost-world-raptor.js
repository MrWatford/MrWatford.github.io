import { B, I, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

const skin = P => {
  P.fill(["#527560"]);
  for (let y = 1; y < 12; y += 2) for (let x = y % 3; x < 16; x += 3) {
    P.px(x, y, (x + y) % 2 ? "#62846a" : "#476352");
  }
  for (const x of [1, 7, 13]) {
    P.rect(x, 0, 2, 6, "#243f39");
    P.rect(x + 1, 5, 1, 4, "#34554b");
  }
  P.rect(0, 12, 16, 4, "#8d9872");
};
const face = P => {
  skin(P);
  P.rect(9, 3, 5, 5, "#253731");
  P.rect(10, 4, 3, 3, "#ffc56c");
  P.rect(11, 4, 1, 3, "#241b1b");
  P.rect(2, 8, 2, 1, "#263731");
};
const mirrorFace = P => {
  skin(P);
  P.rect(2, 3, 5, 5, "#253731");
  P.rect(3, 4, 3, 3, "#ffc56c");
  P.rect(4, 4, 1, 3, "#241b1b");
  P.rect(12, 8, 2, 1, "#263731");
};
const ivory = P => P.fill(["#e9dcb0", "#c5b891"]);
const part = (name, size, pivot, off, paint = { all: skin }, parent) => ({ name, size, pivot, off, paint, parent });

export function installLostWorldRaptor(species) {
  const parts = [
    part("body", [12, 12, 21], [0, 16, 0], [0, 0, 0]),
    part("neck", [8, 12, 9], [0, 21, 9], [0, 2, 1]),
    part("head", [10, 8, 11], [0, 29, 13], [0, 0, 3], { all: skin, left: face, right: mirrorFace }),
    part("snout", [8, 4, 9], [0, 29, 21], [0, -1, 3]),
    part("jaw", [8, 3, 13], [0, 26, 15], [0, 0, 6]),
    part("teethL", [1, 1, 10], [-3, 2, 0], [0, 0, 0], { all: ivory }, "jaw"),
    part("teethR", [1, 1, 10], [3, 2, 0], [0, 0, 0], { all: ivory }, "jaw"),
    part("tail", [8, 8, 14], [0, 17, -9], [0, 0, -6]),
    part("tailMid", [5, 5, 12], [0, 0, -6], [0, 0, -5], undefined, "tail"),
    part("tailTip", [2, 3, 10], [0, 0, -6], [0, 0, -4], undefined, "tailMid")
  ];
  for (const [side, x] of [["L", -1], ["R", 1]]) {
    parts.push(part("thigh" + side, [6, 10, 7], [x * 5, 16, 0], [x, -3, 1]));
    parts.push(part("shin" + side, [4, 9, 4], [0, -4, -1], [0, -3, 0], undefined, "thigh" + side));
    parts.push(part("foot" + side, [5, 2, 8], [0, -4, 0], [0, 0, 2], undefined, "shin" + side));
    parts.push(part("claw" + side, [2, 2, 4], [x, 1, 3], [0, 0, 0], { all: ivory }, "foot" + side));
    parts.push(part("arm" + side, [3, 6, 4], [x * 4, 19, 9], [x, -2, 1]));
  }
  species.lost_world_raptor = {
    name: "Jungle Raptor", lostWorldRaptor: true, hostile: true, persist: true,
    hp: 22, speed: 3.7, w: 0.85, h: 2.05, ai: "lost_world_raptor", dmg: 5, reach: 2.2,
    xp: 6, sound: "chitter", drops: () => [[I.BONE, 2], [I.STRING, 2]],
    model: { type: "raptor", parts }
  };
}

export function populateLostWorld(manager, chunk) {
  const world = manager.world;
  const home = world.gen.raptorSite(chunk.cx, chunk.cz);
  if (!home) return;
  const [x, y, z] = home.map(Math.floor);
  if (SOLID[world.id(x, y - 1, z)] && [0, 1, 2].every(dy => world.id(x, y + dy, z) !== B.WATER && !SOLID[world.id(x, y + dy, z)])) {
    manager.add("lost_world_raptor", ...home, { home });
  }
}

export function thinkLostWorldRaptor(manager, e, distance, damageMultiplier) {
  const player = manager.ctx.player(), target = player.pos, def = e.def;
  const home = e.home;
  const [hx, hy, hz] = Array.isArray(home) && home.length === 3 && home.every(Number.isFinite) ? home : [e.pos.x, e.pos.y, e.pos.z];
  const inTerritory = Math.hypot(target.x - hx, target.z - hz) < 23;
  const canHunt = manager.targetable() && inTerritory;
  const sees = canHunt && distance < 17 && manager.canSeePlayer(e);
  const inBiteRange = distance < def.reach && Math.abs(target.y - e.pos.y) < 1.4;
  if (e.raptorBite) {
    if (canHunt && e.age < e.raptorBite) return;
    const facing = Math.atan2(-(target.x - e.pos.x), -(target.z - e.pos.z)) - e.yaw;
    if (sees && inBiteRange && Math.cos(facing) > 0.5) {
      manager.ctx.hurtPlayer(def.dmg * damageMultiplier, "A Jungle Raptor bit you!", e);
    }
    e.raptorBite = 0;
    e.attackCd = 1.15;
    return;
  }
  if (sees) e.raptorTrail = { ...target, expires: e.age + 3 };
  if (sees && inBiteRange) {
    e.goal = e.path = null;
    e.yaw = Math.atan2(-(target.x - e.pos.x), -(target.z - e.pos.z));
    if (e.attackCd <= 0) {
      e.raptorBite = e.age + 0.48;
      Sound.mob("chitter", distance);
    }
    return;
  }
  if (canHunt && e.raptorTrail?.expires > e.age) {
    const speed = sees && distance < 9 ? def.speed : def.speed * 0.62;
    manager.moveTo(e, e.raptorTrail, speed);
    return;
  }
  if (e.raptorTrail) { e.raptorTrail = null; e.goal = e.path = null; }
  if (Math.hypot(e.pos.x - hx, e.pos.z - hz) > 8) manager.moveTo(e, { x: hx, y: hy, z: hz }, def.speed * 0.55);
  else manager.wander(e);
}

export function animateLostWorldRaptor(e, swing, reducedMotion) {
  const p = e.parts;
  const gait = swing * (reducedMotion ? 0.6 : 1);
  p.thighL.rotation.x = gait;
  p.thighR.rotation.x = -gait;
  p.shinL.rotation.x = -Math.max(0, gait) * 0.65;
  p.shinR.rotation.x = -Math.max(0, -gait) * 0.65;
  p.tail.rotation.y = -gait * 0.22;
  p.tailMid.rotation.y = -gait * 0.26;
  p.tailTip.rotation.y = -gait * 0.21;
  p.armL.rotation.x = -0.45 - gait * 0.2;
  p.armR.rotation.x = -0.45 + gait * 0.2;
  p.jaw.rotation.x = e.raptorBite ? 0.58 : 0.04;
}
