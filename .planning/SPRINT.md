# Sprint 46 — Room for longer words
Started 2026-10-27 · Milestone v0.28 Room for longer words · Features: F156
Muzzy 2026-10-27 (/deliver v0.27): "yes next" — make "The kit makes room for longer words" the next feature; auto mode.
What changes: the kit's room, HUD, pinned, results and end-game screens (and the avatar name) wrap or shrink a long word instead of cutting it off, splitting it mid-word or overlapping. What stays the same: in English every screen looks as it does today (the normal gallery shoot finds nothing new); no game changes until it reinstalls the UI kit. Not in this sprint: a Language setting or real translations.

## F156 🔧 Room for longer words
Done when: `npm run shoot:pseudo` (the gallery in the long fake language) finds 0 clipped / split / overlap problems; the English gallery shoot finds nothing new; each fix reuses the kit's existing fit-or-wrap pieces (nameFit, useTitleFit, fit-wrap) rather than a new one; the starter's check:full green on the new kit.
- [ ] 🤖 1. Measure first: rerun shoot:pseudo on today's code, list the clipped / split / overlap finds by screen and by the part that causes them, and name which existing fit-or-wrap piece each part should use — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. Room and lobby: room code, player names, "friends" split — ui-kit/kit/blocks/online.tsx
- [ ] 🤖 3. HUD: corner texts that overlap each other — ui-kit/kit/blocks/hud.tsx
- [ ] 🤖 4. Pinned box: words cut off — ui-kit/kit/blocks/pinned.tsx
- [ ] 🤖 5. Results and end game: names cut off — ui-kit/kit/blocks/flow.tsx
- [ ] 🤖 6. The avatar's name touching its circle, and the smaller screens left by task 1 (emotes, chips, seats, menu, teach, settings) — ui-kit/kit/controls/Avatar.tsx
- [ ] 🤖 7. Full shoot:pseudo + the English shoot; the starter takes the new kit (install-module) and its check:full green; README + VERSION — ui-kit/README.md
Check: shoot:pseudo 0 clipped / split / overlap (from 427 shots with a find); the English shoot no new finds; each fixed part has a test red on the old code where a unit test can see it; the starter's check:full green; root check:fast green.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md).
- Starting point (F91 — Translation readiness, 2026-10-27, full shoot:pseudo): 427 of 961 shots with a find — edge 659, clipped 190, split 94, overlap 46. The check's kinds by screen: room 99, hud 57, pinned 45, results 43, endgame + endgamedim 40, emotes 12, chips 12, roomauto 7, menu 4, seats / victoryreveal / teach / settings 1–2. Task 1 re-measures, since the bar is set from today's code.
- Decision (Claude, 2026-10-27): `edge:` finds (a word touching its box) aren't part of the 0 bar — they're 659 mostly-harmless touches and check:framework's fake-language pass already treats a word running past its button as edge: → task 1 lists the ones that run past, those are fixed; the rest stay counted, not chased.
- Decision (Claude, 2026-10-27): the fake-language check stays a warning in games (they may have their own long words to sort); the gallery's own bar is 0.
