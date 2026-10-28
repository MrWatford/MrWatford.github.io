// Blockhaven: the game loop, 3D drawing, controls, mining and building, survival rules, and saving.
import * as THREE from "../lib/three.module.min.js";
import { B, I, CHUNK, HEIGHT, SEA, BLOCKS, OPAQUE, SOLID, RECIPES, SMELT, FUEL, SMELT_TIME, TAGS, idOf, metaOf, make, blockDef, itemDef, isBlockItem,
  buildAtlas, faceTile, TILE, iconCanvas, OPEN, TOP, LIT, HEAD, WET, EYE_IN } from "./blocks.js";
import { Entities, SPECIES, TRADES } from "./entities.js";
import { Generator, NetherGen, EndGen, LOOT, LAVA_LEVEL, CURRENT_GEN, END_TOP, frameSpots } from "./worldgen.js";
import { World, chunkKey } from "./world.js";
import { buildChunk, doorBox } from "./mesher.js";
import { Player, raycast, blockBoxes, REACH } from "./player.js";
import { Inventory, newStack, maxStack } from "./inventory.js";
import { Sound } from "./audio.js";
import { Saves, newId, loadSettings, saveSettings } from "./save.js";
import { UI } from "./ui.js";
import { rng, hashSeed } from "./noise.js";

THREE.ColorManagement.enabled = false;
const DAY_LENGTH = 720;          // seconds for a full day and night (12 minutes)
const AUTOSAVE = 60;

// ---------- 3D setup ----------
const canvas = document.getElementById("view");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
} catch (e) {
  document.body.innerHTML = `<div style="padding:30px;font:18px system-ui;color:#fff;background:#222;height:100%">Sorry! This browser couldn't start 3D graphics, which Blockhaven needs. Try Chrome or Edge, and make sure "hardware acceleration" is turned on. <p><a style="color:#9f9" href="../../index.html">← Back to the games</a></p></div>`;
  throw e;
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 200);
scene.add(camera);

const atlasTex = new THREE.CanvasTexture(buildAtlas());
atlasTex.magFilter = THREE.NearestFilter; atlasTex.minFilter = THREE.NearestFilter; atlasTex.generateMipmaps = false;

