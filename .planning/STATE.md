# Game Framework — State

## ▶ RESUME HERE
Sprint 01 done: parts + style engine, 5 styles (Clean, Cozy, Cartoon, Pixel, Neon), screen stack — all approved by Muzzy. Kit ≈ 870 of ~1,000 lines.
Next: `/sprint` → sprint 02 = F04 built screens (menu, list-driven settings, pause, dialogs, loading, results, lobby, HUD). Watch the line budget.

## Where we are
Stage: develop   Milestone: v0.1 — Game UI kit   Sprint: none (01 done)
Doing: —   Branch: dev/v0-1-ui-kit   Version: 0.0.0
Live: none (the gallery may get a private preview link later)

## Key facts
**What this is**
- The Game Framework (BMUZ-PLAN step 2): reusable modules that games copy in with a version stamp; improvements get harvested back. Plan: `~/.claude/config/bmuz/BMUZ-PLAN.md`.
- Modules are copied into games (a framework change never breaks a finished game). UI kit copy goes to a game's `src/ui/kit/`.
**Rules (UI kit)**
- Parts and screens contain no colours, px sizes or fonts — only style names. The style file paints everything.
- All presets have identical setting names + pass contrast (tested). Accessibility floor lives outside presets.
- Web: plain React + plain CSS variables. No Tailwind, no component library (design §6).
- Size budget: web kit ≤ ~1,000 lines incl. CSS for v1.
**Run/deploy**
- Default branch `main`. Remote: private GitHub TheBlueMuzzy/framework.
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)

## Log
- 2026-09-28 — Sprint 01 done: F01 parts + style engine, F02 5 styles, F03 screen stack (Back/Esc, inert, style transitions); 74 tests. Muzzy approved all three.
- 2026-09-28 — Project created; UI kit researched (skill review + kit inventory + platforms) and designed; Muzzy approved 5 presets, the repo, and the Built list.
