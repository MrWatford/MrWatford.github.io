import assert from "node:assert/strict";
import * as THREE from "../lib/three.module.min.js";
import { B, I, SPAWN_EGGS, itemDef, spawnEggId } from "../js/blocks.js";
import { Entities, SPECIES } from "../js/entities.js";
import { Generator } from "../js/worldgen.js";
import { World } from "../js/world.js";
import { Player } from "../js/player.js";
import { canRideElephant } from "../js/wildlife-elephant.js";
import { reefWaterFit, reefSpawnSite } from "../js/wildlife-reef.js";
import { marineWaterRoom } from "../js/wildlife-ocean.js";
import { spawnWildlife, sharkWater } from "../js/wildlife.js";
import { markWildlifeDefeated, observeWildlife, restoreWildlifeJournal, wildlifeJournalHTML } from "../js/wildlife-journal.js";
import { Saves, SAVE_VERSION } from "../js/save.js";

// Mesh geometry is constructed normally. The browser review checks actual atlas pixels.
globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {} }) }) };

const falconId = "falcon";
const elephantId = "elephant";
const kangarooId = "kangaroo";
const flamingoId = "flamingo";
const peacockId = "peacock";
const koalaId = "koala";
const slothId = "sloth";
const ostrichId = "ostrich";
const giraffeId = "giraffe", rhinoId = "rhinoceros";
const mooseId = "moose", pandaId = "red_panda";
const tigerId = "tiger", deerId = "deer";
const lionId = "lion", zebraId = "zebra";
const sealId = "seal", walrusId = "walrus";
const octopusId = "octopus", mantaId = "manta_ray";
const crocId = "crocodile", hippoId = "hippopotamus";
const whaleId = "blue_whale", orcaId = "orca";
const bearId = "grizzly_bear", sharkId = "great_white_shark", eagleId = "bald_eagle";
function fixture({ water = false, difficulty = "normal", creative = false, isEnd = false } = {}) {
  const player = { pos: { x: 20, y: 10, z: 0.5 }, eye: 1.62, inWater: water };
  const events = [];
  const world = {
    gen: { isNether: () => false, isEnd: () => isEnd, column: () => ({ biome: "forest" }) },
    editCount: 0,
    visited: new Set(["0,0"]),
    entityStore: new Map(),
    isLoaded: () => true,
    surfaceY: () => water ? 19 : 9,
    id: (x, y) => y < (water ? 5 : 9) ? B.STONE : y === 9 && !water ? B.GRASS : water && y <= 19 ? B.WATER : B.AIR
  };
  world.get = world.id;
  const ctx = {
    world: () => world, player: () => player, settings: () => ({ difficulty }),
    alive: () => true, creative: () => creative,
    hurtPlayer: (damage, label) => events.push([damage, label]),
    push: () => {}, particles: () => {}, adv: () => {}, drop: () => {}, xp: () => {}
  };
  const scene = new THREE.Scene(), manager = new Entities(scene, ctx);
  const think = (entity, age) => { entity.age = age; manager.think(entity, 1); };
  return { player, world, scene, manager, events, think };
}

