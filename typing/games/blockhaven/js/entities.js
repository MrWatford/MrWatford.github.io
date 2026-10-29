// Creatures and moving things: models, animation, movement, path finding, behavior, spawning, and saving.
// Each species is described by data (size, health, behavior, drops, model) and shares the same body physics.
import * as THREE from "../lib/three.module.min.js";
import { B, I, CHUNK, HEIGHT, SOLID, OPAQUE, idOf, metaOf, make, OPEN, TOP, SPAWN_EGGS } from "./blocks.js";
import { blockBoxes } from "./player.js";
import { Sound } from "./audio.js";

const GRAV = 26, EPS = 1e-4;
let nextId = 1;
const newId = () => Date.now().toString(36) + "-" + (nextId++).toString(36) + Math.random().toString(36).slice(2, 5);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));

// ---------- skins (each species gets one small texture; every box face uses a 16×16 square of it) ----------
function painterFor(ctx, ox, oy) {
  const P = {
    px(x, y, c) { if (x < 0 || y < 0 || x > 15 || y > 15) return; ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); },
    rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); },
    fill(pal) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.px(x, y, pal[Math.floor(Math.random() * pal.length)]); },
    clear() { ctx.clearRect(ox, oy, 16, 16); }
  };
  return P;
}
const FACE_ORDER = ["right", "left", "top", "bottom", "front", "back"];   // BoxGeometry order: +x −x +y −y +z −z
function makeSpecies(sp) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  let tile = 0;
  sp.geos = {};
  for (const part of sp.model.parts) {
    const g = new THREE.BoxGeometry(part.size[0] / 16, part.size[1] / 16, part.size[2] / 16);
    const uv = g.attributes.uv;
    FACE_ORDER.forEach((face, f) => {
      const tx = (tile % 8) * 16, ty = Math.floor(tile / 8) * 16; tile++;
      const paint = part.paint[face] || part.paint.all;
      paint(painterFor(ctx, tx, ty), face);
      for (let k = 0; k < 4; k++) { const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i); uv.setXY(i, (tx + 0.05 + u * 15.9) / 128, 1 - (ty + 0.05 + (1 - v) * 15.9) / 128); }
    });
    uv.needsUpdate = true;
    sp.geos[part.name] = g;
  }
  sp.tex = new THREE.CanvasTexture(canvas);
  sp.tex.magFilter = sp.tex.minFilter = THREE.NearestFilter; sp.tex.generateMipmaps = false;
}

// color helpers for skins
const solid = pal => P => P.fill(pal);
const face = (pal, draw) => (P, f) => { P.fill(pal); if (f === "front") draw(P); };
const SKIN_G = ["#5c9a4a", "#548f43", "#63a352"], SHIRT = ["#2fa0a8", "#2a929a"], PANTS = ["#3a40a0", "#343a94"];
const BONE = ["#d6d6ce", "#c8c8c0", "#e0e0d8"], CREEP = ["#4caf3a", "#3f9a30", "#5cc048", "#2f7a26", "#6ad055"];
const SPIDER = ["#3a302a", "#2e2622", "#45392f"], CAVE = ["#1d4a5a", "#163e4c", "#255868"], VOID = ["#141414", "#1b1b1b", "#0e0e0e"];
const humanoidParts = (o) => [
  { name: "body", size: [8, 12, 4], pivot: [0, 12 + o.legLen - 12, 0], off: [0, 6, 0], paint: o.body },
  { name: "head", size: [8, 8, 8], pivot: [0, 24 + o.legLen - 12, 0], off: [0, 4, 0], paint: o.head },
  { name: "armR", size: o.limb, pivot: [-(4 + o.limb[0] / 2), 22 + o.legLen - 12, 0], off: [0, -o.limb[1] / 2 + 2, 0], paint: o.arm },
  { name: "armL", size: o.limb, pivot: [4 + o.limb[0] / 2, 22 + o.legLen - 12, 0], off: [0, -o.limb[1] / 2 + 2, 0], paint: o.arm },
  { name: "legR", size: [o.limb[0], o.legLen, o.limb[2]], pivot: [-2, o.legLen, 0], off: [0, -o.legLen / 2, 0], paint: o.leg },
  { name: "legL", size: [o.limb[0], o.legLen, o.limb[2]], pivot: [2, o.legLen, 0], off: [0, -o.legLen / 2, 0], paint: o.leg }
];
const quadParts = (o) => [
  { name: "body", size: o.body, pivot: [0, o.legH + o.body[1] / 2, 0], off: [0, 0, 0], paint: o.bodyPaint },
  { name: "head", size: o.head, pivot: [0, o.legH + o.body[1] / 2 + o.headUp, o.body[2] / 2], off: [0, 0, o.head[2] / 2 - 1], paint: o.headPaint },
  ...[[-1, 1, "legFR"], [1, 1, "legFL"], [-1, -1, "legBR"], [1, -1, "legBL"]].map(([sx, sz, name]) => ({
    name, size: [o.leg, o.legH, o.leg], pivot: [sx * (o.body[0] / 2 - o.leg / 2), o.legH, sz * (o.body[2] / 2 - o.leg / 2 - 1)], off: [0, -o.legH / 2, 0], paint: o.legPaint
  }))
];

// ---------- species ----------
export const SPECIES = {
  zombie: { name: "Groaner", hostile: true, hp: 20, speed: 2.3, w: 0.6, h: 1.95, ai: "melee", dmg: 3, reach: 1.6, burns: true, xp: 5, sound: "groan",
    drops: () => [[I.ROTTEN_FLESH, randi(0, 2)], Math.random() < 0.03 ? [I.CARROT, 1] : null, Math.random() < 0.02 ? [I.IRON_INGOT, 1] : null],
    model: { type: "humanoid", armsOut: true, parts: humanoidParts({ legLen: 12, limb: [4, 12, 4],
      head: { all: solid(SKIN_G), top: solid(["#3a5a2e", "#33522a"]), front: face(SKIN_G, P => { P.rect(3, 6, 3, 2, "#1d2a1a"); P.rect(10, 6, 3, 2, "#1d2a1a"); P.rect(6, 11, 4, 1, "#3a5a2e"); }) },
      body: { all: solid(SHIRT) }, arm: { all: (P) => { P.fill(SKIN_G); P.rect(0, 0, 16, 5, SHIRT[0]); } }, leg: { all: solid(PANTS) } }) } },
  skeleton: { name: "Rattler", hostile: true, hp: 20, speed: 2.5, w: 0.6, h: 1.99, ai: "archer", dmg: 3, reach: 15, burns: true, xp: 5, sound: "rattle",
    drops: () => [[I.BONE, randi(0, 2)], [I.ARROW, randi(0, 2)]],
    model: { type: "humanoid", bow: true, parts: humanoidParts({ legLen: 12, limb: [2, 12, 2],
      head: { all: solid(BONE), front: face(BONE, P => { P.rect(3, 6, 3, 3, "#2a2a2a"); P.rect(10, 6, 3, 3, "#2a2a2a"); P.rect(7, 10, 2, 1, "#2a2a2a"); P.rect(4, 12, 8, 1, "#3a3a3a"); }) },
      body: { all: P => { P.fill(BONE); for (let y = 2; y < 16; y += 3) P.rect(2, y, 12, 1, "#3a3a3a"); P.rect(7, 0, 2, 16, "#c0c0b8"); } },
      arm: { all: solid(BONE) }, leg: { all: solid(BONE) } }) } },
  creeper: { name: "Hisser", hostile: true, hp: 20, speed: 2.4, w: 0.6, h: 1.7, ai: "creeper", xp: 5, sound: "hiss", drops: () => [[I.BOOM_POWDER, randi(0, 2)]],
    model: { type: "creeper", parts: [
      { name: "body", size: [8, 12, 4], pivot: [0, 6, 0], off: [0, 6, 0], paint: { all: solid(CREEP) } },
      { name: "head", size: [8, 8, 8], pivot: [0, 18, 0], off: [0, 4, 0], paint: { all: solid(CREEP), front: face(CREEP, P => { P.rect(3, 4, 3, 3, "#111"); P.rect(10, 4, 3, 3, "#111"); P.rect(6, 7, 4, 4, "#111"); P.rect(5, 9, 2, 4, "#111"); P.rect(9, 9, 2, 4, "#111"); }) } },
      ...[[-2, 2, "legFR"], [2, 2, "legFL"], [-2, -2, "legBR"], [2, -2, "legBL"]].map(([x, z, name]) => ({ name, size: [4, 6, 4], pivot: [x, 6, z * 1.5], off: [0, -3, 0], paint: { all: solid(CREEP) } }))] } },
  spider: { name: "Skitter", hostile: true, hp: 16, speed: 3.2, w: 1.4, h: 0.9, ai: "spider", dmg: 2, reach: 1.9, xp: 5, sound: "chitter", climbs: true,
    drops: () => [[I.STRING, randi(0, 2)], Math.random() < 0.33 ? [I.SPIDER_EYE, 1] : null], model: spiderModel(SPIDER) },
  cave_spider: { name: "Cave Skitter", hostile: true, hp: 12, speed: 3.4, w: 0.7, h: 0.5, ai: "spider", dmg: 2, reach: 1.4, xp: 5, sound: "chitter", climbs: true, poison: true, scale: 0.6,
    drops: () => [[I.STRING, randi(0, 2)], Math.random() < 0.33 ? [I.SPIDER_EYE, 1] : null], model: spiderModel(CAVE) },
  slime: { name: "Gloop", hostile: true, hp: 16, speed: 2.4, w: 1.0, h: 1.0, ai: "slime", xp: 4, sound: "squish", translucent: true,
    drops: e => e.size === 1 ? [[I.GLOOP_BALL, randi(0, 2)]] : [],
    model: { type: "slime", parts: [
      { name: "body", size: [16, 16, 16], pivot: [0, 0, 0], off: [0, 8, 0], paint: { all: P => { P.fill(["rgba(106,200,90,.75)", "rgba(96,190,80,.75)", "rgba(120,214,104,.75)"]); }, front: face(["rgba(106,200,90,.75)", "rgba(96,190,80,.75)"], P => { P.rect(3, 4, 3, 3, "#1d3a1a"); P.rect(10, 4, 3, 3, "#1d3a1a"); P.rect(6, 11, 4, 2, "#1d3a1a"); }) } }] } },
  voidwalker: { name: "Voidwalker", hostile: false, neutral: true, hp: 40, speed: 3.0, w: 0.6, h: 2.9, ai: "voidwalker", dmg: 4.5, reach: 2, xp: 5, sound: "warble",
    drops: () => [Math.random() < 0.6 ? [I.VOID_PEARL, 1] : null],
    model: { type: "humanoid", parts: humanoidParts({ legLen: 30, limb: [2, 30, 2],
      head: { all: solid(VOID), front: face(VOID, P => { P.rect(2, 8, 4, 1, "#d070ff"); P.rect(10, 8, 4, 1, "#d070ff"); P.rect(3, 8, 2, 1, "#ffffff"); P.rect(11, 8, 2, 1, "#ffffff"); }) },
      body: { all: solid(VOID) }, arm: { all: solid(VOID) }, leg: { all: solid(VOID) } }) } },

  cow: { name: "Cow", animal: true, hp: 10, speed: 1.6, w: 0.9, h: 1.4, ai: "animal", food: [I.WHEAT], xp: 2, sound: "moo",
    drops: e => e.baby ? [] : [[I.LEATHER, randi(0, 2)], [e.burning ? I.STEAK : I.RAW_BEEF, randi(1, 3)]],
    model: { type: "quad", parts: quadParts({ body: [12, 10, 18], head: [8, 8, 6], leg: 4, legH: 12, headUp: 4,
      bodyPaint: { all: P => { P.fill(["#4a3424", "#402c1e"]); for (let i = 0; i < 4; i++) P.rect(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), 6, 5, "#e8e8e8"); } },
      headPaint: { all: solid(["#4a3424"]), front: face(["#4a3424"], P => { P.rect(2, 3, 12, 6, "#e8e8e8"); P.rect(3, 5, 2, 2, "#111"); P.rect(11, 5, 2, 2, "#111"); P.rect(4, 10, 8, 5, "#e8a8a0"); P.rect(5, 12, 2, 1, "#5a3a3a"); P.rect(9, 12, 2, 1, "#5a3a3a"); }), top: P => { P.fill(["#4a3424"]); P.rect(0, 6, 3, 3, "#d8d8c8"); P.rect(13, 6, 3, 3, "#d8d8c8"); } },
      legPaint: { all: P => { P.fill(["#4a3424"]); P.rect(0, 12, 16, 4, "#2a2a2a"); } } }) } },
  sheep: { name: "Sheep", animal: true, hp: 8, speed: 1.6, w: 0.9, h: 1.3, ai: "animal", food: [I.WHEAT], xp: 2, sound: "baa",
    drops: e => e.baby ? [] : [e.sheared ? null : [B.WOOL, 1], [e.burning ? I.COOKED_MUTTON : I.RAW_MUTTON, randi(1, 2)]],
    model: { type: "quad", parts: [...quadParts({ body: [8, 8, 14], head: [6, 6, 8], leg: 4, legH: 12, headUp: 4,
      bodyPaint: { all: solid(["#e8c8b8", "#e0c0b0"]) }, headPaint: { all: solid(["#e0e0e0"]), front: face(["#d8c0a8"], P => { P.rect(3, 5, 2, 2, "#111"); P.rect(11, 5, 2, 2, "#111"); P.rect(6, 11, 4, 2, "#e8a8a0"); P.rect(0, 0, 16, 3, "#e0e0e0"); }) },
      legPaint: { all: P => { P.fill(["#d8c0a8"]); P.rect(0, 0, 16, 6, "#e8e8e8"); } } }),
      { name: "wool", size: [12, 12, 18], pivot: [0, 16, 0], off: [0, 0, 0], paint: { all: solid(["#eeeeee", "#e4e4e4", "#f6f6f6", "#dadada"]) } }] } },
  pig: { name: "Pig", animal: true, hp: 10, speed: 1.6, w: 0.9, h: 0.9, ai: "animal", food: [I.CARROT], xp: 2, sound: "oink",
    drops: e => e.baby ? [] : [[e.burning ? I.COOKED_PORK : I.RAW_PORK, randi(1, 3)]],
    model: { type: "quad", parts: quadParts({ body: [10, 8, 16], head: [8, 8, 8], leg: 4, legH: 6, headUp: 1,
      bodyPaint: { all: solid(["#f0a0a0", "#e89898", "#f4a8a8"]) }, legPaint: { all: solid(["#e89898"]) },
      headPaint: { all: solid(["#f0a0a0"]), front: face(["#f0a0a0"], P => { P.rect(2, 4, 2, 2, "#fff"); P.rect(3, 4, 1, 2, "#111"); P.rect(12, 4, 2, 2, "#fff"); P.rect(12, 4, 1, 2, "#111"); P.rect(4, 9, 8, 5, "#f8c0c0"); P.rect(5, 11, 2, 2, "#9a5050"); P.rect(9, 11, 2, 2, "#9a5050"); }) } }) } },
  chicken: { name: "Chicken", animal: true, hp: 4, speed: 1.6, w: 0.4, h: 0.7, ai: "animal", food: [I.SEEDS], xp: 1, sound: "cluck", flutters: true,
    drops: e => e.baby ? [] : [[I.FEATHER, randi(0, 2)], [e.burning ? I.COOKED_CHICKEN : I.RAW_CHICKEN, 1]],
    model: { type: "chicken", parts: [
      { name: "body", size: [6, 6, 8], pivot: [0, 8, 0], off: [0, 0, 0], paint: { all: solid(["#f4f4f4", "#eaeaea"]) } },
      { name: "head", size: [4, 6, 3], pivot: [0, 10, 4], off: [0, 2, 0.5], paint: { all: solid(["#f4f4f4"]), front: face(["#f4f4f4"], P => { P.rect(1, 3, 3, 3, "#111"); P.rect(12, 3, 3, 3, "#111"); P.rect(4, 8, 8, 4, "#f0c020"); P.rect(6, 12, 4, 4, "#e03a2a"); }) } },
      { name: "wingR", size: [1, 4, 6], pivot: [-3.5, 10, 0], off: [0, -2, 0], paint: { all: solid(["#e8e8e8"]) } },
      { name: "wingL", size: [1, 4, 6], pivot: [3.5, 10, 0], off: [0, -2, 0], paint: { all: solid(["#e8e8e8"]) } },
      { name: "legR", size: [1, 5, 1], pivot: [-1.5, 5, 0], off: [0, -2.5, 0], paint: { all: solid(["#f0b020"]) } },
      { name: "legL", size: [1, 5, 1], pivot: [1.5, 5, 0], off: [0, -2.5, 0], paint: { all: solid(["#f0b020"]) } }] } },
  rabbit: { name: "Rabbit", animal: true, hp: 3, speed: 2.6, w: 0.4, h: 0.5, ai: "animal", food: [I.CARROT], xp: 1, sound: "squeak", hops: true, skittish: true,
    drops: e => e.baby ? [] : [[e.burning ? I.COOKED_RABBIT : I.RAW_RABBIT, randi(0, 1)], Math.random() < 0.15 ? [I.LEATHER, 1] : null],
    model: { type: "rabbit", parts: [
      { name: "body", size: [6, 5, 8], pivot: [0, 4.5, 0], off: [0, 0, 0], paint: { all: solid(["#9a7a5a", "#8a6a4a", "#a8886a"]), back: face(["#9a7a5a"], () => {}) } },
      { name: "head", size: [5, 4, 5], pivot: [0, 7, 3.5], off: [0, 0, 2], paint: { all: solid(["#9a7a5a"]), front: face(["#9a7a5a"], P => { P.rect(2, 5, 3, 3, "#111"); P.rect(11, 5, 3, 3, "#111"); P.rect(6, 10, 4, 3, "#e8a8a0"); }) } },
      { name: "earR", size: [1, 5, 2], pivot: [-1.2, 9, 5], off: [0, 2.5, 0], paint: { all: solid(["#9a7a5a"]), front: solid(["#e8b8b0"]) } },
      { name: "earL", size: [1, 5, 2], pivot: [1.2, 9, 5], off: [0, 2.5, 0], paint: { all: solid(["#9a7a5a"]), front: solid(["#e8b8b0"]) } },
      { name: "tail", size: [2, 2, 2], pivot: [0, 5, -4], off: [0, 0, -1], paint: { all: solid(["#f4f0e8"]) } },
      { name: "legR", size: [2, 3, 4], pivot: [-2, 2, -2], off: [0, -1, 0], paint: { all: solid(["#8a6a4a"]) } },
      { name: "legL", size: [2, 3, 4], pivot: [2, 2, -2], off: [0, -1, 0], paint: { all: solid(["#8a6a4a"]) } }] } }
};
// ----- Ember Depths creatures -----
const PIGSKIN = ["#e8a090", "#df9888", "#f0a898"], ROT = ["#7a9a5a", "#e0a090", "#6a8a4a", "#c08878"], BLIGHT = ["#2a2a2a", "#222222", "#333333"];
const FLAME = ["#f0b030", "#ffc840", "#e09a20"], GHOST = ["#f0f0f0", "#e8e8e8", "#dcdcdc"], MAGMA = ["#4a1a10", "#3a140c", "#5a2014"];
const snoutFace = (pal, extra) => face(pal, P => { P.rect(2, 4, 3, 2, "#fff"); P.rect(3, 4, 2, 2, "#2a1a1a"); P.rect(11, 4, 3, 2, "#fff"); P.rect(11, 4, 2, 2, "#2a1a1a"); if (extra) extra(P); });
const boarkinParts = (o) => [...humanoidParts({ legLen: 12, limb: [4, 12, 4], head: o.head, body: o.body, arm: o.arm, leg: o.leg }).map(p => p.name === "head" ? { ...p, size: [10, 8, 8] } : p),
  { name: "snout", parent: "head", size: [4, 3, 1], pivot: [0, -1.5, 4.5], off: [0, 0, 0], paint: { all: solid([o.snout]), front: P => { P.fill([o.snout]); P.rect(3, 6, 3, 4, "#5a2a2a"); P.rect(10, 6, 3, 4, "#5a2a2a"); } } },
  { name: "earR", parent: "head", size: [1, 5, 4], pivot: [-5.5, 2, 0], off: [0, -2, 0], paint: { all: solid([o.snout]) } },
  { name: "earL", parent: "head", size: [1, 5, 4], pivot: [5.5, 2, 0], off: [0, -2, 0], paint: { all: solid([o.snout]) } }];
