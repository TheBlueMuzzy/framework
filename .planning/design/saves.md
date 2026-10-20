# The Saves module — design (framework v0.10, F86 = layers 0 + 1, F93 = layer 2, F94 = layer 3, F96 = layer 5, F98 = layer 7)

Research first: `../research/saves.md` (2026-10-19). Muzzy 2026-10-19, on the first plan that only covered what our three games already did:
> "sounds like you need to research before you design then" → research → "ok. makes sense" (layers 0 + 1 now, layers 2–8 → F93–F99).

He also asked about lifetime stats and meta progression → they're the `progress` kind, and each field says how it combines, so two devices' stats add up instead of the higher one winning.

## The idea
- **The game says what it saves; the module keeps it safe.** `createSave({ key, kind, version, fresh, upgrades })` — one call per save. `load()` and `save()` never throw.
- On the web, saves are mostly lost to the **browser**, not to bugs (Safari's 7-day rule, the itch.io frame, private windows, "clear site data"). So the cheapest safety net — a **save code** the player can copy out and paste back — ships in the first release with the core.

## Layer 0 — the core
| Problem | Answer |
|---|---|
| An update changes a save's shape | `version` + **step-by-step upgrades** (`upgrades: { 3: v2 → v3 }`, never a jump) |
| A new field | filled with today's default after loading — **the player's values are never overwritten** |
| A default change that must reach old saves (Glyphtender's 2-letter fix) | that's an **upgrade step**, not an edit of `fresh` |
| A save written before the module | `oldSave(raw)` → which version it is + its data |
| The browser closed mid-write / a bug wrote junk | **one whole record per write, read back before it counts; 2 rolling backups**; the newest GOOD copy wins; a broken copy never pushes a good backup out; the broken one is kept aside (`<key>~damaged`) |
| A save from a newer build (after a rollback) | **kept untouched**: the game runs on fresh values, never writes over it, and says so (`report().note`) |
| Full storage | caught; the oldest backups make room first; else `{ ok: false, reason: 'full' }` and the game plays on |
| itch.io games sharing one storage | keys start with the game's name |
| Proving old saves still load | **golden saves** `tests/saves/<key>-v<N>.json` + the game's ready-made test; check:framework fails a version with no golden copy |

**Kinds:** `settings` (newest wins) · `progress` (the precious one; fields combine by rule) · `run` (through `createRun` — layer 2; `end()` when it ends — backups too, or a finished run would come back) · `slots` (one save per slot + a list).

**Progress fields** (`progress.ts`, for the cloud later — F96 — and for a save code pasted onto existing progress today): `highest` · `add-up` · `collect` · `newest`. Add-up is a per-device counter: each record keeps every device's own part (`counts`), the game only ever sees the total. So two devices' "games played" sum, and the same copy met twice never counts twice. A part from before counting is one `earlier` part.

## Layer 1 — the safety net against the browser
- **Save code** `GAME-1z-<data>`: the records exactly as stored (with their versions), deflated with the browser's own CompressionStream, base64url. The same text as a `.txt` file. Loading checks **every** record before writing **any**; progress merges (a pasted older code can't lose progress), other saves are replaced (the old copy stays a backup). Wrong game, newer format, newer save, cut off, typo → one plain sentence, nothing changed.
- **Storage health** (`checkSaveHealth`, no prompts): blocked · looks private (a best guess — browsers hide it) · itch frame · another site's frame · Safari without Home Screen · persist refused (a quiet note). `askToKeepSaves()` after the first real progress (Firefox asks the player).
- **Nudge**: "back up your save" after `nudge.afterProgress` points since the last code, at most every `minDaysBetween` days, optionally only on risky browsers.
- **Settings row + screen**: three rows the UI kit's Settings draws itself; the Save code screen (`ui/SaveCodePanel.tsx`) is built from UI kit parts.

## Layer 2 — run resume (F93, kit 0.2.0)
- **`createRun({ key, version, fresh, summary?, snapshot? })`** wraps a `run` save. The game calls `autosave(data)` at its **break points** (a turn ended, a wave cleared — moments the state is whole); the tab hiding (`visibilitychange` → hidden, and `pagehide` for browsers that skip it) saves `snapshot()` (the game right now, or null) and retries a break-point save the browser refused. Nothing is saved after `end()`, so a hide just after the game ended can't write it back.
- **Continue without loading:** `pending()` → `{ savedAt, summary, canContinue } | null`, built on the core's new `peek()` (no report, no write, a damaged copy not even set aside). The UI kit's MainMenu shows Continue only when it isn't null; its second line ("Turn 7 · 5 min ago": the game's summary + `continueLine`) sits **inside** the button (MainMenu `continueDetail` / `items[].detail`, UI kit 0.23.0), so the menu never jumps. `saves/kit/ui/useContinue.ts` hands MainMenu both props.
- **`end()` wipes every copy** — backups (or the finished game would load again from one) and a newer build's copy (`clear({ evenNewer })`).
- **A newer build's run or a damaged one:** Continue still shows (with just its time); pressing it says "This game can't be continued…" (`RUN_WORDS`), wipes it, and Continue goes. Never a throw. Why not keep a newer build's run like progress: the core never writes over a newer copy, so it would block every run this build tries to save — and a run is worth little later.
- **check:framework:** a `createRun` counts as a save (golden saves per version); "a run cleared at the end never comes back" = the run is named, something calls `<name>.end()`, and the game's save test runs `checkRunEnds` (autosave, backups in place, `end()`, reload → nothing left, no Continue, nothing loads).
- Proven on a scratch Glyphtender vs the AI (README → Proof F93).

