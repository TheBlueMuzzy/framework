# Sprint 01 — Every part and control in all 5 styles, with a live style switcher
Started 2026-09-28 · Milestone v0.1 · Features: F01, F02, F03 (in this order)
Branch: dev/v0-1-ui-kit

## F01 🧱 Parts + style engine
Done when: the gallery shows every layout box and control, built only from style names; changing `style.json` (preset or a tweak) restyles everything live; the rule checker passes; phone + desktop screenshots look right.
- [ ] 🤖 1. Set up `ui-kit/` (Vite + React + TS + vitest) with `kit/` (the copyable part) and `gallery/` (the app); spike: native `<dialog>` + popover support on phone Safari/Chrome → pick what's native vs hand-made
- [ ] 🤖 2. Style engine: `kit/style/tokens.ts` (the setting names), `kit/style/applyStyle.ts` (preset + tweaks → CSS variables on `<html>`), `kit/kit.css` (`@layer kit-base`: layout only, zero colours) + accessibility floor (18px text min, 44px targets, focus ring, 200% text scale, reduce motion)
- [ ] 🤖 3. Layout boxes `kit/layout.tsx`: Screen (safe-area slots: top-left, top, top-right, center, bottom…), Panel, Stack, Row, Grid — spacing only via `gap`
- [ ] 🤖 4. Controls `kit/controls/`: Button (primary/secondary/ghost/danger/icon/loading), Toggle, Slider, Selector ◀▶, Tabs, Stepper, TextInput + RoomCodeInput, ListRow, Card, Badge, Avatar, ProgressBar, ScrollArea, Text roles — states as `data-*` attributes only
- [ ] 🤖 5. Rule checker `scripts/check-ui.mjs`: no hex colours, px sizes, `position:absolute` (outside Screen slots), inline styles or stray fonts in `kit/` or game UI code + test
- [ ] 🤖 6. Parts page in the gallery; Playwright screenshots at 390×844, 844×390, 1440×900 (`scripts/shoot.mjs`)
Check: `npm test` + `npm run build` + `npm run check-ui` pass; screenshots show no overflow/clipping, targets ≥ 44px.

## F02 🎮 The 5 styles (Clean, Cozy, Cartoon, Pixel, Neon)
Done when: the gallery's style switcher flips between all 5 and each reads as its family (design §3); every preset passes the same-names + contrast test.
- [ ] 🤖 7. `kit/styles/clean.json` + preset test (identical keys, 4.5:1 contrast on every colour pair)
- [ ] 🤖 8. `cozy.json`, `cartoon.json`, `pixel.json`, `neon.json` — Google Fonts (OFL, 🟢) logged in `content/credits.json`; motion flavour per style
- [ ] 🙋 11. Look at the 5 styles on the parts page, phone + desktop (`/play`), and say what feels off (tuning)
Check: preset test passes; screenshots of every style at phone + desktop.

## F03 🧱 Screen stack + transitions
Done when: screens open/close/replace; only the top screen responds; Esc / phone back closes it; a dialog is a screen on top; transitions follow the style's motion and respect reduce-motion.
- [ ] 🤖 9. `kit/screens.ts`: tiny built-in store (no library) — push / pop / replace, `inert` below the top, Esc + browser back → pop + tests
- [ ] 🤖 10. Transitions (fade/slide from motion settings, reduce-motion) + a gallery demo (open a panel, a dialog on top, back out)
Check: tests pass; Playwright: open → dialog → Esc → Esc returns to start, lower screen can't be clicked while covered.

Ask Muzzy: —
Notes: Web is plain React + plain CSS variables, no Tailwind or component library (design §6). Kit budget ≤ ~1,000 lines for v1.
