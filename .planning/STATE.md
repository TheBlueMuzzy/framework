# Game Framework — State

## ▶ RESUME HERE
2026-10-24 — **Released v0.18.0 (v0.16 The kit holds up on a phone)** — UI kit 0.33.1: HUD corners keep their width on small phones; the page check sees a chip on a bar · saves 0.6.2. Next: /sprint (or /roadmap). Games pick it up with `install-module.mjs ui-kit .`.
- Plan-lint flags F61 ✅ while F59/F60 are still 🔨 (v0.9, built in Goops) — for Goops' session, not this sprint.
- Also open: v0.9 still has **F62 Goops** (its own session), F64/F65 starters. Roll Better's @react-three/rapier ships with no licence → its next release is refused until checked (ROADMAP Ideas).
- Root `npm install` once on each machine for the framework linter (root eslint.config.js).
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, GitHub checks green. It ships at its own /deliver.

Reviewed through: framework 102a4d6 (e938dcf..102a4d6 F124 + F123 read whole by Claude: no bugs); (1156e96..2e3ff56 version 0.1.1 read whole by Claude: 1 real fixed + test (2e3ff56: a file that only imported versionLabel counted as showing it); 249f30b F120 Windows path rules on Linux: read whole by Claude, no bugs; F122 ae3177b..e7394e4: helper code + security review, no bugs, 1 locking test 8e432b3; sprint 32: F118+F120 helper review, 3 real fixed in ~/.claude + tests, repo sound; F119+F121 helper review, 1 real fixed in 2fa60a4; sprint 31: F115+F116 8a5504d..71032b4 helper review, 1 real fixed in cb7f3ac; F117 ~/.claude trimLog helper review, 1 real fixed + 4 tests; d621d59 a test-only fix by Claude; sprint 30 F114 1428fc8..4a1b207 + ~/.claude extract.mjs / guard-edits: helper review, 6 real fixed + tests; F113 task 5 05f856b..c6b41c5: read whole by Claude, no bugs; sprint 29 F111 + F112 687aea9..daea510 + ~/.claude scripts: helper review, 3 real fixed + tests + 1 mine (75b06c0); F113 7da1dc0..405d866: helper review, 1 real fixed + tests in 684564a; sprint 28 F110 50ede98..10df792: helper review, 2 real fixed + tests in 71d0dfc — a pattern that could hang the check; sprint 28 F109 7aede4b..d548b46: helper review, 3 real fixed + tests in 8e4403a / a91d3f2 — incl. a relayed seat id crashing the row; sprint 27 F26 0f08f11..d316d50: helper review, 3 real fixed + tests in 489655c / ceec195; sprint 27 F25 a6ec22d..27cd181: helper review, 2 real fixed + tests in 66072fc / c513c90 — incl. a game-named meter unescaped on the report page; sprint 26 F22 tasks 6–7 72a95e2..bcb2aab: helper review, 2 real + 1 minor fixed + tests in af8e6bd / ea315bc — nothing new exposed online; sprint 26 F22 6a8cbe8..620c788: helper review, 3 real bugs fixed + tests in 4d8ed5a / cc62964 / 6ef3be3; sprint 26 F107 e1453fb..4208f8c: helper review, 3 real bugs fixed + tests in 601bf9a / 069bfd1 / 893db5c; sprint 26 F108 aff7eaf..bcc6c9d: helper review, 1 real bug fixed + test in 95caa73 — a header title stayed shrunk after its action went away; sprint 26 F24 4121ea5..d55c032: helper review, 1 real bug fixed + test in 09184da — ladder games counted in the main numbers; ed8c3f1 = the v0.11.2 security fixes, Claude, each with tests; 48fcd3e..d0b5075 plan files only; sprint 25 F89: helper review, 3 real bugs fixed + tests — reports the server would refuse (huge moment numbers, day-old moments, invisible characters), the token file named two ways; the server helper's own security review 6 fixed; the proof 4 + UI kit 0.26.1; sprint 24 F31 adb661e: sprint 24 F31: helper review, 2 real bugs fixed + tests; v0.11.0 security fixes 93c9a98..d89b2c0 read whole by Claude, no findings; sprint 23 F104: small diff read whole by Claude, no findings; sprint 22 F103 review: no bugs, 2 minor fixed + test; sprint 22 review: F102 2 real + 2 minor check findings, all fixed + tests; sprint 21 review: F101 1 real bug + close() + 5 FORMAT.md errors, all fixed + tests; proof: 4 findings fixed + tests; sprint 20 review: F94 5 hardening fixes + F98 3 security fixes, all + tests; sprint 19 review: F96 4 security findings + F100 1, all fixed + tests; sprint 18 review: F93 3 findings + F95 2, all fixed + tests; sprint 17 review: F82 2 findings + F83 4, all fixed + tests, ~/.claude 2026-10-20 01:10; sprint 16 review: 3 findings + 1 rough edge, all fixed + tests; d581d49..e98126d: workflow module list + type packages, Claude, no issues; sprint 15 review: 7 findings + 2 minor, all fixed + tests; security fixes edf3810 with tests) · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 15:40

## Where we are
Stage: deliver   Milestone: v0.16 The kit holds up on a phone ✅   Sprint: 33 (archived)
Doing: — (released v0.18.0)   Branch: dev/v0-16-phone-kit   Version: 0.17.1 (emotes 0.4.0 · ai 0.8.0 · rooms 0.12.0 · UI kit 0.33.1 · Dev Kit 0.27.0 · crashes 0.1.0 · audio 0.4.0 · saves 0.6.2 · version 0.1.1)
Live: nothing to host (library) — repo https://github.com/TheBlueMuzzy/framework (public since 2026-10-23), tag v0.18.0

## Key facts
**What this is**
- Muzzy 2026-10-20: build the framework as solid as possible BEFORE putting it into a game, then change it as games teach us ("having it ready and then modifying it as needed as we learn things is okay with me") — scratch-copy proofs are the norm; don't push to take a real game through each layer. Parts that hang on outside versions/accounts (store backends, Unity C#) still wait until a real build uses them.
- The Game Framework (BMUZ-PLAN step 2): reusable modules that games copy in with a version stamp; improvements get harvested back. Plan: `~/.claude/config/bmuz/BMUZ-PLAN.md`.
- Modules are copied into games (a framework change never breaks a finished game). UI kit copy goes to a game's `src/ui/kit/`.
**Rules (UI kit)**
- Parts and screens contain no colours, px sizes or fonts — only style names. The style file paints everything.
- All presets have identical setting names + pass contrast (tested). Accessibility floor lives outside presets.
- Web: plain React + plain CSS variables. No Tailwind, no component library (design §6).
- Size budget: core ≤ ~1,000 lines; built screens ≈ 60 lines each (~1,500).
**Run/deploy**
- Default branch `main`. Remote: public GitHub TheBlueMuzzy/framework (public 2026-10-23 — Actions minutes free).
- Security reviewed: 4a95f67 (2026-10-24, v0.17.1..4a95f67 read whole by Claude: CSS, the page check reading the page's own DOM, the gallery sample, the shoot script's sizes, the saves installer caching its git answer — no outside input, nothing runs from data; no issues)
- Release: none (library) — games copy modules in with install-module.mjs; a release = merge, version, tag, push.
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)
- Dev Kit: `devkit/` — `npm test`; install with `node devkit/scripts/install-devkit.mjs <game>` (--dry-run first on updates). Game-side check: `npm run check:devkit`.

