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

## Milestone 4: strongholds, the Hollow [End], and the Hollow Wyrm [Ender Dragon] (published 2026-10-28)
| Feature | Status | Notes |
|---|---|---|
| Eye of the Void [eye of ender] | Done | Void Pearl + Flare Powder. Thrown on the Surface, it flies toward the nearest of 3 strongholds (260–460 blocks out), dives when you're within ~12 blocks, then drops (80%) or shatters |
| Strongholds | Done | Land v4. Underground stone/mossy brick portal room, 4 halls, 4 treasure rooms (loot includes Void Pearls). Older worlds only get them in places the player hasn't changed |
| Hollow Portal | Done | 12 frames (≈10% start with an eye); filling all of them opens a 3×3 portal; stepping in travels instantly |
| The Hollow dimension | Done | Separate save. Central island of Hollowstone, 10 obsidian pillars, starry purple sky, void below (damages, then faints you; Creative is lifted back up), arrival obsidian platform at x 100 |
| Hollow Wyrm boss | Done | Boss bar; circles the pillars, strafes and spits void breath (lingering damaging clouds), charges with a hover/roar/fast-flap wind-up and knock-up, lands on the center to rest (full damage there, 60% while flying), takes off again. Void Crystals heal it (beam shown) and explode when hit. Health and destroyed crystals are saved if you leave or faint |
| Victory | Done | Death animation, ≈400 XP, Wyrm Scales, exit fountain portal home, Wyrm Egg, Gateway to the outer islands (with a return Gateway). Defeat is saved; the Wyrm does not come back |
| Outer islands | Done | Floating islands past 380 blocks, Chorus plants (Chorus Fruit: blink-teleport food; smelts into Violet Bricks), Voidwalkers |
| Hollow towers [end cities] | Partial | Violet brick towers with floors, treasure chests (the top chest always has Glider Wings), 4 Shellers each. No ships yet |
| Sheller [shulker] | Done | Hides in its shell (takes 25% damage closed), opens to fire slow homing bullets that cause Floating (levitation) for 6 s; bullets can be swatted. Drops Sheller Shells |
| Shell Box [shulker box] | Done | 2 shells + chest. Keeps its 27 slots of contents when broken and placed again |
| Glider Wings [elytra] | Done | Worn as a chestplate; press Space while falling. Look down to dive and speed up, up to slow; no fall damage while gliding; crashing into walls hurts; loses durability while gliding. No rocket boosts yet |
| Resummoning the Wyrm | Missing | |

## Milestone 5: the Blightking [Wither], villagers, and villages (published 2026-10-28)
| Feature | Status | Notes |
|---|---|---|
| Blight Skulls as blocks | Done | Blight Skulls (from Blight Rattlers) can be set on top of a block |
| Blightking boss [Wither] | Done | Build a T of 4 Wailing Sand and place 3 Blight Skulls on top. 10-second charge (can't be hurt, health fills), then a big blast. Flies in circles around you and fires exploding skulls; slowly heals. Below half health it gets armor (arrows bounce off, swords still work), shoots faster, and dives at you. Causes the Blight. Works in any dimension. Boss bar shows its name and armor |
| Radiant Star [nether star] and Beacon | Done | The Blightking drops a Radiant Star and lots of XP. Beacon = Radiant Star + 5 glass + 3 obsidian. Glows; anyone within 24 blocks gets Regeneration and Swiftness (25% faster). No pyramid levels or power choices yet |
| Villages | Done | Land v5. Villages appear on low, fairly flat grassland, forest, or sandy land (a 40% chance in each 6×6-chunk area; sandy villages use sandstone): a plaza with a well, houses (bed, workstation, door), wheat/carrot/potato farms with water and a composter, gravel paths. Older worlds only get them in places the player hasn't changed |
| Villagers and jobs | Done | Farmer (Composter), Fletcher (Fletching Table), Shepherd (Loom), Cleric (Healing Altar), Smith (Smithing Anvil). They wander by day, work at their workstation, go to bed at night, open doors, and run from monsters or when hurt. A spawn egg makes a random-job villager. Saved with the world |
| Trading | Done | Click a villager to trade with Jade (new ore in mountains; also in loot). 4–5 trades per job, both buying and selling. Each trade sells out after a few uses; villagers restock by working at their workstation (up to twice a day) |
| Ironwarden [iron golem] | Done | One per village. Guards villagers, attacks monsters in 16 blocks, throws them in the air. Gets angry at you if you hurt a villager or it |
| Wanderer [wandering trader] | Done | Sometimes arrives during the day on the Surface (any difficulty). Sells rare items for Jade, leaves after 5 minutes |
| New blocks | Done | Jade Ore, Block of Jade, Composter, Fletching Table, Loom, Healing Altar, Smithing Anvil, Hay Bale (all craftable; new "Village" creative tab) |
| Villager breeding, villager levels, zombie villagers, raids | Missing | |
| Other structures (temples, outposts, shipwrecks…) | Missing | |

## Later milestones
| Feature | Status |
|---|---|
| Pets (wolf/cat/parrot), mounts, aquatic life, wildlife roster | Missing |
| Enchanting, brewing, potions, more status effects | Missing |
| Redstone-style mechanisms, minecarts, boats | Missing |
| More biomes, flowing water/lava, weather, falling blocks | Missing |
| Building palette (slabs, stairs, fences, colored blocks, signs…) | Missing |
| Multiplayer | Blocked: the site is static (GitHub Pages). A shared world needs a real-time server (for example a WebSocket game server with an authoritative world state), a hosting account, and a privacy review, because it would collect player connections. |
