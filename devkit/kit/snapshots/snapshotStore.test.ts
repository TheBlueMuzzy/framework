// Runs in the framework (not copied into games): the snapshot list kept in this browser.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addSnapshot, cleanName, deleteSnapshot, isSnapshot, loadSnapshots, snapshotFilePath, snapshotForClaude, snapshotMatches, type Snapshot,
} from './snapshotStore'

const snap = (name: string, state: unknown = { turn: 1 }): Snapshot => ({
  name, savedAt: '2026-09-30T21:15:00.000Z', game: 'Test', version: '0.1.0', summary: 'turn 1', state,
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('snapshot store', () => {
  it('keeps snapshots per game, newest first; the same name replaces the old one', () => {
    addSnapshot('Test', snap('first'))
    addSnapshot('Test', snap('second'))
    addSnapshot('Other game', snap('elsewhere'))
    expect(loadSnapshots('Test').map((s) => s.name)).toEqual(['second', 'first'])
    const { list, error } = addSnapshot('Test', snap('first', { turn: 9 }))
    expect(error).toBeNull()
    expect(list.map((s) => s.name)).toEqual(['first', 'second'])
    expect(loadSnapshots('Test')[0].state).toEqual({ turn: 9 })
    expect(loadSnapshots('Other game')).toHaveLength(1)
  })

  it('deletes by name', () => {
    addSnapshot('Test', snap('a'))
    addSnapshot('Test', snap('b'))
    expect(deleteSnapshot('Test', 'a').map((s) => s.name)).toEqual(['b'])
    expect(loadSnapshots('Test').map((s) => s.name)).toEqual(['b'])
  })

  it('damaged or blocked storage → an empty list, never a crash', () => {
    localStorage.setItem('devkit.snapshots.Test', '{not json')
    expect(loadSnapshots('Test')).toEqual([])
    localStorage.setItem('devkit.snapshots.Test', JSON.stringify([snap('ok'), { junk: true }, 7]))
    expect(loadSnapshots('Test').map((s) => s.name)).toEqual(['ok'])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(loadSnapshots('Test')).toEqual([])
  })

  it('a full storage gives a plain reason instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })
    const { error } = addSnapshot('Test', snap('big'))
    expect(error).toMatch(/storage full or blocked/)
  })
})

describe('snapshot helpers', () => {
  it('cleanName trims, keeps one line, and numbers an empty name', () => {
    expect(cleanName('  one  move\nfrom tangled ', 1)).toBe('one move from tangled')
    expect(cleanName('   ', 3)).toBe('Snapshot 3')
    expect(cleanName('x'.repeat(100), 1)).toHaveLength(60)
  })

  it('snapshotFilePath makes a safe file name inside content/snapshots/', () => {
    expect(snapshotFilePath('One move from tangled!')).toBe('content/snapshots/one-move-from-tangled.json')
    expect(snapshotFilePath('../../etc/passwd')).toBe('content/snapshots/etc-passwd.json')
    expect(snapshotFilePath('???')).toBe('content/snapshots/snapshot.json')
  })

  it('isSnapshot accepts snapshot files (extra keys like _help are fine) and nothing else', () => {
    expect(isSnapshot({ _help: 'x', ...snap('a') })).toBe(true)
    expect(isSnapshot({ name: 'a' })).toBe(false)
    expect(isSnapshot(null)).toBe(false)
  })

  it('Copy for Claude names the game, the file it belongs in, and has the JSON', () => {
    const text = snapshotForClaude(snap('Near the end'))
    expect(text).toMatch(/^Dev Kit snapshot from Test 0\.1\.0 — "Near the end" \(turn 1\)/)
    expect(text).toContain('content/snapshots/near-the-end.json')
    expect(JSON.parse(text.slice(text.indexOf('{'))).state).toEqual({ turn: 1 })
  })
})

describe('snapshotMatches — the Snapshots tab search', () => {
  it('finds a snapshot by its name, its summary or its version', () => {
    const s = { ...snap('one move from tangled'), summary: 'turn 12 · Blue to move', version: '0.1.0.12' }
    expect(snapshotMatches(s, 'tangled')).toBe(true)
    expect(snapshotMatches(s, 'blue turn')).toBe(true)
    expect(snapshotMatches(s, '0.1.0.12')).toBe(true)
    expect(snapshotMatches(s, 'red')).toBe(false)
    expect(snapshotMatches(s, '')).toBe(true)
  })
})
