# Sprint 60 — The parts both games share, ready to install
Started 2026-11-06 · Milestone v0.38 · Features: F190, F191, F192, F193

## F190 🧱 Save check replays the moves
Done when: a golden save whose moves no longer fit the game's rules fails the save check (it passed before); saves without moves (a progress save) are untouched; the starter's real golden saves still pass.
- [x] 🤖 1. Reproduce the gap on today's code (a tic-tac-toe move in a Nim save still passes) and write what really happens — saves/kit/oldSaves.ts
- [x] 🤖 2. The golden-save check replays a save's moves through the game's rules — test red first — saves/kit/oldSaves.ts
- [x] 🤖 3. The starter wires its replay; its real golden saves still pass — saves/templates/tests/saves/saves.test.ts
- [x] 🤖 4. UPGRADES note + VERSION + README — saves/UPGRADES.md
Check: the audit's bad save fails the check; the starter's golden saves pass; saves tests + starter-check green.
Checked: 2026-11-06 — the audit's Nim save with `{ cell: 4 }` now fails ("Move 1 (seat 0) is not allowed"), it passed before (it.fails pin, task 1); saves 135 / 135 (oldSaves 25 / 25, red 4 first); starter 29 / 29 (save tests 18 / 18, its 3 real golden saves pass, red 1 / 17 before wiring); `npm run check:fast` at the root: all 22 checks green, starter-check (fresh modules) ✓ 14 s.

## F191 🧱 Settings the game follows live
Done when: one UI kit helper gives a game a setting that follows the Settings screen at once (get · subscribe · keeps its value across a reload) — what Glyphtender's gameSettings.ts and Goops' gooStyle / wallKick / readoutSetting each do by hand; the starter uses it for one row.
- [x] 🤖 5. The helper, from Glyphtender's gameSettings.ts and the shape of Goops' gooStyle.ts — ui-kit/kit/blocks/Settings.tsx
- [x] 🤖 6. Tests: change a row → the game sees it at once; the value survives a reload — ui-kit/kit/blocks/Settings.tsx
- [x] 🤖 7. The starter uses it for one row, so starter-check plays it — starters/turn-based/src/ui/menus.tsx
- [x] 🤖 8. UPGRADES note + VERSION + README — ui-kit/UPGRADES.md
Check: the new tests red before the helper, green after; ui-kit tests + starter-check green.
Checked: 2026-11-06 — by the helper, checked by Claude: liveSetting 9 red on a stub → 9 green; starter bot speed 2 green; ui-kit 892 → 901 after the merge + review fixes; Claude read liveSetting.ts (47 lines). Merged check:fast 22/22 (cb6f089).

## F192 🧱 Phone screen handling
Done when: the UI kit has full screen on phones (a Settings → Display row, on for phones, off for computers — from Glyphtender src/ui/fullscreen.ts) and the "turn your phone upright" card (from Goops src/ui/App.tsx), shown when the screen is turned against content/ui/style.json "orientation"; a game with no orientation set never shows it.
- [x] 🤖 9. Full screen on phones + its Settings row — ui-kit/kit/layout.tsx
- [x] 🤖 10. The upright card, from style.json "orientation" — ui-kit/kit/layout.tsx
- [x] 🤖 11. Screenshots of the card at every size; the starter proves both — ui-kit/scripts/shoot.mjs
- [x] 🙋 12. Look at the card in the screenshots: does it read well? (Muzzy 2026-11-06: "good to go") — ui-kit/scripts/shoot.mjs
- [x] 🤖 13. UPGRADES note + VERSION + README — ui-kit/UPGRADES.md (VERSION left to F191: lines under "- NEXT:")
Check: shots of the card at every size, looked at by Claude; full screen asked only on a tap, never on a computer by default; ui-kit tests + starter-check green.
Checked: 2026-11-06 — 98 shots (7 sizes × 7 styles), page check 0 problems; Claude looked at Neon 844x390, Cozy 390x844, Pixel 768x343: centred card, nothing touching an edge, title wraps cleanly on narrow phones. Live starter run: phone full screen only after a tap, computer never. Review fix: Reset that turns it off now leaves full screen; its button and Esc tell live settings (2 tests red first). check:fast 22/22 (cb6f089).
Checked (2026-11-06, helper): new tests red first (no module), then green — fullscreen 9, upright 7, starter phoneScreen 3; ui-kit 56 files / 899 tests; check-ui 176 files pass; card shots 98 (2 ways × 7 sizes × 7 styles), 0 problems, looked at (breathing room on every side, nothing touching an edge) — ~/Documents/dev/.scratch/framework-f192/; live in Chromium (starter): phone 390×844 not full screen before its tap, full screen after; computer 1440×900 never after a click; no card (style "any"); starter check:fast 5/5; framework check:fast 22/22. Task 12 (Muzzy looks) still open.

