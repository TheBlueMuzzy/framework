// THE FIRST-GAME TUTORIAL'S CONNECTOR — the Tutorial module's step player wired to this game (README: "Your game's
// tutorial"). The steps: content/lessons/first-game.json · their words: content/text/en.json "lessons" · their timing:
// content/tuning/lessons.json · their look: src/ui/LessonView.tsx (the UI kit's Spotlight + Callout).
// It plays on a device's first game against the computer (the UI kit's tips memory remembers it played to the end);
// Settings → Replay tutorial plays it again. Scripted checks start as a returning device unless ?tutorial=fresh.
import { createLessonRunner, watchControls, type Lesson } from '../tutorial'
import { rulesClock } from '../devkit/gameClock'
import { screens, tipsMemory } from '../ui/kit'
import timing from '../../content/tuning/lessons.json'
import { opponents } from '../ai/bots'
import { BOT, YOU, getMatch, holdMatch, startMatch, subscribeMatch } from '../game/match'

export const LESSON = 'first-game'
const files = import.meta.glob<Lesson>('../../content/lessons/*.json', { eager: true, import: 'default' })
const lesson = () => files[`../../content/lessons/${LESSON}.json`]
export const controls = watchControls()

export const runner = createLessonRunner({
  clock: rulesClock,
  timing: () => timing,
  game: {
    // the lesson's start: a fresh board with you to move first (the bot may have been picked to start)
    setup: (s) => {
      const m = getMatch()
      if (s.youGoFirst && m && m.state.turn === BOT && !m.record.moves.length) startMatch(m.opponent, { firstSeat: YOU })
    },
    gate: () => null,
    setSpeed: (speed, inputOn) => holdMatch(speed === 0 || !inputOn),
    finished: () => tipsMemory().markSeen(LESSON),
  },
})

const checkRun = () => import.meta.env.DEV && navigator.webdriver && new URLSearchParams(location.search).get('tutorial') !== 'fresh'
let replay = false
const due = () => replay || (!checkRun() && tipsMemory().shouldShow(LESSON))

/** Settings → Replay tutorial: close the screens and start a new game against the computer, with the lesson. */
export function replayTutorial() {
  replay = true
  runner.stop()
  while (screens.current.length) screens.pop()
  startMatch(getMatch()?.opponent ?? opponents()[0])
}

// The game tells the lesson what happens: a new match (start it when it's due), every mark placed, leaving the match
let setupSeen: unknown = null
let heard = 0
subscribeMatch(() => {
  const m = getMatch()
  if (!m) { setupSeen = null; if (runner.view().lessonId) runner.stop(); return }
  if (m.record.setup !== setupSeen) {
    setupSeen = m.record.setup
    heard = m.record.moves.length
    if (!heard && lesson() && !runner.view().lessonId && due()) { replay = false; runner.start(lesson) }
    return
  }
  for (; heard < m.record.moves.length; heard++) runner.event('placed', { by: m.record.moves[heard].seat === YOU ? 'you' : 'bot' })
})
