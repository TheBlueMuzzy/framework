# Sprint 10 — mistakes get caught even when nobody's watching
Started 2026-10-19 · Milestone v0.9 · Features: F70, F72, F75, F79
GitHub re-checks every push (F70), and every feature boundary leaves the files telling the whole truth (F72). Goops (F62) still waits for its own session (sprint 07 awaiting Muzzy's approvals on `dev/m1-core-shift`). BMUZ pieces live in `~/.claude/config/bmuz/` (→ laptop via /sync); Glyphtender's workflow rides on its `dev/framework-checks` branch.

## F70 🔧 GitHub re-checks every push (CI backstop)
Done when: a game repo's GitHub Actions run check:fast + check:framework on every push, a broken commit shows red, /deliver won't merge while the branch is red, and new games get the workflow at setup.
- [x] 🤖 1. Shared workflow template: on push (any branch) + pull request → npm ci, check:fast, check:framework (Playwright's own Chromium) — ~/.claude/config/bmuz/templates/checks.yml
- [x] 🤖 2. Add it to Glyphtender on dev/framework-checks (ships with that update) — glyphtender/.github/workflows/checks.yml
- [x] 🤖 3. Prove it: a push shows green on GitHub; a deliberately broken commit shows red, then is reverted (git revert, no force-push) — glyphtender dev/framework-checks
- [x] 🤖 4. BMUZ wiring: /deliver refuses to merge while the branch's latest run is red (`gh run list`), and new-game setup copies the workflow — ~/.claude/skills/deliver/SKILL.md, config/bmuz/scripts/release.mjs, config/bmuz/SETUP-AND-CONVERT.md
- [x] 🤖 5. Goops gets the workflow as a task in F62 (its session is busy now) — .planning/ROADMAP.md
- [x] 🤖 6. The framework gets its own linter, in 3 layers: a hook lints each code file Claude edits (framework + games, like check-ui-edit), install-module refuses a module that fails it, GitHub runs it; the manual line comes out of /develop — framework/eslint.config.js, ~/.claude/config/bmuz/hooks/, scripts/install-module.mjs
- [x] 🤖 7. Audit the Oct 18 review list: every item landed (where) or not; not landed → a roadmap item; the look-back template checks that review lists landed — config/bmuz/reviews/2026-10-18-reliability/HOOK-CANDIDATES.md, templates/lookback.md
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

## F75 🔧 "Done" means reviewed + fully checked (pulled in 2026-10-19, from the audit)
Done when: a `Fxx: done` commit is refused unless STATE's `Reviewed through:` and `Last full check:` lines name commits from this feature (at or after its first commit) — the per-feature review and full check stop being honour-system.
- [x] 🤖 1. guard-git: read both lines from STATE (the staged version if STATE is in the commit), check each named commit is at/after the feature's first commit; plain-words refusal saying which is missing — ~/.claude/config/bmuz/hooks/guard-git.mjs
- [x] 🤖 2. Tests: missing review → refused · old full check → refused · both current → allowed · a project with no check:full (no e2e) → full check not required — hooks/test-hooks.mjs
- [x] 🤖 3. HOOKS.md row 14 + the develop skill's review / full-check lines say the hook enforces them — ~/.claude/config/bmuz/HOOKS.md, ~/.claude/skills/develop/SKILL.md
Check: test-hooks green; a done commit without a current review line is refused.
Ask Muzzy: —

## F79 🔧 One check run at a time in every game (pulled in 2026-10-19, from the audit)
Done when: every game's check-all.mjs refuses a second run while one is going (the template's lock), and an old copy without it gets flagged instead of silently trusted.
- [x] 🤖 1. Glyphtender's check-all.mjs gets the template's lock (on dev/framework-checks) — glyphtender/scripts/check-all.mjs
- [x] 🤖 2. Prove it: a second run while one is going is refused, Ctrl+C frees the lock — glyphtender
- [x] 🤖 3. /checkup (and install-module) flag a game whose check-all.mjs has no lock, with the fix — ~/.claude/config/bmuz/checkup.sh, scripts/install-module.mjs
Check: two runs at once in Glyphtender → the second refuses with a plain message.
Ask Muzzy: —

Notes:
- Muzzy 2026-10-19 (F72): after an approved feature, **save + keep going** in the same chat (not "suggest /clear").
- F72 build (2026-10-19): /develop "Approved" = STATE + `F08: done` + /save, keep going; unattended runs → one fresh helper per feature (develop skill + CLAUDE.md Autonomous Mode); guard-git refuses a `Fxx: done` (also `Fxx + Fyy: done`) when STATE.md is not in the commit and has not changed since the feature's first commit (only in repos with .planning/STATE.md); HOOKS.md row 14; test-hooks 212/212 (7 new: blocks stale, allows updated / already-updated, not-done commits, non-BMUZ repos).
- Muzzy 2026-10-19: "so why didn't you think of it?" The framework linter WAS on the Oct 18 list (HOOK-CANDIDATES: "installers run a module's own checks + lint and refuse on red"); F69 built the tests + type check and dropped lint without logging it. Cause: F69 was checked against its own Done-when, never against the list it came from. → tasks 6 + 7.
- Task 7 (2026-10-19): audit 21 landed · 8 partly · 13 not (`~/.claude/config/bmuz/reviews/2026-10-18-reliability/AUDIT-2026-10-19.md`). Homes: F75 done = reviewed + fully checked · F76 Settings-row check · F77 update notice at session start · F78 safety guards (secrets on any commit, ask before checkout wipes work, .gitignore entries, .playwright-mcp cleanup) · F79 check-run lock in every game · F62 now includes Goops check:framework + GitHub checks · Later: 6 lower-value items. Look-back template gains "promised but not landed". Muzzy: "proceed as you see fit … a bulletproof process — SOP so every user and every game gets the same treatment" → F75 + F79 pulled into this sprint (same goal, small); task 6 gets the lint hook layer.
- F79 task 3, part 1 (2026-10-19): /checkup section 7 "same safety kit in every game" (lock · GitHub checks · check:framework, each ✗ names the fix). First run: glyphtender ✗ lock · goops ✗ GitHub checks + check:framework (→ F62) · roll-better ✗ check:framework (on the shelf → its roadmap when it comes off) · windchime ✓. install-module flag comes with task 6.
- F70 tasks 1–4 (2026-10-19, helper; verified by Claude): `templates/checks.yml` (check:fast + check:framework with Playwright's Chromium, failure artifacts) · Glyphtender `.github/workflows/checks.yml` on dev/framework-checks: green https://github.com/TheBlueMuzzy/glyphtender/actions/runs/39269954849 → deliberate red …/39270522272 → revert green …/39270859941 · `scripts/checks-gate.mjs` + release.mjs: /deliver refuses on red / running / unchecked (warns when no workflow or no gh) · SETUP step 7, PROJECT-FILES Checks, develop + deliver skills. Root cause of the first reds: 5 whole-real-AI-game tests had the default 5 s (4–8 s on GitHub's runner); they got the 30 s their siblings already had. check:fast now runs half as many checks at once as there are cores. test-scripts 74/74.
- ⚠ The F70 helper ran the full skill tests unasked (10:31 AM, $1.39), against Muzzy's rule A. Fix: `test-skills.mjs` now refuses without `--muzzy-said-yes` (checkup + evals README updated), so a written rule became an enforced one.
- F70 task 6 (2026-10-19): framework linter, 3 layers. ① lint-edit hook (HOOKS.md row 15; lints each edited JS/TS file with the project's own eslint, `--no-ignore` only inside the framework) · ② install-module runs test/typecheck/check-ui/check-devkit/**lint** and refuses on red (refuses too when the framework root has no eslint installed → "npm install once") · ③ framework `.github/workflows/checks.yml`: every module's own checks, one job each — all 6 green https://github.com/TheBlueMuzzy/framework/actions/runs/39272336297 (first run: ui-kit red only because GitHub had no browser for its layout test → Playwright Chromium step). Framework lint found 37 errors → fixed: ui-kit 0.19.1 (refs read/written while drawing: ScreenStack, Countdown, SnapControl, gallery), Dev Kit 0.20.3 + audio 0.3.2 (tests only). /develop's 2 manual lines replaced by one pointer. test-scripts install-module 9/9.
- F79 (2026-10-19): Glyphtender check-all.mjs has the lock (5a56e8f) — proven: a second run refused with a plain message, the lock cleared after the first finished · /checkup section 7 + install-module both name a game whose check-all has no lock.
- Sprint 10 review (low, 2026-10-19): 2 real findings, both fixed. ① F75's STATE-line reader matched the words anywhere ("…then write Reviewed through" in RESUME HERE would count as a review) → anchored to the start of a line, +1 test (test-hooks 228/228). ② UI kit 0.19.1 moved ScreenStack's "who opened me" note into a layout effect, so a screen with an autoFocus field would steal it → **UI kit 0.19.2** keeps a short focus history and takes the newest thing outside the new screen; new test proven red without the fix (353/353, framework CI green). Bonus proof: the new lint-edit hook caught the deliberate break as it was typed. Glyphtender still has UI kit 0.19.0: it gets 0.19.2 with its next update (no autoFocus screens in it today). Reviewed through: framework 55b97d7 · Glyphtender 5a56e8f · ~/.claude (not git) as of 2026-10-19 11:00.
- Muzzy 2026-10-19: approved all four (F70, F72, F75, F79).
