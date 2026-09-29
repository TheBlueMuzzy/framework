# Sprint 04 — Dev Kit comes from the framework; kit 0.2 closes Roll Better's gaps
Started 2026-09-29 · Milestone v0.2 · Features: F08, F09, F10, F11 (in this order; F10 may run alongside F08/F09)
Autonomous run ("just do everything", 2026-09-29). Roll Better work goes on branch `dev/v1.6` — nothing merges to master (live) until /deliver.

## F08 🧱 Dev Kit module
Done when: `framework/devkit/` holds the generic Dev Kit + an installer; a game gets it with one command and adds its own tools as game tabs.
- [x] 🤖 1. Move the generic parts from Roll Better into `devkit/kit/` (panel, mount, saveContent, css, ColourBlindPreview, colour tab for kit colours, vite plugin, flags) + tests
- [x] 🤖 2. Game-tab API: games register extra tabs (id, label, Panel) — no editing kit files
- [x] 🤖 3. Installer `devkit/scripts/install-devkit.mjs` (--dry-run, VERSION stamp, removes dropped files, creates content/devkit.json if missing, prints wiring steps) + tests
- [x] 🤖 4. Generic release check (`check-devkit.mjs`, game URL/port from args, not hardcoded)
- [x] 🤖 5. README catalog row, DEVKIT.md + skills point at the module; new web games get it at setup
Check: `npm test` in devkit/ + installer dry-run on a scratch copy of Roll Better

## F09 🔧 Roll Better on the framework Dev Kit
Done when: Roll Better's Dev Kit is the installed module, table felt is a game tab, ` works exactly as before.
- [x] 🤖 1. Run the installer into Roll Better (dry-run first)
- [x] 🤖 2. Table felt → `src/devkit-game/` game tab; delete the old copies
- [x] 🤖 3. Prove: npm test, build, check:devkit, Playwright screenshot of the open panel
Check: screenshot + check:devkit green

## F10 ✨ Kit pass 0.2
Done when: the gaps logged in BMUZ-PLAN "Lessons" are in the kit, gallery shows them, kit VERSION 0.2.0.
- [x] 🤖 1. MainMenu takes an ordered item list `{ label, onClick, primary? }`
- [x] 🤖 2. Results `dim` option · toast placement option · Bar width · PlayerChip `xs` (no detail line) / badge on one line
- [x] 🤖 3. Pinned kit part: engine-neutral scale helper in the kit (R3F adapter stays game-side, documented)
- [x] 🤖 4. check-ui also scans the game's CSS for rules restyling kit classes
- [x] 🤖 5. Tests, build, shoot; CATALOG.md updated
Check: npm test / build / check-ui / shoot clean

## F11 🔧 Roll Better on kit 0.2
- [x] 🤖 1. install-kit dry-run, then install
- [x] 🤖 2. Replace Roll Better's stitches with the new kit options (menu order, toasts, results dim, chips)
- [x] 🤖 3. Prove: test, build, check-ui, e2e one at a time, screenshots phone + desktop
Check: screenshots match before (or better), all green

