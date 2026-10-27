# Sprint 48 — Steadier checks
Started 2026-10-27 · Milestone v0.30 Steadier checks · Features: F158, F159, F160, F161 (in this order)
Muzzy 2026-10-27 (/roadmap): "do A and be in auto mode. I won't be around to confirm anything. and they seem like easy adds." — A = the CI browser cache + the shared version helper + the starter's Escape mark; "easy adds" read as yes to the fake-language leftovers too (Claude's call, unattended).
What changes: GitHub's checks keep their test browsers between runs; every module installer prints the same version line from one shared helper; the starter after Results + Escape looks clean; the kit's fake-language run has fewer leftovers. What stays the same: how every game plays and looks; what install-module copies into a game; the VERSION line a game gets. Not in this sprint: games taking the updates (hand-offs go to ROADMAP Ideas), /deliver (waits for Muzzy).

## F158 🔧 Keep test browsers on GitHub
Done when: a second GitHub run on the same Playwright version takes its browsers from the cache (the log shows the cache restored and no browser download) and every job is green.
- [ ] 🤖 1. Measure first: the last GitHub runs' browser-step times per job (gh run view), and the Playwright versions each module and the starter pin — .github/workflows/checks.yml
- [ ] 🤖 2. Module jobs: actions/cache on ~/.cache/ms-playwright keyed on the module's Playwright version + its engines; the install step then only fetches system packages — .github/workflows/checks.yml
- [ ] 🤖 3. The starter job: the same cache keyed on its pinned playwright-core version — .github/workflows/checks.yml
- [ ] 🤖 4. Prove it: push the work branch twice, read both runs (first fills, second restores), note the step times — .github/workflows/checks.yml
Check: the second run's log says the cache was restored and the browser step skips the download; all jobs green; step times before → after in Notes.
Checked:

## F159 🧱 One shared version helper
Done when: scripts/kitVersion.mjs is the only place an installer asks git for the version, every installer prints the same line as before, git is asked once per folder per run, and a framework check refuses an installer that asks git itself.
- [ ] 🤖 1. The helper: kitVersion(moduleDir, { watch: ['kit'] }) → { version, commit }, read once per folder per run, with tests (no git folder, uncommitted changes, asked once) — scripts/kitVersion.mjs
- [ ] 🤖 2. Every installer uses it (ai, audio, crashes, devkit, emotes, lint, rooms, saves, table, ui-kit, version), each keeping the folders it watches today — ui-kit/scripts/install-kit.mjs
- [ ] 🤖 3. The guard: a framework test fails when an installer has its own `git rev-parse` / `git status`; check:fast runs the root tests — scripts/check-modules.mjs
- [ ] 🤖 4. Each module's installer tests green; VERSION bumps (patch) where the installer changed; root check:fast green — scripts/kitVersion.test.mjs
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
