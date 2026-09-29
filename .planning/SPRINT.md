# Sprint 04 — Dev Kit comes from the framework; kit 0.2 closes Roll Better's gaps
Started 2026-09-29 · Milestone v0.2 · Features: F08, F09, F10, F11 (in this order; F10 may run alongside F08/F09)
Autonomous run ("just do everything", 2026-09-29). Roll Better work goes on branch `dev/v1.6` — nothing merges to master (live) until /deliver.

## F08 🧱 Dev Kit module
Done when: `framework/devkit/` holds the generic Dev Kit + an installer; a game gets it with one command and adds its own tools as game tabs.
- [ ] 🤖 1. Move the generic parts from Roll Better into `devkit/kit/` (panel, mount, saveContent, css, ColourBlindPreview, colour tab for kit colours, vite plugin, flags) + tests
- [ ] 🤖 2. Game-tab API: games register extra tabs (id, label, Panel) — no editing kit files
- [ ] 🤖 3. Installer `devkit/scripts/install-devkit.mjs` (--dry-run, VERSION stamp, removes dropped files, creates content/devkit.json if missing, prints wiring steps) + tests
- [ ] 🤖 4. Generic release check (`check-devkit.mjs`, game URL/port from args, not hardcoded)
- [ ] 🤖 5. README catalog row, DEVKIT.md + skills point at the module; new web games get it at setup
Check: `npm test` in devkit/ + installer dry-run on a scratch copy of Roll Better

## F09 🔧 Roll Better on the framework Dev Kit
Done when: Roll Better's Dev Kit is the installed module, table felt is a game tab, ` works exactly as before.
- [ ] 🤖 1. Run the installer into Roll Better (dry-run first)
- [ ] 🤖 2. Table felt → `src/devkit-game/` game tab; delete the old copies
- [ ] 🤖 3. Prove: npm test, build, check:devkit, Playwright screenshot of the open panel
Check: screenshot + check:devkit green

## F10 ✨ Kit pass 0.2
Done when: the gaps logged in BMUZ-PLAN "Lessons" are in the kit, gallery shows them, kit VERSION 0.2.0.
- [ ] 🤖 1. MainMenu takes an ordered item list `{ label, onClick, primary? }`
- [ ] 🤖 2. Results `dim` option · toast placement option · Bar width · PlayerChip `xs` (no detail line) / badge on one line
- [ ] 🤖 3. Pinned kit part: engine-neutral scale helper in the kit (R3F adapter stays game-side, documented)
- [ ] 🤖 4. check-ui also scans the game's CSS for rules restyling kit classes
- [ ] 🤖 5. Tests, build, shoot; CATALOG.md updated
Check: npm test / build / check-ui / shoot clean

## F11 🔧 Roll Better on kit 0.2
- [ ] 🤖 1. install-kit dry-run, then install
- [ ] 🤖 2. Replace Roll Better's stitches with the new kit options (menu order, toasts, results dim, chips)
- [ ] 🤖 3. Prove: test, build, check-ui, e2e one at a time, screenshots phone + desktop
Check: screenshots match before (or better), all green

Ask Muzzy: —
Notes:
