// @vitest-environment jsdom
// The crash catcher on a pretend page: errors are dispatched as the browser would, and a pretend transport records
// what would have been sent. The awkward cases first (framework sprint 24 retro: list them up front).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { moment, momentsFromGame, reportError, setOn, startCrashes, stopCrashes, watchCanvas, fitInSize, type SendReport } from './capture'
import { DEFAULT_CRASHES_CONFIG, type ClientConfig } from './config'
import { applyCrashSetting, CRASH_SETTINGS_ROWS } from './settingsRow'
import { readReport } from './crashRoutes'
import { FINGERPRINT, MAX_FRAMES, MAX_REPORT_BYTES, MOMENT_NAME, REPORT_KINDS, type CrashReport } from './report'

const SITE = location.origin // jsdom's page address
const URL_ = 'https://goops-crashes.example.workers.dev'

interface Sent { address: string; report: CrashReport; body: string; leaving: boolean }
let sent: Sent[] = []

// A transport that records; `fail` makes it reject (offline) or throw.
let fail: 'no' | 'reject' | 'throw' = 'no'
const record: SendReport = (address, body, leaving) => {
  if (fail === 'throw') throw new Error('network gone')
  if (fail === 'reject') return Promise.reject(new TypeError('Failed to fetch'))
  sent.push({ address, body, report: JSON.parse(body), leaving })
  return Promise.resolve()
}

function start(client: Partial<ClientConfig> = {}, more: { dev?: boolean; version?: string; send?: SendReport; base?: string } = {}) {
  sent = []
  fail = 'no'
  return startCrashes({
    config: { ...DEFAULT_CRASHES_CONFIG, client: { ...DEFAULT_CRASHES_CONFIG.client, url: URL_, ...client } },
    version: more.version ?? '0.3.1.12', dev: more.dev ?? false, send: more.send ?? record, base: more.base,
  })
}

// The fingerprint is made with crypto.subtle, which answers a moment later
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

/** An error with a stack as Chrome writes it, from the game's own files. */
function gameError(message: string, file = 'assets/index-Bx12.js', line = 1, col = 48211, Kind = TypeError) {
  const e = new Kind(message)
  e.stack = `${Kind.name}: ${message}\n    at tick (${SITE}/${file}:${line}:${col})\n    at loop (${SITE}/${file}:${line}:${col + 100})`
  return e
}
const throwOnPage = (error: unknown, message = error instanceof Error ? error.message : String(error), filename = '') =>
  window.dispatchEvent(new ErrorEvent('error', { error, message, filename }))
function rejectOnPage(reason: unknown) {
  const event = new Event('unhandledrejection')
  Object.assign(event, { reason })
  window.dispatchEvent(event)
}
const hidePage = () => window.dispatchEvent(new Event('pagehide'))

afterEach(() => { stopCrashes(); vi.restoreAllMocks() })

