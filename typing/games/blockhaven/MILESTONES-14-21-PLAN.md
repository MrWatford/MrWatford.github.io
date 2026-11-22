# Blockhaven: the next big batch (Milestones 14–24)

**Written:** 2026-11-12 · **Updated:** 2026-11-21 (added the "everything Minecraft" check, section 6)
**Your request:** "Add enchanting, brewing and potions, the world, smaller gaps, Redstone Part E, and ocean extras."
**Where these come from:**
- **Original Blockhaven spec (Oct 28):**
  - §20 equipment and status effects
  - §21 experience, enchanting, brewing
  - §24 mechanisms
  - §25 world interactions and events
  - §8 aquatic life
  - §13 Overworld expansion (biomes)
  - §19 structures
- **Nov 4 add-on prompt:**
  - §4 beacons and conduits
  - grindstones
  - §8 waterlogging
  - lightning changes
- **Rules:** Minecraft Java Edition 1.20.1 stays the reference, the same as before.

Not in this batch, because you didn't ask for them this time:
- village extras: zombie villagers, raids, workstations other than the grindstone
- the building palette: slabs, stairs, colored blocks

---

## 1. The big idea

This is about 8 milestones of work. As always, each one is built and tested in the browser before it goes live, and you say "publish" before anything goes on the website.

## 2. The order (you chose "smallest first" on 2026-11-12)

