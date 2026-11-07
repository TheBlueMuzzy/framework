// THE LESSONS TAB'S LOGIC (Dev Kit 0.29.0, framework F200) — plain functions, no React. LessonsTab.tsx draws them.
// A lesson file (content/lessons/<name>.json, the Tutorial module's format) is edited step by step. Save writes back ONLY
// what the tab changed: the tab compares its edits with the file as it loaded (lessonChanges), then puts just those
// changes on top of the file as it is on disk at that moment (applyLessonChanges) — so anything else in the file
// (notes, other steps, a hand edit made meanwhile) comes back untouched, and formatJson keeps its layout byte-for-byte.
// The Dev Kit never imports the Tutorial module: a lesson here is plain JSON with an id and a list of steps with ids.

/** One step of a lesson, as the Dev Kit sees it (the Tutorial module's LessonStep is the full shape). */
export type LessonStepData = { id: string } & Record<string, unknown>
/** A lesson file's data. */
export type LessonData = { id?: string; steps: LessonStepData[] } & Record<string, unknown>

/** One change the tab made: a key inside a step (by the step's id, so a step added on disk meanwhile can't shift it)
 *  or a key of the lesson itself (step null). `path` goes into nested objects (["hint", "after"]); a list is one value.
 *  `value` undefined = the key is taken out. */
export type LessonChange = { step: string | null; path: string[]; value: unknown; was: unknown }

const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Is this data a lesson the tab can show? (an object with a steps list whose steps all have a text id) */
export function isLesson(data: unknown): data is LessonData {
  return isObject(data) && Array.isArray(data.steps) && data.steps.every((s) => isObject(s) && typeof s.id === 'string')
}

// Every leaf that differs between a and b, as paths (objects are gone into; lists and plain values are leaves)
function diff(a: unknown, b: unknown, path: string[], out: { path: string[]; value: unknown; was: unknown }[]) {
  if (same(a, b)) return
  if (isObject(a) && isObject(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[key], b[key], [...path, key], out)
    return
  }
  out.push({ path, value: b, was: a })
}

/** What the tab changed in a lesson: `saved` = the file as it loaded (or was last saved), `edited` = the tab's version. */
export function lessonChanges(saved: LessonData, edited: LessonData): LessonChange[] {
  const out: LessonChange[] = []
  // the lesson's own keys (not its steps)
  const top: { path: string[]; value: unknown; was: unknown }[] = []
  const strip = (l: LessonData) => Object.fromEntries(Object.entries(l).filter(([k]) => k !== 'steps'))
  diff(strip(saved), strip(edited), [], top)
  for (const c of top) out.push({ step: null, ...c })
  // each step, matched by id
  for (const step of edited.steps) {
    const before = saved.steps.find((s) => s.id === step.id)
    const found: { path: string[]; value: unknown; was: unknown }[] = []
    diff(before ?? {}, step, [], found)
    for (const c of found) out.push({ step: step.id, ...c })
  }
  return out
}

/** The tab's changes put on top of the file as it is on disk now (`fresh`). Everything else in it stays as it is.
 *  Throws with a plain reason when a changed step is no longer in the file. */
export function applyLessonChanges(fresh: LessonData, changes: LessonChange[]): LessonData {
  const out = structuredClone(fresh)
  for (const c of changes) {
    let target: Record<string, unknown>
    if (c.step === null) target = out
    else {
      const step = out.steps.find((s) => s.id === c.step)
      if (!step) throw new Error(`step "${c.step}" is no longer in the file (renamed or removed by hand?) — nothing was saved`)
      target = step
    }
    const keys = c.path
    if (keys.length === 0) continue
    for (const key of keys.slice(0, -1)) {
      if (!isObject(target[key])) {
        if (c.value === undefined) { target = {}; break } // taking out a key whose parent is already gone
        target[key] = {}
      }
      target = target[key] as Record<string, unknown>
    }
    const last = keys[keys.length - 1]
    if (c.value === undefined) delete target[last]
    else target[last] = structuredClone(c.value)
  }
  return out
}

