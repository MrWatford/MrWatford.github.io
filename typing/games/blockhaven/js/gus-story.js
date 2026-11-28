import * as THREE from "../lib/three.module.min.js";
import { gusSurface } from "./gus-village.js?v=3";
import { buildGusRig } from "./gus-rig.js?v=chapters-1-2-r1";

export const GUS_STORY_KEY = "blockhaven.gus.story";
export const gusStoryBeats = {
  "day-off": { title: "Gus’s Day Off", next: "ruins", spawn: [0, 11], mark: [0, -10],
    objective: "Follow the trail back toward the village", action: "Return to the village",
    caption: "With the raid over, Gus leaves the village in the care of another guardian." },
  ruins: { title: "The Village in Ruins", next: "journey", spawn: [0, 11], mark: [1.35, -3],
    objective: "Look for survivors among the ruins", action: "Check on the survivor",
    caption: "Gus came back too late." },
  journey: { title: "Gus’s Journey", next: "discovery", spawn: [0, 11], mark: [0, -11],
    objective: "Follow the trail into the hills", action: "Enter the stronghold",
    caption: "Leaving the ruins behind, Gus follows the trail through the hills." },
  discovery: { title: "The Discovery", next: "duel", spawn: [0, 10], mark: [-5.8, -4.8],
    objective: "Search the hall", action: "Look inside the cells",
    caption: "Light spills out from the cells beneath the stronghold." },
  duel: { title: "Gus vs. Steve", next: "retreat", spawn: [0, 9],
    objective: "Evade Steve’s strikes and counter during his recovery",
    caption: "Gus turns from the cells. Steve is already in the hall." },
  retreat: { title: "The Escape", next: "escape", spawn: [0, 4], mark: [0, -11], damaged: true,
    objective: "Reach the portal", action: "Enter the portal",
    caption: "Steve has cracked Gus’s armor. The portal is the only way out." },
  escape: { title: "The Damaged Guardian", next: "reforge", spawn: [0, 11], mark: [0, -10.4], damaged: true,
    objective: "Follow the ledge through the cavern", action: "Approach the figures",
    caption: "On the other side, Gus can barely move. A light flickers across the cavern." },
  reforge: { title: "The Upgrade", next: "trial", spawn: [0, 10], mark: [0, -4], damaged: true,
    objective: "Approach the forge", action: "Begin the reforge",
    caption: "The smiths have heated a new set of plates for Gus." },
  trial: { title: "The Reforged Guardian", next: "ready", spawn: [0, 0], upgraded: true,
    objective: "Q · Break the practice block with the upgraded slam",
    caption: "Gus rises with reinforced arms and armor. The smiths give him space to test the new plates." },
  ready: { title: "The Reforged Guardian", spawn: [0, 0], upgraded: true },
  return: { title: "The Return", next: "rematch", spawn: [0, 10], mark: [0, -9.7], upgraded: true,
    objective: "Advance through the stronghold", action: "Confront Steve",
    caption: "Gus returns to the stronghold in his new armor. Steve is waiting beyond the hall." },
  rematch: { title: "The Rematch", next: "river", spawn: [0, 9], upgraded: true,
    objective: "Evade Steve’s strikes and counter during his recovery",
    caption: "Gus faces Steve again, stronger this time. Their fight pushes toward the exit." },
  river: { title: "The Riverside", next: "ending", spawn: [0, 8], upgraded: true,
    objective: "Finish the fight by the water",
    caption: "The rematch spills out of the stronghold. Gus and Steve clash again on the riverbank." },
  ending: { title: "Gus’s Revenge", spawn: [2.7, -3.55], upgraded: true, damaged: true }
};

const beats = Object.keys(gusStoryBeats);
const isGusStoryBeat = (stage) => Object.hasOwn(gusStoryBeats, stage);
export const gusStoryRank = (stage) => beats.indexOf(stage);
export const gusStoryChapter = (stage) =>
  gusStoryRank(stage) >= gusStoryRank("return") ? 3 : gusStoryRank(stage) >= gusStoryRank("duel") ? 2 : 1;

const PALETTES = {
  "day-off": [0x8d7965, 0x576b3e, 0xa7c3cb], ruins: [0x64605b, 0x4d4a35, 0x96766b],
  journey: [0x797473, 0x585e61, 0x586d83], discovery: [0x5f565a, 0x302e35, 0x362b37],
  escape: [0x5e3434, 0x47303a, 0x46232e], reforge: [0x777066, 0x3b3338, 0x41303a],
  river: [0x758363, 0x667950, 0xaf8f89]
};

const RECOVERY = 1.22;
const STRIKE_RANGE = 3.25;
const FORGE_TIME = 3.8;
const LEDGE = [
  { x: 0, z: 10.5, w: 5.5, d: 8.8 },
  { x: 1.45, z: 5.8, w: 4.2, d: 3.4 },
  { x: 2.8, z: 1.25, w: 2.65, d: 7 },
  { x: 1.45, z: -3.5, w: 4.2, d: 3.9 },
  { x: 0, z: -9.65, w: 5.8, d: 9.85 }
];
const HALL_STAGES = new Set(["discovery", "duel", "retreat", "return", "rematch"]);
const DUELS = {
  duel: { counters: 3, windup: 0.75, speed: 2.65, damage: 24 },
  rematch: { counters: 3, windup: 0.71, speed: 3, damage: 25 },
  river: { counters: 3, windup: 0.67, speed: 3.25, damage: 27 }
};

