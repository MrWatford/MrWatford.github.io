# Kingdoms & Civilizations

## Regular village overhaul

The regular village overhaul starts in generation 12. Villages use the existing world generator and placement grid. Eligible sites get stone retaining walls, paved lanes, a fountain and covered market, an irrigated farm, and an orchard. Rooflines and materials vary among plains, forest, birch forest, and desert villages. The furnished buildings include a smithy with an open forge, a bell tower chapel, and a fletcher’s loft reached by half-block stairs.

To review the update, create a new standard Overworld with one of these seeds and go to the village center:

| Seed | Village style | Center |
| --- | --- | --- |
| `Riverbend` | Plains and red gabled roofs | X 56, Z 56 |
| `Cedar Brook` | Woodland and dark stone roofs | X −136, Z −136 |
| `Stonebridge` | Sandstone with terracotta roof trim | X −232, Z −232 |

Gentle terrain uses shared terraces. On uneven terrain, plots can sit at different heights, with lanes following the terrain near their edges. A natural ruin reserves its plot. The local generation-15 preview adds compact layouts for steep and wet plots around protected landmarks.

Existing saves retain their original generation. Standard worlds use the detailed generator starting with generation 12. The local renovation preview can update eligible older plots with player approval. The Lantern Vale preview settlement, the Forgotten Kingdoms campaign, and the Lost World retain their existing generation behavior.

## Legacy Village campaign preview

From the title screen, choose **Legacy Campaign** and start a fresh Forgotten Kingdoms game to see the redesigned Legacy Village. The player wakes south of the fountain, near Elder Maren. Follow the stone lanes to striped market awnings, timber houses with tiled gables, and planted canal crossings. The south gate and castle have pitched towers and warm street lighting. Inside the Great Hall are stained-glass windows and a lit banquet aisle. Hollis Farm has short timber crossings at the entrance and over its irrigation channels.

**Scribe Tamsin** trades in the first house east of the south road. **Beekeeper Nell** works in the apiary behind the second house on the west side. The original tutorial fixtures, quest locations, waystone, and named chests use the same sites. Merchant Pell stands in the open space beside the northeast market stall. The game stores the village's layout version separately from the terrain generation. Existing campaign saves reopen with their original village layout, buildings, and progress.

To restore an exported campaign, choose **Play → Load a world file**. When the import finishes, its copy appears in the campaign list.

Verification used separate Chrome profiles on Apple silicon with macOS 15.7.3 and software WebGL. The daytime and nighttime views used a nine-chunk render distance. In the fixed campaign seed, the fountain is at X 396, Z 68. Browser checks completed the nine-location exploration quest, opened both new trade menus, and exported and imported the campaign with its layout and progress. A save made before the redesign reopened with the original village, its quest progress, and a test block edit. Generator checks compared the full old village stamp and verified reachable quest areas, fixture positions, and resident spawn clearance.

## Campaign Stonehaven preview

In a fresh **Legacy Campaign**, open the Explorer’s Map with **M** and choose **Stonehaven**. The campaign city is centered at **X 282, Z −194** in the fixed campaign seed. Twin stair towers mark the south gate. A passage behind the castle connects the north gate with the rest of the city. The square has colored market awnings and a tiled well. Find **Tailor Elin** at the loom in the south row of shops. The castle stairs lead to the royal records room and its Expedition Table.

The city uses the existing quest, barracks, chests, and Waystone locations. Captain Brenna still leads the three-wave campaign defense after the Ruined Watchtower report. The game records the city’s layout when it plans the campaign, so older saves can continue with their original city and progress. The standard-world capital uses its own layout.

