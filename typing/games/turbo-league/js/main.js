// Turbo League: Rocket Soccer — game runtime.
// Loop: read controls -> step the match (physics + rules + computer players) at a fixed 120 Hz ->
// smooth the drawing between physics steps -> camera -> effects -> picture pipeline.
import * as THREE from "../lib/three.module.min.js";
import { sdf, normalIn } from "./physics.js";
import { ARENA, PHYS, BALL, CAR, HIT, BOOST, MATCH } from "./config.js";
import { Match } from "./match.js";
import { LEVELS } from "./ai.js";
import { buildCar } from "./car-model.js";
import { buildStadium, drawScreen, TEAM } from "./stadium.js";
import { buildBall, Effects } from "./fx.js";
import { Post } from "./post.js";
import { Audio } from "./audio.js";
import { Recorder, sample, planReplay, shotAt, STRIDE } from "./replay.js";
import { Announcer } from "./announcer.js";
import { Lesson, LESSONS, TIERS, lessonById, tierOpen, tierComplete } from "./academy.js";
import { newCup, standings, nextFixture, playRound, simulateRest, teamById, teamLevel, hallEntry, playerRecord, tournamentMVP, stageLabel, winnerOf, SHAPES, GLYPHS, PALETTE, DIFFICULTY, STAGES } from "./cup.js";
import { buildTrophy, emblemURL } from "./trophy.js";
import { ARENA_LIST, THEMES } from "./arenas.js";
import { levelInfo, titleFor, loadProfile, recordMatch, recordLesson, recordCup, recordGarage, backfill, ACHIEVEMENTS, achievementById, GARAGE, PAINTS, ACCENTS, itemUnlocked, reqText, cleanLoadout, defaultLoadout, MAX_LEVEL } from "./career.js";
import { Garage, LIGHTS } from "./garage.js";
import { BODIES } from "./car-model.js";
import { initOnline } from "./online.js";
import { initTouch } from "./touch.js";
import { cleanSettings, cleanAcademy, cleanCup, cleanHall } from "./saves.js";

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

// ---------- settings (saved on this device only) ----------
const SKEY = "turbo-league-settings";
const defaults = () => {
  const ua = navigator.userAgent, cores = navigator.hardwareConcurrency || 4;
  const q = /CrOS/.test(ua) ? "low" : cores <= 4 || /Mobi|Android|iPhone|iPad/.test(ua) ? "medium" : "high";
  return { quality: q, scale: 1, fov: 100, camDist: 2.9, camHeight: 1.05, camStiff: 0.5, shake: true, reducedFlash: false, reducedMotion: false, ballCam: true, master: 0.8, sfx: 0.9, crowd: 0.7, music: 0.6, showFps: false, replays: true, intro: true,
    exh: { size: 1, opp: 1, mate: 2, length: 300, watch: false, arena: "championship" },
    gfx: { shadows: "auto", effects: "auto", crowd: "auto", bloom: "on", aa: "auto" },
    local: { mode: "1v1", p1: "kbL", p2: "kbR", level: 1, arena: "championship", length: 180, dir: "tb", p2body: "sprite" } };
};
let S = defaults();
const ARENA_IDS = ["championship", "neon", "desert", "arctic", "galactic"], SRC = ["kbL", "kbR", "pad0", "pad1"];
const CHOICES = { exh: { size: [1, 2, 3, 4], opp: [0, 1, 2, 3, 4, 5], mate: [0, 1, 2, 3, 4, 5], length: [180, 300, 420], arena: ARENA_IDS }, gfx: { shadows: ["auto", "off", "low", "high"], effects: ["auto", "low", "normal", "high"], crowd: ["auto", "off", "some", "full"], bloom: ["on", "off"], aa: ["auto", "off", "on"] }, local: { mode: ["1v1", "2v2", "coop"], p1: SRC, p2: SRC, level: [0, 1, 2, 3, 4, 5], arena: ARENA_IDS, length: [120, 180, 300], dir: ["tb", "sbs"], p2body: Object.keys(BODIES) } };
try { S = cleanSettings(JSON.parse(localStorage.getItem(SKEY) || "{}"), defaults(), CHOICES); } catch (e) { /* storage blocked or damaged: use defaults */ }
const save = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
if (params.get("gfx")) S.quality = params.get("gfx");

const DPR = window.devicePixelRatio || 1;
const PRESETS = {
  low: { pr: 0.75, shadows: 0, post: false, msaa: 0, fxaa: false, bloomHalf: true, bloomMips: 0, crowd: 0.1, particles: 0.45, carDetail: 0.45 },
  medium: { pr: 1, shadows: 1024, post: true, msaa: 0, fxaa: true, bloomHalf: true, bloomMips: 4, crowd: 0.3, particles: 0.7, carDetail: 0.65 },
  high: { pr: Math.min(DPR, 1.5), shadows: 2048, post: true, msaa: 4, fxaa: false, bloomHalf: false, bloomMips: 5, crowd: 0.6, particles: 1 },
  ultra: { pr: Math.min(DPR, 2), shadows: 4096, post: true, msaa: 4, fxaa: false, bloomHalf: false, bloomMips: 6, crowd: 1, particles: 1.3 },
};
const Q = { ...(PRESETS[S.quality] || PRESETS.medium) };
// fine-tuning on top of the preset (Esc menu → "Advanced graphics"); "auto" keeps the preset's choice
{ const g = S.gfx || {};
  if (g.shadows && g.shadows !== "auto") Q.shadows = { off: 0, low: 1024, high: 2048 }[g.shadows];
  if (g.effects && g.effects !== "auto") Q.particles = { low: 0.45, normal: 1, high: 1.3 }[g.effects];
  if (g.crowd && g.crowd !== "auto") Q.crowd = { off: 0, some: 0.3, full: 1 }[g.crowd];
  if (g.aa === "off") { Q.msaa = 0; Q.fxaa = false; Q.noAA = true; } else if (g.aa === "on") { if (Q.post) { Q.msaa = 4; Q.fxaa = false; } }
}

// ---------- renderer, scene ----------
const canvas = $("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !Q.post && !Q.noAA, powerPreference: "high-performance", preserveDrawingBuffer: params.has("shot") });
renderer.setPixelRatio(Q.pr * S.scale);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = Q.post ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !!Q.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 600);
let stadium = buildStadium(renderer, scene, Q, "championship");
// swap the surroundings (the field itself is identical in every arena)
function setArena(id) {
  id = THEMES[id] ? id : "championship";
  Audio.ambience(THEMES[id].sound);
  if (stadium.id === id) return;
  stadium.dispose(); stadium = buildStadium(renderer, scene, Q, id);
  if (typeof M !== "undefined" && M) updateScreen();
}
const post = Q.post ? new Post(renderer, Q) : null;
if (post && S.gfx && S.gfx.bloom === "off") post.mComp.uniforms.bloomStr.value = 0;
const ballMesh = buildBall(); scene.add(ballMesh);
const fx = new Effects(scene, Q);
// soft contact shadows (always on: they ground the cars and ball even without shadow maps)
const blobTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,0.75)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const blob = (w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; scene.add(m); return m; };
const ballBlob = blob(2.6, 2.6);

// ---------- Training Academy progress (saved on this device only) ----------
const AKEY = "turbo-league-academy";
let AP = { done: {}, unlocks: [], trail: null };
try { AP = cleanAcademy(JSON.parse(localStorage.getItem(AKEY) || "{}"), LESSONS.map((l) => l.id)); } catch (e) { /* storage blocked or damaged */ }
const saveAP = () => { try { localStorage.setItem(AKEY, JSON.stringify(AP)); } catch (e) { /* ignore */ } };
const TRAILS = { "trail-sky": [0.6, 1.7, 3.4], "trail-gold": [3.2, 2.3, 0.4], "trail-legend": [2.6, 0.7, 3.2], "trail-champion": [3.6, 3.1, 1.8] };
const TRAIL_LABEL = { "trail-sky": "Sky Blue", "trail-gold": "Golden", "trail-legend": "Legend", "trail-champion": "Champion" };
const TRAIL_COLORS = { ...TRAILS, aurora: [0.4, 3.2, 1.7] };
const hexN = (h) => parseInt(String(h).slice(1), 16);

// ---------- one drawn car per player ----------
const LIVERY = [{ primary: 0x1d6dff, accent: 0xffc23a, rimColor: 0xc4c8cf }, { primary: 0xff6a10, accent: 0xf4f4f6, rimColor: 0x2b2e35 }];
let M = null, views = [], focus = 0;
function buildViews() {
  for (const v of views) { scene.remove(v.model.group, v.blob); v.model.dispose(); v.blob.geometry.dispose(); v.tag.remove(); if (v.tag2) v.tag2.remove(); }
  fx.detachAll(); views = [];
  for (const p of M.players) {
    const liv = { ...(M.o.liveries ? M.o.liveries[p.team] : LIVERY[p.team]) };
    const p2 = G.split && G.mode === "local" && p.idx === G.split.idx[1];
    const net = G.mode === "online" ? (p.idx === humanIdx() ? loadoutCar(PR.loadout, liv) : { ...liv, body: (G.netBodies && G.netBodies[p.idx]) || botBody(p) }) : null;
    const model = buildCar({ ...(net ? net : p2 ? { ...liv, body: S.local.p2body } : p.human ? loadoutCar(PR.loadout, G.mode === "cup" || G.mode === "local" ? liv : null) : { ...liv, body: botBody(p) }), number: String(p.team ? 10 + p.idx : 7 + p.idx), detail: Q.carDetail });
    scene.add(model.group); fx.attachCar(p.car, model);
    if (p.human && TRAIL_COLORS[PR.loadout.trail]) fx.carFx.get(p.car).trail.mat.uniforms.uC.value.set(...TRAIL_COLORS[PR.loadout.trail]);
    const tag = document.createElement("div"); tag.className = "tag " + (p.team ? "orange" : "blue"); tag.textContent = p.name; $("tags").appendChild(tag);
    views.push({ p, model, blob: blob(1.5, 2.0), tag, prevP: new THREE.Vector3(), prevQ: new THREE.Quaternion() });
  }
  Audio.setEngine(PR.loadout.engine);
}
// the garage loadout as car-builder options (Cup matches use your Cup team's colours)
function loadoutCar(L, team) {
  return { body: L.body, finish: L.finish, decal: L.decal, rims: L.rims, rimTone: L.rimColor, tires: L.tires, topper: L.topper, antenna: L.antenna, primary: team ? team.primary : hexN(L.paint), accent: team ? team.accent : hexN(L.accent) };
}
// computer players drive a mix of bodies (looks only — every body has the same hitbox)
function botBody(p) { const ids = Object.keys(BODIES); let h = 7; for (const ch of p.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return ids[(h + p.idx * 3 + p.team) % ids.length]; }
const humanIdx = () => (typeof ON !== "undefined" && ON.me !== null ? ON.me : M.players.findIndex((p) => p.human));
const isHumanCar = (car) => !!car && M.players.some((p) => p.human && p.car === car);
const focusPlayer = () => M.players[focus] || M.players[0];

// ---------- input ----------
const keys = new Set();
const held = (...codes) => codes.some((c) => keys.has(c));
let mouseBoost = false;
addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Slash", "Quote", "Enter"].includes(e.code) && G.screen === "game") e.preventDefault();
  if (e.repeat) return;
  keys.add(e.code); Audio.init();
  if ((G.replay || G.intro) && ["Space", "Enter", "Escape"].includes(e.code)) { skipCinematic(); if (e.code !== "Escape") return; }
  if (e.code === "Escape" || e.code === "KeyP") togglePause();
  if (G.split) { G.split.src.forEach((src, i) => { if (SCHEMES[src].cam === e.code) toggleSplitCam(i); }); }
  else if (e.code === "KeyB") { S.ballCam = !S.ballCam; save(); toast(S.ballCam ? "Ball cam ON" : "Ball cam OFF"); }
  if (e.code === "KeyR" && G.mode === "free" && M && M.state === "play") resetPlayer();
  if (e.code === "KeyV" && G.mode === "watch") { focus = (focus + 1) % M.players.length; toast("Watching " + focusPlayer().name); }
  if (e.code === "Backquote") toggleDev();
  if (e.code === "F3") { e.preventDefault(); debug.on = !debug.on; toast(debug.on ? "Physics view ON (F3)" : "Physics view OFF"); }
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
canvas.addEventListener("mousedown", (e) => { Audio.init(); if (G.replay || G.intro) { skipCinematic(); return; } if (e.button === 0) mouseBoost = true; });
addEventListener("mouseup", (e) => { if (e.button === 0) mouseBoost = false; });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
let padPrev = {};
function readInput() {
  const kx = (held("KeyD", "ArrowRight") ? 1 : 0) - (held("KeyA", "ArrowLeft") ? 1 : 0);
  const ky = (held("KeyW", "ArrowUp") ? 1 : 0) - (held("KeyS", "ArrowDown") ? 1 : 0);
  const inp = { throttle: ky, steer: kx, pitch: ky, roll: (held("KeyE") ? 1 : 0) - (held("KeyQ") ? 1 : 0), jump: held("Space", "KeyJ"), boost: held("ShiftLeft", "ShiftRight", "KeyK") || mouseBoost, slide: held("KeyC", "KeyL") };
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const gp = pads[0];
  if (gp) {
    const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85), b = (i) => gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5), bv = (i) => (gp.buttons[i] ? gp.buttons[i].value : 0);
    const sx = dz(gp.axes[0] || 0), sy = -dz(gp.axes[1] || 0), thr = bv(7) - bv(6);
    if (sx || sy || thr || [0, 1, 2, 4, 5].some(b)) {
      inp.steer = sx || inp.steer; inp.pitch = sy || inp.pitch; inp.throttle = thr || inp.throttle;
      inp.jump = inp.jump || b(0); inp.boost = inp.boost || b(1); inp.slide = inp.slide || b(2);
      inp.roll = inp.roll || ((b(5) ? 1 : 0) - (b(4) ? 1 : 0));
      Audio.init();
    }
    if (b(3) && !padPrev[3]) { S.ballCam = !S.ballCam; save(); toast(S.ballCam ? "Ball cam ON" : "Ball cam OFF"); }
    if (b(9) && !padPrev[9]) togglePause();
    padPrev = { 3: b(3), 9: b(9) };
  }
  if (TOUCH.active) { const t = TOUCH.read(); for (const k of ["throttle", "steer", "pitch"]) if (t[k]) inp[k] = t[k]; inp.jump = inp.jump || t.jump; inp.boost = inp.boost || t.boost; inp.slide = inp.slide || t.slide; }
  if (G.testInput) Object.assign(inp, G.testInput);
  return inp;
}

// ---------- LOCAL MULTIPLAYER input: each player has their own keys or controller ----------
const SCHEMES = {
  kbL: { name: "Keyboard — left side", keys: "W A S D drive • Space jump • Left Shift boost • C slide • Q/E roll • B ball cam", up: ["KeyW"], down: ["KeyS"], left: ["KeyA"], right: ["KeyD"], jump: ["Space"], boost: ["ShiftLeft"], slide: ["KeyC"], rollL: ["KeyQ"], rollR: ["KeyE"], cam: "KeyB" },
  kbR: { name: "Keyboard — right side", keys: "Arrows drive • / or Enter jump • . or Right Shift boost • , slide • L/; roll • ' ball cam", up: ["ArrowUp"], down: ["ArrowDown"], left: ["ArrowLeft"], right: ["ArrowRight"], jump: ["Slash", "Enter"], boost: ["Period", "ShiftRight"], slide: ["Comma"], rollL: ["KeyL"], rollR: ["Semicolon"], cam: "Quote" },
  pad0: { name: "Controller 1", keys: "RT/LT drive • A jump • B boost • X slide • LB/RB roll • Y ball cam • Start pause" },
  pad1: { name: "Controller 2", keys: "RT/LT drive • A jump • B boost • X slide • LB/RB roll • Y ball cam • Start pause" },
};
const connectedPads = () => (navigator.getGamepads ? [...navigator.getGamepads()].filter((p) => p && p.connected !== false) : []);
const padPrevs = {};
function padRead(gp, inp, key, onCam) { // the standard controller layout, shared by everyone
  const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85), b = (i) => gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5), bv = (i) => (gp.buttons[i] ? gp.buttons[i].value : 0);
  const sx = dz(gp.axes[0] || 0), sy = -dz(gp.axes[1] || 0), thr = bv(7) - bv(6);
  inp.steer = sx || inp.steer; inp.pitch = sy || inp.pitch; inp.throttle = thr || inp.throttle;
  inp.jump = inp.jump || b(0); inp.boost = inp.boost || b(1); inp.slide = inp.slide || b(2);
  inp.roll = inp.roll || ((b(5) ? 1 : 0) - (b(4) ? 1 : 0));
  const prev = padPrevs[key] || {};
  if (b(3) && !prev[3]) onCam(); if (b(9) && !prev[9]) togglePause();
  padPrevs[key] = { 3: b(3), 9: b(9) };
}
function readInputFor(src, i) {
  const inp = { throttle: 0, steer: 0, pitch: 0, roll: 0, jump: false, boost: false, slide: false }, K = SCHEMES[src];
  if (K && K.up) {
    const h = (list) => held(...list), ky = (h(K.up) ? 1 : 0) - (h(K.down) ? 1 : 0);
    Object.assign(inp, { throttle: ky, steer: (h(K.right) ? 1 : 0) - (h(K.left) ? 1 : 0), pitch: ky, roll: (h(K.rollR) ? 1 : 0) - (h(K.rollL) ? 1 : 0), jump: h(K.jump), boost: h(K.boost), slide: h(K.slide) });
  } else if (K) { const gp = connectedPads()[+src.slice(3)]; if (gp) { padRead(gp, inp, src, () => toggleSplitCam(i)); Audio.init(); } }
  if (G.testInputs && G.testInputs[i]) Object.assign(inp, G.testInputs[i]);
  return inp;
}
function toggleSplitCam(i) { const sp = G.split; if (!sp) return; sp.ballCam[i] = !sp.ballCam[i]; toast(`P${i + 1}: ${sp.ballCam[i] ? "Ball cam ON" : "Ball cam OFF"}`); }

