import { I } from './blocks.js';
import { Inventory } from './inventory.js';

export const ANCIENT_VICTORY_XP = 350;
export const ANCIENT_VICTORY_REWARDS = Object.freeze([
  [I.ANCIENT_HEART,1],[I.ANCIENT_CROWN,1],[I.ETERNAL_SAND_CORE,1],
  [I.ANCIENT_PLATE,8],[I.ANCIENT_TROPHY,1],[I.ANCIENT_COMPANION_RELIC,1]
].map(Object.freeze));

export function ancientCombatPhase(hp, maxHp=400) {
  return Math.min(5,2+Math.floor((1-hp/maxHp)*4));
}

export function ancientRewardPending(record) {
  // Old defeated worlds already received loose rewards. Missing means legacy,
  // never a new entitlement to duplicate those items.
  return record?.defeated === true && record.rewardsClaimed === false;
}

export function ancientRewardInventory(inv) {
  const preview = new Inventory(); preview.load(inv.toJSON());
  for (const [id,n] of ANCIENT_VICTORY_REWARDS) if (preview.add(id,n)) return null;
  return preview.toJSON();
}

// Storage opens asynchronously. Keep checkpointed progress independent of
// later claims, commands, hits and newly read records until IndexedDB clones it.
export function copyAncientProgress(story) {
  if (!story?.leviathan) return story;
  return {...story,leviathan:{...story.leviathan,
    ...(story.leviathan.dune ? {dune:{...story.leviathan.dune}} : {}),
    ...(story.leviathan.obsidian ? {obsidian:{...story.leviathan.obsidian}} : {}),
    ...(story.leviathan.ancient ? {ancient:{...story.leviathan.ancient}} : {}),
    ...(story.leviathan.vaults ? {vaults:{...story.leviathan.vaults}} : {}),
    ...(story.leviathan.companion ? {companion:{...story.leviathan.companion}} : {})}};
}
