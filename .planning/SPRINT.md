# Sprint 41 — The kit and saves work in iPhone's engine
Started 2026-10-25 · Milestone v0.23 Works on iPhone's browser · Features: F148, F149, F150
Muzzy 2026-10-25: "go auto" (option A — every iPhone browser is WebKit; the kit and saves were only ever checked in Chromium).
What changes: the screenshot run can also run in WebKit (iPhone's engine) and what it finds gets fixed; saves are proven in real Chromium, WebKit and Firefox. What stays the same: every Chromium result, every game, Goops (its own window — framework only).

## F148 🔧 The shoot runs in WebKit too
Done when: `npm run shoot:webkit` takes the 18 key screens in all 7 looks on an upright (390×844) and a sideways (844×390) phone at 100% and 200% text in Playwright's WebKit, and lists what it finds — before anything is fixed.
- [x] 🤖 1. A WebKit run of the key screens: 7 looks × 2 phones × 100% + 200% text, its own shots folder — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Run it on today's code and list every problem by look + screen in Notes, before any fix (look at a few shots beside Chromium's) — ui-kit/scripts/shoot.mjs
- [x] 🤖 3. Say what it costs (shots, minutes), how to run it, and what WebKit on Windows can't tell you about a real iPhone — ui-kit/README.md
Check: `npm run shoot:webkit` runs; the list is in Notes.

## F149 🐞 The kit holds up in WebKit
Done when: `npm run shoot:webkit` is 0 problems (or each left-over accepted in `knownShots` with Muzzy's word), and the Chromium shoot is unchanged (0 problems, 100% shots the same).
- [ ] 🤖 1. Sort F148's list by kit part and find each cause (WebKit vs Chromium: fonts, `lh` units, popover, scrollbars…) — ui-kit/kit/kit.css
- [ ] 🤖 2. Fix the kit's CSS for what WebKit draws differently — ui-kit/kit/kit.css
- [ ] 🤖 3. Fix the kit's parts that measure or place things (fit, bubbles, pickers) where WebKit differs — ui-kit/kit/blocks/blocks.css
- [ ] 🤖 4. Both shoots green: WebKit 0 problems, Chromium 0 problems and its 100% shots unchanged; touched screens looked at — ui-kit/scripts/shoot.mjs
- [ ] 🙋 5. Open the gallery on your iPhone (the phone link from the session) and look at Settings + the HUD at 200% text — say if anything looks off
Check: both shoots; shots looked at; Muzzy's phone look.

## F150 🔧 Saves work in every browser engine
Done when: a test runs the saves module in real Chromium, WebKit and Firefox (Playwright) — save, load, an upgrade step, a save code, a full disk — and all three pass; anything that differs is fixed or written down.
- [ ] 🤖 1. A real-browser test: the saves module on a page in Chromium, WebKit and Firefox — save, reload, load, upgrade, save code — saves/scripts/browsers.test.mjs
- [ ] 🤖 2. A full disk and a private window in each engine: what the module says and keeps — saves/kit/storage.ts
- [ ] 🤖 3. Fix what differs between engines (or write it down where nothing can fix it) — saves/kit/platform.ts
- [ ] 🤖 4. README: which engines are proven, how to run it, what's still only real-device — saves/README.md
Check: the browsers test green in all three engines; saves `npm test` green.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md). Goops runs in its own window: framework only.
- Unattended ("go auto", 2026-10-25 11:55 PM): one helper per feature (F148 then F149; F150 alongside — different files). Decisions go here; taste calls → `Ask Muzzy:`.
- Playwright's WebKit is already installed on this PC (ms-playwright/webkit-2359); Firefox needs `npx playwright install firefox` once.
- WebKit on Windows is the same engine as iPhone Safari but not the same fonts, scrolling or safe areas — a real phone look stays a 🙋 task.
- F148 decisions: `npm run shoot:webkit` = `node scripts/shoot.mjs --webkit` (an env var can't be set inline in a Windows
  npm script; `SHOOT_ENGINE=webkit` works too). Shots go to `ui-kit/screenshots-webkit/` (git-ignored) with the SAME
  names as Chromium's, so pairs open side by side. It also runs the screen-stack and menu checks on the phone (cheap,
  and Back/Esc are worth proving in iPhone's engine). knownShots apply to it too (Muzzy's accepted Talk shots).
  A screen that never shows in 30 s is now a listed "stalled" problem (+ `…-stalled.png`) instead of ending the run.
  The Chromium shoot is unchanged: 961 shots, 0 problems, 8 known (930 s) after the change.
- F148 checker in WebKit: works. Its 22 tests pass in WebKit (`UI_ENGINE=webkit npx vitest run kit/uiProblems.test.mjs`,
  new switch); `:popover-open`, `dialog:modal`, canvas `fontBoundingBox*`, colour-mix/oklch read through the canvas,
  `getAnimations` all answer the same as Chromium. Nothing in the checker needed fixing.