// ---------- game flow ----------
const G = { screen: "title", mode: "free", acc: 0, t: 0, timeScale: 1, excite: 0.15, goalExcite: 0, testInput: null, paused: false, lastCount: 9, ballGlow: 0, overShown: false, replay: null, intro: null, victory: null, pendingGoal: null, said: {} };
const rec = new Recorder(7, 60), ann = new Announcer();
const TEAM_NAME = ["Blue", "Orange"];
const ballQ = new THREE.Quaternion(), prevBallP = new THREE.Vector3(), prevBallQ = new THREE.Quaternion();
function snapshot() {
  for (const v of views) { const c = v.p.car; v.prevP.set(c.pos.x, c.pos.y, c.pos.z); v.prevQ.set(c.q.x, c.q.y, c.q.z, c.q.w); }
  const b = M.world.ball; prevBallP.set(b.pos.x, b.pos.y, b.pos.z); prevBallQ.copy(ballQ);
}
// the Arcade's play counter: +1 the first time a match or lesson starts on this visit (nothing about the student is sent)
function countPlay() { if (G.counted) return; G.counted = true; try { if (window.PlayCount) window.PlayCount.hit("turbo-league"); } catch (e) { /* counter is optional */ } }
function toggleFullscreen() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {}); } catch (e) { /* not supported */ } }
function newMatch(opts, mode) {
  if (mode !== "free" && mode !== "watch") countPlay();
  if (mode !== "local") G.split = null;
  G.lesson = null; $("lessonHud").hidden = true; G.ceremony = null; trophyStage.visible = false; ballMesh.visible = true; ballBlob.visible = true;
  M = new Match(Object.assign({ seed: (Math.random() * 1e9) | 0 }, opts));
  G.mode = mode; focus = Math.max(0, humanIdx()); G.overShown = false; G.lastCount = 9; G.acc = 0; G.atMenu = false; G.careerDone = false; G.track = { behind: false, aerial: 0, kph: 0 };
  buildViews(); ballQ.identity(); snapshot();
  for (const id of ["title", "setup", "result", "pause", "local"]) $(id).hidden = true;
  $("hud").hidden = false; G.screen = "game"; G.paused = false;
  $("hint").style.opacity = mode === "watch" ? 0 : 0.75;
  $("watchTag").hidden = mode !== "watch";
  updateScore(); updateScreen(); Audio.init(); Audio.uiClick(); Audio.music(null);
  rec.clear(); G.replay = null; G.victory = null; G.pendingGoal = null; G.said = {}; $("replayTag").hidden = true; $("hud").classList.remove("cine");
  G.intro = mode !== "free" && mode !== "online" && S.intro ? { t: 0, dur: 4.6 } : null; G.netMenu = false;
  if (G.intro) {
    $("hud").classList.add("cine");
    const b = M.players.filter((p) => p.team === 0), o = M.players.filter((p) => p.team === 1), lv = (ps) => (ps.find((p) => p.level !== null) ? LEVELS[ps.find((p) => p.level !== null).level].name : "");
    if (G.mode === "cup") { const C = G.cup, f = G.cupFixture, opp = teamById(C, f.home === "you" ? f.away : f.home), you = teamById(C, "you"); banner(`${you.short}  vs  ${opp.short}`, "intro", `${you.name}  vs  ${opp.name} • ${stageLabel(C, f)} • ${THEMES[stadium.id].name}`); comment(f.stage === "final" ? "This is it. The final of the Mr. Watford Championship Cup!" : ann.say("intro")); }
    else banner("BLUE  vs  ORANGE", "intro", `${THEMES[stadium.id].name.toUpperCase()} • ${M.o.size}v${M.o.size} EXHIBITION • ${b.map((p) => p.name).join(", ")}  vs  ${o.map((p) => p.name).join(", ")} • ${lv(o)}`);
    comment(ann.say("intro"));
  }
}
function startFree() { setArena(S.exh.arena); newMatch({ size: 1, freePlay: true, opponents: false, humans: [0], length: 0 }, "free"); }
function startExhibition() {
  const e = S.exh; setArena(e.arena);
  newMatch({ size: e.size, length: e.length, humans: e.watch ? [] : [0], blueLevel: e.mate, orangeLevel: e.opp }, e.watch ? "watch" : "match");
}
function resetPlayer() { const p = M.players[humanIdx()]; if (p) { p.car.place(0, -30, 0); snapshot(); } }
function updateScore() {
  $("scoreB").textContent = M.world.score[0]; $("scoreO").textContent = M.world.score[1];
  const named = !!M.o.teamTags; $("tagB").hidden = $("tagO").hidden = !named;
  if (named) { $("tagB").textContent = M.o.teamTags[0].short; $("tagO").textContent = M.o.teamTags[1].short; $("tagB").style.background = M.o.teamTags[0].primary; $("tagO").style.background = M.o.teamTags[1].primary; $("tagB").style.color = M.o.teamTags[0].accent; $("tagO").style.color = M.o.teamTags[1].accent; }
}
function clockLabel() { return G.mode === "free" ? "FREE PLAY" : M.clockText(); }
function updateScreen(flash) {
  if (G.lesson && !flash) flash = { text: "ACADEMY", color: "#ffc23a", sub: G.lesson.def.title.toUpperCase() };
  drawScreen(stadium.screen.canvas, { score: M ? M.world.score : [0, 0], clock: M && G.mode !== "free" ? M.clockText() : "FREE", sub: G.mode === "free" ? `FREE PLAY • ${THEMES[stadium.id].name.toUpperCase()}` : G.mode === "cup" ? `MR. WATFORD CHAMPIONSHIP CUP • ${stageLabel(G.cup, G.cupFixture).toUpperCase()}` : G.mode === "local" ? `LOCAL 2 PLAYER • ${THEMES[stadium.id].name.toUpperCase()}` : `EXHIBITION ${M.o.size}v${M.o.size} • ${THEMES[stadium.id].name.toUpperCase()}`, flash });
  stadium.screen.tex.needsUpdate = true;
}
function banner(text, cls, sub = "") { $("bigText").textContent = text; $("bigText").className = "big " + cls; $("bigSub").textContent = sub; $("bigWrap").hidden = false; }

// ---------- events from the match ----------
function handleEvents(list) {
  const me = M.players[humanIdx()], cam = camera.position;
  for (const e of list || M.takeEvents()) {
    if (e.type === "ballHit") {
      const near = e.pos ? Math.max(0.15, 1 - cam.distanceTo(e.pos) / 60) : 1;
      fx.hit(new THREE.Vector3(e.pos.x, e.pos.y, e.pos.z), e.strength); Audio.ballHit(e.strength * near); G.ballGlow = 1;
    } else if (e.type === "bounce") Audio.bounce(e.strength * Math.max(0.2, 1 - cam.distanceTo(e.pos) / 70));
    else if (e.type === "carBump") { if (isHumanCar(e.car) || isHumanCar(e.other)) Audio.carBump(e.strength); }
    else if (e.type === "jump") { if (isHumanCar(e.car)) Audio.jump(); }
    else if (e.type === "dodge") { if (isHumanCar(e.car)) Audio.dodge(); }
    else if (e.type === "pad") { fx.padPickup(e.pad, e.big); if (isHumanCar(e.car)) Audio.boostPickup(e.big); }
    else if (e.type === "save") { feed(`${e.player.name} — SAVE!`, e.player.team); comment(ann.say("save", { name: e.player.name })); }
    else if (e.type === "go") { G.lastCount = 0; Audio.countdown(0); banner("GO!", "count"); if (Math.random() < 0.45) comment(ann.say("kickoff")); setTimeout(() => { if (M.state === "play") $("bigWrap").hidden = true; }, 600); }
    else if (e.type === "kickoff") { G.lastCount = 9; updateScreen(); }
    else if (e.type === "overtime") { banner("OVERTIME", "count", "Next goal wins!"); feed("OVERTIME — next goal wins", -1); comment(ann.say("overtime")); }
else if (e.type === "goal") onGoal(e);
else if (e.type === "target") { Audio.boostPickup(true); if (e.pos) fx.padPickup({ x: e.pos.x, z: e.pos.z }, true); }
else if (e.type === "attemptOk") { Audio.countdown(0); toast("Nice!"); snapshot(); }
else if (e.type === "attemptMiss") { Audio.bounce(0.4); coachTip(e.tip || "Missed that one. Next try!"); snapshot(); }
else if (e.type === "lessonRetry") { Audio.whistle(); coachTip(e.tip); snapshot(); }
else if (e.type === "lessonPass") lessonOver(true);
else if (e.type === "lessonFail") lessonOver(false);
else if (e.type === "over") {
  Audio.whistle(); const r = e.result;
  const mvpView = r.mvp ? views[M.players.indexOf(r.mvp)] : null;
  G.victory = { t: 0, a: 0, fw: 0.5, view: mvpView, color: r.winner === 1 ? TEAM[1] : r.winner === 0 ? TEAM[0] : new THREE.Color(1, 0.85, 0.3) };
  $("hud").classList.add("cine"); G.goalExcite = 1;
  if (r.winner >= 0) { banner(`${TEAM_NAME[r.winner].toUpperCase()} WINS!`, "goal " + (r.winner ? "orange" : "blue"), r.mvp ? `MVP: ${r.mvp.name}` : ""); comment(ann.say(Math.abs(r.score[0] - r.score[1]) <= 1 && Math.random() < 0.5 ? "close" : "win", { team: TEAM_NAME[r.winner] })); Audio.music("victory"); }
  else banner("DRAW", "count");
  setTimeout(() => { G.victory = null; $("bigWrap").hidden = true; $("hud").classList.remove("cine"); showResults(); Audio.music("menu"); }, 4600);
}
  }
}
function onGoal(e) {
  updateScore();
  const col = TEAM[e.team];
  fx.goal(new THREE.Vector3(e.pos.x, Math.max(1.5, e.pos.y), e.pos.z), col, S.reducedFlash, boomFor(e));
  const me = M.players[humanIdx()];
  if (me && G.track) { if (e.score[me.team] < e.score[1 - me.team]) G.track.behind = true; if (e.scorer === me) { if (e.aerial) G.track.aerial++; G.track.kph = Math.max(G.track.kph, Math.round(e.speed * 3.6)); } }
  Audio.goal(e.team); G.goalExcite = 1; stadium.celebrate(Math.sign(e.pos.z) || 1, G.t, S.reducedFlash);
  const kph = Math.round(e.speed * 3.6);
  const who = e.scorer ? (e.scorer.human ? "YOU SCORED!" : `${e.scorer.name} scores!`) : e.ownGoal ? "Own goal" : "";
  banner(e.ownGoal && !e.scorer ? "OWN GOAL" : "GOAL!", "goal " + (e.team ? "orange" : "blue"), `${who}${e.assist ? ` • assist ${e.assist.name}` : ""} • ${kph} km/h`);
  if (!G.lesson) { comment(ann.goal(e, TEAM_NAME[e.team])); if (S.replays && G.mode !== "online") G.pendingGoal = e; }
  feed(`${e.scorer ? e.scorer.name : "Own goal"} ${e.assist ? `(assist ${e.assist.name}) ` : ""}— ${kph} km/h`, e.team);
  updateScreen({ text: "GOAL!", color: e.team ? "#ff9a4a" : "#5aa0ff", sub: e.scorer ? e.scorer.name.toUpperCase() : `${kph} KM/H` });
  if (!S.reducedFlash) for (let i = 0; i < 6; i++) setTimeout(() => fx.firework(new THREE.Vector3((Math.random() - 0.5) * 70, 24 + Math.random() * 6, Math.sign(e.pos.z) * (40 + Math.random() * 20)), Math.random() < 0.6 ? col : new THREE.Color(1, 0.85, 0.3)), 300 + i * 380);
}
function feed(text, team) {
  const d = document.createElement("div"); d.className = "feedItem " + (team === 0 ? "blue" : team === 1 ? "orange" : ""); d.textContent = text;
  $("feed").prepend(d); setTimeout(() => d.remove(), 5000);
  while ($("feed").children.length > 4) $("feed").lastChild.remove();
}
function showResults() {
  if (G.overShown || !M.result) return; G.overShown = true;
  const r = M.result, me = M.players[humanIdx()];
  $("resultTitle2").textContent = r.winner < 0 ? "DRAW" : me ? (r.winner === me.team ? "VICTORY!" : "DEFEAT") : r.winner === 0 ? "BLUE WINS" : "ORANGE WINS";
  $("resultTitle2").className = r.winner === 0 ? "blueText" : r.winner === 1 ? "orangeText" : "";
  $("resultScore").innerHTML = `<span class="blueText">${r.score[0]}</span> – <span class="orangeText">${r.score[1]}</span>${r.overtime ? ' <small>OT</small>' : ""}`;
  const rows = M.players.slice().sort((a, b) => a.team - b.team || b.stats.score - a.stats.score).map((p) =>
    `<tr class="${p.team ? "orange" : "blue"}${p.human ? " me" : ""}"><td>${r.mvp === p ? "★ " : ""}${p.name}${p.level !== null ? ` <small>${LEVELS[p.level].name}</small>` : ""}</td><td>${p.stats.score}</td><td>${p.stats.goals}</td><td>${p.stats.assists}</td><td>${p.stats.saves}</td><td>${p.stats.shots}</td></tr>`).join("");
  $("resultTable").innerHTML = `<tr><th>Player</th><th>Score</th><th>Goals</th><th>Assists</th><th>Saves</th><th>Shots</th></tr>${rows}`;
  $("resultMvp").textContent = r.mvp ? `MVP: ${r.mvp.name}` : "";
  const cupMode = G.mode === "cup";
  $("again").hidden = $("changeSetup").hidden = $("resultTitle").hidden = cupMode; $("cupContinue").hidden = !cupMode;
  const online = G.mode === "online"; $("netLobby").hidden = !online; if (online) $("again").hidden = $("changeSetup").hidden = true;
  if (cupMode && me) $("resultTitle2").textContent = r.winner < 0 ? "DRAW" : r.winner === me.team ? "VICTORY!" : "DEFEAT";
  $("resultXp").hidden = true;
  if (G.mode === "local" && G.split) { const P1 = M.players[G.split.idx[0]], P2 = M.players[G.split.idx[1]];
    $("resultTitle2").textContent = r.winner < 0 ? "DRAW" : G.split.versus ? (r.winner === P1.team ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!") : r.winner === P1.team ? "VICTORY!" : "DEFEAT";
    $("resultXp").innerHTML = `<div class="rxTop"><span>LOCAL 2-PLAYER</span></div><div class="rxNew">Local matches don't count toward the Career — one computer can't tell who is playing.</div>`; $("resultXp").hidden = false; }
  if (me && (G.mode === "match" || G.mode === "online" || cupMode) && !G.careerDone) {
    G.careerDone = true; const T = G.track || {};
    const opp = G.mode === "online" ? `Online vs ${M.players.filter((p) => p.team !== me.team && p.human).map((p) => p.name).join(", ") || "computers"}` : cupMode ? (() => { const f = G.cupFixture; return teamById(G.cup, f.home === "you" ? f.away : f.home).name; })() : `${LEVELS[M.o.orangeLevel ?? 1].name} ${M.o.size}v${M.o.size}`;
    const res = recordMatch(PR, { won: r.winner === me.team, draw: r.winner < 0, goals: me.stats.goals, assists: me.stats.assists, saves: me.stats.saves, shots: me.stats.shots, mvp: r.mvp === me, overtime: r.overtime, score: [r.score[me.team], r.score[1 - me.team]], wasBehind: T.behind, aerialGoals: T.aerial, topGoalKph: T.kph, arena: stadium.id, mode: cupMode ? "cup" : G.mode === "online" ? "online" : "match", opponent: opp }, { now: Date.now(), extra: AP.unlocks }, MAXES);
    saveProfile(); xpPanel($("resultXp"), res); celebrate(res);
  }
  $("result").hidden = false; $("hud").hidden = true;
}

// ---------- announcer box ----------
let commentT = 0;
function comment(text) { if (!text) return; const el = $("comment"); el.textContent = text; el.hidden = false; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show"); commentT = 3.6; }

// ---------- instant replay ----------
function startReplay(goal) {
  if (rec.frames.length < 30) return;
  const R = planReplay(rec.frames.slice(), goal); R.goal = goal; R.flags = M.players.map((p) => ({ b: p.car.boosting, s: p.car.supersonic, sl: p.car.sliding }));
  R.scorerIdx = goal.scorer ? M.players.indexOf(goal.scorer) : -1; R.sign = Math.sign(goal.pos.z) || 1; R.boom = false; R.camInit = false;
  G.replay = R; G.acc = 0;
  $("replayTag").hidden = false; $("hud").classList.add("cine"); $("bigWrap").hidden = true;
  const kph = Math.round(goal.speed * 3.6);
  $("replayWho").textContent = goal.scorer ? `${goal.scorer.name}${goal.assist ? `  •  assist ${goal.assist.name}` : ""}  •  ${kph} km/h` : `Own goal  •  ${kph} km/h`;
  updateScreen({ text: "REPLAY", color: "#ffffff", sub: goal.scorer ? goal.scorer.name.toUpperCase() : "" });
  Audio.whoosh();
}
function endReplay() {
  const R = G.replay; if (!R) return;
  M.players.forEach((p, i) => { p.car.boosting = R.flags[i].b; p.car.supersonic = R.flags[i].s; p.car.sliding = R.flags[i].sl; });
  G.replay = null; $("replayTag").hidden = true; $("hud").classList.remove("cine"); snapshot(); Audio.whoosh(); updateScreen();
}
function skipCinematic() { if (G.replay) endReplay(); else if (G.intro) { G.intro = null; $("bigWrap").hidden = true; $("hud").classList.remove("cine"); } }
const rq = new THREE.Quaternion(), rq2 = new THREE.Quaternion();
function poseReplay(dtR) {
  const R = G.replay, s = sample(R.frames, R.t); if (!s) return;
  const { a, b, k } = s, span = Math.max(1e-6, b.t - a.t);
  views.forEach((v, i) => {
    const o = i * STRIDE, g = v.model.group;
    g.position.set(a.cars[o] + (b.cars[o] - a.cars[o]) * k, a.cars[o + 1] + (b.cars[o + 1] - a.cars[o + 1]) * k, a.cars[o + 2] + (b.cars[o + 2] - a.cars[o + 2]) * k);
    rq.set(a.cars[o + 3], a.cars[o + 4], a.cars[o + 5], a.cars[o + 6]); rq2.set(b.cars[o + 3], b.cars[o + 4], b.cars[o + 5], b.cars[o + 6]);
    g.quaternion.slerpQuaternions(rq, rq2, k); g.updateMatrixWorld();
    const f = a.cars[o + 7], sp = Math.hypot(b.cars[o] - a.cars[o], b.cars[o + 2] - a.cars[o + 2]) / span;
    v.p.car.boosting = !!(f & 1); v.p.car.supersonic = !!(f & 2); v.p.car.sliding = false;
    v.model.spinTo(sp * dtR / 0.186, a.cars[o + 8]);
    v.model.tailMat.emissiveIntensity = 2.6;
    v.blob.position.set(g.position.x, 0.015, g.position.z); v.blob.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); v.blob.material.opacity = THREE.MathUtils.clamp(1 - (g.position.y - 0.35) / 4, 0, 1) * 0.6;
    v.vel = new THREE.Vector3(b.cars[o] - a.cars[o], b.cars[o + 1] - a.cars[o + 1], b.cars[o + 2] - a.cars[o + 2]).divideScalar(span);
  });
  ballP.set(a.ball[0] + (b.ball[0] - a.ball[0]) * k, a.ball[1] + (b.ball[1] - a.ball[1]) * k, a.ball[2] + (b.ball[2] - a.ball[2]) * k);
  rq.set(a.ball[3], a.ball[4], a.ball[5], a.ball[6]); rq2.set(b.ball[3], b.ball[4], b.ball[5], b.ball[6]);
  ballMesh.position.copy(ballP); ballMesh.quaternion.slerpQuaternions(rq, rq2, k);
}
function replayCamera(dt) {
  const R = G.replay, shot = shotAt(R, R.t), sv = R.scorerIdx >= 0 ? views[R.scorerIdx] : null;
  let pos, look, fov = 80;
  if (shot[2] === "chase" && sv) {
    const c = sv.model.group.position, to = new THREE.Vector3(ballP.x - c.x, 0, ballP.z - c.z);
    if (to.lengthSq() < 0.5) to.set(0, 0, R.sign); to.normalize();
    pos = c.clone().addScaledVector(to, -4.2).add(new THREE.Vector3(0, 1.7, 0)); look = c.clone().lerp(ballP, 0.5);
  } else if (shot[2] === "goal") {
    pos = new THREE.Vector3(THREE.MathUtils.clamp(ballP.x * 0.3, -4, 4), 2.6, R.sign * (ARENA.hz + ARENA.goalD - 0.8)); look = ballP.clone(); fov = 72;
  } else { // "tv": from high on the side line, tracking the ball
    const side = ballP.x > 0 ? -1 : 1;
    pos = new THREE.Vector3(side * (ARENA.hx - 4), 8.5, ballP.z - R.sign * 9); look = ballP.clone(); fov = 58;
  }
  if (!R.camInit || R.lastShot !== shot[2]) { camera.position.copy(pos); R.camInit = true; R.lastShot = shot[2]; }
  else camera.position.lerp(pos, 1 - Math.exp(-dt * 6));
  camera.up.set(0, 1, 0); camera.fov = fov; camera.lookAt(look); camera.updateProjectionMatrix();
}
function introCamera(dt) {
  const I = G.intro, u = THREE.MathUtils.smoothstep(I.t / I.dur, 0, 1);
  const car = (views[focus] || views[0]).model.group.position;
  const behind = car.clone().add(new THREE.Vector3(0, 1.2, car.z < 0 ? -3.2 : 3.2));
  const P = [new THREE.Vector3(55, 34, 75), new THREE.Vector3(-60, 22, 25), new THREE.Vector3(-25, 6, car.z * 1.6), behind];
  const v = (1 - u), pos = P[0].clone().multiplyScalar(v * v * v).addScaledVector(P[1], 3 * v * v * u).addScaledVector(P[2], 3 * v * u * u).addScaledVector(P[3], u * u * u);
  camera.position.copy(pos); camera.up.set(0, 1, 0); camera.fov = 62 + u * 18;
  camera.lookAt(new THREE.Vector3(0, 0, 0).lerp(car, u)); camera.updateProjectionMatrix();
}
function victoryCamera(dt) {
  const V = G.victory; V.t += dt; V.a += dt * 0.45;
  const c = V.view ? V.view.model.group.position : ballP;
  camera.position.set(c.x + Math.sin(V.a) * 5.5, c.y + 1.6 + Math.sin(V.t * 0.6) * 0.3, c.z + Math.cos(V.a) * 5.5);
  camera.up.set(0, 1, 0); camera.fov = 60; camera.lookAt(c.x, c.y + 0.3, c.z); camera.updateProjectionMatrix();
  V.fw -= dt; if (V.fw <= 0 && !S.reducedFlash) { V.fw = 0.35; fx.firework(new THREE.Vector3((Math.random() - 0.5) * 70, 22 + Math.random() * 10, (Math.random() - 0.5) * 100), V.color); }
}

// ---------- THE MR. WATFORD CHAMPIONSHIP CUP ----------
const CKEY = "turbo-league-cup", HKEY = "turbo-league-hall";
const loadJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; } catch (e) { return d; } };
const saveCup = () => { try { if (G.cup) localStorage.setItem(CKEY, JSON.stringify(G.cup)); else localStorage.removeItem(CKEY); } catch (e) { /* storage blocked */ } };
G.cup = cleanCup(loadJSON(CKEY, null)); G.cupTab = "groups";
let HALL = cleanHall(loadJSON(HKEY, []));

