// THE LESSONS TAB'S FILES (Dev Kit 0.29.0, F200) — found with import.meta.glob (finds nothing, without breaking the
// build, in a game without them — then there is no Lessons tab):
//   - the Tutorial module's VERSION (src/tutorial/VERSION, put there by install-module) — the tab shows only with it
//   - every lesson file, content/lessons/*.json — as saved (?devkit-file: the game's own imports are made live by the
//     Dev Kit's Vite plugin, and the tab compares its edits with what's on disk, not with its own edits)
//   - the game's words, content/text/en.json — to show what a step's words id says ("lessons" → lesson → id)
import { isLesson, lessonFileName, type LessonData } from './lessonLogic'

// ([V]ERSION, not VERSION: a plain path with no wildcard and no extension broke Vite's glob — "Expected pattern to be a
// non-empty string")
const versionFound =import.meta.glob<string>('../../tutorial/[V]ERSION', { eager: true, import: 'default', query: '?raw' })
const lessonsFound = import.meta.glob<unknown>('../../../content/lessons/*.json', { eager: true, import: 'default', query: '?devkit-file' })
const textFound = import.meta.glob<unknown>('../../../content/text/en.json', { eager: true, import: 'default' })

/** The Tutorial module's version in this game ("0.1.1"), or null if the game doesn't have it. */
export const tutorialVersion: string | null = Object.values(versionFound)[0]?.trim() ?? null

/** One lesson file: its name (= the file's name, "first-game") and its data as saved. */
export type LessonFile = { file: string; data: LessonData }

/** Every lesson file the tab can show, by name; files that aren't lessons are left out (and named in `notLessons`). */
export const lessonFiles: LessonFile[] = Object.entries(lessonsFound)
  .filter(([, data]) => isLesson(data))
  .map(([path, data]) => ({ file: lessonFileName(path), data: data as LessonData }))
  .sort((a, b) => a.file.localeCompare(b.file))
export const notLessons: string[] = Object.entries(lessonsFound).filter(([, data]) => !isLesson(data)).map(([path]) => `content/lessons/${lessonFileName(path)}.json`)

/** The game's en.json (for the words preview), or null. */
export const gameText: unknown = Object.values(textFound)[0] ?? null
