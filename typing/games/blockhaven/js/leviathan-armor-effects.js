export const ARMOR_SHIELD_DURATION = 5;

export function validArmorShieldRecord(record) {
  return record === undefined || record !== null && typeof record === "object" && !Array.isArray(record) &&
    ["obsidian", "ancient"].includes(record.set) && Number.isFinite(record.until) && record.until >= 0;
}

export function armorShieldState(expansion, effects, now, creative = false) {
  const record = expansion?.armorShield;
  if (!record || !validArmorShieldRecord(record) || !Number.isFinite(now) || now < 0 ||
      !creative && (!Number.isFinite(effects?.resist) || effects.resist <= 0)) return null;
  const remaining = Math.min(ARMOR_SHIELD_DURATION, record.until - now);
  return remaining > 0 ? { set: record.set, remaining, elapsed: ARMOR_SHIELD_DURATION - remaining } : null;
}
