# Dev Kit

Developer tools that live **inside** a web game (React + Vite). Press **`** (or triple-tap the top-right corner on a phone) to open the panel. Tabs across the top, one per tool. Every tool edits a `content/` JSON file, never code (Snapshots and Bug capture also talk to the running game through its adapter — see *Plug the game in*) — **Save** writes it (in `npm run dev`), **Copy for Claude** gives a plain-English list of what changed. The tool catalog (what's built, what's planned): `~/.claude/config/bmuz/DEVKIT.md`.

## What a game gets
| Tool | Does |
|---|---|
| Panel | ` / Esc / ✕ / triple-tap; ignores ` while the player types; floats above the game's popovers; stays open-able in release builds until 1.0. More tabs than fit (a phone) → ◀ ▶ + page dots, never a sideways scroll bar; on a desktop every tab is always in view (a second row when needed, 0.20.2) |
| Pause | **Dev Kit 0.18.0.** Two buttons left of the DEV KIT title (dev and release builds): **⏸ Full pause** — everything freezes exactly as it is: the page's animation frames are held (and released on resume), CSS / Web animations, `<audio>` / `<video>` and AudioContexts pause, both of the game's clocks stop (`gameClock.ts`), then the adapter's optional `pause('full')`. The panel itself keeps working. A live edit (Tuning, Moments…) while frozen redraws ONE frame with no time passing, so you see it on the frozen picture. **◐ Half pause** — only the **rules clock** stops; the **looks clock** (pulses, glows, idle motion) keeps going. Shows only when the game reads `rulesClock` or its adapter lists `pauseModes: ['full', 'half']`. Pressing the lit button resumes, the other switches; a **PAUSED / HALF-PAUSED** badge on the title; closing the panel does NOT resume — a small **⏸ PAUSED** badge stays on screen (tap = resume), by default in the middle of the left edge — clear of the HUD rows games put at the top and bottom (0.18.1; it used to sit top-centre over Goops's "CRACKS 0/10"); `content/devkit.json` `"pauseBadgeSpot"` moves it (`left` · `right` · `top` · `bottom` · `top-left` · `top-right` · `bottom-left` · `bottom-right`), always inside the phone's safe area; **P** in the panel cycles off → full → half → off (a letter in a text box). Online games: both greyed out with the reason (`canPause()`, else `canRestore()`) |
| Search | **Dev Kit 0.8.0: searches only the open tab** ("Search Tuning…", "Search Screens…"). Type and that tab filters live — case-insensitive, matching ANYWHERE in a word ("ade" finds spotlightFade), in the key (camelCase split: "trail fade" finds trailFade), its readable label, its help line, its section title and its file name; several words = all must match. Highlighted, with a count ("3 settings found") or "Nothing in Tuning matches…". Color, Tuning and AI filter their settings; Snapshots by name / summary / version; Bugs its 📍 marks; Screens by screen name, group, note, variant and moments. Tap a section title to clear the search and jump there. Picking another tab clears it. ✕ or Esc clears (the next Esc closes). 16 px text, so a phone doesn't zoom in |
| Sections | Settings sit in titled sections that open and close ("Trails · 6"), remembered per game in this browser; chips at the top of a tab jump to one; Expand all / Collapse all; a dot on a closed section that holds an unsaved change. Sections and readable names come from the game's files (*Naming settings*, below) |
| Color | Colour-blind preview (3 types) + the 15 UI kit colours from `content/ui/style.json`, live, with ↺ back to the preset, then "UI shape & feel" (corners, shadows, timings, fonts as text…). A game without the UI kit gets only the preview |
| Fonts | **Dev Kit 0.17.0** (needs UI kit 0.16.0). Pick the game's **Title, Heading, Body and Numbers** fonts (the kit's text roles `font-title` · `font-heading` · `font-body` · `font-numbers`) by trying them side by side. **Fonts in the game**: the UI kit's 7 + the game's own (`content/ui/fonts.json`, files in `public/fonts/`), each with a licence chip — 🟢 `commercial-ok` · 🟡 `credit-needed` · 🔴 `non-commercial` / `unknown` — its licence note and its note (a pixel font's native size). **One section per role**: a dropdown, and the same sample line in EVERY font at that role's real size in the game (titles in the style's letter case) plus A–Z / 0–9 — tap one to pick it, live in the game at once; a pixel font (`pixelSize` in fonts.json) says "crisp (8 px × 3)" or "soft at 22 px — crisp at 16 · 24 · 32 px"; ↺ back to saved per role. The sample lines are the game's own words: fonts.json `"samples": { "title", "heading", "body", "numbers" }`. **Font library** (`npm run dev` only): every .ttf / .otf / .woff / .woff2 in the designer's font folder (sub-folders too), searchable — **Try** puts it in every comparison (loaded from the dev server, nothing copied), **Add to game** copies the font + the licence / readme / picture files beside it into `public/fonts/<its folder>/`, lists it in fonts.json (🔴 `unknown` until someone reads its licence) and in `content/credits.json`. Save waits while a role uses a library font that isn't added. **Save** writes the four values into `content/ui/style.json` "tweaks" (nothing else in the file changes); Copy for Claude lists them. Shares its values with the Color tab (`color/styleStore.ts`). Only when the game has the UI kit |
| Tuning | Every number in `content/tuning/*.json` as a slider + number box (true/false = checkbox, `#rrggbb` text = a colour picker, text listed in the file's `_choices` = a dropdown (Dev Kit 0.10.0: `{ "styles.draft": ["A","B"] }` or `{ "styles.draft": { "A": "A · Pick it up" } }`), other text shown as-is), ↺ back to saved, in sections with readable names, the `file · key` under each name. Live in the game if it reads its tuning through `liveTuning` (below). Only shows when the game has `content/tuning/` files |
| Snapshots | Save "this exact moment" under a name → list (time, version, one-line summary) with **Restore** · **Copy for Claude** (the JSON) · **Save to file** (dev: `content/snapshots/<name>.json`, so Claude and tests can load it) · ✕. Kept in this browser (localStorage, per game); files in `content/snapshots/` are listed too. Restore is greyed out when the game says `canRestore()` is false (online). Needs the game adapter (below) |
| Bugs (Bug capture) | **● Record** keeps the last 60 s of the game's events + its state every 5 s (stays on after a reload) · **📍 Mark** "it happened here" (keeps that state) · "What went wrong?" · **Send to /bug** (dev: `.planning/bugs/capture-<date>-<time>.json`, where /bug keeps captures) · **Copy for Claude** (starts with `/bug —`; the only way out of a live build). The capture: note, version, device (userAgent, screen, window, orientation, touch), marks with their state, state now, events and states with `secondsAgo`. Needs the game adapter |
| AI (game tab, plugged in) | **Dev Kit 0.6.1.** Tune the game's AI opponents: pick a personality (or **Copy to new…** — copies its bio, and fills its name for players if the game says where), two-handled range sliders per trait (0–100, with number boxes), drag-to-reorder goal order (▲ ▼ on touch), nudge / focus (0–1) / chattiness / extras, steady goals (one row per goal, 0–1, empty = not set), mood-shift rows (reading · from → full · trait · by, + add / ✕), bio text, skill picker + its numbers. The game's own AI settings files (e.g. goals.json's big-moment bars, pace.json) as Tuning rows (slider + box + ↺, `_labels` / `_help` / `_sections` / `_ranges`). Problems from the game's `validate` (e.g. the AI kit's `personalityProblems`) show in red and hold Save back. **Save** writes `content/ai/*.json` (and the bio's text file) whole, notes and hand-written layout kept; Copy for Claude lists the changes. **▶ Watch**: a new all-AI game on the real board (seat 1 = the personality being edited, unsaved changes included) with each decision's note and per-bot belief bars (guessed score + how sure). **Run check** (6 / 20 / 60 games, the game runs them off the main thread) → a link to the Personality Check report. The search box finds its settings while it's open ("nerve", "wobble"). Needs `aiTab(…)` in `src/devkit-game/tabs.ts` (below) |
| Sound (game tab, plugged in) | **Dev Kit 0.7.0** (framework F30). Tune every sound in `content/audio.json` by ear while the game runs. **Sounds**: every sound grouped by volume group (effects · menus · ambience · music), filtered by the search box; each row ▶ · ▶×5 (5 plays 350 ms apart, to hear the variation) · ■ for loops · its feel tier · how many files. Tap a name → its editor: every knob as a slider / checkbox / choice with the file's plain-English `_labels` / `_help` / `_ranges` (the `sounds.*.knob` wildcard; a sound's own `sounds.<name>.knob` note wins), live in the game, ↺ to saved (a default the file never spelled out is left out again). **A / B**: ▶ A saved · ▶ B edit play the same picked file; "game plays A" swaps the running game to the saved sound until the next edit. **Files**: ▶ each, ↑ ↓, ✕ (out of the list — the file stays on disk), drop a file or pick one → the dev server converts it to MP3 (effects + menus mono 96 kbps, start trimmed to its onset; music + ambience stereo 128 kbps, untouched) into `public/audio/<folder>/<folder>_<object>_<action>_NN.mp3`, adds it as a variant, then asks source / author / licence / link → `content/credits.json` (CC0 · own work 🟢, CC-BY 🟡 with a credit line, NC / ND 🔴 warned). **Waveform** of the picked file with drag handles: trim start / end (orange), loop from / to (green, loops only). **Music** (Dev Kit 0.9.0, framework F28 — needs audio 0.2.0): every track in `music.tracks` with ▶ / ■; a **Now** line (play 2 of 3 · resting — back in 42 s) with **Rest now** / **Come back now** to test rests; a live **Intensity** slider (0–1, not saved — the game sets it) to hear layers fade; tap a track → each layer's volume / comes in at / full at intensity, and the track's rests (plays before a rest, rest shortest / longest, fades) and loop (loop, crossfade, loop points) as sliders — the `music.tracks.*.knob` / `music.tracks.*.layers.*.knob` wildcard notes. Streamed sounds get **stream** (auto · always · never) + **loop crossfade**. The Log shows music moments (♪ start · play · rest · stop). **Mixer**: the `buses` dB + `master.limiterDb` (the game's defaults, not the player's Settings) with live level meters (needs audio 0.1.2 `audio.level`), and buttons to hear each named mix (normal · paused · reveal…). **Log**: every play and drop, newest first, with the reason in plain words; Clear. Save writes `content/audio.json` (notes + layout kept). Needs `soundTab(…)` in `src/devkit-game/tabs.ts` (below) and ffmpeg for adding files |
| Review list (game tab, plugged in) | **Dev Kit 0.11.0** (Glyphtender F70 — its Words tab). A list of things to look at one by one and mark: each row is one button with a 3-state box — click (or Space / Enter) cycles **Open** (empty box) → **Yes** (green ✓) → **No** (red ✗) → Open; its name and title say the state. Order: Open first, then Yes, then No, A–Z inside each — the list does NOT move while you click (rows never jump under the cursor); it sorts again on load and after Save. A changed row gets an orange edge + dot; a counts line ("412 open · 6 yes · 502 no — 3 unsaved"). **Save** (off with nothing changed) hands the game ONLY the changed rows; a failed Save shows why and keeps them; Undo unsaved; Copy for Claude lists the changes (the main button in a release build). A failed load says why, with Retry. The search box filters by label and detail ("3 words found"). Fine at ~1,000 rows (a plain list). Needs `reviewTab(…)` in `src/devkit-game/tabs.ts` (below) |
| Text (game tab, plugged in) | **Dev Kit 0.13.0.** Every player-facing string in `content/text/en.json`, editable. Sections = the file's top-level keys (an object inside = an indented sub-section); a list of pages stays in its section, each string named from there ("pages › 2 › body") with its full key under it; `_help` notes show grey under their section; numbers / true-false shown, not edited. Boxes grow to fit; `{placeholders}` the game fills in are listed under the box, and an edit that loses one shows "{n} is missing — the game fills it in" and **Save waits**. Changed boxes are highlighted with ↺ each; "N changes" line; **Save** writes the whole file (same keys, order and layout — a no-change save is byte-identical) and the game hot-reloads its words; Undo unsaved; Copy for Claude = `key: "old" → "new"` lines. The search box filters by key or words ("3 strings found"). Needs `textTab(…)` in `src/devkit-game/tabs.ts` (below) |
| Screens (previews) | **Dev only.** Screens that are normally gated (an end screen, a handoff, a lobby with 4 players, an error) listed by group, one button per variant (2 / 3 / 4 players, host / guest…). Picking one opens it **in a sandbox over the game**: a full-window overlay badged PREVIEW with the variants, a size switch (fit / phone 390×844 / desktop 1440×900, scaled to fit), ↻ Replay, what the sandbox blocked (those in a dot carousel when they don't fit — on a phone, a row of their own), and ✕ Close (or Esc, or the phone's Back). Closing leaves the real game exactly as it was. Needs `src/devkit-game/previews.tsx` + one line in main.tsx (below) |
| Sound endpoints | `npm run dev` only (`vite/audioSave.ts`): `POST /__devkit/save-audio?folder=&stem=&bus=&ext=` (raw bytes) converts with ffmpeg and writes ONLY `public/audio/<sfx·ui·amb·mus·stg>/<stem>_NN.mp3` — the stem `category_object_action`, lower case, starting with its folder; the next free number, never overwriting; up to 80 MB. `POST /__devkit/add-credit` `{ entry }` appends a sound's credit to `content/credits.json`. Same-page only, like Save. ffmpeg = `FFMPEG_PATH` or `ffmpeg` on the PATH; missing → "install ffmpeg: winget install Gyan.FFmpeg" |
| Save endpoint | `npm run dev` only: writes `content/**.json` — plus bug captures in `.planning/bugs/`, nothing else; makes `content/snapshots/` and `.planning/bugs/` the first time (other missing folders are refused); keeps a file's `_help` note **and how it was written** (`vite/formatJson.ts`: what was on one line stays on one line, `1.0` stays `1.0`; new parts: short objects / lists of plain values on one line if they fit 120 characters) — so saving a hand-written file unchanged leaves `git diff` empty; no page reload for its own writes |
| Release switch | `content/devkit.json` `"inReleaseBuilds"`: `true` through beta (friends can open it on the live link, Copy for Claude only), `false` at 1.0 = no Dev Kit code in the live game at all |
| Release check | `npm run check:devkit` builds the game both ways and checks each in a browser (/deliver runs it) |
| Framework check | **0.19.0.** `npm run check:framework` runs every installed module's promise checks on the real game and says what to wire where (*What a game must provide*, below) |

## What a game must provide
The Dev Kit's job is to change the RUNNING game live (MODULE-CONTRACTS.md, `~/.claude/config/bmuz/`). A game is wired
for it when:
1. **Tuning is read where it's used** — every `content/tuning/*.json` import is live by default (the Vite plugin), so
   the game only has to never copy a value once at load (`const speed = tank.cameraSpeed` at the top of a file, a
   named import, `?raw`). A file that copies on purpose: `content/devkit.json` `"liveGuardAllow": { "src/x.ts": "why" }`.
2. **Two clocks** (`src/devkit/gameClock.ts`): the engine ticks by `dt × rulesClock.rate`, game-logic timers are
   `rulesClock.after / every`, presentation time is `looksClock` — never `setTimeout` / `setInterval` /
   `performance.now()` for anything that changes the game.
3. **An adapter** registered in `src/devkit-game/tabs.ts` (*Plug the game in*, below), with the optional
   `conformance` section so the checks can reach live play:
   ```ts
   conformance: {
     startPlay: async () => { /* from the page as it loads to live play: click Start, wait until play runs */ },
     query: '?seed=7',      // optional: a fixed, replayable game
   },
   ```
4. **Pause works**: ⏸ full pause freezes screen, clocks and state; ◐ half pause stops the rules and the state while the
   looks run (comes free with 2).
5. **Seeded randomness** (`?seed=`) so snapshots and captures replay; **Screens previews** for gated screens;
   **hotkeys skip text boxes**; `data-knobs` on tunable things when the game uses Select.

**How it's checked — `npm run check:framework`** (0.19.0, `kit/check-framework.mjs` → the game's `src/devkit/`). It
finds every framework module the game has installed (its `src/…/VERSION` file), runs that module's own checks
(`conformance.mjs`, shipped inside each kit) and prints one report; every failure says what to wire and in which file.
`--static` = only the code checks · `--only devkit,ui` · `--port` (default 5197). Needs `playwright-core` + its
Chromium. The Dev Kit's own checks:
| Check | Fails when |
|---|---|
| a game adapter is registered | `tabs.ts` doesn't call `registerDevKitGame` |
| every tuning file is read by the game | a `content/tuning/*.json` no code imports (its sliders change nothing) |
| no tuning value is copied at load | `liveGuard.ts` (`copiedAtLoad`) finds a copy — file:line + the fix |
| the Dev Kit starts and the game is plugged in | `window.__devkit` (`checkHandle.ts`, set by mount) or the adapter is missing |
| every tuning file is live in the running game | an edit (the Tuning tab's own `devkit:tuning` event) doesn't reach the game's import — the Vite plugin isn't in |
| ⏸ full pause stops everything | in live play, 0.7 s of full pause moves a clock, the adapter's state or a pixel — names the plain timers in game code |
| ◐ half pause stops the rules, not the looks | in 1 s of half pause the rules clock or the state moves, or the looks clock doesn't |
| a snapshot restores exactly | `setState(getState())` after 0.7 s of play gives a different moment (the first differing path) |
| the game's hotkeys skip text boxes | in live play a game key handler calls `preventDefault` on keys typed into a text box, or swallows its letters |
Without `conformance.startPlay` the last four fail with the exact lines to add to the adapter.

**Known gaps** (0.20.1) — a promise the game knowingly doesn't keep yet, planned on its roadmap. List it in
`content/devkit.json`:
```json
"knownGaps": [{ "check": "◐ half pause stops the rules, not the looks", "why": "turns move on when animations finish", "roadmap": "F12" }]
```
`check` is the check's exact name from the report. A listed check that fails shows as `○ … — KNOWN GAP (roadmap F12): why`
and the run still passes (exit 0); `e2e-shots/framework.json` keeps it in each module's `knownGaps: [{ name, why, roadmap }]`
(not in `failed`), so the planner can say what's still to build. A listed check that passes now prints a reminder to take
it off the list (`gapsToRemove`). A listed name that no check has fails as *every known gap names a real check* — a typo or
a renamed check (judged on full runs only: `--static` / `--only` don't run every check).

## Install or update
From this folder: `node scripts/install-devkit.mjs <game-folder>` (add `--dry-run` to see what would change first).
- `kit/` → the game's `src/devkit/` (browser code) and `vite/` → `vite-plugins/devkit/` (build code), each with a `VERSION` stamp. Tests stay here.
- Makes `content/devkit.json` and `src/devkit-game/tabs.ts` once; never overwrites them.
- Adds `"check:framework"` to the game's `package.json` scripts and `devkit.local.json` to its `.gitignore` (0.20.1) — only when missing, so a re-run changes nothing; a game's own different `check:framework` is left alone.
- Prints the wiring the game still needs — for a new game:
  1. `src/main.tsx`: in dev `import('./devkit/mount').then((m) => m.mountDevKit())` at once; in release builds (`__DEVKIT_IN_RELEASE__`) the same import after the page's `load`, in `requestIdleCallback` — so the Dev Kit isn't part of the first screen's download (Glyphtender F66: 47 KB, 2.16 → 1.60 s to Play on a slow phone). Worked example: Glyphtender `src/main.tsx`.
  2. `vite.config.ts`: `import { devkit } from './vite-plugins/devkit/devkitVite'` and `plugins: [react(), devkit()]`
  3. `tsconfig.node.json`: `"vite-plugins"` in `"include"`
  4. `package.json`: `"check:devkit": "node src/devkit/check-devkit.mjs"` (needs Playwright: `npm install -D playwright`)
     and `"check:framework": "node src/devkit/check-framework.mjs"` (0.19.0 — every module's promise checks)
  5. **The live guard** (0.18.0) in the game's own tests — fails when code copies a tuning value at load, where the
     sliders can't reach it (Goops `tests/devkit-live.test.ts` is the template):
     ```ts
     import { copiedAtLoad, type SourceFile } from '../src/devkit/tuning/liveGuard'
     const sources = import.meta.glob<string>('../src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })
     const srcFiles = (): SourceFile[] => Object.entries(sources).map(([path, text]) => ({ path: path.slice(3), text }))
     it('no tuning value is copied at load', () => expect(copiedAtLoad(srcFiles())).toEqual([]))
     // allow: { 'src/x.ts': 'why' } for a file that copies on purpose; folders: [...] to guard more than content/tuning/
     ```
  6. **The clocks** (0.18.0): tick the engine by `dt × rulesClock.rate`, set `rulesClock.scale` for the game's own pause
     menu, put game-logic timers on `rulesClock.after/every/now`, pulses and frame time on `looksClock` (Decisions: *Two clocks*).

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
  pauseModes: ['full', 'half'],               // optional (0.18.0): ◐ Half pause shows (it also does if the game reads rulesClock)
  pause: (mode) => physics.setPaused(mode),   // optional: machinery the clocks don't reach (a physics engine, an AI worker)
  canPause: () => !isOnline,                  // optional: left out = canRestore()
  conformance: { startPlay: async () => { /* menu → live play */ }, query: '?seed=7' }, // optional (0.19.0): npm run check:framework
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

