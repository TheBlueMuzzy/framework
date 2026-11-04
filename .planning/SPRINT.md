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
Checked: 2026-11-03 — on the old code stop-servers 6/9 (✗ dry run, ✗ stop by port, ✗ unnamed port) and port-preflight 8/15 (incl. ✗ closing connections = free); fixed: 9/9 + 15/15 three runs in a row, then 9/9 + 16/16 after the review fixes (holder test: a flag's number, a browser URL, a bare shell aren't holders). Live: the starter's copy found the F170 helper's servers on 6403 + 6499 that netstat left out, and named 5173's real holder (`npx vite --port 5173`). Pushed to ~/.claude-config (e63fb19, b9b2d0f, 202bee4). Framework check:fast 24/24 (4:29 PM). Approved by Muzzy 2026-11-03.

## F170 🐞 Starter online test race
Done when: the starter's online test passes on a slowed-down PC 10 times in a row, and the race it lost on GitHub is named and fixed.
- [x] 🤖 1. Reproduce on a slow machine (CPU throttled in the test browser) — find which step loses the race — starters/turn-based/e2e/online.mjs
- [x] 🤖 2. Fix the root cause in the game code or the test's wait (whichever is wrong) — starters/turn-based/src/ui/OnlineScreen.tsx
- [x] 🤖 3. Prove it: 10 throttled runs green; starter check green — starters/turn-based/e2e/online.mjs
Check: 10 throttled runs in a row green; check:full on the starter; GitHub run green.
Checked: 2026-11-03 (helper, read and merged by Claude) — the race: results drawn from the room's phase alone stayed up over the rematch's new board until the room message caught up; reproduced word for word by holding one tab's room message 1 s; the test now holds it 800 ms every run (old code: red 2/2). 10/10 green at 5× CPU throttle + the hold; starter check:fast 5/5, check:full 10/10 (1.3 min). Claude checked: the room only turns "over" when the rules say the game is over, so `phase === 'over' && game.over` can't hide real results. GitHub Checks green on dev/v0-34-checks (run 41722640212, 2026-11-03). Approved by Muzzy 2026-11-03.

## F171 🔧 Checks notice a busy PC
Done when: when check:fast fails only on timeouts, it says "timeouts only — the PC is busy (busiest: <process>)" and re-runs those modules one at a time, reporting their real result.
- [x] 🤖 1. Measure today: what check:fast prints when a module times out under load — scripts/check-modules.mjs
- [x] 🤖 2. Tests red first: timeouts-only → re-run alone; a real failure → still red — scripts/check-modules.mjs
- [x] 🤖 3. Name the busiest process; re-run the timed-out modules one at a time — scripts/check-modules.mjs
- [x] 🤖 4. Root check:fast green on a quiet PC and on a loaded one — scripts/check-modules.mjs
Check: new tests red then green; check:fast under a fake load.
Checked: 2026-11-03 — busyPc tests red (no file) then 7/7. Fake load = 1.5 spinning Node per CPU core. Old check:fast under load: 11 of 24 red, no word why. New, load ending partway (like another chat's job): 10 timed out → "timeouts only — the PC is busy" → re-run one at a time → all 24 passed. New, load kept on the whole time: 8 of 10 passed alone; ai + audio ran out of time alone too → still red, now with "too busy to tell — run again when it's quieter". The proof runs found 2 more vitest timeout wordings (worker pool) — added with tests. Quiet: 24/24 (3:38 PM, 4:29 PM). Approved by Muzzy 2026-11-03.

## Notes
- Code review (fresh reviewer, F177 + F171 diffs): 2 real bugs fixed — Playwright's "Test timeout of N ms" wasn't a timeout; the command-line fallback matched any `=N` flag (`--max-old-space-size=4096`) and could stop the wrong server → port-shaped words only, browsers + bare shells skipped, a guess pointing at 2+ servers is refused. Weaker notes accepted as is: knocks only 127.0.0.1 / ::1 (a LAN-only server counts free); the busiest name is only a label (it can be idle once the load ended — seen: "WRSA ×2 3%").
- Surprise (4:27 PM): the hand-back hook's own check:fast ran beside my background proof run; both use crashes' node_modules/.cache/worker-typecheck, and one removed it under the other → 1 red (TS5058). Not a code bug — quiet re-run 24/24. → Ideas.
- F171 (2026-11-03): the timeout logic lives in scripts/busyPc.mjs (timedOut · busiestProcess · rerunTimeouts), check-modules calls it after the run. Tried live: it named the F170 helper's chrome-headless-shell at 36% (1.7 s to ask). Claude's call: a timed-out check gets ONE more go alone (not more) — failing alone too = red.
- Open bugs: none open in the framework.
- Claude's call (2026-11-03): the two port bugs (stop-servers misses a listener · pre-flight refuses closing connections) are one feature — same lookup, same file.
- Measured 2026-11-03 (planning): test-scripts stop-servers still red ("stopped by port → the port stays free" ✗, then EPERM removing its temp folder); netstat listed no row for the test's port while it answered.
- F177 measured 2026-11-03 (3 servers started from this shell, 20 rounds): netstat -ano listed each 1 time in 20, Get-NetTCPConnection 0–2, a connect 20/20, a bind attempt failed 20/20. Same live: 5173 (another project's vite) showed only TIME_WAIT rows in netstat while it answered. So the knock is the truth; netstat only names who.
- F177 surprise: the command-line fallback first named Claude Code's own shells as 5173's holder (their commands mention the port) — shells and this process's parents are skipped now, with a test.
- Claude's call (F177): ports.mjs keeps heldPorts() a plain (sync) call — the knock runs in a child Node — so a game with an older check-all and the new ports.mjs still works.
- F170: CPU throttle alone (5×, 6× ×8, 8×, 12×, 20×) never failed the test (11 runs green) — but a page probe showed the old results over the rematch's empty board in EVERY run (1–12 DOM changes, ~30 ms). Cause: the server sends a rematch as two messages, the new board (view) first, then the room (phase "playing"); OnlineScreen showed the results while room.phase was "over", so between the two the old results (retitled "It's a draw") stayed up over the new board, its board inert. Holding B's (or A's) room message 1 s reproduced GitHub run 41702523187 exactly ("Play again left the results up", "over after 0 moves"); online.mjs now holds B's 800 ms every run: red 2/2 on the old code.
- F170 (fix measured 2026-11-03): with the fix, 10/10 green at 5× CPU throttle + the 800 ms hold (13–15 s each); the probe saw 0 frames of results over the new board (was 1–12); unthrottled 8–9 s. Starter check:fast ALL PASS, check:full ALL PASS 10/10 (1.3 min). check:full first refused twice: 6403 / 6499 showed LISTENING with owner 0 while refusing connections — F177's case, while another worktree used the ports. GitHub run not checked (not pushed).

Retro (Muzzy 2026-11-03: "your pick" — Claude's draft):
- Went well: every fix was proven failing first, then passing, on real runs — including a fake busy PC (old check:fast 11/24 red, new 24/24).
- Went wrong: the hand-back hook's check:fast ran beside my own background run and their shared folder clash turned one test red (logged in Ideas).
- Change: never leave a check running in the background when ending a turn.
