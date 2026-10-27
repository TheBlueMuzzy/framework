// The two rules on small pieces of game code: what they must catch, and what they must leave alone (the shapes
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
