import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SAVES_CONFIG, setSavesConfig } from './config'
import { backupKey, createSave, damagedKey, NOTES, type SaveOptions } from './saves'
import { memoryStorage } from './storage'

const quiet = () => {}
type Progress = { totalXp: number; unlocks: string[]; name: string }
const fresh: Progress = { totalXp: 0, unlocks: [], name: 'Player' }

function progressSave(storage = memoryStorage(), more: Partial<SaveOptions<Progress>> = {}) {
  return createSave<Progress>({ key: 'test:progress', kind: 'progress', version: 1, fresh, storage, onProblem: quiet, ...more })
}

afterEach(() => setSavesConfig(DEFAULT_SAVES_CONFIG))

describe('createSave — loading and saving', () => {
  it('nothing saved → a fresh copy (never the same object twice)', () => {
    const save = progressSave()
    const a = save.load()
    expect(a).toEqual(fresh)
    a.unlocks.push('hat')
    expect(save.load().unlocks).toEqual([])
    expect(save.report()).toMatchObject({ from: 'fresh', note: null })
  })

  it('round trip: what is saved is what loads, as one whole record with a version stamp', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    expect(save.save({ totalXp: 120, unlocks: ['hat'], name: 'Mo' })).toEqual({ ok: true })
    expect(save.load()).toEqual({ totalXp: 120, unlocks: ['hat'], name: 'Mo' })
    const record = JSON.parse(storage.data['test:progress'])
    expect(record).toMatchObject({ save: 'test:progress', version: 1, data: { totalXp: 120 } })
    expect(record.savedAt).toMatch(/^\d{4}-\d\d-\d\dT/)
    expect(save.report().from).toBe('save')
  })

  it('missing fields get today\'s defaults; the player\'s values are never overwritten — even when the default changed', () => {
    const storage = memoryStorage({ 'test:progress': JSON.stringify({ save: 'test:progress', version: 1, savedAt: '', data: { totalXp: 50, name: 'Mo' } }) })
    const save = progressSave(storage, { fresh: { totalXp: 0, unlocks: ['starter'], name: 'Player' } })
    expect(save.load()).toEqual({ totalXp: 50, unlocks: ['starter'], name: 'Mo' })
    expect(save.report().added).toEqual(['unlocks'])
  })

  it('a broken value (wrong type) gets the default, and is reported', () => {
    const storage = memoryStorage({ 'test:progress': JSON.stringify({ save: 'test:progress', version: 1, savedAt: '', data: { totalXp: 'lots', unlocks: ['hat'], name: 'Mo' } }) })
    const save = progressSave(storage)
    expect(save.load()).toEqual({ totalXp: 0, unlocks: ['hat'], name: 'Mo' })
    expect(save.report().replaced).toEqual(['totalXp'])
  })

  it('clean: the game\'s own tidy-up runs last', () => {
    const storage = memoryStorage()
    const save = progressSave(storage, { clean: (p) => ({ ...p, totalXp: Math.max(0, p.totalXp) }) })
    save.save({ ...fresh, totalXp: -5 })
    expect(save.load().totalXp).toBe(0)
  })
})

describe('createSave — upgrades, one step at a time', () => {
  const v3 = (storage = memoryStorage()) => createSave({
    key: 'test:choices', kind: 'settings', version: 3, storage, onProblem: quiet,
    fresh: { size: 'small', twoLetters: false, colour: 'blue' },
    upgrades: {
      2: (v1: { big: boolean }) => ({ size: v1.big ? 'large' : 'small' }), // a field renamed
      3: (v2: { size: string }) => ({ ...v2, twoLetters: false }), // a default that must reach old saves too
    },
  })

  it('a version-1 save goes 1 → 2 → 3, never a jump', () => {
    const storage = memoryStorage({ 'test:choices': JSON.stringify({ save: 'test:choices', version: 1, savedAt: '', data: { big: true, twoLetters: true } }) })
    const save = v3(storage)
    expect(save.load()).toEqual({ size: 'large', twoLetters: false, colour: 'blue' })
    expect(save.report()).toMatchObject({ from: 'save', upgradedFrom: 1 })
  })

  it('a version-2 save only runs the last step', () => {
    const storage = memoryStorage({ 'test:choices': JSON.stringify({ save: 'test:choices', version: 2, savedAt: '', data: { size: 'large', twoLetters: true } }) })
    expect(v3(storage).load()).toEqual({ size: 'large', twoLetters: false, colour: 'blue' })
  })

  it('a missing step = that copy can\'t be read: it falls back, and says why', () => {
    const storage = memoryStorage({ 'test:choices': JSON.stringify({ save: 'test:choices', version: 1, savedAt: '', data: {} }) })
    const save = createSave({ key: 'test:choices', kind: 'settings', version: 3, storage, onProblem: quiet, fresh: { a: 1 }, upgrades: { 3: (d: object) => d } })
    expect(save.load()).toEqual({ a: 1 })
    expect(save.report().problems[0]).toContain('no upgrade step to version 2')
    expect(save.report().note).toBe(NOTES.damaged)
  })

  it('a save written before the module (oldSave) is read as its version, then upgraded', () => {
    const storage = memoryStorage({ 'goops-progress': JSON.stringify({ v: 1, totalXp: 300, scrapsSpent: 20 }) })
    const save = createSave({
      key: 'goops-progress', kind: 'progress', version: 1, storage, onProblem: quiet,
      fresh: { totalXp: 0, scrapsSpent: 0 },
      oldSave: (raw) => (raw?.v === 1 ? { version: 1, data: { totalXp: raw.totalXp, scrapsSpent: raw.scrapsSpent } } : null),
    })
    expect(save.load()).toEqual({ totalXp: 300, scrapsSpent: 20 })
    save.save({ totalXp: 310, scrapsSpent: 20 })
    expect(JSON.parse(storage.data['goops-progress'])).toMatchObject({ save: 'goops-progress', version: 1 })
    expect(JSON.parse(storage.data[backupKey('goops-progress', 1)])).toEqual({ v: 1, totalXp: 300, scrapsSpent: 20 }) // the old copy is the backup
  })
})

