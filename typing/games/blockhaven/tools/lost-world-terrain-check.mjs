import assert from "node:assert/strict";
import { B, CHUNK, SOLID } from "../js/blocks.js";
import { GODZILLA_CALDERA, GODZILLA_SITE, GODZILLA_TERMINAL, GODZILLA_ANCHORS, CALDERA_CACHE, GodzillaCalderaGenerator } from "../js/godzilla-caldera.js";
import { GODZILLA_HP, activateGodzillaAnchor, godzillaDamage, godzillaPhase, inAtomicBreath, newGodzillaCycle, newGodzillaRecord, stepGodzillaCycle, validGodzillaRecord } from "../js/godzilla-encounter.js";
import { VOLCANIC_BADLANDS, VolcanicBadlandsGenerator, CALDERA_ANCHORS, BADLANDS_VENTS, badlandsVentActive, updateBadlandsVents } from "../js/volcanic-badlands.js";
import { TYRANT_CANYON, TyrantCanyonGenerator, TRACKS, EXPEDITION_BEACON, REX_HOME } from "../js/tyrant-canyon.js";
import { populateTyrannosaurus } from "../js/lost-world-tyrannosaurus.js";
import { lineOfSight } from "../js/entities.js";
import { AMBER_CAVERNS, AmberCavernsGenerator, SAMPLE, WINCH, SEAL, amberFloor } from "../js/amber-caverns.js";
import { populateCaveCreatures } from "../js/lost-world-cave-creatures.js";
import { FernPlainsGenerator, SURVEY_POSTS } from "../js/fern-plains.js";
import { expedition, expeditionJournal, readSurveyPost, readWetlandTablet, readCampaignLandmark, validExpedition } from "../js/lost-world-campaign.js";
import { populateTriceratops } from "../js/lost-world-triceratops.js";
import { populateWetlandCreatures } from "../js/lost-world-wetland-creatures.js";
import { MangroveGenerator, PUMP, RELAY } from "../js/mangrove-wetlands.js";
import { populateBrachiosaurus } from "../js/lost-world-brachiosaurus.js";
import { REDWOODS, RedwoodGenerator, OVERLOOK, RIDGE_STATION, redwoodDeck } from "../js/redwood-escarpment.js";
import { World } from "../js/world.js";

for (const seed of ["primeval-preview", "wild-fern", "0", "-42", "rainforest"]) {
  const terrain = new World(new FernPlainsGenerator(seed, true));
  const reordered = new World(new FernPlainsGenerator(seed, true));
  const sandbox = new World(new FernPlainsGenerator(seed, false));
  const order = [];
  for (let z = -1; z <= 3; z++) for (let x = -3; x <= 1; x++) {
    order.push([x, z]);
    terrain.load(x, z);
    sandbox.load(x, z);
  }
  for (const [x, z] of order.reverse()) {
    assert.deepEqual(reordered.load(x, z).data, terrain.chunks.get(x + "," + z).data);
  }

  for (let z = -5; z <= 44; z++) {
    const x = Math.round(Math.max(0, z - 10) * 0.24);
    assert.equal(terrain.id(x, 35, z), B.GRAVEL, `Trail ${seed} at z=${z}`);
    assert(!SOLID[terrain.id(x, 36, z)]);
  }
  for (const { x, y, z } of SURVEY_POSTS) {
    assert.equal(terrain.id(x, y, z), B.LORE_TABLET);
    assert.notEqual(sandbox.id(x, y, z), B.LORE_TABLET);
    assert(SOLID[terrain.id(x, y - 1, z)]);
    assert(!SOLID[terrain.id(x, y, z - 1)]);
  }

  const sites = [];
  const manager = { world: terrain, add: (_, x, y, z) => sites.push([x, y, z].map(Math.floor)) };
  for (const cz of [0, 2]) populateTriceratops(manager, terrain.chunkAt(0, cz * CHUNK));
  assert(sites.length >= 5, `Expected two herds in seed ${seed}`);
  for (const [x, y, z] of sites) assert(SOLID[terrain.id(x, y - 1, z)] && !SOLID[terrain.id(x, y, z)]);
}

const record = { ...expedition(), stage: 2 };
for (const [post, expected] of [[1, 2], [0, 3], [1, 4], [0, 4]]) {
  readSurveyPost(record, SURVEY_POSTS[post]);
  assert.equal(record.stage, expected);
}
console.log("Fern Plains terrain, trail, herds, and ordered survey passed.");

for (const seed of ["primeval-preview", "wild-fern", "0", "-42", "rainforest"]) {
  const wetland = new World(new MangroveGenerator(seed, true));
  const sandbox = new World(new MangroveGenerator(seed, false));
  for (let cz = -1; cz <= 2; cz++) for (let cx = -1; cx <= 1; cx++) {
    wetland.load(cx, cz);
    sandbox.load(cx, cz);
  }
  for (let z = -6; z <= 35; z++) {
    assert.equal(wetland.id(0, 32, z), B.PLANKS);
    assert(!SOLID[wetland.id(0, 33, z)] && !SOLID[wetland.id(0, 34, z)]);
  }
  for (const { x, y, z } of [PUMP, RELAY]) {
    assert.equal(wetland.id(x, y, z), B.LORE_TABLET);
    assert.notEqual(sandbox.id(x, y, z), B.LORE_TABLET);
    assert.equal(wetland.id(x, y - 1, z), B.PLANKS);
  }
  const spawns = [];
  const manager = { world: wetland, add: (species, x, y, z) => spawns.push({ species, x, y, z }) };
  for (const [cx, cz] of [[0, 0], [-1, 0], [0, 1]]) populateWetlandCreatures(manager, { cx, cz });
  const spino = spawns.find(e => e.species === "lost_world_spinosaurus");
  assert(spino);
  assert.equal(wetland.id(Math.floor(spino.x), Math.floor(spino.y), Math.floor(spino.z)), B.WATER);
  assert(spawns.filter(e => e.species === "lost_world_mosquito").length >= 3);
}

for (const [site, expected] of [[RELAY, 4], [PUMP, 5], [PUMP, 5], [RELAY, 6], [RELAY, 6]]) {
  assert(readWetlandTablet(record, site));
  assert.equal(record.stage, expected);
}
readSurveyPost(record, SURVEY_POSTS[1]);
assert.equal(record.stage, 6);
console.log("Wetland boardwalk, spawn habitat, and relay checkpoint order passed.");

for (const seed of ["primeval-preview", "wild-fern", "0", "-42", "rainforest"]) {
  const redwoods = new World(new RedwoodGenerator(seed, true));
  const sandbox = new World(new RedwoodGenerator(seed, false));
  const reordered = new World(new RedwoodGenerator(seed, true));
  const chunks = [];
  for (let cz = -1; cz <= 3; cz++) for (let cx = -1; cx <= 1; cx++) {
    chunks.push([cx, cz]);
    redwoods.load(cx, cz);
    sandbox.load(cx, cz);
  }
  for (const [cx, cz] of chunks.reverse()) {
    assert.deepEqual(reordered.load(cx, cz).data, redwoods.chunks.get(cx + "," + cz).data);
  }
  const route = [
    ...Array.from({ length: 34 }, (_, i) => [0, i - 5]),
    ...Array.from({ length: 18 }, (_, i) => [i + 1, 28]),
    ...Array.from({ length: 27 }, (_, i) => [18, i + 29]),
    [19, 55], [20, 55]
  ];
  let previous = 35;
  for (const [x, z] of route) {
    const y = redwoodDeck(x, z);
    assert(y !== null && Math.abs(y - previous) <= 1, "Missing or impassable route step");
    assert([B.PLANKS, B.GRAVEL].includes(redwoods.id(x, y, z)));
    assert(!SOLID[redwoods.id(x, y + 1, z)] && !SOLID[redwoods.id(x, y + 2, z)]);
    previous = y;
  }
  assert.equal(previous, 52);
  for (const { x, y, z } of [OVERLOOK, RIDGE_STATION]) {
    assert.equal(redwoods.id(x, y, z), B.LORE_TABLET);
    assert.notEqual(sandbox.id(x, y, z), B.LORE_TABLET);
    assert(SOLID[redwoods.id(x, y - 1, z)]);
  }
  const herd = [];
  const manager = { world: redwoods, add: (species, x, y, z) => herd.push({ species, x, y, z }) };
  for (const [cx, cz] of [[0, 0], [0, 1], [1, 1]]) populateBrachiosaurus(manager, { cx, cz });
  assert.equal(herd.length, 3);
}

