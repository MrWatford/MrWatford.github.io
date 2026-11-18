import assert from "node:assert/strict";
import { installGodzilla } from "../js/godzilla-model.js";
import { installTyrannosaurus } from "../js/lost-world-tyrannosaurus.js";
import { createVoxelGeometry } from "../js/lost-world-model-geometry.js";

for (const [name, size, voxels, triangles] of [
  ["touching cubes", [8, 8, 8], [[8, 0, 0, 8, 8, 8]], 20],
  ["separate cubes", [8, 8, 8], [[10, 0, 0, 8, 8, 8]], 24],
  ["enclosed cube", [16, 16, 16], [[0, 0, 0, 4, 4, 4]], 12],
  ["partial face", [16, 16, 16], [[12, 0, 0, 8, 8, 8]], 22]
]) {
  const geometry = createVoxelGeometry({ size, voxels });
  assert.equal(geometry.index.count / 3, triangles, name);
  assert(geometry.userData.occlusion.every(value => value >= 0.6 && value <= 1));
  geometry.dispose();
}

const species = {};
installGodzilla(species);
installTyrannosaurus(species);
for (const def of Object.values(species)) {
  const names = new Set();
  let triangles = 0, originalTriangles = 0;
  for (const part of def.model.parts) {
    assert(!names.has(part.name), part.name + " is unique");
    assert(!part.parent || names.has(part.parent), part.name + " parent precedes child");
    names.add(part.name);
    for (const paint of Object.values(part.paint)) {
      paint({
        fill() {},
        rect(x, y, width, height) {
          assert(x >= 0 && y >= 0 && x + width <= 16 && y + height <= 16, part.name + " atlas boundary");
        },
        px(x, y) {
          assert(x >= 0 && y >= 0 && x < 16 && y < 16, part.name + " pixel boundary");
        }
      });
    }
    if (!part.voxels) { triangles += 12; originalTriangles += 12; continue; }
    const geometry = createVoxelGeometry(part);
    const { position, normal, uv } = geometry.attributes;
    assert(position.count > 0 && geometry.index.count > 0, part.name + " has a surface");
    assert.equal(position.count, normal.count);
    assert.equal(position.count, uv.count);
    assert(position.array.every(Number.isFinite));
    assert(geometry.index.array.every(index => index < position.count));
    assert(geometry.userData.occlusion.every(value => value >= 0.6 && value <= 1));
    triangles += geometry.index.count / 3;
    originalTriangles += (part.voxels.length + (part.voxelShell ? 0 : 1)) * 12;
    geometry.dispose();
  }
  assert(triangles < originalTriangles, def.name + " hidden faces removed");
  console.log(def.name + " hierarchy, atlas, indices, shading, and hidden faces passed. " + triangles + " / " + originalTriangles + " triangles.");
}
