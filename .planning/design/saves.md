# The Saves module — design (framework v0.10, F86 = layers 0 + 1, F93 = layer 2)

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

## Later (F94–F99)
Seed + action log (3) · online rejoin with the rooms kit (4) · link-code cloud on our own Cloudflare with the field merge (5) · Capacitor / Electron / Steam backends behind the same API (6) · accounts + checked leaderboards (7) · the Unity port of the same format (8).
