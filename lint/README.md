# Lint — coding standards every game checks itself (F90)

The ESLint rules in the game's own lint, so the quick check (`npm run check:fast`, which runs `npm run lint`) refuses
two mistakes that used to depend on Claude remembering:

| Rule | Refuses | Instead |
|---|---|---|
| `bmuz/no-tuning-numbers` | a **setting written into the code**: a top-level `const POP_DURATION = 0.15`, a top-level object of numbers (`const TRAP_WEIGHTS = { near: 5, far: 3 }`), a `setTimeout` / `setInterval` with a fixed delay | put it in `content/` (the Dev Kit and Obsidian edit it there) |
| `bmuz/no-state-in-frame` | a React state setter (useState / useReducer) or a store's `setState` called **every frame** inside `useFrame` | keep the value in a ref (`ref.current = …`); set state only when it really changes, inside an `if` |
| `bmuz/no-player-text` (0.2.0, F91) | **words a player reads written into the code**: JSX text (`<p>Your turn</p>`), a player prop (`title`, `label`, `aria-label`, `placeholder`, `alt`…), a sentence in a plain string (`setError('Room not found')`) — on only in a game with `content/text/en.json` | put them in `content/text/en.json` (the Dev Kit's Text tab edits them; a translation replaces them) |
| `bmuz/own-clock` (0.3.0, F157) | **a stray `Date.now()` in a file that takes a clock option** (a `{ now }` option, or a read of `options.now`) — a test pins `now` to a fixed date, the stray keeps reading today, and the test goes red on its own a week later (saves 0.6.4's link codes) | use the clock it was given. Fine as is: the fallback (`now = () => Date.now()`, `options.now?.() ?? Date.now()`), the clock's own definition (`now: () => …`, `realNow`), a plain `now` parameter (a time handed in). A real one says why: `// clock-ok: <why>` |

Not player words, never flagged: imports, object keys, `console.*`, `Error` messages, anything thrown, what a rules
`check` returns (the Table's refusal reasons). Anything else that isn't for players says why: `// text-ok: <why>`.
Measured on four games (sprint 45): the screens' words had already moved to en.json; the real gap was messages in
plain strings (Roll Better's room errors).

What never counts: plain maths numbers (0, 1, 2, −1, 0.5, 10, 100, 1000, 60, 180, 360, 255), numbers inside functions,
lists of numbers (data: winning lines, pip layouts), `let`s, `setTimeout(fn, 0)`, a delay read from somewhere.

**A real constant** (a save version, a rounding margin, a rule of the game, a list size) says why, on its line or the
line above — the why is required:

```ts
// tuning-ok: the save format, not a setting
const SAVE_VERSION = 3
const EPSILON = 1e-9 // tuning-ok: rounding margin
```

Measured before it was built (sprint 44, four games): "every number" would have flagged 131–3,957 numbers a game; these
two shapes find 1–53, most of them real settings (Roll Better's pop timings and die size, Goops' goo physics,
Glyphtender's AI weights).

## Install / update

```bash
node ~/.claude/config/bmuz/scripts/install-module.mjs lint .
```

- Copies `kit/` to `src/lint/` (+ `VERSION`) and adds `src/lint` to the game's `globalIgnores`.
- The first time, adds one import and one block at the end of `eslint.config.js` (game code in `src/`, not
  `src/devkit-game/` or tests). **How strict** depends on today's code: no finds → errors; finds → warnings, with the
  list, so an older game's checks don't go red overnight. Clean them up, then switch both to `'error'` (or run the
  installer with `--errors`). An update never touches that block.
- `npm run check:framework` (the Dev Kit) checks the promise: the import, both rules on, a `lint` script — and warns
  while they're warnings.

New games start from a starter that already has it, as errors.

## Files

- `kit/rules.mjs` — the two rules (plain JavaScript; ESLint hands them the parsed code)
- `kit/conformance.mjs` — the promise checks check:framework runs in the game
- `scripts/install-lint.mjs` — the installer (it counts finds with the framework's own ESLint)
- Tests: `kit/rules.test.mjs` (RuleTester), `kit/conformance.test.mjs`, `scripts/install-lint.test.mjs`

## Versions

- 0.1.0 (F90, sprint 44): the two rules, the installer, the promise checks; the turn-based starter takes it as errors.
- 0.2.0 (F91, sprint 45): `bmuz/no-player-text`. The installer turns it on where `content/text/en.json` exists — as an
  error with no finds, a warning with the list otherwise — and adds it to a game already on 0.1.0's block (its other
  rules keep their strictness). The promise checks want it whenever en.json exists. The starter has it as an error.
- 0.3.0 (F157, sprint 47): `bmuz/own-clock`, in every game — an error with no finds, a warning with the list otherwise —
  and added beside the rules of a game already on 0.1.0 / 0.2.0's block. The promise checks want it (an older block is
  told to run the installer again). The framework's own lint runs it on every module too (root eslint.config.js).
  Measured first (sprint 47): 0 finds in the framework and three games today; saves 0.6.4's link-code bug is caught
  at its line.
