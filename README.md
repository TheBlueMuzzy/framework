# Game Framework

Muzzy's library of reusable game modules. Games **copy** a module in (with a version stamp), so a framework change never breaks a finished game; improvements found in a game get copied back here.

## Modules
| Module | What it gives a game | Status |
|---|---|---|
| `ui-kit/` | Standard menus, settings, dialogs, HUD — one structure, 5 styles (Clean, Cozy, Cartoon, Pixel, Neon). Install: `ui-kit/scripts/install-kit.mjs` | ✅ released (v0.1), kit 0.3.2 (+ HandView: a hand drawn as a rack of places; Lobby bot rows; Keyboard: ↑ ↓ jump between controls, ← → work them, no stray text caret; `<Screen scroll>`: the whole screen scrolls, no scroll bar) |
| `devkit/` | The in-game Dev Kit (` panel): colour tool + colour-blind preview, tuning sliders for `content/tuning/` (live in the game), Snapshots (save/restore a moment), Bug capture (record · mark · send to /bug), Screens (dev-only previews of gated screens in a sandbox), Save to `content/`, release-build switch + check, game tabs. Web (React + Vite). Install: `devkit/scripts/install-devkit.mjs` | building (v0.2), kit 0.5.0 (+ search, sections, plain labels) |
| `rooms/` | Online rooms (PartyKit): short room codes, create/join, seats + host, rejoin by player id, host migration, idle players → bot, kick, rematch; a server base the game's rules plug into, sending each player only their own view. Harvested from Roll Better. Web (React + Vite). Install: `rooms/scripts/install-rooms.mjs` | building (first game: Glyphtender), kit 0.3.0 (+ per-seat events: sendEventPerSeat; bot profiles — the host picks which bot) |
| `table/` | The foundation a turn-based game's rules stand on: one rules contract (setup · legalActions · check · apply → state + events · isOver · toAct · viewFor), events tagged with who may see them, move record + replay, fast mode, a self-test any game runs. Pure TS. Install: `table/scripts/install-table.mjs` | building (v0.4, first game: Glyphtender v0.6), kit 0.1.0 (Game core) |

Design notes: `.planning/design/`. Plan: `.planning/ROADMAP.md`.
