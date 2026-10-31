// Aegis Frontier: start-up, the game loop (fixed 60 Hz simulation), controls, and menu wiring.
import * as THREE from "../lib/three.module.min.js";
import { MISSIONS, missionById, siteById, SITES, COURSES, TRAINING, RESCUES, WEAPON_ORDER } from "./content.js";
import { Terrain } from "./terrain.js";
import { Colliders } from "./physics.js";
import { Nav } from "./nav.js";
import { World } from "./world.js";
import { Scenery, Sky } from "./scenery.js";
import { FX } from "./fx.js";
import { Audio } from "./audio.js";
import { Input } from "./input.js";
import { Player } from "./player.js";
import { Weapons, WDEF } from "./weapons.js";
import { Robots } from "./robots.js";
import { Allies } from "./allies.js";
import { Vehicles } from "./vehicles.js";
import { Projectiles, Combat } from "./projectiles.js";
import { Items } from "./items.js";
import { Boss } from "./boss.js";
import { UI } from "./ui.js";
import { Logic, DIFFS } from "./game.js";
import { Saves, newState } from "./save.js";
import { dist2, lerp } from "./util.js";
import { makeTextures, makeEnvironment, buildMaterials, srgb } from "./materials.js";
import { initStructureLook } from "./structures.js";
import { PostFX } from "./postfx.js";
import { buildGuardian } from "./models.js";

const STEP = 1 / 60;
// Graphics presets change real rendering work: internal resolution, shadows, grass and tree detail
// distance, draw distance, effects, bloom, and antialiasing. (Gameplay difficulty is separate.)
const QUALITY = {
  low:    { resCap: 720,  view: 340, lod: 170, shadows: 1024, shadowR: 40, density: 0.6, fx: 0.6, grass: 16, treeNear: 90,  bushR: 60,  bloom: false, msaa: 0, tex: 512 },
  medium: { resCap: 900,  view: 480, lod: 220, shadows: 1024, shadowR: 55, density: 0.8, fx: 0.85, grass: 28, treeNear: 130, bushR: 90,  bloom: true,  msaa: 0, tex: 512 },
  high:   { resCap: 1080, view: 650, lod: 300, shadows: 2048, shadowR: 70, density: 1,   fx: 1,   grass: 45, treeNear: 180, bushR: 120, bloom: true,  msaa: 4, tex: 1024 },
};
const $ = (s) => document.querySelector(s);
// let the loading bar repaint (falls back to a timer if the tab is in the background)
const nextFrame = () => new Promise((r) => { let done = false; const go = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(() => setTimeout(go, 0)); setTimeout(go, 60); });

class Game {
  constructor() {
    Object.assign(this, Logic);
    this.settings = Saves.loadSettings();
    this.mode = "loading"; this.time = 0; this.paused = true;
    this.state = newState(); this.flagSet = new Set();
    this.encs = {}; this.scanMarks = []; this.targets = [];
    this.tick = { mission: 0, enc: 0, rescue: 0, course: 0 };
  }
  get diff() { return DIFFS[this.state.difficulty] || DIFFS.standard; }
  get mods() { return this.state.mode === "campaign" || this.state.mode === "replay" ? this.settings.mods : this.settings.mods; }
  get aimAssist() { return this.diff.aim || this.settings.aimAssist; }
  get cinematic() { return this.mode !== "play"; }

