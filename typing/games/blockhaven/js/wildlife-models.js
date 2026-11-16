// Sizes and pivots use the entity renderer's sixteenth-block grid. Forward is +Z.
function coat(dark, main, light) {
  return { all(P, face) {
    P.rect(0, 0, 16, 16, main);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = ((x * 11 + y * 13 + (x ^ y) * 7) ^ (y * x * 3)) & 31;
      if (v < 6) P.px(x, y, dark);
      else if (v >= 27) P.px(x, y, light);
    }
    if (face !== "top") P.rect(0, 15, 16, 1, dark);
  } };
}

const box = (name, size, pivot, paint, parent, off = [0, 0, 0], detail = false) =>
  ({ name, size, pivot, paint, parent, off, detail });
const fur = coat("#54301f", "#75462d", "#9b633c");
const shoulders = coat("#704227", "#94603a", "#b97f4d");
const paws = coat("#36251f", "#4b3023", "#69422d");
const muzzle = coat("#8d603e", "#b28154", "#d2a477");
const black = coat("#141218", "#242029", "#403239");
const ivory = coat("#a89982", "#dcd0b5", "#f6ebd5");
const mouth = coat("#381924", "#622936", "#85404a");

const bearHead = { ...shoulders, front(P) {
  shoulders.all(P, "front");
  for (const x of [1, 11]) {
    P.rect(x, 5, 4, 4, "#3c251e");
    P.rect(x + 1, 6, 2, 2, "#db9950");
    P.px(x + 1, 6, "#1e1516");
  }
} };

const ancientColors = {
  "#54301f": "#3f3734", "#75462d": "#64564b", "#9b633c": "#847665",
  "#704227": "#625a50", "#94603a": "#948673", "#b97f4d": "#beb29b",
  "#36251f": "#29262a", "#4b3023": "#413c3c", "#69422d": "#635952",
  "#8d603e": "#786758", "#b28154": "#a5907b", "#d2a477": "#c8b29b",
  "#db9950": "#f2c879"
};

function bearVariant(paint) {
  return Object.fromEntries(Object.entries(paint).map(([face, draw]) => [face, (P, side, variant) => {
    const color = c => ancientColors[c] || c;
    const painter = variant === "ancient" ? {
      px: (x, y, c) => P.px(x, y, color(c)),
      rect: (x, y, w, h, c) => P.rect(x, y, w, h, color(c))
    } : P;
    draw(painter, side);
  }]));
}

function grizzly() {
  const parts = [
    box("haunch", [21, 18, 20], [0, 15, -8], fur),
    box("torso", [23, 21, 30], [0, 18, 0], fur),
    box("shoulder", [25, 23, 17], [0, 21, 10], shoulders),
    box("hump", [18, 5, 13], [0, 14, 1], shoulders, "shoulder"),
    box("chest", [19, 14, 7], [0, 15, 17], paws),
    box("neck", [18, 16, 12], [0, 24, 17], fur),
    box("head", [16, 14, 14], [0, 24, 21], bearHead, null, [0, 0, 4]),
    box("muzzle", [11, 6, 8], [0, -3, 8], muzzle, "head"),
    box("nose", [7, 3, 2], [0, 1, 4], black, "muzzle"),
    box("jaw", [10, 4, 10], [0, -6, 3], muzzle, "head", [0, 0, 5]),
    box("palate", [8, 1, 7], [0, 2, 1], mouth, "jaw"),
    box("tail", [6, 5, 5], [0, 15, -18], fur)
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("ear" + sign, [5, 6, 4], [6 * sign, 7, 1], shoulders, "head"),
      box("earInner" + sign, [3, 3, 1], [0, 0, 2], paws, "ear" + sign, [0, 0, 0], true),
      box("brow" + sign, [6, 3, 3], [5 * sign, 3, 6], shoulders, "head"),
      box("fang" + sign, [1, 3, 1], [4 * sign, -2, 3], ivory, "muzzle"),
      box("lowerFang" + sign, [1, 2, 1], [3.5 * sign, 2.5, 4], ivory, "jaw", [0, 0, 0], true)
    );
    for (const front of [true, false]) {
      const leg = (front ? "fore" : "hind") + sign;
      const height = front ? 16 : 13;
      parts.push(
        box(leg, [front ? 9 : 10, height, 10], [8 * sign, height + 2, front ? 10 : -11],
          front ? shoulders : fur, null, [0, -height / 2, 0]),
        box(leg + "paw", [9, 4, 11], [0, -height / 2, 1], paws, leg)
      );
      for (let i = -1; i <= 1; i++) {
        parts.push(box(leg + "claw" + i, [1.3, 1.8, 2.8], [i * 2.6, -0.8, 5],
          ivory, leg + "paw", [0, 0, 0], true));
      }
    }
  }
  return { type: "wildlife", parts: parts.map(part => ({ ...part, paint: bearVariant(part.paint) })) };
}

const slate = coat("#43596b", "#5c7687", "#78909a");
const dorsal = coat("#334555", "#4c6371", "#6e8592");
const belly = coat("#a6baba", "#d4dfd9", "#edf1e4");
const sharkHead = {
  ...slate,
  ...Object.fromEntries(["left", "right"].map(face => [face, P => {
    slate.all(P, face);
    const eye = face === "right" ? 4 : 11;
    P.rect(eye - 1, 6, 3, 3, "#141d24");
    P.px(eye - 1, 6, "#adc6d0");
  }]))
};

function shark() {
  const parts = [
    box("body", [18, 16, 27], [0, 12, 0], slate),
    box("belly", [15, 7, 27], [0, 6, 1], belly),
    box("head", [16, 12, 15], [0, 12, 15], sharkHead),
    box("snout", [12, 8, 8], [0, 0, 8], slate, "head"),
    box("jaw", [14, 5, 15], [0, 7, 10], belly, null, [0, -1, 8]),
    box("mouth", [12, 1, 12], [0, 2.7, 0], mouth, "jaw"),
    box("dorsal", [3, 5, 14], [0, 20, -3], dorsal),
    box("dorsalMid", [2.5, 4, 10], [0, 4, -2], dorsal, "dorsal"),
    box("dorsalHigh", [2, 4, 6], [0, 7, -4], dorsal, "dorsal"),
    box("dorsalTip", [1.6, 3, 3], [0, 10, -5], dorsal, "dorsal"),
    box("tail", [12, 11, 15], [0, 11, -12], slate, null, [0, -1, -6]),
    box("tailTip", [6, 7, 12], [0, 0, -8], slate, "tail", [0, 0, -4]),
    box("flukeUp", [3, 9, 6], [0, 0, -5], dorsal, "tailTip", [0, 4, -2]),
    box("flukeCrown", [2.5, 5, 4], [0, 10, -4], dorsal, "tailTip"),
    box("flukeTip", [2, 4, 2.5], [0, 14, -5.5], dorsal, "tailTip"),
    box("flukeDown", [3, 7, 5], [0, 0, -5], dorsal, "tailTip", [0, -4, -1]),
    box("flukeHeel", [2, 4, 2.5], [0, -4.8, -1.4], dorsal, "flukeDown")
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("fin" + sign, [11, 2.5, 11], [8 * sign, 7, 5], dorsal, null, [4.5 * sign, 0, -3]),
      box("finTip" + sign, [6, 2, 7], [6 * sign, 0, -3], slate, "fin" + sign)
    );
    for (let i = 0; i < 4; i++) {
      parts.push(box("gill" + sign + i, [0.25, 6 - i * 0.4, 0.7],
        [9.05 * sign, 11, 11 - i * 1.5], dorsal, null, [0, 0, 0], true));
    }
  }
  for (let i = -3; i <= 3; i++) {
    parts.push(
      box("tooth" + i, [1.15, 2, 1.2], [i * 1.6, 3, 5 - Math.abs(i) * 0.6], ivory, "jaw", [0, 0, 0], true),
      box("upperTooth" + i, [1.15, 2, 1.2], [i * 1.6, -3.5, 2 - Math.abs(i) * 0.4], ivory, "snout", [0, 0, 0], true)
    );
  }
  return { type: "wildlife", parts };
}

const feather = coat("#382a24", "#5d4230", "#795944");
const flightFeather = coat("#242029", "#3e3030", "#5a4240");
const white = coat("#bdb8a9", "#e7e0ce", "#fffae7");
const gold = coat("#9a5d26", "#d38c32", "#f5c367");
const eagleHead = { ...white, ...Object.fromEntries(["left", "right"].map(face => [face, P => {
  white.all(P, face);
  const eye = face === "right" ? 4 : 9;
  P.rect(eye, 5, 3, 4, "#522f23");
  P.rect(eye + 1, 6, 2, 2, "#e59331");
  P.px(eye + 1, 6, "#21171a");
}])) };

