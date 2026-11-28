import * as THREE from "../lib/three.module.min.js";
import { buildGusRig } from "./gus-rig.js?v=chapters-1-2-r1";
import { dressGusVillage } from "./gus-village.js?v=3";
import { createVillageWatch, REFUGE } from "./gus-village-watch.js?v=5";
import { createNorthGate } from "./gus-north-gate.js?v=2";
import { createVillagerRig } from "./villager-rig.js?v=living-kingdom-1";
import { createRaiderRig } from "./raider-rig.js?v=living-kingdom-1";
import { createGusAudio } from "./gus-audio.js?v=chapters-1-2-r1";
import { createGusCampaignMenu } from "./gus-campaign-menu.js?v=1";
import { readGusSettings } from "./gus-settings.js?v=1";
import { createGusStory, GUS_STORY_KEY, gusStoryBeats, gusStoryRank, gusStoryChapter } from "./gus-story.js?v=chapters-1-2-r1";

const byId = (id) => document.getElementById(id);
const play = byId("play");
const forgeButton = byId("forge");
const finaleButton = byId("finale");
const sentinelPanel = byId("sentinelPanel");
const sentinelHealth = byId("sentinelHealth");
const opponentLabel = byId("gusOpponentLabel");
const credits = byId("credits");
const chapterLabel = byId("chapterLabel");
const overlay = byId("overlay");
const hud = byId("hud");
const objective = byId("objective");
const storyBeat = byId("storyBeat");
const evacStatus = byId("evacStatus");
const heading = byId("heading");
const message = byId("message");
const skipRaid = byId("skipRaid");
const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
const params = new URLSearchParams(window.location?.search ?? "");
const publicStory = document.documentElement?.dataset.gusRelease === "chapters-1-2";
const storyDevelopment = !publicStory && params.get("development") === "1" && params.get("prototype") !== "1";
const development = !publicStory && params.get("development") === "1" && params.get("prototype") === "1";

const CHECKPOINT_KEY = "blockhaven.gus.preview";
const CHECKPOINT_VERSION = 10;
const VILLAGE_CHECKPOINTS = ["briefing", "defense", "report", "complete"];
const FORGE_CHECKPOINTS = [...VILLAGE_CHECKPOINTS, "reforged", "forge-complete"];
const PROTOTYPE_CHECKPOINTS = [...FORGE_CHECKPOINTS, "finale-complete"];
const VILLAGE_WATCH_CHECKPOINTS = ["briefing", "defense", "signal", "gate-defense", ...PROTOTYPE_CHECKPOINTS.slice(2)];
const PORTCULLIS_CHECKPOINTS = [...VILLAGE_WATCH_CHECKPOINTS, "seal-road"];
const LANTERN_CHECKPOINTS = [...PORTCULLIS_CHECKPOINTS, "smith-found"];
const WAYSTATION_CHECKPOINTS = [...LANTERN_CHECKPOINTS, "waystation-defense", "waystation-clear", "waystation-complete"];
const AQUEDUCT_CHECKPOINTS = [...WAYSTATION_CHECKPOINTS, "aqueduct-unlocked", "aqueduct-crossing", "aqueduct-complete"];
const SUPPLY_CHECKPOINTS = [...AQUEDUCT_CHECKPOINTS, "supply-defense", "supply-clear", "supply-complete"];
const CHECKPOINT_ORDER = ["briefing", "defense", "signal", "gate-defense", "seal-road", "report", "complete",
  "smith-found", "reforged", "forge-complete", "waystation-defense", "waystation-clear", "waystation-complete",
  "aqueduct-unlocked", "aqueduct-crossing", "aqueduct-complete", "supply-defense", "supply-clear", "supply-complete",
  "freight-found", "chapter-two-complete", "finale-complete"];
const REFORGE_DURATION = 1.55;
const STORY_CUTS = {
  ruins: { duration: 3.1, objective: "The village is burning", skip: "Skip village reveal", cue: "ruins" },
  discovery: { duration: 3.55, objective: "The prisoners recognize Gus", skip: "Skip discovery scene", cue: "discovery" },
  setback: { duration: 1.65, objective: "Steve presses the attack", skip: "Skip duel scene", next: "retreat" },
  rescue: { duration: 3.85, objective: "Help reaches Gus", skip: "Skip rescue scene", next: "reforge", cue: "rescue" }
};
const GUARD_STAGGER = 2.25;
const FREIGHT_END_VIEW = { x: 2.68, y: 3.46, z: -2.9 };
const villageStory = {
  briefing: "Market day. Talk to the villagers or find the watchkeeper by the lantern.",
  defense: "Watchkeeper · Get close to the marked raider and draw him away from the villagers.",
  signal: "Watchkeeper · The road is open. Light the west beacon so the families know to keep going.",
  "gate-defense": "Watchkeeper · That raider’s guarding the winch. Get close and use Q to break his guard.",
  "seal-road": "Watchkeeper · The winch is jammed. Gus, you’ll have to force the release.",
  report: "Watchkeeper · We’re all at the south refuge. Come let me see that armor."
};
const villageFight = (stage) => stage === "defense" || stage === "gate-defense";
const raiderFight = (stage) => villageFight(stage) || stage === "waystation-defense" || stage === "supply-defense";
const waystationStory = {
  "waystation-road": "Mara · That wagon belongs to Iona, the trail courier. If it’s here, she can’t be far.",
  "waystation-defense": "Iona · Behind the bars! The guard has the keys. Slam him, then punch while he’s off balance.",
  "waystation-clear": "Iona · You’ve got the keys. I’m at the gate.",
  "waystation-complete": "Iona · They took the aqueduct road. I’ll bring word to Mara. Go through the gate."
};
const aqueductStory = {
  "aqueduct-locks": "Iona’s directions · Stand on the survey plate. One slam has to reach both seized counterweights.",
  "aqueduct-unlocked": "Both counterweights are free. Use the winch to lower the drawbridge.",
  "aqueduct-crossing": "The bridge is down. Look for the raiders’ trail marker on the far bank.",
  "aqueduct-complete": "The mark points to the fortress supply road. Follow it through the arch."
};
const supplyStory = {
  "supply-road": "The raiders are hauling crates toward the fortress. Follow the wheel ruts to the lookout.",
  "supply-defense": "Stop the wagon with the upgraded slam before it reaches the gate. Watch for the escort’s strikes.",
  "supply-clear": "The wagon is secure. Check its ledger for a route into the fortress.",
  "supply-complete": "The convoy ledger shows a freight entrance below the fortress. Follow the road under the arch."
};
const freightStory = {
  "freight-road": "Follow the amber freight lanterns over the moat. Look for the copper seal shown in the ledger.",
  "freight-found": "The seal matches. This is the passage beneath the fortress."
};
const RAIDER_WINDUP = 0.56;
const RAIDER_RECOVERY = 0.92;
const RAIDER_REACH = 2;
const RAIDER_INTERCEPT_RANGE = 3.7;
const RAID_REVEAL_TIME = 3.5;
const RAID_CUT_TIME = 0.68;
const RAID_REVEAL_MARKS = [[-5, -7.1], [1, -10], [5.2, -7.9]];
const villageComplete = (stage) => CHECKPOINT_ORDER.indexOf(stage) >= CHECKPOINT_ORDER.indexOf("complete");
const forgeComplete = (stage) => CHECKPOINT_ORDER.indexOf(stage) >= CHECKPOINT_ORDER.indexOf("forge-complete");
const completedJourney = (stage) => stage === "chapter-two-complete" || stage === "finale-complete";

function storageUnavailable() {
  const notice = byId("checkpointNotice");
  notice.textContent = "Gus checkpoints are unavailable in this browser session.";
  notice.hidden = false;
}

function loadCheckpoint() {
  let raw;
  try {
    raw = window.localStorage.getItem(CHECKPOINT_KEY);
  } catch {
    storageUnavailable();
    return "briefing";
  }

  try {
    const saved = JSON.parse(raw);
    if (saved?.version === CHECKPOINT_VERSION && CHECKPOINT_ORDER.includes(saved.stage)) return saved.stage;
    if (saved?.version === 9 && SUPPLY_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 8 && AQUEDUCT_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 7 && WAYSTATION_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 6 && LANTERN_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 5 && PORTCULLIS_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 4 && VILLAGE_WATCH_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 3 && PROTOTYPE_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 1 && VILLAGE_CHECKPOINTS.includes(saved.stage)) return saved.stage;
    if (saved?.version === 2 && FORGE_CHECKPOINTS.includes(saved.stage)) return saved.stage;
  } catch {
    // An unreadable record can be replaced at the next checkpoint.
  }
  return "briefing";
}

function saveCheckpoint(stage) {
  // Keep the furthest checkpoint already on disk, including during replays.
  if (CHECKPOINT_ORDER.indexOf(stage) <= CHECKPOINT_ORDER.indexOf(loadCheckpoint())) return;
  try {
    window.localStorage.setItem(CHECKPOINT_KEY, JSON.stringify({ version: CHECKPOINT_VERSION, stage }));
    byId("checkpointNotice").hidden = true;
  } catch {
    storageUnavailable();
  }
}

function loadStoryCheckpoint() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GUS_STORY_KEY));
    if (saved?.version === 1 && gusStoryRank(saved.stage) !== -1) return saved.stage;
  } catch {
    // Keep the original save usable if the development story record is unreadable.
  }
  return null;
}