// ---------- CAREER + GARAGE (saved on this device only: no names, no accounts) ----------
const PKEY = "turbo-league-profile";
const PR = loadProfile(loadJSON(PKEY, null));
const MAXES = { lessonStars: LESSONS.length * 3 };
const saveProfile = () => { try { localStorage.setItem(PKEY, JSON.stringify(PR)); } catch (e) { /* storage blocked */ } };
if (!PR.created) PR.created = Date.now();
{ // first run: count Academy/Cup progress made before the career existed, and keep rewards already equipped
  const r = backfill(PR, { lessonStars: Object.values(AP.done).reduce((a, b) => a + b, 0), lessonsDone: Object.values(AP.done).filter((v) => v > 0).length, tiersDone: TIERS.filter((_, ti) => tierComplete(ti, AP.done)).length, cupsWon: HALL.filter((h) => h.playerWon).length, cupsPlayed: HALL.length, unlocks: AP.unlocks }, MAXES);
  if (r) { if (AP.paint === "paint-gold") PR.loadout.finish = "gold"; if (AP.rims === "rims-gold") PR.loadout.rimColor = "gold"; if (AP.trail) PR.loadout.trail = AP.trail; }
}
cleanLoadout(PR, AP.unlocks); saveProfile();
const owns = (it) => itemUnlocked(PR, it, AP.unlocks);
const boomFor = (e) => (e && e.scorer && e.scorer.human ? PR.loadout.boom : "classic");

// --- pop-ups: achievements, level-ups, new garage items (one at a time) ---
const popQ = []; let popBusy = false;
function pop(icon, head, title, text) { popQ.push({ icon, head, title, text }); if (!popBusy) nextPop(); }
function nextPop() {
  const p = popQ.shift(), el = $("achPop"); if (!p) { popBusy = false; return; }
  popBusy = true; el.querySelector(".apIcon").textContent = p.icon; $("apHead").textContent = p.head; $("apTitle").textContent = p.title; $("apText").textContent = p.text;
  el.classList.add("show"); Audio.boostPickup(true);
  setTimeout(() => { el.classList.remove("show"); setTimeout(nextPop, 500); }, 3200);
}
function celebrate(res) {
  if (!res) return;
  for (const l of res.levelUps || []) pop("⬆️", "LEVEL UP", `Level ${l} — ${titleFor(l)}`, "New items may be waiting in the Garage!");
  for (const id of res.achievements || []) { const a = achievementById(id); pop(a.icon, "ACHIEVEMENT UNLOCKED", a.name, a.text); }
  const u = res.unlocked || [];
  if (u.length > 2) pop("🔓", "NEW IN YOUR GARAGE", `${u.length} new items`, u.map((x) => x.name).join(", "));
  else for (const x of u) pop("🔓", "NEW IN YOUR GARAGE", x.name, `New ${SLOT_NAME[x.slot] || x.slot} unlocked`);
  drawTitleCard();
}
const SLOT_NAME = { body: "car", finish: "paint finish", decal: "decal", rims: "wheel design", rimColor: "wheel colour", tires: "tires", trail: "boost trail", boom: "goal explosion", topper: "topper", antenna: "antenna", engine: "engine sound", banner: "player banner" };
function xpPanel(el, res) {
  const li = levelInfo(PR.xp), before = levelInfo(PR.xp - res.xp);
  el.innerHTML = `<div class="rxTop"><span>CAREER • Level ${li.level} ${titleFor(li.level)}</span><b>+${res.xp} XP</b></div><div class="rxChips">${res.breakdown.map(([k, v]) => `<span>${esc(k)} +${v}</span>`).join("")}</div><div class="xpBar"><div style="width:${res.levelUps.length ? 0 : Math.round(before.frac * 100)}%"></div></div><div class="rxNew">${li.level >= MAX_LEVEL ? "Max level reached!" : `${li.need - li.into} XP to level ${li.level + 1}`}${res.levelUps.length ? `<div>⬆️ <b>Level up!</b> You reached level ${li.level}.</div>` : ""}${res.achievements.map((id) => { const a = achievementById(id); return `<div>${a.icon} <b>${esc(a.name)}</b> — ${esc(a.text)}</div>`; }).join("")}${res.unlocked.length ? `<div>🔓 New in your Garage: ${res.unlocked.map((u) => esc(u.name)).join(", ")}</div>` : ""}</div>`;
  el.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => { const bar = el.querySelector(".xpBar > div"); if (bar) bar.style.width = `${Math.round(li.frac * 100)}%`; }));
}

// --- player banner (drawn on a canvas; shows level and title, never a real name) ---
function drawBanner(c, style = PR.loadout.banner, compact = false) {
  const g = c.getContext("2d"), W = c.width, H = c.height, li = levelInfo(PR.xp), L = PR.loadout;
  g.clearRect(0, 0, W, H);
  const bg = g.createLinearGradient(0, 0, W, H);
  const pal = { classic: [L.paint, "#0a0e16"], lightning: ["#1b1f2e", "#07080c"], starfield: ["#120a2a", "#02030a"], academy: ["#0f2350", "#081022"], champion: ["#6b4a08", "#1a1204"] }[style] || [L.paint, "#0a0e16"];
  bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[1]); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  if (style === "classic") { g.fillStyle = L.accent; g.globalAlpha = 0.55; for (const x of [0.62, 0.68]) { g.beginPath(); g.moveTo(W * x, 0); g.lineTo(W * (x + 0.04), 0); g.lineTo(W * (x - 0.12), H); g.lineTo(W * (x - 0.16), H); g.fill(); } g.globalAlpha = 1; }
  if (style === "lightning") { g.strokeStyle = "#ffd23a"; g.lineWidth = H * 0.03; g.shadowColor = "#ffd23a"; g.shadowBlur = 18; for (const x0 of [0.55, 0.8]) { g.beginPath(); let x = W * x0, y = 0; g.moveTo(x, y); while (y < H) { x += (rnd() - 0.5) * W * 0.08; y += H * 0.18; g.lineTo(x, y); } g.stroke(); } g.shadowBlur = 0; }
  if (style === "starfield") for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; const r = rnd() * 2 + 0.5; g.beginPath(); g.arc(rnd() * W, rnd() * H, r * H / 160, 0, 7); g.fill(); }
  if (style === "academy") { g.fillStyle = "rgba(255,194,58,.18)"; g.font = `${H * 0.9}px system-ui`; g.textAlign = "right"; g.textBaseline = "middle"; g.fillText("🎓", W * 0.98, H * 0.55); }
  if (style === "champion") { const r = g.createRadialGradient(W * 0.85, H * 0.5, 0, W * 0.85, H * 0.5, H); r.addColorStop(0, "rgba(255,220,120,.6)"); r.addColorStop(1, "rgba(255,220,120,0)"); g.fillStyle = r; g.fillRect(0, 0, W, H); g.font = `${H * 0.7}px system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("🏆", W * 0.86, H * 0.52); }
  // level badge
  const cx = H * 0.5, cy = H * 0.5, R = H * 0.36;
  g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.arc(cx, cy, R * 1.08, 0, 7); g.fill();
  g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = R * 0.14; g.beginPath(); g.arc(cx, cy, R * 0.92, 0, 7); g.stroke();
  g.strokeStyle = "#ffc23a"; g.beginPath(); g.arc(cx, cy, R * 0.92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * li.frac); g.stroke();
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 ${R * 0.95}px "Russo One", system-ui`; g.fillText(li.level, cx, cy + R * 0.04);
  g.textAlign = "left"; g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 8;
  g.font = `italic 900 ${H * 0.25}px "Russo One", system-ui`; g.fillText(titleFor(li.level).toUpperCase(), H * 1.02, H * 0.36);
  g.font = `700 ${H * 0.14}px system-ui`; g.fillStyle = "rgba(255,255,255,.85)";
  g.fillText(compact ? `Level ${li.level} • ${PR.stats.wins} wins • ${Object.keys(PR.achievements).length}/${ACHIEVEMENTS.length} achievements` : `LEVEL ${li.level} • ${BODIES[L.body].name.toUpperCase()} • ${PR.stats.wins} WINS • ${PR.stats.goals} GOALS`, H * 1.02, H * 0.62);
  g.font = `600 ${H * 0.11}px system-ui`; g.fillStyle = "rgba(255,255,255,.6)"; g.fillText(li.level >= MAX_LEVEL ? "MAX LEVEL" : `${li.into} / ${li.need} XP to level ${li.level + 1}`, H * 1.02, H * 0.82);
  g.shadowBlur = 0;
}
function drawTitleCard() {
  const el = $("titleCard"); if (!el) return;
  let c = el.querySelector("canvas"); if (!c) { c = document.createElement("canvas"); c.width = 680; c.height = 160; el.appendChild(c); }
  drawBanner(c, PR.loadout.banner, true);
}

