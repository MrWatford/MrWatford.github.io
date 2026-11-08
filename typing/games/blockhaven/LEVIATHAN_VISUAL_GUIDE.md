# Leviathan visual direction

The supplied expansion illustration sets the direction: monumental voxel silhouettes, layered stone/bone plates, warm desert gold, restrained luminous cores and readable equipment detailing. Preserve BlockHaven's existing voxel language while developing that material richness. Review actual runtime models and animation alongside the reference.

The owner approved the current Leviathan appearance on November 7. The second reference guides emergence, debris, low camera angles and the creature's scale beside the player. Preserve the current creature mesh and dimensions; this reference does not request a redesign or enlargement. Keep emergence readable and threatening without hiding the escape route.

## Material families

Use `js/leviathan-armor-style.js` as the shared source for armor icon and equipped-model colors.

| Family | Base | Recess | Trim | Light/core | Visual identity |
| --- | --- | --- | --- | --- | --- |
| Sand Warrior | `#d8c29c` | `#795438` | `#edb95d` | `#ffe0a2` | Bone plates, gold edges, amber seals |
| Obsidian Warden | `#342f3f` | `#201c29` | `#98656a` | `#ff984c` | Dark basalt, muted metal edges, molten seams |
| Ancient Guardian | `#d7cdb9` | `#81758f` | `#ece0c6` | `#a8d8f3` | Ivory stone, violet recesses, blue runes |

Keep highlights concentrated around edges, seals, runes and fissures. Preserve darker recesses between plates so shapes remain legible. Use distinct silhouettes as well as hue to distinguish material families. Decorative glow must leave faces, attack targets and terrain readable.

## Equipment and icons

- Author inventory art on the existing transparent 32px canvas, using crisp pixel edges and explicit shading. Inspect at normal 32px size and enlarged size on both dark and light backgrounds.
- Match visible plates, crowns, trim and core motifs to the equipped rig. Use open-face helmets, distinct shoulder silhouettes, separated leggings and paired boots.
- Preserve the established image cache and nearest filtering. Static icon work should add no per-frame painting or new equipment draw batches.
- Review front, side, rear, walking, attacking, crouching and mounted poses for clipping and clear hands/face openings. Material changes must retain current gear stats and saved item IDs.

## Effects and environments

- Give cues distinct shapes and meaning: filling blue crystal rings warn of a pulse, gold sand flow marks movement drag, and orange cracks warn of heat exposure.
- Telegraph danger before damage. Preserve the cue when motion is reduced; freeze decorative flow, orbit and shaking as appropriate.
- Keep highlights readable against bright dunes, dark ruins and storm fog. Test actual gameplay backgrounds alongside staged reviews.
- Bound particles, meshes, lights and per-frame work; document triangle/batch budgets and dispose transient resources. Profile representative hardware before claiming performance acceptance.
- Continue large-scale environmental artwork with layered silhouettes, depth, focal lighting and clear traversal routes. Preserve protected/edited terrain and landmark silhouettes.

## Review and release evidence

Use `tools/leviathan-armor-art-preview.html` for the twelve cached armor icons and actual equipped models. Existing Leviathan, weapon, shield and mounted-burrow previews provide additional runtime-asset review surfaces. Record which views were actually inspected, graphics settings, seeds when relevant, and any limitations.

For a release-quality visual pass, inspect each affected feature in ordinary gameplay through acquisition, use, save/reload and cleanup. Cover Fast/Fancy, reduced motion, storm/torch/daylight conditions, camera angles, skin combinations and representative viewport/device sizes. Staged artwork acceptance and controlled gameplay fixtures are individual evidence points; full progression and device acceptance remain separate gates.

## November 7, 2026 baseline

The three armor material families now share palette data. All twelve armor items have bespoke 32px artwork; ordinary armor keeps its existing painting path. The equipped armor geometry and animation remain unchanged. The Sand and Obsidian bases were adjusted to bone/gold and dark basalt, while Ancient retains its established ivory/violet/blue identity.

Desktop review inspected all twelve icons against light/dark backgrounds and the actual three equipped sets at rest, from the side and walking. Thirteen rendering checks passed. Eleven actual-game armor activation, cooldown/durability, pause/save/reload/expiry, first-person, death/totem and Creative checks also passed. Evidence is in `tools/review-results/2026-11-07-armor-materials.json` and `2026-11-07-live-armor-materials.json`; no warnings/errors were captured in either review tab.

The browser reported a 1280px layout without horizontal overflow. Requested 969px/390px viewport overrides retained that reported width, so narrow-layout acceptance remains open. Storm/torch lighting, additional skins and equipment/mount combinations, boss choreography and environment art still require visual review. This baseline does not establish complete visual or release acceptance. Nothing was published.

The Dune emergence review now uses the unchanged runtime creature at a natural desert site. A one-second bounded sand/debris burst accompanies emergence, and terrain-following markers show eruption and surface-attack boundaries. The final comparison in `tools/dune-warning-live-review.html` is a controlled paused pose: it provisions Sand Warrior gear, turns the creature toward the player and hides tutorial/pause overlays. It demonstrates current scale, not completed cinematic lighting, natural encounter progression or full fight acceptance. Six live checks and ten focused checks passed; evidence is in `tools/review-results/2026-11-07-live-dune-emergence.json` and `2026-11-07-dune-warnings.json`.

Wild Dune attacks now add restrained, distinct head/body motion without changing the approved geometry: lateral sweep coil/reversal, lifted vortex curl and devouring head draw/forward recovery. The actual-model preview's attack selector cycles all three. Reduced motion uses one-fifth offsets, and existing segment constraints retain shell continuity. Controlled animation and gameplay checks are recorded in `tools/review-results/2026-11-07-dune-attack-motion.json` and `2026-11-07-live-dune-attack-motion.json`. Natural storm fights and physical hit-volume review remain open.

The local physical sweep warning now uses amber contours and a restrained gold wash on the existing animated body shells, turning orange through the active strike. Actual contact uses the unchanged octagonal meshes; the contours' tiny outward visual offset only avoids depth fighting and does not enlarge damage. Preserve the approved model and shell continuity. Reduced-motion warnings follow necessary physical pose changes without decorative flashing. Two batches contain at most 252 wash triangles/216 line edges and dispose four resources. Controlled daylight Survival review passed; natural storm/night/torch visibility and device performance are still open. This work is unpublished.

The local devouring warning follows the current posed mouth as an open amber funnel and paired throat/entry contours, turning orange during the short bite. Interior spokes were removed to preserve the dark throat and tooth silhouette. The existing geometry and head/jaw animation are unchanged. Two batches use 24 surface triangles/24 contour edges and dispose four resources; no textures/lights/particles are added. Fancy daylight Survival presentation was inspected. Reduced-motion alignment is covered in focused and actual-game checks; natural storm/night/torch readability and device acceptance remain open. This follow-up is unpublished.

The integrated encounter review now includes a paused capture of a real stage-four storm emergence, triggered by actual sprint movement on natural sand. The boss, player location and AI timers are not repositioned for that capture; only camera aim and ordinary pause/resume are used. Fast quality/render distance four were inspected from the resulting close side/underside angle. This supplies one real storm/scale evidence point, not full front-angle, cinematic lighting, every-attack storm readability or device acceptance. Image/evidence are recorded with `tools/review-results/local-dune-encounter.json` and `local-dune-storm-emergence.json`. Nothing from this follow-up is published.
