// THE LESSONS TAB (Dev Kit 0.29.0, framework F200 — Goops' own Lessons tab, made general). Shows when the game has the
// Tutorial module (src/tutorial/VERSION) — its lesson files, content/lessons/*.json, step by step:
//   - each step's words id (with the words it stands for in en.json), button, while (run / pause / slow), dim, when its
//     words show, its hint's wait, what it points at, and the whole step as JSON for anything else
//   - every edit is LIVE: the game's lesson file follows it (the Vite plugin), and the runner asks for the lesson again
//     at every step — so a change shows the next time its step starts (▶ it to see it now)
//   - ▶ plays the lesson from a step (or again) — needs the game's runner in its adapter: `lessons: { runner }`
//   - Save writes ONLY the keys you changed into the file as it is on disk (lessonLogic.ts) — everything else in it,
//     notes, set-ups, a hand edit made meanwhile, comes back byte-for-byte. Copy for Claude on the live link.
// The step the running lesson is on is marked "now". Shared timings (button delay, between steps, nudges) are in the
// Tuning tab: content/tuning/lessons.json.
import { useContext, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useDevKitGame, type DevKitLessonRunner } from '../devkitGame'
import { CAN_SAVE, copyText, readContentFile, saveContentFile } from '../saveContent'
import { Highlight, SearchCount, Section, SectionIndex } from '../search/Section'
import { DevKitSearch } from '../search/searchContext'
import { matchesAll, searchTerms } from '../search/searchLogic'
import { gameText, lessonFiles, notLessons, type LessonFile } from './lessonFiles'
import {
  applyLessonChanges, describeAdvance, describeChanges, isLesson, lessonChanges, lessonPath, setStepField, stepField, stepSearchTexts, wordsFor,
  type LessonStepData,
} from './lessonLogic'
import { editLesson, editedLesson, knowLesson, lessonSaved, savedLesson, useLessonStore } from './lessonStore'
import '../tuning/tuning.css'
import './lessons.css'

type Props = { query?: string; files?: LessonFile[]; text?: unknown }
type Status = { tone: '' | 'is-ok' | 'is-error'; text: string }

const BUTTONS = ['next', 'gotIt', 'play']
const IDLE_VIEW = { lessonId: null, stepIndex: -1 }
const noRunner: DevKitLessonRunner = { view: () => IDLE_VIEW, subscribe: () => () => {}, start: () => {} }

