// Sizes and pivots use the entity renderer's sixteenth-block grid. Forward is +Z.
const solidHide = color => ({ all: P => P.rect(0, 0, 16, 16, color) });

const box = (name, size, pivot, paint, parent, off = [0, 0, 0], detail = false) =>
  ({ name, size, pivot, paint, parent, off, detail });
const fur = solidHide("#75462d");
const shoulders = solidHide("#94603a");
const paws = solidHide("#4b3023");
const muzzle = solidHide("#b28154");
const black = solidHide("#242029");
const ivory = solidHide("#dcd0b5");
const mouth = solidHide("#622936");

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

const slate = solidHide("#5c7687");
const dorsal = solidHide("#4c6371");
const belly = solidHide("#d4dfd9");
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

const feather = solidHide("#5d4230");
const flightFeather = solidHide("#3e3030");
const white = solidHide("#e7e0ce");
const gold = solidHide("#d38c32");
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

const whaleBack = solidHide("#53778e");
const whaleSide = solidHide("#6e8f9d");
const whaleBelly = {
  ...solidHide("#99aeb2"),
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

const scaleGreen = solidHide("#596047");
const scutes = solidHide("#45513b");
const riverBelly = solidHide("#9a8561");
const hippoHide = solidHide("#77737b");
const hippoFold = solidHide("#69656e");
const hippoMuzzle = solidHide("#82767d");

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
const octopusCoats = octopusPalettes.map(palette => solidHide(palette[1]));
const octopusSkin = { all: (P, face, variant) => octopusCoats[variant ?? 0].all(P, face) };
const suckers = solidHide("#bf9480");
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

const rayBlue = solidHide("#42596c");
const rayEdge = solidHide("#304758");
const rayBelly = solidHide("#c4c6b7");

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
].map(colors => solidHide(colors[1]));
const sealSkin = { all(P, face, variant = 0) {
  sealCoats[variant].all(P, face);
  if (variant === 1 && face !== "bottom") {
    for (const [x, y, w, h] of [[3, 2, 2, 2], [11, 4, 3, 2], [7, 8, 2, 3], [2, 12, 3, 2], [13, 13, 2, 2]]) {
      P.rect(x, y, w, h, "#53616a");
      P.px(x + 1, y, "#384852");
    }
  }
} };
const sealPale = solidHide("#a5b3b4");
const wetHide = solidHide("#765846");
const neckFold = solidHide("#694c3c");
const walrusFace = solidHide("#9d7156");
const whisker = solidHide("#c1a486");

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

const lionGold = solidHide("#b77d4d");
const lionCream = solidHide("#c6a178");
const lionMane = solidHide("#67402e");
const lionPaw = solidHide("#9b653f");

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

const stripeIvory = solidHide("#dfdbcf");
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
const zebraMuzzle = solidHide("#635a62");
const zebraMane = solidHide("#46404a");

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

const tigerOrange = solidHide("#cc743b");
const tigerWhite = solidHide("#dfcfb5");
const tigerBands = { all(P, face) {
  tigerOrange.all(P, face);
  for (let y = 0; y < 16; y++) {
    for (const start of [2, 7, 13]) {
      const x = start + (y > 7 ? 1 : 0) - (y > 11 ? 1 : 0);
      const width = y > 12 ? 1 : start === 7 && y < 6 ? 3 : 2;
      if (y < 11 || (y + start) % 4 !== 1) P.rect(x, y, width, 1, "#302327");
    }
  }
} };
const tigerEye = { ...gold, front(P) {
  gold.all(P);
  P.rect(6, 2, 4, 12, "#251c1b");
  P.px(6, 3, "#efc77c");
} };
const tigerTail = { all(P, face) {
  tigerOrange.all(P, face);
  for (const x of [1, 6, 11]) P.rect(x, 0, 2, 16, "#33252a");
} };

function tiger() {
  const parts = [
    box("body", [16, 13, 29], [0, 14.7, -2.5], tigerBands),
    box("belly", [13, 6.5, 25], [0, 9.5, -2], tigerWhite),
    box("shoulder", [17.5, 15, 12], [0, 16, 8.5], tigerBands),
    box("haunch", [16, 14, 11], [0, 14.1, -15.2], tigerBands),
    box("neck", [13, 12, 9], [0, 16, 14.4], tigerBands),
    box("head", [14, 11.2, 10.7], [0, 18, 16.5], tigerBands, null, [0, 0, 2.9]),
    box("muzzle", [9.2, 5, 7.6], [0, -2.2, 5.7], tigerWhite, "head"),
    box("nose", [5, 2, 1.65], [0, 0.85, 3.9], black, "muzzle"),
    box("jaw", [9, 3.3, 8], [0, -4.5, 2.2], tigerWhite, "head", [0, -0.2, 4.1]),
    box("tail", [3.6, 3.6, 12], [0, 13.6, -19.5], tigerTail, null, [0, -0.45, -5.4]),
    box("tailTip", [2.7, 2.8, 13], [0, 0, -5.65], tigerTail, "tail", [0, 0, -5.85])
  ];
  for (const s of [-1, 1]) {
    parts.push(
      box("cheek" + s, [4.7, 5.8, 5.2], [5.7 * s, -2.8, 3.7], tigerWhite, "head"),
      box("eye" + s, [2.65, 1.4, 1.05], [4.1 * s, 0.85, 5.43], tigerEye, "head"),
      box("ear" + s, [4, 3.85, 3], [5.05 * s, 5.4, -0.9], tigerOrange, "head"),
      box("earSpot" + s, [2, 1.55, 0.45], [0, 0.2, -1.53], tigerWhite, "ear" + s, [0, 0, 0], true),
      box("fang" + s, [1.05, 1.9, 1], [3.15 * s, -2.6, 2.25], ivory, "muzzle", [0, 0, 0], true)
    );
    for (const end of [-1, 1]) {
      const id = "leg" + s + "_" + end;
      parts.push(
        box(id, [end === 1 ? 5.1 : 6.35, 10, 6.5], [5.4 * s, 11.4, end * 10.2],
          tigerBands, null, [0, -4.9, 0]),
        box(id + "paw", [5.5, 3.2, 6.6], [0, -4.8, 1.1], tigerWhite, id)
      );
    }
  }
  return { type: "wildlife", parts };
}

const deerHide = solidHide("#956e50");
const deerLight = solidHide("#b89270");
const deerCream = solidHide("#c0aa92");
const antler = solidHide("#9a907b");

