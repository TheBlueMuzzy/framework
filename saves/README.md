# Saves

The player's saves — settings, progress, a run in progress, save slots — kept so that **no update, broken write, full storage or browser habit loses them**. The game says *what* it saves (`createSave({ key, kind, version, fresh, upgrades })`); the module keeps it versioned, upgraded step by step, backed up, and copyable as a **save code**.

Design: `../.planning/design/saves.md` (research: `../.planning/research/saves.md`). Framework v0.10 (F86 = layers 0 + 1; F93 = layer 2, run resume; F94 = layer 3, seed + move log; F96 = layer 5, link codes; the other layers are F95–F99). Kit **0.4.0**. Proven on scratch copies of Goops (progress) and Glyphtender (New Game choices; a game vs the AI continued after the tab closed — since 0.4.0 rebuilt by replay; a Daily game) — see *Proof* below.

No library: localStorage, the browser's own CompressionStream, and nothing else at run time (the optional link-code cloud is a small worker of the game's own on Cloudflare — no packages but wrangler).

## What a game gets (0.4.0)
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
| `ui/SaveCodePanel.tsx` | The Save code screen (copy / download / paste / load a file; 0.3.0: + **Link code** — make / copy / type one, "Delete my data", the privacy line — when given `cloud`), built from UI kit parts. **Only installed when the game has the UI kit** (the module's one link to another module, kept optional) |
| `run.ts` | **Run resume (0.2.0).** `createRun` — a game in progress saved at the game's break points (`autosave`) and when the tab hides or closes, `pending()` for the Continue button without loading it, `resume()`, and `end()` that wipes every copy (backups and a newer build's too) so a finished game never comes back. A newer build's or damaged run → "This game can't be continued", wiped, never a crash. `continueLine` → "Turn 7 · 5 min ago" |
| `replay.ts` | **Seed + move log (0.4.0, F94).** `recordRun` — a game as its rules version + setup (the seed) + every move; `addRunMove`; `replayRun(rules, record, { rulesVersion, matches? })` rebuilds it through the game's own rules (the table module's `Rules` fits as it is) — another rules version, a refused move, a damaged record or a replay that lands on a different game → one plain sentence (`REPLAY_WORDS`), never a throw, never a wrong game; `sameResult(live, replayed, fingerprint?)`; `dailySeed(gameId, when?)` = the same seed on every device all day (UTC), `utcDay` |
| `ui/useContinue.ts` | The main menu's Continue (0.2.0): `{ onContinue, continueDetail }` for the UI kit's MainMenu when a run is waiting, `{}` when not; a can't-continue run → a toast and Continue goes. UI kit only, like the panel |
| `cloud.ts` | **Link codes (0.3.0, F96).** `makeLinkCode` sends the save code to the game's own server → "K7QM-2XRP" (8 characters, no O/0 or I/1); `loadLinkCode` brings it in through `readSaveCode` (same checks; progress merged by each field's rule); `deleteLinkCode` = "Delete my data"; `linkCodeHere`; `cloudAddress(import.meta.env.VITE_SAVES_CLOUD)`. Offline first: no network → one plain sentence (`CLOUD_WORDS`), nothing changed |
| `cloudRoutes.ts` | The cloud's web addresses (`/saves/link` · `/saves/get` · `/saves/delete` · `/health`) as plain Requests → Responses with the store passed in — tested without Cloudflare. Size cap (the save code's 300,000 characters), wrong codes per address per hour, new codes per address per hour, addresses kept only scrambled for the hour |
| `oldSaves.ts` | The test kit: golden saves, round trip, damaged saves, full storage, and (0.2.0) `checkRunEnds` — used by the game's `tests/saves/saves.test.ts` |
| `config.ts` | `content/saves.json`: backups, nudge, cloud (keepDays 7, wrongTriesPerHour 10, uploadsPerHour 20) |
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
- *a game kept as seed + moves has a replay test* (0.4.0) — a game that calls `recordRun` needs a test (`*.test.ts` in `tests/` or `src/`) that calls `replayRun` and `sameResult`: replaying is only safe if it's proven to give back the same game.

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

