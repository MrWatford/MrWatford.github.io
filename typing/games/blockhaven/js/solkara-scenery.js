import { B, make } from "./blocks.js";
import { Grid, KEEP } from "./maps.js";
import { LOOT } from "./worldgen.js";

export const SOLKARA_SCENERY_LAYOUT = 1;
export const SOLKARA_SCENERY = [
  { x: 46, z: -88, floorOffset: 1, marker: "L", title: "The Resonance Laboratory",
    clue: "A collapsed listening room with a cracked crystal instrument.",
    note: "We lowered the tuning forks until the readings stopped agreeing with each other. The deepest note was coming from below the instrument. I have taken the copper leads out of the wall. Nobody should make that circuit again." },
  { x: 109, z: 46, floorOffset: -2, marker: "P", title: "The Buried Palace",
    clue: "Enter the sunken court through the broken northern arch.",
    note: "The palace doors were still open the last morning. We sent the attendants out through the servants' road, then waited for the lanterns to go dark one by one. The king's chair was empty when the ceiling fell." }
];

export function stampSolkaraStatue(grid, x, y, z, direction, royal = false) {
  const body = royal ? B.KEEPER_STONE : B.SANDSTONE;
  const trim = royal ? B.QUARTZ_BLOCK : B.SUN_BRICKS;
  grid.box(x - 1, y, z - 1, x + 1, y, z + 1, B.KEEPER_STONE);
  for (const dx of [-1, 1]) grid.box(x + dx, y + 1, z, x + dx, y + 2, z, body);
  grid.box(x - 1, y + 3, z, x + 1, y + 4, z, body);
  grid.set(x - 1, y + 4, z + direction, trim);
  grid.set(x + 1, y + 4, z + direction, trim);
  grid.set(x, y + 4, z + direction, B.SUN_GLYPH);
  grid.set(x, y + 5, z, trim);
  grid.set(x, y + 6, z, royal ? B.LUMEN_CRYSTAL : B.KEEPER_COPPER);
}

export function solkaraSceneryTablet(gen, site) {
  return { x: site.x, y: gen.column(site.x, site.z).h + site.floorOffset + 1, z: site.z + 4 };
}

function laboratory(g, x, y, z) {
  g.walls(x - 7, y + 1, z - 5, x + 7, y + 3, z + 6, B.DARKSLATE_BRICKS);
  g.box(x - 2, y + 1, z - 5, x + 2, y + 3, z - 5, B.AIR);
  g.box(x - 4, y + 4, z - 5, x + 4, y + 4, z - 5, B.ECHOSTONE);
  for (const side of [-1, 1]) {
    const xx = x + side * 5;
    g.box(xx, y + 1, z - 2, xx, y + 2, z + 4, B.KEEPER_COPPER);
    g.set(xx, y + 3, z - 1, B.LUMEN_CRYSTAL);
    g.set(xx, y + 3, z + 3, B.LUMEN_CRYSTAL);
    g.box(xx - 1, y + 5, z + 2, xx + 1, y + 5, z + 6, B.DARKSLATE);
  }
  g.box(x - 2, y + 1, z + 1, x + 2, y + 1, z + 2, B.KEEPER_STONE);
  g.set(x - 2, y + 2, z + 1, B.KEEPER_LAMP);
  g.set(x, y + 2, z + 1, B.RESONANT_GLASS);
  g.set(x + 2, y + 2, z + 1, B.LUMEN_CRYSTAL);
  g.set(x + 3, y + 1, z + 5, make(B.CHEST, LOOT));
}

function palace(g, x, y, z) {
  g.walls(x - 8, y + 1, z - 7, x + 8, y + 2, z + 7, B.SUN_BRICKS);
  g.box(x - 2, y + 1, z - 7, x + 2, y + 3, z - 7, B.AIR);
  for (const side of [-1, 1]) {
    const xx = x + side * 4;
    g.box(xx - 1, y + 1, z - 7, xx + 1, y + 5, z - 7, B.SUN_BRICKS);
    g.set(xx, y + 6, z - 7, B.SHINESTONE);
    g.box(xx + Math.min(0, side) * 2, y + 6, z - 7, xx + Math.max(0, side) * 2, y + 6, z - 7, B.SUN_GLYPH);
    stampSolkaraStatue(g, x + side * 6, y + 1, z - 2, -1, true);
    g.box(x + side * 7, y + 3, z + 2, x + side * 7, y + 5, z + 7, B.SANDSTONE);
  }
  g.box(x - 3, y + 1, z + 5, x + 3, y + 1, z + 6, B.KEEPER_STONE);
  g.box(x - 1, y + 2, z + 6, x + 1, y + 3, z + 6, B.SUN_GLYPH);
  g.set(x, y + 4, z + 6, B.KEEPER_COPPER);
  g.set(x - 4, y + 1, z + 5, make(B.CHEST, LOOT));
}

export function buildSolkaraScenery(gen) {
  return SOLKARA_SCENERY.map((site, i) => {
    const { x, z } = site, y = gen.column(x, z).h + site.floorOffset;
    const radius = 12, size = radius * 2 + 1;
    const g = new Grid(x - radius, z - radius, size, size, KEEP);
    for (let dz = -11; dz <= 11; dz++) for (let dx = -11; dx <= 11; dx++) {
      const bx = x + dx, bz = z + dz, h = gen.column(bx, bz).h;
      const blend = Math.max(0, (Math.max(Math.abs(dx), Math.abs(dz)) - 8) / 4);
      const floor = Math.round(y + (h - y) * blend);
      const aisle = Math.abs(dx) <= 2;
      const stone = i ? aisle ? B.SUN_GLYPH : B.SANDSTONE : aisle ? B.KEEPER_STONE : B.ECHOSTONE;
      g.box(bx, Math.min(floor - 1, h), bz, bx, floor, bz, stone);
      g.box(bx, floor + 1, bz, bx, Math.max(h + 5, floor + 4), bz, B.AIR);
    }
    (i ? palace : laboratory)(g, x, y, z);
    const tablet = solkaraSceneryTablet(gen, site);
    g.set(tablet.x, tablet.y, tablet.z, B.LORE_TABLET);
    return { x: g.x0, z: g.z0, size, cells: g.data };
  });
}
