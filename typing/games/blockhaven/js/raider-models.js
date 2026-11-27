// Authored cuboids in sixteenths of a world block. A part is baked into one mesh,
// including its surface details, and moves around its own joint.
const IRON = 0x81828a, EDGE = 0xa7a7a8, DARKIRON = 0x51525a, RIVET = 0xc3ad8a;
const OAK = 0x855138, LEATHER = 0x5b382d, INK = 0x2c272d, BONE = 0xd3be9a, GOLD = 0xcda559;
const SIDES = [-1, 1];

export const RAIDER_TYPES = Object.freeze(["pillager", "vindicator", "evoker", "ravager"]);
const LOOKS = {
  pillager: [0x7b3049, 0xa24a5a, 0x382d37, 0xaac8d0],
  vindicator: [0x305d64, 0x58888b, 0x362f36, 0x86c6d7],
  evoker: [0x55316f, 0x7e4396, 0x2f2638, 0xd2a4dc],
  ravager: [0x662e3b, 0xa24445, 0x4d4348, 0xd3a571]
};
const SKIN = [[0xa29ba6, 0x706977], [0x918b9b, 0x635e6b], [0x9c98a5, 0x746c78]];
export function raiderAppearance(type, uid, rank) {
  if (!Object.hasOwn(LOOKS, type)) return null;
  let hash = 2166136261;
  for (const c of String(uid ?? "")) hash = Math.imul(hash ^ c.codePointAt(0), 16777619);
  hash = (hash ^ hash >>> 16) >>> 0;
  const variant = hash % 3;
  const [cloth, trim, base, eyes] = LOOKS[type];
  const ranked = (type === "pillager" && rank === "banner") || (type === "vindicator" && rank === "siege");
  const growth = type === "ravager" && (hash >>> 8) % 9 === 0;
  return { type, growth, rank: ranked ? rank : "", variant, phase: (hash >>> 16) / 65536,
    key: [type, ranked ? rank : "", variant, growth ? 1 : 0].join("/"), cloth, trim, base, eyes, skin: SKIN[variant] };
}