  async load() {
    const bar = $("#loadFill"), txt = $("#loadText");
    const step = async (p, t) => { bar.style.transform = `scaleX(${p})`; txt.textContent = t; await nextFrame(); };
    const canvas = $("#view");
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    } catch (e) { throw new Error("This browser couldn't start 3D graphics (WebGL). Try Chrome or Edge with hardware acceleration turned on."); }
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.contextLost(); });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.settings.fov, 1, 0.08, 700);
    this.scene.add(this.camera);
    this.Q = QUALITY[this.settings.quality];
    await step(0.03, "Painting rock, soil, and grass…");
    this.tex = makeTextures(this.Q.tex);
    this.envMap = makeEnvironment(this.renderer);
    this.scene.environment = this.envMap;
    buildMaterials(this.tex, this.envMap); initStructureLook(this.tex);
    this.sunDir = new THREE.Vector3(-0.42, 0.62, 0.35).normalize();
    await step(0.1, "Shaping the land…");
    this.terrain = new Terrain(); this.terrain.build();
    await step(0.3, "Drawing valleys and canyons…");
    this.terrain.buildMeshes(this.scene, this.tex);
    this.col = new Colliders(this.terrain);
    await step(0.45, "Building outposts and strongholds…");
    this.audio = new Audio(); this.input = new Input(canvas); this.fx = new FX(this.scene);
    this.world = new World(this); this.world.build();
    await step(0.6, "Planting forests…");
    this.scenery = new Scenery(this.scene, this.terrain, this.col, this.tex);
    this.scenery.build(this.Q.density); this.scenery.buildWater(); this.scenery.buildBirds();
    this.scenery.blocked = this.world.interacts.map((i) => [i.x, i.z]).concat(this.world.itemDefs.map((d) => [d.home.x, d.home.z]));
    this.sky = new Sky(this.tex);
    this.post = new PostFX(this.renderer);
    await step(0.75, "Mapping safe routes…");
    this.nav = new Nav(this.terrain, this.col); this.nav.build();
    await step(0.88, "Waking up LUMA…");
    this.player = new Player(this);
    this.weapons = new Weapons(this);
    this.robots = new Robots(this);
    this.allies = new Allies(this);
    this.vehicles = new Vehicles(this);
    this.projectiles = new Projectiles(this);
    this.combat = new Combat(this);
    this.items = new Items(this); this.items.build();
    this.boss = new Boss(this);
    this.targets = [this.robots, this.world, this.boss];
    this.ui = new UI(this);
    this.setupLights();
    this.buildHero();
    this.applySettings();
    this.bindInput();
    this.bindMenus();
    this.resize(); addEventListener("resize", () => this.resize());
    await step(1, "Ready!");
    this.mode = "menu";
    this.ui.title();
    $("#loading").hidden = true;
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
    window.__aegis = this;
  }
  setupLights() {
    // warm sun at a noticeable angle, cool sky fill, sky reflections from the environment map
    this.hemi = new THREE.HemisphereLight(srgb(0.72, 0.82, 1), srgb(0.36, 0.33, 0.26), 0.55);
    this.sun = new THREE.DirectionalLight(srgb(1, 0.93, 0.8), 3.4);
    this.sun.position.copy(this.sunDir).multiplyScalar(150);
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.045;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    const haze = srgb(0.74, 0.84, 0.92);
    this.scene.fog = new THREE.Fog(haze, 120, 320);
    this.renderer.setClearColor(haze);
  }
  applySettings() {
    const S = this.settings, Q = (this.Q = QUALITY[S.quality]);
    // cap the internal 3D resolution (HUD text stays sharp because it is HTML)
    const pr = Math.min(devicePixelRatio || 1, Q.resCap / Math.max(1, innerHeight));
    this.renderer.setPixelRatio(Math.max(0.5, pr));
    this.camera.far = Q.view + 60; this.scene.fog.near = Q.view * 0.3; this.scene.fog.far = Q.view * 1.05;
    this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.enabled = true;
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(Q.shadows, Q.shadows);
    const c = this.sun.shadow.camera; c.left = c.bottom = -Q.shadowR; c.right = c.top = Q.shadowR; c.near = 1; c.far = 400; c.updateProjectionMatrix();
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
    this.fx.scale = Q.fx; this.fx.reducedFlash = S.reducedFlash;
    this.post.setup(Q.bloom, Q.msaa); this.post.reducedFlash = S.reducedFlash;
    if (this.scenery) this.scenery.refreshNow();
    this.audio.sfxVol = S.sfx; this.audio.musicVol = S.music; this.audio.muted = S.mute; this.audio.apply();
    this.input.ctrlCrouch = S.ctrlCrouch;
    document.documentElement.style.setProperty("--ts", S.textScale);
    document.querySelector("#perf").hidden = !S.showPerf;
    this.resize();
  }
  // Title screen: the Guardian on the ridge above the valley, with the ring in the sky behind.
  buildHero() {
    this.hero = buildGuardian(this.suitColors());
    const hx = -52, hz = 534;
    this.hero.position.set(hx, this.terrain.heightAt(hx, hz), hz);
    this.hero.rotation.y = 0.35;
    this.hero.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.hero.visible = false;
    this.scene.add(this.hero);
  }
  resize() {
    if (!this.renderer) return;
    this.renderer.setSize(innerWidth, innerHeight, false);
    if (this.post) this.post.size();
    this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
  }
  contextLost() {
    this.mode = "menu";
    try { this.saveNow(); } catch (e) {}
    $("#errorBox").hidden = false;
    $("#errorText").textContent = "The browser reset the 3D graphics (this can happen when a laptop is low on memory). Your progress was saved. Reload to keep playing.";
  }

  // ---------------- starting play ----------------
  async startCampaign(slot, state, fresh) {
    this.slot = slot;
    this.state = state;
    this.state.mode = state.campaignDone && state.mission === "done" ? "campaign" : "campaign";
    await this.enterWorld();
    if (fresh) { this.saveNow(); this.introSequence(); }
    else this.resumePlay(true);
    if (window.PlayCount) PlayCount.hit("aegis-frontier");
  }
  async enterWorld() {
    this.resetWorldRuntime();
    this.flagSet = new Set(this.state.flags);
    this.player.throwables = this.state.throwables;
    this.weapons.cur = 0;
    for (const w of this.state.weapons) this.weapons.ammo(w);
    this.world.refreshToggles(true);
    this.items.refresh();
    this.boss.reset();
    for (const b of this.capturedBases()) this.spawnBaseLife(b);
    if (this.flag("claim:crawler")) this.spawnClaimedCrawler();
    // a Trailrunner parked on the trail below the Old Span (drivable once the rover is unlocked)
    if (this.state.mode !== "training") { const pr = this.vehicles.spawn("rover", -10, 506, 0.9); pr.parked = true; }
    if (this.flag("camp:brief")) this.campBriefingSilent();
    this.respawnSafe();
    this.player.heal(true);
    this.ending = false;
    this.ui.objective(this.objective() ? this.objective().text : "");
  }
  campBriefingSilent() {
    const b = this.world.anchors.get("B8.ally1"), n = this.state.stats.rescues;
    for (let k = 0; k < Math.min(6, n); k++) this.allies.add("civ", b.x + (k % 3) * 2, b.z + 4 + Math.floor(k / 3) * 2, { tag: "camp", wander: true, k });
  }
  resetWorldRuntime() {
    this.resetEncounters();
    this.allies.clearAll();
    this.vehicles.clearAll();
    this.projectiles.clear();
    this.encs = {}; this.scanMarks = []; this.rowan = null; this.customWaypoint = null; this.course = null;
    if (this.podMesh) { this.scene.remove(this.podMesh); this.podMesh = null; }
    this.player.vehicle = null; this.player.carry = null; this.player.barrier = null; this.player.barrierMesh.visible = false; this.player.tether = null;
    this.ui.bossBar(false);
    this.time = this.time || 0;
  }
  introSequence() {
    // landing: start at the crash site with Rowan
    const a = this.world.anchors.get("crash.start");
    this.player.place(a.x, a.y, a.z, 0.15);
    this.setCheckpoint(a.x, a.z);
    this.showBriefing(MISSIONS[0]);
  }
  resumePlay(fromLoad) {
    const o = this.objective();
    if (fromLoad && o) { this.hook("start", o); this.ui.objective(o.text); }
    if (fromLoad && this.state.mission !== "done" && this.state.obj === 0 && !this.state.completed.includes(this.state.mission) && this.mission() && this.state.mission !== "m1") { this.showBriefing(this.mission()); return; }
    this.play();
  }
  play() {
    this.ui.hideScreens(); this.ui.hud(true);
    this.mode = "play"; this.paused = false;
    this.audio.start(); this.audio.resume();
    this.input.enabled = true;
    this.input.lock();
  }
  async startTraining() {
    this.slot = null;
    const st = newState("explorer");
    st.mode = "training";
    st.flags = ["equip:tether", "equip:beacon", "equip:barrier", "equip:dash", "vehicle:rover"];
    st.weapons = ["pistol", "carbine"]; st.loadout = ["carbine", "pistol"];
    this.state = st;
    await this.enterWorld();
    const s = siteById.training, a = this.world.anchors.get("training.start"), r = this.world.anchors.get("training.rover");
    this.player.place(a.x, a.y, a.z, 0);
    this.state.checkpoint = { x: a.x, y: a.y, z: a.z, yaw: 0 };
    this.vehicles.spawn("rover", r.x, r.z, Math.PI);
    this.trainStep = 0; this.trainTargets = 0;
    this.ui.objective(TRAINING[0].text);
    this.say("luma", "Welcome to training! Follow the yellow markers. Nothing here is saved, so experiment freely.");
    this.play();
  }
  async startReplay(id) {
    const m = missionById[id];
    const st = JSON.parse(JSON.stringify(this.state));
    st.mode = "replay"; st.mission = id; st.obj = 0;
    // reset the world flags this mission changes, only inside the replay copy
    const drop = new Set();
    for (const o of m.objectives) {
      if (o.flags) for (const f of o.flags) { drop.add(f); const [k, v] = f.split(":"); if (k === "base") { drop.add("baserelay:" + v); drop.add("clear:" + v); } if (k === "stronghold") { drop.add("clear:" + v); ["s1:e1", "s1:e2", "s4:t1", "s4:t2", "bastion:e1", "bastion:e2", "bastion:e3"].forEach((q) => q.startsWith(v === "S1" ? "s1" : v === "S5" ? "bastion" : "x") && drop.add(q)); } }
      if (o.enc) drop.add("clear:" + o.enc);
      if (o.escort) { drop.add("escort:" + o.escort); }
    }
    if (id === "m4") drop.add("convoy:repair"), drop.add("clear:m4_ambush");
    if (id === "m7") drop.add("crossing_restored");
    if (id === "m9") ["aa:1", "aa:2", "aa:3"].forEach((f) => drop.add(f));
    if (id === "m12") drop.add("boss:atlas"), drop.add("heart:reconnect");
    st.flags = st.flags.filter((f) => !drop.has(f));
    this.state = st;
    await this.enterWorld();
    const first = m.objectives.find((o) => o.cp);
    if (first) this.setCheckpoint(first.cp[0], first.cp[1]);
    this.respawnSafe();
    this.showBriefing(m);
  }
  exitToTitle(save = true) {
    if (save && this.state.mode === "campaign" && this.slot) { if (this.robots.engagedCount() === 0 && this.player.grounded) this.checkpointHere(); this.saveNow(); }
    this.mode = "menu"; this.paused = true;
    this.input.enabled = false; this.input.unlock();
    this.resetWorldRuntime();
    this.ui.hud(false);
    this.audio.suspend();
    this.ui.title();
  }
  returnToWebsite() {
    if (this.state.mode === "campaign" && this.slot && this.mode !== "menu") { if (this.robots.engagedCount() === 0 && this.player.grounded) this.checkpointHere(); this.saveNow(); }
    try { this.audio.stop(); this.renderer.dispose(); } catch (e) {}
    location.href = "../../index.html";
  }

  // ---------------- helpers used across systems ----------------
  say(who, text, o) { this.ui.say(who, text, o || {}); }
  sayLines(lines, important) { for (const [w, t] of lines) this.ui.say(w, t, {}); }
  noise(pos, R) { this.robots.noise(pos.clone ? pos.clone() : new THREE.Vector3(pos.x, pos.y, pos.z), R); }
  markScan(pos, R, dur, deep) {
    const until = this.time + dur, out = [];
    for (const it of this.world.interacts) {
      if (Math.hypot(it.x - pos.x, it.z - pos.z) > R) continue;
      const r = this.canUse(it);
      if (r.no) continue;
      out.push({ x: it.x, y: it.y, z: it.z, shape: it.kind === "supply" || it.kind === "bossSupply" ? "circle" : "square", color: it.kind === "supply" ? "#7affc8" : "#9fd8ff", label: r.text || "", until });
    }
    for (const c of this.items.cells) if (!c.carried && Math.hypot(c.x - pos.x, c.z - pos.z) < R) out.push({ x: c.x, y: c.y, z: c.z, shape: "hex", color: "#7af0ff", label: "Energy cell", until });
    for (const s of this.world.shootables) if (s.alive && Math.hypot(s.x - pos.x, s.z - pos.z) < R) out.push({ x: s.x, y: s.y - 0.8, z: s.z, shape: "circle", color: "#ffb347", label: s.label, until });
    if (deep) for (const c of this.items.collectibles) if (c.m.visible && Math.hypot(c.x - pos.x, c.z - pos.z) < R * 1.6) out.push({ x: c.x, y: c.y, z: c.z, shape: c.kind === "core" ? "star" : c.kind === "rec" ? "tri" : "star", color: c.kind === "core" ? "#6ff2e0" : c.kind === "rec" ? "#ffb347" : "#ffd34a", label: c.kind === "core" ? "Upgrade core" : c.kind === "rec" ? "Recording" : "Emblem", until: this.time + dur * 2, ref: c });
    this.scanMarks = this.scanMarks.filter((m) => m.until > this.time).concat(out);
  }
  openMenu(name) {
    this.mode = "menu-" + name;
    this.menuOpen = true;
    this.input.unlock();
    this.ui.show(name);
  }
  closeMenu() {
    this.menuOpen = false;
    this.input.pressed.clear();
    if (this.mode === "recovery" || this.mode === "menu") return;
    this.ui.hideScreens();
    this.mode = "play";
    this.input.lock();
  }
  objectiveMarker() {
    if (this.state.mode === "training") { const s = TRAINING[this.trainStep]; if (!s) return null; if (s.at) return { x: s.at[0], y: this.terrain.heightAt(s.at[0], s.at[1]) + 2 + (s.minY || 0), z: s.at[1] }; if (s.type === "targets") { const a = siteById.training; return { x: a.x - 25, y: a.y + 3, z: a.z + 13 }; } return null; }
    const o = this.objective();
    if (!o || !o.marker) return this.customWaypoint || null;
    let mk = o.marker;
    if (mk === "escort") { const e = this.escortPos(); return e ? { x: e.x, y: e.y + 4, z: e.z } : null; }
    if (Array.isArray(mk) && typeof mk[0] === "number") return { x: mk[0], y: this.terrain.heightAt(mk[0], mk[1]) + 2, z: mk[1] };
    if (Array.isArray(mk)) {
      // several markers: point at the nearest unfinished one
      const p = this.player.vehicle ? this.player.vehicle.pos : this.player.pos;
      let best = null, bd = 1e9;
      mk.forEach((id, i) => {
        if (o.flags && this.flag(o.flags[i])) return;
        const a = this.world.anchor(id);
        if (!a) return;
        const d = Math.hypot(a.x - p.x, a.z - p.z);
        if (d < bd) { bd = d; best = a; }
      });
      return best ? { x: best.x, y: best.y + 1.5, z: best.z } : null;
    }
    const a = this.world.anchor(mk);
    return a ? { x: a.x, y: a.y + 1.5, z: a.z } : null;
  }

  // ---------------- input ----------------
  bindInput() {
    const I = this.input;
    I.onLockChange = (locked) => {
      if (!locked && this.mode === "play") this.pauseGame();
      $("#lockHint").hidden = locked || this.mode !== "play";
    };
    I.lockError = () => {
      if (this.mode !== "play") return;
      $("#lockHint").hidden = false;
      $("#lockHint").textContent = "Your browser didn't capture the mouse. Click the game view to try again, or press Esc for the menu.";
    };
    $("#view").addEventListener("click", () => { if (this.mode === "play" && !I.locked) I.lock(); });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { this.audio.suspend(); if (this.mode === "play") this.pauseGame(); }
      else if (this.mode !== "menu" && this.mode !== "loading") this.audio.resume();
    });
    addEventListener("blur", () => { if (this.mode === "play") this.pauseGame(); });
    addEventListener("keydown", (e) => {
      if (e.code === "Enter" || e.code === "Space") {
        if (this.mode === "briefing" && e.code === "Enter") { e.preventDefault(); $("#btnBriefGo").click(); }
        if (this.mode === "ending" && !$("#endLine").hidden) { e.preventDefault(); this.ui.endNext(); }
      }
      if (this.mode === "play") return;
      if (e.code === "Escape" || e.code === "Tab" || e.code === "KeyM") {
        if (this.mode.startsWith("menu-")) { e.preventDefault(); if (e.code !== "Escape" || !this.escUsed) this.closeMenu(); }
      }
    });
  }
  pauseGame() {
    if (this.mode !== "play") return;
    this.mode = "pause"; this.paused = true;
    this.input.unlock();
    this.ui.pause();
    if (this.state.mode === "campaign" && this.robots.engagedCount() === 0 && this.player.grounded && !this.player.vehicle) this.checkpointHere();
  }
  handleActions() {
    const I = this.input, P = this.player, W = this.weapons;
    if (I.hit("KeyM")) { this.ui.openMap(); return; }
    if (I.hit("Tab")) { this.ui.journal("obj"); return; }
    if (I.hit("Enter")) this.ui.skipSub();
    if (P.vehicle) {
      if (!this.course) this.ui.prompt(null);
      if (I.hit("KeyE")) this.vehicles.exit(false);
      return;
    }
    for (const [code, eq] of [["Digit1", "tether"], ["Digit2", "beacon"], ["Digit3", "barrier"], ["Digit4", "dash"]]) if (I.hit(code)) { P.equipSel = eq; this.audio.play("ui"); if (!P.unlocked(eq)) this.ui.toast(`${eq[0].toUpperCase() + eq.slice(1)} isn't unlocked yet.`); }
    if (I.hit("KeyQ")) P.useEquipment();
    if (I.hit("KeyF")) { if (P.unlocked("tether")) P.useTether(); }
    if (I.hit("KeyV")) P.repulse();
    if (I.hit("KeyG")) P.throwItem();
    if (I.hit("KeyT")) P.switchThrowable();
    if (I.hit("KeyR")) W.startReload();
    if (I.wheel || I.hit("KeyX")) W.swap();
    this.handleInteract();
  }
  // nearest usable thing in front of the player
  findInteract() {
    const P = this.player, e = P.eye(new THREE.Vector3()), f = P.forward(new THREE.Vector3());
    let best = null, bd = 1e9;
    const consider = (x, y, z, R, obj) => {
      const dx = x - e.x, dy = y - e.y, dz = z - e.z, d = Math.hypot(dx, dy, dz);
      if (d > R) return;
      const facing = (dx * f.x + dy * f.y + dz * f.z) / (d || 1);
      const score = d - facing * 1.2;
      if (facing > -0.2 && score < bd) { bd = score; best = obj; }
    };
    for (const it of this.world.interacts) consider(it.x, it.y, it.z, 2.8, { kind: "it", it });
    if (!P.carry) for (const c of this.items.cells) if (!c.carried) consider(c.x, c.y, c.z, 2.4, { kind: "cell", c });
    for (const v of this.vehicles.list) if (!v.dead) consider(v.pos.x, v.pos.y + 1, v.pos.z, v.T.r + 2.8, { kind: "veh", v });
    for (const a of this.allies.list) if (a.kind === "ranger" && a.tag && a.tag.startsWith("base:")) consider(a.pos.x, a.pos.y + 1.4, a.pos.z, 2.6, { kind: "ally", a });
    return best;
  }
  handleInteract() {
    const I = this.input, P = this.player;
    const t = this.findInteract();
    let label = null, gray = false, hold = 0, act = null;
    if (t && t.kind === "it") {
      const r = this.canUse(t.it);
      if (!r.no) { if (r.msg) { label = r.msg; gray = true; } else { label = r.text; hold = r.hold || 0; act = () => this.useInteract(t.it); } }
    } else if (t && t.kind === "cell") { label = "Pick up the energy cell"; act = () => this.items.carry(t.c); }
    else if (t && t.kind === "veh") {
      if (t.v.parked && this.state.mode === "campaign" && !this.vehicleUnlocked("rover")) { label = "This Trailrunner has no power yet. Reconnect Greenreach Outpost first."; gray = true; }
      else { label = `Enter the ${t.v.name}`; act = () => this.vehicles.enter(t.v); }
    } else if (t && t.kind === "ally") {
      const following = t.a.mode === "follow";
      label = following ? "Ask the ranger to stay at the base" : this.allies.followers().length >= 2 ? "Two rangers are already with you" : "Ask the ranger to join you";
      gray = !following && this.allies.followers().length >= 2;
      if (!gray) act = () => { if (following) { t.a.mode = "idle"; t.a.wander = true; t.a.home.copy(t.a.pos); this.say("ranger", "Holding here. Good luck out there!", { short: true }); } else { t.a.mode = "follow"; t.a.wander = false; this.say("ranger", "Right behind you, Guardian!", { short: true }); } };
    }
    if (P.carry && (!t || t.kind !== "it" || t.it.kind !== "socket")) { label = label && !gray ? label : "Set down the energy cell"; if (!act) act = () => this.items.dropCarry(); }
    // hold-to-use
    if (act && hold > 0.35) {
      if (I.key("KeyE") && this.holdTarget === t.it) {
        this.holdT += STEP * this.frameSteps;
        if (this.holdT >= hold) { this.holdT = 0; this.holdTarget = null; act(); }
      } else if (I.hit("KeyE")) { this.holdTarget = t.it; this.holdT = 0; }
      else if (!I.key("KeyE")) { this.holdTarget = null; this.holdT = 0; }
      this.ui.prompt(label, this.holdTarget === t.it ? this.holdT / hold : 0);
    } else {
      this.holdTarget = null;
      this.ui.prompt(label, undefined, gray);
      if (act && I.hit("KeyE")) act();
    }
  }

  // ---------------- loop ----------------
  frame(now) {
    requestAnimationFrame((t) => this.frame(t));
    let dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.mode === "loading") return;
    const playing = this.mode === "play";
    this.frameSteps = 0;
    if (playing) {
      this.acc = (this.acc || 0) + dt;
      let n = 0;
      while (this.acc >= STEP && n < 6) { this.simulate(STEP); this.acc -= STEP; n++; }
      if (n === 6) this.acc = 0;
      this.frameSteps = n;
      this.handleActions();
    }
    this.render(dt, playing);
    this.input.endFrame();
  }
  simulate(dt) {
    const I = this.input, P = this.player, W = this.weapons;
    this.time += dt;
    (P.prevPos || (P.prevPos = P.pos.clone())).copy(P.pos);
    if (P.vehicle) { P.pos.copy(P.vehicle.pos); P.pos.y += 0.5; this.world.enforceBounds(P.vehicle.pos, P.vehicle); }
    else P.update(dt);
    const canFire = !P.vehicle && !P.carry && !P.mantle && !P.sprinting;
    W.update(dt, I.mouse[0], I.mouse[2], canFire);
    this.vehicles.update(dt);
    this.robots.update(dt);
    this.allies.update(dt);
    this.projectiles.update(dt);
    this.items.update(dt);
    this.boss.update(dt);
    this.world.update(dt);
    this.tickPod(dt);
    this.tickCourses(dt);
    this.tick.mission -= dt; this.tick.enc -= dt; this.tick.rescue -= dt;
    if (this.tick.mission <= 0) { this.tick.mission = 0.2; this.tickMission(0.2); this.discoverNear(P.pos.x, P.pos.z, 70); }
    if (this.tick.enc <= 0) { this.tick.enc = 0.5; this.tickEncounters(); }
    if (this.tick.rescue <= 0) { this.tick.rescue = 1; this.tickRescueTeams(); }
    this.tickSave(dt);
    this.audio.setCombat(this.robots.engagedCount() > 0);
  }
  render(dt, playing) {
    const P = this.player, cam = this.camera, W = this.weapons, r = this.renderer;
    this.dtFrame = dt;
    cam.fov = this.settings.fov * (P.vehicle ? 1 : W.adsFactor);
    cam.updateProjectionMatrix();
    // smooth the camera between 60 Hz simulation steps (screens can refresh faster or slower)
    if (playing && P.prevPos && !P.vehicle) P.renderPos = (P.renderPos || P.pos.clone()).copy(P.prevPos).lerp(P.pos, Math.min(1, (this.acc || 0) / STEP));
    else P.renderPos = null;
    if (P.vehicle) this.vehicles.applyCamera(cam); else P.applyCamera(cam, dt);
    const menu = this.mode === "menu" || this.mode === "loading";
    this.hero.visible = menu;
    if (menu) for (const c of this.world.curtains) c.mesh.visible = false;   // barrier fields come back when play starts
    if (menu) {
      const t = performance.now() / 1000, h = this.hero.position;
      cam.fov = 50; cam.updateProjectionMatrix();
      cam.position.set(h.x + 0.5 + Math.sin(t * 0.08) * 0.25, h.y + 1.45, h.z + 2.4);
      cam.lookAt(h.x, h.y + 1.3, h.z);
      // turn so the Guardian sits at ~70% of the screen width, clear of the menu card
      const halfH = Math.atan(Math.tan((cam.fov * Math.PI) / 360) * cam.aspect);
      cam.rotateY(Math.atan((innerWidth > 760 ? 0.42 : 0) * Math.tan(halfH)));
      this.hero.rotation.y = 0.35 + Math.sin(t * 0.3) * 0.03;
    }
    if (this.mode === "ending") { const t = performance.now() / 1000, c = siteById.citadel; cam.position.set(c.x + Math.cos(t * 0.1) * 120, c.y + 70, c.z + Math.sin(t * 0.1) * 120); cam.lookAt(c.x, c.y + 10, c.z); }
    this.terrain.updateLOD(cam.position.x, cam.position.z, this.Q.lod, this.Q.view);
    this.scenery.update(playing ? dt : 0.016, cam.position.x, cam.position.z, this.Q.view, this.Q);
    this.sky.update(dt);
    // shadows follow the camera; snapping to shadow-map texels keeps edges from shimmering
    {
      const R = this.Q.shadowR, texel = (2 * R) / this.Q.shadows;
      const fx = Math.round(cam.position.x / texel) * texel, fz = Math.round(cam.position.z / texel) * texel;
      const fy = this.terrain.heightAt(cam.position.x, cam.position.z);
      this.sun.target.position.set(fx, fy, fz); this.sun.position.set(fx, fy, fz).addScaledVector(this.sunDir, 150);
    }
    if (playing) this.ui.updateHUD(dt);
    this.fx.update(playing ? dt : 0);
    r.info.reset();
    this.post.begin();
    r.clear();
    this.sky.render(r, cam);
    r.clearDepth();
    r.render(this.scene, cam);
    if (playing && !P.vehicle && !(W.id === "prism" && W.adsT > 0.9)) { W.updateView(dt, cam); W.render(r); }
    this.post.end();
    this.fx.clearBeams();
    this.perfSample(dt);
  }
  // Optional performance readout (Settings: Show performance). rAF timing includes waiting for the
  // display, so it is labeled "frame time", not GPU time.
  perfSample(dt) {
    if (!this.settings.showPerf) return;
    const p = (this.perf ||= { ms: [], t: 0 });
    p.ms.push(dt * 1000); p.t += dt;
    if (p.t < 0.5) return;
    const a = p.ms.slice().sort((x, y) => x - y), avg = a.reduce((s, v) => s + v, 0) / a.length, p95 = a[Math.floor(a.length * 0.95)] || avg;
    const v = this.renderer.getDrawingBufferSize(new THREE.Vector2()), info = this.renderer.info.render;
    document.querySelector("#perf").textContent = `${(1000 / avg).toFixed(0)} FPS · frame ${avg.toFixed(1)} ms (95%: ${p95.toFixed(1)} ms) · ${info.calls} draws · ${(info.triangles / 1000).toFixed(0)}k tris · ${v.x}×${v.y} · ${this.settings.quality}`;
    p.ms = []; p.t = 0;
  }

  // ---------------- courses ----------------
  tickCourses(dt) {
    const P = this.player;
    if (!this.courseMeshes) this.buildCourses();
    const c = this.course;
    const p = P.vehicle ? P.vehicle.pos : P.pos;
    if (!c) {
      for (const def of COURSES) {
        if (def.need && !this.flag(def.need)) continue;
        if (this.state.mode === "training") continue;
        const inRover = P.vehicle && P.vehicle.type === "rover";
        if (dist2(p.x, p.z, def.at[0], def.at[1]) < 5 && (def.kind === "rover" ? inRover : !P.vehicle)) {
          this.course = { def, i: 0, t: 0 };
          this.ui.banner(def.name, def.kind === "rover" ? "Rover course: drive through every ring!" : "Tether route: pass through every ring!");
          this.showCourse(def, 0);
        }
      }
      return;
    }
    c.t += dt;
    const ring = c.def.rings[c.i];
    const ry = ring[2] !== undefined ? this.terrain.heightAt(ring[0], ring[1]) + ring[2] : null;
    const close = c.def.kind === "rover" ? dist2(p.x, p.z, ring[0], ring[1]) < 7 : Math.hypot(p.x - ring[0], p.y + 1 - ry, p.z - ring[1]) < 4.5;
    if (close) {
      c.i++; this.audio.play("objective");
      if (c.i >= c.def.rings.length) {
        const best = this.state.courses[c.def.id];
        if (!best || c.t < best) this.state.courses[c.def.id] = c.t;
        this.ui.banner(`${c.def.name}: ${c.t.toFixed(1)} s`, c.t <= c.def.par ? "Under par! Excellent." : `Par is ${c.def.par} s. Try again any time.`);
        if (this.setFlag("course:" + c.def.id)) { this.giveSP(c.def.sp); if (c.def.unlock) this.unlock(c.def.unlock); }
        this.course = null; this.showCourse(null); this.saveSoon();
      } else this.showCourse(c.def, c.i);
    }
    if (c && (c.t > c.def.par * 3 || (c.def.kind === "rover" && !P.vehicle))) { this.ui.toast("Course cancelled."); this.course = null; this.showCourse(null); }
    if (this.course) this.ui.prompt(`${c.def.name} · ring ${c.i + 1}/${c.def.rings.length} · ${c.t.toFixed(1)} s`, undefined, true);
  }
  buildCourses() {
    this.courseMeshes = [];
    const geo = new THREE.TorusGeometry(3.4, 0.25, 8, 28);
    for (const def of COURSES) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
      const y = this.col.groundAt(def.at[0], def.at[1], this.terrain.heightAt(def.at[0], def.at[1]) + 2);
      m.position.set(def.at[0], y + 0.1, def.at[1]); this.scene.add(m);
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 0.2), new THREE.MeshBasicMaterial({ color: 0x9fd8ff })); pole.position.set(def.at[0], y + 2, def.at[1]); this.scene.add(pole);
    }
    this.ringMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd34a }));
    this.ringMesh.visible = false; this.scene.add(this.ringMesh);
  }
  showCourse(def, i) {
    if (!def) { this.ringMesh.visible = false; return; }
    const r = def.rings[i];
    const y = r[2] !== undefined ? this.terrain.heightAt(r[0], r[1]) + r[2] : this.terrain.heightAt(r[0], r[1]) + 3;
    this.ringMesh.position.set(r[0], y, r[1]);
    const prev = i > 0 ? def.rings[i - 1] : def.at;
    this.ringMesh.rotation.set(0, Math.atan2(r[0] - prev[0], r[1] - prev[1]), 0);
    this.ringMesh.visible = true;
    this.customWaypoint = { x: r[0], y, z: r[1] };
  }

  // ---------------- menus ----------------
  bindMenus() {
    const on = (sel, fn) => $(sel).addEventListener("click", (e) => { this.audio.start(); fn(e); });
    on("#btnContinue", async () => {
      const n = +$("#btnContinue").dataset.slot, r = Saves.read(n);
      if (r.state) await this.startCampaign(n, r.state, false);
    });
    on("#btnNew", () => this.ui.slots("new"));
    on("#btnSlots", () => this.ui.slots("load"));
    on("#btnTraining", () => this.startTraining());
    on("#btnSettings", () => this.ui.settings("title"));
    on("#btnControls", () => this.ui.controls("title"));
    for (const b of document.querySelectorAll("[data-web]")) b.addEventListener("click", () => this.returnToWebsite());
    for (const b of document.querySelectorAll("[data-back]")) b.addEventListener("click", () => {
      let to = b.dataset.back;
      if (to === "settings") to = this.ui.settingsBack || "title";
      if (to === "controls") to = this.ui.controlsBack || "title";
      if (to === "pause") this.ui.pause(); else if (to === "title") this.ui.title(); else if (to === "slots") this.ui.slots(this.ui.slotPurpose || "new"); else this.ui.show(to);
    });
    // slots
    $("#slotList").addEventListener("click", async (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const n = +b.dataset.n, act = b.dataset.act;
      if (act === "new") {
        const r = Saves.read(n);
        if (!r.empty && !confirm(`Overwrite slot ${n}? The progress saved there will be replaced.`)) return;
        this.pendingSlot = n; this.ui.difficulty();
      } else if (act === "play") { const r = Saves.read(n); if (r.state) await this.startCampaign(n, r.state, false); }
      else if (act === "del") { if (confirm(`Delete slot ${n}? This can't be undone.`)) { Saves.remove(n); this.ui.slots(this.ui.slotPurpose); } }
      else if (act === "exp") {
        const r = Saves.read(n); if (!r.state) return;
        const blob = new Blob([Saves.exportText(r.state)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `aegis-frontier-slot-${n}.json`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      } else if (act === "imp") { this.importSlot = n; $("#importFile").value = ""; $("#importFile").click(); }
    });
    $("#importFile").addEventListener("change", async () => {
      const f = $("#importFile").files[0]; if (!f) return;
      if (f.size > 200000) { alert("That file is too large to be an Aegis Frontier save."); return; }
      try {
        const st = Saves.importText(await f.text());
        const r = Saves.read(this.importSlot);
        if (!r.empty && !confirm(`Replace slot ${this.importSlot} with the imported save?`)) return;
        Saves.write(this.importSlot, st); this.ui.slots("load"); this.ui.toast("Save imported.");
      } catch (err) { alert("Import failed: " + err.message); }
    });
    // difficulty
    for (const b of document.querySelectorAll("#diff [data-pick]")) b.addEventListener("click", async () => {
      const st = newState(b.dataset.pick);
      await this.startCampaign(this.pendingSlot || 1, st, true);
    });
    // settings
    $("#settingsBody").addEventListener("input", (e) => {
      const el = e.target, k = el.dataset.set;
      if (el.dataset.mod) { this.settings.mods[el.dataset.mod] = el.checked; }
      else if (k) {
        const v = el.type === "checkbox" ? el.checked : el.type === "range" ? +el.value : el.value;
        this.settings[k] = v;
        const out = el.parentElement.querySelector("output");
        if (out) out.textContent = k === "fov" ? v + "°" : k === "sens" ? (+v).toFixed(2) : Math.round(v * 100) + "%";
      }
      Saves.saveSettings(this.settings); this.applySettings();
    });
    $("#settingsBody").addEventListener("click", (e) => {
      if (e.target.id === "btnGfxReset") { Object.assign(this.settings, { quality: "low", reducedFlash: false, showPerf: false, shake: 1, headBob: true }); Saves.saveSettings(this.settings); this.applySettings(); this.ui.settings(this.ui.settingsBack); return; }
      if (e.target.id === "btnFull") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => this.ui.toast("Fullscreen isn't available here.")); } });
    // pause
    on("#btnResume", () => this.closePause());
    on("#btnPMap", () => { this.mode = "play"; this.ui.openMap(); });
    on("#btnPJournal", () => { this.mode = "play"; this.ui.journal("obj"); });
    on("#btnPUp", () => { this.mode = "play"; this.ui.journal("upg"); });
    on("#btnPSettings", () => this.ui.settings("pause"));
    on("#btnPControls", () => this.ui.controls("pause"));
    on("#btnPExit", () => this.exitToTitle(true));
    $("#pauseDiff").addEventListener("click", (e) => { const d = e.target.dataset.diff; if (d) { this.state.difficulty = d; this.ui.pause(); this.ui.toast(`Difficulty: ${DIFFS[d].name}`); this.saveSoon(); } });
    $("#recDiff").addEventListener("click", (e) => { const d = e.target.dataset.diff; if (d) { this.state.difficulty = d; this.ui.recovery(); } });
    on("#btnRetry", () => { this.retryCheckpoint(); this.play(); });
    on("#btnRecExit", () => { this.retryCheckpoint(); this.exitToTitle(true); });
    // briefing
    on("#btnBriefGo", () => { const cb = this.ui.briefDone; this.ui.briefDone = null; this.play(); if (cb) cb(); });
    // in-game menus
    for (const b of document.querySelectorAll("[data-close]")) b.addEventListener("click", () => this.closeMenu());
    $("#armoryList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-arm]"); if (!b) return;
      const id = b.dataset.arm, slot = +b.dataset.slot, S = this.state;
      const other = S.loadout[1 - slot];
      if (other === id) S.loadout[1 - slot] = S.loadout[slot];
      S.loadout[slot] = id;
      const d = WDEF[id]; S.ammo[id] = [d.mag || 0, d.reserve === Infinity ? 0 : d.reserve];
      this.weapons.cur = slot; this.weapons.switchT = 0.35;
      this.ui.armory(); this.saveSoon();
    });
    $("#vehicleList").addEventListener("click", (e) => { const b = e.target.closest("[data-veh]"); if (!b) return; this.requestVehicle(b.dataset.veh, this.ui.vehBase); this.closeMenu(); });
    $("#jtabs").addEventListener("click", (e) => { const t = e.target.dataset.tab; if (t) this.ui.journal(t); });
    $("#journalBody").addEventListener("click", async (e) => {
      const up = e.target.closest("[data-up]"); if (up) { this.buyUpgrade(up.dataset.up); this.ui.journal("upg"); return; }
      const su = e.target.closest("[data-suit]"); if (su) { this.state.suit = su.dataset.suit; this.saveSoon(); this.ui.journal("equip"); return; }
      const rp = e.target.closest("[data-replay]"); if (rp) { if (confirm("Replay this mission? Your campaign progress is saved first and won't change.")) { this.saveNow(); this.campaignBackup = { slot: this.slot }; await this.startReplay(rp.dataset.replay); } return; }
    });
    $("#journalBody").addEventListener("toggle", (e) => { const d = e.target.closest("[data-rec]"); if (d && d.open && !this.state.read.includes(d.dataset.rec)) { this.state.read.push(d.dataset.rec); this.saveSoon(); } }, true);
    // map
    const mc = $("#mapCanvas");
    let drag = null;
    mc.addEventListener("mousedown", (e) => { drag = { x: e.clientX, y: e.clientY, cx: this.ui.mapView.cx, cz: this.ui.mapView.cz, moved: false }; });
    addEventListener("mousemove", (e) => {
      if (!drag) return;
      const scale = (Math.min(mc.width, mc.height) / 1280) * this.ui.mapView.zoom;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4) drag.moved = true;
      this.ui.mapView.cx = drag.cx - (e.clientX - drag.x) / scale; this.ui.mapView.cz = drag.cz - (e.clientY - drag.y) / scale;
      this.ui.drawMap();
    });
    addEventListener("mouseup", (e) => { if (drag && !drag.moved && e.target === mc) { const r = mc.getBoundingClientRect(); this.ui.mapClick(e.clientX - r.left, e.clientY - r.top, e.button === 2); } drag = null; });
    mc.addEventListener("contextmenu", (e) => { e.preventDefault(); this.customWaypoint = null; this.ui.drawMap(); });
    mc.addEventListener("wheel", (e) => { e.preventDefault(); this.ui.mapView.zoom = Math.min(6, Math.max(0.8, this.ui.mapView.zoom * (e.deltaY < 0 ? 1.2 : 0.83))); this.ui.drawMap(); }, { passive: false });
    on("#mapZoomIn", () => { this.ui.mapView.zoom = Math.min(6, this.ui.mapView.zoom * 1.3); this.ui.drawMap(); });
    on("#mapZoomOut", () => { this.ui.mapView.zoom = Math.max(0.8, this.ui.mapView.zoom / 1.3); this.ui.drawMap(); });
    $("#mapFilters").addEventListener("change", (e) => { const k = e.target.dataset.filter; if (k) { this.ui.mapView.filters[k] = e.target.checked; this.ui.drawMap(); } });
    $("#mapInfo").addEventListener("click", (e) => { const b = e.target.closest("[data-travel]"); if (b && this.fastTravel(b.dataset.travel)) this.closeMenu(); });
    // ending
    $("#ending").addEventListener("click", (e) => { if (!$("#endLine").hidden) this.ui.endNext(); });
    on("#endExplore", async () => { const S = this.state; if (S.mode === "campaign") { this.ending = false; const a = siteById.B8; this.setCheckpoint(a.x, a.z + 6); this.saveNow(); await this.enterWorld(); this.play(); this.ui.toast("Free exploration: all optional activities remain available."); } else this.exitToTitle(false); });
    on("#endReplay", () => { this.mode = "play"; this.ui.journal("missions"); });
    on("#infoBack", () => { if (this.state.mode === "replay" || this.state.mode === "training") this.exitToTitle(false); else this.ui.title(); });
    on("#btnErrReload", () => location.reload());
  }
  closePause() {
    this.input.pressed.clear();
    this.ui.hideScreens();
    this.mode = "play"; this.paused = false;
    this.input.lock();
  }
}

// phones and tablets without a keyboard get an honest note
function deviceCheck() {
  const touchOnly = matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
  if (touchOnly) $("#deviceNote").hidden = false;
}

const G = new Game();
deviceCheck();
G.load().catch((e) => {
  console.error(e);
  $("#loading").hidden = true;
  $("#errorBox").hidden = false;
  $("#errorText").textContent = e.message || String(e);
});
