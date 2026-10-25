# Sprint 39 — Every screen holds up at 200% text
Started 2026-10-25 · Milestone v0.21 The kit meets every player · Features: F144, F145
Muzzy 2026-10-25: "go auto. i'm going to bed" — running unattended. Claude plans, one helper builds, Claude merges, reviews and saves; taste calls go to Notes as `Ask Muzzy:`. /deliver v0.21 waits for Muzzy.
What changes: the screenshot run looks at every screen with the biggest text setting, and the screens it finds broken get fixed. What stays the same: every screen at normal text size (the shoot proves it: the 100% shots stay 0 problems), every look, every game.

## F144 🔧 The shoot sees every screen at 200% text
Done when: npm run shoot takes every gallery screen at 200% text on an upright phone (390×844) and a sideways one (844×390), in the Clean look, and lists what it finds — before anything is fixed.
- [ ] 🤖 1. Every gallery screen at 200% on both phones in the shoot (the parts / Settings 200% shots show how) — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. Run it on today's code and list every problem by screen in Notes, before any fix (F141's scan list is the starting guess) — ui-kit/scripts/shoot.mjs
- [ ] 🤖 3. The shoot's run time stays reasonable (say how many shots it added and the new run time; only Clean at 200%, not every look) — ui-kit/README.md
Check: the shoot runs the new shots; the list is in Notes.

## F145 🐞 Every screen holds up at 200% text
Done when: the shoot is 0 problems with every 200% shot from F144, and nothing changed at 100% (the 100% shots stay 0 problems; desktop + phone shots at 100% looked at for the screens touched).
- [ ] 🤖 1. Titles that can't fit shrink to fit, like MenuHeader's (Reconnecting "Reconnecti / ng…", the art Game over) — ui-kit/kit/blocks/online.tsx
- [ ] 🤖 2. The HUD at 200%: no overlaps, nothing past the screen edge ("Roll") — ui-kit/kit/blocks/hud.tsx
- [ ] 🤖 3. The front end at 200%: menu buttons' room, "Play" over the tagline, Continue's "Turn 7 · 5 min ago", room's 32 px "Play online" — ui-kit/kit/blocks/frontend.tsx
- [ ] 🤖 4. Toasts and tooltips at 200% don't sit on words — ui-kit/kit/blocks/dialogs.tsx
- [ ] 🤖 5. Whatever else F144's list holds; the shoot 0 problems; the touched screens looked at at 100% and 200% — ui-kit/kit/blocks/flow.tsx
Check: ui-kit tests; the shoot 0 problems; shots looked at.

Notes:
- From F141's word-by-word scan (sprint 38): Reconnecting's title, the art Game over screen, hud (11 overlaps) + huddock (2), "Roll" past the edge, menu buttons 1 px from their edge + "Play" over the tagline, continuemenu's line on its edge, feedback's tooltip + toast over words, room's "Play online" 32 px tall.
- No open P0/P1 bugs in this repo. Goops is running in another window: framework only.
