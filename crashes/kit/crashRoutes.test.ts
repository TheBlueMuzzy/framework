// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_CRASHES_CONFIG, type ServerConfig } from './config'
import {
  addressKey, AddressLimiter, compareVersions, handleCrashes, MAX_ADDRESSES, readReport, refuseHugeBody, tidyCrashes, utcDay,
  type CrashContext,
} from './crashRoutes'
import { MAX_REPORT_BYTES, type CrashReport } from './report'
import { testStore } from '../tests/testStore'

const NOW = Date.UTC(2026, 9, 22, 12, 0, 0)
const HOUR = 3_600_000
const DAY = 24 * HOUR
const TOKEN = 'k9X2-very-secret-token-for-tests-only'
const FP = 'a1b2c3d4e5f60718'

const report = (more: Partial<CrashReport> & Record<string, unknown> = {}): CrashReport => ({
  v: 1, kind: 'error', fp: FP, title: "TypeError: Cannot read properties of undefined (reading 'x')",
  frames: [{ file: 'assets/index-Bx12.js', line: 1, col: 48211, fn: 'tick' }],
  version: '0.3.1.12', platform: 'web', browser: 'Chrome 141', os: 'Android 15', screen: '390x844@3', gpu: 'Adreno (TM) 740',
  lang: 'en', secs: 314, moments: [{ at: -4.2, name: 'roundStart', n: [3] }], repeats: 0, ...more,
})
/** A made-up fingerprint number i. */
const fpOf = (i: number) => i.toString(16).padStart(16, '0')

