# The AI module — design (framework v0.5, proven in Glyphtender beta)

Decided with Muzzy 2026-10-04. Built ON the Table (`design/table.md`): a bot is a seat whose actions come from this module. Sources: Glyphtender's original AI (branch `festive-booth`, digested in `games/glyphtender/.planning/research/original-digest.md §2`) and Muzzy's words from building it (2025-12): *"fuzzy knowledge always — I don't want the AI to just 'know' things"* · *"slideable scales with fuzzy values to help create several personalities… not just easy medium hard"* · *"I like some sort of confidence meter"* · *"area control first"*. Game-specific detail lives in each game (Glyphtender: `.planning/design/ai.md`).

## The idea
Every game's AI is the **same kind of player with different instincts**. The module is the player; the game teaches it what to care about. It should feel like a person across the table — wanting things, misjudging things, reacting — never a calculator, never a cheat.

## The brain (framework — the same for every game)
Each time a bot seat must act:
1. **See** — only its seat's view (Table F18). Hidden things (rivals' hands, the bag) it **imagines**: the game deals a plausible version consistent with what it knows (determinization). It never peeks.
2. **Believe (fuzzy)** — it keeps **beliefs** about what it can't see for sure (each player's score, who's ahead), each with a **confidence 0–1** that drops as turns pass unseen and rises when it sees evidence. Estimates drift when confidence is low. It can be wrong about who's winning — on purpose. Beliefs are the "confidence meter" the Dev Kit shows.
3. **Feel** — the game gives **readings** (0–10: "I'm in danger", "my hand is junk", "the end is near"…). **Mood shifts** turn readings into nudges on its traits (danger → more Caution; behind → Desperation; a rival exposed → Opportunity; endgame → its endgame shifts).
4. **Want** — it walks its **goal priority list**; for each goal it picks a number inside that trait's **range** (Bully Aggression 80–95), rolls d100, and the first goal that rolls under wins (all fail → the first goal). Same personality, a little different every turn, always leaning the same way.
5. **Look** — the legal actions (Table `legalActions`), thinned to how many this skill level considers.
6. **Score** — every candidate gets **main goal × 1 + nudge × each other goal × its trait ÷ 100** (nudge per personality; decided 2026-10-04 after the first Personality Check — a share split made the other goals too faint). The main goal decides the character ("it's hunting me"); the nudge lets it prefer the hunt that *also* spells — the two-birds move the original couldn't aim for.
6b. **Every move does two things; big moments take over** (Muzzy, 2026-10-04: "make sure they are scoring points WHILE performing their personality goal… but maybe bully looks at whether it can pincer really strongly and will prio that over spelling"). **Steady goals** (per personality, e.g. Glyphtender SCORE 0.6) count on every move whatever the roll — the Bully's ordinary turn is the best hunt that also spells. Each goal has a **big-moment bar** (`bigAt`, game data — set at the top quarter of that goal's chances in real games); when the main goal's best move reaches it, the personality's **focus** (0–1) keeps only moves that good for the main goal and the rest only break ties — it pounces.
6c. **Sight** (per personality, per goal, 0–1): how clearly it judges each kind of move; low sight blurs those scores so it misjudges them (Glyphtender's Scholar can't see a trap closing). With vocabulary set by SKILL only (Muzzy, 2026-10-04: "amount of words is dictated by difficulty"), sight + priority are what make personalities strong or weak at things — rock-paper-scissors edges are proven with 'beats' targets in the Personality Check.
6d. **Modes — fight · flight · focus** (Muzzy, 2026-10-05: "maybe we don't have 3 distinct personalities, but 3 distinct modes an AI can be in… a key personality, but shift into another one heavily"). A mode is a whole set of priorities (goals, traits, sight, steady, focus) kept as game data; a personality is its HOME mode + **switches** ("reading ≥ / ≤ value → mode"), checked every decision. While switched, the mode's settings replace the personality's. Notes show the mode ("Scholar [Flight] rolled ESCAPE…").
7. **Choose like a person** — keep candidates within X% of the best (top N), pick one weighted by score. Skill decides X and N.
8. **Explain** — every decision leaves a **note**: goal + the roll that picked it, the moods that shifted it, the move and why ("Bully rolled TRAP (Aggression 87 vs roll 41). Best: cut Blue's glyphling 9 → 2 moves, also spelt OAK +4."). Notes are for the Dev Kit and bug reports, never the player.
9. **Act at a human pace** — a think time (per action kind, with a little randomness) × the player's **speed setting** (Slow · Normal · Fast · Instant). The thinking itself runs **in the background** (a Web Worker on devices, inside the room on the server) with a time budget, so the screen never freezes.
10. **Talk** — game **moments** (from the event stream: "I tangled someone", "my word got stolen", "I'm way ahead"…) may trigger a **banter line**: chance per moment × the personality's chattiness, a cooldown, no repeats. Lines are data.

