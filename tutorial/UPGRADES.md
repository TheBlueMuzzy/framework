# Tutorial — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.1.1: nothing to do — the clock check (`npm run check:framework`) reads strings as strings: a `'…/lessons/*.json'` glob followed by a `/** doc */` comment no longer hides the game's `createLessonRunner` call (it said "the game doesn't start a lesson runner yet" — F201's starter).
- 0.1.0: first version. A game moving its own lesson player onto it (Goops, X01): point the imports of its old `runner` / `lessonTypes` / `patterns` at `src/tutorial` (`extract.mjs swap` does it), and hand the runner the patterns that name its own gates — Goops: `createLessonRunner({ …, patterns: { positionGated, pressureGated } })` (they left the module's `PATTERNS`).
