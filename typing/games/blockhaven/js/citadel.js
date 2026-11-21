// THE ENDWATCH CITADEL (Stronghold Reborn, Stage 1): a great castle on an island in a lake, built over each stronghold
// spot, after Mr. Watford's reference video (an eight-sided curtain wall with round red-roofed towers, a twin-towered
// gatehouse, a big keep with corner towers and one tall central tower, a long arched stone bridge across the water).
// The Hollow portal stays exactly where the stronghold's was (same 12 frame spots, y 22), now in a warded chamber
// under the keep. Its only way in is a spiral stair capped by the Castellan's Seal (opened in Stage 5).
//
// Coordinates here are "castle-local" in a canonical facing: (0, 0) is the stronghold spot and the gate faces +z.
// Each castle is turned (rot 0–3) so its gate faces the world's spawn.
import { B, HEIGHT, SEA, make, EYE_IN, HEAD } from "./blocks.js";
import { hash3 } from "./noise.js";
import { frameSpots, LOOT } from "./worldgen.js";

export const CITADEL = {
  version: 1,
  ground: 35,          // the island's grass (walk at y 36)
  wallTop: 46,         // curtain wall blocks; the wall walk is at y 47
  island: 72, lake: 100, shore: 122,   // radii: island edge, far side of the lake, where the shore meets the natural land
  half: 68,            // the castle stamp covers -68 … 68
  bridgeHalf: 4,
  portalY: 22          // the stronghold's portal height (frameSpots use it)
};
// The gate (Stage 2): the drawbridge hinges at v 70 and spans v 71–77 when lowered; the portcullis fills the arch at z 51;
// two watchtowers and the outer Gate Winch stand at the shore end of the bridge; the inner winch is just inside the gate.
export const GATE = { hinge: 70, v0: 71, v1: 77, half: 3, panelTop: 7, portZ: 51, towers: [[-9, 106], [9, 106]], towerTop: 44, winch: [6, 103], inner: [5, 42] };
const KEEP = 65535, C = CITADEL, O = C.half, S = O * 2 + 1, G0 = C.ground, F = G0 + 1;
const smooth01 = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const hashL = (x, y, z) => { let h = (x * 374761393 + y * 1442695041 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- palette: change the castle's look here ----------
const MAT = {
  brick: (x, y, z) => { const r = hashL(x, y, z); return r < 0.1 ? B.CRACKED_BRICKS : r < 0.115 ? B.MOSSY : B.STONE_BRICKS; },
  dark: () => B.DARKSLATE_BRICKS, roof: () => B.ROOF_TILES, wood: () => B.PLANKS, log: () => B.LOG,
  ward: () => B.WARD_BRICKS, path: () => B.SAND
};
// The curtain wall: a stretched octagon (wider than deep), with a tower at each corner
const WALL = [[-55, -29], [-8, -48], [8, -48], [55, -29], [55, 29], [8, 48], [-8, 48], [-55, 29]];
const WALL_T = 3;
// distance inside the octagon from its outline (negative = outside)
export function inset(x, z) {
  let m = Infinity;
  for (let i = 0; i < WALL.length; i++) {
    const [ax, az] = WALL[i], [bx, bz] = WALL[(i + 1) % WALL.length], ex = bx - ax, ez = bz - az, L = Math.hypot(ex, ez);
    const d = ((x - ax) * ez - (z - az) * ex) / L;   // positive on the inside (the outline runs clockwise here)
    m = Math.min(m, -d);
  }
  return m;
}

// ---------- building the castle (canonical facing) ----------
function buildCanonical() {
  const cells = new Uint16Array(S * S * HEIGHT).fill(KEEP);
  const I = (x, y, z) => (x + O) + (z + O) * S + y * S * S;
  const inside = (x, y, z) => Math.abs(x) <= O && Math.abs(z) <= O && y >= 1 && y < HEIGHT;
  const put = (x, y, z, v) => { if (v !== undefined && inside(x, y, z)) cells[I(x, y, z)] = v; };
  const get = (x, y, z) => inside(x, y, z) ? cells[I(x, y, z)] : KEEP;
  const box = (x0, y0, z0, x1, y1, z1, v) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(x, y, z, typeof v === "function" ? v(x, y, z) : v); };
  const disk = (cx, cz, r, y, v) => { const R = Math.ceil(r); for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dz * dz <= r * r) put(cx + dx, y, cz + dz, typeof v === "function" ? v(cx + dx, y, cz + dz, Math.hypot(dx, dz)) : v); };
  const torches = [], banners = [], lamps = [], tomes = [];

  // 1. the courtyard ground: everything inside the wall is open grass at the island's level, with sand paths
  for (let z = -O; z <= O; z++) for (let x = -O; x <= O; x++) if (inset(x, z) > -1) { put(x, G0, z, B.GRASS); for (let y = F; y < HEIGHT; y++) put(x, y, z, 0); }
  const path = (x0, z0, x1, z1) => box(x0, G0, z0, x1, G0, z1, MAT.path());
  path(-2, 24, 2, 47); path(-27, 22, 27, 28); path(-30, -30, -26, 28); path(26, -30, 30, 28); path(-30, -31, 30, -29);
  path(-48, -2, -30, 2); path(30, -2, 48, 2);

  // 2. the curtain wall: 3 thick, dark base, battlements on the outside edge, arrow slits
  for (let z = -O; z <= O; z++) for (let x = -O; x <= O; x++) {
    const d = inset(x, z); if (d < 0 || d >= WALL_T) continue;
    for (let y = F; y <= C.wallTop; y++) put(x, y, z, y <= F + 1 || (y === C.wallTop - 1 && d < 1) ? MAT.dark() : MAT.brick(x, y, z));
    if (d < 1 && (x + z) % 2 === 0) put(x, C.wallTop + 1, z, MAT.brick(x, C.wallTop + 1, z));   // merlons
    if (d < 1 && (x * 7 + z * 3) % 9 === 0) { put(x, F + 4, z, 0); put(x, F + 5, z, 0); }       // arrow slits
    if (d >= 2 && (x * 5 + z * 11) % 23 === 0) torches.push([x, C.wallTop + 1, z]);
  }
  // 3. towers: round, with a dark plinth, slits, a lookout floor, battlements, and a red stepped cone roof
  const tower = (cx, cz, r, top, roofTop) => {
    for (let y = F; y <= top; y++) disk(cx, cz, r + (y <= F + 1 ? 0.7 : 0), y, (x, yy, z, d) => d >= r - 1.4 || y <= F + 1 ? (y <= F + 1 ? MAT.dark() : (yy % 6 === 3 && d >= r - 1 && (x + z) % 4 === 0 ? 0 : MAT.brick(x, yy, z))) : 0);
    disk(cx, cz, r - 1.4, C.wallTop, MAT.wood());                         // lookout floor at the wall walk
    disk(cx, cz, r - 1.4, top, MAT.wood());                               // and at the top
    disk(cx, cz, r + 0.6, top + 1, (x, y, z, d) => d >= r - 0.4 && (x + z) % 2 === 0 ? MAT.brick(x, y, z) : undefined);
    let rr = r + 1.2, y = top + 2;
    while (rr > 0.4 && y <= roofTop) { disk(cx, cz, rr, y, MAT.roof()); rr -= y < top + 4 ? 0.45 : 0.6; y++; }
    put(cx, y, cz, MAT.log());
    // doorways: wherever the tower's wall stands on the wall walk, cut a 2-high passage (so the walk runs through the tower)
    if (top > C.wallTop + 2) {
      const Rr = Math.ceil(r + 1);
      for (let dz = -Rr; dz <= Rr; dz++) for (let dx = -Rr; dx <= Rr; dx++) {
        const x = cx + dx, z = cz + dz, d = Math.hypot(dx, dz), w = inset(x, z);
        if (d < r - 1.4 || d > r + 0.8 || !(w >= 0.8 && w < WALL_T)) continue;
        put(x, C.wallTop + 1, z, 0); put(x, C.wallTop + 2, z, 0); put(x, C.wallTop, z, MAT.brick(x, C.wallTop, z));
      }
    }
    return y;
  };
  for (const [x, z] of WALL) if (Math.abs(x) > 10) tower(x, z, 4.5, 53, 64);
  tower(-8, -48, 4.5, 53, 64); tower(8, -48, 4.5, 53, 64);

  // 4. the gatehouse: two big towers, a gate passage with an arch, a tall gabled middle with a window
  const GT = 57;
  tower(-9, 48, 5.5, GT, 71); tower(9, 48, 5.5, GT, 71);
  box(-6, F, 44, 6, 51, 52, (x, y, z) => y <= F + 1 ? MAT.dark() : MAT.brick(x, y, z));
  for (let z = 43; z <= 53; z++) for (let y = F; y <= F + 9; y++) for (let x = -3; x <= 3; x++) { const top = Math.abs(x) <= 1 ? F + 9 : Math.abs(x) <= 2 ? F + 8 : F + 7; if (y <= top) put(x, y, z, 0); }
  for (let z = 44; z <= 52; z++) for (const x of [-4, 4]) put(x, F + 8, z, MAT.dark());       // the arch's dark ribs
  box(-6, 52, 44, 6, 52, 52, (x, y, z) => (x + z) % 2 === 0 && (Math.abs(x) === 6 || z === 44 || z === 52) ? MAT.brick(x, y, z) : undefined);
  box(-4, 52, 46, 4, 58, 50, (x, y, z) => MAT.brick(x, y, z));                                 // the middle section
  box(-1, 54, 50, 1, 56, 50, B.GLASS); put(0, 57, 50, B.GLASS);
  for (let k = 0; k < 6; k++) box(-5 + k, 59 + k, 45, 5 - k, 59 + k, 51, MAT.roof());          // its gable roof (ridge along z)
  for (const x of [-1, 1]) for (const y of [48, 49]) { put(x * 3, y, 53, make(B.CASTLE_BANNER, 0)); banners.push([x * 3, y, 53]); }
  torches.push([-5, F + 3, 54], [5, F + 3, 54]);
  // the portcullis (down until the gate opens) and the inner winch (it always opens the gate from inside)
  for (let x = -3; x <= 3; x++) { const top = Math.abs(x) <= 1 ? F + 9 : Math.abs(x) <= 2 ? F + 8 : F + 7; for (let y = F; y <= top; y++) put(x, y, GATE.portZ, make(B.PORTCULLIS, 0)); }
  put(GATE.inner[0], F, GATE.inner[1], B.GATE_WINCH);
  for (const x of [-5, 5]) { box(x, F, 55, x, F + 1, 55, MAT.dark()); put(x, F + 2, 55, B.BRAZIER); put(x, F + 3, 55, B.FIRE); }

  // 5. the keep: 49 × 52, three floors, tall windows, a stepped red hip roof, four corner towers, a central tower
  const KX = 24, KZ0 = -27, KZ1 = 24, KT = 57;
  box(-KX, F, KZ0, KX, KT, KZ1, (x, y, z) => {
    const wall = Math.abs(x) >= KX - 1 || z <= KZ0 + 1 || z >= KZ1 - 1;
    if (!wall) return y === F + 6 || y === F + 13 ? MAT.wood() : 0;            // floors at y 42 and 49
    if (y <= F + 1) return MAT.dark();
    const along = Math.abs(x) >= KX - 1 ? z : x, edge = Math.abs(x) === KX || z === KZ0 || z === KZ1;
    if (edge && ((along + 300) % 6 === 2 || (along + 300) % 6 === 3) && [3, 4, 5, 10, 11, 12, 17, 18, 19].includes(y - F)) return (y - F) % 7 === 5 ? MAT.dark() : B.GLASS;
    return y === KT ? MAT.dark() : MAT.brick(x, y, z);
  });
  box(-KX, KT + 1, KZ0, KX, KT + 1, KZ1, (x, y, z) => (Math.abs(x) === KX || z === KZ0 || z === KZ1) && (x + z) % 2 === 0 ? MAT.brick(x, y, z) : undefined);
  box(-KX + 1, KT, KZ0 + 1, KX - 1, KT, KZ1 - 1, MAT.wood());                  // the roof walk
  box(-KX + 2, G0, KZ0 + 2, KX - 2, G0, KZ1 - 2, (x, y, z) => ((x + z) & 1) ? B.QUARTZ_BLOCK : B.BLACKSTONE);   // the Great Hall's checkered floor
  for (let k = 0; ; k++) { const x0 = -KX + 3 + 2 * k, z0 = KZ0 + 3 + 2 * k, x1 = KX - 3 - 2 * k, z1 = KZ1 - 3 - 2 * k; if (x0 > x1 || z0 > z1) break; box(x0, KT + 1 + k, z0, x1, KT + 1 + k, z1, MAT.roof()); }
  // the front door (an arch) and a gabled porch with a red spire, facing the gate
  box(-5, F, KZ1, 5, 50, KZ1 + 3, (x, y, z) => y <= F + 1 ? MAT.dark() : MAT.brick(x, y, z));
  for (let y = F; y <= F + 5; y++) for (let x = -2; x <= 2; x++) if (y <= F + 4 || Math.abs(x) <= 1) for (let z = KZ1 - 1; z <= KZ1 + 3; z++) put(x, y, z, 0);
  for (let k = 0; k < 7; k++) box(-5 + k, 51 + k, KZ1, 5 - k, 51 + k, KZ1 + 3, (x, y, z) => Math.abs(x) === 5 - k ? MAT.roof() : MAT.brick(x, y, z));
  box(-1, 58, KZ1 + 1, 1, 61, KZ1 + 2, MAT.roof()); put(0, 62, KZ1 + 2, MAT.roof()); put(0, 63, KZ1 + 2, MAT.roof());
  put(0, 54, KZ1 + 3, B.GLASS); put(0, 55, KZ1 + 3, B.GLASS);
  for (const x of [-3, 3]) for (const y of [F + 7, F + 8]) { put(x, y, KZ1 + 4, make(B.CASTLE_BANNER, 0)); banners.push([x, y, KZ1 + 4]); }
  // the back annex (it will hold the way to the throne room)
  box(-7, F, KZ0 - 7, 7, 50, KZ0, (x, y, z) => { const wall = Math.abs(x) === 7 || z === KZ0 - 7; return wall || y === 50 ? (y <= F + 1 ? MAT.dark() : MAT.brick(x, y, z)) : (z === KZ0 && Math.abs(x) <= 2 && y <= F + 4 ? 0 : (z === KZ0 ? MAT.brick(x, y, z) : 0)); });
  for (let k = 0; k < 5; k++) box(-8 + k, 51 + k, KZ0 - 8, 8 - k, 51 + k, KZ0, MAT.roof());
  box(-2, F, KZ0, 2, F + 4, KZ0 + 1, 0); box(-6, G0, KZ0 - 6, 6, G0, KZ0 - 1, MAT.wood());
  // corner towers and the central tower (the highest point, with a banner on a pole)
  for (const x of [-KX, KX]) for (const z of [KZ0, KZ1]) tower(x, z, 5, 63, 75);
  box(-4, KT + 1, -6, 4, 70, 2, (x, y, z) => (Math.abs(x) === 4 || z === -6 || z === 2) ? (y >= 67 && y <= 69 && (x === 0 || z === -2) ? B.GLASS : MAT.brick(x, y, z)) : (y === 70 ? MAT.wood() : 0));
  box(-5, 71, -7, 5, 71, 3, (x, y, z) => (Math.abs(x) === 5 || z === -7 || z === 3) && (x + z) % 2 === 0 ? MAT.brick(x, y, z) : undefined);
  for (let k = 0; k < 5; k++) box(-4 + k, 72 + k, -6 + k, 4 - k, 72 + k, 2 - k, MAT.roof());
  box(0, 77, -2, 0, 78, -2, MAT.log()); put(1, 78, -2, make(B.CASTLE_BANNER, 1)); put(1, 77, -2, make(B.CASTLE_BANNER, 1)); banners.push([1, 78, -2]);

  // 6. the courtyard: a fountain, gardens, stables, barracks, market stalls, a wagon, stairs up to the walls
  disk(-17, 34, 4, G0, MAT.dark()); disk(-17, 34, 4.2, F, (x, y, z, d) => d >= 3.2 ? MAT.dark() : B.WATER); disk(-17, 34, 1, F + 1, MAT.dark()); put(-17, F + 2, 34, B.WATER);
  for (const sx of [-1, 1]) {
    if (sx > 0) box(6, F, 30, 12, F, 39, (x, y, z) => (Math.abs(x) === 6 || Math.abs(x) === 12 || z === 30 || z === 39) ? B.LEAVES : (hashL(x, 1, z) < 0.5 ? (hashL(x, 2, z) < 0.5 ? B.FLOWER_RED : B.FLOWER_YELLOW) : undefined));
    box(sx * 33, F, -24, sx * 40, F, 20, (x, y, z) => hashL(x, 3, z) < 0.18 ? (hashL(x, 4, z) < 0.5 ? B.FLOWER_RED : B.FLOWER_YELLOW) : undefined);
  }
  // stables (west) and barracks (east)
  const shed = (x0, z0, x1, z1, h, open) => {
    box(x0, F, z0, x1, F + h, z1, (x, y, z) => { const e = x === x0 || x === x1 || z === z0 || z === z1; const post = (x === x0 || x === x1) && (z === z0 || z === z1); return post ? MAT.log() : e ? (open && x === x1 && y <= F + 2 ? (z % 3 === 0 ? MAT.log() : B.OAK_FENCE) : (y <= F ? MAT.dark() : MAT.brick(x, y, z))) : (y === F - 0 ? undefined : 0); });
    for (let k = 0; ; k++) { const a = x0 - 1 + k, b = x1 + 1 - k; if (a > b) break; box(a, F + h + 1 + k, z0 - 1, b, F + h + 1 + k, z1 + 1, MAT.roof()); }
  };
  shed(-47, -12, -40, 12, 4, true); for (let z = -10; z <= 10; z += 4) put(-44, F, z, B.HAY);
  shed(40, -12, 47, 12, 5, false); box(40, F, -1, 40, F + 2, 1, 0);
  // market stalls by the gate (striped wool canopies)
  for (const [x, z] of [[17, 35], [23, 32], [-7, 38], [-27, 30]]) { box(x - 1, F, z - 1, x + 1, F, z + 1, B.PLANKS); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(x + a, F + 1, z + b, x + a, F + 2, z + b, B.OAK_FENCE); box(x - 1, F + 3, z - 1, x + 1, F + 3, z + 1, (xx) => (xx % 2 ? B.WOOL : B.BLACK_WOOL)); }
  // a wagon by the stables
  box(-37, F + 1, 16, -35, F + 1, 19, B.PLANKS); for (const [x, z] of [[-38, 16], [-34, 16], [-38, 19], [-34, 19]]) put(x, F, z, MAT.log()); put(-36, F + 2, 17, B.HAY);
  // stairs up to the wall walk (half steps against the inner face of the long walls)
  for (const sx of [-1, 1]) for (let k = 0; k < 22; k++) {
    const z = 12 - k, s = F + 0.5 + k * 0.5, whole = Math.floor(s);
    for (const x of [sx * 51, sx * 52]) { for (let y = F; y < whole; y++) put(x, y, z, MAT.brick(x, y, z)); if (s !== whole) put(x, whole, z, B.STONE_STEP); }
  }

  // 7. torches along the walls and towers (on top of blocks)
  for (const [x, y, z] of torches) if (get(x, y - 1, z) !== KEEP && get(x, y - 1, z) !== 0 && (get(x, y, z) === 0 || get(x, y, z) === KEEP)) put(x, y, z, B.TORCH);
  for (const [x, z] of WALL) lamps.push([x, 54, z]);

  // 7b. INSIDE THE KEEP (Stage 3): three floors of rooms, stairs between them, tomes of lore, treasure, and a locked door
  // Floors: ground (walk y 36–41), second (y 43–48), top (y 50–56); the roof walk is at y 58 around the red roof.
  {
    const IX0 = -KX + 2, IX1 = KX - 2, IZ0 = KZ0 + 2, IZ1 = KZ1 - 2, FL = [F, F + 7, F + 14];   // walk heights per floor
    const wallX = (x, z0, z1, f, doors) => { for (let z = z0; z <= z1; z++) for (let y = FL[f]; y <= FL[f] + 5; y++) put(x, y, z, doors.some(d => Math.abs(z - d) <= 1) && y <= FL[f] + 2 ? 0 : MAT.brick(x, y, z)); };
    const wallZ = (z, x0, x1, f, doors) => { for (let x = x0; x <= x1; x++) for (let y = FL[f]; y <= FL[f] + 5; y++) put(x, y, z, doors.some(d => Math.abs(x - d) <= 1) && y <= FL[f] + 2 ? 0 : MAT.brick(x, y, z)); };
    const loot = (x, y, z, f = 0) => put(x, y, z, make(B.CHEST, LOOT | f));
    const tome = (x, y, z, key) => { put(x, y, z, make(B.CASTLE_TOME, 0)); tomes.push({ x, y, z, key }); };
    const lamp = (x, y, z) => { put(x, y + 1, z, B.OAK_FENCE); put(x, y, z, B.SHINESTONE); };   // a lamp hanging from the ceiling
    const bed = (x, y, z, f) => { const [dx, dz] = [[0, 1], [1, 0], [0, -1], [-1, 0]][f]; put(x, y, z, make(B.BED, f)); put(x + dx, y, z + dz, make(B.BED, f | HEAD)); };
    // the partition walls on every floor: a front half and three back rooms
    for (let f = 0; f < 3; f++) {
      wallZ(-1, IX0, IX1, f, f === 2 ? [-12, 12] : [-15, 0, 15]);
      wallX(-8, IZ0, -2, f, [-10]); wallX(8, IZ0, -2, f, [-10]);
    }
    wallX(0, 0, IZ1, 2, [11]);   // the top floor's front half: two royal bedchambers

    // ---- ground floor: the Great Hall (front), kitchens (west), armory (east), the Hall of the Seal (middle back)
    for (const x of [-6, 6]) for (let z = 3; z <= 19; z++) { put(x, F, z, z === 3 || z === 19 ? B.OAK_FENCE : B.PLANKS); for (const bx of [x - 1, x + 1]) if (z % 2 === 0) put(bx, F, z, B.STONE_STEP); }   // banquet tables and benches
    for (let x = -3; x <= 3; x++) put(x, F, 20, B.PLANKS); put(0, F, 21, B.STONE_STEP);   // the head table
    for (const x of [-16, -9, 0, 9, 16]) for (const z of [5, 11, 17]) if (x !== -6 && x !== 6) lamp(x, F + 4, z);
    for (const sx of [-1, 1]) {   // a fireplace in each side wall
      const x = sx * IX1; box(x, F, 8, x, F + 3, 12, B.BRICKS); for (let z = 9; z <= 11; z++) { put(x, F, z, B.BRICKS); put(x, F + 1, z, B.FIRE); put(x, F + 2, z, 0); }
      for (const z of [4, 16]) for (const y of [F + 2, F + 3]) put(x - sx, y, z, make(B.CASTLE_BANNER, sx < 0 ? 1 : 3));
    }
    tome(-3, F, 21, "hall");
    // kitchens
    for (let z = IZ0; z <= -4; z += 2) put(IX0, F, z, B.FURNACE);
    put(-12, F, -20, B.TABLE); put(-16, F, -20, B.TABLE); for (let x = -18; x <= -11; x++) put(x, F, -14, B.PLANKS);
    put(-20, F, -4, B.HAY); put(-19, F, -4, B.HAY); put(-20, F + 1, -4, B.HAY);
    loot(-10, F, IZ0); loot(-10, F, -6);
    lamp(-15, F + 4, -18); lamp(-15, F + 4, -8);
    // armory: weapon racks (fences with banners), the smithing table, chests
    for (let z = -22; z <= -6; z += 4) { put(IX1, F, z, B.OAK_FENCE); put(IX1, F + 1, z, B.OAK_FENCE); put(IX1 - 1, F + 2, z, make(B.CASTLE_BANNER, 3)); }
    put(15, F, -20, B.SMITH_TABLE); put(18, F, -20, B.FURNACE); put(12, F, -12, B.IRON_BLOCK);
    loot(10, F, IZ0); loot(10, F, -4);
    lamp(15, F + 4, -18); lamp(15, F + 4, -8);
    // the Hall of the Seal: braziers flank the seal in the floor
    for (const sx of [-1, 1]) { put(sx * 4, F, -17, B.BRAZIER); put(sx * 4, F + 1, -17, B.FIRE); }
    for (const sx of [-1, 1]) for (const y of [F + 2, F + 3]) put(sx * 7, y, -22, make(B.CASTLE_BANNER, sx < 0 ? 1 : 3));
    tome(-5, F, -24, "seal");
    // stairs up (east side of the middle room) to the second floor
    const stair = (x0, x1, f, top) => {
      for (let k = 0; k < 14; k++) {
        const z = -3 - k, s = FL[f] + 0.5 + k * 0.5, whole = Math.floor(s);
        for (let x = x0; x <= x1; x++) { for (let y = FL[f]; y < whole; y++) put(x, y, z, MAT.brick(x, y, z)); if (s !== whole) put(x, whole, z, B.STONE_STEP); for (let y = whole + (s !== whole ? 1 : 0); y <= Math.min(top, whole + 3); y++) if (y >= FL[f] + 6) put(x, y, z, 0); }
      }
    };
    stair(5, 6, 0, FL[1] + 2); stair(-6, -5, 1, FL[2] + 2); stair(IX1, IX1, 2, KT + 2);

    // ---- second floor: the Grand Library (front), barracks (west), storerooms (east)
    for (const x of [-16, -10, 10, 16]) for (let z = 3; z <= 19; z++) if (z !== 11) { put(x, FL[1], z, B.BOOKSHELF); put(x, FL[1] + 1, z, B.BOOKSHELF); }
    for (let z = 2; z <= 20; z++) for (const x of [IX0, IX1]) for (let y = FL[1]; y <= FL[1] + 3; y++) put(x, y, z, B.BOOKSHELF);
    for (let x = -3; x <= 3; x++) { put(x, FL[1], 8, B.PLANKS); put(x, FL[1], 14, B.PLANKS); }
    tome(0, FL[1] + 1, 8, "library"); put(-2, FL[1] + 1, 14, B.BOOKSHELF); put(2, FL[1] + 1, 14, B.BOOKSHELF);
    for (const x of [-13, -6, 0, 6, 13]) for (const z of [5, 11, 17]) lamp(x, FL[1] + 4, z);
    for (let k = 0; k < 4; k++) { bed(-20, FL[1], -23 + k * 4, 1); bed(-13, FL[1], -23 + k * 4, 3); }   // barracks bunks
    loot(-10, FL[1], -24); lamp(-16, FL[1] + 4, -14);
    for (let x = 10; x <= 20; x += 2) for (let z = -24; z <= -20; z += 2) put(x, FL[1], z, (x + z) % 4 ? B.HAY : B.LOG);
    loot(20, FL[1], -6); loot(12, FL[1], -6); loot(16, FL[1], -14); lamp(15, FL[1] + 4, -12);

    // ---- top floor: two royal bedchambers (front), the royal study (west), the map room (east)
    for (const sx of [-1, 1]) {
      const cx = sx * 11;
      bed(cx - 1, FL[2], 18, 0); bed(cx + 1, FL[2], 18, 0);
      loot(cx + sx * 6, FL[2], 20); for (const z of [6, 12, 18]) lamp(cx, FL[2] + 4, z);
      for (let z = 3; z <= 6; z++) { put(cx - sx * 8, FL[2], z, B.BOOKSHELF); put(cx - sx * 8, FL[2] + 1, z, B.BOOKSHELF); }   // a reading corner
      box(cx + sx * 7, FL[2], 12, cx + sx * 8, FL[2] + 2, 13, B.PLANKS); put(cx + sx * 7, FL[2] + 1, 12, B.LOG);   // a wardrobe
      for (let x = cx - 2; x <= cx + 2; x++) put(x, FL[2], 15, B.STONE_STEP);   // a step at the foot of the beds
      put(cx - 2, FL[2], 20, B.BRAZIER); put(cx + 2, FL[2], 20, B.BRAZIER); put(cx - 2, FL[2] + 1, 20, B.FIRE); put(cx + 2, FL[2] + 1, 20, B.FIRE);   // bedside braziers
      for (const y of [FL[2] + 2, FL[2] + 3]) put(cx, y, IZ1, make(B.CASTLE_BANNER, 2));
    }
    tome(-16, FL[2], 3, "lady"); tome(16, FL[2], 3, "captain");
    for (let z = -24; z <= -4; z++) for (let y = FL[2]; y <= FL[2] + 2; y++) put(IX0, y, z, B.BOOKSHELF);
    put(-15, FL[2], -14, B.PLANKS); put(-14, FL[2], -14, B.PLANKS); tome(-15, FL[2] + 1, -14, "oath"); loot(-10, FL[2], -24); lamp(-15, FL[2] + 4, -14);
    put(14, FL[2], -14, B.MAP_TABLE); tome(16, FL[2], -14, "three"); loot(10, FL[2], -24); lamp(14, FL[2] + 4, -18);
  }
  // the keep's door is barred until the courtyard is won (js/citadel-keep.js lifts these bars)
  for (let x = -2; x <= 2; x++) for (let y = F; y <= F + (Math.abs(x) <= 1 ? 5 : 4); y++) put(x, y, KZ1 + 3, make(B.PORTCULLIS, 0));

  // 7c. THE FORGOTTEN DUNGEONS (Stage 4): under the courtyard, from a cellar stair in the kitchens to a spiral stair that
  // comes up in the annex behind the keep (the future throne room). Walk level y 22. The portal chamber's ward box
  // (|x|, |z| ≤ 12) and its spiral shaft are left alone. Rooms are built shells-first, so wherever two touch, they open.
  {
    const DW = F - 14, rooms = [];   // walk height down here: y 22
    const room = (x0, z0, x1, z1, h, floor) => rooms.push({ x0, z0, x1, z1, h, floor: floor || (() => B.STONE_BRICKS) });
    const corridor = (x0, z0, x1, z1) => room(x0, z0, x1, z1, 4, (x, z) => (x + z) % 5 ? B.STONE_BRICKS : B.CRACKED_BRICKS);
    const dark = (x, z) => ((x >> 1) + (z >> 1)) & 1 ? B.DARKSLATE_BRICKS : B.STONE_BRICKS;
    room(-26, -40, -16, -32, 5, dark);                 // the Guard Post
    corridor(-29, -33, -27, -31);   // (into the prison aisle)
    room(-50, -40, -30, -24, 6, dark);                 // the Prison Block
    corridor(-42, -23, -40, 13);                       // the Dart Gallery (arrow traps)
    room(-50, 14, -30, 32, 7, dark);                   // the Crypt
    corridor(-29, 22, -15, 24);
    room(-14, 16, 14, 30, 6, (x, z) => B.PLANKS);      // the Sunken Library
    corridor(15, 22, 29, 24);                          // (hidden pressure plates)
    room(30, 14, 46, 32, 6, dark);                     // the Lost Treasury
    corridor(39, -13, 41, 13);                         // the Collapsing Bridge
    room(30, -32, 46, -14, 7, dark);                   // the Lava Hall
    corridor(5, -31, 29, -29);                         // to the stone door and the spiral stair
    for (const q of rooms) for (let y = DW - 1; y <= DW + q.h; y++) for (let z = q.z0 - 1; z <= q.z1 + 1; z++) for (let x = q.x0 - 1; x <= q.x1 + 1; x++) {
      const edge = x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1 || y === DW - 1 || y === DW + q.h;
      if (edge && get(x, y, z) !== 0) put(x, y, z, y === DW - 1 && !(x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) ? q.floor(x, z) : MAT.brick(x, y, z));
    }
    for (const q of rooms) for (let y = DW; y < DW + q.h; y++) for (let z = q.z0; z <= q.z1; z++) for (let x = q.x0; x <= q.x1; x++) put(x, y, z, 0);
    const dlamp = (x, y, z) => put(x, y, z, B.SHINESTONE);
    // the cellar stair from the kitchens (half steps, 2 wide, down toward the back of the keep)
    for (let k = 0; k < 28; k++) {
      const z = -4 - k, s = F - 0.5 - k * 0.5, whole = Math.floor(s);
      for (const x of [-21, -20]) {
        for (let y = DW - 1; y < whole; y++) put(x, y, z, MAT.brick(x, y, z));
        if (s !== whole) put(x, whole, z, B.STONE_STEP);
        for (let y = whole + (s !== whole ? 1 : 0); y <= whole + 3; y++) put(x, y, z, 0);
      }
      for (const x of [-22, -19]) for (let y = DW - 1; y <= Math.min(whole + 4, G0 - 1); y++) if (get(x, y, z) !== 0 || y < G0) put(x, y, z, MAT.brick(x, y, z));
    }
    // the Guard Post: a watchfire (checkpoint), a weapon rack, a tome
    put(-24, DW, -39, B.WATCHFIRE); put(-17, DW, -39, make(B.CHEST, LOOT)); dlamp(-21, DW + 4, -36);
    // the Prison Block: cells behind iron bars (two broken open), skulls, a few lamps
    for (const [z0, z1, bz] of [[-40, -35, -34], [-29, -24, -30]]) {
      for (let x = -50; x <= -31; x++) {
        const cell = Math.floor((x + 50) / 5), wall = (x + 50) % 5 === 4;
        for (let y = DW; y < DW + 6; y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) if (wall) put(x, y, z, MAT.brick(x, y, z));
        if (!wall) for (let y = DW; y < DW + 4; y++) put(x, y, bz, (cell === 1 && bz === -34) || (cell === 2 && bz === -30) ? (y > DW + 1 ? make(B.PORTCULLIS, 0) : 0) : make(B.PORTCULLIS, 0));
        if (wall) for (let y = DW; y < DW + 6; y++) put(x, y, bz, MAT.brick(x, y, bz));
      }
      for (let cell = 0; cell < 4; cell++) { const cx = -48 + cell * 5, cz = bz === -34 ? -38 : -26; if (cell % 2) put(cx, DW, cz, B.SKULL); }
    }
    put(-43, DW, -38, make(B.CHEST, LOOT)); put(-38, DW, -26, make(B.CHEST, LOOT));
    for (const x of [-46, -36]) dlamp(x, DW + 5, -32);
    // the Dart Gallery: vents in the west wall (they warn with sparks before they fire)
    for (let z = -18; z <= 10; z += 4) { put(-43, DW + 1, z, B.TRAP_VENT); put(-41, DW, z, B.STONE_PLATE); }
    for (const z of [-20, 0, 12]) dlamp(-39, DW + 3, z);
    // the Crypt: rows of stone tombs, candles, a tome, a watchfire by the way out
    for (let x = -47; x <= -33; x += 5) for (const z of [18, 24]) { box(x, DW, z, x + 2, DW, z + 3, B.STONE_BRICKS); put(x + 1, DW + 1, z + 1, B.SKULL); put(x - 1, DW, z, B.WARD_CANDLE); }
    for (const x of [-46, -40, -34]) dlamp(x, DW + 6, 28);
    put(-31, DW, 21, B.WATCHFIRE);
    // the Sunken Library: shelves, a reading desk, a chest, lamps
    for (const x of [-12, -7, 7, 12]) for (let z = 18; z <= 28; z++) if (z !== 23) for (let y = DW; y <= DW + 2; y++) put(x, y, z, B.BOOKSHELF);
    for (let x = -2; x <= 2; x++) put(x, DW, 27, B.PLANKS); put(3, DW, 29, make(B.CHEST, LOOT));
    for (const x of [-10, 0, 10]) dlamp(x, DW + 5, 23);
    // the hidden pressure plates on the way to the treasury (vents in the north wall)
    for (const x of [18, 22, 26]) put(x, DW + 1, 21, B.TRAP_VENT);
    // the Lost Treasury: gold, chests, a watchfire, and the shortcut stair up to the courtyard (opened from below)
    for (const [x, z] of [[33, 30], [44, 16], [36, 17], [43, 29]]) { put(x, DW, z, B.GOLD_BLOCK); if ((x + z) % 2) put(x, DW + 1, z, B.GOLD_BLOCK); }
    put(31, DW, 31, make(B.CHEST, LOOT)); put(45, DW, 31, make(B.CHEST, LOOT)); put(38, DW, 15, make(B.CHEST, LOOT));
    put(32, DW, 16, B.WATCHFIRE); for (const x of [34, 42]) dlamp(x, DW + 5, 23);
    const HX = 42, HZ = 26;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const d = Math.hypot(dx, dz); if (d > 2.5) continue;
      for (let y = DW; y <= G0; y++) put(HX + dx, y, HZ + dz, 0);
      put(HX + dx, G0, HZ + dz, B.STONE_BRICKS);   // the hatch, flush with the courtyard (the lever below opens it)
      if (d < 0.5) { for (let y = DW - 1; y <= G0 - 1; y++) put(HX, y, HZ, MAT.brick(HX, y, HZ)); continue; }
      const s = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * 8) % 8;
      for (let y = DW - 1 + s; y <= G0 - 1; y += 8) put(HX + dx, y, HZ + dz, MAT.brick(HX + dx, y, HZ + dz));
    }
    for (let y = DW; y <= G0 - 1; y++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const d = Math.hypot(dx, dz); if (d > 2.5 && d <= 3.4 && get(HX + dx, y, HZ + dz) !== 0 && !(y < DW + 4 && dx <= -2)) put(HX + dx, y, HZ + dz, MAT.brick(HX + dx, y, HZ + dz)); }
    put(HX - 3, DW, HZ - 2, MAT.dark()); put(HX - 3, DW + 1, HZ - 2, B.CASTLE_LEVER);   // the shortcut lever, on a post
    // the Collapsing Bridge: cracked tiles over a pit (water at the bottom; steps lead back up)
    for (let z = -6; z <= 6; z++) for (let x = 38; x <= 42; x++) { for (let y = DW - 8; y < DW; y++) put(x, y, z, y <= DW - 7 ? B.WATER : 0); put(x, DW - 9, z, B.STONE_BRICKS); }
    for (let z = -6; z <= 6; z++) for (const x of [37, 43]) for (let y = DW - 9; y < DW; y++) put(x, y, z, MAT.brick(x, y, z));
    for (let z = -7; z <= 7; z += 14) for (let x = 37; x <= 43; x++) for (let y = DW - 9; y < DW; y++) put(x, y, z, MAT.brick(x, y, z));
    for (let z = -6; z <= 6; z++) for (let x = 39; x <= 41; x++) put(x, DW - 1, z, B.CRACKED_FLOOR);
    for (let k = 0; k < 7; k++) put(42, DW - 7 + k, -1 + k, B.STONE_BRICKS);   // steps back up out of the pit (toward the treasury side)
    put(42, DW - 1, 6, B.STONE_BRICKS); for (let z = 2; z <= 6; z++) for (let y = DW; y <= DW + 1; y++) put(42, y, z, 0);   // (head room for the top steps)
    // the Lava Hall: a fenced walkway across lava, lit by its own glow; the lever for the stone door is at the far end
    for (let z = -32; z <= -14; z++) for (let x = 30; x <= 46; x++) {
      const walk = (x >= 38 && x <= 41) || (z >= -31 && z <= -29 && x <= 41);
      if (!walk) { put(x, DW - 1, z, B.LAVA); put(x, DW - 2, z, B.STONE_BRICKS); }
    }
    // stone curbs with fence railings along both sides of the walkway (gaps every few blocks, so it still feels open)
    const rail = (x, z, k) => { put(x, DW - 1, z, MAT.dark()); put(x, DW, z, k % 3 === 2 ? 0 : B.OAK_FENCE); };
    for (let z = -28; z <= -14; z++) { rail(37, z, z); rail(42, z, z); }
    for (let x = 30; x <= 36; x++) rail(x, -28, x);
    for (let x = 30; x <= 42; x++) rail(x, -32, x);

    put(41, DW + 1, -33, B.CASTLE_LEVER); put(33, DW, -31, B.WATCHFIRE);
    // the stone door (ancient ward stone; the lever opens it) and the spiral stair up into the annex
    for (let z = -31; z <= -29; z++) for (let y = DW; y <= DW + 2; y++) { put(5, y, z, B.WARD_BRICKS); put(4, y, z, 0); }
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const d = Math.hypot(dx, dz), X = dx, Z = -30 + dz; if (d > 2.5) continue;
      for (let y = DW; y <= G0 + 3; y++) put(X, y, Z, 0);
      if (d < 0.5) { for (let y = DW - 1; y <= G0 - 1; y++) put(X, y, Z, MAT.dark()); continue; }
      const s = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * 8) % 8;
      for (let y = DW - 1 + s; y <= G0; y += 8) put(X, y, Z, MAT.dark());
    }
    for (let y = DW; y <= G0 - 1; y++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const d = Math.hypot(dx, dz); if (d > 2.5 && d <= 3.4) put(dx, y, -30 + dz, dx >= 2 && y < DW + 3 && Math.abs(dz) <= 1 ? 0 : MAT.brick(dx, y, -30 + dz)); }   // (with a doorway from the corridor)
    put(3, DW, -32, B.WATCHFIRE);
    // the annex: no longer opens from the keep (the dungeon is the way in); sealed with ancient ward stone
    box(-2, F, KZ0, 2, F + 4, KZ0 + 1, B.WARD_BRICKS);
    tomes.push({ x: -25, y: DW, z: -33, key: "prison" }); put(-25, DW, -33, make(B.CASTLE_TOME, 0));
    tomes.push({ x: -40, y: DW, z: 30, key: "crypt" }); put(-40, DW, 30, make(B.CASTLE_TOME, 0));
    tomes.push({ x: 0, y: DW + 1, z: 27, key: "sunken" }); put(0, DW + 1, 27, make(B.CASTLE_TOME, 0));
    tomes.push({ x: 38, y: DW, z: -15, key: "lava" }); put(38, DW, -15, make(B.CASTLE_TOME, 0));
  }
  // 7d. THE ROYAL TREASURY (Stage 4): hidden inside the keep's front-east tower. The keep's four corner towers are walled
  // off from the rooms (their insides were open shafts); the treasury fills the front-east one at the library's level.
  // A worn bookshelf in the library's east wall swings two shelves aside (js/citadel-dungeon.js).
  {
    for (const [tx, tz] of [[-KX, KZ0], [KX, KZ0], [-KX, KZ1], [KX, KZ1]]) for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      const x = tx + dx, z = tz + dz; if (Math.hypot(dx, dz) >= 3.6 || Math.abs(x) > KX - 2 || z < KZ0 + 2 || z > KZ1 - 2) continue;
      for (let y = F; y < KT; y++) put(x, y, z, y >= F + 7 && y <= F + 10 && tx > 0 && tz > 0 ? B.BOOKSHELF : MAT.brick(x, y, z));
    }
    const VX = KX, VZ = KZ1, V0 = F + 6;   // the treasury's floor (y 42), walk y 43 (the library's level)
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      const x = VX + dx, z = VZ + dz, d = Math.hypot(dx, dz), keepSide = Math.abs(x) <= KX - 2 && z <= KZ1 - 2;
      if (d < 3.6 && !keepSide) {
        for (let y = F; y < V0; y++) put(x, y, z, MAT.brick(x, y, z));
        put(x, V0, z, d > 2.4 ? B.GOLD_BLOCK : B.QUARTZ_BLOCK);
        for (let y = V0 + 1; y <= V0 + 9; y++) put(x, y, z, 0);
        put(x, V0 + 10, z, B.QUARTZ_BLOCK);
      } else if (d >= 3.6 && d < 4.6 && !keepSide) { for (const y of [V0 + 1, V0 + 6]) put(x, y, z, B.GOLD_BLOCK); if ((dx + dz) % 2 === 0) put(x, V0 + 9, z, B.SHINESTONE); }
    }
    put(VX, V0 + 1, VZ, B.GOLD_BLOCK); put(VX, V0 + 2, VZ, make(B.CHEST, 0));   // the central pedestal and the royal chest
    put(VX + 2, V0 + 1, VZ - 1, make(B.CHEST, LOOT)); put(VX - 1, V0 + 1, VZ + 2, make(B.CHEST, LOOT));
    for (const [x, z] of [[VX + 2, VZ + 2], [VX - 2, VZ - 1]]) { put(x, V0 + 1, z, B.BRAZIER); put(x, V0 + 2, z, B.FIRE); }
    put(VX + 2, V0 + 1, VZ + 1, B.IRON_BLOCK); put(VX + 2, V0 + 2, VZ + 1, B.SKULL);   // an old helm on a stand
    put(VX + 1, V0 + 1, VZ + 2, B.OAK_FENCE); put(VX + 1, V0 + 2, VZ + 2, B.OAK_FENCE);   // a weapon rack
    tomes.push({ x: VX + 1, y: V0 + 1, z: VZ - 2, key: "vault" }); put(VX + 1, V0 + 1, VZ - 2, make(B.CASTLE_TOME, 0));
    // the tower's wall bulges into the library's corner: at the library's level it's lined with books, and the secret
    // door runs through it (three shelves deep), opened by the worn bookshelf in the east wall
    for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) { const x = VX + dx, z = VZ + dz, d = Math.hypot(dx, dz); if (d >= 3.6 && d <= 5.2 && Math.abs(x) <= KX - 2 && z <= KZ1 - 2) for (let y = F + 7; y <= F + 10; y++) put(x, y, z, B.BOOKSHELF); }
    for (let x = KX - 4; x <= KX - 2; x++) for (let y = F + 7; y <= F + 10; y++) put(x, y, KZ1 - 3, B.BOOKSHELF);
    put(KX - 1, F + 7, KZ1 - 3, 0); put(KX - 1, F + 8, KZ1 - 3, 0);
    put(KX - 2, F + 9, KZ1 - 5, B.WORN_BOOKSHELF);
  }

  // 7e. THE THRONE ROOM (Stage 5): a tall vaulted hall behind the keep (it replaces the annex). The only way in is the
  // dungeon's spiral stair, which comes up in its floor. The Fallen Castellan waits before the raised throne at the west
  // end. When he falls, the ward-stone doorway into the keep's Hall of the Seal dissolves and the Seal opens.
  {
    const TX0 = -15, TX1 = 15, TZ0 = -39, TZ1 = KZ0 - 1, ZM = (TZ0 + TZ1) / 2;   // interior; ZM = the vault's middle line
    const helix = (x, z) => Math.hypot(x, z + 30) <= 2.6;
    box(TX0 - 2, F, TZ0 - 2, TX1 + 2, 62, TZ1, (x, y, z) => helix(x, z) && y <= F + 3 ? undefined : 0);   // clear the old annex
    for (let z = TZ0 - 2; z <= TZ1; z++) for (let x = TX0 - 2; x <= TX1 + 2; x++) {
      const wall = x < TX0 || x > TX1 || z < TZ0;
      const vault = 47 + Math.round(5 * Math.sqrt(Math.max(0, 1 - ((z - ZM) / 6.6) ** 2)));   // the ceiling arches across the hall
      if (!helix(x, z)) put(x, G0, z, wall ? MAT.dark() : (Math.abs(z - ZM) <= 1 && x > -11 ? B.ROOF_TILES : ((x + z) & 1 ? B.DARKSLATE_BRICKS : B.QUARTZ_BLOCK)));   // checkered floor, a red runner
      for (let y = F; y <= 56; y++) {
        if (wall) {
          const along = z < TZ0 ? x : z, window = (along + 60) % 6 < 2 && y >= F + 4 && y <= F + 12 && (z < TZ0 ? Math.abs(x) <= 12 : z <= -30 && z >= TZ0 + 1);   // tall windows
          put(x, y, z, y <= F + 1 ? MAT.dark() : window && (x === TX0 - 2 || x === TX1 + 2 || z === TZ0 - 2) ? B.STAINED_GLASS : window ? 0 : MAT.brick(x, y, z));
        } else if (y > vault) put(x, y, z, MAT.brick(x, y, z));
      }
    }
    for (let k = 0; k < 8; k++) box(TX0 - 3, 57 + k, TZ0 - 3 + k, TX1 + 3, 57 + k, TZ1 - k, MAT.roof());   // a red roof over it
    // pillars with gold capitals; banners between the windows; braziers along the runner; chandeliers in the vault
    for (const [x, z] of [[-8, -29], [7, -29], [12, -29], [-8, -38], [-2, -38], [4, -38], [10, -38]]) { box(x, F, z, x, 51, z, MAT.dark()); put(x, 46, z, B.GOLD_BLOCK); }
    for (const sx of [TX0, TX1]) for (const z of [-37, -31]) for (let y = F + 3; y <= F + 8; y++) put(sx, y, z, make(B.CASTLE_BANNER, sx < 0 ? 1 : 3));
    for (const x of [-6, 6, 12]) for (const z of [ZM - 2.5, ZM + 2.5]) { put(x, F, Math.round(z), B.BRAZIER); put(x, F + 1, Math.round(z), B.FIRE); }
    for (const x of [-9, -3, 3, 9]) { put(x, 50, Math.round(ZM), B.OAK_FENCE); put(x, 49, Math.round(ZM), B.SHINESTONE); }
    // the dais (three steps) and the throne
    for (let s = 0; s < 3; s++) box(TX0, F + s, TZ0 + 2 + s, TX0 + 4 - s, F + s, TZ1 - 2 - s, s === 2 ? B.QUARTZ_BLOCK : MAT.dark());
    const TY = F + 3, TZT = Math.round(ZM);
    box(TX0, TY, TZT - 1, TX0, TY + 3, TZT + 1, (x, y, z) => z === TZT && y === TY + 3 ? B.GOLD_BLOCK : B.DARKSLATE_BRICKS); put(TX0, TY + 4, TZT, B.GOLD_BLOCK);   // the throne's high back
    put(TX0 + 1, TY, TZT, B.GOLD_BLOCK); put(TX0 + 1, TY, TZT - 1, B.STONE_STEP); put(TX0 + 1, TY, TZT + 1, B.STONE_STEP);   // the seat and arms
    for (const z of [TZT - 3, TZT + 3]) { put(TX0 + 1, TY - 1, z, B.BRAZIER); put(TX0 + 1, TY, z, B.FIRE); }
    for (let y = TY + 5; y <= TY + 9; y++) put(TX0, y, TZT, make(B.CASTLE_BANNER, 1));   // a great banner above the throne
    tomes.push({ x: TX1 - 1, y: F, z: TZ1 - 1, key: "throne" }); put(TX1 - 1, F, TZ1 - 1, make(B.CASTLE_TOME, 0));
  }

  // 8. the Hollow portal chamber under the keep (ward bricks all round, so nobody can dig in), and the sealed spiral stair
  const PY = C.portalY;
  box(-12, PY - 3, -12, 12, G0 - 1, 12, (x, y, z) => (Math.abs(x) === 12 || Math.abs(z) === 12 || y === PY - 3 || y === G0 - 1) ? MAT.ward() : 0);
  box(-11, PY - 2, -11, 11, PY - 2, 11, (x, y, z) => ((x + z) % 2 === 0 ? MAT.dark() : B.STONE_BRICKS));
  box(-3, PY - 1, -3, 3, PY - 1, 3, MAT.ward());                                  // the dais
  for (const [x, z] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) { box(x, PY - 1, z, x, G0 - 2, z, MAT.ward()); put(x, PY + 4, z, B.SHINESTONE); put(x, PY + 9, z, B.SHINESTONE); }
  for (const [x, y, z] of frameSpots({ x: 0, y: PY, z: 0 })) put(x, y, z, B.END_FRAME);
  for (const [x, z] of [[-5, 0], [5, 0], [0, -5], [0, 5]]) put(x, G0 - 2, z, B.SHINESTONE);
  // the ceremonial chamber (Stage 5): glowing seal-stone carvings set into the walls, gold-capped pillars, a red runner
  // from the stair door to the dais, banners, and a ring of light around the portal
  for (let y = PY + 1; y <= PY + 7; y += 3) for (let k = -10; k <= 10; k += 4) for (const [x, z] of [[k, -12], [k, 12], [-12, k], [12, k]]) if (!(z === -12 && Math.abs(x) <= 1)) put(x, y, z, B.CASTELLAN_SEAL);
  for (const [x, z] of [[-7, -7], [7, -7], [-7, 7], [7, 7], [-9, 0], [9, 0]]) { box(x, PY - 1, z, x, G0 - 2, z, MAT.ward()); put(x, G0 - 3, z, B.GOLD_BLOCK); put(x, PY - 1, z, B.GOLD_BLOCK); }
  for (let z = -11; z <= -4; z++) for (let x = -1; x <= 1; x++) put(x, PY - 2, z, B.ROOF_TILES);
  for (const sx of [-11, 11]) for (const z of [-4, 4]) for (let y = PY + 2; y <= PY + 6; y++) put(sx, y, z, make(B.CASTLE_BANNER, sx < 0 ? 1 : 3));
  for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; put(Math.round(Math.cos(t) * 5), PY - 2, Math.round(Math.sin(t) * 5), B.SHINESTONE); }
  for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; put(Math.round(Math.cos(t) * 8), G0 - 2, Math.round(Math.sin(t) * 8), B.SHINESTONE); }   // a ring of lights in the ceiling (Stage 6)
  for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) { put(x, PY - 1, z, B.BRAZIER); put(x, PY, z, B.FIRE); }
  // the spiral stair: from a door in the chamber's north wall up to the keep floor, capped by the seal
  const HX = 0, HZ = -17;
  box(HX - 3, PY - 3, HZ - 3, HX + 3, G0 - 1, HZ + 4, MAT.ward());
  box(-1, PY - 1, -13, 1, PY + 1, -12, 0);
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const d = Math.hypot(dx, dz); if (d > 2.5) continue;
    for (let y = PY - 1; y <= G0 - 1; y++) put(HX + dx, y, HZ + dz, 0);
    if (d < 0.5) { for (let y = PY - 2; y <= G0 - 2; y++) put(HX, y, HZ, MAT.ward()); continue; }
    const s = Math.floor(((Math.atan2(dz, dx) + Math.PI) / (Math.PI * 2)) * 8) % 8;
    for (let y = PY - 2 + s; y <= G0 - 1; y += 8) put(HX + dx, y, HZ + dz, MAT.ward());
  }
  box(-1, PY - 1, -14, 1, PY + 1, -12, 0);
  disk(HX, HZ, 2.6, G0, B.CASTELLAN_SEAL);                                          // the seal in the keep floor (Stage 5 opens it)
  return { cells, banners, lamps, tomes };
}

