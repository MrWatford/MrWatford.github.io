import assert from "node:assert/strict";
import * as THREE from "../lib/three.module.min.js";
import { B, I, SPAWN_EGGS, itemDef, spawnEggId } from "../js/blocks.js";
import { Entities, SPECIES } from "../js/entities.js";
import { Generator } from "../js/worldgen.js";
import { World } from "../js/world.js";
import { reefWaterFit, reefSpawnSite } from "../js/wildlife-reef.js";
import { marineWaterRoom } from "../js/wildlife-ocean.js";
import { spawnWildlife, sharkWater } from "../js/wildlife.js";
import { markWildlifeDefeated, observeWildlife, restoreWildlifeJournal, wildlifeJournalHTML } from "../js/wildlife-journal.js";
import { Saves, SAVE_VERSION } from "../js/save.js";

// Mesh geometry is constructed normally. The browser review checks actual atlas pixels.
globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {} }) }) };

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
  assert.deepEqual(ids.slice(-13), [bearId, sharkId, eagleId, whaleId, orcaId, crocId, hippoId, octopusId, mantaId, sealId, walrusId, lionId, zebraId]);
  assert.equal(ids.length, new Set(ids).size);
  assert.equal(itemDef(I.FISHING_ROD).name, "Fishing Rod");
  assert.equal(spawnEggId(99), 499);
  assert.equal(spawnEggId(100), 700);
  for (const id of [bearId, sharkId, eagleId, whaleId, orcaId, crocId, hippoId, octopusId, mantaId, sealId, walrusId, lionId, zebraId]) {
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
  assert.match(wildlifeJournalHTML(story), /0 of 14 recorded/);
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
  assert.match(wildlifeJournalHTML(story), /2 of 14 recorded/);
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