export function LessonsTab({ query = '', files = lessonFiles, text = gameText }: Props) {
  useLessonStore()
  const search = useContext(DevKitSearch)
  const game = useDevKitGame()
  const lessons = game?.lessons
  const runner = lessons?.runner ?? noRunner
  const view = useSyncExternalStore(runner.subscribe, runner.view)
  const [file, setFile] = useState(files[0]?.file ?? '')
  const [status, setStatus] = useState<Status>({ tone: '', text: '' })
  for (const f of files) knowLesson(f.file, f.data)

  if (!files.length) {
    return (
      <p className="devkit-not-plugged">
        No lessons yet — a lesson is a file in <code>content/lessons/</code> (the Tutorial module's README: "The lesson file").
        {notLessons.length > 0 && <> Not lessons (no steps with ids): {notLessons.join(', ')}.</>}
      </p>
    )
  }
  const saved = savedLesson(file)!
  const lesson = editedLesson(file)!
  const lessonId = typeof lesson.id === 'string' ? lesson.id : file
  const changes = lessonChanges(saved, lesson)
  const terms = searchTerms(query)

  const setStep = (index: number, next: LessonStepData) => {
    editLesson(file, { ...lesson, steps: lesson.steps.map((s, i) => (i === index ? next : s)) })
    setStatus({ tone: '', text: 'Changed — live in the game the next time that step starts (▶ to see it now). Not saved yet.' })
  }
  const setField = (index: number, path: string[], value: unknown) => setStep(index, setStepField(lesson.steps[index], path, value))

  const play = (at: number) => {
    if (!lessons) return
    try {
      const ok = lessons.start ? lessons.start(lessonId, at) : (runner.start(() => editedLesson(file), at), true)
      setStatus(ok === false
        ? { tone: 'is-error', text: 'The game can’t start a lesson right now.' }
        : { tone: 'is-ok', text: `Playing ${lessonId} from step ${at + 1}.` })
    } catch (e) {
      setStatus({ tone: 'is-error', text: `Couldn’t start it: ${(e as Error).message}` })
    }
  }
  const save = async () => {
    if (!changes.length) return setStatus({ tone: '', text: 'Nothing to save — no changes.' })
    if (!CAN_SAVE) {
      const lines = [`Lesson changes (${lessonPath(file)}):`, ...describeChanges(file, changes)].join('\n')
      const ok = await copyText(lines)
      return setStatus(ok ? { tone: 'is-ok', text: 'Copied — paste it to Claude.' } : { tone: 'is-error', text: 'The browser refused the copy.' })
    }
    try {
      const fresh = await readContentFile(lessonPath(file))
      if (!isLesson(fresh)) throw new Error(`couldn’t read ${lessonPath(file)} as it is now`)
      const merged = applyLessonChanges(fresh, changes)
      await saveContentFile(lessonPath(file), merged)
      lessonSaved(file, merged)
      setStatus({ tone: 'is-ok', text: `Saved ${lessonPath(file)} — ${changes.length} change${changes.length === 1 ? '' : 's'}, the rest of the file as it was.` })
    } catch (e) {
      setStatus({ tone: 'is-error', text: `Couldn’t save: ${(e as Error).message}` })
    }
  }
  const copy = async () => {
    const ok = await copyText([`Lesson changes (${lessonPath(file)}):`, ...describeChanges(file, changes)].join('\n'))
    setStatus(ok ? { tone: 'is-ok', text: 'Copied the changes for Claude.' } : { tone: 'is-error', text: 'The browser refused the copy.' })
  }
  const undo = () => { editLesson(file, saved); setStatus({ tone: '', text: 'Back to the saved lesson.' }) }

  const steps = lesson.steps
    .map((step, index) => ({ step, index, words: wordsFor(text, lessonId, step.message) }))
    .filter(({ step, words }) => matchesAll(terms, stepSearchTexts(step, words)))
  const sectionId = (step: LessonStepData) => `lessons:${file}:${step.id}`
  const playingHere = view.lessonId === lessonId
  const running = view.lessonId ? `Playing now: ${view.lessonId} · step ${view.stepIndex + 1}` : 'No lesson playing'

  return (
    <div className="tt lessons-tab">
      <div className="lessons-top">
        {files.length > 1 && (
          <select className="tt-select" value={file} onChange={(e) => { setFile(e.target.value); setStatus({ tone: '', text: '' }) }} aria-label="Lesson">
            {files.map((f) => <option key={f.file} value={f.file}>{f.file}</option>)}
          </select>
        )}
        {files.length === 1 && <strong className="lessons-name">{file}</strong>}
        <button type="button" className="devkit-btn" disabled={!lessons} onClick={() => play(0)}>▶ From the start</button>
        {lessons && runner.stop && <button type="button" className="devkit-btn" disabled={!view.lessonId} onClick={() => runner.stop?.()}>■ Stop</button>}
      </div>
      <p className="tt-legend">
        {lessons ? running : <>▶ needs the game's lesson runner: add <code>lessons: {'{ runner }'}</code> to the adapter (src/devkit-game/). Edits and Save work without it.</>}
        {' · '}{lessonPath(file)} · {lesson.steps.length} step{lesson.steps.length === 1 ? '' : 's'}
      </p>
      <SearchCount query={query} found={steps.length} what="step" where="Lessons" />
      {!terms.length && <SectionIndex label="Steps" sections={lesson.steps.map((s, i) => ({ id: sectionId(s), title: `${i + 1} · ${s.id}`, count: Object.keys(s).length }))} />}
      {steps.map(({ step, index, words }) => {
        const before = saved.steps.find((s) => s.id === step.id)
        const now = playingHere && view.stepIndex === index
        const stepChanged = JSON.stringify(before) !== JSON.stringify(step)
        return (
          <Section key={step.id} id={sectionId(step)} title={`${index + 1} · ${step.id}${now ? ' · now' : ''}`} count={Object.keys(step).length}
            terms={terms} defaultOpen={lesson.steps.length <= 6} changed={stepChanged} onGoTo={() => search.goTo(sectionId(step))}>
            <div className="lessons-step" data-step={step.id} data-now={now || undefined}>
              <div className="lessons-step-btns">
                <button type="button" className="devkit-btn" disabled={!lessons} onClick={() => play(index)} aria-label={`Play from step ${index + 1} (${step.id})`}>▶ Play from here</button>
                <button type="button" className="devkit-btn" disabled={!stepChanged} onClick={() => before && setStep(index, before)}>↺ Step back to saved</button>
              </div>
              <TextField label="Words (text id, or the words)" path={['message']} step={step} before={before} terms={terms} onChange={(v) => setField(index, ['message'], v)}
                help={words !== null ? `“${words}”` : step.message ? 'Not in en.json "lessons" — the game shows it as written.' : 'No words: the step only points.'} />
              <TextField label="Button" path={['button']} step={step} before={before} terms={terms} list="lessons-buttons" onChange={(v) => setField(index, ['button'], v)}
                help="next · gotIt · play, or any text id. Empty = the game’s default word." />
              <ChoiceField label="While its words show" path={['while']} step={step} before={before} options={['run', 'pause', 'slow']} onChange={(v) => setField(index, ['while'], v)} />
              <BoolField label="Dim everything else" path={['dim']} step={step} before={before} onChange={(v) => setField(index, ['dim'], v)} />
              <NumberField label="Words show after (s)" path={['showAfter']} step={step} before={before} onChange={(v) => setField(index, ['showAfter'], v)} />
              {stepField(step, ['hint']) !== undefined && (
                <NumberField label="Hint after (s)" path={['hint', 'after']} step={step} before={before} onChange={(v) => setField(index, ['hint', 'after'], v)} />
              )}
              <Row label="Moves on when" changed={false}>
                <span className="tt-text">{describeAdvance(step.advance)}</span>
              </Row>
              {stepField(step, ['advance', 'on']) === 'time' && (
                <NumberField label="Moves on after (s)" path={['advance', 'after']} step={step} before={before} onChange={(v) => setField(index, ['advance', 'after'], v)} />
              )}
              {typeof step.pointer === 'string' || step.pointer === undefined
                ? <TextField label="Points at" path={['pointer']} step={step} before={before} terms={terms} onChange={(v) => setField(index, ['pointer'], v)} help="Whatever the game’s look understands (a CSS selector here)." />
                : <Row label="Points at" changed={false}><code className="tt-text">{JSON.stringify(step.pointer)}</code></Row>}
              <JsonField step={step} onChange={(next) => setStep(index, next)} />
            </div>
          </Section>
        )
      })}
      <datalist id="lessons-buttons">{BUTTONS.map((b) => <option key={b} value={b} />)}</datalist>
      <div className="devkit-footer">
        <button type="button" className="devkit-btn devkit-btn-main" onClick={save} disabled={!changes.length}>{CAN_SAVE ? 'Save' : 'Copy for Claude'}</button>
        {CAN_SAVE && <button type="button" className="devkit-btn" onClick={copy} disabled={!changes.length}>Copy for Claude</button>}
        <button type="button" className="devkit-btn" onClick={undo} disabled={!changes.length}>Undo unsaved</button>
        {changes.length > 0 && <p className="devkit-status lessons-count">{changes.length} unsaved change{changes.length === 1 ? '' : 's'}.</p>}
        {status.text && <p className={`devkit-status ${status.tone}`} role="status">{status.text}</p>}
      </div>
    </div>
  )
}

// ---- one field of a step ----
type FieldProps = { label: string; path: string[]; step: LessonStepData; before: LessonStepData | undefined }
const differs = (step: LessonStepData, before: LessonStepData | undefined, path: string[]) =>
  JSON.stringify(stepField(step, path)) !== JSON.stringify(stepField(before, path))

function Row({ label, changed, help, children, terms = [] }: { label: string; changed: boolean; help?: string; children: ReactNode; terms?: string[] }) {
  return (
    <div className="tt-row lessons-row">
      <span className="tt-name">{changed && <span className="tt-dot" title="Changed, not saved yet" />}<span className="tt-label">{label}</span></span>
      {children}
      {help && <p className="tt-row-help"><Highlight text={help} terms={terms} /></p>}
    </div>
  )
}

function TextField({ label, path, step, before, help, list, terms, onChange }: FieldProps & { help?: string; list?: string; terms: string[]; onChange: (v: string | undefined) => void }) {
  const value = stepField(step, path)
  return (
    <Row label={label} changed={differs(step, before, path)} help={help} terms={terms}>
      <input className="tt-number lessons-text" type="text" value={typeof value === 'string' ? value : ''} list={list} aria-label={`${step.id}: ${label}`}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)} />
    </Row>
  )
}

