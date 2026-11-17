import { GODZILLA_SITE, inCalderaArena } from "./godzilla-caldera.js";

export const GODZILLA_NAME = "Godzilla";
export const GODZILLA_ID = "lost_world_godzilla";
export const GODZILLA_HP = 240;
export const ANCHORS_READY = 7;
export const GODZILLA_PHASES = ["Breach", "Fault Lines", "Broken Circuit", "Ashfall", "Last Vent"];

export const newGodzillaRecord = () => ({ hp: GODZILLA_HP, anchors: 0 });
export const godzillaPhase = hp => Math.min(5, 1 + Math.floor((GODZILLA_HP - Math.max(0, hp)) / 48));

export function validGodzillaRecord(record) {
  return record && Number.isFinite(record.hp) && record.hp >= 0 && record.hp <= GODZILLA_HP &&
    Number.isInteger(record.anchors) && record.anchors >= 0 && record.anchors <= ANCHORS_READY &&
    (godzillaPhase(record.hp) >= 3 || record.anchors === 0) &&
    (godzillaPhase(record.hp) <= 3 || record.anchors === ANCHORS_READY);
}

export function activateGodzillaAnchor(record, index) {
  if (!record || godzillaPhase(record.hp) !== 3 || ![0, 1, 2].includes(index)) return record;
  const anchors = record.anchors | (1 << index);
  return anchors === record.anchors ? record : { ...record, anchors };
}

export function godzillaDamage(record, state, amount) {
  if (!record || state.mode !== "recovery" || !Number.isFinite(amount) || amount <= 0) return 0;
  const phase = godzillaPhase(record.hp);
  if (phase === 3 && record.anchors !== ANCHORS_READY) return 0;
  const nextFloor = GODZILLA_HP - phase * 48;
  return Math.max(0, Math.min(amount, record.hp - nextFloor));
}

export const newGodzillaCycle = () => ({ mode: "idle", timer: 2.3, phase: 0, hit: false, shot: 0 });
const durations = [0, 2.1, 2.1, 2.6, 2.15, 2.6];

export function stepGodzillaCycle(cycle, record, player, dt) {
  const phase = godzillaPhase(record.hp);
  if (!inCalderaArena(player.x, player.z) || Math.abs(player.y - GODZILLA_SITE.y) > 11) {
    Object.assign(cycle, newGodzillaCycle());
    return null;
  }
  if (cycle.phase !== phase) {
    Object.assign(cycle, newGodzillaCycle(), { phase });
    return { type: "phase", phase };
  }
  cycle.timer -= dt;
  if (cycle.timer > 0) return null;
  if (cycle.mode === "idle" || cycle.mode === "recovery") {
    const dx = player.x - GODZILLA_SITE.x, dz = player.z - GODZILLA_SITE.z;
    const len = Math.hypot(dx, dz);
    cycle.x = player.x;
    cycle.z = player.z;
    cycle.dx = len ? dx / len : 0;
    cycle.dz = len ? dz / len : -1;
    cycle.shot += 1;
    cycle.attack = phase === 1 ? "shockwave" : phase === 2 ? "faults" :
      phase === 3 || phase === 5 ? "breath" : cycle.shot % 2 ? "ashfall" : "faults";
    cycle.mode = "warning";
    cycle.timer = durations[phase];
    cycle.hit = false;
    return { type: "warning", phase, attack: cycle.attack };
  }
  if (cycle.mode === "warning") {
    cycle.mode = "strike";
    cycle.timer = cycle.attack === "breath" ? 1.1 : 0.65;
    return { type: "strike", phase, attack: cycle.attack };
  }
  cycle.mode = "recovery";
  cycle.timer = phase === 5 ? 3.15 : 3.7;
  return { type: "recovery", phase };
}

export function inAtomicBreath(cycle, player, width = 2.15, range = 28) {
  const x = player.x - GODZILLA_SITE.x, z = player.z - GODZILLA_SITE.z;
  const along = x * cycle.dx + z * cycle.dz;
  const side = Math.abs(x * cycle.dz - z * cycle.dx);
  return along >= 0 && along < range && side < width && Math.abs(player.y - GODZILLA_SITE.y) < 2.9;
}
