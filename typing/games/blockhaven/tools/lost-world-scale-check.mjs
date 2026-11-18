import assert from "node:assert/strict";
import * as THREE from "../lib/three.module.min.js";
import { installGodzilla, animateGodzilla, GODZILLA_HEIGHT } from "../js/godzilla-model.js";
import { installTyrannosaurus, animateTyrannosaurus, TYRANNOSAURUS_HEIGHT } from "../js/lost-world-tyrannosaurus.js";
import { createVoxelGeometry } from "../js/lost-world-model-geometry.js";

// Build the actual parent hierarchy and geometry, without a browser or textures.
const species = {};
installGodzilla(species); installTyrannosaurus(species);
for (const def of Object.values(species)) {
  const root = new THREE.Group(), parts = {}, geometries = [];
  for (const p of def.model.parts) {
    const pivot = new THREE.Group(); pivot.position.fromArray(p.pivot).multiplyScalar(1 / 16);
    if (p.rotation) pivot.rotation.set(...p.rotation);
    const geometry = p.voxels ? createVoxelGeometry(p) : new THREE.BoxGeometry(...p.size.map(v => v / 16));
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry); mesh.position.fromArray(p.off).multiplyScalar(1 / 16);
    pivot.add(mesh); (p.parent ? parts[p.parent].children[0] : root).add(pivot); parts[p.name] = pivot;
  }
  root.scale.setScalar(def.scale);
  const e = { parts, age: 0, atomicCharge: false, atomicFiring: false };
  if (def.godzilla) animateGodzilla(e, 1, true); else animateTyrannosaurus(e, 0, true);
  const standing = new THREE.Box3().setFromObject(root);
  assert(Math.abs(standing.min.y) < .01, def.name + " stands on the ground");
  assert(Math.abs(standing.max.y - def.h) < .01, def.name + " rendered and collision height agree");
  assert.equal(def.h, def.godzilla ? GODZILLA_HEIGHT : TYRANNOSAURUS_HEIGHT);
  assert.equal(def.h, def.godzilla ? 24 : 10);
  let maxRadius = 0;
  for (const reduced of [true, false]) for (const state of ["idle", "charge", "fire"]) for (const age of [0, 1, 3, 7, 11]) {
    e.age = age; e.atomicCharge = state === "charge"; e.atomicFiring = state === "fire";
    if (def.godzilla) animateGodzilla(e, 1, reduced); else animateTyrannosaurus(e, Math.sin(age), reduced);
    root.updateMatrixWorld(true);
    root.traverse(o => {
      if (!o.isMesh) return;
      const attribute = o.geometry.attributes.position;
      for (let i = 0; i < attribute.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(attribute, i).applyMatrix4(o.matrixWorld);
        assert(v.toArray().every(Number.isFinite));
        maxRadius = Math.max(maxRadius, Math.hypot(v.x, v.z));
      }
    });
  }
  if (def.godzilla) assert(maxRadius < 24, "The full animated Godzilla rig fits the unchanged caldera floor");
  console.log(def.name, JSON.stringify({ standingHeight: standing.max.y, feet: standing.min.y, colliderHeight: def.h, colliderWidth: def.w, maxAnimatedRadius: maxRadius }));
  for (const geometry of geometries) geometry.dispose();
}
