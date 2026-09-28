# Game UI Kit — design (approved 2026-09-28)

Muzzy's brief: a **passive** helper (like `frontend-design`) that builds game UI whenever a game needs it; a **super-basic structure** with **a few key styles** applied on top, chosen per game; covers **all the known, common** screens. First attempt: we try it on the next game that needs UI, then adjust.
Research behind it (in `~/.claude/config/bmuz/reviews/2026-09-28-ui-kit/`): `research-inventory.md` (15 kits + Game UI Database), `research-platforms.md` (Godot, Unity, Roblox, Unreal, shadcn, daisyUI, frontend-design), `../2026-09-28-skill-review/review-ui.md`.

## 1. The one idea
Every engine and every popular kit does the same thing: **one structure, many skins.** Screens and controls know *what* they are and *how they behave*; one style file decides *how everything looks*. Swap the style file → the whole game restyles. Layouts never change between styles.

## 2. Three layers
```
STYLE      content/ui/style.json  ← the only thing that changes per game (preset + your tweaks)
             ↓ paints
SCREENS    Main menu, Settings, Pause, Results, Lobby, HUD…   (built only from the parts below)
             ↓ made of
PARTS      layout boxes (Screen, Panel, Stack, Row, Grid) + controls (Button, Slider, Toggle…)
```
- **Parts** contain no colours, sizes or fonts — only names like "primary", "gap: medium", "title text".
- **Screens** are arrangements of parts. Add a row to Settings → it just appears, spaced correctly.
- **Style** fills in the names: colours, fonts, corner shape, borders, depth, motion, UI sounds.

## 3. Styles
Research found 7 style families that every kit maker repeats. Starting with **5 presets**, all with the same settings so any game can switch in one line:

| Preset | Feels like | Shape · font · motion |
|---|---|---|
| **Clean** | minimal / flat — the neutral default | medium corners, clean sans, quick fades |
| **Cozy** | paper, warm, wholesome | round, soft shadows, rounded font, gentle float |
| **Cartoon** | casual mobile, party | chunky pills, thick outlines, heavy rounded font, bouncy pop |
| **Pixel** | retro / 8-bit | square steps, pixel font, hard shadows, no easing |
| **Neon** | sci-fi, dark | chamfered corners, thin glow lines, techno font, flicker-in |

Later, only when a game asks: **Dark console** and **Fantasy** (fantasy needs textures).
**Textures are an optional extra** on any preset (e.g. Kenney CC0 wood/stone panels via 9-slice). The flat look always works without them.
**Per game:** `content/ui/style.json` = `{ "preset": "cozy", "tweaks": { "accent": "#e07a5f", "corners": "rounder" } }`. You edit it in Obsidian/Dev Kit or just say "rounder, more orange". Real art later = add textures/fonts, no screen code changes.
**Accessibility floor sits outside the styles** so no preset can break it: text ≥ 18px on phones and PC, 4.5:1 contrast (tested for every preset), 44px touch targets, visible focus ring, text scales to 200%, reduce-motion respected.

## 4. What it covers (the catalog)
Every known, non-niche screen gets a catalog entry. Two kinds, to stay lean:
- **Built** — ready-made, tested, shown in the gallery (the CORE set every game needs).
- **Recipe** — a short entry (parts list + sketch). The skill builds it from parts the first time a game needs it, then it becomes Built. Nothing speculative gets coded.

**Built (v1)**
- Front end: title/main menu · settings (tabs from a list) · how-to-play pages · credits · mode select
- In game: pause · HUD frame (safe corners: vitals top-left, pause + currency top-right, timer/score/turn top-centre, actions bottom, banners centre)
- Flow: loading · transitions · countdown 3-2-1 · round intro · results/scoreboard · victory · game over · post-game (rematch / lobby / quit)
- Online: lobby (create / join by room code / players / ready) · reconnecting / error
- Dialogs & feedback: modal · confirm (destructive in danger colour) · toast stack · tooltip · reward popup · empty state · spinner
- HUD pieces: bar (health / xp / timer / segmented pips) · counter with +N float-up · score & combo · timer ring · turn banner · player seats with active highlight · rank · pause/settings chrome · connection dot
- Controls: button (primary / secondary / ghost / danger / icon / loading) · toggle · slider · **◀ option ▶ selector** (the game control web kits lack) · tabs · stepper · text + room-code input · list row · card · badge · avatar · progress bar · scroll area

**Recipes (built on first use)** — difficulty select · level/stage select · world map · save slots · character/player select · name entry · language select · privacy/consent · dialogue + choices · tutorial coach-mark · button prompts · inventory grid + item detail · quest log · stats sheet · leaderboard · profile card · achievements · friends + invite · quick chat · shop + confirm purchase · daily reward · rewards/XP tally · feature-unlocked · context menu

