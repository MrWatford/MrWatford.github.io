import { ancientAwakeningProgress } from './ancient-awakening.js';

// Roll around the viewing axis preserves the centre aim direction. Pure actor-
// clock sampling avoids drift, catch-up bursts and any saved animation state.
export const ANCIENT_TREMOR_MAX_ROLL = .005;
export function ancientAwakeningRoll(actor, player, reducedMotion = false) {
  if (reducedMotion) return 0;
  const progress = ancientAwakeningProgress(actor), site = actor?.duneCycle?.site;
  if (progress === null || progress <= 0 || progress >= 1 ||
      ![site?.x, site?.y, site?.z, player?.x, player?.y, player?.z].every(Number.isFinite)) return 0;
  const distance = Math.hypot(player.x - site.x, player.z - site.z);
  if (distance >= 48 || Math.abs(player.y - site.y) >= 12) return 0;
  const proximity = Math.min(1, (48 - distance) / 24) * (1 - Math.abs(player.y - site.y) / 12);
  const envelope = Math.min(1, progress / .12, (1 - progress) / .15);
  const age = actor.age - actor.duneCycle.arrivalFrom;
  const wave = (Math.sin(age * 17) + .4 * Math.sin(age * 29)) / 1.4;
  return ANCIENT_TREMOR_MAX_ROLL * proximity * envelope * (.35 + .65 * progress) * wave;
}
