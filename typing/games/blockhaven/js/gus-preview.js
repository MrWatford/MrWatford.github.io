import * as THREE from "../lib/three.module.min.js";
import { buildGusRig } from "./gus-rig.js?v=chapter-one-1";
import { dressGusVillage } from "./gus-village.js?v=3";
import { createVillageWatch, REFUGE } from "./gus-village-watch.js?v=5";
import { createNorthGate } from "./gus-north-gate.js?v=2";
import { createVillagerRig } from "./villager-rig.js?v=living-kingdom-1";
import { createRaiderRig } from "./raider-rig.js?v=living-kingdom-1";
import { createGusAudio } from "./gus-audio.js?v=3";
import { createGusCampaignMenu } from "./gus-campaign-menu.js?v=1";
import { readGusSettings } from "./gus-settings.js?v=1";

const byId = (id) => document.getElementById(id);
const play = byId("play");
const credits = byId("credits");
const overlay = byId("overlay");
const hud = byId("hud");
const objective = byId("objective");
const storyBeat = byId("storyBeat");
const evacStatus = byId("evacStatus");
const heading = byId("heading");
const message = byId("message");
const skipRaid = byId("skipRaid");
const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");

const CHECKPOINT_KEY = "blockhaven.gus.preview";
const CHECKPOINT_VERSION = 5;
const VILLAGE_CHECKPOINTS = ["briefing", "defense", "report", "complete"];
const FORGE_CHECKPOINTS = [...VILLAGE_CHECKPOINTS, "reforged", "forge-complete"];
const PROTOTYPE_CHECKPOINTS = [...FORGE_CHECKPOINTS, "finale-complete"];
const VILLAGE_WATCH_CHECKPOINTS = ["briefing", "defense", "signal", "gate-defense", ...PROTOTYPE_CHECKPOINTS.slice(2)];
const CHECKPOINT_ORDER = ["briefing", "defense", "signal", "gate-defense", "seal-road", "report", "complete",
  "reforged", "forge-complete", "finale-complete"];
const villageStory = {
  briefing: "Market day. Talk to the villagers or find the watchkeeper by the lantern.",
  defense: "Watchkeeper · Get close to the marked raider and draw him away from the villagers.",
  signal: "Watchkeeper · The road is open. Light the west beacon so the families know to keep going.",
  "gate-defense": "Watchkeeper · That raider’s guarding the winch. Get close and use Q to break his guard.",
  "seal-road": "Watchkeeper · The winch is jammed. Gus, you’ll have to force the release.",
  report: "Watchkeeper · We’re all at the south refuge. Come let me see that armor."
};
const villageFight = (stage) => stage === "defense" || stage === "gate-defense";
const RAIDER_WINDUP = 0.56;
const RAIDER_RECOVERY = 0.92;
const RAIDER_REACH = 2;
const RAIDER_INTERCEPT_RANGE = 3.7;
const RAID_REVEAL_TIME = 3.5;
const RAID_CUT_TIME = 0.68;
const RAID_REVEAL_MARKS = [[-5, -7.1], [1, -10], [5.2, -7.9]];
const villageComplete = (stage) => CHECKPOINT_ORDER.indexOf(stage) >= CHECKPOINT_ORDER.indexOf("complete");

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

