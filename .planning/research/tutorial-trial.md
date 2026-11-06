# F197 — Tutorial trial: can one tutorial system teach both games?

Sprint 62 · 2026-11-06 · done on a throwaway copy of Glyphtender (`~/Documents/dev/.scratch/glyphtender-tutorial-trial`), the real games untouched.

## In plain words
- Goops' "lesson player" (the part that plays a tutorial step by step from a data file) was copied into a copy of Glyphtender **without changing a single line of it**.
- Glyphtender's first 3 tutorial messages ("Drag your glyphling to the bright hex", "…your second glyphling…", "Glyphlings move in straight lines") now come from a Goops-style lesson file and are played by that lesson player.
- Glyphtender's own tutorial test passed **unchanged**, with exactly the same results as before (470 checks, word for word). Its other two tutorial tests passed too.
- The phone and desktop screenshots of those 3 steps look the same. The only differences are a glyphling's glow caught at a slightly different moment of its "breathing", which also shows up on steps I didn't touch.
- But Glyphtender got **no smaller**. It needed a ~90-line connector, plus ~50 more lines so its old steps and the new player could hand over to each other. The player took over 3 step lines and gave nothing else back.
- The player is built for a game that runs in real time (timers, hints after a pause, slow motion). Glyphtender is turn-based, so most of the player's features sat unused.
- 8 things needed fixing by hand. One was a real gap: the player switches off a pause *before* the next step starts, and Glyphtender's "only this move is allowed" rule broke at that moment. That cost one round of fixing.
- **Verdict: (c) each game keeps its own for now.** The trial proves Goops' player is ready to become a framework part, so it gets pulled out the day a **new game** needs a tutorial. Rewriting Glyphtender's working tutorial today would add code and risk and give players nothing.

## Verdict
**(c) Each game keeps its own tutorial for now. Goops' lesson player is the proven future brick, extracted when a third game, or a rework of Glyphtender's tutorial, needs one.**

**Weighed:**
- **Why it's this way now:** each game built its tutorial for its own feel. Goops is real time: pauses, slow motion, hints after a wait, a lesson per unlock. Glyphtender is turn-based: each step is "what's true on the board right now", and the board rule allows exactly one move. Both work and both are tested (Glyphtender: 3 e2e scripts plus unit tests; Goops: runner + lesson tests).
- **Long term:** the trial is the "second game" proof the module recipe asks for. The player ran inside a very different game with 0 lines changed. So when a new game starts, the framework can hand it this player (548 lines + 381 test lines) instead of a third tutorial built from scratch. That's where the duplicated work is saved.
- **What studios do** (sources below): engines and web libraries ship a generic step player, and each game writes its own triggers and its own look. Unity's tutorial framework, Shepherd, Intro.js and driver.js all work this way. Small teams mostly hand-script their tutorial in the game. A shared player pays off once several projects use it.
- **Muzzy's goal (less duplicated work):** the two tutorials already exist, so merging them saves nothing now. It would just move Glyphtender's rules into a new shape. The saving comes with game #3, and this trial makes that a known, low-risk move.
- **The case against my pick:** waiting means Glyphtender's tutorial and Goops' player keep drifting apart, and a later extraction gets a little harder. Another option is to build the brick now from Goops alone. Against that: the recipe says a brick only one game uses is frozen. Glyphtender would only be a real second user after a full rewrite of its rails (estimated below), which adds lines and puts a polished, tested tutorial at risk for no player-facing gain. (b), a shared file format with each game's own player, is the weakest option: the player *is* the generic part, and the format has no use without it.
- **What would change the pick:** a new game that needs a tutorial; Muzzy asking for Glyphtender's tutorial to be redone (for example more steps or lessons per unlock, the things Goops' player already does); or the Dev Kit's Lessons tab (Goops only) becoming something he wants in Glyphtender.

## The numbers
All counts by `wc -l` (exact commands in "How it was measured"). "Lines" = lines in the file, comments included.

