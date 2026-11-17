import { GODZILLA_ID, GODZILLA_NAME, GODZILLA_HP } from "./godzilla-encounter.js";

const hide = P => {
  P.fill(["#343840"]);
  for (let y = 1; y < 15; y += 2) for (let x = y % 4; x < 16; x += 4) P.rect(x, y, 2, 1, (x + y) % 3 ? "#505661" : "#232733");
  P.rect(0, 14, 16, 2, "#232831");
};
const belly = P => { hide(P); for (const y of [2, 6, 10]) P.rect(0, y, 16, 1, "#74727b"); };
const plate = P => {
  P.fill(["#394654"]);
  P.rect(4, 1, 8, 8, "#718da3");
  P.rect(6, 0, 4, 6, "#9fc0d2");
  P.rect(2, 11, 12, 1, "#4c6379");
};
const eye = P => {
  hide(P);
  P.rect(5, 3, 7, 4, "#201f22");
  P.rect(7, 4, 4, 2, "#ffb55d");
  P.px(9, 4, "#12131a");
};
const ivory = P => P.fill(["#d3ccb6"]);
const part = (name, size, pivot, off, paint = { all: hide }, extra) => ({ name, size, pivot, off, paint, ...extra });

export function installGodzilla(species) {
  const parts = [
    part("hips", [67, 53, 64], [0, 87, 0], [0, 0, 0]),
    part("body", [76, 82, 60], [0, 126, 4], [0, 0, 0], { all: hide, front: belly }),
    part("shoulders", [82, 42, 58], [0, 159, 11], [0, 0, 0]),
    part("neck", [52, 45, 46], [0, 174, 17], [0, 6, 9], { all: hide, front: belly }),
    part("head", [55, 38, 64], [0, 203, 27], [0, 0, 14], { all: hide, right: eye, left: eye }),
    part("brow", [56, 12, 47], [0, 215, 39], [0, 0, 0]),
    part("jaw", [49, 16, 59], [0, 186, 23], [0, 0, 19]),
    part("tail", [45, 40, 65], [0, 77, -23], [0, -9, -31]),
    part("tailMid", [34, 30, 58], [0, -5, -28], [0, -3, -25], undefined, { parent: "tail" }),
    part("tailEnd", [22, 21, 59], [0, -3, -23], [0, 1, -24], undefined, { parent: "tailMid" }),
    part("tailTip", [12, 12, 53], [0, 1, -24], [0, 4, -21], undefined, { parent: "tailEnd" })
  ];
  for (const [i, y, z, height, width] of [[0, 91, -38, 44, 29], [1, 117, -38, 49, 33], [2, 143, -37, 48, 35], [3, 167, -28, 40, 27], [4, 188, -20, 27, 21]]) {
    parts.push(part("plate" + i, [width, height, 17], [0, y, z], [0, 6, 0], { all: plate }, { taperTop: true, rotation: [-0.6, 0, 0] }));
  }
  for (const side of [-1, 1]) {
    parts.push(part("thigh" + side, [33, 62, 44], [side * 25, 96, 2], [0, -27, 0]));
    parts.push(part("shin" + side, [29, 47, 32], [0, -23, 0], [0, -21, 0], undefined, { parent: "thigh" + side }));
    parts.push(part("foot" + side, [34, 16, 59], [0, -17, 0], [0, 0, 15], undefined, { parent: "shin" + side }));
    for (const offset of [-9, 0, 9]) {
      parts.push(part(`claw${side},${offset}`, [7, 7, 13], [offset, -2, 29], [0, 0, 0], { all: ivory }, { parent: "foot" + side }));
    }
    parts.push(part("arm" + side, [22, 40, 25], [side * 39, 151, 11], [side * 2, -17, 4], undefined, { rotation: [-0.37, 0, side * 0.17] }));
    parts.push(part("hand" + side, [20, 19, 29], [0, -14, 6], [0, -2, 5], undefined, { parent: "arm" + side }));
    parts.push(part("jawTeeth" + side, [5, 5, 47], [side * 17, 8, 4], [0, 0, 0], { all: ivory }, { parent: "jaw" }));
  }
  species[GODZILLA_ID] = {
    godzilla: true, name: GODZILLA_NAME, boss: true, hostile: true, static: true, fireproof: true, noSave: true,
    hp: GODZILLA_HP, w: 5.7, h: 14.1, speed: 0, sound: "roar", drops: () => [],
    model: { type: "godzilla", parts }
  };
}

export function animateGodzilla(e, reducedMotion) {
  const p = e.parts, charged = e.atomicCharge, firing = e.atomicFiring;
  const bend = firing ? 0.36 : charged ? -0.15 : 0;
  p.head.rotation.x += (bend - p.head.rotation.x) * 0.16;
  p.jaw.rotation.x = firing ? 0.64 : charged ? 0.31 : 0.08;
  p.arm1.rotation.x = -0.37 - (firing ? 0.29 : 0);
  p["arm-1"].rotation.x = p.arm1.rotation.x;
  const sway = reducedMotion ? 0 : Math.sin(e.age * 0.77) * 0.14;
  p.tail.rotation.y = sway;
  p.tailMid.rotation.y = sway * 0.75;
  p.tailEnd.rotation.y = -sway * 0.65;
}
