// Creatures and moving things: models, animation, movement, path finding, behavior, spawning, and saving.
// Each species is described by data (size, health, behavior, drops, model) and shares the same body physics.
import * as THREE from "../lib/three.module.min.js";
import { B, I, CHUNK, HEIGHT, SOLID, OPAQUE, idOf, metaOf, make, OPEN, TOP, SPAWN_EGGS, HONEY_MAX, honeyOf, itemDef, isDoor, isTrapdoor, isGate } from "./blocks.js";
import { blockBoxes } from "./player.js";
import { cartStep } from "./rails.js";
import { installCreatures, animateCreature, thinkCreature, interactCreature, spawnCreatures } from "./creatures.js";
import { Sound } from "./audio.js";
import { DUNE_SEGMENTS, DuneTrail, DunePose } from "./dune-leviathan.js?v=pose-1";
import { animateDesertMob, installDesertMobs, spawnDesertMobs, thinkDesertMob } from "./desert-mobs.js";
import { createLeviathanGlow } from "./leviathan-glow.js?v=charge-1";
import { createMawShell } from "./leviathan-geometry.js";
import { LeviathanCues } from "./leviathan-cues.js";
import { DuneAttackMotion } from "./dune-attack-motion.js";
import { segmentBoxTime, projectileBlockHit, MAX_DEFLECT_SPEED } from "./projectile-collision.js";
import { usesLeviathanHitVolumes, createLeviathanHitVolumes, updateLeviathanHitVolumes, leviathanSegmentTime } from "./leviathan-hit-volumes.js";
import { stepBondedLeviathan } from "./leviathan-bonds.js";

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
// Species with `variants` (color sets) get one skin per variant; paint functions receive the variant as a third argument.
function makeSpecies(sp, shaded) {
  sp.geos = {}; sp.texs = [];
  const count = sp.variants ? sp.variants.length : 1;
  for (let vi = 0; vi < count; vi++) {
    const canvas = document.createElement("canvas"); canvas.width = 128;
    canvas.height = 16 * Math.ceil(sp.model.parts.length * FACE_ORDER.length / 8);
    const ctx = canvas.getContext("2d");
    let tile = 0;
    for (const part of sp.model.parts) {
      const firstTile = tile;
      const wrapped = part.rounded || part.mawShell;
      const g = vi === 0 ? (part.mawShell ? createMawShell(part.size) : part.rounded ? new THREE.CylinderGeometry(1, 1, 1, 8, 1).rotateX(Math.PI / 2)
        .scale(part.size[0] / 32, part.size[1] / 32, part.size[2] / 16) :
        new THREE.BoxGeometry(part.size[0] / 16, part.size[1] / 16, part.size[2] / 16)) : null;
      const originalUV = wrapped && g ? g.attributes.uv.array.slice() : null;
      if (g && (part.taper || part.taperTop)) {
        const positions = g.attributes.position;
        for (let i = 0; i < positions.count; i++) if (part.taperTop ? positions.getY(i) > 0 : positions.getY(i) < 0) {
          positions.setX(i, positions.getX(i) * (part.taperTop ? 0.32 : 0.12));
          positions.setZ(i, positions.getZ(i) * (part.taperTop ? 0.65 : 0.12));
        }
        g.computeVertexNormals();
      }
      const uv = g && g.attributes.uv;
      FACE_ORDER.forEach((face, f) => {
        const tx = (tile % 8) * 16, ty = Math.floor(tile / 8) * 16; tile++;
        const paint = part.paint[face] || part.paint.all;
        paint(painterFor(ctx, tx, ty), face, sp.variants && sp.variants[vi]);
        if (uv && !wrapped) for (let k = 0; k < 4; k++) { const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i); uv.setXY(i, (tx + 0.05 + u * 15.9) / 128, 1 - (ty + 0.05 + (1 - v) * 15.9) / canvas.height); }
      });
      if (g) {
        if (wrapped) {
          for (let i = 0; i < uv.count; i++) {
            const atlasTile = firstTile + (g.userData.faceTiles?.[i] || 0);
            const tx = (atlasTile % 8) * 16, ty = Math.floor(atlasTile / 8) * 16;
            uv.setXY(i, (tx + 0.05 + originalUV[i * 2] * 15.9) / 128,
              1 - (ty + 0.05 + (1 - originalUV[i * 2 + 1]) * 15.9) / canvas.height);
          }
        }
        if (shaded) {
          const colors = wrapped ? Array.from({ length: g.attributes.position.count }, (_, i) => {
            const tone = 0.58 + 0.42 * Math.max(0, (g.attributes.normal.getY(i) + 1) / 2);
            return [tone, tone, tone];
          }).flat() : [0.65, 0.81, 1, 0.48, 0.92, 0.72].flatMap(tone => Array(12).fill(tone));
          g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        }
        uv.needsUpdate = true;
        sp.geos[part.name] = g;
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    if (shaded) tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    sp.texs.push(tex);
  }
  sp.tex = sp.texs[0];
}

// color helpers for skins
const solid = pal => P => P.fill(pal);
const face = (pal, draw) => (P, f) => { P.fill(pal); if (f === "front") draw(P); };
const SKIN_G = ["#5c9a4a", "#548f43", "#63a352"], SHIRT = ["#2fa0a8", "#2a929a"], PANTS = ["#3a40a0", "#343a94"];
const BONE = ["#d6d6ce", "#c8c8c0", "#e0e0d8"], CREEP = ["#4caf3a", "#3f9a30", "#5cc048", "#2f7a26", "#6ad055"];
const SPIDER = ["#3a302a", "#2e2622", "#45392f"], CAVE = ["#1d4a5a", "#163e4c", "#255868"], VOID = ["#191528", "#241b36", "#302547", "#10101b"];
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
    drops: () => [[I.COAL, randi(0, 1)], [I.BONE, randi(0, 2)], Math.random() < 0.04 ? [I.BLIGHT_SKULL, 1] : null, Math.random() < 0.15 ? [I.PALE_SHARD, 1] : null],
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
  cleric: [[[[I.ROTTEN_FLESH, 32]], [I.JADE, 1], 12], [[[I.WART, 22]], [I.JADE, 1], 12], [[[I.JADE, 1]], [I.SHINE_DUST, 2], 12], [[[I.JADE, 5]], [I.VOID_PEARL, 1], 4], [[[I.JADE, 3]], [I.GOLD_INGOT, 2], 8], [[[I.JADE, 1]], [I.SPARKDUST, 2], 12]],
  smith: [[[[I.COAL, 15]], [I.JADE, 1], 12], [[[I.IRON_INGOT, 4]], [I.JADE, 1], 12], [[[I.JADE, 6]], [I.IRON_PICK, 1], 4], [[[I.JADE, 7]], [I.IRON_SWORD, 1], 4], [[[I.JADE, 9]], [I.IRON_CHEST, 1], 3], [[[I.JADE, 4]], [I.IRON_HELMET, 1], 4], [[[I.JADE, 16]], [B.BELL, 1], 2]],
  wanderer: [[[[I.JADE, 1]], [B.SAPLING, 3], 4], [[[I.JADE, 2]], [I.SHINE_DUST, 6], 4], [[[I.JADE, 3]], [I.GOLD_INGOT, 3], 4], [[[I.JADE, 4]], [I.SKYSHARD, 1], 2], [[[I.JADE, 2]], [I.WART, 6], 4], [[[I.JADE, 5]], [B.CHORUS_FLOWER, 2], 2], [[[I.JADE, 10]], [I.TOTEM, 1], 1]]
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
      bodyPaint: { all: P => { P.fill(CHESTNUT); P.rect(2, 2, 12, 2, "#a47045"); P.rect(3, 12, 10, 3, "#754625"); } }, legPaint: { all: P => { P.fill(CHESTNUT); P.rect(0, 9, 16, 4, "#dec8a9"); P.rect(0, 13, 16, 3, "#3a2a1a"); } },
      headPaint: { all: solid(CHESTNUT) } }),
      { name: "muzzle", parent: "head", size: [5, 5, 9], pivot: [0, 4.5, 4], off: [0, 0, 1], paint: { all: solid(CHESTNUT), front: P => { P.fill(["#6a4226"]); P.rect(3, 9, 3, 2, "#2a1a10"); P.rect(10, 9, 3, 2, "#2a1a10"); }, right: P => { P.fill(CHESTNUT); P.rect(10, 3, 2, 2, "#111"); }, left: P => { P.fill(CHESTNUT); P.rect(4, 3, 2, 2, "#111"); } } },
      { name: "earR", parent: "head", size: [2, 3, 1], pivot: [-2, 8, 0], off: [0, 0, 0], paint: { all: solid(["#6a4226"]) } },
      { name: "earL", parent: "head", size: [2, 3, 1], pivot: [2, 8, 0], off: [0, 0, 0], paint: { all: solid(["#6a4226"]) } },
      { name: "mane", parent: "head", size: [2, 15, 2], pivot: [0, 0, -4.2], off: [0, 0, 0], paint: { all: solid(["#2a1a10", "#3a2414"]) } },
      { name: "tail", size: [3, 12, 3], pivot: [0, 25, -11], off: [0, -5, -1], paint: { all: solid(["#2a1a10", "#3a2414"]) } },
      { name: "saddle", size: [11, 2, 10], pivot: [0, 27, 1], off: [0, 0, 0], paint: { all: solid(["#5a3418", "#4e2c14"]), top: P => { P.fill(["#5a3418"]); P.rect(2, 2, 12, 12, "#6e4422"); } } }] } }
});
// ----- water life, boats, and wildlife -----
const MINNOW = ["#9aa8b0", "#8e9ca4", "#a6b4bc"], PUFF = ["#e8c840", "#e0c038", "#f0d050"], INK = ["#2a3a5a", "#24344e", "#304266"], DOLPH = ["#8a9ab0", "#8292a8", "#92a2b8"];
const PLANKB = ["#a87a48", "#9a6e3e", "#b4864f"], FOX = ["#e0782a", "#d46e22", "#e88434"], BEEY = ["#f0c020", "#e8b818", "#f4c828"], BELLY = ["#e0e6ec", "#d8dee4"];
const fishEyes = pal => face(pal, P => { P.rect(0, 3, 5, 5, "#f4f4f4"); P.rect(1, 4, 3, 3, "#111"); P.rect(11, 3, 5, 5, "#f4f4f4"); P.rect(12, 4, 3, 3, "#111"); });
// ----- minecarts (Part D of the Sparkworks update) -----
const IRONP = ["#8a8a8a", "#7e7e7e", "#949494"];
const CHESTP = P => { P.fill(["#9a6a35", "#8e6230"]); P.rect(0, 5, 16, 2, "#5a3a1a"); P.rect(7, 4, 2, 4, "#c8c8c8"); };
// Mounts share the Trotter controls and save fields. Their profiles set the silhouette and coat.
function packMount(name, palette, { ears = 5, longNeck = false, hump = false, pack = false, trader = false, sterile = false, speed = 2, hp = 22 } = {}) {
  const base = SPECIES.trotter;
  const coat = { all: solid(palette) };
  const hooves = { all: P => { P.fill(palette); P.rect(0, 13, 16, 3, "#3a3029"); } };
  const parts = quadParts({ body: [10, 10, 21], head: longNeck ? [5, 17, 5] : [6, 13, 7], leg: 4,
    legH: hump ? 19 : 16, headUp: hump ? 10 : 8, bodyPaint: coat, headPaint: coat, legPaint: hooves });
  const detail = (name, size, pivot, paint, parent) => ({ name, size, pivot, paint, parent, off: [0, 0, 0] });
  const snout = { all: solid([palette[1], palette[2]]), left: P => { P.fill(palette); P.rect(3, 4, 3, 3, "#211b16"); } };
  snout.right = P => { P.fill(palette); P.rect(10, 4, 3, 3, "#211b16"); };
  snout.front = face([palette[2]], P => { P.rect(3, 8, 2, 2, "#433428"); P.rect(11, 8, 2, 2, "#433428"); });
  const headTop = longNeck ? 7 : 5;
  parts.push(detail("muzzle", [5, 5, 8], [0, headTop, 4], snout, "head"),
    detail("earL", [2, ears, 2], [-2, headTop + 2 + ears / 2, 0], coat, "head"),
    detail("earR", [2, ears, 2], [2, headTop + 2 + ears / 2, 0], coat, "head"),
    detail("tail", [2, longNeck ? 5 : 11, 2], [0, hump ? 23 : 20, -12], hooves),
    { ...base.model.parts.find(part => part.name === "saddle"), pivot: [0, hump ? 34 : 27, hump ? -2 : 1] });
  if (hump) parts.push(detail("hump", [8, 7, 10], [0, 30, -2], coat));
  if (pack) for (const side of [-1, 1]) parts.push(detail("pack" + side, [4, 6, 7], [side * 6, 22, -3], { all: CHESTP }));
  if (trader) parts.push(detail("blanket", [11, 2, 15], [0, 26, 0], { all: P => {
    P.fill(["#264887", "#3059a0"]); P.rect(0, 2, 16, 2, "#e6a831"); P.rect(0, 12, 16, 2, "#e6a831");
  } }));
  return { ...base, name, speed, hp, h: hump ? 2.5 : longNeck ? 2.2 : 1.8, food: sterile ? [] : base.food,
    invSize: pack ? 27 : 0, model: { type: "quad", parts } };
}
Object.assign(SPECIES, {
  packass: packMount("Long Ear", ["#756258", "#584a44", "#c2af9a"], { ears: 7, pack: true, speed: 1.8 }),
  mule: packMount("Trail Mule", ["#814b31", "#674031", "#af8f79"], { ears: 6, pack: true, sterile: true, hp: 26 }),
  camel: packMount("Dune Strider", ["#bc843d", "#a97437", "#e4b66f"], { ears: 2, longNeck: true, hump: true, hp: 30 }),
  camel_husk: packMount("Dune Husk", ["#9d8866", "#756651", "#c6b591"], { ears: 2, longNeck: true, hump: true, sterile: true, hp: 25 }),
  llama: packMount("Woolneck", ["#dbc7a6", "#baa581", "#eee1c8"], { longNeck: true, pack: true, speed: 1.7 }),
  trader_llama: packMount("Caravan Woolneck", ["#d7c49f", "#b9a27c", "#eee3c8"], { longNeck: true, pack: true, trader: true, sterile: true }),
  bone_trotter: packMount("Bone Trotter", ["#bfb5a0", "#867e70", "#ded7c5"], { ears: 2, sterile: true, hp: 15 }),
  rot_trotter: packMount("Rot Trotter", ["#546a38", "#354626", "#819757"], { ears: 3, sterile: true, hp: 20 })
});

function cartSpecies() {
  const base = [
    { name: "bottom", size: [14, 2, 18], pivot: [0, 2, 0], off: [0, 0, 0], paint: { all: solid(["#5a5a5a", "#525252"]) } },
    { name: "sideR", size: [2, 8, 18], pivot: [-8, 5, 0], off: [0, 0, 0], paint: { all: solid(IRONP) } },
    { name: "sideL", size: [2, 8, 18], pivot: [8, 5, 0], off: [0, 0, 0], paint: { all: solid(IRONP) } },
    { name: "front", size: [14, 8, 2], pivot: [0, 5, 9], off: [0, 0, 0], paint: { all: solid(IRONP) } },
    { name: "back", size: [14, 8, 2], pivot: [0, 5, -9], off: [0, 0, 0], paint: { all: solid(IRONP) } }];
  const box = (paint) => [{ name: "load", size: [12, 12, 12], pivot: [0, 9, 0], off: [0, 0, 0], paint }];
  const mk = (name, extra, more) => ({ name, cart: true, object: true, persist: true, hp: 3, speed: 0, w: 0.98, h: 0.7, ai: "cart", xp: 0, sound: "", ...more, model: { type: "cart", parts: [...base, ...extra] } });
  return {
    minecart: mk("Minecart", [], { drops: () => [[I.MINECART, 1]] }),
    chest_cart: mk("Minecart with Chest", box({ all: CHESTP }), { invSize: 27, drops: () => [[I.CHEST_CART, 1]] }),
    hopper_cart: mk("Minecart with Hopper", [{ name: "load", size: [12, 6, 12], pivot: [0, 11, 0], off: [0, 0, 0], paint: { all: solid(["#4a4a4e", "#424246"]), top: P => { P.fill(["#4a4a4e"]); P.rect(2, 2, 12, 12, "#1e1e22"); } } },
      { name: "spout", size: [6, 4, 6], pivot: [0, 6, 0], off: [0, 0, 0], paint: { all: solid(["#3a3a3e"]) } }], { invSize: 5, drops: () => [[I.HOPPER_CART, 1]] }),
    furnace_cart: mk("Minecart with Furnace", box({ all: solid(["#7a7a7a", "#727272", "#848484"]), front: P => { P.fill(["#7a7a7a"]); P.rect(4, 6, 8, 6, "#2a2a2a"); P.rect(5, 9, 6, 2, "#ff8a2a"); } }), { drops: () => [[I.FURNACE_CART, 1]] }),
    tnt_cart: mk("Minecart with Blast Block", box({ all: P => { P.fill(["#c83a2a", "#b8322a"]); P.rect(0, 5, 16, 5, "#e8e8e8"); P.rect(3, 6, 10, 3, "#2a2a2a"); } }), { drops: () => [[I.TNT_CART, 1]] })
  };
}
const plankPaint = P => { P.fill(PLANKB); for (let y = 3; y < 16; y += 4) P.rect(0, y, 16, 1, "#7a5430"); };
const fishParts = o => [
  { name: "body", size: o.body, pivot: [0, o.body[1] / 2, 0], off: [0, 0, 0], paint: o.bodyPaint },
  { name: "tail", size: [1, o.body[1], o.tail], pivot: [0, o.body[1] / 2, -o.body[2] / 2], off: [0, 0, -o.tail / 2], paint: o.finPaint },
  { name: "fin", size: [1, o.fin, Math.max(2, o.body[2] / 2 - 1)], pivot: [0, o.body[1], 0], off: [0, o.fin / 2, 0], paint: o.finPaint }
];
Object.assign(SPECIES, {
  minnow: { name: "Minnow", swims: true, school: true, hp: 3, speed: 2.4, w: 0.45, h: 0.3, ai: "fish", xp: 1, sound: "blub",
    drops: e => [[e.burning ? I.COOKED_MINNOW : I.RAW_MINNOW, 1], Math.random() < 0.05 ? [I.BONE_MEAL, 1] : null],
    model: { type: "fish", parts: fishParts({ body: [3, 4, 8], tail: 4, fin: 2, bodyPaint: { all: solid(MINNOW), top: solid(["#6a7880", "#62707a"]), front: fishEyes(MINNOW) }, finPaint: { all: solid(["#7a8890"]) } }) } },
  sunfin: { name: "Sunfin", swims: true, school: true, hp: 3, speed: 2.2, w: 0.4, h: 0.4, ai: "fish", xp: 1, sound: "blub",
    variants: [{ a: "#f08a1a", b: "#ffffff" }, { a: "#2a7ad8", b: "#f0d020" }, { a: "#e04a8a", b: "#f8f0f4" }, { a: "#30b070", b: "#f0e040" }, { a: "#8a4ad0", b: "#f0a020" }],
    drops: () => [[I.SUNFIN, 1], Math.random() < 0.05 ? [I.BONE_MEAL, 1] : null],
    model: { type: "fish", parts: fishParts({ body: [2, 6, 6], tail: 3, fin: 2,
      bodyPaint: { all: (P, f, v) => { P.fill([v.a]); P.rect(5, 0, 3, 16, v.b); P.rect(11, 0, 2, 16, v.b); }, front: (P, f, v) => { P.fill([v.a]); P.rect(0, 4, 6, 5, "#111"); P.rect(10, 4, 6, 5, "#111"); } },
      finPaint: { all: (P, f, v) => P.fill([v.b]) } }) } },
  puffer: { name: "Puffer", swims: true, hp: 3, speed: 1.6, w: 0.45, h: 0.45, ai: "puffer", xp: 1, sound: "blub",
    drops: () => [[I.PUFFER, 1], Math.random() < 0.05 ? [I.BONE_MEAL, 1] : null],
    model: { type: "puffer", parts: [
      { name: "body", size: [5, 5, 5], pivot: [0, 3, 0], off: [0, 0, 0], paint: { all: P => { P.fill(PUFF); for (let i = 0; i < 10; i++) P.px(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), "#8a7a3a"); }, bottom: solid(["#f4e8b0"]),
        front: face(PUFF, P => { P.rect(1, 4, 4, 4, "#111"); P.rect(11, 4, 4, 4, "#111"); P.rect(6, 10, 4, 2, "#c86a3a"); }) } },
      { name: "finR", size: [1, 2, 2], pivot: [-2.5, 3, 1], off: [-0.5, 0, 0], paint: { all: solid(["#5a8ab0"]) } },
      { name: "finL", size: [1, 2, 2], pivot: [2.5, 3, 1], off: [0.5, 0, 0], paint: { all: solid(["#5a8ab0"]) } },
      { name: "tail", size: [1, 3, 2], pivot: [0, 3, -2.5], off: [0, 0, -1], paint: { all: solid(["#5a8ab0"]) } }] } },
  squid: { name: "Inkling", swims: true, hp: 10, speed: 1.6, w: 0.8, h: 1.25, ai: "squid", xp: 2, sound: "blub",
    drops: () => [[I.INK_SAC, randi(1, 3)]],
    model: { type: "squid", parts: [
      { name: "body", size: [10, 12, 10], pivot: [0, 14, 0], off: [0, 0, 0], paint: { all: solid(INK), front: face(INK, P => { P.rect(1, 9, 4, 4, "#f0f0f0"); P.rect(2, 10, 2, 2, "#111"); P.rect(11, 9, 4, 4, "#f0f0f0"); P.rect(12, 10, 2, 2, "#111"); }) } },
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * Math.PI * 2; return { name: "t" + i, size: [2, 8, 2], pivot: [Math.cos(a) * 3.5, 8, Math.sin(a) * 3.5], off: [0, -4, 0], paint: { all: solid(["#1e2c48", "#24344e"]) }, ang: a }; })] } },
  dolphin: { name: "Splasher", swims: true, neutral: true, hp: 10, speed: 5.5, w: 0.9, h: 0.6, ai: "dolphin", dmg: 3, reach: 1.6, xp: 2, sound: "click", dryTime: 60,
    drops: () => [[I.RAW_MINNOW, randi(0, 1)]],
    model: { type: "dolphin", parts: [
      { name: "body", size: [8, 7, 16], pivot: [0, 4, 0], off: [0, 0, 0], paint: { all: solid(DOLPH), bottom: solid(BELLY), front: face(DOLPH, P => { P.rect(0, 4, 3, 3, "#111"); P.rect(13, 4, 3, 3, "#111"); }) } },
      { name: "snout", parent: "body", size: [3, 3, 4], pivot: [0, -1.5, 8], off: [0, 0, 2], paint: { all: solid(["#9aaac0"]), bottom: solid(BELLY) } },
      { name: "dorsal", parent: "body", size: [1, 4, 4], pivot: [0, 3.5, -1], off: [0, 2, 0], paint: { all: solid(["#6a7a90"]) } },
      { name: "finR", parent: "body", size: [5, 1, 3], pivot: [-4, -2.5, 3], off: [-2.5, 0, 0], paint: { all: solid(["#6a7a90"]) } },
      { name: "finL", parent: "body", size: [5, 1, 3], pivot: [4, -2.5, 3], off: [2.5, 0, 0], paint: { all: solid(["#6a7a90"]) } },
      { name: "tail", size: [4, 4, 9], pivot: [0, 4, -8], off: [0, 0, -4.5], paint: { all: solid(DOLPH), bottom: solid(BELLY) } },
      { name: "fluke", parent: "tail", size: [10, 1, 4], pivot: [0, 0, -4.5], off: [0, 0, -1.5], paint: { all: solid(["#6a7a90"]) } }] } },
  boat: { name: "Boat", boat: true, object: true, persist: true, hp: 3, speed: 0, w: 1.3, h: 0.6, ai: "boat", xp: 0, sound: "", drops: () => [[I.BOAT, 1]],
    model: { type: "boat", parts: [
      { name: "bottom", size: [20, 2, 28], pivot: [0, 1, 0], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "sideR", size: [2, 6, 28], pivot: [-11, 4, 0], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "sideL", size: [2, 6, 28], pivot: [11, 4, 0], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "bow", size: [20, 6, 2], pivot: [0, 4, 13], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "stern", size: [20, 6, 2], pivot: [0, 4, -13], off: [0, 0, 0], paint: { all: plankPaint } }] } },
  chest_boat: { name: "Boat with Chest", boat: true, object: true, persist: true, invSize: 27, hp: 3, speed: 0, w: 1.3, h: 0.6, ai: "boat", xp: 0, sound: "", drops: () => [[I.CHEST_BOAT, 1]],
    model: { type: "boat", parts: [
      { name: "bottom", size: [20, 2, 28], pivot: [0, 1, 0], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "sideR", size: [2, 6, 28], pivot: [-11, 4, 0], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "sideL", size: [2, 6, 28], pivot: [11, 4, 0], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "bow", size: [20, 6, 2], pivot: [0, 4, 13], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "stern", size: [20, 6, 2], pivot: [0, 4, -13], off: [0, 0, 0], paint: { all: plankPaint } },
      { name: "chest", size: [12, 10, 10], pivot: [0, 7, -7], off: [0, 0, 0], paint: { all: CHESTP } }] } },
  ...cartSpecies(),
  fox: { name: "Pouncer", animal: true, hp: 10, speed: 2.8, w: 0.6, h: 0.7, ai: "fox", food: [I.BERRIES], xp: 2, sound: "yip",
    drops: e => [e.held ? [e.held, 1] : null],
    model: { type: "quad", parts: [...quadParts({ body: [6, 6, 10], head: [8, 6, 6], leg: 2, legH: 6, headUp: 2,
      bodyPaint: { all: solid(FOX), bottom: solid(["#f4ece0"]) }, legPaint: { all: solid(["#2a2018"]) },
      headPaint: { all: solid(FOX), front: face(FOX, P => { P.rect(0, 9, 16, 7, "#f4ece0"); P.rect(2, 5, 3, 2, "#1a1a1a"); P.rect(11, 5, 3, 2, "#1a1a1a"); }) } }),
      { name: "snout", parent: "head", size: [4, 3, 3], pivot: [0, -1.5, 3], off: [0, 0, 1.5], paint: { all: solid(["#f4ece0"]), front: P => { P.fill(["#f4ece0"]); P.rect(5, 0, 6, 5, "#1a1a1a"); } } },
      { name: "earR", parent: "head", size: [2, 3, 1], pivot: [-2.5, 3, 0], off: [0, 1.5, 0], paint: { all: solid(FOX), front: solid(["#2a2018"]) } },
      { name: "earL", parent: "head", size: [2, 3, 1], pivot: [2.5, 3, 0], off: [0, 1.5, 0], paint: { all: solid(FOX), front: solid(["#2a2018"]) } },
      { name: "tail", size: [4, 4, 10], pivot: [0, 9, -5], off: [0, 0, -5], paint: { all: P => { P.fill(FOX); P.rect(0, 11, 16, 5, "#f4ece0"); }, back: solid(["#f4ece0"]) } }] } },
  bee: { name: "Buzzer", persist: true, breeds: true, neutral: true, flies: true, hp: 10, speed: 2.6, w: 0.5, h: 0.55, ai: "bee", dmg: 2, reach: 1.6, food: [B.FLOWER_RED, B.FLOWER_YELLOW], xp: 1, sound: "buzz", drops: () => [],
    model: { type: "bee", parts: [
      { name: "body", size: [6, 6, 8], pivot: [0, 5, 0], off: [0, 0, 0], paint: { all: P => { P.fill(BEEY); P.rect(4, 0, 3, 16, "#2a2018"); P.rect(10, 0, 3, 16, "#2a2018"); },
        top: P => { P.fill(BEEY); P.rect(0, 4, 16, 3, "#2a2018"); P.rect(0, 10, 16, 3, "#2a2018"); },
        front: face(BEEY, P => { P.rect(1, 3, 5, 6, "#1a1a1a"); P.rect(10, 3, 5, 6, "#1a1a1a"); P.rect(4, 0, 1, 3, "#1a1a1a"); P.rect(11, 0, 1, 3, "#1a1a1a"); }) } },
      { name: "stinger", parent: "body", size: [1, 1, 2], pivot: [0, -1, -4], off: [0, 0, -1], paint: { all: solid(["#3a3a3a"]) } },
      { name: "wingR", parent: "body", size: [5, 1, 4], pivot: [-1, 3.5, 1], off: [-2.5, 0, 0], paint: { all: solid(["#d8ecf4", "#e4f2f8"]) } },
      { name: "wingL", parent: "body", size: [5, 1, 4], pivot: [1, 3.5, 1], off: [2.5, 0, 0], paint: { all: solid(["#d8ecf4", "#e4f2f8"]) } }] } },
  parrot: { name: "Chatterbird", animal: true, pet: true, flies: true, lands: true, hp: 6, speed: 2.4, w: 0.4, h: 0.85, ai: "parrot", food: [I.SEEDS], xp: 1, sound: "squawk",
    tameWith: [I.SEEDS], tameChance: 0.34, drops: () => [[I.FEATHER, randi(1, 2)]],
    variants: [{ body: "#d8302a", wing: "#2a6ad8", head: "#d8302a" }, { body: "#2a5ad8", wing: "#f0c020", head: "#2a5ad8" }, { body: "#3aa83a", wing: "#d8302a", head: "#e8d020" },
      { body: "#2ac0c8", wing: "#f4f4f4", head: "#f0c020" }, { body: "#a8a8a8", wing: "#e8e8e8", head: "#f0c020" }],
    model: { type: "parrot", parts: [
      { name: "body", size: [4, 6, 4], pivot: [0, 7, 0], off: [0, 0, 0], paint: { all: (P, f, v) => P.fill([v.body]) } },
      { name: "head", size: [4, 4, 4], pivot: [0, 10, 0], off: [0, 2, 0.5], paint: { all: (P, f, v) => P.fill([v.head]),
        front: (P, f, v) => { P.fill([v.head]); P.rect(0, 5, 4, 4, "#f4f4f4"); P.rect(1, 6, 2, 2, "#111"); P.rect(12, 5, 4, 4, "#f4f4f4"); P.rect(13, 6, 2, 2, "#111"); } } },
      { name: "beak", parent: "head", size: [1, 2, 2], pivot: [0, -0.5, 2], off: [0, 0, 1], paint: { all: solid(["#3a3a3a"]) } },
      { name: "wingR", size: [1, 5, 3], pivot: [-2.5, 9.5, 0], off: [0, -2.5, 0], paint: { all: (P, f, v) => P.fill([v.wing]) } },
      { name: "wingL", size: [1, 5, 3], pivot: [2.5, 9.5, 0], off: [0, -2.5, 0], paint: { all: (P, f, v) => P.fill([v.wing]) } },
      { name: "tail", size: [3, 5, 1], pivot: [0, 5, -2], off: [0, -2.5, -0.5], paint: { all: (P, f, v) => P.fill([v.wing]) } },
      { name: "legR", size: [1, 4, 1], pivot: [-1, 4, 0], off: [0, -2, 0], paint: { all: solid(["#6a6a6a"]) } },
      { name: "legL", size: [1, 4, 1], pivot: [1, 4, 0], off: [0, -2, 0], paint: { all: solid(["#6a6a6a"]) } }] } }
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
// ----- Cindermaw, the Ember Dragon (final boss of Survival), and its Ember Pylons -----
const CSCALE = ["#2a1a16", "#22140f", "#30201a", "#1c120e"], CEMBER = ["#ff7a1a", "#ffb030", "#e05a10"], CWING = ["#3a1410", "#30100c", "#42180f"];
// dark volcanic scales split by glowing cracks
const cracked = (n = 5) => P => { P.fill(CSCALE); for (let i = 0; i < n; i++) { let x = Math.floor(Math.random() * 16), y = Math.floor(Math.random() * 16); for (let k = 0; k < 6; k++) { P.px(x, y, CEMBER[Math.floor(Math.random() * 3)]); x += Math.random() < 0.5 ? 1 : -1; y += Math.random() < 0.7 ? 1 : 0; } } };
const veined = P => { P.fill(CWING); for (let x = 1; x < 16; x += 5) for (let y = 0; y < 16; y++) P.px(x + (y % 5 === 0 ? 1 : 0), y, "#c84a10"); };
Object.assign(SPECIES, {
  cindermaw: { name: "Cindermaw, the Ember Dragon", boss: true, noSave: true, hostile: true, hp: 320, speed: 11, w: 4.5, h: 3, ai: "cindermaw", flies: true, noclip: true, fireproof: true, dmg: 7, xp: 0, sound: "roar", deathPuff: "ember",
    drops: () => [],
    model: { type: "cindermaw", parts: [
      { name: "body", size: [34, 22, 46], pivot: [0, 46, 0], off: [0, 0, 0], paint: { all: cracked(6), top: P => { cracked(4)(P); for (let y = 0; y < 16; y += 3) P.rect(6, y, 4, 2, "#4a2a1e"); } } },
      { name: "spikes", parent: "body", size: [4, 8, 40], pivot: [0, 13, 0], off: [0, 2, 0], paint: { all: solid(["#1a0e0a", "#24140e"]), top: solid(CEMBER) } },
      { name: "neck", size: [14, 14, 30], pivot: [0, 50, 22], off: [0, 0, 15], paint: { all: cracked(4) } },
      { name: "head", parent: "neck", size: [22, 16, 26], pivot: [0, 2, 15], off: [0, 0, 12], paint: { all: cracked(3), front: face(CSCALE, P => { P.rect(1, 3, 5, 3, "#ffd34d"); P.rect(10, 3, 5, 3, "#ffd34d"); P.rect(2, 4, 3, 1, "#fff6c0"); P.rect(11, 4, 3, 1, "#fff6c0"); P.rect(3, 11, 2, 2, "#120808"); P.rect(11, 11, 2, 2, "#120808"); }) } },
      { name: "hornL", parent: "head", size: [3, 3, 12], pivot: [7, 8, -6], off: [0, 1, -5], paint: { all: solid(["#1a0e0a", "#2a1a12"]) } },
      { name: "hornR", parent: "head", size: [3, 3, 12], pivot: [-7, 8, -6], off: [0, 1, -5], paint: { all: solid(["#1a0e0a", "#2a1a12"]) } },
      { name: "jaw", parent: "head", size: [18, 6, 22], pivot: [0, -8, 0], off: [0, -3, 10], paint: { all: cracked(2), top: solid(["#ff7a1a", "#e05a10"]) } },
      { name: "wingL", size: [64, 4, 40], pivot: [17, 56, 8], off: [32, 0, 0], paint: { all: veined } },
      { name: "wingTipL", parent: "wingL", size: [56, 2, 32], pivot: [32, 0, 0], off: [28, 0, -3], paint: { all: veined } },
      { name: "wingR", size: [64, 4, 40], pivot: [-17, 56, 8], off: [-32, 0, 0], paint: { all: veined } },
      { name: "wingTipR", parent: "wingR", size: [56, 2, 32], pivot: [-32, 0, 0], off: [-28, 0, -3], paint: { all: veined } },
      { name: "tail", size: [12, 12, 26], pivot: [0, 46, -23], off: [0, 0, -13], paint: { all: cracked(3) } },
      { name: "tail2", parent: "tail", size: [10, 10, 24], pivot: [0, 0, -13], off: [0, 0, -12], paint: { all: cracked(3) } },
      { name: "tail3", parent: "tail2", size: [8, 8, 22], pivot: [0, 0, -12], off: [0, 0, -11], paint: { all: cracked(2) } },
      { name: "tail4", parent: "tail3", size: [6, 6, 20], pivot: [0, 0, -11], off: [0, 0, -10], paint: { all: cracked(2), back: solid(CEMBER) } },
      ...[[-13, 16, "legFR"], [13, 16, "legFL"], [-13, -16, "legBR"], [13, -16, "legBL"]].map(([x, z, name]) => ({ name, size: [9, 22, 9], pivot: [x, 36, z], off: [0, -11, 0], paint: { all: cracked(2) } }))] } },
  pylon: { name: "Ember Pylon", noSave: true, hp: 6, w: 1.4, h: 2.4, ai: "crystal", static: true, fireproof: true, xp: 0, sound: "crystal", drops: () => [],
    model: { type: "crystal", parts: [
      { name: "cage", size: [14, 14, 14], pivot: [0, 18, 0], off: [0, 0, 0], paint: { all: P => { P.clear(); P.rect(0, 0, 16, 2, "#ffb030"); P.rect(0, 14, 16, 2, "#ffb030"); P.rect(0, 0, 2, 16, "#ffb030"); P.rect(14, 0, 2, 16, "#ffb030"); } } },
      { name: "core", size: [8, 8, 8], pivot: [0, 18, 0], off: [0, 0, 0], paint: { all: solid(["#ff7a1a", "#ffd34d", "#e05a10"]) } },
      { name: "base", size: [16, 4, 16], pivot: [0, 0, 0], off: [0, 2, 0], paint: { all: solid(["#2a1a1a", "#3a2420"]) } }] } }
});
// ----- the Lost Civilization: creatures of Echohold and the Echo Expanse. Listeners (hears) only notice you by sound
// or when you come very close; they give up and go home (leash) if you get away.
const HUSH = ["#0e2a30", "#103036", "#14404a"], GLOWT = ["#5ae0d0", "#8af0e8"], KSTONE = ["#3a3e48", "#444852", "#34383f"], COPPER = ["#b8703a", "#a8642e", "#c87e44"], ECHO = ["#5a6a8a", "#52627e", "#647494"];
// The Blight Tempest (Legacy Campaign, Chapter 4), drawn from the "Legacy Campaign Legends" concept sheet: a giant of
// cracked, blight-stained stone with the Blightking's crown, huge block fists, no legs (its lower body trails off into
// floating rubble), and a tilted ring of rusty blocks spinning around it.
function tempestParts() {
  const ST = ["#5a5058", "#4e4650", "#655a62", "#544a52"], RUST = ["#7a4436", "#8a4e3c", "#6a3a2e"];
  const crack = (P, seed) => { P.fill(ST); spk(P, 5, ["#3e363e", "#70646c"]); P.rect(2 + seed % 5, 3, 1, 5, "#a8e040"); P.rect(3 + seed % 5, 7, 1, 4, "#a8e040"); P.rect(10 - seed % 3, 9, 4, 1, "#c8f060"); P.rect(12, 2, 2, 2, RUST[seed % 3]); };
  const stone = seed => ({ all: P => crack(P, seed) });
  const mats = [stone(1), stone(4), { all: P => { P.fill(RUST); spk(P, 6, ["#5a2e24", "#a0604a"]); } }, { all: P => { P.fill(["#6a6068", "#5e5660"]); P.rect(0, 7, 16, 1, "#3e363e"); P.rect(7, 0, 1, 7, "#3e363e"); } }];
  const parts = [
    { name: "body", size: [28, 26, 16], pivot: [0, 56, 0], off: [0, 0, 0], paint: { all: P => crack(P, 2), front: P => { crack(P, 0); P.rect(7, 0, 2, 16, "#2a242a"); P.rect(7, 2, 1, 12, "#a8e040"); } } },
    { name: "core", parent: "body", size: [4, 12, 1], pivot: [0, 0, 8], off: [0, 0, 0.6], paint: { all: P => { P.fill(["#b8f050"]); P.rect(5, 0, 6, 16, "#e8ff9a"); } } },
    { name: "hips", size: [20, 10, 12], pivot: [0, 38, 0], off: [0, 0, 0], paint: stone(3) },
    { name: "head", size: [14, 13, 14], pivot: [0, 69, 0], off: [0, 6.5, 0], paint: { all: P => crack(P, 1), front: face(ST, P => { P.rect(2, 6, 4, 2, "#ffb030"); P.rect(10, 6, 4, 2, "#ffb030"); P.rect(3, 6, 2, 1, "#ffe080"); P.rect(11, 6, 2, 1, "#ffe080"); P.rect(4, 11, 8, 2, "#2a242a"); }) } },
    { name: "crown", parent: "head", size: [16, 5, 16], pivot: [0, 15, 0], off: [0, 0, 0], paint: { all: P => { P.fill(["#5e5660"]); for (let x = 0; x < 16; x += 5) P.rect(x, 0, 3, 7, "#7a6e76"); P.rect(0, 11, 16, 5, "#3e363e"); P.rect(7, 2, 2, 3, "#a8e040"); } } }
  ];
  for (const [side, sign] of [["R", -1], ["L", 1]]) parts.push(
    { name: "arm" + side, size: [13, 13, 13], pivot: [sign * 21, 66, 0], off: [0, -2, 0], paint: stone(side === "R" ? 4 : 0) },
    { name: "fore" + side, parent: "arm" + side, size: [9, 16, 9], pivot: [0, -10, 0], off: [0, -6, 0], paint: stone(2) },
    { name: "fist" + side, parent: "arm" + side, size: [15, 13, 15], pivot: [0, -27, 0], off: [0, 0, 0], paint: { all: P => crack(P, side === "R" ? 3 : 1), bottom: solid(RUST) } });
  for (let i = 0; i < 18; i++) { const n = i < 6 ? 6 + (i % 3) * 2 : 8 + (i * 5) % 7; parts.push({ name: "d" + i, size: [n, n, n], pivot: [0, 0, 0], off: [0, 0, 0], paint: mats[(i * 3 + (i >> 2)) % mats.length] }); }
  return parts;
}
function verdantModel() {
  const bark = ["#694227", "#795031", "#875b38", "#59371f", "#74482b"];
  const foliage = ["#527717", "#688b20", "#799e24", "#8cb52b", "#3d5e14"];
  const grain = P => {
    P.fill(bark);
    for (const [x, y, h] of [[1, 0, 10], [5, 4, 12], [10, 0, 11], [14, 6, 10]]) {
      P.rect(x, y, 1, h, "#492d1b");
      P.rect(x + 1, y + 2, 1, h - 2, "#9b6940");
    }
  };
  const leaf = P => {
    P.fill(foliage);
    P.rect(1, 0, 2, 13, "#94b938");
    P.rect(7, 3, 3, 8, "#779e29");
    P.rect(13, 9, 3, 7, "#395714");
  };
  const rings = P => {
    P.fill(bark);
    for (const [inset, color] of [[1, "#a67547"], [3, "#4e2e1c"], [5, "#9b6840"], [7, "#50301d"]]) {
      P.rect(inset, inset, 16 - inset * 2, 16 - inset * 2, color);
    }
  };
  const wood = { all: grain };
  const leaves = { all: leaf, bottom: solid(["#405e15", "#47681a"]) };
  const part = (name, size, pivot, paint = wood, parent, off = [0, 0, 0]) =>
    ({ name, size, pivot, paint, parent, off });
  const parts = [
    part("body", [21, 20, 13], [0, 42, 0], wood, undefined, [0, 10, 0]),
    part("chestFrame", [13, 13, 4], [0, 1, 7], { all: grain, front: rings }, "body"),
    part("core", [8, 8, 1], [0, 1, 9.5], { all: P => {
      P.rect(0, 0, 16, 16, "#297809");
      P.rect(1, 1, 14, 14, "#73d212");
      P.rect(3, 3, 10, 10, "#b9ff32");
      P.rect(5, 5, 6, 6, "#e5ff8b");
      P.rect(6, 6, 3, 3, "#f5ffd4");
    } }, "body"),
    part("head", [12, 11, 11], [0, 61, 0], { all: grain, front: P => {
      grain(P);
      for (const x of [2, 10]) {
        P.rect(x - 1, 4, 5, 5, "#3b4318");
        P.rect(x, 5, 3, 3, "#99ff2c");
        P.rect(x, 5, 2, 2, "#ecffa8");
      }
      P.rect(5, 12, 6, 1, "#39251b");
    } }, undefined, [0, 5.5, 0]),
    part("browMoss", [13, 2, 10], [0, 5.5, 0], leaves, "head"),
    part("waist", [14, 5, 11], [0, 41, 0]),
    part("sash", [5, 8, 2], [0, 38, 6], leaves)
  ];
  for (const [side, sign] of [["R", -1], ["L", 1]]) {
    const arm = "arm" + side, leg = "leg" + side;
    parts.push(
      part(arm, [8, 26, 8], [15 * sign, 59, 0], wood, undefined, [0, -12, 0]),
      part("shoulder" + side, [12, 7, 12], [sign, 11, 0], wood, arm),
      part("canopy" + side, [13, 3, 13], [sign, 15, 0], leaves, arm),
      part("outerLeaves" + side, [4, 6, 10], [7 * sign, 11, 1], leaves, arm),
      part("frontLeaves" + side, [7, 4, 2], [2 * sign, 11, 7], leaves, arm),
      part("gauntlet" + side, [11, 11, 11], [sign, -10, 0], { all: grain, front: rings, left: rings, right: rings }, arm),
      part("wristMoss" + side, [10, 3, 10], [sign, -4, 0], leaves, arm),
      part(leg, [9, 21, 9], [6 * sign, 21, 0], wood, undefined, [0, -10.5, 0]),
      part("boot" + side, [11, 5, 13], [0, -8, 2], wood, leg),
      part("kneeMoss" + side, [7, 4, 2], [sign, 2, 5], leaves, leg),
      part("branchBase" + side, [5, 3, 3], [5 * sign, 6, -1], wood, "head"),
      part("branchMid" + side, [5, 3, 3], [8 * sign, 8, -1], wood, "head"),
      part("branchTip" + side, [4, 5, 4], [10 * sign, 10, -1], leaves, "head"),
      part("outerBud" + side, [3, 4, 3], [12 * sign, 12, -1], leaves, "head"),
      part("innerBud" + side, [3, 6, 3], [4 * sign, 9, -2], leaves, "head")
    );
  }
  return { type: "warden", parts };
}

