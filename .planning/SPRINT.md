# Sprint 11 — every game gets the same guard rails, automatically
Started 2026-10-19 · Milestone v0.9 · Features: F76, F77, F78
From the Oct 18 list audit (`~/.claude/config/bmuz/reviews/2026-10-18-reliability/AUDIT-2026-10-19.md`). Muzzy's aim: a bulletproof SOP, so every user and every game gets the same treatment, enforced by code wherever possible. UI kit code → `dev/conformance` (worktree `.claude/worktrees/agent-a24e65cae835fd08b`); BMUZ hooks/scripts → `~/.claude/config/bmuz/` (→ laptop via /sync). Goops (F62) still waits for its own session.

## F76 🔧 Every Settings switch actually does something
Done when: the UI kit's checks fail when a row in a game's `content/ui/settings.json` is switched on but nothing in the game reads it (rows the kit handles itself, like the Audio tab, are skipped), the planner says it in plain words, and Glyphtender passes or has its gaps on its roadmap.
- [x] 🤖 1. Find how games read a setting (Glyphtender, Goops, the kit's Settings block) so the check has one thing to look for → Notes — ui-kit/kit/blocks/Settings.tsx, glyphtender/src
- [x] 🤖 2. UI kit conformance check (static): every switched-on row id is read in game code outside the kit copies; plain-words sentence for the planner — ui-kit/kit/conformance.mjs, ~/.claude/config/bmuz/templates/ppp/framework-words.mjs
- [x] 🤖 3. Tests: a dead row → red · a read row → green · kit-handled rows skipped — ui-kit/kit/conformance tests
- [x] 🤖 4. Run it on Glyphtender: fix dead rows, or list them on its roadmap / known gaps — glyphtender (dev/framework-checks)
- [x] 🤖 5. Every game's check:fast runs the framework's code checks (Muzzy: yes, mid-sprint) — glyphtender/scripts/check-all.mjs (57f9b64), ~/.claude/config/bmuz/checkup.sh
Check: the new check red on a fake dead row, green on Glyphtender after task 4.
Ask Muzzy: —

## F77 🔧 "Update available" when a session starts
Done when: a session started in a game says in one plain line which framework pieces are behind the newest (and stays quiet when all are current or the framework isn't on this machine).
- [x] 🤖 1. Session start: compare each `src/*/VERSION` copy with the framework's newest and print one plain line naming what's behind + what to say to update — ~/.claude/config/bmuz/session-start.sh
- [x] 🤖 2. The newest comes from the framework checkout (`BMUZ_FRAMEWORK` overrides); no framework folder → quiet; fast (no network) — session-start.sh
- [x] 🤖 3. Tests (a behind copy → named, current → quiet) + HOOKS.md row — ~/.claude/config/bmuz/hooks/test-hooks.mjs, HOOKS.md
Check: a session start in Glyphtender (UI kit 0.19.0 vs 0.19.2) names the UI kit.
Ask Muzzy: —

## F78 🔧 Safety guards
Done when: no commit can include a secret or Playwright leftovers, Claude is asked before `git checkout`/`restore` throws away uncommitted changes, /save adds a game's missing ignore lines itself, and `.playwright-mcp/` is cleaned up at the end of a turn — each proven by a test.
- [x] 🤖 1. guard-git: refuse a commit that would include `.env`, keys, credentials or `.playwright-mcp/` (one shared list with save.mjs, in lib) — ~/.claude/config/bmuz/hooks/guard-git.mjs, scripts/lib.mjs
- [x] 🤖 2. guard-git: ask (permission prompt, not a refusal) before `git checkout -- <file>` / `git checkout .` / `git restore` over files with uncommitted changes — hooks/guard-git.mjs
- [x] 🤖 3. save.mjs: a game's .gitignore gets `.claude/worktrees/` and `.planning/ppp.html` if missing, committed with the save — scripts/save.mjs
- [x] 🤖 4. Stop hook: delete `.playwright-mcp/` in the project folder at the end of a turn — hooks/
- [x] 🤖 5. Tests for 1–4 + HOOKS.md rows — hooks/test-hooks.mjs, scripts/test-scripts.mjs, HOOKS.md
- [x] 🤖 6. save.mjs runs cleanup.sh itself (not "remembered" from the skill text) and prints its line — scripts/save.mjs
- [x] 🤖 7. One scratch place for Claude's throwaway copies + proof shots (`~/Documents/dev/.scratch/<project>-<what>/`); cleanup.sh empties entries untouched for a day; the develop skill + helper briefs point there — cleanup.sh, ~/.claude/skills/develop/SKILL.md
Check: test-hooks + test-scripts green, each guard proven to block / ask / fix.
Ask Muzzy: —

Notes:
- Muzzy 2026-10-19: "is there a hook for bmuz to clean up the screenshot files it makes?" Answer: cleanup.sh existed (Oct 4) but ran only when the /save and /deliver text was remembered; nothing covered Claude's own copies outside projects (~/spike 800 MB + ~/ppp-proof 240 MB). With his OK: both deleted (the half-pause experiment kept as glyphtender/.planning/research/f89-half-pause-spike.patch, 6b0f495) → F78 tasks 6–7.
- F76 (2026-10-19, helper; Claude re-ran it on Glyphtender: ✓ "19 rows on: 8 read by the game, 11 handled by the kit / audio module"): UI kit **0.20.0** check "every Settings row that's switched on is read by the game" (static; reads = quoted id / object key / `.id`, not words from JSON or comments; info rows need `info={{ id }}`; kit-handled rows skipped; a placeholder example.com link fails) · 7 tests (ui-kit 360/360) · planner sentence (13/13) · Glyphtender 0.19.0 → 0.20.0 (38b7b62), check:framework 24 kept + known gap F89. Found elsewhere: **Goops' `version` row shows the placeholder** (no `info` text) → F62 · **Roll Better's privacy link is still example.com** → its Later note. Gap: games' check:fast doesn't run `check:framework --static`, so module checks only run at install + check:full.
- F77 + F78 (2026-10-19, helper; Claude verified): session start names pieces behind the framework checkout ("Framework updates available: Dev Kit 0.20.2 → 0.20.3, Audio 0.3.1 → 0.3.2 …" against dev/conformance; quiet against main, which is older until the v0.9 merge) · guard-git refuses secrets on ANY commit (one NEVER_COMMIT list in hooks/lib, + secrets.json, .dev.vars) · guard-git ASKS before checkout/restore would discard uncommitted changes · save.mjs adds the 2 ignore lines + runs cleanup.sh itself · stop-cleanup.mjs removes `.playwright-mcp/` each turn · cleanup.sh empties `~/Documents/dev/.scratch/` entries older than 24 h · settings.json diff = only the stop-cleanup registration · test-hooks 264/264, test-scripts 84/84. The save skill's remembered cleanup line is gone (now automatic).
- F76 follow-up (Muzzy: yes): every game's check:fast runs `check-framework.mjs --static` — Glyphtender 57f9b64 (fast 6/6 ✓, 9 s); /checkup section 7 flags a game without it. F80 "Everything triggers" added to the roadmap for sprint 12 (Muzzy: "'only runs when it remembers' is a bad thing; 'always runs because it triggers' is much more solid").
- Sprint 11 review (low): 4 findings, none could delete wrong files or let a secret through. Fixed by Claude: bare `git checkout -f` now asks (test-hooks 266/266) · /checkup section 7 also sees src/*/kit/VERSION copies. Helper fixing: the Settings check's comment stripper isn't string-aware (a glob string can hide reads → false fail), and its reads are too loose (common-word ids pass while dead → false pass).
- F76 review fixes (helper; Claude re-ran on Glyphtender): UI kit **0.20.1** (1e30635): string-aware comment stripper, and reads must go through the settings values / an id comparison / info / a settings call. Glyphtender 8 real reads confirmed by hand (tips and credits had been matching by accident before), Goops 4 read + its version row flagged. ui-kit 363/363. Glyphtender eb032a7.
- Muzzy 2026-10-19: approved F76, F77, F78.