// --- the Garage screen ---
let garage = null; const GT = { tab: "body" }; G.rev = 0;
const CAR_SLOTS = ["body", "finish", "decal", "rims", "rimColor", "tires", "topper", "antenna", "paint", "accent"];
function openGarage() {
  for (const id of ["title", "career", "result", "controls", "hall", "cupWin"]) $(id).hidden = true;
  G.garageFrom = G.screen;
  if (!garage) { garage = new Garage(renderer, Q); garage.resize(innerWidth, innerHeight); }
  garage.setLight(PR.loadout.light || "showroom"); garage.setTrophy(PR.unlocks.includes("trophy-garage") || AP.unlocks.includes("trophy-garage"));
  garage.setCar(loadoutCar(PR.loadout)); garage.attach(canvas); garage.idle = 9;
  G.screen = "garage"; $("hud").hidden = true; for (const v of views) v.tag.style.display = "none";
  Audio.setEngine(PR.loadout.engine); renderGarage(); $("garage").hidden = false;
}
function closeGarage() {
  garage.detach(); $("garage").hidden = true;
  if (G.atMenu) { if (G.garageFrom === "career") showCareer(); else showTitle(); } else location.reload();
}
function garageFrame(dt) {
  garage.frame(dt); G.rev = Math.max(0, G.rev - dt);
  const k = G.rev > 0 ? Math.sin(Math.min(1, (1.8 - G.rev) / 1.8) * Math.PI) : 0;
  Audio.update(dt, { musicOnly: true, engineDemo: G.rev > 0, speed: k * 21, throttle: G.rev > 0.3 ? 1 : 0 });
  garage.render(post, G.t);
}
function equip(slot, id) {
  const list = GARAGE[slot], it = list && list.find((x) => x.id === id);
  if (list && (!it || !owns(it))) return;
  if (PR.loadout[slot] === id) return;
  PR.loadout[slot] = id; saveProfile();
  if (CAR_SLOTS.includes(slot)) garage.setCar(loadoutCar(PR.loadout));
  if (slot === "engine") { Audio.setEngine(id); G.rev = 1.8; }
  if (!PR.achievements.garage_fresh) celebrate(recordGarage(PR, { now: Date.now(), extra: AP.unlocks })), saveProfile();
  renderGarage();
}
function renderGarage() {
  const L = PR.loadout, li = levelInfo(PR.xp);
  $("gLevel").textContent = `Level ${li.level} • ${titleFor(li.level)}`;
  const tabs = [["body", "Car"], ["paint", "Paint"], ["wheels", "Wheels"], ["extras", "Toppers"], ["effects", "Effects"], ["banner", "Banner"]];
  $("gTabs").innerHTML = tabs.map(([k, n]) => `<button data-gtab="${k}" class="${GT.tab === k ? "on" : ""}">${n}</button>`).join("");
  const items = (slot, label, extra = () => "") => `<h4>${label}</h4><div class="gGrid">${GARAGE[slot].map((it) => { const ok = owns(it); return `<button class="gItem${L[slot] === it.id ? " on" : ""}" data-gear="${slot}:${it.id}" ${ok ? "" : "disabled"}>${extra(it)}${esc(it.name)}${ok ? (it.about ? `<small>${esc(it.about)}</small>` : "") : `<small>🔒 ${esc(reqText(it))}</small>`}</button>`; }).join("")}</div>`;
  const sw = (key, list) => `<div class="gSw">${list.map((c) => `<button data-gear="${key}:${c}" class="${L[key] === c ? "on" : ""}" style="background:${c}" aria-label="colour ${c}"></button>`).join("")}<label>Any colour <input type="color" id="g_${key}" value="${L[key]}"></label></div>`;
  const trailChip = (it) => { const c = TRAIL_COLORS[it.id]; return c ? `<span class="chipC" style="color:rgb(${c.map((v) => Math.min(255, v * 70) | 0).join(",")});background:currentColor"></span>` : ""; };
  let h = "";
  if (GT.tab === "body") h = items("body", "CAR BODY") + `<p class="gNote">Every car has exactly the same hitbox, speed and handling — only the looks change. Tick “Show hitbox” to see it.</p>`;
  if (GT.tab === "paint") h = `<h4>MAIN PAINT</h4>${sw("paint", PAINTS)}<h4>ACCENT COLOUR</h4>${sw("accent", ACCENTS)}` + items("finish", "FINISH") + items("decal", "DECAL") + (L.finish === "gold" ? `<p class="gNote">⚠️ Champion Gold covers your main paint — pick another finish to see your colour.</p>` : "") + `<p class="gNote">In Cup matches your car wears your Cup team's colours.</p>`;
  if (GT.tab === "wheels") h = items("rims", "WHEEL DESIGN") + items("rimColor", "WHEEL COLOUR") + items("tires", "TIRES");
  if (GT.tab === "extras") h = items("topper", "TOPPER") + items("antenna", "ANTENNA");
  if (GT.tab === "effects") h = items("trail", "BOOST TRAIL", trailChip) + items("boom", "GOAL EXPLOSION") + `<p class="gNote">Your goal explosion goes off whenever you score.</p>` + items("engine", "ENGINE SOUND") + `<p class="gNote">Press 🔊 REV ENGINE to hear it.</p>`;
  if (GT.tab === "banner") h = items("banner", "PLAYER BANNER") + `<canvas id="gBanner" width="680" height="160"></canvas><p class="gNote">Your banner shows your level and title — never your real name.</p>`;
  $("gBody").innerHTML = h;
  if (GT.tab === "banner") drawBanner($("gBanner"), L.banner, true);
  $("gLights").innerHTML = Object.entries(LIGHTS).map(([k, v]) => `<button data-glight="${k}" class="${(L.light || "showroom") === k ? "on" : ""}">${v.name}</button>`).join("");
  $("gHitbox").checked = !!garage.hitbox.visible;
}
document.addEventListener("change", (e) => {
  if (e.target.id === "g_paint" || e.target.id === "g_accent") { const k = e.target.id.slice(2); PR.loadout[k] = e.target.value; saveProfile(); garage.setCar(loadoutCar(PR.loadout)); renderGarage(); }
  if (e.target.id === "gHitbox") garage.showHitbox(e.target.checked);
});

// --- the Career screen ---
G.crTab = "stats";
function showCareer() {
  hideAll(); G.screen = "career"; Audio.music("menu");
  const li = levelInfo(PR.xp), st = PR.stats;
  drawBanner($("crBanner"));
  $("crLevel").textContent = `LEVEL ${li.level}`; $("crXpText").textContent = li.level >= MAX_LEVEL ? "MAX" : `${li.into} / ${li.need} XP`;
  $("crXpFill").style.width = `${Math.round(li.frac * 100)}%`;
  const tabs = [["stats", "Stats"], ["ach", `Achievements ${Object.keys(PR.achievements).length}/${ACHIEVEMENTS.length}`], ["recent", "Recent matches"], ["next", "Coming up"]];
  $("crTabs").innerHTML = tabs.map(([k, n]) => `<button data-crtab="${k}" class="${G.crTab === k ? "on" : ""}">${n}</button>`).join("");
  let h = "";
  if (G.crTab === "stats") {
    const pct = st.matches ? Math.round((100 * st.wins) / st.matches) : 0;
    const cells = [["Matches", st.matches], ["Wins", st.wins], ["Losses", st.losses], ["Draws", st.draws], ["Win rate", pct + "%"], ["Goals", st.goals], ["Assists", st.assists], ["Saves", st.saves], ["Shots", st.shots], ["MVPs", st.mvps], ["Aerial goals", st.aerialGoals], ["Fastest goal", st.topGoalKph ? st.topGoalKph + " km/h" : "—"], ["Cups won", `${st.cupsWon} / ${st.cupsPlayed}`], ["Lessons done", st.lessonsDone], ["Lesson stars", `${st.lessonStars} / ${MAXES.lessonStars}`], ["Arenas played", `${st.arenas.length} / 5`]];
    h = `<div class="crStats">${cells.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join("")}</div><p class="note">XP comes from playing matches (more for wins, goals, saves…), new Academy stars and the Championship Cup. Free Play and watching don't give XP.</p>`;
  } else if (G.crTab === "ach") h = `<div class="crAch">${ACHIEVEMENTS.map((a) => { const got = PR.achievements[a.id]; return `<div class="${got ? "got" : ""}"><i>${a.icon}</i><span><b>${esc(a.name)}</b><small>${esc(a.text)}${got && got > 1 ? ` • ${new Date(got).toLocaleDateString()}` : ""}</small></span></div>`; }).join("")}</div>`;
  else if (G.crTab === "recent") h = PR.history.length ? `<table class="crHist"><tr><th>When</th><th>Match</th><th>Score</th><th>You</th><th>XP</th></tr>${PR.history.slice(0, 12).map((m) => `<tr><td>${m.t ? new Date(m.t).toLocaleDateString() : ""}</td><td>${m.mode === "cup" ? "🏆 " : ""}${esc(m.vs || "")}${m.arena && THEMES[m.arena] ? ` <small>• ${THEMES[m.arena].name}</small>` : ""}</td><td class="${m.won ? "w" : m.draw ? "" : "l"}">${m.won ? "W" : m.draw ? "D" : "L"} ${m.score ? m.score.join("–") : ""}${m.ot ? " OT" : ""}</td><td>${m.goals}G ${m.assists}A ${m.saves}S${m.mvp ? " ★" : ""}</td><td>+${m.xp}</td></tr>`).join("")}</table>` : `<p class="note">No matches yet — play an Exhibition or the Cup!</p>`;
  else {
    const next = Object.entries(GARAGE).flatMap(([slot, list]) => list.filter((it) => !owns(it)).map((it) => ({ slot, ...it }))).sort((a, b) => (a.req.level || 99) - (b.req.level || 99)).slice(0, 12);
    h = next.length ? `<div class="crAch">${next.map((it) => `<div><i>🔒</i><span><b>${esc(it.name)}</b><small>${esc(SLOT_NAME[it.slot])} • ${esc(reqText(it))}</small></span></div>`).join("")}</div>` : `<p class="note">You have unlocked everything. Amazing!</p>`;
  }
  $("crBody").innerHTML = h; $("career").hidden = false;
}
// the title screen: your car parked at centre field, ball beside it
function titleScene() {
  M = new Match({ size: 1, freePlay: true, opponents: false, humans: [0], length: 0 }); G.mode = "free"; G.split = null;
  buildViews();
  M.players[0].car.place(0, -4, Math.PI * 0.85); M.world.ball.pos.set(-1.3, BALL.r, -2.2); snapshot();
}
function showTitle() { hideAll(); G.screen = "title"; titleScene(); drawTitleCard(); $("title").hidden = false; }
const TROPHY_SCREENS = ["cup", "cupCreate", "hall", "cupOpen", "ceremony"];
// the trophy on its podium at centre field (only shown on cup screens and in the ceremony)
const trophyStage = new THREE.Group(); trophyStage.visible = false; scene.add(trophyStage);
const trophy = buildTrophy(); trophy.scale.setScalar(2.6); trophyStage.add(trophy);
{ const pod = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 1.2, 40), new THREE.MeshPhysicalMaterial({ color: 0x0c0d12, metalness: 0.5, roughness: 0.3, clearcoat: 1 })); pod.position.y = 0.6; pod.receiveShadow = true; trophyStage.add(pod);
  const glow = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.05, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.3, 0.8) })); glow.rotation.x = Math.PI / 2; glow.position.y = 1.2; trophyStage.add(glow);
  trophy.position.y = 1.2; }