function deer() {
  const parts = [
    box("body", [12, 13, 24], [0, 18.7, -1.5], deerHide),
    box("belly", [10.2, 5, 21], [0, 13.4, -1.8], deerCream),
    box("haunch", [11.6, 11, 10], [0, 18.2, -12.3], deerHide),
    box("rumpPatch", [7.5, 6.3, 2.15], [0, 18, -17.5], deerCream),
    box("neck", [8.3, 14, 9.6], [0, 20.4, 8.3], deerHide, null, [0, 3.5, 1]),
    box("throat", [6, 10.5, 3], [0, 0.25, 5.3], deerLight, "neck"),
    box("head", [8.9, 8.5, 9.4], [0, 6.1, 3.9], deerHide, "neck"),
    box("snout", [6.75, 5.1, 7.4], [0, -1.3, 5.25], deerLight, "head"),
    box("nose", [5.4, 2.55, 1.55], [0, 0.5, 3.7], black, "snout"),
    box("tail", [4.5, 4.7, 6.3], [0, 20.2, -17.2], deerCream, null, [0, -0.55, -2.4])
  ];
  parts.find(part => part.name === "neck").rotation = [0.24, 0, 0];
  for (const s of [-1, 1]) {
    const rack = "antler" + s;
    const ear = box("ear" + s, [4.65, 3.1, 6.5], [3.7 * s, 3.9, -2], deerHide, "head", [1.5 * s, 1, -1]);
    ear.rotation = [0.15, -s * 0.76, s * 0.37];
    parts.push(
      ear,
      box("earInner" + s, [3.2, 0.55, 4.6], [0, 1.55, 0], deerCream, "ear" + s, [0, 0, 0], true),
      box("eye" + s, [0.72, 2, 2.1], [4.52 * s, 0.75, 2.2], black, "head"),
      box(rack, [1.65, 7.6, 1.75], [3.4 * s, 3.9, -1.7], antler, "head", [1.13 * s, 3.55, -0.9]),
      box(rack + "Beam", [1.55, 5.5, 1.6], [0.45 * s, 5.65, -1.7], antler, rack),
      box(rack + "Outer", [1.35, 4.9, 1.35], [2.2 * s, 2.25, -0.75], antler, rack),
      box(rack + "Brow", [1.2, 3.95, 1.2], [0, 1.55, 1.7], antler, rack)
    );
    for (const end of [-1, 1]) {
      const id = "leg" + s + "_" + end;
      parts.push(
        box(id, [end === -1 ? 4.55 : 3.6, 8.45, 4.2], [3.7 * s, 15.3, end * 9.1], deerHide, null, [0, -3.4, 0]),
        box(id + "Shin", [2.45, 7.2, 2.65], [0, -3.8, 0], deerHide, id, [0, -3.25, 0]),
        box(id + "Hoof", [3.25, 2.55, 3.15], [0, -3.55, 0.25], black, id + "Shin")
      );
    }
  }
  return { type: "wildlife", parts };
}

const mooseHide = solidHide("#6c4a38");
const mooseRuff = solidHide("#513b33");
const mooseMuzzle = solidHide("#72554a");
const antlerPalm = solidHide("#9d825d");

function moose() {
  const parts = [
    box("body", [17, 16, 29], [0, 24, -2], mooseHide),
    box("haunch", [15, 14, 13], [0, 23, -14], mooseHide),
    box("shoulder", [18.2, 19, 14], [0, 27, 8], mooseRuff),
    box("hump", [14.5, 6, 10], [0, 36.6, 7.7], mooseRuff),
    box("neck", [13, 15, 14], [0, 28.3, 13.9], mooseHide, null, [0, 1.9, 4.1]),
    box("head", [13.2, 12.5, 13.7], [0, 4.7, 6.5], mooseHide, "neck", [0, 0, 4.1]),
    box("muzzle", [11.9, 7.5, 11.8], [0, -1.5, 8.7], mooseMuzzle, "head"),
    box("nose", [10.9, 4.4, 4.1], [0, 0.35, 5.6], mooseRuff, "muzzle"),
    box("bell", [5, 10, 4.9], [0, -7, 2.5], mooseRuff, "neck", [0, -2.2, 0]),
    box("tail", [5, 4.1, 6.7], [0, 25, -19.4], mooseRuff, null, [0, -0.75, -2.4])
  ];
  for (const s of [-1, 1]) {
    const rack = "antler" + s;
    const ear = box("ear" + s, [7, 3.6, 5.25], [5.5 * s, 5, -0.25], mooseHide, "head", [2.45 * s, 0.65, -0.7]);
    ear.rotation = [0, -s * 0.28, s * 0.35];
    const palm = box(rack + "Palm", [12, 3.0, 6.8], [5.8 * s, 2.7, -0.05], antlerPalm,
      rack, [3.2 * s, 0.7, -1.25]);
    palm.rotation = [0.12, 0, s * 0.27];
    parts.push(
      ear,
      box("eye" + s, [0.7, 2.05, 2.3], [6.65 * s, 1.34, 2.45], black, "head"),
      box("nostril" + s, [2.1, 0.65, 1.8], [2.9 * s, 2.25, 0.6], black, "nose", [0, 0, 0], true),
      box(rack, [7.5, 2.2, 2.35], [5.4 * s, 5.65, 1.65], antlerPalm, "head", [3.3 * s, 1.1, 0]),
      palm,
      box(rack + "Back", [8.1, 2.1, 5.8], [1.2 * s, 0.8, -3.65], antlerPalm, rack + "Palm")
    );
    for (let i = 0; i < 5; i++) {
      parts.push(box(rack + "Point" + i, [1.6, 3.25 + (i % 3) * 0.85, 1.7],
        [(i - 2) * 2.35 * s, 1.85, i % 2 === 0 ? -3.25 : -4.0],
        antlerPalm, rack + "Palm", [0, 1.15, 0], i % 2 === 0));
    }
    for (const end of [-1, 1]) {
      const id = "leg" + s + "_" + end;
      parts.push(
        box(id, [end === -1 ? 6.5 : 5.9, 11.6, 6.25], [5.8 * s, 19, end * 11],
          mooseHide, null, [0, -5.2, 0]),
        box(id + "Shin", [3.9, 10.1, 4.1], [0, -4.7, 0], mooseRuff, id, [0, -4.4, 0]),
        box(id + "Hoof", [4.4, 3.2, 5.2], [0, -3.2, 0.8], black, id + "Shin")
      );
    }
  }
  return { type: "wildlife", parts };
}

const pandaRust = solidHide("#ae5830");
const pandaAmber = solidHide("#bb6b3d");
const pandaDark = solidHide("#56332c");
const pandaCream = solidHide("#d6bc99");
const pandaRings = { all(P, face) {
  pandaAmber.all(P, face);
  if (face === "front" || face === "back") return;
  for (const band of [2, 9]) {
    if (face === "top" || face === "bottom") P.rect(0, band, 16, 3, "#69372e");
    else P.rect(band, 0, 3, 16, "#69372e");
  }
} };

