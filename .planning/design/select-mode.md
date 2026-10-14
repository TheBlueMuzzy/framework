# Dev Kit Select Mode — design (framework v0.8, defined 2026-10-14)

Discovery + Muzzy's calls: `research/devkit-select-mode.md`. Muzzy's goal: **click a thing → see its knobs in one place →
change them → Save.**

## What Muzzy sees
- A **Select** tab (first tab, only when the game has `content/devkit/select.json`).
  - **Select mode** button (on/off). On: hovering the game draws a thin pink outline + the object's name; a click/tap
    PICKS it (thick pink outline; other copies of the same thing get a dashed outline — "affects all 8 glyphlings").
    While on, clicks never reach the game. Closing the Dev Kit turns select mode off; the pick stays.
  - **Outline** slider (how see-through the outlines are) — saved per game in the browser (`devkit-select:<game>`), with
    the pick, so both survive a refresh.
  - The **picked object**: name, help line, "N on screen", ✕ to clear, Copy for Claude.
  - Under it, **its knobs, grouped by its own sections** (Look · Drag · Move…), using the REAL Tuning / Text / Sound
    editors (the same mounted tabs, filtered — one source of truth: an edit here is the same edit in the Tuning tab, and
    each block keeps its own Save).
  - **+ Add a knob**: search every tuning setting, text line and sound → choose the section (or a new one) → it's added
    to this object in `content/devkit/select.json` (saved at once in dev; Copy for Claude in a live build). Each knob
    row in the picked view has a small ✕ to take it off the object.
  - **Recently on screen** (collapsible): every object seen while the Dev Kit was open, newest first ("on screen" /
    "4 s ago"), then the never-seen ones greyed — tap one to pick it without clicking the game. This is how fast things
    (score pops, a flying seed, callouts) are picked — no freezing.
  - Problems in the file (a knob naming a key that doesn't exist) are listed in red at the top.

## content/devkit/select.json (the game's, Muzzy owns it)
```json
{
  "_help": "…",
  "objects": {
    "glyphling": {
      "label": "Glyphling",
      "help": "A player's piece on the board.",
      "find": "optional CSS selector — only for things the game can't tag (kit parts)",
      "knobs": { "Look": ["garden.pieceScale", "garden.yellow"], "Drag": ["drag.liftScale"] },
      "text": ["explore.glyph"],
      "sounds": ["glyph.step"]
    }
  }
}
```
- Knob ids: tuning `<file>.<path>` (a group key brings all its settings, like `_sections`) · text = en.json dotted key
  (a prefix brings the whole branch) · sounds = audio.json sound names. UI style colours: later (Glyphtender's colours
  are tuning keys).
- Objects are found on screen by **`data-knobs="<id>"`** on the element the player sees (written by MEANING — the
  glyphling lists "lift height" even though a drag copy lifts), or by `find`. Several ids allowed, space-separated.

## How it's built (devkit kit/select/)
- `selectMap.ts` — read the file (import.meta.glob, like tuningFiles), types, the pick for an object, add/remove a knob,
  **checkSelectMap** (unknown keys) — pure, tested.
- `domPicker.ts` — the DOM picker: every visible tagged element whose box contains the point; the SMALLEST wins (a
  glyphling over the board). Geometry, not hit-testing — many game overlays are `pointer-events: none`. Visible =
  `checkVisibility` with opacity (an invisible leftover score pop never counts).
- `selectStore.ts` — one small store (mode, pick, outline, seen times) shared by the tab, the layer and DevKit.
- `SelectLayer.tsx` — the outline popover (its own top-layer box, pointer-events none — never shifts layout), the
  capture-phase pointer/click catcher while select mode is on, a requestAnimationFrame loop that moves the outlines
  (refs, no React state per frame), and the "seen" scanner (MutationObserver + a 300 ms scan while the Dev Kit is open).
- `SelectTab.tsx` + `select.css`.
- DevKit.tsx: while the Select tab is open with a pick, the Tuning / Text / Sound panels are shown under it, each
  inside a `DevKitPick` context saying which of its items to show and in which sections.
- **3D later:** a picker is "point → object id + an outline box"; a Three.js game adds a raycast picker with the same
  shape. Not built.

## Rules
- A game-side test (Glyphtender `src/devkit-game/select.test.ts`): checkSelectMap finds no problems, every object is
  findable (a `data-knobs` in src or a `find`), every `data-knobs` in src is in the file.
- BMUZ checklist: a new tunable thing → tag its object + add the knob to select.json.