function showTrophyStage(on) {
  trophyStage.visible = on; ballMesh.visible = !on; ballBlob.visible = !on;
  for (const v of views) { v.model.group.visible = !on || G.screen === "ceremony"; v.blob.visible = v.model.group.visible; v.tag.style.display = "none"; }
}
let tcam = 0;
function trophyCamera(dt) {
  tcam += dt * (G.screen === "cupOpen" ? 0.35 : 0.12);
  const r = G.screen === "cupOpen" ? 24 - Math.min(14, G.cupOpenT * 2) : G.screen === "ceremony" ? 13 : 11;
  const h = G.screen === "cupOpen" ? 16 - Math.min(10, G.cupOpenT * 1.5) : G.screen === "ceremony" ? 4.5 : 4;
  camera.up.set(0, 1, 0); camera.fov = 50;
  camera.position.set(Math.sin(tcam) * r, h, Math.cos(tcam) * r); camera.lookAt(0, G.screen === "ceremony" ? 3.4 : 3.2, 0); camera.updateProjectionMatrix();
}
const hideAll = () => { for (const id of ["title", "setup", "result", "pause", "brief", "lessonDone", "academy", "hud", "lessonHud", "cupCreate", "cupHub", "cupPreview", "cupOpen", "cupWin", "hall", "garage", "career", "local", "online", "lobby"]) $(id).hidden = true; };
const emb = (t, size = 48) => `<img class="emb" src="${emblemURL(t, 128)}" width="${size}" height="${size}" alt="">`;
// --- team creator
const CC = { name: "", short: "", primary: "#1d6dff", accent: "#ffc23a", shape: "shield", glyph: "bolt", size: 2, length: 180, difficulty: 1, mateLevel: 2, home: "championship" };
// where a cup match is played: round 1 at home, then the cup travels; the final is always in the Championship Stadium
function cupVenue(C, f) {
  if (f.stage === "final") return "championship";
  const home = C.home || "championship", list = [home, ...ARENA_LIST.filter((a) => a !== home && a !== "championship"), ...(home !== "championship" ? ["championship"] : [])];
  const i = f.stage === "group" ? f.round - 1 : f.stage === "qf" ? 3 : 4;
  return list[i % list.length];
}
function openCup() { G.atMenu = false; if (G.cup) showHub(); else showCreate(); }
function showCreate() { hideAll(); G.screen = "cupCreate"; showTrophyStage(true); Audio.music("menu"); renderCreate(); $("cupCreate").hidden = false; }
function renderCreate() {
  const seg = (k, opts) => opts.map(([v, label]) => `<button data-cupset="${k}:${v}" class="${String(CC[k]) === String(v) ? "on" : ""}">${label}</button>`).join("");
  const sw = (k) => PALETTE.map((c) => `<button data-cupset="${k}:${c}" class="sw${CC[k] === c ? " on" : ""}" style="background:${c}" aria-label="colour ${c}"></button>`).join("");
  const t = { ...CC, primary: CC.primary, accent: CC.accent };
  $("ccLogoPreview").innerHTML = emb(t, 110);
  $("ccPrimary").innerHTML = sw("primary"); $("ccAccent").innerHTML = sw("accent");
  $("ccShape").innerHTML = SHAPES.map((sh) => `<button data-cupset="shape:${sh}" class="lg${CC.shape === sh ? " on" : ""}">${emb({ ...t, shape: sh, glyph: "none" }, 34)}</button>`).join("");
  $("ccGlyph").innerHTML = GLYPHS.map((gl) => `<button data-cupset="glyph:${gl}" class="lg${CC.glyph === gl ? " on" : ""}">${emb({ ...t, glyph: gl }, 34)}</button>`).join("");
  $("ccSize").innerHTML = seg("size", [[1, "1v1"], [2, "2v2"], [3, "3v3"]]);
  $("ccLength").innerHTML = seg("length", [[180, "3 min"], [300, "5 min"]]);
  $("ccDiff").innerHTML = seg("difficulty", DIFFICULTY.map((d, i) => [i, d.name]));
  $("ccMates").innerHTML = seg("mateLevel", LEVELS.map((l, i) => [i, l.name]));
  $("ccMatesRow").hidden = CC.size === 1;
  $("ccHome").innerHTML = seg("home", ARENA_LIST.map((a) => [a, THEMES[a].name]));
}
function startCup() {
  const name = ($("ccName").value || "").trim().slice(0, 18) || "My Team";
  const short = (($("ccShort").value || "").trim() || name.replace(/[^A-Za-z]/g, "").slice(0, 3) || "YOU").toUpperCase().slice(0, 3);
  G.cup = newCup({ team: { name, short, primary: CC.primary, accent: CC.accent, shape: CC.shape, glyph: CC.glyph }, size: CC.size, length: CC.length, difficulty: CC.difficulty, mateLevel: CC.mateLevel }, (Math.random() * 1e9) | 0);
  G.cup.home = CC.home; saveCup(); startCupIntro();
}
// --- opening ceremony: camera swoops onto the trophy, then the 16 teams appear in their groups
function startCupIntro() {
  hideAll(); G.screen = "cupOpen"; G.cupOpenT = 0; showTrophyStage(true); Audio.music("victory");
  const C = G.cup;
  $("coGroups").innerHTML = C.groups.map((g, gi) => `<div class="coGroup" style="animation-delay:${3.2 + gi * 0.5}s"><h4>GROUP ${"ABCD"[gi]}</h4>${g.map((id) => { const t = teamById(C, id); return `<div class="coTeam${id === "you" ? " you" : ""}">${emb(t, 30)}<span>${esc(t.name)}</span></div>`; }).join("")}</div>`).join("");
  $("cupOpen").hidden = false;
  if (!S.reducedFlash) for (let i = 0; i < 8; i++) setTimeout(() => { if (G.screen === "cupOpen") fx.firework(new THREE.Vector3((Math.random() - 0.5) * 40, 16 + Math.random() * 8, (Math.random() - 0.5) * 40), new THREE.Color(1, 0.8, 0.3)); }, 600 + i * 450);
}
function endCupIntro() { if (G.screen === "cupOpen") showHub(); }
// --- the hub: next match, group tables, bracket, latest results
function showHub(summary) {
  const C = G.cup; if (!C) return showCreate();
  hideAll(); G.screen = "cup"; showTrophyStage(true); Audio.music("menu");
  const you = teamById(C, "you"), f = nextFixture(C), rec = playerRecord(C);
  $("chTeam").innerHTML = `${emb(you, 56)}<div><b>${esc(you.name)}</b><small>${C.size}v${C.size} • ${DIFFICULTY[C.difficulty].name} • W${rec.w} D${rec.d} L${rec.l}</small></div>`;
  $("chStage").textContent = C.stage === "done" ? "CUP FINISHED" : STAGES[C.stage].toUpperCase();
  let next = "";
  if (C.stage === "done") { const ch = teamById(C, C.champion); next = `<div class="chChamp">${emb(ch, 64)}<div><small>CHAMPIONS</small><b>${esc(ch.name)}</b></div></div><div class="actions row2"><button class="btn primary" data-go="hall">HALL OF CHAMPIONS</button><button class="btn" id="cupNew">START A NEW CUP</button></div>`; }
  else if (f) { const opp = teamById(C, f.home === "you" ? f.away : f.home); next = `<p class="chNextLabel">NEXT MATCH • ${esc(stageLabel(C, f))}</p><div class="chVs">${emb(you, 54)}<span>VS</span>${emb(opp, 54)}<div><b>${esc(opp.name)}</b><small>${esc(opp.about)}</small></div></div><div class="actions row2"><button class="btn primary" id="cupPlay">${f.stage === "final" ? "PLAY THE FINAL" : "PLAY MATCH"}</button></div>`; }
  else if (C.eliminated) next = `<p class="chOut">Your run ends in the ${C.stage === "qf" && !C.fixtures.some((x) => x.stage === "qf" && (x.home === "you" || x.away === "you")) ? "group stage" : STAGES[C.fixtures.filter((x) => x.home === "you" || x.away === "you").pop().stage]}. Great effort!</p><div class="actions row2"><button class="btn primary" id="cupSimRest">SEE WHO WINS THE CUP</button><button class="btn" id="cupNew">START A NEW CUP</button></div>`;
  $("chNext").innerHTML = next;
  $("chSummary").innerHTML = summary ? `<h4>THIS ROUND</h4>${[summary.fixture, ...summary.others].map(fxRow).join("")}` : "";
  $("chSummary").hidden = !summary;
  for (const b of document.querySelectorAll("[data-tab]")) b.classList.toggle("on", b.dataset.tab === G.cupTab);
  $("chBody").innerHTML = G.cupTab === "bracket" ? bracketHTML(C) : G.cupTab === "teams" ? teamsHTML(C) : groupsHTML(C);
  $("cupHub").hidden = false;
}
const fxRow = (f) => { const C = G.cup, h = teamById(C, f.home), a = teamById(C, f.away), w = winnerOf(f); return `<div class="fxRow${f.home === "you" || f.away === "you" ? " you" : ""}">${emb(h, 22)}<span class="${w === f.home && f.score[0] !== f.score[1] ? "w" : ""}">${esc(h.short)}</span><b>${f.score[0]} – ${f.score[1]}${f.ot ? " OT" : ""}</b><span class="${w === f.away && f.score[0] !== f.score[1] ? "w" : ""}">${esc(a.short)}</span>${emb(a, 22)}</div>`; };
function groupsHTML(C) {
  return `<div class="chGroups">${C.groups.map((_, gi) => `<table class="chTable"><tr><th colspan="2">GROUP ${"ABCD"[gi]}</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>PTS</th></tr>${standings(C, gi).map((r, i) => { const t = teamById(C, r.id); return `<tr class="${i < 2 ? "adv" : ""}${r.id === "you" ? " you" : ""}"><td>${i + 1}</td><td class="tn">${emb(t, 20)}${esc(t.name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga >= 0 ? "+" : ""}${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`; }).join("")}</table>`).join("")}</div><p class="note">Top two in each group (highlighted) reach the quarterfinals.</p>`;
}
function bracketHTML(C) {
  const box = (f, label) => { if (!f) return `<div class="bx tbd"><div>TBD</div><div>TBD</div><small>${label}</small></div>`; const h = teamById(C, f.home), a = teamById(C, f.away), w = winnerOf(f);
    const row = (t, sc, won) => `<div class="${won ? "w" : ""}${t.id === "you" ? " you" : ""}">${emb(t, 20)}<span>${esc(t.short)}</span><b>${sc ?? ""}</b></div>`;
    return `<div class="bx">${row(h, f.score && f.score[0], w === h.id)}${row(a, f.score && f.score[1], w === a.id)}<small>${label}${f.ot ? " • OT" : ""}</small></div>`; };
  const get = (id) => C.fixtures.find((f) => f.id === id);
  const champ = C.champion ? teamById(C, C.champion) : null;
  return `<div class="bracket"><div class="bcol"><h4>QUARTERFINALS</h4>${[0, 1, 2, 3].map((i) => box(get("qf" + i), ["A1 v B2", "C1 v D2", "B1 v A2", "D1 v C2"][i])).join("")}</div><div class="bcol"><h4>SEMIFINALS</h4>${[0, 1].map((i) => box(get("sf" + i), "Semifinal " + (i + 1))).join("")}</div><div class="bcol"><h4>FINAL</h4>${box(get("final"), "The Final")}</div><div class="bcol champ"><h4>CHAMPION</h4>${champ ? `<div class="bchamp">${emb(champ, 70)}<b>${esc(champ.name)}</b></div>` : `<div class="bchamp">🏆<small>to be decided</small></div>`}</div></div>`;
}
function teamsHTML(C) {
  return `<div class="chTeams">${C.teams.map((t) => `<div class="chTeamCard${t.id === "you" ? " you" : ""}">${emb(t, 40)}<div><b>${esc(t.name)}</b><small>${esc(t.about)}</small><small>Level: ${LEVELS[teamLevel(C, t)].name}${t.id === "you" ? " teammates" : ""}</small></div></div>`).join("")}</div>`;
}
// --- match preview
function showPreview() {
  const C = G.cup, f = nextFixture(C); if (!f) return;
  const you = teamById(C, "you"), opp = teamById(C, f.home === "you" ? f.away : f.home);
  const card = (t) => { const rec = t.id === "you" ? playerRecord(C) : null; const gi = C.groups.findIndex((g) => g.includes(t.id)), pos = standings(C, gi).findIndex((r) => r.id === t.id) + 1;
    return `<div class="pvCard">${emb(t, 96)}<h3>${esc(t.name)}</h3><p>${esc(t.about)}</p><p class="pvMeta">Group ${"ABCD"[gi]} • ${pos}${["st", "nd", "rd", "th"][Math.min(3, pos - 1)]} place${rec ? ` • W${rec.w} D${rec.d} L${rec.l}` : ""}</p><p class="pvMeta">${t.id === "you" ? "Teammates" : "Players"}: ${LEVELS[teamLevel(C, t)].name}</p></div>`; };
  $("pvStage").textContent = f.stage === "final" ? "THE FINAL" : stageLabel(C, f).toUpperCase();
  $("pvStage").className = f.stage === "final" ? "pvStage final" : "pvStage";
  $("pvCards").innerHTML = `${card(you)}<div class="pvVs">VS</div>${card(opp)}`;
  $("pvNote").textContent = `Venue: ${THEMES[cupVenue(C, f)].name} • ` + (f.stage === "group" ? `${C.length / 60}-minute match • a draw is allowed in the group stage` : `${C.length / 60}-minute match • knockout: a tie goes to overtime, next goal wins`);
  hideAll(); $("cupPreview").hidden = false; G.screen = "cup";
}
function startCupMatch() {
  const C = G.cup, f = nextFixture(C); if (!f) return;
  const you = teamById(C, "you"), opp = teamById(C, f.home === "you" ? f.away : f.home);
  const hex = (c) => parseInt(c.slice(1), 16);
  G.cupFixture = f; setArena(cupVenue(C, f)); showTrophyStage(false); trophyStage.visible = false;
  newMatch({ size: C.size, length: C.length, humans: [0], blueLevel: C.mateLevel, orangeLevel: teamLevel(C, opp), styles: [{}, opp.style], allowDraw: f.stage === "group",
    teamNames: [you.drivers, opp.drivers], liveries: [{ primary: hex(you.primary), accent: hex(you.accent), rimColor: 0xc4c8cf }, { primary: hex(opp.primary), accent: hex(opp.accent), rimColor: 0x2b2e35 }],
    teamTags: [you, opp] }, "cup");
  if (f.stage === "final" && !S.reducedFlash) for (let i = 0; i < 6; i++) setTimeout(() => fx.firework(new THREE.Vector3((Math.random() - 0.5) * 60, 22 + Math.random() * 8, (Math.random() - 0.5) * 80), new THREE.Color(1, 0.8, 0.3)), 400 + i * 500);
}
function finishCupMatch() {
  const C = G.cup, f = G.cupFixture; if (!C || !f || !M.result) return;
  const summary = playRound(C, f, { score: [...M.result.score], ot: M.result.overtime, players: M.players.filter((p) => p.team === 0).map((p) => ({ name: p.name, stats: p.stats })) });
  cupFinished(); saveCup(); G.mode = "cupHub";
  if (C.stage === "done" && C.champion === "you") startCeremony(); else showHub(summary);
}
// a finished cup goes into the Hall of Champions (once)
function cupFinished() {
  const C = G.cup; if (!C || C.stage !== "done" || C.hallSaved) return;
  C.hallSaved = true; HALL.unshift(hallEntry(C)); HALL = HALL.slice(0, 60);
  try { localStorage.setItem(HKEY, JSON.stringify(HALL)); } catch (e) { /* ignore */ }
  if (C.champion === "you") for (const id of ["paint-gold", "rims-gold", "trail-champion", "trophy-garage", "banner-champion"]) if (!AP.unlocks.includes(id)) AP.unlocks.push(id);
  saveAP(); saveCup();
  const res = recordCup(PR, { won: C.champion === "you", hardest: C.difficulty === DIFFICULTY.length - 1 }, { now: Date.now(), extra: AP.unlocks }, MAXES); saveProfile(); celebrate(res);
}
// --- trophy ceremony
function startCeremony() {
  hideAll(); G.screen = "ceremony"; G.ceremony = { t: 0, fw: 0, step: 0 }; showTrophyStage(true);
  const mine = views.filter((v) => v.p.team === 0), n = mine.length;
  views.forEach((v) => { v.model.group.visible = v.p.team === 0; v.blob.visible = v.model.group.visible; });
  mine.forEach((v, i) => { const a = Math.PI + (i - (n - 1) / 2) * 0.55, g = v.model.group; g.position.set(Math.sin(a) * 6.5, 0.35, Math.cos(a) * 6.5); g.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-g.position.x, -g.position.z)); g.updateMatrixWorld(); v.blob.position.set(g.position.x, 0.015, g.position.z); });
  const you = teamById(G.cup, "you"), mvp = tournamentMVP(G.cup);
  banner("CHAMPIONS!", "goal blue", `${you.name} win the Mr. Watford Championship Cup!`);
  comment(mvp ? `Tournament MVP: ${mvp.name} — ${mvp.goals} goals, ${mvp.score} points!` : "What a tournament!");
  Audio.music("victory"); Audio.goal(0); G.goalExcite = 1; stadium.celebrate(1, G.t, S.reducedFlash); stadium.celebrate(-1, G.t, S.reducedFlash);
  drawScreen(stadium.screen.canvas, { flash: { text: "CHAMPIONS", color: "#ffd257", sub: you.name.toUpperCase() } }); stadium.screen.tex.needsUpdate = true;
  fx.goal(new THREE.Vector3(0, 6, 0), new THREE.Color(1, 0.8, 0.3), S.reducedFlash);
}
function cupFrame(dt) {
  if (trophyStage.visible) { trophy.rotation.y += dt * 0.5; }
  if (G.screen === "cupOpen") { G.cupOpenT += dt; if (G.cupOpenT > 9) endCupIntro(); }
  const Cm = G.ceremony;
  if (G.screen === "ceremony" && Cm) {
    Cm.t += dt; trophy.position.y = 1.2 + Math.min(1, Cm.t / 2) * 0.35 + Math.sin(Cm.t * 1.5) * 0.05;
    Cm.fw -= dt; if (Cm.fw <= 0 && !S.reducedFlash) { Cm.fw = 0.45; fx.firework(new THREE.Vector3((Math.random() - 0.5) * 60, 20 + Math.random() * 10, (Math.random() - 0.5) * 60), Math.random() < 0.5 ? new THREE.Color(1, 0.8, 0.3) : TEAM[0]); }
    G.excite = 1;
    if (Cm.t > 7 && !Cm.step) { Cm.step = 1; $("bigWrap").hidden = true; showCupWin(); }
  }
}
function showCupWin() {
  const C = G.cup, you = teamById(C, "you"), mvp = tournamentMVP(C), rec = playerRecord(C), fin = C.fixtures.find((f) => f.id === "final");
  const has = (id) => AP.unlocks.includes(id);
  $("cwTeam").innerHTML = `${emb(you, 90)}<h3>${esc(you.name)}</h3>`;
  $("cwStats").textContent = `Final: ${Math.max(...fin.score)}–${Math.min(...fin.score)}${fin.ot ? " (OT)" : ""} • Record W${rec.w} D${rec.d} L${rec.l} • Goals ${rec.gf}–${rec.ga}${mvp ? ` • MVP ${mvp.name}` : ""}`;
  $("cwRewards").innerHTML = cosmeticsHTML(has);
  $("cupWin").hidden = false;
}
function cosmeticsHTML(has) {
  const L = PR.loadout, item = (id, label, equipKey, val) => `<li class="${has(id) ? "got" : ""}">${has(id) ? "✓" : "🔒"} ${label}${has(id) && equipKey ? ` <button data-cos="${equipKey}:${val}" class="${L[equipKey] === val ? "on" : ""}">${L[equipKey] === val ? "Equipped" : "Equip"}</button>` : ""}</li>`;
  return `<ul class="rewards">${item("paint-gold", "Champion Gold paint finish", "finish", "gold")}${item("rims-gold", "Champion Gold wheels", "rimColor", "gold")}${item("trail-champion", "Champion boost trail", "trail", "trail-champion")}${item("banner-champion", "Champion Crown topper", "topper", "crown")}${item("banner-champion", "Champion player banner", "banner", "champion")}${item("trophy-garage", "The trophy, on display in your Garage")}${item("trail-champion", "Your name in the Hall of Champions")}</ul>`;
}
// --- Hall of Champions
function showHall() {
  hideAll(); G.screen = "hall"; showTrophyStage(true); Audio.music("menu");
  const mine = HALL.filter((h) => h.playerWon);
  $("hlCount").innerHTML = `${mine.length ? "🏆".repeat(Math.min(mine.length, 12)) : "—"} <span>${mine.length} cup${mine.length === 1 ? "" : "s"} won • ${HALL.length} played</span>`;
  $("hlList").innerHTML = HALL.length ? HALL.map((h) => `<article class="plaque${h.playerWon ? " mine" : ""}">${emb(h.champion, 64)}<div><p class="plDate">${new Date(h.date).toLocaleDateString()} • ${esc(h.difficulty)} • ${h.size}v${h.size}</p><h3>${esc(h.champion.name)}</h3><p>Beat ${esc(h.runnerUp ? h.runnerUp.name : "?")} ${esc(h.final)} in the final</p>${h.playerWon && h.mvp ? `<p class="plMvp">MVP: ${esc(h.mvp.name)} • ${h.mvp.goals} goals • ${h.mvp.score} pts</p>` : ""}<p class="plRec">${esc(h.yourTeam ? h.yourTeam.name : "Your team")}: W${h.record.w} D${h.record.d} L${h.record.l} • goals ${h.record.gf}–${h.record.ga}</p></div></article>`).join("") : `<p class="note">No cups finished yet. Win the Mr. Watford Championship Cup to see your team here!</p>`;
  $("hlRewards").innerHTML = AP.unlocks.some((u) => ["paint-gold", "rims-gold", "trail-champion"].includes(u)) ? `<h4>YOUR CHAMPION REWARDS</h4>${cosmeticsHTML((id) => AP.unlocks.includes(id))}` : "";
  $("hall").hidden = false;
}