{
  const ids = SPAWN_EGGS.map(row => row[0]);
  assert.deepEqual(ids.slice(-27), [bearId, sharkId, eagleId, whaleId, orcaId, crocId, hippoId, octopusId, mantaId, sealId, walrusId, lionId, zebraId, tigerId, deerId, mooseId, pandaId, giraffeId, rhinoId, ostrichId, slothId, koalaId, peacockId, flamingoId, kangarooId, elephantId, falconId]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(itemDef(I.FISHING_ROD).name, "Fishing Rod");
  assert.equal(spawnEggId(99), 499);
  assert.equal(spawnEggId(100), 700);
  for (const id of [bearId, sharkId, eagleId, whaleId, orcaId, crocId, hippoId, octopusId, mantaId, sealId, walrusId, lionId, zebraId, tigerId, deerId, mooseId, pandaId, giraffeId, rhinoId, ostrichId, slothId, koalaId, peacockId, flamingoId, kangarooId, elephantId, falconId]) {
    assert.equal(itemDef(spawnEggId(ids.indexOf(id))).species, id);
    const { manager, scene } = fixture();
    const actor = manager.add(id, 2.5, 10, 2.5);
    assert.equal(Object.keys(actor.parts).length, SPECIES[id].model.parts.length);
    manager.animate(actor, 0.08, 16, 1);
    for (const part of Object.values(actor.parts)) {
      assert(part.children[0].isMesh);
      assert(part.children[0].geometry.attributes.color);
    }
    manager.animate(actor, 0.08, 40 ** 2, 1);
    assert(actor.def.model.parts.filter(p => p.detail).every(p => !actor.parts[p.name].children[0].visible));
    manager.clear();
    assert.equal(scene.children.length, 0);
  }
}

{
  const f = fixture(), bear = f.manager.add(bearId, 2.5, 10, 0.5);
  f.think(bear, 0);
  assert.equal(bear.wild.phase, "patrol");
  f.player.pos.x = 4.6;
  f.think(bear, 1);
  assert.equal(bear.wild.phase, "roar");
  f.think(bear, 2.2);
  f.think(bear, 2.4);
  assert.equal(bear.wild.phase, "swipe");
  assert.equal(f.events.length, 0);
  f.think(bear, 3);
  assert.equal(f.events[0][0], 12);
  bear.hp = 120;
  f.think(bear, 4.2);
  assert.equal(bear.wild.phase, "slam");
  f.player.pos.x = 9;
  f.think(bear, 5.2);
  assert.equal(f.events.length, 1, "Dodge the slam");
  f.think(bear, 6.4);
  assert.equal(bear.wild.phase, "chargeWindup");
  f.think(bear, 7.1);
  assert.equal(bear.wild.phase, "charge");
  assert(bear.goal.x > 8);
  bear.pos.x = 8;
  f.think(bear, 7.25);
  assert.equal(f.events[1][0], 15);
  f.think(bear, 7.4);
  assert.equal(f.events.length, 2);
}

{
  const f = fixture({ difficulty: "peaceful" });
  const bear = f.manager.add(bearId, 2, 10, 0);
  f.player.pos.x = 2.5;
  f.think(bear, 2);
  assert.equal(bear.wild.phase, "patrol");
}

{
  const f = fixture({ water: true }), shark = f.manager.add(sharkId, 2.5, 11, 0.5);
  const prey = f.manager.add("minnow", 7, 12, 0.5);
  shark.inWater = prey.inWater = true;
  f.think(shark, 0);
  assert.equal(shark.wild.phase, "circle");
  assert.equal(shark.wild.prey, prey);
  f.think(shark, 2.4);
  assert.equal(shark.wild.phase, "lunge");
  shark.pos.x = 6.5;
  f.think(shark, 2.55);
  assert(prey.dead > 0);
  assert.equal(shark.wild.phase, "recover");
  assert(sharkWater(f.world, 2.5, 11, 0.5));
  assert(!sharkWater(f.world, 2.5, 18.4, 0.5));
}

{
  const f = fixture({ water: true }), eagle = f.manager.add(eagleId, 2.5, 24, 0.5);
  const prey = f.manager.add("minnow", 7, 18.5, 0.5);
  prey.inWater = true;
  f.think(eagle, 1);
  assert.equal(eagle.wild.phase, "dive");
  f.think(eagle, 1.2);
  assert.equal(eagle.goal.speed, 9);
  eagle.pos = { x: 7, y: 19.6, z: 0.5 };
  f.think(eagle, 2);
  assert(prey.dead > 0);
  assert.equal(eagle.wild.phase, "climb");
  assert(eagle.goal.y > 21);
}

{
  const rolls = values => () => values.shift() ?? 0.5;
  const f = fixture();
  spawnWildlife(f.manager, 1, 1, rolls([0, 0, 0.01, 0.01]));
  assert.deepEqual(f.manager.list.map(e => [e.sp, e.baby]), [[bearId, false], [bearId, true]]);
  assert.deepEqual(f.manager.list[0].home, f.manager.list[1].home);
  assert.equal(f.manager.list[1].hp, 50);
  spawnWildlife(f.manager, 8, 1, rolls([0, 0, 0.01]));
  assert.equal(f.manager.list.filter(e => e.sp === bearId).length, 2);
  for (const opt of [{ creative: true }, { difficulty: "peaceful" }, { isEnd: true }]) {
    const excluded = fixture(opt);
    spawnWildlife(excluded.manager, 1, 1, rolls([0, 0, 0.01, 0.01]));
    assert(!excluded.manager.list.some(e => e.sp === bearId));
  }
  const wet = fixture({ water: true });
  spawnWildlife(wet.manager, 1, 1, rolls([0, 0, 0.1]));
  assert.equal(wet.manager.list[0].sp, sharkId);
  assert.deepEqual(wet.manager.toJSON(), {});
}

{
  const f = fixture(), home = [2.5, 10, 2.5];
  const bear = f.manager.add(bearId, ...home, { hp: 175, home });
  const uid = bear.uid, chunk = { cx: 0, cz: 0, key: "0,0" };
  f.manager.unloadChunk(chunk);
  assert.equal(f.manager.list.length, 0);
  f.manager.loadChunk(chunk);
  assert.equal(f.manager.list[0].uid, uid);
  const dims = { overworld: { mods: {}, containers: [], entities: f.manager.toJSON(), visited: [] } };
  const legacyData = { blockhaven: SAVE_VERSION, version: SAVE_VERSION, id: "wildlife-check",
    name: "Wildlife save check", seed: "wildlife-check", mode: "survival",
    player: { pos: { x: 1, y: 10, z: 1 } }, inventory: Array(41).fill(null), story: {}, dims };
  const imported = await Saves.importFile({ text: async () => JSON.stringify(legacyData) });
  const loaded = await Saves.load(imported.id);
  const entry = loaded.dims.overworld.entities["0,0"][0];
  assert.deepEqual(entry.home, home);
  assert.equal(entry.uid, uid);
  assert.equal(entry.hp, 175);
  const old = structuredClone(legacyData);
  old.dims.overworld.entities = { "0,0": [{ sp: "cow", uid: "legacy-cow", x: 2, y: 10, z: 2, hp: 8 }] };
  const oldCopy = await Saves.importFile({ text: async () => JSON.stringify(old) });
  assert.deepEqual((await Saves.load(oldCopy.id)).dims.overworld.entities, old.dims.overworld.entities);
}
console.log("Wildlife integration passed: assets, egg registry, bear combat/dodges, shark/eagle predation, spawn gates, chunk reload and JSON save import.");

{
  const rolls = values => () => values.shift() ?? 0.5;
  const habitat = () => {
    const f = fixture();
    const ground = f.world.id;
    f.world.mods = new Map();
    f.world.visited.add("3,0");
    f.world.id = f.world.get = (x, y, z) => y === 14 && x >= 50 && x <= 53 && Math.abs(z) <= 1
      ? B.LEAVES : ground(x, y, z);
    return f;
  };
  const ordinary = habitat();
  spawnWildlife(ordinary.manager, 1, 1, rolls([0, 0, 0.01, 0.5, 0.1]));
  const [adult, cub] = ordinary.manager.list;
  assert(adult.den && cub.den);
  assert.deepEqual(adult.home, [51.5, 10, 0.5]);
  assert.deepEqual(cub.pos, { x: 51.5, y: 10, z: 0.5 });
  ordinary.manager.think(adult, 0.25);
  assert.equal(adult.goal.x, adult.home[0], "Adult returns to the den at night");
  ordinary.manager.think(cub, 0.25);
  assert.equal(cub.wild.phase, "rest");
  ordinary.player.pos = { ...cub.pos, x: cub.pos.x + 2 };
  ordinary.player.crouch = true;
  ordinary.manager.think(adult, 1);
  assert.equal(adult.wild.phase, "roar", "Adults guard the den even if a player crouches");
  adult.angry = 0;
  ordinary.manager.damage(cub, 4, "player");
  assert(adult.angry > 0, "Attacking a cub alerts its adult");
  ordinary.world.id = ordinary.world.get = fixture().world.id;
  ordinary.world.editCount++;
  ordinary.manager.think(adult, 1);
  assert.equal(adult.den, false, "Editing away the shelter invalidates the den");
  assert.equal(adult.toJSON().den, undefined);

  const edited = habitat();
  edited.world.mods.set("3,0", new Map([[1, B.STONE]]));
  spawnWildlife(edited.manager, 1, 1, rolls([0, 0, 0.01, 0.01, 0.1]));
  assert.equal(edited.manager.list[0].den, false, "Den search skips player-edited chunks");
  assert.equal(edited.manager.list[0].variant, 0);

  const ancient = habitat();
  spawnWildlife(ancient.manager, 1, 1, rolls([0, 0, 0.01, 0.01]));
  const [elder] = ancient.manager.list;
  assert.equal(ancient.manager.list.length, 1);
  assert.equal(elder.hp, 365);
  assert(elder.scale > adult.scale && elder.w < 3 && elder.h < 3);
  assert.notEqual(elder.mat.map, adult.mat.map, "Ancient coat uses its own atlas");
  const chunk = { cx: 3, cz: 0, key: "3,0" };
  elder.hp -= 70;
  ancient.manager.unloadChunk(chunk);
  ancient.manager.loadChunk(chunk);
  const [restored] = ancient.manager.list;
  assert.equal(restored.uid, elder.uid);
  assert.equal(restored.hp, 295);
  assert.equal(restored.variant, 1);
  assert.equal(restored.den, true);
  assert.deepEqual(restored.home, elder.home);
  assert.equal(ancient.world.mods.size, 0, "Spawning does not alter terrain");
  ancient.player.pos = { x: 50.5, y: 10, z: 0.5 };
  restored.hp = 285;
  ancient.think(restored, 1);
  ancient.think(restored, 2.2);
  ancient.think(restored, 2.4);
  assert.equal(restored.wild.phase, "slam", "Ancient unlocks the slam at 80% health");
  ancient.think(restored, 3.4);
  assert.equal(ancient.events[0][0], 22.5);
  const entities = ancient.manager.toJSON();
  const imported = await Saves.importFile({ text: async () => JSON.stringify({
    blockhaven: SAVE_VERSION, version: SAVE_VERSION, id: "grizzly-den-check", name: "Ancient den check",
    seed: "wildlife-den-review", mode: "survival", player: { pos: ancient.player.pos },
    inventory: Array(41).fill(null), story: {},
    dims: { overworld: { mods: {}, containers: [], entities, visited: ["3,0"] } }
  }) });
  assert.deepEqual((await Saves.load(imported.id)).dims.overworld.entities, entities);
}

console.log("Den and Ancient Grizzly integration passed: family behavior, terrain safety, variant combat and persistence.");

{
  const { manager } = fixture();
  const bear = manager.add(bearId, 6, 10, 0, { den: true, home: [6, 10, 0] });
  const cub = manager.add(bearId, 6, 10, 1, { baby: true });
  const ancient = manager.add(bearId, 6, 10, 0, { variant: 1 });
  const eagle = manager.add(eagleId, -8, 10, 0);
  const shark = manager.add(sharkId, 31, 10, 0);
  const story = {}, eye = { x: 0, y: 11.5, z: 0 }, east = { x: 1, y: 0, z: 0 };
  const see = (actors, day, visible = () => true) => observeWildlife(story, actors, eye, east, day, visible);
  assert.match(wildlifeJournalHTML(story), /0 of 28 recorded/);
  assert.deepEqual(see([bear, ancient, eagle, shark], 3, () => false), []);
  assert.deepEqual(see([eagle, shark], 3), []);
  assert.equal(story.wildlife, undefined);
  assert.deepEqual(see([bear, cub], 3), ["Grizzly Bear"]);
  assert.deepEqual(story.wildlife.grizzly_bear, { firstDay: 3, den: true, young: true });
  const snapshot = { ...story };
  bear.wild.phase = "charge";
  assert.deepEqual(see([bear], 4), []);
  assert.equal(story.wildlife.grizzly_bear.behavior, true);
  assert.equal(snapshot.wildlife.grizzly_bear.behavior, undefined);
  let raycasts = 0;
  see([bear, cub], 5, () => { raycasts++; return true; });
  assert.equal(raycasts, 0, "Already recorded sightings skip the visibility check");
  assert.equal(markWildlifeDefeated(story, cub, 4), null);
  assert.equal(story.wildlife.grizzly_bear.defeated, undefined);
  assert.equal(markWildlifeDefeated(story, ancient, 4), "Ancient Grizzly");
  assert.equal(markWildlifeDefeated(story, ancient, 9), null);
  assert.deepEqual(story.wildlife.ancient_grizzly, { firstDay: 4, defeated: true });
  assert.match(wildlifeJournalHTML(story), /2 of 28 recorded/);
  assert.match(wildlifeJournalHTML(story), /First recorded on day 4 · Defeated/);
  const restored = restoreWildlifeJournal({ ...story.wildlife, unknown: { firstDay: 1 },
    bald_eagle: { firstDay: "yesterday" }, great_white_shark: { firstDay: 7, den: true, behavior: "yes" } });
  assert.deepEqual(restored, { ...story.wildlife, great_white_shark: { firstDay: 7 } });

  const world = { blockhaven: SAVE_VERSION, version: SAVE_VERSION, id: "wildlife-journal-check",
    name: "Wildlife journal check", seed: "wildlife-den-review", mode: "survival",
    player: { pos: { x: 0, y: 10, z: 0 } }, inventory: Array(41).fill(null),
    story: { ...story, otherProgress: { complete: true } }, dims: { overworld: {} } };
  const imported = await Saves.importFile({ text: async () => JSON.stringify(world) });
  assert.deepEqual((await Saves.load(imported.id)).story, world.story);
  const old = { ...world, story: { otherProgress: { complete: true } } };
  const migrated = await Saves.importFile({ text: async () => JSON.stringify(old) });
  assert.deepEqual((await Saves.load(migrated.id)).story, old.story);
}
console.log("Wildlife journal passed: sight and distance, behavior and den notes, distinct Ancient entry, save snapshots and JSON migration.");

{
  const rolls = values => () => values.shift() ?? 0.5;
  const f = fixture({ water: true, difficulty: "peaceful" });
  const spouts = [];
  f.manager.ctx.particles = (...args) => spouts.push(args);
  spawnWildlife(f.manager, 1, 1, rolls([0, 0, 0.26, 0.2, 0.3]));
  assert.equal(f.manager.list.length, 2);
  const [whale, partner] = f.manager.list;
  assert.equal(whale.sp, whaleId);
  assert.equal(partner.wild.podKey, whale.uid);
  assert.equal(whale.persist, false);
  const heading = whale.yaw;
  const a = whale.aabb();
  whale.yaw = Math.PI / 2;
  const b = whale.aabb();
  assert(a[5] - a[2] > a[3] - a[0] && b[3] - b[0] > b[5] - b[2]);
  whale.yaw = heading;
  whale.inWater = true;
  f.think(whale, 8);
  assert.equal(whale.wild.phase, "surface");
  const oldY = whale.pos.y, nextY = whale.goal.y;
  for (let step = 0; step < 240; step++) f.manager.swimPhysics(whale, 1 / 60);
  assert(nextY > oldY && Math.abs(whale.pos.y - nextY) < 0.65);
  f.player.pos = { ...whale.pos };
  f.think(whale, 12);
  assert.equal(spouts.length, 1);
  assert.equal(spouts[0][3], "whalespout");
  f.think(whale, 13);
  assert.equal(spouts.length, 1, "Only one spout per ascent");
  f.think(whale, 16.1);
  assert.equal(whale.wild.phase, "dive");
  for (let step = 0; step < 240; step++) f.manager.swimPhysics(whale, 1 / 60);
  assert(whale.pos.y < nextY - 1, JSON.stringify({ pos: whale.pos, goal: whale.goal, nextY }));
  f.think(whale, 21);
  assert.equal(whale.wild.phase, "migration");
  assert.equal(f.events.length, 0);
  assert(!marineWaterRoom(f.world, whale.def, 48.5, 18.5, 0.5, 0));
}

{
  const f = fixture({ water: true });
  const rolls = [0, 0, 0.24, 0.2];
  spawnWildlife(f.manager, 1, 1, () => rolls.shift() ?? 0.5);
  const [leader, follower] = f.manager.list;
  assert.equal(leader.sp, orcaId);
  assert.equal(follower.sp, orcaId);
  assert.equal(follower.wild.podKey, leader.uid);
  const prey = f.manager.add("minnow", leader.pos.x + 2, leader.pos.y + 1, leader.pos.z - 5);
  leader.inWater = follower.inWater = prey.inWater = true;
  follower.age = 1;
  f.think(leader, 1);
  f.think(follower, 1);
  assert(leader.wild.phase === "herd" && follower.wild.phase === "herd");
  assert.equal(leader.wild.prey, follower.wild.prey);
  assert.notDeepEqual(leader.goal, follower.goal);
  assert(follower.wild.until > leader.wild.until, "Pod members stagger their rushes");
  f.think(leader, 3.3);
  assert.equal(leader.wild.phase, "rush");
  leader.pos = { ...prey.pos, y: prey.pos.y - 1 };
  f.think(leader, 3.6);
  assert(prey.dead > 0);
  f.think(follower, 3.6);
  assert.equal(follower.wild.prey, null);
  assert.equal(f.events.length, 0, "Orcas hunt fish without targeting swimmers");
  const stored = f.manager.add(orcaId, 2.5, 9, 2.5, { hp: 38 });
  const chunk = { cx: 0, cz: 0, key: "0,0" };
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  assert(f.manager.list.some(e => e.uid === stored.uid && e.hp === 38));
  const shallow = fixture({ water: true });
  const deepId = shallow.world.id;
  shallow.world.get = shallow.world.id = (x, y, z) => y < 16 ? B.STONE : deepId(x, y, z);
  spawnWildlife(shallow.manager, 1, 1, () => 0.24);
  assert.equal(shallow.manager.list.length, 0);
}
console.log("Ocean wildlife passed: egg IDs, body orientation, water depth, whale breathing and diving, orca pod hunting, and saved eggs.");

{
  // The real generator produces shallower seas than the synthetic swimming fixture.
  const world = new World(new Generator("wildlife-ocean-review"));
  for (let cz = 60; cz <= 64; cz++) for (let cx = 92; cx <= 96; cx++) world.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => world;
  manager.ctx.player = () => ({ pos: { x: 1484.5, y: 30, z: 992.5 } });
  const rolls = [0, 0, 0.262, 0.95];
  spawnWildlife(manager, 1, 1, () => rolls.shift());
  assert.equal(manager.list[0]?.sp, whaleId);
  assert.deepEqual(manager.list[0].pos, { x: 1512.5, y: 24, z: 992.5 });
  assert.equal(world.mods.size, 0);
}
console.log("A seeded, unmodified ocean supports the whale's full spawn footprint.");

{
  const f = fixture({ water: true });
  const shark = f.manager.add(sharkId, 6, 12, 0);
  const orca = f.manager.add(orcaId, 3, 12, 0);
  const prey = f.manager.add("minnow", 9, 12, 0);
  for (const e of [shark, orca, prey]) e.inWater = true;
  shark.wild.prey = prey;
  f.think(shark, 1);
  assert.equal(shark.wild.phase, "avoid");
  assert.equal(shark.wild.prey, null);
  assert(shark.goal.x > shark.pos.x);
}

{
  const f = fixture({ water: true });
  const croc = f.manager.add(crocId, 8, 18.8, 0.5);
  const prey = f.manager.add("minnow", 13, 18, 0.5);
  croc.inWater = prey.inWater = true;
  f.think(croc, 1);
  assert.equal(croc.wild.phase, "lunge");
  assert.equal(croc.wild.prey, prey);
  assert(croc.goal.speed > croc.def.speed);
  croc.pos.x = 12;
  f.think(croc, 1.3);
  assert(prey.dead > 0);
  assert.equal(croc.wild.phase, "roll");
  croc.age = 1.55;
  f.manager.animate(croc, 0.07, 16, 1);
  assert(croc.root.rotation.z > 1);
  f.think(croc, 2);
  assert.equal(croc.wild.phase, "recover");
  f.manager.animate(croc, 0.07, 16, 1);
  assert.equal(croc.root.rotation.z, 0);
  croc.pos.y = 15;
  croc.onGround = false;
  croc.goal = { x: croc.pos.x, y: 18.99, z: croc.pos.z, speed: 2 };
  for (let step = 0; step < 190; step++) f.manager.physics(croc, 1 / 60);
  assert(croc.inWater && Math.abs(croc.pos.y - 18.99) < 0.55, "Croc floats just below the surface");

  const peace = fixture({ water: true, difficulty: "peaceful" });
  const peacefulCroc = peace.manager.add(crocId, 18, 10, 0.5);
  peacefulCroc.inWater = true;
  peace.think(peacefulCroc, 1);
  assert.equal(peacefulCroc.wild.phase, "ambush");
}

{
  const f = fixture({ water: true });
  const hippo = f.manager.add(hippoId, 15, 10, 0.5);
  hippo.inWater = true;
  f.think(hippo, 1);
  assert.equal(hippo.wild.phase, "warning");
  assert.equal(f.events.length, 0);
  f.think(hippo, 1.96);
  assert.equal(hippo.wild.phase, "charge");
  f.player.pos.z = 4;
  hippo.pos.x = 19.5;
  f.think(hippo, 2.2);
  assert.equal(f.events.length, 0, "A sidestep avoids the locked charge");
  f.player.pos.z = 0.5;
  f.think(hippo, 2.48);
  assert.equal(f.events[0][0], 11);
  f.think(hippo, 2.7);
  assert.equal(f.events.length, 1);
  const record = hippo.toJSON();
  assert.deepEqual(record.home, [15, 10, 0.5]);
  assert.equal(record.sp, hippoId);
}

{
  const w = new World(new Generator("wildlife-wetland-review"));
  for (let cz = -6; cz <= 0; cz++) for (let cx = -5; cx <= 4; cx++) w.load(cx, cz);
  for (const [species, site, roll] of [[crocId, [-7.5, -57.5], 0.3], [hippoId, [25.5, -34.5], 0.35]]) {
    const { manager } = fixture();
    manager.ctx.world = () => w;
    manager.ctx.player = () => ({ pos: { x: site[0] - 28, y: 30, z: site[1] } });
    const values = [0, 0, roll];
    spawnWildlife(manager, 1, 1, () => values.shift());
    const [animal] = manager.list;
    assert.equal(animal?.sp, species, "Spawn on the actual generated riverbank");
    assert.deepEqual([animal.pos.x, animal.pos.z], site);
    assert.equal(animal.persist, false);
  }
  assert.equal(w.mods.size, 0);
}
console.log("Wetlands passed: both generated spawns, crocodile lunge and roll, hippo charge and dodge, and water movement.");

{
  const f = fixture();
  f.world.get = f.world.id = (x, y) => x < 4 ?
    (y <= 10 ? B.STONE : B.AIR) : (y <= 7 ? B.STONE : y <= 10 ? B.WATER : B.AIR);
  for (const species of [crocId, hippoId]) {
    const animal = f.manager.add(species, 1.5, 11, 5.5);
    animal.goal = { x: 8.5, y: 9, z: 5.5, speed: 3 };
    for (let i = 0; i < 170; i++) f.manager.physics(animal, 1 / 60);
    assert(animal.inWater && animal.pos.x > 5.5, species + " crosses from land to water");
    animal.wild.phase = species === crocId ? "lunge" : "charge";
    animal.wild.rush = { x: -1, z: 0 };
    animal.goal = { x: 1.5, y: 11.1, z: 5.5, speed: 5.2 };
    for (let i = 0; i < 210; i++) f.manager.physics(animal, 1 / 60);
    assert(!animal.inWater && animal.pos.x < 3, species + " climbs onto a low bank during a rush: " +
      JSON.stringify([animal.pos, animal.vel, animal.inWater]));
    f.manager.clear();
  }
}
console.log("Both amphibious species cross into water and climb back onto a low bank during a rush.");

{
  const f = fixture({ water: true });
  const ink = [];
  const particles = (...args) => ink.push(args);
  f.manager.ctx.particles = particles;
  f.world.get = f.world.id = (x, y) => y < 5 ? B.STONE : y === 5 ? B.SAND : y <= 19 ? B.WATER : B.AIR;
  const octopus = f.manager.add(octopusId, 8, 6.12, 0.5);
  octopus.inWater = true;
  const original = octopus.mat.map;
  f.think(octopus, 1);
  assert.equal(octopus.wild.skin, 1, "Camouflage reads sand beneath the octopus");
  f.manager.animate(octopus, 0.07, 16, 1);
  assert.notEqual(octopus.mat.map, original);
  const shark = f.manager.add(sharkId, 12, 6.75, 0.5);
  shark.inWater = true;
  f.think(octopus, 2.1);
  assert.equal(octopus.wild.phase, "escape");
  assert.equal(ink.length, 1);
  assert.equal(ink[0][3], "ink");
  assert(octopus.goal?.x < octopus.pos.x, "Octopus jets away from the shark");
  f.manager.animate(octopus, 0.07, 16, 1);
  assert.equal(octopus.mat.map, original);
  f.think(octopus, 3.2);
  assert.equal(ink.length, 1, "Ink has a cooldown");
  assert.equal(f.events.length, 0);
  shark.gone = true;
  f.manager.damage(octopus, 1, "player");
  f.think(octopus, 16);
  assert.equal(ink.length, 2, "A hit causes a new ink plume after the cooldown");
  assert.equal(octopus.def.model.parts.filter(p => /^arm\d$/.test(p.name)).length, 8);
}

{
  const f = fixture({ water: true });
  f.world.get = f.world.id = (x, y, z) => y < 6 ? B.STONE :
    y === 6 ? B.CLAY : y <= 19 && x < 21 ? B.WATER : B.AIR;
  const manta = f.manager.add(mantaId, 11, 9, 0.5, { yaw: 0 });
  manta.inWater = true;
  f.player.pos = { x: 11.5, y: 9, z: 0.5 };
  f.think(manta, 1);
  assert.equal(manta.wild.phase, "guide");
  assert.equal(manta.goal.y, 8.18);
  assert(manta.goal.z < -3);
  for (let i = 0; i < 150; i++) f.manager.swimPhysics(manta, 1 / 60);
  assert(manta.pos.z < -3);
  f.player.inWater = false;
  f.think(manta, 4);
  assert.equal(manta.wild.phase, "glide");
  assert(manta.wild.nextGuide > 4);
  assert(!reefWaterFit(f.world, manta.def, 20.8, 9, 0.5, 0), "Fin clearance rejects a dry bank");
  assert.equal(f.events.length, 0, "Manta is peaceful");
  const s = manta.toJSON();
  assert.equal(s.hp, 24);
  assert.deepEqual(s.home, [11, 9, 0.5]);
}

{
  const world = new World(new Generator("wildlife-ocean-review"));
  for (let cz = 61; cz <= 64; cz++) for (let cx = 92; cx <= 96; cx++) world.load(cx, cz);
  for (const [species, roll] of [[octopusId, 0.4], [mantaId, 0.47]]) {
    const { manager } = fixture();
    manager.ctx.world = () => world;
    manager.ctx.player = () => ({ pos: { x: 1484.5, y: 30, z: 992.5 } });
    const values = [0, 0, roll];
    spawnWildlife(manager, 1, 1, () => values.shift());
    assert.equal(manager.list[0]?.sp, species);
    assert.equal(manager.list[0].persist, false);
    assert.equal(manager.list[0].pos.x, 1512.5);
    assert(reefSpawnSite(world, manager.list[0].def, 1512.5, 30, 992.5, 0));
  }
  assert.equal(world.mods.size, 0);
}
console.log("Reef wildlife passed: generated spawns, substrate camouflage, defensive ink, manta guidance and shoreline clearance.");

{
  const f = fixture();
  f.world.get = f.world.id = (x, y) => x < 4 ?
    (y < 10 ? B.STONE : y === 10 ? B.SAND : B.AIR) : (y <= 7 ? B.STONE : y <= 10 ? B.WATER : B.AIR);
  const seal = f.manager.add(sealId, 1.5, 11, 5.5, { variant: 1 });
  seal.wild.nextTrip = 7;
  f.think(seal, 8);
  assert.equal(seal.wild.phase, "slide");
  assert(seal.goal.x > 4);
  for (let i = 0; i < 100; i++) f.manager.physics(seal, 1 / 60);
  assert(seal.inWater);
  const prey = f.manager.add("minnow", 8.5, 8.7, 5.5);
  prey.inWater = true;
  f.think(seal, 10);
  assert.equal(seal.wild.phase, "dive");
  assert.equal(seal.wild.prey, prey);
  seal.pos = { x: 7.5, y: 8.8, z: 5.5 };
  f.think(seal, 11);
  assert(prey.dead > 0);
  f.think(seal, 29);
  assert.equal(seal.wild.phase, "haulOut");
  for (let i = 0; i < 230; i++) f.manager.physics(seal, 1 / 60);
  assert(!seal.inWater && seal.pos.x < 3);
  f.think(seal, 33);
  assert.equal(seal.wild.phase, "rest");
  assert.equal(seal.wild.ashoreAt, null);
  assert.equal(seal.variant, 1);
}

{
  const f = fixture();
  const home = [10, 10, 0.5];
  const walrus = f.manager.add(walrusId, ...home, { home });
  const calf = f.manager.add(walrusId, 9, 10, 2.5, { home, baby: true });
  const other = f.manager.add(walrusId, 13, 10, 1, { home: [13, 10, 1] });
  assert.equal(calf.hp, 24);
  assert.equal(walrus.hp, 62);
  f.player.pos.x = 15;
  f.think(walrus, 1);
  assert.equal(walrus.wild.phase, "rest");
  f.manager.damage(calf, 1, "player");
  assert(walrus.wild.defendUntil > 10);
  assert.equal(other.wild.defendUntil, undefined);
  f.think(calf, 1.52);
  assert.equal(calf.wild.phase, "retreat");
  f.think(walrus, 1.65);
  assert.equal(walrus.wild.phase, "warning");
  assert.equal(f.events.length, 0);
  f.think(walrus, 2.6);
  assert.equal(walrus.wild.phase, "defend");
  walrus.pos.x = 13;
  f.think(walrus, 2.8);
  assert.equal(f.events[0][0], 8);
  f.think(walrus, 3);
  assert.equal(f.events.length, 1);
  f.manager.animate(calf, 0.07, 16, 1);
  assert(!calf.parts.tusk1.visible);
}

console.log("Coastal wildlife passed: a seal slides, dives and returns ashore; walrus calves retreat and adults defend their own colony.");

{
  const w = new World(new Generator("wildlife-coast-review"));
  for (let cz = -74; cz <= -70; cz++) for (let cx = -68; cx <= -63; cx++) w.load(cx, cz);
  for (const [species, roll] of [[sealId, 0.17], [walrusId, 0.22]]) {
    const { manager } = fixture();
    manager.ctx.world = () => w;
    manager.ctx.player = () => ({ pos: { x: -1075.5, y: 31, z: -1151.5 } });
    const values = [0, 0, roll];
    spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.1);
    assert(manager.list.length >= 2 && manager.list.length <= 3, "Natural cold-coast colony for " + species);
    for (const e of manager.list) {
      assert.equal(e.sp, species);
      assert.equal(e.persist, false);
      assert.deepEqual(e.home, [-1047.5, 31, -1151.5]);
    }
    if (species === walrusId) assert(manager.list.some(e => e.baby));
  }
  assert.equal(w.mods.size, 0);
}
console.log("A seeded, unmodified cold coast supports both colonies and walrus calves.");

