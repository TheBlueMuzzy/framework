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
import { applyTextEdits, getAt, pathKey, textEdits, type TextEdit } from '../text/textEdits'
import { missingPlaceholders, missingWarning } from '../text/textLogic'
import { editText, editedText, knowText, savedText, textSaved, undoText, useTextStore } from '../text/textStore'
import { Highlight, SearchCount, Section, SectionIndex } from '../search/Section'
import { DevKitSearch } from '../search/searchContext'
import { matchesAll, searchTerms } from '../search/searchLogic'
import { gameText, lessonFiles, notLessons, type LessonFile } from './lessonFiles'
import {
  CONTROL_KINDS, applyLessonChanges, describeAdvance, describeChanges, fallbackWords, isLesson, lessonChanges, lessonPath, setStepField, stepField,
  stepSearchTexts, wordsEntry, wordsFor, type ControlKindName, type LessonStepData, type WordsEntry,
} from './lessonLogic'
import { editLesson, editedLesson, knowLesson, lessonSaved, savedLesson, useLessonStore } from './lessonStore'
import '../tuning/tuning.css'
import '../text/text.css'
import './lessons.css'

// text = the game's en.json as saved; textFile = where it is (the step's words are edited there, shared with the Text tab)
type Props = { query?: string; files?: LessonFile[]; text?: unknown; textFile?: string }
type Status = { tone: '' | 'is-ok' | 'is-error'; text: string }

const BUTTONS = ['next', 'gotIt', 'play']
const IDLE_VIEW = { lessonId: null, stepIndex: -1 }
const TEXT_FILE = 'content/text/en.json'
const noRunner: DevKitLessonRunner = { view: () => IDLE_VIEW, subscribe: () => () => {}, start: () => {} }

