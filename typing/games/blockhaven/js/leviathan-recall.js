import { B, BLOCKS, CHUNK, HEIGHT, SOLID } from "./blocks.js";

const unsafe = id => id === B.WATER || id === B.LAVA || id === B.FIRE || id === B.BERRY_BUSH || BLOCKS[id]?.hot;

// One fixed candidate per horn use: never generate chunks or change terrain.
// A buffer around the physical head protects nearby walls and landing space.
export function clearRecallFootprint(world, site, body, actors = [], sandOnly = false) {
  const radius = body.w * 0.5 + 1, height = body.h + 2;
  if (![site.x, site.y, site.z, radius, height].every(Number.isFinite) || radius < 1 || radius > 6 || height < 1 || height > 12 || site.y < 8 || site.y + height >= HEIGHT) return false;
  if (actors.some(e => !e.dead && !e.gone && e.pos && Math.abs(e.pos.y - site.y) < height + (e.h || 2) &&
      Math.abs(e.pos.x - site.x) < radius + (e.w || 1) / 2 && Math.abs(e.pos.z - site.z) < radius + (e.w || 1) / 2)) return false;
  for (let x = Math.floor(site.x - radius); x <= Math.floor(site.x + radius); x++) {
    for (let z = Math.floor(site.z - radius); z <= Math.floor(site.z + radius); z++) {
      if (!world.isLoaded(x, z)) return false;
      const ground = world.id(x, site.y - 1, z);
      if (sandOnly ? ground !== B.SAND : !SOLID[ground] || unsafe(ground) || BLOCKS[ground]?.shape !== "cube" || ground === B.BED || ground === B.FARMLAND) return false;
      for (let y = site.y; y < site.y + height; y++) if (world.id(x, y, z) !== B.AIR) return false;
    }
  }
  return true;
}

export function protectedDesertFootprint(world, gen, site, body) {
  const radius = body.w * 0.5 + 1;
  if (![radius, body.h, site.x, site.y, site.z].every(Number.isFinite) || radius < 1 || radius > 6 || body.h < 1 || body.h > 10) return true;
  const minX = Math.floor(site.x - radius), maxX = Math.floor(site.x + radius);
  const minZ = Math.floor(site.z - radius), maxZ = Math.floor(site.z + radius);
  if ((gen.stamps || []).some(s => minX < s.x + s.size && maxX >= s.x && minZ < s.z + s.size && maxZ >= s.z)) return true;
  for (let bx = minX; bx <= maxX; bx++) for (let bz = minZ; bz <= maxZ; bz++) {
    const cx = Math.floor(bx / CHUNK), cz = Math.floor(bz / CHUNK), mods = world.mods?.get(cx + "," + cz);
    // Reject edited columns throughout the visible emergence and body volume.
    if (mods) for (let y = Math.max(0, site.y - 8); y < Math.min(HEIGHT, site.y + body.h + 2); y++) {
      if (mods.has(bx - cx * CHUNK + (bz - cz * CHUNK) * CHUNK + y * CHUNK * CHUNK)) return true;
    }
  }
  return false;
}

export function planDesertRecall(world, gen, player, body, actors = []) {
  const p = player.pos;
  if (![p.x, p.y, p.z, player.yaw].every(Number.isFinite)) return null;
  const x = Math.floor(p.x - Math.sin(player.yaw) * 10), z = Math.floor(p.z - Math.cos(player.yaw) * 10);
  if (!world.isLoaded(x, z) || !world.isLoaded(p.x, p.z) || gen.column(x, z).biome !== "sandy") return null;
  const site = { x: x + 0.5, y: world.surfaceY(x, z) + 1, z: z + 0.5 };
  if (Math.abs(site.y - p.y) > 3 || p.y < world.surfaceY(Math.floor(p.x), Math.floor(p.z)) + 0.5 || protectedDesertFootprint(world, gen, site, body)) return null;
  return clearRecallFootprint(world, site, body, actors, true) ? site : null;
}