| | Lines |
|---|---|
| **Moved into a shared runner** (copied from Goops, 0 lines changed): `runner.ts` 392 · `lessonTypes.ts` 124 · `patterns.ts` 32 | **548** |
| …its tests, moved too (import paths only: 3 lines) | 381 |
| **Glyphtender's new game-only lines** (the connector + bridge): `railsLesson.ts` 89 (new) · `railsDirector.ts` +32 −3 · `railsSteps.ts` +31 −8 · `rails-opening.json` 38 (new) · `content/tuning/lessons.json` 13 (new) · `select.json` +2 −1 | **+192 / −12** |
| …Glyphtender's new / changed tests: `railsLesson.test.ts` 49 (new) · `railsSteps.test.ts` +4 −5 | +53 / −5 |
| Glyphtender's step code the runner replaced: the 3 step lines (draft1, draft2, lines) + 3 helper lines | 6 |
| **Left Goops-only** if the runner became a brick: `goopsLessons.ts` 437 · `goopsGates.ts` 75 · `LessonView.tsx` 72 · `Spotlight.tsx` 137 · `spotlightMath.ts` 39 · `lessonLine.ts` 46 · `StoryView.tsx` 72 · `storyMoments.ts` 155 · `firstDay.ts` 66 · `firstBreakdowns.ts` 55 · `unlockLessons.ts` 42 · `livedThrough.ts` 45 · `lessons.css` 117 | **1,358** (+ 1,015 lines of lesson files, + the Dev Kit `LessonsTab.tsx` 79) |
| **Left Glyphtender-only** (real game today, non-test `src/tutorial/`): rails 125 · railsCheck 128 · railsDirector 82 · railsSteps 159 · TutorialLayer 76 · tips/tipsPlace/tipsPlay 213 · nudges 108 · explore + ExploreLayer 385 · HelpLayer 218 · progress + start 123 | **1,617** |
| Hand fixes | **8** (list below) |
| Time | ~35 min from clone to all green (13:22 → ~13:57), of which the runner hookup + one bug round ≈ 20 min. Report ≈ 20 min more |
| e2e tutorial-rails, before → after | green → green, **470 ok both**, logs identical byte for byte (incl. every "px from the edge" number) |
| e2e tutorial-shell / tutorial-tips (after) | ALL PASS / all passed |
| Unit tests (after) | 90 files, 888 tests, all pass (the copied runner's 23 included) |
| Type check · lint · check:devkit · check:ui (after) | clean · 0 errors (1 old warning in `usePieceInput.ts`, not touched) · PASS · pass |

**Estimate, not measured: converting all 19 rails steps.** Glyphtender's later steps depend on board state ("moved but not aimed", "both seeds set aside", "after turn 2 scored"), have three button kinds (Next / Got it / Play), and point at things worked out from the hand (`handSeed`). Each would need a gate or event in the connector, a pointer word, and a button field in the format. My guess: connector ~200–250 lines + lesson file ~200 lines, with `railsSteps.ts` shrinking from 159 to ~60 (only the limits). Glyphtender would end up **bigger**, not smaller.

## Hand fixes (8) and Goops-only pieces
| # | What | Lines | Kind |
|---|---|---|---|
| 1 | Runner tests' import paths (`../../src/game/lessons/` → `./`) | 3 | path only |
| 2 | **Real gap:** while moving on, the runner lifts a pause (`hide()` → `setSpeed`) *before* the next step's `setup`. Glyphtender worked out the draft limit on every change, so at that moment it asked for the draft hex of a 3rd glyphling and threw ("No hex undefined"). The tutorial froze on draft2 (found by the e2e: `FAIL step lines`). Fix: the limit is worked out once, in `setup` (Goops' connector does the same) | ~15 (in `railsLesson.ts` / `railsDirector.ts`) | connector design |
| 3 | `betweenStepsSeconds` 0.5 → 0: the rails limit has to switch the moment a step ends, before Sprout or the player can act; Goops' half-second breath would leave the old limit on. `dismissArmSeconds` 0.4 → 0: Glyphtender's callout already waits `railsCalloutDelay` | 2 values | tuning |
| 4 | Button words: the runner has one kind of "waits to be closed". Glyphtender has Next / Got it / Play (Got it and Play also dim the screen). The trial uses "Next" for every pause (enough for `lines`); the full rails would need a `button` field in the format | 1 | **format gap** |
| 5 | Bridge for code that reads the step: the e2e and `TutorialLayer` read `useRailsDirector.step.target()`, `RAILS_STEPS` and `railsText()`. So the 3 lesson steps are also listed as normal rails steps (`when: () => false`: the runner picks them, not the list) | 20 | bridge |
| 6 | `railsSteps.test.ts`: the code-only walk no longer sees draft1 / draft2 / lines (now in `railsLesson.test.ts`); the draft limit comes from `RAILS_LIMITS` | 4 (+1 import) | tests |
| 7 | A new tuning file must be on the Dev Kit's Select list (`select.json`): a Dev Kit rule test caught it | 1 | Dev Kit rule |
| 8 | Type check: a `Record` lookup is always "defined" → an `in` check | 2 | trivial |

