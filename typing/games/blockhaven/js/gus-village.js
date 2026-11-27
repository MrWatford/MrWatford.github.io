import * as THREE from "../lib/three.module.min.js";

// Small, deterministic tile textures for the campaign's authored plaza.
export function gusSurface(pattern) {
  const size = 32;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const grain = ((Math.imul(x + 13, y + 71) ^ (x << 4) ^ (y << 2)) % 19) - 9;
      let value = 225 + grain;
      if (pattern === "stone" || pattern === "roof") {
        const row = y >> 3;
        const column = ((x + (row % 2) * 8) % size) >> 4;
        value += ((column * 31 + row * 17) % 33) - 16;
        if (y % 8 === 0 || (x + (row % 2) * 8) % 16 === 0) value -= 64;
        else if (y % 8 === 1) value += 13;
      } else if (pattern === "wood") {
        value += (x * 11 % 23) - 11;
        if (x % 8 === 0) value -= 47;
        if ((x * 13 + y * 7) % 41 === 0) value -= 24;
      }
      pixels.set([value, value, value, 255], (x + y * size) * 4);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function dressGusVillage(scene, cube) {
  const stone = gusSurface("stone");
  const pavingStone = gusSurface("stone");
  const timber = gusSurface("wood");
  const roof = gusSurface("roof");
  const plaster = gusSurface("plaster");
  const batches = new Map();
  const lampGlass = new THREE.MeshStandardMaterial({color: 0xffcb7b, emissive: 0xf59632, emissiveIntensity: 1.6});
  function block(surface, color, x, y, z, w, h, d) {
    if (!batches.has(surface)) batches.set(surface, []);
    batches.get(surface).push({color, x, y, z, w, h, d});
  }

  // Dry-laid paving follows the existing combat plane at y=0.
  block(plaster, 0x6f844c, 0, -0.51, 0, 96, 0.92, 96);
  const paving = [0x9c9987, 0xaaa592, 0x8b8e82, 0xb3aa92, 0x999687];
  for (let z = -19; z < 21; z++) {
    for (let x = -15; x < 15; x++) {
      const border = Math.abs(x + 0.5) > 13.5 || Math.abs(z + 0.5) > 17.5;
      const inlay = (x + 15) % 5 === 0 && (z + 20) % 5 === 0;
      const color = border ? 0x737b78 : inlay ? 0x6e746a : paving[((x + 15) * 7 + (z + 19) * 13) % paving.length];
      block(pavingStone, color, x + 0.5, -0.08, z + 0.5, 1, 0.16, 1);
    }
  }

  function lantern(x, y, z) {
    block(lampGlass, 0xffffff, x, y, z, 0.32, 0.42, 0.3);
    for (const offset of [-0.225, 0.225]) {
      block(timber, 0x452e25, x, y + offset, z, 0.44, 0.07, 0.41);
    }
    for (const dx of [-0.17, 0.17]) for (const dz of [-0.16, 0.16]) {
      block(null, 0x51402c, x + dx, y, z + dz, 0.035, 0.45, 0.035);
    }
  }

  // Each façade faces the square. Shared architectural details tie together different silhouettes.
  function house(x, z, side, width, height, roofColor, wallColor) {
    const wall = x - side * 3.35;
    const face = x - side * 3.48;
    block(stone, 0x747974, x, 0.5, z, 6.7, 1, width + 0.3);
    block(plaster, wallColor, x, 1 + height / 2, z, 6.65, height, width);
    for (const offset of [-width / 2 + 0.14, 0, width / 2 - 0.14]) {
      block(timber, 0x554030, face, 1 + height / 2, z + offset, 0.25, height + 0.1, 0.24);
    }
    for (const y of [0.95, 1 + height * 0.54, height + 0.98]) {
      block(timber, 0x594232, face, y, z, 0.24, 0.19, width + 0.25);
    }
    block(timber, 0x735132, wall - side * 0.21, 1.23, z - 0.93, 0.25, 2.46, 1.22);
    block(stone, 0x7e7d70, wall - side * 0.38, 0.1, z - 0.93, 0.86, 0.2, 1.56);
    for (const [y, offset] of [[2.05, 1.25], [height + 0.15, -1.23], [height + 0.15, 1.25]]) {
      block(timber, 0x4d392a, face - side * 0.06, y, z + offset, 0.25, 0.94, 0.95);
      block(lampGlass, 0xf4ba78, face - side * 0.2, y, z + offset, 0.035, 0.61, 0.63);
      block(timber, 0x664c36, face - side * 0.26, y, z + offset, 0.09, 0.61, 0.065);
      block(timber, 0x664c36, face - side * 0.26, y, z + offset, 0.09, 0.065, 0.64);
      block(stone, 0x8c8472, face - side * 0.19, y - 0.46, z + offset, 0.38, 0.12, 1.08);
    }
    for (let tier = 0; tier < 6; tier++) {
      const span = width + 1.25 - tier * (width / 6);
      const y = height + 1.12 + tier * 0.42;
      block(roof, roofColor, x, y, z, 7.45, 0.46, span);
      block(timber, 0x624737, x - side * 3.79, y - 0.11, z, 0.17, 0.17, span + 0.08);
    }
    block(stone, 0x77736b, x + side * 1.6, height + 2.75, z + 1.05, 0.88, 2.85, 0.9);
    block(stone, 0x908a7e, x + side * 1.6, height + 4.14, z + 1.05, 1.1, 0.22, 1.1);
    lantern(face - side * 0.36, 2.68, z - 0.95);
  }

  function stall(x, z, color) {
    for (const dx of [-0.62, 0.62]) for (const dz of [-1.55, 1.55]) {
      block(timber, 0x61442c, x + dx, 1.27, z + dz, 0.15, 2.54, 0.15);
    }
    block(timber, 0x8c6342, x, 0.91, z, 1.45, 0.16, 3.32);
    for (let stripe = 0; stripe < 7; stripe++) {
      const offset = (stripe - 3) * 0.5;
      const cloth = stripe % 2 ? 0xd8c8a3 : color;
      block(plaster, cloth, x, 2.59, z + offset, 1.9, 0.13, 0.5);
      block(plaster, cloth, x - Math.sign(x) * 0.91, 2.44, z + offset, 0.14, 0.21, 0.5);
    }
    for (const dz of [-0.96, 0, 0.96]) {
      block(timber, 0x9d7147, x, 1.1, z + dz, 0.86, 0.25, 0.75);
      for (const dx of [-0.24, 0, 0.24]) {
        block(null, dz ? 0x8a9b45 : 0xb0673d, x + dx, 1.26, z + dz, 0.19, 0.14, 0.22);
      }
    }
  }

  function tree(x, z, height, green) {
    block(timber, 0x625038, x, height * 0.36, z, 0.66, height * 0.72, 0.66);
    for (const [dx, dy, dz, size] of [[0, 0, 0, 3.45], [-1.15, -0.5, 0.3, 1.7], [0.85, 0.3, -0.92, 2], [0, 1.22, 0.25, 2.05]]) {
      block(plaster, green, x + dx, height * 0.72 + dy, z + dz, size, size * 0.67, size);
    }
  }

  for (const side of [-1, 1]) {
    house(21 * side, -12, side, 7.2, 4.4, 0x94503c, 0xd2b38b);
    house(21.9 * side, -2, side, 8.3, 5.1, 0x4f655e, 0xddc29a);
    house(21 * side, 10, side, 7.4, 4, 0xa05841, 0xcbb18b);
    stall(17 * side, -6, 0x51796b);
    stall(17 * side, 4, 0xa95745);
    for (const z of [-14, 0, 13]) {
      const x = side * 15.85;
      block(stone, 0x80857a, x, 0.28, z, 0.56, 0.56, 0.56);
      block(timber, 0x624533, x, 1.47, z, 0.21, 2.3, 0.21);
      lantern(x, 2.77, z);
    }
    for (const z of [-17, 8, 17]) {
      const x = side * 18;
      block(stone, 0x858578, x, 0.19, z, 3.25, 0.38, 2.55);
      block(plaster, 0x61784c, x, 0.36, z, 2.98, 0.23, 2.31);
      tree(x, z, 5.3, z === 8 ? 0x66834d : 0x526d45);
      for (const offset of [-1.1, 1.12]) {
        block(null, 0xd19766, x + offset, 0.56, z + 0.83, 0.21, 0.25, 0.21);
      }
    }
  }

  // North wall is a distant backdrop. The finale's functional portal sits in front of it.
  for (const x of [-13, 13]) {
    block(stone, 0x8f9387, x, 2.3, -21, 8.7, 4.6, 2.15);
    for (const cap of [-3.8, -1.9, 0, 1.9, 3.8]) {
      block(stone, 0x9d9a8a, x + cap, 4.88, -21, 0.92, 0.67, 2.25);
    }
    block(stone, 0x96998d, x * 0.63, 3.35, -21, 3.05, 6.7, 3.45);
    for (let tier = 0; tier < 5; tier++) {
      const span = 3.65 - tier * 0.61;
      block(roof, 0x53615a, x * 0.63, 6.8 + tier * 0.39, -21, span, 0.41, span);
    }
  }
  for (let i = 0; i < 28; i++) {
    const x = (i % 14 - 6.5) * 5 + (i < 14 ? 0 : 2.1);
    const z = -25 - (i % 3) * 2.7 - (i < 14 ? 0 : 8);
    tree(x, z, 6.1 + (i % 5) * 0.85, i % 3 ? 0x526e51 : 0x5d8158);
  }

  // The southern entry frames the campaign menu from across the square.
  for (const side of [-1, 1]) {
    const x = side * 7.25;
    block(stone, 0x8a8679, x, 2.4, 24, 5.1, 4.8, 3.9);
    block(plaster, 0xc6a880, x, 5.8, 24, 4.9, 2, 3.65);
    for (const offset of [-2.2, 2.2]) {
      block(timber, 0x5e4635, x + offset, 5.8, 22.14, 0.25, 2.05, 0.22);
    }
    block(timber, 0x624737, x, 6.77, 22.1, 5.2, 0.21, 0.26);
    for (let tier = 0; tier < 6; tier++) {
      block(roof, 0x845847, x, 6.86 + tier * 0.42, 24, 5.75 - tier * 0.84, 0.46, 4.5);
    }
    lantern(side * 5.65, 3.5, 22);
    stall(side * 11.5, 19.3, side === -1 ? 0xa95745 : 0x51796b);
    tree(side * 13.3, 26, 8.8, 0x597752);
    tree(side * 1.4, 31, 7.9, 0x657a4e);
  }
  block(stone, 0x969487, 0, 5.4, 24, 10, 1.1, 2.8);
  block(timber, 0x654838, 0, 6.05, 24, 10.2, 0.22, 3.1);
  for (const x of [-3.9, -1.95, 0, 1.95, 3.9]) {
    block(stone, 0x99927f, x, 6.26, 23, 0.86, 0.64, 0.64);
  }

  const placement = new THREE.Object3D();
  const tint = new THREE.Color();
  const groundTile = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const village = new THREE.Group();
  village.name = "Village square";
  for (const [surface, blocks] of batches) {
    const material = surface === lampGlass ? surface : new THREE.MeshStandardMaterial({map: surface, roughness: 0.96});
    const ground = surface === pavingStone;
    const mesh = new THREE.InstancedMesh(ground ? groundTile : cube, material, blocks.length);
    blocks.forEach(({color, x, y, z, w, h, d}, index) => {
      placement.position.set(x, ground ? 0 : y, z);
      placement.scale.set(w, h, d);
      placement.updateMatrix();
      mesh.setMatrixAt(index, placement.matrix);
      mesh.setColorAt(index, tint.setHex(color));
    });
    mesh.castShadow = surface !== lampGlass && surface !== pavingStone;
    mesh.receiveShadow = true;
    village.add(mesh);
  }
  scene.add(village);
}