for (const [site, expected] of [[RIDGE_STATION, 6], [OVERLOOK, 7], [OVERLOOK, 7], [RIDGE_STATION, 8], [RIDGE_STATION, 8]]) {
  assert(readCampaignLandmark(REDWOODS, record, site));
  assert.equal(record.stage, expected);
}
readWetlandTablet(record, RELAY);
assert.equal(record.stage, 8);
for (let stage = 0; stage <= 8; stage++) {
  const saved = { version: 1, stage };
  assert(validExpedition(saved));
  for (const dim of ["lost_world", "fern_plains", "mangrove_wetlands", REDWOODS]) {
    assert.match(expeditionJournal(saved, [], dim), /<strong>.+<\/strong>/);
  }
}
console.log("Redwood climb, Brachiosaurus sites, and chapter checkpoints passed.");

for (const seed of ["primeval-preview", "wild-fern", "0", "-42", "rainforest"]) {
  const cave = new World(new AmberCavernsGenerator(seed, true));
  const sandbox = new World(new AmberCavernsGenerator(seed, false));
  for (let cz = -1; cz <= 2; cz++) for (let cx = -1; cx <= 0; cx++) {
    cave.load(cx, cz);
    sandbox.load(cx, cz);
  }
  for (const x of [0, 12]) {
    let previous = 35;
    for (let z = -4; z <= 40; z++) {
      const y = amberFloor(x, z);
      assert(y !== null && Math.abs(previous - y) <= 1, "Passage must be walkable");
      assert(SOLID[sandbox.id(x, y, z)]);
      assert(!SOLID[sandbox.id(x, y + 1, z)] && !SOLID[sandbox.id(x, y + 2, z)]);
      previous = y;
    }
    assert.equal(previous, 26);
  }
  for (const { x, y, z } of SEAL) {
    assert.equal(cave.id(x, y, z), B.GATE_FRAME);
    assert.equal(sandbox.id(x, y, z), B.AIR);
  }
  for (const { x, y, z } of [SAMPLE, WINCH]) {
    assert.equal(cave.id(x, y, z), B.LORE_TABLET);
    assert.equal(sandbox.id(x, y, z), B.AIR);
  }
  const creatures = [];
  const manager = { world: cave, add: species => creatures.push(species) };
  for (const chunk of cave.chunks.values()) populateCaveCreatures(manager, chunk);
  assert.deepEqual(creatures.sort(), ["lost_world_cave_raptor", "lost_world_cave_raptor", "lost_world_snaproot", "lost_world_snaproot"]);
}
for (const [site, expected] of [[WINCH, 8], [SAMPLE, 9], [SAMPLE, 9], [WINCH, 10], [WINCH, 10]]) {
  assert(readCampaignLandmark(AMBER_CAVERNS, record, site));
  assert.equal(record.stage, expected);
}
readCampaignLandmark(REDWOODS, record, RIDGE_STATION);
assert.equal(record.stage, 10);
assert(validExpedition(record));
assert.match(expeditionJournal(record, [], AMBER_CAVERNS), /Chapter 5 complete/);
console.log("Amber tunnels, shortcut seal, cave creatures, and chapter order passed.");