function redPanda() {
  const parts = [
    box("body", [12, 10, 18], [0, 9.4, -1], pandaRust),
    box("back", [9.6, 4.15, 14.5], [0, 13.3, -1.7], pandaAmber),
    box("undercoat", [10.6, 5.9, 16.5], [0, 6.1, -1.5], pandaDark),
    box("neck", [10.3, 9.4, 7.2], [0, 11, 6.55], pandaAmber),
    box("head", [12.5, 10.4, 10.5], [0, 13.1, 8.4], pandaRust, null, [0, 0.4, 3.2]),
    box("mask", [10.9, 4.4, 2.2], [0, -2.2, 4.7], pandaCream, "head"),
    box("muzzle", [7.6, 4.1, 4.7], [0, -2.5, 6.5], pandaCream, "head"),
    box("nose", [4.55, 1.75, 1.4], [0, 1, 2.43], black, "muzzle"),
    box("tail", [8.6, 8, 10.8], [0, 10.6, -9], pandaRings, null, [0, -0.6, -5]),
    box("tailMid", [7.6, 7.4, 10.4], [0, -0.5, -4.75], pandaRings, "tail", [0, 0.4, -4.6]),
    box("tailTip", [5.5, 5.4, 6.7], [0, 0.3, -4.35], pandaRings, "tailMid", [0, 0.25, -3])
  ];
  for (const s of [-1, 1]) {
    const ear = box("ear" + s, [4.5, 5.1, 3.45], [4.5 * s, 4.6, -1.3], pandaAmber, "head", [0.4 * s, 1.2, 0]);
    ear.rotation = [0.1, 0, s * -0.22];
    parts.push(
      ear,
      box("earInner" + s, [2.75, 3.5, 0.68], [0, 0.35, 1.76], pandaCream, "ear" + s),
      box("cheek" + s, [3.2, 4, 4.5], [4.8 * s, -2, 3.4], pandaCream, "head"),
      box("brow" + s, [3.15, 1.65, 1.15], [3.45 * s, 2.3, 5.18], pandaCream, "head"),
      box("eye" + s, [1.85, 1.9, 0.74], [3.55 * s, 0.85, 5.38], black, "head"),
      box("eyeShine" + s, [0.45, 0.45, 0.22], [0.24 * s, 0.35, 0.39], ivory, "eye" + s, [0, 0, 0], true)
    );
    for (const end of [-1, 1]) {
      const id = "leg" + s + "_" + end;
      parts.push(
        box(id, [4.1, 6.9, 4.7], [3.7 * s, 7.5, end * 6.35], pandaDark, null, [0, -3.4, 0]),
        box(id + "Paw", [4.4, 2.4, 5], [0, -2.9, 0.75], pandaDark, id)
      );
    }
  }
  return { type: "wildlife", parts };
}

const giraffeGold = solidHide("#d9a461");
const giraffeCream = solidHide("#dfc193");
const giraffeSpots = { all(P, face) {
  giraffeGold.all(P, face);
  const rows = [[1, 0, 5, 5], [9, 1, 5, 4], [4, 6, 6, 5], [12, 7, 4, 5], [0, 11, 5, 4], [7, 13, 5, 3]];
  for (const [x, y, w, h] of rows) {
    P.rect(x + 1, y, w - 2, h, "#94562e");
    P.rect(x, y + 1, w, h - 2, "#94562e");
    P.rect(x + 1, y + 1, w - 2, h - 2, "#a96335");
    P.px(x + 1, y + 1, "#bc7744");
  }
} };
const maneBrown = solidHide("#563328");

function giraffe() {
  const parts = [
    box("body", [14, 15, 30], [0, 34, -3], giraffeSpots),
    box("shoulder", [15, 17, 13], [0, 37.7, 7], giraffeSpots),
    box("rump", [12.8, 13, 10], [0, 31.2, -14], giraffeSpots),
    box("belly", [11, 4, 22], [0, 27.2, -1], giraffeCream),
    box("neck", [8, 20, 9.5], [0, 40, 9], giraffeSpots, null, [0, 9.2, -1.2]),
    box("crest", [2.7, 19.5, 2.1], [0, 0.8, -4.7], maneBrown, "neck"),
    box("neckTop", [5.8, 19.5, 6.2], [0, 8.8, -1.1], giraffeSpots, "neck", [0, 8.7, -1]),
    box("crestTop", [2, 15.8, 1.75], [0, -0.7, -3.1], maneBrown, "neckTop"),
    box("head", [8, 7, 10.5], [0, 8.4, 0.4], giraffeGold, "neckTop", [0, 0, 2.5]),
    box("snout", [6.6, 4.2, 6], [0, -1.9, 5.7], giraffeCream, "head"),
    box("jaw", [5.8, 1.7, 5.9], [0, -3.7, 2.7], giraffeCream, "head", [0, 0, 3]),
    box("tail", [2.6, 13.5, 2.6], [0, 33.8, -18.4], giraffeSpots, null, [0, -6.5, -0.9]),
    box("tailTuft", [3.4, 5.4, 3.1], [0, -6.7, -0.5], maneBrown, "tail")
  ];
  for (const side of [-1, 1]) {
    const ear = box("ear" + side, [5.6, 2.8, 3.7], [side * 4.5, 2.25, -2.6],
      giraffeGold, "head", [side * 1.15, 0, 0]);
    ear.rotation = [0, 0, side * 0.35];
    parts.push(ear,
      box("earInner" + side, [3.8, 1.45, 0.7], [0, 0, 1.75], giraffeCream, ear.name),
      box("ossicone" + side, [2, 4.3, 2.25], [2.35 * side, 4.7, -0.9], giraffeGold, "head"),
      box("hornTuft" + side, [2.65, 1.6, 2.7], [0, 2.25, 0], maneBrown, "ossicone" + side),
      box("eye" + side, [0.85, 1.85, 1.95], [4 * side, 0.85, 3], black, "head"),
      box("glint" + side, [0.25, 0.5, 0.54], [side * 0.49, 0.35, 0.38], ivory, "eye" + side, [0, 0, 0], true),
      box("nostril" + side, [1.2, 0.9, 0.35], [side * 1.8, 0.75, 3.04], maneBrown, "snout"));
    for (const end of [-1, 1]) {
      const id = "leg" + side + "_" + end;
      const height = end === 1 ? 33 : 29;
      parts.push(
        box(id, [end === 1 ? 4.3 : 5.6, height - 15, 5.6], [side * 4.65, height, end * 11 - 2],
          giraffeSpots, null, [0, -(height - 15) * 0.46, 0]),
        box(id + "Shin", [2.45, 13.6, 3.05], [0, (15 - height) * 0.54 + 1, end === -1 ? -0.5 : 0],
          giraffeCream, id, [0, -6.1, 0]),
        box(id + "Hoof", [3.45, 2.8, 4.1], [0, -8.48, 0.35], maneBrown, id + "Shin")
      );
    }
  }
  return { type: "wildlife", parts };
}

const rhinoGray = solidHide("#77777d");
const rhinoLight = solidHide("#838287");
const rhinoFold = solidHide("#6a686f");
const hornGray = solidHide("#c1ad92");

