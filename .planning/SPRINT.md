# Sprint 36 — Smoother tools: the Dev Kit edits every file it should, then the kit's small bugs
Started 2026-10-24 · Milestone v0.19 Smoother tools · Features: F132, F133, F134, F135, F136, F137
Muzzy 2026-10-24: "a then b. C later i think" — option A (F132, F133), then option B (F134–F137) added to this same sprint when Muzzy said "auto" (Claude's call: a new sprint would need F132/F133 approved and a retro first); C (new looks) stays in Later.
What changes: the Dev Kit's Tuning tab can show content files outside content/tuning/ (a game lists them), and Save keeps a list laid out by hand the way it was. What stays the same: every game's screens; tuning files already shown look and save as before; games get it only when they reinstall the Dev Kit.

## F132 🔧 The Tuning tab edits more than content/tuning/
Done when: a game lists extra content files in content/devkit.json ("tuningFiles": ["content/rooms.json"]) and each shows in the Tuning tab as its own section(s) with the same sliders, search, Select-tab and Save as tuning files; Save writes it back to its own path; a file only the room server reads says its changes arrive when the server reloads; no listed files → the tab is as before.
- [x] 🤖 1. Spike: in a scratch copy of Glyphtender, list the content files with numbers a designer tunes (besides tuning/) and how rooms.json reaches the room server (live, on reload, or neither) — Notes — devkit/kit/tuning/tuningFiles.ts
- [x] 🤖 2. content/devkit.json "tuningFiles": the listed files are found and shown, each named by its path — devkit/kit/tuning/tuningFiles.ts
- [x] 🤖 3. Save writes each file to its own path; a server-read file says when its changes arrive — devkit/kit/tuning/TuningTab.tsx
- [x] 🤖 4. Tests: a listed file shows + saves to its path · a missing or non-content path is refused in plain words · same name as a tuning file doesn't clash · nothing listed = as before — devkit/kit/tuning/TuningTab.test.tsx
- [x] 🤖 5. Proof in the scratch Glyphtender: rooms.json in the Tuning tab, a slider → Save → only that value changed in the file (screenshot); README + Dev Kit 0.28.0 — devkit/kit/VERSION
Check: devkit tests; the proof's screenshot looked at by Claude; `git diff` of the saved file shows only the moved value.
Checked: 2026-10-24 (Claude) — devkit 528 tests → +11 (4 tab: shown beside tuning files with its note · Save to content/rooms.json + the note in its message · Copy for Claude names the path · list problems said / nothing listed = as before; 7 plugin: nothing listed · names + notes + duplicates · every refusal in plain words · not a list / broken devkit.json · live name · a real Vite server: the tab gets the data, the game's import is live · the module holds only listed files, a broken one said). Scratch Glyphtender (Dev Kit from this branch, "tuningFiles": rooms.json with an "after" note): Tuning tab search "idle" shows a rooms.json section with its labels and help; idleWarnAfterMs 30000 → 20000 → Save → `git diff` = that one line; Save's message names the restart; 0 page errors. Screenshot looked at: .scratch/framework-f132/f132-tuning-rooms.png. check:fast all 20 green. Review: diff read whole by Claude, no bugs. Dev Kit 0.28.0.

## F133 🔧 Save keeps a hand-wrapped list wrapped
Done when: a list written over a few lines by hand (Glyphtender drag.json "_sections": 2 lines) comes back from a Save exactly as it was when nothing in it changed, and with the same line breaks when a value in it changed; lists on one line or one value per line behave as before.
- [x] 🤖 1. readLayout notes where a hand-wrapped list breaks its lines — devkit/vite/formatJson.ts
- [x] 🤖 2. Writing keeps those breaks (same items → same lines; items added or removed → the nearest sensible layout, said in a comment) — devkit/vite/formatJson.ts
- [x] 🤖 3. Tests: Glyphtender's real drag.json saves with an empty diff; a changed value keeps the breaks; one-line and one-per-line lists unchanged — devkit/vite/formatJson.test.ts
- [x] 🤖 4. README line (lands in Dev Kit 0.28.0) — devkit/README.md
Check: devkit tests; a save of a copy of Glyphtender's drag.json with nothing changed leaves `git diff` empty.
Checked: 2026-10-24 (Claude) — 5 tests on Glyphtender's drag.json from before Muzzy's first Save (its 4ff82b5): unchanged → exactly the same text · a change elsewhere → only that line · a changed / added / removed item keeps the breaks · one-line and one-per-line lists as before · Windows line endings. Scratch Glyphtender (drag.json "_sections" wrapped over 2 lines): ghostOpacity 0.45 → 0.55 through the Dev Kit's Save → `git diff` = that one line, the wrapped list untouched. Review: diff read whole by Claude, no bugs.

## F134 🐞 No stray "0" under a part
Done when: a 0 handed to a kit part (children, a badge, a detail, an icon, a slot) shows as "0" inside its place — never loose on the page and never lost; ui-kit tests and the shoot unchanged otherwise.
- [x] 🤖 1. One small `shown()` helper; every `x && <…>` whose x can be a number (React-node props and children — 12 lines) and the HUD / Screen slots use it — ui-kit/kit/shown.ts
- [x] 🤖 2. Tests: MainMenu children 0 · PlayerChip badge 0 with the name hidden · ListRow detail 0 · Screen and Hud slots 0 (they fail on the old code) — ui-kit/kit/shown.test.tsx
- [x] 🤖 3. README line (0.33.3) — ui-kit/README.md
Check: ui-kit tests; the tests fail on the old code.
Checked: 2026-10-24 (Claude) — 4 tests in shown.test.tsx (shown() itself · MainMenu children 0 inside its extras box · a PlayerChip badge 0 with the name hidden · ListRow detail, Screen slot and Hud slot 0) — they fail on the old code (run with the fix set aside, the helper kept); ui-kit 650 tests green; shoot 475 shots, 0 problems. Review: 14 changed lines read by Claude, each the same swap; no bugs.

## F135 🐞 check-ui reads CSS with a data: URL
Done when: `check-ui --css` reads `background: url(data:image/png;base64,…)` as ONE declaration (no false warning from the ";" or ":" inside it), and still warns on the real cases.
- [x] 🤖 1. Split declarations on ";" and ":" only outside quotes and brackets — ui-kit/kit/check-ui.mjs
- [x] 🤖 2. Tests: a data: URL and a quoted ";" give no warning; real breaks still warn — ui-kit/scripts/check-ui.test.mjs
- [x] 🤖 3. README line (0.33.3) — ui-kit/README.md
Check: ui-kit tests; check-ui on the kit's own CSS unchanged.
Checked: 2026-10-24 (Claude) — 2 new tests (an inline SVG data: URL, a base64 PNG and a quoted ";" give no warning; a real px next to a data: URL is still caught on its own line) — the first failed on the old code with the 2 false warnings; my first fix also blanked quoted text in TSX inline styles (2 old tests caught it) → the blanking now runs on CSS values only. npm run check-ui on the kit: 155 files pass, as before. Review: no bugs.

## F136 🐞 Mode select fills its row
Done when: Mode select with fewer modes than fit on a row (2 on desktop) spreads them over the row instead of leaving empty columns; 3+ modes and the phone look the same as today.
- [x] 🤖 1. Measure today: 3 modes fill 3 columns at 1440 / 1100 (no empty 4th — the 2026-09-28 note is out of date); 2 modes → an empty column? — ui-kit/kit/blocks/frontend.tsx
- [x] 🤖 2. If so: Grid gets `fill` (auto-fit) and ModeSelect uses it — ui-kit/kit/layout.tsx
- [x] 🤖 3. Test in a real browser with the kit's CSS: 2 cards fill the row, 3 cards as before — ui-kit/kit/blocks/modeSelectFit.test.tsx
Check: ui-kit tests; a desktop shot of the gallery's Mode select looked at by Claude.
Checked: 2026-10-24 (Claude) — measured first: 3 modes fill 3 columns at 1440 and 1100 (the old note was out of date), but 2 modes on the 526 px panel ended at 361 of 542 px (an empty column). Real-browser test (kit CSS): 2 modes reach the row's end, 3 as before, phone 2 per row — the 2-mode case failed before `fill`. Gallery Mode select desktop shot looked at: unchanged (3 modes). Review: no bugs.

## F137 🐞 A part-way save code tells the player to reload
Done when: after a save code that only partly loads, the panel says what came back AND that the game needs a reload to show it, with a Reload button; a code that fully loads behaves as before.
- [x] 🤖 1. Read what SaveCodePanel does on `partly` and what a game passes it — saves/kit/ui/SaveCodePanel.tsx
- [x] 🤖 2. The part-way message offers Reload (the same reload a full load uses) — saves/kit/ui/SaveCodePanel.tsx
- [x] 🤖 3. Tests: part-way → the message + a Reload that reloads; full → as before (the decision is `partlyLoaded()`, tested; the panel has no test of its own here — the saves module tests without a page) — saves/kit/saveCode.test.ts
- [x] 🤖 4. READMEs + versions (UI kit 0.33.3 for F134–F136, saves 0.6.3) — saves/kit/VERSION
Check: saves + ui-kit tests; the shoot 0 problems.
Checked: 2026-10-24 (Claude) — saves 247 tests (partlyLoaded: full load no · nothing written no · nothing came in no · part yes; the existing part-way test now also checks it). The panel's dialog itself has no test here (the saves module tests without a page) — it's the kit's askConfirm with the game's own onLoaded reload, as the full load uses. Shoot 475 shots, 0 problems; check:fast all 20 green. Review: no bugs. UI kit 0.33.3 · saves 0.6.3.

Notes:
- F134: a lint rule (react/jsx-no-leaked-render) was the first idea, but without types it flags all 62 `x && <…>` lines — most are true/false values that can never draw a 0 — so only the 12 whose value can be a number got the `shown()` helper (Claude's call; the full list was sorted by each prop's type).
- F136 task 1 so far: the gallery's 3 modes fill 3 columns at 1440×900 and 1100×800 (cards 165 px, grid 526 px) and 2 columns on a phone — the 2026-09-28 "empty 4th column" doesn't happen today; whether 2 modes leave an empty column is checked next.
- F132 spike (Glyphtender, read only): content/rooms.json is read by the room server (party/server.ts, glyphtenderRules.ts) once when it starts — its own _help says "restart npm run party:dev after a change"; the client never imports it. Other knob files beside tuning/: content/ai/*.json (pace, skills…), content/data/*.json. So a listed file needs (a) live in the browser like tuning files (for client-read ones) and (b) an "after" note for server-read ones.
- F132 design (Claude's calls): the Dev Kit's Vite plugin reads the list and builds a small virtual module with only the listed files' data (first try imported them with ?devkit-file — Vite didn't treat that as JSON outside a glob; reading the files in the plugin is simpler and watches each file). The list's problems (outside content/, a tuning file, style.json, missing, a name clash with a tuning file, broken JSON) are shown at the top of the tab. Listed files' settings join the Select tab's list too, so a game's "every setting is on an object" test names their knobs until they're placed — Muzzy's rule that a click shows everything.
- Ideas checked against the code before planning (sprint 35 retro): Theme Tuner, the tappable seat row and the shoot's Pause wait were already built → marked done in ROADMAP (f5359bf). F132's and F133's gaps confirmed in devkit/kit/tuning/tuningFiles.ts:9 and devkit/vite/formatJson.ts:21.
- No open P0/P1 bugs in this repo.
- Opt-in list in content/devkit.json, not every content file: style.json has the Color tab, text/ is words, credits/levels aren't knobs — a game names what it tunes (Claude's call).
- Built by Claude in this chat (two small Dev Kit features, different files); the game is never edited — proofs run in `.scratch/framework-f132/`.
