# Saves

The player's saves — settings, progress, a run in progress, save slots — kept so that **no update, broken write, full storage or browser habit loses them**. The game says *what* it saves (`createSave({ key, kind, version, fresh, upgrades })`); the module keeps it versioned, upgraded step by step, backed up, and copyable as a **save code**.

Design: `../.planning/design/saves.md` (research: `../.planning/research/saves.md`). Framework v0.10 (F86 = layers 0 + 1; layers 2–8 are F93–F99). Kit **0.1.0**. Proven on scratch copies of Goops (progress) and Glyphtender (New Game choices) — see *Proof* below.

No library: localStorage, the browser's own CompressionStream, and nothing else at run time.

## What a game gets (0.1.0)
| File | Does |
|---|---|
| `index.ts` | The public API (below) — import from `src/saves` |
| `saves.ts` | **The core.** `createSave` — game-prefixed keys, version stamp, step-by-step upgrades, missing fields filled with today's defaults (never over the player's values), one whole-record write that's read back before it counts, 2 rolling backups (newest GOOD copy wins), a newer build's save kept untouched, full storage caught. Never throws. `kind: 'slots'` → one save per slot + a list |
| `progress.ts` | How two copies of progress combine (for the cloud later, F96): `highest` · `add-up` (counted per device, so two devices' "games played" SUM) · `collect` (every unlock once) · `newest` |
| `fill.ts` | Fill in what's missing after loading (and why a changed default doesn't reach old saves on its own) |
| `storage.ts` | Safe reads/writes of localStorage; `memoryStorage()` for tests (can be made full or blocked) |
| `saveCode.ts` | The save code: `GAME-1z-…` (compressed) copy-paste text and the same as a `.txt` file. Every save in a code is checked before ANY is written — a bad code never wipes a save. Progress is merged, other saves replaced (the old copy stays as a backup) |
| `health.ts` | Will this browser keep the saves? Warnings in plain words: storage blocked · looks like a private window · itch.io's frame · another site's frame · Safari's 7-day rule · persist refused. `askToKeepSaves()` = `navigator.storage.persist()` |
| `nudge.ts` | "Back up your save" after real progress since the last code (never nagging — content/saves.json) |
| `settingsRow.ts` | The Settings rows (`Your save` · `Saved: On this device` · `Save code ›`) for the UI kit's Settings |
| `ui/SaveCodePanel.tsx` | The Save code screen (copy / download / paste / load a file), built from UI kit parts. **Only installed when the game has the UI kit** (the module's one link to another module, kept optional) |
| `oldSaves.ts` | The test kit: golden saves, round trip, damaged saves, full storage — used by the game's `tests/saves/saves.test.ts` |
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
- *the game's save tests pass* — runs `npx vitest run tests/saves/saves.test.ts`: every golden save loads with today's code (and its `expect` values), round trip, cut-off / wrong-type / empty saves fall back to the backup, full and blocked storage keep the game running.
- *the game saves through the module, not straight into the browser's storage* — lists every line of game code that touches `localStorage` / `sessionStorage` (minus `rooms:` ids and `storageAllowed` files).

## Install / update in a game
```
node ~/.claude/config/bmuz/scripts/install-module.mjs saves .        (from the game folder — the safe way: tests first)
node ../../framework/saves/scripts/install-saves.mjs . --dry-run       (just show what would change)
```
Copies `kit/` → `<game>/src/saves/` with a VERSION stamp (tests stay here; `ui/` only with the UI kit), removes files the module no longer ships (only inside `src/saves/`), and gives the game **once**: `content/saves.json` and `tests/saves/saves.test.ts` — after that they're the game's, never overwritten. If the game's ESLint doesn't ignore `src/saves`, it lints it too (that's fine: the kit passes the games' rules).

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
  → save.load() · save.save(data) · save.clear() · save.report() → { from: fresh|save|backup, backup?, upgradedFrom?, newer?, added, replaced, problems, note }
    save.exportRecord() · save.checkRecord(raw) · save.restoreRecord(record) · save.merge(a, b) · save.withStorage(storage)
  kind 'slots' → slots.slot(id) (a Save) · slots.slots() → [{ id, savedAt }] newest first
makeSaveCode(saves) → Promise<string> · readSaveCode(code, saves) → Promise<{ ok, restored, skipped } | { ok: false, message }>
saveFileName(saves) · downloadSaveFile(code, name) · readSaveFile(file) · copyText(text)
checkSaveHealth(env?) → Promise<{ canSave, kept, inFrame, onItch, warnings: [{ id, level: risk|note, message }] }> · askToKeepSaves() · healthLine(health)
createBackupNudge(game, { storage?, config?, now? }) → { noteProgress(n?), backedUp(), due(health?), shown() }
SAVE_SETTINGS_ROWS · SAVE_CODE_ROW · SAVE_HEALTH_ROW · HEALTH_WORDS · CODE_WORDS · NUDGE_WORDS · NOTES
setSavesConfig(json) · readSavesConfig(json) · memoryStorage(start?) · mergeRecords(kind, fields, a, b) · fillMissing(saved, fresh)
oldSaves.ts: goldenFileName · missingGoldenVersions · goldenSavesFor · makeGoldenSave · checkGoldenSave · checkRoundTrip · checkDamagedSaves · checkFullStorage
```
Every player-facing sentence (`NOTES`, `CODE_WORDS`, `HEALTH_WORDS`, `NUDGE_WORDS`, the panel's `words`) can be replaced.

## `content/saves.json`
`backups` (0–5, default 2: older copies beside each save) · `nudge.afterProgress` (points before "back up your save", 0 = never; default 10) · `nudge.minDaysBetween` (default 7) · `nudge.onlyWhenAtRisk` (default false) · `storageAllowed` ([{ file, why }]). `_help` / `_ranges` follow the Dev Kit convention.

## Proof (F86, 2026-10-19) — scratch copies in `~/Documents/dev/.scratch/framework-f86/`
- **Goops** (`goops-progress` v1, before the module `{ v: 1, totalXp, scrapsSpent }`): moved onto `createSave` with `oldSave` reading the old record, `fields` highest / highest. Its own 377 tests pass (its old save test unchanged except the pretend storage), `tsc -b` clean, check:framework Saves: 3 / 3. With its golden files removed, check:framework fails naming `tests/saves/goops-progress-v1.json`.
- **Glyphtender** (`glyphtender:new-game`): the `TWO_LETTER_SAVES_SINCE = 2` marker became version 2 + an upgrade step; `oldSave` maps a no-marker save to v1 and a marked one to v2. Its unchanged `ui/newGame.test.ts` (incl. the 2-letter test) and all 825 tests pass; golden saves v1 / v2 / v2-module load with the right values. With the upgrade step removed on purpose, check:framework fails: `"twoLetterWords" loaded as true, expected false`. Wired into the real Settings (rows + Save code screen).
- **Browser (Playwright's Chromium, the real Settings → Save code screen):** code copied out of one browser and pasted into a fresh one restores the choices; the downloaded file loads in another fresh browser; a cut-off code says "damaged or incomplete" and changes nothing; inside a frame on another site (localhost:5192 framing 127.0.0.1:5191, itch's `allow` list) the screen shows the frame warning, Copy works, and a pasted code restores the choices; with Chrome's storage partitioning on, the framed save and the directly-opened game are separate saves (the itch vs. own-site effect).

### Switch-over steps
**Goops** — `node ~/.claude/config/bmuz/scripts/install-module.mjs saves .` → `src/progress/save.ts` becomes a `createSave` (key `goops-progress`, kind progress, version 1, `oldSave: raw.v === 1`, `fields` highest, `clean` ≥ 0) with `loadProgress` / `saveProgress` kept as thin wrappers (App.tsx unchanged) → `tests/progress.test.ts`' pretend storage → `memoryStorage()` → list `progressSave` in `tests/saves/saves.test.ts` + golden `goops-progress-v1.json` (the old flat record) and `-v1-module.json` → `setSavesConfig(savesJson)` in main.tsx → Settings rows + `SaveCodePanel` (as Glyphtender) and `askToKeepSaves()` after the first finished shift. (Install also updated its Dev Kit to 0.20.4 — Goops' copy was behind.)
**Glyphtender** — install the same way → `src/ui/newGame.ts`: `choicesSave = createSave` (version 2, upgrade 2 drops `twoLetterWords`, `oldSave` reads `twoLetterSave`, `clean` = the old range / board / seat checks), `loadChoices` / `saveChoices` thin wrappers (tests unchanged) → `tests/saves/saves.test.ts` + golden v1, v2, v2-module → `content/saves.json` `storageAllowed`: `src/ui/online/session.ts` (room code, F95) → Settings rows + `SaveCodeScreen` in `menus.tsx` / `menuScreens.ts`. **Still to move** (check:framework lists them; a known gap until done): `src/ui/online/onlineOptions.ts` (has the same 2-letter marker → version 2 + the same upgrade), `src/tutorial/progress.ts` (progress kind), `src/ui/online/wordOutbox.ts` (a queue — settings kind, or `storageAllowed`), `src/ui/fullscreen.ts` (writes the UI kit's Settings slot — `storageAllowed`, the UI kit keeps its own saving).

## Tests
`npm test` (vitest), `npm run typecheck` and `npm run lint` here in `saves/`. Everything runs in Node with `memoryStorage()` (full / blocked on demand) and fake browser environments for the health check; the save code uses Node's own CompressionStream. `ui/SaveCodePanel.tsx` is typechecked against the framework's UI kit (`saves/ui/kit/index.ts` passes `'../../ui/kit'` on to `../ui-kit/kit`; `tsconfig.json` points `react` at the UI kit's copy so there's one React) and proven in the browser in Glyphtender. The installer: `scripts/install-saves.test.mjs`.
