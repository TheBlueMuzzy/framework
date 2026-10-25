import { describe, expect, it } from 'vitest'
import { CODE_WORDS, MAX_CODE_CHARS, MAX_UNPACKED_BYTES, gameLabel, makeSaveCode, partlyLoaded, readSaveCode, saveFileName } from './saveCode'
import { createSave } from './saves'
import { memoryStorage } from './storage'

const quiet = () => {}

/** One device = one browser storage with the game's two saves on it. */
function device(storage = memoryStorage()) {
  const progress = createSave({
    key: 'goops-progress', kind: 'progress', version: 2, storage, onProblem: quiet,
    fresh: { totalXp: 0, gamesPlayed: 0, unlocks: [] as string[] },
    upgrades: { 2: (v1: object) => ({ ...v1, unlocks: [] }) },
    fields: { totalXp: 'highest', gamesPlayed: 'add-up', unlocks: 'collect' },
  })
  const settings = createSave({ key: 'goops:settings', kind: 'settings', version: 1, storage, onProblem: quiet, fresh: { volume: 80 } })
  return { storage, progress, settings, saves: [progress, settings] }
}

describe('save code', () => {
  it('copied out and pasted into a fresh browser restores everything', async () => {
    const phone = device()
    phone.progress.save({ totalXp: 1200, gamesPlayed: 14, unlocks: ['hat', 'cape'] })
    phone.settings.save({ volume: 30 })
    const code = await makeSaveCode(phone.saves)
    expect(code).toMatch(/^GOOPS-1z-[A-Za-z0-9_-]+$/)
    const laptop = device()
    const result = await readSaveCode(code, laptop.saves)
    expect(result).toEqual({ ok: true, restored: ['goops-progress', 'goops:settings'], skipped: [] })
    expect(laptop.progress.load()).toEqual({ totalXp: 1200, gamesPlayed: 14, unlocks: ['hat', 'cape'] })
    expect(laptop.settings.load()).toEqual({ volume: 30 })
  })

  it('spaces and line breaks from a chat message don\'t matter', async () => {
    const a = device()
    a.settings.save({ volume: 10 })
    const code = await makeSaveCode(a.saves)
    const messy = `  ${code.slice(0, 10)}\n${code.slice(10, 30)} ${code.slice(30)}\n`
    const b = device()
    expect((await readSaveCode(messy, b.saves)).ok).toBe(true)
    expect(b.settings.load().volume).toBe(10)
  })

  it('pasting onto progress already here COMBINES it (an older code can\'t lose progress); settings are replaced', async () => {
    const phone = device()
    phone.progress.save({ totalXp: 500, gamesPlayed: 3, unlocks: ['hat'] })
    phone.settings.save({ volume: 30 })
    const code = await makeSaveCode(phone.saves)
    const laptop = device()
    laptop.progress.save({ totalXp: 900, gamesPlayed: 2, unlocks: ['boots'] })
    laptop.settings.save({ volume: 70 })
    await readSaveCode(code, laptop.saves)
    expect(laptop.progress.load()).toEqual({ totalXp: 900, gamesPlayed: 5, unlocks: expect.arrayContaining(['hat', 'boots']) })
    expect(laptop.settings.load().volume).toBe(30)
    // pasting the same code twice changes nothing more
    await readSaveCode(code, laptop.saves)
    expect(laptop.progress.load().gamesPlayed).toBe(5)
  })

  it('a code from an older build is upgraded on the way in', async () => {
    const old = createSave({ key: 'goops-progress', kind: 'progress', version: 1, storage: memoryStorage(), onProblem: quiet, fresh: { totalXp: 0, gamesPlayed: 0 } })
    old.save({ totalXp: 40, gamesPlayed: 1 })
    const code = await makeSaveCode([old])
    const today = device()
    expect((await readSaveCode(code, today.saves)).ok).toBe(true)
    expect(today.progress.load()).toEqual({ totalXp: 40, gamesPlayed: 1, unlocks: [] })
  })

  it('a bad code never touches the save, and says why in plain words', async () => {
    const mine = device()
    mine.progress.save({ totalXp: 77, gamesPlayed: 1, unlocks: [] })
    const before = { ...mine.storage.data }
    const good = await makeSaveCode(mine.saves)
    const cases: [string, string][] = [
      ['', CODE_WORDS.empty],
      ['hello there', CODE_WORDS.notACode],
      [good.replace('GOOPS', 'GLYPHTENDER'), CODE_WORDS.otherGame('GLYPHTENDER')],
      [good.replace('-1z-', '-9z-'), CODE_WORDS.newerFormat],
      [good.slice(0, good.length - 12), CODE_WORDS.damaged], // cut off
      [good.slice(0, 12) + 'AAAA' + good.slice(16), CODE_WORDS.damaged], // a typo
    ]
    for (const [code, message] of cases) {
      expect(await readSaveCode(code, mine.saves), code.slice(0, 20)).toEqual({ ok: false, message })
      expect(mine.storage.data).toEqual(before)
    }
  })

  it('a code holding a save from a newer build is refused whole — nothing is written', async () => {
    const newer = createSave({ key: 'goops-progress', kind: 'progress', version: 5, storage: memoryStorage(), onProblem: quiet, fresh: { totalXp: 0 }, upgrades: { 2: (d) => d, 3: (d) => d, 4: (d) => d, 5: (d) => d } })
    const settingsThere = createSave({ key: 'goops:settings', kind: 'settings', version: 1, storage: memoryStorage(), onProblem: quiet, fresh: { volume: 80 } })
    newer.save({ totalXp: 3 })
    settingsThere.save({ volume: 12 })
    const code = await makeSaveCode([settingsThere, newer]) // the good settings come first: still nothing is written
    const mine = device()
    mine.settings.save({ volume: 55 })
    expect(await readSaveCode(code, mine.saves)).toEqual({ ok: false, message: CODE_WORDS.newerSave })
    expect(mine.settings.load().volume).toBe(55)
  })

  it('saves the game no longer has are skipped; a code with none of this game\'s saves is refused', async () => {
    const a = device()
    const extra = createSave({ key: 'goops:old-thing', kind: 'settings', version: 1, storage: a.storage, onProblem: quiet, fresh: { x: 1 } })
    extra.save({ x: 2 })
    a.settings.save({ volume: 5 })
    const code = await makeSaveCode([a.settings, extra])
    const b = device()
    expect(await readSaveCode(code, b.saves)).toMatchObject({ ok: true, skipped: ['goops:old-thing'] })
    expect(await readSaveCode(await makeSaveCode([extra]), b.saves)).toEqual({ ok: false, message: CODE_WORDS.nothingForThisGame })
  })

  it('a write refused part-way (review fix 4) says exactly which saves were restored and which weren\'t', async () => {
    const a = device()
    a.progress.save({ totalXp: 10, gamesPlayed: 1, unlocks: [] })
    a.settings.save({ volume: 20 })
    const code = await makeSaveCode(a.saves)
    const progressStorage = memoryStorage()
    const settingsStorage = memoryStorage()
    settingsStorage.full = true
    const b = device(progressStorage)
    const settings = b.settings.withStorage(settingsStorage)
    const result = await readSaveCode(code, [b.progress, settings])
    expect(result).toMatchObject({ ok: false, restored: ['goops-progress'], notRestored: ['goops:settings'] })
    expect(!result.ok && result.message).toContain('Part of the save code was loaded')
    expect(b.progress.load().totalXp).toBe(10)
    expect(partlyLoaded(result)).toBe(true) // F137: the panel offers the reload
  })

  it('partlyLoaded: only when some saves came in and others didn\'t (F137)', () => {
    expect(partlyLoaded({ ok: true, restored: ['a'], skipped: [] })).toBe(false) // a full load
    expect(partlyLoaded({ ok: false, message: 'damaged' })).toBe(false) // nothing written
    expect(partlyLoaded({ ok: false, message: 'full', restored: [], notRestored: ['a'] })).toBe(false) // nothing came in
    expect(partlyLoaded({ ok: false, message: 'part', restored: ['a'], notRestored: ['b'] })).toBe(true)
  })

  // security review (2026-10-19): a code is untrusted text anyone can post
  const asCode = (content: unknown) => `GOOPS-1j-${Buffer.from(JSON.stringify(content)).toString('base64url')}`

  it('a code far bigger than any real save is refused before it is unpacked; nothing changes', async () => {
    const here = device()
    here.settings.save({ volume: 40 })
    const result = await readSaveCode(`GOOPS-1j-${'A'.repeat(MAX_CODE_CHARS)}`, here.saves)
    expect(result).toEqual({ ok: false, message: CODE_WORDS.tooBig })
    expect(here.settings.load()).toEqual({ volume: 40 })
  })

  it('a small code that would unpack into megabytes (a "zip bomb") stops early and is refused', async () => {
    const huge = new Uint8Array(MAX_UNPACKED_BYTES * 2) // all zeros: packs down to a few KB
    const stream = new Blob([huge]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    const packed = Buffer.from(await new Response(stream).arrayBuffer()).toString('base64url')
    expect(packed.length).toBeLessThan(MAX_CODE_CHARS)
    const result = await readSaveCode(`GOOPS-1z-${packed}`, device().saves)
    expect(result).toEqual({ ok: false, message: CODE_WORDS.tooBig })
  })

  it('a device part named like a built-in ("constructor") can\'t turn an add-up stat into nothing', async () => {
    const here = device()
    here.progress.save({ totalXp: 10, gamesPlayed: 3, unlocks: [] })
    const record = { save: 'goops-progress', version: 2, savedAt: Date.now(), data: { totalXp: 0, gamesPlayed: 5, unlocks: [] }, counts: { gamesPlayed: { constructor: 5, __proto__: 7 } } }
    await readSaveCode(asCode({ saves: { 'goops-progress': record } }), here.saves)
    const games = here.progress.load().gamesPlayed
    expect(Number.isFinite(games)).toBe(true)
    expect(games).toBeGreaterThanOrEqual(3)
  })

  it('slots travel one record per slot', async () => {
    const make = (storage = memoryStorage()) => createSave({ key: 'rpg:slots', kind: 'slots', version: 1, storage, onProblem: quiet, fresh: { level: 1 } })
    const a = make()
    a.slot('1').save({ level: 4 })
    a.slot('2').save({ level: 9 })
    const b = make()
    expect((await readSaveCode(await makeSaveCode([a]), [b])).ok).toBe(true)
    expect(b.slot('2').load()).toEqual({ level: 9 })
    expect(b.slots().map((s) => s.id).sort()).toEqual(['1', '2'])
  })

  it('names: the game label and the file name come from the first save\'s key', () => {
    const { saves } = device()
    expect(gameLabel(saves)).toBe('GOOPS')
    expect(saveFileName(saves, new Date('2026-10-19T12:00:00Z'))).toBe('goops-save-2026-10-19.txt')
  })
})