const part = (at, parent) => ({ at, parent, core: [], detail: [] });
const localPart = at => ({ ...part(at), local: true });
function put(part, surface, pigment, x, y, z, width, height, depth, fine = false, faces) {
  part[fine ? "detail" : "core"].push({ surface, pigment, at: [x, y, z], size: [width, height, depth], faces });
}
function plate(p, x, y, z, w, h, d, color = IRON) {
  put(p, "iron", color, x, y, z, w, h, d);
  put(p, "iron", EDGE, x, y + h / 2 - .14, z + d / 2 + .025, w * .86, .22, .09, true, [4]);
  for (const side of SIDES) put(p, "brass", RIVET, x + w * side * .32, y + h * .25, z + d / 2 + .1, .26, .27, .17, true);
}
function buckle(p, x, y, z, size, trim = RIVET) {
  put(p, "brass", trim, x, y, z, size, size * .82, .44);
  put(p, "leather", INK, x, y, z + .26, size * .55, size * .43, .12);
}
function sigil(p, x, y, z, s, pigment, face = 4) {
  const normal = face === 4 ? 1 : -1;
  for (const [u,v,w,h] of [[-2,1,1,2],[2,1,1,2],[-1,0,1.15,1.1],[1,0,1.15,1.1],[0,-.4,1,2.6],[0,1,1.4,.55]]) {
    put(p, "linen", pigment, x + u * s, y + v * s, z + normal * .03, w * s, h * s, .07, false, [face]);
  }
}
function spiral(p, x, y, z, s, pigment, face = 4, fine = false) {
  const normal = face === 4 ? 1 : -1;
  for (const [u,v,w,h] of [[0,2,5,.65],[-2,0,.65,4],[-.35,-2,4,.65],[1.65,-.7,.65,2.8],[.7,.55,1.9,.65]]) {
    put(p, "brass", pigment, x + u * s * normal, y + v * s, z + normal * .03, w * s, h * s, .09, fine, [face]);
  }
}
function cloak(p, color, lining, w, l, z, start) {
  put(p, "wool", color, 0, start - l / 2, z, w, l, .6);
  for (let i = 0; i < 5; i++) {
    const hem = [3.0, 1.6, 2.6, 3.25, 1.2][i];
    put(p, "wool", i % 2 ? lining : color, (i - 2) * w / 5, start - l - hem / 2, z - (i % 2) * .13,
      w / 5 + .025, hem, .57);
  }
  for (const side of SIDES) put(p, "linen", lining, (w / 2 - .32) * side, start - l / 2, z - .34, .35, l, .08, true, [5]);
}
function illager(a) {
  const heavy = a.type === "vindicator", spell = a.type === "evoker", captain = a.rank === "banner";
  const body = part([0, 0, 0]), head = part([0, 22.7, 0]), cape = part([0, 21.2, -2.8]);
  const model = { body, head, cape };
  const trim = spell || a.rank ? GOLD : a.trim;
  put(body, "wool", a.base, 0, 17.1, 0, heavy ? 8.5 : 8, 10.6, 5.6);
  put(body, "wool", a.cloth, 0, 11.7, .1, 8.2, 5.5, 5.8);
  put(body, "leather", LEATHER, 0, 13.45, 0, 9, 1.45, 6.5);
  buckle(body, 0, 13.45, 3.25, 1.9, trim);
  put(body, "leather", OAK, -3.8, 11.9, 2.5, 1.9, 2.2, 1.75);
  put(body, "leather", LEATHER, -3.8, 12.55, 3.36, 1.92, .65, .26, true);
  put(body, "brass", trim, -3.8, 12.1, 3.54, .40, .40, .21, true);
  const panelEnd = spell ? 4.3 : 7.25;
  put(body, "wool", a.cloth, 0, (12.7 + panelEnd) / 2, 3.17, 4.7, 12.7 - panelEnd, .47);
  for (const side of SIDES) {
    put(body, "wool", a.trim, side * 2.2, (12.7 + panelEnd) / 2, 3.43, .33, 12.7 - panelEnd, .10, true, [4]);
    put(body, "wool", a.cloth, side * 1.3, panelEnd - .45, 3.21, 1.45, side === 1 ? 1.8 : 2.4, .43);
    put(body, "linen", trim, side * 1.42, panelEnd - .68, 3.45, 1.3, .26, .08, true, [4]);
  }
  if (spell) spiral(body, 0, 8.25, 3.46, .63, GOLD);
  else sigil(body, 0, 10.4, 3.45, .57, BONE);
  put(body, "wool", a.cloth, 0, 21.65, 0, 8.8, 2.1, 6.5);
  if (spell) {
    put(body, "wool", a.trim, 0, 20.05, 3, 6.5, 3.1, .65);
    for (const side of SIDES) {
      const x = side * 3.22;
      put(body, "brass", GOLD, x, 18.97, 3.41, .46, 5.5, .15);
      put(body, "wool", a.cloth, side * 3.6, 10, 1.8, 2.45, 10, 3.3);
      put(body, "brass", GOLD, side * 3.6, 5.15, 1.95, 2.48, .45, 3.37);
    }
    put(body, "brass", GOLD, 0, 19.42, 3.67, 1.85, 1.95, .62);
    put(body, "iron", 0x9d54c2, 0, 19.44, 4.08, 1.12, 1.4, .46);
    put(body, "ink", 0xd38ce0, -.23, 19.69, 4.34, .39, .65, .08, true, [4]);
  } else {
    if (heavy) plate(body, 0, 17.9, 3.1, 7.3, 4.4, .68, DARKIRON);
    else for (const side of SIDES) plate(body, side * 2.22, 17, 2.89, 2.75, 4.7, .7, DARKIRON);
    for (let i = 0; i < 6; i++) put(body, "leather", i % 2 ? OAK : LEATHER, -3.35 + i * .92, 20.9 - i * 1.06, 3.62, 1.14, 1.55, .27);
    buckle(body, -1.62, 19.14, 3.84, 1.24);
    put(body, "wool", a.trim, 0, 20.6, 2.94, 7.9, .75, 1.15, true);
  }

  const [skin, shade] = a.skin;
  put(head, "skin", skin, 0, 27.1, .38, 7.6, 8.8, 7.2);
  put(head, "skin", shade, 0, 24.25, .46, 6.9, 2.15, 6.95);
  put(head, "skin", shade, 0, 25.72, 4.01, 1.91, 3.63, 2.23);
  put(head, "skin", skin, 0, 25.61, 5.04, 1.70, 3.12, .57);
  for (const side of SIDES) {
    const x = side * 1.95;
    put(head, "ink", 0x302936, x, 27.15, 4.02, 2.56, 1.49, .16, false, [4]);
    put(head, "ink", 0xbfc3c3, x, 27.05, 4.12, 2.13, 1.02, .12, false, [4]);
    put(head, "ink", a.eyes, x - side * .35, 27.05, 4.20, .76, 1.02, .12, false, [4]);
    put(head, "leather", INK, x, 27.97, 4.16, 2.7, .77, .72);
    put(head, "leather", INK, x - side * .81, 27.68, 4.32, 1.25, .67, .51);
    put(head, "skin", shade, side * 3.65, 25.56, .23, .70, 1.63, 1.25);
    if (a.variant === 2) put(head, "skin", shade, side * 2.88, 25.64, 4.06, .78, .23, .08, true, [4]);
  }
  if (spell) {
    put(head, "wool", a.cloth, 0, 31.18, -.22, 9.03, 1.7, 8.8);
    put(head, "wool", a.cloth, 0, 27.4, -3.52, 8.8, 8.6, 1.63);
    for (const side of SIDES) {
      put(head, "wool", a.cloth, side * 4.03, 27.3, -.72, 1.52, 8.06, 7.35);
      put(head, "brass", GOLD, side * 4.07, 27.9, 3.28, .65, 6.9, .43);
    }
    put(head, "brass", GOLD, 0, 31.17, 4.16, 8.4, .57, .46);
    spiral(head, 0, 30.22, 4.51, .31, GOLD);
  } else if (a.rank) {
    plate(head, 0, 31.14, .04, 8, .83, 7.64, DARKIRON);
    put(head, "brass", GOLD, 0, 31.23, 4.05, 2.12, .8, .5);
  }

  cloak(cape, spell || heavy ? a.cloth : a.trim, spell ? GOLD : a.cloth,
    spell ? 9.28 : 8.65, spell ? 12.3 : 10.7, -.51, -.25);
  if (spell) spiral(cape, 0, -6.15, -.85, 1.03, GOLD, 5);
  else sigil(cape, 0, -4.85, -.85, .91, heavy ? 0xc4c4a9 : BONE, 5);
  if (captain) {
    put(cape, "wood", OAK, 2.88, 2.9, -.91, .74, 13.8, .75);
    put(cape, "iron", IRON, 2.88, 8.92, -.91, 1.0, 1.1, .95);
    put(cape, "wood", OAK, 2.7, 7.92, -.95, 7.3, .79, .75);
    cloak(cape, 0x6b3349, GOLD, 5.38, 6.9, -1.51, 7.8);
    sigil(cape, 0, 4.46, -1.84, .75, BONE, 5);
  }
  if (a.type === "pillager") {
    put(body, "leather", OAK, 2.7, 18.8, -3.52, 2.65, 8.12, 2.16);
    put(body, "iron", DARKIRON, 2.7, 22.48, -3.54, 2.91, .57, 2.25);
    for (let i = 0; i < 4; i++) {
      const x = 1.88 + .56 * i, y = 24.06 + (i % 2) * .76;
      put(body, "wood", 0xaa7c53, x, y, -3.71, .27, 4, .27);
      put(body, "linen", i % 2 ? BONE : 0xae7c7c, x, y + 1.81, -3.71, .46, 1.26, .45);
    }
  }

  for (const side of SIDES) {
    const suffix = side === -1 ? "R" : "L";
    const arm = localPart([side * (heavy ? 4.78 : 4.47), 21.62, .08]);
    const fore = part([0, 0, 0]);
    const leg = localPart([side * 2.02, 10.23, 0]);
    model["arm" + suffix] = arm;
    model["fore" + suffix] = fore;
    model["leg" + suffix] = leg;
    const w = heavy ? 3.5 : 2.98;
    put(arm, "wool", spell ? a.cloth : a.base, 0, -2, 0, w, 4.27, w);
    if (heavy) {
      put(arm, "fur", 0xd2bda2, 0, -.52, -.27, 3.91, 2.39, 4.25);
      for (const [x, y, z] of [[-.9,-1.45,1.18],[.12,-1.58,1.63],[1.12,-1.73,1.32],[-.58,-1.57,-1.67],[.83,-1.55,-1.6]]) {
        put(arm, "fur", x > 0 ? 0xb6a18d : 0xe3cbb0, x, y, z, .95, 1.43, 1.1, true);
      }
    } else {
      put(arm, spell ? "wool" : "iron", spell ? a.trim : IRON, 0, -.4, -.1, w + .58, 1.58, 3.56);
      put(arm, "iron", spell ? GOLD : EDGE, 0, -.2, 1.6, w + .44, .42, .36, true);
    }
    put(fore, "wool", spell ? a.cloth : a.base, 0, -1.62, 0, w - .1, 3.42, w - .13);
    put(fore, spell ? "brass" : "iron", spell ? GOLD : IRON, 0, -2.44, .08, w + .12, heavy ? 1.35 : .97, w + .12);
    put(fore, "skin", shade, 0, -3.69, 0, w - .34, 1.59, w - .23);
    put(fore, "iron", spell ? GOLD : EDGE, 0, -2.3, (w + .18) / 2, w * .83, .32, .11, true, [4]);
    put(leg, "wool", a.base, 0, -3.75, 0, 3.51, 7.55, 3.71);
    put(leg, "leather", LEATHER, 0, -7.65, .26, 3.59, 3.62, 4.34);
    put(leg, "leather", INK, 0, -9.65, .5, 3.85, 1.16, 4.92);
    if (!spell) plate(leg, 0, -5.55, 1.34, 3.50, 1.53, 1.58, heavy ? IRON : DARKIRON);
    if (heavy) plate(leg, 0, -8.35, 1.99, 3.56, 1.03, .85, IRON);
  }
  if (a.type === "pillager") model.weapon = crossbow();
  if (heavy) model.weapon = axe();
  return model;
}

