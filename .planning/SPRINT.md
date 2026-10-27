# Sprint 44 — The coding rules check themselves
Started 2026-10-26 · Milestone v0.26 Rules check themselves · Features: F90
Muzzy 2026-10-26 (/sprint): picked "Rules check themselves" for v0.26; plan OK'd as written.
What changes: a game's `npm run lint` (part of every quick check) refuses React state set inside useFrame and tuning numbers written into game logic — errors in new games (the starter), warnings in a game that installs it later, so nothing turns red overnight. What stays the same: every game until it installs the new lint module, how everything looks and plays.

## F90 🔧 Coding-standard lint rules
Done when: a framework `lint` module ships two ESLint rules (no React state set inside a useFrame callback; no tuning numbers in game logic, with `// tuning-ok: <why>` for real constants), each with a test that fails on bad code, install-module adds them to a game's eslint.config.js, and the starter takes it with every check green.
- [ ] 🤖 1. Measure first: draft both rules and run them over the starter, Roll Better, Goops and Glyphtender (read-only, scratch copies); list every find per game in Notes and decide from them which numbers are harmless (0, 1, list positions…) — eslint.config.js
- [ ] 🤖 2. Rule: no React state set inside useFrame (a useState setter or dispatch called in the callback), RuleTester test red on bad code — lint/kit/rules.mjs
- [ ] 🤖 3. Rule: no tuning numbers in game logic (which files count, the harmless numbers from task 1, the `// tuning-ok: <why>` escape), RuleTester test red on bad code — lint/kit/rules.mjs
- [ ] 🤖 4. The module + installer: lint/kit/VERSION, `bmuz` folders in its package.json, an installer that adds the rules to a game's eslint.config.js (errors in a new game, warnings with a count in an old one), tests; root check:fast runs its tests — scripts/check-modules.mjs
- [ ] 🤖 5. The starter takes it (install-module); fix or mark its finds; its check:fast + check:full green — starters/turn-based/eslint.config.js
- [ ] 🤖 6. README + VERSION; CLAUDE.md's two "③ until F90" lines (tweakable values in content/, R3F refs in useFrame) become ② with the check named; finds in other games go to Ideas as hand-offs — README.md
Check: each rule's test red on bad code, then green; the starter's `npm run check:full` green with the module; root check:fast green; the task-1 find list accounted for (fixed, marked, or handed to the game).

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Claude's calls (2026-10-26): errors in new games, warnings in an old game at install (with a count) so its checks don't go red overnight; the harmless-number list comes from task 1's real finds, not a guess. The rules ship as a framework module (games copy modules in; lint configs already ignore module folders, so the rules sit in the game's own lint, not in a module's).
