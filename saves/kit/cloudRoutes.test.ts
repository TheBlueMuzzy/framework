import { describe, expect, it } from 'vitest'
import {
  addressKey, handleCloud, LINK_ALPHABET, MAX_BODY_CHARS, memoryCloudRows, newLinkCode, readJson, readLinkCode, refuseHugeBody, scramble, SERVER_WRONG_PER_HOUR,
  showLinkCode, type CloudContext,
} from './cloudRoutes'
import { DEFAULT_SAVES_CONFIG } from './config'
import { MAX_CODE_CHARS } from './saveCode'

const CODE = 'GOOPS-1z-q1YqKS1OLUpVslIqLkksKS1SsgYA'
const NOW = Date.UTC(2026, 9, 20, 12, 0, 0)
const HOUR = 3_600_000
const DAY = 24 * HOUR

function setup(extra: Partial<CloudContext> = {}) {
  const rows = memoryCloudRows()
  let n = 0
  const context: CloudContext = {
    rows, settings: DEFAULT_SAVES_CONFIG.cloud, address: '203.0.113.7', now: NOW,
    newLink: () => ['K7QM2XRP', 'ABCD2345', 'HJKL6789'][n++ % 3], ...extra,
  }
  const call = async (path: string, body?: unknown, more: Partial<CloudContext> = {}) => {
    const request = new Request(`https://goops-saves.example${path}`, body === undefined ? { method: 'GET' } : { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })
    const response = await handleCloud(request, { ...context, ...more })
    return { status: response.status, body: await response.json().catch(() => null), headers: response.headers }
  }
  return { rows, call }
}

describe('link codes', () => {
  it('are 8 characters with no O/0 or I/1, shown as XXXX-XXXX, and typing is forgiving', () => {
    for (const c of 'OI01') expect(LINK_ALPHABET).not.toContain(c)
    expect(LINK_ALPHABET).toHaveLength(32)
    const link = newLinkCode()
    expect(link).toMatch(new RegExp(`^[${LINK_ALPHABET}]{8}$`))
    expect(showLinkCode('K7QM2XRP')).toBe('K7QM-2XRP')
    expect(readLinkCode(' k7qm-2xrp ')).toBe('K7QM2XRP')
    expect(readLinkCode('K7QM 2XRP')).toBe('K7QM2XRP')
    expect(readLinkCode('K7QM-2XR')).toBeNull()      // too short
    expect(readLinkCode('K7QM-2XR0')).toBeNull()     // 0 is never in a code
    expect(readLinkCode('')).toBeNull()
  })

  it('addresses are kept only scrambled', async () => {
    const who = await scramble('203.0.113.7')
    expect(who).toMatch(/^[0-9a-f]{16}$/)
    expect(who).not.toContain('203')
    expect(await scramble('203.0.113.7')).toBe(who)
    expect(await scramble('203.0.113.8')).not.toBe(who)
  })

  it('…with the worker\'s own secret, so the hashes can\'t be undone by trying every address (review F96)', async () => {
    expect(await scramble('203.0.113.7', 'secret-a')).not.toBe(await scramble('203.0.113.7', 'secret-b'))
    expect(await scramble('203.0.113.7', 'secret-a')).toBe(await scramble('203.0.113.7', 'secret-a'))
  })

  it('an IPv6 address counts by its first half (/64), however it\'s written (review F96)', () => {
    expect(addressKey('203.0.113.7')).toBe('203.0.113.7')
    expect(addressKey('2001:db8:aa:bb:1:2:3:4')).toBe('2001:db8:aa:bb::/64')
    expect(addressKey('2001:DB8:AA:BB::99')).toBe('2001:db8:aa:bb::/64')
    expect(addressKey('2001:0db8:00aa:00bb:ffff::')).toBe('2001:db8:aa:bb::/64')
    expect(addressKey('2001:db8::1')).toBe('2001:db8:0:0::/64')
  })
})

describe('the guess limits hold under pressure (review F96)', () => {
  it('30 wrong guesses sent all at once → no more than wrongTriesPerHour get through', async () => {
    const { call } = setup()
    const answers = await Promise.all(Array.from({ length: 30 }, () => call('/saves/get', { link: 'ZZZZ2222' })))
    expect(answers.filter((a) => a.status === 404)).toHaveLength(DEFAULT_SAVES_CONFIG.cloud.wrongTriesPerHour)
  })

  it('30 uploads sent all at once → no more than uploadsPerHour codes made', async () => {
    const { rows, call } = setup({ newLink: newLinkCode })
    await Promise.all(Array.from({ length: 30 }, () => call('/saves/link', { code: CODE })))
    expect(rows.saves.size).toBe(DEFAULT_SAVES_CONFIG.cloud.uploadsPerHour)
  })

  it('a fresh IPv6 address per guess from one home (/64) still hits the limit', async () => {
    const { call } = setup()
    const answers: number[] = []
    for (let i = 0; i < 15; i++) answers.push((await call('/saves/get', { link: 'ZZZZ2222' }, { address: `2001:db8:aa:bb::${i + 1}` })).status)
    expect(answers.filter((s) => s === 429).length).toBe(15 - DEFAULT_SAVES_CONFIG.cloud.wrongTriesPerHour)
  })

  it('many different addresses: the whole server stops taking wrong guesses after SERVER_WRONG_PER_HOUR', async () => {
    const { call } = setup()
    for (let i = 0; i < SERVER_WRONG_PER_HOUR; i++) await call('/saves/get', { link: 'ZZZZ2222' }, { address: `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}` })
    expect((await call('/saves/get', { link: 'ZZZZ2222' }, { address: '198.51.100.250' })).status).toBe(429)
  }, 30_000)
})