describe('the awkward cases', () => {
  it('the same error 1,000 times in a frame loop → exactly 1 report, the repeats sent when the page hides', async () => {
    start()
    for (let i = 0; i < 1000; i++) throwOnPage(gameError('Cannot read properties of undefined'))
    await settle()
    expect(sent).toHaveLength(1)
    expect(sent[0].report.repeats).toBe(0)
    hidePage()
    expect(sent).toHaveLength(2)
    expect(sent[1].report.fp).toBe(sent[0].report.fp)
    expect(sent[1].leaving).toBe(true)
    // every report means 1 + repeats happenings: 1 + 0 + 1 + 998 = 1000
    expect(sent.reduce((n, s) => n + 1 + s.report.repeats, 0)).toBe(1000)
    hidePage() // nothing new happened → nothing more
    expect(sent).toHaveLength(2)
  })

  it('10 different errors → perSession (5) reports, the rest only counted', async () => {
    start()
    for (let i = 0; i < 10; i++) throwOnPage(gameError(`problem number ${'abcdefghij'[i]}`))
    await settle()
    expect(sent).toHaveLength(5)
    hidePage()
    expect(sent).toHaveLength(5) // the counted-only kinds have no report to carry their count
  })

  it('an error while sending → no new report, no loop', async () => {
    let calls = 0
    start({}, {
      send: () => {
        calls++
        throwOnPage(gameError('inside the transport')) // an error during sending…
        reportError(new Error('also inside'))
        throw new Error('and the send itself fails')
      },
    })
    throwOnPage(gameError('the real problem'))
    await settle()
    expect(calls).toBe(1)
    hidePage() // the held report is tried once more — and fails once more, quietly
    await settle()
    expect(calls).toBe(2)
    await settle()
    expect(calls).toBe(2) // nothing tries again by itself
  })

  it('a send that fails later (fetch rejects) is held, not reported, and not retried in a loop', async () => {
    const seen: unknown[] = []
    start({}, { send: (_address, b) => { seen.push(b); return Promise.reject(new TypeError('Failed to fetch')) } })
    const rejections = vi.fn()
    window.addEventListener('unhandledrejection', rejections)
    throwOnPage(gameError('one'))
    await settle()
    expect(seen).toHaveLength(1)
    await settle()
    expect(seen).toHaveLength(1)
    expect(rejections).not.toHaveBeenCalled()
    window.removeEventListener('unhandledrejection', rejections)
  })

  it('offline → up to 10 held, sent when the page hides; the 11th drops the oldest', async () => {
    start({ perSession: 20 })
    fail = 'reject'
    for (let i = 0; i < 12; i++) throwOnPage(gameError(`offline problem ${'abcdefghijkl'[i]}`))
    await settle()
    expect(sent).toHaveLength(0)
    fail = 'no'
    hidePage()
    expect(sent).toHaveLength(10)
    const titles = sent.map((s) => s.report.title)
    expect(titles).not.toContain('TypeError: offline problem a')
    expect(titles).not.toContain('TypeError: offline problem b')
    expect(titles).toContain('TypeError: offline problem l')
    expect(sent.every((s) => s.leaving)).toBe(true)
  })

  it('offline → sent when the connection comes back', async () => {
    start()
    fail = 'throw'
    throwOnPage(gameError('while offline'))
    await settle()
    fail = 'no'
    window.dispatchEvent(new Event('online'))
    expect(sent).toHaveLength(1)
    expect(sent[0].leaving).toBe(false)
  })

  it('setOn(false) after errors were queued → queue cleared, nothing sent; setOn(true) works again', async () => {
    start()
    fail = 'reject'
    throwOnPage(gameError('queued one'))
    await settle()
    fail = 'no'
    setOn(false)
    hidePage()
    throwOnPage(gameError('while off'))
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(sent).toHaveLength(0)
    setOn(true)
    hidePage()
    expect(sent).toHaveLength(0) // the queue really was thrown away
    throwOnPage(gameError('after switching back on'))
    await settle()
    expect(sent.map((s) => s.report.title)).toEqual(['TypeError: after switching back on'])
  })

  it('the Settings switch (applyCrashSetting): off → nothing; missing → on (the default)', async () => {
    start()
    applyCrashSetting({ crashReports: false })
    throwOnPage(gameError('with the switch off'))
    await settle()
    expect(sent).toHaveLength(0)
    applyCrashSetting({})
    throwOnPage(gameError('with the switch on'))
    await settle()
    expect(sent).toHaveLength(1)
    const toggle = CRASH_SETTINGS_ROWS.find((row) => row.type === 'toggle')
    expect(toggle).toMatchObject({ id: 'crashReports', label: 'Send crash reports', default: true })
  })

  it('url "" → nothing sent; a dev build → nothing sent unless sendInDev', async () => {
    start({ url: '' })
    throwOnPage(gameError('no server yet'))
    await settle()
    expect(sent).toHaveLength(0)

    start({}, { dev: true })
    throwOnPage(gameError('in dev'))
    await settle()
    expect(sent).toHaveLength(0)

    start({ sendInDev: true }, { dev: true })
    throwOnPage(gameError('in dev, asked for'))
    await settle()
    expect(sent).toHaveLength(1)
  })

  it("a player's name in a message → \"…\" in the title and the same fingerprint for every name", async () => {
    start()
    throwOnPage(gameError("Cannot find player 'Bob'"))
    throwOnPage(gameError('Cannot find player "Alice"'))
    await settle()
    expect(sent).toHaveLength(1) // the same kind
    expect(sent[0].report.title).toBe('TypeError: Cannot find player "…"')
    expect(sent[0].body).not.toContain('Bob')
  })

  it('a moment named "Bob says hi" is dropped; code names + up to 4 numbers are kept', async () => {
    start()
    moment('Bob says hi')
    moment('roundStart', 3, Number.NaN, 4, 5, 6, 7)
    moment('scored', 120)
    throwOnPage(gameError('after some moments'))
    await settle()
    const moments = sent[0].report.moments
    expect(moments.map((m) => m.name)).toEqual(['roundStart', 'scored'])
    expect(moments[0].n).toEqual([3, 4, 5, 6])
    expect(moments.every((m) => m.at <= 0)).toBe(true)
    expect(sent[0].body).not.toContain('Bob')
  })

  it('moments from the Dev Kit adapter: only a small-letter first word that is a code name', async () => {
    start()
    let send: (text: string) => void = () => {}
    const stopEvents = momentsFromGame((s) => { send = s; return () => {} })
    send('roundStart · 3 left')
    send('Bob joined the table')
    send('turn 12 · Blue moved')
    send('!!! weird')
    throwOnPage(gameError('after adapter events'))
    await settle()
    expect(sent[0].report.moments.map((m) => m.name)).toEqual(['roundStart', 'turn'])
    expect(typeof stopEvents).toBe('function')
  })

  it('two builds of the same error (index-Bx12.js vs index-Q9zz.js), other lines and columns → the same fingerprint', async () => {
    start()
    throwOnPage(gameError('x is not a function', 'assets/index-Bx12.js', 1, 48211))
    await settle()
    start()
    throwOnPage(gameError('x is not a function', 'assets/index-Q9zz.js', 7, 120))
    await settle()
    const first = sent[0].report
    start()
    throwOnPage(gameError('x is not a function', 'assets/index-Bx12.js', 1, 48211))
    await settle()
    expect(first.fp).toMatch(FINGERPRINT)
    expect(sent[0].report.fp).toBe(first.fp)
    expect(first.frames[0].file).toBe('assets/index-Q9zz.js') // the frames keep the real file, for the maps
  })

  it('a different error has a different fingerprint', async () => {
    start()
    throwOnPage(gameError('one thing'))
    throwOnPage(gameError('another thing'))
    await settle()
    expect(sent[0].report.fp).not.toBe(sent[1].report.fp)
  })

  it('a full URL with ?token=abc → only the path travels; other sites and extensions are left out', async () => {
    start()
    const e = new Error('mixed frames')
    e.stack = [
      'Error: mixed frames',
      `    at tick (${SITE}/assets/index-Bx12.js?token=abc#part:1:10)`,
      '    at track (https://ads.example.com/lib.js:1:1)',
      '    at hook (chrome-extension://abcdefgh/content.js:2:2)',
      `    at go (${SITE}/assets/vendor-Ab12.js:3:30)`,
    ].join('\n')
    throwOnPage(e)
    await settle()
    const { frames } = sent[0].report
    expect(frames.map((f) => f.file)).toEqual(['assets/index-Bx12.js', 'assets/vendor-Ab12.js'])
    expect(sent[0].body).not.toContain('token')
    expect(sent[0].body).not.toContain('ads.example.com')
    expect(sent[0].body).not.toContain('extension')
  })

  it('a game in a folder (GitHub Pages /GOOPS/alpha/) → paths inside the game, so the maps are found and moving it keeps the fingerprint', async () => {
    // (found by the scratch-Goops proof: frames said GOOPS/alpha/assets/…, the maps are filed as assets/…)
    start({}, { base: '/GOOPS/alpha/' })
    throwOnPage(gameError('Cannot read properties of undefined', 'GOOPS/alpha/assets/index-Bx12.js'))
    const img = document.createElement('img')
    img.src = `${SITE}/GOOPS/alpha/assets/hero-Bx12.png`
    document.body.append(img)
    img.dispatchEvent(new Event('error'))
    await settle()
    expect(sent[0].report.frames.map((f) => f.file)).toEqual(['assets/index-Bx12.js', 'assets/index-Bx12.js'])
    expect(sent[1].report.title).toBe("img didn't load: assets/hero-Bx12.png")
    const inFolder = sent[0].report.fp
    img.remove()
    stopCrashes()
    start({}, { base: '/GOOPS/' }) // the same bug once the game moved to its real address
    throwOnPage(gameError('Cannot read properties of undefined', 'GOOPS/assets/index-Cd34.js'))
    await settle()
    expect(sent[0].report.fp).toBe(inFolder)
  })

  it('eval-style frames ("<anonymous>:313:16", a console or test tool) are not the game\'s files', async () => {
    // (found by the scratch-Goops proof: Playwright's evaluate frames came through as "%3Canonymous%3E")
    start()
    const e = new Error('from eval')
    e.stack = `Error: from eval\n    at yk (${SITE}/assets/index-Bx12.js:2:10893)\n    at UtilityScript.evaluate (<anonymous>:313:16)\n    at <anonymous>:1:44\n    at eval (eval at run (${SITE}/assets/index-Bx12.js:1:5), <anonymous>:1:1)`
    throwOnPage(e)
    await settle()
    expect(sent[0].report.frames.map((f) => f.file)).toEqual(['assets/index-Bx12.js'])
    expect(sent[0].body).not.toContain('anonymous')
  })

  it('Firefox / Safari stacks are read too', async () => {
    start()
    const e = new Error('firefox')
    e.stack = `tick@${SITE}/assets/index-Bx12.js:1:99\n@${SITE}/assets/index-Bx12.js:2:5\n`
    throwOnPage(e)
    await settle()
    expect(sent[0].report.frames).toEqual([
      { file: 'assets/index-Bx12.js', line: 1, col: 99, fn: 'tick' },
      { file: 'assets/index-Bx12.js', line: 2, col: 5 },
    ])
  })

  it('an error whose every frame is in a browser extension → not reported', async () => {
    start()
    const e = new Error('from an extension')
    e.stack = 'Error: from an extension\n    at a (chrome-extension://abc/x.js:1:1)\n    at b (moz-extension://abc/y.js:2:2)'
    throwOnPage(e)
    await settle()
    expect(sent).toHaveLength(0)
  })

  it('noise is not reported: ResizeObserver loop, "Script error." with no file', async () => {
    start()
    throwOnPage(null, 'ResizeObserver loop completed with undelivered notifications.')
    throwOnPage(null, 'ResizeObserver loop limit exceeded')
    throwOnPage(null, 'Script error.')
    await settle()
    expect(sent).toHaveLength(0)
  })

  it('an error event with no stack uses its own file + line as the one frame', async () => {
    start()
    throwOnPage('thrown string', 'Uncaught thrown string', `${SITE}/assets/index-Bx12.js?v=2`)
    await settle()
    expect(sent[0].report.title).toBe('thrown string')
    expect(sent[0].report.frames).toEqual([{ file: 'assets/index-Bx12.js', line: 0, col: 0 }])
  })

  it('a huge stack and a long message → the body is at most MAX_REPORT_BYTES, at most 10 frames, title ≤ 200', async () => {
    start({ moments: 30 })
    for (let i = 0; i < 40; i++) moment('aVeryLongMomentNameThatIsTooLong'.slice(0, 32), 1.123456, 2.123456, 3.123456, 4.123456)
    const e = new Error('long '.repeat(5000))
    e.stack = `Error: long\n${Array.from({ length: 500 }, (_, i) => `    at ${'fn'.repeat(80)}${i} (${SITE}/assets/${'deep/'.repeat(30)}index-Bx12.js:${i}:${i})`).join('\n')}`
    throwOnPage(e)
    await settle()
    const { body, report } = sent[0]
    expect(new TextEncoder().encode(body).length).toBeLessThanOrEqual(MAX_REPORT_BYTES)
    expect(report.frames.length).toBeLessThanOrEqual(MAX_FRAMES)
    expect(report.title.length).toBeLessThanOrEqual(200)
    expect(report.moments).toHaveLength(30)
  })

  it('fitInSize cuts frames first, then the oldest moments', () => {
    const big: CrashReport = {
      v: 1, kind: 'error', fp: '0123456789abcdef', title: 'Error', version: '1.0.0.1', platform: 'web', browser: 'Chrome 141',
      os: 'Android 15', screen: '390x844@3', gpu: '', lang: 'en', secs: 1, repeats: 0,
      frames: Array.from({ length: 10 }, (_, i) => ({ file: `assets/${'x'.repeat(190)}.js`, line: i, col: i, fn: 'f'.repeat(100) })),
      moments: Array.from({ length: 30 }, (_, i) => ({ at: -i, name: `m${'o'.repeat(30)}`, n: [1.123456789, 2.123456789, 3.123456789, 4.123456789] })),
    }
    big.title = 'T'.repeat(200)
    big.gpu = 'G'.repeat(120)
    big.moments = [...big.moments, ...big.moments, ...big.moments] // more than the limit, to force the second step
    const fitted = JSON.parse(fitInSize(big)) as CrashReport
    expect(new TextEncoder().encode(fitInSize(big)).length).toBeLessThanOrEqual(MAX_REPORT_BYTES)
    expect(fitted.frames).toHaveLength(0)
    expect(fitted.moments.length).toBeGreaterThan(0)
    expect(fitted.moments.at(-1)).toEqual(big.moments.at(-1)) // the newest moments are the ones kept
  })

  it('a failed <img> load → kind "asset", the title names the file path only', async () => {
    start()
    const img = document.createElement('img')
    img.src = `${SITE}/assets/hero-Bx12.png?token=abc`
    document.body.append(img)
    img.dispatchEvent(new Event('error')) // doesn't bubble — only the capture phase sees it
    await settle()
    expect(sent[0].report.kind).toBe('asset')
    expect(sent[0].report.title).toBe("img didn't load: assets/hero-Bx12.png")
    expect(sent[0].body).not.toContain('token')
    expect(sent[0].body).not.toContain('localhost')
    img.remove()
  })

  // security review v0.11.2: another site's path can name a player (an avatar's /u/1234567) — only site + file type
  it('a failed file from another site → only the site and its file type, never its path', async () => {
    start()
    const audio = document.createElement('audio')
    audio.src = 'https://cdn.example.com/sfx/level-2.mp3?sig=xyz'
    document.body.append(audio)
    audio.dispatchEvent(new Event('error'))
    const img = document.createElement('img')
    img.src = 'https://avatars.example.com/u/1234567'
    document.body.append(img)
    img.dispatchEvent(new Event('error'))
    await settle()
    expect(sent[0].report.title).toBe("audio didn't load: cdn.example.com/….mp3")
    expect(sent[1].report.title).toBe("img didn't load: avatars.example.com/…")
    expect(sent[1].body).not.toContain('1234567')
    expect(sent.every((s) => readReport(JSON.parse(s.body)) !== null)).toBe(true) // and the server takes them
    audio.remove()
    img.remove()
  })

  it('a rejection with a non-Error reason (a string, undefined, an object) → a sensible title, no crash', async () => {
    start({ perSession: 10 })
    rejectOnPage('server said no')
    rejectOnPage(undefined)
    rejectOnPage({ secret: 'Bob', score: 12 })
    rejectOnPage(null)
    rejectOnPage(42)
    rejectOnPage(gameError('a real Error', 'assets/index-Bx12.js', 1, 1, RangeError))
    await settle()
    const titles = sent.map((s) => s.report.title)
    expect(titles).toEqual(['server said no', 'Failed with: undefined', 'Failed with: Object', 'Failed with: null', 'Failed with: number', 'RangeError: a real Error'])
    expect(sent.every((s) => s.report.kind === 'rejection')).toBe(true)
    expect(sent.map((s) => s.body).join()).not.toContain('Bob')
  })

  it('stop() removes every listener', async () => {
    const added: string[] = []
    const removed: string[] = []
    for (const target of [window, document]) {
      const add = target.addEventListener.bind(target)
      const remove = target.removeEventListener.bind(target)
      vi.spyOn(target, 'addEventListener').mockImplementation((type, fn, o) => { added.push(type); add(type, fn, o) })
      vi.spyOn(target, 'removeEventListener').mockImplementation((type, fn, o) => { removed.push(type); remove(type, fn, o) })
    }
    const canvas = document.createElement('canvas')
    const { stop } = start()
    watchCanvas(canvas)
    stop()
    expect(added.length).toBeGreaterThanOrEqual(5)
    expect([...removed].sort()).toEqual([...added].sort())
    vi.restoreAllMocks()
    const quiet = (event: Event) => event.preventDefault() // with the catcher gone, the test runner would see it
    window.addEventListener('error', quiet)
    throwOnPage(gameError('after stop'))
    rejectOnPage('after stop')
    window.removeEventListener('error', quiet)
    canvas.dispatchEvent(new Event('webglcontextlost'))
    await settle()
    expect(sent).toHaveLength(0)
  })
})