// ---------- Training Academy screens ----------
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const starStr = (n) => "★".repeat(n) + "☆".repeat(3 - n);
function showAcademy() {
  G.lesson = null; G.paused = false;
  for (const id of ["title", "setup", "result", "pause", "brief", "lessonDone", "hud", "lessonHud"]) $(id).hidden = true;
  G.screen = "academy"; Audio.music("menu");
  const total = Object.values(AP.done).reduce((a, b) => a + b, 0);
  $("acStars").textContent = `${total} / ${LESSONS.length * 3} ★`;
  $("acTiers").innerHTML = TIERS.map((tier, ti) => {
    const open = tierOpen(ti, AP.done), complete = tierComplete(ti, AP.done);
    const cards = LESSONS.filter((l) => l.tier === ti).map((l) => { const st = AP.done[l.id] || 0;
      return `<button class="acCard${st ? " done" : ""}" ${open ? `data-lesson="${l.id}"` : "disabled"}><span class="acIcon">${l.icon}</span><span class="acName">${esc(l.title)}</span><span class="acStar">${starStr(st)}</span></button>`; }).join("");
    return `<section class="acTier${open ? "" : " locked"}" style="--tc:${tier.color}"><h3>${tier.name}${complete ? " ✓" : ""}</h3>${open ? "" : `<p class="acLock">🔒 Finish 4 ${TIERS[ti - 1].name} lessons to unlock</p>`}<div class="acGrid">${cards}</div><p class="acReward">${complete ? "Reward earned: " : "Reward: "}${tier.reward.label}</p></section>`;
  }).join("");
  const earned = Object.keys(TRAILS).filter((k) => AP.unlocks.includes(k));
  const tr = PR.loadout.trail;
  $("acTrails").innerHTML = earned.length ? `Boost trail: <button data-trail="" class="${tr === "standard" ? "on" : ""}">Standard</button>` + earned.map((k) => `<button data-trail="${k}" class="${tr === k ? "on" : ""}">${TRAIL_LABEL[k]} trail</button>`).join("") + " <small>(more in the Garage)</small>" : "Finish every lesson in a tier to earn a new boost trail.";
  $("academy").hidden = false;
}
function showBrief(id) {
  const l = lessonById(id); G.briefId = id;
  $("academy").hidden = true; $("lessonDone").hidden = true;
  $("brTier").textContent = TIERS[l.tier].name.toUpperCase(); $("brTier").style.color = TIERS[l.tier].color;
  $("brTitle").textContent = `${l.icon} ${l.title}`;
  $("brCoach").textContent = l.coach;
  $("brSteps").innerHTML = l.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  $("brStars").innerHTML = `<span>★★★ ${esc(l.stars3)}</span><span>★★ ${esc(l.stars2)}</span><span>★ complete it</span>`;
  $("brBest").textContent = AP.done[id] ? `Your best: ${starStr(AP.done[id])}` : "Not completed yet";
  $("brief").hidden = false; G.screen = "academy";
}
function startLesson(id, demo) {
  const def = lessonById(id); G.briefId = id;
  setArena("championship");
  G.atMenu = false; G.split = null; if (!demo) countPlay(); const L = new Lesson(def, { demo, seed: (Math.random() * 1e9) | 0 });
  M = L.m; G.mode = "lesson"; G.lesson = L; focus = 0; G.overShown = false; G.acc = 0;
  buildViews(); ballQ.identity(); snapshot();
  for (const id2 of ["title", "setup", "result", "pause", "brief", "lessonDone", "academy"]) $(id2).hidden = true;
  $("hud").hidden = false; $("hud").classList.add("lesson"); $("hud").classList.remove("cine"); G.screen = "game"; G.paused = false; G.intro = null; G.replay = null; G.victory = null;
  $("lessonHud").hidden = false; $("lhDemo").hidden = !demo; $("watchTag").hidden = true; $("hint").style.opacity = demo ? 0 : 0.75;
  $("lhTitle").textContent = `${def.icon} ${def.title}`; $("lhSteps").innerHTML = def.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  coachTip(demo ? "Watch how I do it! Press Esc any time to stop." : def.coach);
  rec.clear(); Audio.init(); Audio.music(null); Audio.uiClick(); updateScreen();
}
let tipT = 0;
function coachTip(text) { if (!text) return; $("lhTip").textContent = text; $("lhTipWrap").hidden = false; $("lhTipWrap").classList.remove("pop"); void $("lhTipWrap").offsetWidth; $("lhTipWrap").classList.add("pop"); tipT = 6; }
function updateLessonHud(dt) {
  const L = G.lesson; if (!L) return;
  $("lhProg").textContent = `${L.progress.n} / ${L.progress.of}`;
  $("lhBar").style.width = `${(100 * L.progress.n) / Math.max(1, L.progress.of)}%`;
  $("lhTime").textContent = `${L.t.toFixed(1)} s${L.def.limit ? ` / ${L.def.limit} s` : ""}`;
  $("lhTries").textContent = L.def.attempts ? `Try ${Math.min(L.counts.done + 1, L.def.attempts.max)} of ${L.def.attempts.max}` : L.tries ? `Restarts: ${L.tries}` : "";
  if (tipT > 0) { tipT -= dt; if (tipT <= 0) $("lhTipWrap").hidden = true; }
}
function lessonOver(ok) {
  const L = G.lesson; if (!L) return;
  setTimeout(() => {
    if (G.lesson !== L) return;
    $("hud").hidden = true; $("lessonHud").hidden = true;
    const def = L.def; let reward = "";
    if (ok && L.demo) { showBrief(def.id); coachTip(""); return; }
    if (ok) {
      const before = TIERS.map((_, ti) => tierComplete(ti, AP.done)), opensBefore = TIERS.map((_, ti) => tierOpen(ti, AP.done));
      const prevStars = AP.done[def.id] || 0;
      AP.done[def.id] = Math.max(AP.done[def.id] || 0, L.result.stars);
      TIERS.forEach((tier, ti) => { if (!before[ti] && tierComplete(ti, AP.done) && !AP.unlocks.includes(tier.reward.id)) { AP.unlocks.push(tier.reward.id); reward += `🏆 Reward unlocked: ${tier.reward.label}! `; } if (!opensBefore[ti] && tierOpen(ti, AP.done)) reward += `🔓 ${tier.name} lessons are now open! `; });
      saveAP(); Audio.music("victory");
      const res = recordLesson(PR, { stars: L.result.stars, prevStars, tiersDone: TIERS.filter((_, ti) => tierComplete(ti, AP.done)).length, totalStars: Object.values(AP.done).reduce((a, b) => a + b, 0) }, { now: Date.now(), extra: AP.unlocks }, MAXES);
      saveProfile(); reward += res.xp ? `⭐ +${res.xp} XP  ` : "No new stars, so no XP this time — beat your best for more!  "; celebrate(res);
    }
    $("ldTitle").textContent = ok ? "LESSON COMPLETE!" : "NOT QUITE…";
    $("ldStars").innerHTML = ok ? [1, 2, 3].map((i) => `<span class="${i <= L.result.stars ? "on" : ""}" style="animation-delay:${i * 0.25}s">★</span>`).join("") : "";
    const lines = ok ? ["Fantastic driving! Keep it up.", "That's how it's done!", "You're a natural!", "Great work. On to the next one!"] : ["Every pro misses sometimes. Try again!", "So close! Give it another go.", "Practice makes progress!"];
    $("ldCoach").textContent = ok ? `${lines[(Math.random() * lines.length) | 0]}${L.result.stars < 3 ? ` For ★★★: ${def.stars3}.` : ""}` : `${L.result.msg} ${lines[(Math.random() * lines.length) | 0]}`;
    $("ldStats").textContent = ok ? `Time ${L.result.time.toFixed(1)} s${def.attempts ? ` • ${L.counts.ok} of ${L.counts.done} tries` : L.tries ? ` • ${L.tries} restarts` : ""}` : "";
    $("ldReward").textContent = reward; $("ldReward").hidden = !reward;
    const i = LESSONS.findIndex((l) => l.id === def.id), nx = LESSONS[i + 1];
    $("doneNext").hidden = !(ok && nx && tierOpen(nx.tier, AP.done));
    $("lessonDone").hidden = false; G.screen = "academy";
  }, ok ? 900 : 600);
}
// ---------- lesson targets drawn in 3D ----------
const tgt = { list: null, meshes: [] };
const tgtMat = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.6), transparent: true, opacity: 0.9, depthWrite: false });
function syncTargets(t) {
  const list = G.lesson ? G.lesson.targets : null;
  if (list !== tgt.list) {
    for (const m of tgt.meshes) { scene.remove(m); m.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    tgt.meshes = []; tgt.list = list;
    for (const g of list || []) {
      let m;
      if (g.kind === "gate" || g.kind === "ring" || g.kind === "wallring") {
        m = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.09, 10, 48), tgtMat(0x3ad8ff)); m.add(ring);
        const glow = new THREE.Mesh(new THREE.CircleGeometry(g.r, 48), new THREE.MeshBasicMaterial({ color: 0x3ad8ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })); m.add(glow);
        if (g.kind === "wallring") m.rotation.y = Math.PI / 2;
        if (g.kind === "gate") { for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, g.pos.y, 8), tgtMat(0x3ad8ff)); post.position.set(sx * g.r, -g.pos.y / 2, 0); m.add(post); } }
      } else if (g.kind === "zone") {
        m = new THREE.Group(); const disc = new THREE.Mesh(new THREE.RingGeometry(g.r - 0.25, g.r, 48), tgtMat(0xffc23a)); disc.rotation.x = -Math.PI / 2; m.add(disc);
        const fill = new THREE.Mesh(new THREE.CircleGeometry(g.r - 0.25, 48), new THREE.MeshBasicMaterial({ color: 0xffc23a, transparent: true, opacity: 0.15, depthWrite: false })); fill.rotation.x = -Math.PI / 2; m.add(fill); m.position.y = 0.03;
      } else { // marker: a bouncing arrow over a spot
        m = new THREE.Group(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 4), tgtMat(0xffc23a)); cone.rotation.x = Math.PI; m.add(cone);
      }
      m.traverse((o) => { if (o.material) o.userData.main = o.material.opacity > 0.5; });
      m.position.set(g.pos.x, g.pos.y + (g.kind === "zone" ? 0.03 : 0), g.pos.z); m.userData.g = g; m.renderOrder = 7; scene.add(m); tgt.meshes.push(m);
    }
  }
  const next = G.lesson && G.lesson.nextGate ? G.lesson.nextGate() : null;
  for (const m of tgt.meshes) {
    const g = m.userData.g;
    if (g.hit) { m.scale.setScalar(Math.max(0.01, (m.scale.x || 1) * 0.9)); m.visible = m.scale.x > 0.02; continue; }
    const isNext = !next || g === next || (g.kind !== "gate" && g.kind !== "ring");
    m.traverse((o) => { if (o.material) o.material.opacity = isNext ? (o.userData.main ? 0.95 : 0.12) : (o.userData.main ? 0.3 : 0.03); });
    if (g.kind === "marker") m.position.y = 2.2 + Math.sin(t * 4) * 0.35;
    else if (isNext) m.scale.setScalar(1 + Math.sin(t * 5) * 0.04);
  }
}

// ---------- camera ----------
const makeCam = () => ({ dir: new THREE.Vector3(0, 0, 1), manual: null, orbit: 0, ballMix: 1, wallMix: 0, up: new THREE.Vector3(0, 1, 0) });
const cam = makeCam();
function updateCamera(dt, carPos, carQ, ballPos, C = cam, K = camera, car = focusPlayer().car, ballCam = S.ballCam) {
  const hf = THREE.MathUtils.degToRad(S.fov), aspect = K.aspect;
  K.fov = Math.min(95, Math.max(50, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hf / 2) / aspect)))); // (at least 50° tall: wide split-screen halves)
  K.up.set(0, 1, 0);
  if (C.manual) { K.position.copy(C.manual.pos); K.lookAt(C.manual.look); K.updateProjectionMatrix(); return; }
  if (TROPHY_SCREENS.includes(G.screen)) { trophyCamera(dt); return; }
  if (G.screen === "title" || G.screen === "academy" || G.screen === "online" || G.screen === "lobby") { // slow showcase orbit around the car
    C.orbit += dt * 0.12; const r = 5.2;
    K.position.set(carPos.x + Math.sin(C.orbit) * r, 1.0 + Math.sin(C.orbit * 0.7) * 0.25, carPos.z + Math.cos(C.orbit) * r);
    K.lookAt(carPos.x, carPos.y + 0.05, carPos.z); K.updateProjectionMatrix(); return;
  }
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(carQ);
  let want = new THREE.Vector3(fwd.x, 0, fwd.z);
  if (want.lengthSq() < 0.09) want.copy(C.dir); want.normalize();
  // driving on a wall: follow the car's own heading and sit "above" it along the wall, not along the sky
  const fc = car, carUp = new THREE.Vector3(0, 1, 0).applyQuaternion(carQ);
  C.wallMix += ((fc.onGround && carUp.y < 0.75 ? 1 : 0) - C.wallMix) * Math.min(1, dt * 4);
  C.up.copy(new THREE.Vector3(0, 1, 0)).lerp(carUp, C.wallMix * 0.85).normalize();
  const toBall = new THREE.Vector3().subVectors(ballPos, carPos);
  const useBall = ballCam && M.state !== "goal" && ballPos.y > -5;
  C.ballMix += ((useBall ? 1 : 0) - C.ballMix) * Math.min(1, dt * 6);
  if (C.ballMix > 0.01) { const tb = new THREE.Vector3(toBall.x, 0, toBall.z); if (tb.lengthSq() > 0.25) want.lerp(tb.normalize(), C.ballMix * (1 - C.wallMix * 0.7)).normalize(); }
  if (C.wallMix > 0.01) want.lerp(fwd, C.wallMix).normalize();
  const k = 1 - Math.exp(-dt * (4 + S.camStiff * 16));
  C.dir.lerp(want, k).normalize();
  const target = carPos.clone().add(new THREE.Vector3(0, 0.25, 0));
  const pos = target.clone().addScaledVector(C.dir, -S.camDist).addScaledVector(C.up, S.camHeight);
  const d = sdf(pos.x, pos.y, pos.z);
  if (d > -0.35) { const n = normalIn(pos); pos.addScaledVector(n, d + 0.35); }
  K.position.copy(pos);
  const look = target.clone().addScaledVector(C.dir, 3).addScaledVector(C.up, 0.15);
  K.up.copy(C.up);
  if (C.ballMix > 0.01) { const flat = Math.hypot(toBall.x, toBall.z) + 1; const lift = THREE.MathUtils.clamp((toBall.y - 1) / flat, -0.2, 0.75); look.y += lift * 3 * C.ballMix; }
  if (M.state === "goal") look.lerp(ballPos, Math.min(1, M.timer));
  if (S.shake && !S.reducedMotion && fx.shake > 0) { const s = fx.shake * 0.12; K.position.add(new THREE.Vector3((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s)); }
  K.lookAt(look); K.updateProjectionMatrix();
}

