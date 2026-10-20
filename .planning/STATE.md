# Game Framework — State

## ▶ RESUME HERE
2026-10-20 — **Sprint 19 planned: the game survives on the server** — F100 (a match kept in the Durable Object until it ends; `keepMatchDays` per game, 7 live · 30 async, asked at install) + F96 (a Save code "Link code": 8 characters, 7 days, merged by each field's rule, Delete my data). Built + proven locally only; going live stays Muzzy's call. Next: /develop (two helpers, F100 ∥ F96). Queue after: 20 F94 seed/move log + F98 checked leaderboards · 21 F97 stores/Steam + F99 Unity.
- Plan-lint flags F61 ✅ while F59/F60 are still 🔨 (v0.9, built in Goops) — for Goops' session, not this sprint.
- Also open: v0.9 still has **F62 Goops** (its own session), F64/F65 starters. Roll Better's @react-three/rapier ships with no licence → its next release is refused until checked (ROADMAP Ideas).
- The framework's own next release (release.mjs) needs `Release: none (library)` and `Security reviewed: <commit>` in Key facts — it lists them when run.
- Root `npm install` once on each machine for the framework linter (root eslint.config.js).
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, GitHub checks green. It ships at its own /deliver.

Reviewed through: framework 7445a36 (sprint 18 review: F93 3 findings + F95 2, all fixed + tests; sprint 17 review: F82 2 findings + F83 4, all fixed + tests, ~/.claude 2026-10-20 01:10; sprint 16 review: 3 findings + 1 rough edge, all fixed + tests; d581d49..e98126d: workflow module list + type packages, Claude, no issues; sprint 15 review: 7 findings + 2 minor, all fixed + tests; security fixes edf3810 with tests) · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 15:40

## Where we are
Stage: develop   Milestone: v0.10 — A whole studio around one designer (v0.9 left: F62 Goops, F64/F65)   Sprint: 19 — the game survives on the server (F100, F96)
Doing: Sprint 19 — F100 + F96 building   Branch: dev/v0-10   Version: 0.10.3 (UI kit 0.22.1 · Dev Kit 0.20.4 · audio 0.3.2 · saves 0.1.0)
Live: nothing to host (library) — repo https://github.com/TheBlueMuzzy/framework (private), tag v0.10.3

## Key facts
**What this is**
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
- 2026-10-20 — F93 + F95 approved: games can offer Continue for an unfinished game and Rejoin match for an online match left mid-game.
- 2026-10-20 — Sprint 18 built (waiting for OK): games can offer Continue for an unfinished game and Rejoin match for an online match left mid-game.
- 2026-10-20 — F82 + F83 approved: session start warns when a live game or its online server is down, and alpha / beta / 1.0 releases need a filled-in release checklist.
- 2026-10-20 — Sprint 17 built (waiting for OK): session start now says when a live game or its room server is down, and alpha / beta / 1.0 releases need a filled-in release checklist (no stand-in art from beta).
- 2026-10-20 — Released v0.10.3: every release now carries patch notes players can read, and refuses risky code packages; games can show their open-source licences in Credits.
- 2026-10-19 — Released v0.10.2: games can install the Saves module — saved games survive updates, broken writes and (with a save code) browsers that wipe data.
- 2026-10-19 — F86 approved: games get a Saves module — saves upgrade safely across updates, keep backups, combine lifetime stats across devices, and players can copy a save code; the game check fails a save with no old copy to test.
- 2026-10-19 — Released v0.10.1: every game can now run one framework check that catches overlap, cut-off and faint text, things touching their card's edge, cards that grow, missing comfort settings, unread Settings rows and missing credits.
- 2026-10-19 — F88 approved: the framework check now flags faint text, anything touching its card's edge, cards that grow while filling in, and a Settings without reduce motion (or volume, with sound). UI kit 0.21.0. Planner fix: features with a note after "needs:" are flagged ready again.
- 2026-10-19 — Sprint 13 approved + archived: session starts now show the sprint day and only what needs attention; features need a test plan and a "what was checked" note before they count as done. Retro: Claude should lead on technical solutions earlier and more critically.