function rhinoceros() {
  const parts = [
    box("loin", [23, 21, 27], [0, 21, -4], rhinoGray),
    box("rump", [21, 23, 14], [0, 20, -16], rhinoGray),
    box("shoulder", [24.5, 25, 15], [0, 23, 10], rhinoLight),
    box("withers", [15, 5, 13], [0, 34, 7.8], rhinoLight),
    box("chest", [19, 15, 6], [0, 16, 15.5], rhinoFold),
    box("head", [15, 13, 19], [0, 21, 16], rhinoGray, null, [0, -2.2, 8.6]),
    box("snout", [13.8, 9, 9.6], [0, -2.6, 8.8], rhinoLight, "head"),
    box("lip", [12.3, 2, 4.5], [0, -4.2, 3.1], rhinoFold, "snout"),
    box("horn", [6.9, 7.4, 7.1], [0, 2.9, 3.0], hornGray, "snout", [0, 2.8, 0]),
    box("hornMid", [4.7, 5.7, 4.8], [0, 3.4, -0.6], hornGray, "horn", [0, 1.7, 0]),
    box("hornTip", [2.45, 4.65, 2.7], [0, 2.45, -0.68], hornGray, "hornMid", [0, 1.3, 0]),
    box("secondHorn", [4.1, 4.3, 4.1], [0, 6.4, 3], hornGray, "head", [0, 1, 0]),
    box("tail", [2.65, 9.8, 2.9], [0, 23, -23], rhinoGray, null, [0, -4.2, -0.3]),
    box("tailTip", [3.2, 3.1, 3.3], [0, -5.3, -0.2], rhinoFold, "tail")
  ];
  for (const side of [-1, 1]) {
    const ear = box("ear" + side, [3.8, 7.1, 3.7], [5.4 * side, 6.8, -3.2],
      rhinoGray, "head", [0, 2.3, 0]);
    ear.rotation = [0.13, 0, -side * 0.37];
    const fold = box("shoulderFold" + side, [1.15, 18.5, 2.4], [11.95 * side, 22.5, 4], rhinoFold);
    fold.rotation = [-0.32, 0, 0];
    parts.push(fold, ear,
      box("innerEar" + side, [2.15, 4.8, 0.64], [0, 0.25, 1.89], rhinoFold, ear.name),
      box("eye" + side, [0.95, 2.5, 2.2], [7.4 * side, 2.45, 4.8], black, "head"),
      box("brow" + side, [1.7, 1.2, 3.7], [7.2 * side, 4.2, 4.6], rhinoFold, "head"),
      box("nostril" + side, [2.15, 1.55, 0.67], [3.95 * side, 0.8, 4.76], rhinoFold, "snout"));
    for (const end of [-1, 1]) {
      const id = "leg" + side + "_" + end;
      parts.push(
        box(id, [8.5, 15.8, 9.7], [7.1 * side, 17, end === 1 ? 11 : -14], rhinoGray, null, [0, -5, 0]),
        box(id + "Foot", [8.4, 5.6, 9.7], [0, -9.1, 0.65], rhinoFold, id));
      for (let i = -1; i <= 1; i++) {
        parts.push(box(id + "Toe" + i, [1.9, 1.8, 1.2], [2.3 * i, -1.7, 4.8], hornGray,
          id + "Foot", [0, 0, 0], true));
      }
    }
  }
  return { type: "wildlife", parts };
}

const ostrichFeather = solidHide("#343138");
const ostrichBrown = solidHide("#837367");
const ostrichWhite = solidHide("#ddd3c4");
const ostrichFawn = solidHide("#b39e87");
const ostrichSkin = solidHide("#c6a695");
const ostrichBeak = solidHide("#bca788");
const ostrichBody = {
  all(P, face, variant) { (variant === 0 ? ostrichFeather : ostrichBrown).all(P, face); }
};
const ostrichPlumes = {
  all(P, face, variant) { (variant === 0 ? ostrichWhite : ostrichFawn).all(P, face); }
};

function ostrich() {
  const parts = [
    box("body", [17.2, 16, 22.8], [0, 22.5, -3], ostrichBody),
    box("chest", [14, 12.8, 10.5], [0, 22.2, 6], ostrichBody),
    box("back", [15.1, 6.2, 15.8], [0, 29.2, -4], ostrichBody),
    box("pelvis", [13.5, 8, 12], [0, 17.4, -7.7], ostrichBody),
    box("tail", [13.5, 6, 9.5], [0, 25.8, -12.6], ostrichPlumes, null, [0, 0.5, -3.5]),
    box("tailTips", [9.6, 4.7, 6], [0, 0.8, -4.1], ostrichPlumes, "tail"),
    box("neck", [5.2, 14.3, 5.4], [0, 26.4, 6.7], ostrichSkin, null, [0, 6.5, 0.5]),
    box("neckTop", [3.65, 11.2, 3.7], [0, 5.8, 0.65], ostrichSkin, "neck", [0, 4.7, 0.2]),
    box("head", [6.6, 6.4, 7.9], [0, 5.5, 1], ostrichSkin, "neckTop", [0, 0.8, 0]),
    box("crown", [5.3, 2, 5.1], [0, 3.1, -1.2], ostrichPlumes, "head"),
    box("beak", [5.1, 1.9, 5.25], [0, -0.65, 4.75], ostrichBeak, "head"),
    box("lowerBeak", [4.2, 0.85, 4.6], [0, -1.25, 3.3], ostrichSkin, "head", [0, 0, 1.35])
  ];
  for (const side of [-1, 1]) {
    const wing = "wing" + side, leg = "leg" + side;
    parts.push(
      box(wing, [4.2, 10.5, 19.5], [side * 7.1, 24.9, -2.2], ostrichBody, null, [side * 0.5, 0, -1.1]),
      box(wing + "Flight", [3.3, 6.15, 16.8], [side * 1.5, -3.1, -2.2], ostrichPlumes, wing),
      box(wing + "Tip", [1.7, 4, 8.2], [side * 0.48, -1.4, -6], ostrichPlumes, wing + "Flight", [0, 0, 0], true),
      box("eye" + side, [0.9, 2.1, 2.3], [side * 3.22, 0.48, 1.75], black, "head"),
      box("eyeGlint" + side, [0.28, 0.62, 0.56], [side * 0.48, 0.42, 0.36], ivory, "eye" + side, [0, 0, 0], true),
      box(leg, [5.35, 10.25, 5.8], [side * 4.9, 19.4, -5], ostrichSkin, null, [0, -4.2, 0.4]),
      box(leg + "Shin", [2.8, 11.8, 2.9], [0, -4.6, -0.6], ostrichSkin, leg, [0, -4.9, -0.5]),
      box(leg + "Foot", [3.25, 1.8, 5.2], [0, -4.8, 1.1], ostrichBeak, leg + "Shin"),
      box(leg + "Toe", [1.45, 1.05, 2.3], [side * 0.5, -0.2, 2.3], ostrichBeak, leg + "Foot")
    );
  }
  return { type: "wildlife", parts };
}

const slothFur = solidHide("#776255");
const slothBack = solidHide("#806951");
const slothFace = solidHide("#cbb299");
const slothMask = solidHide("#654d41");
const slothMuzzle = { ...slothFace, front(P) {
  slothFace.all(P);
  P.rect(6, 11, 4, 1, "#84705e");
} };
const slothClaw = solidHide("#b9a085");

