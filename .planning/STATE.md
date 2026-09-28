# Game Framework — State

## ▶ RESUME HERE
Sprint 02 done: ~36 built screens (dialogs, front end, list-driven settings, pause + HUD, flow, online) + gallery with a screen menu and deep links (`?screen=settings&preset=neon`); 91 tests, 116 screenshots. Muzzy approved.
Next: `/sprint` → F06 the `game-ui` skill + recipe catalog + wiring into /develop and /define, then F07 try it on a real game.

## Where we are
Stage: develop   Milestone: v0.1 — Game UI kit   Sprint: none (02 done)
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
- Size budget: core ≤ ~1,000 lines; built screens ≈ 60 lines each (~1,500).
**Run/deploy**
- Default branch `main`. Remote: private GitHub TheBlueMuzzy/framework.
- Dev: npm run dev in ui-kit/ → http://localhost:5180 (--host for phones)

## Log
- 2026-09-28 — Sprint 02 done: F04 built screens (~36, blocks 959 lines), F05 gallery menu + 116 screenshots; Pixel body font → VT323; focus rings keyboard-only. Muzzy approved.
- 2026-09-28 — Sprint 01 done: F01 parts + style engine, F02 5 styles, F03 screen stack (Back/Esc, inert, style transitions); 74 tests. Muzzy approved all three.
- 2026-09-28 — Project created; UI kit researched (skill review + kit inventory + platforms) and designed; Muzzy approved 5 presets, the repo, and the Built list.