{
  const f = fixture();
  f.player.pos = { x: 82, y: 10, z: 0.5 };
  const prideHome = [-9.5, 10, 0.5], herdHome = [1.5, 10, 0.5];
  const male = f.manager.add(lionId, ...prideHome, { home: prideHome, variant: 0 });
  const female = f.manager.add(lionId, -9.5, 10, 3.5, { home: prideHome, variant: 1 });
  female.wild.role = 1;
  const zebra = f.manager.add(zebraId, ...herdHome, { home: herdHome });
  const member = f.manager.add(zebraId, 2.5, 10, 2.5, { home: herdHome });
  member.wild.role = 1;
  female.age = 1;
  f.manager.think(male, 0.65);
  assert.equal(male.wild.prey, zebra);
  assert.equal(female.wild.prey, zebra);
  f.think(male, 1);
  f.think(female, 1);
  assert.equal(male.wild.phase, "stalk");
  assert.equal(female.wild.phase, "stalk");
  assert(male.goal && female.goal && Math.abs(male.goal.z - female.goal.z) > 1);
  f.manager.animate(male, 0.08, 16, 1);
  f.manager.animate(female, 0.08, 16, 1);
  assert(male.parts.mane.visible && !female.parts.mane.visible);
  male.pos.x = -2;
  member.age = 1.8;
  f.think(zebra, 2);
  assert.equal(zebra.wild.phase, "flee");
  assert.equal(member.wild.phase, "flee");
  assert(zebra.goal.x > zebra.pos.x);
  const oldHealth = zebra.hp;
  male.pos.x = 0.5;
  f.think(male, 2.2);
  assert.equal(male.wild.phase, "pounce");
  assert.equal(zebra.hp, oldHealth - 8);
  assert.equal(member.wild.phase, "flee");
  assert.equal(f.events.length, 0);
}

