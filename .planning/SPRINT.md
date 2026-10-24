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
- [ ] 🤖 1. Sort the 56 by cause (kit part vs demo) with a before shot of each — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. Fix the kit-part causes (cut-off names → the kit's fit / wrap rules) — ui-kit/kit/blocks/flow.tsx
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
