# Extraction queue

Finished game pieces waiting to become framework modules (F114 — Muzzy only). One entry per piece.
Written by `node ~/.claude/config/bmuz/scripts/extract.mjs` (add · list · status · fix · swap) — the words of an entry can be edited by hand.
Status: queued → building → released <module>@<version> → swapped. While an entry is open, its files in the game get bug fixes only (each one logged under "Fixes while frozen").

## X01 · lesson player
- Status: queued
- Game: games/goops
- Commit: a334977
- Files: `src/game/lessons/runner.ts`, `src/game/lessons/lessonTypes.ts`, `src/game/lessons/patterns.ts`, `tests/lessons/runner.test.ts`
- What it does: Goops' lesson player: plays a tutorial step by step from lesson files — waits for a tap, an event, a number or time; holds the game; hints, retries, a queue
- Checks: `npm run test`, `npm run e2e:day`
- Added: 2026-11-06
- Fixes while frozen: none
