# Sprint 27 — Finish the AI: see what wins, and let the computer suggest personality settings
Started 2026-10-23 · Milestone v0.5 The AI (its last should + could) · Features: F25, F26
Muzzy 2026-10-23: "we should finish up and close out the AI sprints" → "go" to this plan. Auto mode as in sprint 26: one helper per feature, commit per task, save per feature, each feature waits for his OK; nothing released.
Calls (Claude): the tuner only suggests — Muzzy applies; F25 then F26 (both touch the Dev Kit's Check panel). Helpers commit or send a one-line status at least every 45 min (sprint 26 lesson).

## F25 🔧 "What wins?" report
Done when: after an arena run, a game's designer sees which situations predict winning, in plain sentences ("Players ahead by 10+ after turn 5 win 78%"), on the report page and in the Dev Kit's Check panel — from numbers the game names itself, with too-small samples left out.
why: balance and AI goals come from what actually wins, not guesses
- [x] 🤖 1. Research: how studios mine self-play for "what wins" (card-game win-rate sites, chess engine evaluation terms, board-game AI papers) — which measures, at which moments, how many games are enough, how to say it in plain words → .planning/design/ai.md
- [x] 🤖 2. Situations: a game names numbers to sample (an optional `situations(state, seat)` on the arena plug, read at set turns); the arena records them per seat per game — ai/kit/arena.ts
- [x] 🤖 3. The maths: each situation's win rate by low / mid / high and how strongly it predicts the win, at each sampled turn; too few games → left out, said so — ai/kit/wins.ts (new: check.ts was already four checks long)
- [x] 🤖 4. The top 5 in plain sentences on the report page and in the Dev Kit's Check panel — ai/kit/report.ts, devkit/kit/ai/CheckPanel.tsx
- [ ] 🤖 5. Proof on a scratch Glyphtender copy (.scratch/glyphtender-f25): name its situations, run, read the results and check they make sense for that game; screenshots of the report + Check panel looked at — ai/kit/arena.test.ts
Check: ai + devkit tests, typecheck, lint green (root check:fast); the scratch run's top 5 read by me and sane for Glyphtender; screenshots looked at.

## F26 🔧 Auto-tuner
Done when: a personality that misses feel targets gets a suggested set of slider values (within its ranges) that hits more of them — on new games, not only the ones it was tuned on — shown as old → new per slider and red → green per target; from `npm run ai:tune` and a Dev Kit button; nothing is written until the designer applies it.
why: Muzzy tunes by feel; the computer can do the slow searching
- [ ] 🤖 1. The tuner: tries slider values within each slider's range, keeps what hits more targets (fixed seeds, a time / games budget in content/ai/arena.json) — ai/kit/check.ts
- [ ] 🤖 2. `npm run ai:tune -- --personality <id>` writes a suggestion page (old → new per slider, targets red → green, checked on fresh seeds) — ai/scripts/ai-arena.mjs
- [ ] 🤖 3. Dev Kit AI tab: "Suggest sliders" runs it in the background worker with progress, shows old → new, "Apply" puts the values in unsaved (Save as usual) — devkit/kit/ai/CheckPanel.tsx
- [ ] 🤖 4. Proof on the scratch Glyphtender: a personality with a red target → tune → apply → a fresh-seed check shows it green (or says honestly it can't be reached with those ranges); screenshots looked at — devkit/kit/ai/aiLogic.ts
Check: ai + devkit tests, typecheck, lint green (root check:fast); the scratch proof's before / after report read by me; screenshots looked at.

Notes:
- F25 calls (Claude): the maths lives in a new `ai/kit/wins.ts` (check.ts was already four checks long). "How strongly it predicts" = **the edge**: in winner-vs-loser pairs of the SAME game, how often the winner had more (ties half) — same-game pairs so 2-player (50%) and 4-player (25%) base rates never mix; plain words, no libraries. Terciles never split equal numbers (a yes/no makes two groups). Sentences: one per situation at its strongest moment, best-winning group vs worst (so a "middle is best" number says so), with "(of N games, ±1/√N)". Floor 30 (`whatWinsMinGames`), moments [3, 5, "end"], top 5 — all in content/ai/arena.json, defaults in the template.
- F25 calls: the Dev Kit reads the sentences off the report page (`[data-what-wins]`) instead of changing runCheck's return — no new wiring in any game. Situations that aren't numbers stop the run in plain English (the cheap "situations are numbers" promise, ① at run time — not a check:framework static check, which can't see run-time values). The installer offers situations as "Optional:" (never "Still to wire"). Found in the proof: Glyphtender's draft made "turn 3" land in the draft → the plug may count its own turns (`turns(state, seat)`).
- Ask Muzzy: the report says "of 240 games" counting one player's game each (a 3-player game = 3) — the way 17lands counts. Default: keep; say "player-games" if it reads wrong.