function NumberField({ label, path, step, before, onChange }: FieldProps & { onChange: (v: number | undefined) => void }) {
  const value = stepField(step, path)
  return (
    <Row label={label} changed={differs(step, before, path)}>
      <input className="tt-number lessons-num" type="number" min={0} step={0.1} value={typeof value === 'number' ? value : ''} placeholder="not set" aria-label={`${step.id}: ${label}`}
        onChange={(e) => {
          if (e.target.value === '') onChange(undefined)
          else if (Number.isFinite(e.target.valueAsNumber) && e.target.valueAsNumber >= 0) onChange(e.target.valueAsNumber)
        }} />
    </Row>
  )
}

function ChoiceField({ label, path, step, before, options, onChange }: FieldProps & { options: string[]; onChange: (v: string | undefined) => void }) {
  const value = stepField(step, path)
  return (
    <Row label={label} changed={differs(step, before, path)}>
      <select className="tt-select" value={typeof value === 'string' ? value : ''} aria-label={`${step.id}: ${label}`} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">(not set — its pattern or run)</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Row>
  )
}

function BoolField({ label, path, step, before, onChange }: FieldProps & { onChange: (v: boolean | undefined) => void }) {
  const value = stepField(step, path)
  const was = stepField(before, path)
  return (
    <Row label={label} changed={differs(step, before, path)}>
      <input type="checkbox" className="lessons-check" checked={value === true} aria-label={`${step.id}: ${label}`}
        // unticked: false if the file said false, else the key is taken out (not set = no dim)
        onChange={(e) => onChange(e.target.checked ? true : was === false ? false : undefined)} />
    </Row>
  )
}