function eagle() {
  const parts = [
    box("body", [9, 8, 14], [0, 8, 0], feather),
    box("breast", [8, 7, 7], [0, 7, 5], feather),
    box("ruff", [8, 6, 5], [0, 11, 5], white),
    box("head", [7, 6, 7], [0, 13, 7], eagleHead),
    box("beak", [3.5, 2.8, 5], [0, -1, 4.8], gold, "head"),
    box("hook", [2.2, 2.5, 2], [0, -1.4, 1.8], gold, "beak"),
    box("tail", [7, 2, 9], [0, 6, -6], white, null, [0, 0, -5])
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("wing" + sign, [12, 3, 10], [4 * sign, 9, 1], feather, null, [5 * sign, 0, -1]),
      box("wrist" + sign, [11, 2, 8], [6 * sign, -0.4, -1], feather, "wing" + sign, [4.5 * sign, 0, -1]),
      box("wingtip" + sign, [7, 1.3, 5], [5 * sign, -0.3, -1], flightFeather,
        "wrist" + sign, [3 * sign, 0, -1]),
      box("leg" + sign, [2, 4, 2], [2.4 * sign, 4, 0], gold, null, [0, -1.5, 0]),
      box("talon" + sign, [3, 1.2, 3], [0, -2, 0.7], gold, "leg" + sign)
    );
    for (let i = 0; i < 5; i++) {
      parts.push(box("primary" + sign + i, [2.6, 0.9, 7 - i * 0.5],
        [(i - 2) * sign * 2, -0.42, -4.1 - i * 0.38], flightFeather, "wrist" + sign));
    }
    for (let i = -1; i <= 1; i++) {
      parts.push(box("toe" + sign + i, [0.7, 0.7, 1.6], [i, -0.3, 1.8],
        ivory, "talon" + sign, [0, 0, 0], true));
    }
  }
  return { type: "wildlife", parts };
}

const whaleBack = coat("#395067", "#53778e", "#6687a0");
const whaleSide = coat("#4e6b7e", "#6e8f9d", "#8ca4a8");
const whaleBelly = {
  ...coat("#6b8793", "#99aeb2", "#b9c8c6"),
  bottom(P) {
    P.rect(0, 0, 16, 16, "#a5b8ba");
    for (let i = 2; i < 16; i += 3) {
      P.rect(i, 0, 1, 16, "#617c8c");
      P.rect(i + 1, 1, 1, 14, "#bfcbcb");
    }
  }
};

function cetacean(orca) {
  const top = orca ? black : whaleBack, sides = orca ? black : whaleSide;
  const underside = orca ? white : whaleBelly;
  const taperedFin = orca ? black : whaleBack;
  const head = { ...sides };
  const parts = [
    box("body", [24, 20, 35], [0, 13, 0], top),
    box("shoulders", [22, 18, 16], [0, 13, 19], sides),
    box("crown", [17, 4, 29], [0, 23, 2], top),
    box("rump", [19, 17, 17], [0, 12.5, -18], top),
    box("belly", [21, 7, 31], [0, 6, 2], underside),
    box("head", [orca ? 17 : 21, 13, 15], [0, 13, 27], head),
    box("rostrum", [orca ? 12 : 17, 8, 10], [0, 0, 8], sides, "head"),
    box("lip", [orca ? 9 : 13, 6, 5], [0, -0.7, 4.5], sides, "rostrum"),
    box("jaw", [orca ? 15 : 19, 5, 17], [0, 8, 23], underside, null, [0, -1, 7]),
    box("blowholes", [4, 0.3, 2.2], [0, 22, 29], black, null, [0, 0, 0], true),
    box("dorsal", [3, orca ? 7 : 3, orca ? 9 : 7], [0, 23, -9], taperedFin, null, [0, 1.5, 0]),
    box("dorsalRise", [2.4, orca ? 7 : 2, orca ? 7 : 4], [0, orca ? 5.8 : 2.2, -1.1], taperedFin, "dorsal"),
    box("dorsalTip", [1.8, orca ? 6 : 1.2, 3], [0, orca ? 5.7 : 1.1, -1.3], taperedFin, "dorsalRise"),
    box("tail", [13, 12, 15], [0, 13, -22], top, null, [0, -1, -7]),
    box("tailTip", [7, 8, 14], [0, 0, -7], top, "tail", [0, 0, -5]),
    box("flukeCenter", [12, 4, 8], [0, 0, -7], top, "tailTip")
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("flipper" + sign, [11, 3.4, 10], [10 * sign, 7, 9], sides, null, [5 * sign, -0.5, -2]),
      box("flipperTip" + sign, [5, 2.4, 6], [6 * sign, -0.9, -2.8], top, "flipper" + sign),
      box("fluke" + sign, [12, 2.9, 7], [5 * sign, 0, -1], top, "flukeCenter", [5 * sign, 0, -1.6]),
      box("flukeEnd" + sign, [6, 1.7, 4], [6.5 * sign, 0, -2], top, "fluke" + sign),
      box("eye" + sign, [0.7, 1.5, 1.5], [(orca ? 8.7 : 10.7) * sign, 1, 3], black, "head", [0, 0, 0], true)
    );
    if (orca) {
      parts.push(
        box("eyePatch" + sign, [0.65, 5, 7], [11.04 * sign, 2.4, 3.4], white, "shoulders"),
        box("flank" + sign, [1, 5, 11], [11.85 * sign, 8, -9], white),
        box("saddle" + sign, [10, 1.2, 8], [3.6 * sign, 22.9, -14], whaleSide)
      );
    }
  }
  if (orca) {
    for (let i = -2; i <= 2; i++) {
      parts.push(box("tooth" + i, [1.2, 1.25, 1.2], [i * 2.3, 2.5, 6.2], ivory, "jaw", [0, 0, 0], true));
    }
  }
  return { type: "wildlife", parts };
}

