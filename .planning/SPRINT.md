# Sprint 39 — Every screen holds up at 200% text
Started 2026-10-25 · Milestone v0.21 The kit meets every player · Features: F144, F145
Muzzy 2026-10-25: "go auto. i'm going to bed" — running unattended. Claude plans, one helper builds, Claude merges, reviews and saves; taste calls go to Notes as `Ask Muzzy:`. /deliver v0.21 waits for Muzzy.
What changes: the screenshot run looks at every screen with the biggest text setting, and the screens it finds broken get fixed. What stays the same: every screen at normal text size (the shoot proves it: the 100% shots stay 0 problems), every look, every game.

## F144 🔧 The shoot sees every screen at 200% text
Done when: npm run shoot takes every gallery screen at 200% text on an upright phone (390×844) and a sideways one (844×390), in the Clean look, and lists what it finds — before anything is fixed.
- [x] 🤖 1. Every gallery screen at 200% on both phones in the shoot (the parts / Settings 200% shots show how) — ui-kit/scripts/shoot.mjs
- [x] 🤖 2. Run it on today's code and list every problem by screen in Notes, before any fix (F141's scan list is the starting guess) — ui-kit/scripts/shoot.mjs
- [x] 🤖 3. The shoot's run time stays reasonable (say how many shots it added and the new run time; only Clean at 200%, not every look) — ui-kit/README.md
Check: the shoot runs the new shots; the list is in Notes.
Checked: 2026-10-25 (helper) — `SHOOT_PORT=6144 npm run shoot`: 745 screenshots in 695 s (was 656 in 615 s; +90 = 45 screens × 2 phones, the old Settings 200% shot folded in), **exit 1 with 89 problems — expected for F144**: all on 31 of the new 200% shots, the 100% shots + parts-phone-text-200 still 0; the list is in Notes. Looked at reconnecting / results / modes 200% shots myself. Root `npm run check:fast`: ✓ all 20 checks passed. No kit/ or gallery/ code changed.

