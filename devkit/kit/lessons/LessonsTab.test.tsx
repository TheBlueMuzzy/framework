// Runs in the framework (not copied into games): the Lessons tab (0.29.0, F200) — steps and their fields, live edits,
// ▶ through the adapter's runner, Save = only the tab's own keys on top of the file as it is on disk.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allTabs, type DevKitTab } from '../DevKit'
import { registerDevKitGame, type DevKitGame, type DevKitLessonRunner } from '../devkitGame'
import { TUNING_EVENT } from '../tuning/liveTuning'
import { LessonsTab } from './LessonsTab'
import { resetLessonStore } from './lessonStore'
import type { LessonData } from './lessonLogic'

const LESSON: LessonData = {
  id: 'first-game',
  start: { youGoFirst: true },
  steps: [
    { id: 'board', message: 'board', pointer: '[data-board]', dim: true, advance: { on: 'event', event: 'placed', where: { by: 'you' } } },
    { id: 'threeInARow', message: 'threeInARow', pointer: '[data-board]', dim: true, while: 'pause', button: 'gotIt' },
  ],
}
const TEXT = { lessons: { 'first-game': { board: 'This is your board.', threeInARow: 'Three in a row wins.' } } }
const FILES = [{ file: 'first-game', data: LESSON }]

const field = (step: string, label: string) => screen.getByLabelText(`${step}: ${label}`) as HTMLInputElement
const button = (name: string | RegExp) => screen.getByRole('button', { name }) as HTMLButtonElement
const titles = () => [...document.querySelectorAll('.dk-section-title')].map((t) => t.textContent)

function fakeServer(onDisk: object) {
  const saves: { path: string; data: LessonData }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/__devkit/save') { saves.push(JSON.parse(String(init!.body))); return new Response('{"ok":true}', { status: 200 }) }
    return new Response(JSON.stringify(onDisk), { status: 200 })
  }))
  return saves
}

function fakeRunner() {
  let view = { lessonId: null as string | null, stepIndex: -1 }
  const listeners = new Set<() => void>()
  const runner: DevKitLessonRunner & { started: { lesson: unknown; at: number }[] } = {
    started: [],
    view: () => view,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    start: (get, at = 0) => {
      runner.started.push({ lesson: get(), at })
      view = { lessonId: 'first-game', stepIndex: at }
      for (const l of listeners) l()
    },
    stop: () => { view = { lessonId: null, stepIndex: -1 }; for (const l of listeners) l() },
  }
  return runner
}
const plug = (lessons?: DevKitGame['lessons']) =>
  registerDevKitGame({ name: 'Test', version: 'v0.1.0.1', getState: () => ({}), setState: () => {}, canRestore: () => true, lessons })

beforeEach(() => resetLessonStore())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  registerDevKitGame(null)
  localStorage.clear()
})

