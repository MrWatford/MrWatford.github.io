# BLOCKHAVEN: THE LEVIATHAN EXPANSION
## Complete Claude Code Development & Implementation Prompt

### YOUR MISSION

You are working directly on my existing browser-based, Minecraft-inspired game, **BlockHaven**, hosted through my Mr. Watford GitHub Pages website.

I want you to design, develop, integrate, test, and prepare for deployment an enormous new expansion called:

**BLOCKHAVEN: THE LEVIATHAN EXPANSION — SECRETS BENEATH THE SANDS**

This expansion introduces three gigantic desert Leviathans, an immersive sandstorm system, legendary boss encounters, taming mechanics, rideable creatures, special armor and weapons, expanded desert temples, an ancient lost civilization, and an entirely new underground desert dimension.

The inspiration comes from the enormous sandworms and mysterious desert atmosphere of Dune, but the creatures, environments, lore, names, designs, and mechanics must be original to BlockHaven.

This is not a prototype. The goal is a polished, fully playable expansion integrated into the actual game.

**IMPORTANT: You have access to my existing GitHub repository and game code. Inspect the entire relevant codebase before implementing anything. Do not replace or rebuild BlockHaven from scratch. Extend the existing systems and reuse existing infrastructure wherever possible.**

---

# PART 1 — REPOSITORY INSPECTION AND INTEGRATION

Before writing implementation code:

1. Locate the BlockHaven game and identify its actual entry point, rendering engine, world-generation system, and file structure.
2. Inspect existing mobs, boss AI, combat mechanics, animations, physics, terrain generation, block destruction, inventory, crafting, and equipment.
3. Identify how existing dimensions or worlds are loaded, saved, and transitioned between.
4. Inspect the existing Desert Temple, Ancient City, Jungle Temple, Sea Temple, and any related world-generation structures.
5. Examine the game's existing sound system, particle effects, weather, lighting, and camera behavior.
6. Determine whether the game uses Three.js, Babylon.js, custom WebGL, canvas rendering, or another technology.
7. Identify the actual GitHub Pages deployment workflow.
8. Review mobile, keyboard, mouse, and controller support if those systems exist.
9. Identify existing save compatibility requirements and any relevant tests.

Do not assume that a particular framework, folder, API, or game system exists.

**Integration requirements:**

- Preserve Survival Mode and Creative Mode.
- Preserve existing worlds, inventories, structures, mobs, and boss encounters.
- Do not remove existing temples or overwrite previously developed content.
- Integrate new mobs with the existing spawn and AI architecture.
- Integrate new items with existing inventory, crafting, loot, and equipment systems.
- Integrate the underground dimension with the existing world-selection and dimension-loading systems.
- Maintain compatibility with existing save files.
- Avoid duplicating existing systems.
- Keep the game playable during development.

First establish an implementation plan based on the real repository, then begin development.

---

# PART 2 — THE THREE LEGENDARY LEVIATHANS

Create three visually distinct, fully animated, gigantic desert creatures.

These should feel like living world bosses rather than oversized versions of ordinary mobs.

All three must have original BlockHaven creature designs.

## LEVIATHAN #1: THE DUNE LEVIATHAN

**Classification:** Legendary Desert Mini-Boss  
**Habitat:** Large desert biomes  
**Difficulty:** Challenging  
**Tameable:** Yes  
**Encounter:** Rare environmental event

### Appearance

The Dune Leviathan is an enormous subterranean creature with:

- A long, segmented body.
- Golden sandstone-colored armored scales.
- A massive circular mouth with multiple rows of teeth.
- Large armored plates along its back.
- Glowing amber markings.
- A thick, muscular body capable of tunneling.
- Sand particles falling from its armor.
- An intimidating silhouette visible above dunes.
- Distinct animations for burrowing, turning, attacking, roaring, and surfacing.

The creature should look enormous compared with the player.

Suggested dimensions, subject to actual game scale:

- Length: approximately 45–65 blocks.
- Diameter: approximately 7–10 blocks.
- Emergence height: approximately 15–25 blocks.

Use a segmented mesh or compatible voxel model with smooth coordinated motion.

Avoid making the worm appear as a rigid cylinder sliding through the ground.

### Encounter System

The Dune Leviathan should not appear constantly.

Create a rare encounter system using suitable desert conditions.

Possible triggers:

- Running repeatedly across deep sand.
- Mining beneath certain desert dunes.
- Exploring ancient desert ruins.
- Using a special vibration-producing device.
- Entering a designated Leviathan territory.

The creature should respond to ground vibrations.

Walking carefully or remaining stationary should reduce the chance of attracting it.

The encounter begins with:

1. Distant rumbling.
2. Sand particles rising.
3. Subtle camera shaking.
4. Nearby animals fleeing.
5. Increasing wind.
6. A deep roar.
7. A large moving disturbance beneath the sand.
8. A dramatic eruption from the ground.

