import { describe, expect, it, vi } from 'vitest'
import { EARLIER, mergeRecords } from './progress'
import { createSave, type SaveRecord } from './saves'
import { memoryStorage } from './storage'

type Stats = { bestScore: number; gamesPlayed: number; unlocks: string[]; title: string }
const fresh: Stats = { bestScore: 0, gamesPlayed: 0, unlocks: [], title: 'Rookie' }
const quiet = () => {}

/** The same save on one device (its own storage = its own browser). */
const onDevice = (storage = memoryStorage()) => createSave<Stats>({
  key: 'test:stats', kind: 'progress', version: 1, fresh, storage, onProblem: quiet,
  fields: { bestScore: 'highest', gamesPlayed: 'add-up', unlocks: 'collect', title: 'newest' },
})

/** Play some games on a device: each one adds 1 to gamesPlayed, then saves. */
function play(device: ReturnType<typeof onDevice>, games: number, more: Partial<Stats> = {}) {
  for (let i = 0; i < games; i++) {
    const s = device.load()
    device.save({ ...s, ...more, gamesPlayed: s.gamesPlayed + 1 })
  }
}

describe('progress fields combine by their rule', () => {
  it('add-up: two devices\' games played merge to the SUM (not the higher one)', () => {
    const phone = onDevice()
    const laptop = onDevice()
    play(phone, 5)
    play(laptop, 3)
    const merged = phone.merge(phone.exportRecord()! as SaveRecord<Stats>, laptop.exportRecord()! as SaveRecord<Stats>)
    expect(merged.data.gamesPlayed).toBe(8)
  })

  it('add-up: the same copy met twice never counts twice; later play on both still adds up', () => {
    const phone = onDevice()
    const laptop = onDevice()
    play(phone, 5)
    const first = phone.exportRecord()! as SaveRecord<Stats>
    // the laptop takes the phone's progress (a save code), then plays 2 more
    laptop.restoreRecord(first)
    play(laptop, 2)
    expect(laptop.load().gamesPlayed).toBe(7)
    play(phone, 1)
    const merged = phone.merge(phone.exportRecord()! as SaveRecord<Stats>, laptop.exportRecord()! as SaveRecord<Stats>)
    expect(merged.data.gamesPlayed).toBe(8) // 6 on the phone + 2 on the laptop
    const again = phone.merge(merged, laptop.exportRecord()! as SaveRecord<Stats>)
    expect(again.data.gamesPlayed).toBe(8)
  })

  it('add-up: a save from before counting is one "earlier" part', () => {
    const storage = memoryStorage({ 'test:stats': JSON.stringify({ save: 'test:stats', version: 1, savedAt: '', data: { ...fresh, gamesPlayed: 10 } }) })
    const device = onDevice(storage)
    play(device, 1)
    const record = device.exportRecord()!
    expect(Object.values(record.counts!.gamesPlayed).sort()).toEqual([1, 10])
    expect(record.counts!.gamesPlayed[EARLIER]).toBe(10)
  })

  it('add-up: a total that went down (reset) never makes a device\'s part negative', () => {
    const device = onDevice()
    play(device, 4)
    device.save({ ...fresh, gamesPlayed: 0 })
    expect(Object.values(device.exportRecord()!.counts!.gamesPlayed)).toEqual([0])
  })

  it('highest keeps the bigger number; collect keeps every unlock once; newest takes the later copy', () => {
    const a: SaveRecord<Stats> = { save: 'test:stats', version: 1, savedAt: '2026-10-01T00:00:00Z', data: { bestScore: 900, gamesPlayed: 0, unlocks: ['hat', 'cape'], title: 'Old title' } }
    const b: SaveRecord<Stats> = { save: 'test:stats', version: 1, savedAt: '2026-10-02T00:00:00Z', data: { bestScore: 400, gamesPlayed: 0, unlocks: ['cape', 'boots'], title: 'New title' } }
    for (const merged of [mergeRecords('progress', onDeviceFields, a, b), mergeRecords('progress', onDeviceFields, b, a)]) {
      expect(merged.data).toMatchObject({ bestScore: 900, unlocks: ['hat', 'cape', 'boots'], title: 'New title' })
      expect(merged.savedAt).toBe(b.savedAt)
    }
  })

  it('a field with no rule = newest; settings and runs: the newest copy wins whole', () => {
    const a: SaveRecord<{ volume: number }> = { save: 'x:s', version: 1, savedAt: '2026-10-02T00:00:00Z', data: { volume: 20 } }
    const b: SaveRecord<{ volume: number }> = { save: 'x:s', version: 1, savedAt: '2026-10-01T00:00:00Z', data: { volume: 90 } }
    expect(mergeRecords('settings', undefined, a, b).data.volume).toBe(20)
    expect(mergeRecords('progress', {}, a, b).data.volume).toBe(20)
    expect(mergeRecords('run', undefined, b, a).data.volume).toBe(20)
  })

  it('the device id lives beside the save, never inside it (a save code doesn\'t carry it)', () => {
    const storage = memoryStorage()
    vi.spyOn(Math, 'random').mockReturnValue(0.123456)
    play(onDevice(storage), 1)
    vi.restoreAllMocks()
    const id = storage.data['test:stats~device']
    expect(id).toBeTruthy()
    expect(JSON.parse(storage.data['test:stats']).data).not.toHaveProperty('device')
    expect(JSON.parse(storage.data['test:stats']).counts.gamesPlayed).toEqual({ [id]: 1 })
  })
})

const onDeviceFields = { bestScore: 'highest', gamesPlayed: 'add-up', unlocks: 'collect', title: 'newest' } as const