**Goops-only pieces cut, stubbed or adapted inside the runner: none.** Its 548 lines went in byte-identical (`diff` of `runner.ts`: identical). Its only Goops traces are example words in comments ("a crack", "the tank"). Left behind as Goops-only:
- `goopsLessons.ts` (437): Goops' connector: tank setup, pieces, cracks, pressure, which controls work, console, pause, input kind.
- `goopsGates.ts` (75): tank numbers (position, pressure, sealed…) and tank pointers.
- `LessonView.tsx` / `Spotlight.tsx` / `spotlightMath.ts` / `lessonLine.ts` / `lessons.css` (411): Goops' look: speech bubble in the tank column, words on the console's CRT, a multi-hole dim. `Spotlight.tsx` says it should become a kit Callout upgrade one day; Glyphtender kept its own kit `Callout`, untouched.
- `firstDay.ts`, `firstBreakdowns.ts`, `unlockLessons.ts`, `livedThrough.ts`, `storyMoments.ts`, `StoryView.tsx` (435): Goops' rules for *when* a lesson plays (rank, unlocks, story).
- `patterns.ts`: 2 of its 5 patterns (`positionGated`, `pressureGated`) name Goops gates. In a brick they'd move to Goops' connector (the runner already takes extra patterns).
- Dev Kit `LessonsTab.tsx` (79): live editing of lesson files. Glyphtender has no Lessons tab, so its lesson file is live-tunable but has no editor.

Runner features the trial didn't use (Goops' real-time needs): hints after a wait, retries, reactions, insist, interrupts, checkpoints / restart, `ensure`, slow motion, the lesson queue. Used: steps, `pattern`, `setup`, `message`, `pointer`, `while: pause`, `advance` on an event with `where` + `count`, `skipIf` gates, `finished`.

