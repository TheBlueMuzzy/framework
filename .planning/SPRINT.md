# Sprint 51 — Releases that don't need babysitting
Started 2026-11-03 · Milestone v0.33 Releases that don't need babysitting · Features: F172, F176, F173, F174, F175 (in this order — F176 added 2026-11-03, Muzzy "yes", built second so the rest of the sprint's ~/.claude edits can't be wiped)
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

## F176 🐞 Sync keeps unpushed edits
Done when: setup.sh (the copy /sync runs) never overwrites a ~/.claude file that was changed here since the last sync — it keeps it and names it ("kept your newer copy of …; push it with /save"); files only the other machine changed still come in; a test red on today's setup.sh first.
- [x] 🤖 1. Measure today: how /sync runs setup.sh, what .config-applied records, and a scratch run that loses a local edit — ~/.claude-config/setup.sh
- [x] 🤖 2. Test: a fake home + repo where one file changed here and another came from the other machine → today the local edit is lost (red) — ~/.claude/config/bmuz/scripts/test-config-sync.sh
- [x] 🤖 3. setup.sh keeps a file whose live copy differs from the repo's last-applied version (.config-applied), copies the rest, and lists what it kept — ~/.claude-config/setup.sh
- [x] 🤖 4. The /sync skill says what was kept and offers to push it — ~/.claude/skills/sync/SKILL.md
- [x] 🤖 5. Tests green; config-sync.md line; pushed — ~/.claude/references/config-sync.md
- [x] 🤖 6. Fix (found 2026-11-03 14:11, a real sync during F174): setup.sh reported 5 of claude.ai's own synced skills (skills/synced/…) as "changed on both machines" — it now skips config-sync's noise list, + a test (13/13); a real run after it kept nothing — ~/.claude-config/setup.sh (claude-config 4e23f8d)
Check: the new test red then green; test-config-sync all green; a real /sync dry run on this PC keeps nothing it shouldn't.
Checked: 2026-11-03 — measured: the wipe came from my own 13:15 settings push → another session saw "1 update" and ran /sync → setup.sh `cp -r` over ~/.claude (session start only nudges, it never copies). 5 new config-sync tests (two fake machines, the real setup.sh, plugins off): 3 red on the old setup.sh (local edit lost, not named, both-changed lost) → 12/12 green. Real runs on this PC: in sync → kept nothing (8.6 s); then with an unpushed config-sync.md edit → "Kept 1 file(s) … ~/.claude/references/config-sync.md", edit intact. Whole test-scripts 354/361: the 7 red are stop-servers 2 + port-preflight 5, red alone too, scripts untouched since 10-26 → added to the existing 2026-10-30 stop-servers Idea. Pushed: claude-config f4eea93, f7a54e3, ccc985e; status quiet after.

## F173 🔧 Release waits on Muzzy's deploy
Done when: a release whose live check waits on Muzzy (a deploy only he can run) hands back once with that to-do instead of being sent back every turn; it still refuses once the push has happened and no live check ran.
- [x] 🤖 1. Test: a release tag, no push yet, a hand-off naming Muzzy's deploy → no send-back; pushed + no live-pass → still sent back — red first — ~/.claude/config/bmuz/hooks/test-hooks.mjs
- [x] 🤖 2. stop-plan-check rule 8 reads "pushed yet?" (origin has the tag) before asking for live-pass — ~/.claude/config/bmuz/hooks/stop-plan-check.mjs
- [x] 🤖 3. Tests green; the deliver skill's §5 line says so — ~/.claude/skills/deliver/SKILL.md
Check: the new tests red then green; test-hooks all green.
Checked: 2026-11-03 — 4 new stop-plan-check tests: "tagged, not pushed, hand-back names the deploy → allowed" red on the old hook (the other 3 already right) → green; whole test-hooks 621/621. "Pushed?" = a remote-tracking branch holds the tag's commit (git for-each-ref --contains, local — no network in a Stop hook); "waits on Muzzy" = the last message says "deploy". Unpushed + silent now says "push, or say what it waits on". Synced: claude-config 9a6b667 (hook + tests), 6f4fd9d (/deliver §5); status quiet.

## F174 🔧 Crash maps by the release script
Done when: after the release commit, one script step builds releases/<v>/maps with the deploy workflow's env (read from .github/workflows/deploy.yml), checks its main-*.js.map name matches the live page's assets/main-*.js, and check builds leave no untracked maps behind; tried on Glyphtender.
- [x] 🤖 1. Measure today: which builds write maps where (check:fast, check:full, e2e:update, the release build) on Glyphtender — ~/.claude/config/bmuz/scripts/release.mjs
- [x] 🤖 2. Build the maps with deploy.yml's env after the release commit, commit them with it — ~/.claude/config/bmuz/scripts/release.mjs
- [x] 🤖 3. live-check.mjs compares the maps' main-*.js.map with the live page's main-*.js — ~/.claude/config/bmuz/scripts/live-check.mjs
- [x] 🤖 4. Check builds put their maps aside (or clean them) so nothing stray is left — crashes/kit/vitePlugin.mjs (crashes 0.3.0: only CRASHES_MAPS=release files under releases/; the rest go to node_modules/.cache/crashes-maps)
- [x] 🤖 5. Tests + a dry run on Glyphtender — ~/.claude/config/bmuz/scripts/test-scripts.mjs
Check: test-scripts green; Glyphtender dry run builds matching maps and leaves git status clean.
Checked: 2026-11-03 — measured: every vite build (check:fast's build, check:full's, e2e:update's x.99) filed maps under releases/<v>/maps → crashes 0.3.0: only CRASHES_MAPS=release does (new test red on 0.2.2 → green; crashes 166/166, typecheck clean). release.mjs: after the tagged release commit, `npm run build` with deploy.yml's VITE_ lines (secrets skipped) + NODE_ENV=production + CRASHES_MAPS=release, commits releases/<v>.0/maps (release-crash-maps 5/5 — written with the change, the old script had no such step). live-check: the live page's main-*.js must have its map (3 new cases, 25/25). Real data: Glyphtender's live page runs assets/main-C7nLTkkg.js and releases/0.14.0.0 holds that map; deployEnv reads VITE_PARTY_HOST=glyphtender.joebrogno.workers.dev. Whole test-scripts 362/369 (the 7 = the old stop-servers + port-preflight reds, Ideas). Framework check:fast 24/24 on a quiet PC (red twice before only under my parallel run — saves' firefox launch). Not tried end to end on a real release yet: Glyphtender needs `install-module.mjs crashes` (0.3.0) first — its next /deliver is the live proof.

## F175 🔧 Test-only commits + slow tests
Done when: a commit that only changes test files (*.test.*, e2e/) since `Security reviewed:` doesn't reopen the security gate (the code review and full check still do); check:fast prints a warning for a test that took over ~2 s with no time limit of its own.
- [x] 🤖 1. Measure today: replay Glyphtender's fc44068 against release.mjs's gates — which ones it reopened — ~/.claude/config/bmuz/scripts/release.mjs
- [x] 🤖 2. Security gate skips test-file-only commits (named in the dry run) — test red first — ~/.claude/config/bmuz/scripts/release.mjs
- [x] 🤖 3. check-all's unit-test step lists tests over ~1 s without their own timeout (a vitest reporter, scripts/slow-tests.mjs) — starters/turn-based/scripts/check-all.mjs
- [x] 🤖 4. Starter check + Glyphtender's tests run it; the line is a tooling constant (tuning-ok), not game content — starters/turn-based/scripts/check-all.mjs
- [x] 🤖 5. Tests green; root check:fast green — ~/.claude/config/bmuz/scripts/test-scripts.mjs
Check: new tests red then green; root check:fast; the starter check.
Checked: 2026-11-03 — fc44068 (one `{ timeout }` line) reopened all 3 gates. Now: a commit whose code files are all tests (*.test/spec.*, e2e/, tests/) stays inside "Security reviewed" (isTestFile in lib.mjs); code review + full check still reopen — release-gates test red → green (35/35). Slow tests: vitest reports a test's own limit as options.timeout and a test without one as the config default (probed: 5000 vs 60000), so a reporter flags "over the line + default limit"; check-all prints them as ⚠ after the result, never a fail; works with or without the reporter file (template + starter). Probe in the starter: the no-limit 2.2 s test flagged, the 60 s-limit one not. The line: 2 s first — but Glyphtender's save test takes 1.3 s here and went over 5 s on GitHub (~4×), so 2 s would have missed it → 1 s; on Glyphtender's 860 tests that flags 12 whole-game tests (bot golden games, sims, a 4-player server game, 1.1–1.7 s) — real risks of the same shape, not noise. Framework check:fast 24/24; release / gates / crash-maps / module-list / notes / live-check / save / config-sync suites 133/133. Glyphtender's own check-all not changed (a game repo): it gets the warning by copying templates/slow-tests.mjs + the 3 check-all lines — its next catch-up.

## Notes
- Lesson (2026-11-03 13:17:59): another session's start-up re-copied ~/.claude-config over ~/.claude mid-task and WIPED the F172 hook fix + tests (the 614-pass run had read the old files). Rule for this sprint: copy each ~/.claude edit into ~/.claude-config and push right after it lands, before running tests; then grep the live file once more. Fix for good → ROADMAP Ideas 2026-11-03 "setup.sh overwrites newer local edits".
- Lesson (2026-11-03): auto mode never lets Claude widen its own permissions (settings.json edits are refused as self-modification, even with Muzzy's OK) — the way is a one-line `!` command Muzzy pastes himself. The other machine needs the same paste (settings.json is synced by config-sync — check after the next /sync).
- Open bugs: none open in the framework.
- Claude's call (2026-11-03): F175's gate change is security only — a test-only commit can still break a game, so the code review and the full check still reopen.
