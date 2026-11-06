# Tutorial — the toolbox a game teaches with

A game loads this module like a library and uses only the blocks it wants: a step player that plays a tutorial from a
data file, the lesson file itself, ways to wait for the player, ways to hold the game, hints and retries, one lesson at
a time, words per control type. It never draws anything: the bubble, the dim and the "seen it" memory are the UI kit's
(listed below too, so the whole toolbox is on one page). What each game keeps for itself: **when** to teach (its rules
for which lesson plays) and **its look**.

- Install: `node ~/.claude/config/bmuz/scripts/install-module.mjs tutorial <game>` → `src/tutorial/` (+ a VERSION).
- Import from the entry only: `import { createLessonRunner, type Lesson } from '../tutorial'`.
- Built in Goops (its lesson player, F30–F32), proven in a second game by the F197 trial (Glyphtender's first three
  tutorial steps played by it with **0 lines changed**), made a module in F198.

## The toolbox — every block
"Proved by" = the game whose real tutorial uses it today (Glyphtender* = the F197 trial on a copy of Glyphtender).

| Block | What it does, in plain words | One-line use | Proved by |
|---|---|---|---|
| **Step player** (`createLessonRunner`) | Plays a lesson one step at a time: does the step's set-up, shows its words, waits for the thing that moves it on, then the next step | `const runner = createLessonRunner({ game, clock: rulesClock, timing: () => tuning })` | Goops, Glyphtender* |
| **The lesson file** (`Lesson`) | A tutorial as data, one JSON file per lesson in `content/lessons/<id>.json`: steps with words, what they point at, what moves them on. Asked for again at every step, so a live edit shows at once | `runner.start(() => lessons.first)` | Goops (9 lessons), Glyphtender* |
| **Button words** (`button`) | Which button closes a step — `"next"`, `"gotIt"`, `"play"`, any id from the game's text — and, with `dim`, whether the rest of the screen goes dark | `{ "id": "hi", "message": "hi", "button": "gotIt", "dim": true }` | Glyphtender's Next / Got it / Play (F198) |
| **Wait for a tap** (`advance: dismiss`) | The step moves on when the player closes the words (default) | `"advance": { "on": "dismiss" }` | Goops, Glyphtender* |
| **Wait for something to happen** (`event`, `where`, `count`, `if`) | Moves on when the game says something happened — only with these details, after so many times, only while a number holds | `"advance": { "on": "event", "event": "moved", "where": { "to": "b2" } }` · `runner.event('moved', { to: 'b2' })` | Goops, Glyphtender* |
| **Wait for a control** (`action`) | Moves on when the player tries a control (rotate, drop, open the console…) | `"advance": { "on": "action", "action": "rotate", "count": 2 }` · `runner.action('rotate')` | Goops |
| **Wait for a number** (`gate`) | Moves on when a number the game reports reaches a value (checked every `gatePollMs`) | `"advance": { "on": "gate", "gate": "score", "atLeast": 3 }` | Goops |
| **Wait for time** (`time`) / **whichever first** (`any`) | Moves on after so many seconds / at the first of several things | `"advance": { "on": "any", "of": [{ "on": "event", "event": "won" }, { "on": "time", "after": 8 }] }` | Goops |
| **Skip what's done** (`skipIf`) | A step whose thing is already true is passed straight over | `"skipIf": { "on": "gate", "gate": "placed", "atLeast": 1 }` | Goops, Glyphtender* |
| **Hold the game** (`while`, `setSpeed`) | While the words are up the game is stopped (`pause`: no input), slowed (`slow`) or runs (`run`); `only` lets just some controls work | `"while": "pause"` · the game's `setSpeed(speed, inputOn, only)` | Goops, Glyphtender* |
| **Hints** (`hint`) | After a while without doing it, a reminder — counted from the start, or from something (`from`); never if they did it (`unless`); the wait starts over on `again` | `"hint": { "after": 6, "message": "dropHint" }` | Goops |
| **Retries** (`retry`) | When they get it wrong: set up again, say so (`{tries}`), and after `max` tries move on anyway — never stuck | `"retry": { "when": { "on": "event", "event": "miss" }, "message": "again", "max": 3 }` | Goops |
| **Reactions** (`reactions`) | "If they do something else": other words for a moment, the game keeps going, the step's words come back | `"reactions": [{ "when": { "on": "action", "action": "pause" }, "message": "thatsPause" }]` | Goops |
| **Insist** (`insist`) | Still not done? The same words stay, but now the game stops, the dim comes on and only the asked-for control works | `"insist": { "when": { "on": "time", "after": 10 }, "only": ["console"] }` | Goops |
| **Interrupts** (`interrupts`) | A message that can break into any step once ("a crack went out of view"), then the step carries on exactly where it was; `remember` = once per device | `"interrupts": [{ "id": "away", "when": { "on": "event", "event": "outOfView" }, "message": "away", "remember": true }]` | Goops |
| **Checkpoints** (`checkpoint`, `restartSetup`, `restartPoint`) | Leaving mid-lesson restarts at the last checkpoint, with what the earlier steps would have left in place | `runner.start(get, runner.restartPoint(lesson, savedStep))` | Goops |
| **Make sure it's taught** (`ensure`) | If an interrupt hasn't happened by this step, set it up so it does | `"ensure": { "interrupt": "away", "setup": { "crack": "outOfView" } }` | Goops |
| **One lesson at a time** (`queue`) | A lesson asked for while another plays waits its turn | `runner.queue(() => lessons.unlockSwap)` | Goops |
| **Step patterns** (`PATTERNS`, `patterns`) | Named step shapes so a step only writes what's different: `pauseShowDismiss`, `runActAdvance`, `waitThenHint` — plus the game's own | `"pattern": "pauseShowDismiss"` · `createLessonRunner({ …, patterns: { gotIt: { while: 'pause', dim: true, button: 'gotIt' } } })` | Goops |
| **Words per control type** (`lessonLine`, `wordsFor`, `watchControls`) | A line written as `{ keys, mouse, phone }` gives the right words for how the player plays right now (the last key / click / touch; before any, a guess from the screen) | `fill(lessonLine(text.lessons, lessonId, id, controls.kind()), vars)` | Goops |
| **Promise checks** (`conformance.mjs`) | `npm run check:framework` in the game: every lesson file is one the runner can play (ids, `while`, conditions, interrupt steps), and the runner is on the rules clock | `npm run check:framework` | Goops |
| **Callout** — UI kit (`src/ui/kit`, `blocks/teach.tsx`) | The speech bubble pointing at something, with a title, an action button ("Got it"), an optional dim and pulse | `<Callout target="#plant" text={words} action={buttonWords} dim={m.dim} onDismiss={runner.dismiss} />` | Glyphtender, Goops |
| **Tips memory** — UI kit (`blocks/tips.ts`) | Which one-time tips this player has seen, and the Tips on / off switch | `if (tips.shouldShow('danger')) { …; tips.markSeen('danger') }` | Glyphtender, Goops |
| **Nudge timer** — UI kit (`blocks/nudge.ts`) | "You've been still a while": after so long a glow, later words; each kind only so many times | `const { stage, poke } = useNudge({ kind: 'move', running, glowAt: 10, textAt: 20, repeat: 3 })` | Glyphtender |
| **Spotlight** — UI kit 0.43+ | Dims everything except one or more things being taught, with an outline, in every style | see the UI kit's CATALOG (F199) | Goops |
| **Callout "keep clear"** — UI kit 0.43+ | The bubble keeps clear of a named play area: away from the live spot, toward the nearer edge, flips to fit | see the UI kit's CATALOG (F199) | Glyphtender |