All randomness comes from the bot's own seeded random → the same game replays with the same bot moves (golden games, bug reports).

## The AI looks human (standard — Muzzy, 2026-10-05)
*"When possible, the AI should visually come across as human. If a human would drag, they should too… at least the same animation speeds."*
- **Same intention → same motion.** Every bot action on screen plays the SAME motion, path, speed and look as a person doing that thing — the game's own animation and timings, reused. Never a second animation for bots, never a pop where a person's piece travels.
- **Show every step a person shows.** If a person picks a piece up from their hand / tray, carries it, aims, then confirms, the bot's piece does the same (from the same place, by the same path). It goes through the same store follow-ups as a person's taps — no shortcut that skips the screen.
- **Pauses are pacing data, not animation.** The think pause and any "looking at it" hold (e.g. holding its aim before the throw) live in the pace file (per action kind, min–max) and scale with the AI speed setting; Instant = no pauses, but the animations still play.
- **Secrets stay secret.** What only the acting player's eyes see (their own hand, its refresh) isn't shown for a bot — its timing still is.
- **Proof:** each game keeps an audit table (every action: person vs bot — motion, path, timing, pops) and an e2e frame check that a bot's piece travels rather than appears.
- Glyphtender (F50): the draft glyphling travels out of the tray like a person's drag (the glide's path + timings); a turn glides, holds its aim, then throws.

## Personality vs skill — two separate dials
- **Personality = what it wants**: trait ranges · goal priority · nudge size · mood-shift strengths · chattiness · bio + banter. An easy Bully still hunts you; a deadly Scholar still loves long words.
- **Skill = how well it sees and searches**: how many candidates it considers · how many imagined worlds · how close to the best it must pick · how fuzzy its beliefs are (confidence decay, drift) · game-specific limits (Glyphtender: vocabulary). Presets (Glyphtender: Apprentice · First Class · Archmage) are data too.
A seat's bot = **one personality + one skill**. Players pick both.

## What the game provides (its instincts)
| The game gives | Example (Glyphtender) |
|---|---|
| Goals — each with its trait and a **scorer** ("how good is this action for TRAP?") | TRAP · SCORE · DENY · ESCAPE · BUILD · STEAL · DUMP |
| Readings (0–10) | hand quality · my glyphlings' danger · rivals' danger · board fill · territory |
| What to believe + its evidence | each rival's Magic (seen growing on the board, never the total) |
| How to imagine the hidden | deal rivals' seeds + the bag from the unseen letters |
| Moments + banter lines + bios | tangled a rival · got tangled · stole a word · "Called it!" |
| **Behaviour meters** (for the Personality Check) | tangles caused · turns spent near a rival · rivals' moves cut · word length · steals |
| Special decisions outside the goal loop, if any | draft placement · refresh · "call it" (self-tangle to end) |
Everything tweakable is JSON in the game's `content/ai/` (personalities, skills, pace, feel targets) and `content/text/` (bios, banter). Rules stay in code.

