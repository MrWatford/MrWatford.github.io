import { B, HEIGHT } from "./blocks.js";
import { Grid, KEEP } from "./maps.js";
import { SOLKARA_SCENERY_LAYOUT, stampSolkaraStatue } from "./solkara-scenery.js";

export const BURIED_THRONE = { x: 0, y: 24, z: 192, radius: 28 };
export const THRONE_ALTAR = { x: 0, y: 24, z: 213 };
export const THRONE_TABLET = { x: -4, y: 24, z: 215 };

export function buildBuriedThrone(scenery) {
  const size = 80, minX = -40, minZ = 152, floor = BURIED_THRONE.y - 1;
  const g = new Grid(minX, minZ, size, size, KEEP);
  for (let z = minZ; z < minZ + size; z++) for (let x = minX; x < minX + size; x++) {
    const r = Math.hypot(x - BURIED_THRONE.x, z - BURIED_THRONE.z);
    if (r > 30) continue;
    const ring = r > 26 || (r > 18 && r < 19.5);
    g.box(x, 1, z, x, floor, z, B.SANDSTONE);
    g.set(x, floor, z, ring ? B.SUN_GLYPH : r < 8 ? B.KEEPER_STONE : B.SAND);
    g.box(x, floor + 1, z, x, HEIGHT - 5, z, B.AIR);
    g.box(x, HEIGHT - 4, z, x, HEIGHT - 2, z, B.DARKSLATE);
    if (r >= 29) g.box(x, floor, z, x, floor + 4, z, B.SUN_BRICKS);
  }
  // The south stair climbs from the court to the surrounding dunes.
  for (let z = 215; z <= 231; z++) {
    const y = floor + Math.floor((z - 215) / 2);
    g.box(-2, y - 1, z, 2, y, z, B.SUN_BRICKS);
    g.box(-2, y + 1, z, 2, y + 4, z, B.AIR);
  }
  for (const [x, z] of [[-19, 173], [19, 173], [-25, 192], [25, 192], [-19, 211], [19, 211]]) {
    g.box(x - 1, floor, z - 1, x + 1, floor + 14, z + 1, B.SUN_BRICKS);
    g.box(x - 2, floor + 14, z - 2, x + 2, floor + 15, z + 2, B.KEEPER_STONE);
    g.set(x, floor + 16, z, B.SHINESTONE);
    g.set(x, floor + 8, z - 2, B.LUMEN_CRYSTAL);
  }
  // Fossil arches rise along the outer court with a clear middle route.
  for (const z of [180, 192, 204]) for (const side of [-1, 1]) {
    const x = side * 14;
    g.box(x, floor + 1, z, x, floor + 5, z, B.QUARTZ_BLOCK);
    g.box(x - 1, floor + 6, z, x + 1, floor + 6, z, B.QUARTZ_BLOCK);
    g.set(x - side * 2, floor + 7, z, B.QUARTZ_BLOCK);
  }
  for (const x of [-9, 9]) {
    g.box(x - 1, floor, 213, x + 1, floor + 1, 215, B.KEEPER_STONE);
    g.box(x, floor + 2, 214, x, floor + 5, 214, B.SUN_BRICKS);
    g.set(x, floor + 6, 214, B.QUARTZ_BLOCK);
    g.set(x, floor + 5, 215, B.LUMEN_CRYSTAL);
  }
  g.set(THRONE_ALTAR.x, THRONE_ALTAR.y, THRONE_ALTAR.z, B.RELIC_PEDESTAL);
  g.set(THRONE_TABLET.x, THRONE_TABLET.y, THRONE_TABLET.z, B.LORE_TABLET);
  if (scenery === SOLKARA_SCENERY_LAYOUT) for (const x of [-22, 22]) stampSolkaraStatue(g, x, floor + 1, 207, 1, true);
  return { x: minX, z: minZ, size, cells: g.data };
}
