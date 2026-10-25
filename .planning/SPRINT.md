# Sprint 40 — Every look holds up at 200% text
Started 2026-10-25 · Milestone v0.22 Big text in every look · Features: F146, F147
Muzzy 2026-10-25: "sure" (the Cozy/Pixel big-text bug next), then /develop.
What changes: the screenshot run checks the key screens at 200% text in all 7 looks, and the screens it finds broken get fixed. What stays the same: every screen at normal text size, the Clean look (F144/F145 already cover it), every game.

## F146 🔧 The shoot sees the key screens at 200% text in every look
Done when: npm run shoot takes the 18 key screens at 200% text in the 6 other looks on an upright phone (390×844) and a sideways one (844×390), and lists what it finds — before anything is fixed.
- [x] 🤖 1. The key screens at 200% in every other look on both phones — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Run it on today's code and list every problem by look + screen in Notes, before any fix — ui-kit/scripts/shoot.mjs
- [x] 🤖 3. Say what it costs (shots added, new run time) in the README; if too slow, only the 5 in-game screens — ui-kit/README.md
Check: the shoot runs the new shots; the list is in Notes.
Checked: 2026-10-25 5:45 PM (Claude) — `SHOOT_PORT=6150 npm run shoot` on e216777: 961 screenshots in 918 s (+216 shots, +221 s), **exit 1 with 60 problems — expected for F146**: all on the new 200% shots in the other looks (plus one Vite live-reload flake on a 100% shot); the list (A–I) is in Notes. No kit/ or gallery/ code changed.

## F147 🐞 Every look holds up at 200% text
Done when: the shoot is 0 problems with every 200% shot from F146, and nothing changed at 100% (the 100% shots stay 0 problems).
- [ ] 🤖 1. HUD sideways (F): "Hold to Roll" off the seats and Roll — Cozy, Pixel — ui-kit/kit/blocks/blocks.css
- [ ] 🤖 2. Button words off their edges (A, B): the ‹ Back and Pause's buttons at 200% in a wider font — ui-kit/kit/kit.css
- [ ] 🤖 3. Words never break mid-word when they fit (C, D): pickers ("Accessibility", "Wave"), cards ("Room", "QX2T", "Zippy") — ui-kit/kit/kit.css
- [ ] 🤖 4. A title wider than its box drops a size (E): seats "progress" — Neon, Pixel — ui-kit/kit/blocks/MenuHeader.tsx
- [ ] 🤖 5. Bubbles at 200% (G, H): the emotes SpeechBubble (Cozy) and the TalkingBubble past the screen's edge upright (Pixel) — ui-kit/kit/blocks/talkingBubble.tsx
- [ ] 🤖 6. The shoot 0 problems (talk sideways per Muzzy's answer); the 100% shots unchanged; the touched screens looked at — ui-kit/scripts/shoot.mjs
Check: ui-kit tests; the shoot 0 problems; shots looked at.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md). Goops runs in its own window: framework only.
- F146 list (before fixes) — 2026-10-25 5:40 PM, `SHOOT_PORT=6150 npm run shoot` on e216777: **961 shots in 918 s** (was 745 in 697 s: +216 shots = 18 key screens × 6 looks × 2 phones, +221 s). **60 problems on 41 shots** — all on new 200% shots except one flake (I). Clean: 0 (+ talk sideways known). Console: only talk sideways. Names: `screens/<id>-<look>-phone[-landscape]-text-200`.
  - A. Back button words 1 px from its edge — Cozy, Fantasy, Pixel: settings, lobby, payslip, both phones (13 shots). The MenuHeader ‹ Back at 200% in a wider font.
  - B. Pause sideways: "Settings", "How to play" 0–1 px from their button's edge — Cozy, Fantasy.
  - C. A picker's word broken mid-word though it fits: "Accessibility" (settings upright: Cartoon, Cozy, Neon, Pixel); "Wave" / "Style" (talk sideways: Cartoon, Console, Cozy, Neon, Pixel).
  - D. A card's words broken mid-word though they fit: room "Room" + "QX2T" (Cozy, Neon, Pixel upright); results "Sam", endgame + endgamedim "Zippy" (Fantasy upright).
  - E. A title word wider than its box: seats "progress" (Neon, Pixel upright) — the title doesn't drop a size.
  - F. HUD sideways: "Hold to Roll" × "Roll" / the seats — Cozy ("Roll", "Ada") and Pixel ("Roll", M, S, A chips). The bug that started this sprint.
  - G. Emotes upright (Cozy): the SpeechBubble can't stay clear of "Well played!" (kit warning).
  - H. Talk: the TalkingBubble covers the demo's pickers sideways in every look (Muzzy accepted it for Clean, 2026-10-25) — and in Pixel upright too.
  - I. Flake: endgame-console-desktop (a 100% shot) logged Vite's WebSocket refused once — the dev server's live-reload link, not the screen.
