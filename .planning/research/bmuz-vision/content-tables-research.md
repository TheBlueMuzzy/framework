# Content tables: Google Sheets vs JSON in git (research, 2026-11-11)

Short research pass; sources are cited inline. Several of the sources are vendor pages, so their claims are labelled as vendor claims.

## 1. How studios handle spreadsheet-made game data
- **One-way Sheet → JSON export is the common setup.**
  - Joystick exports sheets as JSON, mapped through a schema config ("Data Transform Definition"): https://docs.getjoystick.com/integration-google-sheets
  - Beamable's Game Content Designer exports JSON from Sheets for the game to load: https://www.beamable.com/game-content-designer
  - handcircus gdoc_tuning_exporter (tuning values out of a Google Doc): https://github.com/handcircus/gdoc_tuning_exporter
  - Heroic Labs Hiro exporter: https://heroiclabs.com/docs/hiro/guides/hiro-exporter/
- **Two-way sync exists but is rare, and its makers don't say how it handles both sides changing.**
  - Unreal "Google DataTable Sync" (export from Unreal, edit in the cloud, import back) is a vendor claim that never says how it resolves both sides changing: https://sovahero.github.io/Unreal-GoogleDataTableSync
  - A developer keeping a Sheet and a CMS in sync both ways called it a choice that will "generate a lot of complexity": https://community.datocms.com/t/exporting-google-sheets-database-to-dato-issues/3510
- **The repo as the only source, with its own table editor.**
  - CastleDB looks like a spreadsheet, but each sheet has a data model that checks input.
  - It saves JSON with newlines, so git can show and merge changes: https://dbdb.io/db/castledb/revisions/6 · https://gamefromscratch.com/?p=6895
  - Dolt, a database with git-style versioning, is used for game config at Scorewarrior: https://dolthub.com/blog/2024-05-20-dolt-scorewarrior
- **Hutch Games post-mortem: Sheets → JSON → SVN.** https://www.hutch.io/blog/tech/tech-blog-game-changer/
  - Check-ins were optional, so SVN drifted.
  - People edited the local JSON instead of the Sheet, which split the data into versions.
  - The Sheet → JSON conversion broke easily, and checks were scattered, so mistakes showed up late.
  - Their fix: the Sheet became the one source, with a direct import, all checks run at import, and a saved copy of every import (by hash) for rollback.
  - Lesson: say plainly which side is the source, and check the data at the moment it crosses over.
- **What goes wrong with two-way sync** (drawn from the sources above plus what the Sheets API returns; inference, not a single source):
  - Both sides edited → a conflict, with nothing in place to merge it.
  - Types blur: the Sheet holds text, numbers and dates, while the JSON holds arrays, nested objects and booleans.
  - Formulas and formatting are lost when JSON is pushed back over the cells.
  - Comments and notes in the Sheet have no place in the JSON.
  - Renaming a column silently breaks the field it maps to.

## 2. Google Sheets API: reading and writing reliably
- Quotas: https://developers.google.com/workspace/sheets/api/limits
  - 300 reads and 300 writes per minute per project.
  - 60 reads and 60 writes per minute per user per project.
  - A batch counts as one request.
  - There is no hard limit on request size; about 2 MB per request is recommended.
  - Going over returns HTTP 429. The fix is to wait and retry, waiting longer each time (exponential backoff with jitter), up to 32–64 s with a cap on tries. Quotas refill every minute.
- For a sync script, use `spreadsheets.values.batchGet` / `batchUpdate`, so each table is one call and the quota is not a concern.
- Reading formulas or values, and writing as raw values or as if typed by a user, are choices made per request (`valueRenderOption`, `valueInputOption`):
  - https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/batchGet
  - https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption
  - These two pages were not re-read in this pass.
- The `gws` CLI already on the machine wraps these calls.

## Recommendation
- **JSON in git is the source; a Sheet is an optional linked mirror, one per table.**
  - The link records the sheet id, tab, header row, and a hash of each side at the last sync.
- **Pull (Sheet → JSON)** when the creative says "I edited the Sheet":
  - read the values with `batchGet`;
  - check them against the table's schema;
  - show the change as a plain diff;
  - commit it with a message naming the Sheet.
- **Push (JSON → Sheet)** after Dev Kit tuning:
  - write only the value cells as raw values;
  - never touch formula columns, notes columns, or columns the schema doesn't know.
- **Refuse when both sides changed since the last sync.**
  - Show both diffs and let the creative pick which side wins, row by row or the whole table.
  - Never merge without asking.
- Every pull is a git commit, so rollback is `git revert`. That is Hutch's hash store, for free.

**Weighed:**
- **Why it's this way now:** the game reads `content/` JSON, and the Dev Kit and planner edit and show it. Git is already the history and the save between machines.
- **Long term:** one source keeps the Dev Kit, tests and releases simple. The Sheet can be dropped from a game with no change to the code.
- **Standards, big and indie:**
  - Most tools are one-way (Joystick, Beamable, Hiro).
  - Hutch moved the source to the Sheet, but they have a live server and many designers. A one-person web game in git matches the CastleDB/Dolt "repo is the source" side better.
- **The creative's goals:**
  - He keeps working in Sheets, the tool he knows, for games that started there.
  - Dev Kit tuning shows up back in his Sheet.
  - Nothing he typed is ever silently overwritten.
- **The case against:**
  - Push makes it two-way in practice, so it carries the both-sides-changed risk. The refusal manages it but adds a step.
  - Hutch's lesson is "shorten the pipe". An explicit pull is a manual step he can forget, and the game won't show his Sheet edits until he pulls.
  - Simpler option: pull only (the Sheet is the source for that game, and the Dev Kit is read-only for its tables). Better if he mostly tunes in the Sheet.