// Turn the canonical castle so its gate faces another way (rot × 90°); banner facings turn with it
function rotated(base, rot) {
  if (!rot) return base.cells;
  const out = new Uint16Array(S * S * HEIGHT).fill(KEEP), turn = (x, z) => { for (let k = 0; k < rot; k++) [x, z] = [-z, x]; return [x, z]; };
  for (let z = -O; z <= O; z++) for (let x = -O; x <= O; x++) {
    const [rx, rz] = turn(x, z), a = (x + O) + (z + O) * S, b = (rx + O) + (rz + O) * S;
    for (let y = 0; y < HEIGHT; y++) {
      let v = base.cells[a + y * S * S];
      if (v !== KEEP && TURNS.has(v & 0xFFFF00FF)) { const m = (v >> 8) & 255; v = make(v & 0xFFFF00FF, (m & ~3) | (((m & 3) + rot * 3) % 4)); }   // facing turns with the castle
      out[b + y * S * S] = v;
    }
  }
  return out;
}
const TURNS = new Set([B.CASTLE_BANNER, B.PORTCULLIS, B.BED, B.CHEST, B.CASTLE_TOME]);
let canonical = null; const turnedCache = {};
export const citadelTomes = () => (canonical = canonical || buildCanonical()).tomes;
export function citadelCells(rot) {
  canonical = canonical || buildCanonical();
  return turnedCache[rot] || (turnedCache[rot] = rotated(canonical, rot));
}
// world offset → canonical (undo the turn)
export const toLocal = (dx, dz, rot) => { for (let k = 0; k < rot; k++) [dx, dz] = [dz, -dx]; return [dx, dz]; };
export const toWorld = (lx, lz, rot) => { for (let k = 0; k < rot; k++) [lx, lz] = [-lz, lx]; return [lx, lz]; };

