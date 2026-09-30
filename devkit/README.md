# Dev Kit

Developer tools that live **inside** a web game (React + Vite). Press **`** (or triple-tap the top-right corner on a phone) to open the panel. Tabs across the top, one per tool. Every tool edits a `content/` JSON file, never code (Snapshots and Bug capture also talk to the running game through its adapter — see *Plug the game in*) — **Save** writes it (in `npm run dev`), **Copy for Claude** gives a plain-English list of what changed. The tool catalog (what's built, what's planned): `~/.claude/config/bmuz/DEVKIT.md`.

## What a game gets
| Tool | Does |
|---|---|
| Panel | ` / Esc / ✕ / triple-tap; ignores ` while the player types; floats above the game's popovers; stays open-able in release builds until 1.0 |
| Color | Colour-blind preview (3 types) + the 15 UI kit colours from `content/ui/style.json`, live, with ↺ back to the preset. A game without the UI kit gets only the preview |
| Tuning | Every number in `content/tuning/*.json` as a slider + number box (nested keys = headings, true/false = checkbox, text shown as-is), ↺ back to saved. Live in the game if it reads its tuning through `liveTuning` (below). Only shows when the game has `content/tuning/` files |
| Snapshots | Save "this exact moment" under a name → list (time, version, one-line summary) with **Restore** · **Copy for Claude** (the JSON) · **Save to file** (dev: `content/snapshots/<name>.json`, so Claude and tests can load it) · ✕. Kept in this browser (localStorage, per game); files in `content/snapshots/` are listed too. Restore is greyed out when the game says `canRestore()` is false (online). Needs the game adapter (below) |
| Bugs (Bug capture) | **● Record** keeps the last 60 s of the game's events + its state every 5 s (stays on after a reload) · **📍 Mark** "it happened here" (keeps that state) · "What went wrong?" · **Send to /bug** (dev: `.planning/bugs/capture-<date>-<time>.json`, where /bug keeps captures) · **Copy for Claude** (starts with `/bug —`; the only way out of a live build). The capture: note, version, device (userAgent, screen, window, orientation, touch), marks with their state, state now, events and states with `secondsAgo`. Needs the game adapter |
| Save endpoint | `npm run dev` only: writes `content/**.json` — plus bug captures in `.planning/bugs/`, nothing else; makes `content/snapshots/` and `.planning/bugs/` the first time (other missing folders are refused); keeps a file's `_help` note; no page reload for its own writes |
| Release switch | `content/devkit.json` `"inReleaseBuilds"`: `true` through beta (friends can open it on the live link, Copy for Claude only), `false` at 1.0 = no Dev Kit code in the live game at all |
| Release check | `npm run check:devkit` builds the game both ways and checks each in a browser (/deliver runs it) |

## Install or update
From this folder: `node scripts/install-devkit.mjs <game-folder>` (add `--dry-run` to see what would change first).
- `kit/` → the game's `src/devkit/` (browser code) and `vite/` → `vite-plugins/devkit/` (build code), each with a `VERSION` stamp. Tests stay here.
- Makes `content/devkit.json` and `src/devkit-game/tabs.ts` once; never overwrites them.
- Prints the wiring the game still needs — for a new game:
  1. `src/main.tsx`: `if (import.meta.env.DEV || __DEVKIT_IN_RELEASE__) import('./devkit/mount').then((m) => m.mountDevKit())`
  2. `vite.config.ts`: `import { devkit } from './vite-plugins/devkit/devkitVite'` and `plugins: [react(), devkit()]`
  3. `tsconfig.node.json`: `"vite-plugins"` in `"include"`
  4. `package.json`: `"check:devkit": "node src/devkit/check-devkit.mjs"` (needs Playwright: `npm install -D playwright`)

## Add a game's own tool (a game tab)
1. Make a component in `src/devkit-game/` — e.g. `TableTab.tsx`. Use `saveContentFile` / `copyText` / `CAN_SAVE` from `../devkit/saveContent`, `ColourRow` from `../devkit/color/ColourRow`, and the `devkit-footer` / `devkit-btn` classes for Save and Copy for Claude.
2. List it in `src/devkit-game/tabs.ts`: `{ id: 'table', label: 'Table', Panel: TableTab }`.
   Keep the tab file to just the component — helper functions go in their own file (e.g. `tableLogic.ts`), or eslint's react-refresh rule complains.

It shows after the kit's tabs. `src/devkit-game/` belongs to the game — updates never touch it. A tool other games would want goes here in the framework instead (`kit/`, then bump `kit/VERSION`).

## Plug the game in (Snapshots + Bug capture)
Those two tools need the game itself, but the Dev Kit never imports game code. The game hands it a small adapter, once,
from `src/devkit-game/tabs.ts` (which only loads with the Dev Kit — so the adapter never ships at 1.0, and main.tsx stays the same):

```ts
// src/devkit-game/myGameAdapter.ts
import type { DevKitGame } from '../devkit/devkitGame'
export const myGameAdapter: DevKitGame = {
  name: 'My Game',
  version: '0.1.0.12',                        // stamped on snapshots and captures
  getState: () => ({ board, turn }),          // this exact moment, as plain JSON (no Maps, Sets, classes, functions)
  setState: (state) => { /* put the game back to a getState() moment; throw with a plain reason if it's junk */ },
  canRestore: () => !isOnline,                // MUST be false in online games (tools that affect play are offline-only)
  onEvent: (send) => store.subscribe(() => send('Blue moved to C4-3')), // optional: short lines for the capture log; return "stop"
  describe: (state) => 'turn 12 · Blue to move', // optional: one line shown next to snapshots and marks
}