describe('one report', () => {
  it('the 3D canvas being dropped → kind "webgl"', async () => {
    start()
    const canvas = document.createElement('canvas')
    vi.spyOn(canvas, 'getContext').mockReturnValue(null) // jsdom has no WebGL — gpu stays ""
    watchCanvas(canvas)
    canvas.dispatchEvent(new Event('webglcontextlost'))
    await settle()
    expect(sent[0].report).toMatchObject({ kind: 'webgl', title: 'WebGL context lost', gpu: '' })
  })

  it("the game's own report and React's", async () => {
    start()
    expect(reportError(gameError('level.json did not load'), { kind: 'game' })).toBe(true)
    expect(reportError(gameError('render failed'), { kind: 'react' })).toBe(true)
    expect(reportError(gameError('render failed'), { kind: 'react' })).toBe(true) // already reported this session
    await settle()
    expect(sent.map((s) => s.report.kind)).toEqual(['game', 'react'])
    expect(sent[0].address).toBe(`${URL_}/report`)
  })

  it('reportError says false when nothing will be sent', () => {
    start({ url: '' })
    expect(reportError(new Error('x'))).toBe(false)
    stopCrashes()
    expect(reportError(new Error('x'))).toBe(false) // not started: a no-op, no throw
  })

  it('has every field the server checks, in the shape it accepts', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36')
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB')
    start({}, { version: 'v0.3.1.12' })
    moment('roundStart', 3)
    throwOnPage(gameError('shape check'))
    await settle()
    const r = sent[0].report
    expect(Object.keys(r).sort()).toEqual(['browser', 'fp', 'frames', 'gpu', 'kind', 'lang', 'moments', 'os', 'platform', 'repeats', 'screen', 'secs', 'title', 'v', 'version'].sort())
    expect(r).toMatchObject({ v: 1, version: '0.3.1.12', platform: 'web', browser: 'Chrome 141', os: 'Android 15', lang: 'en', repeats: 0 })
    expect(REPORT_KINDS).toContain(r.kind)
    expect(r.fp).toMatch(FINGERPRINT)
    expect(r.screen === '' || /^\d+x\d+@\d+(\.\d{1,2})?$/.test(r.screen)).toBe(true)
    expect(r.secs).toBeGreaterThanOrEqual(0)
    expect(r.moments.every((m) => MOMENT_NAME.test(m.name))).toBe(true)
    expect(sent[0].body).not.toContain('Pixel 9') // the full user-agent text never travels
    expect(sent[0].body).not.toContain('537.36')
  })

  it('a version that is not digits and dots ("dev") travels as "0"', async () => {
    start({}, { version: 'dev' })
    throwOnPage(gameError('dev version'))
    await settle()
    expect(sent[0].report.version).toBe('0')
  })

  it('the default transport is fetch with keepalive, text/plain and no Referer', async () => {
    const fetchSpy = vi.fn<(address: string, init: RequestInit) => Promise<Response>>(() => Promise.resolve(new Response(null, { status: 204 })))
    vi.stubGlobal('fetch', fetchSpy)
    startCrashes({ config: { ...DEFAULT_CRASHES_CONFIG, client: { ...DEFAULT_CRASHES_CONFIG.client, url: URL_ } }, version: '1.0.0.1', dev: false })
    throwOnPage(gameError('via fetch'))
    await settle()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [address, init] = fetchSpy.mock.calls[0]
    expect(address).toBe(`${URL_}/report`)
    expect(init).toMatchObject({ method: 'POST', keepalive: true, referrerPolicy: 'no-referrer', headers: { 'content-type': 'text/plain' } })
    vi.unstubAllGlobals()
  })
})

