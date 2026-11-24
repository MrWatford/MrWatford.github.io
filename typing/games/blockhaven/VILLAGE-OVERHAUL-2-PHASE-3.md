# BlockHaven Village Overhaul 2.0

## Phase 3 and release handoff

New Surface worlds use generation **23** and Stonehaven layout **4**. The save schema is still **4**. The planner reserves the new city before chunks are generated. Stonehaven layouts 1–3 and authored campaign settlements keep their versioned construction paths. Opening an existing world never upgrades its blocks in place.

### Developed footprint and capacity

A developed column is a unique block column written by the city’s terrain or structure stamp. Furnished buildings count the separate houses, trade buildings, civic buildings and windmill granary. The original keep, gatehouses, defensive towers, open stalls, fields and gardens are additional capacity outside that count.

| Sample | Reserved dimensions | Developed columns | Furnished buildings | Map markers inside the city |
| --- | --- | --- | --- | --- |
| Phase 2 Stonehaven | 112 × 112 | 7,648 | 8 | 0 |
| Phase 3 inland benchmark | 192 × 192 | 31,037 | 49 | 8 |
| Phase 3 coastal benchmark | 192 × 192 | 31,125 | 50 | 9 |

The inland capital develops **4.06×** the previous developed area and **2.47×** the entire previous reservation. It generates **659 crop cells** across four irrigated fields. The measured area includes streets, landscaped wards, the old keep precinct, workshops, public spaces, and farms. The bounds allocate just under three times the former reserved area.

The generation-23 survey also passed the Phase 2 rural settlement checks across ten biome palettes. That survey observed 13–16 buildings in hamlets, 19–24 in developed villages and 40–43 in fortified villages, with the same 80×80, 96×96 and 128×128 reservations.

### What changed

- The Grand South Gate, outer curtain walls, battlements and eight new towers surround the historic keep and Crown Tower. Players can use doors and ladders to reach the new lookouts. Broad entrances and streets join the original market and keep approaches to the new wards.
- The capital has a central market with covered stalls and framed wares, a civic hall, a large library, an inn, artisan yards, multi-story noble homes, and west residential lanes. The agricultural ward includes a windmill granary, multiple crop fields, a stable, an orchard, and stock pens. A fitted east quay and waterfront buildings appear only where the site has natural shore access.
- The new construction reuses Phase 1 timber, stone, stair roofs, slabs, stained panes, iron bars, paintings, filled frames and stocked armor stands. Existing lamps and interior lighting supply the evening light. Village public furniture now has additional sandstone, spruce, birch and masonry treatments. A capped number of nearby chimneys emit cosmetic smoke using the existing particle pool and stop when reduced motion is enabled.
- Farmers follow farm lanes between work and their fields, shopkeepers and artisans visit their workstations, and residents can gather locally in the afternoon. The usual night and bell routines work with the new districts. Residents can choose a nearby home for shelter when it is away from the threat. Event attendance uses the existing festival calendar and inventory offers. Festival stalls and pennants are temporary scene objects.
- Existing trade-funded village projects retain their progress. New villages and Stonehaven can fund an Artisan Workshop on a reserved plot. Construction checks player modifications, containers and occupancy before writing blocks or placing fixtures.
- The Explorer’s Map still opens to the Stonehaven landmark through **M** and exposes district markers for the new layout. The siege uses staged exterior and gate-approach positions, checks open ground and clearance for each enemy, and retains the same wave and reward ledger.

### Verification

Run `node tools/village-architecture-check.mjs`, `node tools/grand-villages-check.mjs` and `node tools/stonehaven-grand-check.mjs` from the game directory with Node 18 or later.

