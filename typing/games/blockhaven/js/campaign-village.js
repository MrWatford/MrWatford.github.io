// Legacy Village: the campaign's starting settlement (Milestone 13, Part B).
// Built at runtime into one 160 × 160 Surface stamp around the village's middle, the same way the Starter Home is,
// so it's identical every time the world opens and nothing natural (trees, ruins, villages) can draw over it.
// X runs east, Z runs south. The fountain is at (0, 0); the castle is to the north; the main gate is to the south.
// buildVillage(g, groundAt) returns { cells, info }:
//   g          the village's ground level (grass at y = g, you stand at g + 1)
//   groundAt   (X, Z) => natural ground height there, used to slope the edges into the land around the village
import { B, HEIGHT, SEA, make, TOP, HEAD, WET } from "./blocks.js";

export const VSIZE = 160, VC = 80;     // stamp size and its middle
export const VILLAGE_V = 1;            // raise only with a builder that keeps old campaign worlds the same
export const LEVEL = 60;               // leveled ground out to 60 blocks (a square), sloped out to 78
const KEEP = 65535, EDGE = 78;

// 5 × 7 letters for the floating sign ("#" = block)
const FONT = {
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"]
};
const SIDE = { s: 0, e: 1, n: 2, w: 3 };   // facing meta (0 = +z, 1 = +x, 2 = -z, 3 = -x)

