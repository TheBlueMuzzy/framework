# Game Framework — State

## ▶ RESUME HERE
2026-10-18 — **Sprint 05 done — Muzzy approved F68, F61, F73.**
- **F68 BMUZ hooks** + **F73 hand-off card** live in ~/.claude (synced to the laptop): `~/.claude/config/bmuz/HOOKS.md` (7 hooks in plain words), proof `node ~/.claude/config/bmuz/hooks/test-hooks.mjs` (94/94). Every work turn ends with the card (`templates/handoff.md`) — Muzzy: "I never want to see it any other way going forward!"
- **F61 Conformance pack** on branch `dev/conformance` (pushed; merges to main at /deliver): `npm run check:framework` — Dev Kit 0.19.1, UI kit 0.18.1, Audio 0.3.1, AI 0.2.1, Rooms 0.7.0, Table 0.8.0. PAUSED pill fix already on main (Dev Kit 0.18.1) — tell the Goops session.
- Ready next (🟢): **F67** lesson audit → build the ⭐ hooks in `~/.claude/config/bmuz/reviews/2026-10-18-reliability/HOOK-CANDIDATES.md`, plan-file checker (`plan-lint.mjs`) first · F62 Goops passes (Goops session: adapter `conformance: { startPlay, query }`) · F63 Glyphtender passes (bots on setTimeout, check:ui red, no `smoke` script) · F69 scripts · F70 CI · F72 session hygiene · F66 health row. Then F74 self-improving loop (needs F67).
- Sprint 05 archive: `.planning/archive/sprints/sprint-05.md` on dev/conformance (arrives on main with /deliver).
- Next: `/sprint` — plan Sprint 06 (suggest F67's ⭐ hooks).

## Where we are
Stage: develop   Milestone: v0.9 — Every game wired the same   Sprint: 05
Doing: Sprint 05 done   Branch: main (+ dev/conformance)   Version: 0.10.0 (main: Dev Kit 0.18.1 · dev/conformance: Dev Kit 0.19.1)
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
- 2026-10-15 — Released v0.10.0: Dev Kit Select Mode (0.14.0–0.16.1) — proven by Glyphtender v0.11.0; review fix: Color tab keeps glow / panel texture.
- 2026-09-29 — Sprint 04 built autonomously: F08 Dev Kit module, F09 Roll Better on it, F10 kit 0.2 (7 gaps), F11 Roll Better on kit 0.2.2 (+2 gaps found in the move). Reviews clean; 2 small save-endpoint hardenings (Dev Kit 0.1.1).
- 2026-09-28 — Pre-release reviews: security (1 low fixed: installer never deletes outside src/ui/kit) + code review (6 bugs fixed: replace focus, per-game settings slot, React 18 inert, room-code clearing, confirm cancel, Esc with tooltip); shoot now flags clipped controls. Kit 0.1.5, 115 tests.
- 2026-09-28 — Sprint 03 done: F06 game-ui skill (+ catalog, install-kit, shipped checker, pick sheet, BMUZ wiring); F07 Roll Better Settings rebuilt in Cartoon (408 hand-made lines gone), kit 0.1.0 → 0.1.3 from the try-out. Muzzy approved.
- 2026-09-28 — Sprint 02 done: F04 built screens (~36, blocks 959 lines), F05 gallery menu + 116 screenshots; Pixel body font → VT323; focus rings keyboard-only. Muzzy approved.
- 2026-09-28 — Sprint 01 done: F01 parts + style engine, F02 5 styles, F03 screen stack (Back/Esc, inert, style transitions); 74 tests. Muzzy approved all three.
- 2026-09-28 — Project created; UI kit researched (skill review + kit inventory + platforms) and designed; Muzzy approved 5 presets, the repo, and the Built list.
