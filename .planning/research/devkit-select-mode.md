# Dev Kit Select Mode — discovery (2026-10-14)

Muzzy: "This functionality makes Dev Kit incredibly strong." ·
"My goal is the simplicity of click on a thing > see the attributes associated with it compiled in one place > update those things and hit save."

## The feeling it serves
Experience targets (players = Muzzy tuning his own game):
- "I see something I don't like, I click it, and everything that changes it is right there."
- "I never have to remember which file or tab a value lives in."
- "I can keep playing while the thing I picked stays in my panel."

## Settled with Muzzy (2026-10-14, framework ROADMAP Ideas)
- A **Select** tab toggles select mode: hover = thin pink outline, click = thick pink outline. A transparency slider for the
  outline at the top of the tab, saved in the Dev Kit's own settings.
- The selection gathers knobs ACROSS tabs (Tuning · Text · Colours · Sound) into one list that **stays after select mode
  is off** — play and tweak live.
- **No freeze.** Things that flash by (score pops, a flying seed, callouts) → a collapsible **"recently on screen"** list.
- **No "select parent".** Tags are written by MEANING on what you see (the glyphling lists "lift height" even though a drag
  copy is what lifts).
- **3D later** (raycast picker + 3D outline, same tab, other picker) — plan for it, don't build it.
- Big things (a zone, the board) touch dozens of values → a **short chosen list per object, grouped by section**.
- Same editors, same files — one source of truth. Outline in its own layer (never shifts layout).
- Smallest version: Select tab + outline + slider, 10–15 tagged objects, the recent list.

## Decisions made while Muzzy slept (Claude, 2026-10-14 — Muzzy said "start with these, expand as we prove it out")
- **Object list = the 14 in the table below** (Muzzy: "I think we can start with these").
- **Where the object → knobs lists live: a content file Muzzy owns** (`content/devkit/select.json`), not tags in code.
  The code only marks WHAT a thing is (`data-devkit="glyphling"`). The panel gets **"+ add knob"** so a missing knob is
  added while playing — the list fixes itself over time. A check fails on a knob naming a key that doesn't exist.
  Ask Muzzy: OK with this? (Recommended in chat; he didn't object.)
- **Game rules stay out of Select** (bonus points, hand size…): they don't belong to any one thing you can see. "+ add
  knob" can still add one if Muzzy wants it. Ask Muzzy: agree?

## Starting object → knobs map (Glyphtender)
| Object | Knobs (grouped) |
|---|---|
| Glyphling | Look: size, team colours · Drag: lift size, shadow, lift/land time, lift height · Move: speed, per-hex, settle, hop |
| Seed in the tray | Look: size, shine · Tray: tile min, gap · Flight: speed, arc · Grow: time, from |
| Planned seed | look, mist, moon shadow/light, stencil, ghost opacity/glow |
| Hex / board | background, hex fill, line colour/width, glow, drop highlight, margin |
| Grown word | border colour/width, glow strength, glow time, pulse time |
| Spotlight label | colour, size, min size, hold, fade |
| Score pop | colour, size, delay, gap, pop/hold/fly, feel tier |
| Score total | size, hold, fade, grow, max grow, feel tier |
| Vine / tangle | vine colour/width, tangled dim, warning width/dash, blink time |
| Tray | reorder style, make room + time, tray leave, refresh timings |
| Turn indicator | pulse time, feel tier, side panel width |
| Sprout's tip | tip seconds, delay, tips per turn, idle glow, callout room, its text |
| Award ribbon | ribbon colours, size, carousel timing |
| End reveal | reveal timings, pop colour/size, zoom, music cues |
Plus each object's own Text lines and Sounds.

## Reference points
- Browser devtools element picker (hover outline → click → panel shows the element's styles across sources).
- Unity Inspector (select in scene → every component's fields in one panel) — the "one place" Muzzy wants.
- Figma's selection → right panel; "select matching layers" ≈ "affects all 8 glyphlings".
- Leva / Tweakpane folders — the grouped-by-section list.

## Directions considered
1. Tags in code (`data-devkit="anim.glide feel.landing"`) — Claude maintains; Muzzy can't grow it. ✗ (rigid)
2. **Object marker in code + knob lists in content JSON + "+ add knob"** — ✓ chosen.
3. Auto-track which values a component reads (proxy on the tuning object) — magic, lists hundreds of shared values,
   misses meaning-based tags. ✗ (but could later SUGGEST knobs to add).
