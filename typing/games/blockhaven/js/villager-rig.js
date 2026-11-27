// Original voxel clothing and animation for residents in both BlockHaven renderers.
import * as THREE from "../lib/three.module.min.js";
import { bakeCharacterBoxes, characterAtlas } from "./character-voxel.js?v=living-kingdom-1";
import { villagerAppearance } from "./villager-appearance.js?v=living-kingdom-1";

const LEATHER = 0x5b3829, DARK = 0x352a29, LINEN = 0xd9c7a8, GOLD = 0xc69750;
const SIDES = [-1, 1];
const rigCache = new Map();
const INACTIVE_LIMIT = 24;
const armOrigin = side => [side * 4.35, 20.9, 0.25];
const legOrigin = side => [side * 1.9, 9.2, 0];
const HEAD = [0, 22.1, 0.15];

function outfitParts(a) {
  const { cloth, trim, apron, style, formal, green, weatherLayer, biome, variation } = a;
  const [skin, skinShade, skinLight, hair] = a.skin;
  const core = [], detail = [], head = [], hatDetail = [], folded = [], blink = [];
  const pack = (list, at, size, pigment, surface, faces) => list.push({ at, size, pigment, surface, faces });
  const add = (list, surface, pigment, x, y, z, w, h, d, faces) =>
    pack(list, [x, y, z], [w, h, d], pigment, surface, faces);
  const motif = (list, x, y, z, scale, pigment, front) => {
    const f = [front ? 4 : 5];
    for (const [u, v, w, h] of [[0, 2, 5, 1], [-2, 0, 1, 3], [0, -2, 5, 1], [2, -.5, 1, 2], [.5, 0, 2, 1]]) {
      add(list, "brass", pigment, x + u * scale * (front ? 1 : -1), y + v * scale, z, w * scale, h * scale, .07, f);
    }
  };

  // Tunic, split hems, outer tabard, belt and buckle.
  add(core, "wool", cloth, 0, 15.4, 0, 7.8, 12.1, 5.3);
  add(core, "wool", weatherLayer, 0, 20.8, 0, 8.2, 2.5, 5.8);
  add(core, "linen", LINEN, 0, 21.65, 0.05, 4.1, 1.2, 4.25);
  add(core, "wool", cloth, 0, 11.2, 0, 8.3, 3.45, 5.85);
  const mantle = biome === "snow" ? "fur" : "wool";
  const mantleColor = biome === "snow" ? 0xe6d3b9 : weatherLayer;
  const rearCloak = style === "robe" || style === "cloak" || biome === "forest" || biome === "snow" || formal;
  const longPanel = style === "robe" || style === "cloak" || biome === "snow" || biome === "desert";
  const panelColor = style === "tunic" || longPanel ? weatherLayer : apron;
  const panelMaterial = ["smith", "leatherworker", "fletcher"].includes(a.role) ? "leather" :
    a.role === "armorer" ? "iron" : "linen";
  add(core, panelMaterial, panelColor, 0, 11.35, 3.05, 4.45, longPanel ? 7.15 : 5.8, .55);
  if (style === "apron" || style === "armor") {
    add(core, panelMaterial, panelColor, 0, 16.45, 2.83, 4.4, 5.5, .42);
  }
  add(core, "leather", DARK, 0, 13.75, 0, 8.55, 1.52, 6.45);
  add(core, "leather", LEATHER, 0, 13.9, 3.27, 7.95, .93, .18);
  add(core, "brass", trim, 0.25, 13.85, 3.53, 1.72, 1.45, .40);
  add(core, "leather", DARK, .25, 13.85, 3.76, .90, .71, .08);
  add(core, "linen", trim, 0, longPanel ? 7.99 : 8.66, 3.29, 4.46, .43, .1);
  if (rearCloak) {
    add(core, "wool", weatherLayer, 0, 15.15, -2.92, 7.5, 12.1, 1.04);
    add(core, "linen", trim, 0, 9.3, -3.46, 7.5, .42, .1);
    for (const side of SIDES) add(detail, "linen", trim, side * 3.25, 15.3, -3.46, .46, 11.2, .1);
    motif(detail, 0, 14.5, -3.56, .73, trim, false);
  }
  for (const side of SIDES) {
    const x = side * 3.55;
    add(core, mantle, mantleColor, x, 20.05, -1.05, 2.0, 2.6, 4.8);
    add(detail, "linen", trim, x, 19.35, 1.37, 1.55, .38, .12, [4]);
    if (biome === "snow") {
      add(core, "fur", mantleColor, x, 20.35, .65, 2.34, 2.38, 5.1);
      add(detail, "fur", 0xb69d8b, x, 18.64, -.66, 1.9, .7, 3.2);
    }
    if (biome === "mountain") {
      add(core, "leather", 0x78654f, side * 3.76, 19.32, -.55, 1.37, 2.25, 4.65);
      add(detail, "iron", 0x93918d, side * 3.76, 19.23, 1.83, .64, .55, .14, [4]);
    }
    add(detail, "linen", trim, side * 1.9, 10.72, 3.35, .28, 3.55, .09, [4]);
    for (let i = 0; rearCloak && i < 4; i++) {
      add(detail, "linen", trim, side * (3.2 - .65 * i), 10.04 + (i % 2) * .22, -3.49, .3, .18, .08, [5]);
    }
  }
  // The hanging pouch stays on the pelvis and the quiver is anchored on the back.
  const pouch = variation === 1 ? 1 : -1;
  add(core, "leather", LEATHER, pouch * 3.72, 12.6, 2.2, 1.8, 2.64, 1.46);
  add(detail, "leather", 0x895739, pouch * 3.72, 13.14, 3.0, 1.84, 1.07, .33);
  add(detail, "brass", trim, pouch * 3.72, 12.66, 3.2, .48, .48, .14);
  if (style === "quiver") {
    add(core, "leather", 0x795437, 2.3, 17.3, -3.24, 2.9, 6.8, 1.67);
    add(detail, "brass", trim, 2.3, 20.32, -3.32, 3.02, .58, 1.71);
    for (let i = 0; i < 3; i++) {
      add(detail, "wood", 0xab8050, i * .58 + 1.63, 21.2 + i * .36, -3.35, .22, 3.05, .25);
      add(detail, "linen", LINEN, i * .58 + 1.63, 22.3 + i * .36, -3.35, .45, .95, .45);
    }
  }
  if (style === "armor") {
    for (const side of SIDES) {
      add(core, "iron", apron, side * 3.8, 20.7, 0, 2.32, 1.3, 4.8);
      add(detail, "iron", 0xb2b6b3, side * 4.29, 20.42, 0, 1.7, .62, 4.95);
    }
  }
  if (formal || style === "tunic") motif(detail, 0, 10.55, 3.38, formal ? .65 : .48, trim, true);
  if (style === "apron") {
    add(detail, panelMaterial, panelColor === LEATHER ? 0x855536 : panelColor, 0, 11.6, 3.4, 2.7, 1.4, .28);
    add(detail, "linen", trim, 0, 12.26, 3.56, 2.55, .18, .08, [4]);
  }
  if (biome === "forest") {
    add(core, "wool", 0x495b3e, 0, 21.18, -1.1, 7.6, 1.08, 5.5);
    add(detail, "leaves", 0x78894a, -3.2, 19.5, -3.67, 1.3, 2.6, .55);
    add(detail, "leaves", 0x617e3f, -2.85, 18.2, -3.72, .56, 1.03, .34);
  }
  if (green) {
    for (const [x, y, z, c] of [[-4.35, 20.95, 1, 0x657f3c], [-4.18, 20.6, 1.85, 0x82924a], [-4.31, 19.9, 1.65, 0x596e37]]) {
      add(detail, "leaves", c, x, y, z, .72, .65, .74);
    }
  }

  // Broad brow, inset-looking green eyes, voxel nose, ears and a subtle lower lip.
  add(head, "skin", skin, 0, 25.65, .18, 7.0, 7.2, 6.32);
  for (const side of SIDES) {
    add(head, "skin", skinShade, side * 3.48, 24.9, .04, .86, 1.76, 1.26);
    add(hatDetail, "skin", skinLight, side * 3.3, 24.23, 3.36, .9, .75, .12, [4]);
    add(head, "ink", DARK, side * 1.83, 25.91, 3.36, 2.07, 1.34, .14, [4]);
    add(head, "ink", 0xf2e8d9, side * 1.87, 25.88, 3.45, 1.77, .94, .12, [4]);
    add(head, "ink", variation === 1 ? 0x5b7d42 : 0x46733b, side * 1.61, 25.88, 3.53, .76, .94, .1, [4]);
    add(hatDetail, "ink", 0xaac089, side * 1.55, 26.13, 3.60, .24, .28, .07, [4]);
    add(blink, "skin", skin, side * 1.79, 25.93, 3.71, 2.2, 1.33, .10, [4]);
    add(blink, "ink", hair, side * 1.79, 25.73, 3.77, 1.57, .19, .10, [4]);
    add(head, "leather", hair, side * 1.8, 26.82 + (side === 1 ? variation * .045 : 0), 3.52, 2.78, .69, .66);
  }
  add(head, "leather", hair, 0, 26.78, 3.45, .88, .43, .39, [4]);
  add(head, "skin", skinShade, 0, 24.45, 3.65, 1.53, 2.95, 1.65);
  add(head, "skin", skin, 0, 24.31, 4.32, 1.43, 2.4, .60);
  add(hatDetail, "skin", skinLight, 0, 24.85, 4.66, .68, .95, .11, [4]);
  add(head, "skin", skinShade, .08, 22.99, 3.41, 1.46, .27, .11, [4]);
  add(head, "skin", skinShade, 0, 25.05, -3.03, 5.02, 2.6, .22, [5]);

  // Role headwear stays recognizable when a climate adds a lining or scarf.
  const hat = a.hat;
  const straw = hat === "straw" || hat === "veil";
  const hood = hat === "hood";
  const metal = hat === "iron";
  const fur = hat === "fur" || biome === "snow";
  const hatTop = straw ? (hat === "veil" ? 0xa57540 : biome === "snow" ? 0xac7e43 : 0xc8a45c) : metal ? 0x879294 :
    hat === "smith" ? 0x51473e : hat === "linen" ? 0xbfb2a0 : hat === "mason" ? 0x867865 : weatherLayer;
  const hatSurface = straw ? "straw" : metal ? "iron" : hat === "smith" ? "leather" : "wool";
  const brim = straw ? 10.35 : hat === "sailor" ? 9.0 : hat === "cap" ? 8.6 : 8.0;
  const crownHeight = ["mitre", "scribe"].includes(hat) ? 2.45 : 1.95;
  add(head, fur ? "fur" : hatSurface, fur ? mantleColor : hatTop, 0, 28.72, .2, brim, .84, straw ? 8.75 : 7.16);
  add(head, hatSurface, hatTop, 0, 29.58, .03, 7.24, crownHeight, 6.47);
  add(head, "leather", straw ? LEATHER : trim, 0, 29.13, 0.05, 7.41, .56, 6.61);
  add(hatDetail, hatSurface, hatTop, 0, 30.64, -.06, 6.48, .40, 5.73);
  if (hat === "mitre" || hat === "scribe" || metal) {
    add(head, metal ? "iron" : "brass", trim, 0, 29.79, 3.34, 1.55, 1.3, .29);
    add(hatDetail, "ink", cloth, 0, 29.78, 3.52, .62, .55, .10, [4]);
  }
  if (hood || fur || hat === "veil") {
    for (const side of SIDES) {
      add(head, mantle, fur || hat === "veil" ? (fur ? mantleColor : LINEN) : hatTop,
        side * 3.2, 26.72, -1.75, 1.35, 4.62, 3.85);
    }
    add(head, "wool", hatTop, 0, 26.31, -3.17, 6.6, 5.1, 1.24);
  }
  if (biome === "desert") {
    add(head, "linen", 0xe6d3ab, 0, 28.55, -.35, brim + .22, .58, 7.7);
    add(head, "linen", 0xcaa969, 0, 25.1, -3.29, 7.4, 5.75, .98);
    add(head, "linen", 0xe1c794, -.25, 23.21, 2.83, 6.4, 1.02, 2.15);
    add(core, "linen", 0xe1c794, -1.58, 20.2, 2.67, 2.15, 3.05, .65);
    add(detail, "brass", trim, -1.58, 18.8, 3.04, 2.18, .3, .15, [4]);
  }
  if (a.role === "wanderer") {
    add(head, "wool", 0x365160, 0, 23.29, 3.22, 6.78, 1.72, 1.16);
    add(head, "linen", trim, 0, 23.86, 3.82, 6.44, .25, .12, [4]);
  }
  if (green) {
    add(hatDetail, "leaves", 0x718442, -3.25, 29.1, 3.04, 1.9, .55, 1.0);
    add(hatDetail, "leaves", 0x638447, -3.75, 29.15, 3.46, .77, .49, 1.12);
    if (variation !== 2) {
      add(hatDetail, "linen", 0xe9ddbd, -3.32, 29.48, 3.52, .86, .20, .64);
      add(hatDetail, "brass", 0xe0b956, -3.35, 29.60, 3.53, .34, .17, .34);
    }
  }
  if (hat === "scribe") {
    for (const side of SIDES) {
      for (const y of [25.27, 26.42]) add(hatDetail, "brass", GOLD, side * 1.84, y, 3.82, 2.25, .18, .14);
      for (const x of [.76, 2.91]) add(hatDetail, "brass", GOLD, side * x, 25.85, 3.82, .18, 1.16, .14);
    }
  }

  // Hands and folded sleeves are separate so the rig can unfold into work and travel.
  const arms = [], cuffs = [], legs = [];
  for (const side of SIDES) {
    const sleeve = a.role === "smith" ? 0x8c7462 : a.role === "cleric" ? cloth : LINEN;
    const cuff = a.role === "armorer" ? apron : trim;
    const hand = ["smith", "armorer", "leatherworker"].includes(a.role) ? 0x84634b : skin;
    const upper = [], fore = [], leg = [];
    add(upper, "linen", sleeve, 0, -1.5, 0, 2.72, 3.58, 2.72);
    add(upper, "wool", weatherLayer, 0, -.43, -.04, 2.95, 1.8, 2.92);
    add(fore, "linen", sleeve, 0, -1.16, 0, 2.52, 2.85, 2.55);
    add(fore, "leather", cuff, 0, -2.27, 0, 2.58, .64, 2.61);
    add(fore, "skin", hand, 0, -3.05, 0, 2.07, 1.48, 2.18);
    add(folded, "linen", sleeve, side * 2.14, 18.04 + side * .5, 3.64, 3.7, 2.58, 2.5);
    add(folded, "leather", cuff, side * .62, 18.04 + side * .5, 3.7, .66, 2.6, 2.38);
    add(folded, "skin", hand, -side * .25, 18.04 + side * .5, 3.83, 1.32, 2.06, 2.06);
    add(leg, "wool", 0x53433a, 0, -3.55, -.05, 3.36, 6.5, 3.88);
    add(leg, "leather", LEATHER, 0, -6.72, .37, 3.48, 4.12, 4.62);
    add(leg, "leather", DARK, 0, -8.66, .62, 3.7, 1.08, 5.18);
    if (biome === "snow" || biome === "mountain") add(leg, biome === "snow" ? "fur" : "leather",
      biome === "snow" ? mantleColor : 0x997555, 0, -4.95, .35, 3.7, .88, 4.82);
    add(leg, "leather", 0x845a41, 0, -7.74, 2.66, 2.83, 1.16, .96);
    add(leg, "leather", 0x704736, 0, -6.04, .5, 3.51, .54, 4.66);
    arms.push(upper); cuffs.push(fore); legs.push(leg);
  }
  return { core, detail, head, hatDetail, blink, folded, arms, cuffs, legs };
}