const uniforms = { map: { value: atlasTex }, daylight: { value: 1 }, ambient: { value: 0.11 }, fogColor: { value: new THREE.Color(0x8fd0f5) }, fogNear: { value: 40 }, fogFar: { value: 64 }, alphaTest: { value: 0.5 }, opacity: { value: 1 } };
const VERT = `attribute vec3 lt; varying vec2 vUv; varying vec3 vLt; varying float vDist;
void main() { vUv = uv; vLt = lt; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FRAG = `uniform sampler2D map; uniform float daylight, ambient, fogNear, fogFar, alphaTest, opacity; uniform vec3 fogColor;
varying vec2 vUv; varying vec3 vLt; varying float vDist;
void main() {
  vec4 t = texture2D(map, vUv);
  if (t.a < alphaTest) discard;
  float s = vLt.x * daylight, b = vLt.y;
  float l = max(s, b);
  l = ambient + (1.0 - ambient) * pow(l, 1.5);
  vec3 tint = mix(vec3(1.0), vec3(1.0, 0.85, 0.62), clamp((b - s) * 1.5, 0.0, 1.0));
  vec3 col = t.rgb * l * vLt.z * tint;
  col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDist));
  gl_FragColor = vec4(col, t.a * opacity);
}`;
const solidMat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
const waterUniforms = { ...uniforms, alphaTest: { value: 0.01 } };
const waterMat = new THREE.ShaderMaterial({ uniforms: waterUniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });

// sky: sun, moon, stars
function discTexture(draw) { const c = document.createElement("canvas"); c.width = c.height = 32; draw(c.getContext("2d")); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t; }
const sun = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: discTexture(x => { x.fillStyle = "#fff3a6"; x.fillRect(4, 4, 24, 24); x.fillStyle = "#ffffff"; x.fillRect(8, 8, 16, 16); }), fog: false, depthWrite: false, transparent: true }));
const moon = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: discTexture(x => { x.fillStyle = "#e8eef8"; x.fillRect(6, 6, 20, 20); x.fillStyle = "#c3cad8"; x.fillRect(10, 10, 5, 5); x.fillRect(18, 17, 4, 4); }), fog: false, depthWrite: false, transparent: true }));
sun.renderOrder = moon.renderOrder = -2;
const starGeo = new THREE.BufferGeometry(), starPos = [];
{ const r = rng(42); for (let i = 0; i < 400; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); starPos.push(Math.cos(a) * s * 90, Math.abs(u) * 90, Math.sin(a) * s * 90); } }
starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false }));
stars.renderOrder = -3;
scene.add(sun, moon, stars);

// block highlight and cracks
const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }));
outline.visible = false; scene.add(outline);
const crackGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
const crack = new THREE.Mesh(crackGeo, new THREE.MeshBasicMaterial({ map: atlasTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: false }));
crack.visible = false; scene.add(crack);
function setBoxUV(geo, tileFor) {
  const uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const t = tileFor(f), tx = (t % 16) * 16, ty = Math.floor(t / 16) * 16;
    for (let k = 0; k < 4; k++) { const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i); uv.setXY(i, (tx + 0.02 + u * 15.96) / 256, 1 - (ty + 0.02 + (1 - v) * 15.96) / 256); }
  }
  uv.needsUpdate = true;
}
const BOX_FACE_DIR = [1, 1, 0, 2, 1, 1];   // BoxGeometry face order +x −x +y −y +z −z → top/side/bottom
const BOX_FRONT = 4;

// particles
const PMAX = 240, pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), parts = [];
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true }));
particles.frustumCulled = false; scene.add(particles);
const tileColor = (() => {
  const atlas = buildAtlas(), data = atlas.getContext("2d").getImageData(0, 0, 256, 256).data, cache = {};
  return t => {
    if (cache[t]) return cache[t];
    let r = 0, g = 0, b = 0, n = 0; const tx = (t % 16) * 16, ty = Math.floor(t / 16) * 16;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const i = ((ty + y) * 256 + tx + x) * 4; if (data[i + 3] > 100) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; } }
    return (cache[t] = n ? [r / n / 255, g / n / 255, b / n / 255] : [0.5, 0.5, 0.5]);
  };
})();
function burst(x, y, z, v, count = 14) {
  const col = tileColor(faceTile(v, 1));
  for (let i = 0; i < count; i++) {
    if (parts.length >= PMAX) parts.shift();
    parts.push({ x: x + Math.random(), y: y + Math.random(), z: z + Math.random(), vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 0.5 + Math.random() * 0.4, c: col.map(k => k * (0.75 + Math.random() * 0.4)) });
  }
}

// held item / hand
const hand = new THREE.Group(); camera.add(hand);
const handGeoCache = new Map(), itemTexCache = new Map();
function blockGeometry(id, size) {
  const key = id + ":" + size;
  if (!handGeoCache.has(key)) {
    const g = new THREE.BoxGeometry(size, size, size), d = BLOCKS[id];
    if (d.shape === "cube") setBoxUV(g, f => faceTile(make(id), BOX_FACE_DIR[f], d.front && f === BOX_FRONT));
    handGeoCache.set(key, g);
  }
  return handGeoCache.get(key);
}
function itemTexture(id) {
  if (!itemTexCache.has(id)) { const t = new THREE.CanvasTexture(iconCanvas(id)); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; itemTexCache.set(id, t); }
  return itemTexCache.get(id);
}
function itemMesh(id, size) {
  const d = BLOCKS[id];
  if (isBlockItem(id) && d.shape === "cube") return new THREE.Mesh(blockGeometry(id, size), new THREE.MeshBasicMaterial({ map: atlasTex, transparent: d.render !== "opaque", alphaTest: 0.5 }));
  return new THREE.Mesh(new THREE.PlaneGeometry(size * 1.5, size * 1.5), new THREE.MeshBasicMaterial({ map: itemTexture(id), alphaTest: 0.5, side: THREE.DoubleSide }));
}
let heldId = -1, heldMesh = null;
function updateHeld(bright) {
  const s = G.inv.slots[G.selected], id = s ? s.id : 0;
  if (id !== heldId) {
    if (heldMesh) { hand.remove(heldMesh); if (!heldMesh.userData.shared) heldMesh.geometry.dispose(); heldMesh.material.dispose(); }
    heldId = id;
    if (id) { heldMesh = itemMesh(id, 0.15); heldMesh.userData.shared = heldMesh.geometry.type !== "PlaneGeometry"; }
    else { heldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.26), new THREE.MeshBasicMaterial({ color: 0xd9a77c })); heldMesh.userData.skin = true; }
    heldMesh.renderOrder = 10; heldMesh.material.depthTest = false; heldMesh.material.fog = false;
    hand.add(heldMesh);
  }
  const sw = Math.sin(Math.min(1, G.swing) * Math.PI);
  const bob = G.settings.reducedMotion ? 0 : Math.sin(G.walkPhase * 2) * 0.012;
  hand.position.set(0.4 - sw * 0.08, -0.36 + bob - sw * 0.06, -0.62 - sw * 0.06);
  hand.rotation.set(-sw * 0.9, 0.5, 0);
  if (heldMesh.geometry.type === "PlaneGeometry") heldMesh.rotation.set(0, -0.6, 0.3); else heldMesh.rotation.set(0.1, 0.3, 0);
  if (heldMesh.userData.skin) heldMesh.material.color.setRGB(0.85 * bright, 0.65 * bright, 0.49 * bright);
  else heldMesh.material.color.setScalar(bright);
}

// ---------- game state ----------
const G = {
  state: "title",        // title | loading | play | pause | panel | dead
  settings: loadSettings(),
  world: null, gen: null, player: new Player(), inv: new Inventory(), meta: null, mode: "survival",
  time: 0.02, selected: 0, swing: 0, walkPhase: 0, stepDist: 0, drops: [], tips: {}, hudDirty: true,
  mining: null, useCooldown: 0, lastSpace: 0, playedSince: 0, autosaveT: 0, debug: false,
  xp: 0, effects: {}, bowT: -1, attackCd: 0, orbs: [], worlds: {}, dim: "overworld", dimData: {},
  wset: { difficulty: "easy", griefing: true, keepInv: true },
  get creative() { return this.mode === "creative"; }
};
window.__bh = G;   // handy for testing in the browser console

// ---------- creatures ----------
const ents = new Entities(scene, {
  world: () => G.world, player: () => G.player, settings: () => G.wset, creative: () => G.creative, alive: () => G.state !== "dead",
  hurtPlayer: (n, why, src) => hurt(n, why, src), effect: (k, t) => addEffect(k, t),
  explode: (x, y, z, power, src) => explode(x, y, z, power, src),
  drop: (id, n, x, y, z) => spawnDrop(id, n, x, y, z), xp: (n, x, y, z) => spawnOrbs(n, x, y, z),
  particles: (x, y, z, kind) => puff(x, y, z, kind), heldId: () => (G.inv.slots[G.selected] || {}).id || 0, lookDir: () => lookDir(),
  consume: () => { const s = G.inv.slots[G.selected]; if (s && !G.creative) { s.n--; if (!s.n) G.inv.slots[G.selected] = null; } G.hudDirty = true; heldId = -1; },
  wear: () => { const s = G.inv.slots[G.selected]; if (s) wearTool(s, 1); },
  swapHeld: id => swapHeld(id), give: (id, n) => G.inv.add(id, n) === 0 ? (G.hudDirty = true, Sound.pickup(), true) : false,
  wearingGold: () => [36, 37, 38, 39].some(i => G.inv.slots[i] && [I.GOLD_HELMET, I.GOLD_CHEST, I.GOLD_LEGS, I.GOLD_BOOTS].includes(G.inv.slots[i].id)),
  ignite: (x, y, z) => ignite(x, y, z),
  endTop: () => (G.gen.land ? (G.gen.land(0, 0) || { top: END_TOP }).top : END_TOP),
  cloud: (x, y, z) => addCloud(x, y, z),
  crystalGone: i => { const d = G.dimData.end || (G.dimData.end = {}); (d.crystalsGone = d.crystalsGone || []).push(i); },
  bossLeft: e => { (G.dimData.end || (G.dimData.end = {})).wyrmHp = e.hp; },
  bossDefeated: e => e.sp === "dragon" ? wyrmDefeated(e) : blightDefeated(e),
  time: () => G.time, day: () => G.meta.day || 1, toast: m => UI.toast(m),
  openTrade: e => openPanel("trade", e.uid),
  pearlLand: (x, y, z) => { const p = G.player; if (!G.world.isLoaded(x, z)) return; p.pos.x = x; p.pos.y = y; p.pos.z = z; p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; puff(x, y + 1, z, "void"); Sound.mob("teleport", 0); hurt(2, "Void Pearls sting a little when you land.", null); }
});
G.ents = ents;
const PUFF_COLORS = { poof: [0.85, 0.85, 0.85], heart: [1, 0.35, 0.45], void: [0.75, 0.3, 0.95], fire: [1, 0.55, 0.15], xp: [0.5, 1, 0.3], ember: [1, 0.45, 0.1], ash: [0.45, 0.4, 0.4], portal: [0.7, 0.35, 1] };
function puff(x, y, z, kind) {
  const c = PUFF_COLORS[kind] || [1, 1, 1], n = kind === "heart" ? 6 : 14;
  for (let i = 0; i < n; i++) { if (parts.length >= PMAX) parts.shift(); parts.push({ x: x + (Math.random() - 0.5) * 0.8, y: y + Math.random() * 0.6, z: z + (Math.random() - 0.5) * 0.8, vx: (Math.random() - 0.5) * 2, vy: kind === "heart" ? 1.5 : Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 0.6 + Math.random() * 0.4, c, floaty: true }); }
}
function swapHeld(id) {
  const s = G.inv.slots[G.selected];
  if (s && s.n > 1) { s.n--; if (G.inv.add(id, 1)) G.dropItem(id, 1); }
  else G.inv.slots[G.selected] = newStack(id, 1);
  G.hudDirty = true; heldId = -1;
}

// ---------- status effects (poison, queasy, burning) ----------
const EFFECT_NAMES = { poison: "☠️ Poisoned", queasy: "🤢 Queasy", fire: "🔥 On fire", blight: "💀 Blighted", levitation: "🎈 Floating", regen: "💖 Regenerating", swift: "💨 Swift" };
function addEffect(k, t) { if (G.creative) return; G.effects[k] = Math.max(G.effects[k] || 0, t); G.hudDirty = true; }
let effT = 0;
function tickEffects(dt) {
  const p = G.player;
  effT += dt;
  const tick = effT >= 1; if (tick) effT = 0;
  for (const k of Object.keys(G.effects)) {
    G.effects[k] -= dt;
    if (G.effects[k] <= 0) { delete G.effects[k]; G.hudDirty = true; continue; }
    if (k === "poison" && tick && p.health > 1) hurt(1, "Poison wore you down.", null, true);
    if (k === "queasy") p.exhaust += dt * 0.6;
    if (k === "fire") { if (p.inWater && !p.inLava) { delete G.effects.fire; G.hudDirty = true; } else if (tick) hurt(1, "You were burned. Jump in water to put out flames!", null, true); }
    if (k === "blight" && tick && Math.floor(G.effects[k]) % 2 === 0) hurt(1, "The Blight wore you down. Blight Rattlers cause it, so fight them with good armor.", null, true);
    if (k === "regen" && tick && Math.floor(G.effects[k]) % 2 === 0 && p.health < 20) { p.health = Math.min(20, p.health + 1); G.hudDirty = true; }
  }
}

// ---------- fire: lasts forever on Ember Depths rock, burns out quickly anywhere else ----------
const fires = [];
function ignite(x, y, z) {
  const w = G.world;
  if (w.id(x, y, z) && !BLOCKS[w.id(x, y, z)].replaceable) y++;
  if (w.id(x, y, z) && !BLOCKS[w.id(x, y, z)].replaceable) return false;
  if (!SOLID[w.id(x, y - 1, z)]) return false;
  w.set(x, y, z, B.FIRE);
  if (![B.EMBERRACK, B.MAGMA, B.SOUL_SAND].includes(w.id(x, y - 1, z))) fires.push({ x, y, z, t: 6 + Math.random() * 4 });
  return true;
}
function updateFires(dt) {
  for (let i = fires.length - 1; i >= 0; i--) {
    const f = fires[i]; f.t -= dt;
    if (f.t <= 0) { if (G.world.id(f.x, f.y, f.z) === B.FIRE) G.world.set(f.x, f.y, f.z, B.AIR); fires.splice(i, 1); }
  }
}

// ---------- the Blightking: three Blight Skulls on a T of Wailing Sand ----------
function checkBlightSummon(x, y, z) {
  const w = G.world;
  for (const [ax, az] of [[1, 0], [0, 1]]) for (const s of [-2, -1, 0]) {
    const sx = x + ax * s, sz = z + az * s, row = [0, 1, 2].map(i => [sx + ax * i, sz + az * i]);
    if (!row.every(([bx, bz]) => w.id(bx, y, bz) === B.SKULL && w.id(bx, y - 1, bz) === B.SOUL_SAND)) continue;
    const [mx, mz] = row[1];
    if (w.id(mx, y - 2, mz) !== B.SOUL_SAND) continue;
    for (const [bx, bz] of row) { w.set(bx, y, bz, B.AIR); w.set(bx, y - 1, bz, B.AIR); }
    w.set(mx, y - 2, mz, B.AIR);
    const e = ents.add("blightking", mx + 0.5, y - 2, mz + 0.5, { summonT: 10 });
    e.yaw = G.player.yaw;
    Sound.mob("roar", 0);
    UI.toast("The Blightking is waking up! Get ready, and back away from the blast.", "bad");
    return true;
  }
  return false;
}
function blightDefeated(e) {
  explode(e.pos.x, e.pos.y + 1.5, e.pos.z, 3, null);
  spawnDrop(I.RADIANT_STAR, 1, e.pos.x, e.pos.y + 1, e.pos.z);
  spawnOrbs(50, e.pos.x, e.pos.y + 1, e.pos.z);
  Sound.levelUp();
  UI.toast("You defeated the Blightking! It dropped a Radiant Star. Use it to craft a Beacon.", "good");
}
// Beacons: standing within 24 blocks gives Regeneration and Swiftness
let beaconT = 0;
function tickBeacons(dt) {
  if ((beaconT += dt) < 1) return; beaconT = 0;
  const p = G.player;
  for (const k of G.world.beacons) {
    const [x, y, z] = k.split(",").map(Number);
    if (G.world.isLoaded(x, z) && G.world.id(x, y, z) !== B.BEACON) { G.world.beacons.delete(k); continue; }
    if (Math.hypot(p.pos.x - x, p.pos.y - y, p.pos.z - z) < 24) { G.effects.regen = Math.max(G.effects.regen || 0, 4); G.effects.swift = Math.max(G.effects.swift || 0, 4); G.hudDirty = true; return; }
  }
}
// Trading with villagers
G.trade = (uid, i, many) => {
  const e = ents.list.find(o => o.uid === uid);
  if (!e) return;
  const t = TRADES[e.def.prof][i];
  let done = 0;
  for (let k = 0; k < (many ? 16 : 1); k++) {
    if (e.uses[i] >= t[2]) break;
    if (!t[0].every(([id, n]) => G.inv.count(id) >= n)) break;
    for (const [id, n] of t[0]) G.inv.remove(id, n);
    const left = G.inv.add(t[1][0], t[1][1]);
    if (left) G.dropItem(t[1][0], left);
    e.uses[i]++; done++;
    spawnOrbs(2, e.pos.x, e.pos.y + 1, e.pos.z);
  }
  if (!done) { Sound.error(); UI.toast(e.uses[i] >= t[2] ? "Sold out for now. Villagers restock while they work." : "You don't have enough for that trade.", "bad"); return; }
  Sound.craft(); puff(e.pos.x, e.pos.y + 2, e.pos.z, "xp"); e.trading = 30;
  G.hudDirty = true; UI.refreshPanel();
};

// ---------- the Hollow: travel, the Wyrm fight, and its rewards ----------
const clouds = [];
function addCloud(x, y, z) { clouds.push({ x, y, z, t: 6, tick: 0 }); }
function updateClouds(dt) {
  const p = G.player;
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i]; c.t -= dt; c.tick -= dt;
    if (Math.random() < 0.7) puff(c.x + (Math.random() - 0.5) * 4, c.y, c.z + (Math.random() - 0.5) * 4, "void");
    if (c.tick <= 0) { c.tick = 0.5; if (Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < 2.6 && Math.abs(p.pos.y - c.y) < 2) hurt(2, "The Wyrm's breath burned you! Step out of the purple clouds.", null, true); }
    if (c.t <= 0) clouds.splice(i, 1);
  }
}
const endData = () => G.dimData.end || (G.dimData.end = {});
// Make sure the Wyrm and its crystals are there while it's undefeated
function ensureBoss() {
  const d = endData(), p = G.player;
  if (d.wyrmDefeated || Math.hypot(p.pos.x, p.pos.z) > 160) return;
  const gone = d.crystalsGone || [];
  for (const pl of G.gen.pillars) {
    if (gone.includes(pl.i) || ents.list.some(e => e.sp === "crystal" && e.cid === pl.i)) continue;
    if (!G.world.isLoaded(pl.x, pl.z)) continue;
    ents.add("crystal", pl.x + 0.5, pl.top + 1, pl.z + 0.5, { cid: pl.i });
  }
  if (!ents.list.some(e => e.sp === "dragon")) {
    const top = (G.gen.land(0, 0) || { top: END_TOP }).top;
    const w = ents.add("dragon", 0.5, top + 20, 40.5, { hp: d.wyrmHp ?? 200 });
    w.ang = Math.PI / 2;
  }
}
function wyrmDefeated(e) {
  const d = endData(); d.wyrmDefeated = true; delete d.wyrmHp;
  const w = G.world, top = (G.gen.land(0, 0) || { top: END_TOP }).top;
  // exit fountain: a bedrock ring holding a portal home, with the egg on a pillar
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    w.set(dx, top, dz, B.BEDROCK);
    const ring = Math.abs(dx) === 2 || Math.abs(dz) === 2;
    w.set(dx, top + 1, dz, ring ? B.BEDROCK : (dx || dz) ? B.END_PORTAL : B.BEDROCK);
    for (let y = top + 2; y < top + 6; y++) if (!(dx === 0 && dz === 0)) { if (w.id(dx, y, dz)) w.set(dx, y, dz, B.AIR); }
  }
  for (let y = top + 2; y <= top + 4; y++) w.set(0, y, 0, B.BEDROCK);
  w.set(0, top + 5, 0, B.WYRM_EGG);
  buildGateway(40, (G.gen.land(40, 0) || { top }).top + 4, 0);
  spawnOrbs(400, G.player.pos.x, G.player.pos.y + 2, G.player.pos.z);
  spawnDrop(I.WYRM_SCALE, 3, 0.5, top + 2, 2.5);
  Sound.levelUp(); setTimeout(() => Sound.levelUp(), 400);
  UI.toast("You defeated the Hollow Wyrm! A portal home opened in the middle of the island.", "good");
  setTimeout(() => UI.toast("A Gateway appeared nearby. Step into it to reach the outer islands and the Hollow towers.", "good"), 3000);
  saveNow(true);
}
function buildGateway(x, y, z) {
  const w = G.world;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { w.set(x + dx, y - 1, z + dz, B.BEDROCK); w.set(x + dx, y + 1, z + dz, B.BEDROCK); }
  w.set(x, y, z, B.GATEWAY);
}
async function changeDim(toDim, cx, cz, label, place) {
  const p = G.player, fromDim = G.dim, back = { ...p.pos };
  G.traveling = true;
  try {
    G.state = "loading"; UI.show("loading"); UI.setLoading(0, label);
    document.getElementById("portalTint").style.opacity = 0;
    await saveNow(false);
    clearWorldMeshes(); G.world.chunks.clear(); G.world.dirtyQueue.clear(); fires.length = 0; clouds.length = 0;
    G.dim = toDim; G.world = makeWorld(toDim); G.gen = G.world.gen;
    p.pos.x = cx + 0.5; p.pos.z = cz + 0.5; p.pos.y = 60;
    await loadArea(cx, cz, label);
    place();
    p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; p.gliding = false;
    portalCooldown = true; portalT = 0;
    await saveNow(false);
    G.state = "pause"; UI.show("none"); UI.hud(); G.resume();
  } catch (err) {
    console.error(err);
    clearWorldMeshes(); if (G.world) G.world.chunks.clear();
    G.dim = fromDim; G.world = makeWorld(fromDim); G.gen = G.world.gen;
    Object.assign(p.pos, back);
    await loadArea(back.x, back.z, "Returning…");
    portalCooldown = true;
    G.state = "pause"; UI.show("none"); G.resume();
    UI.toast("The portal fizzled. Try again.", "bad");
  }
  G.traveling = false;
}
function enterHollow() {
  return changeDim("end", 100, 0, "Falling into the Hollow…", () => {
    const w = G.world, y = 48;
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { w.set(100 + dx, y, dz, B.OBSIDIAN); for (let k = 1; k <= 4; k++) w.set(100 + dx, y + k, dz, B.AIR); }
    const p = G.player; p.pos.x = 100.5; p.pos.y = y + 1; p.pos.z = 0.5;
    UI.toast(endData().wyrmDefeated ? "Back in the Hollow." : "The Hollow! Destroy the crystals on the pillars, then defeat the Wyrm. Don't fall into the void!", "bad");
  });
}
function leaveHollow() {
  const s = G.player.spawn;
  return changeDim("overworld", s.x, s.z, "Returning to the Surface…", () => { placeSafely(G.player, s.x, s.z); UI.toast("Home again!", "good"); });
}
async function gatewayJump() {
  const p = G.player, outward = Math.hypot(p.pos.x, p.pos.z) < 200;
  G.state = "loading"; UI.show("loading"); clouds.length = 0;
  if (outward) {
    // find the nearest outer island around x = 1000
    const tx = 1000, tz = 0;
    p.pos.x = tx + 0.5; p.pos.z = tz + 0.5;
    await loadArea(tx, tz, "Flying through the gateway…");
    let spot = null;
    for (let r = 0; r < 60 && !spot; r += 3) for (let a = 0; a < 12 && !spot; a++) { const x = Math.round(tx + Math.cos(a / 12 * Math.PI * 2) * r), z = Math.round(tz + Math.sin(a / 12 * Math.PI * 2) * r), l = G.gen.land(x, z); if (l && G.world.isLoaded(x, z)) spot = { x, z, y: l.top + 1 }; }
    if (!spot) { spot = { x: tx, z: tz, y: 50 }; for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) G.world.set(tx + dx, 49, tz + dz, B.HOLLOWSTONE); }
    for (let k = 0; k < 3; k++) if (SOLID[G.world.id(spot.x, spot.y + k, spot.z)]) G.world.set(spot.x, spot.y + k, spot.z, B.AIR);
    p.pos.x = spot.x + 0.5; p.pos.y = spot.y; p.pos.z = spot.z + 0.5;
    if (G.world.id(spot.x + 4, spot.y + 3, spot.z) !== B.GATEWAY) buildGateway(spot.x + 4, spot.y + 3, spot.z);
  } else {
    p.pos.x = 36.5; p.pos.z = 0.5;
    await loadArea(36, 0, "Flying through the gateway…");
    p.pos.y = (G.gen.land(36, 0) || { top: END_TOP }).top + 1;
  }
  p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; portalCooldown = true;
  G.state = "pause"; UI.show("none"); G.resume();
}
// Put an Eye of the Void into a portal frame; when all 12 have eyes, the portal opens
function fillFrame(hit) {
  const w = G.world, slot = G.inv.slots[G.selected];
  hit.v = w.get(hit.x, hit.y, hit.z);
  if (idOf(hit.v) !== B.END_FRAME) return;
  if (metaOf(hit.v) & EYE_IN) { UI.toast("That frame already has an eye."); return; }
  if (!slot || slot.id !== I.EYE) { UI.toast("This frame needs an Eye of the Void.", ""); return; }
  w.set(hit.x, hit.y, hit.z, make(B.END_FRAME, metaOf(hit.v) | EYE_IN));
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
  Sound.mob("teleport", 0); puff(hit.x + 0.5, hit.y + 1, hit.z + 0.5, "portal"); G.hudDirty = true; heldId = -1;
  const gen = G.gen;
  for (const s of gen.strongholds || []) {
    if (Math.abs(s.x - hit.x) > 3 || Math.abs(s.z - hit.z) > 3) continue;
    const spots = frameSpots(s), filled = spots.filter(([x, y, z]) => w.id(x, y, z) === B.END_FRAME && (metaOf(w.get(x, y, z)) & EYE_IN)).length;
    if (filled === spots.length) {
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) w.set(s.x + dx, s.y, s.z + dz, B.END_PORTAL);
      Sound.mob("portal", 0); Sound.levelUp();
      UI.toast("The Hollow Portal is open! Jump in when you're ready. Bring armor, a bow, lots of arrows, and blocks.", "good");
    } else UI.toast(`${filled} of ${spots.length} eyes placed.`);
  }
}
function throwEye() {
  if (G.dim !== "overworld") { UI.toast("The eye just spins in place. Strongholds are on the Surface.", "bad"); return; }
  const p = G.player, s = [...G.gen.strongholds].sort((a, b) => Math.hypot(a.x - p.pos.x, a.z - p.pos.z) - Math.hypot(b.x - p.pos.x, b.z - p.pos.z))[0];
  ents.addProjectile("eye", p.pos.x, p.pos.y + 1.5, p.pos.z, 0, 0, 0, { tx: s.x + 0.5, tz: s.z + 0.5, noGrav: true, fromPlayer: true });
  const sl = G.inv.slots[G.selected]; if (sl && !G.creative) { sl.n--; if (!sl.n) G.inv.slots[G.selected] = null; }
  G.hudDirty = true; heldId = -1; Sound.mob("teleport", 0);
  const dist = Math.hypot(s.x - p.pos.x, s.z - p.pos.z);
  if (dist < 14) UI.toast("The eye dove into the ground. The stronghold is right below you!", "good");
}
// Chorus Fruit: blink to a random safe spot nearby
function chorusBlink() {
  const p = G.player, w = G.world;
  for (let k = 0; k < 24; k++) {
    const x = Math.floor(p.pos.x + (Math.random() - 0.5) * 16), z = Math.floor(p.pos.z + (Math.random() - 0.5) * 16);
    for (let y = Math.floor(p.pos.y) + 6; y > Math.floor(p.pos.y) - 8; y--) {
      if (SOLID[w.id(x, y - 1, z)] && !SOLID[w.id(x, y, z)] && !SOLID[w.id(x, y + 1, z)] && w.id(x, y, z) !== B.LAVA) {
        puff(p.pos.x, p.pos.y + 1, p.pos.z, "void"); p.pos.x = x + 0.5; p.pos.y = y; p.pos.z = z + 0.5; p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
        puff(p.pos.x, p.pos.y + 1, p.pos.z, "void"); Sound.mob("teleport", 0); return;
      }
    }
  }
}

// ---------- portals between the Surface and the Ember Depths ----------
const DIM_NAMES = { overworld: "the Surface", nether: "the Ember Depths", end: "the Hollow" };
// Light a portal inside an obsidian frame. (x, y, z) is an empty spot inside the frame.
function lightPortal(x, y, z) {
  const w = G.world;
  for (const axis of [0, 1]) {
    const cell = (a, yy) => axis === 0 ? [a, yy, z] : [x, yy, a];
    const start = axis === 0 ? x : z, seen = new Set(), queue = [[start, y]];
    let ok = true;
    while (queue.length && ok) {
      const [a, yy] = queue.pop(), k = a + "," + yy;
      if (seen.has(k)) continue;
      const id = w.id(...cell(a, yy));
      if (id === B.OBSIDIAN) continue;
      if (id !== B.AIR && id !== B.FIRE) { ok = false; break; }
      seen.add(k);
      if (seen.size > 21 * 21) { ok = false; break; }
      queue.push([a + 1, yy], [a - 1, yy], [a, yy + 1], [a, yy - 1]);
    }
    if (!ok || !seen.size) continue;
    const pts = [...seen].map(s => s.split(",").map(Number));
    const minA = Math.min(...pts.map(q => q[0])), maxA = Math.max(...pts.map(q => q[0])), minY = Math.min(...pts.map(q => q[1])), maxY = Math.max(...pts.map(q => q[1]));
    const wd = maxA - minA + 1, ht = maxY - minY + 1;
    if (wd < 2 || ht < 3 || wd > 21 || ht > 21 || pts.length !== wd * ht) continue;
    let frame = true;
    for (let a = minA; a <= maxA; a++) if (w.id(...cell(a, minY - 1)) !== B.OBSIDIAN || w.id(...cell(a, maxY + 1)) !== B.OBSIDIAN) frame = false;
    for (let yy = minY; yy <= maxY; yy++) if (w.id(...cell(minA - 1, yy)) !== B.OBSIDIAN || w.id(...cell(maxA + 1, yy)) !== B.OBSIDIAN) frame = false;
    if (!frame) continue;
    for (const [a, yy] of pts) w.set(...cell(a, yy), make(B.PORTAL, axis));
    const anchor = axis === 0 ? { x: minA, y: minY, z, axis, w: wd, h: ht } : { x, y: minY, z: minA, axis, w: wd, h: ht };
    registerPortal(G.dim, anchor);
    Sound.mob("portal", 0); puff(x + 0.5, y + 1, z + 0.5, "portal");
    UI.toast("The portal hums to life! Step in and wait a moment to travel.", "good");
    return true;
  }
  return false;
}
function portalList(dim) { const d = G.dimData[dim] || (G.dimData[dim] = {}); return d.portals || (d.portals = []); }
function registerPortal(dim, a) { const list = portalList(dim); if (!list.some(q => q.x === a.x && q.y === a.y && q.z === a.z)) list.push(a); }
const portalKey = a => a.x + "," + a.y + "," + a.z;
// Which registered portal is this block part of?
function portalAt(x, y, z) {
  return portalList(G.dim).find(a => y >= a.y && y < a.y + a.h && (a.axis === 0 ? (z === a.z && x >= a.x && x < a.x + a.w) : (x === a.x && z >= a.z && z < a.z + a.w)));
}
// Breaking the frame (or the portal itself) switches the whole portal off
function breakPortal(x, y, z) {
  const w = G.world, seen = new Set(), queue = [[x, y, z]];
  while (queue.length && seen.size < 500) {
    const [a, b, c] = queue.pop(), k = a + "," + b + "," + c;
    if (seen.has(k)) continue; seen.add(k);
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (w.id(a + dx, b + dy, c + dz) === B.PORTAL) { w.set(a + dx, b + dy, c + dz, B.AIR); queue.push([a + dx, b + dy, c + dz]); }
  }
  const list = portalList(G.dim);
  for (let i = list.length - 1; i >= 0; i--) { const a = list[i]; if (G.world.isLoaded(a.x, a.z) && w.id(a.x, a.y, a.z) !== B.PORTAL) list.splice(i, 1); }
}
let portalT = 0, portalCooldown = false;
function checkPortal(dt) {
  const p = G.player, w = G.world, a = p.aabb();
  let inside = null;
  let kind = 0;
  for (let yy = Math.floor(a[1]); yy <= Math.floor(a[4] - 0.01) && !inside; yy++) for (let xx = Math.floor(a[0]); xx <= Math.floor(a[3]) && !inside; xx++) for (let zz = Math.floor(a[2]); zz <= Math.floor(a[5]) && !inside; zz++) {
    const id = w.id(xx, yy, zz);
    if (id === B.PORTAL || id === B.END_PORTAL || id === B.GATEWAY) { inside = [xx, yy, zz]; kind = id; }
  }
  const tint = document.getElementById("portalTint");
  if (!inside) { portalT = 0; portalCooldown = false; tint.style.opacity = 0; return; }
  if (portalCooldown) { tint.style.opacity = kind === B.PORTAL ? 0.15 : 0; return; }
  if (kind === B.END_PORTAL && !G.traveling) { if (G.dim === "end") leaveHollow(); else enterHollow(); return; }
  if (kind === B.GATEWAY && !G.traveling) { gatewayJump(); return; }
  if (portalT === 0) Sound.mob("portal", 0);
  portalT += dt;
  const need = G.creative ? 0.6 : 2.5;
  tint.style.opacity = Math.min(0.85, portalT / need);
  if (portalT >= need && !G.traveling) { portalT = 0; travel(G.dim === "nether" ? "overworld" : "nether", portalAt(...inside) || { x: inside[0], y: inside[1], z: inside[2], axis: idOf(w.get(...inside)) === B.PORTAL ? metaOf(w.get(...inside)) & 1 : 0, w: 2, h: 3 }); }
}
async function travel(toDim, fromPortal) {
  const p = G.player, fromDim = G.dim, back = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
  const scale = toDim === "nether" ? 1 / 8 : 8, tx = Math.floor(p.pos.x * scale), tz = Math.floor(p.pos.z * scale);
  G.traveling = true;
  try {
    G.state = "loading"; UI.show("loading"); UI.setLoading(0, "Traveling to " + DIM_NAMES[toDim] + "…");
    document.getElementById("portalTint").style.opacity = 0;
    await saveNow(false);
    clearWorldMeshes(); G.world.chunks.clear(); G.world.dirtyQueue.clear(); fires.length = 0;
    G.dim = toDim; G.world = makeWorld(toDim); G.gen = G.world.gen;
    // a remembered link takes you back to the same portal every time
    const link = fromPortal && (G.dimData[fromDim].links || {})[portalKey(fromPortal)];
    let dest = link && link.dim === toDim ? link : null;
    if (!dest) {
      const range = toDim === "nether" ? 16 : 128;
      dest = portalList(toDim).filter(a => Math.hypot(a.x - tx, a.z - tz) <= range).sort((a, b) => Math.hypot(a.x - tx, a.z - tz) - Math.hypot(b.x - tx, b.z - tz))[0] || null;
    }
    const cx = dest ? dest.x : tx, cz = dest ? dest.z : tz;
    p.pos.x = cx + 0.5; p.pos.z = cz + 0.5;
    await loadArea(cx, cz, "Traveling to " + DIM_NAMES[toDim] + "…");
    if (dest && G.world.id(dest.x, dest.y, dest.z) !== B.PORTAL) {   // that portal was broken
      const list = portalList(toDim), at = list.findIndex(q => q.x === dest.x && q.y === dest.y && q.z === dest.z); if (at >= 0) list.splice(at, 1); dest = null;
    }
    if (!dest) dest = buildPortal(tx, tz);
    // remember the link both ways
    if (fromPortal) {
      (G.dimData[fromDim].links = G.dimData[fromDim].links || {})[portalKey(fromPortal)] = { dim: toDim, ...dest };
      (G.dimData[toDim].links = G.dimData[toDim].links || {})[portalKey(dest)] = { dim: fromDim, ...fromPortal };
    }
    p.pos.x = (dest.axis === 0 ? dest.x + 1 : dest.x) + 0.5; p.pos.y = dest.y; p.pos.z = (dest.axis === 0 ? dest.z : dest.z + 1) + 0.5;
    if (dest.axis === 0 && dest.w < 2) p.pos.x = dest.x + 0.5;
    p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
    portalCooldown = true; portalT = 0;
    await saveNow(false);
    G.state = "pause"; UI.show("none"); UI.hud(); G.resume();
    UI.toast(toDim === "nether" ? "Welcome to the Ember Depths! Watch out for lava, and don't sleep here." : "Back on the Surface.", toDim === "nether" ? "bad" : "good");
    if (toDim === "nether" && !G.tips.nether) { G.tips.nether = true; UI.toast("Tip: wear a piece of gold armor and the Boarkin won't attack. Give them gold ingots to trade.", ""); }
  } catch (err) {
    console.error(err);
    // something went wrong: go back where we were
    clearWorldMeshes(); if (G.world) G.world.chunks.clear();
    G.dim = fromDim; G.world = makeWorld(fromDim); G.gen = G.world.gen;
    Object.assign(p.pos, back);
    await loadArea(back.x, back.z, "Returning…");
    portalCooldown = true;
    G.state = "pause"; UI.show("none"); G.resume();
    UI.toast("The portal fizzled. Try again.", "bad");
  }
  G.traveling = false;
}
// Find a safe spot near (tx, tz) and build a working portal there (with a small platform if needed)
function buildPortal(tx, tz) {
  const w = G.world, nether = G.dim === "nether";
  const fits = (x, y, z) => {
    for (let a = 0; a < 4; a++) {
      if (!SOLID[w.id(x + a, y - 1, z)] || w.id(x + a, y - 1, z) === B.LAVA) return false;
      for (let b = 0; b < 5; b++) { const id = w.id(x + a, y + b, z); if (id && !BLOCKS[id].replaceable && id !== B.FIRE) return false; }
    }
    for (const dz of [-1, 1]) for (let a = 1; a < 3; a++) for (let b = 0; b < 3; b++) { const id = w.id(x + a, y + b, z + dz); if (SOLID[id] || id === B.LAVA) return false; }
    return true;
  };
  let spot = null;
  for (let r = 0; r <= 16 && !spot; r++) for (let dx = -r; dx <= r && !spot; dx++) for (let dz = -r; dz <= r && !spot; dz++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    const x = tx + dx, z = tz + dz;
    if (!w.isLoaded(x, z) || !w.isLoaded(x + 3, z + 1)) continue;
    if (nether) { for (let y = 66; y > LAVA_LEVEL + 1 && !spot; y--) if (fits(x, y, z)) spot = { x, y, z }; }
    else { const y = w.surfaceY(x, z) + 1; if (y > 2 && y < HEIGHT - 8 && fits(x, y, z)) spot = { x, y, z }; }
  }
  if (!spot) {   // no good place: carve one out and stand it on an obsidian platform
    const y = nether ? Math.max(LAVA_LEVEL + 8, Math.min(60, 40)) : Math.max(3, w.surfaceY(tx, tz) + 1);
    spot = { x: tx, y, z: tz };
    for (let a = -1; a < 5; a++) for (let dz = -2; dz <= 2; dz++) {
      if (w.id(tx + a, y - 1, tz + dz) !== B.BEDROCK) w.set(tx + a, y - 1, tz + dz, B.OBSIDIAN);
      for (let b = 0; b < 5; b++) if (w.id(tx + a, y + b, tz + dz) !== B.BEDROCK) w.set(tx + a, y + b, tz + dz, B.AIR);
    }
  }
  const { x, y, z } = spot;
  for (let a = 0; a < 4; a++) for (let b = 0; b < 5; b++) {
    const edge = a === 0 || a === 3 || b === 0 || b === 4;
    w.set(x + a, y + b, z, edge ? B.OBSIDIAN : make(B.PORTAL, 0));
  }
  const anchor = { x: x + 1, y: y + 1, z, axis: 0, w: 2, h: 3 };
  registerPortal(G.dim, anchor);
  return anchor;
}

// ---------- experience ----------
const XP_FOR = lvl => 2 * lvl + 7;   // points to go from this level to the next
function levelInfo(total) { let lvl = 0, left = total; while (left >= XP_FOR(lvl)) { left -= XP_FOR(lvl); lvl++; } return { level: lvl, frac: left / XP_FOR(lvl) }; }
G.levelInfo = () => levelInfo(G.xp);
const orbGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
function spawnOrbs(n, x, y, z) {
  while (n > 0 && G.orbs.length < 60) {
    const v = Math.min(n, n > 10 ? 5 : n > 3 ? 3 : 1); n -= v;
    const mesh = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: 0x9dff4a, fog: false }));
    mesh.position.set(x, y, z); scene.add(mesh);
    G.orbs.push({ v, x, y, z, vx: (Math.random() - 0.5) * 2, vy: 3, vz: (Math.random() - 0.5) * 2, age: 0, mesh });
  }
}
function updateOrbs(dt) {
  const p = G.player;
  for (const o of G.orbs) {
    o.age += dt;
    const dx = p.pos.x - o.x, dy = p.pos.y + 0.8 - o.y, dz = p.pos.z - o.z, d = Math.hypot(dx, dy, dz);
    if (d < 6 && o.age > 0.4 && G.state !== "dead") { o.vx = dx / d * 8; o.vy = dy / d * 8; o.vz = dz / d * 8; }
    else { o.vy -= 10 * dt; o.vx *= 0.95; o.vz *= 0.95; if (SOLID[G.world.id(Math.floor(o.x), Math.floor(o.y - 0.1), Math.floor(o.z))] && o.vy < 0) o.vy = 0; }
    o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt;
    o.mesh.position.set(o.x, o.y, o.z); o.mesh.rotation.y += dt * 4;
    o.mesh.material.color.setHSL(0.25 + Math.sin(o.age * 6) * 0.05, 1, 0.6);
    if (d < 0.9 && o.age > 0.4) {
      const before = levelInfo(G.xp).level;
      G.xp += o.v; o.gone = true; Sound.xp(); G.hudDirty = true;
      if (levelInfo(G.xp).level > before) { Sound.levelUp(); UI.toast(`Level ${levelInfo(G.xp).level}!`, "good"); }
    }
    if (o.age > 300) o.gone = true;
  }
  G.orbs = G.orbs.filter(o => { if (o.gone) { scene.remove(o.mesh); o.mesh.material.dispose(); return false; } return true; });
}

// ---------- explosions ----------
function explode(x, y, z, power, src) {
  const w = G.world, p = G.player, dist = Math.hypot(p.pos.x - x, p.pos.y + 0.9 - y, p.pos.z - z);
  Sound.explode(dist);
  for (let i = 0; i < 5; i++) puff(x + (Math.random() - 0.5) * power, y + (Math.random() - 0.5) * power, z + (Math.random() - 0.5) * power, "poof");
  // blocks
  const griefing = G.wset.griefing || !(src && src.def);   // Blast Blocks always break things; creatures only if allowed
  if (griefing) {
    const r = Math.ceil(power);
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
      const bx = Math.floor(x) + dx, by = Math.floor(y) + dy, bz = Math.floor(z) + dz, d = Math.hypot(dx, dy, dz);
      if (d > power * (0.7 + Math.random() * 0.5)) continue;
      const v = w.get(bx, by, bz), id = idOf(v), def = blockDef(v);
      if (!id || id === B.WATER || id === B.LAVA || def.hardness >= 15) continue;
      if (id === B.TNT) { w.set(bx, by, bz, B.AIR); primeTNT(bx, by, bz, 0.4 + Math.random() * 0.6); continue; }
      breakBlock(bx, by, bz, Math.random() < 0.3, true);
    }
  }
  // creatures and the player
  const reach = power * 2;
  for (const e of ents.near(x, y, z, reach)) {
    const d = Math.hypot(e.pos.x - x, e.pos.y + e.h / 2 - y, e.pos.z - z), k = 1 - d / reach;
    const l = Math.hypot(e.pos.x - x, e.pos.z - z) || 1;
    ents.damage(e, Math.round(k * power * 5), "explosion", { x: (e.pos.x - x) / l * k * 1.5, z: (e.pos.z - z) / l * k * 1.5 });
  }
  if (dist < reach) {
    const k = 1 - dist / reach, mul = { peaceful: 0.4, easy: 0.6, normal: 1, hard: 1.4 }[G.wset.difficulty] || 1;
    const l = Math.hypot(p.pos.x - x, p.pos.z - z) || 1;
    p.vel.x += (p.pos.x - x) / l * k * 12; p.vel.z += (p.pos.z - z) / l * k * 12; p.vel.y += k * 8;
    hurt(Math.round(k * power * 4.5 * mul), src && src.def ? `A ${src.def.name} exploded next to you!` : "You were caught in an explosion!", null);
  }
}
const primed = [];
function primeTNT(x, y, z, fuse = 4) {
  const mesh = new THREE.Mesh(blockGeometry(B.TNT, 1), new THREE.MeshBasicMaterial({ map: atlasTex }));
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5); scene.add(mesh);
  primed.push({ x: x + 0.5, y: y + 0.5, z: z + 0.5, vy: 0, fuse, mesh });
  Sound.mob("fuse", Math.hypot(G.player.pos.x - x, G.player.pos.z - z));
}
function updateTNT(dt) {
  for (const t of primed) {
    t.fuse -= dt; t.vy -= 18 * dt;
    const ny = t.y + t.vy * dt;
    if (SOLID[G.world.id(Math.floor(t.x), Math.floor(ny - 0.5), Math.floor(t.z))]) t.vy = 0; else t.y = ny;
    t.mesh.position.set(t.x, t.y, t.z);
    const flash = Math.sin(t.fuse * 18) > 0; t.mesh.material.color.setScalar(flash ? 1.6 : 1); t.mesh.scale.setScalar(1 + Math.max(0, 0.4 - t.fuse) * 0.4);
    if (t.fuse <= 0) { t.gone = true; scene.remove(t.mesh); t.mesh.material.dispose(); explode(t.x, t.y, t.z, 4, null); }
  }
  for (let i = primed.length - 1; i >= 0; i--) if (primed[i].gone) primed.splice(i, 1);
}

// ---------- farming: crops and saplings grow while you play ----------
let cropT = 0;
function tickCrops(dt) {
  cropT += dt; if (cropT < 1) return; cropT = 0;
  const w = G.world;
  for (const key of [...w.crops]) {
    const [x, y, z] = key.split(",").map(Number);
    if (!w.isLoaded(x, z)) continue;
    const v = w.get(x, y, z), id = idOf(v);
    if (id === B.WHEAT || id === B.CARROTS) {
      const stage = metaOf(v) & 7;
      if (stage >= 7) { w.crops.delete(key); continue; }
      const soil = w.get(x, y - 1, z), wet = idOf(soil) === B.FARMLAND && (metaOf(soil) & WET);
      if (Math.random() < (wet ? 1 / 12 : 1 / 30)) w.set(x, y, z, make(id, stage + 1));
    } else if (id === B.SAPLING) { if (Math.random() < 1 / 90) growTree(x, y, z, metaOf(v) & 1); }
    else w.crops.delete(key);
  }
}
function hydrate(x, y, z) {   // farmland near water stays wet
  const w = G.world;
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (w.id(x + dx, y, z + dz) === B.WATER || w.id(x + dx, y + 1, z + dz) === B.WATER) return true;
  return false;
}
function growTree(x, y, z, birch) {
  const w = G.world, h = 5 + Math.floor(Math.random() * 2);
  for (let k = 1; k <= h + 1; k++) if (SOLID[w.id(x, y + k, z)]) return false;
  const log = birch ? B.BIRCH_LOG : B.LOG, leaf = birch ? B.BIRCH_LEAVES : B.LEAVES, top = y + h;
  for (let ly = top - 3; ly <= top; ly++) {
    const r = ly >= top - 1 ? 1 : 2;
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.abs(dx) === r && Math.abs(dz) === r && (ly === top || Math.random() < 0.5)) continue;
      if (!w.id(x + dx, ly, z + dz) || BLOCKS[w.id(x + dx, ly, z + dz)].replaceable) w.set(x + dx, ly, z + dz, leaf);
    }
  }
  for (let ly = y; ly < top; ly++) w.set(x, ly, z, log);
  w.crops.delete(x + "," + y + "," + z);
  return true;
}

const keys = new Set();
let locked = false, wantLock = false, mouseL = false, mouseR = false;

// ---------- chunk streaming ----------
const OFFSETS = [];
for (let R = 0; R <= 11; R++) {
  const list = [];
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) list.push([dx, dz, dx * dx + dz * dz]);
  list.sort((a, b) => a[2] - b[2]); OFFSETS.push(list);
}
function makeGeo(b) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(b.pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(b.uv, 2));
  g.setAttribute("lt", new THREE.BufferAttribute(b.lt, 3)); g.setIndex(new THREE.BufferAttribute(b.index, 1));
  g.computeBoundingSphere();
  return g;
}
function disposeMesh(c) {
  if (!c.mesh) return;
  for (const m of [c.mesh.solid, c.mesh.water]) if (m) { scene.remove(m); m.geometry.dispose(); }
  c.mesh = null;
}
function meshChunk(c) {
  const built = buildChunk(G.world, c, G.settings.quality === "fancy");
  disposeMesh(c);
  c.mesh = {};
  if (built.solid) { const m = new THREE.Mesh(makeGeo(built.solid), solidMat); m.position.set(c.cx * CHUNK, 0, c.cz * CHUNK); scene.add(m); c.mesh.solid = m; }
  if (built.water) { const m = new THREE.Mesh(makeGeo(built.water), waterMat); m.position.set(c.cx * CHUNK, 0, c.cz * CHUNK); m.renderOrder = 1; scene.add(m); c.mesh.water = m; }
  c.dirty = false; c.urgent = false; G.world.dirtyQueue.delete(c);
}
const neighborsReady = c => { for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!G.world.chunks.has(chunkKey(c.cx + dx, c.cz + dz))) return false; return true; };
let unloadTick = 0;
function stream(budget) {
  const w = G.world, t0 = performance.now(), R = G.settings.renderDist;
  const pcx = Math.floor(G.player.pos.x / CHUNK), pcz = Math.floor(G.player.pos.z / CHUNK);
  // edits near the player first
  for (const c of w.dirtyQueue) if (c.urgent && neighborsReady(c)) meshChunk(c);
  for (const [dx, dz] of OFFSETS[R + 1]) {
    if (performance.now() - t0 > budget) break;
    if (!w.chunks.has(chunkKey(pcx + dx, pcz + dz))) w.load(pcx + dx, pcz + dz);
  }
  for (const [dx, dz] of OFFSETS[R]) {
    if (performance.now() - t0 > budget) break;
    const c = w.chunks.get(chunkKey(pcx + dx, pcz + dz));
    if (c && c.dirty && neighborsReady(c)) meshChunk(c);
  }
  if (++unloadTick % 30 === 0) {
    for (const c of [...w.chunks.values()]) {
      if (Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) > R + 2) { disposeMesh(c); w.unload(c); }
      else if (c.mesh && Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) > R) { disposeMesh(c); c.dirty = true; }
    }
  }
}
function clearWorldMeshes() {
  if (!G.world) return;
  for (const c of G.world.chunks.values()) disposeMesh(c);
  for (const d of G.drops) removeDrop(d);
  G.drops = []; parts.length = 0;
  ents.clear();
  for (const o of G.orbs) { scene.remove(o.mesh); o.mesh.material.dispose(); } G.orbs = [];
  for (const t of primed) { scene.remove(t.mesh); t.mesh.material.dispose(); } primed.length = 0;
}

// ---------- dimensions: each has its own generator, block changes, containers, and creatures ----------
function makeWorld(dim) {
  const data = G.dimData[dim] || (G.dimData[dim] = {});
  const gen = dim === "nether" ? new NetherGen(G.meta.seed) : dim === "end" ? new EndGen(G.meta.seed) : new Generator(G.meta.seed, G.meta.gen || 1);
  const w = new World(gen);
  w.dim = dim;
  w.modsFromJSON(data.mods);
  for (const [k, c] of data.containers || []) w.containers.set(k, c);
  for (const k of Object.keys(data.entities || {})) w.entityStore.set(k, data.entities[k]);
  for (const k of data.visited || []) w.visited.add(k);
  for (const k of data.crops || []) w.crops.add(k);
  for (const k of data.newGen || []) w.newGen.add(k);
  w.beacons = new Set(data.beacons || []);
  w.onLoad = c => ents.loadChunk(c);
  w.onUnload = c => ents.unloadChunk(c);
  return w;
}
function dimSnapshot(w) {
  const old = G.dimData[w.dim] || {};
  if (w.dim === "end") { const dr = ents.list.find(e => e.sp === "dragon" && !e.dead); if (dr) old.wyrmHp = dr.hp; }
  return { ...old, mods: w.modsToJSON(), containers: [...w.containers], entities: ents.toJSON(), visited: [...w.visited], crops: [...w.crops], newGen: [...w.newGen], beacons: [...(w.beacons || [])], portals: old.portals || [], links: old.links || {} };
}
// Build (and draw) the land around a spot, with a progress bar
async function loadArea(x, z, label) {
  const R = G.settings.renderDist, pcx = Math.floor(x / CHUNK), pcz = Math.floor(z / CHUNK);
  const toLoad = OFFSETS[R + 1], toMesh = OFFSETS[Math.min(R, 3)];
  let done = 0; const total = toLoad.length + toMesh.length;
  for (const [dx, dz] of toLoad) {
    G.world.load(pcx + dx, pcz + dz);
    if (++done % 4 === 0) { UI.setLoading(done / total, label); await frame(); }
  }
  for (const [dx, dz] of toMesh) {
    const c = G.world.chunks.get(chunkKey(pcx + dx, pcz + dz));
    if (c && neighborsReady(c)) meshChunk(c);
    if (++done % 4 === 0) { UI.setLoading(done / total, label); await frame(); }
  }
}

// ---------- starting, loading, saving ----------
async function startWorld(save) {
  clearWorldMeshes();
  G.state = "loading"; UI.show("loading"); UI.setLoading(0, "Shaping hills and valleys");
  G.meta = save; G.mode = save.mode;
  G.dimData = save.dims || { overworld: { mods: save.mods || {}, containers: save.containers || [] } };
  G.dim = (save.player && save.player.dim) || "overworld";
  G.wset = { difficulty: "easy", griefing: true, keepInv: true, ...(save.settings || {}) };
  G.xp = save.xp || 0; G.effects = {};
  G.world = makeWorld(G.dim); G.gen = G.world.gen;
  G.inv = new Inventory(); G.inv.load(save.inventory);
  G.time = save.time ?? 0.02; G.tips = save.tips || {};
  const p = G.player = new Player();
  if (save.player) {
    Object.assign(p.pos, save.player.pos); p.yaw = save.player.yaw || 0; p.pitch = save.player.pitch || 0;
    p.health = save.player.health ?? 20; p.hunger = save.player.hunger ?? 20; p.spawn = save.player.spawn; p.flying = !!save.player.flying && G.creative;
  }
  if (!p.spawn) { const s = G.gen.findSpawn(); p.spawn = { x: s.x, y: null, z: s.z }; Object.assign(p.pos, { x: s.x, y: 70, z: s.z }); }
  p.air = 10; G.selected = 0; G.drops = []; G.mining = null; G.hudDirty = true;
  // build the land around the player before dropping them in
  await loadArea(p.pos.x, p.pos.z, G.dim === "nether" ? "Heating up the Ember Depths" : "Shaping hills and valleys");
  if (p.spawn.y == null) { placeSafely(p, p.spawn.x, p.spawn.z); p.spawn.y = p.pos.y; }
  else if (!save.player) placeSafely(p, p.pos.x, p.pos.z);
  else if (p.collides(G.world, p.aabb())) placeSafely(p, p.pos.x, p.pos.z);
  G.autosaveT = 0; heldId = -1;
  UI.setLoading(1, "Ready!");
  await saveNow(false);
  G.state = "pause"; UI.show("none"); UI.hud();
  document.body.classList.remove("menu-bg");
  G.resume();
  updateTips();
}
const frame = () => new Promise(r => { requestAnimationFrame(() => r()); setTimeout(r, 60); });   // keeps loading even in a background tab

// Put the player on solid ground with room to stand
function placeSafely(p, x, z) {
  const w = G.world;
  // make sure the land there exists first (it may be far from where the player was)
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) w.load(cx + dx, cz + dz);
  if (w.gen.isNether()) {   // no open sky here: look for a cave floor near the player's height
    for (let ring = 0; ring < 8; ring++) for (let dz = -ring; dz <= ring; dz++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
      const bx = Math.floor(x) + dx, bz = Math.floor(z) + dz;
      for (let k = 0; k < 50; k++) for (const y of [Math.floor(p.pos.y) - k, Math.floor(p.pos.y) + k]) {
        if (y < LAVA_LEVEL + 1 || y > HEIGHT - 4) continue;
        if (SOLID[w.id(bx, y - 1, bz)] && !SOLID[w.id(bx, y, bz)] && !SOLID[w.id(bx, y + 1, bz)] && w.id(bx, y, bz) !== B.LAVA && w.id(bx, y - 1, bz) !== B.MAGMA) { p.pos.x = bx + 0.5; p.pos.y = y; p.pos.z = bz + 0.5; p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; return; }
      }
    }
    return;
  }
  for (let ring = 0; ring < 8; ring++) for (let dz = -ring; dz <= ring; dz++) for (let dx = -ring; dx <= ring; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
    const bx = Math.floor(x) + dx, bz = Math.floor(z) + dz, y = w.surfaceY(bx, bz), top = w.id(bx, y, bz);
    if (top === B.WATER || top === B.LEAVES || top === B.BIRCH_LEAVES || top === B.LOG || top === B.BIRCH_LOG) continue;
    if (SOLID[w.id(bx, y + 1, bz)] || SOLID[w.id(bx, y + 2, bz)]) continue;
    p.pos.x = bx + 0.5; p.pos.z = bz + 0.5; p.pos.y = y + 1; p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
    return;
  }
  p.pos.y = w.surfaceY(Math.floor(x), Math.floor(z)) + 1;
}

function snapshot() {
  const p = G.player;
  G.dimData[G.dim] = dimSnapshot(G.world);
  return {
    ...G.meta, version: 2, played: Date.now(), time: G.time, day: G.meta.day || 1, tips: G.tips, mods: undefined, containers: undefined,
    player: { pos: { ...p.pos }, yaw: p.yaw, pitch: p.pitch, health: p.health, hunger: p.hunger, spawn: p.spawn, flying: p.flying, dim: G.dim },
    inventory: G.inv.toJSON(), dims: G.dimData, xp: G.xp, settings: G.wset, gen: G.meta.gen || 1
  };
}
async function saveNow(show) {
  if (!G.world || !G.meta) return;
  const snap = snapshot();
  G.meta.played = snap.played;
  try {
    const ok = await Saves.save(snap);
    if (show) { UI.saved(); if (!ok) UI.toast("Saved for now. Use Download world to keep it after you close the page.", "bad"); }
  } catch (e) { UI.toast("Couldn't save: " + e.message, "bad"); }
}

// ---------- pause / resume / pointer lock ----------
function requestLock() {
  wantLock = true;
  try {
    const r = canvas.requestPointerLock();
    if (r && r.catch) r.catch(() => { if (G.state === "play") showClickToPlay(); });
  } catch (e) { showClickToPlay(); }
}
function showClickToPlay() { document.getElementById("clickToPlay").hidden = false; }
document.addEventListener("pointerlockchange", () => {
  locked = document.pointerLockElement === canvas;
  keys.clear(); mouseL = mouseR = false;
  if (locked) { document.getElementById("clickToPlay").hidden = true; return; }
  if (G.state === "play") pause();   // Esc or the browser took the mouse back
});
document.addEventListener("pointerlockerror", () => { if (G.state === "play") showClickToPlay(); });
function pause() {
  if (G.state !== "play" && G.state !== "panel") return;
  if (G.state === "panel") { UI.closePanel(); G.panelKind = null; }
  G.state = "pause"; G.pausedAt = performance.now(); keys.clear(); mouseL = mouseR = false; G.mining = null;
  UI.show("pause"); Sound.pause();
  if (document.pointerLockElement) document.exitPointerLock();
  saveNow(false);
}
G.resume = () => {
  Sound.start();
  G.state = "play"; UI.show("none"); G.hudDirty = true;
  requestLock();
};
G.pause = pause;
G.saveNow = saveNow;

function openPanel(kind, ctx) {
  G.state = "panel"; keys.clear(); mouseL = mouseR = false; G.mining = null;
  if (document.pointerLockElement) document.exitPointerLock();
  G.panelKind = kind;
  UI.openPanel(kind, ctx);
  if (kind === "table") tipDone("table");
  if (kind === "inventory" && G.creative) tipDone("craft");
}
function closePanel() {
  UI.closePanel(); G.panelKind = null;
  G.state = "play"; UI.show("none");
  requestLock();
}

// ---------- input ----------
window.addEventListener("keydown", e => {
  if (G.state === "panel") {
    if (e.code === "KeyE" || e.code === "Escape") { if (document.activeElement && document.activeElement.tagName === "INPUT" && e.code === "KeyE") return; e.preventDefault(); closePanel(); return; }
    if (/^Digit[1-9]$/.test(e.code) && !(document.activeElement && document.activeElement.tagName === "INPUT")) { if (UI.hotkey(+e.code.slice(5) - 1)) e.preventDefault(); }
    return;
  }
  if (G.state === "pause" && e.code === "Escape" && UI.current === "pause" && performance.now() - (G.pausedAt || 0) > 400) { e.preventDefault(); G.resume(); return; }
  if (G.state === "pause" && e.code === "Escape" && (UI.current === "settings" || UI.current === "controls")) { UI.show("pause"); return; }
  if (G.state !== "play") return;
  if (["Space", "Tab", "F3"].includes(e.code) || e.code.startsWith("Arrow")) e.preventDefault();
  if (e.repeat) { keys.add(e.code); return; }
  keys.add(e.code);
  if (!locked) return;
  if (/^Digit[1-9]$/.test(e.code)) selectSlot(+e.code.slice(5) - 1);
  else if (e.code === "KeyE") openPanel("inventory");
  else if (e.code === "KeyQ") dropSelected(e.ctrlKey);
  else if (e.code === "F3") { G.debug = !G.debug; document.getElementById("debug").hidden = !G.debug; }
  else if (e.code === "Space" && !G.player.onGround && !G.player.inWater && !G.player.flying && !G.player.gliding && G.player.vel.y < -1 && G.inv.slots[37] && G.inv.slots[37].id === I.GLIDER) {
    G.player.gliding = true;
    if (!G.tips.glide) { G.tips.glide = true; UI.toast("Gliding! Look down to speed up and up to slow down. Land gently!", "good"); }
  }
  else if (e.code === "Space" && G.creative) {
    const now = performance.now();
    if (now - G.lastSpace < 300) { G.player.flying = !G.player.flying; G.player.vel.y = 0; UI.toast(G.player.flying ? "Flying! Space to rise, C to go down" : "Stopped flying"); G.hudDirty = true; G.lastSpace = 0; }
    else G.lastSpace = now;
  }
});
window.addEventListener("keyup", e => keys.delete(e.code));
window.addEventListener("blur", () => { keys.clear(); mouseL = mouseR = false; if (G.state === "play") pause(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) { keys.clear(); if (G.state === "play" || G.state === "panel") pause(); else Sound.pause(); } });
canvas.addEventListener("mousedown", e => {
  if (G.state !== "play") return;
  if (!locked) { requestLock(); return; }
  if (e.button === 0) { mouseL = true; G.mining = null; if (!attack() && G.creative) creativeBreak(); }
  if (e.button === 2) {
    mouseR = true;
    const s = G.inv.slots[G.selected];
    if (s && s.id === I.BOW && !entityTarget()) { if (G.creative || G.inv.count(I.ARROW) > 0) G.bowT = 0; else { UI.toast("You need arrows to shoot. Make them from flint, a stick, and a feather.", "bad"); Sound.error(); } }
    else { useItem(); G.useCooldown = 0.28; }
  }
});
window.addEventListener("mouseup", e => {
  if (e.button === 0) { mouseL = false; G.mining = null; }
  if (e.button === 2) { mouseR = false; if (G.bowT >= 0) releaseBow(); }
});
canvas.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("mousemove", e => {
  if (!locked || G.state !== "play") return;
  if (Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;   // ignore the jump some browsers send when the lock starts
  const s = 0.0022 * G.settings.sensitivity, p = G.player;
  p.yaw -= e.movementX * s; p.pitch = Math.max(-1.55, Math.min(1.55, p.pitch - e.movementY * s));
});
window.addEventListener("wheel", e => { if (G.state === "play" && locked) { selectSlot((G.selected + (e.deltaY > 0 ? 1 : 8)) % 9); } }, { passive: true });
function selectSlot(i) {
  if (i === G.selected) return;
  G.selected = i; G.mining = null; G.hudDirty = true;
  const s = G.inv.slots[i]; if (s) UI.itemName(itemDef(s.id).name);
}

// ---------- mining ----------
const MATERIAL = id => {
  const d = BLOCKS[id];
  if (!d) return "stone";
  if ([B.GLASS].includes(id)) return "glass";
  if ([B.LEAVES, B.BIRCH_LEAVES, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW].includes(id)) return "leaf";
  if ([B.SAND, B.GRAVEL, B.SNOW].includes(id)) return "sand";
  if (d.tool === "axe") return "wood";
  if (d.tool === "shovel" || id === B.CLAY) return "soft";
  return "stone";
};
function heldTool() { const s = G.inv.slots[G.selected]; return s && itemDef(s.id).tool ? { stack: s, ...itemDef(s.id).tool } : null; }
// seconds to break a block, and whether it will drop anything
function mineInfo(v) {
  const d = blockDef(v), tool = heldTool();
  if (d.hardness === Infinity) return { time: Infinity, drops: false };
  if (d.hardness === 0) return { time: 0.05, drops: true };
  const right = tool && tool.type === d.tool, tierOK = !d.tier || (right && tool.tier >= d.tier);
  let time = d.hardness * 1.5;
  if (right) time /= tool.speed;
  if (!tierOK) time = d.hardness * 5;
  if (d.render === "cutout" && id_isLeaves(d.id) && tool && tool.type === "sword") time *= 0.3;
  return { time: Math.max(0.05, time), drops: tierOK };
}
const id_isLeaves = id => id === B.LEAVES || id === B.BIRCH_LEAVES;
const TIER_NAME = ["", "wooden", "stone", "iron"];

function updateMining(dt, hit) {
  if (!mouseL || G.creative || !hit) { G.mining = null; crack.visible = false; return; }
  const key = hit.x + "," + hit.y + "," + hit.z;
  if (!G.mining || G.mining.key !== key) {
    const info = mineInfo(hit.v);
    G.mining = { key, prog: 0, info, sound: 0, warned: false };
    if (!info.drops && info.time !== Infinity) {
      const d = blockDef(hit.v);
      UI.toast(`You need a ${TIER_NAME[d.tier]} ${d.tool === "pick" ? "pickaxe" : d.tool} or better to collect ${d.name}.`, "bad");
    }
    if (info.time === Infinity) UI.toast("Deepstone can't be broken.", "bad");
  }
  const m = G.mining;
  if (m.info.time === Infinity) return;
  m.prog += dt / m.info.time; m.sound -= dt; G.swing = Math.max(G.swing, 0.01);
  if (m.sound <= 0) { Sound.dig(MATERIAL(idOf(hit.v))); m.sound = 0.25; burst(hit.x, hit.y, hit.z, hit.v, 3); }
  const stage = Math.min(7, Math.floor(m.prog * 8));
  crack.visible = true; crack.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
  if (crack.userData.stage !== stage) { setBoxUV(crackGeo, () => TILE["crack" + stage]); crack.userData.stage = stage; }
  if (m.prog >= 1) {
    breakBlock(hit.x, hit.y, hit.z, m.info.drops);
    const t = heldTool();
    if (t && blockDef(hit.v).hardness > 0) wearTool(t.stack, 1);
    G.mining = null; crack.visible = false;
  }
}
function creativeBreak() {
  const hit = target();
  if (hit) { breakBlock(hit.x, hit.y, hit.z, false); G.useCooldown = 0.2; G.swing = 0.01; }
}
function wearTool(stack, n) {
  if (G.creative || stack.dur === undefined) return;
  stack.dur -= n;
  if (stack.dur <= 0) {
    const i = G.inv.slots.indexOf(stack); if (i >= 0) G.inv.slots[i] = null;
    Sound.breakBlock("wood"); UI.toast(`Your ${itemDef(stack.id).name} broke!`, "bad");
  }
  G.hudDirty = true;
}
const water = (x, y, z) => G.world.id(x, y, z) === B.WATER;
function breakBlock(x, y, z, drops, quiet) {
  const w = G.world, v = w.get(x, y, z), id = idOf(v), d = blockDef(v);
  if (!id || id === B.WATER || id === B.LAVA) return;
  w.crops.delete(x + "," + y + "," + z);
  if (id === B.OBSIDIAN || id === B.PORTAL) setTimeout(() => breakPortal(x, y, z), 0);
  if (id === B.DOOR) {   // doors are two blocks tall: remove both halves
    if (metaOf(v) & TOP) y -= 1;
    w.set(x, y, z, B.AIR);
    if (w.id(x, y + 1, z) === B.DOOR) w.set(x, y + 1, z, B.AIR);
  } else if (id === B.BED) {   // beds are two blocks long
    const [dx, dz] = DIR[metaOf(v) & 3], s = metaOf(v) & HEAD ? -1 : 1;
    w.set(x, y, z, B.AIR);
    if (w.id(x + dx * s, y, z + dz * s) === B.BED) w.set(x + dx * s, y, z + dz * s, B.AIR);
    if (metaOf(v) & HEAD) drops = drops && true; else drops = drops && true;
  } else {
    // simple water rule: a hole next to water fills with water
    const wet = water(x, y + 1, z) || water(x + 1, y, z) || water(x - 1, y, z) || water(x, y, z + 1) || water(x, y, z - 1);
    w.set(x, y, z, wet ? B.WATER : B.AIR);
  }
  if (!quiet) { Sound.breakBlock(MATERIAL(id)); burst(x, y, z, v, 16); }
  if (!G.creative && drops) {
    let drop = d.drops;
    const r = Math.random();
    if (drop === "leaves") drop = r < 0.06 ? B.SAPLING : r < 0.13 && id === B.LEAVES ? I.APPLE : 0;
    if (heldTool() && heldTool().type === "shears" && (id === B.LEAVES || id === B.BIRCH_LEAVES)) drop = id;
    if (id === B.TALL_GRASS) drop = r < 0.12 ? I.SEEDS : r < 0.14 ? I.CARROT : 0;
    if (id === B.GRAVEL && r < 0.1) drop = I.FLINT;
    if (drop === "shine") drop = [I.SHINE_DUST, 2 + Math.floor(Math.random() * 3)];
    if (drop === "goldnuggets") drop = [I.GOLD_NUGGET, 2 + Math.floor(Math.random() * 4)];
    if (drop === "wart") drop = [I.WART, (metaOf(v) & 7) >= 7 ? 2 + Math.floor(Math.random() * 3) : 1];
    if (drop === "chorus") drop = Math.random() < 0.6 ? I.CHORUS_FRUIT : 0;
    if (drop === "crop") {
      const ripe = (metaOf(v) & 7) >= 7;
      if (id === B.WHEAT) { if (ripe) spawnDrop(I.WHEAT, 1, x + 0.5, y + 0.5, z + 0.5); drop = [I.SEEDS, ripe ? 1 + Math.floor(Math.random() * 3) : 1]; }
      else drop = [I.CARROT, ripe ? 2 + Math.floor(Math.random() * 3) : 1];
    }
    if (Array.isArray(drop)) spawnDrop(drop[0], drop[1], x + 0.5, y + 0.5, z + 0.5);
    else if (drop) spawnDrop(drop, 1, x + 0.5, y + 0.5, z + 0.5);
  }
  // spill container contents (a Shell Box keeps them inside and drops as one item)
  const key = x + "," + y + "," + z, box = w.containers.get(key);
  if (id === B.SHELL_BOX) { spawnDrop(B.SHELL_BOX, 1, x + 0.5, y + 0.5, z + 0.5, { id: B.SHELL_BOX, n: 1, contents: box ? box.slots.map(s => s && { ...s }) : null }); w.containers.delete(key); }
  else if (box) { for (const s of box.slots) if (s) spawnDrop(s.id, s.n, x + 0.5, y + 0.5, z + 0.5, s); w.containers.delete(key); }
  // things resting on top fall off
  const above = w.get(x, y + 1, z), aid = idOf(above);
  if ([B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.TORCH, B.WHEAT, B.CARROTS, B.SAPLING, B.EMBER_WART].includes(aid) || (aid === B.DOOR && !(metaOf(above) & TOP))) breakBlock(x, y + 1, z, true, quiet);
  if (aid === B.FIRE) w.set(x, y + 1, z, B.AIR);
  if (aid === B.WHEAT || aid === B.CARROTS) { /* crops pop off with their seeds */ }
  if (id === B.LOG || id === B.BIRCH_LOG) tipDone("chop");
  G.hudDirty = true;
}

// ---------- fighting ----------
function entityTarget() {
  const p = G.player, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, dir = lookDir();
  const eh = ents.raycast(eye, dir, G.creative ? 5 : 3.5);
  if (!eh) return null;
  const bh = target();
  if (bh && bh.dist < eh.dist) return null;   // a block is in the way
  return eh.ent;
}
// Hit whatever creature is in front of you. Returns true if something was hit.
function attack() {
  { const p = G.player; if (ents.deflect({ x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, lookDir(), 4)) { G.swing = 0.01; return true; } }
  const e = entityTarget();
  if (!e) return false;
  if (G.attackCd > 0) return true;
  const s = G.inv.slots[G.selected], d = s ? itemDef(s.id) : null;
  let dmg = d && d.tool ? d.tool.damage : 1;
  const p = G.player, crit = !p.onGround && p.vel.y < 0 && !p.inWater;
  if (crit) dmg *= 1.5;
  const dir = lookDir(), l = Math.hypot(dir.x, dir.z) || 1, sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  if (ents.damage(e, dmg, "player", { x: dir.x / l * (sprint ? 1.4 : 1), z: dir.z / l * (sprint ? 1.4 : 1) })) {
    if (crit) puff(e.pos.x, e.pos.y + e.h, e.pos.z, "poof");
    if (s && d.tool) wearTool(s, d.tool.type === "sword" ? 1 : 2);
  }
  G.attackCd = d && d.tool && d.tool.type === "sword" ? 0.45 : 0.6; G.swing = 0.01;
  return true;
}
function releaseBow() {
  const charge = Math.min(1, G.bowT), s = G.inv.slots[G.selected];
  G.bowT = -1;
  if (charge < 0.15 || !s || s.id !== I.BOW) return;
  if (!G.creative) { if (!G.inv.remove(I.ARROW, 1)) return; wearTool(s, 1); }
  const p = G.player, dir = lookDir(), speed = 8 + 26 * charge;
  ents.addProjectile("arrow", p.pos.x + dir.x * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.5, dir.x * speed, dir.y * speed, dir.z * speed, { fromPlayer: true, dmg: 1 + 7 * charge });
  Sound.mob("bow", 0); G.hudDirty = true; G.swing = 0.01;
}
function throwItem(kind) {
  const p = G.player, dir = lookDir();
  ents.addProjectile(kind, p.pos.x + dir.x * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.5, dir.x * 18, dir.y * 18 + 2, dir.z * 18, { fromPlayer: true });
  const s = G.inv.slots[G.selected]; if (s && !G.creative) { s.n--; if (!s.n) G.inv.slots[G.selected] = null; }
  G.swing = 0.01; G.hudDirty = true; heldId = -1;
}

// ---------- placing and using ----------
function target() {
  const p = G.player, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z };
  const dir = lookDir();
  return raycast(G.world, eye, dir, G.creative ? REACH + 1.5 : REACH);
}
function lookDir() { const p = G.player, cp = Math.cos(p.pitch); return { x: -Math.sin(p.yaw) * cp, y: Math.sin(p.pitch), z: -Math.cos(p.yaw) * cp }; }
function facingFromYaw() { const a = ((G.player.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return [0, 1, 2, 3][Math.round(a / (Math.PI / 2)) % 4]; }

function useItem() {
  const hit = target(), w = G.world, slot = G.inv.slots[G.selected], crouch = keys.has("KeyC"), sd = slot ? itemDef(slot.id) : null;
  // creatures first
  const ent = entityTarget();
  if (ent) { if (ents.interact(ent, slot)) { G.swing = 0.01; G.hudDirty = true; heldId = -1; } return; }
  if (hit && !crouch) {
    const id = idOf(hit.v), d = BLOCKS[id];
    if (d.interact && d.interact !== "tnt") { G.swing = 0.01; interact(hit, d.interact); return; }
  }
  if (sd && sd.kind === "spawn" && hit) {
    const x = hit.x + hit.nx + 0.5, y = hit.y + hit.ny, z = hit.z + hit.nz + 0.5;
    const sp = sd.species === "villager" ? ["farmer", "fletcher", "shepherd", "cleric", "smith"][Math.floor(Math.random() * 5)] : sd.species;
    ents.add(sp, x, y, z, sp === "blightking" ? { summonT: 10 } : sp === "golem" ? { home: [x, y, z] } : {}); puff(x, y + 0.5, z, "poof");
    if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
    G.hudDirty = true; return;
  }
  if (sd && sd.kind === "armor") {   // put it on
    const at = 36 + sd.armor.slot, old = G.inv.slots[at];
    G.inv.slots[at] = slot; G.inv.slots[G.selected] = old;
    Sound.place("soft"); UI.toast(`Wearing ${sd.name}`); G.hudDirty = true; heldId = -1; return;
  }
  if (slot && slot.id === I.VOID_PEARL) { throwItem("pearl"); return; }
  if (slot && slot.id === I.EYE) { throwEye(); return; }
  if (slot && slot.id === I.EGG) { throwItem("egg"); return; }
  if (sd && (sd.food !== undefined) && sd.kind === "food") {
    if (G.creative) return;
    if (G.player.hunger >= 20 && sd.food > 0) { UI.toast("You're not hungry right now."); return; }
    G.player.hunger = Math.min(20, G.player.hunger + sd.food); G.player.exhaust = 0;
    if (sd.sideEffect === "poison" || (sd.raw && slot.id === I.RAW_CHICKEN && Math.random() < 0.3)) { addEffect("poison", 4); UI.toast("That made you feel sick!", "bad"); }
    if (sd.sideEffect === "queasy" && Math.random() < 0.8) { addEffect("queasy", 30); UI.toast("Yuck! You feel queasy (you'll get hungry faster for a bit).", "bad"); }
    if (sd.sideEffect === "cure") { G.effects = {}; UI.toast("Milk cleared your effects.", "good"); }
    if (sd.sideEffect === "blink") chorusBlink();
    slot.n--; if (!slot.n) G.inv.slots[G.selected] = null;
    if (sd.sideEffect === "cure") swapHeld(I.BUCKET);
    Sound.eat(); G.swing = 0.01; G.hudDirty = true; heldId = -1; return;
  }
  if (slot && [I.BUCKET, I.WATER_BUCKET, I.LAVA_BUCKET].includes(slot.id)) { useBucket(slot); return; }
  if (!hit || !slot) return;
  const hitId = idOf(hit.v);
  // hoe: turn grass or dirt into farmland
  if (sd.tool && sd.tool.type === "hoe") {
    if ((hitId === B.GRASS || hitId === B.DIRT) && hit.ny === 1 && !SOLID[w.id(hit.x, hit.y + 1, hit.z)]) {
      if (w.id(hit.x, hit.y + 1, hit.z)) breakBlock(hit.x, hit.y + 1, hit.z, true);
      w.set(hit.x, hit.y, hit.z, make(B.FARMLAND, hydrate(hit.x, hit.y, hit.z) ? WET : 0)); Sound.place("soft"); wearTool(slot, 1); G.swing = 0.01;
    }
    return;
  }
  // seeds and carrots: plant on farmland
  if (sd.plants) {
    if (hitId === B.FARMLAND && hit.ny === 1 && !w.id(hit.x, hit.y + 1, hit.z)) {
      w.set(hit.x, hit.y + 1, hit.z, make(sd.plants, 0)); w.crops.add(hit.x + "," + (hit.y + 1) + "," + hit.z);
      if (hydrate(hit.x, hit.y, hit.z)) w.set(hit.x, hit.y, hit.z, make(B.FARMLAND, WET));
      if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
      Sound.place("leaf"); G.hudDirty = true; heldId = -1; return;
    }
    if (sd.kind !== "food") { UI.toast("Plant seeds on farmland. Use a hoe on grass or dirt first.", "bad"); return; }
  }
  if (slot.id === I.BONE_MEAL) { useBoneMeal(hit, slot); return; }
  if (slot.id === I.FLINT_STEEL) {
    if (hitId === B.TNT) { w.set(hit.x, hit.y, hit.z, B.AIR); primeTNT(hit.x, hit.y, hit.z); wearTool(slot, 1); return; }
    const ax = hit.x + hit.nx, ay = hit.y + hit.ny, az = hit.z + hit.nz;
    if (hitId === B.OBSIDIAN && !w.id(ax, ay, az) && lightPortal(ax, ay, az)) { wearTool(slot, 1); return; }
    if (ignite(ax, ay, az)) { wearTool(slot, 1); Sound.mob("fireshoot", 0); }
    return;
  }
  if (slot.id === B.BED) { placeBed(hit, slot); return; }
  if (sd.places) {   // items that can be set down as a block (Blight Skulls)
    const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
    if (w.id(x, y, z) && !BLOCKS[w.id(x, y, z)].replaceable) return;
    if (!SOLID[w.id(x, y - 1, z)]) { UI.toast("Set it on top of a block.", "bad"); return; }
    w.set(x, y, z, sd.places);
    if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
    Sound.place("stone"); G.hudDirty = true; heldId = -1;
    if (sd.places === B.SKULL) checkBlightSummon(x, y, z);
    return;
  }
  if (!isBlockItem(slot.id)) return;
  let x = hit.x, y = hit.y, z = hit.z;
  const hitDef = blockDef(hit.v);
  if (!hitDef.replaceable) { x += hit.nx; y += hit.ny; z += hit.nz; }
  if (y < 1 || y >= HEIGHT - 1) return;
  const here = w.id(x, y, z);
  if (here && here !== B.WATER && !BLOCKS[here].replaceable) return;
  const id = slot.id, d = BLOCKS[id];
  let v = make(id);
  if (d.front) v = make(id, (facingFromYaw() + 2) % 4);   // furnaces and chests face you
  if (d.shape === "cross" && ![B.GRASS, B.DIRT, B.FARMLAND].includes(w.id(x, y - 1, z))) { UI.toast(`${d.name} needs grass or dirt underneath.`, "bad"); Sound.error(); return; }
  if (id === B.SAPLING) w.crops.add(x + "," + y + "," + z);
  if (id === B.WATER && G.world.gen.isNether()) { puff(x + 0.5, y + 0.5, z + 0.5, "poof"); Sound.mob("hiss", 2); UI.toast("Water boils away instantly in the Ember Depths!", "bad"); return; }
  if (id === B.LAVA || id === B.WATER) { placeLiquid(id, x, y, z); if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; } G.hudDirty = true; return; }
  if (id === B.TORCH && !OPAQUE[idOf(hit.v)]) { Sound.error(); return; }
  if (id === B.DOOR) {
    if (!SOLID[w.id(x, y - 1, z)] || (w.id(x, y + 1, z) && !BLOCKS[w.id(x, y + 1, z)].replaceable)) { UI.toast("A door needs two empty blocks of space on solid ground.", "bad"); Sound.error(); return; }
    const f = (facingFromYaw() + 2) % 4;
    v = make(B.DOOR, f);
    if (blocksPlayer(v, x, y, z) || blocksPlayer(make(B.DOOR, f | TOP), x, y + 1, z)) return;
    w.set(x, y, z, v); w.set(x, y + 1, z, make(B.DOOR, f | TOP));
  } else {
    if (blocksPlayer(v, x, y, z)) return;
    w.set(x, y, z, v);
    if (id === B.SHELL_BOX) w.containers.set(x + "," + y + "," + z, { type: "chest", slots: slot.contents ? slot.contents.map(s => s && { ...s }) : new Array(27).fill(null) });
    if (id === B.BEACON) { w.beacons.add(x + "," + y + "," + z); UI.toast("The Beacon glows! Within 24 blocks you'll heal over time and move faster.", "good"); }
  }
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
  Sound.place(MATERIAL(id)); G.swing = 0.01; G.hudDirty = true; heldId = G.inv.slots[G.selected] ? heldId : -1;
  tipDone("place");
}
// Water next to lava turns the lava into obsidian
function placeLiquid(id, x, y, z) {
  const w = G.world;
  w.set(x, y, z, id);
  const other = id === B.WATER ? B.LAVA : B.WATER;
  let made = false;
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) {
    if (w.id(x + dx, y + dy, z + dz) !== other) continue;
    if (id === B.WATER) w.set(x + dx, y + dy, z + dz, B.OBSIDIAN); else w.set(x, y, z, B.OBSIDIAN);
    made = true;
  }
  if (made) { Sound.mob("hiss", 3); puff(x + 0.5, y + 1, z + 0.5, "poof"); UI.toast("Water and lava made Obsidian!", "good"); }
}
function useBucket(slot) {
  const p = G.player, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z };
  const hit = raycast(G.world, eye, lookDir(), REACH, false), w = G.world;
  if (!hit) return;
  if (slot.id === I.BUCKET) {
    const id = idOf(hit.v);
    if (id === B.WATER || id === B.LAVA) { w.set(hit.x, hit.y, hit.z, B.AIR); swapHeld(id === B.WATER ? I.WATER_BUCKET : I.LAVA_BUCKET); Sound.splash(); }
    return;
  }
  const liquid = slot.id === I.WATER_BUCKET ? B.WATER : B.LAVA;
  if (liquid === B.WATER && G.world.gen.isNether()) { puff(hit.x + 0.5, hit.y + 1.5, hit.z + 0.5, "poof"); Sound.mob("hiss", 2); UI.toast("Water boils away instantly in the Ember Depths!", "bad"); if (!G.creative) { G.inv.slots[G.selected] = newStack(I.BUCKET, 1); heldId = -1; } G.hudDirty = true; return; }
  let x = hit.x, y = hit.y, z = hit.z;
  if (!blockDef(hit.v).replaceable && idOf(hit.v) !== B.WATER) { x += hit.nx; y += hit.ny; z += hit.nz; }
  const here = w.id(x, y, z);
  if (here && here !== B.WATER && !BLOCKS[here].replaceable) return;
  placeLiquid(liquid, x, y, z);
  if (!G.creative) { G.inv.slots[G.selected] = newStack(I.BUCKET, 1); heldId = -1; }
  Sound.splash(); G.hudDirty = true;
}
function useBoneMeal(hit, slot) {
  const w = G.world, id = idOf(hit.v);
  let used = false;
  if (id === B.WHEAT || id === B.CARROTS) { const st = metaOf(hit.v) & 7; if (st < 7) { w.set(hit.x, hit.y, hit.z, make(id, Math.min(7, st + 2 + Math.floor(Math.random() * 3)))); used = true; } }
  else if (id === B.SAPLING) { used = true; if (Math.random() < 0.45) growTree(hit.x, hit.y, hit.z, metaOf(hit.v) & 1); }
  else if (id === B.GRASS && hit.ny === 1) {
    used = true;
    for (let i = 0; i < 12; i++) { const x = hit.x + Math.floor(Math.random() * 7) - 3, z = hit.z + Math.floor(Math.random() * 7) - 3; if (w.id(x, hit.y, z) === B.GRASS && !w.id(x, hit.y + 1, z)) w.set(x, hit.y + 1, z, Math.random() < 0.8 ? B.TALL_GRASS : Math.random() < 0.5 ? B.FLOWER_RED : B.FLOWER_YELLOW); }
  }
  if (!used) return;
  puff(hit.x + 0.5, hit.y + 1, hit.z + 0.5, "xp");
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
  G.hudDirty = true; heldId = -1;
}
const DIR = [[0, 1], [1, 0], [0, -1], [-1, 0]];   // facing 0..3 → (dx, dz)
function placeBed(hit, slot) {
  const w = G.world, x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
  const f = (facingFromYaw() + 2) % 4, [hx, hz] = DIR[(f + 2) % 4];   // head points away from you
  const ok = (bx, bz) => (!w.id(bx, y, bz) || BLOCKS[w.id(bx, y, bz)].replaceable) && SOLID[w.id(bx, y - 1, bz)];
  if (!ok(x, z) || !ok(x + hx, z + hz)) { UI.toast("A bed needs two empty blocks side by side on solid ground.", "bad"); Sound.error(); return; }
  const fv = make(B.BED, (f + 2) % 4), hv = make(B.BED, ((f + 2) % 4) | HEAD);
  if (blocksPlayer(fv, x, y, z) || blocksPlayer(hv, x + hx, y, z + hz)) return;
  w.set(x, y, z, fv); w.set(x + hx, y, z + hz, hv);
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
  Sound.place("soft"); G.hudDirty = true; heldId = -1;
}
function useBed(hit) {
  if (G.world.gen.isNether()) { breakBlock(hit.x, hit.y, hit.z, false); explode(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 3, null); UI.toast("Beds explode in the Ember Depths! Only sleep on the Surface.", "bad"); return; }
  const meta = metaOf(hit.v), [dx, dz] = DIR[meta & 3];
  const head = meta & HEAD ? { x: hit.x, z: hit.z } : { x: hit.x + dx, z: hit.z + dz };
  G.player.spawn = { x: head.x + 0.5, y: hit.y + 1, z: head.z + 0.5, bed: [hit.x, hit.y, hit.z] };
  const night = G.time > 0.53 && G.time < 0.97;
  if (!night) { UI.toast("Respawn point set. You can only sleep at night."); return; }
  if (G.creative === false && ents.near(G.player.pos.x, G.player.pos.y, G.player.pos.z, 10, e => e.def.hostile).length) { UI.toast("You can't rest now. There are monsters nearby!", "bad"); return; }
  const shade = document.getElementById("flash");
  shade.style.background = "#000"; shade.classList.add("on");
  setTimeout(() => { G.time = 0.01; G.meta.day = (G.meta.day || 1) + 1; shade.classList.remove("on"); setTimeout(() => shade.style.background = "", 400); UI.toast("Good morning! Respawn point set.", "good"); }, 1200);
}
function blocksPlayer(v, x, y, z) {
  const boxes = []; blockBoxes(v, x, y, z, boxes);
  const a = G.player.aabb();
  return boxes.some(b => a[0] < b[3] && a[3] > b[0] && a[1] < b[4] && a[4] > b[1] && a[2] < b[5] && a[5] > b[2]);
}
function interact(hit, kind) {
  const w = G.world, key = hit.x + "," + hit.y + "," + hit.z;
  if (kind === "door") {
    const meta = metaOf(hit.v), by = meta & TOP ? hit.y - 1 : hit.y;
    const open = !(meta & OPEN);
    for (const yy of [by, by + 1]) { const v = w.get(hit.x, yy, hit.z); if (idOf(v) === B.DOOR) { const m = metaOf(v); w.set(hit.x, yy, hit.z, make(B.DOOR, open ? m | OPEN : m & ~OPEN)); } }
    // don't let a closing door trap the player inside it
    Sound.door(open); return;
  }
  if (kind === "table") { openPanel("table"); return; }
  if (kind === "bed") { useBed(hit); return; }
  if (kind === "frame") { fillFrame(hit); return; }
  if (kind === "beacon") { UI.toast("This Beacon gives Regeneration and Swiftness to anyone within 24 blocks."); return; }
  if (kind === "shellbox") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "chest", slots: new Array(27).fill(null) });
    Sound.door(true); openPanel("chest", key); return;
  }
  if (kind === "chest") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "chest", slots: new Array(27).fill(null) });
    if (metaOf(hit.v) & LOOT) { fillLoot(w.containers.get(key), hit); w.set(hit.x, hit.y, hit.z, make(B.CHEST, metaOf(hit.v) & 3)); }
    Sound.door(true); openPanel("chest", key); return;
  }
  if (kind === "furnace") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "furnace", slots: [null, null, null], burn: 0, burnMax: 0, prog: 0 });
    openPanel("furnace", key);
  }
}
function fillLoot(box, hit) {
  const r = rng(hashSeed(G.meta.seed) ^ (hit.x * 73856093) ^ (hit.z * 19349663));
  const put = (id, n) => { const i = box.slots.findIndex(s => !s); if (i >= 0 && n > 0) box.slots[i] = newStack(id, n); };
  if (G.dim === "end") {   // Hollow tower treasure: the top chest always holds Glider Wings
    if ((metaOf(hit.v) & 3) === 1) put(I.GLIDER, 1);
    put(I.IRON_INGOT, 3 + Math.floor(r() * 6)); put(I.GOLD_INGOT, 2 + Math.floor(r() * 5)); put(I.VOID_PEARL, 1 + Math.floor(r() * 3));
    if (r() < 0.5) put(I.SKYSHARD, 1 + Math.floor(r() * 3));
    if (r() < 0.3) put(I.SKY_CHEST, 1);
    if (r() < 0.3) put(I.DUSK_SCRAP, 1);
    for (let i = box.slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [box.slots[i], box.slots[j]] = [box.slots[j], box.slots[i]]; }
    UI.toast("You found a Hollow treasure chest!", "good"); return;
  }
  if (G.world.gen.isNether()) {   // fortress and bastion treasure
    put(I.GOLD_INGOT, 2 + Math.floor(r() * 5)); put(I.GOLD_NUGGET, 4 + Math.floor(r() * 10));
    if (r() < 0.6) put(B.OBSIDIAN, 2 + Math.floor(r() * 5));
    if (r() < 0.5) put(I.IRON_INGOT, 2 + Math.floor(r() * 4));
    if (r() < 0.4) put(I.WART, 3 + Math.floor(r() * 5));
    if (r() < 0.3) put(I.GOLD_CHEST, 1);
    if (r() < 0.25) put(I.SKYSHARD, 1 + Math.floor(r() * 2));
    if (r() < 0.12) put(I.DUSK_SCRAP, 1);
    for (let i = box.slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [box.slots[i], box.slots[j]] = [box.slots[j], box.slots[i]]; }
    UI.toast("You found a treasure chest!", "good"); return;
  }
  put(I.COAL, 3 + Math.floor(r() * 6)); put(I.APPLE, 1 + Math.floor(r() * 3)); put(B.TORCH, 4 + Math.floor(r() * 6));
  if (r() < 0.55) put(B.OBSIDIAN, 1 + Math.floor(r() * 4));
  if (r() < 0.35) put(I.FLINT_STEEL, 1);
  if (r() < 0.45) put(I.GOLD_NUGGET, 3 + Math.floor(r() * 9));
  if (r() < 0.3) put(I.VOID_PEARL, 1 + Math.floor(r() * 2));
  if (r() < 0.4) put(I.JADE, 1 + Math.floor(r() * 4));
  if (r() < 0.7) put(I.IRON_INGOT, 2 + Math.floor(r() * 4));
  if (r() < 0.35) put(I.SKYSHARD, 1 + Math.floor(r() * 2));
  if (r() < 0.5) put(I.STONE_PICK, 1);
  if (r() < 0.4) put(I.BRICK, 4 + Math.floor(r() * 8));
  // shuffle so it looks like a real stash
  for (let i = box.slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [box.slots[i], box.slots[j]] = [box.slots[j], box.slots[i]]; }
  UI.toast("You found a treasure chest!", "good");
}

// ---------- dropped items ----------
function spawnDrop(id, n, x, y, z, stack = null, vel = null) {
  if (!id || n <= 0) return;
  if (G.drops.length >= 90) removeDrop(G.drops.shift());
  const mesh = itemMesh(id, 0.25);
  mesh.position.set(x, y, z); scene.add(mesh);
  G.drops.push({ id, n, stack: stack && itemDef(id).stack === 1 ? { ...stack } : null, x, y, z, vx: vel ? vel.x : (Math.random() - 0.5) * 2, vy: vel ? vel.y : 3, vz: vel ? vel.z : (Math.random() - 0.5) * 2, age: 0, pickDelay: vel ? 1.2 : 0.3, mesh });
}
function removeDrop(d) { scene.remove(d.mesh); if (d.mesh.geometry.type === "PlaneGeometry") d.mesh.geometry.dispose(); d.mesh.material.dispose(); }
G.dropItem = (id, n, stack) => { const p = G.player; spawnDrop(id, n, p.pos.x, p.pos.y + 1.2, p.pos.z, stack); };
function dropSelected(all) {
  const s = G.inv.slots[G.selected];
  if (!s) return;
  const n = all ? s.n : 1, dir = lookDir(), p = G.player;
  spawnDrop(s.id, n, p.pos.x + dir.x * 0.4, p.pos.y + p.eye - 0.3, p.pos.z + dir.z * 0.4, s, { x: dir.x * 5, y: dir.y * 5 + 2, z: dir.z * 5 });
  s.n -= n; if (s.n <= 0) G.inv.slots[G.selected] = null;
  G.hudDirty = true;
}
function updateDrops(dt, bright) {
  const p = G.player, w = G.world;
  for (let i = G.drops.length - 1; i >= 0; i--) {
    const d = G.drops[i];
    d.age += dt; d.pickDelay -= dt;
    d.vy -= 18 * dt; d.vx *= 0.94; d.vz *= 0.94;
    const nx = d.x + d.vx * dt, nz = d.z + d.vz * dt;
    if (!SOLID[w.id(Math.floor(nx), Math.floor(d.y), Math.floor(d.z))]) d.x = nx; else d.vx = 0;
    if (!SOLID[w.id(Math.floor(d.x), Math.floor(d.y), Math.floor(nz))]) d.z = nz; else d.vz = 0;
    const ny = d.y + d.vy * dt;
    if (SOLID[w.id(Math.floor(d.x), Math.floor(ny - 0.15), Math.floor(d.z))]) { d.y = Math.floor(ny - 0.15) + 1.15; d.vy = 0; } else d.y = ny;
    if (SOLID[w.id(Math.floor(d.x), Math.floor(d.y), Math.floor(d.z))]) d.y += 4 * dt;   // pushed out if stuck in a block
    d.mesh.position.set(d.x, d.y + Math.sin(d.age * 3) * 0.06, d.z);
    d.mesh.rotation.y = d.age * 1.6;
    d.mesh.material.color.setScalar(bright);
    const dx = d.x - p.pos.x, dy = d.y - (p.pos.y + 0.8), dz = d.z - p.pos.z, dist2 = dx * dx + dy * dy + dz * dz;
    // nearby items drift toward the player
    if (d.pickDelay <= 0 && dist2 < 9 && G.state !== "dead") { const k = 6 * dt / Math.sqrt(dist2 + 0.01); d.x -= dx * k; d.z -= dz * k; d.y -= dy * k * 0.5; }
    if (d.pickDelay <= 0 && dist2 < 1.7 && G.state !== "dead") {
      const left = G.inv.add(d.id, d.n, d.stack);
      if (left < d.n) { Sound.pickup(); G.hudDirty = true; if (UI.panelOpen) UI.refreshPanel(); }
      d.n = left;
    }
    if (d.n <= 0 || d.age > 300 || d.y < -10) { removeDrop(d); G.drops.splice(i, 1); }
  }
}

// ---------- crafting & furnaces ----------
G.craft = (recipe, many) => {
  if (recipe.table && G.panelKind !== "table") { UI.toast("Stand at a Workbench to make that.", "bad"); Sound.error(); return; }
  let made = 0;
  const times = many ? 64 : 1;
  for (let t = 0; t < times; t++) {
    if (!recipe.ins.every(([id, n]) => G.inv.count(id) >= n)) break;
    if (made && G.inv.count(recipe.out[0]) + recipe.out[1] > 640) break;
    for (const [id, n] of recipe.ins) G.inv.remove(id, n);
    const left = G.inv.add(recipe.out[0], recipe.out[1]);
    if (left) G.dropItem(recipe.out[0], left);
    made++;
  }
  if (!made) { Sound.error(); UI.toast("You don't have enough materials for that.", "bad"); return; }
  Sound.craft();
  UI.toast(`Made ${itemDef(recipe.out[0]).name}${recipe.out[1] * made > 1 ? " ×" + recipe.out[1] * made : ""}!`, "good");
  if (recipe.out[0] === B.PLANKS || recipe.out[0] === B.BIRCH_PLANKS) tipDone("craft");
  G.hudDirty = true; UI.refreshPanel();
};
G.inventoryChanged = () => { G.hudDirty = true; heldId = -1; };
G.onTakeSmelted = () => {};
function updateFurnaces(dt) {
  for (const [key, f] of G.world.containers) {
    if (f.type !== "furnace") continue;
    const [inp, fuel, out] = f.slots, result = inp ? SMELT[inp.id] : undefined;
    const canCook = result !== undefined && (!out || (out.id === result && out.n < maxStack(result)));
    const wasLit = f.burn > 0;
    if (f.burn > 0) f.burn -= dt;
    if (f.burn <= 0 && canCook && fuel) {
      f.burn = f.burnMax = FUEL[fuel.id]; fuel.n--; if (!fuel.n) f.slots[1] = null;
    }
    if (f.burn > 0 && canCook) {
      f.prog += dt;
      if (f.prog >= SMELT_TIME) {
        f.prog = 0; inp.n--; if (!inp.n) f.slots[0] = null;
        if (out) out.n++; else f.slots[2] = newStack(result, 1);
      }
    } else f.prog = Math.max(0, f.prog - dt * 2);
    if (f.burn < 0) f.burn = 0;
    const lit = f.burn > 0;
    if (lit !== wasLit) {   // show the glow on the block
      const [x, y, z] = key.split(",").map(Number), v = G.world.get(x, y, z);
      if (idOf(v) === B.FURNACE && G.world.isLoaded(x, z)) G.world.set(x, y, z, make(B.FURNACE, lit ? metaOf(v) | LIT : metaOf(v) & ~LIT));
    }
  }
}

// ---------- survival ----------
// armor points worn (each point blocks 4% of damage)
function armorPoints() { let a = 0; for (let i = 36; i < 40; i++) { const s = G.inv.slots[i]; if (s && itemDef(s.id).armor) a += itemDef(s.id).armor.points; } return a; }
let iframes = 0;
function hurt(n, why, src, bypassArmor) {
  const p = G.player;
  if (G.creative || G.state === "dead" || n <= 0) return;
  if (iframes > 0 && !bypassArmor) return;
  if (!bypassArmor) {
    const a = armorPoints();
    n = n * (1 - Math.min(20, a) * 0.04);
    for (let i = 36; i < 40; i++) { const s = G.inv.slots[i]; if (s && itemDef(s.id).armor) { s.dur = (s.dur ?? itemDef(s.id).armor.dur) - 1; if (s.dur <= 0) { G.inv.slots[i] = null; UI.toast(`Your ${itemDef(s.id).name} broke!`, "bad"); } } }
    iframes = 0.5;
  }
  n = Math.max(0.5, Math.round(n * 2) / 2);
  p.health = Math.max(0, p.health - n); p.hurtT = 0.4;
  if (src && src.pos) { const dx = p.pos.x - src.pos.x, dz = p.pos.z - src.pos.z, l = Math.hypot(dx, dz) || 1; p.vel.x += dx / l * 6; p.vel.z += dz / l * 6; p.vel.y = Math.max(p.vel.y, 4); }
  if (src && src.def && src.def.knockUp) p.vel.y = 9;   // Hogbeasts toss you into the air
  Sound.hurt(); UI.flash(); G.hudDirty = true;
  if (p.health <= 0) die(why);
}
function die(why) {
  if (!G.wset.keepInv && !G.creative) {   // drop everything where you fell
    const p = G.player;
    for (let i = 0; i < G.inv.slots.length; i++) { const s = G.inv.slots[i]; if (s) spawnDrop(s.id, s.n, p.pos.x, p.pos.y + 1, p.pos.z, s); G.inv.slots[i] = null; }
    if (G.xp) { spawnOrbs(Math.min(100, Math.floor(G.xp / 2)), p.pos.x, p.pos.y + 1, p.pos.z); G.xp = 0; }
  }
  G.effects = {};
  G.state = "dead"; keys.clear(); mouseL = mouseR = false;
  document.getElementById("deathWhy").textContent = why;
  if (document.pointerLockElement) document.exitPointerLock();
  UI.show("death");
}
G.respawn = async () => {
  const p = G.player;
  p.health = 20; p.hunger = 20; p.air = 10; p.exhaust = 0; p.flying = false;
  if (G.dim !== "overworld") {   // you always wake up on the Surface
    G.state = "loading"; UI.show("loading");
    G.dimData[G.dim] = dimSnapshot(G.world);
    clearWorldMeshes(); G.world.chunks.clear();
    G.dim = "overworld"; G.world = makeWorld("overworld"); G.gen = G.world.gen;
    p.pos.x = p.spawn.x; p.pos.z = p.spawn.z; p.pos.y = p.spawn.y || 60;
    await loadArea(p.spawn.x, p.spawn.z, "Waking up on the Surface…");
  }
  placeSafely(p, p.spawn.x, p.spawn.z);
  if (p.spawn.bed && G.world.id(...p.spawn.bed) !== B.BED) { UI.toast("Your bed was missing, so you woke up at the world's starting spot.", "bad"); delete p.spawn.bed; }
  G.state = "pause"; G.resume();
};
let survT = 0, regenT = 0, starveT = 0, drownT = 0;
function survival(dt) {
  const p = G.player;
  if (G.creative) { p.health = 20; p.hunger = 20; p.air = 10; G.effects = {}; p.levitate = false; return; }
  if (iframes > 0) iframes -= dt;
  tickEffects(dt);
  p.levitate = !!G.effects.levitation;
  p.speedMul = G.effects.swift ? 1.25 : 1;
  tickBeacons(dt);
  if (p.gliding && (G.glideT = (G.glideT || 0) + dt) >= 1) { G.glideT = 0; const wings = G.inv.slots[37]; if (wings && wings.id === I.GLIDER) { wings.dur = (wings.dur ?? 432) - 1; if (wings.dur <= 0) { G.inv.slots[37] = null; p.gliding = false; UI.toast("Your Glider Wings wore out!", "bad"); } G.hudDirty = true; } }
  if (p.inLava) { addEffect("fire", 6); if ((G.lavaT = (G.lavaT || 0) - dt) <= 0) { G.lavaT = 0.5; hurt(4, "Lava is very hot! Watch your step.", null, true); } }
  const w = G.world, fx = Math.floor(p.pos.x), fy = Math.floor(p.pos.y), fz = Math.floor(p.pos.z);
  if (w.id(fx, fy, fz) === B.FIRE || w.id(fx, fy + 1, fz) === B.FIRE) addEffect("fire", 4);
  if (p.onGround && w.id(fx, Math.floor(p.pos.y - 0.1), fz) === B.MAGMA && !p.crouch && (G.magmaT = (G.magmaT || 0) + dt) > 1) { G.magmaT = 0; hurt(1, "Magma blocks are hot! Crouch (C) to walk on them safely.", null, true); }
  if (G.wset.difficulty === "peaceful" && p.health < 20 && (G.peaceT = (G.peaceT || 0) + dt) > 2) { G.peaceT = 0; p.health++; G.hudDirty = true; }
  survT += dt;
  if (survT > 50) { survT = 0; p.exhaust += 4; }         // slowly get hungry over time
  if (p.exhaust >= 4) { p.exhaust -= 4; p.hunger = Math.max(0, p.hunger - 1); G.hudDirty = true; }
  regenT += dt;
  if (p.hunger >= 16 && p.health < 20 && regenT > 3) { regenT = 0; p.health++; p.exhaust += 2; G.hudDirty = true; }
  if (p.hunger <= 0) { starveT += dt; if (starveT > 4 && p.health > 2) { starveT = 0; hurt(1, "You were too hungry. Eat apples to keep your food bar up!"); } }
  // breath underwater
  if (p.headInWater) { p.air -= dt; if (p.air < 0) { p.air = 0; drownT += dt; if (drownT > 1) { drownT = 0; hurt(2, "You ran out of air. Swim up for a breath!"); } } G.hudDirty = true; }
  else if (p.air < 10) { p.air = Math.min(10, p.air + dt * 4); G.hudDirty = true; }
}

// ---------- first-time tips ----------
const TIPS_S = [
  ["move", "Use <b>W A S D</b> to walk and the <b>mouse</b> to look around. <b>Space</b> jumps."],
  ["chop", "Find a tree. <b>Hold the left mouse button</b> on its trunk to chop a log."],
  ["craft", "Press <b>E</b> and make <b>Oak Planks</b> from your log."],
  ["place", "Pick planks with <b>1–9</b> or the wheel, then <b>right-click</b> to place them."],
  ["table", "Make a <b>Workbench</b>, place it, and <b>right-click</b> it to make tools. Build a shelter before night!"]
];
const TIPS_C = [
  ["move", "Use <b>W A S D</b> to move. <b>Tap Space twice</b> to fly, then Space to rise and <b>C</b> to go down."],
  ["craft", "Press <b>E</b> to open the block chooser. Click a block, then click a hotbar slot."],
  ["place", "<b>Right-click</b> to place blocks and <b>left-click</b> to remove them. Have fun building!"]
];
function updateTips() {
  const list = G.creative ? TIPS_C : TIPS_S, next = list.find(([k]) => !G.tips[k]);
  UI.tip(next ? next[1] : null);
}
function tipDone(k) { if (!G.tips[k]) { G.tips[k] = true; updateTips(); } }

// ---------- sky ----------
const SKY_DAY = new THREE.Color(0x8fd0f5), SKY_SET = new THREE.Color(0xf2a66a), SKY_NIGHT = new THREE.Color(0x0b1430), skyCol = new THREE.Color();
const NETHER_SKY = new THREE.Color(0x3a0c0c);
let ashT = 0, rumbleT = 8;
const END_SKY = new THREE.Color(0x140a1e);
function updateSky() {
  const nether = G.world && G.world.gen.isNether();
  const hollow = G.world && G.world.gen.isEnd && G.world.gen.isEnd();
  sun.visible = moon.visible = !nether && !hollow;
  if (hollow) {
    uniforms.daylight.value = 0.55; uniforms.ambient.value = 0.22;
    skyCol.copy(END_SKY); scene.background = skyCol; uniforms.fogColor.value.copy(skyCol);
    stars.visible = true; stars.material.opacity = 0.9; stars.position.copy(camera.position);
    return 0.6;
  }
  if (nether) {
    uniforms.daylight.value = 0; uniforms.ambient.value = 0.3;
    skyCol.copy(NETHER_SKY);
    scene.background = skyCol; uniforms.fogColor.value.copy(skyCol); stars.visible = false;
    // drifting ash and embers, and a low rumble now and then
    const p = G.player;
    if ((ashT += 1 / 60) > 0.08) { ashT = 0; parts.push({ x: p.pos.x + (Math.random() - 0.5) * 16, y: p.pos.y + Math.random() * 8, z: p.pos.z + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 0.4, vy: -0.3, vz: (Math.random() - 0.5) * 0.4, life: 4, c: Math.random() < 0.25 ? PUFF_COLORS.ember : PUFF_COLORS.ash, floaty: true }); if (parts.length > PMAX) parts.shift(); }
    if ((rumbleT -= 1 / 60) <= 0) { rumbleT = 8 + Math.random() * 10; Sound.mob("rumble", 0); }
    return 0.5;
  }
  uniforms.ambient.value = 0.11;
  const a = G.time * Math.PI * 2, h = Math.sin(a);       // h: height of the sun (−1..1)
  const day = Math.min(1, Math.max(0, h * 2.2 + 0.35));
  const daylight = 0.22 + 0.78 * day;                      // nights stay dim, not pitch black
  uniforms.daylight.value = daylight;
  skyCol.copy(SKY_NIGHT).lerp(SKY_DAY, day);
  const dusk = Math.max(0, 1 - Math.abs(h) * 4) * (day > 0.05 ? 1 : 0.4);
  skyCol.lerp(SKY_SET, dusk * 0.45);
  const p = G.player;
  if (p.headInWater) skyCol.set(0x1d3f7a);
  scene.background = skyCol; uniforms.fogColor.value.copy(skyCol);
  const cam = camera.position, R = 80;
  sun.position.set(cam.x + Math.cos(a) * R, cam.y + Math.sin(a) * R, cam.z + 18); sun.lookAt(cam);
  moon.position.set(cam.x - Math.cos(a) * R, cam.y - Math.sin(a) * R, cam.z - 18); moon.lookAt(cam);
  stars.position.copy(cam); stars.material.opacity = Math.max(0, 1 - day * 1.6);
  stars.visible = stars.material.opacity > 0.02;
  return daylight;
}
function applyView() {
  const R = G.settings.renderDist * CHUNK;
  uniforms.fogFar.value = waterUniforms.fogFar.value = R - 2;
  uniforms.fogNear.value = waterUniforms.fogNear.value = R * 0.55;
  if (G.world && G.world.gen.isNether()) { uniforms.fogNear.value = R * 0.3; uniforms.fogFar.value = R * 0.85; }
  if (G.player.headInWater) { uniforms.fogNear.value = 2; uniforms.fogFar.value = 18; }
  if (G.player.inLava) { uniforms.fogNear.value = 0.5; uniforms.fogFar.value = 4; uniforms.fogColor.value.set(0xff6a10); }
  camera.far = Math.max(120, R + 40); camera.updateProjectionMatrix();
}

// ---------- settings ----------
G.applySettings = (k) => {
  const s = G.settings;
  saveSettings(s);
  Sound.setVolume(s.volume); Sound.setMuted(s.muted);
  camera.fov = s.fov;
  renderer.setPixelRatio(s.quality === "fancy" ? Math.min(window.devicePixelRatio || 1, 1.75) : Math.min(window.devicePixelRatio || 1, 1));
  resize();
  if (k === "quality" && G.world) for (const c of G.world.chunks.values()) { c.dirty = true; }
  applyView();
};
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// ---------- world list actions (called from the menus) ----------
G.listWorlds = () => Saves.list();
G.storageOK = () => Saves.persistent();
G.newWorld = ({ name, seed, mode, settings }) => {
  const save = { id: newId(), name, seed, mode, created: Date.now(), played: Date.now(), day: 1, version: 2, gen: CURRENT_GEN, dims: {}, inventory: [], tips: {}, settings };
  startWorld(save);
};
G.loadWorld = async id => {
  try { const w = await Saves.load(id); startWorld(w); }
  catch (e) { UI.toast("That world couldn't be opened: " + e.message, "bad"); }
};
G.deleteWorld = id => Saves.remove(id);
G.exportWorld = async id => { try { Saves.exportFile(await Saves.load(id)); } catch (e) { UI.toast(e.message, "bad"); } };
G.exportCurrent = () => { Saves.exportFile(snapshot()); UI.toast("World file downloaded.", "good"); };
G.importWorld = file => Saves.importFile(file);
G.toTitle = async () => {
  await saveNow(false);
  clearWorldMeshes();
  if (G.world) { G.world.chunks.clear(); G.world.dirtyQueue.clear(); }
  G.world = null; G.meta = null; G.state = "title";
  document.body.classList.add("menu-bg");
  outline.visible = crack.visible = false;
  UI.show("title");
};
window.addEventListener("pagehide", () => { if (G.world && G.state !== "loading") saveNow(false); Sound.stop(); });

// ---------- main loop ----------
let last = performance.now(), acc = 0, fpsT = 0, fpsN = 0, fps = 0, stepSoundT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;   // capped so a background tab doesn't cause a huge jump
  fpsT += dt; fpsN++; if (fpsT > 0.5) { fps = Math.round(fpsN / fpsT); fpsT = 0; fpsN = 0; }
  if (!G.world || G.state === "loading" || G.state === "title") { if (G.state === "title") renderer.clear(); return; }
  const p = G.player, running = G.state === "play" || G.state === "panel";

  if (running) {
    G.time = (G.time + dt / DAY_LENGTH) % 1;
    if (G.time < dt / DAY_LENGTH) { G.meta.day = (G.meta.day || 1) + 1; }
    const input = G.state === "play" && locked ? {
      f: (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0),
      r: (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
      jump: keys.has("Space"), sprint: keys.has("ShiftLeft") || keys.has("ShiftRight"), crouch: keys.has("KeyC"),
      flyUp: keys.has("Space"), flyDown: keys.has("KeyC")
    } : { f: 0, r: 0 };
    if (!G.creative) p.flying = false;
    acc += dt;
    const startX = p.pos.x, startZ = p.pos.z;
    while (acc >= 1 / 60) {
      acc -= 1 / 60;
      const wasWater = p.inWater;
      const res = p.step(G.world, p.flying ? { ...input, crouch: false } : input, 1 / 60, G.creative);
      if (res.fall > 3.5) hurt(Math.floor(res.fall - 3), "That was a long fall! Build stairs or use water to land safely.");
      if (res.crash > 10) hurt(Math.round((res.crash - 10) * 0.7), "You glided into a wall! Slow down by looking up before you land.", null, true);
      if (!wasWater && p.inWater && p.vel.y < -4) Sound.splash();
      if (G.dim === "end" && p.pos.y < -4) {   // the void below the Hollow
        if (G.creative) { p.pos.x = 100.5; p.pos.z = 0.5; p.pos.y = 60; p.vel.y = 0; }
        else if ((G.voidT = (G.voidT || 0) - 1 / 60) <= 0) { G.voidT = 0.5; hurt(4, "You fell into the void.", null, true); }
      } else if (p.pos.y < -20) { placeSafely(p, p.spawn.x, p.spawn.z); }
    }
    const moved = Math.hypot(p.pos.x - startX, p.pos.z - startZ);
    if (moved > 0.001 && p.onGround) {
      G.walkPhase += moved * 2.2; G.stepDist += moved;
      if (G.stepDist > 2.2) { G.stepDist = 0; Sound.step(MATERIAL(G.world.id(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.2), Math.floor(p.pos.z)))); }
      G.moveTotal = (G.moveTotal || 0) + moved; if (G.moveTotal > 6) tipDone("move");
    }
    survival(dt);
    updateFurnaces(dt);
    tickCrops(dt);
    updateTNT(dt);
    updateFires(dt);
    updateClouds(dt);
    if (G.dim === "end") ensureBoss();
    if (G.state === "play") checkPortal(dt);
    if (G.attackCd > 0) G.attackCd -= dt;
    if (G.bowT >= 0) G.bowT += dt;
    if (G.panelKind === "furnace" && (G.panelT = (G.panelT || 0) + dt) > 0.25) { G.panelT = 0; UI.refreshPanel(); }
  }

  // camera
  const bob = G.settings.reducedMotion || !p.onGround ? 0 : Math.sin(G.walkPhase) * 0.04 * Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 4);
  camera.position.set(p.pos.x, p.pos.y + p.eye + bob, p.pos.z);
  camera.rotation.set(p.pitch, p.yaw, p.hurtT > 0 && !G.settings.reducedMotion ? Math.sin(p.hurtT * 30) * 0.03 : 0, "YXZ");
  if (p.hurtT > 0) p.hurtT -= dt;

  stream(G.state === "play" ? 7 : 4);
  const daylight = updateSky();
  applyView();
  if (running) { ents.update(dt, daylight, camera); updateOrbs(dt); }
  if (G.state === "play" && mouseL && !G.creative && G.attackCd <= 0 && entityTarget()) attack();
  document.getElementById("waterTint").hidden = !p.headInWater;

  // what am I pointing at?
  const hit = G.state === "play" && locked ? target() : null;
  if (hit) {
    let box = [0, 0, 0, 1, 1, 1];
    const id = idOf(hit.v);
    if (id === B.DOOR) box = doorBox(metaOf(hit.v));
    else if (BLOCKS[id].shape === "cross" || BLOCKS[id].shape === "torch") box = [0.2, 0, 0.2, 0.8, 0.8, 0.8];
    outline.visible = true;
    outline.scale.set(box[3] - box[0] + 0.004, box[4] - box[1] + 0.004, box[5] - box[2] + 0.004);
    outline.position.set(hit.x + (box[0] + box[3]) / 2, hit.y + (box[1] + box[4]) / 2, hit.z + (box[2] + box[5]) / 2);
  } else outline.visible = false;
  if (G.state === "play") {
    updateMining(dt, entityTarget() ? null : hit);
    G.useCooldown -= dt;
    if (mouseR && G.useCooldown <= 0) { useItem(); G.useCooldown = 0.25; }
    if (mouseL && G.creative && G.useCooldown <= 0) creativeBreak();
  } else crack.visible = false;

  // light level at the player (for held item and drops)
  const skyOpen = G.world.surfaceY(Math.floor(p.pos.x), Math.floor(p.pos.z)) <= p.pos.y + 1;
  const bright = Math.max(skyOpen ? daylight : 0.35, 0.35);
  updateDrops(running ? dt : 0, bright);
  if (G.swing > 0) { G.swing += dt * 4; if (G.swing >= 1) G.swing = mouseL && !G.creative && G.mining ? 0.01 : 0; }
  updateHeld(bright);

  // particles
  let n = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i]; q.life -= dt;
    if (q.life <= 0) { parts.splice(i, 1); continue; }
    q.vy -= (q.floaty ? 1 : 12) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    if (SOLID[G.world.id(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z))]) { q.vy = 0; q.vx *= 0.5; q.vz *= 0.5; q.y = Math.floor(q.y) + 1.01; }
  }
  for (const q of parts) { pPos[n * 3] = q.x; pPos[n * 3 + 1] = q.y; pPos[n * 3 + 2] = q.z; pCol[n * 3] = q.c[0] * daylight; pCol[n * 3 + 1] = q.c[1] * daylight; pCol[n * 3 + 2] = q.c[2] * daylight; n++; }
  pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;

  // the boss health bar
  const boss = ents.list.filter(e => e.def.boss && !e.gone).sort((a, b) => Math.hypot(a.pos.x - p.pos.x, a.pos.z - p.pos.z) - Math.hypot(b.pos.x - p.pos.x, b.pos.z - p.pos.z))[0], bar = document.getElementById("bossbar");
  bar.hidden = !boss || Math.hypot(boss.pos.x - p.pos.x, boss.pos.z - p.pos.z) > (boss.sp === "dragon" ? 160 : 64);
  if (!bar.hidden) { bar.querySelector("i").style.width = Math.max(0, boss.hp / boss.maxHp * 100) + "%"; bar.querySelector("b").textContent = boss.def.name + (boss.armored ? " (armored: arrows bounce off)" : ""); }
  if (G.hudDirty) { G.hudDirty = false; UI.hud(); }
  if (running) { G.autosaveT += dt; if (G.autosaveT > AUTOSAVE) { G.autosaveT = 0; saveNow(true); } }
  if (G.debug) {
    document.getElementById("debug").textContent =
      `${DIM_NAMES[G.dim]}\nx ${p.pos.x.toFixed(1)}  y ${p.pos.y.toFixed(1)}  z ${p.pos.z.toFixed(1)}\nchunk ${Math.floor(p.pos.x / 16)}, ${Math.floor(p.pos.z / 16)}   loaded ${G.world.chunks.size}\n${fps} fps   day ${G.meta.day || 1}  time ${(G.time * 24).toFixed(1)}h\n${G.gen.column(Math.floor(p.pos.x), Math.floor(p.pos.z)).biome}`;
  }
  renderer.render(scene, camera);
}

// ---------- start ----------
UI.init(G);
G.applySettings();
resize();
UI.show("title");
requestAnimationFrame(loop);
window.__bhLoop = loop;   // lets automated tests drive frames
G._test = { hand, ents, checkBlightSummon, tickBeacons, enterHollow, leaveHollow, gatewayJump, fillFrame, throwEye, ensureBoss, wyrmDefeated, clouds, lightPortal, travel, buildPortal, portalList, ignite, makeWorld, loadArea, explode, hurt, attack, entityTarget, releaseBow, tickCrops, growTree, useBed, target, useItem, breakBlock, mineInfo, interact, spawnDrop, placeSafely, keys, openPanel, closePanel, setLocked: v => { locked = v; }, setMouse: (l, r) => { mouseL = l; mouseR = r; } };
