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

// `// tuning-ok: <why>` on the statement's own line or the line above it
function markedOk(sourceCode, node) {
  const line = node.loc.start.line
  return sourceCode.getAllComments().some((comment) => /^\s*tuning-ok:\s*\S/.test(comment.value) && (comment.loc.end.line === line || comment.loc.end.line === line - 1 || comment.loc.start.line === node.loc.end.line))
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

export const rules = { 'no-state-in-frame': noStateInFrame, 'no-tuning-numbers': noTuningNumbers }
export default { meta: { name: 'bmuz' }, rules }