describe('createSave — safe writes and backups', () => {
  it('each save slides the one before into the backups (2 by default, from content/saves.json)', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    for (const xp of [1, 2, 3, 4]) save.save({ ...fresh, totalXp: xp })
    const xpAt = (k: string) => JSON.parse(storage.data[k]).data.totalXp
    expect(xpAt('test:progress')).toBe(4)
    expect(xpAt(backupKey('test:progress', 1))).toBe(3)
    expect(xpAt(backupKey('test:progress', 2))).toBe(2)
    expect(storage.data[backupKey('test:progress', 3)]).toBeUndefined()
  })

  it('the backup count is a content/saves.json knob', () => {
    setSavesConfig({ backups: 3 })
    const storage = memoryStorage()
    const save = progressSave(storage)
    for (const xp of [1, 2, 3, 4, 5]) save.save({ ...fresh, totalXp: xp })
    expect(JSON.parse(storage.data[backupKey('test:progress', 3)]).data.totalXp).toBe(2)
    setSavesConfig({ backups: 1 })
    save.save({ ...fresh, totalXp: 6 })
    expect(storage.data[backupKey('test:progress', 2)]).toBeUndefined() // tidied away
  })

  it('a cut-off newest copy → the newest GOOD copy wins, and the broken one is kept aside', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    save.save({ ...fresh, totalXp: 10 })
    save.save({ ...fresh, totalXp: 20 })
    storage.data['test:progress'] = storage.data['test:progress'].slice(0, 30) // the browser closed mid-write
    expect(save.load().totalXp).toBe(10)
    expect(save.report()).toMatchObject({ from: 'backup', backup: 1, note: NOTES.backup })
    expect(save.report().problems[0]).toContain('cut off')
    expect(storage.data[damagedKey('test:progress')]).toHaveLength(30)
  })

  it('a broken newest copy never pushes a good backup out', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    save.save({ ...fresh, totalXp: 10 })
    save.save({ ...fresh, totalXp: 20 })
    storage.data['test:progress'] = '{oops'
    save.save({ ...fresh, totalXp: 30 })
    expect(JSON.parse(storage.data[backupKey('test:progress', 1)]).data.totalXp).toBe(10)
  })

  it('empty, wrong-type and other-save copies fall back to the backup', () => {
    const record = (fields: object) => JSON.stringify({ save: 'test:progress', version: 1, savedAt: '', ...fields })
    for (const broken of ['', '   ', 'null', '42', '"text"', JSON.stringify({ save: 'other:save', version: 1, data: {} }), record({ version: 'two', data: {} }),
      record({ data: 42 }), record({ data: [1, 2] }), record({ data: null })]) {
      const storage = memoryStorage()
      const save = progressSave(storage)
      save.save({ ...fresh, totalXp: 10 })
      save.save({ ...fresh, totalXp: 20 })
      storage.data['test:progress'] = broken
      expect(save.load().totalXp, broken).toBe(10)
    }
  })

  it('every copy broken → fresh, no crash', () => {
    const storage = memoryStorage({ 'test:progress': '{', [backupKey('test:progress', 1)]: '[', [backupKey('test:progress', 2)]: 'x' })
    const save = progressSave(storage)
    expect(save.load()).toEqual(fresh)
    expect(save.report().problems).toHaveLength(3)
  })

  it('full storage: save says so, the game keeps running, the last save is still there', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    save.save({ ...fresh, totalXp: 10 })
    storage.full = true
    const result = save.save({ ...fresh, totalXp: 20 })
    expect(result).toMatchObject({ ok: false, reason: 'full' })
    expect(save.load().totalXp).toBe(10)
  })

  it('full storage: dropping the oldest backups makes room when that is enough', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    save.save({ ...fresh, totalXp: 1 })
    save.save({ ...fresh, totalXp: 2 })
    save.save({ ...fresh, totalXp: 3 })
    const setItem = storage.setItem
    let room = 0 // full until a key has been removed
    storage.removeItem = ((remove) => (k: string) => { room++; remove(k) })(storage.removeItem)
    storage.setItem = (k, v) => { if (k === 'test:progress' && room < 2) throw Object.assign(new Error('full'), { name: 'QuotaExceededError' }); setItem(k, v) }
    expect(save.save({ ...fresh, totalXp: 4 })).toEqual({ ok: true })
    expect(save.load().totalXp).toBe(4)
  })

  it('blocked storage (or none at all): never throws, loads fresh, save says why', () => {
    const storage = memoryStorage()
    storage.blocked = true
    const save = progressSave(storage)
    expect(save.load()).toEqual(fresh)
    expect(save.save(fresh)).toMatchObject({ ok: false, reason: 'blocked' })
    expect(() => save.clear()).not.toThrow()
    const none = createSave({ key: 'test:none', kind: 'settings', version: 1, fresh: { a: 1 }, storage: null, onProblem: quiet })
    expect(none.load()).toEqual({ a: 1 })
    expect(none.save({ a: 2 })).toMatchObject({ ok: false, reason: 'blocked' })
  })

  it('a write that doesn\'t read back the same keeps the old copy', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    save.save({ ...fresh, totalXp: 10 })
    const setItem = storage.setItem
    storage.setItem = (k, v) => setItem(k, k === 'test:progress' ? v.slice(0, 10) : v) // a storage that mangles writes
    expect(save.save({ ...fresh, totalXp: 20 })).toMatchObject({ ok: false, reason: 'not-kept' })
    storage.setItem = setItem
    expect(save.load().totalXp).toBe(10)
  })

  it('data that can\'t be JSON is refused, not thrown', () => {
    const save = progressSave()
    const loop: Record<string, unknown> = { ...fresh }
    loop.self = loop
    expect(save.save(loop as unknown as Progress)).toMatchObject({ ok: false, reason: 'not-data' })
  })
})