### Seed + move log — Continue by replay, the Daily game (layer 3, 0.4.0)
A game whose randomness lives in its state (a seeded position — the table module's promise) can be kept as **how it started + every move**: tiny, and the same record gives Continue, replays, a daily game and (F98) checked leaderboards. Glyphtender's, from the F94 proof:
```ts
// src/game/record.ts
export const RULES_VERSION = 1   // +1 when a rule change would replay old games differently (golden games fail = bump it)
export const newRecord = (setup: GameSetup) => recordRun<GameSetup, Action>({ rulesVersion: RULES_VERSION, setup })
// the store: startGame → record = newRecord(setup) · each move through the rules' door, people's AND the AI's:
record = addRunMove(record, seat, action, seats[seat].kind === 'bot' ? 'bot' : 'seat')   // set together with the new game
// the run saves the record + the live game's fingerprint (not the game); Continue replays it:
matchRun.autosave({ record, print: fingerprint(game), turn: game.turnCount, … })
const back = replayRun(glyphtenderRules(words), m.record, { rulesVersion: RULES_VERSION, matches: { live: m.print, view: fingerprint } })
if (!back.ok) { toast(back.message); matchRun.end() } else loadState(back.state, …)
// the Daily game: the same setup for everyone today
startGame({ players: 2, seed: dailySeed('glyphtender'), turnOrder: pickTurnOrder(2, seed), …fixed table rules, bots: [1] })
```
Then a test that plays a game the way the screen does and checks `replayRun` → `sameResult` after every move (check:framework asks for it).
- **The AI's own randomness doesn't matter:** its moves are logged, not its thinking — a replay needs no AI.
- **Another rules version → refused, never replayed** (an old record under new rules would quietly be a different game). A replay that doesn't land on the saved fingerprint → refused too. Both say one plain sentence (`REPLAY_WORDS`), and Continue goes.
- **A replay that scores needs what scoring needs** (Glyphtender: its word list) — wait for it before replaying; if it can't load, say so and keep the run.
- **Daily game:** `dailySeed(gameId)` hashes `"<gameId>:<UTC day>"` — no server, no device, no `Math.random`; everyone's day changes at midnight UTC. Fix the rest of the table too (players, board, word rules, who goes first from the same seed), or two players' "daily" games differ.
- Why `replay.ts` doesn't import the table module: the modules are copied into a game one by one and a game may have saves without the table; the replay only needs `setup` / `check` / `apply`, which the table's `Rules` has.

### Link codes — the save on another device without copy-paste (layer 5, 0.3.0)
The save code is long; a **link code** is 8 characters (`K7QM-2XRP`, no O/0 or I/1). The game's own small server (a SQLite Durable Object on Muzzy's Cloudflare) keeps the save code under it for `cloud.keepDays` (7), then deletes it; on the other device the save comes in through `readSaveCode` — checked first, progress **merged** by each field's rule (best kept, counts added). Decisions + why: `../.planning/design/saves.md` → Layer 5.
1. `node ~/.claude/config/bmuz/scripts/install-module.mjs saves . --cloud` → `cloud/worker.ts` + `cloud/wrangler.json` (`<game>-saves`, local port 1998), then the printed steps: `npm install -D wrangler`, `"cloud:dev": "wrangler dev -c cloud/wrangler.json"`, `"cloud:deploy": "wrangler deploy -c cloud/wrangler.json"`, `.wrangler/` in .gitignore.
2. The Save code screen: `<SaveCodePanel saves={…} cloud={{ url: cloudAddress(import.meta.env.VITE_SAVES_CLOUD) }} … />`. No `VITE_SAVES_CLOUD` and not on this PC / the Wi-Fi → no cloud → no Link code part (the rest of the screen as before).
3. Try it: `npm run cloud:dev` + `npm run dev` → Settings → Save code → Make a link code, then type it in another browser.
4. **Going live is Muzzy's call** (a public server that keeps players' saves): `npx wrangler login` once, `npm run cloud:deploy`, then build the game with `VITE_SAVES_CLOUD=<game>-saves.joebrogno.workers.dev`. Deploy the cloud again when `cloud/`, `src/saves/cloudRoutes.ts` or content/saves.json `cloud` change.
- **A fetch doesn't delete the code** (a third device, or a retry after the other device's storage was full); "Delete my data" does, from either device. Wrong, expired and deleted codes get the same answer.
- **Guess limit:** `cloud.wrongTriesPerHour` wrong codes from one address → every try from it is refused until the hour ends; `cloud.uploadsPerHour` new codes per address per hour. The address is kept only as a scrambled number, only for that hour.
- **Free plan fit** (Cloudflare docs, 2026-10-20): Workers 100,000 requests/day · Durable Objects 100,000 requests/day (alarms count), 100,000 SQLite rows written/day (`setAlarm` = 1), 5 million rows read/day, 1 GB per object (5 GB per account), 2 MB per row, 10 ms CPU per request. A link code ≈ 1–2 rows written; the object stops making new codes at 900 MB.
- **Test server:** `wrangler dev -c cloud/wrangler.json --var TEST_KEEP_SECONDS:5` = codes last 5 seconds (never set live).

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
recordRun({ rulesVersion, setup, moves? }) · addRunMove(record, seat, action, by?) · replayRun(rules, record, { rulesVersion, matches?: { live, view? }, everyMove?, words?, maxMoves? }) — maxMoves: a server replaying records strangers send refuses longer ones up front
  → { ok, state } | { ok: false, reason: other-version|move-refused|damaged|different, message, move? } · sameResult(live, replayed, view?) · dailySeed(gameId, when?) · utcDay(when?) · REPLAY_WORDS
