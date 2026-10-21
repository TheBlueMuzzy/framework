import { describe, expect, it } from 'vitest'
import { CLOUD_WORDS, cloudAddress, deleteLinkCode, linkCodeHere, loadLinkCode, makeLinkCode, type CloudOptions } from './cloud'
import { handleCloud, memoryCloudRows } from './cloudRoutes'
import { DEFAULT_SAVES_CONFIG } from './config'
import { createSave } from './saves'
import { memoryStorage } from './storage'

const quiet = () => {}

/** The game's cloud worker, in memory: every fetch goes straight to the routes. */
function fakeServer() {
  const rows = memoryCloudRows()
  let now = Date.UTC(2026, 9, 20, 12)
  let address = '203.0.113.7'
  const fetch = (async (url: string, init: RequestInit) =>
    handleCloud(new Request(url, init), { rows, settings: DEFAULT_SAVES_CONFIG.cloud, address, now })) as unknown as typeof globalThis.fetch
  return { rows, fetch, later: (ms: number) => { now += ms }, from: (a: string) => { address = a }, now: () => now }
}

/** One device = one browser storage with the game's progress + settings. */
function device(server: ReturnType<typeof fakeServer>, extra: Partial<CloudOptions> = {}) {
  const storage = memoryStorage()
  const progress = createSave({
    key: 'goops-progress', kind: 'progress', version: 1, storage, onProblem: quiet,
    fresh: { bestScore: 0, gamesPlayed: 0, unlocks: [] as string[] },
    fields: { bestScore: 'highest', gamesPlayed: 'add-up', unlocks: 'collect' },
  })
  const settings = createSave({ key: 'goops:settings', kind: 'settings', version: 1, storage, onProblem: quiet, fresh: { volume: 80 } })
  const cloud: CloudOptions = { url: 'https://goops-saves.example', storage, fetch: server.fetch, online: () => true, now: server.now, ...extra }
  return { storage, progress, settings, saves: [progress, settings], cloud }
}

/** A device that has played once (a link code needs a save to carry). */
const played = <D extends ReturnType<typeof device>>(d: D): D => { d.progress.save({ bestScore: 1, gamesPlayed: 1, unlocks: [] }); return d }

