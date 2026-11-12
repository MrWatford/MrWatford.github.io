// Echohold Reborn, Phase 3: the insides of the west cavern (development only; part of maps/deep-v2.bin).
// The Royal Citadel (throne room, archives, war room, banquet hall, chambers, prison, escape tunnel, the three Royal
// Seals), the Hidden Royal Vault, the Lost Library (three floors, the four-mark puzzle, a sealed reading room),
// the Silent Catacombs under the fountain, the Aqueduct Works (three wheels drain a flooded passage), and the
// Hidden Observatory. Every puzzle uses a kind lost.js already runs ("all", "order", "switch").
import { B, I } from "./blocks.js";

export function buildInteriors(W, meta, K, r, h) {
  const { F, Y, it } = h;
  const district = (id, name, x, z, rad, entrance, extra = {}) => meta.districts.push({ id, name, x, z, r: rad, entrance, ...extra });
  const secret = (id, name, x, y, z) => meta.secrets.push({ id, name, x, y, z });
  const room = (x0, y0, z0, x1, y1, z1, floor = B.DARKSLATE_BRICKS) => { W.box(x0, y0, z0, x1, y1, z1, 0); W.box(x0, y0 - 1, z0, x1, y0 - 1, z1, floor); };
  const sw = (x, y, z) => { W.set(x, y, z, B.KEEPER_SWITCH); return { x, y, z }; };
  const sky = (x0, z0, x1, z1, y0, y1) => meta.skyline && meta.skyline.push([x0, z0, x1, z1, y0, y1]);

  // =============== the Royal Citadel ===============
  // the keep (x -158..-142, z -80..-66): a partition makes the Royal Archives behind the throne room
  W.box(-157, Y, -75, -143, Y + 13, -75, B.DARKSLATE_BRICKS);
  W.box(-156, Y, -75, -155, Y + 2, -75, B.KEEPER_STONE);   // the archive door (opens when all three seals are set)
  W.box(-156, Y, -79, -144, Y + 2, -79, B.BOOKSHELF); W.set(-150, Y + 1, -79, B.KEEPER_LAMP);
  K.lore(-153, Y, -77, "archive_portal"); K.chest(-146, Y, -77, "royal_archives", "discovery", [it(I.GOLDEN_APPLE, 1)]);
  // throne room: a two-step dais, the throne, a carpet, pillars, hanging banners
  W.box(-153, Y, -74, -147, Y, -72, B.DARKSLATE_BRICKS); W.box(-152, Y + 1, -74, -148, Y + 1, -73, B.DARKSLATE_BRICKS);
  W.set(-150, Y + 2, -74, B.KEEPER_STONE); W.set(-151, Y + 2, -74, B.GOLD_BLOCK); W.set(-149, Y + 2, -74, B.GOLD_BLOCK);
  meta.throne = { x: -150, y: Y + 3, z: -74 };
  W.box(-151, F, -71, -149, F, -67, B.HUSH_CARPET);
  for (const x of [-155, -145]) for (const z of [-73, -69]) { W.box(x, Y, z, x, Y + 13, z, B.DARKSLATE_BRICKS); W.set(x, Y + 4, z, B.KEEPER_COPPER); W.set(x, Y + 7, z, B.KEEPER_LAMP); }
  for (const x of [-157, -143]) for (const z of [-72, -69]) { W.box(x, Y + 5, z, x, Y + 10, z, B.WOOL); W.set(x, Y + 10, z, B.BLACK_WOOL); W.set(x, Y + 5, z, B.BLACK_WOOL); }
  K.lore(-146, Y, -72, "royal_record");
  // the banquet hall (east): a long table; the Seal of the Crown at its head
  K.house(-140, -77, 7, 11, Y, 5, { door: "s" });
  for (let z = -75; z <= -70; z++) W.set(-137, Y, z, B.TABLE);
  const sealCrown = sw(-137, Y, -76);
  // the war room (west): a map table and the captain's note; the Seal of the Watch in the corner
  K.house(-166, -77, 7, 9, Y, 5, { door: "e" });
  W.set(-163, Y, -73, B.MAP_TABLE); K.lore(-163, Y, -75, "royal_seals");
  const sealWatch = sw(-165, Y, -71);
  // the royal chambers (south-west)
  K.house(-166, -64, 7, 8, Y, 5, { door: "e" });
  W.box(-165, Y, -63, -164, Y, -62, B.WOOL); K.chest(-162, Y, -58, "royal_chamber", "supply", [it(I.GOLDEN_CARROT, 3)]);
  // the prison under the south courtyard: stairs down, a corridor, four cells behind copper bars
  K.stairsDown({ x: -137, y: Y, z: -63 }, { x: -137, y: 8, z: -56 }, 1);
  room(-166, 8, -57, -136, 10, -55);
  for (let x = -164; x <= -138; x += 10) W.set(x, 11, -56, B.KEEPER_LAMP);
  for (const x0 of [-162, -156, -150, -144]) {
    room(x0, 8, -61, x0 + 2, 10, -58);
    for (const x of [x0, x0 + 2]) W.box(x, 8, -58, x, 10, -58, B.KEEPER_COPPER);
  }
  const sealHearth = sw(-161, 8, -61);
  K.chest(-155, 8, -61, "prison_cell", "supply", [it(I.ECHO_SHARD, 3)]);
  meta.puzzles.royalSeals = { kind: "all", switches: [sealCrown, sealWatch, sealHearth], labels: ["The Seal of the Crown", "The Seal of the Watch", "The Seal of the Hearth"], countSteps: true,
    clue: "Three seal stands, hidden around the Citadel. The captain's note in the war room says where.", door: { x0: -156, y0: Y, z0: -75, x1: -155, y1: Y + 2, z1: -75 },
    successText: "The third seal clicks home. Behind the throne, the archive door grinds open.", solvedText: "All three Royal Seals are in place." };
  // the escape tunnel: west from the prison, then up into the streets outside the Citadel wall
  room(-171, 8, -57, -167, 10, -55);
  K.stairsDown({ x: -170, y: 8, z: -57 }, { x: -170, y: Y, z: -67 }, 1);
  // the Hidden Royal Vault, off the escape tunnel: an antechamber with four marked switches, then the vault
  room(-172, 8, -56, -172, 9, -56);
  room(-176, 8, -58, -173, 10, -54);
  const vSw = [sw(-176, 8, -58), sw(-176, 8, -54), sw(-173, 8, -58), sw(-173, 8, -54)];   // crown, moon, key, bell
  W.set(-174, 10, -56, B.KEEPER_LAMP);
  room(-184, 8, -59, -178, 10, -53);
  W.box(-177, 8, -57, -177, 10, -55, B.KEEPER_STONE);
  K.chest(-183, 8, -58, "royal_vault_1", "vault", [it(I.HUSH_LEGS, 1), it(I.SKY_SWORD, 1)]); K.chest(-183, 8, -54, "royal_vault_2", "vault", [it(I.GOLDEN_APPLE, 3), it(I.TOTEM, 1)]);
  for (const [x, z] of [[-181, -58], [-180, -58], [-181, -54]]) W.set(x, 8, z, B.GOLD_BLOCK);
  W.set(-178, 10, -59, B.KEEPER_LAMP); W.set(-184, 10, -53, B.KEEPER_LAMP);
  meta.puzzles.royalVault = { kind: "order", switches: vSw, symbols: ["crown", "moon", "key", "bell"], order: [0, 2, 3, 1],
    clue: "Four worn marks: a crown, a moon, a key, and a bell. The Crown split the riddle in two: one half lies in the Royal Archives, the other below the fountain.",
    door: { x0: -177, y0: 8, z0: -57, x1: -177, y1: 10, z1: -55 } };
  secret("royalvault", "the Hidden Royal Vault", -181, 8, -56);

  // =============== the Lost Library (x -168..-140, z 34..58) ===============
  const L0 = Y, L1 = Y + 6, L2 = Y + 12;   // where you stand on each floor
  // two upper floors around an open atrium (x -160..-148, z 41..51)
  for (const fy of [L1 - 1, L2 - 1]) W.box(-167, fy, 35, -141, fy, 57, (x, y, z) => (x >= -160 && x <= -148 && z >= 41 && z <= 51) ? undefined : B.PLANKS);
  // stairs: ground → first floor up the west wall, first → second floor up the east wall
  for (let k = 0; k <= 4; k++) W.box(-167, L0 + k, 40 + k, -166, L0 + k, 40 + k, B.PLANKS);
  W.box(-167, L1 - 1, 40, -166, L1 - 1, 44, 0);
  for (let k = 0; k <= 4; k++) W.box(-142, L1 + k, 50 - k, -141, L1 + k, 50 - k, B.PLANKS);
  W.box(-142, L2 - 1, 46, -141, L2 - 1, 50, 0);
  // shelves along every wall (gaps for stairs and the door), and two free-standing rows downstairs
  for (const [fy, skip] of [[L0, [-167, 39, 46]], [L1, [-141, 44, 51]], [L2, null]]) {
    for (let z = 36; z <= 56; z++) {
      if (!(skip && skip[0] === -167 && z >= skip[1] && z <= skip[2])) W.box(-167, fy, z, -167, fy + 2, z, B.BOOKSHELF);
      if (!(skip && skip[0] === -141 && z >= skip[1] && z <= skip[2])) W.box(-141, fy, z, -141, fy + 2, z, B.BOOKSHELF);
    }
    for (let x = -166; x <= -142; x++) { W.box(x, fy, 57, x, fy + 2, 57, B.BOOKSHELF); if (x < -157 || x > -151 || fy !== L0) W.box(x, fy, 35, x, fy + 2, 35, B.BOOKSHELF); }
  }
  for (const x of [-163, -145]) for (let z = 37; z <= 55; z++) if (z !== 46 && z !== 47) W.box(x, L0, z, x, L0 + 3, z, B.BOOKSHELF);
  // pillars at the atrium corners with lamps, and a plank bridge across the top floor
  for (const x of [-161, -147]) for (const z of [40, 52]) { W.box(x, L0, z, x, Y + 17, z, B.DARKSLATE_BRICKS); for (const y of [L0 + 4, L1 + 4, L2 + 4]) W.set(x, y, z, B.KEEPER_LAMP); }
  W.box(-160, L2 - 1, 46, -148, L2 - 1, 47, B.PLANKS);
  for (let x = -160; x <= -148; x++) for (const z of [45, 48]) W.set(x, L2, z, B.OAK_FENCE);
  // reading tables downstairs, a collapsed corner upstairs, moss creeping over the top floor
  for (const x of [-157, -151]) { W.set(x, L0, 54, B.TABLE); W.set(x + 1, L0, 54, B.TABLE); }
  W.box(-146, L1 - 1, 53, -143, L1 - 1, 56, 0);
  for (let k = 0; k < 10; k++) { const x = -146 + Math.floor(r() * 4), z = 53 + Math.floor(r() * 4); if (!W.id(x, L0, z)) W.set(x, L0, z, r() < 0.5 ? B.COBBLE : B.PLANKS); }
  for (let k = 0; k < 40; k++) { const x = -166 + Math.floor(r() * 25), z = 36 + Math.floor(r() * 21); if (W.id(x, L2 - 1, z) === B.PLANKS && !W.id(x, L2, z)) W.set(x, L2 - 1, z, B.HUSHMOSS); }
  for (const [x, z] of [[-164, 44], [-144, 39]]) if (W.id(x, L2, z) === 0) { W.set(x, L2 - 1, z, B.HUSH_NODE); meta.nodes.push({ x, y: L2 - 1, z }); }
  // the four numbered notes, one per corner of the library
  K.lore(-158, L0, 37, "library_note_1"); K.lore(-164, L1, 55, "library_note_2"); K.lore(-144, L1, 38, "library_note_3"); K.lore(-146, L2, 55, "library_note_4");
  // the four marks on the top floor and the sealed reading room in its south-west corner
  const lSw = [-162, -158, -150, -146].map(x => sw(x, L2, 37));
  W.box(-161, L2, 52, -161, L2 + 4, 56, B.DARKSLATE_BRICKS); W.box(-166, L2, 52, -161, L2 + 4, 52, B.DARKSLATE_BRICKS); W.box(-166, L2 + 5, 52, -161, L2 + 5, 56, B.DARKSLATE);
  W.box(-161, L2, 54, -161, L2 + 1, 55, B.KEEPER_STONE);
  K.lore(-165, L2, 55, "library_archive"); K.chest(-163, L2, 56, "library_archive", "vault", [it(I.HUSH_CHEST, 1), it(I.LUMEN_SHARD, 6), it(I.ECHO_COMPASS, 1)]); W.set(-165, L2 + 3, 53, B.KEEPER_LAMP);
  meta.puzzles.libraryMarks = { kind: "order", switches: lSw, symbols: ["moon", "key", "eye", "crown"], order: [0, 1, 2, 3],
    clue: "Four carved marks: a moon, a key, an eye, and a crown. The head librarian left four numbered notes around the library.", door: { x0: -161, y0: L2, z0: 54, x1: -161, y1: L2 + 1, z1: 55 } };
  // a hidden stair behind the east shelves, down to a reading nook under the floor
  K.stairsDown({ x: -143, y: L0, z: 39 }, { x: -143, y: 8, z: 49 }, 0);
  room(-146, 8, 49, -142, 10, 54);
  K.chest(-144, 8, 53, "library_nook", "discovery"); W.set(-146, 10, 54, B.KEEPER_LAMP);
  secret("librarynook", "the librarians' hidden nook", -144, 8, 52);

  // =============== the Silent Catacombs (under the Forgotten Kingdom, floor at y 4) ===============
  const CX0 = -190, CZ0 = -35, NI = 10, NJ = 13, CY = 5;   // cells 6 apart; corridors 2 wide, 3 high
  const cx = i => CX0 + i * 6, cz = j => CZ0 + j * 6;
  const open = new Set(), key = (i, j) => i + "," + j, carveCell = (i, j) => room(cx(i), CY, cz(j), cx(i) + 1, CY + 2, cz(j) + 1, B.DARKSLATE);
  const link = (i, j, i2, j2) => room(Math.min(cx(i), cx(i2)), CY, Math.min(cz(j), cz(j2)), Math.max(cx(i), cx(i2)) + 1, CY + 2, Math.max(cz(j), cz(j2)) + 1, B.DARKSLATE);
  const stack = [[7, 6]]; open.add(key(7, 6)); carveCell(7, 6);
  while (stack.length) {   // a maze, dug from the entrance outward
    const [i, j] = stack[stack.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < NI && b < NJ && !open.has(key(a, b)));
    if (!nb.length) { stack.pop(); continue; }
    const [a, b] = nb[Math.floor(r() * nb.length)]; open.add(key(a, b)); carveCell(a, b); link(i, j, a, b); stack.push([a, b]);
  }
  for (let k = 0; k < 22; k++) { const i = Math.floor(r() * (NI - 1)), j = Math.floor(r() * (NJ - 1)); if (r() < 0.5) link(i, j, i + 1, j); else link(i, j, i, j + 1); }   // extra loops, so it's never a single long dead end
  // the burial hall: rows of stone coffins
  room(cx(2), CY, cz(2), cx(4) + 1, CY + 3, cz(4) + 1, B.DARKSLATE_BRICKS);
  for (let x = cx(2) + 1; x <= cx(4) - 1; x += 3) for (const z of [cz(2) + 2, cz(4) - 1]) W.box(x, CY, z, x + 1, CY, z, B.KEEPER_STONE);
  K.lore(cx(3), CY, cz(3), "catacomb_epitaph"); W.set(cx(2), CY + 3, cz(2), B.KEEPER_LAMP);
  // the ritual chamber: a ring of copper around a crystal, and the second half of the vault riddle
  room(cx(2), CY, cz(8), cx(4) + 1, CY + 3, cz(10) + 1, B.DARKSLATE_BRICKS);
  const RX = cx(3), RZ2 = cz(9);
  for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI * 2; W.set(Math.round(RX + Math.cos(t) * 5), CY, Math.round(RZ2 + Math.sin(t) * 5), B.KEEPER_COPPER); }
  W.set(RX, CY, RZ2, B.LUMEN_CRYSTAL); K.lore(RX + 2, CY, RZ2, "vault_riddle");
  // the underground lake
  room(cx(7), CY, cz(1), cx(9) + 1, CY + 3, cz(3) + 1, B.DARKSLATE);
  W.box(cx(7) + 2, CY - 2, cz(1) + 2, cx(9) - 1, CY - 1, cz(3) - 1, B.WATER); W.box(cx(7) + 2, CY - 3, cz(1) + 2, cx(9) - 1, CY - 3, cz(3) - 1, B.DARKSLATE);
  W.set(cx(8), CY + 3, cz(2), B.LUMEN_CRYSTAL);
  // listening nodes in the corridors, a few dim lamps and crystals, caches, and the creatures that live here
  let nodes = 0;
  for (let k = 0; k < 60 && nodes < 9; k++) { const i = Math.floor(r() * NI), j = Math.floor(r() * NJ); if ((i >= 2 && i <= 4 && (j <= 4 || j >= 8)) || i >= 7 && j <= 3) continue; const x = cx(i), z = cz(j); if (W.id(x, CY - 1, z) === B.DARKSLATE) { W.set(x, CY - 1, z, B.HUSH_NODE); meta.nodes.push({ x, y: CY - 1, z }); nodes++; } }
  for (let k = 0; k < 14; k++) { const i = Math.floor(r() * NI), j = Math.floor(r() * NJ); W.set(cx(i), CY + 3, cz(j), r() < 0.5 ? B.KEEPER_LAMP : B.LUMEN_CRYSTAL); }
  K.chest(cx(0), CY, cz(0), "catacomb_0", "discovery"); K.chest(cx(9) + 1, CY, cz(12), "catacomb_1", "supply", [it(B.HUSH_CARPET, 8)]); K.chest(cx(0), CY, cz(12) + 1, "catacomb_2", "discovery", [it(I.ECHO_SHARD, 4)]);
  meta.spawns.push({ id: "catacomb_crawlers", kind: "crawler", n: 3, x: cx(3), y: CY, z: cz(3), r: 3, ry: 5 }, { id: "catacomb_stalker", kind: "stalker", n: 1, x: RX, y: CY, z: RZ2, r: 3, ry: 5 });
  // the way in: a little shrine on the fountain plaza, and stairs down to the maze
  for (const x of [-153, -149]) { W.box(x, Y, -7, x, Y + 2, -7, B.KEEPER_STONE); W.set(x, Y + 3, -7, B.KEEPER_LAMP); }
  K.stairsDown({ x: -151, y: Y, z: -6 }, { x: cx(7), y: CY, z: cz(6) }, 0);
  // and a long passage north, up into the Citadel's prison
  K.stairsDown({ x: cx(7), y: CY, z: cz(0) }, { x: cx(7), y: 8, z: -56 }, 0);
  district("catacombs", "the Silent Catacombs", -160, 0, 34, { x: cx(7), y: CY, z: cz(6) }, { y: CY, ry: 4 });

  // =============== the Aqueduct Works (the ravine's north end) ===============
  K.house(-106, -86, 7, 6, Y, 5, { door: "s" });
  const wN = sw(-103, Y, -84); K.lore(-101, Y, -84, "aqueduct_works");
  const wB = sw(-121, Y, -47);
  W.box(-114, 5, -31, -110, 5, -29, B.DARKSLATE_BRICKS); const wL = sw(-112, 6, -30);
  // the flooded passage into the west bank, a grate at its end, and the drowned storeroom behind it
  W.box(-122, 4, -21, -117, 4, -19, B.DARKSLATE); W.box(-122, 5, -21, -117, 7, -19, B.WATER); W.box(-122, 8, -21, -117, 8, -19, B.DARKSLATE_BRICKS);
  W.box(-123, 5, -21, -123, 7, -19, B.KEEPER_STONE);
  room(-128, 5, -23, -124, 7, -17);
  K.chest(-126, 5, -22, "aqueduct_storeroom", "vault", [it(I.LUMEN_SHARD, 4)]); W.set(-128, 7, -17, B.KEEPER_LAMP); W.set(-124, 7, -23, B.LUMEN_CRYSTAL);
  meta.puzzles.aqueductWheels = { kind: "switch", switches: [wN, wB, wL], labels: ["The North Wheel", "The Bridge Wheel", "The Low Wheel"],
    clue: "Pump Master Hollis's duty board names three wheels: the pump house, the old north bridge, and the ravine floor.",
    drain: { x0: -122, y0: 5, z0: -21, x1: -117, y1: 7, z1: -19 }, door: { x0: -123, y0: 5, z0: -21, x1: -123, y1: 7, z1: -19 },
    successText: "The third wheel turns. Water rushes out through the drain, and the grate under the west bank slides open.", solvedText: "All three wheels are turned; the passage is dry." };
  secret("storeroom", "the drowned storeroom", -126, 5, -20);
  district("aqueductworks", "the Aqueduct Works", -104, -83, 8, { x: -103, y: Y, z: -80 });

  // =============== the Hidden Observatory (above the far end of the West Road) ===============
  K.stairsDown({ x: -207, y: Y, z: 22 }, { x: -222, y: Y + 11, z: 22 }, 1);
  W.ball(-226, Y + 13, 22, 4, 3, 4, 0); W.box(-230, Y + 10, 18, -222, Y + 10, 26, B.DARKSLATE_BRICKS);
  W.set(-227, Y + 11, 22, B.MAP_TABLE); K.lore(-227, Y + 11, 24, "observatory_map"); K.chest(-228, Y + 11, 20, "observatory_west", "discovery", [it(I.SURVEY_MAP, 1)]);
  W.set(-229, Y + 13, 22, B.KEEPER_LAMP);
  secret("observatory2", "the Hidden Observatory", -226, Y + 11, 22);

  // =============== Phase 4: Echo Watchers and Vault Sentinels (behavior in js/echohold-hunt.js) ===============
  const watch = (id, x, y, z, ry) => meta.spawns.push({ id, kind: "watcher", n: 1, x, y, z, r: 0, ...(ry ? { ry } : {}) });
  watch("watch_road", -182, Y, 17); watch("watch_lane", -152, Y, -30); watch("watch_plaza", -160, Y, -10); watch("watch_citadel", -146, Y, -48);
  watch("watch_library", -150, Y, 38, 5); watch("watch_cata1", cx(5), CY, cz(5), 4); watch("watch_cata2", cx(1), CY, cz(9), 4);
  meta.spawns.push({ id: "vault_sentinel", kind: "sentinel_v", n: 1, x: -181, y: 8, z: -56, r: 0, ry: 4, dormant: true },
    { id: "court_sentinels", kind: "sentinel_v", n: 2, x: -150, y: Y, z: -61, r: 4, ry: 5, dormant: true });

  // =============== Phase 5: the Warden's Sanctuary (the Citadel arena, dressed up; positions of the fight unchanged) ===============
  const CT = { x: 0, z: -14 }, CR = 16;
  for (let a = 0; a < 360; a += 1) if ([215, 325].some(g => Math.abs(a - g) < 6)) { const t = a * Math.PI / 180; W.box(Math.round(CT.x + Math.cos(t) * CR), Y, Math.round(CT.z + Math.sin(t) * CR), Math.round(CT.x + Math.cos(t) * CR), Y + 9, Math.round(CT.z + Math.sin(t) * CR), 0); }   // two more ways out
  for (const a of [60, 180, 300]) { const t = (a - 90) * Math.PI / 180; for (let r = 3; r <= 14; r += 0.5) { const x = Math.round(CT.x + Math.cos(t) * r), z = Math.round(CT.z + Math.sin(t) * r); if (W.id(x, F, z) === B.DARKSLATE_BRICKS && !W.id(x, Y, z)) W.set(x, F, z, B.HUSHMOSS); } }   // moss channels between the pylons
  for (let k = 0; k < 8; k++) { const t = (22.5 + k * 45) * Math.PI / 180, x = Math.round(CT.x + Math.cos(t) * 13.5), z = Math.round(CT.z + Math.sin(t) * 13.5); if (Math.abs(x - CT.x) < 2 && z > CT.z) continue; W.box(x, Y, z, x, Y + 7, z, B.DARKSLATE_BRICKS); W.set(x, Y + 3, z, B.KEEPER_COPPER); W.set(x, Y + 8, z, B.LUMEN_CRYSTAL); }
  for (const sx of [-1, 1]) { const x0 = CT.x + sx * 12; W.box(Math.min(x0, x0 + sx * 2), Y, CT.z - 2, Math.max(x0, x0 + sx * 2), Y + 1, CT.z + 2, B.DARKSLATE_BRICKS); W.box(x0 - sx, Y, CT.z - 1, x0 - sx, Y, CT.z + 1, B.DARKSLATE_BRICKS); }   // two raised ledges with a step
  W.box(CT.x - 1, Y, CT.z - 15, CT.x + 1, Y, CT.z - 13, B.KEEPER_STONE); W.set(CT.x, Y + 1, CT.z - 14, B.LUMEN_CRYSTAL);   // the altar at the far end

  // =============== Phase 5: the Royal Treasury under the keep, guarded by the Fallen Sentinel ===============
  K.stairsDown({ x: -165, y: 8, z: -58 }, { x: -165, y: 6, z: -66 }, 1);
  room(-166, 6, -80, -140, 10, -67);
  for (const x of [-160, -146]) for (const z of [-76, -71]) { W.box(x, 6, z, x, 10, z, B.DARKSLATE_BRICKS); W.set(x, 9, z, B.KEEPER_LAMP); }
  for (const [x, z] of [[-164, -79], [-163, -79], [-164, -78], [-142, -79], [-141, -79], [-141, -78], [-153, -80]]) W.set(x, 6, z, B.GOLD_BLOCK);
  K.chest(-162, 6, -79, "royal_treasury_1", "vault", [it(I.GOLD_INGOT, 6)]); K.chest(-144, 6, -79, "royal_treasury_2", "vault", [it(I.GOLDEN_APPLE, 2)]);
  K.lore(-153, 6, -68, "fallen_guard");
  for (let k = 0; k < 18; k++) { const x = -165 + Math.floor(r() * 25), z = -79 + Math.floor(r() * 12); if (W.id(x, 5, z) === B.DARKSLATE_BRICKS && !W.id(x, 6, z)) W.set(x, 5, z, B.HUSHMOSS); }
  meta.treasury = { x0: -166, z0: -80, x1: -140, z1: -67, y: 6, spawn: { x: -152.5, y: 6, z: -76.5 } };
  district("treasury", "the Royal Treasury", -153, -73, 13, { x: -153, y: 6, z: -69 }, { y: 6, ry: 3 });

  // =============== Phase 6: secrets (their behavior is in js/echohold-secrets.js) ===============
  // The Silent Bell: an open bell tower on the west side of the fountain plaza; the rope (a switch) hangs below the bell
  const BX = -171, BZ = 0;
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) W.box(BX + dx, Y, BZ + dz, BX + dx, Y + 11, BZ + dz, B.DARKSLATE_BRICKS);
  W.box(BX - 3, Y + 12, BZ - 3, BX + 3, Y + 12, BZ + 3, B.DARKSLATE_BRICKS); W.box(BX - 2, Y + 13, BZ - 2, BX + 2, Y + 13, BZ + 2, B.DARKSLATE); W.set(BX, Y + 14, BZ, B.KEEPER_LAMP);
  W.set(BX, Y + 11, BZ, B.KEEPER_COPPER);
  for (const [y, rr, mat] of [[Y + 10, 1, B.KEEPER_COPPER], [Y + 9, 1, B.KEEPER_COPPER], [Y + 8, 2, B.KEEPER_COPPER], [Y + 7, 2, B.GOLD_BLOCK]]) W.box(BX - rr, y, BZ - rr, BX + rr, y, BZ + rr, mat);
  W.box(BX, Y + 1, BZ, BX, Y + 6, BZ, B.OAK_FENCE);   // the rope
  const bellRope = sw(BX, Y, BZ + 1); K.lore(BX - 2, Y, BZ + 2, "bell_plaque");
  meta.bell = { switch: bellRope, x: BX + 0.5, y: Y, z: BZ + 0.5 };
  secret("bell", "the Silent Bell", BX + 0.5, Y, BZ + 1.5);
  sky(BX - 3, BZ - 3, BX + 3, BZ + 3, Y - 1, Y + 14);

  // The Empty Throne: sit on it (stand on the seat for a moment) and a stair opens down to the Royal Treasury
  K.stairsDown({ x: -144, y: Y, z: -67 }, { x: -144, y: 6, z: -75 }, 0);
  const capZ = []; for (let z = -76; z <= -66; z++) if (W.id(-144, F, z) === 0 && W.id(-144, F - 1, z) === 0) { W.set(-144, F, z, B.KEEPER_STONE); capZ.push(z); }
  meta.puzzles.throne = { kind: "throne", seat: { x: meta.throne.x + 0.5, y: meta.throne.y, z: meta.throne.z + 0.5 }, door: { x0: -144, y0: F, z0: Math.min(...capZ), x1: -144, y1: F, z1: Math.max(...capZ) } };
  secret("throne", "the stair under the Empty Throne", -144, 7, -73);

  // The Silent Trial: a long hall under the West Quarter. Cross it without being heard (three sounds and it resets)
  K.stairsDown({ x: -194, y: Y, z: 26 }, { x: -194, y: 6, z: 41 }, 0);
  room(-200, 6, 41, -171, 9, 45);
  for (let x = -200; x <= -171; x++) { const zc = 43 + Math.round(Math.sin(x * 0.45) * 2); W.set(x, 5, zc, B.HUSH_CARPET); }   // the quiet path weaves along the floor
  for (let x = -198; x <= -173; x += 5) { W.set(x, 8, 41, B.LUMEN_CRYSTAL); W.set(x + 2, 8, 45, B.LUMEN_CRYSTAL); }
  W.box(-170, 6, 42, -170, 8, 44, B.KEEPER_STONE);
  room(-169, 6, 41, -165, 9, 45);
  K.chest(-166, 6, 43, "silent_trial", "vault", [it(I.GOLDEN_APPLE, 2), it(B.HUSH_CARPET, 16)]); W.set(-165, 9, 45, B.KEEPER_LAMP);
  K.lore(-199, 6, 45, "trial_plaque");
  meta.puzzles.silentTrial = { kind: "trial", hall: { x0: -200, x1: -171, z0: 41, z1: 45, y: 6 }, startX: -195, endX: -173, door: { x0: -170, y0: 6, z0: 42, x1: -170, y1: 8, z1: 44 }, strikes: 3 };
  secret("trial", "the Silent Trial's reward room", -167, 6, 43);

  // The Forgotten Explorer: an old expedition camp inside the collapsed watchtower, with notes about the vault
  W.box(-196, Y, -16, -196, Y + 1, -16, 0);
  W.box(-198, Y, -22, -197, Y, -21, B.WOOL); W.set(-197, Y + 1, -22, B.WOOL);
  K.chest(-194, Y, -22, "explorer_camp", "supply", [it(I.SURVEY_MAP, 1), it(B.TORCH, 8)]); K.lore(-195, Y, -18, "explorer_notes"); W.set(-198, Y, -18, B.TORCH);
  secret("explorer", "the forgotten explorer's camp", -196, Y, -20);

  // The Last Message, at the far end of the catacombs
  K.lore(cx(9), CY, cz(12) + 1, "last_message");
  secret("lastmessage", "the last message", cx(9), CY, cz(12) + 1);

  // =============== Phase 7: the Great Portal chamber around the First Gate (gate, sockets, and stand unchanged) ===============
  const FG = { x: 0, z: -72 }, GY = Y + 6, PT = GY - 1;   // PT: the platform's top layer
  const hang = (x, z, bottom) => { let top = bottom + 1; while (top < 75 && W.id(x, top, z) === 0) top++; for (let y = bottom + 1; y < top; y++) W.set(x, y, z, (y & 1) ? B.KEEPER_COPPER : B.DARKSLATE_BRICKS); W.set(x, bottom, z, B.KEEPER_LAMP); };
  // a glowing border around the platform, and a ceremonial ring around the place where you activate the gate
  for (let x = FG.x - 12; x <= FG.x + 12; x++) for (let z = FG.z - 4; z <= FG.z + 12; z++) if ((Math.abs(x - FG.x) === 12 || z === FG.z - 4 || z === FG.z + 12) && W.id(x, PT, z) === B.DARKSLATE_BRICKS && !W.id(x, GY, z)) W.set(x, PT, z, B.LUMEN_GRASS);
  for (let x = FG.x - 4; x <= FG.x + 4; x++) for (let z = FG.z + 4; z <= FG.z + 12; z++) { const d = Math.hypot(x - FG.x, z - (FG.z + 8)); if (W.id(x, GY, z)) continue; if (d >= 2.6 && d <= 3.5) W.set(x, PT, z, B.KEEPER_COPPER); else if (d < 1.2) W.set(x, PT, z, B.HUSHMOSS); }
  // two carved rune pillars right beside the frame
  for (const sx of [-1, 1]) { const x0 = FG.x + sx * 9, x1 = FG.x + sx * 10; W.box(Math.min(x0, x1), GY, FG.z - 3, Math.max(x0, x1), GY + 19, FG.z - 2, B.DARKSLATE_BRICKS); for (let y = GY + 2; y <= GY + 18; y += 4) { W.set(x0, y, FG.z - 1, B.LUMEN_CRYSTAL); W.set(x1, y + 2, FG.z - 3, B.KEEPER_COPPER); } sky(Math.min(x0, x1), FG.z - 3, Math.max(x0, x1), FG.z - 1, GY - 1, GY + 20); }
  // two tall stair towers in the old wall, joined by a high walkway behind the gate (a view down onto the portal)
  for (const sx of [-1, 1]) K.stairTower(FG.x + sx * 16, FG.z - 4, Y, 30);
  K.bridge({ x: FG.x - 13, z: FG.z - 4 }, { x: FG.x + 13, z: FG.z - 4 }, Y + 29, 1);
  // great chains hanging over the portal
  hang(FG.x - 8, FG.z + 2, GY + 19); hang(FG.x + 8, FG.z + 2, GY + 19); hang(FG.x, FG.z + 8, GY + 14);
  meta.portal = { x: FG.x + 0.5, y: GY + 8, z: FG.z - 1.5 };
}