## Layer 3 — seed + move log (F94, kit 0.4.0)
A game kept as **how it started + every move**, rebuilt by playing the moves again through the game's own rules. Tiny, and the same record serves Continue, replays, a daily game everyone shares, and (F98) a leaderboard that computes the score itself.

| Decision | What | Why |
|---|---|---|
| **The record** | `{ rulesVersion, setup, moves: [{ seat, action, by? }] }` — the table module's `MoveRecord` + `rulesVersion` (`recordRun`, `addRunMove`) | Plain JSON: it fits a run save, a save code, a leaderboard upload. `by` (person / AI) is kept but never changes the game |
| **No import of the table module** | `replayRun` takes the game's rules through a tiny structural type (`setup` · `check` · `apply`); the table's `Rules` fits as it is (its test proves it, against the table's own `replay()`) | Modules are copied into games one by one (`src/saves`, `src/table`); a game may have saves without the table (Goops) |
| **Another rules version** | Refused before a single move — `REPLAY_WORDS.otherVersion`, never a throw | An old record replayed under new rules isn't an error, it's quietly a DIFFERENT game (a wrong Continue, a wrong score). The game bumps `RULES_VERSION` when its golden games stop matching |
| **Checked, not trusted** | `matches: { live, view }` — the live game's fingerprint saved beside the record; a replay that lands elsewhere → `different` | "The replay matches the live game exactly (checked)": a rule that read the clock or `Math.random` shows up as a polite refusal, not a changed board |
| **The AI's randomness** | Not recorded | Its moves are logged, not its thinking — a replay needs no AI (and no AI version) |
| **Daily seed** | `dailySeed(gameId, when)` = FNV-1a of `"<gameId>:<UTC day>"` + murmur's mix → 0…2³²−1 (a mulberry32 seed) | No server, no device, no clock but the date; the day turns at midnight UTC for everyone. The game fixes the rest of the table too (Glyphtender: 2 players vs the AI, the standard word rules, turn order from the same seed) |
| **Privacy** | A record holds the game only (setup, seed, moves) — no name, no device; it stays in the run save | research → Privacy: nothing personal, nothing sent (F98's board will say what it sends) |

- **Where it's checked:** check:framework — a game that calls `recordRun` must have a test that runs `replayRun` and `sameResult` (Glyphtender's: the live fingerprint after every move == the replay's).
- **Glyphtender's Continue** saves `{ record, print, turn, options, seats, stats }` (run version 2; version 1 runs keep their game and are put back as before); it waits for the word list (scoring needs it) before replaying; a word list that won't load keeps the run and says so.
- Proven on a scratch Glyphtender (README → Proof F94).

## Layer 5 — link-code cloud (F96, kit 0.3.0)
The save code, but short enough to type: the player's save code goes to **the game's own Cloudflare** and comes back as **`K7QM-2XRP`** — typed on the other device, the save comes in and is **merged by each field's rule** (best kept, counts added), through the very same `readSaveCode` path as a pasted code (same checks, nothing written unless every save is good).

| Decision | What | Why |
|---|---|---|
| **Storage** | ONE named **SQLite Durable Object** (`SaveCloud`, name `"saves"`) in a small worker of the game's own (`cloud/worker.ts`, its own `cloud/wrangler.json` → `<game>-saves.joebrogno.workers.dev`) | KV's free plan allows only ~1,000 writes a day; a SQLite Durable Object allows 100,000 rows written a day (below). One object = one table, no cross-object lookups. A separate worker so a game without rooms needs nothing else, and a rooms deploy never touches saves (and back) |
| **Code format** | 8 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no O/0, no I/1), shown `XXXX-XXXX`; typing is forgiving (spaces, dashes, lower case) | 32⁸ ≈ 1.1 trillion codes — with the guess limit, guessing someone's code is hopeless; no two characters that look alike |
| **How long** | **7 days** (Muzzy 2026-10-20), then the object's alarm deletes it — `content/saves.json` `cloud.keepDays` (1–30) | Long enough to walk to the other device, short enough that nothing piles up. A fetch never serves an expired code even if the alarm is late |
| **Fetching doesn't delete it** | The code works until it expires or "Delete my data" | The player may bring it to a THIRD device (phone, tablet, laptop), or retry when the other device's storage was full. What a stranger who saw the code gets is game progress, nothing personal; "Delete my data" ends it at once from either device |
| **Size cap** | The save code's own limit: 300,000 characters (`MAX_CODE_CHARS`); the object refuses new uploads past 900 MB stored (the free plan's object holds 1 GB) | A real save is a few KB; one row may be 2 MB at most |
| **Guess limit** | Per address: `cloud.wrongTriesPerHour` (default 10) wrong codes in an hour → every fetch / delete from that address is refused for the rest of the hour ("Too many tries…"); `cloud.uploadsPerHour` (default 20) new codes an hour | Stops guessing and stops one address filling the store. Counted by the HOUR it falls in |
| **The address** | Kept only as a scrambled number (SHA-256), only for the hour it counts in, then deleted | A player's IP is personal data (GDPR) — this is the least that still counts tries |
| **Privacy line** | On the Save code screen: "A link code puts a copy of your save (nothing else — no name, no account) on this game's own server (Cloudflare) for 7 days, then it deletes itself. Delete my data removes it now." | research → Privacy: what's stored, where, how long, how to delete |
| **Offline first** | No network / the server down / timed out (10 s) → one plain sentence, nothing changed on this device | The save on the device is the real one; the cloud is only a carrier |
| **Where the game finds it** | `cloudAddress(import.meta.env.VITE_SAVES_CLOUD)` — set at build for the live game; unset on localhost / the Wi-Fi = the PC's own `:1998`; unset anywhere else = no cloud, so the Link code part isn't shown | Like the rooms kit's VITE_PARTY_HOST |
| **The routes** | `kit/cloudRoutes.ts` — plain web Requests in, Responses out, the store passed in (Glyphtender's `wordsRoutes.ts` pattern): tested without Cloudflare. The worker only stores rows and sets alarms | |
| **Going live** | Muzzy's call (a public server): `npx wrangler deploy -c cloud/wrangler.json` | |

## Layer 7 — checked leaderboards: the Daily board (F98, kit 0.5.0)
A finished Daily game (layer 3) goes to **the game's own board worker** as its record; the server replays it with **the game's own rules** and keeps the score **it** computed, under 3 letters (arcade style — Muzzy). A public server address from the first brief → designed secure from the start (sprint 19 rule), on F96's pattern and its review fixes.

| Decision | What | Why |
|---|---|---|
| **The score** | Only what the server's replay computes (`BoardGame.score(state)` of the replayed end state). Any `score` in the body or the record is never read | The whole point: a sent score is a claim, a replay is a fact |
| **The game's rules** | `board/worker.ts` imports the game's own `rules(setup)`, `dailySetup(day)`, `score`, `RULES_VERSION` (Glyphtender: `src/engine/rules` + `src/game/record`, the word list bundled as text like `party/`) — never a copy | The server and the phone can't disagree; a rules change reaches the board with the next deploy |
| **Today's game only** | The record's setup must equal `dailySetup(day)` (compared by content, field order ignored) for today or yesterday (a game started just before midnight UTC) | Otherwise a player could pick a lucky seed |
| **Version** | `record.rulesVersion` must equal the server's → else `other-version`, before any replay | An old record under new rules would be a different game |
| **Size** | Body ≤ 100,000 characters (a game is ~8,000); moves ≤ `maxMoves` (Glyphtender 400; a game is ~70–100) — refused unread | A replay is CPU: never start one that can't be real |
| **Names** | Exactly 3 letters A–Z (typed loosely, kept in capitals), a short blocked list (`BLOCKED_NAMES`, a game may pass its own) | No free text on a public board — nothing to moderate |
| **Who a player is** | A random 128-bit id made once on the device (`<game>:board`), sent only to the board, stored only as a keyed hash | No accounts (research → Privacy). The id is also the **proof for "Remove my score"** — nobody else has it, so no separate removal token |
| **dailyTries** | Per game, `content/saves.json` `board.dailyTries`: 1 = the first finished game only · N = the best of the first N · 0 = unlimited; the installer ASKS (Muzzy 2026-10-20: "based on the game, like the 7 or 30 days"). Counted per player id per day; a game the replay refuses still used its try; removing a score never gives one back | Arcade-fair by default; the designer decides what fits the game |
| **Limits** | Per address (IPv6 by /64) `board.sendsPerDay` (30) sends a day — good or bad, counted BEFORE anything is checked; server-wide 3,000 sends a day (`SERVER_SENDS_PER_DAY`: ~20 rows written per game checked step by step; the free plan's SQLite allows 100,000 rows written a day); wrong "remove" tries 10 per address a day, 2,000 server-wide | A flood stops at the limit, forged or not |
| **Many at once** | Every `await` (body, hashes) happens first; the checks, the counts and the replay itself run with no waiting in between | A Durable Object can't interleave 30 requests between a check and its count (review F96) |
| **Addresses** | Only an HMAC-SHA-256 keyed hash with the worker's own random secret (made once, kept in its SQLite, never sent), for the day it counts in + yesterday | Personal data (GDPR); the secret stops anyone undoing the hash by trying every address |
| **Retention** | `board.keepDays` (7): the alarm deletes older days at midnight UTC; counts from before yesterday | Nothing piles up |
| **CPU** | Workers Free: **10 ms CPU per invocation — a request AND an alarm** (Cloudflare docs: Workers limits, updated 2026-10-12; Durable Objects limits, updated 2026-06-01). A whole Glyphtender replay measured **9–18 ms** in the local worker → **checked later**: a sent game waits ("Checking your game…"), the object's alarm replays `MOVES_PER_ALARM` (10) moves at a time and keeps the game between steps as JSON (steps measured 1–5 ms). Per-request replay stays available (`checkLater: false`) for a light game | One alarm per whole game would hit the same 10 ms. Moves, not a clock: on Cloudflare `performance.now()` doesn't move while code runs |
| **Privacy line** | On the board: what's kept (3 letters, score, the game's moves — no account, no other name), where (the game's own server, Cloudflare), how long (keepDays), "Remove my score" deletes it now | research → Privacy |
| **Going live** | Muzzy's call (public): `npm run board:deploy` + `VITE_SAVES_BOARD` at build | |

**What a cheater can still do** (the replay proves the game is LEGAL, not that a person played it alone):
- **Practise first.** The Daily game is the same for everyone all day and runs on the device, so a player can play it as often as they like (or replay it in a fresh browser) and send only the best run — with `dailyTries: 1` the server counts one *sent* game, not one *played* game. The fix is a start token from the server when the Daily game starts (the server then counts started games) — an Idea, not built.
- **Play both seats.** The AI's moves are in the record (marked `by: 'bot'`, which the server can't check); a cheater can write the AI's moves too, choosing ones that set up big words. The fix is a deterministic AI the server re-runs (the AI's moves are then recomputed, not read) — the AI module would have to promise it.
- **Use a solver.** A bot that finds the best legal moves produces a legal record — any leaderboard without a watched game has this.
- **Many player ids.** A cleared browser is a new player: more tries and more names on the board, up to `sendsPerDay` per address (30) and more with many addresses (until the 3,000 a day server cap).
- **Fill the day** with legal low scores from many addresses up to the server cap ("busy" for everyone until midnight UTC) — a nuisance, not a wrong score.
- **Guessing** a player id (128 bits) or a removal is hopeless and limited; names and days hide nothing (the board is public).