function sloth() {
  const parts = [
    box("body", [12.3, 11, 14.8], [0, 9.3, -1.4], slothFur),
    box("rump", [11.8, 10.8, 8.3], [0, 8.9, -6.3], slothBack),
    box("saddle", [9.7, 4.7, 12.6], [0, 13.35, -2.5], slothBack),
    box("belly", [9.3, 6.8, 12.7], [0, 6.25, -0.6], slothBack),
    box("head", [10.2, 9, 8.2], [0, 11, 5.3], slothFur, null, [0, 0.6, 2.2]),
    box("face", [8.9, 7.05, 3.1], [0, -0.45, 3.42], slothFace, "head"),
    box("forehead", [6.8, 2.1, 2.1], [0, 3.4, 3.15], slothFace, "head"),
    box("muzzle", [4.9, 3.45, 3.5], [0, -1.65, 5.17], slothMuzzle, "head"),
    box("nose", [2.75, 1.6, 0.85], [0, 0.45, 1.66], black, "muzzle")
  ];
  for (const side of [-1, 1]) {
    const mask = box("mask" + side, [3.5, 2.15, 0.62], [side * 2.65, 0.28, 5.02], slothMask, "head");
    mask.rotation = [0, side * 0.11, side * 0.34];
    parts.push(mask,
      box("eye" + side, [1.3, 1.35, 0.35], [-0.24 * side, 0.15, 0.39], black, mask.name),
      box("glint" + side, [0.47, 0.42, 0.16], [0.26, 0.3, 0.21], ivory, "eye" + side, [0, 0, 0], true));
    for (const end of [-1, 1]) {
      const arm = end === 1, limb = (arm ? "arm" : "leg") + side;
      parts.push(
        box(limb, [3.8, arm ? 7.1 : 5.55, 4.3], [side * 4.75, 10.1, arm ? 4.4 : -6.4], slothBack, null, [side * 0.58, -2.5, 0]),
        box(limb + "Lower", [2.9, arm ? 5 : 4.1, 3.45], [side * 0.55, arm ? -3.0 : -2.05, arm ? 0.24 : 0.65],
          slothFur, limb, [0, arm ? -1.45 : -1.3, 0.55]),
        box(limb + "Grip", [3.4, 2.05, 3.25], [0, -2, 0.8], slothMask, limb + "Lower")
      );
      for (let finger = -1; finger <= 1; finger++) {
        const claw = limb + "Claw" + finger;
        parts.push(
          box(claw, [0.76, 1.25, 1.85], [finger * 0.85, -0.5, 1.52], slothClaw, limb + "Grip"),
          box(claw + "Hook", [0.65, 0.85, 0.7], [0, 0.42, 0.65], slothClaw, claw, [0, 0, 0], true)
        );
      }
    }
  }
  return { type: "wildlife", parts };
}

const koalaFur = solidHide("#81848a");
const koalaRuff = solidHide("#a4a3a5");
const koalaCream = solidHide("#d0cbc0");
const koalaEar = solidHide("#938087");

function koala() {
  const parts = [
    box("body", [12.1, 12.6, 10.5], [0, 8.7, -1.8], koalaFur),
    box("back", [10.2, 7.1, 4], [0, 8.9, -5.8], koalaRuff),
    box("bib", [8.8, 8.7, 3.55], [0, 9.3, 3.05], koalaCream),
    box("head", [12.1, 9.5, 9.45], [0, 13.5, 1.4], koalaFur, null, [0, 1.2, 0.5]),
    box("crown", [9.1, 1.55, 7.1], [0, 4.7, -0.35], koalaRuff, "head"),
    box("chin", [8.1, 3.1, 3.5], [0, -3.3, 3.7], koalaCream, "head"),
    box("nose", [4.45, 4.65, 2.7], [0, -0.05, 5.3], black, "head"),
    box("noseBridge", [3.2, 2.2, 1.65], [0, 2.5, 4.91], black, "head"),
    box("jaw", [3.9, 1.55, 2.35], [0, -3.55, 4.9], koalaCream, "head")
  ];
  for (const side of [-1, 1]) {
    const ear = "ear" + side, arm = "arm" + side, leg = "leg" + side;
    const outer = box(ear, [6.45, 7.4, 3.15], [side * 5.55, 2.28, -0.52],
      koalaRuff, "head", [side * 0.97, 0.45, 0]);
    outer.rotation = [0.04, side * 0.09, side * -0.2];
    parts.push(outer,
      box(ear + "Rim", [4.5, 3.3, 2.68], [side * 0.27, 2.93, -0.02], koalaCream, ear),
      box(ear + "Inner", [3.85, 4.7, 0.85], [side * 0.29, 0.3, 1.56], koalaEar, ear),
      box(ear + "Tuft", [2.35, 3.8, 1.75], [side * 2.95, -0.56, 0.16], koalaCream, ear, [0, 0, 0], true),
      box("eye" + side, [1.45, 1.5, 0.46], [side * 3.86, 1.01, 4.76], black, "head"),
      box("eyeGlint" + side, [0.44, 0.47, 0.2], [side * 0.27, 0.28, 0.24], ivory, "eye" + side, [0, 0, 0], true),
      box(arm, [4.1, 6.6, 4.15], [side * 5.05, 10.9, 2.57], koalaFur, null, [side * 0.25, -2.65, 0.28]),
      box(arm + "Paw", [3.15, 3.35, 3.9], [side * 0.16, -3.55, 0.55], koalaRuff, arm),
      box(leg, [4.7, 5.6, 5.7], [side * 4.35, 5.55, -2.45], koalaFur, null, [0, -1.35, 0.27]),
      box(leg + "Paw", [3.7, 2.6, 4.8], [0, -2.85, 1.2], koalaRuff, leg)
    );
    for (let finger = -1; finger <= 1; finger++) {
      parts.push(box(arm + "Claw" + finger, [0.62, 1.0, 1.16],
        [finger * 0.83, -0.87, 1.7], black, arm + "Paw", [0, 0, 0], true));
    }
  }
  return { type: "wildlife", parts };
}

const peacockBlue = solidHide("#244993");
const peacockTeal = solidHide("#208780");
const peacockBrown = solidHide("#746156");
const peacockSage = solidHide("#5d7763");
const peacockBody = { all(P, face, variant) {
  (variant ? peacockBrown : peacockBlue).all(P, face);
} };
const peacockNeck = { all(P, face, variant) {
  (variant ? peacockSage : peacockTeal).all(P, face);
} };
const fanStem = solidHide("#426c45");
const fanEye = { all(P, face) {
  fanStem.all(P, face);
  if (face !== "front" && face !== "back") return;
  P.rect(3, 2, 10, 12, "#75a038");
  P.rect(1, 5, 14, 6, "#75a038");
  P.rect(4, 3, 8, 10, "#ceaa57");
  P.rect(3, 5, 10, 6, "#ceaa57");
  P.rect(5, 4, 6, 8, "#248476");
  P.rect(4, 6, 8, 4, "#248476");
  P.rect(6, 5, 4, 5, "#1d416d");
  P.rect(7, 6, 3, 4, "#202846");
  P.px(6, 5, "#5fafe4");
} };

