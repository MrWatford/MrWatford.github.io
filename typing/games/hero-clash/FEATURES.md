# Hero Clash: Ultimate Showdown — honest feature checklist

Last updated: 2026-11-11 (first build, includes the "Legends Collide" expansion). **Not published yet.**

Status words: **Done** = built and checked. **Basic** = works, but simpler than the spec asked for. **Not done** = missing.
"Checked" means either the automated checks in `test.html` (154 checks, all passing) or a run in the browser, as noted.

## How it is built
- `index.html` + `js/` (plain ES modules, no build step) + `lib/three.module.min.js` (three.js r160, MIT license, same copy the other 3D games use).
- No art, model, or sound files. Characters, arenas, effects, music, and sound effects are all made in code, so everything is original.
- `js/combat.js` holds the fighting rules and knows nothing about graphics, which is why it can be tested automatically.
- Add a fighter by adding one entry to `ROSTER` in `js/fighters.js` (plus optional costume colors in `js/models.js`).

## Combat (spec Phase 2, 6, 10)
| Feature | Status | Notes |
|---|---|---|
| Side-view fighting, auto-facing, walk / jump / crouch | Done | Tested |
| Light/heavy punches and kicks, crouching and jumping attacks, dash strike | Done | Real hit boxes, body boxes, startup/active/recovery frames. Tested |
| High / low blocking, overheads | Done | Tested |
| Counter (block at the last moment), character counter-specials | Done | Tested |
| Dodge (side-step with brief invincibility), dash, air dash for some fighters | Done | Tested |
| Throws and throw escapes | Done | Tested |
| Combos: 2, 3, 4, 5-hit strings, launcher + air follow-up, special and Ultimate enders | Done | Every listed combo is tested for every fighter |
| Combo counter, damage scaling, juggle limit, anti-infinite rules | Done | Tested (mashing cannot loop; 14-hit hard cap) |
| Combo breaker (costs stamina) | Done | Tested |
| Charged heavy attack, guard break, stamina bar | Done | Tested |
| Knockdowns, quick rise, roll on wake-up | Done | Roll is small |
| Attack priority (stronger move wins a clash; equal moves trade) | Done | Tested |
| Rounds, timer, best-of-three, draw replay | Done | Tested |

## Fighters (Phase 3)
| Feature | Status | Notes |
|---|---|---|
| 16 fighters + 1 secret fighter, data-driven | Done | Each has its own health, power, speed, attack speed, reach |
| 4+ specials and 1 Ultimate each | Done | 69 specials, all tested to start, connect, and recover |
| Unique look and silhouette | Basic | Jointed figures built from simple 3D shapes (capsules, boxes) with capes, armor, hair, emblems. Stylized "action figure" look, **not** the hand-sculpted models of a console game |
| Unique animations per fighter | Basic | 12 stances, 6 punch styles, 4 kick styles, 17 victory poses, 14 entrance types, mixed per fighter. Fighters share pose families rather than each having fully hand-made animation |
| Portraits | Done | Rendered from the real 3D model, so they always match |
| Character-specific sound | Basic | 17 element sound families (one per fighter) rather than a full sound set per fighter |
| Names changed for originality | Done | Thunderstrike → **Thunderfist**, Emerald Archer → **Jade Archer**, Stormbreaker → **Stormcaller** (those three are existing comic names/terms). "Speed Force Rush" → **Hyperdrive Rush**. "Gotham-inspired Dark District" → **Gaslight District**. Titan Prime uses white/navy/gold instead of blue/red |

