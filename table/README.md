# Table

The foundation a turn-based game's rules stand on (framework v0.4 — design: `../.planning/design/table.md`). Proven slice by slice in Glyphtender v0.6. Kit **0.6.0** — Game core + Zones & pieces + Turns & flow + Event feed + Drag referee + Rack order + Seats.

## What a game gets (0.1.0 — Game core)
| Part | Does |
|---|---|
| `core.ts` — `Rules` | The one contract a game fills in: `setup` · `legalActions(state, seat)` · `check` (plain-English no) · `apply → { state, events }` · `isOver` · `toAct` · `viewFor(state, seat)`. Pure: no screen, no network. Same rules on the phone, the server, bots, sims and tests |
| Events | Every action returns what happened, each event tagged with who may see it (`seen: 'all' \| { seats }`). `eventsFor(events, seat)` = what one seat is sent |
| Move record | `{ setup, moves: [{ seat, action }] }` + `addMove` + `replay` — replays, bug reports, golden games, AI training data. Not the end screen's summary log |
| Fast mode | `apply(…, { fast: true })` skips end-screen bookkeeping for bots and sims; the game plays the same |
| `zones.ts` (0.2.0) | Pieces with stable ids (`stableIds` from the fixed box list, never the shuffle) · zone rules (`inside: all · owner · nobody`, ordered) · `zoneFor` — a seat that may not see inside gets only a count, no ids · `takePiece`, `indexOfPiece`, `idsAreUnique` |
| `flow.ts` (0.3.0) | Where the game is (`Flow`: level + the seats that may act) · `mayAct`, `seatToAct` · order presets `snakeOrder`, `nextClockwise` (skips seats that can't play) · `TurnSteps` + `nextStep` / `undoStep` (undo goes back through this turn's steps, never past its start) |
| `events.ts` (0.4.0) | The event feed: each change gets a number + its events; the server keeps the last few (`addChange`), each seat's view carries `feedFor(feed, seat)`; the screen plays `newChanges(feed, lastPlayed)` — nothing missed when views are skipped or a player reconnects, nothing played twice, a too-old gap reported (`missed`). `Listeners` hub: `on(type, fn)` / `emit` for animations, sound, stats |
| `referee.ts` (0.5.0) | The drag referee: ONE answer (`judge(seat, piece, target)` → yes, or no + reason) asked in order: may this seat act → does the place accept the piece → do the rules allow it. `targetsFor` = what to light up on pick-up; `mayPickUp`. The glow, the nope shake and the drop all ask it |
| `rack.ts` (0.5.0) | A rack's order (a hand the player arranges): `GAP`, `rackOf`, `moveInRack`, `refillRack` (nothing shifts on its own: kept pieces stay, new ones fill gaps), `placesOf`, `shuffleRack`. The ui-kit Hand view draws it |
| `seats.ts` (0.6.0) | One seat model (`TableSeat`: human / bot · local / online · connected): `isLocalHuman`, `isLocalBot`, `playsHere`; `viewerSeat` (online: mine · pass-and-play: the person whose turn it is · else the last viewer); `needsHandoff`; `Bot` = (view, seat, rng) → action — a bot only ever gets its own seat's view |
| `selfTest.ts` | Plays whole games through a game's rules and checks every promise (legal actions pass check, no repeats, apply never edits its input, fast mode = same game, events say who sees them, views are plain data, records replay). A game runs it in its own tests |

Coming next (v0.4): Drag referee · Hand view · Seats & per-seat views.

## Install / update in a game
`node table/scripts/install-table.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/table/` with a VERSION stamp. Tests stay here (`npm test` in `table/`).
