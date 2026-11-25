# BlockHaven Ultra Hardcore

Use **Ultra Hardcore** on the title screen or choose it in **New World**. The Surface challenge starts at sunrise with six health points, an empty inventory, and 30 active seconds of protection from hostile attacks. Normal Hardcore remains a separate mode.

| Active time | Challenge | Profile reward |
| --- | --- | --- |
| 0–20 minutes | Survive and prepare. Find food, make tools, and build shelter. | UHC Survivor |
| 20–40 minutes | Predators hunt farther, mobs investigate sound, and settlement raids can start. | Wilderness Stalker |
| 40–60 minutes | The third sunset starts the Blood Moon. Survive until Day 4. | Hardcore Champion, Survival Nomad, Legend of the Last Dawn, and +1 maximum heart in normal Survival |

The clock uses the live Surface simulation and pauses in the pause menu, when the tab is hidden, or while visiting another dimension. Inventory and crafting use the live simulation. Beds in sheltered areas restore fatigue while the clock keeps running. A completed world remains playable under its three-heart rules.

## World and combat

- The generator skips starter buildings and the small cobblestone ruins. Existing landmark generators still run. Rare buried supply barrels can be marked by a single mossy stone. Craft an Explorer’s Map from paper and a compass.
- Groaners, Hissers, Skitters and Rattlers retain their usual models and attacks. The basic Hard spawn pool has a population ceiling of 16. Ultra Hardcore increases it to 32, then 36 on Day 3, then 40 during the Blood Moon. Habitat, light, and placement rules still determine actual populations. Authored bosses and campaign encounters keep their original spawning rules.
- Lions, tigers, grizzlies and crocodiles use their existing stalking, pack, charge and ambush behaviors with longer tracking within their territories. Day 2 adds sound investigation. Groaners may damage player-built wooden doors or fences after repeated warning strikes. Ordinary mob explosions in Ultra Hardcore respect cover and leave blocks intact.
- Hunger drains faster, raw meat can cause poisoning, heavy activity increases fatigue, and tools and armor wear 25% faster per use. There are five underwater bubbles. Lit campfires use fuel for warmth and cooking, and the smoke can draw creatures. Exposed players can suffer from severe weather. Underground falls of rock give a warning and time to move away.
- The title carousel shows Stonehaven under the Blood Moon, captured with the game renderer and composed using the supplied promotional layout as reference. The four skins use the supplied character designs as references and run on the existing player rig. Their accessories are cosmetic.

## Save behavior

The browser’s IndexedDB saves a challenge checkpoint, terminal run history, and its rewards together. Checkpoints have a revision to reject stale writes. Where Web Locks is available, a run can open in only one tab at a time. Challenge worlds resume through the world list in their original browser. Imported challenge files cannot restore progress or earn rewards.

A BlockHaven profile belongs to the browser data for this site. Separate browser profiles have separate awards. Clearing site data removes the local records. There is no account sync or trusted server to defend against deliberate local storage or console changes. The save payload remains compatible with older normal worlds and their JSON exports.

Normal Survival calculates maximum health when a world loads. A new world or normal respawn fills the new maximum. An existing world preserves its current health and saved progress. The bonus stays at two health points across repeat wins and does not apply to Ultra Hardcore, standard Hardcore, Creative, campaigns, or visiting multiplayer players.

## Verification

Run both commands from the BlockHaven directory.

```sh
node tools/ultra-hardcore-check.mjs
node tools/village-architecture-check.mjs
```

The challenge test advances a full 3,600 seconds across all five transitions. It checks the one-time profile upgrade, failed and stale checkpoint rejection, normal export compatibility, and hostile population caps. With seed `Stonehaven Architecture`, it checked 57 suppressed ruins, 302 village plots, ten rare caches, and the 192-block Stonehaven layout. The existing architecture suite covers legacy world import, structures, paths, and town furnishings.

Browser checks use headless Chrome with a disposable origin and disposable saves. Progression boundaries are accelerated. A full real-time, input-driven hour and alignment with physical low-end devices remain unverified.
