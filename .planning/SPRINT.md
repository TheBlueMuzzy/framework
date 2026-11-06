# Sprint 63 — A tutorial toolbox any game can load
Started 2026-11-06 · Milestone v0.39 · Features: F198, F199, F201, F200 (in this order; F198 ∥ F199 first)

## F198 🧱 Tutorial module
Done when: a new `tutorial/` brick installs into a game with `install-module.mjs tutorial <game>` and gives it Goops' lesson player as blocks it can pick from — steps from lesson files with button words (Next / Got it / Play), waiting for a tap / an event / a number / time, holding the game (pause, slow, only some controls), hints and retries, one lesson at a time, words per control type — with its README saying which block does what in plain words, and a rehearsal on a throwaway Goops copy swaps Goops' own player for it with Goops' checks green and unchanged.
- [ ] 🤖 1. Queue Goops' lesson player for extraction (runner, lesson types, patterns + its tests), checks test + e2e:day — ~/.claude/config/bmuz/scripts/extract.mjs
- [ ] 🤖 2. The brick: kit/ from Goops' runner, lessonTypes and patterns (the 2 tank patterns stay Goops'), VERSION 0.1.0, package.json `bmuz` folders + entry, its 23 runner tests green — ~/Documents/dev/games/goops/src/game/lessons/runner.ts
- [ ] 🤖 3. Button words in the lesson format (Next / Got it / Play, and whether it dims) + the trial's order gap written into the contract ("setup decides a step's state; setSpeed may run between steps") — tests red first — ~/Documents/dev/games/goops/src/game/lessons/lessonTypes.ts
- [ ] 🤖 4. Words per control type (`{ keys, mouse, phone }` → the right line for how the player plays) as its own block — tests — ~/Documents/dev/games/goops/src/game/lessons/lessonLine.ts
- [ ] 🤖 5. Installer, README (every block: what it does, one-line use, which game proved it), UPGRADES, conformance pack; check-modules runs its tests; "Replaces:" line — scripts/check-modules.mjs
- [ ] 🤖 6. Swap rehearsal on `~/Documents/dev/.scratch/goops-tutorial-swap`: `extract.mjs swap` there, Goops' check:full green before and after, unchanged — .planning/extractions.md
Check: tutorial/ tests + type check + lint in framework check:fast; the copy's check:full green before and after the swap with no test edited; the real Goops untouched (HEAD + status).

## F199 🧱 Spotlight + bubble placement
Done when: the UI kit has a Spotlight (dims everything except one or more things being taught, with an outline) in every style, and the Callout can keep clear of a named play area (the bubble covers as little of it as it can, Glyphtender's rule) — both in the gallery's teach screen at every size, check:framework green; no game changes.
- [ ] 🤖 7. Spotlight block from Goops' (several holes, outline, style names only — no colours or px) — tests — ~/Documents/dev/games/goops/src/game/lessons/Spotlight.tsx
- [ ] 🤖 8. Callout "keep clear" placement option from Glyphtender's rule (away from the live spot; toward the nearer edge; flips to fit) — tests — ~/Documents/dev/games/glyphtender/src/tutorial/tipsPlace.ts
- [ ] 🤖 9. Gallery teach screen shows both; screenshots 390x844, 360x780, 844x390, 768x343, ~1100 wide, 1440x900, 1920x1080, every style; Claude looks — ui-kit/kit/blocks/teach.tsx
- [ ] 🤖 10. UI kit version + UPGRADES + CATALOG lines — ui-kit/UPGRADES.md
Check: ui-kit tests + check:framework's UI checks green; Claude looks at the teach screen on phone + desktop in two styles (breathing room measured to the dim's edge).

## F201 🎮 Starter teaches
Done when: a brand-new game made from the turn-based starter opens with a 3-step "how to play" tutorial built only from the module + kit blocks (a lesson file, a pointer bubble, the spotlight, the nudge), replayable from Settings, and starter-check plays it end to end.
- [ ] 🤖 11. The starter installs the tutorial module with the others — starters/turn-based/package.json
- [ ] 🤖 12. A 3-step first-game lesson in content/lessons/, wired with the blocks; Settings → Replay tutorial — starters/turn-based/src/App.tsx
- [ ] 🤖 13. An e2e plays the tutorial (fixed mode for checks); starter check:full green; shots phone + desktop, Claude looks — starters/turn-based/e2e
- [ ] 🤖 14. Inner-platform test: time to add one more lesson step to the starter by hand, written in the starter README — starters/turn-based/README.md
Check: starter check:full green with the new e2e; a fresh browser on the starter gets the tutorial, a second visit doesn't; screenshots looked at by Claude.

## F200 🔧 Dev Kit Lessons tab
Done when: any game with the tutorial module gets a Lessons tab in the Dev Kit that edits its lesson files live while the game runs (Goops' own tab, made general), and the starter shows it.
- [ ] 🤖 15. The tab in the Dev Kit, shown only when the game has the tutorial module — from Goops' tab — ~/Documents/dev/games/goops/src/devkit-game/LessonsTab.tsx
- [ ] 🤖 16. Edits apply live (module contract) and Save writes only the lesson file's own keys — tests — devkit/kit/saveContent.ts
- [ ] 🤖 17. The starter shows the tab; an e2e moves a step's words and sees them change in the running game — starters/turn-based/e2e
Check: devkit tests green; the starter e2e sees a live edit land; Save leaves the rest of the lesson file byte-for-byte.

## Notes
- Muzzy 2026-11-06: "the tutorial module can be brought into any game, and that game can utilize any of the elements from it. Sort of how you can load a library… build it now."
- Claude's call: the UI kit's Callout, tips memory and nudge timer stay in the UI kit (games already import them there; moving them would break both games for no gain). The tutorial module's README lists them as part of the toolbox.
- Claude's call: the new brick is `tutorial/` (one folder, like saves/ and ai/). Goops' look (LessonView, tank bubble, console words) and its when-to-teach rules stay Goops'.
- Claude's call: Goops' real swap waits for Goops' own session (with its catch-up); this sprint only rehearses it on a copy. Glyphtender keeps its tutorial.
- Claude's call: work branch `dev/v0-39-tutorial-blocks`; F198 and F199 by two helpers side by side (tutorial/ vs ui-kit/ — no shared files); the UI kit version is bumped only by the F199 helper.
- Open bugs: no BUGS.md open P0/P1.