const spk = (P, n, c) => { for (let i = 0; i < n; i++) P.px(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), c[i % c.length]); };
const glowSpots = (pal) => P => { P.fill(pal); for (let i = 0; i < 5; i++) P.rect(Math.floor(Math.random() * 13), Math.floor(Math.random() * 13), 2, 2, GLOWT[i % 2]); };
const coreFace = (pal, eye = "#5ae0d0") => face(pal, P => { P.rect(4, 5, 8, 6, "#0a1a20"); P.rect(6, 6, 4, 4, eye); });
Object.assign(SPECIES, {
  crawler: { name: "Hush Crawler", hostile: true, noSave: true, hears: true, hp: 8, speed: 3.4, w: 0.8, h: 0.5, ai: "melee", dmg: 2, reach: 1.2, xp: 3, sound: "chitter", leash: 24,
    drops: () => [Math.random() < 0.4 ? [I.ECHO_SHARD, 1] : null],
    model: { type: "spider", parts: spiderModel(HUSH).parts } },
  sentinel_e: { name: "Echo Sentinel", hostile: true, noSave: true, hears: true, hp: 30, speed: 1.2, w: 1, h: 2.2, ai: "pulse", dmg: 4, reach: 5, xp: 8, sound: "clank", leash: 16,
    drops: () => [[I.IRON_INGOT, randi(1, 3)], [I.LUMEN_SHARD, randi(0, 2)]],
    model: { type: "golem", parts: [
      { name: "body", size: [12, 14, 8], pivot: [0, 16, 0], off: [0, 7, 0], paint: { all: solid(COPPER), front: face(COPPER, P => { P.rect(5, 5, 6, 6, "#0a1a20"); P.rect(6, 6, 4, 4, "#5ae0d0"); }) } },
      { name: "head", size: [8, 6, 8], pivot: [0, 30, 0], off: [0, 3, 0], paint: { all: solid(KSTONE), front: coreFace(KSTONE) } },
      { name: "armR", size: [4, 14, 4], pivot: [-8, 28, 0], off: [0, -7, 0], paint: { all: solid(KSTONE) } },
      { name: "armL", size: [4, 14, 4], pivot: [8, 28, 0], off: [0, -7, 0], paint: { all: solid(KSTONE) } },
      { name: "legR", size: [4, 16, 4], pivot: [-3, 16, 0], off: [0, -8, 0], paint: { all: solid(KSTONE) } },
      { name: "legL", size: [4, 16, 4], pivot: [3, 16, 0], off: [0, -8, 0], paint: { all: solid(KSTONE) } }] } },
  stalker: { name: "Deep Stalker", hostile: true, noSave: true, hears: true, hp: 30, speed: 3.8, w: 0.6, h: 2.6, ai: "melee", dmg: 5, reach: 2, xp: 10, sound: "warble", leash: 30,
    drops: () => [[I.LUMEN_SHARD, randi(1, 2)], Math.random() < 0.5 ? [I.ECHO_SHARD, 2] : null],
    model: { type: "humanoid", parts: humanoidParts({ legLen: 22, limb: [2, 22, 2], head: { all: solid(HUSH), front: face(HUSH, P => { P.rect(5, 6, 6, 3, "#5ae0d0"); }) }, body: { all: glowSpots(HUSH) }, arm: { all: solid(HUSH) }, leg: { all: solid(HUSH) } }) } },
  mote: { name: "Resonance Mote", hostile: true, noSave: true, hears: true, hp: 4, speed: 2.6, w: 0.5, h: 0.5, ai: "mote", flies: true, dmg: 2, reach: 2.2, xp: 2, sound: "crystal", leash: 14,
    drops: () => [[I.LUMEN_SHARD, 1]],
    model: { type: "crystal", parts: [
      { name: "cage", size: [8, 8, 8], pivot: [0, 4, 0], off: [0, 0, 0], paint: { all: P => { P.clear(); P.rect(0, 0, 16, 2, "#5ae0d0"); P.rect(0, 14, 16, 2, "#5ae0d0"); P.rect(0, 0, 2, 16, "#5ae0d0"); P.rect(14, 0, 2, 16, "#5ae0d0"); } } },
      { name: "core", size: [4, 4, 4], pivot: [0, 4, 0], off: [0, 0, 0], paint: { all: solid(["#c8ffff", "#8af0e8"]) } },
      { name: "base", size: [1, 1, 1], pivot: [0, 0, 0], off: [0, 0, 0], paint: { all: solid(GLOWT) } }] } },
  guardian: { name: "Dormant Guardian", hostile: true, noSave: true, hp: 60, speed: 1.8, w: 1.4, h: 2.8, ai: "melee", dmg: 8, reach: 2.4, xp: 15, sound: "clank", knockUp: true, leash: 14,
    drops: () => [[I.IRON_INGOT, randi(3, 6)], [I.LUMEN_SHARD, randi(2, 4)]],
    model: { type: "golem", parts: [
      { name: "body", size: [18, 12, 11], pivot: [0, 31, 0], off: [0, 6, 0], paint: { all: solid(KSTONE), front: face(KSTONE, P => { P.rect(6, 4, 4, 4, "#5ae0d0"); }) } },
      { name: "waist", size: [9, 5, 6], pivot: [0, 26, 0], off: [0, 2.5, 0], paint: { all: solid(COPPER) } },
      { name: "head", size: [8, 8, 8], pivot: [0, 43, -1], off: [0, 4, 0], paint: { all: solid(KSTONE), front: coreFace(KSTONE) } },
      { name: "nose", parent: "head", size: [2, 2, 2], pivot: [0, -1, 5], off: [0, 0, 0], paint: { all: solid(COPPER) } },
      { name: "armR", size: [5, 28, 6], pivot: [-11, 42, 0], off: [0, -13, 0], paint: { all: solid(KSTONE) } },
      { name: "armL", size: [5, 28, 6], pivot: [11, 42, 0], off: [0, -13, 0], paint: { all: solid(KSTONE) } },
      { name: "legR", size: [6, 26, 5], pivot: [-4, 26, 0], off: [0, -13, 0], paint: { all: solid(COPPER) } },
      { name: "legL", size: [6, 26, 5], pivot: [4, 26, 0], off: [0, -13, 0], paint: { all: solid(COPPER) } }] } },
  knight: { name: "Echo Knight", hostile: true, noSave: true, hp: 26, speed: 2.6, w: 0.6, h: 2, ai: "melee", dmg: 5, reach: 1.8, xp: 8, sound: "clank", shielded: true, leash: 20,
    drops: () => [[I.LUMEN_SHARD, randi(1, 2)]],
    model: { type: "humanoid", parts: [...humanoidParts({ legLen: 12, limb: [4, 12, 4], head: { all: solid(ECHO), front: face(ECHO, P => { P.rect(2, 6, 12, 2, "#0a1a20"); P.rect(4, 6, 2, 2, "#8af0e8"); P.rect(10, 6, 2, 2, "#8af0e8"); }) }, body: { all: solid(ECHO) }, arm: { all: solid(ECHO) }, leg: { all: solid(["#3a4a6a"]) } }),
      { name: "shield", parent: "armL", size: [2, 14, 12], pivot: [3, -6, 3], off: [0, 0, 0], paint: { all: solid(["#2a3a5a"]), right: P => { P.fill(["#2a3a5a"]); P.rect(5, 3, 6, 10, "#5ae0d0"); } } }] } },
  shard_scout: { name: "Shard Scout", hostile: true, noSave: true, hp: 10, speed: 3.4, w: 0.8, h: 0.6, ai: "melee", flies: true, dmg: 3, reach: 1.6, xp: 5, sound: "crystal", leash: 18,
    drops: () => [[I.LUMEN_SHARD, 1]],
    model: { type: "chicken", parts: [
      { name: "body", size: [6, 4, 8], pivot: [0, 6, 0], off: [0, 0, 0], paint: { all: solid(ECHO) } },
      { name: "head", size: [4, 4, 4], pivot: [0, 7, 5], off: [0, 0, 1], paint: { all: solid(ECHO), front: coreFace(ECHO) } },
      { name: "wingR", size: [10, 1, 6], pivot: [-3, 7, 0], off: [-5, 0, 0], paint: { all: solid(["#8ad8ff", "#c8f0ff"]) } },
      { name: "wingL", size: [10, 1, 6], pivot: [3, 7, 0], off: [5, 0, 0], paint: { all: solid(["#8ad8ff", "#c8f0ff"]) } },
      { name: "legR", size: [1, 2, 1], pivot: [-1, 4, 0], off: [0, -1, 0], paint: { all: solid(ECHO) } },
      { name: "legL", size: [1, 2, 1], pivot: [1, 4, 0], off: [0, -1, 0], paint: { all: solid(ECHO) } }] } },
  burrower: { name: "Crystal Burrower", hostile: true, noSave: true, hp: 18, speed: 2.8, w: 1, h: 0.8, ai: "melee", dmg: 4, reach: 1.6, xp: 6, sound: "chitter", burrows: true, leash: 16,
    drops: () => [[I.LUMEN_SHARD, randi(1, 3)]],
    model: { type: "spider", parts: spiderModel(["#7ab8ff", "#a8d8ff", "#5a8ad8"]).parts } },
  // ----- the bosses (their fights are in js/lost-bosses.js) -----
  // ----- the temples' creatures and guardians -----
  tidecrab: { name: "Tide Crab", hostile: true, noSave: true, hp: 10, speed: 2.8, w: 0.9, h: 0.6, ai: "melee", dmg: 3, reach: 1.4, xp: 4, sound: "chitter", leash: 16,
    drops: () => [Math.random() < 0.5 ? [I.COOKED_MINNOW, 1] : null], model: { type: "spider", parts: spiderModel(["#2a8aa8", "#3a9ab8", "#1a6a88"]).parts } },
  vinewalker: { name: "Vinewalker", hostile: true, noSave: true, hp: 18, speed: 2.4, w: 0.6, h: 1.9, ai: "melee", dmg: 3, reach: 1.6, xp: 5, sound: "groan", leash: 18,
    drops: () => [Math.random() < 0.4 ? [I.APPLE, 1] : null],
    model: { type: "humanoid", armsOut: true, parts: humanoidParts({ legLen: 12, limb: [4, 12, 4], head: { all: solid(["#3f6a2c", "#4a7a33"]), front: face(["#3f6a2c"], P => { P.rect(4, 6, 2, 2, "#e8f070"); P.rect(10, 6, 2, 2, "#e8f070"); }) }, body: { all: P => { P.fill(["#5a4a2a", "#4a3a20"]); spk(P, 8, ["#3f8a2c", "#56a63b"]); } }, arm: { all: solid(["#3f8a2c", "#357a25"]) }, leg: { all: solid(["#5a4a2a"]) } }) } },
  sunscarab: { name: "Sun Scarab", hostile: true, noSave: true, hp: 12, speed: 3, w: 0.8, h: 0.5, ai: "melee", dmg: 3, reach: 1.4, xp: 4, sound: "chitter", leash: 16,
    drops: () => [Math.random() < 0.3 ? [I.GOLD_NUGGET, randi(1, 3)] : null], model: { type: "spider", parts: spiderModel(["#c89a30", "#e0b840", "#a07a20"]).parts } },
  regent: { name: "The Abyssal Regent", boss: true, lostBoss: true, noSave: true, hostile: true, hp: 300, speed: 2.2, w: 2.2, h: 3.6, ai: "templeboss", fireproof: true, dmg: 7, reach: 3, xp: 0, sound: "roar", deathPuff: "splash", drops: () => [],
    model: { type: "warden", parts: [
      { name: "body", size: [22, 16, 14], pivot: [0, 34, 0], off: [0, 8, 0], paint: { all: P => { P.fill(["#2a6a78", "#2e7280", "#26626e"]); for (let y = 2; y < 16; y += 4) P.rect(0, y, 16, 1, "#1a4a56"); } } },
      { name: "core", parent: "body", size: [8, 8, 2], pivot: [0, 8, 7], off: [0, 0, 1], paint: { all: solid(["#8af0ff", "#c8ffff"]) } },
      { name: "head", size: [12, 10, 12], pivot: [0, 50, 0], off: [0, 5, 0], paint: { all: solid(["#2a6a78"]), front: face(["#2a6a78"], P => { P.rect(3, 5, 3, 2, "#c8ffff"); P.rect(10, 5, 3, 2, "#c8ffff"); P.rect(4, 10, 8, 2, "#1a3a46"); }) } },
      { name: "finL", parent: "head", size: [2, 10, 8], pivot: [7, 6, 0], off: [1, 3, 0], paint: { all: solid(["#3aa0b0", "#8af0e0"]) } },
      { name: "finR", parent: "head", size: [2, 10, 8], pivot: [-7, 6, 0], off: [-1, 3, 0], paint: { all: solid(["#3aa0b0", "#8af0e0"]) } },
      { name: "armR", size: [8, 24, 8], pivot: [-15, 48, 0], off: [0, -11, 0], paint: { all: solid(["#2a6a78", "#3a8a96"]) } },
      { name: "armL", size: [8, 24, 8], pivot: [15, 48, 0], off: [0, -11, 0], paint: { all: solid(["#2a6a78", "#3a8a96"]) } },
      { name: "legR", size: [8, 18, 8], pivot: [-6, 18, 0], off: [0, -9, 0], paint: { all: solid(["#1a4a56"]) } },
      { name: "legL", size: [8, 18, 8], pivot: [6, 18, 0], off: [0, -9, 0], paint: { all: solid(["#1a4a56"]) } }] } },
  vcolossus: { name: "The Verdant Colossus", boss: true, lostBoss: true, noSave: true, hostile: true, hp: 320, speed: 1.8, w: 2.4, h: 4.4, ai: "templeboss", dmg: 8, reach: 3.2, xp: 0, sound: "roar", deathPuff: "xp", drops: () => [],
    model: verdantModel() },
  scolossus: { name: "The Solar Colossus", boss: true, lostBoss: true, noSave: true, hostile: true, hp: 340, speed: 1.6, w: 2.4, h: 4.6, ai: "templeboss", fireproof: true, dmg: 8, reach: 3.2, xp: 0, sound: "roar", deathPuff: "ember", drops: () => [],
    model: { type: "warden", parts: [
      { name: "body", size: [20, 20, 12], pivot: [0, 42, 0], off: [0, 10, 0], paint: { all: P => { P.fill(["#e0c47a", "#d8bc72"]); for (let y = 3; y < 16; y += 5) P.rect(0, y, 16, 1, "#a07a30"); } } },
      { name: "core", parent: "body", size: [8, 8, 2], pivot: [0, 10, 6], off: [0, 0, 1], paint: { all: solid(["#fff4a0", "#ffffff"]) } },
      { name: "head", size: [12, 12, 12], pivot: [0, 62, 0], off: [0, 6, 0], paint: { all: solid(["#e0c47a"]), front: face(["#e0c47a"], P => { P.rect(3, 6, 3, 2, "#5a3a10"); P.rect(10, 6, 3, 2, "#5a3a10"); P.rect(6, 10, 4, 1, "#a07a30"); }) } },
      { name: "finL", parent: "head", size: [18, 18, 1], pivot: [0, 8, -7], off: [0, 3, 0], paint: { all: P => { P.clear(); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 8) P.px(x, y, d < 5 ? "#f8d860" : "#f0a030"); } } } },
      { name: "finR", parent: "head", size: [1, 1, 1], pivot: [0, 0, 0], off: [0, 0, 0], paint: { all: solid(["#e0c47a"]) } },
      { name: "armR", size: [8, 30, 8], pivot: [-14, 60, 0], off: [0, -14, 0], paint: { all: solid(["#d8bc72", "#c8ac62"]) } },
      { name: "armL", size: [8, 30, 8], pivot: [14, 60, 0], off: [0, -14, 0], paint: { all: solid(["#d8bc72", "#c8ac62"]) } },
      { name: "legR", size: [9, 22, 9], pivot: [-5, 22, 0], off: [0, -11, 0], paint: { all: solid(["#b8944a"]) } },
      { name: "legL", size: [9, 22, 9], pivot: [5, 22, 0], off: [0, -11, 0], paint: { all: solid(["#b8944a"]) } }] } },
  // ----- the Legacy Campaign's chapter bosses (fights run in js/campaign-bosses.js) -----
  stoneguard: { name: "The Ancient Stone Guardian", boss: true, lostBoss: true, cpBoss: true, noSave: true, hostile: true, hp: 240, speed: 1.9, w: 2.2, h: 4, ai: "cpboss", fireproof: true, dmg: 6, reach: 3, xp: 0, sound: "roar", deathPuff: "pale", drops: () => [],
    model: { type: "warden", parts: [
      { name: "body", size: [22, 20, 14], pivot: [0, 40, 0], off: [0, 10, 0], paint: { all: P => { P.fill(["#8a8a8a", "#7a7a7a", "#949494"]); for (let y = 3; y < 16; y += 5) P.rect(0, y, 16, 1, "#5a5a5a"); P.rect(6, 4, 4, 1, "#f0c050"); P.rect(7, 4, 2, 8, "#f0c050"); } } },
      { name: "core", parent: "body", size: [6, 6, 2], pivot: [0, 10, 7], off: [0, 0, 1], paint: { all: solid(["#f0c050", "#fff0a0"]) } },
      { name: "head", size: [12, 10, 12], pivot: [0, 60, 0], off: [0, 5, 0], paint: { all: solid(["#8a8a8a", "#7a7a7a"]), front: face(["#8a8a8a"], P => { P.rect(3, 4, 3, 2, "#f0c050"); P.rect(10, 4, 3, 2, "#f0c050"); P.rect(4, 9, 8, 2, "#4a4a4a"); }) } },
      { name: "armR", size: [9, 28, 9], pivot: [-15, 58, 0], off: [0, -13, 0], paint: { all: P => { P.fill(["#7a7a7a", "#6a6a6a"]); spk(P, 6, ["#5a8a4a"]); } } },
      { name: "armL", size: [9, 28, 9], pivot: [15, 58, 0], off: [0, -13, 0], paint: { all: P => { P.fill(["#7a7a7a", "#6a6a6a"]); spk(P, 6, ["#5a8a4a"]); } } },
      { name: "legR", size: [9, 20, 9], pivot: [-6, 20, 0], off: [0, -10, 0], paint: { all: solid(["#6a6a6a", "#5e5e5e"]) } },
      { name: "legL", size: [9, 20, 9], pivot: [6, 20, 0], off: [0, -10, 0], paint: { all: solid(["#6a6a6a", "#5e5e5e"]) } }] } },
  pharaoh: { name: "The Desert Pharaoh", boss: true, lostBoss: true, cpBoss: true, noSave: true, hostile: true, hp: 360, speed: 2.1, w: 1.6, h: 3.8, ai: "cpboss", fireproof: true, dmg: 7, reach: 2.6, xp: 0, sound: "roar", deathPuff: "ember", drops: () => [],
    model: { type: "warden", parts: [
      { name: "body", size: [16, 22, 10], pivot: [0, 40, 0], off: [0, 11, 0], paint: { all: P => { P.fill(["#e8dcc0", "#ded0b0"]); for (let y = 2; y < 16; y += 3) P.rect(0, y, 16, 1, "#c8b890"); P.rect(0, 0, 16, 3, "#2a6ab0"); P.rect(0, 1, 16, 1, "#f0c040"); } } },
      { name: "core", parent: "body", size: [6, 6, 2], pivot: [0, 14, 5], off: [0, 0, 1], paint: { all: solid(["#3ac8e0", "#a8f8ff"]) } },
      { name: "head", size: [12, 12, 12], pivot: [0, 62, 0], off: [0, 6, 0], paint: { all: P => { for (let x = 0; x < 16; x++) P.rect(x, 0, 1, 16, x % 4 < 2 ? "#f0c040" : "#2a5aa0"); }, front: face(["#c8a870"], P => { P.rect(0, 0, 16, 3, "#f0c040"); P.rect(3, 6, 3, 2, "#40e0ff"); P.rect(10, 6, 3, 2, "#40e0ff"); P.rect(7, 11, 2, 5, "#2a5aa0"); }) } },
      { name: "finL", parent: "head", size: [3, 14, 6], pivot: [7, 4, 0], off: [1, -4, 0], paint: { all: P => { for (let y = 0; y < 16; y++) P.rect(0, y, 16, 1, y % 4 < 2 ? "#f0c040" : "#2a5aa0"); } } },
      { name: "finR", parent: "head", size: [3, 14, 6], pivot: [-7, 4, 0], off: [-1, -4, 0], paint: { all: P => { for (let y = 0; y < 16; y++) P.rect(0, y, 16, 1, y % 4 < 2 ? "#f0c040" : "#2a5aa0"); } } },
      { name: "armR", size: [6, 22, 6], pivot: [-11, 54, 0], off: [0, -10, 0], paint: { all: P => { P.fill(["#e8dcc0", "#d8c8a8"]); P.rect(0, 12, 16, 2, "#f0c040"); } } },
      { name: "armL", size: [6, 22, 6], pivot: [11, 54, 0], off: [0, -10, 0], paint: { all: P => { P.fill(["#e8dcc0", "#d8c8a8"]); P.rect(0, 12, 16, 2, "#f0c040"); } } },
      { name: "legR", size: [7, 18, 7], pivot: [-4, 18, 0], off: [0, -9, 0], paint: { all: P => { P.fill(["#e8dcc0", "#d8c8a8"]); for (let y = 1; y < 16; y += 3) P.rect(0, y, 16, 1, "#c8b890"); } } },
      { name: "legL", size: [7, 18, 7], pivot: [4, 18, 0], off: [0, -9, 0], paint: { all: P => { P.fill(["#e8dcc0", "#d8c8a8"]); for (let y = 1; y < 16; y += 3) P.rect(0, y, 16, 1, "#c8b890"); } } }] } },
  titan: { name: "The Jungle Titan", boss: true, lostBoss: true, cpBoss: true, noSave: true, hostile: true, hp: 420, speed: 1.7, w: 2.8, h: 5.2, ai: "cpboss", dmg: 8, reach: 3.6, xp: 0, sound: "roar", deathPuff: "xp", drops: () => [],
    model: { type: "warden", parts: [
      { name: "body", size: [26, 24, 16], pivot: [0, 50, 0], off: [0, 12, 0], paint: { all: P => { P.fill(["#6a6a5a", "#5e5e50", "#747464"]); spk(P, 24, ["#3f8a2c", "#56a63b", "#2f6a20"]); P.rect(5, 5, 6, 1, "#8af070"); P.rect(7, 3, 2, 6, "#8af070"); } } },
      { name: "core", parent: "body", size: [8, 8, 2], pivot: [0, 12, 8], off: [0, 0, 1], paint: { all: solid(["#8af070", "#e0ffc8"]) } },
      { name: "head", size: [14, 12, 14], pivot: [0, 74, 0], off: [0, 6, 0], paint: { all: P => { P.fill(["#6a6a5a"]); spk(P, 10, ["#3f8a2c"]); P.rect(0, 0, 16, 5, "#3f8a2c"); }, front: face(["#6a6a5a"], P => { P.rect(0, 0, 16, 4, "#3f8a2c"); P.rect(3, 6, 3, 3, "#8af070"); P.rect(10, 6, 3, 3, "#8af070"); P.rect(5, 12, 6, 2, "#3a3a30"); }) } },
      { name: "finL", parent: "head", size: [3, 10, 3], pivot: [6, 10, 0], off: [0, 5, 0], paint: { all: solid(["#3f8a2c", "#56a63b"]) } },
      { name: "finR", parent: "head", size: [3, 10, 3], pivot: [-6, 10, 0], off: [0, 5, 0], paint: { all: solid(["#3f8a2c", "#56a63b"]) } },
      { name: "armR", size: [10, 36, 10], pivot: [-18, 72, 0], off: [0, -17, 0], paint: { all: P => { P.fill(["#6a6a5a", "#5e5e50"]); spk(P, 10, ["#3f8a2c", "#56a63b"]); } } },
      { name: "armL", size: [10, 36, 10], pivot: [18, 72, 0], off: [0, -17, 0], paint: { all: P => { P.fill(["#6a6a5a", "#5e5e50"]); spk(P, 10, ["#3f8a2c", "#56a63b"]); } } },
      { name: "legR", size: [11, 26, 11], pivot: [-7, 26, 0], off: [0, -13, 0], paint: { all: P => { P.fill(["#5e5e50"]); spk(P, 6, ["#3f8a2c"]); } } },
      { name: "legL", size: [11, 26, 11], pivot: [7, 26, 0], off: [0, -13, 0], paint: { all: P => { P.fill(["#5e5e50"]); spk(P, 6, ["#3f8a2c"]); } } }] } },
  leviathan: { name: "The Ocean Leviathan", boss: true, lostBoss: true, cpBoss: true, noSave: true, hostile: true, hp: 400, speed: 3, w: 3, h: 2.6, ai: "cpboss", flies: true, fireproof: true, dmg: 7, reach: 4, xp: 0, sound: "roar", deathPuff: "splash", drops: () => [],
    model: { type: "warden", parts: [
      { name: "body", size: [18, 16, 40], pivot: [0, 20, 0], off: [0, 0, 0], paint: { all: P => { P.fill(["#1a4a6a", "#1e5272", "#164260"]); for (let x = 1; x < 16; x += 4) P.rect(x, 0, 2, 3, "#3ab0c8"); }, bottom: solid(["#8ab8c8", "#7aa8b8"]) } },
      { name: "core", parent: "body", size: [4, 4, 2], pivot: [0, 0, 20], off: [0, 0, 1], paint: { all: solid(["#a8f8ff", "#ffffff"]) } },
      { name: "head", size: [16, 14, 16], pivot: [0, 22, 26], off: [0, 0, 6], paint: { all: solid(["#1a4a6a", "#1e5272"]), front: face(["#1a4a6a"], P => { P.rect(2, 4, 3, 3, "#a8f8ff"); P.rect(11, 4, 3, 3, "#a8f8ff"); P.rect(2, 11, 12, 2, "#0a2030"); for (let x = 3; x < 13; x += 2) P.px(x, 10, "#ffffff"); }) } },
      { name: "finL", parent: "head", size: [2, 10, 8], pivot: [8, 6, -2], off: [1, 3, 0], paint: { all: solid(["#3ab0c8", "#2a90a8"]) } },
      { name: "finR", parent: "head", size: [2, 10, 8], pivot: [-8, 6, -2], off: [-1, 3, 0], paint: { all: solid(["#3ab0c8", "#2a90a8"]) } },
      { name: "armR", size: [14, 3, 12], pivot: [-12, 16, 6], off: [-6, 0, 0], paint: { all: solid(["#3ab0c8", "#2a90a8"]) } },
      { name: "armL", size: [14, 3, 12], pivot: [12, 16, 6], off: [6, 0, 0], paint: { all: solid(["#3ab0c8", "#2a90a8"]) } },
      { name: "legR", size: [12, 10, 22], pivot: [0, 20, -20], off: [0, 0, -11], paint: { all: P => { P.fill(["#1a4a6a", "#164260"]); P.rect(0, 0, 16, 2, "#3ab0c8"); } } },
      { name: "legL", size: [18, 2, 10], pivot: [0, 20, -40], off: [0, 0, -4], paint: { all: solid(["#3ab0c8", "#2a90a8"]) } }] } },
  tempest: { name: "The Blight Tempest", boss: true, lostBoss: true, cpBoss: true, noSave: true, hostile: true, hp: 300, speed: 1.3, w: 6.4, h: 10.6, scale: 2, ai: "cpboss", flies: true, noclip: true, fireproof: true, dmg: 7, reach: 5.6, xp: 0, sound: "roar", deathPuff: "pale", drops: () => [],
    model: { type: "tempest", parts: tempestParts() } },
  warden: { name: "The First Warden", boss: true, lostBoss: true, noSave: true, hostile: true, hears: true, hp: 400, speed: 2.4, w: 1.8, h: 4.2, ai: "warden", fireproof: true, dmg: 8, reach: 3, xp: 0, sound: "roar", deathPuff: "pale", drops: () => [],
    model: { type: "warden", parts: [
      { name: "body", size: [20, 18, 12], pivot: [0, 40, 0], off: [0, 9, 0], paint: { all: P => { P.fill(["#14343c", "#10303a", "#183a44"]); for (let y = 2; y < 16; y += 4) P.rect(0, y, 16, 1, "#0a1a20"); } } },
      { name: "core", parent: "body", size: [8, 8, 2], pivot: [0, 10, 6], off: [0, 0, 1], paint: { all: solid(["#5ae0d0", "#8af0e8", "#c8ffff"]) } },
      { name: "plateL", parent: "body", size: [8, 10, 3], pivot: [6, 12, 6], off: [0, 0, 1.5], paint: { all: solid(KSTONE) } },
      { name: "plateR", parent: "body", size: [6, 8, 3], pivot: [-7, 13, 6], off: [0, 0, 1.5], paint: { all: solid(KSTONE) } },
      { name: "head", size: [14, 12, 12], pivot: [0, 58, 0], off: [0, 6, 0], paint: { all: solid(["#14343c", "#10303a"]), front: face(["#14343c"], P => { P.rect(2, 10, 12, 3, "#0a1a20"); P.rect(3, 4, 10, 2, "#2a6a70"); }) } },
      { name: "finL", parent: "head", size: [3, 10, 6], pivot: [8, 8, 0], off: [1, 3, 0], paint: { all: solid(["#2a6a70", "#5ae0d0"]) } },
      { name: "finR", parent: "head", size: [3, 10, 6], pivot: [-8, 8, 0], off: [-1, 3, 0], paint: { all: solid(["#2a6a70", "#5ae0d0"]) } },
      { name: "armR", size: [7, 30, 7], pivot: [-14, 56, 0], off: [0, -14, 0], paint: { all: solid(["#14343c", "#183a44"]) } },
      { name: "armL", size: [7, 30, 7], pivot: [14, 56, 0], off: [0, -14, 0], paint: { all: solid(["#14343c", "#183a44"]) } },
      { name: "legR", size: [8, 26, 8], pivot: [-6, 26, 0], off: [0, -13, 0], paint: { all: solid(["#10303a"]) } },
      { name: "legL", size: [8, 26, 8], pivot: [6, 26, 0], off: [0, -13, 0], paint: { all: solid(["#10303a"]) } }] } },
  sovereign: { name: "The Resonant Sovereign", boss: true, lostBoss: true, noSave: true, hostile: true, hp: 600, speed: 1, w: 3, h: 7, ai: "sovereign", fireproof: true, dmg: 9, reach: 4, xp: 0, sound: "roar", deathPuff: "pale", noclip: true, drops: () => [],
    model: { type: "sovereign", parts: [
      { name: "body", size: [26, 40, 16], pivot: [0, 50, 0], off: [0, 0, 0], paint: { all: P => { P.fill(["#4a5a7a", "#52627e", "#3e4e6a"]); for (let y = 1; y < 16; y += 3) P.rect(0, y, 16, 1, "#2a3a54"); } } },
      { name: "core", parent: "body", size: [10, 10, 2], pivot: [0, 6, 8], off: [0, 0, 1], paint: { all: solid(["#c8ffff", "#8af0e8", "#ffffff"]) } },
      { name: "head", size: [16, 14, 14], pivot: [0, 72, 0], off: [0, 7, 0], paint: { all: solid(["#4a5a7a"]), front: face(["#4a5a7a"], P => { P.rect(3, 5, 4, 3, "#c8ffff"); P.rect(9, 5, 4, 3, "#c8ffff"); }) } },
      ...[0, 1, 2, 3].map(i => ({ name: "crown" + i, size: [6, 10, 6], pivot: [0, 96, 0], off: [Math.cos(i * Math.PI / 2) * 12, 0, Math.sin(i * Math.PI / 2) * 12], paint: { all: solid(["#c8e8ff", "#8ad8ff"]) } })),
      { name: "armR", size: [10, 44, 10], pivot: [-20, 68, 0], off: [0, -20, 0], paint: { all: solid(["#3e4e6a", "#4a5a7a"]) } },
      { name: "armL", size: [10, 44, 10], pivot: [20, 68, 0], off: [0, -20, 0], paint: { all: solid(["#3e4e6a", "#4a5a7a"]) } },
      { name: "base", size: [20, 16, 14], pivot: [0, 22, 0], off: [0, 0, 0], paint: { all: solid(["#2a3a54", "#34445e"]) } }] } }
});
// ----- Herobrine (the Forsaken World's watcher) and his Pale Sentinels. js/forsaken.js directs what Herobrine does. -----
const HSKIN = ["#b98a65", "#b0825e", "#c0926c"], HHAIR = ["#4a2e18", "#422814"], HSHIRT = ["#2fa8b0", "#2a9aa2", "#34b0b8"], HPANTS = ["#3a3aa0", "#34349a", "#40409e"];
const blankEyes = P => { P.rect(2, 6, 4, 2, "#ffffff"); P.rect(10, 6, 4, 2, "#ffffff"); };   // bright, pupil-less eyes
Object.assign(SPECIES, {
  herobrine: { name: "Herobrine", noSave: true, hp: 160, speed: 3.6, w: 0.6, h: 1.95, ai: "herobrine", fireproof: true, xp: 0, sound: "", drops: () => [],
    model: { type: "humanoid", parts: humanoidParts({ legLen: 12, limb: [4, 12, 4],
      head: { all: solid(HSKIN), top: solid(HHAIR), back: solid(HHAIR), left: P => { P.fill(HSKIN); P.rect(0, 0, 16, 5, HHAIR[0]); }, right: P => { P.fill(HSKIN); P.rect(0, 0, 16, 5, HHAIR[0]); },
        front: face(HSKIN, P => { P.rect(0, 0, 16, 4, HHAIR[0]); blankEyes(P); P.rect(7, 9, 2, 2, "#a8784f"); P.rect(5, 12, 6, 1, "#8a5e40"); }) },
      body: { all: solid(HSHIRT) }, arm: { all: P => { P.fill(HSKIN); P.rect(0, 0, 16, 5, HSHIRT[0]); } }, leg: { all: P => { P.fill(HPANTS); P.rect(0, 13, 16, 3, "#4a4a52"); } } }) } },
  sentinel: { name: "Pale Sentinel", hostile: true, noSave: true, hp: 18, speed: 2.6, w: 0.6, h: 1.95, ai: "melee", dmg: 3, reach: 1.6, xp: 4, sound: "groan", drops: () => [[I.ROTTEN_FLESH, randi(0, 1)]],
    model: { type: "humanoid", armsOut: true, parts: humanoidParts({ legLen: 12, limb: [4, 12, 4],
      head: { all: solid(["#9aa4a8", "#8e989c"]), top: solid(["#5a6064"]), front: face(["#9aa4a8", "#8e989c"], P => { blankEyes(P); P.rect(5, 11, 6, 1, "#5a6064"); }) },
      body: { all: solid(["#4a5458", "#424c50"]) }, arm: { all: P => { P.fill(["#9aa4a8"]); P.rect(0, 0, 16, 5, "#4a5458"); } }, leg: { all: solid(["#3a4044", "#343a3e"]) } }) } }
});