Display a boss health bar only after the encounter becomes hostile.

### Combat Abilities

**Attack 1 — Sand Eruption**

The worm erupts beneath the player, launching sand and dealing area damage.

**Attack 2 — Tail Sweep**

A massive body segment sweeps across the surface.

**Attack 3 — Sand Vortex**

The creature creates a localized sand tornado that slows players and damages them over time.

**Attack 4 — Devouring Strike**

The worm opens its mouth and attempts to swallow the player.

Provide a clear warning and an opportunity to escape.

**Attack 5 — Underground Pursuit**

The creature tunnels beneath the sand and tracks player movement.

### Boss Phases

Phase 1: Underground Hunt — 100% to 75% health.

Phase 2: Surface Assault — 75% to 50%.

Phase 3: Sandstorm Fury — 50% to 25%.

Phase 4: Final Rampage — 25% to 0%.

Each phase must introduce meaningful changes in behavior.

### Defeat Rewards

Defeating the Dune Leviathan grants materials used to craft the legendary Sand Warrior equipment.

Potential drops:

- Leviathan Scales.
- Leviathan Fang.
- Sandstorm Essence.
- Ancient Desert Core.
- Leviathan Trophy.

Rewards should be balanced for Survival Mode.

---

# PART 3 — LEVIATHAN #2: THE OBSIDIAN LEVIATHAN

**Classification:** Legendary Volcanic Desert Boss  
**Habitat:** Volcanic deserts, scorched dunes, and magma caverns  
**Difficulty:** Very Hard  
**Tameable:** Yes, through an advanced quest

### Appearance

The Obsidian Leviathan must look significantly different from the Dune Leviathan.

Visual characteristics:

- Jet-black segmented armor.
- Glowing red-orange cracks.
- Molten veins beneath its scales.
- Large obsidian spikes.
- Smoke rising from its body.
- Fiery eyes or glowing sensory organs.
- Burning particles during movement.
- An enormous jaw surrounded by jagged obsidian teeth.

Suggested dimensions:

- Length: 65–85 blocks.
- Diameter: 9–13 blocks.

### Unique Abilities

**Magma Eruption:** Creates temporary lava hazards.

**Obsidian Shrapnel:** Fires jagged projectiles.

**Scorched Earth:** Temporarily transforms portions of the battlefield into dangerous terrain.

**Molten Burrow:** Travels beneath scorched sand and volcanic stone.

**Inferno Roar:** Sends out a powerful heat shockwave.

### Boss Arena

Generate a rare volcanic desert region featuring:

- Black sand.
- Obsidian formations.
- Lava pools.
- Ash storms.
- Underground magma chambers.
- Ruined obsidian temples.
- Glowing volcanic crystals.

The Obsidian Leviathan should occasionally emerge from lava-filled caverns.

### Rewards

Defeating it grants:

- Obsidian Leviathan Scales.
- Molten Heart.
- Inferno Fang.
- Volcanic Essence.
- Obsidian Leviathan Trophy.

These materials unlock the Obsidian Warden armor set.

---

# PART 4 — LEVIATHAN #3: THE ANCIENT LEVIATHAN

**Classification:** Ultimate Legendary Desert Boss  
**Habitat:** Secret underground desert dimension  
**Difficulty:** Extreme  
**Tameable:** No — but it can grant a unique companion reward

This should be the most impressive creature in the entire expansion.

### Appearance

The Ancient Leviathan is an enormous prehistoric-looking creature.

Visual features:

- Pale bone-colored armored segments.
- Ancient fossil-like plates.
- Glowing blue or violet runes.
- Massive skeletal ridges.
- An enormous circular mouth.
- Ghostly particles surrounding its body.
- Ancient markings embedded into its armor.
- A distinctive crown-like arrangement of horns.
- A glowing core visible during certain attacks.

Suggested dimensions:

- Length: 100–140 blocks.
- Diameter: 14–20 blocks.

Because of its size, design its animations, collision, rendering, and combat arena specifically to accommodate it.

### Boss Mechanics

The Ancient Leviathan should have five phases.

**Phase 1 — Awakening**

The creature rises from beneath an enormous ancient arena.

**Phase 2 — The Buried King**

It summons smaller sand creatures and attacks with giant shockwaves.

**Phase 3 — The Shattered Earth**

It destroys selected sections of the arena, creating hazardous terrain.

**Phase 4 — Ancient Fury**

It unleashes powerful magical attacks using ancient energy.

**Phase 5 — The Final Judgment**

The creature becomes extremely aggressive, and the arena begins collapsing.

Provide clear attack telegraphs and fair recovery windows.

### Victory Rewards

Defeating the Ancient Leviathan grants:

- Heart of the Ancient.
- Ancient Leviathan Crown.
- Eternal Sand Core.
- Legendary boss trophy.
- Ancient Guardian Armor crafting materials.
- A unique Ancient Leviathan companion egg or summoning relic.

The companion must be a smaller, original creature with balanced abilities, not a fully controllable version of the enormous final boss.

---

# PART 5 — THE TAMING SYSTEM

Players must be able to choose between defeating and taming the first two Leviathans.

Taming must be a genuine quest, not a simple interaction.

## The Dune Leviathan Taming Quest

Quest name:

**THE CALL OF THE SANDS**

Requirements:

1. Discover a rare Desert Shrine.
2. Locate an ancient inscription describing the Leviathans.
3. Collect three Leviathan Relics from desert structures.
4. Craft the Sandcaller Horn.
5. Locate a Dune Leviathan.
6. Survive its initial encounter.
7. Perform a special taming sequence using the relics.
8. Successfully bond with the creature.

### Taming Encounter

During taming, the player must avoid attacking the Leviathan.

The player must instead:

- Dodge its attacks.
- Use the Sandcaller Horn at specific moments.
- Activate relics during exposed vulnerability windows.
- Survive until the creature recognizes the player.

After successful taming, play a dramatic animation showing the creature lowering its head.

Display:

**LEGENDARY BOND FORMED — THE DUNE LEVIATHAN IS YOURS**

## The Obsidian Leviathan Taming Quest

Quest name:

**HEART OF THE INFERNO**

This must be significantly harder.

Require exploration of volcanic ruins, collection of special materials, and survival of a unique volcanic taming ritual.

The player must earn the creature's trust without killing it.

### Tamed Leviathan Features

Both tameable Leviathans should support:

- Custom names.
- Summoning and dismissal.
- A dedicated saddle or riding equipment.
- Health and status information.
- Basic commands.
- Rideable surface movement.
- Underground travel.
- Unique attacks.
- Persistent ownership.
- Save/load compatibility.

### Sandcaller Horn

Create an actual usable inventory item.

When activated in a suitable desert biome:

1. Play a deep horn sound.
2. Create a sand disturbance.
3. Trigger a rumbling effect.
4. Summon the player's bonded Leviathan.
5. Play an emergence animation.

The horn should have a meaningful cooldown.

Prevent summoning inside buildings, small caves, protected areas, or locations where the creature cannot safely appear.

Players must not be able to summon multiple copies of the same bonded creature.

### Riding Mechanics

The Leviathan should feel extraordinary to ride.

Features:

- Smooth movement across sand.
- High-speed dune traversal.
- Third-person riding camera.
- Sand particles trailing behind the creature.
- A controlled underground burrow ability.
- A dramatic emergence animation.
- A limited combat ability.
- Smooth dismounting.

Underground travel should use safe pathfinding and visual transitions rather than indiscriminately destroying terrain.

Protect player-built structures and important world landmarks.

---

# PART 6 — LEGENDARY ARMOR AND WEAPONS

Create three distinct equipment sets.

Each set must have its own appearance, crafting materials, attributes, and abilities.

## SET #1 — SAND WARRIOR ARMOR

Crafted using Dune Leviathan materials.

Pieces:

- Sand Warrior Helmet.
- Sand Warrior Chestplate.
- Sand Warrior Leggings.
- Sand Warrior Boots.

Visual design:

Golden sandstone armor with amber accents, layered plates, and ancient desert symbols.

### Set Bonuses

Two pieces:

Reduced sandstorm movement penalties.

Four pieces:

- Sandstorm resistance.
- Increased movement speed on sand.
- Reduced damage from sand-based attacks.
- Sand Shockwave special ability.

### Weapon: Leviathan Fangblade

A powerful desert sword forged from a Leviathan Fang.

Special ability:

Creates a short-range wave of sand that damages and knocks back enemies.

## SET #2 — OBSIDIAN WARDEN ARMOR

Crafted from Obsidian Leviathan materials.

Appearance:

Black armor with glowing molten cracks and reinforced volcanic plates.

### Set Bonuses

Two pieces:

Reduced damage from fire and heat.

Four pieces:

- Strong fire resistance.
- Increased protection against volcanic attacks.
- Temporary molten shield ability.
- Increased melee damage against certain desert enemies.

### Weapon: Inferno Greatblade

A heavy weapon with a molten core.

Special ability:

Creates a controlled fiery shockwave.

## SET #3 — ANCIENT GUARDIAN ARMOR

Crafted from Ancient Leviathan materials.

This should be the most prestigious armor in the expansion.

Appearance:

Pale bone-colored armor with glowing blue-violet runes and a crown-like helmet.

### Set Bonuses

Two pieces:

Resistance to underground desert hazards.

Four pieces:

- Increased protection.
- Ancient energy shield.
- Reduced damage from Leviathan attacks.
- A limited-use ancient energy burst.

### Weapon: Scepter of the Buried King

A legendary magical weapon.

Special ability:

Summons a temporary line of ancient energy spikes from the ground.

### Balancing Requirements

All armor and weapons must:

- Have meaningful crafting costs.
- Fit the existing combat system.
- Use the existing equipment slots.
- Display accurate tooltips.
- Support durability if the game uses durability.
- Avoid making existing late-game equipment obsolete without reason.
- Work properly after saving and reloading.

---

# PART 7 — THE GREAT SANDSTORM SYSTEM

Create an immersive weather system for desert biomes.

Sandstorms should be visually dramatic and mechanically meaningful.

## Sandstorm Stages

### Stage 1 — Rising Winds

- Wind sounds increase.
- Loose sand particles move across the ground.
- The sky becomes hazy.
- Distant visibility decreases slightly.

### Stage 2 — Active Sandstorm

- Dense blowing sand.
- Reduced visibility.
- Stronger wind audio.
- Sand particles colliding with surfaces.
- Slight movement penalties.
- Increased danger from desert mobs.

### Stage 3 — Severe Sandstorm

- Dramatically reduced visibility.
- Strong winds.
- Sand vortex hazards.
- Occasional lightning-like atmospheric effects where appropriate.
- More aggressive desert creatures.
- Increased chance of Leviathan activity.

### Stage 4 — Leviathan Storm

A special rare event.

The sky darkens.

The wind intensifies.

The ground shakes.

A deep roar echoes across the desert.

A Leviathan may emerge.

Display a subtle notification:

**SOMETHING ANCIENT STIRS BENEATH THE SANDS...**

### Performance Requirements

Sandstorms must use efficient particle systems, distance-based rendering, and adjustable graphics settings.

Do not generate excessive individual particles or unnecessary terrain updates.

Ensure players can still navigate and survive during severe weather.

---

# PART 8 — NEW DESERT MOBS

Create a small ecosystem of original hostile and neutral desert creatures.

## 1. Sand Stalkers

Fast hostile creatures that partially hide beneath the sand.

They ambush players traveling across dunes.

## 2. Dune Scarabs

Large armored beetles.

Some are neutral; others become hostile when disturbed.

They occasionally drop useful crafting materials.

## 3. Sand Wraiths

Mysterious spectral creatures found near ancient ruins.

They appear more frequently during severe sandstorms.

## 4. Desert Burrowers

Smaller worm-like creatures that tunnel through sand.

They provide an early introduction to subterranean enemies.

## 5. Ancient Sentinels

Stone guardians found inside temples.

They defend valuable relics and ancient mechanisms.

## 6. Obsidian Crawlers

Volcanic creatures that inhabit scorched deserts and magma caverns.

## 7. Tomb Guardians

Undead-style fantasy enemies that protect ancient burial chambers.

Keep all enemy designs suitable for a Christian school audience.

Avoid graphic gore, profanity, or excessively disturbing imagery.

Each mob must have:

- Original visual design.
- Actual AI behavior.
- Appropriate animations.
- Combat statistics.
- Spawn conditions.
- Loot drops.
- Sound effects.
- Collision handling.
- Survival and Creative Mode compatibility.

---

# PART 9 — EXPAND THE EXISTING DESERT TEMPLE

BlockHaven already contains a developed Desert Temple.

**Do not replace it. Upgrade and extend it.**

Create additional chambers, secret passages, lore discoveries, traps, and new quest connections.

## Temple Expansion Features

### The Hall of the Buried Kings

A large chamber containing ancient statues and inscriptions.

### The Leviathan Mural Chamber

Wall art depicting the three legendary Leviathans.

### The Chamber of Echoes

A puzzle room where players must activate mechanisms in the correct order.

### The Sandfall Trap

A chamber where sand pours from the ceiling and players must escape.

### The Scarab Vault

A treasure chamber guarded by giant scarabs.

### The Forgotten Library

Contains books and clues about the ancient civilization.

### The Leviathan Altar

A special structure used in the taming quest.

### The Sealed Gateway

A hidden portal chamber leading toward the underground desert dimension.

The temple should contain valuable loot, but the most powerful items must require meaningful exploration and progression.

---

# PART 10 — NEW DESERT STRUCTURES

Generate additional structures throughout desert biomes.

## Structure 1 — Leviathan Graveyard

A rare region containing gigantic fossilized worm skeletons.

Features:

- Massive rib-like bone formations.
- Buried treasure.
- Fossil mining resources.
- Hidden underground chambers.
- Ancient inscriptions.
- Occasional hostile mobs.

## Structure 2 — Abandoned Desert City

A ruined sandstone settlement partially buried beneath dunes.

Include:

- Collapsed buildings.
- Watchtowers.
- Marketplaces.
- Underground tunnels.
- Secret treasure rooms.
- Ancient libraries.
- Enemy patrols.

## Structure 3 — Desert Shrine

A smaller structure connected to the taming quest.

Contains one of the required relics.

## Structure 4 — Obsidian Citadel

A large fortress within the volcanic desert.

Features:

- Lava hazards.
- Obsidian enemies.
- Treasure vaults.
- Puzzle chambers.
- A major Obsidian Leviathan encounter.

## Structure 5 — Buried Royal Tomb

An underground dungeon with multiple chambers.

Contains lore, traps, guardians, and valuable equipment.

## Structure 6 — The Great Dune Observatory

An ancient structure that allows players to discover Leviathan territories and clues to the underground realm.

### World Generation Requirements

All structures must:

- Generate naturally in appropriate biomes.
- Avoid overlapping existing important structures.
- Use deterministic world seeds where supported.
- Avoid spawning inside player-built structures.
- Preserve existing generated worlds.
- Support exploration and loot persistence.
- Include appropriate collision and lighting.

---

# PART 11 — SECRET DIMENSION: THE HOLLOW SANDS

Create an entirely new explorable underground dimension called:

**THE HOLLOW SANDS**

This is the greatest discovery in the expansion.

The Hollow Sands is an enormous hidden subterranean desert world beneath an ancient civilization.

It must feel like a completely different realm.

## Visual Atmosphere

Imagine a gigantic underground world containing:

- Enormous caverns stretching into darkness.
- Mountains of pale sand.
- Glowing blue and purple crystals.
- Ancient ruined cities.
- Giant fossilized Leviathan skeletons.
- Underground sand waterfalls.
- Vast subterranean lakes.
- Glowing fungal forests.
- Massive stone pillars.
- Ancient temples.
- Collapsed bridges.
- Buried palaces.
- Mysterious glowing runes.
- Enormous underground dunes.
- Ancient statues.
- Abandoned mining settlements.

The ceiling should feel incredibly high, with dramatic lighting and atmospheric fog.

## Unique Biomes

### Biome 1 — The Pale Dunes

An enormous underground desert of white and silver sand.

### Biome 2 — Crystal Wastes

A region filled with glowing crystals and dangerous ancient energy.

### Biome 3 — The Bone Fields

A vast graveyard of fossilized Leviathans.

### Biome 4 — The Forgotten Kingdom

The ruins of a once-powerful civilization.

### Biome 5 — The Abyssal Sands

A dark, dangerous region near the Ancient Leviathan's territory.

### Biome 6 — The Eternal Oasis

A rare peaceful sanctuary containing underground water, vegetation, and valuable resources.

## Unique Environmental Mechanics

- Occasional underground sandstorms.
- Falling sand hazards.
- Collapsing ancient structures in designated encounters.
- Crystal-based puzzles.
- Hidden passageways.
- Ancient mechanisms.
- Special underground enemies.
- Unique ores and crafting materials.
- Environmental storytelling.

The dimension should be large enough for substantial exploration.

Use procedural generation and chunk streaming where supported.

Do not attempt to load the entire dimension simultaneously.

---

# PART 12 — ENTERING THE HOLLOW SANDS

The dimension must be unlocked through gameplay.

## Quest: THE GATE OF THE FORGOTTEN

Players must:

1. Discover the upgraded Desert Temple.
2. Locate ancient inscriptions.
3. Find three scattered Leviathan Relics.
4. Solve the temple's central puzzle.
5. Recover the Ancient Desert Core.
6. Activate the Sealed Gateway.
7. Enter the Hollow Sands.

### Portal Appearance

Create an ancient sandstone portal surrounded by glowing runes.

When activated:

- Runes illuminate.
- Sand begins floating upward.
- The portal emits a deep humming sound.
- Ancient symbols rotate.
- A swirling golden-blue portal appears.

Entering the portal should trigger a smooth world transition.

Display:

**THE HOLLOW SANDS**

*The kingdom beneath the world.*

### Portal Requirements

- Preserve player inventory.
- Save world state before transitioning.
- Support return travel.
- Prevent players from becoming permanently trapped.
- Handle failed loading gracefully.
- Prevent item duplication.
- Support existing save formats.
- Avoid breaking other dimensions.

---

# PART 13 — THE LOST CIVILIZATION

Build an original storyline around an ancient civilization called:

**THE KINGDOM OF SOLKARA**

Long ago, Solkara was a powerful desert kingdom that discovered the existence of enormous creatures beneath the sands.

Its people learned to study and coexist with some Leviathans.

They built temples, cities, and underground sanctuaries.

Eventually, the kingdom's rulers attempted to harness the power of the Ancient Leviathan.

Their experiments destabilized the underground world.

