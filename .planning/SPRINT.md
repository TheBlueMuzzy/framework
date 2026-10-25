# Sprint 37 — Two new looks: Dark console and Fantasy
Started 2026-10-24 · Milestone v0.20 Two new looks · Features: F138, F139, F140
Muzzy 2026-10-24: "go auto" on option A (the looks). Running unattended: Claude builds the sketch, drafts each look from its own pick of the takes, and leaves the choice open for Muzzy (Ask Muzzy below).
What changes: a sketch to pick and tune the looks in, then 7 looks in the kit instead of 5 (every game's style picker, the gallery, the screenshot run). What stays the same: every existing look and every game's screens — a game only changes look when its content/ui/style.json says so.

## F138 ❓ Which take is each look
Done when: the sketch shows 3 takes per look on a menu, a HUD and a dialog with knobs, Copy values works, and each look has a pick on record (Claude's draft until Muzzy confirms or swaps).
- [x] 🤖 1. The sketch: 6 takes (3 console, 3 fantasy), 8 knobs, presets, Copy values — checked at 1280×800 + 390×844, every knob moves the look, 0 console errors — .planning/research/sketches/s1-new-looks.html
- [ ] 🙋 2. Muzzy: play the sketch (planner → Sketches), keep or swap each pick, tune, Copy values for Claude — .planning/research/new-looks/picks.json
Ask Muzzy: Dark console — Console 1 (living-room dashboard) is the draft; or Console 2 (handheld) / Console 3 (terminal)? Fantasy — Fantasy 2 (tavern, wood & gold) is the draft; or Fantasy 1 (parchment) / Fantasy 3 (arcane)?
Check: the sketch's checks above; picks.json has both looks.
Checked: 2026-10-25 (Claude) — sketch at 1280×800 and 390×844: 6 takes drawn, every knob (8) changes the look between its ends, no sideways scroll, 0 console errors; all 6 desktop shots looked at (the take name was unreadable over the parchment take → given its own dark pill). picks.json has both looks with why. The 🙋 pick stays open: Muzzy confirms or swaps.

## F139 ✨ The two looks in the UI kit
Done when: content/ui/style.json "preset": "console" or "fantasy" gives a full look (every setting every look has, contrast checked by the kit's own style tests), with its fonts bundled and credited; the screenshot run shows 0 problems for both at every size.
- [x] 🤖 1. Claude's draft picks (with why) in picks.json; console.json + fantasy.json drafted from them, then the screenshot check run on them first — list what it finds before fixing anything — ui-kit/kit/styles/console.json
- [x] 🤖 2. Cinzel + Alegreya (SIL OFL) self-hosted like the kit's other fonts, credited — ui-kit/kit/fonts/fonts.css
- [x] 🤖 3. Both looks registered; the style tests (same settings as every look, contrast, success reads green) pass — ui-kit/kit/styles/index.ts
- [x] 🤖 4. Fix what task 1 found; the shoot 0 problems with 7 looks — ui-kit/kit/styles/fantasy.json
- [x] 🤖 5. Desktop + phone shots of both looks' menu, HUD and a dialog looked at by Claude — ui-kit/scripts/shoot.mjs
Check: ui-kit tests; the shoot; the shots looked at.
Checked: 2026-10-25 (Claude) — task 1 first: the shoot with the two drafts, 639 shots (was 475), 0 problems — nothing to fix from it. Style tests 106 (every setting, 4.5 : 1 text, 3 : 1 focus, a green success) pass for both. check:fast found the button test held Neon's danger red only → it now reads each look's own glow-danger (the behaviour it guards is unchanged). Shots looked at: menu desktop (both), HUD phone (both) — nothing touches an edge; Fantasy's "v0.1.0.12" read "vO.1.O.12" (Cinzel's 0, then Alegreya's old-style numbers) → Fantasy's numbers use Alegreya and the kit asks every font for full-height numbers (lining-nums; the chip score keeps tabular too). Final shoot 639 shots, 0 problems. Review: diff read whole by Claude, no bugs.

## F140 🔧 Everything that lists the looks knows all 7
Done when: the gallery's style switcher, the pick sheet, the CATALOG, the game-ui skill and the version notes name 7 looks; UI kit 0.34.0.
- [x] 🤖 1. The pick sheet's feel lines for the two new looks — ui-kit/scripts/pick-sheet.mjs
- [x] 🤖 2. CATALOG + README (0.34.0; the old-module-rows drop moves to 0.35.0) — ui-kit/CATALOG.md
- [x] 🤖 3. The game-ui skill and the BMUZ catalogs say 7 looks — ui-kit/README.md
Check: grep for "five styles" / "5 styles" finds none left; ui-kit tests.
Checked: 2026-10-25 (Claude) — the pick sheet made for real (menu, 7 looks side by side) and looked at: the Console feel line wrapped and pushed its card down → shortened; Fantasy version now "v0.1.0.12". "five / 5 styles" left only in dated history notes (README version entries, BMUZ-PLAN 2026-10-09, archived reviews) — true when written. check:fast all 20 green (after a crashes test fix: it waited a fixed 50 ms for a report that waits on an async fingerprint — the sprint-31 fix in capture.test.ts had missed this copy). UI kit 0.34.0.

Notes:
- Draft calls (Claude, unattended): Console 1 (dashboard) and Fantasy 2 (tavern) — why in picks.json. The tavern's accent moved from ember red (hue 4) to pewter blue (195): an ember accent sat on top of the danger red. Fantasy is flat (no wood / parchment textures — the design's "textures are an optional extra", still in Later).
- A crashes test failed only under load (check:fast beside a screenshot run): fixed waits of 50 / 20 ms for a report sent after an async SHA-256. capture.test.ts had the right fix since sprint 31; this file was a missed copy.
- Ideas checked against the code before planning (sprint 35/36 rules): ui-kit/kit/styles/ has 5 looks (cartoon, clean, cozy, neon, pixel) — "Dark console" and "Fantasy" are new; none of the 7 bundled fonts is a fantasy serif.
- "Dark console" is ambiguous on its own (a living-room console's dashboard, a handheld, a terminal) — the sketch's three console takes are those three readings.
- Version (Claude's call): new looks are a new feature → UI kit 0.34.0; 0.34.0 was "reserved" for dropping OLD_MODULE_ROWS, which still waits on Glyphtender reinstalling crashes / emotes / ai — that drop moves to 0.35.0 (its comment in kit/conformance.mjs says so).
- No open P0/P1 bugs in this repo.
