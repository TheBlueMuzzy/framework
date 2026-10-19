# Sprint 11 — every game gets the same guard rails, automatically
Started 2026-10-19 · Milestone v0.9 · Features: F76, F77, F78
From the Oct 18 list audit (`~/.claude/config/bmuz/reviews/2026-10-18-reliability/AUDIT-2026-10-19.md`). Muzzy's aim: a bulletproof SOP, so every user and every game gets the same treatment, enforced by code wherever possible. UI kit code → `dev/conformance` (worktree `.claude/worktrees/agent-a24e65cae835fd08b`); BMUZ hooks/scripts → `~/.claude/config/bmuz/` (→ laptop via /sync). Goops (F62) still waits for its own session.

## F76 🔧 Every Settings switch actually does something
Done when: the UI kit's checks fail when a row in a game's `content/ui/settings.json` is switched on but nothing in the game reads it (rows the kit handles itself, like the Audio tab, are skipped), the planner says it in plain words, and Glyphtender passes or has its gaps on its roadmap.
- [ ] 🤖 1. Find how games read a setting (Glyphtender, Goops, the kit's Settings block) so the check has one thing to look for → Notes — ui-kit/kit/blocks/Settings.tsx, glyphtender/src
- [ ] 🤖 2. UI kit conformance check (static): every switched-on row id is read in game code outside the kit copies; plain-words sentence for the planner — ui-kit/kit/conformance.mjs, ~/.claude/config/bmuz/templates/ppp/framework-words.mjs
- [ ] 🤖 3. Tests: a dead row → red · a read row → green · kit-handled rows skipped — ui-kit/kit/conformance tests
- [ ] 🤖 4. Run it on Glyphtender: fix dead rows, or list them on its roadmap / known gaps — glyphtender (dev/framework-checks)
Check: the new check red on a fake dead row, green on Glyphtender after task 4.
Ask Muzzy: —

## F77 🔧 "Update available" when a session starts
Done when: a session started in a game says in one plain line which framework pieces are behind the newest (and stays quiet when all are current or the framework isn't on this machine).
- [ ] 🤖 1. Session start: compare each `src/*/VERSION` copy with the framework's newest and print one plain line naming what's behind + what to say to update — ~/.claude/config/bmuz/session-start.sh
- [ ] 🤖 2. The newest comes from the framework checkout (`BMUZ_FRAMEWORK` overrides); no framework folder → quiet; fast (no network) — session-start.sh
- [ ] 🤖 3. Tests (a behind copy → named, current → quiet) + HOOKS.md row — ~/.claude/config/bmuz/hooks/test-hooks.mjs, HOOKS.md
Check: a session start in Glyphtender (UI kit 0.19.0 vs 0.19.2) names the UI kit.
Ask Muzzy: —

## F78 🔧 Safety guards
Done when: no commit can include a secret or Playwright leftovers, Claude is asked before `git checkout`/`restore` throws away uncommitted changes, /save adds a game's missing ignore lines itself, and `.playwright-mcp/` is cleaned up at the end of a turn — each proven by a test.
- [ ] 🤖 1. guard-git: refuse a commit that would include `.env`, keys, credentials or `.playwright-mcp/` (one shared list with save.mjs, in lib) — ~/.claude/config/bmuz/hooks/guard-git.mjs, scripts/lib.mjs
- [ ] 🤖 2. guard-git: ask (permission prompt, not a refusal) before `git checkout -- <file>` / `git checkout .` / `git restore` over files with uncommitted changes — hooks/guard-git.mjs
- [ ] 🤖 3. save.mjs: a game's .gitignore gets `.claude/worktrees/` and `.planning/ppp.html` if missing, committed with the save — scripts/save.mjs
- [ ] 🤖 4. Stop hook: delete `.playwright-mcp/` in the project folder at the end of a turn — hooks/
- [ ] 🤖 5. Tests for 1–4 + HOOKS.md rows — hooks/test-hooks.mjs, scripts/test-scripts.mjs, HOOKS.md
Check: test-hooks + test-scripts green, each guard proven to block / ask / fix.
Ask Muzzy: —

Notes:
