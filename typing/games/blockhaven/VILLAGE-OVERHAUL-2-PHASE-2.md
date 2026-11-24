# BlockHaven Village Overhaul 2.0

## Phase 2 village expansion

New Surface worlds use generation **22** with three procedural settlement classes. The save schema is still **4**. The new planner builds on the existing Phase 1 architecture, block registry, irrigation and crop simulation, NPC professions, chunk mesher, container defaults, and persistence systems.

### Measured sizes

The survey used three seeds across a roughly comparable region for each generator. A developed lot is a 16×16 chunk with a house, public square, agricultural plot, pasture, orchard, garden or construction commons. Ruin and portal exclusions are removed from the developed area. The building column counts usable buildings and excludes wells, walls, gatehouses and outdoor lots.

| Layout | Outside dimensions | Developed lots observed | Developed area observed | Buildings observed | Settlements sampled |
| --- | --- | --- | --- | --- | --- |
| Phase 1 | 48 × 48 | 6–9 | 1,536–2,304 blocks² | 3–6 | 338 |
| Hamlet | 80 × 80 | 22–25 | 5,632–6,400 blocks² | 13–16 | 195 |
| Developed Village | 96 × 96 | 31–36 | 7,936–9,216 blocks² | 19–24 | 159 |
| Fortified Village | 128 × 128 | 60–63 | 15,360–16,128 blocks² | 40–43 | 18 |

The 22-lot minimum observed hamlet is **2.44×** the full previous nine-lot design. The planner enforces a minimum of 22, 31 and 56 developed lots and at least 12, 18 and 35 buildings for the respective sizes. Seeded cells keep a gap between settlements. The planner can select a smaller class in tighter terrain, and it reserves existing landmarks rather than overwriting them. Naturally generated settlement positions and counts across the whole world can differ from the earlier 6-chunk grid.

### Terrain and districts

- Each site has a connected road graph with a wider market crossroad, bent minor lanes, paved approaches, graded stair blocks, and plank bridges over shallow water. Stone foundations and retaining edges support the buildings. Construction grades only the road and lot surfaces, leaving terrain outside them in place.
- Farm fields are placed toward the edges with four crop beds, a central irrigation channel and a crossing. Wheat, carrots, potatoes and beets use existing crop stages and register in the normal growth tracker. Farms include farmland, paths, storage and parked carts. Orchards, working stables and fenced stock pens share the outskirts. Sheep or camels spawn once using the regular creature lifecycle.
- The central well and bell have a covered pavilion and outdoor stalls. Developed villages add market shops, inns, libraries, forge buildings and windmills. Fortified villages add continuous curtain walls, corner lookouts, battlements and recessed gatehouses. Gardens include ponds, planted hedges, trees, seating and lamps. The existing trade-funded construction projects keep their own commons lot.
- Ten palettes were generated during the survey. Forest, birch, plains, sandy, taiga, mountain, savanna, cherry, wetland and jungle can all appear. Taiga uses spruce with steep profiles and amber panes. Desert lots use sandstone terraces and covered market stalls alongside some pitched roofs. Mountain lots use dark roofs and stone retaining walls. The mountain verification site had a 21-block difference between its lowest and highest planned street levels.
- Phase 1 furnishings remain interactive. Villager homes and workstations come from the architecture builder’s anchors. A discovered village record pins the class and footprint for reloads and adds a marker to the Explorer’s Map. Landmark searches reserve that footprint without using the reserve to suppress first-visit spawns.

### Reproduce the preview

Open the preview launcher, then create a new **Creative** world on **The Surface**. The rendered benchmarks below use the named seed and the indicated world X/Z. They were produced from BlockHaven’s chunk geometry and block atlas. The gameplay generator may shift or skip a site when a story landmark or the Starter Home reserves its proposed footprint.

| Render | Seed | Center X, Z | Buildings |
| --- | --- | --- | --- |
| Fortified village | Grand Village Benchmark | 88, 72 | 41 |
| Desert hamlet | Grand Village Benchmark | -56, -88 | 15 |
| Forest developed village | Stonehaven Architecture | 56, -56 | 24 |
| Mountain terraces | Stonehaven Architecture | 232, 216 | 23 |
| Taiga village | Riverbend | 72, 56 | 23 |

To find actual settlements after story reservations are placed, open Chrome DevTools while in a new Surface world and paste the following read-only inspection. It prints the nearest settlement of each class to the console. Fly toward the printed coordinates in Creative. Once nearby, the village appears on the Explorer’s Map under **M**.

```js
const game = window.__bh;
const nearby = new Map();
const player = game.player.pos;
const cellX = Math.floor(player.x / 160), cellZ = Math.floor(player.z / 160);
for (let z = cellZ - 8; z <= cellZ + 8; z++) {
  for (let x = cellX - 8; x <= cellX + 8; x++) {
    for (const [dx, dz] of [[4, 4], [4, 5], [5, 4], [5, 5]]) {
      const site = game.gen.villagePiece(x * 10 + dx, z * 10 + dz)?.settlement;
      if (!site) continue;
      const [X, Z] = site.center;
      const distance = Math.hypot(X - player.x, Z - player.z);
      if (!nearby.has(site.kind) || nearby.get(site.kind).distance > distance) {
        nearby.set(site.kind, { class: site.kind, biome: site.biome, X, Z, buildings: site.buildings, distance });
      }
      break;
    }
  }
}
console.table([...nearby.values()]);
```

### Verification

Run `node tools/grand-villages-check.mjs` and `node tools/village-architecture-check.mjs` in the BlockHaven directory with Node 18 or later.

- The placement survey observed 372 expanded settlements. Road connection, resident placement, building entrances and workstations, crop irrigation and tracking, and pen stock were tested in class benchmarks plus a representative settlement in each of the ten palettes.
- The three main fixtures had 2,111, 1,455 and 3,643 connected walkable road cells, and 336, 224 and 560 live crop positions. The mountain fixture had 479 stair cells.
- Generation reloads, discovered village records, protected footprints, player-edited blocks, and import of the Early Access fixture passed using the game’s save importer and storage fallback. A separate comparison confirmed 252 sampled chunks from generations 5 through 21 matched the prior source byte for byte. The tested Stonehaven site and stamp matched generation 21.
- The Phase 1 regression suite passed all 60 designs, 300 palette and lot combinations, and 95 physical stair climbs. Generated meshes contained valid geometry and UVs.
- The workspace blocked loopback HTTP. Live WebGL, browser IndexedDB, and an end-to-end Survival or Creative play session remain to be checked. The screenshots are software-rendered from the generated game meshes.

### Handoff for Phase 3

`js/grand-villages.js` owns selection, occupancy, settlement records and grades. `js/grand-village-build.js` stamps a single 16×16 lot using those decisions. Main integrations are in `worldgen.js`, `world.js`, `main.js`, `entities.js`, and `starter.js`.

Stonehaven uses its Phase 1 capital layout in generation 22. The authored campaign and Lantern Vale layouts keep their published placement paths. Older saves are versioned and are not converted to the new settlement generator. A future opt-in upgrade would need a new migration for the complete surrounding footprint. Stonehaven's capital expansion belongs to Phase 3. Windmill sails are static and corner lookouts are exterior defensive structures.
