# The save format — for any language

What the saves kit writes, written down so another version (C# for Unity — ROADMAP F99 — or a phone / desktop
backend — F97) reads and writes exactly the same saves, and can be checked against the same golden saves.
The TypeScript kit (`kit/saves.ts`, `kit/fill.ts`, `kit/progress.ts`) is the reference: where this page and the
code disagree, the code wins and this page gets fixed. Format version of this page: **1** (saves kit 0.6.0).

## 1. Keys
A storage is a list of **keys → text**. Every value is JSON text.

| Key | What's in it |
|---|---|
| `<key>` | the newest copy of a save (a record, §2) |
| `<key>~1` … `<key>~5` | older copies, newest first (backups — 2 by default, 0–5 in `content/saves.json`) |
| `<key>~damaged` | a newest copy that couldn't be read, set aside for a look later (never loaded) |
| `<key>~device` | this device's random id for that save (plain text, not JSON; never inside the record) |
| `<key>/list` | slot saves only: the list of slots (itself a record whose data is `{ "slots": { "<id>": "<savedAt>" } }`) |
| `<key>/<id>` | slot saves only: one slot (a record; its `save` field is `<key>`, not `<key>/<id>`) |
| `__saves-copied__` | on a phone / desktop storage: `"1"` once the browser saves were copied over (platform.ts) |

- `<key>` starts with the game's name and a separator (`glyphtender:run`, `goops-progress`) and has no `~`.
- Other keys the kit keeps (each is an ordinary save of kind `settings`): `<game>:backup-nudge`, `<game>:link-code`,
  `<game>:board`.
- Planned for desktop files (F97): a key and all its `~` copies in ONE file named after the key, so a game has a
  handful of files (Steam Cloud counts files).

## 2. A record (one copy)
```json
{ "save": "glyphtender:run", "version": 2, "savedAt": "2026-10-20T12:28:15.409Z", "data": { … }, "counts": { … } }
```
| Field | Rule |
|---|---|
| `save` | the save's key (for a slot: the slots key). A record whose `save` is another key is **damaged**. |
| `version` | a whole number from 1 up — the shape of `data`. Anything else is **damaged**. |
| `savedAt` | when it was written, ISO 8601 UTC with milliseconds (`toISOString()`). `""` = unknown (a save from before the kit). |
| `data` | the game's save — plain JSON only (objects, lists, text, numbers, true/false, null). |
| `counts` | optional, progress saves only: each device's part of every add-up field, `{ "<field>": { "<device id>": 12, "earlier": 3 } }`. |

Unknown extra fields are kept as they are, never an error.

## 3. Loading — the newest GOOD copy wins
Try `<key>`, then `<key>~1`, `<key>~2`… For each copy, in this order:
1. **Empty** (missing, or only spaces) → try the next.
2. **Not JSON** (a write cut off) → damaged, try the next.
3. **Not a record** (no `save` / `version` / `data`) → the game's `oldSave` rule may recognise a save from before
   the kit (`{ version, data }`); otherwise damaged.
4. **`version` greater than today's** → a **newer build's** save: stop. The game runs on fresh values and **never
   writes over it** (a player who went back to an older version keeps their newer progress).
5. **Upgrade one step at a time**: version N-1 → N with the game's step `upgrades[N]`, for every N up to today's.
   A missing step, or a step that fails → damaged. Steps work on a copy (the stored text is never changed by loading).
6. **Fill in what's missing** (`fill.ts`), compared with the game's `fresh` save:
   - a field missing (or undefined) → today's default
   - a value of the wrong kind (text where a number belongs) → today's default
   - a list is the player's as a whole (never merged with the default list)
   - `null` in `fresh` = "any value is fine"
   - fields `fresh` doesn't have are kept
   - `data` itself the wrong kind (a list, a number) → damaged
7. The game's own `clean` step (a value out of range → the default) — failing → damaged.

The first copy that passes all of that is loaded. A damaged NEWEST copy is set aside at `<key>~damaged`. Nothing good
at all → the game's `fresh` save.

## 4. Saving
1. The copy being replaced moves down: `<key>~N-1` → `<key>~N` … `<key>` → `<key>~1` (only if it was there).
2. Backups past the configured count are removed.
3. Write the new record to `<key>`, then read it back: if it doesn't match, put the old copy back (report "not kept").
4. **Full storage** → remove the oldest backups (never the newest good copy) and try again; still full → report "full".
5. A newer build's save at `<key>` → don't write at all (report "newer").

## 5. Progress fields — how two copies combine (`progress.ts`)
Settings, runs and slots: the copy with the later `savedAt` wins whole. Progress: top-level fields of a progress save, by the game's `fields` rules: `highest` (the bigger number), `add-up` (each
device's part adds up — using `counts`, so the same copy met twice never counts twice; `earlier` = the part from
before counting per device), `collect` (both lists, nothing twice, compared as JSON), `newest` (the copy with the
later `savedAt` — the default).

## 6. Runs kept as seed + moves (`replay.ts`)
A run can be kept as `{ "rulesVersion": 3, "setup": { … the seed and table … }, "moves": [ … ] }` inside its data and
rebuilt by replaying the moves with the game's rules. A record from another `rulesVersion` is refused, not upgraded.

## 7. Golden saves — the shared test files
One file per real save from each version, in the game's `tests/saves/`: `<key with odd characters as _>-v<N>.json`
(`glyphtender:run`, 2 → `glyphtender_run-v2.json`; several per version: `…-v1-<note>.json`).
```json
{ "about": "what it is and where it came from",
  "stored": { "save": "glyphtender:run", "version": 1, "savedAt": "…", "data": { … } },
  "expect": { "game": null } }
```
- `stored` = the value that was under `<key>`, parsed (the test writes `JSON.stringify(stored)` back under `<key>`).
- `expect` (optional) = top-level fields the loaded save must have, with these values.
Another language's version passes when every golden save loads with the same result as the TypeScript kit:
the same `data` after upgrade + fill, the same "newer" / "damaged" calls.
