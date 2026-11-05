# Blockhaven Milestone 12: the Sparkworks Update (redstone, machines, and minecarts)

**Status:** Part A (Signals) published 2026-11-05. Part B (Movers) built and browser-tested 2026-11-05, not published yet. Parts C to E still to build.
**Reference:** Minecraft Java Edition 1.20.1 (the baseline we picked for Blockhaven), plus the Crafter from 1.21 because your spec asks for automatic crafting.
**Source of the request:** section 24 "Mechanisms and automation" of your original Blockhaven spec (Oct 29), plus "make it have everything Minecraft has."

---

## 1. The big idea, in plain language

Blockhaven gets a new glowing red-orange ore (default name: **Sparkdust**, see Decision 1). You mine it deep underground, lay it on the ground like wire, and it carries a signal from **power sources** (levers, buttons, plates, sensors) to **machines** (lamps, doors, pistons, hoppers, dispensers, rails). Signals have a strength from 0 to 15 that drops by 1 for every block of wire. Repeaters boost and delay a signal, and comparators compare or measure things. With these pieces players can build hidden doors, automatic farms, item sorters, music machines, and railways.

Blockhaven keeps its own identity the way it already does (Gloop instead of Slime, Shinestone instead of Glowstone). Only "redstone" itself gets a new name. Ordinary English words like Piston, Hopper, Lever, and Rail stay.

---

## 2. Decisions for you (my defaults in bold)

1. **Name for redstone:** **Sparkdust** (ore = Spark Ore, wire = Sparkdust, torch = Spark Torch, block = Block of Sparkdust). Other ideas: Emberwire, Pulsedust, Ruby Dust.
2. **Build and publish in 5 parts (A to E)**, each tested in the browser before it goes live, the same way Milestones 7 to 11 went. (Or: build everything, publish once.)
3. **Java-accurate quirks:** **Yes.** Pistons, dispensers, and droppers can be powered "from above" (Java's quasi-connectivity), and observers can make 1-tick pulses. These quirks are what real Minecraft builders expect. Saying no makes the rules simpler but breaks well-known builds.
4. **Fences and fence gates:** **include them here** (fence gates open with power). They were planned for the later Building Palette milestone; pulling them in makes this patch complete for doors.

---

## 3. Everything in the patch

Legend: ⚡ = makes power, 🔌 = carries power, ⚙ = uses power, 📦 = moves items, 🛤 = transport

### 3.1 The material

| Thing | What it does | Where it comes from |
|---|---|---|
| **Spark Ore** (+ Darkslate Spark Ore in the Deep) | Glows faintly and gives off sparks when touched or stepped on (light 9 while lit, then fades). | Generates at y 2 to 16, veins of 4 to 8, about 8 veins per chunk. Needs an iron pickaxe; drops 4 to 5 dust (Fortune adds more when enchanting arrives). Only appears in chunks made after this update (land version 7), like caves' lava did. |
| **Sparkdust** 🔌 | Wire. Placed on top of solid blocks; connects to neighbors, climbs up and down one block on non-solid steps. Brightness shows strength 0 to 15. Line or cross shape; a single dot points every way, and clicking a dot switches it to "dot only" (the 1.16+ rule). | Spark Ore; 9 from a Block of Sparkdust. Also sold by Cleric villagers (2 dust for 1 Jade). |
| **Block of Sparkdust** ⚡ | Always on, strength 15, can be pushed by pistons. | 9 Sparkdust. |
| **Spark Torch** ⚡ | Strength 15. Turns **off** when the block it's attached to is powered (that's how you make NOT gates). Burns out if it flips more than 8 times in 3 seconds and stays out for a moment. Light 7. | Sparkdust on a stick. |

### 3.2 Power sources ⚡

| Block | Behavior (1.20.1 rules) | Recipe |
|---|---|---|
| **Lever** | On/off switch, strength 15. Floor, wall, or ceiling. | Stick over Cobble. |
| **Stone Button** | 1-second pulse (10 redstone ticks). | 1 Stone. |
| **Wooden Buttons** (oak, birch, crimson, warped) | 1.5-second pulse; also pressed by arrows that hit them. | 1 matching Planks. |
| **Wooden Pressure Plate** | On while any creature, player, item, or arrow is on it. | 2 Planks. |
| **Stone Pressure Plate** | Only players and creatures (not items). | 2 Stone. |
| **Light Weighted Plate** (gold) | Strength = number of entities on it, up to 15. | 2 Gold Ingots. |
| **Heavy Weighted Plate** (iron) | Strength = entities ÷ 10, up to 15. | 2 Iron Ingots. |
| **Tripwire Hook + String** | Two hooks facing each other up to 40 blocks apart with string between. Walking through sends a signal. Shears cut the string quietly; breaking it otherwise triggers it. | Iron, stick, planks / String. |
| **Daylight Sensor** | Strength follows the sun (0 at night, up to 15 at noon), less under clouds of blocks. Click to switch to **night mode** (inverted). | Glass, Quartz, wooden slabs (Planks until slabs exist). |
| **Target Block** | Hit by an arrow, snowball, egg, or trident: strength depends on how close to the center you hit (bullseye = 15). | Sparkdust around Hay. |
| **Trapped Chest** | Like a chest; when opened, strength = number of players looking inside. Red-tinted latch. | Chest + Tripwire Hook. |
| **Observer** | Faces one way; when the block it's "looking at" changes, it sends a very short pulse out the back. | Cobble, Sparkdust, Quartz. |
| **Hush Sensor** (sculk sensor) | Hears "vibrations" within 8 blocks: footsteps, block break/place, doors, eating, projectiles, explosions. Strength depends on distance. Sneaking and wool block it. Outputs a frequency (1 to 15) by type of sound. | Found in the Deep and Echo Expanse (made of Hushmoss, so it fits our renamed sculk). |
| **Tuned Hush Sensor** (calibrated) | Like the Hush Sensor but listens only to one frequency you set with a signal from behind; range 16. | Hush Sensor + 3 Lumen Crystals (our amethyst stand-in). |
| **Detector Rail** | Rail that powers when a cart is on it (see 3.6). | |

### 3.3 Signal parts 🔌

| Block | Behavior | Recipe |
|---|---|---|
| **Repeater** | Refreshes a signal back to 15, works one way only, delay of 1 to 4 redstone ticks (click to change; 1 redstone tick = 0.1 s). A powered repeater pointing into its side **locks** it (shows a little bar). | 3 Stone, 2 Spark Torches, 1 Sparkdust. |
| **Comparator** | Two modes (click the front torch). **Compare**: output = back signal if it's ≥ the strongest side signal, otherwise 0. **Subtract**: output = back minus strongest side. Reads containers and other blocks behind it (see 3.8). | 3 Stone, 3 Spark Torches, 1 Quartz. |
| **Signal rules** | Strong vs. weak power, blocks carrying power to their neighbors, dust not climbing past glass tops, 15-block range: all follow Java 1.20.1. | |

### 3.4 Machines that use power ⚙

