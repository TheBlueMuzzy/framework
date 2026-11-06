# Sprint 60 — The parts both games share, ready to install
Started 2026-11-06 · Milestone v0.38 · Features: F190, F191, F192, F193

## F190 🧱 Save check replays the moves
Done when: a golden save whose moves no longer fit the game's rules fails the save check (it passed before); saves without moves (a progress save) are untouched; the starter's real golden saves still pass.
- [ ] 🤖 1. Reproduce the gap on today's code (a tic-tac-toe move in a Nim save still passes) and write what really happens — saves/kit/oldSaves.ts
- [ ] 🤖 2. The golden-save check replays a save's moves through the game's rules — test red first — saves/kit/oldSaves.ts
- [ ] 🤖 3. The starter wires its replay; its real golden saves still pass — saves/templates/tests/saves/saves.test.ts
- [ ] 🤖 4. UPGRADES note + VERSION + README — saves/UPGRADES.md
Check: the audit's bad save fails the check; the starter's golden saves pass; saves tests + starter-check green.

## F191 🧱 Settings the game follows live
Done when: one UI kit helper gives a game a setting that follows the Settings screen at once (get · subscribe · keeps its value across a reload) — what Glyphtender's gameSettings.ts and Goops' gooStyle / wallKick / readoutSetting each do by hand; the starter uses it for one row.
- [ ] 🤖 5. The helper, from Glyphtender's gameSettings.ts and the shape of Goops' gooStyle.ts — ui-kit/kit/blocks/Settings.tsx
- [ ] 🤖 6. Tests: change a row → the game sees it at once; the value survives a reload — ui-kit/kit/blocks/Settings.tsx
- [ ] 🤖 7. The starter uses it for one row, so starter-check plays it — starters/turn-based/src/ui/menus.tsx
- [ ] 🤖 8. UPGRADES note + VERSION + README — ui-kit/UPGRADES.md
Check: the new tests red before the helper, green after; ui-kit tests + starter-check green.

## F192 🧱 Phone screen handling
Done when: the UI kit has full screen on phones (a Settings → Display row, on for phones, off for computers — from Glyphtender src/ui/fullscreen.ts) and the "turn your phone upright" card (from Goops src/ui/App.tsx), shown when the screen is turned against content/ui/style.json "orientation"; a game with no orientation set never shows it.
- [x] 🤖 9. Full screen on phones + its Settings row — ui-kit/kit/layout.tsx
- [ ] 🤖 10. The upright card, from style.json "orientation" — ui-kit/kit/layout.tsx
- [ ] 🤖 11. Screenshots of the card at every size; the starter proves both — ui-kit/scripts/shoot.mjs
- [ ] 🙋 12. Look at the card in the screenshots: does it read well? — ui-kit/scripts/shoot.mjs
- [ ] 🤖 13. UPGRADES note + VERSION + README — ui-kit/UPGRADES.md
Check: shots of the card at every size, looked at by Claude; full screen asked only on a tap, never on a computer by default; ui-kit tests + starter-check green.

## F193 🧱 New version on first visit, fixed
Done when: the Version module has one update starter with Goops' fix (a page that already ran under the game's worker swaps to the new version; a first visit never reloads), handed the game's own update hookup so a game without offline mode can still import the module; plus a test helper for each game's "new version arrives" check.
- [ ] 🤖 14. Every case written down (first visit, returning player, a player from an older version's worker) and what Glyphtender, Goops and Roll Better each do today — version/kit/index.ts
- [ ] 🤖 15. The update starter with Goops' fix — test red first — version/kit/index.ts
- [ ] 🤖 16. The e2e helper for a game's sw-update check — version/kit/e2e.mjs
- [ ] 🤖 17. UPGRADES note + VERSION + README — version/README.md
Check: each case has a test; version tests green.

## Wrap-up
- [ ] 🤖 18. Framework check:fast green after the merges, /code-review on the sprint, the planner republished — scripts/check-modules.mjs

## Notes
- Open bugs: none open P0/P1 in BUGS.md. The golden-save gap (ROADMAP Ideas 2026-11-04) is F190.
- Claude's call: the update starter is handed the game's own registerSW, so a game without offline mode can still import the Version module.
- Claude's call: the replay check only runs on saves that hold moves (Goops' progress save has none).
- Claude's call: one helper per feature in its own worktree, side by side (different modules). Each bumps only its own module's VERSION; F191 and F192 both touch the UI kit, so F191 bumps it and F192 adds its line under the same version at merge (main bumps once).
