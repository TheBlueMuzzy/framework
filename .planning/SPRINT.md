# Sprint 32 — Checks you can trust
Started 2026-10-24 · Milestone v0.15 Checks you can trust · Features: F118, F119, F120
Muzzy 2026-10-24: /develop after the /sprint options (no pick → Claude's pick a, as offered; his OK covers F118's BMUZ template change). Auto mode: helpers per feature group, commit per task, save per feature, waits for his OK; nothing released.
What changes: a busy port fails at once and names who holds it; the kit's gallery passes its own checks; the framework check stops building shell strings. What stays the same: every game, and how the kit looks (fixes keep each part's look).

## F118 🔧 Port pre-flight in check:full
Done when: the check-all template, before starting any e2e, collects every port its scripts will use (the E2E list's args + each script's declared ports) and checks each; a taken port fails the run at once naming the port, the process (command line) and its folder, plus the stop-servers.mjs line to free it; free ports → no change; works on Windows and in GitHub's Linux runner; games get it when their check-all is updated (checkup names older copies).
- [x] 🤖 1. Collect the run's ports (E2E args + the "ports:" each script declares) — ~/.claude/config/bmuz/templates/check-all.mjs
- [x] 🤖 2. Who holds a port: a small cross-platform lookup (Windows netstat + process command line; Linux ss/lsof) shared with stop-servers.mjs — ~/.claude/config/bmuz/scripts/stop-servers.mjs
- [x] 🤖 3. Fail fast with the plain message + the line to free it; tests with a real listener — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [x] 🤖 4. Checkup / update path: games with an older check-all are named, and the change is copied into a scratch Goops clone and run with 5291 held — ~/.claude/config/bmuz/HOOKS.md
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
- [x] 🤖 1. Run commands as argument lists (Windows .cmd handled without a shell string) — devkit/kit/check-framework.mjs
- [x] 🤖 2. Tests: odd file names are passed as data; npx still runs on Windows — devkit/kit/check-framework.test.mjs
- [x] 🤖 3. Same pattern elsewhere? grep the framework + BMUZ scripts for shell: true with joined strings; fix or list — devkit/README.md
Check: devkit tests + root check:fast; check:framework on a scratch Goops clone still passes.

Notes:
- F118 ports convention (template header): numbers ≥ 1024 in an E2E line's args + each script's `const …PORT = <number>` + a `// ports: …` header line. Goops' and Glyphtender's scripts already match it — no script edits needed. The lookup is `~/.claude/config/bmuz/templates/ports.mjs`; a game copies it to `scripts/ports.mjs` (check-all can't reach ~/.claude on GitHub's runner), stop-servers.mjs imports the template copy. On Windows a process's working folder can't be asked for, so "in <folder>" comes from its command line (the part before node_modules, or a script's folder) and is left out when the command line has neither (`node hold.mjs`).
- F118: checkup §7 + install-module name glyphtender and goops today (no pre-flight yet) — their copies get it on their next check-all update, not in this sprint.
- F120 grep (`shell: true` / string commands, framework + ~/.claude/config/bmuz): fixed `scripts/lib.mjs` `run()` — the DEP0190 source: npm/npx got an argument list WITH shell: true (install-module, extract, deps-check, release, live-check all go through it); now node + npm-cli.js / npx-cli.js like the Dev Kit, test `no-shell` in test-scripts. Left as they are (a fixed command line written in the code, no file names or repo text inside): framework `scripts/check-modules.mjs:25` (`npm run -s test|typecheck`), `devkit/kit/check-devkit.mjs:113` (`npx vite preview --port <number>`), `crashes/templates/worker/worker.test.ts:102` (`npx tsc -p "<temp folder>"` — crashes is another helper's this sprint), BMUZ `hooks/lib.mjs:388` (`npm run check:fast`), `hooks/smoke-pass.mjs:30` (`npm run smoke|e2e:smoke`). Command lines by design: `templates/check-all.mjs` FAST/E2E (the game's own check list, written as commands) and `hooks/check-ui-edit.mjs` (the game's `check:ui` script, run as npm would).