Local verification used separate Chrome profiles on Apple silicon with macOS 15.7.3 and software WebGL. The city views used a nine-chunk render distance. The browser opened the map, Waystone, and Elin's trade menu, then started Captain Brenna's defense and advanced all three waves using simulated defeats. Export and import preserved the new city layout, activated Waystone, and completed raid. A save created with the preceding release reopened with the earlier city, Captain Brenna, its Waystone, and a player block edit. Generator checks compared the original stamp byte for byte and verified floor-level routes through all four gates and to the main quest sites. Separate `Riverbend` worlds started successfully in Survival, Creative, and Hardcore.

## Sandspire campaign preview

Start a fresh **Legacy Campaign** and select **Sandspire** on the Explorer’s Map. The oasis is at **X 464, Z −346**. The sandstone avenues lead through four tiled gates to an oasis footbridge, six shaded bazaar stalls, courtyard homes, and Potter Nia's working kiln. **Mapmaker Zahir** trades compasses, shelves, and Expedition Tables in the east bazaar. The Sun Palace has a stepped dome and a furnished map hall where Elder Rasha directs travelers to the Sunken Pyramid of Aurelis.

The spire's original staircase leads to a shaded lookout. The Waystone, named supply chests, Elder Rasha’s quest, and the **Top of the World** objective keep their existing positions. Older campaign saves keep the Sandspire layout they started with.

Local verification used isolated Chrome profiles on Apple silicon with macOS 15.7.3 and software WebGL. The browser opened the Sandspire map marker, Waystone, and Zahir's trade menu. A staged quest advanced from Elder Rasha to the Sunken Pyramid, and the tower objective completed upon reaching the lookout. Export and import preserved both results. An earlier campaign reopened with its original town, resident, activated Waystone, and player block edit. Generator checks compared the old stamp byte for byte and verified routes from the four gates, original fixtures, and clearance at all 27 stair and landing positions. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Sandspire Caravan Court in older campaigns

In an older **Legacy Campaign** with an explored or edited Sandspire, open the **Explorer’s Map (M)** on the Surface. Select **Sandspire → Add caravan court → Queue caravan court** to approve the proposed plot. Return to the title from the Surface and reopen the campaign. The new **Sandspire Caravan Court** marker leads to the district’s entrance and Waystone.

The court adds a sandstone gateway, shaded market stalls, a cistern, and an irrigated kitchen garden. **Mapmaker Zahir** trades compasses and expedition tables in the Chart House. **Provisioner Suri** trades bread and other food in Provision Hall. Touch both Waystones to travel between the court and original Sandspire.

The district uses a separate 48 × 48 plot. The game checks for explored terrain, saved changes, nearby landmarks, and other approved districts before accepting a plot. It checks the same plot again on reopen. Untouched older Sandspire sites still offer the full town upgrade.

The isolated Chrome review used older Chapter 8 saves on the fixed Legacy seed. The sample Caravan Court appeared at **X 616, Z −344**. The original Sandspire stamp, player edit, looted palace storeroom, Elder Rasha, quest progress, and Waystone were preserved. The review opened both trade menus and used both directions of Waystone travel. Export and import retained the district and player edits. An edit made after queuing protected the approved plot. Generator checks verified the walking routes, garden and sign positions, and Waystone landings in all four orientations.

## Oakwood campaign preview

Start a fresh **Legacy Campaign** and choose **Chapter 2** to begin with the Oakwood quest. Open the Explorer’s Map with **M** and select **Oakwood** at **X −477, Z −91**. The palisade’s timber gates lead to furnished cabins, flower beds, and three lit stream crossings. Across the stream are an irrigated kitchen garden and a covered timber workshop. **Explorer Fenn** hands out the Expedition Map from the green-roofed camp east of the main road.

Spiral stairways wrap around the four great oaks. Each stairway reaches a furnished treehouse and a loop of level canopy bridges with railings and braziers. Look for **Canopy Keeper Iona** beside the flower beds and beehives on the southeast deck. Visit all four platforms to earn Glider Wings in **Life in the Treetops**.

Oakwood keeps its original Waystone, quest markers, named chests, and resident positions. The layout version is recorded with the site, so earlier campaigns keep the town they started with.

