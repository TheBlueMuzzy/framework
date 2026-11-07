// Runs in the framework (not copied into games): a text file's edits (Dev Kit 0.30.0, F200 task 22) — the Text and
// Lessons tabs' Save puts only its edits on the file as it is on disk; formatJson then writes every other byte as it was.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatJson } from '../../vite/formatJson'
import { applyTextEdits, getAt, setAt, textEdits } from './textEdits'

// Goops' real en.json (copied read-only): a "lessons" block with plain lines, per-control-type lines and "shared",
// and lots of neighbours no tab here owns
const GOOPS_TEXT = readFileSync(join(__dirname, '..', 'lessons', 'goops-en.test.json'), 'utf8')
const GOOPS = JSON.parse(GOOPS_TEXT) as Record<string, unknown>
const changedLines = (a: string, b: string) => {
  const x = a.split('\n'), y = b.split('\n')
  return x.length === y.length ? x.filter((line, i) => line !== y[i]).length : -1
}

describe('text edits', () => {
  it('setAt makes the objects on the way, takes a key out with undefined, and refuses a blocked way', () => {
    const data = { a: { b: 'x' }, list: ['p', 'q'] }
    expect(setAt(data, ['a', 'c', 'd'], 'y')).toEqual({ a: { b: 'x', c: { d: 'y' } }, list: ['p', 'q'] })
    expect(setAt(data, ['a', 'b'], undefined)).toEqual({ a: {}, list: ['p', 'q'] })
    expect(setAt(data, ['list', 1], 'r')).toEqual({ a: { b: 'x' }, list: ['p', 'r'] })
    expect(setAt(data, ['a', 'b', 'mouse'], 'z')).toBeNull() // "b" is a line, not an object
    expect(data).toEqual({ a: { b: 'x' }, list: ['p', 'q'] }) // never changed in place
    expect(getAt(data, ['list', 0])).toBe('p')
  })

  it('textEdits: a word line is one edit; a line that changed shape is one edit with its new value', () => {
    const saved = { lessons: { l: { a: 'Hi', b: { mouse: 'Click', phone: 'Tap' } } }, pages: [{ body: 'x' }] }
    const edited = { lessons: { l: { a: { keys: 'Press', mouse: 'Hi', phone: 'Hi' }, b: { mouse: 'Click!', phone: 'Tap' }, c: 'New' } }, pages: [{ body: 'y' }] }
    expect(textEdits(saved, edited)).toEqual([
      { path: ['lessons', 'l', 'a'], value: { keys: 'Press', mouse: 'Hi', phone: 'Hi' }, was: 'Hi' },
      { path: ['lessons', 'l', 'b', 'mouse'], value: 'Click!', was: 'Click' },
      { path: ['lessons', 'l', 'c'], value: 'New', was: undefined },
      { path: ['pages', 0, 'body'], value: 'y', was: 'x' },
    ])
  })

  it('applyTextEdits goes on the file as it is now — a neighbour’s hand edit stays; words taken out by hand are lost, not brought back', () => {
    const saved = { menu: { play: 'Play', quit: 'Quit' } }
    const edited = { menu: { play: 'Start', quit: 'Leave' } }
    const fresh = { menu: { play: 'Play', title: 'Hand edit' } } // quit taken out by hand, title added
    const { data, lost } = applyTextEdits(fresh, textEdits(saved, edited))
    expect(data).toEqual({ menu: { play: 'Start', title: 'Hand edit' } })
    expect(lost.map((e) => e.path.join('.'))).toEqual(['menu.quit'])
  })

  it('on a real en.json (Goops’): one lesson line changed → the written file differs in that one line only', () => {
    const edits = textEdits(GOOPS, setAt(GOOPS, ['lessons', 'first-day', 'pull', 'mouse'], 'Drag it down!'))
    expect(edits).toHaveLength(1)
    const out = formatJson(applyTextEdits(GOOPS, edits).data, GOOPS_TEXT)
    expect(changedLines(GOOPS_TEXT, out)).toBe(1)
    expect(out).toContain('"mouse": "Drag it down!"')
  })

  it('on a real en.json: a new line for a lesson goes at the end of that lesson’s block, every other line as it was', () => {
    const edits = textEdits(GOOPS, setAt(GOOPS, ['lessons', 'controls', 'cool'], 'Let it cool.'))
    const out = formatJson(applyTextEdits(GOOPS, edits).data, GOOPS_TEXT)
    const before = GOOPS_TEXT.split('\n'), after = out.split('\n')
    expect(after.length).toBe(before.length + 1)
    // take the new line out (and the comma it added to the line above): the old file, byte for byte
    const at = after.findIndex((l) => l.includes('"cool": "Let it cool."'))
    const back = [...after.slice(0, at), ...after.slice(at + 1)]
    back[at - 1] = back[at - 1].replace(/,$/, '')
    expect(back.join('\n')).toBe(GOOPS_TEXT)
  })
})
