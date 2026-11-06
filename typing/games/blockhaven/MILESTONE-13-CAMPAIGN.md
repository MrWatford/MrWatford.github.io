# Milestone 13: Blockhaven: The Legacy Campaign (design + integration plan)

Status: written 2026-11-05 from Mr. Watford's "Legacy Campaign" spec. **Parts A (foundation) and B (Legacy Village) built, browser-tested, and published 2026-11-05. Parts C (Waystones) and D (Chapters 1–3) built and browser-tested 2026-11-05, not published.** Details in FEATURES.md.

## 1. What already exists (audit)

| Spec asks for | What Blockhaven already has | Where | State |
|---|---|---|---|
| Desert Temple | Sunken Pyramid of Aurelis, its own dimension `desert` (statue gallery, glyph puzzle, flame corridor, sand pit, Mirror Court, 12 caches) + Solar Colossus guardian + Solar Seal relic | `js/lost-temples.js`, `maps/desert-v1.bin` | Done |
| Jungle Temple | Verdant Labyrinth, dim `jungle` (hedge maze, Grove of Bells, spore vents, waterfall cave, 13 caches) + Verdant Colossus + Verdant Lens | `js/lost-temples.js`, `maps/jungle-v1.bin` | Done |
| Sea Temple | Sea temple, dim `sea` (lighthouse entrance, flooded halls) + Abyssal Regent + Tidal Heart | `js/lost-temples.js`, `maps/sea-v1.bin` | Done |
| Wither | **Blightking** (summoned from Wailing Sand + 3 Blight Skulls, armor phase, Radiant Star) | `js/entities.js` | Done, no arena or story |
| Nether Dragon | **Cindermaw** in the Cinder Citadel (pylons, phases, victory scene, Ember Heart) | `entities.js` `thinkCinder`, `worldgen.js` `NetherGen.citadelPiece` | Done |
| Herobrine | **Forsaken World** adventure (director AI, 13 notes, 3 sigils, shrines, Pale Citadel finale) | `js/forsaken.js`, `maps/forsaken-v1.bin` | Done |
| Ancient City + Warden | **Echohold**, 12 districts in dim `deep` (hushmoss, sound stealth, puzzles, 38 caches, 17 tablets) + **First Warden** | `js/lost.js`, `maps/deep-v1.bin` | Done |
| Ancient City portal + dimension + boss | **First Gate** → **Echo Expanse** (dim `expanse`) + **Resonant Sovereign** | `js/lost.js`, `maps/expanse-v1.bin` | Done |
| End Dragon | **Hollow Wyrm** in **the Hollow** (crystals, phases, egg, gateway) | `entities.js`, `EndGen` | Done |
| Villages and NPCs | Villagers with 5 jobs, day/night schedules, trading, Ironwarden, bells | `entities.js` | Done (no dialogue or quests) |
| Journal | J journal with Forsaken World and Lost Civilization tabs | `forsaken.js`, `lost.js` | Done |
| Map | Explorer's Map (M), landmarks, waypoint (N) | `js/starter.js` | Done |
| Separate saves | IndexedDB worlds with per-dimension saves; `story` object per world | `js/save.js`, `main.js` | Done |
| A "campaign mode" | Only a gate switch inside Echohold (temple relics only) | `lost.js` | Small; will be folded in |
| Hand-built maps | Packed map files + build tools with automatic walkability checks | `js/maps.js`, `tools/*-build.html` | Done, reusable |

Everything new will reuse the packed-map system: each new place is planned in an "author" file, built once with a tools page that checks it can be walked through, and shipped as a small `.bin` file that loads chunk by chunk.

## 2. How the existing pieces become the eight chapters

Proposed (pending Mr. Watford's choices in section 5):

| Chapter | Existing content used | New content needed | Relic |
|---|---|---|---|
| 1 The Awakening | Desert temple + Solar Colossus | Legacy Village, Stonehaven, watchtower, raid, mine, Stone Guardian, Sandspire, boss role for the Colossus | Earth |
| 2 The Lost Jungle | Jungle temple + Verdant Colossus | Oakwood, jungle village, 3 keys | Nature |
| 3 Secrets Beneath the Sea | Sea temple + Abyssal Regent | Seabreak, shipwreck, breathing gear | Tides |
| 4 Curse of the Blight | Blightking | Ironhold, corrupted mines, citadel arena, summoning ritual as a quest | Decay |
| 5 Dragon of the Embers | Ember Depths, Cinder Citadel, Cindermaw | Expedition outpost, 3 dragon seals, lore | Flame |
| 6 The Shadow of Herobrine | Forsaken World, Herobrine finale | Haunted village + lab on the campaign Surface as the way in | Shadows |
| 7 The Ancient City | Echohold, First Warden, First Gate, Echo Expanse, Resonant Sovereign | Herobrine's key, campaign story hooks | Abyss |
| 8 The End of the First Builders | Stronghold, Hollow, Hollow Wyrm | Skyreach + Sky Sovereign, Ruined Capital, Forgotten King (4 phases), ceremony, credits | Void |

Rule: existing places keep their maps, puzzles, loot, and fights. The campaign only adds quest triggers, story notes, NPC dialogue, and a relic reward on top.

## 3. Build order (one milestone part at a time, each browser-tested before it ships)

- **Part A: campaign foundation.** "Legacy Campaign" button on the title screen; campaign worlds are a separate world type (`meta.campaign`) in the same world list (survival saves untouched); fixed campaign seed; quest engine (chapters, objectives, auto-updating triggers); Quest tab in the journal; quest markers on the Explorer's Map; difficulty choice; progress shown on the world card.
- **Part B: Legacy Village.** Packed map: fountain spawn, floating BLOCKHAVEN letters, grand castle, blacksmith, farm, barn, library, enchanting tower, market, watchtowers, arena, mine entrance, dock, stable, homes, secret passages; furnished interiors and starter chests; Village Elder with dialogue; skippable tutorial.
- **Part C: NPC dialogue + waystones** (named NPCs, dialogue boxes, quest givers, fast travel between discovered waystones).
- **Part D: Chapters 1–3** (Stonehaven, Sandspire, Oakwood, Seabreak + hooks into the three temples + Stone Guardian).
- **Part E: Chapters 4–6** (Ironhold + Blightking citadel, Ember Depths hooks, Herobrine hooks).
- **Part F: Chapter 7** (Echohold hooks).
- **Part G: Chapter 8** (Skyreach, Sky Sovereign, Ruined Capital, Forgotten King, ending, credits).
- **Part H: optional bosses, side quests, Frostholm, polish, full playthrough test.**

## 4. Honest limits

- This is the biggest project Blockhaven has had: roughly 8 milestone parts, several work sessions each.
- The "20–30 hours" target depends on how much content each part gets; the first parts will be shorter.
- Huge castles are possible (packed maps already hold whole cities), but the world is limited by the browser: cities load chunk by chunk, and Chromebooks need modest view distances.
- New bosses get blocky models like Cindermaw's, not detailed models.

## 5. Decisions for Mr. Watford

Answered 2026-11-05:
- **Names:** the campaign uses Blockhaven's own names everywhere (Blightking, First Warden, Hollow Wyrm, Cindermaw, the Hollow, the Ember Depths, Echohold, Echo Expanse). Herobrine stays (already in the game). Chapter 4 is "The Curse of the Blightking", Chapter 5 "Dragon of the Embers".
- **Chapter 4 boss look:** he'd like a huge, story-sized Blightking (he mentioned the giant one from Minecraft: Story Mode). We'll make an original giant final form, the **Blight Tempest**: the Blightking grows by pulling loose blocks into a swirling body. It gets its own design (not a copy of that character's look: no three-headed tentacle design or purple beam).
- **Temple bosses:** add three NEW bosses (Desert Pharaoh, Jungle Titan, Ocean Leviathan) in new throne rooms; the existing guardians stay as they are.
- **First session:** Part A (foundation) + Part B (Legacy Village).
- **Audience:** students: spooky but not graphic, short readable dialogue, fair difficulty.