Ask Muzzy: —
Notes:
- F08 (2026-09-29): `devkit/` = `kit/` (→ game `src/devkit/`) + `vite/` (→ `vite-plugins/devkit/`, Node code the browser tsconfig can't check) + `devkit-game/tabs.ts` starter + `scripts/install-devkit.mjs`. 48 tests (panel, colour logic vs real UI kit, plugin in a real Vite server, installer, check helpers), tsc clean.
- Decision: game tabs = `src/devkit-game/tabs.ts` that the kit imports (installer makes it once, never touches it) — main.tsx stays the same one line in every game and game tools load in the Dev Kit's lazy chunk, so they vanish at 1.0 too. Not `mountDevKit({ tabs })`: that would pull game tools into main's bundle.
- Decision: one Vite helper `devkit()` does the devkit.json switch (define) + Save endpoint → vite.config needs 2 lines. Color tab finds the UI kit via `import.meta.glob`; no UI kit → only the colour-blind preview. Release check reads the web path from `dist/index.html` (`--port`, default 5198, and `--base` override).
- Proof on a scratch copy of Roll Better: dry-run listed the hand-made files it replaces + 4 old files to delete; real install + wiring (delete old files, vite.config 2 lines, check:devkit script) + table felt moved to `src/devkit-game/TableTab.tsx` → tsc -b clean, eslint clean, 76 tests pass, build OK, `npm run check:devkit` PASS both ways, dev server: tabs Color + Table, Table Save wrote table.json keeping `_help`. F09 = do the same in the real repo.
- Task 5: README row, devkit/README.md, DEVKIT.md, sprint + develop skills updated (the skills' lines: new web game scaffold → install-devkit; /develop VERSION check).
- F09 (2026-09-29, Roll Better `dev/v1.6`, commits e6ef373 + c9b3106): installed kit 0.1.0 over the hand-made copy (dry-run first), deleted the 4 old files, vite.config → `devkit()`, check:devkit → `src/devkit/check-devkit.mjs`. Table felt = game tab `src/devkit-game/TableTab.tsx` (+ `tableLogic.ts` + test; `tableColors.ts` + Scene subscription unchanged). TDD §1/§3 Dev Kit rows updated. Proof: tsc -b clean, eslint clean on Dev Kit files, 78 tests pass, build OK, check:devkit PASS both ways, dev-server screenshots of Color + Table tabs mid-game (Rows felt → #aa3333 repainted the 3D table live; undone, nothing saved).
- F10 (2026-09-29, kit 0.2.0, branch kit-0.2 → merged): MainMenu `items` (order + optional `primary`; old named props still work) · Results `dim` · `ToastStack place` top/center/bottom, stays on the game picture in a game box · Bar `width` s/m/l · PlayerChip `size="xs"` = one line (name, badge, detail side by side; read "drops the detail line" as "detail moves onto the one line", since Roll Better needs S|T) · `PinnedBox` + `pinScale()` (engine-neutral; R3F adapter + layer order in CATALOG → Pinned) · `check-ui --css <folders>` warns about game CSS restyling `.kit-…` classes (variable-only rules allowed). Gallery: `menu` uses items, new `endgamedim`, `pinned` (stand-in table), toast place selector. 167 tests (was 151), build, check-ui, shoot 223 shots clean. Found by shooting landscape: MainMenu overflowed on a phone on its side (6 buttons) → title beside buttons.
- F11 (2026-09-29, Roll Better `dev/v1.6`, commits 14d6baf…1f53a00): kit 0.1.11 → 0.2.2. Menu: `items` (Play first, no Continue-slot trick). Winners: `Results dim`, no `<Screen dialog>` wrapper. Toasts: `<ToastStack place="bottom" />` + `:root { --kit-toasts-start/-end }` instead of restyling `.kit-toasts`. Pinned.tsx: ~40-line R3F adapter around `PinnedBox`; `.pinned` CSS gone (live resize → same chip sizes as a fresh load). `npm run check:ui` added (0 warnings). Bar width and PlayerChip xs NOT used: the status bar had no width stitch, and the row chips are already one line (showName off, detail only; "B2" is just the initials of "Bot 2", not a hack) — xs would only shrink the avatar.
- Kit fixes found by the Roll Better move: 0.2.1 `--kit-toasts-start/-end` (keep one side of the game picture clear — Roll Better wants toasts over its rolling area only; `place` alone would centre them over the rows). 0.2.2 menu on a phone on its side keeps one button column up to 5 buttons (two columns from 6, extra buttons across both): Roll Better's "Upgrades · Coming soon" spilled out of a half column.
- F11 proof: tsc -b 0 · npm test 0 (78) · build 0 · check:ui 0 (no warnings) · check:devkit 0 · e2e:solo 0 · e2e:menu 0 · e2e:physics 0 (run one at a time, after the last kit change). Before/after shots (phone, phone landscape, desktop × menu / round with a toast / winners): same or better — desktop toast now sits in the rolling area (before it straddled the middle line), landscape menu has the title beside the buttons.
