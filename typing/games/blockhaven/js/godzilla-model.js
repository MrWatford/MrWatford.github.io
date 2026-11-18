import { GODZILLA_ID, GODZILLA_NAME, GODZILLA_HP } from "./godzilla-encounter.js";
import { reptileSurface, reptileTail } from "./lost-world-model-geometry.js";

export const GODZILLA_HEIGHT = 24;
// The detailed rig stands 13.85 blocks tall before its encounter scale is applied.
const GODZILLA_SCALE = GODZILLA_HEIGHT / 13.85;

const hide = P => {
  P.fill(["#525d67"]);
  for (let y = 0; y < 16; y += 4) {
    const shift = y % 8 ? 2 : 0;
    for (let x = shift; x < 16; x += 5) {
      P.rect(x, y, Math.min(4, 16 - x), 3, (x + y) % 3 ? "#5b6670" : "#4a555f");
      P.px(Math.min(x + 1, 15), y, "#68747d");
    }
  }
};
const belly = P => {
  P.fill(["#737c81"]);
  for (let y = 1; y < 15; y += 5) {
    for (let x = y % 3; x < 15; x += 6) {
      P.rect(x, y, 2, 2, (x + y) % 2 ? "#7e878a" : "#65747b");
    }
  }
};
const plate = P => {
  P.fill(["#105b83"]);
  P.rect(2, 0, 12, 14, "#188fc1");
  P.rect(4, 0, 8, 12, "#34d4f2");
  P.rect(6, 0, 4, 10, "#a4f6ff");
  P.rect(0, 14, 16, 2, "#173947");
};
const ivory = P => {
  P.fill(["#cecbb9"]);
  P.rect(3, 0, 9, 11, "#f2e9d1");
  P.rect(0, 12, 16, 4, "#938f82");
};
const mouth = P => {
  P.fill(["#0c3448"]);
  P.rect(3, 2, 10, 11, "#2a97bd");
};
const socket = P => P.fill(["#18252c"]);
const eye = P => {
  P.fill(["#31c7f3"]);
  P.rect(5, 3, 7, 8, "#c3f8ff");
  P.rect(9, 4, 2, 7, "#f2fdff");
};
const skin = { all: hide, front: belly };
const part = (name, size, pivot, off = [0, 0, 0], paint = { all: hide }, extra) =>
  ({ name, size, pivot, off, paint, ...extra });
const scaled = (name, size, pivot, off, paint = { all: hide }, extra) =>
  part(name, size, pivot, off, paint, { voxels: reptileSurface(size, 7, 1.5), voxelShell: true, ...extra });
const tail = (name, length, sections, pivot, off, parent) => {
  const { size, voxels } = reptileTail(length, sections, 8, 1.7);
  return part(name, size, pivot, off, { all: hide }, { voxels, ...(parent ? { parent } : {}) });
};

function dorsalPlate(name, pivot, height, width, parent) {
  height *= 1.35;
  width *= 1.35;
  const voxels = [
    [0, height * 0.15, 0, width * 0.34, height * 0.84, 8],
    [0, height * 0.53, 0, width * 0.16, height * 0.2, 7],
    [-width * 0.23, height * 0.04, 0, width * 0.25, height * 0.53, 9],
    [width * 0.23, height * 0.04, 0, width * 0.25, height * 0.53, 9],
    [-width * 0.38, -height * 0.16, 0, width * 0.24, height * 0.25, 10],
    [width * 0.38, -height * 0.16, 0, width * 0.24, height * 0.25, 10],
    [-width * 0.23, height * 0.3, 0, width * 0.1, height * 0.12, 7],
    [width * 0.23, height * 0.3, 0, width * 0.1, height * 0.12, 7]
  ];
  return part(name, [width * 0.67, height * 0.28, 11], pivot, [0, 0, 0],
    { all: plate }, { voxels, fullbright: true, rotation: [0, Math.PI / 2, 0], ...(parent ? { parent } : {}) });
}

