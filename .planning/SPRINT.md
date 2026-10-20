# Sprint 18 — players get back where they were
Started 2026-10-20 · Milestone v0.10 · Features: F93, F95
Researched first (code map 2026-10-20 + `.planning/research/saves.md` layers 2 and 4): the saves module already has a `run` kind but no autosave, peek or Continue; the rooms kit already gives a returning player id their own seat (even from a bot) — what's missing is remembering WHICH room after the tab closes, and a Rejoin offer. Queue after: 19 F96 + F94 (+ F100) · 20 F97 + F98 + F99. Work in the framework (saves, rooms, ui-kit) on `dev/v0-10`; games only as scratch copies.

## F93 🧱 Saves: run resume
Done when: a game can autosave its run at break points (and when the tab hides / closes), ask "is there a run, from when?" without loading it, show the kit's Continue button only when there is one (with a short summary), and clear it when the run ends so it never comes back — a newer-build or damaged run says "can't be continued" instead of crashing.
- [ ] 🤖 1. Peek without loading: `has()` / `savedAt()` (or `peek()`) on a save, tests — saves/kit/saves.ts
- [ ] 🤖 2. `createRun()`: autosave(data) at break points + flush on visibilitychange / pagehide, `end()` clears every copy, `pending()` → `{ savedAt, summary } | null` — saves/kit/run.ts
- [ ] 🤖 3. A run from a newer build or a damaged one → "This game can't be continued" + cleared, never a crash — saves/kit/run.ts
- [ ] 🤖 4. Continue on the main menu: MainMenu's existing `onContinue` shown only with a pending run, a summary line under it ("Turn 7 · 5 min ago"), words in the kit's word lists — saves/kit/ui/, ui-kit/kit/blocks/frontend.tsx
- [ ] 🤖 5. Golden saves for runs + "a run cleared at the end never comes back" in the framework check; proven end to end on a scratch Glyphtender vs the AI — saves/kit/oldSaves.ts, saves/kit/conformance.mjs
- [ ] 🤖 6. README + design layer 2 + kit version — saves/README.md, .planning/design/saves.md
Check: a scratch Glyphtender game vs the AI, closed mid-game → reopened shows Continue with the turn + time, Continue lands on the same turn; finishing the game → Continue is gone after a reload; a run saved by a "newer build" → can't-continue message, no crash; screenshots of the menu with and without Continue at phone + desktop sizes.
Ask Muzzy: —

## F95 🧱 Saves: online rejoin
Done when: a player who closed the tab mid-match sees "Rejoin match" on the main menu, gets back into the same seat (from a bot if one took over), and a room that's gone says "That match has ended" — never a join error and never a new room by accident; the room code is forgotten on leave / kick / game over / closed room; an empty room waits 5 minutes (a setting) instead of 60 s.
- [x] 🤖 7. Remember the last room on this device: `{ code, savedAt, phase }`, an age limit, forgotten on leave / kick / game over / closed room — rooms/kit/lastRoom.ts
- [x] 🤖 8. The rejoin path: `useRoom(code, { create: false })` for a rejoin, `no_room` → "That match has ended" — rooms/kit/useRoom.ts
- [x] 🤖 9. "Rejoin match" on the main menu + the kit's Reconnecting screen while joining; back in → "You're back — a bot played N turns for you" (or the results if it ended) — rooms/kit/, ui-kit/kit/blocks/online.tsx
- [x] 🤖 10. How long an empty mid-game room waits becomes `keepEmptyRoomMs` in content/rooms.json, default 5 min (Muzzy 2026-10-20) — rooms/kit/server/settings.ts, rooms/templates/content/rooms.json
- [x] 🤖 11. Tests + conformance; Glyphtender's scratch copy moved from its sessionStorage room to the kit helper — rooms/kit/useRoom.test.tsx, rooms/kit/conformance.mjs
- [x] 🤖 12. Privacy line: the room code + player id stay on this device and only go to the game's own server — saves/README.md, rooms/README.md
Check: two browsers in a scratch Glyphtender online match, one closes its tab, reopens within 5 min → "Rejoin match" → same seat, the bot's turns named; reopening after the room is gone → "That match has ended", no new room made; leaving on purpose → no Rejoin button; screenshots of the menu with Rejoin + the back-in message.
Ask Muzzy: —

Notes:
- Plan-lint: only the old F61 / F59 / F60 line (Goops' session). No open P0/P1 bugs.
- Muzzy 2026-10-20: a match should wait for a player "until the match ends" → that needs the room kept on the server (Durable Object storage), so it's its own feature, F100 (queued with sprint 19); this sprint makes the wait a setting, 5 min.
- Continue + Rejoin go on the main menu (the kit's MainMenu already has a Continue slot), not a pop-up — the common pattern; Muzzy can ask for a pop-up.
- F95 built (rooms kit 0.9.0): task 12's privacy line is in rooms/README only — saves/README's line is added on the F93 side (that helper owns saves/). MainMenu needed no change: Rejoin is an `items` entry (words: the UI kit's `rejoinWords` / `welcomeBackLine`, online.tsx; CATALOG row). UI kit VERSION not bumped here (F93 bumps it too — bump once when merging).
- F95 surprises: (1) "a bot played N turns" needed the SERVER to count — new `back { botTurns }` message; a turn = each time the game puts that seat on the clock while a bot holds it for its player (incl. a takeover mid-turn); turns the player watched (idle → tap) aren't counted. (2) A rejoin to a cleared code could land in a STRANGER's new lobby with that code — the join now carries `rejoin: true` and the server answers `no_room` unless it's the player's own seat (never creates either). (3) Glyphtender's sessionStorage room code did a job besides rejoin — a reload went straight back in — so the kit keeps a per-tab copy too (`roomBeforeReload()`, `rooms:tab-room`); the new promise check forbids the game's own copy. (4) `OnlineRoom` has 3 new fields (`matchEnded`, `cameBack`, `clearCameBack`): a game's hand-made fake room (Glyphtender's Dev Kit previews.tsx) must add them or tsc fails. (5) Live, Cloudflare evicts an EMPTY in-memory room after ~1–2 min, so the 5-minute wait only holds locally until F100 — Rejoin then honestly says "That match has ended".
- F95 proven on a scratch Glyphtender (.scratch/glyphtender-f95, e2e/f95-rejoin.mjs, own wrangler 2999 + vite 5392, short timings in its rooms.json): reload → same seat; closed tab → Rejoin match → Rejoining… → same seat, "You're back — a bot played 4 turns for you" (server botTurns 4); Leave → no Rejoin after reload; room cleared → "That match has ended", and a plain join to the code afterwards → no_room (nothing made). Its 817 tests + rooms promise check pass. Shots: .scratch/glyphtender-f95/shots/f95-*.png.
