# Game UI kit

Every screen a game needs (menus, HUD, pause, settings, results, lobby…) built from one set of parts, in seven styles —
Clean · Cozy · Cartoon · Pixel · Neon · Dark console · Fantasy — picked per game in `content/ui/style.json`. React, no runtime dependencies.
Kit **0.35.4** (unreleased). What's in it, part by part and screen by screen: **`CATALOG.md`**. The game-ui skill builds games'
screens from it.

## Install or update
From this folder: `node scripts/install-kit.mjs <game-folder> [clean|cozy|cartoon|pixel|neon] [--dry-run]`
- `kit/` → the game's `src/ui/kit/` with a `VERSION` stamp (the kit's tests stay here).
- Makes `content/ui/style.json` and `content/ui/settings.json` once; adds the kit's fonts to `content/credits.json`.
- Prints the wiring the game still needs (start-up, the rule checker, ESLint, `check:framework`).

## What a game must provide
From MODULE-CONTRACTS.md (`~/.claude/config/bmuz/`):
- **Words only from `content/text/en.json`, look only from `content/ui/style.json`** (`applyStyle`, live in the Dev
  Kit), settings rows from `content/ui/settings.json` — and every row that's on is read by the game.
- **Game fonts** in `content/ui/fonts.json` + `public/fonts/` with their licences (roles: title · heading · body · numbers).
- **Page-wide game CSS in `@layer game-base`**, and the rule checker in `check:fast`:
  `"check:ui": "node src/ui/kit/check-ui.mjs src/ui --css src"`.
- **Screens built from the kit's parts and slots** (Screen slots, Row, Stack, the HUD slots) so nothing overlaps,
  nothing is clipped and every tap target is 44 px — on a phone both ways, a short landscape, a laptop and a desktop.
