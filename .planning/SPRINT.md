# Sprint 06 — BMUZ keeps itself in line: the audit's ⭐ rules become hooks, and every milestone feeds its lessons back
Started 2026-10-18 · Milestone v0.9 · Features: F67, F74 (F74 needs F67 — sprint rule)
List: `~/.claude/config/bmuz/reviews/2026-10-18-reliability/HOOK-CANDIDATES.md` (⭐ items). Hooks live in
`~/.claude/config/bmuz/hooks/` + `~/.claude/settings.json` → laptop via /sync. The credits check is framework code → `dev/conformance`.

## F67 🔧 Lesson audit → the ⭐ hooks
Done when: each ⭐ rule is enforced by a hook or check (blocks / reminds at the right moment, lets the normal case through), proven by test-hooks + one real try each; HOOKS.md lists them in plain words; the skill lines they replace are gone.
- [x] 🤖 1. Plan-file checker — `hooks/plan-lint.mjs` (PostToolUse on `.planning/{ROADMAP,SPRINT,BUGS,STATE}.md`), reader shared with `templates/ppp/build-ppp.mjs`: `needs:` → real IDs, Mermaid matches, 3–8 tasks per feature, BUGS "Open:" count right + fixed P0/P1 have `Guarded by:`, STATE ≤120 lines; then rebuilds `.planning/ppp.html`
- [x] 🤖 2. Session moments — `hooks/session-moments.mjs` (UserPromptSubmit): CTX ≥80% in `~/.claude/ctx-used.txt` (this session's ID) → "finish, write it down, /save"; "going to bed / switching machines / done for now" → "/save"
- [x] 🤖 3. Blocks — `hooks/guard-edits.mjs` + `guard-git.mjs`: editing a game's kit copy (`src/ui/kit/`, `src/devkit/`) · `F\d+:` code commits / merges into main outside /deliver (planning + docs commits stay fine) · a check piped into tail/grep/Select-Object · heredoc / `python -c` writing code with backslashes · `live-push.mjs`: an open P0 in BUGS.md blocks going live
- [x] 🤖 4. Sprint nudge — Stop: code committed this turn but SPRINT.md unchanged → "log it as a task"
- [x] 🤖 5. Credits check — framework `ui-kit` conformance (on `dev/conformance`): every art/sound file in `content/credits.json`, no 🔴, every 🟡 shown on the Credits screen
- [x] 🤖 6. Shrink the skills — delete the develop / deliver / save / ppp / bug lines that are now automatic, point to HOOKS.md
- [ ] 🤖 7. Prove it — test-hooks cases for every new hook + one real headless try each; HOOKS.md rows
Check: `node ~/.claude/config/bmuz/hooks/test-hooks.mjs` all green + the real tries quoted in Notes.
Ask Muzzy: —

## F74 🔧 Self-improving loop
Done when: a milestone's /deliver ends with a short look-back whose every item lands in a real file (hook, check, script, framework piece or checklist line); a Stop check catches a look-back that didn't happen; the first one (v0.9 so far) is written.
- [ ] 🤖 1. Look-back template — `~/.claude/config/bmuz/templates/lookback.md` + a step in `skills/deliver/SKILL.md` (what went wrong · what got repeated · what one game built that others need → its home)
- [ ] 🤖 2. Look-back check — Stop: a milestone /deliver turn without a look-back file, or an item without a home that exists → sent back
- [ ] 🤖 3. First run — look-back on v0.9 so far → `.planning/archive/lookbacks/v0.9.md`, each item landed
- [ ] 🙋 4. Muzzy reads the first look-back: did it catch what matters to you?
Check: test-hooks cases for the look-back check + the v0.9 look-back's items all point at real files.
Ask Muzzy: —

Notes:
- Decided (technical): "no feature code on main" counts code files only — planning/doc commits on main stay fine (as today). Muzzy's tiny-fix rule still holds: a commit without an `F\d+:` prefix isn't blocked.
- F67 task 1: the reader moved to `templates/ppp/plan-reader.mjs` (build-ppp draws byte-identical pages for all 6 projects). The hook only reports problems that are NEW since the last commit, so old history doesn't nag; `node ~/.claude/config/bmuz/hooks/plan-lint.mjs <project>` lists everything. First sweep found real ones elsewhere (left for those sessions): Glyphtender F31–F36 + F46 needs hidden by a later " — " (planner shows no needs), B026 used twice, B024 verified but under Open, Open count off; Goops F02b/F15 done but need F02 (Discover), F27 ❓ with 4 tasks; Roll Better 7 fixed bugs under Open, Log 22 entries; framework F61 done while F59/F60 still building (Goops session's). Fixed here: framework F23's needs were hidden the same way.
- F67 task 3: `hooks/guard-edits.mjs` (kit copies by VERSION file · piped checks unless `set -o pipefail` · heredoc/python/node writing code with a backslash) + guard-git (an `F08:` commit with code on main, merging a work branch into main unless /deliver ran this session) + live-push (open P0). "Files in this commit" moved into lib.mjs (`commitFiles`) for both commit hooks. Live tries: a piped test run in this session was refused; I wrote two hook edits through Python heredocs earlier this task — exactly what the new rule now refuses.
- F67 task 4: `hooks/stop-plan-check.mjs` also sends Claude back when plan-lint rebuilt the planner page but it was not republished (STATE "Planner (PPP):" link; republish marker in .git). The turn reader moved to lib.mjs (`readTurn`), shared with handoff-check.
- F67 task 5: UI kit 0.19.0 on dev/conformance (e832699): credits check, static, runs first in the UI kit checks; PROJECT-FILES now says own work is listed too (🟢 "own work"). Real try, read-only: Glyphtender all green (173 files); Goops 26 own-art files unlisted, 2 fonts marked 🔴 still in public/, no code reads credits.json; Roll Better favicon + 2 app icons unlisted — for those sessions.
