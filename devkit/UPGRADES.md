# Dev Kit — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

No required hand steps so far: the installer wires everything (Glyphtender 0.20.2 → 0.28.1: 0 hand fixes). Update it FIRST — it runs every other module's checks.

- 0.29.0: Nothing required. A game with the Tutorial module gets the **Lessons tab** by itself, and its `content/lessons/*.json` imports become live. Optional, one line: `lessons: { runner }` (or `{ runner, start: (id, at) => … }`) in the adapter for the tab's ▶ buttons (README *The Lessons tab*). Goops: your own Lessons tab (id `lessons`) keeps its place over the kit's; when you swap to the kit's, delete it and add `lessons: { runner, start: (id, at) => session.startLesson?.(id, at + 1) ?? false }` (Goops counts steps from 1) — and its `liveTuning('lesson-<id>', …)` wrap can go (the import is live now).
