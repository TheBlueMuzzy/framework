# Changelog

## v0.22.0 — 2026-10-25

The UI kit has two new looks, for 7 in all: Dark console (a games console's own menus — dark navy, soft tiles, one bright blue) and Fantasy (dark wood and gold, with carved-capital titles). A game picks one with `"preset": "console"` or `"preset": "fantasy"` in `content/ui/style.json`; every other look and every game's screens stay as they were.

### New
- UI kit 0.34.0: the Dark console look — dark navy panels without outlines, big soft corners, one bright blue for buttons and focus.
- UI kit 0.34.0: the Fantasy look — dark wood panels with thin gold edges, gold buttons, Cinzel capitals for titles and Alegreya for reading (both fonts bundled and credited, SIL Open Font License).
- UI kit 0.34.0: the gallery's style switcher, the style pick sheet, the CATALOG and README all list the 7 looks.

### Fixed
- UI kit 0.34.0: numbers are full height in every font — a 0 no longer reads as a small "o" (Fantasy showed "v0.1" as "vO.1"); fonts that already drew full-height numbers look the same.
- Crashes (tests only, no version change): a test no longer fails on a busy machine — it waits for the report instead of a fixed 50 ms.

## v0.21.0 — 2026-10-24

The Dev Kit's Tuning tab can now edit the other content files a game lists — like the room settings — with the same sliders and Save, and Save keeps a list you laid out by hand the way you wrote it. Four small kit bugs are gone: a stray "0", a false CSS warning, an empty column in Mode select, and a part-loaded save code that never said to reload.

### New
- Dev Kit 0.28.0: list content files in `content/devkit.json` → `"tuningFiles"` (e.g. `content/rooms.json`) and each shows in the Tuning tab with sliders, search, Select and Save, written back to its own file and live in the game like a tuning file. An `"after"` note says when a saved change arrives ("restart npm run party:dev"); a path that can't be used is said at the top of the tab. Their settings join the Select list, so the game's select test names any not yet placed on an object.

### Fixed
- Dev Kit 0.28.0: Save no longer spreads a list you wrapped over a few lines into one value per line — its line breaks stay where they were.
- UI kit 0.33.3: a 0 handed to a part (a badge, a detail, an icon, a menu's extras, a HUD slot) shows as "0" in its place, instead of a loose "0" on the page or nothing.
- UI kit 0.33.3: the UI rules check reads a picture written into CSS (`url("data:image/svg+xml;…")`) as one value — no more false raw-colour or px warnings from inside it.
- UI kit 0.33.3: Mode select with 2 modes spreads them over the row instead of leaving an empty column; 3 or more modes and phones look the same.
- Saves 0.6.3: when a save code only partly loads, the Save code screen says so and offers to reload the game so what came back shows.

## v0.20.0 — 2026-10-24

A speech bubble that can't keep clear of what it was told to avoid now says so in the dev console, instead of quietly covering it. The UI kit's screenshot run stops when a file changes while it runs, so its result is always about one version of the code.

### New
- UI kit 0.33.3: when no side keeps a TalkingBubble, speech bubble, emote picker or mute menu off its `avoid`, it prints one dev-console warning naming the bubble, what it points at and what it covers — once, and again only after it was clear in between. Nothing changes on screen, and nothing prints in a game players download.
- UI kit 0.33.3: the screenshot run (`npm run shoot`) stops at the next shot when a file is edited, added or deleted mid-run, naming the file, and asks to run it again. It also counts the kit's own dev warnings as problems.

## v0.19.0 — 2026-10-24

A kit button placed inside an art layer keeps its full 44 px tap size again. The UI kit's screenshot run comes back clean: 475 shots, 0 problems. The page check now also catches a chip sitting on another piece's words.

### Fixed
- UI kit 0.33.2: a Button (or any kit control) inside an ArtLayer could shrink below the 44 px tap size (a compact button measured 29 px tall). Controls now keep their tap size; pictures and panels in the layer still shrink to fit it.
- UI kit 0.33.2: the page check no longer reports 1 px edges on the pinned screen. It was reading a scaled-down chip's border at full size.
- UI kit gallery: at 200% text on a phone, the parts page's HUD demo no longer puts "Round 2" over the Health bar (it's now built with Hud, as a game would). On a phone on its side, the talk screen's two pickers sit one in each top corner, clear of the talking bubble.
- Every other installer (ai, audio, crashes, Dev Kit, emotes, rooms, table, UI kit, version) now does what saves 0.6.2 does: it asks git for the kit's version once per run instead of on every install, so installs and their tests stay fast on a busy computer (the ai install test: 18 s → under 2 s).

### New
- UI kit 0.33.2: the page check reports `overlap: "Coins" covers part of "Score"` when a solid chip sits on another piece's words, not only on bars and pictures. Words on their own chip, and labels on their own bar, are left alone.
- Module versions: ai 0.8.1 · audio 0.4.1 · crashes 0.2.1 · Dev Kit 0.27.2 · emotes 0.4.1 · rooms 0.12.1 · table 0.8.1 · UI kit 0.33.2 · version 0.1.2.

## v0.18.0 — 2026-10-24

On a small phone, a HUD's corner pieces no longer slide under their neighbours: the corners keep their width and the middle of the row gives way. The page check now also catches a solid chip or badge sitting on part of a bar, meter or picture.

### Fixed
- UI kit 0.33.1: a HUD corner (bars, coins, score) could shrink below its content and slide under the piece next to it. On an upright Cozy phone the coins chip covered the end of the Health bar; on a 667×375 phone on its side, Roll crossed "40%". Corners now keep their width, a bar with a set width gets shorter inside its plate, and the middle wraps instead. Only HUD screens change; menus and other screens look exactly as before.
- Saves 0.6.2: installing the saves module no longer starts git on every install, so its test stays fast on a busy computer (5 s → under 0.3 s).
- Dev Kit 0.27.1: its own npm / npx test no longer goes red when npm prints a warning about an unknown setting, so a game with such a setting can install the Dev Kit again.

### New
- UI kit 0.33.1: the page check reports `overlap: "Coins" covers part of "Health"` when a solid piece crosses the edge of a bar, meter, picture or avatar. On-purpose layering is left alone: a dialog over the HUD, a badge on its own card, a label on its own bar, toasts and anything moving.
- The UI kit's screenshot run also shoots a 360×780 phone and a 667×375 phone on its side.

### Known issues
- The screenshot run still lists 16 older finds that the new check and sizes made visible. They're in the roadmap's Ideas for a later sprint: the parts page's HUD demo at 200% text, the talking bubble over a picker on a phone on its side, and 1 px edges on the pinned screen.

## v0.17.1 — 2026-10-24

A game that draws its own main menu or Settings screen, instead of using the UI kit's, can now show the version there and pass the framework check.

### New
- Version module 0.1.1: put `data-version-spot="main-menu"` (or `"settings"`) on the element that shows `{versionLabel}`, in a file that imports it from `../version`. The check accepts that in place of the kit's `<MainMenu version>` / `<Settings version>`. A mark in a comment, or a file that only imports the label without showing it, still fails.

## v0.17.0 — 2026-10-24

The checks now say exactly what's wrong instead of failing in confusing ways, and the kit's own sample screens pass its layout rules. A talking bubble can take its colours from a game's own settings, and the Dev Kit's Fonts tab can try every font installed on the computer.

### New
- UI kit 0.33.0: the talking bubble takes an optional `colours` setting (fill, text, outline, pointer), which can be edited live. With nothing set, the bubble looks the same as before. If the text would be hard to read, it falls back to the style's text colour.
- Dev Kit 0.27.0: the Fonts tab lists every font installed on the computer, beside the designer's font folder, with no browser permission needed. "Try" previews a font live; "Add to game" copies it in, marked 🔴 until its licence is checked. `"installedFonts": false` turns the list off.
- Game checks (`check-all` template + `ports.mjs`): a full check stops at once when a port it needs is busy. It names the program holding the port and the command that frees it.

### Fixed
- Long player names wrap onto a second line instead of being cut off with "…".
- On a sideways phone, the Lobby room no longer covers its own text, and the HUD sample and toasts keep clear of other things on screen.
- Dev Kit 0.26.2: the framework check passes file names to programs as plain data. A name with odd characters can never run a command, and the Windows warning about it is gone.

### Known issues
- Games with older crashes / emotes / AI copies (no `settings-rows.json`) are still checked against the kit's old built-in list, until UI kit 0.34.0.
- On a phone, the HUD's corner pieces can be squeezed under each other: planned.
- The bubble counts a see-through fill as solid when it checks contrast: rare, planned.
- A bubble that appears takes focus from a Dev Kit slider being nudged with the arrow keys: rare, planned.

## v0.16.0 — 2026-10-24

The talking bubble and the report reveal now work for every player: screen readers hear each line and emote once, keyboard players land on the bubble, and a report replays its reveal by itself when its rows change.

### New
- UI kit 0.32.0 — a report list replays its reveal (and calls `onRevealed` again) whenever its rows change, e.g. the next payday in the same popup; the `key` workaround is no longer needed.
- UI kit 0.32.0 — one announcement area per page that stays put, so screen readers read every talking-bubble line and every emote exactly once (`announce(text)` for a game's own lines).
- UI kit 0.32.0 — a talking bubble that waits for a tap takes keyboard focus when it appears (never from a text box) and gives it back when it goes; `lineId` lets a game say the same line again.

### Fixed
- A talking bubble's feel values out of range or missing in `talk.json` fall back to safe ones instead of drawing a broken outline.
- A long page no longer scrolls by 1 px once a screen-reader announcement has been made.

### Known issues
- Games with older crashes / emotes / AI copies (no `settings-rows.json`) are still checked against the kit's old built-in list — one more release, out in UI kit 0.33.0.
- A bubble that appears takes focus from a Dev Kit slider being nudged with the arrow keys — rare, planned.
- The announcement area sits outside popups marked as modal; VoiceOver on a real iPhone isn't tested yet.

## v0.15.0 — 2026-10-24

A game can now hand a finished piece to the framework while it keeps being built: the piece waits in a shared queue, becomes a framework module, and swaps back into the game in one step, with the game's own checks as the proof that nothing changed.

### New
- The extraction queue (`.planning/extractions.md`, Muzzy's setup only): a game adds a piece with its files, what it does and the checks that prove it; the framework marks it building, then released; the game swaps it for the module in one commit — or, if its checks go red, the attempt is set aside on its own branch and the game is left as it was.
- While a piece is queued, editing its files in the game warns "bug fixes only" and asks for a one-line log on the queue entry (never blocks).
- install-module takes modules born from the queue: each lists its own game folders, so no installer list has to grow.

### Fixed
- A framework module installed in a game is protected from edits there whatever its name — not only the built-in ones.

### Known issues
- A swap doesn't yet rewrite shortcut imports (`@/…`), mocked module paths or template-string imports — such a swap goes red and is set aside, never half-done.
- StatList doesn't replay its reveal when a popup swaps its rows — pass a `key` for now (planned).

## v0.14.0 — 2026-10-24

Story characters can now talk: a speech bubble grows from its tail, types its line out with pauses, and fizzes its outline like a voice while it speaks. End-of-game reports can reveal their rows one at a time, and a long report scrolls inside its card so the buttons always stay in sight. Installing a framework piece into a game no longer breaks the game's own code checks.

### New
- UI kit 0.31.0 — `<TalkingBubble>`: grows from its tail, types its text with rests at punctuation, a speech-wave outline and per-syllable pops while it talks, a squelch while it waits; a plain outline without the wave; its feel values live in the game's `content/tuning/talk.json`, editable while the game runs. Reduce motion shows the line whole; screen readers hear it once.
- UI kit 0.31.0 — Victory / Game over take `reveal` (ms per row): the stats appear one after another at the Results screen's pace, the card at its full size from the start, and `onRevealed` when the last row shows.
- UI kit 0.31.0 — `<StatList>`: the same rows as a block a popup can hold; each row can be marked a loss (▼) or a gain (▲).
- UI kit 0.31.0 — a long Victory / Game over list scrolls inside the card with a fade at the edge (no scroll bar); the title, message and buttons stay put, and a reveal follows the newest row until the player scrolls.

### Fixed
- Installing a framework piece adds its folder to the game's own code-check skip list, so a game's check no longer fails on framework code it doesn't own (installer + Dev Kit 0.26.1, which also treats any installed piece as framework code, not the game's).

### Known issues
- Games with older crashes / emotes / AI copies (no `settings-rows.json`) are still checked against the kit's old built-in list — one more release, out in UI kit 0.32.0.
- On a phone held sideways, a long Victory / Game over list shows only one or two rows at a time — it scrolls and follows the reveal; a side-by-side layout is a design call for later.
- Some screen readers may not read a talking bubble that's replaced for each new line — planned (a lasting shared announcer).

## v0.13.0 — 2026-10-23

Games can now take emotes and the AI's banter without hand-building anything: one line puts every player's portrait in a row of tappable seats — tap yours to send a phrase, tap a rival's to mute them, with a muted mark on their portrait. Modules now bring their own Settings switches to the framework check, so a new module with a switch needs no UI kit change.

### New
- UI kit 0.29.0 — the player seat row can make each seat a button (named for screen readers, reachable by keyboard), with a mark on the portrait that never changes the seat's size, and a portraits-only look.
- Emotes 0.3.0 — `<EmoteSeats>`: the tappable seat row, the phrase picker on your seat, Mute on a rival's, muted marks and the speech bubbles, in one line.
- UI kit 0.30.0 — the Settings check reads each installed module's own list of its Settings switches (`settings-rows.json`) instead of a list built into the kit.
- Crashes 0.2.0, Emotes 0.4.0, AI 0.8.0 — each ships its `settings-rows.json`.

### Fixed
- Closing the phrase picker or the Mute menu puts keyboard focus back on the seat that opened it.
- A seat id with an odd character (a quote or a line break) from an online room no longer breaks the seat row; the escaped seat lookup (`seatSelector`) is now shared with games that wire seats by hand.
- A seat that left with its menu open no longer reopens the menu when it comes back.
- A module's own code no longer counts as the game reading its Settings switch.

### Known issues
- Games with older crashes / emotes / AI copies (no `settings-rows.json`) are checked against the kit's old built-in list for one more release — reinstall those modules before UI kit 0.31.0.
- The seat button's spoken name doesn't include the score or "muted" yet — planned.

## v0.12.1 — 2026-10-23

The AI check now says what wins: after a batch of bot-vs-bot games, the report lists the five situations that most predict winning in plain sentences ("Players with Magic lead 4 or more after turn 3 win 55% — vs 14% with -3 or less"). A new auto-tuner suggests personality slider values that turn red feel targets green, checks them on fresh games before suggesting, and says honestly when it can't — nothing changes until the designer applies and saves.

### New
- AI 0.6.0 — "What wins?": a game names the numbers to watch per player (score lead, pieces trapped…); the arena reads them after turns 3 and 5 and at the end, splits players into low / mid / high, and ranks how strongly each predicts the win. Too-small groups are left out and listed, and a number that simply is the final score is named apart as "the win itself".
- AI 0.6.0 — a game can count its own turns, so a setup phase (like a draft) isn't counted as turns.
- AI 0.7.0 — the auto-tuner: `npm run ai:tune -- --personality <id>` tries one personality's sliders inside their ranges, keeps what hits more of its feel targets, re-checks the best on at least 30 fresh games, and writes a suggestion page (old → new per slider, each target now → suggested). Results only just over a line are flagged to confirm with more games.
- Dev Kit 0.25.0 — the Check panel shows the "What wins?" sentences.
- Dev Kit 0.26.0 — "Suggest sliders" in the AI tab runs the tuner in the background with progress; Apply puts the values in as unsaved edits (Save / Undo unsaved as usual).
- The AI installer adds `ai:tune` and the new settings to a game's `content/ai/arena.json`, and lists the optional wiring only while it's missing.

### Fixed
- A small run of equal numbers before a big one keeps its own low / mid / high group.
- Number ranges on the report read "-78 to -21" everywhere.
- A name a game gives a measure is shown safely on the report page.
- A tuning run stops when its Dev Kit panel closes instead of playing on unseen.

### Known issues
- In Glyphtender's test runs the tuner found no setting that reliably turned a red target green — results there swing a lot from game to game; 30 games a try is the useful minimum (about 40 minutes per personality on a PC).
- The tuner moves one slider at a time, so it can't find two traits that only help together — planned (several sliders at once).

## v0.12.0 — 2026-10-23

Players can now talk across the table without typing: tap your own seat, pick a preset phrase ("Well played!"), and it shows in a speech bubble by your seat on every screen, locally and online. Computer players speak through the same bubbles at the game's big moments, always answer a player's good move, and a "Bot chatter" setting (Off · Some · Lots) turns them down. A new personality check plays many bot-vs-bot games and shows whether each personality really plays like itself.

### New
- Emotes 0.2.0 (new module) — 7 starter phrases, a picker with a cooldown ring, mute any opponent (they aren't told), a "Hide everyone's emotes" switch in Settings, and a spam limit of 3 in a row then one every 4 s; phrases, limits and bubble timings live in content/emotes.json.
- Rooms 0.12.0 — emotes travel through the room server, which always uses the sender's own seat, accepts only the game's own phrases, keeps its own spam count per player and never stores an emote.
- AI 0.5.0 — banter: the game names its moments, each personality has lines per moment in content/text/en.json, bots speak a short beat later on the game's clock (both pauses hold them), never two at once, never the same line twice in a row; a player's good move always gets one bot's answer.
- AI 0.5.0 — the "Bot chatter" Settings row (Off · Some · Lots), kept between sessions with the saves module.
- AI 0.3.0 — the arena: `npm run ai:arena` plays many bot-vs-bot games and writes a report page — each personality's behaviour against its feel targets, whether personalities can be told apart, win shares and a skill ladder.
- UI kit 0.28.1 — speech bubble, emote picker, mute menu and muted mark, in all 5 styles and every screen size.
- UI kit 0.27.0 — a "success" colour in all 5 styles, cards that highlight (`tone="success"`) or show locked (greyed, readable, can't be tapped), a button in a dialog's header, Neon's red buttons glow like its others, and a menu title that shrinks before it would split a word.
- Dev Kit 0.24.0 — the AI tab edits each personality's lines per moment while the game runs and saves them; "Run check" plays the personality check in the background with a progress bar.
- The installers add emotes and banter to a game and list only the wiring still missing; the framework check confirms each promise.

### Fixed
- Adding emotes to a game no longer rewrites the game's whole text file — only the missing lines are added.
- Two seats' speech bubbles no longer land on top of each other.
- An emote sent the instant its cooldown ended is no longer dropped by the room server because of network delay.
- Lobby players coming and going can no longer grow the room server's memory.
- Saving banter lines in the Dev Kit keeps every other entry in the text file.
- A waiting bot line is dropped when a person takes that seat back, instead of being said as them.
- A dialog title that shrank for a header button goes back to full size when the button goes away.
- Skill-ladder games no longer count in the personality check's main numbers.

### Known issues
- Online, bots run on the room server and don't see each player's "Bot chatter" level; "Hide everyone's emotes" still hides them — planned (banter, layer 2).
- When two bubbles must share a spot (a player's emote and a bot's line at once), the second can point past its seat — planned.
- No game uses emotes or banter yet; each game's own session installs them.

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