function crossbow() {
  const p = part([0, 0, 0], "foreR");
  put(p, "wood", OAK, 0, .50, 1.22, 1.45, 1.38, 10.8);
  put(p, "wood", 0xa47050, 0, 1.25, 1.65, 1.41, .37, 9.35);
  put(p, "leather", LEATHER, 0, -.32, -.43, .99, 2.2, 1.67);
  put(p, "iron", DARKIRON, 0, .67, -4.02, 1.56, 1.41, .49);
  put(p, "iron", IRON, 0, .89, 5.07, 1.81, .92, 1.36);
  for (const side of SIDES) {
    const x = side * 3.55;
    put(p, "wood", 0x956448, side * 1.78, .76, 4.05, 3.34, .84, 1.18);
    put(p, "iron", IRON, x, .77, 3.47, 1.22, .93, 1.51);
    put(p, "wood", OAK, side * 4.41, .77, 2.78, 1.12, .74, 1.16);
    put(p, "iron", DARKIRON, side * 4.89, .83, 2.27, .54, .99, .87);
    put(p, "linen", BONE, side * 2.54, 1.05, 2.28, 4.8, .14, .18);
    put(p, "brass", RIVET, side * .84, 1.02, 4.91, .20, .53, .54, true);
  }
  return p;
}
function axe() {
  const p = part([0, 0, 0], "foreR");
  put(p, "wood", OAK, 0, 0, .07, 1.05, 14.9, 1.1);
  for (const y of [-5.3, -.95, 4.1]) put(p, "leather", LEATHER, 0, y, .07, 1.22, 1.67, 1.28);
  for (const y of [-6.5, 4.82, 7.2]) put(p, "iron", DARKIRON, 0, y, .07, 1.36, .6, 1.47);
  put(p, "iron", IRON, -.42, 6.14, 0, 3.1, 2.35, 1.32);
  put(p, "iron", IRON, -2.16, 6.52, 0, 2.42, 3.71, 1.17);
  put(p, "iron", 0x90949f, -3.52, 6.65, 0, 1.83, 4.97, .83);
  put(p, "iron", EDGE, -4.69, 6.65, 0, .61, 4.41, .55);
  for (const y of [4.55, 8.71]) put(p, "iron", EDGE, -4.23, y, 0, .96, .77, .68);
  put(p, "iron", DARKIRON, 1.69, 6.18, 0, 1.48, 1.84, .94);
  spiral(p, -2.35, 6.46, .66, .40, 0xc2b8a5, 4, true);
  return p;
}

