// THE TUTORIAL'S LOOK — the running lesson step (src/tutorial-game/firstGame.ts) drawn with the UI kit: a Spotlight on
// what the step points at (everything else dimmed; taps reach only the lit thing) and a Callout with its words, kept
// off the board. Words per control type ("Click" / "Tap") from content/text/en.json "lessons". A step that waits for a
// move gets the kit's nudge timer: after a while the lit thing glows, later the words say "Go on…"
// (content/tuning/lessons.json). Hidden while Pause or Settings is open over the game.
import { useEffect, useSyncExternalStore } from 'react'
import text from '../../content/text/en.json'
import timing from '../../content/tuning/lessons.json'
import { Callout, Spotlight, fill, useNudge, useScreens } from './kit'
import { lessonLine } from '../tutorial'
import { controls, runner } from '../tutorial-game/firstGame'
import { useMatch } from '../game/match'
import { useTuningEdits } from './hooks'
import { personalityName } from './names'

export function LessonView() {
  useTuningEdits('lessons')
  const view = useSyncExternalStore(runner.subscribe, runner.view)
  const match = useMatch()
  const covered = useScreens().length > 0
  const m = covered ? null : view.message
  const { stage } = useNudge({ kind: m && !m.waitsForDismiss ? 'move' : null, running: !!m,
    glowAt: timing.nudgeGlowSeconds, textAt: timing.nudgeWordsSeconds, repeat: timing.nudgeRepeat })
  // Enter presses the step's button (the Callout only takes the focus when it dims by itself)
  const canClose = !!m?.waitsForDismiss && m.armed
  useEffect(() => {
    if (!canClose) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); runner.dismiss() } }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [canClose])
  if (!m || typeof m.pointer !== 'string') return null

  const name = match ? personalityName(match.opponent.personality) : ''
  const line = (id: string) => fill(lessonLine(text.lessons, view.lessonId, id, controls.kind()), { name })
  return (
    <>
      {m.dim && <Spotlight key={view.stepId} targets={m.pointer} pulse={stage !== 'none'} />}
      <Callout key={`${view.stepId}:${m.kind}`} target={m.pointer} text={line(stage === 'text' ? 'nudgeMove' : m.text)}
        keepClear={{ area: '[data-board]' }} action={m.waitsForDismiss ? line(m.button ?? 'gotIt') : undefined}
        onDismiss={() => runner.dismiss()} />
    </>
  )
}
