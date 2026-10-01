# Dev Kit

Developer tools that live **inside** a web game (React + Vite). Press **`** (or triple-tap the top-right corner on a phone) to open the panel. Tabs across the top, one per tool. Every tool edits a `content/` JSON file, never code (Snapshots and Bug capture also talk to the running game through its adapter — see *Plug the game in*) — **Save** writes it (in `npm run dev`), **Copy for Claude** gives a plain-English list of what changed. The tool catalog (what's built, what's planned): `~/.claude/config/bmuz/DEVKIT.md`.

## What a game gets
| Tool | Does |
|---|---|
| Panel | ` / Esc / ✕ / triple-tap; ignores ` while the player types; floats above the game's popovers; stays open-able in release builds until 1.0. More tabs than fit (a phone) → ◀ ▶ + page dots, never a sideways scroll bar |
| Color | Colour-blind preview (3 types) + the 15 UI kit colours from `content/ui/style.json`, live, with ↺ back to the preset. A game without the UI kit gets only the preview |
| Tuning | Every number in `content/tuning/*.json` as a slider + number box (nested keys = headings, true/false = checkbox, text shown as-is), ↺ back to saved. Live in the game if it reads its tuning through `liveTuning` (below). Only shows when the game has `content/tuning/` files |
| Snapshots | Save "this exact moment" under a name → list (time, version, one-line summary) with **Restore** · **Copy for Claude** (the JSON) · **Save to file** (dev: `content/snapshots/<name>.json`, so Claude and tests can load it) · ✕. Kept in this browser (localStorage, per game); files in `content/snapshots/` are listed too. Restore is greyed out when the game says `canRestore()` is false (online). Needs the game adapter (below) |
| Bugs (Bug capture) | **● Record** keeps the last 60 s of the game's events + its state every 5 s (stays on after a reload) · **📍 Mark** "it happened here" (keeps that state) · "What went wrong?" · **Send to /bug** (dev: `.planning/bugs/capture-<date>-<time>.json`, where /bug keeps captures) · **Copy for Claude** (starts with `/bug —`; the only way out of a live build). The capture: note, version, device (userAgent, screen, window, orientation, touch), marks with their state, state now, events and states with `secondsAgo`. Needs the game adapter |
| Screens (previews) | **Dev only.** Screens that are normally gated (an end screen, a handoff, a lobby with 4 players, an error) listed by group, one button per variant (2 / 3 / 4 players, host / guest…). Picking one opens it **in a sandbox over the game**: a full-window overlay badged PREVIEW with the variants, a size switch (fit / phone 390×844 / desktop 1440×900, scaled to fit), ↻ Replay, what the sandbox blocked (those in a dot carousel when they don't fit — on a phone, a row of their own), and ✕ Close (or Esc, or the phone's Back). Closing leaves the real game exactly as it was. Needs `src/devkit-game/previews.tsx` + one line in main.tsx (below) |
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

## Screen previews (the Screens tab)
For a quick look at a screen you'd otherwise have to play your way to. **Dev only** — the tab is loaded behind
`import.meta.env.DEV`, so no release build has it, even while `inReleaseBuilds` is true (`check:devkit` checks both builds).

How it stays harmless: a preview is the game's own page loaded again in a frame (`?devkit-preview=<id>&variant=<id>`),
so it has its OWN copy of every store, screen stack and toast — the preview fills those with sample data, never the real
game's. Before anything runs, the frame blocks what it still shares with the real page (`kit/previews/sandbox.ts`):
storage writes stay in the frame (reads see them), WebSockets never connect, fetch / XHR / sendBeacon may only GET,
BroadcastChannel is mute, history steps do nothing, sounds are silent, no service worker, no new windows. Each block is
counted (the bar shows it). Buttons inside still work — a New game starts IN the frame — they just can't reach out. The overlay
is a modal `<dialog>` (the game underneath can't be touched); Esc / ✕ / Back close it; Back is caught by one history entry
pushed on open with the SAME state (so the game's screen stack, which counts its entries, sees nothing change).

Wiring, once per game:
```tsx
// src/main.tsx — before the normal start (service worker, Dev Kit, render <App />), which goes in the else:
if (import.meta.env.DEV && location.search.includes('devkit-preview=')) {
  import('./devkit/previews/frame').then((m) => m.startPreviewFrame({ app: <App />, root: document.getElementById('root')! }))
} else {
  startGame()
}
```
The list — `src/devkit-game/previews.tsx` (found by name, like the Color tab finds the UI kit):
```tsx
import type { DevKitPreview } from '../devkit/previews/previewTypes'
export const previews: DevKitPreview[] = [
  {
    id: 'end-table', label: 'End table', group: 'End of game', note: 'The results, straight away',
    variants: [{ id: '2p', label: '2 players' }, { id: '4p', label: '4 players' }],
    hint: 'phone',                      // optional: a tag, and opens in the phone-sized frame
    async show({ variant, failRequests, afterRender }) {
      // runs IN THE FRAME: fill the game's stores with sample data, open the screen
      useGameStore.getState().loadState(sampleFinishedGame(variant))
      screens.push('gameOver')
      // return nothing to draw the normal <App />, or a tree to draw instead (e.g. the app without its live connection)
    },
  },
]
```
`failRequests('words.csv')` makes a GET fail (an error screen); `afterRender(fn)` runs once it has drawn. If `show` throws,
the overlay says so in red. For tests: the frame has `window.__devkitPreview` = `{ id, variant, ready, problems, counts }`.
Sample data: build it with the game's own engine (a seeded sim game) rather than hand-writing state — it keeps up when the rules change.

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
- **Screen previews run in a frame, not over the real stores.** A screen that reads global stores directly (Zustand and
  friends) can't be handed sample data without changing the game; a second copy of the page has its own stores for free,
  so the game needs no "preview mode" in its screens and a preview can't leave anything behind. The cost — a second page
  load (about a second in dev) — is fine for a review tool. The few things two same-site pages share are blocked in the frame
  (sandbox.ts), and counted so a test can prove nothing got through.
- **Previews are dev-only, unlike the other tools.** They carry sample-data code and a second boot path that friends on the
  live link don't need; the tab hides behind `import.meta.env.DEV` (a lazy import a release build drops) and main.tsx's frame
  branch does too. `check:devkit` fails if `bmuz-devkit-previews` or `devkit-preview=` is in either build.
- **Rows that don't fit page with a dot carousel (`kit/carousel/`), not a scroll bar** (Muzzy, 0.4.1). ◀ ▶ step a page of
  whole items, dots show where you are; nothing fits half-cut, nothing scrolls by accident, and a desktop never shows a
  scroll bar. The selected tab / a keyboard-focused item is always turned to. The paging is plain maths (`carouselPages.ts`, tested).
- **The release check reads the game's web path from the build** (`dist/index.html`), so nothing is hardcoded; `--port` (default 5198) and `--base` override.

## Develop
`npm install`, then `npm test` (panel, dot carousel, screen previews (list, overlay, Esc / Back, sandbox blocks), colour logic against the real UI kit, tuning logic + tab + live hook, game adapter registry, snapshot store + tab, capture log / recorder / report + tab, the Vite plugin in a real dev server, installer, release-check helpers) and `npm run typecheck`.
