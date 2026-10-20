# Sprint 19 — the game survives on the server
Started 2026-10-20 · Milestone v0.10 · Features: F100, F96
Researched first (code map 2026-10-20 + `.planning/research/saves.md` layer 5): a room keeps everything in memory (a restart or Cloudflare's 1–2 min clean-up loses the match); a save code is the whole save (KBs — fine to paste, not to type). Both use a SQLite Durable Object (Glyphtender's Words list already does) — no KV (≈1,000 writes/day). Nothing is deployed: built and proven locally; going live stays Muzzy's call. Queue after: 20 F94 + F98 · 21 F97 + F99. Work in the framework (rooms, saves) on `dev/v0-10`; games only as scratch copies.

## F100 🧱 Rooms: a match waits until it ends
Done when: a room's seats, phase, game state, bot-turn counts and timer end times are kept in the Durable Object's storage, so a player can rejoin hours or days later and a server restart mid-match loses nothing; timers come back (an alarm wakes the room); the stored match is wiped at game over / room cleared / back to lobby, and after `keepMatchDays` with no move — a number each game sets in content/rooms.json (7 live · 30 async, any value), and the installer asks the designer to pick it.
- [ ] 🤖 1. Pack and unpack a room: seats, phase, game state, bot-turn counts, timer end times (live sockets never) — rooms/kit/server/roomServer.ts
- [ ] 🤖 2. Timers survive a restart: end times saved, one Durable Object alarm for the earliest, timers rebuilt by name — rooms/kit/server/timers.ts
- [ ] 🤖 3. Optional game rules hooks: `onRestore` (the game restarts its own clocks) + a JSON round-trip check for State — rooms/kit/server/gameRules.ts
- [ ] 🤖 4. Worker template: load on start, save after each change (not every message — free-plan writes), wipe at game over / clear / lobby, alarm — rooms/templates/party/worker.ts
- [ ] 🤖 5. `keepMatchDays` in content/rooms.json (default 7; the template's _help says "live 7 · async 30 · any number") replacing the 5-minute empty-room wait for a match in play; tests — rooms/kit/server/settings.ts, rooms/templates/content/rooms.json
- [ ] 🤖 6. Installer: a wiring step that asks the designer to choose keepMatchDays for the game's style (Muzzy 2026-10-20), and the steps for an older worker; multiplayer-setup skill + /define note it as a game decision — rooms/scripts/install-rooms.mjs, ~/.claude/skills/multiplayer-setup/SKILL.md
- [ ] 🤖 7. Proven on a scratch Glyphtender: an online match, the local server stopped and started mid-match → both players rejoin, same seats, the turn clock still right; a match past keepMatchDays → "That match has ended" — rooms/README.md
Check: scratch Glyphtender with its local wrangler (own port + --persist-to): mid-match, stop the server, start it again → both browsers Rejoin into the same seats and turn, the clock continues from the right time; finish the match → stored room gone; set keepMatchDays tiny → "That match has ended"; rooms tests incl. a pack → unpack round trip.
Ask Muzzy: —

## F96 🧱 Saves: cloud via link code
Done when: Save code gets a "Link code" — the save goes to the game's own Cloudflare (a SQLite Durable Object) under an 8-character code (no O/0, I/1), works for 7 days then deletes itself (a setting), is guess-limited per address and size-capped; on the other device the code brings the save in and merges it by each field's rule (best kept, counts added); "Delete my data" removes it now; a privacy line says what's stored and for how long.
- [ ] 🤖 8. Decisions on record: storage, code format, 7-day expiry (Muzzy 2026-10-20), size cap, guess limit, privacy wording — .planning/design/saves.md
- [ ] 🤖 9. The cloud routes (upload → code · fetch · delete), tested without Cloudflare — saves/kit/cloudRoutes.ts
- [ ] 🤖 10. Worker template: a SQLite Durable Object, alarm expiry, size cap, guess limit — saves/templates/cloud/worker.ts
- [ ] 🤖 11. The game side: upload, fetch → the existing readSaveCode merge, delete; offline first (no network = a plain message, nothing lost) — saves/kit/cloud.ts
- [ ] 🤖 12. "Link code" on the Save code screen + privacy line + "Delete my data" — saves/kit/ui/SaveCodePanel.tsx
- [ ] 🤖 13. Installer: the cloud worker's wrangler settings + "going live is Muzzy's call" step; proven on a scratch Goops (progress save) with a local wrangler: two browser profiles, code made in one, typed in the other → merged progress — saves/scripts/install-saves.mjs
Check: scratch Goops + local cloud worker: profile A makes a link code, profile B types it → B's progress merged (best kept, counts added); after "Delete my data" the code fails plainly; an expired code (expiry set tiny) fails plainly; 20 wrong codes from one address → slowed/refused; no network → plain message, nothing lost; screenshots of the Save code screen with Link code at phone + desktop sizes.
Ask Muzzy: —

Notes:
- Muzzy 2026-10-20: link codes last 7 days. How long a match is kept depends on the game ("async Scrabble-with-friends → 30, a live game I forget during chores → 7") → a per-game setting `keepMatchDays` (any number), asked at install time and changeable later.
- Plan-lint: only the old F61 / F59 / F60 line (Goops' session). No open P0/P1 bugs.