## Log
- 2026-10-24 — Released v0.18.0 (v0.16 The kit holds up on a phone): HUD corners keep their width on small phones, the page check sees a chip covering a bar, and the saves test stays fast under load.
- 2026-10-24 — Sprint 33 planned: the kit holds up on a phone (F124 covered-bar check, F123 HUD corner slots, F125 slow saves test).
- 2026-10-24 — Released v0.17.1: a game that draws its own main menu (Goops' console) can show the version there and pass the check.
- 2026-10-24 — Released v0.17.0 (v0.15 Checks you can trust): checks name a busy port at once, the kit gallery is clean, bubbles take a game's colours, and the Fonts tab tries every installed font.
- 2026-10-24 — F118–F122 approved.
- 2026-10-24 — Sprint 32 planned: checks you can trust (F118 port pre-flight, F119 clean gallery, F120 no shell strings).
- 2026-10-24 — Released v0.16.0 (v0.14 Story pieces made solid): the reveal replays by itself, screen readers hear every bubble line, and the planner trims its own Log.
- 2026-10-24 — F115 + F116 + F117 approved: the reveal replays by itself, screen readers hear every bubble line, and the planner trims its own Log.
- 2026-10-24 — Sprint 31 planned: make the new story pieces solid (F115 reveal replays, F116 bubble for every player, F117 log trims itself).
- 2026-10-24 — Released v0.15.0 (v0.13 Games feed the framework): games can hand finished pieces to the framework and swap the module back in one step.
- 2026-10-24 — F114 approved: a game session can hand a finished piece to the framework window, which builds it as a module and swaps it back in with the game's own checks as the contract.
