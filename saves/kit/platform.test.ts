import { readdirSync, readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { checkSaveHealth } from './health'
import { COPIED_MARKER, openSaves, slowBackend, type OpenedSaves } from './platform'
import { createSave } from './saves'
import { createRun } from './run'
import { memoryStorage, savesOnNativeStorage, savesStorage, setSavesStorage } from './storage'

const SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A browser storage to copy from (localStorage's length + key(i) too). */
function oldBrowser(start: Record<string, string>) {
  const storage = memoryStorage(start)
  return Object.assign(storage, {
    get length() { return Object.keys(storage.data).length },
    key: (i: number) => Object.keys(storage.data)[i] ?? null,
  })
}

/** A pretend page: fire('visibilitychange') / fire('pagehide'). */
function fakePage() {
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const window = new EventTarget()
  let listening = 0
  for (const target of [document, window]) {
    const add = target.addEventListener.bind(target)
    const remove = target.removeEventListener.bind(target)
    target.addEventListener = (...args: Parameters<EventTarget['addEventListener']>) => { listening++; add(...args) }
    target.removeEventListener = (...args: Parameters<EventTarget['removeEventListener']>) => { listening--; remove(...args) }
  }
  return {
    listening: () => listening,
    page: { document, window },
    fire(type: string) {
      if (type === 'visibilitychange') document.visibilityState = 'hidden'
      ;(type === 'pagehide' ? window : document).dispatchEvent(new Event(type))
    },
  }
}

const progress = () => createSave({ key: 'mygame:progress', kind: 'progress', version: 1, fresh: { stars: 0 }, onProblem: () => {} })
let opened: OpenedSaves | null = null
const open = async (...args: Parameters<typeof openSaves>) => (opened = await openSaves(args[0], { page: null, copyFrom: null, onProblem: () => {}, ...args[1] }))

afterEach(async () => {
  await opened?.close()
  opened = null
  setSavesStorage(undefined)
})

describe('openSaves — the same kit on a slow storage', () => {
  it('a save made before the app storage opened (when the game files load) still reads and writes there', async () => {
    const save = progress() // made first, like a game's module-level save
    const earlier = memoryStorage() // what an earlier session left on the app's disk
    createSave({ key: 'mygame:progress', kind: 'progress', version: 1, fresh: { stars: 0 }, storage: earlier }).save({ stars: 7 })
    const disk = slowBackend(earlier.data)
    await open(disk, { game: 'mygame' })
    expect(save.load()).toEqual({ stars: 7 })
    expect(save.save({ stars: 8 }).ok).toBe(true)
    expect(save.load()).toEqual({ stars: 8 }) // read straight back from memory, no wait
    expect(disk.data['mygame:progress']).toContain('"stars":7') // not written yet…
    expect(await opened!.flush()).toBeNull()
    expect(JSON.parse(disk.data['mygame:progress']).data).toEqual({ stars: 8 }) // …written on flush
  })

  it('switches the whole kit (native) and back', async () => {
    const disk = slowBackend()
    await open(disk, { game: 'mygame' })
    expect(savesStorage()).toBe(opened)
    expect(savesOnNativeStorage()).toBe(true)
    setSavesStorage(undefined)
    expect(savesOnNativeStorage()).toBe(false)
    const notForKit = await openSaves(slowBackend(), { game: 'mygame', page: null, copyFrom: null, useForKit: false })
    expect(savesStorage()).not.toBe(notForKit)
    notForKit.close()
  })

  it('loads everything in ONE call; changes close together go out in one write', async () => {
    const disk = slowBackend({ 'mygame:a': '1', 'mygame:b': '2', 'other:c': '3' }, { waitMs: 1 })
    await open(disk, { game: 'mygame', delayMs: 20 })
    expect(disk.calls.loadAll).toBe(1)
    expect(opened!.getItem('mygame:b')).toBe('2')
    for (let i = 0; i < 5; i++) opened!.setItem('mygame:a', String(i))
    opened!.setItem('mygame:b', 'x')
    expect(opened!.waiting()).toBe(2)
    await wait(60)
    expect(disk.calls.write).toBe(1)
    expect(disk.calls.keysWritten).toBe(2)
    expect(disk.data).toMatchObject({ 'mygame:a': '4', 'mygame:b': 'x' })
    opened!.removeItem('mygame:b')
    await opened!.flush()
    expect(disk.data['mygame:b']).toBeUndefined()
  })

  it('a hidden or closing page writes at once (no waiting for the timer)', async () => {
    const page = fakePage()
    const disk = slowBackend({}, { waitMs: 1 })
    await open(disk, { game: 'mygame', delayMs: 60_000, page: page.page })
    opened!.setItem('mygame:run', 'turn 4')
    page.fire('visibilitychange')
    await wait(10)
    expect(disk.data['mygame:run']).toBe('turn 4')
    opened!.setItem('mygame:run', 'turn 5')
    page.fire('pagehide')
    await wait(10)
    expect(disk.data['mygame:run']).toBe('turn 5')
    expect(page.listening()).toBe(2)
    await opened!.close()
    expect(page.listening()).toBe(0) // deaf to the page now
  })

  it("the game's own hide save (run.ts listens AFTER openSaves) goes out at once too, not after the timer (proof finding)", async () => {
    const page = fakePage()
    const disk = slowBackend({}, { waitMs: 1 })
    await open(disk, { game: 'mygame', delayMs: 60_000, page: page.page })
    page.page.document.addEventListener('visibilitychange', () => { opened!.setItem('mygame:run', 'what the game has now') })
    page.fire('visibilitychange')
    await wait(10)
    expect(disk.data['mygame:run']).toBe('what the game has now')
    expect(opened!.waiting()).toBe(0)
  })

  it('writing the same value again writes nothing', async () => {
    const disk = slowBackend({ 'mygame:run': 'turn 4' })
    await open(disk, { game: 'mygame' })
    opened!.setItem('mygame:run', 'turn 4')
    opened!.removeItem('mygame:nothing')
    expect(opened!.waiting()).toBe(0)
    opened!.setItem('mygame:run', 'turn 5')
    opened!.setItem('mygame:run', 'turn 4') // back to what's on disk: still written (it's what the game said last)
    await opened!.flush()
    expect(disk.data['mygame:run']).toBe('turn 4')
  })

  it('a run (Continue) autosaves through it like in a browser', async () => {
    const disk = slowBackend()
    await open(disk, { game: 'mygame' })
    const run = createRun({ key: 'mygame:run', version: 1, fresh: { turn: 0 }, page: null, onProblem: () => {} })
    run.autosave({ turn: 3 })
    await opened!.flush()
    expect(JSON.parse(disk.data['mygame:run']).data).toEqual({ turn: 3 })
    expect(run.resume()).toEqual({ ok: true, data: { turn: 3 } })
    run.end()
    await opened!.flush()
    expect(disk.data['mygame:run']).toBeUndefined()
  })

  it('changes made while a write is on its way go out after it, in order', async () => {
    const disk = slowBackend({}, { waitMs: 15 })
    await open(disk, { game: 'mygame' })
    opened!.setItem('mygame:a', '1')
    const first = opened!.flush()
    opened!.setItem('mygame:a', '2')
    await Promise.all([first, opened!.flush()])
    expect(disk.data['mygame:a']).toBe('2')
    expect(disk.calls.write).toBe(2)
  })
})

describe('openSaves — nothing is lost when the storage fails', () => {
  it("can't read the saves → the kit is told it can't save, and nothing is written over them", async () => {
    const disk = slowBackend({ 'mygame:progress': 'the real save' })
    disk.failLoad = true
    const problems: string[] = []
    await open(disk, { game: 'mygame', onProblem: (m) => problems.push(m) })
    expect(opened!.problem()).toBe('load')
    expect(problems[0]).toMatch(/couldn't read the test storage/)
    const result = progress().save({ stars: 1 })
    expect(result).toMatchObject({ ok: false, reason: 'blocked' })
    expect(await opened!.flush()).toBe('blocked')
    expect(disk.calls.write).toBe(0)
    expect(disk.data['mygame:progress']).toBe('the real save')
  })

  it('a full disk → the waiting change is kept and retried; new saves are refused ("full") until it works', async () => {
    const disk = slowBackend({}, { waitMs: 1 })
    await open(disk, { game: 'mygame', retryMs: 30 })
    const save = progress()
    expect(save.save({ stars: 1 }).ok).toBe(true)
    disk.failWrites = 'full'
    expect(await opened!.flush()).toBe('full')
    expect(opened!.problem()).toBe('full')
    expect(save.save({ stars: 2 })).toMatchObject({ ok: false, reason: 'full' }) // told, like a full browser storage…
    expect(save.load()).toEqual({ stars: 1 }) // …and true: nothing changed
    disk.failWrites = null
    await wait(80) // the retry timer, nobody calls flush
    expect(opened!.problem()).toBeNull()
    expect(JSON.parse(disk.data['mygame:progress']).data).toEqual({ stars: 1 }) // the change that was waiting, not lost
    expect(save.save({ stars: 3 }).ok).toBe(true)
    await opened!.flush()
    expect(JSON.parse(disk.data['mygame:progress']).data).toEqual({ stars: 3 })
  })

  it('a full disk is "full" by any engine\'s name for it — an older Firefox\'s NS_ERROR_DOM_QUOTA_REACHED, or only code 22 (F150)', async () => {
    for (const thrown of [{ name: 'NS_ERROR_DOM_QUOTA_REACHED', code: 1014 }, { name: 'Error', code: 22 }]) {
      const disk = slowBackend({}, { waitMs: 1 })
      await open(disk, { game: 'mygame', retryMs: 60_000 })
      disk.write = async () => { throw Object.assign(new Error('full'), thrown) }
      progress().save({ stars: 1 })
      expect(await opened!.flush()).toBe('full')
      await opened!.close()
    }
  })

  it("the kit's \"make room\" step while the disk is full never deletes backups on the disk (review finding)", async () => {
    const disk = slowBackend({}, { waitMs: 1 })
    await open(disk, { game: 'mygame' })
    const save = progress()
    for (const stars of [1, 2, 3]) save.save({ stars })
    await opened!.flush()
    const backups = () => ['mygame:progress', 'mygame:progress~1', 'mygame:progress~2'].map((k) => disk.data[k] && JSON.parse(disk.data[k]).data.stars)
    expect(backups()).toEqual([3, 2, 1])
    disk.failWrites = 'full'
    save.save({ stars: 4 }) // accepted, waiting
    await opened!.flush() // fails: full
    for (const stars of [5, 6]) expect(save.save({ stars }).ok).toBe(false) // the kit tries to drop old backups to make room
    disk.failWrites = null
    expect(await opened!.flush()).toBeNull()
    expect(backups()).toEqual([4, 3, 2]) // 4 slid in as normal; no backup was dropped by the refused saves
  })

  it('the health probe leaves nothing behind while writes fail', async () => {
    const disk = slowBackend({}, { waitMs: 1 })
    await open(disk, { game: 'mygame' })
    opened!.setItem('mygame:x', '1')
    disk.failWrites = 'blocked'
    await opened!.flush()
    expect((await checkSaveHealth({ storage: opened!, userAgent: '', crossSiteFrame: false, hostname: '', standalone: false, native: true })).canSave).toBe(false)
    disk.failWrites = null
    await opened!.flush()
    expect(Object.keys(disk.data)).toEqual(['mygame:x'])
  })

  it('close() writes what is waiting, then refuses writes and starts no timers', async () => {
    const disk = slowBackend({}, { waitMs: 1 })
    await open(disk, { game: 'mygame', delayMs: 60_000 })
    opened!.setItem('mygame:a', '1')
    expect(await opened!.close()).toBeNull()
    expect(disk.data['mygame:a']).toBe('1')
    expect(() => opened!.setItem('mygame:a', '2')).toThrow(/closed/)
    expect(progress().save({ stars: 1 })).toMatchObject({ ok: false, reason: 'blocked' }) // the kit still points here: told, not lost silently
    expect(opened!.waiting()).toBe(0)
  })

  it('a refused write leaves the last good copy on disk', async () => {
    const disk = slowBackend({}, { waitMs: 1 })
    await open(disk, { game: 'mygame' })
    const save = progress()
    save.save({ stars: 1 })
    await opened!.flush()
    const good = disk.data['mygame:progress']
    disk.failWrites = 'blocked'
    save.save({ stars: 2 })
    expect(await opened!.flush()).toBe('blocked')
    expect(disk.data['mygame:progress']).toBe(good)
  })
})

describe('openSaves — the first launch as an app copies the browser saves once', () => {
  it("copies this game's keys, not other games', and never over what the app already has", async () => {
    const browser = oldBrowser({ 'mygame:progress': 'from the browser', 'MyGame:settings': 'b', 'mygame:run': 'old run', 'othergame:x': 'no', 'mygamedeluxe:progress': 'no', mygame: 'no' })
    const disk = slowBackend({ 'mygame:run': 'the app run' })
    await open(disk, { game: 'mygame', copyFrom: browser })
    await opened!.flush()
    expect(disk.data).toEqual({ 'mygame:progress': 'from the browser', 'MyGame:settings': 'b', 'mygame:run': 'the app run', [COPIED_MARKER]: '1' })
    expect(browser.data['mygame:progress']).toBe('from the browser') // kept in the browser too
  })

  it('a later launch never copies again (an older browser save would undo app progress)', async () => {
    const browser = oldBrowser({ 'mygame:progress': 'old' })
    const disk = slowBackend({ [COPIED_MARKER]: '1' })
    await open(disk, { game: 'mygame', copyFrom: browser })
    expect(opened!.getItem('mygame:progress')).toBeNull()
    expect(opened!.waiting()).toBe(0)
  })

  it("a load that failed copies nothing (it can't tell what the app has)", async () => {
    const disk = slowBackend()
    disk.failLoad = true
    await open(disk, { game: 'mygame', copyFrom: oldBrowser({ 'mygame:progress': 'x' }) })
    expect(opened!.getItem('mygame:progress')).toBeNull()
  })
})

describe('health on a platform storage', () => {
  it('no browser warnings (Safari, private, not kept) — only "can it save?"', async () => {
    const env = { storage: memoryStorage(), userAgent: SAFARI, crossSiteFrame: false, hostname: 'localhost', standalone: false, native: true }
    expect(await checkSaveHealth(env)).toEqual({ canSave: true, kept: true, inFrame: false, onItch: false, warnings: [] })
    const blocked = memoryStorage()
    blocked.blocked = true
    expect((await checkSaveHealth({ ...env, storage: blocked })).warnings.map((w) => w.id)).toEqual(['blocked'])
  })
})

describe('the kit never reaches past the switch', () => {
  it('no kit file but storage.ts touches localStorage / sessionStorage (so setSavesStorage really moves everything)', () => {
    const dir = new URL('.', import.meta.url)
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && f.replaceAll('\\', '/') !== 'storage.ts')
    const offenders = files.filter((f) => {
      const code = readFileSync(new URL(f.replaceAll('\\', '/'), dir), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      return /\b(localStorage|sessionStorage)\b/.test(code)
    })
    expect(files.length).toBeGreaterThan(15) // it really looked (kit/*.ts + kit/ui/*.tsx)
    expect(offenders).toEqual([])
  })
})
