// Builds the Forsaken World's hand-planned core map. This runs only during development (tools/forsaken-build.html):
// its output is packaged as maps/forsaken-v1.bin, which the game loads as a fixed template. Players' changes are saved
// separately, so every new adventure starts from the same map.
import { B, CHUNK, HEIGHT, make, OPEN, TOP } from "./blocks.js";
import { Noise } from "./noise.js";

export const FORSAKEN_VERSION = 1;
export const CORE = { min: -80, size: 160 };   // blocks −80…79 on both axes (10 × 10 chunks)
const LOOT_NONE = 0;

class Grid {
  constructor() { this.n = CORE.size; this.data = new Uint16Array(this.n * this.n * HEIGHT); }
  i(x, y, z) { return (x - CORE.min) + (z - CORE.min) * this.n + y * this.n * this.n; }
  inside(x, y, z) { return x >= CORE.min && x < CORE.min + this.n && z >= CORE.min && z < CORE.min + this.n && y >= 0 && y < HEIGHT; }
  get(x, y, z) { return this.inside(x, y, z) ? this.data[this.i(x, y, z)] : B.STONE; }
  set(x, y, z, v) { if (this.inside(x, y, z)) this.data[this.i(x, y, z)] = v; }
  id(x, y, z) { return this.get(x, y, z) & 255; }
  box(x0, y0, z0, x1, y1, z1, v) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, z, typeof v === "function" ? v(x, y, z) : v); }
  walls(x0, y0, z0, x1, y1, z1, v) { this.box(x0, y0, z0, x1, y1, z0, v); this.box(x0, y0, z1, x1, y1, z1, v); this.box(x0, y0, z0, x0, y1, z1, v); this.box(x1, y0, z0, x1, y1, z1, v); }
  top(x, z) { for (let y = HEIGHT - 2; y > 0; y--) { const id = this.id(x, y, z); if (id && id !== B.LEAVES && id !== B.LOG && id !== B.TALL_GRASS && id !== B.FLOWER_RED && id !== B.FLOWER_YELLOW) return y; } return 0; }
}