## Tools — tune by watching behaviour, not numbers
**Personality editor (Dev Kit "AI" tab)** — pick a personality (or copy one into a new one); two-handled range sliders per trait; drag-to-reorder goal priority; nudge size; mood-shift strengths; skill presets; bio + banter. Saves to `content/ai/` (also editable in Obsidian).
**Watch a game** — AIs play each other at human pace; each decision's note appears as it plays; each bot's beliefs (estimate + confidence bar) are visible. Pause, step, jump to "why did it do that?".
**Arena + Personality Check** (MDA for the AI: sliders are the mechanics, what players feel comes from the behaviour) — run hundreds of AI-vs-AI games fast (Node script and in the Dev Kit) and report:
1. **Feel targets** — each personality's feel written as watchable behaviour (Bully "I feel hunted" = tangles someone in most games · most turns near a rival · rivals' moves shrink after its turns), checked green/red against the behaviour meters. Targets are data (`content/ai/feel-targets.json`), editable.
2. **Tell-apart** — a simple model sees only each game's behaviour and guesses who played it (a "who was that?" grid). If it can't tell the Bully from Balanced, players won't either.
3. **Everyone wins sometimes** — win-rate grid per personality and per pairing (no personality dominates; a bad speller can win).
4. **The skill ladder works** — Archmage beats First Class beats Apprentice, for every personality.
Report = a page with green/red, the grids, and example games to watch.

## Learning (offline, on the PC — never in the shipped game; output is just numbers in `content/`)
- **"What wins?" report (should)** — thousands of self-play games → which situations predict winning (glyphling freedom, owned pockets, word length, refreshes…). Shows the game's real avenues of focus; tells the goal scorers what to value; checks the game's pillars.
- **Auto-tuner (could)** — given a personality's feel targets, searches slider values that hit them while staying fun to lose to; **suggests**, Muzzy approves in the editor.
- **Won't:** learning between games / per player; a neural network in the game.