function toolGeometry(tool) {
  const tools = {
    hammer: [[0, -3.35, .37, .55, .55, 5.95, 0x866044, "wood"], [0, -3.35, 3.15, 2.45, 1.28, 1.28, 0x979894, "iron"]],
    mallet: [[0, -3.35, .37, .55, .55, 5.8, 0x866044, "wood"], [0, -3.35, 3.0, 2.54, 1.52, 1.6, 0x9a7551, "wood"]],
    hoe: [[0, -3.32, .3, .50, .50, 6.6, 0x866044, "wood"], [0, -4.01, 3.46, .85, 1.88, 1.12, 0x999a97, "iron"]],
    map: [[.75, -3.24, .85, 3.55, .35, 3.0, 0xd3ba87, "linen"],
      [.46, -3.02, 1.35, 1.7, .15, .29, 0x8e7855, "ink"], [1.45, -3.02, .82, .3, .15, 1.64, 0x8e7855, "ink"],
      [.99, -3.02, .02, 1.18, .15, .28, 0x8e7855, "ink"]],
    arrow: [[0, -3.26, .7, .31, .31, 5.8, 0xa98951, "wood"], [0, -3.26, 3.58, .65, .65, .86, 0xaeb0a9, "iron"]],
    book: [[.9, -3.22, 1.04, 3.8, .64, 2.92, 0x774b36, "leather"], [.93, -2.88, 1.03, 3.45, .54, 2.76, LINEN, "linen"],
      [.93, -2.55, 1.03, .25, .16, 2.68, 0x997955, "ink"]],
    net: [[0, -3.12, .64, 2.65, 1.38, 1.94, 0xac9670, "linen"], [0, -2.45, .64, 2.75, .31, 2.05, LEATHER, "leather"]],
    leather: [[0, -3.7, 1.0, 2.84, 1.17, 2.7, 0x956647, "leather"], [0, -4.13, 1.79, 2.58, .85, 1.02, 0x754933, "leather"]]
  };
  if (!tool) return null;
  return bakeCharacterBoxes(tools[tool].map(([x, y, z, w, h, d, pigment, surface]) =>
    ({ at: [x, y, z], size: [w, h, d], pigment, surface })));
}

