// THE TEXT FILES' MEMORY (Dev Kit 0.30.0, framework F200 task 22) — each content/text file as saved and as edited,
// shared by every tab that edits words: the Text tab (every string) and the Lessons tab (a step's words). One memory,
// so the two always agree — a line typed in one shows in the other — and unsaved edits outlive a tab switch.
// Every edit is also sent to the game as a live edit under "text/<name>" (content/text/en.json → "text/en"). A game
// that listens (README "Live words — optional") redraws the words at once; a game that doesn't sees them after Save,
// which reloads its words as it always has.
import { useSyncExternalStore } from 'react'
import { sendTuning } from '../tuning/liveTuning'
import { applyTextEdits, getAt, setAt, textEdits, type Key } from './textEdits'

type Entry = { source: string; saved: object; edited: object }
const files = new Map<string, Entry>()
const listeners = new Set<() => void>()
let version = 0
const changed = () => { version++; for (const l of listeners) l() }

/** "content/text/en.json" → "text/en" — the name a text file's live edits travel under. */
export const textLiveName = (file: string) => file.replace(/^content\//, '').replace(/\.json$/i, '')

/** Start knowing a file (the data the game imported). Known already: kept — unless the file itself changed (a hand
 *  edit, Vite brought the new one): then that is the saved file, with the unsaved edits put back on top. */
export function knowText(file: string, data: object) {
  const source = JSON.stringify(data)
  const known = files.get(file)
  if (known?.source === source) return
  const plain = JSON.parse(source) as object
  if (!known) { files.set(file, { source, saved: plain, edited: plain }); return }
  const edited = applyTextEdits(plain, textEdits(known.saved, known.edited)).data
  files.set(file, { source, saved: plain, edited })
}

export const savedText = (file: string): object | undefined => files.get(file)?.saved
export const editedText = (file: string): object | undefined => files.get(file)?.edited

/** Set one value in the edited file (a word line, or a whole words entry; undefined = take it out), and send the
 *  whole edited file to the game (live). */
export function editText(file: string, path: Key[], value: unknown) {
  const known = files.get(file)
  if (!known) return
  const edited = setAt(known.edited, path, value)
  if (!edited) return
  files.set(file, { ...known, edited })
  sendTuning(textLiveName(file), edited)
  changed()
}

/** Put the edited file back to the saved one — all of it, or only the paths `keep` says yes to. */
export function undoText(file: string, which: (path: Key[]) => boolean = () => true) {
  const known = files.get(file)
  if (!known) return
  const back = textEdits(known.saved, known.edited).filter((e) => which(e.path)).map((e) => ({ ...e, value: e.was, was: e.value }))
  const edited = applyTextEdits(known.edited, back).data
  files.set(file, { ...known, edited })
  sendTuning(textLiveName(file), edited)
  changed()
}

/** Saved: the file on disk is now `data`. Edits that weren't part of this save stay unsaved on top of it. */
export function textSaved(file: string, data: object) {
  const known = files.get(file)
  if (!known) return
  const left = textEdits(known.saved, known.edited).filter((e) => JSON.stringify(e.value) !== JSON.stringify(getAt(data, e.path)))
  const edited = applyTextEdits(data, left).data
  files.set(file, { ...known, saved: data, edited })
  sendTuning(textLiveName(file), edited)
  changed()
}

/** For tests: forget everything. */
export function resetTextStore() {
  files.clear()
  changed()
}

/** Re-render on any edit. */
export function useTextStore(): number {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => version)
}
