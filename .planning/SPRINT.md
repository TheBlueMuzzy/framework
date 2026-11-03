# Sprint 52 — Checks that don't cry wolf
Started 2026-11-03 · Milestone v0.34 · Features: F177, F170, F171 (in this order)

## F177 🐞 Port lookup you can trust
Done when: stop-servers finds (and stops) a server started from Claude Code's shell, the port pre-flight sees it too, and a port with only closing connections counts as free.
- [ ] 🤖 1. Measure today: a listener started here vs netstat / Get-NetTCPConnection / a connect test — which lookups see it, ~20 tries — ~/.claude/config/bmuz/templates/ports.mjs
- [ ] 🤖 2. Tests red first: a missed listener, and a port with only closing rows — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [ ] 🤖 3. The lookup sees every listener and counts only LISTENING rows (owner 0 = free) — ~/.claude/config/bmuz/templates/ports.mjs
- [ ] 🤖 4. stop-servers refuses "nothing is listening" while the port still answers; the test cleans up its own server — ~/.claude/config/bmuz/scripts/stop-servers.mjs
- [ ] 🤖 5. Starter's copy matches the template; suites green; push ~/.claude — starters/turn-based/scripts/ports.mjs
Check: stop-servers + port-preflight suites red then green, 3 runs in a row; the starter check.
Checked:

## F170 🐞 Starter online test race
Done when: the starter's online test passes on a slowed-down PC 10 times in a row, and the race it lost on GitHub is named and fixed.
- [x] 🤖 1. Reproduce on a slow machine (CPU throttled in the test browser) — find which step loses the race — starters/turn-based/e2e/online.mjs
- [ ] 🤖 2. Fix the root cause in the game code or the test's wait (whichever is wrong) — starters/turn-based/src/ui/OnlineScreen.tsx
- [ ] 🤖 3. Prove it: 10 throttled runs green; starter check green — starters/turn-based/e2e/online.mjs
Check: 10 throttled runs in a row green; check:full on the starter; GitHub run green.
Checked:

## F171 🔧 Checks notice a busy PC
Done when: when check:fast fails only on timeouts, it says "timeouts only — the PC is busy (busiest: <process>)" and re-runs those modules one at a time, reporting their real result.
- [ ] 🤖 1. Measure today: what check:fast prints when a module times out under load — scripts/check-modules.mjs
- [ ] 🤖 2. Tests red first: timeouts-only → re-run alone; a real failure → still red — scripts/check-modules.mjs
- [ ] 🤖 3. Name the busiest process; re-run the timed-out modules one at a time — scripts/check-modules.mjs
- [ ] 🤖 4. Root check:fast green on a quiet PC and on a loaded one — scripts/check-modules.mjs
Check: new tests red then green; check:fast under a fake load.
Checked:

## Notes
- Open bugs: none open in the framework.
- Claude's call (2026-11-03): the two port bugs (stop-servers misses a listener · pre-flight refuses closing connections) are one feature — same lookup, same file.
- Measured 2026-11-03 (planning): test-scripts stop-servers still red ("stopped by port → the port stays free" ✗, then EPERM removing its temp folder); netstat listed no row for the test's port while it answered.
- F170: CPU throttle alone (5×, 6× ×8, 8×, 12×, 20×) never failed the test (11 runs green) — but a page probe showed the old results over the rematch's empty board in EVERY run (1–12 DOM changes, ~30 ms). Cause: the server sends a rematch as two messages, the new board (view) first, then the room (phase "playing"); OnlineScreen showed the results while room.phase was "over", so between the two the old results (retitled "It's a draw") stayed up over the new board, its board inert. Holding B's (or A's) room message 1 s reproduced GitHub run 41702523187 exactly ("Play again left the results up", "over after 0 moves"); online.mjs now holds B's 800 ms every run: red 2/2 on the old code.
