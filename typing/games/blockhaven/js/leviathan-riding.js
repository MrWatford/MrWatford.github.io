import { B, BLOCKS, HEIGHT } from "./blocks.js";
import { blockBoxes } from "./player.js";

const EPS = 0.0001;
const unsafe = id => id === B.WATER || id === B.LAVA || id === B.FIRE || id === B.BERRY_BUSH || BLOCKS[id]?.hot;

function clearBody(world, player, x, y, z, height) {
  if (![x, y, z, height].every(Number.isFinite) || y < 1 || y + height > HEIGHT) return false;
  const box = player.aabb(x, y, z, height);
  for (let bx = Math.floor(box[0]); bx <= Math.floor(box[3] - EPS); bx++) {
    for (let bz = Math.floor(box[2]); bz <= Math.floor(box[5] - EPS); bz++) {
      if (!world.isLoaded(bx, bz)) return false;
      for (let by = Math.floor(y - 0.05); by < Math.ceil(y + height); by++) if (unsafe(world.id(bx, by, bz))) return false;
    }
  }
  return !player.collides(world, box);
}

function supported(world, player, x, y, z) {
  // All four corners need footing, rather than balancing an exit on a ledge.
  for (const dx of [-0.27, 0.27]) for (const dz of [-0.27, 0.27]) {
    if (!player.collides(world, [x + dx - 0.01, y - 0.06, z + dz - 0.01, x + dx + 0.01, y + 0.001, z + dz + 0.01])) return false;
  }
  return true;
}

function clearExitPath(world, player, from, to) {
  const sweep = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const steps = Math.ceil(Math.hypot(dx, dy, dz) / 0.35);
    if (steps > 40) return false;
    for (let i = 0; i <= steps; i++) {
      const t = steps ? i / steps : 0;
      if (!clearBody(world, player, a.x + dx * t, a.y + dy * t, a.z + dz * t, 1.8)) return false;
    }
    return true;
  };
  // Clear the higher footing before moving sideways, then descend at the
  // landing point. A straight diagonal would incorrectly clip sloping ground.
  const travelY = Math.max(from.y, to.y);
  const up = { x: from.x, y: travelY, z: from.z }, across = { x: to.x, y: travelY, z: to.z };
  return sweep(from, up) && sweep(up, across) && sweep(across, to);
}

export function canMountLeviathan(world, player, entity) {
  if (!entity.tame || !entity.emerged || entity.dead || entity.gone || entity.hp <= 0) return false;
  const { x, y, z } = entity.pos;
  return clearBody(world, player, x, y, z, entity.h + 1) && supported(world, player, x, y, z);
}

export function findLeviathanExit(world, player, entity) {
  const { x, y, z } = player.pos;
  // Prefer the sides, outside the head's horizontal body, before front/back.
  const angles = [Math.PI / 2, -Math.PI / 2, Math.PI, 0, Math.PI / 4, -Math.PI / 4, Math.PI * 3 / 4, -Math.PI * 3 / 4];
  const radius = entity.w * 0.5 + 1;
  for (const extra of [0, 1.5, 3]) for (const offset of angles) {
    const angle = entity.yaw + offset;
    const reach = (radius + extra) / Math.max(Math.abs(Math.sin(angle)), Math.abs(Math.cos(angle)));
    const px = x - Math.sin(angle) * reach, pz = z - Math.cos(angle) * reach;
    const bx = Math.floor(px), bz = Math.floor(pz);
    if (!world.isLoaded(bx, bz)) continue;
    const heights = new Set();
    for (let by = Math.min(HEIGHT - 1, Math.floor(y + 2)); by >= Math.max(0, Math.floor(y - 4)); by--) {
      const boxes = [];
      blockBoxes(world.get(bx, by, bz), bx, by, bz, boxes, world);
      for (const box of boxes) if (box[4] >= y - 3 && box[4] <= y + 2) heights.add(box[4]);
    }
    for (const py of [...heights].sort((a, b) => Math.abs(a - y) - Math.abs(b - y))) {
      const exit = { x: px, y: py, z: pz };
      if (clearBody(world, player, px, py, pz, 1.8) && supported(world, player, px, py, pz) && clearExitPath(world, player, player.pos, exit)) return exit;
    }
  }
  return null;
}

// Emergency recovery prefers nearby loaded dry ground before the old spawn
// placement fallback. This search never edits terrain or loads new chunks.
export function findLeviathanRecovery(world, player, origins) {
  const seen = new Set();
  for (const origin of origins.slice(0, 3)) {
    if (!origin || ![origin.x, origin.z].every(Number.isFinite)) continue;
    for (let ring = 0; ring <= 7; ring++) for (let dz = -ring; dz <= ring; dz++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue;
      const x = Math.floor(origin.x) + dx, z = Math.floor(origin.z) + dz, key = x + "," + z;
      if (seen.has(key)) continue; seen.add(key);
      if (!world.isLoaded(x, z)) continue;
      const y = world.surfaceY(x, z) + 1, ground = world.id(x, y - 1, z);
      if (unsafe(ground) || !BLOCKS[ground]?.solid || BLOCKS[ground]?.shape !== "cube" ||
          [B.LEAVES, B.BIRCH_LEAVES, B.LOG, B.BIRCH_LOG, B.BED, B.FARMLAND].includes(ground)) continue;
      if (clearBody(world, player, x + 0.5, y, z + 0.5, 1.8) && supported(world, player, x + 0.5, y, z + 0.5)) return { x: x + 0.5, y, z: z + 0.5 };
    }
  }
  return null;
}
