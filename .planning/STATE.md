# Game Framework — State

## ▶ RESUME HERE
2026-10-19 — **F80 Everything triggers: approved by Muzzy (2026-10-19), sprint 12 archived** (sprint 12, all 8 tasks ticked — `.planning/SPRINT.md` Notes has the whole story). Every BMUZ step is now ① automatic, ② checked (refused until on record) or ③ judgement with a reason; audit + studio gap list: `~/.claude/config/bmuz/reviews/2026-10-19-triggers/AUDIT.md`.
- What changed for Muzzy: /save runs the checks, refuses stale RESUME HERE notes, rebuilds the planner, syncs the setup (never over the laptop's newer changes); saying "going to bed" with unpushed work can't end the turn; release.mjs checks every /deliver gate first and lists all that's missing; new merge.mjs, live-check.mjs, rollback.mjs; Stop checks hold until fixed (3 tries); rule-kind flags any new rule line without ①/②/③.
- Next: `/sprint` — plan sprint 13 from v0.10 (F81, F85–F88 ready). Ask Muzzy: CLAUDE.md is his file — 19 rule lines unmarked; proposed marks are in SPRINT Notes (task 5).
- Next after F80: v0.9 still has **F62 Goops** (its own session), F64/F65 starters. New milestone **v0.10 "A whole studio around one designer"** (F81–F92) is planned — ready now: F81 producer's eye, F85 dependency audit, F86 old saves, F87 QA routine, F88 quality bars.
- The framework's own next release (release.mjs) needs `Release: none (library)` and `Security reviewed: <commit>` in Key facts — it lists them when run.
- dev/conformance (pushed, worktree `.claude/worktrees/agent-a24e65cae835fd08b`) holds F61 + **UI kit 0.20.1 · Dev Kit 0.20.3 · audio 0.3.2** + the framework linter (root eslint.config.js; `npm install` once at the root after the merge) + `.github/workflows/checks.yml`; merges at /deliver (now with merge.mjs).
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest, GitHub checks green. It ships at its own /deliver.

Reviewed through: framework 1e30635 · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 13:18 (F80 review: 11 findings — 1 could lose the laptop's setup changes, 6 false alarms/nags — all fixed + tests)

## Where we are
Stage: develop   Milestone: v0.9 — Every game wired the same   Sprint: — (12 done)
Doing: — (plan sprint 13)   Branch: main (+ dev/conformance)   Version: 0.10.0 (main: Dev Kit 0.18.1 · dev/conformance: Dev Kit 0.20.3, UI kit 0.20.1)
Live: nothing to host (library) — repo https://github.com/TheBlueMuzzy/framework (private), tag v0.2.0

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
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)
- Dev Kit: `devkit/` — `npm test`; install with `node devkit/scripts/install-devkit.mjs <game>` (--dry-run first on updates). Game-side check: `npm run check:devkit`.

## Log
- 2026-10-19 — F80 Everything triggers built + reviewed: /save and /deliver steps now run inside their scripts or are refused until done; saying "going to bed" with unpushed work can't end the turn; merge / live-check / rollback are one command each; every new rule must say how it happens. New milestone v0.10 "A whole studio around one designer" (F81–F92).
- 2026-10-19 — Sprints 05–07 (one long session): BMUZ hooks + the hand-off card (F68, F73), the conformance pack `check:framework` (F61), the audit's ⭐ rules as hooks + the milestone look-back (F67, F74), and fragile jobs as scripts (F69: install, release, save, archive, musts, stop servers).
- 2026-10-15 — Released v0.10.0: Dev Kit Select Mode (0.14.0–0.16.1) — proven by Glyphtender v0.11.0; review fix: Color tab keeps glow / panel texture.
- 2026-09-29 — Sprint 04 built autonomously: F08 Dev Kit module, F09 Roll Better on it, F10 kit 0.2 (7 gaps), F11 Roll Better on kit 0.2.2 (+2 gaps found in the move). Reviews clean; 2 small save-endpoint hardenings (Dev Kit 0.1.1).
- 2026-09-28 — Pre-release reviews: security (1 low fixed: installer never deletes outside src/ui/kit) + code review (6 bugs fixed: replace focus, per-game settings slot, React 18 inert, room-code clearing, confirm cancel, Esc with tooltip); shoot now flags clipped controls. Kit 0.1.5, 115 tests.
- 2026-09-28 — Sprint 03 done: F06 game-ui skill (+ catalog, install-kit, shipped checker, pick sheet, BMUZ wiring); F07 Roll Better Settings rebuilt in Cartoon (408 hand-made lines gone), kit 0.1.0 → 0.1.3 from the try-out. Muzzy approved.
- 2026-09-28 — Sprint 02 done: F04 built screens (~36, blocks 959 lines), F05 gallery menu + 116 screenshots; Pixel body font → VT323; focus rings keyboard-only. Muzzy approved.
- 2026-09-28 — Sprint 01 done: F01 parts + style engine, F02 5 styles, F03 screen stack (Back/Esc, inert, style transitions); 74 tests. Muzzy approved all three.
- 2026-09-28 — Project created; UI kit researched (skill review + kit inventory + platforms) and designed; Muzzy approved 5 presets, the repo, and the Built list.
