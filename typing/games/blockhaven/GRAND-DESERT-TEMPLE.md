# The Grand Desert Temple

The outside of the Sunken Pyramid of Aurelis, rebuilt from Mr. Watford's two reference videos (2026-11-14):
`ScreenRecording_11-14-2026 07-00-20_1.MP4` (Part 1: platform, walls, columns, courtyard) and
`ScreenRecording_11-14-2026 07-01-32_1.MP4` (Part 2: pyramid, pits, small pyramids, entrance towers).
In-game screenshots are in `tools/temple-shots/`.

## What the videos show, and my measurements

No exact block counts are readable in the videos (phone screen recordings of reels, with motion blur), so every
number is an estimate from repeated parts (column spacing, tile size) and perspective.

| Part | Estimate from the videos | Confidence | Built |
|---|---|---|---|
| Whole complex | square, about 110 across, plus an entrance wing | Medium | 109 × 109 at the sand; 125 deep with the entrance wing; the side stairways reach 137 across |
| Platform height | about 12–16 blocks of stepped wall | Medium | 14 (walk at y 51; sand at y 37) |
| Walls | stepped like a ziggurat, pale, orange stripes down them | High | 14 one-block steps, stripes every 9 blocks and down each corner |
| Columns | thick white columns joined by arches, all around | High | 3 × 3 columns every 9 blocks, 9 tall, lintel + battlements on top (y 60–62), 5 × 5 corner towers |
| Courtyard | grid of orange-bordered white squares | High | 7 × 7 tiles, 9 blocks each |
| Pits | square sunken sections with a pillar inside | Medium | 8 pits, 6 deep, burning center pillar, steps down |
| Small pyramids | orange-edged stepped pyramids on the diagonals | Medium | 4, three tiers, fire on top |
| Central pyramid | stepped pyramid on a raised white square with 4 stairways | High (shape) / Low (size) | your existing pyramid on a 27 × 27 white base, 4 stairways |
| Entrance | two stepped towers with tiled tops and pillars, grand stair between | High | towers 17 wide, stair 13 wide |
| Tallest point | looks about 45+ above the sand | Low | 28 (pyramid fire at y 65) |

## Choices I had to make

- **Height limit.** Blockhaven's world is 80 blocks tall and desert ground is around y 36, so nothing can be more
  than ~43 blocks above the sand. The platform (14) and colonnade (25) match the videos; the central pyramid is
  shorter than in the videos because it is your original pyramid, unchanged.
- **Your pyramid in the middle.** The old 17-wide pyramid tip is copied block for block (lift, glyphs, tablet,
  chest) and lifted 19 blocks onto the new base. The underground temple is its own world reached by the lift, so it
  is untouched: riding down lands at the same spot as before.
- **Stairs.** The videos use stair blocks. Blockhaven had none, so I added a half-height "Pale Temple Step"; every
  stairway can be walked up without jumping. The outer walls are full-block steps (you jump them, like Minecraft).
- **Colors.** Pale cream stone, orange "Sunfire Terracotta", gold-brown Sun Bricks for the pyramids. Change them in
  one place: `MAT` at the top of `js/desert-monument.js`.
- **Enemies.** No new creatures: Husk (Desert Husk), Tomb Guardian (Temple Sentinel), Ancient Sentinel (rare
  Ancient Guardian). At most 8 at once, only when you're near, never saved, none on Peaceful. They patrol, chase,
  walk back, and return 1–3 minutes after being beaten (sooner on Hard).

## The ground around it (added after his first look, same day)

`monumentApron()` in `js/desert-monument.js`, applied right after the temple stamp:
- **Sand slope (14 blocks):** sand eases from the lowest step to the natural ground height, with small dune bumps,
  so no bare foundation shows. Where a stairway's extra steps are buried, the slope starts from the real ground there.
  Trees in it are cleared; a few broken column stubs, fallen stones, and old paving show through the sand.
- **Fade (9 blocks):** natural height, but the ground turns from sand to grass in a ragged, patchy edge with dry
  grass tufts. Trees just past the slope are cleared too, and leaves left hanging by a cleared tree are removed
  (floating-leaf rate near the temple now matches ordinary land: 0.7% vs 0.6%).
- **New worlds** now prefer a spot that is at least half real desert (`L.monumentSandShare`, default 0.5); if none is in
  range, the normal search still places the temple and the fade blends it into whatever land is there.
- The saved-world safety check covers this ring too (`APRON_PAD` = 28 blocks past the temple).
- Tested on seed `temple-test-1` (its spot is mostly meadow: the hardest case): from N, S, and E a player walks from
  the sand onto the platform with no jumping; on the low west side (by a lake) the sand rises in a few one-block
  steps. Before/after pictures: `edge-problem-*.jpg`, `edge-fixed-*.jpg`.

## Saved worlds

Decided once per world and saved in `story.lost.monument`:
- **New worlds** look for a desert spot with room for the whole temple.
- **Older worlds** get the temple only if no block in its footprint was ever changed and no other landmark,
  house, or village someone has seen is there. If the camp chest was opened, its contents move up with the pyramid.
- Otherwise the old small pyramid stays exactly as it was, a message explains why, and the reason is saved
  (`why: "conflict"`, `conflicts: [...]`). Nothing the player made is ever overwritten.
- Villages nobody has seen inside the footprint don't generate (`gen.skipVillages`), the same way other landmarks
  claim unexplored land. Undo for a world: set `story.lost.monument.on = false` and the old pyramid returns.

## Not done / not checked

- Heat shimmer (would need a new screen effect; skipped for Chromebooks) and sandstorm visibility (the game's
  existing sandstorms already work here).
- Frame rate on a real Chromebook; hand-play; exported-JSON save round trip; a temple placed in tall dunes or by the sea.
- Not published.
