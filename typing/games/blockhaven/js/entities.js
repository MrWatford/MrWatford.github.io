// Creatures and moving things: models, animation, movement, path finding, behavior, spawning, and saving.
// Each species is described by data (size, health, behavior, drops, model) and shares the same body physics.
import * as THREE from "../lib/three.module.min.js";
import { B, I, CHUNK, HEIGHT, SOLID, OPAQUE, idOf, metaOf, OPEN, SPAWN_EGGS } from "./blocks.js";
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
function standable(world, x, y, z, tall) {
  if (solidCell(world, x, y, z) || solidCell(world, x, y + 1, z) || (tall > 2 && solidCell(world, x, y + 2, z))) return false;
  const below = world.id(x, y - 1, z);
  if (below === B.LAVA || world.id(x, y, z) === B.LAVA) return false;
  return solidCell(world, x, y - 1, z) || below === B.WATER;
}
export function findPath(world, sx, sy, sz, tx, ty, tz, tall, maxNodes = 350) {
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
        if (!standable(world, x, y, z, tall)) continue;
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
    this.hp = opts.hp ?? this.maxHp;
    this.breedCd = opts.breedCd || 0; this.love = 0; this.sheared = !!opts.sheared; this.eggT = opts.eggT ?? rand(300, 600);
    this.name = opts.name || null; this.persist = !!(this.def.animal || this.name);
    this.barterT = 0;
    this.onGround = false; this.inWater = false; this.inLava = false; this.walkPhase = 0; this.hurtT = 0; this.iframes = 0;
    this.attackCd = 0; this.thinkT = Math.random() * 0.3; this.state = "idle"; this.target = null; this.goal = null; this.path = null; this.pathT = 0;
    this.fuse = 0; this.burnT = 0; this.angry = opts.angry || 0; this.dead = 0; this.age = 0; this.fleeT = 0; this.wantJump = false; this.drawT = 0;
    this.stuckT = 0; this.lastX = x; this.lastZ = z; this.hopT = rand(0.5, 2);
  }
  get maxHp() { return this.def.ai === "slime" ? this.size * this.size * 1 + (this.size === 4 ? 0 : 0) || 1 : this.def.hp; }
  get scale() { return (this.def.scale || 1) * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  get w() { return this.def.w * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  get h() { return this.def.h * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  aabb(x = this.pos.x, y = this.pos.y, z = this.pos.z) { const r = this.w / 2; return [x - r, y, z - r, x + r, y + this.h, z + r]; }
  get eyeY() { return this.pos.y + this.h * 0.85; }
  toJSON() {
    return { uid: this.uid, sp: this.sp, x: +this.pos.x.toFixed(2), y: +this.pos.y.toFixed(2), z: +this.pos.z.toFixed(2), yaw: +this.yaw.toFixed(2), hp: this.hp,
      baby: this.baby, growT: Math.round(this.growT), breedCd: Math.round(this.breedCd), sheared: this.sheared, eggT: Math.round(this.eggT), size: this.size, name: this.name };
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
  remove(e) { this.scene.remove(e.mesh); e.mat.dispose(); e.mesh = null; }
  clear() { for (const e of this.list) this.remove(e); this.list = []; for (const p of this.projectiles) this.scene.remove(p.mesh); this.projectiles = []; }

  // ----- saving -----
  // Creatures in chunks that unload are tucked into the world's store, then brought back when the chunk loads again.
  unloadChunk(c) {
    const w = this.world, keep = [];
    for (const e of this.list) {
      if (Math.floor(e.pos.x / CHUNK) !== c.cx || Math.floor(e.pos.z / CHUNK) !== c.cz) continue;
      if (e.persist) keep.push(e.toJSON());
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
      if (!e.persist || e.dead) continue;
      const k = Math.floor(e.pos.x / CHUNK) + "," + Math.floor(e.pos.z / CHUNK);
      (store[k] = store[k] || []).push(e.toJSON());
    }
    return store;
  }

  // ----- first visit: a few animals live here -----
  populate(c) {
    if (Math.random() > 0.3) return;
    const w = this.world, x0 = c.cx * CHUNK, z0 = c.cz * CHUNK;
    if (w.gen.isNether()) return;   // the Ember Depths fill up through the spawner instead
    const biome = w.gen.column(x0 + 8, z0 + 8).biome;
    if (biome === "peak") return;
    const pool = biome === "sandy" ? [["rabbit", 1]] : [["cow", 25], ["sheep", 25], ["pig", 20], ["chicken", 20], ["rabbit", 10]];
    let t = Math.random() * pool.reduce((s, p) => s + p[1], 0), sp = pool[0][0];
    for (const [k, wgt] of pool) { t -= wgt; if (t <= 0) { sp = k; break; } }
    const n = randi(2, 4);
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
    if (s.difficulty === "peaceful" || ctx.creative()) return;
    const cap = { easy: 8, normal: 12, hard: 16 }[s.difficulty] || 10;
    const hostiles = this.list.filter(e => e.def.hostile || e.sp === "voidwalker").length;
    if (hostiles >= cap) return;
    this.tmpM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); this.frustum.setFromProjectionMatrix(this.tmpM);
    if (w.gen.isNether()) { this.netherSpawn(w, p, camera); return; }
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
      if (!e.persist && (d2 > 72 * 72 || (d2 > 36 * 36 && Math.random() < dt / 30))) { e.gone = true; continue; }
      if (!w.isLoaded(e.pos.x, e.pos.z)) continue;
      if (e.dead) { this.dying(e, dt); continue; }
      e.age += dt;
      if (d2 < 48 * 48) {
        e.thinkT -= dt;
        if (e.thinkT <= 0) { e.thinkT = d2 < 24 * 24 ? 0.15 : 0.6; this.think(e, daylight); }
        this.physics(e, dt);
      }
      if (d2 < 64 * 64) this.animate(e, dt, d2, daylight);
      e.mesh.visible = d2 < 64 * 64;
    }
    this.sweep();
    this.updateProjectiles(dt);
  }

  physics(e, dt) {
    const w = this.world, def = e.def, ctx = this.ctx;
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
    if (def.animal) return this.thinkAnimal(e, d);
    if (e.sp === "voidwalker") return this.thinkVoidwalker(e, d, dmgMul);
    if (def.ai === "flare" || def.ai === "wailer") return this.thinkFlyer(e, d, dmgMul);
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
    if (e.sp === "voidwalker" && attacker && attacker.projectile) { this.teleport(e); return false; }   // dodges arrows
    e.hp -= n; e.hurtT = 0.3; e.iframes = 0.5;
    if (knock) { e.vel.x = knock.x * 7; e.vel.z = knock.z * 7; e.vel.y = 4.5; e.knock = 0.25; }
    if (attacker === "player") {
      e.angry = 40; if (e.def.animal) e.fleeT = 5;
      // Rotboars and Boarkin defend each other
      if (e.def.ai === "rotboar" || e.def.ai === "boarkin" || e.sp === "brute") for (const o of this.near(e.pos.x, e.pos.y, e.pos.z, 20, o => o.sp === e.sp)) o.angry = 40;
    }
    Sound.mob(e.def.animal ? e.def.sound : "hurt", this.dist(e));
    if (e.sp === "voidwalker" && attacker === "player" && Math.random() < 0.3) this.teleport(e, this.ctx.player().pos);
    if (e.hp <= 0) this.kill(e, attacker);
    return true;
  }
  kill(e, attacker) {
    e.dead = 0.6; e.goal = null; e.path = null;
    const ctx = this.ctx;
    if (attacker === "player" || e.burning || attacker === "explosion") {
      for (const d of e.def.drops(e)) if (d && d[1] > 0) ctx.drop(d[0], d[1], e.pos.x, e.pos.y + 0.4, e.pos.z);
      if (!e.baby) ctx.xp(e.def.xp * (e.def.ai === "slime" ? e.size : 1), e.pos.x, e.pos.y + 0.4, e.pos.z);
    }
    if (e.def.ai === "slime" && e.size > 1) {   // big gloops split
      const n = randi(2, 4);
      for (let i = 0; i < n; i++) this.add(e.sp, e.pos.x + rand(-0.5, 0.5), e.pos.y + 0.3, e.pos.z + rand(-0.5, 0.5), { size: e.size / 2 });
    }
  }
  dying(e, dt) {
    e.dead -= dt;
    e.root.rotation.z = Math.min(Math.PI / 2, (0.6 - e.dead) * 4);
    e.mat.color.setRGB(1, 0.4, 0.4);
    if (e.dead <= 0) { e.gone = true; this.ctx.particles(e.pos.x, e.pos.y + e.h / 2, e.pos.z, "poof"); }
  }

  // ----- interacting (right-click) -----
  interact(e, slot) {
    const ctx = this.ctx, def = e.def, id = slot ? slot.id : 0;
    if (def.animal && def.food.includes(id)) {
      if (e.baby) { e.growT -= 60; ctx.consume(); ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); return true; }
      if (e.breedCd <= 0 && e.love <= 0) { e.love = 30; ctx.consume(); ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); Sound.mob(def.sound, 2); return true; }
      return false;
    }
    if (e.sp === "sheep" && id === I.SHEARS && !e.sheared && !e.baby) { e.sheared = true; ctx.drop(B.WOOL, randi(1, 3), e.pos.x, e.pos.y + 1, e.pos.z); ctx.wear(); Sound.mob("baa", 2); return true; }
    if (e.sp === "cow" && id === I.BUCKET && !e.baby) { ctx.swapHeld(I.MILK_BUCKET); Sound.mob("moo", 2); return true; }
    if (e.sp === "boarkin" && id === I.GOLD_INGOT && !(e.angry > 0) && e.barterT <= 0) { ctx.consume(); e.barterT = 4; e.goal = null; Sound.mob("snort", 2); return true; }
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
      const color = { pearl: 0x1a8a7a, egg: 0xf0e8d0, snowball: 0xffffff, fireball: 0xff7a1a, bigfire: 0xffb030 }[kind] || 0xffffff;
      const s = kind === "bigfire" ? 0.6 : kind === "fireball" ? 0.3 : 0.2;
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
      if (!pr.noGrav) pr.vy -= 20 * dt;
      if (pr.kind === "fireball" || pr.kind === "bigfire") { pr.mesh.rotation.x += dt * 5; pr.mesh.rotation.y += dt * 7; if (Math.random() < 0.3) ctx.particles(pr.x, pr.y, pr.z, "ember"); }
      const steps = Math.ceil(Math.hypot(pr.vx, pr.vy, pr.vz) * dt / 0.25);
      for (let s = 0; s < steps && !pr.gone && !pr.stuck; s++) {
        const nx = pr.x + pr.vx * dt / steps, ny = pr.y + pr.vy * dt / steps, nz = pr.z + pr.vz * dt / steps;
        // hit a creature?
        const hitE = this.list.find(e => !e.dead && e !== pr.owner && (pr.fromPlayer || pr.kind === "bigfire" || pr.kind === "arrow") && nx > e.pos.x - e.w / 2 - 0.1 && nx < e.pos.x + e.w / 2 + 0.1 && ny > e.pos.y && ny < e.pos.y + e.h && nz > e.pos.z - e.w / 2 - 0.1 && nz < e.pos.z + e.w / 2 + 0.1);
        if (hitE && pr.kind !== "pearl" && (pr.fromPlayer || pr.kind !== "arrow" || !pr.owner || !pr.owner.def.hostile || !hitE.def.hostile)) {
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
          pr.gone = true; break;
        }
        // hit a block?
        const v = w.get(Math.floor(nx), Math.floor(ny), Math.floor(nz));
        const boxes = []; blockBoxes(v, Math.floor(nx), Math.floor(ny), Math.floor(nz), boxes);
        if (boxes.some(b => nx > b[0] && nx < b[3] && ny > b[1] && ny < b[4] && nz > b[2] && nz < b[5])) {
          if (pr.kind === "arrow") { pr.stuck = true; pr.age = 0; Sound.mob("arrowhit", Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z)); }
          else if (pr.kind === "bigfire") { ctx.explode(pr.x, pr.y, pr.z, pr.power || 1.3, pr.owner); pr.gone = true; }
          else if (pr.kind === "fireball") { ctx.ignite(Math.floor(pr.x), Math.floor(pr.y), Math.floor(pr.z)); pr.gone = true; }
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

  // Hitting a Wailer's fireball sends it back where you're looking
  deflect(o, d, reach) {
    for (const pr of this.projectiles) {
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
      if (e.dead) continue;
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
    if (P.head && d2 < 100 && !e.dead) {
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
      if (t === "creeper" && e.fuse > 0) { const k = 1 + e.fuse * 0.12 + Math.sin(e.age * 30) * 0.02; e.root.scale.set(s * k, s * k, s * k); }
    } else if (t === "spider") {
      for (const p of def.model.parts.filter(q => q.side)) { const g = P[p.name], ph = e.walkPhase * 3 + p.index * 1.6 + (p.side > 0 ? Math.PI : 0); g.rotation.y = g.userData.base.y + Math.sin(ph) * 0.35 * Math.min(1, sp); g.rotation.z = g.userData.base.z + Math.max(0, Math.cos(ph)) * 0.25 * Math.min(1, sp) * p.side; }
    } else if (t === "chicken") {
      P.legR.rotation.x = swing; P.legL.rotation.x = -swing;
      const flap = e.onGround ? 0 : Math.sin(e.age * 30) * 0.8; P.wingR.rotation.z = flap; P.wingL.rotation.z = -flap;
      P.head.position.z = 4 / 16 + Math.sin(e.walkPhase * 4) * 0.02 * Math.min(1, sp);
    } else if (t === "rabbit") {
      const air = e.onGround ? 0 : 0.6; P.legR.rotation.x = P.legL.rotation.x = air; e.root.rotation.x = e.onGround ? 0 : -0.2;
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