## Ultimate Moves (Phase 7)
| Feature | Status | Notes |
|---|---|---|
| Meter fills by fighting, Ultimate needs a full meter | Done | Tested |
| 3–6 second cinematic with its own camera | Done | 7 choreographies shared by 17 fighters with different settings/colors (Meteor Impact, rush, storm, barrage, takedown, cosmic, and the Professor's FINAL EXAM) |
| Blockable, balanced damage, cannot KO before the final blow | Done | Tested |
| Reduced-motion version (short) and reduced-flash | Done | Tested |

## Arenas (Phase 8 + Expansion 3)
| Feature | Status | Notes |
|---|---|---|
| 8 arenas with layered backgrounds, lighting, moving details | Done | Looked at 3 of them in the browser (rooftops, hall, temple). **The other 5 and most second areas have not been looked at yet** |
| Second area per arena + cinematic transition | Done | One reusable camera-driven transition (knock a fighter into the right edge with a heavy knockback). Tested: keeps health/meters/round, small fixed damage, once per match, can be switched off |
| Destructible decorations | Not done | |

## Modes (Phase 9 + Expansion 4)
| Mode | Status | Notes |
|---|---|---|
| Quick Fight vs CPU, 5 difficulty levels | Done | |
| Two Player on one device | Done | Shared keyboard (two layouts) or gamepads. **Not yet tried with two real people or a real gamepad** |
| Arcade (7 fights + final challenger, progress saved) | Done | Opened in browser; a full ladder has not been played through by hand |
| Tournament / Classroom Championship (4, 8, 16; humans and CPUs; best-of-three option) | Done | Bracket engine tested. Display mode, champion screen, statistics, printable certificate built; **certificate printing not yet tried on a real printer** |
| Training (dummy options, move list, combo challenges, hit boxes, frame data) | Done | Opened in browser |
| Story mode | Not built on purpose | The spec said no campaign |

## CPU opponent (Phase 13)
- Done: approaches, keeps range, blocks high/low, dodges, counters, anti-airs, punishes misses, combos, specials, throws against blockers, Ultimate Moves, escapes throws, uses combo breakers. Five play styles (aggressive, defensive, balanced, grappler, ranged).
- Fair: same health and damage as a player, and it reacts on a delay (about 0.13 s on Expert to 0.47 s on Rookie) instead of reading buttons.
- Tested: each level beats the one below it; Expert beats Rookie 9+ times in 10.
- Balance from 272 CPU-vs-CPU matches on Hard: win rates run from about 34% (Jade Archer) to 63% (Thunderfist, Phantom Ninja). Fair but not perfectly even; real students may find different results.

## Expansion: Legends Collide
| Feature | Status | Notes |
|---|---|---|
| Rivalries (5 featured + 5 more), intros, dialogue, win quotes, Ultimate reactions, viewer screen, achievements | Done | Dialogue shows as subtitles; optional spoken lines use the device's built-in voice. Intros are skippable. Intro effects are particle effects, not custom animation |
| Costumes: 4 per fighter, earned by playing | Done | Recolors plus added parts (shoulder pads, capes, halos). They never change stats. Tested unlock rules |
| Victory pose choice (mastery 15), portrait frames, titles | Basic | Pose choice and frames work. "Energy aura" and "profile backgrounds" rewards are listed but **not built** |
| Character Mastery (levels 1–25) | Done | Tested |
| Achievements (24) and statistics | Done | Tested: nothing is awarded twice |
| The Professor (secret fighter, boss fight, unlock tasks, FINAL EXAM Ultimate, 4 costumes) | Done | Looks are based on the cartoon Mr. Watford (auburn hair, beard, glasses), not a photo. Unlock rules tested: losing or quitting never unlocks him |

## Controls, settings, saving (Phase 5, 14, 15, 16)
| Feature | Status | Notes |
|---|---|---|
| Keyboard, remappable, clash warning between players | Done | |
| Gamepad with remappable buttons | Done | **Not tried with a real gamepad** |
| Touch controls (size, visibility, swap sides) | Done | **Not tried on a real tablet or phone** |
| Settings: sound, graphics quality, match rules, accessibility | Done | Changing graphics quality reloads the page |
| Low-graphics mode and automatic resolution scaling | Done | **Not measured on a real Chromebook** |
| Saving in the browser, upgrade path for older saves, safe fallback when storage is blocked | Done | Tested |
| Pause / resume, auto-pause when the tab is hidden | Done | |

## Sound (Phase 12)
- Built: menu, select, three battle tracks, boss, and victory music; 51 sound effects; announcer; separate volume sliders; mute.
- **Nobody has listened to it yet.** It was written and checked for errors only. Expect volume and tone tweaks.

## Known gaps and rough edges
- Character art is the biggest gap against the spec's "premium" goal: it is clean and readable but simple.
- Lunging attacks can make two fighters visually overlap for a moment.
- No online play (not requested). No destructible scenery.
- Most testing was automated or by driving the game from code; it has had very little real hands-on play.
