// Rules and durable progression for the three-day challenge.
export const UHC_MODE = "ultra-hardcore";
export const UHC_HP = 6;
export const UHC_AIR = 5;
export const UHC_DAY = 1200;
export const UHC_END = 3 * UHC_DAY;
export const UHC_SUNSET = 2.5 * UHC_DAY;
export const UHC_SETTINGS = Object.freeze({
  difficulty: "hard", keepInv: false, griefing: true, fireSpread: true, liquidFlow: true, weather: true
});
export const UHC_SKINS = [
  { id: "uhc-survivor", name: "UHC Survivor", day: 1 },
  { id: "wilderness-stalker", name: "Wilderness Stalker", day: 2 },
  { id: "hardcore-champion", name: "Hardcore Champion", day: 3 },
  { id: "survival-nomad", name: "Survival Nomad", day: 3 }
];
export const UHC_ACHIEVEMENT = "Legend of the Last Dawn";

export function createChallenge() {
  return { version: 1, revision: 0, elapsed: 0, status: "active", fatigue: 0, meals: 0,
    fallen: false, cause: "", exposure: 0, nextCave: 150, cave: null, nextRaid: UHC_DAY + 90 };
}

export const challengeDay = run => Math.floor(run.elapsed / UHC_DAY) + 1;
export const bloodMoon = run => run?.status === "active" && run.elapsed >= UHC_SUNSET;
export const hunterLevel = run => run?.status === "active" ? (bloodMoon(run) ? 3 : Math.floor(run.elapsed / UHC_DAY)) : 0;

export function advanceChallenge(run, seconds) {
  if (run.status !== "active" || !Number.isFinite(seconds) || seconds <= 0) return [];
  const before = run.elapsed;
  run.elapsed = Math.min(UHC_END, before + seconds);
  const events = [];
  if (before < UHC_DAY && run.elapsed >= UHC_DAY) events.push("day1");
  if (before < 2 * UHC_DAY && run.elapsed >= 2 * UHC_DAY) events.push("day2");
  if (before < UHC_SUNSET - 30 && run.elapsed >= UHC_SUNSET - 30) events.push("dusk");
  if (before < UHC_SUNSET && run.elapsed >= UHC_SUNSET) events.push("moon");
  if (run.elapsed === UHC_END) { run.status = "completed"; events.push("victory"); }
  return events;
}

export function failChallenge(run, cause) {
  if (run.fallen) return;
  run.fallen = true;
  run.cause = String(cause || "").slice(0, 260);
  if (run.status === "active") run.status = "failed";
}

export function survivalMaximum({ mode, campaign, hardcore, ultra, expedition, guest }, profile) {
  if (ultra) return UHC_HP;
  return mode === "survival" && !campaign && !hardcore && !expedition && !guest && profile?.lastDawn ? 22 : 20;
}

export function applyChallengeRewards(profile, world) {
  const run = world.ultra;
  const skins = new Set(profile?.skins || []);
  const days = Math.floor(run.elapsed / UHC_DAY);
  for (const skin of UHC_SKINS) if (skin.day <= days && (skin.day < 3 || run.status === "completed")) skins.add(skin.id);
  return {
    ...profile, id: "local", skins: [...skins], lastDawn: Boolean(profile?.lastDawn || run.status === "completed")
  };
}

export function challengeSummary(world) {
  const { elapsed, status, fallen, cause, meals } = world.ultra;
  return { id: world.id, name: world.name, seed: world.seed, elapsed, status, fallen, cause, meals,
    stats: world.stats, played: world.played };
}

export function checkChallengeWrite(previous, next) {
  if ((!previous && next.revision !== 0) || (previous && previous.revision !== next.revision)) {
    throw new Error("This Ultra Hardcore run changed in another tab. Reopen it from your world list.");
  }
  if ((!previous && (next.elapsed !== 0 || next.status !== "active")) ||
      (previous && previous.status !== "active" && previous.elapsed !== next.elapsed) ||
      next.version !== 1 || !Number.isFinite(next.elapsed) || next.elapsed < (previous?.elapsed || 0) ||
      next.elapsed > UHC_END || (next.status === "completed") !== (next.elapsed === UHC_END) ||
      !["active", "completed", "failed"].includes(next.status) ||
      (next.status === "failed" && !next.fallen) || (next.status === "active" && next.fallen) ||
      (previous?.status !== undefined && previous.status !== "active" && previous.status !== next.status) ||
      (previous?.fallen && !next.fallen)) throw new Error("This Ultra Hardcore checkpoint is invalid.");
}
