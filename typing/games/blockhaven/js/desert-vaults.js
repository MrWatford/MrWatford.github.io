import { B, I } from './blocks.js';

export const DESERT_VAULT_LAYOUT = 1;
const definitions = {
  tomb: {
    name: 'Royal Tomb Vault', guard: 'tomb_guardian',
    tablet: [11, -6, 6], pedestal: [8, -6, 11], guardPosition: [10, -6, 10],
    switches: [[6, -6, 4], [8, -6, 4], [10, -6, 4]],
    labels: ['Sun', 'Moon', 'Keeper'], markers: [B.SUN_GLYPH, B.QUARTZ_BLOCK, B.KEEPER_COPPER], order: [0, 1, 2],
    lore: 'The sun opened the procession. The moon kept watch over the dead. The keeper sealed the chamber. Follow the sun carving, pale quartz, and copper in that order. Look for the markers behind the three switches. Step away from the rune if a ward lights up. Step across the hot trench on the dark stone under the arch. The guardian answers when you touch the vault pedestal.',
    rewards: [[I.IRON_SWORD, 1], [I.GOLD_INGOT, 6], [I.GOLDEN_APPLE, 2]],
  },
  citadel: {
    name: 'Citadel Forge Vault', guard: 'obsidian_crawler',
    tablet: [16, 1, 36], pedestal: [10, 1, 36], guardPosition: [11, 1, 34],
    switches: [[10, 1, 30], [13, 1, 30], [16, 1, 30]],
    labels: ['Basalt', 'Ember', 'Iron'], markers: [B.BASALT, B.EMBER_BRICKS, B.IRON_BLOCK], order: [1, 2, 0],
    lore: 'Heat the forge with ember brick, temper the iron, then seal the stone with basalt. Look for those materials behind the switches. Cross the hot floor on the center basalt lane. If a ward lights up, move clear. The forge guardian answers at the vault pedestal.',
    rewards: [[B.OBSIDIAN, 8], [I.GOLDEN_APPLE, 2], [I.ARROW, 24]],
  },
};

export function hasDesertVault(key, site) {
  return Object.hasOwn(definitions, key) && site?.vaultLayout === DESERT_VAULT_LAYOUT;
}

export function desertVault(key, site) {
  if (!hasDesertVault(key, site)) return null;
  const def = definitions[key];
  const point = ([x, y, z]) => ({ x: site.x + x, y: site.y + y, z: site.z + z });
  return {
    key, name: def.name, lore: def.lore, guard: def.guard, rewards: def.rewards, order: def.order,
    tablet: point(def.tablet), pedestal: point(def.pedestal), guardPosition: point(def.guardPosition),
    entrance: key === 'tomb' ? point([10, 1, 10]) : null,
    switches: def.switches.map((local, index) => ({ ...point(local), label: def.labels[index] })),
  };
}

export function stampDesertVault(grid, key, site) {
  if (!hasDesertVault(key, site)) return;
  const { y } = site, def = definitions[key];
  if (key === 'tomb') {
    grid.box(3, y - 7, 3, 12, y - 2, 12, B.SUN_BRICKS);
    grid.box(4, y - 6, 4, 11, y - 3, 11, B.AIR);
    grid.walls(3, y - 6, 3, 12, y - 3, 12, B.SANDSTONE);
    grid.box(6, y - 6, 7, 11, y - 3, 7, B.SANDSTONE);
    grid.box(8, y - 6, 7, 9, y - 4, 7, B.AIR);
    for (let z = 5; z <= 11; z++) {
      const floor = y + z - 12;
      grid.box(4, y - 7, z, 5, floor, z, B.SUN_BRICKS);
      grid.box(4, floor + 1, z, 5, z < 9 ? floor + 3 : y + 2, z, B.AIR);
    }
    grid.box(6, y + 1, 9, 6, y + 1, 10, B.SUN_BRICKS);
    grid.set(6, y + 2, 10, B.SHINESTONE);
    grid.box(7, y - 7, 8, 10, y - 7, 8, B.MAGMA);
    grid.set(8, y - 7, 8, B.BASALT);
    for (const [x,z] of [[6,6],[8,4],[10,5],[6,10],[11,10]]) grid.set(x, y - 3, z, B.SHINESTONE);
    grid.set(10, y + 1, 10, B.LORE_TABLET);
  } else {
    grid.box(8, y, 29, 18, y + 5, 37, B.BLACKSTONE_BRICKS);
    grid.box(9, y + 1, 30, 17, y + 4, 36, B.AIR);
    grid.box(18, y + 1, 34, 18, y + 3, 35, B.AIR);
    grid.box(10, y, 32, 16, y, 32, B.MAGMA);
    grid.set(13, y, 32, B.BASALT);
    for (const [x,z] of [[9,31],[13,30],[17,31],[9,36],[17,36]]) grid.set(x, y + 4, z, B.SHROOMLIGHT);
  }
  for (const [index, [x, dy, z]] of def.switches.entries()) {
    grid.set(x, y + dy - 1, z, def.markers[index]);
    grid.set(x, y + dy + 1, z - 1, def.markers[index]);
    grid.set(x, y + dy, z, B.KEEPER_SWITCH);
  }
  const [tx, ty, tz] = def.tablet, [px, py, pz] = def.pedestal;
  grid.set(tx, y + ty, tz, B.LORE_TABLET);
  grid.set(px, y + py, pz, B.RELIC_PEDESTAL);
}

export function validDesertVaultProgress(vaults, sites) {
  if (vaults === undefined) return true;
  if (!vaults || typeof vaults !== 'object' || Array.isArray(vaults)) return false;
  return Object.entries(vaults).every(([key, record]) => {
    if (!hasDesertVault(key, sites?.[key]) || !record || typeof record !== 'object' || Array.isArray(record)) return false;
    const length = definitions[key].order.length;
    return Number.isInteger(record.next) && record.next >= 0 && record.next <= length &&
      typeof record.cleared === 'boolean' && typeof record.claimed === 'boolean' &&
      (!record.cleared || record.next === length) && (!record.claimed || record.cleared);
  });
}
