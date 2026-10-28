# Sprint 49 — Cleaner edges
Started 2026-10-28 · Milestone v0.31 Cleaner edges · Features: F162, F163, F164 (in this order)
Muzzy 2026-10-28 (/roadmap): "A and B both in full auto. yes mark them. that should be low hanging fruit" — A = the three leftovers as v0.31, run unattended; /deliver waits for Muzzy.
What changes: the kit's page check flags three kinds of cut-off it misses today and the kit stops making them; the starter's online Results leave to the main menu on Escape / Back; a release writes STATE's module-version list itself. What stays the same: how every game plays; what install-module copies; every look's colours and fonts. Not in this sprint: games taking the updates (hand-offs go to ROADMAP Ideas), /deliver (waits for Muzzy).

## F162 🐞 Cut-offs the page check misses
Done when: uiProblems flags all three cases (a title's last character clipped by its card's edge, a card title running past its card, a scroll list squeezed to about one row), each new rule red on today's kit first, the kit fixed at the root, and a full shoot (English + pseudo) green.
- [ ] 🤖 1. Measure first: reproduce the three on today's kit (Pixel 200% Settings title, Pixel ModeSelect titles on the desktop parts page, Room player list at 200% upright) — screenshots + what really happens now in Notes — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. Teach uiProblems the missing rules with unit tests red first (clipped last glyph at a card edge · text past its card · a scroll list shorter than ~2 rows) — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 3. Run the full shoot with the new rules on today's kit; list every find (old ones too) in Notes — ui-kit/scripts/shoot.mjs
- [ ] 🤖 4. Fix the Settings title / ModeSelect titles at the root — ui-kit/kit/blocks/frontend.tsx
- [ ] 🤖 5. Fix the Room's player list room at 200% upright — ui-kit/kit/blocks/online.tsx
- [ ] 🤖 6. UI kit VERSION + README line; kit tests + full shoot (normal + pseudo) green; the starter takes it, check:full green — ui-kit/kit/VERSION
Check: each new rule's test red then green; the three cases flagged on today's kit, then 0 after the fix; full shoot + shoot:pseudo green; kit tests; starter check:full green.
Checked:

## F163 🐞 Online Results take Escape
Done when: on the starter's online game, Escape and the browser's Back on Results land on the main menu (like the game against the computer), and the starter's screens check fails on the old behaviour.
- [x] 🤖 1. Measure on today's code: play an online match to Results, press Escape and Back; say what really happens — starters/turn-based/e2e/online.mjs
- [x] 🤖 2. A check that fails on today's behaviour (Escape + Back on online Results → main menu) — starters/turn-based/e2e/online.mjs
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
Retro:
