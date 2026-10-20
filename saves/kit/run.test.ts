import { describe, expect, it } from 'vitest'
import { continueLine, createRun, RUN_WORDS, timeAgo, type RunOptions } from './run'
import { memoryStorage } from './storage'

const quiet = () => {}
type Match = { turn: number; scores: number[] }
const fresh: Match = { turn: 0, scores: [0, 0] }

/** A pretend page: hide / close events the test fires itself. */
function fakePage() {
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const window = new EventTarget()
  return {
    document, window,
    hide() { document.visibilityState = 'hidden'; document.dispatchEvent(new Event('visibilitychange')) },
    show() { document.visibilityState = 'visible'; document.dispatchEvent(new Event('visibilitychange')) },
    close() { window.dispatchEvent(new Event('pagehide')) },
  }
}

function matchRun(storage = memoryStorage(), more: Partial<RunOptions<Match>> = {}) {
  return createRun<Match>({ key: 'test:run', version: 1, fresh, summary: (m) => `Turn ${m.turn}`, storage, onProblem: quiet, page: null, ...more })
}

const newerRun = JSON.stringify({ save: 'test:run', version: 9, savedAt: '2026-10-20T09:00:00.000Z', data: { turn: 40, board: 'hex' } })

describe('createRun — autosave, Continue, end', () => {
  it('nothing saved → no Continue', () => {
    expect(matchRun().pending()).toBeNull()
  })

  it('autosave at a break point → Continue with the summary and the time, then resume gives the same run', () => {
    const run = matchRun()
    run.autosave({ turn: 7, scores: [12, 9] })
    const pending = run.pending()
    expect(pending).toMatchObject({ summary: 'Turn 7', canContinue: true })
    expect(Date.parse(pending!.savedAt)).toBeGreaterThan(Date.now() - 5000)
    expect(run.resume()).toEqual({ ok: true, data: { turn: 7, scores: [12, 9] } })
  })

  it('a fresh page (the tab was closed) still finds it — it lives in storage, not in memory', () => {
    const storage = memoryStorage()
    matchRun(storage).autosave({ turn: 3, scores: [1, 2] })
    expect(matchRun(storage).pending()).toMatchObject({ summary: 'Turn 3', canContinue: true })
  })

  it('end() wipes every copy (backups too): the finished run never comes back', () => {
    const storage = memoryStorage()
    const run = matchRun(storage)
    run.autosave({ turn: 1, scores: [0, 0] })
    run.autosave({ turn: 2, scores: [3, 0] })
    run.autosave({ turn: 3, scores: [3, 5] }) // turns 1 + 2 are backups now
    run.end()
    expect(Object.keys(storage.data)).toEqual([])
    expect(matchRun(storage).pending()).toBeNull()
    expect(matchRun(storage).resume()).toMatchObject({ ok: false, reason: 'none' })
  })

  it('a summary that throws never hides Continue', () => {
    const run = matchRun(memoryStorage(), { summary: () => { throw new Error('oops') } })
    run.autosave({ turn: 2, scores: [0, 0] })
    expect(run.pending()).toMatchObject({ summary: '', canContinue: true })
  })
})

describe('createRun — the tab hides or closes', () => {
  it('hiding saves the game\'s snapshot (a phone player switching apps mid-turn loses nothing)', () => {
    const page = fakePage()
    const storage = memoryStorage()
    let now: Match = { turn: 4, scores: [1, 1] }
    const run = matchRun(storage, { page, snapshot: () => now })
    run.autosave(now)
    now = { turn: 4, scores: [6, 1] } // a word played, the turn not ended yet
    page.hide()
    expect(matchRun(storage).resume()).toEqual({ ok: true, data: { turn: 4, scores: [6, 1] } })
  })

  it('closing (pagehide) saves too; a snapshot of null (not a safe moment) saves nothing', () => {
    const page = fakePage()
    const storage = memoryStorage()
    let safe = true
    const run = matchRun(storage, { page, snapshot: () => (safe ? { turn: 5, scores: [2, 2] } : null) })
    run.autosave({ turn: 4, scores: [1, 1] })
    page.close()
    expect(matchRun(storage).resume()).toMatchObject({ data: { turn: 5 } })
    safe = false
    run.autosave({ turn: 6, scores: [3, 3] })
    page.close()
    expect(matchRun(storage).resume()).toMatchObject({ data: { turn: 6 } })
  })

  it('a break-point save the browser refused (full storage) is tried again when the tab hides', () => {
    const page = fakePage()
    const storage = memoryStorage()
    const run = matchRun(storage, { page })
    storage.full = true
    expect(run.autosave({ turn: 2, scores: [1, 0] })).toMatchObject({ ok: false, reason: 'full' })
    storage.full = false
    page.hide()
    expect(matchRun(storage).resume()).toMatchObject({ data: { turn: 2 } })
  })

  it('after end(), hiding or closing never writes the finished run back', () => {
    const page = fakePage()
    const storage = memoryStorage()
    const run = matchRun(storage, { page, snapshot: () => ({ turn: 9, scores: [20, 18] }) })
    run.autosave({ turn: 9, scores: [20, 18] })
    run.end()
    page.hide()
    page.close()
    expect(Object.keys(storage.data)).toEqual([])
  })

  it('a resumed run is saved on hide again', () => {
    const page = fakePage()
    const storage = memoryStorage()
    matchRun(storage).autosave({ turn: 3, scores: [0, 0] })
    const run = matchRun(storage, { page, snapshot: () => ({ turn: 3, scores: [4, 0] }) })
    expect(run.resume()).toMatchObject({ ok: true })
    page.hide()
    expect(matchRun(storage).resume()).toMatchObject({ data: { scores: [4, 0] } })
  })
})

