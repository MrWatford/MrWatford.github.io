// Blockhaven: the game loop, 3D drawing, controls, mining and building, survival rules, and saving.
import * as THREE from "../lib/three.module.min.js";
import { B, I, CHUNK, HEIGHT, SEA, BLOCKS, OPAQUE, SOLID, RECIPES, SMELT, FUEL, SMELT_TIME, TAGS, idOf, metaOf, make, blockDef, itemDef, isBlockItem,
  buildAtlas, faceTile, TILE, iconCanvas, OPEN, TOP, LIT } from "./blocks.js";
import { Generator, LOOT } from "./worldgen.js";
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

const uniforms = { map: { value: atlasTex }, daylight: { value: 1 }, fogColor: { value: new THREE.Color(0x8fd0f5) }, fogNear: { value: 40 }, fogFar: { value: 64 }, alphaTest: { value: 0.5 }, opacity: { value: 1 } };
const VERT = `attribute vec3 lt; varying vec2 vUv; varying vec3 vLt; varying float vDist;
void main() { vUv = uv; vLt = lt; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FRAG = `uniform sampler2D map; uniform float daylight, fogNear, fogFar, alphaTest, opacity; uniform vec3 fogColor;
varying vec2 vUv; varying vec3 vLt; varying float vDist;
void main() {
  vec4 t = texture2D(map, vUv);
  if (t.a < alphaTest) discard;
  float s = vLt.x * daylight, b = vLt.y;
  float l = max(s, b);
  l = 0.11 + 0.89 * pow(l, 1.5);
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
  get creative() { return this.mode === "creative"; }
};
window.__bh = G;   // handy for testing in the browser console

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
}

