# Sprint 20 — replays and fair leaderboards
Started 2026-10-20 · Milestone v0.10 · Features: F94, F98
Researched first (code map 2026-10-20 + `.planning/research/saves.md` layers 3 and 7): Glyphtender is replayable today (seeded mulberry32 in the state, the table module's `MoveRecord` + `replay()`, golden games already check it) — its vs-AI game just keeps no move list. Goops isn't (its tick takes the frame's real time) and Roll Better isn't (physics dice, trusted from the browser) — both → ROADMAP Ideas. So both features are proven on scratch Glyphtenders. F98 builds on F94's replay piece → F94 first, then F98. Nothing deployed; going live stays Muzzy's call. Queue after: 21 F97 stores/Steam + F99 Unity.

## F94 🧱 Saves: seed + move log
Done when: a game's run can be saved as its rules version + setup (seed) + moves and rebuilt by replaying them, the replay matches the live game exactly (checked), a record from another rules version is refused politely, and a daily seed gives everyone the same game each day — proven in a scratch Glyphtender vs the AI (Continue rebuilds by replay; a Daily game).
- [ ] 🤖 1. The replay piece on the table module: recordRun({ rulesVersion, setup, moves }), replayRun(rules, record), sameResult(live, replayed), dailySeed(gameId, utcDate) — saves/kit/replay.ts
- [ ] 🤖 2. Exported, in the framework check, documented (README layer 3, design layer 3) — saves/kit/index.ts, saves/kit/conformance.mjs, saves/README.md
- [ ] 🤖 3. Scratch Glyphtender: the vs-AI game keeps its MoveRecord (people and AI moves) — src/store/gameStore.ts (in the scratch copy)
- [ ] 🤖 4. Scratch Glyphtender: Continue (F93) rebuilds the game by replay; a "Daily game" on the day's seed — ui/newGame.ts (in the scratch copy)
- [ ] 🤖 5. Tests: replayed == live end state at every move (golden fingerprint); another rules version → a plain refusal — saves/kit/replay.test.ts
Check: scratch Glyphtender vs the AI, a few turns, reload → Continue rebuilds by replay to the identical state; two browsers start the Daily game on the same day → the same opening; a record with an old rulesVersion → refused with a plain message; replay tests green.
Ask Muzzy: —

## F98 🧱 Saves: checked leaderboards
Done when: a finished game's record is sent to the game's own board worker, which replays it with the game's own rules and stores the score IT computed (never a sent one); the day's board shows 3-letter names; how many tries count per day is a per-game setting (`dailyTries`, asked at install like keepMatchDays); forged records (an illegal move, a changed score, another version, many at once) are refused; addresses only as a keyed hash; old scores deleted; a privacy line + "remove my score".
- [ ] 🤖 6. Board routes: submit a record → version + size check → replay → the server's own score → store; the day's board — saves/kit/boardRoutes.ts
- [ ] 🤖 7. Board worker template: SQLite Durable Object, `dailyTries` per game (1 · N · unlimited), keyed address hash, retention + alarm — saves/templates/ (a new board/worker.ts beside cloud/)
- [ ] 🤖 8. Installer: board worker settings + a wiring step that ASKS the designer for dailyTries (Muzzy 2026-10-20: "based on the game, like the 7 or 30 days") — saves/scripts/install-saves.mjs
- [ ] 🤖 9. Scratch Glyphtender: its board worker runs the game's own rules (like its party/ server); replay CPU measured against the free plan's 10 ms a request — over it → scores "checking…" until the alarm replays them
- [ ] 🤖 10. Security review from the first brief (sprint 19 lesson): forged-record tests (illegal move, changed score, wrong version, 30 sent at once, guessing names / days) — saves/kit/boardRoutes.test.ts
- [ ] 🤖 11. The board on screen: 3-letter names (arcade style — Muzzy), privacy line, "remove my score" — saves/kit/ui/
Check: scratch Glyphtender + local board worker: finish a Daily game → its score appears, computed by the server; a record with an illegal move, a changed score or an old version → refused; dailyTries 1 → a second finished game the same day doesn't change the board; remove my score → gone; measured replay ms on record; screenshots of the board at phone + desktop sizes.
Ask Muzzy: —

Notes:
- Muzzy 2026-10-20: daily tries "based on the game, much like the 7 or 30 days question" → per-game `dailyTries`, asked at install; names on the board: 3 letters, arcade style.
- Plan-lint: only the old F61 / F59 / F60 line (Goops' session). No open P0/P1 bugs.
