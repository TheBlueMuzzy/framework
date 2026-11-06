# Saves

The player's saves — settings, progress, a run in progress, save slots — kept so that **no update, broken write, full storage or browser habit loses them**. The game says *what* it saves (`createSave({ key, kind, version, fresh, upgrades })`); the module keeps it versioned, upgraded step by step and backed up.

**Frozen** (F186 — Slimmed framework): bug fixes only until a second game needs it. **0.8.0 slimmed it to what Glyphtender calls** — create, storage, old-save upgrades, golden checks, run resume. Archived (git tag `archive/saves-0.7.0`, nothing used them): save codes (`saveCode.ts`, the Save code screen), link codes (`cloud.ts`, `cloudRoutes.ts`, the cloud worker), the Daily leaderboard (`board.ts`, `boardRoutes.ts`, `BoardPanel`, the board worker), seed + move replay (`replay.ts`), any-platform storage (`platform.ts` / `openSaves`), save health (`health.ts`), the backup nudge (`nudge.ts`) and their Settings rows (`settingsRow.ts`). A game's copy keeps working until it updates.

Design: `../.planning/design/saves.md` (research: `../.planning/research/saves.md`). Framework v0.10 (F86 = layers 0 + 1; F93 = layer 2, run resume; F94 = layer 3, seed + move log; F96 = layer 5, link codes; F98 = layer 7, checked leaderboards; F101 = the seams for layers 6 + 8 — one storage switch, saves opened from a slow storage, the format for any language; the platform backends F97 and the Unity port F99 wait for a real store build / Unity game). Kit **0.8.0** (0.8.0, F186: slimmed — above) (0.7.0, F166: an old value that isn't JSON (Glyphtender's tutorial kept the plain text `done`) goes to `oldSave` as that text instead of being called damaged; a golden save's `stored` string is put in storage as that exact text; the game's `tests/saves/saves.test.ts` starter skips with "no saves listed yet" until the game's first createSave (`savesInCode`) — a game that already has the test copies the new top part by hand) (0.6.6, F159: the installer reads its version through the framework’s shared `scripts/kitVersion.mjs` (git asked once per run, in one place); the version line it writes is unchanged) (0.6.5: fetching another device's link code checks whether this device's own code is still live by the game's clock (`now`), not the computer's — a game passing its own clock could forget its code, so "Delete my data" missed it · 0.6.4, F150: proven in real Chromium, WebKit and Firefox — see *Proven in which browsers*; "quota exceeded" on an empty storage (Safari's old private window) now says "blocked", not "full"; `openSaves` knows a full disk by every engine's name for it · 0.6.3: a save code that only partly loads offers to reload the game, so what came back shows — `partlyLoaded()` · 0.6.2: the installer asks git once per run · 0.6.1: the v0.11.0 security review — body size, wrong tries per IPv6 /48). Proven on scratch copies of Goops (progress) and Glyphtender (New Game choices; a game vs the AI continued after the tab closed — since 0.4.0 rebuilt by replay; a Daily game; since 0.5.0 its Daily board) — see *Proof* below.

No library: localStorage and nothing else at run time.

## What a game gets (0.8.0)
| File | Does |
|---|---|
| `index.ts` | The public API (below) — import from `src/saves` |
| `saves.ts` | **The core.** `createSave` — game-prefixed keys, version stamp, step-by-step upgrades, missing fields filled with today's defaults (never over the player's values), one whole-record write that's read back before it counts, 2 rolling backups (newest GOOD copy wins), a newer build's save kept untouched (in any copy — this build then never writes), full storage caught (backups older than the newest good copy make room; that copy itself never goes). A write that doesn't read back is undone. Never throws. `kind: 'slots'` → one save per slot + a list |
| `progress.ts` | How two copies of progress combine (a backup and the newest, or two devices' copies): `highest` · `add-up` (counted per device, so two devices' "games played" SUM) · `collect` (every unlock once) · `newest` |
| `fill.ts` | Fill in what's missing after loading (and why a changed default doesn't reach old saves on its own) |
| `storage.ts` | Safe reads/writes of localStorage; `memoryStorage()` for tests (can be made full or blocked). **0.6.0:** `setSavesStorage(storage, { native? })` — one switch for the whole kit (every save and run); a save made before the switch follows it too |
| `run.ts` | **Run resume (0.2.0).** `createRun` — a game in progress saved at the game's break points (`autosave`) and when the tab hides or closes, `pending()` for the Continue button without loading it, `resume()`, and `end()` that wipes every copy (backups and a newer build's too) so a finished game never comes back. A newer build's or damaged run → "This game can't be continued", wiped, never a crash. `continueLine` → "Turn 7 · 5 min ago" |
| `ui/useContinue.ts` | The main menu's Continue (0.2.0): `{ onContinue, continueDetail }` for the UI kit's MainMenu when a run is waiting, `{}` when not; a can't-continue run → a toast and Continue goes. **Only installed when the game has the UI kit** |
| `oldSaves.ts` | The test kit: golden saves, round trip, damaged saves, full storage, and (0.2.0) `checkRunEnds` — used by the game's `tests/saves/saves.test.ts` |
| `config.ts` | `content/saves.json`: backups (default 2) |
| `conformance.mjs` | Its check:framework checks |
| `../FORMAT.md` | The save format for any language (keys, records, loading, saving, golden saves) — what a C# or other version is built from; `kit/format.test.ts` keeps it true |

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
// oldSave's raw = the stored value read as JSON — or, when the stored text isn't JSON, that text itself (0.7.0).
// Glyphtender's tutorial kept the plain word done:
//   oldSave: (raw) => (raw === 'done' ? { version: 1, data: { done: true } } : null)
// A cut-off write reaches oldSave as text too, so return null for anything you don't recognise.
const progress = progressSave.load()   // anywhere; never throws
progressSave.save(progress)            // { ok } | { ok: false, reason: full|blocked|newer|not-kept|not-data, message }