// ---------- HUD ----------
const boostRing = $("boostRing"), RING = 2 * Math.PI * 52;
let toastT = 0, screenTimer = 0;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; toastT = 1.6; }
const tmpV = new THREE.Vector3();
function updateHud(dt) {
  if (G.lesson) updateLessonHud(dt);
  const car = focusPlayer().car;
  $("boostNum").textContent = Math.round(car.boost);
  boostRing.style.strokeDashoffset = RING * (1 - car.boost / 100);
  boostRing.style.stroke = car.boost < 20 ? "#ff5a3c" : "#ffb52e";
  $("speed").textContent = `${Math.round(car.speed() * 3.6)} km/h`;
  $("sonic").hidden = !car.supersonic;
  $("camTag").textContent = ((G.split ? G.split.ballCam[0] : S.ballCam) ? "BALL CAM" : "CAR CAM") + (G.mode === "online" ? (ON.host ? " • ONLINE (HOST)" : ON.ping !== null ? ` • ONLINE • ${ON.ping} ms` : " • ONLINE") : "");
  if (G.split) meter2(M.players[G.split.idx[1]].car);
  $("clock").textContent = clockLabel(); $("clock").classList.toggle("ot", M.overtime);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast").hidden = true; }
  // countdown numbers
  if (M.state === "countdown") { const n = Math.ceil(MATCH.kickoffCountdown - M.timer); if (n !== G.lastCount && n > 0) { G.lastCount = n; Audio.countdown(n); banner(String(n), "count"); } }
  // name tags over the other cars
  if (G.split) { splitTags(); return; }
  const W = innerWidth, H = innerHeight;
  for (const v of views) {
    const show = v.p !== focusPlayer() || G.mode === "watch";
    tmpV.copy(v.model.group.position).add(new THREE.Vector3(0, 1.0, 0)).project(camera);
    const vis = show && tmpV.z < 1 && Math.abs(tmpV.x) < 1.1 && Math.abs(tmpV.y) < 1.1;
    v.tag.style.display = vis ? "block" : "none";
    if (vis) v.tag.style.transform = `translate(${((tmpV.x + 1) / 2 * W).toFixed(0)}px, ${((1 - tmpV.y) / 2 * H).toFixed(0)}px) translate(-50%, -100%)`;
  }
}

// ---------- menus ----------
function togglePause(force) {
  if (G.screen !== "game" || (M && M.state === "over")) return;
  // online the match can't stop for one player: the menu opens, the game keeps going
  if (G.mode === "online") { G.netMenu = force !== undefined ? force : !G.netMenu; $("pause").hidden = !G.netMenu; if (G.netMenu) fillSettings(); $("restart").hidden = true; $("exitAcademy").hidden = true; Audio.uiClick(); return; }
  $("restart").hidden = false;
  G.paused = force !== undefined ? force : !G.paused;
  $("pause").hidden = !G.paused; Audio.uiClick();
  if (G.paused) fillSettings();
  $("exitAcademy").hidden = !G.lesson; $("restart").textContent = G.lesson ? "RESTART LESSON" : "RESTART";
}
function fillSettings() {
  for (const q of document.querySelectorAll("[data-q]")) q.classList.toggle("on", q.dataset.q === S.quality);
  for (const el of document.querySelectorAll("[data-gfx]")) { const [k, v] = el.dataset.gfx.split(":"); el.classList.toggle("on", (S.gfx[k] || "auto") === v); }
  for (const el of document.querySelectorAll("[data-set]")) { const k = el.dataset.set; if (el.type === "checkbox") el.checked = !!S[k]; else el.value = S[k]; }
}
function fillSetup() {
  for (const el of document.querySelectorAll("[data-exh]")) {
    const [k, v] = el.dataset.exh.split(":"); el.classList.toggle("on", String(S.exh[k]) === v);
  }
  $("mateRow").hidden = S.exh.size === 1 && !S.exh.watch;
  $("mateLabel").textContent = S.exh.watch ? "Blue team" : "Your teammates";
  $("oppLabel").textContent = S.exh.watch ? "Orange team" : "Opponents";
  $("startExh").textContent = S.exh.watch ? "WATCH MATCH" : "KICK OFF";
  $("arenaAbout").textContent = THEMES[S.exh.arena || "championship"].about;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, #titleCard"); if (!t) return;
  Audio.init(); if (G.screen !== "game") Audio.music("menu");
if (t.dataset.go === "free") startFree();
if (t.dataset.go === "garage") openGarage();
if (t.dataset.go === "local") showLocal();
if (t.dataset.go === "online") ON.open();
if (t.dataset.fs !== undefined) toggleFullscreen();
if (t.id === "netLobby") ON.toLobby();
if (t.dataset.loc) { const [k, v] = t.dataset.loc.split(":"); S.local[k] = ["level", "length"].includes(k) ? Number(v) : v; save(); fillLocal(); }
if (t.id === "startLocal") { clearInterval(padTimer); startLocal(); }
if (t.id === "localBack") { clearInterval(padTimer); hideAll(); showTitle(); }
if (t.dataset.go === "career") showCareer();
if (t.dataset.gtab) { GT.tab = t.dataset.gtab; renderGarage(); }
if (t.dataset.gear) equip(...t.dataset.gear.split(":"));
if (t.dataset.glight) { PR.loadout.light = t.dataset.glight; saveProfile(); garage.setLight(t.dataset.glight); renderGarage(); }
if (t.id === "gRev") { Audio.setEngine(PR.loadout.engine); G.rev = 1.8; }
if (t.id === "gDone") closeGarage();
if (t.dataset.crtab) { G.crTab = t.dataset.crtab; showCareer(); }
if (t.id === "crBack") { if (G.atMenu) { hideAll(); showTitle(); } else location.reload(); }
if (t.id === "crReset" && confirm("Erase your whole career (level, stats, achievements and garage) on this device? This can't be undone.")) { try { localStorage.removeItem(PKEY); } catch (e) { /* ignore */ } location.reload(); }
if (t.dataset.go === "cup") openCup();
if (t.dataset.go === "hall") showHall();
if (t.dataset.cupset) { const [k, v] = t.dataset.cupset.split(":"); CC[k] = ["shape", "glyph", "primary", "accent", "home"].includes(k) ? v : Number(v); renderCreate(); }
if (t.id === "cupStart") startCup();
if (t.id === "cupPlay") showPreview();
if (t.id === "cupKick") startCupMatch();
if (t.id === "previewBack" || t.id === "cupToHub") showHub();
if (t.id === "cupContinue") finishCupMatch();
if (t.id === "cupSimRest") { simulateRest(G.cup); cupFinished(); showHub(); }
if (t.id === "cupNew") { if (!G.cup || G.cup.stage === "done" || confirm("Quit this cup and start a new one? Your progress in it will be lost.")) { G.cup = null; saveCup(); showCreate(); } }
if (t.id === "cupOpenSkip") endCupIntro();
if (t.dataset.tab) { G.cupTab = t.dataset.tab; showHub(); }
if (t.dataset.cos) { const [k, v] = t.dataset.cos.split(":"); PR.loadout[k] = PR.loadout[k] === v ? defaultLoadout()[k] : v; saveProfile(); t.closest("#hall") ? showHall() : showCupWin(); }
if (t.dataset.go === "academy" || t.id === "briefBack" || t.id === "doneAcademy" || t.id === "exitAcademy") showAcademy();
if (t.dataset.lesson) showBrief(t.dataset.lesson);
if (t.id === "lessonStart" || t.id === "doneRetry") startLesson(G.briefId, false);
if (t.id === "lessonDemo") startLesson(G.briefId, true);
if (t.id === "doneNext") { const i = LESSONS.findIndex((l) => l.id === G.briefId), nx = LESSONS[i + 1]; if (nx && tierOpen(nx.tier, AP.done)) showBrief(nx.id); else showAcademy(); }
if (t.dataset.trail !== undefined) { PR.loadout.trail = t.dataset.trail || "standard"; saveProfile(); showAcademy(); }
  if (t.dataset.go === "setup") { fillSetup(); $("title").hidden = true; $("result").hidden = true; $("setup").hidden = false; G.screen = "setup"; }
  if (t.dataset.exh) { const [k, v] = t.dataset.exh.split(":"); S.exh[k] = k === "watch" ? v === "true" : k === "arena" ? v : Number(v); save(); fillSetup(); }
  if (t.id === "startExh") startExhibition();
  if (t.id === "setupBack") { $("setup").hidden = true; $("title").hidden = false; G.screen = "title"; }
  if (t.dataset.q) { S.quality = t.dataset.q; save(); location.reload(); }
  if (t.dataset.gfx) { const [k, v] = t.dataset.gfx.split(":"); S.gfx[k] = v; save(); if (k === "bloom" && post) { post.mComp.uniforms.bloomStr.value = v === "off" ? 0 : 0.09; fillSettings(); } else location.reload(); }
  if (t.id === "resume") togglePause(false);
  if (t.id === "restart") { togglePause(false); if (G.lesson) startLesson(G.briefId, G.lesson.demo); else if (G.mode === "cup") startCupMatch(); else if (G.mode === "local") startLocal(); else G.mode === "free" ? startFree() : startExhibition(); }
  if (t.id === "toTitle" || t.id === "resultTitle") location.reload();
  if (t.id === "skipBtn") skipCinematic();
  if (t.id === "again") { if (G.mode === "local") startLocal(); else startExhibition(); }
  if (t.id === "changeSetup") { if (G.mode === "local") { G.split = null; showLocal(); } else { $("result").hidden = true; fillSetup(); $("setup").hidden = false; G.screen = "setup"; } }
  if (t.id === "showControls") $("controls").hidden = !$("controls").hidden;
  Audio.uiClick();
});
document.addEventListener("input", (e) => {
  const k = e.target.dataset.set; if (!k) return;
  S[k] = e.target.type === "checkbox" ? e.target.checked : parseFloat(e.target.value); save();
  if (k === "scale") renderer.setPixelRatio(Q.pr * S.scale);
  Audio.setVolumes({ master: S.master, sfx: S.sfx, crowd: S.crowd, music: S.music });
  $("fps").hidden = !S.showFps;
});
function toggleDev() {
  const el = $("dev"); el.hidden = !el.hidden; if (el.hidden || el.dataset.built) return;
  el.dataset.built = 1;
  const groups = { CAR, BALL, HIT, PHYS, BOOST };
  for (const [name, obj] of Object.entries(groups)) {
    const h = document.createElement("h4"); h.textContent = name; el.appendChild(h);
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== "number" || k === "hz") continue;
      const row = document.createElement("label"); const inp = document.createElement("input"); const out = document.createElement("span");
      inp.type = "range"; const span = Math.abs(v) > 0 ? Math.abs(v) * 3 : 1; inp.min = v < 0 ? -span : 0; inp.max = span; inp.step = span / 300; inp.value = v;
      out.textContent = v; row.append(k, inp, out);
      inp.oninput = () => { obj[k] = parseFloat(inp.value); out.textContent = (+inp.value).toFixed(3); };
      el.appendChild(row);
    }
  }
}

// ---------- physics debug view (F3): hitboxes, wheel contacts, ball path, velocity ----------
const debug = { on: params.has("debug"), built: false };
function updateDebug() {
  if (!debug.on) { if (debug.group && debug.group.visible) { debug.group.visible = false; $("fps").hidden = !S.showFps; } return; }
  if (!debug.built || debug.count !== M.players.length) {
    if (debug.group) scene.remove(debug.group);
    debug.group = new THREE.Group(); debug.group.renderOrder = 20; scene.add(debug.group); debug.built = true; debug.count = M.players.length;
    const boxG = new THREE.EdgesGeometry(new THREE.BoxGeometry(CAR.half[0] * 2, CAR.half[1] * 2, CAR.half[2] * 2));
    const lineM = (c) => new THREE.LineBasicMaterial({ color: c, depthTest: false, transparent: true });
    debug.boxes = M.players.map((p) => { const b = new THREE.LineSegments(boxG, lineM(p.team ? 0xffa060 : 0x80b0ff)); debug.group.add(b); return b; });
    debug.wheels = M.players.map(() => [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0x40ff60, depthTest: false })); debug.group.add(m); return m; }));
    debug.pathGeo = new THREE.BufferGeometry(); debug.pathGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(241 * 3), 3));
    debug.path = new THREE.Line(debug.pathGeo, lineM(0xffff60)); debug.path.frustumCulled = false; debug.group.add(debug.path);
    debug.velGeo = new THREE.BufferGeometry(); debug.velGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    debug.vel = new THREE.LineSegments(debug.velGeo, lineM(0xff4040)); debug.vel.frustumCulled = false; debug.group.add(debug.vel);
  }
  debug.group.visible = true;
  M.players.forEach((p, i) => {
    const c = p.car, b = debug.boxes[i]; b.position.set(c.pos.x, c.pos.y, c.pos.z); b.quaternion.set(c.q.x, c.q.y, c.q.z, c.q.w);
    c.wheels.forEach((w, k) => { const m = debug.wheels[i][k]; m.visible = w.contact; if (w.contact) m.position.set(w.point.x, w.point.y, w.point.z); });
  });
  const pr = M.prediction(), arr = debug.pathGeo.attributes.position.array;
  for (let k = 0; k < 241; k++) { const s = pr[Math.min(k, pr.length - 1)].p; arr[k * 3] = s.x; arr[k * 3 + 1] = s.y; arr[k * 3 + 2] = s.z; }
  debug.pathGeo.attributes.position.needsUpdate = true;
  const B = M.world.ball, va = debug.velGeo.attributes.position.array;
  va.set([B.pos.x, B.pos.y, B.pos.z, B.pos.x + B.vel.x * 0.25, B.pos.y + B.vel.y * 0.25, B.pos.z + B.vel.z * 0.25]); debug.velGeo.attributes.position.needsUpdate = true;
  $("fps").hidden = false;
  const fc = focusPlayer().car;
  $("fps").textContent = `PHYSICS VIEW • car ${fc.speed().toFixed(1)} m/s • wheels ${fc.contacts}/4 • ${fc.onGround ? "ground" : "air"}${fc.hasJumped ? " • jumped" : ""}${fc.hasFlipped ? " • flip used" : " • flip ready"} • ball ${B.vel.len().toFixed(1)} m/s • spin ${B.ang.len().toFixed(1)}`;
}