{
  const f = fixture(), lion = f.manager.add(lionId, 15, 10, 0.5, { variant: 0 });
  f.think(lion, 14);
  assert.equal(lion.wild.phase, "sleep");
  f.player.pos.x = 17;
  f.think(lion, 15);
  assert.equal(lion.wild.phase, "warnPlayer");
  assert.equal(f.events.length, 0);
  f.think(lion, 16);
  assert.equal(lion.wild.phase, "guard");
  assert(f.events[0][0] > 0);
  const peace = fixture({ difficulty: "peaceful" });
  const passive = peace.manager.add(lionId, 18, 10, 0.5);
  peace.think(passive, 2);
  assert.equal(peace.events.length, 0);
}

console.log("Grassland wildlife passed: distinct pride roles, coordinated stalking, herd flight, lion predation and territorial warning.");

{
  const f = fixture();
  f.player.pos.x = 120;
  const lion = f.manager.add(lionId, -7.5, 10, 0.5, { yaw: -Math.PI / 2 });
  const zebra = f.manager.add(zebraId, 1.5, 10, 0.5, { yaw: -Math.PI / 2 });
  f.world.isLoaded = () => true;
  let sprinted = false;
  for (let frame = 0; frame < 900 && zebra.hp === 22; frame++) {
    for (const e of [lion, zebra]) {
      e.age += 1 / 60;
      if (frame % 9 === 0) f.manager.think(e, 0.55);
      f.manager.physics(e, 1 / 60);
    }
    sprinted ||= lion.wild.phase === "chase" && zebra.wild.phase === "flee";
  }
  assert(sprinted && zebra.hp < 22, "Pursuit reaches the zebra through normal movement and damage");
}

{
  const w = new World(new Generator("wildlife-grassland-review"));
  for (let cz = -26; cz <= -22; cz++) for (let cx = -21; cx <= -15; cx++) w.load(cx, cz);
  for (const [species, roll, expected] of [[zebraId, 0.3, 4], [lionId, 0.43, 2]]) {
    const { manager } = fixture();
    manager.ctx.world = () => w;
    manager.ctx.player = () => ({ pos: { x: -307.5, y: 36, z: -383.5 } });
    const values = [0, 0, roll, species === zebraId ? 0.1 : 0.5];
    spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.1);
    assert.equal(manager.list.length, expected, "Generated grassland can hold the " + species + " group");
    assert(manager.list.every(e => e.sp === species && !e.persist));
    assert.deepEqual(manager.list[0].home, [-279.5, 36, -383.5]);
  }
  assert.equal(w.mods.size, 0);
}

console.log("Normal movement produced a successful lion chase, and generated grassland supported both groups.");

{
  const f = fixture();
  f.player.pos.x = 70;
  const tiger = f.manager.add(tigerId, 2, 10, 0.5, { yaw: -Math.PI / 2 });
  const leader = f.manager.add(deerId, 12, 10, 0.5, { home: [12, 10, 0.5], variant: 1 });
  const doe = f.manager.add(deerId, 12, 10, 3.5, { home: leader.home, variant: 0 });
  f.think(tiger, 1);
  assert.equal(tiger.wild.phase, "stalk");
  assert.equal(tiger.wild.prey, leader);
  f.manager.animate(leader, 0.08, 16, 1);
  f.manager.animate(doe, 0.08, 16, 1);
  assert(leader.parts.antler1.visible && !doe.parts.antler1.visible);
  tiger.pos.x = 8.25;
  tiger.onGround = true;
  f.think(tiger, 2);
  assert.equal(tiger.wild.phase, "leap");
  assert(tiger.wantJump);
  f.manager.physics(tiger, 1 / 60);
  assert(tiger.vel.y > 0 && tiger.vel.y <= 4.4);
  f.think(leader, 2.3);
  assert.equal(leader.wild.phase, "flee");
  assert.equal(doe.wild.phase, "flee");
  tiger.pos = { x: 10, y: 10, z: 0.5 };
  f.think(tiger, 2.52);
  assert.equal(leader.hp, 8);
  assert.equal(tiger.wild.phase, "recover");
  f.think(tiger, 2.7);
  assert.equal(leader.hp, 8);
  assert.equal(f.events.length, 0);
}

{
  const f = fixture();
  const deer = f.manager.add(deerId, 6.5, 10, 5.5);
  f.world.get = f.world.id = (x, y, z) => x === 7 && z === 5 && y === 9 ? B.WATER :
    y < 9 ? B.STONE : y === 9 ? B.GRASS : B.AIR;
  f.think(deer, 7);
  assert.equal(deer.wild.phase, "drink");
}

console.log("Woodland wildlife passed: tiger stalking, actual leap physics and a single strike; antler variation, herd flight and drinking.");

{
  const w = new World(new Generator("wildlife-woodland-review"));
  for (let cz = -47; cz <= -43; cz++) for (let cx = -20; cx <= -15; cx++) w.load(cx, cz);
  for (const [species, roll] of [[tigerId, 0.25], [deerId, 0.52]]) {
    const { manager } = fixture();
    manager.ctx.world = () => w;
    manager.ctx.player = () => ({ pos: { x: -299.5, y: 33, z: -719.5 } });
    const values = [0, 0, roll];
    spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.1);
    assert(manager.list.every(e => !e.persist && e.sp === species));
    assert.equal(manager.list[0]?.sp, species);
    assert.deepEqual(manager.list[0].home, [-271.5, 33, -719.5]);
    assert(species === tigerId ? manager.list.length === 1 : manager.list.length >= 2);
  }
  assert.equal(w.mods.size, 0);
}
console.log("A seeded woodland supports the solitary tiger and a small deer herd without terrain changes.");

{
  const f = fixture();
  const trunk = { x: 5, z: 5 }, removed = new Set();
  f.world.id = f.world.get = (x, y, z) => y < 9 ? B.STONE : y === 9 ? B.GRASS :
    (x === trunk.x && z === trunk.z && y <= 15 && !removed.has(y)) ? B.BIRCH_LOG :
    (y === 13 || y === 14) && Math.abs(x - trunk.x) <= 2 && Math.abs(z - trunk.z) <= 2 ? B.BIRCH_LEAVES : B.AIR;
  const panda = f.manager.add(pandaId, 6.5, 10, 5.5, { yaw: Math.PI / 2 });
  f.player.pos = { x: 20, y: 10, z: 5.5 };
  let climbed = false, explored = false, rested = false;
  for (let frame = 0; frame < 450 && !rested; frame++) {
    panda.age += 1 / 60;
    if (frame % 9 === 0) f.manager.think(panda, 0.7);
    f.manager.physics(panda, 1 / 60);
    climbed ||= panda.wild.phase === "climbTree" && panda.pos.y > 10.9;
    explored ||= panda.wild.phase === "branch";
    rested ||= panda.wild.phase === "treeRest";
  }
  assert(climbed && explored && rested && panda.pos.y > 11.3, "Panda climbs and traverses the trunk through normal physics: " + JSON.stringify({climbed, explored, rested, position:panda.pos, wild:panda.wild}));
  removed.add(11);
  f.manager.think(panda, 0.7);
  assert.equal(panda.wild.tree, null);
  assert.equal(panda.wild.phase, "forage");
  for (let frame = 0; frame < 85; frame++) f.manager.physics(panda, 1 / 60);
  assert(panda.pos.y < 10.25, "Panda drops to the ground when the support is removed");
  f.manager.ctx.heldId = () => I.BERRIES;
  f.player.pos.x = panda.pos.x + 2.5;
  f.player.pos.z = panda.pos.z;
  f.think(panda, panda.age + 0.1);
  assert.equal(panda.wild.phase, "berries");
}

