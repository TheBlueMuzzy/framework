# Sprint 21 — Saves that can move to any platform later
Started 2026-10-20 · Milestone v0.10 · Features: F101
Researched first (2026-10-20 — field research + code map, written into `.planning/research/saves.md` "Layers 6 + 8 — researched"). Re-scoped the same day (Muzzy: "I need to let this be your call… which way is going to result in a better product and process?"): Claude's call — build now only the seams every future game is built around (one storage switch, a start-up load that works with slow storages, the save format written down for any language); the phone / desktop / Steam backends (F97) and the C# code (F99) wait for the store run-through and the first Unity game (💤 in ROADMAP), because they hang on versions that will change (Capacitor 8→9, Electron, Steam's rules) and can't be proven without store accounts or a Unity game. Nothing deployed; going live stays Muzzy's call.

## F101 🧱 Saves: ready for any platform
Done when: the whole saves kit takes its storage from one switch, a game can open its saves from a slow (async) storage at start-up and then read instantly, writes reach that storage in the background and are forced out on hide / quit, a failing storage is reported like a full one — proven with a stand-in slow storage, with game code unchanged; the save format is written down so a C# (or any) version can be checked against the same golden saves; the costs are measured.
- [ ] 🤖 1. Measure first (sprint 20 retro): in a scratch Glyphtender, start-up load ms for every key and writes + bytes per minute of play, through a stand-in slow storage — saves/kit/storage.ts
- [ ] 🤖 2. One storage switch: `setSavesStorage(storage)` used by every call that now falls back to browserStorage() (saves, slots, run, cloud, board, nudge, health, device id) — saves/kit/storage.ts
- [ ] 🤖 3. The start-up layer: `openSaves(backend)` awaits `loadAll()` into memory, then sync reads + background writes (debounced), `flushSaves()` on visibilitychange / pagehide, a failing backend reported like a full storage; a localStorage backend + a slow stand-in for tests — saves/kit/platform.ts
- [ ] 🤖 4. The save format written down for any language: the envelope, version stamp, keys and `~` copies, upgrade rule, "a newer save is never overwritten", the golden-save file shape — saves/FORMAT.md
- [ ] 🤖 5. Tests: game code unchanged on the slow stand-in, reads instant after open, writes land after flush, a write cut off mid-way leaves the last good copy, no kit file but storage.ts touches localStorage — saves/kit/platform.test.ts
- [ ] 🤖 6. README "Phone, desktop and Unity later" (what's ready, what the store run-through adds, the research link) + MODULE-CONTRACTS line (a game opens its saves before the first read) — saves/README.md
Check: saves tests + tsc + lint green; scratch Glyphtender plays the same with its saves opened through the slow stand-in (Continue still works after a reload); measured load ms + writes per minute on record; FORMAT.md checked against the golden saves (every field named exists in them).
Ask Muzzy: —

Notes:
- Muzzy 2026-10-20: no Steamworks account — "for now… it's just git pages" → store run-through in ROADMAP Ideas.
- Muzzy 2026-10-20 asked Claude to decide build-now vs later. Call: seams now (cheap, and every game built from here on starts the right way), platform backends later (they'd be built against stand-ins and age before any store build uses them). F97 / F99 → 💤, picked up by the store run-through / the first Unity game; the research stays in saves.md so it isn't redone.
- Plan-lint: only the old F61 / F59 / F60 line (Goops' session). No open P0/P1 bugs.
