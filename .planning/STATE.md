# Game Framework — State

## ▶ RESUME HERE
New project, created 2026-09-28. First module: the game UI kit — design approved (`.planning/design/ui-kit.md`), feature map in ROADMAP (F01–F07).
Next: `/sprint` to line up sprint 01 (parts + style engine, presets, screen stack).

## Where we are
Stage: define → develop   Milestone: v0.1 — Game UI kit   Sprint: none yet
Doing: —   Branch: main   Version: 0.0.0
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

## Log
- 2026-09-28 — Project created; UI kit researched (skill review + kit inventory + platforms) and designed; Muzzy approved 5 presets, the repo, and the Built list.
