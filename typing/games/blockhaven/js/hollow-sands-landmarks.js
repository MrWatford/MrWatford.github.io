import { B } from "./blocks.js";
import { Grid, KEEP } from "./maps.js";

export const SANDS_LANDMARK_LAYOUT = 1;

const LANDMARKS = [
  ["The Sandfall", "A pale curtain hangs from the cavern roof."],
  ["The Choir of Glass", "Blue crystal spires flank an old listening post."],
  ["The Last Ribs", "Walk beneath the white ribs of a buried Leviathan."],
  ["The Bell Court", "A broken stone bridge spans the old processional road."],
  ["The Silent Mine", "Weathered timber props and violet lights mark the mine."],
  ["The Lantern Pool", "Rootwood caps glow around a shallow spring."],
];

export function sandsLandmarkName(zone) {
  return LANDMARKS[zone]?.[0];
}

export function sandsLandmarkClue(zone) {
  return LANDMARKS[zone]?.[1];
}

function sandfall(g, x, y, z) {
  for (const side of [-1, 1]) {
    const pier = x + side * 6;
    g.box(pier - 1, y, z - 2, pier + 1, y + 2, z, B.SUN_BRICKS);
    g.box(pier, y + 3, z - 1, pier, y + 7, z - 1, B.SANDSTONE);
    g.set(pier, y + 8, z - 1, B.SHINESTONE);
  }
  // A mineral curtain suspended behind the court keeps the footpath clear.
  for (let dx = -5; dx <= 5; dx++) {
    const bottom = y + 2 + Math.floor(Math.abs(dx) * 1.5);
    const back = z + 6 + Math.floor(Math.abs(dx) / 3);
    g.box(x + dx, bottom, back, x + dx, 67, back, dx % 3 === 0 ? B.QUARTZ_BLOCK : B.SANDSTONE);
    if (dx % 2 === 0) g.set(x + dx, bottom + 3, back - 1, B.SHINESTONE);
    g.box(x + dx, y, back - 2, x + dx, y + (dx % 2 === 0 ? 2 : 1), back, B.SAND);
  }
}

function crystalChoir(g, x, y, z) {
  for (const [dx, dz, height] of [[-6,-2,11],[6,-1,8],[-6,4,7],[6,4,12]]) {
    const xx = x + dx, zz = z + dz, side = Math.sign(dx);
    g.box(xx - 1, y, zz - 1, xx + 1, y + 2, zz + 1, B.ECHOSTONE);
    g.box(xx, y + 3, zz, xx + side, y + height - 4, zz, B.TIDE_BRICKS);
    g.box(xx + side, y + height - 3, zz, xx + side, y + height - 1, zz, B.TIDE_BRICKS);
    g.box(xx + side, y + 4, zz - 1, xx + side, y + height - 4, zz - 1, B.TIDE_LAMP);
    g.set(xx, y + 3, zz - 1, B.LUMEN_CRYSTAL);
    g.set(xx + side, y + height, zz, B.LUMEN_CRYSTAL);
    g.set(xx, y + height - 3, zz, B.LUMEN_CRYSTAL);
  }
}

function fossilRibs(g, x, y, z) {
  for (const [dz, height] of [[-5,7],[-1,10],[4,8]]) {
    for (const side of [-1, 1]) {
      const edge = x + side * 6;
      g.box(edge, y, z + dz, edge, y + height - 3, z + dz, B.QUARTZ_BLOCK);
      for (let step = 1; step <= 4; step++) {
        const rib = edge - side * step, top = y + height + Math.min(step - 2, 0);
        g.box(rib, top - 2, z + dz, rib, top, z + dz, B.QUARTZ_BLOCK);
      }
      g.set(edge - side, y + 1, z + dz, B.SHINESTONE);
    }
    if (dz !== 4) g.box(x - 1, y + height, z + dz, x + 1, y + height, z + dz, B.QUARTZ_BLOCK);
  }
}