- **F148 list — WebKit on today's code (2026-10-26), before any fix.** `npm run shoot:webkit`: 504 shots in 669 s,
  **0 problems from the checker** (8 known: the accepted Talk shots), screen stack ✓, menu ✓. The real differences are
  ones the checker can't see, found by looking at pairs and by a layout compare of all 504 setups in both engines
  (each text's line count + each part's size: 7 wraps differ, 395 sizes differ, across 21 parts; lists kept in
  `~/Documents/dev/.scratch/framework-f148/layout-diff.txt` and `compare.txt`):
  - **A. Symbol characters come from another font (⚙ ❤ ▼ ▲)** — WebKit draws ⚙ and ❤ as colour emoji, and ▼ ▲ wider.
    The parts holding them take the glyph's size:
    - the ⚙ icon Button grows 44→55 px (61 at 200%): pause, chips, endgamedim, hud — all 7 looks, both phones, both
      text sizes (104 setups); it pushes the HUD's "Weak connection" row down
    - ❤ 18→25 px wide: the HUD/pause health chip, all looks (84 setups)
    - the ▼ ▲ stat chips ("Deducted", "Loss", "Gain", "Gained") 4–5 px wider: payslip + victoryreveal, every look →
      the row's words get 3–4 px less → one more line: victoryreveal-cozy (phone, landscape, landscape 200%) and
      victoryreveal-pixel-landscape ("Fine: uniform wear…" 3→4 lines)
    - Kit part: an icon Button / stat chip sized by its character's font box. On an iPhone it's Apple's emoji font —
      a different size again, so Windows can't say the iPhone number; the fix is a box that doesn't follow the glyph.
  - **B. `text-wrap: pretty` (kit.css .kit-text) wraps differently in WebKit** — Safari's "pretty" balances the whole
    paragraph; Chromium's only fixes a lonely last word. room-pixel-phone-landscape: "Share this code with your
    friends" 2→3 lines (2 with plain wrapping), "Waiting for everyone to be ready" wraps earlier; the card now
    scrolls (303 px in 286) and "I'M READY" sits on the card's bottom edge. Real Safari 26+ does the same; older iOS
    ignores `pretty` (plain wrapping).
  - **C. A label that fits by a hair** — menu-neon-phone-landscape: "HOW TO PLAY" is 113.77 px in WebKit, 113.36 in
    Chromium, in a 113.39 px button → 2 lines; that button and "Credits" beside it grow 44→68 px tall.
    victoryreveal-pixel-phone-landscape: "Debt to the company" 1→2 lines (row 171.4→170.5 px, partly A).
  - **D. WebKit-on-Windows only — not the kit, not an iPhone problem:** variable fonts (Nunito, Fredoka, Exo 2,
    Orbitron, Cinzel, Alegreya) are laid out at the right weight but DRAWN at their thin default, so bold looks thin
    in every shot except Pixel's and Lilita's text. Widths match Chromium exactly (checked), so layout is still right.
    This is most of the 5–20 % pixel difference between pairs.
  - **E. Shot timing (the shoot, both engines):** payslip + victoryreveal's reveal scrolls its list smoothly and the
    shot catches it mid-way (WebKit at 79/96 and 111/212 px, Chromium 83/96 and 142/212) — the last row sits in the
    scroll fade. Not a kit bug; F149 can make the shoot wait for the scroll to stop.
  - **F. One stall:** the first full run stopped at emotes-cozy-phone-landscape-text-200 (screen never showed in 30 s).
    5/5 alone and the whole second run were fine — now it would be listed as "stalled", not end the run.
  - Seen in BOTH engines, not flagged by the checker (not WebKit): "1ST" touches the avatar's ring on results/endgame
    (results-neon-phone-landscape-text-200, endgame-pixel-phone-text-200) — a breathing-room gap for F149 to look at.
  - Shots looked at side by side: chips-cartoon-phone-text-200, hud-pixel-phone-landscape-text-200,
    victoryreveal-pixel-phone, payslip-pixel-phone, menu-neon-phone-landscape, room-pixel-phone-landscape,
    results-neon-phone-landscape-text-200, endgame-pixel-phone-text-200; WebKit alone: settings-cozy-phone-text-200,
    menu-fantasy-phone, lobby-cartoon-phone-landscape-text-200.
- Ask Muzzy: the gallery's ⚙ ❤ ▼ ▲ are typed characters, so every phone draws its own (Windows a colour gear, iPhone
  Apple's emoji). Should the kit carry its own drawn icons for these, so every phone shows the same picture? (F149 can
  make the boxes stop growing either way.)