describe('createRun — a run that can\'t be continued', () => {
  it('from a newer build: Continue shows, resume says so plainly, never throws, and wipes it', () => {
    const storage = memoryStorage({ 'test:run': newerRun })
    const run = matchRun(storage)
    expect(run.pending()).toEqual({ savedAt: '2026-10-20T09:00:00.000Z', summary: '', canContinue: false })
    expect(run.resume()).toEqual({ ok: false, reason: 'newer', message: RUN_WORDS.cantContinue })
    expect(Object.keys(storage.data)).toEqual([])
    expect(run.pending()).toBeNull()
  })

  it('...and once wiped, this build can save new runs again (a newer copy would block every write)', () => {
    const storage = memoryStorage({ 'test:run': newerRun })
    const run = matchRun(storage)
    expect(run.autosave({ turn: 1, scores: [0, 0] })).toMatchObject({ ok: false, reason: 'newer' })
    run.resume()
    expect(run.autosave({ turn: 1, scores: [0, 0] })).toEqual({ ok: true })
  })

  it('end() wipes a newer build\'s run too (New game while one is waiting)', () => {
    const storage = memoryStorage({ 'test:run': newerRun })
    matchRun(storage).end()
    expect(Object.keys(storage.data)).toEqual([])
  })

  it('damaged (every copy broken): same message, wiped, no crash', () => {
    const storage = memoryStorage({ 'test:run': '{"save":"test:run","vers', 'test:run~1': '[]' })
    const run = matchRun(storage)
    expect(run.pending()).toMatchObject({ canContinue: false })
    expect(run.resume()).toMatchObject({ ok: false, reason: 'damaged', message: RUN_WORDS.cantContinue })
    expect(Object.keys(storage.data)).toEqual([])
  })

  it('a damaged newest copy with a good backup → the backup continues (the core\'s safety net)', () => {
    const storage = memoryStorage()
    const run = matchRun(storage)
    run.autosave({ turn: 4, scores: [0, 0] })
    run.autosave({ turn: 5, scores: [0, 0] })
    storage.data['test:run'] = '{cut off'
    expect(matchRun(storage).resume()).toMatchObject({ ok: true, data: { turn: 4 } })
  })
})

describe('the line under Continue', () => {
  const now = Date.parse('2026-10-20T12:00:00.000Z')
  const at = (minutesBefore: number) => new Date(now - minutesBefore * 60_000).toISOString()

  it('"Turn 7 · 5 min ago"', () => {
    expect(continueLine({ savedAt: at(5), summary: 'Turn 7', canContinue: true }, now)).toBe('Turn 7 · 5 min ago')
  })

  it('just the time without a summary, just the summary without a time', () => {
    expect(continueLine({ savedAt: at(0), summary: '', canContinue: true }, now)).toBe('just now')
    expect(continueLine({ savedAt: '', summary: 'Wave 3', canContinue: true }, now)).toBe('Wave 3')
  })

  it('minutes, hours, yesterday, days — and the words can be replaced', () => {
    expect([at(59), at(61), at(60 * 5), at(60 * 30), at(60 * 24 * 4)].map((t) => timeAgo(t, now)))
      .toEqual(['59 min ago', '1 hour ago', '5 hours ago', 'yesterday', '4 days ago'])
    expect(timeAgo(at(5), now, { minutesAgo: 'hace {n} min' })).toBe('hace 5 min')
    expect(timeAgo('not a time', now)).toBe('')
  })
})
