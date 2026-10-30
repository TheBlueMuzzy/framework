// The rules on small pieces of game code: what they must catch, and what they must leave alone (the shapes
// measured in four games, sprint 44 — SPRINT Notes).
import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { rules } from './rules.mjs'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only
const tester = new RuleTester({ languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } })

tester.run('no-tuning-numbers', rules['no-tuning-numbers'], {
  valid: [
    'const SIZE = 1',                                         // plain maths numbers
    'const HALF = 0.5; const MS = 1000; const FULL = 360',
    'const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]',        // a list of numbers is data (winning lines)
    'function f() { const speed = 3.2; return speed }',       // inside a function: working maths, not a named setting
    'let score = 7',                                          // not a const: a value that changes
    'const NAME = "Cleo"',
    'setTimeout(go, 0)',                                      // "next turn", not a timing
    'setTimeout(go, delayMs)',                                // the time comes from somewhere (content/)
    '// tuning-ok: the save format, not a setting\nconst SAVE_VERSION = 3',
    'const EPSILON = 1e-9 // tuning-ok: rounding margin',
    'setTimeout(go, 1000) // tuning-ok: only when the browser has no idle callback',
    '// tuning-ok: board geometry\nexport const OFFSET = 0.501',
    'const WEIGHTS = { near: 1, far: 0 }',                    // only harmless numbers
  ],
  invalid: [
    { code: 'const POP_DURATION = 0.15', errors: [{ messageId: 'named' }] },
    { code: 'export const DIE_SIZE = 0.8', errors: [{ messageId: 'named' }] },
    { code: 'const Z_OFFSET = -0.73', errors: [{ messageId: 'named' }] },
    { code: 'const BEAT_MS = 120 as const', errors: [{ messageId: 'named' }] },
    { code: 'const TRAP_WEIGHTS = { near: 5, far: 3, edge: 1 }', errors: [{ messageId: 'group', data: { name: 'TRAP_WEIGHTS', count: '2' } }] },
    { code: 'setTimeout(nextRound, 2000)', errors: [{ messageId: 'timer' }] },
    { code: 'window.setInterval(tick, 250)', errors: [{ messageId: 'timer' }] },
    { code: 'setTimeout(go, 1000)', errors: [{ messageId: 'timer' }] },           // 1000 is harmless maths, not a harmless delay
    { code: '// tuning-ok:\nconst SPEED = 3', errors: [{ messageId: 'named' }] }, // the note needs its why
    { code: '// tuning-ok: far above\n\nconst SPEED = 3', errors: [{ messageId: 'named' }] }, // two lines up doesn't count
  ],
})

