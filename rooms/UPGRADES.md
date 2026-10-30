# Rooms — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.13.0: add `roomsPort()` (from src/rooms/vitePlugin.mjs) to vite.config's plugins, so the page reads the room port from wrangler.json's `dev.port` (the installer adds dev.port; no plugin = port 1999 as before).
- 0.12.0: `OnlineRoom` gained `sendEmote` (and `onEmote`) — a game that builds a fake room (Dev Kit previews, tests) adds it, or tsc fails.
- 0.10.0: keep a match through a server restart: copy the storage parts of the template's party/worker.ts (RoomStorage, saveRoom, async onStart with room.restore, keep(), onAlarm()); a game with its own timers adds `onRestore` to its rules; set `keepMatchDays` in content/rooms.json (Muzzy's call: live ~7, async ~30 — 7 applies when missing).
- 0.9.0: `OnlineRoom` gained `matchEnded`, `cameBack` and `clearCameBack` — a fake room (Dev Kit previews, tests) adds them, or tsc fails.
- 0.9.0: new promise "a closed tab can rejoin its match": drop the game's own room-code copy (e.g. sessionStorage), use the kit's `lastRoom` (useRoom remembers it), and add "Rejoin match" to the main menu with `matchToRejoin()`, its words in en.json.
- 0.8.0: party/worker.ts answers `/health` first (server/health.ts — a few lines; the installer says how) so live-check can tell the server is up.