export function LessonsTab({ query = '', files = lessonFiles, text = gameText, textFile = TEXT_FILE }: Props) {
  useLessonStore()
  useTextStore()
  const hasText = text !== null && typeof text === 'object' && !Array.isArray(text)
  if (hasText) knowText(textFile, text)
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
  // the words: the shared text memory (textStore.ts) — only its "lessons" block is this tab's
  const textNow = hasText ? editedText(textFile) : null
  const textThen = hasText ? savedText(textFile) : null
  const wordEdits: TextEdit[] = hasText ? textEdits(textThen, textNow).filter((e) => e.path[0] === 'lessons') : []
  const lostHoles = wordEdits.some((e) => linesOf(e.value).some((line) => linesOf(e.was).some((was) => missingPlaceholders(was, line).length > 0)))
  const unsaved = changes.length + wordEdits.length
  const setWords = (path: (string | number)[], value: unknown) => {
    editText(textFile, path, value)
    setStatus({ tone: '', text: 'Words changed — live in the game. Not saved yet.' })
  }

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
  const forClaude = () => [
    ...(changes.length ? [`Lesson changes (${lessonPath(file)}):`, ...describeChanges(file, changes)] : []),
    ...(wordEdits.length ? [`Words changes (${textFile}):`, ...wordEdits.map((e) => `${pathKey(e.path)}: ${show(e.was)} → ${show(e.value)}`)] : []),
  ].join('\n')
  // One Save for both files, each only if it changed: the lesson's own keys onto the lesson file as it is on disk, the
  // changed words onto en.json as it is on disk (the Text tab's way: it reloads the game's words) — the rest of each as it was
  const save = async () => {
    if (!unsaved) return setStatus({ tone: '', text: 'Nothing to save — no changes.' })
    if (lostHoles) return
    if (!CAN_SAVE) {
      const ok = await copyText(forClaude())
      return setStatus(ok ? { tone: 'is-ok', text: 'Copied — paste it to Claude.' } : { tone: 'is-error', text: 'The browser refused the copy.' })
    }
    const done: string[] = []
    try {
      if (changes.length) {
        const fresh = await readContentFile(lessonPath(file))
        if (!isLesson(fresh)) throw new Error(`couldn’t read ${lessonPath(file)} as it is now`)
        const merged = applyLessonChanges(fresh, changes)
        await saveContentFile(lessonPath(file), merged)
        lessonSaved(file, merged)
        done.push(`${lessonPath(file)} — ${changes.length} change${changes.length === 1 ? '' : 's'}`)
      }
      let lost: TextEdit[] = []
      if (wordEdits.length) {
        const fresh = (await readContentFile(textFile)) ?? textThen!
        const merged = applyTextEdits(fresh, wordEdits)
        lost = merged.lost
        await saveContentFile(textFile, merged.data, { reload: true })
        textSaved(textFile, merged.data)
        const n = wordEdits.length - lost.length
        done.push(`${textFile} — ${n} line${n === 1 ? '' : 's'}`)
      }
      setStatus(lost.length
        ? { tone: 'is-error', text: `Saved ${done.join(', and ')}, but ${lost.map((e) => pathKey(e.path)).join(', ')} isn’t in en.json any more — not written.` }
        : { tone: 'is-ok', text: `Saved ${done.join(', and ')}; the rest of ${done.length > 1 ? 'both files' : 'the file'} as it was.` })
    } catch (e) {
      setStatus({ tone: 'is-error', text: `Couldn’t save: ${(e as Error).message}${done.length ? ` (saved first: ${done.join(', ')})` : ''}` })
    }
  }
  const copy = async () => {
    const ok = await copyText(forClaude())
    setStatus(ok ? { tone: 'is-ok', text: 'Copied the changes for Claude.' } : { tone: 'is-error', text: 'The browser refused the copy.' })
  }
  const undo = () => {
    editLesson(file, saved)
    if (hasText) undoText(textFile, (path) => path[0] === 'lessons')
    setStatus({ tone: '', text: 'Back to the saved lesson and words.' })
  }

  const steps = lesson.steps
    .map((step, index) => ({ step, index, words: wordsFor(hasText ? textNow : text, lessonId, step.message) }))
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
              {hasText
                ? <WordsField stepId={step.id} where={wordsEntry(textNow, lessonId, step.message)} savedText={textThen} onSet={setWords} />
                : <Row label="Words" changed={false} help={words !== null ? `“${words}”` : 'No en.json "lessons" — the game shows the words id as written.'}><span /></Row>}
              <TextField label="Words id" path={['message']} step={step} before={before} terms={terms} small onChange={(v) => setField(index, ['message'], v)}
                help={step.message ? 'The words’ name in en.json "lessons" (or the words themselves, shown as written). Another id = another line.' : 'No words: the step only points. Type an id to give it some.'} />
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
        <button type="button" className="devkit-btn devkit-btn-main" onClick={save} disabled={!unsaved || lostHoles}>{CAN_SAVE ? 'Save' : 'Copy for Claude'}</button>
        {CAN_SAVE && <button type="button" className="devkit-btn" onClick={copy} disabled={!unsaved}>Copy for Claude</button>}
        <button type="button" className="devkit-btn" onClick={undo} disabled={!unsaved}>Undo unsaved</button>
        {unsaved > 0 && <p className="devkit-status lessons-count">{unsaved} unsaved change{unsaved === 1 ? '' : 's'}.{lostHoles && ' Save waits: a line lost a {placeholder} (⚠ above).'}</p>}
        {status.text && <p className={`devkit-status ${status.tone}`} role="status">{status.text}</p>}
      </div>
    </div>
  )
}

// ---- one field of a step ----
type FieldProps = { label: string; path: string[]; step: LessonStepData; before: LessonStepData | undefined }
const differs = (step: LessonStepData, before: LessonStepData | undefined, path: string[]) =>
  JSON.stringify(stepField(step, path)) !== JSON.stringify(stepField(before, path))

function Row({ label, changed, help, children, terms = [], small }: { label: string; changed: boolean; help?: string; children: ReactNode; terms?: string[]; small?: boolean }) {
  return (
    <div className={`tt-row lessons-row${small ? ' lessons-row-small' : ''}`}>
      <span className="tt-name">{changed && <span className="tt-dot" title="Changed, not saved yet" />}<span className="tt-label">{label}</span></span>
      {children}
      {help && <p className="tt-row-help"><Highlight text={help} terms={terms} /></p>}
    </div>
  )
}

