# Table

The foundation a turn-based game's rules stand on (framework v0.4 — design: `../.planning/design/table.md`). Proven slice by slice in Glyphtender v0.6. Kit **0.1.0** — Game core.

## What a game gets (0.1.0 — Game core)
| Part | Does |
|---|---|
| `core.ts` — `Rules` | The one contract a game fills in: `setup` · `legalActions(state, seat)` · `check` (plain-English no) · `apply → { state, events }` · `isOver` · `toAct` · `viewFor(state, seat)`. Pure: no screen, no network. Same rules on the phone, the server, bots, sims and tests |
| Events | Every action returns what happened, each event tagged with who may see it (`seen: 'all' \| { seats }`). `eventsFor(events, seat)` = what one seat is sent |
| Move record | `{ setup, moves: [{ seat, action }] }` + `addMove` + `replay` — replays, bug reports, golden games, AI training data. Not the end screen's summary log |
| Fast mode | `apply(…, { fast: true })` skips end-screen bookkeeping for bots and sims; the game plays the same |
| `selfTest.ts` | Plays whole games through a game's rules and checks every promise (legal actions pass check, no repeats, apply never edits its input, fast mode = same game, events say who sees them, views are plain data, records replay). A game runs it in its own tests |

Coming next (v0.4): Turns & flow · Zones & pieces · Drag referee · Hand view · Seats & per-seat views.

## Install / update in a game
`node table/scripts/install-table.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/table/` with a VERSION stamp. Tests stay here (`npm test` in `table/`).