// Surface bestiary silhouettes and materials. Add armor to the animated limb pivots.
function applySurfaceArtwork() {
  const plate = (name, parent, size, pivot, paint) => ({ name, parent, size, pivot, off: [0, 0, 0], paint });
  const leather = ["#60412d", "#775038", "#8f6745"];
  const moss = ["#3f501c", "#566924", "#708735", "#8a9f47"];
  const cloth = ["#34545a", "#3f6367", "#54777b"];
  const edge = (palette, trim) => ({ all: P => {
    P.fill(palette);
    P.rect(0, 0, 16, 2, trim);
    P.rect(0, 13, 16, 1, palette[0]);
  } });
  const parts = key => SPECIES[key].model.parts;
  const get = (key, name) => parts(key).find(part => part.name === name);
  const limbSides = [["R", -1], ["L", 1]];
  const groaner = get("zombie", "body");
  groaner.paint = { all: P => {
    P.fill(cloth);
    P.rect(6, 0, 4, 5, "#28383b");
    P.rect(0, 11, 16, 2, "#2d484d");
    P.rect(2, 13, 5, 3, "#755940");
  } };
  for (const [side, sign] of limbSides) {
    get("zombie", "leg" + side).paint = { all: P => {
      P.fill(["#443832", "#51423a", "#635047"]);
      P.rect(0, 13, 16, 3, moss[1]);
      P.rect(3, 10, 5, 4, moss[2]);
    } };
    parts("zombie").push(plate("sleeve" + side, "arm" + side, [4.5, 5, 4.5], [0, 4, 0], edge(cloth, "#65858a")));
    parts("golem").push(
      plate("shoulder" + side, "arm" + side, [8, 8, 8], [0, 11, 0], edge(["#aaa494", "#c6bcaa", "#ded5c2"], "#e7ddca")),
      plate("forearm" + side, "arm" + side, [6, 12, 6], [0, -7, 0], edge(["#aaa494", "#c6bcaa"], "#9a8165")),
      plate("vine" + side, "body", [2, 7, 1], [sign * 5, 1, 6], { all: solid(moss) })
    );
  }

  parts("skeleton").push(
    plate("pauldron", "armR", [4, 4, 4], [0, 4, 0], edge(leather, "#a0754b")),
    plate("hipPouch", "body", [3, 4, 2], [-3, -4, 2], edge(leather, "#a0754b"))
  );
  const ribs = get("skeleton", "body").paint.all;
  get("skeleton", "body").paint.front = P => {
    ribs(P);
    for (let y = 0; y < 16; y += 2) P.rect(13 - Math.floor(y * 0.65), y, 3, 2, "#67462e");
    P.rect(7, 7, 3, 2, "#a88a61");
  };

  for (const name of ["body", "head", "legFR", "legFL", "legBR", "legBL"]) {
    const paint = get("creeper", name).paint;
    paint.all = P => { P.fill(moss); P.rect(1, 1, 2, 11, moss[3]); P.rect(12, 7, 2, 9, moss[0]); };
    if (name === "head") paint.front = P => {
      paint.all(P);
      // Keep the familiar black face while matching the olive body palette.
      P.rect(3, 4, 3, 3, "#13170e"); P.rect(10, 4, 3, 3, "#13170e");
      P.rect(6, 7, 4, 4, "#13170e"); P.rect(5, 9, 2, 4, "#13170e"); P.rect(9, 9, 2, 4, "#13170e");
    };
  }

  for (const key of ["spider", "cave_spider"]) {
    const stone = key === "spider" ? ["#372c29", "#483831", "#59443a"] : ["#283247", "#39445d", "#505b71"];
    get(key, "body").paint.top = P => {
      P.fill(stone);
      P.rect(2, 2, 4, 6, key === "spider" ? "#625049" : moss[2]);
      P.rect(9, 7, 5, 5, key === "spider" ? "#483631" : moss[1]);
    };
    for (const [side, sign] of limbSides) {
      parts(key).push(plate("fang" + side, "head", [2, 3, 2], [sign * 2, -3, 4], edge(stone, "#77685e")));
      for (let i = 0; i < 4; i++) {
        const upper = get(key, "leg" + i + side);
        upper.size = [10, 2.5, 2.5];
        upper.off[0] = sign * 5;
        upper.paint = edge(stone, stone[2]);
        parts(key).push(plate("shin" + i + side, upper.name, [2.5, 5.5, 2.5], [sign * 4, -2, 0], edge(stone, stone[2])));
      }
    }
  }

  const gloop = get("slime", "body");
  gloop.paint = { all: P => {
    P.fill(["rgba(107,163,35,.52)", "rgba(132,190,40,.56)", "rgba(90,139,28,.52)"]);
    P.rect(0, 0, 16, 1, "rgba(186,228,82,.75)");
    P.rect(1, 1, 1, 14, "rgba(158,205,61,.68)");
  } };
  parts("slime").push(plate("innerCube", "body", [7, 7, 7], [0, 0, 0], {
    all: solid(["#486824", "#547926", "#62852d"]),
    front: face(["#547926"], P => {
      P.rect(3, 4, 3, 3, "#29391a"); P.rect(10, 4, 3, 3, "#29391a"); P.rect(6, 10, 4, 2, "#31451c");
    })
  }));

  const hood = ["#304d58", "#3b5c68", "#4e6f76"];
  const wandererHead = get("wanderer", "head");
  wandererHead.paint = { ...edge(hood, "#927e55"), front: P => {
    P.fill(hood);
    P.rect(2, 2, 12, 12, "#94805a");
    P.rect(3, 3, 10, 11, "#202a2d");
    P.rect(5, 7, 2, 2, "#fff0b3");
    P.rect(10, 7, 2, 2, "#fff0b3");
  } };
  SPECIES.wanderer.model.parts = parts("wanderer").filter(part => part.name !== "nose");
  parts("wanderer").push(
    plate("hoodRim", "head", [9, 2, 9], [0, 5, 0], edge(hood, "#927e55")),
    plate("mantle", "body", [10, 4, 7], [0, 6, 0], edge(hood, "#927e55")),
    plate("satchel", "body", [4, 5, 2], [-3, -4, 3], edge(leather, "#a0754b"))
  );
}
applySurfaceArtwork();

function applyTempleArtwork() {
  const model = id => SPECIES[id].model.parts;
  const find = (id, name) => model(id).find(part => part.name === name);
  const add = (id, name, parent, size, pivot, paint) =>
    model(id).push({ name, parent, size, pivot, off: [0, 0, 0], paint });
  const tiles = (palette, grout) => P => {
    P.fill(palette);
    for (let y = 4; y < 16; y += 5) {
      P.rect(0, y, 16, 1, grout);
      for (let x = y % 2 ? 3 : 6; x < 16; x += 7) P.rect(x, y - 4, 1, 4, grout);
    }
  };
  const engraved = (base, rim, mark) => P => {
    base(P);
    P.rect(3, 3, 10, 10, rim);
    P.rect(5, 5, 6, 6, mark);
    P.rect(6, 6, 4, 4, rim);
    P.rect(7, 7, 2, 2, mark);
  };
  const sea = tiles(["#32646b", "#3c7680", "#50818a"], "#254751");
  const sand = tiles(["#c7aa74", "#d8bf8b", "#e4cd9d"], "#ab8a58");
  const stone = tiles(["#54584f", "#63675c", "#797d72"], "#44483f");
  const gold = tiles(["#c28a21", "#dfab36", "#f6cb56"], "#a56a17");
  const vine = { all: solid(["#53751b", "#70931d", "#8cb12a", "#9aba34"]) };
  const azure = { all: solid(["#378ba4", "#51b5ca", "#79d8e3"]) };
  const sun = { all: solid(["#f1ad27", "#ffd252", "#fff195"]) };

  for (const [id, base, trim, rune] of [
    ["regent", sea, "#527f86", "#82bbc4"],
    ["scolossus", sand, "#d19a2d", "#ffe084"],
    ["titan", stone, "#596348", "#799b30"]
  ]) {
    const body = find(id, "body");
    body.paint = { all: base };
    const faceplate = engraved(base, trim, rune);
    add(id, "coreFrame", "body", [12, 12, 1.5], [0, find(id, "core").pivot[1], body.size[2] / 2 + 0.6], { all: faceplate });
    for (const [side, sign] of [["R", -1], ["L", 1]]) {
      const arm = "arm" + side, leg = "leg" + side;
      const armHeight = find(id, arm).size[1];
      const limbWidth = find(id, arm).size[0];
      add(id, "pauldron" + side, arm, [limbWidth + 4, 7, limbWidth + 3], [sign, armHeight / 2 - 4, 0], { all: base, front: faceplate });
      add(id, "bracer" + side, arm, [limbWidth + 2, 9, limbWidth + 2], [sign, -armHeight / 2 + 5, 0],
        { all: id === "scolossus" ? gold : base, front: faceplate });
      add(id, "greave" + side, leg, [10, 7, 11], [0, -3, 1], { all: base });
      if (id === "titan") {
        add(id, "canopy" + side, arm, [16, 3, 14], [sign, 16, 0], vine);
        add(id, "hangingVine" + side, arm, [3, 14, 2], [sign * 3, 7, 6], vine);
        add(id, "kneeVine" + side, leg, [4, 8, 2], [sign, 2, 5.5], vine);
      }
    }
  }
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const x = Math.cos(angle), y = Math.sin(angle);
    add("scolossus", "ray" + i, "head", [3, 3, 2], [x * 11, 5 + y * 11, -7], sun);
  }

  const linen = { all: P => {
    P.fill(["#ddd0b2", "#eadcc0", "#c9b794"]);
    for (let y = 3; y < 16; y += 4) P.rect(0, y, 16, 1, "#b4a483");
  } };
  const royal = { all: P => {
    P.fill(["#23468b", "#3059a6", "#3d68b2"]);
    P.rect(0, 0, 2, 16, "#dbab37"); P.rect(14, 0, 2, 16, "#dbab37");
    P.rect(4, 3, 7, 2, "#ecbd47"); P.rect(7, 5, 2, 8, "#ecbd47");
  } };
  add("pharaoh", "diadem", "head", [3, 5, 2], [0, 5, 6], { all: gold });
  add("pharaoh", "belt", "body", [17, 3, 11], [0, -9, 0], { all: gold });
  add("pharaoh", "apron", "body", [6, 14, 1.5], [0, -16, 6], royal);
  for (const [side, sign] of [["R", -1], ["L", 1]]) {
    const arm = "arm" + side;
    find("pharaoh", arm).paint = linen;
    add("pharaoh", "bracelet" + side, arm, [7, 3, 7], [0, -7, 0], { all: gold });
    add("pharaoh", "fingers" + side, arm, [4, 4, 2], [sign, -12, 1], linen);
  }

  const scales = tiles(["#224580", "#2c5795", "#386aaa"], "#1a396e");
  find("leviathan", "body").paint = { all: scales, bottom: solid(["#86b8c6", "#a7d0d3"]) };
  add("leviathan", "jaw", "head", [15, 4, 15], [0, -7, 1], { all: solid(["#82b6c7", "#a4cdd3"]) });
  for (let i = 0; i < 5; i++) {
    add("leviathan", "tooth" + i, "head", [1.5, 2.5, 1.5], [i * 2.6 - 5.2, -5, 8], { all: solid(["#dfedf0", "#f7fcff"]) });
    add("leviathan", "crest" + i, "body", [2, 8 - i, 4], [0, 9, 15 - i * 7], azure);
  }
  add("leviathan", "tailCrest", "legL", [2, 10, 4], [0, 4, 0], azure);

  const shell = { all: sea, top: engraved(sea, "#3d7278", "#74b2b7") };
  add("tidecrab", "carapace", "body", [12, 4, 12], [0, 3, 0], shell);
  for (const [side, sign] of [["R", -1], ["L", 1]]) {
    add("tidecrab", "eyeStalk" + side, "head", [2, 4, 2], [sign * 3, 4, 2], shell);
    add("tidecrab", "eye" + side, "head", [2.5, 2, 2.5], [sign * 3, 6, 2], azure);
    add("tidecrab", "claw" + side, "head", [4, 3, 5], [sign * 6, -1, 4], shell);
    add("tidecrab", "pincer" + side, "head", [2, 3, 3], [sign * 5, -1, 7], { all: solid(["#a6c3bf", "#73a8aa"]) });
  }
  add("sunscarab", "goldShell", "body", [12, 5, 12], [0, 3, 0],
    { all: gold, top: engraved(gold, "#ffd26b", "#9e6418") });
  add("sunscarab", "visor", "head", [7, 2, 1], [0, 0, 4], sun);
  const wood = { all: tiles(["#68482d", "#795535", "#87623f"], "#523821") };
  for (const part of model("vinewalker")) if (part.name !== "head") part.paint = wood;
  add("vinewalker", "leafCrown", "head", [9, 2, 9], [0, 4, 0], vine);
  for (const side of ["L", "R"]) {
    add("vinewalker", "leafShoulder" + side, "arm" + side, [5, 3, 5], [0, 4, 0], vine);
    add("vinewalker", "wristVine" + side, "arm" + side, [4, 4, 5], [0, -3, 0], vine);
  }
}
applyTempleArtwork();

function applyEchoArtwork() {
  const slate = { all: solid(["#263840", "#354752", "#45565d", "#2d424a"]) };
  const patina = { all: solid(["#325b60", "#437579", "#538889"]) };
  const bronze = { all: solid(["#795940", "#98734d", "#ac8a61"]) };
  const crystal = { all: solid(["#67bdd8", "#8cdef1", "#c1efff"]) };
  const glow = { all: solid(["#65f4ee", "#9efff7", "#d1fffb"]) };
  const parts = id => SPECIES[id].model.parts;
  const find = (id, name) => parts(id).find(part => part.name === name);
  const add = (id, name, parent, size, pivot, paint) =>
    parts(id).push({ name, parent, size, pivot, off: [0, 0, 0], paint });
  for (const id of ["crawler", "burrower"]) {
    find(id, "body").paint = slate;
    find(id, "head").paint = { ...slate, front: face(HUSH, P => {
      for (const x of [2, 10]) { P.rect(x, 5, 4, 4, "#377e82"); P.rect(x + 1, 6, 2, 2, "#9cfff9"); }
    }) };
    for (let i = 0; i < 4; i++) {
      add(id, "shellRib" + i, "body", [11, 3, 2], [0, 4, 4 - i * 3], i % 2 ? patina : slate);
      add(id, "backShard" + i, "body", id === "burrower" ? [3, i === 1 ? 8 : 4, 3] : [2, 1, 2],
        [i % 2 ? 2 : -2, id === "burrower" ? 6 : 5.5, 4 - i * 3], id === "burrower" ? crystal : glow);
    }
  }
  for (const [side, sign] of [["R", -1], ["L", 1]]) {
    const arm = "arm" + side, leg = "leg" + side;
    for (const id of ["sentinel_e", "guardian", "knight"]) {
      const width = find(id, arm).size[0];
      const height = find(id, arm).size[1];
      add(id, "shoulder" + side, arm, [width + 2, 4, width + 2], [sign, height / 2 - 2, 0], id === "sentinel_e" ? bronze : slate);
      add(id, "bracer" + side, arm, [width + 1, 5, width + 1], [0, -height / 2 + 3, 0], patina);
      add(id, "boot" + side, leg, [find(id, leg).size[0] + 1, 3, find(id, leg).size[2] + 2], [0, -find(id, leg).size[1] / 2 + 1.5, 1], id === "knight" ? slate : bronze);
    }
    add("stalker", "claw" + side, arm, [3, 6, 3], [0, -10, 0], patina);
    add("stalker", "shoulder" + side, arm, [4, 4, 4], [sign, 9, 0], slate);
    add("shard_scout", "hindWing" + side, "wing" + side, [8, 1, 3], [-sign, -0.5, -4], crystal);
    add("warden", "fist" + side, arm, [10, 9, 10], [0, -12, 1], patina);
    add("warden", "shoulder" + side, arm, [11, 9, 11], [sign, 10, 0], slate);
    add("warden", "hornTip" + side, "fin" + side, [5, 3, 6], [sign * 2, 5, 0], patina);
  }
  const visor = P => {
    P.fill(ECHO);
    P.rect(1, 5, 14, 2, "#6ce7db");
    P.rect(7, 2, 2, 11, "#7cf2e2");
  };
  find("knight", "head").paint.front = visor;
  const shield = P => {
    P.fill(ECHO);
    P.rect(1, 1, 14, 14, "#63bcb7");
    P.rect(2, 2, 12, 12, "#253b4d");
    P.rect(7, 5, 2, 6, "#63bcb7"); P.rect(5, 7, 6, 2, "#63bcb7");
  };
  find("knight", "shield").paint = { all: solid(ECHO), left: shield, right: shield };
  const cage = find("mote", "cage");
  const frame = P => {
    P.clear();
    P.rect(0, 0, 16, 2, "#73c8c6"); P.rect(0, 14, 16, 2, "#428f92");
    P.rect(0, 0, 2, 16, "#53a4a5"); P.rect(14, 0, 2, 16, "#53a4a5");
  };
  cage.paint = { all: frame };
  for (let i = 0; i < 3; i++) {
    add("warden", "rib" + i, "body", [15 - i * 2, 2, 2], [0, 5 - i * 3, 6.5], patina);
  }
}
applyEchoArtwork();

