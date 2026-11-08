import * as THREE from "../lib/three.module.min.js";

// A closed shell with a recessed throat. Face slots refer to the existing skin
// atlas, so all surfaces still share the creature's material and draw call.
export function createMawShell(size) {
  const positions = [], uvs = [], faceTiles = [];
  const rx = size[0] / 32, ry = size[1] / 32, depth = size[2] / 32;
  const sides = 12;
  const ring = (i, radius, z) => {
    const angle = i * Math.PI * 2 / sides;
    return [Math.sin(angle) * rx * radius, Math.cos(angle) * ry * radius, z];
  };
  const triangle = (a, b, c, slot, uv = [[0, 0], [1, 0], [1, 1]]) => {
    for (let i = 0; i < 3; i++) {
      positions.push(...[a, b, c][i]); uvs.push(...uv[i]); faceTiles.push(slot);
    }
  };
  const quad = (a, b, c, d, slot) => {
    triangle(a, b, c, slot);
    triangle(a, c, d, slot, [[0, 0], [1, 1], [0, 1]]);
  };
  for (let i = 0; i < sides; i++) {
    const next = i + 1;
    const front = ring(i, 1, depth), frontNext = ring(next, 1, depth);
    const back = ring(i, 1, -depth), backNext = ring(next, 1, -depth);
    const lip = ring(i, 0.78, depth), lipNext = ring(next, 0.78, depth);
    const throat = ring(i, 0.34, -depth * 0.8), throatNext = ring(next, 0.34, -depth * 0.8);
    quad(front, frontNext, backNext, back, 0);
    quad(frontNext, front, lip, lipNext, 0);
    quad(lipNext, lip, throat, throatNext, 4);
    triangle(back, backNext, [0, 0, -depth], 0);
    triangle(throatNext, throat, [0, 0, -depth * 0.8], 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.userData.faceTiles = faceTiles;
  return geometry;
}