Object.assign(SPECIES, {
  flare: { name: "Flare", hostile: true, hp: 20, speed: 2.5, w: 0.6, h: 1.8, ai: "flare", flies: true, fireproof: true, xp: 10, sound: "flare", nether: true,
    drops: () => [[I.FLARE_ROD, randi(0, 1)]],
    model: { type: "flare", parts: [
      { name: "head", size: [8, 8, 8], pivot: [0, 20, 0], off: [0, 4, 0], paint: { all: solid(FLAME), front: face(FLAME, P => { P.rect(3, 6, 3, 2, "#3a1a00"); P.rect(10, 6, 3, 2, "#3a1a00"); P.rect(5, 11, 6, 1, "#a05a00"); }) } },
      ...Array.from({ length: 10 }, (_, i) => ({ name: "rod" + i, size: [2, 8, 2], pivot: [0, i < 5 ? 16 : 8, 0], off: [0, 0, 0], paint: { all: solid(["#ffb030", "#ffd860"]) } }))] } },
  wailer: { name: "Wailer", hostile: true, hp: 10, speed: 1.5, w: 2.6, h: 2.6, ai: "wailer", flies: true, fireproof: true, xp: 5, sound: "wail", scale: 2.6, nether: true,
    drops: () => [[I.WAILER_TEAR, randi(0, 1)], [I.BOOM_POWDER, randi(0, 2)]],
    model: { type: "wailer", parts: [
      { name: "body", size: [16, 16, 16], pivot: [0, 8, 0], off: [0, 0, 0], paint: { all: solid(GHOST), front: face(GHOST, P => { P.rect(3, 5, 4, 1, "#7a7a7a"); P.rect(10, 5, 4, 1, "#7a7a7a"); P.rect(6, 10, 4, 2, "#7a7a7a"); }) } },
      ...Array.from({ length: 9 }, (_, i) => ({ name: "t" + i, size: [2, 9, 2], pivot: [((i % 3) - 1) * 5, 0, (Math.floor(i / 3) - 1) * 5], off: [0, -4.5, 0], paint: { all: solid(GHOST) } }))] } },
  boarkin: { name: "Boarkin", hostile: true, hp: 16, speed: 2.7, w: 0.6, h: 1.95, ai: "boarkin", dmg: 4, reach: 1.7, xp: 5, sound: "snort", nether: true,
    drops: () => [Math.random() < 0.3 ? [I.GOLD_NUGGET, randi(1, 3)] : null],
    model: { type: "humanoid", parts: boarkinParts({ snout: "#f0b0a0", head: { all: solid(PIGSKIN), front: snoutFace(PIGSKIN) }, body: { all: P => { P.fill(["#7a4a2a", "#6e4226"]); P.rect(0, 10, 16, 2, "#ffd84a"); } }, arm: { all: solid(PIGSKIN) }, leg: { all: solid(["#5a3a20", "#4e321c"]) } }) } },
  brute: { name: "Boarkin Brute", hostile: true, hp: 50, speed: 2.9, w: 0.6, h: 1.95, ai: "melee", dmg: 7, reach: 1.8, xp: 20, sound: "snort", nether: true,
    drops: () => [[I.GOLD_NUGGET, randi(1, 4)]],
    model: { type: "humanoid", parts: boarkinParts({ snout: "#c89080", head: { all: solid(["#c08070", "#b07060"]), front: snoutFace(["#c08070"], P => P.rect(4, 1, 8, 1, "#5a2a2a")) }, body: { all: P => { P.fill(["#2a2a2a", "#222"]); P.rect(0, 10, 16, 2, "#ffd84a"); } }, arm: { all: solid(["#c08070"]) }, leg: { all: solid(["#2a2a2a"]) } }) } },
  rotboar: { name: "Rotboar", hostile: false, neutral: true, hp: 20, speed: 2.4, w: 0.6, h: 1.95, ai: "rotboar", dmg: 5, reach: 1.7, xp: 5, sound: "grunt", fireproof: true, nether: true,
    drops: () => [[I.ROTTEN_FLESH, randi(0, 1)], Math.random() < 0.4 ? [I.GOLD_NUGGET, randi(1, 2)] : null],
    model: { type: "humanoid", parts: boarkinParts({ snout: "#c09080", head: { all: solid(ROT), front: snoutFace(ROT, P => P.rect(10, 9, 4, 4, "#e8e4d8")) }, body: { all: P => { P.fill(ROT); P.rect(4, 4, 6, 6, "#e8e4d8"); } }, arm: { all: solid(ROT) }, leg: { all: solid(["#5a4a3a"]) } }) } },
  hogbeast: { name: "Hogbeast", hostile: true, hp: 40, speed: 2.4, w: 1.4, h: 1.4, ai: "melee", dmg: 6, reach: 2.2, xp: 5, sound: "snort", knockUp: true, nether: true,
    drops: () => [[I.RAW_PORK, randi(2, 4)], [I.LEATHER, randi(0, 1)]],
    model: { type: "quad", parts: [...quadParts({ body: [16, 14, 24], head: [14, 10, 12], leg: 6, legH: 10, headUp: 0,
      bodyPaint: { all: solid(["#c07850", "#b06a44", "#cc845a"]), top: P => { P.fill(["#c07850"]); P.rect(5, 0, 6, 16, "#6a4428"); } },
      headPaint: { all: solid(["#c07850"]), front: face(["#c07850"], P => { P.rect(2, 3, 2, 2, "#111"); P.rect(12, 3, 2, 2, "#111"); P.rect(4, 8, 8, 6, "#e0a888"); P.rect(5, 10, 2, 2, "#5a2a2a"); P.rect(9, 10, 2, 2, "#5a2a2a"); }) },
      legPaint: { all: solid(["#a06440"]) } }),
      { name: "tuskR", parent: "head", size: [2, 5, 2], pivot: [-6, -2, 6], off: [0, 2, 0], paint: { all: solid(["#f0e8d8"]) } },
      { name: "tuskL", parent: "head", size: [2, 5, 2], pivot: [6, -2, 6], off: [0, 2, 0], paint: { all: solid(["#f0e8d8"]) } }] } },
  blight: { name: "Blight Rattler", hostile: true, hp: 20, speed: 2.6, w: 0.7, h: 2.4, ai: "melee", dmg: 6, reach: 1.9, xp: 5, sound: "rattle", fireproof: true, blight: true, nether: true,
    drops: () => [[I.COAL, randi(0, 1)], [I.BONE, randi(0, 2)], Math.random() < 0.04 ? [I.BLIGHT_SKULL, 1] : null],
    model: { type: "humanoid", parts: humanoidParts({ legLen: 16, limb: [2, 16, 2],
      head: { all: solid(BLIGHT), front: face(BLIGHT, P => { P.rect(3, 6, 3, 3, "#0a0a0a"); P.rect(10, 6, 3, 3, "#0a0a0a"); P.rect(4, 12, 8, 1, "#4a4a4a"); }) },
      body: { all: P => { P.fill(BLIGHT); for (let y = 2; y < 16; y += 3) P.rect(2, y, 12, 1, "#0a0a0a"); } }, arm: { all: solid(BLIGHT) }, leg: { all: solid(BLIGHT) } }) } },
  magma: { name: "Magma Gloop", hostile: true, hp: 16, speed: 2.4, w: 1.0, h: 1.0, ai: "slime", fireproof: true, xp: 4, sound: "squish", hopHigh: true, nether: true,
    drops: e => e.size > 1 ? [[I.MAGMA_CREAM, randi(0, 1)]] : [],
    model: { type: "slime", parts: [
      { name: "body", size: [16, 16, 16], pivot: [0, 0, 0], off: [0, 8, 0], paint: { all: P => { P.fill(MAGMA); for (let y = 3; y < 16; y += 4) P.rect(0, y, 16, 1, "#ff7a1a"); }, front: face(MAGMA, P => { P.rect(0, 7, 16, 1, "#ff7a1a"); P.rect(3, 4, 3, 2, "#ffb030"); P.rect(10, 4, 3, 2, "#ffb030"); }) } }] } },
  strider: { name: "Lavastrider", animal: true, hp: 20, speed: 1.6, w: 0.9, h: 1.7, ai: "animal", food: [I.WART], fireproof: true, lavaWalk: true, xp: 2, sound: "chirp", nether: true,
    drops: () => [[I.STRING, randi(2, 5)]],
    model: { type: "strider", parts: [
      { name: "body", size: [16, 14, 16], pivot: [0, 18, 0], off: [0, 0, 0], paint: { all: P => { P.fill(["#a02a2a", "#902424", "#b03232"]); for (let x = 1; x < 16; x += 3) P.rect(x, 0, 1, 3, "#5a1414"); }, front: face(["#a02a2a"], P => { P.rect(2, 6, 12, 2, "#2a0a0a"); P.rect(3, 6, 2, 2, "#ffd84a"); P.rect(11, 6, 2, 2, "#ffd84a"); }) } },
      { name: "legR", size: [4, 16, 4], pivot: [-4, 11, 0], off: [0, -8, 0], paint: { all: solid(["#5a4a5a", "#4e404e"]) } },
      { name: "legL", size: [4, 16, 4], pivot: [4, 11, 0], off: [0, -8, 0], paint: { all: solid(["#5a4a5a", "#4e404e"]) } }] } }
});
// ----- the Hollow -----
const SCALES = ["#1a1220", "#22182a", "#140e1a"], MEMBRANE = ["#2a2234", "#322a3e"], SHELLC = ["#9a6aa8", "#8e609c", "#a676b4"];
Object.assign(SPECIES, {
  dragon: { name: "Hollow Wyrm", boss: true, noSave: true, hostile: true, hp: 200, speed: 10, w: 5, h: 3, ai: "dragon", flies: true, noclip: true, fireproof: true, dmg: 8, knockUp: true, xp: 0, sound: "roar",
    drops: () => [],
    model: { type: "dragon", parts: [
      { name: "body", size: [40, 24, 56], pivot: [0, 48, 0], off: [0, 0, 0], paint: { all: solid(SCALES), top: P => { P.fill(SCALES); for (let y = 0; y < 16; y += 3) P.rect(7, y, 2, 2, "#4a3a5a"); } } },
      { name: "neck", size: [16, 16, 36], pivot: [0, 52, 26], off: [0, 0, 18], paint: { all: solid(SCALES) } },
      { name: "head", parent: "neck", size: [24, 18, 30], pivot: [0, 2, 18], off: [0, 0, 14], paint: { all: solid(SCALES), front: face(SCALES, P => { P.rect(1, 3, 4, 2, "#d070ff"); P.rect(11, 3, 4, 2, "#d070ff"); P.rect(4, 10, 2, 2, "#0a0a0a"); P.rect(10, 10, 2, 2, "#0a0a0a"); }), top: P => { P.fill(SCALES); P.rect(2, 2, 2, 5, "#5a4a6a"); P.rect(12, 2, 2, 5, "#5a4a6a"); } } },
      { name: "jaw", parent: "head", size: [20, 6, 26], pivot: [0, -9, 0], off: [0, -3, 12], paint: { all: solid(SCALES) } },
      { name: "wingL", size: [80, 4, 44], pivot: [20, 58, 10], off: [40, 0, 0], paint: { all: solid(MEMBRANE), top: P => { P.fill(MEMBRANE); for (let x = 0; x < 16; x += 4) P.rect(x, 0, 1, 16, "#1a1220"); } } },
      { name: "wingTipL", parent: "wingL", size: [72, 2, 36], pivot: [40, 0, 0], off: [36, 0, -2], paint: { all: solid(MEMBRANE) } },
      { name: "wingR", size: [80, 4, 44], pivot: [-20, 58, 10], off: [-40, 0, 0], paint: { all: solid(MEMBRANE), top: P => { P.fill(MEMBRANE); for (let x = 0; x < 16; x += 4) P.rect(x, 0, 1, 16, "#1a1220"); } } },
      { name: "wingTipR", parent: "wingR", size: [72, 2, 36], pivot: [-40, 0, 0], off: [-36, 0, -2], paint: { all: solid(MEMBRANE) } },
      { name: "tail", size: [12, 12, 48], pivot: [0, 48, -28], off: [0, 0, -24], paint: { all: solid(SCALES) } },
      { name: "tail2", parent: "tail", size: [8, 8, 40], pivot: [0, 0, -24], off: [0, 0, -20], paint: { all: solid(SCALES) } },
      ...[[-14, 18, "legFR"], [14, 18, "legFL"], [-14, -18, "legBR"], [14, -18, "legBL"]].map(([x, z, name]) => ({ name, size: [10, 24, 10], pivot: [x, 38, z], off: [0, -12, 0], paint: { all: solid(SCALES) } }))] } },
  crystal: { name: "Void Crystal", noSave: true, hp: 1, w: 1.6, h: 2, ai: "crystal", static: true, fireproof: true, xp: 0, sound: "crystal", drops: () => [],
    model: { type: "crystal", parts: [
      { name: "cage", size: [14, 14, 14], pivot: [0, 16, 0], off: [0, 0, 0], paint: { all: P => { P.clear(); P.rect(0, 0, 16, 2, "#e8d8ff"); P.rect(0, 14, 16, 2, "#e8d8ff"); P.rect(0, 0, 2, 16, "#e8d8ff"); P.rect(14, 0, 2, 16, "#e8d8ff"); } } },
      { name: "core", size: [8, 8, 8], pivot: [0, 16, 0], off: [0, 0, 0], paint: { all: solid(["#ff7ae0", "#ffa8f0", "#e050c8"]) } },
      { name: "base", size: [16, 4, 16], pivot: [0, 0, 0], off: [0, 2, 0], paint: { all: solid(["#3a3a3a", "#2a2a2a"]) } }] } },
  sheller: { name: "Sheller", hostile: true, persist: true, hp: 30, w: 1, h: 1, ai: "sheller", static: true, fireproof: true, xp: 5, sound: "shell",
    drops: () => [Math.random() < 0.6 ? [I.SHELL, 1] : null],
    model: { type: "sheller", parts: [
      { name: "base", size: [16, 8, 16], pivot: [0, 0, 0], off: [0, 4, 0], paint: { all: solid(SHELLC) } },
      { name: "head", size: [8, 8, 8], pivot: [0, 6, 0], off: [0, 0, 0], paint: { all: solid(["#f0e8b0"]), front: face(["#f0e8b0"], P => { P.rect(3, 5, 3, 3, "#2a1a2a"); P.rect(10, 5, 3, 3, "#2a1a2a"); }) } },
      { name: "lid", size: [16, 10, 16], pivot: [0, 8, 0], off: [0, 5, 0], paint: { all: solid(SHELLC), top: P => { P.fill(SHELLC); P.rect(3, 3, 10, 10, "#b088c0"); } } }] } }
});
// ----- villages -----
// Trades: [what you give, what you get, how many times before restocking]
export const TRADES = {
  farmer: [[[[I.WHEAT, 20]], [I.JADE, 1], 12], [[[I.CARROT, 15]], [I.JADE, 1], 12], [[[I.JADE, 1]], [I.BREAD, 6], 12], [[[I.JADE, 1]], [I.APPLE, 4], 12], [[[I.JADE, 2]], [I.STEAK, 5], 8]],
  fletcher: [[[[I.STICK, 24]], [I.JADE, 1], 12], [[[I.FLINT, 10]], [I.JADE, 1], 12], [[[I.JADE, 1]], [I.ARROW, 16], 12], [[[I.JADE, 2]], [I.BOW, 1], 6], [[[I.JADE, 1], [I.FEATHER, 4]], [I.ARROW, 24], 8]],
  shepherd: [[[[B.WOOL, 18]], [I.JADE, 1], 12], [[[I.JADE, 2]], [I.SHEARS, 1], 6], [[[I.JADE, 3]], [B.BED, 1], 6], [[[I.JADE, 1]], [B.WOOL, 4], 12]],
  cleric: [[[[I.ROTTEN_FLESH, 32]], [I.JADE, 1], 12], [[[I.WART, 22]], [I.JADE, 1], 12], [[[I.JADE, 1]], [I.SHINE_DUST, 2], 12], [[[I.JADE, 5]], [I.VOID_PEARL, 1], 4], [[[I.JADE, 3]], [I.GOLD_INGOT, 2], 8]],
  smith: [[[[I.COAL, 15]], [I.JADE, 1], 12], [[[I.IRON_INGOT, 4]], [I.JADE, 1], 12], [[[I.JADE, 6]], [I.IRON_PICK, 1], 4], [[[I.JADE, 7]], [I.IRON_SWORD, 1], 4], [[[I.JADE, 9]], [I.IRON_CHEST, 1], 3], [[[I.JADE, 4]], [I.IRON_HELMET, 1], 4]],
  wanderer: [[[[I.JADE, 1]], [B.SAPLING, 3], 4], [[[I.JADE, 2]], [I.SHINE_DUST, 6], 4], [[[I.JADE, 3]], [I.GOLD_INGOT, 3], 4], [[[I.JADE, 4]], [I.SKYSHARD, 1], 2], [[[I.JADE, 2]], [I.WART, 6], 4], [[[I.JADE, 5]], [B.CHORUS_FLOWER, 2], 2]]
};
const ROBE = { villager: ["#8a5a3a", "#7e5234"], farmer: ["#8a5a3a", "#7e5234"], fletcher: ["#6a7a3a", "#5e6e34"], shepherd: ["#a08a60", "#94805a"], cleric: ["#6a3a8a", "#5e347e"], smith: ["#3a3a3a", "#2e2e2e"], wanderer: ["#2a5aa0", "#245094"] };
const VSKIN = ["#e8b890", "#deae86"];
const villagerModel = prof => ({ type: "villager", parts: [
  { name: "body", size: [8, 12, 6], pivot: [0, 12, 0], off: [0, 6, 0], paint: { all: P => { P.fill(ROBE[prof]); if (prof === "smith") P.rect(3, 4, 10, 12, "#5a3a20"); if (prof === "farmer") P.rect(3, 6, 10, 10, "#e8e0c8"); if (prof === "cleric") P.rect(6, 0, 4, 16, "#ffe27a"); } } },
  { name: "robe", size: [8, 12, 6], pivot: [0, 0, 0], off: [0, 6, 0], paint: { all: solid(ROBE[prof]) } },
  { name: "head", size: [8, 10, 8], pivot: [0, 24, 0], off: [0, 5, 0], paint: { all: solid(VSKIN), top: solid(prof === "farmer" ? ["#e0c060", "#d0b050"] : ["#5a3a20"]), front: face(VSKIN, P => { P.rect(0, 0, 16, 3, prof === "farmer" ? "#e0c060" : "#5a3a20"); P.rect(3, 6, 3, 2, "#fff"); P.rect(4, 6, 2, 2, "#2a6a2a"); P.rect(10, 6, 3, 2, "#fff"); P.rect(10, 6, 2, 2, "#2a6a2a"); P.rect(4, 4, 8, 1, "#4a2a10"); }) } },
  { name: "nose", parent: "head", size: [2, 4, 2], pivot: [0, -1.5, 5], off: [0, 0, 0], paint: { all: solid(["#d8a078"]) } },
  { name: "arms", size: [10, 4, 4], pivot: [0, 19, 3], off: [0, 0, 0], paint: { all: solid(ROBE[prof]), front: P => { P.fill(ROBE[prof]); P.rect(5, 4, 6, 8, VSKIN[0]); } } }] });
Object.assign(SPECIES, {
  ...Object.fromEntries(["farmer", "fletcher", "shepherd", "cleric", "smith", "wanderer"].map(prof => [prof, {
    name: prof === "wanderer" ? "Wanderer" : "Villager (" + prof[0].toUpperCase() + prof.slice(1) + ")", villager: true, persist: prof !== "wanderer", prof,
    hp: 20, speed: 1.8, w: 0.6, h: 1.95, ai: "villager", xp: 0, sound: "hmm", drops: () => [], model: villagerModel(prof) }])),
  golem: { name: "Ironwarden", persist: true, hp: 100, speed: 1.8, w: 1.4, h: 2.7, ai: "golem", dmg: 9, xp: 0, sound: "clank", knockUp: true,
    drops: () => [[I.IRON_INGOT, randi(3, 5)]],
    model: { type: "golem", parts: [
      { name: "body", size: [18, 12, 11], pivot: [0, 31, 0], off: [0, 6, 0], paint: { all: P => { P.fill(["#d8d4cc", "#ccc8c0", "#e0dcd4"]); for (let i = 0; i < 4; i++) P.rect(Math.floor(Math.random() * 12), Math.floor(Math.random() * 12), 2, 5, "#5a8a3a"); } } },
      { name: "waist", size: [9, 5, 6], pivot: [0, 26, 0], off: [0, 2.5, 0], paint: { all: solid(["#ccc8c0"]) } },
      { name: "head", size: [8, 10, 8], pivot: [0, 43, -2], off: [0, 5, 0], paint: { all: solid(["#d8d4cc"]), front: face(["#d8d4cc"], P => { P.rect(3, 6, 3, 2, "#a02020"); P.rect(10, 6, 3, 2, "#a02020"); P.rect(2, 4, 12, 1, "#8a8680"); }) } },
      { name: "nose", parent: "head", size: [2, 4, 2], pivot: [0, -1, 5], off: [0, 0, 0], paint: { all: solid(["#c0bcb4"]) } },
      { name: "armR", size: [4, 30, 6], pivot: [-11, 42, 0], off: [0, -13, 0], paint: { all: solid(["#ccc8c0", "#d8d4cc"]) } },
      { name: "armL", size: [4, 30, 6], pivot: [11, 42, 0], off: [0, -13, 0], paint: { all: solid(["#ccc8c0", "#d8d4cc"]) } },
      { name: "legR", size: [6, 26, 5], pivot: [-4, 26, 0], off: [0, -13, 0], paint: { all: solid(["#ccc8c0"]) } },
      { name: "legL", size: [6, 26, 5], pivot: [4, 26, 0], off: [0, -13, 0], paint: { all: solid(["#ccc8c0"]) } }] } },
  blightking: { name: "Blightking", boss: true, persist: true, hostile: true, hp: 300, speed: 5, w: 1.2, h: 3.4, ai: "blightking", flies: true, fireproof: true, dmg: 8, xp: 0, sound: "roar",
    drops: () => [],
    model: { type: "blightking", parts: [
      { name: "bar", size: [20, 3, 3], pivot: [0, 44, 0], off: [0, 0, 0], paint: { all: solid(BLIGHT) } },
      { name: "head", size: [8, 8, 8], pivot: [0, 46, 0], off: [0, 4, 0], paint: { all: solid(BLIGHT), front: face(BLIGHT, P => { P.rect(3, 6, 3, 3, "#d0f0ff"); P.rect(10, 6, 3, 3, "#d0f0ff"); P.rect(4, 12, 8, 1, "#0a0a0a"); }) } },
      { name: "headL", size: [6, 6, 6], pivot: [9, 46, 0], off: [0, 3, 0], paint: { all: solid(BLIGHT), front: face(BLIGHT, P => { P.rect(3, 6, 3, 3, "#d0f0ff"); P.rect(10, 6, 3, 3, "#d0f0ff"); }) } },
      { name: "headR", size: [6, 6, 6], pivot: [-9, 46, 0], off: [0, 3, 0], paint: { all: solid(BLIGHT), front: face(BLIGHT, P => { P.rect(3, 6, 3, 3, "#d0f0ff"); P.rect(10, 6, 3, 3, "#d0f0ff"); }) } },
      { name: "ribs", size: [10, 12, 5], pivot: [0, 42, 0], off: [0, -6, 0], paint: { all: P => { P.clear(); P.rect(7, 0, 2, 16, "#2a2a2a"); for (let y = 1; y < 16; y += 3) P.rect(1, y, 14, 2, "#2a2a2a"); } } },
      { name: "spine", size: [3, 14, 3], pivot: [0, 30, 0], off: [0, -7, 0], paint: { all: solid(BLIGHT) } }] } }
});
// ----- pets and mounts -----
const WOLF = ["#a8a8a4", "#9a9a96", "#b4b4b0"], GINGER = ["#e0902a", "#d4841f", "#e89c38"], CHESTNUT = ["#8a5a32", "#7e522c", "#946238"];
const MEATS = [I.RAW_BEEF, I.STEAK, I.RAW_PORK, I.COOKED_PORK, I.RAW_CHICKEN, I.COOKED_CHICKEN, I.RAW_MUTTON, I.COOKED_MUTTON, I.RAW_RABBIT, I.COOKED_RABBIT, I.ROTTEN_FLESH];
const collarPart = (size, pivot) => ({ name: "collar", parent: "head", size, pivot, off: [0, 0, 0], paint: { all: P => { P.fill(["#c8302a"]); P.rect(6, 4, 4, 6, "#f0c020"); } } });
Object.assign(SPECIES, {
  scout: { name: "Scout", pet: true, persist: true, neutral: true, hp: 8, tameHp: 20, speed: 2.6, w: 0.6, h: 0.85, ai: "scout", dmg: 3, reach: 1.5, xp: 1, sound: "bark",
    tameWith: [I.BONE], tameChance: 0.34, healWith: MEATS, drops: () => [],
    model: { type: "quad", parts: [...quadParts({ body: [6, 6, 10], head: [6, 6, 4], leg: 2, legH: 8, headUp: 2,
      bodyPaint: { all: solid(WOLF), top: P => { P.fill(WOLF); P.rect(0, 0, 16, 5, "#8a8a86"); } }, legPaint: { all: solid(WOLF) },
      headPaint: { all: solid(WOLF), front: face(WOLF, P => { P.rect(2, 5, 3, 2, "#1a1a1a"); P.rect(11, 5, 3, 2, "#1a1a1a"); }) } }),
      { name: "snout", parent: "head", size: [3, 3, 3], pivot: [0, -1.5, 3.5], off: [0, 0, 0], paint: { all: solid(["#d8d4cc"]), front: P => { P.fill(["#d8d4cc"]); P.rect(5, 2, 6, 4, "#1a1a1a"); } } },
      { name: "earR", parent: "head", size: [2, 2, 1], pivot: [-2, 4, 0], off: [0, 0, 0], paint: { all: solid(["#8a8a86"]) } },
      { name: "earL", parent: "head", size: [2, 2, 1], pivot: [2, 4, 0], off: [0, 0, 0], paint: { all: solid(["#8a8a86"]) } },
      { name: "tail", size: [2, 2, 8], pivot: [0, 13, -5], off: [0, 0, -4], paint: { all: solid(WOLF) } },
      collarPart([7, 2, 2], [0, -2.5, -2])] } },
  whisker: { name: "Whisker", pet: true, animal: true, hp: 10, speed: 2.4, w: 0.5, h: 0.7, ai: "animal", food: [I.RAW_CHICKEN, I.RAW_RABBIT], xp: 1, sound: "meow", skittish: true,
    tameWith: [I.RAW_CHICKEN, I.RAW_RABBIT], tameChance: 0.34, drops: () => [],
    model: { type: "quad", parts: [...quadParts({ body: [5, 5, 12], head: [5, 4, 5], leg: 2, legH: 6, headUp: 2,
      bodyPaint: { all: P => { P.fill(GINGER); for (let y = 1; y < 16; y += 4) P.rect(0, y, 16, 1, "#b86a14"); } }, legPaint: { all: solid(GINGER) },
      headPaint: { all: solid(GINGER), front: face(GINGER, P => { P.rect(2, 5, 3, 3, "#3ab04a"); P.rect(3, 5, 1, 3, "#111"); P.rect(11, 5, 3, 3, "#3ab04a"); P.rect(12, 5, 1, 3, "#111"); P.rect(6, 10, 4, 3, "#f0d0c0"); P.rect(7, 10, 2, 1, "#e07a8a"); }) } }),
      { name: "earR", parent: "head", size: [1, 2, 2], pivot: [-1.5, 3, 0], off: [0, 0, 0], paint: { all: solid(["#b86a14"]) } },
      { name: "earL", parent: "head", size: [1, 2, 2], pivot: [1.5, 3, 0], off: [0, 0, 0], paint: { all: solid(["#b86a14"]) } },
      { name: "tail", size: [1, 1, 10], pivot: [0, 10, -6], off: [0, 0, -5], paint: { all: P => { P.fill(GINGER); P.rect(0, 12, 16, 4, "#f4e8d8"); } } },
      collarPart([6, 1, 1], [0, -2.3, -1.5])] } },
  trotter: { name: "Trotter", animal: true, mount: true, hp: 22, speed: 2.0, w: 1.3, h: 1.6, ai: "animal", food: [I.WHEAT, I.APPLE], xp: 3, sound: "neigh",
    tameWith: [I.WHEAT, I.APPLE], drops: e => e.baby ? [] : [[I.LEATHER, randi(0, 2)], e.saddled ? [I.SADDLE, 1] : null],
    model: { type: "quad", parts: [...quadParts({ body: [10, 10, 22], head: [6, 14, 7], leg: 4, legH: 16, headUp: 7,
      bodyPaint: { all: solid(CHESTNUT) }, legPaint: { all: P => { P.fill(CHESTNUT); P.rect(0, 12, 16, 4, "#3a2a1a"); } },
      headPaint: { all: solid(CHESTNUT) } }),
      { name: "muzzle", parent: "head", size: [5, 5, 9], pivot: [0, 4.5, 4], off: [0, 0, 1], paint: { all: solid(CHESTNUT), front: P => { P.fill(["#6a4226"]); P.rect(3, 9, 3, 2, "#2a1a10"); P.rect(10, 9, 3, 2, "#2a1a10"); }, right: P => { P.fill(CHESTNUT); P.rect(10, 3, 2, 2, "#111"); }, left: P => { P.fill(CHESTNUT); P.rect(4, 3, 2, 2, "#111"); } } },
      { name: "earR", parent: "head", size: [2, 3, 1], pivot: [-2, 8, 0], off: [0, 0, 0], paint: { all: solid(["#6a4226"]) } },
      { name: "earL", parent: "head", size: [2, 3, 1], pivot: [2, 8, 0], off: [0, 0, 0], paint: { all: solid(["#6a4226"]) } },
      { name: "mane", parent: "head", size: [2, 15, 2], pivot: [0, 0, -4.2], off: [0, 0, 0], paint: { all: solid(["#2a1a10", "#3a2414"]) } },
      { name: "tail", size: [3, 12, 3], pivot: [0, 25, -11], off: [0, -5, -1], paint: { all: solid(["#2a1a10", "#3a2414"]) } },
      { name: "saddle", size: [11, 2, 10], pivot: [0, 27, 1], off: [0, 0, 0], paint: { all: solid(["#5a3418", "#4e2c14"]), top: P => { P.fill(["#5a3418"]); P.rect(2, 2, 12, 12, "#6e4422"); } } }] } }
});
function spiderModel(pal) {
  const legs = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) legs.push({ name: "leg" + i + (s > 0 ? "L" : "R"), size: [16, 2, 2], pivot: [s * 3, 5, 3 - i * 2], off: [s * 8, 0, 0], paint: { all: solid(["#2a2220"]) }, side: s, index: i });
  return { type: "spider", parts: [
    { name: "body", size: [10, 8, 12], pivot: [0, 6, -6], off: [0, 0, 0], paint: { all: solid(pal), top: P => { P.fill(pal); P.rect(4, 2, 8, 10, "#2a1a14"); } } },
    { name: "neck", size: [6, 6, 6], pivot: [0, 5, 1], off: [0, 0, 0], paint: { all: solid(pal) } },
    { name: "head", size: [8, 8, 8], pivot: [0, 5, 4], off: [0, 0, 4], paint: { all: solid(pal), front: face(pal, P => { for (const [x, y] of [[2, 5], [5, 4], [9, 4], [12, 5], [4, 8], [11, 8]]) P.rect(x, y, 2, 2, "#e0202a"); }) } },
    ...legs] };
}
for (const sp of Object.values(SPECIES)) if (!sp.geos) makeSpecies(sp);
export const SPAWN_SPECIES = SPAWN_EGGS.map(e => e[0]);

// ---------- block helpers ----------
function solidCell(world, x, y, z) {
  const v = world.get(x, y, z), id = idOf(v);
  if (id === B.DOOR) return !(metaOf(v) & OPEN);
  return SOLID[id] === 1;
}
const liquidAt = (world, x, y, z) => { const id = world.id(Math.floor(x), Math.floor(y), Math.floor(z)); return id === B.WATER ? "water" : id === B.LAVA ? "lava" : null; };
// Clear view between two points (only full blocks block it)?
export function lineOfSight(world, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, len = Math.hypot(dx, dy, dz), steps = Math.ceil(len * 3);
  for (let i = 1; i < steps; i++) { const t = i / steps; if (OPAQUE[world.id(Math.floor(a.x + dx * t), Math.floor(a.y + dy * t), Math.floor(a.z + dz * t))]) return false; }
  return true;
}

// ---------- path finding (small and bounded so it never freezes the game) ----------
function standable(world, x, y, z, tall, doors) {
  const blocked = (xx, yy, zz) => solidCell(world, xx, yy, zz) && !(doors && world.id(xx, yy, zz) === B.DOOR);
  if (blocked(x, y, z) || blocked(x, y + 1, z) || (tall > 2 && blocked(x, y + 2, z))) return false;
  const below = world.id(x, y - 1, z);
  if (below === B.LAVA || world.id(x, y, z) === B.LAVA) return false;
  return solidCell(world, x, y - 1, z) || below === B.WATER;
}
export function findPath(world, sx, sy, sz, tx, ty, tz, tall, maxNodes = 350, doors = false) {
  const key = (x, y, z) => x + "," + y + "," + z;
  const open = [{ x: sx, y: sy, z: sz, g: 0, f: Math.abs(tx - sx) + Math.abs(ty - sy) + Math.abs(tz - sz), parent: null }];
  const seen = new Map([[key(sx, sy, sz), open[0]]]);
  let best = open[0], expanded = 0;
  while (open.length && expanded < maxNodes) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const n = open.splice(bi, 1)[0]; expanded++;
    const h = Math.abs(tx - n.x) + Math.abs(ty - n.y) + Math.abs(tz - n.z);
    if (h < Math.abs(tx - best.x) + Math.abs(ty - best.y) + Math.abs(tz - best.z)) best = n;
    if (h <= 1) { best = n; break; }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (const dy of [0, 1, -1, -2, -3]) {
        const x = n.x + dx, y = n.y + dy, z = n.z + dz;
        if (dy === 1 && solidCell(world, n.x, n.y + 2, n.z)) continue;
        if (dy < 0 && (solidCell(world, x, n.y, z) || solidCell(world, x, n.y + 1, z))) continue;
        if (!standable(world, x, y, z, tall, doors)) continue;
        const k = key(x, y, z), g = n.g + 1 + (dy !== 0 ? 0.5 : 0);
        const old = seen.get(k);
        if (old && old.g <= g) break;
        const node = { x, y, z, g, f: g + Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tz - z), parent: n };
        seen.set(k, node); open.push(node);
        break;   // first workable height for this direction
      }
    }
  }
  const path = [];
  for (let n = best; n && n.parent; n = n.parent) path.unshift({ x: n.x + 0.5, y: n.y, z: n.z + 0.5 });
  return path;
}

