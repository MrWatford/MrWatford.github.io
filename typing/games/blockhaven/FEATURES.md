# Blockhaven feature checklist

Status key: **Done** (works and was tested) · **Partial** (works with limits noted) · **Missing** (not started) · **Blocked** (needs something this site doesn't have)

Blockhaven is an original game. Its creatures use their own names, with blocky shapes and behavior modeled on the Minecraft creatures listed in brackets.

Tech: static site on GitHub Pages, no build step. Plain ES modules in `js/`, Three.js r160 vendored in `lib/`. Saves go to IndexedDB `blockhaven-worlds` (meta + data stores); settings go to localStorage `blockhaven-settings`.

## Milestone 1: foundation (published 2026-10-28)
| Feature | Status | Notes |
|---|---|---|
| Title, world list, new world (seed, mode), settings, controls, pause | Done | |
| Switch Survival ↔ Creative in the middle of a game | Done | Pause → World options → Game mode (added 2026-11-05). Saved with the world. Switching to Survival stops flying and doesn't count the fall from where you were. Hardcore worlds stay in Survival |
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
| Creatures traveling through portals, Hogbeast → rotten variant [zoglin] | Done | Milestone 14 (see below) |

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
| Hollow towers [end cities] | Partial | Violet brick towers with floors, treasure chests (the top chest always has Glider Wings), 4 Shellers each. Ships added in Milestone 14 |
| Sheller [shulker] | Done | Hides in its shell (takes 25% damage closed), opens to fire slow homing bullets that cause Floating (levitation) for 6 s; bullets can be swatted. Drops Sheller Shells |
| Shell Box [shulker box] | Done | 2 shells + chest. Keeps its 27 slots of contents when broken and placed again |
| Glider Wings [elytra] | Done | Worn as a chestplate; press Space while falling. Look down to dive and speed up, up to slow; no fall damage while gliding; crashing into walls hurts; loses durability while gliding. No rocket boosts yet |
| Resummoning the Wyrm | Done | Milestone 14 (see below) |

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
| Pet breeding, more horse colors, donkeys/mules, horse armor, leads, name tags | Done | Milestone 14 (see below). Donkeys and mules already existed as Long Ear and Trail Mule from the creature expansion |

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

## Milestone 8: two hands, survival rules, and progress (published 2026-11-04)
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
| Advancements | Done | 58 goals in 7 groups (Getting Started, Farming, Exploration, Taming, Machinery, Combat & Bosses, Forsaken World) from real events (crafting, placing, eating, breeding, taming, trading, portals, dimensions, gliding, beacons, anchors, lodestones, shields, totems, boss victories) and checks (items you hold, armor you wear, distance walked). Some need an earlier one first (progress is kept until then). Gold pop-up + chime, XP rewards. **L** or the pause menu's 🏆 button opens the screen with progress counts. Saved per world. Creative worlds don't earn them |
| Beacons | Done | Still crafted from the Blightking's Radiant Star. Pyramid of mineral blocks (iron, gold, Jade, and the new Skyshard and Duskmetal blocks), 1–4 layers, checked every second (breaking a layer changes it right away). Needs open sky above. Range 20/30/40/50 blocks (whole column above, like Minecraft). Pick a power on its screen and pay 1 ingot/Jade/Skyshard: Swiftness or Haste (1 layer), Resistance or Jump Boost (2), Strength (3), and with 4 layers a second power (Regeneration or level II). Colored beam. Effects are topped up while you're in range and fade a few seconds after you leave. Beacons placed before this update keep their old gift (Regeneration + Swiftness within 24) until you choose a power |
| Respawn Anchor | Done | 6 obsidian + 3 Shinestone (difference: Minecraft uses crying obsidian and glowstone). Charge with Shinestone blocks (up to 4; it glows brighter). In the Ember Depths, right-click a charged anchor to set your respawn point there. Each wake-up there uses 1 charge. Fallbacks: missing → Surface spawn (anchor forgotten), out of charge → Surface (remembered, recharge it), blocked in → Surface. Sleeping in a bed replaces it. Outside the Ember Depths a charged anchor explodes, but only after a warning and a second right-click. You can't be hurt for 3 s after waking up |
| Lodestone + Compass | Done | Compass = 4 iron + 1 Shine Dust; points to the Surface's starting spot. Lodestone = 8 stone bricks + 1 Duskmetal ingot (difference: Minecraft uses chiseled stone + netherite). Right-click a Lodestone with a compass (either hand) to link it. A dial in the lower left shows the direction and distance, "Lodestone is in the Ember Depths" when you're elsewhere, and "The Lodestone is gone" if it was broken (checked when you're near it). The link is saved on the compass |
| Portal fix | Done | Loading a world while standing in a portal no longer sends you through it right away |
| Conduits, ocean structures | Missing | Need ocean content first (prismarine, a sea treasure for the core) |
| Specialized workstations (smoker, blast furnace, barrel, stonecutter, grindstone, smithing upgrades, loom patterns, cartography, composter use, lecterns) | Missing | The village job blocks exist but only as job sites |
| Zombie villagers and curing | Missing | Golden Apples are ready for it |
| Waterlogging, leaf decay, plant support | Missing | Needs the building palette (slabs, stairs, fences) and flowing water |
| More creature interactions (lightning, mooshrooms, environmental conversions) | Missing | Needs weather/lightning |

## Milestone 9: skins, third person, and Cindermaw the Ember Dragon (published 2026-11-04)
Cindermaw and the skins are our own additions on purpose; Minecraft has no Nether dragon.

| Feature | Status | Notes |
|---|---|---|
| Skin chooser | Done | 👕 Skins on the title screen and the pause menu. Grid of pictures with names, a turning 3D preview you can drag, the chosen one outlined in yellow, Wear / Cancel (Esc). Saved on the device (localStorage) for every world. 7 skins: Explorer, Builder, Knight, Astronaut, Robot, Adventurer, Mr. Watford. All skins have the same size, collision box, and abilities |
| Mr. Watford skin | Done (from his cartoon) | No photographs of Mr. Watford are in the project, so the skin is drawn from the cartoon Mr. Watford in his class videos (`images/mr-watford/face.png`): short auburn hair swept to one side, full ginger beard with a smile, blue eyes, rosy cheeks, fair skin, blue button-up shirt with collar and buttons, dark pants. The chooser says "Drawn from the cartoon Mr. Watford". A photo-based version can be made if he sends a photo |
| Player model and third person | Done | **V** (or F5) switches first person → behind → front. The camera pulls in when a wall is behind you. The model walks, crouches, swings, eats, draws a bow, raises a shield, sits when riding, and looks up and down. Worn armor shows over any skin (helmets leave the face open), and main-hand and offhand items show in the hands |
| First-person arm | Done | The bare arm is a piece of the skin's own arm, so sleeves and hands match |
| Cinder Eye | Done | The Hollow Wyrm gives one when defeated (straight into your pack). Also craftable: Wyrm Scale + Eye of the Void + Magma Cream + 2 Flare Powder, so worlds that beat the Wyrm before this update can still go on. Hollow tower chests now have Wyrm Scales too (30%). Thrown in the Ember Depths it flies toward the Cinder Citadel (like an Eye of the Void); on the Surface it says to try the Ember Depths |
| Hints before the fight | Done | The first visits to the Ember Depths show rumbling hints about a dragon in a citadel of cinders; after the Wyrm, a hint about the Cinder Eye. The advancements list shows the path (Follow the Embers → Citadel of Cinders → Wake the Dragon → The Final Flame) |
| Cinder Citadel | Done | One per world, 150–240 blocks from the Ember Depths' middle, placed where the player hasn't been or built (so it never cuts into old builds). A caldera 60 blocks across: Cinder Brick walls and ceiling with lights, a lava ring with 4 bridges, two floor rings to read from the air, 8 basalt pillars for cover (with lights), 4 brick towers for the Ember Pylons, 4 raised ledges reached by stair ramps, the dais and Cinder Altar in the middle. Entrance: a tunnel to the east with a lit gate, an approach cave, and a hall with a supply chest (Shinestone, Golden Apples, arrows, food, a Lifeward Totem, cobblestone) and a Respawn Anchor to charge, so fainting brings you back near the fight |
| Arena rules | Done | Cinder Bricks take a Duskmetal pickaxe and a long time; the altar can't be broken; you can still place blocks to build cover. Cindermaw never leaves the arena and its attacks never break blocks (fireballs only light short fires) |
| Waking Cindermaw | Done | Right-click the Cinder Altar while holding a Cinder Eye (either hand). It's used up |
| Cindermaw model | Done | Dark volcanic scales with glowing ember cracks (brighter as it weakens), horns, spiked back, jaw that opens, big two-part wings, a 4-part tail, legs. Animations for flying, fast flaps (wind-up), spread wings (gust), landing (wings folded), tail sweep, roar, and a shuddering, glowing death. Boss bar shows the phase and pylon count |
| Phase 1 | Done | Fireball volleys (glow + roar first), sweeping dives (hover + roar + fast flaps, then a fast pass through where you stood: step aside), fire breath (3 glowing rings on the floor first, then fire there), landings beside the altar (full damage; a tail sweep if you crowd it, with a rear-up warning) |
| Phase 2 (below 2/3) | Done | 4 Ember Pylons rise on the towers and shield it (only 1/5 damage, slow healing, orange beam). Hit a pylon twice to break it (broken pylons stay broken). Eruption zones (3 rings, 2 s warning), wing gusts (spread wings + ash for 1.3 s, then a push: a pillar between you blocks it), up to 3 helpers (Magma Gloops, Flares) |
| Phase 3 (below 1/3) | Done | Attacks come about a third faster, 5 eruption rings, 5 fireballs, and a new "inferno" combo (rings around and under you), after which it lands worn out (1.5× damage for 8 s) |
| Damage rules | Done | Half damage while flying, full when landed, 1.5× when worn out, 1/5 while shielded, explosions 30%. Damage numbers scale with difficulty |
| Leaving, fainting, retrying | Done | Walk far away and it returns to its citadel, keeping its wounds (saved). Faint during the fight and it goes back to sleep and fully heals; the altar keeps your Cinder Eye, so right-click it to try again for free |
| Victory | Done | First win: Cindermaw Egg trophy appears on the dais, an Ember Heart and 500 XP go straight into your pack, "The Final Flame" advancement. A 9-second victory scene circles the altar (Space, Esc, Enter, or the button skips it), then you keep playing in the same world. Saved right away, so reloading never repeats rewards; if the page closes during its death it still counts once |
| Rematches | Done | Put another Cinder Eye in the altar. Repeat wins give an Ember Heart and 130 XP (no egg), and "Rekindled" the second time |
| Cinder Crown | Done | Duskmetal Helmet + Ember Heart at a workbench: 4 armor, and fire and lava can't burn you while you wear it |
| Multiplayer scaling and synced skins | Blocked | Needs multiplayer (see below) |

## Milestone 10: Herobrine and the Forsaken World (built and browser-tested 2026-11-04)
An optional adventure added on purpose (Minecraft has no Herobrine). Cindermaw stays the final boss of the main Survival story; this is a separate side adventure with its own ending.

| Feature | Status | Notes |
|---|---|---|
| Way in | Done | Pale Shards drop from Blight Rattlers (15%) and Ember Depths fortress/bastion chests (40%), so they come after some Ember Depths exploring, but the adventure isn't needed for the Hollow or Cindermaw. Pale Lantern = 4 Pale Shards + Shinestone + 2 iron ingots. Right-click it on the Surface: a box explains the danger (and that Hardcore rules still apply in Hardcore worlds) before you go. The lantern is never used up |
| Packaged map | Done | `maps/forsaken-v1.bin` (61 KB gzipped): a fixed 160×160-block core map ("forsaken-core-v1", version 1) built once by `tools/forsaken-build.html` from `js/forsaken-author.js`. Players' changes are saved separately (`dims.forsaken`), so the template never changes and every new world (or "Start this adventure over…" in the journal) begins from the original. Outside the core: plain misty hills and bare trees made on the fly, then a bedrock edge hidden in the mist at 128 blocks |
| Map checks | Done | The build tool checks the map and writes `maps/forsaken-v1-report.txt`: 46 of 46 pass (safe arrival inside the ward, every shrine, sigil chest, note, arena ward, the altar, the Return Gate, and the Watchtower top reachable on foot, the mine's escape shaft reaches the surface, gate and mine entrance not buried, all watch points open, the packed file unpacks to identical blocks). The check found a real problem (the Watchtower's top floor blocked its stairs), which was fixed |
| Landmarks | Done | Arrival Refuge (walled courtyard, permanent Ward Stone, supply chest, 2 notes, Return Gate), Hollowmere Village (5 houses, damaged and barricaded, 3 notes, supplies, the Hearth Sigil, the village shrine), Watchtower (spiral stairs, view over the valley), Research Outpost (3 research logs, Ward Candles), Deepvein Mine (hall, a collapsed passage, a flooded tunnel with an air pocket, a lava gallery, the lower chamber with its shrine and the Stone Sigil, an escape shaft), the Pale Wood (dead trees, black stone spikes, thicker mist, more danger; the grove with the Root Sigil and its shrine), the Pale Citadel (black walls, tall corner towers and a spire; main gate plus two side doors; the arena). Gravel roads link them. "Discovered" pop-ups and a journal map |
| Atmosphere | Done | Grey, washed-out colors (a cheap color-fade in the block shader), a dim sky, close mist that thickens in the Pale Wood and when danger rises, wind, far-off birds, creaks, quiet stretches, and silence before a hunt. Settings → Forsaken World: background sound volume, sudden sound volume, mist/screen effects on or off, camera shake on or off, danger words on or off. No flashing; only a single soft fade at the very end. Nothing affects anything outside the game |
| Herobrine | Done | A real creature (original blocky model: brown hair, cyan shirt, dark blue pants, blank white eyes with a soft glow drawn without fog so they read through the mist, perfectly still while watching). A saved "director" (`story.fw.hero`) decides what he does: dormant → observing → investigating / stalking → warning → hunting → retreating, plus confrontation and banished. Awareness rises with sprinting, mining, fighting, the Pale Wood, and carrying story items; it fades when you're quiet and fastest inside a ward. Grace period on arrival (90 s) and after waking up (30 s), 70–150 s between hunts, hunts last at most 40 s. Saved: state, awareness, cooldowns, sightings, hunts, and a log of recent encounters |
| Teleporting | Done | Every appearance searches for a valid spot: solid ground, two blocks of room, no lava or water, never inside a ward (plus 2 blocks), never inside you, within set distances, hidden or in view as needed. Each appearance has a puff and a sound, and he waits about a second (eyes flare) before he can strike |
| Wards (safety) | Done | Inside a ward's ring he can't appear, his strikes and shockwaves can't reach you, and monsters can't form. The refuge's Ward Stone (10 blocks) and the three restored shrines (7–8 blocks) never fail and are saved; their blocks can't be broken, and changing the walls around them doesn't matter. Ward Candles (craftable, also in chests) make a 5-block ring for 2 minutes, with the time left on screen and a warning 15 s before they go out. Hunts end at a ward's edge. On screen: "🛡️ Safe inside…" |
| Danger eye | Done | Left side of the screen: Quiet, Watched, Something is coming, Hunted!, Protected, The Vale is free. It always shows the director's real state |
| Events | Done | Each with conditions and cooldowns: watching from a ridge or ruin, a silhouette crossing far away, footsteps behind you, the mist thickening, a village door swinging open (only opening, never when you're in the doorway), the skull in Hollowmere's square moving when you're away, a chalk clue appearing at the refuge after the first shrine, and Pale Sentinels joining later hunts (at most 3). Scripted: the first time you reach the top of the Watchtower, he watches you from in front of his citadel. Story blocks, shrines, and the arena can't be broken by any event |
| Story and journal | Done | Original story of Hollowmere Vale told in 13 notes (right-click an Old Note to read it). **J** opens the journal: the current objective, shrines, places found, a map, the safety rules, every note found, and "Start this adventure over…". Path: refuge → village (Hearth Sigil) → shrine 1 → outpost logs → mine (Stone Sigil) → shrine 2 → Pale Wood (Root Sigil) → shrine 3 → the Ward Heart → citadel |
| Story items | Done | Sigils and the Ward Heart can't be dropped, stored in chests or the Void Chest, or lost when you faint; if one goes missing anyway (like the Creative trash), it comes back to you in a few seconds |
| Fainting there | Done | You wake at the last restored shrine (or the refuge), with a few seconds of safety and a 30-second break from Herobrine. If your world drops items, they go into a satchel chest where you fainted instead of the ground (so they're saved). Hardcore worlds follow Hardcore rules |
| Final confrontation | Done | Set the Ward Heart in the Pale Altar. Phase 1 (no arena wards lit): he can't be hurt; teleport strikes and shockwaves (jump the ring or put a pillar between you). Phase 2 (some lit): illusions that flicker and have no eye glow, marked lightning (blue rings first), up to 2 Pale Sentinels, and he reaches for a lit ward with a beam: stand beside it to guard it, or it goes dark. Phase 3 (all four lit at once): he's solid and slow, and every hit counts. Light a ward by right-clicking it and staying within 3 blocks for 2 seconds. The boss bar explains why he can't be hurt yet. Leave the citadel and the fight waits (progress kept). Faint and it resets; the Ward Heart stays in the altar, so trying again is free |
| Victory | Done | He rises and fades into light. Once only: Pale Effigy trophy, Wardlight Lantern (hold it and monsters won't form near you), 32 Pale Bricks, 300 XP, the Wardkeeper skin (looks only), "The Vale Is Free" journal entry, "Banished" advancement. Saved right away, so reloading never repeats rewards. Afterward the mist thins, colors return, birds sing, and he never appears. Rematch: right-click the Pale Altar (with a warning); repeat wins give 100 XP |
| Creative | Done | Creative players can explore freely. Journal → "Creative test controls": Observe, Stalk, Hunt, Give sigils, Start finale, Light all wards |
| Advancements | Done | New "Forsaken World" group: A Pale Light, Into the Mist, Someone Is Watching, Pieces of the Past (8 notes), Vale Explorer (7 landmarks), Safe Ground, Wardkeeper, Face Him, Banished |
| Performance | Done | One Herobrine at a time, at most 2 illusions and 3 Sentinels, the director updates a few times a second, fog hides distant chunks, the map loads once and unloads with the dimension |
| Multiplayer | Blocked | See below |

## Milestone 11: the Lost Civilization (built and browser-tested 2026-11-04, not published)
Names: the realm is the **Echo Expanse** (our End is already "the Hollow"), and sculk is **hushmoss**. Maps are hand-planned in `js/lost-author.js`, built and checked by `tools/lost-build.html` (148 of 148 checks pass), and shipped as `maps/deep-v1.bin`, `expanse-v1.bin`, and `surface-v1.bin`. The game code is `js/lost.js`; progress is saved in the world's story (`story.lost`).

| Feature | Status | Notes |
|---|---|---|
| Keeper excavation (Surface) | Done | Chosen once per world in land nobody has visited (160–480 blocks from spawn), so no build or explored chunk is changed. Obelisk, crane, tents, a supply cache, a sign, and the Keeper Lift. |
| Survey Map | Done | Given once in Survival. Hold it: the dial points to the dig site, then (underground) to Echohold, the Citadel, the First Gate, or the Crownless Citadel. |
| The Deep | Done | Its own dimension (the Surface is only 80 blocks tall). Layered descent: lift landing, upper caverns, balcony view, lush cave, dripstone, crystal gallery (first resonance puzzle), ravine, then the city. Dark: only lamps and crystals light it. |
| Echohold (12 districts) | Done | Expedition Camp, Gate of Whispers, Silent Bazaar, Sanctuary of Silence, Residential Terraces, Great Archive, Resonance Foundry, Sunken Aqueduct, Watcher Bridges, Memory Gardens, Warden's Citadel, First Gate. "Discovered" toasts and a journal list. |
| Caches | Done | 38 curated caches in the Deep and 12 in the Expanse (supply, discovery, vault tiers), with stable ids so each counts once. Opened caches are tracked in the journal. |
| Story | Done | 17 tablets, 4 murals, and 3 memories (all original writing), plus the dig sign and an epilogue. Right-click to read; replay from the journal. |
| Sound and stealth | Done | Running, mining, building, and fighting make sound; walking is soft; crouching, Hush Carpet, wool, and moss are silent; the Warden-Plate halves footstep sound. Listeners go to sounds and give up when far from home. Hush Nodes shriek at noise near them and raise the alert meter; at full alert a Deep Stalker comes. Echo Shards (right-click) make a sound somewhere else. The Sanctuary blocks all sound. HUD: an alert meter plus a written "you hear: footsteps to your left" line (a visual for every sound). |
| Reduced Suspense | Done | Setting: half the alarm, no Stalker at full alert, slower pulse bridges. |
| Puzzles | Done | Tone (crystal gallery, Gate of Whispers), order (Archive: SUN, WAVE, ECHO, LEAF; wrong order resets with a hint), timing (Foundry: 3 resonators within 6 seconds), switch (sluice drains the flooded treasury), all-on (Gardens), swap (Expanse ruins bridges), and the forge switches. |
| Creatures | Done | Hush Crawler, Echo Sentinel (glowing wind-up, then a pulse ring), Deep Stalker, Resonance Mote, Dormant Guardian (wakes when disturbed), Echo Knight (shield blocks hits from the front), Shard Scout, Crystal Burrower (glowing cracks before it comes up). Hand-placed groups; quieted groups stay quieted. |
| First Warden | Done | Rises when you enter the Citadel. Phase 1: hunts by sound (crouch to slip away), shockwave ring after a glowing wind-up. Phase 2: shielded by 3 pylons (ring each resonator). Phase 3: faster, more shockwaves, calls 2 crawlers. Fainting or leaving resets it. Rewards: Warden's Resonance Core, Warden-Plate, trophy, 120 XP. |
| First Gate | Done | 4 sockets (sea, green, sun, echo). Exploration mode: the Archive, Garden, and Foundry stabilizers plus the Core. Calibrate by touching the sockets in the order from the Stabilization Procedure tablet, then activate (5-second charge). Crouch-click takes an item back before activation. Saved in the story and re-applied on load. |
| Echo Expanse | Done | Arrival Sanctum with a return gate (both ways tested), Echo Fields with pulse bridges (always a slower solid way around), Inverted Ruins (swap puzzle, hanging vault), Resonance Forge (3 anchors: combat, puzzle, climb), Crownless Citadel, mirror lake, observatory. Falling off returns you to the last beacon. |
| Resonant Sovereign | Done | Needs all 3 anchors quieted. Phase 1: marked rings fall around you, motes. Phase 2: crown shield; tune all 3 arena stations within 8 seconds to break it for 10 seconds. Phase 3: no shield, faster rings. Rewards: Echo Mantle (gentle falling), crown trophy, 200 XP, epilogue; afterward the city is calm (half alarm, no listener groups in the streets). |
| Checkpoints | Done | Keeper Beacons: right-click to set where you wake in the Deep or the Expanse. |
| Journal | Done | J now has two tabs: Forsaken World and Lost Civilization (objective, story steps, districts, sockets, caches, secrets, mode). |
| Advancements | Done | New "Lost Civilization" group (12). |
| Test controls | Done | Only on a development copy (localhost or `?dev`) and only in Creative. |
| Campaign mode | Done | Switch in the journal (before the gate is set). Only the Tidal Heart, Verdant Lens, Solar Seal, and the Warden's Core fit the gate; the city's stabilizers are refused. The Survey Map then points to the nearest temple whose relic you haven't taken. |
| Temple entrances (Surface) | Done | Each chosen once per world in land that fits and nobody has visited: a lighthouse on open water (sea), an overgrown step temple in a forest (jungle), a pyramid tip in the desert. The edges slope gently into the natural ground so you can always walk in. Each has a sign, a supply cache, and a Keeper Lift. Built by `js/lost-temples.js` (maps `sea-v1.bin`, `jungle-v1.bin`, `desert-v1.bin`; the entrances are in `surface-v1.bin`). |
| The Drowned Citadel (sea) | Done | A sea cavern with a dock and a citadel courtyard; a spiral stair down into sealed glass halls under the water. Gallery of Bells (order puzzle: PEARL, WAVE, STAR, SHELL), tide-jet corridor (darts), Lantern Hall checkpoint, sluice lever that drains the Flooded Treasury (or swim it), geyser corridor (vents take turns), cracked-floor bridge over a pool (steps on both sides), a hidden grotto. 12 caches. |
| The Verdant Labyrinth (jungle) | Done | A hidden green valley with light-trees, a ravine (crumbling bridge, or steps down and up), a 9 × 9 hedge maze with caches in its dead ends, the Grove of Bells (ring three bells within 8 seconds to open the Root Gate), a spore-vent walk, and a cave behind a waterfall. 13 caches. |
| The Sunken Pyramid of Aurelis (desert) | Done | A stairway Gallery of Statues (dart vents) with a hidden Scribe's Nook, the Grand Hall (glyph order puzzle: SUN, EYE, RIVER, STAR) and the Hall of Records behind it, a flame corridor (vents take turns), the Sand Pit Hall (crumbling bridge, steps, and a bridge-swap puzzle to the pit island), and the Mirror Court (turn three mirrors to open the Sun Door). 12 caches. |
| Traps | Done | Darts, vents, and cracked floors. Every trap shows glowing marks or crumbling dust before it hurts (longer warnings with Reduced Suspense), always leaves a gap or a safe moment, and cracked floors grow back. A first-time warning names each trap. |
| Temple guardians | Done | The Abyssal Regent (tide-wave rings with gaps, a charge), the Verdant Colossus (roots under you, a vine pull then a slam), and the Solar Colossus (a sun-beam line, a solar flare). Phase 2: three devices around the arena (tide valves, bloom levers, great mirrors) shield it until you use all three. Phase 3: faster, and it calls two helpers. Fainting or leaving resets the fight. Guardians wake in Survival and Creative (since 2026-11-05) when you walk into the middle of the arena. |
| Relics and rewards | Done | Beating a guardian opens its vault: take the relic from the pedestal. Rewards: Tidecaller Charm (keeps your breath up underwater while held), Leafstep Boots (no fall damage), Sunward Helm (fire can't hurt you), 120 XP each. New creatures: Tide Crab, Vinewalker, Sun Scarab. |
| Advancements | Done | Three more: Temple Explorer, Guardians at Rest, Keeper of Relics. |

## Milestone 12: the Sparkworks Update (redstone). Part A: signals (built and browser-tested 2026-11-05, not published)
Design: `MILESTONE-12-REDSTONE.md`. Rules follow Minecraft Java Edition 1.20.1. "Sparkdust" is Blockhaven's name for redstone. Code: `js/redstone.js` (signal engine), `js/shapes.js` (small shapes, wire connections, collision boxes).

| Feature | Status | Notes |
|---|---|---|
| Bigger texture sheet | Done | 16 × 32 tiles (was 16 × 16, which was nearly full). 40 new textures |
| Spark Ore, Darkslate Spark Ore | Done | Height 1 to 16, about 26 per chunk, only in land first visited after this update (land version 7). Darkslate version in the Deep. Iron pickaxe; drops 4 to 5 Sparkdust; smelts to 1. Glows when clicked, mined, or stepped on |
| Sparkdust wire | Done | Strength 15 drops 1 per block; connects to parts, climbs up and down one block (not through a solid block above); a lone wire is a cross that powers all sides, right-click makes it a dot. Brighter when stronger. Pops off without a block under it |
| Strong and weak power | Done | Torches under a block, switches on a block, plates on a block, and repeaters/comparators facing a block power it strongly (it then powers wire next to it). Wire on or pointing into a block powers it weakly (parts, not wire) |
| Block of Sparkdust, Spark Torch | Done | Torch turns off 1 redstone tick after its block is powered; burns out after 8+ flips in 3 seconds, relights after 8 seconds. Floor and wall torches |
| Lever, buttons, pressure plates | Done | Floor, wall, and ceiling. Stone button 1 s, wooden buttons 1.5 s (arrows press them). Wood plates: anything; stone: players and creatures; gold: count up to 15; iron: count ÷ 10. Plates stay down 1 s (weighted 0.5 s) after you step off |
| Repeater | Done | Delay 1 to 4 (right-click), one way, refreshes to 15, stretches short pulses, locked by a powered repeater or comparator at its side |
| Comparator | Done | Compare and subtract (right-click). Reads chests, Shell Boxes, furnaces (Java's fullness formula), Respawn Anchors, Hollow Portal Frames, bee nests and hives, also through one solid block |
| Spark Lamp, Note Block, Target, Daylight Sensor | Done | Lamp: on at once, off 2 ticks later. Note block: 25 pitches, 16 instruments from the block below (snow, quartz, and crimson/warped caps stand in for packed ice, bone, and pumpkins), colored notes. Target: 15 for a bullseye down to 1 at the edge. Daylight sensor: follows the sun, right-click for night mode |
| Powered doors, trapdoors, fence gates, Blast Blocks | Done | Iron Door and Iron Trapdoor (signal only); 4 wooden trapdoors, fences, and fence gates (4 woods). Doors open from power on either half. Blast Blocks light when powered |
| Movement | Done | You step up onto low blocks (repeaters, sensors, beds) like Minecraft's 0.6-block step. Fences and closed gates are 1.5 tall |
| Safety limit | Done | 6,000 real updates per game tick (plus a high cap on quick checks); a machine that goes over pauses a moment with a message. Tested: 20 clocks at once use 0.4 ms per tick; frames stayed under 16 ms. Signal-only redraws are spread over frames |
| Saving | Done | Save version 4 (version 3 backup kept). Timers and comparator outputs are saved per dimension and resume after loading |
| Creative tab, recipes, trade | Done | "Mechanisms" tab. Recipes from the design. Clerics sell 2 Sparkdust for 1 Jade |
| Part E (finish: advancements, guide, sounds) | Done | Published 2026-11-12. See the Part E section below |

## Milestone 12, Part B: movers and sensors (built and browser-tested 2026-11-05, not published)

| Feature | Status | Notes |
|---|---|---|
| Piston, Sticky Piston | Done | Face 6 ways (the pushing face points back at you). Push up to 12 blocks over 2 game ticks with a sliding animation; the head and moved blocks shove players and creatures. Stopped by obsidian, bedrock, portals, chests and other storage, beacons, extended pistons, and every unbreakable story/temple block. Flowers, torches, wire, levers, buttons, plates, repeaters, comparators, doors, beds, sensors, and bells in the way pop off. Sticky pistons pull; a pulse shorter than the push makes them drop the block ("spitting"). Java's "powered from the block above" quirk |
| Gloop Block, Honey Block | Done | Stick to the blocks around them when pushed (Gloop and Honey don't stick to each other, which makes two-part machines possible). Gloop: bounces you about 2/3 of your fall height, no fall damage (crouch to stop the bounce), launches you when a piston pushes it up. Honey: slows walking and jumping, carries you when it moves, cuts fall damage by 80%, you slide slowly down its sides. See-through with a smaller cube inside |
| Observer | Done | Watches the block its face points at; any change gives a 1-redstone-tick pulse out the back after 1 redstone tick (Java's single-timer behavior, so two observers facing each other make a steady clock). Fires when a piston moves it. Wire connects only to its back |
| Flying machines | Done | Tested with a 10-block machine (2 pistons, 2 observers, 6 Gloop Blocks): it carries itself through the air and keeps all its blocks. Three at once stayed under 16 ms per frame |
| Tripwire Hook, Tripwire | Done | Hooks on facing walls up to 40 blocks apart with string (right-click String on the ground) between them. Walking through powers both hooks (and the blocks they hang on); they stay on 0.5 s after you leave. Cutting the string by hand trips them for 0.5 s; Shears cut it silently |
| Trapped Chest | Done | A chest that gives power 1 (and strong power to the block under it) while open. Comparators read it like a chest |
| Hush Sensor, Tuned Hush Sensor | Done | Hear vibrations within 8 blocks (Tuned: 16): footsteps (not when crouching or on wool/Hush Carpet), creatures walking, breaking, placing, doors, switches, plates, chests, eating, bows, arrows landing, explosions, getting hurt, pistons, bells. Signal arrives 1 tick per block away, strength by distance, on 1.5 s (Tuned 0.5 s) then rests 0.5 s. Wool between blocks the sound. Comparators read the last frequency (1-15). A Tuned Sensor powered from behind only hears that frequency. Hush Sensors grow on Hushmoss in the Deep (about 46); Tuned = Hush Sensor + 3 Lumen Shards |
| Bell | Done | Rings when right-clicked or when it gets power; villagers within 48 blocks hurry home for a while. A bell stands in every new village plaza (land version 8); Smiths sell one for 16 Jade |
| Saving | Done | Saving during a push finishes the move first, so nothing gets stuck mid-slide |

## Milestone 12, Part C: item machines (built and browser-tested 2026-11-05, not published)

| Feature | Status | Notes |
|---|---|---|
| Hopper | Done | 5 slots. Points down or into the block you clicked. Every 8 game ticks: pushes 1 item into the container it points at, then pulls 1 from the container above (or picks up items lying on top, unless a solid block is on it). Furnaces: from above it fills the cook slot, from the side the fuel slot, and a hopper under a furnace takes the results. A hopper that just got its first item from another hopper waits 8 ticks (Java's rule that makes item sorters work). A signal locks it. Can't be pushed by pistons |
| Dropper | Done | 9 slots, faces 6 ways (the front faces you). A new signal (4 game ticks later) drops 1 random item out of its face, or puts it into a container in front (a full container: just a click). Java's "powered from above" quirk |
| Dispenser | Done | Like a dropper, but uses items: shoots arrows, throws eggs, places and scoops water and lava (buckets swap full/empty), lights fires and Blast Blocks with Flint and Steel (it wears out), sets Blast Blocks off, uses bone meal on crops and saplings, hatches spawn eggs, shears sheep, saddles tame Trotters, launches boats on water, fills Glass Bottles from full beehives, places Shell Boxes (with what's inside) and Blight Skulls, and puts armor on a player standing in front. Anything else is dropped |
| Crafter | Done | A 3×3 grid (any recipe whose ingredients fit in 9 slots; Blockhaven recipes don't care about the pattern). Click an empty slot to lock it. Each new signal crafts one result out of its face (or into a container in front); no recipe = a click. Hoppers fill its unlocked slots evenly. The panel shows what it will make |
| Comparator readings | Done | Hoppers, droppers, and dispensers use Java's fullness formula; a Crafter gives the number of slots that are full or locked |
| Item sorter | Done | The classic design works: a filter hopper holding 41 of an item + 4 different single fillers (reads 2), pointing at its comparator; the hopper under it is locked until a 42nd item arrives. Tested with mixed streams: every item ends up sorted or in overflow, nothing is lost. A long unbroken stream of only the sorted item flips the torch often enough to burn it out (8 switch-offs in 3 seconds), as in Java |
| Item counts | Done | Every transfer moves exactly one item and is checked before anything is taken, so items are never copied or lost (tested across sorter, smelter, dropper, dispenser, and Crafter runs). Dropped items now merge with a matching stack lying in the same spot, and up to 150 dropped stacks can lie around (was 90) |
| Fixes found while testing | Done | Wire stepping down off glass now keeps its power when recalculated. Torch burnout counts only switch-offs (Java's rule). The game clock can't run backwards |

## Milestone 12, Part D: rails and minecarts (built, browser-tested, and published 2026-11-05)
Code: `js/rails.js` (rail shapes and cart movement), carts in `js/entities.js`, rail power in `js/redstone.js`.

| Feature | Status | Notes |
|---|---|---|
| Rail | Done | 16 from 6 iron + a stick. Joins its neighbors automatically: straight, curves, and slopes up one block. A finished track keeps its shape; at a T-junction a signal flips which way it bends (unpowered toward +z/+x, powered the other way). Needs a solid block (or a hopper or glass) under it; pistons push rails |
| Powered Rail | Done | 6 from gold + stick + Sparkdust. Powered: speeds carts up to 8 blocks/s, and kicks a stopped cart away from a wall. Unpowered: a brake. Power travels up to 8 rails along a straight line |
| Detector Rail | Done | Gives a signal (and powers the block under it) while a cart is on it, for half a second after it leaves. A comparator reads a chest or hopper cart's contents through it |
| Activator Rail | Done | When powered: throws riders (players and creatures) out, lights Blast Block carts, and switches hopper carts off (on again when unpowered) |
| Minecart | Done | 5 iron. Place it on a rail; right-click to ride (W gives it a push, C climbs out). Follows the track and keeps its speed through curves, rolls downhill, stops at blocks, and rolls off the end of a track into open air. Ridden carts glide much farther than empty ones (Java's drag). Walking into a cart shoves it; carts bump and pass their speed along. A creature that bumps into an empty cart climbs in and rides along until an activator rail or a broken cart lets it out |
| Minecart with Chest / with Hopper | Done | 27 / 5 slots (right-click to open). A hopper under the track empties them; a hopper pointing into the cart's spot fills them. The hopper cart picks up items it rolls over and pulls from containers above the track |
| Minecart with Furnace | Done | Right-click with coal: 3 minutes of chugging away from you (smoke while it burns), pushing carts in front of it |
| Minecart with Blast Block | Done | Lit by an activator rail or Flint and Steel; explodes 4 seconds later (bigger when moving fast). An explosion sets it off right away |
| Boat with Chest | Done | Boat + chest. Right-click to ride (one seat), crouch + right-click to open its 27 slots |
| Saving and breaking | Done | Carts and chest boats keep their position, contents, fuel, and riders when saved. Breaking one drops the cart item plus everything inside |
| Dispensers | Done | Put minecarts onto the rail in front of them |
| Speed | Done | 12 carts on a loop: median 0.6 ms per frame, worst 16.3 ms |

## Milestone 12, Part E: finishing the Sparkworks (built, browser-tested, and published 2026-11-12)
Code: `js/sparkworks-guide.js` (new), plus small changes in `js/advancements.js`, `js/redstone.js`, `js/audio.js`, `js/entities.js`, `js/ui.js`, and `index.html` (styles + version tags `?v=sparkworks-e-1`).

| Feature | Status | Notes |
|---|---|---|
| 11 Machinery advancements | Done | Sparks Fly, Wired Up, Under Pressure, Push It, Lock and Key, On Track, Sort It Out, Crafty Machine, Tune In, Hear Me Now, Flying Machine. All 11 unlocked in a test world. "Sort It Out" counts items pulled through by a signal-controlled hopper (64), and only starts counting after that hopper has been unlocked once since the world was opened. "Flying Machine" counts 20 piston moves that carry a Gloop Block (not 20 blocks of distance) |
| Bug fix: note blocks counted as Hollowmere notes | Done | Note blocks used the same advancement event as the Forsaken World's notes, so playing instruments counted toward "Pieces of the Past". The event now has its own name, and old saves have instrument names removed from that progress when loaded (tested: 3 real notes kept, 5 instruments removed). If "Pieces of the Past" was already unlocked this way, it stays unlocked |
| Sparkworks guide (journal, J → Sparkworks tab) | Done | "How power works" page + 12 builds with drawn pictures (the game's own block icons, arrows for direction) and steps in our own words. Wraps to one column on phones (checked at 375 px wide) |
| The 12 builds | Done | Each was built block by block in a test world and checked: NOT gate, blinking clock, memory latch, 2×2 piston door, secret floor hatch, item sorter (iron sorted, cobble + gold to overflow, nothing lost), auto-smelter (8 ore → 8 ingots), crop-growth alarm, note block song, tripwire trap (fired an arrow), minecart station (launched the cart), flying machine (traveled 40 blocks) |
| Changes from the design | Partial | **T flip-flop replaced by a memory latch (ON and OFF buttons):** the classic two-dropper T flip-flop doesn't work in Blockhaven because both droppers fire on every press and the item bounces back. **"Hidden staircase" became a secret floor hatch** (the start of a hidden stairway). **"Auto-farm with observer" became a crop-growth alarm** until sugar cane exists (Milestone 16) |
| Creative "Mechanisms" tab | Done | Already existed from Parts A–D; checked that the Creative inventory still draws every icon (504, none broken) |
| Sounds pass | Done | New: minecarts clack each time they roll onto the next rail, louder and higher when fast (5 clacks over 6 rails in the test). Already there from Parts A–D: switches, plates, pistons, doors, note blocks, bells, sensors, dispensers, Crafter |
| Circuit test page | Missing | Not built as a separate page; the builds were tested in the browser instead (scripts in this session) |
| Not yet checked | Partial | Not played by hand on a Chromebook; sounds checked by counting calls, not by listening |

## Milestone 14: smaller gaps (built, browser-tested, and published 2026-11-12)
Code: `js/companions.js` (new), plus changes in `js/blocks.js` (items 617–623, block 215), `js/entities.js`, `js/main.js`, `js/worldgen.js` (land version 9), `js/ui.js`, `js/advancements.js`, and `index.html` (version tags `?v=m14-1`). Backups: `tools/backups/pre-m14-smaller-gaps-2026-11-12/`.

| Feature | Status | Notes |
|---|---|---|
| Lead | Done | 2 from 4 String + 1 Gloop Ball. Right-click an animal (not monsters, villagers, or bosses) to lead it; right-click it again to let go. Right-click a fence to tie up everything on your lead. Snaps (the lead drops) past 10 blocks, or when its fence is broken. Rope drawn with a little sag, plus a knot on the fence. Saved with the creature. Also in treasure (15%) and from the Wanderer |
| Name Tag | Done | From treasure (20%), fishing treasure, and the Wanderer (3 Jade). Right-click a creature: a small box asks for a name (up to 24 letters). The name floats above it (nearest 16 within 14 blocks), and named creatures never despawn. Difference from Java: no anvil needed yet (the anvil comes in Milestone 15) |
| Trotter armor | Done | Leather (crafted from 7 leather), iron, gold, Skyshard (treasure only; gold and Skyshard also in Ember Depths fortresses). Tame adult Trotters only. Cuts damage by 12% / 20% / 28% / 44% (tested: a 10-damage hit did 7.2 with gold). Crouch + right-click with an empty hand takes it off; swapping gives the old one back; dropped when the Trotter is defeated. Drawn as plates over the body and head |
| Trotter coats | Done | 7 colors × 5 markings (none, white socks, white patches, white dots, black dots), plus the original chestnut. Older saves keep the original look. Foals take after a parent (1 in 9 get a random coat) |
| Donkeys and mules | Done | Already existed: Long Ear and Trail Mule (27-slot saddlebags, crouch + right-click), Trotter + Long Ear makes a Trail Mule, mules can't breed |
| Pet breeding | Done | Tame Scouts breed with any meat, tame Whiskers with fish (at full health). The baby is already tame. Wild Whiskers can also be tamed with fish. Tested: one tame baby each |
| Rotting outside the Ember Depths | Done | Hogbeasts become Zoglins, and Boarkin (and Brutes) become Rotboars, after 15 seconds anywhere but the Ember Depths (tested) |
| Creatures through portals | Done | A creature standing in a lit Ember Depths portal for 3 seconds comes out of the linked portal on the other side and waits there for you; it can't go back for 15 seconds. Only portals you've already traveled through lead anywhere. Pets that are following you, leashed creatures, and bosses don't go |
| Your mount comes through portals | Done | Ride a Trotter (or Long Ear, mule…) into an Ember Depths portal and you arrive still riding it, with its saddle, armor, and coat (tested; no copy left behind). Hollow portals still leave mounts behind |
| Calling the Hollow Wyrm back | Done | Void Crystal: 7 glass + Eye of the Void + Wailer Tear. Set one on each side of the exit portal's bedrock rim (obsidian or bedrock only, Hollow only). Then the portal home closes, the 10 pillars grow back (broken ones repaired), their crystals return, and the Wyrm comes back at full health. A returning Wyrm gives 100 XP orbs and 1 Wyrm Scale, with no second egg and no second Cinder Eye. Half-finished crystal setups are saved |
| Hollow ships | Done | Land version 9: about 6 of every 10 Hollow towers get a ship floating beside them (hull, deck hatch, mast and black sail, 2 Shellers). Two chests below deck always hold Glider Wings, sometimes Skyshard Trotter Armor and a Name Tag. A Wyrm Head trophy block on the bow. Older worlds only get ships in Hollow places the player hasn't changed |
| 5 new advancements | Done | Walkies (lead), What's Your Name? (name tag), Knight's Steed (Trotter armor), Growing Family (pet babies), The Hollow... Again? (call the Wyrm back) |
| Not yet checked | Partial | Not played by hand on a Chromebook. Fights and placements were driven with test shortcuts. Play Together guests can't use leads or name tags (host only) |

## Milestone 24, Part E: Journal, achievements and Creative tab (built and browser-tested 2026-11-25, not published yet). Milestone 24 is now complete.
Merged with Village Overhaul 2.0 (PR #38) and Ultra Hardcore (PR #39) before publishing: Milestone 24 was redone on top of them, its blocks moved to 564-568 (563 is their Campfire), and everything was re-tested.
Code: `js/creatures-guide.js` (new: Journal tab "Creatures", 5 pages), `js/advancements.js` (new "Creatures" category, 11 achievements), `js/ui.js` (Journal tab, Creative tab "Creature Finds"), `js/main.js` and `js/entities.js` (events for the glowing frame and the Ravager stun), `index.html` (tags `?v=beh-e-1`, import map entry for the guide). Backups: `tools/backups/pre-m24e-2026-11-25/`.

| Feature | Status | Notes |
|---|---|---|
| 11 achievements | Done | "Creatures" tab: Should Have Slept (Phantom), Spellbreaker (Evoker), Sound the Horn, Snow Buddy, Calm Winds (Breeze), Riding the Gust (Wind Charge), Shy No More (Ocelot), Teamwork Underwater (Axolotl), Ancient Garden (Sniffer), Shine On (glowing frame), Stand Your Ground (Ravager stun) |
| Journal: "Creatures" | Done | 5 pages: night and magic, mountains and snow, wind and the wild, water friends, diggers and pests |
| Creative: "Creature Finds" | Done | 13 things: Goat Horn, Breeze Rod, Wind Charge, Glow Ink Sac, Torchflower Seeds, Pitcher Pod, Torchflower, Pitcher Plant, Infested Stone, Phantom Membrane, Lifeward Totem, Carved Pumpkin, Snow |
| Not yet checked | Partial | Achievements were unlocked by firing their events directly, not by playing. Not played by hand on a Chromebook |

## Milestone 24, Part D: Axolotls, Glow Squid, Sniffers, silverfish, Endermites, Ravagers, Zoglins and Allays (built and browser-tested 2026-11-25, not published yet)
Code: `js/creatures.js` (`thinkAxolotl`, `thinkSniffer`, `thinkSilverfish`, `thinkRavager`, `thinkZoglin`, Glow Squid dimming, Endermite lifetime, Allay dancing, new poses), `js/blocks.js` (blocks 564-568 (563 is the Village Overhaul's Campfire): Infested Stone, Torchflower Crop, Torchflower, Pitcher Crop, Pitcher Plant; items 1038-1040: Glow Ink Sac, Torchflower Seeds, Pitcher Pod; their pictures and dye recipes), `js/main.js` (ancient crop harvests, Infested Stone releasing a silverfish, Endermites from Void Pearls, glowing item frames, ctx `jukeboxNear`, `blocking`, `axolotlHelp`), `js/entities.js` (Ravager shield stun, a hurt Glow Squid goes dark), `js/decor.js` (glowing frames), `index.html` (tags `?v=beh-d-1`, creatures `beh-d-2`). Backups: `tools/backups/pre-m24d-2026-11-25/`.

| Feature | Status | Notes |
|---|---|---|
| Axolotls | Done | Hunt Drowned and Guardians in the water. When one of their foes dies near you, you get Regeneration and lose Mining Fatigue. When hurt, an Axolotl sometimes plays dead (belly up) for 10 seconds while it heals |
| Glow Squid | Done | Goes dark for a few seconds when hurt. Drops 1-3 Glow Ink Sacs. Use a Glow Ink Sac on an Item Frame and what's inside shines even in the dark |
| Sniffers | Done | About every 5 minutes a Sniffer sniffs the ground, digs, and finds Torchflower Seeds or a Pitcher Pod. Plant them on farmland: they grow into a Torchflower (orange dye) or a Pitcher Plant (2 cyan dye) |
| Silverfish | Done | When nobody is close they slip into nearby Stone to hide (it becomes Infested Stone). Hurting a silverfish wakes up to 5 hiding nearby; breaking Infested Stone lets one out. Their bites are weaker (1 damage) |
| Endermites | Done | 1 in 20 thrown Void Pearls brings one along. They wander off for good after 2 minutes |
| Ravagers | Done | 100 health. They trample leaves and crops in their way. If a Ravager bites your raised shield it's stunned for 2 seconds, then roars: everything within 4 blocks is hurt and thrown back (other raiders aren't). Drops a Saddle |
| Zoglins | Done | Attack the nearest creature of any kind (except Hissers and other Zoglins) when you're not around |
| Allays | Done | Dance while a Jukebox plays within 10 blocks |
| Not yet checked | Partial | Not played by hand on a Chromebook. Driven with test shortcuts (the shield stun was tested with a stand-in for holding the shield). Infested Stone only appears where silverfish hide (no new land generation). Not tested in Play Together |

## Milestone 24, Part C: the Breeze and Wind Charges, bats, pandas and ocelots (built and browser-tested 2026-11-25, not published yet)
Code: `js/creatures.js` (`thinkBreeze`, `thinkBat`, `thinkPanda`, `thinkOcelot`, Ocelot trust, bat and panda poses), `js/entities.js` (`windBurst`, Wind Charge hits, Hissers fear Ocelots, trusted Ocelots don't flee, `def.noFall`), `js/main.js` (throwing Wind Charges, ctx `windLaunch` and `thunder`), `js/player.js` (a Wind Charge leap only counts the fall below the burst), `js/blocks.js` (Breeze Rod 1036, Wind Charge 1037, pictures, recipe), `js/audio.js` (gust sound), `index.html` (tags `?v=beh-c-1`, creatures `beh-c-2`). Backups: `tools/backups/pre-m24c-2026-11-25/`.

| Feature | Status | Notes |
|---|---|---|
| The Breeze | Done | No longer flies: it bounces around on the ground, circling you at 5-12 blocks, and fires Wind Charges (1 damage and a big push). Takes no fall damage. Drops 1-2 Breeze Rods |
| Wind Charges | Done | 1 Breeze Rod makes 4. Right-click to throw (twice a second at most). It bursts into a gust that pushes everything within 3 blocks away and up, with no damage to blocks. Throw one at your feet to leap about 4 blocks high; you only take fall damage for falling below where it burst |
| Bats | Done | Flit about. Under a ceiling they may hang upside down to rest (more often in the daytime). They wake up when you come within 4 blocks |
| Pandas | Done | Each has a mood: normal, lazy (lies down for naps), worried (hides its face in thunderstorms), playful (rolls over), aggressive (fights back when hit, 6 damage) or weak (sneezes). Baby pandas sneeze too, sometimes dropping a Gloop Ball. Pandas now eat Bamboo (for breeding) |
| Ocelots | Done | Shy until you feed them Raw Minnow or Raw Salmon (1 try in 3 wins their trust; then they stop running away and never wander off for good). They hunt chickens, and Hissers keep away from them |
| Not yet checked | Partial | Not played by hand on a Chromebook. Driven with test shortcuts. Not tested in Play Together (guests can't throw Wind Charges) |

## Milestone 24, Part B: goats, Snow Golems, polar bears, Strays and Husks (built and browser-tested 2026-11-25, not published yet)
Code: `js/creatures.js` (`thinkGoat`, `thinkSnowGolem`, `guardCubs`, goat horns and sheared Snow Golem drawing), `js/entities.js` (golem snowballs, Stray/Parched arrow effects, Husk hunger, milking goats), `js/main.js` (Goat Horn use, building a Snow Golem), `js/blocks.js` (Goat Horn, item 1035, and its picture), `js/audio.js` (horn sound), `index.html` (tags `?v=beh-b-1`, creatures `beh-b-2`). Backups: `tools/backups/pre-m24b-2026-11-25/`.

| Feature | Status | Notes |
|---|---|---|
| Goats ram | Done | Every 30 s to 5 min (a rare "screaming" goat every 5-15 s) a goat lowers its head, then charges at you (Survival only) or another creature: 2 damage and a big push. Goats also take big leaps. They no longer fight back like bears |
| Goat Horns | Done | A goat that rams into stone, ore, logs or ice loses a horn (it has 2), which drops as a Goat Horn. Right-click a Goat Horn to sound it (once every 7 seconds) |
| Milking goats | Done | Use a Bucket on a grown goat |
| Snow Golems | Done | Build one: 2 Snow blocks with a Carved Pumpkin or Jack o'Lantern on top. They throw snowballs at monsters within 10 blocks (once a second): no damage, just a push (fiery creatures take 3). They leave snow where they walk in cool places (forests, taiga, snow, mountains, cherry groves; not plains, like Java), and melt in deserts, badlands, savannas, the Ember Depths, rain and water. Shears take the pumpkin off |
| Polar bears guard cubs | Done | About 1 in 4 grown polar bears has a cub. Come within 8 blocks while a cub is near and the parent roars and attacks |
| Strays, Parched, Husks | Done | Stray arrows give Slowness (30 s), Parched arrows give Weakness (30 s), a Husk's hit makes you hungry |
| Not yet checked | Partial | Not played by hand on a Chromebook. Driven with test shortcuts. Not tested in Play Together (guests can't build Snow Golems) |

## Milestone 24, Part A: Phantoms, Evokers and Vexes (built and browser-tested 2026-11-25, not published yet)
Code: `js/creatures.js` (`thinkPhantom`, `thinkVex`, `thinkEvoker`, `spawnPhantoms`, `noNatural` spawn flag), `js/entities.js` (`addFang`/`updateFangs`; swooping Phantoms dive fast; flying creatures no longer take fall damage), `js/main.js` (`restlessDays`, `G.rested`, ctx `restless`), `js/multiplayer.js` (everyone sleeping resets the count), `index.html` (tags `?v=beh-a-3`). Backups: `tools/backups/pre-m24a-2026-11-25/`.

| Feature | Status | Notes |
|---|---|---|
| Phantoms | Done | Only after 3 or more days without sleeping (sleeping or dying resets the count; older worlds start counting when loaded). At night, under the open sky, a bigger chance the longer you stay awake: 1-2 on Easy, up to 3 on Normal, up to 4 on Hard. They circle high above, then swoop down to bite and climb away. A toast warns you the first time. They still burn in daylight and drop Phantom Membrane |
| Evokers | Done | Keep 8-14 blocks away and cast spells: a line of 16 fangs toward you (a ring of fangs if you're close), or 3 Vexes every 17 seconds (if fewer than 8 are around). Fangs bite anything except illagers. 24 health. Drop a Lifeward Totem (and sometimes Jade) |
| Vexes | Done | Fly straight through walls, hover near you and dart in to strike. Summoned Vexes fade away after 30 to 120 seconds |
| No random spawns | Done | Phantoms, Evokers and Vexes no longer appear at random. Evokers still come in Woodland Mansions and village raids; all three have spawn eggs |
| Not yet checked | Partial | Not played by hand on a Chromebook. Fights were driven with test shortcuts. Not tested in Play Together |

## Milestone 23, Part E: Journal and achievements (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #37). Milestone 23 is now complete.
Code: `js/villages-guide.js` (new: Journal tab "Villages", 4 pages), `js/advancements.js` (new "Villages" category, 10 achievements), `js/ui.js` (Journal tab), `js/blocks.js` (the Cauldron and Beehive count as job blocks for jobless villagers), `index.html` (tags `?v=vill-e-1`, import map). Backups: `tools/backups/pre-m23e-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| 10 achievements | Done | "Villages" tab: Career Change, Learning the Trade, Master Trader, Growing Village, Zombie Doctor, Watchtower, Something Bubbling, Mansion in the Woods, Bad Omen, Hero of the Village |
| Journal: "Villages" | Done | 4 pages: jobs (all 12 job blocks), levels and families, zombie villagers, outposts and raids |
| Creative | Done | The new job blocks are in the existing "Village" tab (no new tab needed) |

## Milestone 23, Part D: outposts, witch huts, mansions and raids (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #37)
Code: `js/land-structures.js` (new: where the buildings go, what they look like, who lives there), `js/worldgen.js` (land version 20 = `STRUCT_GEN`), `js/world.js` (`structureOk`: older worlds get a building only where nobody has been), `js/entities.js` (the Pillager Captain, raiders heading into the village), `js/main.js` (residents, loot, Bad Omen, raids, Hero of the Village), `js/ui.js` (effect names), `index.html` (tags `?v=vill-d-1`, import map). Backups: `tools/backups/pre-m23d-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Pillager Outposts | Done | A dark oak watchtower (ladder inside, lookout deck, a loot chest with arrows, crossbows, banners) on plains, savannas, deserts, taiga and snowy plains, guarded by pillagers, a vindicator and a **Pillager Captain** |
| Witch Huts | Done | A spruce hut on stilts in swamps, with a cauldron and a witch |
| Woodland Mansions | Done | A big two-story dark oak manor in dark forests, with 6 rooms, 4 treasure chests (gold, Jade, enchanted books, sometimes a Totem or a music disc), vindicators, an evoker and a pillager. Rare, like Minecraft |
| Where they appear | Done | Never near the world's start, strongholds, villages or temples. **New worlds** (land version 20) get them everywhere. **Older worlds** get one only where nobody had been on or near its spot (decided once and remembered, like the Ocean Monuments); huts and mansions also need the new biomes there. Checked: in an older test world, no building touches land that had been visited or changed |
| Bad Omen | Done | Defeat a Pillager Captain to get Bad Omen (100 minutes). Walk into a village (3+ villagers) with it and a raid starts |
| Village raids | Done | 3 waves on Easy, 4 on Normal, 5 on Hard: pillagers, vindicators, witches, ravagers, an evoker. Raiders head for the village and go after villagers. Leaving the village ends the raid |
| Hero of the Village | Done | Beat every wave: villagers sell for less (about 30% off) for an hour |

## Milestone 23, Part C: zombie villagers (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #37)
Code: `js/entities.js` (`huntVillager`, `zombify`, `cureZombie`, curing with a Golden Apple; zombie villagers remember who they were), `js/main.js` (half-price trades for cured villagers, messages), `js/ui.js` ("Cured: half-price Jade!"), `index.html` (tags `?v=vill-c-1`). Backups: `tools/backups/pre-m23c-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Zombies hunt villagers | Done | On Normal and Hard only: at night, Groaners, husks, drowned and zombie villagers go after villagers within 16 blocks. Villagers run away (they're faster) and hide at home. On Easy and Peaceful zombies leave villagers alone, as before. Story villagers (the Legacy Campaign) are never hunted |
| Turning | Done | A villager beaten by a zombie becomes a zombie villager: always on Hard, half the time on Normal (otherwise it's just gone, as in Minecraft). It remembers its job, level and home |
| Curing | Done | Hit a zombie villager with a Splash Potion of Weakness, then right-click it with a Golden Apple. After about a minute (keep it out of the sun!) it turns back into the same villager, with the same job and level, and sells everything for half the Jade |

## Milestone 23, Part B: villager levels and families (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #37)
Code: `js/entities.js` (`LEVEL_NAMES`, `LEVEL_XP`, `BONUS` trades, `levelOf`, `tradesOf`, `villagerFamily`), `js/main.js` (trading experience, level-ups, "a baby villager was born"), `js/ui.js` (level and progress bar on the trading screen, bonus trades listed), `index.html` (tags `?v=vill-b-1`). Backups: `tools/backups/pre-m23b-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Villager levels | Done | Novice → Apprentice → Journeyman → Expert → Master, at 10, 70, 150 and 250 trading experience (Minecraft's numbers). Every trade gives the villager experience; the trading screen shows its level and a progress bar |
| Bonus trades | Done | Each new level adds one bonus trade (4 per job, 52 in all), e.g. a Master Farmer sells Glistering Melon, a Master Armorer sells Skyshard armor, a Master Shepherd sells paintings. Unlike Minecraft, no regular trade is ever locked, so villagers in existing worlds keep every trade they had |
| Villager families | Done | In the daytime, two grown villagers standing together may have a child if the village has more beds than villagers (their homes' beds plus beds you place within 32 blocks). The child gets a free bed as its home, has no job, and grows up in about 20 minutes, then takes a job block like any jobless villager |

## Milestone 23, Part A: job blocks and new jobs (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #37)
Code: `js/blocks.js` (block numbers 558-562, 14 textures, recipes including the Stonecutter's), `js/shapes.js` (stonecutter, lectern), `js/entities.js` (5 new jobs and their trades, jobless villagers, `checkJob`/`changeJob`), `js/main.js` (smoker and blast furnace cooking, the Stonecutter, traded villagers keep their job), `js/ui.js` (Stonecutter screen; smoker/blast furnace only take what they cook), `index.html` (tags `?v=vill-a-*`). Backups: `tools/backups/pre-m23a-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Smoker | Done | Furnace + 4 Logs. Cooks only food, twice as fast as a Furnace. Job block of the new **Butcher** |
| Blast Furnace | Done | Furnace + 5 Iron Ingots + 3 Stone. Smelts only ores, twice as fast. Job block of the new **Armorer** |
| Barrel | Done | 6 Planks + 2 Oak Slabs. Holds 27 stacks like a chest. Job block of the new **Fisherman** |
| Stonecutter | Done | 1 Iron Ingot + 3 Stone. Cuts one stone block into 2 slabs, 1 stair or 1 wall (no waste), or Stone into Stone Bricks. Job block of the new **Mason** |
| Lectern | Done | 4 Oak Slabs + 1 Bookshelf. A second job block for the **Scribe** |
| Leatherworker | Done | New job using the Cauldron |
| Changing jobs | Done | A villager nobody has traded with loses its job if you break its job block (it becomes "Villager (no job)"), and a villager with no job takes an unclaimed job block you placed within 16 blocks. Trade with a villager once and it keeps that job for good. Village workers whose work spot was never a job block keep their jobs |

## Milestone 22, Part E: Journal, achievements, Creative tab (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #36). Milestone 22 is now complete.
Code: `js/farm-guide.js` (new: Journal tab "Farm & Gadgets", 4 pages), `js/advancements.js` (new "Food & Gadgets" category, 13 achievements), `js/ui.js` (Journal tab, Creative tab "Farm & Gadgets"), `js/main.js` (glide-boost event), `js/blocks.js` (each disc is named after its song), `index.html` (tags `?v=farm-e-1`, import map). Backups: `tools/backups/pre-m22e-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| 13 achievements | Done | "Food & Gadgets" tab: Root Vegetables, Pumpkin Carver, Spooky Lights, Piece of Cake, Hearty Meal, Legendary Snack, Bolt Action, Far Sight, What Time Is It?, Sky Show, Rocket Rider, Spin a Tune, Record Collector (all 5 discs) |
| Journal: "Farm & Gadgets" | Done | 4 pages: new crops, food, gadgets, fireworks and music |
| Creative tab "Farm & Gadgets" | Done | All 24 new things from Milestone 22 in one place |
| Disc names | Done | Each disc is called "Music Disc: " and its song's name |

## Milestone 22, Part D: fireworks and music (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #36)
Code: `js/music.js` (new: 5 original Blockhaven songs for the note-block instruments), `js/blocks.js` (Jukebox = block number 557, items 1029-1034, textures, pictures, recipes), `js/main.js` (rockets, bursts, gliding boost, crossbow fireworks, the jukebox player, discs in treasure), `js/ui.js` (crossbow "Loaded with a firework"), `index.html` (tags `?v=farm-d-*`, import map). Backups: `tools/backups/pre-m22d-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Firework Rocket | Done | 1 Paper + 1 Boom Powder make 3. Right-click a block to launch one: it climbs about 25 blocks and bursts into a ball of glowing colored sparks with a bang and a crackle |
| Glider boost | Done | While gliding with Glider Wings, right-click a rocket to shoot forward fast for about 1½ seconds |
| Crossbow fireworks | Done | Hold a firework in your other hand while loading a crossbow; it fires straight and bursts on what it hits (6 damage nearby). Multishot fires 3 |
| Jukebox | Done | 8 Planks + 1 Skyshard. Right-click with a Music Disc to play it (you hear it within about 60 blocks); right-click again to take the disc out |
| 5 Music Discs | Done | Original Blockhaven songs, about 40-55 seconds each: "Sunrise Over Blockhaven" (harp), "Lantern Waltz" (flute and guitar), "Deep Cave Echoes" (bells), "Sea Breeze" (chimes and banjo), "Starlight" (chiptune). Found in treasure chests (about 1 in 7) |
| Not included | — | Firework stars, custom firework colors and shapes, longer-flight rockets |

## Milestone 22, Part C: crossbow, spyglass, clock (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #36)
Code: `js/blocks.js` (items 1026-1028, pictures, recipes), `js/enchanting.js` (Quick Charge, Multishot, Piercing), `js/entities.js` (arrows that pierce), `js/main.js` (loading and firing, spyglass zoom, the clock on the compass dial), `js/ui.js` ("Loaded" note on the crossbow), `index.html` (tags `?v=farm-c-1`). Backups: `tools/backups/pre-m22c-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Crossbow | Done | 3 Sticks + 2 String + 1 Iron Ingot + 1 Tripwire Hook at a Workbench. Hold right-click about 1¼ seconds to load an arrow (it stays loaded), then right-click to fire: a fast, straight shot for 9 damage |
| Crossbow enchantments | Done | Quick Charge (I-III: loads faster), Multishot (3 arrows for the price of 1), Piercing (I-IV: the arrow goes through that many extra creatures). Multishot and Piercing can't go on the same crossbow, like Minecraft |
| Spyglass | Done | 2 Iron Ingots + 1 Glass (Blockhaven has no copper or amethyst). Hold right-click to zoom in 8 times, with a round view |
| Clock | Done | 4 Gold Ingots + 1 Sparkdust. Holding it shows the sun and moon on the dial and the time of day ("Morning", "Sunset"…) and day number. It spins in the Ember Depths and the Hollow |
| Not included | — | Loading fireworks into a crossbow comes with Part D |

## Milestone 22, Part B: cake and more food (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #36)
Code: `js/blocks.js` (Cake = block number 556, items 1024-1025, textures, fullness for all the new foods, recipes), `js/shapes.js` (the cake shrinking slice by slice, a candle on top), `js/main.js` (eating cake, candle cakes, recipes that give buckets back, the enchanted apple), `js/ui.js` (the enchanted apple shimmers), `index.html` (tags `?v=farm-b-*`). Backups: `tools/backups/pre-m22b-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Cake | Done | 3 Milk Buckets + 2 Sugar + 1 Egg + 3 Wheat at a Workbench (you get the 3 empty buckets back). Place it on a block and right-click to eat a slice (2 food) when you're hungry; 7 slices in all |
| Candle cake | Done | Put a plain Candle on a whole cake, then light it with Flint and Steel. Eating a slice knocks the candle off |
| Rabbit Stew | Done | Cooked Rabbit + Carrot + Baked Potato + Brown Mushroom + Bowl. 10 food, the most filling food in the game |
| Enchanted Golden Apple | Done | Very rare chest treasure (can't be made). Strong regeneration, 8 extra golden hearts, Resistance and Fire Resistance for 5 minutes. It shimmers |
| Fullness | Done | Every Milestone 22 food has Minecraft's fullness ("saturation") value |

## Milestone 22, Part A: potatoes, beetroot, pumpkins (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #36)
Code: `js/blocks.js` (block numbers 550-555, items 1016-1023, `isCrop`, 12 textures, food pictures, recipes, baked potatoes in the furnace), `js/main.js` (growing, harvesting, pumpkin stems, carving with Shears, tall grass drops), `js/entities.js` (crops villagers help along), `index.html` (tags `?v=farm-a-1`). Backups: `tools/backups/pre-m22a-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Potatoes | Done | Found by breaking tall grass (now and then). Plant on farmland; a grown plant gives 1-4 potatoes, and sometimes a Poisonous Potato. Cook into a Baked Potato (5 food) |
| Beetroot | Done | Beetroot Seeds from tall grass. Grown plants give a Beetroot and 1-3 seeds. 6 Beetroot + a Bowl = Beetroot Soup (6 food). Beetroot also makes Red Dye |
| Pumpkins | Done | Pumpkin Seeds from tall grass (or 4 from a pumpkin). The grown stem makes pumpkins on the ground beside it, like melons. Pumpkin + Sugar + Egg = Pumpkin Pie (8 food) |
| Carved pumpkin, Jack o'Lantern | Done | Use Shears on a pumpkin to carve a face toward you (and get 4 seeds). Carved Pumpkin + Torch = a glowing Jack o'Lantern |
| Worlds | Done | No change to how land is made; the new seeds come from grass, so every world (old or new) can grow them |

## Milestone 21, Part E: Journal, achievements, Creative tab (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #35). Milestone 21 is now complete.
Code: `js/building-guide.js` (new: Journal tab "Building", 4 pages), `js/advancements.js` (new "Building" category, 11 achievements), `js/ui.js` (Journal tab, Creative tab "Decor"), `js/main.js` (double slab and concrete events), `index.html` (tags `?v=build-e-1`, import map). Backups: `tools/backups/pre-m21e-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| 11 achievements | Done | "Building" tab: Step Up, Double Up, A Splash of Color, Rainbow Builder (wool in all 16 colors), Set in Stone, Up We Go, Candlelight, Art Gallery, On Display, Dressed Up, Flag Bearer |
| Journal: "Building" | Done | 4 pages: slabs/stairs/walls, colors and dyes (every dye recipe), light and climbing, decorations |
| Creative tab "Decor" | Done | All 193 new blocks and the 16 dyes in one place |

## Milestone 21, Part D: banners, item frames, armor stands, paintings (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #35)
Code: `js/decor.js` (new: 12 original paintings, and drawing what frames, stands and paintings hold), `js/blocks.js` (block numbers 531-549, textures, item pictures, recipes), `js/shapes.js` (models; `tall` pieces), `js/mesher.js` (pieces taller than a block show their texture correctly), `js/main.js` (placing, using, breaking, support), `index.html` (tags `?v=build-d-*`, import map). Backups: `tools/backups/pre-m21d-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Banners (16) | Done | 6 Wool of a color + 1 Stick. Stand on the ground (two blocks tall) or hang on a wall. Plain colors only: no patterns or loom designs yet |
| Item frame | Done | 8 Sticks + 1 Leather. Goes on a wall. Right-click with anything to put it in, right-click again to turn it; hit the frame to take the item out (hit again to take the frame down) |
| Armor stand | Done | 6 Sticks + 1 Stone Slab. Right-click with a helmet, chestplate, leggings or boots to put it on (swaps with what's there); right-click with an empty hand to take a piece back. Breaking it drops its armor. The armor is shown as the items floating on the stand, not as a dressed figure |
| Paintings (12) | Done | 8 Sticks + 1 White Wool. Click a wall: it picks one of the biggest pictures that fits there. 12 original Blockhaven pictures in 4 sizes (1×1, 2×1, 1×2, 2×2): Red Apple, Little Cottage, Crescent Moon, Flower Pot, Sunset Hills, Sailboat, Desert Dunes, Waterfall, Tall Pine, Mountain Lake, Castle on a Hill, Night Village. Breaking any part takes the whole painting down |
| Support | Done | Frames, paintings and wall banners fall off when their wall is broken; standing banners and armor stands when the block under them is broken |
| Play Together | Not done | Friends see the frames, stands and paintings themselves, but not what's in or on them (only the host's game keeps that) |

## Milestone 21, Part C: ladders, scaffolding, lanterns, candles, panes, bars (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #35)
Code: `js/blocks.js` (block numbers 493-530, `CANDLE` light table, 24 new textures, recipes), `js/shapes.js` (models, boxes, `paneLinks`), `js/player.js` (`climbing`, scaffolding you can stand on top of), `js/main.js` (placing rules, candles stacking/lighting/blowing out, things popping off when their support goes, a whole scaffolding column coming down), `index.html` (tags `?v=build-c-*`). Backups: `tools/backups/pre-m21c-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Ladder | Done | 7 Sticks make 3. Goes on the side of a solid block. Walk into it (or jump) to climb, crouch to hold on, let go to slide down slowly. No fall damage on ladders. Pops off if its wall is broken |
| Scaffolding | Done | 6 Bamboo + 1 String make 6. Jump inside to climb, stand on top, crouch to climb down through it. Breaking one brings down the whole column above it. (Minecraft's "how far it can stick out" rule isn't included) |
| Lantern | Done | 1 Iron Ingot + 1 Torch (Blockhaven has no iron nuggets). Full brightness. Stands on a block or hangs on a chain under one |
| Candles (17) | Done | String + Honeycomb make a Candle; Candle + a dye makes a colored one. Up to 4 of the same color in one spot. Light them with Flint and Steel (3 light each); right-click with an empty hand to blow them out |
| Glass panes (17) | Done | 6 Glass make 16 panes; 6 Stained Glass make 16 stained panes. Thin, and they join each other, walls, and full blocks |
| Iron Bars | Done | 6 Iron Ingots make 16. Join like panes |

## Milestone 21, Part B: 16 colors (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #35)
Code: `js/blocks.js` (`COLORS`, `woolOf`, dyes = items 1000-1015, block numbers 405-492, 72 new textures, the texture sheet doubled to 256 × 1024, recipes, dye pictures), `js/shapes.js` (carpets), `js/fluids.js` (concrete powder hardens), `index.html` (tags `?v=build-b-1`). Backups: `tools/backups/pre-m21b-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| 16 dyes | Done | White (Bone Meal), Red (Red Poppy), Yellow (Sunbell), Pink (Pink Petals), Blue (Lapis), Brown (Cocoa Beans), Black (Ink Sac), Green (cook Cactus), Lime (cook a Sea Pickle). Mix two for the rest: Orange, Light Blue, Cyan, Purple, Magenta, Gray, Light Gray, Lime, Pink |
| Wool (16) | Done | White Wool + a dye. "Wool" is now called "White Wool" (same block) |
| Carpet (16) | Done | 2 wool make 3 thin carpets |
| Stained glass (16) | Done | 8 Glass + a dye make 8. Drawn as a tinted frame with tinted streaks, since Blockhaven's blocks can't be half see-through. The old landmark "Stained Glass" stays as it was |
| Concrete and powder (16 each) | Done | 4 Sand + 4 Gravel + a dye make 8 Concrete Powder. It falls like sand, and turns into smooth Concrete when it touches water |
| Terracotta (16) | Done | 8 Terracotta + a dye make 8. The 10 colors that were missing were added (the 6 from the badlands were already there) |
| Not included | — | Dyeing sheep, glazed terracotta |

## Milestone 21, Part A: slabs, stairs, and walls (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #35)
Code: `js/blocks.js` (`SHAPED`, `WALLED`, block numbers 357-404, `isSlab`/`isStairs`/`isWall`, recipes, fuel, item pictures), `js/shapes.js` (how they look, what you bump into, walls joining), `js/main.js` (placing top/bottom halves, double slabs, stairs facing, a double slab drops 2), `index.html` (tags `?v=build-a-1`). Backups: `tools/backups/pre-m21a-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Slabs (20) | Done | Oak, Birch, Spruce, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Crimson, Warped, Stone, Cobblestone, Mossy Cobblestone, Stone Brick, Brick, Sandstone, Quartz, Prismarine, Blackstone Brick, Ember Brick. 3 blocks make 6. Click the top of a block for a bottom slab, the underside (or the upper half of a side) for a top slab; a second slab on the empty half makes a double slab, which drops 2 |
| Stairs (20) | Done | Same 20 materials. 6 blocks make 4. They climb away from you; upside-down if placed on the underside or upper half of a side. Straight only (no corner shapes yet) |
| Walls (8) | Done | Cobblestone, Mossy Cobblestone, Stone Brick, Brick, Sandstone, Blackstone Brick, Ember Brick, Prismarine. 6 make 6. They join each other, solid blocks, and gates, and are 1.5 blocks tall to jump over, like fences |
| Walking | Done | You step right up slabs and stairs without jumping |
| Wooden ones | Done | Burn as furnace fuel and catch fire like planks |

## Milestone 19, Part D: Journal, achievements, settings (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #34). Milestone 19 is now complete.
Code: `js/advancements.js` (8 weather achievements in "The World"), `js/world-guide.js` (3 new Journal pages: Weather, Lightning, Snow and ice), `js/main.js` (achievement events, `G.setWeather` for the Creative buttons, `weather` world setting), `js/ui.js` + `index.html` ("Weather changes" option, Creative weather buttons), `js/save.js`, `js/multiplayer.js` (Storm Sleeper in Play Together), tags `?v=wx-d-1`. Backups: `tools/backups/pre-m19d-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| 8 achievements | Done | "The World" tab: Rainy Day, Snowfall, Storm Sleeper, Lightning Catcher, Changed by the Storm, Supercharged, Thunder Thrower, Spring Thaw |
| Journal | Done | 3 new pages in "The World": Weather, Lightning, Snow and ice |
| "Weather changes" option | Done | New world options and the pause menu's World options. On by default; off keeps the sky clear |
| Creative weather buttons | Done | Pause menu → World options, Creative only: ☀️ clear, 🌧️ rain, ⛈️ thunderstorm, for one in-game day. Not shown to Play Together guests |
| Speed check | Partial | Weather, lightning, and snow together cost well under 1 ms a frame on a Mac. Not yet tried on a school Chromebook |

## Milestone 19, Part C: snow and ice (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #34)
Code: `js/main.js` (`updateSnowAndIce`: random spots near you get a look 4 times a second; melting checks after placing a bright light; rain fills cauldrons; `hydrate` counts rain), `index.html` (tag `?v=wx-c-2`). Backups: `tools/backups/pre-m19c-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Snow piles up | Done | While it snows (cold biomes and above height 60), a thin snow layer appears on open ground, leaves, and roofs, a few spots at a time within about 48 blocks of you. One layer deep, like Java's default. Not on ice or farmland |
| Water freezes | Done | Open water in cold places freezes into ice from the edges, any time it's dark enough (no bright torch nearby), like Minecraft |
| Melting | Done | Ice and snow layers next to a bright light (torch, lantern, glowstone, and similar) melt within a few seconds; ice melts into water that flows. Packed Ice, Blue Ice, and Snow blocks never melt |
| Cauldrons fill in the rain | Done | A cauldron out in the rain fills one level about every 15 seconds |
| Rain waters farmland | Done | Farmland under the open sky stays wet while it rains, even far from water; it dries out again afterward |
| Speed | Done | About 0.03 ms for each check on a Mac |

## Milestone 19, Part B: lightning (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #34)
Code: `js/main.js` (bolts, sky flash, where lightning strikes, fire, damage, creature changes, Lightning Rods, Channeling), `js/blocks.js` + `js/shapes.js` (Lightning Rod block, block number 356, recipe), `js/entities.js` (charged Hissers: saved, blue glow, twice the blast; Channeling hook), `js/multiplayer.js` (friends see the host's lightning and can be struck), `js/oceans-guide.js` + `js/enchanting.js` (Channeling text), `index.html` (tags `?v=wx-b-*`). Backups: `tools/backups/pre-m19b-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Lightning bolts | Done | During thunderstorms, a bolt every few seconds somewhere within about 60 blocks: a zigzag flash from the clouds, the sky lights up, then thunder (louder and sharper when close). Only where rain falls, so never in deserts or snowy lands |
| Fire | Done | A strike starts a fire on Normal and Hard (and a few more on Hard), like Java. Not on Easy or Peaceful. The rain usually puts it out soon |
| Damage | Done | 5 damage and sets things on fire (rain puts the fire out). Sometimes it finds a creature, or you, standing in the open. Players in Play Together can be struck too |
| Creatures changed by lightning | Done | Pig becomes a Rotboar (Minecraft's zombified piglin), a Villager becomes a Witch (not story villagers or the Wanderer), and a Hisser becomes a **charged Hisser**: it glows blue and its blast reaches twice as far. Charged Hissers stay charged when you reload |
| Lightning Rod | Done | New block (Mechanisms): 3 Iron Ingots at a Workbench (Blockhaven has no copper, so it's iron). Any strike within 32 blocks hits the rod instead, with no fire. Doesn't send a redstone signal yet |
| Channeling | Done | A thrown trident with Channeling calls lightning onto the creature it hits, in a thunderstorm, under the open sky |
| Not included | — | Mooshrooms changing color, skeleton horse traps, and lightning burning dropped items (Blockhaven has no skeleton horses) |

## Milestone 19, Part A: rain, snow, and thunderstorms (built and browser-tested 2026-11-22, PUBLISHED 2026-11-22, PR #34)
Code: `js/weather.js` (new: the weather schedule, which biomes get rain or snow, the falling rain and snow), `js/main.js` (gray sky, dimmer daylight, rain sounds, rain puts out fires and burning players, sleeping through storms), `js/entities.js` (undead don't burn in the rain; rain puts out burning creatures), `js/multiplayer.js` (friends see the host's weather; sleeping clears it for everyone), `js/audio.js` (rain and thunder sounds), `index.html` (tags `?v=wx-a-2`, import map). Backups: `tools/backups/pre-m19a-2026-11-22/`.

| Feature | Status | Notes |
|---|---|---|
| Weather on the Surface | Done | Clear, rain, or a thunderstorm. The sky can change about every 5 minutes; it rains about 1/5 of the time, and about 1 in 3 rains is a thunderstorm. The first day is always clear. Comes from the world's seed and clock, like the sandstorm, so it never changes when you reload |
| Rain and snow by biome | Done | Rain in most places; snow in Snowy Plains, Snowy Peaks, Frozen Oceans, and anywhere above height 60; nothing falls in Deserts, Badlands, or Savannas (the sky still darkens). Stops at roofs, leaves, and water |
| Gray sky | Done | Gray, foggier sky, gray clouds, sun and moon hidden; thunderstorms are darker still, dark enough for monsters to spawn in the day |
| Sounds | Done | Rain all around you outside, muffled under a roof; distant thunder rumbles during storms |
| Rain puts things out | Done | Fires under the open sky, burning players, and burning creatures. Zombies and other undead don't burn in sunlight while it's raining on them |
| Sleeping through storms | Done | You can sleep during a thunderstorm, even in the daytime. Sleeping clears the weather for half a day or more, like Minecraft. Works in Play Together too |
| Play Together | Done | Friends see the host's weather (they share the host's clock) |
| Old worlds | Done | Every world gets weather; nothing about the land changes, so saves are unaffected |

## Milestone 18, Part D: Journal, achievements, settings, speed check (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21). Milestone 18 is now complete.
Code: `js/world-guide.js` (new: Journal tab "The World", 4 pages), `js/advancements.js` (new "The World" category, 7 achievements), `js/main.js` + `js/fluids.js` (achievement events, `liquidFlow` option), `js/ui.js` + `index.html` ("Water and lava flow" option, Journal tab), `js/save.js`, tags `?v=flow-d-1`. Backups: `tools/backups/pre-m18-partD-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| 7 achievements | Done | "The World" tab: Gravity Check, Timber!, Cobble Maker, Hot and Cold, Endless Water, Water Feature, Firefighter |
| Journal: "The World" | Done | 4 pages: water and lava, sand/gravel/leaves (and what needs support), fire, farmland and water |
| "Water and lava flow" option | Done | New world options and the pause menu's World options, next to "Fire spreads". On by default; off keeps water and lava still, like before |
| Speed check | Partial | 25 buckets poured at once flooded 2,605 blocks with no frame over 13 ms on a Mac. Not yet tried on a school Chromebook (expect brief stutters during very big floods there) |

## Milestone 18, Part C: support, farmland, trampling, waterlogging (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/blocks.js` (`WATERLOGGED`, `LOGGABLE`, `isWet`), `js/main.js` (signs, turtle eggs and cocoa pop off; `soilWater`; farmland tracking; trampling; bucket and placing rules for waterlogging), `js/fluids.js` (lily pads; waterlogged blocks count as water), `js/mesher.js` (water drawn in waterlogged blocks), `js/player.js` (swimming in them), `index.html` (tags `?v=flow-c-1`). Backups: `tools/backups/pre-m18-partC-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Things pop off | Done | Already: torches, plants, crops, snow, cactus, bamboo, doors, hanging vines and stalactites, and every redstone part. New: signs and turtle eggs (when the block under them goes), cocoa pods (when their log goes), and lily pads (when the water under them goes) |
| Farmland needs water | Done | Farmland is wet with water within 4 blocks (same level or one up) and dries out without it. Crops grow slower on dry farmland. Bare farmland with no water turns back into dirt after a while. Old farms change only once something is planted or tilled again |
| Trampling | Done | Jumping or falling onto farmland can trample it back into dirt (the crop pops off). Walking on it is fine |
| Waterlogging | Done | Fences, gates, trapdoors and signs can hold water: place one in a full water block, or pour a Water Bucket onto it (an empty bucket scoops it back out). The water is drawn around it, you can swim in it, and breaking the block leaves the water behind. Not in the Ember Depths |
| Not yet checked | Partial | Not played by hand. Creatures don't trample farmland (only players). Chests can't be waterlogged here, since they're full blocks |

## Milestone 18, Part B: falling sand and gravel, leaves that drop away, fire that spreads (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/fluids.js` (falling blocks share the same wake-ups; lava heat), `js/blocks.js` (`falls` on sand, red sand, gravel; `flammable`; `LEAF_PERSIST`), `js/main.js` (`startFall`/`updateFallers`, `queueLeafDecay`/`updateLeafDecay`, fire spreading in `updateFires`, placed leaves stay), `js/ui.js` + `index.html` ("Fire spreads" world option), `js/save.js`, tags `?v=flow-b-1` (main `flow-b-2`). Backups: `tools/backups/pre-m18-partB-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Falling sand and gravel | Done | Sand, red sand and gravel fall when nothing holds them up (you see them drop), landing in order. A torch or small plant they land on breaks off as an item. Like water, they only start falling when a block next to them is broken or placed |
| Leaves drop away | Done | After you cut a tree's logs, its leaves with no log within 5 blocks drop away over a few seconds (with the usual saplings and apples). Leaves you place yourself never drop away |
| Fire spreads | Done | Fire catches wood, leaves, wool, hay, bookshelves, and dry plants beside it, jumps to nearby spots, and burns blocks away (no drops). Blast Blocks catch and go off. Chests, workbenches and other things you use never burn. Lava can set things beside it on fire. Tested: a small plank hut burns down in about a minute |
| "Fire spreads" option | Done | New world options and the pause menu's World options. On by default (like Minecraft); turn it off to keep fire from spreading at all |
| Not yet checked | Partial | Not played by hand. Fire spreading can burn wooden buildings in villages and landmarks, like Minecraft (turn the option off to prevent it). Rain doesn't put fires out yet (weather is Milestone 19) |

## Milestone 18, Part A: flowing water and lava (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/fluids.js` (new: `initFluids`, `fluidOf`, `fluidHeight`, `flowPush`, `FALLING`), `js/main.js` (`FL`: wakes on breaking, placing, buckets, explosions; bucket rule; hole-filling rule), `js/mesher.js` (shallower flowing water and lava), `js/player.js` (currents), `index.html` (tags `?v=flow-a-1`, new import-map entry). Backups: `tools/backups/pre-m18-partA-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Water flows | Done | Spreads 7 blocks across a floor (shallower each step, in a diamond), pours straight down off edges, and dries up again gradually when its source is gone. Tested: 113 blocks from one bucket, a 10-block waterfall |
| Lava flows | Done | Spreads 3 blocks (7 in the Ember Depths), more slowly than water |
| Water meets lava | Done | Like Java: full lava → obsidian, flowing lava → cobblestone, lava pouring onto water → stone. A hiss and a puff of smoke |
| New water sources | Done | A flowing block between two full water blocks (with something solid or more water under it) becomes a full block, so a 3-block trench with water at both ends never runs dry |
| Currents | Done | Flowing water carries you toward where it's flowing (about 0.7 blocks a second) |
| Buckets | Done | Only full blocks can be scooped up; flowing water or lava says so |
| Old worlds stay put | Done | Water and lava only start moving when a player breaks or places a block beside them, uses a bucket, or something explodes. Gates, temple doors, and pistons don't wake them. Only on the Surface, in the Ember Depths, and in the Hollow (not in the Lost Civilization or other special places) |
| Not yet checked | Partial | Not played by hand; Chromebook speed with big floods not checked. Water and lava that are still spreading stop if you leave, and start again the next time you change a block beside them. Water doesn't yet prefer flowing toward the nearest drop (Java does) |

## Milestone 17, Part E: achievements, Journal, Creative, sounds (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21). Milestone 17 is now complete.
Code: `js/oceans-guide.js` (new: Journal tab "Oceans", 5 pages), `js/advancements.js` (new "Oceans" category, 16 achievements), `js/ui.js` (Journal tab, Creative "Oceans" tab `OCEAN_KIT`), `js/audio.js` (laser, trident, conduit sounds), `js/creatures.js`, `js/main.js`, `index.html` (tags `?v=ocean-e-1`, new import-map entry). Backups: `tools/backups/pre-m17-partE-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| 16 achievements | Done | New "Oceans" tab: Under the Sea, Reef Explorer, Soaked Up, Shipwrecked, X Marks the Spot, Heart of the Ocean, Full Power, The Deep Fortress, Laser Tag, The Elder Three, Fish to Go, Beach Babies, Shell Shocked, Sea Fork, Riding the Riptide, Follow the Splasher |
| Journal: "Oceans" | Done | 5 pages: the ocean floor, sunken treasure (with how to frame a Conduit), Ocean Monuments, sea creatures, tridents |
| Creative "Oceans" tab | Done | All 63 ocean blocks and items in one place |
| Sounds | Done | A Guardian's laser zap, a trident's whoosh, and a chime when a Conduit wakes up |
| Not yet checked | Partial | Not played by hand; Chromebook speed not checked |

## Milestone 17, Part D: ocean creatures, tridents, turtles, bubble columns (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/blocks.js` (Turtle Egg block 355, items 691–699 and 730–731, `FISH_BUCKETS`, recipe, pictures), `js/enchanting.js` (Loyalty, Riptide, Impaling, Channeling), `js/entities.js` (fish buckets, turtle eggs, scutes, Splashers leading to treasure, `treasureFor`, trident flight `tridentLanded`/`tridentHome`), `js/creatures.js` (Drowned tridents, turtle food, salmon drops), `js/main.js` (`throwTrident`, buckets of fish, salmon fishing, egg hatching, Turtle Shell, bubbles), `js/player.js` (`bubbleColumn`), `js/worldgen.js` (`wreckNear`), `js/shapes.js`, `index.html` (tags `?v=ocean-d-1`, creatures `ocean-d-2`). Backups: `tools/backups/pre-m17-partD-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Fish | Done | Blockhaven's Minnows, Sunfins and Puffers are its cod, tropical fish and pufferfish. Salmon now drop Raw Salmon (cook it: 6 food). Fishing catches about 60% Minnow, 25% Salmon, a few Sunfins and Puffers |
| Buckets of fish | Done | Right-click a Minnow, Salmon, Sunfin, Puffer, Axolotl or tadpole with a Water Bucket to scoop it up. Empty the bucket to let it out (with its water) |
| Sea turtles | Done | Feed two turtles Seagrass and one lays 1–4 Turtle Eggs on nearby sand. Eggs on sand crack in 3 steps (faster at night) and hatch into baby turtles. A baby drops a **Scute** when it grows up. 5 Scutes make a **Turtle Shell** helmet: 10 seconds of Water Breathing every time your head goes under |
| Tridents | Done | A strong weapon (9 damage). Hold right-click and let go to throw it (8 damage); it lands as an item you pick up. **Loyalty** brings it back to your hand. **Riptide** launches you through the water instead of throwing (only in water). **Impaling** adds damage against sea creatures. **Channeling** waits for thunderstorms (Blockhaven has no storms yet) |
| Drowned | Done | About 1 in 7 carry a trident (you can see it), throw it from 3–14 blocks away (8 damage), and drop it 1 time in 4. Drowned sometimes drop a Nautilus Shell |
| Splashers lead you to treasure | Done | Feed a Splasher a Minnow: it swims toward the nearest shipwreck, sunken ruin, or buried treasure, waiting for you to keep up, and says when you've arrived |
| Bubble columns | Done | Water above Wailing Sand pushes you up; water above Magma pulls you down. Little bubbles show you're in one |
| Not yet checked | Partial | Not played by hand. Bubble columns only push players (not creatures or boats). Turtles don't walk back to their home beach to lay eggs |

## Milestone 17, Part C: Ocean Monuments and Guardians (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/ocean-monument.js` (new: `monumentCell`, `ELDER_SPOTS`, `HALL`), `js/worldgen.js` (`MONUMENT_GEN = 19`, `monumentSite`, `monumentsNear`, `monuments`), `js/world.js` (`monumentOk`, `monumentAt`), `js/creatures.js` (Guardian and Elder Guardian behavior, drops, monument spawning), `js/creature-catalog.js` (Guardians only in monuments), `js/entities.js` (Elder Guardians and Guardians move in; laser color), `js/main.js` (Mining Fatigue), `js/ui.js`, `js/lost.js` (temple entrances keep clear of monuments), `index.html` (tags `?v=ocean-c-1`, new import-map entry). Backups: `tools/backups/pre-m17-partC-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Ocean Monuments | Done | A 56 × 56 prismarine fortress on the floor of big deep seas (about 10 in a 6,000 × 6,000 area; usually 900+ blocks from spawn). Two front wings, a pillared porch, a big hall with pillars and sea lanterns, a top chamber, two sponge rooms (ceilings of Wet Sponges), and a sealed gold vault (8 gold blocks in dark prismarine). It stands on a prismarine foundation |
| Guardians | Done | Spiky fish that guard monuments. They keep 6–12 blocks away and charge a laser for 3 seconds (the beam turns from purple to yellow), then hit for 6. They keep swimming back into the hall while you're inside (up to 6 near you). Drop 0–2 Prismarine Shards, and fish or Prismarine Crystals |
| Elder Guardians | Done | Three per monument (one in each wing, one in the top chamber); they stay for good. Bigger, slower, laser hits for 8. Every minute within 50 blocks they curse you with **Mining Fatigue** for 5 minutes (digging 10× slower). Drop a Wet Sponge plus prismarine |
| No more random Guardians | Done | Before, catalog Guardians (and even Elder Guardians) could appear in any deep water at night. Now they only live in monuments. Their spawn eggs still work |
| Which worlds get it | Done | New worlds (land version 19) everywhere. Worlds made at version 17 or 18 get a monument only if nobody had been anywhere on its spot when it's first reached (decided once and remembered). Checked: 16 million version-17/18 cells unchanged |
| Not yet checked | Partial | Not played by hand. Guardians' spike-thorns (hurting you back) aren't in yet. The laser is a thin line |

## Milestone 17, Part B: sunken treasure and the Conduit (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/worldgen.js` (`seaStructures`, `shipwreck`, `oceanRuin`, `treasureSpot`, `treasureNear`, `SEA_LOOT`), `js/main.js` (`seaLoot`, `giveTreasureMap`, `conduitTick`, Conduit Power), `js/blocks.js` (Conduit block 354, items 688–690, recipe, pictures), `js/shapes.js`, `js/starter.js` (treasure arrow), `js/ui.js`, `js/entities.js` (Wanderer sells shells), `index.html` (tags `?v=ocean-b-1`). Backups: `tools/backups/pre-m17-partB-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Shipwrecks | Done | About 1 in 45 sea chunks: a rotted wooden hull (oak, spruce, or dark oak) with a deck, a broken mast, a little cabin, and 3 chests: supplies (in the bow), treasure (in the hold), and a map chest (in the cabin) |
| Ocean ruins | Done | Broken stone-brick walls (sandstone in warm seas) on the sea floor, often with a chest: coal, gold nuggets, Nautilus Shells, sometimes a Treasure Map or an enchanted book |
| Buried treasure | Done | One spot at most in each 160 × 160 square, under a beach at the edge of a real sea, 1 block down. Always holds the **Heart of the Sea**, plus iron, gold, Jade, Skyshard, Blast Blocks, cooked fish |
| Treasure Maps | Done | From shipwreck map chests (and sometimes ruins). Hold one and the arrow at the top of the screen points to its X ("X marks the spot: dig down!" when you're on it). Maps never lead to treasure already dug up, and in worlds made with Milestone 20 only to land nobody had visited |
| Nautilus Shells | Done | Fishing treasure, ruin and shipwreck chests, and the Wanderer (5 Jade) |
| Conduit | Done | 8 Nautilus Shells + Heart of the Sea. Place it in water (it floats). Frame it with prismarine, prismarine bricks, dark prismarine or Sea Lanterns in three rings around it (up to 42 blocks). With 16+ frame blocks and water all around it, swimmers within 16 blocks per 7 frame blocks get **Conduit Power**: breathe underwater, see clearly, and dig at full speed. With all 42, it also zaps monsters swimming within 8 blocks |
| Which worlds get it | Done | New worlds everywhere; worlds made with Milestone 20 only in chunks nobody has visited (same rule as Part A). Checked again: version-17 and older land unchanged |
| Not yet checked | Partial | Not played by hand; the Conduit only shows a small spark, not Java's spinning eye |

## Milestone 17, Part A: the ocean floor (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/blocks.js` (blocks 313–353: kelp, seagrass, sea pickle, sponges, dried kelp block, prismarine ×3, sea lantern, blue ice, and 30 coral blocks from `CORALS`; items 685–687; `WATERY` table; 34 textures; recipes, smelting, fuel), `js/mesher.js` (water drawn around water plants), `js/player.js` (swimming through plants, Blue Ice), `js/entities.js` (creatures treat water plants as water), `js/shapes.js` (sea pickles), `js/worldgen.js` (`OCEAN_GEN = 18`, `seaFloor`, `warm_ocean`), `js/world.js` (version-17 worlds: untouched chunks only), `js/main.js` (placing, breaking, kelp growth, coral dying, `soakUp`), `js/starter.js`, `js/biomes-guide.js`, `js/advancements.js`, `index.html` (tags `?v=ocean-a-1`). Backups: `tools/backups/pre-m17-partA-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Water plants | Done | Kelp, seagrass, sea pickles, coral plants and coral fans are "water with a plant in it": you swim through them, they're drawn underwater, and breaking one leaves water. They can only be placed in water, on a solid block (kelp also on kelp) |
| Kelp | Done | Kelp forests in seas 5+ blocks deep. Placed kelp grows up toward the surface (up to 16 tall). Breaking kelp breaks everything above it. Cook it into Dried Kelp (food); 9 make a Dried Kelp Block (fuel, burns 2.5× as long as coal) |
| Seagrass | Done | Covers sandy sea floors. Drops only with Shears, like Java |
| Coral reefs | Done | New **Warm Ocean** biome (sunny, shallow seas). Tube, Brain, Bubble, Fire and Horn coral: blocks, plants and fans, plus dead versions. A coral block with nothing watery touching it turns dead within a few seconds; coral blocks drop their dead block (Silk Touch keeps them alive). Coral plants and fans drop only with Silk Touch |
| Sea pickles | Done | On reefs. Stack up to 4 in one spot; they glow brighter the more there are (light 6, 9, 12, 15) |
| Sponges | Done | A Sponge soaks up water up to 7 blocks away (at most 65 blocks) and becomes a Wet Sponge. Dry it in a furnace; in the Ember Depths it dries instantly. Sponges have no natural home until Ocean Monuments (Part C) |
| Prismarine and Sea Lanterns | Done | Prismarine (4 shards), Prismarine Bricks (9 shards), Dark Prismarine (8 shards + ink sac), Sea Lantern (4 shards + 5 crystals, light 15, drops 2–3 crystals). Shards and crystals come from Guardians in Part C; for now they're in Creative |
| Icebergs | Done | Now and then in frozen oceans: packed ice with a blue-ice heart and snow on top. Blue Ice (9 packed ice) is the slipperiest block |
| Which worlds get it | Done | New worlds (land version 18) everywhere. Worlds made with Milestone 20 (version 17) only in chunks nobody has visited or changed (remembered). Checked: 27 million version-17 cells and 19.8 million older cells come out exactly as before |
| Biomes | Done | Warm Ocean is on the Explorer's Map (teal), in the Biomes Journal page, and gives a "You found…" message. Seen It All now needs all 19 biomes |
| Not yet checked | Partial | Not played by hand; Chromebook speed in big reefs not checked |

## Grand Desert Temple: room to rise in new worlds (fixed and tested 2026-11-21, PUBLISHED 2026-11-21)
Code: `js/lost.js` (`monumentRoom`, a new step in `chooseSite`, clearer message), `index.html` (tag `?v=temple-room-1`). Backup: `tools/backups/pre-temple-room-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Temple spot | Done | When no mostly-desert spot is found, the pyramid's spot is now chosen with room for the whole temple (about 160 blocks across) instead of only 96 blocks from other landmarks. Before: about 1 in 16 new worlds lost the temple to a nearby landmark (5 of 80 test worlds). Now: 80 of 80. Worlds where the old spot already worked get exactly the same spot. Spots already chosen in saved worlds never move |
| Message | Done | If the temple still can't rise, the message only blames your own building or exploring when that's really why; otherwise it says another landmark stands too close |

## Milestone 20, Part E: biome creatures, map colors, achievements, Journal (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #30). Milestone 20 is now complete.
Code: `js/biomes-guide.js` (new), `js/world.js` (`biomeAt`, `caveBiomeAt`, `hasNewBiomes`), `js/entities.js` (biome animals, biome monsters), `js/creatures.js` (biome rules for the bestiary creatures), `js/starter.js` (map colors and key), `js/main.js` (`trackBiome`), `js/advancements.js`, `js/ui.js`, `index.html` (tags `?v=biomes-e-1`, new biomes-guide entry). Backups: `tools/backups/pre-m20-partE-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Biome animals | Done | Jungle: pandas, ocelots, parrots. Snowy Plains and Frozen Ocean: polar bears, rabbits, foxes. Taiga: wolves (Scouts), foxes. Savanna: horses, llamas, armadillos. Swamp: frogs. Badlands: armadillos. Cherry Grove: rabbits, sheep. Mushroom Fields: Mooshrooms. Seen in a test world (for example 10 Mooshrooms in the mushroom fields, 21 armadillos in the badlands, 5 pandas in the jungle) |
| Biome monsters | Done | Mushroom Fields never get monsters (like Java). Snowy biomes get Strays instead of Rattlers; swamps get slimes and Witches at night; dark forests get Witches. Axolotls, tadpoles and frogs can appear in swamp and lush-cave water |
| “You found…” | Done | The first visit to each new biome (and to lush or dripstone caves) shows a message. Your found biomes are saved with the world |
| Explorer's Map | Done | Every new biome has its own color, and the map's key lists them |
| 6 achievements | Done | Exploration tab: New Horizons (a new biome), World Traveler (10 biomes), Seen It All (all 18), Into the Deep (deep ocean), Glow in the Dark (lush cave), Watch Your Step (dripstone cave). All 6 unlocked in a test world |
| Journal: “Biomes” | Done | All 20 biomes and cave biomes, each with its map color, a block, what you'll find there, and a ✔ when you've found it, plus where you are now |
| Not yet checked | Partial | Not played by hand; Chromebook speed not checked |

## Milestone 20, Part D: lush caves and dripstone caves (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #30)
Code: `js/worldgen.js` (`caveBiome`, `caves`), `js/blocks.js` (blocks 305–312, Glow Berries item 684, 10 textures, light from ripe vines), `js/shapes.js`, `js/trees.js` (azalea tree), `js/main.js`, `index.html` (tags `?v=biomes-d-1`). Backups: `tools/backups/pre-m20-partD-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Lush caves | Done | About 1 in 5 stretches of cave: moss floors and ceilings, moss carpets, azaleas and flowering azaleas, cave vines hanging from the ceiling (some with glowing berries), spore blossoms. Seen in a test world |
| Dripstone caves | Done | About 1 in 5 stretches: dripstone floors and ceilings, stalactites hanging down and stalagmites pointing up (Pointed Dripstone, 1–3 long) |
| Where | Done | Caves under new worlds, and under the unexplored squares of older worlds (same rule as Part C). Older worlds' explored land is unchanged (8.8 million block cells compared) |
| Glow Berries | Done | Food (2). Right-click the underside of a block to plant cave vines; vines ripen (about a minute) and then give light 14; right-click a ripe vine to pick a berry. Vines sometimes grow longer. Breaking the block above makes the whole vine fall (tested) |
| Pointed Dripstone | Done | Placed on a ceiling it hangs down; on the floor it points up. Landing on one hurts much more than a normal fall (tested: 9 instead of 3). 4 make a Dripstone block |
| Moss and azaleas | Done | Bone Meal on moss spreads it over nearby stone and dirt, with carpets and azaleas on top (tested: 30 blocks). An azalea grows into a small tree with azalea leaves (Bone Meal or time). 2 moss blocks = 3 carpets |
| Not yet built | Missing | Axolotls and glow squid living in lush cave pools, dripping water: Part E |

## Milestone 20, Part C: nine new land biomes (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #30)
Code: `js/worldgen.js` (`landBiome`, `decorate`, `SPECIAL_BIOMES`, `BIOME_NAMES`), `js/world.js` (`biomeRegion`, `regions`), `js/trees.js` (giant mushrooms), `js/blocks.js` (blocks 281–304, items 680–683, 28 textures), `js/shapes.js`, `js/main.js`, `js/player.js` (slippery ice), `index.html` (tags `?v=biomes-c-1`). Backups: `tools/backups/pre-m20-partC-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Nine new biomes | Done | Taiga (spruce, berry bushes, snow in the coldest parts), Snowy Plains (snow cover, frozen water, a few spruces), Jungle (tall jungle trees with cocoa pods, bamboo, wild melons), Savanna (acacias, tall grass), Dark Forest (2 × 2 dark oaks, giant mushrooms), Swamp (mangroves on their roots, mud, lily pads), Badlands (red sand over colorful terracotta bands, cactus, dead bushes), Cherry Grove (cherry trees, pink petals), Mushroom Fields (mycelium, small and giant mushrooms). Plus Frozen Oceans, and cactus and dead bushes in deserts. Each was visited and its blocks counted in a test world; all 18 biomes appear within 1,200 blocks of spawn in 3 test seeds |
| How common | Done | In a new world: plains 12%, ocean 12%, taiga 9%, deep ocean 8%, snowy plains 8%, mountains 8%, jungle 7%, desert 6%, dark forest 4%, peaks 4%, savanna 4%, frozen ocean 3%, forest 3%, badlands 3%, mushroom fields 2.5%, cherry grove 2.4%, swamp 2.3%, birch 2% |
| Older worlds | Done | The world is split into 256 × 256 squares. A square gets the new biomes only if nobody has visited or changed any of it; that's decided once and saved with the world. Tested on a copy of an old world: the home squares stayed exactly the same, and an unexplored square 1,500 blocks out became snowy taiga. Land outside the new-biome squares is identical to before (18 million block cells compared) |
| Structures unchanged | Done | Biomes only change what's on the ground, never its height, and villages, strongholds and other structures are placed exactly as before |
| New blocks | Done | Snow Layer, Ice (breaks into water unless Silk Touch; slippery), Packed Ice (9 ice), Bamboo (grows up to 12 tall, about 2½ minutes; 2 bamboo = 1 stick; fuel), Cocoa (plant beans on the side of a Jungle Log; ripens in 3 sizes), Mud (use a Water Bottle on dirt), Lily Pad (goes on water; you can stand on it), Red Sand (smelts into glass), 7 Terracottas (clay blocks smelt into plain Terracotta), Cactus (hurts to touch; grows to 3 on sand; nothing may be next to it), Dead Bush (drops sticks), Mycelium, Brown and Red Mushrooms (Bone Meal grows a giant one), mushroom blocks and stems, Pink Petals |
| New food | Done | Cookies (2 wheat + 1 cocoa beans → 8), Bowls (3 planks → 4), Mushroom Stew (brown + red mushroom + bowl; you keep the bowl) |
| Not yet built | Missing | Biome creatures (pandas in jungles, polar bears in snow, mooshrooms…), achievements, Journal chapter, Explorer's Map biome colors: Part E. Lush and dripstone caves: done in Part D |
| Not yet checked | Partial | Not played by hand; Chromebook speed in dense jungles not checked |

## Milestone 20, Part B: six new woods (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #30)
Code: `js/trees.js` (new: the six tree shapes, reused by Part C's biomes), `js/blocks.js` (blocks numbered 256–280: the first ones past the old limit; 31 textures), `js/main.js` (growWood, leaf drops, sounds), `js/entities.js` (Wanderer trades), `index.html` (tags `?v=biomes-b-1` on blocks, main + script tag, entities, and the new trees entry). Backups: `tools/backups/pre-m20-partB-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Six woods | Done | Spruce, Jungle, Acacia, Dark Oak, Cherry (pink leaves), Mangrove: each has a log, leaves, planks, and a sapling (Mangrove's is a Propagule), plus Mangrove Roots. 25 new blocks, all in Creative |
| Tree shapes | Done | Spruce: a tall stepped cone. Jungle: tall and bare with a round crown. Acacia: leans to one side under a flat umbrella. Dark Oak: thick 2 × 2 trunk, wide dark crown (needs 4 saplings in a square, like Java; a single one won't grow, tested). Cherry: a wide pink cloud with blossoms hanging down. Mangrove: stands on arching roots. All six grown and looked at in a test world |
| Growing | Done | Plant saplings on grass or dirt; they grow like oak (a jungle tree took about 5 minutes in the test), and Bone Meal helps |
| Leaves | Done | Drop their own sapling (6%; jungle 2.5%, like Java); dark oak leaves also drop apples; shears keep the leaves; swords cut them fast; leafy sounds |
| Crafting | Done | Each log makes 4 planks; the new planks and logs work in every recipe that takes “any planks” or “any logs” (sticks, workbench, chests…). Logs cook into coal; logs and planks burn as fuel |
| Getting them | Partial | The Wanderer now sells all six saplings (so older worlds can grow them too). Forests of them in the wild come with Part C's biomes |
| Saving | Done | Grown trees (high-numbered blocks) survive save and reload |
| Not yet built | Missing | Doors, fences, slabs, stairs, and other building blocks for the new woods come with Milestone 21 (the building palette) |

## Milestone 20, Part A: real oceans and deep oceans (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #30)
Code: `js/worldgen.js` (`BIOME_GEN = 17` = land version 17, `Generator.oceanness`, ocean shaping in `column`, biomes `ocean` / `deep_ocean`, gravel deep-sea floors) and `index.html` (worldgen tag `?v=biomes-a-1`). Backups: `tools/backups/pre-m20-partA-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Oceans | Done | New worlds (land version 17) get wide seas: about 23% of the land in 5 test seeds, a tenth of it deep ocean. The sea floor goes down to about 20 blocks below sea level, with gentle hills; deep floors are mostly gravel. Squid and glow squid show up in them (seen in the test world) |
| Starting area and strongholds stay dry | Done | No sea within about 220–420 blocks of the world's middle, or within 200–330 blocks of each stronghold (so the Endwatch castles and Hollow portals are never flooded). Spawn was on dry land in all 5 test seeds; the nearest sea was 300–575 blocks away |
| Old worlds | Done | Only brand-new worlds get oceans, because oceans lower the land and older worlds already have structures planned on today's land. Checked: land versions 16, 15, 9 and 5 generate exactly as before (16 million block cells compared, no differences). (Part C's land biomes, which don't reshape the ground, are planned to reach unexplored land in older worlds too) |
| Structure placement | Done | The sea temple, Starter Home, villages, and adventure sites already check the ground height, so they stay on land (the sea temple can now use a real sea) |
| Not yet checked | Partial | Not played by hand; Chromebook frame rate over big seas not checked |

## The block-limit step: room for 1,024 kinds of blocks (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #30)
Code: `js/blocks.js` (`ID_MASK`, `ID_SPACE`, `NB()`, `idOf`, `metaOf`, bigger lookup tables, `isBlockItem`), `js/world.js` (chunk data becomes 32-bit as it loads), `js/mesher.js`, `js/worldgen.js`, and every other place that read a block number with `& 255` (`campaign-kit`, `citadel`, `echohold-atmosphere`, `desert-monument`, `forsaken`, `entities`, `multiplayer`, `redstone`, `maps`). Version tags `?v=blocks-1024-1`. Backups: `tools/backups/pre-block-limit-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| 1,024 kinds of blocks | Done | Was 256 (244 used). New block numbers: `NB(256)` and up (block 256 is stored as 65536, because its extra number bits sit above the block's 8 settings bits) |
| Old worlds unchanged | Done | Every existing block keeps its exact stored number, so saves need no converting. Checked: 2.9 million generated cells decode identically; a copy of an old land-version-9 world loads, draws, and keeps its changes |
| New high-numbered blocks | Done | A test block numbered 300 placed, drew, broke, and kept its number and setting through save and reload |
| Hand-built structures | Partial | Stamps and the packed adventure maps (Forsaken World, Lost Civilization, campaign towns) still use 16-bit storage, so they can only contain blocks 0–255 (all of today's blocks). Fine unless a future structure needs a new block |
| Note | — | The “500” error seen during local testing is the page-visit counter on the game page (an outside service, abacus.jasoncameron.dev, failing for the local “test” counter), not the game |

## Milestone 16, Part A: melons, the Cauldron, the Brewing Stand, and every drinkable potion (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #29)
Code: `js/potions.js` (new: every potion, its effects and times, the brewing recipes, potion pictures), plus `js/blocks.js` (blocks 240–243, items 654–664, 11 textures, 6 icons, 7 recipes), `js/shapes.js` (Brewing Stand and Cauldron models), `js/main.js`, `js/ui.js`, `js/entities.js` (Rabbit's Foot, trades, Invisibility), `js/player.js` (Slow Falling), `js/audio.js`, `js/multiplayer.js`, and `index.html` (styles; version tags `?v=brew-a-1` on blocks, main + script tag, ui, entities, shapes, multiplayer, audio, player, and the new potions entry). Backups: `tools/backups/pre-m16-partA-2026-11-21/`. Block numbers used: 244 of 256 (12 left). Recipes, times and strengths follow Java 1.20.1 (swaps are listed in MILESTONES-14-21-PLAN.md section 7).

| Feature | Status | Notes |
|---|---|---|
| Melons | Done | Melon Seeds (Farmer: 4 for 1 Jade; Wanderer; or 1 Melon Slice → 1 seed) grow on farmland into a stem; a full-grown stem keeps putting Melons on the dirt or grass beside it (first one took about 2½ minutes on wet farmland in the test). A Melon breaks into 3–7 slices (Silk Touch keeps it whole); 9 slices make a Melon. Slices are food. Farmers buy 4 slices for 1 Jade |
| New ingredients | Done | Sugar (1 Sugar Cane), Glistering Melon Slice (slice + 8 gold nuggets), Fermented Skitter Eye (Skitter Eye + Sugar + Ember Wart), Rabbit's Foot (Rabbits, 10%), Phantom Membrane (Phantoms, 0–1). Tested drop rates: 10% feet, about 0.45 membranes per Phantom |
| Water Bottles | Done | Right-click water with a Glass Bottle, or use a Cauldron. Drinking water puts out fire |
| Cauldron | Done | 7 iron ingots. Holds 3 bottles of water (you can see the water level). Water bucket fills it; an empty bucket takes a full one back; a bottle takes one; a water bottle adds one |
| Brewing Stand | Done | 1 Flare Rod + 3 cobblestone. 3 bottle slots, an ingredient slot, a Flare Powder slot (1 powder = 20 brews). A brew takes 20 seconds and changes all 3 bottles. Keeps brewing with the screen closed (like a furnace). Tested in a real world: Water → Awkward → Swiftness |
| Potions | Done | Awkward, Mundane, Thick, and 15 real potions: Night Vision, Invisibility, Leaping, Fire Resistance, Swiftness, Slowness, Turtle Master, Water Breathing, Healing, Harming, Poison, Regeneration, Strength, Weakness, Slow Falling. Sparkdust = longer, Shinestone dust = stronger (II), Fermented Skitter Eye = the opposite. Every recipe chain checked against Java |
| New effects | Done | Slowness, Weakness (−4 melee damage), Water Breathing, Invisibility (monsters only notice you up close; each armor piece gives you away a bit), Night Vision (bright; flickers in the last 10 s), Slow Falling (gentle fall, no fall damage), Instant Health and Instant Damage. All tested |
| Drinking | Done | Hold right-click 1.6 s, like food; you keep the bottle. Each potion has its own color and shimmers if it does something; tooltips show the effect and time (for example “Speed II (1:30)”) |
| Saving | Done | Potions, Brewing Stand contents and heat, and Cauldron water survive save and reload (tested) |
| Play Together | Partial | The Brewing Stand and Cauldron are host-only while playing together |
| Part B | Done | See the next section |
| Part C | Done | See the next section |
| Not yet checked | Partial | Not played by hand on a Chromebook; sounds not listened to; potion in the hand and dropped on the ground shows one plain blue bottle |

## Milestone 16, Part C: achievements, the Brewing guide, Creative potions, treasure, trades (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #29). Milestone 16 is now complete.
Code: `js/brewing-guide.js` (new), plus `js/advancements.js`, `js/main.js`, `js/ui.js`, `js/entities.js` (Cleric trades), `js/audio.js`, and `index.html` (all Milestone 16 files now `?v=brew-c-1`, plus a new brewing-guide import-map entry; advancements moved to `brew-c-1`). Backups: `tools/backups/pre-m16-partC-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| “Brewing” achievements tab | Done | 11 achievements: One in a Melon, Bottled Up, Local Brewery, First Sip, Strong Stuff (a level II potion), Bombs Away (throw a splash potion), You Need a Mint (bottle Wyrm's Breath), It Lingers, Sharp Shooter (tipped arrows), Mixed Bag (6 effects at once), Brewmaster (12 different potions). All 11 unlocked in a test world |
| Journal: “Brewing” chapter | Done | Four pages in our own words: Getting started, Every potion (a table of all 11 Awkward-potion recipes with ingredient icons, what each does, and whether it can be longer or II, plus the 4 Fermented Skitter Eye flips), Longer / stronger / throwable, Finding ingredients |
| Creative “Brewing” tab | Done | The Brewing Stand, Cauldron, and every ingredient, plus 123 ready-made potions (every potion, plain / longer / II, as a drink, splash, and lingering). Searching “All” finds potions too |
| Treasure and trades | Done | Ordinary treasure chests: a potion 18% of the time (some splash, some longer or II) and Melon Seeds 25%; Ember Depths chests: Fire Resistance 20%; Hollow chests: a potion 20%. Clerics now sell 3 Glass Bottles for 1 Jade and a Potion of Healing for 3 Jade. Tested: 60 fresh chests had 13 potions and 21 seed stacks |
| Ember Wart fix | Done | Ember Wart now plants on Wailing Sand (like Java) and grows (about 3 minutes to ripen). Before, it could only go on farmland and never grew |
| Drinking sound | Done | Potions gulp instead of crunching (checked it runs; not listened to) |
| Not yet checked | Partial | Not played by hand on a Chromebook; sounds not listened to |

## Milestone 16, Part B: splash and lingering potions, clouds, tipped arrows, Witches (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #29)
Code: `js/main.js` (throwPotion, potionBurst, potionOnCreature, potion clouds, Wyrm's Breath, tipped arrows from the bow, tipped-arrow crafting), `js/entities.js` (thrown potions breaking on blocks, creatures and you; creature effects `e.fx`; Slowness on creatures), `js/creatures.js` (Witches), `js/blocks.js` (items 665–679 tipped arrows + 15 recipes), `js/ui.js`, `js/audio.js`, and `index.html` (version tags `?v=brew-b-1`, creatures included). Backups: `tools/backups/pre-m16-partB-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Splash potions | Done | Brew any potion with Boom Powder. Right-click to throw it; it breaks where it lands and touches you and every creature within 4 blocks (weaker the farther away). Tested: Harming healed a zombie and hurt a cow 1 block away; a cow 6 blocks away was untouched |
| Lingering potions and Wyrm's Breath | Done | Hold a Glass Bottle in the Hollow Wyrm's purple breath clouds to bottle Wyrm's Breath. Brew a splash potion with it to make a lingering one. It leaves a colored cloud for 30 seconds that shrinks; anyone inside gets a short dose each second. Tested: a Poison cloud poisoned me and a cow, the zombie ignored it |
| Potions on creatures | Done | Creatures can be Poisoned, Regenerating, or Slowed (they walk at half speed); Healing and Harming work instantly. Undead creatures (zombies, Rattlers, and the like) are healed by Harming, hurt by Healing, and ignore Poison and Regeneration, like Java. Bosses aren't affected |
| Tipped arrows | Done | 8 arrows + 1 lingering potion at a workbench = 8 Arrows of that potion (15 kinds; it must be a lingering potion of the right kind). The bow uses your offhand arrows first, then the hotbar and pack. A hit gives the creature ⅛ of the potion (Slowness: 11 seconds, tested). Infinity only saves plain arrows, like Java |
| Witches | Done | Witches now throw real splash potions, choosing like Java: Slowness if you're far away, Poison if you aren't poisoned, sometimes Weakness, otherwise Harming. They throw every 3 seconds (was 2.5). They drop brewing things: bottles, sugar, Skitter eyes, Shinestone dust, Sparkdust, Boom Powder, or sticks |
| Sound | Done | Glass breaking when a potion bursts (checked it runs; not listened to) |
| Play Together | Partial | Throwing potions is host-only while playing together |
| Not yet checked | Partial | Not played by hand on a Chromebook. Witches are about as dangerous as before (Harming does 3 hearts); they can be deadly without armor, like Java's |

## Milestone 15, Part A: the Enchanting Table and every enchantment (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #29)
Code: `js/enchanting.js` (new: the enchantment list, what each goes on, the table's offers, armor math), plus changes in `js/blocks.js` (blocks 234–236, items 650–653, 4 textures), `js/main.js`, `js/entities.js`, `js/ui.js`, `js/shapes.js`, `js/worldgen.js` (land version 16), `js/world.js`, `js/multiplayer.js`, and `index.html` (styles; version tags are now `?v=ench-b-1`, see Part B). Backups of the changed files: `tools/backups/pre-m15-partA-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| Lapis Ore and Lapis | Done | Deep underground (levels 3–29), about 9 ore blocks per chunk. Needs a stone pickaxe. Drops 4–9 Lapis. In every world, old ones too: it only replaces buried stone, so nothing a player built or dug changes (a cave wall someone already saw could show a new ore) |
| Sugar Cane | Done | Land version 16: grows on sand, grass, or dirt right beside water at sea level, 1–3 tall. Older worlds get it only in land nobody has visited yet. Plant it next to water (or on more cane); planted cane grows up to 3 tall (about a minute per block). Breaking the bottom drops the whole stalk |
| Paper, Book, Bookshelf | Done | 3 Sugar Cane → 3 Paper; 3 Paper + 1 Leather → Book; **Bookshelf is now 6 planks + 3 Books** (was 3 leather), like Minecraft |
| Enchanting Table | Done | 4 Obsidian + 2 Skyshard + 1 Book (like Minecraft's diamonds; the plan said Lapis, but Java uses diamonds). ¾-height block with a floating book, gives off a little light. Put in one item and Lapis; 3 offers cost 1/2/3 levels and 1/2/3 Lapis; each shows one enchantment it gives (“?” = there are more). Creative: free |
| Bookshelf power | Done | Bookshelves 2 blocks away (a ring around the table, at its level and one up) with an empty block between. Up to 15. With 15 the bottom offer is always level 30 (tested: offers average 6 / 13 / 30) |
| Offers | Done | Java 1.20.1 rules: item “enchantability” by material, level ranges per enchantment, weights, bonus enchantments, books get one fewer. Offers stay the same until you enchant something. Tested over thousands of rolls: never two enchantments that clash, never a treasure enchantment, never one that doesn't fit |
| Shimmer and tooltips | Done | Enchanted items and Enchanted Books shimmer purple (in the inventory, hotbar, and chests; it stays still with “reduced motion”). Tooltips list the enchantments; curses are red; Enchanted Books also explain each one |
| Weapon enchantments | Done | Sharpness (+0.5 per level + 0.5), Smite and Bane of Arthropods (+2.5 per level against undead / spiders, bugs and scarabs), Knockback, Fire Aspect (4 s per level), Looting (+0–3 per drop), Sweeping Edge (hits creatures right next to the target). All tested on real hits |
| Tool enchantments | Done | Efficiency (much faster mining), Silk Touch (ores, glass, grass, leaves… drop themselves), Fortune (ore drops: Fortune III ≈ 2.4×), Unbreaking (III wears out 4× slower), Mending (picked-up experience repairs 2 uses per point) |
| Bow and fishing rod | Done | Power (V = 2.5× damage), Punch, Flame, Infinity (needs 1 arrow; arrows can't be picked up), Luck of the Sea (more treasure, less junk), Lure (bites come sooner) |
| Armor enchantments | Done | Protection, Fire / Blast / Projectile Protection, Feather Falling (Java math: each point takes 4% off, up to 80%; tested), Thorns (15% per level to hurt the attacker), Respiration (air lasts up to 4×), Aqua Affinity, Depth Strider (swim up to 2× faster) |
| Curses | Done | Curse of Binding (armor can't be taken off until it breaks or you faint) and Curse of Vanishing (gone when you faint, unless “keep inventory” is on). Both tested. They only come from treasure (Part B) |
| Frost Walker | Done | Finished in Part B (see below) |
| New Java rule: slow digging underwater | Done | Digging with your head underwater is 5× slower, like Minecraft. Aqua Affinity removes that |
| Experience from ores | Done | Coal, Lapis, Skyshard, Jade, Ember Quartz, Spark, and Ember Gold ores now give experience (Java amounts), so there are more ways to earn levels |
| Saving | Done | Enchantments stay on items in your pack, chests, dropped items, and hoppers, through save and reload (tested). Old worlds load fine (tested on a copy of a land-version-9 world) |
| Play Together | Partial | The Enchanting Table is host-only while playing together. Guests' enchanted weapons still deal the extra damage, but Fire Aspect, Looting and Sweeping Edge only work for the host |
| Part B | Done | See the next section |
| Part C | Done | See the next section |
| Not yet checked | Partial | Not played by hand on a Chromebook. Hits, mining, and the table were driven with test shortcuts in the built-in browser |

## Milestone 15, Part B: the Anvil, the Grindstone, and enchanted treasure (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #29)
Code: `js/enchanting.js` (anvilResult, grindResult, repair materials, treasure books, villagerBook), plus `js/blocks.js` (blocks 237–239, 7 textures, 2 icons, 2 recipes), `js/shapes.js` (Anvil and Grindstone models), `js/main.js`, `js/ui.js`, `js/entities.js` (trades), `js/multiplayer.js`, and `index.html` (styles; version tags `?v=ench-b-1` on blocks, main + script tag, ui, entities, worldgen, world, shapes, multiplayer, enchanting). Backups: `tools/backups/pre-m15-partB-2026-11-21/`. Block numbers used: 240 of 256 (16 left).

| Feature | Status | Notes |
|---|---|---|
| Anvil | Done | 3 Blocks of Iron + 4 iron ingots. Faces the way you place it. Left: the item. Right: its material (repairs a quarter per piece), the same item (joins them, +12% extra), or an Enchanted Book. A name box renames it (up to 30 letters; the name shows in tooltips). The result and its level cost show before you make it. Java prices: rarer enchantments cost more, books half; the same level twice makes the next level (III + III = IV, up to the max) |
| Anvil “prior work” | Done | Each trip through the Anvil adds to the next one's price (1, 3, 7, 15…). 40 levels or more: “Too expensive!” (Creative ignores it). The Grindstone resets it |
| Anvil wear | Done | 12% of uses: normal → chipped → badly damaged → breaks. The top shows the cracks. Never wears in Creative |
| Grindstone | Done | 2 sticks + 1 stone + 2 planks. Removes all enchantments except curses and gives experience back (Java's average amount, shown on the button). Enchanted Books become plain Books. Two of the same worn item join (+5% extra). Keeps an Anvil name |
| Enchanted treasure | Done | Ordinary treasure chests: Enchanted Book 25% (any enchantment, curses too), enchanted iron gear or bow 12%. Ember Depths treasure: book 15%, enchanted gold armor 18%. Hollow towers and ships: book 35%, enchanted Skyshard or iron gear (strong, level 20–39) 50%. Fishing treasure can be an Enchanted Book (no curses). Tested: 80 fresh chests gave 14 books (2 with a curse) and 12 enchanted items |
| Scribe trades | Done | The Scribe (our librarian; the plan called it “Scholar”) now also buys 24 Paper for 1 Jade, sells 2 Books for 1 Jade and 4 Lapis for 1 Jade, and sells one Enchanted Book for a Book + Jade. Each Scribe has its own book (decided by who they are, so it doesn't change); price 6–48 Jade by level (treasure ones like Mending cost double); never a curse |
| Wanderer trades | Done | The Wanderer sells one Enchanted Book (a little pricier) and 4 Sugar Cane |
| Frost Walker | Done | Boots with it freeze water around your feet (2 + level blocks) into Frosted Ice while you walk; it melts back in about 20 seconds (stays solid near you). Also stops Magma Blocks from hurting you, like Java |
| Play Together | Partial | The Anvil and the Grindstone are host-only while playing together |
| Not yet checked | Partial | Not played by hand on a Chromebook. Screens were clicked through with test scripts in the built-in browser. Anvils don't fall (no falling blocks until Milestone 18) |

## Milestone 15, Part C: achievements, the Enchanting guide, sounds, Creative books (built and browser-tested 2026-11-21, PUBLISHED 2026-11-21 via pull request #29). Milestone 15 is now complete.
Code: `js/enchanting-guide.js` (new), plus `js/advancements.js`, `js/audio.js`, `js/main.js`, `js/ui.js`, `js/enchanting.js`, and `index.html` (styles; every Milestone 15 file now has the version tag `?v=ench-c-1`, including new import-map entries for enchanting-guide, and advancements and audio moved to `ench-c-1`). Backups: `tools/backups/pre-m15-partC-2026-11-21/`.

| Feature | Status | Notes |
|---|---|---|
| “Enchanting” achievements tab | Done | 10 new achievements: Into the Blue (Lapis), Bookworm (a Book), Enchanter, Spellbook (an Enchanted Book), Max Power (a level 30 offer), Repair Shop (Anvil repair or combine), Name Brand (rename on an Anvil), Clean Slate (Grindstone), Decked Out (4 enchanted armor pieces), Ice Skater (Frost Walker on water). All 10 unlocked in a test world |
| Journal: “Enchanting” chapter | Done | Six pages in our own words: Getting started, The Enchanting Table (with a picture of the bookshelf ring), Every enchantment (a table of all 30: what each goes on, best level, what it does; curses in red), The Anvil, The Grindstone, Finding enchanted books |
| Sounds | Done | A magic chime when you enchant, a page turn when you open the table, a metal clang on the Anvil (a crash when it breaks), a stone rasp on the Grindstone, a soft crackle when Frost Walker ice forms. All made in code like the other sounds. Checked that they run without errors; not checked by ear |
| Creative “Enchanting” tab | Done | The table, bookshelves, Anvil, Grindstone, Lapis, sugar cane, paper, and books, plus a ready-made Enchanted Book for all 30 enchantments at their best level. Searching “All” (for example “protection”) finds the books too |
| Not yet checked | Partial | Not played by hand on a Chromebook; sounds not listened to |

## Starter Home + Explorer's Map (built, browser-tested, and published 2026-11-05)
| Feature | Status | Notes |
|---|---|---|
| Starter Home at spawn (Survival and Creative) | Done | `js/starter.js`. A 40×40 stamp (leveled plot to 15 blocks, blended to 20) applied last in `applyStamps`, so terrain, trees, ruins, and villages can't overwrite it. Site search avoids water, mountains, villages, ruins, strongholds, and landmarks. Cottage: stone foundation, plank walls, log frame, brick gable roof, chimney, windows, door, porch, lit path, flower beds, fenced garden with ripe wheat and carrots, bed, workbench, 2 furnaces, bookshelves, Expedition Table, 4 Shinestone lights, 2 signs |
| Four labeled supply chests | Done | Weapons & Armor (full Duskmetal set and tools, shield, bow, 256 arrows, golden apples, 2 totems), Food & Survival, Building Supplies, Adventure Gear. Filled once (`story.starter.granted`); never refilled |
| Explorer's Map (item 563) | Done | In the hotbar at start. M opens (or right-click it), N toggles the on-screen waypoint. Terrain from the land generator, icons + legend, you-arrow, zoom, drag, off-map arrow, dashed direction line (labeled "not a path"), honest travel notes (water / mountains on the line), approach guides (Echohold's lift; the sea temple's boat launch on the shore) |
| Landmarks always within reach | Done | `ADVENTURE = { near: 160, far: 720 }` in lost.js. Natural spot first, then a looser match, then (sea only) a carved bay of real water (`carveLake` in worldgen), then the old wide search. 7 seeds tested: all four within ~580 blocks; markers match the real lift blocks |
| New blocks 206–208 | Done | Wooden Sign (read/write, model shape), Bookshelf, Expedition Table (gives a spare map only if you have none) |
| Saving, no duplicates | Done | Reload, death, mode switch tested. Old worlds: one-time migration builds the house only in never-visited, unmodified chunks and doesn't move spawn |
| Limitations | Partial | No enchantments, ladders, scaffolding, or water-breathing potions exist in the game, so the chests use the best working items instead. No multiplayer. Movement still needs a keyboard |

## Milestone 13: Blockhaven: The Legacy Campaign. Parts A + B (built, browser-tested, and published 2026-11-05)
Plan and decisions: `MILESTONE-13-CAMPAIGN.md`. Code: `js/campaign.js` (engine), `js/campaign-data.js` (story, quests, people, loot), `js/campaign-village.js` (Legacy Village builder). Progress is saved in the world's story (`story.campaign`); campaign worlds have `meta.campaign`.

| Feature | Status | Notes |
|---|---|---|
| Legacy Campaign menu | Done | Gold "⚔️ Legacy Campaign" button on the title screen. Its own screen lists campaign saves (chapter, quests done, current quest) with Continue / Download / Delete, and starts new ones (save name, difficulty, keep items). Campaign saves don't show in "Your worlds", and ordinary worlds are untouched |
| The Forgotten Kingdoms | Done | Fixed seed `the-forgotten-kingdoms`, so every campaign has the same land; monsters don't break blocks. Still a full sandbox. Temples and the Keeper excavation are placed well away from the village |
| Legacy Village | Done | 160 × 160 blocks, built when the world opens (like the Starter Home), leveled and sloped into the land. Fountain plaza (spawn), floating BLOCKHAVEN letters over the castle, Castle Legacy (curtain walls, gatehouse, 4 climbable corner towers, two knight statues, a keep with Great Hall + throne, royal chambers, a roof with a dome), walls with 3 gates and 4 climbable watchtowers, canal with 4 bridges, blacksmith, library, enchanting tower, barn + pen with animals, farm, 6 homes, stable with 3 Trotters, fishing pond + dock + hut, training arena, Old Mine (stairs to a chamber with ores), tutorial grove, crafting pavilion, market stalls, lamp posts. 16 supply chests (early-game items only), 18 signs |
| Secrets | Done | The King's Vault (break the bookshelf beside the throne) and the Forgotten Archive (trapdoor in the library). A walk check confirms every tower top, upper floor, the mine, and both secrets can be reached on foot (25 of 25 at 3 ground heights) |
| People | Done | 9 named villagers (Elder Maren, Smith Garrick, Librarian Odessa, Farmer Hollis, Captain Rowan, Stablemaster Wren, Fisher Juno, Miner Brock, Merchant Pell). Right-click talks (dialogue changes with the story, Trade button); they can't be hurt; they move in once, when their part of the village first loads |
| Quests | Done | Quest engine with automatic steps (talk, visit, walk, break, craft, open a screen, eat, defeat, trade, carry, visit several, story flags). Chapter 1 so far: A Traveler Arrives → Lessons of the Builder (13-step skippable tutorial) → The Legacy Village → Iron and Fire → The Broken Watchtower (ends at "coming in the next update"), plus side quests Secrets of Legacy and A View From Above. Rewards: XP and items |
| Journal + tracker | Done | J journal opens on a new Campaign tab: chapter, current quests with ✔/▶ steps, 8 relic slots, all 8 chapters (locked ones show 🔒), places found, finished quests, options (hide tracker, skip lessons, reread the story). The current objective shows at the top of the screen with distance and direction |
| Presentation | Done | Chapter title card, the story intro, "Discovered" pop-ups, quest toasts with sounds. The Explorer's Map calls the village "Legacy Village" |
| Saving | Done | Save/reload tested: people appear once, chests never refill, progress is kept |
| Next | Missing | See Parts C + D below, then Chapters 4–8 |

## Milestone 13, Parts C + D: Waystones and Chapters 1–3 (built, browser-tested, and published 2026-11-05)
New code: `js/campaign-kit.js` (building helpers, quarter-turn rotation), `js/campaign-towns.js` (all new places), `js/campaign-bosses.js` (the four fights); `js/campaign.js` now handles many places across dimensions. New blocks 209 Waystone, 210 Rune Stone; items 564–571 (three Relics, Ancient Key, Ancient Desert Map, Ancient Ocean Map, Expedition Map, Tide Charm). The temple maps (`MapGen`) accept extra stamps, used only in campaign worlds.

| Feature | Status | Notes |
|---|---|---|
| Waystones | Done | One in Legacy Village, Stonehaven, the Ruined Watchtower, Sandspire, Oakwood, and Seabreak. Right-click to remember it, then pick any remembered Waystone to travel there (land loads first, you arrive beside the stone). Not during a boss fight or the raid |
| Places (chosen once per world, in land nobody visited) | Done | Stonehaven (walled kingdom: castle + keep with throne, upstairs and roof, 4 towers, plaza well, 4 shops, barracks, 6 homes, inn, farm), the Ruined Watchtower + Old Watch Mine (stairs down to the Hall of the Guardian), Sandspire (sandstone walls, oasis, Sun Palace with golden dome, the tall Sandspire to climb, bazaar, homes), Oakwood (4 giant trees with spiral stairs, treehouses, walkways between them, stream, explorers' camp, cabins), Seabreak (harbor turned to face the real water, 3 piers, a docked ship, lighthouse, harbor office, homes), 3 jungle ruins (Overgrown Shrine, Abandoned Village, Vine Pillars; one Ancient Key each), and a shipwreck. Explorer's Map lists the towns (gold banners) |
| Boss chambers | Done | Behind each temple's relic pedestal, a passage leads to a new chamber: the Pharaoh's Throne Room (desert), the Titan's Grove (jungle, behind the Root Seal that takes 3 Ancient Keys), the Leviathan's Grotto (sea: a deep pool ringed by stone, air everywhere). The existing temples, puzzles, guardians, and relics are unchanged |
| Bosses | Done | Ancient Stone Guardian (slam, falling boulders, cave skitters), Desert Pharaoh (sand bolts, sandstorm, teleports between sarcophagi, calls Rattlers), Jungle Titan (ground slam, falling stones, poison spores, vine pull + slam, enraged phase), Ocean Leviathan (circles underwater where swords can't reach it, surfaces beside you to bite, tidal wave ring with gaps, whirlpool, shockwaves, calls Tidecrabs). Same fair rules as the temple guardians: attacks glow first; phase 2 shield broken by the arena's 3 Rune Stones; phase 3 faster with helpers; leaving or fainting resets. Boss bar shows phase/shield/underwater |
| Quests | Done | Chapter 1: The Broken Watchtower → Footprints of Stone → Defend Stonehaven (3-wave raid) → The Guardian Below → Road to Sandspire → The Sunken Pyramid (temple, Solar Colossus, Solar Seal, Pharaoh) → Relic of Earth. Chapter 2: Into the Green → Three Ancient Keys → The Lost Jungle (Colossus, Lens, Root Seal, Titan) → Relic of Nature. Chapter 3: The Harbor at World's Edge (Tide Charm) → The Sunken Ship → Secrets Beneath the Sea (Regent, Tidal Heart, Leviathan) → Relic of the Tides. Then "Chapter 4 arrives in the next update". Side quests: Top of the World, Life in the Treetops. Steps already done earlier (a temple you already finished) count right away |
| People | Done | 16 new named characters with dialogue that follows the story (King Aldric, Captain Brenna, Elder Rasha, Explorer Fenn, Captain Mira, and more) |
| Tide Charm | Done | Carry it and your air never runs out |
| Old campaign saves | Done | A save waiting at "coming in the next update" continues straight to "Travel the road to Stonehaven" |
| Checks | Done | Walk check: every tower top, upper floor, treehouse, pier, ship deck, chest, and arena reachable (Seabreak in all 4 turns; the Root Seal blocks the way until opened); the real temple maps connect to their chambers. All 4 fights played through to victory with the right rewards. Raid: 3 waves then victory. Waystone travel. Save/reload. The full quest chain 1–3 |
| Explorer's Map fix | Done | It had refused to open in campaign worlds ("no Starter Home"); fixed |

## Milestone 13, Part E: Chapters 4–6 (built and browser-tested 2026-11-06, not published)
New code: `js/campaign-towns2.js` (Ironhold + the Deep Mine, the Blight Citadel, the Ember Outpost, the Dragon Seal shrines, Hollowmere). Changed: `campaign.js`, `campaign-data.js`, `campaign-bosses.js` (the Blight Tempest fight), `entities.js` (Blight Tempest species, model, animation), `blocks.js` (items 572–575), `worldgen.js` (the Ember Depths accept stamps), `main.js` (shrines stamped in, Cindermaw hook), `forsaken.js` (Herobrine hook). Items: 572 Relic of Decay, 573 Relic of Flame, 574 Relic of Shadows, 575 Dragon Seal; the campaign's Tide Charm is now `CP_CHARM` (571).

| Feature | Status | Notes |
|---|---|---|
| Chapter 4: The Curse of the Blightking | Done | Black Stone → The Corrupted Mines → The Curse of the Blightking. Ironhold: walled mining town under Mount Ferrum (iron/coal veins), Anvil Square, Forge Hall, Mine Head, homes, healer, guard post, Waystone. The Deep Mine: stairs down to a timbered hall and three blight-corrupted galleries (Blackstone, Wailing Sand, Blight Rattlers), a Blight Skull in each. The Blight Citadel: open-sky courtyard with a broken ring wall, 4 towers, a Wailing Sand altar; placing the 3 skulls wakes the real Blightking. Side quest: Ironhold Iron |
| The Blight Tempest | Done | Original giant final form (about 11 blocks tall), drawn from the "Legacy Campaign Legends" bestiary sheet: cracked blight-stained stone, the Blightking's crown, block fists, no legs, rings of rusty rubble spinning around it. Rises only after the Blightking falls in his citadel. Attacks (all glow first): falling chunks of land, pull-in then slam, a ring of blight with two gaps, a stream of debris. Phase 2 shield broken by 3 Rune Stones; phase 3 faster with Blight Rattlers. Rewards: Relic of Decay, Radiant Star, golden apples |
| Chapter 5: Dragon of the Embers | Done | Fire Beneath the World → Three Dragon Seals → Dragon of the Embers. Ember Outpost: camp with an unlit obsidian portal frame (Flint and Steel + gold helmet in the chests), Waystone. Three Dragon Seal shrines carved into Ember Depths caverns (4 lit tunnels each, guards, lore), chosen once between the arrival area and the Cinder Citadel. The 3 seals fuse into a Cinder Eye (no Hollow Wyrm needed). Beating Cindermaw (its own fight and victory scene) adds the Relic of Flame |
| Chapter 6: The Shadow of Herobrine | Done | Whispers in the Fog → The Shadow of Herobrine. Hollowmere: fog village with abandoned cottages, dead trees, the Meeting Hall, the Old Well, Ilsa's house, Dr. Vell's observatory on a hill (journal signs, the Pale Lantern in her cabinet), Waystone. Banishing Herobrine in the Forsaken World (its own adventure) adds the Relic of Shadows. Then "Chapter 7 arrives in the next update" |
| New quest step | Done | "dim": enter a dimension. Quest rewards can take items back (the seals) |
| Quest marker | Done | Points to the outpost's portal for Ember Depths steps on the Surface, to the next unvisited shrine, and to the Cinder Citadel |
| People | Done | 7 new characters: Forgemaster Hilda, Miner Dag, Healer Rue, Captain Orrin, Expedition Leader Sable, Scholar Quill, Watcher Ilsa |
| Old campaign saves | Done | A save waiting at "Chapter 4 arrives in the next update" continues straight to "Black Stone". Chapter 1–3 places stay exactly where they were |
| Bug fix | Done | The Sea Temple's Tidecaller Charm (553) had been replaced by the campaign's Tide Charm (both used the name TIDE_CHARM). Both items exist again |
| Checks | Done | Walk check for every new place (all 3 galleries, citadel altar and runes, outpost portal, observatory, shrine altar and tunnels). Full chain 4–6 played through in a test world: dialogue at each step, skulls → Blightking → Tempest → relic, save/reload mid-chapter, portal lit and crossed, 3 seals → Cinder Eye, Cindermaw and Herobrine rewards. 408 item icons and the Creative inventory open without errors |

## Milestone 13: Chapter select + "The Whole Story" (built, browser-tested, and published 2026-11-06)
Mr. Watford's request: let players pick any chapter, whatever their save says, so the story doesn't have to take a long time, while still rewarding anyone who plays all the way through. Changed: `campaign.js`, `campaign-data.js`, `advancements.js`, `ui.js`, `index.html`

| Feature | Status | Notes |
|---|---|---|
| Start at any chapter | Done | New "Start at" choice on the new-campaign screen (Chapters 1–6). Starting later gives the gear the earlier quests would have given, their Relics, and the Tide Charm |
| Chapter select in the journal | Done | Journal (J) → Campaign → Chapters: a Play button on every chapter (Restart on the current one), with a confirm box that explains what changes. Chapters 7–8 say "coming soon". Not allowed during a boss fight or the Stonehaven raid |
| Jumping ahead | Done | Earlier main quests count as finished; their rewards are given only once per save (jumping back and forth can't farm them); their side quests open |
| Jumping back | Done | Main quests, bosses, and Relics from that chapter on are reset, so those bosses can be fought again (Cindermaw and Herobrine through their own rematches). Used-up quest items come back (Blight Skulls, Dragon Seals, the Ocean Map, the Pale Lantern). Places found and the open Root Seal stay, so those steps finish on their own |
| The Whole Story | Done | New "Legacy Campaign" achievements tab: A Legend Begins (beat a chapter boss) and The Whole Story (Chapter 1 to the end of Chapter 6 with no skipping, 500 XP). Choosing Chapter 1 starts a fresh run. The journal shows whether the run is still on track; the campaign list shows 🏆. Older saves that already finished Chapter 6 without skipping get it automatically |
| Fix | Done | Boss Relics aren't given twice if you already carry that Relic |

## Milestone 13 Part F: Chapter 7, The Ancient City (built and browser-tested 2026-11-12, not published)
The story now runs through Echohold. Changed: `js/campaign-data.js` (3 quests + a Chapter 8 placeholder, Relic reward), `js/campaign.js` (Echohold steps, quest marker, Elder Maren's lines, chapter select, old saves), `js/lost.js` (the Sovereign hands over the Relic; `L.goal()` shared by the Survey Map and the quest marker), `js/blocks.js` (item 614 Relic of the Abyss), `js/main.js` (story items always fit in the pack), `index.html` (Chapter 7 in "Start at"; version tags `?v=campaign-7`). Backups: `tools/backups/pre-campaign-ch7-2026-11-12/`.

| Feature | Status | Notes |
|---|---|---|
| The City That Listens | Done | Show the Relic of Shadows to Elder Maren (she tells of Echohold and points to the Keeper dig site), then ride the Keeper lift into the Deep |
| The First Warden | Done | Reach the city, then defeat the First Warden in the Citadel (Echohold's own fight, unchanged) |
| Beyond the First Gate | Done | Set the three temple relics and the Resonance Core in the First Gate and open it, cross to the Echo Expanse, quiet the three forge anchors, and calm the Resonant Sovereign. Reward: the seventh Relic, the Relic of the Abyss, with a note that shows the way to Chapter 8 |
| Quest marker | Done | On the Surface it points to the Keeper excavation; in the Deep and the Expanse it points where the Survey Map does |
| Chapter select | Done | "Start at" and the journal now offer Chapter 7. Starting at Chapter 4 or later also gives the Solar Seal, Verdant Lens, and Tidal Heart if the save never took them. Replaying Chapter 7 lets the Warden and the Sovereign be fought again (the gate stays open) |
| Old saves | Done | A save waiting at "Chapter 7 arrives in the next update" continues straight into Chapter 7. Chapter 8 now shows "coming soon" |
| Full pack fix | Done | Story items (Relics, keys, the Warden's core, the Cinder Eye) always go into the pack: if it's full, the last ordinary stack drops at your feet instead, with a message. (A Chapter 7 start fills all 36 slots, so the Warden's core and the Relic had been landing on the floor) |

Tested in a throwaway campaign world (started at Chapter 7; deleted afterward): every step advances, the Relic arrives with a full pack, the chapter card for Chapter 8 shows, replaying Chapter 7 resets its two bosses and takes the 7th Relic back, an old save at the placeholder moves into Chapter 7 after save + reload, an ordinary Survival world still loads, and every item icon draws. Not tested by playing the real fights again (they are Echohold's own, unchanged). Still needed: a Chromebook test.

## Milestone 13 Part G: Chapter 8, The End of the First Builders (built and browser-tested 2026-11-12, not published)
The finale, with Mr. Watford's choices: all three stops, a choice of endings (set the King free or banish him), and credits reading "Created by Mr. Watford". Boss looks come from the "Chapter 8 Concepts" bestiary sheet (Blockhaven D). New: `js/campaign-towns3.js` (Skyreach, the Ruined Capital). Changed: `campaign.js`, `campaign-data.js`, `campaign-bosses.js`, `entities.js` (two boss models; warning-only floor glows don't hurt; `grow` scale), `main.js` (the Hollow Wyrm gives the Relic of the Void in campaigns instead of a Cinder Eye), `blocks.js` (items 615 Relic of the Void, 616 Crown Key), `advancements.js`, `index.html` (`?v=campaign-8`, new import-map entry, Chapter 8 in "Start at"). Backups: `tools/backups/pre-campaign-ch8-2026-11-12/`.

| Feature | Status | Notes |
|---|---|---|
| The Last Relic | Done | Elder Maren hands over 14 Eyes of the Void; the marker points to the nearest stronghold; jump into the Hollow |
| Beyond the World's Edge | Done | Defeat the Hollow Wyrm for the eighth Relic. If the Wyrm was beaten before (or Chapter 8 is replayed), it returns for the story |
| Skyreach | Done | A floating island city about 26 blocks up: the Sky Stair tower and bridge, the Relic Forge (Keeper Solenne, 8 pedestals), Sky Gardens, houses, drifting islets, two Waystones (landing and island) |
| The Sky Sovereign | Done | White marble and gold, blue core, halo, wing slabs. Lightning, gust + feather line, a dive (it lands: strike then), storm ring with gaps; Rune Stone shield; skeletons in phase 3. Reward: the Crown Key |
| The Ruined Capital | Done | 128-block ruined city: the kingdoms' camp (Captain Brenna, Forgemaster Hilda, Sable, supply chest, armory), the Grand Avenue with statues and banners, ruined houses, the Gate of Eight (8 pedestals, Rune Stone), sealed Throne Court, tall broken spires |
| The Forgotten King | Done | 4 phases. 1: sweep, slam, crown bolts, charge. 2 "Echoes of the Fallen": shield + 3 Rune Stones, the Pharaoh's sand bolt, the Leviathan's tidal ring, the Tempest's falling earth. 3 "The Hollow Crown": steps between pillars, void bolts, crumbling edge. 4 "The Last Stand": grows, 8 Relic glyphs circle him, Void Waves (only the golden Relic Light is safe), full damage only while he staggers |
| The final choice | Done | Set him free (he becomes King Elarion again and fades in golden light) or banish him into the Void. Each has its own scene and celebration text. If the game closes before choosing, the choice comes back on reload |
| Homecoming + credits | Done | Walk into Legacy Village's Fountain Plaza: fireworks, the celebration note, scrolling credits (ending, "Created by Mr. Watford", chapters, Relics, legends, people, footer). Replay the credits from the journal |
| Chapter select | Done | Chapter 8 in "Start at" and the journal. A new save that starts later puts on its best armor and drops outgrown starter tools (a Chapter 8 start had filled the whole pack). Replaying Chapter 8 resets its bosses and the Eyes; the opened Gate of Eight stays open |
| Achievements | Done | Above the Clouds, The Forgotten King, The King Set Free, The King Banished, Both Sides of the Story. The Whole Story now means Chapter 1 to the homecoming. A Legend Begins also counts the Chapter 7–8 Relic bosses |
| Old saves | Done | A save waiting at "Chapter 8 arrives in the next update" continues into Chapter 8 |

Tested in a throwaway campaign world started at Chapter 8 (deleted afterward): every quest step, the Hollow trip and Wyrm reward, Skyreach (stair-to-island walk path checked block by block), the Sky Sovereign's 4 attacks + shield + reward, the camp, the Gate of Eight (refuses without the key), all 4 King phases (Relic Light protects, outside hurts, stagger gives full damage), both endings, homecoming + credits, achievements, Chapter 8 replay, save + reload. Also a fresh Chapter 7 start and an ordinary Survival world. Fights were driven with test shortcuts (damage applied directly), not played by hand; not yet tested on a Chromebook.

## Creature art from the bestiary (2026-11-06)
Mr. Watford's bestiary sheets (Blockhaven A–G). Pass 1 (Codex, published 2026-11-06): 27 creatures (Surface monsters, temple and Echohold creatures). Pass 2 (`applyBestiaryPass2` in `js/entities.js`, built and browser-tested 2026-11-06, not published): 24 more, plus the Blight Tempest, all with the same soft face shading. Colors and materials follow the sheets; faces and details are Blockhaven's own (no copied Minecraft faces).

| Group | Creatures | Notes |
|---|---|---|
| Ember Depths | Flare, Wailer, Boarkin, Boarkin Brute, Rotboar, Hogbeast, Magma Gloop, Lavastrider, Sheller | Charcoal blocks split by glowing lava seams; a sorrowful pale Wailer with glowing tear trails; Boarkin in leather with gold buckles, the Brute in iron shoulder plates and a red sash, the mossy Rotboar (all three now have tusks); the Hogbeast's dark hide, black spike ridge, and big ivory tusks; the Lavastrider's ember crust and flame whiskers; the Sheller's carved square spiral |
| Wildlife | Scout, Whisker, Trotter, Minnow, Puffer, Inkling, Splasher, Pouncer, Buzzer | Grey wolf with a dark saddle, red collar, and golden tag; orange tabby with stripes and whiskers; chestnut Trotter with a white blaze, pinto patches, and a saddle buckle; silver Minnow; spiky Puffer; indigo Inkling with pale eyes; two-tone Splasher; Pouncer with a white chest and white-tipped tail; Buzzer with bands, antennae, and frosted wings |
| Legends | Blightking, Cindermaw, Pale Sentinel, Hollow Wyrm, Blight Rattler, Resonant Sovereign | Three dark skulls with green-lit eyes and a crown; Cindermaw's ember scales, glowing underbelly, and fiery wings; the Sentinel's torn pale cloth; the Wyrm's glowing violet spots; the Rattler's tattered olive cloak; the Sovereign's navy robe with gold trim and crystal crown |
| Not changed | Sunfin and Chatterbird (their color variants stay), villagers (the sheet copies Minecraft's villager), farm animals (no Blockhaven sheet), Herobrine | |
| Checks | Done | Every creature in the game builds its model with no errors; before/after photos of all three groups |

## Play Together, Stage 1 (built, browser-tested, and published 2026-11-11)
Multiplayer with no logins: a host shares a room code, friends join. Plan and decisions: `MULTIPLAYER-PLAN.md`. Relay server: `blockhaven-relay/` at the site root (Cloudflare Worker + one Durable Object per room). Local testing: run the "blockhaven-relay" launch config and open the game with `?relay=ws://localhost:8787/ws`.

| Feature | Status | Notes |
|---|---|---|
| Host a Creative world from the pause menu (👥 Play Together) | Done | Gets a room code like SUN-DOLPHIN-95. Not allowed in Survival (for now), Hardcore, Campaign, or away from the Surface; hosting stops with a message if any of those change |
| Join from the title screen with a room code | Done | Typing "sun dolphin 95" works too. Shows "Asking the host to let you in…" |
| Host approves each join | Done | Banner while playing: press **Y** to let them in, or Let in / Say no on the Play Together screen |
| Remove (kick), lock the room, stop hosting, max 6 players | Done | The relay enforces lock, room size, and kicks. Rooms close after 4 hours |
| Random kid-safe names (🎲 New name), no chat | Done | The relay only accepts names made from the word lists (`js/mp-words.js` must match `blockhaven-relay/src/words.js`) |
| Guests get the host's world | Done | Seed + changes + story building plans, gzipped. Same land checked: 49 chunks identical on host and guest |
| See each other move (skins + name tags) | Done | About 10 updates a second, only when moving, smoothed |
| Host's building shows up for guests live | Done | Host block changes are sent 10 times a second |
| Guests never save the host's world | Done | Checked after leaving, being removed, and the host stopping (a bug that saved a "(visiting)" copy was found and fixed) |
| Host's pause menu doesn't freeze friends | Done | The world keeps running while the host is in the menu |
| Version check, wrong code, bad name, code already in use | Done | Each gets a plain-language message |
| Guests building, creatures for guests, Survival together, portals | Missing | Stages 2–4. Guests see no creatures yet; portals are off while connected (building: see Stage 2 below) |
| Host switches tabs → "The host's game is paused" banner for guests | Partial | Built but not tested (the test browser can't fake a hidden tab) |
| Class-time off switch | Partial | Built in the relay (`CLOSED_HOURS` in wrangler.toml), empty until Mr. Watford picks the hours |

## Play Together, Stage 2: building together (built, browser-tested, and published 2026-11-11)
Protocol 2 (a Stage 1 game and a Stage 2 game are told to refresh). Import-map version `together-2` for main.js and multiplayer.js.

| Feature | Status | Notes |
|---|---|---|
| Guests break and place blocks | Done | The guest's game sends its block changes; the host's game checks each one and makes it happen (breaking runs the host's full break, so doors, chests spilling, and story pieces behave the same). Tested: guest stone, glass, and a broken ground block all landed in the host's world and save; 25 chunks identical afterward |
| Host refuses some changes and puts them back | Done | More than 9 blocks from the guest, bedrock/gateways/quest blocks (hardness Infinity), fire, portals, protected Solkara landmark chests and signs. Tested: far block and bedrock were undone; fire was refused |
| Redstone a guest builds runs | Done | Tested: a guest's lever lit a Spark Lamp in the host's world, and both saw it lit |
| Chests through the host, one person at a time | Done | Tested: guest opened the host's chest with its real contents, moved apples, the host saw it live, and the host was told "Speedy Salmon is using that right now." Closing frees it. Loot chests fill on the host |
| Furnaces through the host | Done | The host's furnace keeps cooking; the guest using it sees updates twice a second. Tested: guest's ore cooked into output |
| Machines, beacons, beds, story pieces | Partial | Host only while playing together ("Only the host can use that while playing together.") |
| Signs | Done (safety) | The host's sign writing isn't sent to guests, and guests can't write signs while visiting: nothing a student typed reaches another student |
| Quick messages (T, then 1–6) with a speech bubble | Done | Follow me!, Over here!, Nice build!, Help!, Thanks!, Be right back. Toast plus a bubble over the player for 5 s. One message per 1.5 s. The 1–6 keys don't change the hotbar while the menu is open |
| A guest's backpack is kept on their own computer | Done | localStorage `blockhaven-mp-pack:<host world id>`, saved every 30 s and on leaving. Tested: leave and rejoin brought the same items back |
| Guests never save the host's world | Done | Still true after Stage 2 (checked again) |
| A visited world's name | Done | Shows the host's random name ("Noble Hamster's world"), not the world name the host typed |
| Single-player regression | Done | A new Survival world still breaks with drops, opens chests, and saves |
| Two guests editing the same block at the same moment | Partial | The host's world decides; everyone gets the host's result. Not tested with three players |

## Play Together, Stage 3: Survival together (built, browser-tested, and published 2026-11-12)
Protocol 3 (older Play Together games are told to refresh). Import-map version `together-3` for main.js, multiplayer.js, and entities.js. The relay didn't change.

| Feature | Status | Notes |
|---|---|---|
| Host a Survival world | Done | Creative-only rule removed. Hardcore and the Campaign still stay single-player. Guests play in the host's mode and follow mode changes |
| Creatures notice every player | Done | `Entities.pick`: each creature (and each arrow or fireball) looks after the nearest player still standing; spawning picks a random player. Tested: a Groaner chose the guest (host 28 blocks away), chased, and hit them (20 → 11 health). Fainted friends are ignored |
| Monster damage happens on the friend's computer | Done | Their own armor and health. The faint screen shows the host's reason ("A Groaner got you!") |
| Explosions hurt friends | Done | Same formula as the host's. Tested: 20 → 14 health and a knockback |
| Guests see the host's creatures, dropped items, and arrows | Done | About 5 updates a second, smoothed. Shows creatures near any guest (bosses from farther away), with walking animation, red hurt flash, and fainting. Tested: 27–61 creatures on the guest; screenshot of a cow and sheep |
| Guests fight | Done | Hits go to the host's game (checked: within 7 blocks, 5 hits a second at most). The creature fights back at that friend, and the XP goes to them. Tested: a guest killed a pig |
| Guests' bows | Done | The arrow flies in the host's world. Tested |
| Dropped items through the host | Done | Everything a guest drops (Q, mining, fainting, a full backpack) lands in the host's world for everyone; pickups are checked by the host (within 2.6 blocks) so nothing is copied. Tested: porkchops from the pig, dirt from mining, a Q drop, 10 cobblestone after fainting |
| Everyone in bed to skip the night | Done | Within 10 seconds of each other; "1 of 2 players are in bed." Tested: night ended only after both slept; both woke on day 2 |
| "The host's game is paused" banner | Done | Seen in this test when the host's tab went to the background (Stage 1 left this untested) |
| Guests feeding, taming, riding, trading, fishing, throwing (eggs, pearls…) | Missing | Host only for now, with a message |
| Creatures far from the host | Partial | Only land the host's game has loaded has creatures (about 64 blocks around the host); a guest who wanders farther sees none there |
| Bosses and Leviathans with guests | Partial | They notice guests too, but no boss fight with a guest has been tested |
| Single-player regression | Done | A normal Survival world: a Groaner still targets and hurts the player |

## Play Together, Stage 4: riding and traveling together (built, browser-tested, and published 2026-11-12)
Protocol 4. Import-map version `together-4` for main.js, multiplayer.js, and entities.js. The relay didn't change.

| Feature | Status | Notes |
|---|---|---|
| Guests ride minecarts | Done | Right-click the host's cart; the host's world moves the real cart, and the guest's W (looking the way to push) pushes it. C climbs out. Tested: the guest pushed a cart from x 12.5 to 19.6 and rode along; climbing out freed it. Activator rails throw a guest out too |
| Guests ride boats | Done | The guest rows on their own computer (feels instant) and the host's boat follows them. Tested on land |
| Guests place carts, boats, and spawn eggs | Done | Created in the host's world (not bosses or Leviathans). Tested with a boat |
| The group travels together | Done | When the host goes through a portal (Surface ↔ Ember Depths, Surface ↔ Hollow) or is carried more than 150 blocks at once, every friend follows and arrives next to them. Guests can't use portals on their own. Tested: Surface → Ember Depths (land identical, 25 chunks, including the host's new portal) → Surface (rails and cart still there) |
| A friend fainting in the Ember Depths or the Hollow | Done | Wakes up next to the host instead of alone on the Surface |
| Where Play Together works | Done | Surface, Ember Depths, and Hollow. The Forsaken World, the Deep, the Expanse, the Hollow Sands, and the Solkara rooms stay single-player (hosting stops with a message) |
| Single-player regression | Done | Portal trips to the Ember Depths and back still work |
| A minecart loop (curves, powered rails), riding animals, fishing, throwing | Partial / Missing | Only a straight track was tested. Riding animals, fishing, and throwing stay host-only |

## Ancient City Reborn, Phase 1: Echohold graphics and atmosphere (built and browser-tested 2026-11-12, not published)
Plan, checklist, and decisions: `ANCIENT-CITY-REBORN.md`. New file `js/echohold-atmosphere.js`; changed blocks.js, mesher.js, main.js, lost.js, ui.js, save.js, index.html.

| Feature | Status | Notes |
|---|---|---|
| Teal light | Done | Hush Nodes, Lumen Crystals, resonators, gate stones, Keeper Beacons, anchors, trophies, Tide Lamps, sensors and Skyshard Ore now give cool teal light; torches and Keeper Lamps stay warm. Hushmoss, Lumen Grass and Hush Carpet glow faintly. Creatures still treat teal light as light |
| Pulsing glow | Done | A slow teal wave rolls across glowing moss and crystals. Off with Reduced Motion or Atmosphere effects: Low |
| Deep atmosphere | Done | Darker teal-black fog; drifting spores and dust; water drips from the ceiling; soft glow halos around nearby lamps and crystals (Medium/High) |
| Deep sounds | Done | Low rumbles, shifting stone, echoing drips, a faint whine in the tunnels, and a heartbeat when the city is stirring (alert 55+) or the First Warden is awake. Uses the ambient sound volume; Reduced Suspense turns the heartbeat off |
| Atmosphere effects setting | Done | Settings → Atmosphere effects: Low (steady light, no halos or particles), Medium (default), High (more glow and particles). Works with Fast or Fancy graphics |
| Far-city view | Planned | Comes with the new city map (Phase 2) |

## Ancient City Reborn, Phase 2: the bigger Echohold (built and browser-tested 2026-11-12, not published)
New map `maps/deep-v2.bin` (built by `tools/echohold-build.html` from `js/echohold-author.js` + `js/lost-author.js`). Worlds that already went to the Deep keep the original city (deep-v1); all others get the new one.

| Feature | Status | Notes |
|---|---|---|
| Two caverns | Done | The original city and descent are unchanged; a second great cavern opens to the west (the map is now 368 × 256 blocks) |
| Grand Entrance | Done | A huge gate carved where the descent tunnel enters the city, two guardian statues with glowing eyes, a fallen gate leaf, a broken wall, a watchtower, chain lamps, a warning tablet, a hidden guardhouse |
| The Overlook | Done | A ledge high on the east wall. The first visit turns your view toward the far city and shows its name (any key or movement stops it; Reduced Motion: name only) |
| West Gate + West Road | Done | A new gate in the city wall and a lamp-lined road across the new cavern, over a ravine with a waterfall (a broken second bridge; steps out of the ravine at both ends) |
| Ancient Market | Done | Stalls and two warehouses with caches |
| Forgotten Kingdom | Done | Fountain plaza with a Keeper Beacon, a notice tablet, and a second lift up to the Surface; 27 homes (some two storeys), courtyards, a collapsed tower, 7 caches |
| Royal Citadel, Lost Library | Partial | Outsides built (walls, towers, keep, a tall library hall); insides and puzzles come in Phase 3 |
| Far-city skyline | Done | Beyond the fog, the city's buildings show as dark shapes with lit windows (Atmosphere effects Medium/High) |
| Checks | Done | 149 builder checks (everything reachable on foot from the lift; every original puzzle, cache, tablet, and district unchanged) |

## Ancient City Reborn, Phase 3: Echohold's interiors (built and browser-tested 2026-11-12, not published)
New code `js/echohold-interiors.js` (part of `maps/deep-v2.bin`); lost.js puzzles can now have their own messages, several wheels, and underground districts.

| Feature | Status | Notes |
|---|---|---|
| Royal Citadel | Done | Throne room, the Royal Archives behind it, war room, banquet hall, royal chambers, a prison with barred cells, an escape tunnel. Find the three Royal Seals (Crown, Watch, Hearth) to open the archives |
| Hidden Royal Vault | Done | Off the escape tunnel, on no map. Four marks (crown, moon, key, bell); the order is split between the Royal Archives and the catacombs |
| Lost Library | Done | Three floors around an atrium, a bridge across the top, a collapsed corner. Four numbered notes give the order of four marks (moon, key, eye, crown) that open the sealed reading room. A hidden stair leads to a secret nook |
| Silent Catacombs | Done | A dark maze under the Forgotten Kingdom: burial hall, ritual chamber, underground lake, Hush Node sound traps, caches, crawlers and a Deep Stalker. In from the fountain plaza; a passage leads up into the Citadel prison |
| Aqueduct Works | Done | Turn three wheels (pump house, old north bridge, ravine floor) to drain a flooded passage and open the drowned storeroom |
| Hidden Observatory | Done | Up a hidden stair at the end of the West Road: a survey table, a tablet, a cache |
| Story | Done | 12 new tablets (original writing): the Crown's experiments, the Royal Seals, the portal report, the librarians' notes, the vault riddle, the aqueduct, the observatory |

## Ancient City Reborn, Phase 4: hunters and new creatures (built and browser-tested 2026-11-12, not published)
New code `js/echohold-hunt.js`; new species in entities.js; placed in `maps/deep-v2.bin`.

| Feature | Status | Notes |
|---|---|---|
| Deep Stalker hunting | Done | Follows sounds, searches where it heard you, chases when it senses you up close (closer if you crouch), winds up before every strike, pauses after, backs away from bright light (lamps and torches), gives up and sinks back into the moss if you stay quiet |
| The city stirs | Done | When the alert meter fills, the moss pulses and the floor rumbles for a few seconds before a Stalker rises nearby. The moss glow and the heartbeat get stronger while a Stalker hunts close by |
| More noises | Done | Opening chests and heavy landings now make sound in the Deep |
| Echo Watcher | Done | A one-eyed stone pillar. It can't move, but if it sees you walking in front of it, its eye charges, then it rings: the alert jumps and Hush Crawlers come. Crouch past it, or break it from behind |
| Vault Sentinel | Done | A heavy shielded guardian beside the Citadel keep and in the Hidden Royal Vault. Its shield blocks hits from the front; before each slam its arms rise and a ring glows on the floor |

## Ancient City Reborn, Phase 5: bosses and rewards (built and browser-tested 2026-11-12, not published)

| Feature | Status | Notes |
|---|---|---|
| The First Warden, upgraded | Done | Bigger and crowned. New attacks: a sonic blast along a glowing line, moss surges that leave one quarter of the hall safe (the safe quarter moves), and in its last phase its core opens after each shockwave (double damage). It now really walks toward you (an old bug stopped it) |
| Warden's Sanctuary | Done | Moss channels, pillars with crystals, raised ledges, an altar, and two more ways out of the arena |
| Fallen Sentinel | Done | A mini-boss in the new Royal Treasury under the Citadel keep. Two-blow combo, a shield stance, a shockwave, and a charge along a glowing line that leaves it stunned |
| Hushguard armor | Done | Four pieces (from the Warden, the Library's sealed room, the Hidden Royal Vault, and the Fallen Sentinel). Each piece: 8% less damage from Echohold's creatures; the boots soften footsteps |
| Echo Blade | Done | From the Warden: +50% damage to Echohold's creatures, silent strikes |
| Sentinel Hammer | Done | From the Fallen Sentinel: heavy, slow, and its blows go through shields |
| Achievements | Done | The Last Royal Guard, The Crown's Riddle, Quiet as Stone |

## Ancient City Reborn, Phase 6: secrets and the city map (built and browser-tested 2026-11-12, not published)
New code `js/echohold-secrets.js`; secrets placed in `maps/deep-v2.bin`.

| Feature | Status | Notes |
|---|---|---|
| The Silent Bell | Done | A bell tower on the fountain plaza. Pull the rope and the city goes still for 45 seconds: the alert meter empties, Stalkers forget you, Watchers close their eyes, and sounds don't carry. Rings again after 5 minutes |
| The Empty Throne | Done | Sit on the Royal Citadel's throne for a moment and a hidden stair opens down to the Royal Treasury |
| The Silent Trial | Done | A long hall under the West Quarter. Cross it without being heard (keep to the soft path or crouch); three sounds and it resets and Hush Crawlers come. Make it to the end for a reward room |
| The Forgotten Explorer | Done | An old expedition camp inside the collapsed watchtower, with notes pointing to the Royal Vault |
| The Last Message | Done | A final note at the far end of the catacombs |
| The City Awakens | Done | Once you've found 10 districts, the moss across the whole city flares for a moment |
| Journal: city map | Done | Journal (J) → Lost Civilization: a map that fills in with the districts and secrets you've found, and "Echohold explored: N%" |

## Ancient City Reborn, Phase 7: the Great Portal and the Echo Expanse (built and browser-tested 2026-11-12, not published)

| Feature | Status | Notes |
|---|---|---|
| Great Portal chamber | Done | Around the First Gate: two tall stair towers joined by a high walkway behind the gate, carved rune pillars with crystals, great hanging chain lamps, a glowing platform edge, and a ceremonial ring where you activate the gate |
| Gate opening | Done | Light flows from the sockets into the frame while it charges; it opens with a bright flare, a chord, and a burst of light; afterward light drifts into the open gate |
| Echo Expanse sky | Done | Slow rings of dark floating rubble and glowing shards far out in the violet sky |
| Resonant Sovereign | Done | A new look: glowing veins, shoulder spires, and a ring of floating shards (same fight) |

## Ancient City Reborn, Phase 8: final checks (done 2026-11-12, ready to publish)
Old test worlds, a new Legacy Campaign world, and a new Hardcore world all load; the Settings page fits a phone screen; every changed file has the new version tag (`?v=echohold-1`) so returning browsers get the new files together. The publish list is in `ANCIENT-CITY-REBORN.md`. Still needed: a real Chromebook test.

## The Forsaken Mutants, Slice 1: the Forsaken Groaner (built and browser-tested 2026-11-13, not published)
Plan and full checklist: FORSAKEN-MUTANTS.md.

| Feature | Status | Notes |
|---|---|---|
| Mutant base (js/mutants.js) | Done | Shared rules, fight states (idle, notice, chase, wind-up, strike, recover, dash, stagger, howl, down, rise, death), health by difficulty (3.5× / 5× / 6× a Groaner), green mini-boss health bar |
| Forsaken Groaner model | Done | Original hunched brute about 2.4× a Groaner's height: lopsided giant right arm, shoulder humps, sunken head, torn shirt, bone shards, glowing pale eyes and green cracks that glow in the dark |
| Punch | Done | Raised fist for 0.75 s, then a heavy hit with knockback; step back to dodge |
| Ground slam | Done | Both arms up and a green ring for the whole wind-up, then a shockwave crawling toward you |
| Charge | Done | Crouches low for 1 s, then dashes; if it crashes into a wall it's dazed for about 2 s (extra damage) |
| Healing | Done | Heals with green sparkles if nothing hits it for 4 s; any hit stops it |
| Rage | Done | Once below half health: faster for 8 s, eyes and cracks blaze |
| Helpers | Done | Howls once at 2/3 and once at 1/3 health; at most 3 ordinary Groaners at a time |
| One comeback | Done | First defeat: it collapses with a beating heart for 5 s; hit it hard and it stays down, otherwise it rises at 40% health, enraged. The second defeat is final |
| Wards keep you safe | Done | It won't attack into a ward, cancels an attack if you reach one, and gives up after 6 s |
| Spawning | Done | Forsaken World only: a one-time encounter at Hollowmere Village plus rare wandering ones; quiet start (150 s first visit, 45 s later, 20 s after fainting); never near the refuge, inside wards, during Herobrine's hunts or fight, in Creative, or on Peaceful; far-away ones fade out after 20 s; settings at the top of js/mutants.js |
| Drops | Done | Corrupted Flesh (624), Forsaken Shard (625), Forsaken Groaner Trophy (626: always from your first one, then 1 in 5) |
| Saved records | Done | Sightings, defeats, and finished encounters in the Forsaken story (`G.story.fw.mutants`); the mutants themselves aren't saved, so a reload mid-fight just clears it |
| Sounds | Done | Growls, roar, heavy footsteps, wind-up rumble, impact, hurt, healing chime, heartbeat, death; every warning also shows as a ring, pose, or message |

Browser-tested (local, disposable "Mutant test" world, Easy difficulty, then deleted): spawn at the village, every attack and its timing, healing and stopping it, rage, helpers and the cap, collapse → finish, collapse → rise, final defeat, drops and icons, ward safety, wall crash, far-away fade-out, Creative (no spawns), save + reload keeps the records, desktop and phone-size screens, no console errors. Not tested yet: a real hand-played fight, Hard difficulty feel, a real Chromebook.
Files: js/mutants.js (new), js/entities.js, js/main.js, js/blocks.js, index.html (version tags `?v=mutants-1`; backups in tools/backups/pre-mutants-slice1-2026-11-13/).

## The Forsaken Mutants, Slice 2: the Forsaken Rattler and Forsaken Skitter (built and browser-tested 2026-11-13, not published)
Plan and full checklist: FORSAKEN-MUTANTS.md.

| Feature | Status | Notes |
|---|---|---|
| Forsaken Rattler model | Done | Original towering skeleton archer (about 5 blocks tall): see-through reinforced rib cage with a pale glowing heart, long arms, bone blade on the right forearm, shoulder and back spikes, glowing white eyes, big dark bow with bone tips and a glowing string, quiver |
| Rattler: aimed shot | Done | 0.7 s draw, then one strong arrow; hiding behind blocks blocks it, and with no clear shot it walks to find one |
| Rattler: volley + reload | Done | Glowing bow for 1.1 s, then 4 arrows about half a second apart; afterward it must reload for 2.3 s and takes 30% extra damage |
| Rattler: exploding arrow | Done | A pale ring marks the spot 1.6 s ahead; the blast hurts only inside the ring and never breaks blocks |
| Rattler: bone strike | Done | Up close it raises its bladed arm for 0.6 s, hits and knocks you back, then backs away to shooting range |
| Rattler: helpers | Done | Twice (2/3 and 1/3 health) it calls 2 ordinary Rattlers; at most 3 at a time |
| Forsaken Skitter model | Done | Original enormous black-and-charcoal spider: raised armored abdomen with plates, spikes, and crimson glowing cracks, six red eyes, fangs, eight jointed legs, trailing silk |
| Skitter: venom bite | Done | Rears up for 0.55 s, then bites with the Blight effect (Poison on Easy) |
| Skitter: web shot + web patch | Done | Spits a web glob at where you stood; if it lands on you, you're slowed to 30% for 2.4 s (then 3 s when you can't be webbed again); the white patch slows you to 55% until it fades after 6 s |
| Skitter: leap | Done | A red ring shows where it will land; it crouches 0.85 s, then leaps there |
| Skitter: spiderlings | Done | Twice it curls up and glows for 1.7 s; hit it hard enough (8% of its health) to stop it, otherwise 3 Cave Skitters hatch (at most 3 at a time) |
| Skitter: nests and climbing | Done | Near its nest it hits 20% harder and moves faster; it climbs walls. Ceilings: not possible in this engine |
| Encounters | Done | Watchtower Rattler, Pale Wood Grove Skitter nest, Deepvein Mine Skitter nest (one mutant at a time, each beaten once); wandering ones can be any of the three |
| Drops | Done | Rattler: Forsaken Bone (627), Forsaken Bow Limb (628, half the time), trophy (629). Skitter: Corrupted Silk (630), Venom Fang (631, half the time), trophy (632). Both: a Forsaken Shard |
| Sounds | Done | Bone clacks, bow draw, blast, shriek, hiss, chittering steps, web spit, landing thud |

Browser-tested (local, disposable "Mutant test 2" world, Normal difficulty, then deleted): both models up close and from the side; every attack and its timing; volley accuracy (2 of 4 arrows hit someone standing still 12 blocks away, each 3 damage); cover stops its shots; reload bonus damage; helpers and caps; bite + Blight; web slow and the no-repeat window; leap ring timing; stopping the spiderlings and letting them hatch; wall climbing; all three encounter spots; drops and every item icon; leaving the Forsaken World clears webs and slowdowns; no console errors. Not tested yet: hand-played fights, phone-size screen for these two, a real Chromebook.
Files: js/mutants.js, js/main.js (web slowdown, passes THREE/scene), js/blocks.js (items 627–632), index.html (`?v=mutants-2` on blocks, main, mutants; entities.js unchanged at `mutants-1`). Backups: tools/backups/pre-mutants-slice2-2026-11-13/.

## The Forsaken Mutants, Slice 3: the Forsaken Hisser and Forsaken Voidwalker (built and browser-tested 2026-11-13, not published)
Plan and full checklist: FORSAKEN-MUTANTS.md. All five mutants now exist.

| Feature | Status | Notes |
|---|---|---|
| Forsaken Hisser model | Done | Original hulking four-legged mutant Hisser: jagged green body with glowing green cracks, a pulsing core in its chest, splayed blackened legs, stone spikes, hollow glowing eyes, toxic drips |
| Hisser: stalks and circles | Done | Closes in from far away, then circles at mid range |
| Hisser: toxic burst | Done | Its core swells for 1 s inside a green ring, then a 5-damage burst with Poison; hitting it hard during the swell cracks the core and cancels the burst. Afterward it backs off with a dim core to recharge |
| Hisser: explosive leap | Done | A green ring marks where it will land 1.6 s ahead; the landing blast never breaks blocks |
| Hisser: ring blasts | Done | Four small green rings go off around you, one after another |
| Hisser: toxic pools | Done | Burst and landing spots leave green puddles that sting and poison while you stand in them (fade after 6 s, at most 4) |
| Hisser: final explosion | Done | When defeated it flashes and blows up in three growing rings over 3.3 s. Run past the last ring and you take nothing; keep hitting it to smother the core and it fizzles out. Standing in all three rings costs about 9 health on Normal, so it can't kill a healthy player. You get the rewards either way |
| Forsaken Voidwalker model | Done | Original very tall (about 5.5 blocks) four-armed shadow creature: angular black armor, purple energy cracks, violet eyes, a crested head, long upper arms and a second pair of shorter arms with glowing claws, drifting purple sparks |
| Voidwalker: teleport warnings | Done | Purple sparks gather where it is about to appear (0.6 s ahead) before every teleport |
| Voidwalker: stalking | Done | If you get far away or out of sight, it reappears behind you |
| Voidwalker: four-arm strike | Done | All arms rise for 0.7 s, then a 6-damage hit |
| Voidwalker: teleport slash | Done | A purple ring appears under you; 1 s later it teleports beside the ring and slashes |
| Voidwalker: gravity pull + burst | Done | Arms spread for 0.8 s, then it drags you in for 1 s (sprinting away beats it, and wards stop it), then a purple ring bursts 1 s later; run out of the ring. Afterward it's worn out for 2.2 s and takes 30% extra damage |
| Voidwalker: dodging | Done | Sometimes teleports away when hit (about 1 in 3 arrows miss) |
| Voidwalker: shadow clones | Done | Twice it splits into 2 see-through clones with dim eyes (the solid one is real); clones are weak, fade after 12 s, and vanish when the real one falls |
| Voidwalker: rage | Done | Below about a third of its health: purple light pours out and it attacks and teleports faster for 8 s |
| Encounters | Done | Research Outpost Hisser; a Voidwalker on the Pale Citadel's outskirts (never inside Herobrine's arena). Starting Herobrine's fight clears any mutant away |
| Drops | Done | Hisser: Volatile Mutagen (633), Corrupted Blast Core (634, half the time), trophy (635). Voidwalker: Void Essence (637), Forsaken Pearl (636), trophy (638). Both: a Forsaken Shard. Item ids 624–638 used, 639 still free |
| Sounds | Done | Fuse hiss, ticking before the final blast, fizz, warp, scream, slash |

Browser-tested (local, disposable "Mutant test 3" world, Normal difficulty, then deleted): both models; every attack, its warning, and its timing; cracking the core; pools; final explosion three ways (stand in it, run, smother); stalking teleport; strike; teleport slash; gravity pull (stand still = hit, run out = no hit); tired bonus damage; arrow dodging; clones (see-through, fade on time, vanish on defeat); rage; both encounter spots; Herobrine's fight clearing mutants; drops and all item icons; no console errors. Not tested yet: hand-played fights, phone-size screen for these two, a real Chromebook.
Files: js/mutants.js, js/blocks.js (items 633–638), index.html (`?v=mutants-3` on blocks and mutants). Backups: tools/backups/pre-mutants-slice3-2026-11-13/.

## The Forsaken Mutants, Slice 4: the Outer Reaches, journal page, lore, achievements, recipes (built and browser-tested 2026-11-13, not published)
Plan and full checklist: FORSAKEN-MUTANTS.md.

| Feature | Status | Notes |
|---|---|---|
| The Outer Reaches (js/forsaken-reaches.js) | Done | Five new places in the Forsaken World's generated outer ring (the packaged map is untouched): Wayfarer's Rest (north: torn-apart camp, huts, fire pits, broken fences), the Hollow Graves (east: gravestone rows on soul sand, skull arch, broken tower), the Blight Crater (south-east: scorched bowl, green sludge pools, research ruins), Silkwood Hollow (west: silk-wrapped dead trees, egg clusters, an old mine mouth), the Sundered Gate (south-west: violet pillars, cracked floor, a broken obsidian gate) |
| Old worlds stay safe | Done | Ring chunks a player already changed before this update keep their old shape and every change (saved as `dimData.forsaken.reachesSkip`, `reachesV`); other ring land gets the new places |
| Ritual marks and traces | Done | Each place has Herobrine's dark stone circle; faint colored sparks drift over each place when you're near |
| Lore notes | Done | Five new notes on note stands (camp journal, gravekeeper's ledger, research note, mine-beam warning, "The Five"); they show in the journal's Notes list |
| Discovery | Done | "Discovered: …" message the first time you reach each place |
| More encounters | Done | One more mutant at each new place (one at a time, each beaten once); wandering mutants are now the kind that lives nearest |
| Mutants page in the journal | Done | Under the Forsaken journal (J): a card per mutant. Unmet ones show "???"; met ones show their haunts, defeats, and each move you've actually seen; after a defeat it shows the rewards and whether you've found its trophy. Fits a phone screen |
| Achievements | Done | Forsaken World tab: Elite Hunter (defeat one), The Five Forsaken (defeat all five), Trophy Hall (a trophy from each), Beyond the Vale (find all five places). All optional |
| Recipes (crafting table) | Done | Bow ← 2 Forsaken Bow Limbs + Corrupted Silk; 8 Arrows ← Forsaken Bone + Flint + Feather; 8 Arrows ← Venom Fang + 2 Sticks + 2 Feathers; 4 String ← Corrupted Silk; 3 Ward Candles ← Forsaken Shard + Corrupted Silk + Coal; 2 Blast Blocks ← Corrupted Blast Core + 4 Sand; 1 Blast Block ← 2 Volatile Mutagen + 4 Sand; Pale Lantern ← Forsaken Pearl + 2 Void Essence + 2 Iron Ingots. Corrupted Flesh is now food (like Rotten Flesh: it can make you queasy). Nothing better than what the game already has |

Browser-tested (local, disposable "Mutant test 4" world, then deleted): all five places from above; every note opens; discovery messages; all four achievements register (in Survival); a Rattler appears at the Hollow Graves and its defeat records the trophy and the encounter; the old-world protection (a chunk changed before the update kept its shape and the block placed there, its neighbor got the new building); the journal page on desktop and phone width; all recipes registered; no console errors. Not tested yet: crafting each recipe by hand, a real older save from his own browser, a real Chromebook. Known limits: the journal's small map still shows only the old valley; places cut by an old changed chunk can look half-built.
Files: js/forsaken-reaches.js (new), js/mutants.js, js/worldgen.js (one line in ForsakenGen.generate), js/main.js (one line in makeWorld), js/blocks.js (recipes, Corrupted Flesh food), js/advancements.js (4 achievements), index.html (`?v=mutants-4` on advancements, blocks, main, mutants, worldgen, new forsaken-reaches entry, main script tag). Backups: tools/backups/pre-mutants-slice4-2026-11-13/.

## The Forsaken Mutants, Slice 5: balance and final checks (done 2026-11-13; whole expansion PUBLISHED 2026-11-13, pull request #12)
Plan and full checklist: FORSAKEN-MUTANTS.md.

| Feature | Status | Notes |
|---|---|---|
| Settings: Forsaken Mutants | Done | Settings → Forsaken Mutants: Normal / Rare (about a third as many wandering ones) / Off (none at all, and any nearby ones disappear). Saved per browser, so a class device can turn them off |
| Balance pass | Done | Scripted test fights (iron sword and iron armor, a bot that steps out of warning rings and backs off from raised-arm wind-ups), 3 fights per mutant per difficulty, all won. Normal: 18–35 s per fight, about 1½–3 health bars of damage. Hard: 20–45 s, about 2–4½ health bars, with some close calls. Easy: light. After the first run the Voidwalker was clearly harshest, so it was softened: base health 34 → 28 (Normal 170 → 140), four-arm strike 6 → 5, clone hits 3 → 2 |
| Cleanup on reload | Fixed | Reloading or switching worlds while in the Forsaken World now clears leftover webs, pools, and flying effects |
| Save and reload mid-fight | Checked | The fight resets (mutants aren't saved), leftover webs and pools are gone, 45 quiet seconds; unfinished encounters come back later; records stay |
| Fainting mid-fight | Checked | You wake inside the refuge's ward with 20 quiet seconds; the mutant gives up and fades out after 20 s |
| Peaceful, Creative, Off | Checked | No mutants appear; any that exist are removed (Peaceful, Off) |
| Crafting | Checked | All 8 new recipes made at a Workbench with the right amounts |
| Speed | Checked | Game logic stays under 1 ms per frame with any mutant (including the Voidwalker with its clones). Drawing cost couldn't be measured in the test pane; a real Chromebook is the true test |
| Older worlds | Checked | "Migration test" loads and plays with no errors (loaded without saving) |
| Live site unchanged | Checked | The live entities.js, main.js, blocks.js, worldgen.js, advancements.js, ui.js, and index.html are identical to the copies this work started from, so publishing won't overwrite anyone else's changes |

**Publish list (11 files, all under typing/games/blockhaven/):** js/mutants.js (new), js/forsaken-reaches.js (new), js/entities.js, js/main.js, js/blocks.js, js/worldgen.js, js/advancements.js, js/ui.js, index.html, FEATURES.md, FORSAKEN-MUTANTS.md. Version tags in index.html: entities `mutants-1`; blocks, main (+ script tag), worldgen, advancements, forsaken-reaches `mutants-4`; mutants, ui `mutants-5`. Publish all of them together (one branch + merge, like PR #10), then open the live game with `?fresh=N` and check the Forsaken World.
Still worth doing by hand: one real fight per mutant, Hard difficulty, a real Chromebook and phone.

## The Grand Desert Temple (built and browser-tested 2026-11-14, not published)
Rebuilt the outside of the Sunken Pyramid of Aurelis from Mr. Watford's two reference videos. Measurements, choices, and screenshots: `GRAND-DESERT-TEMPLE.md` (pictures in `tools/temple-shots/`).
- [x] `js/desert-monument.js`: the whole complex as one stamp: an 81 × 81 platform on a stepped, orange-striped wall 14 high (109 × 109 at the sand); a south entrance wing with two stepped towers and a 13-wide grand stair; a 7 × 7 tiled courtyard with 4 small stepped pyramids and 8 sunken pits; a white base with 4 stairways; a colonnade of 3 × 3 columns with arches and burning corner towers; 39 braziers. The old pyramid tip is copied unchanged and lifted 19 blocks onto the base (lift, tablet, and chest included). Colors in one place (`MAT`).
- [x] New blocks 216–220: Pale Temple Stone, Sunfire Terracotta, Pale Temple Pillar, Pale Temple Step (half height, so stairs are walkable without jumping), Temple Brazier.
- [x] `js/lost.js`: decided once per world (`story.lost.monument`). New worlds look for room for it. Older worlds get it only if no block in its footprint was ever changed and nothing else is planned there; otherwise the small pyramid stays and a message explains why. An opened camp chest's contents move up with the pyramid. Villages nobody has seen in the footprint don't generate (`gen.skipVillages`); a seen village blocks the upgrade. `worldgen.js` stamps can now fill their foundation down to the ground (`foot`).
- [x] `js/monument-life.js`: embers and smoke from braziers, drifting sand, light wind on the platform, distant groans; guards made from creatures the game already has (Husk; Tomb Guardian as the Temple Sentinel; Ancient Sentinel as the rare Ancient Guardian) with patrol routes (`Entities.patrolStep`), chase, return to route, respawn timers, never saved, none on Peaceful.
- [x] Browser-tested (local server, seed `temple-test-1`, throwaway world deleted): every important spot reachable on foot; walked from the sand into the lift room with no jumps; lift down and back up; tablet; chest move on an "old" save; the conflict path keeps the old pyramid; guards chase and return; Creative inventory; all item icons; no console errors.
- [x] Natural edges (same day): a 14-block sand slope with dunes buries the foundation, then a 9-block patchy sand-to-grass fade; trees cleared near it (no floating leaves); a few half-buried ruins; new worlds prefer mostly-desert spots. Walked onto the platform from N/S/E with no jumps.
- [ ] Not checked yet: a real Chromebook's frame rate, hand-play, exported-JSON save round trip, a temple in tall dunes or beside the sea.

## The Stronghold Reborn: the Endwatch Citadel (Stages 1–6 built and browser-tested 2026-11-16, published 2026-11-17)
Every stronghold nobody has reached becomes a huge castle on an island in a lake (after Mr. Watford's reference video),
with the Hollow portal sealed beneath its keep. Full details, measurements, and test notes: `STRONGHOLD-REBORN-PLAN.md`;
pictures in `tools/citadel-shots/`.
- [x] The castle (`js/citadel.js`): island, lake, arched bridge, 8-sided curtain wall with 8 towers, gatehouse, keep with
  three floors of rooms, courtyard buildings, dungeons, the hidden Royal Treasury, the throne room, the portal chamber.
  Gate faces spawn. On the Explorer's Map (castle icon); the Eye of the Void finds it.
- [x] The adventure: Outer Siege (10 defenders) → Gate Winch lowers the animated drawbridge and raises the portcullis
  (`js/citadel-gate.js`) → Courtyard Battle (3 waves) unbars the keep, room guards, 13 Ancient Tomes of lore
  (`js/citadel-keep.js`) → the Forgotten Dungeons: cells, darts, crypt, collapsing bridge, Lava Hall, levers, 4
  Watchfire checkpoints, a shortcut hatch, ambushes; the worn bookshelf opens the Royal Treasury (`js/citadel-dungeon.js`)
  → the Fallen Castellan, a 3-phase boss with an intro and boss bar; his Castellan's Greatblade (Sweeping Cleave); his
  defeat opens the Seal to the portal (`js/citadel-boss.js`) → fill the frame with Eyes of the Void → the Hollow.
- [x] Atmosphere (`js/citadel-ambience.js`): wind on the walls, crackling fires, distant dungeon noises, a hum and sparks at
  the portal. New "clank" sound (also fixes the silent desert guardians).
- [x] New blocks 216–233 range: 221–233 (roof tiles, cracked bricks, stone step, banner, ward bricks, seal, portcullis,
  gate winch, tome, watchfire, worn bookshelf, lever, stained glass). New item 641 Castellan's Greatblade (640 is the Wildlife Ostrich Egg).
- [x] Safety: Survival players must beat the Castellan to reach the portal (ward bricks and the seal can't be broken;
  Creative can). Saved worlds: any stronghold someone dug into, built near, or saw a village by keeps its old underground
  form; nothing is overwritten. New worlds (incl. Legacy Campaign) move a crowded stronghold outward so it still gets its castle.
- [x] Tested in the browser on seeds `citadel-test-1`, `regression-alpha`, `90210`, `campaign-test-7/8/9`: the whole route
  in Survival from the shore to the Hollow; Creative/Peaceful shortcuts; save/reload at every stage; Desert Temple,
  Starter Home, Explorer's Map, and Legacy Campaign worlds still fine; no console errors. Speed (this Mac): castle
  design 0.2 s once per world load, castle chunks ~5 ms each vs ~1 ms for plain land, game loop unchanged.
- [ ] Not checked: hand-played fights for difficulty balance, Hard difficulty, Play Together, a real Chromebook (drawing speed).
- Publish list (all under typing/games/blockhaven/): js/citadel.js, js/citadel-gate.js, js/citadel-keep.js,
  js/citadel-dungeon.js, js/citadel-boss.js, js/citadel-ambience.js (new); js/main.js, js/blocks.js, js/shapes.js,
  js/entities.js, js/worldgen.js, js/lost.js, js/starter.js, js/campaign.js, js/campaign-data.js, js/audio.js,
  js/desert-relic-sites.js, js/obsidian-badlands.js; index.html, FEATURES.md, STRONGHOLD-REBORN-PLAN.md.

## Later milestones
| Feature | Status |
|---|---|
| More wildlife (turtles, axolotls, wolves in snow, goats…) | Missing |
| Enchanting, brewing, potions, more status effects | Missing |
| Redstone-style mechanisms, minecarts | Done: Parts A to E all published (Milestone 12) |
| More biomes, flowing water/lava, weather, falling blocks | Missing |
| Building palette (slabs, stairs, fences, colored blocks, signs…) | Missing |
| Multiplayer ("Play Together") | Stage 1 built 2026-11-11 (see the Play Together section above and MULTIPLAYER-PLAN.md) |