function peacock() {
  const parts = [
    box("body", [12.2, 10.65, 16.5], [0, 11, -2.2], peacockBody),
    box("saddle", [10.7, 6, 12.3], [0, 14.4, -4.1], peacockNeck),
    box("breast", [9.5, 9.3, 8.1], [0, 12.7, 4], peacockBody),
    box("wingLeft", [3.1, 6.7, 12.45], [-5.2, 12.2, -3.6], peacockBody),
    box("wingRight", [3.1, 6.7, 12.45], [5.2, 12.2, -3.6], peacockBody),
    box("neck", [5.35, 10.8, 5.4], [0, 14, 4.85], peacockNeck, null, [0, 4.6, 0]),
    box("head", [6.5, 5.8, 6.15], [0, 5.1, 0.75], peacockBody, "neck", [0, 1.95, 0.46]),
    box("beak", [3.55, 2.17, 4.98], [0, -0.78, 4.42], ivory, "head"),
    box("shortTail", [8.9, 3.2, 9.8], [0, 13, -9.31], peacockBody),
    box("fan", [8.3, 4, 3.8], [0, 13.85, -9.1], fanStem)
  ];
  parts.find(part => part.name === "fan").rotation = [-1.45, 0, 0];
  for (const side of [-1, 1]) {
    parts.push(
      box("cheek" + side, [0.48, 2.8, 3.15], [side * 3.2, 0.43, 1.29], ivory, "head"),
      box("eye" + side, [0.44, 1.39, 1.4], [side * 0.26, 0.27, 0.35], black, "cheek" + side),
      box("leg" + side, [1.83, 8.8, 2.3], [side * 2.95, 8.9, -1.8], peacockBrown, null, [0, -3.9, 0]),
      box("toe" + side, [2.45, 1.65, 5.3], [0, -4.3, 1.08], peacockBrown, "leg" + side)
    );
  }
  for (let i = -1; i <= 1; i++) {
    parts.push(
      box("crest" + i, [0.68, 3.2, 0.73], [i * 1.28, 3.6 + (i === 0 ? 0.35 : 0), -0.6], peacockNeck, "head"),
      box("crestTip" + i, [1.2, 1.45, 0.96], [i * 0.1, 1.72, -0.07], peacockBody, "crest" + i)
    );
  }
  for (let i = -4; i <= 4; i++) {
    const name = "feather" + i, length = 30 - Math.abs(i) * 1.6;
    const feather = box(name, [2.5, length, 1.05], [i * 0.7, 0.2, Math.abs(i) * 0.36],
      fanStem, "fan", [0, length / 2, 0]);
    feather.rotation = [0.02, 0, i * 0.029];
    parts.push(feather,
      box(name + "Vane", [5.45, 9.7, 1.55], [0, length / 2 - 2.05, 0], fanEye, name),
      box(name + "Point", [3.25, 2.2, 1.19], [0, 4.65, 0], fanStem, name + "Vane", [0, 0, 0], true)
    );
  }
  return { type: "wildlife", parts };
}

const flamingoPink = solidHide("#df8297");
const flamingoRose = solidHide("#cb6780");
const flamingoLight = solidHide("#efb4b8");
const flamingoLeg = solidHide("#b65e75");

function flamingo() {
  const parts = [
    box("body", [11.9, 11.8, 17.8], [0, 26.1, -2.4], flamingoPink),
    box("breast", [10.7, 10.2, 8.15], [0, 26.2, 4.2], flamingoLight),
    box("saddle", [9.8, 6.5, 13.1], [0, 30.45, -2.2], flamingoRose),
    box("tail", [8.75, 4.55, 8.5], [0, 27.3, -10], flamingoRose, null, [0, 0, -2.75]),
    box("neck", [4.65, 11.6, 4.95], [0, 28.8, 5.9], flamingoPink, null, [0, 4.2, -0.15]),
    box("neckArc", [3.68, 7.65, 4.3], [0, 4.9, -0.7], flamingoPink, "neck", [0, 2.8, -1.05]),
    box("neckTop", [3.32, 6.25, 4.9], [0, 3.2, 0.2], flamingoLight, "neckArc", [0, 2.35, 1.0]),
    box("head", [5.8, 5.3, 6.85], [0, 2.85, 1.22], flamingoPink, "neckTop", [0, 0.65, 1.15]),
    box("mask", [4.75, 3.5, 1.8], [0, -0.72, 3.3], flamingoLight, "head"),
    box("beak", [4.32, 2.8, 4.8], [0, -1.06, 4.1], flamingoLight, "head", [0, -0.08, 1.7]),
    box("beakHook", [3.75, 3.15, 3.3], [0, -1.65, 1.1], black, "beak", [0, -0.68, 0.5]),
    box("beakTip", [3.15, 1.54, 1.75], [0, -1.35, 0.58], black, "beakHook")
  ];
  for (const side of [-1, 1]) {
    const leg = "leg" + side, wing = "wing" + side;
    parts.push(
      box(wing, [3.3, 7.25, 14.65], [side * 4.85, 27.4, -1.9], flamingoRose, null, [side * 0.2, 0, -1.25]),
      box(wing + "Flight", [2.3, 3.6, 11.45], [side * 0.55, -2.55, -2.1], black, wing),
      box(wing + "Cover", [1.45, 4.15, 12.3], [side * 1.62, -1.24, -0.28], flamingoPink, wing),
      box("eye" + side, [0.46, 1.36, 1.51], [side * 2.91, 0.41, 1.48], ivory, "head"),
      box("pupil" + side, [0.26, 0.69, 0.76], [side * 0.25, -0.07, 0.1], black, "eye" + side),
      box(leg, [2.35, 12.6, 2.55], [side * 2.7, 23.9, -1.85], flamingoLeg, null, [0, -5.45, 0]),
      box(leg + "Shin", [1.6, 12.5, 1.75], [0, -5.83, 0.16], flamingoLeg, leg, [0, -5.75, 0.25]),
      box(leg + "Hock", [2.3, 2.2, 2.2], [0, 4.8, 0], flamingoRose, leg + "Shin"),
      box(leg + "Foot", [3.45, 1.35, 4.8], [0, -5.92, 1.26], flamingoLeg, leg + "Shin")
    );
  }
  return { type: "wildlife", parts };
}

const kangarooFur = solidHide("#b37b56");
const kangarooDark = solidHide("#895b4b");
const kangarooCream = solidHide("#d0ad86");
const kangarooEar = solidHide("#ad7d6f");

function kangaroo() {
  const parts = [
    box("hips", [14.4, 13.3, 13.2], [0, 13.9, -2.35], kangarooFur),
    box("torso", [11.45, 16, 10.7], [0, 19.9, 1.1], kangarooFur),
    box("shoulders", [10.8, 7.6, 10], [0, 25.1, 3.1], kangarooDark),
    box("pouch", [10.1, 9.8, 5], [0, 15.9, 6.15], kangarooCream),
    box("pouchRim", [9.05, 2.3, 3.2], [0, 20.25, 7.23], kangarooDark),
    box("joey", [5.5, 5.13, 4.9], [0, 21.8, 7], kangarooFur, null, [0, 0.55, 0.35]),
    box("joeySnout", [3.15, 2.12, 2.55], [0, -0.69, 2.43], kangarooCream, "joey"),
    box("joeyNose", [1.55, 1.02, 0.68], [0, 0.32, 1.18], black, "joeySnout"),
    box("neck", [7.35, 8.6, 7.9], [0, 26.5, 4.25], kangarooFur, null, [0, 2.5, 0.8]),
    box("head", [7.9, 7.15, 8.4], [0, 4.95, 1.02], kangarooFur, "neck", [0, 1.75, 0.88]),
    box("muzzle", [5.8, 4.02, 5.3], [0, -1.24, 4.85], kangarooCream, "head"),
    box("nose", [3.67, 1.86, 1.16], [0, 0.67, 2.51], black, "muzzle"),
    box("tail", [8.1, 8.1, 11.4], [0, 12.1, -6.4], kangarooDark, null, [0, -1.35, -4.4]),
    box("tailMid", [5.5, 5.8, 11.05], [0, -1.25, -4.75], kangarooFur, "tail", [0, -1.04, -4.45]),
    box("tailTip", [3.85, 3.55, 10.7], [0, -0.83, -4.55], kangarooDark, "tailMid", [0, -0.64, -4.6]),
    box("tailEnd", [2.35, 2.2, 5.8], [0, -0.53, -4.85], kangarooDark, "tailTip", [0, 0, -2.32])
  ];
  for (const side of [-1, 1]) {
    const ear = "ear" + side, leg = "leg" + side, arm = "arm" + side;
    const upright = box(ear, [2.9, 9.15, 2.4], [side * 2.7, 2.75, -1.68], kangarooDark, "head", [0, 3.95, 0]);
    upright.rotation = [0.16, 0.04 * side, -side * 0.21];
    parts.push(upright,
      box(ear + "Inner", [1.62, 6.42, 0.61], [0, 0.45, 1.21], kangarooEar, ear),
      box("eye" + side, [0.53, 1.84, 1.75], [side * 3.97, 0.57, 2.76], black, "head"),
      box("glint" + side, [0.22, 0.48, 0.48], [side * 0.29, 0.35, 0.36], ivory, "eye" + side, [0, 0, 0], true),
      box("joeyEar" + side, [1.45, 4.12, 1.35], [side * 1.8, 2.17, -0.72], kangarooDark, "joey", [side * 0.2, 1.6, 0]),
      box("joeyEye" + side, [0.82, 0.9, 0.43], [side * 1.57, 0.45, 2.48], black, "joey"),
      box(arm, [3.27, 8, 4.03], [side * 4.67, 23.3, 4], kangarooFur, null, [0, -3.3, 0.42]),
      box(arm + "Paw", [2.6, 4.25, 3.03], [0, -3.51, 0.55], kangarooDark, arm, [0, -1.65, 0.42]),
      box(leg, [6.8, 11.5, 9.3], [side * 4.28, 14.55, -2.25], kangarooFur, null, [side * 0.16, -4.67, 1.45]),
      box(leg + "Shin", [3.6, 7, 4.55], [0, -4.3, 1.44], kangarooDark, leg, [0, -2.75, -0.6]),
      box(leg + "Foot", [4.13, 2.7, 8.77], [0, -2.15, 2.17], kangarooDark, leg + "Shin"),
      box(leg + "Toes", [3.64, 1.6, 1.8], [0, -0.45, 4], kangarooCream, leg + "Foot", [0, 0, 0], true)
    );
  }
  return { type: "wildlife", parts };
}

const elephantGray = solidHide("#818084");
const elephantRuff = solidHide("#8b898c");
const elephantFold = solidHide("#747278");
const elephantEar = solidHide("#96878a");
const elephantIvory = solidHide("#d4c1a1");
const elephantCloth = solidHide("#4c7b79");
const elephantPack = solidHide("#875e42");

function elephant() {
  const parts = [
    box("torso", [30, 26, 34], [0, 31.9, -5.7], elephantGray),
    box("rump", [27.5, 23.5, 17], [0, 30.5, -20], elephantRuff),
    box("shoulder", [30.9, 30.5, 20.4], [0, 34.5, 7.5], elephantGray),
    box("ridge", [21.2, 4.95, 32.6], [0, 46, -2.6], elephantRuff),
    box("belly", [24.3, 8.35, 28.4], [0, 20.6, -5.2], elephantFold),
    box("neck", [21.9, 20.2, 15.3], [0, 35.8, 14], elephantGray),
    box("head", [19, 19.8, 16.9], [0, 36.8, 18.5], elephantRuff, null, [0, 1.12, 5.55]),
    box("forehead", [14.9, 7.9, 8.65], [0, 6.85, 5.12], elephantGray, "head"),
    box("cheeks", [17.6, 9.6, 9.5], [0, -4.8, 5.1], elephantGray, "head"),
    box("trunk", [8.65, 10.7, 9.1], [0, -5.75, 7.1], elephantRuff, "head", [0, -4.7, 2.65]),
    box("trunkMid", [7, 9.55, 7.65], [0, -4.55, 0.95], elephantGray, "trunk", [0, -4.1, 0.65]),
    box("trunkEnd", [5.45, 8.3, 6.1], [0, -4.15, 0.3], elephantRuff, "trunkMid", [0, -3.55, 0.8]),
    box("trunkTip", [4.55, 4.48, 5.4], [0, -3.25, 0.95], elephantGray, "trunkEnd", [0, -1.75, 0.5]),
    box("nostrils", [3.55, 1.14, 3.8], [0, -2.18, 0.1], elephantFold, "trunkTip"),
    box("tail", [3.35, 16.4, 3.8], [0, 34.7, -27.4], elephantGray, null, [0, -7.1, -0.85]),
    box("tailTuft", [4.45, 6.3, 4.35], [0, -7.65, 0.1], elephantFold, "tail"),
    box("saddle", [20.5, 3.15, 18.35], [0, 49, -4.3], elephantCloth),
    box("seat", [15.75, 2.55, 13.4], [0, 2.15, 0], elephantPack, "saddle")
  ];
  for (const s of [-1, 1]) {
    const ear = "ear" + s, tusk = "tusk" + s, cargo = "pack" + s;
    parts.push(
      box(ear, [12.6, 19.4, 5.15], [s * 8.35, 1.75, -4.2], elephantGray, "head", [s * 5.1, -2.25, 0.7]),
      box(ear + "Lower", [9.9, 7.85, 4.18], [-s * 0.43, -7.65, 0.15], elephantGray, ear),
      box(ear + "Inset", [8.5, 13.8, 1.45], [s * 0.35, 0.18, 2.5], elephantEar, ear),
      box("eye" + s, [0.76, 2.42, 2.8], [s * 9.5, 0.25, 4.71], black, "head"),
      box("brow" + s, [1.65, 1.6, 4.35], [s * 8.78, 2.2, 4.42], elephantGray, "head"),
      box("glint" + s, [0.29, 0.54, 0.59], [s * 0.45, 0.43, 0.23], ivory, "eye" + s, [0, 0, 0], true),
      box(tusk, [4.45, 4.6, 10.55], [s * 6.63, -7.25, 6], elephantIvory, "head", [s * 0.45, -0.3, 4]),
      box(tusk + "Mid", [3.2, 3.35, 6.1], [s * 0.55, 0.55, 4.85], elephantIvory, tusk, [s * 0.33, 0.38, 2.3]),
      box(tusk + "Tip", [1.95, 2.25, 4.55], [s * 0.32, 0.55, 2.82], elephantIvory, tusk + "Mid", [0, 1.04, 1.75]),
      box(cargo, [6.35, 10.7, 14.05], [s * 15.6, 34.45, -6], elephantPack),
      box(cargo + "Flap", [6.75, 4.05, 14.6], [s * 0.1, 4.11, 0], elephantCloth, cargo),
      box(cargo + "Latch", [0.8, 2.55, 2.65], [s * 3.25, 0.92, 0], elephantIvory, cargo)
    );
    for (const end of [-1, 1]) {
      const leg = "leg" + s + "_" + end;
      parts.push(
        box(leg, [end === 1 ? 9.65 : 10.5, 15, 11.25], [s * 9.2, 23.85, end === 1 ? 10.1 : -17.3],
          elephantGray, null, [0, -6.5, 0]),
        box(leg + "Shin", [8.6, 10.65, 8.8], [0, -7.25, 0.25], elephantRuff, leg, [0, -4.35, 0]),
        box(leg + "Foot", [10.2, 4.35, 10.9], [0, -3.55, 0.82], elephantFold, leg + "Shin")
      );
      for (let i = -1; i <= 1; i++) {
        parts.push(box(leg + "Nail" + i, [1.88, 1.67, 0.96], [i * 2.46, -0.8, 5.41],
          elephantIvory, leg + "Foot", [0, 0, 0], true));
      }
    }
  }
  return { type: "wildlife", parts };
}

