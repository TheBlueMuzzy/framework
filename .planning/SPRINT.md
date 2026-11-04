# Sprint 53 — Steadier rooms and checks
Started 2026-11-03 · Milestone v0.35 · Features: F179, F178 (in this order)

## F179 🧱 Rooms messages in one order
Done when: at every moment a game can see (start, rematch, end, rejoin) the room and the board never disagree in the way that put last match's results over a new board — proven by a server test of the message order and the starter's online test without its own extra check.
- [ ] 🤖 1. Measure today: a server test records the message order at start, rematch, end and rejoin — rooms/kit/server/roomServer.test.ts
- [ ] 🤖 2. Pick the order (room before board at start, like at the end — or both in one message) and say why in Notes; test red first — rooms/kit/server/roomServer.test.ts
- [ ] 🤖 3. The server sends them in that order — rooms/kit/server/roomServer.ts
- [ ] 🤖 4. Say the rule in the README + a version note (rooms 0.15.0) — rooms/README.md
- [ ] 🤖 5. Starter takes the new rooms; its online test (with the held-back message) green — starters/turn-based/e2e/online.mjs
Check: the order test red then green; rooms test + typecheck; starter check:full.
Checked:

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
- Open bugs: none open in the framework.
- Planning (2026-11-03): handleStart sends views (afterGameChanged) THEN the room; a match's end sends the room THEN views — the F170 — Starter online test race root cause.