for (const seed of ["primeval-preview", "wild-fern", "0", "-42", "rainforest"]) {
  const canyon = new World(new TyrantCanyonGenerator(seed, true));
  const sandbox = new World(new TyrantCanyonGenerator(seed, false));
  for (let cz = -1; cz <= 2; cz++) for (let cx = -1; cx <= 1; cx++) {
    canyon.load(cx, cz);
    sandbox.load(cx, cz);
  }
  for (const [x, z] of [
    ...Array.from({ length: 36 }, (_, i) => [0, i]),
    ...Array.from({ length: 10 }, (_, i) => [i + 1, 5]),
    ...Array.from({ length: 30 }, (_, i) => [10, i + 5]),
    [11, 34], [12, 35], [13, 35], [14, 35]
  ]) {
    assert(SOLID[canyon.id(x, 34, z)] && !SOLID[canyon.id(x, 35, z)] && !SOLID[canyon.id(x, 36, z)]);
  }
  for (const { x, y, z } of [TRACKS, EXPEDITION_BEACON]) {
    assert.equal(canyon.id(x, y, z), B.LORE_TABLET);
    assert.notEqual(sandbox.id(x, y, z), B.LORE_TABLET);
  }
  const spawns = [];
  const manager = { world: canyon, add: (species, x, y, z) => spawns.push({ species, x, y, z }) };
  for (const chunk of canyon.chunks.values()) populateTyrannosaurus(manager, chunk);
  assert.equal(spawns.length, 1);
  const [x, y, z] = REX_HOME;
  const eye = { x, y: y + 3.6, z };
  assert(lineOfSight(canyon, eye, { x, y: y + 1.62, z: z - 9 }));
  assert(!lineOfSight(canyon, eye, { x: 10.5, y: y + 1.62, z }));
}
for (const [site, expected] of [[EXPEDITION_BEACON, 10], [TRACKS, 11], [TRACKS, 11], [EXPEDITION_BEACON, 12], [EXPEDITION_BEACON, 12]]) {
  assert(readCampaignLandmark(TYRANT_CANYON, record, site));
  assert.equal(record.stage, expected);
}
readCampaignLandmark(AMBER_CAVERNS, record, WINCH);
assert.equal(record.stage, 12);
assert(validExpedition(record));
assert.match(expeditionJournal(record, [], TYRANT_CANYON), /Chapter 6 complete/);
console.log("Canyon trails, terrain cover, Tyrannosaurus spawn, and beacon checkpoint order passed.");

for (const seed of ["primeval-preview", "wild-fern", "0", "-42", "rainforest"]) {
  const badlands = new World(new VolcanicBadlandsGenerator(seed, true));
  const sandbox = new World(new VolcanicBadlandsGenerator(seed, false));
  const reordered = new World(new VolcanicBadlandsGenerator(seed, true));
  const chunks = [];
  for (let cz = -1; cz <= 4; cz++) for (let cx = -1; cx <= 1; cx++) {
    chunks.push([cx, cz]);
    badlands.load(cx, cz);
    sandbox.load(cx, cz);
  }
  for (const [cx, cz] of chunks.reverse()) {
    assert.deepEqual(reordered.load(cx, cz).data, badlands.chunks.get(cx + "," + cz).data);
  }
  for (const { x, y, z } of CALDERA_ANCHORS) {
    assert.equal(badlands.id(x, y, z), B.LORE_TABLET);
    assert(!SOLID[badlands.id(x, y, z - 1)]);
    assert.notEqual(sandbox.id(x, y, z), B.LORE_TABLET);
  }
  for (const vent of BADLANDS_VENTS) {
    for (let z = vent.z - 3; z <= vent.z + 3; z++) for (const x of vent.lanes) {
      assert(SOLID[badlands.id(x, vent.y - 1, z)] && !SOLID[badlands.id(x, vent.y, z)]);
      assert.equal(badlands.id(0, vent.y, z), B.BASALT);
    }
    assert(vent.lanes[1] - vent.lanes[0] > 2 * vent.radius - 1);
  }
  assert.equal(badlands.id(8, 34, 11), B.LAVA);
  assert.equal(badlands.id(0, 58, 76), B.LAVA);

  const vent = BADLANDS_VENTS[0], pos = { x: 3.5, y: vent.y, z: vent.z + 0.5 }, warnings = [];
  const emit = (sector, x) => warnings.push([sector.z, x]);
  updateBadlandsVents(badlands, pos, 12, 1.4, emit);
  updateBadlandsVents(badlands, pos, 12, 7.3, emit);
  assert.deepEqual(warnings, [[vent.z, -3], [vent.z, 3]]);
  assert.equal(badlandsVentActive(badlands, pos, 13, vent, 3), false);
  updateBadlandsVents(badlands, pos, 13, 8, emit);
  assert.equal(warnings.length, 2);
  updateBadlandsVents(sandbox, pos, undefined, 1.4, emit);
  assert.equal(warnings.length, 3);
}
for (const [index, expected] of [[1, 12], [0, 13], [0, 13], [2, 13], [1, 14], [2, 15], [2, 15]]) {
  assert(readCampaignLandmark(VOLCANIC_BADLANDS, record, CALDERA_ANCHORS[index]));
  assert.equal(record.stage, expected);
}
readCampaignLandmark(TYRANT_CANYON, record, EXPEDITION_BEACON);
assert.equal(record.stage, 15);
assert(validExpedition(record));
assert.match(expeditionJournal(record, [], VOLCANIC_BADLANDS), /Chapter 7 complete/);
console.log("Badlands causeway, lava, alternating vents, sandbox access, and ordered anchors passed.");