describe('createSave — a save from a newer build', () => {
  it('is kept untouched: fresh values, a plain note, and save() never writes over it', () => {
    const newer = JSON.stringify({ save: 'test:progress', version: 4, savedAt: '', data: { totalXp: 999, pets: ['cat'] } })
    const storage = memoryStorage({ 'test:progress': newer })
    const save = progressSave(storage)
    expect(save.load()).toEqual(fresh)
    expect(save.report()).toMatchObject({ from: 'fresh', newer: 4, note: NOTES.newer })
    expect(save.save({ ...fresh, totalXp: 5 })).toMatchObject({ ok: false, reason: 'newer' })
    save.clear()
    expect(storage.data['test:progress']).toBe(newer)
    expect(save.exportRecord()).toMatchObject({ version: 4, data: { totalXp: 999 } }) // a save code can still carry it
  })

  it('clear({ evenNewer }) removes it all the same (only a run asks for that)', () => {
    const storage = memoryStorage({ 'test:progress': JSON.stringify({ save: 'test:progress', version: 4, savedAt: '', data: {} }) })
    progressSave(storage).clear({ evenNewer: true })
    expect(Object.keys(storage.data)).toEqual([])
  })
})

describe('peek — is something saved, from when, without loading it', () => {
  it('nothing saved → null', () => {
    expect(progressSave().peek()).toBeNull()
  })

  it('a good save → its data (complete, as load() gives it) and when it was written', () => {
    const storage = memoryStorage({ 'test:progress': JSON.stringify({ save: 'test:progress', version: 1, savedAt: '2026-10-20T09:00:00.000Z', data: { totalXp: 50 } }) })
    expect(progressSave(storage).peek()).toEqual({ state: 'good', savedAt: '2026-10-20T09:00:00.000Z', data: { ...fresh, totalXp: 50 } })
  })

  it('changes nothing: no report, no damaged copy set aside, nothing written', () => {
    const good = JSON.stringify({ save: 'test:progress', version: 1, savedAt: '2026-10-20T09:00:00.000Z', data: { totalXp: 7 } })
    const storage = memoryStorage({ 'test:progress': '{cut off', 'test:progress~1': good })
    const save = progressSave(storage)
    expect(save.peek()).toMatchObject({ state: 'good', data: { totalXp: 7 } }) // the backup load() would use
    expect(Object.keys(storage.data).sort()).toEqual(['test:progress', 'test:progress~1'])
    expect(save.report().from).toBe('fresh') // load() was never called
  })

  it('a newer build\'s save → newer, with its version and time', () => {
    const storage = memoryStorage({ 'test:progress': JSON.stringify({ save: 'test:progress', version: 4, savedAt: '2026-10-20T09:00:00.000Z', data: {} }) })
    expect(progressSave(storage).peek()).toEqual({ state: 'newer', savedAt: '2026-10-20T09:00:00.000Z', version: 4 })
  })

  it('only broken copies → damaged, and why', () => {
    const storage = memoryStorage({ 'test:progress': '{', 'test:progress~1': '42' })
    expect(progressSave(storage).peek()).toMatchObject({ state: 'damaged', savedAt: '', problem: expect.stringContaining('not JSON') })
  })
})

