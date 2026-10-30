# Extraction queue

Finished game pieces waiting to become framework modules (F114 — Muzzy only). One entry per piece.
Written by `node ~/.claude/config/bmuz/scripts/extract.mjs` (add · list · status · fix · swap) — the words of an entry can be edited by hand.
Status: queued → building → released <module>@<version> → swapped. While an entry is open, its files in the game get bug fixes only (each one logged under "Fixes while frozen").

## X01 · Turn your phone
- Status: queued
- Game: games/glyphtender
- Commit: cc2767b
- Files: `src/ui/TurnPhone.tsx`, `e2e/turn-phone.mjs`
- What it does: A touch screen held sideways (shorter than a tunable height) gets a full-window 'Turn your phone upright' screen over everything, from kit Screen + EmptyState; desktop windows never do. For any game whose style.json says orientation portrait (and the reverse for landscape games). Words in en.json turnPhone, height in layout.json turnPhoneHeight, one CSS rule in index.css (.turn-phone).
- Checks: `npm run test`, `npm run e2e:turn-phone`
- Added: 2026-10-30
- Fixes while frozen: none