The local review used an isolated Chrome profile on Apple silicon with macOS 15.7.3 and software WebGL. The browser selected Oakwood on the map, activated its Waystone, opened Iona’s honey trades, and advanced Chapter 2 through Fenn’s dialogue. Placing the player successively at the checkpoints verified that the treetop quest requires all four visits at elevation. A separate physics check climbed each stairway using the standard move and jump inputs, and route checks verified all four bridge spans and access to the furnished houses. A browser reload from the preceding release retained the original Oakwood layout, Waystone, active Chapter 2 objective, and a player block edit. Export and import preserved the new layout and completed treetop quest. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Oakwood Canopy Grove in older campaigns

In an older **Legacy Campaign** with an explored or edited Oakwood, open the **Explorer’s Map (M)** on the Surface. Select **Oakwood → Add canopy grove → Queue canopy grove** to approve the proposed coordinates. Return to the title from the Surface and reopen the campaign. The **Oakwood Canopy Grove** marker leads to its entrance and Waystone.

A half-step stair climbs to a lit wooden bridge between **Iona’s Hive House** and **Lark’s Bridge Workshop**. Iona offers honey and hive supplies, and Lark trades iron tools. The garden and covered apiary are on the ground beside the entrance. Activate both Waystones to travel between the Grove and Oakwood.

The Grove uses a separate 48 × 48 plot. Oakwood searches farther out for suitable ground because the original town is surrounded by water, steep slopes, and protected landmarks. The game checks the exact approved plot again on reopen. Eligible untouched older Oakwood saves can still choose the full town upgrade.

The isolated Chrome review used older Chapter 8 saves. The sample Grove appeared at **X −216, Z −104**. The test preserved Oakwood’s original stamp, player edit, opened expedition chest, Explorer Fenn, quest progress, and Waystone. Both trade panels and round-trip Waystone travel worked, and export/import retained the Grove and edits. An edit made after queuing protected the proposed plot. Walking tests climbed the stair without jumping in all four rotations and reached both workshops, the garden, and the apiary.

## Seabreak campaign preview

Start a fresh **Legacy Campaign** at **Chapter 3**. Press **M** and select **Seabreak** on the Explorer’s Map. The port is centered at **X −553, Z −193**, with its waterfront facing north in the fixed campaign seed. Stone walks link eight furnished sailors’ homes, a planted fountain square, and four market stalls. **Chartmaker Ren** trades compasses and map supplies at the stall near the east pier.

Meet **Captain Mira** in the Harbor Office to get the Tide Charm and a boat. The center pier has a gangway to the moored ship and a stepped launch into open water. Follow the promenade to the lighthouse stairs for a view above the harbor. The town lighthouse is on shore. Chapter 3’s lift is at the offshore lighthouse.

The rebuilt harbor keeps the original Waystone, named chests, resident positions, and quest markers. Older campaigns keep their original version of Seabreak.

Local verification used isolated Chrome profiles on Apple silicon with macOS 15.7.3, software WebGL, and an eight-chunk render distance for the screenshots. A save created before the update reopened with its original harbor, Captain Mira, Waystone, active quest, and a player block edit. In a fresh Chapter 3 campaign, the browser selected the Seabreak map marker, opened Ren’s trade menu, and launched Mira’s boat from the dock. The review placed the player at the wreck, took the Ancient Ocean Map from the Captain’s Chest interface, and returned it to Mira to open the Drowned Citadel quest. Export and import preserved the map, quest state, and upgraded harbor. Generator checks compared the old blocks at all four rotations and verified the new walking routes and lighthouse climb. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Ironhold campaign preview

