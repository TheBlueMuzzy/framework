// The Lessons tab's Save: only the tab's own changes reach the file; everything else comes back byte-for-byte.
// Fixture: Goops' real content/lessons/first-day.json (a 12 KB lesson with notes, set-ups, hints, interrupts — keys the
// tab never shows), copied as first-day.test.json.
import { describe, expect, it } from 'vitest'
import { formatJson } from '../../vite/formatJson'
import TEXT from './first-day.test.json?raw'
import {
  applyLessonChanges, describeAdvance, describeChanges, isLesson, lessonChanges, lessonFileName, setStepField, stepField, wordsFor,
  type LessonData,
} from './lessonLogic'
const load = (text = TEXT) => JSON.parse(text) as LessonData
const edit = (lesson: LessonData, stepId: string, path: string[], value: unknown): LessonData => ({
  ...lesson,
  steps: lesson.steps.map((s) => (s.id === stepId ? setStepField(s, path, value) : s)),
})
// What the Save endpoint writes: the changes on the file as it is on disk, in the file's own layout
const save = (onDisk: string, saved: LessonData, edited: LessonData) =>
  formatJson(applyLessonChanges(JSON.parse(onDisk), lessonChanges(saved, edited)), onDisk)

describe('Save writes only the tab’s own changes', () => {
  it('no edit → the file comes back byte-for-byte', () => {
    expect(save(TEXT, load(), load())).toBe(TEXT)
  })

  it('a step’s words id and a hint time → exactly those two values change, every other byte is the same', () => {
    let edited = edit(load(), 'B1', ['message'], 'Watch it fall')
    edited = edit(edited, 'B2', ['hint', 'after'], 4.5)
    const out = save(TEXT, load(), edited)
    const expected = TEXT
      .replace('"message": "falls"', '"message": "Watch it fall"')
      .replace('"hint": { "after": 3, "message": "fastDropHint"', '"hint": { "after": 4.5, "message": "fastDropHint"')
    expect(expected).not.toBe(TEXT) // (both replacements found something)
    expect(out).toBe(expected)
  })

  it('a neighbour changed on disk meanwhile (a hand edit) is kept — the tab only writes its own keys', () => {
    // the tab loaded the file, then someone edited the _about note and another step's hint by hand
    const onDisk = TEXT.replace('F31 YOUR FIRST DAY', 'F31 YOUR FIRST DAY (edited by hand)').replace('"after": 6, "message": "pullHint"', '"after": 7, "message": "pullHint"')
    expect(onDisk).not.toBe(TEXT)
    const edited = edit(load(), 'B2', ['showAfter'], 1) // a new key on B2
    const out = save(onDisk, load(), edited)
    expect(out).toContain('(edited by hand)')
    expect(out).toContain('"after": 7, "message": "pullHint"') // the hand edit, not the tab's old copy (6)
    expect(JSON.parse(out).steps.find((s: { id: string }) => s.id === 'B2').showAfter).toBe(1)
    // and nothing else moved: take the one new line out → the file on disk exactly
    expect(out.replace(/,\n {6}"showAfter": 1\n/, '\n')).toBe(onDisk)
  })

  it('taking a key out removes just that key', () => {
    const edited = edit(load(), 'B3', ['showAfter'], undefined)
    const out = save(TEXT, load(), edited)
    expect(JSON.parse(out).steps.find((s: { id: string }) => s.id === 'B3').showAfter).toBeUndefined()
    expect(out).toBe(TEXT.replace(/\n {6}"showAfter": 1\.2,/, ''))
  })

  it('a changed step that is gone from the file by now → a plain reason, nothing written', () => {
    const edited = edit(load(), 'B2', ['showAfter'], 1)
    const onDisk = TEXT.replace('"id": "B2"', '"id": "B2-renamed"')
    expect(() => save(onDisk, load(), edited)).toThrow(/step "B2" is no longer in the file/)
  })
})

describe('lessonChanges', () => {
  it('lists each changed leaf by step id and path, with what it was', () => {
    const edited = edit(edit(load(), 'B2', ['hint', 'after'], 5), 'A1', ['button'], 'gotIt')
    expect(lessonChanges(load(), edited)).toEqual([
      { step: 'A1', path: ['button'], value: 'gotIt', was: undefined },
      { step: 'B2', path: ['hint', 'after'], value: 5, was: 3 },
    ])
    expect(describeChanges('first-day', lessonChanges(load(), edited))).toEqual([
      'first-day · step A1 · button: (not set) → "gotIt"',
      'first-day · step B2 · hint.after: 3 → 5',
    ])
  })
})

describe('small helpers', () => {
  it('isLesson: steps with ids', () => {
    expect(isLesson(load())).toBe(true)
    expect(isLesson({ steps: [{ message: 'x' }] })).toBe(false)
    expect(isLesson({ id: 'x' })).toBe(false)
  })
  it('stepField / setStepField go into nested keys', () => {
    const step = { id: 's', hint: { after: 3 } }
    expect(stepField(step, ['hint', 'after'])).toBe(3)
    expect(setStepField(step, ['hint', 'after'], 4)).toEqual({ id: 's', hint: { after: 4 } })
    expect(setStepField(step, ['hint', 'after'], undefined)).toEqual({ id: 's', hint: {} })
    expect(step.hint.after).toBe(3) // never changes the one it was given
  })
  it('describeAdvance says what moves a step on', () => {
    expect(describeAdvance(undefined)).toBe('closing its words (the button)')
    expect(describeAdvance({ on: 'event', event: 'placed', where: { by: 'you' } })).toBe('the game says "placed" (by: you)')
    expect(describeAdvance({ on: 'any', of: [{ on: 'action', action: 'rotate', count: 2 }, { on: 'time', after: 8 }] }))
      .toBe('the first of: the player uses "rotate" ×2 · 8 s pass')
  })
  it('wordsFor reads en.json "lessons" → lesson → id, then "shared", and a per-control line’s mouse words', () => {
    const text = { lessons: { 'first-game': { board: 'This is your board.', tap: { keys: 'Press', mouse: 'Click', phone: 'Tap' } }, shared: { gotIt: 'Got it' } } }
    expect(wordsFor(text, 'first-game', 'board')).toBe('This is your board.')
    expect(wordsFor(text, 'first-game', 'tap')).toBe('Click')
    expect(wordsFor(text, 'first-game', 'gotIt')).toBe('Got it')
    expect(wordsFor(text, 'first-game', 'Plain words')).toBeNull()
  })
  it('lessonFileName', () => {
    expect(lessonFileName('../../../content/lessons/first-game.json')).toBe('first-game')
  })
})
