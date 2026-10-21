# Game Framework — State

## ▶ RESUME HERE
2026-10-21 — **F104 ✅ done (Muzzy approved): a game says "portrait only" once** — content/ui/style.json `"orientation"` ("any" · "portrait" · "landscape"), honoured by check:framework, the PAUSED pill check and the helper briefs, on `dev/v0-10` (UI kit 0.26.0 · Dev Kit 0.21.1 — unreleased). **Next: sprint 23 retro (3 lines from Muzzy) → archive sprint 23 → `/sprint` for sprint 24.** Goops' hand-over note (ui-kit/README.md) includes `"orientation": "portrait"`.
- Plan-lint flags F61 ✅ while F59/F60 are still 🔨 (v0.9, built in Goops) — for Goops' session, not this sprint.
- Also open: v0.9 still has **F62 Goops** (its own session), F64/F65 starters. Roll Better's @react-three/rapier ships with no licence → its next release is refused until checked (ROADMAP Ideas).
- The framework's own next release (release.mjs) needs `Release: none (library)` and `Security reviewed: <commit>` in Key facts — it lists them when run.
- Root `npm install` once on each machine for the framework linter (root eslint.config.js).
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, GitHub checks green. It ships at its own /deliver.

Reviewed through: framework 22270d1 (sprint 23 F104: small diff read whole by Claude, no findings; sprint 22 F103 review: no bugs, 2 minor fixed + test; sprint 22 review: F102 2 real + 2 minor check findings, all fixed + tests; sprint 21 review: F101 1 real bug + close() + 5 FORMAT.md errors, all fixed + tests; proof: 4 findings fixed + tests; sprint 20 review: F94 5 hardening fixes + F98 3 security fixes, all + tests; sprint 19 review: F96 4 security findings + F100 1, all fixed + tests; sprint 18 review: F93 3 findings + F95 2, all fixed + tests; sprint 17 review: F82 2 findings + F83 4, all fixed + tests, ~/.claude 2026-10-20 01:10; sprint 16 review: 3 findings + 1 rough edge, all fixed + tests; d581d49..e98126d: workflow module list + type packages, Claude, no issues; sprint 15 review: 7 findings + 2 minor, all fixed + tests; security fixes edf3810 with tests) · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 15:40

## Where we are
Stage: develop   Milestone: v0.10 — A whole studio around one designer (v0.9 left: F62 Goops, F64/F65)   Sprint: 23 — a game says "portrait only" once (F104)
Doing: sprint 23 retro   Branch: dev/v0-10   Version: 0.10.3 (UI kit 0.26.0 · Dev Kit 0.21.1 · audio 0.3.2 · saves 0.6.0 · version 0.1.0 · rooms 0.10.0 — unreleased on dev/v0-10)
Live: nothing to host (library) — repo https://github.com/TheBlueMuzzy/framework (private), tag v0.10.3

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
- Security reviewed: 20196de (2026-10-19, v0.10.2 → dev/v0-10 by Claude: the Credits link opens a same-site text file named by the game, noopener; .npmrc settings only — no issues)
- Release: none (library) — games copy modules in with install-module.mjs; a release = merge, version, tag, push.
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)
- Dev Kit: `devkit/` — `npm test`; install with `node devkit/scripts/install-devkit.mjs <game>` (--dry-run first on updates). Game-side check: `npm run check:devkit`.

## Log
- 2026-10-20 — F104 built (waiting for OK): a game can say "portrait only" once and no check tests it sideways.
- 2026-10-20 — Sprint 23 planned: a game says "portrait only" once and no check tests it sideways again.
- 2026-10-20 — F103 approved: confirm boxes can't silently fail, bars fit small phones without workarounds, the Dev Kit warns when its PAUSED pill covers a game's HUD.
- 2026-10-20 — F103 built (waiting for OK): confirm boxes can't silently fail any more, bars fit small phones without workarounds, and the Dev Kit warns when its PAUSED pill covers the game's HUD.
- 2026-10-20 — F102 approved: every game can show the same version number on its menu, in Settings and in bug reports, and its tests refuse an outdated build.
- 2026-10-20 — Sprint 21 planned: saves ready to move to phone, desktop, Steam or Unity later (the store and Unity parts wait until a game needs them).
- 2026-10-20 — F94 + F98 approved: games can be replayed from their seed + moves (a Daily game for everyone), and a Daily board checks every score by replaying it.
- 2026-10-20 — Sprint 20 built (waiting for OK): a game can be kept as its seed + moves (replays, a Daily game for everyone), and a Daily board where the server replays every game to check its score.
- 2026-10-20 — F100 + F96 approved: online matches survive a server restart until they end, and a link code moves a save to another device.
- 2026-10-20 — Sprint 19 built (waiting for OK): online matches survive a server restart until they end (each game picks how long), and a short link code moves a save to another device for 7 days.
- 2026-10-20 — F93 + F95 approved: games can offer Continue for an unfinished game and Rejoin match for an online match left mid-game.
- 2026-10-20 — Sprint 18 built (waiting for OK): games can offer Continue for an unfinished game and Rejoin match for an online match left mid-game.