Start a fresh **Legacy Campaign** at **Chapter 4** and talk to Elder Maren. Press **M** and select **Ironhold** at **X 633, Z 200**. Three stone gatehouses lead to Anvil Square, six furnished miners’ homes, and Healer Rue’s kitchen garden. The Forge Hall has two masonry chimneys, smithing stations, and a lit central aisle. **Quartermaster Sela** trades picks and supplies in the covered Ore Yard beside the Mine Head.

Speak to **Forgemaster Hilda** in the Forge Hall before heading underground. The Mine Head has railings and lighting over its entry stairs. Follow the timber braces and signs in the Deep Mine to the west, south, and east galleries. Their Blackened Strongboxes keep the original Blight Skulls and loot. Return to Hilda with all three skulls to unlock the Blight Citadel quest.

Ironhold keeps its original Waystone, resident positions, quest markers, and named chests. The layout is recorded when the site is planned, so earlier campaigns retain the Ironhold they started with.

Local verification used an isolated Chrome profile on Apple silicon with macOS 15.7.3 and software WebGL. The screenshots used an eight-chunk render distance. Chapter 4 started with Maren’s dialogue, then the browser opened the Ironhold map marker, Waystone, and Sela’s trade menu. Visiting the mine at surface height gave no quest credit. At mine level, the review took the three skulls through the strongbox inventory panels and returned them to Hilda. Export and import kept the skulls, emptied slots, Waystone, upgraded layout, and completed mine quest. An earlier campaign reopened with its original town and mine, saved block edit, and Chapter 4 objective. Generator checks compared the entire earlier stamp and verified routes through the gates and galleries. A player physics check climbed the full mine stair using the standard movement and jump inputs. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Ember Outpost campaign preview

Start a fresh **Legacy Campaign** at **Chapter 5**. Press **M** and choose **Ember Outpost** at **X 538, Z 161**. Three covered entrances lead into the expedition camp. Follow the stone path to Sable’s command pavilion, the furnished bunk tents, or Quill’s field library. **Provisioner Tova** trades food in the covered supply hall. The kitchen garden is by the south entrance.

Speak to **Expedition Leader Sable** and take the Flint and Steel from the original Expedition Supplies chest. Use it on the inside edge of the Ember Gate, then step through to the Ember Depths. The new gate court keeps the obsidian frame, Waystone, chest positions, and quest marker in their original places. Earlier campaign saves retain their version of the camp.

Local verification used isolated Chrome profiles on Apple silicon with macOS 15.7.3 and software WebGL. The screenshots used an eight-chunk render distance. The review opened the map marker, Waystone, and Tova’s trade menu, took the original Flint and Steel through the supply chest interface, and used it to light the gate. Placing the player inside each portal triggered the normal dimension changes and returned the player to the camp. The Chapter 5 quest advanced to the three Dragon Seals. Export and import preserved the lit portal, its links in both dimensions, and the emptied chest slot. The earlier campaign retained its original camp, unlit frame, Waystone, saved edit, and active quest. Generator checks compared the old blocks and all three shrine templates and verified clear paths to the camp fixtures and both sides of the portal. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Hollowmere campaign preview

Start a fresh **Legacy Campaign** at **Chapter 6**. Press **M** and select **Hollowmere** at **X 333, Z 219**. Fog gathers over the village and thins as you leave the valley. Mossy lanes run between six abandoned cottages, the Old Well, and the timbered Meeting Hall. **Watcher Ilsa** still lives on the southwest road. Look for the warm porch light and the small garden behind her house.

Speak to Ilsa, then search the Meeting Hall, the Old Well, and **Dr. Vell’s observatory**. The observatory’s half-block steps lead to a glass dome, the original journals, and the cabinet containing the Pale Lantern. A safe spot where you use the lantern inside Hollowmere is preserved when you return from the Forsaken World. The original Waystone, quest markers, and chest positions are retained. Older campaign saves keep their original village layout.

