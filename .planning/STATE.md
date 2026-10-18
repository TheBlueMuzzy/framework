# Game Framework — State

## ▶ RESUME HERE
2026-10-15 — **Released framework v0.10.0 = v0.8 Dev Kit Select Mode ✅** (Dev Kit 0.16.1: Select tab — click a thing or a menu part → every knob for it; the game's test keeps every setting on some object; desktop panel tucks to a bar while selecting; pick forgotten on close). Proven by Glyphtender v0.11.0. F57 (3D picker) waits for a 3D game.
Next: whatever the next game sprint needs.
2026-10-18 — **Planned v0.9 "Every game wired the same"** (F59–F66, ROADMAP): game core (live content by default, rules/looks clocks) + Dev Kit Time tool (full / half pause) are being built through Goops right now (Dev Kit 0.18.0); then the conformance pack (F61), Goops + Glyphtender pass it, starters, a framework test game. Spec: ~/.claude/config/bmuz/MODULE-CONTRACTS.md. This milestone runs in its OWN Claude session (Muzzy, 2026-10-18), which owns dev/framework + ~/.claude (BMUZ). Start with **F68 BMUZ hooks** (touches only ~/.claude). F59/F60 are being built by a helper from the Goops session right now (it writes devkit/ + Goops) — don't touch devkit/ or Goops until the Goops session says that work has landed; then F61. Goops itself stays with the Goops session (framework work on Goops goes on its own branch, merged by the Goops session). Reliability plan: ~/.claude/config/bmuz/reviews/2026-10-18-reliability/PLAN.md.

## Where we are
Stage: deliver   Milestone: v0.8 — Dev Kit Select Mode ✅   Sprint: —
Doing: released   Branch: main   Version: 0.10.0 (Dev Kit 0.16.1)
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
