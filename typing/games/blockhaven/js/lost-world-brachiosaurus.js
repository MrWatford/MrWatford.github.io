import { B, I, SOLID } from "./blocks.js";

const BRACHIO = "lost_world_brachiosaurus";
const hide = P => {
  P.fill(["#69785a"]);
  for (let y = 0; y < 14; y += 2) for (let x = y % 3; x < 16; x += 3) P.px(x, y, (x + y) % 2 ? "#849371" : "#56664f");
  P.rect(0, 12, 16, 4, "#8f9770");
};
const belly = P => { P.fill(["#a2a685"]); P.rect(0, 12, 16, 2, "#788663"); };
const face = P => {
  hide(P);
  P.rect(7, 4, 4, 3, "#393d31");
  P.rect(8, 5, 2, 1, "#e9c780");
};
const foot = P => { hide(P); P.rect(0, 11, 16, 5, "#414f43"); };
const part = (name, size, pivot, off, paint = { all: hide }, extras) => ({ name, size, pivot, off, paint, ...extras });

export function installBrachiosaurus(species) {
  const parts = [
    part("body", [39, 29, 64], [0, 42, 0], [0, 0, 0], { all: hide, bottom: belly }),
    part("shoulder", [38, 31, 28], [0, 46, 20], [0, 0, 0]),
    part("neck", [19, 36, 22], [0, 47, 25], [0, 17, 2], { all: hide, front: belly }, { rotation: [0.24, 0, 0] }),
    part("upperNeck", [13, 30, 16], [0, 16, 0], [0, 13, 0], undefined, { parent: "neck" }),
    part("head", [14, 11, 22], [0, 14, 0], [0, 0, 7], { all: hide, left: face, right: face }, { parent: "upperNeck" }),
    part("jaw", [10, 4, 15], [0, -4, 2], [0, -1, 2], { all: belly }, { parent: "head" }),
    part("tail", [16, 15, 26], [0, 40, -28], [0, -3, -11]),
    part("tailTip", [8, 6, 25], [0, -2, -11], [0, -3, -10], undefined, { parent: "tail" })
  ];
  for (const side of [-1, 1]) for (const end of [-1, 1]) {
    const front = end === 1;
    parts.push(part(`leg${side}${end}`, [10, front ? 40 : 33, 12],
      [side * 14, front ? 41 : 34, end * 21], [0, front ? -20 : -16, 0], { all: foot }));
  }
  species[BRACHIO] = {
    brachiosaurus: true, name: "Brachiosaurus", animal: true, food: [], persist: true,
    hp: 84, w: 2.2, h: 7, speed: 1.25, sound: "grunt",
    xp: 6, drops: () => [[I.BONE, 3]], model: { type: "brachiosaurus", parts }
  };
}

export function populateBrachiosaurus(manager, { cx, cz }) {
  const w = manager.world;
  const sites = cx === 0 && cz === 0 ? [[9.5, 13.5]] : cx === 0 && cz === 1 ? [[12.5, 19.5]] : cx === 1 && cz === 1 ? [[17.5, 20.5]] : [];
  for (const [x, z] of sites) {
    const { h } = w.gen.column(x, z);
    if (!SOLID[w.id(Math.floor(x), h, Math.floor(z))]) continue;
    const clear = Array.from({ length: 8 }, (_, i) => w.id(Math.floor(x), h + i + 1, Math.floor(z))).every(id => !SOLID[id] && id !== B.WATER);
    if (clear) manager.add(BRACHIO, x, h + 1, z, { home: [x, h + 1, z], yaw: Math.PI / 2 });
  }
}

export function thinkBrachiosaurus(manager, e, distance) {
  const w = manager.world;
  const [hx, hy, hz] = Array.isArray(e.home) && e.home.length === 3 && e.home.every(Number.isFinite) ? e.home : [e.pos.x, e.pos.y, e.pos.z];
  const phase = Math.sin(e.age * 0.18 + hx);
  e.browsing = phase < -0.28;
  if (e.browsing) { e.goal = e.path = null; return; }
  const x = hx + phase * 1.8, z = hz + Math.cos(e.age * 0.16 + hz) * 2.3;
  const ground = w.id(Math.floor(x), hy - 1, Math.floor(z));
  if (ground === B.GRASS || ground === B.DIRT || ground === B.HAY) {
    manager.moveTo(e, { x, y: hy, z }, e.def.speed * (distance < 4 ? 0.48 : 0.75), 0.5);
  } else manager.moveTo(e, { x: hx, y: hy, z: hz }, e.def.speed * 0.62, 0.6);
}

export function animateBrachiosaurus(e, swing, reducedMotion) {
  const p = e.parts;
  const step = swing * (reducedMotion ? 0.23 : 0.43);
  for (const side of [-1, 1]) for (const end of [-1, 1]) p[`leg${side}${end}`].rotation.x = step * side * end;
  p.tail.rotation.y = -step * 0.9;
  p.tailTip.rotation.y = step * 0.5;
  const neck = e.browsing ? 0.5 : 0.24;
  p.neck.rotation.x += (neck - p.neck.rotation.x) * 0.1;
  p.upperNeck.rotation.y = reducedMotion ? 0 : Math.sin(e.age * 0.9) * 0.19;
  p.head.rotation.x = e.browsing ? -0.21 : -0.09;
  p.jaw.rotation.x = e.browsing && !reducedMotion ? (1 + Math.sin(e.age * 6)) * 0.12 : 0;
}
