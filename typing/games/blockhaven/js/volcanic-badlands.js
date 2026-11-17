import { B, CHUNK, HEIGHT, SEA, make } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

export const VOLCANIC_BADLANDS = "volcanic_badlands";
export const BADLANDS_LAYOUT = 1;
export const BADLANDS_ARRIVAL = { x: 0, z: -5, yaw: Math.PI };
export const BADLANDS_START = 12;
const floor = SEA + 5;

export const CALDERA_ANCHORS = Object.freeze([
  { name: "Lower Anchor", x: -2, y: floor + 1, z: 17 },
  { name: "Ridge Anchor", x: 2, y: floor + 1, z: 33 },
  { name: "Caldera Anchor", x: 0, y: floor + 1, z: 51 }
]);
export const calderaAnchorAt = hit => CALDERA_ANCHORS.findIndex(p => p.x === hit.x && p.y === hit.y && p.z === hit.z);

export const BADLANDS_VENTS = Object.freeze(CALDERA_ANCHORS.map(({ z }, index) => ({
  z: z - (index === 2 ? 8 : 6),
  lanes: [-3, 3], y: floor + 1, radius: 3.15,
  calmFrom: BADLANDS_START + index + 1
})));

const inside = (x, z, x0, x1, z0, z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const causeway = (x, z) => inside(x, z, -5, 5, -8, 54);
const ventSection = z => BADLANDS_VENTS.some(vent => Math.abs(z - vent.z) <= 3);
const moat = (x, z) => z >= 6 && z <= 50 && Math.abs(x) >= 7 && Math.abs(x) <= 10;
const summitDist = (x, z) => Math.hypot(x * 0.86, z - 76);

export class VolcanicBadlandsGenerator {
  constructor(seedText, expedition) {
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0x73d2a5);
    this.expedition = expedition;
  }

  isNether() { return false; }
  findSpawn() { return { x: 0.5, z: -4.5 }; }

  column(x, z) {
    const rim = Math.max(0, 1 - Math.abs(summitDist(x, z) - 11) / 20);
    const rock = this.noise.fbm2(x / 46, z / 46, 3);
    const h = causeway(x, z) ? floor : moat(x, z) ? floor - 3 : Math.round(floor + rim * 32 + rock * 7);
    return { h: summitDist(x, z) < 7 ? Math.min(58, h) : h, biome: "volcanic_badlands" };
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const put = (x, y, z, block) => {
      if (x >= x0 && x < x0 + CHUNK && z >= z0 && z < z0 + CHUNK) data[idx(x - x0, y, z - z0)] = block;
    };

    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const onPath = causeway(x, z);
      const { h } = this.column(x, z);
      for (let y = 0; y <= h; y++) {
        const r = hash3(this.seed, x, y, z);
        let block = B.STONE;
        if (y === 0) block = B.BEDROCK;
        else if (y === h) block = onPath ? B.BLACKSTONE_BRICKS : r < 0.25 ? B.EMBERRACK : B.BASALT;
        else if (y > h - 5 && !onPath) block = r < 0.33 ? B.BLACKSTONE : B.BASALT;
        else if (r < 0.013) block = B.COAL_ORE;
        else if (r > 0.99) block = B.IRON_ORE;
        put(x, y, z, block);
      }
      if (moat(x, z)) for (let y = h + 1; y <= floor - 1; y++) put(x, y, z, B.LAVA);
      if (summitDist(x, z) < 7) for (let y = h + 1; y <= 58; y++) put(x, y, z, B.LAVA);
      if (x === 0 && ventSection(z)) {
        for (let y = floor + 1; y <= floor + 4; y++) put(x, y, z, B.BASALT);
      }
      if (Math.abs(x) === 5 && z >= 6 && z <= 47 && z % 4 === 1) {
        put(x, floor + 1, z, B.BLACKSTONE_BRICKS);
        put(x, floor + 2, z, B.TORCH);
      }
    }

    for (const { z, lanes } of BADLANDS_VENTS) for (const x of lanes) {
      put(x, floor, z, B.OBSIDIAN);
      put(x - 1, floor, z, B.EMBERRACK);
      put(x + 1, floor, z, B.EMBERRACK);
    }
    for (const { x, y, z } of CALDERA_ANCHORS) {
      put(x + 1, y, z, B.BLACKSTONE_BRICKS);
      put(x + 1, y + 1, z, B.SHROOMLIGHT);
      if (this.expedition) put(x, y, z, B.LORE_TABLET);
    }
    for (const x of [-4, 4]) {
      put(x, floor, -3, B.GRASS);
      put(x, floor + 1, -3, make(B.BERRY_BUSH, 3));
    }
    for (let z = -7; z <= -3; z++) put(-5, floor + 1, z, B.PLANKS);
    return data;
  }
}

export function badlandsVentActive(world, player, stage, vent, x) {
  return (stage ?? -1) < vent.calmFrom &&
    Math.abs(player.z - vent.z - 0.5) < 15 && Math.abs(player.y - vent.y) < 8 &&
    world.id(x, vent.y - 1, vent.z) === B.OBSIDIAN;
}

// Timers belong to the loaded world. Only nearby vents run, and the two lanes take turns.
export function updateBadlandsVents(world, player, stage, dt, emit) {
  const clocks = world.badlandsVents ??= BADLANDS_VENTS.map(() => ({ until: 1.3, lane: 0 }));
  BADLANDS_VENTS.forEach((vent, index) => {
    const clock = clocks[index], x = vent.lanes[clock.lane];
    if (!badlandsVentActive(world, player, stage, vent, x)) {
      // A mined marker can't trap the other lane's timer.
      if (badlandsVentActive(world, player, stage, vent, vent.lanes[1 - clock.lane])) clock.lane = 1 - clock.lane;
      return;
    }
    clock.until -= dt;
    if (clock.until > 0) return;
    emit(vent, x);
    clock.lane = 1 - clock.lane;
    clock.until = 7.2;
  });
}
