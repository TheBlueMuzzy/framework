// THE TUTORIAL MODULE — the blocks a game picks from to teach (README: the toolbox). Import from here:
//   import { createLessonRunner, type Lesson } from '../tutorial'
// The bubble, the tips memory and the nudge timer are the UI kit's (src/ui/kit: Callout, tipsMemory, nudge) — this
// module never draws anything.
export { createLessonRunner } from './runner'
export type { LessonClock, LessonGame, LessonMessage, LessonRunner, LessonView } from './runner'
export type {
  Condition, Lesson, LessonHint, LessonInsist, LessonInterrupt, LessonReaction, LessonRetry, LessonStep, LessonTiming, WhileShowing,
} from './lessonTypes'
export { PATTERNS, expandStep } from './patterns'