// small deterministic random numbers
function seeded(s) { return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

// ---------- the story, told through notes found around the map ----------
export const NOTES = {
  welcome: { title: "Wardkeeper's Welcome", text: "If you are reading this, you came through the old gate. Welcome to what is left of Hollowmere Vale.\n\nThe Ward Stone in the middle of this courtyard keeps him out. Inside the blue ring nothing can hurt you: he cannot appear here, he cannot reach in, and no monsters can form. Rest here whenever you need to.\n\nThe Return Gate beside the stone will always take you home." },
  rules: { title: "Rules of the Vale", text: "1. He is real, and he watches. Pale eyes in the mist are not your imagination.\n2. He notices noise: running, digging, and fighting. Walking and crouching are quiet.\n3. When the air goes still and the eye on your screen turns red, he is coming. Get to a ward.\n4. He always pauses after he appears. Use that moment.\n\nStart in Hollowmere village, to the east along the gravel road." },
  mara: { title: "Mara's Diary (torn page)", text: "Day 3 since the shrine went dark. He stood on the ridge again tonight, perfectly still, just looking at us. Bram says if we keep the lanterns lit and the doors barred he will lose interest.\n\nI don't think he loses interest." },
  barricade: { title: "Note nailed to a door", text: "DON'T RUN. He hears running. Walk to the shrine. If it's dark, wait inside a ward until it's light, even if you hear footsteps right behind you. ESPECIALLY then." },
  elder: { title: "Elder Bram's Letter", text: "To whoever finds this:\n\nOur shrine in the square failed the night the sigils were scattered. The Hearth Sigil is in the chest beside this letter. Set it into the Ward Altar in the square and the shrine will wake. A woken shrine is safe ground, and if you fall, you will wake beside it.\n\nThe other two sigils went with the miners and the foresters. Find the outpost to the north before you go after them. The researchers understood him better than we did." },
  log1: { title: "Research Log 1: Wards", text: "A ward makes a ring he cannot enter. He cannot appear inside it, his strikes stop at its edge, and monsters cannot form there.\n\nThe great wards (the Ward Stone and the three shrines) never fail. Our little Ward Candles do: each burns about two minutes. Light one, and watch the timer.\n\nIf you change the walls around a ward, the ward does not care. Only the stone itself matters." },
  log2: { title: "Research Log 2: How He Notices", text: "We measured it. He grows aware of you when you sprint, mine, fight, or carry a sigil into the dark woods. Standing still and crouching let his attention fade, and resting inside a ward fades it fastest.\n\nAt first he only watches from far away. Then he follows. Then he warns: the air goes quiet, the mist thickens. Then he hunts, but never for long. If you get away or reach a ward, he backs off for a while." },
  log3: { title: "Research Log 3: The Pale Step", text: "He moves through the mist by stepping out of one place and into another. He never steps inside a ward, never into stone, never right on top of you. After every step he needs a heartbeat before he can strike, and his eyes flare first. Watch the eyes.\n\nHe cannot be harmed in his own world, except in his citadel, when all four of its arena wards burn at once. That is how we will end this." },
  foreman: { title: "Foreman's Notice", text: "DEEPVEIN MINE. Lower chamber holds the Stone Sigil, sealed in the shrine chest when the ward failed.\n\nThe east passage collapsed. Go through the flooded tunnel (swim fast, there's air on the far side) or around by the lava gallery (careful!). The old escape shaft by the lower chamber climbs straight back to the surface." },
  forester: { title: "Forester's Last Note", text: "The trees went pale the week he came. Nothing grows here now, and the mist never lifts. The Root Sigil is hidden in the grove at the heart of the Pale Wood, ringed by black stone.\n\nThe forest shrine is right beside it. Restore it and the grove will be safe again. Don't linger in the pale trees. He walks here more than anywhere." },
  heart: { title: "The Ward Heart", text: "With all three shrines awake, their light joins into a Ward Heart.\n\nCarry it north to his citadel, the black tower beyond the ridge, and set it in the Pale Altar. Four arena wards stand around the altar. Light them, and keep them lit, though he will try to snuff them out. When all four burn together he is solid, and he can be driven out of this world for good." },
  gate: { title: "Words Carved Above the Gate", text: "HERE THE PALE ONE KEEPS HIS THRONE.\nLIGHT THE FOUR. HOLD THE FOUR. END HIS WATCH." }
};

// ---------- map ----------
export function buildForsaken() {
  const W = new Grid(), n1 = new Noise(424242), n2 = new Noise(97531), R = seeded(20261104);
  const meta = { version: FORSAKEN_VERSION, id: "forsaken-core-v1", core: CORE, notes: {}, containers: {}, landmarks: [], shrines: [], watchPoints: [], wards: [], regions: [] };
  // ----- landmarks (where things are) -----
  const L = {
    refuge: { x: 0, z: 0, h: 34, name: "Arrival Refuge" },
    village: { x: 38, z: 6, h: 33, name: "Hollowmere Village" },
    tower: { x: -6, z: -38, h: 38, name: "Watchtower" },
    outpost: { x: 40, z: -36, h: 34, name: "Research Outpost" },
    mine: { x: -38, z: 16, h: 35, name: "Deepvein Mine" },
    forest: { x: -48, z: -52, h: 33, name: "Pale Wood Grove" },
    citadel: { x: 0, z: 61, h: 34, name: "The Pale Citadel" }
  };
  const pads = [[L.refuge, 13], [L.village, 18], [L.tower, 6], [L.outpost, 9], [L.mine, 6], [L.forest, 9], [L.citadel, 20]];
  const inPale = (x, z) => x < -18 && z < -18;   // the corrupted Pale Wood
  // ----- land: gentle misty hills, flattened under every landmark -----
  const height = (x, z) => {
    let h = 34 + n1.n2(x / 46, z / 46) * 4 + n2.n2(x / 16, z / 16) * 1.6;
    h += Math.max(0, 6 - Math.hypot(x - L.tower.x, z - L.tower.z) / 4);              // the watchtower's hill
    h += Math.max(0, 7 - Math.hypot(x - (L.mine.x - 6), z - L.mine.z) / 3.5);        // the mine's hillside
    for (const [p, r] of pads) { const d = Math.hypot(x - p.x, z - p.z), k = d < r ? 1 : d < r + 8 ? 1 - (d - r) / 8 : 0; h = h * (1 - k) + p.h * k; }
    return Math.round(h);
  };
  for (let z = CORE.min; z < CORE.min + CORE.size; z++) for (let x = CORE.min; x < CORE.min + CORE.size; x++) {
    const h = height(x, z), pale = inPale(x, z);
    W.set(x, 0, z, B.BEDROCK);
    for (let y = 1; y <= h; y++) {
      let v = y < h - 3 ? B.STONE : y < h ? B.DIRT : pale ? (R() < 0.2 ? B.GRAVEL : R() < 0.1 ? B.SOUL_SAND : B.DIRT) : B.GRASS;
      if (v === B.STONE) { const r = R(); if (r < 0.012) v = B.COAL_ORE; else if (r < 0.018 && y < 24) v = B.IRON_ORE; }
      W.set(x, y, z, v);
    }
  }
  const ground = (x, z) => W.top(x, z);
  // ----- gravel roads between the landmarks (easy to follow in the mist) -----
  const road = (a, b) => {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(a.x + (b.x - a.x) * s / steps), z = Math.round(a.z + (b.z - a.z) * s / steps);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const gx = x + dx, gz = z + dz, y = ground(gx, gz); if ([B.GRASS, B.DIRT, B.SOUL_SAND].includes(W.id(gx, y, gz))) W.set(gx, y, gz, B.GRAVEL); }
    }
  };
  road({ x: 7, z: 0 }, { x: 26, z: 6 }); road({ x: 0, z: -7 }, { x: -5, z: -33 }); road({ x: 2, z: -7 }, { x: 34, z: -31 });
  road({ x: -7, z: 2 }, { x: -32, z: 15 }); road({ x: -7, z: -5 }, { x: -42, z: -46 }); road({ x: 0, z: 7 }, { x: 0, z: 46 });
  // ----- trees: misty oaks, and pale dead trees in the Pale Wood -----
  const tree = (x, z, dead) => {
    const y = ground(x, z);
    if (![B.GRASS, B.DIRT, B.SOUL_SAND].includes(W.id(x, y, z))) return;
    const h = dead ? 6 + Math.floor(R() * 5) : 5 + Math.floor(R() * 2);
    for (let k = 1; k <= h; k++) W.set(x, y + k, z, B.LOG);
    if (dead) {   // bare twisted branches
      for (let b = 0; b < 3; b++) { const dx = R() < 0.5 ? 1 : -1, dz = R() < 0.5 ? 1 : -1, by = y + 3 + Math.floor(R() * (h - 3)); W.set(x + dx, by, z, B.LOG); if (R() < 0.6) W.set(x + dx * 2, by + 1, z + (R() < 0.5 ? dz : 0), B.LOG); }
      return;
    }
    for (let ly = y + h - 3; ly <= y + h + 1; ly++) { const r = ly >= y + h ? 1 : 2; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (Math.abs(dx) === r && Math.abs(dz) === r && R() < 0.6) continue; if (!W.id(x + dx, ly, z + dz)) W.set(x + dx, ly, z + dz, B.LEAVES); } }
  };
  const clearOfPads = (x, z, m = 3) => pads.every(([p, r]) => Math.hypot(x - p.x, z - p.z) > r + m) && Math.abs(x) + 0 > -1;
  for (let k = 0; k < 900; k++) {
    const x = CORE.min + 3 + Math.floor(R() * (CORE.size - 6)), z = CORE.min + 3 + Math.floor(R() * (CORE.size - 6)), pale = inPale(x, z);
    if (!clearOfPads(x, z)) continue;
    const onRoad = W.id(x, ground(x, z), z) === B.GRAVEL; if (onRoad) continue;
    if (pale ? R() < 0.55 : R() < 0.42) tree(x, z, pale);
  }
  // black stone spikes and tall grass
  for (let k = 0; k < 40; k++) { const x = -78 + Math.floor(R() * 58), z = -78 + Math.floor(R() * 58); if (!clearOfPads(x, z, 1)) continue; const y = ground(x, z), h = 2 + Math.floor(R() * 5); for (let j = 1; j <= h; j++) W.set(x, y + j, z, j === h ? B.OBSIDIAN : B.BLACKSTONE); }
  for (let k = 0; k < 1400; k++) { const x = CORE.min + Math.floor(R() * CORE.size), z = CORE.min + Math.floor(R() * CORE.size), y = ground(x, z); if (W.id(x, y, z) === B.GRASS && !W.id(x, y + 1, z)) W.set(x, y + 1, z, R() < 0.95 ? B.TALL_GRASS : B.FLOWER_YELLOW); }
  meta.regions.push({ name: "Pale Wood", x0: -80, z0: -80, x1: -18, z1: -18, danger: 2, fog: 0.55 });

  const note = (x, y, z, key) => { W.set(x, y, z, B.NOTE_STAND); meta.notes[x + "," + y + "," + z] = key; };
  const chest = (x, y, z, slots, facing = 0) => { W.set(x, y, z, make(B.CHEST, facing)); meta.containers[x + "," + y + "," + z] = slots; };
  const door = (x, y, z, f) => { W.set(x, y, z, make(B.DOOR, f)); W.set(x, y + 1, z, make(B.DOOR, f | TOP)); };
  const it = (id, n) => ({ id, n });

  // ----- Arrival Refuge: a walled courtyard around the permanent Ward Stone -----
  {
    const { x: cx, z: cz, h } = L.refuge;
    W.box(cx - 8, h + 1, cz - 8, cx + 8, h + 6, cz + 8, B.AIR);
    W.box(cx - 7, h, cz - 7, cx + 7, h, cz + 7, (x, y, z) => (Math.abs(x) + Math.abs(z)) % 4 === 0 ? B.MOSSY : B.COBBLE);
    W.walls(cx - 7, h + 1, cz - 7, cx + 7, h + 3, cz + 7, B.STONE_BRICKS);
    for (const [x, z] of [[cx - 7, cz - 7], [cx + 7, cz - 7], [cx - 7, cz + 7], [cx + 7, cz + 7]]) { W.box(x, h + 1, z, x, h + 4, z, B.LOG); W.set(x, h + 5, z, B.TORCH); }
    W.box(cx + 7, h + 1, cz - 1, cx + 7, h + 3, cz + 1, B.AIR); W.box(cx - 1, h + 1, cz - 7, cx + 1, h + 3, cz - 7, B.AIR);   // gates east and north
    W.box(cx - 7, h + 1, cz - 1, cx - 7, h + 3, cz + 1, B.AIR); W.box(cx - 1, h + 1, cz + 7, cx + 1, h + 3, cz + 7, B.AIR);   // and west and south
    W.box(cx - 1, h + 1, cz - 1, cx + 1, h + 1, cz + 1, B.STONE_BRICKS);
    W.set(cx, h + 2, cz, B.WARD_STONE);
    for (const [x, z] of [[cx - 6, cz - 3], [cx - 6, cz + 3], [cx + 6, cz - 3], [cx + 6, cz + 3]]) W.set(x, h + 1, z, B.TORCH);
    W.set(cx, h + 1, cz + 4, B.RETURN_GATE);
    note(cx + 3, h + 1, cz - 4, "welcome"); note(cx - 3, h + 1, cz - 4, "rules");
    chest(cx - 5, h + 1, cz + 5, [it(B.TORCH, 16), it(I_BREAD, 8), it(I_STONE_SWORD, 1), it(I_STONE_PICK, 1), it(B.WARD_CANDLE, 2), it(I_APPLE, 4)], 0);
    meta.wards.push({ id: "refuge", x: cx, y: h + 2, z: cz, r: 10, kind: "stone", permanent: true });
    meta.arrival = { x: cx + 0.5, y: h + 1, z: cz - 2.5, yaw: 0 };
    meta.returnGate = { x: cx, y: h + 1, z: cz + 4 };
    meta.landmarks.push({ key: "refuge", ...L.refuge, r: 10 });
  }
  // ----- Hollowmere Village: empty, damaged houses around a dark shrine -----
  {
    const { x: vx, z: vz, h } = L.village;
    W.box(vx - 17, h + 1, vz - 17, vx + 17, h + 10, vz + 17, B.AIR);
    W.box(vx - 17, h, vz - 17, vx + 17, h, vz + 17, (x, y, z) => R() < 0.3 ? B.GRAVEL : B.GRASS);
    // the shrine in the square
    W.box(vx - 2, h, vz - 2, vx + 2, h, vz + 2, B.STONE_BRICKS);
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) W.box(vx + dx, h + 1, vz + dz, vx + dx, h + 3, vz + dz, B.MOSSY);
    W.set(vx, h + 1, vz, B.WARD_ALTAR);
    meta.shrines.push({ id: "hearth", name: "Hollowmere Shrine", x: vx, y: h + 1, z: vz, sigil: "SIGIL_HEARTH", r: 8 });
    // houses: [x, z, door side, damaged?, contents]
    const houses = [
      { x: vx - 11, z: vz - 10, f: 0, dmg: false, key: "elder" },
      { x: vx + 4, z: vz - 12, f: 0, dmg: true, key: "mara" },
      { x: vx + 10, z: vz + 1, f: 3, dmg: true },
      { x: vx - 12, z: vz + 5, f: 1, dmg: false, key: "barricade" },
      { x: vx + 2, z: vz + 9, f: 2, dmg: true }
    ];
    houses.forEach((hs, n) => {
      const x0 = hs.x - 3, x1 = hs.x + 3, z0 = hs.z - 3, z1 = hs.z + 2;
      W.box(x0, h, z0, x1, h, z1, B.COBBLE);
      W.walls(x0, h + 1, z0, x1, h + 3, z1, B.PLANKS);
      for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) W.box(cx, h + 1, cz, cx, h + 3, cz, B.LOG);
      W.box(x0, h + 4, z0, x1, h + 4, z1, B.PLANKS);
      W.set(hs.x - 1, h + 2, z0, B.GLASS); W.set(hs.x + 1, h + 2, z1, B.GLASS);
      // the door faces the square
      const dpos = hs.f === 0 ? [hs.x, z1] : hs.f === 1 ? [x1, hs.z] : hs.f === 2 ? [hs.x, z0] : [x0, hs.z];
      if (n === 3) { W.box(dpos[0], h + 1, dpos[1], dpos[0], h + 2, dpos[1], B.AIR); W.set(dpos[0], h + 1, dpos[1], make(B.DOOR, 1)); W.set(dpos[0], h + 2, dpos[1], make(B.DOOR, 1 | TOP)); }
      else if (n === 2) W.box(dpos[0], h + 1, dpos[1], dpos[0], h + 2, dpos[1], B.AIR);   // its door is gone
      else door(dpos[0], h + 1, dpos[1], hs.f === 0 ? 0 : hs.f === 1 ? 1 : hs.f === 2 ? 2 : 3);
      if (hs.dmg) { W.box(x1, h + 2, z0 + 1, x1, h + 4, z0 + 3, B.AIR); W.box(x0 + 1, h + 4, z0 + 1, x0 + 3, h + 4, z0 + 2, B.AIR); W.set(x1 + 1, h + 1, z0 + 2, B.PLANKS); W.set(x1 + 1, h + 1, z0 + 3, B.COBBLE); }
      // barricades: planks stacked inside the windows
      if (!hs.dmg) { W.set(hs.x - 1, h + 2, z0 + 1, B.PLANKS); W.set(hs.x + 1, h + 2, z1 - 1, B.PLANKS); }
      if (hs.key) note(hs.x + 2, h + 1, hs.z - 2, hs.key);
      W.set(hs.x - 2, h + 1, hs.z + 1, B.TORCH);
    });
    chest(vx - 13, h + 1, vz - 12, [it(I_SIGIL_HEARTH, 1), it(I_BREAD, 4), it(B.WARD_CANDLE, 1)], 0);   // the elder's chest
    chest(vx + 5, h + 1, vz - 14, [it(I_COOKED_PORK, 4), it(B.TORCH, 8), it(I_ARROW, 12)], 0);
    chest(vx + 1, h + 1, vz + 7, [it(I_BOW, 1), it(I_IRON_INGOT, 3), it(I_BREAD, 3)], 2);
    meta.landmarks.push({ key: "village", ...L.village, r: 16 });
  }
  // ----- the Watchtower on the ridge -----
  {
    const { x: tx, z: tz, h } = L.tower;
    W.box(tx - 3, h + 1, tz - 3, tx + 3, h + 26, tz + 3, B.AIR);
    W.walls(tx - 2, h, tz - 2, tx + 2, h + 22, tz + 2, (x, y) => y % 6 === 5 ? B.LOG : B.COBBLE);
    W.box(tx - 1, h, tz - 1, tx + 1, h, tz + 1, B.COBBLE);
    W.box(tx, h + 1, tz + 2, tx, h + 2, tz + 2, B.AIR);   // doorway
    // a spiral of steps up the inside
    const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
    for (let y = h + 1; y <= h + 21; y++) { const [dx, dz] = ring[(y - h) % 8]; W.set(tx + dx, y, tz + dz, B.PLANKS); }
    W.box(tx - 3, h + 22, tz - 3, tx + 3, h + 22, tz + 3, B.PLANKS);
    for (const y of [h + 19, h + 20, h + 21]) { const [dx, dz] = ring[(y - h) % 8]; W.set(tx + dx, h + 22, tz + dz, B.AIR); }   // the hatch above the last steps
    for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) { W.box(tx + dx, h + 23, tz + dz, tx + dx, h + 24, tz + dz, B.LOG); W.set(tx + dx, h + 25, tz + dz, B.TORCH); }
    W.walls(tx - 3, h + 23, tz - 3, tx + 3, h + 23, tz + 3, (x, y, z) => (x + z) % 2 ? B.COBBLE : B.AIR);
    meta.towerTop = { x: tx, y: h + 23, z: tz };
    meta.landmarks.push({ key: "tower", ...L.tower, r: 6 });
  }
  // ----- the Research Outpost -----
  {
    const { x: ox, z: oz, h } = L.outpost;
    W.box(ox - 7, h + 1, oz - 6, ox + 7, h + 8, oz + 6, B.AIR);
    W.box(ox - 6, h, oz - 5, ox + 6, h, oz + 5, B.STONE_BRICKS);
    W.walls(ox - 6, h + 1, oz - 5, ox + 6, h + 4, oz + 5, B.STONE_BRICKS);
    W.box(ox - 6, h + 5, oz - 5, ox + 6, h + 5, oz + 5, B.COBBLE);
    for (let x = ox - 4; x <= ox + 4; x += 2) { W.set(x, h + 3, oz - 5, B.GLASS); W.set(x, h + 3, oz + 5, B.GLASS); }
    door(ox, h + 1, oz + 5, 0);
    W.box(ox + 6, h + 1, oz - 3, ox + 6, h + 4, oz - 1, B.AIR); W.box(ox + 3, h + 5, oz - 4, ox + 5, h + 5, oz - 1, B.AIR);   // a broken wall and roof
    note(ox - 4, h + 1, oz - 3, "log1"); note(ox, h + 1, oz - 3, "log2"); note(ox + 3, h + 1, oz - 3, "log3");
    chest(ox - 5, h + 1, oz + 3, [it(B.WARD_CANDLE, 4), it(I_COOKED_PORK, 4), it(B.TORCH, 12)], 1);
    W.set(ox - 5, h + 1, oz - 4, B.TORCH); W.set(ox + 5, h + 1, oz + 4, B.TORCH);
    meta.landmarks.push({ key: "outpost", ...L.outpost, r: 8 });
  }
  // ----- Deepvein Mine: down from the hillside to a lower chamber; flooded and lava routes; an escape shaft -----
  {
    const { x: mx, z: mz } = L.mine, hy = ground(mx, mz);
    meta.mineEntrance = { x: mx, y: hy + 1, z: mz };
    // timber frame at the entrance
    W.box(mx - 2, hy + 1, mz - 2, mx - 2, hy + 4, mz - 2, B.LOG); W.box(mx - 2, hy + 1, mz + 2, mx - 2, hy + 4, mz + 2, B.LOG); W.box(mx - 2, hy + 4, mz - 2, mx - 2, hy + 4, mz + 2, B.PLANKS);
    const tunnel = (a, b, w = 1, hgt = 3) => {
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) * 2);
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(a.x + (b.x - a.x) * s / steps), y = Math.round(a.y + (b.y - a.y) * s / steps), z = Math.round(a.z + (b.z - a.z) * s / steps);
        W.box(x - w, y, z - w, x + w, y + hgt - 1, z + w, B.AIR); W.box(x - w, y - 1, z - w, x + w, y - 1, z + w, (xx, yy, zz) => W.id(xx, yy, zz) === B.AIR ? B.COBBLE : W.get(xx, yy, zz));
      }
    };
    const hall = { x: mx - 16, y: 22, z: mz + 10 }, lower = { x: mx - 22, y: 16, z: mz + 26 }, wet = { x: mx - 24, y: 18, z: mz + 16 }, lava = { x: mx - 10, y: 18, z: mz + 22 };
    tunnel({ x: mx - 2, y: hy + 1, z: mz }, { x: mx - 8, y: 28, z: mz + 2 }); tunnel({ x: mx - 8, y: 28, z: mz + 2 }, hall);
    W.box(hall.x - 5, hall.y, hall.z - 4, hall.x + 5, hall.y + 4, hall.z + 4, B.AIR);   // the main hall
    note(hall.x + 4, hall.y, hall.z - 3, "foreman"); W.set(hall.x - 4, hall.y, hall.z - 3, B.TORCH); W.set(hall.x + 4, hall.y, hall.z + 3, B.TORCH);
    // the collapsed east passage (gravel) — not a way through
    tunnel(hall, { x: hall.x + 2, y: 20, z: hall.z + 9 }); W.box(hall.x, 19, hall.z + 7, hall.x + 4, 23, hall.z + 10, B.GRAVEL);
    // route 1: the flooded tunnel (short swim, air pocket halfway)
    tunnel(hall, wet); tunnel(wet, lower);
    W.box(wet.x - 1, wet.y - 2, wet.z - 4, wet.x + 1, wet.y + 1, wet.z + 4, (x, y, z) => W.id(x, y, z) === B.AIR ? B.WATER : W.get(x, y, z));
    W.box(wet.x - 1, wet.y + 2, wet.z - 1, wet.x + 1, wet.y + 2, wet.z + 1, B.AIR);
    // route 2: the lava gallery (a ledge beside a lava pool)
    tunnel(hall, lava, 1, 4); tunnel(lava, lower, 1, 3);
    W.box(lava.x - 3, lava.y - 1, lava.z - 2, lava.x - 2, lava.y - 1, lava.z + 2, B.LAVA);
    // the lower chamber with the mine's shrine
    W.box(lower.x - 6, lower.y, lower.z - 5, lower.x + 6, lower.y + 5, lower.z + 5, B.AIR);
    W.box(lower.x - 6, lower.y - 1, lower.z - 5, lower.x + 6, lower.y - 1, lower.z + 5, B.COBBLE);
    W.box(lower.x - 1, lower.y - 1, lower.z - 1, lower.x + 1, lower.y - 1, lower.z + 1, B.STONE_BRICKS);
    W.set(lower.x, lower.y, lower.z, B.WARD_ALTAR);
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) W.box(lower.x + dx, lower.y, lower.z + dz, lower.x + dx, lower.y + 2, lower.z + dz, B.MOSSY);
    chest(lower.x + 4, lower.y, lower.z - 3, [it(I_SIGIL_STONE, 1), it(I_IRON_INGOT, 6), it(B.TORCH, 8)], 3);
    for (const [dx, dz] of [[-5, -4], [5, 4], [-5, 4]]) W.set(lower.x + dx, lower.y, lower.z + dz, B.TORCH);
    for (let k = 0; k < 6; k++) W.set(lower.x - 6 + Math.floor(R() * 12), lower.y - 2 + Math.floor(R() * 2), lower.z - 6, B.IRON_ORE);
    meta.shrines.push({ id: "stone", name: "Deepvein Shrine", x: lower.x, y: lower.y, z: lower.z, sigil: "SIGIL_STONE", r: 7 });
    // the escape shaft: a 2×2 shaft with a step every block, straight up to the surface
    const sx = lower.x - 5, sz = lower.z + 6;
    W.box(sx, lower.y, lower.z + 5, sx + 1, lower.y + 2, lower.z + 5, B.AIR);
    const top = ground(sx, sz);
    W.box(sx, lower.y, sz, sx + 1, top + 2, sz + 1, B.AIR);
    for (let y = lower.y; y <= top; y++) W.set(sx + ((y - lower.y) % 4 < 2 ? 0 : 1), y, sz + ((y - lower.y + 1) % 4 < 2 ? 0 : 1), B.COBBLE);
    W.box(sx - 1, top, sz - 1, sx + 2, top, sz - 1, B.COBBLE); W.set(sx - 1, top + 1, sz - 1, B.TORCH);
    meta.mine = { hall, lower, wet, lava, shaft: { x: sx, z: sz, top } };
    meta.landmarks.push({ key: "mine", ...L.mine, r: 6 });
  }
  // ----- the Pale Wood grove: the Root Sigil inside a ring of black stone, with the forest shrine beside it -----
  {
    const { x: fx, z: fz, h } = L.forest;
    W.box(fx - 9, h + 1, fz - 9, fx + 9, h + 12, fz + 9, B.AIR);
    W.box(fx - 9, h, fz - 9, fx + 9, h, fz + 9, (x, y, z) => R() < 0.3 ? B.SOUL_SAND : B.DIRT);
    for (let a = 0; a < 12; a++) { const x = Math.round(fx - 4 + Math.cos(a / 12 * Math.PI * 2) * 4), z = Math.round(fz + Math.sin(a / 12 * Math.PI * 2) * 4); if (a !== 0) W.box(x, h + 1, z, x, h + 2 + (a % 3), z, B.BLACKSTONE); }
    chest(fx - 4, h + 1, fz, [it(I_SIGIL_ROOT, 1), it(I_GOLDEN_APPLE, 1)], 1);
    W.box(fx + 3, h, fz - 2, fx + 7, h, fz + 2, B.STONE_BRICKS);
    for (const [dx, dz] of [[3, -2], [7, -2], [3, 2], [7, 2]]) W.box(fx + dx, h + 1, fz + dz, fx + dx, h + 3, fz + dz, B.MOSSY);
    W.set(fx + 5, h + 1, fz, B.WARD_ALTAR);
    note(fx + 1, h + 1, fz + 6, "forester");
    meta.shrines.push({ id: "root", name: "Pale Wood Shrine", x: fx + 5, y: h + 1, z: fz, sigil: "SIGIL_ROOT", r: 8 });
    meta.landmarks.push({ key: "forest", ...L.forest, r: 9 });
  }
  // ----- the Pale Citadel: a black fortress with tall corner towers and a spire; the arena inside -----
  {
    const { x: cx, z: cz, h } = L.citadel, x0 = cx - 16, x1 = cx + 16, z0 = cz - 15, z1 = cz + 15;
    W.box(x0 - 1, h + 1, z0 - 1, x1 + 1, HEIGHT - 3, z1 + 1, B.AIR);
    W.box(x0, h, z0, x1, h, z1, B.PALE_BRICKS);
    W.walls(x0, h + 1, z0, x1, h + 14, z1, B.PALE_BRICKS);
    for (const [tx, tz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) { W.box(tx - 2, h + 1, tz - 2, tx + 2, h + 24, tz + 2, B.PALE_BRICKS); W.box(tx - 1, h + 25, tz - 1, tx + 1, h + 26, tz + 1, B.OBSIDIAN); }
    W.box(cx - 1, h + 15, z1 - 1, cx + 1, h + 36, z1 + 1, B.PALE_BRICKS); W.box(cx, h + 37, z1, cx, h + 39, z1, B.OBSIDIAN);   // the spire at the back
    // entrances: the main gate (south, toward the refuge) and two side doors
    W.box(cx - 2, h + 1, z0, cx + 2, h + 5, z0, B.AIR); W.box(cx - 3, h + 6, z0, cx + 3, h + 6, z0, B.OBSIDIAN);
    W.box(x0, h + 1, cz - 1, x0, h + 3, cz + 1, B.AIR); W.box(x1, h + 1, cz - 1, x1, h + 3, cz + 1, B.AIR);
    note(cx + 4, h + 1, z0 - 2, "gate");
    // the arena floor with rings to read, cover pillars, and raised corners
    for (let z = z0 + 1; z < z1; z++) for (let x = x0 + 1; x < x1; x++) { const d = Math.hypot(x - cx, z - cz); W.set(x, h, z, (d > 5.5 && d < 6.5) || (d > 11.5 && d < 12.5) ? B.COBBLE : B.PALE_BRICKS); }
    for (const [dx, dz] of [[-6, -8], [6, -8], [-6, 8], [6, 8], [-12, 0], [12, 0]]) W.box(cx + dx, h + 1, cz + dz, cx + dx + 1, h + 4, cz + dz, B.PALE_BRICKS);
    for (const [dx, dz] of [[-13, -12], [13, -12], [-13, 12], [13, 12]]) { W.box(cx + dx - 1, h + 1, cz + dz - 1, cx + dx + 1, h + 2, cz + dz + 1, B.STONE_BRICKS); }
    W.box(cx - 1, h + 1, cz - 1, cx + 1, h + 1, cz + 1, B.OBSIDIAN);
    W.set(cx, h + 2, cz, B.PALE_ALTAR);
    // four arena wards on short plinths
    const devices = [[-9, -9], [9, -9], [-9, 9], [9, 9]].map(([dx, dz], i) => { W.set(cx + dx, h + 1, cz + dz, B.STONE_BRICKS); W.set(cx + dx, h + 2, cz + dz, B.ARENA_WARD); return { i, x: cx + dx, y: h + 2, z: cz + dz }; });
    for (const [dx, dz] of [[-15, -14], [15, -14], [-15, 14], [15, 14], [-3, -14], [3, -14]]) W.set(cx + dx, h + 1, cz + dz, B.TORCH);
    meta.citadel = { x: cx, y: h + 1, z: cz, x0, x1, z0, z1, altar: { x: cx, y: h + 2, z: cz }, devices, gate: { x: cx, y: h + 1, z: z0 - 1 } };
    meta.landmarks.push({ key: "citadel", ...L.citadel, r: 18 });
  }
  // places where he may stand and watch: ridges, beside ruins, between trees (each checked to be open ground)
  for (const [x, z] of [[-6, -52], [24, -20], [-24, -8], [56, 20], [18, 34], [-30, 40], [52, -52], [-58, -30], [-20, -64], [30, 56], [-36, 58], [62, -14]]) {
    const y = ground(x, z) + 1; W.box(x, y, z, x, y + 2, z, B.AIR); meta.watchPoints.push({ x: x + 0.5, y, z: z + 0.5 });
  }
  return { grid: W, meta };
}
// item ids used in chests (kept here so this file doesn't need the whole item table)
import { I } from "./blocks.js";
const I_BREAD = I.BREAD, I_STONE_SWORD = I.STONE_SWORD, I_STONE_PICK = I.STONE_PICK, I_APPLE = I.APPLE, I_COOKED_PORK = I.COOKED_PORK, I_ARROW = I.ARROW, I_BOW = I.BOW,
  I_IRON_INGOT = I.IRON_INGOT, I_GOLDEN_APPLE = I.GOLDEN_APPLE, I_SIGIL_HEARTH = I.SIGIL_HEARTH, I_SIGIL_STONE = I.SIGIL_STONE, I_SIGIL_ROOT = I.SIGIL_ROOT;

// ---------- checks run on the finished map (the build tool prints the results) ----------
export function validateForsaken(W, meta) {
  const report = [], ok = (pass, what) => report.push((pass ? "PASS " : "FAIL ") + what);
  const solid = (x, y, z) => { const id = W.id(x, y, z); return id && ![B.AIR, B.WATER, B.TORCH, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.DOOR, B.LAVA].includes(id); };
  const standable = (x, y, z) => solid(x, y - 1, z) && W.id(x, y - 1, z) !== B.LAVA && !solid(x, y, z) && !solid(x, y + 1, z) && W.id(x, y, z) !== B.LAVA && W.id(x, y + 1, z) !== B.LAVA;
  const a = meta.arrival, ax = Math.floor(a.x), az = Math.floor(a.z);
  ok(standable(ax, a.y, az), `arrival spot (${ax}, ${a.y}, ${az}) has floor and head room`);
  ok(Math.hypot(a.x - meta.wards[0].x, a.z - meta.wards[0].z) < meta.wards[0].r - 2, "arrival is inside the refuge ward");
  // walking search from the arrival (step up 1, drop up to 4, swim through water, open doors count as open)
  const seen = new Set(), key = (x, y, z) => x + "," + y + "," + z, queue = [[ax, a.y, az]];
  const passable = (x, y, z) => { const id = W.id(x, y, z); return !solid(x, y, z) || id === B.DOOR; };
  const canStand = (x, y, z) => (solid(x, y - 1, z) || W.id(x, y - 1, z) === B.WATER || W.id(x, y, z) === B.WATER) && passable(x, y, z) && passable(x, y + 1, z) && W.id(x, y, z) !== B.LAVA && W.id(x, y - 1, z) !== B.LAVA;
  seen.add(key(ax, a.y, az));
  while (queue.length) {
    const [x, y, z] = queue.shift();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const dy of [0, 1, -1, -2, -3, -4]) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (!W.inside(nx, ny, nz) || seen.has(key(nx, ny, nz))) continue;
      if (dy === 1 && (solid(x, y + 2, z))) continue;
      if (!canStand(nx, ny, nz)) continue;
      if (dy < 0) { let clear = true; for (let k = 0; k >= dy; k--) if (!passable(nx, y + k, nz) || !passable(nx, y + k + 1, nz)) clear = false; if (!clear) continue; }
      seen.add(key(nx, ny, nz)); queue.push([nx, ny, nz]); break;
    }
    // swimming straight up through water
    if (W.id(x, y, z) === B.WATER && !seen.has(key(x, y + 1, z)) && passable(x, y + 1, z) && passable(x, y + 2, z)) { seen.add(key(x, y + 1, z)); queue.push([x, y + 1, z]); }
  }
  const near = (t, r = 2) => { for (let dy = -1; dy <= 2; dy++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (seen.has(key(t.x + dx, t.y + dy, t.z + dz))) return true; return false; };
  for (const s of meta.shrines) ok(near({ x: s.x, y: s.y, z: s.z }), `${s.name} is reachable on foot`);
  for (const [k, slots] of Object.entries(meta.containers)) { const [x, y, z] = k.split(",").map(Number); const sig = slots.find(sl => [I.SIGIL_HEARTH, I.SIGIL_STONE, I.SIGIL_ROOT].includes(sl.id)); if (sig) ok(near({ x, y, z }), `chest with sigil ${sig.id} at ${k} is reachable`); }
  for (const [k, n] of Object.entries(meta.notes)) { const [x, y, z] = k.split(",").map(Number); ok(near({ x, y, z }), `note "${n}" at ${k} is reachable`); }
  ok(near(meta.citadel.altar), "the Pale Altar is reachable");
  for (const d of meta.citadel.devices) ok(near(d), `arena ward ${d.i} is reachable`);
  ok(near(meta.returnGate), "the Return Gate is reachable");
  ok(near(meta.towerTop), "the top of the Watchtower is reachable");
  ok(near({ x: meta.mine.shaft.x, y: meta.mine.shaft.top + 1, z: meta.mine.shaft.z }, 3), "the mine's escape shaft comes out on the surface");
  for (const sig of ["SIGIL_HEARTH", "SIGIL_STONE", "SIGIL_ROOT"]) ok(Object.values(meta.containers).some(sl => sl.some(q => q.id === I[sig])), `${sig} is placed in a chest`);
  ok(!solid(meta.citadel.gate.x, meta.citadel.gate.y, meta.citadel.gate.z + 1) && !solid(meta.citadel.gate.x, meta.citadel.gate.y + 1, meta.citadel.gate.z + 1), "the citadel gate isn't buried");
  ok(!solid(meta.mineEntrance.x - 3, meta.mineEntrance.y, meta.mineEntrance.z) && !solid(meta.mineEntrance.x - 3, meta.mineEntrance.y + 1, meta.mineEntrance.z), "the mine entrance isn't buried");
  for (const w of meta.watchPoints) ok(solid(Math.floor(w.x), w.y - 1, Math.floor(w.z)) && !solid(Math.floor(w.x), w.y, Math.floor(w.z)) && !solid(Math.floor(w.x), w.y + 1, Math.floor(w.z)), `watch point ${Math.floor(w.x)}, ${Math.floor(w.z)} is open ground`);
  report.push(`walkable spots found: ${seen.size}`); report.seen = seen;
  return report;
}