// src/devkit-game/tabs.ts
import { registerDevKitGame } from '../devkit/devkitGame'
import { myGameAdapter } from './myGameAdapter'
registerDevKitGame(myGameAdapter)
```
Without it, both tabs just say how to plug in. Glyphtender's `src/devkit-game/glyphtenderAdapter.ts` is a full example (a Zustand store).

## Live tuning in the game
The game keeps importing its own tuning JSON; it just wraps it so the Tuning tab's sliders reach it while it runs.
`src/devkit/tuning/liveTuning.ts` has no Dev Kit code in it, so it's safe in every build (with the Dev Kit off,
nothing sends edits and the values are simply the file's).

```ts
// Plain code (utils, store) — at the top of the file:
import physicsFile from '../../content/tuning/physics.json'
import { liveTuning } from '../devkit/tuning/liveTuning'
const physics = liveTuning('physics', physicsFile) // 'physics' = the file name without .json

// …then read .current where the value is used (never copy it into a top-level const):
if (speed > physics.current.maxReleaseSpeed) { /* … */ }

// A React / R3F component:
import { useLiveTuning } from '../devkit/tuning/liveTuning'
const physics = useLiveTuning('physics', physicsFile) // a ref — slider moves never re-render
useFrame(() => { body.setLinearDamping(physics.current.damping) })
```
Slider ranges: add `"_ranges": { "dice.bounce": [0, 1, 0.05] }` (min, max, step) to a tuning file when the guess is wrong
(guess: 0 → twice the value; whole numbers step by 1 up to at least 10; negatives from twice the value up to its opposite).
`_help` can be one note for the file, or one line per value (`{ "dragHeight": "how high…" }`) shown under each row.
Save keeps `_help` and `_ranges`, and writes number lists on one line.
A game that keeps its tuning in its own mutable object can follow edits with `onTuning('drag', (data) => Object.assign(drag, data))`.

## Knobs
- `content/devkit.json` → `inReleaseBuilds` (the switch above).
- The Color tab reads and saves `content/ui/style.json` (the UI kit's file).
- The Tuning tab reads and saves `content/tuning/*.json` — `_ranges` in a file sets its slider ranges.
- The Snapshots tab reads `content/snapshots/*.json` and saves there. Bug capture: `KEEP_MS` (60 s) and `STATE_EVERY_MS` (5 s) in `kit/capture/captureLog.ts`.

## Decisions
- **Game tabs = a file the kit imports (`src/devkit-game/tabs.ts`)**, not tabs passed to `mountDevKit()`. main.tsx stays one identical line in every game, and game tools load inside the Dev Kit's own lazy chunk, so at 1.0 they vanish from the live build with the rest of it. The installer makes the file once, so the import always resolves.
- **Two copy targets** (`src/devkit/` + `vite-plugins/devkit/`): the Vite plugin is Node code, which a game's browser tsconfig (`src/`) can't type-check.
- **The Color tab finds the UI kit with `import.meta.glob`**, so games without the UI kit still build (they just get the colour-blind preview).
- **Tuning reaches the game through a plain browser event (`devkit:tuning`), not a Dev Kit store.** The game owns
  its tuning (it imports its JSON as before); `liveTuning` / `useLiveTuning` wrap it in a box whose `.current` follows
  the event. That file imports nothing from the Dev Kit, so at 1.0 (Dev Kit off) the game still builds and ships with
  none of the kit — just a listener that never fires. A ref-style box instead of React state: per-frame (R3F) code reads
  it for free, and a slider drag never re-renders the game. The box also remembers the last edit, so code that starts
  later (a die made next round) gets the tuned value, not the file's.
- **The slider's range comes from the value as the page loaded**, so it doesn't shift under your finger while dragging.
- **Snapshots + Bug capture reach the game through an adapter the game registers (`registerDevKitGame`)**, not by importing
  its store. The kit stays engine-agnostic (Zustand, Unity-style classes, anything that can give and take plain JSON), and the
  adapter is registered from `src/devkit-game/tabs.ts`, so it rides in the Dev Kit's lazy chunk and disappears at 1.0 like
  the rest. `canRestore()` is asked every time, so a game can switch it off the moment it goes online.
- **Snapshots are kept in localStorage first, files second.** Saving a moment must work everywhere (friends on the live link
  too); a file needs the dev server. "Save to file" puts one in `content/snapshots/` so Claude and tests share it.
- **Bug captures go to `.planning/bugs/`, the one place outside `content/` the Save endpoint may write** — that's where /bug
  keeps them (its SKILL.md). Only `capture-*.json`-style names directly in that folder; nothing else in `.planning/`.
- **The capture log is a rolling window, not a recording.** Events and states older than 60 s are dropped as new ones
  arrive (and at most 500 events), so leaving ● Record on all session costs nothing. Marks are kept until Send/Clear.
  Copy for Claude leaves out the every-5-seconds states to stay pasteable; the saved file has them.
- **● Record is remembered across reloads** — a bug you didn't expect is exactly the one you weren't recording.
- **The release check reads the game's web path from the build** (`dist/index.html`), so nothing is hardcoded; `--port` (default 5198) and `--base` override.

## Develop
`npm install`, then `npm test` (panel, colour logic against the real UI kit, tuning logic + tab + live hook, game adapter registry, snapshot store + tab, capture log / recorder / report + tab, the Vite plugin in a real dev server, installer, release-check helpers) and `npm run typecheck`.