Local verification used isolated Chrome profiles on Apple silicon with macOS 15.7.3 and software WebGL. The screenshots used an eight-chunk render distance. The review checked the fog inside and outside town and simulated the victory flag to verify clearing. It opened the map marker and Waystone, spoke to Ilsa, staged visits to the three locations, and took the original Pale Lantern through the cabinet inventory. The lantern and Return Gate brought the player back to the saved point under the observatory dome. Export and import preserved the lantern, looted cabinet, Waystone, layout, and quest progress. An earlier campaign reopened with its original village, edit, and active quest. Generator checks compared the entire old layout and verified each approach. Player movement testing walked up the observatory steps without jumping. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Skyreach campaign preview

In a fresh **Legacy Campaign**, press **M** and choose **Skyreach Landing** at **X 429, Z −224**. The landing and stair tower lead to a five-block-wide bridge with lit railings. On the island, there are furnished Sky Keeper residences, a reflecting pool with a crossing, and a garden pavilion. Two paths circle the Relic Forge and reach the Storm Spire approach.

Follow Chapter 8 to meet **Keeper Solenne** in the Relic Forge. The eight pedestals, beacon, and supply chests remain in their original positions. Activate both Waystones to travel between the ground and the island. The Storm Spire keeps its original arena and three Rune Stones. Older campaigns keep their saved Skyreach layout by default.

The local review used isolated Chrome profiles on Apple silicon with macOS 15.7.3, software WebGL, and an eight-chunk render distance for the screenshots. With the Skyreach objective staged after the Wyrm, the review opened the map marker, verified the elevation requirement, traveled between the two Waystones, and spoke to Solenne. The Sky Sovereign encounter started in its original arena and reset when the player left. Export and import kept the new island, Waystones, and completed visit. A save from the public release reopened with its original layout, resident, quest progress, and block edit. Generator checks compared the full old island and the protected arena volume. Player movement testing climbed all 26 steps, and route checks verified the bridge, residences, Relic Forge, garden crossing, and Storm Spire approach. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Ruined Capital campaign preview

In a fresh **Legacy Campaign**, press **M** and select **Ruined Capital** at **X 832, Z −72**. Enter through the rebuilt south gateway. The allied camp has furnished sleeping tents, covered supply and armory stations, and a command pavilion where **Captain Brenna** gives the Chapter 8 objective. Beyond the camp, Grand Avenue runs between broken arches, lit monuments, and twelve overgrown ruins with rooms to explore.

Bring the eight Relics and the Crown Key from Skyreach to the Rune Stone beneath the **Gate of Eight**. The gate now finishes opening before the game saves. If an older save has an already-unlocked gate with pieces of the original seal still in place, use the Rune Stone again to clear those pieces. The game preserves player-placed blocks. Earlier saves keep their original city layout by default. The Waystone, quest supplies, named chests, and the entire Throne Court are in their original positions.

An isolated Chrome review checked the map destination, Brenna’s dialogue, both gate requirements, and the complete opening of the seal. Export and import preserved the new layout, activated Waystone, and open gate. An earlier save retained its original layout, resident, and block edits while the Rune Stone repaired a partial opening. The Forgotten King spawned in the Throne Court. A staged victory exercised the ending choice, Homecoming, and the credits. Generator checks verified walking routes to the camp, chests, and arena, and compared the protected court block for block. Separate `Riverbend` worlds started in Survival, Creative, and Hardcore.

## Upgrading settlements in older campaigns

In an existing **Legacy Campaign**, open the **Explorer’s Map (M)** while on the Surface. Select **Stonehaven**, **Sandspire**, **Oakwood**, **Seabreak**, **Ironhold**, **The Ember Outpost**, **Hollowmere**, **Skyreach Landing**, or **The Ruined Capital**. If the settlement uses its original layout and the area is untouched, choose **Upgrade settlement → Queue upgrade**. Queue each site you want to upgrade. Return to the title from the Surface and reopen the campaign to apply the upgrades.

