# BlockHaven · The Lost World

## Jungle preview

In **New World**, choose **The Lost World (Sandbox)** under **World terrain** and start in Survival or Creative. Try seed `primeval-preview`. Gather wood at the camp tree and pick ripe berries before following the gravel trail through the stone arch to Raptor Grove. The raptor opens its jaw and calls before a bite. Back out of range or break its line of sight during the wind-up. Creative players can build, fly, and observe the raptors safely. Raptors are passive on Peaceful difficulty.

## How it fits BlockHaven

- BlockHaven is a static browser game. `index.html` loads the Three.js game via ES modules, and the import map versions those modules for browser caching.
- The game already separates each dimension's chunk generator, terrain edits, containers, drops, and creatures. The Lost World uses a new save ID and a `lost_world` home dimension with its own generator revision. The preview reuses the player controller, inventory, crafting, entity model and physics, and existing save and export formats.
- Existing worlds still default to the Surface. The Lost World selector leaves the existing campaign entry point and Hardcore worlds separate. The preview introduces no block, item, or spawn egg IDs and uses no released map templates.
- Raptors use persistent entities with first-visit spawning through the existing chunk lifecycle. Their short-term targets and attack wind-ups reset when an entity reloads. AI uses the existing distance-based update cadence and bounded voxel pathfinder. Spawn sites are spaced by chunks to limit the number of active creatures.
- The local workspace is a game subtree without Git metadata. `PUBLICATION_STATUS.md` identifies the upstream as `MrWatford/MrWatford.github.io`. Verify the local changes against the intended GitHub revision before proposing a release.

## Campaign and world milestones

| Chapter | Region | Playable objective |
| --- | --- | --- |
| 1. Through the Canopy | Primeval Jungle | Set up camp, cross Raptor Grove, and recover the expedition's field log. |
| 2. Thunderplain | Fern Plains | Follow a Triceratops herd across the floodplain and map its migration route. |
| 3. Blackwater Signal | Mangrove Wetlands | Restore a river relay while avoiding Spinosaurus and mosquito swarms. |
| 4. The Canopy Road | Redwood Escarpment | Climb to a Brachiosaurus nesting overlook and use the ridge to find the lost station. |
| 5. Beneath the Amber | Amber Caverns | Recover a core sample and open a return route past ambush plants and cave predators. |
| 6. Territory of the King | Fern Plains and canyon | Track a T. rex to recover the expedition beacon. Give players a route to recover it by stealth or combat. |
| 7. The Mountain Wakes | Volcanic Badlands | Reactivate caldera anchors in stages while eruptions change the safe routes. |
| 8. Heart of the Caldera | Caldera arena | Defeat Godzilla in a five-phase caldera fight and return to camp. |

1. **Jungle preview.** Validate normal entry, the camp-to-grove loop, a single animated predator, respawn, and save compatibility.
2. **Ecosystem and Chapter 1.** Add an expressive Triceratops herd, gathering and food progression, a second biome, and the first expedition objective. Give the campaign a separate entry point and store its progress under `story.lostWorld`. Keep sandbox traversal and building independent of chapter progression.
3. **Chapters 2–7.** Add regions and species in chapter-sized increments. Continue building species from distinct silhouettes, locomotion, and behavior. Use separate near and far AI budgets, shared model resources, and terrain generation and rendering measurements before increasing population or canopy density.
4. **Chapter 8.** Build the arena, checkpoint, phase transitions, and recovery logic before turning on rewards. Verify full inventories, repeated interactions, death, reload, and leaving during each phase. Keep eruptions and collapsing terrain to arena cues and reversible effects.
5. **Release review.** Verify complete campaign progression, unbounded Survival and Creative, older exports, cache upgrades, and performance on a desktop and a representative lower-end device. Review a scoped GitHub change before any merge or deployment.

## Godzilla

Godzilla stands about 14 blocks tall above the caldera floor. His dorsal plates, tail, and jaw animate as he charges and releases blue atomic breath.

