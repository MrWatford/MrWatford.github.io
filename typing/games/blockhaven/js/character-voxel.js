// Shared voxel part baker. Each moving joint uses one indexed mesh regardless of
// how many opaque plates, fabric layers, or details are attached to it.
import * as THREE from "../lib/three.module.min.js";

const TILE = 16;
const MATERIALS = ["skin", "linen", "wool", "fur", "leather", "iron", "brass", "wood", "straw", "leaves", "ink"];
const PATTERNS = [
  [6, 10], [19, 14], [23, 20], [36, 23], [28, 25],
  [16, 32], [11, 37], [30, 29], [34, 34], [40, 27], [0, 0]
];
const faceShade = [0.83, 0.70, 1, 0.60, 0.94, 0.72];
let atlas;

export function characterAtlas() {
  if (atlas) return atlas;
  const width = TILE * MATERIALS.length;
  const pixels = new Uint8Array(width * TILE * 4);
  for (let m = 0; m < MATERIALS.length; m++) {
    const [grain, pattern] = PATTERNS[m];
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const noise = ((x * 73 + y * 151 + x * y * 67) ^ (x * 331 + y * 29)) & 31;
        let detail = 0;
        switch (MATERIALS[m]) {
          case "linen": detail = (x % 2 + y % 2) * 0.31; break;
          case "wool": detail = (x + y) % 3 === 0 ? 0.68 : 0; break;
          case "fur": detail = ((x + (y >> 1)) % 4 === 0 ? 0.85 : 0.10); break;
          case "leather": detail = (x + y * 2) % 11 === 0 ? 0.83 : 0; break;
          case "iron": detail = (x + y * 3) % 19 === 0 ? 0.73 : 0; break;
          case "brass": detail = y % 7 === 0 ? 0.62 : 0; break;
          case "wood": detail = (y + (x >> 3)) % 4 === 0 ? 0.81 : 0; break;
          case "straw": detail = (x + (y >> 2)) % 3 === 0 ? 0.81 : 0; break;
          case "leaves": detail = (x ^ y) % 4 === 0 ? 0.76 : 0; break;
          default: detail = 0;
        }
        const i = (x + m * TILE + y * width) * 4;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 255 - Math.round(grain * noise / 31 + pattern * detail);
        pixels[i + 3] = 255;
      }
    }
  }
  atlas = new THREE.DataTexture(pixels, width, TILE);
  atlas.name = "BlockHaven character materials";
  atlas.magFilter = atlas.minFilter = THREE.NearestFilter;
  atlas.needsUpdate = true;
  return atlas;
}

const cube = new THREE.BoxGeometry(1, 1, 1);
const cubeAttrs = cube.attributes;
const faceSize = [[2, 1], [2, 1], [0, 2], [0, 2], [0, 1], [0, 1]];
const tint = new THREE.Color();

export function bakeCharacterBoxes(boxes, origin = [0, 0, 0]) {
  const position = [], normal = [], color = [], uv = [], index = [];
  for (const { at, size, pigment, surface, faces = [0, 1, 2, 3, 4, 5] } of boxes) {
    const tile = MATERIALS.indexOf(surface);
    // The two entry points configure Three.js color management differently.
    tint.setHex(pigment, THREE.LinearSRGBColorSpace).convertSRGBToLinear();
    for (const f of faces) {
      const [uAxis, vAxis] = faceSize[f];
      const uSpan = Math.min(TILE - 0.5, Math.max(0.5, size[uAxis]));
      const vSpan = Math.min(TILE - 0.5, Math.max(0.5, size[vAxis]));
      const n = position.length / 3;
      for (let j = 0; j < 4; j++) {
        const i = f * 4 + j;
        for (let axis = 0; axis < 3; axis++) {
          position.push((at[axis] - origin[axis] + size[axis] * cubeAttrs.position.array[i * 3 + axis]) / 16);
          normal.push(cubeAttrs.normal.array[i * 3 + axis]);
        }
        const s = faceShade[f];
        color.push(tint.r * s, tint.g * s, tint.b * s);
        uv.push((tile * TILE + 0.25 + uSpan * cubeAttrs.uv.getX(i)) / (TILE * MATERIALS.length),
          (0.25 + vSpan * cubeAttrs.uv.getY(i)) / TILE);
      }
      index.push(n, n + 2, n + 1, n + 2, n + 3, n + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(index);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeBoundingSphere();
  return geometry;
}
