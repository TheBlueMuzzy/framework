# Sprint 01 — Every part and control in all 5 styles, with a live style switcher
Started 2026-09-28 · Milestone v0.1 · Features: F01, F02, F03 (in this order)
Branch: dev/v0-1-ui-kit

## F01 🧱 Parts + style engine
Done when: the gallery shows every layout box and control, built only from style names; changing `style.json` (preset or a tweak) restyles everything live; the rule checker passes; phone + desktop screenshots look right.
- [x] 🤖 1. Set up `ui-kit/` (Vite + React + TS + vitest) with `kit/` (the copyable part) and `gallery/` (the app); spike: native `<dialog>` + popover support on phone Safari/Chrome → pick what's native vs hand-made
- [x] 🤖 2. Style engine: `kit/style/tokens.ts` (the setting names), `kit/style/applyStyle.ts` (preset + tweaks → CSS variables on `<html>`), `kit/kit.css` (`@layer kit-base`: layout only, zero colours) + accessibility floor (18px text min, 44px targets, focus ring, 200% text scale, reduce motion)
- [x] 🤖 3. Layout boxes `kit/layout.tsx`: Screen (safe-area slots: top-left, top, top-right, center, bottom…), Panel, Stack, Row, Grid — spacing only via `gap`
- [x] 🤖 4. Controls `kit/controls/`: Button (primary/secondary/ghost/danger/icon/loading), Toggle, Slider, Selector ◀▶, Tabs, Stepper, TextInput + RoomCodeInput, ListRow, Card, Badge, Avatar, ProgressBar, ScrollArea, Text roles — states as `data-*` attributes only
- [x] 🤖 5. Rule checker `scripts/check-ui.mjs`: no hex colours, px sizes, `position:absolute` (outside Screen slots), inline styles or stray fonts in `kit/` or game UI code + test
- [x] 🤖 6. Parts page in the gallery; Playwright screenshots at 390×844, 844×390, 1440×900 (`scripts/shoot.mjs`)
Check: `npm test` + `npm run build` + `npm run check-ui` pass; screenshots show no overflow/clipping, targets ≥ 44px.

## F02 🎮 The 5 styles (Clean, Cozy, Cartoon, Pixel, Neon)
Done when: the gallery's style switcher flips between all 5 and each reads as its family (design §3); every preset passes the same-names + contrast test.
- [x] 🤖 7. `kit/styles/clean.json` + preset test (identical keys, 4.5:1 contrast on every colour pair)
- [x] 🤖 8. `cozy.json`, `cartoon.json`, `pixel.json`, `neon.json` — Google Fonts (OFL, 🟢) logged in `content/credits.json`; motion flavour per style
- [x] 🙋 11. Look at the 5 styles on the parts page, phone + desktop (`/play`), and say what feels off (tuning)
Check: preset test passes; screenshots of every style at phone + desktop.

## F03 🧱 Screen stack + transitions
Done when: screens open/close/replace; only the top screen responds; Esc / phone back closes it; a dialog is a screen on top; transitions follow the style's motion and respect reduce-motion.
- [x] 🤖 9. `kit/screens.ts`: tiny built-in store (no library) — push / pop / replace, `inert` below the top, Esc + browser back → pop + tests
- [x] 🤖 10. Transitions (fade/slide from motion settings, reduce-motion) + a gallery demo (open a panel, a dialog on top, back out)
Check: tests pass; Playwright: open → dialog → Esc → Esc returns to start, lower screen can't be clicked while covered.

