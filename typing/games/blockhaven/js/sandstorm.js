import { hash3 } from "./noise.js";

const LEVIATHAN_CHANCE = 1 / 3;
const stormStart = (seed, day) => 0.12 + hash3(seed, day, 23, 0) * 0.4;

export function nextLeviathanStorm(seed, day, time) {
  for (let d = Math.max(2, day); d <= day + 60; d++) {
    if (hash3(seed, d, 17, 0) >= LEVIATHAN_CHANCE) continue;
    const start = stormStart(seed, d);
    if (d !== day || time - start < 0.15) return { day: d, time: start + 0.12 };
  }
  return null;
}

// Derive weather from the saved world clock so reloads cannot reroll it.
export function sandstormStage(seed, day, time) {
  if (day < 2) return 0;
  const roll = hash3(seed, day, 17, 0);
  if (roll >= 2 / 3) return 0;
  const start = stormStart(seed, day);
  const elapsed = time - start;
  if (elapsed < 0 || elapsed >= 0.22) return 0;
  if (elapsed < 0.035 || elapsed >= 0.195) return 1;
  if (elapsed < 0.09 || elapsed >= 0.165) return 2;
  if (roll < LEVIATHAN_CHANCE && elapsed >= 0.12 && elapsed < 0.15) return 4;
  return 3;
}
