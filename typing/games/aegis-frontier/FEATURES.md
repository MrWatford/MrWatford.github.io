# Aegis Frontier — status checklist

An original first-person sci-fi adventure for Mr. Watford's website (free-time game, not typing practice).
Route: `typing/games/aegis-frontier/index.html` · Card: Typing page "New free-time game" panel · Home: "Recently added".

Plain JavaScript modules + a local copy of Three.js r160 (MIT, `lib/THREE-LICENSE.txt`). No build step, no server,
no accounts, no CDN at runtime (only Google Fonts for the page fonts, like the other games). Runs on GitHub Pages as-is.

## Content that exists in the game (counts checked by `test.html`)

| Target | In the game | Played in a browser? |
|---|---|---|
| 5 regions | 5 (Greenreach, Cinderstone, Cloudcrest, Glasswater, Meridian Citadel) | All 5 viewed |
| 12 story missions | 12, with briefings, objectives, dialogue, checkpoints, rewards | M1, M2 fully; M3 & M4 key steps; M12 (boss + ending) fully. M5–M11 not played start to finish |
| 8 support bases | 8 (relay → guards → terminal capture, supply, armory, vehicle pad, fast travel) | Greenreach Outpost captured, saved, reloaded |
| 5 strongholds | 5 different layouts/goals | Rule logic tested in `test.html`; not played in the browser |
| 12 rescues | 12 (shield repair, locked shelter + energy cell, machine patrol) | Fernbrook Camp (shield type) played |
| 6 optional commanders + 2 mission commanders | 6 (Keystone, Hivemind Relay, Spanbreaker, Mender Prime, Vantage, Gridlock) + Ridge Sentinel, Gatekeeper | Not fought in the browser yet |
| Final boss | ATLAS ARRAY, 3 phases | Played all 3 phases → ending |
| 7 weapons + 2 throwables | 7 + EMP Orb, Stasis Disc | Pulse Carbine and Arc Pistol used; others not individually tested |
| 4 vehicles | Rover, Skiff, Crawler, Skyfin | All 4 driven briefly (skiff on water, skyfin flight/landing, crawler cannon) |
| 4 equipment + shield track, 4 tiers | Tether, Scout Beacon, Barrier, Dash + Aegis Shield | Tether tested heavily; others not tested in the browser |
| 30 upgrade cores | 30 (11 missions, 5 strongholds, 6 commanders, 8 hidden) | Count verified by test |
| 24 recordings / 5 emblems | 24 / 5 (each emblem unlocks a modifier) | — |
| Training, replay, post-campaign, 3 difficulties | All present | Training (first steps), post-campaign continue, difficulty change tested; replay tested only by `test.html` |
| Optional courses | 2 rover courses, 2 tether routes | Not tested |

## Not done / known gaps (honest list)

- Separate "supply cache puzzles" are not built; the energy-cell socket puzzles (locked rescues, the Signal Vault, the Hydro Works) are the only puzzles.
- Controller and touch controls: not supported (the game says so). Phones get a "needs a keyboard and mouse" note.
- Day/night and weather: not built.
- Voice acting: none (all dialogue is subtitled text). Music and sound are generated in the browser.
- Performance has not been measured on a school Chromebook. Low quality is the default.
- Pointer lock (mouse capture) could not be tested by automation; it needs a quick real-mouse check.
- Escort transports drive their route without full collision against structures.
- Robots only path on the ground; robots placed on platforms stay on their platform.

## Graphics upgrade (2026-10-31)

- Rendering: correct sRGB color handling, ACES filmic tone mapping (applied once), sky-reflection environment map,
  warm sun + cool sky fill, soft shadows on every preset that follow the player (snapped to avoid shimmer).
- Ground: textured grass / dirt / rock / gravel blended by slope and paths, rock projected from three sides on cliffs,
  two texture scales to hide repetition, matching surface bump. All textures are generated in code (no image files).
- Landforms: a grassy ridge above the crash site, shallow gullies, canyon terraces, ridge ledges, a creek with gentle banks.
- Showcase route (crash site → ridge → The Old Span → creek → Waystation Shelter): original broken stone arch landmark with
  real collision, a parked Trailrunner on the trail, a patrol (after Mission 1's training robots), clear sightlines.
- Vegetation: 5 pine shapes + bare trees in natural groves (near: detailed; far: simple), 6 fractured rock shapes with moss and
  scree, bushes, and chunked wind-blown grass with seed heads around the player (thinned on paths and near terminals).
- Water: depth-tinted, see-through shallows, animated ripples. Sky: hazy plated ring, clouds, distant craft, horizon pylons with light beams.
- Models: new Guardian armor (title screen, and seated in vehicles), first-person hands + gauntlet, all 7 weapons with a live
  charge indicator and reload motion, robots with beveled armor and jointed legs (static parts merged to save draw calls),
  rebuilt rover (frame, body shell, roll cage, seats, lights, treaded tires, steering and suspension, dust).
- Effects/feel: restrained bloom on energy parts (Medium/High), MSAA on High, camera smoothing between simulation steps,
  weapon sway, idle breathing, sun/shade lighting on the hands. New settings: Reduce flashes, Show performance, Reset graphics.

Presets (render-only cost measured at one viewpoint on an Apple M4 Mac in Chrome 152, 1024×768 window — NOT a school device):

| Preset | Internal resolution | Draw calls | Triangles | Grass chunks | Render (median) |
|---|---|---|---|---|---|
| Low | 960×720 | 326 | 228k | 19 | 0.9 ms |
| Medium | 1200×900 | 372 | 394k | 37 | 1.4 ms |
| High | 1440×1080 | 553 | 573k | 69 | 1.8 ms |

Performance on a Chromebook is unverified. Distant LOD transitions (trees, terrain) are not cross-faded, so some popping at
the detail distance is possible. Third-person views of the Guardian are only on the title screen and in vehicles.

## Files

- `js/content.js` — all authored content (world layout, sites, missions, dialogue, robots, collectibles). Add or tune content here.
- `js/game.js` — progress rules (flags, missions, encounters, bases, rescues, strongholds, saving, defeat/retry).
- `js/main.js` — start-up, game loop, controls, menus. `js/ui.js` — HUD, map, journal, upgrades.
- `js/player.js`, `weapons.js`, `projectiles.js`, `robots.js`, `allies.js`, `vehicles.js`, `boss.js`, `items.js`
- `js/terrain.js`, `physics.js`, `nav.js`, `structures.js`, `world.js`, `scenery.js`, `fx.js`, `audio.js`, `input.js`, `save.js`, `util.js`
- `js/materials.js` (procedural textures, environment map, materials, shader add-ons), `js/models.js` (Guardian, hands, weapons, robots, rover), `js/postfx.js` (bloom, final color)
- `test.html` — 48 automated checks. Open it in a browser after any content change.

## Saves

`localStorage` keys `aegis-frontier-slot-1..3` (about 1 KB each) and `aegis-frontier-settings`. Version 1 schema; every load and
import is validated (unknown keys dropped, numbers clamped, ids checked, size limit). Export/Import makes a backup file.

## Asset & license record

- Three.js r160 — MIT license (`lib/THREE-LICENSE.txt`).
- Everything else (models built from boxes in code, terrain, sounds, music, portraits, story, thumbnail `images/games/aegis-frontier.webp` captured from the game) is original to this project.
