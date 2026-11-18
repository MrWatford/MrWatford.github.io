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