## Side by side
| | Glyphtender (rails, tips, nudges, explore) | Goops (lessons) |
|---|---|---|
| Steps | 19 rails steps as a TypeScript list (`railsSteps.ts`); the hexes and letters are data (`content/tutorial/rails.json`) | JSON files, one per lesson (`content/lessons/*.json`, 9 files) |
| How a step waits | **state:** each step has a `when(board, planned move)`. The current step = the first whose `when` holds and whose button isn't tapped yet. Worked out again on every game change, synchronously | **events + timers:** `advance` = dismiss / an event (with `where`, `count`, `if`) / an action / a gate number polled every 100 ms / time / any-of. Plus hints, retries, reactions, insist, interrupts |
| Blocking input | the rails **limit**: exactly one piece → one hex (the drag referee asks it), plus a **hold** while a Next / Got it / Play callout is up (the AI waits too) | `while`: `pause` (speed 0, input off, `only` some controls) / `slow` / `run`; per-step `rules.allow` lists the controls that work |
| Highlight | the board's own glow (every legal hex, the target extra bright) + the kit `Callout` pointing at a CSS selector; `gotIt` / `play` dim the rest | its own `Spotlight` (multi-hole dim, pink outline), a bubble in the tank, or words on the console's CRT |
| Scripted opponent | yes: Sprout plays `rails.json`'s moves (`setBotScript`) | n/a (no opponent); the lesson sets up the tank, pieces, cracks |
| Saving progress | the whole tutorial: done / not done (`progress.ts`); no resume mid-rails | per lesson: done once per device; first day resumes at its last checkpoint; interrupts remembered |
| Text source | `content/text/en.json` → `tutorial.rails` | `content/text/en.json` → `lessons.<id>` (a `{keys, mouse, phone}` entry picks by input) |
| Tuning | `content/tuning/tutorial.json` | `content/tuning/lessons.json` + each lesson file, live in the Dev Kit's Lessons tab |
| Tests | unit: `rails.test`, `railsSteps.test` (walks the real scripted game), tips/nudges/explore tests · e2e: tutorial-rails (311 lines, 3 sizes, every step's callout, placement and refusals), tutorial-shell, tutorial-tips | unit: `runner.test` (23 tests, a hand-turned clock), `goopsDay`, `lessonWords`, `livedThrough`, `spotlight` |

**Goops' runner: generic vs Goops-only.** Generic (every line of `runner.ts`, `lessonTypes.ts`, `patterns.ts` except 2 patterns): the step machine, conditions, hints, retries, interrupts, the timer pool, `LessonGame` / `LessonClock` interfaces. Goops-only: everything that knows the tank, the console, ranks and the look (list above).

## Before / after screenshots
Folder: `~/Documents/dev/.scratch/glyphtender-tutorial-trial-shots/` → `before/` and `after/`. Each holds the steps draft1, draft2, lines, plus block (the first step after the hand-over) at phone 390×844 and desktop 1440×900. `content/ui/style.json` says `"orientation": "portrait"`, so there's no landscape shot. The shots are the e2e's own, taken at the moment each step's callout is up; all 20 steps × 3 sizes are in `before-e2e/` and `after-e2e/`.

Compared pixel by pixel, then looked at by eye (zoomed crops):
- **draft1, draft2** (phone + desktop): **identical**, 0 pixels differ.
- **lines**, phone: 434 pixels differ, all inside the glyphling the callout points at (298–333, 367–400). It's the same glyphling a shade brighter or darker: its turn glow "breathes", caught at a different moment. Desktop: 3 pixels on the rounded corner of the Next button (antialiasing).
- **block**, phone 240 / desktop 2,431 pixels, again only the breathing glyphling.
- **Proof it's timing noise, not the change:** steps I didn't touch differ the same way (move2 3,964 px, preview 7,425 px, seed2 2,430 px on desktop: always the glowing piece), while others are identical (blocks, noWord, swap, counts…).
- Callout words, position, pointer, board glow, the bright target hex, the tray: the same in every shot. The e2e's own measurements (edge distances, hexes covered) match to the pixel.

## How it was measured
- Real games at the start (13:22) and end: `git rev-parse HEAD` + `git status --short` (below).
- Copy: `git clone C:/Users/Muzzy/Documents/dev/games/glyphtender C:/Users/Muzzy/Documents/dev/.scratch/glyphtender-tutorial-trial` (HEAD 5659b8c, branch dev/v0-19-maintenance), `npm ci` (the only package.json).
- Before: `node e2e/tutorial-rails.mjs <out> 5445` at 5659b8c (port 5445 checked free with `netstat -ano`; the script starts and closes its own Vite server). After: the same at the trial's last commit.
- e2e untouched: `git diff --stat 5659b8c HEAD -- e2e/` → empty.
- Line counts: `wc -l src/game/lessons/*.ts src/game/lessons/*.tsx src/game/lessons/*.css tests/lessons/*.ts content/lessons/*.json content/tuning/lessons.json` (in games/goops) · `wc -l src/tutorial/*.ts src/tutorial/*.tsx content/tutorial/rails.json e2e/tutorial-*.mjs` (in games/glyphtender) · `git diff --numstat 5659b8c HEAD` (in the copy).
- Shots: compared with a small Playwright canvas script (scratchpad `cmp-shots.mjs`); zoomed crops looked at by eye.
- Trial commits in the copy: 1ed66c2 (runner copied as is) · 05ac5a1 (the 3 steps from the lesson file) · bc9bef0 (unit tests + Select) · d9b177a (removed release maps a Dev Kit check had written; see Surprises).

## Surprises
- The runner went in with **0 changes**: Goops' "kept game-agnostic so a framework session can lift it" promise held.
- The one real bug was **order of operations** (pause lifted before the next step's setup), not the format. A future brick should say in its contract: "setup is where a step's state is decided; setSpeed may be called while moving between steps."
- `check:devkit` (or the build it runs) **writes `.map` files into `releases/0.14.1.0/maps/`**. That's the same leftover that sits uncommitted in the real Glyphtender (sprint 61), so it's a check that changes tracked files. I removed them from the copy. Worth a bug line in Glyphtender: a check shouldn't change tracked files.
- Glyphtender's e2e reaches into the tutorial's internals (`RAILS_STEPS`, `useRailsDirector.step.target()`), so any tutorial swap must keep those names or change the test.

## Real games: untouched
| | HEAD at start | HEAD at end | `git status --short` start → end |
|---|---|---|---|
| games/glyphtender | 5659b8c | 5659b8c | 1 modified + 8 untracked `releases/0.14.1.0/maps/*.map` (known, sprint 61) → the same 9 lines, unchanged |
| games/goops | a334977 | a334977 | clean → clean |

Servers: the three e2e scripts start and close their own Vite servers (ports 5445, 5440, 5446). None was left listening at the end (`netstat -ano` showed none), so nothing needed `stop-servers.mjs`.

## Research: how tutorials are built
Short web pass (~15 min), done first-hand: API pages, changelogs, library docs and one studio post, no talk transcripts. The research helper's report arrived later, through the main chat. Its extra points are marked *(secondary: from search summaries)*; the talk points come from abstracts only.
- **Unity Tutorial Framework** (Unity's own in-editor tutorials): a tutorial is a list of **pages**. A page moves on when its **criteria** are met, for example "a scene was added to the build" or "a tool was selected". Authors write a custom criterion as a small object with a yes/no check, so the player is generic and each project brings its own checks. Masking and highlighting are optional per page, and a page can point straight at the UI element to highlight. A tutorial only counts as finished when the last page's criteria are met. — [package manual](https://docs.unity3d.com/Packages/com.unity.learn.iet-framework@3.1/manual/index.html) · [API 5.0](https://docs.unity3d.com/Packages/com.unity.learn.iet-framework@5.0/api/Unity.Tutorials.Core.Editor.html) · [changelog 2.1](https://docs.unity3d.com/Packages/com.unity.learn.iet-framework@2.1/changelog/CHANGELOG.html)
- **Shepherd.js** (web tours): each step has `attachTo` (an element + which side) and `advanceOn` (`{ selector, event }`: "move on when this element sends this event"). Same split as Goops' `pointer` + `advance: { on: "event" }`. — [Shepherd source / PR](https://github.com/shipshapecode/shepherd/pull/418/files) · [OHIF's tours built on it](https://docs.ohif.org/configuration/tours)
- **driver.js** (web tours): steps with an element + a popover. It moves on by its own buttons, by `advanceOnClick` (click the highlighted thing), or by the app calling `moveNext()` from a hook, for example after loading data. Button words are settings (`nextBtnText`, `doneBtnText`), which is the field Goops' format lacks (hand fix 4). — [interactive tours](https://driverjs.com/docs/interactive-tours) · [configuration](https://driverjs.com/docs/configuration) · [async tour](https://driverjs.com/docs/async-tour)
- **A mobile studio (Mighty Bear Games)** built its tutorial from a list of **triggers**: game values and state checks that start each part, set up and maintained by the designers (data, not code). — [Learning to Teach](https://medium.com/mighty-bear-games/learning-to-teach-a-step-by-step-guide-to-making-an-in-game-tutorial-d58b0c98288a)
- **Indie design practice** puts teaching in context over a generic tool. Asher Vollmer's GDC 2014 talk (Threes) is "prime, teach, observe" for new mechanics, and each game's tutorial is shaped by its own mechanic. — [GDC Vault: Prime, Teach, Observe](https://gdcvault.com/play/1020512/Prime-Teach-Observe-Tutorializing-Innovative)
- **Unreal's editor tutorials** *(secondary)*: a tutorial is data, an array of **Stages**. Code can complete or skip a stage (`HandleTickCurrentStage`, `GotoNextTutorialStage`). Again a data list with game code deciding when a step is done. — [UEditorTutorial::Stages](https://docs.unrealengine.com/4.26/en-US/API/Editor/IntroTutorials/UEditorTutorial/Stages/index.html)
- **Unity, more detail** *(secondary)*: there are built-in criteria (e.g. `InstantiatePrefabCriterion`) plus your own, and tutorials are authored with a separate authoring package. — [framework documentation](https://docs.unity3d.com/Packages/com.unity.learn.iet-framework@2.0/manual/framework-documentation.html)
- **driver.js `highlight()`** *(secondary)*: spotlights one element with no tour at all. That's like Glyphtender's tips, separate from its rails. — [async tour](https://driverjs.com/docs/async-tour)
- **Design talks** *(secondary, abstracts only)*: George Fan, Plants vs. Zombies (GDC 2012): teach inside play and bring complex features in late. Nicolae Berbece (GDC Europe 2016): the best tutorials don't feel like tutorials. Splinter Cell: Blacklist (GDC 2014) and Mortal Kombat 11 (GDC 2020): each studio tuned the teaching to its own game. The teaching content is always per game.

**What this means for us:**
- Every shared system found is a **generic step player with game-supplied checks** (Unity criteria, Unreal stages, Shepherd/driver.js events and hooks). The shared part is small: an ordered list of steps (target, text, an advance condition), a runner and a highlight. That's exactly the split Goops' runner already has (`LessonGame`: setup / gate / setSpeed), and this trial proved it holds in a second game.
- The **look and the checks stay per game** everywhere: Unity's masking styles and custom criteria, the web libraries' popovers on the app's own elements. So a brick would be the runner + format, and the bubble would come from the kit's `Callout`.
- A shared player pays off for whoever makes **many** tutorials (Unity: dozens of templates; tour libraries: thousands of apps). With two games that already have tutorials, the payoff only comes with the next one.
