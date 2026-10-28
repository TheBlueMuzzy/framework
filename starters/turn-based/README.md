# Turn-based starter — tic-tac-toe

A tiny, complete turn-based game with **every framework module installed and wired**, its checks green on day one.
Two jobs:
- **A new game starts from it.** `/define` copies the closest starter; the new game's TDD only says what's different.
- **It tests every framework update** (F65 — Framework test game): the framework runs its checks on every module
  change, so a broken module is caught here before it reaches a real game.

What's in it: a main menu, two computer opponents with different characters, a board, Pause, Results, Settings,
Credits, placeholder sounds, emotes (and the bots' banter), saves (settings, progress, Continue), online play with
room codes, crash catching, and the version on the menu and in Settings — all from the framework's modules.

## Run it
```
npm install
npm run dev              → http://localhost:6173  (press ` for the Dev Kit)
npm run party:dev        → the room server for online play, on this computer (port 6499: wrangler.json dev.port — the page reads the same line) — nothing is deployed
```
Online on this computer: `npm run party:dev` and `npm run dev`, open two browser windows, Play online → Create a room in
one, type its code in the other. (A phone on the same Wi-Fi reaches it too: open the Network link Vite prints.)

## Checks
| Command | What |
|---|---|
| `npm run check:fast` | unit tests · type check + build · lint · the UI kit's rules · every module's promises (code part) |
| `npm run check:framework` | every module's promises in the running game (live tuning, both pauses, snapshots, the UI at 7 sizes…) |
| `npm run smoke` | loads, plays one round against the computer at phone + desktop size, console clean |
| `npm run e2e:devkit-live` | the Dev Kit's main promise: a Tuning edit changes the running board; ⏸ / ◐ / the game's own Pause hold the bot |
| `npm run e2e:screens` | every screen (menu, board, Pause, Settings, Credits, results, lobby) at 7 sizes, checked with the UI kit's page check |
| `npm run e2e:online` | two browser tabs play a whole game through `wrangler dev` (on the game's room port, wrangler.json dev.port = 6499, with its own storage folder) |
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
4. **The words** — `content/text/en.json` (every word a player reads, the bots' banter, the emotes).
5. **Art and sound** — `content/ui/style.json` (the UI kit's look: Clean), the sounds in `content/audio.json` (the
   placeholders are made by `npm run sounds` from `content/audio-placeholders.json` with ZzFX — swap in real recordings
   with the Dev Kit's Sound tab), `content/credits.json` for anything not made by us.
6. **The names** — `package.json` name, the save keys in `src/game/saves.ts` (they start with the game's name), the
   title in `index.html`, `wrangler.json` / `crashes/wrangler.json` names.
7. **Before the first release** — delete the `releases/` line in `.gitignore`: a released game commits its crash maps
   (`releases/<version>/maps/`, the crashes module's README); the starter never releases, so it doesn't keep them.

Then the game's TDD says what's different and keeps the module contracts below true.

## Which module does what (and where it's wired)
| Module | In this game | Wired in |
|---|---|---|
| Table (`src/table`) | the rules' contract, the move record, `selfTest` | `src/game/rules.ts`, `src/game/match.ts` |
| Dev Kit (`src/devkit`) | live tuning (`content/tuning/*.json` + `content/ai/pace.json`), the rules + looks clocks, ⏸ / ◐ pause, snapshots, bug capture, AI · Sound · Text tabs | `vite.config.ts`, `src/main.tsx`, `src/devkit-game/` (adapter + tabs), `tests/devkit-live.test.ts` |
| UI kit (`src/ui/kit`, Clean) | every screen: MainMenu, Hud, Pause, Results, Settings, Credits, Lobby | `src/ui/` (checked by `npm run check:ui`) |
| AI (`src/ai/kit`) | Careful Cleo (never misses a win or a block) and Careless Cass (misses blocks, chats) — on the rules clock | `src/ai/`, `src/game/match.ts`, `party/rules.ts` |
| Audio (`src/audio`) | `playSound('mark.x')` etc.; the kit's buttons; Settings → Audio | `src/game/sound.ts`, `src/game/settings.ts` |
| Emotes (`src/emotes`) | tap your seat for a phrase, a rival's to mute; bot banter is a bot pressing an emote; online through the room | `src/game/table.ts`, `src/ui/TableScreen.tsx`, `party/server.ts` |
| Saves (`src/saves`) | settings, progress (wins / losses / draws), Continue (a game vs the computer, rebuilt from its moves), emote + banter saves; a golden save per version | `src/game/saves.ts`, `tests/saves/` |
| Rooms (`src/rooms`) | Play online: room codes, the lobby, rejoin after closing the tab, a bot plays for someone who left | `src/ui/OnlineScreen.tsx`, `party/` |
| Version (`src/version`) | `v0.1.0.0` on the main menu and at the bottom of Settings, stamped on snapshots; every e2e script refuses a stale build | `vite.config.ts`, `src/ui/`, `e2e/` |
| Crashes (`src/crashes`) | errors caught from the start, "Something broke · Reload" instead of a blank page, Settings → Send crash reports. Not live (no server deployed — Muzzy's call) | `src/main.tsx`, `vite.config.ts`, `src/game/settings.ts` |

## How it's put together (small on purpose)
- `src/main.tsx` — start-up, every module's start line, in order.
- `src/App.tsx` — the screen stack over the base screen (main menu · a game vs the computer · online).
- `src/game/` — the rules, the local match (`match.ts`: every move through the rules' one door, the bot's think time on
  the rules clock), saves, settings, sound, emotes + banter.
- A random player goes first; scripted checks get a fixed game (`import.meta.env.DEV && navigator.webdriver` → you go
  first; `?seed=7` → the bot's choices replay). Tests pass `startMatch(opponent, { firstSeat })`.
- Decisions: `keepMatchDays` 7 (a live game) in `content/rooms.json`; rooms hold 2 seats; online, a player who goes idle
  or drops gets Careful Cleo playing for them. Esc or a phone's Back on the results = their Main menu button (F160:
  the game is over, so "back" leaves it — not the finished board with nothing to do but Pause).
