# Sprint 49 — Cleaner edges
Started 2026-10-28 · Milestone v0.31 Cleaner edges · Features: F162, F163, F164 (in this order)
Muzzy 2026-10-28 (/roadmap): "A and B both in full auto. yes mark them. that should be low hanging fruit" — A = the three leftovers as v0.31, run unattended; /deliver waits for Muzzy.
What changes: the kit's page check flags three kinds of cut-off it misses today and the kit stops making them; the starter's online Results leave to the main menu on Escape / Back; a release writes STATE's module-version list itself. What stays the same: how every game plays; what install-module copies; every look's colours and fonts. Not in this sprint: games taking the updates (hand-offs go to ROADMAP Ideas), /deliver (waits for Muzzy).

## F162 🐞 Cut-offs the page check misses
Done when: uiProblems flags all three cases (a title's last character clipped by its card's edge, a card title running past its card, a scroll list squeezed to about one row), each new rule red on today's kit first, the kit fixed at the root, and a full shoot (English + pseudo) green.
- [x] 🤖 1. Measure first: reproduce the three on today's kit (Pixel 200% Settings title, Pixel ModeSelect titles on the desktop parts page, Room player list at 200% upright) — screenshots + what really happens now in Notes — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Teach uiProblems the missing rules with unit tests red first (clipped last glyph at a card edge · text past its card · a scroll list shorter than ~2 rows) — ui-kit/kit/uiProblems.mjs
- [x] 🤖 3. Run the full shoot with the new rules on today's kit; list every find (old ones too) in Notes — ui-kit/scripts/shoot.mjs
- [ ] 🤖 4. Fix the Settings title / ModeSelect titles at the root — ui-kit/kit/blocks/frontend.tsx
- [ ] 🤖 5. Fix the Room's player list room at 200% upright — ui-kit/kit/blocks/online.tsx
- [ ] 🤖 6. UI kit VERSION + README line; kit tests + full shoot (normal + pseudo) green; the starter takes it, check:full green — ui-kit/kit/VERSION
Check: each new rule's test red then green; the three cases flagged on today's kit, then 0 after the fix; full shoot + shoot:pseudo green; kit tests; starter check:full green.
Checked:

## F163 🐞 Online Results take Escape
Done when: on the starter's online game, Escape and the browser's Back on Results land on the main menu (like the game against the computer), and the starter's screens check fails on the old behaviour.
- [ ] 🤖 1. Measure on today's code: play an online match to Results, press Escape and Back; say what really happens — starters/turn-based/e2e/online.mjs
- [ ] 🤖 2. A check that fails on today's behaviour (Escape + Back on online Results → main menu) — starters/turn-based/e2e/online.mjs
- [ ] 🤖 3. Results on the screen stack (or the same leave-on-close rule as TableScreen.tsx), leaving the room cleanly — starters/turn-based/src/ui/OnlineScreen.tsx
- [ ] 🤖 4. The starter's check:full green; root check:fast green — starters/turn-based/package.json
Check: the new check red on today's code, green after; screenshots before → after looked at; starter check:full green.
Checked:

## F164 🔧 Module versions filled at release
Done when: release.mjs, in a project whose folders hold `<module>/kit/VERSION`, rewrites STATE's "Version: X (a 1.2.3 · b …)" list from those files; projects without modules are untouched; tests cover both.
- [ ] 🤖 1. Read how the list is written today in STATE and which modules have kit/VERSION; decide the order (keep today's order, new modules at the end) — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 2. Tests red first: a framework-shaped project gets the list filled; a game without modules keeps its Version line as before — ~/.claude/config/bmuz/scripts/test-scripts.mjs
- [ ] 🤖 3. Build it in release.mjs's STATE Version step — ~/.claude/config/bmuz/scripts/release.mjs
- [ ] 🤖 4. A dry run on the framework prints today's list matching the modules' VERSION files; ~/.claude script tests green — ~/.claude/config/bmuz/scripts/test-scripts.mjs
Check: the new tests red then green; a dry run on the framework names every module's current version; all script tests green.
Checked:

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Work branch: dev/v0-31-cleaner-edges.
- F162 task 1 (measure, helper 1): the three reproduced — Settings in Pixel at 200% in the fake language: the title "tight" (heading size, own line) still 48–78 px wider than its row, its "]" cut off by the card's side (the card scrolls up/down but hides its sides); Pixel's Mode cards on the desktop parts page (below the first 900 px, never checked): titles ~30 px past their cards, read as "touches — 0 px"; the Room at 200% upright: the players list 128 px (the 4rem floor) for rows of ~156 px — it scrolled, so nothing was "cut off". (Helper 1's own notes were lost when it crashed; this line is from its commit messages and tests.)
- F162 task 3 (full shoot, new rules, kit at d804578 = before any fix; 961 shots each): **English 61 problems (8 known), fake language 104 (50 known).** By kind (English / fake language shots):
  - squeezed: Seat picker (12 / 10, 200% upright + sideways), Room players (7 / 7, 200% upright), Victory reveal + Victory (7 / 10, 200% sideways), Settings' Accessibility tab (3 / 3, Cartoon Cozy Pixel 200% sideways), end screens "You win!" (4 / 12, 200% upright), art Game over (2 / 2), Mode select (1 / 1, 200% sideways), Payslip (– / 3), Game over (– / 1). Root: the list floor is a fixed 4rem ("two rows or so") — at 200% text a row is 66–224 px, so it holds under 1.5 rows; on a phone on its side the end screens' floor is ~one row (1.5rem, F161).
  - squeezed on the card itself (Feedback's tooltip card sideways, 3 / 13; the art Game over card, 1 / 1): a card already scrolling as one, the last resort — the rule's own mistake.
  - overlap on the parts page, every look and size (20 / 20): the "Scroll area" demo's label × its list — the scroll box's room (half the card's side gap, reaching over the label) is wider than the gap-xs above it. Old, never seen: below the first screenful.
  - edge on the parts page (– / 8): the Mode cards' titles ("Online", "Party", "Solo") run past their cards in Pixel, Neon, Fantasy — a card title never wraps a word (it's not a .kit-text).
  - clipped by .gallery-game (Idle warning + bot, – / 6; Countdown's "3", 1 / 1): the Idle card is a popover (top layer: no box clips it), the "3" is measured by its line box, not its ink — the rule's own mistakes.
  - clipped by its card's side (fake language): Settings' title (Pixel 200% upright, the task-4 case), the art Game over's "Try again" (200% upright).
  - parts page at 200% in the fake language (below the first screenful): 2 split words ("Buttons", the "Display" title) and 2 carousel slides cut off by the carousel's view.
Retro:
