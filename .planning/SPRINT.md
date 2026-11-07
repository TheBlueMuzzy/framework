# Sprint 65 — Checks that hold still
Started 2026-11-07 · Milestone v0.41 · Features: F204, F205, F206 (in this order)

## F204 🔧 Version label holds still in screenshots
Done when: while a check holds the screen still (the screenshot check's freeze switch), the menu and Settings show one fixed version label, so raising a game's build number leaves the before/after screenshot check green — the real version is still what checkVersion and the crash reports see; the starter and the shots template use it.
- [ ] 🤖 1. Prove it: a scratch copy of the starter with its build number raised turns the shots check red on menu + Settings — .scratch (proof only) · starters/turn-based/e2e/shots.mjs
- [ ] 🤖 2. The version module shows a fixed label ("v0.0.0.0") while the page is held still; versionLabel stays the real one for checkVersion and crash reports — tests — version/kit/index.ts
- [ ] 🤖 3. The starter's menu and Settings use it, and the shots template + the starter's copy hold it still — starters/turn-based/src/ui/MainMenuScreen.tsx
- [ ] 🤖 4. README + upgrade note (how a game turns it on; Glyphtender's own freeze.ts can go) — version/README.md
Check: the scratch copy with a raised build number: shots check green; the version module's tests; the starter's check:full green.

## F205 🐞 Starter's screen check follows the game's orientation
Done when: the starter's e2e/screens.mjs shoots only the sizes content/ui/style.json's orientation allows (portrait: no sideways phones, landscape: no upright phones, any: all 7), the same way the shots check chooses them.
- [ ] 🤖 5. screens.mjs reads the orientation and picks its sizes like shots.mjs — starters/turn-based/e2e/screens.mjs
- [ ] 🤖 6. Prove it on a scratch copy set to "portrait" (5 sizes, no sideways shots) and on the starter ("any", 7 sizes) — starters/turn-based/e2e/screens.mjs
- [ ] 🤖 7. Every other copy that promises "the 7 sizes" (the starter's README, check-all's comment) says "the sizes the game plays at" — starters/turn-based/README.md
Check: the portrait scratch copy shoots 5 sizes; the starter's screens check is still green at 7.

## F206 🔧 Golden saves replay their moves
Done when: the saves check replays every golden save's moves through the game's rules (a hook the game gives), so a golden save with a move the rules refuse fails the check with the save's name and the move — and the starter wires it in.
- [ ] 🤖 8. Reproduce on today's code: a tic-tac-toe move in the starter's golden run save still passes — starters/turn-based/tests/saves/saves.test.ts
- [ ] 🤖 9. The saves module's golden-save check replays the moves through a rules hook the game gives — tests — saves/kit/oldSaves.ts
- [ ] 🤖 10. The starter gives its rules to the check; the bad save goes red, the real one green — starters/turn-based/src/game/saves.ts
- [ ] 🤖 11. README + upgrade note — saves/README.md
- [ ] 🤖 12. The starter's check:full green; the module's conformance names the new hook — saves/kit/conformance.mjs
Check: the bad-move golden save fails with its name and move; the starter's real golden saves pass; saves tests + the starter's check:full green.

## Notes
- Plan picked by Muzzy 2026-11-07 ("your pick").
- Read before planning: the version module bakes the real version in on the dev server too (version/kit/vitePlugin.mjs DEFINE_KEY), and the starter's own version.json hasn't changed since F151, so the starter never showed the break — a game whose /save raises its build does. Crash maps by script already landed (F174 — Crash maps by the release script), so that Idea isn't in this sprint.
- Open bugs: no BUGS.md open P0/P1.
