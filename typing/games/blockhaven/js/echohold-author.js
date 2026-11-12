// Echohold Reborn, Phase 2: the bigger city map (maps/deep-v2.bin). Development only: tools/echohold-build.html runs it.
// deep-v2 = everything in deep-v1 (the descent, the twelve districts, every puzzle and fight, in the same places)
// plus a second great cavern to the west: the Forgotten Kingdom, reached through a new West Gate in the city wall,
// and the Grand Entrance carved where the descent tunnel opens into the city.
// Interiors for the Royal Citadel and the Lost Library come in Phase 3 (see ANCIENT-CITY-REBORN.md).
import { B, I, HEIGHT, make } from "./blocks.js";
import { buildInteriors } from "./echohold-interiors.js";

// The map's area: x -240..127, z -128..127 (the original was -128..127 both ways)
export const DEEP2 = { x0: -240, z0: -128, sx: 368, sz: 256, westGateAngle: 163.6 };
const OC = { x: -128, z: 0 }, ORAD = 100;   // the west cavern's centre and radius

// The second great cavern: a dome like the first one, overlapping it, so the two make one huge space.
export function carveOuterCavern(W, n, r, F) {
  for (let z = OC.z - ORAD - 6; z <= OC.z + ORAD + 6; z++) for (let x = OC.x - ORAD - 6; x <= OC.x + ORAD + 6; x++) {
    const d = Math.hypot(x - OC.x, z - OC.z), wob = n.n2(x / 18 + 40, z / 18) * 5;
    for (let y = 1; y < HEIGHT - 2; y++) {
      const inside = (d / (ORAD + wob)) ** 2 + ((y - F) / 60) ** 2 <= 1;
      if (y <= F && d < ORAD - 2) W.set(x, y, z, y === F ? (n.n2(x / 9 + 20, z / 9) > 0.45 ? B.HUSHMOSS : B.DARKSLATE) : B.DARKSLATE);
      else if (inside) W.set(x, y, z, 0);
    }
  }
  // stalactites and wall crystals, as in the first cavern
  for (let k = 0; k < 70; k++) {
    const a = r() * Math.PI * 2, d = 30 + r() * 62, x = Math.round(OC.x + Math.cos(a) * d), z = Math.round(OC.z + Math.sin(a) * d);
    let y = HEIGHT - 3; while (y > F + 20 && W.id(x, y, z) !== 0) y--;
    const len = 3 + Math.floor(r() * 12); for (let j = 0; j < len; j++) if (W.id(x, y - j, z) === 0) W.set(x, y - j, z, B.DRIPSTONE);
  }
  for (let k = 0; k < 150; k++) {
    const a = r() * Math.PI * 2, x = Math.round(OC.x + Math.cos(a) * (ORAD + 1)), z = Math.round(OC.z + Math.sin(a) * (ORAD + 1)), y = F + 6 + Math.floor(r() * 40);
    const ix = Math.round(OC.x + (x - OC.x) * 0.97), iz = Math.round(OC.z + (z - OC.z) * 0.97);
    if (W.id(x, y, z) && W.id(ix, y, iz) === 0) W.set(ix, y, iz, B.LUMEN_CRYSTAL);
  }
}