| Phase | Attack and response |
| --- | --- |
| 1. Breach | A roar warns of a close-range shockwave. Back out of the orange ring and close in when Godzilla recovers. |
| 2. Fault Lines | A staggered line of marked faults erupts across the floor. Move out of the rings and strike during recovery. |
| 3. Broken Circuit | Activate all three anchors while dodging atomic breath. Anchor state survives retry and reload. |
| 4. Ashfall | Godzilla alternates a cluster of violet eruptions with fault lines. Move between the markers and attack during recovery. |
| 5. Last Vent | Leave the blue atomic-breath lane and avoid the overlapping eruption markers. Strike during the final recovery window. |

Each phase needs a readable anticipation cue, an evasion route that works on low settings, and a recovery window. Build and test one phase at a time using one saved encounter record.

## Preview verification

Tested locally on an Apple Silicon Mac in headless Chrome 157.0.8103.79, using WebGL at 1280×800 with default game quality and a four-chunk render distance. A disposable browser profile used IndexedDB. The preview ran over HTTP and its browser checks blocked external requests.

- Created Lost World Survival and Creative saves from the normal menu with seed `primeval-preview`. Walked from the camp to Raptor Grove with the game's normal movement loop and inspected both rendered views.
- Exercised stalking, bite wind-up, a missed bite after backing away, and damage on a landed bite. Verified that the raptor remains passive in Creative.
- Saved a block edit and reloaded via the world menu. Confirmed the edit and the raptor's identity persisted, including after unloading and reloading its chunk.
- Verified that respawn stays in The Lost World and the Ember Depths return portal goes there. Round-tripped the game save as JSON and rejected an unsupported Lost World terrain revision.
- Created Surface Survival, Creative, and Hardcore worlds and started the Legacy Campaign from their existing menus. Imported and round-tripped the repository's Early Access 1 export fixture with its original fields intact.
- Checked JavaScript syntax and verified the camp, trail, and deterministic multi-chunk terrain across five seeds. The Chrome run produced no uncaught errors.

The preview check covers fresh browser loads and one older save fixture. Lower-end frame times, returning-browser cache upgrades, co-op, and full playthroughs of the Legacy Campaign are still unverified.

## Chapter 1 · Through the Canopy

Choose **The Lost World (Campaign)** in **New World**. Read the lit tablet beside the camp trail, recover the field log from the ruin beyond Raptor Grove, and report back at the camp tablet. Press **J** to review the current objective and read the recovered log. Chapter 1 ends at camp and leaves the world open for exploration.

The expedition is a separate Survival start. Its two tablets are generated only in expedition worlds. The existing Lost World sandbox keeps its original generation revision and has no story objectives. The chapter uses a versioned `story.lostWorld` record with two saved checkpoints. It gives no inventory item, so a full inventory or lost gear cannot block reporting back.

- In a fresh local Chrome profile with seed `primeval-preview`, started the expedition through the menu and read both tablets through the game's normal targeting and use path. Verified the journal update, sequence, death/respawn, reopening after a reload, repeated reads, Creative tablet protection, JSON round-trip, and invalid progress rejection.
- Checked both tablet locations for reachable ground and verified their absence in sandbox terrain on five seeds.
- Reran the sandbox Survival and Creative checks, raptor combat and chunk restoration, the Ember Depths return, all original world and campaign entry points, and the Early Access 1 save round-trip. Chrome reported no uncaught errors.
- Chapter 1 ends with the clue leading toward the plains.

## Chapter 2 · Thunderplain

Finish Chapter 1, then open **J → Lost World Expedition → Travel to the Fern Plains**. Follow the gravel trail to the west crossing and the upper meadow to record the herd's route. Each survey post has two torches. Reading the upper post first directs you back to the west crossing. Sandbox players can travel immediately from **J → The Lost World**.

The Fern Plains are a separately saved region with two persistent Triceratops groups. They graze, move through the meadow, and shy away when approached closely or disturbed. Travel via the journal makes the new terrain available to existing Lost World saves without replacing any jungle chunks. The new region has an independent terrain revision and stores its own blocks, shelters, portal links, and herd. Chapter 2 records observations in the journal and leads into the Mangrove Wetlands.

