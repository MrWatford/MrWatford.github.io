import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { B, OPEN, TOP, HEIGHT, CHUNK, STAIR_INNER, STAIR_OUTER, STAIR_RIGHT,
  blockDef, itemDef, idOf, metaOf, make } from "../js/blocks.js";
import { model, shapeBoxes } from "../js/shapes.js";
import { VILLAGE_BUILDINGS, VILLAGE_ARCHITECTURE_GEN, buildVillageBuilding, fitVillageBuilding,
  villageBuildingAnchors } from "../js/village-architecture.js";
import { PAINTING_BY_KEY } from "../js/decor.js";
import { Generator, idx } from "../js/worldgen.js";
import { prepareStonehaven, stonehavenDestination, stonehavenResidents } from "../js/stonehaven.js";
import { World } from "../js/world.js";
import { findPath } from "../js/entities.js";
import { Player } from "../js/player.js";
import { buildChunk } from "../js/mesher.js";
import { Saves, SAVE_VERSION } from "../js/save.js";

const isClear = v => !(blockDef(v).solid) || idOf(v) === B.DOOR && !!(metaOf(v) & OPEN);
const names = new Set();
let combinations = 0, climbs = 0;
for (const [kind, variants] of Object.entries(VILLAGE_BUILDINGS)) {
  assert.equal(variants.length, 6);
  for (const variant of variants) {
    assert.ok(!names.has(variant.name), variant.name);
    names.add(variant.name);
    for (const [biome, width, depth] of [
      ["plains", 9, 8], ["forest", 9, 8], ["birch", 9, 7], ["sandy", 9, 7], ["stonehaven", 13, 10]
    ]) {
      const plan = fitVillageBuilding(kind, variant.variant, width, depth), a = villageBuildingAnchors(plan);
      const name = variant.name + " (" + biome + ")";
      const map = new Map(), contents = [];
      const get = (x, y, z) => map.get(x + "," + y + "," + z) ?? (y === 0 ? B.GRASS : B.AIR);
      buildVillageBuilding(plan, {
        put(x, y, z, value) {
          assert.ok(x >= -1 && x <= plan.width && z >= -1 && z <= plan.depth + 1 && y < 19, name);
          assert.ok(Number.isInteger(value) && blockDef(value), name + " uses a registered block");
          map.set(x + "," + y + "," + z, value);
        },
        decorate: (...data) => contents.push(data), seed: 17, x: -64, z: 16, biome
      });
      const [door, y, front] = a.door;
      const [hx, hy, hz] = a.home;
      const [jobX, jobY, jobZ] = a.job;
      const world = { get, id: (x, y, z) => idOf(get(x, y, z)) };
      assert.equal(get(door, y, front), make(B.DOOR, OPEN), name);
      assert.equal(get(door, y + 1, front), make(B.DOOR, OPEN | TOP), name);
      assert.ok(isClear(get(hx, hy, hz)) && isClear(get(hx, hy + 1, hz)), name + " has a clear spawn");
      assert.ok(!isClear(get(...a.job)), name + " has a workstation");
      const jobApproach = findPath(world, door, 1, front + 2, jobX, jobY, jobZ, 2, 350, true);
      const last = jobApproach.at(-1);
      assert.ok(last && Math.abs(last.x - .5 - jobX) + Math.abs(last.z - .5 - jobZ) + Math.abs(last.y - jobY) <= 1,
        name + " has a route to its workstation");
      if (plan.upper) {
        const bedroom = findPath(world, door, 1, front + 2, 2, 5, 2, 2, 550, true).at(-1);
        assert.equal(bedroom?.y, 5, name + " has a route upstairs");
        const p = new Player();
        p.pos = { x: plan.width - 1.5, y: 1.5, z: 5.93 };
        for (let i = 0; i < 92 && p.pos.y < 4.99; i++) p.step(world, { f: 1, r: 0 }, 1 / 60, false);
        assert.ok(p.pos.y >= 4.99, name + " stair supports standing-height players");
        climbs++;
      }
      assert.ok([...map.values()].some(v => blockDef(v).stairs && metaOf(v) & 4), name + " has inverted brackets");
      assert.ok([...map.values()].some(v => idOf(v) === B.LANTERN), name + " has lights");
      assert.ok(contents.length, name + " has a display or stocked storage");
      for (const [x, dy, z, value, fixture] of contents) {
        assert.equal(get(x, dy, z), value, name + " did not cover its display");
        if (fixture.art) assert.ok(PAINTING_BY_KEY[fixture.art], name);
        for (const slot of fixture.slots || []) if (slot) assert.ok(itemDef(slot.id), name + " uses registered display items");
      }
      combinations++;
    }
  }
}