| Order | Milestone | What you get | Size |
|---|---|---|---|
| 1 ✔ published 2026-11-12 | **12 Part E: Redstone finish** | Finishes the Sparkworks: 11 advancements, "Mechanisms" Creative tab, "Sparkworks" guide chapter with 12 example builds, sounds pass | Medium |
| 2 ✔ published 2026-11-12 | **14: Smaller gaps** | Leads, name tags, horse armor, donkeys and mules (with chests), more horse colors, pet breeding, summoning the Hollow Wyrm again, ships at the Hollow towers, creatures going through portals, Hogbeasts turning "rotten" in the Surface world | Medium |
| 3 ✔ built 2026-11-21 (all 3 parts, PUBLISHED 2026-11-21, PR #29) | **15: Enchanting and repair** | Enchanting Table, bookshelf power, XP finally gets spent, ~27 enchantments that really work (curses included), enchanted books, Anvil, Grindstone, shiny "glint" on enchanted items | Large |
| 4 ✔ built 2026-11-21 (all 3 parts) | **16: Brewing and potions** | Brewing Stand, Cauldron, sugar cane and melons as real plants, ~15 potions + longer/stronger versions, splash and lingering potions, ~10 new status effects, recipe guide | Large |
| 5 ✔ built 2026-11-21 (all 5 parts, PUBLISHED 2026-11-21) | **17: Ocean extras** | Prismarine blocks, Sea Lanterns, Ocean Monuments with Guardians, shipwrecks, ocean ruins, treasure maps and buried treasure, coral reefs, sponges, Conduits, fish in buckets, Splashers leading you to treasure | Large |
| 6 | **18: The world, part 1** | Flowing water and lava, water + lava makes cobblestone/stone/obsidian, falling sand and gravel, fire spreading (with a setting), leaf decay, plants that need support, crops needing water, waterlogging | Large |
| 7 | **19: The world, part 2** | Rain, snow, thunderstorms, lightning and its creature changes, snow building up, freezing and melting, sleeping through storms | Medium |
| 8 ✔ built 2026-11-21 (all 5 parts, PUBLISHED 2026-11-21, PR #30) | **20: The world, part 3** | New biomes (swamps, savannas, badlands, cherry groves, dark forests, snowy plains, mushroom islands, deep oceans, lush caves, dripstone caves) in **unexplored land only** | Large |

## 3. Things to know before we start

- **Block-number limit.** The game stores each block as one of 256 numbers, and 215 are already used, which leaves 41.
  - Milestones 14–18 fit (about 20 new blocks).
  - For new biomes, one block number will cover several looks (for example, one "coral" block in 5 colors).
  - If biomes still don't fit, I'll ask you before raising the limit. That is a big change to how worlds are saved.
- **Old worlds stay safe.** Each milestone backs up saves before changing their format, as before.
- **Names follow Blockhaven's style.** Minecraft items that Blockhaven already renamed keep their Blockhaven names in recipes:
  - Flare Powder = blaze powder
  - Wart = nether wart
  - Wailer Tear = ghast tear
  - Shine Dust = glowstone
  - Boom Powder = gunpowder
  - Jade = emerald
- **Curses:** included, as you chose. Curse of Binding (can't take the armor off until it breaks or you faint) and Curse of Vanishing (the item disappears if you faint). They only come from treasure, never from the table.

## 4. Milestone 15 in detail: Enchanting and repair

**New things:**
- **Lapis Ore**: found deep underground, drops Lapis.
- **Enchanting Table** (crafted from 4 obsidian, 2 Skyshard, and a book, like Java's diamonds; this line first said Lapis by mistake).
- **Book** (paper + leather) and **Paper** (made from 3 sugar cane, which arrives with Milestone 16, so Milestone 15 adds sugar cane early).
- **Enchanted Book.**
- **Anvil** (3 iron blocks + 4 iron).
- **Grindstone.**

**How enchanting works:**
1. Put a tool, weapon, armor piece, or book in the table and add Lapis.
2. Pick one of 3 offers, which cost 1, 2, or 3 levels.
3. Each offer shows one enchantment, as in Java.
4. Up to 15 bookshelves placed one block away raise the offers to level 30.

**Enchantments (all change real behavior):**
- **Weapons:** Sharpness, Smite, Bane of Arthropods, Knockback, Fire Aspect, Looting, Sweeping Edge
- **Tools:** Efficiency, Fortune, Silk Touch, Unbreaking, Mending
- **Bow:** Power, Punch, Flame, Infinity
- **Armor:** Protection, Fire Protection, Blast Protection, Projectile Protection, Thorns
- **Helmet:** Respiration, Aqua Affinity
- **Boots:** Feather Falling, Depth Strider, Frost Walker (needs flowing water to be really useful, so it's finished in Milestone 19)
- **Fishing rod:** Luck of the Sea, Lure

**Anvil:**
- Repairs with the material the item is made from.
- Combines two items, or an item and an enchanted book.
- Renames items.
- Costs levels, and says "Too costly!" at 40 levels like Java.
- Wears down and breaks after use.

**Grindstone:**
- Removes all enchantments and gives back some XP.
- Can join two damaged copies of the same item.

**Where else you find enchanted books:**
- treasure chests
- the Wanderer
- a new "Scholar" villager trade

**Also included:**
- **Advancements:** "Enchanter", "Repair Shop", "Max Power" (a level 30 enchantment), "Clean Slate" (use a grindstone)
- **Guide:** a new chapter in our own words
- **Creative:** all the new items in Creative

## 5. Your answers (2026-11-12)

1. Order: **smallest first** (table above).
2. The blue gem is called **Lapis**.
3. **Add the real plants**: sugar cane, melons, rabbit's foot from rabbits.
4. **Curses included.**

---

## 6. The "everything Minecraft" check (2026-11-21)

**Your goal:** every block, creature, potion, redstone part, and enchantment from Minecraft (Java 1.20.1), so the game is complete.

**How this was checked:** the game's real block list (234 blocks), item list (355 items), and creature list were read from the code and compared with Minecraft. This section is the plan; nothing below is built yet.

### 6.1 Already done
- Redstone and minecarts (all of Milestone 12)
- The Ember Depths (Nether), the Hollow (End), the Blightking (Wither), the Hollow Wyrm (Ender Dragon), the First Warden and Echohold (Ancient City)
- Villages, pets, horses, donkeys and mules, leads, name tags, horse armor
- Fish, squid, dolphins, bees, foxes, parrots
- The offhand slot, shields, totems, golden apples, hunger, Hardcore, achievements

### 6.2 What is still missing, by milestone

Milestones 15–20 are the ones in section 2 above. The four after them are new.

| Order | Milestone | What it adds | Size |
|---|---|---|---|
| 3 | **15: Enchanting and repair** | See section 4. In 3 parts. **A** (built 2026-11-21, not published): Lapis, sugar cane, paper, books, the Enchanting Table, every enchantment working, shimmer. **B** (built 2026-11-21, not published): Anvil, Grindstone, enchanted books and gear in treasure, the Wanderer, Scribe book trades (our librarian, instead of a new "Scholar"), Frost Walker. **C** (built 2026-11-21, not published): 10 achievements, a 6-page Journal chapter, sounds, ready-made books in Creative. **Milestone 15 is complete.** | Large |
| 4 ✔ built 2026-11-21 (all 3 parts) | **16: Brewing and potions** | Brewing Stand, Cauldron, about 15 potions with longer/stronger versions, splash and lingering potions, new status effects (today only poison, hunger, and fire exist), sugar cane, melons, rabbit's foot | Large |
| 5 | **17: Ocean extras** | Prismarine, Sea Lanterns, Ocean Monuments, shipwrecks, ocean ruins, coral, kelp, sponges, Conduits, buried treasure, fish in buckets, trident | Large |
| 6 | **18: The world, part 1** | Flowing water and lava, falling sand and gravel, waterlogging, leaf decay, fire spreading, plants that need support | Large |
| 7 | **19: The world, part 2** | Rain, snow, thunderstorms, lightning (today the Surface world has no weather; only the desert sandstorm exists) | Medium |
| — | **Block-limit step** (needed before 20 and 21) | Raise the 256-block limit (see 6.3) | Medium, risky |
| 8 ✔ built 2026-11-21 (all 5 parts, PUBLISHED 2026-11-21, PR #30) | **20: The world, part 3** | New biomes. Today the Surface world has only 6 kinds of land: plains, forest, birch forest, mountains, snowy peaks, sandy. Add jungle, taiga, swamp, savanna, dark forest, badlands, cherry grove, mushroom islands, deep ocean, lush caves, dripstone caves, plus their woods: spruce, jungle, acacia, dark oak, cherry, mangrove. Unexplored land only | Large |
| 9 | **21: Building blocks** (new) | Slabs, stairs, walls, all 16 colors of wool, glass, concrete, and terracotta, carpets, ladders, scaffolding, lanterns, candles, paintings, item frames, armor stands, banners (today: one Stained Glass and one Black Wool) | Large |
| 10 | **22: Farming, food, and gadgets** (new) | Pumpkins, potatoes, beetroot, cocoa, cactus, bamboo, mushrooms, dyes from flowers; cake, pie, stews, cookies; crossbow, spyglass, clock, fireworks, jukebox and music discs | Large |
| 11 | **23: Villages, part 2** (new) | Working job blocks (smoker, blast furnace, barrel, stonecutter, lectern, cartography table…), villager levels and breeding, zombie villagers and curing, pillager raids, outposts, witch huts, mansions | Large |
| 12 | **24: Creature behaviors** (new) | About 40 Minecraft creatures already exist with spawn eggs (`js/creature-catalog.js`) but only walk, bite, or shoot. Give each one its real behavior, for example Guardian lasers, Witch potions, Phantoms after skipped sleep, goats ramming, Evoker fangs and Vexes, Axolotls playing dead, the Allay fetching items, the Sniffer digging seeds, Snow Golem snowballs, the Breeze's wind charges. Needs 16 (potions) and 17 (ocean) first | Large |

### 6.3 The block limit
- Each block is stored as one of 256 numbers. **234 are used, so only 22 are left.**
- That is enough for Milestones 15–19.
- Building blocks and new biomes need hundreds more, so the limit must be raised before Milestone 20.
- Raising it changes how worlds are saved. As always: back up saves, test old worlds, and **ask you before starting**.

### 6.4 Smaller leftovers
- Frost Walker (Milestone 15) is only fully useful after flowing water (Milestone 18).
- Play Together guests still can't use some things (machines, leads, name tags, feeding, fishing, riding animals). Those stay host-only for now.

### 6.5 Not decided yet
- Whether you want Milestones 21–24, and in what order. The suggested order above puts the building blocks after the new biomes, because both need the block-limit step.

---

## 7. Milestone 16 in detail: Brewing and potions (started 2026-11-21)

Built in 3 parts, like Milestone 15. Minecraft Java 1.20.1 is the guide for recipes, times, and effects.

| Part | What it adds |
|---|---|
| **A** | Melons (seeds, stems, melon blocks, slices), Sugar, Glistering Melon, Fermented Skitter Eye, Rabbit's Foot, Phantom Membrane, Water Bottles, the **Cauldron**, the **Brewing Stand**, and every drinkable potion (with longer and stronger versions) working, plus 6 new effects: Slowness, Weakness, Water Breathing, Invisibility, Night Vision, Slow Falling (and instant Healing and Harming) |
| **B** | Splash potions (add Boom Powder), lingering potions and Dragon's Breath (bottled from the Hollow Wyrm's breath), potion clouds, potions working on creatures (Healing hurts undead, Harming heals them), tipped arrows, Witches throwing real potions |
| **C** | Achievements, a Journal chapter with every recipe, sounds, potions in Creative, potions in treasure chests and Cleric trades |

**Swaps (Blockhaven doesn't have these things yet):**
- **Turtle Master** is brewed with a **Sheller Shell** (Minecraft uses a turtle shell; there are no turtle shells yet).
- **Fermented Skitter Eye** = Skitter Eye + Sugar + **Ember Wart** (Minecraft uses a brown mushroom; there are no mushrooms yet).
- **Melon seeds** come from Farmer and Wanderer trades and treasure chests (Minecraft's melons grow wild in jungles, which come with Milestone 20).
- **Phantoms** now drop Phantom Membrane (for Slow Falling), and Rabbits sometimes drop a Rabbit's Foot (for Leaping), like Minecraft.

---

## 8. Change of order (2026-11-21): Milestone 20 before 17

While starting Milestone 17 (Ocean extras), the land turned out to have almost no oceans: about 1% of the land is below sea level, at most 8 blocks deep, mostly lakes and rivers. Ocean Monuments, shipwrecks, and reefs need real seas, so **you chose to do Milestone 20 (new biomes, including deep oceans) first**, then come back to Milestone 17.

### 8.1 The block-limit step: done 2026-11-21 (PUBLISHED 2026-11-21, PR #30)
- The game can now have **1,024 kinds of blocks** instead of 256 (you said yes on 2026-11-21).
- **Every existing block keeps its number**, so old worlds and saves don't need converting. Blocks 256 and up keep their extra number bits above the block's settings.
- Checked: 2.9 million generated block cells read exactly the same as before; an old saved world (land version 9) loads, draws, and keeps its changes; a test block numbered 300 places, draws, breaks, and survives save and reload.

### 8.2 Milestone 20 in parts (new land only)
Like before, new things appear only in land nobody has visited or changed. The world is split into big squares; a square gets new biomes only if nobody has been anywhere in it, and that's decided once and remembered. New worlds get everything.

| Part | What it adds |
|---|---|
| **A** | **Real oceans and deep oceans** (wide seas up to about 18 blocks deep), beaches, and the system that decides biomes per square |
| **B** | **New trees and woods**: spruce, jungle, acacia, dark oak, cherry, mangrove (logs, leaves, planks, saplings) |
| **C** | **New biomes on land**: taiga and snowy plains (snow, ice), jungle (bamboo, cocoa, wild melons), savanna, dark forest, swamp (mud, lily pads), badlands (terracotta, red sand, cactus), cherry grove, mushroom fields (mycelium, giant mushrooms, Mooshrooms) |
| **D** | **New caves**: lush caves (moss, azaleas, glow berries, Axolotls) and dripstone caves (pointed dripstone) |
| **E** | Creatures that live in each biome, achievements, a Journal chapter, Creative tab, final checks |

Then Milestone 17 (Ocean extras) goes into the new oceans.

### 8.3 Part A done (2026-11-21, PUBLISHED 2026-11-21, PR #30)
- **Oceans only in brand-new worlds** (land version 17). Lowering land in older worlds could flood structures that are already planned there (strongholds, villages, campaign towns, temple entrances), so older worlds keep their land exactly as it is.
- About 23% of a new world is sea, up to about 20 blocks deep. The starting area and the three strongholds always stay dry.

### 8.4 Part B done (2026-11-21, PUBLISHED 2026-11-21, PR #30)
- Six woods (spruce, jungle, acacia, dark oak, cherry, mangrove): logs, leaves, planks, saplings, mangrove roots. These are the first blocks numbered above 256.
- For now, the Wanderer sells the saplings. Wild forests of them come with Part C.

### 8.5 Part C done (2026-11-21, PUBLISHED 2026-11-21, PR #30)
- Nine new land biomes: taiga, snowy plains, jungle, savanna, dark forest, swamp, badlands, cherry grove, mushroom fields (plus frozen oceans).
- New worlds get them everywhere. Older worlds get them in 256 × 256 squares nobody has visited or changed (decided once and remembered).
- They never change the land's height, so structures are placed exactly as before.

### 8.6 Part D done (2026-11-21, PUBLISHED 2026-11-21, PR #30)
- Lush caves and dripstone caves, each about 1 in 5 stretches of cave, under new worlds and under the unexplored squares of older worlds.

### 8.7 Part E done: Milestone 20 complete (2026-11-21, PUBLISHED 2026-11-21, PR #30)
- Biome animals and monsters, map colors, “You found…” messages, 6 achievements, a Journal chapter.
- **Next in your order:** back to Milestone 17 (Ocean extras), now that new worlds have real oceans.
- Published 2026-11-21 with the block-limit step (pull request #30).

---

## 9. Milestone 17: Ocean extras (started 2026-11-21)

New worlds now have real seas, so the ocean finally gets filled in. Like Milestone 20, new things appear only in water nobody has visited or changed: brand-new worlds get everything, and worlds made since Milestone 20 get the ocean floor in chunks nobody has been to yet (decided once and remembered).

### 9.1 Parts

| Part | What it adds |
|---|---|
| **A** | **The ocean floor**: kelp (and dried kelp), seagrass, sea pickles, coral reefs in a new **Warm Ocean** (5 corals: blocks, plants, fans, and their dead versions), icebergs in frozen oceans, sponges that soak up water, prismarine blocks and Sea Lanterns. Plants that live underwater keep their water around them. |
| **B** | **Sunken treasure**: shipwrecks, ocean ruins, buried treasure chests, treasure maps, the Heart of the Sea, Nautilus Shells, and the **Conduit** |
| **C** | **Ocean Monuments**: the big prismarine fortress, Guardians and three Elder Guardians (lasers, Mining Fatigue), sponge rooms, the gold vault |
| **D** | **Ocean creatures**: cod, salmon, tropical fish, catching fish (and Axolotls) in buckets, sea turtles (beach eggs, scutes, Turtle Shell helmet), Drowned that can carry **Tridents** (Loyalty, Riptide, Channeling, Impaling), Splashers that lead you to treasure, bubble columns |
| **E** | Achievements, an "Oceans" Journal chapter, Creative tab, sounds, final checks |

Not in this milestone: stairs and slabs (prismarine ones come with the building-blocks milestone, 21).

### 9.2 Part A decisions
- **Water plants** (kelp, seagrass, sea pickles, coral plants and fans) count as water with a plant in it: you swim through them, they look underwater, and breaking one leaves water behind. They can only be placed in water.
- **Coral dies** (turns gray) a few seconds after it's out of water, like Minecraft. Dead coral can't come back to life.
- **Sponges** soak up water up to 7 blocks away (up to 65 blocks of water) and turn into Wet Sponges. Dry a Wet Sponge in a furnace.
- **Warm Ocean** is a new biome name for the sunny, shallow seas with coral reefs. It shows in the Biomes Journal page and on the Explorer's Map.
- Prismarine has no natural home until Ocean Monuments (Part C). Until then you can make it from shards found in Creative, and Part A adds the recipes.

### 9.3 Part A done (2026-11-21, PUBLISHED 2026-11-21)
- Kelp forests, seagrass, coral reefs in the new **Warm Ocean** (5 corals, living and dead), sea pickles, icebergs, sponges, prismarine blocks and Sea Lanterns.
- New worlds get the ocean floor everywhere. Worlds made since Milestone 20 get it in chunks nobody has visited yet; everything already explored stays exactly the same.
- Also fixed: the Grand Desert Temple was skipped in about 1 of every 16 new worlds because another landmark was too close. New worlds now always save room for it.
- **Next:** Part B (shipwrecks, ocean ruins, buried treasure, treasure maps, the Heart of the Sea and the Conduit).

### 9.4 Part B done (2026-11-21, PUBLISHED 2026-11-21)
- Shipwrecks (3 chests each), ocean ruins, buried treasure on beaches with the Heart of the Sea, Treasure Maps that point the way, Nautilus Shells, and the Conduit with Conduit Power.
- **Next:** Part C (Ocean Monuments with Guardians and Elder Guardians, sponge rooms, the gold vault). That's also where prismarine shards and wild sponges come from.

### 9.5 Part C done (2026-11-21, PUBLISHED 2026-11-21)
- Ocean Monuments in big deep seas, with Guardians (lasers), three Elder Guardians each (Mining Fatigue), sponge rooms, and a gold vault. Prismarine shards, crystals and wet sponges now come from Guardians.
- Guardians no longer show up randomly in deep water; they live only in monuments.
- **Next:** Part D (cod, salmon, tropical fish, fish buckets, sea turtles, Drowned with Tridents, Splashers leading to treasure, bubble columns).

### 9.6 Part D done (2026-11-21, PUBLISHED 2026-11-21)
- Salmon food, buckets of fish (and Axolotls), sea turtles with eggs, scutes and the Turtle Shell, Tridents with all 4 trident enchantments, Drowned that throw tridents, Splashers that lead you to treasure, and bubble columns.
- Channeling is in the game but needs thunderstorms, which Blockhaven doesn't have yet.
- **Next:** Part E (achievements, an "Oceans" Journal chapter, Creative tab, sounds, final checks).

### 9.7 Part E done: Milestone 17 complete (2026-11-21, PUBLISHED 2026-11-21)
- 16 Ocean achievements, an "Oceans" Journal chapter, a Creative "Oceans" tab, and new sounds.
- Parts C, D and E published 2026-11-21.
- **Next in the plan:** Milestones 18, 19, 21–24 (see section 6), in whatever order you choose.