- Local Chrome 157 on Apple Silicon, 1280×800, default settings and disposable IndexedDB, seed `primeval-preview`. Verified Chapter 1 travel gating, both Chapter 2 objectives and repeated reads, a version-one Chapter 1-compatible exchange file, journal travel both directions, preservation of a jungle edit, save reload in the Plains, JSON round-trip, and Creative access without campaign objectives.
- Verified six Triceratops appeared with the horned rig, moved away from a nearby player in Survival, and kept their identities through unloading, reloading, and region travel.
- Exercised two independent Ember Depths links, one from each Jurassic region. Verified both return routes and the Fern Plains spawn fallback after a bed breaks.
- `tools/lost-world-terrain-check.mjs` verifies deterministic terrain, the unobstructed gravel trail, both survey posts, herd footing across five seeds, and survey order.
- Repeated the jungle sandbox and raptor checks, Surface Survival, Creative and Hardcore starts, Legacy Campaign start, and the Early Access 1 export round-trip. The browser runs reported no uncaught errors. Co-op and lower-end performance remain unverified.

## Chapter 3 · Blackwater Signal

After completing Thunderplain, open **J → Lost World Expedition → Travel to the Mangrove Wetlands**. On the boardwalk, turn left at the first dock to recover a spare fuse from the pump station. Continue over the river to restore the relay. The tower lights when restored, and the signal points toward the Redwood Escarpment. Sandbox worlds can enter the Wetlands from **J → The Lost World** at any time.

The Wetlands have a separately versioned terrain layout with a winding channel, rooted mangroves, and a raised boardwalk. The Spinosaurus patrols the deep channel and winds up before biting swimmers. Giant mosquitoes fly around the docks, buzz before they bite, and pull back to recover. The boardwalk gives players a route above the aquatic predator. Both objectives use saved journal checkpoints, so death or a full inventory cannot strand the relay fuse. The beacon update respects edits to its fixture.

- Local Chrome 157 on Apple Silicon, 1280×800, with disposable IndexedDB. On seed `primeval-preview`, loaded a Chapter 2-compatible save, crossed into the Wetlands, checked the offline relay, recovered the fuse, died and returned, activated the relay, and verified both the lit fixture and completion. Repeated interactions, JSON import/export, reloading in the Wetlands, preserved jungle edits, persistent creatures, and Creative travel passed.
- Exercised both attack wind-ups with the live game logic. The Spinosaurus ignored a player above the river and hit a swimmer who stayed in reach. Leaving the water or backing away during the mosquito warning avoided damage.
- The terrain check covers five seeds, a clear boardwalk, valid creature habitat, and both chapter sequences. Co-op and lower-end performance remain unverified.
- Reran Chapter 1 and 2 progression, the Triceratops herd, prior Jurassic sandbox checks, Surface Survival/Creative/Hardcore starts, the Legacy Campaign start, and the Early Access 1 save round-trip. Chrome reported no uncaught errors.

## Chapter 4 · The Canopy Road

After restoring the river relay, open **J → Lost World Expedition → Travel to the Redwood Escarpment**. Follow the torch-marked climb and jump up the short rises. At the wooden bridge, turn right and read the log at the nesting overlook. Continue across the bridge and up to the timber shelter to recover the abandoned station log. The next lead is the Amber Caverns. Sandbox players can use **J → The Lost World** to enter the Redwoods immediately.

The Redwoods are a separately versioned region. The route climbs 17 blocks above its arrival point and uses the existing movement and jumping controls. Three persistent Brachiosaurus browse below it, with articulated necks, tails, and walking animations. The overlook and station are expedition landmarks. The station checks that the overlook was surveyed, and both checkpoints survive retries without requiring inventory space.

- Chrome 157, Apple Silicon, 1280×800, disposable IndexedDB, seed `primeval-preview`. Opened a Chapter 3-format file, verified the relay completion gate, and climbed both sections using the game's movement loop. Inspected the rendered overlook with the three Brachiosaurus rigs visible. Verified the ordered objectives, checkpoint after death, repeated reads, import/export and reopen, herd identity, return travel, earlier jungle and Mangrove edits, and Creative access.
- The terrain check covers five seeds, traversal clearance and elevation, deterministic chunk generation, safe Brachiosaurus spawning, landmark placement, and journal rendering for all existing stages. Early Access 1 and Chapters 3–4 save round trips passed in the save API. Co-op and lower-end performance remain unverified.
- Reran Blackwater Signal, Jurassic sandbox Survival and Creative, raptor combat and recovery, the Ember Depths return, Surface Survival/Creative/Hardcore, the Legacy Campaign start, and the Early Access 1 import/export check in Chrome. No uncaught browser errors.

