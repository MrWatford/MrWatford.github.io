import { B, CHUNK, HEIGHT } from "./blocks.js";
import { hash3, hashSeed, Noise } from "./noise.js";
import { idx } from "./worldgen.js";

export const AMBER_CAVERNS = "amber_caverns";
export const AMBER_LAYOUT = 1;
export const AMBER_ARRIVAL = { x: 0, y: 36, z: -4, yaw: Math.PI };
export const SAMPLE = Object.freeze({ x: 2, y: 27, z: 40 });
export const WINCH = Object.freeze({ x: 10, y: 27, z: 37 });
export const SHORTCUT_REQUIRED_STAGE = 10;
export const SEAL_Z = 33;
export const SEAL = Object.freeze([11, 12, 13].flatMap(x =>
  [28, 29, 30, 31].map(y => Object.freeze({ x, y, z: SEAL_Z }))
));
export const isAmberSeal = (x, y, z) => z === SEAL_Z && x >= 11 && x <= 13 && y >= 28 && y <= 31;

const inside = (x,z,x0,x1,z0,z1) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

export function amberFloor(x, z) {
  if (inside(x,z,-2,14,-7,4)) return 35;
  if (inside(x,z,-5,14,35,43)) return 26;
  if (inside(x,z,-1,1,5,34) || inside(x,z,11,13,5,34) ||
      inside(x,z,-4,4,10,14) || inside(x,z,-4,4,23,27)) {
    return 35 - Math.max(0, Math.floor((z - 8) / 3));
  }
  return null;
}

export class AmberCavernsGenerator {
  constructor(seedText, expedition) {
    this.seed = hashSeed(seedText);
    this.noise = new Noise(this.seed ^ 0x297e47);
    this.expedition = expedition;
  }

  isNether() { return false; }
  findSpawn() { return { x: 0.5, z: -3.5 }; }
  column(x,z) {
    return { h: 47 + Math.round(5 * this.noise.fbm2(x / 49,z / 49,3)), biome: "amber_caverns" };
  }

  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    const put = (x,y,z,id) => {
      if (x >= x0 && x < x0 + CHUNK && z >= z0 && z < z0 + CHUNK) data[idx(x - x0,y,z - z0)] = id;
    };

    for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const floor = amberFloor(x,z);
      const highRoom = inside(x,z,-5,14,35,43) || inside(x,z,-4,4,23,27);
      const ceiling = floor === null ? 0 : floor + (highRoom ? 7 : 5);
      const walls = floor === null ? [amberFloor(x-1,z), amberFloor(x+1,z), amberFloor(x,z-1), amberFloor(x,z+1)].filter(y => y !== null) : [];
      for (let y = 0, top = this.column(x,z).h; y <= top; y++) {
        if (floor !== null && y > floor && y < ceiling) continue;
        const r = hash3(this.seed,x,y,z);
        const edge = walls.some(neighbor => y > neighbor && y <= neighbor + 5);
        let block = B.STONE;
        if (y === 0) block = B.BEDROCK;
        else if (y === top) block = B.GRASS;
        else if (y === floor) block = x >= 11 ? B.STONE_BRICKS : B.GRAVEL;
        else if (edge && r < 0.06) block = B.SHROOMLIGHT;
        else if (edge && r < 0.2) block = B.BASALT;
        else if (r < 0.014) block = B.COAL_ORE;
        else if (r > 0.986) block = B.IRON_ORE;
        put(x,y,z,block);
      }
      // Keep the central tunnels clear, with warm light recessed in their ceilings.
      if (floor !== null && (x === 0 || x === 12) && (z + 7) % 7 === 0) put(x,ceiling,z,B.SHROOMLIGHT);
      if (floor !== null && highRoom && x % 5 === 0 && z % 3 === 0) put(x,ceiling,z,B.SHROOMLIGHT);
    }
    for (const {x,y,z} of [SAMPLE, WINCH]) {
      put(x + 1,y,z,B.SUN_BRICKS);
      put(x + 1,y + 1,z,B.SHROOMLIGHT);
      if (this.expedition) put(x,y,z,B.LORE_TABLET);
    }
    if (this.expedition) for (const {x,y,z} of SEAL) put(x,y,z,B.GATE_FRAME);
    return data;
  }
}