tester.run('no-player-text', rules['no-player-text'], {
  valid: [
    'const t = <p>{text.mainMenu.play}</p>',                                  // read from en.json
    '<Button label={words.play} title={text.help} />',
    'const a = <div className="kit-row wide">{n}</div>',                      // not a player prop
    'const b = <span> · </span>',                                             // no letters
    "import Board from './Board'",
    "const m = { 'Your turn': 1 }",                                           // an object key
    "console.log('Room not found')",
    "throw new Error('Room not found')",
    "function f() { if (bad) throw `Goo shader: ${log}` }",
    "const rules = { check(state) { if (state.over) return 'The game is over.'; return null } }", // the Table's refusal reasons
    "function check(s) { return 'That square is taken.' }",
    // F167: Glyphtender's rules split the check into helpers, each returning string | null
    "export function checkTurn(state, action) { if (state.phase !== 'play') return state.phase === 'refresh' ? 'Choose seeds to refresh first' : 'It is not time to move'; return null }",
    "function checkFor(state, seat, action) { if (state.phase === 'over') return 'The game is over.'; return checkAction(state, action) }",
    "const checkDraft = (state, hex) => (state.phase !== 'draft' ? 'The draft is over' : null)",
    "const rules = { checkRefresh(state) { return 'The same seed was set aside twice' } }",
    // …and a self-check's problem list (the tutorial's railsProblems, which a test expects to be empty)
    "export function railsProblems(words) { const problems = []; if (!words.ok) problems.push('Your turn 1 made a word'); return problems }",
    "const jsonProblem = (v) => (typeof v === 'function' ? 'A function is not plain JSON' : null)",
    "setMode('online')",                                                     // one word, lower case: an id
    "const KEY = 'turn-based-starter:settings'",
    "// text-ok: the Dev Kit's arena report, not a player screen\nconst label = 'Rival glyphlings it tangled'",
    "const t = <p>{'Hi there'}</p> // text-ok: a test fixture",
    "type Mode = 'Hello world'",
  ],
  invalid: [
    { code: 'const t = <p>Your turn</p>', errors: [{ messageId: 'jsx' }] },
    { code: "const t = <p>{'Your turn'}</p>", errors: [{ messageId: 'jsx' }] },
    { code: '<Button aria-label="Close" />', errors: [{ messageId: 'prop', data: { prop: 'aria-label', text: 'Close' } }] },
    { code: "<Seat label={'Player 2'} />", errors: [{ messageId: 'prop' }] },
    { code: '<img alt={`Avatar of ${name}`} />', errors: [{ messageId: 'prop' }] },
    { code: "setErrorWithAutoClear('Room not found')", errors: [{ messageId: 'sentence' }] },  // Roll Better's room errors
    { code: "setError('Connection lost')", errors: [{ messageId: 'sentence' }] },             // …a game's setError isn't an Error
    { code: "const why = closed ? 'Room closed' : null", errors: [{ messageId: 'sentence' }] },
    { code: "function play() { return 'It is not time to move' }", errors: [{ messageId: 'sentence' }] }, // not a rules check
    // F167: only a name that IS check… / …Problem(s) — not checkout, checked, or the word inside a longer name
    { code: "function checkoutScreen() { return 'Thanks for your order' }", errors: [{ messageId: 'sentence' }] },
    { code: "const checkedLabel = () => 'Sound is on'", errors: [{ messageId: 'sentence' }] },
    { code: "function noProblemsHere() { return 'All good here' }", errors: [{ messageId: 'sentence' }] },
    // a callback inside a check helper is judged by its own name (as inside check itself)
    { code: "function checkTurn(s) { s.list.forEach(() => setError('Not your turn')); return null }", errors: [{ messageId: 'sentence' }] },
    { code: "const SPROUT = { piece: null, reason: 'Sprout is playing its scripted turn' }", errors: [{ messageId: 'sentence' }] }, // a reason outside a check
    { code: "// text-ok:\nsetError('Room not found')", errors: [{ messageId: 'sentence' }] },              // the why is needed
  ],
})

tester.run('no-state-in-frame', rules['no-state-in-frame'], {
  valid: [
    // the ref pattern
    'function Spin() { const angle = useRef(0); useFrame((_, dt) => { angle.current += dt }) }',
    // Roll Better's RowChips: React hears only when the faded chip changes
    'function Chips() { const [dimmed, setDimmed] = useState(""); const last = useRef(""); useFrame(() => { const under = find(); if (under !== last.current) { last.current = under; setDimmed(under) } }) }',
    'function C() { const [on, setOn] = useState(false); useFrame(() => { hit() && setOn(true) }) }',
    // a setter outside useFrame
    'function C() { const [n, setN] = useState(0); useEffect(() => { setN(1) }) }',
    // a function called set… that isn't a React setter
    'function C() { useFrame(() => { setUniform(mat, 1) }) }',
  ],
  invalid: [
    { code: 'function C() { const [pos, setPos] = useState(0); useFrame((s) => { setPos(s.clock.elapsedTime) }) }', errors: [{ messageId: 'setter', data: { name: 'setPos' } }] },
    { code: 'function C() { const [s, dispatch] = useReducer(r, 0); useFrame(() => { dispatch({ type: "tick" }) }) }', errors: [{ messageId: 'setter' }] },
    { code: 'function C() { const [n, setN] = React.useState(0); useFrame(() => setN((v) => v + 1)) }', errors: [{ messageId: 'setter' }] },
    { code: 'function C() { useFrame(() => { useGameStore.setState({ t: performance.now() }) }) }', errors: [{ messageId: 'store' }] },
  ],
})

