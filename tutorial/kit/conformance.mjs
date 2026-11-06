// THE TUTORIAL MODULE'S PROMISE CHECKS — run by the Dev Kit's check-framework.mjs (npm run check:framework).
// The promise: a lesson plays the same way in every game, and stops when the game is paused. What the game must provide:
//   - every lesson file (content/lessons/<id>.json) is one the runner can play: its id is its file name, its steps have
//     their own ids, and every `while`, condition (`on`) and interrupt `from` / `to` names something that exists — a
//     typo there (a Dev Kit edit, a hand edit) would silently never move on
//   - the runner's timers run on the game's RULES clock (the Dev Kit's ⏸ and the game's pause stop them), never the
//     wall clock — MODULE-CONTRACTS "two clocks"
export const title = 'Tutorial'

export const CHECKS = {
  lessons: 'every lesson file in content/lessons/ is one the runner can play',
  clock: 'the lesson runner runs on the game\'s rules clock',
}

const WHILE = ['pause', 'slow', 'run']
const ON = ['dismiss', 'event', 'action', 'gate', 'time', 'any']

/** Problems in one condition (and the ones inside it), named by where they are. */
function conditionProblems(cond, where) {
  if (cond === undefined) return []
  if (!cond || typeof cond !== 'object') return [`${where}: not a condition ({ "on": … })`]
  if (!ON.includes(cond.on)) return [`${where}: "on": ${JSON.stringify(cond.on)} isn't one of ${ON.join(', ')}`]
  const out = []
  if (cond.on === 'event' && typeof cond.event !== 'string') out.push(`${where}: an "event" condition names no "event"`)
  if (cond.on === 'action' && typeof cond.action !== 'string') out.push(`${where}: an "action" condition names no "action"`)
  if (cond.on === 'gate' && typeof cond.gate !== 'string') out.push(`${where}: a "gate" condition names no "gate"`)
  if (cond.on === 'time' && typeof cond.after !== 'number') out.push(`${where}: a "time" condition has no "after" (seconds)`)
  if (cond.on === 'any') {
    if (!Array.isArray(cond.of)) out.push(`${where}: an "any" condition has no "of" list`)
    else cond.of.forEach((c, i) => out.push(...conditionProblems(c, `${where}.of[${i}]`)))
  }
  if (cond.if !== undefined) out.push(...conditionProblems(cond.if, `${where}.if`))
  return out
}

const whileProblem = (value, where) => (value === undefined || WHILE.includes(value) ? [] : [`${where}: "while": ${JSON.stringify(value)} isn't one of ${WHILE.join(', ')}`])

/** Every problem in one lesson file's text ([] = it plays). */
export function lessonProblems(path, text) {
  let lesson
  try { lesson = JSON.parse(text) } catch (e) { return [`${path}: not valid JSON (${e.message})`] }
  const name = path.split('/').pop().replace(/\.json$/, '')
  const out = []
  if (lesson?.id !== name) out.push(`${path}: "id" is ${JSON.stringify(lesson?.id)} — it must be the file's name, "${name}"`)
  if (!Array.isArray(lesson?.steps) || !lesson.steps.length) return [...out, `${path}: no "steps" list`]
  const ids = new Set()
  lesson.steps.forEach((step, i) => {
    const at = `${path} step ${i + 1}${step?.id ? ` (${step.id})` : ''}`
    if (typeof step?.id !== 'string' || !step.id) out.push(`${at}: no "id"`)
    else if (ids.has(step.id)) out.push(`${at}: the id "${step.id}" is used twice`)
    else ids.add(step.id)
    out.push(...whileProblem(step?.while, at))
    // (a step with a pattern may write half an advance — { "atLeast": 10 } — the pattern fills in the rest)
    if (!(step?.pattern && step.advance && step.advance.on === undefined)) out.push(...conditionProblems(step?.advance, `${at} advance`))
    for (const [k, c] of (Array.isArray(step?.skipIf) ? step.skipIf : step?.skipIf ? [step.skipIf] : []).entries()) out.push(...conditionProblems(c, `${at} skipIf[${k}]`))
    if (step?.hint) {
      out.push(...whileProblem(step.hint.while, `${at} hint`))
      for (const key of ['from', 'unless', 'again']) out.push(...conditionProblems(step.hint[key], `${at} hint.${key}`))
    }
    if (step?.retry) out.push(...conditionProblems(step.retry.when, `${at} retry.when`))
    ;(step?.reactions ?? []).forEach((r, k) => { out.push(...conditionProblems(r?.when, `${at} reactions[${k}].when`), ...conditionProblems(r?.until, `${at} reactions[${k}].until`)) })
    if (step?.insist) out.push(...conditionProblems(step.insist.when, `${at} insist.when`), ...whileProblem(step.insist.while, `${at} insist`))
  })
  ;(lesson.interrupts ?? []).forEach((it, k) => {
    const at = `${path} interrupt ${it?.id ?? k + 1}`
    out.push(...conditionProblems(it?.when, `${at} when`), ...whileProblem(it?.while, at))
    for (const key of ['from', 'to']) if (it?.[key] !== undefined && !ids.has(it[key])) out.push(`${at}: "${key}": "${it[key]}" isn't a step id in this lesson`)
  })
  return out
}