## F193 🧱 New version on first visit, fixed
Done when: the Version module has one update starter with Goops' fix (a page that already ran under the game's worker swaps to the new version; a first visit never reloads), handed the game's own update hookup so a game without offline mode can still import the module; plus a test helper for each game's "new version arrives" check.
- [x] 🤖 14. Every case written down (first visit, returning player, a player from an older version's worker) and what Glyphtender, Goops and Roll Better each do today — version/kit/index.ts
- [x] 🤖 15. The update starter with Goops' fix — test red first — version/kit/index.ts
- [x] 🤖 16. The e2e helper for a game's sw-update check — version/kit/e2e.mjs
- [x] 🤖 17. UPGRADES note + VERSION + README — version/README.md
Check: each case has a test; version tests green.
Checked: 2026-11-06 — 5 cases, each a test (updates.test.ts 6/9 red against the plain line → 10/10); e2e helper 6/6 + 1 review test (a label with no build part, red first); version 46 tests; not yet run in a real browser — a game's own sw-update proves it when it takes 0.2.0. check:fast 22/22 (cb6f089).

## Wrap-up
- [x] 🤖 18. Framework check:fast green after the merges, /code-review on the sprint, the planner republished — scripts/check-modules.mjs

## Notes
- Review (/code-review low a87ae1f..e2aa624, 2026-11-06): 3 real bugs, all fixed in cb6f089 with a test each, red first — Reset left the page full screen while Settings said off; full screen's own button and a computer's Esc didn't tell live settings; nextVersion("dev") gave "de.9999".
- Merges: F191 and F192 both edited Settings.tsx / blocks index / the starter's settings.ts — kept both; F192's notes numbered under UI kit 0.42.0. Each merge needed the starter's module copies refreshed (`npm run install-modules -- --all`) before the commit's type check passed — CT1's hint now names it for stale copies too (~/.claude-config 12a0d0f).
- Open bugs: none open P0/P1 in BUGS.md. The golden-save gap (ROADMAP Ideas 2026-11-04) is F190.
- Claude's call: the update starter is handed the game's own registerSW, so a game without offline mode can still import the Version module.
- Claude's call: the replay check only runs on saves that hold moves (Goops' progress save has none).
- F191 proof (2026-11-06): liveSetting tests 9 red on a stub → 9 green; starter bot-speed tests 2 green; ui-kit 55 files / 892 tests green; root check:fast all 22 checks green (starter turn-based, fresh modules, 26 s).
- Claude's call (F191): `<Settings>` tells every live setting each change itself (`onSettingsChange`), so a game needs no onChange line per setting; a mapper's object is kept the same until a field changes (useSyncExternalStore); no zustand in the kit.
- Claude's call: one helper per feature in its own worktree, side by side (different modules). Each bumps only its own module's VERSION; F191 and F192 both touch the UI kit, so F191 bumps it and F192 adds its line under the same version at merge (main bumps once).
- F193 cases (task 14, read 2026-11-06 from each game's main.tsx + vite.config.ts + node_modules/vite-plugin-pwa):
  | Case | Should | Goops (registerSW immediate + onNeedReload guard + controllerchange) | Glyphtender (plain registerSW immediate, pwa 1.3.0) | Roll Better (plain registerSW immediate, pwa 1.2.0) |
  |---|---|---|---|---|
  | 1. First visit (no worker on the page) | never reload | no reload (hadWorker false) | no reload (workbox "activated" isUpdate false) | same as Glyphtender |
  | 2. Returning player, our worker, new build out | swap to the new build once, on this visit | onNeedReload or controllerchange → one reload | registerSW reloads on "activated" — but when the new worker takes over before registerSW listens, the page stays old (what Goops' e2e caught) | same as Glyphtender |
  | 3. Player from an older worker at another address (v1's /GOOPS/sw.js) | never reload: it's their first visit of this game | no reload (scriptURL ≠ goops-sw.js) | not met today (one worker address ever); registerSW would reload ("activated" isExternal) | same; and pwa 1.2.0 has no onNeedReload, so registerSW's own reload can't be stopped there |
  | 4. No service worker in the browser | nothing breaks | `?.` guards | registerSW checks itself | same |
  | 5. Both signals fire (onNeedReload + controllerchange) | one reload | `swapped` flag | — | — |
- F193 proof (2026-11-06): updates.test.ts red first — 6 of 9 failed against a stand-in that does the plain `registerSW({ immediate: true })` (it passes first visit / older worker / no worker only because it never reloads at all) → 10/10 green with startUpdates. e2eUpdate.test.mjs 6/6: checkUpdateArrives passes the fixed behaviour and catches each fault on its own (stays old · first visit reloads · loop · no worker). Version tests 45/45 (was 29), typecheck + lint clean, scripts/upgrades.test.mjs 2/2. Root check:fast: ✓ all 22 checks passed (version test 7 s; starter turn-based fresh modules 22 s). Not run in a real browser: no game is wired yet (the games are read-only here) — Goops' own e2e/sw-update.mjs is the live proof of the same logic.
- Claude's call: the starter is `startUpdates(registerSW, { worker })` in version/kit/updates.ts (exported from index.ts); `worker` = the game's worker file name (vite-plugin-pwa's default sw.js, Goops goops-sw.js), resolved against BASE_URL. Weighed: a separate file keeps index.ts (two constants every game reads) small; the game's own registerSW passed in = no virtual:pwa-register import in the module.
- F190 task 1 (reproduced 2026-11-06): a Nim run save (`record.moves`) holding the tic-tac-toe move `{ cell: 4 }` → `checkGoldenSave` returns no problems, so the game's "loads with today's code" test is green. Why: the check only loads the save (version, shape, `expect` values) — nothing plays its moves through the rules. In the game the same save fails only at Continue: `continueMatch` → `replay(rules, record)` throws "Move 1 (seat 0) is not allowed: …" from the main menu. Pinned as an `it.fails` test in saves/kit/oldSaves.test.ts (task 2 turns it into a plain test).
- F190 task 2: `checkGoldenSave(save, golden, replay?)` — the game hands in its replay (`SaveUnderTest.replay` / `RunUnderTest.replay`); after a good load it runs it, a throw = "its moves don't replay with today's rules — Continue would fail: Move 1 (seat 0) is not allowed: …". Claude's call: a save that holds moves (`moves` or `record.moves`) with NO replay handed in fails too, saying how to wire it — opt-in alone would leave every game that forgets it with the same gap. Saves without moves: nothing asked, unchanged. Tests red first: 4 failed / 21 passed → 25 / 25; saves suite 135 / 135, typecheck + lint clean.
- F190 task 3: with saves reinstalled but the starter not wired yet, its save test went red as designed (1 failed / 16 passed: "turn-based-starter_run-v1.json … it holds moves but nothing replays them"). Wired `replay: (run) => replay(ticTacToe, run.record)` (the call Continue makes) on matchRun + the template's commented example → 18 / 18, including a new test: the real golden run with move 2 put on the taken square 4 fails with "Move 2 (seat 1) is not allowed". The starter's 3 real golden saves pass; tsc -b + eslint clean.
- F190 task 4: saves 0.8.0 → **0.9.0, a breaking minor**: a game whose save holds moves (Glyphtender's run does) has a red save test after updating until it hands in its replay. UPGRADES.md 0.9.0 says the hand step plainly (what to pass, the 3 lines to change in tests/saves/saves.test.ts, the starter as the example); README + FORMAT.md §7 say what the check now does. Goops' progress save needs nothing.

Retro (Muzzy 2026-11-06: "ok" — Claude's draft):
- Went well: 4 helpers side by side finished in ~25 min, every merge kept both sides.
- Went wrong: every merge stopped on stale starter module copies — the commit check's hint only covered missing ones.
- Change: done — the hint covers stale copies too (~/.claude-config 12a0d0f).