- **Quality bars a player notices** (0.21.0, checked in the browser): text easy to read against what's behind it (4.5:1,
  3:1 for big text — use the style's on-… colours, not faded ones); nothing touching its box's edge — padding on every
  side of every card, chip, badge and button (`data-ui-bleed` on a cover picture or divider meant to run edge to edge);
  and a card that fills in during a sequence is its final size from the start (the kit's `Card` / `PlayerChip` watch
  themselves; a game's own card: `const fixed = useFixedSize()` → `<div ref={fixed}>`).
- **Comfort rows in Settings** (0.21.0): `reduceMotion` switched on in `content/ui/settings.json` — always; and
  `masterVolume` too when the audio module is installed. The kit's default settings file has both.
- **A gamepad** (0.34.1): the kit doesn't read pads itself. The game sends the d-pad as arrow keys, calls
  `screens.pop()` on B — and calls **`markPadUsed()`** (from the kit) on any pad press, so the screen the kit opens
  next shows the focus ring, like after a key. The browser's own `gamepadconnected` (fired only after a first press)
  already counts, so a game that skips it still rings from the first screen — until the player clicks or taps.
- **What's new after an update** (0.35.0, optional): the highlight lines in `content/text/whats-new.json`, and the MAIN
  MENU (never mid-game) calls `useEffect(() => { showWhatsNew({ version: appVersion, ...whatsNew, words: text.whatsNew }) }, [])`
  (`appVersion` from the version module). An entry only for a version worth announcing.

## How it's checked — `npm run check:framework`
The Dev Kit's runner (`src/devkit/check-framework.mjs`) runs this kit's `kit/conformance.mjs` on the game:
| Check | Fails when |
|---|---|
| the game's UI code keeps the kit's rules (check-ui) | `check-ui.mjs` (with the game's own `check:ui` arguments) finds raw colours, px, fonts, inline styles, stray positioning |
| check-ui runs in check:fast | the game has no `check:ui` script |
| every Settings row that's switched on is read by the game | (0.20.0) a row in `content/ui/settings.json` shows in Settings but nothing in the game's own code reads its id (`values.tips`, `const { tips } = values`, `id === 'resetTips'`, `info={{ version }}`, `useSetting('tips')` — 0.20.1: the id as a plain word elsewhere doesn't count) — or a link row opens a placeholder address. Skipped: headings, rows with `"on": false`, text size + reduce motion (the kit applies them), links, info rows with their own text, the Audio rows once the game passes the values to `applyAudioSettings`, and (0.30.0) a module's own rows once the game passes them on — each module that adds a row ships `settings-rows.json` (below) |
| nothing overlaps | two shown things sit on top of each other (text over text, a control over text) — not when one holds the other, or both are under a dialog. (0.33.1) Also a solid chip, badge, button or panel slid PART-way onto a bar, meter or picture ("Coins" covers part of "Health") — not one laid wholly over it (a dialog) or wholly on it (a chip on a backdrop picture), not one in the bar's own card (a badge on its portrait, a label on its own bar), not a toast / tooltip / modal in the top layer. (0.33.2) The same for a piece over part of another card's words ("Coins" covers part of "Score 120") — not a label on its own chip, a key chip inside its sentence, a badge in the words' own card, a dialog wholly over them, words wholly on a backdrop panel, or words whose own chip is on top |
| nothing is clipped or wider than the screen | a control is cut off at the edge of a box that hides overflow or sits past the screen edge (outside anything that scrolls), text is cut off, or the page is wider than the screen |
| every tap target is at least 44 px | a shown button / link / switch / tab / slider / box is under 44×44 |
| no focus ring without the keyboard | a focus ring shows on the first screen without any key pressed |
| Settings has the comfort rows (reduce motion, and volume with sound) | (0.21.0) `reduceMotion` isn't switched on in `content/ui/settings.json` (or the file is missing) — or, with the audio module installed, `masterVolume` isn't. Reads files only, so it runs with `--static` too |
| text is easy to read (contrast) | (0.21.0) text under 4.5:1 against what's painted behind it (3:1 for 24 px, or 18.66 px bold) — see-through colours and faded text mixed in. Skipped where it can't be judged: over a picture, gradient, canvas or video, with an outline or shadow, and disabled controls |
| nothing touches the edge of its box | (0.21.0) text, an icon, a picture, an avatar or a badge less than 2 px from the inside edge of the drawn box around it (a border, a shadow or its own background) — not inside a scroll area, not marked `data-ui-bleed`, not hanging outside the box |
| nothing 🔴 ships (credits) | an entry in `content/credits.json` is 🔴 — or (0.22.0) its licence says non-commercial (a CC BY-NC code, "non-commercial use only", "for non-commercial", "personal use only" — not "commercial and non-commercial"), whatever light it was given: it forbids tips, ads and store sales, and Steam won't take it |
| cards keep their size while they fill in | (0.21.0) a `Card` / `PlayerChip` (or a game's own `useFixedSize` box) grew by more than 1 px after it settled (fonts loaded + two frames). The screen or the style changing starts it over; shrinking is fine |
The browser checks open the REAL game at 390×844 · 360×780 · 844×390 · 768×343 · 1100×800 · 1440×900 · 1920×1080 (minus
the phone sizes the game's `"orientation"` rules out — 0.26.0), on its
first screen and in live play (through the Dev Kit adapter's `conformance.startPlay`), and say at which sizes each
problem shows. They skip the Dev Kit, hidden / inert / `aria-hidden` things, text for screen readers only, and
anything inside `data-ui-check="skip"` (an overlap that's on purpose). The in-page check is `kit/uiProblems.mjs` — the
gallery's `npm run shoot` uses the same one.

## Develop
- `npm run dev` — the gallery: `http://localhost:5180/?screen=<id>&preset=<style>`
- `npm test` — the kit's tests · `npm run check-ui` — the rules on the kit + gallery
- `npm run lint` — the framework's one ESLint setup (`../eslint.config.js`, the games' rules; `npm install` once in the framework root).
  0.19.1 fixed what it found: refs are no longer read or written while drawing (React's hooks rules) — ScreenStack notes
  the opener in its layout effect, Countdown keeps the latest `onDone` from an effect, SnapControl's dial angle is state; same behaviour.
  0.19.2 (review): a screen that focuses its own field as it opens (autoFocus) gets in before that effect, so ScreenStack
  remembers recent focus and takes the newest thing outside the new screen as the opener. Closing it hands focus back again.
  0.20.0: a new check — every Settings row that's switched on must be read by the game, so no switch shows that does
  nothing (Glyphtender once shipped 12). It only reads code, so it runs with `--static` too (the module installer's game check).
  0.20.1 (review): the Settings-row check only counts real reads now — a member of the settings values (`values.sound`),
  destructuring from them, an action id compared (`id === 'sound'`), `info={{ … }}` or `useSetting('sound')` — so a dead
  row with a common word for an id (sound, theme, hints) no longer passes because `assets.sound` sits elsewhere. And a
  string like `import.meta.glob('./sfx/*.mp3')` no longer looks like the start of a comment that hides the code below it.
  0.21.0: quality bars a player notices, now checked instead of only remembered — faint text (contrast), anything
  touching its box's edge, a card that grows while it fills in (`useFixedSize`, on `Card` and `PlayerChip`), and the
  Settings comfort rows (reduce motion always, master volume with the audio module). What they caught in the kit's
  own gallery, fixed: avatar initials in a player's colour were faint (now white or black, whichever reads); PlayerChip
  grew as its score counted up (a fixed score slot, `scoreDigits`; the "+N" takes no room); xs chips and their badges
  touched their edges (more room); an icon button's glyph at 200% text touched its edge (a little side padding).
  0.22.0 (F85): `Credits` shows an "Open-source code" button that opens `third-party-notices.txt` (the licence texts
  release.mjs writes into the game's `public/` at each release) — only when that file is really there; `notices={false}`
  leaves it out. And a non-commercial licence (CC-BY-NC) in `content/credits.json` now counts as 🔴.
  0.22.1 (review): the non-commercial check reads only the `licence` field (a credit line saying "Asheville, NC" is fine) and
  lets "free for commercial and non-commercial use" through.
  0.23.0 (F93): `MainMenu` buttons can carry a second line inside them (`continueDetail` for Continue, `items[].detail`)
  — Continue's "Turn 7 · 5 min ago" from the saves module's run resume. Inside the button, so the menu never jumps.
  Also (F95): `rejoinWords` + `welcomeBackLine()` in the online blocks — "Rejoin match", "That match has ended", "You're
  back — a bot played 4 turns for you" — for the rooms kit's rejoin (a MainMenu `items` entry).
  0.24.0 (F102): `Settings` takes `version` ("vX.Y.Z.B" — the version module's `versionLabel`): one quiet caption line
  under the pages, the same spot on every tab, so a game needs no About tab (short screens, 30rem tall or less: at the
  right of the header instead, so a phone on its side keeps its rows). It fills an info row with id "version"
  too (unless `info` gives its own); `info={{ version }}` still works, and the Settings-row check counts either.
  And `MainMenu` on a phone on its side counts its extra buttons (children) toward the two-column switch at six:
  Glyphtender's 5 items + Full screen stayed one column and ran off the top once its version footer took a row.
  0.25.0 (F103, from Goops): `ScreenStack` always has the kit's own screens (Confirm) under the game's — a game's own
  `confirm` still wins — so `...kitScreens` is no longer needed (Goops' Settings had none: Replay lessons' confirm drew
  an empty layer on top and nothing happened). A pushed name with no screen warns in the console, naming it, and closes.
  And two HUD options for a narrow phone, so a game needs no app.css restyle (each one was a check:ui warning in Goops):
  `Bar width={0.3} atMost` — the bars in a row share its room evenly, each at most its share (never narrower than its
  label) · `Hud dockTight` — the dock panel's sides get `--gap-s` instead of `--gap-m`.
  0.26.0 (F104): `content/ui/style.json` `"orientation"` — `"any"` (default; new games get it written in) · `"portrait"`
  · `"landscape"`. check:framework's browser checks skip the phone sizes it rules out and say so (`portrait` drops
  844×390 + 768×343; desktop sizes stay: a portrait game still runs in a desktop window); an unknown value warns and
  checks every size. The Dev Kit's PAUSED pill check uses sideways phones for a landscape game.
  0.26.1 (F89): the Settings check counts the crashes module's "Send crash reports" switch (`crashReports`) as read
  once the game passes its values on (`applyCrashSetting` / `setOn`), like the Audio rows.
  0.27.0 (F108, from Goops' Upgrades screen): pieces for shop / upgrade / loadout screens, in all 5 styles —
  a `success` colour + `on-success` (green in every style, contrast-tested; Neon's `#39ff7a` well apart from its cyan) ·
  `<Card tone="success">` (edge in success — the selected ring, so the card never grows — and the style's
  `depth-success` shadow: Neon glows green) · `<Card locked>` (greyed but readable: muted text, dashed edge, flat
  shadow, pictures in grey; the open card's exact size; never a button; `aria-disabled` + read out "Locked" —
  `lockedLabel` for the game's word) · `<Modal headerAction={…}>` (a control on the right of its header; `actions`
  stays the bottom buttons) · Neon's `danger` button glows red like `primary` glows cyan (`glow-danger`), so − / +
  look like a pair · a MenuHeader title beside an action drops a step (heading size) before it wraps and never
  splits a word ("UPGRAD / ES" at 360 wide); a ‹ too → body size; still too wide → the action moves under it.
  New style values: `success`, `on-success`, `glow-danger`, `depth-success` (a game's tweaks may set them; Dev Kit 0.23.1
  lists them). Look tests in a real browser: `kit/controls/cardLook.test.tsx`, `buttonLook.test.tsx`,
  `kit/blocks/menuHeaderFit.test.tsx` (page: `kit/stylePage.test-util.mjs`).
  0.28.0 (F107, the emotes module's parts — `kit/blocks/emotes.tsx`, gallery `?screen=emotes`): `SpeechBubble` (a
  Callout with no button that fades by itself: the same placement maths, edge, pointer and entrance in every style;
  fixed size from the start — sized to the longest of `sizeTo`; hidden from screen readers; pops at `motion-fast`, fades
  at `motion-fast`; reduce motion = no pop) · `EmotePicker` (opened from the player's own seat: 44px+ phrase buttons,
  two columns on a phone, one row on a wide screen; Escape / a tap outside closes; `readyIn` dims them with a filling
  ring) · `MuteMenu` (an opponent's seat: Mute / Unmute emotes) · `MutedMark` (a crossed bubble, read out "Emotes
  muted") · `LiveAnnouncer` (one polite line, at most one a second). The Callout's frame loop is now shared:
  `useCalloutPlace` (+ `avoid` — a CSS selector it stays clear of, e.g. the HUD and the other seats; bubbles also stay
  off each other: with no clear side, a second one stacks a step further out — found in the Glyphtender proof) and
  `useShownPopover`. The Settings check counts `hideEmotes` as read once the game calls `applyEmoteSetting` /
  `setHideAll` (like the crashes switch). Look tests: `kit/blocks/emoteLook.test.tsx`.
  0.28.1 (F22, ai 0.5.0): the Settings check counts the AI module's "Bot chatter" selector (`botChatter`: Off · Some ·
  Lots) as read once the game passes it on (`applyBanterSetting` / `setChatter`), like the emotes switch.
  0.29.0 (F109, the tappable seat row — `kit/blocks/hud.tsx`, gallery `?screen=emotes`): `PlayerSeats` takes
  `onSeatTap(seat)` — each seat becomes a real button (Tab reaches it, the focus ring shows, read out by the seat's
  `tapLabel`, e.g. "Ada — send an emote", else its name) — plus per-seat `badge` (a small mark ON the portrait's corner,
  so the chip is the same size with or without it: the emotes module's `MutedMark`), `seatProps` (attributes for the
  seat: `data-emote-seat`, `aria-expanded`…), `color` (the portrait's), and `showNames={false}` (portraits only, still
  named). Without them it draws exactly as before (tested). The emotes module's `<EmoteSeats>` (0.3.0) wires it.
  0.30.0 (F110, module Settings rows register themselves — `kit/conformance.mjs`): a module that adds a Settings row
  ships `settings-rows.json` in its `kit/`, copied into the game beside its VERSION (`src/crashes/`, `src/emotes/`,
  `src/ai/kit/`…): `{ "rows": [{ "id": "hideEmotes", "readBy": ["\\b(applyEmoteSetting|setHideAll)\\s*\\("],
  "hint": "pass it to the emotes module: …" }] }` — `readBy` = regex sources; a match in the game's own code (comments
  stripped) counts the row as passed on; `hint` = the failure's "what to do". The Settings check reads every installed
  one (src/*/ and src/*/kit/ with a VERSION; never node_modules), so a new module with a row needs no UI kit change. A
  dead module row's line names the module and its hint. The module's own folder never counts as the game's code (its
  settingsRow.ts defines the call — the Dev Kit's gameCode() only leaves out the modules it knows by name). Each pattern is compiled with a try/catch: bad JSON, no rows or
  a bad pattern = a plain-English failure naming the module and file, never a crash. **One-release fallback:** module
  copies older than their manifest (crashes ≤ 0.1.0, emotes ≤ 0.3.0, ai ≤ 0.7.0) still pass through the old hard-coded
  lists (`OLD_MODULE_ROWS`), used only for one of those folders installed without the file — take it out in 0.36.0 (kept
  through 0.34.0: Glyphtender hadn't reinstalled those modules yet; 0.34.0 went to the two new looks, 0.35.0 to What's new).
  The CRASH_ROWS / EMOTE_ROWS / BANTER_ROWS exports are gone (nothing used them).
  0.31.0 (F111, from Goops' sketch S9 — `kit/blocks/talkingBubble.tsx`, gallery `?screen=talk`): `TalkingBubble`, a
  story line someone SAYS. A Callout underneath (the same placement, pointer and colours as the emote bubble), but its
  outline is drawn: it grows open from its pointer's tip (320 ms, ease-out-back), types the line out with rests at
  . ! ? … (`pauseMs`) and half at , —, fizzes a stretch of its outline as a spiky speech wave while it types (the
  pointer never fizzes), pops the OUTLINE per syllable (the words never move) and squelches now and then while it
  waits. `outline` "wave" | "plain" (no wave / squelch). Fixed size from the start. `onConfirm` makes it a button
  ("Next"): a tap while typing shows the whole line, then confirms. Reduce motion: the whole line at once, nothing
  moves. Screen readers: the full line once (`speaker` in front). The numbers: `DEFAULT_TALK_FEEL` (Muzzy's approved
  S9 values) — a game keeps them in `content/tuning/talk.json` and passes the object as `feel`; read every frame, so
  Dev Kit edits apply live. Each style paints it (surface, border, border width, corners — bevel in Neon / Pixel — and
  its depth-2 shadow). Tests: `kit/blocks/talkingBubble.test.tsx`.
  0.31.0 (F113, Goops' payslip report — `kit/blocks/flow.tsx`, gallery `?screen=payslip` · `?screen=victoryreveal`):
  report rows one at a time. `Victory` / `GameOver` take `reveal` (ms per row): the stats rows arrive one after another
  with the Results rows' entrance (the same CSS rule — `--kit-step` = the game's ms in place of the fast motion time);
  all at once with reduce motion. Waiting rows hold their space (unseen, not missing), so the card is its final size
  from the start (fixed-size safe). `onRevealed` fires once when the last row is in — at once with reduce motion, no
  rows, or no reveal; it follows the CSS animation, so the Dev Kit's full pause holds the reveal and the callback.
  `<StatList stats reveal onRevealed words />` = the same rows as a block for a Modal (inside a ScrollArea) or your
  own card — Victory / GameOver use it. A row's `tone` "danger" | "success" puts a ▼ / ▲ `Badge` in that colour before
  the value (read out `words.danger` "Loss" / `words.success` "Gain" — never colour alone); the value keeps the panel's
  text colour (Pixel's danger is 2:1 on its panel). `Badge` gets `variant="success"`. No `reveal` = the old rows,
  unchanged. Tests: `kit/blocks/flow.test.tsx` + `kit/blocks/statListLook.test.tsx` (real browser, 5 styles: unseen
  then seen in order, the card's box the same before / mid / after and as with no reveal).
  Long lists (F113 task 5, Goops: 692 px of rows in a 605 px frame at 390×844): Victory / GameOver hold their stats in
  a `ScrollArea` (named after the title), so the title, message and buttons stay put and in sight — only the rows
  scroll (edge fade where there's more, no scroll bar), at every size (on its side too: the report column scrolls). A
  list that fits: the same card, size and look as before. With `reveal`, a `StatList` in any ScrollArea (Victory's, or
  yours round one in a Modal) scrolls each row into view as its entrance starts — smoothly, and clear of the "more
  below" fade (`scroll-margin-block-end` = `--kit-scroll-fade`) — until the player scrolls it themselves (wheel, touch,
  a press, the keys): then it stops following. Tests: flow.test.tsx (what's inside the box, the follow rules, a manual
  scroll taking over) + statListLook.test.tsx (real browser, 5 styles × 5 sizes: title + buttons in sight, no page or
  card scroll, the list scrolls; a short list's card the same size as without the box). Game CSS aimed at the old
  `.kit-end-info > .kit-stats` path: the rows now sit one level deeper, `.kit-end-info > .kit-scroll > .kit-stats`.
  0.32.0 (F115, Goops' payslip Modal — `kit/blocks/flow.tsx`, gallery `?screen=payslip` "Next payday"): a `StatList`
  (and so Victory / GameOver) replays its reveal by itself when its rows change BY CONTENT — labels, values (a number,
  text, or an element's words) and tones: fresh rows from the top, the scroll back to the top, and `onRevealed` once
  more for the new rows (at once with reduce motion). The same rows re-rendered (a new array of new objects with the
  same words) never replay. The `key={…}` workaround for swapped stats is no longer needed — a key is only for
  replaying the SAME rows (the gallery's Replay). Tests: `kit/blocks/flow.test.tsx`.
  0.32.0 (F116, the sprint 29 review's minors — `kit/blocks/emotes.tsx`, `kit/blocks/talkingBubble.tsx`): the talking
  bubble for every player. **One lasting live region per page:** `announce(text)` / `liveRegion()` — made once (on
  first use, or when a LiveAnnouncer / TalkingBubble mounts), straight on `<body>`, never removed; only its text
  changes, and its very first line waits 100 ms so the region is on the page before its text (screen readers skip a
  region made together with its words). The same line twice is still said twice (the text toggles a trailing
  no-break space). TalkingBubble and `LiveAnnouncer` (so the emotes module's EmoteBubbles) both speak through it;
  `LiveAnnouncer` keeps its props and its one-a-second limit, but draws nothing now (game CSS or tests that looked for
  its own `<span role="status">` find the page's `.kit-live` instead). **Focus:** a TalkingBubble with `onConfirm`
  takes the keyboard focus a frame after it appears (like a pausing Callout's button; no ring unless the keyboard is
  in use) — never out of a text box, textarea, select or editable the player is typing in — and gives it back when it
  goes. **`lineId`:** a new one restarts the bubble (typed and said again) even with the same words — pass the
  script's line number or a counter bumped per line. **Safe numbers:** `talkFeel(feel)` keeps each value in
  `TALK_FEEL_RANGES` (e.g. variability 0–1, spikeGap 2–200, typeSpeed 1–1000); null, NaN, words or a missing key →
  `DEFAULT_TALK_FEEL`'s — a bad talk.json can't draw a broken outline. The live region is pulled up by its 1 px
  (`.kit-live`), so it never gives a full-height page a scroll. Tests: `kit/blocks/talkingBubble.test.tsx`,
  `kit/blocks/emotes.test.tsx`, `kit/blocks/emoteLook.test.tsx` (real browser: no page scroll), and the emotes
  module's `kit/ui/EmoteLayer.test.tsx`.
  0.33.0 (F119, the gallery passes its own layout checks — `kit/blocks/blocks.css`): **names are never cut short.** A
  name in Results, the Lobby room or the Seat picker (`.kit-result-name`) wraps at its spaces (one over-long word
  breaks too) and its badges (★, You, Host) move under it when the row is narrow — no more "Sherman Mere…" or "Muz…"
  on a phone; the Lobby room's "Share this code with your friends" wraps the same way. **Lobby room on a phone on its
  side:** the two columns share the card half and half (was 1 : 1.25, which wrapped Leave / I'm ready onto two lines),
  and the left column's last row never shrinks below its buttons — so Leave / I'm ready never slide up over the
  waiting line; on a very small phone the card scrolls instead (its last-resort scroll). Tests (real browser, all 5
  styles): `kit/blocks/nameFit.test.tsx`. **`--kit-toasts-top`** (like `--kit-toasts-start` / `-end`): room to keep
  clear above top toasts, for a bar of the page's own over the game — the gallery sets it to its bar's height on a
  narrow phone, where its Menu + style buttons fill the bar. Unset = as before. Test: `kit/blocks/toastsTop.test.tsx`.
  0.33.0 (F121, Goops' F35 — `kit/blocks/talkingBubble.tsx`, gallery `?screen=talk&colours=paper`): **a TalkingBubble
  in the game's own colours.** `colours={{ fill, ink, outline, outlineWidth, more }}` — each optional; the game keeps
  them in content/tuning/talk.json (e.g. `"colours": { "fill": "#f4f4f2", "ink": "#222", "outline": "#555",
  "outlineWidth": 1.6, "more": "#888" }`, Goops' Veteran: a light bubble with dark words) and passes that object.
  Read every frame like `feel`, so Dev Kit edits apply live. They become `--kit-talk-*` on the bubble; each one not
  set is the style's colour exactly as before (no variable written at all — computed styles and pixels identical in
  all 5 styles). The part still holds no colours: they come in as the game's data. Safe: only real colours count
  (the browser's `CSS.supports('color', …)`; without a browser only hex / rgb() / hsl()); anything else is ignored;
  `outlineWidth` is a number in px at 100% text size, pulled into 0–8. **Contrast floor:** `ink` under 4.5 : 1 on the
  fill → the style's text colour; if the style's text doesn't read on the game's fill either, the style's fill too
  (never unreadable). Each dropped value is said once in the dev console. Text stays body size. Works with outline
  "wave" and "plain"; the ▼ uses `more`. Helpers: `talkColours`, `isColour`, `contrastRatio`. Tests:
  `kit/blocks/talkingBubble.test.tsx`, `kit/blocks/blocksCss.test.mjs`.
  0.33.1 (F123 + F124 — `kit/blocks/blocks.css`, `kit/uiProblems.mjs`): **HUD corners keep their content's width; the
  middle of the row gives way.** Every Screen slot could shrink to nothing, so a HUD's middle took all the room it
  wanted and a corner slid under it (the coins chip on the end of the Health bar on an upright Cozy phone; Roll over
  "40%" on a 667×375 phone). Now, on a HUD screen: each corner is at least as wide as its narrowest content; the top
  and bottom middles get what's left (and wrap in it — e.g. the status row puts the score under "Round 1" when there's
  no room); the screen has five columns, so a wide top corner doesn't squeeze the bottom row's actions; a middle with
  no corners beside it has the whole row. On a phone (≤ 40rem) each left corner gives way to the right corner of ITS
  OWN row, staying inside its room: its bars get shorter inside their plates (a `width` bar shrinks to 2rem at the
  least — it used to keep its length and stick out of the plate). HUDs that already fit look the same; a plain
  `Screen` (menus) is unchanged. The overlap check now also sees a solid piece covering part of a bar, meter or
  picture (see "nothing overlaps" below); the gallery shoot adds a 360×780 phone and a 667×375 phone on its side.
  0.33.2 (F128 — `scripts/install-kit.mjs`): the installer asks git for the kit’s commit once per run, not on every
  install — two git processes per install took 0.2–2 s each under check:fast (saves did the same in 0.6.2).
  Also in 0.33.2 — `kit/art.css`: a kit control in an `ArtLayer` (`.kit-art-layer > .kit-target`) keeps its 44 px
  tap floor (the layer's children reset their min sizes, a Button's too; found by Goops; `kit/artTarget.test.mjs`).
  And F127 + F126 — `kit/uiProblems.mjs`, the gallery: **the overlap check sees a chip covering text.** A solid
  chip, badge or panel over PART of another card's words is said as `overlap: "Coins" covers part of "Score 120"`
  (the text-over-text check stopped at the chip's background and said nothing — the coins chip sat on "Score 120"
  on a 667×375 HUD before 0.33.1). Same on-purpose exemptions as for bars, plus: the piece must be on top (words
  whose own chip lies over the piece aren't "covered"); a piece wholly inside a run of words still counts (it hides
  letters); a pair already said as "X × Y" isn't said twice. On today's gallery it found nothing new. **The edge
  check measures a shrunk box's border as drawn**: a chip pinned to the table (a transform) has a thinner border on
  screen than its style says, so Pixel's 4 px border at pin scale 0.44 was read as 4 px and its words "touched" the
  edge (they had 3.5 px). Games may see new "covers part of" lines and lose false "edge:" lines on pinned chips.
  Gallery: the parts page's HUD demo is built with `Hud` (a plain `Screen` lets a corner shrink to nothing, so at
  200% text "Round 2" slid over the Health bar — plain Screens are for menus; see `Screen` in CATALOG); the talk
  sample's pickers sit one per top corner on a phone on its side (both in one corner wrapped to two rows and the
  bubble covered the second). The shoot: 0 problems.
  0.33.3 (F129 — `scripts/shoot.mjs`, `scripts/codeChanges.mjs`): **the shoot stops when a file changes mid-run.**
  Its Vite server reloads screens on an edit, so a run that saw one mixed shots of two versions of the code; now an
  edit, a new file or a deleted one (its own screenshots don't count) ends the run at the next shot with
  `✗ stopped: kit/kit.css changed during the run …` and exit code 2 — run it again when nothing is being edited.
  And F130 — `kit/blocks/teach.tsx`: **a bubble that can't stay clear of its `avoid` says so.** The shared pointing
  placement (Callout, SpeechBubble, EmotePicker, MuteMenu, TalkingBubble) used to cover what it was told to avoid
  without a word when no side had room; now it prints one dev-console warning naming the bubble, what it points at and
  what it covers (once until it's clear again; never in a production build). Placement is unchanged. The shoot counts
  `[ui-kit]` warnings as problems; today's gallery has none.
  And F134 — `kit/shown.ts`: **a 0 handed to a part shows in its place.** `{badge && <Badge>…}` drew a stray "0" on the
  page when the badge was 0 (React draws the number 0); the parts that take a node — MainMenu's extras, MenuHeader's
  action, dialog actions and icons, the HUD's note / icons / slots, a PlayerChip's badge and detail, ListRow's detail,
  PullHandle's look, Screen's slots — now draw it inside its place ("0" in the badge). F135 — `kit/check-ui.mjs`:
  **a picture written into the CSS is one value** — `url("data:image/svg+xml;…")` is no longer cut at its own `;` and
  `:` (an inline SVG's `fill='#fff'` read as a raw colour); what's inside `url(…)` and quotes isn't checked as a style
  value. F136 — `Grid fill` (`kit/layout.tsx`, `kit.css`): **Mode select spreads fewer modes over its row** — 2 modes
  on a desktop panel left an empty column; 3+ modes and phones look the same.
- 0.34.0 (F138–F140, framework sprint 37): **two new looks — Dark console (`"preset": "console"`) and Fantasy
  (`"preset": "fantasy"`)**, so a game picks from seven. Dark console = a games console's own menus: dark navy, big soft
  corners, no outlines, one bright blue, Exo 2 titles + Nunito. Fantasy = dark wood and gold: small corners, 2 px gold
  edges, Cinzel carved-capital titles, Alegreya book serif for reading and numbers (Cinzel's 0 reads as O). Both pass
  the style tests (same settings as every look, 4.5 : 1 text, 3 : 1 focus ring, a green success) and the shoot (639 shots
  with 7 looks, 0 problems). New fonts `kit/fonts/cinzel.woff2` + `alegreya.woff2` (SIL OFL 1.1, credited in
  content/credits.json); a game only downloads the fonts its look uses. Picked from the framework's sketch S1 (three takes
  per look) — Claude's draft picks (Console 1 · Fantasy 2) until Muzzy confirms or swaps. The old-module-rows fallback now
  goes in 0.35.0. Also `kit.css`: **numbers are full height in every font** (`font-variant-numeric: lining-nums` on the
  kit's text; a player chip's score keeps its equal-width digits too) — Alegreya draws old-style numbers by default, so
  "v0.1.0" read "vO.1.O"; fonts that already draw lining numbers look the same. `scripts/pick-sheet.mjs` takes
  `SHOOT_PORT` like the shoot.
- 0.34.1 (F142, framework sprint 38): **a gamepad player sees the focus ring from the first screen.** New
  `kit/keysOrPad.ts`: one "is the player on keys or a pad?" flag that ScreenStack, TalkingBubble and Callout's pause
  all ask. A key press or the browser's `gamepadconnected` (Chrome and Firefox only report a pad after a button press)
  → focus moved by the kit shows the ring; a click or tap → it doesn't. The latest kind of input wins (before, one
  key press ever was enough, and a pad never counted). New export **`markPadUsed()`** for a game's own pad code.
  Also: a TalkingBubble with `onConfirm` and a pausing Callout's button now show the ring for key players too (before,
  never).
- 0.34.1 (F141 — `kit/kit.css`, `kit/blocks/blocks.css`, `kit/uiProblems.mjs`): **big text never splits a word.** At
  200% text Settings' ◀ tab ▶ picker showed "Accessibil / ity" and a row's label could be squeezed to "Lock / down".
  Kit text and the picker now wrap whole words (`overflow-wrap: break-word`, was `anywhere` — a word only breaks when
  it's wider than its whole line); an icon button's glyph stops growing at ¾ of its 44 px button (the Settings header's
  ‹ at 44 px), so at big text the WORDS get the room, not the arrows — nothing changes at 100% in any look; the picker's
  value has a little room above and below. The page check has a new kind, **`split:`** — a word broken in the middle
  although it would fit on one line of the box it's drawn in (a word wider than its card may still wrap); games'
  `check:framework` reports it as "no word is broken in the middle". The shoot adds Settings at 200% on a phone, on its
  Accessibility tab (640 shots, 0 problems).
- 0.35.0 (F143, framework sprint 38 — `kit/blocks/whatsNew.ts`, `kit/blocks/dialogs.tsx`, gallery `?screen=whatsnew`):
  **What's new after an update.** `showWhatsNew({ version: appVersion, ...whatsNew })`, called by the game's main menu,
  opens a `WhatsNew` panel (a Modal: 3–5 highlight lines, "Full notes" when there's a web `notesUrl`, "Got it") once, on
  the first launch after the X.Y.Z changes — never on a first install, a build-only bump, a version with no entry, a
  downgrade or "dev". The lines live in the game's `content/text/whats-new.json`; last seen is one string under
  `kit-whats-new:<game folder>`, remembered when the panel opens. The rule is a pure function (`whatsNewDecision`,
  a test per rule). Design: `.planning/design/ui-kit.md` §4c. The shoot adds it (656 shots, 0 problems). The
  old-module-rows fallback now goes in 0.36.0.
- 0.35.1 (F145, framework sprint 39): **every screen holds up at 200% text.** Two helpers in parallel — the in-game
  screens (HUD, dock, chips, pinned, emotes: lines below) and every other screen (this part). Nothing changes at 100%:
  the 100% shots are pixel-for-pixel the same, except the main menu's words (anti-aliased a hair differently now that
  it can scroll). Every other screen:
  - **Titles never split a word.** MenuHeader's fit (0.27.0) now runs on a title alone too — at full size it still
    wraps between words; a word wider than its line drops it a step (heading size, then body) instead of
    "Reconnecti / ng…". The end screens' titles (Victory, Game over, Results) fit the same way (`useTitleFit`, shared).
    On a short screen (30rem tall or less) a title is at most a tenth of its height and a display title a seventh
    (`--kit-short-title` 10dvh / `--kit-short-display` 14dvh), never under body size — above every style's 100% sizes.
  - **A card's list keeps a floor.** A ScrollArea straight in a card gives up height only down to `--kit-scroll-min`
    (4rem) or its whole contents if shorter; past that the card scrolls as one (the Room's player list was a 16 px
    sliver). Victory / Game over's report joins the card's rows when upright, so its list keeps the floor too.
    The scroll box's edge room is at most half the card's side gap (it grew to the whole gap at 200%).
  - **The main menu scrolls as one** (`<Screen scroll>`) when it's taller than the window — buttons slid over the tagline
    and the version line. A scrolling screen re-centres once its pictures load (the art menu's logo).
  - Results on a phone on its side keeps its buttons' row whole (Quit slid over the message; now the card scrolls).
  - An avatar's initials stop at 45% of its 44 px circle ("SM" overflowed it). An art frame (`Panel frame`) no longer
    grows with the text size, like the style's gaps — its rem are counted at 16 px; the same at 100%.
  - The page check's `split:` also flags a TITLE word broken across lines when it's wider than its box (a title can
    drop a size; body words still may wrap) — no new finding on any gallery screen at 100% or 200%.
- 0.35.2 (F145, the in-game part): **HUD words stop growing at `hud-text-max` × their normal size** (a style value a game's
  tweaks may set; default 1.25) — in a Hud and on every HUD piece (HudText, chips, seats, player chips, the
  timer ring and bar lengths via `--hud-rem`, pinned pieces); menus and dialogs keep growing to 200%. ConnectionDot's words
  may wrap in a left corner, and a `HudText fit` still too wide at its floor takes two lines. Same at 100%.
- 0.35.3 (F145, Muzzy 2026-10-25): the page check's `overlap:` leaves a toast or tooltip (anything in the top layer)
  over the page alone — on top by design; two of them over each other still count. `hud-text-max` 1.25 approved.
  The shoot's `knownShots` lists shots Muzzy accepted as they are (talk sideways at 200%), printed as "known".
- 0.35.4 (F147): **every look holds up at 200% text** (the shoot's 200% shots in the 6 other looks, F146). Past the HUD's
  text cap (`data-big-text` from Hud), its top-left bars give way to the middle row as on a phone (a dropped score chip
  pushed the turn banner onto the seats in Cozy and Pixel sideways). A menu's buttons keep their line of words and border
  when squeezed (Pause sideways: the card scrolls a little instead — Quit shows cut at its edge). The Seat picker's and the Lobby room's titles drop a size like the end
  screens' (`.kit-fit-title`). A name (Results, Lobby, Seat picker) keeps its longest word — the points move under it.
  A ◀ value ▶ picker whose value won't fit between its arrows puts it on its own line, the arrows under it at the two
  ends (`fitPicker`; "Accessibility" at 200%). MenuHeader's ‹ stops growing inside a thick border (Pixel). The
  TalkingBubble's wave never leaves the screen (`keepWaveInside`), and a bubble wider than its room stays on the window.
  A bubble is "stuck" on what it avoids only after 300 ms (`STUCK_SETTLE_MS`: a frame or two while things re-place is
  not). The page check measures words in their own font (the kit's lining-nums emptied the `font` shorthand, so every
  word was measured in 10px sans-serif — Back and Pause's buttons read as touching their edge). Same at 100%.
- 0.35.5 (F149): **the kit holds up in WebKit (every iPhone browser).** What `npm run shoot:webkit` + `npm run
  compare:engines` found against Chromium, fixed in the kit:
  - **A part's size no longer follows a symbol's font.** WebKit (and an iPhone) draws ⚙ ❤ as colour emoji ~1.37 em wide
    where Windows Chromium draws 0.85 em text symbols: the icon Button grew 44 → 55–61 px, the HUD's ❤ chip 7 px, the
    ▼ / ▲ tags 2–5 px (a payslip row's words then took a line more). An icon Button is now exactly 44 px (or `size`)
    and a symbol too wide for it is drawn smaller to fit with room each side (`useGlyphFit` measures it,
    `--kit-glyph-em`; text symbols already fit and keep their size). A Bar's / Counter's typed `icon` sits in a
    1.375 em box (an emoji's width — **in Chromium the ❤ chip is ~7 px wider than before, its bar that much
    shorter**); a StatList ▼ / ▲ tag is never wider than 0.875 em. Pictures (`<img>`, svg) keep their own size.
  - **A card that has to scroll keeps its last row of buttons in sight** (the last resort on a short screen): Safari's
    `text-wrap: pretty` evens out a whole paragraph and can take a line more than Chromium's (the Lobby room on a Pixel
    phone on its side: "I'M READY" sat cut on the card's bottom edge). The row sticks to the card's bottom with the
    card's room below it, painted in the card's colour only while it scrolls (a scroll timeline — Safari 26, Chrome
    115; older browsers scroll as before). A card that fits looks exactly as before.
  - **A label doesn't fit "by a hair":** the main menu's two-column buttons (a phone on its side, 6+ buttons) keep a
    gap-m each side of their words, like `compact` — "HOW TO PLAY" in Neon fit by 0.03 px in Chromium and wrapped in
    WebKit. Same buttons, same size.
  - Symbols a game types: `'⚙︎'` asks for the plain-text look (an iPhone otherwise draws Apple's colour emoji; the
    gallery's ⚙ does). WebKit on Windows ignores it — its only font with ⚙ is the emoji one — so only a real iPhone
    shows the difference. The button's size holds either way.
- 0.35.6 (F149, GitHub's Linux): an icon Button's symbol keeps at least 0.125rem (2 px) each side, and `fitGlyph`
  measures again at the size it just gave until the symbol fits — text snapped to whole pixels (Linux) came out a
  pixel wider than its share once drawn smaller, leaving 1 px of room. The page check's `overlap:` leaves words alone
  when a sticky row (a scrolling card's buttons) sits over them and scrolling that same box moves them out from under
  it (tried at both ends, then put back); a sticky row over words no scroll uncovers is still an overlap.
- 0.35.7 (Muzzy 2026-10-26): a scrolling card's stuck row of buttons has a soft fade above it (`--kit-scroll-fade`,
  2rem — the ScrollArea's "more below" cue), so a line cut where it scrolls under the row reads as "scroll". It thins
  out as the card scrolls and is gone at the end. A card that fits shows nothing new.
- 0.35.8 (F152): **Results' winner ring has room.** The 1st-place avatar's accent ring (and yours in the Lobby room) is
  an outline drawn 0.3125rem outside the avatar's box, and the row's gap counted only the box: "1ST", the name and its
  ★ / You had 3 px at 100% text, and at 200% the ring crossed them (every look, both engines). An avatar in a list row
  now keeps that much room on every side (`.kit-listrow .kit-avatar`), ringed or not, so the column stays straight —
  the rows are a little taller and the names start 0.3125rem further right. The page check has a new kind,
  **`ring:`** — words or a badge closer than ~2 px to an avatar's visible edge, measured as drawn: its ring included
  and its round shape (a circle, not its box); something laid ON the avatar (a seat's badge) is left alone, and a chip
  shrunk onto the table has its room shrunk with it.
- 0.35.9 (F153): **Light words on a light page are caught.** HudText ("Your turn", "Game over"), plain toasts and a
  bar's inside label are light on-game words with a dark halo, made for the game's own picture; in the turn-based
  starter they sat on the plain light page and "Game over" all but vanished while every check was green (the faint
  check skips words with a halo). The page check has a new kind, **`contrast:`** — on-game words under 3:1 against
  what's behind their letters, the halo not counted. A plain colour is judged, and so is a CSS gradient (by its stop
  that reads best); a picture, canvas or video can't be and is left alone, and so are words under a dialog's dim or
  inside a dialog. White on light grey fails; white on a mid-to-dark table passes (the starter's felt: 7.9:1). Nothing
  in the kit looks different. Fix a find by putting the game's picture or table colour behind the words. (The gallery:
  the hand and round demos now sit on the dark stand-in game, and the HUD demos no longer wear the light dim a pushed
  screen brings — in a game the HUD is the stack's bottom layer, never under it.)
- 0.35.10: **The round intro dims the game dark, in every look.** "Round 2 of 5" is light on-game words; over the
  light looks' veil (the background colour at 70%) it read ~2:1, held up only by its halo. RoundIntro now asks for
  the game's dark shade (`--game-shade` at 70%) instead — a new `shade` option on `Screen` for any screen of only
  on-game words over the game (overlay mode too). Muzzy 2026-10-26: "Dark veil, every look".
- 0.36.0 (F91): **The long fake language — see which words won't fit once translated.** Add `?pseudo` to a game's
  address in dev and every word on the page is rewritten: each letter accented, each word ~40% longer (no new spaces —
  translations are longer words, not more of them), the whole text in [brackets] (a missing `]` = cut off), `{slots}`
  kept. It rewrites words where they're drawn, so en.json words, the kit's English defaults and module words are all
  caught, and React keeps working (a changed word is rewritten too). The Dev Kit is left alone. `applyStyle` starts
  it, so a game needs no wiring; `startPseudoPage()` and `pseudo()` are exported too. `npm run check:framework` reopens
  the game in it and WARNS about anything cut off, wider than the screen, broken mid-word, overlapping or running out
  past its box ("words still fit when they're ~40% longer"). A word with real accents (Café, möglich) is rewritten too;
  the pass remembers its own writes, so a word with no accentable letters (日本語) never grows. The gallery: `npm run shoot:pseudo` → screenshots-pseudo/.
- 0.37.0 (F156): **Room for longer words.** The whole gallery in the fake language: 0 words cut off, broken mid-word or
  overlapping (from 208 shots with one); English unchanged (0).
  - **Never translated:** a player's name, initials, a room code, the game's name and the credits' names carry
    `translate="no"` (HTML's own — a browser's translate button honours it, and so does the fake language). `Text` takes
    `translate="no"` for a game's own (a score name, a code). Most "cut off" finds were the fake language rewriting these.
  - **Fits re-measure when their words change on the page** (HudText `fit`, titles, the ◀ ▶ picker) — not only on a
    resize or a React change, so a browser's translate button gets a fitted title too.
  - **Lobby room:** "Room QX2T" and its share line keep room for their longest word; Copy moves under them.
  - **A title beside only a ‹** that's still too wide at body size gets its own line under the ‹ (like an action does).
  - **Results / end game:** the place column ("1st") is never narrower than its word. **Loading**'s title fits like the
    others.
  - **HUD:** a Bar with a width keeps its plate `fit-content` — a corner's least is its bars at 2rem with names whole,
    so it gives way to the middle at every text size (F147's `data-big-text` is gone: this covers it). A bar with its
    name beside it shortens, then moves under the name. ConnectionDot: a word too long for the room beside the dot
    breaks inside the chip.
  - **The page check** accepts a word that breaks where its part already went all the way: a title at body size
    (`data-fit="split"`), a stacked ◀ ▶ picker, or a part marked `data-ui-split-ok`.
- **Hand-over for the Goops session (F103, 2026-10-20)** — the three kit nits it logged are fixed; proven in a scratch
  copy (`.scratch/goops-f103`, `e2e/f103-proof.mjs`, portrait only). To take them, on a Goops work branch:
  1. Update the kits: `node ~/.claude/config/bmuz/scripts/install-module.mjs ui-kit .` (0.17.1 → 0.25.0) and
     `… install-module.mjs devkit .` (0.18.0 → 0.21.0); then `npm run check:ui`, tests, build.
  2. `src/ui/App.tsx`: drop `...kitScreens` from the three screen lists (and from the import) — the stack has them now.
     Machine bars: `<Bar … width={… bars.machineWidth} atMost …>`; the HUD: `<Hud … dockTight />`.
  3. `src/ui/app.css`: delete the `.hud-machines > .kit-bar { … }` rule and the `.kit-hud-dock > .kit-panel:has(.hud-panel) { … }`
     rule (+ their comments); keep `.hud-machines { flex-wrap: nowrap; }`. check:ui's 2 warnings go.
  3b. `content/ui/style.json`: add `"orientation": "portrait"` (UI kit 0.26.0) — check:framework then never checks
     Goops sideways.
  4. `content/devkit.json`: leave `pauseBadgeSpot` out (= "left", clear at 390 and 360) — or pick "left" / "right";
     check:framework names the clear spots if the HUD changes. ("top", where Dev Kit 0.18.0 drew it, covers CRACKS.)
  5. Goops' adapter has no `conformance.startPlay`, so check:framework's play checks have never run on it. Add one
     (the scratch's: `query: '?rank=6'`, mark the lessons seen via `window.__goopsSeen`, click Start shift, wait for
     `status === 'playing'` and no `.kit-art-stage`, up to 25 s) — all 10 Dev Kit checks then pass. Its own
     `check:framework` script (`check:ui && check:devkit`) is worth pointing at `node src/devkit/check-framework.mjs`.
  6. The version module replaces Goops' own copy: `… install-module.mjs version .`, then `versionPlugin()` in
     vite.config.ts instead of the `goops-version-meta` plugin + the `GOOPS_VERSION` define; `src/version.ts` → import
     `versionLabel` from `./version` (keep `content/text/en.json console.version` only if its words differ from "vX.Y.Z.B");
     `e2e/start.mjs` `expectedVersion` / `checkVersion` → `src/version/e2e.mjs`; `GOOPS_BUILD` → `VERSION_BUILD`
     (e2e/sw-update.mjs); deploy.js → `builtVersion()`; `<Settings version={versionLabel}>` (and drop About → Version's
     `info`). The console footer is Goops' own (no MainMenu) — the version check's "menu" line may need a known gap.
  7. Left for Goops to decide (not kit bugs): at 360×780 "CONTROLS" ends ~1–2 px from the dock's angled art frame
     (the panel box has room; the visible frame doesn't) — the same as today — so a shorter label, a smaller bar-name
     size on narrow phones, or a frame inset. Its credits.json lacks the art + fonts and two fonts have no licence 🔴.
  Not from F103 but seen on the way: audio 0.2.1 has no checks (update it), `content/credits.json` misses public/art and
  public/fonts, and two fonts in the font library are 🔴 (no licence) — check:framework's UI kit part fails on them.
- `npm run shoot` — screenshots of every screen in every style at phone / landscape / desktop, with what's wrong on each
  (`SHOOT_PORT=5281` when 5180 is busy; it stops if a file changes while it runs — 0.33.3). **200% text (F144):** every
  gallery screen in Clean at 200% text, on a 390×844 phone and an 844×390 phone on its side
  (`screens/<id>-clean-phone-text-200`, `…-clean-phone-landscape-text-200`; Settings opens on its Accessibility tab) —
  90 shots added (it was 656 shots in 615 s, now 745 in 695 s, about 1½ minutes more). **And the 18 key screens at
  200% in the 6 other looks (F146)**, both phones (`screens/<id>-<look>-phone[-landscape]-text-200`): 216 shots more,
  961 in 918 s (about 3½ minutes more). The looks share one layout, but not one font — a wider font (Cozy, Pixel,
  Fantasy, Neon) broke words and buttons at 200% where Clean's fit, so every look is shot.
- `npm run shoot:webkit` (F148) — the same check in **WebKit, the engine every iPhone browser uses** (Safari, and Chrome
  on iPhone too). Playwright's own WebKit, never your Safari. Only the 18 key screens, in all 7 looks, on a 390×844
  phone upright and an 844×390 phone on its side, at 100% and 200% text, plus the screen-stack and menu checks on the
  phone: **504 shots in about 11 minutes** (669 s on the PC). Saved to `screenshots-webkit/` (git-ignored) with the
  same names as the Chromium shots, so a pair can be opened side by side. Same problem list, same `knownShots`.
  - Run it after a change to the kit's CSS, fonts or anything that measures or places things (fit, bubbles, pickers),
    and before a release that will be played on iPhones. `SHOOT_PORT=6160 npm run shoot:webkit` when 5180 is busy.
  - It doesn't replace `npm run shoot` (Chromium: every screen, desktop, the small phones), and the Chromium run is
    unchanged by it.
  - A screen that never shows in 30 s is a problem on the list ("stalled", with a `…-stalled.png` picture of what the
    page showed) instead of ending the run — this happened once in WebKit after ~145 shots and didn't happen again.
  - **`npm run compare:engines` (F149)** — the checker can't see an engine difference (it judges each shot alone), so
    every shot of both runs also writes a small layout file (`<shots folder>/layout/<shot>.json`: each text's line
    count, each kit part's size — one page read per shot, the Chromium run takes the same time). The compare lists, for
    every shot both runs took, each text on a different number of lines (**WRAP** — fix it or accept it in
    `acceptedWraps` with its reason) and how many parts differ in size by more than 1 px (`--sizes` lists each). It
    ends with 1 while a wrap differs that isn't accepted. Run both shoots first. `npm run compare:engines -- <folder A>
    <folder B>` compares any two runs instead (a copy of `screenshots/` from before a kit change and `screenshots/`
    after it: what the change did to Chromium's own layout).
  - `SHOOT_ONLY="<pattern>"` (either run) takes only the shots whose name matches, e.g. `SHOOT_ONLY="room-pixel"` — a
    quick look while fixing; the full run is still the check. A reveal's list (payslip, victory) is shot once its
    smooth scroll to the last row has stopped (F149: it was caught part-way, at a different spot each run).
  - The checker itself (`kit/uiProblems.mjs`) works in WebKit: `UI_ENGINE=webkit npx vitest run kit/uiProblems.test.mjs`
    runs its tests there (all pass).
  - **What WebKit on Windows can't tell you about a real iPhone** — still a look on a real phone:
    - **Font weights.** Windows WebKit lays text out at the right weight but DRAWS variable fonts (Nunito, Fredoka,
      Exo 2, Orbitron, Cinzel, Alegreya) at their thinnest default — bold labels look thin in these shots. Widths and
      wrapping are right; how heavy the text looks isn't. An iPhone draws them properly.
    - **Emoji and symbol characters** (⚙ ❤ 🪙…) come from Windows' emoji font, not Apple's: different pictures, and
      `U+FE0E` (text look) is ignored. Since 0.35.5 the kit's boxes keep their size whatever draws them.
    - **Text widths are a hair different** (a fraction of a px per word): Apple's fonts and text drawing aren't on
      Windows, so a label that fits "by 0.03 px" may wrap on one and not the other — a sign the layout has no slack.
    - **No safe areas** (the notch, the home bar, rounded corners), no Safari address bar sliding in and out, no
      on-screen keyboard pushing the page up, no real touch scrolling or bounce, and no iOS "Larger Text" setting
      (the 200% shots set the page's text size, the closest stand-in).
    - Speed: animations and smooth scrolls run at the PC's pace — a shot can catch a reveal's scroll still moving.
- A change to `kit/` → bump `kit/VERSION` (and CATALOG.md when a part or screen changes).