const tools = new Map();
function cachedTool(name) {
  if (!name) return null;
  if (!tools.has(name)) tools.set(name, toolGeometry(name));
  return tools.get(name);
}

function acquire(a) {
  let entry = rigCache.get(a.key);
  if (!entry) {
    const p = outfitParts(a);
    const geo = {
      body: bakeCharacterBoxes([...p.core, ...p.detail]),
      compact: bakeCharacterBoxes([...p.core, ...p.folded]),
      head: bakeCharacterBoxes([...p.head, ...p.hatDetail], HEAD),
      compactHead: bakeCharacterBoxes(p.head, HEAD),
      blink: bakeCharacterBoxes(p.blink, HEAD),
      arms: p.arms.map(boxes => bakeCharacterBoxes(boxes)),
      cuffs: p.cuffs.map(boxes => bakeCharacterBoxes(boxes)),
      legs: p.legs.map(boxes => bakeCharacterBoxes(boxes))
    };
    entry = { geo, refs: 0 };
  }
  rigCache.delete(a.key);
  rigCache.set(a.key, entry);
  entry.refs++;
  return entry;
}

function release(entry, key) {
  if (--entry.refs > 0) return;
  rigCache.delete(key);
  rigCache.set(key, entry);
  trimVillagerGeometryCache(INACTIVE_LIMIT);
}

