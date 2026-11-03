# Sprint 51 — Releases that don't need babysitting
Started 2026-11-03 · Milestone v0.33 Releases that don't need babysitting · Features: F172, F173, F174, F175 (in this order)
Muzzy 2026-11-03: "1. releases that don't need babysitting 2. yes. update config" — Claude runs /update-config; Muzzy approves the settings prompt.
What changes: /deliver stops sending the turn back for a planner publish made from another chat or a release waiting on Muzzy's deploy; crash maps build and check themselves; a test-only commit keeps its security review; check:fast warns about a slow test with no time limit. What stays the same: every game, every module, the live sites — BMUZ tooling only.

## F172 🔧 Planner publish recognised from any chat
Done when: a planner published from a scratchpad copy (artifacts connector, any chat) counts for stop-plan-check — the hook no longer asks again for a page the server says is unchanged; a test red on today's hook first.
- [x] 🙋 1. Let Claude edit the BMUZ hooks and scripts in auto mode — ~/.claude/settings.json (2026-11-03: auto mode refused Claude's own /update-config edit as self-modification; Muzzy pasted a `!` node line adding 3 Edit allow rules + an autoMode.allow line; a test write in hooks/ passed)
- [x] 🤖 2. Read how the hook decides "published" today (.git/bmuz-ppp-published, Artifact tool only) and write a test for a publish_files / publish_version publish — red first — ~/.claude/config/bmuz/hooks/test-hooks.mjs
- [x] 🤖 3. Count a publish to the project's planner slug however it was sent (incl. a scratchpad copy, incl. "unchanged") — ~/.claude/config/bmuz/hooks/stop-plan-check.mjs
- [x] 🤖 4. Tests green; HOOKS.md line; synced to ~/.claude-config — ~/.claude/config/bmuz/HOOKS.md
Check: the new test red then green; test-hooks all green.
Checked: 2026-11-03 — 3 new stop-plan-check tests: 2 red on the old hook (scratchpad copy with the same bytes, publish_version content — both "block"; the stale copy already blocked) → green after the fix; whole test-hooks 617/617. Matched by bytes, not by slug: the planner link (claude.ai/artifact/<short id>) and publish_files' slug (a UUID) are different ids, and the bytes also prove the copy isn't stale. Synced to ~/.claude-config 7f9aa8c + 79ea0b3.

## F173 🔧 Release waits on Muzzy's deploy
Done when: a release whose live check waits on Muzzy (a deploy only he can run) hands back once with that to-do instead of being sent back every turn; it still refuses once the push has happened and no live check ran.
- [ ] 🤖 1. Test: a release tag, no push yet, a hand-off naming Muzzy's deploy → no send-back; pushed + no live-pass → still sent back — red first — ~/.claude/config/bmuz/hooks/test-hooks.mjs
- [ ] 🤖 2. stop-plan-check rule 8 reads "pushed yet?" (origin has the tag) before asking for live-pass — ~/.claude/config/bmuz/hooks/stop-plan-check.mjs
- [ ] 🤖 3. Tests green; the deliver skill's §5 line says so — ~/.claude/skills/deliver/SKILL.md
Check: the new tests red then green; test-hooks all green.

## F174 🔧 Crash maps by the release script
Done when: after the release commit, one script step builds releases/<v>/maps with the deploy workflow's env (read from .github/workflows/deploy.yml), checks its main-*.js.map name matches the live page's assets/main-*.js, and check builds leave no untracked maps behind; tried on Glyphtender.
- [ ] 🤖 1. Measure today: which builds write maps where (check:fast, check:full, e2e:update, the release build) on Glyphtender — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 2. Build the maps with deploy.yml's env after the release commit, commit them with it — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 3. live-check.mjs compares the maps' main-*.js.map with the live page's main-*.js — ~/.claude/config/bmuz/scripts/live-check.mjs
- [ ] 🤖 4. Check builds put their maps aside (or clean them) so nothing stray is left — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 5. Tests + a dry run on Glyphtender — ~/.claude/config/bmuz/scripts/test-scripts.mjs
Check: test-scripts green; Glyphtender dry run builds matching maps and leaves git status clean.

## F175 🔧 Test-only commits + slow tests
Done when: a commit that only changes test files (*.test.*, e2e/) since `Security reviewed:` doesn't reopen the security gate (the code review and full check still do); check:fast prints a warning for a test that took over ~2 s with no time limit of its own.
- [ ] 🤖 1. Measure today: replay Glyphtender's fc44068 against release.mjs's gates — which ones it reopened — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 2. Security gate skips test-file-only commits (named in the dry run) — test red first — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 3. check-all's unit-test step lists tests over ~2 s without their own timeout (vitest JSON report) — starters/turn-based/scripts/check-all.mjs
- [ ] 🤖 4. Starter check + Glyphtender's check:fast run it; the 2-s line in content if it's a knob — starters/turn-based/scripts/check-all.mjs
- [ ] 🤖 5. Tests green; root check:fast green — ~/.claude/config/bmuz/scripts/test-scripts.mjs
Check: new tests red then green; root check:fast; the starter check.

## Notes
- Lesson (2026-11-03 13:17:59): another session's start-up re-copied ~/.claude-config over ~/.claude mid-task and WIPED the F172 hook fix + tests (the 614-pass run had read the old files). Rule for this sprint: copy each ~/.claude edit into ~/.claude-config and push right after it lands, before running tests; then grep the live file once more. Fix for good → ROADMAP Ideas 2026-11-03 "setup.sh overwrites newer local edits".
- Lesson (2026-11-03): auto mode never lets Claude widen its own permissions (settings.json edits are refused as self-modification, even with Muzzy's OK) — the way is a one-line `!` command Muzzy pastes himself. The other machine needs the same paste (settings.json is synced by config-sync — check after the next /sync).
- Open bugs: none open in the framework.
- Claude's call (2026-11-03): F175's gate change is security only — a test-only commit can still break a game, so the code review and the full check still reopen.
