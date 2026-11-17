import { B, SOLID } from "./blocks.js";
import { Sound } from "./audio.js";
import { thinkGrazingHerd } from "./wildlife-grassland.js";

export const PEACOCK = "peacock";
const edgeSamples = [[3, 0], [-3, 0], [0, 3], [0, -3]];
const treeBlocks = new Set([B.LOG, B.BIRCH_LOG, B.LEAVES, B.BIRCH_LEAVES]);

export function peafowlEdge(w, x, y, z) {
  return edgeSamples.some(([dx, dz]) => {
    if (!w.isLoaded(x + dx, z + dz)) return false;
    for (let dy = 0; dy <= 3; dy++) if (treeBlocks.has(w.id(x + dx, y + dy, z + dz))) return true;
    return false;
  });
}

function displayRoom(w, e) {
  const { x, y, z } = e.pos;
  const frontX = -Math.sin(e.yaw), frontZ = -Math.cos(e.yaw);
  // Sample the space behind the bird where each side of the fan will open.
  for (const side of [-1.5, -0.75, 0, 0.75, 1.5]) for (const lift of [0.85, 1.45, 2.15, 2.65]) {
    const bx = Math.floor(x - frontX * 0.7 + frontZ * side);
    const bz = Math.floor(z - frontZ * 0.7 - frontX * side);
    if (!w.isLoaded(bx, bz)) return false;
    const id = w.id(bx, Math.floor(y + lift), bz);
    if (SOLID[id] || id === B.WATER || id === B.LAVA) return false;
  }
  return true;
}

export function thinkPeafowl(manager, e, d, daylight, clearPath) {
  const s = e.wild, now = e.age, showing = s.phase === "display";
  thinkGrazingHerd(manager, e, clearPath);
  if (e.variant === 1 || e.baby || s.phase === "flee" || e.inWater || daylight < 0.55) {
    if (showing) s.displayUntil = 0;
    return;
  }
  if (showing && now < s.displayUntil) {
    e.goal = e.path = null;
    s.phase = "display";
    return;
  }
  if (now < (s.displayAt ?? 2.2) || s.phase !== "graze" || !e.onGround) return;
  s.displayAt = now + 5;
  const audience = manager.near(e.pos.x, e.pos.y, e.pos.z, 5.5, other =>
    other.sp === PEACOCK && other.variant === 1 && other.wild.phase !== "flee" &&
    clearPath({ ...other.pos, y: other.pos.y + 0.55 }))[0];
  if (!audience && now < (s.soloAt ?? 30)) return;
  if (audience) e.yaw = Math.atan2(e.pos.x - audience.pos.x, e.pos.z - audience.pos.z);
  if (!displayRoom(manager.world, e)) return;
  s.phase = "display";
  s.displayUntil = now + 5;
  s.displayAt = now + 20 + Math.random() * 18;
  s.soloAt = now + 55;
  e.goal = e.path = null;
  if (d < 25) Sound.mob("peacockcall", d);
}
