import assert from "node:assert/strict";
import * as THREE from "../lib/three.module.min.js";
import { B, I } from "../js/blocks.js";
import { Entities } from "../js/entities.js";
import { guardianDamageStage } from "../js/iron-guardian-model.js";
import { GUARDIAN_DEATH } from "../js/iron-guardian-motion.js";

// Canvas pixel storage is enough for a renderer-independent rig and lifecycle check.
globalThis.document = {
  createElement() {
    return {
      getContext() {
        return {
          createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
          putImageData() {}, fillRect() {}, clearRect() {}
        };
      }
    };
  }
};

const drops = [], effects = [];
let voxelLight = [15, 0];
const world = {
  gen: { isNether: () => false },
  entityStore: new Map(),
  visited: new Set(["0,0"]),
  get: (_x, y) => y === 39 ? B.STONE : B.AIR,
  id: (_x, y) => y === 39 ? B.STONE : B.AIR,
  lightAt: () => voxelLight
};
const player = { pos: { x: 3.5, y: 40, z: 6 }, eye: 1.62 };
const scene = new THREE.Scene();
const manager = new Entities(scene, {
  player: () => player, world: () => world, settings: () => ({ difficulty: "normal" }),
  creative: () => false, alive: () => true, particles: (...args) => effects.push(args.at(-1)),
  drop: (...args) => drops.push(args)
});

const legacy = { uid: "ironwarden-legacy", sp: "golem", x: 3.5, y: 40, z: 2.5, hp: 50, yaw: Math.PI,
  home: [3.5, 40, 2.5], tame: true, name: "East Gate" };
const chunk = { cx: 0, cz: 0, key: "0,0" };
world.entityStore.set(chunk.key, [legacy]);
manager.loadChunk(chunk);
let [warden] = manager.list;
const variation = warden.guardianView.variant;
assert.equal(warden.guardianView.stage, 2);
assert.equal(warden.mat.map.image.width, 256);
assert.equal(warden.mat.map.image.height, 256);
assert.equal(warden.w, 1.4);
assert.equal(warden.h, 2.7);
assert.equal(warden.mesh.position.y, 40);
assert.ok(Math.abs(new THREE.Box3().setFromObject(warden.mesh).max.y - 43.5) < .03);
assert.deepEqual([100, 76, 75, 51, 50, 26, 25, 1].map(hp => guardianDamageStage(hp, 100)), [0, 0, 1, 1, 2, 2, 3, 3]);

const twin = manager.add("golem", 6.5, 40, 2.5, { uid: legacy.uid });
assert.equal(twin.guardianView.variant, variation);
assert.equal(twin.mat.map, warden.mat.map);
assert.equal(twin.guardianView.armor[0].near, warden.guardianView.armor[0].near);
assert.notEqual(twin.mat, warden.mat);
const variants = new Set(Array.from({ length: 12 }, (_, i) =>
  manager.add("golem", 32.5, 40, 2.5, { uid: "variation-" + i }).guardianView.variant));
assert.equal(variants.size, 4);
for (const e of manager.list) if (e !== warden) e.gone = true;
manager.sweep();