function startPreview(settings, campaignMenu) {
  const fastGraphics = settings.quality === "fast";
  const reduceMotion = () => settings.reducedMotion || systemMotion.matches;
  const audio = createGusAudio(settings);
  window.addEventListener("pagehide", event => {
    if (event.persisted) audio.pause();
    else audio.close();
  });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaebfba);
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

  dressGusVillage(scene, cube);

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

  const warningGeometry = new THREE.RingGeometry(RAIDER_REACH - 0.15, RAIDER_REACH, 32);
  const warningMaterial = new THREE.MeshBasicMaterial({ color: 0xff5438 });
  const enemies = [[-6, -6], [1, -10], [7, -5], [-5.35, -12.8], [-2.45, -12.9]].map(([x, z], index) => {
    const warning = new THREE.Mesh(warningGeometry, warningMaterial);
    warning.rotation.x = -Math.PI / 2;
    scene.add(warning);
    const pursuesVillagers = index === 0;
    const holdsGate = index === 4;
    const rig = faceForward(createRaiderRig("vindicator", `gus-raider-${index}`,
      pursuesVillagers || holdsGate ? "siege" : undefined, { sceneLighting: true }));
    rig.root.name = pursuesVillagers ? "Evacuation Raider" : holdsGate ? "Gate Raider" : "Raider";
    return { ...rig, warning, x, z, pursuesVillagers, holdsGate, wave: index < 3 ? "defense" : "gate-defense",
      health: 0, attack: 0, recoil: 0, age: 0, intercepted: false };
  });
  const pursuitMarker = new THREE.Mesh(new THREE.OctahedronGeometry(0.23), ember);
  pursuitMarker.name = "Evacuation threat marker";
  enemies[0].root.add(pursuitMarker);
  pursuitMarker.position.y = 2.7;
  const gateGuard = enemies.find(enemy => enemy.holdsGate);
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
  let mission = "briefing";
  let armor = 100;
  let yaw = -0.32;
  let pitch = 0.38;
  let drag = null;
  let attack = null;
  let slamCooldown = 0;
  let pulseTime = 0;
  let nextHand = 0;
  let villageAge = 0;
  let residentDialogue = null;
  let dialogueTime = 0;
  let raidReveal = null;

  function advanceCheckpoint(stage) {
    if (CHECKPOINT_ORDER.indexOf(stage) > CHECKPOINT_ORDER.indexOf(furthestCheckpoint)) {
      furthestCheckpoint = stage;
    }
    saveCheckpoint(stage);
  }

  function deployRaiders(stage) {
    for (const [index, enemy] of enemies.entries()) {
      const entrance = stage === "defense" ? RAID_REVEAL_MARKS[index] : null;
      enemy.root.position.set(entrance?.[0] ?? enemy.x, 0, entrance?.[1] ?? enemy.z);
      enemy.root.rotation.y = Math.PI;
      enemy.root.visible = enemy.wave === stage;
      enemy.health = enemy.root.visible ? 2 : 0;
      enemy.attack = enemy.recoil = enemy.age = 0;
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
    raidReveal = null;
    skipRaid.hidden = true;
    mission = startAt;
    watchkeeper.root.position.set(1, 0, 3);
    if (mission === "report") watchkeeper.root.position.copy(refuge);
    watchkeeperMarker.position.set(watchkeeper.root.position.x, 3.55, watchkeeper.root.position.z);
    watchkeeperMarker.visible = false;
    villageWatch.reset(true, mission);
    villageWatch.update(mission, 0, reduceMotion());
    northGate.reset(mission);
    armor = mission === "report" ? 35 : 100;
    gus.setForm(mission === "report" ? "damaged" : mission);
    velocity.set(0, 0, 0);
    gus.root.position.set(0, 0, 8);
    if (mission === "signal" || mission === "gate-defense") {
      gus.root.position.set(villageWatch.beacon.x + 0.75, 0, villageWatch.beacon.z + 2.05);
    } else if (mission === "seal-road") {
      gus.root.position.set(northGate.release.x + 1.35, 0, northGate.release.z + 1.8);
    } else if (mission === "report") {
      gus.root.position.set(refuge.x + 0.7, 0, refuge.z - 3.6);
    }
    gus.root.rotation.y = 0;
    gus.reset();
    gus.updateWear(armor, 0, reduceMotion(), false);
    yaw = mission === "report" ? Math.PI : mission === "gate-defense" || mission === "seal-road" ? 0 : -0.32;
    if (mission === "report") gus.root.rotation.y = Math.PI;
    pitch = 0.38;
    attack = null;
    slamCooldown = 0;
    pulseTime = 0;
    pulse.visible = chips.visible = false;
    nextHand = 0;
    villageAge = 0;
    deployRaiders(mission);
    showVillageStory(mission);
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
    credits.hidden = mode !== "won";
    byId("controlsHint").hidden = mode === "won";
    overlay.hidden = false;
    hud.hidden = true;
    play.focus();
  }

  function beginPlay() {
    audio.start();
    state = "playing";
    campaignMenu.hide();
    overlay.hidden = true;
    hud.hidden = false;
    if (raidReveal !== null) skipRaid.focus();
    else renderer.domElement.focus();
  }

  play.addEventListener("click", () => {
    if (state === "lost") {
      reset(mission);
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
    if (state === "playing" && raidReveal !== null) finishRaidReveal();
  });
  window.addEventListener("blur", event => { if (event.target === window) pause(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

  const movement = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
  window.addEventListener("keydown", (event) => {
    if (state !== "playing" || event.metaKey || event.ctrlKey || event.altKey) return;
    const { code } = event;
    if (raidReveal !== null) {
      if (movement.has(code)) event.preventDefault();
      if (code === "Escape") pause();
      else if (code === "KeyE" && !event.repeat) finishRaidReveal();
      return;
    }
    if (movement.has(code)) {
      event.preventDefault();
      keys.add(code);
    } else if (code === "Escape") {
      pause();
    } else if (code === "KeyE" && !event.repeat) {
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
        showMenu("won", "The village is safe",
          "The villagers made it home. Gus’s armor needs a smith, but the village forge has gone cold.", "Replay Chapter 1");
      }
    } else if (villageFight(mission) && !event.repeat && !attack &&
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
    if (state !== "playing" || raidReveal !== null || event.button !== 0 || drag) return;
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
      if (distance > (action.slam ? 4.2 : 3) ||
          (!action.slam && (-dx * Math.sin(facing) - dz * Math.cos(facing)) < distance * 0.32)) continue;
      if (enemy.holdsGate && !action.slam) {
        storyBeat.textContent = "Watchkeeper · His guard is holding. Get close and use Q to slam.";
        continue;
      }
      enemy.health = Math.max(0, enemy.health - (action.slam ? 2 : 1));
      enemy.intercepted = true;
      enemy.root.visible = enemy.health > 0;
      enemy.recoil = 0.25;
      enemy.attack = 0;
      enemy.warning.visible = false;
    }
  }

  const SLAM_RANGE = 4.2;

  function resolveAttack(action) {
    if (villageFight(mission)) hitEnemies(action);
    if (!action.slam) return;

    const player = gus.root.position;
    pulse.position.set(player.x, 0.025, player.z);
    pulseTime = 0.4;
    chips.material.color.copy(pulse.material.color);
    pulse.visible = true;
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
    if ((x > -10.25 && x < -8.15 && z > 0.43 && z < 2.57) ||
        (x > -11.15 && x < -9.05 && z > -3.67 && z < -1.53)) return false;
    const beacon = villageWatch.beacon;
    const release = northGate.release;
    if ((mission === "gate-defense" || mission === "seal-road" || mission === "report") &&
        Math.abs(x - release.x) < 0.72 && Math.abs(z - release.z) < 0.7) return false;
    return Math.abs(x - beacon.x) >= 2.05 || Math.abs(z - beacon.z) >= 1.07;
  }

  function update(dt) {
    const held = (...codes) => Number(!northGate.lowering && codes.some((code) => keys.has(code)));
    const x = held("KeyD", "ArrowRight") - held("KeyA", "ArrowLeft");
    const z = held("KeyS", "ArrowDown") - held("KeyW", "ArrowUp");
    const moveX = x * Math.cos(yaw) + z * Math.sin(yaw);
    const moveZ = z * Math.cos(yaw) - x * Math.sin(yaw);
    const speed = (attack ? 0.8 : 4.1) / Math.max(1, Math.hypot(x, z));
    const blend = 1 - Math.exp(-dt * 7);
    velocity.x = THREE.MathUtils.lerp(velocity.x, moveX * speed, blend);
    velocity.z = THREE.MathUtils.lerp(velocity.z, moveZ * speed, blend);
    const player = gus.root.position;
    const previousX = player.x, previousZ = player.z;
    const nextX = THREE.MathUtils.clamp(player.x + velocity.x * dt, -12.8, 12.8);
    const nextZ = THREE.MathUtils.clamp(player.z + velocity.z * dt, -14.2, mission === "report" ? 18.5 : 14.2);
    if (canMoveTo(nextX, player.z)) player.x = nextX;
    if (canMoveTo(player.x, nextZ)) player.z = nextZ;
    if (x || z) face(gus.root, moveX, moveZ, dt);
    else if (attack) face(gus.root, -Math.sin(yaw), -Math.cos(yaw), dt);
    const moved = Math.hypot(player.x - previousX, player.z - previousZ);
    gus.pose(moved / Math.max(dt, 0.001), dt, reduceMotion());
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
      if (attack.elapsed >= attack.duration) attack = null;
    }
    if (pulseTime > 0) {
      pulseTime = Math.max(0, pulseTime - dt);
      pulse.visible = pulseTime > 0;
      pulse.scale.setScalar(reduceMotion() ? SLAM_RANGE : SLAM_RANGE - pulseTime * 8);
      pulse.material.opacity = pulseTime * 1.5;
      chips.visible = pulse.visible && !fastGraphics && !reduceMotion();
      if (chips.visible) {
        const progress = 1 - pulseTime / 0.4;
        for (let i = 0; i < chips.count; i++) {
          const angle = i * (Math.PI * 2 / chips.count);
          const distance = progress * SLAM_RANGE * (0.64 + (i % 4) * 0.1);
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

    if (!villageFight(mission)) {
      if (mission === "seal-road" && northGate.lowering) {
        const release = northGate.release;
        face(gus.root, release.x - player.x, release.z - player.z, dt);
        if (northGate.update(dt, reduceMotion())) {
        armor = 35;
          gus.setForm("damaged");
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
        pos.x = THREE.MathUtils.clamp(pos.x + dx / distance * step * dt, -12.8, 12.8);
        pos.z = THREE.MathUtils.clamp(pos.z + dz / distance * step * dt, -14.2, 14.2);
      }
      enemy.recoil = Math.max(0, enemy.recoil - dt);
      if (!previousAttack && !enemy.recoil && playerDistance <= 1.65) enemy.attack = RAIDER_WINDUP + RAIDER_RECOVERY;
      else if (previousAttack) enemy.attack = Math.max(0, previousAttack - dt);
      const windingUp = enemy.attack > RAIDER_RECOVERY;
      enemy.warning.visible = windingUp;
      if (windingUp) {
        enemy.warning.position.set(pos.x, 0.02, pos.z);
      }
      enemy.age += dt;
      enemy.pose(dt, {
        age: enemy.age,
        speed: Math.abs(step),
        prep: enemy.holdsGate || !resident && playerDistance < 3,
        windup: windingUp ? 1 - (enemy.attack - RAIDER_RECOVERY) / RAIDER_WINDUP : 0,
        impactAge: !windingUp && enemy.attack ? RAIDER_RECOVERY - enemy.attack : Infinity,
        distanceSq: playerDistance ** 2,
        reducedMotion: reduceMotion()
      });
      if (previousAttack > RAIDER_RECOVERY && !windingUp && playerDistance < RAIDER_REACH) armor = Math.max(0, armor - 13);
    }

    const remaining = enemies.filter((enemy) => enemy.health).length;
    byId("health").value = armor;
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
    message.textContent = "Chapter 1 is complete. Gus must find the smith before he can follow the raiders.";
    play.textContent = "Replay Chapter 1";
  }
  campaignMenu.ready(play, {
    detail: initialCheckpoint === "briefing" ? "" : message.textContent,
    complete: villageComplete(initialCheckpoint)
  });
  let previous = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = THREE.MathUtils.clamp((now - previous) / 1000, 0, 0.04);
    previous = now;
    if (state === "menu") return;
    const playing = state === "playing";
    if (playing) {
      if (raidReveal === null) update(dt);
      else updateRaidReveal(dt);
    }
    gus.updateWear(armor, playing ? dt : 0, reduceMotion(), playing && !!attack);
    target.copy(gus.root.position);
    target.y += 1.6;
    if ((state === "playing" || state === "paused") && raidReveal !== null && raidReveal >= RAID_CUT_TIME) {
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
    } else {
      const follow = 6.5;
      const inDefense = villageFight(mission) && camera.aspect >= 1.25;
      const shoulder = mission === "seal-road" ? -2.9 : inDefense ? 3.2 : 2;
      const distance = follow * Math.cos(pitch);
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      camera.position.set(
        THREE.MathUtils.clamp(target.x + sin * distance + cos * shoulder, -15.5, 15.5),
        target.y + follow * Math.sin(pitch) + (inDefense ? 1.45 : 0.56),
        target.z + cos * distance - sin * shoulder
      );
      if (camera.aspect >= 1.25) {
        const lateral = inDefense ? 1.4 : 0.72;
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
  startPreview(settings, campaignMenu);
} catch (error) {
  campaignMenu.unavailable();
  console.error(error);
}
