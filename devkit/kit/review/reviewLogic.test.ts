// Runs in the framework (not copied into games): the Review list tab's thinking.
import { describe, expect, it } from 'vitest'
import { applyChanges, countsLine, listChanges, nextStatus, reviewForClaude, searchReview, sortReview, toggleMark } from './reviewLogic'
import type { ReviewItem } from './reviewTypes'

const item = (label: string, status: ReviewItem['status'], detail?: string): ReviewItem => ({ id: label, label, status, detail })

describe('nextStatus — one click', () => {
  it('goes Open → Yes → No → Open', () => {
    expect(nextStatus('open')).toBe('yes')
    expect(nextStatus('yes')).toBe('no')
    expect(nextStatus('no')).toBe('open')
  })
})

describe('sortReview', () => {
  it('puts Open first, then Yes, then No — A–Z inside each, ignoring case', () => {
    const list = [item('wry', 'no'), item('ZYGOTES', 'open'), item('apple', 'yes'), item('Thy', 'open'), item('bee', 'no'), item('cat', 'yes')]
    expect(sortReview(list).map((i) => i.label)).toEqual(['Thy', 'ZYGOTES', 'apple', 'cat', 'bee', 'wry'])
  })
  it('leaves the list it was given alone', () => {
    const list = [item('b', 'open'), item('a', 'open')]
    sortReview(list)
    expect(list.map((i) => i.label)).toEqual(['b', 'a'])
  })
})

describe('marks (unsaved changes)', () => {
  const zyg = item('ZYGOTES', 'open')
  it('a click adds a mark; three clicks land back on the saved status and the mark goes away', () => {
    let marks = toggleMark(zyg, {})
    expect(marks).toEqual({ ZYGOTES: 'yes' })
    marks = toggleMark(zyg, marks)
    expect(marks).toEqual({ ZYGOTES: 'no' })
    marks = toggleMark(zyg, marks)
    expect(marks).toEqual({})
  })
  it('listChanges sends only the changed rows', () => {
    const list = [zyg, item('wry', 'no'), item('thy', 'open')]
    expect(listChanges(list, { thy: 'yes' })).toEqual([{ id: 'thy', status: 'yes' }])
    expect(listChanges(list, {})).toEqual([])
  })
  it('applyChanges makes the marks saved and sorts again', () => {
    const list = [item('a', 'open'), item('b', 'open'), item('c', 'yes')]
    expect(applyChanges(list, { a: 'no', b: 'yes' }).map((i) => `${i.label}:${i.status}`)).toEqual(['b:yes', 'c:yes', 'a:no'])
  })
})

describe('countsLine', () => {
  const list = [item('a', 'open'), item('b', 'open'), item('c', 'yes'), item('d', 'no')]
  it('counts what is shown', () => {
    expect(countsLine(list, {})).toBe('2 open · 1 yes · 1 no')
  })
  it('counts unsaved marks as shown, and says how many are unsaved', () => {
    expect(countsLine(list, { a: 'yes', d: 'open' })).toBe('2 open · 2 yes · 0 no — 2 unsaved')
  })
})

describe('searchReview', () => {
  const list = [item('ROOSTER', 'open', 'swear or word · cock'), item('zygotes', 'yes'), item('wry', 'no', 'lost word')]
  it('finds text in the label or the detail, ignoring case', () => {
    expect(searchReview(list, 'zyg').map((i) => i.label)).toEqual(['zygotes'])
    expect(searchReview(list, 'COCK').map((i) => i.label)).toEqual(['ROOSTER'])
    expect(searchReview(list, 'word').map((i) => i.label)).toEqual(['ROOSTER', 'wry'])
  })
  it('an empty search keeps everything', () => {
    expect(searchReview(list, '  ')).toHaveLength(3)
  })
})

describe('reviewForClaude', () => {
  it('lists the unsaved changes in plain words', () => {
    const text = reviewForClaude('Glyphtender', 'Words', [item('wry', 'no')], { wry: 'yes' }, true)
    expect(text).toContain('Words review changes from the Dev Kit (Glyphtender) — marked in the live build, NOT saved')
    expect(text).toContain('- wry: No → Yes')
  })
  it('says so when nothing changed', () => {
    expect(reviewForClaude('G', 'Words', [item('wry', 'no')], {}, false)).toBe('No unsaved Words review changes in the Dev Kit (G).')
  })
})

describe('extra marks (B = British, V = vulgar)', () => {
  const extras = [{ id: 'british', letter: 'B', name: 'British' }, { id: 'vulgar', letter: 'V', name: 'Vulgar' }]
  it('sort after No, in the order the game gives', () => {
    const list = [item('a', 'vulgar'), item('b', 'british'), item('c', 'no'), item('d', 'open')]
    expect(sortReview(list, extras).map((i) => i.label)).toEqual(['d', 'c', 'b', 'a'])
  })
  it('the one box cycles on to them: Open → Yes → No → British → Vulgar → Open', () => {
    expect(['open', 'yes', 'no', 'british', 'vulgar'].map((s) => nextStatus(s, extras))).toEqual(['yes', 'no', 'british', 'vulgar', 'open'])
    const w = item('maths', 'open')
    let marks = {}
    for (const s of ['yes', 'no', 'british', 'vulgar']) {
      marks = toggleMark(w, marks, extras)
      expect(marks).toEqual({ maths: s })
    }
    expect(toggleMark(w, marks, extras)).toEqual({}) // back to the saved Open
  })
  it('are counted and named', () => {
    expect(countsLine([item('a', 'british'), item('b', 'open')], { b: 'vulgar' }, extras)).toBe('0 open · 0 yes · 0 no · 1 british · 1 vulgar — 1 unsaved')
    expect(reviewForClaude('G', 'Words', [item('maths', 'open')], { maths: 'british' }, false, extras)).toContain('- maths: Open → British')
  })
})
