# Sprint 10 — mistakes get caught even when nobody's watching
Started 2026-10-19 · Milestone v0.9 · Features: F70, F72
GitHub re-checks every push (F70), and every feature boundary leaves the files telling the whole truth (F72). Goops (F62) still waits for its own session (sprint 07 awaiting Muzzy's approvals on `dev/m1-core-shift`). BMUZ pieces live in `~/.claude/config/bmuz/` (→ laptop via /sync); Glyphtender's workflow rides on its `dev/framework-checks` branch.

## F70 🔧 GitHub re-checks every push (CI backstop)
Done when: a game repo's GitHub Actions run check:fast + check:framework on every push, a broken commit shows red, /deliver won't merge while the branch is red, and new games get the workflow at setup.
- [ ] 🤖 1. Shared workflow template: on push (any branch) + pull request → npm ci, check:fast, check:framework (Playwright's own Chromium) — ~/.claude/config/bmuz/templates/checks.yml
- [ ] 🤖 2. Add it to Glyphtender on dev/framework-checks (ships with that update) — glyphtender/.github/workflows/checks.yml
- [ ] 🤖 3. Prove it: a push shows green on GitHub; a deliberately broken commit shows red, then is reverted (git revert, no force-push) — glyphtender dev/framework-checks
- [ ] 🤖 4. BMUZ wiring: /deliver refuses to merge while the branch's latest run is red (`gh run list`), and new-game setup copies the workflow — ~/.claude/skills/deliver/SKILL.md, config/bmuz/scripts/release.mjs, config/bmuz/SETUP-AND-CONVERT.md
- [ ] 🤖 5. Goops gets the workflow as a task in F62 (its session is busy now) — .planning/ROADMAP.md
Check: Glyphtender's Actions tab shows a green run on dev/framework-checks and the red-then-green pair from task 3.
Ask Muzzy: —

## F72 🔧 Session hygiene: every feature boundary saved, unattended runs stay fresh
Done when: every feature that turns ✅ leaves STATE's RESUME HERE + a /save behind (checked by a hook, not memory), the chat keeps going (Muzzy 2026-10-19: "Save + keep going" — no /clear nudges), and unattended runs ("just go") hand each feature to a fresh helper instead of filling one chat to the 80% warning.
- [x] 🤖 1. /develop "Approved": STATE RESUME HERE replaced + /save in the same turn, then carry on in the chat — ~/.claude/skills/develop/SKILL.md
- [x] 🤖 2. Autonomous mode: each feature goes to one fresh helper (brief = STATE + SPRINT + the feature), the main chat only plans, merges, checks and saves — ~/.claude/CLAUDE.md "Autonomous Mode", ~/.claude/skills/develop/SKILL.md
- [x] 🤖 3. Hook: an `Fxx: done` commit whose STATE RESUME HERE wasn't touched since the feature started is refused with the reason — ~/.claude/config/bmuz/hooks/
- [x] 🤖 4. HOOKS.md row + hook tests (prove it blocks, prove it passes) — ~/.claude/config/bmuz/HOOKS.md, hooks/test-hooks.mjs
Check: test-hooks green including the new hook; a fake `Fxx: done` without a STATE change is refused, with one it passes.
Ask Muzzy: —

Notes:
- Muzzy 2026-10-19 (F72): after an approved feature, **save + keep going** in the same chat (not "suggest /clear").
- F72 build (2026-10-19): /develop "Approved" = STATE + `F08: done` + /save, keep going; unattended runs → one fresh helper per feature (develop skill + CLAUDE.md Autonomous Mode); guard-git refuses a `Fxx: done` (also `Fxx + Fyy: done`) when STATE.md is not in the commit and has not changed since the feature's first commit (only in repos with .planning/STATE.md); HOOKS.md row 14; test-hooks 212/212 (7 new: blocks stale, allows updated / already-updated, not-done commits, non-BMUZ repos).
