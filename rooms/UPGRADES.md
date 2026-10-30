# Rooms — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.13.0: `roomsPort()` in vite.config's plugins (the page reads wrangler.json's `dev.port`) — the installer prints the line while it's missing.
- 0.12.0: `OnlineRoom` gained `sendEmote` — a game that builds a fake room (Dev Kit previews, tests) adds it, or tsc fails.
- 0.10.0: keep a match through a server restart (storage parts in party/worker.ts, `onRestore` for a game's own timers, `keepMatchDays` — Muzzy's call: live ~7, async ~30) — the installer prints each while it's missing.
- 0.9.0: `OnlineRoom` gained `matchEnded`, `cameBack` and `clearCameBack` — a fake room (Dev Kit previews, tests) adds them, or tsc fails.
- 0.9.0: new promise "a closed tab can rejoin its match": drop the game's own room-code copy (e.g. sessionStorage), use the kit's `lastRoom` (useRoom remembers it), and add "Rejoin match" to the main menu with `matchToRejoin()`, its words in en.json.
- 0.8.0: party/worker.ts answers `/health` first — the installer prints the lines while it's missing.