// The whole step as JSON — for any field the rows above don't show (setup, advance, retry, reactions…)
function JsonField({ step, onChange }: { step: LessonStepData; onChange: (next: LessonStepData) => void }) {
  const text = JSON.stringify(step, null, 2)
  const [draft, setDraft] = useState<string | null>(null)
  const [problem, setProblem] = useState('')
  const apply = () => {
    if (draft === null) return
    try {
      const next: unknown = JSON.parse(draft)
      if (!next || typeof next !== 'object' || Array.isArray(next)) throw new Error('a step is an object { … }')
      if ((next as { id?: unknown }).id !== step.id) throw new Error(`keep its id "${step.id}" (Save finds the step by it — rename it in the file)`)
      onChange(next as LessonStepData)
      setDraft(null)
      setProblem('')
    } catch (e) {
      setProblem((e as Error).message)
    }
  }
  return (
    <details className="lessons-json">
      <summary>All of this step (JSON)</summary>
      <textarea className="tt-copy lessons-json-box" value={draft ?? text} spellCheck={false} aria-label={`${step.id}: the whole step as JSON`}
        onChange={(e) => { setDraft(e.target.value); setProblem('') }} />
      <div className="lessons-json-btns">
        <button type="button" className="devkit-btn" disabled={draft === null || draft === text} onClick={apply}>Apply</button>
        {draft !== null && <button type="button" className="devkit-btn" onClick={() => { setDraft(null); setProblem('') }}>Cancel</button>}
        {problem && <span className="devkit-status is-error">{problem}</span>}
      </div>
    </details>
  )
}