## F145 🐞 Every screen holds up at 200% text
Done when: the shoot is 0 problems with every 200% shot from F144, and nothing changed at 100% (the 100% shots stay 0 problems; desktop + phone shots at 100% looked at for the screens touched).
- [x] 🤖 1. Titles that can't fit shrink to fit, like MenuHeader's (Reconnecting "Reconnecti / ng…", the art Game over) — ui-kit/kit/blocks/online.tsx
- [x] 🤖 2. The HUD at 200%: no overlaps, nothing past the screen edge ("Roll") — ui-kit/kit/blocks/hud.tsx
- [x] 🤖 3. The front end at 200%: menu buttons' room, "Play" over the tagline, Continue's "Turn 7 · 5 min ago", room's 32 px "Play online" — ui-kit/kit/blocks/frontend.tsx
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
- F145 non-HUD part (helper, 2026-10-25, worktree branch off dev/v0-21-every-player). Fixed (UI kit 0.35.1):
  - Titles: MenuHeader's fit runs on a title ALONE too (whole-word wrap at full size; a word wider than its line → heading → body; "split" = body, word may break, only wide fonts) — Reconnecting reads "Reconnecting…" whole. `useTitleFit` shared with the end screens' titles (Victory / Game over / Results). Short screens: title ≤ 10dvh, display ≤ 14dvh, never under body (`--kit-short-title` / `--kit-short-display`).
  - The "title clipped" set (modes, howto, credits, settings, chips, results, victory(reveal), payslip, gameover, lobby, roomauto, seats) was really the card's ScrollArea: its 0.5rem edge room grew to the whole card gap at 200% → now `min(0.5rem, gap-m / 2)`. Behind it, the list squeezed to a sliver (room 16 px, seats 43 px): a ScrollArea straight in a card keeps `--kit-scroll-min` 4rem (or its whole contents) and the card scrolls as one; Victory / Game over's report joins the card's rows upright so its list does too.
  - Main menu (+ Continue): `<Screen scroll>` — it scrolls as one when taller than the window (buttons over the tagline + version gone); a scrolling screen re-centres once its pictures load (artmenu's logo).
  - Results sideways: the buttons' row is a plain 1fr (Quit over the message → the card scrolls). Avatar initials ≤ 45% of 44 px ("SM"). Art frame (`Panel frame`) thickness in px from rem@16 — doesn't grow with text (the frame left Game over a 126 px strip).
  - uiProblems: `split:` also flags a TITLE (title/display) word broken across lines even when wider than its box — cheap, no new finding on any gallery screen at 100% or 200% (all 45 screens × 5 sizes checked); test added.
  - Checked: `SHOOT_PORT=6146 npm run shoot` 745 shots / 691 s, 48 problems all on 8 shots: hud ×2, huddock, emotes, pinned (the HUD helper's — same as F144's list, none worse), and mine left: feedback ×2, talk sideways. Every 100% shot (all looks, all sizes) 0. 100% shots compared pixel by pixel with F144's: the same, except the main menu's words (anti-aliased a hair differently — text in a scrolling box) and animation timing (spinners, talk typing, the reveal's scroll). Looked at menu, modes, endgame at 100% phone + desktop: no visible change. ui-kit `npm test` 768 ✓; root check:fast 20/20 ✓.
- Ask Muzzy: **feedback at 200%** — the top toasts cover the card's words (and, sideways, the gallery bar's Style picker). A toast is on top by design; any screen full of words at 200% has words under it. Options: (a, my pick) the page check treats a toast / open tooltip in the top layer as on top by design, like the 0.33.1 bar rule already does — a check change, so not done without your OK · (b) keep the check; feedback's two 200% shots stay red as known · (c) toasts at big text show only the newest one (taste).
- Ask Muzzy: **talk sideways at 200%** — a 3-line bubble at 36 px text needs ~210 px; the gallery stage is 312 px with the speaker + the demo's two pickers (squeezed to 2 lines by the plain Screen's shared middle column), so the bubble covers them and warns ("make room there"), as designed. Options: (a) accept — the kit warns, the game makes room · (b) long lines page into 2-line chunks on short screens (a feature) · (c) the demo drops its pickers into the gallery bar sideways (a demo change; I didn't, it would only hide the room problem).
- F145 in-game part (HUD helper, 2026-10-25, UI kit 0.35.2). The HUD at 200% couldn't fit by layout alone: a 390×844 phone at 200% is a 195×422 phone at 100%, and no grid fits a full HUD plus a play area in that. Fixed:
  - **HUD words stop growing at `hud-text-max` × their normal size** (new style value, default **1.25**; applyStyle writes `--hud-text-*` + `--hud-rem` as `min(normal rem, cap px)`, so they're the same as before at every normal size). It applies inside a Hud and on every HUD piece (HudText, chips, seats, player chips, timer ring, bar lengths, pinned pieces). Menus and dialogs still grow to 200%. This one change fixed huddock, emotes, pinned and most of hud.
  - ConnectionDot's words may wrap between words, in a left corner only (upright 200%: it ran out of its chip and the dot got squeezed off). The dot never shrinks.
  - `HudText fit` that's still too wide at its floor (body size) takes two whole-word lines instead of running over the corners (Pixel's huddock at 200%).
  - Chips "Player chips" clipped (upright + sideways): the ScrollArea's edge room reached the screen's own 16 px padding. Settled at merge on the screens helper's `min(0.5rem, gap-m / 2)`.
  - Demo (the problem was the demo itself): the HUD sample's "short screen" now counts the text size, as a game should (Text size sets the page font, which a media query never sees). An upright phone at 200% drops names and detail like a sideways one, but keeps the connection at the bottom, because by the coins it squeezed the bars off.
  - Ask Muzzy: **how far HUD words grow at big text** — `hud-text-max` 1.25 (my pick: with Text size at 200%, HUD words read at 125%, menus at 200%; Clean's HUD fits both phones) · 1.5 (bigger; the sample HUD on a phone on its side then overflows: the status wraps "Round / 1" and the banner lands on the seats) · 2 (= no cap, the F144 state). Edit it in the game's `content/ui/style.json` tweaks; the Dev Kit has no slider for it yet.
  - Known, not in the shoot (Clean-only at 200%): the HUD sample on a phone on its side at 200% still overlaps in **Cozy** and **Pixel** ("Hold to Roll" on the seats row). Their fonts and spacing are bigger. Every other look and screen of mine is 0 at 200% on both phones.
  - Checker gap, not fixed: a bar squeezed to a sliver and wholly covered by the next corner's chip isn't reported ("Coins covers part of" only fires on PART cover). I saw it in a 1.5-cap try upright; it isn't in the final state.