## Chapter 5 · Beneath the Amber

Finish The Canopy Road, then choose **J → Lost World Expedition → Travel to the Amber Caverns**. Follow the amber ceiling lights down the gravel tunnel. Recover a sample from the tablet in the deepest chamber, then use the nearby winch to open the stone-brick return tunnel. Jump up the short rises to the entrance. Sandbox players can visit immediately and use both passages.

The cavern is a separately versioned region built on the public Chapters 1–4 release. Amber Prowlers hunt in the chambers and Snaproots wait alongside the tunnels. Both have visible and audible attack warnings. The sample lives in the expedition journal and survives death or a full inventory. The winch records completion and opens only the authored seal cells. It does not grant repeat rewards or edit the rest of the cavern. The sample points toward the Fern Plains canyon for Chapter 6.

- Local Chrome 157 on Apple Silicon, 1280×800 with disposable IndexedDB, seed `primeval-preview`. Opened saves with Chapter 4 progress and completion, verified the destination unlock, walked the descent and shortcut ascent with normal movement, and exercised both creature attacks. Checked that the unopened seal withstands Creative breaking, the sample survives death, the shortcut remains open after JSON export/import and reload, the same four creatures return, and Creative sandbox can explore without campaign gates.
- `tools/lost-world-terrain-check.mjs` verifies both passages, the seal and tablet placements, spawn habitat across five seeds, and checkpoint order. Co-op and lower-end performance remain unverified.
- Inspected the rendered amber chamber and reran the Redwood and Mangrove chapter checks, Jurassic sandbox and raptor checks, the Ember Depths return, original world and campaign starts, and the Early Access 1 save round-trip in Chrome. The browser runs reported no uncaught errors.

## Chapter 6 · Territory of the King

After opening the return passage in the Amber Caverns, choose **J → Lost World Expedition → Travel to Tyrant Canyon**. Read the tracker’s notes by the first torch. Follow the main gravel trail to confront the Tyrannosaurus or take the right-hand route between the rock walls and crouch near the far opening. Recover the beacon from the pad at the end of either route. Creative and Survival sandbox players can visit Tyrant Canyon at any time.

Tyrant Canyon is a separately saved region. One persistent Tyrannosaurus patrols the exposed trail, detects movement and noise within its territory, searches the player’s last known position briefly, and roars before biting. The beacon records progress independently of whether the dinosaur lives or dies. Completing the chapter points toward the Volcanic Badlands.

- Chrome 157 on Apple Silicon, 1280×800, disposable IndexedDB, seed `primeval-preview`. Opened a Chapter 5-format save, checked its destination gate and an earlier terrain edit, and completed the protected side route using ordinary movement in Survival without hurting the Tyrannosaurus. Separately exercised detection, crouching, a dodged bite, a landed bite, and beacon recovery after defeating it. Checked repeated reads, JSON export/import, reopening with the dinosaur still gone, and sandbox travel.
- The terrain test covers both traversable routes, rock cover blocking line of sight, one valid Tyrannosaurus spawn, and ordered beacon recovery across five seeds. The save API round-tripped Chapter 5, Chapter 6 and an Early Access 1 export. Co-op and lower-end performance remain unverified.
- Inspected the rendered canyon and Tyrannosaurus. Reran Chapter 5, the Jurassic sandbox and raptor checks, the Ember Depths return, original world and campaign starts, and the Early Access 1 save round-trip in Chrome. No uncaught browser errors.

## Chapter 7 · The Mountain Wakes

After recovering the expedition beacon in Tyrant Canyon, choose **J → Lost World Expedition → Travel to the Volcanic Badlands**. Follow the blackstone causeway and restore the Lower, Ridge, and Caldera anchors in order. When an orange warning ring appears, wait for it to fade or take the opposite lane. Cross between lanes on the open platforms. Each anchor quiets the pair immediately below it. With all three online, the vents stay quiet and the journal opens travel to the Caldera.

The Volcanic Badlands use an independent terrain revision. Their basalt ridges, lava channels, and caldera are generated when entering the new region. The alternating eruptions reuse the game's warning rings and fire damage. These temporary hazards never alter the blocks beneath them. Reduced Motion keeps the warning outline steady, and warnings are released when the player leaves the region. Sandbox worlds can visit immediately and the vents continue to alternate without campaign anchors.