// ---------- the entity ----------
export class Entity {
  constructor(sp, x, y, z, opts = {}) {
    this.uid = opts.uid || newId();
    this.sp = sp; this.def = SPECIES[sp];
    this.pos = { x, y, z }; this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = opts.yaw ?? Math.random() * Math.PI * 2; this.headYaw = 0; this.headPitch = 0;
    this.baby = !!opts.baby; this.growT = opts.growT ?? (this.baby ? 300 : 0);
    this.size = opts.size || (SPECIES[sp].ai === "slime" ? [1, 2, 4][randi(0, 2)] : 1);
    this.tame = !!opts.tame;   // set before health, since tame pets have more
    this.hp = opts.hp ?? this.maxHp;
    this.breedCd = opts.breedCd || 0; this.love = 0; this.sheared = !!opts.sheared; this.eggT = opts.eggT ?? rand(300, 600);
    this.name = opts.name || null; this.persist = !!(this.def.animal || this.def.persist || this.name);
    this.cid = opts.cid ?? null; this.phase = "circle"; this.phaseT = 8; this.ang = 0; this.open = 0;
    // villagers: home, job site, trades used, restocks
    this.home = opts.home || null; this.job = opts.job || null; this.uses = opts.uses || null; this.restockT = opts.restockT || 0; this.restockDay = opts.restockDay || 0; this.restocks = opts.restocks || 0;
    this.taskT = 0; this.task = "wander"; this.summonT = opts.summonT || 0;
    // pets and mounts
    this.tame = !!opts.tame; this.sitting = !!opts.sitting; this.saddled = !!opts.saddled; this.temper = opts.temper || 0; this.ridden = false;
    if (this.def.villager && !this.uses) this.uses = (TRADES[this.def.prof] || []).map(() => 0);
    this.barterT = 0;
    this.onGround = false; this.inWater = false; this.inLava = false; this.walkPhase = 0; this.hurtT = 0; this.iframes = 0;
    this.attackCd = 0; this.thinkT = Math.random() * 0.3; this.state = "idle"; this.target = null; this.goal = null; this.path = null; this.pathT = 0;
    this.fuse = 0; this.burnT = 0; this.angry = opts.angry || 0; this.dead = 0; this.age = 0; this.fleeT = 0; this.wantJump = false; this.drawT = 0;
    this.stuckT = 0; this.lastX = x; this.lastZ = z; this.hopT = rand(0.5, 2);
  }
  get maxHp() { if (this.tame && this.def.tameHp) return this.def.tameHp; return this.def.ai === "slime" ? this.size * this.size * 1 + (this.size === 4 ? 0 : 0) || 1 : this.def.hp; }
  get scale() { return (this.def.scale || 1) * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  get w() { return this.def.w * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  get h() { return this.def.h * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  aabb(x = this.pos.x, y = this.pos.y, z = this.pos.z) { const r = this.w / 2; return [x - r, y, z - r, x + r, y + this.h, z + r]; }
  get eyeY() { return this.pos.y + this.h * 0.85; }
  toJSON() {
    return { uid: this.uid, sp: this.sp, x: +this.pos.x.toFixed(2), y: +this.pos.y.toFixed(2), z: +this.pos.z.toFixed(2), yaw: +this.yaw.toFixed(2), hp: this.hp,
      baby: this.baby, growT: Math.round(this.growT), breedCd: Math.round(this.breedCd), sheared: this.sheared, eggT: Math.round(this.eggT), size: this.size, name: this.name,
      home: this.home, job: this.job, uses: this.uses, restockT: this.restockT, restockDay: this.restockDay, restocks: this.restocks, summonT: this.summonT,
      tame: this.tame, sitting: this.sitting, saddled: this.saddled, temper: this.temper };
  }
}

function overlaps(a, b) { return a[0] < b[3] - EPS && a[3] > b[0] + EPS && a[1] < b[4] - EPS && a[4] > b[1] + EPS && a[2] < b[5] - EPS && a[5] > b[2] + EPS; }
function boxesNear(world, a, lavaFloor) {
  const out = [];
  for (let y = Math.floor(a[1]) - 1; y <= Math.floor(a[4]); y++) for (let z = Math.floor(a[2]); z <= Math.floor(a[5]); z++) for (let x = Math.floor(a[0]); x <= Math.floor(a[3]); x++) {
    const v = world.get(x, y, z);
    if (lavaFloor && idOf(v) === B.LAVA) out.push([x, y, z, x + 1, y + 0.85, z + 1]);   // lava striders walk on lava
    else blockBoxes(v, x, y, z, out);
  }
  return out;
}
// Move a body through the world, stopping at blocks. Returns true if a wall was bumped.
function moveBody(world, e, dt) {
  const p = e.pos, v = e.vel;
  let bumped = false;
  e.onGround = false;
  const lf = !!e.def.lavaWalk;
  p.y += v.y * dt;
  let a = e.aabb(), hit = null;
  for (const b of boxesNear(world, a, lf)) if (overlaps(a, b) && (!hit || (v.y < 0 ? b[4] > hit[4] : b[1] < hit[1]))) hit = b;
  if (hit) { if (v.y < 0) { p.y = hit[4]; e.onGround = true; } else p.y = hit[1] - e.h - EPS; v.y = 0; }
  for (const ax of ["x", "z"]) {
    const before = p[ax]; p[ax] += v[ax] * dt; a = e.aabb();
    if (boxesNear(world, a, lf).some(b => overlaps(a, b))) { p[ax] = before; v[ax] = 0; bumped = true; }
  }
  return bumped;
}

// ---------- the manager: updates, draws, spawns, and saves every creature ----------
export class Entities {
  constructor(scene, ctx) {
    this.scene = scene; this.ctx = ctx;      // ctx: game hooks (player, world, hurtPlayer, drop, explode, settings…)
    this.list = []; this.projectiles = []; this.spawnT = 0; this.frustum = new THREE.Frustum(); this.tmpM = new THREE.Matrix4();
  }
  get world() { return this.ctx.world(); }

  add(sp, x, y, z, opts) {
    if (!SPECIES[sp]) return null;
    const e = new Entity(sp, x, y, z, opts);
    this.attachModel(e);
    this.list.push(e);
    return e;
  }
  attachModel(e) {
    const def = e.def, mat = new THREE.MeshBasicMaterial({ map: def.tex, transparent: !!def.translucent, alphaTest: def.translucent ? 0.05 : 0.5, depthWrite: !def.translucent });
    const root = new THREE.Group(), parts = {};
    for (const p of def.model.parts) {
      const pivot = new THREE.Group(); pivot.position.set(p.pivot[0] / 16, p.pivot[1] / 16, p.pivot[2] / 16);
      const m = new THREE.Mesh(def.geos[p.name], mat); m.position.set(p.off[0] / 16, p.off[1] / 16, p.off[2] / 16);
      pivot.add(m); (p.parent ? parts[p.parent].children[0] : root).add(pivot); parts[p.name] = pivot;
    }
    if (def.model.armsOut) { parts.armR.rotation.x = parts.armL.rotation.x = -Math.PI / 2; }
    if (def.model.type === "spider") for (const p of def.model.parts.filter(q => q.side)) { const g = parts[p.name]; g.rotation.y = p.side * (0.6 - p.index * 0.4); g.rotation.z = p.side * 0.4; g.userData.base = { y: g.rotation.y, z: g.rotation.z }; }
    const holder = new THREE.Group(); holder.add(root);
    e.mesh = holder; e.root = root; e.parts = parts; e.mat = mat;
    this.scene.add(holder);
  }
  remove(e) { this.scene.remove(e.mesh); e.mat.dispose(); e.mesh = null; if (e.beam) { this.scene.remove(e.beam); e.beam.geometry.dispose(); e.beam.material.dispose(); e.beam = null; } }
  clear() { for (const e of this.list) this.remove(e); this.list = []; for (const p of this.projectiles) this.scene.remove(p.mesh); this.projectiles = []; }

  // ----- saving -----
  // Creatures in chunks that unload are tucked into the world's store, then brought back when the chunk loads again.
  unloadChunk(c) {
    const w = this.world, keep = [];
    for (const e of this.list) {
      if (Math.floor(e.pos.x / CHUNK) !== c.cx || Math.floor(e.pos.z / CHUNK) !== c.cz) continue;
      if (e.sp === "dragon") { this.ctx.bossLeft(e); }
      if (e.persist && !e.def.noSave) keep.push(e.toJSON());
      e.gone = true;
    }
    if (keep.length) w.entityStore.set(c.key, keep);
    this.sweep();
  }
  loadChunk(c) {
    const w = this.world, saved = w.entityStore.get(c.key);
    if (saved) { w.entityStore.delete(c.key); for (const s of saved) this.add(s.sp, s.x, s.y, s.z, s); }
    if (!w.visited.has(c.key)) { w.visited.add(c.key); this.populate(c); }
  }
  sweep() { this.list = this.list.filter(e => { if (e.gone) { this.remove(e); return false; } return true; }); }
  toJSON() {   // everything that should be remembered, loaded or not
    const w = this.world, store = {};
    for (const [k, v] of w.entityStore) store[k] = v;
    for (const e of this.list) {
      if (!e.persist || e.dead || e.def.noSave) continue;
      const k = Math.floor(e.pos.x / CHUNK) + "," + Math.floor(e.pos.z / CHUNK);
      (store[k] = store[k] || []).push(e.toJSON());
    }
    return store;
  }

  // ----- first visit: a few animals live here -----
  populate(c) {
    const w = this.world, x0 = c.cx * CHUNK, z0 = c.cz * CHUNK;
    const vp = w.gen.villagePiece && (w.gen.version >= 5 || w.newGen.has(c.key)) ? w.gen.villagePiece(c.cx, c.cz) : null;
    if (vp) {   // villagers move into the village (and an Ironwarden guards the plaza)
      const [hx, hy, hz] = vp.home;
      if (vp.type === "plaza") { this.add("golem", hx, hy, hz, { home: vp.home }); this.add(vp.prof, hx + 2, hy, hz, { home: vp.home }); if (Math.random() < 0.6) this.add("whisker", hx - 2, hy, hz); }
      else this.add(vp.prof, hx, hy, hz, { home: vp.type === "house" ? [vp.bed[0] + 0.5, vp.bed[1], vp.bed[2] + 2.5] : vp.home, job: vp.job });
      if (vp.type === "farm") for (let lx = 4; lx <= 11; lx++) for (let lz = 4; lz <= 11; lz++) if (lz !== 7) w.crops.add((x0 + lx) + "," + (vp.y + 1) + "," + (z0 + lz));
      return;
    }
    if (w.gen.isEnd && w.gen.isEnd()) {   // Shellers guard each Hollow tower
      const city = w.gen.city(c.cx, c.cz);
      if (city) for (const [dx, dy, dz] of [[-3, 0, -3], [3, 6, 3], [-3, 12, 3], [3, 18, -3]]) if (city.y + dy < HEIGHT - 4) this.add("sheller", city.x + dx + 0.5, city.y + dy, city.z + dz + 0.5);
      return;
    }
    if (Math.random() > 0.3) return;
    if (w.gen.isNether()) return;   // the Ember Depths fill up through the spawner instead
    const biome = w.gen.column(x0 + 8, z0 + 8).biome;
    if (biome === "peak") return;
    const pool = biome === "sandy" ? [["rabbit", 1]] : [["cow", 25], ["sheep", 25], ["pig", 20], ["chicken", 20], ["rabbit", 10], ["whisker", 4],
      ...(biome === "forest" || biome === "birch" ? [["scout", 14]] : []), ...(biome === "plains" ? [["trotter", 14]] : [])];
    let t = Math.random() * pool.reduce((s, p) => s + p[1], 0), sp = pool[0][0];
    for (const [k, wgt] of pool) { t -= wgt; if (t <= 0) { sp = k; break; } }
    const n = sp === "whisker" ? 1 : randi(2, 4);
    for (let i = 0; i < n; i++) {
      const x = x0 + randi(1, 14), z = z0 + randi(1, 14), y = w.surfaceY(x, z), top = w.id(x, y, z);
      if (![B.GRASS, B.SAND, B.SNOW].includes(top) || solidCell(w, x, y + 1, z)) continue;
      this.add(sp, x + 0.5, y + 1, z + 0.5, { baby: Math.random() < 0.15 });
    }
  }

  // ----- hostile spawning around the player -----
  spawnTick(dt, daylight, camera) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    this.spawnT = 1;
    const ctx = this.ctx, s = ctx.settings(), w = this.world, p = ctx.player();
    // now and then, a Wanderer shows up during the day to trade
    if (!w.gen.isNether() && !(w.gen.isEnd && w.gen.isEnd()) && daylight > 0.8 && (this.wanderT = (this.wanderT ?? 120) - 1) <= 0) {
      this.wanderT = 300;
      if (Math.random() < 0.5 && !this.list.some(e => e.sp === "wanderer")) {
        const a = Math.random() * Math.PI * 2, x = Math.floor(p.pos.x + Math.cos(a) * 14), z = Math.floor(p.pos.z + Math.sin(a) * 14);
        if (w.isLoaded(x, z)) { const y = w.surfaceY(x, z) + 1; if (SOLID[w.id(x, y - 1, z)] && !solidCell(w, x, y, z) && !solidCell(w, x, y + 1, z)) { this.add("wanderer", x + 0.5, y, z + 0.5); this.ctx.toast("A Wanderer has arrived to trade!"); } }
      }
    }
    if (s.difficulty === "peaceful" || ctx.creative()) return;
    const cap = { easy: 8, normal: 12, hard: 16 }[s.difficulty] || 10;
    const hostiles = this.list.filter(e => e.def.hostile || e.sp === "voidwalker").length;
    if (hostiles >= cap) return;
    this.tmpM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); this.frustum.setFromProjectionMatrix(this.tmpM);
    if (w.gen.isNether()) { this.netherSpawn(w, p, camera); return; }
    if (w.gen.isEnd && w.gen.isEnd()) {   // Voidwalkers wander the Hollow's islands
      if (this.list.filter(e => e.sp === "voidwalker").length >= 8) return;
      const ang = Math.random() * Math.PI * 2, dist = rand(20, 40), x = Math.floor(p.pos.x + Math.cos(ang) * dist), z = Math.floor(p.pos.z + Math.sin(ang) * dist);
      if (!w.isLoaded(x, z)) return;
      const y = w.surfaceY(x, z) + 1;
      if (w.id(x, y - 1, z) !== B.HOLLOWSTONE || solidCell(w, x, y, z) || solidCell(w, x, y + 1, z) || solidCell(w, x, y + 2, z)) return;
      if (dist < 30 && this.frustum.containsPoint(new THREE.Vector3(x + 0.5, y + 1, z + 0.5))) return;
      this.add("voidwalker", x + 0.5, y, z + 0.5);
      return;
    }
    for (let tries = 0; tries < 4; tries++) {
      const ang = Math.random() * Math.PI * 2, dist = rand(22, 44);
      const x = Math.floor(p.pos.x + Math.cos(ang) * dist), z = Math.floor(p.pos.z + Math.sin(ang) * dist);
      if (!w.isLoaded(x, z)) continue;
      const surface = w.surfaceY(x, z), under = Math.random() < 0.5 && surface > 12;
      let y = surface + 1;
      if (under) {   // a cave pocket somewhere below
        let yy = randi(4, surface - 6), found = -1;
        for (let k = 0; k < 12 && yy + k < surface - 3; k++) if (solidCell(w, x, yy + k - 1, z) && !solidCell(w, x, yy + k, z) && !solidCell(w, x, yy + k + 1, z)) { found = yy + k; break; }
        if (found < 0) continue; y = found;
      }
      const ground = w.id(x, y - 1, z);
      if (!SOLID[ground] || [B.LEAVES, B.BIRCH_LEAVES, B.GLASS, B.BEDROCK].includes(ground) || liquidAt(w, x + 0.5, y + 0.5, z + 0.5)) continue;
      const L = w.lightAt(x, y, z);
      if (!L || L[1] > 0 || L[0] * daylight > 5) continue;          // must be dark: no torchlight, little sky light
      const sp = this.pickHostile(w, x, y, z, under || L[0] === 0);
      const def = SPECIES[sp], tall = Math.ceil(def.h);
      let room = true; for (let k = 0; k < tall; k++) if (solidCell(w, x, y + k, z)) room = false;
      if (!room) continue;
      const pt = new THREE.Vector3(x + 0.5, y + 1, z + 0.5);
      if (dist < 34 && this.frustum.containsPoint(pt)) continue;    // don't pop into view
      this.add(sp, x + 0.5, y, z + 0.5);
      return;
    }
  }
  // Who lives where in the Ember Depths
  pickNether(w, x, y, z) {
    const below = w.id(x, y - 1, z), biome = w.gen.biome(x, z);
    let pool;
    if (below === B.EMBER_BRICKS) pool = [["flare", 40], ["blight", 40], ["magma", 10]];
    else if (below === B.BLACKSTONE_BRICKS) pool = [["brute", 35], ["boarkin", 50], ["magma", 15]];
    else pool = { wastes: [["rotboar", 50], ["boarkin", 15], ["magma", 8], ["wailer", 12]], crimson: [["hogbeast", 30], ["boarkin", 30], ["rotboar", 15]],
      warped: [["voidwalker", 40]], soul: [["wailer", 20], ["skeleton", 40]], basalt: [["magma", 50], ["wailer", 10]] }[biome] || [["rotboar", 1]];
    let t = Math.random() * pool.reduce((s, q) => s + q[1], 0);
    for (const [k, wgt] of pool) { t -= wgt; if (t <= 0) return k; }
    return pool[0][0];
  }
  netherSpawn(w, p, camera) {
    for (let tries = 0; tries < 5; tries++) {
      const ang = Math.random() * Math.PI * 2, dist = rand(20, 40);
      const x = Math.floor(p.pos.x + Math.cos(ang) * dist), z = Math.floor(p.pos.z + Math.sin(ang) * dist);
      if (!w.isLoaded(x, z)) continue;
      // striders on the lava sea
      if (Math.random() < 0.1) {
        if (w.id(x, 22, z) === B.LAVA && !w.id(x, 23, z) && !w.id(x, 24, z) && this.list.filter(e => e.sp === "strider").length < 4) this.add("strider", x + 0.5, 23, z + 0.5);
        continue;
      }
      let y = -1;
      const start = randi(24, 66);
      for (let k = 0; k < 16; k++) { const yy = start - k; if (SOLID[w.id(x, yy - 1, z)] && !solidCell(w, x, yy, z) && !solidCell(w, x, yy + 1, z) && !liquidAt(w, x + 0.5, yy + 0.5, z + 0.5)) { y = yy; break; } }
      if (y < 0) continue;
      const L = w.lightAt(x, y, z);
      if (!L || L[1] >= 12) continue;
      const sp = this.pickNether(w, x, y, z), def = SPECIES[sp];
      let room = true; for (let k = 0; k < Math.ceil(def.h) + (def.flies ? 3 : 0); k++) if (solidCell(w, x, y + k, z)) room = false;
      if (!room) continue;
      if (dist < 30 && this.frustum.containsPoint(new THREE.Vector3(x + 0.5, y + 1, z + 0.5))) continue;
      this.add(sp, x + 0.5, y + (def.flies ? 2 : 0), z + 0.5);
      return;
    }
  }
  pickHostile(w, x, y, z, underground) {
    const slimeChunk = ((Math.floor(x / 16) * 31 + Math.floor(z / 16) * 17) & 7) === 0;
    const pool = [["zombie", 30], ["skeleton", 25], ["creeper", 22], ["spider", 18]];
    if (!underground) pool.push(["voidwalker", 5]);
    if (underground && y < 40 && slimeChunk) pool.push(["slime", 40]);
    if (underground && y < 30) pool.push(["cave_spider", 6]);
    let t = Math.random() * pool.reduce((s, p) => s + p[1], 0);
    for (const [k, wgt] of pool) { t -= wgt; if (t <= 0) return k; }
    return "zombie";
  }

  // ----- every frame -----
  update(dt, daylight, camera) {
    const ctx = this.ctx, p = ctx.player(), w = this.world;
    this.spawnTick(dt, daylight, camera);
    for (const e of this.list) {
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d2 = dx * dx + dz * dz;
      // far-away monsters wander off (despawn); animals and named creatures stay
      if (!e.persist && !e.def.noSave && (d2 > 72 * 72 || (d2 > 36 * 36 && Math.random() < dt / 30))) { e.gone = true; continue; }
      if (e.def.boss && !e.persist && d2 > 200 * 200) { e.gone = true; continue; }
      if (e.sp === "wanderer" && e.age > 300) { this.ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "poof"); e.gone = true; continue; }   // the Wanderer moves on
      if (!w.isLoaded(e.pos.x, e.pos.z)) continue;
      if (e.dead) { this.dying(e, dt); continue; }
      if (e.ridden) {   // a Trotter you're riding moves with you (main.js steers it)
        e.age += dt; e.walkPhase += Math.hypot(e.vel.x, e.vel.z) * dt * 1.5;
        if (e.iframes > 0) e.iframes -= dt; if (e.hurtT > 0) e.hurtT -= dt;
        this.animate(e, dt, d2, daylight); e.mesh.visible = true; continue;
      }
      e.age += dt;
      if (d2 < 48 * 48 || e.def.boss) {
        e.thinkT -= dt;
        if (e.thinkT <= 0) { e.thinkT = d2 < 24 * 24 ? 0.15 : 0.6; this.think(e, daylight); }
        this.physics(e, dt);
      }
      if (d2 < 64 * 64 || e.def.boss) this.animate(e, dt, d2, daylight);
      e.mesh.visible = d2 < 64 * 64 || !!e.def.boss;
    }
    this.sweep();
    this.updateProjectiles(dt);
  }