// ---------- starting, loading, saving ----------
async function startWorld(save) {
  clearWorldMeshes();
  G.state = "loading"; UI.show("loading"); UI.setLoading(0, "Shaping hills and valleys");
  G.meta = save; G.mode = save.mode;
  G.gen = new Generator(save.seed);
  G.world = new World(G.gen);
  G.world.modsFromJSON(save.mods);
  for (const [k, c] of save.containers || []) G.world.containers.set(k, c);
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
  const R = G.settings.renderDist, pcx = Math.floor(p.pos.x / CHUNK), pcz = Math.floor(p.pos.z / CHUNK);
  const toLoad = OFFSETS[R + 1], toMesh = OFFSETS[Math.min(R, 3)];
  let done = 0; const total = toLoad.length + toMesh.length;
  for (const [dx, dz] of toLoad) {
    G.world.load(pcx + dx, pcz + dz);
    if (++done % 4 === 0) { UI.setLoading(done / total, "Shaping hills and valleys"); await frame(); }
  }
  for (const [dx, dz] of toMesh) {
    const c = G.world.chunks.get(chunkKey(pcx + dx, pcz + dz));
    if (c && neighborsReady(c)) meshChunk(c);
    if (++done % 4 === 0) { UI.setLoading(done / total, "Planting trees and lighting torches"); await frame(); }
  }
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
  return {
    ...G.meta, played: Date.now(), time: G.time, day: G.meta.day || 1, tips: G.tips,
    player: { pos: { ...p.pos }, yaw: p.yaw, pitch: p.pitch, health: p.health, hunger: p.hunger, spawn: p.spawn, flying: p.flying },
    inventory: G.inv.toJSON(), mods: G.world.modsToJSON(), containers: [...G.world.containers]
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
  if (e.button === 0) { mouseL = true; G.mining = null; if (G.creative) creativeBreak(); }
  if (e.button === 2) { mouseR = true; useItem(); G.useCooldown = 0.28; }
});
window.addEventListener("mouseup", e => { if (e.button === 0) { mouseL = false; G.mining = null; } if (e.button === 2) mouseR = false; });
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
function breakBlock(x, y, z, drops) {
  const w = G.world, v = w.get(x, y, z), id = idOf(v), d = blockDef(v);
  if (!id || id === B.WATER) return;
  if (id === B.DOOR) {   // doors are two blocks tall: remove both halves
    if (metaOf(v) & TOP) y -= 1;
    w.set(x, y, z, B.AIR);
    if (w.id(x, y + 1, z) === B.DOOR) w.set(x, y + 1, z, B.AIR);
  } else {
    // simple water rule: a hole next to water fills with water
    const wet = water(x, y + 1, z) || water(x + 1, y, z) || water(x - 1, y, z) || water(x, y, z + 1) || water(x, y, z - 1);
    w.set(x, y, z, wet ? B.WATER : B.AIR);
  }
  Sound.breakBlock(MATERIAL(id)); burst(x, y, z, v, 16);
  if (!G.creative && drops) {
    let drop = d.drops;
    if (drop === "leaves") drop = Math.random() < 0.08 ? I.APPLE : 0;
    if (Array.isArray(drop)) spawnDrop(drop[0], drop[1], x + 0.5, y + 0.5, z + 0.5);
    else if (drop) spawnDrop(drop, 1, x + 0.5, y + 0.5, z + 0.5);
  }
  // spill container contents
  const key = x + "," + y + "," + z, box = w.containers.get(key);
  if (box) { for (const s of box.slots) if (s) spawnDrop(s.id, s.n, x + 0.5, y + 0.5, z + 0.5, s); w.containers.delete(key); }
  // things resting on top fall off
  const above = w.get(x, y + 1, z), aid = idOf(above);
  if ([B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.TORCH].includes(aid) || (aid === B.DOOR && !(metaOf(above) & TOP))) breakBlock(x, y + 1, z, true);
  if (id === B.LOG || id === B.BIRCH_LOG) tipDone("chop");
  G.hudDirty = true;
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
  const hit = target(), w = G.world, slot = G.inv.slots[G.selected], crouch = keys.has("KeyC");
  if (hit && !crouch) {
    const id = idOf(hit.v), d = BLOCKS[id];
    if (d.interact) { G.swing = 0.01; interact(hit, d.interact); return; }
  }
  if (slot && itemDef(slot.id).food) {
    if (G.creative) return;
    if (G.player.hunger >= 20) { UI.toast("You're not hungry right now."); return; }
    G.player.hunger = Math.min(20, G.player.hunger + itemDef(slot.id).food); G.player.exhaust = 0;
    slot.n--; if (!slot.n) G.inv.slots[G.selected] = null;
    Sound.eat(); G.swing = 0.01; G.hudDirty = true; return;
  }
  if (!hit || !slot || !isBlockItem(slot.id)) return;
  let x = hit.x, y = hit.y, z = hit.z;
  const hitDef = blockDef(hit.v);
  if (!hitDef.replaceable) { x += hit.nx; y += hit.ny; z += hit.nz; }
  if (y < 1 || y >= HEIGHT - 1) return;
  const here = w.id(x, y, z);
  if (here && here !== B.WATER && !BLOCKS[here].replaceable) return;
  const id = slot.id, d = BLOCKS[id];
  let v = make(id);
  if (d.front) v = make(id, (facingFromYaw() + 2) % 4);   // furnaces and chests face you
  if (d.shape === "cross" && ![B.GRASS, B.DIRT].includes(w.id(x, y - 1, z))) { UI.toast(`${d.name} needs grass or dirt underneath.`, "bad"); Sound.error(); return; }
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
  }
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.selected] = null; }
  Sound.place(MATERIAL(id)); G.swing = 0.01; G.hudDirty = true; heldId = G.inv.slots[G.selected] ? heldId : -1;
  tipDone("place");
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
  put(I.COAL, 3 + Math.floor(r() * 6)); put(I.APPLE, 1 + Math.floor(r() * 3)); put(B.TORCH, 4 + Math.floor(r() * 6));
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
function hurt(n, why) {
  const p = G.player;
  if (G.creative || G.state === "dead" || n <= 0) return;
  p.health = Math.max(0, p.health - n); p.hurtT = 0.4;
  Sound.hurt(); UI.flash(); G.hudDirty = true;
  if (p.health <= 0) die(why);
}
function die(why) {
  G.state = "dead"; keys.clear(); mouseL = mouseR = false;
  document.getElementById("deathWhy").textContent = why;
  if (document.pointerLockElement) document.exitPointerLock();
  UI.show("death");
}
G.respawn = () => {
  const p = G.player;
  p.health = 20; p.hunger = 20; p.air = 10; p.exhaust = 0; p.flying = false;
  placeSafely(p, p.spawn.x, p.spawn.z);
  G.state = "pause"; G.resume();
};
let survT = 0, regenT = 0, starveT = 0, drownT = 0;
function survival(dt) {
  const p = G.player;
  if (G.creative) { p.health = 20; p.hunger = 20; p.air = 10; return; }
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
function updateSky() {
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
  if (G.player.headInWater) { uniforms.fogNear.value = 2; uniforms.fogFar.value = 18; }
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
G.newWorld = ({ name, seed, mode }) => {
  const save = { id: newId(), name, seed, mode, created: Date.now(), played: Date.now(), day: 1, mods: {}, containers: [], inventory: [], tips: {} };
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
      if (!wasWater && p.inWater && p.vel.y < -4) Sound.splash();
      if (p.pos.y < -20) { placeSafely(p, p.spawn.x, p.spawn.z); }
    }
    const moved = Math.hypot(p.pos.x - startX, p.pos.z - startZ);
    if (moved > 0.001 && p.onGround) {
      G.walkPhase += moved * 2.2; G.stepDist += moved;
      if (G.stepDist > 2.2) { G.stepDist = 0; Sound.step(MATERIAL(G.world.id(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.2), Math.floor(p.pos.z)))); }
      G.moveTotal = (G.moveTotal || 0) + moved; if (G.moveTotal > 6) tipDone("move");
    }
    survival(dt);
    updateFurnaces(dt);
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
    updateMining(dt, hit);
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
    q.vy -= 12 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    if (SOLID[G.world.id(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z))]) { q.vy = 0; q.vx *= 0.5; q.vz *= 0.5; q.y = Math.floor(q.y) + 1.01; }
  }
  for (const q of parts) { pPos[n * 3] = q.x; pPos[n * 3 + 1] = q.y; pPos[n * 3 + 2] = q.z; pCol[n * 3] = q.c[0] * daylight; pCol[n * 3 + 1] = q.c[1] * daylight; pCol[n * 3 + 2] = q.c[2] * daylight; n++; }
  pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;

  if (G.hudDirty) { G.hudDirty = false; UI.hud(); }
  if (running) { G.autosaveT += dt; if (G.autosaveT > AUTOSAVE) { G.autosaveT = 0; saveNow(true); } }
  if (G.debug) {
    document.getElementById("debug").textContent =
      `x ${p.pos.x.toFixed(1)}  y ${p.pos.y.toFixed(1)}  z ${p.pos.z.toFixed(1)}\nchunk ${Math.floor(p.pos.x / 16)}, ${Math.floor(p.pos.z / 16)}   loaded ${G.world.chunks.size}\n${fps} fps   day ${G.meta.day || 1}  time ${(G.time * 24).toFixed(1)}h\n${G.gen.column(Math.floor(p.pos.x), Math.floor(p.pos.z)).biome}`;
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
G._test = { hand, target, useItem, breakBlock, mineInfo, interact, spawnDrop, placeSafely, keys, openPanel, closePanel, setLocked: v => { locked = v; }, setMouse: (l, r) => { mouseL = l; mouseR = r; } };
