# Sprint 66 — Steadier and safer
Started 2026-11-07 · Milestone v0.42 · Features: F207, F208, F209, F210 (all four side by side — their files don't overlap)

## F207 🐞 Starter's online test stops flaking
Done when: the starter's online e2e waits for what each click really needs (both tabs seated, the button there and enabled) instead of a bare click, and passes 10 runs in a row here — the GitHub click timeout (runs 42412069026 and two before) has a named cause.
- [x] 🤖 1. Find what the timed-out click waits on (read GitHub's failed run log + the script; reproduce under load if needed) and write the cause in Notes — starters/turn-based/e2e/online.mjs
- [x] 🤖 2. Wait for that thing instead (never a set time) — starters/turn-based/e2e/online.mjs
- [x] 🤖 3. 10 runs in a row green here (plus 3 under a busy PC), and GitHub green after the push — starters/turn-based/e2e/online.mjs
Check: 10/10 local runs green; GitHub's Checks green on the branch.
Checked: 2026-11-07 — helper (e5e5fb8): cause reproduced, not guessed — a tab tapped again on its own stale view before the server's reply (slow round trip), the reply landed mid-click, its squares closed and the click waited 30 s for a turn only the other tab (queued behind it in the same loop) could give: a test copy delaying every server message 30–250 ms gave "over after 30 moves" for a 7-move game and GitHub's exact timeout at 120 ms; the fixed script 5/5 green under the same delays. Also matches runs 42412069026 + 41705632114 (41967106787: an older form of it; 42251517736 + 42315340271 were other checks). 10/10 green here, 3/3 under load, starter check:fast all pass, GitHub run 42421945232 13/13 jobs green. Claude read the change: tap a named square, wait for its mark on both tabs; a fixed 400 ms wait replaced by waiting for the results to close — fine.

## F208 🔧 Dev Kit pages need a pass
Done when: the dev server hands each page it serves a per-session secret, the Dev Kit sends it with every call to its dev-server routes (save, font library, add font…), and a request without it is refused — so the desktop, a second browser, another machine pointed at it and the phone all keep working, but a hand-made request from another device on the Wi-Fi is refused.
- [x] 🤖 4. The dev server makes a secret per run and puts it in the page it serves — tests — devkit/vite/devkitVite.ts
- [x] 🤖 5. Every Dev Kit call to its dev-server routes sends it — devkit/kit/DevKit.tsx
- [x] 🤖 6. Routes refuse a request without it (plain message), keeping the existing path checks — tests — devkit/vite/devkitVite.ts
- [x] 🤖 7. Prove in the starter: Save from the Dev Kit works (page opened by 127.0.0.1 and by the LAN address); a curl to the same route is refused; README + UPGRADES — devkit/README.md
Check: devkit tests; the starter's devkit-live e2e green; a hand-made request refused; a page opened by the LAN address saves.
Checked: 2026-11-07 — helper (80bddfd, 61433d8, Dev Kit 0.32.0): devkit 585/585, typecheck clean, lint 0 errors; starter check:fast 5/5, devkit-live OK incl. "Save sent the Dev Kit key the page was served", check:framework PASS (52 kept, 1 skipped); framework check:fast 24/24. Proof on the starter (port 6303): a page at http://192.168.1.152:6303/ and one at 127.0.0.1 each saved a file; 7 curl calls to the LAN address (save, wrong key, font list, font file, add-credit, save-audio, font add) all 403 with the plain message, nothing written, the key in 0 log lines. Claude read the key code: 32 random bytes per dev-server run, sha256 + timingSafeEqual, only pages the dev server serves (ctx.server), checked after every older check — fine.

## F209 🔧 Release maps never overwritten
Done when: a release build (CRASHES_MAPS=release) refuses to replace a map already under releases/<version>/maps/ (or one git tracks), with a plain message, and a test proves it; check builds are unchanged.
- [x] 🤖 8. moveMaps refuses an existing release map, plain message naming the folder — tests — crashes/kit/vitePlugin.mjs
- [x] 🤖 9. README + UPGRADES note, crashes version bump — crashes/README.md
- [x] 🤖 10. release.mjs still works on a game (a dry run against a scratch copy of the starter) — crashes/kit/vitePlugin.mjs
Check: crashes tests; a second release build of the same version refused, the first one fine.
Checked: 2026-11-07 — helper (0b4f43d, crashes 0.3.1): crashes 168/168, lint + typecheck clean; a minimal game in .scratch/framework-f209 built with the real `vite build`: 1st CRASHES_MAPS=release build → 1 map filed, 2nd → exit 1 with the plain message, the filed map's sha1 unchanged; 2 check builds → both fine (node_modules cache). Claude: the new test is red on the old plugin (1 failed | 6 passed) and green on the new (7/7); read the diff (checks before moving anything, release only).

## F210 🐞 Hand-off check reads the right project
Done when: the hand-off check names features from the project the turn's tools worked in (the repo of the files edited / commands run), not the folder the chat started in — a framework-started chat working in Glyphtender gets Glyphtender's feature names; tested.
- [ ] 🤖 11. Reproduce: a test where the session folder and the worked-in repo differ gets the wrong names today — ~/.claude/config/bmuz/hooks/rules/handoff-check/HC2.feature-names.mjs
- [ ] 🤖 12. Pick the project from the turn's tool calls (edited file paths, a cd in Bash), falling back to the session folder — tests — ~/.claude/config/bmuz/hooks/handoff-check.mjs
- [ ] 🤖 13. The hooks' own tests green; pushed to ~/.claude-config — ~/.claude/config/bmuz/hooks/tests/
Check: the hooks' tests (incl. the new one) green; config pushed.

## Notes
- Muzzy 2026-11-07: "auto mode… take over this development process while I'm gone" (~5 h, at a party). Claude plans, merges, checks, reviews, saves; features wait for Muzzy's OK; no /deliver.
- Muzzy's question on F208 (laptop + desktop both use the Dev Kit): answered — the secret is in every page the dev server serves, so any browser that opened the game works (laptop, desktop, phone); only a request that never opened the page is refused. Muzzy: "ok".
- Open bugs: no BUGS.md.
- F207 (helper): the room server always uses port 6499 (wrangler.json), so only one online e2e can run on this PC at a time.
- F209 (helper): release.mjs called the refused build "the build failed — make them by hand", wrong advice here → Claude added a branch in ~/.claude/config/bmuz/scripts/release.mjs that says the filed maps stand (syntax-checked; no release.mjs tests exist). A refused build leaves its new .map files in dist/ — harmless, a failed release build is never deployed.