for (const [flags, volume] of [[0, .75], [STAIR_OUTER, .625], [STAIR_INNER, .875]]) {
  for (const yaw of [0, 1, 2, 3]) for (const inversion of [0, 4]) for (const side of [0, STAIR_RIGHT]) {
    const v = make(B.OAK_STAIRS, yaw | inversion | flags | side);
    const boxes = shapeBoxes(v);
    assert.equal(boxes.length, model(v).parts.length);
    assert.equal(boxes.reduce((sum, a) => sum + (a[3]-a[0])*(a[4]-a[1])*(a[5]-a[2]), 0), volume);
  }
}
for (const pane of [B.GLASS_PANE, B.BLUE_STAINED_GLASS_PANE, B.IRON_BARS]) {
  assert.equal(blockDef(pane).render, "cutout");
  const neighbors = (x, y, z) => x !== 0 ? B.STONE_BRICKS : B.AIR;
  assert.equal(model(pane, neighbors).arms.length, 2);
  assert.equal(shapeBoxes(pane, neighbors).length, 3);
}
const seed = "Stonehaven Architecture";
const gen = new Generator(seed, VILLAGE_ARCHITECTURE_GEN);
const world = new World(gen);
let villages = 0, fixture;
const older = new Generator(seed, VILLAGE_ARCHITECTURE_GEN - 1);
for (let z = -10; z <= 10; z++) for (let x = -10; x <= 10; x++) {
  const p = gen.villagePiece(x, z), prev = older.villagePiece(x, z);
  assert.equal(p?.type, prev?.type, "plot allocation");
  assert.equal(p?.prof, prev?.prof, "villager professions");
  if (!p?.building) continue;
  const chunk = world.load(x, z);
  assert.equal(chunk.data.length, CHUNK * CHUNK * HEIGHT);
  assert.equal(world.id(Math.floor(p.entry[0]), p.entry[1], Math.floor(p.entry[2])), B.DOOR);
  assert.ok(isClear(world.get(Math.floor(p.home[0]), p.home[1], Math.floor(p.home[2]))));
  assert.equal(older.villagePiece(x, z).building, undefined);
  fixture ||= [...world.containers].find(([, c]) => c.type === "frame");
  villages++;
}
assert.ok(villages > 0 && fixture);
const [frameKey, frame] = fixture, [fx, fy, fz] = frameKey.split(",").map(Number);
frame.slots[0] = null;
const cx = Math.floor(fx / CHUNK), cz = Math.floor(fz / CHUNK);
const modern = await Saves.importFile(new Blob([JSON.stringify({ blockhaven: SAVE_VERSION, name: "Fixture",
  gen: gen.version, seed, mode: "creative", dims: { overworld: { mods: world.modsToJSON(), containers: [...world.containers] } } })]));
const save = await Saves.load(modern.id);
const loaded = new World(new Generator(seed, save.gen));
loaded.modsFromJSON(save.dims.overworld.mods);
loaded.containers = new Map(save.dims.overworld.containers);
loaded.load(cx, cz);
assert.equal(loaded.containers.get(frameKey).slots[0], null);
loaded.set(fx, fy, fz, B.COBBLE);
loaded.containers.delete(frameKey);
loaded.unload(loaded.chunkAt(fx, fz));
loaded.load(cx, cz);
assert.equal(loaded.id(fx, fy, fz), B.COBBLE);
assert.ok(!loaded.containers.has(frameKey));

