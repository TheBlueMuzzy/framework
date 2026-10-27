# Sprint 48 — Steadier checks
Started 2026-10-27 · Milestone v0.30 Steadier checks · Features: F158, F159, F160, F161 (in this order)
Muzzy 2026-10-27 (/roadmap): "do A and be in auto mode. I won't be around to confirm anything. and they seem like easy adds." — A = the CI browser cache + the shared version helper + the starter's Escape mark; "easy adds" read as yes to the fake-language leftovers too (Claude's call, unattended).
What changes: GitHub's checks keep their test browsers between runs; every module installer prints the same version line from one shared helper; the starter after Results + Escape looks clean; the kit's fake-language run has fewer leftovers. What stays the same: how every game plays and looks; what install-module copies into a game; the VERSION line a game gets. Not in this sprint: games taking the updates (hand-offs go to ROADMAP Ideas), /deliver (waits for Muzzy).

## F158 🔧 Keep test browsers on GitHub
Done when: a second GitHub run on the same Playwright version takes its browsers from the cache (the log shows the cache restored and no browser download) and every job is green.
- [x] 🤖 1. Measure first: the last GitHub runs' browser-step times per job (gh run view), and the Playwright versions each module and the starter pin — .github/workflows/checks.yml
- [x] 🤖 2. Module jobs: actions/cache on ~/.cache/ms-playwright keyed on the module's Playwright version + its engines; the install step then only fetches system packages — .github/workflows/checks.yml
- [x] 🤖 3. The starter job: the same cache keyed on its pinned playwright-core version — .github/workflows/checks.yml
- [x] 🤖 4. Prove it: push the work branch twice, read both runs (first fills, second restores), note the step times — .github/workflows/checks.yml
- [x] 🤖 5. (Muzzy, mid-sprint: "full auto mode") guard-git refuses a checkout that drops uncommitted work and names the stash instead of asking, so unattended runs never stop on it — ~/.claude/config/bmuz/hooks/guard-git.mjs
Check: the second run's log says the cache was restored and the browser step skips the download; all jobs green; step times before → after in Notes.
Checked: 2026-10-27 (Claude) run 40603953184 (fills): all green, caches saved (chromium 291 MB, three engines 584 MB). Run 40604407850 (restores): all green; "Cache restored from key: test-browsers-Linux-pw1.63.0-…" on devkit, ui-kit, saves and the starter; "Kept from an earlier run: 189 Linux packages" (saves), 9 (chromium jobs). Browser step before → after: starter 8.6 min → 14 s, saves 36 s–15 min timeout → 27 s, devkit / ui-kit ~20 s → 15 s.

## F159 🧱 One shared version helper
Done when: scripts/kitVersion.mjs is the only place an installer asks git for the version, every installer prints the same line as before, git is asked once per folder per run, and a framework check refuses an installer that asks git itself.
- [x] 🤖 1. The helper: kitVersion(moduleDir, { watch: ['kit'] }) → { version, commit }, read once per folder per run, with tests (no git folder, uncommitted changes, asked once) — scripts/kitVersion.mjs
- [x] 🤖 2. Every installer uses it (ai, audio, crashes, devkit, emotes, lint, rooms, saves, table, ui-kit, version), each keeping the folders it watches today — ui-kit/scripts/install-kit.mjs
- [x] 🤖 3. The guard: a framework test fails when an installer has its own `git rev-parse` / `git status`; check:fast runs the root tests — scripts/check-modules.mjs
- [x] 🤖 4. Each module's installer tests green; VERSION bumps (patch) where the installer changed; root check:fast green — scripts/kitVersion.test.mjs
Check: the helper's tests (once-only proven by counting calls); the guard red on a planted `git rev-parse` in an installer, then green; every module's tests green; root check:fast green.
Checked:

## F160 🐞 Starter Escape after Results
Done when: after Results, Escape on the starter shows no faint board mark and no stray focus ring — or the measure shows what really happens now — and a starter check keeps it that way.
- [ ] 🤖 1. Measure on today's code: play the starter to Results, press Escape, screenshot + read the page; say what really happens now — starters/turn-based/e2e/screens.mjs
- [ ] 🤖 2. Find the root cause (starter or UI kit); a kit cause is fixed in ui-kit first, then reinstalled into the starter — starters/turn-based/src/App.tsx
- [ ] 🤖 3. A check that fails on the old behaviour and passes on the fix — starters/turn-based/e2e/screens.mjs
- [ ] 🤖 4. The starter's check:full green; root check:fast green — starters/turn-based/package.json
Check: the new check red on today's code, green after the fix; screenshot before → after looked at; the starter's check:full green.
Checked:

## F161 ✨ Fake-language leftovers
Done when: a full `npm run shoot:pseudo` has every find fixed or listed in knownShots with a reason, and a player's name in an aria-label is never rewritten.
- [ ] 🤖 1. Measure first: a full shoot:pseudo on today's kit; group the finds by cause (edge / ring / small / grows) in Notes — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. A player's name in an aria-label (PlayerChip, seat buttons) stays as written in the fake language, with a test — ui-kit/kit/blocks/hud.tsx
- [ ] 🤖 3. "grows": the Neon player chip measures again after the fake language rewrites — ui-kit/kit/blocks/hud.tsx
- [ ] 🤖 4. "edge": the shared cause(s) of words touching their box fixed in the kit's CSS — ui-kit/kit/kit.css
- [ ] 🤖 5. "ring" + "small": fixed, or a knownShots line with the reason (the 16px invisible title box isn't a control) — ui-kit/scripts/shoot.mjs
- [ ] 🤖 6. UI kit VERSION (patch/minor), README line; the kit's tests + a full shoot (normal and pseudo) green; the starter takes it, check:full green — ui-kit/kit/VERSION
Check: find counts before → after per kind in Notes; the aria-label test red then green; full shoot + shoot:pseudo green; the kit's tests; the starter's check:full green.
Checked:

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Starting point (2026-10-27, grep): 11 installers each carry the same readKitVersion (version + lint memoise it; the other 9 ask git on every call); the folders watched differ (kit · kit scripts · kit templates · kit vite devkit-game).
- F158 — task 1 (2026-10-27, gh run view): the slow part is NOT the browsers — it's the Linux packages `--with-deps` fetches from azure.archive.ubuntu.com. Run 40572346582 (green): starter's Chromium step 8.6 min ("Fetched 13.3 MB in 8min 19s (26.6 kB/s)"), saves 36 s. Runs 40567791524 + 40574075274: saves timed out at 15 min both times, stuck mid-apt (libavcodec60, libyuv0). Every Playwright pin is 1.63.0 (ui-kit, devkit, saves, starter). So a browser-only cache (the idea as written) would not have helped → the plan changed: keep the .deb files too.
- F158 — tasks 2–3: one shared step, .github/actions/test-browsers/action.yml (restore → apt keeps its files + 30 s timeout × 3 retries → install → save on a miss), keyed on the Playwright version + engines; module jobs and the starter job both use it (2ab2d87).
- Also seen: main's v0.31.0 live-pass run had the starter's online check time out on a click once (locator.click 30 s); the same code was green on the work branch at 19:48 — re-run started to tell a one-off from a real problem.
- F159 — tasks 1–4 by a fresh helper (fdd0cf3..d1336b2, merged 69f5a55): scripts/kitVersion.mjs + 3 tests; all 11 installers call it with their own watch lists; scripts/installers.test.mjs refuses an installer with its own git call (red on a planted line in install-table.mjs, then green); check:fast runs "framework scripts test"; 11 patch bumps (ai 0.8.3, audio 0.4.2, crashes 0.2.2, devkit 0.28.1, emotes 0.4.2, lint 0.3.1, rooms 0.13.1, saves 0.6.6, table 0.8.2, ui-kit 0.37.1, version 0.1.3). Its check:fast 24/24. Surprise: all 11 already remembered the answer (F128) — the gain is one copy + the guard. A scratch compare showed the same version line from all 11, old vs new.
- Mid-sprint (Muzzy 2026-10-27, a screenshot of guard-git's "Do you want to proceed?" on the F159 helper's undo of its planted line): "i want you to be in full auto mode, but these kinds of messages are still showing up." → guard-git now REFUSES a checkout / restore that drops uncommitted work and names `git stash push -m "<why>" -- <files>` instead (same effect, keeps a copy), so an unattended run never stops on that prompt; ~/.claude hooks tests 607/607; HOOKS.md row 17 + the /develop "proving a test can fail" line updated.
