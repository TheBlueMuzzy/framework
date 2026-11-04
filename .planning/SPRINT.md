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
Checked: 2026-11-03 — the order test red on the old server (2 wrong moments: #15 "over" before the last board, #18 a rematch board before "playing"), green after; rooms 214/214 + typecheck. Starter took rooms 0.13.0 → 0.15.0 (installer: lint + code checks pass). With the starter's own `&& game.over` removed, its online test (B's rematch room message held 800 ms every run) passed 3/3 — the server order alone does it, so the extra check is gone and the comment points at the rule. Starter check:full 10/10 (1.3 min); its results shot (online-A-results.png) shows "You win!", both seats ranked, Leave + Play again, padded.

## F178 🔧 check:fast refuses a second run
Done when: a second framework check:fast while one is running waits for it (saying so) instead of breaking it, and the crashes worker test no longer shares one folder between runs.
- [ ] 🤖 1. Measure today: two check:fast at once — which tests clash, and on what — scripts/check-modules.mjs
- [ ] 🤖 2. Tests red first: a second run waits for the first, then runs; a lock left by a dead run is ignored — scripts/busyPc.test.mjs
- [ ] 🤖 3. check:fast takes a lock (like check:full's .check-lock) — scripts/check-modules.mjs
- [ ] 🤖 4. The crashes worker test uses its own folder per run — crashes/templates/worker/worker.test.ts
- [ ] 🤖 5. Two check:fast at once: both green — scripts/check-modules.mjs
Check: new tests red then green; two runs at once both green.
Checked:

## Notes
- F179 measured 2026-11-03 (a tab's messages replayed in order, start → end → rematch → end → rejoin): 2 wrong moments, not 1 — #18 a rematch's empty board (total 0) while the room still said "over" (the F170 — Starter online test race bug), and #15 the room said "over" one message BEFORE the last move's board (total 9) — a phase-only game would show results over a board missing its final move.
- Claude's call (F179): one rule, "when the room says over, the board is the finished one" — the end sends the last board, then the room; a start sends the room ("playing"), then the new board. Not one combined message: that changes the protocol for every client; the order alone fixes both moments. A start's brief "playing + last match's finished board" is harmless (no results, nobody's turn changes until the new board lands).
- Open bugs: none open in the framework.
- Planning (2026-11-03): handleStart sends views (afterGameChanged) THEN the room; a match's end sends the room THEN views — the F170 — Starter online test race root cause.