export function installGodzilla(species) {
  const parts = [
    scaled("hips", [83, 64, 72], [0, 87, -1], [0, 0, 0], skin),
    scaled("body", [79, 88, 68], [0, 121, 5], [0, 0, 0], skin),
    scaled("chest", [67, 68, 57], [0, 151, 11], [0, 0, 0], skin),
    scaled("shoulders", [72, 35, 52], [0, 163, 13], [0, 0, 0]),
    scaled("neck", [45, 43, 43], [0, 177, 19], [0, 0, 0], skin),
    scaled("throat", [37, 31, 33], [0, 177, 33], [0, 0, 0], skin),
    scaled("head", [44, 27, 43], [0, 201, 27], [0, 0, 0], { all: hide }),
    scaled("snout", [39, 21, 31], [0, 0, 25], [0, 0, 0], { all: hide }, { parent: "head" }),
    part("crown", [45, 14, 26], [0, 10, -8], [0, 0, 0], { all: hide }, {
      parent: "head", voxels: [[0, 8, -6, 29, 5, 19], [-17, 5, 1, 8, 7, 22], [17, 5, 1, 8, 7, 22]]
    }),
    part("mouth", [33, 11, 2], [0, -12, 39], [0, 0, 0], { all: mouth }, { parent: "head", fullbright: true }),
    scaled("jaw", [36, 12, 44], [0, -13, 3], [0, -6, 17], skin, { parent: "head" }),
    tail("tail", 78, [[52, 43], [40, 34], [28, 24]], [0, 87, -24], [0, -14, -34]),
    tail("tailMid", 78, [[40, 32], [31, 26], [22, 20]], [0, -11, -34], [0, -10, -33], "tail"),
    tail("tailEnd", 69, [[29, 24], [22, 19], [14, 13]], [0, -10, -33], [0, -8, -30], "tailMid"),
    tail("tailTip", 65, [[18, 15], [12, 11], [7, 7]], [0, -8, -29], [0, -6, -27], "tailEnd"),
    part("tailPoint", [9, 9, 49], [0, -4, -28], [0, -1, -20], { all: hide }, { parent: "tailTip" })
  ];

  const upperTeeth = [], lowerTeeth = [];
  for (const side of [-1, 1]) {
    parts.push(scaled("cheek" + side, [12, 21, 24], [side * 19, -3, -1], undefined,
      { all: hide }, { parent: "head" }));
    parts.push(part("eyeSocket" + side, [3, 8, 13], [side * 23, 4, 13], undefined,
      { all: socket }, { parent: "head" }));
    parts.push(part("eye" + side, [2, 3, 7], [side * 24.6, 4, 16], undefined,
      { all: eye }, { parent: "head", fullbright: true }));
    parts.push(part("brow" + side, [12, 8, 24], [side * 21, 10, 13], undefined,
      { all: hide }, { parent: "head", voxels: [[side * 2, -4, 7, 10, 4, 13]] }));
    parts.push(part("nostril" + side, [3, 4, 5], [side * 16, 3, 39], undefined,
      { all: socket }, { parent: "head" }));
    parts.push(scaled("thigh" + side, [36, 66, 46], [side * 28, 87, 0], [0, -24, 4]));
    parts.push(scaled("shin" + side, [29, 39, 35], [0, -28, -2], [0, -15, 0], undefined,
      { parent: "thigh" + side }));
    parts.push(scaled("foot" + side, [35, 14, 58], [0, -12, 6], [0, -1, 10], undefined,
      { parent: "shin" + side }));
    parts.push(scaled("arm" + side, [26, 45, 28], [side * 39, 156, 14], [side * 7, -19, 8]));
    parts.push(scaled("forearm" + side, [22, 31, 26], [side * 5, -15, 8], [side * 3, -10, 9], undefined,
      { parent: "arm" + side }));
    parts.push(scaled("hand" + side, [24, 20, 25], [side * 3, -13, 4], [side * 3, -4, 6], undefined,
      { parent: "forearm" + side }));
    for (const offset of [-10, 0, 10]) {
      parts.push(part(`toe${side},${offset}`, [8, 9, 22], [offset, -1, 26], [0, 0, 3],
        { all: hide }, { parent: "foot" + side, voxels: [[0, -1, 13, 7, 7, 7]] }));
      parts.push(part(`claw${side},${offset}`, [6, 7, 15], [offset, -1, 39], [0, 0, 0],
        { all: ivory }, { parent: "foot" + side, voxels: [[0, -2, 9, 4, 3, 5]] }));
    }
    for (const offset of [-7, 0, 7]) {
      parts.push(part(`finger${side},${offset}`, [6, 14, 12], [offset, -8, 8], [0, -2, 3],
        { all: hide }, { parent: "hand" + side }));
      parts.push(part(`handClaw${side},${offset}`, [4, 9, 10], [offset, -17, 14], undefined,
        { all: ivory }, { parent: "hand" + side }));
    }
    for (const z of [5, 13, 21, 29, 36]) {
      upperTeeth.push([side * 14, -12, z, 4, 5, 5], [side * 14, -15, z, 2, 2, 3]);
      lowerTeeth.push([side * 13, 8, z - 15, 3, 4, 4], [side * 13, 11, z - 15, 2, 2, 3]);
    }
  }
  for (const x of [-8, 8]) upperTeeth.push([x, -12, 39, 4, 5, 4]);
  parts.push(part("upperTeeth", [4, 5, 4], [0, -12, 39], undefined, { all: ivory }, {
    parent: "head", voxels: upperTeeth.map(([x, y, z, ...size]) => [x, y + 12, z - 39, ...size])
  }));
  parts.push(part("lowerTeeth", [3, 4, 4], [0, 8, 21], undefined, { all: ivory }, {
    parent: "jaw", voxels: lowerTeeth.map(([x, y, z, ...size]) => [x, y - 8, z - 21, ...size])
  }));
  for (const [i, y, z, height, width] of [
    [0, 86, -41, 52, 46], [1, 119, -38, 58, 53], [2, 148, -30, 56, 48],
    [3, 172, -17, 45, 35], [4, 192, -1, 29, 25]
  ]) parts.push(dorsalPlate("plate" + i, [0, y, z], height, width));
  for (const side of [-1, 1]) {
    for (const [i, y, z] of [[0, 91, -30], [1, 122, -29], [2, 149, -20]]) {
      parts.push(dorsalPlate(`sidePlate${side},${i}`, [side * 28, y, z], 26, 23));
    }
  }
  for (const [parent, height, width, y] of [
    ["tail", 31, 30, 23], ["tailMid", 25, 25, 17], ["tailEnd", 19, 20, 13], ["tailTip", 13, 14, 9]
  ]) {
    for (const z of [-22, 8, 30]) {
      parts.push(dorsalPlate(parent + "Plate" + z, [0, y, z], height, width, parent));
    }
  }
  species[GODZILLA_ID] = {
    godzilla: true, name: GODZILLA_NAME, boss: true, hostile: true, static: true, fireproof: true, noSave: true,
    hp: GODZILLA_HP, scale: GODZILLA_SCALE, w: 5.7 * GODZILLA_SCALE, h: GODZILLA_HEIGHT, speed: 0, sound: "roar", drops: () => [],
    model: { type: "godzilla", parts }
  };
}