const story = {};
prepareStonehaven(gen, {}, story);
assert.equal(story.stonehaven.v, 3);
assert.equal(stonehavenDestination({ seed, gen: gen.version }, story).x, gen.stonehaven.x);
assert.equal(gen.stamps.at(-1).cells.constructor, Uint32Array);
assert.equal(gen.stamps.at(-1).size, 112);
const capital = story.stonehaven;
let residents = 0;
for (let dz = 0; dz < 7; dz++) for (let dx = 0; dx < 7; dx++) {
  const x = capital.x / CHUNK + dx, z = capital.z / CHUNK + dz;
  const part = stonehavenResidents(gen, x, z);
  if (part?.length) world.load(x, z);
  for (const { home, job } of part || []) {
    assert.ok(isClear(world.get(Math.floor(home[0]), home[1], Math.floor(home[2]))));
    if (job) {
      world.load(Math.floor(job[0] / CHUNK), Math.floor(job[2] / CHUNK));
      assert.ok(world.id(...job), "capital job station");
    }
    residents++;
  }
}
assert.equal(residents, 10);
const sample = [...world.containers].find(([, c]) => c.type === "stand");
assert.ok(sample?.[1].slots.some(Boolean), "smithy's stand is stocked");
const [sx, sy, sz] = sample[0].split(",").map(Number);
const scx = Math.floor(sx / CHUNK), scz = Math.floor(sz / CHUNK);
for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) world.load(scx + dx, scz + dz);
const mesh = buildChunk(world, world.load(scx, scz), true);
assert.ok(mesh.solid.index.length > 0 && mesh.solid.uv.every(Number.isFinite), "valid meshed vertices");
assert.ok(world.lightAt(sx, sy, sz)[1] > 0, "smithy display gets lantern light");
const legacy = {};
prepareStonehaven(older, {}, legacy);
assert.equal(legacy.stonehaven.v, 2);
assert.equal(older.stamps.at(-1).cells.constructor, Uint16Array);
const reopened = new Generator(seed, VILLAGE_ARCHITECTURE_GEN);
prepareStonehaven(reopened, {}, JSON.parse(JSON.stringify(legacy)));
assert.equal(reopened.stamps.at(-1).cells.constructor, Uint16Array);
assert.deepEqual(reopened.stamps.at(-1).cells, older.stamps.at(-1).cells, "existing Stonehaven remains version 2");
const reserved = new Generator(seed, VILLAGE_ARCHITECTURE_GEN);
reserved.stamps = [{ x: cx * CHUNK, z: cz * CHUNK, size: CHUNK }];
assert.equal(reserved.villagePiece(cx, cz), null, "a landmark reservation takes priority");
const edited = new Generator(seed, VILLAGE_ARCHITECTURE_GEN);
const marked = {};
prepareStonehaven(edited, { mods: { [capital.x / CHUNK + "," + capital.z / CHUNK]: [[idx(0, 40, 0), B.COBBLE]] } }, marked);
assert.notDeepEqual(marked.stonehaven, capital, "a new capital avoids the edited footprint");
const fixtureFile = new URL("./fixtures/ea1-public-world.json", import.meta.url);
try {
  const legacyExport = JSON.parse(await readFile(fixtureFile, "utf8"));
  const oldSave = await Saves.importFile(new Blob([JSON.stringify(legacyExport)]));
  const reopenedSave = await Saves.load(oldSave.id);
  assert.equal(reopenedSave.gen, legacyExport.gen || 1);
  assert.equal(reopenedSave.seed, legacyExport.seed);
  assert.deepEqual(reopenedSave.dims.overworld.mods, legacyExport.dims?.overworld?.mods || legacyExport.mods || {});
  console.log("Imported the repository's Early Access world export, preserving its generation and edits.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
console.log(`Passed: ${names.size} designs, ${combinations} material/lot combinations, ${climbs} physical stair climbs, 48 stair shapes, 3 window shapes, ${villages} generated village houses, save import/reopen, lit meshes, ${residents} Stonehaven residents, and legacy layouts.`);
