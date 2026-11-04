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
| Hollow Portal | Done | 12 frames (≈10% start with an eye); filling all of them opens a 3×3 portal; stepping in travels instantly. Rings built by hand in Creative work too (3 frames per side, no corners), and each eye shows the "__ of 12" count |
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

## Milestone 6: pets and mounts (published 2026-10-28)
| Feature | Status | Notes |
|---|---|---|
| Scout [wolf] | Done | Grey packs in forest and birch land. Neutral: hit one and the pack bites back. Tame with Bones (about 1 in 3 per bone). Tame Scouts get a red collar, 20 health, and a raised wagging tail. They follow you, pop back beside you if you get more than 24 blocks away, attack monsters within 10 blocks of you (not Hissers or bosses), and attack whatever you hit or whatever hurts you. Heal them with any meat |
| Whisker [cat/ocelot] | Done | Ginger tabby. One at a time in grassland and forests, plus a stray in most village plazas. Skittish until you hold raw chicken or raw rabbit; feed it to tame it (about 1 in 3). Tame Whiskers follow you, and Hissers run away from them instead of exploding |
| Sit / follow | Done | Right-click a tame pet with an empty hand (or anything that isn't its food) to make it sit and stay, or follow again. Sitting pets are saved where they sit |
| Pet safety | Done | You can't hurt your own pets by accident. Pets stay in the world where you left them when you take a portal |
| Trotter [horse] | Done | Herds in grassland. Feed wheat or apples to calm it (and to heal or breed tame ones). Right-click with an empty hand to climb on: a wild Trotter won't go where you steer, and it either accepts you or bucks you off after a few seconds (calmer Trotters accept you sooner) |
| Saddle [saddle] | Done | 5 leather + 1 iron ingot at a workbench. Right-click a tame Trotter with it. Dropped again if a saddled Trotter is defeated |
| Riding | Done | You sit high up. W A S D steers (7.5 blocks/s), Shift gallops (11 blocks/s), Space jumps about 2.5 blocks high, C gets off. Falls hurt less. You get off automatically when you take a portal, faint, or leave the world |
| New spawn eggs | Done | Scout, Whisker, Trotter (Creative) |
| Pet breeding, more horse colors, donkeys/mules, horse armor, leads, name tags | Missing | Parrots came in Milestone 7 |

## Milestone 7: water life and wildlife (published 2026-11-04)
| Feature | Status | Notes |
|---|---|---|
| Swimming creatures | Done | `swims` species move in any direction underwater, stay below the surface, steer around walls, flop and slowly dry out on land (fish after 6 s, Splashers after 60 s). They appear in lakes and rivers 12–34 blocks from you (at most 16 at once) and swim off again when you leave, like monsters |
| Minnow [cod] | Done | Gray, swims in schools of 3–5. Drops Raw Minnow (cook it in a furnace) |
| Sunfin [tropical fish] | Done | 5 color patterns, schools in shallow water and sandy land. Drops Sunfin |
| Puffer [pufferfish] | Done | Puffs up when you get within about 3 blocks and stings (poison) if you touch it while puffed. Eating one poisons you and makes you queasy |
| Inkling [squid] | Done | Deep water (4+ blocks). Pushes itself along with its 8 tentacles. When hit, it squirts a cloud of ink and flees. Drops 1–3 Ink Sacs (Wool + Ink Sac = Black Wool) |
| Splasher [dolphin] | Done | Pods of 1–3 in wide, deep water. Leaps out of the water, swims alongside you when you swim or row, and gives "Swift swimmer" (swim about twice as fast). Feeding it a minnow gives 30 s of it. Neutral: hit one and the pod bumps you back |
| Boat [boat] | Done | 5 planks at a workbench. Right-click water (or the ground) to set it down, right-click it to climb in. W A S D rows (7 blocks/s), Shift rows faster (10), very slow on land. C climbs out onto nearby dry land if there is some. 3 hits break it back into a Boat item. Saved with the world |
| Fishing Rod [fishing rod] | Done | 3 sticks + 2 string at a workbench. Right-click to cast; the bobber floats, little splashes show a fish coming, then it dips under for about 1 s: right-click to reel in. Catches: mostly Minnows and Sunfins, some Puffers, a little junk (bone, string, leather, stick, ink sac), and rare treasure (saddle, bow, Void Pearl, jade, gold, another rod). Gives XP and uses 1 durability (64). The line snaps if you switch items or go more than 32 blocks away |
| Pouncer [fox] | Done | Forest and birch land, 1–2 at a time. Naps during the day (curled up), wakes and runs if you walk up without crouching. At night it hunts chickens and rabbits with a jump-pounce. Picks up food lying on the ground and carries it in its mouth (eats it when hurt, drops it when defeated). Breed two with Sweet Berries: the baby trusts you (doesn't run away, and fights monsters near you) |
| Sweet Berries and Berry Bushes [sweet berries] | Done | Land v6: bushes grow in forests. Right-click a ripe bush to pick 2–3 berries (it regrows). Plant berries on grass or dirt (even through tall grass). Bone meal speeds them up |
| Buzzer [bee] | Done | 3 live in each wild Bee Nest (land v6: on some trees, more often in grassland). They visit flowers, carry pollen home, and fill the nest with honey (5 levels, honey drips from the front when full). With pollen they help crops and berry bushes grow as they fly over. They sleep inside at night. Breed with flowers. Homeless Buzzers move into a nearby nest or Beehive |
| Honey | Done | Use a Glass Bottle (3 glass at a workbench = 3 bottles) on a full nest for a Honey Bottle (6 food, cures poison, you keep the bottle), or Shears for 3 Honeycomb (3 Honeycomb + 6 planks = Beehive). Taking honey or breaking a nest without a Torch within 3 blocks makes that nest's Buzzers angry. Each can sting only once (poison), then calms down |
| Chatterbird [parrot] | Done | 5 colors, flies and lands in forests. Tame with wheat seeds (about 1 in 3). A tame one follows you and hops onto your shoulder (shown small in the lower corner of your view); it hops off when you crouch, swim, fly, ride, or get hurt. Copies the sound of nearby monsters as a warning. Right-click to sit or follow |
| New spawn eggs | Done | Minnow, Sunfin, Puffer, Inkling, Splasher, Pouncer, Buzzer, Chatterbird (Creative) |
| Land version 6 | Done | `CURRENT_GEN = 6`. Older worlds get nests and bushes only in places the player hasn't changed |
| Fish buckets, axolotls, turtles, coral reefs, shipwrecks, ocean monuments | Missing | |
| Splashers leading you to treasure, foxes holding any item, bees in rain | Missing | |

## Milestone 8: two hands, survival rules, and progress (built and browser-tested 2026-11-04)
Reference for familiar mechanics: **Minecraft Java Edition 1.20.1**. Differences on purpose are noted in the table.

| Feature | Status | Notes |
|---|---|---|
| Save format v3 | Done | Older saves upgrade automatically (a `backup-v2-<id>` copy is kept). Adds the offhand slot, Void Chest storage, fullness (saturation), exhaustion, active effects, Hardcore flags, advancements, stats, Respawn Anchor spawn |
| Offhand slot | Done | Inventory slot 40 (✋, under the armor in the inventory; shown left of the hotbar). **X** swaps hands (change it in Settings → Swap hands key). In the inventory, point at a slot and press X to move that item to the offhand. Saved with the world |
| Hand rules | Done | Left-click (mine, attack) always uses the main hand. Right-click tries the main hand first; if it has nothing to do there, the offhand acts (Minecraft's rule). Only the main hand opens chests, doors, and workstations. Shown in first person on the left (third person comes with skins) |
| Shield | Done | 6 planks + 1 iron ingot. Hold right-click to raise it (either hand, e.g. sword + shield). Blocks hits from the front half (melee, arrows, fireballs), pushes the attacker back, wears down by the damage blocked (336 uses). You walk slowly behind it. Explosions from behind still hurt |
| Lifeward Totem [totem of undying] | Done | Works from either hand (main hand checked first). Stops one fatal hit: exactly one is used, you keep 1 heart, all effects clear, then Regeneration II 45 s, Absorption II (4 golden hearts) 5 s, Fire Resistance 40 s. Gold burst, pop-up picture, and chime. A half-second guard stops a second totem being used by damage arriving at the same moment. **Doesn't work** against the void (falling out of the Hollow), in Creative, or in Spectator. Found in treasure chests (8% Surface ruins and strongholds, 15% Ember Depths, 25% Hollow towers); a Wanderer sells one for 10 Jade (difference: Minecraft gets them from evokers) |
| Void Chest [ender chest] | Done | 8 obsidian + Eye of the Void. Every Void Chest opens the same 27-slot personal storage, in every dimension; separate from ordinary chests. Breaking one drops the Void Chest itself and never spills or deletes the storage (difference: Minecraft drops obsidian without Silk Touch). Saved with the player. Shell Boxes can go inside (like Minecraft), but a Shell Box can't go inside another Shell Box, so nothing nests forever. Multiplayer isn't available, so the storage is the one player's |
| Food: hunger, fullness, exhaustion | Done | Minecraft 1.20.1 numbers: each food has food points and saturation ("fullness", hidden, used up first). Exhaustion: sprinting 0.1/block, swimming 0.01/block, jumping 0.05 (0.2 sprint-jumping), attacking 0.1, getting hurt 0.1, mining 0.005; walking is free; every 4 points uses 1 fullness, then 1 food. Healing: full food bar with fullness → 1 heart-half every 0.5 s; 18+ food → every 4 s (each costs 6 exhaustion). Starving: Easy stops at 5 hearts, Normal at half a heart, Hard can make you faint. Peaceful refills food. No sprinting at 6 or less (3 drumsticks), while eating, or behind a shield. Eating takes 1.6 s of holding right-click (moving slowly; letting go stops). Tooltips show food, fullness, and side effects. The old "get hungry over time" timer is gone, so time in menus or a background tab costs nothing |
| Golden Apple, Golden Carrot | Done | 8 gold ingots + apple: Regeneration II 5 s + 2 golden hearts for 2 min. 8 gold nuggets + carrot: very filling. Golden Apples also in Surface treasure (12%). Golden Apples are needed later for curing zombie villagers |
| New effects | Done | Absorption, Fire Resistance, effect levels (Regeneration II), timers shown on screen |
| Hardcore worlds | Done | Third world type with a warning box before it's created. Difficulty locked to Hard; items drop when you faint. Fainting ends the adventure for good (saved): the button changes to "Spectate this world". Spectators fly through blocks, can't be hurt, can't break, place, or use anything, and monsters ignore them. The world list shows "💀 Hardcore (ended)". Closing the page on the faint screen still ends it. Survival and Creative are unchanged |
| Advancements | Done | 43 goals in 6 groups (Getting Started, Farming, Exploration, Taming, Machinery, Combat & Bosses) from real events (crafting, placing, eating, breeding, taming, trading, portals, dimensions, gliding, beacons, anchors, lodestones, shields, totems, boss victories) and checks (items you hold, armor you wear, distance walked). Some need an earlier one first (progress is kept until then). Gold pop-up + chime, XP rewards. **L** or the pause menu's 🏆 button opens the screen with progress counts. Saved per world. Creative worlds don't earn them |
| Beacons | Done | Still crafted from the Blightking's Radiant Star. Pyramid of mineral blocks (iron, gold, Jade, and the new Skyshard and Duskmetal blocks), 1–4 layers, checked every second (breaking a layer changes it right away). Needs open sky above. Range 20/30/40/50 blocks (whole column above, like Minecraft). Pick a power on its screen and pay 1 ingot/Jade/Skyshard: Swiftness or Haste (1 layer), Resistance or Jump Boost (2), Strength (3), and with 4 layers a second power (Regeneration or level II). Colored beam. Effects are topped up while you're in range and fade a few seconds after you leave. Beacons placed before this update keep their old gift (Regeneration + Swiftness within 24) until you choose a power |
| Respawn Anchor | Done | 6 obsidian + 3 Shinestone (difference: Minecraft uses crying obsidian and glowstone). Charge with Shinestone blocks (up to 4; it glows brighter). In the Ember Depths, right-click a charged anchor to set your respawn point there. Each wake-up there uses 1 charge. Fallbacks: missing → Surface spawn (anchor forgotten), out of charge → Surface (remembered, recharge it), blocked in → Surface. Sleeping in a bed replaces it. Outside the Ember Depths a charged anchor explodes, but only after a warning and a second right-click. You can't be hurt for 3 s after waking up |
| Lodestone + Compass | Done | Compass = 4 iron + 1 Shine Dust; points to the Surface's starting spot. Lodestone = 8 stone bricks + 1 Duskmetal ingot (difference: Minecraft uses chiseled stone + netherite). Right-click a Lodestone with a compass (either hand) to link it. A dial in the lower left shows the direction and distance, "Lodestone is in the Ember Depths" when you're elsewhere, and "The Lodestone is gone" if it was broken (checked when you're near it). The link is saved on the compass |
| Portal fix | Done | Loading a world while standing in a portal no longer sends you through it right away |
| Conduits, ocean structures | Missing | Need ocean content first (prismarine, a sea treasure for the core) |
| Specialized workstations (smoker, blast furnace, barrel, stonecutter, grindstone, smithing upgrades, loom patterns, cartography, composter use, lecterns) | Missing | The village job blocks exist but only as job sites |
| Zombie villagers and curing | Missing | Golden Apples are ready for it |
| Waterlogging, leaf decay, plant support | Missing | Needs the building palette (slabs, stairs, fences) and flowing water |
| More creature interactions (lightning, mooshrooms, environmental conversions) | Missing | Needs weather/lightning |

## Later milestones
| Feature | Status |
|---|---|
| More wildlife (turtles, axolotls, wolves in snow, goats…) | Missing |
| Enchanting, brewing, potions, more status effects | Missing |
| Redstone-style mechanisms, minecarts | Missing |
| More biomes, flowing water/lava, weather, falling blocks | Missing |
| Building palette (slabs, stairs, fences, colored blocks, signs…) | Missing |
| Multiplayer | Blocked: the site is static (GitHub Pages). A shared world needs a real-time server (for example a WebSocket game server with an authoritative world state), a hosting account, and a privacy review, because it would collect player connections. |
