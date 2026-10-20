// F86 review fixes — each test here failed before its fix.
import { describe, expect, it } from 'vitest'
import { backupKey, createSave } from './saves'
import { memoryStorage } from './storage'

const quiet = () => {}
type Stats = { gamesPlayed: number }
const record = (data: unknown, more: object = {}) => JSON.stringify({ save: 'test:stats', version: 1, savedAt: '2026-10-01T00:00:00Z', data, ...more })
const stats = (storage = memoryStorage()) => createSave<Stats>({
  key: 'test:stats', kind: 'progress', version: 1, fresh: { gamesPlayed: 0 }, storage, onProblem: quiet, fields: { gamesPlayed: 'add-up' },
})

describe('review fixes — saves core', () => {
  it('1. full storage never deletes the newest GOOD copy to make room (here: the only good one is backup 1), and says so truly', () => {
    const storage = memoryStorage({
      'test:stats': '{broken',
      [backupKey('test:stats', 1)]: record({ gamesPlayed: 7 }),
      [backupKey('test:stats', 2)]: record({ gamesPlayed: 6 }),
    })
    const save = stats(storage)
    expect(save.load().gamesPlayed).toBe(7)
    storage.full = true
    const result = save.save({ gamesPlayed: 8 })
    expect(result).toMatchObject({ ok: false, reason: 'full' })
    expect(storage.data[backupKey('test:stats', 1)]).toBe(record({ gamesPlayed: 7 }))
    expect(save.load().gamesPlayed).toBe(7)
    expect(!result.ok && result.message).toContain('your last good save is still there')
  })

  it('1. …with no good copy at all, the full-storage message doesn\'t promise one', () => {
    const storage = memoryStorage()
    storage.full = true
    const result = stats(storage).save({ gamesPlayed: 1 })
    expect(!result.ok && result.message).not.toContain('still there')
  })

  it('2. add-up counts after a backup load: other devices\' parts come from the copy that was loaded, not lost', () => {
    const storage = memoryStorage({
      'test:stats~device': 'me',
      'test:stats': '{broken',
      [backupKey('test:stats', 1)]: record({ gamesPlayed: 7 }, { counts: { gamesPlayed: { other: 5, me: 2 } } }),
    })
    const save = stats(storage)
    save.save({ gamesPlayed: save.load().gamesPlayed + 1 })
    expect(JSON.parse(storage.data['test:stats']).counts.gamesPlayed).toEqual({ other: 5, me: 3 })
  })

  it('3. a newer build\'s save sitting in a BACKUP is never rotated out by this older build', () => {
    const newer = record({ gamesPlayed: 99 }, { version: 4 })
    const storage = memoryStorage({ 'test:stats': '{broken', [backupKey('test:stats', 1)]: newer })
    const save = stats(storage)
    for (let i = 0; i < 4; i++) expect(save.save({ gamesPlayed: i })).toMatchObject({ ok: false, reason: 'newer' })
    expect(Object.values(storage.data)).toContain(newer)
  })

  it('5. exportRecord of a newer build\'s save found in a backup gives that copy (not the broken newest text)', () => {
    const storage = memoryStorage({ 'test:stats': '{broken', [backupKey('test:stats', 1)]: record({ gamesPlayed: 99 }, { version: 4 }) })
    expect(stats(storage).exportRecord()).toMatchObject({ version: 4, data: { gamesPlayed: 99 } })
  })

  it('6. per-device parts that aren\'t numbers ≥ 0 are dropped when a record is read (a code with "3" can\'t concatenate)', () => {
    const save = stats()
    const checked = save.checkRecord({ save: 'test:stats', version: 1, savedAt: '', data: { gamesPlayed: 5 }, counts: { gamesPlayed: { a: '3', b: 2, c: -1, d: null }, junk: 'x' } })
    expect(checked.ok && checked.record.counts).toEqual({ gamesPlayed: { b: 2 } })
  })

  it('minor: a write that doesn\'t read back, with no earlier copy, leaves nothing behind', () => {
    const storage = memoryStorage()
    const setItem = storage.setItem
    storage.setItem = (k, v) => setItem(k, k === 'test:stats' ? v.slice(0, 10) : v)
    expect(stats(storage).save({ gamesPlayed: 1 })).toMatchObject({ ok: false, reason: 'not-kept' })
    expect(storage.data['test:stats']).toBeUndefined()
  })
})
