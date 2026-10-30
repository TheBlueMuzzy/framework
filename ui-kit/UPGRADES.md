# UI kit — upgrade notes

Hand steps a game does when it updates this module, newest first. `install-module.mjs` prints the ones between the game's version and the new one.
Format: `- <version>: <step>` (LOOK CHANGE = sizes or looks change: re-take the game's screenshots and show Muzzy before re-recording them) · `Needs Dev Kit: <version>` = the install is refused on an older Dev Kit.

- 0.38.0: LOOK CHANGE — a scroll list in a card keeps room for two of its own rows (or 4rem), else the whole card scrolls; a menu title too wide even at heading size drops to body size on its own line.
- 0.37.2: LOOK CHANGE — badges get room above and below their words; a chip's detail numbers are all one width.
- 0.35.8: LOOK CHANGE — avatars in list rows (Results, end screens, the Lobby room's players) keep room for the winner ring: rows a little taller, names 0.3125rem further right. A game with its own "N rows in view" rule can lose a row on a short screen (Glyphtender: 3 of 4 lobby seats at 768×343).
- 0.35.7: a scrolling card's stuck buttons get a fade above them — another scroll-driven animation (see 0.35.5).
- 0.35.5: a scrolling card's stuck button row is a scroll-driven animation that never "finishes": a game's e2e helper that waits for every animation to end waits forever — skip animations whose `timeline` isn't `document.timeline`.
- 0.35.5: an icon Button's symbol sits in its own box (`.kit-button-glyph`): a game test that counts a button's text boxes as lines (Glyphtender's "button words wrapped") counts it too — count only the words' own boxes.
- 0.35.5: LOOK CHANGE — a Bar's / Counter's typed icon (❤, 🪙) sits in an emoji-wide box: in Chromium the ❤ chip is ~7 px wider and its bar that much shorter.
- 0.33.0: LOOK CHANGE — long names wrap instead of "…" and their badges move under them on a narrow row; the Lobby room on a phone on its side splits half and half.
- 0.30.0: crashes ≤ 0.1.0, emotes ≤ 0.3.0 or ai ≤ 0.7.0 in the game: update them too (they bring settings-rows.json) — the kit only checks their old Settings rows through a fallback that is going away.
- 0.22.0: a non-commercial licence (CC BY-NC, "personal use only") in content/credits.json now counts as 🔴 — run the framework check and replace any asset it names.
- 0.21.0: LOOK CHANGE — xs chips and their badges get more room inside. New checks may name the game's own screens: faint text, anything touching its box's edge, a card or PlayerChip that grows while it fills in, and the Settings comfort rows (reduce motion; master volume with the audio module).