**Not covered unless a GDD asks (niche):** battle pass, gacha, roulette, clans, skill trees, crafting, weapon wheels, minimap/compass, targeting, virtual joystick.

**Settings** is list-driven: `content/ui/settings.json` lists the rows; the screen draws them. Standard tabs: Audio (master/music/sfx/voice) · Display · Controls · Gameplay (difficulty, speed, tips) · Accessibility (text size, reduce motion/shake, colour-blind, high contrast) · Language · Account/Privacy · About (version, credits, reset progress → confirm). A game switches rows on/off; it never hand-builds a settings screen.

## 5. How it behaves (the passive skill: `game-ui`)
Kicks in on its own whenever a game needs a screen, panel, button or HUD piece, or when UI looks off or breaks on a phone. `/develop` also calls it by name for any UI task.
1. **Style chosen?** If the game has no `style.json`: show the gallery in all 5 presets (phone + desktop screenshots) and suggest one with an MDA reason ("Cozy — warm and forgiving, fits the relaxed pillar"). You pick; it's logged in the TDD. *The only time it asks you anything.*
2. **Kit in the game?** Copy it into `src/ui/kit/` (or update it — shows what changes).
3. **Plan first:** which catalog entries + a quick sketch. Only style names, never raw colours or sizes.
4. **Build from the catalog.** Recipe → build it from parts, add it to the kit as Built.
5. **Missing a part?** Add it to the kit (generic), never as a one-off in the game.
6. **Enforce:** no raw colours, px sizes, absolute positioning or stray fonts in game UI code — checked before showing you anything.
7. **Verify:** screenshots at phone portrait, phone landscape and desktop; look at each; no overflow, targets ≥ 44px, Back/Esc works. Then hand off.
8. **Improvements flow back** to the shared kit (version bump), so the next game starts better.

## 6. Engineering calls (Claude's — logged here, open to your pushback)
- **Web: plain React + plain CSS variables, no Tailwind, no component library.** Native browser dialogs/popovers where they work; a small headless helper only if one control truly needs it. Reason: "super basic" and human-readable — one styling language, nothing to learn. *(Changes the earlier shadcn recommendation: shadcn brings Tailwind as a second styling language and its look, not just structure.)*
- **Style applied at runtime on web** (the JSON sets CSS variables) → live tweaking in the Dev Kit with no rebuild.
- **Screen stack:** one small store — open/close/replace; only the top screen takes input; Esc / gamepad B / phone back closes it; modals are just screens on top.
- **Size budget:** web kit ≤ ~1,000 lines incl. CSS for v1. Every file readable top to bottom.
- **Unity: later**, when a Unity game needs UI — adopt the free sinanata UI Toolkit design system for controls, add the same layout classes, screen stack and catalog names, and read the same `style.json`. Same catalog, same presets, two platforms.
- **Tests:** every preset has identical settings names and passes contrast (automatic test); gallery screenshots are the visual check.

## 7. Where it lives
- **`dev/framework/ui-kit/`** — the kit's home: parts, screens, 5 presets, the **gallery app** (every catalog entry × every preset, with a style switcher — also the Theme Tuner seed), tests. Needs its own repo because building and screenshotting a kit needs a small runnable app. This starts the Game Framework (BMUZ-PLAN step 2) with its first module. Private GitHub repo; on a machine without it, the skill clones it.
- **`~/.claude/skills/game-ui/SKILL.md`** — the passive rules (§5). Short. Syncs with BMUZ as usual.
- **In each game:** a copy in `src/ui/kit/` + `content/ui/style.json` + `content/ui/settings.json`. Games build on their own (GitHub Pages, other machine) without the framework present.

## 8. Build plan (feature map)
```
F1 🧱 Parts + style engine (5 layout boxes, controls, style.json → CSS variables, accessibility floor, preset test)
 ├─ F2 🎮 5 presets (Clean, Cozy, Cartoon, Pixel, Neon)                        needs F1
 ├─ F3 🧱 Screen stack + transitions                                           needs F1
 │   └─ F4 🎮 Built screens: menu, settings (list-driven), pause, dialogs,    needs F1, F3
 │        loading, flow/results, lobby, HUD frame + pieces
 ├─ F5 🔧 Gallery app (every entry × every preset, phone/desktop screenshots)  needs F1, ~F4
 ├─ F6 🧱 game-ui skill + recipe catalog + wiring into /develop and /define   needs F4, F5
 └─ F7 ❓ Try it: pick a game + a real screen to rebuild; adjust from what we learn   needs F6
Later: 🔧 Theme Tuner sliders in the Dev Kit · Unity twin (sinanata) · textured extras (Kenney) · Dark console + Fantasy presets
```

## 9. Decisions (Muzzy, 2026-09-28)
- The 5 starting styles: Clean, Cozy, Cartoon, Pixel, Neon — OK.
- `dev/framework/` private GitHub repo for the kit + gallery — OK.
- Nothing missing from the Built list for now.
