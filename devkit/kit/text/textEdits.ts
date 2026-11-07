// A TEXT FILE'S EDITS (Dev Kit 0.30.0, framework F200 task 22) — plain functions, no React. The Text tab and the
// Lessons tab both edit content/text/en.json through textStore.ts; these are the sums behind it:
//   - setAt / getAt: one value at a path (["lessons", "first-game", "board", "mouse"]), new objects made on the way
//   - textEdits: what differs between the file as saved and as edited, as small edits (a word line, or a whole words
//     entry when it changed shape — one plain line became one line per control type)
//   - applyTextEdits: those edits put on top of the file as it is on disk NOW — everything else in it comes back as
//     it is, so the Save endpoint's formatJson writes every other byte unchanged
export type Key = string | number // a number = a place in a list
/** One edit: the value at `path` was `was` (undefined = not in the file), is `value` (undefined = taken out). */
export type TextEdit = { path: Key[]; value: unknown; was: unknown }

const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The value at a path, or undefined. */
export function getAt(data: unknown, path: Key[]): unknown {
  let at: unknown = data
  for (const key of path) at = at !== null && typeof at === 'object' ? (at as Record<Key, unknown>)[key] : undefined
  return at
}

/** A copy of `data` with the value at `path` set (undefined = taken out). Objects missing on the way are made;
 *  null when the way is blocked (a word line where an object should be — e.g. a hand edit made meanwhile). */
export function setAt<T>(data: T, path: Key[], value: unknown): T | null {
  const out = structuredClone(data)
  let at = out as Record<Key, unknown>
  for (const key of path.slice(0, -1)) {
    if (at[key] === undefined) {
      if (value === undefined) return out // taking out something whose parent is already gone
      at[key] = {}
    }
    if (at[key] === null || typeof at[key] !== 'object') return null
    at = at[key] as Record<Key, unknown>
  }
  const last = path[path.length - 1]
  if (value === undefined) {
    if (Array.isArray(at)) return null // a list keeps its places (the Text tab never takes a page out)
    delete at[last]
  } else at[last] = structuredClone(value)
  return out
}

/** Every edit between the file as saved and as edited. Objects and lists of the same length are gone into, so an edit
 *  is as small as it can be (one word line); anything else that differs is one edit with its whole new value. */
export function textEdits(saved: unknown, edited: unknown, path: Key[] = []): TextEdit[] {
  if (same(saved, edited)) return []
  if (isObject(saved) && isObject(edited)) {
    return [...new Set([...Object.keys(saved), ...Object.keys(edited)])].flatMap((k) => textEdits(saved[k], edited[k], [...path, k]))
  }
  if (Array.isArray(saved) && Array.isArray(edited) && saved.length === edited.length) {
    return saved.flatMap((v, i) => textEdits(v, edited[i], [...path, i]))
  }
  return [{ path, value: edited, was: saved }]
}

/** The edits on top of the file as it is on disk now (`fresh`). `lost` = the edits that couldn't land: words the tab
 *  changed that aren't in the file any more (renamed or taken out by hand), or a way blocked by a hand edit. */
export function applyTextEdits<T>(fresh: T, edits: TextEdit[]): { data: T; lost: TextEdit[] } {
  let data = fresh
  const lost: TextEdit[] = []
  for (const e of edits) {
    if (e.was !== undefined && getAt(data, e.path) === undefined) { lost.push(e); continue }
    const next = setAt(data, e.path, e.value)
    if (next === null) lost.push(e)
    else data = next
  }
  return { data, lost }
}

/** "lessons.first-game.board" */
export const pathKey = (path: Key[]) => path.join('.')