const scaleGreen = coat("#3b4430", "#596047", "#798163");
const scutes = coat("#2d382b", "#45513b", "#65734f");
const riverBelly = coat("#78684c", "#9a8561", "#b9a77a");
const hippoHide = coat("#514653", "#706471", "#8e7f87");
const hippoFold = coat("#403a47", "#615260", "#7b6977");
const hippoMuzzle = coat("#6b4e59", "#8a6870", "#aa8487");

function crocodile() {
  const parts = [
    box("body", [16, 8, 25], [0, 8, 0], scaleGreen),
    box("belly", [14, 4, 23], [0, 4.5, 0], riverBelly),
    box("neck", [12, 7, 12], [0, 8, 14], scutes),
    box("head", [13, 7, 12], [0, 9, 17], scaleGreen),
    box("snout", [10, 3.5, 14], [0, -0.9, 10], scaleGreen, "head"),
    box("nose", [7, 3, 5], [0, 0.2, 7.8], scutes, "snout"),
    box("jaw", [11, 3.2, 19], [0, 6.6, 17], riverBelly, null, [0, -1.7, 10.3]),
    box("palate", [9, 0.3, 14], [0, 1.6, 1.7], mouth, "jaw"),
    box("tail", [12, 6, 15], [0, 8, -10], scaleGreen, null, [0, -0.6, -6]),
    box("tailMid", [8, 5, 13], [0, -0.4, -7], scutes, "tail", [0, 0, -5.5]),
    box("tailTip", [4, 3, 10], [0, -0.6, -6], scaleGreen, "tailMid", [0, 0, -4.6])
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("eyelid" + sign, [4.4, 4, 5], [5 * sign, 3.1, 0.8], scutes, "head"),
      box("eye" + sign, [1.2, 1.7, 2.3], [1.9 * sign, 0.3, 1], gold, "eyelid" + sign),
      box("pupil" + sign, [0.22, 1.5, 0.6], [0.65 * sign, 0, 0.2], black, "eye" + sign, [0, 0, 0], true),
      box("nostril" + sign, [1.4, 0.25, 1.3], [2 * sign, 1.55, 0.6], black, "nose", [0, 0, 0], true)
    );
    for (let i = 0; i < 5; i++) {
      parts.push(box("scute" + sign + i, [2.4, 2.4 - i * 0.17, 3.1],
        [3.8 * sign, 4.65, 9 - i * 4.2], scutes, "body", [0, 0, 0], i > 2));
      parts.push(box("tooth" + sign + i, [0.85, 1.7, 0.9],
        [4.6 * sign, 2.05, -5 + i * 2.55], ivory, "jaw", [0, 0, 0], true));
    }
    for (const end of [-1, 1]) {
      const name = "leg" + sign + "_" + end;
      parts.push(
        box(name, [7, 4.4, 5], [6.6 * sign, 6.1, end * 8], scaleGreen, null, [3 * sign, -1.4, 0]),
        box(name + "foot", [4, 3, 6], [2 * sign, -2.1, 1.5], scutes, name)
      );
    }
  }
  return { type: "wildlife", parts };
}

function hippopotamus() {
  const parts = [
    box("barrel", [24, 21, 29], [0, 18, -1], hippoHide),
    box("back", [19, 6, 24], [0, 27, -2], hippoHide),
    box("rump", [20, 18, 11], [0, 17, -15], hippoFold),
    box("neck", [22, 17, 11], [0, 18, 12], hippoFold),
    box("head", [19, 16, 14], [0, 20, 15], hippoHide, null, [0, 0, 3]),
    box("muzzle", [17, 8, 12], [0, -3, 8], hippoMuzzle, "head"),
    box("upperLip", [15, 4, 5], [0, -1, 5], hippoMuzzle, "muzzle"),
    box("jaw", [18, 6, 15], [0, -7, 1], hippoFold, "head", [0, -1.5, 7.5]),
    box("palate", [14, 0.6, 11], [0, 3.1, 1.2], mouth, "jaw"),
    box("tail", [3, 4, 6], [0, 21, -21], hippoFold, null, [0, -0.5, -2.2])
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("eyeRidge" + sign, [5, 4, 6], [7 * sign, 7.7, 3.8], hippoHide, "head"),
      box("eye" + sign, [2.4, 1.8, 1.4], [0.6 * sign, -0.2, 3.15], black, "eyeRidge" + sign),
      box("ear" + sign, [4, 5, 2], [8 * sign, 8, -3.7], hippoFold, "head"),
      box("earInner" + sign, [2.4, 2.9, 0.5], [0, 0.1, 1], hippoMuzzle, "ear" + sign, [0, 0, 0], true),
      box("nostril" + sign, [3.1, 1, 2], [4.5 * sign, 4.14, 2.8], black, "muzzle"),
      box("tusk" + sign, [2, 4.3, 1.9], [5.9 * sign, 3.3, 4.9], ivory, "jaw"),
      box("incisor" + sign, [1.6, 1.9, 1.2], [2 * sign, 3.2, 5.4], ivory, "jaw", [0, 0, 0], true),
      box("flank" + sign, [1.4, 7, 17], [11.4 * sign, 12.4, 0], hippoFold)
    );
    for (const end of [-1, 1]) {
      const name = "leg" + sign + "_" + end;
      parts.push(
        box(name, [7, 10, 7], [7.5 * sign, 10, end * 9], hippoHide, null, [0, -4.8, 0]),
        box(name + "foot", [7.6, 3.2, 8], [0, -3.5, 0.85], hippoFold, name)
      );
    }
  }
  return { type: "wildlife", parts };
}

