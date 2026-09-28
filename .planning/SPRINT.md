# Sprint 02 — Every core game screen, in all 5 styles, in the gallery
Started 2026-09-28 · Milestone v0.1 · Features: F04, F05 (in this order)
Branch: dev/v0-1-ui-kit

## F04 🎮 Built screens
Done when: every Built entry in design §4 exists in `kit/blocks/`, made only from kit parts (rule checker passes), takes its words from the game (English defaults), and looks right in all 5 styles at phone + desktop.
- [x] 🤖 1. Dialogs & feedback — `kit/blocks/dialogs.tsx`: Modal, Confirm (danger), Toast stack (popover), Tooltip, RewardPopup, EmptyState, Spinner
- [x] 🤖 2. Front end — `kit/blocks/frontend.tsx`: MainMenu, ModeSelect, HowToPlay pages, Credits (reads a game's `content/credits.json`)
- [x] 🤖 3. Settings, list-driven — `kit/blocks/Settings.tsx` + default `kit/blocks/settings.default.json` (tabs: Audio, Display, Controls, Gameplay, Accessibility, Language, Account/Privacy, About; rows switchable; saved + remembered; "reset to defaults" per tab; destructive rows → Confirm) + test: add an entry → a row appears
- [x] 🤖 4. In game — `kit/blocks/hud.tsx`: Pause, HUD frame (named slots) + pieces: Bar (incl. pips), Counter with +N float-up, Score & combo, TimerRing, TurnBanner, PlayerSeats (active highlight), Rank, ConnectionDot
- [ ] 🤖 5. Flow — `kit/blocks/flow.tsx`: Loading, Countdown 3-2-1, RoundIntro, Results/scoreboard, Victory, GameOver, PostGame (rematch / lobby / quit)
- [ ] 🤖 6. Online — `kit/blocks/online.tsx`: Lobby (create / join by room code / players / ready), Reconnecting / error
Check: `npm test` + `npm run build` + `npm run check-ui` pass.

## F05 🔧 Gallery app
Done when: the gallery has a menu (Parts + every screen), each screen runs live in the chosen style through the real screen stack, and screenshots cover every screen.
- [ ] 🤖 7. Gallery menu: Parts / Screens (every block, live, opened via the screen stack); style switcher + `?preset=` link kept — `gallery/`
- [ ] 🤖 8. `scripts/shoot.mjs`: every block at phone + desktop (clean) + the 6 key screens (menu, settings, pause, results, lobby, HUD) in all 5 styles; overflow + 44px checks
- [ ] 🤖 9. Tidy + line count report; Credits screen shows the kit's fonts from `content/credits.json`
- [ ] 🙋 10. Try the screens on phone + desktop (`/play`), say what feels off (tuning)
Check: all screenshots clean; Muzzy's look.

Ask Muzzy: (answered) line budget → Claude's call.
Notes:
- Budget (Muzzy: "I trust your call", 2026-09-28): **core** (parts, styles, stack) stays ≤ ~1,000 lines; **screens** get their own budget, ≈ 60 lines each on average (~1,500 total). Screens are only parts put together, so the rule checker keeps them from inventing looks.
- F04 task 1 (dialogs.tsx, 136 lines for 7 blocks): Modal and Confirm are `<Screen dialog>` screens on the stack — the way F03 settled dialogs (dim + inert + Esc/Back) — rather than a second, native `<dialog>` system beside it. Toasts and Tooltip use native `popover` as the spike said. `askConfirm({...})` opens a Confirm from anywhere (Settings' destructive rows, Pause's Quit); a game adds the kit's own screens once: `<ScreenStack screens={{ ...kitScreens, ... }}>`. `toast('Saved')` from anywhere + `<ToastStack />` once (top centre, max 3, 3 s each). Tooltip is tap/click only (hover-to-show fought with click-to-toggle); it sits above its ⓘ via CSS anchor positioning (Chromium, Safari 26), centred on older browsers.
- Every block's words are a `words` prop with English defaults (`pauseWords`, `confirmWords`…), so a game passes `words={text.pause}` from en.json; `fill('Round {n}', { n: 2 })` fills in numbers. Block-only CSS is `kit/blocks/blocks.css`.
- Surprise: a popover that is also a Panel stayed visible when closed (Panel's `display: flex` beats the browser's hide rule) — blocks.css hides it when not open.
- Gallery: temporary `?block=<name>` preview page (`gallery/BlocksPreview.tsx`) + a "Built screens" button row; F05 replaces it with the menu.
- F04 task 2 (frontend.tsx, 134 lines for 4 screens): MainMenu shows a button only for each function you pass (onContinue, onPlay, onSettings, onHowToPlay, onCredits, onQuit); the first is the primary one. Credits takes `people` + `assets` (a game's content/credits.json as-is; entries without a `credit` line show author + licence). HowToPlay's page dots are `Pips` (lives in hud.tsx, shared with the HUD bar). Screens that close themselves default to `screens.pop()`.
- F04 task 3 (Settings.tsx 130 lines + settings.default.json 55): rows come from the list; `"on": false` switches a row off, and a tab with no rows left disappears. Row types: slider, toggle, selector, stepper, button (→ `onAction(id)`), link (opens `url`), destructive (→ askConfirm, then `onAction(id)`), info (e.g. version from `info={{ version }}`). Values save to localStorage (try/catch; private browsing just forgets on reload) or to the game's own `load`/`save`; `onChange(values, id)` tells the game. "Reset to defaults" per tab. Rows a game must wire itself that many games won't have are off by default (voices, frame-rate cap, invert Y, rebind, cloud save, delete account, subtitles).
- Accessibility rows drive the kit: `applyAccessibility(values)` sets the page font size (text is rem, so every word scales; gaps + 44px targets don't) and `data-reduce-motion` on `<html>` (blocks.css switches animations off, same as the device setting). A game calls `applyAccessibility(loadSettings(schema))` at start-up. Colour-blind / high contrast / shake are just values for the game to read.
- Phones get ◀ Audio ▶ (a Selector) instead of the tab bar: 8 tabs wrapped into 5 lines and filled half the screen. Under 40rem wide only.
- Surprise (caught by the test): translated row labels shared the `words` prop with the screen's own words, so a row with id `reset` was titled "Reset to defaults". Labels now have their own prop: `labels={{ audio: 'Sonido' }}`.
- At 200% text on a phone, "Accessibility" breaks mid-word inside ◀ ▶ (one long word, big font). Readable, not pretty.
- F04 task 4 (hud.tsx, ~200 lines for Pause, Hud frame + 9 pieces): `Hud` puts pieces in Screen's slots (vitals top-left, status top-centre, currency + pause top-right, actions bottom, banner centre, plus the two bottom corners). Pause's Quit asks first (askConfirm). Pieces sit on a small "chip" plate (surface + border + depth-1) so they read over any game art.
- Taps: every HUD slot lets taps through to the game; only buttons/inputs inside catch them (blocks.css, `:has()`). Checked in the browser: every chip, the timer ring and the banner pass the tap to the game; the pause button catches it.
- No new core parts: TimerRing (a conic-gradient ring, red at `warnAt` s), the +N float-up (stacked on its number in one grid cell, so no absolute positioning; lasts motion-normal × 4, removed when its animation ends) and Pips are HUD pieces in hud.tsx. Combo pop = the kit's `kit-pop` on a Badge, replayed each time the combo grows. With reduce motion the float-up is skipped (checked: 0 float-ups after a change).
- Phones: the HUD's top-centre piece drops to its own row under the two corners (and the bottom corners sit above the actions), because three things in one 390px row overlapped. HUD screens only, under 40rem.
- ConnectionDot: good = primary, weak = hollow red ring, lost = solid red; weak/lost also say it in words. (Accent-coloured "weak" read as "fine" in Cartoon, where accent is green.)
- Rank's place names use `Intl.PluralRules` ordinals (1st, 22nd, 113th); pass `format` for another language.