const falconSlate = solidHide("#535a6c");
const falconDark = solidHide("#424654");
const falconCream = solidHide("#c9af91");
const falconFoot = solidHide("#ba944e");
const falconBars = { all(P, face) {
  falconCream.all(P, face);
  if (face === "front" || face === "bottom" || face === "left" || face === "right") {
    for (const y of [5, 9, 13]) for (const x of [1, 5, 9, 13]) {
      P.rect(x + ((y + x) % 3 === 0 ? 0 : 1), y, 2, 1, "#5a483e");
    }
  }
} };
const falconTail = { all(P, face) {
  falconSlate.all(P, face);
  if (face === "top" || face === "bottom") {
    for (const y of [3, 7, 11, 15]) P.rect(0, y, 16, 1, "#282d3b");
  }
} };

function falcon() {
  const parts = [
    box("body", [8.35, 7.8, 11.5], [0, 7.5, 0], falconSlate),
    box("chest", [7.4, 6.3, 9.8], [0, 5.45, 1.26], falconBars),
    box("back", [6.65, 3.35, 9.8], [0, 10.73, -1.2], falconDark),
    box("neck", [6.65, 5.4, 6.6], [0, 9.05, 4.3], falconSlate),
    box("head", [7.05, 6.55, 6.9], [0, 11.2, 4.87], falconDark, null, [0, 0.95, 2.2]),
    box("throat", [5.8, 3.6, 4.2], [0, -2.5, 2.2], falconCream, "head"),
    box("beak", [3.03, 2.65, 3.4], [0, -0.48, 3.78], falconFoot, "head"),
    box("hook", [2.45, 2.5, 2.45], [0, -0.91, 1.54], black, "beak"),
    box("tail", [5.8, 1.82, 9.75], [0, 7.6, -4.5], falconTail, null, [0, 0.1, -4.28]),
    box("tailTip", [5.0, 1.32, 4.3], [0, -0.13, -4.61], falconTail, "tail")
  ];
  for (const side of [-1, 1]) {
    const wing = "wing" + side, wrist = "wrist" + side, leg = "leg" + side;
    parts.push(
      box("cheek" + side, [0.72, 3.82, 3.75], [side * 3.48, -0.8, 0.8], falconCream, "head"),
      box("malar" + side, [0.84, 3.25, 1.5], [side * 0.52, -0.19, 0.6], falconDark, "cheek" + side),
      box("eyeRing" + side, [0.83, 2.27, 2.43], [side * 3.56, 1.0, 2.03], falconFoot, "head"),
      box("eye" + side, [0.45, 1.46, 1.53], [side * 0.48, 0.02, 0.15], black, "eyeRing" + side),
      box("glint" + side, [0.13, 0.38, 0.43], [side * 0.25, 0.37, 0.34], ivory, "eye" + side, [0, 0, 0], true),
      box(wing, [10.7, 2.42, 8.45], [side * 3.42, 8.98, 1.03], falconSlate, null, [side * 4.75, 0, -0.42]),
      box(wing + "Trailing", [9.55, 1.91, 4.05], [side * 0.58, -0.07, -3.71], falconDark, wing),
      box(wrist, [8.28, 1.88, 5.5], [side * 4.76, 0.08, -0.35], falconSlate, wing, [side * 3.64, 0.02, -0.86]),
      box(wrist + "Primary", [6.72, 1.48, 3.38], [side * 0.48, -0.12, -2.42], falconDark, wrist),
      box(wrist + "Tip", [5.9, 1.22, 2.82], [side * 3.41, -0.13, -1.7], falconDark, wrist, [side * 2.35, 0, -0.95]),
      box(wrist + "Feather", [3.25, 0.92, 1.65], [side * 2.63, -0.09, -1.47], falconDark, wrist + "Tip", [side * 0.6, 0, 0], true),
      box(leg, [1.83, 4.2, 2.18], [side * 2.25, 4.4, -0.92], falconFoot, null, [0, -1.8, 0.21]),
      box(leg + "Foot", [2.7, 1.45, 3.52], [0, -1.9, 0.92], falconFoot, leg)
    );
    for (let i = -1; i <= 1; i++) {
      parts.push(box(leg + "Talon" + i, [0.62, 0.72, 1.12], [i * 0.67, -0.22, 1.63],
        black, leg + "Foot", [0, 0, 0], true));
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
  zebra,
  tiger,
  deer,
  moose,
  red_panda: redPanda,
  giraffe,
  rhinoceros,
  ostrich,
  sloth,
  koala,
  peacock,
  flamingo,
  kangaroo,
  elephant,
  falcon
};
