# Leviathan Early Access 2 — Dune combat update

The owner explicitly authorized publishing the completed local follow-up, then continuing development locally. Release identifier: `leviathan-early-access-2`. This is another early-access snapshot, not completion of the full expansion.

## Included

- Physical Dune body sweeps and mouth-aligned devouring strikes, with readable warnings, escape windows, difficulty/armor/shield handling and one authoritative boss.
- Four-second Dune sand vortices with timed damage, movement drag, solid-cover/escape behavior and Sand Warrior armor protection.
- Transient attraction reset after submerged/lava/dimension exits; normal storm-triggered encounter, combat, rewards and persistence checks.
- Updated title/limitations page and current project documentation. Existing IDs, save version 4, creature artwork/dimensions, authored maps, vendored renderer, Campaign fixes and unrelated website content remain preserved.

## Source and validation

Verified starting main: `0313e2a3563cacf575ef02a5ef14c9dad5740db7`, tree `b0b9315a7752b665be15d039fb59951d0973c638`. Preserve it as `backup/pre-leviathan-early-access-2`; stage only the selected game runtime/pages/documents on `release/leviathan-early-access-2`. Check hashes and the pull-request diff, recheck main for concurrent work and merge the reviewed snapshot to publish. Development tools, raw test reports, unrelated local prompts and later follow-ups are excluded from this deployment.

Existing evidence includes 10 focused/eight controlled devouring groups, 12 focused/six controlled sweep groups, vortex/warning and 37 targeting/animation/projectile regressions, plus four attraction groups and seven integrated storm-to-victory groups. The integrated run selects actual seeded weather and supplies standard gear/automated input; it does not assign boss health or phases. It validates all four attacks, victory/rewards, save/reload, post-defeat suppression and no boss block writes while ordinary farming/bee updates continue. Repeat the disposable fresh-mode startup/save/import checks against the new release label before merging. Verify the resulting Pages deployment and public game/notes afterward.

## Remaining scope and recovery

Unassisted acquisition, natural taming/progression, balancing across terrain/seeds/difficulties, peak-storm visibility for every attack, Obsidian/Ancient polish, structures/environment detail, real older-save imports and representative hardware acceptance remain open. Do not describe the full expansion as finished.

If recovery is needed, make a normal revert/recovery commit preserving later unrelated work and verify its Pages deployment. The backup branch retains the preceding code; reverting website files does not reverse browser saves. Keep player backup guidance and the existing game URL.