// ----- Bestiary pass 2 (2026-11-06): the Ember Depths, wildlife, and legends, from Mr. Watford's bestiary sheets
// (F "Ember Depths & the Hollow", G "Wildlife & Companions", C "Legacy Campaign Legends"). Colors and materials follow
// the sheets; faces and details are Blockhaven's own. Animated part names stay the same; details ride on them.
// Side faces: on a box's right (+x) face, x = 0 is the front (+z) end; on its left (-x) face, x = 15 is the front.
function applyBestiaryPass2() {
  const parts = id => SPECIES[id].model.parts;
  const find = (id, name) => parts(id).find(p => p.name === name);
  const add = (id, name, parent, size, pivot, paint) => parts(id).push({ name, parent, size, pivot, off: [0, 0, 0], paint });
  const sides = draw => ({ right: P => draw(P, (x, w = 1) => x), left: P => draw(P, (x, w = 1) => 16 - x - w) });
  const paint = (id, name, p) => { const q = find(id, name); if (q) q.paint = p; };

  // ======================= the Ember Depths =======================
  const CHAR = ["#2a2220", "#332a26", "#251e1c"], LAVA = ["#ff8a1a", "#ffb030", "#ff6a10"];
  const seams = P => { P.fill(CHAR); P.rect(2, 3, 5, 1, LAVA[0]); P.rect(6, 3, 1, 5, LAVA[1]); P.rect(9, 9, 5, 1, LAVA[2]); P.rect(11, 6, 1, 4, LAVA[0]); P.rect(3, 12, 3, 1, LAVA[1]); };
  // Flare: a charcoal block split by glowing seams, with molten rods
  paint("flare", "head", { all: seams, front: P => { seams(P); P.rect(3, 6, 3, 3, "#ffe070"); P.rect(10, 6, 3, 3, "#ffe070"); P.rect(4, 7, 1, 1, "#fff8d0"); P.rect(11, 7, 1, 1, "#fff8d0"); } });
  for (let i = 0; i < 10; i++) paint("flare", "rod" + i, { all: P => { P.fill(LAVA); for (let y = 3; y < 16; y += 5) P.rect(0, y, 16, 2, CHAR[0]); P.rect(0, 0, 16, 2, "#ffe070"); } });
  // Wailer: a pale, sorrowful spirit with glowing tear trails
  const PALE = ["#d8d0dc", "#ccc4d2", "#e2dae6"];
  paint("wailer", "body", { all: P => { P.fill(PALE); spk(P, 10, ["#b8b0c0", "#c4bccc"]); }, front: P => {
    P.fill(PALE); spk(P, 6, ["#b8b0c0"]);
    for (const x of [3, 10]) { P.rect(x, 5, 3, 1, "#5a5262"); P.px(x - 1, 6, "#5a5262"); P.px(x + 3, 6, "#5a5262"); P.rect(x + 1, 6, 1, 6, "#8ad8f0"); }
    P.rect(7, 11, 2, 2, "#4a4252");
  } });
  for (let i = 0; i < 9; i++) paint("wailer", "t" + i, { all: P => { P.fill(PALE); P.rect(0, 10, 16, 6, "#a8a0b0"); } });
  // the Boarkin family: leather and gold (Boarkin), iron plates and a red sash (Brute), moss and rot (Rotboar)
  const tuskP = { all: solid(["#efe4c8", "#e2d6b8"]) };
  const boarHead = (skin, brow, eye) => ({ all: P => { P.fill(skin); P.rect(0, 0, 16, 3, brow); spk(P, 6, [brow]); }, front: face(skin, P => { P.rect(0, 0, 16, 3, brow); P.rect(3, 5, 3, 2, eye); P.rect(10, 5, 3, 2, eye); P.rect(2, 4, 4, 1, brow); P.rect(10, 4, 4, 1, brow); }) });
  const snoutP = c => ({ all: solid([c]), front: P => { P.fill([c]); P.rect(3, 5, 3, 5, "#3a2018"); P.rect(10, 5, 3, 5, "#3a2018"); } });
  for (const id of ["boarkin", "brute", "rotboar"]) for (const [side, s] of [["R", -1], ["L", 1]]) add(id, "tusk" + side, "head", [1, 2.5, 1], [s * 2.5, -2.5, 4.5], tuskP);
  const SKIN = ["#a86a52", "#9c604a", "#b4765c"], LEATHER = ["#6a4a2e", "#5e4028", "#74522f"];
  paint("boarkin", "head", boarHead(SKIN, "#6a3a28", "#2a1a10")); paint("boarkin", "snout", snoutP("#c8846a"));
  for (const e of ["earR", "earL"]) paint("boarkin", e, { all: solid(SKIN) });
  paint("boarkin", "body", { all: P => { P.fill(LEATHER); P.rect(0, 11, 16, 2, "#3a2414"); P.rect(6, 10, 4, 4, "#e8b83a"); }, front: P => { P.fill(LEATHER); for (let k = 0; k < 10; k++) P.rect(2 + k, k, 2, 1, "#3a2414"); P.rect(0, 11, 16, 2, "#3a2414"); P.rect(6, 10, 4, 4, "#e8b83a"); P.rect(7, 11, 2, 2, "#8a6a1a"); } });
  for (const a of ["armR", "armL"]) paint("boarkin", a, { all: P => { P.fill(SKIN); P.rect(0, 10, 16, 6, "#4a3220"); } });
  for (const l of ["legR", "legL"]) paint("boarkin", l, { all: P => { P.fill(["#4a4a2a", "#42422a"]); P.rect(0, 12, 16, 4, "#2a2018"); } });
  const IRON = ["#3a3a42", "#44444c", "#34343a"];
  paint("brute", "head", boarHead(["#9a5a44", "#8e5240"], "#4a2418", "#ffb030")); paint("brute", "snout", snoutP("#b87660"));
  for (const e of ["earR", "earL"]) paint("brute", e, { all: solid(["#9a5a44"]) });
  paint("brute", "body", { all: P => { P.fill(["#9a5a44", "#8e5240"]); P.rect(0, 10, 16, 4, "#9a1e1e"); P.rect(6, 10, 4, 4, "#e8b83a"); } });
  for (const [side, s] of [["R", -1], ["L", 1]]) {
    add("brute", "plate" + side, "arm" + side, [6, 4, 6], [0, 3, 0], { all: P => { P.fill(IRON); P.rect(0, 0, 16, 2, "#5a5a64"); P.rect(7, 6, 2, 2, "#e8b83a"); } });
    paint("brute", "arm" + side, { all: P => { P.fill(["#9a5a44", "#8e5240"]); P.rect(0, 11, 16, 5, IRON[0]); } });
    paint("brute", "leg" + side, { all: P => { P.fill(["#3a2a22"]); P.rect(0, 0, 16, 6, "#8a1a1a"); P.rect(0, 13, 16, 3, IRON[0]); } });
  }
  const ROT = ["#a8a888", "#9aa07a", "#8a9a6a"], MOSS = ["#4a6a24", "#5a7a2c", "#3a5a1c"];
  paint("rotboar", "head", { all: P => { P.fill(ROT); spk(P, 10, MOSS); P.rect(0, 0, 16, 3, MOSS[2]); }, front: face(ROT, P => { P.rect(0, 0, 16, 3, MOSS[2]); P.rect(3, 5, 3, 2, "#e8c040"); P.rect(10, 5, 3, 2, "#e8c040"); spk(P, 4, MOSS); }) });
  paint("rotboar", "snout", snoutP("#b8b094"));
  for (const e of ["earR", "earL"]) paint("rotboar", e, { all: P => { P.fill(ROT); spk(P, 4, MOSS); } });
  paint("rotboar", "body", { all: P => { P.fill(["#7a6a4a", "#6e5e40"]); spk(P, 12, MOSS); for (const y of [3, 6, 9]) P.rect(4, y, 8, 1, "#5a4a30"); P.rect(0, 12, 16, 2, "#3a2a18"); } });
  for (const a of ["armR", "armL"]) paint("rotboar", a, { all: P => { P.fill(ROT); spk(P, 8, MOSS); } });
  for (const l of ["legR", "legL"]) paint("rotboar", l, { all: P => { P.fill(["#4a4030", "#40382a"]); spk(P, 6, MOSS); } });
  // Hogbeast: dark red hide, a ridge of black spikes, big ivory tusks
  const HIDE = ["#8a3a2e", "#7a3228", "#9a4436"];
  paint("hogbeast", "body", { all: P => { P.fill(HIDE); spk(P, 12, ["#6a2a20", "#a85040"]); }, top: P => { P.fill(["#4a2224", "#3a1c1e"]); spk(P, 8, HIDE); } });
  paint("hogbeast", "head", { all: P => { P.fill(HIDE); spk(P, 8, ["#6a2a20"]); }, front: P => { P.fill(HIDE); P.rect(2, 3, 3, 2, "#ffb030"); P.rect(11, 3, 3, 2, "#ffb030"); P.rect(4, 8, 8, 6, "#b85a48"); P.rect(5, 10, 2, 2, "#3a1814"); P.rect(9, 10, 2, 2, "#3a1814"); } });
  for (const t of ["tuskR", "tuskL"]) { const q = find("hogbeast", t); q.paint = tuskP; q.size = [2.5, 6, 2.5]; }
  for (const l of ["legFR", "legFL", "legBR", "legBL"]) paint("hogbeast", l, { all: P => { P.fill(HIDE); P.rect(0, 12, 16, 4, "#2a1414"); } });
  for (let i = 0; i < 5; i++) add("hogbeast", "spike" + i, "body", [3, 5 - (i % 2), 3], [0, 8, 9 - i * 4.5], { all: solid(["#2a1a1e", "#3a2228"]) });
  // Magma Gloop: a cube of black crust split by lava, with glowing eyes
  paint("magma", "body", { all: seams, front: P => { seams(P); P.rect(3, 5, 3, 3, "#ffd040"); P.rect(10, 5, 3, 3, "#ffd040"); } });
  // Lavastrider: a red, ember-crusted walker with glowing whiskers of flame
  paint("strider", "body", { all: P => { P.fill(["#a82a2a", "#962424", "#b03030"]); spk(P, 10, ["#7a1a1a"]); }, top: P => { P.fill(["#7a1a1a", "#6a1616"]); P.rect(3, 4, 8, 1, LAVA[0]); P.rect(9, 9, 4, 1, LAVA[1]); },
    front: P => { P.fill(["#a82a2a", "#962424"]); P.rect(3, 6, 3, 2, "#ffd040"); P.rect(10, 6, 3, 2, "#ffd040"); P.rect(5, 11, 6, 1, "#4a0e0e"); } });
  for (const l of ["legR", "legL"]) paint("strider", l, { all: P => { P.fill(["#4a3a4a", "#3e3240"]); P.rect(0, 13, 16, 3, "#2a2028"); } });
  for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1; add("strider", "ember" + i, "body", [4, 1, 1], [s * 9, 2 + Math.floor(i / 2) * 3, 2 - Math.floor(i / 2) * 2], { all: solid(LAVA) }); }
  // Sheller: a violet shell with a carved square spiral, a golden creature inside
  const SHELL = ["#8a5a8a", "#7a4e7a", "#946494"];
  paint("sheller", "lid", { all: P => { P.fill(SHELL); P.rect(0, 14, 16, 2, "#5e3a5e"); }, top: P => { P.fill(SHELL); for (const k of [1, 4, 7]) { P.rect(k, k, 16 - 2 * k, 1, "#c89ac8"); P.rect(k, 15 - k, 16 - 2 * k, 1, "#c89ac8"); P.rect(k, k, 1, 16 - 2 * k, "#c89ac8"); P.rect(15 - k, k, 1, 16 - 2 * k, "#c89ac8"); } } });
  paint("sheller", "base", { all: P => { P.fill(["#6a4468", "#5e3a5e"]); P.rect(0, 0, 16, 2, "#946494"); } });
  paint("sheller", "head", { all: solid(["#e8b83a", "#dcae34"]), front: P => { P.fill(["#e8b83a"]); P.rect(3, 6, 3, 3, "#3a2a10"); P.rect(10, 6, 3, 3, "#3a2a10"); } });

  // ======================= wildlife =======================
  // Scout: a grey wolf with a darker saddle, a pale belly, and a red collar with a golden tag
  const WOLF = ["#a8a8a4", "#9c9c98", "#b2b2ae"];
  paint("scout", "body", { all: P => { P.fill(WOLF); }, top: P => { P.fill(["#7a7a76", "#86867f"]); }, bottom: solid(["#d8d8d0"]) });
  paint("scout", "head", { all: solid(WOLF), front: P => { P.fill(WOLF); P.rect(2, 5, 3, 2, "#2a2a28"); P.rect(11, 5, 3, 2, "#2a2a28"); P.rect(1, 3, 5, 1, "#7a7a76"); P.rect(10, 3, 5, 1, "#7a7a76"); } });
  paint("scout", "snout", { all: solid(["#d0d0c8"]), front: P => { P.fill(["#d0d0c8"]); P.rect(5, 2, 6, 4, "#1a1a1a"); } });
  for (const e of ["earR", "earL"]) paint("scout", e, { all: P => { P.fill(WOLF); P.rect(0, 0, 16, 5, "#5a5a56"); } });
  paint("scout", "tail", { all: P => { P.fill(WOLF); }, back: solid(["#5a5a56"]) });
  add("scout", "tag", "collar", [2, 2, 0.6], [0, -1.6, 1.3], { all: solid(["#f0c040", "#e0b030"]) });
  // Whisker: an orange tabby with a cream belly, green-gold eyes, and a striped tail
  const TABBY = ["#e0902a", "#d8862a", "#e89a34"], stripes = P => { P.fill(TABBY); for (let y = 1; y < 16; y += 4) P.rect(0, y, 16, 2, "#b0601a"); };
  paint("whisker", "body", { all: stripes, bottom: solid(["#f4e8d8"]) });
  paint("whisker", "head", { all: stripes, front: P => { P.fill(TABBY); P.rect(2, 5, 4, 3, "#c8d040"); P.rect(10, 5, 4, 3, "#c8d040"); P.rect(3, 5, 2, 3, "#1a1a10"); P.rect(11, 5, 2, 3, "#1a1a10"); P.rect(6, 10, 4, 4, "#f4e8d8"); P.rect(7, 10, 2, 1, "#e88a9a"); for (const y of [11, 13]) { P.rect(0, y, 4, 1, "#ffffff"); P.rect(12, y, 4, 1, "#ffffff"); } } });
  for (const e of ["earR", "earL"]) paint("whisker", e, { all: solid(TABBY), front: P => { P.fill(TABBY); P.rect(4, 4, 8, 12, "#f0a0a8"); } });
  paint("whisker", "tail", { all: stripes });
  for (const l of ["legFR", "legFL", "legBR", "legBL"]) paint("whisker", l, { all: P => { P.fill(TABBY); P.rect(0, 12, 16, 4, "#f4e8d8"); } });
  // Trotter: a chestnut with a white blaze, a dark mane, pinto patches, and a brown saddle with a golden buckle
  paint("trotter", "head", { all: solid(["#8a5a32", "#80522c"]), front: P => { P.fill(["#8a5a32"]); P.rect(6, 0, 4, 16, "#f0e8dc"); } });
  paint("trotter", "mane", { all: solid(["#2a1a10", "#34200f"]) });
  paint("trotter", "tail", { all: solid(["#2a1a10", "#34200f"]) });
  paint("trotter", "body", { all: P => { P.fill(["#8a5a32", "#80522c", "#94603a"]); }, ...sides((P, X) => { P.fill(["#8a5a32", "#80522c", "#94603a"]); P.rect(X(9, 5), 6, 5, 7, "#f0e8dc"); P.rect(X(11, 3), 3, 3, 3, "#f0e8dc"); }) });
  paint("trotter", "saddle", { all: P => { P.fill(["#6a3a1a", "#5e3418"]); P.rect(0, 0, 16, 2, "#3a2010"); P.rect(6, 8, 4, 4, "#e8b83a"); } });
  // Minnow: silver with a darker back and a pale belly
  paint("minnow", "body", { all: solid(["#9aa8b0"]), top: solid(["#6a7a84"]), bottom: solid(["#e0e4e0"]), ...sides((P, X) => { P.fill(["#9aa8b0", "#a4b0b8"]); P.rect(0, 0, 16, 5, "#6a7a84"); P.rect(0, 11, 16, 5, "#e0e4e0"); P.rect(X(2, 3), 5, 3, 3, "#1a1a1a"); }) });
  paint("minnow", "tail", { all: solid(["#8a98a2", "#7a8892"]) }); paint("minnow", "fin", { all: solid(["#7a8892"]) });
  // Puffer: golden with a cream belly and stubby spikes all around
  paint("puffer", "body", { all: solid(["#e8c840", "#dcbc38"]), bottom: solid(["#f4ecc8"]), front: P => { P.fill(["#e8c840"]); P.rect(2, 4, 4, 4, "#1a1a1a"); P.rect(10, 4, 4, 4, "#1a1a1a"); P.rect(3, 4, 1, 1, "#ffffff"); P.rect(11, 4, 1, 1, "#ffffff"); P.rect(6, 10, 4, 3, "#c86a2a"); } });
  for (const [x, y, z] of [[0, 3, 0], [0, -3, 0], [3, 0, 0], [-3, 0, 0], [2.2, 2.2, 1.5], [-2.2, 2.2, 1.5], [2.2, -2.2, -1.5], [-2.2, -2.2, -1.5], [0, 2.4, -2.4], [0, -2.4, 2.4]]) add("puffer", `spine${x}_${y}_${z}`, "body", [0.8, 0.8, 0.8], [x, y, z], { all: solid(["#d8a020"]) });
  // Inkling: deep indigo, pale eyes, lighter undersides on its tentacles
  paint("squid", "body", { all: P => { P.fill(["#2a2a5a", "#323268", "#26264e"]); spk(P, 8, ["#3e3e7a"]); }, front: P => { P.fill(["#2a2a5a", "#323268"]); P.rect(2, 7, 4, 4, "#e8e8f8"); P.rect(10, 7, 4, 4, "#e8e8f8"); P.rect(3, 8, 2, 2, "#1a1a2a"); P.rect(11, 8, 2, 2, "#1a1a2a"); } });
  for (let i = 0; i < 8; i++) paint("squid", "t" + i, { all: P => { P.fill(["#2a2a5a", "#323268"]); P.rect(0, 12, 16, 4, "#5a5a9a"); }, front: P => { P.fill(["#4a4a88"]); } });
  // Splasher: blue-grey above, cream below
  paint("dolphin", "body", { all: solid(["#7a8aa8"]), top: solid(["#6a7a98", "#72829e"]), bottom: solid(["#e8e4d8"]), ...sides((P, X) => { P.fill(["#7a8aa8", "#8494b0"]); P.rect(0, 10, 16, 6, "#e8e4d8"); P.rect(X(2, 2), 6, 2, 2, "#1a1a2a"); }) });
  paint("dolphin", "snout", { all: solid(["#8494b0"]), bottom: solid(["#e8e4d8"]) });
  for (const n of ["dorsal", "finR", "finL", "fluke"]) paint("dolphin", n, { all: solid(["#5a6a88", "#62728e"]) });
  paint("dolphin", "tail", { all: solid(["#7a8aa8"]), bottom: solid(["#e8e4d8"]) });
  // Pouncer: orange with a white chest and cheeks, dark socks, a white-tipped tail
  const FOX = ["#e0782a", "#d87024", "#e88234"];
  paint("fox", "body", { all: solid(FOX), bottom: solid(["#f4ece0"]) });
  paint("fox", "head", { all: solid(FOX), front: P => { P.fill(FOX); P.rect(0, 9, 5, 7, "#f4ece0"); P.rect(11, 9, 5, 7, "#f4ece0"); P.rect(3, 5, 3, 2, "#2a1a10"); P.rect(10, 5, 3, 2, "#2a1a10"); } });
  paint("fox", "snout", { all: solid(["#f4ece0"]), front: P => { P.fill(["#f4ece0"]); P.rect(5, 0, 6, 4, "#1a1a1a"); } });
  for (const e of ["earR", "earL"]) paint("fox", e, { all: P => { P.fill(FOX); P.rect(0, 0, 16, 5, "#2a1a10"); } });
  for (const l of ["legFR", "legFL", "legBR", "legBL"]) paint("fox", l, { all: P => { P.fill(FOX); P.rect(0, 6, 16, 10, "#2a1a14"); } });
  paint("fox", "tail", { all: solid(FOX), back: solid(["#f8f4ec"]), ...sides((P, X) => { P.fill(FOX); P.rect(X(12, 4), 0, 4, 16, "#f8f4ec"); }) });
  // Buzzer: yellow with two black bands, little antennae, frosted wings
  paint("bee", "body", { all: P => { P.fill(["#f0c020", "#e8b818"]); }, ...sides((P, X) => { P.fill(["#f0c020", "#e8b818"]); P.rect(X(5, 3), 0, 3, 16, "#2a2018"); P.rect(X(10, 3), 0, 3, 16, "#2a2018"); }), top: P => { P.fill(["#f0c020"]); P.rect(0, 5, 16, 3, "#2a2018"); P.rect(0, 10, 16, 3, "#2a2018"); },
    front: P => { P.fill(["#f0c020"]); P.rect(2, 5, 4, 5, "#1a1a20"); P.rect(10, 5, 4, 5, "#1a1a20"); P.rect(3, 6, 1, 1, "#ffffff"); P.rect(11, 6, 1, 1, "#ffffff"); } });
  for (const w of ["wingR", "wingL"]) paint("bee", w, { all: P => { P.fill(["#e8f0f8", "#dce6f0"]); P.rect(0, 7, 16, 1, "#b8c4d0"); P.rect(7, 0, 1, 16, "#b8c4d0"); } });
  for (const [side, s] of [["R", -1], ["L", 1]]) add("bee", "antenna" + side, "body", [0.6, 3, 0.6], [s * 1.5, 4, 4.2], { all: solid(["#2a2018"]) });

  // ======================= legends =======================
  // the Blightking: three grey skulls with green-lit eyes, a crown on the middle one, a ragged body cracked with blight
  const BONE_D = ["#5a5a5a", "#4e4e4e", "#666666"], GLOW = "#a8e040";
  const skull = { all: P => { P.fill(BONE_D); spk(P, 6, ["#3e3e3e"]); }, front: P => { P.fill(BONE_D); P.rect(2, 5, 4, 3, "#1a1a1a"); P.rect(10, 5, 4, 3, "#1a1a1a"); P.rect(3, 6, 2, 1, GLOW); P.rect(11, 6, 2, 1, GLOW); P.rect(4, 11, 8, 2, "#1a1a1a"); for (let x = 5; x < 12; x += 2) P.px(x, 11, "#8a8a8a"); } };
  for (const h of ["head", "headL", "headR"]) paint("blightking", h, skull);
  add("blightking", "crown", "head", [9, 3, 9], [0, 4.5, 0], { all: P => { P.fill(["#2a2a2a"]); for (let x = 0; x < 16; x += 5) P.rect(x, 0, 2, 8, GLOW); P.rect(0, 12, 16, 4, "#6a8a2a"); } });
  const ragged = P => { P.fill(["#1e1e1e", "#262626", "#1a1a1a"]); P.rect(4, 2, 1, 6, GLOW); P.rect(5, 7, 3, 1, GLOW); P.rect(11, 5, 1, 7, GLOW); for (let x = 0; x < 16; x += 3) P.rect(x, 14, 2, 2, "#0e0e0e"); };
  for (const n of ["ribs", "spine", "bar"]) paint("blightking", n, { all: ragged });
  // Cindermaw: dark ember scales over a glowing underbelly, fiery wing membranes
  const EMBER_S = ["#3a2420", "#44302a", "#342018"], scales = P => { P.fill(EMBER_S); for (let y = 2; y < 16; y += 4) for (let x = (y % 8 ? 0 : 2); x < 16; x += 4) P.rect(x, y, 2, 1, "#5a3a2e"); };
  const belly = P => { P.fill(["#e86a1a", "#f08a2a", "#d85a14"]); for (let y = 3; y < 16; y += 4) P.rect(0, y, 16, 1, "#a8400e"); };
  for (const n of ["body", "neck", "tail", "tail2", "tail3", "tail4"]) paint("cindermaw", n, { all: scales, bottom: belly });
  paint("cindermaw", "head", { all: scales, bottom: belly, front: P => { scales(P); P.rect(2, 4, 4, 3, "#ffd040"); P.rect(10, 4, 4, 3, "#ffd040"); P.rect(3, 10, 10, 3, "#ff8a1a"); } });
  paint("cindermaw", "jaw", { all: scales, top: belly });
  for (const w of ["wingL", "wingR", "wingTipL", "wingTipR"]) paint("cindermaw", w, { all: P => { P.fill(["#c8501a", "#b8461a", "#d85a20"]); for (let x = 1; x < 16; x += 5) P.rect(x, 0, 1, 16, "#3a2420"); P.rect(0, 0, 16, 2, "#3a2420"); } });
  for (const l of ["legFR", "legFL", "legBR", "legBL"]) paint("cindermaw", l, { all: P => { scales(P); P.rect(0, 13, 16, 3, "#1a100c"); } });
  paint("cindermaw", "spikes", { all: P => { P.fill(["#ff8a1a", "#ffb030"]); P.rect(0, 10, 16, 6, "#3a2420"); } });
  // the Pale Sentinel: a stone-grey head with white eyes under torn, pale cloth
  const CLOTH = ["#d8ccb8", "#c8bca8", "#e0d4c0"], torn = P => { P.fill(CLOTH); spk(P, 8, ["#a89c88"]); for (let x = 0; x < 16; x += 3) P.rect(x, 13 + (x % 2), 2, 3, "#5a5a5e"); };
  paint("sentinel", "head", { all: solid(["#6a6a6e", "#626266", "#727276"]), front: P => { P.fill(["#6a6a6e", "#626266"]); P.rect(2, 6, 4, 2, "#ffffff"); P.rect(10, 6, 4, 2, "#ffffff"); } });
  paint("sentinel", "body", { all: torn });
  for (const a of ["armR", "armL"]) paint("sentinel", a, { all: P => { P.fill(["#5a5a5e", "#525256"]); P.rect(0, 0, 16, 6, CLOTH[0]); } });
  for (const l of ["legR", "legL"]) paint("sentinel", l, { all: P => { P.fill(["#4a4a4e", "#424246"]); spk(P, 5, CLOTH); } });
  // the Hollow Wyrm: purple-black scales with glowing violet spots, violet wings
  const VOIDS = ["#2a2230", "#332a3a", "#241e2a"], spots = P => { P.fill(VOIDS); for (const [x, y] of [[3, 3], [10, 5], [6, 10], [13, 12], [1, 13]]) P.rect(x, y, 2, 2, "#c050f0"); };
  for (const n of ["body", "neck", "tail", "tail2", "legFR", "legFL", "legBR", "legBL", "jaw"]) paint("dragon", n, { all: spots });
  paint("dragon", "head", { all: spots, front: P => { P.fill(VOIDS); P.rect(2, 4, 4, 2, "#e070ff"); P.rect(10, 4, 4, 2, "#e070ff"); P.rect(3, 11, 10, 2, "#1a141e"); } });
  for (const w of ["wingL", "wingR", "wingTipL", "wingTipR"]) paint("dragon", w, { all: P => { P.fill(["#6a3a8a", "#7a4a9a", "#5e3280"]); for (let x = 1; x < 16; x += 5) P.rect(x, 0, 1, 16, "#2a2230"); P.rect(0, 0, 16, 2, "#2a2230"); } });
  // the Blight Rattler: a charcoal skeleton with green-lit eyes in a tattered olive cloak
  const OLIVE = ["#7a7a2a", "#6e6e24", "#86862e"];
  paint("blight", "head", { all: solid(["#3a3a3a", "#333333"]), front: P => { P.fill(["#3a3a3a"]); P.rect(2, 5, 4, 3, "#101010"); P.rect(10, 5, 4, 3, "#101010"); P.rect(3, 6, 2, 1, GLOW); P.rect(11, 6, 2, 1, GLOW); P.rect(4, 11, 8, 2, "#101010"); } });
  paint("blight", "body", { all: P => { P.fill(OLIVE); for (let x = 0; x < 16; x += 3) P.rect(x, 12 + (x % 2), 2, 4, "#2a2a2a"); }, front: P => { P.fill(["#2a2a2a"]); for (let y = 2; y < 12; y += 3) P.rect(3, y, 10, 1, "#5a5a5a"); P.rect(0, 0, 3, 16, OLIVE[0]); P.rect(13, 0, 3, 16, OLIVE[0]); } });
  for (const n of ["armR", "armL", "legR", "legL"]) paint("blight", n, { all: solid(["#3a3a3a", "#2e2e2e"]) });
  add("blight", "cloak", "body", [9, 13, 1], [0, 0, -2.6], { all: P => { P.fill(OLIVE); spk(P, 6, ["#5a5a1c"]); for (let x = 0; x < 16; x += 3) P.rect(x, 13 + (x % 3), 2, 3, "#1a1a1a"); } });
  // the Resonant Sovereign: a navy robe with gold trim, slate stone, crystal crown points
  const NAVY = ["#2a3a6a", "#24345e", "#304274"], GOLD = "#d8a840";
  paint("sovereign", "body", { all: P => { P.fill(NAVY); P.rect(0, 0, 2, 16, GOLD); P.rect(14, 0, 2, 16, GOLD); P.rect(0, 0, 16, 2, GOLD); } });
  paint("sovereign", "base", { all: P => { P.fill(NAVY); for (let x = 0; x < 16; x += 4) P.rect(x, 12, 2, 4, "#18223e"); P.rect(0, 0, 16, 1, GOLD); } });
  paint("sovereign", "head", { all: solid(["#4a5260", "#424a58"]), front: P => { P.fill(["#4a5260"]); P.rect(3, 6, 3, 2, "#6af0f0"); P.rect(10, 6, 3, 2, "#6af0f0"); } });
  for (const a of ["armR", "armL"]) paint("sovereign", a, { all: P => { P.fill(["#4a5260", "#424a58"]); P.rect(0, 2, 16, 2, GOLD); P.rect(0, 12, 16, 2, GOLD); } });
  for (let i = 0; i < 4; i++) paint("sovereign", "crown" + i, { all: P => { P.fill(["#6ac8e8", "#8ae0f8", "#c0f4ff"]); P.rect(6, 0, 4, 16, "#e8ffff"); } });
}
applyBestiaryPass2();

// Connect the articulated legs to the waist on the taller temple rigs.
for (const id of ["regent", "vcolossus", "scolossus", "titan", "pharaoh"]) {
  const parts = SPECIES[id].model.parts;
  const body = parts.find(part => part.name === "body");
  for (const side of ["L", "R"]) {
    const leg = parts.find(part => part.name === "leg" + side);
    const length = body.pivot[1] - leg.pivot[1] + 1;
    parts.push({ name: "thigh" + side, parent: leg.name, size: [leg.size[0] - 1, length, leg.size[2] - 1],
      pivot: [0, (leg.size[1] + length) / 2 - 1, 0], off: [0, 0, 0], paint: leg.paint });
  }
}
const BESTIARY_ART = new Set([
  "regent", "vcolossus", "scolossus", "titan", "pharaoh", "leviathan", "tidecrab", "vinewalker", "sunscarab",
  "crawler", "sentinel_e", "stalker", "mote", "guardian", "knight", "shard_scout", "burrower", "warden",
  "zombie", "skeleton", "creeper", "spider", "cave_spider", "slime", "voidwalker", "golem", "wanderer",
  // pass 2 (2026-11-06)
  "flare", "wailer", "boarkin", "brute", "rotboar", "hogbeast", "magma", "strider", "sheller",
  "scout", "whisker", "trotter", "minnow", "puffer", "squid", "dolphin", "fox", "bee",
  "blightking", "cindermaw", "sentinel", "dragon", "blight", "sovereign", "tempest"
]);

installCreatures(SPECIES);
for (const [id, def] of Object.entries(SPECIES)) if (def.expansion) BESTIARY_ART.add(id);
for (const id of ["cow", "pig", "sheep", "rabbit", "chicken", "parrot", "sunfin"]) BESTIARY_ART.add(id);