describe('createSave — runs, slots, keys', () => {
  it('a run is cleared whole when it ends (backups too, or a finished run would come back)', () => {
    const storage = memoryStorage()
    const run = createSave({ key: 'test:run', kind: 'run', version: 1, fresh: { turn: 0 }, storage, onProblem: quiet })
    run.save({ turn: 3 })
    run.save({ turn: 4 })
    run.clear()
    expect(run.load()).toEqual({ turn: 0 })
    expect(Object.keys(storage.data)).toEqual([])
  })

  it('slots: each slot its own save, plus a list of them, newest first', () => {
    const storage = memoryStorage()
    const slots = createSave({ key: 'test:slots', kind: 'slots', version: 1, fresh: { level: 1 }, storage, onProblem: quiet })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T10:00:00Z'))
    slots.slot('a').save({ level: 3 })
    vi.setSystemTime(new Date('2026-10-19T11:00:00Z'))
    slots.slot('b').save({ level: 7 })
    vi.useRealTimers()
    expect(slots.slot('a').load()).toEqual({ level: 3 })
    expect(slots.slot('b').load()).toEqual({ level: 7 })
    expect(slots.slots().map((s) => s.id)).toEqual(['b', 'a'])
    slots.slot('a').clear()
    expect(slots.slots().map((s) => s.id)).toEqual(['b'])
    expect(storage.data['test:slots/a']).toBeUndefined()
  })

  it('a key without the game\'s name in front gets one warning', () => {
    const problems: string[] = []
    createSave({ key: 'progress', kind: 'progress', version: 1, fresh: {}, storage: memoryStorage(), onProblem: (m) => problems.push(m) })
    expect(problems[0]).toContain('start with the game\'s name')
  })

  it('a storage with only getItem + setItem works too (a clear writes "" — read as nothing)', () => {
    const data: Record<string, string> = {}
    const storage = { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v } }
    const run = createSave({ key: 'test:run', kind: 'run', version: 1, fresh: { turn: 0 }, storage, onProblem: quiet })
    run.save({ turn: 2 })
    run.save({ turn: 3 })
    expect(run.load()).toEqual({ turn: 3 })
    run.clear()
    expect(run.load()).toEqual({ turn: 0 })
    expect(run.report().problems).toEqual([])
  })

  it('withStorage: the same save somewhere else', () => {
    const a = memoryStorage()
    const b = memoryStorage()
    const save = progressSave(a)
    save.withStorage(b).save({ ...fresh, totalXp: 7 })
    expect(save.load().totalXp).toBe(0)
    expect(save.withStorage(b).load().totalXp).toBe(7)
  })
})

describe('checkRecord / restoreRecord (what save codes use)', () => {
  it('a good record is upgraded and checked without writing; restoring it makes the old save a backup', () => {
    const storage = memoryStorage()
    const save = progressSave(storage)
    save.save({ ...fresh, totalXp: 5 })
    const checked = save.checkRecord({ save: 'test:progress', version: 1, savedAt: 'x', data: { totalXp: 80 } })
    expect(checked).toMatchObject({ ok: true, record: { data: { totalXp: 80, unlocks: [], name: 'Player' } } })
    expect(save.load().totalXp).toBe(5) // nothing written yet
    if (checked.ok) expect(save.restoreRecord(checked.record)).toEqual({ ok: true })
    expect(save.load().totalXp).toBe(80)
    expect(JSON.parse(storage.data[backupKey('test:progress', 1)]).data.totalXp).toBe(5)
  })

  it('newer and broken records say so', () => {
    const save = progressSave()
    expect(save.checkRecord({ save: 'test:progress', version: 9, data: {} })).toMatchObject({ ok: false, newer: true })
    expect(save.checkRecord('nonsense')).toMatchObject({ ok: false, newer: false })
  })
})
