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
- [ ] 🤖 2. Exempt functions named check* (and what the rules' check calls) — lint/kit/rules.mjs
- [ ] 🤖 3. Run lint on ~/Documents/dev/.scratch/glyphtender-catchup (read-only): finds before → after in Notes — lint/kit/rules.mjs
- [ ] 🤖 4. Lint kit VERSION + README line; lint tests + root check:fast green — lint/kit/VERSION
Check: new tests red then green; the scratch copy's refusal-reason finds 23 → 0, real finds kept; root check:fast.
Checked:

## F168 🔧 Upgrade notes + install order
Done when: each module has an UPGRADES.md of hand steps by version (LOOK CHANGE marked), install-module prints the steps between the game's version and the new one, and refuses (with the fix) a module whose checks need a newer Dev Kit than the game has; tests cover both.
- [ ] 🤖 1. Each module's kit/UPGRADES.md: "<version>: <hand step>" lines, filled from the Glyphtender report + the root CHANGELOG (audio 0.4.0 --fix, ai 0.5.0 chattiness, rooms OnlineRoom fields, ui-kit taller chips = LOOK CHANGE…) — audio/kit/VERSION
- [ ] 🤖 2. Tests red first: steps since the game's version are printed; a module needing Dev Kit ≥ X refuses on an older Dev Kit with "update devkit first" — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [ ] 🤖 3. Build both in install-module (a module says its minimum Dev Kit in its UPGRADES.md) — ~/.claude/config/bmuz/scripts/install-module.mjs
- [ ] 🤖 4. Dry run against a fresh read-only clone of the real Glyphtender (its ORIGINAL versions) prints the right steps and refuses ai before devkit; script tests + root check:fast green — ~/.claude/config/bmuz/scripts/install-module.mjs
Check: new tests red then green; the dry run's output matches the report's hand fixes; all script tests; root check:fast.
Checked:

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
Retro:
