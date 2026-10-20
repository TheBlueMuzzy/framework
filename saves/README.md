# Saves

The player's saves — settings, progress, a run in progress, save slots — kept so that **no update, broken write, full storage or browser habit loses them**. The game says *what* it saves (`createSave({ key, kind, version, fresh, upgrades })`); the module keeps it versioned, upgraded step by step, backed up, and copyable as a **save code**.

Design: `../.planning/design/saves.md` (research: `../.planning/research/saves.md`). Framework v0.10 (F86 = layers 0 + 1; F93 = layer 2, run resume; layers 3–8 are F94–F99). Kit **0.2.0**. Proven on scratch copies of Goops (progress) and Glyphtender (New Game choices; a game vs the AI continued after the tab closed) — see *Proof* below.

No library: localStorage, the browser's own CompressionStream, and nothing else at run time.

## What a game gets (0.2.0)
| File | Does |
|---|---|
| `index.ts` | The public API (below) — import from `src/saves` |
| `saves.ts` | **The core.** `createSave` — game-prefixed keys, version stamp, step-by-step upgrades, missing fields filled with today's defaults (never over the player's values), one whole-record write that's read back before it counts, 2 rolling backups (newest GOOD copy wins), a newer build's save kept untouched (in any copy — this build then never writes), full storage caught (backups older than the newest good copy make room; that copy itself never goes). A write that doesn't read back is undone. Never throws. `kind: 'slots'` → one save per slot + a list |
| `progress.ts` | How two copies of progress combine (for the cloud later, F96): `highest` · `add-up` (counted per device, so two devices' "games played" SUM) · `collect` (every unlock once) · `newest` |
| `fill.ts` | Fill in what's missing after loading (and why a changed default doesn't reach old saves on its own) |
| `storage.ts` | Safe reads/writes of localStorage; `memoryStorage()` for tests (can be made full or blocked) |
| `saveCode.ts` | The save code: `GAME-1z-…` (compressed) copy-paste text and the same as a `.txt` file. Every save in a code is checked before ANY is written — a bad code never wipes a save. Progress is merged, other saves replaced (the old copy stays as a backup). If the browser still refuses a write part-way (full storage), the result names exactly which saves were and weren't restored |
| `health.ts` | Will this browser keep the saves? Warnings in plain words: storage blocked · looks like a private window · itch.io's frame · another site's frame · Safari's 7-day rule · persist refused. `askToKeepSaves()` = `navigator.storage.persist()` |
| `nudge.ts` | "Back up your save" after real progress since the last code (never nagging — content/saves.json) |
| `settingsRow.ts` | The Settings rows (`Your save` · `Saved: On this device` · `Save code ›`) for the UI kit's Settings |
| `ui/SaveCodePanel.tsx` | The Save code screen (copy / download / paste / load a file), built from UI kit parts. **Only installed when the game has the UI kit** (the module's one link to another module, kept optional) |
| `run.ts` | **Run resume (0.2.0).** `createRun` — a game in progress saved at the game's break points (`autosave`) and when the tab hides or closes, `pending()` for the Continue button without loading it, `resume()`, and `end()` that wipes every copy (backups and a newer build's too) so a finished game never comes back. A newer build's or damaged run → "This game can't be continued", wiped, never a crash. `continueLine` → "Turn 7 · 5 min ago" |
| `ui/useContinue.ts` | The main menu's Continue (0.2.0): `{ onContinue, continueDetail }` for the UI kit's MainMenu when a run is waiting, `{}` when not; a can't-continue run → a toast and Continue goes. UI kit only, like the panel |
| `oldSaves.ts` | The test kit: golden saves, round trip, damaged saves, full storage, and (0.2.0) `checkRunEnds` — used by the game's `tests/saves/saves.test.ts` |
| `config.ts` | `content/saves.json`: backups, nudge |
| `conformance.mjs` | Its check:framework checks |

