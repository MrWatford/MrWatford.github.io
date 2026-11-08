import { B, BLOCKS, HEIGHT, SOLID } from "./blocks.js";

export const LEVIATHAN_BONDS = {
  dune: { species: "leviathan_dune", label: "Dune Leviathan", hp: 180 },
  obsidian: { species: "leviathan_obsidian", label: "Obsidian Leviathan", hp: 260 }
};

export function normalizeBondName(value) {
  if (typeof value !== "string") throw new Error("Enter a name for your Leviathan.");
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "").trim()).slice(0, 24).join("");
}

export function validBondPreferences(record) {
  return (record.name === undefined || typeof record.name === "string" && !!record.name && normalizeBondName(record.name) === record.name) &&
    (record.command === undefined || record.command === "wait" || record.command === "follow") &&
    (record.mountedReadyAt === undefined || Number.isFinite(record.mountedReadyAt) && record.mountedReadyAt >= 0) &&
    (record.burrowReadyAt === undefined || Number.isFinite(record.burrowReadyAt) && record.burrowReadyAt >= 0);
}

export function applyBondPreferences(entity, record) {
  entity.name = record.name || null;
  entity.bondCommand = record.command || "wait";
}

export function updateBondPreference(record, action, value) {
  if (!record?.bonded || record.defeated) return false;
  if (action === "name") {
    const name = normalizeBondName(value);
    if (name) record.name = name; else delete record.name;
  } else if (action === "wait" || action === "follow") record.command = action;
  else return false;
  return true;
}

const unsafe = id => id === B.WATER || id === B.LAVA || id === B.FIRE || id === B.BERRY_BUSH || BLOCKS[id]?.hot;

function clearSurface(world, entity, x, z) {
  const radius = entity.w * 0.5;
  const minX = Math.floor(x - radius), maxX = Math.floor(x + radius);
  const minZ = Math.floor(z - radius), maxZ = Math.floor(z + radius);
  let low = HEIGHT, high = 0;
  for (let bx = minX; bx <= maxX; bx++) for (let bz = minZ; bz <= maxZ; bz++) {
    if (!world.isLoaded(bx, bz)) return null;
    let ground = null;
    for (let by = Math.floor(entity.pos.y); by >= Math.max(1, Math.floor(entity.pos.y) - 2); by--) {
      const id = world.id(bx, by, bz);
      if (unsafe(id)) return null;
      if (SOLID[id]) {
        if (BLOCKS[id]?.shape !== "cube" || id === B.BED || id === B.FARMLAND) return null;
        ground = by; break;
      }
    }
    if (ground === null) return null;
    low = Math.min(low, ground + 1); high = Math.max(high, ground + 1);
  }
  if (high - low > 1 || Math.abs(high - entity.pos.y) > 1 || high + entity.h + 1 > HEIGHT) return null;
  for (let bx = minX; bx <= maxX; bx++) for (let bz = minZ; bz <= maxZ; bz++) {
    for (let by = high; by < Math.ceil(high + entity.h + 1); by++) {
      const id = world.id(bx, by, bz);
      if (SOLID[id] || unsafe(id)) return null;
    }
  }
  return high;
}

export function planBondFollow(world, entity, player) {
  const dx = player.pos.x - entity.pos.x, dz = player.pos.z - entity.pos.z, distance = Math.hypot(dx, dz);
  if (distance <= entity.w * 0.5 + 4 || distance > 52 || Math.abs(player.pos.y - entity.pos.y) > 3) return null;
  const length = Math.min(1.2, distance - entity.w * 0.5 - 4);
  let y = entity.pos.y;
  for (let i = 0; i <= 4; i++) {
    y = clearSurface(world, entity, entity.pos.x + dx / distance * length * i / 4, entity.pos.z + dz / distance * length * i / 4);
    if (y === null) return null;
  }
  return { x: entity.pos.x + dx / distance * length, y, z: entity.pos.z + dz / distance * length, speed: 3 };
}

export function thinkBondedLeviathan(world, entity, player, record) {
  if (!record?.bonded) { entity.goal = null; entity.vel.x = entity.vel.y = entity.vel.z = 0; return; }
  applyBondPreferences(entity, record);
  if (entity.ridden) return;
  if (entity.bondArrival) {
    const a = entity.bondArrival;
    if (Math.hypot(entity.pos.x - a.x, entity.pos.y - a.y, entity.pos.z - a.z) > 0.4) return;
    if (clearSurface(world, entity, a.x, a.z) !== a.y) {
      entity.goal = null; entity.vel.x = entity.vel.y = entity.vel.z = 0; return;
    }
    entity.pos.x = a.x; entity.pos.y = a.y; entity.pos.z = a.z;
    entity.bondArrival = null;
  }
  entity.goal = entity.bondCommand === "follow" ? planBondFollow(world, entity, player) : null;
  entity.bondRouteVersion = world.editCount;
  if (!entity.goal) entity.vel.x = entity.vel.y = entity.vel.z = 0;
}

export function stepBondedLeviathan(world, entity, dt) {
  if (!entity.tame || !entity.bondCommand || entity.bondArrival || entity.ridden) return false;
  const goal = entity.goal, radius = entity.w * 0.5;
  if (!goal || entity.bondRouteVersion !== world.editCount ||
      ![[ -1, -1 ], [ -1, 1 ], [ 1, -1 ], [ 1, 1 ]].every(([x, z]) => world.isLoaded(entity.pos.x + x * radius, entity.pos.z + z * radius) && world.isLoaded(goal.x + x * radius, goal.z + z * radius))) {
    entity.goal = null; entity.vel.x = entity.vel.y = entity.vel.z = 0; return true;
  }
  const dx = goal.x - entity.pos.x, dy = goal.y - entity.pos.y, dz = goal.z - entity.pos.z, length = Math.hypot(dx, dy, dz);
  const step = Math.min(length, 3 * Math.max(0, dt)), fraction = length ? step / length : 0;
  entity.vel.x = dt > 0 ? dx * fraction / dt : 0;
  entity.vel.y = dt > 0 ? dy * fraction / dt : 0;
  entity.vel.z = dt > 0 ? dz * fraction / dt : 0;
  entity.pos.x += dx * fraction; entity.pos.y += dy * fraction; entity.pos.z += dz * fraction;
  if (Math.hypot(dx, dz) > 0.01) entity.yaw = Math.atan2(-dx, -dz);
  entity.walkPhase += step * 1.5;
  if (step === length) entity.goal = null;
  return true;
}
