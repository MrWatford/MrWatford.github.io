import assert from "node:assert/strict";
import { B, CHUNK, I, LIT, RECIPES, lightOf, make } from "../js/blocks.js";
import { Entities, SPECIES } from "../js/entities.js";
import { hash3 } from "../js/noise.js";
import { Saves } from "../js/save.js";
import { model, shapeBoxes } from "../js/shapes.js";
import { prepareStonehaven } from "../js/stonehaven.js";
import { createChallenge, advanceChallenge, applyChallengeRewards, bloodMoon, challengeDay,
  checkChallengeWrite, failChallenge, hunterLevel, survivalMaximum, UHC_DAY, UHC_END } from "../js/ultra-hardcore.js";
import { weatherAt } from "../js/weather.js";
import { Generator, CURRENT_GEN, LOOT, idx } from "../js/worldgen.js";
import { World } from "../js/world.js";
import * as THREE from "../lib/three.module.min.js";

const run = createChallenge();
const events = [];
for (let i = 0; i < UHC_END * 4; i++) {
  events.push(...advanceChallenge(run, 0.25));
  if (i === UHC_DAY * 4 - 1) assert.equal(challengeDay(run), 2);
  if (i === UHC_DAY * 10 - 1) assert.equal(bloodMoon(run), true);
}
assert.deepEqual(events, ["day1", "day2", "dusk", "moon", "victory"]);
assert.equal(run.status, "completed");
assert.equal(challengeDay(run), 4);
assert.equal(bloodMoon(run), false);
assert.deepEqual(advanceChallenge(run, 900), []);

const lost = createChallenge();
advanceChallenge(lost, UHC_DAY + 50);
assert.equal(hunterLevel(lost), 1);
failChallenge(lost, "exposure");
assert.equal(lost.status, "failed");
assert.equal(hunterLevel(lost), 0);
assert.deepEqual(advanceChallenge(lost, 9999), []);
const first = applyChallengeRewards(undefined, { ultra: lost });
assert.deepEqual(first.skins, ["uhc-survivor"]);
assert.equal(first.lastDawn, false);
const profile = applyChallengeRewards(first, { ultra: run });
assert.equal(profile.skins.length, 4);
assert.deepEqual(applyChallengeRewards(profile, { ultra: run }), profile);
for (const scope of [{ campaign: {} }, { ultra: run }, { expedition: true }, { hardcore: true }, { guest: true }, { mode: "creative" }]) {
  assert.equal(survivalMaximum({ mode: "survival", ...scope }, profile), scope.ultra ? 6 : 20);
}
assert.equal(survivalMaximum({ mode: "survival" }, profile), 22);
assert.equal(survivalMaximum({ mode: "survival" }), 20);
assert.throws(() => checkChallengeWrite(undefined, run));
assert.throws(() => checkChallengeWrite({ ...lost, revision: 2 }, { ...run, revision: 1 }));
assert.throws(() => checkChallengeWrite(lost, run));
assert.throws(() => checkChallengeWrite(lost, { ...lost, elapsed: lost.elapsed - 1 }));
assert.doesNotThrow(() => checkChallengeWrite(undefined, createChallenge()));
assert.doesNotThrow(() => checkChallengeWrite({ ...run, revision: 2 }, { ...run, revision: 2, fallen: true }));
await assert.rejects(Saves.importFile(new Blob([JSON.stringify({
  blockhaven: 4, name: "Restored attempt", seed: "test", ultra: run, dims: {}
})])), /original browser save/);
const ordinary = await Saves.importFile(new Blob([JSON.stringify({
  blockhaven: 4, name: "Normal export", seed: "test", mode: "survival", dims: { overworld: {} }, player: { health: 15 }
})]));
assert.equal((await Saves.load(ordinary.id)).player.health, 15);

const seed = "Stonehaven Architecture";
const normal = new Generator(seed, CURRENT_GEN), ultra = new Generator(seed, CURRENT_GEN);
ultra.ultraHardcore = true;
assert.deepEqual(ultra.strongholds, normal.strongholds);
const capital = {};
prepareStonehaven(ultra, {}, capital);
prepareStonehaven(normal, {}, {});
assert.equal(capital.stonehaven.v, 4);
assert.equal(ultra.grandCapital.size, 192);

