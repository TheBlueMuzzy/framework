# AI

A fair, human-feeling computer player for any turn-based game built on the Table (framework v0.5 — design: `../.planning/design/ai.md`). Proven in Glyphtender beta. Kit **0.1.0** — the Brain.

## The idea
Every game's AI is the same kind of player with different instincts. This module is the player; the game's **plug** teaches it what to care about. A bot seat = **one personality** (what it wants) + **one skill** (how well it sees and searches). It only ever sees its own seat's view.

## What a game gets (0.1.0 — Brain)
| Part | Does |
|---|---|
| `types.ts` | `Personality` (trait ranges 0–100, goal priority, nudge, mood shifts, chattiness, extras) · `Skill` (candidates, worlds, spread, topN, wobble, beliefNoise, extras) · `GamePlug` (goals with scorers, readings, imagine, candidates, key, describe, optional special) · `Decision` (the explain note) |
| `brain.ts` | `makeBrain(plug, personality, skill)` → `decide(view, seat, rng)`: feel (mood shifts from readings) → lean (trait values inside the ranges) → special? → goal roll (d100 vs trait, down the priority list) → imagine + candidates → score (main goal + nudge × the others, 0–1 within the decision, averaged over worlds) → choose like a person (within spread, top N, weighted, ties random) → explain. `asBot(brain, onDecision)` = the Table's Bot shape. `personalityProblems` (for the editor) · `shiftedRanges` · `rollGoal` · `botSeed` |
| `check.ts` (F24, early) | The Personality Check maths: `checkFeelTargets` (green/red per target, incl. "best at the table"), `tellApart` (nearest-average guess from behaviour alone + a who-was-that grid), `winRates` (overall + head-to-head), `skillLadder` |
| `report.ts` (F24, early) | `reportHtml(report)` — one self-contained page: for-all checks, feel targets per personality, tell-apart grid, win shares + skill ladder, example notes |
| `random.ts` | seeded mulberry32: `nextRandom`, `randomBetween`, `sample`, `shuffle`, `weightedPick` |

Coming next (v0.5): Fuzzy beliefs (F20) · Pace + background thinking (F21) · Banter (F22) · Dev Kit AI tab (F23) · Arena + Personality Check (F24).

## Install / update in a game
`node ai/scripts/install-ai.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/ai/kit/` with a VERSION stamp. The game's plug lives next to it in `src/ai/`. Tests stay here (`npm test` in `ai/`).
