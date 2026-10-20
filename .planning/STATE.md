# Game Framework — State

## ▶ RESUME HERE
2026-10-20 — **Sprint 17 built, waiting for Muzzy's OK: F82 (is the live game up?) + F83 (stage-release checklist)** on `dev/v0-10`. F82: session start asks STATE's Live page + the room server in ≤ 3 s and says "DOWN" only when one is (hooks/live-ping.mjs); live-check pings the room server's /health; rooms kit 0.8.0 answers /health. F83: an alpha / beta / 1.0 release is refused until `.planning/archive/release-checks/<stage>.md` is filled + ticked (scripts/release-check.mjs writes it); from beta no stand-in art. Both reviewed by a helper (2 + 4 findings, all fixed + tests). Next: Muzzy says "approved" → F82/F83 done, retro, archive, /sprint 18 (F93 run resume + F95 online rejoin). Queue after: 19 F96 + F94 · 20 F97 + F98 + F99.
- Muzzy: task 9 — read ~/.claude/config/bmuz/templates/release-check.md (anything a real alpha/beta check needs that's missing?), then approve F82 + F83.
- Plan-lint flags F61 ✅ while F59/F60 are still 🔨 (v0.9, built in Goops) — for Goops' session, not this sprint.
- Also open: v0.9 still has **F62 Goops** (its own session), F64/F65 starters. Roll Better's @react-three/rapier ships with no licence → its next release is refused until checked (ROADMAP Ideas).
- The framework's own next release (release.mjs) needs `Release: none (library)` and `Security reviewed: <commit>` in Key facts — it lists them when run.
- Root `npm install` once on each machine for the framework linter (root eslint.config.js).
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, GitHub checks green. It ships at its own /deliver.

Reviewed through: framework f50a74e (sprint 17 review: F82 2 findings + F83 4, all fixed + tests, ~/.claude 2026-10-20 01:10; sprint 16 review: 3 findings + 1 rough edge, all fixed + tests; d581d49..e98126d: workflow module list + type packages, Claude, no issues; sprint 15 review: 7 findings + 2 minor, all fixed + tests; security fixes edf3810 with tests) · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 15:40

## Where we are
Stage: develop   Milestone: v0.10 — A whole studio around one designer (v0.9 left: F62 Goops, F64/F65)   Sprint: 17 — releases and live games get watched for you (F82, F83)
Doing: Sprint 17 built (F82, F83) — waiting for Muzzy's OK   Branch: dev/v0-10   Version: 0.10.3 (UI kit 0.22.1 · Dev Kit 0.20.4 · audio 0.3.2 · saves 0.1.0)
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
- 2026-10-20 — Sprint 17 built (waiting for OK): session start now says when a live game or its room server is down, and alpha / beta / 1.0 releases need a filled-in release checklist (no stand-in art from beta).
- 2026-10-20 — Released v0.10.3: every release now carries patch notes players can read, and refuses risky code packages; games can show their open-source licences in Credits.
- 2026-10-19 — Released v0.10.2: games can install the Saves module — saved games survive updates, broken writes and (with a save code) browsers that wipe data.
- 2026-10-19 — F86 approved: games get a Saves module — saves upgrade safely across updates, keep backups, combine lifetime stats across devices, and players can copy a save code; the game check fails a save with no old copy to test.
- 2026-10-19 — Released v0.10.1: every game can now run one framework check that catches overlap, cut-off and faint text, things touching their card's edge, cards that grow, missing comfort settings, unread Settings rows and missing credits.
- 2026-10-19 — F88 approved: the framework check now flags faint text, anything touching its card's edge, cards that grow while filling in, and a Settings without reduce motion (or volume, with sound). UI kit 0.21.0. Planner fix: features with a note after "needs:" are flagged ready again.
- 2026-10-19 — Sprint 13 approved + archived: session starts now show the sprint day and only what needs attention; features need a test plan and a "what was checked" note before they count as done. Retro: Claude should lead on technical solutions earlier and more critically.
- 2026-10-19 — Sprint 13 built + reviewed: every session start shows the sprint day and only what needs Muzzy (a deadline, a stalled feature, things to check); a sprint can't be filed without a 3-line retro; every feature has a test plan and a record of what was checked; playtests get logged; one check run at a time per game.
- 2026-10-19 — F80 Everything triggers built + reviewed: /save and /deliver steps now run inside their scripts or are refused until done; saying "going to bed" with unpushed work can't end the turn; merge / live-check / rollback are one command each; every new rule must say how it happens. New milestone v0.10 "A whole studio around one designer" (F81–F92).
- 2026-10-19 — Sprints 05–07 (one long session): BMUZ hooks + the hand-off card (F68, F73), the conformance pack `check:framework` (F61), the audit's ⭐ rules as hooks + the milestone look-back (F67, F74), and fragile jobs as scripts (F69: install, release, save, archive, musts, stop servers).