| Block | Behavior | Recipe |
|---|---|---|
| **Spark Lamp** | Light 15 when powered; turns off 2 redstone ticks later when unpowered. | 4 Sparkdust around 1 Shinestone. |
| **Doors** (existing wooden door + new **Iron Door**) | Open when powered. Iron doors only open with power (hands can't). | 6 Iron Ingots. |
| **Trapdoors** (oak, birch, crimson, warped, **Iron**) | Flip open with power; iron only with power. Players can crawl under them. | 6 Planks / 4 Iron. |
| **Fences + Fence Gates** (4 woods) | Gates swing open with power. Fences are 1.5 blocks tall for jumping (Decision 4). | Planks + sticks. |
| **Blast Block (TNT)** | Already in the game; now also lights from power, dispensers, burning arrows, and TNT carts. | |
| **Note Block** | Plays a note (25 pitches, click to tune) when powered or hit. **16 instruments** chosen by the block underneath (wood = bass, sand = snare, glass = clicks, stone = bass drum, gold = bell, clay = flute, packed ice = chime, wool = guitar, bone = xylophone, iron = iron xylophone, soul sand = cow bell, pumpkin = didgeridoo, emerald/jade = "bit", hay = banjo, shinestone = pling, anything else = harp). A head on top plays that creature's sound. Musical notes float up. | 8 Planks around Sparkdust. |
| **Bell** | Rings when powered or hit; makes nearby villagers go inside and highlights raiders when raids arrive. | Found in village plazas; Smith sells it. |
| **Piston** | Pushes up to **12 blocks** 1 block out, with a smooth slide animation. Pushes players and creatures. Can't push obsidian, bedrock, portals, chests/furnaces/hoppers and other storage, beacons, spawners, or any story/temple block. Some blocks break instead (torches, flowers, crops, dust). | 3 Planks, 4 Cobble, 1 Iron, 1 Sparkdust. |
| **Sticky Piston** | Same, but pulls the block back. A 1-tick pulse makes it drop the block ("spitting"). | Piston + Gloop Ball. |
| **Gloop Block** (slime block) | Sticks to neighbors when pushed (moves up to 12 together), bouncy: no fall damage, bounces you back up. | 9 Gloop Balls. |
| **Honey Block** | Sticks to neighbors too but **not** to Gloop Blocks (lets you build two-part flying machines). Slows you, slides you down its side slowly, no jump. | 4 Honey Bottles. |

### 3.5 Item machines 📦

| Block | Behavior | Recipe |
|---|---|---|
| **Hopper** | 5 slots. Pulls items from the container above or items dropped on top; pushes into the container it points at. 1 item every 0.4 s. **Locked** (stops) while powered. Works with chests, trapped chests, furnaces (top = ingredient, side = fuel, bottom pulls output), composter, other hoppers, droppers, dispensers, carts. Never the Void Chest (it's personal). | 5 Iron Ingots around a Chest. |
| **Dropper** | 9 slots. On a signal, drops one random item out the front, or puts it into a container in front. | 7 Cobble, 1 Sparkdust. |
| **Dispenser** | 9 slots. On a signal, **uses** one random item: shoots arrows, throws eggs and snowballs, places/scoops water and lava, lights fire with Flint and Steel, primes Blast Blocks, spawns from spawn eggs, places boats and carts, shears sheep, uses Bone Meal on crops, puts armor and saddles on players and horses, fills bottles from water. Items without a use are dropped like a dropper. | Dropper + Bow. |
| **Crafter** (from 1.21) | 3×3 grid you can lock slots in. Each signal crafts one item and spits it out (or into a container in front). With hoppers, this is fully automatic crafting. | 5 Iron, Table, Dropper, 2 Sparkdust. |
| **Item sorting** | Not a block, but a recipe we'll test: the classic hopper + comparator + repeater sorter. It must work exactly like Minecraft's (filter slot with 41 + 4×1 items). Included in the in-game guide. | |
| **Item count rule** | Every machine moves exact counts. Items are never duplicated or lost, even if a chunk unloads mid-move. Automatic tests check this. | |

### 3.6 Rails and minecarts 🛤

| Thing | Behavior | Recipe |
|---|---|---|
| **Rail** | Connects automatically: straight, curves, slopes up/down. At a T-junction, power flips which way the curve points. | 6 Iron, 1 Stick → 16. |
| **Powered Rail** | Powered: speeds carts up (max 8 blocks/s). Unpowered: brakes. Carries power 8 rails down the line. | 6 Gold, Stick, Sparkdust → 6. |
| **Detector Rail** | Powers when a cart is on it; comparator reads the cart's contents. | 6 Iron, Stone Plate, Sparkdust → 6. |
| **Activator Rail** | Powered: throws riders out, primes TNT carts, turns hopper carts off. | 6 Iron, 2 Sticks, Spark Torch → 6. |
| **Minecart** | Ride it (right-click), push it by walking, rolls down slopes, keeps momentum, bumps creatures. Creatures that walk into an empty cart get in (classic animal transport). Breaks into an item when hit. | 5 Iron. |
| **Chest Minecart** | 27 slots; hoppers can load and unload it. | Cart + Chest. |
| **Hopper Minecart** | Picks up items from above and from containers above while rolling; pushes into hoppers below. | Cart + Hopper. |
| **Furnace Minecart** | Burns coal to push itself (and carts in front of it) along. | Cart + Furnace. |
| **TNT Minecart** | Explodes on activator rails, fire, or a hard crash; bigger the faster it goes. | Cart + Blast Block. |
| **Chest Boat** | Boat with 27 slots (boats already exist). Seats 1 instead of 2. | Boat + Chest. |

### 3.7 Sounds (all made by our sound code, no downloaded audio)
Lever click, button click/release, plate press, piston push/pull hiss, tripwire click, dust fizz when a torch burns out, repeater/comparator click, hopper clink, dispenser click/"fail" click, rail rumble scaling with speed, note block's 16 instruments.

### 3.8 What comparators can read (the ones Blockhaven has)
Chests, trapped chests, hoppers, droppers, dispensers, furnaces, Crafter (filled slots), Composter (level 0–8), Respawn Anchor (charges), End Frame (eye in = 15), Beehive/Bee Nest (honey 0–5), chest/hopper minecarts on detector rails, and other comparators/repeaters. Formula = Java's (fullness of the container, rounded).

---

## 4. Designs (what everything looks like)

All textures are 16×16 and drawn by the game's own painter code (like every other block). Palette:

| Color | Hex | Used for |
|---|---|---|
| Spark bright | `#ff5a2a` | lit dust, lit torch heads, powered marks |
| Spark mid | `#c2361a` | dust at medium power, ore flecks |
| Spark dark | `#5a1608` | unpowered dust, ore flecks in the dark |
| Machine stone | `#8b8b8b` / `#6f6f6f` | repeater/comparator plates, dropper/dispenser |
| Piston wood | `#b38a55` | piston head face |
| Iron | `#d8d8d8` / `#a0a0a0` | hopper, rails, iron door/trapdoor |
| Gloop | `#7bd36b` (55% see-through) | Gloop Block |
| Honey | `#f2a83a` (60% see-through) | Honey Block |

**Block-by-block look**

- **Spark Ore:** stone with 5 or 6 small rough red-orange flecks, each a 2×2 dot with a darker rim. While "lit," the flecks brighten and small red sparks float up. Darkslate version: same flecks on darkslate.
- **Sparkdust (wire):** flat on the floor, 1/16 block thick. Drawn as a 4-pixel-wide path from the center to each connected side. Color slides from dark `#5a1608` (strength 0) to bright `#ff5a2a` (15). Climbing dust draws up the wall face. Strength 1+ gives off tiny red particles.
- **Block of Sparkdust:** solid red with a darker grid and brighter circuit-like traces (our own pattern, not Minecraft's).
- **Spark Torch:** stick like the regular torch, head a 2×2 red ember. Off = dull brown-red head with no glow.
- **Lever:** small cobblestone base plate (6×8 px) with a wooden handle tipped at an angle; flipping animates over 0.1 s.
- **Buttons:** a 6×4 pixel raised rectangle; it sinks 1 pixel when pressed.
- **Pressure plates:** 14×14 thin plates; drop 1/32 when pressed. Wood, stone, gold (bright yellow), iron (light gray).
- **Tripwire hook:** iron ring on a wood stub; string is a thin gray line hovering just off the floor.
- **Daylight Sensor:** a 6-pixel-tall slab: glass top with blue quartz panel; night mode turns the panel deep purple.
- **Target:** hay-colored sides, a white-and-red ring pattern on every face.
- **Repeater:** thin stone slab, 2 torches (the back one slides along a track to show delay 1–4), an arrow-like dust line. Locked = a stone bar across it.
- **Comparator:** thin stone slab, 2 back torches + 1 front torch; front torch lit = subtract mode.
- **Observer:** gray stone cube; the "face" side shows a carved stern face; the back has a red dot that lights when it pulses. An arrow on top shows direction.
- **Spark Lamp:** off = dark amber glass with a crosshatch frame; on = bright warm yellow with a glowing center.
- **Iron Door / Iron Trapdoor:** light iron with rivets and a small window grid.
- **Wood Trapdoors:** 4 kinds, each a grid of planks with square holes.
- **Fence Gate / Fence:** posts with two rails (center post 4 px wide).
- **Note Block:** dark wood with a carved musical note on each side. Floating colored notes (rainbow by pitch) pop up when played.
- **Bell:** gold bell hanging from a stone-and-wood post.
- **Piston:** sides = cobblestone with a wooden band; front = planks with an iron center; extended = the arm (iron rod) with the head 1 block out. Sticky = green Gloop smear on the head face.
- **Gloop Block:** translucent green cube with a smaller darker cube inside.
- **Honey Block:** translucent amber cube with a darker center and drips on the sides.
- **Hopper:** iron funnel shape (wide bowl on top, narrow spout pointing down or to a side).
- **Dropper / Dispenser:** cobblestone with a face: dropper = open mouth; dispenser = mouth with a bow-shaped mark.
- **Crafter:** iron frame, a 3×3 grid on top that lights up for unlocked slots, red-orange "eyes" on the front that blink when crafting.
- **Trapped Chest:** existing chest with a red-orange latch and a thin red line around the lid.
- **Hush Sensor:** a dark teal slab block (hushmoss colors) with 4 little feelers on top that wiggle and glow cyan when it hears something. Tuned version adds Lumen Crystal shards on top.
- **Rails:** iron rails on wooden ties. Powered = gold rails with a red stripe that glows when powered. Detector = iron rails with a pressure plate in the middle that turns red. Activator = iron rails with a red-tipped center stripe.
- **Minecarts:** low open iron box (1.0 × 0.6 × 0.8). Chest / Hopper / Furnace / TNT carts show the matching block sitting inside. Furnace cart puffs smoke when fueled.
- **Chest Boat:** the existing boat with a small chest in the back.
- **Item icons:** Sparkdust (pile of red dust), Repeater/Comparator (flat drawn icons), Minecart, the 4 cart types, Chest Boat, rails.

---

## 5. Advancements (added to the existing "Machinery" group)
"Sparks Fly" (mine Spark Ore), "Wired Up" (place Sparkdust), "Under Pressure" (step on a plate), "Push It" (use a piston), "Lock and Key" (lock a repeater), "On Track" (ride a minecart 100 blocks), "Sort It Out" (put 64 items through a working sorter), "Crafty Machine" (craft with a Crafter), "Tune In" (play all 16 instruments), "Hear Me Now" (set off a Tuned Hush Sensor), "Flying Machine" (move a Gloop Block 20 blocks by piston chains). 11 total, XP rewards like the others.

## 6. Creative and the guide
- New Creative tab **"Mechanisms"** with every item above.
- New guide chapter **"Sparkworks"**: what power is, signal strength, 12 example builds with pictures drawn in the guide (NOT gate, clock, T flip-flop, 2×2 piston door, hidden staircase, item sorter, auto-smelter, auto-farm with observer, note song, tripwire trap, minecart station, flying machine). Written in our own words.

---

## 7. How it will work inside the code (for building)

- **Texture sheet:** 239 of 256 slots are full. Step one doubles the sheet to 512 slots (512×256 picture). About 75 new tiles.
- **Block ids:** Blocks 147 to ~195, items 556 to ~575. Block extras ("meta," 8 bits) hold facing, power level, delay, mode, and open/powered flags. Dust connection shapes are worked out when drawing, not saved.
- **New file `js/redstone.js`:** the signal engine. Runs at 20 game ticks per second with a **scheduled-update queue**, Java's update order, and a hard **budget of 6,000 updates per tick**. Overloaded circuits pause and the HUD says "A machine is running too fast," so clocks and feedback loops can never freeze the game (your rule from the spec). Only loaded chunks run; circuits in unloaded areas pause and resume later.
- **New file `js/machines.js`:** pistons (moving-block animation, push lists, entity pushing), hoppers, droppers, dispensers, Crafter, comparator readings.
- **New file `js/rails.js`:** rail shapes, cart physics (built on the existing riding code that boats and horses use), cart types.
- **New shapes in the mesher:** wire, slab-shaped parts, button, plate, lever, rail, piston arm, hopper funnel, fence, gate, trapdoor.
- **Drawing speed:** when dust changes power, the chunk redraws at most every 0.1 s, so Chromebooks keep up.
- **Saving:** save version 4 with a backup of version 3, like before. Saved: pending updates, comparator outputs, hopper/dropper/dispenser/Crafter contents, carts. Old worlds load fine; Spark Ore only appears in new land.
- **Protected places:** pistons, TNT carts, and hoppers can't move or empty story blocks in the Forsaken World, the Lost Civilization, or the temples.
- **Tests:** `tools/circuit-tests.html` builds ~40 test circuits in a blank world and checks the results automatically (timings in ticks, piston pushes, the sorter, item counts never changing, the 6,000-update limit). Plus browser play-testing of every part.

---

## 8. The build order (5 parts, each tested and published)

| Part | Contents | Size |
|---|---|---|
| **A. Signals** | Bigger texture sheet, Spark Ore, Sparkdust, torch, block, lever, buttons, plates, repeater, comparator (basic), lamp, iron door, trapdoors, fence gates, powered doors, TNT by power, note block, target block, daylight sensor, signal engine + limits, save v4. | Largest |
| **B. Movers** | Piston, sticky piston, Gloop Block, Honey Block, observer, tripwire, trapped chest, Hush Sensors, bell, flying machines. | Large |
| **C. Items** | Hopper, dropper, dispenser (all behaviors), Crafter, all comparator readings, the sorter, item-count tests. | Large |
| **D. Rails** | 4 rails, 5 minecarts, chest boat, mob riding, furnace pushing. | Medium |
| **E. Finish** | Advancements, Creative tab, guide chapter with 12 builds, sounds pass, circuit test page, FEATURES.md update. | Medium |

## 9. Not in this patch (and why)
- **Command blocks:** server/admin tools, not survival play.
- **Jukebox + music discs, Lectern + books, Item Frames, Armor Stands, Chiseled Bookshelf, Cake, Cauldron:** the blocks themselves don't exist in Blockhaven yet. They come with the Building Palette / Enchanting milestones; comparator support gets added then.
- **Lightning Rod:** needs weather (lightning), which is in the Biomes & Weather milestone.
- **Splash-potion dispensing:** needs brewing.
- **Copper Bulb and other 1.21 parts besides the Crafter:** newer than our 1.20.1 baseline. Can add later if you want.
- **Water-based machines (water elevators, item streams):** need flowing water, also in the Biomes & Weather milestone. Pistons and dispensers will already work with the water and lava we have.
