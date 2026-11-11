import { B, CHUNK, HEIGHT } from "./blocks.js";
import { Noise, hash3, hashSeed } from "./noise.js";
import { CURRENT_GEN, applyStamps, idx } from "./worldgen.js";
import { buildBuriedThrone } from "./buried-throne.js";
import { buildSandsLandmarks, SANDS_LANDMARK_LAYOUT } from "./hollow-sands-landmarks.js";
import { buildSolkaraScenery, SOLKARA_SCENERY_LAYOUT } from "./solkara-scenery.js";

export const HOLLOW_SANDS = "hollow_sands";
export const SANDS_ARRIVAL = { x: 0.5, y: 33, z: 4.5 };
export const SANDS_RETURN = { x: 0, y: 33, z: 0 };

export const SANDS_REGIONS = [
  { name: "Pale Dunes", top: B.SAND, sub: B.SANDSTONE, haze: 0x504453,
    lore: "Our surveyors drove bronze stakes into these dunes. By morning, the stakes stood in a straight line again, half a mile west." },
  { name: "Crystal Wastes", top: B.KEEPER_STONE, sub: B.DARKSLATE, haze: 0x293f4d,
    lore: "In the Wastes, a single struck crystal rang all the way to the capital. We taught our messengers to count the echoes." },
  { name: "Bone Fields", top: B.SANDSTONE, sub: B.SANDSTONE, haze: 0x57454a,
    lore: "A child's grave lies beside the oldest ribs. The keepers left both places unmarked. Only the sand knows which was buried first." },
  { name: "Forgotten Kingdom", top: B.SUN_BRICKS, sub: B.SANDSTONE, haze: 0x584039,
    lore: "The king ordered the bells to ring through the evacuation. When the last family reached the stairs, the bell keeper was still at his post." },
  { name: "Abyssal Sands", top: B.SOUL_SAND, sub: B.DARKSLATE, haze: 0x30273e,
    lore: "When the sound came from below, the miners put their lamps out and listened. The sound passed beneath them, then turned back." },
  { name: "Eternal Oasis", top: B.GRASS, sub: B.DIRT, haze: 0x314a46,
    lore: "We brought three jars from the surface. A hundred years later, our children still dip their cups where we poured them out." }
];
export const SANDS_TABLETS = SANDS_REGIONS.map((region, zone) => {
  const angle = (zone + 0.5) * Math.PI / 3 - Math.PI;
  return { region, x: Math.round(Math.cos(angle) * 76), z: Math.round(Math.sin(angle) * 76) };
});

export class HollowSandsGen {
  constructor(seed, landmarkLayout, scenery) {
    this.seed = hashSeed(seed) ^ 0x16ba93d;
    this.noise = new Noise(this.seed);
    this.version = CURRENT_GEN;
    this.stamps = [buildBuriedThrone(scenery)];
    if (landmarkLayout === SANDS_LANDMARK_LAYOUT) this.stamps.push(...buildSandsLandmarks(this, SANDS_TABLETS));
    if (scenery === SOLKARA_SCENERY_LAYOUT) this.stamps.push(...buildSolkaraScenery(this));
  }
  isNether() { return false; }
  isMap() { return HOLLOW_SANDS; }
  findSpawn() { return SANDS_ARRIVAL; }
  column(x, z) {
    const r = Math.hypot(x, z);
    const angle = Math.atan2(z, x) + Math.PI + this.noise.n2(x / 90, z / 90) * 0.25;
    const zone = r < 48 ? 0 : Math.floor(angle * 3 / Math.PI + 6) % 6;
    const blend = Math.max(0, Math.min(1, (r - 12) / 30));
    const dune = this.noise.n2(x / 35, z / 35) * 5 + this.noise.n2(x / 13, z / 13) * 1.8;
    const h = Math.round(32 + blend * dune);
    return { h, zone, biome: SANDS_REGIONS[zone].name };
  }
  generate(cx, cz) {
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
      const wx = cx * CHUNK + x, wz = cz * CHUNK + z;
      const { h, zone } = this.column(wx, wz), region = SANDS_REGIONS[zone];
      const set = (y, id) => { data[idx(x, y, z)] = id; };
      const sanctuary = Math.abs(wx) <= 7 && Math.abs(wz) <= 8;
      const pool = zone === 5 && h < 31;
      set(0, B.BEDROCK);
      for (let y = 1; y < h; y++) set(y, y < h - 4 ? B.DARKSLATE : region.sub);
      set(h, sanctuary ? B.SUN_BRICKS : pool ? B.SAND : region.top);
      if (pool) for (let y = h + 1; y <= 31; y++) set(y, B.WATER);
      for (let y = 68; y < HEIGHT - 1; y++) set(y, B.DARKSLATE);
      set(HEIGHT - 1, B.BEDROCK);
      if (sanctuary) {
        if ((Math.abs(wx) === 6 && Math.abs(wz) === 6)) {
          for (let y = 33; y <= 38; y++) set(y, B.SUN_GLYPH);
          set(39, B.SHINESTONE);
        }
        if (wz === 0 && Math.abs(wx) === 2) for (let y = 33; y < 37; y++) set(y, B.SUN_GLYPH);
        if (wz === 0 && Math.abs(wx) <= 2) set(37, B.SUN_BRICKS);
        if (wx === SANDS_RETURN.x && wz === SANDS_RETURN.z) set(SANDS_RETURN.y, B.SOLKARA_GATE);
        continue;
      }
      const marker = hash3(this.seed, Math.floor(wx / 9), zone, Math.floor(wz / 9));
      const lx = ((wx % 9) + 9) % 9, lz = ((wz % 9) + 9) % 9;
      if (zone === 1 && marker < 0.55 && lx === 4 && lz === 4) {
        for (let y = h + 1; y <= h + 2 + Math.floor(marker * 9); y++) set(y, B.LUMEN_CRYSTAL);
      }
      if (zone === 2 && marker < 0.4 && lz === 4 && lx >= 2 && lx <= 6) {
        set(h + (lx === 2 || lx === 6 ? 1 : 2), B.QUARTZ_BLOCK);
      }
      if (zone === 3 && marker < 0.5 && (lx === 2 || lx === 6) && lz === 4) {
        for (let y = h + 1; y <= h + 3; y++) set(y, B.SUN_GLYPH);
        set(h + 4, B.SHINESTONE);
      }
      if (zone === 4 && marker < 0.25 && lx === 4 && lz === 4) set(h + 1, B.RESONANT_GLASS);
      const tablet = SANDS_TABLETS[zone], dx = Math.abs(wx - tablet.x), dz = Math.abs(wz - tablet.z);
      if (dx <= 1 && dz <= 1) {
        const base = this.column(tablet.x, tablet.z).h + 1;
        for (let y = Math.min(h, base - 1); y <= base; y++) set(y, B.SUN_BRICKS);
        for (let y = base + 1; y <= Math.max(h + 6, base + 3); y++) set(y, B.AIR);
        if (!dx && !dz) set(base + 1, B.LORE_TABLET);
        if (dx === 1 && dz === 1) set(base + 1, B.SHINESTONE);
      }
    }
    return applyStamps(this, data, cx, cz);
  }
}
