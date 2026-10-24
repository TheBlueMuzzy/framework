# Sprint 32 — Checks you can trust
Started 2026-10-24 · Milestone v0.15 Checks you can trust · Features: F118, F119, F120
Muzzy 2026-10-24: /develop after the /sprint options (no pick → Claude's pick a, as offered; his OK covers F118's BMUZ template change). Auto mode: helpers per feature group, commit per task, save per feature, waits for his OK; nothing released.
What changes: a busy port fails at once and names who holds it; the kit's gallery passes its own checks; the framework check stops building shell strings. What stays the same: every game, and how the kit looks (fixes keep each part's look).

## F118 🔧 Port pre-flight in check:full
Done when: the check-all template, before starting any e2e, collects every port its scripts will use (the E2E list's args + each script's declared ports) and checks each; a taken port fails the run at once naming the port, the process (command line) and its folder, plus the stop-servers.mjs line to free it; free ports → no change; works on Windows and in GitHub's Linux runner; games get it when their check-all is updated (checkup names older copies).
- [ ] 🤖 1. Collect the run's ports (E2E args + the "ports:" each script declares) — ~/.claude/config/bmuz/templates/check-all.mjs
- [ ] 🤖 2. Who holds a port: a small cross-platform lookup (Windows netstat + process command line; Linux ss/lsof) shared with stop-servers.mjs — ~/.claude/config/bmuz/scripts/stop-servers.mjs
- [ ] 🤖 3. Fail fast with the plain message + the line to free it; tests with a real listener — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [ ] 🤖 4. Checkup / update path: games with an older check-all are named, and the change is copied into a scratch Goops clone and run with 5291 held — ~/.claude/config/bmuz/HOOKS.md
Check: test-scripts green; a scratch Goops check:full with a server on 5291 fails in seconds naming it, and passes once it's stopped.

## F119 🔧 The UI kit gallery passes its own layout checks
Done when: `npm run shoot` in ui-kit reports 0 problems (was 56: 34 cut-off texts — Results names, the Room share line — and 22 overlaps — Feedback toast, lobby, hud), each fixed at its cause (the kit part when a game would hit it too; the demo when only the demo is wrong), every style and size; screenshots before / after of each fixed screen.
- [x] 🤖 1. Sort the 56 by cause (kit part vs demo) with a before shot of each — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Fix the kit-part causes (cut-off names → the kit's fit / wrap rules) — ui-kit/kit/blocks/flow.tsx
- [ ] 🤖 3. Fix the demo-only causes — ui-kit/gallery/Screens.tsx
- [ ] 🤖 4. Shoot reports 0; tests for any kit-part change; after shots looked at — ui-kit/kit/VERSION
Check: `npm run shoot` → 0 problems; ui-kit tests + check-ui + root check:fast; before / after shots of every changed screen looked at by me.

## F120 🔧 check-framework never builds a shell string
Done when: `t.run` in check-framework passes an argument list (no `shell: true` with a joined string); npx / .cmd on Windows still work; a test file named with `$( )` or `;` runs nothing; Dev Kit patch version.
- [ ] 🤖 1. Run commands as argument lists (Windows .cmd handled without a shell string) — devkit/kit/check-framework.mjs
- [ ] 🤖 2. Tests: odd file names are passed as data; npx still runs on Windows — devkit/kit/check-framework.test.mjs
- [ ] 🤖 3. Same pattern elsewhere? grep the framework + BMUZ scripts for shell: true with joined strings; fix or list — devkit/README.md
Check: devkit tests + root check:fast; check:framework on a scratch Goops clone still passes.

Notes:
- F119 task 1, the 56 sorted (before shots: ~/Documents/dev/.scratch/framework-f119/before/, 39 screens):
  - KIT, 34 cut-off: one rule, `.kit-result-name > .kit-text` ellipsis (Results names: results phone ×5 styles "Muzzy" + "Sherman Meredith" = 10, endgame / endgamedim phone ×5 + landscape ×4 each = 18 "Muzzy"; the Lobby room's share line: room phone ×5 + roomauto clean = 6). A real game with 5 players or the kit's own default words hits it.
  - KIT, 5 overlaps: Lobby room on a phone on its side (cartoon, cozy ×2, neon, pixel): Leave / I'm ready wrapped onto two lines in the 1 : 1.25 left column and, pinned to the bottom of a minmax(0, 1fr) row, slid up over the waiting line.
  - DEMO, 4 overlaps: Feedback (clean phone) — its toasts sit over the gallery's own top bar (Menu / style switcher), which no game has.
  - DEMO, 13 overlaps: HUD on a phone on its side (clean 1, cartoon 3, cozy 3, neon 1, pixel 5) — the sample packs 3 vitals bars, a 3-line turn banner and seats with Roll stacked under them into 335 px of height (390 minus the gallery bar).
- F119 call (Claude): names WRAP rather than shrink — the kit's MenuHeader rule (never split a word, never "…"); badges move under the name when the row is narrow. Lobby room landscape: columns half and half + a plain 1fr last row (too little height → the card's last-resort scroll, never buttons over words). On a 667×375 phone cozy / pixel now scroll ~10 px instead of overlapping.
- F119: UI kit VERSION → 0.33.0 (kit parts changed). OLD_MODULE_ROWS kept; conformance.mjs comment + README now say "out in 0.34.0, kept through 0.33.0" (Glyphtender still hasn't reinstalled crashes / emotes / ai). CHANGELOG / v0.16.0 release notes still say 0.33.0 — history, left as written. Still says 0.32.0/0.33.0 outside this repo: `~/.claude/config/bmuz/MODULE-CONTRACTS.md` — for the main session.