const octopusPalettes = [
  ["#713023", "#a75738", "#c77e58"],
  ["#77624b", "#ae946e", "#c6ae88"],
  ["#48515c", "#68737d", "#929da0"],
  ["#674b53", "#987581", "#b89c9e"]
];
const octopusCoats = octopusPalettes.map(palette => coat(...palette));
const octopusSkin = { all: (P, face, variant) => octopusCoats[variant ?? 0].all(P, face) };
const suckers = coat("#8b675c", "#bf9480", "#dab5a0");
const octopusArmPaint = { ...octopusSkin, bottom(P, face, variant) {
  octopusSkin.all(P, face, variant);
  for (const x of [3, 10]) for (const y of [2, 7, 12]) {
    P.rect(x, y, 3, 3, "#c4947e");
    P.px(x + 1, y + 1, "#805b58");
  }
} };

function octopus() {
  const parts = [
    box("mantle", [15, 8, 16], [0, 18, -1], octopusSkin),
    box("mantleShoulder", [13.8, 5.2, 14.5], [0, 22.45, -1.5], octopusSkin),
    box("mantleCrown", [10, 3.5, 10.6], [0, 25, -1.5], octopusSkin),
    box("mantleBack", [10.7, 7.5, 5], [0, 17, -7.7], octopusSkin),
    box("taper", [12.4, 7.2, 13.8], [0, 13.8, -2], octopusSkin),
    box("head", [12, 8, 10], [0, 13, 4], octopusSkin),
    box("web", [18, 2, 16], [0, 8, 0], octopusSkin),
    box("siphon", [3, 4, 5], [2, 10, 6.8], octopusSkin)
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("brow" + sign, [5, 5, 5], [5.2 * sign, 15.1, 5.8], octopusSkin),
      box("eye" + sign, [1.4, 2.6, 2.8], [2.3 * sign, -0.6, 1.7], gold, "brow" + sign),
      box("iris" + sign, [0.6, 0.7, 2.6], [0.55 * sign, 0, 0], black, "eye" + sign)
    );
  }
  for (let arm = 0; arm < 8; arm++) {
    const bearing = arm / 8 * Math.PI * 2;
    const name = "arm" + arm;
    const armRoot = box(name, [4.1, 3.2, 9], [Math.sin(bearing) * 6, 7.7, Math.cos(bearing) * 5.4],
      octopusSkin, null, [0, -0.55, 3.6]);
    armRoot.rotation = [0.25, bearing, 0];
    parts.push(
      armRoot,
      box(name + "Mid", [3.1, 2.4, 8], [0, -0.25, 3.8], octopusArmPaint, name, [0, -0.4, 3.5]),
      box(name + "Tip", [1.85, 1.65, 6], [0, -0.15, 3.65], octopusSkin, name + "Mid", [0, 0.4, 2.6])
    );
    parts.push(box(name + "Sucker", [1.05, 0.37, 1.05], [0, -1.22, 1.3],
      suckers, name + "Mid", [0, 0, 0], true));
  }
  return { type: "wildlife", parts };
}

const rayBlue = coat("#284052", "#42596c", "#617984");
const rayEdge = coat("#172c3f", "#304758", "#536a76");
const rayBelly = coat("#999e98", "#c4c6b7", "#e5e2cc");

