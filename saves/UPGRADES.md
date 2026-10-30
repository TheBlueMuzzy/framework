# Saves — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.7.0: a game that already has tests/saves/saves.test.ts copies the new top part of the starter (saves/templates/tests/saves/saves.test.ts) by hand — it skips with "no saves listed yet" until the game's first createSave.
- 0.7.0: `oldSave` now also gets an old value that isn't JSON, as its raw text (a string) — a game's oldSave that only expects objects checks `typeof raw === 'string'` (return null and it's called damaged, as before).