export function buildVillage(g, groundAt) {
  const S = VSIZE, C = VC;
  const cells = new Uint16Array(S * S * HEIGHT).fill(KEEP);
  const info = { chests: [], signs: [], npcs: [], animals: [], crops: [], places: [], spawn: null };
  const inside = (X, y, Z) => X >= -C && Z >= -C && X < C && Z < C && y >= 1 && y < HEIGHT;
  const set = (X, y, Z, v) => { if (inside(X, y, Z)) cells[(C + X) + (C + Z) * S + y * S * S] = v; };
  const get = (X, y, Z) => (inside(X, y, Z) ? cells[(C + X) + (C + Z) * S + y * S * S] : KEEP);
  const box = (x0, y0, z0, x1, y1, z1, v) => {
    const [ax, bx] = x0 <= x1 ? [x0, x1] : [x1, x0], [ay, by] = y0 <= y1 ? [y0, y1] : [y1, y0], [az, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
    for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) set(x, y, z, typeof v === "function" ? v(x, y, z) : v);
  };
  const chest = (X, y, Z, face, loot, label) => { set(X, y, Z, make(B.CHEST, face)); info.chests.push({ X, y, Z, loot, label }); };
  const sign = (X, y, Z, face, text) => { set(X, y, Z, make(B.SIGN, face)); info.signs.push({ X, y, Z, text }); };
  const door = (X, y, Z, side) => { set(X, y, Z, make(B.DOOR, SIDE[side])); set(X, y + 1, Z, make(B.DOOR, SIDE[side] | TOP)); };
  const npc = (id, X, Z, y = g + 1) => info.npcs.push({ id, X, y, Z });
  const animal = (sp, X, Z, y = g + 1) => info.animals.push({ sp, X, y, Z });
  const place = (id, X, Z, r) => info.places.push({ id, X, Z, r });
  const bed = (X, y, Zfoot) => { set(X, y, Zfoot, make(B.BED, 2)); set(X, y, Zfoot - 1, make(B.BED, 2 | HEAD)); };   // head to the north
  const lamp =(X, Z, base = g) => { set(X, base + 1, Z, B.OAK_FENCE); set(X, base + 2, Z, B.OAK_FENCE); set(X, base + 3, Z, B.OAK_FENCE); set(X, base + 4, Z, B.TORCH); };

  // ---------- the ground: level inside, sloping into the natural land at the edges ----------
  for (let Z = -C; Z < C; Z++) for (let X = -C; X < C; X++) {
    const m = Math.max(Math.abs(X + 0.5), Math.abs(Z + 0.5));
    if (m <= LEVEL) { for (let y = Math.max(1, g - 10); y < HEIGHT; y++) set(X, y, Z, y < g - 4 ? B.STONE : y < g ? B.DIRT : y === g ? B.GRASS : B.AIR); continue; }
    if (m > EDGE) continue;
    const h = groundAt(X, Z);
    if (h < SEA) continue;   // water stays water
    const t = (m - LEVEL) / (EDGE - LEVEL), target = Math.round(g + (h - g) * t);
    for (let y = Math.max(1, target - 4); y <= target; y++) set(X, y, Z, y === target ? B.GRASS : B.DIRT);
    for (let y = target + 1; y <= Math.min(HEIGHT - 2, Math.max(h, g) + 8); y++) set(X, y, Z, B.AIR);
  }

  // ---------- building helpers ----------
  // A house: floor, walls with log corners, windows, a door, a flat ceiling, and a gable roof.
  function house(o) {
    const { x0, z0, x1, z1, h = 4, wall = B.PLANKS, corner = B.LOG, floor = B.PLANKS, roof = B.BRICKS, ridge = (x1 - x0 >= z1 - z0) ? "x" : "z", doorSide, doorAt, base = g } = o;
    box(x0, base, z0, x1, base, z1, floor);
    for (let y = base + 1; y <= base + h; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const ex = x === x0 || x === x1, ez = z === z0 || z === z1;
      if (!ex && !ez) { set(x, y, z, y === base + h ? B.PLANKS : B.AIR); continue; }
      set(x, y, z, (ex && ez) || y === base + h ? corner : wall);
    }
    // windows (two high) along each wall, skipping corners and the door
    const win = (x, z) => { set(x, base + 2, z, B.GLASS); set(x, base + 3, z, B.GLASS); };
    for (let x = x0 + 2; x <= x1 - 2; x += 3) { if (!(doorSide === "n" && Math.abs(x - doorAt) < 2)) win(x, z0); if (!(doorSide === "s" && Math.abs(x - doorAt) < 2)) win(x, z1); }
    for (let z = z0 + 2; z <= z1 - 2; z += 3) { if (!(doorSide === "w" && Math.abs(z - doorAt) < 2)) win(x0, z); if (!(doorSide === "e" && Math.abs(z - doorAt) < 2)) win(x1, z); }
    if (h < 4) for (const [x, z] of [[x0, z0], [x1, z1]]) set(x, base + 3, z, corner);
    // the door
    if (doorSide) {
      const [dx, dz] = doorSide === "n" ? [doorAt, z0] : doorSide === "s" ? [doorAt, z1] : doorSide === "w" ? [x0, doorAt] : [x1, doorAt];
      door(dx, base + 1, dz, doorSide);
      const [ox, oz] = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[doorSide];
      set(dx + ox, base, dz + oz, B.COBBLE);   // a doorstep
    }
    // ceiling lights
    set(Math.round((x0 + x1) / 2), base + h, Math.round((z0 + z1) / 2), B.SHINESTONE);
    // the roof
    if (ridge === "x") for (let k = 0; ; k++) {
      const za = z0 - 1 + k, zb = z1 + 1 - k, y = base + h + 1 + k; if (za > zb || y >= HEIGHT - 1) break;
      for (let z = za; z <= zb; z++) for (let x = x0 - 1; x <= x1 + 1; x++) {
        if (z === za || z === zb) set(x, y, z, roof);
        else if (x === x0 || x === x1) set(x, y, z, wall);
        else if (x > x0 && x < x1) set(x, y, z, B.AIR);
      }
    } else for (let k = 0; ; k++) {
      const xa = x0 - 1 + k, xb = x1 + 1 - k, y = base + h + 1 + k; if (xa > xb || y >= HEIGHT - 1) break;
      for (let x = xa; x <= xb; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
        if (x === xa || x === xb) set(x, y, z, roof);
        else if (z === z0 || z === z1) set(x, y, z, wall);
        else if (z > z0 && z < z1) set(x, y, z, B.AIR);
      }
    }
  }
  // A spiral stair up the inside ring of a tower. ring = cells in walking order; the first cell is the way in.
  // Step i is a column up to y = base + i; the top floor at base + h has holes over the last three steps.
  function spiral(ring, base, h, fill) {
    for (let i = 1; i < h; i++) { const [x, z] = ring[i % ring.length]; box(x, i < ring.length ? base + 1 : base + i, z, x, base + i, z, fill); }
    const holes = new Set();
    for (let i = Math.max(1, h - 3); i < h; i++) holes.add(ring[i % ring.length].join(","));
    return holes;
  }
  // A square tower (size odd, at least 7) with a stair inside and a crenellated top
  function squareTower(cx, cz, size, h, wall, doorSide, off = 0) {
    const r = (size - 1) / 2;
    box(cx - r, g, cz - r, cx + r, g, cz + r, B.STONE_BRICKS);
    for (let y = g + 1; y <= g + h; y++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const edge = Math.abs(dx) === r || Math.abs(dz) === r;
      set(cx + dx, y, cz + dz, edge ? wall : Math.abs(dx) <= r - 2 && Math.abs(dz) <= r - 2 ? B.STONE_BRICKS : B.AIR);
    }
    // the ring of walkable cells between the wall and the middle pillar, starting beside the door
    const q = r - 1, ring = [];
    for (let x = -q; x < q; x++) ring.push([x, -q]);
    for (let z = -q; z < q; z++) ring.push([q, z]);
    for (let x = q; x > -q; x--) ring.push([x, q]);
    for (let z = q; z > -q; z--) ring.push([-q, z]);
    const o = Math.max(-q, Math.min(q, off)), startAt = { s: [o, q], n: [o, -q], e: [q, o], w: [-q, o] }[doorSide];
    const s0 = ring.findIndex(c => c[0] === startAt[0] && c[1] === startAt[1]);
    const order = ring.slice(s0).concat(ring.slice(0, s0)).map(([x, z]) => [cx + x, cz + z]);
    const holes = spiral(order, g, h, B.STONE_BRICKS);
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const x = cx + dx, z = cz + dz;
      if (!holes.has(x + "," + z) || Math.abs(dx) === r || Math.abs(dz) === r) set(x, g + h, z, B.STONE_BRICKS);
      else set(x, g + h, z, B.AIR);
      if ((Math.abs(dx) === r || Math.abs(dz) === r) && (dx + dz) % 2 === 0) set(x, g + h + 1, z, wall);
    }
    for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) set(cx + dx, g + h + 2, cz + dz, B.TORCH);
    // windows (arrow slits) and the door
    for (let y = g + 4; y < g + h - 1; y += 4) for (const [dx, dz] of [[0, -r], [0, r], [-r, 0], [r, 0]]) set(cx + dx, y, cz + dz, B.GLASS);
    const [dx, dz] = { s: [o, r], n: [o, -r], e: [r, o], w: [-r, o] }[doorSide];
    door(cx + dx, g + 1, cz + dz, doorSide);
  }
  // A round tower (radius 4–6): spiral stair against the wall, a crenellated platform on top
  function roundTower(cx, cz, rad, h, wall, band, doorSide) {
    const ring = [];
    for (let dz = -rad - 1; dz <= rad + 1; dz++) for (let dx = -rad - 1; dx <= rad + 1; dx++) {
      const d = Math.hypot(dx, dz), x = cx + dx, z = cz + dz;
      if (d > rad + 0.5) continue;
      set(x, g, z, B.STONE_BRICKS);
      for (let y = g + 1; y <= g + h; y++) {
        if (d > rad - 0.5) set(x, y, z, (y - g) % 6 === 2 || (y - g) % 6 === 3 ? band : wall);
        else if (d < rad - 2.5) set(x, y, z, B.AIR);
        else set(x, y, z, B.AIR);
      }
      if (d <= rad - 0.5 && d >= rad - 1.5) ring.push([dx, dz, Math.atan2(dz, dx)]);
    }
    // walk a 4-connected loop around the band, always turning the same way, starting by the door
    const want = { s: Math.PI / 2, n: -Math.PI / 2, e: 0, w: Math.PI }[doorSide], bandMap = new Map(ring.map(c => [c[0] + "," + c[1], c]));
    const adv = (a, b) => { let d = b - a; while (d <= 0) d += Math.PI * 2; return d; };
    const off = c => Math.abs(Math.atan2(Math.sin(c[2] - want), Math.cos(c[2] - want)));
    let cur = ring.reduce((b, c) => (off(c) < off(b) || (off(c) === off(b) && Math.hypot(c[0], c[1]) > Math.hypot(b[0], b[1])) ? c : b));
    const seen = new Set(), order = [];
    while (cur && !seen.has(cur[0] + "," + cur[1])) {
      seen.add(cur[0] + "," + cur[1]); order.push([cx + cur[0], cz + cur[1]]);
      let next = null;
      for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = bandMap.get((cur[0] + ax) + "," + (cur[1] + az));
        if (n && !seen.has(n[0] + "," + n[1]) && adv(cur[2], n[2]) < Math.PI / 2 && (!next || adv(cur[2], n[2]) < adv(cur[2], next[2]))) next = n;
      }
      cur = next;
    }
    const holes = spiral(order, g, h, wall);
    for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
      const d = Math.hypot(dx, dz), x = cx + dx, z = cz + dz;
      if (d > rad + 0.5) continue;
      set(x, g + h, z, holes.has(x + "," + z) && d <= rad - 0.5 ? B.AIR : B.STONE_BRICKS);
      if (d > rad - 0.5 && (dx + dz) % 2 === 0) set(x, g + h + 1, z, wall);
    }
    const [dx, dz] = { s: [0, rad], n: [0, -rad], e: [rad, 0], w: [-rad, 0] }[doorSide];
    door(cx + dx, g + 1, cz + dz, doorSide);
    return { ring: order };
  }
  function tree(X, Z, hgt = 5) {
    for (let y = g + 1; y <= g + hgt; y++) set(X, y, Z, B.LOG);
    for (let dy = -2; dy <= 1; dy++) {
      const r = dy >= 0 ? 1 : 2;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r && Math.abs(dz) === r && r === 2) continue;
        const y = g + hgt + dy;
        if (get(X + dx, y, Z + dz) === B.AIR) set(X + dx, y, Z + dz, B.LEAVES);
      }
    }
    set(X, g + hgt + 2, Z, B.LEAVES);
  }

  // ---------- roads, the plaza, and the fountain ----------
  const road = (x0, z0, x1, z1) => box(x0, g, z0, x1, g, z1, (x, y, z) => ((x + z) % 7 === 0 ? B.COBBLE : B.GRAVEL));
  road(-2, 11, 2, 51);       // main gate to the plaza
  road(-2, -20, 2, -11);     // plaza to the castle gate
  road(-51, -2, -11, 2);     // west gate to the plaza
  road(11, -2, 51, 2);       // east gate to the plaza
  for (let Z = -12; Z <= 12; Z++) for (let X = -12; X <= 12; X++) {
    const d = Math.hypot(X, Z);
    if (d > 11.5) continue;
    set(X, g, Z, d > 10.5 ? B.STONE_BRICKS : Math.round(d) % 3 === 0 ? B.COBBLE : B.STONE_BRICKS);
  }
  // fountain: a round basin with a slim middle column and water on top (low enough to see the castle over it)
  for (let Z = -4; Z <= 4; Z++) for (let X = -4; X <= 4; X++) {
    const d = Math.hypot(X, Z);
    if (d > 4.5) continue;
    if (d > 3.5) { set(X, g + 1, Z, B.STONE_BRICKS); set(X, g, Z, B.STONE_BRICKS); }
    else { set(X, g, Z, B.WATER); set(X, g - 1, Z, B.STONE_BRICKS); }
  }
  box(0, g, 0, 0, g + 2, 0, B.STONE_BRICKS); set(0, g + 3, 0, B.WATER);
  for (const [X, Z] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) set(X, g + 1, Z, B.SHINESTONE);
  info.spawn = { X: 0, y: g + 1, Z: 10, yaw: 0 };   // on the plaza, south of the fountain, looking north at the castle
  place("plaza", 0, 0, 11);
  sign(-3, g + 1, 9, 0, "Legacy Village\n\nWelcome, traveler! The castle stands to the north. Elder Maren waits by the fountain.");
  // market stalls on the plaza's corners
  const stall = (cx, cz, face, roofV) => {
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(cx + dx, g + 1, cz + dz, cx + dx, g + 2, cz + dz, B.OAK_FENCE);
    box(cx - 1, g + 3, cz - 1, cx + 1, g + 3, cz + 1, (x, y, z) => ((x + z) % 2 ? roofV : B.WOOL));
    const [fx, fz] = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[face];
    set(cx + fx, g + 1, cz + fz, B.PLANKS); set(cx + fx - fz, g + 1, cz + fz - fx, B.PLANKS); set(cx + fx + fz, g + 1, cz + fz + fx, B.PLANKS);
  };
  stall(-8, -7, "e", B.BLACK_WOOL); stall(8, -7, "w", B.BLACK_WOOL); stall(-8, 7, "e", B.WOOL); stall(8, 7, "w", B.WOOL);
  set(-9, g + 1, -7, B.HAY); set(9, g + 1, -7, B.HAY); set(-9, g + 1, 7, make(B.CHEST, 1)); set(9, g + 1, 7, make(B.CHEST, 3));
  info.chests.push({ X: -9, y: g + 1, Z: 7, loot: "market", label: "Market Crate" }, { X: 9, y: g + 1, Z: 7, loot: "market2", label: "Market Crate" });
  place("market", 8, 7, 4);
  // lamp posts along the roads
  for (let Z = 14; Z <= 48; Z += 8) { lamp(-4, Z); lamp(4, Z); }
  for (let X = 14; X <= 48; X += 8) { if (X > 22) lamp(X, -4); lamp(X, 4); lamp(-X, -4); lamp(-X, 4); }
  lamp(-4, -17); lamp(4, -17);
  for (const a of [0.4, 1.2, 2, 2.8, 3.6, 4.4, 5.2, 6]) lamp(Math.round(Math.cos(a) * 12.5), Math.round(Math.sin(a) * 12.5));

  // ---------- the canal and its bridges ----------
  box(-50, g - 2, -14, 50, g - 2, -12, B.STONE);
  box(-50, g - 1, -14, 50, g, -12, B.WATER);
  box(-50, g, -15, 50, g, -15, B.STONE_BRICKS); box(-50, g, -11, 50, g, -11, B.STONE_BRICKS);
  const bridge = (x0, x1) => {
    box(x0, g, -15, x1, g, -11, B.PLANKS); box(x0, g - 1, -14, x1, g - 1, -12, B.AIR);   // a little arch of air under the deck
    box(x0, g - 1, -15, x0, g - 1, -11, B.LOG); box(x1, g - 1, -15, x1, g - 1, -11, B.LOG);
    box(x0 - 1, g + 1, -14, x0 - 1, g + 1, -12, B.OAK_FENCE); box(x1 + 1, g + 1, -14, x1 + 1, g + 1, -12, B.OAK_FENCE);
    box(x0 - 1, g, -14, x0 - 1, g, -12, B.STONE_BRICKS); box(x1 + 1, g, -14, x1 + 1, g, -12, B.STONE_BRICKS);
  };
  bridge(-2, 2); bridge(-31, -29); bridge(29, 31);
  box(-31, g, -10, -29, g, -3, B.GRAVEL); box(29, g, -10, 31, g, -3, B.GRAVEL);

  // ---------- the village walls, gates, and four watchtowers ----------
  const W = 52;
  for (let i = -W; i <= W; i++) for (const [x, z, side] of [[i, W, "s"], [i, W - 1, "s"], [i, -W, "n"], [i, -W + 1, "n"], [W, i, "e"], [W - 1, i, "e"], [-W, i, "w"], [-W + 1, i, "w"]]) {
    if (side === "n" && Math.abs(x) <= 27) continue;   // the castle closes the north side
    const outer = Math.abs(x) === W || Math.abs(z) === W;
    for (let y = g + 1; y <= g + 6; y++) set(x, y, z, y === g + 6 ? B.STONE_BRICKS : B.COBBLE);
    if (outer && (i % 2 === 0)) set(x, g + 7, z, B.COBBLE);
  }
  const gate = (xa, za, xb, zb) => { box(xa, g + 1, za, xb, g + 4, zb, B.AIR); };
  gate(-2, W - 1, 2, W); gate(W - 1, -2, W, 2); gate(-W, -2, -W + 1, 2);
  for (const X of [-3, 3]) { box(X, g + 1, W - 1, X, g + 8, W, B.STONE_BRICKS); set(X, g + 9, W, B.TORCH); }
  for (const Z of [-3, 3]) { box(W - 1, g + 1, Z, W, g + 8, Z, B.STONE_BRICKS); box(-W + 1, g + 1, Z, -W, g + 8, Z, B.STONE_BRICKS); set(W, g + 9, Z, B.TORCH); set(-W, g + 9, Z, B.TORCH); }
  squareTower(-W, W, 7, 16, B.COBBLE, "e", -2); squareTower(W, W, 7, 16, B.COBBLE, "w", -2);
  squareTower(-W, -W, 7, 16, B.COBBLE, "e", 2); squareTower(W, -W, 7, 16, B.COBBLE, "w", 2);
  place("watchSW", -W, W, 5); place("watchSE", W, W, 5); place("watchNW", -W, -W, 5); place("watchNE", W, -W, 5);
  sign(-2, g + 1, W + 1, 0, "Legacy Village\n\nThe south gate. The fountain and Elder Maren are straight ahead.");

  // ---------- the castle ----------
  const CX0 = -24, CX1 = 24, CZ0 = -50, CZ1 = -20;
  box(CX0, g, CZ0, CX1, g, CZ1, B.GRASS);
  // curtain walls, two blocks thick, with a walkway and battlements
  for (let z = CZ0; z <= CZ1; z++) for (let x = CX0; x <= CX1; x++) {
    const ring = Math.min(x - CX0, CX1 - x, z - CZ0, CZ1 - z);
    if (ring > 1) continue;
    for (let y = g + 1; y <= g + 10; y++) set(x, y, z, y === g + 1 || y === g + 10 ? B.STONE_BRICKS : (x * 3 + z + y) % 11 === 0 ? B.MOSSY : B.STONE_BRICKS);
    if (ring === 0 && (x + z) % 2 === 0) set(x, g + 11, z, B.STONE_BRICKS);
  }
  // the gatehouse (with a road through it) and the gate towers on both sides
  box(-2, g + 1, CZ1 - 1, 2, g + 6, CZ1, B.AIR); box(-1, g + 7, CZ1 - 1, 1, g + 7, CZ1, B.AIR);
  box(-2, g, CZ1 - 1, 2, g, CZ1, B.STONE_BRICKS);
  for (const s of [-1, 1]) {
    box(s * 3, g + 1, CZ1 - 2, s * 7, g + 14, CZ1 + 2, (x, y, z) => (Math.abs(x) === 3 || Math.abs(x) === 7 || z === CZ1 - 2 || z === CZ1 + 2 || y === g + 14 ? B.STONE_BRICKS : B.AIR));
    for (let x = 3; x <= 7; x++) for (const z of [CZ1 - 2, CZ1 + 2]) if (x % 2) set(s * x, g + 15, z, B.STONE_BRICKS);
    set(s * 5, g + 9, CZ1 + 2, B.GLASS); set(s * 5, g + 12, CZ1 + 2, B.GLASS);
    set(s * 4, g + 7, CZ1 + 3, B.TORCH);
  }
  place("castleGate", 0, CZ1, 5);
  // corner towers
  squareTower(CX0, CZ1, 7, 16, B.STONE_BRICKS, "e", -2); squareTower(CX1, CZ1, 7, 16, B.STONE_BRICKS, "w", -2);
  squareTower(CX0, CZ0, 7, 16, B.STONE_BRICKS, "e", 2); squareTower(CX1, CZ0, 7, 16, B.STONE_BRICKS, "w", 2);
  // the courtyard: a path, gardens, and two great statues
  box(-2, g, -31, 2, g, -22, B.STONE_BRICKS);
  for (const s of [-1, 1]) for (let z = -30; z <= -23; z += 2) { set(s * 4, g + 1, z, B.FLOWER_RED); set(s * 5, g + 1, z + 1, B.FLOWER_YELLOW); }
  const statue = (x, z) => {
    box(x - 2, g + 1, z - 2, x + 2, g + 1, z + 2, B.STONE_BRICKS);
    box(x - 1, g + 2, z, x - 1, g + 5, z, B.COBBLE); box(x + 1, g + 2, z, x + 1, g + 5, z, B.COBBLE);
    box(x - 1, g + 6, z - 1, x + 1, g + 9, z, B.STONE);
    box(x - 2, g + 6, z, x - 2, g + 9, z, B.STONE); box(x + 2, g + 6, z, x + 2, g + 9, z, B.STONE);
    box(x - 1, g + 10, z - 1, x + 1, g + 12, z + 1, B.STONE); set(x, g + 11, z + 1, B.COBBLE);
    box(x - 1, g + 13, z - 1, x + 1, g + 13, z + 1, B.IRON_BLOCK);
    box(x + 3, g + 2, z + 1, x + 3, g + 12, z + 1, B.IRON_BLOCK); box(x + 2, g + 9, z + 1, x + 4, g + 9, z + 1, B.GOLD_BLOCK);   // the sword
    box(x - 3, g + 5, z, x - 3, g + 9, z + 1, B.PLANKS);                                                                         // the shield
  };
  statue(-11, -26); statue(11, -26);
  sign(-3, g + 1, -22, 0, "The Builders' Guard\n\nTwo stone knights watch the castle gate, as they have since the days of the First Builders.");
  sign(4, g + 1, -26, 0, "Castle Courtyard\n\nThe Great Hall is ahead. The towers in each corner have stairs to the top.");
  // the keep: Great Hall below, royal chambers above, a flat roof with a dome
  const KX0 = -14, KX1 = 14, KZ0 = -47, KZ1 = -32;
  box(KX0, g, KZ0, KX1, g, KZ1, B.STONE_BRICKS);
  for (let y = g + 1; y <= g + 16; y++) for (let z = KZ0; z <= KZ1; z++) for (let x = KX0; x <= KX1; x++) {
    const edge = x === KX0 || x === KX1 || z === KZ0 || z === KZ1;
    set(x, y, z, edge || y === g + 8 || y === g + 16 ? B.STONE_BRICKS : B.AIR);
  }
  for (let x = KX0; x <= KX1; x += 2) { set(x, g + 17, KZ0, B.STONE_BRICKS); set(x, g + 17, KZ1, B.STONE_BRICKS); }
  for (let z = KZ0; z <= KZ1; z += 2) { set(KX0, g + 17, z, B.STONE_BRICKS); set(KX1, g + 17, z, B.STONE_BRICKS); }
  for (let k = 0; k < 4; k++) box(-3 + k, g + 17 + k, -43 + k, 3 - k, g + 17 + k, -37 - k, k === 3 ? B.GOLD_BLOCK : B.STONE_BRICKS);   // the dome
  // windows on both floors
  for (let x = KX0 + 2; x <= KX1 - 2; x += 3) for (const y of [g + 3, g + 4, g + 5, g + 11, g + 12, g + 13]) { if (Math.abs(x) > 2) set(x, y, KZ1, B.GLASS); set(x, y, KZ0, B.GLASS); }
  for (let z = KZ0 + 2; z <= KZ1 - 2; z += 3) for (const y of [g + 3, g + 4, g + 11, g + 12]) { set(KX0, y, z, B.GLASS); set(KX1, y, z, B.GLASS); }
  // the main doors (three wide, open archway with two doors)
  box(-1, g + 1, KZ1, 1, g + 4, KZ1, B.AIR); door(-1, g + 1, KZ1, "s"); door(1, g + 1, KZ1, "s");
  set(-2, g + 3, KZ1 + 1, B.TORCH); set(2, g + 3, KZ1 + 1, B.TORCH);
  // Great Hall: pillars, a carpet, banquet tables, chandeliers, the throne
  for (let z = -44; z <= -35; z += 3) for (const x of [-8, 8]) box(x, g + 1, z, x, g + 7, z, B.LOG);
  box(-1, g, -45, 1, g, -33, B.WOOL);
  for (const x of [-5, 5]) { box(x, g + 1, -42, x, g + 1, -36, B.PLANKS); for (let z = -42; z <= -36; z += 2) { set(x - 1, g + 1, z, B.OAK_FENCE); set(x + 1, g + 1, z, B.OAK_FENCE); } }
  for (const [x, z] of [[-4, -39], [4, -39], [-11, -43], [11, -43], [-11, -36], [11, -36]]) { set(x, g + 7, z, B.OAK_FENCE); set(x, g + 6, z, B.SHINESTONE); }
  box(-4, g + 1, -46, 4, g + 1, -44, B.STONE_BRICKS);                          // the dais
  set(0, g + 2, -45, B.GOLD_BLOCK); box(0, g + 2, -46, 0, g + 4, -46, B.GOLD_BLOCK); set(-1, g + 2, -45, B.WOOL); set(1, g + 2, -45, B.WOOL);   // the throne
  for (const x of [-3, 3]) { set(x, g + 2, -46, B.OAK_FENCE); set(x, g + 3, -46, B.TORCH); }
  for (const x of [-12, -10, 10, 12]) box(x, g + 2, KZ0 + 1, x, g + 6, KZ0 + 1, x % 4 ? B.WOOL : B.BLACK_WOOL);   // banners
  box(KX1 - 1, g + 1, -41, KX1 - 1, g + 3, -38, B.COBBLE); box(KX1 - 1, g + 1, -40, KX1 - 1, g + 2, -39, B.SHINESTONE);   // the hearth
  sign(-3, g + 2, -44, 0, "The Throne of Legacy\n\nNo king has sat here for a very long time. The Elder says the old king loved his books more than his gold.");
  place("throne", 0, -44, 5);
  // stairs up the west wall to the royal chambers, and up the east wall to the roof
  for (let k = 1; k <= 8; k++) { box(KX0 + 1, g + 1, -33 - k, KX0 + 2, g + k, -33 - k, B.STONE_BRICKS); }
  box(KX0 + 1, g + 8, -40, KX0 + 2, g + 8, -34, B.AIR);
  for (let z = -40; z <= -34; z++) set(KX0 + 3, g + 9, z, B.OAK_FENCE);
  for (let k = 1; k <= 8; k++) { box(KX1 - 2, g + 9, -33 - k, KX1 - 1, g + 8 + k, -33 - k, B.STONE_BRICKS); }
  box(KX1 - 2, g + 16, -40, KX1 - 1, g + 16, -34, B.AIR);
  for (let z = -40; z <= -34; z++) set(KX1 - 3, g + 17, z, B.OAK_FENCE);
  // the royal chambers: floor of planks, a bedroom, the armory, a study
  box(KX0 + 3, g + 8, KZ0 + 1, KX1 - 3, g + 8, KZ1 - 1, B.PLANKS);
  box(-2, g + 9, KZ0 + 1, -2, g + 15, KZ1 - 1, (x, y, z) => (z === -40 && y <= g + 10 ? B.AIR : B.STONE_BRICKS));   // a wall between the study and the bedroom, with a doorway
  set(-2, g + 11, -40, B.STONE_BRICKS);
  bed(-6, g + 9, -45); bed(-8, g + 9, -45);
  chest(-10, g + 9, -46, 0, "armory", "Castle Armory");
  chest(-4, g + 9, -46, 0, "royal", "Royal Chest");
  for (let x = 0; x <= 11; x++) if (x !== 6) { set(x, g + 9, KZ0 + 1, B.BOOKSHELF); set(x, g + 10, KZ0 + 1, B.BOOKSHELF); }
  box(3, g + 9, -42, 7, g + 9, -42, B.PLANKS); set(5, g + 9, -41, B.MAP_TABLE);
  for (const [x, z] of [[-7, -40], [6, -40]]) { set(x, g + 15, z, B.SHINESTONE); }
  sign(6, g + 9, -46 + 1, 0, "The Royal Study\n\nThe First Builders drew the first maps of Blockhaven at this table. The Expedition Table gives a fresh map to anyone who has lost theirs.");
  // the secret vault: one bookshelf in the Great Hall's back wall slides out of the way if you break it
  box(2, g - 9, -49, 15, g - 1, -40, B.STONE_BRICKS);
  set(3, g + 1, KZ0, B.BOOKSHELF); set(3, g + 2, KZ0, B.BOOKSHELF);
  box(3, g + 1, KZ0 - 1, 3, g + 3, KZ0 - 1, B.AIR);
  for (const X of [-15, 15]) box(X, g + 1, KZ0 - 1, X, g + 9, KZ0 - 1, B.STONE_BRICKS);   // close the gap behind the keep at both ends
  for (let k = 1; k <= 8; k++) { set(3 + k, g - k, KZ0 - 1, B.STONE_BRICKS); box(3 + k, g - k + 1, KZ0 - 1, 3 + k, g - k + 3, KZ0 - 1, B.AIR); }
  box(11, g - 7, -47, 11, g - 5, -47, B.AIR);
  box(5, g - 8, -46, 13, g - 8, -41, B.STONE_BRICKS); box(5, g - 7, -46, 13, g - 4, -41, B.AIR);
  for (const [x, z] of [[6, -45], [12, -45], [6, -42], [12, -42]]) set(x, g - 4, z, B.SHINESTONE);
  chest(9, g - 7, -41, 2, "vault", "The King's Vault");
  set(9, g - 7, -46, B.GOLD_BLOCK); set(8, g - 7, -46, B.GOLD_BLOCK); set(10, g - 7, -46, B.GOLD_BLOCK);
  sign(7, g - 7, -41, 2, "The King's Vault\n\nYou found the secret! The First Builders hid eight Relics to seal away a danger older than this kingdom. This vault once held a map to the first of them. It is gone now, but the king's gold remains.");
  place("vault", 9, -44, 3);
  place("castle", 0, -40, 14);

  // ---------- the floating BLOCKHAVEN sign, high above the castle ----------
  const word = "BLOCKHAVEN", top = Math.min(HEIGHT - 4, g + 27), base = top - 6, x0 = -Math.floor((word.length * 6 - 1) / 2), ZS = -30;
  const lit = new Set();
  [...word].forEach((ch, i) => FONT[ch].forEach((row, r) => [...row].forEach((c, k) => { if (c === "#") lit.add((x0 + i * 6 + k) + "," + (top - r)); })));
  for (const key of lit) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const [x, y] = key.split(",").map(Number), nk = (x + dx) + "," + (y + dy);
    if (!lit.has(nk)) set(x + dx, y + dy, ZS, B.BLACK_WOOL);
    set(x + dx, y + dy, ZS - 1, B.BLACK_WOOL);
  }
  for (const key of lit) { const [x, y] = key.split(",").map(Number); set(x, y, ZS, B.STONE); }
  info.signY = base;

  // ---------- the tutorial grove and the tutorial pavilion (just north of the plaza) ----------
  tree(-22, -6); tree(-15, -8, 6); tree(-9, -5); tree(-26, -9, 4);
  for (let x = -27; x <= -6; x += 3) set(x, g + 1, -10, B.TALL_GRASS);
  sign(-12, g + 1, -3, 0, "Tutorial Grove\n\nHold the left mouse button on a tree trunk to chop it. Wood is the first thing every builder needs.");
  place("grove", -16, -7, 8);
  box(7, g, -10, 21, g, -4, B.STONE_BRICKS);
  for (const [x, z] of [[7, -10], [14, -10], [21, -10], [7, -4], [14, -4], [21, -4]]) box(x, g + 1, z, x, g + 4, z, B.LOG);
  box(7, g + 5, -10, 21, g + 5, -4, B.PLANKS); box(8, g + 6, -9, 20, g + 6, -5, B.BRICKS);
  for (const [x, z] of [[10, -7], [18, -7]]) set(x, g + 4, z, B.SHINESTONE);
  set(9, g + 1, -9, B.TABLE); set(11, g + 1, -9, make(B.FURNACE, 0)); chest(13, g + 1, -9, 0, "tutorial", "Tutorial Supplies");
  set(15, g + 1, -9, B.COMPOSTER); set(17, g + 1, -9, B.HAY);
  sign(9, g + 1, -5, 0, "Crafting Table\n\nRight-click it to craft bigger things: tools, weapons, and furniture. Press E for your inventory and quick crafting.");
  sign(12, g + 1, -5, 0, "Furnace\n\nPut coal (or wood) in the bottom slot and ore or raw food on top. Smelted items come out on the right.");
  sign(15, g + 1, -5, 0, "Supplies\n\nThe chest beside the furnace has food, torches, and coal to get you started. Take what you need!");
  // a little stone outcrop to mine
  box(22, g + 1, -9, 25, g + 1, -5, B.STONE); box(23, g + 2, -8, 24, g + 2, -6, B.STONE);
  set(23, g + 1, -9, B.COAL_ORE); set(25, g + 1, -6, B.COAL_ORE); set(24, g + 2, -7, B.IRON_ORE); set(22, g + 1, -5, B.COAL_ORE);
  place("pavilion", 14, -7, 7);

  // ---------- the blacksmith ----------
  house({ x0: -24, z0: 5, x1: -12, z1: 15, h: 5, wall: B.COBBLE, corner: B.LOG, floor: B.COBBLE, roof: B.BRICKS, doorSide: "n", doorAt: -18 });
  for (const x of [-22, -21, -20]) set(x, g + 1, 14, make(B.FURNACE, 2));
  set(-15, g + 1, 13, B.SMITH_TABLE); set(-14, g + 1, 13, B.TABLE);
  chest(-23, g + 1, 13, 1, "smith", "Blacksmith's Stock");
  box(-23, g, 7, -22, g, 8, B.LAVA); box(-23, g + 1, 7, -22, g + 1, 8, B.GLASS);   // the forge pit, safely under glass
  box(-17, g + 1, 14, -13, g + 1, 14, B.IRON_BLOCK);
  sign(-19, g + 1, 4, 2, "Garrick's Forge\n\nTools, armor, and honest advice. Ask Smith Garrick about the Smithing Anvil.");
  npc("smith", -18, 10); place("smithy", -18, 10, 7);

  // ---------- the library (with a hidden archive under the floor) ----------
  house({ x0: 12, z0: 5, x1: 24, z1: 17, h: 6, wall: B.STONE_BRICKS, corner: B.BIRCH_LOG, floor: B.BIRCH_PLANKS, roof: B.BRICKS, doorSide: "n", doorAt: 18 });
  for (let z = 7; z <= 16; z++) for (const x of [13, 23]) if (z !== 11) { set(x, g + 1, z, B.BOOKSHELF); set(x, g + 2, z, B.BOOKSHELF); set(x, g + 3, z, B.BOOKSHELF); }
  for (let x = 14; x <= 22; x++) { set(x, g + 1, 16, B.BOOKSHELF); set(x, g + 2, 16, B.BOOKSHELF); }
  box(16, g + 1, 10, 20, g + 1, 11, B.BIRCH_PLANKS); set(18, g + 2, 10, B.SHINESTONE);
  set(15, g + 1, 13, B.MAP_TABLE);
  sign(16, g + 1, 8, 0, "Library\n\nHistories of Blockhaven, the First Builders, and the eight lost Relics. Librarian Odessa keeps the lore books.");
  sign(20, g + 2, 11, 0, "A torn page\n\n\"...the First Builders shaped kingdoms of stone and sky. When their greatest work went wrong, they split their power into eight Relics and hid them where only the brave would look.\"");
  sign(14, g + 1, 15, 3, "An old note\n\n\"Not every secret is behind a wall. Some are under your feet. Check the corner by the door.\"");
  // the trapdoor and the stairs down
  set(22, g, 7, make(B.OAK_TRAPDOOR, 0)); set(21, g, 7, make(B.OAK_TRAPDOOR, 0));
  box(12, g - 9, 5, 24, g - 1, 17, B.STONE_BRICKS);
  // a short drop through the trapdoor, then steps down (each one low enough that your head clears the floor above)
  for (let k = 0; k <= 4; k++) { const z = 7 + k; box(21, g - 3 - k, z, 22, g - 3 - k, z, B.STONE_BRICKS); box(21, g - 2 - k, z, 22, Math.min(g - 1, g - k), z, B.AIR); }
  box(13, g - 6, 8, 20, g - 3, 16, B.AIR); box(21, g - 6, 12, 22, g - 3, 16, B.AIR);
  for (let z = 8; z <= 16; z += 2) { set(13, g - 6, z, B.BOOKSHELF); set(13, g - 5, z, B.BOOKSHELF); }
  set(16, g - 3, 12, B.SHINESTONE); set(20, g - 3, 14, B.SHINESTONE);
  chest(14, g - 6, 15, 1, "archive", "Forgotten Archive");
  sign(17, g - 6, 16, 2, "The Forgotten Archive\n\nThese shelves hold the oldest maps in the kingdom. One shows a desert with a great pyramid, and the words: \"The first Relic sleeps beneath the sand.\"");
  npc("librarian", 18, 13); place("library", 18, 11, 7); place("archive", 17, 12, 4);

  // ---------- the enchanting tower ----------
  roundTower(34, 12, 5, 20, B.STONE_BRICKS, B.BOOKSHELF, "w");
  set(34, g + 1, 12, B.OBSIDIAN); set(34, g + 2, 12, B.SHINESTONE);
  sign(31, g + 1, 12, 3, "The Enchanting Tower\n\nThe old enchanters studied here. Enchanting tables are not part of Blockhaven yet, but the view from the top is worth the climb.");
  place("tower", 34, 12, 6);

  // ---------- the barn and the animal pen ----------
  house({ x0: -50, z0: 5, x1: -38, z1: 17, h: 5, wall: B.PLANKS, corner: B.LOG, floor: B.DIRT, roof: B.BRICKS, ridge: "z", doorSide: null });
  box(-45, g + 1, 17, -43, g + 3, 17, B.AIR);
  for (const [x, z] of [[-49, 6], [-49, 7], [-48, 6], [-39, 6], [-39, 7], [-49, 16]]) set(x, g + 1, z, B.HAY);
  set(-48, g + 2, 6, B.HAY); set(-40, g + 1, 6, B.COMPOSTER);
  chest(-39, g + 1, 16, 3, "barn", "Barn Supplies");
  for (let x = -50; x <= -38; x++) for (const z of [28]) set(x, g + 1, z, B.OAK_FENCE);
  for (let z = 18; z <= 28; z++) { set(-50, g + 1, z, B.OAK_FENCE); set(-38, g + 1, z, z === 23 ? make(B.OAK_GATE, 1) : B.OAK_FENCE); }
  for (const x of [-50, -49, -48, -47, -46, -42, -41, -40, -39, -38]) set(x, g + 1, 18, B.OAK_FENCE);
  for (const [sp, x, z] of [["cow", -47, 22], ["cow", -44, 25], ["sheep", -41, 21], ["sheep", -46, 26], ["pig", -42, 24], ["pig", -48, 20], ["chicken", -44, 10], ["chicken", -42, 12], ["chicken", -46, 13]]) animal(sp, x, z);
  sign(-37, g + 1, 22, 1, "Barn & Pen\n\nCows, sheep, pigs, and chickens. Wheat makes cows and sheep follow you; carrots work for pigs, seeds for chickens.");
  place("barn", -44, 16, 9);

  // ---------- the farm ----------
  for (let z = 32; z <= 48; z++) for (let x = -50; x <= -26; x++) {
    const edge = x === -50 || x === -26 || z === 32 || z === 48;
    if (edge) { set(x, g + 1, z, x === -26 && z === 40 ? make(B.OAK_GATE, 1) : B.OAK_FENCE); continue; }
    if ((z - 33) % 5 === 2) { set(x, g, z, B.WATER); set(x, g - 1, z, B.DIRT); continue; }
    set(x, g, z, make(B.FARMLAND, WET));
    const crop = (x + 50) % 8 < 4 ? B.WHEAT : B.CARROTS;
    set(x, g + 1, z, make(crop, 7)); info.crops.push({ X: x, y: g + 1, Z: z });
  }
  for (const [x, z] of [[-50, 32], [-26, 32], [-50, 48], [-26, 48]]) set(x, g + 2, z, B.TORCH);
  set(-28, g + 1, 31, B.COMPOSTER); set(-29, g + 1, 31, B.HAY); chest(-30, g + 1, 31, 0, "farm", "Farmer's Chest");
  sign(-25, g + 1, 38, 1, "Hollis Farm\n\nRipe wheat and carrots. Break a ripe crop to harvest it, then plant the seeds again. Farmer Hollis trades for extra crops.");
  npc("farmer", -30, 40); place("farm", -38, 40, 12);

  // ---------- homes along the main road ----------
  const homes = [
    { x0: -14, z0: 20, x1: -8, z1: 26, side: "e", wall: B.PLANKS }, { x0: -14, z0: 30, x1: -8, z1: 36, side: "e", wall: B.BIRCH_PLANKS }, { x0: -14, z0: 40, x1: -8, z1: 46, side: "e", wall: B.PLANKS },
    { x0: 8, z0: 20, x1: 14, z1: 26, side: "w", wall: B.BIRCH_PLANKS }, { x0: 8, z0: 30, x1: 14, z1: 36, side: "w", wall: B.PLANKS }, { x0: 8, z0: 40, x1: 14, z1: 46, side: "w", wall: B.BIRCH_PLANKS }
  ];
  homes.forEach((hm, i) => {
    const zc = (hm.z0 + hm.z1) / 2;
    house({ x0: hm.x0, z0: hm.z0, x1: hm.x1, z1: hm.z1, h: 4, wall: hm.wall, corner: B.LOG, floor: B.PLANKS, roof: i % 2 ? B.BRICKS : B.COBBLE, ridge: "z", doorSide: hm.side, doorAt: zc });
    const back = hm.side === "e" ? hm.x0 + 1 : hm.x1 - 1;
    bed(back, g + 1, hm.z0 + 2);
    set(back, g + 1, hm.z1 - 1, B.TABLE); set(back + (hm.side === "e" ? 1 : -1), g + 1, hm.z1 - 1, make(B.FURNACE, 2));
    chest(back, g + 1, zc, hm.side === "e" ? 1 : 3, "home", "Home Supplies");
    set(back + (hm.side === "e" ? 2 : -2), g + 1, hm.z0 + 1, B.BOOKSHELF);
    const dx = hm.side === "e" ? hm.x1 + 1 : hm.x0 - 1;
    box(Math.min(dx, hm.side === "e" ? -3 : 3), g, zc, Math.max(dx, hm.side === "e" ? -3 : 3), g, zc, B.GRAVEL);
    for (const z of [hm.z0, hm.z1]) set(dx, g + 1, z, i % 2 ? B.FLOWER_RED : B.FLOWER_YELLOW);
  });
  place("homes", 0, 33, 16);

  // ---------- the stable ----------
  box(36, g, 20, 48, g, 30, B.PLANKS);
  for (let z = 20; z <= 30; z++) for (let y = g + 1; y <= g + 4; y++) { set(48, y, z, y === g + 4 ? B.LOG : B.PLANKS); }
  for (let x = 36; x <= 48; x++) for (let y = g + 1; y <= g + 4; y++) { set(x, y, 20, y === g + 4 || x === 36 || x === 48 ? B.LOG : B.PLANKS); set(x, y, 30, y === g + 4 || x === 36 || x === 48 ? B.LOG : B.PLANKS); }
  box(36, g + 5, 19, 48, g + 5, 31, B.BRICKS); box(37, g + 6, 21, 47, g + 6, 29, B.BRICKS);
  for (const z of [23, 27]) box(40, g + 1, z, 47, g + 1, z, B.OAK_FENCE);
  for (const z of [21, 22, 24, 25, 26, 28, 29]) set(40, g + 1, z, B.OAK_FENCE);
  set(40, g + 1, 22, make(B.OAK_GATE, 3)); set(40, g + 1, 25, make(B.OAK_GATE, 3)); set(40, g + 1, 28, make(B.OAK_GATE, 3));
  for (const z of [21, 25, 29]) set(47, g + 1, z, B.HAY);
  for (const z of [22, 25, 28]) set(42, g + 5, z, B.SHINESTONE);
  chest(37, g + 1, 21, 1, "stable", "Stable Tack");
  for (const z of [22, 25, 28]) animal("trotter", 44, z);
  sign(36, g + 1, 31, 0, "Stable\n\nTrotters are tamed by riding them. A Saddle lets you steer. Stablemaster Wren keeps one in the tack chest.");
  npc("stable", 38, 25); place("stable", 42, 25, 7);

  // ---------- the fishing pond, dock, and hut ----------
  for (let z = 35; z <= 49; z++) for (let x = 29; x <= 49; x++) {
    const d = Math.hypot((x - 39) / 10, (z - 42) / 7);
    if (d > 1.05) continue;
    if (d > 0.9) { set(x, g, z, B.SAND); continue; }
    set(x, g - 3, z, B.SAND); box(x, g - 2, z, x, g, z, B.WATER);
  }
  box(38, g, 36, 40, g, 45, B.PLANKS); for (const [x, z] of [[38, 40], [40, 40], [38, 45], [40, 45]]) { box(x, g - 3, z, x, g - 1, z, B.LOG); set(x, g + 1, z, B.OAK_FENCE); set(x, g + 2, z, B.TORCH); }
  house({ x0: 21, z0: 38, x1: 27, z1: 44, h: 4, wall: B.BIRCH_PLANKS, corner: B.LOG, floor: B.PLANKS, roof: B.BRICKS, ridge: "z", doorSide: "e", doorAt: 41 });
  chest(22, g + 1, 39, 1, "fish", "Fisher's Chest"); bed(22, g + 1, 43);
  set(26, g + 1, 39, B.HAY);
  sign(28, g + 1, 40, 1, "Fishing Dock\n\nCast a Fishing Rod from the end of the dock (right-click), and reel in when the bobber dips.");
  npc("fisher", 39, 37); place("dock", 39, 42, 9);

  // ---------- the training arena ----------
  const AX0 = -48, AX1 = -30, AZ0 = -48, AZ1 = -30;
  box(AX0, g, AZ0, AX1, g, AZ1, B.SAND);
  for (let z = AZ0; z <= AZ1; z++) for (let x = AX0; x <= AX1; x++) {
    const edge = x === AX0 || x === AX1 || z === AZ0 || z === AZ1;
    if (!edge) continue;
    if (z === AZ1 && Math.abs(x + 39) <= 1) continue;   // the way in, facing the canal
    set(x, g + 1, z, B.COBBLE); set(x, g + 2, z, B.OAK_FENCE);
  }
  for (let z = AZ0; z <= AZ1; z++) for (const x of [AX0 - 1, AX0 - 2]) set(x, g + 1 + (AX0 - 1 - x), z, B.COBBLE);   // seats on the west side
  for (const [x, z] of [[-45, -45], [-39, -45], [-33, -45], [-45, -39], [-33, -39]]) { set(x, g + 1, z, B.HAY); set(x, g + 2, z, B.TARGET); }
  for (const [x, z] of [[AX0, AZ0], [AX1, AZ0], [AX0, AZ1], [AX1, AZ1]]) set(x, g + 3, z, B.TORCH);
  chest(-31, g + 1, -47, 3, "arena", "Weapon Rack");
  sign(-37, g + 1, AZ1 + 1, 0, "Training Arena\n\nCaptain Rowan trains new adventurers here. Ask her for a sparring match!");
  npc("captain", -39, -33); place("arena", -39, -39, 10);
  box(-40, g, -29, -38, g, -16, B.GRAVEL); box(-40, g, -10, -38, g, -3, B.GRAVEL);
  bridge(-40, -38);

  // ---------- the mine entrance (stairs down to an old mine) ----------
  box(30, g - 13, -62, 50, g - 5, -36, B.STONE);   // solid rock around the mine so caves can't open into it
  house({ x0: 35, z0: -40, x1: 45, z1: -33, h: 5, wall: B.COBBLE, corner: B.LOG, floor: B.PLANKS, roof: B.COBBLE, ridge: "x", doorSide: "s", doorAt: 40 });
  for (let k = 0; k <= 9; k++) { const z = -36 - k; box(39, g - k - 1, z, 41, g - k - 1, z, B.STONE); box(39, g - k, z, 41, g - k + 3, z, B.AIR); }
  for (let x = 39; x <= 41; x++) set(x, g, -40, B.AIR);
  box(39, g - 10, -50, 41, g - 10, -46, B.STONE); box(39, g - 9, -50, 41, g - 6, -46, B.AIR);
  box(32, g - 11, -61, 48, g - 11, -51, B.STONE); box(32, g - 10, -61, 48, g - 6, -51, B.AIR);
  box(39, g - 10, -51, 41, g - 6, -51, B.AIR);
  for (const x of [34, 40, 46]) for (const z of [-53, -59]) { box(x, g - 10, z, x, g - 7, z, B.LOG); }
  for (const z of [-53, -59]) box(33, g - 6, z, 47, g - 6, z, B.PLANKS);
  for (const [x, z] of [[33, -55], [47, -55], [40, -60], [36, -52], [44, -52]]) set(x, g - 8, z, B.TORCH);
  for (const [x, y, z, o] of [[31, -9, -55, B.COAL_ORE], [31, -8, -56, B.COAL_ORE], [49, -9, -54, B.IRON_ORE], [49, -8, -58, B.COAL_ORE], [36, -10, -62, B.IRON_ORE], [44, -9, -62, B.COAL_ORE], [31, -10, -59, B.IRON_ORE], [49, -10, -60, B.JADE_ORE], [40, -8, -62, B.COAL_ORE]]) set(x, g + y, z, o);
  for (let z = -39; z <= -35; z++) set(38, g + 1, z, z % 2 ? B.HAY : B.OAK_FENCE);
  chest(47, g - 10, -60, 3, "mine", "Miner's Cache");
  for (const [x, z] of [[38, -36], [42, -36]]) set(x, g + 4, z, B.SHINESTONE);
  sign(41, g + 1, -32, 0, "Old Mine\n\nThe stairs go down to the mine the village dug long ago. Bring torches. Miner Brock says the tunnels go deeper than anyone remembers.");
  npc("miner", 40, -31); place("mine", 40, -36, 6); place("mineDeep", 40, -56, 8);

  // ---------- the Elder and a merchant by the plaza ----------
  npc("elder", 3, 7); npc("merchant", 9, -6);

  return { cells, info };
}