- Chrome 157 on Apple Silicon, 1280×800, disposable IndexedDB, seed `primeval-preview`. Opened a Chapter 6-format save and confirmed the beacon gates travel. Checked both sides alternating, the safe lane avoiding damage, a hit in the active lane, steady Reduced Motion warnings, and unchanged vent blocks. Exercised ordered and repeated anchor reads, checkpoint survival after death, JSON export/import, reopening with all vents quiet, and Creative access.
- The terrain test covers both lanes, their lava channels and crater, adjacent warning geometry, deterministic generation across five seeds, and anchor sequence. The save API round-tripped Chapter 6, Chapter 7, and an Early Access 1 export. Co-op and lower-end performance remain unverified.
- Inspected the rendered volcano, lava channels, and warning ring. Verified warning cleanup on region exit. Reran Chapter 6’s two routes, Jurassic Survival and Creative, the Ember Depths return, the original modes and Legacy Campaign entry, and the Early Access 1 export round-trip in Chrome. No uncaught browser errors.


## Chapter 8 · Heart of the Caldera

After restoring all three Badlands anchors, choose **J → Lost World Expedition → Travel to the Caldera**. Take gear from the supply chest, use the terminal on the left, and enter the arena to awaken Godzilla. Dodge the marked attacks and strike during his recovery. The blue lane shows where atomic breath will fire. During Broken Circuit, use all three arena anchors to open the shield.

Godzilla has a dedicated arena, an approximately 14-block model, and five health-gated phases. The fight record saves health at each phase change, grounded anchors, and victory. A death returns you to your normal respawn point, with phase and anchor progress available when you return. Attack warnings reset on return. Victory completes the expedition in the journal and leaves the world open for exploration. Sandbox players can enter the arena without campaign progress and can start the fight from the same terminal.

- Chrome 157 on Apple Silicon at 1280×800, with disposable IndexedDB and seed `primeval-preview`. Opened a Chapter 7-format save, verified the final-anchor gate, viewed the Godzilla model and atomic breath, and completed all five phases using ordinary melee for an initial hit and scripted damage through the game’s entity hit path to exercise phase transitions. Tested a breath hit and dodge, shield and three anchors, progress after death, victory and repeated terminal reads, export/import and reload, and Creative sandbox access.
- A removed supply slot stayed empty on return. The boss did not reappear after victory and reload. The terrain check covers five seeds, arena fixtures and clearance, all five phase transitions and recovery windows, anchor idempotency, and breath-lane collision.
- Earlier Chapter 6 save carryover, Badlands anchor progress, Jurassic sandbox Survival and Creative, raptor combat and persistence, the Ember Depths return, original world modes, Legacy Campaign entry, and an Early Access 1 export round-trip passed in Chrome. No uncaught browser errors. Full manual fight balance, co-op, and lower-end performance remain unverified.
- Release review on November 17, 2026 completed all five phases using the supply chest's bow, arrows, and iron armor on Normal difficulty. Movement, aiming, chest transfer, and equipment placement were scripted. Damage came from ordinary charged arrows, with no assigned boss health, phase changes, or player health during combat. The successful run grounded all three anchors, finished in 97 seconds with 20 player health and 54 arrows remaining, and reached expedition stage 17. An earlier test route targeted an occupied fixture cell and died during phase three. Correcting the test approach to the unobstructed side of the anchor resolved it without a gameplay change. This supports combat completion with supplied gear. Manual balance, co-op, and lower-end device acceptance remain open.
- A connected expedition on the Chapters 1–4 build completed its original objectives, saved at the Redwood station, and refreshed normally into release `lost-world-2` with the old main module confirmed in Chrome's HTTP cache. The same world then completed Chapters 5–7 and awakened Godzilla through the journal and normal tablet interactions, reloaded in the Caldera, and returned to its preserved Redwood edit. Player, inventory, dimension, story, campaign, and settings fields matched the saved pre-upgrade record. The test positioned the player at each landmark and loaded its area. It establishes objective continuity and upgrade compatibility, while ordinary traversal was checked in the chapter reviews above. No uncaught browser errors. The first comparison snapshot preceded the title screen's final save. Comparing the finalized pre-upgrade record corrected that test timing.

