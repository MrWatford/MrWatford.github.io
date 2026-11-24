// Blockhaven: the game loop, 3D drawing, controls, mining and building, survival rules, and saving.
import * as THREE from "../lib/three.module.min.js";
import { isCrop, DISC_ITEMS, B, I, CHUNK, HEIGHT, SEA, BLOCKS, OPAQUE, SOLID, RECIPES, SMELT, FUEL, SMELT_TIME, TAGS, idOf, metaOf, make, blockDef, itemDef, isBlockItem,
  buildAtlas, faceTile, TILE, iconCanvas, OPEN, TOP, LIT, HEAD, WET, EYE_IN, HONEY_MAX, honeyOf, BEACON_BASE, ANCHOR_MAX, ATLAS_W, ATLAS_H, isDoor, isRail, WATERY, flammable, LEAF_PERSIST, WATERLOGGED, LOGGABLE, isWet } from "./blocks.js";
import { initRedstone } from "./redstone.js";
import { selectBox } from "./shapes.js";
import { PAINTINGS, createDecor } from "./decor.js";   // Milestone 21, Part D
import { residentsOf, STRUCT_NAMES } from "./land-structures.js";   // Milestone 23, Part D
import { DISCS, scoreOf } from "./music.js";   // Milestone 22, Part D
import { Entities, SPECIES, TRADES, lineOfSight, tradesOf, levelOf, LEVEL_NAMES } from "./entities.js";
import { KINGDOMS_GEN, LANTERN_VALE_SEED } from "./lantern-vale.js";
import { prepareStonehaven, stonehavenPlacementData } from "./stonehaven.js";
import { GRAND_VILLAGE_GEN, reserveSurveyedVillages, restoreVillageRecords } from "./grand-villages.js";
import { initSettlementFestivals } from "./settlement-festivals.js";
import { settlementChimneys } from "./settlement-life.js";
import { initVillageGrowth } from "./village-growth.js";
import { initVillageRenovation, prepareVillageRenovations } from "./village-renovation.js";
import { initSettlementRaids } from "./settlement-raids.js";
import { idx, Generator, NetherGen, EndGen, ForsakenGen, LOOT, LAVA_LEVEL, CURRENT_GEN, LEGACY_CHUNK_GEN, END_TOP, frameSpots, CITADEL, CITADEL_PYLONS, CITADEL_SPOTS } from "./worldgen.js";
import { World, chunkKey } from "./world.js";
import { buildChunk, doorBox } from "./mesher.js";
import { Player, raycast, blockBoxes, REACH, bubbleColumn } from "./player.js";
import { initFluids, isSource } from "./fluids.js";
import { Inventory, newStack, maxStack, OFF } from "./inventory.js";
import { Sound } from "./audio.js";
import { Saves, newId, loadSettings, saveSettings, SAVE_VERSION } from "./save.js";
import { Adv } from "./advancements.js";
import { FERN_PLAINS, JUNGLE_RETURN } from "./fern-plains.js";
import { GODZILLA_CALDERA, CALDERA_CACHE, calderaSupplies, isGodzillaConsole } from "./godzilla-caldera.js";
import { initGodzillaFight } from "./godzilla-fight.js";
import { VOLCANIC_BADLANDS, badlandsVentActive, updateBadlandsVents } from "./volcanic-badlands.js";
import { TYRANT_CANYON } from "./tyrant-canyon.js";
import { AMBER_CAVERNS, AMBER_ARRIVAL, SEAL, isAmberSeal, SHORTCUT_REQUIRED_STAGE } from "./amber-caverns.js";
import { REDWOODS } from "./redwood-escarpment.js";
import { MANGROVE, RELAY_LIGHT } from "./mangrove-wetlands.js";
import { LOST_WORLD_REGIONS, isLostWorldDimension, isLostWorldRegion } from "./lost-world-regions.js";
import { toggleLostWorldWaypoint } from "./lost-world-map.js";
import { expedition, isCampaignLandmark, readCampaignLandmark } from "./lost-world-campaign.js";
import { LOST_WORLD, LOST_WORLD_GEN, LostWorldGenerator, worldHome } from "./lost-world.js";
import { initForsaken, isQuestItem } from "./forsaken.js";
import { initMutants } from "./mutants.js";
import { initCompanions } from "./companions.js";
import { initLost, LOST_DIMS } from "./lost.js";
import { initMonumentLife } from "./monument-life.js";
import { initCitadel } from "./citadel.js";
import { initCitadelGate } from "./citadel-gate.js";
import { initCitadelKeep } from "./citadel-keep.js";
import { initCitadelDungeon } from "./citadel-dungeon.js";
import { initCitadelBoss } from "./citadel-boss.js";
import { initCitadelAmbience } from "./citadel-ambience.js";
import { initStarter } from "./starter.js";
import { leviathanShrineBearings, sandcallerPreparation } from "./leviathan-navigation.js";
import { initCampaign, CAMPAIGN_SEED, CAMPAIGN_STONEHAVEN_LAYOUT, CAMPAIGN_SANDSPIRE_LAYOUT, CAMPAIGN_OAKWOOD_LAYOUT, CAMPAIGN_SEABREAK_LAYOUT, CAMPAIGN_IRONHOLD_LAYOUT, CAMPAIGN_EMBER_OUTPOST_LAYOUT, CAMPAIGN_HOLLOWMERE_LAYOUT, CAMPAIGN_SKYREACH_LAYOUT, CAMPAIGN_RUINED_CAPITAL_LAYOUT, CAMPAIGN_VILLAGE_LAYOUT } from "./campaign.js";
import { SKINS, skinById, makeModel, dressModel, poseModel, holdItems, disposeModel, firstPersonArm, thumbnail } from "./skins.js";
import { UI } from "./ui.js";
import { rng, hashSeed } from "./noise.js";
import * as EN from "./enchanting.js";
import * as PO from "./potions.js";
import { treeShape, NEEDS_SQUARE } from "./trees.js";
import { SPECIAL_BIOMES, BIOME_NAMES, BIOME_GEN, OCEAN_GEN, SEA_LOOT, seaLootOf } from "./worldgen.js";
import { nextLeviathanStorm, sandstormStage } from "./sandstorm.js";
import { weatherAt, makeSkyColumns, createWeatherView, nextWeather } from "./weather.js";
import { StormActivity, stormCallStatus, stormDaytime, severalHostilesNearby, findDuneApproach, STORM_ACTIVITY_GUIDE } from "./leviathan-storm.js";
import { dunePhase, duneRitualWindow } from "./dune-leviathan.js";
import { DESERT_SITES, RELIC_SITES, SHRINE_INSCRIPTION, buildRelicStamp, citadelArena, citadelCache, citadelTablet, cityCache, cityTablet, observatoryTablet, planRelicSites, relicCache, relicSiteAt, shrineSign } from "./desert-relic-sites.js";
import { OBSIDIAN_BADLANDS_LAYOUT, buildObsidianBadlands, obsidianAshStrength, obsidianChamberEntry } from "./obsidian-badlands.js";
import { OBSIDIAN_VENT_RISE, openObsidianVent, selectObsidianVent, stepObsidianVent } from "./obsidian-vent.js";
import { desertVault, hasDesertVault } from "./desert-vaults.js";
import { SOLKARA_ALTAR, SOLKARA_GATE, SOLKARA_RETURN, SOLKARA_SANCTUARY, SolkaraSanctuaryGen, isSolkaraRealm, SOLKARA_LIBRARY, SOLKARA_MARKS, SOLKARA_MURAL, SOLKARA_ORDER, SOLKARA_SAND_TRAP, SOLKARA_VAULT, SOLKARA_WING_SWITCH, annexFits, atSolkara, buildSolkaraAnnex, buildSolkaraWing, solkaraMarkAt } from "./solkara-annex.js";
import { HOLLOW_SANDS, HollowSandsGen, SANDS_ARRIVAL, SANDS_REGIONS, SANDS_RETURN, SANDS_TABLETS } from "./hollow-sands.js";
import { SANDS_LANDMARK_LAYOUT } from "./hollow-sands-landmarks.js";
import { SOLKARA_SCENERY, SOLKARA_SCENERY_LAYOUT, solkaraSceneryTablet } from "./solkara-scenery.js";
import { makeSolkaraGateView } from "./solkara-gate-view.js";
import { createSolkaraMuralView } from "./solkara-mural-view.js";
import { BURIED_THRONE, THRONE_ALTAR, THRONE_TABLET } from "./buried-throne.js";
import { createAncientSpikes } from "./ancient-spikes.js";
import { ELEPHANT, canRideElephant } from "./wildlife-elephant.js";
import { marineWaterRoom } from "./wildlife-ocean.js";
import { markWildlifeDefeated, observeWildlife } from "./wildlife-journal.js";
import { hasDesertRelic, recordLeviathanDiscovery } from "./leviathan-journal.js";
import { ArenaFractures } from "./arena-fractures.js";
import { solkaraRecordAt } from "./solkara-lore.js";
import { canMountLeviathan, findLeviathanExit, findLeviathanRecovery } from "./leviathan-riding.js";
import { leviathanCameraDistance } from "./leviathan-camera.js";
import { initMultiplayer, MP_PROTOCOL } from "./multiplayer.js";
import { armorShieldState } from "./leviathan-armor-effects.js";
import { createArmorShieldView } from "./leviathan-armor-shield-view.js";
import { weaponSwing } from "./weapon-motion.js";
import { createLeviathanWeaponMesh } from "./leviathan-weapon-view.js";
import { CrystalResonance, crystalSite, findCrystalSite, insideCrystalPulse } from "./crystal-resonance.js";
import { createCrystalResonanceView } from "./crystal-resonance-view.js";
import { findQuicksandSite, insideQuicksand, QuicksandDrag } from "./abyssal-quicksand.js";
import { createQuicksandView } from "./abyssal-quicksand-view.js";
import { HeatExposure, heatSite, findHeatSite, insideHeat } from "./forgotten-heat.js";
import { createHeatView } from "./forgotten-heat-view.js";
import { duneWarningCue } from "./dune-warning.js?v=physical-2";
import { createDuneWarningView } from "./dune-warning-view.js";
import { obsidianWarningCue } from "./obsidian-warning.js";
import { ancientWarningCue, ancientCollapseCues, ancientWarningLoadedKey } from "./ancient-warning.js";
import { createLeviathanWarningHUD, selectLeviathanWarning } from "./leviathan-warning-hud.js";
import { ancientArrivalCues } from "./ancient-arrival.js";
import { createAncientAwakeningView } from "./ancient-awakening-view.js";
import { ancientAwakeningRoll } from "./ancient-tremor.js";
import { createEchoholdAtmosphere } from "./echohold-atmosphere.js";
import { createAncientBuriedController } from "./ancient-buried-view.js";
import { createAncientOpeningController } from "./ancient-opening-view.js";
import { ANCIENT_CIRCLE_SECONDS, ANCIENT_CIRCLE_SETTLE_SECONDS } from "./ancient-circle.js";
import { ancientIntroCue, createAncientIntroView } from "./ancient-intro.js";
import { ancientArenaLoadedKey, createAncientArenaView } from "./ancient-arena-view.js";
import { createAncientFury, ancientFuryCues } from "./ancient-fury.js";
import { ancientCombatPhase, ancientRewardPending, ancientRewardInventory, copyAncientProgress, ANCIENT_VICTORY_XP } from "./ancient-victory.js";
import { createAncientWarningView } from "./ancient-warning-view.js";
import { createObsidianWarningView } from "./obsidian-warning-view.js";
import { planObsidianShrapnel, validObsidianVolley, obsidianVolleyLoadedKey } from "./obsidian-shrapnel.js";
import { OBSIDIAN_OFFERINGS, OBSIDIAN_OFFERING_TEXT, obsidianRiteInReach, obsidianRitualWindow, obsidianEncounterPhase } from "./obsidian-rite.js";
import { DuneDevour, DUNE_DEVOUR_DURATION } from "./dune-devour.js";
import { createDuneDevourView } from "./dune-devour-view.js";
import { DuneSweep, DUNE_SWEEP_DURATION } from "./dune-sweep.js";
import { createDuneSweepView } from "./dune-sweep-view.js";
import { DuneVortex, DUNE_VORTEX_RADIUS, DUNE_VORTEX_DAMAGE, validDuneVortexSite, insideDuneVortex, duneVortexSpeed } from "./dune-vortex.js";
import { createDuneVortexView } from "./dune-vortex-view.js";
import { LEVIATHAN_BONDS, applyBondPreferences, updateBondPreference, thinkBondedLeviathan } from "./leviathan-bonds.js";
import { clearRecallFootprint, planDesertRecall } from "./leviathan-recall.js";
import { beginDuneMountedAttack, createDuneMountedWave } from "./leviathan-mounted-combat.js";
import { beginObsidianMountedAttack, createObsidianMountedEruptions } from "./leviathan-obsidian-mounted.js";
import { beginMountedBurrow } from "./leviathan-mounted-burrow.js";
import { createBurrowView } from "./leviathan-burrow-view.js";
import { initTitleTips } from "./title-tips.js";

import { UHC_MODE, UHC_AIR, UHC_DAY, UHC_SETTINGS, UHC_SKINS, createChallenge,
  advanceChallenge, challengeDay, bloodMoon, hunterLevel, failChallenge, survivalMaximum } from "./ultra-hardcore.js";
import { challengeCue, challengeHUD, challengeTime } from "./ultra-hardcore-view.js";

THREE.ColorManagement.enabled = false;
const DAY_LENGTH = 720;          // seconds for a full day and night (12 minutes)
const AUTOSAVE = 60, UHC_AUTOSAVE = 12;

// ---------- 3D setup ----------
const canvas = document.getElementById("view");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
} catch (e) {
  document.body.innerHTML = `<div style="padding:30px;font:18px system-ui;color:#fff;background:#222;height:100%">Sorry! This browser couldn't start 3D graphics, which Blockhaven needs. Try Chrome or Edge, and make sure "hardware acceleration" is turned on. <p><a style="color:#9f9" href="../../../arcade/index.html">← Back to the Arcade</a></p></div>`;
  throw e;
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 200);
scene.add(camera);

const atlasTex = new THREE.CanvasTexture(buildAtlas());
atlasTex.magFilter = THREE.NearestFilter; atlasTex.minFilter = THREE.NearestFilter; atlasTex.generateMipmaps = false;

const uniforms = { map: { value: atlasTex }, desat: { value: 0 }, daylight: { value: 1 }, ambient: { value: 0.11 }, fogColor: { value: new THREE.Color(0x8fd0f5) }, fogNear: { value: 40 }, fogFar: { value: 64 }, alphaTest: { value: 0.5 }, opacity: { value: 1 },
  moonlight: { value: 0 }, coolTime: { value: 0 }, coolPulse: { value: 0.18 } };   // Echohold Reborn: teal light and its slow pulse (0 = still)
const VERT = `attribute vec3 lt; attribute float cl; varying vec2 vUv; varying vec3 vLt; varying float vDist, vCl; varying vec2 vW;
void main() { vUv = uv; vLt = lt; vCl = cl; vW = (modelMatrix * vec4(position, 1.0)).xz; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FRAG = `uniform sampler2D map; uniform float daylight, ambient, fogNear, fogFar, alphaTest, opacity, desat, moonlight, coolTime, coolPulse; uniform vec3 fogColor;
#ifdef RIPPLE_WATER
uniform float rippleTime;
const vec2 waterTile = vec2(${TILE.water % 16}.0, ${Math.floor(TILE.water / 16)}.0);
const vec2 atlasPixels = vec2(${ATLAS_W}.0, ${ATLAS_H}.0);
#endif
varying vec2 vUv; varying vec3 vLt; varying float vDist, vCl; varying vec2 vW;
void main() {
  vec2 uv = vUv;
#ifdef RIPPLE_WATER
  vec2 pixel = vec2(uv.x, 1.0 - uv.y) * atlasPixels;
  if (all(equal(floor(pixel / 16.0), waterTile))) {
    // Sample pixel centers after wrapping so nearby portal tiles never bleed into the water.
    vec2 offset = vec2(floor(rippleTime * 4.0), floor(rippleTime * 2.0));
    vec2 samplePixel = waterTile * 16.0 + mod(floor(pixel) + offset, 16.0) + 0.5;
    uv = vec2(samplePixel.x / atlasPixels.x, 1.0 - samplePixel.y / atlasPixels.y);
  }
#endif
  vec4 t = texture2D(map, uv);
  if (t.a < alphaTest) discard;
  float s = vLt.x * daylight, b = vLt.y;
  // cool teal light (Echohold's moss, crystals, and gate stones) rolls across the floor in slow waves
  float c = vCl * (1.0 + coolPulse * sin(coolTime * 1.3 - vW.x * 0.09 - vW.y * 0.07));
  // teal glow reads a little brighter than torchlight of the same level, so moss and crystals stand out in the dark
  float l = max(pow(max(s, b), 1.5), c * 0.92);
  l = ambient + (1.0 - ambient) * l;
  vec3 tint = mix(vec3(1.0), vec3(1.0, 0.85, 0.62), clamp((b - max(s, c)) * 1.5, 0.0, 1.0));
  tint = mix(tint, vec3(0.42, 0.92, 1.05), clamp((c - max(s, b * 0.8)) * 1.8, 0.0, 1.0));
  tint = mix(tint, tint * vec3(1.21, 0.54, 0.61), moonlight * clamp(vLt.x - b * 0.62, 0.0, 1.0));
  vec3 col = t.rgb * l * vLt.z * tint;
  col = mix(col, vec3(dot(col, vec3(0.3, 0.59, 0.11))), desat);
  col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDist));
  gl_FragColor = vec4(col, t.a * opacity);
}`;
const solidMat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
const waterUniforms = { ...uniforms, alphaTest: { value: 0.01 }, rippleTime: { value: 0 } };
const waterMat = new THREE.ShaderMaterial({ uniforms: waterUniforms, defines: { RIPPLE_WATER: 1 }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });

// One background mesh draws both the Surface gradient and its distant, grid-shaped clouds.
const surfaceSky = new THREE.Mesh(new THREE.SphereGeometry(105, 16, 8), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthTest: false, depthWrite: false,
  uniforms: { horizon: { value: new THREE.Color() }, zenith: { value: new THREE.Color() }, cloudLight: { value: 0 }, cloudDrift: { value: 0 } },
  vertexShader: `varying vec3 vRay;
    void main() {
      vRay = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `uniform vec3 horizon, zenith;
    uniform float cloudLight, cloudDrift;
    varying vec3 vRay;
    float cloudCell(vec2 p) {
      vec3 h = fract(vec3(p.xyx) * 0.1031);
      h += dot(h, h.yzx + 33.33);
      return fract((h.x + h.y) * h.z);
    }
    void main() {
      vec3 ray = normalize(vRay);
      vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.78, ray.y));
      if (ray.y > 0.055 && cameraPosition.y < 108.0) {
        float distanceToCloud = (108.0 - cameraPosition.y) / ray.y;
        vec2 tile = floor((cameraPosition.xz + ray.xz * distanceToCloud + vec2(cloudDrift, 0.0)) / vec2(14.0, 9.0));
        float shape = step(0.55, cloudCell(floor(tile / vec2(5.0, 3.0))) * 0.82 + cloudCell(tile) * 0.18);
        float fade = (1.0 - smoothstep(85.0, 240.0, distanceToCloud)) * smoothstep(0.055, 0.19, ray.y);
        vec3 cloud = mix(vec3(0.31, 0.37, 0.53), vec3(0.99, 0.99, 0.98), cloudLight);
        color = mix(color, cloud, shape * fade * 0.86);
      }
      gl_FragColor = vec4(color, 1.0);
    }`
}));
surfaceSky.visible = false;
surfaceSky.renderOrder = -10;
scene.add(surfaceSky);

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
    for (let k = 0; k < 4; k++) { const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i); uv.setXY(i, (tx + 0.02 + u * 15.96) / ATLAS_W, 1 - (ty + 0.02 + (1 - v) * 15.96) / ATLAS_H); }
  }
  uv.needsUpdate = true;
}
const BOX_FACE_DIR = [1, 1, 0, 2, 1, 1];   // BoxGeometry face order +x −x +y −y +z −z → top/side/bottom
const BOX_FRONT = 4;

// particles
const PMAX = 240, pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), parts = [];
const freeParticles = Array.from({ length: PMAX }, () =>
  ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, r: 0, g: 0, b: 0, floaty: false }));
function emitParticle(x, y, z, vx, vy, vz, life, color, floaty = false, jitter = false) {
  const q = freeParticles.length ? freeParticles.pop() : parts.shift();
  q.x = x; q.y = y; q.z = z;
  q.vx = vx; q.vy = vy; q.vz = vz;
  q.life = life; q.floaty = floaty;
  q.r = color[0] * (jitter ? 0.75 + Math.random() * 0.4 : 1);
  q.g = color[1] * (jitter ? 0.75 + Math.random() * 0.4 : 1);
  q.b = color[2] * (jitter ? 0.75 + Math.random() * 0.4 : 1);
  parts.push(q);
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setDrawRange(0, 0);
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true }));
particles.frustumCulled = false; scene.add(particles);
let echoholdAtmosphere = null;   // Echohold Reborn: spores, drips, glow halos (made on the first frame, once G exists)
const tileColor = (() => {
  const atlas = buildAtlas(), data = atlas.getContext("2d").getImageData(0, 0, ATLAS_W, ATLAS_H).data, cache = {};
  return t => {
    if (cache[t]) return cache[t];
    let r = 0, g = 0, b = 0, n = 0; const tx = (t % 16) * 16, ty = Math.floor(t / 16) * 16;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const i = ((ty + y) * ATLAS_W + tx + x) * 4; if (data[i + 3] > 100) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; } }
    return (cache[t] = n ? [r / n / 255, g / n / 255, b / n / 255] : [0.5, 0.5, 0.5]);
  };
})();
function burst(x, y, z, v, count = 14) {
  const col = tileColor(faceTile(v, 1));
  for (let i = 0; i < count; i++) {
    emitParticle(x + Math.random(), y + Math.random(), z + Math.random(),
      (Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3,
      0.5 + Math.random() * 0.4, col, false, true);
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
// a shield is a thin board with the shield picture on its face
const shieldGeo = new THREE.BoxGeometry(0.14, 0.19, 0.018);
function shieldMesh() {
  const face = new THREE.MeshBasicMaterial({ map: itemTexture(I.SHIELD), color: 0xffffff, alphaTest: 0.5 }), edge = new THREE.MeshBasicMaterial({ color: 0x8a5e32 });
  face.userData.base = 1; edge.userData.base = 0x8a5e32;
  const m = new THREE.Mesh(shieldGeo, [edge, edge, edge, edge, face, face]);
  m.userData.shared = true; m.userData.multi = true;
  return m;
}
function itemMesh(id, size) {
  const d = BLOCKS[id];
  const legendary = id === I.FANGBLADE ? "fang" : id === I.INFERNO_GREATBLADE ? "inferno" : id === I.BURIED_SCEPTER ? "scepter" : null;
  if (legendary) return createLeviathanWeaponMesh(legendary, size);
  if (id === I.SHIELD) return shieldMesh();
  if (isBlockItem(id) && d.shape === "cube") return new THREE.Mesh(blockGeometry(id, size), new THREE.MeshBasicMaterial({ map: atlasTex, transparent: d.render !== "opaque", alphaTest: 0.5 }));
  return new THREE.Mesh(new THREE.PlaneGeometry(size * 1.5, size * 1.5), new THREE.MeshBasicMaterial({ map: itemTexture(id), alphaTest: 0.5, side: THREE.DoubleSide }));
}
const mats = m => Array.isArray(m.material) ? m.material : [m.material];
function disposeItemMesh(m) { if (!m.userData.shared) m.geometry.dispose(); for (const x of mats(m)) x.dispose(); }
function prepHandMesh(m) { m.renderOrder = 10; for (const x of mats(m)) { x.depthTest = false; x.fog = false; } }
// darken a held item in the shade (materials with a base color keep their hue)
function lightItem(m, bright) { for (const x of mats(m)) { if (typeof x.userData.base === "number" && x.userData.base > 1) x.color.setHex(x.userData.base).multiplyScalar(bright); else x.color.setScalar(bright); } }
const offHand = new THREE.Group(); camera.add(offHand);   // the offhand item, lower left
let heldId = -1, heldMesh = null, offId = -1, offMesh = null;
function updateHeld(bright) {
  const s = G.inv.slots[G.selected], id = s ? s.id : 0;
  if (id !== heldId) {
    if (heldMesh) { hand.remove(heldMesh); disposeItemMesh(heldMesh); }
    heldId = id;
    if (id) { heldMesh = itemMesh(id, 0.15); heldMesh.userData.shared = heldMesh.userData.shared || heldMesh.geometry.type !== "PlaneGeometry"; }
    else { heldMesh = firstPersonArm(G.settings.skin); heldMesh.userData.shared = true; heldMesh.userData.arm = true; }   // your bare arm matches your skin
    prepHandMesh(heldMesh);
    hand.add(heldMesh);
  }
  const o = G.inv.slots[OFF], oid = o ? o.id : 0;
  if (oid !== offId) {
    if (offMesh) { offHand.remove(offMesh); disposeItemMesh(offMesh); offMesh = null; }
    offId = oid;
    if (oid) { offMesh = itemMesh(oid, 0.13); offMesh.userData.shared = offMesh.userData.shared || offMesh.geometry.type !== "PlaneGeometry"; prepHandMesh(offMesh); offHand.add(offMesh); }
  }
  hand.visible = offHand.visible = !G.spectator && !G.thirdPerson;
  const heavy = !!itemDef(id)?.tool?.heavy;
  const sw = weaponSwing(G.swing, heavy, G.settings.reducedMotion);
  const bob = G.settings.reducedMotion ? 0 : Math.sin(G.walkPhase * 2) * 0.012;
  const eating = G.eat && G.eat.slot === G.selected ? Math.min(1, G.eat.t * 4) : 0, chew = G.eat ? Math.sin(G.eat.t * 22) * 0.015 : 0;
  hand.position.set(0.4 - sw * 0.08 - eating * 0.3, -0.36 + bob - sw * 0.06 + eating * 0.12 + (eating ? chew : 0), -0.62 - sw * 0.06);
  hand.rotation.set(-sw * (heavy ? 1.15 : 0.9), 0.5, heavy ? sw * 0.2 : 0);
  if (heldMesh.userData.arm) heldMesh.rotation.set(-Math.PI / 2 + 0.25, 0.15, 0.1);
  else if (heldMesh.userData.legendaryWeapon) heldMesh.rotation.set(-0.2, -0.25, Math.PI / 4);
  else if (heldMesh.userData.multi) heldMesh.rotation.set(0, -0.3, 0); else if (heldMesh.geometry.type === "PlaneGeometry") heldMesh.rotation.set(0, -0.6, 0.3); else heldMesh.rotation.set(0.1, 0.3, 0);
  lightItem(heldMesh, bright);
  // offhand: lower left; a raised shield moves in front of you
  const up = G.blocking && G.blockHand === OFF ? 1 : 0, offEat = G.eat && G.eat.slot === OFF ? Math.min(1, G.eat.t * 4) : 0;
  offHand.position.set(-0.42 + up * 0.22 + offEat * 0.3, -0.37 + bob + up * 0.12 + offEat * 0.12 + (offEat ? chew : 0), -0.7 + up * 0.08);
  offHand.rotation.set(0, -0.5 + up * 0.45, 0);
  if (offMesh) { if (offMesh.userData.legendaryWeapon) { offMesh.scale.x = -1; offMesh.rotation.set(-0.2, 0.25, -Math.PI / 4); } else if (offMesh.userData.multi) offMesh.rotation.set(0, 0.3, 0); else if (offMesh.geometry.type === "PlaneGeometry") offMesh.rotation.set(0, 0.6, -0.3); else offMesh.rotation.set(0.1, -0.3, 0); lightItem(offMesh, bright); }
  if (G.blocking && G.blockHand === G.selected) { hand.position.x -= 0.18; hand.position.y += 0.1; hand.rotation.y = 0.05; }
}

// ---------- game state ----------
const G = {
  state: "title",        // title | loading | play | pause | panel | dead
  settings: loadSettings(),
  world: null, gen: null, player: new Player(), inv: new Inventory(), meta: null, mode: "survival",
  time: 0.02, selected: 0, swing: 0, walkPhase: 0, stepDist: 0, drops: [], tips: {}, hudDirty: true,
  mining: null, useCooldown: 0, lastSpace: 0, playedSince: 0, autosaveT: 0, debug: false,
  xp: 0, effects: {}, bowT: -1, attackCd: 0, orbs: [], worlds: {}, dim: "overworld", dimData: {},
  wset: { difficulty: "easy", griefing: true, keepInv: true, fireSpread: true, liquidFlow: true, weather: true },
  voidInv: new Array(27).fill(null),   // personal Void Chest storage (the same in every Void Chest and every dimension)
  elv: {}, absorb: 0, totemGuard: 0, eat: null, blocking: false, useHand: null, stats: {},
  armColor: [0.85, 0.65, 0.49],   // the bare first-person arm color (follows the chosen skin)
  get creative() { return this.mode === "creative"; },
  get spectator() { return this.mode === "spectator"; },
  get useSlot() { return this.useHand ?? this.selected; }   // the hand being used right now: the main hand unless the offhand is acting
};
G.adv = (type, arg) => { Adv.event(type, arg); if (G.campaign) G.campaign.event(type, arg); };
const festivals = G.festivals = initSettlementFestivals({ THREE, scene, G, UI, Sound });
let villageSmokeT = 0;
G.villageGrowth = initVillageGrowth({ G, UI, Sound });
// Milestone 16: Phantoms drop Phantom Membrane (for Slow Falling potions), like Java
// Witches drop brewing things (Java: bottles, sugar, Skitter eyes, Shinestone dust, Sparkdust, Boom Powder, sticks)
if (SPECIES.witch) SPECIES.witch.drops = () => [[[I.BOTTLE, I.SUGAR, I.SPIDER_EYE, I.SHINE_DUST, I.SPARKDUST, I.BOOM_POWDER, I.STICK][Math.floor(Math.random() * 7)], 1 + Math.floor(Math.random() * 3)]];
if (SPECIES.phantom) SPECIES.phantom.drops = () => [[I.PHANTOM_MEMBRANE, Math.floor(Math.random() * 2)]];
const raids = G.settlementRaids = initSettlementRaids({ G, UI, Sound, SPECIES, hud: document.getElementById("settlementRaidHud"), closePanel });
G.villageRenovation = initVillageRenovation({ G, UI });
window.__bh = G;   // handy for testing in the browser console

// ---------- creatures ----------
const guestFocus = () => ents.focus && ents.focus.mpId ? ents.focus : null;   // Play Together: a creature is busy with a visiting friend
const ents = new Entities(scene, {
  ultra: () => G.dim === "overworld" ? G.meta?.ultra : null,
  ultraNoise: () => G.challengeNoise && G.challengeNoise.until >= G.meta?.ultra?.elapsed ? G.challengeNoise : null,
  ultraBreach: breachDefense,
  world: () => G.world, player: () => ents.focus || G.player, settings: () => G.wset,
  creative: () => guestFocus() ? G.creative : G.creative || G.spectator, alive: () => guestFocus() ? !guestFocus().mpDead : G.state !== "dead",
  wildlifeDefeated: e => {
    if (guestFocus() || !wildlifeJournalActive()) return;
    reportWildlifeDiscovery(markWildlifeDefeated(G.story, e, G.meta.day));
  },
  channeling: e => channelOnto(e),
  inRain: (x, y, z) => G.wx.rain > 0.4 && skyCols.rainedOn(x, y, z),   // Milestone 19: rain puts out burning creatures
  desertContext: () => ({ dim: G.dim, storm: G.creative && creativeStormUntil > G.clock ? 0 : stormStage, sites: G.story.leviathan?.sites }),
  reducedMotion: () => G.settings.reducedMotion,
  scarabVaultDefeated: e => {
    if (scarabVaultGuards?.includes(e)) checkpointScarabVaultVictory();
  },
  desertVaultDefeated: checkpointDesertVaultVictory,
  companionChanged: e => checkpointAncientCompanion(e),
  leviathanThink: (e, multiplier) => {
    if (e.duneCycle?.preview) {
      const p = G.player.pos;
      if (!G.creative || Math.hypot(p.x - e.pos.x, p.z - e.pos.z) > 52) e.gone = true;
    } else if (e.sp === "leviathan_ancient") thinkAncient(e, multiplier);
    else if (e.sp === "leviathan_obsidian") thinkObsidian(e, multiplier);
    else thinkDune(e, multiplier);
  },
  leviathanDamaged: e => {
    if (e.sp === "leviathan_ancient") { damageAncient(e); return; }
    if (e.sp === "leviathan_obsidian") { damageObsidian(e); return; }
    const record = G.story.leviathan.dune;
    if (e.tame) {
      record.hp = Math.max(1, e.hp);
      if (e.hp <= 0) {
        e.hp = 1; e.gone = true;
        UI.toast("Your wounded Leviathan retreats beneath the sand.");
      }
      saveNow(false);
      return;
    }
    e.duneCycle.ritualMarks = 0;
    e.duneCycle.ritualUsed = true;
    const phase = dunePhase(record.hp, e.maxHp);
    record.hp = Math.max(0, e.hp);
    if (e.hp <= 0) {
      record.defeated = true;
      const s = e.duneCycle.site;
      spawnOrbs(160, s.x, s.y + 0.5, s.z);
      spawnDrop(I.LEVIATHAN_SCALE, 6, s.x, s.y + 0.5, s.z);
      spawnDrop(I.LEVIATHAN_FANG, 1, s.x, s.y + 0.5, s.z);
      saveNow(false);
    } else if (dunePhase(record.hp, e.maxHp) !== phase) {
      saveNow(false);
    }
  },
  hurtPlayer: (n, why, src, kind) => guestFocus() ? MP.hurtGuest(guestFocus(), n, why, src, kind) : hurt(n, why, src, false, kind),
  effect: (k, t) => guestFocus() ? MP.effectGuest(guestFocus(), k, t) : addEffect(k, t),
  explode: (x, y, z, power, src) => explode(x, y, z, power, src),
  drop: (id, n, x, y, z, stack) => spawnDrop(id, n, x, y, z, stack),
  // minecarts (Part D): a rider pressing W pushes the cart; right-click does what each cart is for
  cartInput: () => G.state === "play" && keys.has("KeyW") ? (d => [d.x, d.z])(lookDir()) : null,
  crouching: () => keys.has("KeyC"),
  closeElephantCargo: e => { if (G.panelCtx === "cart:" + e.uid) closePanel(); },
  useCart: (e, slot) => useCart(e, slot), openCart: e => openCart(e), ejectCart: e => { if (e.mpRider) MP.ejectGuest(e); else if (G.riding === e) dismount(); },
  cartPull: e => R.cartPull(e), xp: (n, x, y, z) => guestFocus() ? MP.xpGuest(guestFocus(), n) : spawnOrbs(n, x, y, z),
  particles: (x, y, z, kind) => puff(x, y, z, kind), lookDir: () => lookDir(),
  // the item in the hand being used (main hand first; an empty main hand shows the offhand item)
  heldId: () => (G.inv.slots[G.useSlot] || G.inv.slots[OFF] || {}).id || 0,
  itemFlag: flag => { const it = G.inv.slots[G.selected]; return !!(it && itemDef(it.id) && itemDef(it.id)[flag]); },   // the main-hand item has this flag (Sentinel Hammer: breaksGuard)
  holds: id => [G.selected, OFF].some(i => G.inv.slots[i] && G.inv.slots[i].id === id),
  consume: () => { const s = G.inv.slots[G.useSlot]; if (s && !G.creative) { s.n--; if (!s.n) G.inv.slots[G.useSlot] = null; } G.hudDirty = true; heldId = -1; },
  wear: () => { const s = G.inv.slots[G.useSlot]; if (s) wearTool(s, 1); },
  adv: (type, arg) => {
    if (guestFocus()) return;
    if (G.meta?.ultra && type === "kill") G.stats.kills = (G.stats.kills || 0) + 1;
    G.adv(type, arg);
  }, talk: e => !!(G.campaign && G.campaign.talk(e)),
  giveStack: st => { if (G.inv.add(st.id, 1, st)) spawnDrop(st.id, 1, G.player.pos.x, G.player.pos.y + 0.5, G.player.pos.z, st); else { Sound.pickup(); G.hudDirty = true; } },   // Milestone 17
  swapHeld: id => swapHeld(id), give: (id, n) => guestFocus() ? MP.giveGuest(guestFocus(), id, n) : G.inv.add(id, n) === 0 ? (G.hudDirty = true, Sound.pickup(), true) : false,
  invisible: () => G.effects.invis ? [36, 37, 38, 39].filter(i => G.inv.slots[i]).length : -1,   // Milestone 16: -1 = seen; else how many armor pieces give you away
  wearingGold: () => [36, 37, 38, 39].some(i => G.inv.slots[i] && [I.GOLD_HELMET, I.GOLD_CHEST, I.GOLD_LEGS, I.GOLD_BOOTS].includes(G.inv.slots[i].id)),
  ignite: (x, y, z) => ignite(x, y, z),
  endTop: () => (G.gen.land ? (G.gen.land(0, 0) || { top: END_TOP }).top : END_TOP),
  cloud: (x, y, z) => addCloud(x, y, z),
  potionBurst: (x, y, z, st, owner, direct) => potionBurst(x, y, z, st, owner, direct),   // Milestone 16
  tipHit: (e, key) => potionOnCreature(e, { id: I.POTION, n: 1, pot: key }, 0.125, "player", true),
  playerEffect: k => !!G.effects[k],
  crystalGone: i => { if (typeof i === "string") return placedCrystalGone(i); const d = G.dimData.end || (G.dimData.end = {}); (d.crystalsGone = d.crystalsGone || []).push(i); },
  bossLeft: e => { (G.dimData.end || (G.dimData.end = {})).wyrmHp = e.hp; },
  godzillaDamage: (e, n) => GC.incomingDamage(e, n),
  godzillaDamaged: e => GC.damaged(e),
  bossDefeated: e => e.def.segmentedLeviathan ? UI.toast(`The ${e.def.name} is defeated!`, "good") : (G.campaign && G.campaign.bossDefeated(e)) ? null : L.bossDefeated(e) ? null : e.sp === "dragon" ? wyrmDefeated(e) : e.sp === "cindermaw" ? cinderDefeated(e) : blightDefeated(e),
  arena: () => arena(), cinderPylons: () => G.cinderPylons(),
  heroHit: (e, n) => F.heroHit(e, n), warded: (x, z) => F.warded(x, z),
  lantern: () => [G.selected, OFF].some(i => G.inv.slots[i] && G.inv.slots[i].id === I.WARD_LANTERN),
  pylonGone: i => { const c = cinderData(); if (!c.pylonsGone.includes(i)) c.pylonsGone.push(i); const left = CITADEL_PYLONS.length - c.pylonsGone.length; UI.toast(left ? `Ember Pylon broken! ${left} left.` : "All the Ember Pylons are broken! Cindermaw's shield is gone.", "good"); },
  push: (vx, vy, vz) => { if (guestFocus()) { MP.pushGuest(guestFocus(), vx, vy, vz); return; } const p = G.player; if (G.creative || G.spectator) return; p.vel.x += vx; p.vel.y = Math.max(p.vel.y, vy); p.vel.z += vz; },
  time: () => G.time, day: () => G.meta.day || 1, toast: m => UI.toast(m), story: () => G.story,
  villagerZombified: v => { if (Math.hypot(v.pos.x - G.player.pos.x, v.pos.z - G.player.pos.z) < 32) UI.toast("A zombie turned a villager into a zombie villager! You can cure it: Splash Potion of Weakness, then a Golden Apple.", "bad"); },   // Milestone 23, Part C
  villagerCured: n => { UI.toast("The villager is cured! It thanks you with half-price trades.", "good"); G.adv("cure"); },
  captainDefeated: e => { if (G.creative) return; addEffect("badOmen", 6000); UI.toast("You defeated the Pillager Captain and got Bad Omen! If you walk into a village, raiders will come.", "bad"); G.adv("captain"); },   // Milestone 23, Part D
  villagerBorn: kid => { if (kid && Math.hypot(kid.pos.x - G.player.pos.x, kid.pos.z - G.player.pos.z) < 24) UI.toast("A baby villager was born!", "good"); G.adv("villagerBaby"); },   // Milestone 23, Part B
  openTrade: e => { if (e.sp === "villager") { UI.toast("This villager has no job yet. Place a job block near it: a Composter, Smoker, Blast Furnace, Barrel, Stonecutter, Lectern, Loom…"); return; } openPanel("trade", e.uid); },   // Milestone 23
  settlementRaiderDefeated: e => raids.defeated(e),
  festivalGathering: e => festivals.gatheringPoint(e),
  mount: e => mount(e), riding: () => !!G.riding, boating: () => !!(G.riding && G.riding.def.boat),
  itemMesh: (id, size) => itemMesh(id, size),
  hitBlock: (pr, bx, by, bz, x, y, z) => { R.projectileHit(pr, bx, by, bz, x, y, z); R.vibrate(x, y, z, 2); },
  // Pouncers pick up food lying on the ground
  droppedItems: () => G.drops,
  nearDrop: (pos, r) => G.drops.find(d => d.pickDelay <= 0 && itemDef(d.id).kind === "food" && Math.abs(d.y - pos.y) < 1.5 && Math.hypot(d.x - pos.x, d.z - pos.z) < r),
  takeDrop: d => { d.n--; if (d.n <= 0) { removeDrop(d); G.drops.splice(G.drops.indexOf(d), 1); } return d.id; },
  pearlLand: (x, y, z) => { const p = G.player; if (!G.world.isLoaded(x, z)) return; p.pos.x = x; p.pos.y = y; p.pos.z = z; p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; puff(x, y + 1, z, "void"); Sound.mob("teleport", 0); hurt(2, "Void Pearls sting a little when you land.", null); }
});
G.ents = ents;
const PUFF_COLORS = { poison: [0.35, 0.65, 0.2], hush: [0.35, 0.95, 0.9], spark: [1, 0.32, 0.1], poof: [0.85, 0.85, 0.85], heart: [1, 0.35, 0.45], void: [0.75, 0.3, 0.95], fire: [1, 0.55, 0.15], xp: [0.5, 1, 0.3], ember: [1, 0.45, 0.1], ash: [0.45, 0.4, 0.4], portal: [0.7, 0.35, 1], ink: [0.06, 0.06, 0.1], splash: [0.65, 0.8, 1], pale: [0.88, 0.94, 1], crumb: [0.85, 0.7, 0.45], totem: [1, 0.85, 0.25], totemGreen: [0.4, 0.95, 0.5] };
// a musical note floating up from a note block, colored by its pitch (green → red → blue → green, like a color wheel)
function noteFx(x, y, z, pitch) {
  const h = pitch / 24, c = [Math.max(0, Math.sin((h + 0.0) * Math.PI * 2) * 0.5 + 0.5), Math.max(0, Math.sin((h + 0.33) * Math.PI * 2) * 0.5 + 0.5), Math.max(0, Math.sin((h + 0.66) * Math.PI * 2) * 0.5 + 0.5)];
  for (let i = 0; i < 4; i++) emitParticle(x + (Math.random() - 0.5) * 0.15, y + i * 0.05,
    z + (Math.random() - 0.5) * 0.15, 0, 0.9, 0, 0.7, c, true);
}
// which of the 4 directions (0 +z, 1 +x, 2 −z, 3 −x) the player is looking along
// 6-way version for pistons and observers: 0 up, 1 down, 2-5 the 4 sides
// right-clicking a minecart
function useCart(e, slot) {
  const id = slot ? slot.id : 0;
  if (e.sp === "minecart") return mount(e);
  if (e.sp === "chest_cart" || e.sp === "hopper_cart") { openCart(e); return true; }
  if (e.sp === "furnace_cart") {
    if (id === I.COAL) {   // 1 coal = 3 minutes of pushing, away from you
      e.fuel = Math.min(e.fuel + 180, 180 * 32); const dx = e.pos.x - G.player.pos.x, dz = e.pos.z - G.player.pos.z, l = Math.hypot(dx, dz) || 1;
      e.pushX = dx / l; e.pushZ = dz / l;
      if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
      puff(e.pos.x, e.pos.y + 1, e.pos.z, "ash"); G.hudDirty = true; heldId = -1; return true;
    }
    UI.toast("Feed it coal to make it chug along (away from you).");
    return true;
  }
  if (e.sp === "tnt_cart") {
    if (id === I.FLINT_STEEL && !e.fuseT) { e.fuseT = 4; Sound.mob("fuse", 0); wearTool(slot, 1); return true; }
    return false;
  }
  return false;
}
// a chest minecart, hopper minecart, or chest boat opens like a chest (its storage travels with it)
function openCart(e) {
  if (!e.inv) return false;
  const k = "cart:" + e.uid;
  if (e.sp === ELEPHANT) e.inv.label = "Elephant Cargo";
  G.world.containers.set(k, e.inv);
  Sound.door(true); R.vibrate(e.pos.x, e.pos.y + 0.5, e.pos.z, 11);
  openPanel(e.sp === "hopper_cart" ? "machine" : "chest", k);
  return true;
}
function lookFacing3() { const d = lookDir(); return Math.abs(d.y) > Math.max(Math.abs(d.x), Math.abs(d.z)) ? (d.y > 0 ? 0 : 1) : 2 + lookFacing(); }
// Blocks sliding out of a piston: drawn as their own little cubes for the 0.1 s the move takes
const movers = [];
function moveFx(cells, dir, dur) {
  for (const c of cells) {
    const id = idOf(c.v), d = BLOCKS[id], g = new THREE.BoxGeometry(1, 1, 1);
    setBoxUV(g, f => faceTile(c.v, BOX_FACE_DIR[f], d.front && f === BOX_FRONT));
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: atlasTex, transparent: d.render === "water", alphaTest: 0.1 }));
    mesh.material.color.setScalar(0.85);
    mesh.position.set(c.x + 0.5, c.y + 0.5, c.z + 0.5); scene.add(mesh);
    movers.push({ mesh, x: c.x + 0.5, y: c.y + 0.5, z: c.z + 0.5, dir, t0: G.clock, dur });
  }
}
function updateMovers() {
  for (let i = movers.length - 1; i >= 0; i--) {
    const m = movers[i], k = Math.min(1, (G.clock - m.t0) / m.dur);
    m.mesh.position.set(m.x + m.dir[0] * k, m.y + m.dir[1] * k, m.z + m.dir[2] * k);
    if (G.clock - m.t0 > m.dur + 0.12) { scene.remove(m.mesh); m.mesh.geometry.dispose(); m.mesh.material.dispose(); movers.splice(i, 1); }
  }
}
// Players and creatures in the way get shoved along; a Gloop Block launches whoever stands on it; a Honey Block carries them
function pushEntities(cells, dir) {
  const bodies = [];
  if (!G.spectator) bodies.push({ pos: G.player.pos, vel: G.player.vel, w: 0.6, h: G.player.height, player: true });
  for (const e of ents.list) if (!e.dead && !e.gone) bodies.push({ pos: e.pos, vel: e.vel, w: e.w, h: e.h });
  for (const b of bodies) {
    const a = [b.pos.x - b.w / 2, b.pos.y, b.pos.z - b.w / 2, b.pos.x + b.w / 2, b.pos.y + b.h, b.pos.z + b.w / 2];
    let push = false, launch = false, ride = false;
    for (const c of cells) {
      const dx = c.x + dir[0], dy = c.y + dir[1], dz = c.z + dir[2], id = idOf(c.v);
      const overXZ = a[0] < Math.max(c.x, dx) + 1 && a[3] > Math.min(c.x, dx) && a[2] < Math.max(c.z, dz) + 1 && a[5] > Math.min(c.z, dz);
      if (overXZ && a[1] < Math.max(c.y, dy) + 1 && a[4] > Math.min(c.y, dy)) push = true;
      const onTop = a[0] < c.x + 1 && a[3] > c.x && a[2] < c.z + 1 && a[5] > c.z && Math.abs(a[1] - (c.y + 1)) < 0.3;
      if (onTop && id === B.GLOOP_BLOCK) launch = true;
      if (onTop && id === B.HONEY_BLOCK) ride = true;
    }
    if (push || ride) { b.pos.x += dir[0]; b.pos.y += Math.max(0, dir[1]) + (push && dir[1] === 0 ? 0 : 0); b.pos.z += dir[2]; if (dir[1] < 0 && ride) b.pos.y += dir[1]; }
    if (launch) { if (dir[1] > 0) b.vel.y = 14; else { b.vel.x += dir[0] * 9; b.vel.z += dir[2] * 9; b.vel.y = Math.max(b.vel.y, 4); } if (b.player) G.player.airTop = null; }
  }
}
function lookFacing() { const d = lookDir(); return Math.abs(d.x) > Math.abs(d.z) ? (d.x > 0 ? 1 : 3) : (d.z > 0 ? 0 : 2); }
function puff(x, y, z, kind) {
  if (kind === "whalespout") {
    for (let j = 0; j < 10; j++) {
      const angle = Math.random() * Math.PI * 2, scatter = Math.random() * 0.55;
      emitParticle(x, y, z, Math.cos(angle) * scatter, 2.6 + Math.random() * 2.1,
        Math.sin(angle) * scatter, 0.7 + Math.random() * 0.35, PUFF_COLORS.splash, true);
    }
    return;
  }
  const c = PUFF_COLORS[kind] || [1, 1, 1], n = kind === "heart" ? 6 : kind === "spark" ? 3 : 14;
  for (let i = 0; i < n; i++) emitParticle(x + (Math.random() - 0.5) * 0.8, y + Math.random() * 0.6,
    z + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 2, kind === "heart" ? 1.5 : Math.random() * 2,
    (Math.random() - 0.5) * 2, 0.6 + Math.random() * 0.4, c, true);
}
// Like swapHeld, but for a whole stack (a potion keeps what's in it)
function swapHeldStack(st) {
  const s = G.inv.slots[G.useSlot];
  if (s && s.n > 1) { s.n--; if (G.inv.add(st.id, 1, st)) G.dropItem(st.id, 1, st); }
  else G.inv.slots[G.useSlot] = st;
  G.hudDirty = true; heldId = -1;
}
function swapHeld(id) {
  const s = G.inv.slots[G.useSlot];
  if (s && s.n > 1) { s.n--; if (G.inv.add(id, 1)) G.dropItem(id, 1); }
  else G.inv.slots[G.useSlot] = newStack(id, 1);
  G.hudDirty = true; heldId = -1;
}

// ---------- status effects (poison, queasy, burning) ----------
// Each effect has seconds left (G.effects) and a strength (G.elv, 1 when not set)
function addEffect(k, t, lv = 1) {
  if (G.creative || G.spectator || (G.meta?.ultra && k === "absorb")) return;
  if (k === "fire" && G.effects.fireRes) return;   // Fire Resistance keeps you from catching fire
  G.effects[k] = Math.max(G.effects[k] || 0, t); G.elv[k] = Math.max(lv, G.elv[k] || 1);
  if (k === "absorb") G.absorb = Math.max(G.absorb, 4 * lv);   // golden hearts that soak up damage first
  G.hudDirty = true;
}
let effT = 0, regenAcc = 0;
// ---------- Milestone 16: potions (recipes and strengths in js/potions.js) ----------
function applyPotion(s, mul = 1) {
  const p = G.player;
  for (const e of PO.effectsOf(s, mul)) {
    if (e.instant === "heal") { p.health = Math.min(maxHealth(), p.health + Math.round(4 * 2 ** (e.lv - 1) * mul)); puff(p.pos.x, p.pos.y + 1.6, p.pos.z, "heart"); }
    else if (e.instant === "harm") hurt(Math.round(6 * 2 ** (e.lv - 1) * mul), "A Potion of Harming hurt you.", null, true, "magic");
    else addEffect(e.key, e.dur, e.lv);
  }
  G.hudDirty = true;
}
function drinkPotion(s) {
  if (!PO.hasEffect(s)) { if (s.pot === "water" && G.effects.fire) { delete G.effects.fire; G.hudDirty = true; } return; }
  applyPotion(s);
  UI.toast(PO.potionName(s) + "!", s.pot === "harming" || s.pot === "poison" || s.pot === "weakness" || s.pot === "slowness" ? "bad" : "good");
}
G.applyPotion = applyPotion;
function tickEffects(dt) {
  const p = G.player;
  effT += dt;
  const tick = effT >= 1; if (tick) effT = 0;
  for (const k of Object.keys(G.effects)) {
    G.effects[k] -= dt;
    if (G.effects[k] <= 0) { delete G.effects[k]; delete G.elv[k]; if (k === "absorb") G.absorb = 0; G.hudDirty = true; continue; }
    if (k === "poison" && tick && p.health > 1) hurt(1, "Poison wore you down.", null, true, "poison");
    if (k === "queasy") p.exhaust += dt * 0.5;
    if (k === "fire") { if ((p.inWater && !p.inLava) || G.effects.fireRes) { delete G.effects.fire; G.hudDirty = true; } else if (tick) hurt(1, "You were burned. Jump in water to put out flames!", null, true, "fire"); }
    if (k === "blight" && tick && Math.floor(G.effects[k]) % 2 === 0) hurt(1, "The Blight wore you down. Blight Rattlers cause it, so fight them with good armor.", null, true);
    // Regeneration heals 1 point every 2.5 s (level I), 1.25 s (level II)
    if (k === "regen") { regenAcc += dt; const every = 2.5 / (G.elv.regen || 1); if (regenAcc >= every) { regenAcc = 0; if (p.health < maxHealth()) { p.health = Math.min(maxHealth(), p.health + 1); G.hudDirty = true; } } }
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
// Milestone 18, Part B: fire spreads to things that burn (wood, leaves, wool, hay, dry plants) unless the world's
// "Fire spreads" option is off. Burning blocks are destroyed (no drops); Blast Blocks catch and go off.
const SIX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const nearFuel = (x, y, z) => SIX.some(([a, b, c]) => flammable(G.world.id(x + a, y + b, z + c)));
function lightFire(x, y, z) { G.world.set(x, y, z, B.FIRE); fires.push({ x, y, z, t: 4 + Math.random() * 5, spreadT: 0.5 + Math.random() }); }
function burnBlock(x, y, z) {
  const w = G.world, id = w.id(x, y, z);
  if (id === B.TNT) { w.set(x, y, z, B.AIR); primeTNT(x, y, z, 0.5 + Math.random()); return; }
  if (!flammable(id) || fires.length > 260) return;
  lightFire(x, y, z); FL.wake(x, y, z);
}
function updateFires(dt) {
  const w = G.world, spread = G.wset.fireSpread !== false && !G.guest && fires.length < 260;
  for (let i = fires.length - 1; i >= 0; i--) {
    const f = fires[i]; f.t -= dt;
    if (w.id(f.x, f.y, f.z) !== B.FIRE) { fires.splice(i, 1); continue; }   // put out (water, a player)
    if (spread && (f.spreadT = (f.spreadT ?? 1) - dt) <= 0) {
      f.spreadT = 0.8 + Math.random() * 0.6;
      for (const [a, b, c] of SIX) if (Math.random() < (b === 1 ? 0.15 : 0.08)) burnBlock(f.x + a, f.y + b, f.z + c);   // the block beside it catches
      for (let k = 0; k < 2; k++) {   // flames jump to an empty spot next to something that burns
        const x = f.x + Math.floor(Math.random() * 3) - 1, y = f.y + Math.floor(Math.random() * 4) - 1, z = f.z + Math.floor(Math.random() * 3) - 1;
        if (!w.id(x, y, z) && w.isLoaded(x, z) && nearFuel(x, y, z) && Math.random() < 0.25) lightFire(x, y, z);
      }
    }
    if (f.t <= 0) {
      if (w.id(f.x, f.y, f.z) === B.FIRE) w.set(f.x, f.y, f.z, B.AIR);
      fires.splice(i, 1);
      if (spread && flammable(w.id(f.x, f.y - 1, f.z)) && Math.random() < 0.5) burnBlock(f.x, f.y - 1, f.z);   // the block it was burning on finally goes
    }
  }
}
// Milestone 18, Part B: sand and gravel falling (a moving block that lands where it can)
const fallers = [];
function startFall(x, y, z, v) {
  const mesh = new THREE.Mesh(blockGeometry(idOf(v), 1), new THREE.MeshBasicMaterial({ map: atlasTex }));
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5); scene.add(mesh);
  fallers.push({ x, y: y + 0.0, z, v, vy: 0, mesh });
  if (Math.hypot(G.player.pos.x - x, G.player.pos.z - z) < 24) G.adv("sandfall");
}
function updateFallers(dt) {
  const w = G.world;
  for (let i = fallers.length - 1; i >= 0; i--) {
    const f = fallers[i];
    f.vy = Math.max(-30, f.vy - 26 * dt); const ny = f.y + f.vy * dt, cell = Math.floor(ny), d = blockDef(w.get(f.x, cell, f.z));
    const blocked = cell <= 0 || (d.solid && !WATERY[idOf(w.get(f.x, cell, f.z))]);
    if (!blocked) { f.y = ny; f.mesh.position.y = f.y + 0.5; continue; }
    // land in the block above whatever stopped it
    const ty = cell + 1, here = w.get(f.x, ty, f.z), hd = blockDef(here);
    scene.remove(f.mesh); f.mesh.material.dispose(); fallers.splice(i, 1);
    if (idOf(here) === B.AIR || WATERY[idOf(here)] || idOf(here) === B.LAVA || hd.replaceable || (!hd.solid && ["cross", "torch", "crop"].includes(hd.shape))) {
      if (idOf(here) && !WATERY[idOf(here)] && idOf(here) !== B.LAVA && !hd.replaceable) breakBlock(f.x, ty, f.z, true, true);
      w.set(f.x, ty, f.z, f.v); FL.wake(f.x, ty, f.z);
      Sound.place(MATERIAL(idOf(f.v)));
    } else spawnDrop(idOf(f.v), 1, f.x + 0.5, ty + 0.5, f.z + 0.5);   // landed on a torch or a slab: it breaks into an item
  }
}
// Milestone 18, Part B: leaves with no log within reach drop away a few at a time after the tree is cut
// (only leaves that grew naturally; leaves a player placed stay forever)
const leafChecks = new Map();
const isLeaf = id => BLOCKS[id]?.drops === "leaves";
const isLog = id => id === B.LOG || id === B.BIRCH_LOG || !!BLOCKS[id]?.log;
function queueLeafDecay(x, y, z) {
  const w = G.world;
  for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) for (let c = -6; c <= 6; c++) {
    const v = w.get(x + a, y + b, z + c);
    if (isLeaf(idOf(v)) && !(metaOf(v) & LEAF_PERSIST)) { const k = (x + a) + "," + (y + b) + "," + (z + c); if (!leafChecks.has(k)) leafChecks.set(k, 1 + Math.random() * 8); }
  }
}
function leafHeld(x, y, z) {   // is there a log within 5 steps, going through leaves?
  const w = G.world, seen = new Set([x + "," + y + "," + z]);
  let edge = [[x, y, z]];
  for (let d = 0; d < 5 && edge.length; d++) {
    const next = [];
    for (const [px, py, pz] of edge) for (const [a, b, c] of SIX) {
      const nx = px + a, ny = py + b, nz = pz + c, k = nx + "," + ny + "," + nz;
      if (seen.has(k)) continue; seen.add(k);
      const id = w.id(nx, ny, nz);
      if (isLog(id)) return true;
      if (isLeaf(id)) next.push([nx, ny, nz]);
    }
    edge = next;
  }
  return false;
}
function updateLeafDecay(dt) {
  if (!leafChecks.size || G.guest) return;
  let n = 0;
  for (const [k, t] of leafChecks) {
    if (t - dt > 0) { leafChecks.set(k, t - dt); continue; }
    leafChecks.delete(k);
    const [x, y, z] = k.split(",").map(Number), v = G.world.get(x, y, z);
    if (isLeaf(idOf(v)) && !(metaOf(v) & LEAF_PERSIST) && !leafHeld(x, y, z)) { breakBlock(x, y, z, true, true); G.adv("leafdecay"); }
    if (++n > 30) break;
  }
}

// ---------- riding Trotters ----------
function leviathanMountRecord(entity) {
  if (entity?.sp !== "leviathan_dune" && entity?.sp !== "leviathan_obsidian") return null;
  if (entity.duneCycle?.preview) return G.creative && G.dim === "overworld" ? entity.practiceMount : null;
  return G.story.leviathan?.[entity.sp === "leviathan_obsidian" ? "obsidian" : "dune"];
}
function retireLeviathanPreview(entity) {
  if (G.riding === entity) dismount(true);
  entity.gone = true;
  if (entity.mesh) entity.mesh.visible = false;
}
function mount(e) {
  const p = G.player;
  if (G.riding) return false;
  if (e.def.cart) {   // sit in a minecart
    if (e.riderE) { UI.toast("Something's already riding in that minecart."); return true; }
    G.riding = e; e.ridden = true; p.cart = true; p.flying = false; p.gliding = false; p.crouch = false;
    p.pos.x = e.pos.x; p.pos.y = e.pos.y + 0.2; p.pos.z = e.pos.z; p.vel.x = p.vel.y = p.vel.z = 0;
    Sound.place("stone"); G.adv("cart");
    UI.toast("In the minecart! Press W to give it a push. C to climb out.");
    return true;
  }
  if (e.def.boat) {   // climb into a boat
    G.riding = e; e.ridden = true; e.goal = null;
    p.boat = true; p.flying = false; p.gliding = false; p.crouch = false;
    p.pos.x = e.pos.x; p.pos.y = e.pos.y; p.pos.z = e.pos.z; p.vel.x = p.vel.y = p.vel.z = 0;
    Sound.place("wood"); G.adv("boat");
    UI.toast("In the boat! W A S D to row (Shift rows faster), C to climb out.");
    return true;
  }
  if (e.sp === ELEPHANT && !canRideElephant(G.world, p, e)) {
    UI.toast("The elephant needs dry ground and room for both of you before you can mount.");
    return true;
  }
  if (e.tame && !e.saddled) { UI.toast(`Hold a Saddle and right-click your ${e.def.name} to equip it.`); return true; }
  if (e.def.segmentedLeviathan && (e.duneCycle?.preview && !leviathanMountRecord(e) || !canMountLeviathan(G.world, p, e))) {
    UI.toast("Your bonded Leviathan needs dry, clear footing and enough headroom before you can mount.");
    return true;
  }
  G.riding = e; e.ridden = true; e.rideT = 0; e.goal = null; e.path = null;
  p.mount = e; p.flying = false; p.gliding = false; p.crouch = false;
  p.pos.x = e.pos.x; p.pos.y = e.pos.y; p.pos.z = e.pos.z; p.vel.x = p.vel.y = p.vel.z = 0;
  if (e.def.segmentedLeviathan) {
    p.airTop = null; p.onGround = true; p.inWater = false; p.headInWater = false;
    e.vel.x = e.vel.y = e.vel.z = 0;
  }
  if (e.def.airMount && e.tame) p.flying = true;
  Sound.mob(e.def.segmentedLeviathan ? "rumble" : e.sp === ELEPHANT ? "elephanttrumpet" : "neigh", 0); if (e.tame && !e.practiceMount) G.adv("ride");
  UI.toast(e.def.segmentedLeviathan && e.tame ? `Riding! W A S D to steer, Shift to gallop, B to burrow, G for ${e.sp === "leviathan_obsidian" ? "Cinder Lance" : "Sandbreaker"}, C to get off.` : e.def.airMount && e.tame ? "Flying! W A S D to steer, Space to rise, Shift to descend, C to get off." : e.sp === ELEPHANT ? "Riding! W A S D to steer, C to get off." : e.tame ? "Riding! W A S D to steer, Shift to gallop, Space to jump, C to get off." : `Hold on! This ${e.def.name} is wild and may buck you off. Keep trying to tame it.`);
  return true;
}
function dismount(quiet) {
  const p = G.player, e = G.riding;
  if (!e) return;
  if (e.burrowTravel) { clearMountedBurrow(); if (G.riding !== e) return true; }
  const needsClearExit = e.def.segmentedLeviathan || e.sp === ELEPHANT;
  const leviathanExit = needsClearExit ? findLeviathanExit(G.world, p, e) : null;
  if (needsClearExit && !leviathanExit && !quiet) {
    UI.toast("No safe landing nearby. Move onto open, dry ground before dismounting.");
    return false;
  }
  if (e.def.airMount) p.flying = false;
  if (e.def.segmentedLeviathan) clearMountedLeviathanAttack();
  G.riding = null; p.mount = false; p.boat = false; p.cart = false; e.ridden = false; if (!e.def.cart) { e.vel.x = e.vel.y = e.vel.z = 0; }
  if (needsClearExit) {
    // Lifecycle exits must detach even without nearby footing. Keep the current
    // position in that case; dimension travel/death will place the player next.
    if (leviathanExit) Object.assign(p.pos, leviathanExit);
    p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
    p.onGround = !!leviathanExit; p.inWater = false; p.headInWater = false;
    if (!quiet) Sound.place("sand");
    return true;
  }
  if (e.def.boat && boatLanding(p)) { if (!quiet) Sound.place("wood"); return; }
  // step off to the side if there is room
  for (const s of [1, -1]) {
    const x = p.pos.x + Math.cos(p.yaw) * 1.2 * s, z = p.pos.z - Math.sin(p.yaw) * 1.2 * s;
    if (!p.collides(G.world, p.aabb(x, p.pos.y + 0.05, z))) { p.pos.x = x; p.pos.z = z; p.pos.y += 0.05; break; }
  }
  if (!quiet) Sound.place("wood");
}
// climbing out of a boat: step onto dry land nearby if there is some
function boatLanding(p) {
  const w = G.world, fy = Math.floor(p.pos.y);
  for (const r of [1.2, 2.1]) for (let k = 0; k < 8; k++) {
    const a = p.yaw + k * Math.PI / 4, x = p.pos.x - Math.sin(a) * r, z = p.pos.z - Math.cos(a) * r;
    for (let y = fy + 2; y >= fy - 1; y--) {
      const below = w.id(Math.floor(x), y - 1, Math.floor(z));
      if (!SOLID[below] || w.id(Math.floor(x), y, Math.floor(z)) === B.WATER || p.collides(w, p.aabb(x, y, z))) continue;
      p.pos.x = x; p.pos.y = y; p.pos.z = z; p.vel.x = p.vel.y = p.vel.z = 0;
      return true;
    }
  }
  return false;
}
// keep the Trotter (or boat) under you; a wild Trotter bucks you off unless it decides to trust you
function tickRiding(dt) {
  const p = G.player, e = G.riding;
  if (!e) return;
  if (e.dead || e.gone || !ents.list.includes(e)) { dismount(true); return; }
  if (e.burrowTravel) return;
  if (e.def.cart) {   // the cart carries you
    p.pos.x = e.pos.x; p.pos.y = e.pos.y + 0.2; p.pos.z = e.pos.z; p.vel.x = e.vel.x; p.vel.y = 0; p.vel.z = e.vel.z; p.airTop = null;
    G.cartDist = (G.cartDist || 0) + Math.hypot(e.vel.x, e.vel.z) * dt; if (G.cartDist > 100 && !G.cartAdv) { G.cartAdv = true; G.adv("cartride"); }
    return;
  }
  e.pos.x = p.pos.x; e.pos.y = p.pos.y; e.pos.z = p.pos.z;
  e.vel.x = p.vel.x; e.vel.y = p.vel.y; e.vel.z = p.vel.z; e.yaw = p.yaw; e.onGround = p.onGround;
  if (e.tame || e.def.boat) return;
  e.rideT += dt;
  if ((e.rideCheck = (e.rideCheck || 0) + dt) >= 1) {
    e.rideCheck = 0;
    if (Math.random() < 0.08 + (e.temper || 0) / 100 * 0.5) {
      e.tame = true; G.adv("tame", e.sp);
      for (let k = 0; k < 4; k++) puff(e.pos.x + (Math.random() - 0.5), e.pos.y + 2, e.pos.z + (Math.random() - 0.5), "heart");
      Sound.mob("neigh", 0); dismount(true);
      UI.toast(`You tamed the ${e.def.name}! Craft a Saddle (5 leather + 1 iron ingot), then right-click with it to equip it.`, "good");
      return;
    }
  }
  if (e.rideT > 4) {   // bucked off!
    e.temper = Math.min(100, (e.temper || 0) + 8);
    dismount(true); p.vel.y = 6; Sound.mob("neigh", 0);
    UI.toast(`The ${e.def.name} bucked you off! Feeding it wheat or apples calms it down.`, "bad");
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
  spawnDrop(I.RADIANT_STAR, 1, e.pos.x, e.pos.y + 1, e.pos.z); G.adv("boss", "blightking");
  spawnOrbs(50, e.pos.x, e.pos.y + 1, e.pos.z);
  Sound.levelUp();
  UI.toast("You defeated the Blightking! It dropped a Radiant Star. Use it to craft a Beacon.", "good");
}
// Beacons (Minecraft 1.20.1 rules): a pyramid of mineral blocks underneath (1–4 layers) and open sky above make the beam shine.
// More layers = more range (20/30/40/50 blocks) and more powers to choose from. Choosing a power costs one ingot, Jade, or Skyshard.
// Beacons placed before this update (no settings saved) keep their old gift: Regeneration and Swiftness within 24 blocks.
const BEACON_POWERS = {
  swift: { name: "Swiftness", level: 1, desc: "Move faster" },
  haste: { name: "Haste", level: 1, desc: "Mine faster" },
  resist: { name: "Resistance", level: 2, desc: "Take less damage" },
  jump: { name: "Jump Boost", level: 2, desc: "Jump higher, softer landings" },
  strength: { name: "Strength", level: 3, desc: "Hit harder" }
};
const BEACON_PAY = [I.IRON_INGOT, I.GOLD_INGOT, I.JADE, I.SKYSHARD, I.DUSK_INGOT];
G.beaconPay = BEACON_PAY;
function pyramidLevel(x, y, z) {
  const w = G.world;
  let lvl = 0;
  for (let k = 1; k <= 4; k++) {
    for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) if (!BEACON_BASE.includes(w.id(x + dx, y - k, z + dz))) return lvl;
    lvl = k;
  }
  return lvl;
}
function skyClear(x, y, z) { for (let yy = y + 1; yy < HEIGHT; yy++) if (OPAQUE[G.world.id(x, yy, z)]) return false; return true; }
// What a beacon is doing right now: { level, open, active, range }
function beaconState(key) {
  const [x, y, z] = key.split(",").map(Number), c = G.world.containers.get(key);
  const level = pyramidLevel(x, y, z), open = skyClear(x, y, z), legacy = !c || !!c.legacy;
  return { x, y, z, c, level, open, legacy, active: legacy ? true : level > 0 && open && !!c.primary, range: legacy ? 24 : 10 + level * 10 };
}
G.beaconState = beaconState;
const beams = new Map();   // key → beam mesh
const beamGeo = new THREE.BoxGeometry(0.32, 1, 0.32);
const BEAM_COLOR = { swift: 0x9ad8ff, haste: 0xffe27a, resist: 0xb8c0d0, jump: 0x9aff9a, strength: 0xff8a6a, regen: 0xff9ad0 };
function setBeam(key, st) {
  let m = beams.get(key);
  if (!st || !st.active || st.legacy || !st.open) { if (m) { scene.remove(m); m.material.dispose(); beams.delete(key); } return; }
  if (!m) {
    m = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
    m.scale.y = HEIGHT - st.y; m.position.set(st.x + 0.5, st.y + 1 + (HEIGHT - st.y) / 2, st.z + 0.5); m.renderOrder = 2;
    scene.add(m); beams.set(key, m);
  }
  m.material.color.setHex(BEAM_COLOR[st.c.primary] || 0xffffff);
}
function clearBeams() { for (const k of [...beams.keys()]) setBeam(k, null); }
let beaconT = 0;
function tickBeacons(dt) {
  if ((beaconT += dt) < 1) return; beaconT = 0;
  const p = G.player;
  for (const k of [...G.world.beacons]) {
    const [x, y, z] = k.split(",").map(Number);
    if (!G.world.isLoaded(x, z)) { setBeam(k, null); continue; }
    if (G.world.id(x, y, z) !== B.BEACON) { G.world.beacons.delete(k); setBeam(k, null); continue; }
    const st = beaconState(k);   // checked again every second, so changing the pyramid takes effect right away
    setBeam(k, st);
    if (!st.active) continue;
    const inRange = Math.abs(p.pos.x - x - 0.5) <= st.range && Math.abs(p.pos.z - z - 0.5) <= st.range && (st.legacy ? Math.abs(p.pos.y - y) <= st.range : p.pos.y >= y - st.range);
    if (!inRange) continue;
    // effects last a few seconds and are topped up while you stay in range, so they fade soon after you leave
    if (st.legacy) { addEffect("regen", 4); addEffect("swift", 4); continue; }
    const c = st.c, two = st.level >= 4 && c.secondary === c.primary;
    addEffect(c.primary, 4, two ? 2 : 1);
    if (st.level >= 4 && c.secondary === "regen") addEffect("regen", 4);
  }
}
// Choose powers at the beacon screen (pays one ingot from the beacon's slot)
G.setBeaconPower = (key, primary, secondary) => {
  const st = beaconState(key), c = st.c;
  if (!c) return;
  if (c.legacy) st.level = pyramidLevel(st.x, st.y, st.z);
  const pay = c.slots[0];
  if (!pay || !BEACON_PAY.includes(pay.id)) { UI.toast("Put an Iron Ingot, Gold Ingot, Jade, Skyshard, or Duskmetal Ingot in the slot to pay.", "bad"); Sound.error(); return; }
  if (!st.level) { UI.toast("This Beacon needs a pyramid of mineral blocks underneath first.", "bad"); Sound.error(); return; }
  if (!BEACON_POWERS[primary] || BEACON_POWERS[primary].level > st.level) { UI.toast("Build a bigger pyramid to unlock that power.", "bad"); Sound.error(); return; }
  if (secondary && (st.level < 4 || (secondary !== "regen" && secondary !== primary))) secondary = null;
  pay.n--; if (!pay.n) c.slots[0] = null;
  c.primary = primary; c.secondary = secondary || null; delete c.legacy;
  Sound.levelUp(); G.adv("beaconPower", st.level);
  UI.toast(st.open ? `Beacon set to ${BEACON_POWERS[primary].name}${secondary === "regen" ? " + Regeneration" : secondary ? " II" : ""}! Range: ${st.range} blocks.` : "Power chosen, but the beam is blocked. Clear everything above the Beacon.", st.open ? "good" : "bad");
  beaconT = 1; UI.refreshPanel();
};
G.BEACON_POWERS = BEACON_POWERS;
// Trading with villagers
// A trade with its real price and item. Enchanted-book trades are decided by who the villager is (Milestone 15).
G.tradeOffer = (e, i) => {
  let t = tradesOf(e)[i];   // (Milestone 23: plus bonus trades from the villager's level)
  if (t && G.effects.hero) t = [t[0].map(([id, n]) => id === I.JADE && n > 1 ? [id, Math.ceil(n * 0.7)] : [id, n]), ...t.slice(1)];   // Milestone 23, Part D: Hero of the Village
  if (t && e.cured) t = [t[0].map(([id, n]) => id === I.JADE && n > 1 ? [id, Math.ceil(n / 2)] : [id, n]), ...t.slice(1)];   // Milestone 23, Part C: a villager you cured sells for half the Jade
  if (!t || t[1][0] !== I.ENCH_BOOK) return t;
  const b = EN.villagerBook(e.uid + ":" + i, e.def.prof === "wanderer");
  return [t[0].map(([id, n]) => (id === I.JADE && !n ? [id, b.price] : [id, n])), [I.ENCH_BOOK, 1], t[2], { id: I.ENCH_BOOK, n: 1, ench: b.ench }];
};
G.trade = (uid, i, many) => {
  const e = ents.list.find(o => o.uid === uid);
  if (!e) return;
  const t = G.tradeOffer(e, i);
  if (!t) return;
  let done = 0;
  for (let k = 0; k < (many ? 16 : 1); k++) {
    if (e.uses[i] >= t[2]) break;
    if (!t[0].every(([id, n]) => G.inv.count(id) >= n)) break;
    for (const [id, n] of t[0]) G.inv.remove(id, n);
    const left = G.inv.add(t[1][0], t[1][1], t[3]);
    if (left) G.dropItem(t[1][0], left, t[3]);
    e.uses[i]++; done++; e.traded = true;   // (Milestone 23: now it keeps this job)
    { const before = levelOf(e); e.vxp = (e.vxp || 0) + (i < (TRADES[e.def.prof] || []).length ? 3 + Math.min(i, 6) : 15);   // Milestone 23, Part B: trading experience
      const now = levelOf(e); if (now > before) { while (e.uses.length < tradesOf(e).length) e.uses.push(0); puff(e.pos.x, e.pos.y + 2, e.pos.z, "xp"); Sound.levelUp(); UI.toast(`This villager is now ${/^[AEIOU]/.test(LEVEL_NAMES[now - 1]) ? "an" : "a"} ${LEVEL_NAMES[now - 1]}! A new trade is open.`, "good"); G.adv("villagerLevel", now); } }
    spawnOrbs(2, e.pos.x, e.pos.y + 1, e.pos.z);
  }
  if (!done) { Sound.error(); UI.toast(e.uses[i] >= t[2] ? "Sold out for now. Villagers restock while they work." : "You don't have enough for that trade.", "bad"); return; }
  Sound.craft(); puff(e.pos.x, e.pos.y + 2, e.pos.z, "xp"); e.trading = 30; G.adv("trade");
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
// ---------- Milestone 14: calling the Hollow Wyrm back (Java: four End Crystals around the exit portal) ----------
// A Void Crystal can be set on obsidian or bedrock in the Hollow. One on each side of the exit portal's rim starts the summoning.
const WYRM_SIDES = [[2, 0], [-2, 0], [0, 2], [0, -2]];
const wyrmTop = () => (G.gen.land(0, 0) || { top: END_TOP }).top;
function placeVoidCrystal(hit) {
  const w = G.world, id = idOf(hit.v), x = hit.x, y = hit.y + 1, z = hit.z;
  if (G.dim !== "end") { UI.toast("Void Crystals only hold steady in the Hollow."); return true; }
  if (id !== B.OBSIDIAN && id !== B.BEDROCK) { UI.toast("Set a Void Crystal on obsidian or bedrock."); return true; }
  if (w.id(x, y, z) || w.id(x, y + 1, z) || ents.list.some(e => e.sp === "crystal" && Math.hypot(e.pos.x - x - 0.5, e.pos.z - z - 0.5) < 1 && Math.abs(e.pos.y - y) < 2)) { UI.toast("There's no room for a crystal there."); return true; }
  const d = endData(), key = x + "," + y + "," + z;
  (d.placed = d.placed || []).push(key);
  ents.add("crystal", x + 0.5, y, z + 0.5, { cid: "p:" + key });
  if (!G.creative) { const s = G.inv.slots[G.useSlot]; if (s && --s.n <= 0) G.inv.slots[G.useSlot] = null; }
  Sound.mob("crystal", 0); puff(x + 0.5, y + 1, z + 0.5, "portal"); G.hudDirty = true;
  checkWyrmSummon();
  return true;
}
function placedCrystalGone(cid) { const d = endData(); d.placed = (d.placed || []).filter(k => "p:" + k !== cid); }
function checkWyrmSummon() {
  const d = endData(), top = wyrmTop();
  if (!d.wyrmDefeated || d.summon) return;
  const placed = new Set(d.placed || []);
  if (!WYRM_SIDES.every(([dx, dz]) => placed.has(dx + "," + (top + 2) + "," + dz))) {
    if (placed.size && !G.tips.wyrmSummon) { G.tips.wyrmSummon = true; UI.toast("Put a Void Crystal on each of the four sides of the exit portal's rim to call the Wyrm back.", ""); }
    return;
  }
  d.summon = { t: 0 }; G.adv("resummon");
  UI.toast("The crystals hum... the pillars are rising again. Get ready!", "bad");
}
// Runs every frame in the Hollow: keeps placed crystals in the world, and plays the summoning
function tickWyrmSummon(dt) {
  const d = endData(), w = G.world;
  for (const key of d.placed || []) {
    const [x, y, z] = key.split(",").map(Number);
    if (!w.isLoaded(x, z) || ents.list.some(e => e.sp === "crystal" && e.cid === "p:" + key)) continue;
    ents.add("crystal", x + 0.5, y, z + 0.5, { cid: "p:" + key });
  }
  const s = d.summon;
  if (!s) return;
  const before = s.t; s.t += dt;
  const top = wyrmTop();
  if (Math.random() < 0.6) for (const [dx, dz] of WYRM_SIDES) puff(dx + 0.5, top + 3 + Math.random() * 12, dz + 0.5, "portal");
  if (before < 2 && s.t >= 2) {   // the way home closes while the Wyrm is back
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (w.id(dx, top + 1, dz) === B.END_PORTAL) w.set(dx, top + 1, dz, B.AIR);
    Sound.mob("portal", 0);
  }
  G.gen.pillars.forEach((pl, i) => {   // the pillars grow back one by one
    const at = 3 + i * 0.7;
    if (before < at && s.t >= at && w.isLoaded(pl.x, pl.z)) {
      for (let x = pl.x - pl.r; x <= pl.x + pl.r; x++) for (let z = pl.z - pl.r; z <= pl.z + pl.r; z++) {
        if ((x - pl.x) ** 2 + (z - pl.z) ** 2 > pl.r * pl.r) continue;
        for (let y = END_TOP - 8; y <= pl.top; y++) if (w.id(x, y, z) !== B.OBSIDIAN) w.set(x, y, z, B.OBSIDIAN);
      }
      puff(pl.x + 0.5, pl.top + 1, pl.z + 0.5, "portal"); Sound.explode(Math.hypot(G.player.pos.x - pl.x, G.player.pos.z - pl.z));
    }
  });
  if (s.t >= 12) {
    for (const e of ents.list) if (e.sp === "crystal" && String(e.cid).startsWith("p:")) { e.gone = true; puff(e.pos.x, e.pos.y + 1, e.pos.z, "portal"); }
    d.placed = []; delete d.summon; d.crystalsGone = []; d.wyrmDefeated = false; d.wyrmHp = 200; d.wyrmReturns = (d.wyrmReturns || 0) + 1;
    Sound.mob("roar", 0); UI.toast("The Hollow Wyrm has returned!", "bad");
    saveNow(false);
  }
}
function wyrmDefeated(e) {
  G.adv("boss", "dragon");
  const d = endData(), again = (d.wyrmReturns || 0) > 0; d.wyrmDefeated = true; delete d.wyrmHp;
  const w = G.world, top = (G.gen.land(0, 0) || { top: END_TOP }).top;
  // exit fountain: a bedrock ring holding a portal home, with the egg on a pillar
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    w.set(dx, top, dz, B.BEDROCK);
    const ring = Math.abs(dx) === 2 || Math.abs(dz) === 2;
    w.set(dx, top + 1, dz, ring ? B.BEDROCK : (dx || dz) ? B.END_PORTAL : B.BEDROCK);
    for (let y = top + 2; y < top + 6; y++) if (!(dx === 0 && dz === 0)) { if (w.id(dx, y, dz)) w.set(dx, y, dz, B.AIR); }
  }
  for (let y = top + 2; y <= top + 4; y++) w.set(0, y, 0, B.BEDROCK);
  if (!again) w.set(0, top + 5, 0, B.WYRM_EGG);   // only the first Wyrm leaves an egg
  buildGateway(40, (G.gen.land(40, 0) || { top }).top + 4, 0);
  spawnOrbs(again ? 100 : 400, G.player.pos.x, G.player.pos.y + 2, G.player.pos.z);
  spawnDrop(I.WYRM_SCALE, again ? 1 : 3, 0.5, top + 2, 2.5);
  if (again) { Sound.levelUp(); UI.toast("You defeated the Hollow Wyrm again! The portal home is open.", "good"); saveNow(true); return; }
  const story = !!(G.meta && G.meta.campaign);
  if (!story) giveItem(I.CINDER_EYE, 1);   // the key to the final fight (the Legacy Campaign has its own: Chapter 8's Relic of the Void)
  if (!story) setTimeout(() => UI.toast("The Wyrm left you a glowing Cinder Eye (check your pack). Throw it in the Ember Depths to find what waits there…", "good"), 6500);
  if (CP.externalBoss) CP.externalBoss("wyrm");
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
  dismount(true);   // Trotters stay behind in their own world
  const p = G.player, fromDim = G.dim, back = { ...p.pos };
  const hadDestination = Object.hasOwn(G.dimData, toDim);
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
    G.state = "pause"; UI.show("none"); UI.hud(); G.resume(); G.adv("dim", toDim);
  } catch (err) {
    console.error(err);
    clearWorldMeshes(); if (G.world) G.world.chunks.clear();
    if (!hadDestination) delete G.dimData[toDim];
    G.dim = fromDim; G.world = makeWorld(fromDim); G.gen = G.world.gen;
    Object.assign(p.pos, back);
    await loadArea(back.x, back.z, "Returning…");
    portalCooldown = true;
    G.state = "pause"; UI.show("none"); G.resume();
    UI.toast("The portal fizzled. Try again.", "bad");
  } finally {
    G.traveling = false;
  }
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
  const home = isLostWorldRegion(s.dim) ? s.dim : worldHome(G.meta);
  return changeDim(home, s.x, s.z, "Returning to " + DIM_NAMES[home] + "…", () => { placeSafely(G.player, s.x, s.z); UI.toast("Home again!", "good"); });
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
  const w = G.world, slot = G.inv.slots[G.useSlot];
  hit.v = w.get(hit.x, hit.y, hit.z);
  if (idOf(hit.v) !== B.END_FRAME) return;
  if (metaOf(hit.v) & EYE_IN) { UI.toast("That frame already has an eye."); return; }
  if (!slot || slot.id !== I.EYE) { UI.toast("This frame needs an Eye of the Void.", ""); return; }
  w.set(hit.x, hit.y, hit.z, make(B.END_FRAME, metaOf(hit.v) | EYE_IN));
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
  Sound.mob("teleport", 0); puff(hit.x + 0.5, hit.y + 1, hit.z + 0.5, "portal"); G.hudDirty = true; heldId = -1;
  // any ring works (a stronghold's or one you built): 12 frames, 3 on each side of a 3×3 space, all at the same height
  let best = null;
  for (const [ox, , oz] of frameSpots({ x: 0, y: 0, z: 0 })) {
    const c = { x: hit.x - ox, y: hit.y, z: hit.z - oz }, spots = frameSpots(c);
    const frames = spots.filter(([x, y, z]) => w.id(x, y, z) === B.END_FRAME).length;
    const filled = spots.filter(([x, y, z]) => w.id(x, y, z) === B.END_FRAME && (metaOf(w.get(x, y, z)) & EYE_IN)).length;
    if (!best || frames > best.frames || (frames === best.frames && filled > best.filled)) best = { c, frames, filled };
  }
  const { c, frames, filled } = best;
  if (frames < 12) { UI.toast(`${filled} of 12 eyes placed. A portal needs 12 frames in a ring, 3 on each side of a 3×3 space (no corners). This ring has ${frames}.`); return; }
  if (filled < 12) { UI.toast(`${filled} of 12 eyes placed.`); return; }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) w.set(c.x + dx, c.y, c.z + dz, B.END_PORTAL);
  Sound.mob("portal", 0); Sound.levelUp();
  UI.toast("The Hollow Portal is open! Jump in when you're ready. Bring armor, a bow, lots of arrows, and blocks.", "good");
}
function throwEye() {
  if (G.dim !== "overworld") { UI.toast("The eye just spins in place. Strongholds are on the Surface.", "bad"); return; }
  const p = G.player, s = [...G.gen.strongholds].sort((a, b) => Math.hypot(a.x - p.pos.x, a.z - p.pos.z) - Math.hypot(b.x - p.pos.x, b.z - p.pos.z))[0];
  ents.addProjectile("eye", p.pos.x, p.pos.y + 1.5, p.pos.z, 0, 0, 0, { tx: s.x + 0.5, tz: s.z + 0.5, noGrav: true, fromPlayer: true });
  const sl = G.inv.slots[G.useSlot]; if (sl && !G.creative) { sl.n--; if (!sl.n) G.inv.slots[G.useSlot] = null; }
  G.hudDirty = true; heldId = -1; Sound.mob("teleport", 0); G.adv("eye");
  const dist = Math.hypot(s.x - p.pos.x, s.z - p.pos.z);
  if (dist < 14) UI.toast(s.citadel ? "The eye sank into the keep. The Hollow portal lies sealed beneath the Endwatch Citadel." : "The eye dove into the ground. The stronghold is right below you!", "good");
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
const DIM_NAMES = { ...Object.fromEntries(Object.entries(LOST_WORLD_REGIONS).map(([dim, region]) => [dim, region.name])), [LOST_WORLD]: "The Lost World", overworld: "the Surface", nether: "the Ember Depths", end: "the Hollow", forsaken: "the Forsaken World", deep: "the Deep", expanse: "the Echo Expanse", sea: "the Drowned Citadel", jungle: "the Verdant Labyrinth", desert: "the Sunken Pyramid of Aurelis" };
const dimWhere = d => (d === "overworld" ? "on " : "in ") + (DIM_NAMES[d] || d);
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
  if (portalT >= need && !G.traveling) {
    portalT = 0;
    const from = portalAt(...inside);
    const linkedHome = from && G.dimData.nether?.links?.[portalKey(from)]?.dim;
    const home = G.meta.lostWorldGen && isLostWorldRegion(linkedHome) ? linkedHome : worldHome(G.meta);
    travel(G.dim === "nether" ? home : "nether", from || { x: inside[0], y: inside[1], z: inside[2], axis: idOf(w.get(...inside)) === B.PORTAL ? metaOf(w.get(...inside)) & 1 : 0, w: 2, h: 3 });
  }
}
async function travel(toDim, fromPortal) {
  const p = G.player, fromDim = G.dim, back = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
  const scale = toDim === "nether" ? 1 / 8 : 8, tx = Math.floor(p.pos.x * scale), tz = Math.floor(p.pos.z * scale);
  G.traveling = true;
  const ride = CO.takeMount();   // Milestone 14: the Trotter you're riding comes through with you
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
      const separateRegions = G.meta.lostWorldGen && toDim === "nether";
      const links = G.dimData[toDim].links;
      dest = portalList(toDim).filter(a => {
        const linkedTo = separateRegions ? links?.[portalKey(a)]?.dim : null;
        return (!linkedTo || linkedTo === fromDim) && Math.hypot(a.x - tx, a.z - tz) <= range;
      }).sort((a, b) => Math.hypot(a.x - tx, a.z - tz) - Math.hypot(b.x - tx, b.z - tz))[0] || null;
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
    G.state = "pause"; UI.show("none"); UI.hud(); G.resume(); G.adv("dim", toDim);
    CO.bringMount(ride);
    UI.toast(toDim === "nether" ? "Welcome to the Ember Depths! Watch out for lava, and don't sleep here." : isLostWorldDimension(toDim) ? "Back in " + DIM_NAMES[toDim] + "." : "Back on the Surface.", toDim === "nether" ? "bad" : "good");
    if (toDim === "nether" && !G.tips.nether) { G.tips.nether = true; UI.toast("Tip: wear a piece of gold armor and the Boarkin won't attack. Give them gold ingots to trade.", ""); }
    if (toDim === "nether") cinderHint();
  } catch (err) {
    console.error(err);
    // something went wrong: go back where we were
    clearWorldMeshes(); if (G.world) G.world.chunks.clear();
    G.dim = fromDim; G.world = makeWorld(fromDim); G.gen = G.world.gen;
    Object.assign(p.pos, back);
    await loadArea(back.x, back.z, "Returning…");
    portalCooldown = true;
    G.state = "pause"; UI.show("none"); G.resume();
    CO.bringMount(ride);   // the trip failed: your mount is back with you
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

// ---------- the Cinder Citadel and Cindermaw, the Ember Dragon (final boss of Survival) ----------
// Story: defeat the Hollow Wyrm → it drops a Cinder Eye (also craftable from a Wyrm Scale) → in the Ember Depths the eye
// flies toward the Cinder Citadel → place it in the Cinder Altar to wake Cindermaw → win → keep playing.
// Saved in G.dimData.nether.cinder: { state: "dormant" | "awake" | "defeated", hp, pylonsGone: [], wins, firstWin }
const cinderData = () => { const d = G.dimData.nether || (G.dimData.nether = {}); return d.cinder || (d.cinder = { state: "dormant", hp: null, pylonsGone: [], wins: 0, firstWin: null }); };
// Pick where the citadel goes (once per world): 150–240 blocks out, somewhere the player hasn't been or changed yet
function chooseCitadel() {
  const d = G.dimData.nether || (G.dimData.nether = {});
  if (d.citadel) return d.citadel;
  const r = rng(hashSeed(G.meta.seed) ^ 0x5c17ade), mods = d.mods || {}, seen = new Set(d.visited || []);
  const clear = (x, z) => { for (let cx = Math.floor((x - 36) / CHUNK); cx <= Math.floor((x + CITADEL.TUNNEL + 14) / CHUNK); cx++) for (let cz = Math.floor((z - 36) / CHUNK); cz <= Math.floor((z + 36) / CHUNK); cz++) if (mods[cx + "," + cz] || seen.has(cx + "," + cz)) return false; return true; };
  for (let t = 0; t < 40; t++) {
    const a = r() * Math.PI * 2, rad = 150 + r() * 90 + t * 6, x = Math.round(Math.cos(a) * rad), z = Math.round(Math.sin(a) * rad);
    if (clear(x, z)) return (d.citadel = { x, z });
  }
  return (d.citadel = { x: 700, z: -700 });
}
const arena = () => { const c = G.dimData.nether && G.dimData.nether.citadel; return c && G.dim === "nether" ? { x: c.x + 0.5, y: CITADEL.F, z: c.z + 0.5, r: CITADEL.R } : null; };
G.arena = arena;
function inArena(pad = 0) { const A = arena(), p = G.player; return !!A && Math.hypot(p.pos.x - A.x, p.pos.z - A.z) < A.r + pad && p.pos.y > A.y - 4 && p.pos.y < CITADEL.TOP + 2; }
// Keep the fight going while you're nearby; it waits (keeping its health) if you leave
let cinderMsgT = 0, citadelSeen = false;
function tickCinder(dt) {
  if (G.dim !== "nether" || !arena()) return;
  const c = cinderData(), A = arena(), p = G.player, dist = Math.hypot(p.pos.x - A.x, p.pos.z - A.z);
  if (!citadelSeen && dist < A.r + 30 && G.mode === "survival") { citadelSeen = true; G.adv("citadel"); }
  let boss = ents.list.find(e => e.sp === "cindermaw" && !e.gone);
  if (c.state !== "awake") { if (boss && !boss.dead) removeCinder(); return; }
  if (dist < A.r + 8 && !boss && G.world.isLoaded(A.x, A.z)) {
    if (c.hp !== null && c.hp <= 0) { cinderDefeated(null); return; }   // the page closed during its last moments
    boss = ents.add("cindermaw", A.x, A.y + 26, A.z - 6, { hp: c.hp ?? undefined });
    boss.ang = 0; boss.phase = "circle"; boss.phaseT = 3; boss.lastPhase = 0;
    if (c.hp !== null && c.hp < boss.maxHp) UI.toast("Cindermaw is still here, and still hurt. Finish it!", "bad");
  }
  if (boss && !boss.dead) {
    c.hp = boss.hp;
    if (dist > A.r + 18) { removeCinder(); UI.toast("Cindermaw circles back to its citadel. It keeps its wounds until you return.", "bad"); }
  }
}
// Story items (Relics, keys, cores: items marked quest) always fit: when the pack is full, its last ordinary stack drops at your feet instead
function giveItem(id, n) {
  let left = G.inv.add(id, n);
  if (left && (itemDef(id) || {}).quest) for (let i = 35; i >= 0 && left; i--) {
    const sl = G.inv.slots[i]; if (!sl || (itemDef(sl.id) || {}).quest) continue;
    G.inv.slots[i] = null; G.dropItem(sl.id, sl.n, sl);
    UI.toast(`Your pack was full, so your ${(itemDef(sl.id) || {}).name || "item"} was dropped at your feet to make room.`, "");
    left = G.inv.add(id, left);
  }
  if (left) G.dropItem(id, left);
  G.hudDirty = true;
}
G.giveItem = giveItem;
function giveXp(n) { const before = levelInfo(G.xp).level; G.xp += n; G.hudDirty = true; if (levelInfo(G.xp).level > before) UI.toast(`Level ${levelInfo(G.xp).level}!`, "good"); }
function removeCinder() {
  for (const e of ents.list) if ((e.sp === "cindermaw" || e.sp === "pylon" || e.cinderMinion) && !e.gone) { if (e.sp === "cindermaw" && !e.dead) cinderData().hp = e.hp; e.gone = true; }
  ents.clearHazards();
}
// Phase 2: the Ember Pylons rise on their towers (ones you broke stay broken)
G.cinderPylons = () => {
  const A = arena(), c = cinderData();
  if (!A) return;
  CITADEL_PYLONS.forEach((pl, i) => {
    if (c.pylonsGone.includes(i) || ents.list.some(e => e.sp === "pylon" && e.cid === i && !e.gone)) return;
    const e = ents.add("pylon", A.x + pl.x, A.y + CITADEL.PYLON_H + 1, A.z + pl.z, { cid: i });
    puff(e.pos.x, e.pos.y + 1, e.pos.z, "fire");
  });
};
// Right-click the Cinder Altar
function useCinderAltar(hit) {
  const c = cinderData(), at = [G.selected, OFF].find(i => G.inv.slots[i] && G.inv.slots[i].id === I.CINDER_EYE);
  if (!arena()) { UI.toast("The altar is cold. It only answers in its own citadel."); return; }
  if (c.state === "awake") { UI.toast("Cindermaw is already awake!", "bad"); return; }
  if (at === undefined && c.spareEye) {   // a retry after fainting uses the eye already in the altar
    c.spareEye = false;
  } else if (at === undefined) {
    UI.toast(c.state === "defeated" ? "Cindermaw is gone, but a Cinder Eye placed here would call another one to fight." : "An empty socket glows on the altar. Something shaped like an eye belongs here: a Cinder Eye.");
    return;
  }
  if (G.spectator) return;
  if (at !== undefined && !G.creative) { const s = G.inv.slots[at]; s.n--; if (!s.n) G.inv.slots[at] = null; }
  G.hudDirty = true; heldId = -1; offId = -1;
  c.state = "awake"; c.hp = null; c.pylonsGone = [];
  Sound.mob("rumble", 0); setTimeout(() => Sound.mob("roar", 0), 900);
  for (let i = 0; i < 6; i++) puff(hit.x + 0.5, hit.y + 1 + i * 0.4, hit.z + 0.5, "fire");
  UI.toast(c.wins ? "The altar flares! Another Cindermaw rises to fight." : "The altar flares! Cindermaw, the Ember Dragon, awakens!", "bad");
  setTimeout(() => UI.toast("Watch for its warnings: a roar before it dives, glowing rings before fire, spread wings before a gust.", ""), 3500);
  G.adv("cinderwake");
  saveNow(false);
}
// Fainting during the fight resets it: Cindermaw rests and heals, and the altar gives the Cinder Eye back
function cinderOnFaint() {
  const c = cinderData();
  if (G.dim !== "nether" || c.state !== "awake" || !inArena(40)) return;
  removeCinder();
  c.state = c.wins ? "defeated" : "dormant"; c.hp = null; c.pylonsGone = [];
  c.spareEye = true;   // the altar keeps the Cinder Eye, so trying again is free
  G.cinderReset = true;
  setTimeout(() => UI.toast("Cindermaw went back to sleep. Your Cinder Eye stays in the altar: right-click it to try again.", ""), 1500);
}
// Victory! Rewards are given once per fight and saved right away, so reloading can't hand them out twice.
function cinderDefeated(e) {
  const c = cinderData(), A = arena(), first = !c.firstWin;
  if (c.state !== "awake") return;
  c.state = "defeated"; c.hp = null; c.wins = (c.wins || 0) + 1; c.pylonsGone = [];
  removeCinder();
  const w = G.world, at = (o, dy = 0) => ({ x: Math.floor(A.x) + o.x, y: o.y + dy, z: Math.floor(A.z) + o.z });
  if (first) {
    c.firstWin = Date.now();
    const egg = at(CITADEL_SPOTS.egg);
    w.set(egg.x, egg.y, egg.z, B.CINDER_EGG);
  }
  // rewards go straight into your pack (things on the ground aren't saved), with a shower of orbs to celebrate
  giveXp(first ? 470 : 130); spawnOrbs(30, A.x, A.y + 4, A.z);
  giveItem(I.EMBER_HEART, 1);
  Sound.levelUp(); setTimeout(() => Sound.levelUp(), 400);
  G.adv("boss", first ? "cindermaw" : "cindermawAgain");
  saveNow(true);
  CP.externalBoss("cindermaw");   // Legacy Campaign, Chapter 5: the Relic of Flame
  startVictoryScene(first);
}
// A short victory scene: the camera circles the altar; press Space, Esc, or click to skip
function startVictoryScene(first) {
  showVictory(first ? "Cindermaw has fallen!" : "Cindermaw is defeated again!",
    first ? "The Ember Depths are quiet at last. Your rewards: the Cindermaw Egg on the altar, an Ember Heart (combine it with a Duskmetal Helmet at a workbench for the Cinder Crown), and lots of experience. Your world goes on: keep exploring and building!" : "Another Ember Heart is yours. Place a Cinder Eye in the altar whenever you want a rematch.", arena());
}
function showVictory(title, text, at) {
  G.cutscene = { t: 0, dur: 9, x: at.x, y: at.y, z: at.z };
  const el = document.getElementById("victory");
  el.querySelector("h2").textContent = title; el.querySelector("p").textContent = text;
  el.hidden = false;
}
function endVictoryScene() { G.cutscene = null; document.getElementById("victory").hidden = true; }
G.skipVictory = endVictoryScene;
function tickCutscene(dt) {
  const s = G.cutscene;
  if (!s) return false;
  s.t += dt;
  const a = s.t * 0.35, r = 20;
  camera.position.set(s.x + Math.cos(a) * r, s.y + 12 + Math.sin(s.t * 0.5) * 2, s.z + Math.sin(a) * r);
  camera.lookAt(s.x, s.y + 3, s.z);
  if (Math.random() < 0.3) puff(s.x + (Math.random() - 0.5) * 4, s.y + 3.5, s.z + (Math.random() - 0.5) * 4, "ember");
  if (s.t >= s.dur) endVictoryScene();
  return true;
}
// Hints before the fight: the Cinder Eye pulls toward the Ember Depths, and the Boarkin tell stories
function throwCinderEye() {
  const p = G.player;
  if (G.dim !== "nether") { UI.toast("The Cinder Eye tugs downward, toward the Ember Depths. Throw it there.", ""); return; }
  const C = chooseCitadel();
  ents.addProjectile("eye", p.pos.x, p.pos.y + 1.5, p.pos.z, 0, 0, 0, { tx: C.x + 0.5, tz: C.z + 0.5, noGrav: true, fromPlayer: true, item: I.CINDER_EYE });
  const sl = G.inv.slots[G.useSlot]; if (sl && !G.creative) { sl.n--; if (!sl.n) G.inv.slots[G.useSlot] = null; }
  G.hudDirty = true; heldId = -1; Sound.mob("fireshoot", 0); G.adv("cindereye");
  const dist = Math.hypot(C.x - p.pos.x, C.z - p.pos.z);
  UI.toast(dist < 40 ? "The eye dives toward the citadel. It's right here!" : `The eye streaks away… the citadel is about ${Math.round(dist / 10) * 10} blocks that way.`, "good");
}
const CINDER_HINTS = [
  "A deep rumble rolls through the Ember Depths, like something huge breathing far away.",
  "The Boarkin whisper about a citadel of cinders where a dragon of embers sleeps.",
  "Scorch marks on the rock point one way… toward something very hot."
];
function cinderHint() {
  const d = G.dimData.nether || {}, n = d.hints || 0, c = cinderData();
  if (G.mode !== "survival" || c.firstWin || n >= CINDER_HINTS.length + 1) return;
  d.hints = n + 1;
  if (n < CINDER_HINTS.length) setTimeout(() => UI.toast(CINDER_HINTS[n], ""), 4000);
  else if (endData().wyrmDefeated) setTimeout(() => UI.toast("You carry the Wyrm's last secret: a Cinder Eye. Throw it here to find Cindermaw's citadel.", "good"), 4000);
}

// ---------- Respawn Anchors and Lodestones ----------
// A Respawn Anchor holds up to 4 charges of Shinestone. In the Ember Depths, right-clicking a charged anchor makes it your
// respawn point; each time you wake up there it uses 1 charge. Anywhere else a charged anchor explodes when used (after a warning).
let anchorWarn = 0;
function useAnchor(hit) {
  const w = G.world, v = hit.v, charge = metaOf(v) & 7, key = hit.x + "," + hit.y + "," + hit.z;
  const hand = [G.selected, OFF].find(i => G.inv.slots[i] && G.inv.slots[i].id === B.SHINESTONE);
  if (hand !== undefined && charge < ANCHOR_MAX) {
    w.set(hit.x, hit.y, hit.z, make(B.RESPAWN_ANCHOR, charge + 1));
    if (!G.creative) { const s = G.inv.slots[hand]; s.n--; if (!s.n) G.inv.slots[hand] = null; }
    Sound.mob("fireshoot", 0); puff(hit.x + 0.5, hit.y + 1.1, hit.z + 0.5, "ember"); G.hudDirty = true; heldId = -1; offId = -1;
    UI.toast(`Respawn Anchor charged: ${charge + 1} of ${ANCHOR_MAX}.`, "good"); return;
  }
  if (!G.world.gen.isNether()) {
    if (!charge) { UI.toast("Respawn Anchors only work in the Ember Depths. Charge one there with Shinestone."); return; }
    if (performance.now() - anchorWarn > 4000) { anchorWarn = performance.now(); UI.toast("Careful! A charged Respawn Anchor explodes outside the Ember Depths. Use it again to set it off.", "bad"); return; }
    w.set(hit.x, hit.y, hit.z, B.AIR); explode(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 4, null); return;
  }
  if (!charge) { UI.toast("This Respawn Anchor has no charge. Right-click it while holding Shinestone (up to 4)."); return; }
  G.player.anchor = { x: hit.x, y: hit.y, z: hit.z };
  Sound.levelUp(); puff(hit.x + 0.5, hit.y + 1.2, hit.z + 0.5, "portal");
  UI.toast(`Respawn point set in the Ember Depths (${charge} charge${charge > 1 ? "s" : ""} left). A bed on the Surface replaces it.`, "good");
  G.adv("anchor");
}
// Safe place to wake up next to an anchor: a spot with floor below and two clear blocks above (never lava or fire)
function anchorSpot(a) {
  const w = G.world;
  for (const r of [1, 2]) for (let dy = 0; dy >= -1; dy--) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    const x = a.x + dx, y = a.y + dy, z = a.z + dz;
    if (dx === 0 && dz === 0) continue;
    const bad = id => id === B.LAVA || id === B.FIRE || id === B.MAGMA;
    if (SOLID[w.id(x, y - 1, z)] && !bad(w.id(x, y - 1, z)) && !SOLID[w.id(x, y, z)] && !SOLID[w.id(x, y + 1, z)] && !bad(w.id(x, y, z)) && !bad(w.id(x, y + 1, z))) return { x: x + 0.5, y, z: z + 0.5 };
  }
  return null;
}
// Lodestones: right-click one with a Compass to make the compass point to it, even from far away
function bindCompass(hit) {
  const hand = [G.selected, OFF].find(i => G.inv.slots[i] && G.inv.slots[i].id === I.COMPASS);
  if (hand === undefined) { UI.toast("Right-click a Lodestone while holding a Compass to link them."); return; }
  const s = G.inv.slots[hand];
  s.lode = { x: hit.x, y: hit.y, z: hit.z, dim: G.dim }; delete s.lodeLost;
  Sound.mob("crystal", 0); puff(hit.x + 0.5, hit.y + 1.1, hit.z + 0.5, "xp");
  UI.toast(`Compass linked to this Lodestone ${dimWhere(G.dim)}.`, "good"); G.hudDirty = true;
  G.adv("lodestone");
}
// Where a held compass points: { yaw, text } (yaw = null means it spins)
function compassReading() {
  const s = [G.inv.slots[G.selected], G.inv.slots[OFF]].find(q => q && q.id === I.COMPASS);
  if (!s && [G.inv.slots[G.selected]?.id, G.inv.slots[OFF]?.id].includes(I.CLOCK)) {   // Milestone 22, Part C: the clock shows the sun and moon
    if (G.dim !== "overworld" && !G.world?.gen?.landBiome) return { yaw: null, text: "The clock spins. There's no sun here." };
    const t = G.time, part = t < 0.04 || t > 0.97 ? "Sunrise" : t < 0.2 ? "Morning" : t < 0.3 ? "Noon" : t < 0.47 ? "Afternoon" : t < 0.53 ? "Sunset" : t < 0.75 ? "Night" : "Late night";
    G.adv("clock");
    return { yaw: -(t * Math.PI * 2 - Math.PI / 2), text: `${part} · day ${G.meta?.day || 1}` };
  }
  if (!s) {   // the Lost Civilization's map and compass use the same dial
    const held = [G.inv.slots[G.selected], G.inv.slots[OFF]].map(q => q && q.id);
    if (held.includes(I.ECHO_COMPASS)) return L.echoReading();
    if (held.includes(I.EXPLORER_MAP)) return ST.reading();
    if (held.includes(I.SURVEY_MAP)) return L.surveyReading();
    return null;
  }
  const p = G.player;
  let t = null, text;
  if (s.lode) {
    if (s.lodeLost) text = "The Lodestone is gone";
    else if (s.lode.dim !== G.dim) text = `Lodestone is ${dimWhere(s.lode.dim)}`;
    else if (G.world.isLoaded(s.lode.x, s.lode.z) && G.world.id(s.lode.x, s.lode.y, s.lode.z) !== B.LODESTONE) { s.lodeLost = true; text = "The Lodestone is gone"; }
    else { t = s.lode; text = `Lodestone: ${Math.round(Math.hypot(t.x + 0.5 - p.pos.x, t.z + 0.5 - p.pos.z))} blocks`; }
  } else if (G.dim === (p.spawn.dim || worldHome(G.meta))) { t = p.spawn; text = `Spawn: ${Math.round(Math.hypot(t.x - p.pos.x, t.z - p.pos.z))} blocks`; }
  else text = "The needle spins here";
  if (!t) return { yaw: null, text };
  const ang = Math.atan2(-(t.x + 0.5 - p.pos.x), -(t.z + 0.5 - p.pos.z));   // same angle system as the player's yaw
  return { yaw: ang - p.yaw, text };
}
let compassSpin = 0;
function updateCompassHud(dt) {
  const el = document.getElementById("compass"), r = G.state === "play" || G.state === "panel" ? compassReading() : null;
  el.hidden = !r;
  if (!r) return;
  compassSpin += dt * 6;
  el.querySelector("i").style.transform = `rotate(${r.yaw === null ? compassSpin : -r.yaw}rad)`;
  el.querySelector("b").textContent = r.text;
}

// ---------- experience ----------
const XP_FOR = lvl => 2 * lvl + 7;   // points to go from this level to the next
function levelInfo(total) { let lvl = 0, left = total; while (left >= XP_FOR(lvl)) { left -= XP_FOR(lvl); lvl++; } return { level: lvl, frac: left / XP_FOR(lvl) }; }
G.levelInfo = () => levelInfo(G.xp);
// Take whole levels away, keeping how far you were into the level (like Java)
function spendLevels(k) {
  const { level, frac } = levelInfo(G.xp), to = Math.max(0, level - k);
  let t = 0; for (let l = 0; l < to; l++) t += XP_FOR(l);
  G.xp = Math.floor(t + frac * XP_FOR(to)); G.hudDirty = true;
}
// ---------- Milestone 15: the Enchanting Table (offers come from js/enchanting.js) ----------
G.enchantState = key => {
  const c = G.world.containers.get(key);
  if (!c) return null;
  const [x, y, z] = key.split(",").map(Number), shelves = EN.bookshelfPower(G.world, x, y, z);
  if (!Number.isFinite(G.story.enchSeed)) G.story.enchSeed = Math.floor(Math.random() * 2 ** 31);   // offers stay the same until you enchant something
  return { c, x, y, z, shelves, offers: EN.tableOffers(G.story.enchSeed, c.slots[0], shelves), level: levelInfo(G.xp).level };
};
G.enchantChoose = (key, i) => {
  const st = G.enchantState(key);
  if (!st) return;
  const o = st.offers[i], item = st.c.slots[0], lap = st.c.slots[1];
  if (!o || !item) return;
  if (!G.creative) {
    if (st.level < o.cost) { UI.toast(`You need to be level ${o.cost} for that one.`, "bad"); Sound.error(); return; }
    if (!lap || lap.id !== I.LAPIS || lap.n < i + 1) { UI.toast(`That one needs ${i + 1} Lapis.`, "bad"); Sound.error(); return; }
    spendLevels(i + 1); lap.n -= i + 1; if (!lap.n) st.c.slots[1] = null;
  }
  const out = item.id === I.BOOK ? { id: I.ENCH_BOOK, n: 1 } : { ...item };
  out.ench = Object.fromEntries(o.ench);
  st.c.slots[0] = out;
  G.story.enchSeed = Math.floor(Math.random() * 2 ** 31);
  for (let k = 0; k < 6; k++) puff(st.x + 0.5 + (Math.random() - 0.5), st.y + 1.2 + Math.random() * 0.6, st.z + 0.5 + (Math.random() - 0.5), "void");
  Sound.enchant(); G.adv("enchant", o.cost);
  UI.toast(`Enchanted: ${o.ench.map(([k, l]) => EN.enchName(k, l)).join(", ")}`, "good");
  UI.refreshPanel(); G.hudDirty = true;
};
// ---------- Milestone 15, Part B: the Anvil and the Grindstone (rules in js/enchanting.js) ----------
const anvilNames = new WeakMap();   // container → { item, name } (the name box resets when a different item goes in)
G.anvilState = key => {
  const c = G.world.containers.get(key);
  if (!c) return null;
  let nm = anvilNames.get(c);
  if (!nm || nm.item !== c.slots[0]) { nm = { item: c.slots[0], name: c.slots[0]?.name || "" }; anvilNames.set(c, nm); }
  const [x, y, z] = key.split(",").map(Number);
  return { c, x, y, z, name: nm.name, res: EN.anvilResult(c.slots[0], c.slots[1], nm.name, G.creative), level: levelInfo(G.xp).level };
};
G.anvilRename = (key, name) => { const c = G.world.containers.get(key), nm = c && anvilNames.get(c); if (nm) nm.name = String(name).slice(0, 30); };
G.anvilMake = key => {
  const st = G.anvilState(key), res = st && st.res;
  if (!res || !res.out) return;
  if (res.too) { UI.toast("Too expensive! Grind it clean or use a fresh item.", "bad"); Sound.error(); return; }
  if (!G.creative && st.level < res.cost) { UI.toast(`You need ${res.cost} levels for that.`, "bad"); Sound.error(); return; }
  if (!G.creative) spendLevels(res.cost);
  const { c } = st, renamed = (res.out.name || "") !== (c.slots[0].name || "");
  c.slots[0] = null;
  if (c.slots[1] && res.used) { c.slots[1].n -= res.used; if (c.slots[1].n <= 0) c.slots[1] = null; }
  const left = G.inv.add(res.out.id, 1, res.out);
  if (left) spawnDrop(res.out.id, 1, G.player.pos.x, G.player.pos.y + 1, G.player.pos.z, res.out);
  Sound.anvil(); if (res.used) G.adv("anvil", "work"); if (renamed) G.adv("anvil", "rename");
  puff(st.x + 0.5, st.y + 1.1, st.z + 0.5, "poof");
  // the Anvil wears out: 12% of uses, chipped → damaged → broken (never in Creative)
  if (!G.creative && Math.random() < 0.12) {
    const v = G.world.get(st.x, st.y, st.z), m = metaOf(v), dmg = (m >> 2) & 3;
    if (dmg >= 2) { G.closePanel(); G.world.set(st.x, st.y, st.z, B.AIR); Sound.breakBlock("stone"); burst(st.x, st.y, st.z, v, 16); Sound.anvil(true); UI.toast("The Anvil broke!", "bad"); G.hudDirty = true; return; }
    G.world.set(st.x, st.y, st.z, make(B.ANVIL, (m & 3) | ((dmg + 1) << 2)));
    UI.toast(dmg ? "The Anvil is badly damaged." : "The Anvil got chipped.", "bad");
  }
  G.hudDirty = true; UI.refreshPanel();
};
G.grindState = key => {
  const c = G.world.containers.get(key);
  if (!c) return null;
  const [x, y, z] = key.split(",").map(Number);
  return { c, x, y, z, res: EN.grindResult(c.slots[0], c.slots[1]) };
};
G.grindMake = key => {
  const st = G.grindState(key), res = st && st.res;
  if (!res || !res.out) return;
  st.c.slots[0] = st.c.slots[1] = null;
  const left = G.inv.add(res.out.id, 1, res.out);
  if (left) spawnDrop(res.out.id, 1, G.player.pos.x, G.player.pos.y + 1, G.player.pos.z, res.out);
  if (res.xp) spawnOrbs(res.xp, st.x + 0.5, st.y + 1.2, st.z + 0.5);
  Sound.grind(); G.adv("grind");
  G.hudDirty = true; UI.refreshPanel();
};
// Closing the table hands back what was in it (a full pack drops the rest at your feet)
G.enchantClose = key => {
  const c = G.world && G.world.containers.get(key);
  if (!c || !["enchant", "anvil", "grind"].includes(c.type)) return;
  for (const s of c.slots) if (s) { const left = G.inv.add(s.id, s.n, s); if (left) spawnDrop(s.id, left, G.player.pos.x, G.player.pos.y + 1, G.player.pos.z, s); }
  G.world.containers.delete(key); G.hudDirty = true;
};
const orbGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
function spawnOrbs(n, x, y, z) {
  while (n > 0 && G.orbs.length < 60) {
    const v = Math.min(n, n > 10 ? 5 : n > 3 ? 3 : 1); n -= v;
    const mesh = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: 0x9dff4a, fog: false }));
    mesh.position.set(x, y, z); scene.add(mesh);
    G.orbs.push({ v, x, y, z, vx: (Math.random() - 0.5) * 2, vy: 3, vz: (Math.random() - 0.5) * 2, age: 0, mesh });
  }
}
// Mending: experience you pick up repairs a worn Mending item you're holding or wearing (2 uses per point) before it counts toward levels
const maxDur = s => { const d = itemDef(s.id); return d.tool ? d.tool.dur : d.armor ? d.armor.dur : 0; };
function mend(v) {
  const worn = [G.selected, OFF, 36, 37, 38, 39].map(i => G.inv.slots[i]).filter(s => s && EN.lvl(s, "mending") && s.dur !== undefined && s.dur < maxDur(s));
  if (!worn.length) return v;
  const s = worn[Math.floor(Math.random() * worn.length)], fix = Math.min(v * 2, maxDur(s) - s.dur);
  s.dur += fix;
  return Math.max(0, v - Math.ceil(fix / 2));
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
      G.xp += mend(o.v); o.gone = true; Sound.xp(); G.hudDirty = true;
      if (levelInfo(G.xp).level > before) { Sound.levelUp(); UI.toast(`Level ${levelInfo(G.xp).level}!`, "good"); }
    }
    if (o.age > 300) o.gone = true;
  }
  G.orbs = G.orbs.filter(o => { if (o.gone) { scene.remove(o.mesh); o.mesh.material.dispose(); return false; } return true; });
}

// ---------- explosions ----------
function explode(x, y, z, power, src) {
  const w = G.world, p = G.player, dist = Math.hypot(p.pos.x - x, p.pos.y + 0.9 - y, p.pos.z - z);
  Sound.explode(dist); R.vibrate(x, y, z, 15);
  for (let i = 0; i < 5; i++) puff(x + (Math.random() - 0.5) * power, y + (Math.random() - 0.5) * power, z + (Math.random() - 0.5) * power, "poof");
  // blocks
  const mobBlast = G.meta.ultra && src?.def;
  const griefing = (G.wset.griefing && !mobBlast) || !(src && src.def);   // Blast Blocks always break things; creatures only if allowed
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
  for (const contact of ents.areaNear(x, y, z, reach)) {
    const e = contact.ent, d = e.def.segmentedLeviathan && !e.tame ? contact.distance : Math.hypot(e.pos.x - x, e.pos.y + e.h / 2 - y, e.pos.z - z), k = Math.max(0, 1 - d / reach);
    const l = Math.hypot(e.pos.x - x, e.pos.z - z) || 1;
    ents.damage(e, Math.round(k * power * 5), "explosion", { x: (e.pos.x - x) / l * k * 1.5, z: (e.pos.z - z) / l * k * 1.5 });
  }
  MP.blast(x, y, z, reach, power, src);   // Play Together: friends nearby get caught too
  const covered = mobBlast && !lineOfSight(w, { x, y, z }, { x: p.pos.x, y: p.pos.y + 1, z: p.pos.z });
  if (dist < reach && !covered && !(mobBlast && G.meta.ultra.elapsed < 30)) {
    const k = 1 - dist / reach, mul = { peaceful: 0.4, easy: 0.6, normal: 1, hard: 1.4 }[G.wset.difficulty] || 1;
    const l = Math.hypot(p.pos.x - x, p.pos.z - z) || 1;
    p.vel.x += (p.pos.x - x) / l * k * 12; p.vel.z += (p.pos.z - z) / l * k * 12; p.vel.y += k * 8;
    hurt(Math.min(mobBlast ? 5 : Infinity, Math.round(k * power * 4.5 * mul)), src && src.def ? `A ${src.def.name} exploded next to you!` : "You were caught in an explosion!", mobBlast ? src : null, false, "blast");
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
    if (id === B.FARMLAND) {   // Milestone 18: bare farmland dries out, then turns back into dirt without water nearby
      const above = w.id(x, y + 1, z);
      if (above && above !== B.AIR && BLOCKS[above]?.shape === "crop") { soilWater(x, y, z); continue; }
      if (hydrate(x, y, z)) { soilWater(x, y, z); continue; }
      if (metaOf(v) & WET) { if (Math.random() < 1 / 20) w.set(x, y, z, make(B.FARMLAND, 0)); }
      else if (Math.random() < 1 / 40) { w.set(x, y, z, B.DIRT); w.crops.delete(key); }
      continue;
    }
    if (id === B.MELON_STEM || id === B.PUMPKIN_STEM) {   // Milestone 16: grows like wheat, then keeps making melons on the ground beside it (Milestone 22: pumpkins too)
      const fruit = id === B.MELON_STEM ? B.MELON : B.PUMPKIN;
      soilWater(x, y - 1, z);
      const stage = metaOf(v) & 7, soil = w.get(x, y - 1, z), wet = idOf(soil) === B.FARMLAND && (metaOf(soil) & WET);
      if (stage < 7) { if (Math.random() < (wet ? 1 / 12 : 1 / 30)) w.set(x, y, z, make(id, stage + 1)); continue; }
      const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      if (sides.some(([dx, dz]) => w.id(x + dx, y, z + dz) === fruit) || Math.random() >= 1 / 25) continue;
      const [dx, dz] = sides[Math.floor(Math.random() * 4)];
      if (w.id(x + dx, y, z + dz) === B.AIR && [B.GRASS, B.DIRT, B.FARMLAND].includes(w.id(x + dx, y - 1, z + dz))) w.set(x + dx, y, z + dz, fruit);
      continue;
    }
    if (isCrop(id)) {
      const stage = metaOf(v) & 7;
      if (stage >= 7) { w.crops.delete(key); continue; }
      soilWater(x, y - 1, z);   // Milestone 18: the farmland under it dries out or gets wet again
      const soil = w.get(x, y - 1, z), wet = idOf(soil) === B.FARMLAND && (metaOf(soil) & WET);
      if (Math.random() < (wet ? 1 / 12 : 1 / 30)) w.set(x, y, z, make(id, stage + 1));
    } else if (id === B.SAPLING) { if (Math.random() < 1 / 90) growTree(x, y, z, metaOf(v) & 1); }
    else if (BLOCKS[id]?.tree) { if (Math.random() < 1 / 90) growWood(x, y, z, BLOCKS[id].tree); }   // Milestone 20
    else if (id === B.CACTUS || id === B.BAMBOO) {   // Milestone 20: cactus up to 3 tall, bamboo up to 12
      const max = id === B.CACTUS ? 3 : 12; let h = 1; while (h < max && w.id(x, y - h, z) === id) h++;
      if (h >= max || w.id(x, y + 1, z) !== B.AIR) w.crops.delete(key);
      else if (Math.random() < (id === B.CACTUS ? 1 / 40 : 1 / 12)) { w.set(x, y + 1, z, id); w.crops.delete(key); w.crops.add(x + "," + (y + 1) + "," + z); }
    }
    else if (id === B.KELP) {   // Milestone 17: kelp grows up toward the surface, up to about 16 tall
      let h = 1; while (h < 16 && w.id(x, y - h, z) === B.KELP) h++;
      if (h >= 16 || w.id(x, y + 1, z) !== B.WATER || w.id(x, y + 2, z) === B.AIR) w.crops.delete(key);
      else if (Math.random() < 1 / 30) { w.set(x, y + 1, z, B.KELP); w.crops.delete(key); w.crops.add(x + "," + (y + 1) + "," + z); }
    }
    else if (id === B.CONDUIT) conduitTick(x, y, z, key);   // Milestone 17, Part B
    else if (id === B.TURTLE_EGG) {   // Milestone 17, Part D: eggs on sand crack in 3 steps (faster at night), then baby turtles come out
      const m = metaOf(v), st = (m >> 2) & 3, night = G.time > 0.5;
      if (w.id(x, y - 1, z) !== B.SAND && w.id(x, y - 1, z) !== B.RED_SAND) continue;
      if (Math.random() < (night ? 1 / 40 : 1 / 160)) {
        if (st < 2) w.set(x, y, z, make(B.TURTLE_EGG, (m & 3) | ((st + 1) << 2)));
        else { w.set(x, y, z, B.AIR); w.crops.delete(key); for (let k = 0; k <= (m & 3); k++) ents.add("turtle", x + 0.3 + Math.random() * 0.4, y, z + 0.3 + Math.random() * 0.4, { baby: true, persist: true }); puff(x + 0.5, y + 0.3, z + 0.5, "poof"); }
      }
    }
    else if (BLOCKS[id]?.deadAs) {   // Milestone 17: a coral block with nothing watery touching it dies after a few seconds
      if (touchesWater(x, y, z)) w.crops.delete(key);
      else if (Math.random() < 0.3) { w.set(x, y, z, BLOCKS[id].deadAs); w.crops.delete(key); }
    }
    else if (id === B.CAVE_VINES) {   // Milestone 20: vines grow glow berries, and now and then grow one longer
      if (!(metaOf(v) & 1) && Math.random() < 1 / 60) w.set(x, y, z, make(B.CAVE_VINES, 1));
      else if (Math.random() < 1 / 200 && w.id(x, y - 1, z) === B.AIR && w.id(x, y + 4, z) !== B.CAVE_VINES) { w.set(x, y - 1, z, make(B.CAVE_VINES, 0)); w.crops.add(x + "," + (y - 1) + "," + z); }
    }
    else if (id === B.COCOA) {   // three sizes; the facing stays
      const m = metaOf(v), age = (m >> 2) & 3;
      if (age >= 2) w.crops.delete(key); else if (Math.random() < 1 / 30) w.set(x, y, z, make(B.COCOA, (m & 3) | ((age + 1) << 2)));
    }
    else if (id === B.EMBER_WART) {   // grows anywhere, slowly, while it sits on Wailing Sand
      const stage = metaOf(v) & 7;
      if (stage >= 7 || w.id(x, y - 1, z) !== B.SOUL_SAND) w.crops.delete(key);
      else if (Math.random() < 1 / 25) w.set(x, y, z, make(B.EMBER_WART, stage + 1));
    }
    else if (id === B.FROSTED_ICE) {   // Frost Walker ice melts in 4 steps
      if (Math.random() < 0.2) { const age = metaOf(v) & 3; if (age >= 3) { w.set(x, y, z, B.WATER); w.crops.delete(key); } else w.set(x, y, z, make(B.FROSTED_ICE, age + 1)); }
    }
    else if (id === B.SUGAR_CANE) {   // grows up to 3 tall
      let h = 1; while (h < 3 && w.id(x, y - h, z) === B.SUGAR_CANE) h++;
      if (h >= 3 || w.id(x, y + 1, z) !== B.AIR) w.crops.delete(key);
      else if (Math.random() < 1 / 45) { w.set(x, y + 1, z, B.SUGAR_CANE); w.crops.delete(key); w.crops.add(x + "," + (y + 1) + "," + z); }
    }
    else if (id === B.BERRY_BUSH) {
      const stage = metaOf(v) & 3;
      if (stage >= 3) w.crops.delete(key);
      else if (Math.random() < 1 / 40) w.set(x, y, z, make(B.BERRY_BUSH, stage + 1));
    }
    else w.crops.delete(key);
  }
}
// Milestone 17, Part A
function touchesWater(x, y, z) { const w = G.world; return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([a, b, c]) => WATERY[w.id(x + a, y + b, z + c)]); }
// A Sponge soaks up the water around it (up to 7 blocks away, at most 65 blocks of water) and becomes a Wet Sponge.
// Water plants in that water are soaked up too; coral blocks left high and dry start to die.
function soakUp(x, y, z) {
  const w = G.world, seen = new Set([x + "," + y + "," + z]), queue = [[x, y, z, 0]], dry = [];
  let n = 0;
  while (queue.length && n < 65) {
    const [qx, qy, qz, d] = queue.shift();
    for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const nx = qx + a, ny = qy + b, nz = qz + c, k = nx + "," + ny + "," + nz;
      if (seen.has(k) || n >= 65) continue;
      seen.add(k);
      const nid = w.id(nx, ny, nz);
      if (BLOCKS[nid]?.deadAs) dry.push(k);
      if (!WATERY[nid] || d >= 7) continue;
      w.set(nx, ny, nz, B.AIR); n++;
      queue.push([nx, ny, nz, d + 1]);
    }
  }
  if (!n) return;
  w.set(x, y, z, B.WET_SPONGE);
  for (const k of dry) w.crops.add(k);
  Sound.splash(); G.adv("sponge", n);
  UI.toast(`The Sponge soaked up ${n} block${n === 1 ? "" : "s"} of water.`);
}
// Milestone 18: set a farmland block wet or dry depending on water within 4 blocks
function soilWater(x, y, z) {
  const w = G.world, v = w.get(x, y, z);
  if (idOf(v) !== B.FARMLAND) return;
  const wet = hydrate(x, y, z), has = !!(metaOf(v) & WET);
  if (wet && !has) w.set(x, y, z, make(B.FARMLAND, WET), true);
  else if (!wet && has && Math.random() < 1 / 20) w.set(x, y, z, make(B.FARMLAND, 0), true);
}
function hydrate(x, y, z) {   // farmland near water stays wet
  const w = G.world;
  if (G.wx?.rain > 0.4 && G.dim === "overworld" && skyCols.rainedOn(x + 0.5, y + 1, z + 0.5)) return true;   // Milestone 19: rain waters it too
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (isWet(w.get(x + dx, y, z + dz)) || isWet(w.get(x + dx, y + 1, z + dz))) return true;
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

// Milestone 20, Part B: the six new trees grow from their saplings (shapes in js/trees.js). Dark oak needs 4 saplings in a square.
function growWood(x, y, z, kind) {
  const w = G.world, sap = w.id(x, y, z);
  let bx = x, bz = z;
  if (NEEDS_SQUARE.has(kind)) {
    const corner = [[0, 0], [-1, 0], [0, -1], [-1, -1]].find(([ox, oz]) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => w.id(x + ox + a, y, z + oz + b) === sap));
    if (!corner) return false;
    bx = x + corner[0]; bz = z + corner[1];
  }
  const shape = treeShape(kind, Math.random);
  const soft = v => !v || v === sap || BLOCKS[v]?.replaceable || BLOCKS[v]?.drops === "leaves" || v === B.WATER;
  for (const [dx, dy, dz, , isWood] of shape) if (isWood && !soft(w.id(bx + dx, y + dy, bz + dz))) return false;   // not enough room
  for (const [dx, dy, dz, v, isWood] of shape) {
    const id = w.id(bx + dx, y + dy, bz + dz);
    if (isWood ? soft(id) : (!id || BLOCKS[id]?.replaceable)) w.set(bx + dx, y + dy, bz + dz, v);
    w.crops.delete((bx + dx) + "," + (y + dy) + "," + (bz + dz));
  }
  return true;
}
G.growWood = growWood;

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
  g.setAttribute("lt", new THREE.BufferAttribute(b.lt, 3)); if (b.cl) g.setAttribute("cl", new THREE.BufferAttribute(b.cl, 1)); g.setIndex(new THREE.BufferAttribute(b.index, 1));
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
  c.dirty = false; c.urgent = false; c.soft = false; c.meshT = performance.now(); G.world.dirtyQueue.delete(c);
}
const neighborsReady = c => { for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (!G.world.chunks.has(chunkKey(c.cx + dx, c.cz + dz))) return false; return true; };
let unloadTick = 0;
function stream(budget) {
  const w = G.world, t0 = performance.now(), R = G.settings.renderDist;
  const pcx = Math.floor(G.player.pos.x / CHUNK), pcz = Math.floor(G.player.pos.z / CHUNK);
  // edits near the player first
  const now = performance.now(), calm = c => c.soft && !c.urgent && now - (c.meshT || 0) < 120;   // a signal flickering doesn't redraw every frame
  let priorityN = 0, softN = 0;
  for (const c of w.dirtyQueue) {
    // Always allow one nearby edit to appear. Bursts of edits share the rest
    // of the streaming budget, including from machinery or explosions.
    if (priorityN >= 3 || (priorityN && performance.now() - t0 > budget)) break;
    if (Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) > R ||
        !(c.urgent || (c.soft && softN < 2 && !calm(c))) || !neighborsReady(c)) continue;
    if (!c.urgent) softN++;
    meshChunk(c);
    priorityN++;
  }
  for (const [dx, dz] of OFFSETS[R + 1]) {
    if (performance.now() - t0 > budget) break;
    if (!w.chunks.has(chunkKey(pcx + dx, pcz + dz))) w.load(pcx + dx, pcz + dz);
  }
  for (const [dx, dz] of OFFSETS[R]) {
    if (performance.now() - t0 > budget) break;
    const c = w.chunks.get(chunkKey(pcx + dx, pcz + dz));
    if (c && c.dirty && !calm(c) && neighborsReady(c)) meshChunk(c);
  }
  if (++unloadTick % 30 === 0) {
    for (const c of [...w.chunks.values()]) {
      if (Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) > R + 2) { disposeMesh(c); w.unload(c); }
      else if (c.mesh && Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) > R) { disposeMesh(c); c.dirty = true; }
    }
  }
}
function clearWorldMeshes() {
  raids.clear();
  festivals.clear();
  GC.clear();
  ancientIntroView?.dispose(); ancientIntroView = null;
  ancientTremorRoll = 0;
  ancientBuriedView.clear();
  ancientOpeningView.clear();
  clearAncientFury();
  clearAncientArrival();
  clearAncientWarning();
  stormActivity.reset(); stormActivityElapsed = 0;
  creativeStormUntil = 0;
  clearObsidianWarning();
  clearObsidianVentWarning();
  clearDuneWarning();
  clearDuneSweep();
  clearDuneDevour();
  clearDuneVortex();
  leviathanWarningHUD.clear();
  clearSandsHeat();
  clearQuicksand();
  clearCrystalResonance();
  clearArmorShieldView();
  clearMountedBurrow(false);
  clearMountedLeviathanAttack();
  scarabVaultGuards = null;
  clearArenaFractures();
  leviathanJournalT = 0;
  for (const effect of ancientSpikes) effect.dispose();
  ancientSpikes.length = 0;
  clearSolkaraCore();
  clearSolkaraGateView();
  clearSolkaraMural();
  hollowArrivalUntil = 0;
  hollowArrival.hidden = true;
  clearHollowDrift();
  sandsSampleT = 0;
  sandsRegion = 0;
  G.sandsWaypoint = null;
  G.sandsWaypointHidden = false;
  sandsHaze.setHex(SANDS_REGIONS[0].haze);
  Sound.wind(0); Sound.rain(0); wxView?.hide(); for (const b of bolts) scene.remove(b.g); bolts.length = 0; flashT = 0;
  Sound.ancientMusic(null);
  Sound.calmMusicEnd();
  Sound.bossMusicEnd();
  stormStage = 0; stormSampleT = 0; stormDustT = 0;
  badlandsAsh = 0; badlandsAshT = 0;
  stormVortex = null; stormVortexT = 10;
  duneInterest = 0;
  clearBeams();
  if (G.world) for (const c of G.world.chunks.values()) disposeMesh(c);
  for (const d of G.drops) removeDrop(d);
  G.drops = [];
  while (parts.length) freeParticles.push(parts.pop());
  ents.clear(); if (G.companions) G.companions.clear();
  for (const o of G.orbs) { scene.remove(o.mesh); o.mesh.material.dispose(); } G.orbs = [];
  for (const t of primed) { scene.remove(t.mesh); t.mesh.material.dispose(); } primed.length = 0;
}

// ---------- dimensions: each has its own generator, block changes, containers, and creatures ----------
function makeWorld(dim, reopening = false) {
  if (!G.dimData[dim]) {
    if (dim === HOLLOW_SANDS) G.dimData[dim] = { sandsLandmarks: SANDS_LANDMARK_LAYOUT, solkaraScenery: SOLKARA_SCENERY_LAYOUT };
    else if (isSolkaraRealm(dim)) G.dimData[dim] = { solkaraScenery: SOLKARA_SCENERY_LAYOUT };
  }
  const data = G.dimData[dim] || (G.dimData[dim] = {});
  const region = Object.hasOwn(LOST_WORLD_REGIONS, dim) ? LOST_WORLD_REGIONS[dim] : null;
  if (region) data.layout ??= region.layout;
  const gen = region ? new region.Generator(G.meta.seed, !!G.story.lostWorld) : dim === LOST_WORLD ? new LostWorldGenerator(G.meta.seed, G.meta.lostWorldGen, !!G.story.lostWorld) :
    dim === SOLKARA_SANCTUARY ? new SolkaraSanctuaryGen(data.solkaraScenery) : dim === HOLLOW_SANDS ? new HollowSandsGen(G.meta.seed, data.sandsLandmarks, data.solkaraScenery) : dim === "nether" ? new NetherGen(G.meta.seed) : dim === "end" ? new EndGen(G.meta.seed, G.meta.gen || 1) : dim === "forsaken" ? new ForsakenGen(G.forsakenTpl) : LOST_DIMS.includes(dim) ? L.gen(dim) : new Generator(G.meta.seed, G.meta.gen || 1);
  const surveyed = dim === "overworld" && gen.version >= GRAND_VILLAGE_GEN ? restoreVillageRecords(data.villages) : null;
  if (LOST_DIMS.includes(dim)) CP.stampDim(dim, gen);   // campaign boss chambers behind the temple vaults
  if (dim === SOLKARA_SANCTUARY) { data.solkaraAnnex = 1; data.solkaraWing = 1; }
  if (dim === "desert") {
    const stamp = buildSolkaraAnnex(data.solkaraScenery);
    gen.stamps ||= [];
    if (data.solkaraAnnex === 1 || annexFits(stamp, data, gen.stamps)) {
      data.solkaraAnnex = 1;
      gen.stamps.push(stamp);
      const wing = buildSolkaraWing();
      if (data.solkaraWing === 1 || annexFits(wing, data, gen.stamps.filter(s => s !== stamp),
          { x0: -62, x1: -23, z0: 34, z1: 58 })) {
        data.solkaraWing = 1;
        gen.stamps.push(wing);
      }
    }
  }
  if (dim === "forsaken") MU.prepareReaches(gen, data);   // the Outer Reaches in the generated ring (old changed chunks keep their shape)
  if (dim === "nether") { gen.citadel = chooseCitadel(); CP.stampNether(gen, data); }   // where Cindermaw's citadel stands in this world (+ the campaign's seal shrines)
  if (dim === "overworld") {
    const villageSafeData = surveyed ? reserveSurveyedVillages(gen, data, surveyed) : data;
    gen.ultraHardcore = !!G.meta.ultra;
    if (!CP.plan(gen, villageSafeData) && !gen.ultraHardcore) ST.plan(gen, villageSafeData);
    const placementData = stonehavenPlacementData(gen, villageSafeData, G.story);
    L.prepareOverworld(gen, placementData);   // the Keeper excavation and temple entrances, stamped into land nobody has visited yet
    if (CP.on()) CP.stamp(gen, data); else if (!gen.ultraHardcore) ST.stamp(gen);   // the village (or the house) goes in last, so nothing else draws over it
    const expansion = G.story.leviathan ||= {};
    const temple = G.story.lost?.tsites?.desert;
    expansion.sites = planRelicSites(gen, placementData, expansion.sites, temple);
    gen.stamps ||= [];
    for (const def of DESERT_SITES) {
      const site = expansion.sites[def.key];
      if (!site) continue;
      if (def.key === "citadel" && site.volcanicLayout === OBSIDIAN_BADLANDS_LAYOUT) gen.stamps.push(buildObsidianBadlands(gen, site));
      gen.stamps.push(buildRelicStamp(def, site));
    }
    CG.reset(); CK.reset(); CD.reset(); CB.reset(); CIT.prepare(gen, villageSafeData);
    if (gen.version === KINGDOMS_GEN || L.loadedSurface() || Object.hasOwn(G.story, "stonehaven")) prepareStonehaven(gen, villageSafeData, G.story);
    if (reopening && !G.guest) CP.applySettlementRenovations(gen, data);
    prepareVillageRenovations(gen, data, G.meta, G.story, reopening && !G.guest);
  }
  const w = new World(gen);
  w.dim = dim;
  if (surveyed) w.settlements = surveyed;
  w.modsFromJSON(data.mods);
  for (const [k, c] of data.containers || []) w.containers.set(k, c);
  if (dim === GODZILLA_CALDERA && !data.calderaCachePlaced) {
    const { x, y, z } = CALDERA_CACHE;
    const key = x + "," + y + "," + z;
    if (!w.containers.has(key)) w.containers.set(key, calderaSupplies());
    data.calderaCachePlaced = true;
  }
  if (dim === "forsaken") F.setupWorld(w, data);   // the map's chests start full on the first visit
  if (LOST_DIMS.includes(dim)) L.setupWorld(w, data);
  for (const k of Object.keys(data.entities || {})) w.entityStore.set(k, data.entities[k]);
  for (const k of data.visited || []) w.visited.add(k);
  for (const k of data.crops || []) w.crops.add(k);
  for (const k of data.newGen || []) w.newGen.add(k);
  for (const [k, v] of data.regions || []) w.regions.set(k, v);   // Milestone 20: which squares got the new biomes
  w.beacons = new Set(data.beacons || []);
  R.attach(w, data.rs);   // the signal engine's timers and comparator outputs
  w.onLoad = c => { if (!G.guest) ents.loadChunk(c); R.chunkLoaded(w, c); };   // a Play Together guest gets no creatures yet (Stage 3)
  w.onUnload = c => ents.unloadChunk(c);
  for (const drop of (Array.isArray(data.drops) ? data.drops.slice(-150) : [])) {
    if (drop && itemDef(drop.id) && Number.isInteger(drop.n) && drop.n > 0 &&
        [drop.x, drop.y, drop.z, drop.vx, drop.vy, drop.vz, drop.age, drop.pickDelay].every(Number.isFinite)) {
      addDrop(drop);
    }
  }
  return w;
}
function dimSnapshot(w) {
  if (w === G.world) R.settle();   // finish any blocks a piston is still sliding
  const old = G.dimData[w.dim] || {};
  if (w.dim === "end") { const dr = ents.list.find(e => e.sp === "dragon" && !e.dead); if (dr) old.wyrmHp = dr.hp; }
  const villages = w.settlements.size ? { villages: [...w.settlements.values()] } : {};
  return { ...old, ...villages, mods: w.modsToJSON(), containers: [...w.containers].filter(([k]) => !String(k).startsWith("cart:")), entities: ents.toJSON(), visited: [...w.visited], crops: [...w.crops], newGen: [...w.newGen], regions: [...w.regions], beacons: [...(w.beacons || [])], portals: old.portals || [], links: old.links || {}, rs: R.toJSON(w), drops: G.drops.map(({ mesh, ...drop }) => drop) };
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
let challengeSaves = Promise.resolve(), releaseChallengeLock = null;

async function lockChallenge(id) {
  if (!navigator.locks) return;
  await new Promise((resolve, reject) => {
    navigator.locks.request("blockhaven-ultra-" + id, { ifAvailable: true }, lock => {
      if (!lock) { reject(new Error("This Ultra Hardcore run is already open in another tab.")); return; }
      return new Promise(release => { releaseChallengeLock = release; resolve(); });
    }).catch(reject);
  });
}
function unlockChallenge() {
  releaseChallengeLock?.();
  releaseChallengeLock = null;
}
const maxHealth = () => survivalMaximum({ mode: G.mode, campaign: G.meta?.campaign, hardcore: G.meta?.hardcore,
  ultra: G.meta?.ultra, expedition: G.story?.lostWorld, guest: G.guest }, G.profile);
const maxAir = () => G.meta?.ultra ? UHC_AIR : 10;
async function startWorld(save) {
  if (save.ultra && (G.guest || !(await Saves.persistent()))) throw new Error("This challenge requires a local single-player save.");
  G.profile = await Saves.profile();
  G.challengeSaveFailed = false;
  if (save.ultra?.fallen) {
    G.meta = null; G.state = "title";
    await UI.showWorlds();
    UI.toast("This Ultra Hardcore run has ended. Create a new run to try again.", "bad");
    return;
  }
  if (save.ultra) await lockChallenge(save.id);
  if (window.PlayCount) PlayCount.hit("blockhaven");
  dismount(true);
  clearWorldMeshes();
  G.state = "loading"; UI.show("loading"); UI.setLoading(0, "Shaping hills and valleys");
  G.meta = save; G.mode = save.mode;
  G.dimData = save.dims || { overworld: { mods: save.mods || {}, containers: save.containers || [] } };
  G.journalTab = save.lostWorldGen ? "expedition" : G.journalTab;
  G.dim = (save.player && save.player.dim) || worldHome(save);
  G.wset = { difficulty: "easy", griefing: true, keepInv: true, fireSpread: true, liquidFlow: true, weather: true, ...(save.settings || {}) };
  G.xp = save.xp || 0; G.effects = {}; G.elv = {}; G.absorb = 0; G.eat = null; G.blocking = false; G.bowT = -1; G.totemGuard = 0;
  G.voidInv = Array.from({ length: 27 }, (_, i) => (save.voidInv && save.voidInv[i] && itemDef(save.voidInv[i].id) ? { ...save.voidInv[i] } : null));
  Adv.load(save.adv); G.story = save.story || {}; G.stats = save.stats || {};
  if (save.hardcore) { G.wset.difficulty = "hard"; G.wset.keepInv = false; }
  if (save.ultra) { G.wset = { ...UHC_SETTINGS }; G.mode = "survival"; }
  G.resting = null; G.challengeNoise = null; G.challengeCheck = 0; G.fatigueHUD = -1;
  G.challengeCueUntil = 0; G.challengeHudSecond = -1; G.challengeDread = 0; G.challengeMusicAt = 0;
  G.challengeDefenses = new Map(); G.challengeBreachAt = 0; document.getElementById("ultraCue").hidden = true;
  G.respawnGuard = 0; iframes = 0; starveT = healT = drownT = effT = regenAcc = 0;
  if (G.dim === "forsaken") {   // the Forsaken World's map has to be downloaded first
    try { UI.setLoading(0.05, "Finding the Forsaken World…"); await F.loadTemplate(); }
    catch (e) { G.dim = "overworld"; if (save.player) save.player.pos = { ...(save.player.spawn || { x: 0, y: 70, z: 0 }) }; UI.toast("The Forsaken World couldn't load right now, so you woke up on the Surface.", "bad"); }
  }
  // the Lost Civilization's maps (the Surface needs the excavation site's map too)
  if (!isLostWorldDimension(G.dim)) try { UI.setLoading(0.08, "Unrolling the Keepers' maps…"); await L.ready(); }
  catch (e) { if (LOST_DIMS.includes(G.dim)) { G.dim = "overworld"; if (save.player) save.player.pos = { ...(save.player.spawn || { x: 0, y: 70, z: 0 }) }; UI.toast("The Deep couldn't load right now, so you woke up on the Surface.", "bad"); } }
  G.world = makeWorld(G.dim, true); G.gen = G.world.gen;
  G.inv = new Inventory(); G.inv.load(save.inventory);
  G.time = save.time ?? 0.02; G.tips = save.tips || {};
  const p = G.player = new Player();
  p.health = maxHealth();
  if (save.player) {
    Object.assign(p.pos, save.player.pos); p.yaw = save.player.yaw || 0; p.pitch = save.player.pitch || 0;
    p.health = Number.isFinite(save.player.health) ? Math.max(0, Math.min(maxHealth(), save.player.health)) : maxHealth(); p.hunger = save.player.hunger ?? 20; p.sat = save.player.sat ?? 5; p.exhaust = save.player.exhaust || 0; p.spawn = save.player.spawn; p.anchor = save.player.anchor || null; p.flying = !!save.player.flying && G.creative;
    // effects you had (like a totem's regeneration) carry over a save
    for (const [k, t] of Object.entries(save.player.effects || {})) if (t > 0) G.effects[k] = t;
    G.elv = { ...(save.player.elv || {}) }; G.absorb = save.ultra ? 0 : save.player.absorb || 0;
  }
  if (save.ultra) { delete G.effects.absorb; if (save.ultra.status === "active") syncChallengeClock(); }
  if (!p.spawn) {   // a new world: start on the path in front of the Starter Home (or at the natural spawn spot)
    const h = G.dim === "overworld" ? (CP.spawnPoint() || (!save.ultra && ST.spawnPoint())) : null, s = h || G.gen.findSpawn();
    p.spawn = { x: s.x, y: h ? h.y : null, z: s.z }; Object.assign(p.pos, { x: s.x, y: h ? h.y : 70, z: s.z });
    if (h) p.yaw = h.yaw;
    else if (G.dim === LOST_WORLD) p.yaw = Math.PI;
  }
  ST.resetClock(); CP.resetSession();
  p.air = save.ultra && Number.isFinite(save.player?.air) ? Math.max(0, Math.min(maxAir(), save.player.air)) : maxAir(); G.selected = 0; G.mining = null; G.hudDirty = true;
  // the page was closed on the "You fainted" screen: wake up properly (Hardcore worlds go straight to Spectator)
  if (save.hardcoreOver && G.mode !== "spectator") G.mode = G.meta.mode = "spectator";
  const needsRespawn = p.health <= 0 && !G.spectator;
  if (needsRespawn && save.ultra) throw new Error("This challenge has no living checkpoint.");
  if (G.spectator) { p.flying = true; p.noclip = true; p.health = 20; }
  // build the land around the player before dropping them in
  await loadArea(p.pos.x, p.pos.z, G.dim === "nether" ? "Heating up the Ember Depths" : "Shaping hills and valleys");
  const cx = Math.floor(p.pos.x / CHUNK), cz = Math.floor(p.pos.z / CHUNK);
  const renovated = G.gen.renovatedNow?.get(chunkKey(cx, cz));
  if (p.spawn.y == null) { placeSafely(p, p.spawn.x, p.spawn.z); p.spawn.y = p.pos.y; }
  else if (renovated) {
    placeSafely(p, renovated.entry?.[0] ?? cx * CHUNK + 2.5, renovated.entry?.[2] ?? cz * CHUNK + 13.5);
  } else if (!save.player) placeSafely(p, p.pos.x, p.pos.z);
  else if (!needsRespawn && p.collides(G.world, p.aabb())) placeSafely(p, p.pos.x, p.pos.z);
  G.autosaveT = 0; heldId = -1; offId = -1;
  portalCooldown = true; portalT = 0;   // waking up inside a portal doesn't send you through it until you step out
  UI.setLoading(1, "Ready!");
  if (needsRespawn) {
    document.body.classList.remove("menu-bg");
    await G.respawn();
    await saveNow(false);
    updateTips();
    return;
  }
  if (save.ultra) await saveChallengeSnapshot(structuredClone(snapshot()));
  else await saveNow(false);
  G.state = "pause"; UI.show("none"); UI.hud();
  document.body.classList.remove("menu-bg");
  G.resume();
  updateTips();
  if (!save.player && G.dim === LOST_WORLD) UI.toast(G.story.lostWorld ?
    "Read the lit tablet by the gravel trail for your expedition briefing." :
    "Gather wood and berries in camp, then follow the gravel trail to Raptor Grove.");
}
const frame = () => new Promise(r => { requestAnimationFrame(() => r()); setTimeout(r, 60); });   // keeps loading even in a background tab

// Put the player on solid ground with room to stand
// Fast travel on the Surface (the campaign's Waystones): build the land there first, then stand on solid ground
async function teleportTo(x, y, z, label) {
  if (G.dim !== "overworld") return;
  const p = G.player; dismount(true);
  G.state = "loading"; UI.show("loading"); UI.setLoading(0, label || "Traveling…");
  Object.assign(p.pos, { x, y, z }); p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
  await loadArea(x, z, label || "Traveling…");
  placeSafely(p, x, z);
  UI.setLoading(1, "Ready!"); G.state = "pause"; UI.show("none"); UI.hud(); G.resume();
}
function placeSafely(p, x, z) {
  const w = G.world;
  // make sure the land there exists first (it may be far from where the player was)
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) w.load(cx + dx, cz + dz);
  if (w.gen.isNether() || G.dim === AMBER_CAVERNS) {   // Look for an open floor near the requested height.
    for (let ring = 0; ring < 8; ring++) for (let dz = -ring; dz <= ring; dz++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
      const bx = Math.floor(x) + dx, bz = Math.floor(z) + dz;
      for (let k = 0; k < 50; k++) for (const y of [Math.floor(p.pos.y) - k, Math.floor(p.pos.y) + k]) {
        if (y < LAVA_LEVEL + 1 || y > HEIGHT - 4) continue;
        if (SOLID[w.id(bx, y - 1, bz)] && !SOLID[w.id(bx, y, bz)] && !SOLID[w.id(bx, y + 1, bz)] && w.id(bx, y, bz) !== B.LAVA && w.id(bx, y - 1, bz) !== B.MAGMA && (G.dim !== AMBER_CAVERNS || y < 44 && w.id(bx, y, bz) !== B.WATER)) { p.pos.x = bx + 0.5; p.pos.y = y; p.pos.z = bz + 0.5; p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; return; }
      }
    }
    if (w.gen.isNether()) return;
  }
  for (let ring = 0; ring < 8; ring++) for (let dz = -ring; dz <= ring; dz++) for (let dx = -ring; dx <= ring; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
    const bx = Math.floor(x) + dx, bz = Math.floor(z) + dz, y = w.surfaceY(bx, bz), top = w.id(bx, y, bz);
    if (top === B.WATER || top === B.LEAVES || top === B.BIRCH_LEAVES || top === B.LOG || top === B.BIRCH_LOG || BLOCKS[top]?.drops === "leaves" || BLOCKS[top]?.log) continue;
    if (SOLID[w.id(bx, y + 1, bz)] || SOLID[w.id(bx, y + 2, bz)]) continue;
    p.pos.x = bx + 0.5; p.pos.z = bz + 0.5; p.pos.y = y + 1; p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
    return;
  }
  p.pos.y = w.surfaceY(Math.floor(x), Math.floor(z)) + 1;
}

function snapshot() {
  raids.capture();
  if (mountedBurrow && !mountedBurrow.session.savePosition) clearMountedBurrow();
  clearArenaFractures();
  const p = G.player;
  G.dimData[G.dim] = dimSnapshot(G.world);
  return {
    ...G.meta, mode: G.mode, version: SAVE_VERSION, played: Date.now(), time: G.time, day: G.meta.day || 1, tips: G.tips, mods: undefined, containers: undefined,
    ...(G.meta.ultra ? { ultra: G.meta.ultra } : {}),
    player: { air: p.air, pos: { ...p.pos }, yaw: p.yaw, pitch: p.pitch, health: p.health, hunger: p.hunger, sat: p.sat, exhaust: p.exhaust, spawn: p.spawn, anchor: p.anchor || null, flying: p.flying, dim: G.dim, effects: { ...G.effects }, elv: { ...G.elv }, absorb: G.absorb },
    inventory: G.inv.toJSON(), dims: { ...G.dimData }, xp: G.xp, settings: { ...G.wset }, gen: G.meta.gen || 1,
    voidInv: G.voidInv.map(s => s && { ...s }), adv: Adv.toJSON(), story: { ...copyAncientProgress(G.story) }, hardcore: !!G.meta.hardcore, hardcoreOver: !!G.meta.hardcoreOver, stats: { ...G.stats }
  };
}
function saveChallengeSnapshot(snap) {
  const current = G.meta;
  const save = challengeSaves.then(async () => {
    if (G.challengeSaveFailed) throw new Error("Reopen the challenge to restore its most recent checkpoint.");
    snap.ultra.revision = current.ultra.revision;
    G.profile = await Saves.saveChallenge(snap);
    current.ultra.revision++;
    G.hudDirty = true;
  });
  challengeSaves = save.catch(() => {});
  return save;
}
async function saveNow(show) {
  if (!G.world || !G.meta || G.guest || String(G.meta.id).startsWith("guest-")) return;   // a Play Together guest never saves the host's world
  try {
    const snap = snapshot();
    G.meta.played = snap.played;
    const ok = snap.ultra ? (await saveChallengeSnapshot(structuredClone(snap)), true) : await Saves.save(snap);
    if (show) { UI.saved(); if (!ok) UI.toast("Saved for now. Use Download world to keep it after you close the page.", "bad"); }
  } catch (e) {
    if (G.meta?.ultra) {
      G.challengeSaveFailed = true;
      if (G.state === "play") pause();
    }
    UI.toast("Couldn't save: " + e.message, "bad");
    return false;
  }
  return true;
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
  if (G.meta?.ultra?.fallen || G.challengeSaveFailed) return;
  Sound.start();
  G.state = "play"; UI.show("none"); G.hudDirty = true;
  requestLock();
};
G.pause = pause;
// switch between Survival and Creative in the middle of a game (World options in the pause menu)
G.setMode = mode => {
  if (mode !== "survival" && mode !== "creative") return false;
  if (!G.meta || G.meta.hardcore || G.spectator) { UI.toast("Hardcore worlds always stay in Survival.", "bad"); return false; }
  if (mode === G.mode) return true;
  const p = G.player;
  G.mode = G.meta.mode = mode;
  p.health = Math.min(maxHealth(), p.health);
  G.mining = null; G.eat = null; G.bowT = -1;
  creativeStormUntil = 0; stormStage = 0; stormSampleT = 0;
  retireWildLeviathans();
  if (mode === "survival") { p.flying = false; p.airTop = null; }   // no fall damage from where you were flying
  else { p.health = Math.max(p.health, 1); }
  G.hudDirty = true;
  UI.toast(mode === "creative" ? "Game mode: Creative. Double-tap Space to fly; E opens every block." : "Game mode: Survival. Watch your health and hunger!", "good");
  saveNow(false);
  return true;
};
G.setDifficulty = difficulty => {
  if (!G.meta || G.meta.hardcore || !["peaceful", "easy", "normal", "hard"].includes(difficulty)) return false;
  G.wset.difficulty = difficulty;
  if (difficulty === "peaceful") retireWildLeviathans();
  saveNow(false);
  return true;
};
G.saveNow = saveNow;

function openPanel(kind, ctx) {
  G.state = "panel"; keys.clear(); mouseL = mouseR = false; G.mining = null;
  if (document.pointerLockElement) document.exitPointerLock();
  G.panelKind = kind; G.panelCtx = ctx;
  UI.openPanel(kind, ctx);
  if (G.campaign) G.campaign.panelOpened(kind);
  if (kind === "table") tipDone("table");
  if (kind === "inventory" && G.creative) tipDone("craft");
}
G.openAdvancements = () => openPanel("advancements");
G.openJournal = () => { if (G.world && ["play", "pause", "panel"].includes(G.state)) openPanel("journal"); };
G.openHollowSandsMap = () => { if (G.dim === HOLLOW_SANDS && G.state === "panel") openPanel("xmap"); };
G.openLostWorldMap = () => { if (isLostWorldDimension(G.dim) && ["play", "pause", "panel"].includes(G.state)) openPanel("xmap"); };
G.openNoteRaw = n => { if (G.state === "play" || G.state === "panel") openPanel("note", n); };
G.closePanel = () => closePanel();
function closePanel() {
  if (G.panelCtx && String(G.panelCtx).startsWith("cart:")) { UI.closePanel(); G.world.containers.delete(G.panelCtx); }   // a minecart's or chest boat's storage was only borrowed for the panel
  UI.closePanel(); G.panelKind = null; G.panelCtx = null;
  G.state = "play"; UI.show("none");
  requestLock();
}

// ---------- input ----------
window.addEventListener("keydown", e => {
  if (G.state === "panel") {
    const typing = document.activeElement && document.activeElement.tagName === "INPUT";
    if (e.code === "KeyE" || e.code === "Escape" || (e.code === "KeyL" && G.panelKind === "advancements") || (e.code === "KeyJ" && G.panelKind === "journal") || (e.code === "KeyM" && G.panelKind === "xmap")) { if (typing && e.code !== "Escape") return; e.preventDefault(); closePanel(); return; }
    if (/^Digit[1-9]$/.test(e.code) && !typing) { if (UI.hotkey(+e.code.slice(5) - 1)) e.preventDefault(); }
    if (e.code === G.settings.keySwap && !typing) { if (UI.hotkey(OFF)) e.preventDefault(); }   // swap the slot you point at with the offhand
    return;
  }
  if (G.state === "play" && !locked && e.code === "Escape") { e.preventDefault(); pause(); return; }
  if (e.code === "Escape" && UI.current === "skins") { e.preventDefault(); UI.closeSkins(); return; }
  if (G.cutscene && (e.code === "Space" || e.code === "Escape" || e.code === "Enter")) { e.preventDefault(); G.skipVictory(); return; }
  if (G.state === "pause" && e.code === "Escape" && UI.current === "pause" && performance.now() - (G.pausedAt || 0) > 400) { e.preventDefault(); G.resume(); return; }
  if (G.state === "pause" && e.code === "Escape" && (UI.current === "settings" || UI.current === "controls")) { UI.show("pause"); return; }
  if (G.state !== "play") return;
  if (["Space", "Tab", "F3"].includes(e.code) || e.code.startsWith("Arrow")) e.preventDefault();
  if (e.repeat) { keys.add(e.code); return; }
  keys.add(e.code);
  if (!locked) return;
  if (mountedBurrow) {
    if (e.code === "KeyC" || e.code === "KeyB") { mountedBurrow.session.requestCancel(); UI.toast("Returning to the surface. Press C after emergence to dismount."); }
    return;
  }
  if (/^Digit[1-9]$/.test(e.code)) selectSlot(+e.code.slice(5) - 1);
  else if (e.code === "KeyB" && e.altKey && G.riding?.def.segmentedLeviathan) { e.preventDefault(); useMountedBurrow(); }
  else if (e.code === G.settings.keySwap) swapHands();
  else if (e.code === "KeyL") openPanel("advancements");
  else if (e.code === "KeyJ") openPanel("journal");
  else if (e.code === "KeyM") { if (isLostWorldDimension(G.dim) || G.dim === HOLLOW_SANDS || ST.canOpen()) openPanel("xmap"); else UI.toast(G.meta.ultra ? "Craft an Explorer's Map from paper and a compass at a Workbench." :
    "You need an Explorer's Map. Right-click the Expedition Table in your Starter Home for a new one.", "bad"); }
  else if (e.code === "KeyN") {
    if (isLostWorldDimension(G.dim)) {
      const visible = toggleLostWorldWaypoint(G);
      UI.toast(visible === null ? "Choose a landmark on the Lost World map (M)." : visible ? "Lost World waypoint on." : "Lost World waypoint hidden.");
    } else if (G.dim === HOLLOW_SANDS) {
      if (G.sandsWaypoint) G.sandsWaypointHidden = !G.sandsWaypointHidden;
      else UI.toast("Choose a destination on the Hollow Sands map (M).");
    } else if (ST.canOpen()) ST.toggleWaypoint();
  }
  else if (e.code === "KeyE" && G.spectator) UI.toast("Spectators can look around but can't use items.");
  else if (e.code === "KeyE") openPanel("inventory");
  else if (e.code === "KeyQ") dropSelected(e.ctrlKey);
  else if (e.code === "KeyC" && G.riding) dismount();
  else if (e.code === "KeyG" && ["leviathan_dune", "leviathan_obsidian"].includes(G.riding?.sp)) useMountedLeviathanAttack();
  else if (e.code === "KeyB" && G.riding?.def.segmentedLeviathan) useMountedBurrow();
  else if (e.code === "F3") { G.debug = !G.debug; document.getElementById("debug").hidden = !G.debug; }
  else if (e.code === "KeyV" || e.code === "F5") { e.preventDefault(); G.view = ((G.view || 0) + 1) % 3; UI.toast(["First-person view", "Third-person view (behind)", "Third-person view (front)"][G.view]); }
  else if (e.code === "Space" && !G.player.onGround && !G.player.inWater && !G.player.flying && !G.player.gliding && G.player.vel.y < -1 && G.inv.slots[37] && G.inv.slots[37].id === I.GLIDER) {
    G.player.gliding = true; G.adv("glide");
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
// left button (or R): break and attack; right button (or F): place and use
function pressL() { mouseL = true; G.mining = null; if (G.spectator) return; G.eat = null; if (!attack() && G.creative) creativeBreak(); }
function pressR() {
  mouseR = true;
  if (G.spectator) return;
  useItem(); G.useCooldown = 0.28;
}
function releaseL() { mouseL = false; G.mining = null; }
function releaseR() { mouseR = false; if (G.bowT >= 0) releaseBow(); G.blocking = false; G.eat = null; G.scoping = false; }
// Swap the items in your main hand and offhand (X by default; change it in Settings)
function swapHands() {
  if (G.spectator) return;
  const a = G.inv.slots[G.selected], b = G.inv.slots[OFF];
  if (!a && !b) return;
  G.inv.slots[G.selected] = b; G.inv.slots[OFF] = a;
  G.eat = null; G.blocking = false; G.bowT = -1; G.mining = null;
  heldId = -1; offId = -1; G.hudDirty = true; Sound.place("soft");
  tipDone("offhand");
}
canvas.addEventListener("mousedown", e => {
  if (G.state !== "play") return;
  if (!locked) { requestLock(); return; }
  if (e.button === 0) pressL();
  if (e.button === 2) pressR();
});
window.addEventListener("mouseup", e => {
  if (e.button === 0) releaseL();
  if (e.button === 2) releaseR();
});
// keyboard versions of the mouse buttons, for touchpads and Chromebooks without a mouse
window.addEventListener("keydown", e => {
  if (G.state !== "play" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === "KeyF") pressR();
  else if (e.code === "KeyR") pressL();
});
window.addEventListener("keyup", e => {
  if (e.code === "KeyF" && mouseR) releaseR();
  else if (e.code === "KeyR" && mouseL) releaseL();
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
  if ([B.LEAVES, B.BIRCH_LEAVES, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW].includes(id) || d.drops === "leaves" || d.tree) return "leaf";
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
  if (right) time /= tool.speed + (EN.lvl(tool.stack, "efficiency") ? EN.lvl(tool.stack, "efficiency") ** 2 + 1 : 0);   // Efficiency
  if (!tierOK) time = d.hardness * 5;
  if (G.effects.haste) time /= 1 + 0.2 * (G.elv.haste || 1);   // a Beacon's Haste
  if (d.render === "cutout" && id_isLeaves(d.id) && tool && tool.type === "sword") time *= 0.3;
  if (G.player.headInWater && !EN.lvl(G.inv.slots[36], "aqua_affinity") && !G.effects.conduit) time *= 5;
  if (G.effects.fatigue) time *= 10;   // Milestone 17: an Elder Guardian's Mining Fatigue   // digging underwater is slow, like Java (Aqua Affinity fixes it)
  return { time: Math.max(0.05, time), drops: tierOK };
}
const id_isLeaves = id => BLOCKS[id]?.drops === "leaves";
const TIER_NAME = ["", "wooden", "stone", "iron"];

function updateMining(dt, hit) {
  if (G.meta.ultra && hit && mouseL && locked) {
    challengeNoise(14);
    dt *= 1 - Math.max(0, G.meta.ultra.fatigue - 45) * 0.005;
  }
  if (!mouseL || G.creative || G.spectator || !hit) { G.mining = null; crack.visible = false; return; }
  const key = hit.x + "," + hit.y + "," + hit.z;
  if (!G.mining || G.mining.key !== key) {
    const info = mineInfo(hit.v);
    G.mining = { key, prog: 0, info, sound: 0, warned: false };
    if (idOf(hit.v) === B.SPARK_ORE || idOf(hit.v) === B.DARK_SPARK_ORE) R.touchOre(hit.x, hit.y, hit.z);
    if (!info.drops && info.time !== Infinity) {
      const d = blockDef(hit.v);
      UI.toast(`You need a ${TIER_NAME[d.tier]} ${d.tool === "pick" ? "pickaxe" : d.tool} or better to collect ${d.name}.`, "bad");
    }
    if (info.time === Infinity) UI.toast(`${blockDef(hit.v).name} can't be broken.`, "bad");
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
    G.player.exhaust += 0.005; F.noise(hit.x, hit.y, hit.z); L.blockChanged(hit.x, hit.y, hit.z, true);
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
  if (!EN.wears(stack)) { G.hudDirty = true; return; }   // Unbreaking
  stack.dur -= n * (G.meta.ultra ? 1.25 : 1);
  if (stack.dur <= 0) {
    const i = G.inv.slots.indexOf(stack); if (i >= 0) G.inv.slots[i] = null;
    Sound.breakBlock("wood"); UI.toast(`Your ${itemDef(stack.id).name} broke!`, "bad");
  }
  G.hudDirty = true;
}
const water = (x, y, z) => isWet(G.world.get(x, y, z));   // Milestone 17: water plants count as water (18: and waterlogged fences)
function breakBlock(x, y, z, drops, quiet) {
  if (!quiet) R.beforeBreak(x, y, z, (heldTool() || {}).type);   // shears cut a tripwire without setting it off
  const w = G.world, v = w.get(x, y, z), id = idOf(v), d = blockDef(v);
  if (!id || id === B.WATER || id === B.LAVA) return;
  if (id === B.PAINTING) { removePainting(x, y, z, drops); if (!quiet) Sound.breakBlock("wood"); return; }   // Milestone 21, Part D
  if (id === B.ITEM_FRAME && !quiet) { const fc = w.containers.get(x + "," + y + "," + z); if (fc?.slots?.[0]) { if (!G.creative) spawnDrop(fc.slots[0].id, 1, x + 0.5, y + 0.5, z + 0.5, fc.slots[0]); fc.slots[0] = null; fc.rot = 0; Sound.pickup(); return; } }   // hitting a frame takes its item out first
  if (id === B.SOLKARA_GATE || (G.dim === AMBER_CAVERNS && id === B.GATE_FRAME && isAmberSeal(x,y,z))) return;
  if (id === B.LORE_TABLET && (G.dim === GODZILLA_CALDERA && isGodzillaConsole({ x, y, z }) ||
      G.story.lostWorld && isCampaignLandmark(G.dim, { x, y, z }))) {
    if (!quiet) UI.toast("This expedition tablet is protected.");
    return;
  }
  if (G.dim === "overworld" && (id === B.CHEST || id === B.SIGN)) {
    const sites = G.story.leviathan?.sites, hit = { x, y, z };
    const protectedSite = id === B.CHEST ? relicSiteAt(sites, hit, relicCache) :
      relicSiteAt(sites, hit, shrineSign)?.key === "shrine";
    if (protectedSite) {
      if (!quiet) UI.toast("This Solkara landmark is protected.");
      return;
    }
  }
  R.vibrate(x + 0.5, y + 0.5, z + 0.5, 13);
  F.blockBroken(x, y, z, id); L.blockBroken(x, y, z, id); ST.blockBroken(x, y, z, id); CP.blockBroken(x, y, z, id);
  w.crops.delete(x + "," + y + "," + z);
  if (id === B.OBSIDIAN || id === B.PORTAL) setTimeout(() => breakPortal(x, y, z), 0);
  if (isDoor(id)) {   // doors are two blocks tall: remove both halves
    if (metaOf(v) & TOP) y -= 1;
    w.set(x, y, z, B.AIR);
    if (w.id(x, y + 1, z) === id) w.set(x, y + 1, z, B.AIR);
  } else if (id === B.BED) {   // beds are two blocks long
    const [dx, dz] = DIR[metaOf(v) & 3], s = metaOf(v) & HEAD ? -1 : 1;
    w.set(x, y, z, B.AIR);
    if (w.id(x + dx * s, y, z + dz * s) === B.BED) w.set(x + dx * s, y, z + dz * s, B.AIR);
    if (metaOf(v) & HEAD) drops = drops && true; else drops = drops && true;
  } else {
    // simple water rule: a hole next to water fills with water
    const wet = water(x, y + 1, z) || water(x + 1, y, z) || water(x - 1, y, z) || water(x, y, z + 1) || water(x, y, z - 1);
    const silkIce = id === B.ICE && heldTool() && EN.lvl(heldTool().stack, "silk_touch");
    w.set(x, y, z, (wet && !FL.active()) || d.aquatic || (LOGGABLE[id] && metaOf(v) & WATERLOGGED) || id === B.FROSTED_ICE || (id === B.ICE && !silkIce && !G.creative) ? B.WATER : B.AIR);   // Milestone 17: a broken water plant leaves its water   // broken ice melts into water   // Frosted Ice turns back into water
  }
  if (!quiet) { Sound.breakBlock(MATERIAL(id)); burst(x, y, z, v, 16); }
  if (!G.creative && drops) {
    let drop = d.drops;
    if (d.slab && (metaOf(v) & 3) === 2) drop = [id, 2];   // Milestone 21: a double slab is two slabs
    if (d.candle) drop = [id, (metaOf(v) & 3) + 1];   // and every candle in a spot
    const r = Math.random();
    if (drop === "leaves") drop = r < (id === B.JUNGLE_LEAVES ? 0.025 : 0.06) ? (d.saplingOf || B.SAPLING) : r < 0.13 && (id === B.LEAVES || id === B.DARK_OAK_LEAVES) ? I.APPLE : 0;
    if (heldTool() && heldTool().type === "shears" && d.drops === "leaves") drop = id;
    if (id === B.TALL_GRASS) drop = r < 0.12 ? I.SEEDS : r < 0.14 ? I.CARROT : r < 0.155 ? I.POTATO : r < 0.17 ? I.BEETROOT_SEEDS : r < 0.18 ? I.PUMPKIN_SEEDS : 0;   // (Milestone 22: potatoes, beetroot and pumpkin seeds)
    if (id === B.GRAVEL && r < 0.1) drop = I.FLINT;
    if (drop === "shine") drop = [I.SHINE_DUST, 2 + Math.floor(Math.random() * 3)];
    if (drop === "spark") drop = [I.SPARKDUST, 4 + Math.floor(Math.random() * 2)];
    if (drop === "lumen") drop = [I.LUMEN_SHARD, 1 + Math.floor(Math.random() * 2)];
    if (drop === "lapis") drop = [I.LAPIS, 4 + Math.floor(Math.random() * 6)];
    if (drop === "goldnuggets") drop = [I.GOLD_NUGGET, 2 + Math.floor(Math.random() * 4)];
    if (drop === "wart") drop = [I.WART, (metaOf(v) & 7) >= 7 ? 2 + Math.floor(Math.random() * 3) : 1];
    if (drop === "chorus") drop = Math.random() < 0.6 ? I.CHORUS_FRUIT : 0;
    if (drop === "vines") drop = metaOf(v) & 1 ? I.GLOW_BERRIES : 0;   // Milestone 20, Part D
    if (drop === "cocoa") drop = [I.COCOA_BEANS, ((metaOf(v) >> 2) & 3) >= 2 ? 2 + Math.floor(Math.random() * 2) : 1];   // Milestone 20
    if (drop === "deadbush") drop = [I.STICK, Math.floor(Math.random() * 3)];
    if (drop === "pickles") drop = [B.SEA_PICKLE, (metaOf(v) & 3) + 1];   // Milestone 17, Part A
    if (drop === "crystals") drop = [I.PRISMARINE_CRYSTALS, 2 + Math.floor(Math.random() * 2)];
    if (id === B.SEAGRASS && heldTool() && heldTool().type === "shears") drop = id;
    if (drop === "bigmushroom") drop = Math.random() < 0.25 ? (id === B.RED_MUSHROOM_BLOCK ? B.RED_MUSHROOM : B.BROWN_MUSHROOM) : 0;
    if (drop === "melon") drop = [I.MELON_SLICE, 3 + Math.floor(Math.random() * 5)];   // Milestone 16
    if (drop === "berries") { const st = metaOf(v) & 3; drop = [I.BERRIES, st === 3 ? 2 + Math.floor(Math.random() * 2) : 1]; }
    if (drop === "crop") {
      const ripe = (metaOf(v) & 7) >= 7;
      if (id === B.MELON_STEM) drop = [I.MELON_SEEDS, 1];
      else if (id === B.PUMPKIN_STEM) drop = [I.PUMPKIN_SEEDS, 1];   // Milestone 22
      else if (id === B.POTATOES) { if (ripe && Math.random() < 0.02) spawnDrop(I.POISONOUS_POTATO, 1, x + 0.5, y + 0.5, z + 0.5); drop = [I.POTATO, ripe ? 1 + Math.floor(Math.random() * 4) : 1]; }
      else if (id === B.BEETROOTS) { if (ripe) spawnDrop(I.BEETROOT, 1, x + 0.5, y + 0.5, z + 0.5); drop = [I.BEETROOT_SEEDS, ripe ? 1 + Math.floor(Math.random() * 3) : 1]; }
      else if (id === B.WHEAT) { if (ripe) spawnDrop(I.WHEAT, 1, x + 0.5, y + 0.5, z + 0.5); drop = [I.SEEDS, ripe ? 1 + Math.floor(Math.random() * 3) : 1]; }
      else drop = [I.CARROT, ripe ? 2 + Math.floor(Math.random() * 3) : 1];
    }
    // Milestone 15: Silk Touch drops the block itself; Fortune multiplies ore drops; ores give experience
    const ht = heldTool(), fort = ht ? EN.lvl(ht.stack, "fortune") : 0;
    if (ht && EN.lvl(ht.stack, "silk_touch") && silkable(id, d)) drop = id;
    else {
      if (fort && drop && ORE_DROPS.has(id)) drop = Array.isArray(drop) ? [drop[0], drop[1] * EN.fortuneMultiplier(fort)] : [drop, EN.fortuneMultiplier(fort)];
      const ox = ORE_XP[id]; if (ox) spawnOrbs(ox[0] + Math.floor(Math.random() * (ox[1] - ox[0] + 1)), x + 0.5, y + 0.5, z + 0.5);
    }
    if (Array.isArray(drop)) spawnDrop(drop[0], drop[1], x + 0.5, y + 0.5, z + 0.5);
    else if (drop) spawnDrop(drop, 1, x + 0.5, y + 0.5, z + 0.5);
  }
  // spill container contents (a Shell Box keeps them inside and drops as one item)
  const key = x + "," + y + "," + z, box = w.containers.get(key);
  if (G.guest) w.containers.delete(key);   // Play Together: the host's world spills the real contents
  else if (id === B.SHELL_BOX) { spawnDrop(B.SHELL_BOX, 1, x + 0.5, y + 0.5, z + 0.5, { id: B.SHELL_BOX, n: 1, contents: box ? box.slots.map(s => s && { ...s }) : null }); w.containers.delete(key); }
  else if (box) { for (const s of box.slots) if (s) spawnDrop(s.id, s.n, x + 0.5, y + 0.5, z + 0.5, s); w.containers.delete(key); }
  // things hanging underneath fall too (Milestone 20: cave vines, spore blossoms, stalactites)
  { const hb = w.get(x, y - 1, z), hid = idOf(hb); if (hid === B.CAVE_VINES || hid === B.SPORE_BLOSSOM || (hid === B.POINTED_DRIPSTONE && (metaOf(hb) & 1))) breakBlock(x, y - 1, z, true, quiet); }
  // things resting on top fall off
  const above = w.get(x, y + 1, z), aid = idOf(above);
  if ((id === B.BEE_NEST || id === B.BEEHIVE) && !G.creative && !torchNear(x, y, z)) { ents.angerBees(x, y, z); UI.toast("You broke the bees' home, and now they're angry!", "bad"); }
  if ([B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.TORCH, B.WHEAT, B.CARROTS, B.POTATOES, B.BEETROOTS, B.PUMPKIN_STEM, B.SAPLING, B.EMBER_WART, B.BERRY_BUSH, B.SUGAR_CANE, B.MELON_STEM, B.SNOW_LAYER, B.PINK_PETALS, B.DEAD_BUSH, B.CACTUS, B.BAMBOO, B.MOSS_CARPET, B.SIGN, B.TURTLE_EGG].includes(aid) || (aid === B.POINTED_DRIPSTONE && !(metaOf(above) & 1)) || BLOCKS[aid]?.tree || (BLOCKS[aid]?.aquatic && !BLOCKS[aid].floats) || (isDoor(aid) && !(metaOf(above) & TOP))) breakBlock(x, y + 1, z, true, quiet);
  if (aid === B.FIRE) w.set(x, y + 1, z, B.AIR);
  [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dx, dz], f) => { const c = w.get(x - dx, y, z - dz); if (idOf(c) === B.COCOA && (metaOf(c) & 3) === f) breakBlock(x - dx, y, z - dz, true, quiet); });   // Milestone 18: cocoa pods fall off their log
  if (aid === B.WHEAT || aid === B.CARROTS) { /* crops pop off with their seeds */ }
  { // Milestone 21, Part C: carpets, candles and standing lanterns on top; hanging lanterns below; ladders on the sides; scaffolding above
    const ad = BLOCKS[aid];
    if (ad && (ad.carpet || ad.candle || (aid === B.LANTERN && !(metaOf(above) & 1)) || (id === B.SCAFFOLDING && aid === B.SCAFFOLDING))) breakBlock(x, y + 1, z, true, quiet);
    const bv = w.get(x, y - 1, z);
    if (idOf(bv) === B.LANTERN && (metaOf(bv) & 1)) breakBlock(x, y - 1, z, true, quiet);
    DIR.forEach(([dx, dz], f) => { const c = w.get(x - dx, y, z - dz), cid = idOf(c), cd = BLOCKS[cid]; if ((cid === B.LADDER || cid === B.ITEM_FRAME || cid === B.PAINTING || (cd?.banner && (metaOf(c) & 4))) && (metaOf(c) & 3) === f) breakBlock(x - dx, y, z - dz, true, true); });
    if ((ad?.banner && !(metaOf(above) & 4)) || aid === B.ARMOR_STAND) breakBlock(x, y + 1, z, true, quiet);   // Milestone 21, Part D
  }
  if (id === B.LOG || id === B.BIRCH_LOG || d.log) { tipDone("chop"); if (!G.guest) queueLeafDecay(x, y, z); }   // Milestone 18: leaves drop away
  FL.wake(x, y, z);   // Milestone 18: water or lava next to the hole flows in
  G.hudDirty = true;
}

// Milestone 15: which blocks Silk Touch can pick up whole, which ores Fortune helps, and the experience ores give (Java 1.20.1)
const ORE_DROPS = new Set([B.COAL_ORE, B.SKY_ORE, B.JADE_ORE, B.QUARTZ_ORE, B.LAPIS_ORE, B.SPARK_ORE, B.DARK_SPARK_ORE, B.NETHER_GOLD_ORE]);
const ORE_XP = { [B.COAL_ORE]: [0, 2], [B.SKY_ORE]: [3, 7], [B.JADE_ORE]: [3, 7], [B.QUARTZ_ORE]: [2, 5], [B.LAPIS_ORE]: [2, 5], [B.SPARK_ORE]: [1, 5], [B.DARK_SPARK_ORE]: [1, 5], [B.NETHER_GOLD_ORE]: [0, 1] };
const silkable = (id, d) => d.drops !== id && !!itemDef(id) && !d.noItem && ![B.FIRE, B.PORTAL, B.FARMLAND, B.TALL_GRASS].includes(id) &&
  !["crop", "berries", "wart", "chorus"].includes(d.drops);

// ---------- fighting ----------
function entityTarget() {
  if (mountedBurrow) return null;
  const p = G.player, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, dir = lookDir();
  const eh = ents.raycast(eye, dir, G.creative ? 5 : 3.5);
  if (!eh) return null;
  const bh = target();
  if (bh && bh.dist < eh.dist) return null;   // a block is in the way
  return eh.ent;
}
const OBSIDIAN_MELEE_TARGETS = new Set(["sand_stalker", "sand_wraith", "desert_burrower", "obsidian_crawler"]);
// Hit whatever creature is in front of you. Returns true if something was hit.
function attack() {
  if (mountedBurrow) return true;
  { const p = G.player; if (ents.deflect({ x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, lookDir(), 4)) { G.swing = 0.01; return true; } }
  const e = entityTarget();
  if (!e) return false;
  if (G.attackCd > 0) return true;
  const s = G.inv.slots[G.selected], d = s ? itemDef(s.id) : null;
  let dmg = d && d.tool ? d.tool.damage : 1;
  if (OBSIDIAN_MELEE_TARGETS.has(e.sp) && leviathanSetPieces("obsidian") === 4) dmg += 2;
  if (d?.echoBlade && e.def?.echohold) dmg *= 1.5;   // Echo Blade: +50% against Echohold's creatures
  if (G.effects.strength) dmg += 3 * (G.elv.strength || 1);
  if (G.effects.weakness) dmg = Math.max(0, dmg - 4);   // Weakness
  dmg += EN.meleeBonus(s, e);   // Sharpness, Smite, Bane of Arthropods
  const p = G.player, crit = !p.onGround && p.vel.y < 0 && !p.inWater;
  if (crit) dmg *= 1.5;
  const dir = lookDir(), l = Math.hypot(dir.x, dir.z) || 1, sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const knock = { x: dir.x / l * (sprint ? 1.4 : 1), z: dir.z / l * (sprint ? 1.4 : 1) };
  const kb = EN.lvl(s, "knockback"); if (kb) { knock.x *= 1 + 0.7 * kb; knock.z *= 1 + 0.7 * kb; }   // Knockback
  ents.looting = G.guest ? 0 : EN.lvl(s, "looting");   // Looting (read by Entities.kill)
  const landed = G.guest ? MP.hitCreature(e, dmg, knock) : ents.damage(e, dmg, "player", knock);   // a Play Together guest's hit is decided by the host
  ents.looting = 0;
  if (landed && !G.guest) {
    const fa = EN.lvl(s, "fire_aspect");
    if (fa && !e.def.fireproof && !e.dead) { e.burning = Math.max(e.burning || 0, 4 * fa); if (!(e.burnT > 0)) e.burnT = 1; }   // Fire Aspect
    const sw = EN.lvl(s, "sweeping");
    if (sw && d?.tool?.type === "sword" && p.onGround && !sprint) {   // Sweeping Edge: a wide swing also hits creatures right next to the target
      ents.looting = EN.lvl(s, "looting");
      for (const o of ents.near(e.pos.x, e.pos.y, e.pos.z, 1.6, o => o !== e && !o.dead && !o.tame && !o.npc && !o.def.object && !o.def.villager && !o.def.boss)) ents.damage(o, 1 + dmg * sw / (sw + 1), "player", knock);
      ents.looting = 0;
      puff(e.pos.x, e.pos.y + 0.8, e.pos.z, "poof");
    }
  }
  if (landed) {
    if (crit) puff(e.pos.x, e.pos.y + e.h, e.pos.z, "poof");
    if (G.meta.ultra && !G.meta.ultra.fallen) { G.meta.ultra.fatigue = Math.min(100, G.meta.ultra.fatigue + 2); challengeNoise(20); }
    if (s && d.tool) wearTool(s, d.tool.type === "sword" ? 1 : 2);
  }
  G.attackCd = d?.tool?.attackCooldown ?? (d?.tool?.type === "sword" ? 0.45 : 0.6); G.swing = 0.01;
  if (!G.creative) G.player.exhaust += 0.1;
  F.noise(G.player.pos.x, G.player.pos.y, G.player.pos.z); if (!d?.echoBlade) L.noise(G.player.pos.x, G.player.pos.y, G.player.pos.z, 12, "fighting");   // the Echo Blade strikes silently
  return true;
}
function releaseBow() {
  R.vibrate(G.player.pos.x, G.player.pos.y + 1.4, G.player.pos.z, 3);
  const charge = Math.min(1, G.bowT), s = G.inv.slots[G.bowHand ?? G.selected];
  G.bowT = -1;
  if (s && s.id === I.TRIDENT) { if (charge >= 0.5) throwTrident(s, G.bowHand ?? G.selected); return; }   // Milestone 17, Part D
  if (s && s.id === I.CROSSBOW) return;   // Milestone 22: letting go too early doesn't load it
  if (charge < 0.15 || !s || s.id !== I.BOW) return;
  const inf = EN.lvl(s, "infinity");
  const ai = [OFF, ...Array.from({ length: 36 }, (_, i) => i)].find(i => G.inv.slots[i] && itemDef(G.inv.slots[i].id).arrow);
  const arrowId = ai === undefined ? I.ARROW : G.inv.slots[ai].id, tip = itemDef(arrowId).tip;
  if (!G.creative) {
    if (ai === undefined) return;
    if (!(inf && arrowId === I.ARROW)) { const a = G.inv.slots[ai]; a.n--; if (!a.n) G.inv.slots[ai] = null; }   // Infinity only saves plain arrows, like Java
    wearTool(s, 1);
  }
  const pw = EN.lvl(s, "power"), arrowDmg = (1 + 7 * charge) * (pw ? 1 + 0.25 * (pw + 1) : 1);   // Power
  const p = G.player, dir = lookDir(), speed = 8 + 26 * charge;
  if (G.guest) MP.shoot(p.pos.x + dir.x * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.5, dir.x * speed, dir.y * speed, dir.z * speed, arrowDmg);   // the host's world flies it
  else ents.addProjectile("arrow", p.pos.x + dir.x * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.5, dir.x * speed, dir.y * speed, dir.z * speed, { fromPlayer: true, dmg: arrowDmg, punch: EN.lvl(s, "punch"), flame: EN.lvl(s, "flame"), infinite: !!inf && !tip, tip, itemId: arrowId });
  Sound.mob("bow", 0); G.hudDirty = true; G.swing = 0.01;
}
// ---------- Milestone 23, Part D: who lives in the outposts, huts and mansions; Bad Omen and village raids ----------
let structT = 0, raidT = 0, omenRaid = null;
function updateStructures() {
  if (G.dim !== "overworld" || G.guest || !G.world.structuresHere) return;
  const p = G.player, done = (G.story.structs ||= {});
  for (const s of G.world.structuresHere(p.pos.x, p.pos.z)) {
    if (done[s.key] || Math.hypot(s.cx - p.pos.x, s.cz - p.pos.z) > 40 || !G.world.isLoaded(s.cx, s.cz)) continue;
    done[s.key] = 1;
    if (G.wset.difficulty !== "peaceful") for (const [sp, at, captain] of residentsOf(s)) {
      if (!SPECIES[sp]) continue;
      const e = ents.add(sp, at.x, at.y, at.z, captain ? { captain: true } : {});
      if (e) { e.persist = true; if (captain) { e.captain = true; e.name = "Pillager Captain"; } }
    }
    UI.toast(`You found a ${STRUCT_NAMES[s.kind]}!`); G.adv("structure", s.kind);
  }
}
const RAID_WAVES = [["pillager", "pillager", "pillager"], ["pillager", "pillager", "vindicator", "vindicator"], ["pillager", "vindicator", "witch", "pillager", "vindicator"], ["ravager", "pillager", "pillager", "vindicator", "vindicator"], ["ravager", "evoker", "vindicator", "pillager", "witch", "pillager"]];
function villagersNear(x, z, r) { return ents.list.filter(e => e.def.villager && !e.gone && !e.dead && !e.npc && e.sp !== "wanderer" && Math.hypot(e.pos.x - x, e.pos.z - z) < r); }
function updateOmenRaid() {
  if (G.dim !== "overworld" || G.guest) return;
  const p = G.player;
  if (!omenRaid) {
    if (!G.effects.badOmen || G.creative || G.wset.difficulty === "peaceful" || villagersNear(p.pos.x, p.pos.z, 32).length < 3) return;
    delete G.effects.badOmen; G.hudDirty = true;
    omenRaid = { x: p.pos.x, y: p.pos.y, z: p.pos.z, wave: 0, waves: { easy: 3, normal: 4, hard: 5 }[G.wset.difficulty] || 3, mobs: [], pause: 4 };
    UI.toast("Your Bad Omen drew a raid! Defend the village!", "bad"); Sound.mob("roar", 20); G.adv("raidStart");
    return;
  }
  const r = omenRaid, alive = r.mobs.filter(e => !e.gone && !e.dead);
  if (Math.hypot(p.pos.x - r.x, p.pos.z - r.z) > 128 || G.state === "dead") { for (const e of alive) e.omenRally = null; omenRaid = null; UI.toast("You left the village. The raid is over."); return; }
  if (!villagersNear(r.x, r.z, 48).length) { omenRaid = null; UI.toast("The raiders took the village… there's nobody left.", "bad"); return; }
  if (alive.length) return;
  if (r.wave >= r.waves) {   // every wave beaten
    omenRaid = null; addEffect("hero", 3600); Sound.levelUp();
    for (const v of villagersNear(r.x, r.z, 48)) puff(v.pos.x, v.pos.y + 2, v.pos.z, "heart");
    UI.toast("You saved the village! You're the Hero of the Village: villagers sell for less for the next hour.", "good"); G.adv("raidWon"); return;
  }
  if ((r.pause -= 1) > 0) return;
  r.pause = 6; r.wave++;
  const a = Math.random() * Math.PI * 2, sx = r.x + Math.cos(a) * 26, sz = r.z + Math.sin(a) * 26;
  r.mobs = [];
  for (const sp of RAID_WAVES[Math.min(RAID_WAVES.length - 1, r.wave - 1 + (r.waves >= 5 ? 0 : 0))]) {
    if (!SPECIES[sp]) continue;
    const x = Math.floor(sx + (Math.random() - 0.5) * 6), z = Math.floor(sz + (Math.random() - 0.5) * 6);
    if (!G.world.isLoaded(x, z)) continue;
    const e = ents.add(sp, x + 0.5, G.world.surfaceY(x, z) + 1, z + 0.5);
    if (e) { e.omenRally = { x: r.x, y: r.y, z: r.z }; r.mobs.push(e); }
  }
  UI.toast(`Raid: wave ${r.wave} of ${r.waves}!`, "bad"); Sound.mob("rumble", 10);
}
G.omenRaidReview = () => omenRaid && { wave: omenRaid.wave, waves: omenRaid.waves, alive: omenRaid.mobs.filter(e => !e.gone && !e.dead).length };
// ---------- Milestone 22, Part D: fireworks ----------
const rockets = [], bursts = [];
const FIREWORK_COLORS = [[1, 0.3, 0.3], [1, 0.8, 0.2], [0.3, 0.8, 1], [0.5, 1, 0.4], [1, 0.45, 0.9], [0.75, 0.5, 1], [1, 1, 1]];
function launchRocket(x, y, z, vx, vy, vz, life, armed) {
  rockets.push({ x, y, z, vx, vy, vz, t: 0, life, armed, colors: [FIREWORK_COLORS[Math.floor(Math.random() * 7)], FIREWORK_COLORS[Math.floor(Math.random() * 7)]] });
  Sound.noise(900, 0.5, 0.25, 0.7, "highpass");
}
function burstRocket(r) {
  const p = G.player, dist = Math.hypot(p.pos.x - r.x, p.pos.y - r.y, p.pos.z - r.z);
  { // a ball of bright sparks (its own points, bigger than the usual specks, so you can see it from far away)
    const N = G.settings.reducedMotion ? 24 : 70, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = [];
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, q = Math.sqrt(1 - u * u), sp = (G.settings.reducedMotion ? 3 : 7) + Math.random() * 2, c = r.colors[i % 2];
      pos.set([r.x, r.y, r.z], i * 3); col.set(c, i * 3); vel.push([q * Math.cos(a) * sp, u * sp, q * Math.sin(a) * sp]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.45, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    pts.frustumCulled = false; scene.add(pts); bursts.push({ pts, vel, t: 0 });
  }
  Sound.noise(260, 0.7, 0.6 * Math.max(0.2, 1 - dist / 80), 0.6, "lowpass");
  setTimeout(() => { for (let i = 0; i < 5; i++) setTimeout(() => Sound.noise(3200, 0.05, 0.15 * Math.max(0.2, 1 - dist / 80), 1, "highpass"), i * 70); }, 250);
  if (r.armed && !G.guest) {   // a crossbow firework hurts what's close to where it bursts
    for (const e of ents.near(r.x, r.y, r.z, 2.5)) if (!e.def.object) ents.damage(e, 6, "player");
    if (dist < 2.5 && !G.creative) hurt(4, "You were too close to your own firework!", null, false, "explosion");
  }
}
function updateRockets(dt) {
  const p = G.player, w = G.world;
  if (G.rocketBoost > 0) {   // flying faster on a firework
    G.rocketBoost -= dt;
    if (p.gliding) { const d = lookDir(); p.vel.x += (d.x * 30 - p.vel.x) * 0.12; p.vel.y += (d.y * 30 - p.vel.y) * 0.12; p.vel.z += (d.z * 30 - p.vel.z) * 0.12; }
    if (Math.random() < 0.6) emitParticle(p.pos.x, p.pos.y + 0.5, p.pos.z, (Math.random() - 0.5), -1, (Math.random() - 0.5), 0.5, PUFF_COLORS.spark);
  }
  for (let i = bursts.length - 1; i >= 0; i--) {   // sparks spread, slow, droop, and fade
    const b = bursts[i], a = b.pts.geometry.attributes.position;
    b.t += dt;
    for (let k = 0; k < b.vel.length; k++) { const v = b.vel[k]; v[0] *= 0.96; v[1] = v[1] * 0.96 - 3 * dt; v[2] *= 0.96; a.array[k * 3] += v[0] * dt; a.array[k * 3 + 1] += v[1] * dt; a.array[k * 3 + 2] += v[2] * dt; }
    a.needsUpdate = true; b.pts.material.opacity = Math.max(0, 1 - b.t / 1.6);
    if (b.t > 1.6) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); }
  }
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.t += dt;
    if (!r.armed) r.vy += 6 * dt;   // it speeds up as it climbs
    const nx = r.x + r.vx * dt, ny = r.y + r.vy * dt, nz = r.z + r.vz * dt;
    let hitSomething = SOLID[w.id(Math.floor(nx), Math.floor(ny), Math.floor(nz))];
    if (r.armed && !hitSomething) hitSomething = ents.near(nx, ny, nz, 4).some(e => !e.def.object && Math.hypot(e.pos.x - nx, e.pos.z - nz) < e.w / 2 + 0.3 && ny > e.pos.y - 0.2 && ny < e.pos.y + e.h + 0.2);   // touching its body
    r.x = nx; r.y = ny; r.z = nz;
    if (parts.length < PMAX - 30) emitParticle(r.x, r.y, r.z, (Math.random() - 0.5) * 0.6, -1.5, (Math.random() - 0.5) * 0.6, 0.4, PUFF_COLORS.spark);
    if (r.t >= r.life || hitSomething) { rockets.splice(i, 1); burstRocket(r); }
  }
}
// ---------- Milestone 22, Part D: the jukebox ----------
const playing = new Map();   // "x,y,z" → { score, start, next, title }
function useJukebox(hit, key) {
  const w = G.world, slot = G.inv.slots[G.useSlot];
  let c = w.containers.get(key);
  if (!c) { c = { type: "jukebox", slots: [null] }; w.containers.set(key, c); }
  if (c.slots[0]) {   // take the disc out
    const d = c.slots[0]; c.slots[0] = null; playing.delete(key);
    spawnDrop(d.id, 1, hit.x + 0.5, hit.y + 1.1, hit.z + 0.5, d); Sound.click(); return;
  }
  if (!slot || !itemDef(slot.id)?.disc) { UI.toast("Put a Music Disc in the jukebox to play it."); return; }
  c.slots[0] = { ...slot, n: 1 };
  if (!G.creative) G.inv.slots[G.useSlot] = null;
  startDisc(key, c.slots[0].id);
  G.swing = 0.01; G.hudDirty = true; heldId = -1; G.adv("jukebox");
}
function startDisc(key, id) {
  const disc = DISCS[DISC_ITEMS.indexOf(id)];
  if (!disc) return;
  playing.set(key, { score: scoreOf(disc), start: G.clock + 0.4, next: 0, title: disc.title });
  UI.toast(`Now playing: "${disc.title}"`, "good");
}
function updateJukeboxes() {
  if (!playing.size) return;
  const w = G.world, p = G.player;
  for (const [key, j] of playing) {
    const c = w.containers.get(key), [x, y, z] = key.split(",").map(Number);
    if (!c || !c.slots[0] || w.id(x, y, z) !== B.JUKEBOX) { playing.delete(key); continue; }
    const t = G.clock - j.start, dist = Math.hypot(p.pos.x - x - 0.5, p.pos.y - y, p.pos.z - z - 0.5);
    while (j.next < j.score.notes.length && j.score.notes[j.next][0] <= t) {
      const [, inst, pitch] = j.score.notes[j.next++];
      if (t - j.score.notes[j.next - 1][0] < 0.25) Sound.note(inst, pitch, dist * 0.75);   // (skip notes we're late for, e.g. after a pause)
    }
    if (j.next % 6 === 1 && !G.settings.reducedMotion && Math.random() < 0.3) puff(x + 0.5, y + 1.2, z + 0.5, "xp");
    if (t > j.score.length + 1) playing.delete(key);   // the song is over; the disc stays in until you take it out
  }
}
G.jukeboxReview = () => [...playing].map(([k, j]) => ({ key: k, title: j.title, played: j.next, total: j.score.notes.length }));
// ---------- Milestone 22, Part C: crossbow ----------
const crossbowLoadTime = s => Math.max(0.25, 1.25 - 0.25 * EN.lvl(s, "quick_charge"));
function loadCrossbow() {   // called while you hold right-click; it loads once it's been held long enough
  const s = G.inv.slots[G.bowHand ?? G.selected];
  if (!s || s.id !== I.CROSSBOW || s.loaded || G.bowT < crossbowLoadTime(s)) return;
  G.bowT = -1;
  const fw = G.inv.slots[OFF]?.id === I.FIREWORK_ROCKET;   // Milestone 22, Part D: a firework in your other hand goes in first
  if (fw) { if (!G.creative) { const o = G.inv.slots[OFF]; o.n--; if (!o.n) G.inv.slots[OFF] = null; } }
  else if (!G.creative) { const i = Array.from({ length: 36 }, (_, k) => k).find(k => G.inv.slots[k]?.id === I.ARROW); if (i === undefined) return; const a = G.inv.slots[i]; a.n--; if (!a.n) G.inv.slots[i] = null; }
  s.loaded = fw ? I.FIREWORK_ROCKET : I.ARROW; Sound.click(); Sound.mob("bow", 0); G.hudDirty = true; heldId = -1;
}
function fireCrossbow(s) {
  const p = G.player, dir = lookDir(), speed = 36, multi = EN.lvl(s, "multishot"), pierce = EN.lvl(s, "piercing");
  const yaws = multi ? [0, -0.17, 0.17] : [0];
  if (s.loaded === I.FIREWORK_ROCKET) {   // Milestone 22, Part D: a firework flies straight and bursts on what it hits
    for (const a of yaws) { const c = Math.cos(a), sn = Math.sin(a); launchRocket(p.pos.x + dir.x * 0.6, p.pos.y + p.eye - 0.15, p.pos.z + dir.z * 0.6, (dir.x * c - dir.z * sn) * 22, dir.y * 22, (dir.x * sn + dir.z * c) * 22, 1.6, true); }
    delete s.loaded; if (!G.creative) wearTool(s, multi ? 3 : 1); G.swing = 0.01; G.hudDirty = true; heldId = -1; G.adv("crossbow"); return;
  }
  for (const a of yaws) {
    const c = Math.cos(a), sn = Math.sin(a), dx = dir.x * c - dir.z * sn, dz = dir.x * sn + dir.z * c;
    if (G.guest) MP.shoot(p.pos.x + dx * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dz * 0.5, dx * speed, dir.y * speed, dz * speed, 9);
    else ents.addProjectile("arrow", p.pos.x + dx * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dz * 0.5, dx * speed, dir.y * speed, dz * speed, { fromPlayer: true, dmg: 9, pierce });
  }
  delete s.loaded;
  if (!G.creative) wearTool(s, multi ? 3 : 1);
  Sound.mob("bow", 0); Sound.noise(1800, 0.08, 0.3, 2); G.swing = 0.01; G.hudDirty = true; heldId = -1; G.adv("crossbow");
}
// ---------- Milestone 22, Part C: spyglass zoom ----------
let scopeEl = null;
function updateScope() {
  const s = G.inv.slots[G.useSlot ?? G.selected] || G.inv.slots[G.selected];
  if (G.scoping && (G.state !== "play" || !mouseR || ![G.inv.slots[G.selected]?.id, G.inv.slots[OFF]?.id].includes(I.SPYGLASS))) G.scoping = false;
  const fov = G.scoping ? Math.max(6, G.settings.fov / 8) : G.settings.fov;
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); if (G.scoping) G.adv("spyglass"); }
  if (!scopeEl) { scopeEl = document.createElement("div"); scopeEl.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:5;background:radial-gradient(circle at center, transparent 0 34vmin, #000 35vmin)"; scopeEl.hidden = true; document.body.appendChild(scopeEl); }
  scopeEl.hidden = !G.scoping;
}
// Milestone 17, Part D: throw a Trident (Riptide in water launches you instead). It lands as an item, or flies back with Loyalty.
function throwTrident(s, slotIndex) {
  const p = G.player, dir = lookDir(), rip = EN.lvl(s, "riptide");
  if (rip) {
    if (!p.inWater) { UI.toast("A Riptide trident only works while you're in water.", "bad"); Sound.error(); return; }
    const sp = 9 + 5 * rip; p.vel.x = dir.x * sp; p.vel.y = dir.y * sp + 2; p.vel.z = dir.z * sp; p.airTop = null;
    puff(p.pos.x, p.pos.y + 1, p.pos.z, "splash"); Sound.splash(); if (!G.creative) wearTool(s, 1); G.swing = 0.01; G.adv("riptide");
    return;
  }
  if (G.guest) { UI.toast("Throwing tridents is only for the host while playing together, for now."); return; }
  const stack = { ...s }, speed = 26;
  if (!G.creative) { wearTool(stack, 1); G.inv.slots[slotIndex] = null; heldId = -1; }
  ents.addProjectile("arrow", p.pos.x + dir.x * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.5, dir.x * speed, dir.y * speed, dir.z * speed,
    { fromPlayer: true, dmg: 8, trident: G.creative ? null : stack, tridentLook: true, impaling: EN.lvl(s, "impaling"), loyalty: EN.lvl(s, "loyalty"), channeling: EN.lvl(s, "channeling"), noGrav: false });
  Sound.mob("trident", 0); G.swing = 0.01; G.hudDirty = true; G.adv("throwTrident");
}
// Milestone 16: splash and lingering potions fly in an arc and break where they land
function throwPotion(slot) {
  if (G.guest) { UI.toast("Throwing potions is only for the host while playing together, for now."); return; }
  const p = G.player, dir = lookDir(), st = { ...slot, n: 1 }, color = parseInt((PO.POTIONS[st.pot] || PO.POTIONS.water).color.slice(1), 16);
  ents.addProjectile("potion", p.pos.x + dir.x * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.5, dir.x * 12, dir.y * 12 + 2, dir.z * 12, { fromPlayer: true, stack: st, color });
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
  Sound.mob("cast", 0); G.swing = 0.01; G.hudDirty = true; heldId = -1; G.adv("throwPotion");
}
// Where a thrown potion breaks: splash potions touch everyone within 4 blocks (less the farther away);
// lingering potions leave a cloud for 30 seconds. Healing hurts undead creatures and Harming heals them, like Java.
const potionClouds = [];
const hexRGB = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
function potionBurst(x, y, z, st, owner, direct) {
  if (!st) return;
  const col = hexRGB((PO.POTIONS[st.pot] || PO.POTIONS.water).color);
  for (let i = 0; i < 24 && parts.length < PMAX - 30; i++) { const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3; emitParticle(x, y, z, Math.cos(a) * sp, 1 + Math.random() * 2, Math.sin(a) * sp, 0.8, col, false, true); }
  Sound.potionBreak(Math.hypot(G.player.pos.x - x, G.player.pos.z - z));
  if (st.id === I.LINGERING_POTION) { if (potionClouds.length < 12) potionClouds.push({ x, y: y - 0.2, z, st, t: 30, tick: 0, col, owner }); return; }
  const p = G.player, dp = direct === "player" ? 0 : Math.hypot(p.pos.x - x, p.pos.y + 0.9 - y, p.pos.z - z);
  if (dp < 4) { applyPotion(st, 1 - dp / 4); if (st.pot === "water" && G.effects.fire) { delete G.effects.fire; G.hudDirty = true; } }
  for (const e of ents.near(x, y, z, 4.5, o => !o.dead && !o.gone && o !== owner)) {
    const d = e === direct ? 0 : Math.hypot(e.pos.x - x, e.pos.y + e.h / 2 - y, e.pos.z - z);
    if (d < 4) potionOnCreature(e, st, 1 - d / 4, owner === "player" ? "player" : null);
  }
}
function potionOnCreature(e, st, mul, by, arrow) {
  if (e.dead || e.gone || e.npc || e.def.object || e.def.boss) return;
  const undead = EN.isUndead(e);
  for (const f of PO.effectsOf(st, arrow ? 1 : mul)) {
    if (f.instant) {
      const heal = (f.instant === "heal") !== undead, n = Math.max(1, Math.round((heal ? 4 : 6) * 2 ** (f.lv - 1) * mul * (arrow ? 8 : 1)));
      if (heal) { e.hp = Math.min(e.maxHp, e.hp + n); puff(e.pos.x, e.pos.y + e.h, e.pos.z, "heart"); }
      else { e.iframes = 0; ents.damage(e, n, by); }
      continue;
    }
    if ((f.key === "poison" || f.key === "regen") && undead) continue;   // undead creatures ignore poison and regeneration
    if (!["poison", "regen", "slow", "weakness"].includes(f.key)) continue;
    const dur = f.dur * (arrow ? mul : 1);
    e.fx ||= {}; e.fx[f.key] = Math.max(e.fx[f.key] || 0, dur);
    if (by === "player" && f.key === "poison") e.angry = Math.max(e.angry || 0, 20);
  }
}
// Milestone 20, Part E: which biome you're in; the first visit to a new one gets a message (and counts for achievements)
let biomeT = 0;
function trackBiome(dt) {
  if ((biomeT -= dt) > 0 || G.dim !== "overworld" || !G.world || !G.world.biomeAt || G.spectator) return;
  biomeT = 1;
  const p = G.player, x = Math.floor(p.pos.x), z = Math.floor(p.pos.z), b = G.world.biomeAt(x, z), seen = G.story.biomes ||= [];
  G.currentBiome = b;
  if (!b) return;
  if (!seen.includes(b)) { seen.push(b); if (SPECIAL_BIOMES.has(b) || b === "deep_ocean" || b === "warm_ocean") { UI.toast(`You found: ${BIOME_NAMES[b] || b}!`, "good"); Sound.levelUp(); } }
  G.adv("biome", b);
  if (p.pos.y < G.world.surfaceY(x, z) - 8) {
    const cb = G.world.caveBiomeAt(x, z);
    if (cb) { G.adv("cavebiome", cb); if (!seen.includes(cb)) { seen.push(cb); UI.toast(`You found: ${cb === "lush_caves" ? "Lush Caves" : "Dripstone Caves"}!`, "good"); Sound.levelUp(); } }
  }
}
function updatePotionClouds(dt) {
  const p = G.player;
  for (let i = potionClouds.length - 1; i >= 0; i--) {
    const c = potionClouds[i], r = 0.5 + 2.5 * (c.t / 30);
    c.t -= dt; c.tick -= dt;
    if (parts.length < PMAX - 40) for (let k = 0; k < 2; k++) { const a = Math.random() * Math.PI * 2, d = Math.random() * r; emitParticle(c.x + Math.cos(a) * d, c.y + 0.1, c.z + Math.sin(a) * d, 0, 0.4, 0, 1, c.col, true); }
    if (c.tick <= 0) {
      c.tick = 1;
      if (Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < r && Math.abs(p.pos.y - c.y) < 1.6) applyPotion(c.st, 0.25);
      for (const e of ents.near(c.x, c.y, c.z, r + 0.5, o => !o.dead && !o.gone)) if (Math.hypot(e.pos.x - c.x, e.pos.z - c.z) < r) potionOnCreature(e, c.st, 0.25, c.owner === "player" ? "player" : null);
    }
    if (c.t <= 0) potionClouds.splice(i, 1);
  }
}
function throwItem(kind) {
  if (G.guest) { UI.toast("Throwing things is only for the host while playing together (bows work)."); return; }
  const p = G.player, dir = lookDir();
  ents.addProjectile(kind, p.pos.x + dir.x * 0.5, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.5, dir.x * 18, dir.y * 18 + 2, dir.z * 18, { fromPlayer: true });
  const s = G.inv.slots[G.useSlot]; if (s && !G.creative) { s.n--; if (!s.n) G.inv.slots[G.useSlot] = null; }
  G.swing = 0.01; G.hudDirty = true; heldId = -1;
}

// ---------- fishing and boats ----------
// Right-click once to cast. When the bobber dips under (a splash), right-click again quickly to reel in a catch.
function useRod(slot) {
  if (G.guest) { UI.toast("Fishing is only for the host while playing together, for now."); return; }
  const p = G.player, b = G.bobber;
  G.swing = 0.01;
  if (b && !b.gone) {
    b.gone = true; G.bobber = null;
    if (b.biteT > 0) {
      const r = Math.random();
      const luck = EN.lvl(slot, "luck_of_the_sea"), tr = 0.05 + 0.021 * luck, junk = tr + Math.max(0.02, 0.1 - 0.025 * luck);   // Luck of the Sea
      const catchId = r < tr ? [I.SADDLE, I.BOW, I.VOID_PEARL, I.JADE, I.GOLD_INGOT, I.FISHING_ROD, I.NAME_TAG, I.ENCH_BOOK, I.NAUTILUS_SHELL][Math.floor(Math.random() * 9)]   // treasure!
        : r < junk ? [I.BONE, I.STRING, I.LEATHER, I.STICK, I.INK_SAC][Math.floor(Math.random() * 5)]                                  // junk
        : r < 0.6 ? I.RAW_MINNOW : r < 0.82 ? I.RAW_SALMON : r < 0.88 ? I.SUNFIN : r < 0.93 ? I.RAW_MINNOW : I.PUFFER;
      const caught = catchId === I.ENCH_BOOK ? { id: I.ENCH_BOOK, n: 1, ench: EN.randomBookEnch(Math.random, true) } : null;   // Milestone 15
      if (G.inv.add(catchId, 1, caught)) spawnDrop(catchId, 1, p.pos.x, p.pos.y + 1, p.pos.z, caught);
      puff(b.x, b.y, b.z, "splash"); Sound.splash(); Sound.pickup();
      spawnOrbs(1 + Math.floor(Math.random() * 4), p.pos.x, p.pos.y + 0.5, p.pos.z);
      UI.toast(`You caught: ${itemDef(catchId).name}!`, "good"); G.adv("fish", catchId);
      wearTool(slot, 1);
    } else if (b.stuck) wearTool(slot, 2);
    G.hudDirty = true;
    return;
  }
  const dir = lookDir();
  ents.addProjectile("bobber", p.pos.x + dir.x * 0.6, p.pos.y + p.eye - 0.1, p.pos.z + dir.z * 0.6, dir.x * 13, dir.y * 13 + 3, dir.z * 13, { fromPlayer: true });
  G.bobber = ents.projectiles[ents.projectiles.length - 1];
  if (G.bobber) G.bobber.lure = EN.lvl(slot, "lure");   // Lure: fish bite sooner
  Sound.mob("cast", 0);
}
const fishLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xe8e8e8 }));
fishLine.frustumCulled = false; fishLine.visible = false; scene.add(fishLine);
function updateFishLine() {
  if (G.bobber && (G.bobber.gone || !ents.projectiles.includes(G.bobber))) G.bobber = null;
  const b = G.bobber;
  fishLine.visible = !!b;
  if (!b) return;
  const p = G.player, d = lookDir(), c = Math.cos(p.yaw), s = Math.sin(p.yaw), a = fishLine.geometry.attributes.position;
  a.setXYZ(0, p.pos.x + d.x * 0.6 + c * 0.36, p.pos.y + p.eye + d.y * 0.6 - 0.26, p.pos.z + d.z * 0.6 - s * 0.36);   // from the rod's tip
  a.setXYZ(1, b.x, b.y + 0.07, b.z); a.needsUpdate = true;
}
// Set a boat down on the water you're pointing at (or on the ground)
function placeBoat(slot) {
  const p = G.player, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, hit = raycast(G.world, eye, lookDir(), REACH, false);
  if (!hit) return false;
  let x = hit.x + 0.5, y, z = hit.z + 0.5;
  if (idOf(hit.v) === B.WATER) { let t = hit.y; while (G.world.id(hit.x, t + 1, hit.z) === B.WATER) t++; y = t + 1 - 0.12; }
  else if (hit.ny === 1) y = hit.y + 1;
  else return false;
  if (SOLID[G.world.id(hit.x, Math.floor(y + 0.5), hit.z)]) return false;
  if (G.guest) MP.placeEntity(slot.id === I.CHEST_BOAT ? "chest_boat" : "boat", x, y, z, p.yaw);   // the host's world gets the real boat
  else ents.add(slot.id === I.CHEST_BOAT ? "chest_boat" : "boat", x, y, z, { yaw: p.yaw });
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
  Sound.place("wood"); G.swing = 0.01; G.hudDirty = true; heldId = -1;
  UI.toast(slot.id === I.CHEST_BOAT ? "Right-click to climb in. Crouch (C) + right-click to open the chest." : "Right-click the boat to climb in.");
  return true;
}

// ---------- placing and using ----------
function target() {
  if (mountedBurrow) return null;
  const p = G.player, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z };
  const dir = lookDir();
  return raycast(G.world, eye, dir, G.creative ? REACH + 1.5 : REACH);
}
function lookDir() { const p = G.player, cp = Math.cos(p.pitch); return { x: -Math.sin(p.yaw) * cp, y: Math.sin(p.pitch), z: -Math.cos(p.yaw) * cp }; }
function facingFromYaw() { const a = ((G.player.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return [0, 1, 2, 3][Math.round(a / (Math.PI / 2)) % 4]; }

// Right-click: the main hand acts first; if it has nothing to do, the offhand gets a turn (Minecraft Java rules).
// Left-click (mining and attacking) always uses the main hand.
function useItem() {
  if (mountedBurrow) return true;
  if (G.spectator || G.eat || G.bowT >= 0) return true;
  for (const si of [G.selected, OFF]) {
    if (si === OFF && !G.inv.slots[OFF]) break;
    G.useHand = si;
    let did = false;
    try { did = useWith(si === OFF); } finally { G.useHand = null; }
    if (did) return true;
  }
  return false;
}
// Use the item in the active hand (G.useSlot). Returns true if something happened.
function useWith(offhand) {
  const hit = target(), w = G.world, slot = G.inv.slots[G.useSlot], crouch = keys.has("KeyC"), sd = slot ? itemDef(slot.id) : null;
  const take = () => { if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; } };
  if (!slot && !offhand && crouch && useLeviathanArmor()) return true;
  if (slot?.id === I.BURIED_SCEPTER) return useBuriedScepter(slot);
  if (slot?.id === I.ANCIENT_COMPANION_RELIC) return useAncientCompanion();
  if (slot && [I.FANGBLADE, I.INFERNO_GREATBLADE].includes(slot.id)) return useLeviathanBlade(slot);
  if (slot && slot.id === I.CASTELLAN_GREATBLADE) return CB.useGreatblade(slot);
  if (slot?.id === I.SANDCALLER_HORN) return useSandcallerHorn();
  if (slot && slot.id === I.FISHING_ROD) { useRod(slot); return true; }
  if (slot && (slot.id === I.BOAT || slot.id === I.CHEST_BOAT) && placeBoat(slot)) return true;
  if (sd && sd.cart) {   // minecarts go on rails
    if (hit && isRail(idOf(hit.v))) { if (G.guest) MP.placeEntity(sd.cart, hit.x + 0.5, hit.y + 0.0625, hit.z + 0.5, G.player.yaw); else ents.add(sd.cart, hit.x + 0.5, hit.y + 0.0625, hit.z + 0.5, { yaw: G.player.yaw }); take(); Sound.place("stone"); G.swing = 0.01; G.hudDirty = true; heldId = -1; return true; }
    UI.toast("Minecarts go on rails. Point at a rail and right-click.", "bad"); return true;
  }
  // creatures first, then blocks you can open or use (only the main hand opens things)
  const seen = entityTarget();
  if (G.guest && seen && MP.askRide(seen)) return true;   // Play Together guests can ride carts and boats (through the host)
  const ent = G.guest ? null : seen;   // ...but can't feed, tame, ride animals or trade yet
  if (ent?.def.segmentedLeviathan && ent.tame) {
    const record = leviathanMountRecord(ent);
    if (!record?.bonded || record.defeated) return true;
    if (slot?.id === I.SADDLE && !ent.saddled) {
      if (ent.bondArrival) {
        UI.toast("Let your Leviathan finish emerging before equipping its saddle.");
        return true;
      }
      take(); ent.saddled = true; record.saddled = true; G.hudDirty = true;
      heldId = -1;
      saveNow(false);
      UI.toast("Saddle equipped. Use an empty hand to ride.", "good");
      return true;
    }
    if (!slot) {
      return mount(ent);
    }
  }
  if (ent && CO.interact(ent, slot)) { G.swing = 0.01; G.hudDirty = true; heldId = -1; return true; }
  if (hit && !offhand && !ent && CO.useOnBlock(hit)) { G.swing = 0.01; return true; }   // tie leashed creatures to a fence
  if (ent) { if (ents.interact(ent, slot)) { G.swing = 0.01; G.hudDirty = true; heldId = -1; return true; } if (!offhand && !slot) return false; }
  if (hit && !crouch && !offhand) {
    const id = idOf(hit.v), d = BLOCKS[id];
    if (d.candle) {   // Milestone 21: up to 4 candles of the same color in one spot; an empty hand blows a lit one out
      const m = metaOf(hit.v);
      if (slot && slot.id === id && (m & 3) < 3) { w.set(hit.x, hit.y, hit.z, make(id, m + 1)); if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; } Sound.place("soft"); G.swing = 0.01; G.hudDirty = true; heldId = -1; return true; }
      if ((m & 4) && (!slot || slot.id !== I.FLINT_STEEL)) { w.set(hit.x, hit.y, hit.z, make(id, m & 3)); Sound.fizz(0); G.swing = 0.01; return true; }
    }
    if (d.interact && MP.useBlock(hit, d.interact)) { G.swing = 0.01; return true; }   // Play Together: chests through the host, host-only pieces
    if (d.interact && R.kinds.has(d.interact)) { if (R.interact(hit, d.interact)) { G.swing = 0.01; return true; } }
    else if (d.interact && d.interact !== "tnt") { G.swing = 0.01; interact(hit, d.interact); return true; }
  }
  if (!slot) return false;
  if (slot.id === I.EXPLORER_MAP) { openPanel("xmap"); return true; }
  if (slot.id === I.VOID_CRYSTAL && hit && !G.guest) return placeVoidCrystal(hit);
  if (slot.id === I.SHIELD) { G.blocking = true; G.blockHand = G.useSlot; return true; }   // hold to keep the shield up
  if (slot.id === I.TRIDENT) { G.bowT = 0; G.bowHand = G.useSlot; return true; }   // Milestone 17, Part D: hold, then let go to throw
  if (slot.id === I.FIREWORK_ROCKET) {   // Milestone 22, Part D: launch from a block, or boost while gliding
    const p = G.player;
    if (p.gliding) { G.rocketBoost = 1.6; launchRocket(p.pos.x, p.pos.y, p.pos.z, 0, -3, 0, 0.35, false); G.adv("boost"); }
    else if (hit) launchRocket(hit.x + 0.5 + hit.nx * 0.6, hit.y + 0.5 + hit.ny * 0.6, hit.z + 0.5 + hit.nz * 0.6, (Math.random() - 0.5) * 1.2, 16, (Math.random() - 0.5) * 1.2, 1.1 + Math.random() * 0.4, false);
    else return false;
    if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
    G.swing = 0.01; G.hudDirty = true; heldId = -1; G.adv("firework");
    return true;
  }
  if (slot.id === I.CROSSBOW) {   // Milestone 22, Part C: loaded → fire; empty → hold to load
    if (slot.loaded) { fireCrossbow(slot); return true; }
    if (G.creative || G.inv.count(I.ARROW) > 0 || G.inv.slots[OFF]?.id === I.FIREWORK_ROCKET) { G.bowT = 0; G.bowHand = G.useSlot; return true; }
    UI.toast("You need arrows (or a firework in your other hand) to load a crossbow.", "bad"); Sound.error(); return true;
  }
  if (slot.id === I.SPYGLASS) { G.scoping = true; return true; }   // hold to look through it
  if (slot.id === I.BOW) {
    if (G.creative || G.inv.count(I.ARROW) > 0) { G.bowT = 0; G.bowHand = G.useSlot; return true; }
    UI.toast("You need arrows to shoot. Make them from flint, a stick, and a feather.", "bad"); Sound.error(); return true;
  }
  if (sd.kind === "spawn" && hit) {
    const x = hit.x + hit.nx + 0.5, y = hit.y + hit.ny, z = hit.z + hit.nz + 0.5;
    const sp = sd.species === "villager" ? ["farmer", "fletcher", "shepherd", "cleric", "smith"][Math.floor(Math.random() * 5)] : sd.species;
    if (SPECIES[sp]?.cetacean && !marineWaterRoom(w, SPECIES[sp], x, y, z, G.player.yaw)) {
      UI.toast("Place this spawn egg on the floor of deep, open water.", "bad");
      return true;
    }
    if (G.guest) {   // Play Together: a friend's spawn egg works in the host's world (not for bosses or Leviathans)
      if (SPECIES[sp]?.boss || SPECIES[sp]?.segmentedLeviathan) { UI.toast("Only the host can use that egg while playing together."); return true; }
      MP.placeEntity(sp, x, y, z, G.player.yaw); puff(x, y + 0.5, z, "poof"); take(); G.hudDirty = true; return true;
    }
    if (SPECIES[sp]?.segmentedLeviathan) {
      if (!G.creative) {
        UI.toast("Use Leviathan preview eggs in Creative.", "bad");
        return true;
      }
      if (hit.ny !== 1 || !SOLID[idOf(hit.v)] || G.world.id(Math.floor(x), y, Math.floor(z)) !== B.AIR) {
        UI.toast("Use the preview egg on top of an open, solid block.", "bad");
        return true;
      }
      const previous = ents.list.find(e => e.duneCycle?.preview && !e.gone);
      if (previous) retireLeviathanPreview(previous);
      const site = { x, y, z };
      const practice = G.dim === "overworld" && (sp === "leviathan_dune" || sp === "leviathan_obsidian");
      const e = ents.add(sp, site.x, site.y, site.z, { tame: practice, saddled: practice });
      e.yaw = Math.atan2(x - G.player.pos.x, z - G.player.pos.z);
      e.emerged = true;
      e.duneCycle = { step: "surface", site, preview: true };
      if (practice) {
        // The movement and attack controllers share a bond-shaped cooldown record.
        // This record lives on the preview actor and never enters world progress.
        e.practiceMount = { bonded: true, saddled: true };
        UI.toast("Practice mount ready. Right-click near its head with an empty hand.");
      }
      return true;
    }
    ents.add(sp, x, y, z, sp === "blightking" ? { summonT: 10 } : sp === "golem" ? { home: [x, y, z] } : sp === "bald_eagle" ? { home: [x, Math.min(HEIGHT - 2, y + 6), z] } : SPECIES[sp]?.cetacean ? { yaw: G.player.yaw } : { persist: !!SPECIES[sp]?.expansion }); puff(x, y + 0.5, z, "poof");
    take(); G.hudDirty = true; return true;
  }
  if (sd.kind === "armor") {   // put it on
    const at = 36 + sd.armor.slot, old = G.inv.slots[at];
    G.inv.slots[at] = slot; G.inv.slots[G.useSlot] = old;
    Sound.place("soft"); UI.toast(`Wearing ${sd.name}`); G.hudDirty = true; heldId = -1; return true;
  }
  if (slot.id === I.VOID_PEARL) { throwItem("pearl"); return true; }
  if (slot.id === I.EYE) { throwEye(); return true; }
  if (slot.id === I.PALE_LANTERN) { F.enter(); return true; }
  if (slot.id === I.ECHO_SHARD) { if (L.throwShard()) take(); G.hudDirty = true; return true; }
  if (slot.id === I.CINDER_EYE && !(hit && idOf(hit.v) === B.CINDER_ALTAR)) { throwCinderEye(); return true; }
  if (slot.id === I.EGG) { throwItem("egg"); return true; }
  if (slot.id === I.SPLASH_POTION || slot.id === I.LINGERING_POTION) { throwPotion(slot); return true; }   // Milestone 16
  if (slot.id === B.LILY_PAD) {   // Milestone 20: lily pads sit on still water
    const p = G.player, wh = raycast(G.world, { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, lookDir(), REACH, false);
    if (wh && idOf(wh.v) === B.WATER && !w.id(wh.x, wh.y + 1, wh.z)) { w.set(wh.x, wh.y + 1, wh.z, B.LILY_PAD); take(); Sound.place("leaf"); G.swing = 0.01; G.hudDirty = true; heldId = -1; return true; }
    if (!offhand) UI.toast("Lily Pads go on top of water.", "bad"); return false;
  }
  if (slot.id === I.GLOW_BERRIES && hit && hit.ny === -1 && (OPAQUE[idOf(hit.v)] || idOf(hit.v) === B.CAVE_VINES) && !w.id(hit.x, hit.y - 1, hit.z)) {   // Milestone 20: plant cave vines under a block
    w.set(hit.x, hit.y - 1, hit.z, make(B.CAVE_VINES, 0)); w.crops.add(hit.x + "," + (hit.y - 1) + "," + hit.z); take(); Sound.place("leaf"); G.swing = 0.01; G.hudDirty = true; heldId = -1; return true;
  }
  if (slot.id === I.COCOA_BEANS && hit && w.id(hit.x, hit.y, hit.z) === B.JUNGLE_LOG && hit.ny === 0) {   // plant cocoa on the side of a jungle log
    const x = hit.x + hit.nx, z = hit.z + hit.nz, f = DIR.findIndex(([dx, dz]) => dx === -hit.nx && dz === -hit.nz);
    if (!w.id(x, hit.y, z) && f >= 0) { w.set(x, hit.y, z, make(B.COCOA, f)); w.crops.add(x + "," + hit.y + "," + z); take(); Sound.place("wood"); G.swing = 0.01; G.hudDirty = true; heldId = -1; return true; }
  }
  if (slot.id === I.COCOA_BEANS) { if (!offhand) UI.toast("Plant Cocoa Beans on the side of a Jungle Log.", "bad"); return false; }
  if (slot.id === I.POTION && slot.pot === "water" && hit && (idOf(hit.v) === B.DIRT || idOf(hit.v) === B.GRASS)) {   // a water bottle turns dirt into mud
    w.set(hit.x, hit.y, hit.z, B.MUD); if (!G.creative) swapHeld(I.BOTTLE); Sound.splash(); G.swing = 0.01; return true;
  }
  if (slot.id === I.BOTTLE && clouds.some(c => Math.hypot(G.player.pos.x - c.x, G.player.pos.z - c.z) < 3.5 && Math.abs(G.player.pos.y - c.y) < 3)) {   // Milestone 16: bottle the Wyrm's breath
    swapHeld(I.DRAGON_BREATH); Sound.potionBreak(0); G.swing = 0.01; G.adv("breath"); UI.toast("You bottled the Wyrm's breath!", "good"); return true;
  }
  if (slot.id === I.BOTTLE) {   // Milestone 16: fill a bottle from water
    const p = G.player, wh = raycast(G.world, { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, lookDir(), REACH, false);
    if (wh && idOf(wh.v) === B.WATER) { swapHeldStack({ id: I.POTION, n: 1, pot: "water" }); Sound.splash(); G.swing = 0.01; return true; }
  }
  // food you can plant (carrots on farmland, berries on grass, even through tall grass) gets planted when you point at the right ground
  let soil = hit;
  if (hit && BLOCKS[idOf(hit.v)].replaceable && BLOCKS[idOf(hit.v)].shape === "cross") soil = { x: hit.x, y: hit.y - 1, z: hit.z, ny: 1, v: w.get(hit.x, hit.y - 1, hit.z) };
  const above = soil && w.id(soil.x, soil.y + 1, soil.z);
  if (sd.plants && sd.kind === "food" && soil && soil.ny === 1 && (!above || BLOCKS[above].replaceable) && (sd.plants === B.BERRY_BUSH ? [B.GRASS, B.DIRT] : [B.FARMLAND]).includes(idOf(soil.v))) {
    w.set(soil.x, soil.y + 1, soil.z, make(sd.plants, 0)); w.crops.add(soil.x + "," + (soil.y + 1) + "," + soil.z);
    if (idOf(soil.v) === B.FARMLAND && hydrate(soil.x, soil.y, soil.z)) w.set(soil.x, soil.y, soil.z, make(B.FARMLAND, WET));
    take(); Sound.place("leaf"); G.swing = 0.01; G.hudDirty = true; heldId = -1; return true;
  }
  if (sd.food !== undefined && sd.kind === "food") {
    if (G.creative) return false;
    if (G.player.hunger >= 20 && !sd.alwaysEat) { if (!offhand) UI.toast("You're not hungry right now."); return false; }
    G.eat = { slot: G.useSlot, id: slot.id, t: 0, crunch: 0 };   // eating takes 1.6 seconds of holding right-click
    return true;
  }
  if ([I.BUCKET, I.WATER_BUCKET, I.LAVA_BUCKET].includes(slot.id) || sd.holds) { useBucket(slot); return true; }   // (Milestone 17: buckets of fish)
  if (!hit) return false;
  const hitId = idOf(hit.v);
  // hoe: turn grass or dirt into farmland
  if (sd.tool && sd.tool.type === "hoe") {
    if ((hitId === B.GRASS || hitId === B.DIRT) && hit.ny === 1 && !SOLID[w.id(hit.x, hit.y + 1, hit.z)]) {
      if (w.id(hit.x, hit.y + 1, hit.z)) breakBlock(hit.x, hit.y + 1, hit.z, true);
      w.set(hit.x, hit.y, hit.z, make(B.FARMLAND, hydrate(hit.x, hit.y, hit.z) ? WET : 0)); w.crops.add(hit.x + "," + hit.y + "," + hit.z); Sound.place("soft"); wearTool(slot, 1); G.swing = 0.01;   // (Milestone 18: tracked so it can dry out)
      G.adv("till"); return true;
    }
    return false;
  }
  // seeds and carrots: plant on farmland
  if (sd.plants === B.EMBER_WART) {   // Milestone 16: Ember Wart grows on Wailing Sand, like Java (it used to need farmland and never grew)
    if (hitId === B.SOUL_SAND && hit.ny === 1 && !w.id(hit.x, hit.y + 1, hit.z)) {
      w.set(hit.x, hit.y + 1, hit.z, make(B.EMBER_WART, 0)); w.crops.add(hit.x + "," + (hit.y + 1) + "," + hit.z);
      take(); Sound.place("leaf"); G.hudDirty = true; heldId = -1; return true;
    }
    if (!offhand) UI.toast("Plant Ember Wart on Wailing Sand.", "bad");
    return false;
  }
  if (sd.plants) {
    if (hitId === B.FARMLAND && hit.ny === 1 && !w.id(hit.x, hit.y + 1, hit.z)) {
      w.set(hit.x, hit.y + 1, hit.z, make(sd.plants, 0)); w.crops.add(hit.x + "," + (hit.y + 1) + "," + hit.z);
      if (hydrate(hit.x, hit.y, hit.z)) w.set(hit.x, hit.y, hit.z, make(B.FARMLAND, WET));
      take(); Sound.place("leaf"); G.hudDirty = true; heldId = -1; return true;
    }
    if (sd.kind !== "food") { if (!offhand) UI.toast("Plant seeds on farmland. Use a hoe on grass or dirt first.", "bad"); return false; }
  }
  if (slot.id === I.BONE_MEAL) { useBoneMeal(hit, slot); return true; }
  if (slot.id === I.SHEARS && hitId === B.PUMPKIN && hit) {   // Milestone 22: carve a face into a pumpkin (it faces you) and get its seeds
    w.set(hit.x, hit.y, hit.z, make(B.CARVED_PUMPKIN, (facingFromYaw() + 2) % 4)); spawnDrop(I.PUMPKIN_SEEDS, 4, hit.x + 0.5 + hit.nx * 0.6, hit.y + 0.5, hit.z + 0.5 + hit.nz * 0.6);
    wearTool(slot, 1); Sound.place("soft"); G.swing = 0.01; G.adv("carve"); return true;
  }
  if (slot.id === I.FLINT_STEEL) {
    if (hitId === B.TNT) { w.set(hit.x, hit.y, hit.z, B.AIR); primeTNT(hit.x, hit.y, hit.z); wearTool(slot, 1); G.adv("tnt"); return true; }
    if (BLOCKS[hitId]?.candle && !(metaOf(hit.v) & 4)) { w.set(hit.x, hit.y, hit.z, make(hitId, metaOf(hit.v) | 4)); wearTool(slot, 1); Sound.mob("fireshoot", 0); G.adv("candle"); return true; }   // Milestone 21: light a candle
    const ax = hit.x + hit.nx, ay = hit.y + hit.ny, az = hit.z + hit.nz;
    if (hitId === B.OBSIDIAN && G.dim === "forsaken") { UI.toast("Portals won't light in the Forsaken World. Use the Return Gate at the refuge.", "bad"); return true; }
    if (hitId === B.OBSIDIAN && !w.id(ax, ay, az) && lightPortal(ax, ay, az)) { wearTool(slot, 1); G.adv("portal"); return true; }
    if (ignite(ax, ay, az)) { wearTool(slot, 1); Sound.mob("fireshoot", 0); }
    return true;
  }
  if (slot.id === B.BED) { placeBed(hit, slot); return true; }
  if (sd.places && slot.id !== I.SPARKDUST && slot.id !== I.STRING) {   // items that can be set down as a block (Blight Skulls)
    const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
    if (w.id(x, y, z) && !BLOCKS[w.id(x, y, z)].replaceable) return false;
    if (!SOLID[w.id(x, y - 1, z)]) { UI.toast("Set it on top of a block.", "bad"); return true; }
    w.set(x, y, z, sd.places);
    take(); Sound.place("stone"); G.hudDirty = true; heldId = -1;
    if (sd.places === B.SKULL) checkBlightSummon(x, y, z);
    return true;
  }
  if (!isBlockItem(slot.id) && slot.id !== I.SPARKDUST && slot.id !== I.STRING) return false;
  if (slot.id === B.TURTLE_EGG && idOf(hit.v) === B.TURTLE_EGG && (metaOf(hit.v) & 3) < 3) { w.set(hit.x, hit.y, hit.z, make(B.TURTLE_EGG, metaOf(hit.v) + 1)); take(); G.swing = 0.01; G.hudDirty = true; return true; }   // Milestone 17
  if (slot.id === B.SEA_PICKLE && idOf(hit.v) === B.SEA_PICKLE && (metaOf(hit.v) & 3) < 3) {   // Milestone 17: up to 4 pickles in one spot
    w.set(hit.x, hit.y, hit.z, make(B.SEA_PICKLE, (metaOf(hit.v) & 3) + 1)); take(); Sound.place("leaf"); G.swing = 0.01; G.hudDirty = true; return true;
  }
  if (BLOCKS[slot.id]?.slab) {   // Milestone 21: a second slab on the empty half of one makes a double slab
    const merge = (sx, sy, sz, half) => {
      const sv = w.get(sx, sy, sz);
      if (idOf(sv) !== slot.id || (metaOf(sv) & 3) !== half) return false;
      w.set(sx, sy, sz, make(slot.id, 2)); take(); Sound.place(MATERIAL(slot.id)); G.swing = 0.01; G.hudDirty = true; heldId = -1; G.adv("doubleslab");
      return true;
    };
    if (hit.ny === 1 && merge(hit.x, hit.y, hit.z, 0)) return true;
    if (hit.ny === -1 && merge(hit.x, hit.y, hit.z, 1)) return true;
    const tv = w.get(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz);
    if (idOf(tv) === slot.id && (metaOf(tv) & 3) < 2 && merge(hit.x + hit.nx, hit.y + hit.ny, hit.z + hit.nz, metaOf(tv) & 3)) return true;
  }
  let x = hit.x, y = hit.y, z = hit.z;
  const hitDef = blockDef(hit.v);
  if (!hitDef.replaceable) { x += hit.nx; y += hit.ny; z += hit.nz; }
  if (y < 1 || y >= HEIGHT - 1) return false;
  const here = w.id(x, y, z);
  if (here && here !== B.WATER && !BLOCKS[here].replaceable) return false;
  const id = slot.id === I.SPARKDUST ? B.SPARK_DUST : slot.id === I.STRING ? B.TRIPWIRE : slot.id, d = BLOCKS[id];
  let v = make(id);
  if (id === B.POINTED_DRIPSTONE && hit.ny === -1 && !hitDef.replaceable) v = make(id, 1);
  if (d.drops === "leaves") v = make(id, LEAF_PERSIST);   // Milestone 18: placed leaves never drop away   // Milestone 20: placed on a ceiling, it hangs down
  if (d.front || d.faces) v = make(id, (facingFromYaw() + 2) % 4);   // furnaces, chests, and signs face you
  if (d.slab || d.stairs) {   // Milestone 21: the top half if you clicked the underside of a block or the upper half of its side
    const e = G.player, fy = e.pos.y + e.eye + lookDir().y * hit.dist - hit.y, upper = hit.ny === -1 || (hit.ny === 0 && fy > 0.5);
    v = d.slab ? make(id, upper ? 1 : 0) : make(id, facingFromYaw() | (upper ? 4 : 0));   // stairs climb away from you
  }
  if (id === B.LADDER) {   // Milestone 21, Part C: on the side of a solid block
    if (hit.ny !== 0 || hitDef.replaceable || !OPAQUE[idOf(hit.v)]) { UI.toast("Ladders go on the side of a solid block.", "bad"); Sound.error(); return true; }
    v = make(id, DIR.findIndex(([dx, dz]) => dx === -hit.nx && dz === -hit.nz));
  }
  if (id === B.LANTERN) {   // standing on a block, or hanging from the underside of one
    const hang = hit.ny === -1 && !hitDef.replaceable;
    if (hang ? !SOLID[w.id(x, y + 1, z)] : !SOLID[w.id(x, y - 1, z)]) { UI.toast("A lantern stands on a block or hangs underneath one.", "bad"); Sound.error(); return true; }
    v = make(id, hang ? 1 : 0);
  }
  // Milestone 21, Part D: frames and wall banners on the side of a block, stands and banners on top of one, paintings fill a wall
  const onWall = hit.ny === 0 && !hitDef.replaceable && OPAQUE[idOf(hit.v)], wallF = DIR.findIndex(([dx, dz]) => dx === -hit.nx && dz === -hit.nz);
  if (id === B.PAINTING) { placePainting(hit, x, y, z, onWall, wallF); return true; }
  if (id === B.ITEM_FRAME) { if (!onWall) { UI.toast("Item frames go on the side of a solid block.", "bad"); Sound.error(); return true; } v = make(id, wallF); }
  if (d.banner) {
    if (onWall) v = make(id, wallF | 4);
    else if (SOLID[w.id(x, y - 1, z)]) v = make(id, (facingFromYaw() + 2) % 4);
    else { UI.toast("A banner stands on a block or hangs on a wall.", "bad"); Sound.error(); return true; }
  }
  if (id === B.ARMOR_STAND) { if (!SOLID[w.id(x, y - 1, z)] || w.id(x, y + 1, z)) { UI.toast("An armor stand needs solid ground and room above.", "bad"); Sound.error(); return true; } v = make(id, (facingFromYaw() + 2) % 4); }
  if (id === B.CAKE && !SOLID[w.id(x, y - 1, z)]) { UI.toast("A cake needs a block underneath.", "bad"); Sound.error(); return true; }   // Milestone 22
  if (d.candle && !SOLID[w.id(x, y - 1, z)]) { UI.toast("Candles need a block underneath.", "bad"); Sound.error(); return true; }
  // Sparkworks parts: which way they face or what they hang on depends on where you clicked
  { const e = G.player, dir = lookDir(), fy = e.pos.y + e.eye + dir.y * hit.dist - hit.y;
    const rv = R.placeValue(id, hit, x, y, z, Math.min(1, Math.max(0, fy)), !!hitDef.replaceable);
    if (typeof rv === "string") { UI.toast(rv, "bad"); Sound.error(); return true; }
    if (rv !== null) v = rv; }
  if (id === B.SUGAR_CANE) {   // Milestone 15: on sand, dirt or grass right beside water, or on top of more sugar cane
    const below = w.id(x, y - 1, z), wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => w.id(x + dx, y - 1, z + dz) === B.WATER);
    if (below !== B.SUGAR_CANE && !([B.GRASS, B.DIRT, B.SAND].includes(below) && wet)) { UI.toast("Sugar Cane grows on sand, dirt, or grass right next to water.", "bad"); Sound.error(); return true; }
    w.crops.add(x + "," + y + "," + z);
  }
  { // Milestone 20, Part C: where the new plants can go
    const below = w.id(x, y - 1, z), sandy = [B.SAND, B.RED_SAND, B.TERRACOTTA, B.ORANGE_TERRACOTTA, B.YELLOW_TERRACOTTA, B.WHITE_TERRACOTTA, B.RED_TERRACOTTA, B.BROWN_TERRACOTTA, B.LIGHT_GRAY_TERRACOTTA];
    const sideSolid = () => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => SOLID[w.id(x + dx, y, z + dz)]);
    const rule = id === B.CACTUS ? (below === B.CACTUS || below === B.SAND || below === B.RED_SAND) && !sideSolid() ? null : "Cactus grows on sand, with nothing right beside it."
      : id === B.BAMBOO ? [B.GRASS, B.DIRT, B.SAND, B.RED_SAND, B.MUD, B.BAMBOO, B.MYCELIUM].includes(below) ? null : "Bamboo grows on grass, dirt, sand, or mud."
      : id === B.DEAD_BUSH ? [...sandy, B.DIRT, B.GRASS].includes(below) ? null : "A Dead Bush needs sand, terracotta, or dirt underneath."
      : (id === B.BROWN_MUSHROOM || id === B.RED_MUSHROOM) ? OPAQUE[below] ? null : "Mushrooms need a solid block underneath."
      : id === B.MANGROVE_SAPLING ? [B.GRASS, B.DIRT, B.FARMLAND, B.MUD, B.CLAY].includes(below) ? null : "A Mangrove Propagule needs grass, dirt, or mud underneath."
      : id === B.SPORE_BLOSSOM ? OPAQUE[w.id(x, y + 1, z)] ? null : "A Spore Blossom hangs from the underside of a block."
      : (id === B.SNOW_LAYER || id === B.PINK_PETALS) ? SOLID[below] && OPAQUE[below] ? null : "That needs a solid block underneath."
      : undefined;
    if (typeof rule === "string") { UI.toast(rule, "bad"); Sound.error(); return true; }
    if (id === B.CACTUS || id === B.BAMBOO) w.crops.add(x + "," + y + "," + z);
  }
  if (d.aquatic) {   // Milestone 17, Part A: kelp, seagrass, sea pickles, coral plants and fans live underwater
    const below = w.id(x, y - 1, z);
    const why = w.id(x, y, z) !== B.WATER ? `${d.name} can only be placed in water.` : !(d.floats || OPAQUE[below] || (id === B.KELP && below === B.KELP)) ? `${d.name} needs a solid block underneath.` : null;
    if (why) { UI.toast(why, "bad"); Sound.error(); return true; }
    if (id === B.KELP || id === B.CONDUIT) w.crops.add(x + "," + y + "," + z);   // kelp grows taller; a Conduit checks its frame
  }
  if (BLOCKS[id]?.deadAs || id === B.TURTLE_EGG) w.crops.add(x + "," + y + "," + z);   // a coral block checks it is still touching water; turtle eggs hatch
  if (id === B.WET_SPONGE && G.world.gen.isNether()) { v = B.SPONGE; puff(x + 0.5, y + 1, z + 0.5, "poof"); Sound.mob("hiss", 2); UI.toast("The Wet Sponge dries out instantly in the heat!"); }
  if (d.shape === "cross" && !d.aquatic && id !== B.SUGAR_CANE && ![B.DEAD_BUSH, B.BROWN_MUSHROOM, B.RED_MUSHROOM, B.MANGROVE_SAPLING, B.SPORE_BLOSSOM].includes(id) && ![B.GRASS, B.DIRT, B.FARMLAND].includes(w.id(x, y - 1, z))) { UI.toast(`${d.name} needs grass or dirt underneath.`, "bad"); Sound.error(); return true; }
  if (id === B.SAPLING || (d.tree && !d.tree.endsWith("mushroom"))) w.crops.add(x + "," + y + "," + z);   // (mushrooms only grow big with Bone Meal)
  if (id === B.WATER && G.world.gen.isNether()) { puff(x + 0.5, y + 0.5, z + 0.5, "poof"); Sound.mob("hiss", 2); UI.toast("Water boils away instantly in the Ember Depths!", "bad"); return true; }
  if (id === B.LAVA || id === B.WATER) { placeLiquid(id, x, y, z); take(); G.hudDirty = true; return true; }
  if ((id === B.TORCH || id === B.WARD_CANDLE) && !OPAQUE[idOf(hit.v)]) { Sound.error(); return true; }
  if (isDoor(id)) {
    if (!SOLID[w.id(x, y - 1, z)] || (w.id(x, y + 1, z) && !BLOCKS[w.id(x, y + 1, z)].replaceable)) { UI.toast("A door needs two empty blocks of space on solid ground.", "bad"); Sound.error(); return true; }
    const f = (facingFromYaw() + 2) % 4;
    v = make(id, f);
    if (blocksPlayer(v, x, y, z) || blocksPlayer(make(id, f | TOP), x, y + 1, z)) return false;
    w.set(x, y, z, v); w.set(x, y + 1, z, make(id, f | TOP));
  } else {
    if (blocksPlayer(v, x, y, z)) return false;
    if (LOGGABLE[id] && idOf(w.get(x, y, z)) === B.WATER && isSource(w.get(x, y, z))) v = make(idOf(v), metaOf(v) | WATERLOGGED);   // Milestone 18: placed in water, it keeps the water
    w.set(x, y, z, v);
    if (id === B.SPONGE) soakUp(x, y, z);   // Milestone 17
    FL.wake(x, y, z);   // Milestone 18
    if ((BLOCKS[id]?.light || 0) >= 12) queueMeltCheck(x, y, z);   // Milestone 19: bright lights melt ice and snow nearby
    if (id === B.ITEM_FRAME) w.containers.set(x + "," + y + "," + z, { type: "frame", slots: [null], rot: 0 });   // Milestone 21, Part D
    if (id === B.ARMOR_STAND) w.containers.set(x + "," + y + "," + z, { type: "stand", slots: [null, null, null, null] });
    if (id === B.SHELL_BOX) w.containers.set(x + "," + y + "," + z, { type: "chest", slots: slot.contents ? slot.contents.map(s => s && { ...s }) : new Array(27).fill(null) });
    if (id === B.BEACON) { w.beacons.add(x + "," + y + "," + z); w.containers.set(x + "," + y + "," + z, { type: "beacon", slots: [null], primary: null, secondary: null }); UI.toast("Build a pyramid of mineral blocks under the Beacon, then right-click it to pick a power.", "good"); G.adv("beacon"); }
  }
  take();
  Sound.place(MATERIAL(id)); G.swing = 0.01; G.hudDirty = true; heldId = -1;
  G.adv("place", id);
  if (id === B.WARD_CANDLE) F.placeCandle(x, y, z);
  R.placed(x, y, z);
  L.blockChanged(x, y, z, false);
  tipDone("place");
  R.vibrate(x + 0.5, y + 0.5, z + 0.5, 14);
  return true;
}
// Finish eating or drinking (after holding right-click for 1.6 seconds)
function finishEat() {
  const e = G.eat, slot = G.inv.slots[e.slot], sd = itemDef(e.id), p = G.player;
  R.vibrate(p.pos.x, p.pos.y + 1.4, p.pos.z, 9);
  G.eat = null;
  if (!slot || slot.id !== e.id) return;
  // food points fill the food bar; fullness (saturation) can never be more than the food bar
  p.hunger = Math.min(20, p.hunger + sd.food);
  p.sat = Math.min(p.hunger, (p.sat || 0) + (sd.sat || 0));
  if (G.meta.ultra && sd.food >= 4 && !sd.raw) G.meta.ultra.meals++;
  if (G.meta.ultra && sd.raw && Math.random() < 0.45) {
    addEffect("queasy", 24); addEffect("poison", 4); UI.toast("Raw food made you sick. Cook your next meal.", "bad");
  }
  if (sd.sideEffect === "poison" || (sd.raw && !G.meta.ultra && slot.id === I.RAW_CHICKEN && Math.random() < 0.3)) { addEffect("poison", 4); UI.toast("That made you feel sick!", "bad"); }
  if (sd.sideEffect === "queasy" && Math.random() < 0.8) { addEffect("queasy", 30); UI.toast("Yuck! You feel queasy (you'll get hungry faster for a bit).", "bad"); }
  if (sd.sideEffect === "cure") { G.effects = {}; G.elv = {}; G.absorb = 0; UI.toast("Milk cleared your effects.", "good"); }
  if (sd.sideEffect === "blink") chorusBlink();
  if (sd.sideEffect === "puffer") { addEffect("poison", 10); addEffect("queasy", 15); UI.toast("Ouch! Puffers are poisonous. Don't eat those!", "bad"); }
  if (sd.sideEffect === "honey" && G.effects.poison) { delete G.effects.poison; UI.toast("The honey soothed the poison.", "good"); }
  if (sd.sideEffect === "potion") drinkPotion(slot);   // Milestone 16
  if (sd.sideEffect === "enchanted_golden") { addEffect("regen", 20, 2); addEffect("absorb", 120, 4); addEffect("resist", 300, 1); addEffect("fireRes", 300, 1); UI.toast("An Enchanted Golden Apple! You feel unstoppable.", "good"); G.adv("notch"); }   // Milestone 22, Part B
  if (sd.sideEffect === "golden") { addEffect("regen", 5, 2); addEffect("absorb", 120, 1); UI.toast("A Golden Apple! You feel strong.", "good"); }
  slot.n--; if (!slot.n) G.inv.slots[e.slot] = null;
  if (sd.sideEffect === "cure") { G.useHand = e.slot; swapHeld(I.BUCKET); G.useHand = null; }
  if ((sd.sideEffect === "honey" || sd.sideEffect === "potion") && G.inv.add(I.BOTTLE, 1)) G.dropItem(I.BOTTLE, 1);
  if (sd.sideEffect === "bowl" && G.inv.add(I.BOWL, 1)) G.dropItem(I.BOWL, 1);   // Milestone 20: you keep the bowl   // you keep the empty bottle
  Sound.eat(); G.swing = 0.01; G.hudDirty = true; heldId = -1;
  if (sd.sideEffect === "potion") { G.adv("drink", slot && slot.pot); if (slot && slot.mod === "strong") G.adv("drinkStrong"); } else G.adv("eat", e.id);
}
function tickEating(dt) {
  const e = G.eat;
  if (!e) return;
  const s = G.inv.slots[e.slot];
  if (!mouseR || !s || s.id !== e.id || G.state !== "play") { G.eat = null; return; }   // let go to stop eating
  e.t += dt; e.crunch -= dt;
  if (e.crunch <= 0) {
    const drinking = itemDef(e.id).potion;   // Milestone 16: potions gulp instead of crunch
    e.crunch = drinking ? 0.4 : 0.22; if (drinking) Sound.gulp(); else Sound.eat();
    const p = G.player, d = lookDir();
    if (!drinking) puff(p.pos.x + d.x * 0.4, p.pos.y + p.eye - 0.4, p.pos.z + d.z * 0.4, "crumb");
  }
  if (e.t >= 1.6) finishEat();
}
// Water next to lava turns the lava into obsidian
function placeLiquid(id, x, y, z) {
  const w = G.world;
  w.set(x, y, z, id);
  if (FL.active()) { FL.wake(x, y, z); return; }   // Milestone 18: it flows, and meeting the other liquid is handled as it spreads
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
  if (LOGGABLE[idOf(hit.v)] && (slot.id === I.WATER_BUCKET || (slot.id === I.BUCKET && metaOf(hit.v) & WATERLOGGED)) && !G.world.gen.isNether()) {   // Milestone 18: fill a fence, gate, trapdoor or sign with water (or scoop it back out)
    const full = slot.id === I.WATER_BUCKET;
    if (full !== !(metaOf(hit.v) & WATERLOGGED)) return;
    w.set(hit.x, hit.y, hit.z, make(idOf(hit.v), full ? metaOf(hit.v) | WATERLOGGED : metaOf(hit.v) & ~WATERLOGGED));
    if (!G.creative) { G.inv.slots[G.useSlot] = newStack(full ? I.BUCKET : I.WATER_BUCKET, 1); heldId = -1; }
    Sound.splash(); FL.wake(hit.x, hit.y, hit.z); G.hudDirty = true; if (full) G.adv("waterlog"); return;
  }
  if (slot.id === I.BUCKET) {
    const id = idOf(hit.v);
    if ((id === B.WATER || id === B.LAVA) && (isSource(hit.v) || !FL.active())) { w.set(hit.x, hit.y, hit.z, B.AIR); swapHeld(id === B.WATER ? I.WATER_BUCKET : I.LAVA_BUCKET); Sound.splash(); FL.wake(hit.x, hit.y, hit.z); }
    else if (id === B.WATER || id === B.LAVA) UI.toast("A bucket can only scoop up a full block, not flowing " + (id === B.WATER ? "water." : "lava."));   // Milestone 18
    return;
  }
  const holds = itemDef(slot.id).holds;   // Milestone 17, Part D: a bucket of fish pours out water and the fish
  const liquid = slot.id === I.WATER_BUCKET || holds ? B.WATER : B.LAVA;
  if (liquid === B.WATER && G.world.gen.isNether()) { puff(hit.x + 0.5, hit.y + 1.5, hit.z + 0.5, "poof"); Sound.mob("hiss", 2); UI.toast("Water boils away instantly in the Ember Depths!", "bad"); if (!G.creative) { G.inv.slots[G.useSlot] = newStack(I.BUCKET, 1); heldId = -1; } G.hudDirty = true; return; }
  let x = hit.x, y = hit.y, z = hit.z;
  if (!blockDef(hit.v).replaceable && idOf(hit.v) !== B.WATER) { x += hit.nx; y += hit.ny; z += hit.nz; }
  const here = w.id(x, y, z);
  if (here && here !== B.WATER && !BLOCKS[here].replaceable) return;
  placeLiquid(liquid, x, y, z);
  if (holds) { ents.add(holds, x + 0.5, y + 0.1, z + 0.5, { persist: true }); UI.toast(`You let the ${SPECIES[holds]?.name || holds} out.`); }
  if (!G.creative) { G.inv.slots[G.useSlot] = newStack(I.BUCKET, 1); heldId = -1; }
  Sound.splash(); G.hudDirty = true;
}
function useBoneMeal(hit, slot) {
  const w = G.world, id = idOf(hit.v);
  let used = false;
  if (isCrop(id)) { const st = metaOf(hit.v) & 7; if (st < 7) { w.set(hit.x, hit.y, hit.z, make(id, Math.min(7, st + 2 + Math.floor(Math.random() * 3)))); used = true; } }
  else if (id === B.SAPLING) { used = true; if (Math.random() < 0.45) growTree(hit.x, hit.y, hit.z, metaOf(hit.v) & 1); }
  else if (BLOCKS[id]?.tree) { used = true; if (Math.random() < 0.45) growWood(hit.x, hit.y, hit.z, BLOCKS[id].tree); }
  else if (id === B.BERRY_BUSH && (metaOf(hit.v) & 3) < 3) { w.set(hit.x, hit.y, hit.z, make(B.BERRY_BUSH, (metaOf(hit.v) & 3) + 1)); used = true; }
  else if (id === B.MOSS_BLOCK && hit.ny === 1) {   // Milestone 20: moss spreads over nearby stone and dirt, with carpets and azaleas on top
    used = true;
    for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = -1; dy <= 1; dy++) {
      if (Math.hypot(dx, dz) > 3.2 || Math.random() < 0.3) continue;
      const x = hit.x + dx, y = hit.y + dy, z = hit.z + dz, g = w.id(x, y, z);
      if ([B.STONE, B.DIRT, B.GRASS, B.COBBLE, B.MOSS_BLOCK].includes(g) && !w.id(x, y + 1, z)) {
        if (g !== B.MOSS_BLOCK) w.set(x, y, z, B.MOSS_BLOCK);
        const q = Math.random(); if (q < 0.3) w.set(x, y + 1, z, B.MOSS_CARPET); else if (q < 0.36) w.set(x, y + 1, z, B.AZALEA); else if (q < 0.38) w.set(x, y + 1, z, B.FLOWERING_AZALEA);
      }
    }
  }
  else if (id === B.GRASS && hit.ny === 1) {
    used = true;
    for (let i = 0; i < 12; i++) { const x = hit.x + Math.floor(Math.random() * 7) - 3, z = hit.z + Math.floor(Math.random() * 7) - 3; if (w.id(x, hit.y, z) === B.GRASS && !w.id(x, hit.y + 1, z)) w.set(x, hit.y + 1, z, Math.random() < 0.8 ? B.TALL_GRASS : Math.random() < 0.5 ? B.FLOWER_RED : B.FLOWER_YELLOW); }
  }
  if (!used) return false;
  puff(hit.x + 0.5, hit.y + 1, hit.z + 0.5, "xp");
  if (slot && !G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
  G.hudDirty = true; heldId = -1;
  return true;
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
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
  Sound.place("soft"); G.hudDirty = true; heldId = -1;
}
function useBed(hit) {
  if (G.meta.ultra) {
    const p = G.player.pos;
    if (G.dim !== "overworld" || skyCols.at(Math.floor(p.x), Math.floor(p.z)).top < p.y + 1 ||
      ents.near(p.x, p.y, p.z, 10, e => !e.dead && (e.def.hostile || (e.def.wildlife && e.angry > 0))).length) {
      UI.toast("Rest requires shelter and distance from enemies.", "bad");
      return;
    }
    G.resting = { x: p.x, y: p.y, z: p.z, left: 20 };
    UI.toast("Resting restores stamina. The night continues.", "good");
    return;
  }
  if (G.world.gen.isNether()) { breakBlock(hit.x, hit.y, hit.z, false); explode(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 3, null); UI.toast("Beds explode in the Ember Depths! Only sleep on the Surface.", "bad"); return; }
  const meta = metaOf(hit.v), [dx, dz] = DIR[meta & 3];
  const head = meta & HEAD ? { x: hit.x, z: hit.z } : { x: hit.x + dx, z: hit.z + dz };
  G.player.spawn = { x: head.x + 0.5, y: hit.y + 1, z: head.z + 0.5, bed: [hit.x, hit.y, hit.z] };
  if (isLostWorldRegion(G.dim)) G.player.spawn.dim = G.dim;
  G.player.anchor = null;
  const night = G.time > 0.53 && G.time < 0.97, storm = G.dim === "overworld" && G.wx.thunder > 0.5;   // Milestone 19: you can sleep through a thunderstorm
  if (!night && !storm) { UI.toast("Respawn point set. You can only sleep at night or during a thunderstorm."); return; }
  if (G.creative === false && ents.near(G.player.pos.x, G.player.pos.y, G.player.pos.z, 10, e => e.def.hostile).length) { UI.toast("You can't rest now. There are monsters nearby!", "bad"); return; }
  if (MP.sleep()) return;   // Play Together: the night is skipped once everyone is in bed
  const shade = document.getElementById("flash");
  shade.style.background = "#000"; shade.classList.add("on");
  setTimeout(() => { G.time = 0.01; G.meta.day = (G.meta.day || 1) + 1; const wet = sleepClearsWeather(); if (storm) G.adv("stormsleep"); shade.classList.remove("on"); setTimeout(() => shade.style.background = "", 400); UI.toast(wet ? "Good morning! The storm has passed. Respawn point set." : "Good morning! Respawn point set.", "good"); G.adv("sleep"); }, 1200);
}
function blocksPlayer(v, x, y, z) {
  const boxes = []; blockBoxes(v, x, y, z, boxes);
  const a = G.player.aabb();
  return boxes.some(b => a[0] < b[3] && a[3] > b[0] && a[1] < b[4] && a[4] > b[1] && a[2] < b[5] && a[5] > b[2]);
}
// ---------- Milestone 21, Part D: paintings, item frames, armor stands (pictures and held things are drawn by js/decor.js) ----------
function placePainting(hit, x, y, z, onWall, f) {
  const w = G.world, slot = G.inv.slots[G.useSlot];
  if (!onWall) { UI.toast("Paintings go on the side of a solid block.", "bad"); Sound.error(); return; }
  const [dx, dz] = DIR[f], rx = -dz, rz = dx;   // along the wall
  const free = (cx, cy, cz) => { const id = w.id(cx, cy, cz); return (!id || BLOCKS[id].replaceable) && OPAQUE[w.id(cx + dx, cy, cz + dz)]; };
  const fits = [];
  for (const art of PAINTINGS) {
    const [key, , pw, ph] = art;
    for (let ox = 0; ox < pw; ox++) for (let oy = 0; oy < ph; oy++) {
      const ax = x - rx * ox, ay = y - oy, az = z - rz * ox;
      let ok = true;
      for (let i = 0; i < pw && ok; i++) for (let j = 0; j < ph && ok; j++) ok = free(ax + rx * i, ay + j, az + rz * i);
      if (ok) { fits.push({ key, pw, ph, ax, ay, az }); ox = pw; break; }
    }
  }
  if (!fits.length) { UI.toast("There's no room for a painting there.", "bad"); Sound.error(); return; }
  const big = Math.max(...fits.map(c => c.pw * c.ph)), pick = fits.filter(c => c.pw * c.ph === big), c = pick[Math.floor(Math.random() * pick.length)];
  const anchor = c.ax + "," + c.ay + "," + c.az;
  for (let i = 0; i < c.pw; i++) for (let j = 0; j < c.ph; j++) {
    const px = c.ax + rx * i, py = c.ay + j, pz = c.az + rz * i;
    w.set(px, py, pz, make(B.PAINTING, f));
    w.containers.set(px + "," + py + "," + pz, i || j ? { type: "paintpart", at: anchor } : { type: "painting", art: c.key, rx, rz });
  }
  if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; }
  Sound.place("wood"); G.swing = 0.01; G.hudDirty = true; heldId = -1;
  UI.toast(`"${PAINTINGS.find(r => r[0] === c.key)[1]}"`); G.adv("painting");
}
// take a whole painting down (from any of its blocks)
function removePainting(x, y, z, drop) {
  const w = G.world, k = x + "," + y + "," + z, c = w.containers.get(k);
  const anchor = c?.type === "paintpart" ? c.at : k, a = w.containers.get(anchor);
  if (!a || a.type !== "painting") { w.set(x, y, z, B.AIR); w.containers.delete(k); return; }
  const r = PAINTINGS.find(p => p[0] === a.art) || PAINTINGS[0], [ax, ay, az] = anchor.split(",").map(Number);
  for (let i = 0; i < r[2]; i++) for (let j = 0; j < r[3]; j++) {
    const px = ax + a.rx * i, py = ay + j, pz = az + a.rz * i;
    if (w.id(px, py, pz) === B.PAINTING) w.set(px, py, pz, B.AIR);
    w.containers.delete(px + "," + py + "," + pz);
  }
  if (drop && !G.creative) spawnDrop(B.PAINTING, 1, x + 0.5, y + 0.5, z + 0.5);
}
// Milestone 22, Part B: a cake. Right-click eats a slice (7 slices); a plain Candle goes on top of a whole cake, Flint and Steel lights it.
function useCake(hit) {
  const w = G.world, slot = G.inv.slots[G.useSlot], m = metaOf(hit.v), p = G.player;
  if (slot && slot.id === B.CANDLE && !(m & 15)) { w.set(hit.x, hit.y, hit.z, make(B.CAKE, 8)); if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; } Sound.place("soft"); G.swing = 0.01; G.hudDirty = true; heldId = -1; return; }
  if (slot && slot.id === I.FLINT_STEEL && (m & 8) && !(m & 16)) { w.set(hit.x, hit.y, hit.z, make(B.CAKE, m | 16)); wearTool(slot, 1); Sound.mob("fireshoot", 0); G.swing = 0.01; G.adv("candle"); return; }
  if (!G.creative && p.hunger >= 20) { UI.toast("You're too full to eat cake right now."); return; }
  if (m & 8) spawnDrop(B.CANDLE, 1, hit.x + 0.5, hit.y + 0.7, hit.z + 0.5);   // eating it knocks the candle off
  const bites = (m & 7) + 1;
  w.set(hit.x, hit.y, hit.z, bites >= 7 ? B.AIR : make(B.CAKE, bites));
  if (!G.creative) { p.hunger = Math.min(20, p.hunger + 2); p.sat = Math.min(p.hunger, (p.sat || 0) + 0.4); }
  Sound.eat(); G.swing = 0.01; G.hudDirty = true; G.adv("cake");
}
function useDecor(hit, kind, key) {
  const w = G.world, slot = G.inv.slots[G.useSlot], c = w.containers.get(key);
  if (!c) return;
  const take = () => { if (!G.creative) { slot.n--; if (!slot.n) G.inv.slots[G.useSlot] = null; } };
  if (kind === "itemframe") {   // put something in; click again to turn it; hit the frame to take it out
    if (!c.slots[0] && slot) { c.slots[0] = { ...slot, n: 1 }; take(); Sound.place("wood"); G.adv("itemframe"); }
    else if (c.slots[0]) { c.rot = ((c.rot || 0) + 1) % 8; Sound.click(); }
  } else {   // armor stand: armor goes on in its place; an empty hand takes the top piece back
    const a = slot && itemDef(slot.id)?.armor;
    if (a && a.slot >= 0 && a.slot < 4) { const old = c.slots[a.slot]; c.slots[a.slot] = { ...slot, n: 1 }; G.inv.slots[G.useSlot] = old || null; if (G.creative && !old) G.inv.slots[G.useSlot] = slot; Sound.place("soft"); G.adv("armorstand"); }
    else if (!slot) { const i = c.slots.findIndex(s => s); if (i >= 0) { G.inv.slots[G.useSlot] = c.slots[i]; c.slots[i] = null; Sound.pickup(); } }
    else UI.toast("Hold a piece of armor to put it on the stand.");
  }
  G.swing = 0.01; G.hudDirty = true; heldId = -1;
}
function interact(hit, kind) {
  const w = G.world, key = hit.x + "," + hit.y + "," + hit.z;
  if (kind === "itemframe" || kind === "armorstand") { useDecor(hit, kind, key); return; }   // Milestone 21, Part D
  if (kind === "cake") { useCake(hit); return; }   // Milestone 22, Part B
  if (kind === "jukebox") { useJukebox(hit, key); return; }   // Milestone 22, Part D
  if (kind === "lore" && G.dim === GODZILLA_CALDERA && !G.guest && GC.interact(hit)) return;
  if (kind === "lore" && isLostWorldDimension(G.dim) && G.story.lostWorld && !G.guest) {
    const record = { ...G.story.lostWorld };
    const note = readCampaignLandmark(G.dim, record, hit);
    if (note) {
      if (record.stage !== G.story.lostWorld.stage) {
        G.story.lostWorld = record;
        if (G.dim === AMBER_CAVERNS && record.stage === SHORTCUT_REQUIRED_STAGE) {
          for (const {x,y,z} of SEAL) if (w.id(x,y,z) === B.GATE_FRAME) w.set(x,y,z,B.AIR);
        }
        if (G.dim === MANGROVE && record.stage === 6) {
          const { x, y, z } = RELAY_LIGHT;
          const chunk = w.chunkAt(x, z);
          const index = chunk && idx(x - chunk.cx * CHUNK, y, z - chunk.cz * CHUNK);
          if (chunk && w.id(x, y, z) === B.GLASS && !w.mods.get(chunk.key)?.has(index)) w.set(x, y, z, B.SHINESTONE);
        }
        saveNow(false);
      }
      UI.openNote(...note, false);
      return;
    }
  }
  if (G.dim === "overworld" && interactDesertVault(hit, kind)) return;
  if (kind === "solkara_gate") { useSolkaraGate(hit); return; }
  if (isSolkaraRealm(G.dim) && G.dimData[G.dim]?.solkaraWing === 1 && interactSolkaraWing(hit, kind)) return;
  if (G.dim === HOLLOW_SANDS && kind === "lore" && atSolkara(hit, THRONE_TABLET)) {
    UI.openNote("The Throne of the Buried King", `Six records survive beneath the sands. The keepers scattered them among the six regions so that no king could awaken the ancient one alone. Claim the Ancient Desert Core and read all six records to awaken the throne. The Core's attunement survives the loss of its physical form. The blue runes build for seven seconds before the King rises. Later, small blue circles fill before its guardians arrive; keep clear of their centers.\n\nThe inner court lies at X ${BURIED_THRONE.x}, Z ${BURIED_THRONE.z}.`, false);
    return;
  }
  if (G.dim === HOLLOW_SANDS && kind === "pedestal" && atSolkara(hit, THRONE_ALTAR)) {
    if (G.story.leviathan?.ancient?.defeated) { claimAncientVictory(); return; }
    awakenAncient();
    return;
  }
  const observatory = G.story.leviathan?.sites?.observatory;
  if (kind === "lore" && G.dim === "overworld" && observatory && atSolkara(hit, observatoryTablet(observatory))) {
    const day = G.meta.day || 1, forecast = nextLeviathanStorm(G.gen.seed, day, G.time);
    const called = stormCallStatus(G.story.leviathan?.stormCall, worldSeconds());
    const report = called.stage > 0 ? called.stage === 4 ? `A called Leviathan Storm is active. Its strongest winds last about ${Math.ceil(called.remainingPeak)} more seconds.` :
      called.untilPeak > 0 ? `A storm is gathering. Its Leviathan phase begins in about ${Math.ceil(called.untilPeak)} seconds.` : "The called storm is easing." :
      sandstormStage(G.gen.seed, day, G.time) === 4 ? "A Leviathan Storm is active now." :
      forecast ? `The next Leviathan Storm is due on day ${forecast.day}, about ${Math.round(forecast.time * 100)}% through the day.` :
        "The instrument detects no Leviathan Storm in the next sixty days.";
    UI.openNote("Great Dune Observatory", report + "\n\n" + STORM_ACTIVITY_GUIDE +
      (called.stage === 0 && !called.ready ? `\n\nThe sands need about ${Math.ceil(called.cooldown)} seconds before another call.` : "") +
      "\n\nWhen the storm darkens and the dunes rumble, sprint across open sand to draw the Leviathan out. Slow down or take shelter to avoid its notice.", false);
    return;
  }
  const city = G.story.leviathan?.sites?.city;
  if (kind === "lore" && G.dim === "overworld" && city && atSolkara(hit, cityTablet(city))) {
    const sites = G.story.leviathan.sites;
    const directions = [["shrine", "Desert Shrine"], ["observatory", "Great Dune Observatory"]].flatMap(([id, name]) => {
      const s = sites[id];
      return s ? [`${name} — X ${s.x + 8}, Z ${s.z + 8}.`] : [];
    });
    UI.openNote("The Last Market Ledger", [
      "The north road vanished overnight. Our last supplies are behind the rough cobble patch in this library.",
      "The keepers copied these bearings before they left the city.",
      ...directions
    ].join("\n\n"), false);
    return;
  }
  const citadel = G.story.leviathan?.sites?.citadel;
  if (kind === "lore" && G.dim === "overworld" && citadel && atSolkara(hit, citadelTablet(citadel))) {
    const arena = citadelArena(citadel);
    const forge = hasDesertVault("citadel", citadel) ? " The old forge vault is just west of this tablet." : "";
    if (citadel.volcanicLayout === OBSIDIAN_BADLANDS_LAYOUT) {
      const entry = obsidianChamberEntry(G.gen, citadel);
      UI.toast(`The crystal stair to the magma chamber lies at X ${entry.x}, Z ${entry.z}.`);
    }
    UI.openNote("The Basalt Watch", `Cross by the dark stone causeway. The outer ring burns underfoot, but the basalt path leads through it. The inner court lies at X ${Math.floor(arena.x)}, Z ${Math.floor(arena.z)}. The quartermaster kept healing supplies in the chest opposite this tablet.${forge}\n\nHeart of the Inferno\nFirst earn the Dune Leviathan's trust. Bring ${OBSIDIAN_OFFERING_TEXT}. Approach the awakened creature on the arena floor with a clear view and sound the Sandcaller Horn to offer them. Then answer the next four recoveries when its molten veins dim. Each answer intensifies the trial. Striking it resets the sequence, but the offering stays accepted across retries. Once bonded, recall it to the Citadel's clear inner court, or crouch while sounding the horn on wide, flat desert sand.`, false);
    return;
  }
  if (kind === "lore" && G.dim === HOLLOW_SANDS) {
    if (G.dimData[HOLLOW_SANDS]?.solkaraScenery === SOLKARA_SCENERY_LAYOUT) {
      const site = SOLKARA_SCENERY.find(s => hit.x === s.x && hit.z === s.z + 4 && hit.y === solkaraSceneryTablet(G.gen, s).y);
      if (site) { UI.openNote(site.title, site.note, false); return; }
    }
    const tablet = SANDS_TABLETS.find(t => t.x === hit.x && t.z === hit.z && G.gen.column(t.x, t.z).h + 2 === hit.y);
    if (tablet) {
      const expansion = G.story.leviathan ||= {};
      const first = !G.creative && !G.spectator && !expansion.sandsLore?.[tablet.region.name];
      if (first) {
        expansion.sandsLore = { ...expansion.sandsLore, [tablet.region.name]: true };
        saveNow(false);
      }
      UI.openNote(tablet.region.name, tablet.region.lore, first);
      return;
    }
  }
  if (isSolkaraRealm(G.dim) && G.dimData[G.dim]?.solkaraAnnex === 1 && interactSolkara(hit, kind)) return;
  if (CP.interact(hit, kind)) return;  // the Legacy Campaign's Waystones and Rune Stones
  if (F.interact(hit, kind)) return;   // the Forsaken World's notes, wards, shrines, gate, and altar
  if (L.interact(hit, kind)) return;   // the Lost Civilization's tablets, lifts, puzzles, sockets, and beacons
  if (kind === "door") {
    const meta = metaOf(hit.v), by = meta & TOP ? hit.y - 1 : hit.y;
    const open = !(meta & OPEN);
    for (const yy of [by, by + 1]) { const v = w.get(hit.x, yy, hit.z); if (idOf(v) === B.DOOR) { const m = metaOf(v); w.set(hit.x, yy, hit.z, make(B.DOOR, open ? m | OPEN : m & ~OPEN)); } }
    // don't let a closing door trap the player inside it
    Sound.door(open); R.vibrate(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, open ? 11 : 10); return;
  }
  if (kind === "table") { openPanel("table"); return; }
  if (kind === "sign") {
    const expansion = G.story.leviathan;
    if (G.dim === "overworld" && relicSiteAt(expansion?.sites, hit, shrineSign)?.key === "shrine") {
      if (!G.creative && !G.spectator && !expansion.shrineRead) {
        expansion.shrineRead = true;
        saveNow(false);
      }
      const prep = sandcallerPreparation(G);
      UI.openNote("The Call of the Sands", [SHRINE_INSCRIPTION,
        "Search this shrine's cache for the first relic. The keepers left bearings to the other relic ruins and the storm instrument:",
        ...leviathanShrineBearings(G.story),
        ...[prep.instructions, prep.sources, prep.bearing].filter(Boolean),
        "Press J and choose Leviathan to reread these bearings. They mark the ruins, not a roaming Leviathan."
      ].join("\n\n"), false);
    } else ST.readSign(hit);
    return;
  }
  if (kind === "maptable") { ST.useTable(); return; }
  if (kind === "bed") { useBed(hit); return; }
  if (kind === "berries") {   // pick ripe berries (the bush keeps growing)
    const st = metaOf(hit.v) & 3, s = G.inv.slots[G.useSlot];
    if (st >= 2) {
      spawnDrop(I.BERRIES, st === 3 ? 2 + Math.floor(Math.random() * 2) : 1, hit.x + 0.5, hit.y + 0.6, hit.z + 0.5);
      w.set(hit.x, hit.y, hit.z, make(B.BERRY_BUSH, 1)); w.crops.add(key); Sound.place("leaf");
    } else if (s && s.id === I.BONE_MEAL) useBoneMeal(hit, s);
    return;
  }
  if (kind === "hive") { harvestHoney(hit); return; }
  if (kind === "frame") { fillFrame(hit); return; }
  if (kind === "winch") { CG.useWinch(hit); return; }
  if (kind === "tome") { CK.readTome(hit); return; }
  if (kind === "clever") { CD.useLever(hit); return; }
  if (kind === "secretshelf") { CD.useShelf(hit); return; }
  if (kind === "watchfire") { CD.useWatchfire(hit); return; }
  if (kind === "cauldron") { useCauldron(hit); return; }
  if (kind === "berries_vine") {   // Milestone 20: pick glow berries from a ripe cave vine
    if (!(metaOf(hit.v) & 1)) return;
    w.set(hit.x, hit.y, hit.z, make(B.CAVE_VINES, 0)); w.crops.add(key); if (G.inv.add(I.GLOW_BERRIES, 1)) spawnDrop(I.GLOW_BERRIES, 1, hit.x + 0.5, hit.y + 0.5, hit.z + 0.5); Sound.pickup(); G.hudDirty = true; return;
  }   // Milestone 16
  if (kind === "brew") { if (!w.containers.has(key)) w.containers.set(key, { type: "brew", slots: [null, null, null, null, null], fuel: 0, prog: 0 }); Sound.door(true); openPanel("brew", key); return; }
  if (kind === "anvil" || kind === "grindstone") { const t = kind === "anvil" ? "anvil" : "grind"; if (!w.containers.has(key)) w.containers.set(key, { type: t, slots: [null, null] }); Sound.door(true); openPanel(t, key); return; }   // Milestone 15, Part B
  if (kind === "enchant") { if (!w.containers.has(key)) w.containers.set(key, { type: "enchant", slots: [null, null] }); Sound.pageTurn(); openPanel("enchant", key); return; }   // Milestone 15
  if (kind === "beacon") { if (!w.containers.has(key)) w.containers.set(key, { type: "beacon", slots: [null], primary: null, secondary: null, legacy: true }); w.beacons.add(key); openPanel("beacon", key); return; }
  if (kind === "shellbox") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "chest", slots: new Array(27).fill(null) });
    Sound.door(true); openPanel("chest", key); return;
  }
  if (kind === "chest") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "chest", slots: new Array(27).fill(null) });
    if (metaOf(hit.v) & LOOT) {
      fillLoot(w.containers.get(key), hit);
      w.set(hit.x, hit.y, hit.z, make(B.CHEST, metaOf(hit.v) & 3));
      G.adv("loot");
      // Save after the loot bit is cleared, so reopening cannot refill the cache.
      if (!G.creative && !G.spectator && G.dim === "overworld" &&
          relicSiteAt(G.story.leviathan?.sites, hit, relicCache)) saveNow(false);
    }
    L.chestOpened(key);
    Sound.door(true); openPanel("chest", key); return;
  }
  if (kind === "anchor") { useAnchor(hit); return; }
  if (kind === "cinderaltar") { useCinderAltar(hit); return; }
  if (kind === "lodestone") { bindCompass(hit); return; }
  if (kind === "voidchest") { Sound.door(true); puff(hit.x + 0.5, hit.y + 1.1, hit.z + 0.5, "portal"); openPanel("voidchest"); G.adv("voidchest"); return; }
  if (kind === "stonecutter") { openPanel("cutter"); return; }   // Milestone 23, Part A
  if (kind === "furnace") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "furnace", slots: [null, null, null], burn: 0, burnMax: 0, prog: 0 });
    openPanel("furnace", key);
  }
}

function saveDesertVault(key, record) {
  const expansion = G.story.leviathan;
  expansion.vaults = { ...expansion.vaults, [key]: record };
  saveNow(false);
}
function checkpointDesertVaultVictory(key) {
  if (G.dim !== "overworld" || G.creative || G.spectator) return;
  const expansion = G.story.leviathan, record = expansion?.vaults?.[key];
  const vault = desertVault(key, expansion?.sites?.[key]);
  if (!vault || record?.next !== vault.order.length || record.cleared) return;
  saveDesertVault(key, { ...record, cleared: true });
  UI.toast(`${vault.name} is clear. Return to its pedestal for supplies.`, "good");
}
function pressDesertVaultSwitch(vault, hit, index, record) {
  if (record.next === vault.order.length) return;
  const world = G.world;
  if (!vault.switches.every(p => world.isLoaded(p.x, p.z))) {
    UI.toast("The vault is still loading. Try again in a moment.");
    return;
  }
  const correct = index === vault.order[record.next];
  const next = correct ? record.next + 1 : Number(index === vault.order[0]);
  for (const [i, p] of vault.switches.entries()) {
    const old = world.get(p.x, p.y, p.z);
    const value = make(B.KEEPER_SWITCH, Number(vault.order.indexOf(i) < next));
    if (idOf(old) === B.KEEPER_SWITCH && old !== value) world.set(p.x, p.y, p.z, value);
  }
  if (next !== record.next) saveDesertVault(vault.key, { ...record, next });
  if (correct) {
    UI.toast(next === vault.order.length ? "The runes lock into place. Touch the vault pedestal." :
      `${vault.switches[index].label} rings true.`, "good");
    Sound.tone(240 + next * 90, 0.35, "sine", 0.15);
    return;
  }
  UI.toast("The ward rejects the order. Step away from the switch.", "bad");
  if (G.wset.difficulty === "peaceful" || ents.hazards?.some(h => h.owner?.vaultKey === vault.key && !h.gone)) return;
  const owner = { vaultKey: vault.key, get gone() {
    return G.world !== world || !world.isLoaded(hit.x, hit.z) ||
      G.story.leviathan?.vaults?.[vault.key]?.next === vault.order.length;
  } };
  ents.addHazard(hit.x + 0.5, hit.y, hit.z + 0.5, 2.1, 1.2, 3, "A vault ward caught you. Move away from the glowing ring.", 0.35,
    { owner, damageKind: "sand", statusEffect: null, particle: "crumb", color: 0xf5a941 });
}
function useDesertVaultPedestal(vault, record) {
  if (record.claimed) { UI.toast("You already claimed this vault."); return; }
  if (record.next !== vault.order.length) { UI.toast("Read the tablet and solve the switch sequence first."); return; }
  if (!record.cleared && G.wset.difficulty !== "peaceful") {
    if (ents.list.some(e => e.desertVaultGuard === vault.key && !e.gone && !e.dead)) {
      UI.toast("Defeat the vault guardian first.");
      return;
    }
    const { x, y, z } = vault.guardPosition, p = G.player.pos, w = G.world;
    if (!w.isLoaded(x, z) || !SOLID[w.id(x, y - 1, z)] || w.id(x, y, z) || w.id(x, y + 1, z) ||
        Math.hypot(p.x - x - 0.5, p.y - y, p.z - z - 0.5) < 1.8 || ents.list.length >= 120) {
      UI.toast("The guardian needs room to rise. Clear its floor and step back.", "bad");
      return;
    }
    const guard = ents.add(vault.guard, x + 0.5, y, z + 0.5);
    guard.persist = false;
    guard.desertVaultGuard = vault.key;
    UI.toast("The vault guardian rises!", "bad");
    return;
  }
  const preview = new Inventory();
  preview.load(G.inv.toJSON());
  for (const [id, count] of vault.rewards) {
    if (preview.add(id, count)) { UI.toast("Make room in your inventory and try the pedestal again.", "bad"); return; }
  }
  G.inv.load(preview.toJSON());
  G.hudDirty = true;
  saveDesertVault(vault.key, { ...record, cleared: true, claimed: true });
  Sound.levelUp();
  UI.toast(`You claimed the ${vault.name} supplies.`, "good");
}
function interactDesertVault(hit, kind) {
  if (kind !== "lore" && kind !== "switch" && kind !== "pedestal") return false;
  const expansion = G.story.leviathan;
  for (const key of ["tomb", "citadel"]) {
    const vault = desertVault(key, expansion?.sites?.[key]);
    if (!vault) continue;
    if (kind === "lore" && idOf(hit.v) === B.LORE_TABLET) {
      if (vault.entrance && atSolkara(hit, vault.entrance)) {
        UI.openNote("Buried Royal Tomb", "The Tomb Relic rests in the surface chest. The keepers left their vault below. Follow the steps down the west wall and read the tablet before touching the switches.", false);
        return true;
      }
      if (atSolkara(hit, vault.tablet)) { UI.openNote(vault.name, vault.lore, false); return true; }
    }
    const index = kind === "switch" && idOf(hit.v) === B.KEEPER_SWITCH ? vault.switches.findIndex(p => atSolkara(hit, p)) : -1;
    const pedestal = kind === "pedestal" && idOf(hit.v) === B.RELIC_PEDESTAL && atSolkara(hit, vault.pedestal);
    if (index < 0 && !pedestal) continue;
    if (G.creative || G.spectator) return true;
    const record = expansion.vaults?.[key] || { next: 0, cleared: false, claimed: false };
    if (pedestal) useDesertVaultPedestal(vault, record);
    else pressDesertVaultSwitch(vault, hit, index, record);
    return true;
  }
  return false;
}
function interactSolkara(hit, kind) {
  if (kind === "mural" && atSolkara(hit, SOLKARA_MURAL)) {
    UI.openNote("The Leviathan Mural", "Three keepers stand above the old road. Gold marks the Dune Leviathan, ember marks Obsidian, and pale blue marks the Buried King.\n\nThe Buried Kings crossed the dunes by following the old signs. First the sun gave them light. Then the river showed them the way. Last the star led them home. The chamber places the star at the north end, the sun in the middle, and the river to the south.", false);
    return true;
  }
  const mark = kind === "switch" && solkaraMarkAt(hit);
  const altar = kind === "pedestal" && atSolkara(hit, SOLKARA_ALTAR);
  if (!mark && !altar) return false;
  const expansion = G.story.leviathan ||= {};
  const progress = expansion.annex ||= { next: 0 };
  progress.next ??= 0;
  if (mark) {
    if (progress.solved) return true;
    if (mark.name !== SOLKARA_ORDER[progress.next]) {
      progress.next = mark.name === SOLKARA_ORDER[0] ? 1 : 0;
      UI.toast(`The ${mark.name} glyph rings out. The echo sequence resets.`);
    } else {
      progress.next++;
      if (progress.next === SOLKARA_ORDER.length) progress.solved = true;
      UI.toast(progress.solved ? "The chamber answers. The Leviathan Altar awakens." : `The ${mark.name} glyph rings out.`, "good");
      Sound.tone(240 + progress.next * 90, 0.35, "sine", 0.15);
    }
    for (const p of SOLKARA_MARKS) {
      const on = SOLKARA_ORDER.indexOf(p.name) < progress.next;
      const value = make(B.KEEPER_SWITCH, on ? 1 : 0);
      const old = G.world.get(p.x, p.y, p.z);
      if (idOf(old) === B.KEEPER_SWITCH && old !== value) G.world.set(p.x, p.y, p.z, value);
    }
    return true;
  }
  if (!progress.solved) UI.toast("Listen to the Chamber of Echoes before touching the altar.");
  else if (!RELIC_SITES.every(def => hasDesertRelic(G, def))) UI.toast("Find and attune the three desert relics before returning to the altar.");
  else if (progress.coreClaimed) UI.toast("Bring the Ancient Desert Core to the Sealed Gateway.");
  else if (G.inv.add(I.ANCIENT_DESERT_CORE, 1)) UI.toast("Make one free inventory slot for the Ancient Desert Core.", "bad");
  else {
    progress.coreClaimed = true;
    G.hudDirty = true;
    Sound.levelUp();
    saveNow(false);
    UI.toast("You recovered the Ancient Desert Core.", "good");
  }
  return true;
}
let scarabVaultGuards = null;
function checkpointScarabVaultVictory() {
  if (!scarabVaultGuards || !scarabVaultGuards.every(e => e && e.hp <= 0)) return false;
  const wing = (G.story.leviathan ||= {}).wing ||= {};
  if (!wing.vaultCleared) {
    wing.vaultCleared = true;
    scarabVaultGuards = null;
    saveNow(false);
    UI.toast("The Scarab Vault is clear. Claim its supplies at the altar.", "good");
  }
  return true;
}
function tickSolkaraSandfall() {
  if (!isSolkaraRealm(G.dim) || G.dimData[G.dim]?.solkaraWing !== 1 || G.creative || G.spectator ||
      G.wset.difficulty === "peaceful") return;
  const wing = (G.story.leviathan ||= {}).wing ||= {};
  const t = SOLKARA_SAND_TRAP, p = G.player.pos, now = worldSeconds();
  if (wing.trapDisabled || now < (wing.trapReadyAt || 0) || Math.abs(p.y - t.y) > 2 ||
      Math.hypot(p.x - t.x, p.z - t.z) >= t.radius) return;
  wing.trapReadyAt = now + 12;
  ents.addHazard(t.x + 0.5, t.y, t.z + 0.5, t.radius, 1.8, 3, "Falling sand caught you. Use the dark edge paths.", 0.35,
    { damageKind: "sand", statusEffect: null, particle: "crumb", color: 0xd7b77b,
      owner: { get gone() { return wing.trapDisabled; } } });
  for (let i = 0; i < 12 && parts.length < PMAX - 12; i++) {
    emitParticle(t.x + (Math.random() - 0.5) * 3, t.y + 4.7, t.z + (Math.random() - 0.5) * 3,
      0, -0.6, 0, 1.5, PUFF_COLORS.crumb, true);
  }
  UI.toast("Sand falls from the ceiling. Reach the dark edge paths!");
}
function interactSolkaraWing(hit, kind) {
  const expansion = G.story.leviathan ||= {};
  const wing = expansion.wing ||= {};
  const record = kind === "lore" && solkaraRecordAt(hit);
  if (record) {
    if (!G.creative && !G.spectator) {
      const lore = expansion.solkaraLore ||= {};
      lore[record.id] = true;
    }
    UI.openNote(record.title, record.text, false);
    return true;
  }
  if (kind === "lore" && atSolkara(hit, SOLKARA_LIBRARY)) {
    UI.openNote("The Forgotten Library", "The last archivist diverted the falling sand through the dark drains at the edges of the passage. Jump onto the raised dark stone edges when dust gathers overhead, and keep clear of the falling sand in the middle. The brass switch at the library's south end seals the sand ducts. Beyond the passage, two scarabs keep watch over the supply vault.", false);
    return true;
  }
  if (kind === "switch" && atSolkara(hit, SOLKARA_WING_SWITCH)) {
    if (!wing.trapDisabled) {
      wing.trapDisabled = true;
      G.world.set(hit.x, hit.y, hit.z, make(B.KEEPER_SWITCH, 1));
      saveNow(false);
    }
    UI.toast("The sand ducts close. The vault passage is safe.", "good");
    return true;
  }
  if (kind !== "pedestal" || !atSolkara(hit, SOLKARA_VAULT)) return false;
  if (wing.vaultClaimed) { UI.toast("The Scarab Vault has been claimed."); return true; }
  if (!wing.vaultCleared && !checkpointScarabVaultVictory()) {
    const points = [-1, 1].map(side => ({ x: hit.x + side * 3 + 0.5, y: hit.y, z: hit.z + 0.5 }));
    scarabVaultGuards ||= [null, null];
    const missing = points.map((p, i) => i).filter(i => {
      const e = scarabVaultGuards[i];
      return !e || (e.hp > 0 && (e.gone || !ents.list.includes(e)));
    });
    if (missing.some(i => [0, 1].some(dy => G.world.id(Math.floor(points[i].x), points[i].y + dy, Math.floor(points[i].z)) !== B.AIR))) {
      UI.toast("Clear the scarabs' alcoves before opening the vault."); return true;
    }
    for (const i of missing) {
      const p = points[i], previous = scarabVaultGuards[i];
      const e = ents.add("sunscarab", p.x, p.y, p.z, previous ? { hp: previous.hp } : {});
      e.scarabVaultGuard = true;
      scarabVaultGuards[i] = e;
      puff(p.x, p.y + 0.5, p.z, "crumb");
    }
    UI.toast(missing.length ? "The vault scarabs awaken. Defeat them to claim the supplies." : "The scarabs still guard this vault.");
    return true;
  }
  const rewards = [[I.SKYSHARD, 3], [I.GOLD_INGOT, 6], [I.GOLDEN_APPLE, 2]];
  const preview = new Inventory(); preview.load(G.inv.toJSON());
  if (rewards.some(([id, n]) => preview.add(id, n) > 0)) {
    UI.toast("Make room in your inventory, then claim the vault again.", "bad"); return true;
  }
  for (const [id, n] of rewards) G.inv.add(id, n);
  wing.vaultClaimed = true; G.hudDirty = true;
  saveNow(false);
  UI.toast("You claimed the Scarab Vault.", "good");
  return true;
}

function useSolkaraGate(hit) {
  if (G.traveling) return;
  const p = G.player;
  if (G.dim === SOLKARA_SANCTUARY && atSolkara(hit, SOLKARA_RETURN)) {
    const spawn = p.spawn || { x: 0, z: 0 };
    changeDim("overworld", spawn.x, spawn.z, "Returning to the Surface…", () => placeSafely(p, spawn.x, spawn.z));
    return;
  }
  const land = (x, y, z) => {
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
      const px = x + dx, pz = z + dz;
      if (!SOLID[G.world.id(Math.floor(px), y - 1, Math.floor(pz))] ||
          G.world.id(Math.floor(px), y, Math.floor(pz)) !== B.AIR || p.collides(G.world, p.aabb(px, y, pz))) continue;
      Object.assign(p.pos, { x: px, y, z: pz });
      return;
    }
    throw new Error("Solkara arrival is blocked.");
  };
  if (G.dim === HOLLOW_SANDS && atSolkara(hit, SANDS_RETURN)) {
    const origin = G.story.leviathan?.gatewayDim === SOLKARA_SANCTUARY ? SOLKARA_SANCTUARY : "desert";
    changeDim(origin, -58, 27, "Returning to the Solkara halls…", () => land(-58.5, SOLKARA_ALTAR.y, 27.5));
    return;
  }
  if (!isSolkaraRealm(G.dim) || G.dimData[G.dim]?.solkaraAnnex !== 1 || !atSolkara(hit, SOLKARA_GATE)) return;
  const progress = G.story.leviathan?.annex;
  if (!progress?.gateOpen && !(G.creative && G.dim === SOLKARA_SANCTUARY)) {
    if (!progress?.coreClaimed) {
      UI.toast("The gateway is sealed. Claim the Ancient Desert Core at the Leviathan Altar.");
      return;
    }
    progress.gateOpen = true;
    Sound.tone(62, 0.95, "sine", 0.18, 14);
    Sound.levelUp();
    saveNow(false);
    UI.toast("The Sealed Gateway opens. Interact again to cross.", "good");
    return;
  }
  const origin = G.dim;
  changeDim(HOLLOW_SANDS, SANDS_ARRIVAL.x, SANDS_ARRIVAL.z, "Entering the Hollow Sands…", () => {
    land(SANDS_ARRIVAL.x, SANDS_ARRIVAL.y, SANDS_ARRIVAL.z);
    (G.story.leviathan ||= {}).gatewayDim = origin;
    hollowArrivalUntil = G.clock + 4;
    Sound.tone(74, 0.75, "sine", 0.15, -18);
    UI.toast("Open the Hollow Sands map (M) to find the six records and your return gate.");
  });
}

let solkaraCore = null;
let solkaraGateView = null;
let solkaraMural = null;
let solkaraGateDustAt = 0, hollowArrivalUntil = 0;
const hollowArrival = document.getElementById("hollowArrival");
function clearSolkaraMural() {
  solkaraMural?.dispose();
  solkaraMural = null;
}
function updateSolkaraMural() {
  if (!isSolkaraRealm(G.dim) || G.dimData[G.dim]?.solkaraAnnex !== 1) return;
  const { x, y, z } = SOLKARA_MURAL, p = G.player.pos;
  const limit = solkaraMural ? 26 : 20;
  if (Math.hypot(p.x - x, p.y - y, p.z - z) > limit || G.world.id(x, y, z) !== B.MURAL) {
    if (solkaraMural) clearSolkaraMural();
    return;
  }
  if (!solkaraMural) {
    solkaraMural = createSolkaraMuralView(SOLKARA_MURAL);
    scene.add(solkaraMural.mesh);
  }
}
function clearSolkaraGateView() {
  if (!solkaraGateView) return;
  scene.remove(solkaraGateView);
  solkaraGateView.geometry.dispose();
  solkaraGateView.material.dispose();
  solkaraGateView = null;
  solkaraGateDustAt = 0;
}
function updateSolkaraGateView() {
  const showArrival = G.dim === HOLLOW_SANDS && G.clock < hollowArrivalUntil;
  if (hollowArrival.hidden === showArrival) hollowArrival.hidden = !showArrival;
  const returning = G.dim === HOLLOW_SANDS;
  const active = returning || (isSolkaraRealm(G.dim) && G.dimData[G.dim]?.solkaraAnnex === 1 &&
    (G.story.leviathan?.annex?.gateOpen || G.creative && G.dim === SOLKARA_SANCTUARY));
  const gate = returning ? SANDS_RETURN : SOLKARA_GATE;
  const x = gate.x + (returning ? 0.5 : 1.025), y = gate.y + (returning ? 1.95 : 1.5);
  const z = gate.z + (returning ? 1.025 : 0.5);
  const p = G.player.pos;
  const distance = active ? Math.hypot(x - p.x, y - p.y, z - p.z) : Infinity;
  if (distance >= 24) {
    clearSolkaraGateView();
    return;
  }
  if (!solkaraGateView) {
    solkaraGateView = makeSolkaraGateView(returning);
    solkaraGateView.position.set(x, y, z);
    scene.add(solkaraGateView);
  }
  const uniforms = solkaraGateView.material.uniforms;
  uniforms.clock.value = G.settings.reducedMotion ? 0 : G.clock;
  uniforms.visibility.value = Math.min(1, (24 - distance) / 8);
  if (distance > 16 || G.settings.reducedMotion || G.clock < solkaraGateDustAt ||
      G.state !== "play" || parts.length >= PMAX - 16) return;
  solkaraGateDustAt = G.clock + (G.settings.quality === "fast" ? 0.34 : 0.19);
  const offset = (Math.random() - 0.5) * 2;
  emitParticle(x + (returning ? offset : 0.1), y - 1.1, z + (returning ? 0.1 : offset),
    0, 1.5, 0, 0.7, PUFF_COLORS.crumb, true);
}
function clearSolkaraCore() {
  if (!solkaraCore) return;
  scene.remove(solkaraCore);
  for (const mesh of solkaraCore.children) { mesh.geometry.dispose(); mesh.material.dispose(); }
  solkaraCore = null;
}
function updateSolkaraCore() {
  const altar = SOLKARA_ALTAR, progress = G.story.leviathan?.annex, p = G.player.pos;
  if (!isSolkaraRealm(G.dim) || G.dimData[G.dim]?.solkaraAnnex !== 1 || !progress?.solved || progress.coreClaimed ||
      Math.hypot(p.x - altar.x, p.y - altar.y, p.z - altar.z) > 24) {
    clearSolkaraCore();
    return;
  }
  if (!solkaraCore) {
    solkaraCore = new THREE.Group();
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshBasicMaterial({ color: 0x8be7cf }));
    const cage = new THREE.Mesh(new THREE.OctahedronGeometry(0.46), new THREE.MeshBasicMaterial({ color: 0xffd08a, wireframe: true }));
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.024, 5, 24), new THREE.MeshBasicMaterial({ color: 0xe7ae63 }));
    solkaraCore.add(gem, cage, orbit);
    scene.add(solkaraCore);
  }
  const t = G.settings.reducedMotion ? 0 : G.clock;
  solkaraCore.position.set(altar.x + 0.5, altar.y + 1.55 + Math.sin(t * 2) * 0.16, altar.z + 0.5);
  const [gem, cage, orbit] = solkaraCore.children;
  gem.rotation.set(0.25, t * 0.85, 0.14);
  cage.rotation.set(-0.28, -t * 0.53, -0.14);
  orbit.rotation.set(1.15 + Math.sin(t) * 0.24, 0, t * 0.4);
}
// A full nest or hive (honey dripping from the front) gives a Honey Bottle (with a Glass Bottle) or 3 Honeycomb (with Shears)
function torchNear(x, y, z) {
  for (let dy = -3; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (G.world.id(x + dx, y + dy, z + dz) === B.TORCH) return true;
  return false;
}
function harvestHoney(hit) {
  const w = G.world, s = G.inv.slots[G.useSlot], id = idOf(hit.v), name = BLOCKS[id].name;
  if (honeyOf(hit.v) < HONEY_MAX) {
    UI.toast(`This ${name} isn't full of honey yet (${honeyOf(hit.v)} of ${HONEY_MAX}). Buzzers bring honey after visiting flowers.`);
    return;
  }
  if (s && s.id === I.BOTTLE) { s.n--; if (!s.n) G.inv.slots[G.useSlot] = null; if (G.inv.add(I.HONEY_BOTTLE, 1)) G.dropItem(I.HONEY_BOTTLE, 1); heldId = -1; }
  else if (s && s.id === I.SHEARS) { spawnDrop(I.HONEYCOMB, 3, hit.x + 0.5 + hit.nx * 0.6, hit.y + 0.5, hit.z + 0.5 + hit.nz * 0.6); wearTool(s, 1); }
  else { UI.toast(`This ${name} is full of honey! Use a Glass Bottle or Shears on it to collect some.`); return; }
  w.set(hit.x, hit.y, hit.z, make(id, metaOf(hit.v) & 3));
  Sound.place("soft"); G.swing = 0.01; G.hudDirty = true;
  if (!torchNear(hit.x, hit.y, hit.z) && !G.creative) { ents.angerBees(hit.x, hit.y, hit.z); UI.toast("The bees are angry! Next time, put a Torch within 3 blocks of the nest first. The smoke calms them.", "bad"); }
}
// Milestone 17, Part B: what sunken chests hold (like Java's shipwreck, ocean ruin, and buried treasure chests)
function structureLoot(kind, r, put, putS, book) {
  const n = (a, b) => a + Math.floor(r() * (b - a + 1));
  G.adv("structureLoot", kind);
  if (kind === 6) {   // a Pillager Outpost's lookout
    put(I.ARROW, n(8, 24)); put(I.WHEAT, n(3, 8)); put(I.POTATO, n(2, 5)); put(I.CARROT, n(2, 5)); put(I.STRING, n(1, 6));
    if (r() < 0.5) put(I.CROSSBOW, 1); if (r() < 0.4) put(I.IRON_INGOT, n(1, 3)); if (r() < 0.3) put(B.GRAY_BANNER, 1); if (r() < 0.25) book();
  } else {   // a Woodland Mansion's treasure
    put(I.GOLD_INGOT, n(2, 6)); put(I.BREAD, n(2, 5)); put(I.JADE, n(2, 6)); put(I.NAME_TAG, 1);
    if (r() < 0.6) book(); if (r() < 0.5) put(I.SKYSHARD, n(1, 2)); if (r() < 0.25) put(I.GOLDEN_APPLE, 1); if (r() < 0.12) put(I.TOTEM, 1); if (r() < 0.2) put(DISC_ITEMS[Math.floor(r() * DISC_ITEMS.length)], 1);
  }
}
function seaLoot(box, hit, kind, r, put, putS, book) {
  G.adv("sealoot", kind);   // Milestone 17, Part E
  const n = (a, b) => a + Math.floor(r() * (b - a + 1)), story = G.story;
  if (kind === SEA_LOOT.supply) {
    put(I.PAPER, n(1, 8)); put(I.CARROT, n(2, 6)); put(I.WHEAT, n(4, 12)); put(I.COAL, n(2, 6));
    if (r() < 0.6) put(I.ROTTEN_FLESH, n(3, 8)); if (r() < 0.4) put(B.BAMBOO, n(1, 3)); if (r() < 0.4) put(I.DRIED_KELP, n(2, 8));
    if (r() < 0.3) put(B.TNT, n(1, 2)); if (r() < 0.3) put(I.NAUTILUS_SHELL, 1); if (r() < 0.35) put(r() < 0.5 ? I.LEATHER_HELMET : I.LEATHER_CHEST, 1);
    UI.toast("You found the ship's supplies.", "good");
  } else if (kind === SEA_LOOT.map) {
    if (!giveTreasureMap(putS, hit)) put(I.GOLD_INGOT, 2);
    put(I.PAPER, n(1, 6)); if (r() < 0.4) put(I.FEATHER, n(1, 4)); if (r() < 0.3) put(I.COMPASS, 1); if (r() < 0.25) put(I.BOOK, n(1, 3));
  } else if (kind === SEA_LOOT.treasure) {
    put(I.IRON_INGOT, n(1, 5)); put(I.GOLD_INGOT, n(1, 5)); if (r() < 0.6) put(I.JADE, n(1, 5)); if (r() < 0.5) put(I.LAPIS, n(1, 10));
    if (r() < 0.5) put(I.GOLD_NUGGET, n(1, 10)); if (r() < 0.12) put(I.SKYSHARD, 1); if (r() < 0.15) book();
    UI.toast("You found the ship's treasure!", "good");
  } else if (kind === SEA_LOOT.ruin) {
    if (r() < 0.6) put(I.COAL, n(1, 4)); if (r() < 0.5) put(I.WHEAT, n(2, 3)); if (r() < 0.5) put(I.GOLD_NUGGET, n(1, 3)); if (r() < 0.4) put(I.ROTTEN_FLESH, n(1, 3));
    if (r() < 0.45) put(I.NAUTILUS_SHELL, n(1, 2)); if (r() < 0.3) put(I.JADE, 1); if (r() < 0.15) put(I.FISHING_ROD, 1); if (r() < 0.2) put(I.STONE_AXE, 1); if (r() < 0.1) book();
    if (r() < 0.2) giveTreasureMap(putS, hit);
    if (box.slots.every(q => !q)) put(I.COAL, 2);
  } else if (kind === SEA_LOOT.buried) {
    put(I.HEART_OF_THE_SEA, 1); put(I.IRON_INGOT, n(1, 4)); put(I.GOLD_INGOT, n(1, 4)); put(I.COOKED_MINNOW, n(2, 4));
    if (r() < 0.5) put(I.JADE, n(4, 8)); if (r() < 0.5) put(B.TNT, n(1, 2)); if (r() < 0.5) put(I.SKYSHARD, 1); if (r() < 0.25) put(I.PRISMARINE_CRYSTALS, n(1, 5)); if (r() < 0.2) put(I.IRON_SWORD, 1);
    story.treasures ||= []; const k = hit.x + "," + hit.z; if (!story.treasures.includes(k)) story.treasures.push(k);
    UI.toast("Buried treasure! You found the Heart of the Sea.", "good"); G.adv("buried");
  }
  for (let i = box.slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [box.slots[i], box.slots[j]] = [box.slots[j], box.slots[i]]; }
}
// A treasure map marks the nearest buried treasure nobody has dug up (in worlds made before the ocean floor update, only
// in land nobody had visited, since only that land has treasure in it). Returns false if there's none near.
function giveTreasureMap(putS, hit) {
  const w = G.world, v = w.gen.version, dug = new Set(G.story.treasures || []);
  if (!w.gen.treasureNear || v < BIOME_GEN) return false;
  const fresh = s => { if (dug.has(s.x + "," + s.z)) return false; if (v >= OCEAN_GEN) return true; const k = Math.floor(s.x / CHUNK) + "," + Math.floor(s.z / CHUNK); return w.newGen.has(k) || (!w.visited.has(k) && !w.mods.has(k)); };
  const t = w.gen.treasureNear(hit.x, hit.z, fresh);
  if (!t) return false;
  putS({ id: I.TREASURE_MAP, n: 1, tx: t.x, tz: t.z });
  UI.toast("A Treasure Map! Hold it and follow the arrow to the X, then dig.", "good");
  return true;
}
// Milestone 17, Part B: a Conduit in water, framed by prismarine blocks in three rings around it (up to 42), gives
// Conduit Power to swimmers nearby (16 blocks per 7 frame blocks); with the full frame it also zaps monsters within 8.
const CONDUIT_FRAME = new Set([B.PRISMARINE, B.PRISMARINE_BRICKS, B.DARK_PRISMARINE, B.SEA_LANTERN]);
function conduitFrame(x, y, z) {
  const w = G.world; let frame = 0;
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let c = -2; c <= 2; c++)
    if ((a === 0 || b === 0 || c === 0) && Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) === 2 && CONDUIT_FRAME.has(w.id(x + a, y + b, z + c))) frame++;
  return frame;
}
function conduitTick(x, y, z, key) {
  const w = G.world;
  let wet = true;
  for (let a = -1; a <= 1 && wet; a++) for (let b = -1; b <= 1 && wet; b++) for (let c = -1; c <= 1; c++) if ((a || b || c) && !WATERY[w.id(x + a, y + b, z + c)]) { wet = false; break; }
  const frame = wet ? conduitFrame(x, y, z) : 0, on = frame >= 16;
  G.conduits ||= new Map();
  const was = G.conduits.get(key); G.conduits.set(key, on ? frame : 0);
  if (on && (!was || (frame >= 42 && was < 42))) { UI.toast(frame >= 42 ? "The Conduit is fully powered! It will fight monsters that swim near it, too." : `The Conduit wakes up! (${frame} of 42 frame blocks)`, "good"); G.adv("conduit", frame); Sound.mob("conduit", 0); }
  if (!on) return;
  const p = G.player, range = Math.floor(frame / 7) * 16;
  if (Math.random() < 0.6) puff(x + 0.5, y + 0.3, z + 0.5, "spark");
  if (Math.hypot(p.pos.x - x - 0.5, p.pos.y - y, p.pos.z - z - 0.5) <= range && p.inWater) addEffect("conduit", 13);
  if (frame >= 42 && Math.random() < 0.5) for (const e of ents.list) {   // about every 2 seconds
    if (e.gone || e.dead || !e.def.hostile || Math.hypot(e.pos.x - x - 0.5, e.pos.y - y, e.pos.z - z - 0.5) > 8 || !WATERY[w.id(Math.floor(e.pos.x), Math.floor(e.pos.y + 0.3), Math.floor(e.pos.z))]) continue;
    if (ents.damage(e, 4)) { puff(e.pos.x, e.pos.y + 0.5, e.pos.z, "spark"); break; }
  }
}
function fillLoot(box, hit) {
  const r = rng(hashSeed(G.meta.seed) ^ (hit.x * 73856093) ^ (hit.z * 19349663));
  const put = (id, n) => { const i = box.slots.findIndex(s => !s); if (i >= 0 && n > 0) box.slots[i] = newStack(id, n); };
  // Milestone 15: enchanted books (any enchantment, curses too) and enchanted gear, like Java's treasure
  const putS = s => { const i = box.slots.findIndex(q => !q); if (i >= 0) box.slots[i] = s; };
  const book = () => putS({ id: I.ENCH_BOOK, n: 1, ench: EN.randomBookEnch(r) });
  const potion = (keys = PO.POTION_KEYS.filter(k => PO.POTIONS[k].eff || PO.POTIONS[k].instant)) => { const k = keys[Math.floor(r() * keys.length)], m = r(); putS({ id: r() < 0.3 ? I.SPLASH_POTION : I.POTION, n: 1, pot: k, ...(m < 0.2 && PO.canLong(k) ? { mod: "long" } : m > 0.85 && PO.canStrong(k) ? { mod: "strong" } : {}) }); };   // Milestone 16
  const gear = (ids, lo, hi) => { const id = ids[Math.floor(r() * ids.length)], s = newStack(id, 1), e = EN.enchantForLoot(r, id, lo + Math.floor(r() * (hi - lo + 1))); if (e) s.ench = e; putS(s); };
  const seaKind = G.dim === "overworld" ? seaLootOf(metaOf(hit.v)) : 0;   // Milestone 17, Part B: shipwrecks, ruins, buried treasure
  if (seaKind === 6 || seaKind === 7) { structureLoot(seaKind, r, put, putS, book); return; }   // Milestone 23, Part D: outposts and mansions
  if (seaKind) { seaLoot(box, hit, seaKind, r, put, putS, book); return; }
  const city = G.dim === "overworld" && G.story.leviathan?.sites?.city;
  if (city && atSolkara(hit, cityCache(city))) {
    put(I.GOLD_INGOT, 4); put(I.BONE, 6); put(I.LEATHER, 2); put(I.ARROW, 12);
    UI.toast("You found the old market supplies.", "good");
    return;
  }
  const citadel = G.dim === "overworld" && G.story.leviathan?.sites?.citadel;
  if (citadel && atSolkara(hit, citadelCache(citadel))) {
    put(I.GOLDEN_APPLE, 2); put(I.ARROW, 16); put(B.OBSIDIAN, 4);
    UI.toast("You found the Citadel's quartermaster supplies.", "good");
    return;
  }
  const relic = G.dim === "overworld" && relicSiteAt(G.story.leviathan?.sites, hit, relicCache);
  if (relic) {
    if (!G.creative && !G.spectator) {
      const expansion = G.story.leviathan;
      expansion.relics ||= {};
      expansion.relics[relic.key] = true;
    }
    put(relic.item, 1);
    put(I.GOLD_INGOT, 2);
    put(I.BONE, 3);
    UI.toast(`You found the ${relic.name} cache.`, "good");
    return;
  }
  if (G.dim === "end") {   // Hollow tower treasure: the top chest always holds Glider Wings
    if ((metaOf(hit.v) & 3) === 1) put(I.GLIDER, 1);
    if ((metaOf(hit.v) & 3) === 2) { put(I.GLIDER, 1); if (r() < 0.4) put(I.SKY_HORSE_ARMOR, 1); if (r() < 0.5) put(I.NAME_TAG, 1); }   // a Hollow ship's treasure (Milestone 14)
    put(I.IRON_INGOT, 3 + Math.floor(r() * 6)); put(I.GOLD_INGOT, 2 + Math.floor(r() * 5)); put(I.VOID_PEARL, 1 + Math.floor(r() * 3));
    if (r() < 0.5) put(I.SKYSHARD, 1 + Math.floor(r() * 3));
    if (r() < 0.3) put(I.SKY_CHEST, 1);
    if (r() < 0.3) put(I.DUSK_SCRAP, 1);
    if (r() < 0.25) put(I.TOTEM, 1);
    if (r() < 0.3) put(I.WYRM_SCALE, 1);
    if (r() < 0.35) book();
    if (r() < 0.2) potion();
    if (r() < 0.5) gear([I.SKY_SWORD, I.SKY_PICK, I.SKY_SHOVEL, I.SKY_HELMET, I.SKY_CHEST, I.SKY_LEGS, I.SKY_BOOTS, I.IRON_SWORD, I.IRON_PICK], 20, 39);
    for (let i = box.slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [box.slots[i], box.slots[j]] = [box.slots[j], box.slots[i]]; }
    UI.toast("You found a Hollow treasure chest!", "good"); return;
  }
  const A = arena();
  if (A && Math.hypot(hit.x - A.x, hit.z - A.z) < CITADEL.TUNNEL + 4 && Math.abs(hit.z - A.z) < 8) {   // the citadel's supply chest
    put(B.SHINESTONE, 8); put(I.GOLDEN_APPLE, 2); put(I.ARROW, 24); put(I.COOKED_PORK, 8); put(I.TOTEM, 1); put(B.COBBLE, 32);
    UI.toast("Supplies for the fight! Charge the Respawn Anchor beside this chest with Shinestone so you wake up here if you faint.", "good"); return;
  }
  if (G.world.gen.isNether()) {   // fortress and bastion treasure
    put(I.GOLD_INGOT, 2 + Math.floor(r() * 5)); put(I.GOLD_NUGGET, 4 + Math.floor(r() * 10));
    if (r() < 0.6) put(B.OBSIDIAN, 2 + Math.floor(r() * 5));
    if (r() < 0.5) put(I.IRON_INGOT, 2 + Math.floor(r() * 4));
    if (r() < 0.4) put(I.WART, 3 + Math.floor(r() * 5));
    if (r() < 0.3) put(I.GOLD_CHEST, 1);
    if (r() < 0.15) put(I.GOLD_HORSE_ARMOR, 1); else if (r() < 0.08) put(I.SKY_HORSE_ARMOR, 1);   // Milestone 14
    if (r() < 0.25) put(I.SKYSHARD, 1 + Math.floor(r() * 2));
    if (r() < 0.12) put(I.DUSK_SCRAP, 1);
    if (r() < 0.4) put(I.PALE_SHARD, 1 + Math.floor(r() * 2));   // shards for the Pale Lantern (the way into the Forsaken World)
    if (r() < 0.15) put(I.TOTEM, 1);
    if (r() < 0.15) book();
    if (r() < 0.2) potion(["fire_resistance"]);
    if (r() < 0.18) gear([I.GOLD_HELMET, I.GOLD_CHEST, I.GOLD_LEGS, I.GOLD_BOOTS, I.IRON_SWORD], 10, 30);
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
  if (r() < 0.08) put(I.TOTEM, 1);
  if (r() < 0.12) put(I.GOLDEN_APPLE, 1);
  if (r() < 0.025) put(I.ENCHANTED_GOLDEN_APPLE, 1);   // Milestone 22: very rare
  if (r() < 0.15) put(DISC_ITEMS[Math.floor(r() * DISC_ITEMS.length)], 1);   // Milestone 22, Part D: music discs
  // Milestone 14: name tags, leads, and Trotter armor turn up in treasure (like Java dungeon chests)
  if (r() < 0.2) put(I.NAME_TAG, 1);
  if (r() < 0.15) put(I.LEAD, 1);
  { const a = r(); if (a < 0.12) put(I.IRON_HORSE_ARMOR, 1); else if (a < 0.2) put(I.GOLD_HORSE_ARMOR, 1); else if (a < 0.24) put(I.SKY_HORSE_ARMOR, 1); }
  if (r() < 0.25) book();
  if (r() < 0.18) potion();
  if (r() < 0.25) put(I.MELON_SEEDS, 2 + Math.floor(r() * 3));
  if (r() < 0.12) gear([I.IRON_SWORD, I.IRON_PICK, I.IRON_HELMET, I.IRON_BOOTS, I.BOW, I.FISHING_ROD], 5, 20);
  // shuffle so it looks like a real stash
  for (let i = box.slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [box.slots[i], box.slots[j]] = [box.slots[j], box.slots[i]]; }
  UI.toast("You found a treasure chest!", "good");
}

// ---------- dropped items ----------
function spawnDrop(id, n, x, y, z, stack = null, vel = null) {
  if (!id || n <= 0) return;
  if (G.guest) { MP.guestDrop(id, n, x, y, z, stack, vel); return; }
  // a matching stack lying right here soaks it up (so dropper and dispenser machines don't fill the world with separate items)
  if (maxStack(id) > 1) { const m = G.drops.find(d => d.id === id && !d.stack && d.n + n <= maxStack(id) && Math.abs(d.x - x) < 0.8 && Math.abs(d.y - y) < 0.8 && Math.abs(d.z - z) < 0.8); if (m) { m.n += n; return; } }
  if (G.drops.length >= 150) removeDrop(G.drops.shift());
  addDrop({ id, n, stack: stack && itemDef(id).stack === 1 ? { ...stack } : null, x, y, z, vx: vel ? vel.x : (Math.random() - 0.5) * 2, vy: vel ? vel.y : 3, vz: vel ? vel.z : (Math.random() - 0.5) * 2, age: 0, pickDelay: vel ? 1.2 : 0.3 });
}
function addDrop(drop) {
  const mesh = itemMesh(drop.id, 0.25);
  mesh.userData.shared = mesh.userData.shared || mesh.geometry.type !== "PlaneGeometry";
  mesh.position.set(drop.x, drop.y, drop.z); scene.add(mesh);
  G.drops.push({ ...drop, mesh });
}
function removeDrop(d) { scene.remove(d.mesh); disposeItemMesh(d.mesh); }
G.dropItem = (id, n, stack) => { const p = G.player; spawnDrop(id, n, p.pos.x, p.pos.y + 1.2, p.pos.z, stack); };
function dropSelected(all) {
  const s = G.inv.slots[G.selected];
  if (!s) return;
  if (isQuestItem(s.id)) { UI.toast(`You can't drop the ${itemDef(s.id).name}. It's too important!`, "bad"); return; }
  const n = all ? s.n : 1, dir = lookDir(), p = G.player;
  spawnDrop(s.id, n, p.pos.x + dir.x * 0.4, p.pos.y + p.eye - 0.3, p.pos.z + dir.z * 0.4, s, { x: dir.x * 5, y: dir.y * 5 + 2, z: dir.z * 5 });
  s.n -= n; if (s.n <= 0) G.inv.slots[G.selected] = null;
  G.hudDirty = true;
}
function updateDrops(dt, bright) {
  const p = G.player, w = G.world;
  for (let i = G.drops.length - 1; i >= 0; i--) {
    const d = G.drops[i];
    if (!w.isLoaded(d.x, d.z)) continue;
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
    lightItem(d.mesh, bright);
    const dx = d.x - p.pos.x, dy = d.y - (p.pos.y + 0.8), dz = d.z - p.pos.z, dist2 = dx * dx + dy * dy + dz * dz;
    // nearby items drift toward the player
    if (d.pickDelay <= 0 && dist2 < 9 && G.state !== "dead" && !G.spectator) { const k = 6 * dt / Math.sqrt(dist2 + 0.01); d.x -= dx * k; d.z -= dz * k; d.y -= dy * k * 0.5; }
    if (d.pickDelay <= 0 && dist2 < 1.7 && G.state !== "dead" && !G.spectator) {
      const left = G.inv.add(d.id, d.n, d.stack);
      if (left < d.n) { Sound.pickup(); G.hudDirty = true; if (UI.panelOpen) UI.refreshPanel(); }
      d.n = left;
    }
    if (d.n <= 0 || d.age > 300 || d.y < -10) { removeDrop(d); G.drops.splice(i, 1); }
  }
}

// ---------- crafting & furnaces ----------
// Milestone 16: how many of an ingredient count for a recipe (a tipped-arrow recipe needs a lingering potion of its own kind)
const tipMatch = (recipe, s) => !recipe.tip || s.id !== I.LINGERING_POTION || s.pot === recipe.tip;
G.countFor = (recipe, id) => { if (!recipe.tip || id !== I.LINGERING_POTION) return G.inv.count(id); let n = 0; for (let i = 0; i < 36; i++) { const s = G.inv.slots[i]; if (s && s.id === id && tipMatch(recipe, s)) n += s.n; } return n; };
function removeFor(recipe, id, n) {
  if (!recipe.tip || id !== I.LINGERING_POTION) return G.inv.remove(id, n);
  for (let i = 35; i >= 0 && n > 0; i--) { const s = G.inv.slots[i]; if (s && s.id === id && tipMatch(recipe, s)) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) G.inv.slots[i] = null; } }
  return true;
}
G.craft = (recipe, many) => {
  if (recipe.ultra && !G.meta.ultra) return;
  if (recipe.cutter && G.panelKind !== "cutter") { UI.toast("Use a Stonecutter for that.", "bad"); Sound.error(); return; }   // Milestone 23
  if (recipe.table && G.panelKind !== "table") { UI.toast("Stand at a Workbench to make that.", "bad"); Sound.error(); return; }
  let made = 0;
  const times = many ? 64 : 1;
  for (let t = 0; t < times; t++) {
    if (!recipe.ins.every(([id, n]) => G.countFor(recipe, id) >= n)) break;
    if (made && G.inv.count(recipe.out[0]) + recipe.out[1] > 640) break;
    for (const [id, n] of recipe.ins) removeFor(recipe, id, n);
    const left = G.inv.add(recipe.out[0], recipe.out[1]);
    if (left) G.dropItem(recipe.out[0], left);
    for (const [rid, rn] of recipe.returns || []) { const l2 = G.inv.add(rid, rn); if (l2) G.dropItem(rid, l2); }   // Milestone 22: a cake gives the milk buckets back
    made++;
  }
  if (!made) { Sound.error(); UI.toast("You don't have enough materials for that.", "bad"); return; }
  Sound.craft(); G.adv("craft", recipe.out[0]);
  UI.toast(`Made ${itemDef(recipe.out[0]).name}${recipe.out[1] * made > 1 ? " ×" + recipe.out[1] * made : ""}!`, "good");
  if (TAGS.planks.includes(recipe.out[0])) tipDone("craft");
  G.hudDirty = true; UI.refreshPanel();
};
G.inventoryChanged = () => { G.hudDirty = true; heldId = -1; };
G.onTakeSmelted = () => {};
// Milestone 16: Brewing Stands. Slots 0-2 bottles, 3 the ingredient, 4 Flare Powder (one powder = 20 brews). A brew takes 20 s.
function updateBrewing(dt) {
  for (const [key, c] of G.world.containers) {
    if (c.type !== "brew") continue;
    const ing = c.slots[3], can = !!ing && [0, 1, 2].some(i => PO.brew(c.slots[i], ing.id));
    if (!can) { c.prog = 0; continue; }
    if (c.fuel <= 0) {
      const f = c.slots[4];
      if (!f || f.id !== I.FLARE_POWDER) { c.prog = 0; continue; }
      c.fuel = PO.FUEL_BREWS; f.n--; if (!f.n) c.slots[4] = null;
    }
    const before = c.prog;
    c.prog += dt;
    if (c.prog >= PO.BREW_TIME) {
      c.prog = 0; c.fuel--;
      for (let i = 0; i < 3; i++) { const out = PO.brew(c.slots[i], ing.id); if (out) c.slots[i] = out; }
      ing.n--; if (!ing.n) c.slots[3] = null;
      const [x, y, z] = key.split(",").map(Number);
      if (Math.hypot(x - G.player.pos.x, z - G.player.pos.z) < 16) { Sound.brewDone(); puff(x + 0.5, y + 1, z + 0.5, "poof"); }
      G.adv("brew");
      if (G.panelKind === "brew" && G.panelCtx === key) UI.refreshPanel();
    }
    if (G.panelKind === "brew" && G.panelCtx === key && Math.floor(before * 2) !== Math.floor(c.prog * 2)) { const bar = document.getElementById("brewProg"); if (bar) bar.style.width = Math.round(c.prog / PO.BREW_TIME * 100) + "%"; }
  }
}
// Milestone 23: what a Smoker or Blast Furnace will cook
function cookable(cook, id) { return cook === "food" ? itemDef(id)?.kind === "food" || id === I.POTATO || id === B.KELP : /ore|scrap/i.test(itemDef(id)?.name || "") || id === I.RAW_IRON || id === I.RAW_GOLD; }
G.cookable = cookable;
function updateFurnaces(dt) {
  for (const [key, f] of G.world.containers) {
    if (f.type !== "furnace") continue;
    const [inp, fuel, out] = f.slots;
    const [fx, fy, fz] = key.split(",").map(Number), blockId = G.world.id(fx, fy, fz);
    const cook = BLOCKS[blockId]?.cook, camp = blockId === B.CAMPFIRE;   // Milestone 23: smoker (food only) and blast furnace (ores only), twice as fast
    const result = inp && (!cook || cookable(cook, inp.id)) ? SMELT[inp.id] : undefined, smeltTime = cook ? SMELT_TIME / 2 : SMELT_TIME;
    const canCook = result !== undefined && (!out || (out.id === result && out.n < maxStack(result)));
    const wasLit = f.burn > 0;
    if (f.burn > 0) f.burn -= dt;
    if (f.burn <= 0 && (canCook || camp) && fuel) {
      f.burn = f.burnMax = FUEL[fuel.id]; fuel.n--; if (!fuel.n) f.slots[1] = null;
    }
    if (f.burn > 0 && canCook) {
      f.prog += dt;
      if (f.prog >= smeltTime) {
        f.prog = 0; inp.n--; if (!inp.n) f.slots[0] = null;
        if (out) out.n++; else f.slots[2] = newStack(result, 1);
      }
    } else f.prog = Math.max(0, f.prog - dt * 2);
    if (f.burn < 0) f.burn = 0;
    const lit = f.burn > 0;
    if (lit !== wasLit) {   // show the glow on the block
      const [x, y, z] = key.split(",").map(Number), v = G.world.get(x, y, z);
      if ((idOf(v) === B.FURNACE || BLOCKS[idOf(v)]?.cook) && G.world.isLoaded(x, z)) G.world.set(x, y, z, make(idOf(v), lit ? metaOf(v) | LIT : metaOf(v) & ~LIT));
    }
  }
}

// ---------- survival ----------
// armor points worn (each point blocks 4% of damage)
function armorPoints() { let a = 0; for (let i = 36; i < 40; i++) { const s = G.inv.slots[i]; if (s && itemDef(s.id).armor) a += itemDef(s.id).armor.points; } return a; }
function leviathanSetPieces(set) {
  let count = 0;
  for (let i = 36; i < 40; i++) {
    const s = G.inv.slots[i], d = s && itemDef(s.id);
    if (d?.leviathanSet === set && d.armor.slot === i - 36) count++;
  }
  return count;
}
function useLeviathanArmor() {
  const set = ["sand", "obsidian", "ancient"].find(set => leviathanSetPieces(set) === 4);
  if (!set || G.spectator) return false;
  const expansion = G.story.leviathan ||= {}, now = worldSeconds();
  const cooldown = set === "sand" ? 20 : set === "obsidian" ? 30 : 45;
  const cost = set === "ancient" ? 6 : 3;
  if (now < (expansion.armorReadyAt || 0)) {
    UI.toast("Your armor is gathering strength.");
    return true;
  }
  if (!G.creative && [36, 37, 38, 39].some(i => {
    const s = G.inv.slots[i];
    return (s.dur ?? itemDef(s.id).armor.dur) < cost;
  })) {
    UI.toast("Repair or replace the worn armor before using its ability.", "bad");
    return true;
  }
  expansion.armorReadyAt = now + cooldown;
  const p = G.player, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z };
  const color = set === "sand" ? PUFF_COLORS.crumb : set === "obsidian" ? PUFF_COLORS.ember : PUFF_COLORS.pale;
  if (set !== "sand") addEffect("resist", 5, set === "ancient" ? 3 : 2);
  if (set !== "sand") expansion.armorShield = { set, until: now + 5 };
  if (set !== "obsidian") {
    for (const contact of ents.areaNear(p.pos.x, p.pos.y, p.pos.z, 5, e => e.def.hostile && !e.tame && !e.npc)) {
      const e = contact.ent;
      if (!lineOfSight(G.world, eye, contact.point)) continue;
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z, length = Math.hypot(dx, dz) || 1;
      ents.damage(e, set === "ancient" ? 7 : 5, "player", { x: dx / length, z: dz / length });
    }
  }
  for (let i = 0; set === "sand" && i < 18 && parts.length < PMAX - 12; i++) {
    const a = i * Math.PI / 9, moving = !G.settings.reducedMotion;
    emitParticle(p.pos.x + Math.cos(a) * 1.2, p.pos.y + 0.8, p.pos.z + Math.sin(a) * 1.2,
      moving ? Math.cos(a) * 3 : 0, 0.25, moving ? Math.sin(a) * 3 : 0, 0.6, color, true);
  }
  if (!G.creative) for (let i = 36; i < 40; i++) {
    const s = G.inv.slots[i];
    s.dur = (s.dur ?? itemDef(s.id).armor.dur) - cost;
    if (s.dur <= 0) { G.inv.slots[i] = null; UI.toast(`Your ${itemDef(s.id).name} broke!`, "bad"); }
  }
  Sound.tone(set === "sand" ? 180 : set === "obsidian" ? 110 : 440, 0.4, "triangle", 0.15);
  UI.toast(set === "sand" ? "Sand Shockwave" : set === "obsidian" ? "Molten Shield — 5 seconds" : "Ancient Shield and Energy Burst — 5 seconds", "good");
  G.hudDirty = true;
  saveNow(false);
  return true;
}
let armorShieldFX = null;
function clearArmorShieldView() {
  if (!armorShieldFX) return;
  armorShieldFX.view.dispose(); armorShieldFX = null;
}
function armorReview() {
  const state = G.world && G.meta ? armorShieldState(G.story.leviathan, G.effects, worldSeconds(), G.creative) : null;
  return { shown: !!armorShieldFX, set: state?.set || null, remaining: state?.remaining || 0,
    resistance: G.effects.resist || 0, level: G.elv.resist || 0, thirdPerson: !!G.thirdPerson };
}
function updateArmorShieldView() {
  const expansion = G.story.leviathan, state = armorShieldState(expansion, G.effects, worldSeconds(), G.creative);
  if (!state || G.spectator || G.state === "dead") {
    clearArmorShieldView();
    if (expansion?.armorShield && !state) delete expansion.armorShield;
    return;
  }
  const fast = G.settings.quality === "fast";
  if (!armorShieldFX || armorShieldFX.set !== state.set || armorShieldFX.fast !== fast) {
    clearArmorShieldView(); armorShieldFX = { set: state.set, fast, view: createArmorShieldView(scene, state.set, fast) };
  }
  const p = G.player;
  armorShieldFX.view.update({ position: { x: p.pos.x, y: p.pos.y + (p.mount ? p.mount.h - 0.75 : p.boat ? 0.1 : 0) - (G.riding?.burrowDepth || 0), z: p.pos.z },
    elapsed: state.elapsed, remaining: state.remaining, yaw: p.yaw, thirdPerson: !!G.thirdPerson, reducedMotion: G.settings.reducedMotion });
}
const ancientSpikes = [];
let mountedLeviathanAttack = null, mountedBurrow = null;
function clearMountedBurrow(recover = true) {
  if (!mountedBurrow) return;
  const { session, view } = mountedBurrow;
  mountedBurrow = null;
  const unsafe = recover && !session.savePosition;
  session.stop(); view.dispose();
  if (unsafe && G.riding === session.owner) {
    // No checked surface anchor survived: detach before using the ordinary
    // safe-placement fallback. Never save or resume inside terrain.
    const owner = session.owner, p = G.player;
    owner.ridden = false; owner.gone = true; G.riding = null; p.mount = false;
    const landing = findLeviathanRecovery(G.world, p, [p.pos, p.spawn]);
    if (landing) { Object.assign(p.pos, landing); p.vel.x = p.vel.y = p.vel.z = 0; }
    else placeSafely(p, p.spawn.x, p.spawn.z);
    p.onGround = false; p.airTop = null; p.inWater = p.headInWater = p.inLava = false;
    UI.toast("The burrow route became unsafe. You returned to safe ground.");
  }
}
function useMountedBurrow() {
  if (mountedBurrow || mountedLeviathanAttack || G.state !== "play" || G.cutscene) return;
  const result = beginMountedBurrow({ world: G.world, gen: G.gen, mount: G.riding, riding: G.riding, player: G.player,
    record: leviathanMountRecord(G.riding), now: worldSeconds(), yaw: G.player.yaw, dim: G.dim, spectator: G.spectator, entities: ents.list });
  if (result.status !== "ready") {
    UI.toast(result.status === "cooldown" ? `Burrow is ready in ${result.remaining}s.` : "Burrowing needs a wide, flat stretch of untouched desert sand with a clear route ahead.");
    return;
  }
  const session = result.session;
  mountedBurrow = { session, view: createBurrowView(scene, session.owner, G.settings.quality === "fast") };
  G.mining = null; G.eat = null; G.blocking = false; G.bowT = -1; mouseL = mouseR = false;
  G.player.vel.x = G.player.vel.y = G.player.vel.z = 0;
  Sound.mob("rumble", 0); UI.toast("Diving beneath the sand. B or C cancels; the camera follows above the dunes.");
  if (!session.owner.practiceMount) saveNow(false);
}
function updateMountedBurrow(dt) {
  if (!mountedBurrow) return;
  if (G.spectator) { clearMountedBurrow(); return; }
  const { session } = mountedBurrow;
  if (!session.update(dt, { active: G.state === "play" && !G.spectator, dim: G.dim, riding: G.riding, entities: ents.list })) {
    const reason = session.journey.reason;
    clearMountedBurrow();
    if (reason === "route-blocked" || reason === "anchor-blocked") UI.toast("The route changed. Your Leviathan returned to the surface.");
  }
}
function ridingReview() {
  const owner = G.riding, p = G.player;
  return { state: G.state, species: owner?.sp || null, burrowing: !!mountedBurrow,
    attackElapsed: mountedLeviathanAttack?.strike.elapsed ?? null,
    stage: mountedBurrow?.session.visualState.stage || null, depth: owner?.burrowDepth || 0,
    elapsed: mountedBurrow?.session.journey.elapsed || 0,
    player: { ...p.pos }, mount: owner ? { ...owner.pos } : null,
    camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
}
function clearMountedLeviathanAttack() {
  if (!mountedLeviathanAttack) return;
  mountedLeviathanAttack.strike.cancel(); mountedLeviathanAttack.view.dispose(); mountedLeviathanAttack = null;
}
function useMountedLeviathanAttack() {
  if (mountedBurrow || mountedLeviathanAttack || G.state !== "play") return;
  const obsidian = G.riding?.sp === "leviathan_obsidian", name = obsidian ? "Cinder Lance" : "Sandbreaker";
  const begin = obsidian ? beginObsidianMountedAttack : beginDuneMountedAttack;
  const result = begin({ world: G.world, mount: G.riding, riding: G.riding,
    record: leviathanMountRecord(G.riding), now: worldSeconds(), yaw: G.player.yaw, dim: G.dim, spectator: G.spectator });
  if (result.status !== "ready") {
    UI.toast(result.status === "cooldown" ? `${name} is ready in ${result.remaining}s.` : `${name} needs your bonded, saddled Leviathan on solid ground with a clear route ahead.`);
    return;
  }
  mountedLeviathanAttack = { strike: result.strike, view: obsidian ?
    createObsidianMountedEruptions(scene, result.strike, G.settings.reducedMotion) :
    createDuneMountedWave(scene, G.world, result.strike, G.settings.reducedMotion, G.settings.quality === "fast") };
  UI.toast(obsidian ? "Cinder Lance! The marked fissures erupt in sequence." : "Sandbreaker! The marked sand will surge forward.");
  Sound.mob("rumble", 0); G.hudDirty = true;
  if (!result.strike.owner.practiceMount) saveNow(false);
}
function updateMountedLeviathanAttack(dt) {
  if (!mountedLeviathanAttack) return;
  const { strike, view } = mountedLeviathanAttack;
  const practice = !!strike.owner.practiceMount;
  if (!strike.update(dt, { active: G.state === "play" && !G.spectator, dim: G.dim, riding: G.riding,
    entities: ents.list, damage: (e, n, source, knock) => {
      if (practice) ents.ctx.particles(e.pos.x, e.pos.y + e.h * 0.5, e.pos.z, strike.owner.sp === "leviathan_obsidian" ? "ember" : "crumb");
      else ents.damage(e, n, source, knock);
    } })) clearMountedLeviathanAttack();
  else view.update(strike.elapsed, G.settings.reducedMotion);
}
function useBuriedScepter(slot) {
  const expansion = G.story.leviathan ||= {}, now = worldSeconds();
  if (now < (expansion.bladeReadyAt || 0)) { UI.toast("The scepter is gathering strength."); return true; }
  if (!G.creative && (slot.dur ?? itemDef(slot.id).tool.dur) < 5) {
    UI.toast("The scepter is too worn to call the ancient spikes.", "bad");
    return true;
  }
  const p = G.player, w = G.world, direction = lookDir();
  const eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z }, points = [];
  const claimed = new Set();
  for (let distance = 2; distance <= 12; distance += 2) {
    const x = Math.floor(p.pos.x - Math.sin(p.yaw) * distance), z = Math.floor(p.pos.z - Math.cos(p.yaw) * distance);
    if (!w.chunkAt(x, z)) break;
    let found = null;
    for (let y = Math.floor(p.pos.y) + 2; y >= Math.floor(p.pos.y) - 2; y--) {
      if (SOLID[w.id(x, y - 1, z)] && w.id(x, y, z) === B.AIR && w.id(x, y + 1, z) === B.AIR) {
        found = { x: x + 0.5, y, z: z + 0.5 }; break;
      }
    }
    if (!found || !lineOfSight(w, eye, { ...found, y: found.y + 0.7 })) break;
    points.push(found);
  }
  if (!points.length) { UI.toast("Aim along clear ground to call the spikes."); return true; }
  expansion.bladeReadyAt = now + 14;
  if (!G.creative) wearTool(slot, 5);
  ancientSpikes.push(createAncientSpikes(scene, points, point => {
    for (const contact of ents.areaNear(point.x, point.y, point.z, 1.8, e => e.def.hostile && !e.tame && !e.npc)) {
      const e = contact.ent;
      if (claimed.has(e.uid) || !lineOfSight(w, { ...point, y: point.y + 0.8 }, contact.point)) continue;
      claimed.add(e.uid);
      ents.damage(e, 9, "player", { x: direction.x, z: direction.z });
    }
  }, G.settings.reducedMotion));
  Sound.tone(360, 0.45, "triangle", 0.15, 240);
  G.swing = 0.01; G.hudDirty = true;
  return true;
}
function useLeviathanBlade(slot) {
  const fire = slot.id === I.INFERNO_GREATBLADE, cooldown = fire ? 12 : 8, cost = fire ? 4 : 3;
  const expansion = G.story.leviathan ||= {};
  const now = (G.meta.day || 1) * DAY_LENGTH + G.time * DAY_LENGTH;
  if (now < (expansion.bladeReadyAt || 0)) { UI.toast("Your blade is gathering strength."); return true; }
  if (!G.creative && (slot.dur ?? itemDef(slot.id).tool.dur) < cost) {
    UI.toast("The blade is too worn to release a wave.", "bad");
    return true;
  }
  expansion.bladeReadyAt = now + cooldown;
  const p = G.player, dir = lookDir(), eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z };
  for (const contact of ents.areaNear(p.pos.x, p.pos.y, p.pos.z, 7, e => !e.tame && !e.npc && e.def.hostile)) {
    const e = contact.ent, center = contact.point;
    const x = center.x - p.pos.x, z = center.z - p.pos.z, len = Math.hypot(x, z) || 1;
    if ((x * dir.x + z * dir.z) / len < 0.55 || !lineOfSight(G.world, eye, center)) continue;
    ents.damage(e, fire ? 7 : 5, "player", { x: x / len, z: z / len });
  }
  for (let i = 0; i < 15 && parts.length < PMAX - 12; i++) {
    const spread = (i / 14 - 0.5) * 1.3, angle = p.yaw + spread;
    emitParticle(p.pos.x - Math.sin(angle) * 1.5, p.pos.y + 0.7, p.pos.z - Math.cos(angle) * 1.5,
      -Math.sin(angle) * 7, 0.1, -Math.cos(angle) * 7, 0.55, fire ? PUFF_COLORS.ember : PUFF_COLORS.crumb, true);
  }
  if (!G.creative) wearTool(slot, cost);
  Sound.noise(fire ? 260 : 800, 0.35, 0.18);
  G.swing = 0.01; G.hudDirty = true;
  return true;
}
let iframes = 0;
// Is the raised shield facing the thing that hit you? (it covers the front half of a circle around you)
function shieldFaces(src, contact) {
  const origin = contact || src?.pos;
  if (!G.blocking || !origin) return false;
  const p = G.player, dx = origin.x - p.pos.x, dz = origin.z - p.pos.z, l = Math.hypot(dx, dz) || 1, d = lookDir(), dl = Math.hypot(d.x, d.z) || 1;
  return (dx / l) * (d.x / dl) + (dz / l) * (d.z / dl) > 0.1;
}
// Damage kinds: undefined (hits, falls, explosions…), "fire", "poison", "void", "starve", "sand", "ancientEnergy"
// Frost Walker: water around your feet freezes into Frosted Ice (radius 2 + level), which melts again in about 20 seconds
function frostWalk(level) {
  const w = G.world, p = G.player, cx = Math.floor(p.pos.x), cz = Math.floor(p.pos.z), y = Math.floor(p.pos.y + 0.01) - 1, r = 2 + level;
  let froze = false;
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (dx * dx + dz * dz > r * r) continue;
    const x = cx + dx, z = cz + dz, id = w.id(x, y, z);
    if (id === B.WATER && !w.id(x, y + 1, z)) { w.set(x, y, z, B.FROSTED_ICE); w.crops.add(x + "," + y + "," + z); froze = true; }
    else if (id === B.FROSTED_ICE && metaOf(w.get(x, y, z))) w.set(x, y, z, B.FROSTED_ICE);   // ice you're standing near stays fresh
  }
  if (froze) { Sound.frost(); if (w.id(cx, y, cz) === B.FROSTED_ICE) G.adv("frost"); }
}
// Milestone 16: the Cauldron holds 3 bottles of water (meta 0-3). A water bucket fills it; a bucket empties a full one.
function useCauldron(hit) {
  const w = G.world, s = G.inv.slots[G.useSlot], lv = metaOf(hit.v) & 3, set = n => w.set(hit.x, hit.y, hit.z, make(B.CAULDRON, n));
  if (!s) return;
  if (s.id === I.WATER_BUCKET && lv < 3) { set(3); if (!G.creative) swapHeld(I.BUCKET); Sound.splash(); }
  else if (s.id === I.BUCKET && lv === 3) { set(0); swapHeld(I.WATER_BUCKET); Sound.splash(); }
  else if (s.id === I.BOTTLE && lv > 0) { set(lv - 1); swapHeldStack({ id: I.POTION, n: 1, pot: "water" }); Sound.splash(); }
  else if (s.id === I.POTION && s.pot === "water" && lv < 3) { set(lv + 1); if (!G.creative) swapHeld(I.BOTTLE); Sound.splash(); }
  else return;
  G.swing = 0.01; G.hudDirty = true; heldId = -1;
}
// Thorns: each piece of armor with it may hurt the creature that hit you (and wears a little more)
function thornsHit(src) {
  for (let i = 36; i < 40; i++) {
    const s = G.inv.slots[i], t = EN.lvl(s, "thorns");
    if (!t || Math.random() >= 0.15 * t) continue;
    ents.damage(src, 1 + Math.floor(Math.random() * 4), "player");
    s.dur = (s.dur ?? itemDef(s.id).armor.dur) - (G.meta.ultra ? 2.5 : 2);
    if (s.dur <= 0) { G.inv.slots[i] = null; UI.toast(`Your ${itemDef(s.id).name} broke!`, "bad"); }
  }
}
function hurt(n, why, src, bypassArmor, kind, noKnockback, contact) {
  const p = G.player;
  if (G.creative || G.spectator || G.state === "dead" || G.meta?.ultra?.fallen || n <= 0) return;
  const run = G.meta.ultra;
  if (run && run.elapsed < 30 && G.dim === "overworld" && src?.def && !src.tame) return;
  if (run && src?.def.wildlife) n = Math.min(n, src.sp === "grizzly_bear" ? 4 : 3);
  G.resting = null;
  R.vibrate(p.pos.x, p.pos.y + 1, p.pos.z, 8);
  if (G.totemGuard > 0 && kind !== "void") return;
  if (G.respawnGuard > 0 && kind !== "void") return;   // just woke up   // a Lifeward Totem just saved you: a moment of safety
  if (iframes > 0 && !bypassArmor) return;
  if (kind === "fire" && G.effects.fireRes) return;
  if (kind === "fire") {
    const pieces = leviathanSetPieces("obsidian");
    n *= pieces === 4 ? 0.4 : pieces >= 2 ? 0.75 : 1;
  }
  if ((kind === "sand" || src?.sp === "leviathan_dune") && leviathanSetPieces("sand") === 4) n *= 0.75;
  const guardian = leviathanSetPieces("ancient");
  if (guardian >= 2 && G.dim === HOLLOW_SANDS && (kind === "sand" || kind === "ancientEnergy")) n *= 0.75;
  if (guardian === 4 && src?.def?.segmentedLeviathan) n *= 0.8;
  if (src?.def?.echohold) { let h = 0; for (let i = 36; i < 40; i++) if (G.inv.slots[i] && itemDef(G.inv.slots[i].id).hushguard) h++; n *= 1 - 0.08 * h; }   // Hushguard armor
  // a raised shield stops hits from the front (it wears down instead)
  if (!bypassArmor && kind !== "void" && shieldFaces(src, contact)) {
    const sh = G.inv.slots[G.blockHand];
    if (sh && sh.id === I.SHIELD) {
      wearTool(sh, Math.max(1, Math.floor(n)));
      iframes = 0.5; Sound.place("wood"); G.adv("block");
      if (src.def && !noKnockback) { const l = Math.hypot(src.pos.x - p.pos.x, src.pos.z - p.pos.z) || 1; src.vel && (src.vel.x += (src.pos.x - p.pos.x) / l * 4, src.vel.z += (src.pos.z - p.pos.z) / l * 4); }
      return;
    }
  }
  if (!bypassArmor) {
    const a = armorPoints();
    n = n * (1 - Math.min(20, a) * 0.04);
    for (let i = 36; i < 40; i++) { const s = G.inv.slots[i]; if (s && itemDef(s.id).armor && EN.wears(s, true)) { s.dur = (s.dur ?? itemDef(s.id).armor.dur) - (G.meta.ultra ? 1.25 : 1); if (s.dur <= 0) { G.inv.slots[i] = null; UI.toast(`Your ${itemDef(s.id).name} broke!`, "bad"); } } }
    iframes = 0.5;
  }
  { const epf = EN.protectionPoints(G.inv.slots.slice(36, 40), kind); if (epf) n *= 1 - epf / 25; }   // Protection enchantments (each point takes 4% off)
  if (src && src.def && !src.dead && kind !== "projectile" && !G.guest) thornsHit(src);
  n = Math.max(0.5, Math.round(n * 2) / 2);
  if (G.effects.resist && kind !== "void" && kind !== "starve") n = Math.max(0.5, n * (1 - 0.2 * (G.elv.resist || 1)));   // Resistance
  if (G.absorb > 0) { const k = Math.min(G.absorb, n); G.absorb -= k; n -= k; }   // golden hearts go first
  p.exhaust += 0.1;
  if (n > 0 && p.health - n <= 0 && kind !== "void" && useTotem()) n = 0;
  p.health = Math.max(0, p.health - n); p.hurtT = 0.4;
  const burrowInterrupted = !!mountedBurrow && n > 0;
  if (burrowInterrupted) {
    if (mountedBurrow.session.cancelElapsed === null) UI.toast("The hit interrupted your burrow. Returning to the surface.");
    mountedBurrow.session.requestCancel("hurt");
  }
  const hitOrigin = contact || src?.pos;
  if (hitOrigin && !noKnockback) { const dx = p.pos.x - hitOrigin.x, dz = p.pos.z - hitOrigin.z, l = Math.hypot(dx, dz) || 1; p.vel.x += dx / l * 6; p.vel.z += dz / l * 6; p.vel.y = Math.max(p.vel.y, 4); }
  if (src && src.def && src.def.knockUp && !noKnockback) p.vel.y = 9;   // Hogbeasts toss you into the air
  if (burrowInterrupted) p.vel.x = p.vel.y = p.vel.z = 0;   // the checked surface anchor holds the rider during emergence
  if (src && src.def && !src.tame) ents.petFoe = src;   // your Scouts go after whatever hurt you
  Sound.hurt(); UI.flash(); G.hudDirty = true;
  if (p.health <= 0) die(why);
}
// Lifeward Totem: held in either hand, it stops one fatal hit. Main hand is checked first, then the offhand.
// It does not work against the void (falling out of the Hollow) and does nothing in Creative or Spectator.
function useTotem() {
  const at = [G.selected, OFF].find(i => G.inv.slots[i] && G.inv.slots[i].id === I.TOTEM);
  if (at === undefined) return false;
  const s = G.inv.slots[at];
  s.n--; if (!s.n) G.inv.slots[at] = null;   // exactly one is used up
  const p = G.player;
  p.health = 1;
  G.effects = {}; G.elv = {}; G.absorb = 0;
  if (G.story.leviathan) delete G.story.leviathan.armorShield;
  clearArmorShieldView();
  addEffect("regen", 45, 2); addEffect("absorb", 5, 2); addEffect("fireRes", 40);
  G.totemGuard = 0.5;   // any other damage arriving in the same moment can't use a second totem
  iframes = Math.max(iframes, 0.5);
  for (let i = 0; i < 4; i++) { puff(p.pos.x, p.pos.y + 1 + i * 0.3, p.pos.z, "totem"); puff(p.pos.x, p.pos.y + 1.2, p.pos.z, "totemGreen"); }
  Sound.totem(); UI.totem(); heldId = -1; offId = -1; G.hudDirty = true;
  UI.toast("Your Lifeward Totem saved you!", "good");
  G.adv("totem");
  return true;
}
function retireWildLeviathans() {
  const ownedByWild = e => e?.def?.segmentedLeviathan && !e.tame;
  for (const e of ents.list) {
    if (e.duneCycle?.preview) { retireLeviathanPreview(e); continue; }
    if (!ownedByWild(e) && !ownedByWild(e.encounterOwner)) continue;
    e.gone = true;
    if (e.mesh) e.mesh.visible = false;
  }
  // The ordinary entity tick disposes these resources, even when retirement
  // happens inside a damage callback that is iterating the effect lists.
  for (const pr of ents.projectiles) {
    if (!ownedByWild(pr.owner) && !ownedByWild(pr.owner?.encounterOwner)) continue;
    pr.gone = true;
    pr.mesh.visible = false;
  }
  for (const h of ents.hazards || []) {
    if (!ownedByWild(h.owner) && !ownedByWild(h.owner?.encounterOwner)) continue;
    h.gone = true;
    h.ring.visible = h.fill.visible = false;
  }
  duneInterest = 0;
  clearHollowDrift();
  Sound.ancientMusic(null);
  clearAncientFury();
  clearAncientArrival();
  clearAncientWarning();
  clearObsidianWarning();
  clearObsidianVentWarning();
  clearDuneWarning();
  clearDuneSweep();
  clearDuneDevour();
  clearDuneVortex();
  clearArenaFractures();
  leviathanWarningHUD.clear();
}
function die(why) {
  raids.clear();
  GC.onFaint();
  G.deathSpot = { ...G.player.pos };   // (where you fell: the Endwatch dungeons wake you by their watchfire; Hardcore floats you here)
  retireWildLeviathans();
  clearSandsHeat();
  clearQuicksand();
  clearCrystalResonance();
  clearArmorShieldView();
  if (G.story.leviathan) delete G.story.leviathan.armorShield;
  clearMountedBurrow(false);
  clearMountedLeviathanAttack();
  dismount(true);
  cinderOnFaint();
  G.eat = null; G.blocking = false; G.bowT = -1;
  const p = G.player;
  F.onFaint(); L.onFaint(); CP.onFaint();
  if ((!G.wset.keepInv || G.meta.hardcore) && !G.creative) {   // drop everything where you fell (story items always stay with you)
    const dropped = [];
    for (let i = 0; i < G.inv.slots.length; i++) { const s = G.inv.slots[i]; if (s && !isQuestItem(s.id)) { if (!EN.lvl(s, "vanishing_curse")) dropped.push(s); G.inv.slots[i] = null; } }   // Curse of Vanishing: gone for good
    if (G.meta.hardcore || !F.satchel(dropped, p.pos)) for (const s of dropped) spawnDrop(s.id, s.n, p.pos.x, p.pos.y + 1, p.pos.z, s);
    if (G.xp) { spawnOrbs(Math.min(100, Math.floor(G.xp / 2)), p.pos.x, p.pos.y + 1, p.pos.z); G.xp = 0; }
  }
  G.effects = {}; G.elv = {}; G.absorb = 0;
  G.state = "dead"; keys.clear(); mouseL = mouseR = false;
  document.getElementById("deathWhy").textContent = why;
  if (G.meta.ultra) document.getElementById("ultraCue").hidden = true;
  if (document.pointerLockElement) document.exitPointerLock();
  if (G.meta.hardcore) {   // Hardcore: the adventure is over for good. You can still look around as a Spectator.
    G.meta.hardcoreOver = true; G.deathSpot = { ...p.pos };
  }
  if (G.meta.ultra) failChallenge(G.meta.ultra, why);
  saveNow(false);
  UI.death(!!G.meta.hardcore);
}
G.respawn = async () => {
  if (G.meta?.ultra) return;
  const p = G.player;
  if (G.meta.hardcore) {   // Spectator: float through the world where you fell; no items, no damage, nothing to break
    G.mode = G.meta.mode = "spectator";
    p.health = 20; p.hunger = 20; p.sat = 5; p.air = 10; p.flying = true; p.noclip = true;
    if (G.deathSpot) { Object.assign(p.pos, G.deathSpot); p.pos.y += 1; }
    p.vel.x = p.vel.y = p.vel.z = 0;
    await saveNow(false);
    G.state = "pause"; UI.hud(); G.resume(); updateTips();
    UI.toast("Spectator: fly with Space and C. You can look around, but this Hardcore world's adventure is over.");
    return;
  }
  p.health = maxHealth(); p.hunger = 20; p.sat = 5; p.air = 10; p.exhaust = 0; p.flying = false;
  G.respawnGuard = 3;   // a few seconds where nothing can hurt you right after waking up
  if (G.dim === "forsaken") {   // in the Forsaken World you wake at your last restored shrine (or the refuge)
    const s = F.respawnSpot();
    placeSafely(p, s.x, s.z); G.respawnGuard = 6; F.onRespawn();
    UI.toast(`You woke up at ${s.name}. He won't come near for a little while.`, "");
    G.state = "pause"; G.resume(); return;
  }
  const cs = G.dim === "overworld" && CD.respawnSpot();
  if (cs) {   // fell in an Endwatch dungeon: wake by the last watchfire you lit
    Object.assign(p.pos, cs); p.vel.x = p.vel.y = p.vel.z = 0; G.respawnGuard = 5;
    UI.toast("You wake beside the watchfire.", "");
    G.state = "pause"; G.resume(); return;
  }
  const ls = L.respawnSpot();
  if (ls) {   // in the Deep or the Expanse you wake at the last Keeper Beacon you lit (or where you came in)
    Object.assign(p.pos, { x: ls.x, y: ls.y, z: ls.z }); p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; G.respawnGuard = 6;
    UI.toast(`You woke up at ${ls.name}.`, ""); G.state = "pause"; G.resume(); return;
  }
  if (G.guest && G.dim !== "overworld") { const h = MP.hostSpot(); placeSafely(p, h.x, h.z); G.state = "pause"; G.resume(); UI.toast("You woke up near the host."); return; }   // Play Together: stay with the group
  if (p.anchor && await respawnAtAnchor(p)) { G.state = "pause"; G.resume(); return; }
  const home = isLostWorldRegion(p.spawn.dim) ? p.spawn.dim : worldHome(G.meta);
  if (G.dim !== home || (G.meta.lostWorldGen && !G.world.isLoaded(p.spawn.x, p.spawn.z))) {
    G.state = "loading"; UI.show("loading");
    G.dimData[G.dim] = dimSnapshot(G.world);
    clearWorldMeshes(); G.world.chunks.clear();
    G.dim = home; G.world = makeWorld(home); G.gen = G.world.gen;
    p.pos.x = p.spawn.x; p.pos.z = p.spawn.z; p.pos.y = p.spawn.y || 60;
    await loadArea(p.spawn.x, p.spawn.z, "Waking up in " + DIM_NAMES[home] + "…");
  }
  if (isLostWorldRegion(home) && p.spawn.bed && G.world.id(...p.spawn.bed) !== B.BED) {
    const { x, z } = G.gen.findSpawn();
    p.spawn = { x, y: null, z, dim: home };
    if (!G.world.isLoaded(x, z)) await loadArea(x, z, "Returning to " + DIM_NAMES[home] + "…");
    UI.toast("Your bed was missing, so you woke up at the region’s arrival point.", "bad");
  }
  if (home === AMBER_CAVERNS) p.pos.y = p.spawn.y ?? AMBER_ARRIVAL.y;
  placeSafely(p, p.spawn.x, p.spawn.z);
  if (isLostWorldRegion(home) && p.spawn.y == null) p.spawn.y = p.pos.y;
  if (p.spawn.bed && G.world.id(...p.spawn.bed) !== B.BED) { UI.toast("Your bed was missing, so you woke up at the world's starting spot.", "bad"); delete p.spawn.bed; }
  G.state = "pause"; G.resume();
};
// Wake up next to a charged Respawn Anchor in the Ember Depths. Returns false (with a reason) if that isn't possible.
async function respawnAtAnchor(p) {
  const a = p.anchor;
  if (G.dim !== "nether") {
    G.state = "loading"; UI.show("loading");
    G.dimData[G.dim] = dimSnapshot(G.world);
    clearWorldMeshes(); G.world.chunks.clear();
    G.dim = "nether"; G.world = makeWorld("nether"); G.gen = G.world.gen;
  }
  p.pos.x = a.x + 0.5; p.pos.z = a.z + 0.5; p.pos.y = a.y;
  await loadArea(a.x, a.z, "Waking up at your Respawn Anchor…");
  const v = G.world.get(a.x, a.y, a.z), charge = idOf(v) === B.RESPAWN_ANCHOR ? metaOf(v) & 7 : -1, spot = charge > 0 ? anchorSpot(a) : null;
  if (!spot) {
    UI.toast(charge < 0 ? "Your Respawn Anchor was missing, so you woke up on the Surface." : charge === 0 ? "Your Respawn Anchor was out of charge, so you woke up on the Surface. Recharge it with Shinestone." : "Your Respawn Anchor was blocked in, so you woke up on the Surface. Leave open space next to it.", "bad");
    if (charge < 0) p.anchor = null;
    return false;
  }
  G.world.set(a.x, a.y, a.z, make(B.RESPAWN_ANCHOR, charge - 1));
  Object.assign(p.pos, spot); p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null;
  portalCooldown = true;
  UI.toast(`You woke up at your Respawn Anchor (${charge - 1} charge${charge - 1 === 1 ? "" : "s"} left).`, charge - 1 ? "good" : "bad");
  return true;
}
// Food follows Minecraft Java Edition 1.20.1: actions add "exhaustion"; every 4 points of it uses up 1 fullness (saturation),
// or 1 food point once fullness is gone. A full food bar with fullness heals quickly; 18+ food heals slowly.
let healT = 0, starveT = 0, drownT = 0;
function syncChallengeClock() {
  const run = G.meta.ultra;
  G.time = (run.elapsed % UHC_DAY) / UHC_DAY;
  G.meta.day = challengeDay(run);
}
function tickChallenge(dt) {
  if (G.dim !== "overworld") return;
  const run = G.meta.ultra;
  const events = advanceChallenge(run, dt);
  syncChallengeClock();
  for (const event of events) {
    if (event === "dusk" || event === "moon") {
      challengeCue(event, run, G);
      Sound.ultraCue(event);
      G.challengeCueUntil = G.clock + 8;
      continue;
    }
    if (event === "victory") {
      G.state = "pause"; Sound.pause();
      UI.show("pause");
      if (document.pointerLockElement) document.exitPointerLock();
      document.getElementById("ultraCue").hidden = true;
      saveNow(false).then(ok => {
        if (!ok || G.meta?.ultra !== run) return;
        challengeCue(event, run, G);
        UI.show("ultraVictory");
        Sound.start(); Sound.ultraCue("victory");
      });
      continue;
    }
    if (event === "day1") { G.challengeDread = run.elapsed + 8; Sound.ultraCue("hunt"); }
    saveNow(false).then(ok => {
      if (!ok || G.meta?.ultra !== run || run.fallen) return;
      challengeCue(event, run, G);
      G.challengeCueUntil = G.clock + 10;
      Sound.ultraCue("reward");
    });
  }
  if (bloodMoon(run) && run.elapsed > G.challengeMusicAt) {
    G.challengeMusicAt = run.elapsed + 13;
    Sound.ultraCue("ambience");
  }
}
function challengeNoise(radius, site = G.player.pos) {
  const run = G.meta.ultra;
  if (run.status !== "active" || (hunterLevel(run) < 1 && radius < 26)) return;
  if (G.challengeNoise?.until > run.elapsed + 6 && G.challengeNoise.radius >= radius) return;
  G.challengeNoise = { x: site.x, y: site.y, z: site.z, radius, until: run.elapsed + 10 };
}
function breachDefense(e, x, y, z) {
  const run = G.meta.ultra, w = G.world;
  const id = w.id(x, y, z), def = BLOCKS[id];
  if (run.elapsed < G.challengeBreachAt) return;
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  const edits = w.mods.get(chunkKey(cx, cz));
  if (!edits?.has(idx(x - cx * CHUNK, y, z - cz * CHUNK))) return;
  if (!def || def.tool !== "axe" || (!isDoor(id) && !def.fence && !def.gate) ||
      (!def.fence && (metaOf(w.get(x, y, z)) & OPEN))) return;
  const key = x + "," + y + "," + z;
  const tally = G.challengeDefenses;
  if (tally.size > 40) for (const [k, hit] of tally) if (run.elapsed - hit.at >= 8) tally.delete(k);
  if (tally.size > 48 && !tally.has(key)) return;
  const prior = tally.get(key);
  if (prior && run.elapsed - prior.at < 1) return;
  const count = prior?.id === id && run.elapsed - prior.at < 8 ? prior.count + 1 : 1;
  if (count >= 5) {
    G.challengeBreachAt = run.elapsed + 10;
    tally.clear();
    breakBlock(x, y, z, true);
    return;
  }
  tally.set(key, { id, count, at: run.elapsed });
  if (count === 1) UI.toast("A Groaner is battering a wooden defense.", "bad");
  Sound.mob("clank", 3);
}
function ultraSurvival(dt, p) {
  const run = G.meta.ultra, pos = p.pos;
  const previous = run.fatigue;
  const pace = Math.hypot(p.vel.x, p.vel.z);
  const sprinting = pace > 4 && (keys.has("ShiftLeft") || keys.has("ShiftRight"));
  const miningNow = G.mining && mouseL;
  const rest = G.resting;
  if (rest) {
    rest.left -= dt;
    if (rest.left <= 0 || Math.hypot(pos.x - rest.x, pos.y - rest.y, pos.z - rest.z) > 1.3 ||
      ents.near(pos.x, pos.y, pos.z, 8, e => !e.dead && (e.def.hostile || (e.def.wildlife && e.angry > 0))).length) {
      G.resting = null;
      UI.toast(rest.left <= 0 ? "You're rested." : "Rest interrupted.");
    }
  }
  run.fatigue = Math.min(100, Math.max(0, previous + dt *
    (G.resting ? -4 : miningNow ? 0.52 : sprinting ? 0.66 : pace > 1 ? 0.1 : -0.18)));
  p.speedMul *= 1 - Math.max(0, run.fatigue - 50) * 0.006;
  p.exhaust += dt * (0.073 + (sprinting ? 0.055 : 0) + (run.fatigue > 75 ? 0.025 : 0));
  if (sprinting) challengeNoise(18);
  if (G.dim !== "overworld" || run.status !== "active" || (G.challengeCheck -= dt) > 0) return;
  G.challengeCheck = 1;
  updateChallengeHazards(run, p);
}
function updateChallengeHazards(run, p) {
  const pos = p.pos, x = Math.floor(pos.x), y = Math.floor(pos.y), z = Math.floor(pos.z);
  const w = G.world, col = skyCols.at(x, z);
  const exposed = y >= col.top;
  let warm = false;
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    for (let dy = -1; dy <= 1; dy++) if (idOf(w.get(x + dx, y + dy, z + dz)) === B.CAMPFIRE &&
      (metaOf(w.get(x + dx, y + dy, z + dz)) & LIT)) {
      warm = true;
      if (!G.settings.reducedMotion && Math.random() < .45) puff(x + dx + .5, y + dy + .85, z + dz + .5, "ash");
      challengeNoise(26, { x: x + dx + .5, y: y + dy, z: z + dz + .5 });
    }
  }
  const cold = col.kind === 2 && (G.time > .54 || G.wx.rain > .4);
  const heat = ["sandy", "badlands"].includes(col.biome) && G.time > .16 && G.time < .34;
  const danger = exposed && !warm && (cold || G.wx.rain > .65);
  if (exposed && heat) p.exhaust += 0.19;
  run.exposure = danger ? run.exposure + 1 : Math.max(0, run.exposure - 3);
  if (run.exposure === 30) UI.toast("You're getting chilled. Find cover or a campfire.", "bad");
  if (run.exposure >= 65 && run.exposure % 15 === 5) hurt(1, "Cold exposure wore you down.", null, true);
  const underground = w.gen.column(x, z).h - y > 7;
  if (!run.cave && run.elapsed >= run.nextCave && underground && G.mining) {
    run.nextCave = run.elapsed + 105;
    run.cave = { x, y, z, at: run.elapsed + 4 };
    UI.toast("The ceiling is cracking. Move away!", "bad");
    Sound.mob("rumble", 2);
  }
  if (run.cave) {
    const c = run.cave;
    if (!G.settings.reducedMotion) puff(c.x + .5, c.y + 1.85, c.z + .5, "ash");
    if (run.elapsed >= c.at) {
      run.cave = null;
      Sound.mob("rumble", 5);
      if (Math.hypot(pos.x - c.x - .5, pos.y - c.y, pos.z - c.z - .5) < 2.5) {
        hurt(2, "Falling rock struck you.", null, true);
      } else if (w.id(c.x, c.y + 2, c.z) === B.GRAVEL && !w.id(c.x, c.y + 1, c.z)) {
        w.set(c.x, c.y + 2, c.z, B.AIR);
        startFall(c.x, c.y + 2, c.z, B.GRAVEL);
      }
      if (!G.settings.reducedMotion) for (let i = 0; i < 12; i++) puff(c.x + .5, c.y + 1.8, c.z + .5, "ash");
    }
  }
  if (run.elapsed >= run.nextRaid && G.state !== "dead") {
    run.nextRaid = run.elapsed + (raids.challengeStart() ? 420 : 32);
  }
}
function survival(dt) {
  const p = G.player;
  if (G.totemGuard > 0) G.totemGuard -= dt;
  if (G.respawnGuard > 0) G.respawnGuard -= dt;
  if (G.creative || G.spectator) { p.health = 20; p.hunger = 20; p.air = 10; G.effects = {}; G.absorb = 0; p.levitate = false; return; }
  if (iframes > 0) iframes -= dt;
  tickEffects(dt);
  p.levitate = !!G.effects.levitation;
  p.slowFall = !!G.effects.slowFall;   // Milestone 16: Slow Falling
  p.speedMul = (G.effects.swift ? 1 + 0.2 * (G.elv.swift || 1) : 1) * (G.effects.slow ? Math.max(0.1, 1 - 0.15 * (G.elv.slow || 1)) : 1);   // Speed and Slowness
  if (leviathanSetPieces("sand") === 4 && G.world.id(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.1), Math.floor(p.pos.z)) === B.SAND) p.speedMul *= 1.12;
  p.jumpMul = G.effects.jump ? 1 + 0.16 * (G.elv.jump || 1) : 1;
  if (G.blocking) p.speedMul *= 0.3;   // you walk slowly behind a raised shield
  if (G.eat) p.speedMul *= 0.35;       // and while eating
  if (G.mutants && G.dim === "forsaken") p.speedMul *= G.mutants.slow();   // stuck in a Forsaken Skitter's web
  { const fw = EN.lvl(G.inv.slots[39], "frost_walker"); if (fw && p.onGround && !G.guest && !G.spectator && (G.frostT = (G.frostT || 0) - dt) <= 0) { G.frostT = 0.1; frostWalk(fw); } }   // Frost Walker
  p.swimMul = (G.effects.dolphin ? 1.9 : 1) * (1 + 0.35 * EN.lvl(G.inv.slots[39], "depth_strider"));   // Depth Strider
  tickBeacons(dt);
  if (G.inv.slots[36] && G.inv.slots[36].id === I.CINDER_CROWN) { G.effects.fireRes = Math.max(G.effects.fireRes || 0, 1.5); }   // the Cinder Crown keeps fire away
  if (p.gliding && (G.glideT = (G.glideT || 0) + dt) >= 1) { G.glideT = 0; const wings = G.inv.slots[37]; if (wings && wings.id === I.GLIDER) { wings.dur = (wings.dur ?? 432) - (G.meta.ultra ? 1.25 : 1); if (wings.dur <= 0) { G.inv.slots[37] = null; p.gliding = false; UI.toast("Your Glider Wings wore out!", "bad"); } G.hudDirty = true; } }
  if (p.inLava && !G.effects.fireRes) { addEffect("fire", 6); if ((G.lavaT = (G.lavaT || 0) - dt) <= 0) { G.lavaT = 0.5; hurt(4, "Lava is very hot! Watch your step.", null, true, "fire"); } }
  const w = G.world, fx = Math.floor(p.pos.x), fy = Math.floor(p.pos.y), fz = Math.floor(p.pos.z);
  if (w.id(fx, fy, fz) === B.FIRE || w.id(fx, fy + 1, fz) === B.FIRE) addEffect("fire", 4);
  if ((G.cactusT = (G.cactusT || 0) - dt) <= 0) {   // Milestone 20: touching a cactus hurts
    const touch = [[-0.42, 0], [0.42, 0], [0, -0.42], [0, 0.42]].some(([ox, oz]) => [0.2, 1.2].some(oy => w.id(Math.floor(p.pos.x + ox), Math.floor(p.pos.y + oy), Math.floor(p.pos.z + oz)) === B.CACTUS)) || w.id(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.05), Math.floor(p.pos.z)) === B.CACTUS;
    if (touch) { G.cactusT = 0.5; hurt(1, "Ouch! Cactus spines are sharp.", null, false, "cactus"); }
  }
  if (p.onGround && w.id(fx, Math.floor(p.pos.y - 0.1), fz) === B.MAGMA && !p.crouch && !EN.lvl(G.inv.slots[39], "frost_walker") && (G.magmaT = (G.magmaT || 0) + dt) > 1) { G.magmaT = 0; hurt(1, "Magma blocks are hot! Crouch (C) to walk on them safely.", null, true, "fire"); }
  const diff = G.wset.difficulty, hp = maxHealth(), air = maxAir();
  if (G.meta.ultra) ultraSurvival(dt, p);
  if (diff === "peaceful" && (G.peaceT = (G.peaceT || 0) + dt) > 2) { G.peaceT = 0; if (p.health < hp) p.health++; if (p.hunger < 20) p.hunger++; G.hudDirty = true; }
  // exhaustion → fullness → food
  while (p.exhaust >= 4) { p.exhaust -= 4; if (p.sat > 0) p.sat = Math.max(0, p.sat - 1); else if (diff !== "peaceful") p.hunger = Math.max(0, p.hunger - 1); G.hudDirty = true; }
  healT += dt;
  if (!G.meta.ultra && p.health < hp && p.hunger >= 20 && p.sat > 0) {   // fast healing: every half second, using fullness
    if (healT >= 0.5) { healT = 0; p.health = Math.min(hp, p.health + 1); p.exhaust += Math.min(p.sat, 6); G.hudDirty = true; }
  } else if (p.health < hp && p.hunger >= 18) {        // slow healing: every 4 seconds
    if (healT >= (G.meta.ultra ? 25 : 4)) { healT = 0; p.health = Math.min(hp, p.health + 1); p.exhaust += 6; G.hudDirty = true; }
  } else if (healT > 4) healT = 0;
  // starving: Easy stops at 5 hearts, Normal at half a heart, Hard can make you faint
  if (p.hunger <= 0) {
    starveT += dt;
    if (starveT >= 4) { starveT = 0; const floor = diff === "easy" ? 10 : diff === "normal" ? 1 : 0; if (p.health > floor) hurt(1, "You were too hungry. Eat something to keep your food bar up!", null, true, "starve"); }
  } else starveT = 0;
  // breath underwater
  if (p.inWater && Math.random() < 0.12 && bubbleColumn(G.world, p.pos.x, p.pos.y, p.pos.z)) puff(p.pos.x, p.pos.y + 0.2, p.pos.z, "spark");   // bubbles in a bubble column
  if (G.inv.slots[36]?.id === I.TURTLE_HELMET && !p.headInWater && !G.creative && !G.spectator) G.effects.waterBreath = Math.max(G.effects.waterBreath || 0, 10);   // Milestone 17, Part D
  if (p.headInWater && !CP.breathes() && !G.effects.waterBreath && !G.effects.conduit && !G.riding?.def.waterMount) { p.air -= dt / (G.meta.ultra ? 1 : 1 + EN.lvl(G.inv.slots[36], "respiration")); if (p.air < 0) { p.air = 0; drownT += dt; if (drownT > 1) { drownT = 0; hurt(2, "You ran out of air. Swim up for a breath!", null, true); } } G.hudDirty = true; }
  else { drownT = 0; if (p.air < air) { p.air = Math.min(air, p.air + dt * 4); G.hudDirty = true; } }
}

// ---------- first-time tips ----------
const TIPS_S = [
  ["move", "Use <b>W A S D</b> to walk and the <b>mouse</b> to look around. <b>Space</b> jumps."],
  ["chop", "Find a tree. <b>Hold the left mouse button</b> (or the <b>R</b> key) on its trunk to chop a log."],
  ["craft", "Press <b>E</b> and make <b>Oak Planks</b> from your log."],
  ["place", "Pick planks with <b>1–9</b> or the wheel, then <b>right-click</b> (or press <b>F</b>) to place them."],
  ["table", "Make a <b>Workbench</b>, place it, and <b>right-click</b> it (or press <b>F</b>) to make tools. Build a shelter before night!"]
];
const TIPS_C = [
  ["move", "Use <b>W A S D</b> to move. <b>Tap Space twice</b> to fly, then Space to rise and <b>C</b> to go down."],
  ["craft", "Press <b>E</b> to open the block chooser. Click a block, then click a hotbar slot."],
  ["place", "<b>Right-click</b> (or <b>F</b>) to place blocks and <b>left-click</b> (or <b>R</b>) to remove them. Have fun building!"]
];
function updateTips() {
  const list = G.creative ? TIPS_C : TIPS_S, next = list.find(([k]) => !G.tips[k]);
  UI.tip(next ? next[1] : null);
}
function tipDone(k) { if (!G.tips[k]) { G.tips[k] = true; updateTips(); } }

// ---------- Milestone 19: weather (rain, snow, thunderstorms) on the Surface; the sky itself is in js/weather.js ----------
const skyCols = makeSkyColumns(G);
const RAIN_SKY = new THREE.Color().setHex(0x7f8996, THREE.LinearSRGBColorSpace), wxTint = new THREE.Color();
let wxView = null, wxSoundT = 0, wxFireT = 0, thunderT = 12;
G.wx = { rain: 0, thunder: 0, kind: 0 };
function weatherHere() { return G.dim === "overworld" && !!G.meta && !!G.world && G.wset.weather !== false; }
function updateWeather(dt, running) {
  const p = G.player;
  const run = G.meta.ultra;
  const w = weatherHere() ? weatherAt(G.gen.seed, worldSeconds(), DAY_LENGTH, G.meta.wxClear || 0, G.meta.wxSet || null,
    run?.status === "active" ? run.elapsed : null) : { rain: 0, thunder: 0, kind: 0 };
  G.wx = w;
  if (w.rain < 0.01) { if (wxView) wxView.hide(); Sound.rain(0); return; }
  wxView ||= createWeatherView(THREE, scene);
  const max = G.settings.quality === "fast" ? 400 : G.settings.reducedMotion ? 450 : 900;
  const cam = camera.position;
  wxView.update(running ? dt : 0, cam, w.rain, skyCols, max, (x, y, z) => {
    if (parts.length < PMAX - 40 && !G.settings.reducedMotion) emitParticle(x, y + 0.05, z, (Math.random() - 0.5) * 0.8, 1.4, (Math.random() - 0.5) * 0.8, 0.22, PUFF_COLORS.splash);
  });
  if ((wxSoundT -= dt) <= 0) {   // how much rain you can hear: open sky around you, or the roof over your head
    wxSoundT = 0.4;
    let loud = 0, roofed = 0;
    const cx = Math.floor(cam.x), cz = Math.floor(cam.z);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, r = i % 3 * 2.5;
      const c = skyCols.at(cx + Math.round(Math.cos(a) * r), cz + Math.round(Math.sin(a) * r));
      if (c.kind !== 1) continue;
      if (c.top + 1 <= cam.y + 2) loud++;
      else if (c.top + 1 - cam.y < 10) roofed++;
    }
    const here = skyCols.at(cx, cz), inside = here.kind === 1 && here.top + 1 > cam.y + 1;
    Sound.rain(w.rain * Math.min(1, (loud + roofed * 0.6) / 7), inside || loud < roofed);
    if (running && w.rain > 0.5 && here.kind && here.top + 1 <= p.pos.y + 0.1) G.adv(here.kind === 1 ? "inrain" : "insnow");   // Part D achievements
  }
  if (!running) return;
  if (w.thunder > 0.5 && (thunderT -= dt) <= 0) { thunderT = 12 + Math.random() * 20; Sound.thunder(150 + Math.random() * 100); }   // far-off rumbles between bolts
  if (w.rain > 0.4) {
    if (G.effects.fire && skyCols.rainedOn(p.pos.x, p.pos.y + 1, p.pos.z)) { delete G.effects.fire; G.hudDirty = true; }
    if (!G.guest && (wxFireT -= dt) <= 0) {   // rain puts out fires under the open sky (a few at a time)
      wxFireT = 0.5;
      for (const f of fires) if (skyCols.rainedOn(f.x + 0.5, f.y, f.z + 0.5) && Math.random() < 0.3 && G.world.id(f.x, f.y, f.z) === B.FIRE) {
        G.world.set(f.x, f.y, f.z, B.AIR); f.t = 0;
        if (Math.hypot(f.x - p.pos.x, f.z - p.pos.z) < 16) Sound.fizz(Math.hypot(f.x - p.pos.x, f.y - p.pos.y, f.z - p.pos.z));
      }
    }
  }
}
// ---------- Milestone 19, Part B: lightning ----------
// During a thunderstorm the host's game picks a spot every few seconds. Lightning only strikes where rain falls, and a
// Lightning Rod within 32 blocks takes the hit instead. It lights a fire, hurts, and changes a few creatures.
const bolts = [];
let decor = null;   // Milestone 21, Part D
const boltMat = new THREE.MeshBasicMaterial({ color: 0xeef3ff, transparent: true, opacity: 0.95, depthWrite: false, fog: false });
const boltBox = new THREE.BoxGeometry(1, 1, 1);
let boltT = 5, flashT = 0;
const ROD_REACH = 32;
function boltPath(g, x, y, z, top, spread, thick) {   // a zigzag from the clouds down to (x, y, z)
  const sx = x + (Math.random() - 0.5) * spread, sz = z + (Math.random() - 0.5) * spread;
  let px = sx, py = top, pz = sz, wx = 0, wz = 0;
  while (py > y) {
    const ny = Math.max(y, py - 1.5 - Math.random() * 2.5), k = (ny - y) / (top - y), taper = Math.min(1, k * 5);
    wx = Math.max(-2.5, Math.min(2.5, wx + (Math.random() - 0.5) * 2.4)); wz = Math.max(-2.5, Math.min(2.5, wz + (Math.random() - 0.5) * 2.4));
    const nx = x + (sx - x) * k + wx * taper, nz = z + (sz - z) * k + wz * taper;
    const len = Math.hypot(nx - px, ny - py, nz - pz), m = new THREE.Mesh(boltBox, boltMat);
    m.scale.set(thick, thick, len + thick); m.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2); m.lookAt(nx, ny, nz);
    g.add(m);
    if (thick > 0.12 && Math.random() < 0.18 && ny > y + 8) boltPath(g, nx + (Math.random() - 0.5) * 7, ny - 4 - Math.random() * 6, nz + (Math.random() - 0.5) * 7, ny, 0, 0.09);   // a side branch that fizzles out
    px = nx; py = ny; pz = nz;
  }
}
function drawBolt(x, y, z) {
  const g = new THREE.Group();
  boltPath(g, x + 0.5, y, z + 0.5, Math.max(y + 45, 110), 8, 0.22);
  g.renderOrder = 4; scene.add(g);
  bolts.push({ g, age: 0 }); G.boltCount = (G.boltCount || 0) + 1; G.lastBolt = [x, y, z];
  flashT = G.settings.reducedMotion ? 0.12 : 0.32;
  const p = G.player;
  Sound.thunder(Math.hypot(p.pos.x - x - 0.5, p.pos.y - y, p.pos.z - z - 0.5));
}
G.drawBolt = drawBolt;   // Play Together friends draw the host's lightning
function updateBolts(dt) {
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i]; b.age += dt;
    b.g.visible = b.age < 0.12 || (b.age > 0.2 && b.age < 0.34);   // a double flicker
    if (b.age > 0.45) { scene.remove(b.g); bolts.splice(i, 1); }
  }
}
function applyFlash(dt) {   // the whole sky lights up for a moment
  if (flashT <= 0) return;
  flashT -= dt;
  const k = Math.max(0, flashT) / 0.32 * (G.settings.reducedMotion ? 0.35 : 1);
  uniforms.daylight.value += (1 - uniforms.daylight.value) * 0.8 * k;
  if (scene.background?.isColor) scene.background.lerp(wxTint.setRGB(0.85, 0.88, 0.95), 0.5 * k);
}
// the nearest Lightning Rod open to the sky within ROD_REACH blocks (rods are always placed by players, so they're in the change list)
function rodNear(x, z) {
  const w = G.world, cx0 = Math.floor(x / CHUNK), cz0 = Math.floor(z / CHUNK), R = Math.ceil(ROD_REACH / CHUNK);
  let best = null, bd = ROD_REACH;
  for (let cx = cx0 - R; cx <= cx0 + R; cx++) for (let cz = cz0 - R; cz <= cz0 + R; cz++) {
    const m = w.mods.get(cx + "," + cz);
    if (!m) continue;
    for (const [i, v] of m) {
      if (idOf(v) !== B.LIGHTNING_ROD) continue;
      const bx = cx * CHUNK + (i % CHUNK), by = Math.floor(i / (CHUNK * CHUNK)), bz = cz * CHUNK + Math.floor(i / CHUNK) % CHUNK;
      const d = Math.hypot(bx - x, bz - z);
      if (d < bd && w.id(bx, by, bz) === B.LIGHTNING_ROD && skyCols.at(bx, bz).top === by) { bd = d; best = { x: bx, y: by, z: bz }; }
    }
  }
  return best;
}
// What lightning does to a creature it hits
function lightningHit(e) {
  if (e.def.boss || e.def.object || e.def.boat || e.def.cart || e.gone || e.dead) return;
  const swap = sp => {   // it turns into something else
    const n = ents.add(sp, e.pos.x, e.pos.y, e.pos.z, { yaw: e.yaw });
    if (n) { n.yaw = e.yaw; if (e.name) n.name = e.name; n.burning = 0; }
    e.gone = true; puff(e.pos.x, e.pos.y + 1, e.pos.z, "poof");
    if (Math.hypot(e.pos.x - G.player.pos.x, e.pos.z - G.player.pos.z) < 24) UI.toast(`Lightning turned a ${e.def.name} into a ${SPECIES[sp].name}!`);
    G.adv?.("lightningChange", sp);
  };
  if (e.sp === "pig" && SPECIES.rotboar) return swap("rotboar");                               // Minecraft: pig → zombified piglin
  if (e.def.villager && e.sp !== "wanderer" && !e.npc && SPECIES.witch) return swap("witch");   // villager → witch
  if (e.sp === "creeper" && !e.charged) { e.charged = true; G.adv?.("lightningChange", "charged"); }   // a charged Hisser
  ents.damage(e, 5, null);
  if (!e.def.fireproof) { e.burning = Math.max(e.burning || 0, 8); if (!(e.burnT > 0)) e.burnT = 1; }
}
// Lightning strikes the air block at (x, y, z), right above what it hits
function strike(x, y, z, why) {
  drawBolt(x, y, z);
  if (G.guest) return;
  MP.bolt(x, y, z);
  const w = G.world, p = G.player, rod = w.id(x, y - 1, z) === B.LIGHTNING_ROD;
  if (rod) { puff(x + 0.5, y, z + 0.5, "spark"); G.adv?.("rod"); }
  else if (G.wset.difficulty !== "peaceful" && G.wset.difficulty !== "easy") {   // Java: fire on Normal and Hard
    const spots = [[0, 0]];
    if (G.wset.difficulty === "hard") for (let i = 0; i < 2; i++) spots.push([Math.floor(Math.random() * 3) - 1, Math.floor(Math.random() * 3) - 1]);
    for (const [dx, dz] of spots) { const fx = x + dx, fz = z + dz; if (!w.id(fx, y, fz) && SOLID[w.id(fx, y - 1, fz)]) lightFire(fx, y, fz); }
  }
  for (const e of ents.near(x + 0.5, y + 0.5, z + 0.5, 3.2)) lightningHit(e);
  if (!G.creative && !G.spectator && G.state !== "dead" && Math.hypot(p.pos.x - x - 0.5, p.pos.z - z - 0.5) < 2 && Math.abs(p.pos.y - y) < 3) {
    hurt(5, why === "channel" ? "Your own lightning hit you! Throw from farther away." : "You were struck by lightning! Get under a roof during thunderstorms.", null, false, "lightning");
    addEffect("fire", 8);
  }
}
G._strike = strike;
// pick where the next bolt lands
function updateLightning(dt) {
  updateBolts(dt);
  if (G.guest || G.wx.thunder < 0.5 || !weatherHere()) return;
  if ((boltT -= dt) > 0) return;
  boltT = 3 + Math.random() * 9;
  const p = G.player, a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 58;
  let x = Math.floor(p.pos.x + Math.cos(a) * r), z = Math.floor(p.pos.z + Math.sin(a) * r);
  const rod = rodNear(x, z);
  if (rod) { strike(rod.x, rod.y + 1, rod.z, "rod"); return; }
  if (Math.random() < 0.3) {   // sometimes it finds a creature (or you) standing out in the open nearby
    const open = ents.near(x, p.pos.y, z, 10, e => !e.def.object && !e.def.boss && skyCols.rainedOn(e.pos.x, e.pos.y + e.h, e.pos.z));
    if (Math.random() < 0.15 && Math.hypot(p.pos.x - x, p.pos.z - z) < 10 && skyCols.rainedOn(p.pos.x, p.pos.y + 1.8, p.pos.z)) open.push(p);
    if (open.length) { const t = open[Math.floor(Math.random() * open.length)]; x = Math.floor(t.pos.x); z = Math.floor(t.pos.z); }
  }
  const c = skyCols.at(x, z);
  if (c.kind !== 1 || c.off) { Sound.thunder(80 + Math.random() * 120); return; }   // no rain there (desert, snow): only a far-off rumble
  strike(x, c.top + 1, z, "storm");
}
// Channeling: a trident that hits a creature out in a thunderstorm calls lightning down onto it
function channelOnto(e) {
  if (G.wx.thunder < 0.5 || !skyCols.rainedOn(e.pos.x, e.pos.y + e.h, e.pos.z)) return;
  strike(Math.floor(e.pos.x), Math.floor(e.pos.y), Math.floor(e.pos.z), "channel");
  G.adv?.("channel");
}

// ---------- Milestone 19, Part C: snow and ice ----------
// A few random spots near you get a look every quarter second (like Minecraft's random ticks): in cold places snow
// piles up while it snows and open water freezes over; ice and snow next to a bright light (torch, lantern, glowstone)
// melt; rain fills cauldrons. Placing a bright light also checks for ice and snow around it.
const MELTS = new Set([B.ICE, B.SNOW_LAYER]);
const NO_SNOW_ON = new Set([B.ICE, B.PACKED_ICE, B.BLUE_ICE, B.FROSTED_ICE, B.FARMLAND, B.SNOW_LAYER]);
let snowTickT = 0, cauldronT = 0;
const meltChecks = [], meltLater = [];
function blockLightNear(x, y, z) {   // the brightest torchlight touching a block
  let m = 0;
  for (const [a, b, c] of SIX) { const L = G.world.lightAt(x + a, y + b, z + c); if (L && L[1] > m) m = L[1]; }
  return m;
}
function meltBlock(x, y, z) {
  const w = G.world, id = w.id(x, y, z);
  if (id === B.ICE) { w.set(x, y, z, G.world.gen.isNether() ? B.AIR : B.WATER); FL.wake(x, y, z); G.adv?.("melt"); }
  else if (id === B.SNOW_LAYER) w.set(x, y, z, B.AIR);
}
function queueMeltCheck(x, y, z) { meltChecks.push({ x, y, z, t: 1.5 }); if (meltChecks.length > 30) meltChecks.shift(); }   // after the light has spread
G._meltCheck = queueMeltCheck;
function forPlaced(id, x, z, reach, fn) {   // blocks a player placed (they're all in the change list) near (x, z)
  const w = G.world, cx0 = Math.floor(x / CHUNK), cz0 = Math.floor(z / CHUNK), R = Math.ceil(reach / CHUNK);
  for (let cx = cx0 - R; cx <= cx0 + R; cx++) for (let cz = cz0 - R; cz <= cz0 + R; cz++) {
    const m = w.mods.get(cx + "," + cz);
    if (m) for (const [i, v] of m) if (idOf(v) === id) fn(cx * CHUNK + (i % CHUNK), Math.floor(i / (CHUNK * CHUNK)), cz * CHUNK + Math.floor(i / CHUNK) % CHUNK, v);
  }
}
function canSnowOn(id) { return !NO_SNOW_ON.has(id) && (OPAQUE[id] || isLeaf(id)); }
function updateSnowAndIce(dt) {
  if (G.guest || !G.world) return;
  const w = G.world;
  for (let i = meltChecks.length - 1; i >= 0; i--) {
    const m = meltChecks[i];
    if ((m.t -= dt) > 0) continue;
    meltChecks.splice(i, 1);
    for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) for (let dz = -4; dz <= 4; dz++) {
      const x = m.x + dx, y = m.y + dy, z = m.z + dz;
      if (MELTS.has(w.id(x, y, z))) meltLater.push({ x, y, z, t: 1 + Math.random() * 8, tries: 3 });   // the light may still be spreading: look again a few times
    }
  }
  for (let i = meltLater.length - 1; i >= 0; i--) {
    const m = meltLater[i];
    if ((m.t -= dt) > 0) continue;
    if (blockLightNear(m.x, m.y, m.z) > 11) { meltLater.splice(i, 1); meltBlock(m.x, m.y, m.z); }
    else if (--m.tries <= 0) meltLater.splice(i, 1); else m.t = 2;
  }
  if (meltLater.length > 400) meltLater.length = 400;
  if (!weatherHere()) return;
  const p = G.player, falling = G.wx.rain > 0.5;
  if (falling && (cauldronT -= dt) <= 0) {   // rain slowly fills cauldrons out in the open
    cauldronT = 2;
    forPlaced(B.CAULDRON, p.pos.x, p.pos.z, 48, (x, y, z, v) => {
      if ((metaOf(v) & 3) < 3 && Math.random() < 1 / 8 && w.get(x, y, z) === v && skyCols.rainedOn(x + 0.5, y + 1, z + 0.5)) w.set(x, y, z, make(B.CAULDRON, (metaOf(v) & 3) + 1));
    });
  }
  if ((snowTickT -= dt) > 0) return;
  snowTickT = 0.25;
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(p.pos.x + (Math.random() * 2 - 1) * 48), z = Math.floor(p.pos.z + (Math.random() * 2 - 1) * 48);
    const c = skyCols.at(x, z);
    if (c.off || c.top < 1) continue;
    const y = c.top, id = w.id(x, y, z);
    if (MELTS.has(id) && blockLightNear(x, y, z) > 11) { meltBlock(x, y, z); continue; }
    if (c.kind !== 2) continue;   // only cold places freeze and get snow
    if (id === B.WATER && isSource(w.get(x, y, z)) && blockLightNear(x, y, z) < 10 &&
        SIX.some(([a, , b]) => (a || b) && w.isLoaded(x + a, z + b) && w.id(x + a, y, z + b) !== B.WATER)) { w.set(x, y, z, B.ICE); continue; }   // water freezes over from the edges
    if (falling && canSnowOn(id) && w.id(x, y + 1, z) === B.AIR && blockLightNear(x, y + 1, z) < 10) w.set(x, y + 1, z, B.SNOW_LAYER);
  }
}

// what sleeping does to the sky: the weather clears for half a day or more
function sleepClearsWeather() {
  const wet = G.wx.rain > 0.05;
  G.meta.wxClear = worldSeconds() + DAY_LENGTH * (0.5 + Math.random() * 0.75);
  G.meta.wxSet = null;
  return wet;
}
G.sleepClearsWeather = sleepClearsWeather;
// Part D: the Creative weather buttons set the sky for one day
G.setWeather = kind => {
  if (!G.creative || G.guest || G.dim !== "overworld" || !["clear", "rain", "thunder"].includes(kind)) return;
  const now = worldSeconds();
  G.meta.wxSet = { kind, at: now, until: now + DAY_LENGTH }; G.meta.wxClear = 0;
  if (G.wset.weather === false) { G.wset.weather = true; const c = document.getElementById("pWeather"); if (c) c.checked = true; }
  UI.toast(kind === "clear" ? "The sky clears." : kind === "rain" ? "It starts to rain." : "A thunderstorm rolls in!");
};   // Play Together uses it too

// ---------- sky ----------
// Surface sky swatches are in display space, like the terrain atlas used by the custom shader.
const skySwatch = hex => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
const SKY_DAY = skySwatch(0xb8dcf8), SKY_SET = skySwatch(0xf4a878), SKY_NIGHT = skySwatch(0x182641);
const SKY_TOP_DAY = skySwatch(0x649ce9), SKY_TOP_NIGHT = skySwatch(0x080e23), skyCol = new THREE.Color();
const NETHER_SKY = new THREE.Color(0x3a0c0c);
let ashT = 0, rumbleT = 8;
let badlandsAsh = 0, badlandsAshT = 0;
const END_SKY = new THREE.Color(0x140a1e);
const STORM_SKY = new THREE.Color(0xa97e54);
const ASH_SKY = new THREE.Color(0x654c50);
const STORM_DUST = [STORM_SKY.r, STORM_SKY.g, STORM_SKY.b];
let stormStage = 0, stormSampleT = 0, stormDustT = 0, creativeStormUntil = 0;
let stormVortex = null, stormVortexT = 10;
let duneInterest = 0;
const stormActivity = new StormActivity();
let stormActivityElapsed = 0;
function duneEncounterReview() {
  return { storm: stormStage, interest: duneInterest, wild: ents.list.filter(e => e.sp === "leviathan_dune" && !e.tame && !e.gone).length,
    activity: stormActivity.review(), called: stormCallStatus(G.story?.leviathan?.stormCall, G.meta ? worldSeconds() : 0) };
}
function sandEncounterSite(x, z) {
  x = Math.floor(x); z = Math.floor(z);
  if (!G.world.chunkAt(x, z) || G.gen.column(x, z).biome !== "sandy") return null;
  const y = G.world.surfaceY(x, z);
  if (G.world.id(x, y, z) !== B.SAND) return null;
  return { x: x + 0.5, y: y + 1, z: z + 0.5 };
}
function updateDuneEncounter(dt) {
  if (stormStage !== 4 || G.creative || G.spectator || G.wset.difficulty === "peaceful" ||
      G.story.leviathan?.dune?.defeated || G.story.leviathan?.dune?.bonded ||
      ents.list.some(e => e.sp === "leviathan_dune" && !e.gone)) {
    duneInterest = 0;
    return;
  }
  const p = G.player;
  const vibrating = p.onGround && !p.crouch && !G.riding && Math.hypot(p.vel.x, p.vel.z) > 4.8;
  duneInterest = vibrating ? duneInterest + dt : Math.max(0, duneInterest - dt);
  if (duneInterest < 3) return;
  duneInterest = 0;
  const site = findDuneApproach(p.pos, p.vel, sandEncounterSite);
  if (!site) return;
  const expansion = G.story.leviathan ||= {};
  const record = expansion.dune ||= { hp: SPECIES.leviathan_dune.hp };
  const e = ents.add("leviathan_dune", site.x, site.y - 8, site.z, { hp: record.hp });
  e.duneCycle = { step: "buried", until: 1.4, site };
  Sound.mob("rumble", 0);
  UI.toast("Something is tracking your footsteps beneath the sand.");
}
function updateObsidianEncounter() {
  const expansion = G.story.leviathan, site = expansion?.sites?.citadel;
  if (G.dim !== "overworld" || !site || G.creative || G.spectator || G.wset.difficulty === "peaceful" ||
      expansion.obsidian?.defeated || expansion.obsidian?.bonded) return;
  const a = citadelArena(site), p = G.player.pos;
  if (Math.abs(p.y - a.y) > 2 || Math.hypot(p.x - a.x, p.z - a.z) > 8 ||
      ents.list.some(e => e.sp === "leviathan_obsidian" && !e.gone)) return;
  const record = expansion.obsidian ||= { hp: SPECIES.leviathan_obsidian.hp };
  const vent = selectObsidianVent(G.world, site, G.meta.day || 1);
  const e = ents.add("leviathan_obsidian", vent?.x ?? a.x, vent ? vent.y - 8 : a.y - 7, vent?.z ?? a.z - 4, { hp: record.hp });
  e.duneCycle = { step: "warning", until: 2.2, site: a, count: 0, vent };
  Sound.mob("rumble", 0);
  UI.toast(vent ? "The north lava vent rumbles. Keep clear of the glowing rim." :
    "The Citadel trembles. An Obsidian Leviathan is rising.");
}
function awakenAncient() {
  if (G.creative || G.spectator) { UI.toast("Awaken the Buried King in Survival."); return; }
  const expansion = G.story.leviathan ||= {}, lore = expansion.sandsLore || {};
  const read = SANDS_REGIONS.filter(region => lore[region.name]).length;
  if (G.wset.difficulty === "peaceful") { UI.toast("The Buried King rests in Peaceful."); return; }
  if (expansion.ancient?.defeated) { UI.toast("The Buried King has returned to the sands."); return; }
  if (ents.list.some(e => e.sp === "leviathan_ancient" && !e.gone)) return;
  if (read < 6 || !expansion.annex?.coreClaimed) {
    UI.toast(`The throne remembers ${read}/6 records. Claim the Ancient Desert Core and read all six to awaken it.`);
    return;
  }
  const a = BURIED_THRONE, record = expansion.ancient ||= { hp: SPECIES.leviathan_ancient.hp };
  const e = ents.add("leviathan_ancient", a.x, a.y - 22, a.z - 8, { hp: record.hp });
  e.yaw=Math.atan2(a.x-G.player.pos.x,a.z-8-G.player.pos.z);
  e.duneCycle = { step: "awakening", until: e.age + 7, site: a, count: 0,
    arrivalFrom:e.age, arrival:{x:a.x,y:a.y,z:a.z-8,r:8} };
  e.goal = { x: a.x, y: a.y - 4, z: a.z - 8, speed: 2 };
  saveNow(false);
  Sound.mob("rumble", 0);
  UI.toast("The Throne of the Buried King awakens. Leave the center of the court.");
}
function ancientPhase(e) {
  return e.duneCycle.step === "awakening" ? 1 : ancientCombatPhase(e.hp,e.maxHp);
}
let arenaFractures = null;
function clearArenaFractures() {
  arenaFractures?.clear();
  arenaFractures = null;
}
function thinkAncient(e, multiplier) {
  const c = e.duneCycle, p = G.player.pos, a = BURIED_THRONE;
  if (!c || G.dim !== HOLLOW_SANDS || G.wset.difficulty === "peaceful" || Math.hypot(p.x - a.x, p.z - a.z) > 43) {
    e.gone = true; return;
  }
  if (e.age < c.until) return;
  const phase = ancientPhase(e);
  if (c.step === "awakening" || c.step === "buried") {
    const first = c.step === "awakening";
    if(first){
      c.awakenedAt=e.age;
      c.introCircle={from:e.age+1.2,until:e.age+1.2+ANCIENT_CIRCLE_SECONDS};
    }
    e.emerged = true;
    e.goal = { x: a.x, y: a.y, z: a.z - 8, speed: 14 };
    c.step = "recover"; c.until = first ? c.introCircle.until + ANCIENT_CIRCLE_SETTLE_SECONDS : e.age + 4;
    Sound.mob("roar", 0);
    puff(a.x, a.y + 2, a.z - 8, "pale");
    UI.toast(first ? "The Ancient rises! It will circle the court before attacking. You can keep moving." : "The Ancient Leviathan rises. The Buried King has awakened.");
  } else if (c.step === "recover") {
    if(c.introCircle&&!c.introCircle.roared){
      c.introCircle.roared=true;c.introCircle.roaredAt=e.age;c.until=e.age+1.2;
      Sound.mob("roar",0);UI.toast("The Ancient has circled the court. Its first attack is coming.");return;
    }
    if (phase === 4) {
      c.attack=createAncientFury(e.age,p,a);c.furyIndex=0;
      c.step="fury";c.attackAt=c.attack.strikes[0].at;c.until=c.attackAt;
      return;
    }
    if (phase === 2 && c.count % 3 === 0 && ents.list.filter(o => o.encounterOwner === e && !o.dead && !o.gone).length < 4) {
      c.step = "summoning"; c.summonFrom = e.age; c.until = e.age + 1.8;
      c.summonSites = [-1, 1].map(side => ({ x: a.x + side * 10 + .5, y: a.y, z: a.z + 8 + .5, r: 1.5, warned:false }));
      return;
    }
    const central = phase === 2 || c.count % 3 === 0;
    const inCourt = Math.hypot(p.x - a.x, p.z - a.z) < 25;
    c.attack = { x: central || !inCourt ? a.x : p.x, y: a.y, z: central || !inCourt ? a.z : p.z,
      r: central ? 11 : phase === 5 ? 5 : 3.5, from: e.age, phase, warned: false };
    if (phase === 5) c.attack.collapses = [-1,1].map(side => ({x:a.x+side*12+.5,y:a.y,
      z:a.z+side*(c.count%2?-12:12)+.5,r:2.25,warned:false}));
    c.step = "judgment"; c.until = e.age + (central ? 2 : phase === 5 ? 1.3 : 2);
    c.attackAt = c.until;
  } else if (c.step === "fury") {
    const strike=c.attack?.strikes?.[c.furyIndex];
    if(!strike?.warned||G.creative||G.spectator){
      c.attack=null;c.step="buried";c.until=e.age+2.4;e.emerged=false;
      e.goal={x:a.x,y:a.y-12,z:a.z-8,speed:12};return;
    }
    ancientRuneRing(strike,strike.y,.45);
    Sound.tone(220+c.furyIndex*80,.18,"triangle",.08);
    if(Math.abs(p.y-strike.y)<3&&Math.hypot(p.x-strike.x,p.z-strike.z)<strike.r)
      hurt(9*multiplier,"The Ancient Leviathan's rune strike hit you.",e,false,"ancientEnergy");
    if(G.state==="dead"){c.attack=null;return;}
    c.furyIndex++;
    if(c.furyIndex<3){c.attackAt=c.attack.strikes[c.furyIndex].at;c.until=c.attackAt;}
    else{c.attack=null;c.count++;c.step="recover";c.until=e.age+3;}
  } else if (c.step === "summoning") {
    for (const point of c.summonSites || []) {
      if (!point.warned || G.creative || G.spectator) continue;
      if (ents.list.filter(o => o.encounterOwner === e && !o.dead && !o.gone).length >= 4 ||
          ents.list.filter(o => !o.dead && !o.gone).length >= 120) break;
      const x = Math.floor(point.x), z = Math.floor(point.z), y = point.y;
      if (!G.world.isLoaded(x, z) || !SOLID[G.world.id(x, y - 1, z)] ||
          [0, 1, 2].some(dy => G.world.id(x, y + dy, z) !== B.AIR) ||
          Math.hypot(p.x - point.x, p.z - point.z) < 2) continue;
      const guardian = ents.add("ancient_sentinel", point.x, y, point.z);
      guardian.encounterOwner = e;
      guardian.persist = false;
      puff(point.x, y + 0.5, point.z, "pale");
    }
    c.summonSites = null; c.count++;
    c.step = "recover"; c.until = e.age + 2.5;
  } else if (c.step === "judgment") {
    const hit = c.attack;
    // An unsupported or disposed warning cannot release an invisible strike.
    if (!hit?.warned || G.creative || G.spectator) {
      c.attack = null; c.step = "buried"; c.until = e.age + 2.4;
      e.emerged = false; e.goal = { x:a.x, y:a.y-12, z:a.z-8, speed:12 }; return;
    }
    // Damage, terrain effects and recovery belong to the warning already shown,
    // even when a player hit has crossed a health threshold in the meantime.
    const castPhase=Number.isInteger(hit.phase)&&hit.phase>=2&&hit.phase<=5?hit.phase:phase;
    ancientRuneRing(hit, a.y, 0.6);
    if (Math.abs(p.y - a.y) < 3 && Math.hypot(p.x - hit.x, p.z - hit.z) < hit.r) {
      hurt((5 + castPhase) * multiplier, "The Ancient Leviathan's judgment struck you.", e, false, "ancientEnergy");
    }
    if (G.state !== "dead" && (castPhase === 3 || castPhase === 5)) {
      arenaFractures ||= new ArenaFractures(G.world, G.player, BURIED_THRONE);
      if (castPhase === 3) arenaFractures.fracture(hit.x, hit.z);
      else for (const point of (hit.collapses || []).slice(0,2)) if (point.warned) arenaFractures.fracture(point.x,point.z);
    }
    c.count++; c.attack = null;
    if (castPhase >= 4 && c.count % 2) {
      c.step = "recover"; c.until = e.age + (castPhase === 5 ? 1.9 : 2.8);
    } else {
      c.step = "buried"; c.until = e.age + 2.4;
      e.emerged = false;
      e.goal = { x: a.x, y: a.y - 12, z: a.z - 8, speed: 12 };
    }
  }
}
function ancientRuneRing(hit, y, life) {
  for (let i = 0; i < 24 && parts.length < PMAX - 12; i++) {
    const a = i * Math.PI / 12;
    emitParticle(hit.x + Math.cos(a) * hit.r, y + 0.2, hit.z + Math.sin(a) * hit.r,
      0, 0.25, 0, life, PUFF_COLORS.pale, true);
  }
}
function damageAncient(e) {
  const record = G.story.leviathan.ancient;
  if (!record || record.defeated || e.duneCycle?.preview) return;
  const previousPhase = ancientCombatPhase(record.hp,e.maxHp);
  record.hp = Math.max(0, e.hp);
  if (e.hp > 0) {
    if (ancientCombatPhase(e.hp,e.maxHp) !== previousPhase) saveNow(false);
    return;
  }
  Sound.ancientMusic(null);
  clearAncientFury();
  clearAncientArrival();
  clearAncientWarning();
  clearArenaFractures();
  record.defeated = true;
  record.rewardsClaimed = false;
  saveNow(false);
  UI.toast("The Buried King has fallen. Your treasures await safely at the Throne altar.","good");
}
function claimAncientVictory() {
  const record = G.story.leviathan?.ancient;
  if (!ancientRewardPending(record)) {
    UI.toast("The Buried King has returned to the sands. Its treasures have already been granted."); return;
  }
  if (G.creative || G.spectator || G.dim !== HOLLOW_SANDS) {
    UI.toast("Return to the Throne altar in Survival to claim your treasures."); return;
  }
  const inventory = ancientRewardInventory(G.inv);
  if (!inventory) {
    UI.toast("Make room in your backpack for the full treasure set. Your rewards remain safe at this altar.","bad"); return;
  }
  G.inv.load(inventory); record.rewardsClaimed = true;
  giveXp(ANCIENT_VICTORY_XP); G.hudDirty = true;
  saveNow(false);
  Sound.levelUp();
  UI.toast("The King's treasures are yours, with 350 experience. The companion relic now answers your call.","good");
}
function worldSeconds() {
  return (G.meta.day || 1) * DAY_LENGTH + G.time * DAY_LENGTH;
}
function checkpointAncientCompanion(e) {
  const record = G.story.leviathan?.companion;
  if (!record || e.uid !== record.uid || e.gone) return;
  const previousHp = record.hp, previousSitting = record.sitting;
  record.hp = Math.max(1,e.hp); record.sitting = !!e.sitting;
  if (e.hp <= 0) {
    record.readyAt = worldSeconds() + 60; record.hp = e.maxHp;
    e.hp = 1; e.gone = true;
    saveNow(false);
    UI.toast("Runecrest retreats into the relic to recover.");
  } else if (record.hp !== previousHp || record.sitting !== previousSitting) saveNow(false);
}
function useAncientCompanion() {
  const expansion = G.story.leviathan;
  if (!expansion?.ancient?.defeated) {
    UI.toast("The relic answers after the Buried King has been defeated.");
    return true;
  }
  const actor = ents.list.find(e => e.sp === "ancient_companion" && !e.gone && !e.dead);
  const record = expansion.companion || { uid: actor?.uid || newId(), hp: SPECIES.ancient_companion.hp, sitting: false };
  if (actor) {
    record.hp = actor.hp; record.sitting = actor.sitting;
    expansion.companion = record;
    actor.gone = true;
    saveNow(false);
    Sound.mob("shell", 0);
    UI.toast("Runecrest rests within the relic.");
    return true;
  }
  if (worldSeconds() < (record.readyAt || 0)) {
    UI.toast("Runecrest is recovering. The relic will answer in a moment.");
    return true;
  }
  const p = G.player, w = G.world;
  for (const radius of [2, 3, 4]) for (let k = 0; k < 8; k++) {
    const a = p.yaw + k * Math.PI / 4;
    const x = Math.floor(p.pos.x + Math.cos(a) * radius), z = Math.floor(p.pos.z + Math.sin(a) * radius);
    if (!w.chunkAt(x, z)) continue;
    for (let y = Math.floor(p.pos.y) + 1; y >= Math.floor(p.pos.y) - 2; y--) {
      const ground = w.id(x, y - 1, z);
      if (!SOLID[ground] || ground === B.MAGMA || w.id(x, y, z) !== B.AIR || w.id(x, y + 1, z) !== B.AIR) continue;
      const e = ents.add("ancient_companion", x + 0.5, y, z + 0.5, {
        uid: record.uid, hp: record.hp, sitting: record.sitting, tame: true, name: "Runecrest"
      });
      expansion.companion = record;
      saveNow(false);
      puff(e.pos.x, e.pos.y + 0.5, e.pos.z, "pale");
      Sound.mob("shell", 0);
      UI.toast("Runecrest emerges. Right-click to sit or follow; Skyshards restore health.", "good");
      return true;
    }
  }
  UI.toast("Find clear, solid ground nearby before calling Runecrest.");
  return true;
}
function showObsidianRecoveryHint() {
  UI.toast(G.story.leviathan?.obsidian?.ritualOffered
    ? "The molten veins dim. Sound the horn during its recovery."
    : "The molten veins dim. Strike while it recovers.");
}
function thinkObsidian(e, multiplier) {
  const c = e.duneCycle, p = G.player.pos;
  if (e.tame) {
    if (Math.hypot(p.x - e.pos.x, p.z - e.pos.z) > 52) e.gone = true;
    else thinkBondedLeviathan(G.world, e, G.player, G.story.leviathan.obsidian);
    return;
  }
  if (G.creative || G.spectator || G.dim !== "overworld" || G.state === "dead") {
    if (c) { c.attack = null; c.step = "buried"; c.until = e.age + 1.8; }
    return;
  }
  if (!c || G.wset.difficulty === "peaceful" || Math.hypot(p.x - c.site.x, p.z - c.site.z) > 28) {
    e.gone = true;
    return;
  }
  if (e.age < c.until) return;
  const a = c.site, phase = obsidianEncounterPhase(e, G.story.leviathan?.obsidian);
  if (c.step === "warning" && c.vent) {
    if (openObsidianVent(G.world, c.vent)) {
      c.step = "vent-rise"; c.riseFrom = e.age; c.until = e.age + OBSIDIAN_VENT_RISE;
      e.yaw = Math.PI;
      Sound.mob("roar", 0);
      puff(c.vent.x, c.vent.y + .5, c.vent.z, "ember");
      return;
    }
    Object.assign(e.pos, { x: a.x, y: a.y - 7, z: a.z - 4 });
    c.vent = null;
  }
  if (c.step === "vent-rise") {
    stepObsidianVent(e);
    c.step = "surface"; c.until = e.age + 1.6;
    return;
  }
  if (c.step === "buried" || c.step === "warning") {
    e.emerged = true;
    e.goal = { x: a.x, y: a.y, z: a.z - 4, speed: 10 };
    c.step = "surface"; c.until = e.age + 1.6;
    Sound.mob("roar", 0);
    puff(a.x, a.y, a.z - 4, "ember");
  } else if (c.step === "surface") {
    if (phase >= 2 && c.count % 3 === 1) {
      const target = { x: p.x, y: p.y + 1, z: p.z };
      c.attack = { ...target, kind: "shrapnel", from: e.age, volley: planObsidianShrapnel(e, target), warned: false, phase: 4 };
      e.goal = null; e.vel.x = e.vel.y = e.vel.z = 0;
      e.yaw = Math.atan2(e.pos.x - p.x, e.pos.z - p.z);
      c.step = "shrapnel"; c.until = e.age + 1.2; c.attackAt = c.until;
      puff(e.pos.x, e.eyeY, e.pos.z, "ember");
      Sound.mob("clank", 0);
      return;
    }
    const roar = phase >= 3 && c.count % 2 === 1;
    const near = Math.hypot(p.x - a.x, p.z - a.z) < a.radius;
    c.attack = { x: roar || !near ? a.x : p.x, z: roar || !near ? a.z : p.z, r: roar ? 6 : 2.8 + phase * 0.25,
      kind: roar ? "roar" : "eruption", from: e.age, warned: false };
    c.step = "attack"; c.until = e.age + (roar ? 1.75 : 1.3);
    c.attackAt = c.until;
    c.attack.phase = 4;
  } else if (c.step === "shrapnel") {
    const target = c.attack;
    if (!target?.warned || !validObsidianVolley(target.volley)) {
      c.attack = null; c.step = "buried"; c.until = e.age + 1.8;
      e.emerged = false; e.goal = { x: a.x, y: a.y - 7, z: a.z - 4, speed: 12 };
      return;
    }
    const origin = target.volley.origin;
    for (const shot of target.volley.shots) {
      ents.addProjectile("obsidianshard", origin.x, origin.y, origin.z,
        shot.vx, shot.vy, shot.vz,
        { owner: e, noGrav: true, dmg: 4 * multiplier });
    }
    c.count++; c.attack = null;
    c.step = "recover"; c.until = e.age + 3.2 - phase * 0.2; c.ritualUsed = false; c.ritualFrom = e.age;
    showObsidianRecoveryHint();
  } else if (c.step === "attack") {
    const hit = c.attack;
    if (!hit?.warned) {
      c.attack = null; c.step = "buried"; c.until = e.age + 1.8;
      e.emerged = false; e.goal = { x: a.x, y: a.y - 7, z: a.z - 4, speed: 12 };
      return;
    }
    obsidianHeatRing(hit, a.y, 0.6);
    if (Math.abs(p.y - a.y) < 2.5 && Math.hypot(p.x - hit.x, p.z - hit.z) < hit.r) {
      hurt((5 + phase) * multiplier, "The Obsidian Leviathan's heat overwhelmed you.", e, false, "fire");
    }
    if (phase >= 2) {
      ents.addHazard(hit.x, a.y, hit.z, Math.min(hit.r, 3.2), 0.75, 2,
        "The Citadel's scorched ground burned you. Leave the glowing patch.", 4,
        { owner: e, damageKind: "fire" });
      UI.toast("The ground is scorched. Stay clear of the glowing patch.");
    }
    c.count++;
    c.attack = null;
    c.step = "recover"; c.until = e.age + 3.2 - phase * 0.2;
    c.ritualUsed = false; c.ritualFrom = e.age;
    showObsidianRecoveryHint();
  } else {
    e.emerged = false;
    e.goal = { x: a.x, y: a.y - 7, z: a.z - 4, speed: 12 };
    c.step = "buried"; c.until = e.age + 1.8;
  }
}
function obsidianHeatRing(hit, y, life) {
  for (let i = 0; i < 18 && parts.length < PMAX - 12; i++) {
    const a = i * Math.PI / 9;
    emitParticle(hit.x + Math.cos(a) * hit.r, y + 0.18, hit.z + Math.sin(a) * hit.r,
      0, 0.3, 0, life, PUFF_COLORS.ember, true);
  }
}
function damageObsidian(e) {
  const record = G.story.leviathan.obsidian;
  if (e.tame) {
    record.hp = Math.max(1, e.hp);
    if (e.hp <= 0) { e.hp = 1; e.gone = true; UI.toast("Your wounded Obsidian Leviathan retreats."); }
    saveNow(false);
    return;
  }
  e.duneCycle.ritualMarks = 0;
  e.duneCycle.ritualUsed = true;
  const phase = dunePhase(record.hp, e.maxHp);
  record.hp = Math.max(0, e.hp);
  if (e.hp > 0) {
    if (dunePhase(record.hp, e.maxHp) !== phase) saveNow(false);
    return;
  }
  if (record.defeated) return;
  record.defeated = true;
  const a = e.duneCycle.site;
  for (const [id, n] of [[I.OBSIDIAN_SCALE, 6], [I.MOLTEN_HEART, 1], [I.INFERNO_FANG, 1], [I.VOLCANIC_ESSENCE, 3]]) {
    spawnDrop(id, n, a.x, a.y + 0.5, a.z);
  }
  spawnDrop(B.OBSIDIAN_TROPHY, 1, a.x, a.y + 0.5, a.z);
  spawnOrbs(220, a.x, a.y + 0.5, a.z);
  saveNow(false);
}
function thinkDune(e, damageMultiplier) {
  const p = G.player.pos, cycle = e.duneCycle;
  if (!cycle) { e.gone = true; return; }
  if (e.tame) {
    if (Math.hypot(p.x - e.pos.x, p.z - e.pos.z) > 52) e.gone = true;
    else thinkBondedLeviathan(G.world, e, G.player, G.story.leviathan.dune);
    return;
  }
  if (G.creative || G.spectator || G.wset.difficulty === "peaceful" || Math.hypot(p.x - e.pos.x, p.z - e.pos.z) > 52) {
    e.gone = true;
    return;
  }
  const phase = dunePhase(e.hp, e.maxHp);
  if (cycle.step === "surface" && phase >= 2) updateDuneSurfaceAttack(e, phase, damageMultiplier);
  if (e.age < cycle.until) return;
  if (cycle.step === "buried") {
    const site = sandEncounterSite(p.x, p.z);
    if (!site || Math.abs(site.y - p.y) > 2) { e.gone = true; return; }
    cycle.site = site; cycle.step = "warning"; cycle.until = e.age + 1.8 - phase * 0.15; cycle.warningFrom = e.age;
    e.goal = { ...site, y: site.y - 5, speed: 15 };
    const wildlife = ents.near(site.x, site.y, site.z, 14, animal =>
      animal.def.animal && !animal.def.flies && !animal.tame && !animal.ridden && !animal.inCart);
    for (const animal of wildlife.slice(0, 8)) animal.leviathanFlee = { x: site.x, z: site.z, until: animal.age + 3.5 };
    puff(site.x, site.y, site.z, "crumb");
    Sound.mob("rumble", 0);
  } else if (cycle.step === "warning") {
    const s = cycle.site;
    cycle.step = "rising"; cycle.until = e.age + 1.4; cycle.riseFrom = e.age;
    e.goal = { ...s, y: s.y + 8, speed: 16 };
    puff(s.x, s.y + 0.5, s.z, "crumb");
    Sound.mob("roar", 0);
    if (Math.abs(p.y - s.y) < 2.5 && Math.hypot(p.x - s.x, p.z - s.z) < 3) {
      hurt((4 + phase) * damageMultiplier, "The Dune Leviathan erupted beneath you.", e);
    }
  } else if (cycle.step === "rising") {
    const s = cycle.site;
    cycle.step = "surface"; cycle.until = e.age + (phase === 1 ? 6 : 5);
    cycle.attackAt = e.age + 1.1; cycle.attack = null;
    cycle.ritualFrom = e.age + 0.75;
    cycle.ritualUntil = e.age + 2.45;
    cycle.ritualUsed = false;
    e.emerged = true;
    e.goal = { ...s, speed: 16 };
    puff(s.x, s.y + 0.5, s.z, "crumb");
  } else {
    cycle.step = "buried"; cycle.until = e.age + (phase === 1 ? 2.7 : 2.2 - phase * 0.3);
    e.emerged = false;
    e.goal = { ...cycle.site, y: cycle.site.y - 8, speed: 12 };
  }
}
function callDesertStorm(source) {
  if (G.dim !== "overworld" || G.creative || G.spectator || G.wset.difficulty === "peaceful") return false;
  const now = worldSeconds(), called = stormCallStatus(G.story.leviathan?.stormCall, now);
  if (!called.ready) {
    UI.toast(called.stage ? "A storm is already gathering. Read the instrument for its timing." : `The sands are settling. Try again in about ${Math.ceil(called.cooldown)} seconds.`);
    return false;
  }
  if (sandstormStage(G.gen.seed, G.meta.day || 1, G.time) === 4) {
    UI.toast("A Leviathan Storm is already active. Sprint on open sand to draw the creature out."); return false;
  }
  (G.story.leviathan ||= {}).stormCall = { at: now, source };
  stormActivity.reset();
  saveNow(false);
  Sound.mob("rumble", 0);
  UI.toast(source === "battle" ? "The clash awakens the desert. A storm is gathering!" : source === "observatory" ?
    "The relics answer the horn. A storm is gathering!" : "Your footsteps stir the dunes. A storm is gathering!");
  return true;
}
function useObservatoryStorm() {
  const site = G.story.leviathan?.sites?.observatory;
  if (!site) return false;
  const at = observatoryTablet(site), p = G.player.pos;
  if (Math.hypot(p.x-at.x-.5, p.z-at.z-.5) > 4.5 || Math.abs(p.y-at.y) > 2.5) return false;
  if (G.world.id(at.x, at.y, at.z) !== B.LORE_TABLET || p.y < G.world.surfaceY(Math.floor(p.x), Math.floor(p.z))+.5 ||
      !lineOfSight(G.world, { x:p.x, y:p.y+G.player.eye, z:p.z }, {x:at.x+.5,y:at.y+1.15,z:at.z+.5})) {
    UI.toast("Stand on the open Observatory platform with a clear view of its instrument."); return true;
  }
  if (!callDesertStorm("observatory") && (G.creative || G.wset.difficulty === "peaceful")) UI.toast("Call storms in Survival with combat enabled.");
  return true;
}
function useSandcallerHorn() {
  if (G.spectator) return true;
  if (G.dim !== "overworld") {
    UI.toast("The Sandcaller Horn answers only on the Surface.");
    return true;
  }
  if (G.riding) { UI.toast("Dismount before using the Sandcaller Horn."); return true; }
  if (useObsidianHorn()) return true;
  const p = G.player, e = ents.list.find(e => e.sp === "leviathan_dune" && !e.dead && !e.gone && !e.duneCycle?.preview);
  const record = G.story.leviathan?.dune;
  const now = (G.meta.day || 1) * DAY_LENGTH + G.time * DAY_LENGTH;
  if (record?.bonded) {
    if (e) {
      if (G.riding === e) { UI.toast("Dismount before dismissing your Leviathan."); return true; }
      e.gone = true;
      record.recallAt = now + 12;
      saveNow(false);
      UI.toast("Your Leviathan returns beneath the dunes.");
      return true;
    }
    if (now < (record.recallAt || 0)) { UI.toast("The sands are still settling. Try the horn again shortly."); return true; }
    const site = safeDuneSummon(p);
    if (!site) { UI.toast("Find a wide, open stretch of sand before sounding the horn."); return true; }
    const bond = ents.add("leviathan_dune", site.x, site.y - 5, site.z, { hp: record.hp, tame: true, saddled: record.saddled });
    bond.emerged = true;
    bond.goal = { ...site, speed: 8 };
    bond.duneCycle = { step: "surface", site };
    bond.bondArrival = { ...site };
    applyBondPreferences(bond, record);
    record.recallAt = now + 12;
    saveNow(false);
    puff(site.x, site.y, site.z, "crumb");
    Sound.tone(130, 0.8, "triangle", 0.25, -40);
    return true;
  }
  if (G.creative || G.wset.difficulty === "peaceful") {
    UI.toast("Undertake the Dune rite in Survival with combat enabled.");
    return true;
  }
  const expansion = G.story.leviathan;
  const missing = RELIC_SITES.find(def => !hasDesertRelic(G, def) || (def.key === "shrine" && !expansion?.shrineRead));
  if (missing) {
    const site = expansion?.sites?.[missing.key];
    UI.toast(site ? `Seek the ${missing.name} near X ${site.x + 8}, Z ${site.z + 8}.` : `Seek the ${missing.name} in unexplored desert.`);
    return true;
  }
  if (!e && useObservatoryStorm()) return true;
  if (!e || !record) {
    const observatory = expansion?.sites?.observatory;
    UI.toast(observatory ? `Check the Great Dune Observatory near X ${observatory.x + 8}, Z ${observatory.z + 8} for the next Leviathan Storm.` :
      "Find a wild Dune Leviathan during a Leviathan Storm.");
    return true;
  }
  if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y, e.pos.z - p.pos.z) > 12 ||
      !duneRitualWindow(e.duneCycle, e.age)) {
    UI.toast("Wait for the Leviathan to rise, then sound the horn as the dust clears.");
    return true;
  }
  const cycle = e.duneCycle;
  cycle.ritualUsed = true;
  cycle.ritualMarks = (cycle.ritualMarks || 0) + 1;
  Sound.tone(130, 0.8, "triangle", 0.25, -40);
  if (cycle.ritualMarks < 3) {
    UI.toast(`The relics resonate (${cycle.ritualMarks}/3). Survive until it rises again.`, "good");
    return true;
  }
  record.bonded = true;
  record.hp = e.hp = e.maxHp;
  spawnDrop(I.LEVIATHAN_SCALE, 6, p.pos.x, p.pos.y + 0.5, p.pos.z);
  spawnDrop(I.LEVIATHAN_FANG, 1, p.pos.x, p.pos.y + 0.5, p.pos.z);
  e.tame = true; e.goal = null;
  e.bondBowAt = e.age;
  e.yaw = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
  applyBondPreferences(e, record);
  e.vel.x = e.vel.y = e.vel.z = 0;
  puff(e.pos.x, e.pos.y + 0.5, e.pos.z, "totem");
  Sound.tone(196, 0.9, "sine", 0.16, 65);
  saveNow(false);
  UI.toast("Legendary bond formed. The Dune Leviathan is yours!", "good");
  return true;
}
function useObsidianHorn() {
  if (G.dim !== "overworld" || G.spectator || G.riding) return false;
  const expansion = G.story.leviathan, site = expansion?.sites?.citadel;
  const p = G.player.pos, a = site && citadelArena(site);
  const nearCourt = a && Math.hypot(p.x - a.x, p.z - a.z) <= 18 && Math.abs(p.y - a.y) <= 3;
  const e = ents.list.find(e => e.sp === "leviathan_obsidian" && !e.gone && !e.dead && !e.duneCycle?.preview);
  const record = expansion?.obsidian;
  // Preserve the Citadel rite and ordinary Dune horn use. Crouching explicitly
  // selects the Obsidian bond away from its court, even with two active bonds.
  if (record?.bonded ? !nearCourt && !keys.has("KeyC") : !site || !nearCourt) return false;
  if (record?.defeated) return false;
  const now = (G.meta.day || 1) * DAY_LENGTH + G.time * DAY_LENGTH;
  if (record?.bonded) {
    if (e) {
      if (G.riding === e) UI.toast("Dismount before dismissing your Leviathan.");
      else { e.gone = true; record.recallAt = now + 12; saveNow(false); UI.toast("Your Obsidian Leviathan returns beneath the sands."); }
    } else if (now < (record.recallAt || 0)) UI.toast("The molten ground needs time to settle.");
    else {
      const body = SPECIES.leviathan_obsidian;
      const occupants = [G.player, ...ents.list];
      const arrival = nearCourt ? { x: a.x, y: a.y, z: a.z } : planDesertRecall(G.world, G.gen, G.player, body, occupants);
      const clear = arrival && (nearCourt ? clearRecallFootprint(G.world, arrival, body, occupants) : true);
      if (!clear) UI.toast(nearCourt ? "Step back and clear the Citadel's inner court and footing before recalling your Leviathan." : "Find wide, flat, untouched desert sand with open sky ahead. Keep clear of creatures and landmarks.");
      else {
        const bond = ents.add("leviathan_obsidian", arrival.x, arrival.y - 5, arrival.z, { hp: record.hp, tame: true, saddled: record.saddled });
        bond.emerged = true; bond.goal = { ...arrival, speed: 8 }; bond.bondArrival = { ...arrival };
        bond.duneCycle = { site: arrival, step: "surface" };
        applyBondPreferences(bond, record);
        record.recallAt = now + 12;
        saveNow(false);
        puff(arrival.x, arrival.y, arrival.z, "crumb");
        Sound.mob("rumble", 0);
        Sound.tone(90, 0.9, "triangle", 0.2, -30);
      }
    }
    return true;
  }
  if (!e || !record) { UI.toast("Enter the inner court to awaken the Obsidian Leviathan."); return true; }
  if (G.creative || G.wset.difficulty === "peaceful") {
    UI.toast("Undertake the Inferno rite in Survival with combat enabled."); return true;
  }
  if (!expansion.dune?.bonded) { UI.toast("Earn the Dune Leviathan's bond before attempting the Inferno rite."); return true; }
  if (!obsidianRiteInReach(e, G.player) || !lineOfSight(G.world,
      { x: p.x, y: p.y + G.player.eye, z: p.z }, { x: e.pos.x, y: e.pos.y + 1.5, z: e.pos.z })) {
    UI.toast("Approach the awakened Leviathan on the arena floor with a clear view."); return true;
  }
  if (!record.ritualOffered) {
    const offerings = OBSIDIAN_OFFERINGS;
    if (!offerings.every(([id, n]) => G.inv.count(id) >= n)) {
      UI.toast(`The Inferno rite needs ${OBSIDIAN_OFFERING_TEXT}.`);
      return true;
    }
    for (const [id, n] of offerings) G.inv.remove(id, n);
    record.ritualOffered = true; G.hudDirty = true;
    e.duneCycle.ritualMarks = 0; e.duneCycle.ritualUsed = true;
    saveNow(false);
    UI.toast("Offering accepted. After each of the next four attacks, sound the horn while its veins dim.");
    return true;
  }
  const c = e.duneCycle;
  if (!obsidianRitualWindow(e)) {
    UI.toast("Wait for its molten veins to dim, then sound the horn nearby.");
    return true;
  }
  c.ritualUsed = true; c.ritualMarks = (c.ritualMarks || 0) + 1;
  Sound.tone(90 + c.ritualMarks * 16, 0.8, "triangle", 0.25, -30);
  if (c.ritualMarks < 4) UI.toast(`The Inferno rite answers (${c.ritualMarks}/4).`, "good");
  else {
    record.bonded = true; record.hp = e.hp = e.maxHp;
    for (const [id, n] of [[I.OBSIDIAN_SCALE, 6], [I.MOLTEN_HEART, 1], [I.INFERNO_FANG, 1], [I.VOLCANIC_ESSENCE, 3]]) {
      spawnDrop(id, n, p.x, p.y + 0.5, p.z);
    }
    e.tame = true; e.goal = null; e.vel.x = e.vel.y = e.vel.z = 0;
    applyBondPreferences(e, record);
    saveNow(false);
    UI.toast("Legendary bond formed. The Obsidian Leviathan is yours!", "good");
  }
  return true;
}
G.leviathanBondStatus = key => {
  if (!Object.prototype.hasOwnProperty.call(LEVIATHAN_BONDS, key)) return "";
  const def = LEVIATHAN_BONDS[key];
  if (!def) return "";
  const actor = ents.list.find(e => e.sp === def.species && e.tame && !e.gone && !e.dead && !e.duneCycle?.preview);
  return !actor ? "Resting beneath the sands" : actor.ridden ? "Riding" : actor.bondArrival ? actor.goal ? "Emerging" : "Emergence blocked · clear the surface" :
    actor.bondCommand === "follow" ? actor.goal ? "Following" : "Following · waiting for a clear route" : "Waiting";
};
G.setLeviathanBond = (key, action, value) => {
  if (!Object.prototype.hasOwnProperty.call(LEVIATHAN_BONDS, key)) return false;
  const def = LEVIATHAN_BONDS[key];
  if (!def) return false;
  const record = G.story.leviathan?.[key];
  try {
    if (!updateBondPreference(record, action, value)) return false;
  } catch (error) { UI.toast(error.message); return false; }
  const actor = ents.list.find(e => e.sp === def.species && e.tame && !e.gone && !e.dead && !e.duneCycle?.preview);
  if (actor) {
    applyBondPreferences(actor, record);
    if (action !== "name" && !actor.ridden && !actor.bondArrival) {
      actor.goal = null; actor.vel.x = actor.vel.y = actor.vel.z = 0;
    }
  }
  UI.toast(action === "name" ? "Leviathan name saved." : actor?.ridden ? "Command saved. It takes effect after dismounting." : action === "follow" ? "Your Leviathan will follow where the surface is clear." : "Your Leviathan will wait here.");
  G.hudDirty = true;
  saveNow(true);
  return true;
};
function safeDuneSummon(p) {
  return planDesertRecall(G.world, G.gen, p, SPECIES.leviathan_dune, [p, ...ents.list]);
}
function updateDuneSurfaceAttack(e, phase, multiplier) {
  const c = e.duneCycle, p = G.player.pos;
  if (c.attack?.phase === 4 && e.goal && Math.hypot(e.goal.x - e.pos.x, (e.goal.y ?? e.pos.y) - e.pos.y, e.goal.z - e.pos.z) < 0.6) {
    e.goal = null; e.vel.x = e.vel.y = e.vel.z = 0;
  }
  if (e.age < c.attackAt) return;
  if (!c.attack) {
    const s = sandEncounterSite(p.x, p.z);
    c.attackAt = c.until;
    const activeWindow = phase === 2 ? DUNE_SWEEP_DURATION : phase === 4 ? DUNE_DEVOUR_DURATION : 0;
    if (!s || Math.abs(p.y - s.y) > 2 || c.until - e.age < Math.max(1.5, 1.25 + activeWindow + 0.15)) return;
    c.attack = { ...s, phase, from: e.age };
    if (phase === 2) c.attack.sweep = new DuneSweep(e);
    if (phase === 4) c.attack.devour = new DuneDevour(e);
    c.attackAt = e.age + 1.25;
    if (phase === 4) {
      const dx = s.x - e.pos.x, dz = s.z - e.pos.z, distance = Math.hypot(dx, dz);
      e.goal = distance > 2.5 ? { x: s.x - dx / distance * 2.2, y: s.y - 0.4, z: s.z - dz / distance * 2.2, speed: 5 } :
        Math.abs(e.pos.y - (s.y - 0.4)) > 0.6 ? { x: e.pos.x, y: s.y - 0.4, z: e.pos.z, speed: 5 } : null;
      if (!e.goal) e.vel.x = e.vel.y = e.vel.z = 0;
    }
    puff(s.x, s.y + 0.5, s.z, "crumb");
    return;
  }
  const s = c.attack;
  puff(s.x, s.y + 0.7, s.z, "crumb");
  if (s.phase === 2) {
    c.sweep = s.sweep; c.sweep?.release();
  } else if (s.phase === 3) {
    c.vortex = new DuneVortex(s);
  } else if (s.phase === 4) {
    c.devour = s.devour; c.devour?.release();
    e.goal = null; if (e.vel) e.vel.x = e.vel.y = e.vel.z = 0;
  }
  c.attackAt = Infinity;
  c.attack = null;
}
let ancientFuryFX=[];
function clearAncientFury(){
  for(const fx of ancientFuryFX){fx.point.warned=false;fx.view?.dispose();}ancientFuryFX=[];
}
function ancientFuryReview(){
  return ancientFuryFX.map(fx=>({active:!!fx.view,x:fx.cue.x,y:fx.cue.y,z:fx.cue.z,radius:fx.cue.radius,
    deadline:fx.cue.deadline,progress:fx.cue.progress,triangles:fx.view?.triangles||0}));
}
function updateAncientFury(){
  const actor=G.dim===HOLLOW_SANDS&&!G.creative&&!G.spectator&&G.state!=="dead"&&G.wset.difficulty!=="peaceful"&&
    ents.list.find(e=>e.sp==="leviathan_ancient"&&e.mesh&&!e.dead&&!e.gone&&!e.tame&&!e.duneCycle?.preview);
  const cues=actor?ancientFuryCues(actor):[];
  if(!cues.length){clearAncientFury();return;}
  const now=G.clock||0;
  if(cues.length!==ancientFuryFX.length||cues.some((cue,i)=>{
    const fx=ancientFuryFX[i];return fx?.actor!==actor||fx.point!==cue.point||
      (fx.edits!==G.world.editCount||fx.loadedKey!==ancientWarningLoadedKey(G.world,cue))&&now-fx.builtAt>=.2;
  })){
    clearAncientFury();ancientFuryFX=cues.map(cue=>({actor,point:cue.point,cue,edits:G.world.editCount,
      loadedKey:ancientWarningLoadedKey(G.world,cue),builtAt:now,view:createAncientWarningView(scene,G.world,cue)}));
  }
  ancientFuryFX.forEach((fx,i)=>{fx.cue=cues[i];fx.point.warned=!!fx.view;
    fx.view?.update(cues[i].progress,G.settings.reducedMotion);});
}
let ancientIntroView = null;
let ancientTremorRoll = 0;
const ancientBuriedView = createAncientBuriedController(scene);
const ancientOpeningView = createAncientOpeningController(scene);
function updateAncientPresentation(running) {
  const actor = running && G.state !== "dead" && G.dim === HOLLOW_SANDS &&
    !G.creative && !G.spectator && G.wset.difficulty !== "peaceful" &&
    ents.list.find(e => e.sp === "leviathan_ancient" && !e.dead && !e.gone &&
      !e.tame && e.duneCycle && !e.duneCycle.preview);
  Sound.ancientMusic(actor ? { id: actor.uid, age: actor.age, phase: ancientPhase(actor) } : null);
  const cue = actor && G.state === "play" ? ancientIntroCue(actor) : null;
  if (cue && !ancientIntroView) ancientIntroView = createAncientIntroView(document.getElementById("hud"));
  ancientIntroView?.update(cue, G.settings.reducedMotion);
  ancientTremorRoll = G.state === "play" && !G.thirdPerson && !G.cutscene
    ? ancientAwakeningRoll(actor, G.player.pos, G.settings.reducedMotion) : 0;
  camera.rotation.z += ancientTremorRoll;
  const awakeningActor = ancientArrivalFX.find(fx => fx.cue.type === "awakening")?.actor;
  const awakeningOptions = { fast:G.settings.quality === "fast", reducedMotion:G.settings.reducedMotion, now:G.clock || 0 };
  ancientBuriedView.update(awakeningActor, G.world, awakeningOptions);
  ancientOpeningView.update(awakeningActor, G.world, awakeningOptions);
}
let ancientArrivalFX = [];
function clearAncientArrival() {
  for (const fx of ancientArrivalFX) { fx.point.warned = false; fx.view?.dispose();fx.sand?.dispose();fx.arena?.dispose(); }
  ancientArrivalFX = [];
}
function ancientArrivalReview() {
  return ancientArrivalFX.map(fx => ({active:!!fx.view,type:fx.cue.type,x:fx.cue.x,y:fx.cue.y,z:fx.cue.z,
    radius:fx.cue.radius,deadline:fx.cue.deadline,progress:fx.cue.progress,triangles:fx.view?.triangles || 0,
    sandColumns:fx.sand?.columns||0,sandGrains:fx.sand?.grains||0,sandTriangles:fx.sand?.triangles||0,
    sandVisible:fx.sand?.mesh.visible||false,arenaGlyphs:fx.arena?.glyphs||0,
    arenaTriangles:fx.arena?.triangles||0,arenaVisible:fx.arena?.mesh.visible||false}));
}
function updateAncientArrival() {
  const actor = G.dim === HOLLOW_SANDS && !G.creative && !G.spectator && G.state !== "dead" && G.wset.difficulty !== "peaceful" &&
    ents.list.find(e => e.sp === "leviathan_ancient" && e.mesh && !e.dead && !e.gone && !e.tame && !e.duneCycle?.preview);
  const cues = actor ? ancientArrivalCues(actor) : [];
  if (!cues.length) { clearAncientArrival(); return; }
  const now = G.clock || 0,fast=G.settings.quality==="fast";
  for(const cue of cues)cue.arenaLoadedKey=cue.type==="awakening"?ancientArenaLoadedKey(G.world,actor.duneCycle.site,fast):0;
  // Awakening: countdown, ceiling sand and one small arena glyph batch.
  if (cues.length !== ancientArrivalFX.length || cues.some((cue,i) => {
    const fx = ancientArrivalFX[i];
    return fx?.actor !== actor || fx.point !== cue.point ||fx.fast!==fast||
      (fx.edits !== G.world.editCount || fx.loadedKey !== ancientWarningLoadedKey(G.world,cue) ||
        fx.arenaLoadedKey!==cue.arenaLoadedKey) && now-fx.builtAt >= .2;
  })) {
    clearAncientArrival();
    ancientArrivalFX = cues.map(cue => ({actor,point:cue.point,cue,builtAt:now,fast,edits:G.world.editCount,
      loadedKey:ancientWarningLoadedKey(G.world,cue),view:createAncientWarningView(scene,G.world,cue),
      sand:cue.type==="awakening"?createAncientAwakeningView(scene,G.world,cue,fast):null,
      arenaLoadedKey:cue.arenaLoadedKey,
      arena:cue.type==="awakening"?createAncientArenaView(scene,G.world,actor.duneCycle.site,fast):null}));
  }
  ancientArrivalFX.forEach((fx,i) => {
    fx.cue = cues[i]; fx.point.warned = !!fx.view;
    fx.view?.update(cues[i].progress,G.settings.reducedMotion);
    fx.sand?.update(cues[i].progress,G.settings.reducedMotion);
    fx.arena?.update(cues[i].progress,G.settings.reducedMotion,fx.arenaLoadedKey===cues[i].arenaLoadedKey);
  });
}
let ancientWarningFX = null;
function clearAncientWarning() {
  if (ancientWarningFX?.attack) ancientWarningFX.attack.warned = false;
  for (const fx of ancientWarningFX?.collapses || []) { fx.point.warned = false; fx.view?.dispose(); }
  ancientWarningFX?.view?.dispose(); ancientWarningFX = null;
}
function ancientWarningReview() {
  return ancientWarningFX ? { active:!!ancientWarningFX.view, ...ancientWarningFX.cue,
    triangles:ancientWarningFX.view?.triangles || 0,
    collapses:(ancientWarningFX.collapses || []).map(fx => ({active:!!fx.view,x:fx.cue.x,y:fx.cue.y,z:fx.cue.z,
      radius:fx.cue.radius,progress:fx.cue.progress,triangles:fx.view?.triangles || 0})) } : {active:false};
}
function updateAncientWarning() {
  const actor = G.dim === HOLLOW_SANDS && !G.creative && !G.spectator && G.state !== "dead" && G.wset.difficulty !== "peaceful" &&
    ents.list.find(e => e.sp === "leviathan_ancient" && e.mesh && !e.dead && !e.gone && !e.tame && !e.duneCycle?.preview);
  const cue = actor && ancientWarningCue(actor);
  if (!cue) { clearAncientWarning(); return; }
  const attack = actor.duneCycle.attack, now = G.clock || 0, collapses = ancientCollapseCues(actor),
    loadedKey = [cue,...collapses].map(c => ancientWarningLoadedKey(G.world,c)).join(':');
  if (!ancientWarningFX || ancientWarningFX.actor !== actor || ancientWarningFX.attack !== attack ||
      (ancientWarningFX.edits !== G.world.editCount || ancientWarningFX.loadedKey !== loadedKey) && now-ancientWarningFX.builtAt >= .2) {
    clearAncientWarning();
    ancientWarningFX = {actor,attack,cue,loadedKey,edits:G.world.editCount,builtAt:now,
      view:createAncientWarningView(scene,G.world,cue),
      collapses:collapses.map(c => ({point:c.point,cue:c,view:createAncientWarningView(scene,G.world,c)}))};
  }
  ancientWarningFX.cue = cue; attack.warned = !!ancientWarningFX.view;
  ancientWarningFX.view?.update(cue.progress,G.settings.reducedMotion);
  for (const fx of ancientWarningFX.collapses) {
    fx.cue.progress = cue.progress; fx.point.warned = !!fx.view;
    fx.view?.update(cue.progress,G.settings.reducedMotion);
  }
}
let obsidianWarningFX = null;
function clearObsidianWarning() {
  if (obsidianWarningFX?.attack) obsidianWarningFX.attack.warned = false;
  obsidianWarningFX?.view?.dispose(); obsidianWarningFX = null;
}
function obsidianWarningReview() {
  return obsidianWarningFX ? { active: !!obsidianWarningFX.view, ...obsidianWarningFX.cue,
    triangles: obsidianWarningFX.view?.triangles || 0, paths: obsidianWarningFX.view?.paths } : { active: false };
}
let obsidianVentFX = null;
function clearObsidianVentWarning() {
  obsidianVentFX?.view?.dispose();
  obsidianVentFX = null;
}
function updateObsidianVentWarning(actor) {
  const c = actor?.duneCycle;
  if (!c?.vent || c.step !== "warning" && c.step !== "vent-rise") { clearObsidianVentWarning(); return; }
  if (obsidianVentFX?.actor !== actor) {
    clearObsidianVentWarning();
    obsidianVentFX = { actor, dustAt: 0, view: createObsidianWarningView(scene, G.world,
      { ...c.vent, type: "eruption", radius: 4.4 }) };
  }
  const progress = c.step === "warning" ? Math.min(1, actor.age / c.until) : 1;
  obsidianVentFX.view?.update(progress, G.settings.reducedMotion);
  if (G.state !== "play" || G.settings.reducedMotion || actor.age < obsidianVentFX.dustAt) return;
  const fancy = G.settings.quality === "fancy";
  obsidianVentFX.dustAt = actor.age + (fancy ? 0.12 : 0.22);
  for (let i = 0; i < (fancy ? 3 : 1) && parts.length < PMAX - 16; i++) {
    const angle = Math.random() * Math.PI * 2, radial = Math.random() * 2;
    const x = Math.cos(angle), z = Math.sin(angle);
    emitParticle(c.vent.x + x * radial, c.vent.y - 1, c.vent.z + z * radial,
      x * 0.75, 2.4 + progress * 2.4, z * 0.75, 0.9, i === 1 ? PUFF_COLORS.ash : PUFF_COLORS.ember, true);
  }
}
function updateObsidianWarning() {
  const actor = G.dim === "overworld" && !G.creative && !G.spectator && G.state !== "dead" && G.wset.difficulty !== "peaceful" &&
    ents.list.find(e => e.sp === "leviathan_obsidian" && e.mesh && !e.dead && !e.gone && !e.tame && !e.duneCycle?.preview);
  updateObsidianVentWarning(actor);
  const cue = actor && obsidianWarningCue(actor);
  if (!cue) { clearObsidianWarning(); return; }
  const attack = actor.duneCycle.attack, now = G.clock || 0;
  const loadedKey = cue.type === "shrapnel" ? obsidianVolleyLoadedKey(G.world, cue.volley) : null;
  if (!obsidianWarningFX || obsidianWarningFX.actor !== actor || obsidianWarningFX.attack !== attack ||
      (obsidianWarningFX.edits !== G.world.editCount || obsidianWarningFX.loadedKey !== loadedKey) && now - obsidianWarningFX.builtAt >= .2) {
    clearObsidianWarning();
    obsidianWarningFX = { actor, attack, cue, loadedKey, edits: G.world.editCount, builtAt: now,
      view: createObsidianWarningView(scene, G.world, cue) };
  }
  obsidianWarningFX.cue = cue;
  attack.warned = !!obsidianWarningFX.view;
  obsidianWarningFX.view?.update(cue.progress, G.settings.reducedMotion);
}
let duneWarningFX = null;
function clearDuneWarning() {
  duneWarningFX?.view?.dispose(); duneWarningFX = null;
}
function duneWarningReview() {
  return duneWarningFX ? { active: !!duneWarningFX.view, ...duneWarningFX.cue } : { active: false };
}
function updateDuneWarning() {
  const actor = G.dim === "overworld" && !G.creative && !G.spectator && G.state !== "dead" && G.wset.difficulty !== "peaceful" &&
    ents.list.find(e => e.sp === "leviathan_dune" && e.mesh && !e.dead && !e.gone && !e.tame && !e.duneCycle?.preview);
  const cue = actor && duneWarningCue(actor);
  if (!cue) { clearDuneWarning(); return; }
  const now = G.clock || 0, fast = G.settings.quality === "fast";
  if (!duneWarningFX || duneWarningFX.actor !== actor || duneWarningFX.fast !== fast || duneWarningFX.cue.type !== cue.type || duneWarningFX.cue.deadline !== cue.deadline ||
      duneWarningFX.edits !== G.world.editCount && now - duneWarningFX.builtAt >= 0.2) {
    clearDuneWarning();
    duneWarningFX = { actor, cue, fast, edits: G.world.editCount, builtAt: now, view: createDuneWarningView(scene, G.world, cue, fast) };
  }
  duneWarningFX.cue = cue;
  duneWarningFX.view?.update(cue.progress, G.settings.reducedMotion);
}
let duneSweepFX = null;
function clearDuneSweep() {
  duneSweepFX?.view.dispose(); duneSweepFX = null;
  for (const e of ents.list) if (e.sp === "leviathan_dune" && e.duneCycle) {
    delete e.duneCycle.sweep;
    if (e.duneCycle.attack) delete e.duneCycle.attack.sweep;
  }
}
function duneSweepReview() {
  if (!duneSweepFX) return { active: false };
  const { record, actor } = duneSweepFX;
  return { active: true, released: record.released, age: record.age, spent: record.spent,
    parts: record.parts.filter(p => p.visible).length,
    progress: record.released ? 1 : Math.max(0, Math.min(1, (actor.age - (actor.duneCycle.attack?.from ?? actor.age)) / 1.25)) };
}
function updateDuneSweep(dt, running) {
  if (G.dim !== "overworld" || G.creative || G.spectator || G.state === "dead" || G.wset.difficulty === "peaceful") { clearDuneSweep(); return; }
  const actor = ents.list.find(e => e.sp === "leviathan_dune" && e.mesh && !e.dead && !e.gone && !e.tame && e.emerged &&
    e.duneCycle?.step === "surface" && !e.duneCycle.preview && G.world.isLoaded(e.pos.x, e.pos.z) && G.world.isLoaded(G.player.pos.x, G.player.pos.z) && (e.duneCycle.attack?.sweep || e.duneCycle.sweep));
  const record = actor && (actor.duneCycle.attack?.sweep || actor.duneCycle.sweep);
  if (!(record instanceof DuneSweep) || !record.active) { clearDuneSweep(); return; }
  if (duneSweepFX?.record !== record) {
    duneSweepFX?.view.dispose(); duneSweepFX = null;
    const view = createDuneSweepView(scene, record);
    if (!view) { clearDuneSweep(); return; }
    duneSweepFX = { actor, record, view };
  }
  if (record.sample(actor, G.player, G.world, lineOfSight, dt, running)) {
    const multiplier = { easy: 0.67, normal: 1, hard: 1.5 }[G.wset.difficulty] ?? 1;
    hurt(5 * multiplier, "The Dune Leviathan's sweeping body caught you.", actor, false, "sand", false, record.contact);
  }
  if (!record.active) { clearDuneSweep(); return; }
  duneSweepFX?.view.update(duneSweepReview().progress, record.released);
}
let duneDevourFX = null;
function clearDuneDevour() {
  duneDevourFX?.view.dispose(); duneDevourFX = null;
  for (const e of ents.list) if (e.sp === "leviathan_dune" && e.duneCycle) {
    delete e.duneCycle.devour;
    if (e.duneCycle.attack) delete e.duneCycle.attack.devour;
  }
}
function duneDevourReview() {
  if (!duneDevourFX) return { active: false };
  const { record, actor } = duneDevourFX;
  return { active: true, released: record.released, age: record.age, spent: record.spent,
    visible: record.visible,
    progress: record.released ? 1 : Math.max(0, Math.min(1, (actor.age - (actor.duneCycle.attack?.from ?? actor.age)) / 1.25)) };
}
function updateDuneDevour(dt, running) {
  if (G.dim !== "overworld" || G.creative || G.spectator || G.state === "dead" || G.wset.difficulty === "peaceful") { clearDuneDevour(); return; }
  const actor = ents.list.find(e => e.sp === "leviathan_dune" && e.mesh && !e.dead && !e.gone && !e.tame && e.emerged &&
    e.duneCycle?.step === "surface" && !e.duneCycle.preview && G.world.isLoaded(e.pos.x, e.pos.z) && G.world.isLoaded(G.player.pos.x, G.player.pos.z) && (e.duneCycle.attack?.devour || e.duneCycle.devour));
  const record = actor && (actor.duneCycle.attack?.devour || actor.duneCycle.devour);
  if (!(record instanceof DuneDevour) || !record.active) { clearDuneDevour(); return; }
  if (duneDevourFX?.record !== record) {
    duneDevourFX?.view.dispose(); duneDevourFX = null;
    const view = createDuneDevourView(scene, record);
    if (!view) { clearDuneDevour(); return; }
    duneDevourFX = { actor, record, view };
  }
  if (record.sample(actor, G.player, G.world, lineOfSight, dt, running)) {
    const multiplier = { easy: 0.67, normal: 1, hard: 1.5 }[G.wset.difficulty] ?? 1;
    hurt(7 * multiplier, "The Dune Leviathan's devouring jaws caught you.", actor, false, "sand", false, record.contact);
  }
  if (!record.active) { clearDuneDevour(); return; }
  duneDevourFX?.view.update(duneDevourReview().progress, record.released);
}
let duneVortexFX = null;
function clearDuneVortexView() { duneVortexFX?.view?.dispose(); duneVortexFX = null; }
function clearDuneVortex() {
  clearDuneVortexView();
  for (const e of ents.list) if (e.sp === "leviathan_dune" && e.duneCycle) delete e.duneCycle.vortex;
}
function duneVortexEnabled() {
  return G.dim === "overworld" && !G.creative && !G.spectator && G.state !== "dead" && G.wset.difficulty !== "peaceful";
}
function duneVortexOwner(e) {
  return e.sp === "leviathan_dune" && e.mesh && !e.dead && !e.gone && !e.tame && !e.duneCycle?.preview;
}
function duneVortexDrag(input) {
  const fx = duneVortexFX;
  if (!fx || !duneVortexEnabled() || !duneVortexOwner(fx.actor) || !validDuneVortexSite(G.world, fx.record.site)) return;
  if (insideDuneVortex(fx.record, G.player, G.world, lineOfSight))
    input.walkMul = (input.walkMul ?? 1) * duneVortexSpeed(leviathanSetPieces("sand"));
}
function duneVortexReview() {
  return duneVortexFX ? { active: true, age: duneVortexFX.record.age, ticks: duneVortexFX.record.ticks,
    nextAt: duneVortexFX.record.nextAt, radius: DUNE_VORTEX_RADIUS, site: { ...duneVortexFX.record.site },
    inside: duneVortexFX.inside, factor: duneVortexFX.inside ? duneVortexSpeed(leviathanSetPieces("sand")) : 1 } : { active: false };
}
function updateDuneVortex(dt, running) {
  if (!duneVortexEnabled()) { clearDuneVortex(); return; }
  let actor = null, record = null;
  for (const e of ents.list) {
    const v = e.duneCycle?.vortex;
    if (!v) continue;
    if (!duneVortexOwner(e) || !(v instanceof DuneVortex) || !v.active || !validDuneVortexSite(G.world, v.site)) {
      delete e.duneCycle.vortex; continue;
    }
    if (!actor) { actor = e; record = v; }
    else delete e.duneCycle.vortex; // Only one active boss vortex is ever simulated.
  }
  if (!record) { clearDuneVortexView(); return; }
  const fast = G.settings.quality === "fast", now = G.clock || 0;
  if (!duneVortexFX || duneVortexFX.record !== record || duneVortexFX.fast !== fast ||
      duneVortexFX.edits !== G.world.editCount && now - duneVortexFX.builtAt >= 0.2) {
    const inside = duneVortexFX?.record === record && duneVortexFX.inside;
    clearDuneVortexView();
    const view = createDuneVortexView(scene, G.world, record.site, fast);
    if (!view) { delete actor.duneCycle.vortex; return; }
    duneVortexFX = { actor, record, view, fast, edits: G.world.editCount, builtAt: now, inside };
  }
  const inside = insideDuneVortex(record, G.player, G.world, lineOfSight);
  duneVortexFX.inside = inside;
  if (running) {
    const strike = record.step(dt, inside);
    if (!record.active) { clearDuneVortex(); return; }
    if (strike) {
      const multiplier = { easy: 0.67, normal: 1, hard: 1.5 }[G.wset.difficulty] ?? 1;
      hurt(DUNE_VORTEX_DAMAGE * multiplier, "The Dune Leviathan's sand vortex overwhelmed you. Leave the amber ring.", actor, false, "sand", true);
    }
  }
  duneVortexFX?.view.update(record.age, G.settings.reducedMotion);
}
function updateStormVortex(dt) {
  if (stormStage < 3 || G.creative || G.spectator || G.wset.difficulty === "peaceful") {
    stormVortex = null; stormVortexT = 10;
    return;
  }
  const p = G.player.pos;
  if (!stormVortex) {
    if ((stormVortexT -= dt) > 0) return;
    stormVortexT = 12;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.floor(p.x + Math.cos(angle) * 6), z = Math.floor(p.z + Math.sin(angle) * 6);
    if (!G.world.chunkAt(x, z) || G.gen.column(x, z).biome !== "sandy") return;
    const ground = G.world.surfaceY(x, z);
    if (G.world.id(x, ground, z) !== B.SAND || Math.abs(ground + 1 - p.y) > 3) return;
    stormVortex = { x: x + 0.5, y: ground + 1, z: z + 0.5, age: 0, dustT: 0 };
    UI.toast("A sand vortex is forming nearby. Keep clear!");
  }
  const v = stormVortex;
  v.age += dt;
  if ((v.dustT -= dt) <= 0 && parts.length < PMAX - 24) {
    v.dustT = G.settings.reducedMotion ? 0.35 : 0.12;
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3 + (G.settings.reducedMotion ? 0 : v.age * 3);
      const dx = Math.cos(angle), dz = Math.sin(angle);
      emitParticle(v.x + dx * 1.8, v.y + 0.3 + i * 0.32, v.z + dz * 1.8,
        G.settings.reducedMotion ? 0 : -dz, 0.35, G.settings.reducedMotion ? 0 : dx, 0.4, STORM_DUST, true);
    }
  }
  if (v.age >= 2.2) {
    if (Math.abs(p.y - v.y) < 2.5 && Math.hypot(p.x - v.x, p.z - v.z) < 2) {
      hurt(3, "A sand vortex swept you off your feet.", null, false, "sand");
    }
    stormVortex = null;
  }
}
function updateObsidianAsh(dt) {
  if ((badlandsAshT -= dt) > 0) return;
  badlandsAshT = G.settings.quality === "fancy" ? 0.08 : 0.16;
  badlandsAsh = 0;
  const p = G.player;
  if (G.dim !== "overworld" || p.headInWater || p.inLava) return;
  const edge = obsidianAshStrength(G.story.leviathan?.sites?.citadel, p.pos.x, p.pos.z);
  if (!edge || p.pos.y < G.gen.column(Math.floor(p.pos.x), Math.floor(p.pos.z)).h - 2) return;
  const gust = Math.max(0, Math.sin((G.time + 0.18) * Math.PI * 4));
  badlandsAsh = edge * (0.18 + gust * 0.82);
  if (G.settings.reducedMotion || parts.length >= PMAX - 16 || Math.random() > badlandsAsh) return;
  emitParticle(p.pos.x + (Math.random() - 0.5) * 22, p.pos.y + 1 + Math.random() * 5,
    p.pos.z + (Math.random() - 0.5) * 22, 2 + gust * 3, -0.35, 0.7,
    1.8, Math.random() < 0.16 ? PUFF_COLORS.ember : PUFF_COLORS.ash, true);
}
function updateSandstorm(dt) {
  const p = G.player;
  if (G.dim !== "overworld" || p.headInWater || p.inLava) {
    // Quiet exits must not carry a nearly-complete attraction back into a storm.
    duneInterest = 0;
    stormStage = 0; stormSampleT = 0;
    stormVortex = null; stormVortexT = 10;
    stormActivity.reset(); stormActivityElapsed = 0;
    Sound.wind(G.dim === HOLLOW_SANDS && hollowDrift > 0 ? 1 : 0);
    return;
  }
  stormActivityElapsed += dt;
  if ((stormSampleT -= dt) <= 0) {
    stormSampleT = 0.25;
    const natural = sandstormStage(G.gen.seed, G.meta.day || 1, G.time);
    const x = Math.floor(p.pos.x), z = Math.floor(p.pos.z);
    const exposed = G.world.chunkAt(x, z) && G.gen.column(x, z).biome === "sandy" &&
      p.pos.y >= G.world.surfaceY(x, z) + 0.5;
    const called = stormCallStatus(G.story.leviathan?.stormCall, worldSeconds());
    const enabled = !!exposed && G.state === "play" && !G.creative && !G.spectator && !p.flying && !G.riding &&
      G.wset.difficulty !== "peaceful" && stormDaytime(G.time);
    const activityReady = called.ready && natural < 4;
    const combatInput = enabled && activityReady &&
      (G.bowT >= 0 || G.blocking || p.hurtT > 0 || (mouseL && !!entityTarget()?.def.hostile));
    const source = stormActivity.step(stormActivityElapsed, { enabled, ready: activityReady,
      sprinting: p.onGround && !p.crouch && (keys.has("ShiftLeft") || keys.has("ShiftRight")) && Math.hypot(p.vel.x,p.vel.z)>4.8,
      severalHostiles: combatInput && severalHostilesNearby(ents.list,p.pos), combatInput });
    stormActivityElapsed = 0;
    if (source) callDesertStorm(source);
    const stage = G.creative && creativeStormUntil > G.clock ? 4 :
      Math.max(natural, !G.creative && !G.spectator && G.wset.difficulty !== "peaceful" ?
        stormCallStatus(G.story.leviathan?.stormCall, worldSeconds()).stage : 0);
    const next = exposed ? stage : 0;
    if (next === 4 && stormStage !== 4 && !G.creative) {
      UI.toast("Something ancient stirs beneath the sands…");
      Sound.mob("rumble", 0);
    }
    stormStage = next;
  }
  Sound.wind(stormStage || (ML.windy() || CA.windy() ? 1 : 0));   // (the Grand Desert Temple's platform is breezy)
  updateDuneEncounter(dt);
  if (!stormStage || G.settings.reducedMotion || (stormDustT -= dt) > 0) return;
  stormDustT = G.settings.quality === "fast" ? 0.15 : 0.09;
  if (parts.length >= PMAX - 24) return;
  emitParticle(p.pos.x + (Math.random() - 0.5) * 18, p.pos.y + Math.random() * 4,
    p.pos.z + (Math.random() - 0.5) * 18, 5 + stormStage * 2, 0.15, 1,
    0.45 + stormStage * 0.12, STORM_DUST, true);
}

let quicksand = null, quicksandSampleT = 0, quicksandEditCount = -1;
function clearQuicksand() {
  quicksand?.view.dispose(); quicksand = null; quicksandSampleT = 0; quicksandEditCount = -1;
}
function quicksandReview() {
  return quicksand ? { active: true, site: { ...quicksand.site, floors: quicksand.site.floors.map(f => [...f]) }, depth: quicksand.clock.depth,
    factor: quicksand.clock.factor, inside: quicksand.inside } : { active: false };
}
function updateQuicksand(dt, running, input = null) {
  if (G.dim !== HOLLOW_SANDS || G.creative || G.spectator || G.state === "dead" || G.wset.difficulty === "peaceful") {
    clearQuicksand(); return;
  }
  if (running) {
    quicksandSampleT -= dt;
    if (quicksandSampleT <= 0 || quicksandEditCount !== G.world.editCount) {
      const site = findQuicksandSite(G.world, G.player.pos);
      if (site?.key !== quicksand?.site.key) {
        clearQuicksand();
        if (site) quicksand = { site, clock: new QuicksandDrag(), inside: false, view: createQuicksandView(scene, site) };
      }
      quicksandSampleT = 0.4; quicksandEditCount = G.world.editCount;
    }
    if (quicksand) {
      const inside = insideQuicksand(quicksand.site, G.player) && !input?.jump;
      if (inside && !quicksand.inside) UI.toast("Soft sand! Keep moving or jump to escape.");
      quicksand.inside = inside; quicksand.clock.step(dt, inside);
      if (input && inside) input.walkMul = (input.walkMul ?? 1) * quicksand.clock.factor;
    }
  }
  if (quicksand) quicksand.view.update(quicksand.clock.age, quicksand.clock.depth, G.settings.reducedMotion);
}
let sandsHeat = null, heatSampleT = 0, heatEditCount = -1;
function clearSandsHeat() {
  sandsHeat?.view.dispose(); sandsHeat = null; heatSampleT = 0; heatEditCount = -1;
}
function heatReview() {
  return sandsHeat ? { active: true, site: { ...sandsHeat.site, floors: sandsHeat.site.floors.map(f => [...f]) },
    elapsed: sandsHeat.clock.elapsed, ticks: sandsHeat.clock.ticks, inside: sandsHeat.inside } : { active: false };
}
function updateSandsHeat(dt, running) {
  if (G.dim !== HOLLOW_SANDS || G.creative || G.spectator || G.state === "dead" || G.wset.difficulty === "peaceful") {
    clearSandsHeat(); return;
  }
  if (running) {
    heatSampleT -= dt;
    if (heatSampleT <= 0 || heatEditCount !== G.world.editCount) {
      const site = findHeatSite(G.world, G.player.pos);
      if (site?.key !== sandsHeat?.site.key) {
        clearSandsHeat();
        if (site) sandsHeat = { site, clock: new HeatExposure(), inside: false, view: createHeatView(scene, site) };
      }
      heatSampleT = 0.4; heatEditCount = G.world.editCount;
    }
    if (sandsHeat) {
      const { site, clock } = sandsHeat, inside = insideHeat(site, G.player);
      if (inside && !sandsHeat.inside) UI.toast("Scorching ground! Leave the orange cracks before heat builds. Fire Resistance protects you.");
      sandsHeat.inside = inside;
      if (clock.step(dt, inside) && heatSite(G.world, site.bx, site.bz))
        hurt(2, "Heat from the buried ruins overwhelmed you.", null, false, "fire");
    }
  }
  if (sandsHeat) sandsHeat.view.update(sandsHeat.clock.age, sandsHeat.clock.elapsed, G.settings.reducedMotion);
}
const sandsHaze = new THREE.Color(SANDS_REGIONS[0].haze), sandsTarget = new THREE.Color();
let crystalResonance = null, crystalSampleT = 0;
function clearCrystalResonance() {
  crystalResonance?.view.dispose(); crystalResonance = null; crystalSampleT = 0;
}
function crystalReview() {
  return crystalResonance ? { active: true, site: { ...crystalResonance.site }, phase: crystalResonance.clock.phase, age: crystalResonance.clock.age } : { active: false };
}
function updateCrystalResonance(dt, running) {
  if (G.dim !== HOLLOW_SANDS || G.creative || G.spectator || G.state === "dead" || G.wset.difficulty === "peaceful") {
    clearCrystalResonance(); return;
  }
  if (running) {
    crystalSampleT -= dt;
    if (crystalSampleT <= 0) {
      crystalSampleT = 0.4;
      const site = findCrystalSite(G.world, G.player.pos);
      if (site?.key !== crystalResonance?.site.key) {
        clearCrystalResonance(); crystalSampleT = 0.4;
        if (site) {
          crystalResonance = { site, clock: new CrystalResonance(), view: createCrystalResonanceView(scene, site) };
          UI.toast("Crystal resonance! Leave the blue ring before it fills.");
        }
      }
    }
    if (crystalResonance) {
      const { site, clock } = crystalResonance, event = clock.step(dt);
      if (event.warning) UI.toast("Crystal resonance! Leave the blue ring before it fills.");
      if (event.strike && crystalSite(G.world, site.bx, site.bz) && insideCrystalPulse(site, G.player) &&
          lineOfSight(G.world, { x: site.x, y: site.y + 1.5, z: site.z },
            { x: G.player.pos.x, y: G.player.pos.y + G.player.eye, z: G.player.pos.z }))
        hurt(2, "Ancient crystal energy overwhelmed you.", null, false, "ancientEnergy");
    }
  }
  if (crystalResonance) crystalResonance.view.update(crystalResonance.clock.age, G.settings.reducedMotion);
}
let sandsRegion = 0, sandsSampleT = 0;
let hollowDrift = 0, hollowDriftSample = 0, hollowFallCycle = -1;
let hollowFall = null;
function clearHollowDrift() {
  hollowDrift = 0; hollowDriftSample = 0; hollowFallCycle = -1;
  if (hollowFall) hollowFall.gone = true;
  hollowFall = null;
}
function updateHollowDrift(dt) {
  if (G.dim !== HOLLOW_SANDS || (hollowDriftSample -= dt) > 0) return;
  hollowDriftSample = 0.25;
  const p = G.player, w = G.world, x = Math.floor(p.pos.x), z = Math.floor(p.pos.z);
  const { h, zone } = G.gen.column(x, z);
  const floor = w.id(x, h, z);
  const exposed = !p.headInWater && !p.inLava && p.pos.y >= h + 0.5 && p.pos.y <= h + 5 &&
    Math.hypot(x, z) > 14 && Math.hypot(x - BURIED_THRONE.x, z - BURIED_THRONE.z) > 43 &&
    w.isLoaded(x, z) && (zone === 0 && floor === B.SAND || zone === 4 && floor === B.SOUL_SAND);
  let sheltered = !exposed;
  if (exposed) for (let y = Math.floor(p.pos.y) + 2; y <= Math.floor(p.pos.y) + 7; y++) {
    if (SOLID[w.id(x, y, z)]) { sheltered = true; break; }
  }
  const elapsed = worldSeconds() + (G.gen.seed >>> 0) % 120;
  const phase = elapsed % 120, cycle = Math.floor(elapsed / 120);
  const next = sheltered || phase >= 24 ? 0 : Math.min(1, phase / 4, (24 - phase) / 5);
  if (next > 0 && !hollowDrift) UI.toast("An underground sandstorm is gathering. Take shelter or leave the dunes.");
  hollowDrift = next;
  if (!next) {
    if (hollowFall) hollowFall.gone = true;
    return;
  }
  if (!G.settings.reducedMotion) for (let i = 0; i < (G.settings.quality === "fancy" ? 3 : 1) && parts.length < PMAX - 16; i++) {
    emitParticle(p.pos.x + (Math.random() - 0.5) * 19, p.pos.y + 0.5 + Math.random() * 6,
      p.pos.z + (Math.random() - 0.5) * 19, 4 + 4 * next, -0.45, -0.6,
      1.1, PUFF_COLORS.crumb, true);
  }
  if (next < 0.9 || hollowFallCycle === cycle || G.creative || G.spectator || G.wset.difficulty === "peaceful" ||
      Math.abs(p.pos.y - h - 1) > 0.8 || ents.hazards?.length >= 32) return;
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    if (!w.isLoaded(x + dx, z + dz) || w.id(x + dx, h, z + dz) !== floor ||
        w.id(x + dx, h + 1, z + dz) !== B.AIR) return;
  }
  hollowFallCycle = cycle;
  hollowFall = {};
  ents.addHazard(x + 0.5, h + 1, z + 0.5, 1.85, 2.2, 3, "Falling sand caught you. Leave the marked ring.", 0,
    { owner: hollowFall, damageKind: "sand", statusEffect: null, particle: "crumb", color: 0xe6c08a });
  UI.toast("Falling sand! Step out of the pale ring.");
  if (!G.settings.reducedMotion) for (let i = 0; i < 9 && parts.length < PMAX - 16; i++) {
    emitParticle(x + Math.random(), h + 4 + Math.random() * 3, z + Math.random(),
      0, -2, 0, 1.7, PUFF_COLORS.crumb, true);
  }
}
function emitSandfallDust() {
  const t = SANDS_TABLETS[0], p = G.player.pos, w = G.world;
  if (G.settings.reducedMotion || G.dimData[HOLLOW_SANDS]?.sandsLandmarks !== SANDS_LANDMARK_LAYOUT ||
      Math.hypot(p.x - t.x, p.z - t.z - 6) > 28 || !w.isLoaded(t.x, t.z + 6)) return;
  const base = G.gen.column(t.x, t.z).h + 1;
  if (w.id(t.x, base + 14, t.z + 6) !== B.QUARTZ_BLOCK) return;
  const count = G.settings.quality === "fast" ? 5 : 9;
  for (let i = 0; i < count && parts.length < PMAX; i++) {
    emitParticle(t.x + 0.5 + (Math.random() - 0.5) * 7, base + 5 + Math.random() * 16, t.z + 5.1 + Math.random() * 0.8,
      0.18, -3 - Math.random() * 2, -0.13, 0.85 + Math.random() * 0.65, PUFF_COLORS.crumb, true);
  }
}
function updateSandsDiscovery(dt) {
  if (G.dim !== HOLLOW_SANDS) return;
  if ((sandsSampleT -= dt) <= 0) {
    sandsSampleT = 0.45;
    const p = G.player.pos;
    sandsRegion = G.gen.column(p.x, p.z).zone;
    if (G.state === "play") emitSandfallDust();
    if (!G.creative && !G.spectator) {
      const expansion = G.story.leviathan ||= {};
      const regions = expansion.sandsRegions ||= {};
      const { name } = SANDS_REGIONS[sandsRegion];
      if (!regions[name]) {
        regions[name] = true;
        UI.toast(`Discovered: ${name}`, "good");
      }
    }
  }
  sandsHaze.lerp(sandsTarget.setHex(SANDS_REGIONS[sandsRegion].haze), 1 - Math.exp(-dt * 1.8));
}
const badlandsHaze = new THREE.Color(0xb78567);
const canyonHaze = new THREE.Color(0xd2b18e);
const redwoodHaze = new THREE.Color(0xc3b79d);
const mangroveHaze = new THREE.Color(0x85aca0);
const plainsHaze = new THREE.Color(0xb4c997);
const jungleHaze = new THREE.Color(0x92b69e);
const hollowmereHaze = new THREE.Color(0xa1aba2);
const ultraSky = new THREE.Color(0x761a2c);
function updateSky() {
  const nether = G.world && G.world.gen.isNether();
  const hollow = G.world && G.world.gen.isEnd && G.world.gen.isEnd();
  const forsaken = G.dim === "forsaken" && F.template(), lsky = L.sky();
  const mist = G.dim === GODZILLA_CALDERA || G.dim === VOLCANIC_BADLANDS ? badlandsHaze : G.dim === TYRANT_CANYON ? canyonHaze : G.dim === MANGROVE ? mangroveHaze : G.dim === REDWOODS ? redwoodHaze : G.dim === LOST_WORLD ? jungleHaze : null;
  const plains = G.dim === FERN_PLAINS;
  surfaceSky.visible = (G.dim === "overworld" || isLostWorldDimension(G.dim) && G.dim !== AMBER_CAVERNS) && !G.player.headInWater && !G.player.inLava;
  waterUniforms.rippleTime.value = G.settings.reducedMotion ? 0 : G.clock % 8;
  uniforms.coolTime.value = G.clock % (Math.PI * 2 / 1.3 * 200);   // wraps on a whole wave, so the pulse never jumps
  uniforms.coolPulse.value = G.settings.reducedMotion || G.settings.fx === "low" ? 0 : (G.settings.fx === "high" ? 0.24 : 0.18) + (G.echoDanger || 0) * 0.3 + (G.echoWake || 0) * 0.7 + (G.echoGate || 0) * 0.8;   // stronger when a Stalker is near, or when the city wakes (Phase 6)
  sun.visible = moon.visible = !nether && !hollow && !forsaken && !lsky;
  const blood = G.dim === "overworld" && bloodMoon(G.meta.ultra);
  uniforms.moonlight.value = blood ? .9 : 0;
  moon.scale.setScalar(blood ? 2.8 : 1);
  moon.material.color.set(blood ? 0xfe3535 : 0xffffff);
  uniforms.desat.value = 0;
  if (G.dim === HOLLOW_SANDS || G.dim === SOLKARA_SANCTUARY) {
    const r = G.settings.renderDist * CHUNK;
    uniforms.daylight.value = 0.48;
    uniforms.ambient.value = 0.26;
    skyCol.copy(sandsHaze);
    if (G.dim === SOLKARA_SANCTUARY) skyCol.setHex(0x453b39);
    else if (hollowDrift) skyCol.lerp(STORM_SKY, hollowDrift * 0.38);
    if (G.player.headInWater) skyCol.setHex(0x1d3f5a);
    scene.background = skyCol; uniforms.fogColor.value.copy(skyCol);
    sun.visible = moon.visible = stars.visible = false;
    G.fwFog = [r * (0.25 - hollowDrift * 0.09), r * (0.74 - hollowDrift * 0.32)];
    return 0.48;
  }
  if (G.dim === AMBER_CAVERNS && G.player.pos.y < 44) {
    const range = G.settings.renderDist * CHUNK;
    uniforms.daylight.value = 0.36;
    uniforms.ambient.value = 0.18;
    skyCol.setHex(0x332622);
    if (G.player.headInWater) skyCol.setHex(0x1d3f5a);
    scene.background = skyCol;
    uniforms.fogColor.value.copy(skyCol);
    sun.visible = moon.visible = stars.visible = false;
    G.fwFog = [range * 0.36, range * 0.86];
    return 0.36;
  }
  if (lsky) {   // the Deep is dark (only lamps and crystals light it); the Expanse has a dim violet sky
    const R = G.settings.renderDist * CHUNK;
    uniforms.daylight.value = lsky.daylight; uniforms.ambient.value = lsky.ambient;
    skyCol.setHex(lsky.sky); if (G.player.headInWater) skyCol.set(0x1d3f5a);
    scene.background = skyCol; uniforms.fogColor.value.copy(skyCol); stars.visible = G.dim === "expanse"; if (stars.visible) { stars.material.opacity = 0.7; stars.position.copy(camera.position); }
    G.fwFog = [R * lsky.fogNear, R * lsky.fogFar];
    return lsky.daylight || 0.3;
  }
  if (forsaken) {   // a dim, grey, misty sky (lighter once Herobrine is banished)
    const s = F.sky(), R = G.settings.renderDist * CHUNK;
    uniforms.daylight.value = s.daylight; uniforms.ambient.value = s.ambient; uniforms.desat.value = s.desat;
    skyCol.setHex(s.sky); if (G.player.headInWater) skyCol.set(0x1d3f5a);
    scene.background = skyCol; uniforms.fogColor.value.copy(skyCol); stars.visible = false;
    G.fwFog = [R * s.fogNear, R * s.fogFar];
    return s.daylight;
  }
  G.fwFog = null;
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
    if ((ashT += 1 / 60) > 0.08) {
      ashT = 0;
      emitParticle(p.pos.x + (Math.random() - 0.5) * 16, p.pos.y + Math.random() * 8, p.pos.z + (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 0.4, -0.3, (Math.random() - 0.5) * 0.4, 4,
        Math.random() < 0.25 ? PUFF_COLORS.ember : PUFF_COLORS.ash, true);
    }
    if ((rumbleT -= 1 / 60) <= 0) { rumbleT = 8 + Math.random() * 10; Sound.mob("rumble", 0); }
    return 0.5;
  }
  uniforms.ambient.value = 0.11;
  const a = G.time * Math.PI * 2, h = Math.sin(a);       // h: height of the sun (−1..1)
  const day = Math.min(1, Math.max(0, h * 2.2 + 0.35));
  let daylight = 0.22 + 0.78 * day;                      // nights stay dim, not pitch black
  const wet = G.dim === "overworld" ? G.wx.rain : 0, storm = G.dim === "overworld" ? G.wx.thunder : 0;   // Milestone 19: clouds over the sun
  if (wet) daylight = Math.max(Math.min(daylight, 0.17), daylight * (1 - 0.2 * wet - 0.45 * storm));
  if (blood) daylight *= .72;
  if (G.meta.ultra?.elapsed < G.challengeDread) daylight *= .66;
  uniforms.daylight.value = daylight;
  skyCol.copy(SKY_NIGHT).lerp(SKY_DAY, day);
  const dusk = Math.max(0, 1 - Math.abs(h) * 4) * (day > 0.05 ? 1 : 0.4);
  skyCol.lerp(SKY_SET, dusk * 0.45);
  const p = G.player;
  const villageMist = !p.headInWater && !p.inLava ? CP.hollowmereMist(p.pos) : 0;
  if (p.headInWater) skyCol.set(0x1d3f7a);
  else if (mist) {
    const volcanic = G.dim === VOLCANIC_BADLANDS || G.dim === GODZILLA_CALDERA;
    skyCol.lerp(mist, day * (volcanic ? 0.58 : 0.46));
    const distance = G.settings.renderDist * CHUNK;
    G.fwFog = volcanic ? [distance * 0.55, distance] : [distance * 0.28, distance * 0.88];
    uniforms.ambient.value = 0.19;
  } else if (plains) {
    skyCol.lerp(plainsHaze, day * 0.23);
    uniforms.ambient.value = 0.23;
  } else if (G.dim === "overworld" && stormStage) {
    skyCol.lerp(STORM_SKY, stormStage * 0.19).multiplyScalar(stormStage === 4 ? 0.65 : 1);
    const distance = [1, 0.9, 0.64, 0.43, 0.32][stormStage] * G.settings.renderDist * CHUNK;
    G.fwFog = [distance * 0.25, distance];
  } else if (G.dim === "overworld" && badlandsAsh > 0) {
    skyCol.lerp(ASH_SKY, badlandsAsh * 0.72);
    const distance = (1 - badlandsAsh * 0.42) * G.settings.renderDist * CHUNK;
    G.fwFog = [distance * 0.46, distance];
  } else if (villageMist > 0) {
    const range = G.settings.renderDist * CHUNK;
    skyCol.lerp(hollowmereHaze, villageMist * (0.28 + day * 0.48));
    uniforms.desat.value = villageMist * 0.32;
    uniforms.ambient.value += villageMist * 0.05;
    const near = Math.min(24, range * 0.38), far = Math.min(67, range - 2);
    G.fwFog = [range * 0.67 * (1 - villageMist) + near * villageMist, (range - 2) * (1 - villageMist) + far * villageMist];
  }
  if (wet && !p.headInWater) {   // Milestone 19: a gray, rainy sky that closes in a little
    skyCol.lerp(wxTint.copy(RAIN_SKY).multiplyScalar(0.22 + 0.78 * day), wet * 0.72).multiplyScalar(1 - 0.38 * storm);
    if (!G.fwFog) { const range = G.settings.renderDist * CHUNK; G.fwFog = [range * (0.67 - 0.32 * wet), (range - 2) * (1 - 0.18 * wet)]; }
  }
  if (!p.headInWater && blood) skyCol.lerp(ultraSky, .57);
  else if (G.meta.ultra && G.wx.thunder > .6 && !p.headInWater) {
    const range = G.settings.renderDist * CHUNK;
    G.fwFog = [range * .18, range * .61];
  }
  scene.background = skyCol; uniforms.fogColor.value.copy(skyCol);
  const cam = camera.position, R = 80;
  if (surfaceSky.visible) {
    surfaceSky.position.copy(cam);
    const sky = surfaceSky.material.uniforms;
    sky.horizon.value.copy(skyCol);
    sky.zenith.value.copy(SKY_TOP_NIGHT).lerp(SKY_TOP_DAY, day);
    if (stormStage) sky.zenith.value.lerp(skyCol, stormStage * 0.22);
    else if (badlandsAsh) sky.zenith.value.lerp(skyCol, badlandsAsh * 0.48);
    else if (villageMist > 0) sky.zenith.value.lerp(skyCol, villageMist * 0.62);
    if (wet || blood) sky.zenith.value.lerp(skyCol, blood ? .69 : wet * 0.75);
    sky.cloudLight.value = day * (1 - 0.6 * wet);
    sky.cloudDrift.value = G.settings.reducedMotion ? 0 : G.clock * 0.52;
  }
  sun.position.set(cam.x + Math.cos(a) * R, cam.y + Math.sin(a) * R, cam.z + 18); sun.lookAt(cam);
  moon.position.set(cam.x - Math.cos(a) * R, cam.y - Math.sin(a) * R, cam.z - 18); moon.lookAt(cam);
  stars.position.copy(cam); stars.material.opacity = Math.max(0, 1 - day * 1.6) * (1 - wet);
  if (wet > 0.6) { sun.visible = false; if (!blood) moon.visible = false; }   // hidden behind the rain clouds
  stars.visible = stars.material.opacity > 0.02;
  return daylight;
}
function applyView() {
  const R = G.settings.renderDist * CHUNK;
  uniforms.fogFar.value = waterUniforms.fogFar.value = R - 2;
  uniforms.fogNear.value = waterUniforms.fogNear.value = R * (surfaceSky.visible ? 0.67 : 0.55);
  if (G.world && G.world.gen.isNether()) { uniforms.fogNear.value = R * 0.3; uniforms.fogFar.value = R * 0.85; }
  if (G.fwFog) { uniforms.fogNear.value = G.fwFog[0]; uniforms.fogFar.value = G.fwFog[1]; }   // the Forsaken World's mist
  if (G.player.headInWater) {
    uniforms.fogNear.value = R * 0.67;
    uniforms.fogFar.value = R - 2;
    uniforms.ambient.value = Math.max(uniforms.ambient.value, 0.45);
  }
  if (G.player.inLava) { uniforms.fogNear.value = 0.5; uniforms.fogFar.value = 4; uniforms.fogColor.value.set(0xff6a10); }
  const far = Math.max(G.dim === "deep" || G.dim === "expanse" ? 420 : 120, R + 40);   // the Deep's far-city skyline reaches across the whole map
  if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
}

// ---------- your player model, third-person view, and the skin chooser ----------
let pmodel = null, pmMain = -1, pmOff = -1;
function itemForModel(id) { if (!id) return null; const m = itemMesh(id, 0.32); m.userData.shared = m.userData.shared || m.geometry.type !== "PlaneGeometry"; return m; }
function updatePlayerModel(dt) {
  const p = G.player, want = G.settings.skin;
  if (!pmodel || pmodel.skinId !== skinById(want).id) {
    if (pmodel) { scene.remove(pmodel.holder); for (const m of Object.values(pmodel.held)) if (m) disposeItemMesh(m); disposeModel(pmodel); }
    pmodel = makeModel(want); scene.add(pmodel.holder); pmMain = pmOff = -1; heldId = -1;
  }
  const tightMountView = G.riding?.def.segmentedLeviathan && Math.hypot(camera.position.x - p.pos.x, camera.position.y - (p.pos.y + p.eye), camera.position.z - p.pos.z) < 0.65;
  pmodel.holder.visible = !!G.thirdPerson && G.state !== "title" && !tightMountView;
  if (!pmodel.holder.visible) return;
  // what you wear and hold
  dressModel(pmodel, [36, 37, 38, 39].map(i => { const s = G.inv.slots[i], d = s && itemDef(s.id); return d ? (d.glider ? "#6a5a7a" : d.colors && d.colors[0]) : null; }),
    [36, 37, 38, 39].map(i => itemDef(G.inv.slots[i]?.id)?.leviathanSet));
  const mainId = (G.inv.slots[G.selected] || {}).id || 0, offIdNow = (G.inv.slots[OFF] || {}).id || 0;
  if (mainId !== pmMain || offIdNow !== pmOff) {
    for (const m of Object.values(pmodel.held)) if (m) disposeItemMesh(m);
    pmodel.held = {}; for (const k of ["armR", "armL"]) for (const c of [...pmodel.parts[k].children]) if (c.userData.held) pmodel.parts[k].remove(c);
    const a = itemForModel(mainId), b = itemForModel(offIdNow);
    if (a) a.userData.held = true; if (b) b.userData.held = true;
    holdItems(pmodel, a, b); pmMain = mainId; pmOff = offIdNow;
  }
  pmodel.holder.position.set(p.pos.x, p.pos.y + (p.mount ? p.mount.h - 0.75 : p.boat ? 0.1 : 0) - (G.riding?.burrowDepth || 0), p.pos.z);
  pmodel.holder.rotation.y = p.yaw + Math.PI;
  poseModel(pmodel, { walkPhase: G.walkPhase, speed: Math.hypot(p.vel.x, p.vel.z), pitch: -p.pitch, crouch: p.crouch && !p.flying, swing: G.swing,
    heavySwing: !!itemDef(mainId)?.tool?.heavy, reducedMotion: G.settings.reducedMotion,
    eating: G.eat ? (G.eat.slot === OFF ? "L" : "R") : null, bow: G.bowT >= 0, blocking: G.blocking ? (G.blockHand === OFF ? "L" : "R") : null, riding: !!(p.mount || p.boat) });
}
// The camera sits behind you (or in front, looking back), pulled closer if a wall is in the way
function placeThirdPersonCamera(p) {
  const d = lookDir(), back = G.view === 1 || (!G.view && p.mount?.def.segmentedLeviathan) ? -1 : 1, eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z };
  const dir = { x: d.x * back, y: d.y * back, z: d.z * back };
  const reach = p.mount?.def.segmentedLeviathan ? Math.max(7, Math.min(10, p.mount.w + 1)) : 4;
  const hit = p.mount?.def.segmentedLeviathan ? null : raycast(G.world, eye, dir, reach + 0.2, false);
  const dist = p.mount?.def.segmentedLeviathan ? leviathanCameraDistance(G.world, eye, dir, reach, raycast) : hit ? Math.min(reach, Math.max(0.6, hit.dist - 0.3)) : reach;
  camera.position.set(eye.x + dir.x * dist, eye.y + dir.y * dist, eye.z + dir.z * dist);
  if (G.view === 2) camera.rotation.set(-p.pitch, p.yaw + Math.PI, 0, "YXZ");
}
// Skin chooser: a grid of pictures and a turning 3D preview (its own small renderer, made only while the chooser is open)
let chooser = null;
G.skins = SKINS.map(s => ({ id: s.id, name: s.name, desc: s.desc, locked: !!s.locked, unlock: s.unlock }));
G.skinThumb = id => thumbnail(id, 72);
G.openSkinPreview = (canvasEl, skinId) => {
  if (!chooser) {
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: false, alpha: true }); } catch (e) { return false; }
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.setPixelRatio(1);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    cam.position.set(0, 1.05, 4.1); cam.lookAt(0, 0.85, 0);
    chooser = { r, sc, cam, model: null, ang: 0.5, drag: null, t: 0, canvasEl };
    const down = e => { chooser.drag = e.clientX; }, move = e => { if (chooser && chooser.drag !== null) { chooser.ang += (e.clientX - chooser.drag) * 0.012; chooser.drag = e.clientX; chooser.t = 0; } }, up = () => { if (chooser) chooser.drag = null; };
    canvasEl.onpointerdown = down; canvasEl.onpointermove = move; canvasEl.onpointerup = canvasEl.onpointerleave = up;
    const spin = () => {
      if (!chooser) return;
      chooser.t += 1 / 60; if (chooser.drag === null && chooser.t > 2) chooser.ang += 0.012;
      if (chooser.model) { chooser.model.holder.rotation.y = chooser.ang; poseModel(chooser.model, { walkPhase: chooser.t * 4, speed: 1.5, pitch: 0 }); }
      const w = canvasEl.clientWidth || 220, h = canvasEl.clientHeight || 260;
      if (canvasEl.width !== w || canvasEl.height !== h) { chooser.r.setSize(w, h, false); chooser.cam.aspect = w / h; chooser.cam.updateProjectionMatrix(); }
      chooser.r.render(chooser.sc, chooser.cam);
      chooser.raf = setTimeout(spin, 33);   // about 30 frames a second is plenty for a preview
    };
    spin();
  }
  if (chooser.model) { chooser.sc.remove(chooser.model.holder); disposeModel(chooser.model); }
  chooser.model = makeModel(skinId); chooser.sc.add(chooser.model.holder);
  dressModel(chooser.model, []);
  return true;
};
G.closeSkinPreview = () => {
  if (!chooser) return;
  clearTimeout(chooser.raf);
  if (chooser.model) disposeModel(chooser.model);
  chooser.r.dispose(); chooser.r.forceContextLoss();
  chooser = null;
};
G.skinUnlocked = id => {
  const skin = skinById(id);
  if (!skin.locked) return true;
  return UHC_SKINS.some(s => s.id === id) ? !!G.profile?.skins.includes(id) : (G.settings.unlocked || []).includes(id);
};
Saves.profile().then(profile => {
  G.profile = profile;
  if (!G.skinUnlocked(G.settings.skin)) G.settings.skin = "explorer";
}).catch(() => {});
G.maxHealth = maxHealth;
G.maxAir = maxAir;
G.applySkin = id => { if (!G.skinUnlocked(id)) return; G.settings.skin = skinById(id).id; saveSettings(G.settings); heldId = -1; UI.toast(`Skin: ${skinById(id).name}`, "good"); };

// ---------- settings ----------
G.applySettings = (k) => {
  const s = G.settings;
  saveSettings(s);
  Sound.setVolume(s.volume); Sound.setMuted(s.muted); Sound.setMusicVolume(s.music ?? 0.5);
  camera.fov = s.fov;
  resize();
  if (k === "quality" && G.world) for (const c of G.world.chunks.values()) { c.dirty = true; }
  applyView();
};
function resize() {
  const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
  const fancy = G.settings.quality === "fancy", budget = fancy ? 2560 * 1440 : 1920 * 1080;
  const ratio = Math.min(window.devicePixelRatio || 1, fancy ? 1.75 : 1, Math.sqrt(budget / (w * h)));
  // Set CSS viewport dimensions and GPU resolution in one allocation.
  if (renderWidth !== w || renderHeight !== h || renderer.getPixelRatio() !== ratio) {
    renderer.setDrawingBufferSize(w, h, ratio);
    renderWidth = w; renderHeight = h;
  }
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
let renderWidth = 0, renderHeight = 0;
window.addEventListener("resize", resize);

// ---------- world list actions (called from the menus) ----------
G.listWorlds = () => Saves.list();
G.campaignSeed = () => CAMPAIGN_SEED;
G.visitSolkaraSanctuary = () => {
  if (G.traveling || G.dim === SOLKARA_SANCTUARY ||
      !G.story.leviathan?.shrineRead && !(G.creative && G.dim === "overworld")) return;
  return changeDim(SOLKARA_SANCTUARY, -26, 19, "Finding the Solkara sanctuary…", () => {
    const p = G.player;
    if (p.collides(G.world, p.aabb(-26.5, 22, 19.5))) throw new Error("The sanctuary arrival is blocked.");
    Object.assign(p.pos, { x: -26.5, y: 22, z: 19.5 });
  });
};
G.previewLeviathanStorm = active => {
  if (!G.creative || G.dim !== "overworld" || G.traveling) return;
  creativeStormUntil = active ? G.clock + 45 : 0;
  stormSampleT = 0;
  UI.toast(active ? "Storm preview enabled for 45 seconds in exposed desert terrain." : "Storm preview ended. Normal weather is active.");
};
G.expeditionDestinations = () => {
  if (!G.meta?.lostWorldGen || G.guest || G.traveling || !isLostWorldDimension(G.dim)) return [];
  const stage = G.story.lostWorld?.stage ?? Infinity;
  const destinations = G.dim === LOST_WORLD ? [] : [{ dim: LOST_WORLD, label: "Return to jungle camp" }];
  for (const [dim, region] of Object.entries(LOST_WORLD_REGIONS)) {
    if (G.dim !== dim && stage >= region.stage) destinations.push({ dim, label: region.from });
  }
  return destinations;
};
G.expeditionTravel = dim => {
  if (G.state !== "panel" || !G.expeditionDestinations().some(destination => destination.dim === dim)) return;
  const { x, y, z, yaw } = dim === LOST_WORLD ? JUNGLE_RETURN : LOST_WORLD_REGIONS[dim].arrival;
  return changeDim(dim, x, z, "Traveling to " + DIM_NAMES[dim] + "…", () => {
      const p = G.player;
      if (y !== undefined) p.pos.y = y;
      placeSafely(p, x, z);
      if (p.collides(G.world, p.aabb()) || [B.LAVA, B.WATER].includes(G.world.id(Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z)))) {
        throw new Error("The expedition arrival is blocked.");
      }
      p.yaw = yaw;
      p.pitch = 0;
    });
};
G.storageOK = () => Saves.persistent();
G.newWorld = ({ name, seed, mode, settings, campaign, lostWorld, lostWorldCampaign }) => {   // mode: survival | creative | hardcore
  const ultra = mode === UHC_MODE;
  if (ultra && (campaign || lostWorld || lostWorldCampaign || G.guest)) return;
  const hardcore = mode === "hardcore" || ultra;
  if (hardcore) settings = { ...settings, difficulty: "hard", keepInv: false };
  const gen = ultra ? CURRENT_GEN : campaign || lostWorld ? LEGACY_CHUNK_GEN : seed === LANTERN_VALE_SEED ? KINGDOMS_GEN : CURRENT_GEN;
  const campaignMeta = campaign ? { ...campaign, villageLayout: CAMPAIGN_VILLAGE_LAYOUT,
    stonehavenLayout: CAMPAIGN_STONEHAVEN_LAYOUT, sandspireLayout: CAMPAIGN_SANDSPIRE_LAYOUT,
    oakwoodLayout: CAMPAIGN_OAKWOOD_LAYOUT, seabreakLayout: CAMPAIGN_SEABREAK_LAYOUT, ironholdLayout: CAMPAIGN_IRONHOLD_LAYOUT,
    emberOutpostLayout: CAMPAIGN_EMBER_OUTPOST_LAYOUT, hollowmereLayout: CAMPAIGN_HOLLOWMERE_LAYOUT,
    skyreachLayout: CAMPAIGN_SKYREACH_LAYOUT, ruinedCapitalLayout: CAMPAIGN_RUINED_CAPITAL_LAYOUT } : null;
  const save = { id: newId(), name, seed, mode: hardcore ? "survival" : mode, hardcore, hardcoreOver: false, created: Date.now(), played: Date.now(), day: 1, version: SAVE_VERSION, gen, dims: {}, inventory: [], voidInv: [], adv: {}, story: {}, tips: {}, settings, campaign: campaignMeta };
  if (ultra) { save.ultra = createChallenge(); save.time = 0; save.settings = { ...UHC_SETTINGS }; }
  if (lostWorld && !campaign && !hardcore) {
    save.lostWorldGen = LOST_WORLD_GEN;
    if (lostWorldCampaign && mode === "survival") save.story.lostWorld = expedition();
  }
  return openWorld(() => save);
};
G.loadWorld = id => openWorld(() => Saves.load(id));
G.joinWorld = save => openWorld(() => save);   // Play Together: a world the host sent (never saved here)
// Play Together: follow the host to another dimension (or a far-off spot). data = the host's record of that dimension.
G.followHost = async (dim, data, x, y, z) => {
  dismount(true);
  G.state = "loading"; UI.show("loading"); UI.setLoading(0, "Following the host…");
  clearWorldMeshes(); G.world.chunks.clear(); G.world.dirtyQueue.clear(); fires.length = 0; clouds.length = 0;
  if (data) G.dimData[dim] = data;
  if (dim !== G.dim || data) { G.dim = dim; G.world = makeWorld(dim); G.gen = G.world.gen; }
  const p = G.player; p.pos.x = x + 1.5; p.pos.z = z + 0.5; p.pos.y = y;
  await loadArea(p.pos.x, p.pos.z, "Following the host…");
  if (p.collides(G.world, p.aabb())) placeSafely(p, p.pos.x, p.pos.z);
  p.vel.x = p.vel.y = p.vel.z = 0; p.airTop = null; p.gliding = false; portalCooldown = true; portalT = 0;
  G.state = "pause"; UI.show("none"); UI.hud(); G.resume();
};
async function openWorld(read) {
  if (G.state === "loading" || G.meta?.ultra && G.world) return;
  const menu = UI.current;
  G.state = "loading";
  try { await startWorld(await read()); }
  catch (e) {
    unlockChallenge();
    clearWorldMeshes();
    G.world = null; G.meta = null; G.state = "title";
    document.body.classList.add("menu-bg");
    CP.hideHud(); UI.show(menu);
    UI.toast("That world couldn't be opened: " + e.message, "bad");
  }
}
G.deleteWorld = id => Saves.remove(id);
G.exportWorld = async id => { try { Saves.exportFile(await Saves.load(id)); } catch (e) { UI.toast(e.message, "bad"); } };
G.exportCurrent = () => { Saves.exportFile(snapshot()); UI.toast("World file downloaded.", "good"); };
G.importWorld = file => Saves.importFile(file);
G.challengeHistory = () => Saves.challengeHistory();
G.challengeTime = challengeTime;
G.toTitle = async () => {
  if (G.meta?.ultra && (G.state === "play" || G.state === "panel")) {
    if (G.state === "panel") { UI.closePanel(); G.panelKind = null; G.panelCtx = null; }
    G.state = "pause"; Sound.pause();
  }
  dismount(true);
  if (!G.challengeSaveFailed) await saveNow(false);
  unlockChallenge();
  MP.worldClosed();
  clearWorldMeshes();
  if (G.world) { G.world.chunks.clear(); G.world.dirtyQueue.clear(); }
  G.world = null; G.meta = null; G.state = "title"; CP.hideHud();
  document.body.classList.add("menu-bg");
  outline.visible = crack.visible = false;
  UI.show("title");
};
window.addEventListener("pagehide", () => { if (G.world && G.state !== "loading") saveNow(false); Sound.stop(); });

const leviathanWarningHUD = createLeviathanWarningHUD(document.getElementById("leviathanWarning"),
  (family, volume) => Sound.leviathanWarning(family, volume));
function updateLeviathanWarningHUD() {
  const visible = !G.cutscene && (G.state === "play" || G.state === "pause" || G.state === "panel");
  const any = duneWarningFX || duneSweepFX || duneDevourFX || duneVortexFX || obsidianWarningFX ||
    ancientWarningFX || ancientArrivalFX.length || ancientFuryFX.length;
  const cue = visible && any ? selectLeviathanWarning(G.player.pos, {
    dune: duneWarningFX, sweep: duneSweepFX, devour: duneDevourFX, vortex: duneVortexFX,
    obsidian: obsidianWarningFX, ancient: ancientWarningFX, arrival: ancientArrivalFX, fury: ancientFuryFX
  }) : null;
  leviathanWarningHUD.update(cue, G.state === "play" || G.state === "panel");
}
const bossBar = document.getElementById("bossbar");
const bossBarName = bossBar.querySelector("b"), bossBarFill = bossBar.querySelector("i");
let bossBarPercent = -1;
function updateBossBar(p) {
  const hb = CP.bossInfo() || F.bossInfo() || L.bossInfo() || MU.bossInfo() || CB.bossInfo() || GC.bossInfo();
  let boss = null, distance = Infinity;
  if (!hb) for (const e of ents.list) {
    const grizzlyFight = e.sp === "grizzly_bear" && !e.baby && e.angry > 0 && !e.dead &&
      e.wild.phase !== "patrol" && e.wild.phase !== "rest" && !G.creative && G.wset.difficulty !== "peaceful" &&
      Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y, e.pos.z - p.pos.z) < 22;
    if ((!e.def.boss && !grizzlyFight) || e.gone || e.tame || e.duneCycle?.preview || e.sp === "castellan" || e.def.godzilla ||
        e.def.segmentedLeviathan && !e.emerged && !e.dead &&
        !(e.sp === "leviathan_dune" && e.duneCycle?.step === "rising")) continue;
    const d = (e.pos.x - p.pos.x) ** 2 + (e.pos.z - p.pos.z) ** 2;
    if (d < distance) { distance = d; boss = e; }
  }
  const visible = !!hb || !!boss && distance <= (boss.sp === "dragon" ? 160 ** 2 : 64 ** 2);
  if (bossBar.hidden === visible) bossBar.hidden = !visible;
  if (!visible) return;
  let label = hb?.label, frac = hb?.frac;
  if (!hb) {
    const bossName = boss.sp === "grizzly_bear" && boss.variant === 1 ? "Ancient Grizzly" : boss.def.name;
    label = bossName + (boss.armored ? " (armored: arrows bounce off)" : "");
    if (boss.def.segmentedLeviathan) label += " • Phase " + (boss.sp === "leviathan_ancient" ? ancientPhase(boss) :
      boss.sp === "leviathan_obsidian" ? obsidianEncounterPhase(boss, G.story.leviathan?.obsidian) : dunePhase(boss.hp, boss.maxHp));
    if (boss.sp === "leviathan_obsidian" && G.story.leviathan?.obsidian?.ritualOffered)
      label += ` • Trust ${Math.max(0, Math.min(4, boss.duneCycle?.ritualMarks || 0))}/4`;
    if (boss.sp === "cindermaw") {
      const phase = ents.cinderPhase(boss);
      let pylons = 0;
      for (const e of ents.list) if (e.sp === "pylon" && !e.dead) pylons++;
      label = `Cindermaw • Phase ${phase}${pylons ? ` • Shielded by ${pylons} Ember Pylon${pylons > 1 ? "s" : ""}` : boss.tired ? " • Worn out!" : boss.perched ? " • Landed: hit it!" : ""}`;
    }
    frac = boss.hp / boss.maxHp;
  }
  if (bossBarName.textContent !== label) bossBarName.textContent = label;
  const percent = Math.max(0, frac * 100);
  if (bossBarPercent !== percent) { bossBarPercent = percent; bossBarFill.style.width = percent + "%"; }
  bossBar.classList.toggle("pale", !!hb && !hb.mutant);
  bossBar.classList.toggle("mutant", !!hb?.mutant);
  bossBar.classList.toggle("ember", boss?.sp === "cindermaw");
}
function wildlifeJournalActive() {
  return G.dim === "overworld" && !G.creative && !G.spectator && !G.guest && G.state === "play";
}
function reportWildlifeDiscovery(name) {
  if (name) UI.toast("Field Notes updated — " + name, "good");
}
function recordWildlifeSightings(p) {
  if (!wildlifeJournalActive()) return;
  const eye = { x: p.pos.x, y: p.pos.y + p.eye, z: p.pos.z };
  const sightings = observeWildlife(G.story, ents.list, eye, lookDir(), G.meta.day,
    point => lineOfSight(G.world, eye, point));
  if (sightings.length) reportWildlifeDiscovery(sightings.join(", "));
}

// ---------- main loop ----------
function tickBadlands(dt) {
  const world = G.world, player = G.player;
  updateBadlandsVents(world, player.pos, G.story.lostWorld?.stage, dt, (vent, x) => {
    ents.addHazard(x + 0.5, vent.y, vent.z + 0.5, vent.radius, 2.4, 5, "An eruption caught you on the causeway!", 1.2, {
      color: 0xff9a43, particle: "ember", damageKind: "fire", statusEffect: null, steadyWarning: true,
      cancelled: () => !badlandsVentActive(world, player.pos, G.story.lostWorld?.stage, vent, x)
    });
    Sound.mob("rumble", Math.hypot(player.pos.x - x - 0.5, player.pos.z - vent.z - 0.5));
  });
}

let last = performance.now(), acc = 0, fpsT = 0, fpsN = 0, fps = 0, stepSoundT = 0, leviathanJournalT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = Math.max(last, now);   // capped so a background tab doesn't cause a huge jump (and never runs backwards)
  G.clock = (G.clock || 0) + dt;
  fpsT += dt; fpsN++; if (fpsT > 0.5) { fps = Math.round(fpsN / fpsT); fpsT = 0; fpsN = 0; }
  Sound.menuMusic(!G.world && G.state !== "loading");   // the title theme plays on the menus
  if (!G.world || G.state === "loading" || G.state === "title") { if (G.state === "title") renderer.clear(); return; }
  const p = G.player, run = G.meta.ultra;
  const running = run ? !document.hidden && (G.state === "panel" || (G.state === "play" && locked)) :
    G.state === "play" || G.state === "panel" || (G.state === "pause" && MP.keepRunning());   // a host's friends keep playing while the host is in the menu

  if (running) {
    if ((leviathanJournalT -= dt) <= 0) {
      leviathanJournalT = 0.5;
      recordLeviathanDiscovery(G, stormStage);
      recordWildlifeSightings(p);
      tickSolkaraSandfall();
    }
    if (run?.status !== "active") {
      const step = dt / (run ? UHC_DAY : DAY_LENGTH);
      G.time = (G.time + step) % 1;
      if (G.time < step) G.meta.day = (G.meta.day || 1) + 1;
    }
    updateHollowDrift(dt);
    updateSandstorm(dt);
    ML.update(dt);   // the Grand Desert Temple: fires, dust, and guards
    CG.update(dt);   // the Endwatch Citadels' gates and Outer Siege
    CK.update(dt);   // and their courtyards and keeps
    CD.update(dt);   // and their dungeons
    CB.update(dt);   // and the Fallen Castellan
    CA.update(dt);   // and their sounds
    updateObsidianAsh(dt);
    const input = G.state === "play" && locked && !G.cutscene ? {
      f: (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0),
      r: (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
      jump: keys.has("Space"), crouch: keys.has("KeyC"),
      // no sprinting with 3 or fewer food drumsticks, behind a raised shield, or while eating
      sprint: (keys.has("ShiftLeft") || keys.has("ShiftRight")) && (G.creative || G.spectator || G.riding || p.hunger > 6) && !G.blocking && !G.eat,
      flyUp: keys.has("Space"), flyDown: keys.has("KeyC")
    } : { f: 0, r: 0 };
    if (!G.creative && !G.spectator && stormStage >= 2) {
      const pieces = leviathanSetPieces("sand"), penalty = stormStage === 2 ? 0.06 : 0.12;
      input.walkMul = 1 - penalty * (pieces === 4 ? 0 : pieces >= 2 ? 0.5 : 1);
    }
    if (G.riding) { input.crouch = false; if (!G.riding.tame && !G.riding.def.boat) { input.f = input.r = 0; input.jump = false; } }   // a wild Trotter won't go where you steer
    const flyingMount = G.riding?.tame && G.riding.def.airMount;
    if (flyingMount) { input.flyDown = input.sprint; input.sprint = false; }
    if (G.spectator) { p.flying = true; p.noclip = true; } else { p.noclip = false; if (flyingMount || !G.creative) p.flying = !!flyingMount; }
    updateQuicksand(dt, true, input);
    duneVortexDrag(input);
    if (mountedBurrow) { updateMountedBurrow(dt); acc = 0; }
    else acc += dt;
    const startX = p.pos.x, startZ = p.pos.z;
    while (acc >= 1 / 60) {
      acc -= 1 / 60;
      const wasWater = p.inWater;
      const res = p.step(G.world, p.flying ? { ...input, crouch: false } : input, 1 / 60, G.creative);
      const fall = (G.riding ? res.fall - 3 : res.fall) - (G.effects.jump ? G.elv.jump || 1 : 0);   // Jump Boost softens landings   // a Trotter's legs soak up some of a fall
      const spike = fall > 2 && idOf(G.world.get(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.05), Math.floor(p.pos.z))) === B.POINTED_DRIPSTONE;   // Milestone 20: landing on a stalagmite hurts double
      if (spike) hurt(Math.max(1, Math.floor(fall - 2) * 2), "You landed on pointed dripstone. Ouch!", null, false, "fall");
      else if (fall > 3.5) hurt(Math.floor(fall - 3), "That was a long fall! Build stairs or use water to land safely.", null, false, "fall");
      if (fall > 0.75 && !G.guest) {   // Milestone 18: jumping onto farmland can trample it back into dirt
        const fx = Math.floor(p.pos.x), fy = Math.floor(p.pos.y - 0.05), fz = Math.floor(p.pos.z);
        if (G.world.id(fx, fy, fz) === B.FARMLAND && Math.random() < Math.min(1, fall - 0.5)) {
          if (BLOCKS[G.world.id(fx, fy + 1, fz)]?.shape === "crop") breakBlock(fx, fy + 1, fz, true, true);
          G.world.set(fx, fy, fz, B.DIRT); Sound.place("soft");
          if (!G.tips.trample) { G.tips.trample = 1; UI.toast("You trampled the farmland! Walk on your farm instead of jumping on it."); }
        }
      }
      if (res.crash > 10) hurt(Math.round((res.crash - 10) * 0.7), "You glided into a wall! Slow down by looking up before you land.", null, true);
      if (!wasWater && p.inWater && p.vel.y < -4) Sound.splash();
      if (G.dim === "end" && p.pos.y < -4) {   // the void below the Hollow
        if (G.creative) { p.pos.x = 100.5; p.pos.z = 0.5; p.pos.y = 60; p.vel.y = 0; }
        else if ((G.voidT = (G.voidT || 0) - 1 / 60) <= 0) { G.voidT = 0.5; hurt(4, "You fell into the void.", null, true, "void"); }
      } else if (p.pos.y < -20) { placeSafely(p, p.spawn.x, p.spawn.z); }
    }
    const moved = Math.hypot(p.pos.x - startX, p.pos.z - startZ);
    // exhaustion from moving (Minecraft 1.20.1: sprinting 0.1 per block, swimming 0.01 per block; walking is free)
    if (!G.creative && !G.spectator && !G.riding) {
      if (p.inWater) p.exhaust += 0.01 * moved;
      else if (input.sprint && p.onGround) p.exhaust += 0.1 * moved;
      if (p.onGround && !p.flying) G.stats.walked = (G.stats.walked || 0) + moved;
    }
    if (moved > 0.001 && p.onGround) {
      G.walkPhase += moved * 2.2; G.stepDist += moved;
      if (G.stepDist > 2.2) {
        G.stepDist = 0; const under = G.world.id(Math.floor(p.pos.x), Math.floor(p.pos.y - 0.2), Math.floor(p.pos.z));
        Sound.step(MATERIAL(under));
        if (!p.crouch && under !== B.WOOL && under !== B.BLACK_WOOL && under !== B.HUSH_CARPET) R.vibrate(p.pos.x, p.pos.y + 0.1, p.pos.z, 1);   // sneaking or walking on wool is silent to Hush Sensors
      }
      G.moveTotal = (G.moveTotal || 0) + moved; if (G.moveTotal > 6) tipDone("move");
    }
    tickRiding(dt);
    tickEating(dt);
    if (G.blocking) { const sh = G.inv.slots[G.blockHand]; if (!mouseR || !sh || sh.id !== I.SHIELD || G.state !== "play") G.blocking = false; }
    survival(dt);
    if (!G.guest) {   // a Play Together guest: the host's game runs machines, crops, fire and the story
      Adv.poll(dt);
      updateFurnaces(dt); updateBrewing(dt);
      tickCrops(dt);
      updateTNT(dt);
      updateMovers();
      R.tick(dt);
      updateFires(dt);
      FL.tick(dt);   // Milestone 18
      updateFallers(dt); updateLeafDecay(dt);   // Milestone 18, Part B
    }
    updateClouds(dt); updatePotionClouds(dt); trackBiome(dt);
    if (G.dim === "end" && !G.guest) { ensureBoss(); tickWyrmSummon(dt); }
    if (G.state === "play" && !MP.noPortals()) checkPortal(dt);   // Play Together: the host leads the way through portals
    if (!G.guest) { tickCinder(dt); F.tick(dt); MU.tick(dt); L.tick(dt); if (!run) ST.tick(dt); CP.tick(dt); }
    if (G.attackCd > 0) G.attackCd -= dt;
    if (G.bowT >= 0) { G.bowT += dt; loadCrossbow(); }   // (Milestone 22: a crossbow loads itself once held long enough)
    if (G.panelKind === "furnace" && (G.panelT = (G.panelT || 0) + dt) > 0.25) { G.panelT = 0; UI.refreshPanel(); }
    else if (G.world.rs && G.world.rs.uiDirty && (G.panelT = (G.panelT || 0) + dt) > 0.2) { G.panelT = 0; G.world.rs.uiDirty = false; UI.refreshPanel(); }
  }

  // camera
  const bob = G.settings.reducedMotion || !p.onGround || G.view ? 0 : Math.sin(G.walkPhase) * 0.04 * Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 4);
  camera.position.set(p.pos.x, p.pos.y + p.eye + bob, p.pos.z);
  camera.rotation.set(p.pitch, p.yaw, p.hurtT > 0 && !G.settings.reducedMotion ? Math.sin(p.hurtT * 30) * 0.03 : 0, "YXZ");
  G.thirdPerson = (!!G.view && !G.spectator) || !!G.cutscene || !!G.riding?.def.segmentedLeviathan;
  if (tickCutscene(dt)) { /* the victory scene moves the camera */ }
  else if (G.thirdPerson) placeThirdPersonCamera(p);
  updatePlayerModel(dt);
  if (p.hurtT > 0) p.hurtT -= dt;

  stream(G.state === "play" ? 7 : 4);
  if (running && !G.settings.reducedMotion && (villageSmokeT -= dt) <= 0) {
    villageSmokeT = .63;
    const room = Math.min(G.settings.quality === "fancy" ? 6 : 3, Math.max(0,PMAX-parts.length-30));
    if (room) for (const c of settlementChimneys(G.world,p.pos,room)) {
      emitParticle(c.x,c.y,c.z,.14,.65,.09,1.8,PUFF_COLORS.ash,true);
    }
  }
  festivals.update(dt);
  if (running) raids.update(dt);
  if (running) updateSandsDiscovery(dt);
  updateWeather(dt, running);   // Milestone 19
  updateScope();   // Milestone 22, Part C
  if (running) { updateRockets(dt); updateJukeboxes(); }   // Milestone 22, Part D
  if (running && (structT -= dt) <= 0) { structT = 2; updateStructures(); }   // Milestone 23, Part D
  if (running && (raidT -= dt) <= 0) { raidT = 1; updateOmenRaid(); }
  if (running) { updateLightning(dt); updateSnowAndIce(dt); } else updateBolts(0);
  const daylight = updateSky();
  applyFlash(dt);
  (decor ||= createDecor({ THREE, scene, G, itemMesh, disposeItemMesh })).update(dt, daylight);   // Milestone 21, Part D: paintings, framed items, armor on stands
  if (G.effects.conduit && G.player.headInWater) uniforms.ambient.value = Math.max(uniforms.ambient.value, 0.75);   // Conduit Power lights up the water
  if (G.effects.nightVision) uniforms.ambient.value = Math.max(uniforms.ambient.value, G.effects.nightVision < 10 && Math.floor(G.effects.nightVision * 4) % 2 ? 0.35 : 0.85);   // Night Vision (flickers in its last 10 s)
  (echoholdAtmosphere ||= (G._echoAtmo = createEchoholdAtmosphere({ THREE, scene, camera, G, emitParticle, fog: uniforms }))).update(running ? dt : 0);
  updateSolkaraCore();
  updateSolkaraGateView();
  updateSolkaraMural();
  applyView();
  updateCrystalResonance(dt, running);
  updateSandsHeat(dt, running);
  if (!running) updateQuicksand(0, false);
  updateArmorShieldView();
  if (running && G.state !== "dead") {
    if (arenaFractures) {
      if (G.dim !== HOLLOW_SANDS || !ents.list.some(e => e.sp === "leviathan_ancient" && !e.dead && !e.gone)) clearArenaFractures();
      else arenaFractures.update(dt);
    }
    for (let i = ancientSpikes.length - 1; i >= 0; i--) if (!ancientSpikes[i].update(dt)) ancientSpikes.splice(i, 1);
    updateObsidianEncounter();
    if (G.dim === "overworld") updateStormVortex(dt);
    if (G.state !== "dead" && !G.guest) {
      if (G.dim === VOLCANIC_BADLANDS) tickBadlands(dt);
      if (G.dim === GODZILLA_CALDERA) GC.tick(dt);
      ents.update(dt, daylight, camera);
    }
    CO.tick(dt);
    if (mountedBurrow) mountedBurrow.view.update(mountedBurrow.session.visualState, G.settings.reducedMotion);
    updateMountedLeviathanAttack(dt);
    updateOrbs(dt);
  }
  updateDuneWarning();
  updateObsidianWarning();
  updateAncientWarning();
  updateAncientArrival();
  updateAncientFury();
  updateAncientPresentation(running);
  // calm background music: only in the Overworld, and never while a boss bar is up
  Sound.calmMusic(!bloodMoon(run) && running && G.state !== "dead" && G.dim === "overworld" && bossBar.hidden);
  // epic music while any boss bar is up (also makes monsters nearby growl louder and more often)
  Sound.bossMusic(running && G.state !== "dead" && !bossBar.hidden, Math.max(0, bossBarPercent) / 100);
  updateDuneSweep(dt, running);
  updateDuneDevour(dt, running);
  updateDuneVortex(dt, running);
  updateLeviathanWarningHUD();
  if (G.state === "play" && mouseL && !G.creative && !G.spectator && G.attackCd <= 0 && entityTarget()) attack();
  document.getElementById("waterTint").hidden = !p.headInWater;

  // what am I pointing at?
  const hit = G.state === "play" && locked ? target() : null;
  if (hit) {
    let box = [0, 0, 0, 1, 1, 1];
    const id = idOf(hit.v);
    if (isDoor(id)) box = doorBox(metaOf(hit.v));
    else if (BLOCKS[id].shape === "cross" || BLOCKS[id].shape === "torch") box = [0.2, 0, 0.2, 0.8, 0.8, 0.8];
    else if (BLOCKS[id].shape === "model" || BLOCKS[id].shape === "dust") box = selectBox(hit.v) || box;
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
  if (G.swing > 0) {
    const duration = itemDef(G.inv.slots[G.selected]?.id)?.tool?.swingDuration || 0.25;
    G.swing += (running ? dt : 0) / duration;
    if (G.swing >= 1) G.swing = mouseL && !G.creative && G.mining ? 0.01 : 0;
  }
  updateHeld(bright);
  updateFishLine();
  updateCompassHud(dt);

  // particles
  let n = 0;
  for (let i = 0; i < parts.length; i++) {
    const q = parts[i]; q.life -= dt;
    if (q.life <= 0) { freeParticles.push(q); continue; }
    q.vy -= (q.floaty ? 1 : 12) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    if (SOLID[G.world.id(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z))]) { q.vy = 0; q.vx *= 0.5; q.vz *= 0.5; q.y = Math.floor(q.y) + 1.01; }
    parts[n] = q;
    const j = n * 3;
    pPos[j] = q.x; pPos[j + 1] = q.y; pPos[j + 2] = q.z;
    pCol[j] = q.r * daylight; pCol[j + 1] = q.g * daylight; pCol[j + 2] = q.b * daylight;
    n++;
  }
  parts.length = n;
  if (pGeo.drawRange.count !== n) pGeo.setDrawRange(0, n);
  if (n) for (const attribute of [pGeo.attributes.position, pGeo.attributes.color]) {
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, n * 3);
    attribute.needsUpdate = true;
  }
  if (running && run?.status === "active" && !G.cutscene && G.state !== "dead" && G.state !== "loading") tickChallenge(dt);
  MP.tick(dt, daylight);
  updateBossBar(p);
  if (run && (G.challengeHudSecond !== Math.floor(run.elapsed) || G.challengeDim !== G.dim || G.challengeHudStatus !== run.status)) {
    G.challengeHudSecond = Math.floor(run.elapsed); G.challengeDim = G.dim; G.challengeHudStatus = run.status;
    challengeHUD(run, G.dim);
  }
  if (G.challengeCueUntil && G.clock > G.challengeCueUntil) {
    document.getElementById("ultraCue").hidden = true; G.challengeCueUntil = 0;
  }
  if (G.hudDirty) { G.hudDirty = false; UI.hud(); }
  if (running) { G.autosaveT += dt; if (G.autosaveT > (run ? UHC_AUTOSAVE : AUTOSAVE)) { G.autosaveT = 0; saveNow(!run); } }
  if (G.debug) {
    document.getElementById("debug").textContent =
      `${DIM_NAMES[G.dim]}\nx ${p.pos.x.toFixed(1)}  y ${p.pos.y.toFixed(1)}  z ${p.pos.z.toFixed(1)}\nchunk ${Math.floor(p.pos.x / 16)}, ${Math.floor(p.pos.z / 16)}   loaded ${G.world.chunks.size}\n${fps} fps   day ${G.meta.day || 1}  time ${(G.time * 24).toFixed(1)}h\n${G.gen.column(Math.floor(p.pos.x), Math.floor(p.pos.z)).biome}`;
  }
  renderer.render(scene, camera);
}

// ---------- start ----------
// The Forsaken World adventure (js/forsaken.js) gets the game functions it needs
// Milestone 14: leads, name tags, Trotter armor, pet breeding, rotting Hogbeasts, creatures through portals
const CO = G.companions = initCompanions({ G, THREE, scene, ents, UI, Sound, puff, giveItem, spawnDrop, openPanel, closePanel, portalAt, portalKey, mount, dismount,
  crouching: () => !!G.player.crouch || keys.has("KeyC"), adv: (t, a) => G.adv(t, a) });
const F = initForsaken({ G, THREE, scene, ents, UI, Sound, hurt, puff, saveNow, saveSettings, changeDim, lookDir, addEffect, giveItem, giveXp, OFF, placeSafely, keys, victory: showVictory });
G.forsaken = F;
// The Lost Civilization adventure (js/lost.js). Its test controls only show on a development copy (localhost or ?dev).
const L = initLost({ G, ents, UI, Sound, puff, saveNow, changeDim, giveItem, giveXp, placeSafely, hurt, lookDir, keys, victory: showVictory, devTools: /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.search.includes("dev") });
G.lost = L;
// The Endwatch Citadels over the strongholds (js/citadel.js)
const CIT = G.citadel = initCitadel({ G, L });
const CG = G.citadelGate = initCitadelGate({ G, ents, UI, Sound, scene, THREE, saveNow, puff });
const CK = G.citadelKeep = initCitadelKeep({ G, ents, UI, Sound, saveNow, puff });
const CD = G.citadelDungeon = initCitadelDungeon({ G, ents, UI, Sound, saveNow, puff });
const CB = G.citadelBoss = initCitadelBoss({ G, ents, UI, Sound, saveNow, puff, giveItem, giveXp });
const CA = G.citadelAmbience = initCitadelAmbience({ G, Sound, puff });   // wind, fires, dungeon noises, portal hum (js/citadel-ambience.js)   // the Fallen Castellan (js/citadel-boss.js)   // dungeons, traps, checkpoints, the treasury (js/citadel-dungeon.js)   // courtyard battle, keep rooms, tomes (js/citadel-keep.js)   // drawbridge, portcullis, Outer Siege (js/citadel-gate.js)
// The Grand Desert Temple's fires, dust, and guards (js/monument-life.js)
const ML = G.monumentLife = initMonumentLife({ G, L, ents, Sound, emitParticle, COLORS: PUFF_COLORS, roomForParticles: () => parts.length < PMAX - 24 });
// The Starter Home and the Explorer's Map (js/starter.js)
const ST = initStarter({ G, UI, Sound, L, openPanel, closePanel });
const CP = G.campaign = initCampaign({ G, UI, Sound, L, ents, openPanel, closePanel, giveXp, puff, victory: showVictory, saveNow, teleport: (x, y, z, label) => teleportTo(x, y, z, label) });
const MU = G.mutants = initMutants({ G, ents, UI, Sound, puff, F, THREE, scene });   // the Forsaken Mutants (after L and CP, which also fill ents.bossAI)
G.starter = ST;
// The Sparkworks signal engine (js/redstone.js)
// Milestone 18, Part A: flowing water and lava (woken by players, buckets, and explosions; see js/fluids.js)
const FL = initFluids({ G, hardened: () => G.adv("concrete"), washAway: (x, y, z) => { if (G.world.id(x, y, z) === B.FIRE && Math.hypot(G.player.pos.x - x, G.player.pos.z - z) < 24) G.adv("extinguish"); breakBlock(x, y, z, true, true); },
  newSource: (x, y, z) => { if (Math.hypot(G.player.pos.x - x, G.player.pos.z - z) < 24) G.adv("watersource"); },
  mixed: (x, y, z, made) => { Sound.mob("hiss", Math.hypot(G.player.pos.x - x, G.player.pos.z - z)); puff(x + 0.5, y + 1, z + 0.5, "poof"); if (made === B.OBSIDIAN) G.adv("obsidianmade"); else if (made === B.COBBLE) G.adv("cobblemade"); },
  off: () => G.wset.liquidFlow === false || !!G.settings.noFlow,   // Part D: the world option "Water and lava flow"
  fall: (x, y, z, v) => startFall(x, y, z, v),   // Part B
  lavaHeat: (x, y, z) => { if (G.wset.fireSpread === false || Math.random() > 0.3) return; for (let k = 0; k < 3; k++) { const fx = x + Math.floor(Math.random() * 3) - 1, fy = y + Math.floor(Math.random() * 2), fz = z + Math.floor(Math.random() * 3) - 1; if (!G.world.id(fx, fy, fz) && nearFuel(fx, fy, fz)) { lightFire(fx, fy, fz); break; } } } });
const R = initRedstone({ G, Sound, puff, breakBlock, primeTNT, UI, ents, lookFacing, lookFacing3, noteFx, moveFx, pushEntities,
  spawnDrop, dropGone: d => { removeDrop(d); const i = G.drops.indexOf(d); if (i >= 0) G.drops.splice(i, 1); }, placeLiquid, ignite, checkBlightSummon,
  boneMeal: (x, y, z) => useBoneMeal({ x, y, z, v: G.world.get(x, y, z), ny: 1 }, null), openMachine: k => { Sound.door(true); openPanel("machine", k); } });
G.rs = R;
// Play Together (js/multiplayer.js)
// May a guest change this block? The host's game checks every change a guest sends.
function guestMayChange(x, y, z, old, v) {
  const oid = idOf(old), nid = idOf(v);
  if (oid === nid) return blockDef(old).hardness !== Infinity || isDoor(oid);   // opening a gate or door is fine; quest pieces stay put
  if (blockDef(old).hardness === Infinity || blockDef(v).hardness === Infinity) return false;   // bedrock, gateways, quest blocks
  if (nid === B.FIRE || nid === B.PORTAL || oid === B.PORTAL) return false;   // no fires, no portals while playing together
  if (G.dim === "overworld" && (oid === B.CHEST || oid === B.SIGN)) {   // the Solkara landmarks are protected, like for the host
    const sites = G.story.leviathan?.sites, hit = { x, y, z };
    if (oid === B.CHEST ? relicSiteAt(sites, hit, relicCache) : relicSiteAt(sites, hit, shrineSign)?.key === "shrine") return false;
  }
  return true;
}
// Get a chest or furnace ready for a guest (the same setup the host gets when opening one, loot included)
function prepareContainer(x, y, z) {
  const w = G.world, v = w.get(x, y, z), kind = blockDef(v).interact, key = x + "," + y + "," + z;
  if (kind === "chest" || kind === "shellbox") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "chest", slots: new Array(27).fill(null) });
    if (kind === "chest" && (metaOf(v) & LOOT)) { fillLoot(w.containers.get(key), { x, y, z, v }); w.set(x, y, z, make(B.CHEST, metaOf(v) & 3)); }
    return kind;
  }
  if (kind === "furnace") {
    if (!w.containers.has(key)) w.containers.set(key, { type: "furnace", slots: [null, null, null], burn: 0, burnMax: 0, prog: 0 });
    return kind;
  }
  return null;
}
const MP = G.mp = initMultiplayer({ G, THREE, scene, UI, Sound, snapshot, makeModel, poseModel, disposeModel, World, CHUNK, HEIGHT, idx, chunkKey,
  version: MP_PROTOCOL + "." + SAVE_VERSION + "." + CURRENT_GEN,
  openPanel, closePanel, breakBlock, prepareContainer, guestMayChange, validBlock: v => Number.isInteger(v) && !!BLOCKS[idOf(v)], blockDef, itemDef, WATER: B.WATER, LAVA: B.LAVA,
  ents, Player, hurt, addEffect, spawnOrbs, spawnDrop, removeDrop, itemMesh, disposeItemMesh, lightItem, maxStack, mount, dismount, SPECIES });
Adv.init(G, SPECIES, { xp: n => spawnOrbs(n, G.player.pos.x, G.player.pos.y + 1, G.player.pos.z), give: (id, n) => { if (G.inv.add(id, n)) G.dropItem(id, n); } });
UI.init(G);
G.applySettings();
resize();
UI.show("title");
requestAnimationFrame(loop);
const GC = initGodzillaFight({ G, ents, scene, Sound, UI, saveNow, hurt });
window.__bhLoop = loop;   // lets automated tests drive frames
G._test = { updateStructures, updateOmenRaid, launchRocket, updateRockets, useJukebox, rockets: () => rockets, decor: () => decor, placePainting, useDecor, updateSnowAndIce, meltBlock, queueMeltCheck, strike, rodNear, lightningHit, weatherAt, nextWeather, skyCols, wxView: () => wxView, updateWeather, R, lookFacing, pm: () => pmodel, hand, ents, Adv, swapHands, useTotem, finishEat, tickEating, survival, die, checkBlightSummon, tickBeacons, mount, dismount, tickRiding, ridingReview, armorReview, crystalReview, quicksandReview, heatReview, duneEncounterReview, duneWarningReview, duneSweepReview, duneDevourReview, duneVortexReview, enterHollow, leaveHollow, gatewayJump, fillFrame, throwEye, ensureBoss, wyrmDefeated, placeVoidCrystal, tickWyrmSummon, endData, clouds, lightPortal, travel, buildPortal, portalList, ignite, makeWorld, loadArea, explode, hurt, attack, entityTarget, releaseBow, tickCrops, growTree, useBed, target, useItem, breakBlock, mineInfo, interact, spawnDrop, placeSafely, keys, openPanel, closePanel, setLocked: v => { locked = v; }, setMouse: (l, r) => { mouseL = l; mouseR = r; }, pressR, releaseR, pressL, releaseL };
G._test.obsidianWarningReview = obsidianWarningReview;
G._test.ancientWarningReview = ancientWarningReview;
G._test.ancientArrivalReview = ancientArrivalReview;
G._test.ancientFuryReview = ancientFuryReview;
G._test.ancientMusicReview = () => Sound.ancientMusicReview();
G._test.calmMusicReview = () => Sound.calmMusicReview();
G._test.calmMusicNow = () => Sound.calmMusicNow();
G._test.menuMusicReview = () => Sound.menuMusicReview();
G._test.bossMusicReview = () => Sound.bossMusicReview();
// browsers only allow sound after a click or key press, so the title theme starts on the first one
// (Safari only counts some kinds of clicks, so listen for all of them)
let titleClickedAt = 0;
for (const type of ["pointerdown", "mousedown", "click", "touchend", "keydown", "keyup"]) window.addEventListener(type, () => { if (!G.world) { Sound.start(); titleClickedAt ||= performance.now(); } });
// title tips, and a small note until the browser lets the music play
const titleScreen = document.getElementById("title"), soundHint = document.getElementById("soundHint");
initTitleTips(document.getElementById("splash"), { reducedMotion: () => !!G.settings.reducedMotion, visible: () => !titleScreen.hidden });
setInterval(() => {
  const st = Sound.status(), off = G.settings.muted || !(G.settings.music ?? 0.5) || !(G.settings.volume > 0);
  let text = "";
  if (titleScreen.hidden) text = "";
  else if (off) text = "🔇 Music is off. Turn it on in Settings (Sound volume, Music volume, Mute).";
  else if (st.error) text = "🔇 The music couldn't start: " + st.error;
  else if (st.state === "running") text = "";
  else if (titleClickedAt && performance.now() - titleClickedAt > 1500) text = `🔇 The browser hasn't allowed sound yet (${st.state}). Click again, and make sure this tab isn't muted.`;
  else text = "🔊 Click anywhere to turn on the music";
  if (soundHint.textContent !== text) soundHint.textContent = text;
  soundHint.hidden = !text;
}, 500);
G._test.ancientTremorReview = () => ({ roll: ancientTremorRoll, cameraRoll: camera.rotation.z });
G._test.ancientBuriedReview = () => ancientBuriedView.review();
G._test.ancientOpeningReview = () => ancientOpeningView.review();
// On-demand snapshots only; no per-frame collection or saved diagnostics.
G._test.renderReview = () => ({
  obsidianVentVisible: !!obsidianVentFX?.view,
  badlandsAsh,
  hollowDrift,
  solkaraMuralVisible: !!solkaraMural,
  particles: { active: parts.length, free: freeParticles.length, budget: PMAX },
  memory: { ...renderer.info.memory },
  programs: renderer.info.programs?.length || 0,
  render: { ...renderer.info.render },
  viewport: { width: renderer.domElement.clientWidth, height: renderer.domElement.clientHeight,
    bufferWidth: renderer.domElement.width, bufferHeight: renderer.domElement.height, pixelRatio: renderer.getPixelRatio() },
  settings: { quality: G.settings.quality, renderDist: G.settings.renderDist, reducedMotion: G.settings.reducedMotion },
  chunks: G.world?.chunks.size || 0,
  entities: ents.list.length,
  arrivals: ancientArrivalReview(),
  music: Sound.ancientMusicReview(),
  introVisible: !!document.querySelector('.ancient-intro:not([hidden])')
});