{
  const f = fixture();
  const home = [10, 10, 0.5];
  const cow = f.manager.add(mooseId, ...home, { home, variant: 0 });
  const calf = f.manager.add(mooseId, 9, 10, 2.5, { home, baby: true });
  const bull = f.manager.add(mooseId, 16, 10, 1, { variant: 1, home: [16, 10, 1] });
  assert.equal(calf.hp, 25);
  f.player.pos.x = 15;
  f.think(cow, 1);
  assert.equal(cow.wild.phase, "browse");
  f.manager.damage(calf, 1, "player");
  assert(cow.wild.defendUntil > 10);
  assert.equal(bull.wild.defendUntil, undefined);
  f.think(calf, 1.3);
  assert.equal(calf.wild.phase, "retreat");
  f.think(cow, 1.6);
  assert.equal(cow.wild.phase, "warning");
  f.think(cow, 2.8);
  assert.equal(cow.wild.phase, "charge");
  cow.pos.x = 13;
  f.think(cow, 3);
  assert.equal(f.events[0][0], 11);
  f.think(cow, 3.2);
  assert.equal(f.events.length, 1);
  f.manager.animate(bull, 0.08, 16, 1);
  f.manager.animate(calf, 0.08, 16, 1);
  assert(bull.parts.antler1.visible && !calf.parts.antler1.visible);
}

console.log("Taiga wildlife passed: red panda climbing, branch travel, rest, loss of support and berries; moose calf retreat and one-hit charge.");

{
  const f = fixture();
  f.player.pos = { x: 22, y: 11, z: 5.5 };
  f.world.id = f.world.get = (x, y) => x < 4 ?
    (y < 10 ? B.STONE : y === 10 ? B.GRASS : B.AIR) : y <= 7 ? B.STONE : y <= 10 ? B.WATER : B.AIR;
  const moose = f.manager.add(mooseId, 9.5, 8.2, 5.5, { home: [1.5, 11, 5.5] });
  moose.inWater = true;
  for (let frame = 0; frame < 350; frame++) {
    moose.age += 1 / 60;
    if (frame % 9 === 0) f.manager.think(moose, 0.8);
    f.manager.physics(moose, 1 / 60);
    if (!moose.inWater && moose.pos.x < 3) break;
  }
  assert(!moose.inWater && moose.pos.x < 3, "A moose can wade and walk onto a low bank: " + JSON.stringify({pos:moose.pos,phase:moose.wild.phase,goal:moose.goal,vel:moose.vel}));
}

{
  const w = new World(new Generator("wildlife-taiga-review"));
  for (let cz = -47; cz <= -43; cz++) for (let cx = -9; cx <= -4; cx++) w.load(cx, cz);
  for (const [species, roll] of [[mooseId, 0.63], [pandaId, 0.69]]) {
    const { manager } = fixture();
    manager.ctx.world = () => w;
    manager.ctx.player = () => ({ pos: { x: -123.5, y: 33, z: -719.5 } });
    const values = [0, 0, roll];
    spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.1);
    const [animal] = manager.list;
    assert.equal(animal?.sp, species);
    assert.equal(animal.persist, false);
    assert.deepEqual(animal.home, [-95.5, 33, -719.5]);
    if (species === pandaId) assert(animal.wild.tree.top > animal.pos.y + 1.6);
  }
  assert.equal(w.mods.size, 0);
}
console.log("A moose waded onto a bank, and generated birch woodland supported both species without terrain changes.");

{
  const f = fixture();
  const home = [10.5, 10, 5.5];
  const leader = f.manager.add(giraffeId, ...home, { home });
  const follower = f.manager.add(giraffeId, 13.5, 10, 5.5, { home });
  follower.wild.role = 1;
  f.world.id = f.world.get = (x, y, z) => x === 12 && y === 14 && z === 5 ? B.LEAVES :
    y < 9 ? B.STONE : y === 9 ? B.GRASS : B.AIR;
  f.think(leader, 7);
  assert.equal(leader.wild.phase, "treetop");
  assert.equal(leader.yaw, -Math.PI / 2);
  f.world.id = f.world.get = (x, y) => y < 9 ? B.STONE : y === 9 ? B.GRASS : B.AIR;
  f.think(leader, 8);
  assert.equal(leader.wild.phase, "graze");
  const lion = f.manager.add(lionId, 8.5, 10, 5.5);
  f.think(leader, 9);
  assert.equal(leader.wild.phase, "flee");
  assert.equal(follower.wild.phase, "flee");
  assert.equal(lion.hp, lion.def.hp - 6);
  assert(leader.wild.kickPoseUntil > leader.age);
  f.think(leader, 9.2);
  assert.equal(lion.hp, lion.def.hp - 6);
}

{
  const f = fixture();
  f.player.pos = { x: 14.5, y: 10, z: 5.5 };
  const rhino = f.manager.add(rhinoId, 10.5, 10, 5.5);
  f.think(rhino, 9);
  assert.equal(rhino.wild.phase, "rhinoGraze");
  f.manager.damage(rhino, 1, "player");
  f.think(rhino, 10);
  assert.equal(rhino.wild.phase, "rhinoWarn");
  f.think(rhino, 11.1);
  assert.equal(rhino.wild.phase, "rhinoCharge");
  f.player.pos.z += 2.2;
  rhino.pos.x += 2.5;
  f.think(rhino, 11.25);
  assert.equal(f.events.length, 0, "Stepping to the side avoids a charge");
  f.player.pos.z -= 2.2;
  f.think(rhino, 11.45);
  assert.equal(f.events[0][0], 12);
  f.think(rhino, 11.6);
  assert.equal(f.events.length, 1);
  assert.equal(rhino.wild.phase, "rhinoRecover");
  const chunk = { cx: 0, cz: 0, key: "0,0" };
  const uid = rhino.uid, health = rhino.hp;
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const [saved] = f.manager.list;
  assert.equal(saved.sp, rhinoId);
  assert.equal(saved.uid, uid);
  assert.equal(saved.hp, health);
  assert.equal(saved.wild.chargeSource, undefined);
}

{
  const f = fixture({ difficulty: "peaceful" });
  f.player.pos = { x: 14.5, y: 10, z: 5.5 };
  const rhino = f.manager.add(rhinoId, 10.5, 10, 5.5);
  f.manager.damage(rhino, 1, "player");
  f.think(rhino, 1);
  assert.notEqual(rhino.wild.phase, "rhinoWarn");
  const lion = f.manager.add(lionId, 14.5, 10, 5.5);
  rhino.iframes = 0;
  f.manager.damage(rhino, 1, lion);
  f.think(rhino, 2);
  assert.equal(rhino.wild.phase, "rhinoWarn");
  f.think(rhino, 3.1);
  assert.equal(rhino.wild.phase, "rhinoCharge");
  rhino.pos.x += 2.5;
  f.think(rhino, 3.3);
  assert.equal(lion.hp, lion.def.hp - 10);
  assert(lion.vel.x > 0);
}

{
  const w = new World(new Generator("wildlife-grassland-review"));
  for (let cz = -26; cz <= -22; cz++) for (let cx = -21; cx <= -15; cx++) w.load(cx, cz);
  for (const [species, roll, expected] of [[giraffeId, 0.76, 2], [rhinoId, 0.83, 1]]) {
    const { manager } = fixture();
    manager.ctx.world = () => w;
    manager.ctx.player = () => ({ pos: { x: -298.5, y: 36, z: -395.5 } });
    const values = [0, 0, roll, 0.5];
    spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
    assert.equal(manager.list.length, expected, "Generated plains spawn " + species);
    assert(manager.list.every(e => e.sp === species && !e.persist));
  }
  assert.equal(w.mods.size, 0);
}
console.log("Savanna wildlife passed: generated spawns, canopy browsing, herd flight, defensive kick, and avoidable one-hit rhino charges.");

{
  const f = fixture();
  f.player.pos = { x: 15.5, y: 10, z: 5.5 };
  const rhino = f.manager.add(rhinoId, 10.5, 10, 5.5);
  f.manager.damage(rhino, 1, "player");
  for (let frame = 0; frame < 175; frame++) {
    rhino.age += 1 / 60;
    if (frame % 9 === 0) f.manager.think(rhino, 1);
    f.manager.physics(rhino, 1 / 60);
  }
  assert(rhino.pos.x > 13 && f.events.length === 1, "Rhino reaches its target using normal charge physics");
}
console.log("A rhino reached its target and landed one hit through normal movement.");

{
  const f = fixture();
  const rhino = f.manager.add(rhinoId, 10.5, 10, 5.5);
  rhino.onGround = true;
  f.world.id = f.world.get = (x, y, z) => x === 12 && z === 5 && y === 9 ? B.WATER :
    x === 12 && z === 5 && y === 8 ? B.CLAY : y === 9 ? B.GRASS : y < 9 ? B.STONE : B.AIR;
  f.think(rhino, 18);
  assert.equal(rhino.wild.phase, "wallow");
  assert.equal(rhino.goal, null);
  f.manager.animate(rhino, 0.1, 16, 1);
  assert(rhino.root.position.y < -0.1);
  f.player.pos = { x: 13.5, y: 10, z: 5.5 };
  f.manager.damage(rhino, 1, "player");
  f.think(rhino, 18.6);
  assert.equal(rhino.wild.phase, "rhinoWarn");
}
console.log("A rhino wallowed at a shallow clay bank and interrupted the pose when provoked.");

