# The Forsaken Mutants: plan and checklist

His request (2026-11-13): add five elite "mutant" mini-bosses to Herobrine's Forsaken World, using his poster as the visual target.

**His decisions (2026-11-13):**
- Names: **Forsaken + Blockhaven's own names** (Forsaken Groaner, Rattler, Hisser, Skitter, Voidwalker).
- **One slice at a time**: he tries each slice and says go before the next.
- **Make the map bigger.** How: the packaged map is only the middle 160 × 160 (−80…79); between it and the bedrock edge wall (128) is a 48-block ring of plain generated hills. The new areas go in that ring as a new version of the outer scenery ("the Outer Reaches"), and the original middle stays byte-for-byte the same, so old saves and the story keep working. Chunks a player already changed out there keep their saved version.

## 1. What the audit found (Phase 1)

**The five ordinary creatures, by Blockhaven's own names** (`js/entities.js`, `SPECIES`):

| Poster name | Blockhaven species | Blockhaven name | Normal health | Proposed mutant name |
|---|---|---|---|---|
| Zombie | `zombie` | Groaner | 20 | Forsaken Groaner |
| Skeleton | `skeleton` | Rattler | 20 | Forsaken Rattler |
| Creeper | `creeper` | Hisser | 20 | Forsaken Hisser |
| Spider | `spider` | Skitter | 16 | Forsaken Skitter |
| Enderman | `voidwalker` | Voidwalker | 40 | Forsaken Voidwalker |

The ordinary creatures stay exactly as they are. The mutants would be new species (ids like `fs_groaner`), so old saves don't change.