export function animateGodzilla(e, dt, reducedMotion) {
  const p = e.parts, charged = e.atomicCharge, firing = e.atomicFiring;
  const breath = reducedMotion ? 0 : Math.sin(e.age * 1.1) * 0.012;
  p.chest.scale.y = 1 + breath;
  p.throat.scale.setScalar(1 + (charged ? 0.035 : firing ? 0.06 : 0));
  const bend = firing ? 0.23 : charged ? -0.1 : -0.025;
  p.head.rotation.x += (bend - p.head.rotation.x) * (1 - Math.exp(-dt * 10));
  p.jaw.rotation.x = firing ? 0.67 : charged ? 0.3 : 0.07;
  p.arm1.rotation.x = -0.13 - (firing ? 0.19 : 0);
  p["arm-1"].rotation.x = p.arm1.rotation.x;
  p.forearm1.rotation.x = p["forearm-1"].rotation.x = -0.45;
  const sway = reducedMotion ? 0 : Math.sin(e.age * 0.77) * 0.08;
  // Curl the full-length tail inside the existing arena instead of cutting into its rim.
  p.tail.rotation.y = 0.45 + sway;
  p.tailMid.rotation.y = 0.75 + sway * 0.75;
  p.tailEnd.rotation.y = 0.75 - sway * 0.65;
  p.tailTip.rotation.y = 0.6;
  const pulse = reducedMotion ? 0 : Math.sin(e.age * 5) * 0.1;
  e.glowMat?.color.setScalar(firing ? 1.8 : charged ? 1.35 + pulse : 0.9);
}
