# Sprint 56 — Start the rebuild: hooks that never go quiet, a lighter framework
Started 2026-11-04 · Milestone v0.37 · Features: F184, F186

## F184 🧱 Hook rule runner
Done when: every BMUZ hook rule lives in its own small file run by one shared runner; a rule that breaks is reported loudly and the other rules still run; the commit checks run inside git's own commit step in each BMUZ project; HOOKS.md's table is made from the rule files — and every hook behaves exactly as before (no rule changes yet — those are F185 — Slimmed rule set).
- [x] 🤖 1. Runner + the rule-file shape (id · event · what · why · on/off · tests); a crashing rule or a broken shared file says so loudly, never silently allows everything — tests red first — ~/.claude/config/bmuz/hooks/runner.mjs
- [x] 🤖 2. Before-action rules move into rule files (guard-edits, guard-git, commit-typecheck, live-push); the old hook files become one-line starters, settings.json unchanged — ~/.claude/config/bmuz/hooks/guard-git.mjs
- [x] 🤖 3. After-edit rules move (lint-edit, check-ui-edit, rule-kind, sketch-lint, plan-lint) — ~/.claude/config/bmuz/hooks/plan-lint.mjs
- [x] 🤖 4. Turn-end and moment rules move (handoff-check, stop-plan-check, stop-check-fast, stop-unsaved, session-moments) — ~/.claude/config/bmuz/hooks/handoff-check.mjs
- [x] 🤖 5. Commit checks also run in git's own commit step, set per BMUZ project (never globally — collabs aren't touched) by save.mjs; refuse `--no-verify` — ~/.claude/config/bmuz/scripts/save.mjs
- [x] 🤖 6. HOOKS.md's rule table generated from the rule files; firing log lines carry the rule id — ~/.claude/config/bmuz/HOOKS.md
- [x] 🤖 7. Whole hook + script suites green with their old tests unchanged; push to ~/.claude-config — ~/.claude/config/bmuz/hooks/test-hooks.mjs
Check: the old test suites pass unchanged (same answers, same wording); a rule made to throw on purpose gives a loud message while the others still fire; a commit with a type error is refused by git itself in a BMUZ project and untouched in a non-BMUZ repo.
Checked: 2026-11-04 23:05 — built by a fresh helper in a scratch copy, swapped in live 12:48; live suites hooks 685/0 + scripts 396/0 (13:00). Claude read runner.mjs, fallback/broken.mjs (a guard that can't load refuses before a tool call; repairs to ~/.claude/config/bmuz still allowed), save.mjs core.hooksPath (--local only; a repo with its own hooks is left alone; never --global). 109 rule files; HOOKS.md table generated (hooks-doc --check OK). Pushed ~/.claude-config 1449bdc. Added the same night (Muzzy: "is there a way to ensure that doesn't happen going forward?"): HC10 — a waiting progress line needs a wake-up running (8 new tests; hooks 692/0, scripts 396/0) + develop skill line marked ②, pushed 2207bf2. The helper itself sat idle ~10 h waiting on a test notice before pushing — the reason for HC10. Approved by Muzzy 2026-11-04.

## F186 🔧 Slimmed framework
Done when: the cuts Muzzy approved in the framework audit (`research/audit-2026-11/framework.md` §7) are done — no game loses anything it uses, every check stays green, and the README tells the truth.
- [x] 🤖 1. The starter keeps only its own game; its modules are installed fresh when it's copied or checked (no committed module copies) — starters/turn-based/README.md
- [x] 🤖 2. Emotes archived (a git tag keeps it) with the UI kit's emote parts and the AI's banter; the starter unwired (tag archive/emotes-0.4.2) — README.md
- [x] 🤖 3. Saves slimmed to what Glyphtender calls (leaderboards, link-code cloud, replay, any-platform storage, save health archived — check cloudRoutes / saveCode against Glyphtender first) — saves/README.md
- [x] 🤖 4. Screenshot runs shoot the styles games use; all seven only before a UI kit release; WhatsNew archived — ui-kit/scripts/shoot.mjs
- [x] 🤖 5. README: every module, proven by · used by · frozen marks, no version history in the table — README.md
- [x] 🤖 6. Framework check:fast + the starter's check:full green; tracked lines before/after counted — scripts/starter-check.mjs
Check: check:fast green; starter check:full green; no file in any game changed; tracked lines down by about the audit's estimate (~46k).
Checked: 2026-11-04 12:43 — by a fresh helper (a5ad333..0913562), checked by Claude: tracked lines 164,892 → 111,942 (−29 %), files 1,309 → 909 (recounted); framework check:fast 22/22 (Claude's own run, 12:43); starter check:full 10/10 and the routine shoot 569 shots / 0 problems (helper). No game folder changed. Archived under local tags archive/emotes-0.4.2, archive/saves-0.7.0, archive/whats-new. Kept on purpose: the screen-reader announcer (Goops uses it), AI chattiness (Glyphtender sets it), Rooms' emote relay (frozen, optional). Versions: UI kit 0.41.0, AI 0.9.0, Saves 0.8.0. BMUZ text still to update: sprint skill step 5 (npm run install-modules), install-module/lib emotes lists, game-ui shoot:all before a kit release. Approved by Muzzy 2026-11-04.

## Notes
- Open bugs: none open in the framework (BUGS.md has no open P0/P1).
- Muzzy 2026-11-04: "remember, i don't really understand this level of technical decisions" — Claude makes the engineering calls and logs them here; questions to Muzzy only about what he sees, plays or wants (hand-off template, ~/.claude-config ded89a6).
- Claude's call (F184): move first, change later. F184 only moves rules into files with their tests unchanged; the false-alarm fixes (≈1,000 loops) are F185 — Slimmed rule set, so if anything breaks we know which step did it.
- Claude's call (F184): the old hook files stay as one-line starters so settings.json (Muzzy's file) doesn't change; joining them into one runner per event can come later.
- Claude's call (F186): the extraction queue stays until F188 — Module recipe decides its fate (audit §9). Games keep their own copies, so archiving a module never touches a game.
- Claude's call: two helpers side by side — F184 works in ~/.claude, F186 in the framework repo, so they never touch the same files.
