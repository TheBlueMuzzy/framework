# Game UI kit

Every screen a game needs (menus, HUD, pause, settings, results, lobby…) built from one set of parts, in five styles —
Clean · Cozy · Cartoon · Pixel · Neon — picked per game in `content/ui/style.json`. React, no runtime dependencies.
Kit **0.20.0**. What's in it, part by part and screen by screen: **`CATALOG.md`**. The game-ui skill builds games'
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

## How it's checked — `npm run check:framework`
The Dev Kit's runner (`src/devkit/check-framework.mjs`) runs this kit's `kit/conformance.mjs` on the game:
| Check | Fails when |
|---|---|
| the game's UI code keeps the kit's rules (check-ui) | `check-ui.mjs` (with the game's own `check:ui` arguments) finds raw colours, px, fonts, inline styles, stray positioning |
| check-ui runs in check:fast | the game has no `check:ui` script |
| every Settings row that's switched on is read by the game | (0.20.0) a row in `content/ui/settings.json` shows in Settings but nothing in the game's own code reads its id (`values.tips`, `id === 'resetTips'`, `info={{ version }}`) — or a link row opens a placeholder address. Skipped: headings, rows with `"on": false`, text size + reduce motion (the kit applies them), links, info rows with their own text, and the Audio rows once the game passes the values to `applyAudioSettings` |
| nothing overlaps | two shown things sit on top of each other (text over text, a control over text) — not when one holds the other, or both are under a dialog |
| nothing is clipped or wider than the screen | a control is cut off at the edge of a box that hides overflow or sits past the screen edge (outside anything that scrolls), text is cut off, or the page is wider than the screen |
| every tap target is at least 44 px | a shown button / link / switch / tab / slider / box is under 44×44 |
| no focus ring without the keyboard | a focus ring shows on the first screen without any key pressed |
The browser checks open the REAL game at 390×844 · 360×780 · 844×390 · 768×343 · 1100×800 · 1440×900 · 1920×1080, on its
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
  nothing (Glyphtender once shipped 12). Runs with `--static` too, so `check:fast` catches it.
- `npm run shoot` — screenshots of every screen in every style at phone / landscape / desktop, with what's wrong on each
  (`SHOOT_PORT=5281` when 5180 is busy)
- A change to `kit/` → bump `kit/VERSION` (and CATALOG.md when a part or screen changes).
