# Sprint 39 — Every screen holds up at 200% text
Started 2026-10-25 · Milestone v0.21 The kit meets every player · Features: F144, F145
Muzzy 2026-10-25: "go auto. i'm going to bed" — running unattended. Claude plans, one helper builds, Claude merges, reviews and saves; taste calls go to Notes as `Ask Muzzy:`. /deliver v0.21 waits for Muzzy.
What changes: the screenshot run looks at every screen with the biggest text setting, and the screens it finds broken get fixed. What stays the same: every screen at normal text size (the shoot proves it: the 100% shots stay 0 problems), every look, every game.

## F144 🔧 The shoot sees every screen at 200% text
Done when: npm run shoot takes every gallery screen at 200% text on an upright phone (390×844) and a sideways one (844×390), in the Clean look, and lists what it finds — before anything is fixed.
- [x] 🤖 1. Every gallery screen at 200% on both phones in the shoot (the parts / Settings 200% shots show how) — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Run it on today's code and list every problem by screen in Notes, before any fix (F141's scan list is the starting guess) — ui-kit/scripts/shoot.mjs
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
- F144 list (before fixes) — 2026-10-25, `SHOOT_PORT=6144 npm run shoot` on d870fa3: 745 shots in 695 s, **89 problems on 31 shots, every one a new 200% shot** (the 655 others, all at 100% + parts-phone-text-200: 0). The other 59 new shots: 0. Names: `screens/<id>-clean-phone-text-200` (390×844) / `…-clean-phone-landscape-text-200` (844×390).
  - Upright phone (390×844):
    - feedback: overlap "More info" × "Sam joined the room", "Tooltip" × "Sam joined the room", "Spinner" × "Connection lost"
    - menu: edge "Play", "Play online", "Settings", "How to play" 1 px from their button's edge; overlap "Play" × "A dice game for friends"
    - continuemenu: edge "Turn 7 · 5 min ago" 0 px in its button; overlap "Continue…" × "A dice game for friends"
    - hud (13): clipped "Roll" past the screen edge; overlaps "Muzzy" × "Hold to Roll" / "Up to 3 times", "42" × "Up to 3 times", "Sam" × "Up to 3 times" / "Hold to Roll", "37" × "Up to 3 times", "40%" × "Muzzy's turn" / "Hold to Roll", "2nd" × "Muzzy's turn" / "Hold to Roll", "/ 3" × "Muzzy's turn"; "Weak connection" covers part of "Muzzy's turn"
    - huddock: overlap "Pause" × "Cracks 0 / 10", "12000" × "Cracks 0 / 10"
    - chips: clipped "Player chips" at the edge of a box that hides overflow
    - artend: split "Game" + "over" broken mid-word; overlap "Try again" × "Game over", "Quit" × "Game over", "Quit" × "Out of lives on round 4."
    - room: small "Play online" 340×32 px
  - Sideways phone (844×390):
    - talk (11): the TalkingBubble can't stay clear of "◀ Wave ▶" / "◀ Style ▶" (kit warning); split "Wave"; "Next" overlaps "Style", "Previous Style", "Next Style", "Colours", "Previous Colours", "Next Colours", "Wave", "THE VETERAN · speaker"
    - feedback: overlap "Style" × "Sam joined the room"
    - menu: overlap "Quit" × "v0.1.0.12"
    - continuemenu: clipped "Credits" past the screen edge; overlap "How to play" × "v0.1.0.12", "Credits" × "v0.1.0.12"
    - hud (9): clipped "Roll" past the screen edge; edge "20" 0 px in .kit-timer, "Muzzy's turn" 0 px in .kit-screen; overlap "Roll" / "Muzzy" / "Sam" / "Ada" × "Muzzy's turn"; "Coins" and "Weak connection" cover part of "Round 1"
    - emotes: overlap "Muzzy — send an emote" × "View", "View" × "Muzzy"
    - pinned (8): 1 px edges — "Bot" in its badge; "Zippy", "Bot", "4 points", "Bolt", "8 points", "Pip", "12 points" in their rows
    - endgame + endgamedim (3 each): clipped "You win!"; overlap "Quit" / "Rematch" × "Muzzy takes it by 25 points."
    - room (3): clipped "Play online"; "Sherman Meredith" cut off + 0 px in its avatar chip
    - Title "clipped at the edge of a box that hides overflow", 1 each: modes "Choose a mode", howto "Roll the dice", credits "Credits", settings "Accessibility", chips "Player chips", results "Results", victory + victoryreveal "Victory!", payslip "Day 4 payslip", gameover "Game over", lobby + roomauto "Play online", seats "Seats". Looked at modes + results: the title itself reads whole; what really suffers is the body squeezed to a sliver under the huge title (modes' cards show only "Solo" / "Party" tops). So F145 likely fixes the layout, not just the title.
  - **Not reported but broken:** Reconnecting (upright) shows "Reconnecti / ng…" (looked at the shot) — the `split:` rule lets a word wider than its whole line wrap, so the shoot can't see it. F145 task 1 fixes it anyway; worth a check that catches a title wider than its box (Ask Muzzy / F145 to decide).
