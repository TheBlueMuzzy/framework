# Sprint 42 — A tiny tic-tac-toe game that tests every framework update
Started 2026-10-26 · Milestone v0.24 A test game guards every update · Features: F151, F65, F152
Muzzy 2026-10-26: "1. yes ttt 2. yes" — the starter is tic-tac-toe, online play is in this sprint.
What changes: a new `starters/turn-based` game in the framework (every module wired), the framework's checks play it on every module change, the results "1ST" badge gets room. What stays the same: every game (Goops' own Claude handles Goops), every module's behaviour except the badge's place.

## F151 🧱 Turn-based starter
Done when: `starters/turn-based` is a playable tic-tac-toe with every module installed by install-module.mjs and wired per MODULE-CONTRACTS (live tuning, both pauses, the rules clock), menus from the UI kit, an AI opponent, sounds, emotes, saves and local online play; its check:fast + check:framework are green and a `smoke` script plays one round in Playwright with a clean console.
- [ ] 🤖 1. Set it up: Vite + React + TypeScript (Glyphtender's tsconfig / eslint / vite shape, the check-all template for check:fast), tic-tac-toe rules on the table module with unit tests, no screens yet — starters/turn-based
- [ ] 🤖 2. Install the Dev Kit, UI kit (Clean), version, saves and crashes with install-module.mjs and wire each (live content, rules + looks clocks, both pauses) — starters/turn-based
- [ ] 🤖 3. Screens from the kit: main menu, board, pause, results, settings — every size the kit checks — starters/turn-based
- [ ] 🤖 4. AI opponent (ai module, 2 personalities) + placeholder sounds (audio module, ZzFX) + emotes — starters/turn-based
- [ ] 🤖 5. Online play with the rooms module (wrangler dev on a 6xxx port, nothing deployed) — starters/turn-based
- [ ] 🤖 6. All green: check:fast, check:framework, a `smoke` script that plays one round; phone + desktop shots looked at — starters/turn-based
- [ ] 🤖 7. README (what it is, what a new game replaces first) + /define copies the closest starter for a new game — ~/.claude/skills/define/SKILL.md
Check: in starters/turn-based — `npm run check:fast`, `npm run check:framework`, `npm run smoke` all green; a round played against the AI and one online (two tabs); shots at 390×844 and 1440×900 looked at.

## F65 🔧 Framework test game
Done when: the framework's check:fast and GitHub's checks run the starter's checks on every module change, and a module broken on purpose turns them red in both places.
- [ ] 🤖 1. check:fast runs the starter's own checks against the framework's current modules — scripts/check-modules.mjs
- [ ] 🤖 2. GitHub runs them on every push — .github/workflows/checks.yml
- [ ] 🤖 3. Proof: break a module on purpose → the starter goes red locally and on GitHub; put it back → green — scripts/check-modules.mjs
Check: the broken-on-purpose run red in check:fast and on GitHub (run links in Notes), then green.

## F152 🐞 Results badge room
Done when: the "1ST" badge never touches the avatar's ring on Results / End game in any look, size or engine, and the page check flags a badge touching a round avatar.
- [ ] 🤖 1. Measure it on today's code: which looks, sizes and engines, by how much (shots) — ui-kit/kit/blocks/flow.tsx
- [ ] 🤖 2. The page check sees a badge touching a round avatar's ring (a test that fails on today's code) — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 3. Give the badge room; Chromium + WebKit shoots 0 problems — ui-kit/kit/blocks/blocks.css
Check: `npm run shoot` + `npm run shoot:webkit` 0 problems; the new uiProblems test fails on the old code.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Tic-tac-toe (Muzzy 2026-10-26): the simplest rules to swap out for a real game; the AI personalities still show (a careless one misses blocks).
- The starter's kit copies are game copies: the framework's lint must ignore them (installers add the game's own ignore lines; the root eslint.config.js too).
- Servers this sprint start on 6xxx ports and are stopped with stop-servers.mjs.