{
  const f = fixture(), home = [10.5, 10, 5.5], drops = [];
  f.manager.ctx.drop = (...args) => drops.push(args);
  const hen = f.manager.add(ostrichId, ...home, { home, variant: 1, eggT: 0.25 });
  const male = f.manager.add(ostrichId, 15.5, 10, 5.5, { home, variant: 0, eggT: 0 });
  const chick = f.manager.add(ostrichId, 10.5, 10, 1.5, { home, variant: 1, baby: true, growT: 80, eggT: 0 });
  assert.notEqual(hen.mat.map, male.mat.map);
  assert.equal(itemDef(I.OSTRICH_EGG).name, "Ostrich Egg");
  assert.notEqual(I.OSTRICH_EGG, I.EGG);
  f.think(hen, 7);
  f.think(male, 7);
  f.think(chick, 7);
  for (let frame = 0; frame < 45; frame++) {
    for (const bird of [hen, male, chick]) f.manager.physics(bird, 1 / 60);
  }
  assert.deepEqual(drops.map(d => d.slice(0, 2)), [[I.OSTRICH_EGG, 1]]);
  assert.equal(hen.wild.phase, "lay");
  assert(hen.eggT >= 420 && hen.eggT <= 660);
  const chunk = { cx: 0, cz: 0, key: "0,0" };
  const savedEggT = Math.round(hen.eggT), uid = hen.uid;
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const restored = f.manager.list.find(e => e.uid === uid);
  assert.equal(restored.variant, 1);
  assert.equal(restored.eggT, savedEggT);
  assert.equal(restored.wild.layUntil, undefined);
  const eggSlot = { id: I.OSTRICH_EGG, n: 1 };
  const world = { blockhaven: SAVE_VERSION, version: SAVE_VERSION, name: "Ostrich reload",
    seed: "wildlife-grassland-review", mode: "survival", player: { pos: { x: 1, y: 10, z: 1 } },
    inventory: [eggSlot, ...Array(40).fill(null)], story: {},
    dims: { overworld: { entities: f.manager.toJSON() } } };
  const imported = await Saves.importFile({ text: async () => JSON.stringify(world) });
  const copy = await Saves.load(imported.id);
  assert.deepEqual(copy.inventory[0], eggSlot);
  assert.equal(copy.dims.overworld.entities["0,0"].find(e => e.uid === uid).eggT, savedEggT);
}

{
  const f = fixture(), home = [10.5, 10, 5.5];
  const leader = f.manager.add(ostrichId, ...home, { home, variant: 1, eggT: 0 });
  const follower = f.manager.add(ostrichId, 10.5, 10, 8.5, { home, variant: 0 });
  f.manager.ctx.drop = () => assert.fail("A sprinting ostrich must not lay");
  follower.wild.role = 1;
  const lion = f.manager.add(lionId, 8.5, 10, 5.5);
  f.think(leader, 7);
  assert.equal(leader.wild.phase, "flee");
  assert.equal(follower.wild.phase, "flee");
  assert.equal(lion.hp, lion.def.hp - 7);
  assert.equal(leader.goal.speed, 8.5);
  let fastest = 0;
  for (let frame = 0; frame < 30; frame++) {
    leader.age += 1 / 60;
    f.manager.physics(leader, 1 / 60);
    fastest = Math.max(fastest, Math.hypot(leader.vel.x, leader.vel.z));
  }
  assert(fastest > 8, "An ostrich physically reaches sprint speed");
}

{
  const w = new World(new Generator("wildlife-grassland-review"));
  for (let cz = -26; cz <= -22; cz++) for (let cx = -21; cx <= -15; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: -298.5, y: 36, z: -395.5 } });
  const values = [0, 0, 0.89, 0.5, 0.75];
  spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
  assert.equal(manager.list.length, 2);
  assert(manager.list.every(e => e.sp === ostrichId && !e.persist));
  assert.deepEqual(manager.list.map(e => e.variant), [0, 1]);
  assert.deepEqual(manager.list[0].home, manager.list[1].home);
  assert.equal(w.mods.size, 0);
}
console.log("Ostrich passed: generated flock, both plumages, herd flight, defensive kick, physical sprint, grounded egg laying, and saved egg timer.");

{
  const f = fixture();
  const missing = new Set();
  f.world.id = f.world.get = (x, y, z) => y < 9 ? B.STONE : y === 9 ? B.GRASS :
    x === 5 && z === 5 && y <= 16 ? B.LOG :
    (y === 14 || y === 15) && Math.abs(x - 5) <= 2 && Math.abs(z - 5) <= 2 &&
      !missing.has(x + "," + y + "," + z) ? B.LEAVES : B.AIR;
  f.player.pos = { x: 20, y: 10, z: 5.5 };
  const sloth = f.manager.add(slothId, 8.5, 10, 5.5, { yaw: Math.PI / 2 });
  let climbed = false, crossed = false, slept = false, verticalSpeed = 0;
  for (let frame = 0; frame < 1050 && !slept; frame++) {
    sloth.age += 1 / 60;
    if (frame % 9 === 0) f.manager.think(sloth, 0.7);
    f.manager.physics(sloth, 1 / 60);
    if (sloth.wild.phase === "climbTree") {
      climbed ||= sloth.pos.y > 11;
      verticalSpeed = Math.max(verticalSpeed, sloth.vel.y);
    }
    crossed ||= sloth.wild.phase === "branch";
    slept ||= sloth.wild.phase === "treeRest" && sloth.wild.restUntil > sloth.age + 40;
  }
  assert(climbed && crossed && slept, JSON.stringify({ climbed, crossed, slept, pos: sloth.pos, state: sloth.wild }));
  assert(verticalSpeed > 0.6 && verticalSpeed < 0.76);
  f.manager.animate(sloth, 0.8, 16, 1);
  assert(sloth.root.rotation.z > 3 && sloth.parts.eye1.scale.y < 0.3);
  const journal = {};
  const eye = { x: sloth.pos.x - 3, y: sloth.pos.y + sloth.h * 0.57, z: sloth.pos.z };
  observeWildlife(journal, [sloth], eye, { x: 1, y: 0, z: 0 }, 4, () => true);
  assert.equal(journal.wildlife?.sloth?.behavior, true);

  const chunk = { cx: 0, cz: 0, key: "0,0" };
  const uid = sloth.uid;
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const restored = f.manager.list.find(e => e.uid === uid);
  f.think(restored, 0.15);
  assert.equal(restored.wild.phase, "treeRest", "Sloth reacquires canopy support after reload");
  const branch = restored.wild.tree.branch;
  missing.add([Math.floor(branch.x), 14, Math.floor(branch.z)].join(","));
  f.think(restored, 0.3);
  assert.equal(restored.wild.phase, "forage");
  assert.equal(restored.wild.tree, null);
  for (let frame = 0; frame < 75; frame++) f.manager.physics(restored, 1 / 60);
  assert(restored.pos.y < 10.2, "Removing canopy support makes the sloth fall");
}

{
  const w = new World(new Generator("wildlife-woodland-review"));
  for (let cz = -47; cz <= -43; cz++) for (let cx = -20; cx <= -15; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: -290.5, y: 40, z: -742.5 } });
  const values = [0, 0, 0.944];
  spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
  const [sloth] = manager.list;
  assert.equal(sloth?.sp, slothId);
  assert.equal(sloth.persist, false);
  assert.equal(w.id(Math.floor(sloth.wild.tree.branch.x), 43, Math.floor(sloth.wild.tree.branch.z)), B.LEAVES);
  assert.equal(sloth.wild.phase, "treeRest");
  assert.deepEqual(sloth.pos, sloth.wild.tree.branch);
  const tree = sloth.wild.tree;
  manager.clear();
  const climber = manager.add(slothId, tree.from.x, tree.from.y, tree.from.z);
  climber.wild.tree = tree;
  for (let frame = 0; frame < 1000 && climber.wild.phase !== "treeRest"; frame++) {
    climber.age += 1 / 60;
    if (frame % 9 === 0) manager.think(climber, 0.7);
    manager.physics(climber, 1 / 60);
  }
  assert.equal(climber.wild.phase, "treeRest", JSON.stringify({ pos: climber.pos, wild: climber.wild, goal: climber.goal }));
  climber.wild.restUntil = climber.age;
  for (let frame = 0; frame < 1000 && climber.wild.phase !== "forage"; frame++) {
    climber.age += 1 / 60;
    if (frame % 9 === 0) manager.think(climber, 0.7);
    manager.physics(climber, 1 / 60);
  }
  assert.equal(climber.wild.phase, "forage");
  assert(Math.abs(climber.pos.y - tree.base) < 0.33 && climber.wild.groundUntil > climber.age);
  assert.equal(w.mods.size, 0);
}
console.log("Sloth passed: warm woodland spawn, physical climb and traverse, suspended sleep, journal observation, chunk reload, and loss of canopy support.");

{
  const f = fixture();
  let broken = false;
  f.world.id = f.world.get = (x, y, z) => y < 9 ? B.STONE : y === 9 ? B.GRASS :
    x === 5 && z === 5 && y <= 15 && (!broken || y !== 12) ? B.BIRCH_LOG :
    (y === 14 || y === 15) && Math.abs(x - 5) <= 2 && Math.abs(z - 5) <= 2 ? B.BIRCH_LEAVES : B.AIR;
  f.player.pos = { x: 20, y: 10, z: 5.5 };
  const koala = f.manager.add(koalaId, 7.5, 10, 5.5);
  let climbed = false, fed = false, slept = false;
  for (let frame = 0; frame < 1150 && !slept; frame++) {
    koala.age += 1 / 60;
    if (frame % 9 === 0) f.manager.think(koala, 0.7);
    f.manager.physics(koala, 1 / 60);
    climbed ||= koala.wild.phase === "climbTree" && koala.pos.y > 10.8;
    fed ||= koala.wild.phase === "leafFeed";
    slept ||= koala.wild.phase === "treeRest";
  }
  assert(climbed && fed && slept, JSON.stringify({ climbed, fed, slept, pos: koala.pos, state: koala.wild }));
  f.manager.animate(koala, 0.8, 16, 1);
  assert(koala.parts.eye1.scale.y < 0.3 && koala.parts.arm1.rotation.x < -0.8);
  assert.equal(koala.root.rotation.z, 0);
  const journal = {};
  const eye = { x: koala.pos.x - 3, y: koala.pos.y + koala.h * 0.57, z: koala.pos.z };
  observeWildlife(journal, [koala], eye, { x: 1, y: 0, z: 0 }, 4, () => true);
  assert.equal(journal.wildlife?.koala?.behavior, true);

  const chunk = { cx: 0, cz: 0, key: "0,0" };
  const uid = koala.uid;
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const restored = f.manager.list.find(e => e.uid === uid);
  f.think(restored, 0.15);
  assert.equal(restored.wild.phase, "treeRest");
  assert(restored.goal.y > 12);
  broken = true;
  f.think(restored, 0.3);
  assert.equal(restored.wild.phase, "forage");
  assert.equal(restored.wild.tree, null);
  for (let frame = 0; frame < 78; frame++) f.manager.physics(restored, 1 / 60);
  assert(restored.pos.y < 10.2);
}

{
  const w = new World(new Generator("wildlife-taiga-review"));
  for (let cz = -47; cz <= -43; cz++) for (let cx = -9; cx <= -4; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: -129.5, y: 34, z: -737.5 } });
  const roll = () => {
    const values = [0, 0, 0.981];
    return () => values.shift() ?? 0.5;
  };
  spawnWildlife(manager, 1, 1, roll());
  const [koala] = manager.list;
  assert.equal(koala?.sp, koalaId);
  assert.equal(koala.persist, false);
  assert.equal(koala.wild.phase, "leafFeed");
  const tree = koala.wild.tree;
  assert.equal(w.id(tree.x, tree.base, tree.z), B.BIRCH_LOG);
  assert.deepEqual(koala.pos, { ...tree.from, y: tree.top });
  spawnWildlife(manager, 8, 1, roll());
  assert.equal(manager.list.length, 1);
  manager.clear();
  const climber = manager.add(koalaId, tree.from.x, tree.from.y, tree.from.z);
  climber.wild.tree = tree;
  for (let frame = 0; frame < 750 && climber.wild.phase !== "leafFeed"; frame++) {
    climber.age += 1 / 60;
    if (frame % 9 === 0) manager.think(climber, 0.7);
    manager.physics(climber, 1 / 60);
  }
  assert.equal(climber.wild.phase, "leafFeed");
  assert.equal(w.mods.size, 0);
}
console.log("Koala passed: rare birch spawn, canopy feeding and sleep, physical climb, journal observation, reload and loss of trunk support.");

{
  const f = fixture(), home = [9.5, 10, 5.5];
  const cock = f.manager.add(peacockId, ...home, { home, variant: 0 });
  const hen = f.manager.add(peacockId, 12.5, 10, 5.5, { home, variant: 1 });
  cock.onGround = hen.onGround = true;
  hen.wild.role = 1;
  f.think(cock, 7);
  assert.equal(cock.wild.phase, "display");
  assert.equal(cock.yaw, -Math.PI / 2);
  assert.equal(cock.goal, null);
  f.think(cock, 8);
  assert.equal(cock.wild.phase, "display");
  f.manager.animate(cock, 0.8, 16, 1);
  f.manager.animate(hen, 0.8, 16, 1);
  assert(cock.parts.fan.visible && !hen.parts.fan.visible && hen.parts.shortTail.visible);
  assert(Math.abs(cock.parts.fan.rotation.x) < 0.2 && cock.parts.feather4.rotation.z > 1.2);
  const journal = {};
  observeWildlife(journal, [cock], { x: 6.5, y: 10.9, z: 5.5 }, { x: 1, y: 0, z: 0 }, 3, () => true);
  assert.equal(journal.wildlife.peacock.behavior, true);
  f.manager.damage(cock, 1, "player");
  f.think(cock, 8.3);
  assert.equal(cock.wild.phase, "flee");
  assert.equal(hen.wild.phase, "flee");
  f.manager.animate(cock, 0.8, 16, 1);
  assert(cock.parts.fan.rotation.x < -1.4);
  const chunk = { cx: 0, cz: 0, key: "0,0" };
  const uid = hen.uid;
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const savedHen = f.manager.list.find(e => e.uid === uid);
  assert.equal(savedHen.variant, 1);
  assert.equal(savedHen.wild.displayUntil, undefined);
}

{
  const f = fixture();
  const cock = f.manager.add(peacockId, 9.5, 10, 5.5, { variant: 0 });
  f.manager.add(peacockId, 12.5, 10, 5.5, { variant: 1 });
  cock.onGround = true;
  f.manager.think(cock, 0.2);
  assert.notEqual(cock.wild.phase, "display");
  const terrain = f.world.id;
  f.world.id = f.world.get = (x, y, z) => x === 8 && y === 11 && z === 5 ? B.LOG : terrain(x, y, z);
  f.think(cock, 7);
  assert.equal(cock.wild.phase, "graze");
  f.world.id = f.world.get = terrain;
  f.think(cock, 18);
  assert.equal(cock.wild.phase, "display");
  f.manager.think(cock, 0.2);
  assert.notEqual(cock.wild.phase, "display");
}

{
  const w = new World(new Generator("wildlife-woodland-review"));
  for (let cz = -47; cz <= -43; cz++) for (let cx = -20; cx <= -15; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: -291.5, y: 39, z: -742.5 } });
  const values = [0, 0, 0.892];
  spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
  assert.equal(manager.list.length, 2);
  assert(manager.list.every(e => e.sp === peacockId && !e.persist));
  assert.deepEqual(manager.list.map(e => e.variant), [0, 1]);
  assert.equal(w.mods.size, 0);
}
console.log("Peacock passed: seeded forest edge spawns, peacock and peahen variants, display, obstruction and daylight checks, flock flight, journal, and save reload.");

{
  const f = fixture(), effects = [];
  f.world.id = f.world.get = (x, y) => y < 9 ? B.STONE : y === 9 ? B.SAND : y === 10 ? B.WATER : B.AIR;
  f.world.surfaceY = () => 10;
  f.player.pos = { x: 17, y: 11, z: 5.5 };
  f.manager.ctx.particles = (...args) => effects.push(args);
  const home = [10.5, 10, 5.5];
  const bird = f.manager.add(flamingoId, ...home, { home });
  const mate = f.manager.add(flamingoId, 10.5, 10, 8.5, { home });
  mate.wild.role = 1;
  const initial = { ...bird.pos };
  for (let frame = 0; frame < 135; frame++) {
    bird.age += 1 / 60;
    if (frame % 9 === 0) f.manager.think(bird, 0.8);
    f.manager.physics(bird, 1 / 60);
  }
  assert(bird.inWater && bird.onGround && bird.pos.y === 10);
  assert(Math.hypot(bird.pos.x - initial.x, bird.pos.z - initial.z) > 1, "Bird walks on the submerged bed");
  f.think(bird, 8);
  assert.equal(bird.wild.phase, "filterFeed");
  assert.equal(bird.goal, null);
  assert(effects.some(args => args[3] === "splash"));
  f.manager.animate(bird, 0.8, 16, 1);
  bird.mesh.updateMatrixWorld(true);
  const bill = bird.parts.beakTip.getWorldPosition(new THREE.Vector3());
  assert(bill.y < 11.25 && bill.y > 10, "Bill reaches the water surface: " + bill.y);
  f.think(bird, 14);
  assert.equal(bird.wild.phase, "oneLeg");
  f.manager.animate(bird, 0.8, 16, 1);
  assert(bird.parts["leg-1Shin"].rotation.x < -2 && Math.abs(bird.parts.leg1Shin.rotation.x) < 0.4);
  const journal = {};
  const eye = { x: bird.pos.x - 3, y: bird.pos.y + bird.h * 0.57, z: bird.pos.z };
  observeWildlife(journal, [bird], eye, { x: 1, y: 0, z: 0 }, 3, () => true);
  assert.equal(journal.wildlife.flamingo.behavior, true);
  f.manager.add(crocId, bird.pos.x - 4, 10, bird.pos.z);
  f.think(bird, 15.5);
  assert.equal(bird.wild.phase, "startled");
  assert(bird.goal && bird.goal.x > bird.pos.x);
  assert(mate.wild.alertUntil > 0);
  const chunk = { cx: 0, cz: 0, key: "0,0" };
  const uid = bird.uid;
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const restored = f.manager.list.find(e => e.uid === uid);
  assert.equal(restored.sp, flamingoId);
  assert.deepEqual(restored.home, bird.home);
  assert.equal(restored.wild.alertUntil, undefined);
}

{
  const w = new World(new Generator("wildlife-wetland-review"));
  for (let cz = -13; cz <= -11; cz++) for (let cx = 1; cx <= 3; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: 7.5, y: 31, z: -188.5 } });
  const values = [0, 0, 0.55, 0.2];
  spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
  assert.equal(manager.list.length, 5);
  for (const [role, bird] of manager.list.entries()) {
    const x = Math.floor(bird.pos.x), y = bird.pos.y, z = Math.floor(bird.pos.z);
    assert.equal(bird.sp, flamingoId);
    assert(!bird.persist && bird.wild.role === role);
    assert.equal(w.id(x, y, z), B.WATER);
    assert.notEqual(w.id(x, y - 1, z), B.WATER);
    for (let frame = 0; frame < 24; frame++) manager.physics(bird, 1 / 60);
    assert(bird.inWater && bird.onGround && bird.pos.y === y, "A spawned flamingo has firm footing");
  }
  assert.equal(w.mods.size, 0);
}
console.log("Flamingo passed: five-bird generated flock, physical wading, bill dips, one-leg pose, coordinated alarm, journal, and reload.");

{
  const f = fixture();
  f.player.pos = { x: 22, y: 10, z: 5.5 };
  const roo = f.manager.add(kangarooId, 9.5, 10, 5.5, { variant: 1 });
  roo.onGround = true;
  roo.wild.heading = 0;
  f.think(roo, 0.2);
  assert.equal(roo.wild.phase, "bound");
  const start = { ...roo.pos };
  let peak = start.y;
  for (let frame = 0; frame < 60; frame++) {
    roo.age += 1 / 60;
    f.manager.physics(roo, 1 / 60);
    peak = Math.max(peak, roo.pos.y);
    if (frame > 2 && roo.onGround) break;
  }
  assert(roo.onGround && peak - start.y > 1.55 && roo.pos.x - start.x > 3.8);
  f.manager.animate(roo, 0.8, 16, 1);
  assert(roo.parts.joey.visible);
  const journal = {};
  observeWildlife(journal, [roo], { x: roo.pos.x - 3, y: roo.pos.y + roo.h * 0.57, z: roo.pos.z },
    { x: 1, y: 0, z: 0 }, 3, () => true);
  assert.equal(journal.wildlife.kangaroo.behavior, true);
  assert.equal(journal.wildlife.kangaroo.young, true);
  const uid = roo.uid, chunk = { cx: 0, cz: 0, key: "0,0" };
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const restored = f.manager.list.find(e => e.uid === uid);
  assert.equal(restored.variant, 1);
  assert.equal(restored.wild.phase, "patrol");
}

for (const dodge of [false, true]) {
  const f = fixture(), roo = f.manager.add(kangarooId, 9.5, 10, 5.5, { variant: 0 });
  roo.onGround = true;
  f.player.pos = { x: 11.4, y: 10, z: 5.5 };
  f.think(roo, 7);
  assert.equal(roo.wild.phase, "graze");
  assert(f.manager.damage(roo, 1, "player"));
  f.think(roo, 8);
  assert.equal(roo.wild.phase, "kickWarn");
  f.think(roo, 8.4);
  assert.equal(f.events.length, 0);
  if (dodge) f.player.pos.z += 2;
  f.think(roo, 8.7);
  assert.equal(roo.wild.phase, "kick");
  f.think(roo, 8.8);
  assert.equal(f.events.length, dodge ? 0 : 1);
  if (!dodge) assert.equal(f.events[0][0], 7);
  f.manager.animate(roo, 0.8, 16, 1);
  assert(!roo.parts.joey.visible);
}

{
  const w = new World(new Generator("wildlife-grassland-review"));
  for (let cz = -26; cz <= -22; cz++) for (let cx = -21; cx <= -15; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: -298.5, y: 36, z: -395.5 } });
  const values = [0, 0, 0.94, 0.18, 0.7, 0.7];
  spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
  assert.equal(manager.list.length, 3);
  assert(manager.list.every(e => e.sp === kangarooId && !e.persist));
  assert.deepEqual(manager.list.map(e => e.variant), [1, 0, 0]);
  assert.equal(w.mods.size, 0);
}
console.log("Kangaroo passed: generated group, physical long bound, single defensive kick and dodge, pouch variant, journal and reload.");

{
  const f = fixture(), roo = f.manager.add(kangarooId, 9.5, 10, 5.5);
  f.world.id = f.world.get = (x, y, z) => y < 9 ? B.STONE : y === 9 ?
    (Math.abs(x - 9) < 2 && Math.abs(z - 5) < 2 ? B.GRASS : B.SAND) : B.AIR;
  roo.onGround = true;
  const lion = f.manager.add(lionId, 11.5, 10, 5.5);
  f.think(roo, 1);
  assert.equal(roo.wild.phase, "kickWarn", "A cornered kangaroo warns a nearby predator");
  f.think(roo, 1.8);
  assert.equal(lion.hp, lion.def.hp - 7);
  assert.equal(f.events.length, 0);
}
console.log("A kangaroo without a safe landing site kicked a nearby predator.");

{
  const f = fixture(), home = [9.5, 10, 5.5];
  const adult = f.manager.add(elephantId, ...home, { home });
  const calf = f.manager.add(elephantId, 9.5, 10, 10.5, { home, baby: true, growT: 1600 });
  assert.equal(calf.hp, 33);
  f.player.pos = { x: 12.5, y: 10, z: 5.5 };
  const terrain = f.world.id;
  f.world.id = f.world.get = (x, y, z) => x === 11 && y === 9 && z === 5 ? B.WATER : terrain(x, y, z);
  f.think(adult, 8);
  assert.equal(adult.wild.phase, "drink");
  f.world.id = f.world.get = (x, y, z) => x === 11 && y === 12 && z === 5 ? B.LEAVES : terrain(x, y, z);
  f.think(adult, 11);
  assert.equal(adult.wild.phase, "browseLeaves");
  f.world.id = f.world.get = terrain;
  calf.age = 11;
  f.manager.damage(calf, 1, "player");
  f.think(calf, 11.5);
  assert.equal(calf.wild.phase, "retreat");
  f.think(adult, 11.7);
  assert.equal(adult.wild.phase, "trunkWarn");
  f.think(adult, 12.65);
  assert.equal(f.events[0][0], 9);
  f.think(adult, 12.75);
  assert.equal(f.events.length, 1);
  f.manager.animate(calf, 0.8, 16, 1);
  assert(!calf.parts.tusk1.visible && !calf.parts.saddle.visible);
}

{
  const f = fixture();
  let consumed = 0, mounts = 0, cargo = 0, crouching = false;
  Object.assign(f.manager.ctx, {
    toast: () => {}, consume: () => consumed++,
    crouching: () => crouching, openCart: () => { cargo++; return true; },
    mount: () => { mounts++; return true; }
  });
  const e = f.manager.add(elephantId, 8.5, 10, 5.5, { ambient: true });
  assert(f.manager.interact(e, null));
  assert.equal(mounts, 0);
  assert(f.manager.interact(e, { id: I.WHEAT }));
  assert(f.manager.interact(e, { id: I.APPLE }));
  assert.equal(consumed, 1);
  for (const age of [2, 4, 6]) {
    e.age = age;
    assert(f.manager.interact(e, { id: I.APPLE }));
  }
  assert(e.tame && e.persist && e.temper === 100 && consumed === 4);
  assert(f.manager.interact(e, { id: I.SADDLE }));
  assert(e.saddled);
  assert(f.manager.interact(e, null));
  assert.equal(mounts, 1);
  crouching = true;
  assert(f.manager.interact(e, null));
  assert.equal(cargo, 1);
  e.inv.slots[0] = { id: I.APPLE, n: 3 };
  const p = new Player();
  assert(canRideElephant(f.world, p, e));
  const terrain = f.world.id;
  f.world.id = f.world.get = (x, y, z) => x === 10 && y === 14 && z === 5 ? B.STONE : terrain(x, y, z);
  assert(!canRideElephant(f.world, p, e), "A wide obstruction blocks mounting");
  f.world.id = f.world.get = terrain;
  p.mount = e;
  Object.assign(p.pos, e.pos);
  p.onGround = true;
  const input = { f: 0, r: 0, jump: true, sprint: false };
  p.step(f.world, input, 1 / 60, false);
  assert.equal(p.pos.y, 10);
  assert(p.aabb()[3] - p.aabb()[0] > 4);
  const chunk = { cx: 0, cz: 0, key: "0,0" }, uid = e.uid;
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const saved = f.manager.list.find(a => a.uid === uid);
  assert(saved.tame && saved.saddled && saved.persist);
  assert.deepEqual(saved.inv.slots[0], { id: I.APPLE, n: 3 });
  f.manager.animate(saved, 0.8, 16, 1);
  assert(saved.parts.saddle.visible && saved.parts.pack1.visible);

  const world = { blockhaven: SAVE_VERSION, version: SAVE_VERSION, name: "Elephant cargo",
    seed: "wildlife-grassland-review", mode: "survival", story: {},
    player: { pos: { x: 1, y: 10, z: 1 } }, inventory: Array(41).fill(null),
    dims: { overworld: { entities: f.manager.toJSON() } } };
  const imported = await Saves.importFile({ text: async () => JSON.stringify(world) });
  const actor = (await Saves.load(imported.id)).dims.overworld.entities["0,0"].find(a => a.uid === uid);
  assert(actor.tame && actor.saddled);
  assert.deepEqual(actor.inv[0], { id: I.APPLE, n: 3 });
}

{
  const w = new World(new Generator("wildlife-grassland-review"));
  for (let cz = -30; cz <= -27; cz++) for (let cx = -21; cx <= -17; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: -331.5, y: 33, z: -456.5 } });
  const values = [0, 0, 0.976, 0.2];
  spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
  assert.equal(manager.list.length, 3);
  assert(manager.list.every(e => e.sp === elephantId && !e.persist));
  assert(manager.list.at(-1).baby);
  assert.equal(w.mods.size, 0);
}
console.log("Elephant passed: generated herd and calf, drinking and leaf browsing, herd defense, timed taming, saddle, wide riding collision, cargo, and save import.");

{
  const f = fixture(), drops = [];
  let closed = 0;
  f.manager.ctx.drop = (id, n) => drops.push([id, n]);
  f.manager.ctx.closeElephantCargo = () => closed++;
  const e = f.manager.add(elephantId, 8.5, 10, 5.5, { tame: true });
  e.inv.slots[0] = { id: I.WHEAT, n: 3 };
  assert(f.manager.damage(e, e.hp, null));
  assert(!f.manager.damage(e, e.hp, null));
  assert.deepEqual(drops, [[I.WHEAT, 3]]);
  assert(e.inv.slots.every(slot => slot === null));
  assert.equal(closed, 1);
}
console.log("Elephant cargo drops once and an open cargo panel closes on death.");

{
  const f = fixture();
  f.player.pos = { x: 20, y: 10, z: 6.5 };
  const hunter = f.manager.add(falconId, 10.5, 17, 5.5);
  const prey = f.manager.add("rabbit", 14.5, 10, 5.5);
  const startY = hunter.pos.y;
  const health = prey.hp;
  let dived = false, minY = startY;
  for (let frame = 0; frame < 255 && prey.hp >= health; frame++) {
    hunter.age += 1 / 60;
    if (frame % 9 === 0) f.manager.think(hunter, 0.8);
    f.manager.physics(hunter, 1 / 60);
    dived ||= hunter.wild.phase === "dive";
    minY = Math.min(minY, hunter.pos.y);
  }
  assert(dived && minY < startY - 4.5 && prey.hp < health, JSON.stringify({state:hunter.wild.phase,pos:hunter.pos,minY,health:prey.hp}));
  assert.equal(hunter.wild.prey, null);
}

{
  const f = fixture(), messages = [];
  let crouching = false, consumed = 0;
  Object.assign(f.manager.ctx, {
    crouching: () => crouching, consume: () => consumed++, toast: message => messages.push(message)
  });
  f.player.pos = { x: 10.5, y: 10, z: 7.5 };
  f.player.yaw = 0;
  f.world.surfaceY = (x, z) => z >= -7 && z <= -2 ? 18 : 9;
  f.world.id = f.world.get = (x, y, z) => y <= f.world.surfaceY(x, z) ? B.STONE : B.AIR;
  const falcon = f.manager.add(falconId, 10.5, 14, 5.5, { ambient: true });
  assert(f.manager.interact(falcon, { id: I.RAW_CHICKEN }));
  assert.equal(consumed, 0);
  for (let frame = 0; frame < 500 && falcon.wild.phase !== "lookout"; frame++) {
    falcon.age = 18 + frame / 60;
    if (frame % 9 === 0) f.manager.think(falcon, 0.8);
    f.manager.physics(falcon, 1 / 60);
  }
  assert.equal(falcon.wild.phase, "lookout");
  for (let n = 0; n < 3; n++) {
    falcon.age += 2;
    assert(f.manager.interact(falcon, { id: I.RAW_CHICKEN }));
  }
  assert(falcon.tame && falcon.persist && consumed === 3);
  crouching = true;
  assert(f.manager.interact(falcon, null));
  assert.equal(falcon.wild.phase, "scoutOut");
  const journal = {};
  observeWildlife(journal, [falcon], { x: falcon.pos.x - 3, y: falcon.pos.y + falcon.h * 0.57, z: falcon.pos.z },
    { x: 1, y: 0, z: 0 }, 3, () => true);
  assert.equal(journal.wildlife.falcon.behavior, true);
  const missionStart = falcon.age, outbound = falcon.wild.scout.target;
  let returned = false, reached = false, apex = 0;
  for (let frame = 0; frame < 1250 && falcon.wild.scout; frame++) {
    falcon.age = missionStart + frame / 60;
    if (frame % 9 === 0) f.manager.think(falcon, 0.8);
    f.manager.physics(falcon, 1 / 60);
    apex = Math.max(apex, falcon.pos.y);
    returned ||= falcon.wild.phase === "scoutReturn";
    reached ||= Math.hypot(falcon.pos.x - outbound.x, falcon.pos.y - outbound.y, falcon.pos.z - outbound.z) < 1.7;
  }
  assert(apex > 20, "Scout climbs above an intervening ridge");
  assert(returned && reached && messages.some(message => /Falcon spotted forest ahead/.test(message)),
    JSON.stringify({ returned, reached, messages, pos: falcon.pos }));
  assert.equal(falcon.wild.scout, null);
  crouching = false;
  assert(f.manager.interact(falcon, null));
  assert(falcon.sitting);
  const uid = falcon.uid, chunk = { cx: 0, cz: 0, key: "0,0" };
  assert(Math.floor(falcon.pos.z / 16) === 0);
  f.manager.unloadChunk(chunk);
  f.manager.loadChunk(chunk);
  const saved = f.manager.list.find(e => e.uid === uid);
  assert(saved.tame && saved.sitting && saved.persist);
  assert.equal(saved.wild.scout, undefined);
}

{
  const w = new World(new Generator("wildlife-grassland-review"));
  for (let cz = -26; cz <= -22; cz++) for (let cx = -21; cx <= -15; cx++) w.load(cx, cz);
  const { manager } = fixture();
  manager.ctx.world = () => w;
  manager.ctx.player = () => ({ pos: { x: -298.5, y: 36, z: -395.5 } });
  const values = [0, 0, 0.219];
  spawnWildlife(manager, 1, 1, () => values.shift() ?? 0.5);
  const [falcon] = manager.list;
  assert.equal(falcon?.sp, falconId);
  assert.equal(falcon.pos.y, w.surfaceY(-271, -396) + 6);
  assert.equal(falcon.persist, false);
  assert.equal(w.mods.size, 0);
}
console.log("Falcon passed: generated spawn, physical dive and capture, landing, training, physical scout flight and return, journal, and save reload.");