## What a game must provide
From MODULE-CONTRACTS.md (`~/.claude/config/bmuz/`), "Saves":
- **Every save goes through `createSave`** — its key starts with the game's name (`goops-progress`, `glyphtender:new-game`: itch.io games can share one storage). Game code doesn't read or write `localStorage` / `sessionStorage` itself. Allowed: the rooms module's ids (`rooms:` keys), and files listed in `content/saves.json` `"storageAllowed"` with why (e.g. a room code until F95).
- **A default change that should reach old saves is an upgrade step**, not an edit of `fresh` (fresh only reaches NEW players: a player's saved value is never overwritten). Glyphtender's 2-letter fix is the example: `upgrades: { 2: (v1) => { delete v1.twoLetterWords; return v1 } }`.
- **A golden save for every version** in `tests/saves/<key>-v<N>.json` (a `:` in the key becomes `_`), and each save listed in `tests/saves/saves.test.ts` (the installer's starter).
- Write `key` and `version` as plain values in `createSave` (or a `const` in the same file) so the check can read them.

**How it's checked — `npm run check:framework`** (the Dev Kit's runner runs `kit/conformance.mjs`):
- *every save has a golden copy for each version* — names each missing file (`tests/saves/goops-progress-v2.json`).
- *the game's save tests pass* — runs `npx vitest run tests/saves/saves.test.ts`: every golden save loads with today's code (and its `expect` values), round trip, cut-off / wrong-type / empty saves fall back to the backup, full and blocked storage keep the game running; each run in `RUNS` ended with `end()` leaves no copy behind (`checkRunEnds`).
- *a run cleared at the end never comes back* (0.2.0) — every `createRun` is named (`const matchRun = createRun(…)`), something in the game's code calls `matchRun.end()`, and the save test runs `checkRunEnds` on it (a starter from 0.1.0 has no `RUNS`: copy that part from `templates/tests/saves/saves.test.ts`).
- *the game saves through the module, not straight into the browser's storage* — lists every line of game code that touches `localStorage` / `sessionStorage` (minus `rooms:` ids and `storageAllowed` files).

## Install / update in a game
```
node ~/.claude/config/bmuz/scripts/install-module.mjs saves .        (from the game folder — the safe way: tests first)
node ../../framework/saves/scripts/install-saves.mjs . --dry-run       (just show what would change)
```
Copies `kit/` → `<game>/src/saves/` with a VERSION stamp (tests stay here; `ui/` only with the UI kit), removes files the module no longer ships (only inside `src/saves/`), refuses (and touches nothing) when `src/saves/` already holds the game's own files with no VERSION, and gives the game **once**: `content/saves.json` and `tests/saves/saves.test.ts` — after that they're the game's, never overwritten. If the game's ESLint doesn't ignore `src/saves`, it lints it too (that's fine: the kit passes the games' rules).

## Hooking it up
```ts
// one file per save, e.g. src/progress/save.ts
import { createSave } from '../saves'
export const progressSave = createSave<Progress>({
  key: 'goops-progress', kind: 'progress', version: 1, fresh: freshProgress(),
  fields: { totalXp: 'highest', scrapsSpent: 'highest' },
  oldSave: (raw) => (raw?.v === 1 ? { version: 1, data: raw } : null), // a save written before the module
  clean: (p) => ({ ...p, totalXp: Math.max(0, p.totalXp) }),           // the game's own last tidy-up
})
const progress = progressSave.load()   // anywhere; never throws
progressSave.save(progress)            // { ok } | { ok: false, reason: full|blocked|newer|not-kept|not-data, message }

// main.tsx, once: the knobs in content/saves.json
import savesJson from '../content/saves.json'
setSavesConfig(savesJson)
```
**Settings → Save code** (games with the UI kit): paste `SAVE_SETTINGS_ROWS`' three rows into `content/ui/settings.json`, then in the Settings screen `info={{ …, saveHealth: healthLine(health) }}` and `onAction={(id) => id === SAVE_CODE_ROW && screens.push('saveCode')}`, and register the screen: `saveCode: () => <SaveCodePanel saves={[progressSave]} health={health} onLoaded={() => location.reload()} />` (`health` = `await checkSaveHealth()`). Without the UI kit: `makeSaveCode(saves)` / `readSaveCode(code, saves)` / `downloadSaveFile` / `readSaveFile` / `copyText` directly.
**Ask the browser to keep the saves** after the first real progress (Firefox shows a question): `askToKeepSaves()`.
**Nudge:** `const nudge = createBackupNudge('goops')` · `nudge.noteProgress()` per finished game · `if (nudge.due(health)) { toast(NUDGE_WORDS.message); nudge.shown() }` · pass `nudge` to `SaveCodePanel` (copying counts as a backup).

### Run resume — Continue on the main menu (layer 2, 0.2.0)
A game in progress that survives the tab closing. About ten lines in the game (Glyphtender's, from the F93 proof):
```ts
// src/game/run.ts
export const matchRun = createRun<Match>({
  key: 'glyphtender:run', version: 1, fresh: { game: null, options: null, seats: [], stats: [] },
  summary: (m) => fill(text.mainMenu.continueTurn, { n: (m.game?.turnCount ?? 0) + 1 }),  // "Turn {n}" in content/text
  snapshot: () => matchNow(),           // optional: the game right now (or null), saved when the tab hides or closes
})
matchRun.autosave(match)                // at each break point: a turn ended, a wave cleared — NOT every frame
matchRun.end()                          // won, lost, left from the menu — and before a New game starts
// the main menu (UI kit)
const resume = useContinue(matchRun, (match) => putBackOnTable(match))   // src/saves/ui/useContinue
<MainMenu {...resume} onPlay={…} />     // or with items: { label: 'Continue', onClick: resume.onContinue, detail: resume.continueDetail }
```
Then list it in `tests/saves/saves.test.ts` → `RUNS: [{ run: matchRun, sample }]` and add `tests/saves/glyphtender_run-v1.json` like any golden save.
- **Break points, not every change:** a break point is a moment the game's state is whole (a turn ended). The tab hiding (an app switch, a closed tab) saves `snapshot()` too, so a phone player mid-turn loses nothing; return null from it when the game isn't in a state worth saving.
- **Only after `end()` is a run gone** — leaving the game from the menu is an end (abandoned); closing the tab is not (that's what Continue is for).
- **A newer build's run or a damaged one** shows Continue with just its time; pressing it says "This game can't be continued…" (`RUN_WORDS.cantContinue`) and wipes it. Unlike progress, a newer build's run is not kept: while it sits there this build can't write the key at all, so no new run could ever be saved.
- Online games aren't runs: the server holds the match (rejoin is F95).

## Golden saves
A real save from each version, committed as `tests/saves/<key>-v<N>.json` — several per version are fine (`goops-progress-v1-before-the-module.json`):
```json
{ "about": "what it is and where it came from",
  "stored": <exactly what was in the browser under the key>,
  "expect": { "totalXp": 18250 } }
```
Get `stored` from DevTools → Application → Local Storage → the key, or `makeGoldenSave(save, data, about)` in a test. **Every release that changes a save's version adds the old version's golden save** — check:framework fails until it's there.

## The public API
```ts
createSave<T>({ key, kind: 'settings' | 'progress' | 'run' | 'slots', version, fresh, upgrades?, fields?, oldSave?, clean?, storage?, onProblem? })
  → save.load() · save.save(data) · save.clear({ evenNewer? }) · save.peek() → { state: good|newer|damaged, savedAt, data|version|problem } | null · save.report() → { from: fresh|save|backup, backup?, upgradedFrom?, newer?, added, replaced, problems, note }
    save.exportRecord() · save.checkRecord(raw) · save.restoreRecord(record) · save.merge(a, b) · save.withStorage(storage)
  kind 'slots' → slots.slot(id) (a Save) · slots.slots() → [{ id, savedAt }] newest first
createRun<T>({ key, version, fresh, upgrades?, summary?, snapshot?, storage?, onProblem?, page? })
  → run.autosave(data) · run.pending() → { savedAt, summary, canContinue } | null · run.resume() → { ok, data } | { ok: false, reason: none|newer|damaged, message }
    run.end() · run.save (the Save underneath) · run.withStorage(storage)
continueLine(pending, now?, words?) → "Turn 7 · 5 min ago" · timeAgo(savedAt, now?, words?) · RUN_WORDS
ui/useContinue(run, onResume, words?) → { onContinue?, continueDetail? } for the UI kit's MainMenu
makeSaveCode(saves) → Promise<string> · readSaveCode(code, saves) → Promise<{ ok, restored, skipped } | { ok: false, message }>
saveFileName(saves) · downloadSaveFile(code, name) · readSaveFile(file) · copyText(text)
checkSaveHealth(env?) → Promise<{ canSave, kept, inFrame, onItch, warnings: [{ id, level: risk|note, message }] }> · askToKeepSaves() · healthLine(health)
createBackupNudge(game, { storage?, config?, now? }) → { noteProgress(n?), backedUp(), due(health?), shown() }
SAVE_SETTINGS_ROWS · SAVE_CODE_ROW · SAVE_HEALTH_ROW · HEALTH_WORDS · CODE_WORDS · NUDGE_WORDS · NOTES
setSavesConfig(json) · readSavesConfig(json) · memoryStorage(start?) · mergeRecords(kind, fields, a, b) · fillMissing(saved, fresh)
oldSaves.ts: goldenFileName · missingGoldenVersions · goldenSavesFor · makeGoldenSave · checkGoldenSave · checkRoundTrip · checkDamagedSaves · checkFullStorage · checkRunEnds
```
Every player-facing sentence (`NOTES`, `CODE_WORDS`, `HEALTH_WORDS`, `NUDGE_WORDS`, `RUN_WORDS`, the panel's `words`) can be replaced.

## `content/saves.json`
`backups` (0–5, default 2: older copies beside each save) · `nudge.afterProgress` (points before "back up your save", 0 = never; default 10) · `nudge.minDaysBetween` (default 7) · `nudge.onlyWhenAtRisk` (default false) · `storageAllowed` ([{ file, why }]). `_help` / `_ranges` follow the Dev Kit convention.

## Proof (F93, 2026-10-20) — a scratch Glyphtender in `~/Documents/dev/.scratch/glyphtender-f93/`
UI kit 0.23.0 + saves 0.2.0 installed with install-module; `src/game/run.ts` (a local game's table: state, options, seats, stats; autosave when a turn or the phase changes, `end()` on game over / leaving / a new game), Continue in `src/ui/menus.tsx` (`useContinue`, "Turn {n}" in content/text). In Playwright's Chromium: a game vs the AI → the draft + 3 turns → reload → **Continue · Turn 4 · just now** → Continue lands on the same turn (board, hands, seats identical); a 5-minute-old save reads "Turn 4 · 5 min ago"; finishing the game (`playRest`) → no copy left, no Continue after a reload; a new game left from the menu → the same; a version-7 run planted → Continue with "3 hours ago" → "This game can't be continued…" toast, wiped, no page errors. Menu screenshots with and without Continue at 390×844 and 1440×900. Its 824 tests pass; check:framework Saves: golden copy ✓, save tests ✓ (`checkRunEnds`), "a run cleared at the end never comes back" ✓ (the direct-storage check still lists the game's known gaps, see F86 below).

## Proof (F86, 2026-10-19) — scratch copies in `~/Documents/dev/.scratch/framework-f86/`
- **Goops** (`goops-progress` v1, before the module `{ v: 1, totalXp, scrapsSpent }`): moved onto `createSave` with `oldSave` reading the old record, `fields` highest / highest. Its own 377 tests pass (its old save test unchanged except the pretend storage), `tsc -b` clean, check:framework Saves: 3 / 3. With its golden files removed, check:framework fails naming `tests/saves/goops-progress-v1.json`.
- **Glyphtender** (`glyphtender:new-game`): the `TWO_LETTER_SAVES_SINCE = 2` marker became version 2 + an upgrade step; `oldSave` maps a no-marker save to v1 and a marked one to v2. Its unchanged `ui/newGame.test.ts` (incl. the 2-letter test) and all 825 tests pass; golden saves v1 / v2 / v2-module load with the right values. With the upgrade step removed on purpose, check:framework fails: `"twoLetterWords" loaded as true, expected false`. Wired into the real Settings (rows + Save code screen).
- **Browser (Playwright's Chromium, the real Settings → Save code screen):** code copied out of one browser and pasted into a fresh one restores the choices; the downloaded file loads in another fresh browser; a cut-off code says "damaged or incomplete" and changes nothing; inside a frame on another site (localhost:5192 framing 127.0.0.1:5191, itch's `allow` list) the screen shows the frame warning, Copy works, and a pasted code restores the choices; with Chrome's storage partitioning on, the framed save and the directly-opened game are separate saves (the itch vs. own-site effect).

### Switch-over steps
**Goops** — `node ~/.claude/config/bmuz/scripts/install-module.mjs saves .` → `src/progress/save.ts` becomes a `createSave` (key `goops-progress`, kind progress, version 1, `oldSave: raw.v === 1`, `fields` highest, `clean` ≥ 0) with `loadProgress` / `saveProgress` kept as thin wrappers (App.tsx unchanged) → `tests/progress.test.ts`' pretend storage → `memoryStorage()` → list `progressSave` in `tests/saves/saves.test.ts` + golden `goops-progress-v1.json` (the old flat record) and `-v1-module.json` → `setSavesConfig(savesJson)` in main.tsx → Settings rows + `SaveCodePanel` (as Glyphtender) and `askToKeepSaves()` after the first finished shift. (Install also updated its Dev Kit to 0.20.4 — Goops' copy was behind.)
**Glyphtender** — install the same way → `src/ui/newGame.ts`: `choicesSave = createSave` (version 2, upgrade 2 drops `twoLetterWords`, `oldSave` reads `twoLetterSave`, `clean` = the old range / board / seat checks), `loadChoices` / `saveChoices` thin wrappers (tests unchanged) → `tests/saves/saves.test.ts` + golden v1, v2, v2-module → `content/saves.json` `storageAllowed`: `src/ui/online/session.ts` (room code, F95) → Settings rows + `SaveCodeScreen` in `menus.tsx` / `menuScreens.ts`. **Still to move** (check:framework lists them; a known gap until done): `src/ui/online/onlineOptions.ts` (has the same 2-letter marker → version 2 + the same upgrade), `src/tutorial/progress.ts` (progress kind), `src/ui/online/wordOutbox.ts` (a queue — settings kind, or `storageAllowed`), `src/ui/fullscreen.ts` (writes the UI kit's Settings slot — `storageAllowed`, the UI kit keeps its own saving).

## Tests
`npm test` (vitest), `npm run typecheck` and `npm run lint` here in `saves/`. Everything runs in Node with `memoryStorage()` (full / blocked on demand) and fake browser environments for the health check; the save code uses Node's own CompressionStream. `ui/SaveCodePanel.tsx` is typechecked against the framework's UI kit (`saves/ui/kit/index.ts` passes `'../../ui/kit'` on to `../ui-kit/kit`; `tsconfig.json` points `react` at the UI kit's copy so there's one React) and proven in the browser in Glyphtender. The installer: `scripts/install-saves.test.mjs`.