async function startPreview(settings, campaignMenu) {
  const [sentinelModule, lanternRoadModule, waystationModule, aqueductModule, supplyRoadModule, approachModule] =
    development ? await Promise.all([
      import("./gus-sentinel.js?v=1"),
      import("./gus-lantern-road.js?v=waystation-1"),
      import("./gus-waystation.js?v=aqueduct-1"),
      import("./gus-aqueduct.js?v=supply-road-1"),
      import("./gus-supply-road.js?v=freight-1"),
      import("./gus-fortress-approach.js?v=1")
    ]) : [];
  const fastGraphics = settings.quality === "fast";
  const reduceMotion = () => settings.reducedMotion || systemMotion.matches;
  const audio = createGusAudio(settings);
  window.addEventListener("pagehide", event => {
    if (event.persisted) audio.pause();
    else audio.close();
  });
  const scene = new THREE.Scene();
  const villageSky = new THREE.Color(0xaebfba);
  const journeySky = new THREE.Color(0xb0cdd3);
  const valleySky = new THREE.Color(0xc3c4b7);
  const aqueductSky = new THREE.Color(0xaebfcb);
  const supplySky = new THREE.Color(0xc5adb0);
  const freightSky = new THREE.Color(0xa493a5);
  scene.background = villageSky;
  scene.fog = new THREE.FogExp2(0xaebfba, 0.023);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: !fastGraphics });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  document.body.prepend(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Village defense arena");
  renderer.domElement.tabIndex = -1;

  const sunlight = new THREE.DirectionalLight(0xffd0a0, 3.35);
  sunlight.position.set(-16, 17, -12);
  sunlight.castShadow = true;
  Object.assign(sunlight.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24 });
  const shadowSize = fastGraphics ? 1024 : 2048;
  sunlight.shadow.mapSize.set(shadowSize, shadowSize);
  sunlight.shadow.normalBias = 0.028;
  sunlight.shadow.bias = -0.00015;
  const fill = new THREE.DirectionalLight(0xb5dfff, 0.65);
  fill.position.set(9, 6, 8);
  scene.add(sunlight, fill, new THREE.HemisphereLight(0xc7dcf1, 0x6e6656, 1.55));

  const material = (color) => new THREE.MeshStandardMaterial({ color });
  const trim = material(0x393e42);
  const eyes = new THREE.MeshBasicMaterial({ color: 0x89ffdb });
  const stone = material(0x716b60);
  const timber = material(0x654632);
  const roof = material(0x863e32);
  const raider = material(0x483941);
  const ember = new THREE.MeshBasicMaterial({ color: 0xff9b46 });
  const cube = new THREE.BoxGeometry(1, 1, 1);

  function box(parent, paint, x, y, z, w, h, d) {
    const mesh = new THREE.Mesh(cube, paint);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const villageBackdrop = new THREE.Group();
  dressGusVillage(villageBackdrop, cube);
  scene.add(villageBackdrop);

  function makeSentinelRig() {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    scene.add(root);
    box(body, raider, 0, 1.83, 0, 1.32, 1.02, 0.77);
    box(body, trim, 0, 1.97, -0.4, 0.52, 0.45, 0.11);
    box(body, trim, 0, 1.42, 0, 1.08, 0.2, 0.84);
    box(body, raider, 0, 2.63, 0, 0.74, 0.61, 0.68);
    box(body, roof, 0, 2.89, 0, 0.8, 0.18, 0.75);
    box(body, roof, 0, 1.95, 0.41, 0.46, 0.73, 0.12);
    box(body, trim, 0, 2.57, -0.38, 0.67, 0.22, 0.1);
    const arms = [];
    const legs = [];
    for (const side of [-1, 1]) {
      box(body, ember, side * 0.18, 2.65, -0.35, 0.19, 0.08, 0.056);
      const arm = new THREE.Group();
      arm.position.set(side * 0.88, 2.16, 0);
      body.add(arm);
      box(arm, roof, 0, -0.12, 0, 0.55, 0.47, 0.61);
      box(arm, raider, 0, -0.64, 0, 0.42, 0.82, 0.45);
      box(arm, trim, 0, -1.05, 0, 0.49, 0.39, 0.57);
      arms.push(arm);
      const leg = new THREE.Group();
      leg.position.set(side * 0.35, 1.29, 0);
      body.add(leg);
      box(leg, raider, 0, -0.51, 0, 0.5, 1, 0.51);
      box(leg, trim, 0, -1.13, -0.1, 0.56, 0.32, 0.74);
      legs.push(leg);
    }
    return { root, body, arms, legs, stride: 0 };
  }

  function faceForward(rig) {
    const root = new THREE.Group();
    // The shared cast faces +Z. The campaign controller and camera use -Z.
    rig.root.rotation.y = Math.PI;
    root.add(rig.root);
    scene.add(root);
    return { ...rig, root };
  }

  function makeVillager(appearance) {
    return faceForward(createVillagerRig(appearance, { sceneLighting: true }));
  }

  const gus = buildGusRig(scene, box);

  const watchkeeper = makeVillager({ role: "guard", id: "gus-watchkeeper", district: "defensive" });
  watchkeeper.root.name = "Watchkeeper";
  watchkeeper.root.position.set(1, 0, 3);
  const refuge = new THREE.Vector3(REFUGE.x, 0, REFUGE.z);
  const watchLantern = new THREE.Group();
  scene.add(watchLantern);
  box(watchLantern, stone, 2.25, 0.12, 3, 0.48, 0.24, 0.48);
  box(watchLantern, timber, 2.25, 1.2, 3, 0.18, 2.4, 0.18);
  box(watchLantern, ember, 2.25, 2.45, 3, 0.33, 0.39, 0.33);
  for (const y of [2.23, 2.67]) box(watchLantern, trim, 2.25, y, 3, 0.48, 0.07, 0.48);
  for (const x of [2.06, 2.44]) for (const z of [2.81, 3.19]) {
    box(watchLantern, trim, x, 2.45, z, 0.04, 0.46, 0.04);
  }
  const watchkeeperMarker = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), eyes);
  watchkeeperMarker.position.copy(watchkeeper.root.position);
  watchkeeperMarker.position.y = 3.55;
  watchkeeperMarker.visible = false;
  scene.add(watchkeeperMarker);
  const villageWatch = createVillageWatch({ scene, box, makeVillager, face, markerPaint: eyes });
  const northGate = createNorthGate({ scene, box, markerPaint: eyes });

  const story = storyDevelopment || publicStory ? createGusStory({ scene, box, face, makeVillager, markerPaint: eyes }) : null;
  const journey = lanternRoadModule?.createLanternRoad({ scene, cube, box, makeVillager, face, markerPaint: eyes });
  const onLanternRoad = () => journey?.root.visible === true;
  const waystation = waystationModule?.createWaystation({ scene, cube, box, makeVillager, face, markerPaint: eyes });
  const atWaystation = () => waystation?.root.visible === true;
  const aqueduct = aqueductModule?.createAqueduct({ scene, cube, box, markerPaint: eyes });
  const atAqueduct = () => aqueduct?.root.visible === true;
  const supplyRoad = supplyRoadModule?.createSupplyRoad({ scene, cube, box, markerPaint: eyes });
  const onSupplyRoad = () => supplyRoad?.root.visible === true;
  const approach = approachModule?.createFortressApproach({ scene, cube, box, markerPaint: eyes });
  const atApproach = () => approach?.root.visible === true;
  const gate = new THREE.Group();
  scene.add(gate);
  for (const side of [-1, 1]) {
    const x = side * 4.1;
    box(gate, stone, x, 2.55, -16, 2.3, 5.1, 1.85);
    box(gate, trim, x, 4.16, -15.04, 0.86, 1.32, 0.11);
    box(gate, ember, x, 3.88, -14.95, 0.37, 0.49, 0.15);
  }
  box(gate, timber, 0, 5.25, -16, 10.5, 1.08, 2.15);
  box(gate, roof, 0, 5.95, -16, 11.1, 0.35, 2.38);
  const sentinel = sentinelModule?.createGusSentinel({ arena: gate, rig: makeSentinelRig(), box, pose, face });
  const warningGeometry = new THREE.RingGeometry(RAIDER_REACH - 0.15, RAIDER_REACH, 32);
  const warningMaterial = new THREE.MeshBasicMaterial({ color: 0xff5438 });
  const spawns = [
    { x: -6, z: -6, wave: "defense", name: "Evacuation Raider", pursuesVillagers: true },
    { x: 1, z: -10, wave: "defense", name: "Raider" },
    { x: 7, z: -5, wave: "defense", name: "Raider" },
    { x: -5.35, z: -12.8, wave: "gate-defense", name: "Raider" },
    { x: -2.45, z: -12.9, wave: "gate-defense", name: "Gate Raider", holdsGate: true }
  ];
  if (waystation) spawns.push(
    { x: 3.8, z: -1.5, wave: "waystation-defense", name: "Waystation Patroller" },
    { x: 0, z: -6.35, wave: "waystation-defense", name: "Waystation Guard", holdsGate: true, guarded: true }
  );
  if (supplyRoad) spawns.push(
    { x: 2.75, z: 1.1, wave: "supply-defense", name: "Convoy Outrider" },
    { x: 2.35, z: -4.85, wave: "supply-defense", name: "Convoy Escort", maxHealth: 3 }
  );
  const enemies = spawns.map((spawn, index) => {
    const warning = new THREE.Mesh(warningGeometry, warningMaterial);
    warning.rotation.x = -Math.PI / 2;
    const arena = spawn.wave === "waystation-defense" ? waystation.root
      : spawn.wave === "supply-defense" ? supplyRoad.root : scene;
    arena.add(warning);
    const rig = faceForward(createRaiderRig("vindicator", `gus-raider-${index}`,
      spawn.pursuesVillagers || spawn.holdsGate ? "siege" : undefined, { sceneLighting: true }));
    arena.add(rig.root);
    rig.root.name = spawn.name;
    return { ...rig, ...spawn, warning, health: 0, attack: 0, recoil: 0, age: 0, stagger: 0, intercepted: false };
  });
  const pursuitMarker = new THREE.Mesh(new THREE.OctahedronGeometry(0.23), ember);
  pursuitMarker.name = "Evacuation threat marker";
  enemies[0].root.add(pursuitMarker);
  pursuitMarker.position.y = 2.7;
  const gateGuard = enemies.find(enemy => enemy.holdsGate);
  const waystationGuard = enemies.find(enemy => enemy.guarded);
  const waystationMarker = waystationGuard
    ? new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0xffae62 })) : null;
  if (waystationMarker) {
    waystationMarker.name = "Waystation guard marker";
    waystationMarker.position.y = 2.8;
    waystationGuard.root.add(waystationMarker);
    const arm = waystationGuard.root.getObjectByName("foreL");
    box(arm, trim, 0, -0.14, 0.17, 0.46, 0.65, 0.12);
    box(arm, timber, 0, -0.14, 0.252, 0.35, 0.52, 0.048);
    box(arm, roof, 0, -0.14, 0.281, 0.09, 0.51, 0.03);
    box(arm, trim, 0, -0.12, 0.305, 0.17, 0.17, 0.075);
  }
  const guardMarker = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), ember);
  guardMarker.name = "Gate guard marker";
  guardMarker.position.y = 2.7;
  gateGuard.root.add(guardMarker);
  const pulse = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 1, 40),
    new THREE.MeshBasicMaterial({ color: 0xffba65, transparent: true, depthWrite: false })
  );
  pulse.rotation.x = -Math.PI / 2;
  scene.add(pulse);
  const chips = new THREE.InstancedMesh(cube, new THREE.MeshBasicMaterial(), 20);
  const chipPose = new THREE.Object3D();
  chips.frustumCulled = false;
  scene.add(chips);
  const keys = new Set();
  const velocity = new THREE.Vector3();
  const target = new THREE.Vector3();
  let state = "menu";
  const initialCheckpoint = loadCheckpoint();
  let furthestCheckpoint = initialCheckpoint;
  let storyCheckpoint = story ? loadStoryCheckpoint() : null;
  let mission = "briefing";
  let armor = 100;
  let yaw = -0.32;
  let pitch = 0.38;
  let drag = null;
  let attack = null;
  let slamCooldown = 0;
  let pulseTime = 0;
  let nextHand = 0;
  let reforgeAge = null;
  let villageAge = 0;
  let residentDialogue = null;
  let dialogueTime = 0;
  let raidReveal = null;
  let storyCut = null;

  function advanceCheckpoint(stage) {
    if (CHECKPOINT_ORDER.indexOf(stage) > CHECKPOINT_ORDER.indexOf(furthestCheckpoint)) {
      furthestCheckpoint = stage;
    }
    saveCheckpoint(stage);
  }

  function refreshStoryCheckpoint() {
    const stored = loadStoryCheckpoint();
    if (gusStoryRank(stored) > gusStoryRank(storyCheckpoint)) storyCheckpoint = stored;
  }

  function saveStory(stage) {
    refreshStoryCheckpoint();
    if (gusStoryRank(stage) <= gusStoryRank(storyCheckpoint)) return;
    storyCheckpoint = stage;
    try {
      window.localStorage.setItem(GUS_STORY_KEY, JSON.stringify({ version: 1, stage }));
      byId("checkpointNotice").hidden = true;
    } catch {
      storageUnavailable();
    }
  }

  function advanceStory(stage) {
    saveStory(stage);
    if (mission === "discovery") {
      beginStoryCut("discovery");
      return;
    }
    if (mission === "escape" && stage === "reforge") {
      beginStoryCut("rescue");
      return;
    }
    const immediateForge = stage === "trial" && armor < 100;
    reset(stage);
    if (stage === "ready") {
      showMenu("reforged-won", "Gus is reforged",
        "With his new armor tested, Gus prepares to face Steve again.", "Replay Chapter 2");
    } else if (stage === "ending") {
      showMenu("story-won", "Gus’s Revenge",
        "At first light, the riverbank falls quiet. Neither Gus nor Steve has the strength to rise.", "Replay Chapter 3");
    } else if (stage === "ruins") {
      beginStoryCut("ruins");
    } else {
      if (immediateForge) audio.play("reforged");
      renderer.domElement.focus();
    }
  }

  function resumeStory() {
    refreshStoryCheckpoint();
    const chapterTwoComplete = gusStoryRank(storyCheckpoint) >= gusStoryRank("ready");
    const startAt = publicStory && chapterTwoComplete ? "duel"
      : storyCheckpoint === "ready" || storyCheckpoint === "ending" ? "return" : storyCheckpoint ?? "day-off";
    reset(startAt);
    saveStory(mission);
    beginPlay();
    if (mission === "ruins") beginStoryCut("ruins");
  }

  function deployRaiders(stage) {
    for (const [index, enemy] of enemies.entries()) {
      const entrance = stage === "defense" ? RAID_REVEAL_MARKS[index] : null;
      enemy.root.position.set(entrance?.[0] ?? enemy.x, 0, entrance?.[1] ?? enemy.z);
      enemy.root.rotation.y = Math.PI;
      enemy.root.visible = enemy.wave === stage;
      enemy.health = enemy.root.visible ? (enemy.maxHealth ?? 2) : 0;
      enemy.attack = enemy.recoil = enemy.age = enemy.stagger = 0;
      enemy.intercepted = false;
      enemy.warning.visible = false;
      enemy.resetPose();
    }
    guardMarker.visible = stage === "gate-defense";
  }

  function showVillageStory(stage) {
    residentDialogue = null;
    dialogueTime = 0;
    storyBeat.textContent = villageStory[stage] ?? "";
    storyBeat.hidden = !storyBeat.textContent;
    evacStatus.hidden = stage !== "defense";
    if (!evacStatus.hidden) updateEvacuationStatus();
  }

  function showJourneyStory(stage) {
    storyBeat.hidden = false;
    storyBeat.textContent = stage === "damaged"
      ? "Watchkeeper · Follow the lanterns over the river. Mara keeps the old roadside forge."
      : stage === "smith-found"
        ? "Mara · I can brace that armor. Come to the anvil and hold steady."
        : stage === "forge-complete"
          ? "Mara · The road’s open. Follow it through the pass to the old waystation."
          : "Mara · Try the new plates on the rockfall. Bring both fists down together.";
  }

  function showWaystationStory(stage) {
    storyBeat.hidden = false;
    storyBeat.textContent = waystationStory[stage];
  }

  function showAqueductStory(stage) {
    storyBeat.hidden = false;
    storyBeat.textContent = aqueductStory[stage];
  }

  function showSupplyStory(stage) {
    storyBeat.hidden = false;
    storyBeat.textContent = supplyStory[stage];
  }

  function showFreightStory(stage) {
    storyBeat.hidden = false;
    storyBeat.textContent = freightStory[stage];
  }

  function updateEvacuationStatus() {
    const count = `${villageWatch.safe} of ${villageWatch.total} villagers safe`;
    const status = villageWatch.waiting ? `${count} · Route blocked` : count;
    if (evacStatus.textContent !== status) evacStatus.textContent = status;
    evacStatus.classList.toggle("blocked", villageWatch.waiting > 0);
    const guidance = villageWatch.safe === villageWatch.total
      ? "Watchkeeper · Everyone’s through the gate. Finish clearing the square."
      : enemies[0].intercepted
        ? "Watchkeeper · You’ve drawn him off. Keep the route clear until everyone is through."
        : villageStory.defense;
    if (storyBeat.textContent !== guidance) storyBeat.textContent = guidance;
  }

  function startVillageStage(stage, checkpoint = true) {
    mission = stage;
    if (stage === "report") {
      watchkeeper.root.position.copy(refuge);
      watchkeeperMarker.position.set(refuge.x, 3.55, refuge.z);
    }
    showVillageStory(stage);
    if (checkpoint) advanceCheckpoint(stage);
    if (villageFight(stage)) deployRaiders(stage);
    northGate.reset(stage);
    villageWatch.update(stage, 0, reduceMotion());
  }

  function finishRaidReveal() {
    raidReveal = null;
    skipRaid.hidden = true;
    keys.clear();
    startVillageStage("defense", false);
    renderer.domElement.focus();
  }

  function beginRaidReveal() {
    advanceCheckpoint("defense");
    audio.play("raid");
    if (reduceMotion()) {
      finishRaidReveal();
      return;
    }
    raidReveal = 0;
    dialogueTime = 0;
    residentDialogue = null;
    keys.clear();
    drag = null;
    velocity.set(0, 0, 0);
    storyBeat.textContent = "Watchkeeper · Gus, listen. The north gate bell.";
    watchkeeperMarker.visible = false;
    objective.textContent = "Raid at the north gate";
    byId("health").value = armor;
    byId("slam").textContent = "";
    skipRaid.hidden = false;
    skipRaid.textContent = "Skip raid scene";
    skipRaid.focus();
  }

  function updateRaidReveal(dt) {
    raidReveal += dt;
    if (raidReveal >= RAID_REVEAL_TIME || reduceMotion()) {
      finishRaidReveal();
      return;
    }
    if (raidReveal < RAID_CUT_TIME) return;
    const progress = Math.min(1, (raidReveal - RAID_CUT_TIME) / (RAID_REVEAL_TIME - RAID_CUT_TIME));
    const line = "Watchkeeper · Raiders! Keep them off the market road while we get everyone out.";
    if (storyBeat.textContent !== line) storyBeat.textContent = line;
    for (let i = 0; i < 3; i++) {
      const enemy = enemies[i];
      enemy.root.visible = true;
      const [x, z] = RAID_REVEAL_MARKS[i];
      const spread = THREE.MathUtils.smoothstep(progress, 0.35, 1);
      enemy.root.position.set(THREE.MathUtils.lerp((i - 1) * 1.45, x, spread), 0, THREE.MathUtils.lerp(-19.5, z, progress));
      enemy.pose(dt, { age: raidReveal, speed: 2.65, prep: true });
    }
  }

  function reset(startAt = "briefing") {
    keys.clear();
    drag = null;
    raidReveal = null;
    storyCut = null;
    reforgeAge = null;
    skipRaid.hidden = true;
    skipRaid.textContent = "Skip raid scene";
    mission = startAt;
    const beat = story && gusStoryBeats[mission];
    const storySky = story?.reset(mission);
    journey?.reset(mission);
    waystation?.reset(mission);
    aqueduct?.reset(mission);
    supplyRoad?.reset(mission);
    approach?.reset(mission);
    const onRoad = onLanternRoad();
    const inValley = atWaystation();
    const onAqueduct = atAqueduct();
    const onConvoyRoad = onSupplyRoad();
    const atFreight = atApproach();
    const inChapterTwo = onRoad || inValley || onAqueduct || onConvoyRoad || atFreight;
    villageBackdrop.visible = !inChapterTwo && !beat;
    scene.background = storySky ?? (atFreight ? freightSky : onConvoyRoad ? supplySky : onAqueduct ? aqueductSky
      : inValley ? valleySky : onRoad ? journeySky : villageSky);
    scene.fog.color.copy(scene.background);
    scene.fog.density = beat ? 0.028 : atFreight ? 0.0125 : inChapterTwo ? 0.016 : 0.023;
    sunlight.color.setHex(beat ? 0xffc897 : atFreight ? 0xffc9a2 : onConvoyRoad ? 0xffcf9a
      : inChapterTwo ? 0xffdfb1 : 0xffd0a0);
    sunlight.intensity = beat && mission !== "day-off" ? 2.4 : 3.35;
    gate.visible = mission === "finale";
    const location = beat?.title ?? (atFreight ? "Freight Entrance" : onConvoyRoad ? "Fortress Supply Road"
      : onAqueduct ? "The Broken Aqueduct" : inValley ? "Glasswater Waystation" : onRoad ? "The Lantern Road"
        : story ? "The Guardian" : "The Village Attack");
    chapterLabel.textContent = gate.visible ? "Chapter 3 · The Final Fortress"
      : `Chapter ${beat ? gusStoryChapter(mission) : inChapterTwo ? 2 : 1} · ${location}`;
    renderer.domElement.setAttribute("aria-label", gate.visible ? "North gate arena" : location);
    if (gate.visible) sentinel.reset();
    sentinelPanel.hidden = !gate.visible && !story?.fighting;
    sentinelHealth.max = story?.fighting ? story.counterTarget : 4;
    opponentLabel.textContent = story?.fighting ? "Steve’s guard" : "Gate Sentinel";
    watchkeeper.root.visible = watchLantern.visible = !inChapterTwo && !gate.visible && !beat;
    watchkeeper.root.position.set(1, 0, 3);
    if (mission === "report") watchkeeper.root.position.copy(refuge);
    watchkeeperMarker.position.set(watchkeeper.root.position.x, 3.55, watchkeeper.root.position.z);
    watchkeeperMarker.visible = false;
    villageWatch.reset(watchkeeper.root.visible, mission);
    villageWatch.update(mission, 0, reduceMotion());
    northGate.reset(mission);
    const damaged = beat?.damaged || mission === "damaged" || mission === "smith-found" || (!story && mission === "report");
    armor = damaged ? 35 : 100;
    byId("health").value = armor;
    gus.setForm(upgraded() ? "reforged" : damaged ? "damaged" : mission);
    velocity.set(0, 0, 0);
    gus.root.position.set(0, 0, 8);
    if (beat) {
      gus.root.position.set(beat.spawn[0], 0, beat.spawn[1]);
    } else if (onRoad) {
      const point = mission === "damaged" ? lanternRoadModule.LANTERN_ROAD_ENTRY
        : mission === "smith-found" ? lanternRoadModule.SMITH_APPROACH
          : mission === "forge-complete" ? lanternRoadModule.CLEARED_PASS : lanternRoadModule.SLAM_APPROACH;
      gus.root.position.set(point.x, 0, point.z);
    } else if (inValley) {
      const point = waystationModule.waystationEntry[mission];
      gus.root.position.set(point.x, 0, point.z);
    } else if (onAqueduct) {
      const point = aqueductModule.aqueductEntry[mission];
      gus.root.position.set(point.x, 0, point.z);
    } else if (onConvoyRoad) {
      const point = supplyRoadModule.supplyRoadEntry[mission];
      gus.root.position.set(point.x, 0, point.z);
    } else if (atFreight) {
      const point = approachModule.approachEntry[mission];
      gus.root.position.set(point.x, 0, point.z);
    } else if (mission === "signal" || mission === "gate-defense") {
      gus.root.position.set(villageWatch.beacon.x + 0.75, 0, villageWatch.beacon.z + 2.05);
    } else if (mission === "seal-road") {
      gus.root.position.set(northGate.release.x + 1.35, 0, northGate.release.z + 1.8);
    } else if (mission === "report") {
      gus.root.position.set(refuge.x + 0.7, 0, refuge.z - 3.6);
    }
    gus.root.rotation.set(0, 0, 0);
    gus.reset();
    if (mission === "ending") {
      gus.root.rotation.set(0, -0.35, Math.PI / 2);
      gus.root.position.y = 0.65;
    }
    gus.updateWear(armor, 0, reduceMotion(), false);
    yaw = mission === "report" || mission === "trial" || mission === "ready" ? Math.PI
      : beat || inChapterTwo || gate.visible || mission === "gate-defense" || mission === "seal-road" ? 0 : -0.32;
    if (yaw === Math.PI) gus.root.rotation.y = Math.PI;
    pitch = onConvoyRoad || atFreight ? 0.21 : beat || inChapterTwo ? 0.24 : 0.38;
    attack = null;
    slamCooldown = 0;
    pulseTime = 0;
    pulse.visible = chips.visible = false;
    nextHand = 0;
    villageAge = 0;
    deployRaiders(mission);
    showVillageStory(mission);
    if (beat) {
      storyBeat.textContent = beat.caption ?? "";
      storyBeat.hidden = !beat.caption;
      byId("slam").textContent = "";
    } else if (story && mission === "report") {
      storyBeat.textContent = "Watchkeeper · The families are safe. The other guardian can take the next watch.";
    }
    if (onRoad) showJourneyStory(mission);
    if (inValley) showWaystationStory(mission);
    if (onAqueduct) showAqueductStory(mission);
    if (onConvoyRoad) showSupplyStory(mission);
    if (atFreight) showFreightStory(mission);
  }

  function finishReforge() {
    reforgeAge = null;
    mission = "reforged";
    armor = 100;
    gus.setForm(mission);
    journey.mark(mission);
    showJourneyStory(mission);
    advanceCheckpoint(mission);
    audio.play("reforged");
  }

  function interactOnRoad() {
    const player = gus.root.position;
    if (mission === "damaged" && journey.nearSmith(player)) {
      mission = "smith-found";
      journey.mark(mission);
      showJourneyStory(mission);
      advanceCheckpoint(mission);
    } else if (mission === "smith-found" && reforgeAge === null && journey.nearForge(player)) {
      keys.clear();
      velocity.set(0, 0, 0);
      drag = null;
      storyBeat.textContent = "Mara · These braces spread the force through your arms. Easy now.";
      if (reduceMotion()) finishReforge();
      else {
        reforgeAge = 0;
        audio.play("forge");
      }
    }
  }

  function interactAtWaystation() {
    const player = gus.root.position;
    if (mission === "waystation-road" && waystation.nearWagon(player)) {
      mission = "waystation-defense";
      waystation.mark(mission);
      deployRaiders(mission);
      showWaystationStory(mission);
      advanceCheckpoint(mission);
      audio.play("raid");
    } else if (mission === "waystation-clear" && waystation.nearLatch(player)) {
      waystation.releaseCourier();
      mission = "waystation-complete";
      advanceCheckpoint(mission);
      showWaystationStory(mission);
      audio.play("reunion");
    }
  }

  function interactAtAqueduct() {
    const player = gus.root.position;
    if (mission === "aqueduct-unlocked" && !attack && !aqueduct.lowering && aqueduct.nearWinch(player)) {
      keys.clear();
      drag = null;
      velocity.set(0, 0, 0);
      aqueduct.startLowering();
      audio.play("gate");
    } else if (mission === "aqueduct-crossing" && aqueduct.nearTrail(player)) {
      mission = "aqueduct-complete";
      aqueduct.mark(mission);
      showAqueductStory(mission);
      advanceCheckpoint(mission);
      audio.play("reunion");
    }
  }

  function interactOnSupplyRoad() {
    const player = gus.root.position;
    if (mission === "supply-road" && supplyRoad.nearWatchpost(player)) {
      mission = "supply-defense";
      supplyRoad.mark(mission);
      deployRaiders(mission);
      showSupplyStory(mission);
      advanceCheckpoint(mission);
      audio.play("raid");
    } else if (mission === "supply-clear" && supplyRoad.nearWagon(player, 2.8)) {
      mission = "supply-complete";
      supplyRoad.mark(mission);
      showSupplyStory(mission);
      advanceCheckpoint(mission);
      audio.play("reunion");
    }
  }

  function startFortressReveal() {
    keys.clear();
    drag = null;
    velocity.set(0, 0, 0);
    const player = gus.root.position;
    const seal = approach.sealPoint;
    face(gus.root, seal.x - player.x, seal.z - player.z, 1);
    approach.beginReveal();
    showFreightStory("freight-found");
    objective.textContent = "Freight entrance found";
    audio.play("freight");
    if (reduceMotion()) {
      finishFortressReveal();
      return;
    }
    skipRaid.textContent = "Skip fortress reveal";
    skipRaid.hidden = false;
    skipRaid.focus();
  }

  function finishFortressReveal() {
    approach.endReveal();
    skipRaid.hidden = true;
    const player = gus.root.position;
    face(gus.root, FREIGHT_END_VIEW.x - player.x, FREIGHT_END_VIEW.z - player.z, 1);
    advanceCheckpoint("chapter-two-complete");
    showMenu("freight-won", "Beneath the fortress",
      "The seal matches the convoy ledger. Gus has found a passage under the fortress.",
      "Replay Chapter 2");
  }

  function skipScene() {
    if (raidReveal !== null) finishRaidReveal();
    else if (storyCut) finishStoryCut(storyCut.name);
    else if (approach?.revealing) finishFortressReveal();
  }

  function beginStoryCut(name) {
    if (reduceMotion()) {
      finishStoryCut(name);
      return;
    }
    const cut = STORY_CUTS[name];
    storyCut = { name, time: 0, origin: gus.root.position.clone() };
    keys.clear();
    drag = null;
    velocity.set(0, 0, 0);
    objective.textContent = cut.objective;
    if (name === "discovery" || name === "rescue") storyBeat.hidden = true;
    byId("slam").textContent = "";
    skipRaid.textContent = cut.skip;
    skipRaid.hidden = false;
    skipRaid.focus();
    if (cut.cue) audio.play(cut.cue);
  }

  function finishStoryCut(name) {
    storyCut = null;
    skipRaid.hidden = true;
    if (name === "discovery") {
      story.stageDiscovery(STORY_CUTS.discovery.duration, 0, gus.root);
      showMenu("discovered", "The Discovery",
        "Gus finds the missing villagers. Steve, the one who destroyed their home, steps into the hall.",
        "Begin Chapter 2");
    } else {
      const next = STORY_CUTS[name].next;
      if (next) reset(next);
      renderer.domElement.focus();
    }
  }

  function updateStoryCut(dt) {
    const cut = storyCut;
    const previous = cut.time;
    cut.time += dt;
    const player = gus.root.position;
    const motionReduced = reduceMotion();
    if (motionReduced) {
      finishStoryCut(cut.name);
      return;
    }
    gus.pose(0, dt, false, cut.name === "rescue");
    switch (cut.name) {
      case "ruins":
        story.update(dt, player, false);
        break;
      case "discovery":
        story.stageDiscovery(cut.time, dt, gus.root);
        if (previous < 1.58 && cut.time >= 1.58) {
          objective.textContent = "Steve steps into the hall";
          audio.play("footfall");
        }
        break;
      case "rescue":
        story.stageRescue(cut.time, dt, gus, cut.origin);
        break;
      case "setback": {
        story.poseSetback(player, cut.time, dt);
        if (previous < 0.68 && cut.time >= 0.68) {
          armor = 35;
          gus.setForm("damaged");
          byId("health").value = armor;
          storyBeat.textContent = "Steve’s strike cracks Gus’s armor.";
          audio.play("gate");
        }
        const recoil = THREE.MathUtils.smoothstep(cut.time, 0.68, 0.91);
        gus.body.rotation.x += 0.44 * recoil;
        gus.body.position.y -= 0.23 * recoil;
        break;
      }
    }
    if (cut.time >= STORY_CUTS[cut.name].duration) finishStoryCut(cut.name);
  }

  function showMenu(mode, title, detail, action) {
    state = mode;
    if (mode === "paused") audio.pause();
    keys.clear();
    drag = null;
    watchkeeperMarker.visible = false;
    heading.textContent = title;
    message.textContent = detail;
    play.textContent = action;
    play.disabled = false;
    credits.hidden = mode !== "finale-won" && mode !== "won" && mode !== "story-won";
    if (!credits.hidden) credits.textContent = mode === "won"
      ? "Gus’s journey continues in the full campaign. · BlockHaven by Mr. Watford"
      : "BlockHaven · Mr. Watford";
    byId("controlsHint").hidden = ["won", "discovered", "reforged-won", "story-won", "freight-won", "finale-won"].includes(mode);
    finaleButton.hidden = mode !== "freight-won" && !(storyDevelopment && mode === "reforged-won");
    if (!finaleButton.hidden) finaleButton.textContent = mode === "reforged-won" ? "Begin Chapter 3" : "Try the Chapter 3 prototype";
    forgeButton.hidden = !development || mode !== "won";
    if (!forgeButton.hidden) forgeButton.textContent = forgeAction();
    overlay.hidden = false;
    hud.hidden = true;
    (finaleButton.hidden ? (forgeButton.hidden ? play : forgeButton) : finaleButton).focus();
  }

  function forgeAction() {
    if (furthestCheckpoint === "smith-found") return "Resume at the smithy";
    if (furthestCheckpoint === "reforged") return "Resume the slam trial";
    if (furthestCheckpoint === "forge-complete") return "Continue through the pass";
    if (furthestCheckpoint === "waystation-defense") return "Resume the waystation fight";
    if (furthestCheckpoint === "waystation-clear") return "Return to Iona";
    if (furthestCheckpoint === "waystation-complete") return "Continue to the aqueduct";
    if (furthestCheckpoint === "aqueduct-unlocked") return "Resume at the drawbridge";
    if (furthestCheckpoint === "aqueduct-crossing") return "Cross the aqueduct";
    if (furthestCheckpoint === "aqueduct-complete") return "Continue to the supply road";
    if (furthestCheckpoint === "supply-defense") return "Retry the convoy interception";
    if (furthestCheckpoint === "supply-clear") return "Return to the stopped wagon";
    if (furthestCheckpoint === "supply-complete") return "Continue to the freight entrance";
    if (furthestCheckpoint === "freight-found") return "Resume the fortress reveal";
    if (completedJourney(furthestCheckpoint)) return "Replay Chapter 2";
    return "Begin Chapter 2";
  }

  function finaleAction() {
    return furthestCheckpoint === "finale-complete" ? "Replay the north gate" : "Continue to the north gate";
  }

  function beginPlay() {
    audio.start();
    state = "playing";
    campaignMenu.hide();
    overlay.hidden = true;
    hud.hidden = false;
    if (mission === "freight-found" && !approach.revealing) startFortressReveal();
    if (state === "playing") {
      if (raidReveal !== null || storyCut || approach?.revealing) skipRaid.focus();
      else renderer.domElement.focus();
    }
  }

  forgeButton.addEventListener("click", () => {
    if (story && state === "menu" && (storyCheckpoint || villageComplete(furthestCheckpoint))) {
      reset();
      beginPlay();
      return;
    }
    if (development && (state === "menu" || state === "won") && villageComplete(furthestCheckpoint)) {
      const replay = furthestCheckpoint === "complete" || completedJourney(furthestCheckpoint);
      reset(replay ? "damaged" : furthestCheckpoint);
      beginPlay();
    }
  });

  finaleButton.addEventListener("click", () => {
    if (storyDevelopment && state === "reforged-won") {
      advanceStory("return");
      beginPlay();
      return;
    }
    if (development && (state === "menu" || state === "freight-won") && forgeComplete(furthestCheckpoint)) {
      reset("finale");
      beginPlay();
    }
  });

  play.addEventListener("click", () => {
    if (state === "menu" && story && (storyCheckpoint || villageComplete(furthestCheckpoint))) {
      resumeStory();
      return;
    }
    if (state === "lost") {
      reset(mission);
    } else if (state === "discovered" || state === "reforged-won") {
      reset("duel");
    } else if (state === "story-won") {
      reset("return");
    } else if (state === "finale-lost" || state === "finale-won") {
      reset("finale");
    } else if (state === "freight-won") {
      reset("damaged");
    } else if (state === "won") {
      reset();
    }
    beginPlay();
  });
  const pause = () => {
    if (state === "playing") showMenu("paused", "Paused", "The mission resumes where you left off.", "Resume");
  };
  byId("pause").addEventListener("click", pause);
  skipRaid.addEventListener("click", () => {
    if (state === "playing") skipScene();
  });
  window.addEventListener("blur", event => { if (event.target === window) pause(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

  const movement = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
  window.addEventListener("keydown", (event) => {
    if (state !== "playing" || event.metaKey || event.ctrlKey || event.altKey) return;
    const { code } = event;
    if (raidReveal !== null || storyCut || approach?.revealing) {
      if (movement.has(code)) event.preventDefault();
      if (code === "Escape") pause();
      else if (code === "KeyE" && !event.repeat) skipScene();
      return;
    }
    if (movement.has(code)) {
      event.preventDefault();
      if (reforgeAge === null && !aqueduct?.lowering && !story?.forging) keys.add(code);
    } else if (code === "Escape") {
      pause();
    } else if (code === "KeyE" && !event.repeat) {
      if (story?.root.visible) {
        const wasForging = story.forging;
        const next = story.interact(gus.root.position, reduceMotion());
        if (next) advanceStory(next);
        else if (story.forging && !wasForging) {
          keys.clear();
          drag = null;
          velocity.set(0, 0, 0);
          audio.play("story-forge");
        }
        return;
      }
      if (onLanternRoad()) {
        interactOnRoad();
        return;
      }
      if (atWaystation()) {
        interactAtWaystation();
        return;
      }
      if (atAqueduct()) {
        interactAtAqueduct();
        return;
      }
      if (onSupplyRoad()) {
        interactOnSupplyRoad();
        return;
      }
      if (atApproach()) {
        if (mission === "freight-road" && approach.nearSeal(gus.root.position)) {
          mission = "freight-found";
          advanceCheckpoint(mission);
          startFortressReveal();
        }
        return;
      }
      const resident = mission === "briefing" || mission === "report" ? villageWatch.residentAt(gus.root.position) : null;
      if (resident && !nearWatchkeeper()) {
        residentDialogue = resident;
        dialogueTime = 4.5;
        const line = mission === "briefing" ? resident.opening : resident.safeLine;
        storyBeat.textContent = resident.role[0].toUpperCase() + resident.role.slice(1) + " · " + line;
        return;
      }
      if (mission === "briefing" && nearWatchkeeper()) {
        beginRaidReveal();
      } else if (mission === "signal" && nearBeacon()) {
        startVillageStage("gate-defense");
        audio.play("beacon");
      } else if (mission === "seal-road" && !northGate.lowering && nearGateRelease()) {
        northGate.lower();
        audio.play("gate");
        velocity.set(0, 0, 0);
      } else if (mission === "report" && nearWatchkeeper()) {
        gus.root.rotation.y = Math.PI;
        face(watchkeeper.root, -0.4, -1, 1);
        advanceCheckpoint("complete");
        audio.play("reunion");
        if (story) {
          advanceStory("day-off");
          return;
        }
        showMenu("won", "The village is safe",
          "The villagers made it home. Gus’s armor needs a smith, but the village forge has gone cold.", "Replay Chapter 1");
      }
    } else if (((mission === "aqueduct-locks" && code === "KeyQ") || raiderFight(mission) || mission === "reforged" ||
        story?.fighting || (mission === "trial" && code === "KeyQ") ||
        (mission === "finale" && sentinel.health > 0)) && !event.repeat && !attack &&
        (code === "KeyF" || (code === "KeyQ" && !slamCooldown))) {
      const slam = code === "KeyQ";
      attack = { elapsed: 0, duration: slam ? 0.85 : 0.46, impact: slam ? 0.48 : 0.2, hit: false, slam, hand: nextHand };
      if (slam) slamCooldown = 2.5;
      else nextHand = 1 - nextHand;
    }
  });
  window.addEventListener("keyup", ({ code }) => keys.delete(code));
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (event) => {
    if (state !== "playing" || raidReveal !== null || storyCut || approach?.revealing || reforgeAge !== null ||
        aqueduct?.lowering || story?.forging || event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    yaw -= (event.clientX - drag.x) * 0.008;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - drag.y) * 0.007, 0.21, 0.76);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  canvas.addEventListener("lostpointercapture", (event) => {
    if (drag?.id === event.pointerId) drag = null;
  });

  function pose(rig, speed, dt) {
    rig.stride += dt * speed * 2.3;
    const swing = Math.sin(rig.stride) * Math.min(0.48, speed * 0.15);
    rig.legs[0].rotation.x = swing;
    rig.legs[1].rotation.x = -swing;
    rig.arms[0].rotation.x = -swing;
    rig.arms[1].rotation.x = swing;
    rig.body.position.y = Math.abs(swing) * 0.09;
  }

  function face(root, x, z, dt) {
    const angle = Math.atan2(-x, -z) - root.rotation.y;
    root.rotation.y += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-14 * dt));
  }

  function hitEnemies(action) {
    const facing = gus.root.rotation.y;
    const player = gus.root.position;
    for (const enemy of enemies) {
      if (!enemy.health) continue;
      const { x, z } = enemy.root.position;
      const dx = x - player.x;
      const dz = z - player.z;
      const distance = Math.hypot(dx, dz);
      if (distance > (action.slam ? slamRange() : 3) ||
          (!action.slam && (-dx * Math.sin(facing) - dz * Math.cos(facing)) < distance * 0.32)) continue;
      if (enemy.guarded && !enemy.stagger) {
        if (!action.slam) {
          storyBeat.textContent = "Iona · Your punches won’t get through until you stagger him with a slam.";
          continue;
        }
        enemy.stagger = GUARD_STAGGER;
        storyBeat.textContent = "Iona · His guard is down. Now!";
        audio.play("guard-break");
      } else {
        if (enemy.holdsGate && !enemy.guarded && !action.slam) {
          storyBeat.textContent = "Watchkeeper · His guard is holding. Get close and use Q to slam.";
          continue;
        }
        enemy.health = Math.max(0, enemy.health - (action.slam ? 2 : 1));
      }
      enemy.intercepted = true;
      enemy.root.visible = enemy.health > 0;
      enemy.recoil = 0.25;
      enemy.attack = 0;
      enemy.warning.visible = false;
    }
  }

  const upgraded = () => mission === "reforged" || mission === "forge-complete" || atWaystation() ||
    atAqueduct() || onSupplyRoad() || atApproach() || mission === "finale" ||
    (story?.root.visible && gusStoryBeats[mission].upgraded);
  const slamRange = () => upgraded() ? 5.4 : 4.2;

  function resolveAttack(action) {
    if (story?.root.visible && story.hit(action, gus.root.position, gus.root.rotation.y, slamRange())) {
      // Complete the attack animation before handing control to the next scene.
      action.storyNext = gusStoryBeats[mission].next;
    }
    if (raiderFight(mission)) hitEnemies(action);
    if (mission === "finale") {
      sentinel.hit(action.slam, gus.root.position, gus.root.rotation.y, slamRange());
      if (!sentinel.health) advanceCheckpoint("finale-complete");
    }
    if (!action.slam) return;

    const player = gus.root.position;
    pulse.position.set(player.x, 0.025, player.z);
    pulse.material.color.setHex(upgraded() ? 0x89ffdb : 0xffba65);
    pulseTime = 0.4;
    chips.material.color.copy(pulse.material.color);
    pulse.visible = true;
    if (mission === "reforged" && journey.targetDistance(player) <= slamRange()) {
      journey.breakTarget();
      mission = "forge-complete";
      showJourneyStory(mission);
      advanceCheckpoint("forge-complete");
    }
    if (mission === "aqueduct-locks") {
      const reached = aqueduct.locksInRange(player, slamRange());
      if (reached === 2) {
        mission = "aqueduct-unlocked";
        aqueduct.mark(mission);
        showAqueductStory(mission);
        advanceCheckpoint(mission);
        audio.play("counterweights");
      } else if (reached === 1) {
        storyBeat.textContent = "One counterweight moved and caught again. Stand between the two to release them together.";
      }
    }
    if (mission === "supply-defense" && !supplyRoad.stopped && supplyRoad.nearWagon(player, slamRange())) {
      supplyRoad.stop();
      storyBeat.textContent = "The wagon is stopped. Keep the escort away from the cargo.";
      audio.play("wagon-stop");
    }
  }

  function nearWatchkeeper() {
    return gus.root.position.distanceToSquared(watchkeeper.root.position) <= 2.4 ** 2;
  }

  function nearBeacon() {
    return gus.root.position.distanceToSquared(villageWatch.beacon) <= 2.5 ** 2;
  }

  function nearGateRelease() {
    return gus.root.position.distanceToSquared(northGate.release) <= 2.5 ** 2;
  }

  function canMoveTo(x, z) {
    if (story?.root.visible) return story.canMove(x, z);
    if (onLanternRoad()) return journey.canMove(x, z);
    if (atWaystation()) return waystation.canMove(x, z);
    if (atAqueduct()) return aqueduct.canMove(x, z);
    if (onSupplyRoad()) return supplyRoad.canMove(x, z, mission);
    if (atApproach()) return approach.canMove(x, z);
    if (watchkeeper.root.visible && ((x > -10.25 && x < -8.15 && z > 0.43 && z < 2.57) ||
        (x > -11.15 && x < -9.05 && z > -3.67 && z < -1.53))) return false;
    const beacon = villageWatch.beacon;
    const release = northGate.release;
    if ((mission === "gate-defense" || mission === "seal-road" || mission === "report") &&
        Math.abs(x - release.x) < 0.72 && Math.abs(z - release.z) < 0.7) return false;
    return gate.visible || Math.abs(x - beacon.x) >= 2.05 || Math.abs(z - beacon.z) >= 1.07;
  }

  function update(dt) {
    const held = (...codes) => Number(!northGate.lowering && codes.some((code) => keys.has(code)));
    const x = held("KeyD", "ArrowRight") - held("KeyA", "ArrowLeft");
    const z = held("KeyS", "ArrowDown") - held("KeyW", "ArrowUp");
    const moveX = x * Math.cos(yaw) + z * Math.sin(yaw);
    const moveZ = z * Math.cos(yaw) - x * Math.sin(yaw);
    const walkSpeed = mission === "damaged" || mission === "smith-found" ||
      (story?.root.visible && gusStoryBeats[mission].damaged) ? 2.45 : 4.1;
    const speed = (attack ? 0.8 : walkSpeed) / Math.max(1, Math.hypot(x, z));
    const blend = 1 - Math.exp(-dt * 7);
    velocity.x = THREE.MathUtils.lerp(velocity.x, moveX * speed, blend);
    velocity.z = THREE.MathUtils.lerp(velocity.z, moveZ * speed, blend);
    const player = gus.root.position;
    const previousX = player.x, previousZ = player.z;
    const onRoad = onLanternRoad();
    const inValley = atWaystation();
    const onAqueduct = atAqueduct();
    const onConvoyRoad = onSupplyRoad();
    const atFreight = atApproach();
    const combatArena = inValley ? waystation : onConvoyRoad ? supplyRoad : null;
    const maxX = onRoad ? 10 : onAqueduct ? 10.9 : 12.8;
    const nextX = THREE.MathUtils.clamp(player.x + velocity.x * dt, -maxX, maxX);
    const nextZ = THREE.MathUtils.clamp(player.z + velocity.z * dt,
      onRoad ? -22.7 : mission === "supply-complete" ? -16.25 : -14.2,
      onRoad ? 22.7 : onAqueduct ? 15 : onConvoyRoad ? 16.8 : atFreight ? 16.4 : mission === "report" ? 18.5 : 14.2);
    if (canMoveTo(nextX, player.z)) player.x = nextX;
    if (canMoveTo(player.x, nextZ)) player.z = nextZ;
    if (x || z) face(gus.root, moveX, moveZ, dt);
    else if (attack) face(gus.root, -Math.sin(yaw), -Math.cos(yaw), dt);
    const moved = Math.hypot(player.x - previousX, player.z - previousZ);
    gus.pose(moved / Math.max(dt, 0.001), dt, reduceMotion(),
      story?.root.visible && gusStoryBeats[mission].damaged && armor < 100);
    const keeper = watchkeeper.root.position;
    if (watchkeeper.root.visible) {
      villageAge += dt;
      face(watchkeeper.root, player.x - keeper.x, player.z - keeper.z, dt);
      watchkeeper.pose(dt, {
        age: villageAge,
        activity: nearWatchkeeper() && !villageFight(mission) ? "trade" : "idle",
        distanceSq: keeper.distanceToSquared(player),
        reducedMotion: reduceMotion()
      });
    }
    watchkeeperMarker.visible = mission === "briefing" || mission === "report";
    if (dialogueTime > 0) {
      dialogueTime = Math.max(0, dialogueTime - dt);
      if (!dialogueTime) showVillageStory(mission);
    }
    villageWatch.update(mission, dt, reduceMotion(), enemies, player, residentDialogue);

    slamCooldown = Math.max(0, slamCooldown - dt);
    if (attack) {
      attack.elapsed += dt;
      const {elapsed, impact, duration, hand} = attack;
      const release = THREE.MathUtils.smoothstep(elapsed, impact - 0.10, impact);
      const recovery = 1 - THREE.MathUtils.smoothstep(elapsed, impact, duration);
      if (attack.slam) {
        const lift = THREE.MathUtils.smoothstep(elapsed, 0, impact - 0.10) * (1 - release);
        const land = release * recovery;
        gus.body.rotation.x += 0.46 * land - 0.12 * lift;
        gus.body.position.y -= 0.31 * land;
        for (let i = 0; i < gus.arms.length; i++) {
          gus.arms[i].rotation.x = -2.8 * lift + 0.13 * land;
          gus.elbows[i].rotation.x = -0.15 - 0.58 * lift + 0.22 * land;
        }
      } else {
        const draw = THREE.MathUtils.smoothstep(elapsed, 0, impact - 0.10) * (1 - release);
        gus.body.rotation.y += (hand === 0 ? 1 : -1) * (0.22 * draw - 0.23 * release * recovery);
        gus.arms[hand].rotation.x = 0.35 * draw - 1.63 * release * recovery;
        gus.elbows[hand].rotation.x = -0.15 - 1.12 * draw;
      }
      if (!attack.hit && attack.elapsed >= attack.impact) {
        attack.hit = true;
        resolveAttack(attack);
      }
      if (attack.elapsed >= attack.duration) {
        const next = attack.storyNext;
        attack = null;
        if (next) {
          if (next === "retreat") {
            saveStory(next);
            beginStoryCut("setback");
          } else advanceStory(next);
          return;
        }
      }
    }
    if (pulseTime > 0) {
      pulseTime = Math.max(0, pulseTime - dt);
      pulse.visible = pulseTime > 0;
      pulse.scale.setScalar(reduceMotion() ? slamRange() : slamRange() - pulseTime * 8);
      pulse.material.opacity = pulseTime * 1.5;
      chips.visible = pulse.visible && !fastGraphics && !reduceMotion();
      if (chips.visible) {
        const progress = 1 - pulseTime / 0.4;
        for (let i = 0; i < chips.count; i++) {
          const angle = i * (Math.PI * 2 / chips.count);
          const distance = progress * slamRange() * (0.64 + (i % 4) * 0.1);
          const height = 0.05 + Math.sin(progress * Math.PI) * (0.3 + (i % 3) * 0.21);
          chipPose.position.set(pulse.position.x + Math.cos(angle) * distance, height, pulse.position.z + Math.sin(angle) * distance);
          chipPose.rotation.set(progress * 4 + i, angle, progress * 2);
          chipPose.scale.setScalar((1 - progress) * (0.12 + (i % 5) * 0.016));
          chipPose.updateMatrix();
          chips.setMatrixAt(i, chipPose.matrix);
        }
        chips.instanceMatrix.needsUpdate = true;
      }
    }

    if (story?.root.visible) {
      const damage = story.update(dt, player, reduceMotion());
      if (!attack?.storyNext) armor = Math.max(0, armor - damage);
      if (story.forging) {
        const progress = story.forgeProgress;
        const brace = 1 - THREE.MathUtils.smoothstep(progress, 0.68, 0.94);
        gus.body.rotation.x += 0.22 * brace;
        gus.body.position.y -= 0.19 * brace;
        gus.arms[0].rotation.x -= 0.36 * brace;
        gus.arms[1].rotation.x -= 0.36 * brace;
        if (progress >= 0.68 && armor < 100) {
          armor = 100;
          gus.setForm("reforged");
          audio.play("reforged");
          storyBeat.textContent = "The new plates hold.";
        }
        if (progress >= 1) {
          advanceStory("trial");
          return;
        }
      }
      byId("health").value = armor;
      byId("slam").textContent = story.fighting || mission === "trial"
        ? slamCooldown ? `Slam · ${slamCooldown.toFixed(1)}s` : "Slam ready" : "";
      if (story.fighting) sentinelHealth.value = story.countersLeft;
      const instruction = attack?.storyNext && mission === "duel" ? "Steve forces Gus back" : story.instruction(player, !slamCooldown);
      if (objective.textContent !== instruction) objective.textContent = instruction;
      if (!armor) showMenu("lost", "Gus has fallen",
        "Move outside the strike ring, then counter with a punch or slam.", "Retry the fight");
      return;
    }

    if (gate.visible) {
      armor = Math.max(0, armor - sentinel.update(dt, player));
      sentinelHealth.value = sentinel.health;
      byId("health").value = armor;
      byId("slam").textContent = slamCooldown ? `Slam · ${slamCooldown.toFixed(1)}s` : "Slam ready";
      const instruction = !sentinel.health ? "The sentinel has fallen"
        : sentinel.charging ? "Strike incoming · Move outside the ring or slam"
        : sentinel.guarded ? "Q · Slam to stagger the sentinel"
        : attack?.slam ? "Sentinel staggered · Recovering from the slam"
        : "F · Punch before the guard reforms";
      if (objective.textContent !== instruction) objective.textContent = instruction;
      if (!sentinel.health && !attack) {
        showMenu("finale-won", "Guardian of BlockHaven", "Gus stopped the sentinel and secured the north gate.", "Replay the north gate");
      } else if (!armor) {
        showMenu("finale-lost", "The gate still stands", "The sentinel overpowered Gus. Use the upgraded slam to break its guard.", "Retry the north gate");
      }
      return;
    }

    if (onRoad) {
      if (reforgeAge !== null) {
        reforgeAge += dt;
        const point = journey.forgePoint;
        face(gus.root, point.x - player.x, point.z - player.z, dt);
        gus.body.rotation.x += 0.12;
        gus.arms[0].rotation.x -= 0.32;
        if (reforgeAge >= REFORGE_DURATION || reduceMotion()) finishReforge();
      }
      journey.update(dt, mission, player, reduceMotion(), reforgeAge !== null);
      let instruction;
      if (reforgeAge !== null) instruction = "Mara is repairing Gus";
      else if (mission === "damaged") instruction = journey.nearSmith(player)
        ? "E · Talk to Mara" : player.z > 7 ? "Follow the lanterns across the river" : "Find Mara at the smithy";
      else if (mission === "smith-found") instruction = journey.nearForge(player)
        ? "E · Repair Gus at the anvil" : "Approach the anvil";
      else if (mission === "forge-complete") instruction = "Follow the road through the pass";
      else instruction = journey.targetDistance(player) <= slamRange()
        ? "Q · Slam the rockfall" : "Approach the rockfall";
      if (objective.textContent !== instruction) objective.textContent = instruction;
      byId("health").value = armor;
      byId("slam").textContent = slamCooldown > 0 ? `Slam · ${slamCooldown.toFixed(1)}s` : "";
      if (mission === "forge-complete" && !attack && journey.reachedExit(player)) reset("waystation-road");
      return;
    }

    if (onAqueduct) {
      if (aqueduct.lowering) {
        const winch = aqueductModule.aqueductWinch;
        face(gus.root, winch.x - player.x, winch.z - player.z, dt);
        const pull = Math.sin(Math.PI * aqueduct.bridgeProgress);
        gus.body.rotation.x += 0.15 * pull;
        gus.arms[0].rotation.x -= 1.28 * pull;
        gus.elbows[0].rotation.x -= 0.48 * pull;
      }
      if (aqueduct.update(dt, reduceMotion())) {
        mission = "aqueduct-crossing";
        aqueduct.mark(mission);
        showAqueductStory(mission);
        advanceCheckpoint(mission);
      }
      let instruction;
      if (aqueduct.lowering) instruction = "The drawbridge is lowering";
      else if (mission === "aqueduct-locks") {
        instruction = aqueduct.locksInRange(player, slamRange()) === 2
          ? "Q · Free both counterweights" : "Find the survey plate between the counterweights";
      } else if (mission === "aqueduct-unlocked") {
        instruction = aqueduct.nearWinch(player) && !attack ? "E · Lower the drawbridge" : "Approach the winch";
      } else if (mission === "aqueduct-complete") {
        instruction = "Follow the supply road through the arch";
      } else {
        instruction = aqueduct.nearTrail(player) ? "E · Read the raiders’ mark" : "Cross to the raiders’ trail marker";
      }
      if (objective.textContent !== instruction) objective.textContent = instruction;
      byId("slam").textContent = slamCooldown > 0 ? `Slam · ${slamCooldown.toFixed(1)}s` : "";
      if (mission === "aqueduct-complete" && aqueduct.reachedExit(player)) reset("supply-road");
      return;
    }

    if (onConvoyRoad) {
      supplyRoad.update(dt, mission, reduceMotion());
      if (mission === "supply-defense") {
        supplyRoad.keepClear(player);
        if (supplyRoad.escaped) {
          showMenu("lost", "The convoy got away", "Catch the wagon and slam within range before it reaches the gate.",
            "Retry the convoy");
          return;
        }
      } else {
        let instruction;
        if (mission === "supply-road") {
          instruction = supplyRoad.nearWatchpost(player) ? "E · Intercept the convoy" : "Follow the road to the lookout";
        } else if (mission === "supply-complete") {
          instruction = "Follow the freight road through the arch";
        } else {
          instruction = supplyRoad.nearWagon(player, 2.8) ? "E · Read the convoy ledger" : "Search the stopped wagon";
        }
        if (objective.textContent !== instruction) objective.textContent = instruction;
        evacStatus.hidden = true;
        byId("slam").textContent = "";
        if (mission === "supply-complete" && supplyRoad.reachedExit(player)) reset("freight-road");
        return;
      }
    }

    if (atFreight) {
      approach.update(dt, reduceMotion());
      const instruction = approach.nearSeal(player) ? "E · Inspect the freight seal"
        : approach.crossedMoat(player) ? "Find the copper freight seal" : "Follow the amber freight lanterns";
      if (objective.textContent !== instruction) objective.textContent = instruction;
      byId("slam").textContent = "";
      return;
    }

    if (inValley) {
      waystation.update(dt, player, reduceMotion());
      if (mission !== "waystation-defense") {
        const instruction = mission === "waystation-road"
          ? waystation.nearWagon(player) ? "E · Inspect the wagon" : "Follow the road to the waystation"
          : mission === "waystation-complete" ? "Follow the aqueduct road through the gate"
            : waystation.nearLatch(player) ? "E · Free Iona" : "Go to the gate to free Iona";
        if (objective.textContent !== instruction) objective.textContent = instruction;
        byId("health").value = armor;
        byId("slam").textContent = "";
        if (mission === "waystation-complete" && !attack && waystation.reachedExit(player)) reset("aqueduct-locks");
        return;
      }
    } else if (!onConvoyRoad && !villageFight(mission)) {
      if (mission === "seal-road" && northGate.lowering) {
        const release = northGate.release;
        face(gus.root, release.x - player.x, release.z - player.z, dt);
        if (northGate.update(dt, reduceMotion())) {
          if (!story) {
            armor = 35;
            gus.setForm("damaged");
          }
          startVillageStage("report");
        } else {
          const pull = Math.sin(Math.PI * northGate.progress);
          gus.body.rotation.x += 0.19 * pull;
          gus.arms[0].rotation.x = -1.42 * pull;
          gus.elbows[0].rotation.x = -0.45 * pull;
        }
      }
      const nearby = nearWatchkeeper();
      const resident = mission === "briefing" || mission === "report" ? villageWatch.residentAt(player) : null;
      let instruction;
      if (mission === "signal") {
        instruction = nearBeacon() ? "E · Light the watch beacon" : "Find the west watch beacon";
      } else if (mission === "seal-road") {
        instruction = northGate.lowering ? "The portcullis is lowering"
          : nearGateRelease() ? "E · Lower the portcullis" : "Find the north gate lever";
      } else if (mission === "briefing") {
        instruction = nearby ? "E · Talk to the watchkeeper" : resident
          ? `E · Talk to the ${resident.role}` : "Find the watchkeeper at the lantern";
      } else {
        instruction = nearby ? "E · Speak to the watchkeeper" : resident
          ? `E · Talk to the ${resident.role}` : "Meet the villagers at the south refuge";
      }
      if (objective.textContent !== instruction) objective.textContent = instruction;
      byId("health").value = armor;
      byId("slam").textContent = "";
      return;
    }

    for (const enemy of enemies) {
      if (!enemy.health) continue;
      const pos = enemy.root.position;
      if (onConvoyRoad) supplyRoad.keepClear(pos);
      const previousAttack = enemy.attack;
      const playerDistance = pos.distanceTo(player);
      if (enemy.pursuesVillagers && playerDistance <= RAIDER_INTERCEPT_RANGE) enemy.intercepted = true;
      const resident = enemy.pursuesVillagers && !enemy.intercepted
        ? villageWatch.nearestResident(pos) : null;
      if (enemy.pursuesVillagers) pursuitMarker.visible = !!resident;
      const destination = resident ?? player;
      const dx = destination.x - pos.x, dz = destination.z - pos.z;
      const distance = Math.max(0.001, Math.hypot(dx, dz));
      face(enemy.root, dx, dz, dt);
      const advancing = !enemy.holdsGate && distance > (resident ? 2.2 : 1.65) && !previousAttack && !enemy.recoil;
      const step = enemy.recoil ? -3.5 : advancing ? (resident ? 3.35 : 2.45) : 0;
      if (!enemy.holdsGate) {
        const nextX = THREE.MathUtils.clamp(pos.x + dx / distance * step * dt, -12.8, 12.8);
        const nextZ = THREE.MathUtils.clamp(pos.z + dz / distance * step * dt, -14.2, 14.2);
        if (!combatArena || combatArena.canMove(nextX, pos.z)) pos.x = nextX;
        if (!combatArena || combatArena.canMove(pos.x, nextZ)) pos.z = nextZ;
      }
      enemy.recoil = Math.max(0, enemy.recoil - dt);
      if (enemy.stagger) {
        enemy.stagger = Math.max(0, enemy.stagger - dt);
        if (!enemy.stagger) storyBeat.textContent = "Iona · His guard is back up. Wait for your slam.";
      }
      if (!previousAttack && !enemy.recoil && !enemy.stagger && playerDistance <= 1.65) {
        enemy.attack = RAIDER_WINDUP + RAIDER_RECOVERY;
      } else if (previousAttack) enemy.attack = Math.max(0, previousAttack - dt);
      const windingUp = enemy.attack > RAIDER_RECOVERY;
      enemy.warning.visible = windingUp;
      if (windingUp) {
        enemy.warning.position.set(pos.x, 0.02, pos.z);
      }
      enemy.age += dt;
      enemy.pose(dt, {
        age: enemy.age,
        speed: Math.abs(step),
        prep: !enemy.stagger && (enemy.holdsGate || !resident && playerDistance < 3),
        windup: windingUp ? 1 - (enemy.attack - RAIDER_RECOVERY) / RAIDER_WINDUP : 0,
        impactAge: !windingUp && enemy.attack ? RAIDER_RECOVERY - enemy.attack : Infinity,
        distanceSq: playerDistance ** 2,
        reducedMotion: reduceMotion()
      });
      if (previousAttack > RAIDER_RECOVERY && !windingUp && playerDistance < RAIDER_REACH) armor = Math.max(0, armor - 13);
    }

    const remaining = enemies.filter((enemy) => enemy.health).length;
    byId("health").value = armor;
    if (onConvoyRoad) {
      byId("slam").textContent = slamCooldown ? `Slam · ${slamCooldown.toFixed(1)}s` : "Slam ready";
      if (!remaining && supplyRoad.stopped) {
        mission = "supply-clear";
        supplyRoad.mark(mission);
        showSupplyStory(mission);
        advanceCheckpoint(mission);
      } else if (!armor) {
        showMenu("lost", "Gus has fallen", "The escort is still guarding the wagon. Use the slam to interrupt their strikes.",
          "Retry the convoy");
      } else {
        const instruction = supplyRoad.stopped ? "Defeat the remaining escort" : supplyRoad.nearWagon(player, slamRange())
          ? "Q · Stop the supply wagon" : "Catch the supply wagon";
        if (objective.textContent !== instruction) objective.textContent = instruction;
        const detail = supplyRoad.stopped ? `${remaining} ${remaining === 1 ? "raider" : "raiders"} remaining`
          : `Gate in ${supplyRoad.secondsLeft}s`;
        if (evacStatus.textContent !== detail) evacStatus.textContent = detail;
        evacStatus.classList.toggle("blocked", !supplyRoad.stopped && supplyRoad.secondsLeft <= 3);
        evacStatus.hidden = false;
      }
      return;
    }

    if (inValley) {
      byId("slam").textContent = slamCooldown ? `Slam · ${slamCooldown.toFixed(1)}s` : "Slam ready";
      waystationMarker.material.color.setHex(waystationGuard.stagger ? 0x89ffdb : 0xffae62);
      const instruction = waystationGuard.stagger && waystationGuard.health
        ? player.distanceTo(waystationGuard.root.position) > 3 ? "Guard staggered · Close in"
          : attack?.slam ? "Guard staggered · Recovering from the slam" : "F · Punch the staggered guard"
        : remaining === 1 && waystationGuard.health ? "Q · Stagger the waystation guard"
          : `Defend the waystation · ${remaining} ${remaining === 1 ? "raider" : "raiders"} remaining`;
      if (objective.textContent !== instruction) objective.textContent = instruction;
      if (!remaining) {
        mission = "waystation-clear";
        waystation.mark(mission);
        showWaystationStory(mission);
        advanceCheckpoint(mission);
      } else if (!armor) {
        showMenu("lost", "Gus has fallen", "The waystation is still held. Use the slam to interrupt the guard.",
          "Retry the waystation");
      }
      return;
    }
    const location = mission === "defense" ? "Defend the square" : "Hold the north road";
    const instruction = remaining === 1 && gateGuard.health ? "Q · Slam the gate guard"
      : remaining ? `${location} · ${remaining} ${remaining === 1 ? "raider" : "raiders"} remaining`
      : "Hold the square until the villagers are safe";
    if (objective.textContent !== instruction) objective.textContent = instruction;
    byId("slam").textContent = slamCooldown ? `Slam · ${slamCooldown.toFixed(1)}s` : "Slam ready";
    const escortComplete = mission !== "defense" || villageWatch.safe === villageWatch.total;
    if (mission === "defense") updateEvacuationStatus();
    if (!remaining && escortComplete) {
      startVillageStage(mission === "defense" ? "signal" : "seal-road");
    } else if (!armor) {
      const detail = mission === "defense" ? "The raiders took the village square."
        : "The beacon is lit. Stand between the raiders and the refuge.";
      showMenu("lost", "Gus has fallen", detail, "Try again");
    }
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    const maxPixels = fastGraphics ? 800_000 : 2_400_000;
    const areaScale = Math.sqrt(maxPixels / Math.max(1, innerWidth * innerHeight));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || devicePixelRatio, fastGraphics ? 1 : 1.5, areaScale));
    renderer.setSize(innerWidth, innerHeight);
  }
  window.addEventListener("resize", resize);
  resize();
  reset(villageComplete(initialCheckpoint) ? "briefing" : initialCheckpoint);
  play.disabled = false;
  play.textContent = "Enter the village";
  if (initialCheckpoint === "defense") {
    message.textContent = "The watchkeeper has briefed Gus. Three raiders are approaching the square.";
    play.textContent = "Resume the defense";
  } else if (initialCheckpoint === "signal") {
    message.textContent = "The market is clear. Light the west watch beacon to guide the families to refuge.";
    play.textContent = "Return to the west beacon";
  } else if (initialCheckpoint === "gate-defense") {
    message.textContent = "The beacon is lit. Stop the raiders coming in from the north.";
    play.textContent = "Resume at the north road";
  } else if (initialCheckpoint === "seal-road") {
    message.textContent = "The north road is clear. Pull the lever to close the village gate.";
    play.textContent = "Return to the north gate";
  } else if (initialCheckpoint === "report") {
    message.textContent = "The gate is shut. Find the watchkeeper and the families at the south refuge.";
    play.textContent = "Return to the refuge";
  } else if (villageComplete(initialCheckpoint)) {
    if (development && initialCheckpoint === "finale-complete") message.textContent = "Gus has secured the north gate.";
    else if (development && initialCheckpoint === "waystation-complete") message.textContent = "Iona is safe. Gus knows which road the raiders took.";
    else if (development && initialCheckpoint === "aqueduct-complete") message.textContent = "Gus crossed the aqueduct and found the raiders’ supply road.";
    else if (development && initialCheckpoint === "supply-defense") message.textContent = "The convoy is headed for the fortress gate.";
    else if (development && initialCheckpoint === "supply-clear") message.textContent = "The wagon is secure. Its ledger may show a way inside.";
    else if (development && initialCheckpoint === "supply-complete") message.textContent = "Gus found the freight entrance marked in the convoy ledger.";
    else if (development && initialCheckpoint === "freight-found") message.textContent = "The freight seal is a match. The passage is just ahead.";
    else if (development && initialCheckpoint === "chapter-two-complete") message.textContent = "Gus found a passage beneath the fortress.";
    else if (development && forgeComplete(initialCheckpoint)) message.textContent = "Gus has reforged his armor and opened the road into the valley.";
    else message.textContent = "Chapter 1 is complete. Gus must find the smith before he can follow the raiders.";
    play.textContent = "Replay Chapter 1";
    forgeButton.textContent = forgeAction();
    forgeButton.hidden = !development;
    if (development && forgeComplete(initialCheckpoint)) {
      finaleButton.textContent = finaleAction();
      finaleButton.hidden = false;
    }
  }
  const storyAvailable = story && (storyCheckpoint || villageComplete(initialCheckpoint));
  if (story) {
    byId("campaignChapterOneTitle").textContent = "The Guardian";
    byId("campaignChapterOneCopy").textContent = "Protect the village and discover what happened to its people.";
    byId("campaignChapterOneStatus").textContent = publicStory ? "Available" : "Story preview";
    byId("campaignChapterTwoTitle").textContent = "Reforged";
    byId("campaignChapterTwoCopy").textContent = "Face Steve, escape the stronghold and rebuild Gus’s armor.";
    byId("campaignChapterTwoStatus").textContent = gusStoryChapter(storyCheckpoint) >= 2
      ? publicStory ? "Available" : "Story preview" : "Finish Chapter 1 to unlock";
    byId("campaignChapterThreeTitle").textContent = "Gus’s Revenge";
    byId("campaignChapterThreeCopy").textContent = "Return to face Steve again.";
    byId("campaignChapterThreeStatus").textContent = publicStory ? "In development"
      : gusStoryRank(storyCheckpoint) >= gusStoryRank("ready") ? "Story preview" : "Finish Chapter 2 to unlock";
    if (storyAvailable) {
      const releasedStoryComplete = publicStory && gusStoryRank(storyCheckpoint) >= gusStoryRank("ready");
      message.textContent = releasedStoryComplete ? "Chapters 1 and 2 are complete."
        : storyCheckpoint === "ending" ? "The story preview is complete."
        : storyCheckpoint === "ready" ? "Chapter 2 is complete."
        : `Continue from ${gusStoryBeats[storyCheckpoint ?? "day-off"].title}.`;
      play.textContent = releasedStoryComplete ? "Replay Chapter 2"
        : storyCheckpoint === "ending" ? "Replay Chapter 3"
        : storyCheckpoint === "ready" ? "Begin Chapter 3" : "Continue Campaign";
      forgeButton.hidden = false;
      forgeButton.textContent = "Replay Chapter 1";
    }
  }
  campaignMenu.ready(play, {
    detail: initialCheckpoint === "briefing" && !storyAvailable ? "" : message.textContent,
    complete: Boolean(storyAvailable) || villageComplete(initialCheckpoint),
    previews: story ? [["campaignChapterOne", forgeButton]]
      : [["campaignChapterTwo", forgeButton], ["campaignChapterThree", finaleButton]]
  });
  let previous = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = THREE.MathUtils.clamp((now - previous) / 1000, 0, 0.04);
    previous = now;
    if (state === "menu") return;
    const playing = state === "playing";
    if (playing) {
      if (raidReveal !== null) updateRaidReveal(dt);
      else if (storyCut) updateStoryCut(dt);
      else if (approach?.revealing) {
        gus.pose(0, dt, reduceMotion());
        if (approach.update(dt, reduceMotion())) finishFortressReveal();
      } else update(dt);
    }
    gus.updateWear(armor, playing ? dt : 0, reduceMotion(), playing && !!attack);
    target.copy(gus.root.position);
    const convoyView = onSupplyRoad();
    const freightView = atApproach();
    target.y += convoyView || (freightView && state !== "freight-won") ? 2.05 : 1.6;
    if (storyCut?.name === "setback") {
      camera.position.set(target.x + 4.4, target.y + 0.85, target.z + 0.95);
      target.z -= 1.1;
    } else if (storyCut) {
      story.frameShot(storyCut.name, storyCut.time, gus.root.position, camera, target);
    } else if (state === "discovered") {
      story.frameShot("discovery", STORY_CUTS.discovery.duration, gus.root.position, camera, target);
    } else if (state === "story-won") {
      if (innerWidth >= 900) {
        camera.position.set(7.05, 5.6, 5.7);
        target.set(-2.4, 0.52, -0.77);
      } else {
        camera.position.set(7.9, 5.15, 1.25);
        target.set(-0.4, -0.60, -4.35);
      }
    } else if (story?.forging) {
      const approach = THREE.MathUtils.smoothstep(story.forgeProgress, 0, 0.92);
      camera.position.set(-4.45 + approach * 1.1, 3.15 - approach * 0.42, -0.35 - approach * 0.78);
      target.set(0, 1.72, -4.35 + approach * 0.42);
    } else if (approach?.revealing) {
      const t = THREE.MathUtils.smoothstep(approach.revealProgress, 0, 1);
      camera.position.set(6.2 - 1.84 * t, 3.61 + 2.65 * t, -4.1 + 4.7 * t);
      target.set(-0.15 + 0.43 * t, 2.01 + 7.08 * t, -11.88 - 1.03 * t);
    } else if ((state === "playing" || state === "paused") && raidReveal !== null && raidReveal >= RAID_CUT_TIME) {
      camera.position.set(3.5, 2.7, -8.7);
      target.set(0, 1.8, -15.7);
    } else if (state === "won") {
      camera.position.set(4.45, 3.2, 8.5);
      target.set(-0.9, 1.45, 14.7);
      if (innerWidth >= 900) target.x += 3.1;
      if (innerWidth < 700 && innerHeight >= 620) {
        camera.position.set(0.1, 3.5, 5.8);
        target.set(-1.05, 0.18, 14.5);
      }
    } else if (state === "freight-won") {
      camera.position.copy(FREIGHT_END_VIEW);
      if (innerWidth >= 900) {
        target.x -= 2.15;
        target.z -= 1.07;
      }
    } else if (state === "finale-won") {
      const angle = gus.root.rotation.y;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      camera.position.set(target.x + 3.5 * cos - 5 * sin, target.y + 0.7, target.z - 3.5 * sin - 5 * cos);
      if (innerWidth >= 900) {
        target.x += 2.4 * cos;
        target.z -= 2.4 * sin;
      } else if (innerWidth < 700 && innerHeight >= 620) {
        target.y -= 1.35;
      }
    } else {
      const follow = gate.visible ? 8.7 : convoyView || freightView ? 8.15
        : onLanternRoad() || atWaystation() || atAqueduct() ? 7.65 : 6.5;
      const inDefense = raiderFight(mission) && camera.aspect >= 1.25;
      const shoulder = convoyView ? -2.95 : mission === "seal-road" ? -2.9 : inDefense ? 3.2 : 2;
      const distance = follow * Math.cos(pitch);
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      camera.position.set(
        THREE.MathUtils.clamp(target.x + sin * distance + cos * shoulder, -15.5, 15.5),
        target.y + follow * Math.sin(pitch) + (convoyView ? 0.82 : inDefense ? 1.45 : gate.visible ? 0 : 0.56),
        target.z + cos * distance - sin * shoulder
      );
      if (!gate.visible && camera.aspect >= 1.25) {
        const lateral = convoyView ? -1.27 : inDefense ? 1.4 : 0.72;
        const lead = inDefense ? 0.95 : 0.4;
        target.x += lateral * cos - lead * sin;
        target.z -= lateral * sin + lead * cos;
      }
    }
    camera.lookAt(target);
    renderer.render(scene, camera);
  });
}

const settings = readGusSettings();
const campaignMenu = createGusCampaignMenu(settings);
try {
  await startPreview(settings, campaignMenu);
} catch (error) {
  campaignMenu.unavailable();
  console.error(error);
}
