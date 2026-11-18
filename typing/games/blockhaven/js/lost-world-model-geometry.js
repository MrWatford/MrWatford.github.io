import * as THREE from "../lib/three.module.min.js";

// Bake small scale blocks into their animated body part. They share its atlas
// and draw call, so additional surface detail adds vertices instead of meshes.
export function createVoxelGeometry(part) {
  const boxes = part.voxelShell ? part.voxels : [[0, 0, 0, ...part.size], ...part.voxels];
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const source = unit.attributes;
  const count = source.position.count;
  const bounds = boxes.map(([x, y, z, w, h, d]) => [x - w / 2, y - h / 2, z - d / 2, x + w / 2, y + h / 2, z + d / 2]);
  const cells = new Map();
  const cellKey = (x, y, z) => Math.floor(x / 8) + "," + Math.floor(y / 8) + "," + Math.floor(z / 8);
  bounds.forEach((box, index) => {
    for (let z = Math.floor(box[2] / 8); z <= Math.floor(box[5] / 8); z++) {
      for (let y = Math.floor(box[1] / 8); y <= Math.floor(box[4] / 8); y++) {
        for (let x = Math.floor(box[0] / 8); x <= Math.floor(box[3] / 8); x++) {
          const key = x + "," + y + "," + z;
          if (!cells.has(key)) cells.set(key, []);
          cells.get(key).push(index);
        }
      }
    }
  });
  const nearby = (x, y, z) => cells.get(cellKey(x, y, z)) || [];
  const contains = (box, x, y, z) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
  const blocked = (x, y, z, self) => nearby(x, y, z).some(i => i !== self && contains(bounds[i], x, y, z));
  const positions = new Float32Array(boxes.length * count * 3);
  const normals = new Float32Array(positions.length);
  const uvs = new Float32Array(boxes.length * count * 2);
  const occlusion = new Float32Array(boxes.length * count).fill(1);
  const indices = [];
  boxes.forEach(([x, y, z, width, height, depth], box) => {
    for (let i = 0; i < count; i++) {
      const vertex = box * count + i;
      positions.set([
        (x + source.position.getX(i) * width) / 16,
        (y + source.position.getY(i) * height) / 16,
        (z + source.position.getZ(i) * depth) / 16
      ], vertex * 3);
      normals.set([source.normal.getX(i), source.normal.getY(i), source.normal.getZ(i)], vertex * 3);
      uvs.set([source.uv.getX(i), source.uv.getY(i)], vertex * 2);
    }
    // Retain the atlas vertex order and omit triangles buried in neighboring boxes.
    for (let face = 0; face < 6; face++) {
      const axis = Math.floor(face / 2), direction = face % 2 ? -1 : 1;
      const center = [x, y, z];
      center[axis] = bounds[box][axis + (direction > 0 ? 3 : 0)] + direction * 0.02;
      const covered = nearby(...center).some(i => i !== box && contains(bounds[i], ...center) &&
        bounds[box].every((value, side) => side % 3 === axis ||
          (side < 3 ? bounds[i][side] <= value : bounds[i][side] >= value)));
      if (covered) continue;
      for (let k = face * 6; k < face * 6 + 6; k++) indices.push(box * count + unit.index.array[k]);
      const tangents = [0, 1, 2].filter(a => a !== axis);
      const reach = Math.min(width, height, depth, 4) * 0.45;
      for (let k = 0; k < 4; k++) {
        const vertex = box * count + face * 4 + k;
        const point = Array.from(positions.subarray(vertex * 3, vertex * 3 + 3), v => v * 16);
        point[axis] += direction * 0.04;
        const [firstAxis, secondAxis] = tangents;
        const firstOffset = Math.sign(point[firstAxis] - [x, y, z][firstAxis]) * reach;
        const secondOffset = Math.sign(point[secondAxis] - [x, y, z][secondAxis]) * reach;
        const sampleA = point.slice(), sampleB = point.slice(), corner = point.slice();
        sampleA[firstAxis] += firstOffset;
        sampleB[secondAxis] += secondOffset;
        corner[firstAxis] += firstOffset;
        corner[secondAxis] += secondOffset;
        const shade = Number(blocked(...sampleA, box)) + Number(blocked(...sampleB, box)) + Number(blocked(...corner, box));
        occlusion[vertex] = 1 - shade * 0.13;
      }
    }
  });
  unit.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.userData.occlusion = occlusion;
  return geometry;
}

export function reptileScales([width, height, depth], spacing, relief = 1.2) {
  const boxes = [];
  let row = 0;
  for (let y = -height / 2 + spacing / 2; y < height / 2 - spacing / 3; y += spacing) {
    const shift = row++ % 2 * spacing / 2;
    for (let x = -width / 2 + spacing / 2 + shift; x < width / 2 - spacing / 3; x += spacing) {
      for (const side of [-1, 1]) {
        boxes.push([x, y, side * (depth / 2 + relief * 0.28), spacing * 0.72, spacing * 0.58, relief]);
      }
    }
    for (let z = -depth / 2 + spacing / 2 + shift; z < depth / 2 - spacing / 3; z += spacing) {
      for (const side of [-1, 1]) {
        boxes.push([side * (width / 2 + relief * 0.28), y, z, relief, spacing * 0.58, spacing * 0.72]);
      }
    }
  }
  return boxes;
}

export function reptileSurface([width, height, depth], spacing, relief) {
  const rows = Math.ceil(height / spacing), slices = Math.ceil(depth / spacing);
  const dy = height / rows, dz = depth / slices;
  const boxes = [];
  for (let row = 0; row < rows; row++) {
    const y = -height / 2 + dy * (row + 0.5);
    for (let slice = 0; slice < slices; slice++) {
      const z = -depth / 2 + dz * (slice + 0.5);
      const inside = 1 - Math.abs(y * 2 / height) ** 2.6 - Math.abs(z * 2 / depth) ** 2.6;
      if (inside <= 0) continue;
      const radius = width / 2 * inside ** (1 / 2.6);
      const halfWidth = Math.min(width / 2, Math.max(spacing / 4, Math.round(radius / spacing) * spacing));
      boxes.push([0, y, z, halfWidth * 2, dy, dz]);
      for (const side of [-1, 1]) {
        boxes.push([side * (halfWidth + relief * 0.25), y, z, relief, dy * 0.78, dz * 0.76]);
      }
    }
  }
  return boxes;
}

export function reptileTail(length, sections, spacing, relief) {
  const step = length / sections.length;
  const [width, height] = sections.at(-1);
  const voxels = [];
  sections.forEach(([w, h], i) => {
    const z = length / 2 - step * (i + 0.5);
    voxels.push([0, 0, z, w, h, step]);
    for (const [x, y, localZ, ...size] of reptileScales([w, h, step], spacing, relief)) {
      voxels.push([x, y, localZ + z, ...size]);
    }
  });
  return { size: [width, height, length], voxels };
}