Ask Muzzy: —
Notes:
- 2026-09-28 — Muzzy: all 5 styles "good enough, solid overall" → F01 + F02 approved, no tuning asked.
- Spike (task 1, `ui-kit/spike/dialog-popover-spike.mjs`): native `<dialog>` showModal (backdrop blocks the page, Esc closes, form return value), `popover` (opens, tap-outside dismisses) and `inert` (blocks focus) all pass in Playwright Chromium (Pixel 7) and WebKit (iPhone 15). → Use native `<dialog>` for modals, `popover` for tooltips/toasts, `inert` under the top screen (F03). Not tried on a real phone; WebKit here is the iOS engine but not the iOS build. Minimums: iOS 17 / Chrome 114 for popover. Phone back button does not send Esc, so F03 still needs browser-history handling.
- Playwright WebKit on Windows: tap emulation is unreliable, so tests click with the mouse instead.
- Selector and Stepper share one small `ArrowPicker` (◀ value ▶): one focus stop, ← / → step it. A gamepad d-pad just needs to send arrow keys.
- Controls are bare (their name is an aria-label); the visible label comes from the ListRow they sit in.
- Rule checker also fails on `var(--name)` that isn't a style name in `tokens.ts` (per-part helpers must start `--kit-`), and bans `position: fixed` as well as absolute. It imports `tokens.ts` straight from Node 24 (type stripping), so no build step.
- Gaps and the 44px target floor are px (set by applyStyle as `--gap-*` / `--target-min`); text sizes are rem. Reason: at 200% text on a 390px phone, rem gaps + rem targets doubled and squeezed ◀ value ▶ to one letter per line. Now only words grow. Other shape sizes (toggle track, slider thumb, room-code boxes) stay rem.
- Screen's centre slot doesn't scroll itself (it clipped Panel shadows into grey boxes); tall centre content = Panel + ScrollArea.
- Tabs wrap onto a second line on phones instead of scrolling sideways (nothing hidden).
- `npm run shoot` starts its own Vite (port 5180) in-process and closes it; it also fails on sideways overflow, targets under 44px and console errors, and shoots 200% text + a live tweak. Phones "zoom out" to fit wide pages, so overflow is checked against the real screen width.
- F01 kit size: ~610 lines of code + CSS (kit.css 201), excluding tests and clean.json — F02–F04 share the remaining ~400.
- Web is plain React + plain CSS variables, no Tailwind or component library (design §6). Kit budget ≤ ~1,000 lines for v1.
- F02 new style settings (all 5 presets set every one; `tokens.ts` explains each): `ink` (outline colour around filled buttons/badges and framing bars + switch tracks; `transparent` = none), `corner-shape` (`round` or `bevel` = chamfered corners, uses CSS `corner-shape`), `text-case` (`none`/`uppercase` for titles, buttons, tabs, badges), `press-shift` (how far a button sinks when pressed; its rest shadow disappears, for the hard-shadow press), `enter` (how panels and cards appear: `kit-fade` / `kit-float` / `kit-pop` / `kit-blink` / `kit-flicker`). Pixel's no-easing motion is just `ease: steps(2)`, and Cartoon's bounce is an overshooting cubic-bezier, so no extra motion setting was needed. `glow` and `panel-texture` are now set in every preset too.
- `corner-shape: bevel` works in Chrome/Edge (Chromium 139+) only. Safari and Firefox fall back to rounded corners of the same size, so Neon looks softer on an iPhone. Nothing breaks.
- Preset test (`kit/styles/styles.test.ts`): identical names; 4.5:1 for on-bg/bg, on-surface/surface, on-primary/primary, on-danger/danger, muted/surface, muted/bg; 3:1 for the focus ring on bg + surface. Ratios: clean 15.3 / 16.7 / 5.9 / 5.4 / 6.1 / 5.6 · cozy 11.1 / 12.9 / 4.6 / 5.5 / 5.7 / 4.9 · cartoon 10.8 / 16.8 / 10.7 / 5.0 / 7.6 / 4.9 · pixel 15.3 / 10.3 / 6.5 / 5.2 / 5.0 / 7.4 · neon 18.1 / 16.7 / 12.2 / 6.2 / 7.3 / 8.0. The test caught Cartoon's first red (3.8:1), so it was darkened.
- Fonts: self-hosted in `kit/fonts/` (Latin only, 1 file per font, variable fonts where they exist, so each file holds every weight), not the Google CDN. Reasons: the kit is copied into games, which should work offline and on itch, and nothing gets sent to Google. The browser only downloads the active preset's fonts. Clean = system font (0 KB) · Cozy = Nunito (39 KB) · Cartoon = Lilita One display + Fredoka body (40 KB) · Pixel = Silkscreen display + Pixelify Sans body (20 KB) · Neon = Orbitron display + Exo 2 body (53 KB). All OFL 1.1, logged in `ui-kit/content/credits.json` as 🟡 per the toolkit's traffic light (its Fontsource row says OFL needs no visible credit; the credit lines are there anyway).
- Surprise: Press Start 2P (the classic 8-bit font) is so wide that "ONLINE" burst out of a mode card, so Pixel titles use Silkscreen (about 30% narrower, still 8-bit). Avatar initials now use the body font in every style, because Silkscreen's M read as H at 18px. `font-synthesis: none` stops browsers faking bold on one-weight fonts.
- Gallery: `?preset=neon` in the link opens a style directly (handy on a phone). `npm run shoot` also saves `<preset>-phone.png` + `<preset>-desktop.png`, and waits for fonts to load.
- Kit size after F02: ~743 lines of code + CSS (excluding tests + preset JSON), leaving ~260 for F03/F04.
- F03 screen stack (task 9): `kit/screens.ts` is a tiny store (`screens.push/pop/replace`, `screens.current`), no library; `kit/ScreenStack.tsx` draws it in React (`useSyncExternalStore`) and makes every layer below the top `inert`. It also moves focus into a screen when it opens and back to whatever opened it when it closes (keyboard/gamepad). Each open screen is one browser history entry (`{ kitScreens: depth }`), so phone/browser Back closes the top screen; with every screen closed, Back leaves the page as normal. Closing a screen any other way (Esc, a button) steps history back too, so no Back press is ever wasted. Forward can't reopen a closed screen (it's stepped straight back).
- Surprise: two `history.back()` calls in a row can merge into one (jsdom does it; browsers may too), so closing two screens at once left a stray entry. History now moves one step at a time, waiting for each popstate before the next.
- Gamepad B is a hook, not built in: call `screens.pop()` when B is pressed (reading the Gamepad API needs a polling loop — that belongs with the game's input code).
- F03 transitions (task 10): no new animations. A screen's panels and cards already play the style's `enter` entrance (fade/float/pop/blink/flicker, `motion-normal`, `ease`) when they appear, which is exactly when a screen opens. A dialog is `<Screen dialog>`: it dims what's under it (the page colour at 70%) and fades the dim in with the same duration + ease (CSS `@starting-style`). The existing reduce-motion rule sets both to 0s (checked on Neon: `kit-flicker 0s`, dim `0s`). Closing is instant, with no exit animation: it feels snappy and can never leave a half-closed layer stuck on screen. Say if you want exit fades.
- Gallery "Screens" section (`gallery/ScreensDemo.tsx`): a game stand-in → Open settings → Quit… opens a dialog on top → Stay / Esc / Back close one screen, Quit closes both.
- `npm run shoot` now also runs the screen stack at phone + desktop: open → dialog → Esc → Esc back to the start; a covered button ignores a real mouse click and can't take focus; the Back button closes a screen and stays on the page; Quit closes two at once. Saves `screens-dialog-phone-portrait.png` / `-desktop.png`. Proven to catch a missing `inert` (with it removed, the covered button opened a second settings screen).
- Kit size after F03: ~128 new lines (screens.ts 69, ScreenStack.tsx 48, plus 11 in layout/CSS/index), so the kit is about 860–870 lines, leaving ~130 for F04.
