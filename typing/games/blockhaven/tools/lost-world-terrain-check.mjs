import assert from "node:assert/strict";
import { B, CHUNK, SOLID } from "../js/blocks.js";
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