const baseline = new World(normal), challenge = new World(ultra);
let ruins = 0, villagePlots = 0, caches = 0;
const gen = normal.seed;
for (let cz = -24; cz <= 24; cz++) for (let cx = -24; cx <= 24; cx++) {
  const spot = normal.villagePiece(cx, cz);
  if (spot?.detailed) {
    assert.deepEqual(ultra.villagePiece(cx, cz)?.center, spot.center);
    villagePlots++;
  }
  if (hash3(gen, cx, 99, cz) >= .035) continue;
  const a = baseline.load(cx, cz), b = challenge.load(cx, cz);
  const smallChest = make(B.CHEST, LOOT | 3);
  for (let z = 5; z < 11; z++) for (let x = 5; x < 11; x++) {
    const h = normal.column(cx * CHUNK + x, cz * CHUNK + z).h;
    if (a.data[idx(x, h + 1, z)] !== smallChest || a.data[idx(x, h + 1, z - 1)] === smallChest ||
        a.data[idx(x - 1, h + 1, z - 1)] !== B.TORCH) continue;
    assert.notEqual(b.data[idx(x, h + 1, z)], smallChest);
    ruins++;
  }
}
// The rarer cache roll only occurs in a small fraction of ordinary ruin candidates.
for (let z = -90; z <= 90; z++) for (let x = -90; x <= 90; x++) {
  if (hash3(gen, x, 99, z) < .035 && hash3(gen, x, 183, z) < .035) challenge.load(x, z);
}
for (const [key, contents] of challenge.containers) {
  if (contents.slots[0]?.id !== I.BREAD || contents.slots[3]?.id !== B.TORCH || contents.slots[7]?.id !== I.STICK) continue;
  assert.equal(challenge.id(...key.split(",").map(Number)), B.BARREL);
  caches++;
}
assert.ok(ruins > 12);
assert.ok(villagePlots > 10);
assert.ok(caches > 0 && caches <= 40);
assert.equal(weatherAt(gen, 880, 720, 0, null, 180).kind, 2);
assert.equal(weatherAt(gen, 0, 720, 0, null, 10).kind, 0);
assert.equal(lightOf(make(B.CAMPFIRE, LIT)), 13);
assert.equal(lightOf(B.CAMPFIRE), 0);
assert.ok(model(make(B.CAMPFIRE, LIT)).parts.length > model(B.CAMPFIRE).parts.length);
assert.equal(shapeBoxes(B.CAMPFIRE).length, 1);
assert.ok(RECIPES.find(r => r.out[0] === B.CAMPFIRE && r.ultra));
assert.deepEqual(["zombie", "creeper", "spider", "skeleton"].map(sp => SPECIES[sp].name),
  ["Groaner", "Hisser", "Skitter", "Rattler"]);
assert.ok(["lion", "tiger", "grizzly_bear", "crocodile"].every(sp => SPECIES[sp].wildlife));

// Use identical dark, open terrain and repeated spawn ticks to measure the caps.
const camera = new THREE.PerspectiveCamera(55, 1, .1, 200);
camera.updateMatrixWorld();
const surface = { dim: "overworld", gen: { isNether: () => false, column: () => ({ h: 4 }) },
  surfaceY: () => 4, isLoaded: () => true, id: (_x, y) => y <= 4 ? B.STONE : B.AIR, get: (_x, y) => y <= 4 ? B.STONE : B.AIR, lightAt: () => [15, 0] };
function population(elapsed, light = .22) {
  const ctx = { world: () => surface, player: () => ({ pos: { x: .5, y: 5, z: .5 } }),
    settings: () => ({ difficulty: "hard" }), creative: () => false,
    ultra: () => elapsed === null ? null : { status: "active", elapsed } };
  const manager = new Entities(new THREE.Scene(), ctx);
  manager.pickHostile = () => "zombie";
  manager.add = sp => manager.list.push({ sp, def: SPECIES[sp] });
  for (let i = 0; i < 65; i++) manager.spawnTick(1, light, camera);
  return manager.list.length;
}
assert.equal(population(null), 16);
assert.equal(population(12), 0);
assert.equal(population(500), 32);
assert.equal(population(2480), 36);
assert.equal(population(3200), 40);
assert.equal(population(3200, .75), 0);

console.log(JSON.stringify({ simulatedSeconds: UHC_END, events, ruins, villagePlots, caches, hostileCaps: [16, 32, 36, 40] }));
