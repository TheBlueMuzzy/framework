# Sprint 38 — The kit meets every player
Started 2026-10-25 · Milestone v0.21 The kit meets every player · Features: F141, F142, F143
Muzzy 2026-10-25: "go auto" — running unattended. Claude plans, one helper per feature builds, Claude merges, reviews and saves; taste calls go to Notes as `Ask Muzzy:`.
What changes: big text wraps whole words; a gamepad player sees the focus ring from the first screen; a new What's new panel games can use. What stays the same: every look, every screen's layout, every game — a game only gets What's new when it adds it.

## F141 🐞 Big text never splits a word
Done when: at 200% text no kit word breaks mid-word (the ◀ option ▶ picker above all), the page check flags a mid-word break, and the shoot is 0 problems.
- [ ] 🤖 1. Measure today first: shoot Settings on a phone at 200% text and list every mid-word break (and anything else the new shot finds) before fixing — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. uiProblems flags a word split across lines (a test for the picker case + one that a long single word in a narrow box may still wrap) — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 3. The picker's value and sizer wrap whole words (kit.css overflow-wrap) and anything task 1 found; shoot 0 problems — ui-kit/kit/kit.css
Check: ui-kit tests; the shoot (0 problems, with the 200% Settings shot); that shot looked at.

## F142 🐞 A gamepad player sees where they are from the first screen
Done when: a game played only with a pad shows the focus ring on the first screen it opens after a pad press, the same as after a key press; mouse and touch players still see no ring.
- [x] 🤖 1. A failing test first: a pad press (gamepadconnected / the d-pad's arrow key path) before any keydown → the next screen focuses with the ring — ui-kit/kit/ScreenStack.test.tsx
- [x] 🤖 2. ScreenStack counts a pad as keyboard use; TalkingBubble and Teach use the same flag (they copy the focusVisible pattern) — ui-kit/kit/ScreenStack.tsx
- [x] 🤖 3. README + CATALOG say how a game's own pad code tells the kit (if it needs to) — ui-kit/README.md
Check: ui-kit tests; the gallery with a fake pad event shows the ring, with a mouse click it doesn't.

## F143 ✨ What's new after an update
Done when: a game can show a What's new panel that appears once on the first launch after its version changes (not on a first install, not for a build-only bump, not mid-game), with 3–5 highlight lines, an optional full-notes link and one tap to close; tested, in the gallery, the shoot clean.
- [ ] 🤖 1. Design note first: where the highlight lines live (a content file the game edits), where "last version seen" is stored (and the saves module's storage consent), the rules (once · never first install · skip build-only · the game says when it's safe to show) — .planning/design/ui-kit.md
- [ ] 🤖 2. The "should it show?" logic + the last-seen record, with tests for every rule — version/kit/index.ts
- [ ] 🤖 3. The WhatsNew panel (kit parts only: a Modal, the lines, a link, one close button) + a gallery screen — ui-kit/kit/blocks/dialogs.tsx
- [ ] 🤖 4. The shoot covers it at every size; 0 problems; desktop + phone shots looked at — ui-kit/scripts/shoot.mjs
- [ ] 🤖 5. CATALOG + README + the game-ui skill name it; versions bumped (UI kit, version) — ui-kit/CATALOG.md
Check: version + ui-kit tests; the shoot; the shots looked at.

Notes:
- Ideas checked against the code before planning (Explore helper, 2026-10-25): already done — toasts under the gallery bar (UI kit 0.33.0, blocks.css:350), MainMenu counts extra buttons (0.24.0, frontend.tsx:46), HUB machine to-do at session start (F80, session-start.sh:25). Still open, left in Later: a guard for a second dev server / wrangler without --persist-to.
- No open P0/P1 bugs in this repo.
- Goops is running in another window: no game is touched this sprint (framework only).
- F142: the flag is ui-kit/kit/keysOrPad.ts (ScreenStack, TalkingBubble and Teach all ask focusRing()). It follows the LATEST input (a key or gamepadconnected → ring, a pointerdown → quiet), not "a key was ever pressed": the old once-only flag passed `undefined` and let the browser pick, which after a click says no ring — a pad player who clicked the page first would never see one. Now the kit passes focusVisible true/false itself.
- F142 surprise: TalkingBubble and Teach used focusVisible: false ALWAYS — even keyboard players got no ring on a bubble / pause button. They now ring for keys and pads too.
- F142: gamepadconnected only fires after a button press (or stick move) in Chrome and Firefox (pads stay hidden from a page until pressed — anti-fingerprinting), so "connected" = "pressed". It fires once, though: after a click, only the game's own pad code calling markPadUsed() brings the ring back.