// ---------- the land around it: the island, the lake, the arched bridge, the shore blending into natural land ----------
const GROUND = new Set([B.GRASS, B.DIRT, B.SAND, B.STONE, B.SANDSTONE, B.GRAVEL, B.CLAY, B.SNOW, B.COBBLE, B.MOSSY]);
const PLANT = new Set([B.LOG, B.LEAVES, B.BIRCH_LOG, B.BIRCH_LEAVES, B.TALL_GRASS, B.FLOWER_RED, B.FLOWER_YELLOW, B.SAPLING, B.BERRY_BUSH]);
export function citadelLand(cx, cz, rot) {
  const R = C.shore + 4;
  return { x: cx - R, z: cz - R, size: R * 2 + 1, citadelLand: true, apply(gen, data, x0, z0) {
    const idx = (lx, y, lz) => lx + lz * 16 + y * 256;
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      const x = x0 + lx, z = z0 + lz, [u, v] = toLocal(x - cx, z - cz, rot), d = Math.hypot(u, v);
      if (d > C.shore + 3) continue;
      let yT = 0; for (let y = HEIGHT - 2; y > 0; y--) { const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if (GROUND.has(id)) { yT = y; break; } }
      if (!yT) yT = SEA - 6;
      const col = (top, topId, under, waterTo) => {   // set the column: solid to `top`, water to `waterTo`, then open sky
        for (let y = Math.min(yT, top) - 4; y <= top; y++) if (y > 0) data[idx(lx, y, lz)] = y === top ? topId : y >= top - 3 ? under : B.STONE;
        for (let y = top + 1; y <= HEIGHT - 2; y++) { const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if (y <= waterTo) data[idx(lx, y, lz)] = B.WATER; else if (y <= Math.max(yT, top) + 16 || PLANT.has(id) || id === B.WATER) data[idx(lx, y, lz)] = 0; }
      };
      const onBridge = Math.abs(u) <= C.bridgeHalf + 1 && v > 40;
      if (d <= C.island) {
        const beach = d > C.island - 4, top = beach ? G0 - Math.round(d - (C.island - 4)) : G0;
        col(top, beach ? B.SAND : (Math.abs(u) <= 2 && v > 52 ? B.SAND : B.GRASS), beach ? B.SAND : B.DIRT, -1);
      } else if (d <= C.lake) {
        const t = (d - C.island) / (C.lake - C.island), floor = SEA - 2 - Math.round(5 * Math.sin(Math.PI * t));
        col(floor, hashL(x, 0, z) < 0.3 ? B.GRAVEL : B.SAND, B.SAND, SEA);
      } else {
        // the shore: from the water's edge up to the natural ground (a raised landing where the bridge arrives)
        const t = (d - C.lake) / (C.shore - C.lake), land = smooth01(1 - (Math.abs(u) - 6) / 8) * smooth01(v / 40);
        const g = SEA + 1 + (G0 - SEA - 1) * land, target = Math.round(g + (yT - g) * smooth01(t));
        const nat = data[idx(lx, yT, lz)] & 0xFFFF00FF;
        col(target, t < 0.25 && land < 0.5 ? B.SAND : (nat === B.SAND || nat === B.SANDSTONE ? B.SAND : B.GRASS), B.DIRT, target < SEA ? SEA : -1);
      }
      // the bridge over the lake: a deck at the island's level, parapets with merlons, and arches between piers
      const vr = Math.round(v), gap = Math.abs(u) <= C.bridgeHalf && vr >= GATE.v0 && vr <= GATE.v1;
      if (onBridge && d > C.island - 6 && d <= C.lake + 2 && !gap) {   // (the gap is open water until the drawbridge comes down)
        const a = Math.abs(u), seg = ((Math.floor(v) % 9) + 9) % 9, pier = seg <= 1;
        const lowest = pier ? 1 : Math.round(SEA + 1 + 2 * Math.sin(Math.PI * (seg - 1) / 8));
        for (let y = lowest; y <= G0; y++) if (pier || y >= lowest) {
          if (!pier && y < lowest) continue;
          data[idx(lx, y, lz)] = a <= C.bridgeHalf ? (y === G0 ? B.STONE_BRICKS : (y >= G0 - 1 || pier ? (hashL(x, y, z) < 0.1 ? B.CRACKED_BRICKS : B.STONE_BRICKS) : (y === lowest ? B.DARKSLATE_BRICKS : B.STONE_BRICKS))) : data[idx(lx, y, lz)];
        }
        if (a === C.bridgeHalf) { data[idx(lx, G0 + 1, lz)] = B.STONE_BRICKS; if (seg % 2 === 0) data[idx(lx, G0 + 2, lz)] = B.STONE_BRICKS; if (seg === 0) { data[idx(lx, G0 + 3, lz)] = B.TORCH; } }
        else if (a < C.bridgeHalf) for (let y = G0 + 1; y <= G0 + 4; y++) data[idx(lx, y, lz)] = 0;
        // stone posts at each side of the hinge: the drawbridge's chains hang from their tops
        if (vr === GATE.hinge && a === C.bridgeHalf) for (let y = G0 + 1; y <= G0 + 9; y++) data[idx(lx, y, lz)] = y === G0 + 9 ? B.DARKSLATE_BRICKS : B.STONE_BRICKS;
        // the raised drawbridge: a wall of timber standing on the hinge row (it swings down over the gap)
        if (vr === GATE.hinge && a <= GATE.half) for (let y = G0 + 1; y <= G0 + GATE.panelTop; y++) data[idx(lx, y, lz)] = a === GATE.half || y === G0 + 1 || y === G0 + GATE.panelTop ? B.LOG : B.PLANKS;
      }
      // two watchtowers at the shore end of the bridge (archers keep watch from their tops)
      for (const [tx, tz] of GATE.towers) {
        const r = Math.hypot(u - tx, v - tz); if (r > 2.6) continue;
        let top = 0; for (let y = HEIGHT - 2; y > 0; y--) if (GROUND.has(data[idx(lx, y, lz)] & 0xFFFF00FF)) { top = y; break; }
        for (let y = Math.max(1, top - 2); y <= GATE.towerTop + 1; y++) {
          const shell = r >= 1.5, base = y <= top + 1;
          data[idx(lx, y, lz)] = y === GATE.towerTop ? B.PLANKS : y === GATE.towerTop + 1 ? (shell && (x + z) % 2 === 0 ? B.STONE_BRICKS : 0) : (shell || y <= top ? (base ? B.DARKSLATE_BRICKS : (hashL(x, y, z) < 0.12 ? B.CRACKED_BRICKS : B.STONE_BRICKS)) : 0);
        }
      }
      // the outer Gate Winch, on the landing beside the bridge
      if (Math.round(u) === GATE.winch[0] && vr === GATE.winch[1]) {
        let top = 0; for (let y = HEIGHT - 2; y > 0; y--) if (GROUND.has(data[idx(lx, y, lz)] & 0xFFFF00FF)) { top = y; break; }
        if (top) data[idx(lx, top + 1, lz)] = B.GATE_WINCH;
      }
      // trees and leaves left hanging near the shore
      if (d > C.lake && d <= C.shore + 3) for (let y = 1; y < HEIGHT - 1; y++) { const id = data[idx(lx, y, lz)] & 0xFFFF00FF; if ((id === B.LEAVES || id === B.BIRCH_LEAVES) && d < C.shore - 6) data[idx(lx, y, lz)] = 0; }
    }
  } };
}
// the portal frames (after the castle): like the old strongholds, about one in ten already holds an eye
export function citadelFrames(cx, cz) {
  return { x: cx - 3, z: cz - 3, size: 7, apply(gen, data, x0, z0) {
    for (const [x, y, z] of frameSpots({ x: cx, y: C.portalY, z: cz })) {
      if (x < x0 || x >= x0 + 16 || z < z0 || z >= z0 + 16) continue;
      data[(x - x0) + (z - z0) * 16 + y * 256] = make(B.END_FRAME, hash3(gen.seed, x, 31, z) < 0.1 ? EYE_IN : 0);
    }
  } };
}

