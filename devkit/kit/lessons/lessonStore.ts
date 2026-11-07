// THE LESSONS TAB'S MEMORY (Dev Kit 0.29.0, F200) — each lesson file as saved and as edited, kept while the page
// lives (switching tabs or closing the panel keeps unsaved edits, like the Tuning tab). Every edit goes to the game at
// once as a live edit under "lessons/<file>" (the Vite plugin makes the game's import of the file follow it).
import { useSyncExternalStore } from 'react'
import { sendTuning } from '../tuning/liveTuning'
import { lessonLiveName, type LessonData } from './lessonLogic'

const saved = new Map<string, LessonData>()
const edited = new Map<string, LessonData>()
const listeners = new Set<() => void>()
let version = 0
const changed = () => { version++; for (const l of listeners) l() }

/** Start knowing a file (its data as loaded). A file already known keeps its edits. */
export function knowLesson(file: string, data: LessonData) {
  if (saved.has(file)) return
  saved.set(file, data)
  edited.set(file, data)
}

export const savedLesson = (file: string): LessonData | undefined => saved.get(file)
export const editedLesson = (file: string): LessonData | undefined => edited.get(file)

/** The tab's version of a lesson changed: remember it and send it to the game (live). */
export function editLesson(file: string, data: LessonData) {
  edited.set(file, data)
  sendTuning(lessonLiveName(file), data)
  changed()
}

/** Saved: the file on disk is now `data` (the game gets it too — it may hold a neighbour's hand edit). */
export function lessonSaved(file: string, data: LessonData) {
  saved.set(file, data)
  editLesson(file, data)
}

/** For tests: forget everything. */
export function resetLessonStore() {
  saved.clear()
  edited.clear()
  changed()
}

/** Re-render on any edit. */
export function useLessonStore(): number {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => version)
}
