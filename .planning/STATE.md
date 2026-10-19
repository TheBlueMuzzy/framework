# Game Framework — State

## ▶ RESUME HERE
2026-10-19 — **Sprint 12 planned: every BMUZ step runs by itself or gets checked (F80 Everything triggers)** — `.planning/SPRINT.md`, 7 tasks, all 🤖, all in `~/.claude/` (skills + config/bmuz → laptop via /sync). Sprint 11 (F76–F78) approved and archived.
- Muzzy's rule: "'only runs when it remembers' is a bad thing. 'always runs because it triggers' is much more solid." Kinds: ① automatic · ② judgement but checked · ③ judgement only (rare, with a reason).
- Next: `/develop` → task 1, the line-by-line audit of every skill → give it to a helper; it writes `~/.claude/config/bmuz/reviews/2026-10-19-triggers/AUDIT.md`. Then /save + /deliver scripts (tasks 2–3), the session-end guard (4).
- dev/conformance (pushed, worktree `.claude/worktrees/agent-a24e65cae835fd08b`) holds F61 + **UI kit 0.20.1 · Dev Kit 0.20.3 · audio 0.3.2** + the framework linter (root eslint.config.js; `npm install` once at the root after the merge) + `.github/workflows/checks.yml`; merges at /deliver. Until then the session-start update notice compares against main (older), so it stays quiet.
- Glyphtender `dev/framework-checks` (pushed): all 6 pieces newest (UI kit 0.20.1), GitHub checks green, check-run lock, check:fast runs the framework code checks. It ships at its own /deliver.
- Left in v0.9 after F80: **F62 Goops** (waits for the Goops session), F64/F65 starters (need F62).

Reviewed through: framework 1e30635 · Glyphtender eb032a7 · ~/.claude as of 2026-10-19 11:50 (sprint 11 review: 4 findings, all fixed)

## Where we are
Stage: develop   Milestone: v0.9 — Every game wired the same   Sprint: 12 — every BMUZ step runs by itself or gets checked
Doing: F80 Everything triggers (task 1: the audit)   Branch: main (+ dev/conformance)   Version: 0.10.0 (main: Dev Kit 0.18.1 · dev/conformance: Dev Kit 0.20.3, UI kit 0.20.1)
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
- 2026-10-19 — Sprints 05–07 (one long session): BMUZ hooks + the hand-off card (F68, F73), the conformance pack `check:framework` (F61), the audit's ⭐ rules as hooks + the milestone look-back (F67, F74), and fragile jobs as scripts (F69: install, release, save, archive, musts, stop servers).
- 2026-10-15 — Released v0.10.0: Dev Kit Select Mode (0.14.0–0.16.1) — proven by Glyphtender v0.11.0; review fix: Color tab keeps glow / panel texture.
- 2026-09-29 — Sprint 04 built autonomously: F08 Dev Kit module, F09 Roll Better on it, F10 kit 0.2 (7 gaps), F11 Roll Better on kit 0.2.2 (+2 gaps found in the move). Reviews clean; 2 small save-endpoint hardenings (Dev Kit 0.1.1).
- 2026-09-28 — Pre-release reviews: security (1 low fixed: installer never deletes outside src/ui/kit) + code review (6 bugs fixed: replace focus, per-game settings slot, React 18 inert, room-code clearing, confirm cancel, Esc with tooltip); shoot now flags clipped controls. Kit 0.1.5, 115 tests.
- 2026-09-28 — Sprint 03 done: F06 game-ui skill (+ catalog, install-kit, shipped checker, pick sheet, BMUZ wiring); F07 Roll Better Settings rebuilt in Cartoon (408 hand-made lines gone), kit 0.1.0 → 0.1.3 from the try-out. Muzzy approved.
- 2026-09-28 — Sprint 02 done: F04 built screens (~36, blocks 959 lines), F05 gallery menu + 116 screenshots; Pixel body font → VT323; focus rings keyboard-only. Muzzy approved.
- 2026-09-28 — Sprint 01 done: F01 parts + style engine, F02 5 styles, F03 screen stack (Back/Esc, inert, style transitions); 74 tests. Muzzy approved all three.
- 2026-09-28 — Project created; UI kit researched (skill review + kit inventory + platforms) and designed; Muzzy approved 5 presets, the repo, and the Built list.