function mantaRay() {
  const parts = [
    box("body", [16, 5.8, 23], [0, 7, 0], rayBlue),
    box("belly", [15.8, 2.7, 22], [0, 4.9, 0.3], rayBelly),
    box("head", [14, 4.1, 8], [0, 6.2, 13.2], rayBlue),
    box("mouth", [9.5, 1.55, 1.9], [0, -0.7, 3.95], black, "head"),
    box("tail", [2.3, 1.75, 14], [0, 6.4, -10.5], rayEdge, null, [0, 0, -6.2]),
    box("tailTip", [1.1, 1.05, 13], [0, 0, -6.9], rayEdge, "tail", [0, 0, -5.8])
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("fin" + sign, [11, 3.4, 21], [7 * sign, 6.8, 0.7], rayBlue, null, [5.1 * sign, 0, -1.4]),
      box("finBelly" + sign, [11, 1.15, 18.5], [0, -1.65, 0.1], rayBelly, "fin" + sign),
      box("finMid" + sign, [10.5, 2.5, 15], [5.1 * sign, 0, -1.3], rayBlue, "fin" + sign, [4.5 * sign, 0, -1.8]),
      box("finMidBelly" + sign, [9.9, 0.7, 13.6], [0, -1.22, 0], rayBelly, "finMid" + sign),
      box("finOuter" + sign, [7.5, 1.7, 9.8], [4.7 * sign, 0, -1.8], rayEdge, "finMid" + sign, [3.2 * sign, 0, -1.4]),
      box("finTip" + sign, [4.4, 1.05, 4.6], [3.3 * sign, 0.1, -1.55], rayEdge, "finOuter" + sign, [1.6 * sign, 0, -1.35]),
      box("lobe" + sign, [3.4, 2.3, 7], [5.15 * sign, 0, 4.2], rayBlue, "head", [0.28 * sign, -0.5, 2.5]),
      box("lobeTip" + sign, [2.5, 2.55, 3.35], [0, -0.3, 3.45], rayBlue, "lobe" + sign),
      box("eye" + sign, [1.1, 1.7, 1.65], [7.05 * sign, 0.72, 2.1], black, "head")
    );
    for (let gill = 0; gill < 4; gill++) {
      parts.push(box("gill" + sign + gill, [3.5, 0.23, 0.6],
        [3.2 * sign, -1.43, 7 - gill * 2.25], rayEdge, "belly", [0, 0, 0], true));
    }
  }
  return { type: "wildlife", parts };
}

const sealCoats = [
  ["#4d5660", "#718089", "#9aa6aa"],
  ["#46515d", "#7f8e95", "#b0b9b7"]
].map(colors => coat(...colors));
const sealSkin = { all(P, face, variant = 0) {
  sealCoats[variant].all(P, face);
  if (variant === 1 && face !== "bottom") {
    for (const [x, y, w, h] of [[3, 2, 2, 2], [11, 4, 3, 2], [7, 8, 2, 3], [2, 12, 3, 2], [13, 13, 2, 2]]) {
      P.rect(x, y, w, h, "#53616a");
      P.px(x + 1, y, "#384852");
    }
  }
} };
const sealPale = coat("#69757c", "#a5b3b4", "#cbd1c8");
const wetHide = coat("#513e36", "#765846", "#957461");
const neckFold = coat("#473830", "#694c3c", "#8e6850");
const walrusFace = coat("#7f5846", "#9d7156", "#b28d72");
const whisker = coat("#8c6850", "#c1a486", "#dec6a7");

function seal() {
  const parts = [
    box("body", [17, 12, 21], [0, 8.5, 0], sealSkin),
    box("spine", [14, 5, 17], [0, 13.5, -2.4], sealSkin),
    box("belly", [15, 5.1, 18], [0, 4.1, 0.5], sealPale),
    box("shoulders", [15, 11, 9], [0, 9, 9], sealSkin),
    box("taper", [12, 8.7, 10], [0, 7.6, -11.4], sealSkin),
    box("head", [12, 10.3, 10], [0, 12, 10], sealSkin, null, [0, 0, 3]),
    box("muzzle", [9, 5, 5], [0, -1.9, 5.2], sealPale, "head"),
    box("nose", [5.5, 2.6, 1.8], [0, 0.9, 2.55], black, "muzzle"),
    box("tail", [10, 5.7, 8], [0, 7, -14], sealSkin, null, [0, -0.4, -3.85])
  ];
  for (const s of [-1, 1]) {
    parts.push(
      box("eye" + s, [2.2, 2.8, 2], [4.3 * s, 0.8, 4.6], black, "head"),
      box("eyeShine" + s, [0.7, 0.7, 0.35], [0, 0.45, 1], ivory, "eye" + s, [0, 0, 0], true),
      box("flipper" + s, [9, 2.4, 6.7], [6.8 * s, 5.1, 4.2], sealSkin, null, [4.25 * s, -0.7, -1.65]),
      box("flipperTip" + s, [4.3, 1.5, 5], [4.1 * s, -0.65, -1.4], sealSkin, "flipper" + s),
      box("rearFin" + s, [5.5, 2, 7.3], [2.4 * s, -0.2, -3.15], sealSkin, "tail", [1.2 * s, 0, -1.5]),
      box("whisker" + s, [3.6, 0.35, 0.6], [5 * s, -1.15, 2.3], whisker, "muzzle", [0, 0, 0], true)
    );
  }
  return { type: "wildlife", parts };
}

