# Game Framework — State

## ▶ RESUME HERE
2026-10-22 — **Released v0.11.2** (crash reports from players: crashes module 0.1.0 · UI kit 0.26.1 · Dev Kit 0.22.1 · session start's crash-news line; the security review's 3 fixes in). **Next: /sprint (or /roadmap).** Installing crashes in a real game and going live with its server stay Muzzy's call (Goops is the likely first — its own session). A game's crash token is now `~/.config/bmuz/crashes/<server host>.token`.
- Plan-lint flags F61 ✅ while F59/F60 are still 🔨 (v0.9, built in Goops) — for Goops' session, not this sprint.
- Also open: v0.9 still has **F62 Goops** (its own session), F64/F65 starters. Roll Better's @react-three/rapier ships with no licence → its next release is refused until checked (ROADMAP Ideas).
- Root `npm install` once on each machine for the framework linter (root eslint.config.js).
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, GitHub checks green. It ships at its own /deliver.

Reviewed through: framework ed8c3f1 (ed8c3f1 = the v0.11.2 security fixes, Claude, each with tests; 48fcd3e..d0b5075 plan files only; sprint 25 F89: helper review, 3 real bugs fixed + tests — reports the server would refuse (huge moment numbers, day-old moments, invisible characters), the token file named two ways; the server helper's own security review 6 fixed; the proof 4 + UI kit 0.26.1; sprint 24 F31 adb661e: sprint 24 F31: helper review, 2 real bugs fixed + tests; v0.11.0 security fixes 93c9a98..d89b2c0 read whole by Claude, no findings; sprint 23 F104: small diff read whole by Claude, no findings; sprint 22 F103 review: no bugs, 2 minor fixed + test; sprint 22 review: F102 2 real + 2 minor check findings, all fixed + tests; sprint 21 review: F101 1 real bug + close() + 5 FORMAT.md errors, all fixed + tests; proof: 4 findings fixed + tests; sprint 20 review: F94 5 hardening fixes + F98 3 security fixes, all + tests; sprint 19 review: F96 4 security findings + F100 1, all fixed + tests; sprint 18 review: F93 3 findings + F95 2, all fixed + tests; sprint 17 review: F82 2 findings + F83 4, all fixed + tests, ~/.claude 2026-10-20 01:10; sprint 16 review: 3 findings + 1 rough edge, all fixed + tests; d581d49..e98126d: workflow module list + type packages, Claude, no issues; sprint 15 review: 7 findings + 2 minor, all fixed + tests; security fixes edf3810 with tests) · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 15:40

## Where we are
Stage: deliver   Milestone: v0.10 leftover (F89) — released   Sprint: — (25 archived)
Doing: —   Branch: main   Version: 0.11.2 (crashes 0.1.0 · UI kit 0.26.1 · Dev Kit 0.22.1 · audio 0.4.0 · saves 0.6.1 · version 0.1.0 · rooms 0.11.0)
Live: nothing to host (library) — repo https://github.com/TheBlueMuzzy/framework (private), tag v0.11.2

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
- Default branch `main`. Remote: private GitHub TheBlueMuzzy/framework.
- Security reviewed: ed8c3f1 (2026-10-22, v0.11.1 → v0.11.2, a helper on the crashes module + the crash-news hook: the server held — token check constant-time, wrong token = 404, SQL parameterised, caps enforced, no address stored, installer + map lookup stay inside the game, no map ships; 3 real issues fixed with tests: the token could be sent to a server a repo names (now named after the server's host, https only, no redirects, plain-character addresses), player-sent text printed bare to Claude (now framed as data), another site's failed file kept its whole path (now site + file type). Accepted: a many-address flood can still use up the free daily requests and fill the address map → F105.) · earlier: b697259 (2026-10-21, v0.11.0 → v0.11.1 by Claude: F31 adds no public address — the dev server's save-audio drop still checks type + folder against fixed lists, names the file itself, keeps the original inside audio-originals/ (path + realpath checked, never over a file); the matcher it imports is the game's own fixed src/audio/loudness.mjs; audio:check is a CLI writing only inside public/audio + audio-originals (link + path checks, review-tested) — no issues)
- Release: none (library) — games copy modules in with install-module.mjs; a release = merge, version, tag, push.
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)
- Dev Kit: `devkit/` — `npm test`; install with `node devkit/scripts/install-devkit.mjs <game>` (--dry-run first on updates). Game-side check: `npm run check:devkit`.

## Log
- 2026-10-22 — Released v0.11.2: crash reports from players (crashes 0.1.0, UI kit 0.26.1, Dev Kit 0.22.1); the security review's 3 fixes — the token goes only to its own server, player text framed as data, other sites' file paths dropped.
- 2026-10-22 — F89 approved: games can report their crashes to a server of their own, read on the PC with real file lines.
- 2026-10-22 — F89 built (waiting for OK): when a player's game breaks, the game reports it to its own small server; `npm run crashes` shows real file lines and session start says "N new errors from players".
- 2026-10-22 — Sprint 25 planned: when a player's game breaks, you hear about it (crash reports, on by default with a Settings switch).
- 2026-10-21 — Released v0.11.1: every sound in a game can come out at the same loudness and start on time — an audio check report with a fix, and the Sound Board levels dropped sounds.
- 2026-10-21 — Released v0.11.0 (v0.10 milestone): games can resume runs, rejoin online matches, copy saves by link code and keep checked leaderboards; one version label everywhere; portrait-only games aren't checked sideways; four security fixes against one person jamming a shared server.
- 2026-10-20 — F104 built (waiting for OK): a game can say "portrait only" once and no check tests it sideways.
- 2026-10-20 — Sprint 23 planned: a game says "portrait only" once and no check tests it sideways again.
- 2026-10-20 — F103 approved: confirm boxes can't silently fail, bars fit small phones without workarounds, the Dev Kit warns when its PAUSED pill covers a game's HUD.
- 2026-10-20 — F103 built (waiting for OK): confirm boxes can't silently fail any more, bars fit small phones without workarounds, and the Dev Kit warns when its PAUSED pill covers the game's HUD.
- 2026-10-20 — F102 approved: every game can show the same version number on its menu, in Settings and in bug reports, and its tests refuse an outdated build.