**The Forsaken World today** (`js/forsaken.js`, `js/forsaken-author.js`, `maps/forsaken-v1.bin`):
- A small packaged valley, 160 × 160 blocks, dimension `"forsaken"`, story saved in `G.story.fw`.
- Seven landmarks: Arrival Refuge (safe ward), Hollowmere Village, Watchtower, Research Outpost, Deepvein Mine, Pale Wood Grove (the corrupted forest), the Pale Citadel (Herobrine's fight).
- Wards (refuge, restored shrines, Ward Candles) already stop anything from forming inside them. Herobrine's "director" already gives 90 quiet seconds on every arrival.
- Monsters there today: ordinary night spawns at half the normal limit, plus Pale Sentinels during hunts and in the citadel fight.
- The map is a released template, so the rules in AGENTS.md say not to rebuild it. New things get placed at runtime, the same way the campaign adds its towns.

**Where each mutant would live (using the existing places):**
- Forsaken Groaner: Hollowmere Village, the gravel roads, edges of the Pale Wood.
- Forsaken Rattler: the Watchtower hill, the Citadel's outskirts (never inside the boss arena).
- Forsaken Hisser: around the Research Outpost (new lore: Herobrine's "experiments" there) plus small scorched clearings.
- Forsaken Skitter: Deepvein Mine and the Pale Wood Grove, with web nests added.
- Forsaken Voidwalker: the Citadel's outskirts and a small ring of ruined "void" stones near it.

**Systems already in the game that the mutants would reuse:**
- Boss fights with warnings, floor hazards, a boss health bar, and fair "stand here" telegraphs (`js/campaign-bosses.js`, the `#bossbar`).
- Explosions that respect protected blocks, the poison/wither style effects, arrows, climbing (Skitters already climb).
- Graphics quality setting (fast / fancy), reduced motion, sound volume settings. Sounds are made by code (`js/audio.js`), not sound files.
- Achievements (`js/advancements.js`), the journal (J key in the Forsaken World), loot through `giveItem`.
- Multiplayer guests can't travel to the Forsaken World, so no multiplayer changes are needed.

**Honest limits:**
- Blockhaven's renderer is flat (no real lighting or shadows). The mutants will be detailed block models with glowing eyes and cracks, moving parts, and particles, but they won't look exactly like the poster's painted lighting.
- The poster itself looks like AI art of Minecraft's mobs. It's fine as a style guide, but it shouldn't be put on the website.

## 2. Build order (one slice at a time, each tested before the next)

- [x] **Slice 1: shared base + Forsaken Groaner.** Built and browser-tested 2026-11-13, **not published** (details and test list in FEATURES.md). New file `js/mutants.js`; small hooks in entities.js (species, maxHp, damage, kill, dying, animate, glow material cleanup), main.js (init after CP, tick, boss bar), blocks.js (items 624–626), index.html (import map `mutants-1`, green `#bossbar.mutant`). Waiting for his hand-played try before Slice 2.
  - Hooks other mutants reuse: `def.mutant` + `ai: "mutant"` → `ents.bossAI.mutant`, `ents.mutantHit`, `ents.mutantKilled`; parts with `glow: true` use a separate full-bright material; `e.mutHp` = difficulty-scaled max health; encounters listed in `ENCOUNTERS`, settings in `MUTANT_CONFIG`.
  - Test tricks: `G.mutants._test.spawn("groaner")`, `G.mutants._test.ambientNow()`, `G.mutants.data()`; the test pane keeps flipping `G.state` to "pause", so set it to "play" before every driven frame; `G.respawnGuard > 0` also holds the mutant grace at 20 s.
- [x] **Slice 2: Forsaken Rattler + Forsaken Skitter.** Built and browser-tested 2026-11-13, **not published** (details in FEATURES.md). Shared helpers added: `awareness()` (notice / lose you / wards), `callCheck()`, `lob()` flying effects, web patches with `MU.slow()` (main.js multiplies `p.speedMul` in the Forsaken World), per-species `baseHp`, `puff`, `dieTint`, `comeback`/`enrage` flags. Encounters: tower-archer, grove-nest, mine-nest. Limits: no ceiling walking (engine), webs are ground patches rather than blocks (no cobweb block exists), egg clusters wait for Slice 4's new areas.
  - Test gotchas: keep `__T` ahead of `performance.now()` or animations freeze (dt = 0); the player's half-second hurt protection means rapid arrows only land once, so the volley spaces its arrows.
- [x] **Slice 3: Forsaken Hisser + Forsaken Voidwalker.** Built and browser-tested 2026-11-13, **not published** (details in FEATURES.md). New: `def.finale` (Hisser's three-ring final blast, smother with 12% damage), toxic pools (`addPool`), `blinkTo`/`tickBlink` teleports with a spark warning, `fs_shadow` clones (`def.clone`, excluded from `alive()`), `enrageAt`, `findSpot(..., { tall })`, Herobrine's arena clears mutants. Encounters: outpost-lab, citadel-watch. The gravity pull moves the player directly (the ground grip cancels pushes).
- [x] **Slice 4: the Outer Reaches + rewards.** Built and browser-tested 2026-11-13, **not published** (details in FEATURES.md). `js/forsaken-reaches.js` (REACHES list, `applyReaches(cx, cz, data)` called from ForsakenGen.generate; `MU.prepareReaches(gen, data)` in makeWorld records `reachesV` + `reachesSkip` = ring chunks with player changes before the update). Notes registered in `G.story.fw.extraNotes` and added to NOTES at runtime. Journal page via `MU.bestiaryHTML()` appended to `F.journalHTML`; seen moves in `fw.mutants.abil`, trophies in `fw.mutants.trophies`, places in `fw.mutants.reach`. Achievements fs_mutant, fs_five, fs_trophies, fs_reaches (events "mutant", "fstrophy", "reach"). 8 recipes. Limits: journal map shows only the core; a half-changed area in an old world can look half-built.
- [x] **Slice 5: balance + checks.** Done 2026-11-13 (results and the publish list in FEATURES.md). Settings option `fwMutants` (normal / rare / off). Voidwalker softened after scripted fights. Live site checked identical to the starting copies.
- [ ] Publish only after he says so.

## 3. Fairness rules for every mutant

- Health about 3–6 times the ordinary creature, scaled by difficulty; numbers tuned in Slice 5.
- Every big attack has a warning (sound + a visible glow or ground marker) long enough to step away.
- Summons are capped (no more than a few helpers alive at once), the Groaner's comeback happens only once, clones vanish on a timer.
- No attack that can kill from full health without a warning; no stun that can chain forever.
- Never forms inside a ward, near the refuge, or during the quiet start; never during the Herobrine fight.
- Explosions don't break protected blocks or the map's story blocks.