A catastrophic event buried much of Solkara beneath the desert.

Its civilization disappeared.

Now only ruins, inscriptions, and ancient guardians remain.

## Environmental Storytelling

Players should discover the history through:

- Ancient books.
- Wall inscriptions.
- Murals.
- Abandoned settlements.
- Hidden treasure rooms.
- Ancient mechanisms.
- Ruined laboratories.
- Fossil discoveries.
- Temple puzzles.
- Optional journal entries.

Avoid excessive unskippable dialogue.

Players should be able to explore freely while gradually piecing together the story.

## Lore Discoveries

Create at least 15 collectible lore entries.

Examples:

1. The Founding of Solkara.
2. The First Leviathan.
3. The Sandcallers.
4. The Golden Covenant.
5. The Obsidian Prophecy.
6. The Great Burrowing.
7. The Discovery of the Hollow Sands.
8. The Royal Experiment.
9. The Warning of the Sentinels.
10. The Shattering.
11. The Fall of Solkara.
12. The Sealed Gateway.
13. The Last Sandcaller.
14. The Sleeping King.
15. The Awakening of the Ancient.

Create actual in-game text for each entry.

Add a journal interface or integrate them into an existing quest or collection system.

---

# PART 14 — THE ANCIENT LEVIATHAN BOSS ARENA

At the deepest point of the Hollow Sands, create an enormous arena called:

**THE THRONE OF THE BURIED KING**

This should be one of the most impressive locations in BlockHaven.

### Arena Design

Include:

- A massive circular arena.
- Towering ancient pillars.
- Giant fossilized remains.
- Glowing blue runes.
- Ancient statues.
- A central altar.
- Elevated platforms.
- Sand-filled trenches.
- Breakable environmental features.
- A gigantic underground opening.

### Awakening Sequence

When the player activates the central altar:

1. The entire arena begins shaking.
2. Ancient runes illuminate.
3. Sand pours from the ceiling.
4. The music changes.
5. A giant silhouette moves beneath the sand.
6. The ground splits open.
7. The Ancient Leviathan erupts.
8. Its enormous body circles the arena.
9. The creature releases a powerful roar.

Display:

**THE ANCIENT LEVIATHAN**

*The Buried King Has Awakened.*

Begin the five-phase boss encounter.

### Boss Fight Requirements

The boss must have:

- Clearly telegraphed attacks.
- Meaningful combat phases.
- Fair opportunities to deal damage.
- Functional collision and hit detection.
- A visible health bar.
- Proper boss music and sound cues.
- Checkpoint or retry handling.
- Appropriate loot rewards.
- Persistent defeat status.
- A satisfying victory sequence.

Avoid relying entirely on scripted animations.

The encounter must remain interactive and skill-based.

---

# PART 15 — QUESTS AND PROGRESSION

Create an optional expansion questline.

Players should still be able to enjoy BlockHaven as an open-world sandbox.

Suggested quests:

1. Whispers Beneath the Dunes.
2. The First Sandstorm.
3. The Desert Shrine.
4. The Call of the Sands.
5. The Leviathan's Choice.
6. The Lost City of Solkara.
7. The Three Ancient Relics.
8. Heart of the Inferno.
9. The Obsidian Citadel.
10. The Gate of the Forgotten.
11. Into the Hollow Sands.
12. The Forgotten Kingdom.
13. The Bone Fields.
14. The Last Sandcaller.
15. The Throne of the Buried King.

### Quest Features

- Quest descriptions.
- Objectives.
- Progress tracking.
- Reward notifications.
- Optional map markers.
- Quest journal integration.
- Save/load persistence.
- Clear completion conditions.
- Support for replayable encounters where appropriate.

Do not make the entire expansion dependent on a single easily missed interaction.

---

# PART 16 — CREATIVE MODE SUPPORT

Everything added in this expansion must also work in Creative Mode.

Creative players should have access to:

- All three Leviathan spawn options.
- New desert mobs.
- All armor sets.
- All weapons.
- Sandcaller Horn.
- Leviathan saddles.
- New blocks and materials.
- Desert structure blocks.
- Ancient relics.
- Portal activation items.
- Hollow Sands dimension access.
- Weather controls where appropriate.

Creative Mode should allow players to experiment with the new systems without completing the Survival Mode questline.

Provide safe controls for spawning enormous creatures.

Do not allow uncontrolled Leviathan spawning to crash the game.

---

# PART 17 — GRAPHICS, ANIMATIONS, AND SOUND

Visual quality is one of my highest priorities.

The Leviathans must look impressive, intimidating, and professional within BlockHaven's existing visual style.

## Creature Animation Requirements

Implement:

- Idle underground movement.
- Surface emergence.
- Burrowing.
- Body turning.
- Segmented body movement.
- Roaring.
- Attacking.
- Taking damage.
- Retreating.
- Death or defeat animation.
- Taming animation.
- Riding animation.
- Summoning animation.