  physics(e, dt) {
    const w = this.world, def = e.def, ctx = this.ctx;
    if (def.static || def.noclip) {   // crystals and shellers stay put; the wyrm flies straight through anything
      if (e.iframes > 0) e.iframes -= dt; if (e.hurtT > 0) e.hurtT -= dt; if (e.attackCd > 0) e.attackCd -= dt;
      if (def.noclip) {
        if (e.goal) {
          const gx = e.goal.x - e.pos.x, gy = (e.goal.y ?? e.pos.y) - e.pos.y, gz = e.goal.z - e.pos.z, gl = Math.hypot(gx, gy, gz) || 1, sp = e.goal.speed || def.speed;
          e.vel.x += (gx / gl * sp - e.vel.x) * 0.04; e.vel.y += (gy / gl * sp - e.vel.y) * 0.04; e.vel.z += (gz / gl * sp - e.vel.z) * 0.04;
        } else { e.vel.x *= 0.95; e.vel.y *= 0.95; e.vel.z *= 0.95; }
        e.pos.x += e.vel.x * dt; e.pos.y += e.vel.y * dt; e.pos.z += e.vel.z * dt;
        const hs = Math.hypot(e.vel.x, e.vel.z);
        if (hs > 0.5 && !e.perched) e.yaw = turn(e.yaw, Math.atan2(-e.vel.x, -e.vel.z), dt * 3);
        e.walkPhase += dt * 2;
      }
      return;
    }
    e.inWater = liquidAt(w, e.pos.x, e.pos.y + 0.3, e.pos.z) === "water";
    e.inLava = liquidAt(w, e.pos.x, e.pos.y + 0.3, e.pos.z) === "lava";
    // steering toward the current goal
    let speed = 0, mx = 0, mz = 0;
    if (e.goal && !e.frozen) {
      const gx = e.goal.x - e.pos.x, gz = e.goal.z - e.pos.z, gl = Math.hypot(gx, gz);
      if (gl > 0.25) { mx = gx / gl; mz = gz / gl; speed = e.goal.speed || def.speed; e.yaw = turn(e.yaw, Math.atan2(-mx, -mz), dt * 8); }
      else if (e.path && e.path.length) { e.path.shift(); if (e.path.length) e.goal = { ...e.path[0], speed: e.goal.speed }; else e.goal = null; }
      else e.goal = null;
    }
    if (e.baby) speed *= 1.1;
    if (e.inWater || e.inLava) speed *= 0.5;
    const hopper = def.hops || e.def.ai === "slime";
    if (hopper && !e.onGround && !e.inWater) speed *= 1.2;
    if (hopper && e.onGround) speed = 0;   // slimes and rabbits only move while in the air
    const grip = e.onGround ? 0.3 : 0.08;
    if (!e.knock || e.knock <= 0) { e.vel.x += (mx * speed - e.vel.x) * grip; e.vel.z += (mz * speed - e.vel.z) * grip; }
    else e.knock -= dt;
    if (def.flies) {   // flyers steer up and down toward their goal height
      const gy = e.goal && e.goal.y !== undefined ? e.goal.y : e.pos.y;
      e.vel.y += (Math.max(-2, Math.min(2, (gy - e.pos.y) * 1.2)) - e.vel.y) * 0.1;
      if (!e.goal) { e.vel.x *= 0.95; e.vel.z *= 0.95; }
    } else if (e.inWater || e.inLava) { e.vel.y = Math.max(e.vel.y - GRAV * 0.25 * dt, -2) * 0.95; if (e.def.ai !== "slime") e.vel.y = Math.min(e.vel.y + 18 * dt, 2.2); }
    else { e.vel.y -= GRAV * dt; if (def.flutters && e.vel.y < -2.5) e.vel.y = -2.5; if (e.vel.y < -40) e.vel.y = -40; }
    if (e.wantJump && e.onGround) { e.vel.y = hopper ? (e.def.ai === "slime" ? (def.hopHigh ? 8 : 6) + e.size : 6) : 8.2; e.wantJump = false; }
    // bodies push apart: creatures can't stand inside the player or each other
    const pl = ctx.player(), px = e.pos.x - pl.pos.x, pz = e.pos.z - pl.pos.z, pmin = e.w / 2 + 0.32;
    if (Math.abs(e.pos.y - pl.pos.y) < Math.max(e.h, 1.8) && px * px + pz * pz < pmin * pmin) {
      const l = Math.hypot(px, pz) || 0.01, nx = e.pos.x + px / l * (pmin - l), nz = e.pos.z + pz / l * (pmin - l);
      const a = e.aabb(nx, e.pos.y, nz);
      if (!boxesNear(this.world, a).some(b => overlaps(a, b))) { e.pos.x = nx; e.pos.z = nz; }
      e.vel.x = px / l; e.vel.z = pz / l;
    }
    for (const o of this.list) {
      if (o === e || o.dead) continue;
      const ox = e.pos.x - o.pos.x, oz = e.pos.z - o.pos.z, omin = (e.w + o.w) / 2;
      if (Math.abs(ox) < omin && Math.abs(oz) < omin && Math.abs(e.pos.y - o.pos.y) < 1.5) { const l = Math.hypot(ox, oz) || 0.01; if (l < omin) { e.vel.x += ox / l * 12 * dt; e.vel.z += oz / l * 12 * dt; } }
    }
    const airTop = e.onGround ? e.pos.y : Math.max(e.airTop ?? e.pos.y, e.pos.y);
    const bumped = moveBody(w, e, dt);
    if (bumped && (mx || mz) && def.villager) this.openDoorAhead(e, mx, mz);
    if (bumped && (mx || mz)) {
      if (def.climbs) e.vel.y = 3;                    // skitters climb walls
      else if (e.onGround) e.wantJump = true;          // everyone else hops up one block
    }
    if (e.onGround) { const fall = airTop - e.pos.y; if (fall > 3.5 && !def.flutters && e.def.ai !== "slime") this.damage(e, Math.floor(fall - 3), null); e.airTop = null; }
    else e.airTop = airTop;
    // stuck checks and hazards
    e.walkPhase += Math.hypot(e.vel.x, e.vel.z) * dt * 3;
    if (def.fireproof) e.burning = 0;
    else {
      if (e.inLava) { e.burning = 5; if ((e.lavaT = (e.lavaT || 0) - dt) <= 0) { e.lavaT = 0.5; this.damage(e, 4, null); } }
      if (e.burning > 0) { e.burning -= dt; if (e.inWater) e.burning = 0; if ((e.burnT -= dt) <= 0) { e.burnT = 1; this.damage(e, 1, null); } }
    }
    if (e.barterT > 0 && (e.barterT -= dt) <= 0) this.barter(e);
    if (e.pos.y < -10) e.gone = true;
    if (e.iframes > 0) e.iframes -= dt;
    if (e.hurtT > 0) e.hurtT -= dt;
    if (e.attackCd > 0) e.attackCd -= dt;
    // animals grow up, get hungry for love, lay eggs
    if (e.baby && (e.growT -= dt) <= 0) e.baby = false;
    if (e.breedCd > 0) e.breedCd -= dt;
    if (e.love > 0) e.love -= dt;
    if (e.sp === "chicken" && !e.baby && (e.eggT -= dt) <= 0) { e.eggT = rand(300, 600); ctx.drop(I.EGG, 1, e.pos.x, e.pos.y + 0.3, e.pos.z); Sound.mob("cluck", this.dist(e)); }
  }

