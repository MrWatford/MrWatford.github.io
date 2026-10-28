# Blockhaven feature checklist

Status key: **Done** (works and was tested) · **Partial** (works with limits noted) · **Missing** (not started) · **Blocked** (needs something this site doesn't have)

Blockhaven is an original game. Its creatures use their own names, with blocky shapes and behavior modeled on the Minecraft creatures listed in brackets.

Tech: static site on GitHub Pages, no build step. Plain ES modules in `js/`, Three.js r160 vendored in `lib/`. Saves go to IndexedDB `blockhaven-worlds` (meta + data stores); settings go to localStorage `blockhaven-settings`.

## Milestone 1: foundation (published 2026-10-28)
| Feature | Status | Notes |
|---|---|---|
| Title, world list, new world (seed, mode), settings, controls, pause | Done | |
| Seeded chunk terrain, caves, ores, trees, rivers/lakes, ruins with loot | Done | 16×16 chunks, height 80 |
| Movement, collision, jump, sprint, crouch edge-guard, swim, creative flight | Done | |
| Mining with hardness/tool tiers, durability, drops, pickup | Done | |
| Placement rules (no placing inside player), doors, torches | Done | |
| Inventory 36 slots, stack moves, shift-click, creative palette | Done | |
| Recipe-list crafting, workbench recipes | Done | List-style, not a 3×3 grid |
| Furnace, chest, loot chests | Done | |
| Survival health/hunger/air/fall damage, faint + respawn | Done | Keeps inventory |
| Day/night, sky, stars, torch light (flood fill), soft shadows | Done | Lighting is per-block, no real shadows |
| Save/load, autosave, export/import, delete confirm | Done | |
| Water | Partial | Static: holes next to water fill once; no flowing |

## Milestone 2: creatures and survival depth (published 2026-10-28)
| Feature | Status | Notes |
|---|---|---|
| Shared entity system (`js/entities.js`) | Done | Unique ids, species data, health, AI state, loot, XP, path finding (bounded A*, 350 nodes), staggered thinking, spawn director |
| Groaner [zombie] | Done | Chases, paths around walls, melee with cooldown, burns in sun. Drops rotten flesh (rare carrot/iron) |
| Rattler [skeleton] | Done | Keeps 6–12 blocks away, strafes, shoots real arrows (gravity, wall/creature hits), needs line of sight, burns in sun. Drops bones, arrows |
| Hisser [creeper] | Done | Quiet approach, 1.5 s swelling/flashing fuse, cancels if you get 6+ away, explodes (terrain only if world option on). Drops Boom Powder |
| Skitter + Cave Skitter [spider] | Done | Low wide body, 8-leg crawl, climbs walls, pounces, calm in bright light unless hit. Cave variant is small and poisons. Drops string, eyes |
| Gloop [slime] | Done | Hops, sizes 1/2/4, big ones split, size-based damage, spawns in "gloop chunks" underground. Drops Gloop Balls |
| Voidwalker [enderman] | Done | Tall, neutral until stared at or hit, teleports to safe ground only, hurt by water, dodges arrows. Drops Void Pearls (throw to teleport) |
| Cow, Sheep, Pig, Chicken, Rabbit | Done | Wander, flee when hit, follow food, breed (5 min cooldown), babies grow in 5 min, sheep shear + regrow by eating grass, cows milk, chickens lay eggs (eggs can hatch chicks), rabbits hop and are skittish |
| Spawning | Done | Hostiles need dark spots (no torchlight, low sky light), 22–44 blocks away, not popping into view, caps by difficulty. Animals appear once per new chunk and are saved |
| Saving creatures | Done | Animals and named creatures persist per chunk; monsters despawn when far away |
| Combat, knockback, crits, damage pause, armor (leather/iron/skyshard), bow + arrows, XP orbs + levels | Done | Armor slots in inventory; XP is collected and shown, nothing spends it yet (enchanting comes later) |
| Status effects | Partial | Poison, queasy (hunger), on fire. More effects come with potions |
| Farming | Done | Hoe → farmland (wet near water), wheat + carrots with growth stages, bone meal, saplings grow into trees, crops grow only while you play (no catch-up after reload) |
| Food | Done | Bread, raw/cooked meats (furnace), carrots, rotten flesh (may make you queasy), skitter eye (poison), milk (cures effects) |
| Beds, buckets, lava, obsidian, Blast Blocks (TNT), Flint and Steel | Done | Water next to lava makes obsidian. Deep caves have lava in new worlds only |
| World options: difficulty, monsters break blocks, keep items | Done | Set at creation, changeable in pause menu |
| Save format v2 | Done | Per-dimension sections. Old saves upgrade automatically, keep their land shapes (gen 1), and get a backup copy |

## Milestone 3: the Ember Depths [Nether] and portals (published 2026-10-28)
| Feature | Status | Notes |
|---|---|---|
| Separate dimension with its own saved blocks, containers, creatures, portals | Done | `dims.nether` in the save. Only the current dimension is simulated |
| Terrain | Done | Enclosed caverns, bedrock floor and roof, lava sea (y ≤ 22), lavafalls, fire, Shinestone [glowstone] ceilings, ash/ember particles, red fog, rumble sound |
| Regions | Done | Wastes, Wailing Sand valleys [soul sand], Crimson and Warped fungus forests (giant fungi, Shroomlight), Basalt deltas (basalt, blackstone, magma) |
| Materials | Done | Emberrack, Ember Quartz, Ember Gold Ore (nuggets), Ancient Scrap → Duskmetal [netherite] upgrades, crimson/warped wood, Ember Bricks, Blackstone Bricks, Ember Wart (plantable), Flare Rods/Powder, Wailer Tears, Magma Cream, Blight Skulls |
| Structures | Done | Ember Brick fortresses (corridors, pillars, wart garden rooms, loot), Boarkin bastions (blackstone, gold blocks, loot), surface ruined portals (land v3+) |
| Portals | Done | Obsidian frames 2×3 to 21×21 inside (corners optional), Flint and Steel, 2.5 s entry (0.6 s Creative), purple overlay + sound, 8:1 coordinate mapping, links saved both ways, existing-portal search (16 / 128 blocks), safe-spot search, obsidian platform fallback, cooldown until you step out, fall-back to the old dimension if loading fails, breaking the frame turns it off |
| Rules | Done | Water boils away, beds explode, fainting returns you to the Surface, Wailing Sand slows, magma burns unless crouching, lava and fire burn |
| Flare [blaze] | Done | Hovers, 3-fireball volleys that set you on fire, fireproof, fortress spawns |
| Wailer [ghast] | Done | Large floater, exploding fireballs you can hit back to kill it |
| Boarkin [piglin] + Brute | Done | Hostile unless you wear gold; trade 1 gold ingot for random goods (obsidian, pearls, string, quartz…); defend each other. Brutes guard bastions and are always hostile |
| Rotboar [zombified piglin] | Done | Neutral; the whole group retaliates |
| Hogbeast [hoglin] | Done | Charges and tosses you upward |
| Blight Rattler [wither skeleton] | Done | Fortress melee, applies Blight (damage over time that can faint you), may drop a Blight Skull |
| Magma Gloop [magma cube] | Done | Hops high, splits, fireproof |
| Lavastrider [strider] | Partial | Walks on lava, fireproof, wanders. Riding comes with the mounts milestone |
| Old worlds | Done | Places the player already changed keep their original land. Untouched places get new features (`newGen` per dimension, land version `CURRENT_GEN = 3`) |
| Creatures traveling through portals, Hogbeast → rotten variant [zoglin] | Missing | |

## Later milestones
| Feature | Status |
|---|---|
| End-style dimension, dragon boss, wither boss | Missing |
| Pets (wolf/cat/parrot), mounts, aquatic life, wildlife roster | Missing |
| Villagers, trading, golems, villages and other structures | Missing |
| Enchanting, brewing, potions, more status effects | Missing |
| Redstone-style mechanisms, minecarts, boats | Missing |
| More biomes, flowing water/lava, weather, falling blocks | Missing |
| Building palette (slabs, stairs, fences, colored blocks, signs…) | Missing |
| Multiplayer | Blocked: the site is static (GitHub Pages). A shared world needs a real-time server (for example a WebSocket game server with an authoritative world state), a hosting account, and a privacy review, because it would collect player connections. |
