# Starters

Tiny playable games with every framework module installed and wired, their checks green on day one.

- `turn-based/` — tic-tac-toe: menus, an AI opponent, sounds, emotes, saves and online play (v0.24, F151 — Turn-based starter)
- `realtime/` — from Goops' wiring (v0.24, F64 — Realtime starter)

What they're for:
- **A new game starts from one.** `/define` copies the closest starter, and the game's TDD only describes what's different.
- **They test every framework update.** The framework's checks play them on every module change (F65 — Framework test game), so a broken update is caught here, before it reaches a real game.
