# Saves — research map (2026-10-19, for F86)

Why this exists: the first Saves plan only covered what Goops, Glyphtender and Roll Better already did. Muzzy: "i'm sure you researched indie game development standards… online saves, local saves, seed saves, etc?" — so this is the field's map first, then the design. (Helper research, web sources cited; itch.io points are forum reports, not official docs — test on a real itch page.)

## The short version
On today's web games, saves are mostly lost to the **browser**, not to bugs: Safari's 7-day deletion, the itch.io frame, private windows, "clear site data". A version stamp + step-by-step upgrades protects against our own updates. A **save code / export** is the cheapest safety net for everything else. Cloud can wait.

## What gets saved
| Kind | Example | Best practice |
|---|---|---|
| Settings | volume, reduce motion | Separate from progress, small, read before the first frame. Losing them is annoying, not tragic. |
| Meta-progress | Goops XP, upgrades, stats, achievements | The precious one: always backed up and upgraded; merge by "keep the highest". |
| Run in progress | a half-played Glyphtender match vs the AI | Autosave at natural break points (end of turn / wave); delete when the run ends. |
| Slots / profiles | 3 save slots, "Player 2" | Each slot one self-contained record + a small list of slots. |
| Autosave / manual / checkpoint | | Web games: autosave by default; manual saves mainly for long story games. |
| Seed + action log | daily puzzle, replays | Seed + list of moves, replayed to rebuild the game — tiny, and the same data gives replays, daily challenges, cheat checks. Needs rules with no hidden randomness (no Math.random / timing in the rules). |
| New-game choices, tutorial flags | difficulty, "seen the tip" | Small flags kept with meta-progress. |

## Versioning
- Every save carries `version: N`; upgrades go one step at a time (3→4→5), never jump.
- After loading, fill missing fields with today's defaults — never overwrite what the player chose. (A changed default that SHOULD reach old saves = an upgrade step — Glyphtender's 2-letter fix.)
- A save from a newer build (after a rollback): don't overwrite it — keep it, tell the player.
- Golden saves: each release commits a real save to tests; every later build must load all of them.

## Browser facts (durability)
- localStorage ≈ 5 MiB per site, throws when full; IndexedDB much larger. Both "best-effort" (may be deleted) unless `navigator.storage.persist()` is granted (Chrome/Safari decide by engagement; Firefox asks). [MDN, 2026-01-05](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- **Safari 7-day rule:** with tracking prevention on (default), script-written storage is deleted after 7 days of Safari use without a tap on that site. A Home Screen web app counts its own days. persist() is granted partly for Home Screen apps; no official source says it beats the 7-day rule — treat as not guaranteed. [WebKit 2023-08-10](https://webkit.org/blog/14403/updates-to-storage-policy/), [Safari 13.1 2020](https://mjtsai.com/blog/2020/03/26/safari-13-1-third-party-cookie-blocking-and-7-day-script-writeable-storage/)
- **itch.io** runs HTML games in a frame on html(-classic).itch.zone → third-party, partitioned storage (Chrome 115+ [docs](https://developer.chrome.com/docs/privacy-sandbox/storage-partitioning)): the itch save and the GitHub Pages save are different saves; itch games may share one storage space ([forum 2021](https://itch.io/t/1158456/html5-local-storage-seems-to-be-shared-between-multiple-games)) → game-prefixed keys; some report saves lost on a new upload ([forum 2022](https://itch.io/t/2346400/html5-local-storage-is-lost-at-every-update)); Safari/Brave can block frame storage ([forum](https://itch.io/t/2636350/localstorage-doesnt-work-for-html5-games-on-ipad-by-default)). No official itch docs, no itch cloud saves.
- Private windows wipe on close; "clear site data" wipes everything.
- Corruption: write one whole record, check it parses before replacing, keep the last 2–3 copies, fall back to the newest good one.

## Online / cloud
- Options: Steam Cloud (Steam builds, [docs](https://partner.steamgames.com/doc/features/cloud)) · Supabase/Firebase (accounts) · **our own Cloudflare (KV/D1) under a code — no new vendor** · PlayFab/UGS (Unity, later).
- Account-less sync: a short link code that copies the save to another device.
- Conflicts: settings → newest wins · progress → per-field "keep the highest" (most XP, all unlocks) · a run → ask, or newest.
- Online matches: the server (Durable Object) holds the real game; the browser keeps only room id + seat token to rejoin. Leaderboards replay seed + moves on the server, never trust a sent score.

## Other platforms
- Export/import: a compressed copy-paste code + a file — same format everywhere.
- Capacitor: Preferences plugin (the phone may clear an app's localStorage — [docs](https://capacitorjs.com/docs/apis/preferences)). Electron: files in `userData`, Steam Auto-Cloud on that folder. Unity: `persistentDataPath` files, not PlayerPrefs — one shared format makes it a small job later.

## Privacy
Player names, account/device ids, chat, IPs = personal data (GDPR). Device-only progress is low risk. Anything sent to a server needs a privacy note, "delete my data", a retention period. COPPA's updated rule applies since 2026-04-22 ([Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)) — no ids from kids' games without parental consent.

## Testing
Golden saves from every release + round trip (save → load → same) · damaged saves (cut off, wrong types, empty) fall back to a backup, never crash or wipe · full storage: the game still runs.

## Layers (the module's design)
| # | Layer | Purpose | Size | Needs |
|---|---|---|---|---|
| 0 | Store + schema (core) | Named records (settings / progress / run / slots), game-prefixed keys, version stamp, step upgrades, defaults fill-in, rolling backups, safe write, newer-build saves kept, full-storage handled | Medium | — |
| 0 | Test kit | Golden saves folder, round-trip + damaged-save tests ready to use | Small | 0 |
| 1 | Save code + storage health | Export/import code + file; warns about private windows, itch frame storage, refused persist(); nudges a backup after big progress | Small | 0 |
| 2 | Run resume | Autosave at break points, "Continue?" on launch | Small | 0 |
| 3 | Seed + action log | Resume by replay, replays, daily challenges | Medium | 0, repeatable rules |
| 4 | Online rejoin | Room id + seat token, rejoin flow (with the rooms kit) | Small | 0, rooms |
| 5 | Link-code cloud | Cloudflare KV/D1, keep-the-highest merge, offline first | Medium | 0, 1 |
| 6 | Platform backends | Capacitor / Electron files / Steam Cloud behind the same API | Medium | 0 |
| 7 | Accounts + checked leaderboards | Server replays the moves to check scores | Large | 3, 5 |
| 8 | Unity port | Same format in C# | Medium | 0 frozen |

## What actually loses progress today → the fix
1. Safari's 7-day deletion → persist(), "Add to Home Screen" nudge, save code (layer 1), then link-code cloud (layer 5).
2. itch.io frame storage → game-prefixed keys, treat itch vs Pages as separate saves, test in Safari/Brave frames, a visible export button, "open in new tab".
3. An update breaks old saves → version + step upgrades + golden saves (layer 0).
4. Half-written save / full storage → safe writes, rolling backups, quota errors caught (layer 0).
5. Private window / clear site data → detect + warn + export; nothing else survives it.
