import { B, I, SEA, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";

const SPINO = "lost_world_spinosaurus", MOSQUITO = "lost_world_mosquito";
const scales = P => {
  P.fill(["#487267"]);
  for (let y = 1; y < 14; y += 2) for (let x = y % 3; x < 16; x += 3) P.px(x, y, "#304e48");
  P.rect(0, 12, 16, 4, "#859a7c");
};
const sail = P => {
  P.fill(["#8b543f"]);
  P.rect(0, 4, 16, 8, "#b87754");
  for (const x of [1, 5, 9, 13]) P.rect(x, 0, 1, 16, "#633e39");
};
const eye = P => {
  scales(P);
  P.rect(5, 4, 3, 2, "#f0bc6a");
  P.px(6, 4, "#242521");
};
const chitin = P => { P.fill(["#402d35"]); P.rect(0, 2, 16, 3, "#895b4d"); };
const wing = P => {
  P.clear();
  for (let y = 1; y < 15; y++) {
    const inset = Math.floor(Math.abs(8 - y) / 2);
    P.rect(inset, y, 16 - inset * 2, 1, "rgba(203,227,220,0.68)");
  }
  P.rect(2, 7, 12, 1, "#829e9f");
};
const part = (name, size, pivot, off, paint, extra) => ({ name, size, pivot, off, paint: { all: paint }, ...extra });

export function installWetlandCreatures(species) {
  const spinoParts = [
    part("body", [27, 23, 43], [0, 20, 0], [0, 0, 0], scales),
    part("neck", [15, 18, 17], [0, 21, 19], [0, 4, 4], scales, { rotation: [-0.25, 0, 0] }),
    part("head", [14, 13, 22], [0, 30, 29], [0, 0, 7], scales, { paint: { all: scales, left: eye, right: eye } }),
    part("jaw", [10, 4, 22], [0, 24, 28], [0, 0, 8], scales),
    part("sailFront", [4, 27, 15], [0, 31, 10], [0, 12, 0], sail, { taperTop: true }),
    part("sailBack", [4, 30, 20], [0, 31, -5], [0, 13, 0], sail, { taperTop: true }),
    part("tail", [14, 16, 23], [0, 18, -19], [0, 0, -10], scales),
    part("tailMid", [8, 15, 18], [0, 0, -11], [0, 0, -8], scales, { parent: "tail" }),
    part("tailTip", [4, 12, 15], [0, 0, -8], [0, 0, -6], scales, { parent: "tailMid" })
  ];
  for (const side of [-1, 1]) {
    spinoParts.push(part("leg" + side, [9, 14, 13], [side * 11, 14, -5], [side * 2, -6, -1], scales));
    spinoParts.push(part("arm" + side, [5, 13, 7], [side * 9, 17, 17], [side * 2, -5, 2], scales));
  }
  species[SPINO] = {
    wetlandPredator: true, name: "Spinosaurus", hostile: true, swims: true, persist: true,
    hp: 64, w: 1.8, h: 2.35, speed: 3.4, dmg: 8, reach: 3.0, sound: "roar",
    xp: 10, drops: () => [[I.BONE, 3]], model: { type: "spinosaurus", parts: spinoParts }
  };

  const mosquitoParts = [
    part("body", [6, 5, 8], [0, 5, 0], [0, 0, 0], chitin),
    part("abdomen", [6, 5, 13], [0, 5, -5], [0, 0, -5], chitin),
    part("head", [6, 6, 5], [0, 6, 5], [0, 0, 0], chitin),
    part("proboscis", [2, 2, 9], [0, 5, 7], [0, 0, 4], chitin)
  ];
  for (const side of [-1, 1]) {
    mosquitoParts.push(part("wing" + side, [13, 1, 10], [side * 3, 8, 0], [side * 6, 0, -1], wing));
    for (let foot = 0; foot < 3; foot++) mosquitoParts.push(
      part(`leg${side}${foot}`, [9, 2, 2], [side * 2, 3, 3 - foot * 4], [side * 4, -1, 0], chitin,
        { rotation: [0, 0, -side * 0.46] }));
  }
  species[MOSQUITO] = {
    wetlandPredator: true, name: "Giant Mosquito", hostile: true, flies: true, persist: true,
    hp: 7, w: 0.6, h: 0.65, speed: 3.3, dmg: 2, reach: 1.5, sound: "buzz", translucent: true,
    xp: 2, drops: () => [], model: { type: "mosquito", parts: mosquitoParts }
  };
}

export function populateWetlandCreatures(manager, { cx, cz }) {
  const world = manager.world;
  if (cx === 0 && cz === 0 && world.id(10, SEA - 2, 13) === B.WATER) {
    const home = [10.5, SEA - 2, 13.5];
    manager.add(SPINO, ...home, { home, yaw: Math.PI / 2 });
  }
  if (cx === 0 && cz === 1 || cx === -1 && cz === 0) {
    const z = cz === 1 ? 23 : 6, x = cx === 0 ? 3 : -5;
    for (const dx of [0, 2]) {
      if (SOLID[world.id(x + dx, SEA + 4, z)]) continue;
      const home = [x + dx + 0.5, SEA + 4, z + 0.5];
      manager.add(MOSQUITO, ...home, { home });
    }
  }
}

export function thinkWetlandPredator(manager, e, distance, damageMultiplier) {
  const world = manager.world, player = manager.ctx.player(), p = player.pos, def = e.def;
  const spino = e.sp === SPINO;
  const [hx, hy, hz] = Array.isArray(e.home) && e.home.length === 3 && e.home.every(Number.isFinite) ? e.home : [e.pos.x, e.pos.y, e.pos.z];
  const water = (x, y, z) => world.id(Math.floor(x), Math.floor(y), Math.floor(z)) === B.WATER;
  const targetWater = water(p.x, p.y + 0.15, p.z);
  const depth = SEA - 2;
  const canHunt = manager.targetable() && (!spino || (targetWater && water(p.x, depth, p.z))) &&
    Math.hypot(hx - p.x, hz - p.z) < (spino ? 21 : 13);
  const sees = canHunt && distance < (spino ? 15 : 10) && manager.canSeePlayer(e);
  const inRange = sees && distance < def.reach && Math.abs(e.pos.y + def.h * 0.65 - p.y - 0.8) < (spino ? 1.8 : 1.1);
  if (e.wetlandStrike) {
    if (canHunt && e.age < e.wetlandStrike) return;
    const angle = Math.atan2(e.pos.x - p.x, e.pos.z - p.z);
    if (inRange && Math.cos(e.yaw - angle) > 0.45) {
      manager.ctx.hurtPlayer(def.dmg * damageMultiplier, spino ? "A Spinosaurus caught you in the river!" : "A Giant Mosquito bit you!", e);
    }
    e.wetlandStrike = 0;
    e.attackCd = spino ? 1.8 : 2.4;
    return;
  }
  if (inRange && e.attackCd <= 0) {
    e.goal = e.path = null;
    e.yaw = Math.atan2(e.pos.x - p.x, e.pos.z - p.z);
    e.wetlandStrike = e.age + (spino ? 0.64 : 0.42);
    Sound.mob(spino ? "roar" : "buzz", distance);
    return;
  }
  if (sees && (!spino && e.attackCd <= 0 || spino && !inRange)) {
    e.goal = { x: p.x, y: spino ? depth : p.y + 0.9, z: p.z, speed: def.speed };
    return;
  }
  const a = e.age * (spino ? 0.23 : 0.85) + hx;
  const x = hx + Math.sin(a) * (spino ? 4 : 2);
  const z = hz + Math.cos(a) * (spino ? 1.1 : 2);
  const y = hy + (spino ? 0 : Math.sin(a * 0.7) * 0.7);
  e.goal = !spino || water(x, y, z) ? { x, y, z, speed: def.speed * 0.62 } : null;
}

export function animateWetlandPredator(e, swing, reducedMotion) {
  const p = e.parts;
  if (e.sp === SPINO) {
    const s = Math.sin(e.walkPhase * 0.85) * (reducedMotion ? 0.10 : 0.26);
    p.tail.rotation.y = s;
    p.tailMid.rotation.y = s * 0.76;
    p.tailTip.rotation.y = s * 0.58;
    p.leg1.rotation.x = swing * 0.22;
    p["leg-1"].rotation.x = -swing * 0.22;
    p.jaw.rotation.x = e.wetlandStrike ? 0.56 : 0.02;
  } else {
    const beat = reducedMotion ? 0.16 : Math.sin(e.age * 34) * 0.68;
    p.wing1.rotation.z = beat;
    p["wing-1"].rotation.z = -beat;
    e.root.rotation.x = e.wetlandStrike ? 0.32 : 0;
  }
}