/** A body sent in pieces with no size (chunked): 64 KB at a time, up to `total` bytes. `pulled()` = how much was read. */
function endlessBody(total: number) {
  let sent = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= total) return controller.close()
      const piece = new Uint8Array(65_536).fill(0x61)
      sent += piece.byteLength
      controller.enqueue(piece)
    },
  })
  return { stream, pulled: () => sent }
}

describe('huge bodies never reach the shared store (security review, v0.11.0)', () => {
  it('a chunked 50 MB body with no Content-Length is given up after the cap, not read whole', async () => {
    const body = endlessBody(50_000_000)
    const request = new Request('https://goops-saves.example/saves/link', { method: 'POST', body: body.stream, duplex: 'half' } as RequestInit)
    expect(request.headers.get('Content-Length')).toBeNull()
    expect(await readJson(request, MAX_BODY_CHARS)).toBeNull()
    expect(body.pulled()).toBeLessThan(MAX_BODY_CHARS + 3 * 65_536) // a piece or two past the cap, never the 50 MB
  })

  it('…and through the route: refused as too-big', async () => {
    const body = endlessBody(50_000_000)
    const request = new Request('https://goops-saves.example/saves/link', { method: 'POST', body: body.stream, duplex: 'half' } as RequestInit)
    const response = await handleCloud(request, { rows: memoryCloudRows(), settings: DEFAULT_SAVES_CONFIG.cloud, address: '203.0.113.7', now: NOW })
    expect(response.status).toBe(413)
    expect(body.pulled()).toBeLessThan(MAX_BODY_CHARS + 3 * 65_536)
  })

  it('a body in pieces under the cap is read whole, as before', async () => {
    const text = JSON.stringify({ code: CODE })
    const pieces = [text.slice(0, 10), text.slice(10)].map((t) => new TextEncoder().encode(t))
    const stream = new ReadableStream<Uint8Array>({ start(c) { pieces.forEach((p) => c.enqueue(p)); c.close() } })
    const request = new Request('https://x/saves/link', { method: 'POST', body: stream, duplex: 'half' } as RequestInit)
    expect(await readJson(request, MAX_BODY_CHARS)).toEqual({ code: CODE })
  })

  it('the worker\'s front door: a POST with no Content-Length, a false one, or one over the cap → 413 before the store', () => {
    const post = (headers: Record<string, string>) => new Request('https://x/saves/link', { method: 'POST', headers })
    expect(refuseHugeBody(post({}), MAX_BODY_CHARS)?.status).toBe(413)                                    // chunked: no size
    expect(refuseHugeBody(post({ 'Content-Length': String(MAX_BODY_CHARS + 1) }), MAX_BODY_CHARS)?.status).toBe(413)
    expect(refuseHugeBody(post({ 'Content-Length': 'lots' }), MAX_BODY_CHARS)?.status).toBe(413)
    expect(refuseHugeBody(post({ 'Content-Length': '120' }), MAX_BODY_CHARS)).toBeNull()                // what the game sends
    expect(refuseHugeBody(new Request('https://x/health'), MAX_BODY_CHARS)).toBeNull()                     // a GET has no body
    // (a browser's fetch with a JSON string body always puts its size on the wire, so the game is never refused here)
  })
})

