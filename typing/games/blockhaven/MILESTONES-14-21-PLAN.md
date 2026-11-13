# Blockhaven: the next big batch (Milestones 14–21)

**Written:** 2026-11-12
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
| 1 ✔ built 2026-11-12 | **12 Part E: Redstone finish** | Finishes the Sparkworks: 11 advancements, "Mechanisms" Creative tab, "Sparkworks" guide chapter with 12 example builds, sounds pass | Medium |
| 2 | **14: Smaller gaps** | Leads, name tags, horse armor, donkeys and mules (with chests), more horse colors, pet breeding, summoning the Hollow Wyrm again, ships at the Hollow towers, creatures going through portals, Hogbeasts turning "rotten" in the Surface world | Medium |
| 3 | **15: Enchanting and repair** | Enchanting Table, bookshelf power, XP finally gets spent, ~27 enchantments that really work (curses included), enchanted books, Anvil, Grindstone, shiny "glint" on enchanted items | Large |
| 4 | **16: Brewing and potions** | Brewing Stand, Cauldron, sugar cane and melons as real plants, ~15 potions + longer/stronger versions, splash and lingering potions, ~10 new status effects, recipe guide | Large |
| 5 | **17: Ocean extras** | Prismarine blocks, Sea Lanterns, Ocean Monuments with Guardians, shipwrecks, ocean ruins, treasure maps and buried treasure, coral reefs, sponges, Conduits, fish in buckets, Splashers leading you to treasure | Large |
| 6 | **18: The world, part 1** | Flowing water and lava, water + lava makes cobblestone/stone/obsidian, falling sand and gravel, fire spreading (with a setting), leaf decay, plants that need support, crops needing water, waterlogging | Large |
| 7 | **19: The world, part 2** | Rain, snow, thunderstorms, lightning and its creature changes, snow building up, freezing and melting, sleeping through storms | Medium |
| 8 | **20: The world, part 3** | New biomes (swamps, savannas, badlands, cherry groves, dark forests, snowy plains, mushroom islands, deep oceans, lush caves, dripstone caves) in **unexplored land only** | Large |

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
- **Enchanting Table** (crafted from 4 obsidian, 2 Lapis, and a book).
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
