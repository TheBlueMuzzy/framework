# Sprint 38 — The kit meets every player
Started 2026-10-25 · Milestone v0.21 The kit meets every player · Features: F141, F142, F143
Muzzy 2026-10-25: "go auto" — running unattended. Claude plans, one helper per feature builds, Claude merges, reviews and saves; taste calls go to Notes as `Ask Muzzy:`.
What changes: big text wraps whole words; a gamepad player sees the focus ring from the first screen; a new What's new panel games can use. What stays the same: every look, every screen's layout, every game — a game only gets What's new when it adds it.

## F141 🐞 Big text never splits a word
Done when: at 200% text no kit word breaks mid-word (the ◀ option ▶ picker above all), the page check flags a mid-word break, and the shoot is 0 problems.
- [x] 🤖 1. Measure today first: shoot Settings on a phone at 200% text and list every mid-word break (and anything else the new shot finds) before fixing — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. uiProblems flags a word split across lines (a test for the picker case + one that a long single word in a narrow box may still wrap) — ui-kit/kit/uiProblems.mjs
- [ ] 🤖 3. The picker's value and sizer wrap whole words (kit.css overflow-wrap) and anything task 1 found; shoot 0 problems — ui-kit/kit/kit.css
Check: ui-kit tests; the shoot (0 problems, with the 200% Settings shot); that shot looked at.

## F142 🐞 A gamepad player sees where they are from the first screen
Done when: a game played only with a pad shows the focus ring on the first screen it opens after a pad press, the same as after a key press; mouse and touch players still see no ring.
- [ ] 🤖 1. A failing test first: a pad press (gamepadconnected / the d-pad's arrow key path) before any keydown → the next screen focuses with the ring — ui-kit/kit/ScreenStack.test.tsx
- [ ] 🤖 2. ScreenStack counts a pad as keyboard use; TalkingBubble and Teach use the same flag (they copy the focusVisible pattern) — ui-kit/kit/ScreenStack.tsx
- [ ] 🤖 3. README + CATALOG say how a game's own pad code tells the kit (if it needs to) — ui-kit/README.md
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
- F141 task 1 — measured before fixing (2026-10-25). New shot `screens/settings-clean-phone-text-200` (Settings, 390×844 phone, 200% text, on the Accessibility tab so the ◀ tab ▶ picker shows its longest word). Shoot: 640 shots, 2 problems, both on the new shot. Mid-word breaks found with a one-off word-by-word scan of every gallery screen at 200% on a phone:
  - Settings: "Accessibility" in the tab picker → "Accessibil / ity". Cause: the ◀ ▶ arrows are title-sized glyphs, so at 200% each is 67 px wide and the word (199 px) gets only 163 px. (The page check also said: "Accessibility" touches the edge of .kit-picker — 1 px.)
  - Settings (every tab): edge: "Back" ‹ touches its own button — 0 px. Cause: the header's ‹ is 1.4× title size (78 px at 200%) in a 51 px button.
  - Parts page (already in the shoot, `parts-phone-text-200`): "Lockdown" in the Carousel's label + caption row → "Lock / down" (`.kit-text` has overflow-wrap: anywhere, so a flex row squeezes a label below its word).
  - Not in the shoot at 200% (seen by the scan only): Art end screen "Game over" (both words split), Reconnecting "Reconnecting…".
  - Surprise, out of F141's scope (only seen by the scan, no shoot covers these at 200%): the HUD screens at 200% have many overlaps (hud: 11, e.g. "Muzzy" × "Hold to Roll"; huddock: 2), "Roll" past the screen edge, chips clipped; menu: kit buttons 1 px from their edge + "Play" × the tagline; continuemenu, feedback (tooltip/toast over words), room ("Play online" 32 px tall), artend overlaps. → Ask Muzzy / plan: a "200% text on every screen" sweep as its own feature.
- F141 task 2 — the rule chosen: a word broken across lines in the middle is flagged ("split:") only when it is no wider than the inside of the box it's drawn in (the nearest card, chip, button or panel — or the screen if none). Measured, not tried: the word's pieces added up vs that box. So the picker IS flagged (word 199 px, picker box 306 px — the arrows squeezed it), a word wider than its card is not. Breaks at a space, hyphen, dash, soft hyphen or slash are word ends. Both tests were proven to fail with the rule broken each way.
- Surprise: conformance.mjs (games' check:framework) only reports kinds listed in its KINDS table — a new kind there would have been silently dropped. Added "no word is broken in the middle" with its fix line.
