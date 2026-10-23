# Changelog

## v0.11.2 — 2026-10-22

When a game breaks for a player, the designer now hears about it: a new crashes module catches the error, sends one short report to the game's own small crash server, and the next session starts with "3 new errors from players since last time". Reports carry no name, address or stored id, are deleted after 90 days, and players can switch them off in Settings.

### New
- Crashes 0.1.0 — errors are caught from the first line of the game, grouped by kind and sent at most once per kind (5 per session), held while offline and sent when the connection comes back; nothing is sent while the player has switched reports off.
- Crashes — a broken screen says "Something broke · Reload" instead of going blank.
- Crashes — the game's own crash server (one Cloudflare worker per game, free plan) keeps up to 20 samples of each kind a day, caps how much any one address or day can send, and flags a fixed error that came back in a newer version.
- Crashes — source maps never ship to players; `npm run crashes` on the PC shows each error with the real file and line, and `npm run crashes -- fixed <id> <version>` marks one fixed.
- Crashes — the installer copies the module in, writes the starter config and server files once, and prints only the wiring steps the game still needs; the framework check confirms each one.
- UI kit 0.26.1 — the Settings check accepts the "Send crash reports" switch.
- Dev Kit 0.22.1 — the framework check knows the crashes module and names its update command.

### Known issues
- A deliberate flood from many addresses can still use up the Cloudflare account's free daily requests — planned (crash reports, layer 2).
- Putting a game's crash server live is a separate, manual step per game; no game has one yet.

## v0.11.1 — 2026-10-21

Every sound in a game can now come out at the same loudness and start on time: a new audio check measures each sound and evens out the off ones, and sounds dropped into the Sound Board are levelled as they land.

### New
- Audio 0.4.0 — `npm run audio:check` lists every sound in public/audio with its loudness, peak, how late it starts and its length, and flags the ones that are off; `--fix` evens out only those, keeping each original in `audio-originals/` (outside what players download).
- Audio — loudness targets per sound folder in content/audio.json (every folder −18 dB by default, ±3 dB allowed, a −1 dB ceiling), editable in the Dev Kit or Obsidian; `maxLimitingDb` sets how much a spiky sound's peaks may be shaved.
- Audio — the framework check warns about a sound far from its target or slow to start, and names the fix.
- Dev Kit 0.22.0 — a sound dropped into the Sound Board is levelled to its folder's target as well as trimmed and converted, the dropped file is kept, and the Sound tab says how loud it came out.

### Fixed
- Short clicks now really come up to their target: the old spike limiter turned the whole of a very short sound down.

## v0.11.0 — 2026-10-21

Saves grow up: a game can resume an unfinished run, rejoin an online match after closing the tab, copy progress to another device with a short link code, and keep leaderboards that check every score. Every game can now show one version number on its menu and Settings, and a game says "portrait only" once so no check tests it on a phone held sideways.

### New
- Saves 0.6.1 — "Continue?" on launch for a run in progress (autosaved at natural break points, deleted when the run ends).
- Saves — a run kept as its seed and moves, so it can be replayed exactly; gives replays and daily challenges.
- Saves — a short link code copies a player's save to another device (no accounts), with a privacy line and "Delete my data".
- Saves — leaderboards that replay each game on the server before accepting its score, so a sent score is never trusted.
- Saves — one storage switch for the whole kit, ready for slower storage on app stores later; saves are written in the background and forced out when the page hides.
- Rooms 0.11.0 — an online match waits until it ends: a player who closed the tab gets straight back into their seat, hours later and even after a server restart; a reload goes straight back in.
- Rooms — the room server answers a health check, so session start can say when it's down.
- Version module 0.1.0 (new) — one "vX.Y.Z.B" label on the main menu, the bottom of Settings and in bug reports, from the game's version.json; an out-of-date build is refused.
- UI kit 0.26.0 — confirm boxes work without wiring in the kit's screens; a HUD bar row can take "at most its share"; tighter dock padding as an option; "Continue" on the main menu.
- UI kit — content/ui/style.json `"orientation"` ("any", "portrait" or "landscape"); the framework check skips the phone sizes a game never plays at and says so.
- Dev Kit 0.21.1 — the framework check warns when the PAUSED label sits on top of the game's HUD on a phone, and names where it would fit.

### Fixed
- The main menu's version label no longer peeks out from under a screen opened over the menu.
- On a short screen, the Settings version sits at the right of the header instead of taking a row.
- The link-code cloud and the leaderboard refuse an oversized upload before reading it, so one huge request can't restart the server for everyone.
- "Delete my data" keeps working even when a flood of wrong link codes makes fetching say "Too many tries"; wrong codes from one IPv6 network block are now limited together.
- An online match that was started but never played, with nobody connected, ends after 24 hours (content/rooms.json keepUnplayedMatchHours) so its room code is free again; a match anyone has played still waits keepMatchDays.
- A save made while the page is hiding is written straight away, and a broken storage refuses new saves before it can drop the backups.

## v0.10.3 — 2026-10-20

The Credits screen can now show the licences of the open-source code a game ships, and the credits check catches art or sound that may not be used commercially. Every framework module now waits a week before taking a brand-new package version.

### Breaking
- Credits with a non-commercial licence (CC BY-NC, "personal use only", "non-commercial use only") now count as 🔴, so the framework check fails until that asset is replaced. To upgrade: update the UI kit, run the framework check, and replace any asset it names.

### New
- Credits screen: an "Open-source code" section with an "Open-source licences" button, shown only when the game has a third-party-notices.txt (each release writes one).
- Credits check: licences that allow commercial use ("free for commercial and non-commercial use") stay fine; only the licence itself is read, not the credit line.
- A one-week wait on brand-new package versions in the framework and every module, against poisoned package releases like the 2025 npm worm.