export function trimVillagerGeometryCache(keep = 0) {
  const inactive = [...rigCache].filter(([, current]) => current.refs === 0);
  for (const [oldKey, current] of inactive.slice(0, Math.max(0, inactive.length - keep))) {
    for (const geometry of Object.values(current.geo).flat()) geometry.dispose();
    rigCache.delete(oldKey);
  }
}

function visualTier(previous, distanceSq, fast) {
  if (fast || distanceSq > (previous === 0 ? 29 : 34) ** 2) return 0;
  if (distanceSq < (previous === 2 ? 19 : 15) ** 2) return 2;
  return 1;
}

export function createVillagerRig(appearance, { sceneLighting = false, shadows = sceneLighting } = {}) {
  const a = villagerAppearance(appearance);
  const entry = acquire(a);
  const { geo } = entry;
  const options = { map: characterAtlas(), vertexColors: true };
  const material = sceneLighting ?
    new THREE.MeshStandardMaterial({ ...options, roughness: .91 }) : new THREE.MeshBasicMaterial(options);
  if (!sceneLighting) {
    // The overworld outputs display-space colors directly. Convert the authored linear
    // vertex pigments before the engine multiplies them by its local light level.
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace("#include <color_vertex>",
        "#include <color_vertex>\nvColor.rgb = pow(vColor.rgb, vec3(0.455));");
    };
  }
  const root = new THREE.Group();
  root.name = "Villager rig";
  const motion = new THREE.Group();
  root.add(motion);
  const joint = (parent, origin) => {
    const group = new THREE.Group();
    group.position.set(...origin.map(n => n / 16));
    parent.add(group);
    return group;
  };
  const mesh = (parent, geometry, shadow = shadows) => {
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = object.receiveShadow = shadow;
    parent.add(object);
    return object;
  };

  const body = mesh(motion, geo.body);
  const head = joint(motion, HEAD);
  const headMesh = mesh(head, geo.head);
  const eyelids = mesh(head, geo.blink, false);
  const legs = SIDES.map((side, i) => {
    const leg = joint(motion, legOrigin(side));
    mesh(leg, geo.legs[i]);
    return leg;
  });
  const arms = SIDES.map((side, i) => {
    const shoulder = joint(motion, armOrigin(side));
    shoulder.rotation.order = "YXZ";
    mesh(shoulder, geo.arms[i]);
    const elbow = joint(shoulder, [0, -3.1, 0]);
    elbow.rotation.order = "ZXY";
    mesh(elbow, geo.cuffs[i]);
    return { shoulder, elbow };
  });
  const equipment = cachedTool(a.tool);
  const held = equipment ? mesh(arms[0].elbow, equipment, false) : null;
  eyelids.visible = false;
  if (held) held.visible = false;
  let tier = -1, elapsed = 0, stride = 0, walking = 0, working = 0, gesture = 0, resting = 0, initialized = false;
  let disposed = false;

  function pose(dt, { age = 0, speed = 0, stridePhase, activity = "idle", gaze = 0, gazePitch = 0,
    distanceSq = 0, fast = false, reducedMotion = false, baby = false } = {}) {
    const nextTier = visualTier(tier, distanceSq, fast);
    const switched = nextTier !== tier;
    if (switched) {
      tier = nextTier;
      body.geometry = tier === 0 ? geo.compact : geo.body;
      headMesh.geometry = tier === 2 ? geo.head : geo.compactHead;
      for (const arm of arms) arm.shoulder.visible = tier > 0;
    }
    stride = stridePhase ?? stride + dt * speed * 5;
    elapsed += dt;
    if (!switched && tier < 2 && elapsed < (tier === 0 ? 1 / 15 : 1 / 24)) return;
    const blend = initialized ? 1 - Math.exp(-12 * elapsed) : 1;
    initialized = true;
    elapsed = 0;
    const soften = reducedMotion ? .55 : 1;
    const fleeing = activity === "flee";
    walking += (Math.min(1, Math.max(0, (speed - .12) / (fleeing ? 2.1 : 1.5))) - walking) * blend;
    working += (Number(activity === "work" && !baby && speed < .2) - working) * blend;
    const conversing = activity === "trade" || activity === "celebrate";
    gesture += (Number(conversing && speed < .3) - gesture) * blend;
    resting += (Number(activity === "rest" && speed < .2) - resting) * blend;

    const time = age + a.phase * 7;
    const cycle = Math.sin(stride);
    const swing = cycle * walking * (fleeing ? .57 : .42) * soften;
    legs[0].rotation.x = swing;
    legs[1].rotation.x = -swing;
    // Raise the rigid voxel soles just enough to keep a planted foot at ground level.
    const sole = .575 * Math.cos(swing) + .20 * Math.abs(Math.sin(swing));
    motion.position.y = Math.max(0, sole - .575) + (reducedMotion ? 0 : .004 * (1 + Math.sin(time * 2.1)) * (1 - walking));
    motion.rotation.x = walking * (fleeing ? .13 : .035);
    head.scale.setScalar(baby ? 1.25 : 1);
    head.rotation.y += ((tier === 2 ? Math.max(-.72, Math.min(.72, gaze)) : 0) - head.rotation.y) * blend;
    const action = !reducedMotion && tier === 2;
    const reading = a.tool === "book" || a.tool === "map";
    const blinkTime = (age + a.phase * 5.1) % 4.7;
    eyelids.visible = action && (blinkTime < .11 || resting > .96);
    head.rotation.x = (tier > 0 ? gazePitch * .5 : 0) + working * (reading ? .28 : .16) +
      resting * .19 + walking * .045 + (action ? Math.sin(time * 4.5) * gesture * .09 : 0);

    const seated = activity === "seated";
    const folded = (1 - walking) * (1 - working) * (1 - gesture * .7) * (seated ? .45 : 1);
    if (seated) {
      for (const leg of legs) leg.rotation.x = -1.22;
      motion.position.y = -.24;
    }
    const strike = Math.sin(time * (a.tool === "hammer" || a.tool === "mallet" ? 8.7 : 5.5));
    for (let i = 0; i < arms.length; i++) {
      const { shoulder, elbow } = arms[i], side = SIDES[i];
      let workLift = -.34;
      if (a.tool === "hammer" || a.tool === "mallet") workLift = i === 0 ? -.57 + strike * .38 * soften : -.24;
      else if (a.tool === "hoe") workLift = i === 0 ? -.48 + strike * .23 * soften : -.37;
      else if (reading) workLift = -.62;
      shoulder.rotation.x = -.71 * folded + swing * side * .92 + working * workLift +
        gesture * (i === 0 ? -.52 + Math.sin(time * 5) * .16 * soften : -.36);
      shoulder.rotation.z = side * (.055 + .075 * walking - .27 * folded);
      shoulder.rotation.y = -side * .1 * working;
      elbow.rotation.x = (-.19 + side * .12) * folded - .18 * walking - working * (reading ? .62 : .55) - gesture * .56;
      elbow.rotation.z = -side * (folded * 1.48 + working * (reading ? .61 : .22) + gesture * .45);
    }
    if (held) held.visible = tier === 2 && activity === "work" && speed < .22 && working > .47;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    root.removeFromParent();
    material.dispose();
    release(entry, a.key);
  }

  pose(0);
  return { root, parts: { head, body, armL: arms[1].shoulder, armR: arms[0].shoulder, legL: legs[1], legR: legs[0] },
    material, appearance: a, pose, dispose };
}
