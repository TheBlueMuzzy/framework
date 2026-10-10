# Dev Kit

Developer tools that live **inside** a web game (React + Vite). Press **`** (or triple-tap the top-right corner on a phone) to open the panel. Tabs across the top, one per tool. Every tool edits a `content/` JSON file, never code (Snapshots and Bug capture also talk to the running game through its adapter — see *Plug the game in*) — **Save** writes it (in `npm run dev`), **Copy for Claude** gives a plain-English list of what changed. The tool catalog (what's built, what's planned): `~/.claude/config/bmuz/DEVKIT.md`.

## What a game gets
| Tool | Does |
|---|---|
| Panel | ` / Esc / ✕ / triple-tap; ignores ` while the player types; floats above the game's popovers; stays open-able in release builds until 1.0. More tabs than fit (a phone) → ◀ ▶ + page dots, never a sideways scroll bar |
| Search | **Dev Kit 0.8.0: searches only the open tab** ("Search Tuning…", "Search Screens…"). Type and that tab filters live — case-insensitive, matching ANYWHERE in a word ("ade" finds spotlightFade), in the key (camelCase split: "trail fade" finds trailFade), its readable label, its help line, its section title and its file name; several words = all must match. Highlighted, with a count ("3 settings found") or "Nothing in Tuning matches…". Color, Tuning and AI filter their settings; Snapshots by name / summary / version; Bugs its 📍 marks; Screens by screen name, group, note, variant and moments. Tap a section title to clear the search and jump there. Picking another tab clears it. ✕ or Esc clears (the next Esc closes). 16 px text, so a phone doesn't zoom in |
| Sections | Settings sit in titled sections that open and close ("Trails · 6"), remembered per game in this browser; chips at the top of a tab jump to one; Expand all / Collapse all; a dot on a closed section that holds an unsaved change. Sections and readable names come from the game's files (*Naming settings*, below) |
| Color | Colour-blind preview (3 types) + the 15 UI kit colours from `content/ui/style.json`, live, with ↺ back to the preset. A game without the UI kit gets only the preview |
| Tuning | Every number in `content/tuning/*.json` as a slider + number box (true/false = checkbox, `#rrggbb` text = a colour picker, other text shown as-is), ↺ back to saved, in sections with readable names, the `file · key` under each name. Live in the game if it reads its tuning through `liveTuning` (below). Only shows when the game has `content/tuning/` files |
| Snapshots | Save "this exact moment" under a name → list (time, version, one-line summary) with **Restore** · **Copy for Claude** (the JSON) · **Save to file** (dev: `content/snapshots/<name>.json`, so Claude and tests can load it) · ✕. Kept in this browser (localStorage, per game); files in `content/snapshots/` are listed too. Restore is greyed out when the game says `canRestore()` is false (online). Needs the game adapter (below) |
| Bugs (Bug capture) | **● Record** keeps the last 60 s of the game's events + its state every 5 s (stays on after a reload) · **📍 Mark** "it happened here" (keeps that state) · "What went wrong?" · **Send to /bug** (dev: `.planning/bugs/capture-<date>-<time>.json`, where /bug keeps captures) · **Copy for Claude** (starts with `/bug —`; the only way out of a live build). The capture: note, version, device (userAgent, screen, window, orientation, touch), marks with their state, state now, events and states with `secondsAgo`. Needs the game adapter |
| AI (game tab, plugged in) | **Dev Kit 0.6.1.** Tune the game's AI opponents: pick a personality (or **Copy to new…** — copies its bio, and fills its name for players if the game says where), two-handled range sliders per trait (0–100, with number boxes), drag-to-reorder goal order (▲ ▼ on touch), nudge / focus (0–1) / chattiness / extras, steady goals (one row per goal, 0–1, empty = not set), mood-shift rows (reading · from → full · trait · by, + add / ✕), bio text, skill picker + its numbers. The game's own AI settings files (e.g. goals.json's big-moment bars, pace.json) as Tuning rows (slider + box + ↺, `_labels` / `_help` / `_sections` / `_ranges`). Problems from the game's `validate` (e.g. the AI kit's `personalityProblems`) show in red and hold Save back. **Save** writes `content/ai/*.json` (and the bio's text file) whole, notes and hand-written layout kept; Copy for Claude lists the changes. **▶ Watch**: a new all-AI game on the real board (seat 1 = the personality being edited, unsaved changes included) with each decision's note and per-bot belief bars (guessed score + how sure). **Run check** (6 / 20 / 60 games, the game runs them off the main thread) → a link to the Personality Check report. The search box finds its settings while it's open ("nerve", "wobble"). Needs `aiTab(…)` in `src/devkit-game/tabs.ts` (below) |
| Sound (game tab, plugged in) | **Dev Kit 0.7.0** (framework F30). Tune every sound in `content/audio.json` by ear while the game runs. **Sounds**: every sound grouped by volume group (effects · menus · ambience · music), filtered by the search box; each row ▶ · ▶×5 (5 plays 350 ms apart, to hear the variation) · ■ for loops · its feel tier · how many files. Tap a name → its editor: every knob as a slider / checkbox / choice with the file's plain-English `_labels` / `_help` / `_ranges` (the `sounds.*.knob` wildcard; a sound's own `sounds.<name>.knob` note wins), live in the game, ↺ to saved (a default the file never spelled out is left out again). **A / B**: ▶ A saved · ▶ B edit play the same picked file; "game plays A" swaps the running game to the saved sound until the next edit. **Files**: ▶ each, ↑ ↓, ✕ (out of the list — the file stays on disk), drop a file or pick one → the dev server converts it to MP3 (effects + menus mono 96 kbps, start trimmed to its onset; music + ambience stereo 128 kbps, untouched) into `public/audio/<folder>/<folder>_<object>_<action>_NN.mp3`, adds it as a variant, then asks source / author / licence / link → `content/credits.json` (CC0 · own work 🟢, CC-BY 🟡 with a credit line, NC / ND 🔴 warned). **Waveform** of the picked file with drag handles: trim start / end (orange), loop from / to (green, loops only). **Music** (Dev Kit 0.9.0, framework F28 — needs audio 0.2.0): every track in `music.tracks` with ▶ / ■; a **Now** line (play 2 of 3 · resting — back in 42 s) with **Rest now** / **Come back now** to test rests; a live **Intensity** slider (0–1, not saved — the game sets it) to hear layers fade; tap a track → each layer's volume / comes in at / full at intensity, and the track's rests (plays before a rest, rest shortest / longest, fades) and loop (loop, crossfade, loop points) as sliders — the `music.tracks.*.knob` / `music.tracks.*.layers.*.knob` wildcard notes. Streamed sounds get **stream** (auto · always · never) + **loop crossfade**. The Log shows music moments (♪ start · play · rest · stop). **Mixer**: the `buses` dB + `master.limiterDb` (the game's defaults, not the player's Settings) with live level meters (needs audio 0.1.2 `audio.level`), and buttons to hear each named mix (normal · paused · reveal…). **Log**: every play and drop, newest first, with the reason in plain words; Clear. Save writes `content/audio.json` (notes + layout kept). Needs `soundTab(…)` in `src/devkit-game/tabs.ts` (below) and ffmpeg for adding files |
| Screens (previews) | **Dev only.** Screens that are normally gated (an end screen, a handoff, a lobby with 4 players, an error) listed by group, one button per variant (2 / 3 / 4 players, host / guest…). Picking one opens it **in a sandbox over the game**: a full-window overlay badged PREVIEW with the variants, a size switch (fit / phone 390×844 / desktop 1440×900, scaled to fit), ↻ Replay, what the sandbox blocked (those in a dot carousel when they don't fit — on a phone, a row of their own), and ✕ Close (or Esc, or the phone's Back). Closing leaves the real game exactly as it was. Needs `src/devkit-game/previews.tsx` + one line in main.tsx (below) |
| Sound endpoints | `npm run dev` only (`vite/audioSave.ts`): `POST /__devkit/save-audio?folder=&stem=&bus=&ext=` (raw bytes) converts with ffmpeg and writes ONLY `public/audio/<sfx·ui·amb·mus·stg>/<stem>_NN.mp3` — the stem `category_object_action`, lower case, starting with its folder; the next free number, never overwriting; up to 80 MB. `POST /__devkit/add-credit` `{ entry }` appends a sound's credit to `content/credits.json`. Same-page only, like Save. ffmpeg = `FFMPEG_PATH` or `ffmpeg` on the PATH; missing → "install ffmpeg: winget install Gyan.FFmpeg" |
| Save endpoint | `npm run dev` only: writes `content/**.json` — plus bug captures in `.planning/bugs/`, nothing else; makes `content/snapshots/` and `.planning/bugs/` the first time (other missing folders are refused); keeps a file's `_help` note **and how it was written** (`vite/formatJson.ts`: what was on one line stays on one line, `1.0` stays `1.0`; new parts: short objects / lists of plain values on one line if they fit 120 characters) — so saving a hand-written file unchanged leaves `git diff` empty; no page reload for its own writes |
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
the overlay says so in red. For tests: the frame has `window.__devkitPreview` = `{ id, variant, ready, problems, counts, played }`.
Sample data: build it with the game's own engine (a seeded sim game) rather than hand-writing state — it keeps up when the rules change.
Every Dev Kit live edit (Tuning, Sound, Moments — `devkit:tuning`) is copied into the frame, so a preview follows the sliders.

### Moments (feel presets) — Dev Kit 0.8.0, framework F32
Watch one moment loop while you change its feel. In the same `previews.tsx`, `export const moments: DevKitMoment[]`
(`kit/moments/momentTypes.ts`); each one's `screen` is a preview id. The Screens list shows them under their screen; tapping
one opens that screen with a **Moments** panel beside it: ▶ plays it once, 🔁 loops it (every 0.5–8 s, default 2.5), its
knobs as Tuning rows (labels / help / ranges from each file's `_labels` / `_help` / `_ranges`, wildcards like
`sounds.*.volumeDb` too), and **Soft · Balanced · Punchy** sets every knob at once (then "custom" after a tweak). Live in
the game and the preview; **Save** writes each changed file whole. The sandbox stays silent until a moment plays.
```tsx
import type { DevKitMoment } from '../devkit/moments/momentTypes'
export const moments: DevKitMoment[] = [{
  id: 'score-pop', screen: 'board', label: 'Score pop', note: 'the +1s pop, the total flies to the score',
  play: async ({ round, looping, variant }) => { loadSampleBoard(); await castTwoBirds() }, // repeatable: set up every time
  knobs: [
    { file: 'content/tuning/feel.json', path: 'tiers.medium.grow' },                    // role guessed: size
    { file: 'content/audio.json', path: 'sounds.score.pop.volumeDb',                     // keys with dots work
      values: { soft: -12, balanced: -8, punchy: -5 } },                                // exact values win
  ],
}]
```
Presets without exact values use relative rules on the values the screen opened with (duration ×1.3 / ×1 / ×0.75, size
×0.6 / ×1 / ×1.4, volume −3 / 0 / +2 dB…) — the table and why: `.planning/design/devkit-moments.md`. Give `role` when the
key doesn't say what it does (`'size'`, `'duration'`…, or `'none'` to keep it out of presets).

## The AI tab (a game's AI opponents)
For a game using the framework AI module (`ai/`, content in `content/ai/`). The Dev Kit never imports the game's AI —
the game hands the tab its files as data plus optional callbacks (`kit/ai/aiTypes.ts` → `DevKitAi`):
```ts
// src/devkit-game/tabs.ts
import { aiTab } from '../devkit/ai/aiTabEntry'
import type { DevKitTab } from '../devkit/DevKit'
import { myGameAi } from './aiDevKit'
export const gameTabs: DevKitTab[] = [aiTab(myGameAi)]

// src/devkit-game/aiDevKit.ts
export const myGameAi: DevKitAi = {
  personalities: { path: 'content/ai/personalities.json', data: personalitiesFile, listKey: 'personalities' },
  skills: { path: 'content/ai/skills.json', data: skillsFile, listKey: 'skills' },
  bios: { path: 'content/text/en.json', data: en, at: (id) => ['ai', 'personality', id, 'bio'],   // optional
          nameAt: (id) => ['ai', 'personality', id, 'name'], nameFor: (id) => `the ${id}` },     // optional: Copy to new fills it
  settings: [{ path: 'content/ai/goals.json', data: goalsFile }],   // optional: the game's own AI settings files
  readings: ['myDanger', 'behind'],                         // optional: the mood-shift reading choices
  validate: (p) => personalityProblems(p, plug),            // optional: red problems, Save waits
  watch: (seats, onEvent) => startWatch(seats, onEvent),    // optional: all-AI game on the board; return "stop"
  runCheck: ({ games, personalities, skills, onProgress }) => runInWorker(…), // optional: → report HTML
}
```
Sections come from the files' own `_sections` (+ "AI: bio", "AI: watch a game", "AI: Personality Check"; a settings file's
`_sections` too — its rows are the Tuning tab's `FieldRow`, its `_help._file` line sits at the top); settings no
section lists go in "… — more". Names and help lines: `_labels` / `_help`, keyed by the path inside ONE item
(`traits.aggression`, `extras.nerve`), so one note fits every personality. Glyphtender's `src/devkit-game/aiDevKit.ts` is the full example.

## The Sound tab (a game's sounds)
For a game using the framework audio module (`audio/` → `src/audio/`, content in `content/audio.json`). The Dev Kit never imports
the audio module: the game hands over its engine getter and the file (`kit/sound/soundTypes.ts` → `SoundBoardAudio` is the shape it needs).
```ts
// src/devkit-game/tabs.ts
import audioJson from '../../content/audio.json'
import { getAudio } from '../audio'
import { soundTab } from '../devkit/sound/soundTabEntry'
export const gameTabs: DevKitTab[] = [aiTab(myGameAi), soundTab(getAudio, { file: audioJson })]
// options: path (default "content/audio.json") · tuningName (default "audio") · baseUrl (default import.meta.env.BASE_URL) · label
```
The game must hear the live edits (the audio README's start-up does): `onTuning('audio', (data) => audio.setConfig(data))`.
The tab also calls `audio.setConfig` itself. Its Panel takes the Dev Kit's search text as a `query` prop (only the open tab's).
Adding files needs ffmpeg on the computer (Windows: `winget install Gyan.FFmpeg`, Mac: `brew install ffmpeg`).

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
Save keeps `_help` and `_ranges`, and the file's layout (number lists on one line, as the file had them).
A game that keeps its tuning in its own mutable object can follow edits with `onTuning('drag', (data) => Object.assign(drag, data))`.

## Naming settings (sections + readable labels)
So an artist can find a setting, a tuning file can carry two more notes beside `_help` and `_ranges`. The keys
themselves never change for this — the game's code reads them.
```json
{
  "_help":     { "trailFade": "How long the trail takes to fade, in seconds." },
  "_labels":   { "trailFade": "Trail: fade time" },
  "_sections": { "Turn trails": ["trailLead", "trailFade"], "End screen: awards": ["awardPriority"] },
  "trailLead": 0.5, "trailFade": 0.2, "awardPriority": { "comeback": 9 }
}
```
- `_labels` — the name shown (and searched). None → made from the key: `trailFade` → "Trail fade".
- `_sections` — title → the keys in it, in order. A group key (`awardPriority`) brings all of its settings. The **same title
  in two files is one section** (a trail's timing in anim.json and its look in garden.json sit together). Keys left out
  go in a "`<file>.json (no section)`" section; a file with no `_sections` is one section named after the file, as before.
- `content/devkit.json` `"sectionOrder": ["Board look", "Turn trails", …]` — the order of the sections (others follow).
- Write a label so it reads alone in search results ("Spotlight: time per word", not "hold"), and say *colour* in a
  colour's label, so typing "colour" lists them all.
A game tab gets the search too: while it's open, its `Panel` receives the box's text as the `query` prop
(`Panel: ComponentType<{ query?: string }>`). Filter its rows with `filterSections` / `matchesAll`
(`kit/search/searchLogic.ts`), show them in `<Section>`s with `<Highlight>` and a `<SearchCount>` (`kit/search/Section.tsx`),
and `useContext(DevKitSearch).goTo(sectionId)` jumps to a section — Tuning and Color are the examples. A tab with nothing
to search sets `searchable: false` (no box).

## Knobs
- `content/devkit.json` → `inReleaseBuilds` (the switch above).
- The Color tab reads and saves `content/ui/style.json` (the UI kit's file).
- The Tuning tab reads and saves `content/tuning/*.json` — `_ranges` in a file sets its slider ranges; `_labels` / `_sections` name and group its settings, `content/devkit.json` `sectionOrder` orders the sections.
- Open/closed sections are kept in localStorage under `devkit-sections:<game name>`.
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
  whole items (the window is clipped to them), dots show where you are; nothing shows cut in half, nothing scrolls by accident, and a desktop never shows a
  scroll bar. The selected tab / a keyboard-focused item is always turned to. The paging is plain maths (`carouselPages.ts`, tested).
- **The tool tabs have their own full-width row** under a small title + ✕ row (Muzzy, 0.4.2: "the tabs/carousels move below it to take advantage of the full width of the panel") — more tabs per carousel page, and the title stays.
- **Search over the panel, sections inside the tabs** (Muzzy, 0.5.0: "it's SOO hard to find attributes … if the devkit is difficult to use, it becomes useless"). One box filters every settings tab at once, because Muzzy remembers *what* a knob does, not which tab or file it's in. Plain substring matching (no fuzzy ranking): predictable, and "what you typed is inside the word" is exactly what he asked for. The tabs stay mounted while searching (all tabs share one scrolling area) so unsaved edits survive, and a tab filters itself from the search text (a React context), so game tabs need no new props. Sections and labels live **in the content files** (`_labels`, `_sections`, next to `_help`) so Muzzy can rename and regroup in Obsidian, and Save keeps them.
- **Sections start closed** (when a tab has more than one), so a tab opens as a short list of titles + counts — the index itself; the chips are for jumping when sections are open.
- **The AI tab is a game tab the kit provides (`aiTab(…)`), not a kit tab** (0.6.0). Only games with an AI opponent want it, and its data (personalities, skills, bios) and its live parts (watch, check) are the game's — so the game lists it in `tabs.ts` with its plug, like Snapshots' adapter. The tab edits whole items in memory and Save writes each changed file whole with `{...file, personalities: list}` — `_help` / `_labels` / `_sections` ride along untouched.
- **The AI tab knows nothing of a game's goals** (0.6.1): steady rows come from the personality's own goal list, and goal
  settings (big-moment bars…) are just "the game's AI settings files" — any JSON with `_labels` / `_sections` / `_ranges`,
  shown with the Tuning tab's rows. A new AI knob in a game = a key in its file, not a Dev Kit change.
- **Save keeps the file's own layout, not a fixed style** (0.6.1). A fixed rule couldn't match files written by hand AND by
  older saves (en.json has one-line bios next to spread-out lists), and a first Save that reformats a file buries the real
  change in `git diff`. So the endpoint reads the old file's layout (`readLayout`) and only new parts get the rule of thumb.
- **Watch and Run check use the tab's current values, unsaved changes included** — the point is "drag a slider, see if it plays differently", without saving first.
- **The two-handled slider is two plain range inputs stacked** (only their handles take touches): keyboard, screen readers and Playwright all work with them as ordinary sliders; the number boxes beside them are for exact values on a phone.
- **The release check reads the game's web path from the build** (`dist/index.html`), so nothing is hardcoded; `--port` (default 5198) and `--base` override.

- **The Sound tab plays exact versions by swapping the config for one play** (0.7.0). The engine plays sounds by name, so ▶ on a file and A / B set a config with only that file (and, for A, the saved sound), play, and put the live config straight back — no engine API for "play this file" was needed.
- **Sound files are converted on the dev server with the system ffmpeg, not ffmpeg-static** (0.7.0): no 70 MB download in every game for a tool only the designer's machine uses; a missing ffmpeg says how to install it. The onset trim is the B026 rule (first sample ≥ 10 % of the peak, minus 4 ms, 3 ms fade-in), skipped for music + ambience.
- **The Music section's intensity slider is live-only** (0.9.0): intensity is something the GAME sets moment to moment (the reveal raises it), so it isn't a value in content/audio.json — the slider is for hearing the layers fade. Rests run on their own in the engine; the "Now" line polls `musicState()` 4 times a second, and Rest now / Come back now (`restMusic` / `endMusicRest`) test them without waiting a minute.

## Develop
`npm install`, then `npm test` (panel, Sound tab (list, knobs, A/B, files + upload + credits, mixer, log, wildcard notes, waveform maths, the knobs matching audio/kit/config.ts; Music section: tracks, layers, intensity, rests, the music knobs matching config.ts), save-audio + credit endpoints (path safety; conversion when ffmpeg is installed), AI tab (editor, save, copy, watch, check, search), dot carousel, screen previews (list, overlay, Esc / Back, sandbox blocks), colour logic against the real UI kit, tuning logic + tab + live hook, game adapter registry, snapshot store + tab, capture log / recorder / report + tab, the Vite plugin in a real dev server, installer, release-check helpers) and `npm run typecheck`.
- Before a version goes out, install it into a game and run the game's `npm run lint` too: the framework has no ESLint, and the games run React's hooks rules (Dev Kit 0.8.0 went out with 3 errors — setState inside an effect, a non-component export from a .tsx — fixed in 0.8.1).
