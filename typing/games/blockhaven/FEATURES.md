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
| Part E (finish: advancements, guide, sounds) | Missing | See the design |

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

## Later milestones
| Feature | Status |
|---|---|
| More wildlife (turtles, axolotls, wolves in snow, goats…) | Missing |
| Enchanting, brewing, potions, more status effects | Missing |
| Redstone-style mechanisms, minecarts | Parts A to D done (Milestone 12); E next |
| More biomes, flowing water/lava, weather, falling blocks | Missing |
| Building palette (slabs, stairs, fences, colored blocks, signs…) | Missing |
| Multiplayer ("Play Together") | Stage 1 built 2026-11-11 (see the Play Together section above and MULTIPLAYER-PLAN.md) |
