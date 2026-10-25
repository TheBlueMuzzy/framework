# Sprint 40 — Every look holds up at 200% text
Started 2026-10-25 · Milestone v0.22 Big text in every look · Features: F146, F147
Muzzy 2026-10-25: "sure" (the Cozy/Pixel big-text bug next), then /develop.
What changes: the screenshot run checks the key screens at 200% text in all 7 looks, and the screens it finds broken get fixed. What stays the same: every screen at normal text size, the Clean look (F144/F145 already cover it), every game.

## F146 🔧 The shoot sees the key screens at 200% text in every look
Done when: npm run shoot takes the 18 key screens at 200% text in the 6 other looks on an upright phone (390×844) and a sideways one (844×390), and lists what it finds — before anything is fixed.
- [x] 🤖 1. The key screens at 200% in every other look on both phones — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. Run it on today's code and list every problem by look + screen in Notes, before any fix — ui-kit/scripts/shoot.mjs
- [ ] 🤖 3. Say what it costs (shots added, new run time) in the README; if too slow, only the 5 in-game screens — ui-kit/README.md
Check: the shoot runs the new shots; the list is in Notes.

## F147 🐞 Every look holds up at 200% text
Done when: the shoot is 0 problems with every 200% shot from F146, and nothing changed at 100% (the 100% shots stay 0 problems).
- [ ] 🤖 1. Cozy + Pixel HUD sideways at 200%: "Hold to Roll" off the seats row — ui-kit/kit/blocks/blocks.css
- [ ] 🤖 2. Whatever else F146's list holds, fixed in the kit (not hidden in the gallery) — ui-kit/kit/blocks/hud.tsx
- [ ] 🤖 3. The shoot 0 problems; the touched screens looked at at 100% and 200% — ui-kit/gallery/Screens.tsx
Check: ui-kit tests; the shoot 0 problems; shots looked at.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md). Goops runs in its own window: framework only.
