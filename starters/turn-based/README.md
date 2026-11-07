# Turn-based starter — tic-tac-toe

A tiny, complete turn-based game with **every framework module installed and wired**, its checks green on day one.
Two jobs:
- **A new game starts from it.** `/define` copies the closest starter; the new game's TDD only says what's different.
- **It tests every framework update** (F65 — Framework test game): the framework runs its checks on every module
  change, so a broken module is caught here before it reaches a real game.

What's in it: a main menu, two computer opponents with different characters, a board, Pause, Results, Settings,
Credits, placeholder sounds, saves (settings, progress, Continue), online play with
room codes, a 3-step first-game tutorial, crash catching, and the version on the menu and in Settings — all from the framework's modules.

## First: put the modules in
The starter commits only its own game — the module copies (`src/ui/kit`, `src/devkit`, `src/rooms`, … the folders in the
table at the bottom) are not in git (`.gitignore`). A fresh copy has none, so **run this once after copying it**:
```
npm install
npm run install-modules     → every module, fresh from ~/Documents/dev/framework (each module's own installer)
```
After that the copies are the game's own: update ONE module later with
`node ~/.claude/config/bmuz/scripts/install-module.mjs <module> .` (it runs the module's checks first). A new game made
from the starter deletes the module lines at the end of `.gitignore`, so its copies are committed like any game's.

## Run it
```
npm run dev              → http://localhost:6173  (press ` for the Dev Kit)
npm run party:dev        → the room server for online play, on this computer (port 6499: wrangler.json dev.port — the page reads the same line) — nothing is deployed
```
Online on this computer: `npm run party:dev` and `npm run dev`, open two browser windows, Play online → Create a room in
one, type its code in the other. (A phone on the same Wi-Fi reaches it too: open the Network link Vite prints.)

## Checks
| Command | What |
|---|---|
| `npm run check:fast` | unit tests · type check + build · lint · the UI kit's rules · every module's promises (code part) |
| `npm run check:framework` | every module's promises in the running game (live tuning, both pauses, snapshots, the UI at every size the orientation allows…) |
| `npm run smoke` | loads, plays one round against the computer at phone + desktop size, console clean |
| `npm run e2e:devkit-live` | the Dev Kit's main promise: a Tuning edit changes the running board; ⏸ / ◐ / the game's own Pause hold the bot; a Lessons tab edit shows in the running tutorial and Save changes only it |
| `npm run e2e:screens` | every screen (menu, board, Pause, Settings, Credits, results, lobby) at every size the game plays at (content/ui/style.json orientation — all 7 for "any"), checked with the UI kit's page check |
| `npm run e2e:online` | two browser tabs play a whole game, a rematch, then Escape / Back on the results → main menu, through `wrangler dev` (on the game's room port, wrangler.json dev.port = 6499, with its own storage folder) |
| `npm run e2e:tutorial` | a brand-new device's first game: the 3 tutorial steps at 4 sizes (words, spotlight, the bubble off the board), the nudge, Replay tutorial, none on a second load |
| `npm run check:shots` | before / after screenshots (`e2e/shots.mjs`, the BMUZ template): the menus, the board, Pause, the results of a fixed game (`?seed=7`) and the tutorial's first step at every size the game plays at, compared pixel by pixel with `e2e/shots-before/<platform>/` → `e2e-shots/report.html` (before · now · changed in red). A change meant to look different: `npm run shots:record`, look, commit. Recorded on Windows; on GitHub's Linux the screens are shot but not compared (text draws differently there) |
| `npm run check:full` | all of the above, side by side → `e2e-shots/checks.html` |

Every script starts its own servers on 6xxx ports and stops them. Playwright: `playwright-core` is pinned to 1.63.0
(the Chromium already on Muzzy's PCs); a newer one needs `npx playwright install chromium`.

## What a new game replaces first
1. **The rules** — `src/game/rules.ts` (the Table module's `Rules`: setup, legal moves, check, apply, who acts, what each
   seat sees) and its tests `src/game/rules.test.ts` (`selfTest` checks every Table promise). `party/rules.ts` runs the
   same rules on the room server.
2. **The AI's goals** — `src/ai/plug.ts` (WIN · BLOCK · BUILD here), the characters in `content/ai/personalities.json`,
   who's on the menu in `content/ai/opponents.json`.
3. **The board and the table** — `src/ui/Board.tsx` (kit Buttons here; a real game draws its own board),
   `src/world/TableWorld.tsx` (the game's own world behind the HUD: a felt colour here, `tableColour` — the HUD's words
   are light with a dark halo, so they need a picture or a mid-to-dark colour behind them) and `content/tuning/board.json`.
4. **The words** — `content/text/en.json` (every word a player reads).
5. **Art and sound** — `content/ui/style.json` (the UI kit's look: Clean), the sounds in `content/audio.json` (the
   placeholders are made by `npm run sounds` from `content/audio-placeholders.json` with ZzFX — swap in real recordings
   with the Dev Kit's Sound tab), `content/credits.json` for anything not made by us.
6. **The names** — `package.json` name, the save keys in `src/game/saves.ts` (they start with the game's name), the
   title in `index.html`, `wrangler.json` / `crashes/wrangler.json` names.
7. **Before the first release** — delete the `releases/` line in `.gitignore`: a released game commits its crash maps
   (`releases/<version>/maps/`, the crashes module's README); the starter never releases, so it doesn't keep them.

Then the game's TDD says what's different and keeps the module contracts below true.

## Your game's tutorial
A brand-new device's first game against the computer opens with 3 short steps (1 "This is your board — tap a square",
waits for the move · 2 "Three in a row wins" + Got it · 3 "Now beat {name}!" + Play). Built only from blocks: the
Tutorial module's step player, the UI kit's Spotlight, Callout (`keepClear` off the board), tips memory and nudge timer.
- **Change the words** — `content/text/en.json` → `"lessons"` → `"first-game"` (or the Dev Kit's Text tab, live). A line
  can differ per control: `{ "mouse": "Click a square…", "phone": "Tap a square…" }` (keys use the mouse line). Button
  words are `"lessons" → "shared"` (`next`, `gotIt`, `play`).
- **Change or add a step** — `content/lessons/first-game.json`, one object per step: `id`, `message` (a line id from
  en.json), `pointer` (a CSS selector — what the Spotlight lights and the bubble points at), `dim`, `while: "pause"`
  (the game waits; the bot's move too) and `button`, or `advance` (`{ "on": "event", "event": "placed", "where":
  { "by": "you" } }` = waits for your move). Every field: `src/tutorial/lessonTypes.ts` and the Tutorial module's README.
  **Measured (F201, inner-platform test):** adding a 4th step ("You play ✕. {name} plays ◯." pointing at the bot's seat,
  with Next) took one step object in the lesson file + one line in en.json, no code — 17 s from the first edit to seeing
  it play in the browser (by Claude; ~2 minutes by hand).
- **Or in the Dev Kit's Lessons tab** (Dev Kit 0.29.0), live while the game runs: every step's words id (with the words
  it stands for), button, while, dim, timings and pointer; ▶ plays it from any step (a fresh game vs the computer — the
  adapter's `lessons: { runner, start }` line, `src/devkit-game/adapter.ts`); an edit shows the next time its step starts;
  Save writes only what you changed into `content/lessons/first-game.json`.
- **Timing** — `content/tuning/lessons.json` (the Dev Kit's Tuning tab → Tutorial): when a step's button works, the
  nudge's glow and "Go on…" words while step 1 waits.
- **Turn it off** — delete `content/lessons/first-game.json` (no lesson file = it never starts) and the Replay tutorial
  row in `content/ui/settings.json`. **Play it again** — Settings →
  Gameplay → Replay tutorial. It plays once per device (the UI kit's tips memory, `first-game`, marked when Play is
  pressed — leaving early shows it again next time).
- **Checks** — scripted runs are a returning device (no lesson in the other e2e scripts); `?tutorial=fresh` makes one a
  new device: `npm run e2e:tutorial` plays it at 4 sizes. `npm run check:framework` checks every lesson file and that
  the step player runs on the rules clock. The connector (`src/tutorial-game/firstGame.ts`) is 58 lines, the look
  (`src/ui/LessonView.tsx`) 44.

## Which module does what (and where it's wired)
| Module | In this game | Wired in |
|---|---|---|
| Table (`src/table`) | the rules' contract, the move record, `selfTest` | `src/game/rules.ts`, `src/game/match.ts` |
| Dev Kit (`src/devkit`) | live tuning (`content/tuning/*.json` + `content/ai/pace.json`), the rules + looks clocks, ⏸ / ◐ pause, snapshots, bug capture, AI · Sound · Text tabs, the Lessons tab | `vite.config.ts`, `src/main.tsx`, `src/devkit-game/` (adapter + tabs), `tests/devkit-live.test.ts` |
| UI kit (`src/ui/kit`, Clean) | every screen: MainMenu, Hud, Pause, Results, Settings, Credits, Lobby | `src/ui/` (checked by `npm run check:ui`) |
| AI (`src/ai/kit`) | Careful Cleo (never misses a win or a block) and Careless Cass (misses blocks) — on the rules clock | `src/ai/`, `src/game/match.ts`, `party/rules.ts` |
| Audio (`src/audio`) | `playSound('mark.x')` etc.; the kit's buttons; Settings → Audio | `src/game/sound.ts`, `src/game/settings.ts` |
| Saves (`src/saves`) | settings, progress (wins / losses / draws), Continue (a game vs the computer, rebuilt from its moves); a golden save per version | `src/game/saves.ts`, `tests/saves/` |
| Rooms (`src/rooms`) | Play online: room codes, the lobby, rejoin after closing the tab, a bot plays for someone who left | `src/ui/OnlineScreen.tsx`, `party/` |
| Version (`src/version`) | `v0.1.0.0` on the main menu and at the bottom of Settings, stamped on snapshots; every e2e script refuses a stale build | `vite.config.ts`, `src/ui/`, `e2e/` |
| Tutorial (`src/tutorial`) | the 3-step "how to play" on a device's first game vs the computer — the step player on the rules clock, button words, words per control type (see "Your game's tutorial") | `src/tutorial-game/firstGame.ts`, `src/ui/LessonView.tsx`, `content/lessons/` |
| Crashes (`src/crashes`) | errors caught from the start, "Something broke · Reload" instead of a blank page, Settings → Send crash reports. Not live (no server deployed — Muzzy's call) | `src/main.tsx`, `vite.config.ts`, `src/game/settings.ts` |

## How it's put together (small on purpose)
- `src/main.tsx` — start-up, every module's start line, in order.
- `src/App.tsx` — the screen stack over the base screen (main menu · a game vs the computer · online).
- `src/game/` — the rules, the local match (`match.ts`: every move through the rules' one door, the bot's think time on
  the rules clock), saves, settings, sound.
- A random player goes first; scripted checks get a fixed game (`import.meta.env.DEV && navigator.webdriver` → you go
  first; `?seed=7` → the bot's choices replay). Tests pass `startMatch(opponent, { firstSeat })`.
- Decisions: `keepMatchDays` 7 (a live game) in `content/rooms.json`; rooms hold 2 seats; online, a player who goes idle
  or drops gets Careful Cleo playing for them. Esc or a phone's Back on the results = their Main menu button (F160:
  the game is over, so "back" leaves it — not the finished board with nothing to do but Pause); online too, where it
  leaves the room like their Leave button (F163: the online results open on the screen stack, `online-results`).