// ---------- packing: each chunk is stored as runs of (block, count) ----------
export function packForsaken(W, meta) {
  const chunks = [], n = CORE.size / CHUNK;
  for (let cz = 0; cz < n; cz++) for (let cx = 0; cx < n; cx++) {
    const out = [], data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    for (let y = 0; y < HEIGHT; y++) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) data[lx + lz * CHUNK + y * CHUNK * CHUNK] = W.get(CORE.min + cx * CHUNK + lx, y, CORE.min + cz * CHUNK + lz);
    let prev = data[0], run = 0;
    for (let i = 0; i < data.length; i++) { if (data[i] === prev && run < 65535) run++; else { out.push(prev, run); prev = data[i]; run = 1; } }
    out.push(prev, run);
    chunks.push(Uint16Array.from(out));
  }
  const head = new TextEncoder().encode(JSON.stringify(meta));
  const total = 8 + head.length + chunks.reduce((s, c) => s + 4 + c.length * 2, 0);
  const buf = new ArrayBuffer(total + (total % 2)), dv = new DataView(buf);
  let o = 0;
  dv.setUint32(o, 0x46575631, true); o += 4;   // "FWV1"
  dv.setUint32(o, head.length, true); o += 4;
  new Uint8Array(buf, o, head.length).set(head); o += head.length;
  for (const c of chunks) { dv.setUint32(o, c.length, true); o += 4; for (let i = 0; i < c.length; i++) { dv.setUint16(o, c[i], true); o += 2; } }
  return new Uint8Array(buf, 0, total);
}
export function unpackForsaken(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o = 0;
  if (dv.getUint32(o, true) !== 0x46575631) throw new Error("This isn't a Forsaken World map file.");
  o += 4;
  const hl = dv.getUint32(o, true); o += 4;
  const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes.buffer, bytes.byteOffset + o, hl))); o += hl;
  const n = meta.core.size / CHUNK, chunks = new Map();
  for (let cz = 0; cz < n; cz++) for (let cx = 0; cx < n; cx++) {
    const len = dv.getUint32(o, true); o += 4;
    const data = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    let p = 0;
    for (let k = 0; k < len; k += 2) { const v = dv.getUint16(o + k * 2, true), run = dv.getUint16(o + k * 2 + 2, true); data.fill(v, p, p + run); p += run; }
    o += len * 2;
    chunks.set((cx + meta.core.min / CHUNK) + "," + (cz + meta.core.min / CHUNK), data);
  }
  return { meta, chunks };
}
