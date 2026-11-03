# Sprint 52 — Checks that don't cry wolf
Started 2026-11-03 · Milestone v0.34 · Features: F177, F170, F171 (in this order)

## F177 🐞 Port lookup you can trust
Done when: stop-servers finds (and stops) a server started from Claude Code's shell, the port pre-flight sees it too, and a port with only closing connections counts as free.
- [x] 🤖 1. Measure today: a listener started here vs netstat / Get-NetTCPConnection / a connect test — which lookups see it, ~20 tries — ~/.claude/config/bmuz/templates/ports.mjs
- [x] 🤖 2. Tests red first: a missed listener, and a port with only closing rows — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [x] 🤖 3. The lookup sees every listener — knocks on the port; netstat + command lines only name the holder (closing rows = free) — ~/.claude/config/bmuz/templates/ports.mjs
- [x] 🤖 4. stop-servers refuses "nothing is listening" while the port still answers; the test cleans up its own server — ~/.claude/config/bmuz/scripts/stop-servers.mjs
- [x] 🤖 5. Starter's copy matches the template; suites green; push ~/.claude — starters/turn-based/scripts/ports.mjs
Check: stop-servers + port-preflight suites red then green, 3 runs in a row; the starter check.
Checked:

## F170 🐞 Starter online test race
Done when: the starter's online test passes on a slowed-down PC 10 times in a row, and the race it lost on GitHub is named and fixed.
- [x] 🤖 1. Reproduce on a slow machine (CPU throttled in the test browser) — find which step loses the race — starters/turn-based/e2e/online.mjs
- [x] 🤖 2. Fix the root cause in the game code or the test's wait (whichever is wrong) — starters/turn-based/src/ui/OnlineScreen.tsx
- [x] 🤖 3. Prove it: 10 throttled runs green; starter check green — starters/turn-based/e2e/online.mjs
Check: 10 throttled runs in a row green; check:full on the starter; GitHub run green.
Checked:

## F171 🔧 Checks notice a busy PC
Done when: when check:fast fails only on timeouts, it says "timeouts only — the PC is busy (busiest: <process>)" and re-runs those modules one at a time, reporting their real result.
- [ ] 🤖 1. Measure today: what check:fast prints when a module times out under load — scripts/check-modules.mjs
- [x] 🤖 2. Tests red first: timeouts-only → re-run alone; a real failure → still red — scripts/check-modules.mjs
- [x] 🤖 3. Name the busiest process; re-run the timed-out modules one at a time — scripts/check-modules.mjs
- [ ] 🤖 4. Root check:fast green on a quiet PC and on a loaded one — scripts/check-modules.mjs
Check: new tests red then green; check:fast under a fake load.
Checked:

## Notes
- F171 (2026-11-03): the timeout logic lives in scripts/busyPc.mjs (timedOut · busiestProcess · rerunTimeouts), check-modules calls it after the run. Tried live: it named the F170 helper's chrome-headless-shell at 36% (1.7 s to ask). Claude's call: a timed-out check gets ONE more go alone (not more) — failing alone too = red.
- Open bugs: none open in the framework.
- Claude's call (2026-11-03): the two port bugs (stop-servers misses a listener · pre-flight refuses closing connections) are one feature — same lookup, same file.
- Measured 2026-11-03 (planning): test-scripts stop-servers still red ("stopped by port → the port stays free" ✗, then EPERM removing its temp folder); netstat listed no row for the test's port while it answered.
- F177 measured 2026-11-03 (3 servers started from this shell, 20 rounds): netstat -ano listed each 1 time in 20, Get-NetTCPConnection 0–2, a connect 20/20, a bind attempt failed 20/20. Same live: 5173 (another project's vite) showed only TIME_WAIT rows in netstat while it answered. So the knock is the truth; netstat only names who.
- F177 surprise: the command-line fallback first named Claude Code's own shells as 5173's holder (their commands mention the port) — shells and this process's parents are skipped now, with a test.
- Claude's call (F177): ports.mjs keeps heldPorts() a plain (sync) call — the knock runs in a child Node — so a game with an older check-all and the new ports.mjs still works.
- F170: CPU throttle alone (5×, 6× ×8, 8×, 12×, 20×) never failed the test (11 runs green) — but a page probe showed the old results over the rematch's empty board in EVERY run (1–12 DOM changes, ~30 ms). Cause: the server sends a rematch as two messages, the new board (view) first, then the room (phase "playing"); OnlineScreen showed the results while room.phase was "over", so between the two the old results (retitled "It's a draw") stayed up over the new board, its board inert. Holding B's (or A's) room message 1 s reproduced GitHub run 41702523187 exactly ("Play again left the results up", "over after 0 moves"); online.mjs now holds B's 800 ms every run: red 2/2 on the old code.
- F170 (fix measured 2026-11-03): with the fix, 10/10 green at 5× CPU throttle + the 800 ms hold (13–15 s each); the probe saw 0 frames of results over the new board (was 1–12); unthrottled 8–9 s. Starter check:fast ALL PASS, check:full ALL PASS 10/10 (1.3 min). check:full first refused twice: 6403 / 6499 showed LISTENING with owner 0 while refusing connections — F177's case, while another worktree used the ports. GitHub run not checked (not pushed).