ui/useContinue(run, onResume, words?) → { onContinue?, continueDetail? } for the UI kit's MainMenu
makeSaveCode(saves) → Promise<string> · readSaveCode(code, saves) → Promise<{ ok, restored, skipped } | { ok: false, message }>
saveFileName(saves) · downloadSaveFile(code, name) · readSaveFile(file) · copyText(text)
makeLinkCode(saves, cloud) → { ok, link, expiresAt } | { ok: false, message } · loadLinkCode(typed, saves, cloud) → CodeResult · deleteLinkCode(saves, cloud) · linkCodeHere(saves) · cloudAddress(env?) · CLOUD_WORDS   (cloud = { url, storage?, fetch?, online?, timeoutMs? })
handleCloud(request, { rows, settings, address, now?, keepMs? }) · memoryCloudRows() · readLinkCode · showLinkCode · newLinkCode   (cloudRoutes.ts — the worker's side)
checkSaveHealth(env?) → Promise<{ canSave, kept, inFrame, onItch, warnings: [{ id, level: risk|note, message }] }> · askToKeepSaves() · healthLine(health)
createBackupNudge(game, { storage?, config?, now? }) → { noteProgress(n?), backedUp(), due(health?), shown() }
SAVE_SETTINGS_ROWS · SAVE_CODE_ROW · SAVE_HEALTH_ROW · HEALTH_WORDS · CODE_WORDS · NUDGE_WORDS · NOTES
setSavesConfig(json) · readSavesConfig(json) · memoryStorage(start?) · mergeRecords(kind, fields, a, b) · fillMissing(saved, fresh)
oldSaves.ts: goldenFileName · missingGoldenVersions · goldenSavesFor · makeGoldenSave · checkGoldenSave · checkRoundTrip · checkDamagedSaves · checkFullStorage · checkRunEnds
```
Every player-facing sentence (`NOTES`, `CODE_WORDS`, `HEALTH_WORDS`, `NUDGE_WORDS`, `RUN_WORDS`, `REPLAY_WORDS`, the panel's `words`) can be replaced.

## Privacy
Every save stays on this device (the browser's storage) unless the player copies a save code. Online rejoin (rooms kit 0.9.0, F95) keeps the room code and the player id on this device too; they only go to the game's own room server, to get the player back into their seat. With a link code (0.3.0, only when the player makes one): a copy of the save code — nothing else, no name, no account — goes to the game's own server on Cloudflare for `cloud.keepDays` (7) days, then deletes itself; "Delete my data" removes it at once; the player's address is used only to count wrong tries, kept scrambled for an hour. The Save code screen says this in one line (`CLOUD_WORDS.privacy`). A move record (0.4.0) holds only the game — its setup, seed and moves, no name, no device — and stays in the run save on this device; the daily seed is made from the date alone. Nothing is sent anywhere else.

## `content/saves.json`
`backups` (0–5, default 2: older copies beside each save) · `nudge.afterProgress` (points before "back up your save", 0 = never; default 10) · `nudge.minDaysBetween` (default 7) · `nudge.onlyWhenAtRisk` (default false) · `cloud.keepDays` (1–30, default 7 — Muzzy 2026-10-20) · `cloud.wrongTriesPerHour` (default 10) · `cloud.uploadsPerHour` (default 20) · `storageAllowed` ([{ file, why }]). `_help` / `_ranges` follow the Dev Kit convention.

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

## Tests
`npm test` (vitest), `npm run typecheck` and `npm run lint` here in `saves/`. Everything runs in Node with `memoryStorage()` (full / blocked on demand) and fake browser environments for the health check; the save code uses Node's own CompressionStream. `ui/SaveCodePanel.tsx` is typechecked against the framework's UI kit (`saves/ui/kit/index.ts` passes `'../../ui/kit'` on to `../ui-kit/kit`; `tsconfig.json` points `react` at the UI kit's copy so there's one React) and proven in the browser in Glyphtender. The installer: `scripts/install-saves.test.mjs`.
