# Sprint 02 — Every core game screen, in all 5 styles, in the gallery
Started 2026-09-28 · Milestone v0.1 · Features: F04, F05 (in this order)
Branch: dev/v0-1-ui-kit

## F04 🎮 Built screens
Done when: every Built entry in design §4 exists in `kit/blocks/`, made only from kit parts (rule checker passes), takes its words from the game (English defaults), and looks right in all 5 styles at phone + desktop.
- [ ] 🤖 1. Dialogs & feedback — `kit/blocks/dialogs.tsx`: Modal, Confirm (danger), Toast stack (popover), Tooltip, RewardPopup, EmptyState, Spinner
- [ ] 🤖 2. Front end — `kit/blocks/frontend.tsx`: MainMenu, ModeSelect, HowToPlay pages, Credits (reads a game's `content/credits.json`)
- [ ] 🤖 3. Settings, list-driven — `kit/blocks/Settings.tsx` + default `kit/blocks/settings.default.json` (tabs: Audio, Display, Controls, Gameplay, Accessibility, Language, Account/Privacy, About; rows switchable; saved + remembered; "reset to defaults" per tab; destructive rows → Confirm) + test: add an entry → a row appears
- [ ] 🤖 4. In game — `kit/blocks/hud.tsx`: Pause, HUD frame (named slots) + pieces: Bar (incl. pips), Counter with +N float-up, Score & combo, TimerRing, TurnBanner, PlayerSeats (active highlight), Rank, ConnectionDot
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