function ravager(a) {
  const body = part([0, 12, 0]), neck = part([0, 15.7, 7.6]), head = part([0, 20.0, 10.2]);
  const jaw = part([0, 16.6, 13.1], "head");
  const tail = part([0, 14.4, -10.6]);
  const model = { body, neck, head, jaw, tail };
  const hide = a.base, horn = 0xb8a486, flank = a.variant === 1 ? 0x5c4d4a : 0x51464d;
  put(body, "leather", hide, 0, 12.8, -.98, 15.3, 10.6, 21.1);
  put(body, "leather", flank, 0, 16.89, -3.4, 13.6, 4.0, 14.4);
  put(body, "leather", 0x665753, 0, 14.7, 4.4, 16.65, 9.8, 9.2);
  put(body, "leather", 0x40363b, 0, 10, 4.9, 12.5, 4.7, 5.95);
  put(neck, "leather", flank, 0, 15.85, 8.73, 12.7, 10.8, 8.4);
  put(neck, "leather", 0x635655, 0, 18.39, 9.95, 11.6, 7.0, 8.05);
  plate(neck, 0, 15.14, 12.19, 9.5, 3.1, 1.5, DARKIRON);
  for (const side of SIDES) {
    const x = side * 7.31;
    put(body, "leather", LEATHER, x, 15.5, -.82, 1.73, 9.4, 3.15);
    put(body, "iron", DARKIRON, side * 8.12, 15.52, 5.21, 2.5, 5.8, 7.7);
    put(body, "iron", IRON, side * 9.15, 15.86, 5.75, 1.12, 4.4, 6.25);
    put(body, "iron", EDGE, side * 9.69, 17.8, 5.75, .25, .57, 6.05, true);
    for (const y of [14.43, 17.42]) for (const z of [3.33, 8.29]) {
      put(body, "brass", RIVET, side * 9.79, y, z, .36, .47, .44, true);
    }
    put(body, "wool", a.cloth, side * 8.2, 11.29, -3.5, .62, 7.5, 5.9);
    put(body, "wood", OAK, side * 8.36, 15.21, -3.55, .6, .63, 6.35);
    for (let i = 0; i < 5; i++) {
      const z = -5.65 + i * 1.03, y = 8.32 - (i % 2) * .62;
      put(body, "wool", i % 2 ? a.trim : a.cloth, side * 8.21, y, z, .59, 2.55, 1.12);
    }
    for (const [z, y, w, h] of [[-3.65,11.42,1.05,3.0],[-5,12.15,.88,1.16],[-2.3,12.15,.88,1.16],[-4.35,11.6,.91,.85],[-2.94,11.6,.91,.85]]) {
      put(body, "linen", BONE, side * 8.53, y, z, .08, h, w, false, [side > 0 ? 0 : 1]);
    }
    for (let i = 0; i < 4; i++) {
      put(body, "iron", i % 2 ? EDGE : DARKIRON, side * 8.51, 15.22 - Math.sin(i * .62) * 1.19,
        -7.7 + i * .85, .45, .52, .89, true);
    }
  }
  for (const z of [-8.15, -.6, 5.4]) {
    put(body, "leather", LEATHER, 0, 18.97, z, 15.36, .87, 2.45);
    for (const side of SIDES) put(body, "iron", IRON, side * 5.1, 19.42, z, 3.7, .86, 3.54);
  }
  put(body, "wood", 0x734834, 0, 19.55, -3.95, 10.78, 1.41, 9.2);
  put(body, "iron", DARKIRON, 0, 20.25, -6.6, 11.1, 1.04, 1.34);
  if (a.growth) for (const [x,y,z] of [[6,20.2,-5],[6.6,19.7,-4.4],[6.7,18.9,-4.2],[-5.7,20.1,1]]) {
    put(body, "leaves", x > 0 ? 0x616d38 : 0x707d44, x,y,z, 1.3,.6,1.29,true);
  }

  put(head, "leather", flank, 0, 20.15, 13.25, 12.92, 9.35, 8.04);
  put(head, "leather", hide, 0, 17.97, 19, 10.92, 3.90, 5.55);
  put(head, "leather", 0x3c3036, 0, 17.72, 21.64, 9.4, 2.18, 1.08);
  plate(head, 0, 22.92, 16.43, 10.95, 2.35, 3.12, IRON);
  plate(head, 0, 24.35, 13.57, 9.35, 1.23, 4.26, DARKIRON);
  for (const side of SIDES) {
    const x = side * 4.42;
    put(head, "ink", 0x2c232a, x, 20.44, 17.29, 3.68, 1.66, .30, false, [4]);
    put(head, "ink", a.eyes, x, 20.34, 17.51, 2.4, .77, .11, false, [4]);
    put(head, "ink", 0x5a3830, x - side * .55, 20.34, 17.59, .54, .79, .11, true, [4]);
    put(head, "leather", 0x433237, x - side * .18, 21.23, 17.44, 3.87, 1.15, .75);
    put(head, "leather", 0x3c3339, side * 2.95, 18.18, 22.21, 1.4, .66, .25, false, [4]);
    put(head, "leather", hide, side * 6.14, 22.23, 10.89, 2.5, 2.21, 3.13);
    // The curvature is a stepped silhouette that remains readable at the far LOD.
    const sections = [[6.75,22.41,13.85,3.72,3.0,3.54],[8.39,23.59,13.48,3.0,3.44,3.05],
      [9.59,25.21,13.16,2.63,3.43,2.69],[10.18,27.25,12.77,2.26,3.02,2.40],
      [10.41,29.2,12.43,1.67,2.28,1.98]];
    sections.forEach(([hx,y,z,w,h,d], i) =>
      put(head, "linen", i === 0 ? horn : i % 2 ? 0xcbb791 : 0xd7c39f, side * hx, y, z, w,h,d));
    spiral(head, side * 9.63, 25.10, 14.54, .32, 0x716258, 4, true);
    put(jaw, "linen", BONE, side * 3.64, 16.07, 19.05, .91, 1.6, 1.19);
    put(head, "linen", 0xc9b390, side * 3.52, 16.77, 20.01, 1.12, 1.63, 1.29);
  }
  put(jaw, "leather", flank, 0, 15.21, 17.3, 9.57, 2.37, 7.78);
  put(jaw, "leather", 0x42272e, 0, 16.35, 18.2, 6.86, .45, 5);
  put(tail, "leather", hide, 0, 12.31, -11.84, 2.44, 5.66, 2.9);
  put(tail, "leather", 0x41373e, 0, 9.32, -12.42, 3.29, 2.31, 3.16);

  for (const [front, z] of [[true, 6.43], [false, -7.02]]) for (const side of SIDES) {
    const name = "leg" + (front ? "F" : "B") + (side < 0 ? "R" : "L");
    const p = model[name] = localPart([side * (front ? 5.39 : 5.16), 10.46, z]);
    put(p, "leather", front ? flank : hide, 0, -2.72, -.26, 5.13, 6.7, 5.1);
    put(p, "leather", hide, 0, -7.6, .06, 4.24, 4.18, 4.33);
    put(p, "leather", 0x3a3035, 0, -9.43, .83, 5.0, 2.22, 5.66);
    put(p, "leather", 0x5c4d49, 0, -9.51, 3.52, 4.67, 1.71, .51);
    put(p, "ink", 0x2f272f, 0, -9.66, 3.79, .32, 1.46, .1, true, [4]);
    plate(p, 0, -3.55, 2.22, 5.21, 2.6, 1.69, front ? IRON : DARKIRON);
    put(p, "iron", DARKIRON, 0, -7.73, .25, 4.92, 1.74, 4.74);
    put(p, "iron", IRON, 0, -7.53, 2.55, 4.68, 1.20, .6);
  }
  return model;
}

export function raiderModel(a) {
  return a.type === "ravager" ? ravager(a) : illager(a);
}