const duneArmor = P => {
  P.fill(["#ad773e", "#b88045", "#c18b4b"]);
  P.rect(0, 0, 16, 2, "#ebbd76");
  P.rect(0, 13, 16, 3, "#67432b");
  P.rect(0, 2, 1, 11, "#dca762");
  P.rect(15, 2, 1, 11, "#855329");
  P.rect(3, 5, 5, 1, "#946030");
  P.rect(7, 6, 1, 3, "#845229");
  P.rect(8, 8, 4, 1, "#edaa4b");
  P.rect(11, 9, 1, 3, "#ffd17b");
};
const duneBelly = solid(["#523930", "#664436", "#6f4a38"]);
const duneIvory = P => {
  P.fill(["#d9ad6a", "#d3a364"]);
  P.rect(2, 0, 2, 16, "#edcb8b");
  P.rect(12, 0, 4, 16, "#936436");
};
const duneFace = P => {
  P.fill(["#24150f", "#2d1b12", "#301e16"]);
  P.rect(1, 0, 1, 7, "#51301b");
  P.rect(2, 6, 1, 4, "#432617");
  P.rect(13, 8, 1, 7, "#3a2115");
};
function duneMawParts() {
  const parts = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    parts.push({
      name: "mawRim" + i, parent: "head", size: [23, 15, 22],
      pivot: [Math.sin(angle) * 40, Math.cos(angle) * 36, 33],
      off: [0, 0, 0], rotation: [0, 0, -angle], paint: { all: duneArmor, front: duneArmor }
    });
    for (let row = 0; row < 2; row++) {
      const a = angle + row * Math.PI / 12, radius = row ? 26 : 30;
      parts.push({
        name: "mawTooth" + row + "_" + i, parent: "head", size: [row ? 5 : 7, row ? 10 : 17, 9],
        taper: true,
        pivot: [Math.sin(a) * radius, Math.cos(a) * radius * 0.9, 45 - row * 8],
        off: [0, -4, 0], rotation: [0.15, 0, -a], paint: { all: duneIvory }
      });
    }
  }
  return parts;
}
SPECIES.leviathan_dune = {
  name: "Dune Leviathan", ai: "leviathan_dune", boss: true, hostile: true, noSave: true,
  noclip: true, burrows: true, speed: 3, hp: 180, w: 6, h: 5, deathPuff: "crumb",
  model: { parts: [
    { name: "head", mawShell: true, size: [74, 64, 58], pivot: [0, 34, 0], off: [0, 0, 0],
      paint: { all: duneArmor, front: duneFace, bottom: duneBelly } },
    { name: "crest", taperTop: true, parent: "head", size: [46, 15, 51], pivot: [0, 36, -6], off: [0, 4, 0],
      paint: { all: duneArmor } },
    ...[-1, 1].map(side => ({
      name: side < 0 ? "jawLeft" : "jawRight", parent: "head", size: [15, 35, 28],
      pivot: [side * 35, -6, 24], off: [side * 3, 0, 15], paint: { all: duneArmor, bottom: duneBelly }
    })),
    ...["jawLeft", "jawRight"].flatMap((parent, side) => [0, 1].map(row => ({
      name: parent + "fang" + row, parent, size: [12, row ? 11 : 16, 10],
      pivot: [(side ? -1 : 1) * 13, row ? 11 : -9, row ? 6 : 13], off: [0, 0, 0], paint: { all: duneIvory }
    }))),
    ...duneMawParts(),
    ...Array.from({ length: DUNE_SEGMENTS }, (_, i) => [
      { name: "segment" + i, rounded: true, size: [94 - i * 7, 74 - i * 5, 76], pivot: [0, 0, 0],
        off: [0, 35 - i * 2, 0], paint: { all: duneArmor, bottom: duneBelly } },
      { name: "ridge" + i, taperTop: true, parent: "segment" + i, size: [48 - i * 4, 15 - i, 46],
        pivot: [0, 36 - i * 2.5, -8], off: [0, 4, 0], paint: { all: duneArmor } },
      ...[-1, 1].map(side => ({
        name: "flank" + side + "_" + i, parent: "segment" + i,
        size: [23 - i, 9, 48], pivot: [side * (35 - i * 2.5), 15 - i, -5], off: [0, 0, 0],
        rotation: [0.12, 0, side * -0.6], paint: { all: duneArmor }
      }))
    ]).flat()
  ] }
};
SPECIES.leviathan_obsidian = {
  ...SPECIES.leviathan_dune,
  name: "Obsidian Leviathan", ai: "leviathan_obsidian", hp: 260, w: 8, h: 6, scale: 1.22, fireproof: true, deathPuff: "ember",
  model: { parts: SPECIES.leviathan_dune.model.parts.map(part => ({
    ...part,
    size: part.name.startsWith("ridge") ? [part.size[0] * 0.48, part.size[1] * 2.7, part.size[2] * 0.6] : part.size,
    paint: { all: P => {
      P.fill(["#28212e", "#342936", "#3e3039"]);
      P.rect(1, 2, 14, 1, "#625060");
      P.rect(3, 5, 2, 5, "#8f3128");
      P.rect(4, 9, 8, 1, "#df5730");
      P.rect(9, 10, 1, 4, "#ffa54c");
      if (part.name.includes("fang")) P.rect(2, 3, 12, 2, "#655866");
    }, ...(part.name === "head" ? { front: P => {
      P.fill(["#171017", "#20131b"]);
      P.rect(1, 0, 1, 7, "#6a2a22"); P.rect(2, 6, 1, 3, "#9f3b24");
      P.rect(13, 9, 1, 6, "#40201e");
    } } : {}) }
  })) }
};
SPECIES.leviathan_dune.segmentedLeviathan = SPECIES.leviathan_obsidian.segmentedLeviathan = true;
SPECIES.leviathan_ancient = {
  ...SPECIES.leviathan_dune, name: "Ancient Leviathan", ai: "leviathan_ancient",
  hp: 400, w: 10, h: 8, scale: 1.7, segmentSpacing: 9, fireproof: true, deathPuff: "pale",
  model: { parts: [
    ...SPECIES.leviathan_dune.model.parts.map(part => ({
      ...part,
      paint: { all: P => {
        P.fill(["#c6baa3", "#d4c8b1", "#b5a992"]);
        P.rect(0, 1, 16, 1, "#f1e7d1"); P.rect(1, 13, 14, 3, "#766a71");
        P.rect(5, 3, 1, 7, "#675a83"); P.rect(6, 9, 5, 1, "#a2dbed");
        P.rect(10, 5, 1, 5, "#91bde4");
      }, ...(part.name === "head" ? { front: P => {
        P.fill(["#242137", "#2a233c"]);
        P.rect(1, 0, 1, 7, "#655481"); P.rect(2, 6, 1, 3, "#7e9eb9");
        P.rect(13, 9, 1, 6, "#443656");
      } } : {}) }
    })),
    ...[-1, 1].flatMap(side => [0, 1].map(row => ({
      name: "crown" + side + row, taperTop: true, parent: "head", size: [9, 25 + row * 12, 13],
      pivot: [side * (28 - row * 12), 38, -15 + row * 24], off: [0, 10, 0],
      paint: { all: solid(["#e3d8bf", "#b8a8b4", "#c9b9cb"]) }
    })))
  ] }
};

installDesertMobs(SPECIES);
export const SPAWN_SPECIES = SPAWN_EGGS.map(e => e[0]);

SPECIES.ancient_companion = {
  name: "Runecrest", pet: true, noSave: true, hp: 24, speed: 3.2, w: 0.8, h: 0.85,
  ai: "animal", sound: "shell", tameWith: [], healWith: [I.SKYSHARD], drops: () => [], xp: 0,
  model: { type: "quad", parts: [
    ...quadParts({
      body: [11, 7, 17], head: [8, 6, 8], leg: 3, legH: 5, headUp: 1,
      bodyPaint: { all: P => {
        P.fill(["#ccc0a8", "#b9ae9b", "#d9cfb8"]);
        for (const y of [3, 8, 13]) P.rect(0, y, 16, 1, "#756982");
        P.rect(6, 4, 2, 8, "#9cd8e6");
      } },
      legPaint: { all: solid(["#8d8190", "#aea0a4"]) },
      headPaint: { all: solid(["#d5c9b1", "#bfb29d"]), front: P => {
        P.fill(["#cfc2aa"]); P.rect(2, 5, 3, 2, "#544968"); P.rect(11, 5, 3, 2, "#544968");
        P.rect(3, 5, 1, 1, "#b5eff2"); P.rect(12, 5, 1, 1, "#b5eff2");
      } }
    }),
    { name: "crest", size: [4, 4, 12], pivot: [0, 12, -2], off: [0, 0, 0], paint: { all: solid(["#8b7c9a", "#b1a5c0"]) } },
    { name: "tail", size: [5, 4, 11], pivot: [0, 7, -8], off: [0, 0, -5.5], paint: { all: solid(["#c2b39c", "#9c90a2"]) } },
    ...[-1, 1].map(side => ({ name: "horn" + side, parent: "head", size: [2, 5, 2],
      pivot: [side * 3, 4, -1], off: [0, 2, 0], paint: { all: solid(["#a4dcdf", "#ded3ba"]) } }))
  ] }
};