## The contract (what the module promises, what the game does)
- **The game's connector** is a `LessonGame`: `setup(setup)` puts the game in a step's starting state · `gate(name)` a
  number a step can wait on (`null` = can't tell yet) · `setSpeed(speed, inputOn, only?)` how fast the game runs ·
  optional `seen` / `markSeen` (remembered interrupts) and `finished(lessonId)`. The game feeds the runner what happens:
  `runner.event(name, details)` and `runner.action(control)`; its look calls `runner.dismiss()` on the button.
- **Setup is where a step's state is decided; `setSpeed` may be called between steps.** Moving on, the runner takes
  the old words down and lets the game run (`setSpeed(1, true)`) *before* the next step's `setup`. So never work out a
  step's rules (what's allowed, which move) inside `setSpeed` — do it in `setup`. (The F197 trial's one real bug: a
  limit worked out on every speed change asked for a step that didn't exist yet.)
- **Two clocks**: the runner's timers run on the clock it's given — give it the Dev Kit's **rules clock**
  (`rulesClock`), so the Dev Kit's ⏸ and the game's pause stop them. The game itself is stopped by `setSpeed(0)`, never
  by stopping that clock, so the lesson's own timers keep their time (MODULE-CONTRACTS "two clocks"; checked).
- **Words are the game's**: `message`, `button` and hint / retry / interrupt words are text ids (or the words
  themselves while writing); the game turns them into words (`content/text/en.json`) and fills `{placeholders}`.
  `pointer` is the game's too: whatever its look understands (a CSS selector, a tag, a board square).
