# AI

A fair, human-feeling computer player for any turn-based game built on the Table (framework v0.5 — design: `../.planning/design/ai.md`). Proven in Glyphtender beta. Kit **0.6.0** — the Brain + the Arena + Banter + What wins? (0.6.0: **"What wins?"** — the arena plug may name its situations (`situations(state, seat)` → numbers: score lead, letters in hand…), read after each seat's own turns 3, 5 and at the end (`content/ai/arena.json` `whatWinsMoments` / `whatWinsMinGames` / `whatWinsTop`); the report, `npm run ai:arena` and the Dev Kit's Run check say which predict the win in plain sentences, too-few-games ones listed, not hidden — `wins.ts`, F25 · 0.5.0: "Bot chatter" Off · Some · Lots in the player's Settings, kept by the saves module, and a person's good move always gets one bot's answer — F22 tasks 6–7 · 0.4.0: bots talk at the game's moments through the emote module — botBanter, content/ai/banter.json, lines in content/text/en.json, F22 · 0.2.0: bots wait on the rules clock — setPaceClock / botWait; its promise checks · 0.3.0: the arena + the whole Personality Check — `npm run ai:arena` and the Dev Kit's Run check, F24).

## The idea
Every game's AI is the same kind of player with different instincts. This module is the player; the game's **plug** teaches it what to care about. A bot seat = **one personality** (what it wants) + **one skill** (how well it sees and searches). It only ever sees its own seat's view.

## What a game gets (0.1.0 — Brain)
| Part | Does |
|---|---|
| `types.ts` | `Personality` (trait ranges 0–100, goal priority, nudge, mood shifts, chattiness, extras) · `Skill` (candidates, worlds, spread, topN, wobble, beliefNoise, extras) · `GamePlug` (goals with scorers, readings, imagine, candidates, key, describe, optional special) · `Decision` (the explain note) |
| `brain.ts` | `makeBrain(plug, personality, skill, modes?)` → `decide(view, seat, rng)`: which mode (switches on readings → the mode replaces its priorities) → feel (mood shifts from readings) → lean (trait values inside the ranges) → special? → goal roll (d100 vs trait, down the priority list) → imagine + candidates → score (main goal + nudge × each other goal × its trait ÷ 100, 0–1 within the decision, averaged over worlds) → sight blurs goals it sees poorly → steady goals on every move; big moment (goal.bigAt) → focus on the main goal → choose like a person (within spread, top N, weighted, ties random) → explain. `asBot(brain, onDecision)` = the Table's Bot shape. `botBanter({ moments, bots, settings, lines, say, seed, muted?, chatter?, save? })` (F22) — bots talk: `hear(events)` after each change → each bot seat's moments → one line a moment later on the rules clock, said through `say` (the emote module); a person's move in `answerPeople` → exactly one bot answers (0.5.0) · `setChatter(level)` / `chatter()` (0.5.0) · `stop()` · `waiting()`. `personalityProblems` (for the editor) · `shiftedRanges` · `rollGoal` · `botSeed` |
| `arena.ts` (F24) | AI-vs-AI games and the whole Personality Check. `playArenaGame(plug, seats, seed)` — bots in every seat through the game's own rules (viewFor → bot → apply until over), each seat's randomness from the seed (`botSeed`, or the plug's `seatRng`), every decision's note + time; no think-moments or timers (always Instant). `toResults` (each seat's meters + win share) · seating plans: `mixedTables` (2–4 seats going round, seeded shuffle, repeats past the cast; or `only` these) and `ladderTables` (highest skill vs lowest, sides swapped) · `checkReport` (feel targets, tell-apart, wins, ladder, the "for all of them" checks: built-in `tellApart` · `skillLadder` · `winRate` · `meter`, plus the plug's own `checks`) · `runArena(plug, request, onProgress)` = plan + play + report, same request = same report · `arenaPlan` / `arenaTotal` · `devKitSettings` (the Run check's smaller batch) · `decisionTimes` · `defaultArenaSettings` (content/ai/arena.json overrides) · 0.6.0: the plug's optional `situations` → `game.situations` per seat per moment (`Moment`, `momentName`) |
| `wins.ts` (0.6.0, F25) | "What wins?": `whatWins(results, { minGames, top, skill })` → `{ top (sentences), all (each situation × moment: groups, edge, pairs, strength, leftOut), leftOut, baseRate }` · `terciles` · `edge` · `margin` (±1/√n) · `sentence` |
| `ai-arena.mjs` (F24) | `npm run ai:arena` on the PC (Node + Vite loads the game's TypeScript): `--games --seats (2-4 · 3 · Name,Name) --ladder --seed --skill --notes --game --out`; prints decision times + each personality's meters, writes the report page and prints its path |
| `check.ts` (F24) | The Personality Check maths: `checkFeelTargets` (green/red per target, incl. "best at the table", "beats <rival>"), `tellApart` (nearest-average guess from behaviour alone + a who-was-that grid), `winRates` (overall + head-to-head), `skillLadder` |
| `report.ts` (F24) | `reportHtml(report)` — one self-contained page: for-all checks, feel targets per personality, tell-apart grid, win shares + skill ladder, example notes |
| `pace.ts` (F21 part) | `thinkDelay(pace, kind, speed, rng)` — a person-like moment per action kind ÷ the speed setting (Instant = 0) · `waitLeft` (thinking time counts toward it) · background thinking: `serveThinking` (inside a Web Worker), `makeThinker` (on the page → promises), `inlineThinker` (no worker: tests, Node, the server) |
| `banter.ts` (F22) | Moments: the plug's `moments(event, seat)` (a `MomentMap`) → `momentsFor(map, events, seat)` (in order, no repeats, a secret event only for the seats that see it) · `COMMON_MOMENTS` (gameStart, bigMove, rivalBigMove, hitRival, gotHit, closeCall, won, lost) · `readBanterSettings(content/ai/banter.json)` (chance per moment, cooldownTurns, alwaysAllowed, presets, delay, tableGap; a bad value warns + its default) · `linesFor(lines, personality, moment)` → the emote ids `banter.<personality>.<moment>` + numbered extras (`won_2`, `won_3`…) · `maybeSay(moment, turn, chattiness, lines, memory, settings, rng)` — chance per moment × chattiness, a cooldown (some moments skip it), no repeats until every line is used · `quietMemory` (plain JSON per bot seat) · 0.5.0: a moment may be `{ moment, by }` (who caused it) — `momentsWithCause`; `levels` + `answerPeople` in the settings; `settingsAtLevel(settings, 'off' \| 'some' \| 'lots')`; `chatterLevelOf`; `freshLine` |
| `settingsRow.ts` + `save.ts` (0.5.0) | `BANTER_SETTINGS_ROWS` ("Bot chatter": Off · Some · Lots, default Some) for the UI kit's Settings · `applyBanterSetting(banter, values)` · `BANTER_SAVE` for the saves module's `createSave` |
| `beliefs.ts` (F20) | `believe(history, noise, key)` — estimate + confidence (0.1–1) from what the seat saw turn by turn: seen → takes it in, confidence up, drift halved; unseen → confidence decays, estimate drifts (more for low skill). Stateless: same history + key = same belief (rejoin-safe) · `believedLead` · `defaultBeliefSettings` (the original's numbers) |
| `random.ts` | seeded mulberry32: `nextRandom`, `randomBetween`, `sample`, `shuffle`, `weightedPick` |

## Banter (F22 — bots talk through the emote module)
A bot's line is a bot pressing an emote: the emotes module's `say` — the same spam bucket, the same bubble by its
seat, the same mute (mute a bot = it says nothing) and the "Hide everyone's emotes" switch. Ids travel, never words.
- **Moments** come from the game's own events: the plug's `moments(event, seat)` names what an event means to that
  seat (`"hitRival"` for the one who did it, `"gotHit"` for the one it happened to, `"won"` / `"lost"` at the end).
  The names are the keys of `content/ai/banter.json` `"chance"` (the installer gives it once).
- **Lines** live in `content/text/en.json` `"banter": { "<personality id>": { "<moment>": "…", "<moment>_2": "…" } }`
  (the emote id `banter.<personality>.<moment>`). A moment it has no line for may press a preset emote
  (`presets`). The Dev Kit's AI tab edits the lines live (Dev Kit 0.24.0).
- **When:** chance × chattiness ÷ 100, `cooldownTurns` moves of quiet after it spoke (`alwaysAllowed` skip it), a
  line it hasn't said lately, `delay` seconds later on the **rules clock** (both Dev Kit pauses stop it), at most one
  waiting per seat, and `tableGap` seconds before another bot may talk.
```ts
import { botBanter } from './ai/kit/brain'
import { readBanterSettings } from './ai/kit/banter'
import banterJson from '../content/ai/banter.json'
import text from '../content/text/en.json'
const banter = botBanter({ moments: plug.moments!, seed, settings: readBanterSettings(banterJson),
  bots: () => botSeats.map((seat) => ({ seat, personality: personalityAt(seat) })),
  lines: () => text.banter,                                     // read at every moment: live edits count
  say: (seat, id) => emotes.say(seatIdOf(seat), id).ok })       // the emote module (local game)
// after every change: banter.hear(applied.events)   ·   leaving the game: banter.stop()
```
- **Bot chatter** (0.5.0 — Muzzy: "this is usually a menu setting"): `settingsRow.ts` `BANTER_SETTINGS_ROWS` — a
  selector "Bot chatter": Off · Some · Lots, default Some — pasted into a tab's rows in `content/ui/settings.json`
  (under the Emotes heading; its words are the row's own there, like the emotes row's — Settings' `labels` prop
  translates the label; the options are also the values, so they stay English). Then
  `applyBanterSetting(banter, loadSettings(settingsJson))` when botBanter is made and `applyBanterSetting(banter, values)`
  in `<Settings onChange>` — live. **Off** = the bots say nothing at all (a waiting line is dropped at once, the
  always-answer too); **Some** = content/ai/banter.json's numbers; **Lots** = `levels.lots` (default: every chance ×2,
  capped at 1, and `cooldownTurns` 1 — a level only ever shortens the cooldown). Kept by the saves module:
  `createSave({ ...BANTER_SAVE, key: '<game>:banter', version: 1 })` (`save.ts`) → `botBanter({ …, save })` starts at the
  kept level and keeps every change; the installer writes its golden copy once (`tests/saves/<game>_banter-v1.json`).
- **A person's good move always gets an answer** (0.5.0 — Muzzy: "they should always say something when you make good
  moves (like Sparky in MTG Arena)"): the moment map may name who caused a moment —
  `{ moment: 'rivalBigMove', by: seat }` (plain names still work; they never count as a person's). When a moment in
  `content/ai/banter.json` `"answerPeople"` (default `["rivalBigMove"]`, `[]` = off) is caused by a seat that isn't a
  bot, **exactly one** bot answers, every time: the chattiest unmuted one (chattiness > 0) with a line or preset for it,
  ties picked by the seed — no chance roll, no cooldown; still the delay on the rules clock (pauses hold it), the table
  gap (it waits it out and always comes), and Off. The other bots let that change go (one reply, not a chorus).
  Pass `muted: (seat) => emotes.isMuted(seatIdOf(seat))` so the answer goes to an unmuted bot (and a muted bot's line
  never holds up the table gap); without it a muted bot can be picked and the emote module drops its line. Online
  (the server) leave `muted` out — each device mutes for itself.
**Online**, bots speak from the **server** (party/server.ts): the same `botBanter` with `say: (seat, id) =>
room.emote(room.seats()[seat].id, id)` (Rooms 0.12.0+), fed the change's events where the server applies them. A
client-side `emotes.say()` online is refused (`server`) — it would go out as the player's own seat.

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
  The score itself at the end predicts the win because it IS the win — the early moments are the advice.
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
names bot code — files importing `ai/kit/pace` — still waiting on `setTimeout` / `performance.now`) · banter (F22):
*every chatty personality has lines* (each personality with chattiness > 0 has a line in `content/text/en.json`
`"banter"` for one of the moments `content/ai/banter.json` names; a line for a moment never named is a warning) ·
*no banter line is hard-coded* (a line's words in `src/` or `party/` fail, named) · *bots talk through the emote
module* (chatty personalities need `botBanter(…)` and its `hear(events)` in the game's code or its server) · *the Bot chatter setting is read* (0.5.0: a
`botChatter` row in `content/ui/settings.json` that nothing passes on — `applyBanterSetting` / `setChatter` — fails; no
row is a warning; UI kit 0.28.1's Settings check counts the row as read once it's passed on). The Personality
Check (`check.ts`) is a balance tool the game runs on purpose — not a wiring promise, so it isn't part of it.

## Install / update in a game
`node ai/scripts/install-ai.mjs <game-folder> [--dry-run]` → copies `kit/` to `<game>/src/ai/kit/` with a VERSION stamp, plus `scripts/ai-arena.mjs` → `src/ai/kit/ai-arena.mjs`, and gives the game `content/ai/arena.json` + `content/ai/banter.json` once (then they're the game's — a game that has banter.json from 0.4.0 keeps it: add `"levels"` / `"answerPeople"` yourself, or the defaults apply). Prints only the steps still missing (the `ai:arena` script line, `src/ai/arenaGame.ts`; once a personality talks: the botBanter wiring, the Bot chatter row and its wiring, and with the saves module the banter save — whose golden copy it writes once). The game's plug lives next to it in `src/ai/`. Tests stay here (`npm test` in `ai/`; the Draw to 10 test game is `fixtures/`).
