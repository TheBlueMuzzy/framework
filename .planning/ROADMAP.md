# Game Framework — Roadmap
Release target: prototype — musts 5/6 done

## v0.1 — Game UI kit  ← current  (→ prototype)
Goal: any game can get good-looking, standard menus, settings, dialogs and HUD in one of 5 styles, built passively by the `game-ui` skill. Design: `design/ui-kit.md`.
- ✅ F01 🧱 Parts + style engine — must:prototype · sprint 1
  what: 5 layout boxes (Screen, Panel, Stack, Row, Grid), the controls, style.json → CSS variables at runtime, accessibility floor, preset test
- ✅ F02 🎮 5 style presets (Clean, Cozy, Cartoon, Pixel, Neon) — must:prototype · needs: F01 · sprint 1
  why: one structure, many skins → every game looks finished from day one → less look-and-feel back-and-forth
- ✅ F03 🧱 Screen stack + transitions — must:prototype · needs: F01 · sprint 1
- ✅ F04 🎮 Built screens: menu, list-driven settings, pause, dialogs, loading, flow/results, lobby, HUD frame + pieces — must:prototype · needs: F01, F03 · sprint 2
- ✅ F05 🔧 Gallery app (every catalog entry × every preset; phone + desktop screenshots; style switcher) — must:prototype · needs: F01, ~F04 · sprint 2
- 🟢 F06 🧱 `game-ui` skill + recipe catalog + wiring into /develop and /define — must:prototype · needs: F04, F05
- ⏳ F07 ❓ Try it: pick a game + a real screen to rebuild; adjust from what we learn — needs: F06

```mermaid
flowchart LR
  F01[✅ F01 Parts + style engine] --> F02[✅ F02 5 presets]
  F01 --> F03[✅ F03 Screen stack]
  F01 --> F04[✅ F04 Built screens]
  F03 --> F04
  F01 --> F05[✅ F05 Gallery]
  F04 -.working.-> F05
  F04 --> F06[🟢 F06 game-ui skill]
  F05 --> F06
  F06 --> F07[⏳ F07 Try it on a game]
```

## Later
- 🔧 Theme Tuner sliders in the Dev Kit (playground-style) — should
- Unity twin: sinanata UI Toolkit design system + same layout classes, screen stack, catalog names, style.json — should (when a Unity game needs UI)
- Textured extras (Kenney CC0 9-slice panels) — could
- Dark console + Fantasy presets — could
- Next modules (BMUZ-PLAN step 2): inventory all projects for candidates — Roll Better's online rooms, drag-to-zone, physics dice

## Ideas
- 2026-09-28 — UI kit nitpicks to fix when a game uses them: Mode select leaves an empty 4th column on desktop · toasts briefly cover the gallery bar · gamepad-only games show the focus ring only after the first key press · does VT323 still feel "Pixel"? · "Accessibility" breaks mid-word in ◀ ▶ at 200%