## Creature model and startup review

The approved concept is saved in `img/concepts/trex-godzilla-reference.png`, with its generation prompt beside it. The local model pass uses contoured voxel bodies, raised scale detail, stepped tails, articulated jaws, individual teeth and claws, and dedicated eye and dorsal-plate glow. Godzilla retains his 14.1-block encounter height and the Tyrannosaurus retains its 4.25-block collision height. Atomic breath starts at the animated mouth. This pass approximates the concept. Cinematic lighting and final visual matching remain open.

Scale blocks and teeth are baked into shared body-part geometry, with 87 animated parts for Godzilla and 39 for the Tyrannosaurus. Removing hidden faces reduces their models from 36,576 to 27,626 triangles and from 27,108 to 19,848 triangles respectively. Nearby voxel surfaces shade the creases during geometry creation. Repeated body and glow material disposal passed twelve cycles, with steady counts of 145 geometries and three textures in the controlled arena. The model palette conversion matches the game's linear-output renderer, and head interpolation uses elapsed time. Reduced Motion keeps idle tail movement and charge pulsing steady. Save IDs, terrain layouts, and encounter progress use their existing representations. These model changes shipped in `lost-world-3` through PR #19 after owner approval.

- On published `lost-world-2`, Chrome 157 created, saved, and reopened Surface Survival, Creative, and Hardcore, Lost World sandbox Survival and Creative, the Lost World expedition, and the Legacy Campaign. Both campaign journals loaded and the Legacy Campaign reopened through its Continue button. No uncaught browser errors or failed game responses were captured. This checks campaign startup and persistence. Full Legacy Campaign traversal remains outside this review.
- The local build passed Surface Survival and Creative, Lost World expedition, and Legacy Campaign startup and save/reopen. Tyrannosaurus stealth, awareness, bite hit/dodge, combat, persistence, and Creative checks passed. Godzilla's five phases, ordinary melee, atomic-breath hit/dodge, shield anchors, death recovery, victory, JSON/reload, and supplies checks passed. A full ordinary bow fight passed with scripted movement and aim. Terrain and objective checks passed across five seeds.
- Final geometry checks covered unique part names, parent ordering, texture tile boundaries, finite positions and UVs, normals, and valid indices. Browser inspection verified both rigs, the mouth-aligned beam, reduced-motion behavior, and bounded GPU resource counts. Preview views place both creatures in a disposable arena with staged poses. Normal play places the Tyrannosaurus in its canyon. Co-op, lower-end hardware, full manual balance, and the concept's final lighting remain unverified. Evidence is in `tools/review-results/lost-world-models-review.json`.

## Prepared creature release

Release `lost-world-3` is a tested preview candidate built on published commit `8682f00483cac401e350a0b8f5539fd6cc1a17aa`. Its entry and changed dependencies use matching module revisions. All 547 relative module references resolve in the frozen candidate. Godzilla's mouth and dorsal plates glow, with an outer atomic-breath halo on Medium and High effects. Low effects retains the attack lane, beam, and damage cues. The prepared release uses the game's current lighting. The approved concept remains the reference for later visual refinements.

- A returning Chrome profile first loaded the published `lost-world-2` build and cached its main and entity modules. Two saves were then reopened after a normal refresh into the candidate. The Tyrannosaurus retained its identity, and Godzilla retained 120 HP and one grounded anchor. Player, inventory, dimensions, story, campaign, and settings fields matched their finalized pre-upgrade records. A consumed supply slot and an edited Caldera block persisted.
- On the frozen candidate, the Tyrannosaurus's stealth, bite, combat, persistence, and Creative checks passed. Godzilla's five phases, ordinary melee, atomic-breath hit/dodge, anchors, death recovery, victory, JSON/reload, and supplies checks passed. The complete ordinary bow fight finished in 97 seconds with 20 player health and 54 arrows remaining, using scripted movement and aim. No boss or player health was assigned during that fight.
- Fresh Surface Survival and Creative, Lost World expedition, and Legacy Campaign starts saved and reopened with Chrome's CPU throttled to one quarter of its normal rate. Both campaign journals and the Legacy Continue button worked. This controlled slowdown covers startup under CPU pressure. Physical lower-end hardware performance and co-op remain unverified.
- Focused tests verify touching, separate, enclosed, and partially covered cubes, bounded shading values, atlas coordinates, hierarchy, and valid geometry. Browser checks verify mouth alignment, reduced motion, Low/High glow behavior, effect cleanup, and stable shared GPU resources across twelve model removals. Final browser runs captured no uncaught errors. Publication and merging require the owner's approval.


