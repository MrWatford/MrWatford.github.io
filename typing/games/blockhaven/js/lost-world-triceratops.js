import { B, CHUNK, I, SOLID } from "./blocks.js";

const TRICERATOPS = "lost_world_triceratops";
const hide = P => {
  P.fill(["#866f4a"]);
  for (let y = 0; y < 13; y += 2) for (let x = y % 3; x < 16; x += 3) {
    P.px(x, y, (x + y) % 2 ? "#a48a61" : "#66553d");
  }
  P.rect(0, 13, 16, 3, "#b69a70");
};
const frill = P => {
  P.fill(["#563f32"]);
  P.rect(2, 2, 12, 12, "#ad7852");
  P.rect(4, 4, 8, 9, "#755340");
  for (const x of [2, 6, 10, 13]) P.rect(x, 2, 1, 7, "#d6a474");
};
const face = P => {
  hide(P);
  P.rect(6, 3, 4, 3, "#3d3128");
  P.rect(7, 4, 2, 1, "#f6cd85");
};
const ivory = P => { P.fill(["#e5d8ae"]); P.rect(0, 12, 16, 4, "#9a795a"); };
const hoof = P => { hide(P); P.rect(0, 11, 16, 5, "#473e35"); };
const part = (name, size, pivot, off, paint = { all: hide }, extras) => ({ name, size, pivot, off, paint, ...extras });

export function installTriceratops(species) {
  const parts = [
    part("body", [27, 23, 43], [0, 25, 0], [0, 0, 0]),
    part("shoulder", [29, 25, 18], [0, 27, 12], [0, 0, 0]),
    part("head", [17, 15, 18], [0, 26, 20], [0, 0, 8], { all: hide, left: face, right: face }),
    part("frill", [30, 26, 6], [0, 9, -9], [0, 0, 0], { all: frill }, { parent: "head", taperTop: true, rotation: [-0.26, 0, 0] }),
    part("beak", [11, 8, 10], [0, -4, 9], [0, 0, 3], { all: hoof }, { parent: "head" }),
    part("noseHorn", [5, 10, 5], [0, 3, 11], [0, 3, 0], { all: ivory }, { parent: "head", taperTop: true, rotation: [0.25, 0, 0] }),
    part("tail", [12, 12, 18], [0, 26, -19], [0, -3, -6], undefined, { rotation: [-0.18, 0, 0] }),
    part("tailTip", [6, 6, 16], [0, 0, -8], [0, -1, -6], undefined, { parent: "tail" })
  ];
  for (const side of [-1, 1]) {
    parts.push(part("browHorn" + side, [6, 18, 6], [side * 6, 5, 5], [0, 6, 0], { all: ivory },
      { parent: "head", taperTop: true, rotation: [0.69, 0, -side * 0.19] }));
    for (const end of [-1, 1]) {
      parts.push(part(`leg${side}${end}`, [9, 18, 10], [side * 10, 17, end * 14], [0, -8, 0], { all: hoof }));
    }
  }
  species[TRICERATOPS] = {
    name: "Triceratops", triceratops: true, animal: true, food: [], persist: true,
    hp: 44, speed: 2.1, w: 1.65, h: 2.65, ai: "triceratops",
    sound: "grunt", xp: 4, drops: () => [[I.BONE, 2], [I.LEATHER, 2]],
    model: { type: "triceratops", parts }
  };
}

// Herds belong to fixed chunks, so a revisit never creates another set.
export function populateTriceratops(manager, chunk) {
  const { cx, cz } = chunk;
  if (cx !== 0 || ![0, 2].includes(cz)) return;
  const world = manager.world;
  for (const [x, z] of [[7, 9], [10, 11], [13, 8]]) {
    const wz = cz * CHUNK + z;
    const { h } = world.gen.column(x, wz);
    if (world.id(x, h + 1, wz) === B.WATER || [0, 1, 2].some(dy => SOLID[world.id(x, h + 1 + dy, wz)])) continue;
    const home = [x + 0.5, h + 1, wz + 0.5];
    manager.add(TRICERATOPS, ...home, { home, yaw: Math.PI });
  }
}

export function thinkTriceratops(manager, e, distance) {
  const player = manager.ctx.player(), world = manager.world;
  const nearby = manager.near(e.pos.x, e.pos.y, e.pos.z, 7, other => other.def.triceratops && other !== e);
  const startled = manager.targetable() && (e.trikeAlarmUntil > e.age || distance < 3 || nearby.some(other => other.trikeAlarmUntil > other.age));
  const [hx, hy, hz] = Array.isArray(e.home) && e.home.length === 3 && e.home.every(Number.isFinite) ? e.home : [e.pos.x, e.pos.y, e.pos.z];
  e.grazing = !startled && Math.floor(manager.ctx.time() * 160) % 4 === 0;
  if (e.grazing) { e.goal = e.path = null; return; }

  // Each animal keeps its initial side-to-side spacing while the herd moves along the meadow.
  const route = Math.sin(manager.ctx.time() * Math.PI * 8);
  let x = hx + route * 3, z = hz + route * 5;
  const awayX = e.pos.x - player.pos.x, awayZ = e.pos.z - player.pos.z;
  if (startled && Math.hypot(e.pos.x - hx, e.pos.z - hz) < 13) {
    const length = Math.hypot(awayX, awayZ) || 1;
    x = e.pos.x + awayX / length * 5;
    z = e.pos.z + awayZ / length * 5;
  }
  const gx = Math.floor(x), gz = Math.floor(z);
  let ground = world.surfaceY(gx, gz);
  while ([B.TALL_GRASS, B.FLOWER_YELLOW, B.BERRY_BUSH].includes(world.id(gx, ground, gz))) ground--;
  const valid = world.isLoaded(x, z) && SOLID[world.id(gx, ground, gz)] && world.id(gx, ground, gz) !== B.LEAVES;
  manager.moveTo(e, valid ? { x, y: ground + 1, z } : { x: hx, y: hy, z: hz }, e.def.speed * (startled ? 1.6 : 0.62));
}

export function animateTriceratops(e, swing, reducedMotion) {
  const p = e.parts;
  const step = swing * (reducedMotion ? 0.28 : 0.46);
  for (const side of [-1, 1]) for (const end of [-1, 1]) p[`leg${side}${end}`].rotation.x = step * side * end;
  p.tail.rotation.y = step * 0.6;
  p.head.rotation.x = e.grazing ? 0.39 : Math.abs(step) * 0.16;
}