// F157: saves 0.6.4's loadLinkCode, cut down — the file takes a clock (linkCodeHere's `now` option), but one check
// read the real clock, and its test went red a week after its fixed date
const savesBefore = `
export function linkCodeHere(saves, { storage, now = () => Date.now() } = {}) {
  const { link, expiresAt } = memory(saves, storage).load()
  return link && expiresAt > now() ? { link, expiresAt } : null
}
export async function loadLinkCode(typed, saves, options) {
  const own = memory(saves, options.storage).load()
  if (!(own.link && own.expiresAt > Date.now())) remember(typed)
}`

tester.run('own-clock', rules['own-clock'], {
  valid: [
    'const stamp = () => Date.now()',                                         // no clock option in the file
    'function f({ now = () => Date.now() }) { return now() }',                 // the default is the fallback itself
    'function f(options) { return (options.now?.() ?? Date.now()) + 1 }',      // …and so is ?? Date.now()
    'function f(when = Date.now(), { now }) { return now() - when }',          // a default value
    'const clock = { now: () => (typeof performance !== "undefined" ? performance.now() : Date.now()) }; clock.now()', // the clock's own definition (ai pace.ts)
    'const realNow = () => Date.now(); export const tick = (o) => o.now()',   // devkit gameClock.ts
    'const tidy = (now) => drop(now); alarm(() => tidy(Date.now()))',         // a plain now parameter is a time handed in (the cloud worker)
    'setOrder((now) => now.map(f)); const ends = Date.now() + 30000',         // …and a list called now isn't a clock (the gallery)
    'function f(o) { o.now() }\n// clock-ok: a log line stamps the real time\nlog(Date.now())',
    'const t = performance.now(); const u = Date.now()',                       // performance.now / Date.now aren't options
    savesBefore.replace('own.expiresAt > Date.now()', 'own.expiresAt > (options.now?.() ?? Date.now())'), // the fix (bbb0988)
  ],
  invalid: [
    { code: savesBefore, errors: [{ messageId: 'stray', line: 8 }] },                                      // the saves bug
    { code: 'function f({ now }) { return now() }\nfunction g() { return Date.now() - 5 }', errors: [{ messageId: 'stray' }] },
    { code: 'const age = (o) => Date.now() - o.now()', errors: [{ messageId: 'stray' }] },
    { code: 'function f(o) { o.now() }\n// clock-ok:\nlog(Date.now())', errors: [{ messageId: 'stray' }] }, // the why is needed
    // the review (sprint 47): a ?? / || is a fallback only when Date.now() IS its right side
    { code: 'function f({ now }) { now() }\nconst label = name || `at ${Date.now()}`', errors: [{ messageId: 'stray' }] },
    { code: 'function f({ now }) { now() }\nconst r = cache ?? fetchFresh(Date.now())', errors: [{ messageId: 'stray' }] },
    // …a clock's name is exact (not "know", "snow"), and only the function that holds the call counts
    { code: 'function f({ now }) { now() }\nconst know = () => Date.now()', errors: [{ messageId: 'stray' }] },
    { code: 'function f({ now }) { now() }\nfunction snow() { return Date.now() }', errors: [{ messageId: 'stray' }] },
    { code: 'function f({ now }) { now() }\nfunction startClock() { setInterval(() => save(Date.now()), 1) }', errors: [{ messageId: 'stray' }] },
  ],
})

tester.run('own-clock (the review, sprint 47: what must still pass)', rules['own-clock'], {
  valid: [
    'const t = window.performance.now()\nconst s = Date.now()',      // the browser's clocks aren't a clock option
    'const t = globalThis.performance.now()\nconst s = Date.now()',
    'const t = DateTime.now()\nconst s = Date.now()',                // luxon
    'class C { now = () => Date.now() }\nnew C().now()',              // a class field defining the clock
    'function f({ now = () => (ok ? Date.now() : 0) }) { now() }',    // anywhere inside a default value
  ],
  invalid: [],
})
