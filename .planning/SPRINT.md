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
Done when: F148's differences A–C are fixed in the kit (a part's size no longer follows a symbol's font, no card's last button sits on its edge, no label wraps by a hair), a compare of both engines' layouts lists no wrap that differs (or each is accepted with a reason), and the Chromium shoot is unchanged (0 problems, 100% shots the same).
(Re-planned 2026-10-26 1:05 AM by Claude after F148: the checker sees 0 problems in WebKit — every real difference is a wrap or a size it doesn't measure, so "WebKit 0 problems" was already true and proved nothing.)
- [x] 🤖 1. A: the ⚙ icon Button and the ❤ / ▼ ▲ chips keep their box whatever font draws the symbol (WebKit's colour emoji, an iPhone's Apple emoji) — ui-kit/kit/kit.css
- [x] 🤖 2. B: `text-wrap: pretty` wraps more in WebKit (Safari 26 too) — the room card's "I'M READY" sits on its bottom edge sideways in Pixel: the card keeps room for its last button however its words wrap — ui-kit/kit/kit.css
- [x] 🤖 3. C: a label that fits by a fraction of a pixel ("HOW TO PLAY" in Neon sideways, "Debt to the company") wraps in WebKit — give labels the room to not depend on the engine's rounding — ui-kit/kit/blocks/blocks.css
- [x] 🤖 4. The engines compare as a script: both runs' layouts (each text's line count + each part's size) side by side, listing what wraps differently — so the next WebKit difference is found by the run, not by eye — ui-kit/scripts/compareEngines.mjs
- [x] 🤖 5. Both runs and the compare: Chromium 0 problems and its 100% shots unchanged; WebKit 0 problems; the compare lists no wrap difference left (or each accepted in Notes); touched screens looked at — ui-kit/scripts/shoot.mjs
- [x] 🙋 6. Open the gallery on your iPhone (the phone link from the session) and look at Settings + the HUD + Pause at 200% text — say if anything looks off (the ⚙ button especially) — Muzzy approved F149 2026-10-26 without the phone look ("all approved")
- [x] 🤖 7. (Muzzy's pick, 2026-10-26) A soft fade above a scrolling card's stuck button row, so a cut line reads as "scroll" (UI kit 0.35.7) — ui-kit/kit/kit.css
Check: both runs + the compare; shots looked at; Muzzy's phone look.

## F150 🔧 Saves work in every browser engine
Done when: a test runs the saves module in real Chromium, WebKit and Firefox (Playwright) — save, load, an upgrade step, a save code, a full disk — and all three pass; anything that differs is fixed or written down.
- [x] 🤖 1. A real-browser test: the saves module on a page in Chromium, WebKit and Firefox — save, reload, load, upgrade, save code — saves/scripts/browsers.test.mjs
- [x] 🤖 2. A full disk and a private window in each engine: what the module says and keeps — saves/kit/storage.ts
- [x] 🤖 3. Fix what differs between engines (or write it down where nothing can fix it) — saves/kit/platform.ts
- [x] 🤖 4. README: which engines are proven, how to run it, what's still only real-device — saves/README.md
Check: the browsers test green in all three engines; saves `npm test` green.

Notes:
- No open P0/P1 bugs in this repo (no BUGS.md). Goops runs in its own window: framework only.
- Unattended ("go auto", 2026-10-25 11:55 PM): one helper per feature (F148 then F149; F150 alongside — different files). Decisions go here; taste calls → `Ask Muzzy:`.
- Playwright's WebKit is already installed on this PC (ms-playwright/webkit-2359); Firefox needs `npx playwright install firefox` once.
- WebKit on Windows is the same engine as iPhone Safari but not the same fonts, scrolling or safe areas — a real phone look stays a 🙋 task.
- F150 (helper, 2026-10-26): the browsers test runs inside saves' `npm test` (all three engines ≈ 9 s, under the 60 s bar) — no separate script, so check:fast and GitHub run it as they are. The kit is bundled in memory by Vite and Playwright answers http://localhost:6171/ itself (route): no server, no port actually opened, no files written. Firefox 155 installed on this PC (ms-playwright/firefox-1543); saves now pins playwright 1.63.0 (same as ui-kit, same browser builds).
- F150: GitHub installs each module's engines from package.json `"testBrowsers"` (saves: "chromium webkit firefox"; others default to Chromium) — checks.yml. On a machine missing an engine the test SKIPS it with a loud ⚠ line (so installing saves into a game on the laptop isn't blocked); on GitHub (CI) a missing engine fails.
- F150 full disk — a REAL full storage, not a pretend one (filled to the last character with another game's keys): all three engines stop at 5 MiB (5,242,880 characters, key names included) and throw the same DOMException `QuotaExceededError`, code 22. Same "full" result and the same plain words in all three; the last good save stays; dropping old backups makes room in all three (removing a key frees its space at once everywhere).
- F150 found + fixed (storage.ts): "quota exceeded" on an EMPTY storage — what Safari's private window threw on every write up to Safari 10 — was told to the player as "storage is full". Now it's "blocked" ("This browser won't let the game save (a private window…)"). Storages that can't say how many keys they hold (pretend ones, a phone app's) keep "full". A save over 5 MB on an empty storage would also read "blocked" — no real save is near that.
- F150 private window: Playwright's fresh context keeps nothing after it closes (proven: the next one starts empty). Only WebKit's looks private to the health check (it refuses the private file storage, as Safari's private window does) → "looks like a private window". Chromium's and Firefox's test contexts aren't real Incognito / Private Browsing (full-size quota, file storage works), so the "private" guess can't be proven there — real-device only.
- F150 what differs between engines today: nothing in what the module does or says — save, reload, browser restart, backup fallback, upgrade, newer-save guard, save codes (packed by each browser's own CompressionStream; codes cross between the page and Node both ways), full disk, blocked storage (SecurityError, Chrome's "block all cookies" where even looking at localStorage throws), openSaves writing a waiting change on pagehide — all identical. The health check differs on purpose: WebKit adds Safari's 7-day warning; Chromium and Firefox say "not kept" (persist not granted).
- F150 fixed (platform.ts): openSaves knew "full" only by today's name (QuotaExceededError); an older Firefox's NS_ERROR_DOM_QUOTA_REACHED or an error with only code 22 read as "blocked". It now uses the same isFullError as the browser's storage (Node test for both).
- F150 done: saves kit 0.6.4 (README → "Proven in which browsers": the table, how to run it, what's still real-device only). Check: browsers test 27/27 (9 checks × 3 engines); saves `npm test` 17 files / 276 tests green; `npm run check:fast` ✓ all 20 checks passed (2026-10-26). CHANGELOG line left for /deliver.
- Merged 2026-10-26 12:25 AM (Claude): F150 read whole — no bugs (the empty-storage "blocked" rule, isFullError shared, switchedStorage's length, testBrowsers in checks.yml). check:fast failed twice in the main checkout: the test's cleanup hit EPERM deleting Chromium's profile folder (Windows holds it after close under load, even with 2 s of retries) — the 27 checks themselves passed. Cleanup is now best-effort with a warning line; check:fast 3 runs ✓.
- 2026-10-26 12:35 AM (Claude): GitHub red on 2cf42f1 — Chromium's private-window guess said "private" on GitHub's small Linux disk (it compares the room it gets with its memory limit) and "not kept" here. Both are fine for a window that keeps nothing → the test accepts either for Chromium; README row says so. 27/27 here.
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
- (F148's "drawn icons?" question → updated in F149's notes below.)
- Merged 2026-10-26 1:05 AM (Claude): F148 read whole — no bugs (one script, an engine switch; a stalled screen is a listed problem with a picture, not the end of the run). F149 re-planned from its A–C list (above). "1ST touches the avatar ring" (both engines) → ROADMAP Ideas.
- **F149 (helper, 2026-10-26) — kit 0.35.5.** Before any fix, the new compare on today's code: 455 shared shots,
  4 wraps differ (menu-neon sideways "How to play", room-pixel sideways "Share this code…", 2 victoryreveal-cozy
  rows), 832 part sizes differ. After: **0 open wraps (1 accepted, below)**.
  - A — cause: the 0.34.1 icon cap held the glyph's font SIZE, but the button was `aspect-ratio: 1` + min 44 px, so it
    took the glyph's WIDTH; an emoji is ~1.37 em wide (a text symbol 0.85), so 44 → 55–61. Fix: an icon Button is
    exactly `max(target-min, size)` square; Button wraps a typed symbol in `.kit-button-glyph` and measures it
    (`useGlyphFit` / `fitGlyph` → `--kit-glyph-em`), and the CSS caps the font at (box − borders) ÷ (em + 0.3) — text
    symbols already fit, so they keep their size. Bar / Counter string icons: a 1.375 em box (`.kit-hud-icon[data-symbol]`).
    StatList ▼ / ▲: `.kit-tone-mark` max 0.875 em (a fixed width widened Pixel's own narrow ▼ by 6 px in Chromium and
    wrapped a victoryreveal row — so a cap, not a size).
  - Tested: U+FE0E (text look) and `font-variant-emoji: text` — WebKit on Windows ignores both (its only ⚙ / ❤ is
    Segoe UI Emoji), and Playwright's WebKit 26.6 doesn't know `font-variant-emoji`. The gallery's ⚙ carries U+FE0E
    anyway (gallery/symbols.ts) for a real iPhone; README tells games the same.
  - B — cause: Safari's `text-wrap: pretty` evens out the whole paragraph and can take a line more (Chromium's only moves
    a last lonely word); no CSS value asks for "orphans only" in either engine (`avoid-orphans` unsupported in both). The
    Lobby room sideways had 6 px to spare in Chromium, so 17 px over in WebKit. Fix (kit.css): a centre card that has to
    scroll keeps its last row of buttons (a row of buttons only) sticky at its bottom with its padding below, painted in
    `--surface` by a scroll-driven animation that only runs while the card can scroll (`@supports animation-timeline`;
    older browsers unchanged). Accepted wrap (compareEngines `acceptedWraps`): room-pixel sideways "Share this code…" 2 → 3
    lines — the kit can't choose how an engine balances a paragraph; the buttons now stay in sight.
  - C — cause: the main menu's 2-column sideways buttons are half the column, "HOW TO PLAY" (Neon, uppercase Exo 2) was
    113.36 px in a 113.39 px content box (WebKit 113.77). Fix (blocks.css): those buttons keep gap-m each side (like
    `compact`) — same button size. "Debt to the company" (Pixel victoryreveal) was A's ▼ tag, gone with A.
  - Shoot (F148 E): a reveal's shot now waits until its list's smooth scroll has stopped. `SHOOT_ONLY=<pattern>` added
    for quick runs. Layout files: `<shots>/layout/<shot>.json`; Chromium run 931 s before → ~939 s after (same).
  - **Chromium changes at 100% text (all the fix itself):** the HUD's ❤ chip is ~7 px wider (1.375 em icon box), its
    Health bar that much shorter (hud, all looks/sizes); Fantasy's payslip / victoryreveal ▼ tags 2 px narrower (Cinzel's
    ▼ is wider than the 0.875 em cap); the Lobby room on the small phone sideways (667×375, Cozy + Pixel) already
    scrolled in Chromium — its Leave / I'm ready now sit whole above the card's padding instead of on its edge. At 200%:
    "How to play" / "Play online" on one line in 4 looks' main menu sideways (were 2); Pixel's ⚙ / ❚❚ buttons 45–46 →
    44 px. Other pixel differences between the before / after runs are animation timing (the talk bubble's wave, alert
    pulses, spinners, typewriter) — no layout change there (compared by layout, not only by picture).
  - The sticky foot first caught Teach's last row ("Tips" + a picker) on Clean sideways at 200% — the painted row read
    as a box "Tips" touched (the shoot's 1 problem): now only a row made of buttons alone sticks.
  - **Final runs (2026-10-26 ~2:30 AM, last code):** Chromium `npm run shoot` 961 shots in 934 s, **0 problems** (8
    known). `npm run shoot:webkit` 504 shots in 667 s — 1 "stalled" (endgamedim-clean-phone-landscape-text-200, F148's
    F flake, while check:fast loaded the PC); re-shot alone: 14/14 ✓, **0 problems**. `npm run compare:engines`: 455
    shots, ✓ no wrap differs (1 accepted), 194 sizes differ by > 1 px — the symbols inside their fixed boxes (56), Pixel's
    ▼ tag 1.8 px wider in WebKit (under its cap; no wrap from it), Player chips' list 1–2 px at 200%. Chromium layout
    before → after: only the changes named above. `npm run check:fast` ✓ all 20 checks passed.
- Answered (Muzzy 2026-10-26: keep 1.375 em): the HUD's typed icons (❤ 🪙) now sit in a fixed 1.375 em box — on Windows' Chrome the text ❤ gets a little
  room each side and the Health bar is ~7 px shorter; on an iPhone the box is what Apple's emoji needs. OK, or a tighter
  box (1.25 em: the coin emoji shrinks a touch)?
- Answered (Muzzy 2026-10-26: keep the typed characters for now; drawn icons not needed) (F148's): ⚙ ❤ ▼ ▲ are typed characters, so every phone draws its own picture (Windows WebKit a
  lilac 3D gear, an iPhone Apple's gear, Chrome on Windows a black outline gear). Since 0.35.5 the boxes no longer grow
  either way and a too-wide emoji is drawn smaller. Should the kit still carry its own drawn icons (gear, heart, ▼ ▲)
  so every phone shows the SAME picture? It's a look choice now, not a layout bug.
- Merged 2026-10-26 2:20 AM (Claude): F149 read whole — no bugs (glyph fit + its rAF refit, the HUD symbol box, the ▼ ▲ cap, the menu's gap-m, the sticky card foot). Probed the foot with reduce motion on (the kit sets animation-duration 0s): still painted in Chromium and WebKit. check:fast 20/20 (after the gallery's own vite held ui-kit's node_modules: TaskStop on `cd … && npx vite` left vite running — stopped with stop-servers.mjs 5180, reinstalled, restarted). GitHub red (run 40279344615, Linux only): iconFit room 1 px < 1.5 (Linux's emoji font), nameFit Lobby 844×335 Clean — the card scrolls there, the sticky foot sits over scrolling words and the page check calls it an overlap → back to the F149 helper: the page check learns sticky rows; the icon room fixed at its root.
- F149 fix after GitHub red (run 40279344615, Linux; kit 0.35.6): (1) iconFit — not emoji at all (the test's symbols are
  kit-font "+" / "WWW"): fitGlyph measured the symbol's width-per-size once, at its old size; text drawn on Linux snaps
  to whole pixels, so once drawn smaller it came out ~1 px wider than its share → 1 px of room. Now fitGlyph measures
  again at the size it just gave until it holds (≤ 4 rounds; only a clearly narrower symbol, 5 %, lowers it — no
  frame-to-frame flipping), and the side room is at least 0.125rem. New test: a symbol with 6 px that don't shrink
  (a stand-in for the rounding) — failed with one round (0.09–0.3 px of room), passes now. (2) nameFit 844×335 — Linux's
  wider fonts made the Lobby card scroll, so the sticky button row sat over the waiting line, which the page check
  called an overlap. uiProblems now skips a sticky row over words that a scroll of the same box moves out from under
  it (tried at both ends, put back), in both overlap checks; a sticky row over words no scroll uncovers still counts
  (tests in uiProblems.test.mjs, Chromium + WebKit). Reproduced here at 844×260 (fails in 4 looks without the rule) —
  kept as a nameFit case. ui-kit tests 833 ✓; check:fast ✓ all 20; Chromium SHOOT_ONLY of hud/huddock/chips/pause/
  settings/room/roomauto/payslip/teach/menu: 373 shots, 0 problems, layout vs 0.35.5: no wrap, 0 sizes > 1 px.
- 2026-10-26 2:50 AM (Claude): F149 fix merged (UI kit 0.35.6: the page check knows a sticky row over words its card can scroll away; the icon fit re-measures until it holds) — read whole, no bugs. GitHub green (run 40280979311); check:fast 20/20. Lesson → hook: guard-edits rule 9 refuses npm ci / install while a running process uses that folder's node_modules (I broke ui-kit's packages twice tonight against the gallery on 5180) — HOOKS.md row 31, 5 tests, live-checked against the gallery.
- Answered (Muzzy 2026-10-26: as built + the soft fade — task 7, UI kit 0.35.7) (Claude, 2:55 AM): the room card on a phone on its side in Pixel (WebKit) — "Waiting for everyone / to be ready" shows its last line half cut where it scrolls under the stuck LEAVE / I'M READY row (~/Documents/dev/.scratch/framework-f149-show/room-pixel-sideways-webkit.png). My pick: as built, plus a soft fade above the row so a cut line reads as "scroll" (the kit's lists already use one). Other: no sticky row (the old cut-off button), or a smaller text size there.

Retro: (Muzzy 2026-10-26: "retro ok" on Claude's draft)
- Went well: the overnight run found real differences in iPhone's engine (emoji sizes, line wrapping) and fixed them in the kit.
- Went wrong: two tests that passed on the PC failed on GitHub's Linux (text rounded to whole pixels) — the fix went back to a helper at 2 AM.
- Change: run the tests that measure text in pixels the way Linux would before merging, not only after GitHub does.
