# Game Framework — State

## ▶ RESUME HERE
2026-10-19 — **Released v0.10.2 (framework update): the Saves module 0.1.0** — saves that upgrade safely across game updates, keep backups, combine lifetime stats across devices, a save code players can copy, browser-risk warnings, and golden-save tests in check:framework (Dev Kit 0.20.4). GitHub's checks now find every module themselves. Games switch over in their own sessions (steps: ROADMAP Ideas + saves/README.md). Next: /sprint (or /roadmap) — ready in v0.10: F82–F85, save layers F93 run resume, F95 online rejoin, F96 cloud via link code, F97 app stores, F99 Unity. Every BMUZ step is ① automatic, ② checked or ③ judgement; audit: ~/.claude/config/bmuz/reviews/2026-10-19-triggers/AUDIT.md.
- What changed for Muzzy: /save runs the checks, refuses stale RESUME HERE notes, rebuilds the planner, syncs the setup (never over the laptop's newer changes); saying "going to bed" with unpushed work can't end the turn; release.mjs checks every /deliver gate first and lists all that's missing; new merge.mjs, live-check.mjs, rollback.mjs; Stop checks hold until fixed (3 tries); rule-kind flags any new rule line without ①/②/③.
- Next: /sprint for sprint 16. Research first for any new module or system (/sprint step 7).
- Also open: v0.9 still has **F62 Goops** (its own session), F64/F65 starters.
- The framework's own next release (release.mjs) needs `Release: none (library)` and `Security reviewed: <commit>` in Key facts — it lists them when run.
- dev/conformance merged into main 2026-10-19 (v0.10.1); the helper workspace is gone. Root `npm install` once on each machine for the framework linter (root eslint.config.js).
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, GitHub checks green. It ships at its own /deliver.

Reviewed through: framework e98126d (d581d49..e98126d: workflow module list + type packages, Claude, no issues; sprint 15 review: 7 findings + 2 minor, all fixed + tests; security fixes edf3810 with tests) · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 15:40

## Where we are
Stage: deliver   Milestone: v0.10 — A whole studio around one designer (v0.9 left: F62 Goops, F64/F65)   Sprint: none open (15 archived)
Doing: released v0.10.2 — next /sprint   Branch: main   Version: 0.10.2 (UI kit 0.21.0 · Dev Kit 0.20.4 · audio 0.3.2 · saves 0.1.0)
Live: nothing to host (library) — repo https://github.com/TheBlueMuzzy/framework (private), tag v0.10.2

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
- Security reviewed: e98126d (2026-10-19, v0.10.1 → dev/v0-10, last 3 commits by Claude — workflow lists modules from repo folders only, no secrets, no event text: no high/medium; 2 low in save codes — size limits, built-in device names — fixed + tests that failed first)
- Release: none (library) — games copy modules in with install-module.mjs; a release = merge, version, tag, push.
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)
- Dev Kit: `devkit/` — `npm test`; install with `node devkit/scripts/install-devkit.mjs <game>` (--dry-run first on updates). Game-side check: `npm run check:devkit`.

## Log
- 2026-10-19 — Released v0.10.2: games can install the Saves module — saved games survive updates, broken writes and (with a save code) browsers that wipe data.
- 2026-10-19 — F86 approved: games get a Saves module — saves upgrade safely across updates, keep backups, combine lifetime stats across devices, and players can copy a save code; the game check fails a save with no old copy to test.
- 2026-10-19 — Released v0.10.1: every game can now run one framework check that catches overlap, cut-off and faint text, things touching their card's edge, cards that grow, missing comfort settings, unread Settings rows and missing credits.
- 2026-10-19 — F88 approved: the framework check now flags faint text, anything touching its card's edge, cards that grow while filling in, and a Settings without reduce motion (or volume, with sound). UI kit 0.21.0. Planner fix: features with a note after "needs:" are flagged ready again.
- 2026-10-19 — Sprint 13 approved + archived: session starts now show the sprint day and only what needs attention; features need a test plan and a "what was checked" note before they count as done. Retro: Claude should lead on technical solutions earlier and more critically.
- 2026-10-19 — Sprint 13 built + reviewed: every session start shows the sprint day and only what needs Muzzy (a deadline, a stalled feature, things to check); a sprint can't be filed without a 3-line retro; every feature has a test plan and a record of what was checked; playtests get logged; one check run at a time per game.
- 2026-10-19 — F80 Everything triggers built + reviewed: /save and /deliver steps now run inside their scripts or are refused until done; saying "going to bed" with unpushed work can't end the turn; merge / live-check / rollback are one command each; every new rule must say how it happens. New milestone v0.10 "A whole studio around one designer" (F81–F92).
- 2026-10-19 — Sprints 05–07 (one long session): BMUZ hooks + the hand-off card (F68, F73), the conformance pack `check:framework` (F61), the audit's ⭐ rules as hooks + the milestone look-back (F67, F74), and fragile jobs as scripts (F69: install, release, save, archive, musts, stop servers).
- 2026-10-15 — Released v0.10.0: Dev Kit Select Mode (0.14.0–0.16.1) — proven by Glyphtender v0.11.0; review fix: Color tab keeps glow / panel texture.
- 2026-09-29 — Sprint 04 built autonomously: F08 Dev Kit module, F09 Roll Better on it, F10 kit 0.2 (7 gaps), F11 Roll Better on kit 0.2.2 (+2 gaps found in the move). Reviews clean; 2 small save-endpoint hardenings (Dev Kit 0.1.1).
- 2026-09-28 — Pre-release reviews: security (1 low fixed: installer never deletes outside src/ui/kit) + code review (6 bugs fixed: replace focus, per-game settings slot, React 18 inert, room-code clearing, confirm cancel, Esc with tooltip); shoot now flags clipped controls. Kit 0.1.5, 115 tests.
