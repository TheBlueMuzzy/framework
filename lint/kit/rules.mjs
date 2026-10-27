// LINT — the coding standards every game checks itself (F90). Two ESLint rules, added to a game's eslint.config.js
// by install-lint.mjs. Plain JavaScript, no packages of its own: ESLint hands each rule the parsed code.
//
// bmuz/no-state-in-frame — React state set inside a useFrame callback. useFrame runs every frame (60+ times a second);
//   a state update there re-renders React every frame. Mutate a ref instead. A setter inside an `if` passes: that's the
//   "tell React only when it changed" pattern (Roll Better's RowChips: a ref remembers the faded chip, setDimmed only
//   when another one fades) — measured on four games, sprint 44.
//
// bmuz/no-tuning-numbers — a number that is a setting, written into game code instead of content/ (where Muzzy edits
//   it in the Dev Kit or Obsidian). It finds the two shapes a setting takes in code:
//     - a named one: a top-level `const POP_DURATION = 0.15`, or a top-level object of numbers (a settings group:
//       `const TRAP_WEIGHTS = { near: 5, far: 2 }`). Lists of numbers are data (winning lines, pip layouts): skipped.
//     - a timer: setTimeout / setInterval with a fixed delay.
//   Plain maths numbers never count (HARMLESS). A real constant — a save version, a rounding margin, a rule of the
//   game — says so on its line or the line above: `// tuning-ok: <why>`. Measured on four games (sprint 44): "every
//   number" found 131–3,957 per game; these two shapes found 1–53, mostly real settings.

const HARMLESS = new Set([0, 1, 2, -1, 0.5, 10, 100, 1000, 60, 180, 360, 255])

