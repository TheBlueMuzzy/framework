# Game Framework

Muzzy's library of reusable game modules. Games **copy** a module in (with a version stamp), so a framework change never breaks a finished game; improvements found in a game get copied back here.

The founding rule: **one game proves a module, a second makes it general.** A module only one game uses is **frozen** —
bug fixes only, no new features, until a second game needs it (F186 — Slimmed framework, from the 2026-11 audit).
How a game's part becomes a module, and how a module goes into a game: `.planning/design/module-recipe.md`.

## Modules
Install any of them with `node ~/.claude/config/bmuz/scripts/install-module.mjs <module> <game-folder>` (it runs the
module's own checks first). Each module's README says what it does in detail; its `UPGRADES.md` lists the hand steps
between versions; `CHANGELOG.md` has the history. An UPGRADES line that names a game ("Glyphtender's run keeps moves")
is checked in that game's code before it's written — v0.38's saves note named Glyphtender wrongly, and only its
rehearsal caught it.

| Module | What it gives a game | Proven by | Used by | Frozen? |
|---|---|---|---|---|
| `ui-kit/` | Every menu, settings, dialog, HUD and toast from one structure, in 7 styles (Clean, Cozy, Cartoon, Pixel, Neon, Dark console, Fantasy) picked in `content/ui/style.json`; its own layout rules (`check-ui`) and a screenshot gallery | Roll Better, then Glyphtender + Goops | Glyphtender (Cozy), Goops (Neon), Roll Better (Cartoon, an old copy) | no |
| `devkit/` | The in-game Dev Kit (the ` key): colour tool, live tuning sliders for `content/`, snapshots, bug capture, screen previews, the rules + looks clocks, pause, game tabs (AI, Sound, Text, Review), and `check:framework` — every module's promises checked in the running game | Roll Better, then Glyphtender | Glyphtender, Goops, Roll Better (an old copy) | no |
| `audio/` | Sound by naming moments (`playSound('seed.land')`), what each sounds like in `content/audio.json`; variation, voice limits, buses, ducking, the Settings audio tab, loudness checks | Glyphtender | Glyphtender, Goops | no |
| `version/` | The game's `vX.Y.Z.B` from `version.json` on the main menu, in Settings and on Dev Kit snapshots; an e2e check that refuses a stale build | Glyphtender + Goops (built for every game, F102) | Glyphtender, Goops | no |
| `lint/` | The game's own lint holds BMUZ's rules: settings live in `content/` (no named numbers or fixed timers in code), no React state set every frame, words a player reads live in `content/text/en.json` | Glyphtender | Glyphtender | no (small, and how the rules are enforced) |
| `table/` | The foundation turn-based rules stand on: one rules contract (setup · legal moves · check · apply → state + events · who acts · what each seat sees), a move record + replay, a self-test | Glyphtender | Glyphtender | **frozen** |
| `rooms/` | Online rooms on Muzzy's own Cloudflare (PartyServer + wrangler): room codes, seats + host, rejoin, idle players → a bot, rematch; a server the game's rules plug into | Roll Better's online code, then Glyphtender | Glyphtender | **frozen** |
| `ai/` | A fair, human-feeling computer player: personalities + skills in `content/ai/`, the game's plug teaches it the game; bots think on the rules clock; the Arena (AI-vs-AI games + the Personality Check, "What wins?", suggested sliders) | Glyphtender | Glyphtender | **frozen** |
| `crashes/` | Errors caught from the start, "Something broke · Reload" instead of a blank page, reports to the game's own crash server, read on the PC with source maps | Glyphtender | Glyphtender | **frozen** |
| `tutorial/` | Teaching the player, as blocks a game picks from: a step player that plays lessons from `content/lessons/` files (button words Next / Got it / Play, waiting for a tap / an event / a number / time, holding the game, hints, retries, one lesson at a time) and words per control type (keys / mouse / phone). The bubble, spotlight, tips memory and nudge timer are the UI kit's — its README lists the whole toolbox | Goops (its lesson player), then Glyphtender (the F197 trial) | Goops (swap rehearsed on a copy, F198; its own session swaps the real game) | no |
| `saves/` | Every save through one door: versioned, upgraded step by step, backed up, full or blocked storage never stops the game; Continue for a game in progress; golden-save checks so an update never breaks an old save | Glyphtender | Glyphtender | **frozen** |

Plus `starters/turn-based/` — tic-tac-toe with every module wired, its checks green: a new game starts from it, and the
framework's checks play it on every module change. It commits only its own game; `npm run install-modules` in a copy
puts today's modules in (`starters/README.md`).

Archived (no game used them; a git tag keeps each): the emotes module, the UI kit's emote parts and the AI's banter
(`archive/emotes-0.4.2`) · the UI kit's What's new panel (`archive/whats-new`) · Saves' save codes, link-code cloud,
leaderboards, replay, any-platform storage and save health (`archive/saves-0.7.0`). A game's own copy keeps working.

## Checks
- `npm run check:fast` here — every module's tests + type check, the lint, and the starter's checks with today's modules.
- GitHub's Checks (`.github/workflows/checks.yml`) — the same per module on every push, plus the starter's `check:full`.
- UI kit screenshots: `npm run shoot` in `ui-kit/` shoots the styles games use; `npm run shoot:all` all seven, before a UI kit release.

## Lint (one setup for every module)
`eslint.config.js` + `package.json` here hold the framework's only ESLint setup — the same rules the games use (typescript-eslint, React's hooks rules), minus the hot-reload export rule that doesn't fit library files. Run `npm install` here once. Then `npm run lint` in any module folder lints that module, or `npm run lint` here lints them all. Games ignore their kit copies on purpose, so this is the only place framework code gets linted. (The `lint/` module above is a different thing: the rules a GAME's own code is held to.)

Design notes: `.planning/design/`. Plan: `.planning/ROADMAP.md`.