- **Timings** live in the game's content (Goops: `content/tuning/lessons.json`, live in the Dev Kit's Tuning tab):
  `{ "dismissArmSeconds": 0.4, "betweenStepsSeconds": 0.5, "slowSpeed": 0.25, "gatePollMs": 100 }`. A turn-based game
  wants `betweenStepsSeconds: 0` (its rules must switch the moment a step ends — the F197 trial's hand fix 3).
- **What the look reads**: `runner.view()` (and `runner.subscribe` — use `useSyncExternalStore`) gives `{ lessonId,
  stepId, stepIndex, total, message, done }`; `message` has `kind`, `text`, `pointer`, `dim`, `waitsForDismiss`,
  `button`, `armed` (the button works now — not closable by accident in the first `dismissArmSeconds`), `tries`,
  `insisting`, `only`.

## Wiring it into a game
1. Install (above). The game's eslint config gets `src/tutorial` in its ignores (install-module does it).
2. A connector, e.g. `src/tutorial-game/lessons.ts`:
   ```ts
   import { createLessonRunner, watchControls, lessonLine, type Lesson } from '../tutorial'
   import { rulesClock } from '../devkit/gameClock'
   import timing from '../../content/tuning/lessons.json'
   const files = import.meta.glob<Lesson>('../../content/lessons/*.json', { eager: true, import: 'default' })
   export const controls = watchControls()
   export const runner = createLessonRunner({
     clock: rulesClock,
     timing: () => timing,
     game: {
       setup: (s) => game.applyLessonSetup(s), // decide the step's state HERE
       gate: (name) => game.lessonNumber(name),
       setSpeed: (speed, inputOn, only) => game.hold(speed, inputOn, only),
     },
   })
   ```
3. The game reports what happens: `runner.event('placed', { at: 'b2' })` from its events, `runner.action('rotate')`
   from its controls.
4. The look: read `runner.view().message` and show the UI kit's `Callout` with `lessonLine(text.lessons, lessonId,
   message.text, controls.kind())`, `action` = the button's words when `message.waitsForDismiss`, `dim={message.dim}`,
   `onDismiss={runner.dismiss}`.
5. When to teach is the game's: `runner.start(() => files['../../content/lessons/first.json'])` on a first game, a
   `queue` on an unlock… and `tips.markSeen(...)` (UI kit) so it plays once.

## Tests
`npm test` here: the runner on a fake game and a hand-turned clock (Goops' 23 runner tests + button words + the order
between steps), words per control type, the installer, the promise checks. `npm run typecheck`, `npm run lint`.

## Versions
- 0.1.0 (F198): Goops' lesson player (runner, lesson format, patterns — its two tank patterns stay Goops') + button
  words + words per control type + the promise checks.