const numberOf = (node) => {
  if (node?.type === 'Literal' && typeof node.value === 'number') return node.value
  if (node?.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal' && typeof node.argument.value === 'number') return -node.argument.value
  return null
}
// `0.15 as const`, `{ … } satisfies Tuning` — look through TypeScript's wrappers
const unwrap = (node) => (node && (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression') ? unwrap(node.expression) : node)
const isSetting = (node) => { const value = numberOf(unwrap(node)); return value !== null && !HARMLESS.has(value) }

// `// tuning-ok: <why>` (or `// text-ok: <why>`) on the statement's own line or the line above it
function markedOk(sourceCode, node, tag = 'tuning-ok') {
  const line = node.loc.start.line
  const note = new RegExp(`^\\s*${tag}:\\s*\\S`)
  return sourceCode.getAllComments().some((comment) => note.test(comment.value) && (comment.loc.end.line === line || comment.loc.end.line === line - 1 || comment.loc.start.line === node.loc.end.line))
}

const timerName = (callee) => (callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && !callee.computed ? callee.property.name : null)

const noTuningNumbers = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Settings (named numbers, timer delays) live in content/, not in game code' },
    schema: [],
    messages: {
      named: '{{name}} = {{value}} is a setting written into the code — move it to content/ (the Dev Kit and Obsidian edit it there), or say why it isn\'t one: // tuning-ok: <why>',
      group: '{{name}} holds {{count}} setting(s) written into the code — move them to content/ (the Dev Kit and Obsidian edit them there), or say why they aren\'t: // tuning-ok: <why>',
      timer: 'A {{value}} ms timer written into the code — put the time in content/ so it can be tuned, or say why it isn\'t a setting: // tuning-ok: <why>',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    return {
      CallExpression(node) {
        if (!/^set(Timeout|Interval)$/.test(timerName(node.callee) ?? '')) return
        const delay = numberOf(unwrap(node.arguments[1]))
        if (delay === null || delay <= 0 || markedOk(sourceCode, node)) return
        context.report({ node: node.arguments[1], messageId: 'timer', data: { value: String(delay) } })
      },
      VariableDeclarator(node) {
        const declaration = node.parent
        const topLevel = declaration.parent.type === 'Program' || declaration.parent.type === 'ExportNamedDeclaration'
        if (declaration.kind !== 'const' || !topLevel || node.id.type !== 'Identifier') return
        const statement = declaration.parent.type === 'ExportNamedDeclaration' ? declaration.parent : declaration
        const init = unwrap(node.init)
        if (isSetting(init)) {
          if (!markedOk(sourceCode, statement)) context.report({ node, messageId: 'named', data: { name: node.id.name, value: String(numberOf(init)) } })
          return
        }
        if (init?.type !== 'ObjectExpression') return
        const settings = init.properties.filter((property) => property.type === 'Property' && isSetting(property.value))
        if (settings.length && !markedOk(sourceCode, statement)) context.report({ node, messageId: 'group', data: { name: node.id.name, count: String(settings.length) } })
      },
    }
  },
}

const isUseFrame = (node) => node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'useFrame'

const noStateInFrame = {
  meta: {
    type: 'problem',
    docs: { description: 'No React state updates every frame inside useFrame — mutate a ref' },
    schema: [],
    messages: {
      setter: '{{name}}() inside useFrame sets React state every frame — keep the value in a ref (ref.current = …) and read it where it\'s drawn; set state only when it really changes (inside an if)',
      store: 'setState() inside useFrame updates the store every frame — keep the value in a ref, or set it only when it really changes (inside an if)',
    },
  },
  create(context) {
    const setters = new Set() // useState / useReducer setters declared in this file
    const frames = [] // the useFrame calls we're inside
    // inside the frame callback, but not behind an if / ?: / && (the "only when it changed" pattern)
    const unconditional = (node) => {
      for (let n = node.parent; n && n !== frames.at(-1); n = n.parent) {
        if (n.type === 'IfStatement' || n.type === 'ConditionalExpression' || n.type === 'LogicalExpression' || n.type === 'SwitchCase') return false
      }
      return true
    }
    return {
      VariableDeclarator(node) {
        const init = node.init?.type === 'CallExpression' ? node.init.callee : null
        const hook = init?.type === 'Identifier' ? init.name : init?.type === 'MemberExpression' && !init.computed ? init.property.name : null
        if ((hook === 'useState' || hook === 'useReducer') && node.id.type === 'ArrayPattern' && node.id.elements[1]?.type === 'Identifier') setters.add(node.id.elements[1].name)
      },
      CallExpression(node) {
        if (isUseFrame(node)) { frames.push(node); return }
        if (!frames.length || !unconditional(node)) return
        const callee = node.callee
        if (callee.type === 'Identifier' && setters.has(callee.name)) context.report({ node, messageId: 'setter', data: { name: callee.name } })
        else if (callee.type === 'MemberExpression' && !callee.computed && callee.property.name === 'setState') context.report({ node, messageId: 'store' })
      },
      'CallExpression:exit'(node) { if (isUseFrame(node)) frames.pop() },
    }
  },
}

// bmuz/no-player-text (F91) — words a player reads, written into game code instead of content/text/en.json, where
//   the Dev Kit's Text tab edits them and a translation would replace them. On only in a game that keeps its words in
//   en.json (the installer decides). It finds three shapes, measured on four games (sprint 45):
//     - JSX text with letters: <p>Your turn</p>, {'Your turn'}
//     - a string in a prop the player reads: title, label, aria-label (a screen reader says it), placeholder, alt, …
//     - a sentence in a plain string — a capital, a space, words: setError('Room not found') (Roll Better's room
//       errors were the real gap: the screens' words had already moved)
//   Not player words, so never flagged: imports, object keys, console.*, Error messages, anything thrown, what a
//   rules `check` returns (the Table's refusal reasons — a game that shows one gives the player en.json words for it).
//   Anything else that isn't for players (a Dev Kit report's label) says why: `// text-ok: <why>`.
const PLAYER_PROPS = new Set(['title', 'label', 'aria-label', 'aria-description', 'aria-roledescription', 'placeholder', 'alt',
  'text', 'message', 'heading', 'subtitle', 'caption', 'tooltip', 'hint', 'description', 'detail', 'confirmLabel', 'cancelLabel'])
const hasWords = (text) => /\p{L}{2,}/u.test(text)
const SENTENCE = /^\p{Lu}[\p{L}'’]*( [\p{L}\p{N}'’,.!?…—:;()-]+)+[.!?…]?$/u
const stringOf = (node) => (node?.type === 'Literal' && typeof node.value === 'string' ? node.value
  : node?.type === 'TemplateLiteral' ? node.quasis.map((quasi) => quasi.value.cooked ?? '').join(' ') : null)
const calleeName = (callee) => (callee?.type === 'Identifier' ? callee.name : callee?.type === 'MemberExpression' && !callee.computed ? callee.property.name : null)
const functionName = (fn) => {
  const p = fn.parent
  if (fn.id?.name) return fn.id.name
  if ((p?.type === 'Property' || p?.type === 'MethodDefinition') && p.key.type === 'Identifier') return p.key.name
  if (p?.type === 'VariableDeclarator' && p.id.type === 'Identifier') return p.id.name
  return null
}

const noPlayerText = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Words a player reads live in content/text/en.json, not in game code' },
    schema: [],
    messages: {
      jsx: '"{{text}}" is player text written into the code — put it in content/text/en.json and read it from there (the Dev Kit\'s Text tab edits it, a translation replaces it), or say why it isn\'t: // text-ok: <why>',
      prop: '{{prop}}="{{text}}" is player text written into the code — put it in content/text/en.json (a screen reader says aria-labels too), or say why it isn\'t: // text-ok: <why>',
      sentence: '"{{text}}" looks like words a player reads — put them in content/text/en.json, or say why they aren\'t: // text-ok: <why>',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const short = (text) => (text.length > 40 ? `${text.slice(0, 40)}…` : text).replace(/\s+/g, ' ').trim()
    const report = (node, messageId, data) => { if (!markedOk(sourceCode, node, 'text-ok')) context.report({ node, messageId, data }) }
    // a string that isn't for players because of where it sits
    const notForPlayers = (node) => {
      for (let n = node.parent, child = node; n; child = n, n = n.parent) {
        if (n.type === 'ImportDeclaration' || n.type === 'ExportAllDeclaration' || n.type === 'ExportNamedDeclaration' && n.source === child) return true
        if (n.type === 'ImportExpression' || n.type === 'ThrowStatement' || n.type.startsWith('TS')) return true
        if (n.type === 'Property' && n.key === child) return true
        if ((n.type === 'CallExpression' || n.type === 'NewExpression') && n.callee !== child) {
          const name = calleeName(n.callee)
          if (n.callee.type === 'MemberExpression' && n.callee.object.type === 'Identifier' && n.callee.object.name === 'console') return true
          // Error / TypeError / RoomError messages — capitalised, so a game's own setError('Room not found') still counts
          if (/^[A-Z]\w*Error$/.test(name ?? '') || name === 'require') return true
        }
        if (n.type === 'JSXAttribute') return true // props are judged by name, below
        if (n.type.endsWith('FunctionExpression') || n.type === 'FunctionDeclaration') return functionName(n) === 'check'
      }
      return false
    }
    return {
      JSXText(node) {
        if (hasWords(node.value)) report(node, 'jsx', { text: short(node.value) })
      },
      JSXExpressionContainer(node) {
        const text = stringOf(node.expression)
        if (node.parent.type !== 'JSXAttribute' && text && hasWords(text)) report(node, 'jsx', { text: short(text) })
      },
      JSXAttribute(node) {
        const prop = node.name.type === 'JSXIdentifier' ? node.name.name : null
        if (!prop || !PLAYER_PROPS.has(prop)) return
        const value = node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value
        const text = stringOf(value)
        if (text && hasWords(text)) report(node, 'prop', { prop, text: short(text) })
      },
      Literal(node) {
        if (typeof node.value !== 'string' || !SENTENCE.test(node.value.trim()) || node.parent.type === 'JSXExpressionContainer') return
        if (!notForPlayers(node)) report(node, 'sentence', { text: short(node.value) })
      },
    }
  },
}

export const rules = { 'no-state-in-frame': noStateInFrame, 'no-tuning-numbers': noTuningNumbers, 'no-player-text': noPlayerText }
export default { meta: { name: 'bmuz' }, rules }