function bellCourt(g, x, y, z) {
  for (const [dx, dz, height] of [[-6,-4,10],[6,-4,8],[-6,4,7],[6,4,10]]) {
    g.box(x + dx - 1, y, z + dz - 1, x + dx + 1, y + 1, z + dz + 1, B.SUN_BRICKS);
    g.box(x + dx, y + 2, z + dz, x + dx, y + height, z + dz, B.SUN_GLYPH);
    g.set(x + dx, y + height + 1, z + dz, B.SHINESTONE);
    g.set(x + dx - Math.sign(dx), y + 4, z + dz, B.SHINESTONE);
  }
  g.box(x - 6, y + 7, z + 3, x - 2, y + 7, z + 5, B.SUN_BRICKS);
  g.box(x + 2, y + 7, z + 3, x + 6, y + 7, z + 5, B.SUN_BRICKS);
  g.box(x - 6, y + 8, z + 4, x - 4, y + 8, z + 4, B.KEEPER_COPPER);
  g.box(x + 3, y + 8, z + 4, x + 6, y + 8, z + 4, B.KEEPER_COPPER);
}

function silentMine(g, x, y, z) {
  for (const side of [-1, 1]) {
    const edge = x + side * 6;
    g.box(edge - 1, y, z + 1, edge + 1, y + 9, z + 3, B.DARKSLATE);
    g.box(edge, y + 2, z - 5, edge, y + 5, z + 1, B.ROOTWOOD);
    for (const dz of [-5, -2, 1]) {
      g.box(edge, y, z + dz, edge, y + 5, z + dz, B.ROOTWOOD);
      g.set(edge - side, y + 4, z + dz, B.LUMEN_CRYSTAL);
    }
  }
  g.box(x - 6, y + 6, z - 5, x + 6, y + 6, z - 5, B.ROOTWOOD);
  g.box(x - 5, y + 6, z + 1, x + 5, y + 6, z + 1, B.ROOTWOOD);
}

function lanternPool(g, x, y, z) {
  for (let dz = 2; dz <= 8; dz++) for (let dx = -5; dx <= 5; dx++) {
    const radius = Math.hypot(dx * 0.74, dz - 5);
    if (radius > 3.6) continue;
    const material = radius <= 2.5 ? B.CAVE_MOSS : B.LUMEN_GRASS;
    g.set(x + dx, y - 1, z + dz, material);
    g.set(x + dx, y, z + dz, radius <= 2.5 ? B.WATER : B.CAVE_MOSS);
    g.box(x + dx, y + 1, z + dz, x + dx, y + 3, z + dz, B.AIR);
  }
  for (const [dx, dz, height] of [[-6,-3,5],[6,-3,6],[-6,6,8],[6,6,7]]) {
    const xx = x + dx, zz = z + dz;
    g.box(xx, y, zz, xx, y + height - 1, zz, B.ROOTWOOD);
    g.box(xx - 1, y + height, zz - 2, xx + 1, y + height, zz + 2, B.WARPED_WART);
    g.box(xx - 2, y + height, zz - 1, xx + 2, y + height, zz + 1, B.WARPED_WART);
    g.set(xx, y + height + 1, zz, B.WARPED_WART);
    for (const side of [-1, 1]) g.set(xx + side, y + height - 1, zz, B.SHROOMLIGHT);
    g.set(xx, y + height - 1, zz + 1, B.VINES);
  }
}

const builders = [sandfall, crystalChoir, fossilRibs, bellCourt, silentMine, lanternPool];

export function buildSandsLandmarks(gen, tablets) {
  return tablets.map(({ x, z }, zone) => {
    const size = 21, y = gen.column(x, z).h + 1;
    const g = new Grid(x - 10, z - 10, size, size, KEEP);
    // Bring the inner court to the tablet height and grade the last three blocks into the dunes.
    for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) {
      const distance = Math.max(Math.abs(dx), Math.abs(dz));
      if (distance <= 1) continue;
      const bx = x + dx, bz = z + dz, natural = gen.column(bx, bz).h;
      const top = Math.round(y + (natural - y) * Math.max(0, (distance - 6) / 4));
      const material = zone === 5 ? B.CAVE_MOSS : zone === 2 ? B.SANDSTONE :
        Math.abs(dx) <= 1 || Math.abs(dz) <= 1 ? B.SUN_BRICKS : zone === 1 || zone === 4 ? B.ECHOSTONE : B.SANDSTONE;
      g.box(bx, Math.min(top - 1, natural), bz, bx, top, bz, material);
      g.box(bx, top + 1, bz, bx, Math.max(top + 3, natural + 7), bz, B.AIR);
    }
    builders[zone](g, x, y, z);
    return { x: g.x0, z: g.z0, size, cells: g.data, sandsLandmark: zone };
  });
}