function server(settings: Partial<ServerConfig> = {}, extra: Partial<CrashContext> = {}) {
  const store = testStore()
  const context: CrashContext = {
    rows: store.rows, settings: { ...DEFAULT_CRASHES_CONFIG.server, ...settings }, limiter: new AddressLimiter(),
    address: '203.0.113.7', token: TOKEN, now: NOW, ...extra,
  }
  const send = (body: unknown, more: Partial<CrashContext> = {}, headers: Record<string, string> = {}) => {
    const text = typeof body === 'string' ? body : JSON.stringify(body)
    const request = new Request('https://goops-crashes.example/report', {
      method: 'POST', body: text, headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Content-Length': String(new TextEncoder().encode(text).length), ...headers },
    })
    return handleCrashes(request, { ...context, ...more })
  }
  const ask = async (path: string, init: { method?: string; token?: string | null; body?: unknown; address?: string; now?: number } = {}) => {
    const headers: Record<string, string> = {}
    const token = init.token === undefined ? TOKEN : init.token
    if (token !== null) headers.Authorization = `Bearer ${token}`
    const request = new Request(`https://goops-crashes.example${path}`, {
      method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
    const response = await handleCrashes(request, { ...context, ...(init.address ? { address: init.address } : {}), ...(init.now ? { now: init.now } : {}) })
    const text = await response.text()
    let json: unknown = null
    try { json = JSON.parse(text) } catch { /* not JSON */ }
    return { status: response.status, text, json: json as Record<string, unknown> & { kinds: Record<string, unknown>[] }, headers: response.headers }
  }
  return { ...store, context, send, ask }
}

describe('POST /report', () => {
  it('a good report → 204 with open CORS, one kind, one sample, the day counted', async () => {
    const s = server()
    const response = await s.send(report())
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(s.all('kinds')).toHaveLength(1)
    expect(s.all('samples')).toHaveLength(1)
    expect(s.rows.day(utcDay(NOW))).toEqual({ reports: 1, dropped: 0, newKinds: 1 })
    expect(JSON.parse(String(s.all('samples')[0].report))).toEqual(report())
  })

  it('costs 3 rows changed (day, kind, sample; Cloudflare also bills the sample\'s index entry: ~4) — 2 once a kind\'s samples are full today', async () => {
    const s = server({ samplesPerKindPerDay: 1 })
    await s.send(report())
    expect(s.counts.written).toBe(3) // what node:sqlite reports as changed rows: day + kind + sample (Cloudflare also bills the index entry: ~4)
    s.counts.written = 0
    await s.send(report())
    expect(s.counts.written).toBe(2) // day + kind: counted, not stored
  })

  it('a preflight (a game sending application/json) is answered; GET /report is a 404', async () => {
    const s = server()
    const preflight = await handleCrashes(new Request('https://x/report', { method: 'OPTIONS' }), s.context)
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    expect((await s.ask('/report', { token: null })).status).toBe(404)
  })

  it('repeats add to the count: count += 1 + repeats, in the version\'s count too', async () => {
    const s = server()
    await s.send(report())
    await s.send(report({ repeats: 4 }))
    const kind = s.rows.kind(FP)!
    expect(kind.count).toBe(6)
    expect(kind.versions).toEqual([{ v: '0.3.1.12', n: 6 }])
  })

  it('1,000 reports from one address → only perAddressPerHour stored, the rest dropped with NO row writes', async () => {
    const s = server()
    for (let i = 0; i < 30; i++) await s.send(report())
    s.counts.written = 0
    s.counts.statements = 0
    const answers = await Promise.all(Array.from({ length: 970 }, () => s.send(report())))
    expect(answers.every((a) => a.status === 204)).toBe(true) // the sender can't tell
    expect(s.counts.written).toBe(0)
    expect(s.counts.statements).toBe(0) // not even a read
    expect(s.rows.kind(FP)!.count).toBe(30)
    // the next hour it's welcome again
    await s.send(report(), { now: NOW + HOUR })
    expect(s.rows.kind(FP)!.count).toBe(31)
  })

  it('…sent all at once, the limit still holds (check and count are one step)', async () => {
    const s = server()
    await Promise.all(Array.from({ length: 200 }, () => s.send(report())))
    expect(s.rows.kind(FP)!.count).toBe(DEFAULT_CRASHES_CONFIG.server.perAddressPerHour)
  })

  it('IPv6 addresses in the same /64 share one limit; another /64 has its own', async () => {
    const s = server({ perAddressPerHour: 5 })
    for (let i = 0; i < 20; i++) await s.send(report(), { address: `2001:db8:aa:bb::${(i + 1).toString(16)}` })
    expect(s.rows.kind(FP)!.count).toBe(5)
    await s.send(report(), { address: '2001:db8:aa:cc::1' })
    expect(s.rows.kind(FP)!.count).toBe(6)
    expect(addressKey('2001:DB8:AA:BB:1:2:3:4')).toBe('2001:db8:aa:bb::/64')
  })

  it('the address, and its salted hash, are never in what\'s written', async () => {
    const s = server()
    const hash = await s.context.limiter.hash('203.0.113.7')
    await s.send(report())
    const everything = JSON.stringify([s.all('kinds'), s.all('samples'), s.all('days')])
    expect(everything).not.toContain('203.0.113')
    expect(everything).not.toContain(hash)
    expect(everything).not.toContain(hash.slice(0, 8))
  })

  it('the salt is random per server: the same address hashes differently in another one', async () => {
    expect(await new AddressLimiter().hash('203.0.113.7')).not.toBe(await new AddressLimiter().hash('203.0.113.7'))
  })

  it('memory holds at most MAX_ADDRESSES addresses an hour; a new one past that is dropped, nothing written', async () => {
    const limiter = new AddressLimiter()
    for (let i = 0; i < MAX_ADDRESSES; i++) limiter.count(`h${i}`, 'sent', 30, NOW)
    expect(limiter.count('one-more', 'sent', 30, NOW)).toBe(true)
    expect(limiter.size).toBe(MAX_ADDRESSES)
    expect(limiter.count('one-more', 'sent', 30, NOW + HOUR)).toBe(false) // a new hour starts empty
    expect(limiter.size).toBe(1)
  })

  it('the daily cap reached → no new samples or kinds, only `dropped` goes up (1 row); the next UTC day works again', async () => {
    const s = server({ perDay: 100, perAddressPerHour: 1000 })
    for (let i = 0; i < 100; i++) await s.send(report(), { address: `198.51.100.${i % 250}` })
    const samples = s.all('samples').length
    s.counts.written = 0
    await s.send(report({ fp: fpOf(7) }), { address: '192.0.2.1' })
    expect(s.counts.written).toBe(1)
    expect(s.rows.kind(fpOf(7))).toBeNull()
    expect(s.all('samples')).toHaveLength(samples)
    expect(s.rows.day(utcDay(NOW))).toEqual({ reports: 100, dropped: 1, newKinds: 1 })
    const tomorrow = Date.UTC(2026, 9, 23, 0, 0, 1)
    await s.send(report({ fp: fpOf(7) }), { address: '192.0.2.1', now: tomorrow })
    expect(s.rows.kind(fpOf(7))).not.toBeNull()
  })

  it('300 made-up fingerprints → only newKindsPerDay new kinds; the rest dropped', async () => {
    const s = server({ perAddressPerHour: 1000 })
    for (let i = 0; i < 300; i++) await s.send(report({ fp: fpOf(i + 1) }))
    expect(s.all('kinds')).toHaveLength(200)
    expect(s.rows.day(utcDay(NOW))).toEqual({ reports: 200, dropped: 100, newKinds: 200 })
    // a kind already known still counts
    await s.send(report({ fp: fpOf(1) }))
    expect(s.rows.kind(fpOf(1))!.count).toBe(2)
  })

  it('the 21st sample of a kind in a day is counted, not stored; tomorrow it stores again', async () => {
    const s = server({ perAddressPerHour: 1000 })
    for (let i = 0; i < 21; i++) await s.send(report())
    expect(s.rows.kind(FP)!.count).toBe(21)
    expect(s.all('samples')).toHaveLength(20)
    await s.send(report(), { now: NOW + DAY })
    expect(s.all('samples')).toHaveLength(21)
  })

  it('past samplesPerKind in all, the oldest goes (the newest replace it)', async () => {
    const s = server({ samplesPerKind: 3, perAddressPerHour: 1000 })
    for (let i = 0; i < 5; i++) await s.send(report({ secs: i }), { now: NOW + i * DAY })
    const kept = s.all('samples').map((r) => JSON.parse(String(r.report)).secs)
    expect(kept.sort()).toEqual([2, 3, 4])
    expect(s.rows.kind(FP)!.kept).toBe(3)
  })

  it('past the storage limit, reports are still counted but no sample is stored', async () => {
    const s = server({}, { maxStoredBytes: 0 })
    await s.send(report())
    expect(s.rows.kind(FP)!.count).toBe(1)
    expect(s.all('samples')).toHaveLength(0)
  })

  it('too big by Content-Length → 413 before reading; a body that lies about its size → 413 while reading', async () => {
    const s = server()
    const big = JSON.stringify(report({ title: 'x'.repeat(MAX_REPORT_BYTES) }))
    expect((await s.send(big)).status).toBe(413)
    let pulled = 0
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) { pulled += 1; controller.enqueue(new Uint8Array(1024).fill(32)); if (pulled > 10_000) controller.close() },
    })
    const liar = new Request('https://x/report', { method: 'POST', body: endless, headers: { 'Content-Length': '100' }, duplex: 'half' } as RequestInit)
    expect((await handleCrashes(liar, s.context)).status).toBe(413)
    expect(pulled).toBeLessThan(20) // gave up right after 8 KB
    expect(s.all('kinds')).toHaveLength(0)
  })

  it('the worker\'s front door: no Content-Length, a non-number, or over 8 KB → 413', () => {
    expect(refuseHugeBody(new Request('https://x/report', { method: 'POST' }), MAX_REPORT_BYTES)?.status).toBe(413)
    expect(refuseHugeBody(new Request('https://x/report', { method: 'POST', headers: { 'Content-Length': 'abc' } }), MAX_REPORT_BYTES)?.status).toBe(413)
    expect(refuseHugeBody(new Request('https://x/report', { method: 'POST', headers: { 'Content-Length': '9000' } }), MAX_REPORT_BYTES)?.status).toBe(413)
    expect(refuseHugeBody(new Request('https://x/report', { method: 'POST', headers: { 'Content-Length': '900' } }), MAX_REPORT_BYTES)).toBeNull()
    expect(refuseHugeBody(new Request('https://x/summary'), MAX_REPORT_BYTES)).toBeNull()
  })
})

