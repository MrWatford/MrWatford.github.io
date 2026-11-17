# The Stronghold Reborn — the Endwatch Citadel (plan)

Mr. Watford's spec (2026-11-16) turns the underground Stronghold into a huge above-ground castle dungeon that leads to
the Hollow portal. Reference: `ScreenRecording_11-16-2026 18-03-00_1.MP4` (a 40-second "Minecraft Medieval Castle" reel).
Status: **All 6 stages built and browser-tested 2026-11-16, NOT published (ready when he says).** (Earlier note: Stage 1 alone could not be published, since in Survival the
portal chamber stays sealed until the Castellan (Stage 5) can be beaten, so new worlds couldn't reach the Hollow.

His answers (2026-11-16): players **must beat the Castellan** to reach the portal (no digging in); every castle goes
**on the Explorer's Map** as well as being found by the Eye of the Void.

## Stage 6 — polish and final checks (done 2026-11-16; ready to publish when he says)

- `js/citadel-ambience.js`: wind on the walls (through main.js's wind), fire crackle within ~6 blocks, distant
  groans/rattles in the dungeons every 14–30 s, a hum and sparks at the portal (violet once lit). New "clank" sound in
  audio.js (the Castellan's armor; also the desert guardians, which were silent).
- Portal chamber brighter: a ring of ceiling lights and four corner braziers (light went from very dark to 11/15).
- New worlds (nothing explored yet) move a stronghold outward — up to 300 blocks, a little to either side — when another
  landmark already claimed its spot, so Legacy Campaign worlds get all three castles. Saved worlds never move one.
- Speed (this Mac): castle design 0.2 s once per facing per page load; castle chunks ~5 ms vs ~1 ms for plain land;
  game loop the same in the courtyard as far away (drawing speed not measured here: needs a real Chromebook).
- Regression: normal worlds (3 seeds) get 3 castles ≥ 189 blocks from other landmarks, the Desert Temple, and the
  Starter Home; Legacy Campaign worlds (3 seeds) get 3 castles ≥ 174 blocks from campaign places; a moved castle has its
  frames, the Eye of the Void points to it, and the map lists it.

## Stage 5 — the Fallen Castellan (built and browser-tested 2026-11-16, NOT published)

- Throne room (`buildCanonical` 7e in `js/citadel.js`): a vaulted hall behind the keep (replaces the annex; interior
  31 × 12, ceiling arching to y 52) with a checkered floor, red runner, 7 gold-capped pillars, stained-glass windows
  (new block 233 Stained Glass), banners, braziers, chandeliers, a 3-step dais and a high-backed throne, a tome.
  Its only way in is the dungeon's spiral stair.
- `js/citadel-boss.js` (`G.citadelBoss`): species `castellan` (260 HP, dark weathered plate, red crest, glowing visor,
  greatsword, shield, cape; installed from entities.js; poses in `animateCastellan`). Seated until you come within 15
  blocks, then rises (2.4 s intro, roar, message, boss bar with the phase name). Phase 1: telegraphed combos (raised
  blade + sparks) and a raised shield that blocks blows from the front (`e.guarding`). Phase 2 (< 60%): 2-hit combos,
  ground slam (warning ring, 4.6 radius, 1.1 s), charge (stunned 2.2 s if he hits a wall), 2 Groaners once. Phase 3
  (< 30%): faster, 3-hit combos, no shield, 2 Rattlers once. Every combo ends with an opening. Leave the hall or fall
  and he goes back to his throne at full strength. Defeat: he kneels (2.4 s), fades; saved as
  `spots[i].boss.defeated`; never respawns.
- Reward: **Castellan's Greatblade** (item 641; tier 4, 8 damage, heavy 0.75 s, 1100 durability; right-click Sweeping
  Cleave: 6 damage to every enemy in a cone in front, out to 3.6 blocks, with knockback; 8 s cooldown; 3 durability) +
  120 XP. After the win the ward doorway into the keep's Hall of the Seal dissolves and the Castellan's Seal opens onto
  the spiral stair down to the portal.
- The portal chamber got grander: glowing seal-stone carvings in the walls (still unbreakable), gold-capped pillars,
  banners, a ring of light around the portal, a red runner. Activation uses the game's normal Eye-of-the-Void frames.
- Campaign Chapter 8 hints now mention the Endwatch Citadels and the Castellan.
- Tested (seed `citadel-test-1`): route from the dungeon into the throne room; seated → rising → fighting with the boss
  bar; every move seen (combos, slam, charge and wall stun, shield); phase names; guards called in phases 2 and 3; defeat
  → kneel → reward in inventory, doorway and Seal open; walk from the throne room through the keep down to the portal
  dais; all 12 frames filled → portal lit → stepped in → arrived in the Hollow; win saved across reload; Greatblade
  cleave hits the two enemies in front and not the one behind, with its cooldown. Fixed: the boss texture used a
  random-pixel helper the creature painter doesn't have.
- Not checked: a real hand-played fight (difficulty balance), Hard difficulty, Chromebook speed. The portal chamber is
  still a little dark.

## Stage 4 — the Forgotten Dungeons and the Royal Treasury (built and browser-tested 2026-11-16, NOT published)

- Dungeons (`buildCanonical` 7c in `js/citadel.js`, walk height y 22, never touching the portal's ward box): a cellar
  stair from the kitchens → Guard Post (watchfire) → Prison Block (cells behind portcullis bars, two broken open with
  chests) → Dart Gallery (8 vents) → Crypt (stone tombs, skulls, candles, watchfire) → Sunken Library → hidden plates
  and vents → Lost Treasury (gold, 3 chests, watchfire, a shortcut spiral stair up to the courtyard behind a hatch) →
  Collapsing Bridge (cracked tiles over a water pit, with steps back up) → Lava Hall (fenced walkway, watchfire, the
  lever) → a stone door of ward bricks → a spiral stair up into the annex behind the keep. The annex no longer opens
  from the keep (its doorway is ward stone), so the dungeon is the way in. That's where the throne room goes (Stage 5).
- Royal Treasury (7d): inside the keep's front-east tower at the library's level (gold-ringed quartz floor, gold bands,
  royal chest on a gold pedestal, 2 more chests, brazier, helm stand, weapon rack, tome). The tower's wall bulging into
  the library corner is lined with books; a **Worn Bookshelf** (red book sticking out) in the library's east wall opens
  three shelves into it. Royal chest (filled once, ever): Sky Sword, 2 Golden Apples, 10 Gold Ingots, 4 Skyshards, a
  Lifeward Totem, 2 Gold Blocks, 16 Arrows. All four keep corner towers are now walled off from the rooms.
- New blocks 230 Watchfire (checkpoint), 231 Worn Bookshelf, 232 Old Iron Lever. 5 new tomes (gaoler, crypt, sunken
  library, lava-hall note pointing to the lever, treasury).
- `js/citadel-dungeon.js` (`G.citadelDungeon`): levers (stone door; shortcut hatch), the bookshelf door, watchfires
  (`respawnSpot()`, used by `G.respawn`; `die()` now records `G.deathSpot` always), ambushes (prison 4, crypt 4,
  treasury 3 Skitters; cleared for good only when they die), dart vents (spark 0.6 s, then fire; easy 1 / normal 2 /
  hard 3 damage), the collapsing bridge (tiles fall 0.55 s after you step on them, grow back 14 s later when you're
  away). Creative skips ambushes, darts, and collapses. Opened doors/hatch/shelves stay open after reloads.
- Tested (seed `citadel-test-1`): every room reachable from the kitchen; the annex and treasury unreachable until
  their mechanisms, reachable after; royal chest contents; prison ambush spawns and clears; darts fly; a tile collapses
  under the player (falls into the water) and grows back; the pit can be climbed out of; a lit watchfire is where you
  wake after dying; the hatch gives a courtyard shortcut; save/reload keeps everything. Fixed during testing: the
  prison entrance went into a cell, the spiral stair's doorway wasn't cut, the secret door was buried in the tower wall,
  the pit's top steps had no head room, the Lava Hall's side railings didn't appear.
- Not checked: real hand-played runs (dodging darts, crossing the bridge at walking speed), Hard difficulty, Chromebook.

## Stage 3 — inside the keep and the Courtyard Battle (built and browser-tested 2026-11-16, NOT published)

- Keep rooms (`buildCanonical` section 7b in `js/citadel.js`): ground floor = Great Hall (banquet tables and benches,
  head table, fireplaces with fire, banners, hanging lamps), kitchens (furnaces, tables, hay, 2 treasure chests),
  armory (weapon racks, smithing table, iron, 2 chests), Hall of the Seal (braziers beside the seal); second floor =
  Grand Library (shelf rows and walls, reading tables), barracks (8 beds, chest), storerooms (hay, logs, 3 chests);
  top floor = two royal bedchambers (beds, braziers, wardrobe, reading corner, chest), royal study, map room. Half-step
  stairs between all floors and up to the roof walk. Treasure chests use the game's normal ruin loot.
- New block 229 Ancient Tome (interact "tome"): 7 tomes of original lore (`TOMES` in `js/citadel-keep.js`): the
  founding, the seal, the library (hints "Not every wall in this room is a wall" for Stage 4's vault), Lady Maren's
  letter, the captain's log, the Castellan's oath, the three citadels.
- `js/citadel-keep.js` (`G.citadelKeep`): the keep door is barred (portcullis) until the **Courtyard Battle** is won:
  3 waves (Groaners + Skitters; Rattlers + Groaners + a Hisser; Vindicators + Rattlers + Groaners), sized by difficulty,
  appearing at least 12 blocks away, with a counter and a breather between waves. Leaving mid-wave resets that wave.
  **Room guards:** kitchens (2 Groaners), armory (2 Vindicators), barracks (3), storerooms (2 Skitters); a room is
  cleared for good only when its guards die. Creative and Peaceful skip the fighting (the keep door opens as you walk
  up). Saved in `spots[i].keep` (wave, won, rooms, tomes read); fights in progress are never saved.
- Beds, chests, tomes, and portcullises now turn with the castle (`TURNS` in citadel.js).
- Tested (seed `citadel-test-1`): rooms generated; all 3 waves start, advance, and win; door bars lift; kitchen guards
  spawn and clear; tome opens; every room and the roof walk reachable on foot; save/reload keeps won, rooms, tomes, and
  the lifted bars. Fixed during testing: the Outer Siege counter showed inside the keep (now hidden once the gate is
  open), and carpets replaced the floor (removed). Screenshots `tools/citadel-shots/s3-*.jpg`.
- Not checked: real hand-played fights, Hard difficulty, Chromebook speed. The rooms could use more furniture later.

## Stage 2 — the gate and the Outer Siege (built and browser-tested 2026-11-16, NOT published)

- `js/citadel-gate.js` (`G.citadelGate`): castles generate **closed** (raised timber drawbridge on the hinge row v 70,
  open water in the gap v 71–77, Iron Portcullis filling the arch at z 51). New blocks 227 Iron Portcullis (bars,
  unbreakable) and 228 Gate Winch (interact "winch"). Two shore watchtowers and stone chain posts in `citadelLand`.
- **Outer Siege:** 10 defenders on Normal (7 Easy, 13 Hard): Rattler archers on both watchtowers and the bridge (they
  hold their posts), Groaners, Skitters, and a Siege Captain (Vindicator). They don't burn in daylight (`e.noBurn`).
  Counter at the top of the screen; beaten posts are saved (`spots[i].gate.down`), so leaving and coming back keeps
  progress. Not saved as creatures; they leave when you go away and the rest come back.
- **Opening:** the outer winch works once the siege is won (Creative, Spectator, and Peaceful: at once). The inner winch
  just inside the gate always works, so nobody gets shut in. The portcullis grinds up (3 s), then the drawbridge swings
  down on its chains (4.5 s) with chain and thud sounds; then real blocks (planks, log edges) replace the moving parts.
  Chains are always shown near a castle (short when raised, long when lowered).
- **Saving:** `spots[i].gate.open` is saved as soon as it starts; the block changes are saved as world changes, and a
  gate whose save happened mid-swing finishes itself on the next load.
- Tested (seed `citadel-test-1`): closed state generated; Creative winch; animation; walk from shore to keep without
  touching water; reload of an opened gate and of a half-opened one; Survival siege spawns all 10 at their posts with the
  counter; locked-winch message; win → message → winch → open; archers still on their towers after a minute; inner
  winch opens an unwon gate; Easy = 7; Peaceful winch opens. Screenshots `tools/citadel-shots/s2-*.jpg`.
- Not checked: a real fight by hand (aiming, arrows), Hard difficulty, Play Together, Chromebook speed.

## Stage 1 — what was built

- `js/citadel.js`: `buildCanonical()` (castle cells, gate facing +z), `citadelCells(rot)` (turned so the gate faces
  spawn), `citadelLand()` (island r 72 at y 35, lake to r 100, shore blend to r 122, arched bridge, wooden span where
  the drawbridge goes), `citadelFrames()` (portal frames, ~1 in 10 with an eye, after the castle), `initCitadel()`
  (per-world decisions in `story.citadel.spots[i]`, map landmarks). Palette in `MAT`.
- Castle: 8-sided curtain wall (110 × 96, 12 tall, 3 thick, dark base, merlons, slits), 8 round towers with red stepped
  cone roofs, a twin-towered gatehouse with a gabled middle, banners and braziers; a 49 × 52 keep with three floors,
  tall windows, checkered Great Hall floor, front porch with spire, back annex, 4 corner towers, central tower with a
  banner (top at y 78); courtyard with sand paths, fountain, gardens, stables, barracks, market stalls, wagon, two
  half-step stairs up to the wall walk; doorways so the wall walk runs through every tower.
- Portal chamber: same 12 frame spots at y 22, wrapped in unbreakable Ancient Ward Bricks; a spiral stair up to the
  Castellan's Seal (unbreakable) in the keep floor. Creative players can still break through.
- New blocks 221–226: Red Roof Tiles, Cracked Stone Bricks, Stone Brick Step, Castle Banner, Ancient Ward Bricks,
  Castellan's Seal.
- Old strongholds are skipped in `worldgen.js` when `s.citadel` is set. Saved worlds: any changed block within 126
  blocks, an overlapping landmark, or a village someone has walked through keeps the old underground stronghold.
  Unseen villages there don't generate. New temples, homes, campaign sites, and relic sites now keep clear of
  stronghold spots (185 / 150 / 160 / 130 blocks).
- Explorer's Map lists every stronghold: "Endwatch Citadel" (castle icon, waypoint at the bridge's shore end, directions)
  or "Old Stronghold". The Eye of the Void says the portal is sealed under the keep.
- Tested (seed `citadel-test-1`): all 3 castles placed in a new world; walked from the shore across the bridge, through
  the gate, into the keep and Great Hall, stables, barracks, up to the wall walk, along all 7 wall stretches and into
  all 8 towers; no route reaches the portal chamber and its shell has no gaps; frames in place; old-save rule restores
  the old stronghold; Eye message; map list and icon; all item icons; no console errors. Screenshots: `tools/citadel-shots/`.
- Not done yet: keep interiors and stairs between floors (Stage 3), the drawbridge (Stage 2), the grand portal chamber
  look (Stage 5), sounds; not checked on a Chromebook or in a Legacy Campaign world.

## What the video shows

Watched as 32 still frames (the reel's phone format had to be converted first).

- **Setting:** a round island in a lake, ringed by forest, reached by a long, straight stone bridge on arches.
- **Outer wall:** a stretched hexagon (wider than deep), with a round tower at each of its 6 corners. The walls have
  battlements and a walkway on top. Gray stone brick with a darker blue-gray base and trim.
- **Gatehouse:** in the middle of the side facing the bridge. Two round towers with red, stepped cone roofs, and a tall
  gable between them over a big arched gate.
- **Keep:** a large rectangle inside the wall (about half its size). Towers at the corners with red cone roofs, a
  smaller wing on one side, red roofs over the halls, a decorated front gable with a red spire, and one tall central
  tower with a flag on top (the highest point).
- **Courtyard:** grass with yellow sand paths, gardens with flowers, and stone stairs up to the walls.
- **Inside the keep:** a dining hall with a black-and-white checkered floor and long tables, wooden stairs, and small rooms.
- **Colors:** light gray stone brick, darker blue-gray stone, red roofs, oak wood, yellow paths, green grass.

## Estimated size (no exact block counts are visible)

| Part | Estimate | Confidence |
|---|---|---|
| Outer wall (hexagon) | about 110 wide × 85 deep | Medium |
| Corner towers | round, about 9 across, walls +6 taller, cone roof about +8 | Medium |
| Wall height | about 12 | Medium |
| Gatehouse | about 30 wide, gate opening about 7 × 9 | Medium |
| Keep | about 50 × 40, walls about 20 tall | Medium |
| Central tower | the highest point, about 40 above the ground | Low |
| Island + lake | island about 150 across; water about 20 wide around it; bridge about 40 long | Low |

**Engine limit:** the world is 80 blocks tall and land sits around height 32–45, so the tallest point can be about
35–40 blocks above the ground. That fits the video's proportions.

## How the game works today (from the code)

- 3 strongholds per world at fixed spots 260–460 blocks from the middle (`strongholdSpots` in `js/worldgen.js`).
  Each is small and underground at height 22: a portal room with 12 frames (`frameSpots`) and four halls to treasure rooms.
- Eye of the Void (`throwEye` in `js/main.js`) flies to the nearest one. Filling the frames opens the Hollow portal;
  the Hollow Wyrm waits on the other side. Campaign Chapter 8 sends players there too.
- Strongholds are built as each chunk is generated, so any stronghold a player has dug into is saved as their own changes.

## The plan: keep the portal exactly where it is, build the castle on top

The castle is centered on each stronghold spot, and the portal room stays at the same coordinates (now a grand chamber
under the keep). Eye of the Void, portal activation, the Hollow, the Wyrm, and the campaign keep working unchanged.

**Saved worlds:** a stronghold anyone has dug into, built near, or seen keeps its old underground form, untouched.
Only strongholds nobody has reached become castles. The same safety rules as the Grand Desert Temple apply.

## Stages (each one built, browser-tested, shown to him, then the next)

1. **The castle itself:** island, lake, and arched bridge; the hexagon wall with 6 towers; gatehouse; keep shell with
   towers, roofs, and central tower; courtyard with paths, gardens, and buildings; the portal chamber under the keep;
   natural blending into the land; placement and saved-world safety. New castle blocks (e.g. red roof tiles, dark trim,
   a cracked/weathered brick).
2. **Drawbridge and portcullis:** animated, with sound and solid collision, saved across reloads, never trapping
   anyone. Outer guards (Stage 1 of combat) must be beaten to lower it; in Creative it can simply be opened.
3. **Inside the keep:** Great Hall, banquet hall, library, armory, barracks, kitchens, bedrooms, tower stairs, and
   lookouts. Courtyard waves of enemies that change from wave to wave.
4. **Dungeons and the secret vault:** cells, crypts, tunnels, arrow traps, collapsing floors, lava, secret doors,
   checkpoints and shortcuts; the hidden royal treasury behind a library mechanism (optional, with lore).
5. **The Fallen Castellan:** new armored knight model and animations, a 3-phase fight in the throne room with a boss
   bar, an intro, and doors that can't trap you; the Castellan's Greatblade reward; defeat saved; a hidden stair down
   to the portal chamber opens. Walkthrough and campaign text updated.
6. **Polish:** sounds (wind, chains, torches, echo), performance on a Chromebook, final checks, then publish when he says.

## Questions for him before Stage 1

- The lake and island from the video: carve a lake around each castle (default), or build on dry land with a moat?
- In Survival, should the portal be reachable **only** after beating the Castellan (as the spec says), or also by
  digging straight down like today?