describe('the Lessons tab', () => {
  it('lists the steps with their fields, and the words each words id stands for', () => {
    render(<LessonsTab files={FILES} text={TEXT} />)
    expect(titles()).toEqual(['1 · board', '2 · threeInARow'])
    expect(field('board', 'Words (text id, or the words)').value).toBe('board')
    expect(screen.getByText('“This is your board.”')).toBeTruthy()
    expect(field('threeInARow', 'Button').value).toBe('gotIt')
    expect((screen.getByLabelText('threeInARow: While its words show') as HTMLSelectElement).value).toBe('pause')
    expect(field('board', 'Dim everything else').checked).toBe(true)
    expect(screen.getByText('the game says "placed" (by: you)')).toBeTruthy()
  })

  it('an edit goes to the game at once, as a live edit of "lessons/<file>"', () => {
    const heard: { file: string; data: LessonData }[] = []
    const listen = (e: Event) => heard.push((e as CustomEvent).detail)
    window.addEventListener(TUNING_EVENT, listen)
    try {
      render(<LessonsTab files={FILES} text={TEXT} />)
      fireEvent.change(field('threeInARow', 'Words (text id, or the words)'), { target: { value: 'Line them up!' } })
    } finally {
      window.removeEventListener(TUNING_EVENT, listen)
    }
    expect(heard.at(-1)!.file).toBe('lessons/first-game')
    expect(heard.at(-1)!.data.steps[1].message).toBe('Line them up!')
    expect(heard.at(-1)!.data.steps[0]).toEqual(LESSON.steps[0])
    expect(screen.getByText('Not in en.json "lessons" — the game shows it as written.')).toBeTruthy()
    expect(screen.getByText('1 unsaved change.')).toBeTruthy()
  })

  it('Save puts only the changed key on the file as it is on disk — a hand edit made meanwhile is kept', async () => {
    const onDisk = structuredClone(LESSON) as LessonData & { _about?: string }
    onDisk._about = 'written by hand after the page loaded'
    onDisk.steps[0].pointer = '[data-board-hand-edited]'
    const saves = fakeServer(onDisk)
    render(<LessonsTab files={FILES} text={TEXT} />)
    fireEvent.change(field('board', 'Words show after (s)'), { target: { value: '0.5' } })
    await act(async () => { fireEvent.click(button('Save')) })
    expect(saves).toHaveLength(1)
    expect(saves[0].path).toBe('content/lessons/first-game.json')
    const expected = structuredClone(onDisk)
    expected.steps[0].showAfter = 0.5
    expect(saves[0].data).toEqual(expected)
    expect(screen.getByText(/Saved content\/lessons\/first-game.json — 1 change/)).toBeTruthy()
  })

  it('▶ plays from a step through the adapter’s runner (with the tab’s edits); the step playing is marked', () => {
    const runner = fakeRunner()
    plug({ runner })
    render(<LessonsTab files={FILES} text={TEXT} />)
    fireEvent.change(field('threeInARow', 'Button'), { target: { value: 'play' } })
    fireEvent.click(button('Play from step 2 (threeInARow)'))
    expect(runner.started).toHaveLength(1)
    expect(runner.started[0].at).toBe(1)
    expect((runner.started[0].lesson as LessonData).steps[1].button).toBe('play')
    expect(document.querySelector('[data-step="threeInARow"][data-now]')).toBeTruthy()
    expect(titles()).toContain('2 · threeInARow · now')
    fireEvent.click(button('■ Stop'))
    expect(document.querySelector('[data-now]')).toBeNull()
  })

  it('the game’s own start wins when it gives one (a fresh match first); false = said plainly', () => {
    const runner = fakeRunner()
    const start = vi.fn(() => false)
    plug({ runner, start })
    render(<LessonsTab files={FILES} text={TEXT} />)
    fireEvent.click(button('▶ From the start'))
    expect(start).toHaveBeenCalledWith('first-game', 0)
    expect(runner.started).toHaveLength(0)
    expect(screen.getByText('The game can’t start a lesson right now.')).toBeTruthy()
  })

  it('without a runner in the adapter: ▶ is off and the tab says the one line to add; editing still works', () => {
    render(<LessonsTab files={FILES} text={TEXT} />)
    expect(button('▶ From the start').disabled).toBe(true)
    expect(screen.getByText(/add/).textContent).toContain('lessons: { runner }')
  })

  it('the whole step as JSON: Apply changes any field; its id must stay', () => {
    render(<LessonsTab files={FILES} text={TEXT} />)
    const box = screen.getByLabelText('board: the whole step as JSON') as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: JSON.stringify({ ...LESSON.steps[0], id: 'other' }) } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Apply' })[0])
    expect(screen.getByText(/keep its id "board"/)).toBeTruthy()
    fireEvent.change(box, { target: { value: JSON.stringify({ ...LESSON.steps[0], advance: { on: 'time', after: 3 } }) } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Apply' })[0])
    expect(screen.getByText('3 s pass')).toBeTruthy()
    expect(field('board', 'Moves on after (s)').value).toBe('3')
  })

  it('search finds steps by their words', () => {
    render(<LessonsTab files={FILES} text={TEXT} query="three in a row" />)
    expect(titles()).toEqual(['2 · threeInARow'])
    expect(screen.getByText('1 step found')).toBeTruthy()
  })

  it('no lesson files → a plain line where they go', () => {
    render(<LessonsTab files={[]} text={TEXT} />)
    expect(screen.getByText(/No lessons yet/)).toBeTruthy()
  })
})

describe('a game tab with a kit tab’s id takes its place (Goops’ own Lessons tab)', () => {
  it('allTabs', () => {
    const tab = (id: string, label: string): DevKitTab => ({ id, label, Panel: () => null })
    expect(allTabs([tab('tuning', 'Tuning'), tab('lessons', 'Lessons')], [tab('lessons', 'Goops lessons')]).map((t) => t.label))
      .toEqual(['Tuning', 'Goops lessons'])
  })
})