## The Review list tab (mark items Open / Yes / No)
**Adding any game tab:** on a desktop every tab stays in view — about 10 fit one row of the 540 px panel, more wrap onto a second row (0.20.2); on a phone the row is a carousel, so a test that opens a tab there must page to it (◀ as well as ▶ — the tab may be on an earlier page). A game endpoint that writes files or uses a secret: accept only the game's own page (Origin = Host, JSON only), like the Save endpoint.
For any list a person reviews by hand — Glyphtender's player-submitted words first. The Dev Kit never reads the game's files:
the game hands over `load` and `save` (`kit/review/reviewTypes.ts`).
```ts
// src/devkit-game/tabs.ts
import { reviewTab } from '../devkit/review/reviewTabEntry'
export const gameTabs: DevKitTab[] = [
  reviewTab({
    id: 'words',          // unique tab id
    label: 'Words',       // the tab's name ("Search Words…")
    what: 'word',         // one row is called… → "3 words found" (default "item")
    load: loadWords,      // () => Promise<ReviewItem[]>   ReviewItem = { id, label, status: 'open' | 'yes' | 'no', detail? }
    save: saveWordMarks,  // (changes: { id, status }[]) => Promise<void> — only the changed rows; throw a plain reason if it can't
  }),
]
```
`load` runs when the Dev Kit opens (and on Retry). `save` writes however the game keeps the list (e.g. a CSV through its own
dev-server endpoint, or `saveContentFile` for JSON). Statuses are plain strings, so the game can store them as they are.

## The Text tab (every string players read)
```ts
// src/devkit-game/tabs.ts
import en from '../../content/text/en.json'
import { textTab } from '../devkit/text/textTabEntry'
export const gameTabs: DevKitTab[] = [textTab({ file: 'content/text/en.json', data: en })]   // label?: 'Text', id?: 'text'
```
Nothing else for the game to do, as long as it reads its words from the file (`import text from '…/en.json'`):
Save asks the dev server for Vite's hot reload (`saveContentFile(path, data, { reload: true })` — other tools skip it,
because the game already shows their live values), so the game shows the new words in place, keeping its state.
Just before saving, the tab reads the file fresh from the dev server and puts only its edits on top — words another
tab saved meanwhile (Glyphtender's AI tab writes bios into the same file) are kept. Install the Vite plugin too
(`vite/` → `vite-plugins/devkit/`): the reload flag lives there.

## The Select tab (click a thing → its knobs) — Dev Kit 0.14.0–0.16.0, framework F55/F56/F58
Muzzy's goal: "click on a thing > see the attributes associated with it compiled in one place > update those things and hit save."
- The game adds **`content/devkit/select.json`** (the tab appears when it exists) — the object → knobs list. Claude keeps it
  complete; the Dev Kit only reads it (0.16.0: no + Add a knob / ✕ — Muzzy wants to trust that a click shows everything):
  `{ "objects": { "glyphling": { "label": "Glyphling", "help": "…", "knobs": { "Look": ["garden.pieceScale"], "Drag": ["drag.liftScale"] }, "text": ["explore.glyph"], "sounds": ["glyph.step"] } } }`
  Tuning ids are `<file>.<key path>` (a group brings all of it), text ids are en.json keys (a branch brings all of it), sounds are audio.json names.
- The game marks what you SEE with **`data-knobs="glyphling"`** (by meaning, several ids space-separated). A kit part the game can't tag → `"find": ".kit-callout"` in the object instead.
- Select mode on → hover = thin pink outline + name, click/tap = pick (thick; its twins dashed). Clicks don't reach the game while it's on; closing the Dev Kit turns it off and forgets the pick (0.16.0). Only the Outline slider is remembered in this browser.
- Desktop, select mode on: the mouse leaves the panel → it slides off to a thin pink "Dev Kit" bar on the right (the whole game shows); the mouse back over the bar → it slides in again (0.15.1). Phone: the panel is a bar at the bottom instead.
- Under the Select tab: the pick's knobs from the real Tuning / Text / Sound panels (same edits, own Saves), "Recently on screen" (pick fast things there), Copy for Claude, problems in red.
- **Menus and kit parts (0.15.0):** an object can list `"style": ["primary", "radius-control"]` — UI kit style values
  (content/ui/style.json token names). They're SHARED (a button's corners are every button's), and the panel says so;
  the Color tab shows them under the pick. The Color tab itself now has a second section, **UI shape & feel**: corners,
  outline, shadows, press feel, timings, text size, fonts, menu sizes (`color/styleValues.ts` — slider, dropdown or box).
  Kit parts are found with `find` (`.kit-button`, `.kit-toggle`, `.kit-slider`, `.kit-picker`, `.kit-tab`, `.kit-listrow`,
  `.kit-badge`, `.kit-modal, .kit-menu`, `.kit-card`, `.kit-toast`, `.kit-screen` — Glyphtender's select.json has all 12).
  Anything inside an `[inert]` screen (a menu under the top one) is never picked or counted on screen.
- Game test: `checkSelectMap(file, catalog().known)` is empty, **`unlistedSettings(file, catalog().known.tuning)` is empty**
  (every setting is on some object — rules included, on the thing they affect), and every object has a `data-knobs` in src
  or a `find` (Glyphtender `src/devkit-game/select.test.ts` is the template).
- One thing = what a designer would call one thing: its parts (a glyphling's danger ring) carry its tag, so a click on
  a part picks the whole thing and shows every knob for all its parts.
- BMUZ rule: a new tunable setting → put it on the object it affects (the test fails until you do).

## Live tuning in the game — live by default (0.18.0)
The game imports its tuning JSON as usual, and it's live: the Dev Kit's Vite plugin hands back every
`import x from '…/content/tuning/<name>.json'` as `liveFile('<name>', <the file>)` — an object with a getter per key
that reads the Dev Kit's latest edit (falling back to the file). It works in dev, in every build and in vitest (with
nothing sending edits it is just the file); `src/devkit/tuning/liveTuning.ts` has no Dev Kit code in it.

```ts
import tank from '../../content/tuning/tank.json'
// …read where the value is used — this follows the slider:
camera = stepCamera(camera, s.spin, dt, tank.cameraSpeed)
const R = hud.readout          // fine inside a function: the nested object is the current one
// NOT live — copied once, when the file loads (the live guard finds these):
const speed = tank.cameraSpeed // at the top of a file
import raw from '…/tank.json?raw'  ·  import { cameraSpeed } from '…/tank.json'
```
Pure engine code stays pure and live: pass it the import and read `config.fall.msPerRow` per tick (Goops' engine).
Code that keeps its own copy (a physics loop with thousands of reads a frame) re-reads the file ONCE PER FRAME, or
follows only the keys that changed (Goops `src/goo/shared/knobs.ts` `followFile`). The explicit API stays, for files
elsewhere and for code that wants to know WHEN an edit arrives:

```ts
import physicsFile from '../../content/physics.json'          // (outside content/tuning: not live by itself)
import { liveTuning, onTuning, useLiveTuning } from '../devkit/tuning/liveTuning'
const physics = liveTuning('physics', physicsFile)             // a box; .current follows the edits
const ref = useLiveTuning('physics', physicsFile)              // the same as a React ref (no re-renders)
onTuning('hud', () => relayout())                              // run something when a file is edited
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
- `content/devkit.json` → `pauseBadgeSpot` (0.18.1): where the closed-panel PAUSED badge sits — `left` (default) · `right` · `top` · `bottom` · `top-left` · `top-right` · `bottom-left` · `bottom-right`. Pick a spot the game's HUD leaves free.
- The Color tab reads and saves `content/ui/style.json` (the UI kit's file).
- The Fonts tab saves the four font values into the same `content/ui/style.json`; the game's own fonts are listed in `content/ui/fonts.json` (UI kit CATALOG: *Fonts: three text roles*), and the game declares them at start-up with the kit's `loadGameFonts(fontsJson, import.meta.env.BASE_URL)`.
- **The font library folder** (Fonts tab): `<home>/Downloads/Font` by default (the user name differs per computer — it's found, never typed). Another folder: `devkit.local.json` in the game's folder — `{ "fontLibrary": "D:/Fonts" }` — git-ignored (the installer asks for the `.gitignore` line), so each computer keeps its own; or the `DEVKIT_FONT_LIBRARY` environment variable for one run. The dev server (`vite/fontLibrary.ts`): `GET /__devkit/font-library` (the list, up to 5,000), `GET /__devkit/font-library/file?path=` (one font, for a preview), `POST /__devkit/font-library/add { path }` (copy into the game). Read-only toward the library: only font files are listed or served, only from inside that folder (no `..`, no links leading out), nothing there is ever run or changed; a request from another site is refused, and Add follows the Save endpoint's same-page rules.
- The Tuning tab reads and saves `content/tuning/*.json` — `_ranges` in a file sets its slider ranges; `_labels` / `_sections` name and group its settings, `content/devkit.json` `sectionOrder` orders the sections.
- Open/closed sections are kept in localStorage under `devkit-sections:<game name>`.
- The Snapshots tab reads `content/snapshots/*.json` and saves there. Bug capture: `KEEP_MS` (60 s) and `STATE_EVERY_MS` (5 s) in `kit/capture/captureLog.ts`.

## Decisions
- **Live by default, through the Vite plugin, not by wrapping every import (0.18.0).** Goops shipped with its tuning
  imported straight from the JSON, so every slider did nothing until a reload — wrapping each import by hand is
  exactly what gets forgotten. The plugin turns each `content/tuning/*.json` import into `liveFile(name, data)`.
  **A getter object, not a Proxy:** a Proxy can't go through `structuredClone` or `postMessage` (57 Goops engine tests
  clone their config and all failed with one), a getter object can — the catch is that it only knows the file's own
  keys (edits change values, never keys). Cost: a getter + a Map lookup per top-level read (a million reads in well
  under a second, tested); Goops' goo physics follows its files once a frame instead (`followFile`). The Dev Kit's own
  tools read the plain file (`?devkit-file`), so dirty marks and ↺ still compare with what's on disk. The
  `devkit:tuning` event itself is the edit (whoever sends it), so tests and e2e scripts can drive it.
- **The live guard is a source check for copies made at load (0.18.0), plus an e2e per game.** What the plugin can't
  make live is a value COPIED once: a top-of-file `const x = file.key`, a `?raw` or named import. `copiedAtLoad` finds
  those with plain text rules (quick, no compiler, few false alarms: a function, a `liveTuning(…)` call, another name
  for the import, strings and object keys don't count). What it can't see — a copy inside a constructor or factory, a
  default parameter of something made once (Goops' drop guide had one) — is why each game also proves a few knobs
  live in an e2e (Goops `e2e/devkit-live.mjs`). A "send an edit to every file and see if anything changes" checker
  was weighed and left out: many knobs only show in a rare moment (a rupture, a broken machine), so it would cry wolf.
- **Two clocks, shared (`gameClock.ts`, 0.18.0).** Every game runs a **rules clock** (anything that can change what
  happens: falling, timers, AI moves, physics that decides results) and a **looks clock** (presentation only: blinks,
  pulses, glows, idle jiggle). The test: *if the end of an animation changes the game, it's on the rules clock.* The
  Dev Kit drives both: Full pause stops both, Half pause stops only the rules clock. The game's own pause menu / slow
  motion sets `rulesClock.scale`; the Dev Kit never touches it (its pause sits on top), so resuming always goes back
  to the game's own speed. Timers (`after` / `every`) run on the browser's setTimeout, re-timed when a clock's rate
  changes — plain, and they work in node tests. A game that ticks by `rulesClock.rate` and takes its frame time from
  `looksClock` gets half pause for free and resumes from a full pause without a jump. The adapter's `pause()` stays
  as an extra for machinery the clocks don't reach.
- **Full pause freezes any game without its help (0.18.0, `pause/freeze.ts`).** mountDevKit patches
  requestAnimationFrame once: while frozen, frames are queued and released on resume; the Dev Kit's own loops use the
  real one (`devkitRaf`), and its own animations are skipped when CSS / Web animations are paused (a sweep every
  200 ms catches ones that start while frozen). What a generic freeze can't stop — plain setTimeout,
  `performance.now()` — is the game's part (the clocks). A live edit while frozen runs the held frames once with the
  last frame's time (no time passes), so the frozen picture shows the edit.
- **Pause is offline-only, like Restore:** `canPause()` (default `canRestore()`) — pausing an online game would stop
  it for everyone. Closing the panel doesn't resume (Muzzy may want to look at the game); a small badge stays.
- **Keys typed in the Dev Kit stay in the Dev Kit (0.17.1, `keepKeysInside` in mount.tsx).** Its host stops keydown / keyup / keypress after React has seen them, so a game's window hotkeys never fire while you type in Search (Goops: "curve" came out "cuv" — R swapped, E rotated, and the game's preventDefault ate the letters). Games should still ignore keys typed into any text box (belt and braces).
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
- **On a desktop the tabs wrap instead of paging** (0.20.2). The promise was "every tab fits one row on a desktop", kept by hand each time a tab was added (wider panel, tighter padding). The kit's own Fonts tab (0.17.0) broke it unnoticed: Glyphtender's 11 tabs need ~550 px, the panel is 540 (and only 533 on a 1066 px window, half its width), so Text and Words sat behind ▶ (its e2e:margins caught it). Squeezing again would only last until the next tab, and widening hides more of the game; a second row costs ~28 px of height and never needs revisiting. CSS only (`devkit.css`): the carousel then measures everything as fitting and draws no arrows. Phones and short windows (under 500 px tall) keep the carousel — there the height is the scarce thing.
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
- **The Sound tab only sends a real edit** (0.9.1): it remembers what it last sent, so React running its effect again with nothing changed (StrictMode, the Dev Kit's hidden tabs reconnecting) no longer re-sends its copy of content/audio.json — that undid other live edits of the file (a Moments audio knob, an e2e's setConfig). Found in Glyphtender sprint 21.
- **The Color and Fonts tabs share ONE copy of the style values** (0.17.0, `color/styleStore.ts`): both edit content/ui/style.json and all tabs stay mounted, so with a copy each, a font picked in Fonts was undone the next time Color restyled the page, and a Color Save wrote its stale font values back over the Fonts tab's. Now every change goes through the store (which calls the kit's applyStyle), and each tab saves only its own values — the rest of the file's tweaks stay exactly as saved. The store is built as `color/uiKit.ts` loads, so it must not touch the page until its first change (0.20.1): a game's own Node test that imports Dev Kit files has no `document` (Glyphtender's `select.test.ts` crashed "document is not defined" from 0.17.0 to 0.20.0) — `styleStore.node.test.ts` guards it.
- **Fonts: library fonts are tried from the dev server, never copied until Add to game** (0.17.0, Muzzy: "I have a huge font library in my pc"): trying hundreds of fonts must not litter public/fonts/; but Save may only point at a font the game ships (a live build has no font library), so it waits for Add to game. Added fonts start 🔴 `unknown` — the Dev Kit can't read a licence; a person (or Claude) does and fixes fonts.json.
- **Fonts: one value per role, the font's name + a plain fallback** (`'Press Start DX', system-ui, sans-serif`): readable in style.json, and the role's first font name is how the tab knows which font is in use. Title and heading left unset follow the style's own display font, so presets keep their look.

- **The Review list doesn't re-sort while you click** (0.11.0): Muzzy's spec — Open on top, then Yes, then No, A–Z — but a row that jumped to the Yes group the moment he clicked it would slide out from under his cursor (and the next click would hit a different word). So the order is set on load and after Save; between those, rows only change their box. Save sends only the changed rows, so the game never rewrites what he didn't touch.
- **The Text tab's Save lets Vite hot-reload the game** (0.13.0): every other tool sends its edits to the running game live, so the Save endpoint skips Vite's reload for them. Words are read once, when a module loads (`import text from en.json`), so for them the reload IS the live update — the save says `"reload": true`. Vite swaps the components that import the file in place (the game keeps its state). It also re-runs the game's `tabs.ts`, which remounts the game's own Dev Kit tabs: their unsaved edits are lost on a Text save (kit tabs — Tuning, Color — keep theirs).
- **The Text tab searches the words as saved AND as typed** (0.13.0): searching only the typed words made a box vanish from the results mid-edit, the moment it stopped matching.
- **formatJson keeps a one-line object's own spacing** (0.13.0): Glyphtender's en.json writes bios as `{"name": …}` (no inner spaces); a no-change save used to rewrite them as `{ "name": … }`.

## Develop
`npm install`, then `npm test` (panel, Sound tab (list, knobs, A/B, files + upload + credits, mixer, log, wildcard notes, waveform maths, the knobs matching audio/kit/config.ts; Music section: tracks, layers, intensity, rests, the music knobs matching config.ts), save-audio + credit endpoints (path safety; conversion when ffmpeg is installed), AI tab (editor, save, copy, watch, check, search), Review list tab (Open/Yes/No cycle, order + no re-sort until Save, Save sends only changes, failed save/load, search), Text tab (flatten / unflatten keep order + lists, {placeholder} check holds Save, search, fresh-read save, no-change save byte-identical on Glyphtender's en.json), dot carousel, screen previews (list, overlay, Esc / Back, sandbox blocks), colour logic against the real UI kit, tuning logic + tab + live hook, live files (liveFile) + the Vite live-JSON step + the live guard, the two clocks (gameClock) + Pause (generic freeze, adapter calls, buttons, badges, P), game adapter registry, snapshot store + tab, capture log / recorder / report + tab, the Vite plugin in a real dev server, installer, release-check helpers) and `npm run typecheck`.
- `npm run lint` — the framework's one ESLint setup (`../eslint.config.js`, the games' rules; `npm install` once in the framework root). Before 0.20.3 the framework had no ESLint and games ignore their kit copies, so Dev Kit 0.8.0 went out with 3 hooks errors that only showed up inside Glyphtender. 0.20.3: the Sound/AI tab tests lost their `any`s and an unused parameter (tests only, no behaviour change).
- 0.20.4: `check:framework` knows the Saves module (framework F86): `src/saves/` is framework code (skipped when checking the game's own code) and its update hint is `node <framework>/saves/scripts/install-saves.mjs .`.
- **A game's tab plug that calls its own dev-server endpoint** (`/__something`) must check `CAN_SAVE` (saveContent.ts) first and reject with a plain reason on the live build — else every player's console gets a 404 on load (Glyphtender v0.9.0 Words tab).
