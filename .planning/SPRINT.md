# Sprint 50 — Smoother upgrades
Started 2026-10-30 · Milestone v0.32 Smoother upgrades · Features: F165, F166, F167, F168, F169 (in this order)
Muzzy 2026-10-30: "1. a. 2. a." — framework fixes first, then the Glyphtender catch-up; Glyphtender's bots stay silent (chattiness 0) and chatty bots wait for /define. Audio's mix-keeping fix added as F169 ("1. a"). Source: the Glyphtender catch-up rehearsal, .planning/research/2026-10-29-glyphtender-catchup.md.
What changes: the lint installer never breaks a game's eslint.config.js; saves adopt an old plain-text value; lint stops flagging rules helpers' refusal reasons; install-module prints the hand steps since a game's version and refuses a module that needs a newer Dev Kit; audio's --fix keeps the mix a game tuned by ear. What stays the same: how every game and the starter play; every look. Not in this sprint (next one, from the report): crashes source maps on every build + the build race, a fakeOnlineRoom helper, a kit settled() helper for e2e, the npm min-release-age warning, ai's chattiness prompt. /deliver waits for Muzzy.

## F165 🐞 Lint installer comma
Done when: install-lint on a config whose list has a `//` comment on an earlier line (Glyphtender's globalIgnores line) puts the comma after the list's last real code, a test red on today's code first.
- [x] 🤖 1. A test with Glyphtender's exact config shape (a trailing comment on an earlier line) — red on today's installer — lint/scripts/install-lint.test.mjs
- [x] 🤖 2. Find the last real code's position in the original text, not in the comment-stripped copy — lint/scripts/install-lint.mjs
- [x] 🤖 3. Lint kit VERSION + README line; lint tests + root check:fast green — lint/kit/VERSION
Check: the new test red then green; all install-lint tests; root check:fast.
Checked: 2026-10-30 — 3 new addRules tests red on the old installer (107/110; the Glyphtender one showed `re,actRefresh.configs.vite`) → 110/110 green after the fix (02bb4f3 red, 5659c5f fix); the real games/glyphtender/eslint.config.js run through addRules passes node --check, no `re,act`; root check:fast 24/24. Same pattern searched in every installer + conformance: none (the other comment strippers keep newlines and are used for line numbers or yes/no tests only).

## F166 🐞 Saves read old plain values
Done when: createSave's oldSave receives an old value that isn't JSON (Glyphtender's tutorial "done") as its raw text instead of reporting it damaged, and the starter test doesn't turn check:fast red before a game's first createSave; tests red first.
- [x] 🤖 1. Tests: a stored plain "done" reaches oldSave and is adopted; JSON values unchanged — red first — saves/kit/oldSaves.test.ts
- [x] 🤖 2. Text that doesn't parse goes to oldSave as a string (damaged only if oldSave returns null) — saves/kit/saves.ts
- [x] 🤖 3. The starter test skips with "no saves listed yet" until the game has a createSave (check:framework's Saves row is what stays red) — saves/templates/tests/saves/saves.test.ts (the starter the installer copies; not saves/kit/saves.test.ts)
- [x] 🤖 4. Saves kit VERSION + README line (oldSave takes raw text); saves tests + root check:fast green — saves/kit/VERSION
Check: new tests red then green; saves tests; root check:fast.
Checked: 2026-10-30 — 6 new plain-text tests: 3 red on the old code (15/18 — "done" loaded as fresh, no ~1 backup of it, a golden text value double-wrapped) → 18/18 after the fix (42dd2fb red, c32e8bf fix); savesInCode test red (TypeError: not a function, 18/19 — not committed red: the commit hook refuses a type error) → 19/19 (f96a4da). Scratch game from install-saves: no createSave → the starter test 1 skipped, exit 0 (the old one failed); a createSave not listed → red "…— made in ../../src/game/save.ts". Saves 283/283, tsc clean; root check:fast 24/24 (incl. the starter with fresh modules); starters/turn-based check:full 10/10 (1.3 min).

## F167 🐞 Lint knows rule messages
Done when: no-player-text doesn't flag the refusal reasons a rules check returns through helpers (checkDraft / checkFor / checkAction…), a test red first, and the Glyphtender scratch copy's ~23 refusal-reason finds go to 0 while its ~8 real ones stay.
- [x] 🤖 1. Tests: a rules check split into check* helpers that return string | null — red first; a non-check function's words still flagged — lint/kit/rules.test.mjs
- [x] 🤖 2. Exempt functions named check* (and what the rules' check calls) — lint/kit/rules.mjs
- [x] 🤖 3. Run lint on ~/Documents/dev/.scratch/glyphtender-catchup (read-only): finds before → after in Notes — lint/kit/rules.mjs
- [x] 🤖 4. Lint kit VERSION + README line; lint tests + root check:fast green — lint/kit/VERSION
Check: new tests red then green; the scratch copy's refusal-reason finds 23 → 0, real finds kept; root check:fast.
Checked: 2026-10-30 — 6 new "not flagged" tests red on the old rule (115/121), 5 new "still flagged" (checkout, checkedLabel, noProblemsHere, a callback inside checkTurn, SPROUT's reason) green on both → 121/121 after the fix (04183ad red, 85217fe fix); Glyphtender scratch copy no-player-text 31 → 9 (22 refusal reasons / self-check lines → 0; the 8 real ones + SPROUT stay; no-tuning-numbers 20 → 20 unchanged), scratch clone left clean; root check:fast 24/24.

## F168 🔧 Upgrade notes + install order
Done when: each module has an UPGRADES.md of hand steps by version (LOOK CHANGE marked), install-module prints the steps between the game's version and the new one, and refuses (with the fix) a module whose checks need a newer Dev Kit than the game has; tests cover both.
- [x] 🤖 1. Each module's UPGRADES.md (beside its README, not in kit/ — installers copy kit/ into games): "<version>: <hand step>" lines, filled from the Glyphtender report + the root CHANGELOG (audio 0.4.0 --fix, ai 0.5.0 chattiness, rooms OnlineRoom fields, ui-kit taller chips = LOOK CHANGE…) — audio/kit/VERSION
- [x] 🤖 2. Tests red first: steps since the game's version are printed; a module needing Dev Kit ≥ X refuses on an older Dev Kit with "update devkit first" — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [x] 🤖 3. Build both in install-module (a module says its minimum Dev Kit in its UPGRADES.md) — ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 4. Dry run against a fresh read-only clone of the real Glyphtender (its ORIGINAL versions) prints the right steps and refuses ai before devkit; script tests + root check:fast green — ~/.claude/config/bmuz/scripts/install-module.mjs
Check: new tests red then green; the dry run's output matches the report's hand fixes; all script tests; root check:fast.
Checked: 2026-10-30 (partial — task 4's check:fast not green yet) — install-module suite: 10 new tests, 6 red on the old script (29/35) → 35/35 after the build; all script tests 348/356, the 8 red are stop-servers / port-preflight (this PC's port lookup, the report's stop-servers problem — untouched here); framework scripts/upgrades.test.mjs 2/2 (proven red on a step newer than kit/VERSION); Glyphtender clone dry runs: ai refused "update devkit first", devkit 0 steps, rooms 6, audio 1, ui-kit 11 (computed — its own tests timed out 3× under load). Root check:fast 13/24 twice: all 11 red rows are timeouts (CPU ~86% from Goops' vite + economy-sim sessions); one at a time 9 modules green, ui-kit 920/924 + saves 281/283 red only on browser timeouts. No module code changed (only <module>/UPGRADES.md + a scripts test) — re-run check:fast when the machine is quiet.

## F169 🐞 Audio keeps the tuned mix
Done when: `audio:check --fix` evens a file's loudness and moves the difference into that sound's volumeDb in content/audio.json, so what the player hears stays the same; a game with no volumeDb behaves as today; tests red first.
- [ ] 🤖 1. Tests: a sound with volumeDb −3 that's 6 dB too loud → file evened, its volumeDb raised by the same 6 dB, heard loudness unchanged — red first — audio/kit/audio-check.test.mjs
- [ ] 🤖 2. --fix writes the offset into content/audio.json (keeping its layout) and says what it moved — audio/kit/audio-check.mjs
- [ ] 🤖 3. The check measures heard loudness (file + volumeDb) where a game set one, so a balanced-by-ear mix isn't flagged — audio/kit/loudness.mjs
- [ ] 🤖 4. Audio kit VERSION + README + UPGRADES line; audio tests + root check:fast + the starter's check:full green — audio/kit/VERSION
Check: new tests red then green; on the Glyphtender scratch copy the heard levels before/after --fix match within 0.5 dB; root check:fast; starter check:full.
Checked:

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Work branch: dev/v0-32-smoother-upgrades.
- F166 — Saves read old plain values, the other places that read stored text (decided):
  - readCopy (load, peek, the slide-into-backup check, newerVersionStored) — changed: text that isn't JSON → oldSave gets the text; no oldSave or null/throw → damaged in the same words as before ("not JSON"). One door, so all four follow.
  - A plain old value is now a GOOD copy: the first save after it slides it into ~1 (the old "done" kept as a backup, as for any good copy).
  - checkRecord / interpret(raw) for save codes (saveCode.ts) — unchanged: a code is always JSON made by exportRecord (records only); a code that doesn't parse is refused before checkRecord. A parsed string in a code already reached oldSave.
  - cloud (cloudRoutes.ts) — unchanged: it carries save codes as JSON, never a stored value.
  - savedAtOf / exportRecord's newer copy — unchanged: a plain value has no savedAt ('' is right) and can't be "newer" (only a record has a version).
  - checkGoldenSave (oldSaves.ts) — changed: a string `stored` goes into storage as that exact text (was JSON.stringify'd, so "done" became "\"done\"" and never tested the real plain-text path); objects as before. No golden save in the framework or starter has a string `stored`.
  - FORMAT.md step 2 (the any-language format) says the same, so the Unity port does it too.
- F166: the "no saves yet" skip needs the game's code: the starter test raw-imports src/**/*.{ts,tsx} (not src/saves/, not tests) and asks savesInCode (oldSaves.ts — the same createSave/createRun call conformance.mjs findSaves looks for; a small copy, since the test is TS and conformance is .mjs). check:framework already skips its save rows before the first createSave; its direct-storage row is what stays red for a game still writing localStorage itself (Glyphtender today).
- F166: the starter's own src/saves stays at 0.6.5 (its module copies move at milestones — F156; check:fast's "starter (fresh modules)" ran it on 0.7.0, green). Its own tests/saves/saves.test.ts lists its saves, so the skip never applies there. A game that already has the test copies the new top part by hand (README 0.7.0 line).
- F166: no oldSave example in ~/.claude config/skills or the installer's hints; README Hooking-it-up + Golden saves + saves.ts's doc comment now show the plain-text case.
- F167 — Lint knows rule messages, the rule (decided): a function whose name IS `check…` (`/^check(?![a-z])/`: check, checkTurn, checkFor — not checkout / checkedLabel) or ends in `…Problem(s)` (railsProblems, jsonProblem) — its own strings aren't player words. By name only, not "returns string | null" (a .ts type isn't in plain JS, and every Glyphtender helper is already named check…) and not "reached from the rules' check" (a call graph across files is a lot of rule for 0 extra finds). A callback inside one is still judged by its own name, as for check before.
- F167: Glyphtender scratch copy, no-player-text before → after (lint 0.3.2 → 0.4.0, run by copying rules.mjs into the clone's src/lint and restoring it; git status clean after):
  - engine/turn.ts 9 → 0 (checkTurn) · engine/refresh.ts 3 → 0 (checkRefresh) · engine/draft.ts 2 → 0 (checkDraft) · engine/rules.ts 2 → 0 (checkFor)
  - tutorial/railsCheck.ts 6 → 0 (railsProblems — the tutorial's self-check, rails.test.ts wants it empty; dev words, not player words)
  - tutorial/railsSteps.ts 1 → 1 — KEPT on purpose: `SPROUT = { reason: 'Sprout is playing its scripted turn' }` is a rails refusal the referee shows the player (railsRefuses → store/referee.ts), and every other rails reason there already comes from en.json via `reason(key)` — a real find, so the "~23" was 22 + this one
  - stay (8 real): ai/arena.ts:152 report title, ai/decisions.ts:113 "CALL IT", Board.tsx:176 aria-label Garden, GameScreen.tsx:159 aria-label, SeedTray.tsx:147 label Seeds, HelpLayer.tsx:213 + 217 label Tip, TutorialLayer.tsx:73 label Tutorial
  - total 31 → 9; no-tuning-numbers 20 → 20, exhaustive-deps 1 → 1 (nothing else moved)
- F167 review (Claude): the name rule also exempts any function ending in Problem(s) — a game function like showProblem() that builds player words would be skipped too. None in our games today; tighten if one appears.
- F168 — Upgrade notes + install order, decided:
  - Where: `<module>/UPGRADES.md` beside its README, not kit/ — every installer copies kit/ into the game. Format: `- <version>: <step>` newest first (several lines per version allowed), `LOOK CHANGE —` at the start where sizes/looks change, `Needs Dev Kit: <x.y.z>` once. Modules with nothing to do say "No hand steps so far".
  - The game's version = the first x.y.z in its first module folder's VERSION (src/ai/kit/VERSION…). Printed: steps newer than the game's version, up to the new one; none for a first install or when current.
  - Needs Dev Kit: refused (dry run too) when the game's Dev Kit is older; a game with NO Dev Kit is warned, not refused (no runner = nothing to crash; step 5 already says "install the Dev Kit"). A framework without UPGRADES.md installs as before.
  - Real minimum for `t.warn`: Dev Kit 0.21.0 (d93b985, F103 — 0.20.5 had none), not 0.28 as the report guessed. ai and lint say it (the only modules besides devkit whose checks call t.warn; every other runner call is in 0.19.0's runner).
  - ai's "chattiness means banter" check came in ai 0.4.0 (ff7aae1, F22 — VERSION 0.4.0 there; the CHANGELOG groups it under 0.5.0), so the line is 0.4.0.
  - The audio 0.4.0 line ends "(F169 will change --fix… this line is updated then)" for F169.
  - install-module's usage line still doesn't list lint (it installs through the "new module" path) — left; the report's point.
- F168 dry runs on a fresh clone of Glyphtender (eb032a7: ai 0.2.1, audio 0.3.1, devkit 0.20.2, rooms 0.7.0, ui-kit 0.20.1), vs the report's hand fixes:
  - ai → `✗ ai 0.8.3's checks need Dev Kit 0.21.0 or newer — the game has Dev Kit 0.20.2, so nothing was installed → update devkit first: node ~/.claude/config/bmuz/scripts/install-module.mjs devkit .` = the report's runner crash, now refused before it happens. After the Dev Kit, its 0.4.0 chattiness step = the report's TEMP chattiness 0.
  - devkit → no steps = report 0 hand fixes.
  - rooms 0.7.0 → 0.13.1, 6 steps: 0.13.0 roomsPort · 0.12.0 sendEmote in a fake room · 0.10.0 keep a match (storage, onRestore, keepMatchDays) · 0.9.0 matchEnded/cameBack/clearCameBack in a fake room · 0.9.0 Rejoin match · 0.8.0 /health = the report's 3 hand fixes (4 fields, roomsPort, /health) + its 3 "work left" items. The installer's own 7 steps print as before.
  - audio 0.3.1 → 0.4.2, 1 step: 0.4.0 --fix then listen (volumeDb mix) = the report's 1 hand fix + its design risk.
  - ui-kit 0.20.1 → 0.38.0, 11 steps (computed with the same filter — install-module stopped at the kit's own tests: 3 runs, a different browser test timed out each time; each passes alone): 6 LOOK CHANGE (0.38.0, 0.37.2, 0.35.8 lobby rows, 0.35.5 ❤ chip, 0.33.0, 0.21.0 chips) · 0.35.5 + 0.35.7 scroll-driven animation never finishes · 0.35.5 icon glyph box · 0.30.0 old crashes/emotes/ai copies · 0.22.0 non-commercial credits 🔴 = the report's 2 test-harness fixes (shots settle, button wrap) + the taller chips / 4th lobby seat look call.
  - Clone left clean (git status empty): C:\Users\Muzzy\Documents\dev\.scratch\framework-f168\glyphtender.
Retro:
