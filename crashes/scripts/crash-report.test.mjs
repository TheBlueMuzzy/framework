// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SourceMapGenerator } from 'source-map'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_CRASHES_CONFIG } from '../kit/config'
import { AddressLimiter, handleCrashes } from '../kit/crashRoutes'
import { testStore } from '../tests/testStore'
import { main, parseSince, readCrashesUrl, readToken, translateFrames } from './crash-report.mjs'

const NOW = Date.UTC(2026, 9, 22, 12, 0, 0)
const TOKEN = 'pc-token-for-tests'
const dirs = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

/** A game folder named "goops" with a release's map: generated line 1 col 10 (0-based) → src/game/board.ts:118:4 placePiece. */
function gameFolder({ state = 'Crashes: https://goops-crashes.example.workers.dev\n', map = true } = {}) {
  const parent = mkdtempSync(join(tmpdir(), 'crash-report-'))
  dirs.push(parent)
  const game = join(parent, 'goops')
  mkdirSync(join(game, '.planning'), { recursive: true })
  if (state !== null) writeFileSync(join(game, '.planning', 'STATE.md'), `# STATE\n## Key facts\n- **${state}`)
  if (map) {
    const generator = new SourceMapGenerator({ file: 'index-Bx12.js' })
    generator.addMapping({ generated: { line: 1, column: 10 }, original: { line: 118, column: 4 }, source: '../../src/game/board.ts', name: 'placePiece' })
    mkdirSync(join(game, 'releases', '0.3.1.12', 'maps', 'assets'), { recursive: true })
    writeFileSync(join(game, 'releases', '0.3.1.12', 'maps', 'assets', 'index-Bx12.js.map'), generator.toString())
  }
  const home = join(parent, 'home')
  mkdirSync(join(home, '.config', 'bmuz', 'crashes'), { recursive: true })
  writeFileSync(join(home, '.config', 'bmuz', 'crashes', 'goops.token'), `${TOKEN}\n`)
  return { game, home }
}

describe('translating frames', () => {
  it('a built line:column → the real source line, through releases/<version>/maps', async () => {
    const { game } = gameFolder()
    const lines = await translateFrames([{ file: 'assets/index-Bx12.js', line: 1, col: 11, fn: 'a' }], '0.3.1.12', game)
    expect(lines).toEqual([{ text: 'src/game/board.ts:118:5 placePiece', translated: true }])
  })

  it('a missing map → the raw frame and a plain note; a path that climbs out is never read', async () => {
    const { game } = gameFolder({ map: false })
    const [line] = await translateFrames([{ file: 'assets/index-Bx12.js', line: 1, col: 11, fn: 'tick' }], '0.3.1.12', game)
    expect(line.text).toBe('assets/index-Bx12.js:1:11 tick')
    expect(line.translated).toBe(false)
    expect(line.note).toMatch(/no map: releases\/0\.3\.1\.12\/maps\/assets\/index-Bx12\.js\.map isn't there/)
    const [climb] = await translateFrames([{ file: '../../../../secret', line: 1, col: 1 }], '0.3.1.12', game)
    expect(climb.note).toMatch(/not a file in this release/)
    const [badVersion] = await translateFrames([{ file: 'a.js', line: 1, col: 1 }], '../..', game)
    expect(badVersion.translated).toBe(false)
  })
})

describe('where it looks', () => {
  it('the STATE "Crashes:" line (bold or not), the token file or CRASHES_TOKEN', () => {
    const { game, home } = gameFolder()
    expect(readCrashesUrl(game)).toBe('https://goops-crashes.example.workers.dev')
    expect(readToken('goops', {}, home)).toBe(TOKEN)
    expect(readToken('goops', { CRASHES_TOKEN: 'from-env' }, home)).toBe('from-env')
    expect(readToken('other', {}, home)).toBeNull()
  })

  it('--since: 7d, 24h, a date, ms; anything else is refused', () => {
    expect(parseSince('7d', NOW)).toBe(NOW - 7 * 86_400_000)
    expect(parseSince('24h', NOW)).toBe(NOW - 86_400_000)
    expect(parseSince('2026-10-20', NOW)).toBe(Date.UTC(2026, 9, 20))
    expect(parseSince(String(NOW), NOW)).toBe(NOW)
    expect(parseSince(undefined, NOW)).toBeUndefined()
    expect(parseSince('last tuesday', NOW)).toBeNull()
  })
})

describe('npm run crashes (against the real routes)', () => {
  function serverAt(token = TOKEN) {
    const store = testStore()
    const context = { rows: store.rows, settings: DEFAULT_CRASHES_CONFIG.server, limiter: new AddressLimiter(), address: '192.0.2.1', token, now: NOW }
    const sent = []
    const fetchWith = async (url, init = {}) => {
      sent.push({ url, init })
      return handleCrashes(new Request(url, init), context)
    }
    const report = async (more = {}) => {
      const body = JSON.stringify({
        v: 1, kind: 'error', fp: 'a1b2c3d4e5f60718', title: 'TypeError: board is undefined', frames: [{ file: 'assets/index-Bx12.js', line: 1, col: 11, fn: 'a' }],
        version: '0.3.1.12', platform: 'web', browser: 'Chrome 141', os: 'Android 15', screen: '390x844@3', gpu: '', lang: 'en', secs: 314,
        moments: [{ at: -4.2, name: 'roundStart', n: [3] }], repeats: 0, ...more,
      })
      await handleCrashes(new Request('https://x/report', { method: 'POST', body, headers: { 'Content-Length': String(body.length) } }), { ...context, address: '203.0.113.9' })
    }
    return { fetchWith, report, sent }
  }

  it('prints each kind with counts, versions, devices, moments and the translated source line; the token never printed', async () => {
    const { game, home } = gameFolder()
    const server = serverAt()
    await server.report()
    await server.report({ repeats: 2 })
    const printed = []
    const code = await main([], { cwd: game, env: {}, home, print: (l) => printed.push(l), fetchWith: server.fetchWith, now: NOW })
    const text = printed.join('\n')
    expect(code).toBe(0)
    expect(text).toContain('TypeError: board is undefined')
    expect(text).toContain('4 times')
    expect(text).toContain('0.3.1.12 ×4')
    expect(text).toContain('Chrome 141 / Android 15 ×2')
    expect(text).toContain('roundStart(3) -4.2s')
    expect(text).toContain('src/game/board.ts:118:5 placePiece')
    expect(text).not.toContain(TOKEN)
    expect(server.sent.every((s) => !s.url.includes(TOKEN) && s.init.headers.Authorization === `Bearer ${TOKEN}`)).toBe(true)
  })

  it('fixed <fp> <version> marks it fixed', async () => {
    const { game, home } = gameFolder()
    const server = serverAt()
    await server.report()
    const printed = []
    expect(await main(['fixed', 'a1b2c3d4e5f60718', '0.3.2'], { cwd: game, env: {}, home, print: (l) => printed.push(l), fetchWith: server.fetchWith })).toBe(0)
    expect(printed.join('\n')).toMatch(/Marked a1b2c3d4e5f60718 fixed in 0\.3\.2/)
    const again = []
    await main([], { cwd: game, env: {}, home, print: (l) => again.push(l), fetchWith: server.fetchWith, now: NOW })
    expect(again.join('\n')).toContain('FIXED in 0.3.2')
  })

  it('plain-English errors: no Crashes line, no token, wrong token, no server', async () => {
    const say = async (setup, argv = [], more = {}) => {
      const printed = []
      const code = await main(argv, { env: {}, print: (l) => printed.push(l), ...setup, ...more })
      return { code, text: printed.join('\n') }
    }
    const noLine = gameFolder({ state: 'Live: https://example.com\n' })
    expect(await say({ cwd: noLine.game, home: noLine.home })).toMatchObject({ code: 1, text: expect.stringMatching(/No crash server address/) })
    const { game, home } = gameFolder()
    const elsewhere = join(home, '..', 'empty-home')
    expect(await say({ cwd: game, home: elsewhere })).toMatchObject({ code: 1, text: expect.stringMatching(/No token for goops/) })
    const wrong = serverAt('a-different-token')
    expect(await say({ cwd: game, home, fetchWith: wrong.fetchWith })).toMatchObject({ code: 1, text: expect.stringMatching(/the token is wrong/) })
    const down = async () => { throw new TypeError('fetch failed') }
    expect(await say({ cwd: game, home, fetchWith: down })).toMatchObject({ code: 1, text: expect.stringMatching(/Couldn't reach the crash server/) })
    expect(await say({ cwd: game, home }, ['--since=whenever'])).toMatchObject({ code: 1, text: expect.stringMatching(/isn't a time/) })
  })
})
