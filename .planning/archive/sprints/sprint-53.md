# Sprint 53 — Steadier rooms and checks
Started 2026-11-03 · Milestone v0.35 · Features: F179, F178 (in this order)

## F179 🧱 Rooms messages in one order
Done when: at every moment a game can see (start, rematch, end, rejoin) the room and the board never disagree in the way that put last match's results over a new board — proven by a server test of the message order and the starter's online test without its own extra check.
- [x] 🤖 1. Measure today: a server test records the message order at start, rematch, end and rejoin — rooms/kit/server/roomServer.test.ts
- [x] 🤖 2. Pick the order (room before board at start, like at the end — or both in one message) and say why in Notes; test red first — rooms/kit/server/roomServer.test.ts
- [x] 🤖 3. The server sends them in that order — rooms/kit/server/roomServer.ts
- [x] 🤖 4. Say the rule in the README + a version note (rooms 0.15.0) — rooms/README.md
- [x] 🤖 5. Starter takes the new rooms; its online test (with the held-back message) green — starters/turn-based/e2e/online.mjs
Check: the order test red then green; rooms test + typecheck; starter check:full.
Checked: 2026-11-03 — the order test red on the old server (2 wrong moments: #15 "over" before the last board, #18 a rematch board before "playing"), green after; rooms 214/214 + typecheck. Starter took rooms 0.13.0 → 0.15.0 (installer: lint + code checks pass). With the starter's own `&& game.over` removed, its online test (B's rematch room message held 800 ms every run) passed 3/3 — the server order alone does it, so the extra check is gone and the comment points at the rule. Starter check:full 10/10 (1.3 min); its results shot (online-A-results.png) shows "You win!", both seats ranked, Leave + Play again, padded. Approved by Muzzy 2026-11-03.

## F178 🔧 check:fast refuses a second run
Done when: a second framework check:fast while one is running waits for it (saying so) instead of breaking it, and the crashes worker test no longer shares one folder between runs.
- [x] 🤖 1. Measure today: two check:fast at once — which tests clash, and on what — scripts/check-modules.mjs
- [x] 🤖 2. Tests red first: a second run waits for the first, then runs; a lock left by a dead run is ignored — scripts/busyPc.test.mjs
- [x] 🤖 3. check:fast takes a lock (like check:full's .check-lock) — scripts/check-modules.mjs
- [x] 🤖 4. The crashes worker test uses its own folder per run — crashes/templates/worker/worker.test.ts
- [x] 🤖 5. Two check:fast at once: both green — scripts/check-modules.mjs
Check: new tests red then green; two runs at once both green.
Checked: 2026-11-03 — lock tests 5/5, three runs in a row (after a fix: 2 of them first failed on a busy PC — a timed hold and a 1 s limit; now no timers). Two check:fast 3 s apart: the second printed "⏳ another check:fast is running here (process 56380, since 9:52:11 PM) — waiting for it" and ran after the first, one at a time (before: side by side). Both ran under another session's bot sims (scripts/bots/economy.mjs, ~76% CPU, named by F171): 2 of 24 red each (my test bug, fixed; and one module too slow even alone). Final check:fast on the same busy PC: 11 timed out → re-run alone → 24/24 (10:13 PM). crashes worker test passes with its own folder per run. BMUZ lock change pushed to ~/.claude-config (0f4bbd7). Approved by Muzzy 2026-11-03.

## Notes
- Code review (fresh reviewer, F179 + F178): 1 real bug — a tab that dropped before the last move and came back after it got "over" before the finished board (the join sent the room first) → the join follows the rule too (match on: room first; over: board first), 2 tests red on the old join, green after; rooms 216/216. 1 weak spot — an old BMUZ_CHECK_LOCK_HELD outliving its holder → the shortcut now needs the lock file to name it (+ test). My own extra test rule ("finished board while playing") was wrong — that IS the end's order — removed.
- F178 measured 2026-11-03 (two framework check:fast at once, 2 s apart): both ended 24/24, but only thanks to F171 — Checks notice a busy PC (3 and 4 timed-out checks re-run alone) — and each took twice as long; the crashes cache clash (TS5058) didn't repeat this time, but did at 4:27 PM.
- F178 found: BMUZ already had a check lock (`.git/bmuz-check.lock`, hooks/lib.mjs holdCheckLock — the hand-back hook, the commit check and /save take it), but a check:fast started by hand never took it, so the hook couldn't see my background run. Claude's call: check:fast takes the SAME lock (scripts/checkLock.mjs, same file + format), and holdCheckLock sets BMUZ_CHECK_LOCK_HELD=<its pid> for what it starts, so the hook's own check:fast doesn't wait on the hook. The crashes test also gets its own folder per run (worker-typecheck-<pid>) — the root clash, fixed too.
- F179 measured 2026-11-03 (a tab's messages replayed in order, start → end → rematch → end → rejoin): 2 wrong moments, not 1 — #18 a rematch's empty board (total 0) while the room still said "over" (the F170 — Starter online test race bug), and #15 the room said "over" one message BEFORE the last move's board (total 9) — a phase-only game would show results over a board missing its final move.
- Claude's call (F179): one rule, "when the room says over, the board is the finished one" — the end sends the last board, then the room; a start sends the room ("playing"), then the new board. Not one combined message: that changes the protocol for every client; the order alone fixes both moments. A start's brief "playing + last match's finished board" is harmless (no results, nobody's turn changes until the new board lands).
- Open bugs: none open in the framework.
- Planning (2026-11-03): handleStart sends views (afterGameChanged) THEN the room; a match's end sends the room THEN views — the F170 — Starter online test race root cause.

Retro (Muzzy 2026-11-03: "retro good" — Claude's draft, kept):
- Went well: the reviewer caught a real reconnect bug before release, and every fix was proven by a test that failed first.
- Went wrong: two of my new lock tests used fixed timings that broke on a busy PC, and one of my own test rules was wrong.
- Change: a new test waits on a signal from the other process, never on a clock.