## "What wins?" — mining the arena's games (F25, researched 2026-10-23)
**What others do**
- **Card-game win-rate sites** (17lands for MTG Arena drafts, HSReplay for Hearthstone): split games by a situation and show the win rate of each side. 17lands' *games-in-hand win rate* (GIH WR) = win rate of games where the card was seen; *opening-hand* WR = only games where it was in the first hand; *improvement when drawn* = drawn WR − not-drawn WR. HSReplay shows the same by turn played and in the mulligan. Both hide a number until it has enough games and print the game count next to it.
- **Chess engines** turn "who's better here" into a *win probability* (an evaluation in pawns → an expected score, e.g. Lichess' win% curve). The useful idea: judge a position at a set *moment*, not only at the end.
- **Board-game AI / balance studies** (self-play with MCTS/AlphaZero-style agents — e.g. a Mahjong study measuring the first seat's edge at ~26% vs 22.5% by seat, 7 Wonders Duel's ZeusAI rating "going first" as worth more than an extra pick): play many AI games, count wins by seat or by situation, change one rule, play again.
**Which measures, at which moments**
- A situation is a number the game names per seat: score lead, letters in hand, glyphlings trapped, pockets owned… (the game knows what's worth asking).
- Sampled *after the seat's own turn N* (default turns 3 and 5) and at the *end* — early turns say what to aim for, the end says what the winners ended with. Moments live in `content/ai/arena.json` (`whatWinsMoments`).
- Per situation per moment: **win rate by low / mid / high** (terciles — thirds of the seats by value; ties never split, so a yes/no number gets two groups, not three) and **how strongly it predicts the win**: *the edge* = in how many winner-vs-loser pairs **of the same game** the winner had the higher number (ties count half). 50% = says nothing, 100% = the winner always had more, 0% = always less (fewer is better). Same-game pairs on purpose: a 2-player table's 50% base rate and a 4-player table's 25% never get mixed up (the tercile win rates do mix them, so the base rate is printed beside them).
**How many games are enough**
- A win rate from n games is ± about 1/√n at 95% (100 games → ±10 points, 400 → ±5). The default floor is 30 seats per group and 30 winner-loser pairs (`whatWinsMinGames`); a situation below it is **left out and listed as "too few games"**, never hidden. The Dev Kit's 6-game run will mostly say "too few" — that's honest; `npm run ai:arena` (60+ games) is where it reads.
**Plain words**: "Players with score lead 10 or more after turn 5 win 78% (of 240 games) — vs 12% with −3 or less." Top 5 by edge (furthest from 50%).
**Pitfalls (said on the report)**
- *Already winning:* a number that is the score (score lead at the end) predicts the win because it IS the win — useful as a sanity check, not as advice. The things that win *early* are the ones to value. Built in after the Glyphtender proof (its "Magic lead at the end" took the #1 slot at 100%): a situation that at the end picks the winner ≥ 95% of the time (`whatWinsIsTheWin`) is named apart, and its early moments speak instead ("Magic lead 4 or more after turn 3 win 59%").
- *Whose turn is it:* a game's own turns may not be "moves until someone else acts" (Glyphtender's draft) — the plug may count them (`turns(state, seat)`).
- *Correlation, not cause:* "players with more trapped glyphlings win" may mean strong players trap more, not that trapping wins. Test a hunch by changing a goal and running again.
- *Survivors:* turn 5 is only counted in games that reached turn 5; long games are over-represented late.
- *The AI's own style:* bots value what their goals tell them to; a situation a goal never chases looks weak only because nobody tried it.
**This sprint takes**: situations + moments, terciles, the same-game edge, the floor + "too few", top 5 sentences on the report and the Dev Kit. **Later (not now)**: logistic regression on several situations at once (what wins *with the others held still*), a chess-style win-probability curve over the game, situation × personality splits.

## Auto-tuner — "Suggest sliders" (F26, built 2026-10-23)
- **Only suggests** (Muzzy): nothing touches `content/` until the designer presses Apply then Save in the Dev Kit (or copies the values by hand from `npm run ai:tune`'s page).
- **Which sliders**: the ones the AI tab edits that change play — each trait's range (moved whole, width kept, inside 0–100), nudge, focus, each steady goal already set (0–1). Not chattiness (talk only), extras (game-specific, no known range), goal order or mood shifts (not a number line).
- **How it searches** — coordinate steps, explainable in one line each: one slider at a time, a step up (or down); keep it only if it's better; a slider that helped goes again the same way; after a pass where nothing helped, halve the step; stop when all green, out of tries / time, or settled (nothing helps at the smallest step). "Better" = more of its own targets green, then more of the other personalities', then closer to its red ones (each red target's shortfall on its own scale). Same seeds for every try (common random numbers), so only the slider changed.
- **The personality at every table** (its seat moving round, table sizes going round, the rest of the cast shuffled in) — every game teaches the tuner something; the others stay exactly as they are.
- **Overfitting guard**: the start and the best both play `tuneFreshGames` games on `tuneFreshSeed` (never tuned on); only a best with MORE targets green there is suggested — "closer but still red" isn't enough. Otherwise: "luck, not a real gain — keep what you have".
- **Honest "can't"**: each target still red says why — "within these ranges" (settled) vs "within this budget" (tries / time) vs "on the edge" (green on the tuning games, red on fresh).
- **Budget** in `content/ai/arena.json`: tuneGames 12 · tuneTries 20 · tuneSeconds 900 · tuneFreshGames 24 · tuneSeed 7000 · tuneFreshSeed 9000 · tuneStep 0.25 (defaults in code for an older arena.json).
- **Later (not now)**: several sliders at once (random search / CMA-ES) when one-at-a-time stalls on traits that only work together; tuning goal order; a "stay fun to lose to" guard (win-rate band) as an extra target.

## Built how (engineering calls — Claude's, logged in Glyphtender TDD)
- `ai/` module, pure TypeScript, no React, no network — like `table/`. Copied into games with a version stamp.
- Bot shape unchanged: `(view, seat, rng) → { action, rng }` — a brain is made from (game plug, personality, skill, memory). Beliefs/memory live per bot seat, rebuilt from that seat's events, so a server restart or a rejoin rebuilds them.
- Runner: Web Worker on the device (one per game); on the server the brain runs inside the room with a CPU budget. Time budget per decision is data (phone ≤ ~300 ms of thinking; think *time* shown to players is separate pacing).
- Arena: Node (`npm run ai:arena`), the same engine and the same brain — one AI, everywhere. Plain maths for tell-apart / what-wins (nearest-centroid and logistic regression); no ML library unless proven needed.

## Not in v0.5
Look-ahead search (several turns deep — a later, stronger "Look" step; nothing else changes) · learning between games · AI for real-time games · a Unity twin.

## Learned in the build