/** A step with one key set (value undefined = taken out). `path` goes into nested objects (["hint", "after"]). */
export function setStepField(step: LessonStepData, path: string[], value: unknown): LessonStepData {
  const out = structuredClone(step)
  let target: Record<string, unknown> = out
  for (const key of path.slice(0, -1)) {
    if (!isObject(target[key])) {
      if (value === undefined) return out
      target[key] = {}
    }
    target = target[key] as Record<string, unknown>
  }
  const last = path[path.length - 1]
  if (value === undefined) delete target[last]
  else target[last] = value
  return out
}

/** Read a nested key of a step (["hint", "after"]). */
export function stepField(step: LessonStepData | undefined, path: string[]): unknown {
  let at: unknown = step
  for (const key of path) at = isObject(at) ? at[key] : undefined
  return at
}

/** "first-game · step threeInARow · message: "threeInARow" → "Hi"" lines, for Copy for Claude. */
export function describeChanges(file: string, changes: LessonChange[]): string[] {
  const show = (v: unknown) => (v === undefined ? '(not set)' : JSON.stringify(v))
  return changes.map((c) => `${file} · ${c.step === null ? 'lesson' : `step ${c.step}`} · ${c.path.join('.')}: ${show(c.was)} → ${show(c.value)}`)
}

/** What moves a step on, in plain words: "event placed (by: you)", "a tap on its button", "after 8 s"… */
export function describeAdvance(advance: unknown): string {
  if (!isObject(advance)) return 'closing its words (the button)'
  const where = isObject(advance.where) ? ` (${Object.entries(advance.where).map(([k, v]) => `${k}: ${String(v)}`).join(', ')})` : ''
  const times = typeof advance.count === 'number' && advance.count > 1 ? ` ×${advance.count}` : ''
  switch (advance.on) {
    case 'dismiss': return 'closing its words (the button)'
    case 'event': return `the game says "${String(advance.event)}"${where}${times}`
    case 'action': return `the player uses "${String(advance.action)}"${times}`
    case 'gate': return `"${String(advance.gate)}" reaches ${String(advance.atLeast ?? advance.atMost ?? '?')}`
    case 'time': return `${String(advance.after)} s pass`
    case 'any': return Array.isArray(advance.of) ? `the first of: ${advance.of.map(describeAdvance).join(' · ')}` : 'the first of several things'
    default: return typeof advance.on === 'string' ? String(advance.on) : JSON.stringify(advance)
  }
}

/** The words a text id stands for, from the game's en.json (the Tutorial module's convention: "lessons" → the lesson's
 *  id → the step's id, else "lessons" → "shared"). A line written per control type ({ keys, mouse, phone }) shows its
 *  mouse words. null = not in the file (the id is then shown as the words themselves, like the game does). */
export function wordsFor(text: unknown, lessonId: string, id: unknown): string | null {
  if (typeof id !== 'string' || !isObject(text) || !isObject(text.lessons)) return null
  const book = text.lessons
  const entry = (isObject(book[lessonId]) ? book[lessonId][id] : undefined) ?? (isObject(book.shared) ? book.shared[id] : undefined)
  if (typeof entry === 'string') return entry
  if (isObject(entry)) {
    const line = entry.mouse ?? entry.keys ?? entry.phone
    return typeof line === 'string' ? line : null
  }
  return null
}

/** Search: does this step match every word typed? (its id, words id, button, the words, what it points at) */
export function stepSearchTexts(step: LessonStepData, words: string | null): string[] {
  return [step.id, String(step.message ?? ''), String(step.button ?? ''), words ?? '', typeof step.pointer === 'string' ? step.pointer : '', String(step.pattern ?? '')]
}

/** "lessons/first-game" — the name a lesson file's live edits travel under (the Vite plugin makes the game's import of
 *  content/lessons/first-game.json follow it, like a tuning file). */
export const lessonLiveName = (file: string) => `lessons/${file}`
/** Where a lesson file is saved. */
export const lessonPath = (file: string) => `content/lessons/${file}.json`
/** "../../../content/lessons/first-game.json" → "first-game" */
export const lessonFileName = (globPath: string) => globPath.replace(/^.*\//, '').replace(/\.json(\?.*)?$/, '')