// F89 review: the game must never build a report the server refuses — a 400 loses it silently (the kind is spent)
describe('what the game sends, the server takes', () => {
  afterEach(() => { stopCrashes(); vi.restoreAllMocks() })

  it('a huge moment number (a Date.now() seed) is dropped, not sent', async () => {
    start()
    moment('seed', Date.now(), 7)
    reportError(gameError('boom'))
    await settle()
    expect(sent[0].report.moments).toEqual([{ at: 0, name: 'seed', n: [7] }])
    expect(readReport(sent[0].report)).not.toBeNull()
  })

  it('moments more than a day old (a tab left open) are left out', async () => {
    let clock = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => clock)
    start()
    moment('shiftStart', 1)
    clock += 2 * 86_400_000 // two days later
    moment('shiftEnd', 2)
    reportError(gameError('late'))
    await settle()
    expect(sent[0].report.moments.map((m) => m.name)).toEqual(['shiftEnd'])
    expect(readReport(sent[0].report)).not.toBeNull()
  })

  it('invisible characters (an emoji joiner, a zero-width space, a right-to-left mark) are taken out of the title and function name', async () => {
    start()
    const [ZWJ, ZWSP, RLO] = [0x200d, 0x200b, 0x202e].map((c) => String.fromCharCode(c))
    const e = new TypeError(`family 👨${ZWJ}👩${ZWJ}👧 broke${ZWSP} here ${RLO}`)
    e.stack = `TypeError: x\n    at ti${ZWSP}ck (${SITE}/assets/index-Bx12.js:1:2)`
    reportError(e)
    await settle()
    const report = sent[0].report
    for (const hidden of [ZWJ, ZWSP, RLO]) expect(report.title).not.toContain(hidden)
    expect(report.frames[0].fn).toBe('tick')
    expect(readReport(report)).not.toBeNull()
  })
})