describe('the cloud routes', () => {
  it('upload → link code → get brings back the same save code (and leaves it there) → delete → gone', async () => {
    const { rows, call } = setup()
    const made = await call('/saves/link', { code: CODE })
    expect(made.status).toBe(200)
    expect(made.body).toEqual({ ok: true, link: 'K7QM2XRP', expiresAt: NOW + 7 * DAY })
    expect(made.headers.get('Access-Control-Allow-Origin')).toBe('*') // the game's page is on another site

    const got = await call('/saves/get', { link: 'k7qm-2xrp' })
    expect(got.body).toEqual({ ok: true, code: CODE, expiresAt: NOW + 7 * DAY })
    expect((await call('/saves/get', { link: 'K7QM2XRP' })).body.code).toBe(CODE) // still there for a third device

    expect((await call('/saves/delete', { link: 'K7QM-2XRP' })).body).toEqual({ ok: true })
    expect(rows.saves.size).toBe(0)
    const after = await call('/saves/get', { link: 'K7QM2XRP' })
    expect(after.status).toBe(404)
    expect(after.body).toEqual({ ok: false, code: 'not-found' })
  })

  it('an expired code answers exactly like a wrong one, and tidy() deletes it', async () => {
    const { rows, call } = setup()
    await call('/saves/link', { code: CODE })
    expect((await call('/saves/get', { link: 'K7QM2XRP' }, { now: NOW + 7 * DAY - 1 })).status).toBe(200)
    const late = await call('/saves/get', { link: 'K7QM2XRP' }, { now: NOW + 7 * DAY })
    expect(late).toMatchObject({ status: 404, body: { ok: false, code: 'not-found' } })
    expect(rows.tidy(NOW + 7 * DAY)).toBe(NOW + 7 * DAY + HOUR) // only the wrong try is left: it goes when its hour ends
    expect(rows.saves.size).toBe(0)
  })

  it('keepDays is the setting (and a test server can set milliseconds)', async () => {
    const { call } = setup()
    expect((await call('/saves/link', { code: CODE }, { settings: { ...DEFAULT_SAVES_CONFIG.cloud, keepDays: 2 } })).body.expiresAt).toBe(NOW + 2 * DAY)
    expect((await call('/saves/link', { code: CODE }, { keepMs: 5_000 })).body.expiresAt).toBe(NOW + 5_000)
  })

  it('wrong codes from one address: after wrongTriesPerHour every try is refused — even the right code — until the hour ends', async () => {
    const { call } = setup()
    await call('/saves/link', { code: CODE })
    const answers: number[] = []
    for (let i = 0; i < 20; i++) answers.push((await call('/saves/get', { link: 'ZZZZ2222' })).status)
    expect(answers.slice(0, 10)).toEqual(Array(10).fill(404))
    expect(answers.slice(10)).toEqual(Array(10).fill(429))
    expect((await call('/saves/get', { link: 'K7QM2XRP' })).body).toEqual({ ok: false, code: 'too-many-tries' })
    expect((await call('/saves/delete', { link: 'K7QM2XRP' })).status).toBe(429) // delete is guess-limited too
    // another address is not affected; the same address can try again next hour
    expect((await call('/saves/get', { link: 'K7QM2XRP' }, { address: '198.51.100.4' })).status).toBe(200)
    expect((await call('/saves/get', { link: 'K7QM2XRP' }, { now: NOW + HOUR })).status).toBe(200)
  })

  it('typing that can\'t be a link code is refused without counting as a guess', async () => {
    const { call } = setup()
    for (let i = 0; i < 15; i++) expect((await call('/saves/get', { link: 'hello' })).body.code).toBe('not-a-link')
    expect((await call('/saves/get', { link: 'ZZZZ2222' })).status).toBe(404) // still allowed to try
  })

  it('only carries save codes, size-capped; uploads per address per hour are limited', async () => {
    const { call } = setup({ newLink: newLinkCode })
    expect((await call('/saves/link', { code: 'my diary' })).body.code).toBe('not-a-save')
    expect((await call('/saves/link', 'not json')).body.code).toBe('too-big')
    const huge = await call('/saves/link', { code: `GOOPS-1z-${'a'.repeat(MAX_CODE_CHARS)}` })
    expect(huge).toMatchObject({ status: 413, body: { code: 'too-big' } })
    const answers: number[] = []
    for (let i = 0; i < 22; i++) answers.push((await call('/saves/link', { code: CODE })).status)
    expect(answers.filter((s) => s === 200)).toHaveLength(20)
    expect((await call('/saves/link', { code: CODE })).body.code).toBe('too-many-codes')
  })

  it('a full store refuses new codes; a taken link code picks another', async () => {
    const { rows, call } = setup()
    expect((await call('/saves/link', { code: CODE }, { maxStoredBytes: 10 })).body.code).toBe('server-full')
    rows.add('K7QM2XRP', CODE, NOW + DAY)
    expect((await call('/saves/link', { code: CODE })).body.link).toBe('ABCD2345')
  })

  it('health, CORS preflight, and unknown addresses', async () => {
    const { call } = setup()
    expect((await call('/health')).body).toEqual({ ok: true })
    const pre = await handleCloud(new Request('https://x/saves/link', { method: 'OPTIONS' }), { rows: memoryCloudRows(), settings: DEFAULT_SAVES_CONFIG.cloud, address: 'a' })
    expect(pre.status).toBe(204)
    expect((await call('/saves/list', {})).status).toBe(404)
    expect((await call('/saves/get')).status).toBe(404) // GET of a POST address
  })

  it('tidy(): old hours\' tries go, and the next due time is the soonest expiry or hour end', async () => {
    const { rows, call } = setup()
    await call('/saves/link', { code: CODE })
    await call('/saves/get', { link: 'ZZZZ2222' })
    const hourEnd = (Math.floor(NOW / HOUR) + 1) * HOUR
    expect(rows.tidy(NOW)).toBe(hourEnd)
    expect(rows.tidy(hourEnd)).toBe(NOW + 7 * DAY) // the tries are gone; the save is next
    expect(rows.tries.size).toBe(0)
  })
})