The review checks the entire settlement again on reopen. Explored areas, saved edits, changed supplies, existing residents, activated Waystones, site quest progress, portals, and spawn or respawn points protect the original layout. Chapter select alone still allows an untouched settlement to be upgraded. If the rebuild would change blocks within a neighboring landmark’s reserved area, the settlement keeps its original layout. The upgrade preserves the settlement’s location, supplies, and quest markers, registers the new gardens, and adds any new residents on the first visit. A protected site stays on its original layout even if you queued the upgrade before making the change. Existing Legacy Village home areas stay on their saved layout.

An isolated Chrome review used Chapter 8 saves created with the older campaign layouts. It verified cancellation, applying all nine upgrades on reopen, and exporting and importing the result. Quest and inventory state, supply chests, Waystones, and the original home were preserved. Four gardens received their crop registrations, Ironhold gained three signs, and Oakwood’s Beekeeper appeared on the first visit. Exploring the edge of Seabreak blocked its upgrade. An edit made after queuing Hollowmere survived reopening while the untouched Ember Outpost upgraded. Separate Chrome checks started standard Survival, Creative, and Hardcore worlds and exercised regular village renovation with a protected edit and an existing merchant.

## Legacy Village Commons

In a campaign with the original Legacy Village layout, open the **Explorer’s Map (M)** on the Surface and select **Legacy Village**. Choose **Add village commons** to review the proposed coordinates, then **Queue commons**. Return to the title from the Surface and reopen the campaign. The **Legacy Village Commons** marker points to the district’s Waystone.

The Commons uses a separate 48 × 48 plot near the original village. Scribe Tamsin offers maps and supplies from the records hall, and Beekeeper Nell trades honey and hive supplies. The lit lane connects their workshops with an irrigated garden, flower beds, and covered beehives. Activate both the Commons and village Waystones to travel between them.

The game checks for explored areas, edits, nearby landmark reservations, portals, storage, and other saved content across the full plot. If the approved location becomes protected, choose another available location through the map. The original village retains its saved homes, residents, and quest fixtures.

An isolated Chrome review used a copy of an older campaign on the fixed Legacy seed. The Commons appeared at **X 376, Z 296** in that copy. The original village stamp matched block for block, and an edited home block, opened supply chest, original resident, quest state, and Waystone were preserved. The review opened both new trade panels and used the Waystones in both directions. Export and import kept the district, its Waystone, and a player edit made there. A late edit prevented construction at the approved site and survived reopening. The first district layout was reviewed in all four orientations for routes to the halls, garden, and Waystone.

## Stonehaven Trade Court in older campaigns

In an older **Legacy Campaign** with an explored or protected Stonehaven, select **Stonehaven** in the **Explorer’s Map (M)** while on the Surface. Choose **Add trade court → Queue trade court** to approve the proposed coordinates. Return to the title from the Surface and reopen the campaign. Select the new **Stonehaven Trade Court** marker to find its entrance.

The court uses its own 48 × 48 plot. Tailor Elin sells wool and shears in the Cloth Hall. Smith Fenna trades tools and armor in the Forge Hall. Covered stalls, a fountain, and flower beds line the square. Activate both Waystones to travel between the city and the Trade Court.

The game rechecks the approved plot for visits, existing landmarks, portals, and saved changes before building. If the plot becomes protected, use the map to review another available location. Eligible untouched cities can still opt into the full rebuild.

The Chrome review started with an edited old Stonehaven on the fixed Legacy seed. Its Trade Court appeared at **X 120, Z −200**. The original city stamp, player edit, opened treasury chest, King Aldric, quest progress, and Waystone were preserved. Both trade menus and the Waystones in both directions worked. Export and import preserved the court, both traders, and a block edit made there. A late edit protected a queued site. Generator checks covered walking routes and safe Waystone landings in all four orientations and matched the previously published Legacy Village Commons layouts.

## Stonehaven in standard worlds

