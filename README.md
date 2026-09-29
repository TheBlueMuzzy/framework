# Game Framework

Muzzy's library of reusable game modules. Games **copy** a module in (with a version stamp), so a framework change never breaks a finished game; improvements found in a game get copied back here.

## Modules
| Module | What it gives a game | Status |
|---|---|---|
| `ui-kit/` | Standard menus, settings, dialogs, HUD — one structure, 5 styles (Clean, Cozy, Cartoon, Pixel, Neon). Install: `ui-kit/scripts/install-kit.mjs` | ✅ released (v0.1), kit 0.1.x |
| `devkit/` | The in-game Dev Kit (` panel): colour tool + colour-blind preview, tuning sliders for `content/tuning/` (live in the game), Save to `content/`, release-build switch + check, game tabs. Web (React + Vite). Install: `devkit/scripts/install-devkit.mjs` | building (v0.2), kit 0.2.0 |

Design notes: `.planning/design/`. Plan: `.planning/ROADMAP.md`.