/** The code with its comments blanked (line breaks kept, so line numbers stay) — reading strings as strings: a "/*" or
 *  "//" inside quotes isn't a comment (F201: the README's own `import.meta.glob('…/lessons/*.json')`, then a doc
 *  comment's end, blanked the code between them and hid the runner). */
function withoutComments(text) {
  let out = '', quote = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1]
    if (quote) {
      out += c
      if (c === '\\') { out += next ?? ''; i++ } else if (c === quote) quote = null
    } else if (c === '/' && (next === '/' || next === '*')) {
      const end = next === '/' ? text.indexOf('\n', i) : text.indexOf('*/', i + 2) + 2
      const stop = end <= 1 || end === -1 ? text.length : end
      out += text.slice(i, stop).replace(/[^\n]/g, ' ')
      i = stop - 1
    } else {
      if (c === '"' || c === "'" || c === '`') quote = c
      out += c
    }
  }
  return out
}

/** The clock each createLessonRunner call in the game's code is given → [{ where, clock }] (clock null = can't tell). */
export function runnerClocks(files) {
  const found = []
  for (const { path, text } of files) {
    const code = withoutComments(text)
    const call = /\bcreateLessonRunner\s*\(/g
    let m
    while ((m = call.exec(code))) {
      // (a definition isn't a call — a game's own old lesson player, still there mid-swap, defines one)
      if (/\bfunction\s*$/.test(code.slice(Math.max(0, m.index - 30), m.index))) continue
      const line = code.slice(0, m.index).split('\n').length
      const clock = code.slice(m.index, m.index + 600).match(/\bclock\s*:\s*([A-Za-z_$][\w$.]*)/)?.[1] ?? null
      found.push({ where: `${path}:${line}`, clock })
    }
  }
  return found
}

export async function check(t) {
  {
    const name = CHECKS.lessons
    const files = t.files({ dirs: ['content/lessons'], exts: /\.json$/ })
    if (!files.length) t.skip(name, 'no lesson files yet (content/lessons/<id>.json)')
    else {
      const problems = files.flatMap((f) => lessonProblems(f.path, f.text))
      if (problems.length) t.fail(name, problems, 'Fix the lesson file where each line says (the README\'s "The lesson file" lists every field and value).')
      else t.pass(name, `${files.length} lesson file${files.length === 1 ? '' : 's'}`)
    }
  }
  {
    const name = CHECKS.clock
    const calls = runnerClocks(t.gameCode())
    if (!calls.length) t.skip(name, 'the game doesn\'t start a lesson runner yet (createLessonRunner)')
    else if (!t.exists('src/devkit/gameClock.ts')) t.skip(name, 'no Dev Kit (src/devkit/gameClock.ts), so no rules clock to check against')
    else {
      const wrong = calls.filter((c) => c.clock !== 'rulesClock')
      if (wrong.length) {
        t.fail(name, wrong.map((c) => `${c.where} — createLessonRunner's clock is ${c.clock ?? 'not a plain name'}, not rulesClock`),
          'Pass the Dev Kit\'s rules clock: import { rulesClock } from \'../devkit/gameClock\' (path from your file) and createLessonRunner({ clock: rulesClock, … }) — so the Dev Kit\'s ⏸ and the game\'s pause stop the lesson\'s timers.')
      } else t.pass(name, calls.map((c) => c.where).join(' · '))
    }
  }
}