Create a new standard Overworld and open the Explorer’s Map with **M**. Select **Stonehaven** to set the South Gate waypoint. In the tested `Riverbend` world, the gate is at **X 776, Y 33, Z 681**.

The expansion adds the Forge Court to the west and the Records Hall to the east. Follow the side gates out of the market to reach them. Inside the keep, the east stair leads to the public gallery and the west stair continues to the battlements. The Crown Tower door opens from the battlements. Its spiral stair reaches three furnished galleries.

One 112 × 112 plot is reserved per standard world when a suitable site is available. Placement checks the full footprint for existing villages, ruins, authored landmarks, and occupied chunks. The saved site keeps the same entrance, skyline, and districts through reloads. Earlier generation saves and the original preview retain their layouts.

The local Chrome review selected the Stonehaven marker in a standard world, verified the two district interiors and ten residents, and re-imported an edited world with the same capital and waypoint. Generator tests verified stair clearance and deterministic placement. The browser also opened a festival trade in the Records Hall and started the Great Siege at the standard-world city.

## Play the preview

Serve the game over local HTTP on an origin reserved for testing. Open `index.html` and create a new Overworld Creative or Survival world using the exact seed `Lantern Vale 2`. The preview uses generation version 11. Set the render distance to six chunks or higher for a wider view of the skyline.

- **Lantern Vale** is centered at **X 536, Z −40**. Follow the lanes from the bell and fountain plaza to the irrigated farm, homes, smithies, and clerics' houses. Check the torch and brazier lighting after dusk.
- **Stonehaven** is on the **Explorer’s Map (M)**. Select **Stonehaven** to set the waypoint for the **South Gate, X −504, Y 37, Z 265**. The gate opens onto the market and fountain. The north stairs lead to the keep’s hall and its gallery. The garden lanes lead to six furnished dwellings and shops.

The ten source images are in `reference-assets/village-overhaul/`. Lantern Vale uses terraced stone walls, timber gables, contrasting roofs, planted approaches, furnishing, and warm street lighting. Stonehaven uses the clustered towers and stepped skyline from the capital references.

## Compatibility and review

The first village site overlapped the existing Keeper excavation in a real world. Generation version 11 puts the village on a clear site. Version 10 still follows its original placement rules, and standard worlds created before the general overhaul retain their previous generation. The save schema and authored map versions are independent of the preview.

The original Stonehaven preview reserves an 80 × 80 plot after the existing landmarks are placed. The initial placement checks the whole plot for visits, block changes, containers, stamps, natural villages, and ruins. The layout ID is saved with the world. Once placed, the same layout is generated again with the normal block changes, containers, and entity state layered on top.

Local Chrome review used a disposable browser profile with software WebGL. The New World menu generated Lantern Vale, and the browser save export and import round-trip preserved both the layout and a sample block edit. The Explorer’s Map selected the South Gate. Generator checks covered the gate and stair approaches, all eight resident spawn positions, blocked placements, and deterministic city regeneration.

## Seasonal festivals

The Explorer’s Map shows the next event for Stonehaven, Lantern Vale, and upgraded regular villages. The first rotation lands on days 2, 6, 10, and 14, then repeats every 16 days.

| First day | Festival | Special offer for 1 Jade |
| --- | --- | --- |
| 2 | Spring Blossom Fair | 2 Honey Bottles |
| 6 | Summer Sun Market | 5 Cooked Minnows |
| 10 | Autumn Harvest Festival | 8 Bread |
| 14 | Winter Lantern Festival | 24 Torches |

Each event lasts one in-game day. Bunting goes up in clear space, and villagers head toward the plaza in daylight when conditions are safe. Talk to a local villager to buy the special. Each settlement has a separate stock of four purchases per event, shared among its villagers. The calendar and used stock persist when reloading or importing the world. The scenery stays out of the block data and clears when the festival ends or you leave the dimension.