export function createGusStory({ scene, box, face, makeVillager, markerPaint }) {
  const root = new THREE.Group();
  root.name = "Gus story route";
  scene.add(root);
  const stoneTexture = gusSurface("stone");
  const woodTexture = gusSurface("wood");
  const earthTexture = gusSurface("plaster");
  const paint = (color, map = null) => new THREE.MeshStandardMaterial({ color, map, roughness: 0.86 });
  const glow = (color) => new THREE.MeshBasicMaterial({ color });
  const basalt = paint(0x45404b, stoneTexture), iron = paint(0x66606a), wood = paint(0x583e31, woodTexture);
  const amber = glow(0xffac53), violet = glow(0xa65af2), hot = glow(0xef7036);
  const realms = new Map();
  for (const [name, [stone, ground, sky]] of Object.entries(PALETTES)) {
    const group = new THREE.Group();
    group.name = `Gus story · ${name}`;
    root.add(group);
    realms.set(name, { group, sky: new THREE.Color(sky) });
    if (name === "river" || name === "escape") continue;
    const outside = name === "day-off" || name === "journey" || name === "ruins";
    const floor = paint(ground, earthTexture), trim = paint(stone, stoneTexture);
    const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1.48, 0.18, 1.48), trim, 17 * 20);
    const matrix = new THREE.Matrix4();
    const tint = new THREE.Color();
    let count = 0;
    for (let row = 0; row < 20; row++) for (let col = 0; col < 17; col++) {
      const x = (col - 8) * 1.5;
      const z = (row - 9.5) * 1.5;
      const edge = Math.abs(x) > 3.2;
      if (outside && edge && (col * 9 + row * 5) % 7 !== 0) continue;
      matrix.makeTranslation(x, -0.093, z);
      tint.setScalar((edge ? 0.61 : 0.83) + ((col * 29 + row * 17) % 11) * 0.023);
      tiles.setMatrixAt(count, matrix);
      tiles.setColorAt(count++, tint);
    }
    tiles.count = count;
    tiles.receiveShadow = true;
    group.add(tiles);
    box(group, floor, 0, -0.37, 0, outside ? 68 : 26, 0.68, outside ? 66 : 30.6);
  }

  function lamp(group, x, z, y = 1.45) {
    box(group, iron, x, y - 0.7, z, 0.24, 1.5, 0.24);
    box(group, amber, x, y, z, 0.27, 0.37, 0.27);
    box(group, basalt, x, y + 0.23, z, 0.44, 0.14, 0.44);
    box(group, basalt, x, y - 0.23, z, 0.41, 0.10, 0.41);
  }

  for (const name of ["day-off", "journey"]) {
    const { group } = realms.get(name);
    const foliage = [paint(0x284934), paint(0x3f5b37), paint(0x59724b)];
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
      const x = side * (5.2 + (i * 7 % 6) * 1.4);
      const z = i * 3.9 - 14;
      const height = 3.25 + i % 3;
      box(group, wood, x, height / 2, z, 0.55, height, 0.59);
      box(group, foliage[i % 3], x, height, z, 3.3, 1.02, 2.85);
      box(group, foliage[(i + 1) % 3], x, height + 0.55, z, 2.34, 0.97, 2.15);
      box(group, foliage[(i + 2) % 3], x + 0.42, height + 1.14, z - 0.18, 1.42, 0.86, 1.63);
      box(group, iron, side * 11, 0.62 + i % 2, z + 1.15, 3.05, 1.65 + i % 3, 2.75);
      box(group, foliage[0], side * (13 + i % 3 * 3.8), 0.82, z + 1.5, 6.4, 1.64, 5.05);
      box(group, foliage[1], side * (14.6 + i % 3 * 3.8), 1.85, z + 0.8, 5.45, 0.72, 3.7);
    }
    lamp(group, -2.65, 4.4);
    lamp(group, 2.65, -3.8);
  }
  const pass = realms.get("journey").group;
  for (const side of [-1, 1]) {
    box(pass, basalt, side * 5.4, 2.55, -13.5, 6.9, 5.1, 2.6);
    box(pass, iron, side * 2.35, 2.87, -12.4, 1.0, 5.74, 1.25);
    lamp(pass, side * 1.68, -11.6, 2.8);
  }
  box(pass, basalt, 0, 4.93, -13.5, 5.7, 1.36, 2.6);
  box(pass, paint(0x191521), 0, 2.1, -14.9, 4.3, 4.25, 0.35);

  const wardenLook = { uid: "gus-relief-warden", watchColor: 0x39696a };
  const relief = buildGusRig(realms.get("day-off").group, box, { ...wardenLook, name: "Village relief warden" });
  relief.root.position.set(-3.55, 0, 7.1);
  relief.root.rotation.y = -Math.PI / 2.7;
  relief.reset();

  const ruins = realms.get("ruins").group;
  const fires = [];
  const ruinPlaster = paint(0x88745a, earthTexture);
  const ruinShingles = paint(0x55302c, gusSurface("roof"));
  const scorched = paint(0x2f2827, woodTexture);
  function ruinFlame(x, y, z, index) {
    const flame = box(ruins, index % 2 ? hot : amber, x, y, z, 0.31, 0.48 + index % 3 * 0.22, 0.36);
    flame.castShadow = false;
    fires.push(flame);
  }
  // Keep the silhouettes of the living village readable around the burned-out square.
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = side * (11.8 + i * 2.7), z = -12.8 + i * 7.8;
    const height = 3.3 + (i % 2) * 1.1;
    box(ruins, basalt, x, 0.43, z, 5.15, 0.86, 5.25);
    box(ruins, ruinPlaster, x, height / 2 + 0.42, z, 4.8, height, 4.8);
    for (const offset of [-2.33, 2.33]) {
      box(ruins, scorched, x + offset, height / 2 + 0.42, z + 2.45, 0.23, height, 0.26);
      box(ruins, amber, x + offset * 0.55, 2.55, z + 2.43, 0.74, 0.7, 0.055).castShadow = false;
    }
    for (let row = 0; row < 4; row++) {
      const width = 5.55 - row * 1.24;
      const brokenRidge = i === 1 && row >= 2;
      box(ruins, ruinShingles, x + side * row * 0.035, height + 0.65 + row * 0.40,
        z - (brokenRidge ? 0.86 : 0), width, 0.39, brokenRidge ? 3.76 : 5.55);
    }
    if (i === 1) {
      for (let j = 0; j < 5; j++) ruinFlame(x + (j - 2) * 0.33, height + 1.12 + j % 3 * 0.25, z + 1.65, j);
    }
  }
  for (const [x, z] of [[-22, -22], [18, -22], [22, -13], [-13, -25]]) {
    box(ruins, ruinPlaster, x, 0.82, z, 8.9, 1.68, 6.25);
    box(ruins, scorched, x - 1.5, 2.1, z + 0.25, 1.5, 1.2, 4.7);
    box(ruins, ruinShingles, x + 1.15, 1.99, z, 3.8, 0.67, 5).rotation.z = 0.3;
  }
  const collapsed = buildGusRig(ruins, box, { ...wardenLook, name: "Fallen village warden" });
  collapsed.root.position.set(-3.65, 0.54, -0.95);
  collapsed.root.rotation.set(0, 0.2, -1.49);
  collapsed.reset();
  collapsed.setForm("damaged");
  collapsed.updateWear(8, 0, true, false);
  const ashGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const ash = new THREE.InstancedMesh(ashGeometry,
    new THREE.MeshBasicMaterial({ color: 0x5c504c, transparent: true, opacity: 0.36, depthWrite: false }), 36);
  const ashTransform = new THREE.Object3D();
  ash.frustumCulled = false;
  ruins.add(ash);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = side * 6.2, z = 8 - 7 * i;
    box(ruins, basalt, x, 0.38, z, 4.4, 0.76, 3.45);
    box(ruins, basalt, x - 1.86, 1.18, z - 0.4, 0.54, 2.35, 2.51);
    box(ruins, basalt, x - 0.85, 1.22, z - 1.4, 2.4, 2.44, 0.62);
    box(ruins, wood, x - 0.28, 2.64, z - 1.1, 3.32, 0.27, 0.46).rotation.z = side * -0.24;
    box(ruins, wood, x + 1.5, 1.27, z - 1.4, 0.36, 2.54, 0.42);
    box(ruins, wood, x, 1.47, z + 0.6, 3.13, 0.31, 0.52).rotation.z = side * 0.47;
    for (let j = 0; j < 5; j++) {
      ruinFlame(x + j * 0.42 - 0.9, 0.88 + j % 2 * 0.16, z + (j % 3) * 0.24, j);
    }
  }
  const ruinFire = new THREE.PointLight(0xff7741, 14, 8, 2);
  ruinFire.position.set(-5.55, 1.25, -5.8);
  ruins.add(ruinFire);
  const survivor = makeVillager({ role: "farmer", id: "gus-story-survivor", district: "market" });
  survivor.root.position.set(1.35, 0, -3.35);
  survivor.root.rotation.y = Math.PI;
  ruins.add(survivor.root);

  const hall = realms.get("discovery").group;
  box(hall, basalt, 0, 2.45, -14.75, 22, 4.9, 0.65);
  for (const side of [-1, 1]) {
    box(hall, basalt, side * 10.9, 2.3, -2.2, 0.9, 4.6, 24.5);
    for (const z of [9, 3, -3, -9]) {
      box(hall, iron, side * 8.2, 2.28, z, 1.04, 4.56, 1.15);
      box(hall, basalt, side * 8.2, 0.33, z, 1.36, 0.66, 1.56);
      box(hall, basalt, side * 8.2, 4.36, z, 1.36, 0.48, 1.56);
      box(hall, basalt, side * 6.9, 4.48, z, 2.1, 0.5, 0.55);
      box(hall, iron, side * 5.65, 4.74, z, 0.8, 0.5, 0.55);
      lamp(hall, side * 7.22, z + 0.4, 2.68);
    }
  }
  const bars = new THREE.Group();
  bars.name = "Captive villagers’ cells";
  hall.add(bars);
  const cellLight = new THREE.PointLight(0xffbd79, 16, 8, 2);
  cellLight.position.set(-8, 2.3, -4.8);
  hall.add(cellLight);
  const entranceLight = new THREE.PointLight(0xffb68a, 10, 7, 2);
  entranceLight.position.set(1.4, 3.22, -0.85);
  hall.add(entranceLight);
  const captives = [];
  for (const [index, z] of [-0.55, -4.8, -9].entries()) {
    box(bars, basalt, -7.25, 1.55, z - 1.67, 2.9, 3.1, 0.65);
    box(bars, iron, -6.95, 0.13, z, 0.33, 0.25, 3.6);
    box(bars, iron, -6.95, 2.90, z, 0.37, 0.33, 3.6);
    for (let i = 0; i < 6; i++) box(bars, iron, -6.95, 1.51, z + (i - 2.5) * 0.58, 0.14, 2.78, 0.14);
    const captive = makeVillager({ role: ["farmer", "baker", "mason"][index], id: `gus-captive-${z}`, district: "market" });
    captive.root.position.set(-8.3, 0, z);
    captive.root.rotation.y = -Math.PI / 2;
    bars.add(captive.root);
    captives.push(captive);
  }

  function portalAt(group, z) {
    const arch = new THREE.Group();
    arch.position.set(0, 0, z);
    group.add(arch);
    box(arch, violet, 0, 2.15, 0, 2.67, 4.16, 0.07).castShadow = false;
    for (const x of [-1.6, 1.6]) {
      for (let i = 0; i < 5; i++) box(arch, i % 2 ? iron : basalt, x, 0.44 + i * 0.87, 0, 0.63, 0.84, 0.82);
    }
    box(arch, basalt, 0, 4.54, 0, 3.95, 0.59, 0.91);
    for (let i = 0; i < 7; i++) box(arch, glow(i % 2 ? 0xd294ff : 0x783dba),
      (i - 3) * 0.35, 0.58 + i % 4 * 0.85, 0.051, 0.16, 0.58 + i % 2 * 0.45, 0.03).castShadow = false;
    return arch;
  }
  const hallPortal = portalAt(hall, -12.2);
  const returnDoor = new THREE.Group();
  returnDoor.position.set(0, 0, -11.8);
  hall.add(returnDoor);
  box(returnDoor, basalt, 0, 4.28, 0, 4.6, 0.68, 1.04);
  for (const side of [-1, 1]) {
    box(returnDoor, basalt, side * 2.03, 2.11, 0, 0.66, 4.22, 1.04);
    box(returnDoor, wood, side * 0.89, 1.92, 0, 1.68, 3.84, 0.35);
    box(returnDoor, iron, side * 0.23, 1.96, 0.25, 0.27, 0.57, 0.12);
  }
  const cavern = realms.get("escape").group;
  portalAt(cavern, 13.1);
  const lava = new THREE.MeshStandardMaterial({ color: 0xb84123, emissive: 0xc03e16, emissiveIntensity: 1.2, roughness: 0.79 });
  const ledgeTop = paint(0x7c5550, stoneTexture);
  const ledgeWall = paint(0x593941, stoneTexture);
  const pool = box(cavern, lava, 0, -1.58, 0, 28, 0.18, 35);
  pool.castShadow = false;
  for (const [index, span] of LEDGE.entries()) {
    box(cavern, ledgeWall, span.x, -0.92, span.z, span.w + 0.12, 1.6, span.d);
    box(cavern, ledgeTop, span.x, -0.11, span.z, span.w, 0.22, span.d);
    lamp(cavern, span.x + (index % 2 === 0 ? -1 : 1) * (span.w / 2 - 0.28), span.z + 0.2, 1.17);
  }
  for (let i = 0; i < 24; i++) {
    const side = i % 2 ? -1 : 1, x = side * (4.8 + (i * 7 % 9) * 0.42);
    const z = -15 + i * 1.36;
    box(cavern, i % 3 ? hot : amber, x, -1.48, z, 0.55 + i % 4 * 0.3, 0.014, 0.08 + i % 2 * 0.12)
      .castShadow = false;
  }
  for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
    const z = 12 - i * 3.6;
    const x = side * (7.5 + i % 2);
    box(cavern, basalt, x, 1.4, z, 3.0, 2.8, 3.35);
    box(cavern, iron, x + side * 1.1, 3.45, z, 2.1, 3.1 + i % 3 * 0.85, 3.35);
    box(cavern, basalt, x + side * 1.8, 5.4, z + 0.52, 4.2, 1.65, 2.68);
  }
  const breachLight = new THREE.PointLight(0xb369ff, 15, 9, 2);
  breachLight.position.set(0, 2.12, 12.25);
  cavern.add(breachLight);
  const rescueLight = new THREE.PointLight(0xffae62, 22, 10, 2);
  rescueLight.position.set(0, 2.3, -11.8);
  cavern.add(rescueLight);

  const rescue = new THREE.Group();
  rescue.name = "Cavern rescue party";
  cavern.add(rescue);
  const pack = new THREE.Group();
  pack.name = "Cavern pack beast";
  rescue.add(pack);
  const hide = paint(0x896b55, earthTexture), mane = paint(0x4a342f, earthTexture);
  box(pack, hide, 0, 0.97, 0.18, 0.91, 0.83, 1.8);
  box(pack, mane, 0, 1.37, 0.22, 0.99, 0.24, 1.44);
  box(pack, wood, 0, 1.46, 0.33, 1.24, 0.14, 1.66);
  box(pack, hide, 0, 0.95, 1.23, 0.66, 0.67, 0.75);
  box(pack, mane, 0, 0.88, 1.64, 0.49, 0.35, 0.32);
  for (const x of [-0.36, 0.36]) {
    box(pack, iron, x, 1.35, 1.35, 0.16, 0.44, 0.21).rotation.z = x;
    box(pack, amber, x * 0.94, 1.06, 1.54, 0.064, 0.071, 0.04).castShadow = false;
    for (const z of [-0.51, 0.84]) box(pack, hide, x, 0.30, z, 0.27, 0.6, 0.34);
  }
  const rescuers = [-1, 1].map(side => {
    const smith = makeVillager({ role: "smith", id: `gus-cavern-smith-${side}`, district: "artisan" });
    smith.root.position.set(side * 1.55, 0, 0.35);
    smith.root.rotation.y = Math.PI;
    rescue.add(smith.root);
    return smith;
  });

  const workshop = realms.get("reforge").group;
  const forgeSmiths = [];
  box(workshop, basalt, 0, 2.44, -13.55, 16.7, 4.88, 1.0);
  for (let i = -2; i <= 2; i++) {
    box(workshop, iron, i * 2.97, 2.52, -13, 0.55, 5, 0.85);
    box(workshop, basalt, i * 2.97, 4.62, -11.4, 0.67, 0.47, 3.52);
  }
  for (const side of [-1, 1]) {
    box(workshop, basalt, side * 8.4, 2.25, -4.2, 0.72, 4.5, 19.3);
    lamp(workshop, side * 4.8, -4, 2.8);
    lamp(workshop, side * 4.8, 3.5, 2.8);
    const workbench = side * 5.5;
    box(workshop, wood, workbench, 0.63, -6.3, 2.7, 1.26, 1.06);
    box(workshop, iron, workbench, 1.36, -6.3, 1.72, 0.19, 0.71);
    const artisan = makeVillager({ role: "smith", id: `gus-cavern-smith-${side}`, district: "artisan" });
    artisan.root.position.set(side * 2.8, 0, -4.6);
    artisan.root.rotation.y = side * Math.PI / 3;
    workshop.add(artisan.root);
    forgeSmiths.push(artisan);
  }
  const forgeFire = new THREE.PointLight(0xff9e54, 20, 9, 2);
  forgeFire.position.set(0, 1.25, -5.8);
  workshop.add(forgeFire);
  box(workshop, basalt, 0, 0.37, -5, 3.1, 0.74, 2.12);
  box(workshop, iron, 0, 0.86, -5, 2.3, 0.24, 1.34);
  box(workshop, amber, 0, 0.99, -5.45, 1.7, 0.086, 0.43);
  const forgePress = new THREE.Group();
  forgePress.name = "Reforge press";
  forgePress.position.set(0, 3.28, -5.27);
  workshop.add(forgePress);
  box(forgePress, iron, 0, 0.17, 0, 1.31, 0.46, 0.81);
  box(forgePress, amber, 0, -0.11, 0, 1.02, 0.12, 0.68);
  for (const x of [-1.36, 1.36]) {
    box(workshop, basalt, x, 1.95, -5.85, 0.33, 3.9, 0.46);
    box(workshop, iron, x, 3.82, -5.46, 0.36, 0.34, 1.35);
  }
  box(workshop, iron, 0, 3.96, -5.67, 3.21, 0.32, 0.72);
  const sparks = new THREE.Group();
  workshop.add(sparks);
  for (let i = 0; i < 14; i++) {
    const spark = box(sparks, i % 2 ? hot : amber, 0, 0, -5, 0.08, 0.08, 0.08);
    spark.castShadow = spark.receiveShadow = false;
  }
  const trialTarget = new THREE.Group();
  trialTarget.name = "Reforge practice block";
  trialTarget.position.set(0, 0, 5.0);
  workshop.add(trialTarget);
  for (const x of [-0.82, 0, 0.82]) {
    box(trialTarget, basalt, x, 0.54, 0, 0.80, 1.08, 0.84);
    box(trialTarget, iron, x, 1.23, 0, 0.76, 0.24, 0.67);
  }

  const riverbank = realms.get("river").group;
  const grass = paint(0x697950, earthTexture);
  const earth = paint(0x655341, stoneTexture);
  const sand = paint(0xb8a177, earthTexture);
  const water = new THREE.MeshStandardMaterial({ color: 0x498292, roughness: 0.38, metalness: 0.13 });
  box(riverbank, earth, -14, -1.1, 0, 40, 2.1, 68);
  box(riverbank, grass, -15.65, -0.1, 0, 36.8, 0.20, 68);
  box(riverbank, sand, 4.37, -0.08, 0, 3.28, 0.16, 68);
  box(riverbank, water, 17.2, -0.53, 0, 22.5, 0.12, 68);
  box(riverbank, earth, 30.5, -0.99, 0, 5.5, 1.86, 68);
  box(riverbank, grass, 30.5, -0.03, 0, 5.5, 0.12, 68);
  const ripple = paint(0x81aead);
  for (let i = 0; i < 40; i++) {
    box(riverbank, ripple, 6.2 + (i * 23 % 71) * 0.3, -0.465, -24 + i * 1.3, 0.6 + i % 4 * 0.24, 0.012, 0.055)
      .castShadow = false;
  }
  for (let i = 0; i < 14; i++) {
    const x = -9.4 - (i * 5 % 11) * 1.1, z = -25 + i * 3.65;
    const rise = 2.25 + (i * 14 % 9) * 0.42;
    box(riverbank, earth, x, rise * 0.5, z, 5.1, rise, 5.6);
    box(riverbank, grass, x, rise + 0.08, z, 5.05, 0.16, 5.45);
    box(riverbank, earth, x - 2.2, rise + 1.03, z - 0.36, 4.6, 2.06, 4.1);
    box(riverbank, grass, x - 2.2, rise + 2.09, z - 0.36, 4.59, 0.10, 4.05);
  }
  for (let i = 0; i < 26; i++) {
    const x = (i % 2 ? -1 : 1) * (3.5 + i % 4 * 0.55);
    const z = -15.4 + i * 1.19;
    box(riverbank, grass, x, 0.27, z, 0.15, 0.54, 0.17).rotation.z = i % 2 ? 0.18 : -0.13;
    box(riverbank, grass, x + 0.17, 0.36, z + 0.21, 0.12, 0.72, 0.13).rotation.z = -0.18;
  }

  const steve = new THREE.Group();
  steve.name = "Steve";
  steve.scale.setScalar(1.31);
  hall.add(steve);
  const coat = paint(0x472a54), mail = paint(0x474452), brass = paint(0xc89555), skin = paint(0x916048);
  box(steve, coat, 0, 1.23, 0, 0.77, 0.65, 0.49);
  box(steve, mail, 0, 1.34, -0.23, 0.67, 0.35, 0.13);
  box(steve, brass, 0, 1.05, -0.26, 0.18, 0.14, 0.08);
  box(steve, skin, 0, 1.82, -0.03, 0.49, 0.49, 0.47);
  box(steve, mail, 0, 2.01, 0.02, 0.55, 0.17, 0.56);
  box(steve, mail, 0, 1.87, 0.22, 0.55, 0.26, 0.16);
  for (const x of [-0.116, 0.116]) box(steve, brass, x, 1.86, -0.271, 0.082, 0.046, 0.021);
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(), arm = new THREE.Group();
    legs.push(leg);
    arms.push(arm);
    leg.position.set(side * 0.205, 0.9, 0);
    arm.position.set(side * 0.5, 1.47, 0);
    steve.add(leg, arm);
    box(leg, coat, 0, -0.28, 0, 0.32, 0.58, 0.33);
    box(leg, mail, 0, -0.70, -0.06, 0.36, 0.39, 0.44);
    box(arm, mail, 0, -0.08, 0, 0.33, 0.26, 0.43);
    box(arm, coat, 0, -0.36, 0.01, 0.26, 0.33, 0.34);
    box(arm, skin, 0, -0.55, -0.01, 0.24, 0.18, 0.25);
  }
  const blade = box(arms[0], iron, 0, -0.56, -0.53, 0.11, 0.115, 0.92);
  box(arms[0], brass, 0, -0.56, -0.15, 0.31, 0.12, 0.12);
  box(arms[1], iron, 0, -0.33, -0.19, 0.49, 0.61, 0.15);
  const warning = new THREE.Mesh(new THREE.RingGeometry(STRIKE_RANGE - 0.12, STRIKE_RANGE, 40), hot);
  warning.name = "Steve strike warning";
  warning.rotation.x = -Math.PI / 2;
  hall.add(warning);
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.23), markerPaint);
  marker.name = "Gus story guide";
  root.add(marker);

  let mission, windup, recovery, stagger, counters, age, forgeTime;

  function reset(stage) {
    mission = stage;
    root.visible = isGusStoryBeat(stage);
    const realm = HALL_STAGES.has(stage) ? "discovery"
      : stage === "trial" || stage === "ready" ? "reforge" : stage === "ending" ? "river" : stage;
    for (const [key, { group }] of realms) group.visible = key === realm;
    const outdoors = realm === "river";
    (outdoors ? riverbank : hall).add(steve, warning);
    steve.visible = Object.hasOwn(DUELS, stage) || stage === "retreat" || stage === "ending";
    steve.position.set(0, 0, stage === "retreat" ? 9.1 : -3.4);
    steve.rotation.set(0, stage === "retreat" ? 0 : Math.PI, 0);
    for (const joint of [...arms, ...legs]) joint.rotation.set(0, 0, 0);
    blade.material = iron;
    entranceLight.visible = stage === "discovery";
    if (stage === "ending") {
      steve.position.set(-2.7, 0.27, -5.5);
      steve.rotation.set(0, 0.52, -Math.PI / 2);
    }
    hallPortal.visible = stage === "retreat";
    returnDoor.visible = stage === "return";
    trialTarget.visible = stage === "trial";
    sparks.visible = warning.visible = false;
    windup = recovery = stagger = counters = age = 0;
    forgeTime = null;
    forgePress.position.y = 3.28;
    rescue.position.set(0, 0, -12.6);
    rescue.rotation.y = 0;
    pack.position.y = 0;
    for (const [index, captive] of captives.entries()) captive.root.position.set(-8.3, 0, [-0.55, -4.8, -9][index]);
    const mark = gusStoryBeats[stage]?.mark;
    marker.visible = !!mark;
    if (mark) marker.position.set(mark[0], stage === "discovery" ? 2.42 : 1.8, mark[1]);
    if (stage === "trial") {
      marker.visible = true;
      marker.position.set(0, 1.9, trialTarget.position.z);
    }
    return realms.get(realm)?.sky;
  }

  function canMove(x, z) {
    if (mission === "escape") return LEDGE.some(span =>
      Math.abs(x - span.x) <= span.w / 2 - 0.22 && Math.abs(z - span.z) <= span.d / 2 - 0.15);
    if (mission === "river") return x >= -6.55 && x <= 4.98;
    if (HALL_STAGES.has(mission)) return Math.abs(x) <= 6.55;
    if (mission === "reforge" || mission === "trial") return Math.abs(x) <= 7.2 &&
      (Math.abs(x) >= 1.8 || z >= -3.72 || z <= -6.3);
    return Math.abs(x) <= 3.9;
  }

  function nearMark(player) {
    return marker.visible && Math.hypot(marker.position.x - player.x, marker.position.z - player.z) <= 2.35;
  }

  function updateDuel(dt, player, reducedMotion) {
    const duel = DUELS[mission];
    const dx = player.x - steve.position.x, dz = player.z - steve.position.z;
    const distance = Math.max(0.001, Math.hypot(dx, dz));
    face(steve, dx, dz, dt);
    if (stagger > 0) {
      stagger = Math.max(0, stagger - dt);
      arms[0].rotation.x = 0.32;
      arms[1].rotation.x = 0.35;
      warning.visible = false;
      return 0;
    }
    let damage = 0, stride = 0;
    if (windup > 0) {
      windup = Math.max(0, windup - dt);
      if (windup === 0) {
        recovery = RECOVERY;
        if (distance <= STRIKE_RANGE) damage = duel.damage;
      }
    } else if (recovery > 0) {
      recovery = Math.max(0, recovery - dt);
    } else if (distance <= 2.45) {
      windup = duel.windup;
    } else {
      const step = Math.min(duel.speed * dt, distance - 2.35);
      steve.position.x += step * dx / distance;
      steve.position.z += step * dz / distance;
      stride = reducedMotion ? 0 : Math.sin(age * 10) * 0.29;
    }
    warning.visible = windup > 0;
    warning.position.set(steve.position.x, 0.025, steve.position.z);
    arms[0].rotation.x = windup > 0 ? -1.8 * (1 - windup / duel.windup) : recovery > 0.9 ? 0.9 : stride;
    arms[1].rotation.x = recovery > 0 ? 0.12 : -0.65;
    blade.material = windup > 0 ? amber : iron;
    legs[0].rotation.x = -stride;
    legs[1].rotation.x = stride;
    return damage;
  }

  function stageDiscovery(time, dt, gusRoot) {
    marker.visible = false;
    gusRoot.position.set(-5.25, 0, -3.35);
    const player = gusRoot.position;
    const witness = captives[1];
    const step = THREE.MathUtils.smoothstep(time, 0.12, 1.18);
    witness.root.position.x = -8.3 + step * 0.76;
    face(witness.root, player.x - witness.root.position.x, player.z - witness.root.position.z, dt);
    witness.pose(dt, { age: time, speed: time < 1.18 ? 0.67 : 0, activity: "trade", distanceSq: 9 });
    steve.visible = time >= 1.55;
    steve.position.z = -5.35 + THREE.MathUtils.smoothstep(time, 1.55, 3.4) * 1.95;
    steve.rotation.y = Math.PI - THREE.MathUtils.smoothstep(time, 2.7, 3.48) * 0.54;
    gusRoot.rotation.y = Math.PI / 2 - THREE.MathUtils.smoothstep(time, 1.6, 2.5) * Math.PI;
    const stride = time < 3.4 ? Math.sin((time - 1.55) * 11) * 0.22 : 0;
    legs[0].rotation.x = -stride;
    legs[1].rotation.x = stride;
    arms[1].rotation.x = -0.23;
  }

  function stageRescue(time, dt, gus, origin) {
    const approach = THREE.MathUtils.smoothstep(time, 0.08, 1.95);
    const carrying = time >= 2.25;
    rescue.position.z = THREE.MathUtils.lerp(-12.6, Math.max(-11, origin.z - 1.65), approach)
      - Math.max(0, time - 2.25) * 1.1;
    rescue.rotation.y = carrying ? Math.PI : 0;
    const moving = time < 1.95 || carrying;
    pack.position.y = moving ? Math.abs(Math.sin(time * 8)) * 0.06 : 0;
    if (carrying) {
      gus.root.position.set(0, 1.95 + pack.position.y, rescue.position.z - 1.12);
      gus.root.rotation.set(Math.PI / 2, 0, 0);
    } else {
      const slump = THREE.MathUtils.smoothstep(time, 0.48, 1.96);
      gus.body.position.y -= slump * 0.52;
      gus.body.rotation.x += slump * 0.43;
      gus.arms[1].rotation.x -= slump * 0.78;
      face(gus.root, -origin.x, rescue.position.z - origin.z, dt);
    }
    for (const smith of rescuers) {
      if (carrying) smith.root.rotation.y = Math.PI;
      else face(smith.root, origin.x - smith.root.position.x,
        origin.z - rescue.position.z - smith.root.position.z, dt);
      smith.pose(dt, { age: time, speed: moving ? 0.7 : 0, activity: moving ? "idle" : "trade", distanceSq: 9 });
    }
  }

  return {
    root, reset, canMove,
    stageDiscovery, stageRescue,
    frameShot(shot, time, player, camera, target) {
      if (shot === "ruins") {
        const sweep = THREE.MathUtils.smoothstep(time, 0, 3.1);
        camera.position.set(6.8 - 4.5 * sweep, 8.2 - 3.28 * sweep, 16.1 + sweep * 0.3);
        target.set(-0.5 - sweep * 0.45, 1.25 + sweep * 0.3, -5.1 + sweep * 11.0);
      } else if (shot === "discovery") {
        if (time < 1.58) {
          camera.position.set(-5.67 - time * 0.28, 2.04, -4.78 + time * 0.025);
          target.set(-7.78, 1.46, -4.8);
        } else {
          camera.position.set(3.18 - Math.min(time - 1.58, 1.8) * 0.38, 2.22, 0.79);
          target.set(-0.12, 1.49, steve.position.z);
        }
      } else if (shot === "rescue") {
        if (time < 2.25) {
          camera.position.set(player.x + 4.1 - time * 0.32, 3.45, player.z + 2.54);
          target.set(player.x * 0.28, 1.33, player.z - 1.45);
        } else {
          camera.position.set(4.5, 3.47, player.z + 4.2);
          target.set(0, 1.65, player.z + 0.92);
        }
      }
    },
    poseSetback(player, time, dt) {
      const dx = player.x - steve.position.x, dz = player.z - steve.position.z;
      const distance = Math.max(0.001, Math.hypot(dx, dz));
      const step = time < 0.61 ? Math.min(Math.max(0, distance - 1.62), dt * 5.8) : 0;
      steve.position.x += step * dx / distance;
      steve.position.z += step * dz / distance;
      face(steve, dx, dz, dt);
      const lift = THREE.MathUtils.smoothstep(time, 0.08, 0.55);
      const cut = THREE.MathUtils.smoothstep(time, 0.56, 0.70);
      arms[0].rotation.x = -2.6 * lift + 3.42 * cut;
      arms[1].rotation.x = -0.18;
      warning.visible = false;
    },
    interact(player, reducedMotion) {
      if (!nearMark(player) || forgeTime !== null || mission === "trial") return null;
      if (mission !== "reforge" || reducedMotion) return gusStoryBeats[mission].next;
      forgeTime = 0;
      marker.visible = false;
      sparks.visible = true;
      return null;
    },
    hit(action, player, facing, slamRange) {
      if (mission === "trial") return action.slam && player.distanceTo(trialTarget.position) <= slamRange;
      const duel = DUELS[mission];
      const interrupt = mission !== "duel" && action.slam && windup > 0;
      if (!duel || (!interrupt && recovery <= 0) || counters >= duel.counters) return false;
      const dx = steve.position.x - player.x, dz = steve.position.z - player.z;
      const distance = Math.hypot(dx, dz);
      if (distance > (action.slam ? slamRange : 3) ||
          (!action.slam && -dx * Math.sin(facing) - dz * Math.cos(facing) < distance * 0.32)) return false;
      if (interrupt) stagger = 2.1;
      windup = 0;
      recovery = 0;
      counters++;
      return counters === duel.counters;
    },
    update(dt, player, reducedMotion) {
      age += dt;
      if (marker.visible && !reducedMotion) marker.rotation.y += dt * 1.7;
      if (DUELS[mission]) return updateDuel(dt, player, reducedMotion);
      if (mission === "ruins") {
        const time = reducedMotion ? 0 : age;
        for (const [i, flame] of fires.entries()) {
          flame.scale.y = 0.56 + Math.sin(time * (6 + i % 4) + i * 1.57) * 0.18;
        }
        for (let i = 0; i < ash.count; i++) {
          const fire = fires[i % fires.length];
          const life = (time * 0.26 + i * 0.071) % 1;
          ashTransform.position.set(fire.position.x + life * 1.7, 1.2 + life * 4.8, fire.position.z + life * 0.8);
          ashTransform.rotation.z = life * 2.8;
          ashTransform.scale.setScalar((0.65 + life * 3.2) * (1 - life * 0.42));
          ashTransform.updateMatrix();
          ash.setMatrixAt(i, ashTransform.matrix);
        }
        ash.instanceMatrix.needsUpdate = true;
        face(survivor.root, player.x - survivor.root.position.x, player.z - survivor.root.position.z, dt);
        survivor.pose(dt, { age, gazePitch: -0.16, distanceSq: survivor.root.position.distanceToSquared(player), reducedMotion });
      }
      if (forgeTime !== null) {
        forgeTime += dt;
        const pressStroke = Math.max(0, 1 - Math.abs(forgeTime - 1.14) / 0.48);
        const lockStroke = Math.max(0, 1 - Math.abs(forgeTime - 2.12) / 0.5);
        const stroke = Math.max(pressStroke, lockStroke);
        forgePress.position.y = 3.28 - stroke * 1.93;
        sparks.visible = stroke > 0.12;
        const activity = forgeTime < 2.4 ? "work" : "idle";
        for (const smith of forgeSmiths) smith.pose(dt, { age: forgeTime, activity, distanceSq: 9 });
        for (const [i, spark] of sparks.children.entries()) {
          const phase = (forgeTime * 1.7 + i * 0.174) % 1;
          spark.position.set(Math.sin(i * 2.4) * phase * 2.2, 1.0 + Math.sin(phase * Math.PI) * (1.4 + i % 4 * 0.28),
            -4.9 + Math.cos(i * 2.4) * phase * 1.7);
        }
      }
      return 0;
    },
    instruction(player, canSlam) {
      const beat = gusStoryBeats[mission];
      const duel = DUELS[mission];
      if (duel) {
        const count = `${counters}/${duel.counters} counters`;
        if (stagger > 0) return `Steve reels from the slam · ${count}`;
        if (windup > 0) {
          const response = mission !== "duel" && canSlam ? "Evade or use Q to interrupt" : "Move outside the ring";
          return `Strike incoming · ${response} · ${count}`;
        }
        if (recovery > 0) return `${canSlam ? "F or Q" : "F"} · Counter now · ${count}`;
        return `${beat.objective} · ${count}`;
      }
      if (forgeTime !== null) return "The smiths are fitting Gus’s new armor";
      if (beat.action && nearMark(player)) return `E · ${beat.action}`;
      if (mission === "escape" && player.z < 6.75) {
        if (player.z > 4.2 && player.x < 1.76) return "Bear right at the lantern";
        if (player.z >= -3.4) return "Cross the narrow ledge";
        if (player.x > 0.95) return "Follow the ledge back to the left";
        return "Reach the lights ahead";
      }
      return beat.objective;
    },
    get fighting() { return Object.hasOwn(DUELS, mission); },
    get countersLeft() { return (DUELS[mission]?.counters ?? 0) - counters; },
    get counterTarget() { return DUELS[mission]?.counters ?? 0; },
    get forging() { return forgeTime !== null; },
    get forgeProgress() { return forgeTime === null ? 0 : Math.min(1, forgeTime / FORGE_TIME); }
  };
}