describe('link codes (the game side)', () => {
  it('A makes a link code, B types it → B\'s progress MERGED (best kept, counts added), settings replaced', async () => {
    const server = fakeServer()
    const a = device(server)
    const b = device(server)
    a.progress.save({ bestScore: 900, gamesPlayed: 5, unlocks: ['hat'] })
    a.settings.save({ volume: 20 })
    b.progress.save({ bestScore: 1200, gamesPlayed: 3, unlocks: ['cape'] })

    const made = await makeLinkCode(a.saves, a.cloud)
    if (!made.ok) throw new Error(made.message)
    expect(made.link).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(linkCodeHere(a.saves, a.cloud)).toEqual({ link: made.link, expiresAt: made.expiresAt })

    const result = await loadLinkCode(made.link.toLowerCase(), b.saves, b.cloud)
    expect(result).toEqual({ ok: true, restored: ['goops-progress', 'goops:settings'], skipped: [] })
    expect(b.progress.load()).toEqual({ bestScore: 1200, gamesPlayed: 8, unlocks: expect.arrayContaining(['cape', 'hat']) })
    expect(b.settings.load().volume).toBe(20)
    // the same code typed again counts nothing twice
    await loadLinkCode(made.link, b.saves, b.cloud)
    expect(b.progress.load().gamesPlayed).toBe(8)
  })

  it('"Delete my data" removes it from the server now; the code then fails plainly', async () => {
    const server = fakeServer()
    const a = device(server)
    a.progress.save({ bestScore: 10, gamesPlayed: 1, unlocks: [] })
    const made = await makeLinkCode(a.saves, a.cloud)
    if (!made.ok) throw new Error(made.message)
    expect(await deleteLinkCode(a.saves, a.cloud)).toEqual({ ok: true, message: CLOUD_WORDS.deleted })
    expect(server.rows.saves.size).toBe(0)
    expect(linkCodeHere(a.saves, a.cloud)).toBeNull()
    const b = device(server)
    const result = await loadLinkCode(made.link, b.saves, b.cloud)
    expect(result).toEqual({ ok: false, message: CLOUD_WORDS.notFound(7) })
    expect(b.progress.load().bestScore).toBe(0)
  })

  it('B can delete it too, after using it', async () => {
    const server = fakeServer()
    const a = device(server)
    const b = device(server)
    a.progress.save({ bestScore: 10, gamesPlayed: 1, unlocks: [] })
    const made = await makeLinkCode(a.saves, a.cloud)
    if (!made.ok) throw new Error(made.message)
    await loadLinkCode(made.link, b.saves, b.cloud)
    expect((await deleteLinkCode(b.saves, b.cloud)).message).toBe(CLOUD_WORDS.deleted)
    expect((await deleteLinkCode(a.saves, a.cloud)).message).toBe(CLOUD_WORDS.alreadyGone) // and A just forgets it
    expect(linkCodeHere(a.saves, a.cloud)).toBeNull()
  })

  it('A made its own code, then fetches B\'s: A still remembers ITS code, so "Delete my data" reaches it (review F96)', async () => {
    const server = fakeServer()
    const a = played(device(server))
    const b = played(device(server))
    const mine = await makeLinkCode(a.saves, a.cloud)
    const theirs = await makeLinkCode(b.saves, b.cloud)
    if (!mine.ok || !theirs.ok) throw new Error('no codes')
    await loadLinkCode(theirs.link, a.saves, a.cloud)
    expect(linkCodeHere(a.saves, a.cloud)?.link).toBe(mine.link)
    await deleteLinkCode(a.saves, a.cloud)
    expect(server.rows.saves.size).toBe(1) // A's own is gone; B's stays for B
  })

  it('an expired code fails plainly (and this device stops showing it)', async () => {
    const server = fakeServer()
    const a = played(device(server))
    const made = await makeLinkCode(a.saves, a.cloud)
    if (!made.ok) throw new Error(made.message)
    server.later(7 * 24 * 3_600_000)
    expect(linkCodeHere(a.saves, a.cloud)).toBeNull()
    const b = device(server)
    expect((await loadLinkCode(made.link, b.saves, b.cloud)).ok).toBe(false)
  })

  it('too many wrong codes → "too many tries"; a typo that can\'t be a code never reaches the server', async () => {
    const server = fakeServer()
    const b = device(server)
    const messages: string[] = []
    for (let i = 0; i < 12; i++) {
      const result = await loadLinkCode('ZZZZ-2222', b.saves, b.cloud)
      if (!result.ok) messages.push(result.message)
    }
    expect(messages[0]).toBe(CLOUD_WORDS.notFound(7))
    expect(messages.at(-1)).toBe(CLOUD_WORDS.tooManyTries)
    expect(await loadLinkCode('K7QM-2XR0', b.saves, b.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.notALink })
  })

  it('offline first: no network / server down / timed out → one plain sentence, nothing changed', async () => {
    const server = fakeServer()
    const failing = (() => Promise.reject(new TypeError('Failed to fetch'))) as unknown as typeof fetch
    const a = device(server, { fetch: failing })
    a.progress.save({ bestScore: 50, gamesPlayed: 2, unlocks: [] })
    expect(await makeLinkCode(a.saves, a.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.offline })
    expect(await loadLinkCode('K7QM-2XRP', a.saves, a.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.offline })
    expect(a.progress.load()).toEqual({ bestScore: 50, gamesPlayed: 2, unlocks: [] })

    const notOnline = played(device(server, { online: () => false }))
    expect(await makeLinkCode(notOnline.saves, notOnline.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.offline })
    expect(server.rows.saves.size).toBe(0) // never even sent

    const slow = (() => new Promise(() => {})) as unknown as typeof fetch
    const hanging = played(device(server, { fetch: (url, init) => new Promise((_, no) => { init?.signal?.addEventListener('abort', () => no(new Error('aborted'))); void slow(url) }), timeoutMs: 20 }))
    expect(await makeLinkCode(hanging.saves, hanging.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.offline })

    const broken = played(device(server, { fetch: (async () => new Response('<html>502</html>', { status: 502 })) as unknown as typeof fetch }))
    expect(await makeLinkCode(broken.saves, broken.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.serverProblem })

    // a delete that couldn't reach the server keeps the code, to try again
    const c = played(device(server))
    await makeLinkCode(c.saves, c.cloud)
    const cOffline = { ...c.cloud, online: () => false }
    expect(await deleteLinkCode(c.saves, cOffline)).toEqual({ ok: false, message: CLOUD_WORDS.offline })
    expect(linkCodeHere(c.saves, c.cloud)).not.toBeNull()
  })

  it('cloudAddress: the build\'s setting, else this PC / the Wi-Fi on port 1998, else no cloud', () => {
    expect(cloudAddress('goops-saves.joebrogno.workers.dev')).toBe('https://goops-saves.joebrogno.workers.dev')
    expect(cloudAddress('http://localhost:4999/')).toBe('http://localhost:4999')
    expect(cloudAddress(undefined, { protocol: 'http:', hostname: 'localhost' })).toBe('http://localhost:1998')
    expect(cloudAddress('', { protocol: 'http:', hostname: '192.168.1.20' })).toBe('http://192.168.1.20:1998')
    expect(cloudAddress(undefined, { protocol: 'https:', hostname: 'thebluemuzzy.github.io' })).toBeNull()
    expect(cloudAddress(undefined, null)).toBeNull()
  })

  it('no cloud in this build → a plain message, never a crash', async () => {
    const server = fakeServer()
    const a = played(device(server, { url: null }))
    expect(await makeLinkCode(a.saves, a.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.offline })
    // and nothing saved yet → nothing to send
    const fresh = device(server)
    expect(await makeLinkCode(fresh.saves, fresh.cloud)).toEqual({ ok: false, message: CLOUD_WORDS.nothingYet })
    expect(server.rows.saves.size).toBe(0)
  })
})
