// Runs in the framework (not copied into games): the rolling bug-capture log, the recorder, and the report.
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DevKitGame } from '../devkitGame'
import { STATE_EVERY_MS, clearLog, logEvent, logMark, logState, newCaptureLog, recentLog } from './captureLog'
import { buildBugCapture, captureFilePath, captureForClaude, type Device } from './captureReport'
import { copyOfState, startRecording } from './captureRecorder'

afterEach(() => vi.useRealTimers())

describe('capture log — a rolling window', () => {
  it('drops events and states older than the window as new ones come in', () => {
    const log = newCaptureLog(60_000)
    logEvent(log, 'old', undefined, 0)
    logState(log, { turn: 1 }, 0)
    logEvent(log, 'middle', { turn: 2 }, 30_000)
    logEvent(log, 'new', undefined, 70_000)
    logState(log, { turn: 3 }, 70_000)
    expect(log.events.map((e) => e.text)).toEqual(['middle', 'new'])
    expect(log.events[0].data).toEqual({ turn: 2 })
    expect('data' in log.events[1]).toBe(false)
    expect(log.states.map((s) => s.state)).toEqual([{ turn: 3 }])
  })

  it('recentLog also drops old things after a quiet spell, but keeps every mark', () => {
    const log = newCaptureLog(60_000)
    logEvent(log, 'a', undefined, 1_000)
    logMark(log, { turn: 1 }, 'turn 1', 1_000)
    const recent = recentLog(log, 100_000)
    expect(recent.events).toEqual([])
    expect(recent.marks).toHaveLength(1)
    expect(recent.marks[0].summary).toBe('turn 1')
  })

  it('stays small however much a game sends (at most 500 events, 20 marks)', () => {
    const log = newCaptureLog(60_000)
    for (let i = 0; i < 2000; i++) logEvent(log, `e${i}`, undefined, 1_000 + i)
    for (let i = 0; i < 30; i++) logMark(log, null, `m${i}`, 1_000 + i)
    expect(log.events).toHaveLength(500)
    expect(log.events.at(-1)?.text).toBe('e1999')
    expect(log.marks).toHaveLength(20)
    expect(log.marks[0].summary).toBe('m10')
  })

  it('clearLog empties it', () => {
    const log = newCaptureLog()
    logEvent(log, 'a', undefined, 1)
    logMark(log, null, '', 1)
    clearLog(log)
    expect(recentLog(log, 2)).toEqual({ keepMs: log.keepMs, events: [], states: [], marks: [] })
  })
})

describe('recorder', () => {
  it('logs the state at once and every few seconds, logs game events, and stops cleanly', () => {
    vi.useFakeTimers()
    let turn = 1
    let sendToLog: ((text: string, data?: unknown) => void) | null = null
    const game: DevKitGame = {
      name: 'Test',
      version: '1',
      canRestore: () => true,
      setState: () => {},
      getState: () => ({ turn }),
      onEvent: (send) => {
        sendToLog = send
        return () => { sendToLog = null }
      },
    }
    const log = newCaptureLog()
    let clock = 0
    const stop = startRecording(game, log, () => clock)
    expect(log.states).toHaveLength(1)
    sendToLog!('Blue moved', { turn: 1 })
    turn = 2
    clock = STATE_EVERY_MS
    vi.advanceTimersByTime(STATE_EVERY_MS)
    expect(log.events.map((e) => e.text)).toEqual(['Blue moved'])
    expect(log.states.map((s) => s.state)).toEqual([{ turn: 1 }, { turn: 2 }])
    stop()
    expect(sendToLog).toBeNull() // the game's listener was removed
    vi.advanceTimersByTime(STATE_EVERY_MS * 3)
    expect(log.states).toHaveLength(2)
  })

  it('copyOfState is a copy, and a broken getState is logged instead of crashing', () => {
    const state = { list: [1] }
    const game: DevKitGame = { name: 'T', version: '1', canRestore: () => true, setState: () => {}, getState: () => state }
    const copy = copyOfState(game) as typeof state
    state.list.push(2)
    expect(copy.list).toEqual([1])
    const broken: DevKitGame = { ...game, getState: () => { throw new Error('nope') } }
    expect(copyOfState(broken)).toEqual({ error: 'getState failed: nope' })
  })
})

const device: Device = { userAgent: 'test', screen: '390×844', window: '390×664', pixelRatio: 3, orientation: 'portrait', touch: true }

describe('bug capture report', () => {
  it('has what /bug needs: note, version, device, marks with their state, state now, events — times as seconds before Send', () => {
    const log = newCaptureLog()
    logEvent(log, 'turn 3 · Blue moved', undefined, 50_000)
    logState(log, { turn: 3 }, 50_000)
    logMark(log, { turn: 3 }, 'turn 3', 58_000)
    const capture = buildBugCapture({
      game: { name: 'Test', version: '0.1.0.4' },
      whatWentWrong: '  cast did nothing ',
      log,
      stateNow: { turn: 4 },
      summaryNow: 'turn 4',
      device,
      now: 60_000,
    })
    expect(capture.game).toBe('Test')
    expect(capture.version).toBe('0.1.0.4')
    expect(capture.whatWentWrong).toBe('cast did nothing')
    expect(capture.device).toEqual(device)
    expect(capture.marks).toEqual([{ secondsAgo: 2, summary: 'turn 3', state: { turn: 3 } }])
    expect(capture.stateNow).toEqual({ summary: 'turn 4', state: { turn: 4 } })
    expect(capture.events).toEqual([{ secondsAgo: 10, text: 'turn 3 · Blue moved' }])
    expect(capture.states).toEqual([{ secondsAgo: 10, state: { turn: 3 } }])
    expect(capture._help).toMatch(/bug/)
  })

  it('says so when there was no description', () => {
    const capture = buildBugCapture({ game: { name: 'T', version: '1' }, whatWentWrong: ' ', log: newCaptureLog(), stateNow: null, summaryNow: '', device, now: 0 })
    expect(capture.whatWentWrong).toMatch(/no description/)
  })

  it('is saved as .planning/bugs/capture-<date>-<time>.json (local time)', () => {
    expect(captureFilePath(new Date(2026, 8, 30, 23, 5, 7))).toBe('.planning/bugs/capture-2026-09-30-23-05-07.json')
  })

  it('Copy for Claude starts with /bug, says where the file is, and leaves out the every-5-seconds states', () => {
    const log = newCaptureLog()
    logState(log, { big: true }, 0)
    const capture = buildBugCapture({ game: { name: 'T', version: '1' }, whatWentWrong: 'stuck', log, stateNow: { turn: 1 }, summaryNow: '', device, now: 1000 })
    const saved = captureForClaude(capture, '.planning/bugs/capture-x.json')
    expect(saved.split('\n')[0]).toBe('/bug — Dev Kit bug capture from T 1: stuck')
    expect(saved).toContain('Saved to .planning/bugs/capture-x.json (with 1 extra state snapshots')
    const json = JSON.parse(saved.slice(saved.indexOf('{')))
    expect(json.states).toBeUndefined()
    expect(json.stateNow.state).toEqual({ turn: 1 })
    expect(captureForClaude(capture, null)).toContain('Not saved as a file')
  })
})
