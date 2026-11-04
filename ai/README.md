# AI

A fair, human-feeling computer player for any turn-based game built on the Table (framework v0.5 — design: `../.planning/design/ai.md`). Proven in Glyphtender beta. **Frozen** (F186): bug fixes only until a second game needs it. Kit **0.9.0** (0.9.0, F186 — Slimmed framework: **banter archived** with the emotes module — `banter.ts`, `botBanter`, `save.ts`, `settingsRow.ts`, the plug's `moments`, the banter checks and `content/ai/banter.json`; git tag `archive/emotes-0.4.2` keeps them; a game's copy keeps working until it updates · 0.8.3, F159: the installer reads its version through the framework’s shared `scripts/kitVersion.mjs` (git asked once per run, in one place); the version line it writes is unchanged) (0.8.2, F154 — AI moments type fix: the plug's `moments` is typed as botBanter's own `MomentMap`, so it may return `{ moment, by }` and a game hands `plug.moments` straight to botBanter — no separate export · 0.8.1, F128: the installer asks git for the kit’s commit once per run, not on every install) — the Brain + the Arena + Banter + What wins? + Suggest sliders (0.8.0, F110: ships `settings-rows.json` — tells the UI kit's (0.30.0+) Settings check that `botChatter` is passed on by `applyBanterSetting` / `setChatter`; installed with the kit, not to be edited in the game · 0.7.0: **the auto-tuner** — `tune.ts`
`tunePersonality` suggests slider values for one personality so it hits more of its feel targets (coordinate steps inside
each slider's range, seeded tries, checked on fresh games before it suggests anything); `npm run ai:tune -- --personality
<id>` prints it and writes a page, the Dev Kit 0.26.0's "Suggest sliders" shows it with Apply; it never writes content —
F26 · 0.6.0: **"What wins?"** — the arena plug may name its situations (`situations(state, seat)` → numbers: score lead, letters in hand…), read after each seat's own turns 3, 5 and at the end (`content/ai/arena.json` `whatWinsMoments` / `whatWinsMinGames` / `whatWinsTop` / `whatWinsIsTheWin`; the plug may count its own turns with `turns(state, seat)`); the report, `npm run ai:arena` and the Dev Kit's Run check say which predict the win in plain sentences, too-few-games ones listed, not hidden — `wins.ts`, F25 · 0.5.0: "Bot chatter" Off · Some · Lots in the player's Settings, kept by the saves module, and a person's good move always gets one bot's answer — F22 tasks 6–7 · 0.4.0: bots talk at the game's moments through the emote module — botBanter, content/ai/banter.json, lines in content/text/en.json, F22 · 0.2.0: bots wait on the rules clock — setPaceClock / botWait; its promise checks · 0.3.0: the arena + the whole Personality Check — `npm run ai:arena` and the Dev Kit's Run check, F24).

## The idea
Every game's AI is the same kind of player with different instincts. This module is the player; the game's **plug** teaches it what to care about. A bot seat = **one personality** (what it wants) + **one skill** (how well it sees and searches). It only ever sees its own seat's view.

## What a game gets (0.1.0 — Brain)
| Part | Does |
|---|---|
| `types.ts` | `Personality` (trait ranges 0–100, goal priority, nudge, mood shifts, chattiness, extras) · `Skill` (candidates, worlds, spread, topN, wobble, beliefNoise, extras) · `GamePlug` (goals with scorers, readings, imagine, candidates, key, describe, optional special) · `Decision` (the explain note) |
| `brain.ts` | `makeBrain(plug, personality, skill, modes?)` → `decide(view, seat, rng)`: which mode (switches on readings → the mode replaces its priorities) → feel (mood shifts from readings) → lean (trait values inside the ranges) → special? → goal roll (d100 vs trait, down the priority list) → imagine + candidates → score (main goal + nudge × each other goal × its trait ÷ 100, 0–1 within the decision, averaged over worlds) → sight blurs goals it sees poorly → steady goals on every move; big moment (goal.bigAt) → focus on the main goal → choose like a person (within spread, top N, weighted, ties random) → explain. `asBot(brain, onDecision)` = the Table's Bot shape. `personalityProblems` (for the editor) · `shiftedRanges` · `rollGoal` · `botSeed` |
| `arena.ts` (F24) | AI-vs-AI games and the whole Personality Check. `playArenaGame(plug, seats, seed)` — bots in every seat through the game's own rules (viewFor → bot → apply until over), each seat's randomness from the seed (`botSeed`, or the plug's `seatRng`), every decision's note + time; no think-moments or timers (always Instant). `toResults` (each seat's meters + win share) · seating plans: `mixedTables` (2–4 seats going round, seeded shuffle, repeats past the cast; or `only` these) and `ladderTables` (highest skill vs lowest, sides swapped) · `checkReport` (feel targets, tell-apart, wins, ladder, the "for all of them" checks: built-in `tellApart` · `skillLadder` · `winRate` · `meter`, plus the plug's own `checks`) · `runArena(plug, request, onProgress)` = plan + play + report, same request = same report · `arenaPlan` / `arenaTotal` · `devKitSettings` (the Run check's smaller batch) · `decisionTimes` · `defaultArenaSettings` (content/ai/arena.json overrides) · 0.6.0: the plug's optional `situations` → `game.situations` per seat per moment (`Moment`, `momentName`) |
| `tune.ts` (0.7.0, F26) | "Suggest sliders": `tunePersonality(plug, request, id, { settings, onProgress, now })` → `{ verdict (better · noGain · alreadyGreen · noTargets · tooFewGames), message, suggested (or null), sliders (old → new), targets (now → suggested, on fresh games), cantReach (+ why), others (other personalities' targets that changed colour), log (every try), tries, games, seconds, stoppedBy }` · `slidersOf` (each trait's range moved whole, nudge, focus, each steady goal) · `withSlider` / `sliderValue` / `sliderText` · `tuneTables` (the personality at every table) · `scoreOf` / `isBetter` / `shortfall` · `defaultTuneSettings`. `report.ts` `tuneHtml(result, game)` = its page |
| `wins.ts` (0.6.0, F25) | "What wins?": `whatWins(results, { minGames, top, skill })` → `{ top (sentences), all (each situation × moment: groups, edge, pairs, strength, leftOut), leftOut, baseRate }` · `terciles` · `edge` · `margin` (±1/√n) · `sentence` |
| `ai-arena.mjs` (F24) | `npm run ai:arena` on the PC (Node + Vite loads the game's TypeScript): `--games --seats (2-4 · 3 · Name,Name) --ladder --seed --skill --notes --game --out`; prints decision times + each personality's meters, writes the report page and prints its path |
| `check.ts` (F24) | The Personality Check maths: `checkFeelTargets` (green/red per target, incl. "best at the table", "beats <rival>"), `tellApart` (nearest-average guess from behaviour alone + a who-was-that grid), `winRates` (overall + head-to-head), `skillLadder` |
| `report.ts` (F24) | `reportHtml(report)` — one self-contained page: for-all checks, feel targets per personality, tell-apart grid, win shares + skill ladder, example notes |
| `pace.ts` (F21 part) | `thinkDelay(pace, kind, speed, rng)` — a person-like moment per action kind ÷ the speed setting (Instant = 0) · `waitLeft` (thinking time counts toward it) · background thinking: `serveThinking` (inside a Web Worker), `makeThinker` (on the page → promises), `inlineThinker` (no worker: tests, Node, the server) |
| `beliefs.ts` (F20) | `believe(history, noise, key)` — estimate + confidence (0.1–1) from what the seat saw turn by turn: seen → takes it in, confidence up, drift halved; unseen → confidence decays, estimate drifts (more for low skill). Stateless: same history + key = same belief (rejoin-safe) · `believedLead` · `defaultBeliefSettings` (the original's numbers) |
| `random.ts` | seeded mulberry32: `nextRandom`, `randomBetween`, `sample`, `shuffle`, `weightedPick` |

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
  situations: (state, seat) => ({ 'score lead': lead(state, seat), 'letters in hand': state.hands[seat].length }),   // optional (0.6.0): "What wins?"
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
- **What wins? (0.6.0, F25)** — the plug's optional `situations(state, seat)` names numbers per seat (true/false → 1/0;
  anything else that isn't a number stops the run, in plain English). The arena reads them after each seat's own turn N
  (a turn = its moves until someone else acts — or the plug's optional `turns(state, seat)`, the game's own count, e.g.
  leaving a draft out) and at the end; `wins.ts` `whatWins(results)` splits each situation at
  each moment into low / mid / high (terciles — equal numbers never split), works out each group's win rate and **the
  edge** (in winner-vs-loser pairs of the same game, how often the winner had more; 50% = says nothing), leaves out
  anything under `whatWinsMinGames` (and lists it), and writes the strongest as sentences — one per situation, at its
  strongest moment: "Players with score lead 10 or more after turn 5 win 78% (of 240 games, ±6%) — vs 12% with -3 or
  less". On the report (`<ol data-what-wins>`, which the Dev Kit 0.25.0 Check panel shows), and printed by `ai:arena`.
  The score itself at the end predicts the win because it IS the win: a situation that at the end picks the winner in
  ≥ 95% of games (`whatWinsIsTheWin`) is named apart ("Magic lead at the end decides who wins by itself"), and its
  early moments make the sentence instead.
- **Suggest sliders (0.7.0, F26)** — the computer does the slow searching; the designer decides. `tunePersonality`
  plays small seeded batches with one personality at every table (the others exactly as they are) and moves its sliders
  one at a time — each trait's range (moved whole, its width kept, inside 0–100), nudge, focus, each steady goal (0–1) —
  keeping a step only when it hits more of its feel targets (then more of the others', then closer to the red ones);
  halves the step after a pass where nothing helped. Every try plays the same seeds, so only the slider changed. Then
  **the start and the best both play fresh seeds** and only a best with more targets green there is suggested — else
  "luck, not a real gain, keep what you have". A target still red says why: "within these ranges" (every slider tried
  both ways to the smallest step) or "within this budget"; a newly green one within 5% of its line is flagged "only just
  over — confirm with npm run ai:arena" (`edgeOf`, `JUST_OVER`). In a noisy game give it more games a try (Glyphtender:
  12 a try was luck twice; 30 a try ≈ 40 min). Budget in `content/ai/arena.json`: `tuneGames` (a try),
  `tuneTries`, `tuneSeconds`, `tuneFreshGames`, `tuneSeed`, `tuneFreshSeed`, `tuneStep`, `tuneMinFreshGames` (fewer
  fresh games than this = "too few to trust", shown but not suggested) (defaults in the code for an
  older arena.json). **PC:** `npm run ai:tune -- --personality <id> [--budget tries=10,games=8,fresh=24,seconds=300]`
  (the installer adds `"ai:tune": "node src/ai/kit/ai-arena.mjs --tune"`) prints old → new and the targets before →
  after, writes `ai-tune-<id>.html` beside the report. **Dev Kit:** the check's worker also serves the tuner —
  `serveCheck(self, runCheck, (job, onProgress) => tunePersonality(plug, { personalities: job.personalities, skills:
  job.skills, targets, mainSkill }, job.personality, { settings: arenaJson, onProgress }))` — and the AI plug's
  `suggest: (o) => suggestInWorker(start, o)` (Dev Kit 0.26.0); its Apply puts the values in as unsaved edits. Nothing
  is ever written by the tuner.
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
`node ai/scripts/install-ai.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/ai/kit/` with a VERSION stamp, plus `scripts/ai-arena.mjs` → `src/ai/kit/ai-arena.mjs`, adds `"ai:tune"` to package.json itself once the game runs the framework's `ai:arena` (0.7.0; a game's own `ai:tune` is left alone), offers the Dev Kit's Suggest sliders wiring (optional) once its check worker exists, and gives the game `content/ai/arena.json` once (then it's the game's). Prints only the steps still missing (the `ai:arena` script line, `src/ai/arenaGame.ts`). The game's plug lives next to it in `src/ai/`. Tests stay here (`npm test` in `ai/`; the Draw to 10 test game is `fixtures/`).
