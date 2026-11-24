# BlockHaven Village Overhaul 2.0

## Phase 1 architecture

This phase adds a shared architecture library for naturally generated Surface villages and the free-play Stonehaven capital. It uses the existing plots, placement rules, block registry, chunk mesher, collision boxes, villager routing, and container records. The authored campaign settlements, Lantern Vale, the original Stonehaven layouts, and the castle landmarks retain their released layouts.

### Implementation

| System | Changes |
| --- | --- |
| Natural villages | Generation 21 selects house designs deterministically from the seed, profession, and plot. The 3×3 footprint, plot assignments, farm and garden plots, job blocks, and plaza are preserved. Compact hillside and shore plots use a shallower form of each design. |
| Stonehaven | New capitals use layout 3 at the existing 112×112 footprint. The six existing residential lots and two existing trade lots use the library. Layouts 1 and 2 continue to load through their original construction paths. |
| Construction | Mixed stone foundations, regular and horizontal timber beams, masonry and plaster panels, overhanging stair roofs, inverted support stairs, slabs, ridge caps, cross gables, dormers, hipped edges, lean-tos, porches, chimneys, shutters, sills and planted boxes. |
| Glazing | Clear panes, blue and yellow stained panes, full-glass storefronts, iron-barred forge and storage windows, and fenced or glazed balconies use the existing geometry and lighting. |
| Interiors | Functioning beds, crafting tables, map tables, lecterns, anvils, grindstones, furnaces, smokers, barrels and chests. Existing paintings, filled item frames, stocked armor stands, lighting, shelves, carpet and stair seating are placed by room use. Upper floors have real stairs and landings. Inn guest rooms are divided with their own entrances. |
| Persistence | Generation version is 21 and save schema stays at 4. Generated contents enter the existing container map on chunk load. Player-edited block positions and existing container records take precedence. Old Stonehaven values continue to use their original stamp representation. |
| Materials | Existing blocks and textures supply the palettes and fixtures. Stair corners use opt-in metadata and share their models with collision. Horizontal beam metadata selects the existing log textures in the chunk mesher. |

The library has six original designs each for cottages, medium homes, manors, farmhouses, smithies, shops, libraries, inns, storehouses and stables. Designs vary in plot proportions, gable orientation or roof profile, door offset and upper-floor layout. The four natural village palettes are plains, forest, birch forest and desert. Stonehaven uses a separate timber and masonry palette. Seven reference images are under `assets/references/village-overhaul-2/` and are for development review.

### Benchmark group

Create a new Creative world on **The Surface** with seed `Stonehaven Architecture`. Open the Explorer’s Map with **M** and follow the Stonehaven marker. Enter at the South Gate. The castle is straight ahead. The house fronts face south.

| Where to look inside the city | Benchmark |
| --- | --- |
| West lane, north of the forge | Orchard Cottage with wooden dormer, masonry base, shutters and a planted box |
| West lane, closest to the South Gate | Merchant’s Manor with intersecting roofs, upstairs bed and glass-sided balcony |
| West lane, middle lot | Forge Court with barred windows, forge, anvil, frame and leather armor display |
| East lane, north lot | Harvest House with a kitchen, bed, crop storage, and a barrel stocked with seed and carrots |
| East lane, middle lot | Lantern Exchange with shop counter, filled frames, rear storage and a bedroom upstairs |
| Side district past the east gate | Reading Gallery with stained windows, shelves, lectern, a painting and an upstairs study |

The accompanying images show the generated city, roofs and rooms using the game’s voxel meshes, atlas and computed lighting. Their camera and shading come from a software rendering pass.

### Checks run

Run `node tools/village-architecture-check.mjs` in the BlockHaven directory with Node 18 or later.

- 60 designs across 300 palette and lot combinations passed checks for registered blocks, fixture placement and routes to workstations.
- 95 standing-height player climbs passed using the game’s movement and collision code. The test exposed an upstairs-library shelf conflict and the fixture was moved.
- 48 stair configurations and three window or bar fixtures passed render geometry and collision checks.
- 29 generated village houses and ten Stonehaven resident spawn points were checked. Capital meshing produced finite texture coordinates and nonzero light at a furnished work area.
- The game’s save importer and storage fallback preserved an emptied frame after import and reopen. A player replacement at the same location survived chunk unload and reload. The repository’s Early Access world export also reopened with the original generation and block edits.
- 72 sampled chunks across generations 9, 12, 13, 14, 15 and 20 matched the desktop source byte for byte. Sampled legacy Stonehaven stamps also matched. The test verified that new capital placement skips an edited footprint and a landmark reservation excludes a village plot.

### Handoff for Phase 2

Use `VILLAGE_BUILDINGS`, `fitVillageBuilding`, `villageBuildingAnchors`, and `buildVillageBuilding` from `js/village-architecture.js` when planning larger settlements. The builder writes local coordinates relative to the back-left corner on the floor, with the main entrance facing +Z. Reserve one block of side and rear roof overhang and two blocks in front of the outer wall for porches and planters. Pass the contents callback for decoration that holds items and use the returned entrance, home and workstation anchors for navigation. Preserve each existing generation/layout version if the lot or layout changes.

The existing keep, towers and authored settlements are outside this phase’s architectural integration. Built-in seating still uses shaped blocks, and stables provide stalls without changing livestock spawn rules. Browser launch and loopback serving were blocked during this session. Live WebGL, IndexedDB, Hardcore and multiplayer were outside the verification completed here. Village area and building counts are the same as before Phase 1.