// ---------- main loop ----------
const tmpP = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), ballP = new THREE.Vector3();
let last = performance.now(), fpsAcc = 0, fpsN = 0;
const perf = { frames: 0, ms: [] };
function frame(now) {
  const rawDt = Math.min(0.1, (now - last) / 1000); last = now;
  perf.ms.push(rawDt * 1000); if (perf.ms.length > 240) perf.ms.shift();
  requestAnimationFrame(frame);
  step(rawDt);
}
function step(rawDt) {
  const dt = G.paused ? 0 : rawDt;
  G.t += dt;
  if (G.screen === "garage" && garage) { garageFrame(rawDt); perf.frames++; return; }
  const H = 1 / PHYS.hz;
  if (!G.paused && G.screen === "game" && G.intro) { G.intro.t += dt; if (G.intro.t >= G.intro.dur) skipCinematic(); }
  let dtR = 0;
  if (!G.paused && G.screen === "game" && G.replay) {
    const R = G.replay, sh = shotAt(R, R.t); dtR = dt * sh[3]; R.t += dtR;
    if (!R.boom && R.t >= R.tGoal) { R.boom = true; fx.goal(ballP.clone(), TEAM[R.goal.team], true, boomFor(R.goal)); Audio.goal(R.goal.team); stadium.celebrate(R.sign, G.t, S.reducedFlash); }
    if (R.t >= R.end) endReplay();
  }
  if (!G.paused && G.screen === "game" && !G.replay && !G.intro) {
    // slow motion right after a goal (presentation only; the match timers run on physics time)
    G.timeScale = M.state === "goal" && !S.reducedMotion && G.mode !== "online" ? (M.timer < 0.25 ? 0.25 : M.timer < 1.3 ? 0.4 : 1) : 1;
    G.acc += dt * G.timeScale;
    const hi = humanIdx(), input = G.split ? null : G.netMenu ? { throttle: 0, steer: 0, pitch: 0, roll: 0, jump: false, boost: false, slide: false } : readInput(), splitIn = G.split ? G.split.src.map((src, i) => readInputFor(src, i)) : null;
    let n = 0;
    while (G.acc >= H && n < 12) {
      snapshot();
      if (G.lesson) G.lesson.step(input); else if (G.split) M.step({ [G.split.idx[0]]: splitIn[0], [G.split.idx[1]]: splitIn[1] }); else if (ON.guest) { ON.beforeStep(); ON.guestStep(input); } else if (ON.host) M.step(ON.hostInputs(hi >= 0 ? { [hi]: input } : {})); else M.step(hi >= 0 ? { [hi]: input } : {});
      rec.record(M.world, ballQ);
      const w = M.world.ball.ang, wl = Math.hypot(w.x, w.y, w.z);
      if (wl > 1e-6) { tmpQ.setFromAxisAngle(tmpP.set(w.x / wl, w.y / wl, w.z / wl), wl * H); ballQ.premultiply(tmpQ); }
      handleEvents(G.lesson ? G.lesson.events : ON.events(M)); G.acc -= H; n++;
    }
    if (n === 12) G.acc = 0;
    ON.afterFrame(rawDt);
    if (M.state === "play" && G.mode !== "free") { screenTimer -= dt; if (screenTimer <= 0) { screenTimer = 1; updateScreen(); } }
    if (M.state === "play" && M.timer > 0.7 && $("bigText").classList.contains("count")) $("bigWrap").hidden = true; // hide "GO!"
    if (G.pendingGoal && M.state === "goal" && M.timer > 2.3) { const g = G.pendingGoal; G.pendingGoal = null; startReplay(g); }
    if (M.state !== "goal") G.pendingGoal = null;
    // timed announcements
    if (G.mode === "match" || G.mode === "watch" || G.mode === "cup" || G.mode === "local") { if (!M.overtime && M.o.length > 90 && M.clock <= 60 && M.clock > 55 && !G.said.min) { G.said.min = 1; comment(ann.say("lastMinute")); } if (!M.overtime && M.clock <= 10 && M.clock > 8 && !G.said.ten) { G.said.ten = 1; comment(ann.say("last10")); } }
  }
  // smooth drawing between physics steps
  const a = THREE.MathUtils.clamp(G.acc / H, 0, 1);
  if (G.replay) poseReplay(dtR);
  else if (G.screen !== "ceremony") for (const v of views) {
    const c = v.p.car, g = v.model.group;
    g.position.lerpVectors(v.prevP, tmpP.set(c.pos.x, c.pos.y, c.pos.z), a);
    g.quaternion.slerpQuaternions(v.prevQ, tmpQ.set(c.q.x, c.q.y, c.q.z, c.q.w), a);
    const er = ON.err(v.p.idx); if (er) g.position.add(er); // online guest: ease out corrections from the host
    g.updateMatrixWorld();
    const braking = c.onGround && c.input && c.input.throttle * c.vel.dot(c.forward) < -0.5;
    v.model.update(c, c.boosting ? 1 : 0, braking);
    v.blob.position.set(g.position.x, 0.015, g.position.z);
    v.blob.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.atan2(c.forward.x, c.forward.z)));
    v.blob.material.opacity = THREE.MathUtils.clamp(1 - (g.position.y - 0.35) / 4, 0, 1) * (Q.shadows ? 0.55 : 0.9);
  }
  const B = M.world.ball;
  if (!G.replay) { ballP.lerpVectors(prevBallP, tmpP.set(B.pos.x, B.pos.y, B.pos.z), a); const be = ON.ballErr(); if (be) ballP.add(be); ballMesh.position.copy(ballP); ballMesh.quaternion.slerpQuaternions(prevBallQ, ballQ, a); }
  G.ballGlow = Math.max(0, G.ballGlow - dt * 2.5);
  if (ballMesh.material.userData.glow) ballMesh.material.userData.glow.value = G.ballGlow;
  ballBlob.position.set(ballP.x, 0.016, ballP.z); const bh = ballP.y - BALL.r; ballBlob.scale.setScalar(1 + bh * 0.08); ballBlob.material.opacity = THREE.MathUtils.clamp(1 - bh / 14, 0.15, 1) * (Q.shadows ? 0.4 : 0.85);
  // effects, stadium, crowd mood
  const states = new Map(M.players.map((p, i) => [p.car, { vel: G.replay && views[i].vel ? views[i].vel : new THREE.Vector3(p.car.vel.x, p.car.vel.y, p.car.vel.z) }]));
  fx.camPos.copy(camera.position); fx.ball = { pos: ballP, speed: G.replay ? 0 : M.world.ball.vel.len() };
  fx.update(G.replay ? Math.max(dtR, dt * 0.3) : dt * (M.state === "goal" ? Math.max(G.timeScale, 0.4) : 1), M.world, states);
  if (commentT > 0) { commentT -= rawDt; if (commentT <= 0) $("comment").hidden = true; }
  const goalDist = ARENA.hz - Math.abs(ballP.z), nearGoal = Math.abs(ballP.x) < 20 ? THREE.MathUtils.smoothstep(30 - goalDist, 0, 25) : 0;
  G.goalExcite = Math.max(0, G.goalExcite - dt * 0.22);
  G.excite = Math.max(0.12 + nearGoal * 0.55, G.goalExcite, G.replay || G.victory ? 0.8 : 0);
  stadium.update(G.t, dt, G.excite);
  M.world.pads.forEach((p, i) => stadium.setPad(i, p.timer <= 0, G.t));
  const fv = views[focus] || views[0];
  stadium.followShadow(fv.model.group.position.x * 0.5 + ballP.x * 0.5, fv.model.group.position.z * 0.5 + ballP.z * 0.5);
  if (G.replay) replayCamera(rawDt); else if (G.intro) introCamera(rawDt); else if (G.victory) victoryCamera(rawDt);
  else if (G.split && G.screen === "game") {
    const R = splitRects();
    G.split.idx.forEach((pi, i) => { const v = views[pi], K = i ? G.split.camera2 : camera; K.aspect = R[i].w / R[i].h; updateCamera(rawDt, v.model.group.position, v.model.group.quaternion, ballP, i ? G.split.cam2 : cam, K, v.p.car, G.split.ballCam[i]); });
  } else { camera.aspect = innerWidth / innerHeight; updateCamera(rawDt, fv.model.group.position, fv.model.group.quaternion, ballP); }
  if (G.screen === "game" && !G.replay && !G.intro && !G.victory) updateHud(dt); else if (G.screen === "game") for (const v of views) { v.tag.style.display = "none"; if (v.tag2) v.tag2.style.display = "none"; }
  TOUCH.show(G.screen === "game" && !G.split && !$("hud").hidden && !G.paused && !G.netMenu && !(G.lesson && G.lesson.demo));
  $("hud").classList.toggle("split", !!(G.split && G.screen === "game" && !G.replay && !G.intro && !G.victory)); $("hud2").hidden = !$("hud").classList.contains("split") || $("hud").hidden;
  if (G.screen !== "game") for (const v of views) { v.tag.style.display = "none"; if (v.tag2) v.tag2.style.display = "none"; }
  const fc = focusPlayer().car;
  Audio.update(rawDt, { musicOnly: G.screen !== "game", speed: G.replay ? 0 : fc.speed(), throttle: fc.input ? fc.input.throttle : 0, boosting: fc.boosting, onGround: fc.onGround, supersonic: fc.supersonic, sliding: fc.sliding, crowdExcite: G.excite });
  syncTargets(G.t);
  cupFrame(rawDt);
  updateDebug();
  if (G.split && G.screen === "game" && !G.replay && !G.intro && !G.victory) renderSplit();
  else { if (camera.aspect !== innerWidth / innerHeight) { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); } if (post) { post.mComp.uniforms.flash.value = fx.flash; post.render(scene, camera, G.t); } else renderer.render(scene, camera); }
  perf.frames++;
  if (S.showFps) { fpsAcc += rawDt; fpsN++; if (fpsAcc > 0.5) { $("fps").textContent = `${Math.round(fpsN / fpsAcc)} fps • ${renderer.info.render.calls} draws`; fpsAcc = 0; fpsN = 0; } }
}

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (garage) garage.resize(w, h); }
addEventListener("resize", resize); resize();

// title screen: one car parked at centre field, ball beside it
// ---------- ONLINE PLAY (join codes, through the relay) ----------
const ON = initOnline({
  $, esc, M: () => M, myBody: () => PR.loadout.body, sound: () => Audio.boostPickup(true), toast,
  hideAll: () => { hideAll(); $("controls").hidden = true; }, setScreen: (sc) => { G.screen = sc; }, toTitle: () => showTitle(),
  arenaName: (id) => (THEMES[id] || THEMES.championship).name, levelName: (l) => LEVELS[l].name,
  startMatch(o, me) { G.netBodies = o.bodies; setArena(o.arena); newMatch({ size: o.size, length: o.length, seed: o.seed, humans: o.humans, names: o.names, blueLevel: o.blueLevel, orangeLevel: o.orangeLevel }, "online"); },
  backToLobby() { G.victory = null; $("result").hidden = true; $("hud").hidden = true; $("bigWrap").hidden = true; $("pause").hidden = true; G.netMenu = false; G.screen = "lobby"; netBanner(""); },
  endNetMatch(text) { G.victory = null; G.netMenu = false; for (const id of ["hud", "pause", "result", "bigWrap"]) $(id).hidden = true; netBanner(""); toast(text); },
  netBanner,
});
function netBanner(text) { const el = $("netBanner"); if (el.textContent !== text) el.textContent = text; el.hidden = !text; }

// on-screen touch controls (only shown during play, and only after the screen is touched)
const TOUCH = initTouch({ onPause: () => togglePause(), onBallCam: () => { S.ballCam = !S.ballCam; save(); toast(S.ballCam ? "Ball cam ON" : "Ball cam OFF"); } });

for (const b of document.querySelectorAll("[data-fs]")) b.hidden = !document.fullscreenEnabled; // e.g. iPhone Safari can't
document.addEventListener("fullscreenchange", () => { for (const b of document.querySelectorAll("[data-fs]")) b.textContent = document.fullscreenElement ? "⛶ EXIT FULL SCREEN" : "⛶ FULL SCREEN"; });

G.atMenu = true;
titleScene();
$("qualityName").textContent = S.quality.toUpperCase();
$("fps").hidden = !S.showFps;
Audio.setVolumes({ master: S.master, sfx: S.sfx, crowd: S.crowd, music: S.music });
updateScreen();
$("loading").hidden = true; $("title").hidden = false; drawTitleCard();
requestAnimationFrame(frame);
document.addEventListener("visibilitychange", () => { if (!document.hidden) last = performance.now(); });

// ---------- LOCAL MULTIPLAYER: split-screen on one computer ----------
// the two halves of the screen in CSS pixels (WebGL counts y from the bottom): P1 top or left, P2 bottom or right
function splitRects() {
  const W = innerWidth, H = innerHeight;
  return G.split.dir === "sbs" ? [{ x: 0, y: 0, w: Math.floor(W / 2), h: H }, { x: Math.floor(W / 2), y: 0, w: W - Math.floor(W / 2), h: H }]
    : [{ x: 0, y: Math.floor(H / 2), w: W, h: H - Math.floor(H / 2) }, { x: 0, y: 0, w: W, h: Math.floor(H / 2) }];
}
let post2 = null;
function renderSplit() {
  const R = splitRects(), cams = [camera, G.split.camera2];
  // the sun's shadow map is drawn once per frame and shared by both views
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  R.forEach((r, i) => {
    cams[i].updateProjectionMatrix();
    if (post) { const P = i ? (post2 ||= new Post(renderer, Q)) : post; P.mComp.uniforms.flash.value = fx.flash; P.render(scene, cams[i], G.t, r); }
    else { renderer.setViewport(r.x, r.y, r.w, r.h); renderer.setScissor(r.x, r.y, r.w, r.h); renderer.setScissorTest(true); renderer.render(scene, cams[i]); }
  });
  renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.setScissorTest(false); renderer.shadowMap.autoUpdate = true;
}
const boostRing2 = () => $("boostRing2");
function meter2(car) {
  $("boostNum2").textContent = Math.round(car.boost);
  boostRing2().style.strokeDashoffset = RING * (1 - car.boost / 100); boostRing2().style.stroke = car.boost < 20 ? "#ff5a3c" : "#ffb52e";
  $("speed2").textContent = `${Math.round(car.speed() * 3.6)} km/h`; $("sonic2").hidden = !car.supersonic;
  $("camTag2").textContent = G.split.ballCam[1] ? "BALL CAM" : "CAR CAM";
  const sbs = G.split.dir === "sbs"; $("hud").classList.toggle("sbs", sbs); $("hud2").classList.toggle("sbs", sbs);
}
function splitTags() { // each half shows name tags over everyone except that half's own car
  const R = splitRects(), H = innerHeight;
  for (const v of views) if (!v.tag2) { v.tag2 = v.tag.cloneNode(true); $("tags").appendChild(v.tag2); }
  G.split.idx.forEach((pi, i) => {
    const K = i ? G.split.camera2 : camera, r = R[i];
    for (const v of views) {
      const el = i ? v.tag2 : v.tag, show = v.p !== M.players[pi];
      tmpV.copy(v.model.group.position).add(new THREE.Vector3(0, 1.0, 0)).project(K);
      const vis = show && tmpV.z < 1 && Math.abs(tmpV.x) < 1.05 && Math.abs(tmpV.y) < 1.05;
      el.style.display = vis ? "block" : "none";
      if (vis) el.style.transform = `translate(${(r.x + ((tmpV.x + 1) / 2) * r.w).toFixed(0)}px, ${(H - r.y - r.h + ((1 - tmpV.y) / 2) * r.h).toFixed(0)}px) translate(-50%, -100%)`;
    }
  });
}
const LOCAL_MODES = { "1v1": { size: 1, idx: [0, 1], label: "1v1 Versus" }, "2v2": { size: 2, idx: [0, 2], label: "2v2 Versus (computer teammates)" }, coop: { size: 2, idx: [0, 1], label: "2v2 Co-op vs computers" } };
function startLocal() {
  const L = S.local, md = LOCAL_MODES[L.mode] || LOCAL_MODES["1v1"], names = [];
  names[md.idx[0]] = "P1"; names[md.idx[1]] = "P2";
  G.split = { idx: md.idx, src: [L.p1, L.p2], dir: L.dir, ballCam: [S.ballCam, S.ballCam], camera2: (G.split && G.split.camera2) || new THREE.PerspectiveCamera(70, 1, 0.05, 600), cam2: makeCam(), versus: L.mode !== "coop" };
  cam.dir.set(0, 0, 1);
  setArena(L.arena);
  newMatch({ size: md.size, length: L.length, humans: md.idx, names, blueLevel: L.level, orangeLevel: L.level }, "local");
}
let padTimer = null;
function showLocal() {
  hideAll(); $("controls").hidden = true; G.screen = "local"; fillLocal(); $("local").hidden = false;
  clearInterval(padTimer); padTimer = setInterval(() => { if (G.screen === "local") fillLocal(true); else clearInterval(padTimer); }, 600);
}
function fillLocal(padsOnly) {
  const L = S.local, pads = connectedPads();
  const usesPad = (src) => src.startsWith("pad"), missing = [L.p1, L.p2].filter((src) => usesPad(src) && !pads[+src.slice(3)]);
  $("locPads").innerHTML = pads.length ? `🎮 ${pads.length} controller${pads.length > 1 ? "s" : ""} connected: ${pads.map((p, i) => `<b>Controller ${i + 1}</b> <small>(${esc(p.id.replace(/\(.*?\)/g, "").trim().slice(0, 28) || "gamepad")})</small>`).join(", ")}` : "🎮 No controllers found yet. Plug one in and <b>press any button on it</b> — it will show up here.";
  const same = L.p1 === L.p2;
  $("locWarn").textContent = same ? "⚠️ Player 1 and Player 2 can't use the same controls." : missing.length ? `⚠️ ${missing.map((m) => SCHEMES[m].name).join(" and ")} not found yet — press a button on it.` : "";
  $("startLocal").disabled = same;
  if (padsOnly) return;
  for (const el of document.querySelectorAll("[data-loc]")) { const [k, v] = el.dataset.loc.split(":"); el.classList.toggle("on", String(L[k]) === v); }
  $("locKeys1").textContent = SCHEMES[L.p1].keys; $("locKeys2").textContent = SCHEMES[L.p2].keys;
  $("locP2Body").innerHTML = GARAGE.body.filter((b) => owns(b)).map((b) => `<button data-loc="p2body:${b.id}" class="${L.p2body === b.id ? "on" : ""}">${esc(b.name)}</button>`).join("");
  $("locMateRow").hidden = L.mode === "1v1";
  $("locMateLabel").textContent = L.mode === "coop" ? "Computer opponents" : "Computer teammates";
}

// test hook (used by the automated browser checks and screenshots)
window.__tl = { THREE, G, S, rec, ann, AP, PR, ON, TOUCH, startLocal, showLocal, readInputFor, splitRects, keys, get post2() { return post2; }, saveProfile, openGarage, closeGarage, showCareer, celebrate, equip, get garage() { return garage; }, drawBanner, setArena, get stadium() { return stadium; }, openCup, showHub, showPreview, startCupMatch, finishCupMatch, startCeremony, showHall, startCup, trophy, get HALL() { return HALL; }, startLesson, showAcademy, showBrief, startReplay, endReplay, skipCinematic, get M() { return M; }, get views() { return views; }, scene, camera, renderer, cam, fx, stadium, ballMesh, perf, step, Q, post, LEVELS,
  startFree, startExhibition, newMatch, setFocus(i) { focus = i; },
  setCam(pos, look) { cam.manual = pos ? { pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look) } : null; },
  render() { if (post) post.render(scene, camera, G.t); else renderer.render(scene, camera); } };