describe('every field of a report wrong in turn → 400, never stored', () => {
  const wrong: [string, Record<string, unknown>][] = [
    ['not JSON', { raw: '{not json' }],
    ['an array', { raw: '[1,2]' }],
    ['another format', { v: 2 }],
    ['a kind that isn\'t one', { kind: 'virus' }],
    ['a fingerprint with capitals', { fp: 'A1B2C3D4E5F60718' }],
    ['a fingerprint too short', { fp: 'a1b2' }],
    ['a 201-character title', { title: 'x'.repeat(201) }],
    ['an empty title', { title: '' }],
    ['a title with a terminal colour code', { title: 'oops \u001b[31mred' }],
    ['a moment named "Bob says hi"', { moments: [{ at: -1, name: 'Bob says hi' }] }],
    ['a moment with 5 numbers', { moments: [{ at: -1, name: 'tick', n: [1, 2, 3, 4, 5] }] }],
    ['a moment number NaN (as null in JSON)', { moments: [{ at: -1, name: 'tick', n: [null] }] }],
    ['a moment in the future', { moments: [{ at: 5, name: 'tick' }] }],
    ['31 moments', { moments: Array.from({ length: 31 }, () => ({ at: -1, name: 'tick' })) }],
    ['secs Infinity (1e999)', { raw: JSON.stringify(report()).replace('"secs":314', '"secs":1e999') }],
    ['secs negative', { secs: -1 }],
    ['50 frames', { frames: Array.from({ length: 50 }, () => ({ file: 'a.js', line: 1, col: 1 })) }],
    ['a frame file with "?token="', { frames: [{ file: 'assets/index.js?token=abc', line: 1, col: 1 }] }],
    ['a frame file that is a full URL', { frames: [{ file: 'https://evil.example/x.js', line: 1, col: 1 }] }],
    ['a frame file that climbs out ("../")', { frames: [{ file: '../../etc/passwd', line: 1, col: 1 }] }],
    ['a frame line that is a fraction', { frames: [{ file: 'a.js', line: 1.5, col: 1 }] }],
    ['a frame fn of 500 characters', { frames: [{ file: 'a.js', line: 1, col: 1, fn: 'f'.repeat(500) }] }],
    ['a negative repeats', { repeats: -3 }],
    ['repeats as text', { repeats: '5' }],
    ['a version that isn\'t numbers', { version: '0.3.1-beta; drop table' }],
    ['a platform that isn\'t one', { platform: 'toaster' }],
    ['a browser with the whole user-agent text', { browser: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko)' }],
    ['a screen that is a sentence', { screen: 'my big screen' }],
    ['a region in the language', { lang: 'en-GB' }],
    ['a missing field (gpu)', { gpu: undefined }],
  ]
  for (const [name, change] of wrong) {
    it(name, async () => {
      const s = server()
      const body = 'raw' in change ? String(change.raw) : JSON.stringify({ ...report(), ...change })
      expect((await s.send(body)).status).toBe(400)
      expect(s.all('kinds')).toHaveLength(0)
      expect(s.all('samples')).toHaveLength(0)
    })
  }

  it('a 10,000-character title is over the 8 KB a report may be → 413, nothing stored', async () => {
    const s = server()
    expect((await s.send({ ...report(), title: 'x'.repeat(10_000) })).status).toBe(413)
    expect(s.all('kinds')).toHaveLength(0)
  })

  it('extra unknown fields — at the top, in a frame, in a moment — are NOT stored (the report is re-built)', async () => {
    const s = server()
    const sent = {
      ...report(), name: 'Ada Lovelace', ip: '203.0.113.7',
      frames: [{ file: 'assets/a.js', line: 1, col: 2, fn: 'go', url: 'https://x/?token=1' }],
      moments: [{ at: -1, name: 'tick', chat: 'hello', n: [1] }],
    }
    expect((await s.send(sent)).status).toBe(204)
    const stored = String(s.all('samples')[0].report)
    for (const leak of ['Ada', 'ip', '203.0.113.7', 'token', 'chat', 'hello']) expect(stored).not.toContain(leak)
    expect(JSON.parse(stored)).toEqual(report({ frames: [{ file: 'assets/a.js', line: 1, col: 2, fn: 'go' }], moments: [{ at: -1, name: 'tick', n: [1] }] }))
  })

  it('readReport keeps an fn-less frame and an n-less moment as they are', () => {
    const r = report({ frames: [{ file: 'a.js', line: 0, col: 0 }], moments: [{ at: 0, name: 'start' }], screen: '', lang: '', gpu: '' })
    expect(readReport(JSON.parse(JSON.stringify(r)))).toEqual(r)
  })
})

describe('the token routes', () => {
  it('the right token reads the summary; wrong, missing or in the address → 404, like an unknown address', async () => {
    const s = server()
    await s.send(report())
    expect((await s.ask('/summary')).status).toBe(200)
    const unknown = await s.ask('/nothing-here', { token: null })
    for (const wrong of [await s.ask('/summary', { token: 'guess' }), await s.ask('/summary', { token: null }), await s.ask(`/summary?token=${TOKEN}`, { token: null })]) {
      expect(wrong.status).toBe(404)
      expect(wrong.text).toBe(unknown.text)
    }
    expect((await s.ask(`/kinds/${FP}`, { token: 'guess' })).status).toBe(404)
    expect((await s.ask(`/kinds/${FP}/fixed`, { method: 'POST', token: 'guess', body: { version: '1.0.0' } })).status).toBe(404)
    expect(s.rows.kind(FP)!.status).toBe('open')
  })

  it('a server with no token set is closed, not open (an empty token never matches)', async () => {
    const s = server({}, { token: '' })
    expect((await s.ask('/summary', { token: '' })).status).toBe(404)
    const t = server({}, { token: undefined })
    expect((await t.ask('/summary', { token: 'anything' })).status).toBe(404)
  })

  it('100 wrong tries → that address is limited (even the right token gets 404 for the hour); others aren\'t', async () => {
    const s = server()
    for (let i = 0; i < 100; i++) await s.ask('/summary', { token: `guess-${i}` })
    expect((await s.ask('/summary')).status).toBe(404)
    expect((await s.ask('/summary', { address: '192.0.2.50' })).status).toBe(200)
    expect((await s.ask('/summary', { now: NOW + HOUR })).status).toBe(200)
  })

  it('wrong tokens count toward the address\'s report limit too', async () => {
    const s = server({ perAddressPerHour: 5 })
    for (let i = 0; i < 5; i++) await s.ask('/summary', { token: 'guess' })
    await s.send(report())
    expect(s.rows.kind(FP)).toBeNull()
  })

  it('…but a home\'s own crash reports never lock its owner out of the summary', async () => {
    const s = server({ perAddressPerHour: 5 })
    for (let i = 0; i < 50; i++) await s.send(report())
    expect((await s.ask('/summary')).status).toBe(200)
  })

  it('the token never appears in any answer', async () => {
    const s = server()
    await s.send(report())
    const answers = [await s.ask('/summary'), await s.ask(`/kinds/${FP}`), await s.ask(`/kinds/${FP}/fixed`, { method: 'POST', body: { version: '0.3.2' } }),
      await s.ask('/summary', { token: 'wrong' }), await s.ask('/health')]
    for (const a of answers) {
      expect(a.text).not.toContain(TOKEN)
      expect([...a.headers.values()].join(' ')).not.toContain(TOKEN)
    }
  })

  it('token routes get no CORS headers (a web page can never read them)', async () => {
    const s = server()
    const a = await s.ask('/summary')
    expect(a.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect((await s.ask('/summary', { method: 'OPTIONS', token: null })).status).toBe(404)
  })

  it('GET /health → ok, no token needed', async () => {
    const s = server()
    expect((await s.ask('/health', { token: null })).json).toEqual({ ok: true })
  })
})

describe('GET /summary', () => {
  it('lists kinds newest first with counts, and the server\'s clock', async () => {
    const s = server()
    await s.send(report({ fp: fpOf(1) }), { now: NOW - 2 * HOUR })
    await s.send(report({ fp: fpOf(2) }), { now: NOW - HOUR })
    const { json } = await s.ask('/summary')
    expect(json.now).toBe(NOW)
    expect(json.newKinds).toBe(2)
    expect(json.cameBack).toBe(0)
    expect(json.reports).toBe(2)
    expect(json.dropped).toBe(0)
    expect(json.kinds.map((k) => k.fp)).toEqual([fpOf(2), fpOf(1)])
    expect(json.kinds[0]).toMatchObject({ kind: 'error', count: 1, versions: [{ v: '0.3.1.12', n: 1 }], status: 'open', fixedIn: null, samples: 1 })
  })

  it('since: only what happened after it; an old one = everything kept; one in the future = nothing; not a number → 400', async () => {
    const s = server()
    await s.send(report({ fp: fpOf(1) }), { now: NOW - 3 * HOUR })
    await s.send(report({ fp: fpOf(2) }), { now: NOW - HOUR })
    const recent = (await s.ask(`/summary?since=${NOW - 2 * HOUR}`)).json
    expect(recent.kinds.map((k) => k.fp)).toEqual([fpOf(2)])
    expect(recent.newKinds).toBe(1)
    expect((await s.ask('/summary?since=0')).json.kinds).toHaveLength(2)
    expect((await s.ask('/summary?since=')).json.kinds).toHaveLength(2)
    const future = (await s.ask(`/summary?since=${NOW + DAY}`)).json
    expect(future.kinds).toEqual([])
    expect(future.newKinds).toBe(0)
    for (const bad of ['yesterday', '-5', '1e9', '12.5', '9'.repeat(20)]) expect((await s.ask(`/summary?since=${bad}`)).status).toBe(400)
  })

  it('lists at most 50 kinds', async () => {
    const s = server({ perAddressPerHour: 1000 })
    for (let i = 0; i < 60; i++) await s.send(report({ fp: fpOf(i + 1) }), { now: NOW - 1000 + i })
    const { json } = await s.ask('/summary')
    expect(json.kinds).toHaveLength(50)
    expect(json.newKinds).toBe(60)
  })
})

describe('GET /kinds/<fp>', () => {
  it('the kind and its samples, newest first, as they were stored', async () => {
    const s = server()
    await s.send(report({ secs: 1 }), { now: NOW - 10 })
    await s.send(report({ secs: 2 }))
    const { status, json } = await s.ask(`/kinds/${FP}?samples=1`)
    expect(status).toBe(200)
    expect((json.kind as Record<string, unknown>).fp).toBe(FP)
    const samples = json.samples as { at: number; report: CrashReport }[]
    expect(samples).toHaveLength(1)
    expect(samples[0]).toEqual({ at: NOW, report: report({ secs: 2 }) })
    expect(((await s.ask(`/kinds/${FP}`)).json.samples as unknown[])).toHaveLength(2)
  })

  it('an unknown fingerprint → 404 no-such-kind (only with the token); a fingerprint that isn\'t one → plain 404', async () => {
    const s = server()
    expect((await s.ask(`/kinds/${fpOf(9)}`)).json).toEqual({ ok: false, code: 'no-such-kind' })
    expect((await s.ask('/kinds/not-a-fingerprint')).status).toBe(404)
    expect((await s.ask('/kinds/not-a-fingerprint')).text).toBe('Not found')
  })
})

describe('fixed, and coming back', () => {
  async function fixedIn(version: string) {
    const s = server({ perAddressPerHour: 1000 })
    await s.send(report({ version: '0.3.1.5' }))
    const marked = await s.ask(`/kinds/${FP}/fixed`, { method: 'POST', body: { version } })
    expect(marked.json).toMatchObject({ ok: true, kind: { status: 'fixed', fixedIn: version } })
    return s
  }

  it('fixed in 0.3.2, a report from 0.3.1 → counted, still fixed', async () => {
    const s = await fixedIn('0.3.2')
    await s.send(report({ version: '0.3.1.12' }), { now: NOW + 1 })
    expect(s.rows.kind(FP)).toMatchObject({ status: 'fixed', count: 2, cameBackAt: null })
  })

  for (const version of ['0.3.2', '0.3.2.0', '0.3.2.7', '0.4.0']) {
    it(`fixed in 0.3.2, a report from ${version} → came back`, async () => {
      const s = await fixedIn('0.3.2')
      await s.send(report({ version }), { now: NOW + 1 })
      expect(s.rows.kind(FP)).toMatchObject({ status: 'open', cameBackAt: NOW + 1 })
      const summary = (await s.ask('/summary', { now: NOW + 2 })).json
      expect(summary.cameBack).toBe(1)
    })
  }

  it('versions compare as numbers: 0.10.0 > 0.9.0; a missing part is 0', () => {
    expect(compareVersions('0.10.0', '0.9.0')).toBeGreaterThan(0)
    expect(compareVersions('0.9.0', '0.10.0')).toBeLessThan(0)
    expect(compareVersions('0.3.2', '0.3.2.0')).toBe(0)
    expect(compareVersions('1.0', '0.99.99.99')).toBeGreaterThan(0)
  })

  it('fixed needs a version; an unknown kind → 404', async () => {
    const s = await fixedIn('0.3.2')
    expect((await s.ask(`/kinds/${FP}/fixed`, { method: 'POST', body: { version: 'soon' } })).status).toBe(400)
    expect((await s.ask(`/kinds/${FP}/fixed`, { method: 'POST', body: {} })).status).toBe(400)
    expect((await s.ask(`/kinds/${fpOf(3)}/fixed`, { method: 'POST', body: { version: '1.0.0' } })).status).toBe(404)
  })

  it('a kind keeps its last 10 versions, newest last', async () => {
    const s = server({ perAddressPerHour: 1000 })
    for (let i = 0; i < 12; i++) await s.send(report({ version: `0.${i}.0` }))
    const versions = s.rows.kind(FP)!.versions.map((v) => v.v)
    expect(versions).toHaveLength(10)
    expect(versions[0]).toBe('0.2.0')
    expect(versions[9]).toBe('0.11.0')
  })
})

describe('the daily tidy-up (the alarm)', () => {
  it('deletes exactly what\'s past keepDays and nothing newer', async () => {
    const s = server({ keepDays: 90, perAddressPerHour: 1000 })
    const old = NOW - 91 * DAY
    const edge = NOW - 90 * DAY + 1000 // just inside
    await s.send(report({ fp: fpOf(1) }), { now: old })                       // a kind not seen since: goes, samples too
    await s.send(report({ fp: fpOf(2) }), { now: old })                       // a kind with an old sample…
    await s.send(report({ fp: fpOf(2) }), { now: edge })                      // …and a newer one: kind stays, old sample goes
    await s.send(report({ fp: fpOf(3) }), { now: NOW - DAY })                 // recent: all stays
    tidyCrashes(s.rows, s.context.settings, NOW)
    expect(s.all('kinds').map((k) => k.fp).sort()).toEqual([fpOf(2), fpOf(3)])
    expect(s.all('samples').map((r) => Number(r.at)).sort()).toEqual([edge, NOW - DAY])
    expect(s.rows.kind(fpOf(2))!.kept).toBe(1) // counted again after the delete
    expect(s.all('days').map((d) => d.day).sort()).toEqual([utcDay(edge), utcDay(NOW - DAY)])
    expect(s.rows.anything()).toBe(true)
    tidyCrashes(s.rows, s.context.settings, NOW + 100 * DAY)
    expect(s.rows.anything()).toBe(false)
  })
})
