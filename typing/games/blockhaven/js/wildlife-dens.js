import { B, CHUNK, HEIGHT, SOLID } from "./blocks.js";

const shelter = new Set([B.STONE, B.DIRT, B.GRASS, B.LEAVES, B.BIRCH_LEAVES]);
const naturalFloor = new Set([B.STONE, B.DIRT, B.GRASS]);
const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];

export function grizzlyDenRoom(world, x, y, z) {
  if (y < 2 || y + 6 >= HEIGHT) return false;
  let covered = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const tx = x + dx, tz = z + dz;
    if (!world.isLoaded(tx, tz) || !naturalFloor.has(world.id(tx, y - 1, tz))) return false;
    for (let dy = 0; dy < 3; dy++) {
      if (world.id(tx, y + dy, tz) !== B.AIR) return false;
    }
    for (let dy = 3; dy <= 6; dy++) {
      const roof = world.id(tx, y + dy, tz);
      if (roof === B.AIR) continue;
      if (shelter.has(roof)) covered++;
      break;
    }
  }
  return covered >= 5;
}

export function findGrizzlyDen(world, x, y, z) {
  for (const [dx, dz] of directions) {
    // A continuous, level approach keeps the wide grizzly out of narrow tunnels.
    for (let step = 1; step <= 8; step++) {
      const tx = x + dx * step, tz = z + dz * step;
      let clear = true;
      for (let side = -1; side <= 1 && clear; side++) {
        const px = tx + dz * side, pz = tz - dx * side;
        const key = Math.floor(px / CHUNK) + "," + Math.floor(pz / CHUNK);
        if (!world.isLoaded(px, pz) || world.mods?.get(key)?.size ||
            !naturalFloor.has(world.id(px, y - 1, pz))) {
          clear = false;
          break;
        }
        for (let height = 0; height < 3; height++) {
          const id = world.id(px, y + height, pz);
          if (SOLID[id] || id === B.WATER || id === B.LAVA) { clear = false; break; }
        }
      }
      if (!clear) break;
      if (step >= 3 && grizzlyDenRoom(world, tx, y, tz)) {
        // Confirm the far edge of the room lies on untouched terrain too.
        const farX = tx + dx, farZ = tz + dz;
        if ([-1, 0, 1].every(side => {
          const cx = Math.floor((farX + dz * side) / CHUNK), cz = Math.floor((farZ - dx * side) / CHUNK);
          return !world.mods?.get(cx + "," + cz)?.size;
        })) return [tx + 0.5, y, tz + 0.5];
      }
    }
  }
  return null;
}