// ---------- block helpers ----------
function solidCell(world, x, y, z) {
  const v = world.get(x, y, z), id = idOf(v);
  if (isDoor(id) || isGate(id) || isTrapdoor(id)) return !(metaOf(v) & OPEN);
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
    this.npc = opts.npc || null;   // a named campaign character (js/campaign.js): talks instead of trading, can't be hurt
    this.name = opts.name || null; this.persist = !!(this.def.animal || this.def.persist || this.tame || this.name || opts.persist);
    this.cid = opts.cid ?? null; this.phase = "circle"; this.phaseT = 8; this.ang = 0; this.open = 0;
    // villagers: home, job site, trades used, restocks
    this.home = opts.home || null; this.job = opts.job || null; this.uses = opts.uses || null; this.restockT = opts.restockT || 0; this.restockDay = opts.restockDay || 0; this.restocks = opts.restocks || 0;
    this.taskT = 0; this.task = "wander"; this.summonT = opts.summonT || 0;
    // pets and mounts
    this.tame = !!opts.tame; this.sitting = !!opts.sitting; this.saddled = !!opts.saddled; this.temper = opts.temper || 0; this.ridden = false;
    if (this.def.villager) { this.uses = this.uses || []; while (this.uses.length < (TRADES[this.def.prof] || []).length) this.uses.push(0); }   // older saves may have fewer trades
    this.barterT = 0;
    // wildlife: color variant, a Pouncer's trust and the item in its mouth, a Buzzer's pollen and hive
    this.variant = opts.variant ?? (this.def.variants ? randi(0, this.def.variants.length - 1) : 0);
    if (this.def.expansion) this.bestiary = { ...opts.bestiary };
    this.trust = !!opts.trust; this.held = opts.held || 0; this.pollen = !!opts.pollen; this.inHive = !!opts.inHive; this.stung = !!opts.stung; this.perched = 0;
    this.onGround = false; this.inWater = false; this.inLava = false; this.walkPhase = 0; this.hurtT = 0; this.iframes = 0;
    this.attackCd = 0; this.thinkT = Math.random() * 0.3; this.state = "idle"; this.target = null; this.goal = null; this.path = null; this.pathT = 0;
    this.fuse = 0; this.burnT = 0; this.angry = opts.angry || 0; this.dead = 0; this.age = 0; this.fleeT = 0; this.wantJump = false; this.drawT = 0;
    this.stuckT = 0; this.lastX = x; this.lastZ = z; this.hopT = rand(0.5, 2);
    // minecarts and chest boats: what's inside, furnace fuel and push, a creature riding along, a lit Blast Block
    if (this.def.invSize) { const sl = new Array(this.def.invSize).fill(null); (opts.inv || []).forEach((q, i) => { if (i < sl.length) sl[i] = q; }); this.inv = { type: "chest", slots: sl }; }
    this.fuel = opts.fuel || 0; this.pushX = opts.pushX || 0; this.pushZ = opts.pushZ || 0; this.riderUid = opts.riderUid || null; this.fuseT = opts.fuseT || 0; this.hopperOff = !!opts.hopperOff;
  }
  get maxHp() { if (this.tame && this.def.tameHp) return this.def.tameHp; return this.def.ai === "slime" ? this.size * this.size * 1 + (this.size === 4 ? 0 : 0) || 1 : this.def.hp; }
  get scale() { return (this.def.scale || 1) * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  get w() { return this.def.w * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  get h() { return this.def.h * (this.baby ? 0.5 : 1) * (this.def.ai === "slime" ? this.size * 0.52 : 1); }
  aabb(x = this.pos.x, y = this.pos.y, z = this.pos.z) { const r = this.w / 2; return [x - r, y, z - r, x + r, y + this.h, z + r]; }
  get eyeY() { return this.pos.y + this.h * 0.85; }
  toJSON() {
    return { uid: this.uid, sp: this.sp, x: +this.pos.x.toFixed(2), y: +this.pos.y.toFixed(2), z: +this.pos.z.toFixed(2), yaw: +this.yaw.toFixed(2), hp: this.hp,
      baby: this.baby, growT: Math.round(this.growT), breedCd: Math.round(this.breedCd), sheared: this.sheared, eggT: Math.round(this.eggT), size: this.size, name: this.name, npc: this.npc,
      home: this.home, job: this.job, uses: this.uses, restockT: this.restockT, restockDay: this.restockDay, restocks: this.restocks, summonT: this.summonT,
      tame: this.tame, sitting: this.sitting, saddled: this.saddled, temper: this.temper,
      ...(this.def.expansion ? { bestiary: { ...this.bestiary, charge: 0, bounceUntil: 0 }, persist: this.persist } : {}),
      variant: this.variant, trust: this.trust, held: this.held, pollen: this.pollen, inHive: this.inHive, stung: this.stung,
      ...(this.def.cart || this.inv ? { inv: this.inv ? this.inv.slots.map(q => q && { ...q }) : undefined, fuel: Math.round(this.fuel), pushX: this.pushX, pushZ: this.pushZ, riderUid: this.riderE && !this.riderE.dead ? this.riderE.uid : null, fuseT: this.fuseT, hopperOff: this.hopperOff } : {}) };
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
    const def = e.def;
    const shaded = BESTIARY_ART.has(e.sp) || !!def.segmentedLeviathan;
    if (!def.geos) makeSpecies(def, shaded);
    const mat = new THREE.MeshBasicMaterial({ map: def.texs[e.variant] || def.tex, vertexColors: shaded, transparent: !!def.translucent, alphaTest: def.translucent ? 0.05 : 0.5, depthWrite: !def.translucent });
    const root = new THREE.Group(), parts = {};
    for (const p of def.model.parts) {
      const pivot = new THREE.Group(); pivot.position.set(p.pivot[0] / 16, p.pivot[1] / 16, p.pivot[2] / 16);
      if (p.rotation) pivot.rotation.set(...p.rotation);
      if (p.name.startsWith("mawRim")) pivot.userData.mawRest = pivot.position.clone();
      const m = new THREE.Mesh(def.geos[p.name], mat); m.position.set(p.off[0] / 16, p.off[1] / 16, p.off[2] / 16);
      pivot.add(m); (p.parent ? parts[p.parent].children[0] : root).add(pivot); parts[p.name] = pivot;
    }
    if (def.model.armsOut) { parts.armR.rotation.x = parts.armL.rotation.x = -Math.PI / 2; }
    if (def.model.type === "spider") for (const p of def.model.parts.filter(q => q.side)) { const g = parts[p.name]; g.rotation.y = p.side * (0.6 - p.index * 0.4); g.rotation.z = p.side * 0.4; g.userData.base = { y: g.rotation.y, z: g.rotation.z }; }
    const holder = new THREE.Group(); holder.add(root);
    e.mesh = holder; e.root = root; e.parts = parts; e.mat = mat;
    if (def.segmentedLeviathan) e.glow = createLeviathanGlow(e);
    this.scene.add(holder);
    if (def.segmentedLeviathan) {
      holder.position.set(e.pos.x, e.pos.y, e.pos.z); holder.rotation.y = e.yaw + Math.PI;
      root.scale.setScalar(e.scale);
      e.hitVolumes = createLeviathanHitVolumes(e); updateLeviathanHitVolumes(e);
    }
  }
  remove(e) { e.glow?.dispose(); e.glow = null; this.scene.remove(e.mesh); e.mat.dispose(); e.mesh = null; e.hitVolumes = null; if (e.heldMesh) { e.heldMesh.material.dispose(); e.heldMesh = null; } if (e.beam) { this.scene.remove(e.beam); e.beam.geometry.dispose(); e.beam.material.dispose(); e.beam = null; } }
  clear() {
    for (const e of this.list) this.remove(e);
    this.list = [];
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      p.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    this.projectiles = [];
    this.clearHazards();
  }

  // ----- saving -----
  // Creatures in chunks that unload are tucked into the world's store, then brought back when the chunk loads again.
  unloadChunk(c) {
    const w = this.world, keep = [];
    for (const e of this.list) {
      if (Math.floor(e.pos.x / CHUNK) !== c.cx || Math.floor(e.pos.z / CHUNK) !== c.cz) continue;
      if (e.sp === "dragon") { this.ctx.bossLeft(e); }
      if (e.persist && !e.dead && !e.def.noSave) keep.push(e.toJSON());
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
    // three Buzzers live in each wild bee nest
    if (!w.gen.isNether() && !(w.gen.isEnd && w.gen.isEnd())) for (let i = 0; i < c.data.length; i++) if ((c.data[i] & 255) === B.BEE_NEST) {
      const x = x0 + (i % CHUNK), z = z0 + (Math.floor(i / CHUNK) % CHUNK), y = Math.floor(i / (CHUNK * CHUNK));
      for (let k = 0; k < 3; k++) this.leaveHive(this.add("bee", x + 0.5, y, z + 0.5, { home: [x, y, z] }));   // they hover beside the nest
    }
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
    if (w.gen.isNether() || w.gen.isForsaken || (w.gen.isMap && w.gen.isMap())) return;   // the Ember Depths fill up through the spawner instead; the Forsaken World has no animals
    if (Math.random() > 0.3) return;
    const biome = w.gen.column(x0 + 8, z0 + 8).biome;
    if (biome === "peak") return;
    const woods = biome === "forest" || biome === "birch";
    const pool = biome === "sandy" ? [["rabbit", 12], ["camel", 6], ["camel_husk", 1]] : [["cow", 25], ["sheep", 25], ["pig", 20], ["chicken", 20], ["rabbit", 10], ["whisker", 4],
      ...(woods ? [["scout", 14], ["fox", 12], ["parrot", 8]] : []), ...(biome === "plains" ? [["trotter", 14], ["packass", 5], ["llama", 5], ["bone_trotter", 0.5], ["rot_trotter", 0.5]] : [])];
    let t = Math.random() * pool.reduce((s, p) => s + p[1], 0), sp = pool[0][0];
    for (const [k, wgt] of pool) { t -= wgt; if (t <= 0) { sp = k; break; } }
    const def = SPECIES[sp];
    const n = sp === "whisker" || (def.mount && !def.food.length) ? 1 : sp === "fox" || sp === "parrot" ? randi(1, 2) : randi(2, 4);
    for (let i = 0; i < n; i++) {
      const x = x0 + randi(1, 14), z = z0 + randi(1, 14), y = w.surfaceY(x, z), top = w.id(x, y, z);
      if (![B.GRASS, B.SAND, B.SNOW].includes(top)) continue;
      const baby = (!def.mount || def.food.length > 0) && Math.random() < 0.15;
      const height = Math.ceil(def.h * (baby ? 0.5 : 1));
      if (Array.from({ length: height }, (_, i) => i + 1).some(dy => solidCell(w, x, y + dy, z))) continue;
      this.add(sp, x + 0.5, y + 1, z + 0.5, { baby });
    }
  }

  // ----- hostile spawning around the player -----
  spawnTick(dt, daylight, camera) {
    this.spawnT -= dt;
    if (this.spawnT > 0) return;
    this.spawnT = 1;
    const ctx = this.ctx, s = ctx.settings(), w = this.world, p = ctx.player();
    // now and then, a Wanderer shows up during the day to trade
    const plain = !w.gen.isNether() && !(w.gen.isEnd && w.gen.isEnd()) && !w.gen.isForsaken && !(w.gen.isMap && w.gen.isMap());
    if (w.gen.isMap && w.gen.isMap()) return;   // the Deep and the Expanse have their own hand-placed creatures (js/lost.js)
    if (plain && daylight > 0.8 && (this.wanderT = (this.wanderT ?? 120) - 1) <= 0) {
      this.wanderT = 300;
      if (Math.random() < 0.5 && !this.list.some(e => e.sp === "wanderer")) {
        const a = Math.random() * Math.PI * 2, x = Math.floor(p.pos.x + Math.cos(a) * 14), z = Math.floor(p.pos.z + Math.sin(a) * 14);
        if (w.isLoaded(x, z)) { const y = w.surfaceY(x, z) + 1; if (SOLID[w.id(x, y - 1, z)] && !solidCell(w, x, y, z) && !solidCell(w, x, y + 1, z)) { this.add("wanderer", x + 0.5, y, z + 0.5);
          const packY = w.surfaceY(x + 2, z) + 1;
          if (w.isLoaded(x + 2, z) && Math.abs(packY - y) <= 1 && SOLID[w.id(x + 2, packY - 1, z)] &&
              ![0, 1, 2].some(dy => solidCell(w, x + 2, packY + dy, z))) this.add("trader_llama", x + 2.5, packY, z + 0.5);
          this.ctx.toast("A Wanderer has arrived to trade!"); } }
      }
    }
    if (plain && (this.waterT = (this.waterT || 0) - 1) <= 0) { this.waterT = 2; this.waterSpawn(w, p); }
    if (s.difficulty === "peaceful" || ctx.creative()) return;
    if (ctx.lantern && ctx.lantern()) return;   // a Wardlight Lantern in your hand keeps monsters from forming nearby
    const cap = ({ easy: 8, normal: 12, hard: 16 }[s.difficulty] || 10) * (w.gen.isForsaken ? 0.5 : 1);
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
      if (ctx.warded && ctx.warded(x + 0.5, z + 0.5)) continue;   // nothing forms inside a ward
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
  // Fish, Inklings, and Splashers show up in lakes and rivers around the player (they swim off again when you leave)
  waterSpawn(w, p) {
    const swimmers = this.list.filter(e => e.def.swims);
    if (swimmers.length >= 16) return;
    for (let tries = 0; tries < 4; tries++) {
      const ang = Math.random() * Math.PI * 2, dist = rand(12, 34);
      const x = Math.floor(p.pos.x + Math.cos(ang) * dist), z = Math.floor(p.pos.z + Math.sin(ang) * dist);
      if (!w.isLoaded(x, z)) continue;
      const top = w.surfaceY(x, z);
      if (w.id(x, top, z) !== B.WATER) continue;
      let depth = 0; while (depth < 12 && w.id(x, top - depth, z) === B.WATER) depth++;
      if (depth < 2) continue;
      const wide = [[7, 0], [-7, 0], [0, 7], [0, -7]].every(([dx, dz]) => w.isLoaded(x + dx, z + dz) && w.id(x + dx, top, z + dz) === B.WATER);
      const count = sp => swimmers.filter(e => e.sp === sp).length;
      const pool = [["minnow", 30], ["puffer", 5]];
      if (depth <= 4 || w.gen.column(x, z).biome === "sandy") pool.push(["sunfin", 18]);
      if (depth >= 4 && count("squid") < 4) pool.push(["squid", 14]);
      if (depth >= 4 && wide && count("dolphin") < 4) pool.push(["dolphin", 10]);
      let t = Math.random() * pool.reduce((s, q) => s + q[1], 0), sp = pool[0][0];
      for (const [k, wgt] of pool) { t -= wgt; if (t <= 0) { sp = k; break; } }
      const n = sp === "minnow" ? randi(3, 5) : sp === "sunfin" ? randi(2, 4) : sp === "dolphin" ? randi(1, 3) : 1;
      for (let i = 0; i < n; i++) {
        const sx = x + 0.5 + rand(-1.2, 1.2), sz = z + 0.5 + rand(-1.2, 1.2), sy = top - 1 + 0.1;
        if (w.id(Math.floor(sx), Math.floor(sy), Math.floor(sz)) === B.WATER && w.id(Math.floor(sx), Math.floor(sy + SPECIES[sp].h), Math.floor(sz)) === B.WATER) this.add(sp, sx, sy, sz);
      }
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
    if (biome === "crimson" && this.list.filter(e => e.sp === "zoglin" && !e.dead).length < 2) pool.push(["zoglin", 4]);
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
    spawnCreatures(this, dt, daylight, SPECIES);
    spawnDesertMobs(this, dt);
    for (const e of this.list) {
      if (e.gone) continue;
      if (e.encounterOwner && (e.encounterOwner.gone || e.encounterOwner.dead || !ctx.alive())) {
        e.gone = true;
        continue;
      }
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d2 = dx * dx + dz * dz;
      // far-away monsters wander off (despawn); animals and named creatures stay
      if (!e.persist && !e.def.noSave && (d2 > 72 * 72 || (d2 > 36 * 36 && Math.random() < dt / 30))) { e.gone = true; continue; }
      if (e.def.boss && !e.persist && d2 > 200 * 200) { e.gone = true; continue; }
      if (e.sp === "wanderer" && e.age > 300) { this.ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "poof"); e.gone = true; continue; }   // the Wanderer moves on
      if (!w.isLoaded(e.pos.x, e.pos.z)) continue;
      if (e.dead) { this.dying(e, dt); continue; }
      if (e.inCart) {   // a creature sitting in a minecart goes wherever the cart goes
        const c = e.inCart;
        if (c.gone || c.dead || !this.list.includes(c)) { e.inCart = null; }
        else { e.pos.x = c.pos.x; e.pos.y = c.pos.y + 0.15; e.pos.z = c.pos.z; e.vel.x = e.vel.y = e.vel.z = 0; e.goal = null; e.path = null; e.age += dt; this.animate(e, dt, d2, daylight); e.mesh.visible = d2 < 64 * 64; continue; }
      }
      if (e.ridden && !e.def.cart) {   // a Trotter you're riding moves with you (main.js steers it)
        e.age += dt; e.walkPhase += Math.hypot(e.vel.x, e.vel.z) * dt * 1.5;
        if (e.iframes > 0) e.iframes -= dt; if (e.hurtT > 0) e.hurtT -= dt;
        this.animate(e, dt, d2, daylight); e.mesh.visible = true; continue;
      }
      if (e.perched) { e.age += dt; this.perch(e); this.animate(e, dt, d2, daylight); e.mesh.visible = !!e.perched; continue; }   // a Chatterbird riding on your shoulder
      if (e.inHive) {   // Buzzers spend the night inside their nest
        e.mesh.visible = false; e.thinkT -= dt;
        if (e.thinkT <= 0) { e.thinkT = 1; this.think(e, daylight); }
        continue;
      }
      e.age += dt;
      if (d2 < 48 * 48 || e.def.boss) {
        e.thinkT -= dt;
        if (e.thinkT <= 0) { e.thinkT = d2 < 24 * 24 || e.def.boss ? 0.15 : 0.6; this.think(e, daylight); }
        this.physics(e, dt);
      }
      if (d2 < 64 * 64 || e.def.boss) this.animate(e, dt, d2, daylight);
      else if (e.def.expansion && e.beam) e.beam.visible = false;
      e.mesh.visible = (d2 < 64 * 64 || !!e.def.boss) && !(e.def.desertMob && e.def.burrows && !e.emerged);
    }
    this.sweep();
    this.updateProjectiles(dt);
    this.updateHazards(dt);
  }

  // ----- Cindermaw's fight -----
  // Phase 1 (above 2/3 health): fireball volleys, sweeping dives, fire breath on marked ground, and landings (the time to hit it hard).
  // Phase 2: Ember Pylons rise and shield it until you break them; marked eruption zones, wing gusts, and a few helpers.
  // Phase 3 (below 1/3): everything comes faster, plus a new combo (breath + eruptions), after which it lands worn out.
  // Every big attack has a warning: a roar and wind-up, glowing marks on the floor, or spread wings.
  cinderPhase(e) { return e.hp > e.maxHp * 0.66 ? 1 : e.hp > e.maxHp * 0.33 ? 2 : 3; }
  thinkCinder(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player(), A = ctx.arena();
    if (!A) return;
    const step = Math.min(0.5, e.age - (e.lastThink ?? e.age)); e.lastThink = e.age;
    const ph = this.cinderPhase(e), fast = ph === 3 ? 0.65 : 1, F = A.y;
    e.phaseT -= step; if (e.windT > 0) e.windT -= step; if (e.cd > 0) e.cd -= step;
    if (ph !== e.lastPhase) {
      if (e.lastPhase && ph > e.lastPhase) { ctx.toast(ph === 2 ? "Cindermaw calls on the Ember Pylons! Break them to weaken its shield." : "Cindermaw is badly hurt and furious! Watch for its new attack.", "bad"); Sound.mob("roar", 0); e.mouthT = 1.2; }
      if (ph >= 2) ctx.cinderPylons();
      e.lastPhase = ph;
    }
    const pylons = this.list.filter(o => o.sp === "pylon" && !o.dead);
    e.shielded = pylons.length > 0;
    e.healFrom = e.shielded ? pylons[Math.floor(e.age) % pylons.length] : null;
    if (e.shielded && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + 0.4 * step);
    const inArena = Math.hypot(p.pos.x - A.x, p.pos.z - A.z) < A.r + 1 && !ctx.creative();
    const keep = g => { const gx = g.x - A.x, gz = g.z - A.z, gl = Math.hypot(gx, gz), lim = A.r - 5; if (gl > lim) { g.x = A.x + gx / gl * lim; g.z = A.z + gz / gl * lim; } g.y = Math.max(F + 3, Math.min(F + 38, g.y)); return g; };
    const face = () => { e.yaw = Math.atan2(-(p.pos.x - e.pos.x), -(p.pos.z - e.pos.z)); };
    const toCircle = (t = 3.5) => { e.phase = "circle"; e.phaseT = rand(t, t + 2) * fast; e.perched = false; e.shot = 0; e.windT = 0; e.flapFast = false; };
    if (Math.random() < 0.006) Sound.mob("roar", d);
    switch (e.phase) {
      case "circle": {
        e.ang += step * 0.35 / fast;
        e.goal = keep({ x: A.x + Math.cos(e.ang) * 20, z: A.z + Math.sin(e.ang) * 20, y: F + 22 + Math.sin(e.ang * 2) * 5, speed: 10 });
        if (e.phaseT > 0 || !inArena) break;
        const r = Math.random(), picks = ph === 1 ? ["fireballs", "sweep", "breath", "land"] : ph === 2 ? ["fireballs", "sweep", "breath", "zones", "gust", "summon", "land"] : ["combo", "fireballs", "sweep", "zones", "gust", "breath", "summon"];
        let pick = picks[Math.floor(r * picks.length)];
        if (pick === "summon" && (e.cd > 0 || this.list.filter(o => o.cinderMinion && !o.dead).length >= 3)) pick = "fireballs";
        if (pick === "land" && e.shielded) pick = "zones";
        e.phase = pick; e.phaseT = 10; e.windT = pick === "sweep" ? 1.1 : pick === "gust" ? 1.3 : pick === "fireballs" ? 0.8 : 0; e.shot = 0;
        if (e.windT) { Sound.mob("roar", d); e.mouthT = e.windT; }
        break;
      }
      case "fireballs": {   // hover, glow, and spit a volley of 3 (5 in phase 3)
        e.goal = keep({ x: e.pos.x, z: e.pos.z, y: F + 14, speed: 6 }); face();
        if (e.windT > 0) { e.flapFast = true; break; }
        e.flapFast = false;
        if ((e.fireT = (e.fireT || 0) - step) <= 0 && e.shot < (ph === 3 ? 5 : 3)) { e.fireT = 0.35; e.shot++; e.mouthT = 0.4; this.shootFire(e, p, "fireball", 15, { dmg: 5, fromBoss: true }); }
        if (e.shot >= (ph === 3 ? 5 : 3)) toCircle();
        break;
      }
      case "sweep": {   // a readable wind-up (hover, roar, fast flaps), then a fast low pass through where you're standing
        if (e.windT > 0) { e.goal = null; face(); e.flapFast = true; e.target = { x: p.pos.x, y: p.pos.y + 1.2, z: p.pos.z }; break; }
        e.flapFast = false;
        const t = e.target || p.pos, dir = { x: t.x - e.pos.x, z: t.z - e.pos.z }, l = Math.hypot(dir.x, dir.z) || 1;
        e.goal = keep({ x: t.x + dir.x / l * 10, z: t.z + dir.z / l * 10, y: t.y, speed: 19 });
        if (d < 4 && e.attackCd <= 0) { ctx.hurtPlayer(e.def.dmg * dmgMul, "Cindermaw swept right through you! Watch for its roar, then dodge to the side.", e); e.attackCd = 2; }
        if (l < 3 || e.phaseT < 6.5) toCircle();
        break;
      }
      case "breath": {   // marks a line of floor with glowing rings, then breathes fire along it
        if (!e.shot) {
          e.shot = 1; e.windT = 1.3; const tx = p.pos.x, tz = p.pos.z, ang = Math.atan2(tz - A.z, tx - A.x);
          e.goal = keep({ x: tx - Math.cos(ang) * 9, z: tz - Math.sin(ang) * 9, y: F + 7, speed: 12 });
          for (let k = -1; k <= 1; k++) this.addHazard(tx + Math.cos(ang) * k * 3, F + 1, tz + Math.sin(ang) * k * 3, 2.6, 1.6 * fast, 5, "Cindermaw's fire breath caught you! Step out of the glowing rings.", 1.2);
          Sound.mob("flare", d); e.mouthT = 2.5;
        }
        face();
        if (e.phaseT < 6) toCircle();
        break;
      }
      case "zones": {   // eruptions: rings appear around you and burst after a moment
        if (!e.shot) {
          e.shot = 1; const n = ph === 3 ? 5 : 3;
          for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, rr = k === 0 ? 0 : rand(3, 7); this.addHazard(p.pos.x + Math.cos(a) * rr, F + 1, p.pos.z + Math.sin(a) * rr, 2.4, (ph === 3 ? 1.6 : 2) + k * 0.15, 6, "The floor erupted under you! Move out of the glowing rings.", 0); }
          Sound.mob("rumble", 0); e.mouthT = 1;
        }
        e.goal = keep({ x: A.x + Math.cos(e.ang) * 18, z: A.z + Math.sin(e.ang) * 18, y: F + 20, speed: 8 });
        if (e.phaseT < 7) toCircle();
        break;
      }
      case "gust": {   // spreads its wings, then a blast of wind that throws you back (hide behind a pillar!)
        e.goal = keep({ x: e.pos.x, z: e.pos.z, y: F + 9, speed: 5 }); face();
        if (e.windT > 0) { e.spread = true; if (Math.random() < 0.5) ctx.particles(e.pos.x + rand(-4, 4), e.pos.y + 2, e.pos.z + rand(-4, 4), "ash"); break; }
        e.spread = false;
        if (!e.shot) {
          e.shot = 1; Sound.mob("rumble", 0);
          const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1;
          if (l < 18 && this.lineToPlayer(e)) { ctx.push(dx / l * 13, 6, dz / l * 13); ctx.hurtPlayer(2 * dmgMul, "Cindermaw's wing gust knocked you down! Hide behind a pillar when it spreads its wings.", null); }
        }
        if (e.phaseT < 8) toCircle();
        break;
      }
      case "summon": {   // a couple of Magma Gloops and Flares join the fight (never more than 3 at once)
        e.cd = 25; Sound.mob("roar", d); e.mouthT = 1;
        for (let k = 0; k < 2; k++) { const a = Math.random() * Math.PI * 2, x = A.x + Math.cos(a) * 16, z = A.z + Math.sin(a) * 16; const m = this.add(Math.random() < 0.5 ? "magma" : "flare", x, F + 1.2, z, { size: 2 }); if (m) { m.cinderMinion = true; m.angry = 60; this.ctx.particles(x, F + 2, z, "fire"); } }
        toCircle();
        break;
      }
      case "combo": {   // phase 3: fire breath and eruptions together, then it lands worn out
        if (!e.shot) {
          e.shot = 1; const ang = Math.random() * Math.PI * 2;
          for (let k = 0; k < 4; k++) { const a = ang + k * Math.PI / 2; this.addHazard(p.pos.x + Math.cos(a) * 5, F + 1, p.pos.z + Math.sin(a) * 5, 2.6, 1.5, 6, "Cindermaw's inferno caught you! Stand where there are no rings.", 0.8); }
          this.addHazard(p.pos.x, F + 1, p.pos.z, 2.2, 2.2, 6, "Cindermaw's inferno caught you! Stand where there are no rings.", 0);
          Sound.mob("roar", 0); e.mouthT = 2;
        }
        e.goal = keep({ x: A.x, z: A.z, y: F + 16, speed: 8 });
        if (e.phaseT < 6.5) { e.phase = "land"; e.phaseT = 14; e.tired = true; }
        break;
      }
      case "land": {   // lands beside the altar: it takes full damage here (and even more when worn out after a combo)
        const lx = A.x, ly = F + 1, lz = A.z + 8;
        if (!e.perched) {
          const dist = Math.hypot(e.pos.x - lx, e.pos.y - ly, e.pos.z - lz);
          e.goal = { x: lx, z: lz, y: ly, speed: Math.max(2, Math.min(10, dist * 0.8)) };
          if (dist < 3) { e.perched = true; e.phaseT = e.tired ? 8 : 6.5; e.goal = null; e.vel.x = e.vel.y = e.vel.z = 0; e.pos.x = lx; e.pos.y = ly; e.pos.z = lz; ctx.toast(e.tired ? "Cindermaw is worn out! Hit it now!" : "Cindermaw landed! Now's your chance to hit it.", "good"); }
          else if (e.phaseT <= 0) toCircle();
        } else {
          face();
          // a tail sweep if you stand too close for too long (it rears up first)
          if (!e.tired && d < 6 && e.attackCd <= 0) { if (!e.tailT) { e.tailT = 0.9; e.mouthT = 0.9; Sound.mob("roar", d); } }
          if (e.tailT > 0) { e.tailT -= step; if (e.tailT <= 0) { e.tailT = 0; if (d < 6.5) { const dx = p.pos.x - e.pos.x, dz = p.pos.z - e.pos.z, l = Math.hypot(dx, dz) || 1; ctx.push(dx / l * 9, 5, dz / l * 9); ctx.hurtPlayer(4 * dmgMul, "Cindermaw's tail knocked you away! Back off when it rears up.", null); } e.attackCd = 3; } }
          if (e.phaseT <= 0) { e.perched = false; e.tired = false; e.phase = "takeoff"; e.phaseT = 3; }
        }
        break;
      }
      case "takeoff": e.goal = keep({ x: e.pos.x, z: e.pos.z - 6, y: F + 18, speed: 9 }); if (e.phaseT <= 0) toCircle(); break;
      default: toCircle();
    }
  }
  // ----- listeners: they go to sounds they hear, and only notice you directly when you're very close -----
  hear(ev) {
    for (const e of this.list) {
      if (!e.def.hears || e.dead) continue;
      const d = Math.hypot(e.pos.x - ev.x, e.pos.y - ev.y, e.pos.z - ev.z);
      if (d > ev.r) continue;
      e.heard = { x: ev.x, y: ev.y, z: ev.z, t: 10 };
      if (ev.player && d < ev.r * 0.5) e.alertT = Math.max(e.alertT || 0, 8);   // a loud noise close by: it knows it's you
    }
  }
  thinkListener(e, d) {   // returns true when it isn't chasing you (so the normal fighting code doesn't run)
    const p = this.ctx.player(), step = Math.min(0.6, e.age - (e.lastListen ?? e.age)); e.lastListen = e.age;
    if (!e.home) e.home = { x: e.pos.x, y: e.pos.y, z: e.pos.z };
    if (e.alertT > 0) e.alertT -= step;
    if (e.heard) e.heard.t -= step;
    if (e.dormant) { e.goal = null; if (e.alertT > 0 || (e.heard && Math.hypot(e.pos.x - e.heard.x, e.pos.z - e.heard.z) < 4)) { e.dormant = false; this.ctx.particles(e.pos.x, e.pos.y + e.def.h, e.pos.z, "pale"); Sound.mob("clank", d); } else return true; }
    if (e.def.burrows && !e.emerged) {   // hidden until you come close; glowing cracks mark where it will come up
      e.mesh.visible = false;
      if (d < 7 && this.targetable()) { if (!e.emergeT) { e.emergeT = 0.9; } }
      if (e.emergeT > 0) { e.emergeT -= step; this.ctx.particles(e.pos.x, e.pos.y + 0.2, e.pos.z, "pale"); if (e.emergeT <= 0) { e.emerged = true; e.alertT = 10; Sound.mob("chitter", d); } }
      e.goal = null; return true;
    }
    const sneaking = p.crouch;
    if (d < (sneaking ? 1.6 : 3.2) && this.targetable()) e.alertT = Math.max(e.alertT || 0, 6);   // too close: it senses you
    const fromHome = Math.hypot(e.pos.x - e.home.x, e.pos.z - e.home.z);
    if (fromHome > (e.def.leash || 20)) { e.alertT = 0; e.heard = null; e.goal = { x: e.home.x, y: e.home.y, z: e.home.z, speed: e.def.speed }; return true; }   // too far from home: it goes back
    if (e.alertT > 0) return false;   // hunting you: the normal fighting code takes over
    if (e.heard && e.heard.t > 0) { this.moveTo(e, e.heard, e.def.speed * 0.8, 1); if (Math.hypot(e.pos.x - e.heard.x, e.pos.z - e.heard.z) < 1.5) e.heard.t = Math.min(e.heard.t, 2); return true; }
    e.heard = null;
    if (Math.random() < 0.05) { const a = Math.random() * Math.PI * 2; e.goal = { x: e.home.x + Math.cos(a) * 4, y: e.home.y, z: e.home.z + Math.sin(a) * 4, speed: e.def.speed * 0.4 }; }
    return true;
  }
  // Echo Sentinel: a slow, glowing wind-up, then a pulse ring around it (back away, or get behind something)
  thinkPulse(e, d, dmgMul) {
    const p = this.ctx.player(), step = Math.min(0.6, e.age - (e.lastPulse ?? e.age)); e.lastPulse = e.age;
    if (e.charge > 0) { e.charge -= step; e.goal = null; if (Math.random() < 0.6) this.ctx.particles(e.pos.x, e.pos.y + 1.5, e.pos.z, "pale"); if (e.charge <= 0) { this.addHazard(e.pos.x, e.pos.y, e.pos.z, 5, 0.01, 4, "An Echo Sentinel's pulse hit you. Back away when it glows!", 0); e.cd = 4; } return; }
    if (e.cd > 0) e.cd -= step;
    if (d < 6 && e.cd <= 0 && this.targetable()) { e.charge = 1.3; Sound.mob("crystal", d); return; }
    this.chase(e, p);
  }
  // Resonance Mote: floats toward you and zaps; tied to a relay it guards
  thinkMote(e, d, dmgMul) {
    const p = this.ctx.player();
    e.goal = { x: p.pos.x, y: p.pos.y + 1.6, z: p.pos.z, speed: e.def.speed };
    if (d < e.def.reach && e.attackCd <= 0 && this.targetable()) { this.ctx.hurtPlayer(e.def.dmg * dmgMul, "A Resonance Mote zapped you. Break motes with a quick hit!", e); e.attackCd = 1.4; }
  }
  // Marked danger rings on the floor: a warning glow, then damage to anyone inside (lasting `burn` seconds for breath)
  addHazard(x, y, z, r, warn, dmg, why, burn, options = {}) {
    if (!this.hazards) this.hazards = [];
    if (this.hazards.length >= 32) return;
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.35, r, 28), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    const fill = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color: 0xff3a10, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    if (options.color !== undefined) { ring.material.color.setHex(options.color); fill.material.color.setHex(options.color); }
    for (const m of [ring, fill]) { m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.03, z); this.scene.add(m); }
    this.hazards.push({ x, y, z, r, t: warn, warn, dmg, why, burn: burn || 0, ring, fill, hitT: 0,
      owner: options.owner, damageKind: options.damageKind, particle: options.particle || "fire",
      statusEffect: options.statusEffect === undefined ? "fire" : options.statusEffect, color: options.color });
  }
  updateHazards(dt) {
    if (!this.hazards || !this.hazards.length) return;
    const p = this.ctx.player();
    for (const h of this.hazards) {
      if (h.owner && (h.owner.gone || h.owner.dead || h.owner.tame)) { h.gone = true; continue; }
      h.t -= dt;
      const inside = Math.hypot(p.pos.x - h.x, p.pos.z - h.z) < h.r && Math.abs(p.pos.y - h.y) < 3;
      if (h.t > 0) { h.fill.material.opacity = 0.12 + (1 - h.t / h.warn) * 0.3; h.ring.material.opacity = 0.5 + Math.sin(h.t * 14) * 0.15; continue; }
      if (!h.fired) { h.fired = true; for (let k = 0; k < 3; k++) this.ctx.particles(h.x + rand(-h.r, h.r) * 0.6, h.y + 0.3, h.z + rand(-h.r, h.r) * 0.6, h.particle); Sound.mob("fireshoot", this.dist({ pos: h })); h.fill.material.color.setHex(h.color ?? 0xffb030); h.fill.material.opacity = 0.45; }
      if (inside && (h.hitT -= dt) <= 0) { h.hitT = 0.5; this.ctx.hurtPlayer(h.dmg * ({ peaceful: 0, easy: 0.67, normal: 1, hard: 1.5 }[this.ctx.settings().difficulty] ?? 1), h.why, h.owner || null, h.damageKind); if (h.statusEffect) this.ctx.effect(h.statusEffect, 3); }
      if (h.t < -Math.max(0.35, h.burn)) h.gone = true;
    }
    this.hazards = this.hazards.filter(h => { if (!h.gone) return true; for (const m of [h.ring, h.fill]) { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); } return false; });
  }
  clearHazards() { for (const h of this.hazards || []) h.gone = true; this.hazards = (this.hazards || []).filter(h => { for (const m of [h.ring, h.fill]) { this.scene.remove(m); m.geometry.dispose(); m.material.dispose(); } return false; }); }

  physics(e, dt) {
    const w = this.world, def = e.def, ctx = this.ctx;
    if (def.static || def.noclip) {   // crystals and shellers stay put; the wyrm flies straight through anything
      if (e.iframes > 0) e.iframes -= dt; if (e.hurtT > 0) e.hurtT -= dt; if (e.attackCd > 0) e.attackCd -= dt;
      if (def.noclip) {
        if (def.segmentedLeviathan && stepBondedLeviathan(w, e, dt)) return;
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
    e.inWater = liquidAt(w, e.pos.x, e.pos.y + (def.swims ? e.h / 2 : 0.3), e.pos.z) === "water";
    e.inLava = liquidAt(w, e.pos.x, e.pos.y + 0.3, e.pos.z) === "lava";
    if (def.swims) return this.swimPhysics(e, dt);
    if (def.boat) return this.boatPhysics(e, dt);
    if (def.cart) return this.cartPhysics(e, dt);
    // steering toward the current goal
    let speed = 0, mx = 0, mz = 0;
    if (e.goal && !e.frozen) {
      const gx = e.goal.x - e.pos.x, gz = e.goal.z - e.pos.z, gl = Math.hypot(gx, gz);
      if (gl > 0.25) { mx = gx / gl; mz = gz / gl; speed = e.goal.speed || def.speed; e.yaw = turn(e.yaw, Math.atan2(-mx, -mz), dt * 8); }
      else if (def.flies && e.goal.y !== undefined && Math.abs(e.goal.y - e.pos.y) > 0.4) { /* right above or below it: keep rising or sinking */ }
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
    if (def.flies && def.lands && !e.goal) {   // Chatterbirds flutter down and rest when they have nowhere to go
      e.vel.y = Math.max(e.vel.y - GRAV * 0.4 * dt, -2.5); e.vel.x *= 0.9; e.vel.z *= 0.9;
    } else if (def.flies) {   // flyers steer up and down toward their goal height
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
      else if (def.flies) e.vel.y = 2.5;               // flyers rise over things in the way
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

  // Fish, Inklings, and Splashers swim in any direction underwater; out of the water they flop and slowly dry out
  swimPhysics(e, dt) {
    const w = this.world, def = e.def;
    if (e.iframes > 0) e.iframes -= dt; if (e.hurtT > 0) e.hurtT -= dt; if (e.attackCd > 0) e.attackCd -= dt;
    if (e.leapT > 0) e.leapT -= dt;
    if (e.inWater && !(e.leapT > 0)) {
      e.dryT = 0;
      let tx = 0, ty = 0, tz = 0, sp = 0;
      if (e.goal) {
        const gx = e.goal.x - e.pos.x, gy = (e.goal.y ?? e.pos.y) - e.pos.y, gz = e.goal.z - e.pos.z, gl = Math.hypot(gx, gy, gz);
        if (gl > 0.3) { tx = gx / gl; ty = gy / gl; tz = gz / gl; sp = e.goal.speed || def.speed; } else e.goal = null;
      }
      const k = e.knock > 0 ? 0.02 : Math.min(1, dt * 3);
      e.vel.x += (tx * sp - e.vel.x) * k; e.vel.y += (ty * sp - e.vel.y) * k; e.vel.z += (tz * sp - e.vel.z) * k;
      if (e.vel.y > 0 && liquidAt(w, e.pos.x, e.pos.y + e.h + 0.15, e.pos.z) !== "water") e.vel.y = 0;   // stay under the surface
      if (Math.hypot(e.vel.x, e.vel.z) > 0.3) e.yaw = turn(e.yaw, Math.atan2(-e.vel.x, -e.vel.z), dt * 5);
    } else if (!e.inWater) {
      e.vel.y = Math.max(e.vel.y - GRAV * dt, -30); e.vel.x *= 0.98; e.vel.z *= 0.98;
      if (e.onGround) {
        e.vel.x *= 0.7; e.vel.z *= 0.7;
        if (Math.random() < dt * 2) { e.vel.y = 4; e.vel.x = rand(-1.5, 1.5); e.vel.z = rand(-1.5, 1.5); }   // flop!
        e.dryT = (e.dryT || 0) + dt;
        if (e.dryT > (def.dryTime || 6) && (e.dryHurt = (e.dryHurt || 0) - dt) <= 0) { e.dryHurt = 1; this.damage(e, 1, null); }
      }
    }
    if (e.knock > 0) e.knock -= dt;
    const bumped = moveBody(w, e, dt);
    if (e.inLava && (e.lavaT = (e.lavaT || 0) - dt) <= 0) { e.lavaT = 0.5; this.damage(e, 4, null); }
    if (bumped && e.inWater) e.goal = null;   // swam into something: pick a new way
    e.walkPhase += dt * (2 + Math.hypot(e.vel.x, e.vel.y, e.vel.z) * 2);
    if (e.pos.y < -10) e.gone = true;
  }
  // Boats float on the water's surface and slide to a stop
  // Minecarts: roll along rails (js/rails.js); off the rails they slide to a stop like a boat on land
  cartPhysics(e, dt) {
    const ctx = this.ctx, w = this.world, p = ctx.player();
    if (e.iframes > 0) e.iframes -= dt; if (e.hurtT > 0) e.hurtT -= dt;
    // walking into a cart shoves it
    if (!e.ridden && !ctx.creative()) {
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.8 && Math.abs(e.pos.y - p.pos.y) < 1 && d > 0.01) { e.vel.x += dx / d * 6 * dt; e.vel.z += dz / d * 6 * dt; }
    }
    let fuel = null;
    if (e.sp === "furnace_cart" && e.fuel > 0) { e.fuel -= dt; fuel = [e.pushX, e.pushZ]; if (Math.random() < dt * 6) ctx.particles(e.pos.x, e.pos.y + 1.1, e.pos.z, "ash"); if (e.fuel <= 0) e.fuel = 0; }
    if (e.riderUid && !e.riderE) { const r = this.list.find(o => o.uid === e.riderUid); if (r) { e.riderE = r; r.inCart = e; } }
    if (e.riderE && (e.riderE.dead || e.riderE.gone || e.riderE.inCart !== e)) { e.riderE = null; e.riderUid = null; }
    const onRail = cartStep(w, e, dt, { push: e.ridden ? ctx.cartInput() : null, rider: !!(e.ridden || e.riderE), fuel });
    if (!onRail) {
      e.onRail = null;
      e.vel.y = Math.max(e.vel.y - GRAV * dt, -30);
      const f = e.onGround ? Math.pow(0.5, dt * 20) : 0.995;
      e.vel.x *= f; e.vel.z *= f;
      moveBody(w, e, dt);
    }
    const r = e.onRail;
    // activator rails: throw riders out, light a Blast Block cart, switch a hopper cart off
    if (r && r.id === B.ACTIVATOR_RAIL) {
      if (r.on) { if (e.ridden) ctx.ejectCart(e); if (e.riderE) { e.riderE.inCart = null; e.riderE.pos.x += 1; e.riderE = null; e.riderUid = null; } if (e.sp === "tnt_cart" && !e.fuseT) { e.fuseT = 4; Sound.mob("fuse", this.dist(e)); } if (e.sp === "hopper_cart") e.hopperOff = true; }
      else if (e.sp === "hopper_cart") e.hopperOff = false;
    }
    // a lit Blast Block cart explodes (harder the faster it's going)
    if (e.fuseT > 0) {
      e.fuseT -= dt;
      if (e.mesh) e.mesh.traverse(o => { if (o.material && o.material.color) o.material.color.setScalar(Math.sin(e.fuseT * 18) > 0 ? 1.6 : 1); });
      if (e.fuseT <= 0) { e.gone = true; ctx.explode(e.pos.x, e.pos.y + 0.5, e.pos.z, 4 + Math.min(5, Math.hypot(e.vel.x, e.vel.z) / 8 * 5) * 0.3, null); return; }
    }
    // an empty minecart picks up a creature that bumps into it
    if (e.sp === "minecart" && !e.ridden && !e.riderE) {
      const m = this.list.find(o => !o.dead && !o.gone && !o.def.object && !o.def.boss && !o.def.flies && !o.def.swims && !o.inCart && !o.ridden && o.w <= 1.4 && !o.static &&
        Math.abs(o.pos.x - e.pos.x) < 0.7 && Math.abs(o.pos.z - e.pos.z) < 0.7 && Math.abs(o.pos.y - e.pos.y) < 0.8);
      if (m && (Math.hypot(e.vel.x, e.vel.z) > 0.3 || Math.hypot(m.vel.x, m.vel.z) > 0.3)) { m.inCart = e; e.riderE = m; e.riderUid = m.uid; }
    }
    // a hopper cart picks up items and pulls from containers above it
    if (e.sp === "hopper_cart" && !e.hopperOff && (e.pullT = (e.pullT || 0) - dt) <= 0) { e.pullT = 0.2; ctx.cartPull(e); }
    // carts bump into each other and share their speed
    for (const o of this.list) {
      if (o === e || !o.def.cart || o.dead || o.gone) continue;
      const dx = o.pos.x - e.pos.x, dz = o.pos.z - e.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.98 || d < 1e-3 || Math.abs(o.pos.y - e.pos.y) > 0.8) continue;
      const nx = dx / d, nz = dz / d, rel = (e.vel.x - o.vel.x) * nx + (e.vel.z - o.vel.z) * nz;
      if (rel > 0) { e.vel.x -= rel * nx; e.vel.z -= rel * nz; o.vel.x += rel * nx; o.vel.z += rel * nz; }
      const push = (0.98 - d) / 2; e.pos.x -= nx * push; e.pos.z -= nz * push; o.pos.x += nx * push; o.pos.z += nz * push;
    }
    if (e.pos.y < -10) e.gone = true;
  }
  boatPhysics(e, dt) {
    const top = this.waterTop(e.pos.x, e.pos.y, e.pos.z);
    if (top !== null) { e.vel.y += ((top - 0.12 - e.pos.y) * 6 - e.vel.y) * Math.min(1, dt * 8); e.vel.x *= 0.96; e.vel.z *= 0.96; }
    else { e.vel.y = Math.max(e.vel.y - GRAV * dt, -30); e.vel.x *= 0.8; e.vel.z *= 0.8; }
    if (e.iframes > 0) e.iframes -= dt; if (e.hurtT > 0) e.hurtT -= dt;
    if (e.knock > 0) e.knock -= dt;
    moveBody(this.world, e, dt);
    if (e.pos.y < -10) e.gone = true;
  }
  // Height of the water's surface at or just under (x, y, z), or null if there's no water there
  waterTop(x, y, z) {
    const w = this.world, fx = Math.floor(x), fz = Math.floor(z);
    let t = null;
    for (const yy of [Math.floor(y + 0.4), Math.floor(y + 0.4) - 1]) if (w.id(fx, yy, fz) === B.WATER) { t = yy; break; }
    if (t === null) return null;
    while (w.id(fx, t + 1, fz) === B.WATER) t++;
    return t + 1;
  }
  // Pick a spot in the water to swim to (a direction can be given to swim away from something)
  waterGoal(e, r, speed, dir = null) {
    const w = this.world;
    for (let k = 0; k < 8; k++) {
      const x = e.pos.x + (dir ? dir.x * r : 0) + rand(-r, r) * (dir ? 0.4 : 1), z = e.pos.z + (dir ? dir.z * r : 0) + rand(-r, r) * (dir ? 0.4 : 1), y = e.pos.y + rand(-1.5, 1.5);
      if (w.id(Math.floor(x), Math.floor(y), Math.floor(z)) === B.WATER && w.id(Math.floor(x), Math.floor(y + e.h), Math.floor(z)) === B.WATER && lineOfSight(w, { x: e.pos.x, y: e.pos.y + e.h / 2, z: e.pos.z }, { x, y: y + e.h / 2, z })) {
        e.goal = { x, y, z, speed }; return true;
      }
    }
    return false;
  }

  dist(e) { const p = this.ctx.player(); return Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y, e.pos.z - p.pos.z); }
  canSeePlayer(e) { const p = this.ctx.player(); return lineOfSight(this.world, { x: e.pos.x, y: e.eyeY, z: e.pos.z }, { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }); }
  targetable() { const ctx = this.ctx; return !ctx.creative() && ctx.alive() && ctx.settings().difficulty !== "peaceful"; }

  // ----- decisions (a few times per second) -----
  think(e, daylight) {
    const ctx = this.ctx, p = ctx.player(), w = this.world, def = e.def, d = this.dist(e);
    const dmgMul = { peaceful: 0, easy: 0.67, normal: 1, hard: 1.5 }[ctx.settings().difficulty] ?? 1;
    if (def.segmentedLeviathan) {
      ctx.leviathanThink(e, dmgMul);
      return;
    }
    // undead burn in sunlight
    if (def.burns && daylight > 0.75 && !e.inWater && !e.cpRaid) {   // (campaign raiders wear hoods)
      const L = w.lightAt(Math.floor(e.pos.x), Math.floor(e.eyeY), Math.floor(e.pos.z));
      if (L && L[0] >= 15) e.burning = Math.max(e.burning || 0, 3);
    }
    if (def.hostile && !def.boss && ctx.settings().difficulty === "peaceful") { e.gone = true; return; }
    if (thinkDesertMob(this, e, d, dmgMul)) return;
    if (thinkCreature(this, e, daylight)) return;
    if (def.pet && e.tame) return this.thinkPet(e, d, dmgMul);
    if (def.boat || def.cart) return;
    if (def.swims) return this.thinkSwimmer(e, d, dmgMul);
    if (def.ai === "bee") return this.thinkBee(e, d, dmgMul, daylight);
    if (def.ai === "fox") return this.thinkFox(e, d, dmgMul, daylight);
    if (def.ai === "scout" && !(e.angry > 0)) { this.wander(e); return; }   // wild Scouts leave you alone unless you hit one
    if (def.animal) return this.thinkAnimal(e, d);
    if (e.sp === "voidwalker") return this.thinkVoidwalker(e, d, dmgMul);
    if (def.ai === "flare" || def.ai === "wailer") return this.thinkFlyer(e, d, dmgMul);
    if (def.ai === "crystal") return;
    if (def.ai === "sheller") return this.thinkSheller(e, d, dmgMul);
    if (def.ai === "dragon") return this.thinkDragon(e, d, dmgMul);
    if (def.ai === "cindermaw") return this.thinkCinder(e, d, dmgMul);
    if (this.bossAI && this.bossAI[def.ai]) return this.bossAI[def.ai](this, e, d, dmgMul);
    if (def.hears && this.thinkListener(e, d)) return;
    if (def.ai === "pulse") return this.thinkPulse(e, d, dmgMul);
    if (def.ai === "mote") return this.thinkMote(e, d, dmgMul);
    if (def.ai === "herobrine") {   // a puppet: js/forsaken.js gives him somewhere to walk (e.chase) or tells him to stand and stare
      if (e.chase) this.moveTo(e, e.chase, e.chaseSpeed || def.speed, 1.5); else e.goal = null;
      return;
    }
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
    if (e.bellT > 0) e.bellT -= 0.15;   // a ringing bell sends villagers home for a while
    const ctx = this.ctx, time = ctx.time(), night = (time > 0.52 && time < 0.97) || e.bellT > 0;
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
    if (e.def.flies) return this.wanderFly(e, 0.3, 3);
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
    if (def.flies) {   // a tame Chatterbird flies after you and hops onto your shoulder
      if (Math.random() < 0.004) this.mimic(e);
      if (d > 24) { this.petTeleport(e, p); return; }
      if (d < 2.2 && !(e.perchCd > 0) && this.canPerch()) { e.perched = this.list.some(o => o.perched === -1) ? 1 : -1; e.goal = null; Sound.mob("squawk", 0); return; }
      if (e.perchCd > 0) e.perchCd -= 0.15;
      if (d > 4 || (d > 2 && !(e.perchCd > 0))) e.goal = { x: p.pos.x, y: p.pos.y + 1.6, z: p.pos.z, speed: def.speed * (d > 10 ? 2 : 1.4) };
      else e.goal = null;
      return;
    }
    if (d > 24) this.petTeleport(e, p);
    else if (d > 5) this.moveTo(e, p.pos, def.speed * (d > 10 ? 1.7 : 1.2), 2.5);
    else { e.goal = null; e.path = null; }
  }
  // ----- Chatterbirds [parrots] -----
  canPerch() {
    const ctx = this.ctx, p = ctx.player();
    return this.list.filter(o => o.perched).length < 2 && !p.inWater && !p.flying && !p.gliding && !ctx.riding() && !p.crouch && ctx.alive();
  }
  // Rides on your shoulder (shown small in the corner of your view) until you crouch, swim, fly, ride, or get hurt
  perch(e) {
    const ctx = this.ctx, p = ctx.player();
    if (!e.tame || e.sitting || p.inWater || p.flying || p.gliding || ctx.riding() || p.crouch || !ctx.alive() || p.hurtT > 0) { this.unperch(e); return; }
    const s = e.perched, c = Math.cos(p.yaw), sn = Math.sin(p.yaw);
    e.pos.x = p.pos.x + c * s * 0.55 - sn * 0.75; e.pos.z = p.pos.z - sn * s * 0.55 - c * 0.75; e.pos.y = p.pos.y + p.eye - 0.5;
    e.vel.x = e.vel.y = e.vel.z = 0; e.yaw = p.yaw + Math.PI - s * 0.8; e.onGround = true; e.goal = null;   // turned partly toward you so you can see its face
    if (e.iframes > 0) e.iframes -= 1 / 60; if (e.hurtT > 0) e.hurtT -= 1 / 60;
    if (Math.random() < 0.002) Sound.mob("squawk", 0);
    if (Math.random() < 0.004) this.mimic(e);
  }
  unperch(e) {
    const p = this.ctx.player();
    e.perched = 0; e.perchCd = 6; e.pos.x = p.pos.x; e.pos.z = p.pos.z; e.pos.y = p.pos.y + 1.2; e.vel.y = 2;
  }
  // copies the sound of a monster nearby, a handy warning
  mimic(e) {
    const p = this.ctx.player(), foe = this.list.find(o => o.def.hostile && !o.dead && Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z) < 16);
    if (foe && foe.def.sound) Sound.mob(foe.def.sound, 6);
  }
  wanderFly(e, lo, hi) {
    if (e.goal && Math.random() > 0.05) return;
    if (Math.random() < 0.15) {
      const a = Math.random() * Math.PI * 2, r = rand(2, 7), x = e.pos.x + Math.cos(a) * r, z = e.pos.z + Math.sin(a) * r;
      if (!this.world.isLoaded(x, z)) return;
      const gy = this.world.surfaceY(Math.floor(x), Math.floor(z)) + 1 + rand(lo, hi);
      if (Math.abs(gy - e.pos.y) < 6) e.goal = { x, y: gy, z, speed: e.def.speed * 0.5 };
    }
  }
  // Look for one of these blocks near a spot by checking a few random columns (cheap enough to do now and then)
  findBlock(pos, r, ids, down = 5, up = 4, tries = 24) {
    const w = this.world;
    for (let k = 0; k < tries; k++) {
      const x = Math.floor(pos.x + rand(-r, r)), z = Math.floor(pos.z + rand(-r, r));
      if (!w.isLoaded(x, z)) continue;
      for (let y = Math.floor(pos.y) + up; y >= Math.floor(pos.y) - down; y--) if (ids.includes(w.id(x, y, z))) return [x, y, z];
    }
    return null;
  }

  // ----- water life -----
  thinkSwimmer(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player(), def = e.def;
    if (!e.inWater) { e.goal = null; return; }
    if (Math.random() < 0.01) Sound.mob(def.sound, d);
    if (def.ai === "dolphin") return this.thinkDolphin(e, d, dmgMul);
    if (def.ai === "puffer") {   // puffs up when you get close, and stings if you touch it while puffed
      e.puff = d < 3.2 && !e.dead ? Math.min(1, (e.puff || 0) + 0.35) : Math.max(0, (e.puff || 0) - 0.08);
      if (e.puff > 0.8 && d < 1.3 && e.attackCd <= 0 && this.targetable()) { ctx.hurtPlayer(1 * dmgMul, "A Puffer's spikes stung you!", e); ctx.effect("poison", 6); e.attackCd = 1.5; }
    }
    if (e.fleeT > 0) {
      e.fleeT -= 0.15;
      if (!e.goal || Math.random() < 0.2) { const ax = e.pos.x - p.pos.x, az = e.pos.z - p.pos.z, l = Math.hypot(ax, az) || 1; this.waterGoal(e, 5, def.speed * 2.2, { x: ax / l, z: az / l }); }
      return;
    }
    if (e.goal && Math.random() > 0.04) return;
    if (def.school) {   // fish of a kind swim together
      const mates = this.list.filter(o => o !== e && o.sp === e.sp && !o.dead && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 10);
      const far = mates.find(o => Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) > 3);
      if (far && Math.random() < 0.6) { const l = Math.hypot(far.pos.x - e.pos.x, far.pos.z - e.pos.z) || 1; this.waterGoal(e, 3, def.speed * 0.8, { x: (far.pos.x - e.pos.x) / l, z: (far.pos.z - e.pos.z) / l }); return; }
    }
    this.waterGoal(e, def.ai === "squid" ? 5 : 4, def.speed * (def.ai === "squid" ? 0.5 : 0.6));
  }
  // Splashers: playful, swim alongside swimmers and boats, leap out of the water, and share their speed
  thinkDolphin(e, d, dmgMul) {
    const ctx = this.ctx, p = ctx.player(), def = e.def;
    if (e.angry > 0 && this.targetable()) {
      e.angry -= 0.15;
      e.goal = { x: p.pos.x, y: p.pos.y + 0.4, z: p.pos.z, speed: def.speed };
      if (d < def.reach && e.attackCd <= 0) { ctx.hurtPlayer(def.dmg * dmgMul, "A Splasher bumped you hard! Splashers are friendly unless you hit one.", e); e.attackCd = 1.2; }
      return;
    }
    const withYou = (p.inWater || ctx.boating()) && d < 14;
    if (withYou) {
      if (d < 7 && p.inWater) ctx.effect("dolphin", 6);
      if (d > 3 || !e.goal) { const a = Math.random() * Math.PI * 2; e.goal = { x: p.pos.x + Math.cos(a) * 2.5, y: Math.min(p.pos.y, e.pos.y + 1), z: p.pos.z + Math.sin(a) * 2.5, speed: def.speed * (d > 6 ? 1.2 : 0.7) }; }
    } else if (!e.goal || Math.random() < 0.05) this.waterGoal(e, 8, def.speed * 0.6);
    // a leap out of the water now and then
    const surface = liquidAt(this.world, e.pos.x, e.pos.y + e.h + 0.6, e.pos.z) !== "water";
    if (surface && !(e.leapT > 0) && Math.hypot(e.vel.x, e.vel.z) > 1.5 && Math.random() < 0.06) {
      const l = Math.hypot(e.vel.x, e.vel.z) || 1;
      e.vel.x = e.vel.x / l * 5; e.vel.z = e.vel.z / l * 5; e.vel.y = 7.5; e.leapT = 0.4;
      ctx.particles(e.pos.x, e.pos.y + 0.6, e.pos.z, "splash"); Sound.splash();
    }
  }

  // ----- Buzzers [bees]: gather pollen from flowers, make honey in their nest, help crops grow, and defend their home -----
  thinkBee(e, d, dmgMul, daylight) {
    const ctx = this.ctx, p = ctx.player(), w = this.world, def = e.def;
    const night = daylight < 0.35;
    // is home still there?
    if (e.home && ![B.BEE_NEST, B.BEEHIVE].includes(w.id(e.home[0], e.home[1], e.home[2])) && w.isLoaded(e.home[0], e.home[2])) e.home = null;
    if (e.inHive) {
      if ((!night && !e.angry) || !e.home) { e.inHive = false; this.leaveHive(e); }
      return;
    }
    if (Math.random() < 0.03) Sound.mob("buzz", d);
    if (e.angry > 0 && !e.stung && this.targetable()) {   // chase and sting once
      e.angry -= 0.15;
      e.goal = { x: p.pos.x, y: p.pos.y + 1.2, z: p.pos.z, speed: def.speed * 1.7 };
      if (d < def.reach + 0.4 && Math.abs(p.pos.y + 1 - e.pos.y) < 1.8 && e.attackCd <= 0) {
        ctx.hurtPlayer(def.dmg * dmgMul, "A Buzzer stung you! Leave their nests alone, or put a Torch nearby before taking honey.", e);
        if (dmgMul > 0.5) ctx.effect("poison", dmgMul > 1 ? 10 : 5);
        e.stung = true; e.angry = 0; e.attackCd = 1;   // a Buzzer can only sting once; then it calms down
      }
      return;
    }
    if (this.seekMate(e, d)) return;
    if (!e.home && Math.random() < 0.1) { const h = this.findBlock(e.pos, 14, [B.BEE_NEST, B.BEEHIVE], 6, 6, 30); if (h && this.list.filter(o => o.sp === "bee" && o.home && o.home.join() === h.join()).length < 3) e.home = h; }
    if (e.home && (night || e.pollen)) {   // fly home to make honey (and sleep at night)
      const [hx, hy, hz] = e.home, dd = Math.hypot(hx + 0.5 - e.pos.x, hz + 0.5 - e.pos.z);
      e.goal = { x: hx + 0.5, y: hy + 0.2, z: hz + 0.5, speed: def.speed };
      if (dd < 1.7 && Math.abs(hy - e.pos.y) < 6.5) {   // close enough to squeeze in (even down through the treetop)
        if (e.pollen) {
          e.pollen = false;
          const v = w.get(hx, hy, hz), honey = honeyOf(v);
          if (honey < HONEY_MAX && Math.random() < 0.5) w.set(hx, hy, hz, make(idOf(v), (metaOf(v) & 3) | ((honey + 1) << 2)));
        }
        if (night) { e.inHive = true; e.goal = null; e.vel.x = e.vel.y = e.vel.z = 0; }
      }
      return;
    }
    if (e.pollen && Math.random() < 0.08) this.pollinate(e);
    if (!e.pollen && !night) {   // find a flower and gather pollen
      if (e.flower && ![B.FLOWER_RED, B.FLOWER_YELLOW].includes(w.id(e.flower[0], e.flower[1], e.flower[2]))) e.flower = null;
      if (!e.flower && Math.random() < 0.15) { e.flower = this.findBlock(e.pos, 12, [B.FLOWER_RED, B.FLOWER_YELLOW], 6, 3); e.flowerT = 0; }
      if (e.flower && (e.flowerT += 0.15) > 15) e.flower = null;   // can't get to it: try another
      if (e.flower) {
        const [fx, fy, fz] = e.flower;
        e.goal = { x: fx + 0.5, y: fy + 0.6, z: fz + 0.5, speed: def.speed * 0.7 };
        if (Math.hypot(fx + 0.5 - e.pos.x, fy + 0.6 - e.pos.y, fz + 0.5 - e.pos.z) < 0.9) {
          e.goal = null; e.vel.x *= 0.5; e.vel.z *= 0.5;
          if ((e.pollenT = (e.pollenT || 0) + 0.15) > 5) { e.pollen = true; e.pollenT = 0; e.flower = null; }
        }
        return;
      }
    }
    this.wanderFly(e, 0.5, 3);
  }
  // with pollen on its legs, a Buzzer flying over crops helps them grow
  pollinate(e) {
    const w = this.world, x = Math.floor(e.pos.x), z = Math.floor(e.pos.z);
    for (let y = Math.floor(e.pos.y); y >= Math.floor(e.pos.y) - 3; y--) {
      const v = w.get(x, y, z), id = idOf(v);
      if ((id === B.WHEAT || id === B.CARROTS) && (metaOf(v) & 7) < 7) { w.set(x, y, z, make(id, (metaOf(v) & 7) + 1)); this.ctx.particles(x + 0.5, y + 0.6, z + 0.5, "xp"); return; }
      if (id === B.BERRY_BUSH && (metaOf(v) & 3) < 3) { w.set(x, y, z, make(id, (metaOf(v) & 3) + 1)); this.ctx.particles(x + 0.5, y + 0.6, z + 0.5, "xp"); return; }
      if (SOLID[id]) return;
    }
  }
  leaveHive(e) {   // come out through the opening, or any open side
    const w = this.world, [hx, hy, hz] = e.home || [Math.floor(e.pos.x), Math.floor(e.pos.y), Math.floor(e.pos.z)], f = metaOf(w.get(hx, hy, hz)) & 3;
    const sides = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (const [dx, dz, dy] of [[...sides[f], 0], ...sides.map(s => [...s, 0]), [0, 0, -1], [0, 0, 1], ...sides.map(s => [...s, -1])]) {
      if (!solidCell(w, hx + dx, hy + dy, hz + dz)) { e.pos.x = hx + dx + 0.5 + rand(-0.2, 0.2); e.pos.y = hy + dy + 0.1; e.pos.z = hz + dz + 0.5 + rand(-0.2, 0.2); return; }
    }
    e.pos.y = hy + 1.1;
  }
  // Taking honey (or breaking a nest) without a Torch nearby makes the Buzzers that live there angry
  angerBees(x, y, z) {
    const key = [x, y, z].join();
    for (const b of this.near(x + 0.5, y + 0.5, z + 0.5, 24, o => o.sp === "bee" && !o.stung && (o.home ? o.home.join() === key : Math.hypot(o.pos.x - x, o.pos.z - z) < 8))) { b.angry = 30; if (b.inHive) { b.inHive = false; this.leaveHive(b); } }
  }

  // ----- Pouncers [foxes]: sleep by day, hunt chickens and rabbits at night, pick up food, and are shy unless you sneak -----
  thinkFox(e, d, dmgMul, daylight) {
    const ctx = this.ctx, p = ctx.player(), def = e.def;
    if (Math.random() < 0.01) Sound.mob("yip", d);
    if (e.fleeT > 0) { e.sleeping = false; e.hunt = null; e.fleeT -= 0.15; const ax = e.pos.x - p.pos.x, az = e.pos.z - p.pos.z, l = Math.hypot(ax, az) || 1; e.goal = { x: e.pos.x + ax / l * 4, z: e.pos.z + az / l * 4, speed: def.speed * 1.8 }; return; }
    if (this.seekMate(e, d)) { e.sleeping = false; return; }
    const sneaking = p.crouch || ctx.creative(), wary = !e.trust && !sneaking && d < 5;
    // naps in the daytime (wakes up if you walk up without sneaking)
    if (daylight > 0.7 && !e.hunt) {
      if (!e.sleeping && Math.random() < 0.03) e.sleeping = true;
      if (e.sleeping) { e.goal = null; e.path = null; if (wary && d < 3.5) { e.sleeping = false; e.fleeT = 2; } return; }
    } else e.sleeping = false;
    if (wary) { e.fleeT = 1.5; return; }
    // picks up food lying on the ground and carries it in its mouth
    if (!e.held) {
      const it = ctx.nearDrop(e.pos, 7);
      if (it) {
        if (Math.hypot(it.x - e.pos.x, it.z - e.pos.z) < 1.1) { e.held = ctx.takeDrop(it); e.goal = null; Sound.mob("yip", d); }
        else e.goal = { x: it.x, z: it.z, speed: def.speed };
        return;
      }
    }
    if (e.held && e.hp < e.maxHp && (itemDef(e.held) || {}).kind === "food" && Math.random() < 0.02) { e.held = 0; e.hp = Math.min(e.maxHp, e.hp + 4); ctx.particles(e.pos.x, e.pos.y + 0.6, e.pos.z, "heart"); }
    // trusting Pouncers stand up for you
    if (e.trust) {
      const foe = this.list.find(o => o.def.hostile && !o.dead && !o.def.boss && o.def.ai !== "creeper" && Math.hypot(o.pos.x - p.pos.x, o.pos.z - p.pos.z) < 8 && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 14);
      if (foe) { this.pounceAt(e, foe, 3); return; }
    }
    // hunts at night
    if (daylight < 0.5 || e.hunt) {
      let prey = e.hunt;
      if (prey && (prey.dead || prey.gone || !this.list.includes(prey) || Math.hypot(prey.pos.x - e.pos.x, prey.pos.z - e.pos.z) > 18)) prey = null;
      if (!prey && Math.random() < 0.06) prey = this.list.filter(o => (o.sp === "chicken" || o.sp === "rabbit") && !o.dead && Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 12)
        .sort((a, b) => Math.hypot(a.pos.x - e.pos.x, a.pos.z - e.pos.z) - Math.hypot(b.pos.x - e.pos.x, b.pos.z - e.pos.z))[0] || null;
      e.hunt = prey;
      if (prey) { this.pounceAt(e, prey, 2); return; }
    }
    this.wander(e);
  }
  pounceAt(e, foe, dmg) {
    const dd = Math.hypot(foe.pos.x - e.pos.x, foe.pos.z - e.pos.z);
    this.moveTo(e, foe.pos, e.def.speed * 1.3, 0.8);
    e.yaw = Math.atan2(-(foe.pos.x - e.pos.x), -(foe.pos.z - e.pos.z));
    if (dd < 4 && dd > 1.6 && e.onGround && Math.random() < 0.25) { e.vel.x = (foe.pos.x - e.pos.x) / dd * 5; e.vel.z = (foe.pos.z - e.pos.z) / dd * 5; e.vel.y = 6.5; e.knock = 0.4; }   // the pounce
    if (dd < 1.1 + foe.w / 2 && Math.abs(foe.pos.y - e.pos.y) < 1.5 && e.attackCd <= 0) {
      e.attackCd = 1; this.damage(foe, dmg, e, { x: (foe.pos.x - e.pos.x) / (dd || 1) * 0.4, z: (foe.pos.z - e.pos.z) / (dd || 1) * 0.4 });
      Sound.mob("yip", this.dist(e));
    }
  }
  // Two well-fed animals of a kind look for each other and make a baby (babies bred by you trust you)
  seekMate(e, d) {
    if (!(e.love > 0) || e.baby) return false;
    const cross = { trotter: "packass", packass: "trotter" }[e.sp];
    const mate = this.list.find(o => o !== e && (o.sp === e.sp || o.sp === cross) && o.love > 0 &&
      !o.baby && !o.dead && !o.gone && !o.ridden && Math.abs(o.pos.y - e.pos.y) < 1.5 &&
      Math.hypot(o.pos.x - e.pos.x, o.pos.z - e.pos.z) < 8);
    if (!mate) return false;
    const ctx = this.ctx, def = e.def, md = Math.hypot(mate.pos.x - e.pos.x, mate.pos.z - e.pos.z);
    e.goal = def.flies || def.swims ? { x: mate.pos.x, y: mate.pos.y, z: mate.pos.z, speed: def.speed } : { x: mate.pos.x, z: mate.pos.z, speed: def.speed };
    if (md < 1.6) {
      let birth = { x: (e.pos.x + mate.pos.x) / 2, y: e.pos.y + 0.2, z: (e.pos.z + mate.pos.z) / 2 };
      if (e.sp === "frog") {
        const x = Math.floor(birth.x), y = Math.floor(birth.y), z = Math.floor(birth.z);
        let water;
        for (let dz = -3; dz <= 3 && !water; dz++) for (let dx = -3; dx <= 3 && !water; dx++) {
          if (this.world.id(x + dx, y - 1, z + dz) === B.WATER) water = { x: x + dx + 0.5, y: y - 0.7, z: z + dz + 0.5 };
        }
        if (!water) { e.love = mate.love = 0; return false; }
        birth = water;
      }
      e.love = mate.love = 0; e.breedCd = mate.breedCd = 300;
      this.add(e.sp === "frog" ? "tadpole" : e.sp === mate.sp ? e.sp : "mule", birth.x, birth.y, birth.z, { baby: e.sp !== "frog", trust: e.sp === "fox", home: e.home, persist: !!def.expansion });
      if (this.ctx.adv) this.ctx.adv("breed", e.sp);
      ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); ctx.xp(randi(1, 7), e.pos.x, e.pos.y + 0.5, e.pos.z);
      Sound.mob(def.sound, d);
    }
    return true;
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
    if (this.seekMate(e, d)) return;
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
    if (e.gone || e.dead || e.iframes > 0 || n <= 0) return false;
    if (e.sp === "sulfur_cube" && attacker === "player" && e.bestiary.absorbed && knock) {
      e.vel.x = knock.x * 11; e.vel.z = knock.z * 11; e.vel.y = 5;
      e.knock = 0.65; e.bestiary.bounceUntil = e.age + 0.65; e.iframes = 0.35;
      return true;
    }
    if (e.rolled) n *= 0.25;
    if (e.sp === "dune_scarab" && e.braced) n *= 0.5;
    if (e.npc) return false;   // campaign characters never get hurt
    if (e.tame && attacker === "player") return false;   // you can't hurt your own pets by accident
    if (attacker === "player" && !e.def.villager && !e.def.object) this.petFoe = e;   // your Scouts join in
    if (e.summonT > 0) return false;   // can't be hurt while it's being summoned
    if (e.sp === "dragon") { n *= e.perched ? 1 : 0.6; knock = null; if (attacker === "explosion") n *= 0.3; }
    if (e.def.shielded && attacker === "player") { const p = this.ctx.player(), f = Math.cos(e.yaw) * (e.pos.z - p.pos.z) + Math.sin(e.yaw) * (e.pos.x - p.pos.x); if (f > 0) { n *= 0.3; this.ctx.particles(e.pos.x, e.pos.y + 1.2, e.pos.z, "pale"); } }   // an Echo Knight's shield blocks hits from the front
    if (e.def.burrows && !e.emerged) return false;
    if (e.def.segmentedLeviathan) knock = null;
    if (e.def.hears && attacker === "player") { e.alertT = Math.max(e.alertT || 0, 10); e.dormant = false; }
    if (e.def.lostBoss && this.bossAI) { n = this.bossAI.hit(this, e, n, attacker); knock = null; if (!n) return false; }
    if (e.sp === "herobrine") { n = this.ctx.heroHit ? this.ctx.heroHit(e, n) : 0; knock = null; if (!n) { e.iframes = 0.3; this.ctx.particles(e.pos.x, e.pos.y + 1.2, e.pos.z, "pale"); return false; } }
    // Cindermaw: half damage in the air, full when landed, 1.5× when worn out; the pylons' shield blocks most of it
    if (e.sp === "cindermaw") { n *= e.perched ? (e.tired ? 1.5 : 1) : 0.5; if (e.shielded) n *= 0.2; if (attacker === "explosion") n *= 0.3; knock = null; if (e.shielded) this.ctx.particles(e.pos.x, e.pos.y + 2, e.pos.z, "ember"); }
    if (e.sp === "blightking") { knock = null; if (attacker === "explosion") n *= 0.2; }
    if (attacker === "player" && e.def.villager) for (const g of this.near(e.pos.x, e.pos.y, e.pos.z, 24, o => o.sp === "golem")) g.angry = 30;   // hurting villagers angers the Ironwarden
    if (e.def.villager) e.fleeT = 4;
    if (attacker === "player" && e.sp === "golem") e.angry = 30;
    if (e.sp === "sheller" && e.open < 1) n *= 0.25;   // the shell protects it when closed
    if (e.def.static || e.def.object) knock = null;
    if (e.sp === "voidwalker" && attacker && attacker.projectile) { this.teleport(e); return false; }   // dodges arrows
    e.hp -= n; e.hurtT = 0.3; e.iframes = 0.5;
    if (e.sp === "ancient_companion") this.ctx.companionChanged(e);
    if (e.def.segmentedLeviathan) this.ctx.leviathanDamaged(e);
    if (knock) { e.vel.x = knock.x * 7; e.vel.z = knock.z * 7; e.vel.y = 4.5; e.knock = 0.25; }
    if (attacker === "player") {
      e.angry = 40; if (e.def.animal || (e.def.swims && e.def.ai !== "dolphin")) e.fleeT = 5;
      // Rotboars, Boarkin, Scout packs, Splasher pods, and Buzzers defend each other
      if (e.def.ai === "rotboar" || e.def.ai === "boarkin" || ["brute", "scout", "dolphin", "bee"].includes(e.sp)) for (const o of this.near(e.pos.x, e.pos.y, e.pos.z, 20, o => o.sp === e.sp && !o.tame && !o.stung)) { o.angry = 40; o.inHive = false; }
    }
    if (e.sp === "squid") { this.ctx.particles(e.pos.x, e.pos.y + 0.6, e.pos.z, "ink"); this.ctx.particles(e.pos.x, e.pos.y + 0.9, e.pos.z, "ink"); e.fleeT = 5; }   // a cloud of ink to hide in
    if (e.sp === "glow_squid") this.ctx.particles(e.pos.x, e.pos.y + 0.6, e.pos.z, "crystal");
    if (e.def.object) Sound.place("wood");
    else Sound.mob(e.def.animal ? e.def.sound : "hurt", this.dist(e));
    if (e.sp === "voidwalker" && attacker === "player" && Math.random() < 0.3) this.teleport(e, this.ctx.player().pos);
    if (e.hp <= 0) this.kill(e, attacker);
    return true;
  }
  kill(e, attacker) {
    e.dead = e.def.boss ? 4 : 0.6; e.goal = null; e.path = null;
    const ctx = this.ctx;
    if (e.encounterOwner) return;
    if (attacker === "player" && ctx.adv) ctx.adv("kill", e.sp);
    if (e.sp === "crystal") { e.gone = true; ctx.crystalGone(e.cid); ctx.explode(e.pos.x, e.pos.y + 1, e.pos.z, 3, null); return; }
    if (e.sp === "pylon") { e.gone = true; ctx.pylonGone(e.cid); for (let k = 0; k < 3; k++) ctx.particles(e.pos.x, e.pos.y + 1 + k * 0.4, e.pos.z, "fire"); Sound.mob("crystal", 0); return; }
    if (e.def.boss) { Sound.mob("roar", 0); return; }
    if (attacker === "player" || e.burning || attacker === "explosion" || (attacker && (attacker.tame || attacker.sp === "fox"))) {
      for (const d of e.def.drops(e)) if (d && d[1] > 0) ctx.drop(d[0], d[1], e.pos.x, e.pos.y + 0.4, e.pos.z);
      if (!e.baby && e.def.xp) ctx.xp(e.def.xp * (e.def.ai === "slime" ? e.size : 1), e.pos.x, e.pos.y + 0.4, e.pos.z);
    } else if (e.held && e.sp !== "allay") ctx.drop(e.held, 1, e.pos.x, e.pos.y + 0.4, e.pos.z);
    if (e.sp === "allay" && e.held) ctx.drop(e.held, 1 + (e.bestiary.carry || 0), e.pos.x, e.pos.y + 0.4, e.pos.z);
    if (e.sp === "sulfur_cube" && e.bestiary.absorbed) ctx.drop(e.bestiary.absorbed, 1, e.pos.x, e.pos.y + 0.4, e.pos.z);
    if (e.inv) for (const q of e.inv.slots) if (q) ctx.drop(q.id, q.n, e.pos.x, e.pos.y + 0.4, e.pos.z, q);   // what was inside spills out
    if (e.sp === "tnt_cart" && (attacker === "explosion" || e.fuseT > 0)) { e.gone = true; ctx.explode(e.pos.x, e.pos.y + 0.5, e.pos.z, 4, null); return; }
    if (e.riderE) { e.riderE.inCart = null; e.riderE = null; }
    if (e.def.object) { e.gone = true; ctx.particles(e.pos.x, e.pos.y + 0.3, e.pos.z, "poof"); return; }   // boats just break apart
    if (e.def.ai === "slime" && e.size > 1) {   // big gloops split
      const n = randi(2, 4);
      for (let i = 0; i < n; i++) this.add(e.sp, e.pos.x + rand(-0.5, 0.5), e.pos.y + 0.3, e.pos.z + rand(-0.5, 0.5), { size: e.size / 2 });
    }
  }
  dying(e, dt) {
    if (e.def.boss) {   // the wyrm rises, shudders, and bursts into light
      e.dead -= dt; e.pos.y += dt * (e.sp === "cindermaw" ? 0.6 : 2); e.root.rotation.z = Math.sin(e.dead * 20) * 0.08;
      if (e.sp === "cindermaw") { const k = 1 + Math.sin(e.dead * 25) * 0.4; e.mat.color.setRGB(1.3 * k, 0.8 * k, 0.5 * k); if (e.parts.wingL) { e.parts.wingL.rotation.z = -0.6 + e.dead * 0.1; e.parts.wingR.rotation.z = 0.6 - e.dead * 0.1; } }
      else e.mat.color.setRGB(1, 0.7 + Math.sin(e.dead * 30) * 0.3, 1);
      if (Math.random() < 0.6) this.ctx.particles(e.pos.x + rand(-4, 4), e.pos.y + rand(0, 3), e.pos.z + rand(-4, 4), e.def.deathPuff || "void");
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
    if (interactCreature(this, e, slot)) return true;
    if (def.cart) return ctx.useCart(e, slot);
    if (e.inv && (def.boat || (def.mount && e.tame && !e.baby)) && ctx.crouching()) return ctx.openCart(e);   // crouch + right-click opens a chest boat
    if (def.boat) return ctx.mount(e);
    if (e.sp === "dolphin" && (id === I.RAW_MINNOW || id === I.COOKED_MINNOW)) {
      ctx.consume(); e.angry = 0;
      for (let k = 0; k < 3; k++) ctx.particles(e.pos.x + rand(-0.4, 0.4), e.pos.y + e.h + rand(0, 0.4), e.pos.z + rand(-0.4, 0.4), "heart");
      ctx.effect("dolphin", 30); Sound.mob("click", 2);
      ctx.toast("The Splasher loved that fish! You can swim extra fast for a while.", "good");
      return true;
    }
    if (def.tameWith) {   // pets and Trotters
      const hearts = () => { for (let k = 0; k < 3; k++) ctx.particles(e.pos.x + rand(-0.4, 0.4), e.pos.y + e.h + rand(0, 0.4), e.pos.z + rand(-0.4, 0.4), "heart"); };
      if (!e.tame && def.tameWith.includes(id)) {
        ctx.consume();
        if (def.mount) {   // treats calm a wild Trotter, so riding tames it sooner
          e.temper = Math.min(100, (e.temper || 0) + 15); e.hp = Math.min(e.maxHp, e.hp + 2); hearts(); Sound.mob(def.sound, 2);
          ctx.toast(`The ${def.name} liked that! It's calmer now, so it will be easier to tame by riding it.`);
          return true;
        }
        if (Math.random() < def.tameChance) {
          e.tame = true; e.angry = 0; e.fleeT = 0; e.sitting = false; e.hp = e.maxHp; e.goal = null; hearts(); Sound.mob(def.sound, 2);
          if (ctx.adv) ctx.adv("tame", e.sp);
          ctx.toast(`You tamed a ${def.name}! It will follow you. Right-click it to make it sit or follow.`, "good");
        } else ctx.particles(e.pos.x, e.pos.y + e.h, e.pos.z, "poof");
        return true;
      }
      if (e.tame && (def.healWith || def.tameWith).includes(id) && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + 4); ctx.consume(); hearts();
        if (e.sp === "ancient_companion") ctx.companionChanged(e);
        return true;
      }
      if (def.mount) {
        if (id === I.SADDLE && e.tame && !e.saddled && !e.baby) { e.saddled = true; ctx.consume(); Sound.mob(def.sound, 2); ctx.toast("Saddled! Right-click it to ride. Press C to get off.", "good"); return true; }
        if (!e.baby && !def.food.includes(id)) return ctx.mount(e);
      } else if (e.tame && !e.baby) {
        e.sitting = !e.sitting; e.goal = null; e.path = null;
        if (e.sp === "ancient_companion") ctx.companionChanged(e);
        ctx.toast(e.sitting ? `Your ${def.name} is sitting. It will stay here.` : `Your ${def.name} is following you.`);
        return true;
      }
    }
    if ((def.animal || def.breeds || def.swims && def.expansion) && def.food.includes(id)) {
      if (e.baby) { e.growT -= 60; ctx.consume(); ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); return true; }
      if (e.breedCd <= 0 && e.love <= 0) { e.love = 30; ctx.consume(); ctx.particles(e.pos.x, e.pos.y + 1, e.pos.z, "heart"); Sound.mob(def.sound, 2); return true; }
      return false;
    }
    if (e.sp === "sheep" && id === I.SHEARS && !e.sheared && !e.baby) { e.sheared = true; ctx.drop(B.WOOL, randi(1, 3), e.pos.x, e.pos.y + 1, e.pos.z); ctx.wear(); Sound.mob("baa", 2); return true; }
    if (e.sp === "cow" && id === I.BUCKET && !e.baby) { ctx.swapHeld(I.MILK_BUCKET); Sound.mob("moo", 2); return true; }
    if (e.sp === "boarkin" && id === I.GOLD_INGOT && !(e.angry > 0) && e.barterT <= 0) { ctx.consume(); e.barterT = 4; e.goal = null; Sound.mob("snort", 2); return true; }
    if (e.def.villager && !e.baby && e.npc && ctx.talk && ctx.talk(e)) { e.trading = 30; Sound.mob("hmm", 2); return true; }
    if (e.def.villager && !e.baby) { e.trading = 30; ctx.openTrade(e); Sound.mob("hmm", 2); return true; }
    return false;
  }

  // ----- projectiles (arrows, thrown pearls and eggs) -----
  shootArrow(from, target, dmgMul) {
    const sx = from.pos.x, sy = from.eyeY - 0.1, sz = from.pos.z;
    const tx = target.pos.x, ty = target.pos.y + 1.1, tz = target.pos.z;
    const dx = tx - sx, dz = tz - sz, horiz = Math.hypot(dx, dz) || 0.01, speed = 20, t = Math.max(0.1, horiz / speed);
    const vy = (ty - sy) / t + 0.5 * 20 * t;   // aim a little high to make up for gravity
    const err = { easy: 0.12, normal: 0.07, hard: 0.04 }[this.ctx.settings().difficulty] || 0.08;
    this.addProjectile("arrow", sx, sy, sz, dx / horiz * speed + rand(-1, 1) * err * speed, vy + rand(-1, 1) * err * speed, dz / horiz * speed + rand(-1, 1) * err * speed, { owner: from, dmg: 3 * dmgMul });
    Sound.mob("bow", this.dist(from));
  }
  addProjectile(kind, x, y, z, vx, vy, vz, opts = {}) {
    let mesh;
    if (kind === "obsidianshard") {
      mesh = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), new THREE.MeshBasicMaterial({ color: 0x634555 }));
      shell.scale.set(0.7, 1.8, 0.7); shell.rotation.z = 0.3;
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), new THREE.MeshBasicMaterial({ color: 0xffb764 }));
      core.position.x = 0.1;
      mesh.add(shell, core);
    } else if (kind === "arrow") {
      mesh = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), new THREE.MeshBasicMaterial({ color: 0x8a6235 }));
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.08), new THREE.MeshBasicMaterial({ color: 0x9a9a9a })); tip.position.z = -0.27;
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff })); fl.position.z = 0.22;
      mesh.add(shaft, tip, fl);
    } else {
      const color = { sandbolt: 0xc8b5ec, pearl: 0x1a8a7a, egg: 0xf0e8d0, snowball: 0xffffff, witchbrew: 0x93bd65, windburst: 0xbacafb, fireball: 0xff7a1a, bigfire: 0xffb030, breath: 0xb050ff, bullet: 0xf0e8b0, eye: 0x3ad0a0, skull: 0x2a2a2a, bobber: 0xd8302a }[kind] || 0xffffff;
      const s = kind === "bigfire" || kind === "breath" ? 0.6 : kind === "fireball" || kind === "bullet" || kind === "skull" ? 0.35 : kind === "bobber" ? 0.14 : 0.2;
      mesh = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshBasicMaterial({ color, fog: false }));
    }
    mesh.position.set(x, y, z); this.scene.add(mesh);
    this.projectiles.push({ kind, x, y, z, vx, vy, vz, age: 0, stuck: false, mesh, ...opts });
  }
  updateProjectiles(dt) {
    const w = this.world, ctx = this.ctx, p = ctx.player();
    for (const pr of this.projectiles) {
      pr.age += dt;
      if (["sandbolt", "obsidianshard"].includes(pr.kind) && pr.age > 5) { pr.gone = true; continue; }
      if (pr.kind === "bobber") { this.updateBobber(pr, dt); continue; }
      if (pr.stuck) { if (pr.age > 30) pr.gone = true; if (pr.fromPlayer && !ctx.creative() && Math.hypot(pr.x - p.pos.x, pr.y - p.pos.y - 0.8, pr.z - p.pos.z) < 1.4 && pr.age > 0.5) { if (ctx.give(I.ARROW, 1)) pr.gone = true; } continue; }
      if (pr.kind === "eye") { this.flyEye(pr, dt); continue; }
      if (pr.homing) {   // Sheller bullets slowly steer toward you
        const t = pr.homing, dx = t.pos.x - pr.x, dy = t.pos.y + 1 - pr.y, dz = t.pos.z - pr.z, l = Math.hypot(dx, dy, dz) || 1;
        pr.vx += (dx / l * 6 - pr.vx) * 0.04; pr.vy += (dy / l * 6 - pr.vy) * 0.04; pr.vz += (dz / l * 6 - pr.vz) * 0.04;
        if (pr.age > 10) pr.gone = true;
      }
      if (pr.kind === "breath" && Math.random() < 0.5) ctx.particles(pr.x, pr.y, pr.z, "void");
      if (!pr.noGrav) pr.vy -= 20 * dt;
      if (pr.kind === "obsidianshard") { pr.mesh.rotation.x += dt * 3; pr.mesh.rotation.z += dt * 5; }
      if (pr.kind === "fireball" || pr.kind === "bigfire") { pr.mesh.rotation.x += dt * 5; pr.mesh.rotation.y += dt * 7; if (Math.random() < 0.3) ctx.particles(pr.x, pr.y, pr.z, "ember"); }
      const steps = Math.ceil(Math.hypot(pr.vx, pr.vy, pr.vz) * dt / 0.25);
      for (let s = 0; s < steps && !pr.gone && !pr.stuck; s++) {
        const nx = pr.x + pr.vx * dt / steps, ny = pr.y + pr.vy * dt / steps, nz = pr.z + pr.vz * dt / steps;
        // Resolve the nearest swept contact, rather than favoring list order or
        // a creature behind cover within the same quarter-block substep.
        let hitE = null, entityTime = Infinity;
        if (pr.kind !== "pearl" && (pr.fromPlayer || pr.kind === "bigfire" || pr.kind === "arrow")) for (const e of this.list) {
          if (e.dead || e.gone || e === pr.owner || e.def.segmentedLeviathan && (!e.emerged || e.ridden)) continue;
          if (pr.kind === "arrow" && !pr.fromPlayer && pr.owner?.def.hostile && e.def.hostile && !e.armored) continue;
          const r = e.w / 2 + 0.1;
          const t = usesLeviathanHitVolumes(e) ? leviathanSegmentTime(e, pr.x, pr.y, pr.z, nx, ny, nz) :
            segmentBoxTime(pr.x, pr.y, pr.z, nx, ny, nz,
              e.pos.x - r, e.pos.y, e.pos.z - r, e.pos.x + r, e.pos.y + e.h, e.pos.z + r);
          if (t !== null && t < entityTime) { entityTime = t; hitE = e; }
        }
        const playerTime = pr.fromPlayer ? null : segmentBoxTime(pr.x, pr.y, pr.z, nx, ny, nz,
          p.pos.x - 0.35, p.pos.y, p.pos.z - 0.35, p.pos.x + 0.35, p.pos.y + 1.8, p.pos.z + 0.35);
        if (playerTime !== null && playerTime < entityTime) hitE = null;
        this.projectileContact ||= {};
        const blockHit = projectileBlockHit(w, pr.x, pr.y, pr.z, nx, ny, nz, this.projectileContact);
        if (blockHit && blockHit.t <= Math.min(entityTime, playerTime ?? Infinity)) {
          pr.x = blockHit.hx; pr.y = blockHit.hy; pr.z = blockHit.hz;
          if (ctx.hitBlock) ctx.hitBlock(pr, blockHit.x, blockHit.y, blockHit.z, pr.x, pr.y, pr.z);
          if (pr.kind === "arrow") { pr.stuck = true; pr.age = 0; Sound.mob("arrowhit", Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z)); }
          else if (pr.kind === "bigfire") { ctx.explode(pr.x, pr.y, pr.z, pr.power || 1.3, pr.owner); pr.gone = true; }
          else if (pr.kind === "fireball") { ctx.ignite(blockHit.x, blockHit.y, blockHit.z); pr.gone = true; }
          else if (pr.kind === "breath") { ctx.cloud(pr.x, pr.y + 0.5, pr.z); pr.gone = true; }
          else if (["bullet", "windburst", "witchbrew", "sandbolt", "obsidianshard"].includes(pr.kind)) { ctx.particles(pr.x, pr.y, pr.z, "poof"); pr.gone = true; }
          else if (pr.kind === "skull") { ctx.explode(pr.x, pr.y, pr.z, 1, pr.owner); pr.gone = true; }
          else this.landThrown(pr);
          break;
        }
        if (hitE && hitE.armored && pr.kind === "arrow") { pr.gone = true; ctx.particles(nx, ny, nz, "poof"); Sound.mob("clank", this.dist(hitE)); break; }   // arrows bounce off the Blightking's armor
        if (hitE && pr.kind === "skull" && hitE !== pr.owner) { this.damage(hitE, pr.dmg || 6, null); ctx.explode(nx, ny, nz, 1, pr.owner); pr.gone = true; break; }
        if (hitE && pr.kind !== "pearl" && pr.kind !== "skull" && (pr.fromPlayer || pr.kind !== "arrow" || !pr.owner || !pr.owner.def.hostile || !hitE.def.hostile)) {
          if (pr.kind === "arrow") { const l = Math.hypot(pr.vx, pr.vz) || 1; this.damage(hitE, pr.dmg, pr.fromPlayer ? "player" : { projectile: true }, { x: pr.vx / l * 0.5, z: pr.vz / l * 0.5 }); if (pr.fromPlayer && hitE.sp !== "voidwalker") { hitE.angry = 40; } }
          if (pr.kind === "bigfire") { if (pr.fromPlayer && hitE.sp === "wailer") this.damage(hitE, 1000, "player"); ctx.explode(nx, ny, nz, pr.power || 1.3, pr.owner); }
          if (pr.kind === "fireball" && !hitE.def.fireproof) { this.damage(hitE, 5, pr.fromPlayer ? "player" : null); hitE.burning = 4; }
          pr.gone = true; Sound.mob("arrowhit", this.dist(hitE)); break;
        }
        // hit the player?
        if (playerTime !== null) {
          if (pr.kind === "arrow") {
            const source = pr.owner?.def.name || "Rattler";
            ctx.hurtPlayer(pr.dmg, `A ${source}'s arrow hit you!`, { pos: { x: pr.x - pr.vx, z: pr.z - pr.vz } });
            if (pr.owner?.sp === "bogged") ctx.effect("poison", 5);
            if (pr.owner?.sp === "stray" || pr.owner?.sp === "parched") ctx.effect("queasy", 6);
          }
          if (pr.kind === "sandbolt") ctx.hurtPlayer(pr.dmg, "A Sand Wraith's rune bolt hit you.", pr.owner, "sand");
          if (pr.kind === "obsidianshard") ctx.hurtPlayer(pr.dmg, "The Obsidian Leviathan's shrapnel struck you.", pr.owner);
          if (pr.kind === "witchbrew") { ctx.hurtPlayer(pr.dmg, "A Witch's brew hit you!", pr.owner); ctx.effect("poison", 6); }
          if (pr.kind === "windburst") {
            ctx.hurtPlayer(pr.dmg, "A Breeze's wind burst hit you!", pr.owner);
            p.vel.x += pr.vx * 0.45; p.vel.z += pr.vz * 0.45; p.vel.y = Math.max(p.vel.y, 4);
          }
          if (pr.kind === "fireball") { ctx.hurtPlayer(pr.dmg || 5, "A Flare's fireball got you!", { pos: { x: pr.x - pr.vx, z: pr.z - pr.vz } }); ctx.effect("fire", 4); }
          if (pr.kind === "bigfire") ctx.explode(nx, ny, nz, pr.power || 1.3, pr.owner);
          if (pr.kind === "breath") ctx.cloud(nx, ny, nz);
          if (pr.kind === "bullet") { ctx.hurtPlayer(pr.dmg || 4, "A Sheller's bullet got you!", null); ctx.effect("levitation", 6); }
          if (pr.kind === "skull") { ctx.hurtPlayer(pr.dmg || 6, "A Blightking skull hit you!", { pos: { x: pr.x - pr.vx, z: pr.z - pr.vz } }); ctx.effect("blight", 8); ctx.explode(nx, ny, nz, 1, pr.owner); }
          pr.gone = true; break;
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

  // A fishing bobber: flies, lands on the water, bobs, and now and then a fish bites (it dips under for about a second)
  updateBobber(pr, dt) {
    const w = this.world, ctx = this.ctx, p = ctx.player();
    if (Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z) > 32 || !ctx.holds(I.FISHING_ROD)) { pr.gone = true; return; }   // the line snaps
    if (!pr.surf && !pr.stuck && w.id(Math.floor(pr.x), Math.floor(pr.y), Math.floor(pr.z)) === B.WATER) {
      let t = Math.floor(pr.y); while (w.id(Math.floor(pr.x), t + 1, Math.floor(pr.z)) === B.WATER) t++;
      pr.surf = t + 0.92; pr.waitT = rand(4, 13); pr.vx *= 0.3; pr.vz *= 0.3;
      ctx.particles(pr.x, pr.surf, pr.z, "splash"); Sound.splash();
    }
    if (pr.surf) {
      pr.vx *= 0.92; pr.vz *= 0.92;
      const nx = pr.x + pr.vx * dt, nz = pr.z + pr.vz * dt;
      if (w.id(Math.floor(nx), Math.floor(pr.surf - 0.5), Math.floor(nz)) === B.WATER) { pr.x = nx; pr.z = nz; }
      if (pr.biteT > 0) {   // a fish is on the hook!
        pr.biteT -= dt; pr.y = pr.surf - 0.28;
        if (pr.biteT <= 0) pr.waitT = rand(4, 13);   // too slow: it got away
      } else {
        pr.waitT -= dt; pr.y = pr.surf + Math.sin(pr.age * 3) * 0.03;
        if (pr.waitT < 2 && Math.random() < 0.25) { const a = Math.random() * Math.PI * 2, r = pr.waitT * 1.5; ctx.particles(pr.x + Math.cos(a) * r, pr.surf - 0.2, pr.z + Math.sin(a) * r, "splash"); }   // something is swimming closer
        if (pr.waitT <= 0) { pr.biteT = 1.1; ctx.particles(pr.x, pr.surf, pr.z, "splash"); Sound.splash(); }
      }
    } else if (!pr.stuck) {
      pr.vy -= 20 * dt;
      const nx = pr.x + pr.vx * dt, ny = pr.y + pr.vy * dt, nz = pr.z + pr.vz * dt;
      if (SOLID[w.id(Math.floor(nx), Math.floor(ny), Math.floor(nz))]) { pr.stuck = true; pr.vx = pr.vy = pr.vz = 0; }
      else { pr.x = nx; pr.y = ny; pr.z = nz; }
    }
    if (pr.age > 120) pr.gone = true;
    pr.mesh.position.set(pr.x, pr.y, pr.z);
  }
  // The Eye of the Void flies toward the nearest stronghold, hovers, then drops (or shatters)
  flyEye(pr, dt) {
    const ctx = this.ctx;
    if (pr.age < 1.6) {
      const dx = pr.tx - pr.x, dz = pr.tz - pr.z, l = Math.hypot(dx, dz) || 1, down = l < 12;
      pr.x += dx / l * 7 * dt * (down ? 0.3 : 1); pr.z += dz / l * 7 * dt * (down ? 0.3 : 1); pr.y += (down ? -2.5 : 1.8) * dt;
    } else if (pr.age > 2.4) {
      pr.gone = true;
      if (Math.random() < 0.8) ctx.drop(pr.item || I.EYE, 1, pr.x, pr.y, pr.z); else { ctx.particles(pr.x, pr.y, pr.z, pr.item ? "ember" : "void"); Sound.mob("crystal", 0); }
    }
    if (Math.random() < 0.6) ctx.particles(pr.x, pr.y, pr.z, pr.item ? "ember" : "portal");
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
      const sp = Math.min(MAX_DEFLECT_SPEED, Math.hypot(pr.vx, pr.vy, pr.vz) * 1.3);
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
      if (e.gone || e.dead || e.ridden || (e.def.segmentedLeviathan && !e.emerged)) continue;
      if (usesLeviathanHitVolumes(e)) {
        const t = leviathanSegmentTime(e, o.x, o.y, o.z, o.x + d.x * max, o.y + d.y * max, o.z + d.z * max);
        if (t !== null && (!best || t * max < best.dist)) best = { ent: e, dist: t * max };
        continue;
      }
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
  near(x, y, z, r, filter) { return this.list.filter(e => !e.gone && !e.dead && Math.hypot(e.pos.x - x, e.pos.y - y, e.pos.z - z) < r && (!filter || filter(e))); }

  // ----- animation -----
  animate(e, dt, d2, daylight) {
    const def = e.def, P = e.parts, sp = Math.hypot(e.vel.x, e.vel.z), swing = Math.sin(e.walkPhase * 2.2) * Math.min(1, sp / 2) * 0.9;
    e.mesh.position.set(e.pos.x, e.pos.y - (def.segmentedLeviathan ? e.burrowDepth || 0 : 0), e.pos.z);
    e.mesh.rotation.y = e.yaw + Math.PI;
    const s = e.scale * (e.perched ? 0.35 : 1); e.root.scale.setScalar(s);
    if (def.segmentedLeviathan) {
      const spacing = def.segmentSpacing || 4, targetResting = Math.max(0, 1 - sp / 1.5);
      e.dunePose ||= new DunePose(e.pos.x, e.pos.y, e.pos.z, e.yaw, targetResting);
      const pose = e.dunePose;
      const jumped = pose.update(e.pos.x, e.pos.y, e.pos.z, e.yaw, targetResting, dt, Math.max(12, spacing * 2));
      e.mesh.rotation.y = pose.yaw + Math.PI;
      e.trail ||= new DuneTrail(e.pos.x, e.pos.y, e.pos.z, pose.yaw, spacing, true);
      if (jumped) e.trail.reset(e.pos.x, e.pos.y, e.pos.z, pose.yaw);
      e.trail.follow(e.pos.x, e.pos.y, e.pos.z, pose.yaw);
      const cycle = e.mountedCue || e.duneCycle;
      const reducedMotion = !!this.ctx?.reducedMotion?.();
      e.leviathanCues ||= new LeviathanCues();
      const cue = e.leviathanCues.sample(cycle, e.age, e.emerged, reducedMotion);
      e.duneAttackMotion ||= new DuneAttackMotion();
      const motion = e.duneAttackMotion.sample(e.sp === "leviathan_dune" && !e.tame && !e.dead && !e.gone && !e.mountedCue ? cycle : null, e.age, reducedMotion);
      const spread = cue.spread;
      const blend = 1 - Math.exp(-8 * dt);
      P.jawLeft.rotation.y += (-spread - P.jawLeft.rotation.y) * blend;
      P.jawRight.rotation.y += (spread - P.jawRight.rotation.y) * blend;
      P.head.rotation.x += (cue.pitch + motion.pitch - P.head.rotation.x) * blend;
      P.head.rotation.z += (motion.roll - P.head.rotation.z) * blend;
      for (let i = 0; i < 12; i++) {
        const rim = P["mawRim" + i], base = rim.userData.mawRest;
        const flare = 1 + spread * 0.15;
        rim.position.x += (base.x * flare - rim.position.x) * blend;
        rim.position.y += (base.y * flare - rim.position.y) * blend;
        for (let row = 0; row < 2; row++) {
          const tooth = P["mawTooth" + row + "_" + i];
          tooth.visible = row === 0 || d2 < 32 * 32;
          tooth.rotation.x += (cue.tooth - tooth.rotation.x) * blend;
        }
      }
      const yaw = pose.yaw + Math.PI, sin = Math.sin(yaw), cos = Math.cos(yaw);
      const backX = Math.sin(pose.yaw), backZ = Math.cos(pose.yaw);
      // Keep neighboring shells overlapping, including the larger Ancient model.
      const linkLimit = Math.min(spacing, def.model.parts.find(p => p.name === "segment0").size[2] / 16 * s * 0.92);
      const resting = pose.resting;
      let previousX = e.pos.x, previousY = e.pos.y, previousZ = e.pos.z;
      for (let i = 0; i < DUNE_SEGMENTS; i++) {
        const p = e.trail.segment(i), dx = p.x - e.pos.x, dz = p.z - e.pos.z;
        const movingBack = Math.max((i + 1) * spacing, dx * backX + dz * backZ);
        const back = movingBack * (1 - resting) + (1 + i * 0.8) * spacing * resting;
        const wave = reducedMotion ? 0 : Math.sin(e.age * 1.2 - i * 0.55) * Math.min(1.2, i * 0.15);
        const progress = (i + 1) / DUNE_SEGMENTS;
        const restingSide = Math.sin(progress * Math.PI) * Math.min(12, spacing * 2);
        const attackEnvelope = Math.sin(progress * Math.PI) * progress;
        const side = (dx * backZ - dz * backX) * (1 - resting) + restingSide * resting + wave + motion.tail * attackEnvelope;
        let x = back * backX + side * backZ, z = back * backZ - side * backX;
        const restingY = e.pos.y + Math.sin(progress * Math.PI) * 5 - 7 * progress ** 1.15;
        const part = P["segment" + i];
        let py = Math.min(e.pos.y + 2, p.y * (1 - resting) + restingY * resting + motion.lift * Math.sin(progress * Math.PI));
        const point = pose.segment(i, e.pos.x + x, py, e.pos.z + z, previousX, previousY, previousZ, linkLimit, dt);
        x = point.x - e.pos.x; z = point.z - e.pos.z; py = point.y;
        part.visible = d2 < 48 * 48 || i < 5;
        part.position.set((cos * x - sin * z) / s, (py - e.pos.y) / s, (sin * x + cos * z) / s);
        const px = e.pos.x + x, pz = e.pos.z + z;
        part.rotation.y = Math.atan2(previousX - px, previousZ - pz) - yaw;
        part.rotation.x = -Math.atan2(previousY - py, Math.hypot(previousX - px, previousZ - pz));
        previousX = px; previousY = py; previousZ = pz;
        P["ridge" + i].visible = d2 < 36 * 36;
        for (const side of [-1, 1]) P["flank" + side + "_" + i].visible = d2 < 36 * 36;
      }
      e.glow?.update(e.age, d2, cue.charge, e.sp === "leviathan_obsidian" && cue.recovering, reducedMotion);
      e.mat.color.setRGB(1, e.hurtT > 0 ? 0.55 : 0.92, e.hurtT > 0 ? 0.4 : 0.86);
      if (e.sp === "leviathan_obsidian" && cycle?.step === "recover" && !e.hurtT) {
        e.mat.color.setRGB(0.65, 0.72, 0.8);
      }
      updateLeviathanHitVolumes(e);
      return;
    }
    animateCreature(e);
    if (e.sp === "aquatic_guardian" || e.sp === "elder_guardian") {
      const charge = e.bestiary.charge || 0;
      if (charge && !e.beam) {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const material = new THREE.LineBasicMaterial({ color: 0x8fe5cd, transparent: true });
        e.beam = new THREE.Line(geometry, material);
        e.beam.frustumCulled = false;
        this.scene.add(e.beam);
      }
      if (e.beam) {
        e.beam.visible = !!charge && !e.dead;
        if (e.beam.visible) {
          const p = this.ctx.player(), line = e.beam.geometry.attributes.position;
          line.setXYZ(0, e.pos.x, e.eyeY, e.pos.z);
          line.setXYZ(1, p.pos.x, p.pos.y + p.eye * 0.7, p.pos.z);
          line.needsUpdate = true;
          e.beam.material.opacity = 0.35 + Math.min(0.65, charge / 3);
        }
      }
    }
    if (e.baby && P.head) P.head.scale.setScalar(1.45);
    else if (P.head) P.head.scale.setScalar(1);
    // head follows the player when close
    if (P.head && d2 < 100 && !e.dead && !e.ridden && !e.perched) {
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
      if (e.sp === "herobrine") {
        if (e.still) { P.legR.rotation.x = P.legL.rotation.x = P.armR.rotation.x = P.armL.rotation.x = 0; }   // unnaturally still while he watches
        if (e.raise > 0) { P.armR.rotation.x = -Math.PI / 2 - e.raise * 0.6; P.armL.rotation.x = -Math.PI / 2 - e.raise * 0.6; }
        if (e.point) { P.armR.rotation.x = -Math.PI / 2; }
        P.head.rotation.x = e.headPitch || 0;
      }
    } else if (t === "quad" || t === "creeper") {
      if (P.legFR) { P.legFR.rotation.x = swing; P.legBL.rotation.x = swing; P.legFL.rotation.x = -swing; P.legBR.rotation.x = -swing; }
      if (e.grazeT > 0) { e.grazeT -= dt; P.head.rotation.x = 0.9; } else if (P.head && t === "quad") P.head.rotation.x = 0;
      if (P.wool) P.wool.visible = !e.sheared;
      if (P.collar) P.collar.visible = !!e.tame;
      if (P.saddle) P.saddle.visible = !!e.saddled;
      if (def.mount && !(e.grazeT > 0)) P.head.rotation.x = e.sp === "trotter" ? (e.ridden ? 1.05 : 0.45) : (e.ridden ? 0.3 : 0.12);   // the neck leans forward (further while ridden, so you can see past it)
      if (P.tail) P.tail.rotation.x = def.mount ? 0.2 + Math.sin(e.age * 2) * 0.06 : (e.tame ? 0.9 : 0.3) + Math.sin(e.age * (e.tame ? 8 : 2)) * 0.12;
      if (def.pet) {   // sitting pets sit back on their haunches
        e.root.rotation.x = e.sitting ? -0.45 : 0;
        if (e.sitting) { P.legBR.rotation.x = P.legBL.rotation.x = 1.3; P.legFR.rotation.x = P.legFL.rotation.x = 0.45; e.mesh.position.y -= 0.12 * s; }
      }
      if (t === "creeper" && e.fuse > 0) { const k = 1 + e.fuse * 0.12 + Math.sin(e.age * 30) * 0.02; e.root.scale.set(s * k, s * k, s * k); }
      if (e.sp === "fox") {
        if (e.sleeping) {   // curled up for a nap
          P.legFR.rotation.x = P.legFL.rotation.x = -1.45; P.legBR.rotation.x = P.legBL.rotation.x = 1.45;
          e.mesh.position.y -= 0.33 * s; P.head.rotation.x = 0.35; P.tail.rotation.y = 0.9; P.tail.rotation.x = -0.2;
        } else P.tail.rotation.y = Math.sin(e.age * 2) * 0.15;
        if (e.held !== (e.heldShown || 0)) {   // the item it carries in its mouth
          if (e.heldMesh) { e.heldMesh.parent.remove(e.heldMesh); e.heldMesh.material.dispose(); e.heldMesh = null; }
          if (e.held && this.ctx.itemMesh) { e.heldMesh = this.ctx.itemMesh(e.held, 0.16); e.heldMesh.position.set(0, -0.09, 0.1); P.snout.children[0].add(e.heldMesh); }
          e.heldShown = e.held;
        }
      }
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
    } else if (t === "cindermaw") {
      const spread = e.spread ? -0.15 : null;
      const flap = e.perched ? Math.sin(e.age * 1.2) * 0.06 : spread !== null ? spread : Math.sin(e.age * (e.flapFast ? 8 : 2.8)) * 0.6;
      P.wingL.rotation.z = flap; P.wingR.rotation.z = -flap; P.wingTipL.rotation.z = flap * 0.7; P.wingTipR.rotation.z = -flap * 0.7;
      if (e.perched) { P.wingL.rotation.z = P.wingR.rotation.z = 0; P.wingL.rotation.y = -0.9; P.wingR.rotation.y = 0.9; } else { P.wingL.rotation.y = P.wingR.rotation.y = 0; }
      const sw = e.tailT > 0 ? Math.sin(e.age * 18) * 0.9 : Math.sin(e.age * 1.4) * 0.22;
      P.tail.rotation.y = sw; P.tail2.rotation.y = Math.sin(e.age * 1.4 - 0.7) * 0.3; P.tail3.rotation.y = Math.sin(e.age * 1.4 - 1.4) * 0.35; P.tail4.rotation.y = Math.sin(e.age * 1.4 - 2.1) * 0.4;
      P.neck.rotation.x = e.perched ? 0.3 : Math.max(-0.4, Math.min(0.4, -e.vel.y * 0.05));
      if (e.mouthT > 0) { e.mouthT -= dt; P.jaw.rotation.x = 0.55; if (Math.random() < 0.4) { const h = P.head.children[0].getWorldPosition(new THREE.Vector3()); this.ctx.particles(h.x, h.y, h.z, "fire"); } } else P.jaw.rotation.x = 0.05;
      for (const leg of ["legFR", "legFL", "legBR", "legBL"]) P[leg].rotation.x = e.perched ? 0 : 0.7;
      e.root.rotation.x = e.perched ? 0 : Math.max(-0.35, Math.min(0.35, -e.vel.y * 0.04));
      // its cracks glow brighter as it weakens
      const hurtGlow = 1 + (1 - e.hp / e.maxHp) * 0.5 + (e.tired ? Math.sin(e.age * 6) * 0.15 : 0);
      if (e.hurtT > 0) e.mat.color.setRGB(1.6, 0.6, 0.5); else e.mat.color.setRGB(hurtGlow, hurtGlow * 0.92, hurtGlow * 0.85);
      if (e.hp < e.maxHp * 0.33 && Math.random() < 0.15) this.ctx.particles(e.pos.x + rand(-2, 2), e.pos.y + 2.5, e.pos.z + rand(-2, 2), "ash");
      if (!e.beam) { e.beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffa040 })); this.scene.add(e.beam); e.beam.frustumCulled = false; }
      e.beam.visible = !!e.healFrom;
      if (e.healFrom) { const a = e.beam.geometry.attributes.position; a.setXYZ(0, e.healFrom.pos.x, e.healFrom.pos.y + 1.2, e.healFrom.pos.z); a.setXYZ(1, e.pos.x, e.pos.y + 2, e.pos.z); a.needsUpdate = true; }
    } else if (t === "crystal") {
      P.cage.rotation.set(e.age * 1.2, e.age * 1.7, 0); P.core.rotation.set(-e.age * 2, e.age, e.age * 1.4);
      P.cage.position.y = P.core.position.y = 16 / 16 + Math.sin(e.age * 2) * 0.15;
    } else if (t === "warden" || t === "sovereign") {
      if (P.legR) { P.legR.rotation.x = swing * 0.6; P.legL.rotation.x = -swing * 0.6; }
      const atk = e.swing > 0 ? -Math.sin(e.swing * 6) * 1.4 : 0, raise = e.raise > 0 ? -e.raise * 1.2 : 0;
      P.armR.rotation.x = -swing * 0.5 + atk + raise; P.armL.rotation.x = swing * 0.5 + atk + raise;
      if (P.core) { const k = 1 + Math.sin(e.age * (e.charging ? 14 : 3)) * 0.15; P.core.scale.setScalar(k); }
      if (t === "sovereign") { e.root.position.y = Math.sin(e.age * 1.2) * 0.3; for (let i = 0; i < 4; i++) { const a = e.age * 0.8 + i * Math.PI / 2; P["crown" + i].position.set(Math.cos(a) * 0.75, 96 / 16, Math.sin(a) * 0.75); } }
      if (e.shieldUp) { const k = 0.7 + Math.sin(e.age * 8) * 0.2; e.mat.color.setRGB(k, 1, 1.1); return; }
    } else if (t === "tempest") {   // the rubble spins (faster when it winds up an attack, and when it's badly hurt); the fists rise before a strike
      const spin = e.age * (e.charging ? 2.6 : 1.1) * (e.hp < e.maxHp * 0.33 ? 1.5 : 1);
      for (let i = 0; i < 18; i++) {
        const k = i % 6, P2 = P["d" + i];
        if (i < 6) { const a = spin * 2 + k / 6 * Math.PI * 2; P2.position.set(Math.cos(a) * 0.9, 0.5 + k * 0.32 + Math.sin(e.age * 3 + i) * 0.1, Math.sin(a) * 0.9); }   // the trail of rubble under it
        else { const ring = i < 12 ? 0 : 1, a = spin * (ring ? -0.8 : 1) + k / 6 * Math.PI * 2 + ring * 0.5, r = ring ? 3.4 : 4.3; P2.position.set(Math.cos(a) * r, (ring ? 4.9 : 3.3) + Math.sin(a) * (ring ? 0.5 : 0.9), Math.sin(a) * r); }
        P2.rotation.set(e.age * (0.6 + (i % 3) * 0.4), e.age * 0.5, 0);
      }
      const lift = e.charging ? -1.6 : 0, sway = Math.sin(e.age * 1.4) * 0.12;
      P.armR.rotation.x = lift + sway; P.armL.rotation.x = lift - sway; P.armR.rotation.z = -0.15; P.armL.rotation.z = 0.15;
      e.root.position.y = Math.sin(e.age * 1.5) * 0.1;
      if (P.core) P.core.scale.setScalar(1 + Math.sin(e.age * (e.charging ? 14 : 3)) * 0.18);
      if (e.shieldUp) { const k = 0.7 + Math.sin(e.age * 8) * 0.2; e.mat.color.setRGB(k, 1.1, k); return; }
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
    } else if (t === "fish" || t === "puffer" || t === "dolphin" || t === "squid") {
      const hs = Math.hypot(e.vel.x, e.vel.z), flop = !e.inWater && e.onGround;
      e.root.rotation.x = flop ? 0 : Math.max(-0.9, Math.min(0.9, -Math.atan2(e.vel.y, hs + 0.5) * 0.9));   // nose follows the way it swims
      e.root.rotation.z = flop && t !== "squid" ? Math.PI / 2 : 0;                                            // lying on its side out of the water
      if (t === "fish") { P.tail.rotation.y = Math.sin(e.walkPhase * 3) * 0.5; P.fin.rotation.z = Math.sin(e.walkPhase * 2) * 0.1; }
      else if (t === "puffer") { const k = 1 + (e.puff || 0) * 0.8; e.root.scale.setScalar(s * k); P.finR.rotation.y = Math.sin(e.age * 9) * 0.5; P.finL.rotation.y = -Math.sin(e.age * 9) * 0.5; P.tail.rotation.y = Math.sin(e.age * 5) * 0.4; }
      else if (t === "dolphin") { P.tail.rotation.x = Math.sin(e.walkPhase * 1.5) * 0.3; P.fluke.rotation.x = Math.sin(e.walkPhase * 1.5 - 0.6) * 0.3; }
      else {   // Inklings push themselves along by opening and closing their tentacles
        const spread = (Math.sin(e.age * 2.5) + 1) * 0.3 + 0.05;
        for (const q of def.model.parts) if (q.ang !== undefined) { P[q.name].rotation.z = Math.cos(q.ang) * spread; P[q.name].rotation.x = -Math.sin(q.ang) * spread; }
        e.root.rotation.x *= 0.4;
      }
    } else if (t === "cart") {
      e.root.rotation.z = 0;
    } else if (t === "boat") {
      e.root.rotation.z = Math.sin(e.age * 1.4) * 0.025;
    } else if (t === "bee") {
      const flap = 0.35 + Math.sin(e.age * 45) * 0.45; P.wingR.rotation.z = flap; P.wingL.rotation.z = -flap;
      e.root.position.y = Math.sin(e.age * 5) * 0.04;
    } else if (t === "parrot") {
      P.legR.rotation.x = swing; P.legL.rotation.x = -swing;
      const flap = e.onGround ? 0 : Math.sin(e.age * 22) * 0.9 + 0.5; P.wingR.rotation.z = flap; P.wingL.rotation.z = -flap;
      P.tail.rotation.x = e.onGround ? 0.3 : 0.6;
    }
    if (e.swing > 0) e.swing -= dt;
    animateDesertMob(e);
    // brightness from the light where it stands, flash red when hurt, white when about to explode
    const L = this.world.lightAt(Math.floor(e.pos.x), Math.floor(e.pos.y + 0.5), Math.floor(e.pos.z));
    let b = L ? Math.max(L[0] / 15 * daylight, L[1] / 15) : daylight;
    const amb = this.world.gen.isNether() ? 0.3 : 0.12;   // the Ember Depths glow a little everywhere
    b = amb + (1 - amb) * Math.pow(b, 1.5);
    if (e.def.expansion && ["glow_squid", "allay", "vex", "breeze"].includes(e.sp)) b = Math.max(b, 0.55);
    if (e.def.lostBoss || (this.world.gen.isMap && this.world.gen.isMap())) b = Math.max(b, e.def.lostBoss ? 0.8 : 0.5);   // the Keepers' creatures glow faintly, so you can always see them in the dark
    if (e.fuse > 0 && Math.sin(e.age * 25) > 0) e.mat.color.setRGB(1, 1, 1);
    else if (e.hurtT > 0) e.mat.color.setRGB(1, 0.35 * b, 0.35 * b);
    else if (e.burning > 0) e.mat.color.setRGB(Math.min(1, b * 1.4), b * 0.7, b * 0.4);
    else e.mat.color.setScalar(b);
    if (e.heldMesh) e.heldMesh.material.color.setScalar(b);
  }
}

function turn(a, target, k) { let d = target - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * Math.min(1, k); }
