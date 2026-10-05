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

## Built how (engineering calls — Claude's, logged in Glyphtender TDD)
- `ai/` module, pure TypeScript, no React, no network — like `table/`. Copied into games with a version stamp.
- Bot shape unchanged: `(view, seat, rng) → { action, rng }` — a brain is made from (game plug, personality, skill, memory). Beliefs/memory live per bot seat, rebuilt from that seat's events, so a server restart or a rejoin rebuilds them.
- Runner: Web Worker on the device (one per game); on the server the brain runs inside the room with a CPU budget. Time budget per decision is data (phone ≤ ~300 ms of thinking; think *time* shown to players is separate pacing).
- Arena: Node (`npm run ai:arena`), the same engine and the same brain — one AI, everywhere. Plain maths for tell-apart / what-wins (nearest-centroid and logistic regression); no ML library unless proven needed.

## Not in v0.5
Look-ahead search (several turns deep — a later, stronger "Look" step; nothing else changes) · learning between games · AI for real-time games · a Unity twin.

## Learned in the build