// ---------- per world: which strongholds become citadels (decided once, saved in story.citadel) ----------
export function initCitadel({ G, L }) {
  const A = {};
  const st = () => G.story.citadel || (G.story.citadel = { v: CITADEL.version, spots: {} });
  const R = CITADEL.shore + 4;
  function chunksAround(cx, cz, r) { const out = []; for (let gx = Math.floor((cx - r) / 16); gx <= Math.floor((cx + r) / 16); gx++) for (let gz = Math.floor((cz - r) / 16); gz <= Math.floor((cz + r) / 16); gz++) out.push(gx + "," + gz); return out; }
  // other planned places (centers and how far they reach)
  function others() {
    const out = [], lost = G.story.lost || {};
    if (lost.site) out.push({ what: "Echohold excavation", x: lost.site.x + 16, z: lost.site.z + 16, r: 20 });
    for (const [k, t] of Object.entries(lost.tsites || {})) if (t) out.push({ what: k + " temple", x: t.x + 16, z: t.z + 16, r: k === "desert" && lost.monument && lost.monument.on ? 100 : t.lake ? t.lake.r1 + 4 : 22 });
    for (const a of L.avoid || []) out.push({ what: "home", x: a.x + 16, z: a.z + 16, r: 24 });
    const lev = G.story.leviathan && G.story.leviathan.sites; if (lev) for (const [k, q] of Object.entries(lev)) if (q && q.x != null) out.push({ what: "relic site " + k, x: q.x + 32, z: q.z + 32, r: 48 });
    const cp = G.story.campaign; if (cp && cp.village) out.push({ what: "Legacy Village", x: cp.village.cx, z: cp.village.cz, r: 90 });
    if (cp && cp.sites) for (const [k, q] of Object.entries(cp.sites)) if (q && q.cx != null) out.push({ what: "campaign " + k, x: q.cx, z: q.cz, r: 40 });
    return out;
  }
  function decide(gen, data, s, i) {
    const mods = data.mods || {}, visited = new Set(data.visited || []), why = [];
    const keys = chunksAround(s.x, s.z, R);
    const changed = keys.filter(k => mods[k] && (Array.isArray(mods[k]) ? mods[k].length : Object.keys(mods[k]).length));
    if (changed.length) why.push({ kind: "changed", chunks: changed.length });
    for (const o of others()) if (Math.hypot(o.x - s.x, o.z - s.z) < R + o.r) why.push({ kind: "overlap", what: o.what });
    const skip = new Set();
    for (const k of keys) {
      const [gx, gz] = k.split(",").map(Number), v = gen.villageAt && gen.villageAt(gx, gz); if (!v || skip.has(v.vx + "," + v.vz)) continue;
      let seen = false; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const q = (v.vx + a) + "," + (v.vz + b); if (visited.has(q) || mods[q]) seen = true; }
      if (seen) { if (!why.some(w => w.village === v.vx + "," + v.vz)) why.push({ kind: "village", village: v.vx + "," + v.vz }); } else skip.add(v.vx + "," + v.vz);
    }
    // the gate faces the world's spawn
    const sp = gen.findSpawn(), dx = sp.x - s.x, dz = sp.z - s.z;
    const rot = Math.abs(dz) >= Math.abs(dx) ? (dz > 0 ? 0 : 2) : (dx > 0 ? 3 : 1);
    return why.length ? { on: false, why: "conflict", conflicts: why } : { on: true, rot, skipVillages: [...skip] };
  }
  A.prepare = (gen, data) => {
    const s = st();
    if (!gen.strongholds) return;
    // a brand-new world (nothing explored or changed yet) can move a stronghold outward a little, along the same line from
    // the middle, when something else already claimed its spot (a Legacy Campaign village, a ruin): then it still gets its
    // castle. Saved worlds never move a stronghold. Moved spots are saved and applied before anything is generated.
    const fresh = !(data.visited || []).length && !Object.keys(data.mods || {}).length;
    gen.strongholds.forEach((sh, i) => {
      if (s.spots[i] && s.spots[i].moved) { sh.x = s.spots[i].moved.x; sh.z = s.spots[i].moved.z; }
      if (!s.spots[i]) {
        let d = decide(gen, data, sh, i);
        if (!d.on && fresh && d.conflicts.every(c => c.kind === "overlap")) {
          const a = Math.atan2(sh.z, sh.x), r0 = Math.hypot(sh.x, sh.z);
          for (let k = 1; k <= 30 && !d.on; k++) {
            const step = Math.ceil(k / 5), turn = [0, 0.18, -0.18, 0.36, -0.36][(k - 1) % 5];   // further out, and a little to either side
            const cand = { x: Math.round(Math.cos(a + turn) * (r0 + step * 50)), y: sh.y, z: Math.round(Math.sin(a + turn) * (r0 + step * 50)) };
            if (gen.strongholds.some((o, j) => j !== i && Math.hypot(o.x - cand.x, o.z - cand.z) < 2 * R)) continue;
            const dd = decide(gen, data, cand, i); if (dd.on) d = { ...dd, moved: { x: cand.x, z: cand.z } };
          }
          if (d.moved) { sh.x = d.moved.x; sh.z = d.moved.z; }
        }
        s.spots[i] = d;
      }
      const d = s.spots[i];
      sh.citadel = !!d.on;
      if (!d.on) return;
      if (d.skipVillages && d.skipVillages.length) { gen.skipVillages = gen.skipVillages || new Set(); for (const k of d.skipVillages) gen.skipVillages.add(k); }
      gen.stamps = gen.stamps || [];
      gen.stamps.push(citadelLand(sh.x, sh.z, d.rot), { x: sh.x - O, z: sh.z - O, size: S, cells: citadelCells(d.rot), citadel: i }, citadelFrames(sh.x, sh.z));
    });
  };
  // the castles (and any old strongholds) for the Explorer's Map
  A.landmarks = () => {
    const gen = G.gen; if (!gen || !gen.strongholds) return [];
    const s = st();
    return gen.strongholds.map((sh, i) => {
      const d = s.spots[i];
      if (d && d.on) { const [gx, gz] = toWorld(0, C.lake + 6, d.rot); return { kind: "endwatch" + i, title: "Endwatch Citadel", name: "The bridge", x: sh.x + gx, y: G0 + 1, z: sh.z + gz, center: { x: sh.x, z: sh.z }, castle: true }; }
      return { kind: "endwatch" + i, title: "Old Stronghold", name: "Buried below", x: sh.x, y: sh.y, z: sh.z, center: { x: sh.x, z: sh.z }, castle: false };
    });
  };
  A.info = i => { const s = st(), d = s.spots[i], sh = G.gen && G.gen.strongholds && G.gen.strongholds[i]; return d && sh ? { ...d, x: sh.x, z: sh.z } : null; };
  A.isCastle = sh => !!(sh && sh.citadel);
  return A;
}
