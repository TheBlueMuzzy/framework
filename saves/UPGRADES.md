# Saves — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.8.0: slimmed to what Glyphtender calls (F186; git tag `archive/saves-0.7.0`). The update REMOVES from src/saves/: save codes (`saveCode.ts`, `ui/SaveCodePanel.tsx`), link codes (`cloud.ts`, `cloudRoutes.ts`), the leaderboard (`board.ts`, `boardRoutes.ts`, `ui/BoardPanel.tsx`), `replay.ts` (recordRun / replayRun), `platform.ts` (openSaves), `health.ts`, `nudge.ts`, `settingsRow.ts`, `ui/panelWords.ts` — and the installer's `--cloud` / `--board`. A game that calls any of them stays on its copy (don't update). Kept as they were: createSave, createRun + useContinue, storage, progress, fill, golden-save checks, setSavesConfig (now only `backups`; an old content/saves.json's nudge / cloud / board are ignored). Glyphtender calls none of the removed parts.
- 0.7.0: a game that already has tests/saves/saves.test.ts copies the new top part of the starter (saves/templates/tests/saves/saves.test.ts) by hand — it skips with "no saves listed yet" until the game's first createSave.
- 0.7.0: `oldSave` now also gets an old value that isn't JSON, as its raw text (a string) — a game's oldSave that only expects objects checks `typeof raw === 'string'` (return null and it's called damaged, as before).
