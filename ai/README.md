# AI

A fair, human-feeling computer player for any turn-based game built on the Table (framework v0.5 — design: `../.planning/design/ai.md`). Proven in Glyphtender beta. Kit **0.2.0** — the Brain (0.2.0: bots wait on the rules clock — setPaceClock / botWait; its promise checks).

## The idea
Every game's AI is the same kind of player with different instincts. This module is the player; the game's **plug** teaches it what to care about. A bot seat = **one personality** (what it wants) + **one skill** (how well it sees and searches). It only ever sees its own seat's view.

## What a game gets (0.1.0 — Brain)
| Part | Does |
|---|---|
| `types.ts` | `Personality` (trait ranges 0–100, goal priority, nudge, mood shifts, chattiness, extras) · `Skill` (candidates, worlds, spread, topN, wobble, beliefNoise, extras) · `GamePlug` (goals with scorers, readings, imagine, candidates, key, describe, optional special) · `Decision` (the explain note) |
| `brain.ts` | `makeBrain(plug, personality, skill, modes?)` → `decide(view, seat, rng)`: which mode (switches on readings → the mode replaces its priorities) → feel (mood shifts from readings) → lean (trait values inside the ranges) → special? → goal roll (d100 vs trait, down the priority list) → imagine + candidates → score (main goal + nudge × each other goal × its trait ÷ 100, 0–1 within the decision, averaged over worlds) → sight blurs goals it sees poorly → steady goals on every move; big moment (goal.bigAt) → focus on the main goal → choose like a person (within spread, top N, weighted, ties random) → explain. `asBot(brain, onDecision)` = the Table's Bot shape. `personalityProblems` (for the editor) · `shiftedRanges` · `rollGoal` · `botSeed` |
| `check.ts` (F24, early) | The Personality Check maths: `checkFeelTargets` (green/red per target, incl. "best at the table", "beats <rival>"), `tellApart` (nearest-average guess from behaviour alone + a who-was-that grid), `winRates` (overall + head-to-head), `skillLadder` |
| `report.ts` (F24, early) | `reportHtml(report)` — one self-contained page: for-all checks, feel targets per personality, tell-apart grid, win shares + skill ladder, example notes |
| `pace.ts` (F21 part) | `thinkDelay(pace, kind, speed, rng)` — a person-like moment per action kind ÷ the speed setting (Instant = 0) · `waitLeft` (thinking time counts toward it) · background thinking: `serveThinking` (inside a Web Worker), `makeThinker` (on the page → promises), `inlineThinker` (no worker: tests, Node, the server) |
| `banter.ts` (F22 part) | `maybeSay(moment, turn, chattiness, lines, memory, settings, rng)` — chance per moment × chattiness, a cooldown (some moments skip it), no repeats until every line is used · `quietMemory` (plain JSON per bot seat) |
| `beliefs.ts` (F20) | `believe(history, noise, key)` — estimate + confidence (0.1–1) from what the seat saw turn by turn: seen → takes it in, confidence up, drift halved; unseen → confidence decays, estimate drifts (more for low skill). Stateless: same history + key = same belief (rejoin-safe) · `believedLead` · `defaultBeliefSettings` (the original's numbers) |
| `random.ts` | seeded mulberry32: `nextRandom`, `randomBetween`, `sample`, `shuffle`, `weightedPick` |

Coming next (v0.5): Fuzzy beliefs (F20) · Pace + background thinking (F21) · Banter (F22) · Dev Kit AI tab (F23) · Arena + Personality Check (F24).

## What a game must provide
From MODULE-CONTRACTS.md (`~/.claude/config/bmuz/`):
- **AI seats think on the rules clock**, so the Dev Kit's ◐ Half pause (and the game's own pause) stops a bot
  mid-think. 0.2.0: hand the bots the clock once at start-up, then wait with `botWait` / `paceNow`:
  ```ts
  import { setPaceClock, botWait, paceNow, waitLeft } from './ai/kit/pace'
  import { rulesClock } from './devkit/gameClock'
  setPaceClock(rulesClock)
  // in the bot: const started = paceNow(); … think …; cancel = botWait(waitLeft(delay.ms, paceNow() - started), act)
  ```
- **Personalities live in `content/ai/`** (traits, goal order, bio, skills, pace) — the Dev Kit's AI tab edits them.

**How it's checked — `npm run check:framework`** (`kit/conformance.mjs`): *personalities live in content/ai/* (fails
with no `content/ai/*.json`) · *bots wait on the rules clock* (fails when nothing calls `setPaceClock(rulesClock)`, and
names bot code — files importing `ai/kit/pace` — still waiting on `setTimeout` / `performance.now`). The Personality
Check (`check.ts`) is a balance tool the game runs on purpose — not a wiring promise, so it isn't part of it.

## Install / update in a game
`node ai/scripts/install-ai.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/ai/kit/` with a VERSION stamp. The game's plug lives next to it in `src/ai/`. Tests stay here (`npm test` in `ai/`).
