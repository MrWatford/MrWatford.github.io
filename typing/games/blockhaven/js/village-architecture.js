import { B, I, HEAD, OPEN, TOP, STAIR_INNER, STAIR_OUTER, STAIR_RIGHT, LOG_ALONG_X, LOG_ALONG_Z, make } from "./blocks.js";
import { newStack } from "./inventory.js";
import { hash3 } from "./noise.js";

export const VILLAGE_ARCHITECTURE_GEN = 21;

// Width and depth describe the wall line. Roofs and trim use the reserved apron.
const plans = {
  cottage: [
    ["Hearth Cottage",7,7,"gable"], ["Orchard Cottage",8,7,"dormer","right"],
    ["Weaver's Cottage",7,8,"long","left"], ["Stonecap Cottage",9,7,"hip"],
    ["Garden Cottage",8,8,"cross"], ["Crofter's Cottage",9,8,"shed","right"]
  ],
  house: [
    ["Gable House",8,7,"gable","left"], ["Lantern House",9,8,"cross",null,true],
    ["Balcony House",9,7,"dormer",null,true], ["Timber House",7,8,"long"],
    ["Corner House",8,8,"hip","right"], ["Terrace House",9,8,"gable",null,true]
  ],
  manor: [
    ["Merchant's Manor",11,9,"cross",null,true], ["Gallery House",9,8,"long",null,true],
    ["Tall Gables",9,8,"gable","left",true], ["Dormer House",11,10,"dormer","right",true],
    ["Courtyard Residence",10,9,"hip",null,true], ["Two Lanterns",10,10,"cross","left",true]
  ],
  farmhouse: [
    ["Harvest House",9,8,"long"], ["Orchard Farm",8,7,"gable","left"],
    ["Dairy House",9,7,"shed","right"], ["Grain Farm",9,8,"cross"],
    ["Apiary House",8,8,"dormer"], ["Mill Farm",9,8,"hip","left"]
  ],
  smithy: [
    ["Forge Court",9,8,"cross"], ["Slag Hearth",8,7,"shed","left"],
    ["Iron Roof Forge",9,7,"gable","right"], ["Toolwright's Shop",8,8,"long"],
    ["Armorer's Forge",9,8,"hip"], ["Brazier Workshop",9,8,"dormer","left"]
  ],
  shop: [
    ["Lantern Exchange",9,8,"dormer","right",true], ["Wool Merchant",8,7,"gable","left"],
    ["Provisioner",9,7,"hip"], ["Market House",9,8,"cross",null,true],
    ["Cooper's Shop",8,8,"shed","right"], ["Tool Merchant",9,8,"long"]
  ],
  library: [
    ["Mapkeeper's Library",9,8,"cross"], ["Candle Archive",8,7,"gable"],
    ["Reading Gallery",9,8,"dormer",null,true], ["Bookbinder's Hall",8,8,"long","left"],
    ["Records House",9,7,"hip","right"], ["Scribe's Tower",9,8,"gable","right",true]
  ],
  inn: [
    ["The Lantern Inn",11,9,"cross",null,true], ["The Wayfarer",9,8,"long",null,true],
    ["The Golden Sheaf",9,8,"dormer","left",true], ["The Stone Hearth",10,9,"hip",null,true],
    ["The North Star",11,10,"gable","right",true], ["The Bell and Oak",10,10,"cross","left",true]
  ],
  storehouse: [
    ["Barrel House",8,7,"gable"], ["Granary",9,8,"shed","right"],
    ["Cooperage",8,8,"long"], ["Trade Warehouse",9,7,"hip","left"],
    ["Dry Goods Store",9,8,"cross"], ["Pantry House",7,8,"dormer","right"]
  ],
  stable: [
    ["Oak Stables",9,8,"long"], ["Hay Barn",9,7,"gable"],
    ["Pack Stable",8,8,"shed","left"], ["Drover's Barn",9,8,"cross","right"],
    ["Foaling Stable",9,7,"hip"], ["Covered Paddock",8,7,"long","right"]
  ]
};

export const VILLAGE_BUILDINGS = Object.fromEntries(Object.entries(plans).map(([kind, variants]) => [
  kind, variants.map(([name, width, depth, roof, entry, upper], variant) =>
    ({ kind, variant, name, width, depth, roof, entry, upper: !!upper }))
]));

const oak = { timber: B.LOG, wall: B.WHITE_TERRACOTTA, floor: B.PLANKS, stair: B.OAK_STAIRS,
  slab: B.OAK_SLAB, fence: B.OAK_FENCE, shutter: B.OAK_TRAPDOOR, stone: B.STONE_BRICKS,
  worn: B.MOSSY, trim: B.STONE_BRICK_STAIRS, glass: B.GLASS_PANE, ground: B.GRASS };
const palettes = {
  plains: oak,
  forsaken: { ...oak, timber: B.DEADWOOD_LOG, wall: B.DEADWOOD_PLANKS, floor: B.DEADWOOD_PLANKS,
    stair: B.FORSAKEN_STAIRS, slab: B.FORSAKEN_SLAB, stone: B.FORSAKEN_BRICKS, worn: B.FORSAKEN_MOSSY,
    trim: B.FORSAKEN_STAIRS, glass: B.FORSAKEN_PANE, ground: B.ASH_SOIL },
  forest: { ...oak, wall: B.BIRCH_PLANKS, floor: B.SPRUCE_PLANKS, stair: B.SPRUCE_STAIRS, slab: B.SPRUCE_SLAB, stone: B.COBBLE },
  birch: { ...oak, wall: B.BIRCH_PLANKS, floor: B.BIRCH_PLANKS, stair: B.BIRCH_STAIRS, slab: B.BIRCH_SLAB, fence: B.BIRCH_FENCE, shutter: B.BIRCH_TRAPDOOR },
  sandy: { ...oak, wall: B.TEMPLE_STONE, floor: B.ACACIA_PLANKS, stair: B.ACACIA_STAIRS, slab: B.ACACIA_SLAB,
    stone: B.SANDSTONE, worn: B.TEMPLE_STONE, trim: B.SANDSTONE_STAIRS, ground: B.SAND },
  taiga: { ...oak, timber: B.SPRUCE_LOG, wall: B.SPRUCE_PLANKS, floor: B.DARK_OAK_PLANKS, stair: B.SPRUCE_STAIRS,
    slab: B.SPRUCE_SLAB, stone: B.COBBLE, worn: B.STONE_BRICKS, glass: B.ORANGE_STAINED_GLASS_PANE },
  mountain: { ...oak, timber: B.SPRUCE_LOG, wall: B.STONE_BRICKS, floor: B.SPRUCE_PLANKS, stair: B.SPRUCE_STAIRS,
    slab: B.SPRUCE_SLAB, stone: B.COBBLE, worn: B.CRACKED_BRICKS },
  savanna: { ...oak, timber: B.ACACIA_LOG, wall: B.YELLOW_TERRACOTTA, floor: B.ACACIA_PLANKS, stair: B.ACACIA_STAIRS, slab: B.ACACIA_SLAB },
  cherry: { ...oak, timber: B.CHERRY_LOG, wall: B.CHERRY_PLANKS, floor: B.BIRCH_PLANKS, stair: B.CHERRY_STAIRS, slab: B.CHERRY_SLAB },
  jungle: { ...oak, timber: B.JUNGLE_LOG, wall: B.JUNGLE_PLANKS, floor: B.JUNGLE_PLANKS, stair: B.JUNGLE_STAIRS, slab: B.JUNGLE_SLAB, stone: B.MOSSY },
  wetland: { ...oak, timber: B.MANGROVE_LOG, wall: B.WHITE_TERRACOTTA, floor: B.MANGROVE_PLANKS, stair: B.MANGROVE_STAIRS, slab: B.MANGROVE_SLAB, stone: B.MOSSY },
  stonehaven: { ...oak, timber: B.DARK_OAK_LOG, floor: B.SPRUCE_PLANKS, stair: B.SPRUCE_STAIRS, slab: B.SPRUCE_SLAB, worn: B.CRACKED_BRICKS }
};

const roofMaterials = {
  slate: [B.BLACKSTONE_BRICK_STAIRS, B.BLACKSTONE_BRICK_SLAB, B.BLACKSTONE_BRICKS],
  tile: [B.BRICK_STAIRS, B.BRICK_SLAB, B.BRICKS],
  oak: [B.OAK_STAIRS, B.OAK_SLAB, B.PLANKS],
  spruce: [B.SPRUCE_STAIRS, B.SPRUCE_SLAB, B.SPRUCE_PLANKS],
  sand: [B.SANDSTONE_STAIRS, B.SANDSTONE_SLAB, B.SANDSTONE]
};
const jobFor = { cottage: B.TABLE, house: B.FLETCH_TABLE, manor: B.MAP_TABLE, farmhouse: B.COMPOSTER,
  smithy: B.SMITH_TABLE, shop: B.LOOM, library: B.BOOKSHELF, inn: B.SMOKER, storehouse: B.BARREL, stable: B.LOOM };
const rolePlans = {
  smith: ["smithy"], shepherd: ["cottage", "cottage", "stable"],
  farmer: ["farmhouse"], beekeeper: ["farmhouse"], scribe: ["library"],
  fletcher: ["shop", "house", "manor"], cleric: ["library", "inn"]
};
const art = ["cottage", "flowers", "moon", "apple"];

export function villageHousePlan(prof, seed, x, z, compact) {
  const options = rolePlans[prof] || ["cottage"];
  const kind = options[Math.floor(hash3(seed, x, 2141, z) * options.length)];
  const variant = Math.floor(hash3(seed, x, 2142, z) * VILLAGE_BUILDINGS[kind].length);
  return fitVillageBuilding(kind, variant, 9, compact ? 7 : 8);
}

export function fitVillageBuilding(kind, variant, maxWidth, maxDepth) {
  const plan = VILLAGE_BUILDINGS[kind][variant];
  return { ...plan, width: Math.min(plan.width, maxWidth), depth: Math.min(plan.depth, maxDepth) };
}

export function villageBuildingAnchors(plan) {
  const { width: w, depth: d, entry, upper, kind } = plan;
  const mid = Math.floor(w / 2);
  const door = Math.max(3, Math.min(w - 3, mid + (entry === "left" ? -1 : entry === "right" ? 1 : 0)));
  const homes = ["cottage", "house", "manor", "farmhouse", "inn"];
  return { door: [door, 1, d - 1], home: [door, 1, d - 2],
    job: [w - 2, 1, 1], bed: [1, upper ? 5 : 1, homes.includes(kind) ? 2 : 1] };
}

function roofCell(section, x, z) {
  const { x0, x1, z0, z1, base, profile } = section;
  if (x < x0 || x > x1 || z < z0 || z > z1) return null;
  const west = x - x0, east = x1 - x, north = z - z0, south = z1 - z;
  if (profile === "terrace") {
    const inset = Math.min(west, east, north, south);
    return { y: base + (inset >= 3 ? 1 : 0), f: null, slab: inset === 1 || inset === 2 };
  }
  if (profile === "shed") return { y: base + Math.floor(south / 2), f: south % 2 ? 2 : null, slab: south % 2 === 0 };
  const xRise = Math.min(west, east), zRise = Math.min(north, south);
  const xf = west < east ? 1 : 3, zf = north < south ? 0 : 2;
  const xRidge = Math.abs(west - east) <= 1, zRidge = Math.abs(north - south) <= 1;
  if (profile === "hip" && xRise === zRise && !xRidge && !zRidge) {
    return { y: base + xRise, f: xf, corner: STAIR_OUTER | ((xf + 1) % 4 === zf ? STAIR_RIGHT : 0) };
  }
  if (profile === "long" || profile === "hip" && zRise < xRise) return { y: base + zRise, f: zRidge ? null : zf };
  return { y: base + xRise, f: xRidge ? null : xf };
}

function roofSections(plan, eaves, door) {
  const { width: w, depth: d, roof, variant } = plan;
  const main = { x0: -1, x1: w, z0: -1, z1: d, base: eaves + 1,
    profile: ["cross", "dormer"].includes(roof) ? "long" : roof };
  if (roof === "cross") return [main, { x0: door - 2, x1: door + 2, z0: d - 5, z1: d + 1, base: eaves + 1, profile: "gable" }];
  if (roof === "dormer") {
    const center = Math.min(w - 3, Math.max(2, door + (variant % 2 ? -2 : 2)));
    return [main, { x0: center - 2, x1: center + 2, z0: d - 5, z1: d - 1, base: eaves + 2, profile: "gable", dormer: center }];
  }
  return [main];
}

function roofAt(sections, x, z) {
  const main = roofCell(sections[0], x, z);
  if (sections.length === 1) return main;
  const wing = roofCell(sections[1], x, z);
  if (!wing || main && main.y > wing.y) return main;
  if (main && main.y === wing.y && main.f !== null && wing.f !== null) {
    return { ...main, corner: STAIR_INNER | ((main.f + 1) % 4 === wing.f ? STAIR_RIGHT : 0) };
  }
  return wing;
}

// Coordinates are local to a single building and its apron. The caller handles terrain, stamps and crops.
export function buildVillageBuilding(plan, { put, decorate = () => {}, biome, seed, x, z, jobBlock, profession }) {
  const { width: w, depth: d, kind, roof, variant, upper } = plan;
  const p = palettes[biome] || oak, a = villageBuildingAnchors(plan), door = a.door[0];
  const front = d - 1, right = w - 1;
  const eaves = upper ? 8 : kind === "stable" || kind === "storehouse" ? 4 : 5;
  const sections = roofSections(plan, eaves, door);
  const color = biome === "forsaken" ? (variant % 3 ? "tile" : "slate") : roof === "terrace" ? "sand" : kind === "smithy" ? "slate" : biome === "sandy" ? (variant % 2 ? "tile" : "sand") :
    biome === "taiga" ? "spruce" : biome === "mountain" ? "slate" :
    kind === "farmhouse" || kind === "stable" ? "spruce" : kind === "shop" || kind === "inn" ? "tile" :
    ["oak", "spruce", "tile", "slate", "spruce", "tile"][variant];
  const [slope, cap, tiles] = roofMaterials[color];
  const fill = (x0, y0, z0, x1, y1, z1, block) => {
    for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) {
      for (let yy = y0; yy <= y1; yy++) put(xx, yy, zz, block);
    }
  };
  const masonry = (xx, zz) => hash3(seed, x + xx, 2191, z + zz) < .26 ? p.worn : p.stone;
  const rearBay = Math.floor(w / 2);
  for (let zz = 0; zz < d; zz++) for (let xx = 0; xx < w; xx++) {
    const side = xx === 0 || xx === right, end = zz === 0 || zz === front;
    const post = side && end || end && xx === rearBay || side && zz === Math.floor(d / 2);
    const pane = end ? [1, w - 2].includes(xx) : [2, d - 3].includes(zz);
    const windows = kind === "smithy" || kind === "storehouse" ? B.IRON_BARS : kind === "library" ?
      (variant % 2 ? B.YELLOW_STAINED_GLASS_PANE : B.BLUE_STAINED_GLASS_PANE) : kind === "shop" ? B.GLASS : p.glass;
    put(xx, 0, zz, side || end ? masonry(xx, zz) : p.floor);
    if (!side && !end) continue;
    for (let yy = 1; yy <= eaves; yy++) {
      const beam = yy === eaves || upper && yy === 4;
      const block = yy === 1 ? masonry(xx, zz) : post ? p.timber : beam ? make(p.timber, side ? LOG_ALONG_Z : LOG_ALONG_X) :
        pane && (yy === 2 || yy === 3 || upper && (yy === 6 || yy === 7)) ? windows : p.wall;
      put(xx, yy, zz, block);
    }
    const row = roofAt(sections, xx, zz);
    for (let yy = eaves + 1; yy < row.y; yy++) put(xx, yy, zz, post ? p.timber : p.wall);
  }

  for (let zz = -1; zz <= d + 1; zz++) for (let xx = -1; xx <= w; xx++) {
    const row = roofAt(sections, xx, zz);
    if (!row) continue;
    if (roof === "terrace" && row.y > eaves + 1) put(xx, row.y - 1, zz, tiles);
    const rim = xx === -1 || xx === w || zz === -1 || zz === d + 1;
    const edge = roof === "shed" || roof === "long" || roof === "cross" || roof === "dormer" ? xx === -1 || xx === w : zz === -1 || zz === d;
    put(xx, row.y, zz, row.f === null ? (row.slab ? cap : tiles) : make(edge ? p.stair : slope, row.f | (row.corner || 0)));
    if (rim && row.f === null && !row.slab) put(xx, row.y + 1, zz, cap);
  }

  const dormer = sections[1]?.dormer;
  if (dormer !== undefined) {
    for (const xx of [dormer - 1, dormer + 1]) put(xx, eaves + 2, front, p.timber);
    put(dormer, eaves + 2, front, p.glass);
    put(dormer, eaves + 3, front, p.glass);
    put(dormer, eaves + 5, front, cap);
  }
  for (const [xx, facing] of [[-1, 1], [w, 3]]) for (const zz of [1, front - 1]) {
    put(xx, eaves, zz, make(p.stair, facing | 4));
  }

  put(door, 1, front, make(B.DOOR, OPEN));
  put(door, 2, front, make(B.DOOR, OPEN | TOP));
  put(door, 3, front, p.timber);
  for (const xx of [door - 1, door + 1]) {
    put(xx, 1, front, p.stone);
    put(xx, 2, front, p.timber);
  }
  for (const xx of [1, w - 2]) {
    if (Math.abs(xx - door) <= 1) continue;
    put(xx, 1, front + 1, make(p.trim, 2 | 4));
    if (kind === "smithy" || kind === "storehouse") continue;
    const plant = p.ground === B.SAND ? B.DEAD_BUSH : xx % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW;
    put(xx, 1, front + 1, p.ground);
    put(xx, 2, front + 1, plant);
    for (const shutter of [xx - 1, xx + 1]) {
      if (Math.abs(shutter - door) > 1) put(shutter, 3, front + 1, make(p.shutter, 2 | OPEN));
    }
  }

  const porch = roof === "cross" || ["smithy", "shop", "inn", "farmhouse"].includes(kind);
  if (porch) {
    for (const xx of [door - 2, door + 2]) {
      put(xx, 0, front + 2, p.stone);
      fill(xx, 1, front + 2, xx, 3, front + 2, p.fence);
    }
    for (let xx = door - 2; xx <= door + 2; xx++) {
      put(xx, 4, front + 2, make(slope, 2));
      put(xx, 4, front + 1, make(cap, 2));
    }
    put(door, 3, front + 2, make(B.LANTERN, 1));
  } else {
    put(door, 4, front + 1, p.slab);
    put(door, 3, front + 1, make(B.LANTERN, 1));
  }
  for (const xx of [1, w - 2]) {
    if (Math.abs(xx - door) <= 1 || porch && Math.abs(xx - door) === 2 ||
        kind === "smithy" || kind === "storehouse") continue;
    put(xx, 1, front + 2, make(p.shutter, 2 | OPEN));
  }

  // A real stair leads to a landing. The opening stays the width of the stair plus its handrail.
  const stairX = w - 2;
  if (upper) {
    for (let zz = 1; zz < front; zz++) for (let xx = 1; xx < right; xx++) {
      if (xx !== stairX || zz <= 1) put(xx, 4, zz, p.floor);
    }
    for (let step = 0; step < 4; step++) {
      const zz = 5 - step;
      fill(stairX, 1, zz, stairX, step, zz, p.stone);
      put(stairX, step + 1, zz, make(p.stair, 2));
    }
    for (let zz = 2; zz <= 5; zz++) put(stairX - 1, 5, zz, p.fence);
    if (roof === "dormer" || roof === "cross" || kind === "manor") {
      for (let xx = door - 1; xx <= door + 1; xx++) put(xx, 4, front + 1, p.floor);
      for (const xx of [door - 1, door + 1]) put(xx, 5, front + 1, kind === "manor" ? p.glass : p.fence);
      put(door, 5, front + 1, p.fence);
      put(door, 5, front, make(B.DOOR, OPEN));
      put(door, 6, front, make(B.DOOR, OPEN | TOP));
    }
    put(1, 5, front - 1, B.CHEST);
    put(2, 5, 1, B.BOOKSHELF);
    put(door, 7, 1, make(B.LANTERN, 1));
  }

  const addDecor = (xx, yy, zz, block, direction, contents) => {
    const value = make(block, direction);
    put(xx, yy, zz, value);
    decorate(xx, yy, zz, value, contents);
  };
  const frame = (xx, yy, zz, id) => addDecor(xx, yy, zz, B.ITEM_FRAME, 2, { type: "frame", slots: [newStack(id)], rot: 0 });
  const painting = (xx, yy, zz, key) => addDecor(xx, yy, zz, B.PAINTING, 2,
    { type: "painting", art: key, rx: 1, rz: 0 });
  const bed = (xx, yy, zz, facing = 0) => {
    put(xx, yy, zz, make(B.BED, facing));
    put(xx, yy, zz + (facing === 0 ? 1 : -1), make(B.BED, facing | HEAD));
  };
  const bench = (xx, zz) => put(xx, 1, zz, make(p.stair, 0));
  const hearth = (xx, zz, block) => {
    put(xx, 1, zz, make(block, 0));
    const capY = Math.max(eaves + 6, roofAt(sections, xx, zz).y + 2);
    fill(xx, 2, zz, xx, capY - 1, zz, B.BRICKS);
    put(xx, capY, zz, B.BRICK_SLAB);
  };
  const carpet = kind === "smithy" || kind === "storehouse" ? B.BROWN_CARPET : kind === "library" ? B.BLUE_CARPET : B.RED_CARPET;
  for (let zz = 2; zz <= front - 1; zz++) put(door, 1, zz, carpet);
  if (upper) {
    if (kind === "inn") {
      bed(1, 5, 2, 2);
      bed(2, 5, front - 1, 2);
      fill(1, 5, 3, stairX - 2, 7, 3, p.wall);
      const guestDoor = stairX - 2;
      put(guestDoor, 5, 3, make(B.DOOR, OPEN));
      put(guestDoor, 6, 3, make(B.DOOR, OPEN | TOP));
    } else {
      if (["manor", "house", "shop"].includes(kind)) bed(...a.bed);
      put(2, 5, front - 1, B.RED_CARPET);
    }
    if (kind === "library") {
      fill(w - 4, 5, 1, w - 3, 6, 1, B.BOOKSHELF);
      put(3, 5, front - 1, B.TABLE);
    }
    painting(3, 6, 1, art[variant % art.length]);
  }

  put(...a.job, jobBlock || jobFor[kind]);
  put(2, upper ? 3 : eaves - 1, 2, make(B.LANTERN, 1));
  if (!upper) put(2, eaves, 2, p.timber);
  switch (kind) {
    case "smithy":
      hearth(1, 1, B.BLAST_FURNACE);
      put(2, 1, 1, B.ANVIL);
      put(1, 1, 3, B.GRINDSTONE);
      put(w - 2, 1, 4, B.BARREL);
      frame(3, 2, 1, I.IRON_INGOT);
      addDecor(w - 2, 1, front - 1, B.ARMOR_STAND, 3,
        { type: "stand", slots: [newStack(I.LEATHER_HELMET), newStack(I.LEATHER_CHEST), null, newStack(I.LEATHER_BOOTS)] });
      break;
    case "library":
      for (const xx of upper ? [1] : [1, w - 2]) for (const zz of [2, 3, 4]) {
        fill(xx, 1, zz, xx, 2, zz, B.BOOKSHELF);
      }
      put(2, 1, 1, B.MAP_TABLE);
      put(3, 1, 1, B.LECTERN);
      put(2, 1, front - 2, B.TABLE);
      bench(2, front - 1);
      frame(w - 3, 2, 1, I.PAPER);
      painting(3, 2, 1, "moon");
      break;
    case "shop":
      put(1, 1, 1, B.BARREL);
      put(2, 1, 1, B.CHEST);
      put(1, 1, front - 2, B.TABLE);
      put(2, 1, front - 2, p.slab);
      if (!upper) put(w - 2, 1, 3, B.BOOKSHELF);
      frame(3, 2, 1, I.JADE);
      frame(w - 3, 2, 1, I.APPLE);
      break;
    case "farmhouse":
      bed(...a.bed);
      hearth(1, 1, B.SMOKER);
      addDecor(w - 2, 1, 3, B.BARREL, 0,
        { type: "chest", slots: [newStack(I.SEEDS, 4), newStack(I.CARROT, 2), ...Array(25).fill(null)] });
      put(w - 2, 1, 4, B.HAY);
      put(2, 1, front - 2, B.TABLE);
      bench(2, front - 1);
      frame(3, 2, 1, I.SEEDS);
      if (profession === "beekeeper") {
        put(right, 1, front + 2, p.timber);
        put(right, 2, front + 2, make(B.BEE_NEST, 1));
      }
      break;
    case "stable":
      for (const zz of [2, front - 2]) {
        put(1, 1, zz, B.HAY);
        put(2, 1, zz, p.fence);
        put(2, 1, zz + 1, make(B.OAK_GATE, OPEN));
      }
      put(1, 1, 1, B.BARREL);
      frame(3, 2, 1, I.SHEARS);
      break;
    case "storehouse":
      for (const xx of [1, w - 2]) for (const zz of [2, 4]) {
        put(xx, 1, zz, B.BARREL);
        put(xx, 2, zz, p.slab);
      }
      put(1, 1, 1, B.CHEST);
      frame(3, 2, 1, I.BREAD);
      break;
    default:
      if (!upper) bed(...a.bed);
      hearth(1, 1, kind === "inn" ? B.SMOKER : B.FURNACE);
      put(2, 1, 1, B.BARREL);
      put(2, 1, front - 2, B.TABLE);
      bench(2, front - 1);
      put(1, 1, front - 1, B.CHEST);
      if (!upper && kind !== "cottage") put(w - 2, 1, 3, B.BOOKSHELF);
      painting(3, 2, 1, art[variant % art.length]);
      if (kind === "manor" || kind === "inn") frame(w - 3, 2, 1, kind === "inn" ? I.BREAD : I.COMPASS);
  }
}