function TextField({ label, path, step, before, help, list, terms, small, onChange }: FieldProps & { help?: string; list?: string; terms: string[]; small?: boolean; onChange: (v: string | undefined) => void }) {
  const value = stepField(step, path)
  return (
    <Row label={label} changed={differs(step, before, path)} help={help} terms={terms} small={small}>
      <input className={`tt-number lessons-text${small ? ' lessons-small' : ''}`} type="text" value={typeof value === 'string' ? value : ''} list={list} aria-label={`${step.id}: ${label}`}
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

// ---- a step's words (0.30.0, F200 task 22) ----
const show = (v: unknown) => (v === undefined ? '(not set)' : JSON.stringify(v))
/** Every word line in a value: a string, or the strings of a per-control-type line. */
const linesOf = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : v !== null && typeof v === 'object' ? Object.values(v).filter((x): x is string => typeof x === 'string') : []

/** The step's words, typed right here: one box for a plain line, one per control type when the line has them. They
 *  live in en.json where the Tutorial module looks (the lesson's own line, else "shared"); an id with no words yet →
 *  typing makes its line in the lesson's own block. Edits go to the shared text memory: live, and the Text tab agrees. */
function WordsField({ stepId, where, savedText, onSet }: { stepId: string; where: WordsEntry | null; savedText: unknown; onSet: (path: (string | number)[], value: unknown) => void }) {
  if (!where) return null
  const { path, entry, shared } = where
  const then = getAt(savedText, path)
  const at = `en.json ${path.join('.')}`
  const help = shared
    ? `Shared line (${at}) — other lessons use it too: a change here changes theirs.`
    : entry === undefined ? `No words yet — typing puts them in ${at}.` : `In ${at}.`
  const box = (kind: ControlKindName | null, value: string, was: string | undefined) => {
    const missing = was === undefined ? [] : missingPlaceholders(was, value)
    return (
      <div key={kind ?? 'plain'} className="lessons-words-line">
        {kind && <span className="lessons-kind">{kind}</span>}
        <textarea className="tx-box lessons-words-box" rows={1} spellCheck value={value} aria-label={`${stepId}: Words${kind ? ` (${kind})` : ''}`}
          placeholder={entry === undefined ? 'Type the words…' : undefined}
          onChange={(e) => {
            const v = e.target.value
            if (kind) onSet([...path, kind], v)
            else onSet(path, v === '' && then === undefined ? undefined : v) // a new line typed back to nothing: no line
          }} />
        {missing.map((name) => <p key={name} className="tx-warn" role="alert">⚠ {missingWarning(name)}</p>)}
      </div>
    )
  }
  const perKind = entry !== null && typeof entry === 'object' && !Array.isArray(entry) ? entry as Record<string, unknown> : null
  return (
    <Row label="Words" changed={JSON.stringify(entry) !== JSON.stringify(then)} help={help}>
      <div className="lessons-words">
        {perKind
          ? CONTROL_KINDS.filter((k) => typeof perKind[k] === 'string').map((k) => {
              const was = then !== null && typeof then === 'object' ? (then as Record<string, unknown>)[k] : then
              return box(k, perKind[k] as string, typeof was === 'string' ? was : undefined)
            })
          : box(null, typeof entry === 'string' ? entry : '', typeof then === 'string' ? then : undefined)}
        <div className="lessons-words-btns">
          {perKind && CONTROL_KINDS.filter((k) => typeof perKind[k] !== 'string').map((k) => (
            <button key={k} type="button" className="devkit-btn lessons-mini" aria-label={`${stepId}: + ${k} line`} title={`Words for players on ${k}`}
              onClick={() => onSet([...path, k], fallbackWords(entry))}>+ {k} line</button>
          ))}
          {typeof entry === 'string' && (
            <button type="button" className="devkit-btn lessons-mini" aria-label={`${stepId}: one line per control type`}
              onClick={() => onSet(path, Object.fromEntries(CONTROL_KINDS.map((k) => [k, entry])))}>Split: keys · mouse · phone</button>
          )}
        </div>
      </div>
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
