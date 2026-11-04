# Sprint 55 — Measure BMUZ and the framework before we cut anything
Started 2026-11-04 · Milestone v0.37 · Features: F181, F182, F183

## F181 🔧 Hook firing log
Done when: every time a BMUZ hook blocks, asks, sends a turn back or tells Claude something, one line lands in a local log (time · hook · rule text · project · kind) — without ever slowing or breaking the hook — and the past sessions are read into the same log, so F182 counts real firings.
- [x] 🤖 1. Measure today: list every hook and how it speaks (lib deny / ask / tellClaude / stopVerdict, or its own stdout write) — ~/.claude/config/bmuz/hooks/lib.mjs
- [x] 🤖 2. Tests red first: each way a hook speaks writes one log line; a log that can't be written never changes the hook's answer; no hook writes its answer except through lib — ~/.claude/config/bmuz/hooks/test-hooks.mjs
- [x] 🤖 3. lib.mjs logs every answer (the hook named from its own file) and the hooks with their own stdout writes go through lib — ~/.claude/config/bmuz/hooks/lib.mjs
- [x] 🤖 4. History reader: past sessions' hook answers into the same log shape, marked "history" — ~/.claude/config/bmuz/scripts/hook-history.mjs
- [x] 🤖 5. HOOKS.md says where the log lives and what it's for; pushed to ~/.claude-config — ~/.claude/config/bmuz/HOOKS.md
Check: the new tests red on today's lib, then green with the whole hook suite; a real hook firing in this session leaves its line; the history reader's counts match a plain text search on two hooks.
Checked: 2026-11-04 01:45 — by a fresh helper, read by Claude: new fire-log tests red on the old lib (12 of 13), then 13/13; whole hook suite 644/644, script suite 396/396 (17 new hook-history). A fake force-push into guard-git wrote its line; the real log has tonight's live lines (lint-edit, guard-edits, stop-plan-check). History: 2,169 answers in 53 sessions; handoff-check 297 and guard-edits heredoc 365 match a plain grep (duplicates dropped). Claude read lib.say/logFiring: the answer is written before the log, every log error swallowed. Pushed ~/.claude-config 3a3b2e9. Note: lib.mjs had a syntax slip for ~2 min mid-build (live hooks crashed, none blocked) — ~30 crash lines in the history are that. Approved by Muzzy 2026-11-04.

## F182 ❓ Rule inventory + verdicts
Done when: one page lists every BMUZ rule (CLAUDE.md, the skills, PROJECT-FILES, the hooks): where it lives, ①②③, how often it fired, false alarms, overlaps, and a proposed verdict (keep · merge · make it a hook · delete) with a one-line reason — and Muzzy approves or changes the verdicts.
- [x] 🤖 1. Build the inventory from the files + the firing log, write the report, publish it as a page — .planning/research/audit-2026-11/rules.md (page: https://claude.ai/artifact/Ja6U8U5fXdeNDtBvTX7Zad)
- [x] 🙋 2. Read the page, approve or change the verdicts — .planning/research/audit-2026-11/rules.md (approved 2026-11-04)
Check: every ①② rule in CLAUDE.md and every hook rule appears once; each verdict has its reason and its firing count; spot-check 5 counts against the log.
Checked: 2026-11-04 — report by a fresh helper, read whole by Claude; its biggest claims re-checked first-hand (session-start awk, Reviewed-through size, LEVELS = [90, 80]) — all matched; 8–16 hand-read firings per noisy rule (±15 %). Approved by Muzzy 2026-11-04 ("all approved your picks"), with his 2 decisions in §10.

## F183 ❓ Framework inventory + verdicts
Done when: one page lists every framework brick, plumbing piece and quality gate: lines, proven by which game, used by which game today (and which version), a proposed verdict (keep · freeze · move back to its game · archive), plus the inner-platform test — and Muzzy approves or changes the verdicts.
- [x] 🤖 1. Build the inventory from the framework + every game's copies, run the inner-platform test on a scratch copy of the starter, write the report, publish it as a page — .planning/research/audit-2026-11/framework.md (page: https://claude.ai/artifact/THpcWZYUCE432ML9YY8GT2)
- [x] 🙋 2. Read the page, approve or change the verdicts — .planning/research/audit-2026-11/framework.md (approved 2026-11-04)
Check: every top-level framework folder and every game's VERSION copy appears; sizes match a line count; "used by" checked against each game's files, not docs.
Checked: 2026-11-04 — report by a fresh helper, read whole by Claude; re-checked first-hand: Goops active until 01:16, 326 committed module files in the starter, starter-check refreshes modules (lines 9–12), no emotes in Glyphtender. Approved by Muzzy 2026-11-04, with Claude's §9 notes (extraction queue waits for F188 — Module recipe).

## Notes
- Muzzy went to bed 2026-11-04 ~01:20 — autonomous run (CLAUDE.md Autonomous Mode). Verdicts are PROPOSED only; nothing is cut tonight.
- Open bugs: none open in the framework (BUGS.md has no open P0/P1).
- Claude's call (F181): log at `~/.claude/logs/bmuz-hooks.jsonl` — per machine, not synced (config-sync copies only its listed folders), trimmed when it grows past a size cap. Answers only (not every silent pass): a pass is the normal case and would make the log huge; how often a hook RAN can still be read from the sessions.
- Claude's call (F181): logging lives in lib (one place), not a wrapper in settings.json — a wrapper adds a process per hook on every edit, and settings.json is Muzzy's to change. A test makes sure no hook answers around lib.
- Writing to ~/.claude in auto mode: proven 2026-11-04 01:25 (a test write in hooks/).

Retro (Muzzy 2026-11-04: "all approved your picks" — Claude's draft):
- Went well: measuring from the session history took one night, not a week.
- Went wrong: a typo in the shared hook file turned every hook off for ~20 minutes, silently.
- Change: a broken hook must say so loudly and the other rules keep running (F184 — Hook rule runner).