### Graphics

Use:

- High-quality original voxel-compatible textures.
- Detailed segmented creature models.
- Sand particle effects.
- Dust clouds.
- Atmospheric fog.
- Glowing runes.
- Volcanic particles.
- Crystal lighting.
- Environmental shadows where supported.
- Distinctive boss silhouettes.

### Audio

Create or integrate original, appropriately licensed sound effects for:

- Deep underground rumbling.
- Leviathan roars.
- Sand movement.
- Burrowing.
- Giant eruptions.
- Sandstorms.
- Ancient portal activation.
- Volcanic attacks.
- Taming success.
- Boss victories.
- Underground ambient sounds.

Do not use copyrighted Dune movie audio, music, or extracted game assets.

If original audio generation is unavailable, use suitable licensed assets with proper attribution or generate sounds procedurally.

Do not leave broken sound references.

---

# PART 18 — PERFORMANCE OPTIMIZATION

This expansion introduces extremely large creatures and environments.

Performance is critical.

### Required Optimizations

- Distance-based rendering.
- Level-of-detail models where practical.
- Efficient segmented animation.
- Object pooling for particles.
- Efficient collision checks.
- Controlled terrain modifications.
- Chunk-based world generation.
- Frustum culling.
- Limited active AI processing outside player range.
- Memory cleanup after encounters.
- Texture reuse where appropriate.
- Adjustable graphics settings.
- Efficient weather rendering.

Large Leviathans must not require every body segment to perform independent expensive AI calculations.

Use a shared movement path and coordinated segment positions.

### Terrain Safety

Leviathans should appear to move through sand without permanently destroying large amounts of the world.

Use temporary visual displacement, particles, and controlled deformation where supported.

Never unintentionally destroy:

- Player homes.
- Storage chests.
- Important temples.
- Portal structures.
- Quest-critical blocks.
- Protected landmarks.

---

# PART 19 — SAVE SYSTEM AND PERSISTENCE

All expansion progress must persist correctly.

Save:

- Defeated bosses.
- Tamed Leviathans.
- Creature names.
- Creature health.
- Equipment.
- Inventory items.
- Quest progress.
- Collected relics.
- Discovered lore.
- Portal activation.
- Hollow Sands world state.
- Structure loot states.
- Player location.
- Dimension state.

Do not duplicate unique items or bosses after loading.

Ensure old saves remain usable.

Implement appropriate migration or default values for new save fields.

---

# PART 20 — TESTING AND QUALITY ASSURANCE

Before declaring the expansion complete, test all major features.

### Required Tests

1. Generate a new Survival world.
2. Generate a new Creative world.
3. Load an existing world.
4. Locate a desert biome.
5. Trigger a sandstorm.
6. Encounter a Dune Leviathan.
7. Complete its combat encounter.
8. Complete its taming encounter.
9. Summon a bonded Leviathan.
10. Ride it across a desert.
11. Use its underground movement.
12. Dismiss and resummon it.
13. Save and reload the world.
14. Verify bonded creatures persist.
15. Encounter the Obsidian Leviathan.
16. Test its combat mechanics.
17. Complete its taming quest.
18. Craft and equip each armor set.
19. Test weapon special abilities.
20. Explore the upgraded Desert Temple.
21. Solve its new puzzles.
22. Find and collect ancient relics.
23. Activate the Hollow Sands portal.
24. Enter and exit the new dimension.
25. Explore all six underground biomes.
26. Discover Solkara lore entries.
27. Trigger the Ancient Leviathan encounter.
28. Complete its five-phase boss fight.
29. Verify victory rewards.
30. Confirm existing BlockHaven features still work.

Also test:

- Boss collision.
- Terrain safety.
- Respawning.
- Inventory persistence.
- Quest progression.
- Chunk loading.
- Performance.
- Mobile controls if supported.
- Creative spawning.
- Portal failure recovery.
- Multiple save/load cycles.

Use automated tests where practical and manual browser testing where necessary.

Do not claim a feature has been tested unless it actually has.

---

# PART 21 — IMPLEMENTATION ORDER

This is a large expansion, so implement it in a logical sequence.

## Milestone 1 — Core Infrastructure

- Inspect repository.
- Identify integration points.
- Establish expansion architecture.
- Implement shared Leviathan systems.
- Implement data definitions.
- Prepare save compatibility.

## Milestone 2 — Dune Leviathan

- Build creature model.
- Add animations.
- Implement AI.
- Add boss combat.
- Add encounter triggers.
- Add loot drops.

## Milestone 3 — Taming and Riding

- Implement taming quests.
- Create Sandcaller Horn.
- Implement creature ownership.
- Add summoning.
- Add riding and underground travel.