- The architecture suite passed 60 designs, 300 palette and lot combinations, 95 physical stair climbs and its Early Access import check. The village suite generated 372 rural settlements and checked representative terrain, roads, crop irrigation, workstations, and save records in ten biome palettes.
- The capital suite built two real seeded cities, checked 81 new home-to-job routes and found paths from the Grand South Gate to all 17 district markers across both cities. It checked gate openings, tower doors and ladders, stocked displays, irrigated crops, map coordinates, shore selection and protected placement.
- The scripted siege ran all three waves and defeated 15 enemies. Repeated reward claims yielded 24 Jade total. Festival attendance, stock decrement, and closure passed. An edited workshop lot refused construction. Restoring the generated block let the project complete and add its fixtures.
- Creative and Survival save files passed the game’s JSON import and reopen path, including Stonehaven location, construction edits and contents. Generation-22 Stonehaven reopened byte for byte. A separate check matched 288 chunks from generations 5–22 and confirmed four authored campaign modules matched the Phase 2 copy.
- This session could not bind loopback HTTP. The checks exercised the real engine modules in Node and used the real chunk meshes for software renders. Live browser play, WebGL frame rate, multiplayer, audio, and browser IndexedDB still need a playthrough. The visuals are software renders of generated geometry. They are not screenshots of a running browser.

### Performance measurements

On the ARM64 Mac, the two benchmark runs took about **6–9 ms** to plan a capital and build the small inner stamp. Loading the 144 city chunks plus the surrounding 52 neighbor chunks and auditing the stamp took about **167–196 ms** in the logged runs. One market chunk mesh took about **12–16 ms** and contained **2,834–4,830 triangles** across those samples. The report includes the single-run results so these figures can be reproduced separately from a browser benchmark.

The new city indexes terrain features, residents, crops and smoke sources by chunk. It builds only the requested chunk’s exterior, and it reuses the existing chunk mesh renderer and texture atlas. Villagers and guards share a local threat index refreshed every 0.35 seconds. Failed routes use a cooldown and react to player edits. Smoke emits at most six particles per 0.63 seconds under Fancy graphics, and at most three under Fast. The save stores the city’s small placement record and regenerates its geometry rather than serializing a giant city voxel array.

### In-game review

1. Unzip the package and open **Preview-BlockHaven.command**. Create a new **Creative** game on **The Surface** using `Stonehaven Architecture`. Set **Graphics** to **Fancy** if the device handles it. Use `F3` to see position. On some Macs this is `fn` + `F3`.
2. Open **M** and set the waypoint for **Stonehaven**. Follow it to the **Grand South Gate**. Stonehaven is the named gold marker. The district markers give destinations once you reach the city.
3. For an aerial view, fly up from the Grand South Gate and turn back toward the **Crown Keep**. For the market view, walk straight through the outer gate to **Grand Market**. Stand near the fountain after sunset for the nighttime view. Walk east to **Artisan Street**, west to **West Granaries** and **West Residential Lanes**, and north to the **Noble Gardens** and keep.
4. For the coastal benchmark, start a new Creative Surface world with seed `Stonehaven Shore 3`. Follow the Stonehaven marker and use **East Waterfront** if present. Story reservations can cause a seed to choose a different valid site. Docks appear only when the selected site has a suitable shoreline.
5. For the rural views, open the Phase 2 report in this package. Use `Grand Village Benchmark` for the hamlet and fortified village, and `Stonehaven Architecture` for the developed forest village and mountain terraces. The Phase 2 report includes a read-only console command that locates actual villages after world reservations.
6. To check the siege in a disposable world, switch to Survival, choose a non-Peaceful difficulty, and open a nearby resident’s trade panel at the Grand South Gate. To see festival activity, visit the Grand Market or a village commons on days 2, 6, 10, and 14. Return to Creative for the overview and interiors.

### Source and publishing

`stonehaven-grand.js` contains placement, plan features, landmarks, districts, and the chunk stamp. `stonehaven.js` preserves earlier layouts and manages saved placement. `settlement-life.js`, `entities.js`, and `main.js` implement the routines and bounded atmosphere. `settlement-festivals.js`, `settlement-raids.js`, `village-growth.js`, and `starter.js` adapt the existing systems. `grand-villages.js` and `grand-village-build.js` integrate the rural commission and material polish. `index.html` updates entry and module cache revisions together.

Use the patch that matches the desktop baseline. Run the local checks and test a fresh browser profile on the same website origin you plan to deploy. Before publishing, check an existing saved world, returning-browser module caches, Survival and Creative play, and all three siege waves. Publish the changed entry and module files together. The source package does not include a change to deployment configuration.
