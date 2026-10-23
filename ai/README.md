# AI

A fair, human-feeling computer player for any turn-based game built on the Table (framework v0.5 — design: `../.planning/design/ai.md`). Proven in Glyphtender beta. Kit **0.3.0** — the Brain + the Arena (0.2.0: bots wait on the rules clock — setPaceClock / botWait; its promise checks · 0.3.0: the arena + the whole Personality Check — `npm run ai:arena` and the Dev Kit's Run check, F24).

## The idea
Every game's AI is the same kind of player with different instincts. This module is the player; the game's **plug** teaches it what to care about. A bot seat = **one personality** (what it wants) + **one skill** (how well it sees and searches). It only ever sees its own seat's view.

## What a game gets (0.1.0 — Brain)
| Part | Does |
|---|---|
| `types.ts` | `Personality` (trait ranges 0–100, goal priority, nudge, mood shifts, chattiness, extras) · `Skill` (candidates, worlds, spread, topN, wobble, beliefNoise, extras) · `GamePlug` (goals with scorers, readings, imagine, candidates, key, describe, optional special) · `Decision` (the explain note) |
| `brain.ts` | `makeBrain(plug, personality, skill, modes?)` → `decide(view, seat, rng)`: which mode (switches on readings → the mode replaces its priorities) → feel (mood shifts from readings) → lean (trait values inside the ranges) → special? → goal roll (d100 vs trait, down the priority list) → imagine + candidates → score (main goal + nudge × each other goal × its trait ÷ 100, 0–1 within the decision, averaged over worlds) → sight blurs goals it sees poorly → steady goals on every move; big moment (goal.bigAt) → focus on the main goal → choose like a person (within spread, top N, weighted, ties random) → explain. `asBot(brain, onDecision)` = the Table's Bot shape. `personalityProblems` (for the editor) · `shiftedRanges` · `rollGoal` · `botSeed` |
| `arena.ts` (F24) | AI-vs-AI games and the whole Personality Check. `playArenaGame(plug, seats, seed)` — bots in every seat through the game's own rules (viewFor → bot → apply until over), each seat's randomness from the seed (`botSeed`, or the plug's `seatRng`), every decision's note + time; no think-moments or timers (always Instant). `toResults` (each seat's meters + win share) · seating plans: `mixedTables` (2–4 seats going round, seeded shuffle, repeats past the cast; or `only` these) and `ladderTables` (highest skill vs lowest, sides swapped) · `checkReport` (feel targets, tell-apart, wins, ladder, the "for all of them" checks: built-in `tellApart` · `skillLadder` · `winRate` · `meter`, plus the plug's own `checks`) · `runArena(plug, request, onProgress)` = plan + play + report, same request = same report · `arenaPlan` / `arenaTotal` · `devKitSettings` (the Run check's smaller batch) · `decisionTimes` · `defaultArenaSettings` (content/ai/arena.json overrides) |
| `ai-arena.mjs` (F24) | `npm run ai:arena` on the PC (Node + Vite loads the game's TypeScript): `--games --seats (2-4 · 3 · Name,Name) --ladder --seed --skill --notes --game --out`; prints decision times + each personality's meters, writes the report page and prints its path |
| `check.ts` (F24) | The Personality Check maths: `checkFeelTargets` (green/red per target, incl. "best at the table", "beats <rival>"), `tellApart` (nearest-average guess from behaviour alone + a who-was-that grid), `winRates` (overall + head-to-head), `skillLadder` |
| `report.ts` (F24) | `reportHtml(report)` — one self-contained page: for-all checks, feel targets per personality, tell-apart grid, win shares + skill ladder, example notes |
| `pace.ts` (F21 part) | `thinkDelay(pace, kind, speed, rng)` — a person-like moment per action kind ÷ the speed setting (Instant = 0) · `waitLeft` (thinking time counts toward it) · background thinking: `serveThinking` (inside a Web Worker), `makeThinker` (on the page → promises), `inlineThinker` (no worker: tests, Node, the server) |
| `banter.ts` (F22 part) | `maybeSay(moment, turn, chattiness, lines, memory, settings, rng)` — chance per moment × chattiness, a cooldown (some moments skip it), no repeats until every line is used · `quietMemory` (plain JSON per bot seat) |
| `beliefs.ts` (F20) | `believe(history, noise, key)` — estimate + confidence (0.1–1) from what the seat saw turn by turn: seen → takes it in, confidence up, drift halved; unseen → confidence decays, estimate drifts (more for low skill). Stateless: same history + key = same belief (rejoin-safe) · `believedLead` · `defaultBeliefSettings` (the original's numbers) |
| `random.ts` | seeded mulberry32: `nextRandom`, `randomBetween`, `sample`, `shuffle`, `weightedPick` |

Coming next (v0.5): Banter (F22).

## Arena (the Personality Check)
The game's half is one file, `src/ai/arenaGame.ts` — its rules, its board choice, its bot, its meters stay the game's:
```ts
import type { ArenaGameFile, ArenaPlug } from './kit/arena'
export const arenaPlug: ArenaPlug<State, Action, Setup, View> = {
  name: 'My Game', rules: myRules,                       // the Table Rules (setup · apply · isOver · toAct · viewFor)
  setup: (seats, seed, kind) => ({ players: seats.length, seed, board: kind === 'ladder' ? 'small' : boardFor(seats.length) }),
  bot: (s, onDecision) => myBot(s.personality, s.skill, onDecision),   // the Table's Bot shape (asBot fits)
  meters: (game) => behaviourMeters(game.state),         // one { meter: number } per seat (game.moves is there too)
  winners: (state) => state.winners,
  tellMeters: ['tangles', 'wordLength'],                 // optional: leave out meters that give the answer away
  checks: { callsIt: (results, skill) => averages(results, 'calledIt', skill) },   // optional: its own for-all checks
}
export default async function arenaGame(files: { read(path: string): Promise<string> }): Promise<ArenaGameFile<…>> {
  const personalities = JSON.parse(await files.read('content/ai/personalities.json')).personalities
  return { plug: arenaPlug, personalities, skills /* lowest first */, targets /* content/ai/feel-targets.json */ }
}
```
- **PC:** `npm run ai:arena` (package.json `"ai:arena": "node src/ai/kit/ai-arena.mjs"`) — numbers from `content/ai/arena.json`
  (games, minSeats / maxSeats, ladderGames, seed, mainSkill, reportPath…), flags change one run.
- **Dev Kit Run check:** a worker file calls `serveCheck(self, (job, onProgress) => reportHtml(runArena(arenaPlug, { ...job, targets, settings: devKitSettings(arenaJson, job.games) }, onProgress).report))`
  and the AI tab's `runCheck` starts it with `runCheckInWorker` (Dev Kit 0.23.0 `ai/checkWorker.ts`) — the page never freezes.
- `content/ai/feel-targets.json` `"all"`: `{ "check": "tellApart" | "skillLadder" | "winRate" | "meter" (+ "meter") | <the plug's own>, "min", "max", "label" }`.

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
`node ai/scripts/install-ai.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/ai/kit/` with a VERSION stamp, plus `scripts/ai-arena.mjs` → `src/ai/kit/ai-arena.mjs`, and gives the game `content/ai/arena.json` once (then it's the game's). Prints only the arena steps still missing (the `ai:arena` script line, `src/ai/arenaGame.ts`). The game's plug lives next to it in `src/ai/`. Tests stay here (`npm test` in `ai/`; the Draw to 10 test game is `fixtures/`).