function walrus() {
  const parts = [
    box("body", [26, 20, 35], [0, 12.6, -2], wetHide),
    box("back", [20, 7, 29], [0, 22.1, -3.5], wetHide),
    box("belly", [23, 9, 29], [0, 6.2, 0], neckFold),
    box("rump", [20, 15, 15], [0, 10.9, -18.5], wetHide),
    box("neck", [24, 19, 14], [0, 15.4, 13.5], neckFold),
    box("head", [17, 15, 12], [0, 16.5, 15.8], wetHide, null, [0, 0, 4.2]),
    box("muzzle", [15, 8, 6.7], [0, -2.1, 6], walrusFace, "head"),
    box("nose", [6.8, 3.7, 2.6], [0, 1.9, 3.35], black, "muzzle"),
    box("jaw", [12, 5, 8], [0, -5.3, 3.65], neckFold, "head", [0, -1.3, 3]),
    box("tail", [13, 6, 10], [0, 7.3, -24], wetHide, null, [0, -0.9, -2.8])
  ];
  for (const s of [-1, 1]) {
    parts.push(
      box("eye" + s, [2.8, 2.25, 2], [6 * s, 1.35, 5.3], black, "head"),
      box("brow" + s, [4.8, 2.3, 2.7], [5.9 * s, 3.3, 5.2], neckFold, "head"),
      box("pad" + s, [7, 4.8, 3.1], [4 * s, -0.9, 2.7], whisker, "muzzle"),
      box("tusk" + s, [2.35, 8.7, 2.55], [5.3 * s, -3.2, 3.9], ivory, "muzzle", [0, -3.5, 0]),
      box("tuskTip" + s, [1.45, 3, 1.8], [0.1 * s, -4.8, 0.45], ivory, "tusk" + s),
      box("flipper" + s, [10, 3.85, 12], [10.5 * s, 6.1, 4.1], wetHide, null, [4 * s, -1.8, 1.4]),
      box("flipperTip" + s, [5.2, 2.5, 7], [4.5 * s, -0.7, -1.5], neckFold, "flipper" + s),
      box("rearFin" + s, [8, 3.2, 8.5], [3.9 * s, -0.6, -3.6], wetHide, "tail", [1.3 * s, -0.3, -1.8])
    );
    for (let i = 0; i < 4; i++) {
      parts.push(box("bristle" + s + i, [1.9 + i * 0.23, 0.35, 0.57],
        [3.5 * s, 1.55 - i, 1.5 + ((i % 2) * 0.22)], whisker, "pad" + s, [0, 0, 0], true));
    }
    for (let i = 0; i < 3; i++) {
      parts.push(box("neckFold" + s + i, [0.75, 8 - i * 1.1, 1.8],
        [11.8 * s, 0, 4 - i * 3.3], wetHide, "neck", [0, 0, 0], true));
    }
  }
  return { type: "wildlife", parts };
}

const lionGold = coat("#8b5938", "#b77d4d", "#d79c60");
const lionCream = coat("#947054", "#c6a178", "#e8c396");
const lionMane = coat("#402820", "#67402e", "#895438");
const lionPaw = coat("#6a4636", "#9b653f", "#bb8053");

function lion() {
  const parts = [
    box("body", [16, 14, 27], [0, 15, -2], lionGold),
    box("belly", [13, 7, 23], [0, 10, -1], lionCream),
    box("shoulder", [17, 16, 13], [0, 16, 8.5], lionGold),
    box("rump", [15, 13, 12], [0, 14.5, -13], lionGold),
    box("neck", [12, 12, 11], [0, 18.2, 13.5], lionGold),
    box("head", [13, 12, 12], [0, 19.5, 16.3], lionGold, null, [0, 0, 2]),
    box("brow", [12, 3.7, 3.8], [0, 2.6, 4.25], lionGold, "head"),
    box("muzzle", [9.8, 5.8, 6.4], [0, -2, 7], lionCream, "head"),
    box("nose", [5.8, 2.5, 1.6], [0, 0.6, 3.18], black, "muzzle"),
    box("jaw", [9.5, 3.8, 9], [0, -4.4, 1.6], lionCream, "head", [0, -0.75, 4.7]),
    box("mane", [18, 19, 14], [0, 18, 11], lionMane),
    box("maneCrown", [15, 5.8, 10.2], [0, 8.6, 3], lionMane, "mane"),
    box("maneChest", [12.6, 9, 7.7], [0, -7, 6.2], lionMane, "mane"),
    box("tail", [3.2, 3.2, 12], [0, 13.4, -17.8], lionGold, null, [0, 0, -5.4]),
    box("tailTip", [2.4, 2.5, 9], [0, 0, -5.8], lionGold, "tail", [0, 0, -4.2]),
    box("tuft", [5, 4.8, 6.2], [0, 0, -4.8], lionMane, "tailTip")
  ];
  for (const sign of [-1, 1]) {
    parts.push(
      box("maneSlope" + sign, [6, 13, 11], [8.2 * sign, -0.3, 4.3], lionMane, "mane"),
      box("eye" + sign, [2.9, 1.8, 1.05], [4.35 * sign, 1.25, 6.35], gold, "head"),
      box("pupil" + sign, [1.1, 1.2, 0.35], [0.25 * sign, 0, 0.56], black, "eye" + sign),
      box("ear" + sign, [4, 4, 2.5], [5.8 * sign, 6.1, 0.25], lionGold, "head"),
      box("earInner" + sign, [2.4, 2.1, 0.45], [0, 0.35, 1.28], lionMane, "ear" + sign, [0, 0, 0], true),
      box("fang" + sign, [1.15, 2.05, 1], [3.35 * sign, -2.9, 2], ivory, "muzzle", [0, 0, 0], true)
    );
    for (const end of [-1, 1]) {
      const id = "leg" + sign + "_" + end;
      parts.push(
        box(id, [end === 1 ? 5.2 : 6.5, 10, 6.3], [5.3 * sign, 11, end * 9.7],
          lionGold, null, [0, -4.6, 0]),
        box(id + "paw", [5.2, 3.4, 7], [0, -4.7, 0.9], lionPaw, id)
      );
    }
  }
  return { type: "wildlife", parts };
}