The isolated Chrome review bought the spring offer from the village trade panel and re-imported the save with the correct remaining stock. Additional checks covered both locations, occupied space, a full inventory, the complete rotation, and cleanup on dimension changes.

## Settlement growth

Talk to a villager in a generation-12 or newer Overworld settlement with an upgraded plaza and orchard. The trade panel lists its current tier, the project coordinates, and the materials still needed. Contribute what you have, then use **Build** when the project is funded.

| New tier | Public project | Materials |
| --- | --- | --- |
| Market village | Community Pavilion | 24 Oak Planks, 8 Wool |
| Town | Provision Hall with usable storage chests | 32 Oak Planks, 24 Stone Bricks, 8 Glass |
| Fortified town | Watch Gate with operable gates | 48 Stone Bricks, 12 Oak Logs |

Funding is shared across villagers in the same settlement. The tier, deposits, and built blocks persist through saves and exports. Construction checks the full plot for net block changes, containers, dropped items, and occupants. Clear the obstruction or restore changed blocks to their original state, then retry. Pending contributions stay credited. Previous generation saves, the Lantern Vale preview, and Stonehaven do not have a project track.

## Village raids and the Great Siege

In Survival at Easy, Normal, or Hard difficulty, trade with a resident of an upgraded village and select **Start defense**. Riverbend at X 56, Z 56 is a verified example. You get a six-second warning before each of the two waves. Pillagers and Vindicators join the assault, and a Ravager arrives in the second wave.

To play the optional three-wave **Great Siege of Stonehaven**, play a standard Overworld with Stonehaven, or the `Lantern Vale 2` preview, in Survival. Select Stonehaven on the Explorer’s Map, go through the South Gate, and speak with a city resident. Select **Start siege** to begin.

Only one defense runs at a time. Leaving the area, changing dimensions, or fainting pauses the fight. Return to the settlement above Peaceful difficulty to resume the current wave. Progress saves which raiders were defeated and the health of survivors. Complete the waves and speak with a resident to claim the one-time reward of 8 Jade for a village or 24 Jade for Stonehaven. A full inventory leaves the claim available.

The older Forgotten Kingdoms campaign raid and Endwatch Citadel battles keep their existing encounter rules.

## Local renovation preview

In a standard Overworld save from generations 1–14, trade with a villager and open **Village renovation → Review**. The panel shows how many older plots can be renovated. Confirm **Queue renovation**, then return to the title and reopen the Overworld save. The approved plots receive the furnished layout while saved inhabitants keep their identities, trades, and professions. In generations 12–14, renovation targets the older plots that still use the simple layout.

The preview checks each plot again on reopen. It skips saved block changes, containers, portals, respawn points, dropped items, protected occupants, and reserved landmarks. Players standing in a plot that changes are placed on its street or porch. Renovated plots are recorded in the save. Campaign villages and the Lantern Vale preview use their own layouts.

Standard worlds from generation 14 add **Scribes** and **Beekeepers**. Scribes work at bookshelves and trade compasses, shelves, and Expedition Tables. Beekeepers have flower beds and nests and trade honey and hive supplies.

New standard worlds in generation 15 use compact layouts on steep slopes and wet shores. The smaller foundations and piers support furnished houses, covered markets, irrigated farms, and gardens with lighting and planted entrances. Compact markets have room for festival decorations and the settlement's Watch Gate. Detailed plots stay clear of reserved landmark footprints. The renovation preview uses the same compact layouts when an approved older plot needs one.

Local verification used an isolated Chrome profile on macOS with software rendering and a six-chunk rendering distance for the Creative views. The Haven beekeeper's porch is near X −25, Z −116, and the Stonebridge smith's porch is near X −425, Z −244. Opening a generation-14 Stonebridge Survival save after renovation placed the player on the new porch, preserved the merchant and a nearby block edit, and retained the changes through export and import. Generator checks covered 97 compact plots across seven seeds and compared older layouts with the preceding preview.