export function buildOuterKingdom(W, meta, K, r, n, h) {
  const { F, Y, lootFor, it, k3 } = h;
  const district = (id, name, x, z, rad, entrance, extra = {}) => meta.districts.push({ id, name, x, z, r: rad, entrance, ...extra });
  const sky = (x0, z0, x1, z1, y0, y1) => meta.skyline.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y0, y1]);
  const inCave = (x, z, m = 0) => Math.hypot(x - OC.x, z - OC.z) < ORAD - 4 - m;
  // the ceiling right above a spot (the first solid block going up from the floor)
  const ceiling = (x, z) => { let y = Y + 2; while (y < HEIGHT - 2 && W.id(x, y, z) === 0) y++; return y; };
  // a hanging chain of copper and dark links with a lamp at the end
  const chain = (x, z, bottom) => { const top = ceiling(x, z); for (let y = bottom + 1; y < top; y++) W.set(x, y, z, (y & 1) ? B.KEEPER_COPPER : B.DARKSLATE_BRICKS); W.set(x, bottom, z, B.KEEPER_LAMP); };
  // an east-west road: paved, cleared, lamps on both edges every 12 blocks
  const road = (xa, xb, z, half = 2) => {
    for (let x = Math.min(xa, xb); x <= Math.max(xa, xb); x++) {
      W.box(x, F, z - half, x, F, z + half, B.DARKSLATE_BRICKS);
      W.box(x, Y, z - half, x, Y + 3, z + half, 0);
      if (x % 12 === 0) for (const e of [-half - 1, half + 1]) if (W.id(x, F, z + e)) K.lamp(x, Y, z + e, 4);
    }
  };
  // a north-south lane
  const lane = (x, za, zb, half = 2) => {
    for (let z = Math.min(za, zb); z <= Math.max(za, zb); z++) { W.box(x - half, F, z, x + half, F, z, B.DARKSLATE_BRICKS); W.box(x - half, Y, z, x + half, Y + 3, z, 0); }
  };
  // steps cut into a ravine wall, so nobody who falls in is stuck: from the bank down to the ravine floor
  const ravineSteps = (x0, x1, zTop, dir) => {
    for (let s = 0; s <= F - 6; s++) {
      const z = zTop + dir * s, y = F - 1 - s;
      W.box(x0, y, z, x1, y, z, B.DARKSLATE_BRICKS);
      W.box(x0, y + 1, z, x1, y + 4, z, 0);
    }
  };

  // ---------- the ravine: a long crack down the middle of the west cavern, with a waterfall at its north end ----------
  const RV = { x0: -116, x1: -108 };
  for (let z = -96; z <= 96; z++) {
    if (!inCave((RV.x0 + RV.x1) / 2, z, 1)) continue;
    W.box(RV.x0, 5, z, RV.x1, F + 4, z, 0); W.box(RV.x0, 4, z, RV.x1, 4, z, B.DARKSLATE); W.box(RV.x0, 5, z, RV.x1, 5, z, B.WATER);
  }
  let zN = -96; while (!inCave(-112, zN, 1)) zN++;
  for (let x = -114; x <= -110; x++) { const top = ceiling(x, zN); for (let y = 5; y < top; y++) W.set(x, y, zN, B.WATER); }   // the waterfall
  ravineSteps(-109, -108, -76, 1); ravineSteps(-116, -115, -66, -1); ravineSteps(-109, -108, 62, 1); ravineSteps(-116, -115, 72, -1);

  // ---------- the West Road: from the inner city, through the new West Gate, across the ravine, to the far wall ----------
  const RZ = 22;
  road(-26, -206, RZ);
  // railings and lamps where the road crosses the ravine (the road itself is the bridge deck)
  for (let x = RV.x0 - 1; x <= RV.x1 + 1; x++) for (const e of [-3, 3]) W.set(x, Y, RZ + e, x % 4 === 0 ? B.KEEPER_LAMP : B.DARKSLATE_BRICKS);
  for (let x = RV.x0; x <= RV.x1; x++) for (const e of [-3, 3]) W.set(x, F, RZ + e, B.DARKSLATE_BRICKS);
  // the West Gate's two towers, either side of the gap in the city wall
  for (const a of [157, 170]) { const t = a * Math.PI / 180; K.stairTower(Math.round(Math.cos(t) * h.WALL), Math.round(Math.sin(t) * h.WALL), Y, 16); }
  district("westgate", "the West Gate", -75, RZ, 8, { x: -70, y: Y, z: RZ });
  // a broken second bridge to the north (the gap can be jumped by the brave; the steps below are the safe way)
  K.bridge({ x: -104, z: -50 }, { x: -120, z: -50 }, F, 1, B.DARKSLATE_BRICKS);
  W.box(RV.x0 + 3, F, -51, RV.x0 + 5, F, -49, 0);
  for (const x of [-104, -120]) chain(x, -50, Y + 9);

  // ---------- the Ancient Market (between the West Gate and the ravine) ----------
  const MK = { x: -94, z: 2 };
  for (let i = 0; i < 6; i++) {
    const x = MK.x - 9 + (i % 3) * 7, z = MK.z - 12 + Math.floor(i / 3) * 9;
    W.box(x, Y, z, x + 4, Y, z + 2, B.PLANKS); W.box(x, Y + 3, z, x + 4, Y + 3, z + 2, i % 2 ? B.WOOL : B.BLACK_WOOL);
    W.box(x, Y, z, x, Y + 2, z, B.LOG); W.box(x + 4, Y, z, x + 4, Y + 2, z, B.LOG); sky(x, z, x + 4, z + 2, Y - 1, Y + 4);
  }
  K.house(MK.x - 8, MK.z + 5, 9, 7, Y, 6, { door: "s" }); K.house(MK.x + 3, MK.z + 5, 8, 7, Y, 6, { door: "s", broken: true });
  K.chest(MK.x - 5, Y, MK.z + 8, "market_store", "supply", [it(I.ECHO_SHARD, 3)]); K.chest(MK.x + 5, Y, MK.z + 9, "market_safe", "discovery");
  district("market", "the Ancient Market", MK.x, MK.z, 14, { x: MK.x, y: Y, z: RZ - 4 });

  // ---------- the Forgotten Kingdom: the great residential quarter west of the ravine ----------
  const PZ = { x: -160, z: 0 };   // the fountain plaza
  for (let z = PZ.z - 11; z <= PZ.z + 11; z++) for (let x = PZ.x - 11; x <= PZ.x + 11; x++) {
    const d = Math.hypot(x - PZ.x, z - PZ.z); if (d > 11) continue;
    W.set(x, F, z, d < 4 ? B.WATER : B.DARKSLATE_BRICKS); if (d < 4) W.set(x, F - 1, z, B.DARKSLATE_BRICKS);
    W.box(x, Y, z, x, Y + 4, z, 0);
    if (d >= 4 && d < 5) W.set(x, Y, z, B.DARKSLATE_BRICKS);   // the fountain's rim
  }
  W.box(PZ.x, F, PZ.z, PZ.x, Y + 3, PZ.z, B.KEEPER_STONE); W.set(PZ.x, Y + 4, PZ.z, B.LUMEN_CRYSTAL);
  K.lore(PZ.x + 6, Y, PZ.z + 6, "kingdom_notice"); K.beacon(PZ.x - 6, Y, PZ.z + 6, "kingdom", "the Forgotten Kingdom");
  W.set(PZ.x + 7, Y, PZ.z - 5, B.DEEP_LIFT);   // an old lift: a way back up to the Surface from the far side of the city
  lane(PZ.x, PZ.z + 11, RZ - 3);   // plaza to the road
  district("kingdom", "the Forgotten Kingdom", PZ.x, PZ.z, 26, { x: PZ.x, y: Y, z: PZ.z + 12 });
  // the Royal Citadel (north): walls, four towers, a keep (its halls are furnished in Phase 3)
  const RC = { x0: -168, z0: -82, x1: -132, z1: -52 };
  W.box(RC.x0, F, RC.z0, RC.x1, F, RC.z1, B.DARKSLATE_BRICKS); W.box(RC.x0, Y, RC.z0, RC.x1, Y + 12, RC.z1, 0);
  W.walls(RC.x0, Y, RC.z0, RC.x1, Y + 9, RC.z1, B.DARKSLATE_BRICKS); sky(RC.x0, RC.z0, RC.x1, RC.z1, Y - 1, Y + 10);
  for (let x = RC.x0; x <= RC.x1; x += 6) for (const z of [RC.z0, RC.z1]) W.set(x, Y + 10, z, B.KEEPER_LAMP);
  W.box(-152, Y, RC.z1, -148, Y + 5, RC.z1, 0);   // the main gate
  for (const [x, z] of [[RC.x0, RC.z0], [RC.x1, RC.z0], [RC.x0, RC.z1], [RC.x1, RC.z1]]) K.stairTower(x, z, Y, 16);
  K.house(-158, -80, 17, 15, Y, 14, { door: "s", wall: B.DARKSLATE_BRICKS, roof: B.DARKSLATE_BRICKS });   // the keep
  W.box(-151, Y, -66, -149, Y + 3, -66, 0);
  for (const x of [-155, -145]) chain(x, -60, Y + 8);
  lane(-150, -12, RC.z1 + 1);
  district("royal", "the Royal Citadel", -150, -67, 18, { x: -150, y: Y, z: RC.z1 + 2 });
  // the Lost Library (south): a tall sealed hall (its shelves and puzzle come in Phase 3)
  const LB = { x0: -168, z0: 34, x1: -140, z1: 58 };
  W.box(LB.x0, F, LB.z0, LB.x1, F, LB.z1, B.DARKSLATE_BRICKS); W.box(LB.x0 + 1, Y, LB.z0 + 1, LB.x1 - 1, Y + 17, LB.z1 - 1, 0);
  W.walls(LB.x0, Y, LB.z0, LB.x1, Y + 17, LB.z1, B.DARKSLATE_BRICKS); W.box(LB.x0, Y + 18, LB.z0, LB.x1, Y + 18, LB.z1, B.DARKSLATE);
  for (let y = Y + 3; y < Y + 17; y += 5) for (let x = LB.x0 + 3; x < LB.x1; x += 4) W.set(x, y, LB.z0, B.RESONANT_GLASS);
  W.box(-156, Y, LB.z0, -152, Y + 4, LB.z0, 0);   // doorway
  for (const [x, z] of [[LB.x0 + 2, LB.z0 + 2], [LB.x1 - 2, LB.z0 + 2], [LB.x0 + 2, LB.z1 - 2], [LB.x1 - 2, LB.z1 - 2]]) W.set(x, Y, z, B.KEEPER_LAMP);
  sky(LB.x0, LB.z0, LB.x1, LB.z1, Y - 1, Y + 19);
  lane(-154, RZ + 3, LB.z0 - 1);
  district("library", "the Lost Library", -154, 46, 15, { x: -154, y: Y, z: LB.z0 - 2 });
  // a collapsed watchtower in the west
  const CT = { x: -196, z: -20 };
  K.tower(CT.x, CT.z, Y, 4, 26);
  for (let y = Y + 14; y <= Y + 27; y++) for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if (dx + dz * 0.6 > (Y + 27 - y) * 0.35 - 2) W.set(CT.x + dx, y, CT.z + dz, 0);
  for (let k = 0; k < 40; k++) { const x = CT.x + 5 + Math.floor(r() * 7), z = CT.z - 3 + Math.floor(r() * 8); if (W.id(x, F, z) && !W.id(x, Y, z)) W.set(x, Y, z, r() < 0.5 ? B.DARKSLATE_BRICKS : B.COBBLE); }
  // homes: a grid of streets, two-storey homes every third plot, some broken, some left as little moss courtyards
  const keepOut = [[RC.x0 - 3, RC.z0 - 3, RC.x1 + 3, RC.z1 + 3], [LB.x0 - 3, LB.z0 - 3, LB.x1 + 3, LB.z1 + 3], [-210, RZ - 6, -100, RZ + 6], [-153, -52, -147, -12], [-157, RZ, -151, LB.z0], [CT.x - 7, CT.z - 7, CT.x + 12, CT.z + 8]];
  const clash = (x0, z0, x1, z1) => keepOut.some(([a, b, c, d]) => x0 <= c && x1 >= a && z0 <= d && z1 >= b) || Math.hypot((x0 + x1) / 2 - PZ.x, (z0 + z1) / 2 - PZ.z) < 17;
  let homes = 0, caches = 0;
  for (let i = 0; i < 7; i++) for (let j = 0; j < 11; j++) {
    const x0 = -204 + i * 12, z0 = -54 + j * 11, x1 = x0 + 8, z1 = z0 + 6;
    if (clash(x0, z0, x1, z1) || ![[x0, z0], [x1, z0], [x0, z1], [x1, z1]].every(([x, z]) => inCave(x, z, 4))) continue;
    if (r() < 0.14) {   // a small courtyard instead of a house
      W.box(x0 + 1, F, z0 + 1, x1 - 1, F, z1 - 1, B.CAVE_MOSS);
      for (let k = 0; k < 6; k++) { const x = x0 + 1 + Math.floor(r() * 7), z = z0 + 1 + Math.floor(r() * 5); if (!W.id(x, Y, z)) W.set(x, Y, z, B.TALL_GRASS); }
      for (let y = Y; y < Y + 4; y++) W.set(x0 + 4, y, z0 + 3, B.ROOTWOOD); W.box(x0 + 3, Y + 4, z0 + 2, x0 + 5, Y + 4, z0 + 4, B.RESONANT_GLASS);
      continue;
    }
    const tall = homes % 3 === 0, door = j % 2 ? "s" : "n";
    K.house(x0, z0, 9, 7, Y, tall ? 8 : 4, { door, broken: r() < 0.3 });
    if (tall) {   // an upper floor with a stair up to it
      W.box(x0 + 1, Y + 4, z0 + 1, x1 - 1, Y + 4, z1 - 1, B.DARKSLATE);
      for (let s = 0; s < 4; s++) { W.set(x1 - 1 - s, Y + s, z0 + 1 + (door === "n" ? 4 : 0), B.DARKSLATE_BRICKS); W.box(x1 - 1 - s, Y + 4, z0 + 1 + (door === "n" ? 4 : 0), x1 - 1 - s, Y + 4, z0 + 1 + (door === "n" ? 4 : 0), 0); }
      W.set(x0 + 1, Y + 5, z1 - 1, B.KEEPER_LAMP);
    }
    W.set(x0 + 4, Y, z0 + 3, B.TABLE);
    if (homes % 4 === 1 && caches < 10) { K.chest(x0 + 6, Y, z0 + 3, "kingdom_home_" + caches, caches % 3 === 2 ? "discovery" : "supply"); caches++; }
    homes++;
  }
  meta.kingdom = { homes, caches };
  for (let k = 0; k < 14; k++) { const x = -200 + Math.floor(r() * 90), z = -60 + Math.floor(r() * 120); if (W.id(x, F, z) === B.HUSHMOSS && !W.id(x, Y, z)) { W.set(x, F, z, B.HUSH_NODE); meta.nodes.push({ x, y: F, z }); } }
  meta.spawns.push({ id: "kingdom_crawlers", kind: "crawler", n: 2, x: -175, y: Y, z: -25, r: 10 }, { id: "kingdom_stalker", kind: "stalker", n: 1, x: -185, y: Y, z: 40, r: 10 });

  // ---------- the Grand Entrance: a gate carved into the cavern wall where the descent tunnel comes out ----------
  // (built last in the east, after the Expedition Camp; nothing north of z 74 is touched)
  W.box(36, Y, 74, 82, Y + 22, 85, 0);
  W.box(36, F, 74, 82, F, 85, (x, y, z, o) => ((o & 255) === 0 || (o & 255) === B.WATER) ? B.DARKSLATE_BRICKS : undefined);
  // the gate frame: 17 wide, 20 tall, with a tall opening and a stepped arch
  for (let x = 51; x <= 67; x++) for (let y = Y; y <= Y + 19; y++) {
    const dx = Math.abs(x - 59), open = dx <= 5 && y <= Y + 12 - Math.max(0, dx - 2) * 2;
    W.set(x, y, 85, open ? 0 : (y % 4 === 0 || dx === 8 ? B.KEEPER_COPPER : B.DARKSLATE_BRICKS));
  }
  W.set(59, Y + 15, 84, B.LUMEN_CRYSTAL); W.set(56, Y + 17, 84, B.KEEPER_LAMP); W.set(62, Y + 17, 84, B.KEEPER_LAMP);
  sky(51, 84, 67, 86, Y - 1, Y + 20);
  // one gate leaf, torn off and lying on the floor
  W.box(65, Y, 74, 67, Y, 80, B.KEEPER_COPPER);
  // two guardian statues with great swords, their eyes still glowing
  const statue = (cx, z0) => {
    W.box(cx - 4, Y, z0, cx + 4, Y + 1, z0 + 5, B.DARKSLATE_BRICKS); W.box(cx - 4, Y + 1, z0, cx + 4, Y + 1, z0, B.KEEPER_COPPER);
    for (const sx of [-3, 2]) W.box(cx + sx, Y + 2, z0 + 1, cx + sx + 1, Y + 7, z0 + 3, B.DARKSLATE);
    W.box(cx - 3, Y + 8, z0 + 1, cx + 3, Y + 13, z0 + 3, B.DARKSLATE_BRICKS); W.box(cx - 3, Y + 8, z0 + 1, cx + 3, Y + 8, z0 + 3, B.KEEPER_COPPER);
    for (const sx of [-5, 4]) W.box(cx + sx, Y + 7, z0 + 1, cx + sx + 1, Y + 13, z0 + 2, B.DARKSLATE);
    W.box(cx, Y + 2, z0, cx, Y + 9, z0, B.ECHOSTONE); W.box(cx - 2, Y + 10, z0, cx + 2, Y + 10, z0, B.KEEPER_COPPER); W.box(cx, Y + 11, z0, cx, Y + 12, z0, B.DARKSLATE);
    W.box(cx - 2, Y + 14, z0 + 1, cx + 2, Y + 17, z0 + 4, B.DARKSLATE_BRICKS);
    W.set(cx - 1, Y + 16, z0 + 1, B.LUMEN_CRYSTAL); W.set(cx + 1, Y + 16, z0 + 1, B.LUMEN_CRYSTAL);
    for (const sx of [-3, 3]) W.box(cx + sx, Y + 17, z0 + 2, cx + sx, Y + 19, z0 + 2, B.KEEPER_COPPER);
    sky(cx - 5, z0, cx + 5, z0 + 5, Y - 1, Y + 20);
  };
  statue(45, 78); statue(73, 78);
  // the broken defensive wall in front, and a ruined watchtower you can still climb
  for (const [a, b] of [[38, 52], [66, 80]]) for (let x = a; x <= b; x++) { const top = Y + 1 + Math.floor(r() * 4); if (r() < 0.15) continue; W.box(x, Y, 75, x, top, 75, B.DARKSLATE_BRICKS); }
  K.stairTower(33, 79, Y, 18);
  // a guardhouse hidden behind the west statue
  W.box(41, Y, 87, 47, Y + 3, 91, 0); W.box(41, F, 87, 47, F, 91, B.DARKSLATE_BRICKS); W.box(44, Y, 86, 44, Y + 1, 86, 0); W.box(44, Y, 85, 44, Y + 1, 85, 0);
  W.set(42, Y, 90, B.KEEPER_LAMP); K.chest(46, Y, 90, "guardhouse", "supply", [it(I.SHIELD, 1), it(I.ARROW, 16)]);
  meta.secrets.push({ id: "guardhouse", name: "the hidden guardhouse", x: 44, y: Y, z: 88 });
  // the great chain lamp over the gate, and the warning carved beside it
  chain(59, 79, Y + 15); chain(50, 76, Y + 12); chain(68, 76, Y + 12);
  K.lore(53, Y, 77, "gate_warning");
  district("entrance", "the Grand Entrance", 59, 80, 9, { x: 59, y: Y, z: 77 });

  // the balcony high on the east wall becomes the Overlook. (In deep-v1 its railing faced solid rock.) A ledge is cut
  // from it out through the wall, widening as it goes, until it opens over the cavern; a railing guards the end.
  const BL = meta.balcony, ux = -BL.x / Math.hypot(BL.x, BL.z), uz = -BL.z / Math.hypot(BL.x, BL.z);
  for (let t = 0; t <= 22; t++) {
    const cx = BL.x + ux * t, cz = BL.z + uz * t, half = 3 + t * 0.35;
    for (let a = -Math.ceil(half); a <= Math.ceil(half); a++) {
      const x = Math.round(cx - uz * a), z = Math.round(cz + ux * a);
      W.box(x, BL.y, z, x, BL.y + 5 + Math.floor(t / 4), z, 0);
      if (t <= 9) W.set(x, BL.y - 1, z, B.DARKSLATE_BRICKS);   // a solid floor all the way across
      if (t === 9 || (t >= 3 && t <= 9 && Math.abs(a) === Math.ceil(half))) W.set(x, BL.y, z, B.DARKSLATE_BRICKS);   // a solid railing (end and sides)
    }
  }
  W.set(Math.round(BL.x + ux * 9 - uz * 4), BL.y, Math.round(BL.z + uz * 9 + ux * 4), B.KEEPER_LAMP);
  W.set(Math.round(BL.x + ux * 9 + uz * 4), BL.y, Math.round(BL.z + uz * 9 - ux * 4), B.KEEPER_LAMP);
  const stand = { x: BL.x + ux * 7 + 0.5, z: BL.z + uz * 7 + 0.5 };
  meta.overlook = { x: stand.x, y: BL.y, z: stand.z, r: 3, look: { x: -150, y: 24, z: 4 } };
  buildInteriors(W, meta, K, r, h);   // Phase 3 (js/echohold-interiors.js)
  // the cavern floors under the distant skyline (two discs: [centre x, centre z, radius, height])
  meta.skyFloor = [[0, 0, 100, Y], [OC.x, OC.z, ORAD - 3, Y]];
  // the inner city's buildings, for the distant skyline (the far-city view)
  for (const d of meta.districts) if (!["kingdom", "entrance", "westgate", "market", "royal", "library"].includes(d.id)) sky(d.x - 4, d.z - 4, d.x + 4, d.z + 4, Y - 1, Y + 6);
}