## Decisions
- **The record:** `{ save: <key>, version, savedAt, data, counts? }` — `save` marks it as ours and which save it is (a record pasted under the wrong key is refused). Kept as JSON text in localStorage (5 MiB is plenty for layer 0; IndexedDB later only if a game needs more).
- **Backups beside the save, not inside it** (`<key>~1`, `<key>~2`): each copy is a whole record on its own, so any one can be broken without the others.
- **The device id lives beside the save, never in it** (`<key>~device`) — a save code carried to another device doesn't bring it.
- **The UI kit's Settings keeps its own saving** (its `fitsRow` fallback handles drift; a kit → saves dependency would tie two modules). Room codes + player ids stay with the rooms module until F95 (online rejoin).
- **The Save code screen is the module's one link to another module, and it's optional:** `kit/ui/` is installed only into games with the UI kit; it imports `'../../ui/kit'` (the game's copy). In the framework, `saves/ui/kit/index.ts` passes that path on to `../ui-kit/kit` so it typechecks, and `tsconfig.json` points `react` at the UI kit's copy (one React).
- **A storage only needs getItem + setItem** (removeItem optional: a removed copy is written as "") — Glyphtender's existing test helper has no removeItem, and its tests had to run unchanged.
- **The panel's words in their own file** (`ui/panelWords.ts`): Goops lints its kit copies with react-refresh's only-export-components rule (the framework's lint has it off).
- **check:framework runs the game's save test** (`npx vitest run tests/saves/saves.test.ts`) even with `--static`: it's not a browser check, and "golden saves from every release tested by check:framework" is the promise.
- **Where `createSave`'s key and version are read from:** plain values in the call, or a `const` in the same file — a check that can't read them says so with the fix.

## Proven (2026-10-19, scratch copies)
Goops progress, Glyphtender New Game choices (the 2-letter marker → version 2 + upgrade step; its unchanged test passes), the save code round trip in Playwright's Chromium on Glyphtender's real Settings → Save code screen, inside a cross-site frame too. Details + each game's switch-over steps: `../../saves/README.md`.
Playwright switches Chrome's storage partitioning off by default (`--disable-features=…ThirdPartyStoragePartitioning…`); the frame-vs-own-site check runs a browser with it back on.

## Later (F95–F99)
Online rejoin with the rooms kit (4) · Capacitor / Electron / Steam backends behind the same API (6) · accounts + checked leaderboards (7) · the Unity port of the same format (8).
