# Sprint 30 — Let a second window turn finished game pieces into framework modules
Started 2026-10-24 · Milestone v0.13 Games feed the framework · Features: F114
Muzzy 2026-10-24: "yes. go" to the plan. Auto mode: one helper per feature, commit per task, save per feature, waits for his OK; nothing released.
What changes: game sessions get a way to hand finished pieces over, and the framework window builds them as modules. What stays the same: how games are built today — nothing is extracted unless a game session queues it.

## F114 🔧 Extraction queue
Muzzy (via Goops' session, 2026-10-23): "i feel like there's got to be a way to continue development while waterfalling just finished elements as extracts to modules by another claude… just for me though… then obviously there needs to be some form of re-integration once complete?" Only in Muzzy's BMUZ setup (~/.claude), not shared with others.
Done when: a game session adds a queue entry (game, commit, files, what it does, which of its e2e checks prove it) with one command that refuses missing files / checks; the framework session lists entries and marks them building / released; while an entry is open, editing its files in that game warns "bug fixes only — being extracted" and each such fix is logged on the entry; a swap command in the game installs the released module, deletes the game's old copy and runs the listed checks unchanged, all in one commit; the flow is in PROJECT-FILES.md and /develop; one end-to-end trial on a scratch Goops copy.
- [ ] 🤖 1. The queue file (.planning/extractions.md in the framework repo, one entry per piece) + its reader — ~/.claude/config/bmuz/scripts/lib.mjs
- [ ] 🤖 2. `extract.mjs add | list | status` — a game adds an entry at its current commit (refuses missing files or e2e scripts); the framework marks building / released — ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 3. Frozen-files warning: an edit to an open entry's file in that game warns (never blocks) and asks for a one-line fix log on the entry — ~/.claude/config/bmuz/hooks/guard-edits.mjs
- [ ] 🤖 4. `extract.mjs swap <id>` in the game: install-module the released module, delete the old files, run the entry's checks unchanged, one commit — ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 5. Rules: PROJECT-FILES.md "Extraction queue" + one /develop line + HOOKS.md row; tests in test-scripts / test-hooks — ~/.claude/config/bmuz/PROJECT-FILES.md
- [ ] 🤖 6. Trial on a scratch Goops clone: queue a small finished piece, build it as a framework module on a scratch framework copy, swap it back, the game's checks pass unchanged — ~/Documents/dev/.scratch/
Check: test-scripts + test-hooks green; the trial's before / after check results read by me.

Notes:
- Goops' suggested candidates (for real runs later, its session's call): the lesson runner (F30, reused by story moments), console repair mini-games, a profile module (name, maybe avatar — Goops F66).
