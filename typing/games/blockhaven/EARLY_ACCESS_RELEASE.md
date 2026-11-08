# Leviathan Early Access 1

The owner authorized publishing the current work as early access and continuing unfinished features afterward. This supersedes the earlier hold on publication for this release only. The full expansion remains unfinished; see RELEASE_READINESS.md and the player-facing early-access.html for the outstanding scope.

Release identifier: `leviathan-early-access-1`.

This release includes the local expansion runtime, original models and equipment art, storm/landmark/realm systems, bonding/mount systems and the current combat/collision improvements. Boss mechanics, progression balance, structural/environment detail, real older-save compatibility and representative-device acceptance are incomplete. Existing save version remains 4. Players are advised to download important worlds and try new content in a fresh world.

## Publication scope

Apply only BlockHaven runtime changes, new required modules, the early-access page and project documentation. Preserve unrelated website files, authored binary maps, the vendored renderer and all remote files absent from the local change list. Local development fixtures and captured test reports need not be deployed. The latest remote Legacy Campaign Blight Skull fix is retained in campaign data and repair logic. The current live Ocean Leviathan facing/bite fix is also preserved exactly; source comparison caught and corrected an older local copy before merging.

Starting live revision: `5e3952b98e03068522a453650794e9af5d705f21` on `main`, previously deployed successfully by GitHub Pages run `42377310525`. Retain it at `backup/pre-leviathan-early-access-1` before publishing. Prepare the new commit on `release/leviathan-early-access-1`; move `main` only if it still matches the verified starting revision.

## Validation and rollback

Existing focused and controlled-game evidence remains scoped as described in the implementation plan. Recheck static module/asset completeness, the title/limitations page and disposable Survival/Creative/Hardcore startup plus save/reload before publication. Verify the deployed commit's Pages workflow and the public title/limitations page afterward. Full natural fights, older-save matrix and device testing remain future work.

The backup branch retains the preceding code revision. Rollback should create a normal revert/recovery commit using that revision's tree on the then-current main head, and verify its Pages deployment. Reverting website code does not reverse browser save changes; player world exports remain necessary backups. Preserve any unrelated commits made after publication rather than force-rewinding main.

Publication status and final commit/deployment evidence are recorded separately when verified; this preparation document alone does not claim that deployment succeeded.