## Lost World Explorer’s Map

Release `lost-world-4` adds a map for all eight Lost World regions. Press M while exploring, use an Explorer’s Map, or choose **Open Lost World Map** from the expedition journal. It includes a chapter-route overview, terrain charts, numbered landmarks, the player’s facing arrow and coordinates, zoom, drag-to-pan, fit and center controls, and one saved waypoint per region. N hides or shows the waypoint. Landmark previews do not unlock travel or advance the campaign. Travel continues through the existing journal.

Coordinates come from authored landmark constants, including the survey posts, relay, ridge station, sample and winch, beacon, power anchors, supply cache, awakening terminal and shield anchors. Animal pins indicate habitats rather than live positions. The Amber chart shows the underground floor plan. Terrain charts sample generator columns without loading chunks or editing blocks. Player builds are not drawn. The expedition-only outpost is omitted in sandbox worlds.

Map preferences use an optional versioned `story.lostWorldMap` record, replaced immutably for pending saves. Existing save schema, terrain layouts, IDs, inventory and quest records are unchanged. The entry, UI, Starter map integration and new map dependency advance together.

Chrome 157 checks passed for all eight region previews and journal travel through all sandbox regions, Survival and Creative entry without a map item, waypoint routing and visibility, keyboard and canvas selection, zoom and pan, JSON import, save/reopen, campaign locks, edited terrain, and ten open/close cleanup cycles. A published `lost-world-3` main module was confirmed in the HTTP cache before a normal refresh into this preview. Saved player, inventory, dimensions and story matched before opening, and map interactions did not load chunks, change inventory, edit terrain or advance the expedition. Surface (including Hardcore save/reopen), Legacy Village and Hollow Sands maps passed their regression checks. A 390-pixel browser layout had no page overflow, and keyboard focus and list scroll survived refresh. These checks use a desktop browser, not a physical touch device or co-op session. Evidence is in `tools/review-results/lost-world-map-review.json`.

The owner approved publishing the map and larger creatures together. The release is prepared from the tested files.


## Larger creature scale preview

Release `lost-world-4` sets Godzilla to 24 blocks tall and the Tyrannosaurus to 10 blocks tall. The request’s “tree” was interpreted as T. rex. Existing tree generation is unchanged. Standing rendered heights measure 24.002 and 10 blocks respectively, with matching 24- and 10-block body heights and proportionally enlarged body widths. The T. rex’s neutral feet now meet the ground. Godzilla’s full-length tail curves inside the unchanged caldera floor, with a maximum sampled animated radius of 22.35 blocks. The Rex tail is raised to clear the canyon’s cover walls. No terrain templates, save schema, creature IDs, health, damage or attack timings change. Scaling reuses the existing geometry and textures.

Geometry, grounded feet, scale and animation bounds checks passed. The existing terrain/progression suite passed. Chrome 157 passed the ordinary Survival canyon cover route, awareness, bite hit/dodge, combat and persistence checks at the new Rex size. Godzilla’s five phases, melee, atomic breath, shield anchors, death checkpoint, victory, supplies and JSON/reload checks passed. A complete ordinary bow fight with scripted movement and aim finished in 96.7 seconds, at 20 player health and 54 arrows remaining. Mouth-to-beam alignment, Low/High effects, Reduced Motion and twelve cleanup cycles passed with stable GPU geometry and texture counts.

A normal refresh from cached published `lost-world-3` modules preserved saved fields and T. rex identity while applying the larger dimensions. Godzilla retained 120 HP and one grounded anchor, the consumed supply slot stayed empty, and an edited Caldera block persisted. Evidence is in `tools/review-results/lost-world-scale-review.json`. The owner approved publishing the map and larger creatures together. Physical lower-end hardware and co-op have not been verified.
