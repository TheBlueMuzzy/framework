# Sprint 51 — Releases that don't need babysitting
Started 2026-11-03 · Milestone v0.33 Releases that don't need babysitting · Features: F172, F173, F174, F175 (in this order)
Muzzy 2026-11-03: "1. releases that don't need babysitting 2. yes. update config" — Claude runs /update-config; Muzzy approves the settings prompt.
What changes: /deliver stops sending the turn back for a planner publish made from another chat or a release waiting on Muzzy's deploy; crash maps build and check themselves; a test-only commit keeps its security review; check:fast warns about a slow test with no time limit. What stays the same: every game, every module, the live sites — BMUZ tooling only.

## F172 🔧 Planner publish recognised from any chat
Done when: a planner published from a scratchpad copy (artifacts connector, any chat) counts for stop-plan-check — the hook no longer asks again for a page the server says is unchanged; a test red on today's hook first.
- [ ] 🙋 1. Approve the /update-config prompt so Claude may edit the BMUZ hooks and scripts (Claude runs it) — ~/.claude/settings.json
- [ ] 🤖 2. Read how the hook decides "published" today (.git/bmuz-ppp-published, Artifact tool only) and write a test for a publish_files / publish_version publish — red first — ~/.claude/config/bmuz/hooks/test-hooks.mjs
- [ ] 🤖 3. Count a publish to the project's planner slug however it was sent (incl. a scratchpad copy, incl. "unchanged") — ~/.claude/config/bmuz/hooks/stop-plan-check.mjs
- [ ] 🤖 4. Tests green; HOOKS.md line; synced to ~/.claude-config — ~/.claude/config/bmuz/HOOKS.md
Check: the new test red then green; test-hooks all green.

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
- Open bugs: none open in the framework.
- Claude's call (2026-11-03): F175's gate change is security only — a test-only commit can still break a game, so the code review and the full check still reopen.
