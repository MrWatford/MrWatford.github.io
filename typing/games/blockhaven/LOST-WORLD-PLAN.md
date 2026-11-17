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
| 8. Heart of the Caldera | Titan arena | Face the Riftback Titan, restore the anchor network, and reopen the expedition route. |

1. **Jungle preview.** Validate normal entry, the camp-to-grove loop, a single animated predator, respawn, and save compatibility.
2. **Ecosystem and Chapter 1.** Add an expressive Triceratops herd, gathering and food progression, a second biome, and the first expedition objective. Give the campaign a separate entry point and store its progress under `story.lostWorld`. Keep sandbox traversal and building independent of chapter progression.
3. **Chapters 2–7.** Add regions and species in chapter-sized increments. Continue building species from distinct silhouettes, locomotion, and behavior. Use separate near and far AI budgets, shared model resources, and terrain generation and rendering measurements before increasing population or canopy density.
4. **Chapter 8.** Build the arena, checkpoint, phase transitions, and recovery logic before turning on rewards. Verify full inventories, repeated interactions, death, reload, and leaving during each phase. Keep eruptions and collapsing terrain to arena cues and reversible effects.
5. **Release review.** Verify complete campaign progression, unbounded Survival and Creative, older exports, cache upgrades, and performance on a desktop and a representative lower-end device. Review a scoped GitHub change before any merge or deployment.

## Riftback Titan

A six-legged caldera creature with a basalt-plated back and luminous mineral vents. Its movements open fissures around the caldera anchors.

| Phase | Attack and response |
| --- | --- |
| 1. Breach | Raised forelegs signal a ring-shaped shockwave. Cross the ring during its wind-up or take cover behind a ridge. |
| 2. Fault Lines | Glowing cracks mark sequential eruptions. Recover at an intact anchor while the Titan exposes a flank vent. |
| 3. Broken Circuit | Use three anchors to ground the Titan's shell charge and expose its neck. Anchor state survives retry and reload. |
| 4. Ashfall | Ash limits long-range visibility. Audio and illuminated markers show clear lanes. Survive an eruption sequence to expose the underside. |
| 5. Last Vent | Chain an anchor discharge with a brief opening after a sweeping blast to strike the core. Resolve victory and the exit once per save. |

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
