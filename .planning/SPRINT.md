# Sprint 67 — The BMUZ engine, made real and installed on both machines
Started 2026-11-08 · Milestone BMUZ 1.0 — The rebuild · Features: F211, F212 (in this order)

## F211 🧱 BMUZ engine core
Done when: in a test project the engine runs a pipeline end to end with the status band, gates, journal, watchdog and retries — and the 7 live must-fixes hold, including an overnight background run that never stops to wait.
- [ ] 🤖 1. Create the BMUZ project (dev/bmuz, public repo, added to HUB) and bring the proof engine in as the start — .planning/research/bmuz-vision/proof/plugin/hooks/register.tsx
- [ ] 🤖 2. Pipeline file format written down + a check that refuses a broken pipeline file — .planning/research/bmuz-vision/proof/plugin/hooks/engine.js
- [ ] 🤖 3. Memory and safety: journal, lock, doctor, checkpoints + plain-words undo list, 2 retries then BLOCKED, per-step tool limits, deviation log — .planning/research/bmuz-vision/proof/plugin/hooks/engine.js
- [ ] 🤖 4. The 7 live must-fixes (auto never asks, Claude Code confirmations pre-answered, Approve never pre-selected, engine actions labelled, band refreshes instantly, one plan-mode rule, died-at-gate logged as crash) — .planning/research/bmuz-vision/proof-results.md
- [ ] 🤖 5. Watchdog + workflow start with pinned inputs; every hook refuses on its own error (prompt.submit too) — .planning/research/bmuz-vision/proof/plugin/hooks/register.tsx
- [ ] 🤖 6. Tests for all 16 checks (plugin test + no-Claude tests + scripted headless runs); check 15 overnight never-stall passes — .planning/research/bmuz-vision/proof/plugin/tests/engine.test.tsx
- [ ] 🙋 7. Live re-check with Claude, one step at a time (~10 min)
Check: claude plugin test + node tests green · headless runs for checks 1, 3, 6, 8, 9, 12, 13 · background run for 15 never waits · Muzzy's live re-check of band, gate, kill-at-gate, watchdog, plan mode.

## F212 🧱 BMUZ plugin on both machines
Done when: the BMUZ plugin is installed from BMUZ's own repo (not --plugin-dir) on the PC and the laptop, and a fresh test project shows the engine's band on both.
- [ ] 🤖 1. BMUZ's own plugin marketplace in its repo — .planning/research/bmuz-vision/proof/.claude-plugin
- [ ] 🙋 2. PC: paste the one install line Claude gives (Claude may not change its own settings)
- [ ] 🤖 3. The installed copy loads in a fresh project (the skipped L6 check) — .planning/research/bmuz-vision/proof-results.md
- [ ] 🙋 4. Laptop: pull, then the same install line
- [ ] 🤖 5. Pin the Claude Code version; plugin tests added to the update routine — ~/.claude/config/bmuz/HOOKS.md
Check: `claude plugin list` shows bmuz on both machines · a fresh project shows the band on both · plugin tests run in the update routine.

Ask Muzzy:
Notes: Plan stays in the framework roadmap until BMUZ has its own planner (Key facts rule, 2026-11-04). The new engine only acts in projects with a BMUZ pipeline file, so today's BMUZ keeps working untouched while it's built.