## Milestone 4 — Sandstorms and Desert Mobs

- Implement weather.
- Add environmental hazards.
- Add new mobs.
- Integrate spawn behavior.

## Milestone 5 — Desert Structures

- Upgrade existing Desert Temple.
- Add shrines.
- Add graveyards.
- Add ruined cities.
- Add royal tombs.
- Add observatory.

## Milestone 6 — Obsidian Leviathan

- Add volcanic desert region.
- Implement second boss.
- Add Obsidian Citadel.
- Implement advanced taming.

## Milestone 7 — Armor and Weapons

- Implement all three armor sets.
- Add special abilities.
- Add weapons.
- Integrate crafting and inventory.

## Milestone 8 — Hollow Sands Dimension

- Build portal system.
- Add dimension generation.
- Add six biomes.
- Add unique mobs and structures.
- Implement return travel.

## Milestone 9 — Ancient Leviathan

- Build final boss arena.
- Implement enormous boss model.
- Add five combat phases.
- Add victory rewards.

## Milestone 10 — Story, Polish, and Deployment

- Add lore.
- Complete quests.
- Improve visuals.
- Add audio.
- Optimize performance.
- Run regression tests.
- Fix discovered bugs.
- Prepare and deploy the finished expansion.

**Complete and validate each milestone before proceeding to the next.**

If work must continue across multiple Claude sessions, maintain a development progress document in the repository identifying completed features, pending tasks, known bugs, and next steps.

Do not mark unfinished features as complete.

---

# PART 22 — IMPORTANT DEVELOPMENT RULES

1. Do not overwrite the existing BlockHaven game.
2. Do not delete existing mobs, structures, worlds, or game systems.
3. Do not create a separate unrelated demo instead of integrating the expansion.
4. Do not substitute static images for functional creatures.
5. Do not create fake buttons or decorative UI that has no working functionality.
6. Do not use copyrighted Dune models, textures, dialogue, or sound assets.
7. Do not introduce unnecessary dependencies.
8. Do not sacrifice game performance for unnecessary visual complexity.
9. Do not make destructive changes to saved worlds.
10. Do not leave major features as TODO comments while claiming completion.
11. Do not introduce placeholder rewards that cannot be used.
12. Do not make the boss encounters impossible to complete.
13. Do not create taming mechanics that fail after reloading.
14. Do not publish untested, game-breaking changes.
15. Do not claim deployment succeeded without verifying the live build.

Use a dedicated development branch and meaningful commits where appropriate.

Preserve the existing deployment workflow.

Before publishing to the live website, verify that the build works and that the main game remains functional.

---

# PART 23 — FINAL DELIVERABLES

At the conclusion of implementation, provide:

### 1. Expansion Summary

Explain everything that was actually added.

### 2. New Creatures

List each new mob and Leviathan with its mechanics.

### 3. New Items

List armor, weapons, relics, saddles, and summoning items.

### 4. New Structures

Identify the new and upgraded structures.

### 5. New Dimension

Explain the Hollow Sands and how players access it.

### 6. Quest System

Explain how the expansion storyline works.

### 7. Technical Changes

Identify major files and systems changed.

### 8. Testing Results

Describe tests performed, results, and remaining issues.

### 9. Deployment Status

Provide the actual live game URL if deployment succeeds.

If deployment is not possible, explain precisely what is preventing it.

### 10. Remaining Improvements

Identify any incomplete work or future enhancements.

---

# FINAL DIRECTIVE

I want BlockHaven to become more than a Minecraft-inspired sandbox.

I want players to discover hidden civilizations, experience unforgettable boss battles, tame legendary creatures, explore mysterious dimensions, and uncover stories naturally through exploration.

The Leviathan Expansion should create the feeling that the desert is alive.

A player should be able to walk through an ordinary desert, hear a distant rumble, and realize that something enormous is moving beneath their feet.

Some players will choose to fight the creature.

Others will attempt to tame it.

The most adventurous players will discover the lost kingdom beneath the sands and confront the Ancient Leviathan.

Every choice should lead to meaningful gameplay.

**YOUR JOB IS TO IMPLEMENT THIS EXPANSION INTO MY EXISTING BLOCKHAVEN GAME, NOT MERELY DESCRIBE HOW IT COULD WORK.**

Start by inspecting the repository and identifying the existing architecture.

Then establish the implementation plan and begin Milestone 1.

Continue through the milestones as far as your available tools, context, and execution limits permit, keeping the repository functional and documenting your progress.

If you encounter a blocker requiring my input, ask a specific question and explain the options.

Prioritize functioning gameplay, excellent graphics, stable performance, and seamless integration with the existing BlockHaven experience.

**MAKE THE LEVIATHAN EXPANSION ONE OF THE MOST MEMORABLE ADVENTURES IN BLOCKHAVEN.**