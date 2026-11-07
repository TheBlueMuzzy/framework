# The module recipe — how parts move between games and the framework

F188 — Module recipe · 2026-11-05 · built from the 2026-11 audit (`research/audit-2026-11/framework.md`, approved by Muzzy).
One page. If a step here and another doc disagree, this page wins and the other doc gets fixed.

## 1. Three kinds of things in the framework
| Kind | What it is | Today |
|---|---|---|
| **Brick** (a module) | Something a game copies in and a player could name: "does this game have menus? online play? a computer player?" | UI kit, Dev Kit, Audio, Version, Lint, Table, Rooms, AI, Crashes, Saves |
| **Plumbing** | The tools that move bricks in and out of games | `install-module.mjs` + each brick's installer · version stamps (`VERSION`) + `UPGRADES.md` · "updates available" at session start · `extract.mjs` (the way out) · `npm run install-modules` in the starter |
| **Quality gate** | The checks that prove a brick works, before and after it moves | each brick's tests · its conformance pack (`check:framework` in a game) · `starter-check` (the brick played in a real little game) · the game's own `check:full` · GitHub's Checks |

## 2. What counts as a brick
- **Structure, not rules.** A brick is the lattice a game's rules hang on (menus, turns, rooms, saves). A game's rules never become a brick. (BMUZ-PLAN "Framework decisions")
- **Named by a player.** Too small to name ("a button") = a part inside a brick, not its own brick.
- **Proven, never guessed.** One real game proves it; a **second** game makes it general. A brick only one game uses is **frozen**: bug fixes only, no new features, until a second game needs it. A brick no game uses is archived (a git tag keeps it). (The audit found Emotes and half of Saves built ahead of any game, and archived them.)
- **Presets on top of flexibility.** Every brick works with one line for the common case — so a game is never harder to make with it than without it (the inner-platform test: the Nim game took 7.5 minutes from the starter).

## 3. The way out — a game's part becomes a brick
**When:** only when a **second** game needs something the first game already built (or Muzzy asks for it). A part one game uses stays in that game.
1. **List it** — the game says what it has that the other game needs (F189 — Games list module candidates does this for Glyphtender + Goops). When Muzzy asks for a module, list the **blocks** it would hold (already in the framework · to add · stays in each game) and ask "is this the toolbox you picture?" before any verdict (v0.39 look-back: the F197 — Tutorial trial verdict judged "move a game over" when he meant a toolbox each game picks from).
2. **Check it against §2** — structure? named by a player? used by two games? If not, it stays in the game.
3. **Queue it** — in the game: `node ~/.claude/config/bmuz/scripts/extract.mjs add <files> --what="…" --checks=<the game's scripts that prove it>`. Its files in the game are now bug-fixes-only, each fix logged (`extract.mjs fix`). ① (guard-edits warns on an edit to a queued file)
4. **Build the brick** in the framework, on a work branch: `kit/` + `VERSION` + an installer + README + `UPGRADES.md` + tests + its conformance pack; wire it into the starter so `starter-check` plays it. Its commit says what it replaces ("Replaces: Glyphtender's own …"). ② (F187 — Bloat test both ways: git's commit step asks for the "Replaces:" line)
5. **Release it** — `extract.mjs status <id> released <brick>@<version>`; `npm run check:fast` green in the framework.
6. **Swap it into the first game** — `extract.mjs swap <id>`: installs the brick, points the game's imports at it, deletes the old files, runs the game's own checks unchanged. Red → the game goes back exactly as it was. ① Rehearse first: `extract.mjs swap <id> --rehearse` in a throwaway clone of the game does the same swap there and records nothing (F202 — Swap rehearsal mode). ①
7. **Install it in the second game** — the way in (§4). Now two games use it: it isn't frozen.

## 4. The way in — a brick goes into a game
- **A new game** starts from the starter: copy `starters/turn-based`, `npm install`, `npm run install-modules`, its `check:full` green before changing anything (/sprint step 5). Every brick arrives wired.
- **An existing game** takes a brick or an update with `node ~/.claude/config/bmuz/scripts/install-module.mjs <brick> <game>`: the brick's own tests first, a dry run, the install, the game's lint, then its conformance pack. ①
- **Updates:** session start says when a game's bricks are behind ①. Several versions behind → rehearse the whole catch-up on a throwaway copy first (`.scratch/<game>-catchup`), fix what the framework got wrong, then the game's sprint (/sprint step 7).
- **When:** games take updates only when they're not paused (today: paused until v0.37 is done — STATE Key facts).
- A brick's wiring promises (live tuning, the two clocks, pause…) are in `~/.claude/config/bmuz/MODULE-CONTRACTS.md`; `check:framework` checks them in the game ①.

## 5. What proves it — at every step
| Step | Proof |
|---|---|
| Brick built | its tests + type check + lint (`npm run check:fast`) · played in the starter (`starter-check`) |
| Brick installed in a game | `install-module.mjs` (module tests, game lint, conformance pack) · the game's `check:full` |
| Swapped out of a game | the game's own checks, unchanged, green before and after (`extract.mjs swap`) |
| Still earning its place | used by 2+ games (the README's "Used by" column) · the monthly /checkup removal pass (F187 — Bloat test both ways) |

## 6. Never
- A brick no game uses ("we'll need it later") — build it in the game that needs it, extract when the second one does.
- A game editing its copy of a brick — fixes go in the framework, then install ① (guard-edits refuses edits in a game's kit copy).
- A starter that carries stale copies — it commits only its own game; bricks are installed fresh (F186 — Slimmed framework).
- An addition that doesn't say what it replaces, or a removal without a reason (consolidating, efficiency, never used) — BMUZ-PLAN's bloat test.
