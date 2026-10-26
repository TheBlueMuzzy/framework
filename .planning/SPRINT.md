# Sprint 41 — The kit and saves work in iPhone's engine
Started 2026-10-25 · Milestone v0.23 Works on iPhone's browser · Features: F148, F149, F150
Muzzy 2026-10-25: "go auto" (option A — every iPhone browser is WebKit; the kit and saves were only ever checked in Chromium).
What changes: the screenshot run can also run in WebKit (iPhone's engine) and what it finds gets fixed; saves are proven in real Chromium, WebKit and Firefox. What stays the same: every Chromium result, every game, Goops (its own window — framework only).

## F148 🔧 The shoot runs in WebKit too
Done when: `npm run shoot:webkit` takes the 18 key screens in all 7 looks on an upright (390×844) and a sideways (844×390) phone at 100% and 200% text in Playwright's WebKit, and lists what it finds — before anything is fixed.
- [ ] 🤖 1. A WebKit run of the key screens: 7 looks × 2 phones × 100% + 200% text, its own shots folder — ui-kit/scripts/shoot.mjs
- [ ] 🤖 2. Run it on today's code and list every problem by look + screen in Notes, before any fix (look at a few shots beside Chromium's) — ui-kit/scripts/shoot.mjs
- [ ] 🤖 3. Say what it costs (shots, minutes), how to run it, and what WebKit on Windows can't tell you about a real iPhone — ui-kit/README.md
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
