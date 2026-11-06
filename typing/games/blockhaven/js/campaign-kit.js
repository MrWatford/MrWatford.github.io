// Building helpers for the Legacy Campaign's hand-made places (towns, ruins, boss chambers).
// Everything is drawn into one square stamp of `size` × `size` columns around its middle (X, Z from -size/2),
// the same format the Starter Home and Legacy Village use. 65535 (KEEP) means "leave the natural land".
import { B, HEIGHT, SEA, make, TOP, HEAD, WET } from "./blocks.js";

export const KEEP = 65535;
export const SIDE = { s: 0, e: 1, n: 2, w: 3 };   // facing meta (0 = +z, 1 = +x, 2 = -z, 3 = -x)

// rot (0-3) turns the whole design a quarter turn at a time (so a harbor can face the real sea); doors, chests, signs,
// beds, furnaces, and gates turn with it.
const FACED = new Set([B.DOOR, B.CHEST, B.SIGN, B.BED, B.FURNACE, B.OAK_GATE]);
export function makeKit(size, g, rot = 0) {
  const S = size, C = size / 2;
  const cells = new Uint16Array(S * S * HEIGHT).fill(KEEP);
  const info = { chests: [], signs: [], npcs: [], animals: [], crops: [], places: [], waystones: [], arenas: {}, marks: {}, spawn: null };
  const inside = (X, y, Z) => X >= -C && Z >= -C && X < C && Z < C && y >= 1 && y < HEIGHT;
  // a quarter turn maps (X, Z) to (-Z - 1, X) on the cell grid (so the square stays in place) and facing f to (f + 3) % 4
  const rp = (X, Z) => { for (let k = 0; k < rot; k++) [X, Z] = [-Z - 1, X]; return [X, Z]; };
  const rf = v => { if (!rot || v === KEEP || !FACED.has(v & 255)) return v; const f = (v >> 8) & 3; return (v & ~(3 << 8)) | (((f + 3 * rot) % 4) << 8); };
  const K = { S, C, g, cells, info, inside, rp };
  K.set = (X, y, Z, v) => { [X, Z] = rp(X, Z); if (inside(X, y, Z)) cells[(C + X) + (C + Z) * S + y * S * S] = rf(v); };
  K.get = (X, y, Z) => { [X, Z] = rp(X, Z); return inside(X, y, Z) ? cells[(C + X) + (C + Z) * S + y * S * S] : KEEP; };
  const at = (X, Z) => { const [x, z] = rp(X, Z); return { X: x, Z: z }; };
  K.box = (x0, y0, z0, x1, y1, z1, v) => {
    const [ax, bx] = x0 <= x1 ? [x0, x1] : [x1, x0], [ay, by] = y0 <= y1 ? [y0, y1] : [y1, y0], [az, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
    for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) K.set(x, y, z, typeof v === "function" ? v(x, y, z) : v);
  };
  const set = K.set, box = K.box;
  K.chest = (X, y, Z, face, loot, label) => { set(X, y, Z, make(B.CHEST, face)); info.chests.push({ ...at(X, Z), y, loot, label }); };
  K.sign = (X, y, Z, face, text) => { set(X, y, Z, make(B.SIGN, face)); info.signs.push({ ...at(X, Z), y, text }); };
  K.door = (X, y, Z, side) => { set(X, y, Z, make(B.DOOR, SIDE[side])); set(X, y + 1, Z, make(B.DOOR, SIDE[side] | TOP)); };
  K.bed = (X, y, Zfoot) => { set(X, y, Zfoot, make(B.BED, 2)); set(X, y, Zfoot - 1, make(B.BED, 2 | HEAD)); };
  K.npc = (id, X, Z, y = g + 1) => info.npcs.push({ id, ...at(X, Z), y });
  K.animal = (sp, X, Z, y = g + 1) => info.animals.push({ sp, ...at(X, Z), y });
  K.place = (id, X, Z, r, y) => info.places.push({ id, ...at(X, Z), r, y });
  K.at = at;
  K.lamp = (X, Z, base = g) => { for (let y = base + 1; y <= base + 3; y++) set(X, y, Z, B.OAK_FENCE); set(X, base + 4, Z, B.TORCH); };
  K.waystone = (id, X, Z, base = g) => { set(X, base, Z, B.STONE_BRICKS); set(X, base + 1, Z, B.WAYSTONE); info.waystones.push({ id, ...at(X, Z), y: base + 1 }); };
  // the ground: level inside a square of half-width `level`, sloping into the natural land out to `edge`
  K.ground = (groundAt, level, edge, top = B.GRASS, under = B.DIRT) => {
    for (let Z = -C; Z < C; Z++) for (let X = -C; X < C; X++) {
      const m = Math.max(Math.abs(X + 0.5), Math.abs(Z + 0.5));
      if (m <= level) { for (let y = Math.max(1, g - 10); y < HEIGHT; y++) set(X, y, Z, y < g - 4 ? B.STONE : y < g ? under : y === g ? top : B.AIR); continue; }
      if (m > edge) continue;
      const r = at(X, Z), h = groundAt(r.X, r.Z);
      if (h < SEA) continue;   // water stays water
      const t = (m - level) / (edge - level), target = Math.round(g + (h - g) * t);
      for (let y = Math.max(1, target - 4); y <= target; y++) set(X, y, Z, y === target ? top : under);
      for (let y = target + 1; y <= Math.min(HEIGHT - 2, Math.max(h, g) + 8); y++) set(X, y, Z, B.AIR);
    }
  };
  // A house: floor, walls with corner posts, windows, a door, a flat ceiling, a gable (or flat) roof
  K.house = o => {
    const { x0, z0, x1, z1, h = 4, wall = B.PLANKS, corner = B.LOG, floor = B.PLANKS, roof = B.BRICKS, ridge = (x1 - x0 >= z1 - z0) ? "x" : "z", doorSide, doorAt, base = g, flat = false, win = B.GLASS } = o;
    box(x0, base, z0, x1, base, z1, floor);
    for (let y = base + 1; y <= base + h; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const ex = x === x0 || x === x1, ez = z === z0 || z === z1;
      if (!ex && !ez) { set(x, y, z, y === base + h ? floor === B.SAND || floor === B.SANDSTONE ? B.SANDSTONE : B.PLANKS : B.AIR); continue; }
      set(x, y, z, (ex && ez) || y === base + h ? corner : wall);
    }
    const w2 = (x, z) => { set(x, base + 2, z, win); if (h > 3) set(x, base + 3, z, win); };
    for (let x = x0 + 2; x <= x1 - 2; x += 3) { if (!(doorSide === "n" && Math.abs(x - doorAt) < 2)) w2(x, z0); if (!(doorSide === "s" && Math.abs(x - doorAt) < 2)) w2(x, z1); }
    for (let z = z0 + 2; z <= z1 - 2; z += 3) { if (!(doorSide === "w" && Math.abs(z - doorAt) < 2)) w2(x0, z); if (!(doorSide === "e" && Math.abs(z - doorAt) < 2)) w2(x1, z); }
    if (doorSide) {
      const [dx, dz] = doorSide === "n" ? [doorAt, z0] : doorSide === "s" ? [doorAt, z1] : doorSide === "w" ? [x0, doorAt] : [x1, doorAt];
      K.door(dx, base + 1, dz, doorSide);
      const [ox, oz] = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[doorSide];
      set(dx + ox, base, dz + oz, B.COBBLE);
    }
    set(Math.round((x0 + x1) / 2), base + h, Math.round((z0 + z1) / 2), B.SHINESTONE);
    if (flat) { box(x0 - 1, base + h + 1, z0 - 1, x1 + 1, base + h + 1, z1 + 1, (x, y, z) => (x === x0 - 1 || x === x1 + 1 || z === z0 - 1 || z === z1 + 1 ? ((x + z) % 2 ? roof : B.AIR) : B.AIR)); return; }
    if (ridge === "x") for (let k = 0; ; k++) {
      const za = z0 - 1 + k, zb = z1 + 1 - k, y = base + h + 1 + k; if (za > zb || y >= HEIGHT - 1) break;
      for (let z = za; z <= zb; z++) for (let x = x0 - 1; x <= x1 + 1; x++) {
        if (z === za || z === zb) set(x, y, z, roof); else if (x === x0 || x === x1) set(x, y, z, wall); else if (x > x0 && x < x1) set(x, y, z, B.AIR);
      }
    } else for (let k = 0; ; k++) {
      const xa = x0 - 1 + k, xb = x1 + 1 - k, y = base + h + 1 + k; if (xa > xb || y >= HEIGHT - 1) break;
      for (let x = xa; x <= xb; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
        if (x === xa || x === xb) set(x, y, z, roof); else if (z === z0 || z === z1) set(x, y, z, wall); else if (z > z0 && z < z1) set(x, y, z, B.AIR);
      }
    }
  };
  // A stair that climbs a ring of cells (in walking order); the floor at base + h gets holes over the last three steps
  K.spiral = (ring, base, h, fill) => {
    for (let i = 1; i < h; i++) { const [x, z] = ring[i % ring.length]; box(x, i < ring.length ? base + 1 : base + i, z, x, base + i, z, fill); }
    const holes = new Set();
    for (let i = Math.max(1, h - 3); i < h; i++) holes.add(ring[i % ring.length].join(","));
    return holes;
  };
  // the ring of cells around a square middle of half-width q-1 (q = ring half-width), starting at (sx, sz), going clockwise
  K.squareRing = (cx, cz, q, sx, sz) => {
    const ring = [];
    for (let x = -q; x < q; x++) ring.push([x, -q]);
    for (let z = -q; z < q; z++) ring.push([q, z]);
    for (let x = q; x > -q; x--) ring.push([x, q]);
    for (let z = q; z > -q; z--) ring.push([-q, z]);
    const s0 = Math.max(0, ring.findIndex(c => c[0] === sx && c[1] === sz));
    return ring.slice(s0).concat(ring.slice(0, s0)).map(([x, z]) => [cx + x, cz + z]);
  };
  // A square tower (odd size ≥ 7) with a stair inside and battlements on top; the door is on `side`, `off` along that wall
  K.tower = (cx, cz, size, h, wall, side, off = 0, base = g) => {
    const r = (size - 1) / 2, q = r - 1, o = Math.max(-q, Math.min(q, off));
    box(cx - r, base, cz - r, cx + r, base, cz + r, B.STONE_BRICKS);
    for (let y = base + 1; y <= base + h; y++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const edge = Math.abs(dx) === r || Math.abs(dz) === r;
      set(cx + dx, y, cz + dz, edge ? wall : Math.abs(dx) <= r - 2 && Math.abs(dz) <= r - 2 ? B.STONE_BRICKS : B.AIR);
    }
    const st = { s: [o, q], n: [o, -q], e: [q, o], w: [-q, o] }[side];
    const holes = K.spiral(K.squareRing(cx, cz, q, st[0], st[1]), base, h, B.STONE_BRICKS);
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const x = cx + dx, z = cz + dz, edge = Math.abs(dx) === r || Math.abs(dz) === r;
      set(x, base + h, z, holes.has(x + "," + z) && !edge ? B.AIR : B.STONE_BRICKS);
      if (edge && (dx + dz) % 2 === 0) set(x, base + h + 1, z, wall);
    }
    for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) set(cx + dx, base + h + 2, cz + dz, B.TORCH);
    for (let y = base + 4; y < base + h - 1; y += 4) for (const [dx, dz] of [[0, -r], [0, r], [-r, 0], [r, 0]]) set(cx + dx, y, cz + dz, B.GLASS);
    const [dx, dz] = { s: [o, r], n: [o, -r], e: [r, o], w: [-r, o] }[side];
    K.door(cx + dx, base + 1, cz + dz, side);
  };
  K.tree = (X, Z, hgt = 5, log = B.LOG, leaves = B.LEAVES, base = g) => {
    for (let y = base + 1; y <= base + hgt; y++) set(X, y, Z, log);
    for (let dy = -2; dy <= 1; dy++) {
      const r = dy >= 0 ? 1 : 2;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) === r && Math.abs(dz) === r && r === 2) continue;
        if (K.get(X + dx, base + hgt + dy, Z + dz) === B.AIR) set(X + dx, base + hgt + dy, Z + dz, leaves);
      }
    }
    set(X, base + hgt + 2, Z, leaves);
  };
  K.road = (x0, z0, x1, z1, a = B.GRAVEL, b = B.COBBLE) => box(x0, g, z0, x1, g, z1, (x, y, z) => ((x + z) % 7 === 0 ? b : a));
  K.farm = (x0, z0, x1, z1) => {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      if (edge) { set(x, g + 1, z, B.OAK_FENCE); continue; }
      if ((z - z0) % 5 === 3) { set(x, g, z, B.WATER); set(x, g - 1, z, B.DIRT); continue; }
      set(x, g, z, make(B.FARMLAND, WET)); set(x, g + 1, z, make((x - x0) % 8 < 4 ? B.WHEAT : B.CARROTS, 7)); info.crops.push({ X: x, y: g + 1, Z: z });
    }
  };
  // a round boss arena carved out of solid rock: floor at y - 1, open from y to y + h - 1, a ring of lights
  K.arena = (cx, y, cz, rad, h, wall, floor, ceil = wall) => {
    for (let dz = -rad - 2; dz <= rad + 2; dz++) for (let dx = -rad - 2; dx <= rad + 2; dx++) {
      const d = Math.hypot(dx, dz); if (d > rad + 2.2) continue;
      for (let yy = y - 2; yy <= y + h; yy++) set(cx + dx, yy, cz + dz, d > rad + 0.5 || yy < y ? (yy === y - 1 && d <= rad + 0.5 ? floor : wall) : yy === y + h ? ceil : B.AIR);
    }
    for (let a = 0; a < 20; a++) { const t = a / 20 * Math.PI * 2; set(Math.round(cx + Math.cos(t) * (rad + 1)), y + 3, Math.round(cz + Math.sin(t) * (rad + 1)), B.SHINESTONE); }
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2 + 0.2; set(Math.round(cx + Math.cos(t) * rad * 0.55), y + h, Math.round(cz + Math.sin(t) * rad * 0.55), B.SHINESTONE); }
  };
  // three rune stones around an arena (the boss's shield devices), at the given angles
  K.runes = (cx, y, cz, rad, angles = [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6]) => angles.map(t => {
    const x = Math.round(cx + Math.cos(t) * rad), z = Math.round(cz + Math.sin(t) * rad);
    set(x, y, z, B.RUNE_STONE); set(x, y - 1, z, B.STONE_BRICKS); return { ...at(x, z), y };
  });
  return K;
}