warden.onGround = true;
manager.animate(warden, .05, 4, 1);
assert.equal(warden.guardianView.shadow.visible, true);
const dayColor = warden.mat.color.r;
manager.animate(warden, .05, 4, .22);
assert.ok(warden.mat.color.r < dayColor);
assert.ok(warden.guardianView.eyeLevel > .8);
voxelLight = [0, 0];
manager.animate(warden, .05, 4, .22);
const dark = warden.mat.color.r;
voxelLight = [0, 12];
manager.animate(warden, .05, 4, .22);
assert.ok(warden.mat.color.r > dark && warden.mat.color.r > warden.mat.color.b);
voxelLight = [15, 0];
assert.equal(warden.guardianView.cracks.some(p => p.mesh.visible), true);
warden.hp = 90;
manager.animate(warden, .05, 4, 1);
assert.equal(warden.guardianView.stage, 0);
assert.equal(warden.guardianView.cracks.some(p => p.mesh.visible), false);
warden.hp = legacy.hp;
manager.animate(warden, .05, 32 ** 2, 1);
assert.ok(warden.guardianView.coarse);
assert.ok(warden.guardianView.armor[0].far.index.count < warden.guardianView.armor[0].near.index.count);
assert.equal(warden.guardianView.cracks.some(p => p.mesh.visible), false);
assert.equal(warden.guardianView.armor.filter(p => p.mesh.visible).length, 6);
for (let step = 0; step < 29; step++) {
  warden.pos.z += .026;
  manager.animate(warden, .02, 15, 1);
}
assert.ok(Math.abs(warden.parts.kneeL.rotation.x) + Math.abs(warden.parts.kneeR.rotation.x) > .25);
assert.ok(effects.includes("guardianDust"));
warden.pos.z = legacy.z;

let atlasDisposals = 0;
warden.mat.map.addEventListener("dispose", () => { atlasDisposals++; });
manager.unloadChunk(chunk);
assert.equal(scene.children.length, 0);
assert.equal(atlasDisposals, 1);
assert.deepEqual(world.entityStore.get(chunk.key).map(e => [e.uid, e.hp, e.home, e.name, e.tame]),
  [[legacy.uid, legacy.hp, legacy.home, legacy.name, legacy.tame]]);
const stored = JSON.parse(JSON.stringify(manager.toJSON()));
world.entityStore = new Map(Object.entries(stored));
manager.loadChunk(chunk);
[warden] = manager.list;
assert.equal(warden.guardianView.variant, variation);
assert.equal(warden.guardianView.stage, 2);
assert.equal(manager.raycast({ x: 3.5, y: 42, z: 6 }, { x: 0, y: 0, z: -1 }, 4).ent, warden);

const hostile = manager.add("zombie", 3.5, 40, 4.5);
manager.thinkGolem(warden, 4, 1);
assert.equal(hostile.hp, 5);
assert.equal(hostile.vel.y, 8);
assert.equal(warden.attackCd, 1.5);
manager.thinkGolem(warden, 4, 1);
assert.equal(hostile.hp, 5);
manager.animate(warden, .1, 4, 1);
manager.animate(warden, .02, 4, 1);
assert.ok(warden.parts.armL.rotation.x < -1.3);
const villager = manager.add("villager", 5.5, 40, 2.5);
assert.equal(manager.damage(villager, 1, "player"), true);
assert.equal(warden.angry, 30);

warden.tame = false;
assert.ok(manager.damage(warden, 30, "player"));
manager.animate(warden, .05, 4, 1);
assert.equal(warden.guardianView.stage, 3);
warden.iframes = 0;
assert.ok(manager.damage(warden, 20, "player"));
assert.equal(warden.dead, GUARDIAN_DEATH);
assert.equal(manager.damage(warden, 1, "player"), false);
assert.equal(drops.length, 1);
assert.equal(drops[0][0], I.IRON_INGOT);
assert.ok(drops[0][1] >= 3 && drops[0][1] <= 5);
assert.ok(!manager.toJSON()[chunk.key]?.some(record => record.uid === legacy.uid));
manager.dyingGuardian(warden, .75, 1);
assert.equal(warden.guardianView.eyeLevel, 0);
assert.ok(warden.parts.body.position.y < 1.25);
assert.equal(warden.gone, undefined);
manager.dyingGuardian(warden, .31, 1);
manager.sweep();
assert.equal(warden.mesh, null);
assert.equal(drops.length, 1);
manager.clear();
assert.equal(scene.children.length, 0);
console.log("Ironwarden model, variant sharing, damage thresholds, light, gait, legacy hydration, combat, death, loot and scene cleanup passed.");
