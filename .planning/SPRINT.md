# Sprint 57 — Fewer false alarms, rules that carry their own reasons
Started 2026-11-04 · Milestone v0.37 · Features: F185

## F185 🔧 Slimmed rule set
Done when: the approved rule verdicts (`research/audit-2026-11/rules.md` §5–§7, §10) are applied — the false alarms that cost ~1,000 retries are fixed, the dead rules work, the judgement rules that can be hooks are hooks, and CLAUDE.md + session start shrink to what judgement needs — with every real catch still caught (the audit's replayed refusals prove it).
- [ ] 🤖 1. Spike: can a hook rewrite a command on this Claude Code version (add `set -o pipefail` instead of refusing)? Decide the pipe rule's shape from the answer — ~/.claude/config/bmuz/hooks/guard-edits.mjs
- [ ] 🤖 2. Before-action false alarms: pipe rule (GE2), heredoc rule narrowed (GE3: quoted heredocs, sed patterns, scratch folders pass), shell variables aren't branch names (GG3), the same-line commit gates (GG8, GG13, …) left to git's own commit step — ~/.claude/config/bmuz/hooks/guard-git.mjs
- [ ] 🤖 3. After-edit and turn-end false alarms: lint at edit time = syntax + undefined names, the rest once at turn end (LE1); plan-lint's two-file rules at turn end (PL2, PL4–PL6); hand-off "did work" = a real edit or commit (HC1); sprint header near the top (HC3); Weighed source anywhere in its block (HC9); sprint line only for Fnn commits (SP1, Muzzy 2026-11-04); planner republish on card turns only (SP2); check:fast waits while a full check holds the lock (SC1) — ~/.claude/config/bmuz/hooks/handoff-check.mjs
- [ ] 🤖 4. Dead rules work: context checkpoint at the real compaction point (SM2); caps on RESUME HERE entries and Reviewed through (PL8) — ~/.claude/config/bmuz/hooks/session-moments.mjs
- [ ] 🤖 5. Judgement rules that become hooks: report-only mode ("assess / analyze / what's going on"), an idea really landed in ROADMAP Ideas, questions numbered everywhere, the same failure 3× → "reassess", a "Lesson →" line's file really changed, long paragraphs logged only (measure first) — ~/.claude/config/bmuz/hooks/plan-lint.mjs
- [ ] 🤖 6. CLAUDE.md ~20 KB → ~7.5 KB: judgement rules one line each, hook-carried rules become pointers, dated quotes move into their rule files' `why`; duplicate rule prose in the skills → pointers; longest skill descriptions trimmed — ~/.claude/CLAUDE.md
- [ ] 🤖 7. Proof: re-run the audit's replays + firing counts (fewer false alarms, every real catch still caught); whole hook + script suites green; push — .planning/research/audit-2026-11/tools/rules-replay.mjs
Check: the audit's replayed false alarms now pass and its real catches are still refused (counts before/after); whole suites green; CLAUDE.md size before/after with every rule accounted for (kept, pointer, or moved into a rule file); a live session start under 2 KB in the framework and Goops.

## Notes
- Open bugs: none open in the framework (BUGS.md has no open P0/P1).
- Claude's call: one helper builds tasks 1–5 + 7 in a scratch copy of the hooks folder and swaps in at the end (as F184 — Hook rule runner did); Claude does task 6 (CLAUDE.md is Muzzy's words — moved, not lost) in parallel, since it touches no hook file.
- Claude's call: helper briefs say never wait on a background notice (run long checks in the foreground or read their output), and send a status line every 45 min; main keeps a wake-up running while it waits (HC10).
- Claude's call: "lists, not paragraphs" starts log-only — it sends nothing back until the firing log shows its false-alarm rate.
- Claude's call: making the lint module part of every game (audit §5 #9) waits for the games' update after v0.37 — games are paused.