const stripeIvory = coat("#b2ad9e", "#dfdbcf", "#f6efe2");
function stripes(horizontal = false) {
  return { all(P, face) {
    stripeIvory.all(P, face);
    for (let b = 0; b < 4; b++) for (let a = 0; a < 16; a++) {
      const center = b * 4 + ((a + b * 2) >> 2) % 2;
      const width = b === 1 && a > 9 || b === 3 && a < 4 ? 1 : 2;
      if (horizontal) P.rect(a, center, 1, Math.min(width, 16 - center), "#242229");
      else P.rect(center, a, Math.min(width, 16 - center), 1, "#242229");
    }
  } };
}
const zebraBody = stripes(), zebraLeg = stripes(true);
const zebraMuzzle = coat("#423b45", "#635a62", "#827780");
const zebraMane = coat("#26232a", "#46404a", "#665d69");

function zebra() {
  const parts = [
    box("body", [15, 13, 28], [0, 19, -2], zebraBody),
    box("belly", [12, 4, 24], [0, 13, -2.5], stripeIvory),
    box("chest", [13, 13, 11], [0, 19.5, 9.6], zebraBody),
    box("rump", [14, 12, 11], [0, 18.9, -14.5], zebraBody),
    box("neck", [9.5, 16, 11.5], [0, 21.8, 10.5], zebraBody, null, [0, 6.3, 2]),
    box("head", [9.4, 9.7, 12], [0, 6.15, 3.9], zebraBody, "neck", [0, -0.1, 3]),
    box("muzzle", [8.2, 5.2, 7.3], [0, -2.8, 5.5], zebraMuzzle, "head"),
    box("mane", [3.8, 17, 5.3], [0, 1, -5.35], zebraMane, "neck"),
    box("forelock", [3.4, 3.9, 4.8], [0, 4, 2.9], zebraMane, "head"),
    box("tail", [3.1, 4.2, 12.2], [0, 19, -20], zebraBody, null, [0, -1.3, -3.5]),
    box("tuft", [4.4, 6.2, 6.3], [0, -1.7, -5.5], zebraMane, "tail")
  ];
  parts.find(part => part.name === "neck").rotation = [0.33, 0, 0];
  for (const sign of [-1, 1]) {
    parts.push(
      box("ear" + sign, [2.4, 6, 2.7], [3.5 * sign, 5.35, -0.9], stripeIvory, "head"),
      box("earInner" + sign, [1.25, 3.9, 0.5], [0, 0.45, 1.35], zebraMane, "ear" + sign, [0, 0, 0], true),
      box("eye" + sign, [0.8, 1.95, 2.3], [4.75 * sign, 1, 2.15], black, "head"),
      box("nostril" + sign, [1.4, 1.1, 0.55], [2.15 * sign, 0.48, 3.7], black, "muzzle", [0, 0, 0], true)
    );
    for (const end of [-1, 1]) {
      const id = "leg" + sign + "_" + end;
      parts.push(
        box(id, [4.7, 8.4, 5.1], [5 * sign, 16.2, end * 11], zebraLeg, null, [0, -3.5, 0]),
        box(id + "Shin", [3.35, 8.5, 3.7], [0, -3.6, 0], zebraLeg, id, [0, -3.6, 0]),
        box(id + "Hoof", [4.2, 3.25, 5], [0, -4.1, 0.65], zebraMane, id + "Shin")
      );
    }
  }
  return { type: "wildlife", parts };
}

export const WILDLIFE_MODELS = {
  grizzly_bear: grizzly,
  great_white_shark: shark,
  bald_eagle: eagle,
  blue_whale: () => cetacean(false),
  orca: () => cetacean(true),
  crocodile,
  hippopotamus,
  octopus,
  manta_ray: mantaRay,
  seal,
  walrus,
  lion,
  zebra
};