  dist(e) { const p = this.ctx.player(); return Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y, e.pos.z - p.pos.z); }
  canSeePlayer(e) { const p = this.ctx.player(); return lineOfSight(this.world, { x: e.pos.x, y: e.eyeY, z: e.pos.z }, { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }); }
  targetable() { const ctx = this.ctx; return !ctx.creative() && ctx.alive() && ctx.settings().difficulty !== "peaceful"; }

  // ----- decisions (a few times per second) -----
  think(e, daylight) {
    const ctx = this.ctx, p = ctx.player(), w = this.world, def = e.def, d = this.dist(e);
    const dmgMul = { peaceful: 0, easy: 0.67, normal: 1, hard: 1.5 }[ctx.settings().difficulty] ?? 1;
    // undead burn in sunlight
    if (def.burns && daylight > 0.75 && !e.inWater) {
      const L = w.lightAt(Math.floor(e.pos.x), Math.floor(e.eyeY), Math.floor(e.pos.z));
      if (L && L[0] >= 15) e.burning = Math.max(e.burning || 0, 3);
    }
    if (def.hostile && def.hostile && ctx.settings().difficulty === "peaceful") { e.gone = true; return; }
    if (def.pet && e.tame) return this.thinkPet(e, d, dmgMul);
    if (def.ai === "scout" && !(e.angry > 0)) { this.wander(e); return; }   // wild Scouts leave you alone unless you hit one
    if (def.animal) return this.thinkAnimal(e, d);
    if (e.sp === "voidwalker") return this.thinkVoidwalker(e, d, dmgMul);
    if (def.ai === "flare" || def.ai === "wailer") return this.thinkFlyer(e, d, dmgMul);
    if (def.ai === "crystal") return;
    if (def.ai === "sheller") return this.thinkSheller(e, d, dmgMul);
    if (def.ai === "dragon") return this.thinkDragon(e, d, dmgMul);
    if (def.ai === "villager") return this.thinkVillager(e, d);
    if (def.ai === "golem") return this.thinkGolem(e, d, dmgMul);
    if (def.ai === "blightking") return this.thinkBlightking(e, d, dmgMul);
    if (def.ai === "rotboar" && !(e.angry > 0)) { this.wander(e); return; }
    if (def.ai === "boarkin" && !(e.angry > 0) && (ctx.wearingGold() || d > 12)) {
      if (ctx.heldId() === I.GOLD_INGOT && d < 8) { e.goal = d > 2.2 ? { x: p.pos.x, z: p.pos.z, speed: def.speed * 0.6 } : null; return; }   // admires your gold
      if (e.barterT > 0) { e.goal = null; return; }
      this.wander(e); return;
    }
    if (e.angry > 0) e.angry -= 0.15;
    const can = this.targetable();
    const sees = can && d < 24 && this.canSeePlayer(e);
    // skitters are calm in bright light unless provoked
    const calm = def.ai === "spider" && !e.angry && (() => { const L = w.lightAt(Math.floor(e.pos.x), Math.floor(e.pos.y), Math.floor(e.pos.z)); return L && L[0] * daylight > 11; })();
    const chasing = can && !calm && (sees || (d < 10 && Math.abs(p.pos.y - e.pos.y) < 6) || (e.target && d < 32));   // monsters also sense you up close
    e.target = chasing ? p : null;
    if (!chasing) { this.wander(e); if (e.fuse > 0) e.fuse = Math.max(0, e.fuse - 0.3); return; }
    const tp = p.pos;
    if (def.ai === "archer") {
      if (sees && d < 16) {
        // keep a comfortable distance and shoot
        const want = d < 6 ? -1 : d > 12 ? 1 : 0, ax = (tp.x - e.pos.x) / d, az = (tp.z - e.pos.z) / d;
        const side = Math.sin(e.age * 0.7) > 0 ? 1 : -1;
        e.goal = { x: e.pos.x + ax * want * 2 - az * side * 1.5, z: e.pos.z + az * want * 2 + ax * side * 1.5, speed: def.speed * 0.8 };
        e.path = null; e.yaw = Math.atan2(-(tp.x - e.pos.x), -(tp.z - e.pos.z));
        e.drawT += 0.15;
        if (e.drawT > 1.2 && e.attackCd <= 0) { this.shootArrow(e, p, dmgMul); e.attackCd = 1.6; e.drawT = 0; }
      } else this.chase(e, tp);
      return;
    }
    if (def.ai === "creeper") {
      // Hissers are afraid of tame Whiskers
      const cat = this.list.find(o => o.sp === "whisker" && o.tame && !o.dead && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 6);
      if (cat) { const ax = e.pos.x - cat.pos.x, az = e.pos.z - cat.pos.z, l = Math.hypot(ax, az) || 1; e.goal = { x: e.pos.x + ax / l * 5, z: e.pos.z + az / l * 5, speed: def.speed * 1.3 }; e.path = null; e.fuse = 0; return; }
      if (d < 2.8 && sees) { if (e.fuse === 0) Sound.mob("fuse", d); e.fuse += 0.15; e.goal = null; }
      else { e.fuse = Math.max(0, e.fuse - 0.15); this.chase(e, tp); }
      if (d > 6) e.fuse = 0;
      if (e.fuse >= 1.5) { e.gone = true; ctx.explode(e.pos.x, e.pos.y + 0.8, e.pos.z, 3, e); }
      return;
    }
    if (def.ai === "slime") {
      e.hopT -= 0.15;
      if (e.hopT <= 0 && e.onGround) { e.hopT = rand(0.6, 1.6); e.yaw = Math.atan2(-(tp.x - e.pos.x), -(tp.z - e.pos.z)); e.goal = { x: tp.x, z: tp.z, speed: 2.4 + e.size * 0.3 }; e.wantJump = true; Sound.mob("squish", d); }
      if (e.size > 1 && d < 0.6 + e.w && e.attackCd <= 0 && Math.abs(tp.y - e.pos.y) < 1.5) { ctx.hurtPlayer((e.size === 4 ? 4 : 2) * dmgMul, `A ${def.name} squished you!`, e); e.attackCd = 1; }
      return;
    }
    // melee (groaners, skitters)
    if (def.ai === "spider" && d < 4 && d > 1.5 && e.onGround && Math.random() < 0.3) {   // pounce
      e.vel.x = (tp.x - e.pos.x) / d * 6; e.vel.z = (tp.z - e.pos.z) / d * 6; e.vel.y = 5; e.knock = 0.3;
    }
    if (d < def.reach && Math.abs(tp.y - e.pos.y) < 1.6 && e.attackCd <= 0 && sees) {
      ctx.hurtPlayer(def.dmg * dmgMul, `A ${def.name} got you!`, e);
      if (def.poison && dmgMul > 0.7) ctx.effect("poison", dmgMul > 1 ? 15 : 7);
      if (def.blight) ctx.effect("blight", 8);
      e.attackCd = 1; e.swing = 0.35;
    }
    this.chase(e, tp);
  }
  chase(e, tp) {
    const d = Math.hypot(tp.x - e.pos.x, tp.z - e.pos.z);
    if (d < e.w / 2 + 0.6 && Math.abs(tp.y - e.pos.y) < 1.5) { e.goal = null; e.path = null; e.yaw = Math.atan2(-(tp.x - e.pos.x), -(tp.z - e.pos.z)); return; }   // close enough: stop and face
    const direct = Math.abs(tp.y - e.pos.y) < 1.2 && d < 6 && this.canSeePlayer(e);
    e.pathT -= 0.15;
    if (direct || e.def.climbs) { e.goal = { x: tp.x, z: tp.z, speed: e.def.speed }; e.path = null; return; }
    const edits = this.world.editCount || 0;
    if (!e.path || !e.path.length || e.pathT <= 0 || e.pathEdits !== edits) {
      e.pathT = 1.5; e.pathEdits = edits;
      e.path = findPath(this.world, Math.floor(e.pos.x), Math.floor(e.pos.y + 0.01), Math.floor(e.pos.z), Math.floor(tp.x), Math.floor(tp.y + 0.01), Math.floor(tp.z), Math.ceil(e.h));
      if (e.path.length) e.goal = { ...e.path[0], speed: e.def.speed };
      else e.goal = { x: tp.x, z: tp.z, speed: e.def.speed };
    }
  }
  // Flares hover nearby and throw fireballs; Wailers drift high and lob exploding ones
  thinkFlyer(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player(), def = e.def, w = this.world;
    const sees = this.targetable() && d < (def.ai === "wailer" ? 44 : 24) && this.canSeePlayer(e);
    if (!sees) {
      if (!e.goal || Math.random() < 0.03) {
        const a = Math.random() * Math.PI * 2, r = rand(3, def.ai === "wailer" ? 14 : 6);
        e.goal = { x: e.pos.x + Math.cos(a) * r, z: e.pos.z + Math.sin(a) * r, y: e.pos.y + rand(-2, 2), speed: def.speed * 0.6 };
      }
      return;
    }
    const tp = p.pos, ax = (tp.x - e.pos.x) / d, az = (tp.z - e.pos.z) / d;
    e.yaw = Math.atan2(-ax, -az);
    if (def.ai === "flare") {
      const want = d < 5 ? -1 : d > 9 ? 1 : 0;
      e.goal = { x: e.pos.x + ax * want * 2, z: e.pos.z + az * want * 2, y: tp.y + 2.5, speed: def.speed };
      if (e.attackCd <= 0) { e.attackCd = 3.5; e.volley = 3; }
      if (e.volley > 0 && (e.volleyT = (e.volleyT || 0) - 0.15) <= 0) { e.volley--; e.volleyT = 0.3; this.shootFire(e, p, "fireball", 12, { dmg: 5 * dmgMul }); }
    } else {
      e.goal = { x: e.pos.x - ax * (d < 16 ? 1 : 0), z: e.pos.z - az * (d < 16 ? 1 : 0), y: Math.max(tp.y + 6, Math.min(e.pos.y, tp.y + 14)), speed: def.speed };
      if (e.attackCd <= 0) { e.attackCd = 3; e.mouthT = 0.6; this.shootFire(e, p, "bigfire", 10, { power: 1.3 }); Sound.mob("wail", d); }
    }
  }
  shootFire(from, target, kind, speed, opts) {
    const sx = from.pos.x, sy = from.pos.y + from.h * 0.6, sz = from.pos.z;
    const dx = target.pos.x - sx, dy = target.pos.y + 1 - sy, dz = target.pos.z - sz, l = Math.hypot(dx, dy, dz) || 1;
    this.addProjectile(kind, sx + dx / l * from.w * 0.7, sy, sz + dz / l * from.w * 0.7, dx / l * speed, dy / l * speed, dz / l * speed, { owner: from, noGrav: true, ...opts });
    Sound.mob("fireshoot", this.dist(from));
  }
  // Shellers hide in their shells, peek out, and fire slow homing bullets that make you float
  thinkSheller(e, d, dmgMul) {
    const sees = this.targetable() && d < 16 && this.canSeePlayer(e);
    e.open = sees ? Math.min(1, e.open + 0.3) : Math.max(0, e.open - 0.1);
    if (sees && e.attackCd <= 0 && e.open >= 1) {
      e.attackCd = rand(2, 4);
      const p = this.ctx.player();
      this.addProjectile("bullet", e.pos.x, e.pos.y + 0.6, e.pos.z, 0, 4, 0, { owner: e, noGrav: true, dmg: 4 * dmgMul, homing: p });
      Sound.mob("shell", d);
    }
  }
  // The Hollow Wyrm: circles the pillars, swoops to breathe, charges, and lands on the center to rest
  thinkDragon(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player(), groundY = ctx.endTop();
    const crystals = this.list.filter(o => o.sp === "crystal" && !o.dead);
    // crystals heal the wyrm while it's close to them
    const near = crystals.map(c => ({ c, d: Math.hypot(c.pos.x - e.pos.x, c.pos.y - e.pos.y, c.pos.z - e.pos.z) })).filter(o => o.d < 48).sort((a, b) => a.d - b.d)[0];
    e.healFrom = near && e.hp < e.maxHp ? near.c : null;
    if (e.healFrom) e.hp = Math.min(e.maxHp, e.hp + 0.25);
    e.phaseT -= 0.15;
    if (Math.random() < 0.01) Sound.mob("roar", d);
    const toCircle = () => { e.phase = "circle"; e.phaseT = rand(4, 7); e.perched = false; e.shot = false; e.windT = 0; };
    const can = this.targetable();
    switch (e.phase) {
      case "circle": {
        e.ang += 0.15 * 0.3;
        e.goal = { x: Math.cos(e.ang) * 40, z: Math.sin(e.ang) * 40, y: groundY + 16 + Math.sin(e.ang * 3) * 4, speed: 11 };
        if (e.phaseT <= 0 && can) {
          const r = Math.random(), perch = (crystals.length === 0 ? 0.35 : 0.12) + (e.hp < 100 ? 0.1 : 0);
          if (r < perch) { e.phase = "perch"; e.phaseT = 20; }
          else if (r < perch + 0.3) { e.phase = "charge"; e.phaseT = 8; e.windT = 1.2; Sound.mob("roar", d); }
          else { e.phase = "strafe"; e.phaseT = 9; e.shot = false; }
        } else if (e.phaseT <= 0) e.phaseT = 5;
        break;
      }
      case "strafe": {   // swoop toward the player and spit a ball of void breath
        e.goal = { x: p.pos.x, z: p.pos.z, y: p.pos.y + 10, speed: 13 };
        if (!e.shot && d < 30 && this.lineToPlayer(e)) { e.shot = true; e.mouthT = 0.8; this.shootFire(e, p, "breath", 12, {}); Sound.mob("roar", d); }
        if ((e.shot && d < 12) || e.phaseT <= 0) toCircle();
        break;
      }
      case "charge": {   // a readable wind-up (hover, roar, flap), then a dive straight at you
        if (e.windT > 0) { e.windT -= 0.15; e.goal = null; e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z)); e.flapFast = true; break; }
        e.flapFast = false;
        e.goal = { x: p.pos.x, z: p.pos.z, y: p.pos.y + 1, speed: 17 };
        if (d < 4.5 && e.attackCd <= 0) { ctx.hurtPlayer(e.def.dmg * dmgMul, "The Hollow Wyrm slammed into you!", e); e.attackCd = 2; toCircle(); }
        if (e.phaseT <= 0) toCircle();
        break;
      }
      case "perch": {   // land on the middle of the island, breathe on anyone nearby, then fly off
        const px = 0, py = groundY + 1.5, pz = 0;
        if (!e.perched) {
          const dist = Math.hypot(e.pos.x - px, e.pos.y - py, e.pos.z - pz);
          e.goal = { x: px, z: pz, y: py, speed: Math.max(2, Math.min(9, dist * 0.8)) };   // slow down while coming in to land
          if (dist < 3.5) { e.perched = true; e.phaseT = 10; e.goal = null; e.vel.x = e.vel.y = e.vel.z = 0; e.pos.x = px; e.pos.y = py; e.pos.z = pz; }
          else if (e.phaseT <= 0) toCircle();
        } else {
          e.yaw = turn(e.yaw, Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z)), 0.3);
          if (d < 16 && e.attackCd <= 0 && can) { e.attackCd = 3; e.mouthT = 0.8; ctx.cloud(p.pos.x, p.pos.y, p.pos.z); Sound.mob("roar", d); }
          if (e.phaseT <= 0) { e.perched = false; e.phase = "takeoff"; e.phaseT = 4; }
        }
        break;
      }
      case "takeoff": e.goal = { x: e.pos.x + 10, z: e.pos.z, y: groundY + 20, speed: 9 }; if (e.phaseT <= 0) toCircle(); break;
    }
  }
  // Walk to a spot: straight there when it's close and clear, otherwise find a path (through doors for villagers)
  moveTo(e, t, speed, stop = 1.2) {
    const dd = Math.hypot(t.x - e.pos.x, t.z - e.pos.z);
    if (dd < stop && Math.abs(t.y - e.pos.y) < 2) { e.goal = null; e.path = null; return true; }
    if (dd < 6 && Math.abs(t.y - e.pos.y) < 1.2 && lineOfSight(this.world, { x: e.pos.x, y: e.pos.y + 1, z: e.pos.z }, { x: t.x, y: t.y + 1, z: t.z })) { e.goal = { x: t.x, z: t.z, speed }; e.path = null; return false; }
    e.pathT -= 0.15;
    if (!e.path || !e.path.length || e.pathT <= 0 || e.pathEdits !== this.world.editCount) {
      e.pathT = 2; e.pathEdits = this.world.editCount;
      e.path = findPath(this.world, Math.floor(e.pos.x), Math.floor(e.pos.y + 0.01), Math.floor(e.pos.z), Math.floor(t.x), Math.floor(t.y + 0.01), Math.floor(t.z), Math.ceil(e.h), 350, !!e.def.villager);
      e.goal = e.path.length ? { ...e.path[0], speed } : { x: t.x, z: t.z, speed };
    } else if (e.goal) e.goal.speed = speed;
    return false;
  }
  openDoorAhead(e, mx, mz) {
    const w = this.world, x = Math.floor(e.pos.x + mx * 0.7), y = Math.floor(e.pos.y + 0.1), z = Math.floor(e.pos.z + mz * 0.7);
    for (const yy of [y, y + 1]) { const v = w.get(x, yy, z); if (idOf(v) === B.DOOR && !(metaOf(v) & OPEN)) { w.set(x, yy, z, make(B.DOOR, metaOf(v) | OPEN)); Sound.door(true); } }
  }
  // Villagers: work at their job site during the day, go home at night, run from monsters
  thinkVillager(e, d) {
    const ctx = this.ctx, time = ctx.time(), night = time > 0.52 && time < 0.97;
    const home = e.home ? { x: e.home[0], y: e.home[1], z: e.home[2] } : null;
    if (e.trading > 0) { e.trading -= 0.15; e.goal = null; const p = ctx.player(); e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z)); return; }
    const danger = this.list.find(o => o.def.hostile && !o.dead && !o.def.boss && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 8);
    if (danger || e.fleeT > 0) {
      if (e.fleeT > 0) e.fleeT -= 0.15;
      const from = danger ? danger.pos : ctx.player().pos, ax = e.pos.x - from.x, az = e.pos.z - from.z, l = Math.hypot(ax, az) || 1;
      if (night && home) this.moveTo(e, home, e.def.speed * 1.5); else e.goal = { x: e.pos.x + ax / l * 5, z: e.pos.z + az / l * 5, speed: e.def.speed * 1.5 };
      return;
    }
    if (Math.random() < 0.01) Sound.mob("hmm", d);
    if (night && home) { this.moveTo(e, home, e.def.speed); return; }
    e.taskT -= 0.15;
    if (e.taskT <= 0) { e.taskT = rand(8, 18); e.task = e.job && Math.random() < 0.55 ? "work" : "wander"; }
    if (e.task === "work" && e.job) {
      const j = { x: e.job[0] + 0.5, y: e.job[1], z: e.job[2] + 0.5 };
      if (this.moveTo(e, j, e.def.speed, 1.9)) {
        // working at the job site restocks trades (up to twice a day)
        const day = ctx.day();
        if (e.restockDay !== day) { e.restockDay = day; e.restocks = 0; }
        e.restockT += 0.15;
        if (e.restockT > 20 && e.restocks < 2 && e.uses.some(u => u > 0)) { e.uses = e.uses.map(() => 0); e.restocks++; e.restockT = 0; ctx.particles(e.pos.x, e.pos.y + 2, e.pos.z, "xp"); }
      }
      return;
    }
    if (home && Math.hypot(home.x - e.pos.x, home.z - e.pos.z) > 14) { this.moveTo(e, home, e.def.speed); return; }
    this.wander(e);
  }
  // The Ironwarden guards its village: it fights monsters, and anyone who hurts villagers
  thinkGolem(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player();
    let target = null;
    if (e.angry > 0 && this.targetable()) { e.angry -= 0.15; target = { pos: p.pos, isPlayer: true }; }
    else {
      const foe = this.list.filter(o => o.def.hostile && !o.dead && !o.def.boss && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 16).sort((a, b) => Math.hypot(a.pos.x - e.pos.x, a.pos.z - e.pos.z) - Math.hypot(b.pos.x - e.pos.x, b.pos.z - e.pos.z))[0];
      if (foe) target = { pos: foe.pos, ent: foe };
    }
    if (target) {
      const dd = Math.hypot(target.pos.x - e.pos.x, target.pos.z - e.pos.z);
      this.moveTo(e, target.pos, e.def.speed * 1.3, 1.6);
      e.yaw = Math.atan2(-(target.pos.x - e.pos.x), -(target.pos.z - e.pos.z));
      if (dd < 2.6 && Math.abs(target.pos.y - e.pos.y) < 2 && e.attackCd <= 0) {
        e.attackCd = 1.5; e.swing = 0.5;
        if (target.isPlayer) ctx.hurtPlayer(e.def.dmg * dmgMul, "The Ironwarden protects its village!", e);
        else { const l = dd || 1; this.damage(target.ent, 15, e, { x: (target.pos.x - e.pos.x) / l, z: (target.pos.z - e.pos.z) / l }); target.ent.vel.y = 8; }
        Sound.mob("clank", d);
      }
      return;
    }
    const home = e.home ? { x: e.home[0], y: e.home[1], z: e.home[2] } : null;
    if (home && Math.hypot(home.x - e.pos.x, home.z - e.pos.z) > 16) { this.moveTo(e, home, e.def.speed * 0.6); return; }
    this.wander(e);
  }
  // The Blightking: a long, glowing summoning, then skull volleys; at half health it gets armor and dives at you
  thinkBlightking(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player();
    if (e.summonT > 0) {
      e.summonT -= 0.15; e.goal = null; e.vel.x = e.vel.y = e.vel.z = 0;
      e.hp = Math.max(1, e.maxHp * (1 - e.summonT / 10));
      if (e.summonT <= 0) { e.hp = e.maxHp; ctx.explode(e.pos.x, e.pos.y + 1.5, e.pos.z, 6, null); Sound.mob("roar", 0); }
      return;
    }
    e.armored = e.hp < e.maxHp / 2;
    if (e.hp < e.maxHp && Math.random() < 0.15) e.hp += 0.5;   // it slowly heals itself
    if (!this.targetable() || d > 64) { e.goal = null; return; }
    if (e.diveT > 0) {   // armored dive
      e.diveT -= 0.15;
      e.goal = { x: p.pos.x, z: p.pos.z, y: p.pos.y + 0.5, speed: 11 };
      if (d < 2.8 && e.attackCd <= 0) { e.attackCd = 1.5; ctx.hurtPlayer(e.def.dmg * dmgMul, "The Blightking crashed into you!", e); ctx.effect("blight", 10); e.diveT = 0; }
      return;
    }
    e.ang = (e.ang || 0) + 0.15 * 0.5;
    e.goal = { x: p.pos.x + Math.cos(e.ang) * 9, z: p.pos.z + Math.sin(e.ang) * 9, y: p.pos.y + 5, speed: e.def.speed };
    e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z));
    if (e.attackCd <= 0) {
      e.attackCd = e.armored ? 0.9 : 1.3;
      const side = [-1, 0, 1][randi(0, 2)] * 0.6, sx = e.pos.x + Math.cos(e.yaw) * side, sz = e.pos.z - Math.sin(e.yaw) * side, sy = e.pos.y + 3;
      const dx = p.pos.x - sx, dy = p.pos.y + 1 - sy, dz = p.pos.z - sz, l = Math.hypot(dx, dy, dz) || 1;
      this.addProjectile("skull", sx, sy, sz, dx / l * 11, dy / l * 11, dz / l * 11, { owner: e, noGrav: true, dmg: 6 * dmgMul });
      Sound.mob("fireshoot", d);
    }
    if (e.armored && (e.diveCd = (e.diveCd || 6) - 0.15) <= 0) { e.diveCd = 7; e.diveT = 2; Sound.mob("roar", d); }
  }
  lineToPlayer(e) { const p = this.ctx.player(); return lineOfSight(this.world, { x: e.pos.x, y: e.pos.y + 1.5, z: e.pos.z }, { x: p.pos.x, y: p.pos.y + 1.5, z: p.pos.z }); }
  // Boarkin trade: give one gold ingot, get something useful back after they look it over
  barter(e) {
    const pool = [[B.OBSIDIAN, 1, 1, 9], [I.FLINT_STEEL, 1, 1, 4], [I.VOID_PEARL, 2, 4, 6], [I.STRING, 3, 9, 12], [I.QUARTZ, 5, 12, 10], [I.LEATHER, 2, 4, 8],
      [B.SOUL_SAND, 2, 8, 8], [B.BLACKSTONE, 8, 16, 8], [I.IRON_INGOT, 1, 3, 9], [I.MAGMA_CREAM, 1, 3, 6], [B.GRAVEL, 8, 16, 6], [I.ARROW, 6, 12, 6], [I.WART, 2, 5, 6]];
    let t = Math.random() * pool.reduce((s, q) => s + q[3], 0);
    for (const [id, a, b, wgt] of pool) { t -= wgt; if (t <= 0) { this.ctx.drop(id, randi(a, b), e.pos.x, e.pos.y + 1, e.pos.z); break; } }
    Sound.mob("snort", this.dist(e));
  }
  wander(e) {
    if (e.goal && Math.random() > 0.05) return;
    if (Math.random() < 0.08) {
      const a = Math.random() * Math.PI * 2, r = rand(2, 7), x = e.pos.x + Math.cos(a) * r, z = e.pos.z + Math.sin(a) * r;
      const gy = this.world.surfaceY(Math.floor(x), Math.floor(z));
      if (Math.abs(gy + 1 - e.pos.y) < 3 || e.def.hostile) e.goal = { x, z, speed: e.def.speed * 0.5 };
      if (e.def.hops) e.wantJump = true;
    }
    if (e.def.hops && e.goal && e.onGround && Math.random() < 0.4) e.wantJump = true;
  }
  // Tame pets: follow you (or sit and stay); Scouts also fight monsters near you and whatever you attack
  thinkPet(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player(), def = e.def;
    if (Math.random() < 0.008) Sound.mob(def.sound, d);
    if (e.sitting) { e.goal = null; e.path = null; return; }
    if (e.sp === "scout") {
      let foe = this.petFoe;
      if (foe && (foe.dead || foe.gone || foe.tame || !this.list.includes(foe) || Math.hypot(foe.pos.x - e.pos.x, foe.pos.z - e.pos.z) > 20)) foe = this.petFoe = null;
      if (!foe) foe = this.list.filter(o => o.def.hostile && !o.dead && !o.def.boss && o.def.ai !== "creeper" && Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z) < 10 && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 16)
        .sort((a, b) => Math.hypot(a.pos.x - e.pos.x, a.pos.z - e.pos.z) - Math.hypot(b.pos.x - e.pos.x, b.pos.z - e.pos.z))[0];
      if (foe) {
        const dd = Math.hypot(foe.pos.x - e.pos.x, foe.pos.z - e.pos.z);
        this.moveTo(e, foe.pos, def.speed * 1.5, 0.9);
        e.yaw = Math.atan2(-(foe.pos.x - e.pos.x), -(foe.pos.z - e.pos.z));
        if (dd < 1.4 + foe.w / 2 && Math.abs(foe.pos.y - e.pos.y) < 1.5 && e.attackCd <= 0) {
          e.attackCd = 0.8; const l = dd || 1;
          this.damage(foe, 4, e, { x: (foe.pos.x - e.pos.x) / l * 0.6, z: (foe.pos.z - e.pos.z) / l * 0.6 });
          Sound.mob("bark", d);
        }
        return;
      }
    }
    if (d > 24) this.petTeleport(e, p);
    else if (d > 5) this.moveTo(e, p.pos, def.speed * (d > 10 ? 1.7 : 1.2), 2.5);
    else { e.goal = null; e.path = null; }
  }
  // a pet that falls far behind pops back next to you
  petTeleport(e, p) {
    const w = this.world;
    for (let k = 0; k < 20; k++) {
      const x = Math.floor(p.pos.x + rand(-3, 3)), z = Math.floor(p.pos.z + rand(-3, 3));
      if (!w.isLoaded(x, z)) continue;
      for (let y = Math.floor(p.pos.y) + 2; y >= Math.floor(p.pos.y) - 3; y--) {
        const here = w.id(x, y, z);
        if (SOLID[w.id(x, y - 1, z)] && !solidCell(w, x, y, z) && !solidCell(w, x, y + 1, z) && here !== B.LAVA && here !== B.WATER) {
          e.pos.x = x + 0.5; e.pos.y = y; e.pos.z = z + 0.5; e.vel.x = e.vel.y = e.vel.z = 0; e.path = null; e.goal = null;
          return true;
        }
      }
    }
    return false;
  }
  thinkAnimal(e, d) {
    const ctx = this.ctx, p = ctx.player(), def = e.def;
    if (Math.random() < 0.02) Sound.mob(def.sound, d);
    if (e.fleeT > 0) { e.fleeT -= 0.15; const ax = e.pos.x - p.pos.x, az = e.pos.z - p.pos.z, l = Math.hypot(ax, az) || 1; e.goal = { x: e.pos.x + ax / l * 4, z: e.pos.z + az / l * 4, speed: def.speed * 1.8 }; if (def.hops) e.wantJump = true; return; }
    // looking for a partner
    if (e.love > 0 && !e.baby) {
      const mate = this.list.find(o => o !== e && o.sp === e.sp && o.love > 0 && !o.baby && !o.dead && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 8);
      if (mate) {
        const md = Math.hypot(mate.pos.x - e.pos.x, mate.pos.z - e.pos.z);
        e.goal = { x: mate.pos.x, z: mate.pos.z, speed: def.speed };
        if (md < 1.6) {
          e.love = mate.love = 0; e.breedCd = mate.breedCd = 300;
          this.add(e.sp, (e.pos.x + mate.pos.x) / 2, e.pos.y + 0.2, (e.pos.z + mate.pos.z) / 2, { baby: true });
          ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); ctx.xp(randi(1, 7), e.pos.x, e.pos.y + 0.5, e.pos.z);
          Sound.mob(def.sound, d);
        }
        return;
      }
    }
    // following someone holding food
    const held = ctx.heldId();
    if (def.food.includes(held) && d < 8 && d > 2) { e.goal = { x: p.pos.x, z: p.pos.z, speed: def.speed * 1.1 }; if (def.hops) e.wantJump = true; return; }
    if (def.skittish && d < 4 && !def.food.includes(held) && !ctx.creative()) { e.fleeT = 1; return; }
    // sheep nibble grass and regrow wool
    if (e.sp === "sheep" && e.sheared && Math.random() < 0.004) {
      const x = Math.floor(e.pos.x), y = Math.floor(e.pos.y) - 1, z = Math.floor(e.pos.z);
      if (this.world.id(x, y, z) === B.GRASS) { this.world.set(x, y, z, B.DIRT); e.sheared = false; e.grazeT = 1; }
    }
    // babies stay near a grown-up
    if (e.baby && Math.random() < 0.1) { const parent = this.list.find(o => o.sp === e.sp && !o.baby && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 10); if (parent && Math.hypot(parent.pos.x - e.pos.x, parent.pos.z - e.pos.z) > 3) { e.goal = { x: parent.pos.x, z: parent.pos.z, speed: def.speed }; return; } }
    this.wander(e);
  }
  thinkVoidwalker(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player();
    if (e.inWater && Math.random() < 0.5) { this.damage(e, 1, null); this.teleport(e); return; }
    // looking straight at its face makes it angry
    if (!e.angry && this.targetable() && d < 40) {
      const look = ctx.lookDir(), ex = e.pos.x - p.pos.x, ey = e.eyeY - (p.pos.y + p.eye), ez = e.pos.z - p.pos.z, l = Math.hypot(ex, ey, ez);
      const dot = (look.x * ex + look.y * ey + look.z * ez) / l;
      if (dot > 1 - 0.025 / Math.max(1, l / 8) && this.canSeePlayer(e)) { e.angry = 30; Sound.mob("scream", d); }
    }
    if (e.angry > 0 && this.targetable()) {
      e.angry -= 0.15;
      if (d > 14 && Math.random() < 0.1) this.teleport(e, p.pos);
      if (d < e.def.reach && e.attackCd <= 0) { ctx.hurtPlayer(e.def.dmg * dmgMul, "A Voidwalker got you! (Don't stare at them.)", e); e.attackCd = 1.2; }
      this.chase(e, p.pos); return;
    }
    if (Math.random() < 0.004) this.teleport(e);
    this.wander(e);
  }
  // Jump to a safe random spot (never inside blocks or water)
  teleport(e, near = null) {
    const w = this.world, cx = near ? near.x : e.pos.x, cz = near ? near.z : e.pos.z;
    for (let k = 0; k < 16; k++) {
      const x = Math.floor(cx + rand(-12, 12)), z = Math.floor(cz + rand(-12, 12));
      if (!w.isLoaded(x, z)) continue;
      const y = w.surfaceY(x, z) + 1;
      if (!SOLID[w.id(x, y - 1, z)] || liquidAt(w, x + 0.5, y - 0.5, z + 0.5)) continue;
      if (solidCell(w, x, y, z) || solidCell(w, x, y + 1, z) || solidCell(w, x, y + 2, z)) continue;
      this.ctx.particles(e.pos.x, e.pos.y + 1.5, e.pos.z, "void");
      e.pos.x = x + 0.5; e.pos.y = y; e.pos.z = z + 0.5; e.vel.x = e.vel.y = e.vel.z = 0; e.path = null; e.goal = null;
      this.ctx.particles(e.pos.x, e.pos.y + 1.5, e.pos.z, "void"); Sound.mob("teleport", this.dist(e));
      return true;
    }
    return false;
  }

  // ----- getting hurt and dying -----
  damage(e, n, attacker, knock = null) {
    if (e.dead || e.iframes > 0 || n <= 0) return false;
    if (e.tame && attacker === "player") return false;   // you can't hurt your own pets by accident
    if (attacker === "player" && !e.def.villager) this.petFoe = e;   // your Scouts join in
    if (e.summonT > 0) return false;   // can't be hurt while it's being summoned
    if (e.sp === "dragon") { n *= e.perched ? 1 : 0.6; knock = null; if (attacker === "explosion") n *= 0.3; }
    if (e.sp === "blightking") { knock = null; if (attacker === "explosion") n *= 0.2; }
    if (attacker === "player" && e.def.villager) for (const g of this.near(e.pos.x, e.pos.y, e.pos.z, 24, o => o.sp === "golem")) g.angry = 30;   // hurting villagers angers the Ironwarden
    if (e.def.villager) e.fleeT = 4;
    if (attacker === "player" && e.sp === "golem") e.angry = 30;
    if (e.sp === "sheller" && e.open < 1) n *= 0.25;   // the shell protects it when closed
    if (e.def.static) knock = null;
    if (e.sp === "voidwalker" && attacker && attacker.projectile) { this.teleport(e); return false; }   // dodges arrows
    e.hp -= n; e.hurtT = 0.3; e.iframes = 0.5;
    if (knock) { e.vel.x = knock.x * 7; e.vel.z = knock.z * 7; e.vel.y = 4.5; e.knock = 0.25; }
    if (attacker === "player") {
      e.angry = 40; if (e.def.animal) e.fleeT = 5;
      // Rotboars and Boarkin defend each other
      if (e.def.ai === "rotboar" || e.def.ai === "boarkin" || e.sp === "brute" || e.sp === "scout") for (const o of this.near(e.pos.x, e.pos.y, e.pos.z, 20, o => o.sp === e.sp && !o.tame)) o.angry = 40;
    }
    Sound.mob(e.def.animal ? e.def.sound : "hurt", this.dist(e));
    if (e.sp === "voidwalker" && attacker === "player" && Math.random() < 0.3) this.teleport(e, this.ctx.player().pos);
    if (e.hp <= 0) this.kill(e, attacker);
    return true;
  }
  kill(e, attacker) {
    e.dead = e.def.boss ? 4 : 0.6; e.goal = null; e.path = null;
    const ctx = this.ctx;
    if (e.sp === "crystal") { e.gone = true; ctx.crystalGone(e.cid); ctx.explode(e.pos.x, e.pos.y + 1, e.pos.z, 3, null); return; }
    if (e.def.boss) { Sound.mob("roar", 0); return; }
    if (attacker === "player" || e.burning || attacker === "explosion" || (attacker && attacker.tame)) {
      for (const d of e.def.drops(e)) if (d && d[1] > 0) ctx.drop(d[0], d[1], e.pos.x, e.pos.y + 0.4, e.pos.z);
      if (!e.baby) ctx.xp(e.def.xp * (e.def.ai === "slime" ? e.size : 1), e.pos.x, e.pos.y + 0.4, e.pos.z);
    }
    if (e.def.ai === "slime" && e.size > 1) {   // big gloops split
      const n = randi(2, 4);
      for (let i = 0; i < n; i++) this.add(e.sp, e.pos.x + rand(-0.5, 0.5), e.pos.y + 0.3, e.pos.z + rand(-0.5, 0.5), { size: e.size / 2 });
    }
  }
  dying(e, dt) {
    if (e.def.boss) {   // the wyrm rises, shudders, and bursts into light
      e.dead -= dt; e.pos.y += dt * 2; e.root.rotation.z = Math.sin(e.dead * 20) * 0.08;
      e.mat.color.setRGB(1, 0.7 + Math.sin(e.dead * 30) * 0.3, 1);
      if (Math.random() < 0.6) this.ctx.particles(e.pos.x + rand(-4, 4), e.pos.y + rand(0, 3), e.pos.z + rand(-4, 4), "void");
      if (e.dead <= 0) { e.gone = true; this.ctx.bossDefeated(e); }
      e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
      return;
    }
    e.dead -= dt;
    e.root.rotation.z = Math.min(Math.PI / 2, (0.6 - e.dead) * 4);
    e.mat.color.setRGB(1, 0.4, 0.4);
    if (e.dead <= 0) { e.gone = true; this.ctx.particles(e.pos.x, e.pos.y + e.h / 2, e.pos.z, "poof"); }
  }

  // ----- interacting (right-click) -----
  interact(e, slot) {
    const ctx = this.ctx, def = e.def, id = slot ? slot.id : 0;
    if (def.tameWith) {   // pets and Trotters
      const hearts = () => { for (let k = 0; k < 3; k++) ctx.particles(e.pos.x + rand(-0.4, 0.4), e.pos.y + e.h + rand(0, 0.4), e.pos.z + rand(-0.4, 0.4), "heart"); };
      if (!e.tame && def.tameWith.includes(id)) {
        ctx.consume();
        if (def.mount) {   // treats calm a wild Trotter, so riding tames it sooner
          e.temper = Math.min(100, (e.temper || 0) + 15); e.hp = Math.min(e.maxHp, e.hp + 2); hearts(); Sound.mob(def.sound, 2);
          ctx.toast("The Trotter liked that! It's calmer now, so it will be easier to tame by riding it.");
          return true;
        }
        if (Math.random() < def.tameChance) {
          e.tame = true; e.angry = 0; e.fleeT = 0; e.sitting = false; e.hp = e.maxHp; e.goal = null; hearts(); Sound.mob(def.sound, 2);
          ctx.toast(`You tamed a ${def.name}! It will follow you. Right-click it to make it sit or follow.`, "good");
        } else ctx.particles(e.pos.x, e.pos.y + e.h, e.pos.z, "poof");
        return true;
      }
      if (e.tame && (def.healWith || def.tameWith).includes(id) && e.hp < e.maxHp) { e.hp = Math.min(e.maxHp, e.hp + 4); ctx.consume(); hearts(); return true; }
      if (def.mount) {
        if (id === I.SADDLE && e.tame && !e.saddled && !e.baby) { e.saddled = true; ctx.consume(); Sound.mob(def.sound, 2); ctx.toast("Saddled! Right-click it to ride. Press C to get off.", "good"); return true; }
        if (!e.baby && !def.food.includes(id)) return ctx.mount(e);
      } else if (e.tame && !e.baby) {
        e.sitting = !e.sitting; e.goal = null; e.path = null;
        ctx.toast(e.sitting ? `Your ${def.name} is sitting. It will stay here.` : `Your ${def.name} is following you.`);
        return true;
      }
    }
    if (def.animal && def.food.includes(id)) {
      if (e.baby) { e.growT -= 60; ctx.consume(); ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); return true; }
      if (e.breedCd <= 0 && e.love <= 0) { e.love = 30; ctx.consume(); ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); Sound.mob(def.sound, 2); return true; }
      return false;
    }
    if (e.sp === "sheep" && id === I.SHEARS && !e.sheared && !e.baby) { e.sheared = true; ctx.drop(B.WOOL, randi(1, 3), e.pos.x, e.pos.y + 1, e.pos.z); ctx.wear(); Sound.mob("baa", 2); return true; }
    if (e.sp === "cow" && id === I.BUCKET && !e.baby) { ctx.swapHeld(I.MILK_BUCKET); Sound.mob("moo", 2); return true; }
    if (e.sp === "boarkin" && id === I.GOLD_INGOT && !(e.angry > 0) && e.barterT <= 0) { ctx.consume(); e.barterT = 4; e.goal = null; Sound.mob("snort", 2); return true; }
    if (e.def.villager && !e.baby) { e.trading = 30; ctx.openTrade(e); Sound.mob("hmm", 2); return true; }
    return false;
  }

  // ----- projectiles (arrows, thrown pearls and eggs) -----
  shootArrow(from, target, dmgMul) {
    const sx = from.pos.x, sy = from.eyeY - 0.1, sz = from.pos.z;
    const tx = target.pos.x, ty = target.pos.y + 1.1, tz = target.pos.z;
    const dx = tx - sx, dz = tz - sz, horiz = Math.hypot(dx, dz), speed = 20, t = horiz / speed;
    const vy = (ty - sy) / t + 0.5 * 20 * t;   // aim a little high to make up for gravity
    const err = { easy: 0.12, normal: 0.07, hard: 0.04 }[this.ctx.settings().difficulty] || 0.08;
    this.addProjectile("arrow", sx, sy, sz, dx / horiz * speed + rand(-1, 1) * err * speed, vy + rand(-1, 1) * err * speed, dz / horiz * speed + rand(-1, 1) * err * speed, { owner: from, dmg: 3 * dmgMul });
    Sound.mob("bow", this.dist(from));
  }
  addProjectile(kind, x, y, z, vx, vy, vz, opts = {}) {
    let mesh;
    if (kind === "arrow") {
      mesh = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), new THREE.MeshBasicMaterial({ color: 0x8a6235 }));
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.08), new THREE.MeshBasicMaterial({ color: 0x9a9a9a })); tip.position.z = -0.27;
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff })); fl.position.z = 0.22;
      mesh.add(shaft, tip, fl);
    } else {
      const color = { pearl: 0x1a8a7a, egg: 0xf0e8d0, snowball: 0xffffff, fireball: 0xff7a1a, bigfire: 0xffb030, breath: 0xb050ff, bullet: 0xf0e8b0, eye: 0x3ad0a0, skull: 0x2a2a2a }[kind] || 0xffffff;
      const s = kind === "bigfire" || kind === "breath" ? 0.6 : kind === "fireball" || kind === "bullet" || kind === "skull" ? 0.35 : 0.2;
      mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshBasicMaterial({ color, fog: false }));
    }
    mesh.position.set(x, y, z); this.scene.add(mesh);
    this.projectiles.push({ kind, x, y, z, vx, vy, vz, age: 0, stuck: false, mesh, ...opts });
  }
  updateProjectiles(dt) {
    const w = this.world, ctx = this.ctx, p = ctx.player();
    for (const pr of this.projectiles) {
      pr.age += dt;
      if (pr.stuck) { if (pr.age > 30) pr.gone = true; if (pr.fromPlayer && !ctx.creative() && Math.hypot(pr.x - p.pos.x, pr.y - p.pos.y - 0.8, pr.z - p.pos.z) < 1.4 && pr.age > 0.5) { if (ctx.give(I.ARROW, 1)) pr.gone = true; } continue; }
      if (pr.kind === "eye") { this.flyEye(pr, dt); continue; }
      if (pr.homing) {   // Sheller bullets slowly steer toward you
        const t = pr.homing, dx = t.pos.x - pr.x, dy = t.pos.y + 1 - pr.y, dz = t.pos.z - pr.z, l = Math.hypot(dx, dy, dz) || 1;
        pr.vx += (dx / l * 6 - pr.vx) * 0.04; pr.vy += (dy / l * 6 - pr.vy) * 0.04; pr.vz += (dz / l * 6 - pr.vz) * 0.04;
        if (pr.age > 10) pr.gone = true;
      }
      if (pr.kind === "breath" && Math.random() < 0.5) ctx.particles(pr.x, pr.y, pr.z, "void");
      if (!pr.noGrav) pr.vy -= 20 * dt;
      if (pr.kind === "fireball" || pr.kind === "bigfire") { pr.mesh.rotation.x += dt * 5; pr.mesh.rotation.y += dt * 7; if (Math.random() < 0.3) ctx.particles(pr.x, pr.y, pr.z, "ember"); }
      const steps = Math.ceil(Math.hypot(pr.vx, pr.vy, pr.vz) * dt / 0.25);
      for (let s = 0; s < steps && !pr.gone && !pr.stuck; s++) {
        const nx = pr.x + pr.vx * dt / steps, ny = pr.y + pr.vy * dt / steps, nz = pr.z + pr.vz * dt / steps;
        // hit a creature?
        const hitE = this.list.find(e => !e.dead && e !== pr.owner && (pr.fromPlayer || pr.kind === "bigfire" || pr.kind === "arrow") && nx > e.pos.x - e.w / 2 - 0.1 && nx < e.pos.x + e.w / 2 + 0.1 && ny > e.pos.y && ny < e.pos.y + e.h && nz > e.pos.z - e.w / 2 - 0.1 && nz < e.pos.z + e.w / 2 + 0.1);
        if (hitE && hitE.armored && pr.kind === "arrow") { pr.gone = true; ctx.particles(nx, ny, nz, "poof"); Sound.mob("clank", this.dist(hitE)); break; }   // arrows bounce off the Blightking's armor
        if (hitE && pr.kind === "skull" && hitE !== pr.owner) { this.damage(hitE, pr.dmg || 6, null); ctx.explode(nx, ny, nz, 1, pr.owner); pr.gone = true; break; }
        if (hitE && pr.kind !== "pearl" && pr.kind !== "skull" && (pr.fromPlayer || pr.kind !== "arrow" || !pr.owner || !pr.owner.def.hostile || !hitE.def.hostile)) {
          if (pr.kind === "arrow") { const l = Math.hypot(pr.vx, pr.vz) || 1; this.damage(hitE, pr.dmg, pr.fromPlayer ? "player" : { projectile: true }, { x: pr.vx / l * 0.5, z: pr.vz / l * 0.5 }); if (pr.fromPlayer && hitE.sp !== "voidwalker") { hitE.angry = 40; } }
          if (pr.kind === "bigfire") { if (pr.fromPlayer && hitE.sp === "wailer") this.damage(hitE, 1000, "player"); ctx.explode(nx, ny, nz, pr.power || 1.3, pr.owner); }
          if (pr.kind === "fireball" && !hitE.def.fireproof) { this.damage(hitE, 5, pr.fromPlayer ? "player" : null); hitE.burning = 4; }
          pr.gone = true; Sound.mob("arrowhit", this.dist(hitE)); break;
        }
        // hit the player?
        if (!pr.fromPlayer && nx > p.pos.x - 0.35 && nx < p.pos.x + 0.35 && ny > p.pos.y && ny < p.pos.y + 1.8 && nz > p.pos.z - 0.35 && nz < p.pos.z + 0.35) {
          if (pr.kind === "arrow") ctx.hurtPlayer(pr.dmg, "A Rattler's arrow hit you!", { pos: { x: pr.x - pr.vx, z: pr.z - pr.vz } });
          if (pr.kind === "fireball") { ctx.hurtPlayer(pr.dmg || 5, "A Flare's fireball got you!", { pos: { x: pr.x - pr.vx, z: pr.z - pr.vz } }); ctx.effect("fire", 4); }
          if (pr.kind === "bigfire") ctx.explode(nx, ny, nz, pr.power || 1.3, pr.owner);
          if (pr.kind === "breath") ctx.cloud(nx, ny, nz);
          if (pr.kind === "bullet") { ctx.hurtPlayer(pr.dmg || 4, "A Sheller's bullet got you!", null); ctx.effect("levitation", 6); }
          if (pr.kind === "skull") { ctx.hurtPlayer(pr.dmg || 6, "A Blightking skull hit you!", { pos: { x: pr.x - pr.vx, z: pr.z - pr.vz } }); ctx.effect("blight", 8); ctx.explode(nx, ny, nz, 1, pr.owner); }
          pr.gone = true; break;
        }
        // hit a block?
        const v = w.get(Math.floor(nx), Math.floor(ny), Math.floor(nz));
        const boxes = []; blockBoxes(v, Math.floor(nx), Math.floor(ny), Math.floor(nz), boxes);
        if (boxes.some(b => nx > b[0] && nx < b[3] && ny > b[1] && ny < b[4] && nz > b[2] && nz < b[5])) {
          if (pr.kind === "arrow") { pr.stuck = true; pr.age = 0; Sound.mob("arrowhit", Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z)); }
          else if (pr.kind === "bigfire") { ctx.explode(pr.x, pr.y, pr.z, pr.power || 1.3, pr.owner); pr.gone = true; }
          else if (pr.kind === "fireball") { ctx.ignite(Math.floor(pr.x), Math.floor(pr.y), Math.floor(pr.z)); pr.gone = true; }
          else if (pr.kind === "breath") { ctx.cloud(pr.x, pr.y + 0.5, pr.z); pr.gone = true; }
          else if (pr.kind === "bullet") { ctx.particles(pr.x, pr.y, pr.z, "poof"); pr.gone = true; }
          else if (pr.kind === "skull") { ctx.explode(pr.x, pr.y, pr.z, 1, pr.owner); pr.gone = true; }
          else this.landThrown(pr);
          break;
        }
        pr.x = nx; pr.y = ny; pr.z = nz;
      }
      if (pr.gone) continue;
      if (pr.kind === "pearl" && !pr.stuck) { /* lands on blocks only */ }
      pr.mesh.position.set(pr.x, pr.y, pr.z);
      if (pr.kind === "arrow" && !pr.stuck) pr.mesh.rotation.set(Math.atan2(pr.vy, Math.hypot(pr.vx, pr.vz)), Math.atan2(pr.vx, pr.vz) + Math.PI, 0, "YXZ");
      if (pr.age > 12 && !pr.stuck) pr.gone = true;
    }
    this.projectiles = this.projectiles.filter(pr => { if (pr.gone) { this.scene.remove(pr.mesh); pr.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); return false; } return true; });
  }
  landThrown(pr) {
    const ctx = this.ctx;
    if (pr.kind === "pearl") ctx.pearlLand(pr.x - pr.vx * 0.02, pr.y - pr.vy * 0.02 + 0.1, pr.z - pr.vz * 0.02);
    if (pr.kind === "egg") { ctx.particles(pr.x, pr.y, pr.z, "poof"); if (Math.random() < 0.125) this.add("chicken", pr.x, pr.y + 0.2, pr.z, { baby: true }); }
    pr.gone = true;
  }

  // The Eye of the Void flies toward the nearest stronghold, hovers, then drops (or shatters)
  flyEye(pr, dt) {
    const ctx = this.ctx;
    if (pr.age < 1.6) {
      const dx = pr.tx - pr.x, dz = pr.tz - pr.z, l = Math.hypot(dx, dz) || 1, down = l < 12;
      pr.x += dx / l * 7 * dt * (down ? 0.3 : 1); pr.z += dz / l * 7 * dt * (down ? 0.3 : 1); pr.y += (down ? -2.5 : 1.8) * dt;
    } else if (pr.age > 2.4) {
      pr.gone = true;
      if (Math.random() < 0.8) ctx.drop(I.EYE, 1, pr.x, pr.y, pr.z); else { ctx.particles(pr.x, pr.y, pr.z, "void"); Sound.mob("crystal", 0); }
    }
    if (Math.random() < 0.6) ctx.particles(pr.x, pr.y, pr.z, "portal");
    pr.mesh.position.set(pr.x, pr.y, pr.z); pr.mesh.rotation.y += dt * 6;
  }
  // Hitting a Wailer's fireball sends it back where you're looking
  deflect(o, d, reach) {
    for (const pr of this.projectiles) {
      if (pr.kind === "bullet") {   // Sheller bullets can be swatted away
        const tx = pr.x - o.x, ty = pr.y - o.y, tz = pr.z - o.z, t = tx * d.x + ty * d.y + tz * d.z;
        if (t > 0 && t < reach && (o.x + d.x * t - pr.x) ** 2 + (o.y + d.y * t - pr.y) ** 2 + (o.z + d.z * t - pr.z) ** 2 < 0.8) { pr.gone = true; this.ctx.particles(pr.x, pr.y, pr.z, "poof"); return true; }
        continue;
      }
      if (pr.kind !== "bigfire" && pr.kind !== "fireball") continue;
      const tx = pr.x - o.x, ty = pr.y - o.y, tz = pr.z - o.z, t = tx * d.x + ty * d.y + tz * d.z;
      if (t < 0 || t > reach) continue;
      const px = o.x + d.x * t - pr.x, py = o.y + d.y * t - pr.y, pz = o.z + d.z * t - pr.z;
      if (px * px + py * py + pz * pz > 0.8) continue;
      const sp = Math.hypot(pr.vx, pr.vy, pr.vz) * 1.3;
      pr.vx = d.x * sp; pr.vy = d.y * sp; pr.vz = d.z * sp; pr.fromPlayer = true; pr.owner = null;
      Sound.mob("arrowhit", 0);
      return true;
    }
    return false;
  }
  // Which creature is the player pointing at? (closest hit along the look line)
  raycast(o, d, max) {
    let best = null;
    for (const e of this.list) {
      if (e.dead || e.ridden) continue;
      const a = e.aabb(); let t0 = 0, t1 = max, ok = true;
      for (const [k, lo, hi] of [["x", a[0] - 0.05, a[3] + 0.05], ["y", a[1], a[4]], ["z", a[2] - 0.05, a[5] + 0.05]]) {
        if (Math.abs(d[k]) < 1e-9) { if (o[k] < lo || o[k] > hi) { ok = false; break; } continue; }
        let ta = (lo - o[k]) / d[k], tb = (hi - o[k]) / d[k]; if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) { ok = false; break; }
      }
      if (ok && (!best || t0 < best.dist)) best = { ent: e, dist: t0 };
    }
    return best;
  }
  near(x, y, z, r, filter) { return this.list.filter(e => !e.dead && Math.hypot(e.pos.x - x, e.pos.y - y, e.pos.z - z) < r && (!filter || filter(e))); }

  // ----- animation -----
  animate(e, dt, d2, daylight) {
    const def = e.def, P = e.parts, sp = Math.hypot(e.vel.x, e.vel.z), swing = Math.sin(e.walkPhase * 2.2) * Math.min(1, sp / 2) * 0.9;
    e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
    e.mesh.rotation.y = e.yaw + Math.PI;
    const s = e.scale; e.root.scale.setScalar(s);
    if (e.baby && P.head) P.head.scale.setScalar(1.45);
    else if (P.head) P.head.scale.setScalar(1);
    // head follows the player when close
    if (P.head && d2 < 100 && !e.dead && !e.ridden) {
      const p = this.ctx.player(), rel = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z)) - e.yaw;
      const r = Math.atan2(Math.sin(rel), Math.cos(rel));
      P.head.rotation.y = Math.max(-1, Math.min(1, r)) * (def.model.type === "spider" ? 0.3 : 0.8);
    } else if (P.head) P.head.rotation.y *= 0.9;
    const t = def.model.type;
    if (t === "humanoid") {
      P.legR.rotation.x = swing; P.legL.rotation.x = -swing;
      if (def.model.armsOut) { P.armR.rotation.x = -Math.PI / 2 + Math.sin(e.age * 2) * 0.05 - (e.swing > 0 ? Math.sin(e.swing * 9) * 0.6 : 0); P.armL.rotation.x = -Math.PI / 2 - Math.sin(e.age * 2) * 0.05; }
      else if (def.model.bow && e.target) { P.armR.rotation.x = -Math.PI / 2; P.armL.rotation.x = -Math.PI / 2 - e.drawT * 0.2; P.armL.rotation.y = 0.4; }
      else { P.armR.rotation.x = -swing * 0.8; P.armL.rotation.x = swing * 0.8; }
      if (e.sp === "voidwalker" && e.angry > 0) P.head.position.y = (42 / 16) + Math.sin(e.age * 30) * 0.02;
    } else if (t === "quad" || t === "creeper") {
      if (P.legFR) { P.legFR.rotation.x = swing; P.legBL.rotation.x = swing; P.legFL.rotation.x = -swing; P.legBR.rotation.x = -swing; }
      if (e.grazeT > 0) { e.grazeT -= dt; P.head.rotation.x = 0.9; } else if (P.head && t === "quad") P.head.rotation.x = 0;
      if (P.wool) P.wool.visible = !e.sheared;
      if (P.collar) P.collar.visible = !!e.tame;
      if (P.saddle) P.saddle.visible = !!e.saddled;
      if (def.mount && !(e.grazeT > 0)) P.head.rotation.x = e.ridden ? 1.05 : 0.45;   // the neck leans forward (further while ridden, so you can see past it)
      if (P.tail) P.tail.rotation.x = def.mount ? 0.2 + Math.sin(e.age * 2) * 0.06 : (e.tame ? 0.9 : 0.3) + Math.sin(e.age * (e.tame ? 8 : 2)) * 0.12;
      if (def.pet) {   // sitting pets sit back on their haunches
        e.root.rotation.x = e.sitting ? -0.45 : 0;
        if (e.sitting) { P.legBR.rotation.x = P.legBL.rotation.x = 1.3; P.legFR.rotation.x = P.legFL.rotation.x = 0.45; e.mesh.position.y -= 0.12 * s; }
      }
      if (t === "creeper" && e.fuse > 0) { const k = 1 + e.fuse * 0.12 + Math.sin(e.age * 30) * 0.02; e.root.scale.set(s * k, s * k, s * k); }
    } else if (t === "spider") {
      for (const p of def.model.parts.filter(q => q.side)) { const g = P[p.name], ph = e.walkPhase * 3 + p.index * 1.6 + (p.side > 0 ? Math.PI : 0); g.rotation.y = g.userData.base.y + Math.sin(ph) * 0.35 * Math.min(1, sp); g.rotation.z = g.userData.base.z + Math.max(0, Math.cos(ph)) * 0.25 * Math.min(1, sp) * p.side; }
    } else if (t === "chicken") {
      P.legR.rotation.x = swing; P.legL.rotation.x = -swing;
      const flap = e.onGround ? 0 : Math.sin(e.age * 30) * 0.8; P.wingR.rotation.z = flap; P.wingL.rotation.z = -flap;
      P.head.position.z = 4 / 16 + Math.sin(e.walkPhase * 4) * 0.02 * Math.min(1, sp);
    } else if (t === "rabbit") {
      const air = e.onGround ? 0 : 0.6; P.legR.rotation.x = P.legL.rotation.x = air; e.root.rotation.x = e.onGround ? 0 : -0.2;
    } else if (t === "dragon") {
      const flap = e.perched ? Math.sin(e.age * 1.5) * 0.08 : Math.sin(e.age * (e.flapFast ? 9 : 3.2)) * 0.55;
      P.wingL.rotation.z = flap; P.wingR.rotation.z = -flap; P.wingTipL.rotation.z = flap * 0.6; P.wingTipR.rotation.z = -flap * 0.6;
      P.tail.rotation.y = Math.sin(e.age * 1.3) * 0.25; P.tail2.rotation.y = Math.sin(e.age * 1.3 - 0.8) * 0.35;
      P.neck.rotation.x = e.perched ? 0.35 : Math.max(-0.4, Math.min(0.4, -e.vel.y * 0.05));
      if (e.mouthT > 0) { e.mouthT -= dt; P.jaw.rotation.x = 0.5; } else P.jaw.rotation.x = 0.05;
      e.root.rotation.x = e.perched ? 0 : Math.max(-0.35, Math.min(0.35, -e.vel.y * 0.04));
      if (!e.beam) { e.beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xff8af0 })); this.scene.add(e.beam); e.beam.frustumCulled = false; }
      e.beam.visible = !!e.healFrom;
      if (e.healFrom) { const a = e.beam.geometry.attributes.position; a.setXYZ(0, e.healFrom.pos.x, e.healFrom.pos.y + 1, e.healFrom.pos.z); a.setXYZ(1, e.pos.x, e.pos.y + 2, e.pos.z); a.needsUpdate = true; }
    } else if (t === "crystal") {
      P.cage.rotation.set(e.age * 1.2, e.age * 1.7, 0); P.core.rotation.set(-e.age * 2, e.age, e.age * 1.4);
      P.cage.position.y = P.core.position.y = 16 / 16 + Math.sin(e.age * 2) * 0.15;
    } else if (t === "sheller") {
      P.lid.position.y = (8 + e.open * 6) / 16; P.head.visible = e.open > 0.2;
    } else if (t === "villager") {
      P.robe.rotation.x = swing * 0.15;
    } else if (t === "golem") {
      P.legR.rotation.x = swing * 0.7; P.legL.rotation.x = -swing * 0.7;
      const atk = e.swing > 0 ? -Math.sin(e.swing * 6) * 1.6 : 0;
      P.armR.rotation.x = -swing * 0.6 + atk; P.armL.rotation.x = swing * 0.6 + atk;
    } else if (t === "blightking") {
      P.headL.rotation.y = Math.sin(e.age * 1.3) * 0.4; P.headR.rotation.y = Math.sin(e.age * 1.1 + 1) * 0.4;
      P.spine.rotation.x = Math.sin(e.age * 2) * 0.2; e.root.position.y = Math.sin(e.age * 1.5) * 0.15;
      if (e.summonT > 0) { const k = 0.6 + Math.sin(e.age * 20) * 0.4; e.mat.color.setRGB(0.5 + k * 0.5, 0.6 + k * 0.4, 1); return; }
      if (e.armored && Math.sin(e.age * 6) > 0.6) { e.mat.color.setRGB(0.8, 0.85, 1); return; }
    } else if (t === "flare") {
      for (let i = 0; i < 10; i++) { const a = e.age * (i < 5 ? 2 : -1.6) + (i % 5) * Math.PI * 2 / 5, r = i < 5 ? 0.45 : 0.3; P["rod" + i].position.set(Math.cos(a) * r, (i < 5 ? 16 : 8) / 16 + Math.sin(e.age * 3 + i) * 0.05, Math.sin(a) * r); }
      e.root.position.y = Math.sin(e.age * 2) * 0.1;
    } else if (t === "wailer") {
      for (let i = 0; i < 9; i++) P["t" + i].rotation.x = Math.sin(e.age * 2 + i) * 0.3;
      e.root.position.y = Math.sin(e.age * 1.3) * 0.15;
    } else if (t === "strider") {
      P.legR.rotation.x = swing; P.legL.rotation.x = -swing; P.body.rotation.z = Math.sin(e.walkPhase * 2.2) * 0.05 * Math.min(1, sp);
    } else if (t === "slime") {
      const sq = e.onGround ? 1 - Math.max(0, Math.sin(e.age * 3)) * 0.06 : 1.08; e.root.scale.set(s * (2 - sq), s * sq, s * (2 - sq));
    }
    if (e.swing > 0) e.swing -= dt;
    // brightness from the light where it stands, flash red when hurt, white when about to explode
    const L = this.world.lightAt(Math.floor(e.pos.x), Math.floor(e.pos.y + 0.5), Math.floor(e.pos.z));
    let b = L ? Math.max(L[0] / 15 * daylight, L[1] / 15) : daylight;
    const amb = this.world.gen.isNether() ? 0.3 : 0.12;   // the Ember Depths glow a little everywhere
    b = amb + (1 - amb) * Math.pow(b, 1.5);
    if (e.fuse > 0 && Math.sin(e.age * 25) > 0) e.mat.color.setRGB(1, 1, 1);
    else if (e.hurtT > 0) e.mat.color.setRGB(1, 0.35 * b, 0.35 * b);
    else if (e.burning > 0) e.mat.color.setRGB(Math.min(1, b * 1.4), b * 0.7, b * 0.4);
    else e.mat.color.setScalar(b);
  }
}

function turn(a, target, k) { let d = target - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * Math.min(1, k); }
