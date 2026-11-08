import { CHUNK } from "./blocks.js";

// Build once per placement search. Any protected chunk touched by the
// footprint makes the entire candidate ineligible.
export function untouchedFootprint(data = {}) {
  const protectedChunks = new Set(data.visited || []);
  for (const key of Object.keys(data.mods || {})) protectedChunks.add(key);
  for (const [position] of data.containers || []) {
    const [x, , z] = String(position).split(",").map(Number);
    if (Number.isFinite(x) && Number.isFinite(z)) {
      protectedChunks.add(Math.floor(x / CHUNK) + "," + Math.floor(z / CHUNK));
    }
  }

  // Block bounds are half-open, like authored map bounds.
  return (minX, minZ, endX, endZ) => {
    if (![minX, minZ, endX, endZ].every(Number.isSafeInteger) || endX <= minX || endZ <= minZ) return false;
    for (let cx = Math.floor(minX / CHUNK); cx <= Math.floor((endX - 1) / CHUNK); cx++) {
      for (let cz = Math.floor(minZ / CHUNK); cz <= Math.floor((endZ - 1) / CHUNK); cz++) {
        if (protectedChunks.has(cx + "," + cz)) return false;
      }
    }
    return true;
  };
}