for (const seed of ["primeval-preview", "wild-fern", "0", "-42", "rainforest"]) {
  const caldera = new World(new GodzillaCalderaGenerator(seed));
  for (let cz = -1; cz <= 3; cz++) for (let cx = -1; cx <= 1; cx++) caldera.load(cx, cz);
  for (const { x, y, z } of [GODZILLA_TERMINAL, ...GODZILLA_ANCHORS]) {
    assert.equal(caldera.id(x, y, z), B.LORE_TABLET);
    assert(SOLID[caldera.id(x, y - 1, z)] && !SOLID[caldera.id(x, y, z - 1)]);
  }
  assert.equal(caldera.id(CALDERA_CACHE.x, CALDERA_CACHE.y, CALDERA_CACHE.z), B.CHEST);
  for (let y = GODZILLA_SITE.y; y < GODZILLA_SITE.y + 15; y++) {
    assert.equal(caldera.id(Math.floor(GODZILLA_SITE.x), y, Math.floor(GODZILLA_SITE.z)), B.AIR);
  }
}

let fight = newGodzillaRecord();
const phases = ["shockwave", "faults", "breath", "ashfall", "breath"];
const point = { x: 0.5, y: GODZILLA_SITE.y, z: 15.5 };
for (let i = 0; i < phases.length; i++) {
  const cycle = newGodzillaCycle();
  assert.equal(godzillaPhase(fight.hp), i + 1);
  assert(validGodzillaRecord(fight));
  assert.equal(stepGodzillaCycle(cycle, fight, point, 0.1).type, "phase");
  assert.equal(stepGodzillaCycle(cycle, fight, point, 3).attack, phases[i]);
  assert.equal(godzillaDamage(fight, cycle, 400), 0);
  assert.equal(stepGodzillaCycle(cycle, fight, point, 3).type, "strike");
  if (cycle.attack === "breath") {
    assert(inAtomicBreath(cycle, point));
    assert(!inAtomicBreath(cycle, { ...point, x: 6.5 }));
  }
  assert.equal(stepGodzillaCycle(cycle, fight, point, 2).type, "recovery");
  if (i === 2) {
    assert.equal(godzillaDamage(fight, cycle, 400), 0);
    for (const anchor of [1, 0, 1, 2]) fight = activateGodzillaAnchor(fight, anchor);
    assert.equal(fight.anchors, 7);
  }
  assert.equal(godzillaDamage(fight, cycle, 400), 48);
  fight = { ...fight, hp: fight.hp - godzillaDamage(fight, cycle, 400) };
  stepGodzillaCycle(cycle, fight, { ...point, z: -5.5 }, 1);
  assert.equal(cycle.mode, "idle");
}
assert.equal(fight.hp, GODZILLA_HP - 240);
assert(validGodzillaRecord(fight));
assert(!validGodzillaRecord({ hp: 30, anchors: 0 }));
assert.match(expeditionJournal({ version: 1, stage: 17 }, [], GODZILLA_CALDERA), /Godzilla defeated/);
console.log("Caldera terrain, five non-skippable Godzilla phases, atomic breath lanes, shield anchors, and victory passed.");