// main.tsx, once: the knobs in content/saves.json
import savesJson from '../content/saves.json'
setSavesConfig(savesJson)
```

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
`stored` is the JSON as it is (an object), or the text as a string: `"stored": "done"` = the plain text `done` in storage (an old value that isn't JSON, 0.7.0).
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
NOTES
setSavesStorage(storage, { native? }) · savesStorage() · savesOnNativeStorage() · switchedStorage
setSavesConfig(json) · readSavesConfig(json) · memoryStorage(start?) · mergeRecords(kind, fields, a, b) · fillMissing(saved, fresh)
oldSaves.ts: goldenFileName · missingGoldenVersions · goldenSavesFor · makeGoldenSave · checkGoldenSave · checkRoundTrip · checkDamagedSaves · checkFullStorage · checkRunEnds · savesInCode
```
Every player-facing sentence (`NOTES`, `RUN_WORDS`, useContinue's `words`) can be replaced.

## Privacy
Every save stays on this device (the browser's storage). Online rejoin (rooms kit 0.9.0, F95) keeps the room code and the player id on this device too; they only go to the game's own room server, to get the player back into their seat. Nothing is sent anywhere else. (Until 0.8.0 a player could also send a copy of their save to the game's server — the link code — or a Daily game to its leaderboard; both were archived unused: git tag `archive/saves-0.7.0`.)

## `content/saves.json`
`backups` (0–5, default 2: older copies beside each save) · `storageAllowed` ([{ file, why }]). `_help` / `_ranges` follow the Dev Kit convention. An older file's `nudge` / `cloud` / `board` (before 0.8.0) are ignored.

## Proof (F98, 2026-10-20) — a scratch Glyphtender in `~/Documents/dev/.scratch/glyphtender-f98/`
A copy of the F94 scratch, saves 0.5.0 installed with `--board`. `src/game/record.ts` gained `dailySetup(day)` (now also what `startDailyGame` uses) and `dailyScore` (seat 0's Magic once over); `board/worker.ts` imports them + `glyphtenderRules` + the online server's bundled word list (read once at start-up); `src/game/dailyBoard.ts` keeps a finished Daily game for the board; Main menu → "Daily board" (`BoardPanel`); content/saves.json `board.dailyTries` 1. **CPU** (`wrangler dev --var CHECK_NOW:1`, 12 whole greedy-sim Daily games, 55–100 moves): **9–18 ms per whole replay** (Node: 9 ms for 72 moves) — over the free plan's 10 ms → checked later, 10 moves per alarm (20-move steps measured 1–10 ms, so 10). Playwright (`e2e/f98-board.mjs`, board on 5998 with `--persist-to`, vite 5396): a Daily game vs the AI to the end (78 moves) → Daily board → "ada" → Send → "Checking your game…" → "Your score: 8 · #1 today (checked by the board)" = the live game's Magic; the same record with `score: 999` → the board shows 8; an old rulesVersion → refused at once; another seed → `not-todays-game`; a move out of turn → refused by the replay (and through the screen in a second browser: "…it didn't add up, so it wasn't counted"); a second Daily game the same day (Magic 17, better) → "Only your first Daily game each day goes on the board", the board unchanged; Remove my score → gone; no page errors. Screens at 390×844 and 1440×900 (and scrolled to the end): every row, box and button ≥ 28 px from the card's edge, ties share a place, "You" badge, the privacy line at the end of the card's scroll. Its 831 tests + tsc + lint pass; check:framework as before (the known direct-storage gaps).

## Proof (F96, 2026-10-20) — a scratch Goops in `~/Documents/dev/.scratch/goops-f96/`
Saves 0.3.0 installed with `--cloud`; `src/progress/save.ts` moved onto `createSave` (totalXp / scrapsSpent `highest`, plus a scratch-only `shiftsPlayed` `add-up`), Settings → Gameplay → Save code with `cloud={{ url: cloudAddress(import.meta.env.VITE_SAVES_CLOUD) }}`. The cloud worker under `wrangler dev` (port 4999, `--persist-to` a scratch folder), the game under vite (5394), Playwright's Chromium with separate browser profiles (`e2e/f96-cloud.mjs`): A (5000 XP, 10 scraps, 4 shifts) makes `7QL8-XFJ3`; B (3000, 50, 2) types it in lower case with a space → **5000 XP, 50 scraps, 6 shifts**; after A's "Delete my data" the code says "That link code didn't work…" and changes nothing; with `TEST_KEEP_SECONDS:5` a 6-second-old code fails the same way (the object's alarm ran twice, ok); 20 wrong codes from one address → 9 "didn't work" then 11 "Too many wrong link codes…" (the 10th wrong try of the hour was the deleted code); the worker blocked (route aborted) → "Couldn't reach the game's server…" for both Make and Get, progress untouched; no page errors. The worker typechecks against the game's tsconfig (`erasableSyntaxOnly` on). Screens at 390×844 and 1440×900: nothing touches the card's sides, the privacy line at the end of the card's scroll.

## Proof (F94, 2026-10-20) — a scratch Glyphtender in `~/Documents/dev/.scratch/glyphtender-f94/`
A copy of the F93 scratch, saves 0.4.0 installed. `src/game/record.ts` (RULES_VERSION 1, `newRecord`, `rebuildGame`); the store keeps `record` (set by `startGame`, each move added in `send` — the one door — and set in the same update as the new game, so a refresh's shrink-and-grow never leaves them apart; `loadState` takes it, a dev jump has none); `src/game/run.ts` at version 2 = `{ record, print, turn, options, seats, stats, game: null }` (upgrade 2 keeps a v1 run's game, put back as it was); Continue waits for the word list, replays, checks the fingerprint; "Daily game" on the main menu (UI kit `items[].detail`, shown once the tutorial is done). Tests: `src/game/record.test.ts` — vs the AI to the end, replay fingerprint == live after every one of its moves, the record through JSON, Continue round trip (and play goes on into the same record), an older rulesVersion and a wrong fingerprint refused; golden `glyphtender_run-v2.json`; all 830 tests pass; check:framework Saves: golden v1–2 ✓, save tests ✓, run ends ✓, **replay test ✓** (the direct-storage line still lists the known gaps). Playwright (`e2e/f94-replay.mjs`, port 5395): New Game vs the AI, 4 turns (11 moves: 6 the person's, 5 the AI's) → the run save is the record with `game: null` → reload → "Continue · Turn 5 · just now" → the same fingerprint `96a6eb3db3667667`, turn 4, 11 moves, and play goes on to 14; two separate browsers (desktop + phone) → Daily game → seed 4283455274, the same turn order and the same opening fingerprint; a run planted with `rulesVersion: 0` → Continue → "This game was played under a different version of the rules…" toast, no game, the run wiped, no Continue, no page errors. Menu screenshots at 390×844 and 1440×900: "Daily game / Same seeds for everyone today" under Play, nothing touching an edge.

## Proof (F93, 2026-10-20) — a scratch Glyphtender in `~/Documents/dev/.scratch/glyphtender-f93/`
UI kit 0.23.0 + saves 0.2.0 installed with install-module; `src/game/run.ts` (a local game's table: state, options, seats, stats; autosave when a turn or the phase changes, `end()` on game over / leaving / a new game), Continue in `src/ui/menus.tsx` (`useContinue`, "Turn {n}" in content/text). In Playwright's Chromium: a game vs the AI → the draft + 3 turns → reload → **Continue · Turn 4 · just now** → Continue lands on the same turn (board, hands, seats identical); a 5-minute-old save reads "Turn 4 · 5 min ago"; finishing the game (`playRest`) → no copy left, no Continue after a reload; a new game left from the menu → the same; a version-7 run planted → Continue with "3 hours ago" → "This game can't be continued…" toast, wiped, no page errors. Menu screenshots with and without Continue at 390×844 and 1440×900. Its 824 tests pass; check:framework Saves: golden copy ✓, save tests ✓ (`checkRunEnds`), "a run cleared at the end never comes back" ✓ (the direct-storage check still lists the game's known gaps, see F86 below).

## Proof (F86, 2026-10-19) — scratch copies in `~/Documents/dev/.scratch/framework-f86/`
- **Goops** (`goops-progress` v1, before the module `{ v: 1, totalXp, scrapsSpent }`): moved onto `createSave` with `oldSave` reading the old record, `fields` highest / highest. Its own 377 tests pass (its old save test unchanged except the pretend storage), `tsc -b` clean, check:framework Saves: 3 / 3. With its golden files removed, check:framework fails naming `tests/saves/goops-progress-v1.json`.
- **Glyphtender** (`glyphtender:new-game`): the `TWO_LETTER_SAVES_SINCE = 2` marker became version 2 + an upgrade step; `oldSave` maps a no-marker save to v1 and a marked one to v2. Its unchanged `ui/newGame.test.ts` (incl. the 2-letter test) and all 825 tests pass; golden saves v1 / v2 / v2-module load with the right values. With the upgrade step removed on purpose, check:framework fails: `"twoLetterWords" loaded as true, expected false`. Wired into the real Settings (rows + Save code screen).
- **Browser (Playwright's Chromium, the real Settings → Save code screen):** code copied out of one browser and pasted into a fresh one restores the choices; the downloaded file loads in another fresh browser; a cut-off code says "damaged or incomplete" and changes nothing; inside a frame on another site (localhost:5192 framing 127.0.0.1:5191, itch's `allow` list) the screen shows the frame warning, Copy works, and a pasted code restores the choices; with Chrome's storage partitioning on, the framed save and the directly-opened game are separate saves (the itch vs. own-site effect).

### Switch-over steps
**Goops** — `node ~/.claude/config/bmuz/scripts/install-module.mjs saves .` → `src/progress/save.ts` becomes a `createSave` (key `goops-progress`, kind progress, version 1, `oldSave: raw.v === 1`, `fields` highest, `clean` ≥ 0) with `loadProgress` / `saveProgress` kept as thin wrappers (App.tsx unchanged) → `tests/progress.test.ts`' pretend storage → `memoryStorage()` → list `progressSave` in `tests/saves/saves.test.ts` + golden `goops-progress-v1.json` (the old flat record) and `-v1-module.json` → `setSavesConfig(savesJson)` in main.tsx → Settings rows + `SaveCodePanel` (as Glyphtender) and `askToKeepSaves()` after the first finished shift. (Install also updated its Dev Kit to 0.20.4 — Goops' copy was behind.)
**Glyphtender** — install the same way → `src/ui/newGame.ts`: `choicesSave = createSave` (version 2, upgrade 2 drops `twoLetterWords`, `oldSave` reads `twoLetterSave`, `clean` = the old range / board / seat checks), `loadChoices` / `saveChoices` thin wrappers (tests unchanged) → `tests/saves/saves.test.ts` + golden v1, v2, v2-module → `content/saves.json` `storageAllowed`: `src/ui/online/session.ts` (room code, F95) → Settings rows + `SaveCodeScreen` in `menus.tsx` / `menuScreens.ts`. **Still to move** (check:framework lists them; a known gap until done): `src/ui/online/onlineOptions.ts` (has the same 2-letter marker → version 2 + the same upgrade), `src/tutorial/progress.ts` (progress kind), `src/ui/online/wordOutbox.ts` (a queue — settings kind, or `storageAllowed`), `src/ui/fullscreen.ts` (writes the UI kit's Settings slot — `storageAllowed`, the UI kit keeps its own saving).

## Proven in which browsers (F150, 2026-10-26)
`scripts/browsers.test.mjs` puts the module on a real page in **Playwright's Chromium** (Chrome, Edge, Android), **WebKit** (Safari, and every browser on an iPhone — they all must use it) and **Firefox**, and plays what a player's browser does. All three pass the same checks with the same plain words:

| Checked | Chromium | WebKit | Firefox |
|---|---|---|---|
| Save → reload → load; close the whole browser, open it again → still there | ✓ | ✓ | ✓ |
| A cut-off newest copy → the backup loads, with the plain note | ✓ | ✓ | ✓ |
| Upgrade v1 → v2 on load; an older build leaves the v2 save untouched | ✓ | ✓ | ✓ |
| **Really full** storage (filled to the last character): "full", same words, last good save kept; old backups make room | ✓ | ✓ | ✓ |
| Storage refused (SecurityError on write · "block all cookies", where even looking throws · Safari's old private window, "quota exceeded" on an empty storage) → "blocked", same words, the game runs on | ✓ | ✓ | ✓ |
| A private window (Playwright's fresh context): saves last while open, the next one starts empty | ✓ | ✓ | ✓ |

What each engine throws when storage is full: the same today — a DOMException named `QuotaExceededError`, code 22, at 5 MiB (5,242,880 characters, key names included). `isFullError` also knows the older names (Firefox's `NS_ERROR_DOM_QUOTA_REACHED`, code 1014) for older browsers.

**Run it:** `npm test` here runs it with everything else (about 9 s for all three). One-time on a new machine: `npx playwright install chromium webkit firefox`. An engine that isn't installed is skipped with a loud ⚠ line on your machine, never on GitHub (its Checks install the three from `"testBrowsers"` in `package.json`).

**Still only a real device can show:**
- **Real private windows.** Playwright's Chromium and Firefox contexts aren't true Incognito / Private Browsing (full-size quota, private file storage works), so the "looks like a private window" guess is only proven in WebKit. Real Safari before 11 threw "quota exceeded" on every write in a private window — simulated here, not run (no such browser in Playwright).
- **Safari's 7-day rule** (ITP deleting a site's storage after 7 days without a visit) and a Home Screen app keeping its own days — time-based, Apple-only, not in Windows WebKit.
- **iPhone specifics:** storage being cleared under low space, storage partitioning in itch.io's frame on Safari, the page being killed in the background (pagehide is proven here; a phone that freezes the tab is not).
- **The real-size quota** on a phone (desktop builds all stop at 5 MiB; a phone may give less).

## Tests
`npm test` (vitest), `npm run typecheck` and `npm run lint` here in `saves/`. `scripts/browsers.test.mjs` runs the module in three real browsers (above); everything else runs in Node with `memoryStorage()` (full / blocked on demand). `ui/useContinue.ts` is typechecked against the framework's UI kit (`saves/ui/kit/index.ts` passes `'../../ui/kit'` on to `../ui-kit/kit`; `tsconfig.json` points `react` at the UI kit's copy so there's one React). The installer: `scripts/install-saves.test.mjs`.
