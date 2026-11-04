// SAVES IN REAL BROWSERS (F150) — every other saves test runs in Node with a pretend storage. This one puts the
// module on a real page in Playwright's Chromium (Chrome, Edge), WebKit (Safari — and every iPhone browser) and
// Firefox, and does what a player's browser does: save, reload, close and reopen, load, an upgrade step, a really
// full storage, a private window and a browser that refuses storage. (0.8.0: the save code, openSaves and health
// check tests went with those parts — git tag archive/saves-0.7.0.) Each engine must give the same results and say the same plain words.
//
// How: the kit (kit/index.ts) is bundled in memory by Vite, and Playwright answers http://localhost:6171/ itself
// (route) — no server, no files written; nothing listens on that port. localhost = a "secure" page, like https.
// Needs Playwright's browsers once on a machine: npx playwright install chromium webkit firefox
// (package.json "testBrowsers" tells GitHub's Checks which ones to install). Runs in `npm test`: ~9 s for all three.
// What a real phone still has to show (fonts aside, nothing here differs) is in README → "Proven in which browsers".
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, firefox, webkit } from 'playwright'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const ORIGIN = 'http://localhost:6171' // answered by Playwright (route), never a real server
const KIT = join(import.meta.dirname, '..', 'kit', 'index.ts')

// The test game: progress (version 1 → 2 adds stars) and settings, made the same way a game makes them
const GAME = `
  import * as kit from '/saves.js'
  window.kit = kit
  window.problems = []
  const onProblem = (m) => window.problems.push(m)
  window.progress = (version) => kit.createSave({
    key: 'f150:progress', kind: 'progress', version,
    fresh: version === 1 ? { xp: 0, unlocks: [] } : { xp: 0, unlocks: [], stars: 0 },
    upgrades: { 2: (v1) => ({ ...v1, stars: v1.xp >= 100 ? 3 : 0 }) },
    fields: { xp: 'highest', unlocks: 'collect', stars: 'highest' },
    onProblem,
  })
  window.settings = () => kit.createSave({ key: 'f150:settings', kind: 'settings', version: 1, fresh: { volume: 0.8 }, onProblem })
  // Fill the storage to the brim with another game's keys (nothing of ours): big pieces first, then smaller, down to
  // one character — the way a player's storage really fills up. Returns what the browser threw at the end.
  window.fillStorage = () => {
    let size = 1 << 20
    let n = 0
    let error = null
    while (size >= 1) {
      try { localStorage.setItem('othergame:filler' + n, 'x'.repeat(size)); n++ } catch (e) { error = e; size = Math.floor(size / 2) }
    }
    return { name: error && error.name, code: error && error.code, isFull: kit.isFullError(error) }
  }
  window.ready = true
`
const PAGE = `<!doctype html><meta charset="utf-8"><title>saves in a real browser</title><script type="module">${GAME}</script>`

const ENGINES = [['chromium', chromium], ['webkit', webkit], ['firefox', firefox]]

let bundle = ''
beforeAll(async () => {
  const result = await build({
    configFile: false, logLevel: 'silent', root: join(import.meta.dirname, '..'),
    build: { write: false, minify: false, lib: { entry: KIT, formats: ['es'], fileName: 'saves' } },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output)
  bundle = outputs.find((file) => file.type === 'chunk').code
}, 60_000)

/** Answer the test origin from memory: the page, and the kit as /saves.js. */
async function serve(context) {
  await context.route(`${ORIGIN}/**`, (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/saves.js') return route.fulfill({ contentType: 'text/javascript', body: bundle })
    return route.fulfill({ contentType: 'text/html', body: PAGE })
  })
}

async function open(context) {
  const page = context.pages()[0] ?? (await context.newPage())
  await page.goto(`${ORIGIN}/`)
  await page.waitForFunction(() => window.ready === true)
  return page
}

async function reload(page) {
  await page.reload()
  await page.waitForFunction(() => window.ready === true)
}

async function launch(name, start) {
  try {
    return await start()
  } catch (error) {
    throw new Error(`Playwright's ${name} isn't installed on this machine — run: npx playwright install ${name}\n(${error.message.split('\n')[0]})`)
  }
}

// An engine not installed on THIS machine is skipped with a loud line (so installing the module into a game on a
// machine without, say, Firefox isn't blocked) — but never on GitHub (CI is set there): there all three must run.
const installed = (engine) => { try { return existsSync(engine.executablePath()) } catch { return false } }
for (const [name, engine] of ENGINES) {
  if (!installed(engine) && !process.env.CI) console.warn(`⚠ saves browser test: Playwright's ${name} isn't installed here, so it was SKIPPED — run: npx playwright install ${name}`)
}

describe.each(ENGINES.filter(([, engine]) => installed(engine) || process.env.CI))('saves in real %s', (name, engine) => {
  let profile = ''
  let context = null // a normal window, kept on disk (like a real browser profile)
  let page = null

  beforeAll(async () => {
    profile = mkdtempSync(join(tmpdir(), `saves-${name}-`))
    context = await launch(name, () => engine.launchPersistentContext(profile))
    await serve(context)
    page = await open(context)
  }, 60_000)

  afterAll(async () => {
    await context?.close()
    // Windows: a closed Chromium can hold its profile files for seconds under load (EPERM in check:fast, even after
    // 2 s of retries) — a temp folder left behind is not a saves problem, so say so instead of failing the module
    if (!profile) return
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 })
    } catch (error) {
      console.warn(`saves browser test: left ${profile} behind (${error.code}) — the closed ${name} still held it`)
    }
  })

  it('saves, and keeps it through a reload and a browser restart', async () => {
    const saved = await page.evaluate(() => window.progress(1).save({ xp: 120, unlocks: ['red'] }))
    expect(saved).toEqual({ ok: true })
    await page.evaluate(() => window.progress(1).save({ xp: 150, unlocks: ['red'] })) // the first becomes backup 1
    await reload(page)
    expect(await page.evaluate(() => { const p = window.progress(1); return { data: p.load(), from: p.report().from } }))
      .toEqual({ data: { xp: 150, unlocks: ['red'] }, from: 'save' })
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('f150:progress~1')).data.xp)).toBe(120)

    await context.close() // the whole browser closes…
    context = await engine.launchPersistentContext(profile) // …and opens again on the same profile
    await serve(context)
    page = await open(context)
    expect(await page.evaluate(() => window.progress(1).load())).toEqual({ xp: 150, unlocks: ['red'] })
  }, 60_000)

  it('a broken newest copy falls back to the backup', async () => {
    const report = await page.evaluate(() => {
      const good = localStorage.getItem('f150:progress')
      localStorage.setItem('f150:progress', good.slice(0, 20)) // a write cut off half-way
      const p = window.progress(1)
      const data = p.load()
      localStorage.setItem('f150:progress', good) // put it back for the next tests
      return { data, from: p.report().from, note: p.report().note }
    })
    expect(report).toEqual({ data: { xp: 120, unlocks: ['red'] }, from: 'backup', note: 'Your last save was damaged, so the game loaded the copy saved before it.' })
  }, 60_000)

  it('an upgrade step: version 1 saves load in version 2, and an older build leaves the newer save alone', async () => {
    await reload(page) // "the game updated"
    const upgraded = await page.evaluate(() => {
      const p = window.progress(2)
      const data = p.load()
      const result = p.save(data)
      return { data, upgradedFrom: p.report().upgradedFrom, result, stored: JSON.parse(localStorage.getItem('f150:progress')).version }
    })
    expect(upgraded).toEqual({ data: { xp: 150, unlocks: ['red'], stars: 3 }, upgradedFrom: 1, result: { ok: true }, stored: 2 })

    await reload(page) // "rolled back to the older build"
    const older = await page.evaluate(() => {
      const p = window.progress(1)
      return { data: p.load(), newer: p.report().newer, saved: p.save({ xp: 1, unlocks: [] }).reason, stored: JSON.parse(localStorage.getItem('f150:progress')).data }
    })
    expect(older).toEqual({ data: { xp: 0, unlocks: [] }, newer: 2, saved: 'newer', stored: { xp: 150, unlocks: ['red'], stars: 3 } })
  }, 60_000)

  it('a full storage: the same "full" in every engine, the same plain words, the last good save kept — and old backups make room', async () => {
    const full = await page.evaluate(() => {
      localStorage.clear()
      const p = window.progress(2)
      p.save({ xp: 10, unlocks: ['a'], stars: 0 })
      p.save({ xp: 20, unlocks: ['a'], stars: 0 })
      p.save({ xp: 30, unlocks: ['a'], stars: 0 }) // the save + 2 backups
      const thrown = window.fillStorage()
      const big = p.save({ xp: 40, unlocks: ['a', 'x'.repeat(50_000)], stars: 0 }) // can't fit, even without backups
      const afterBig = p.load()
      const roomy = p.save({ xp: 50, unlocks: ['a', 'bb'], stars: 1 }) // a little bigger: fits once old backups go
      return { thrown, big, afterBig, roomy, loaded: p.load(), backup2: localStorage.getItem('f150:progress~2') }
    })
    expect(full.thrown).toMatchObject({ isFull: true }) // what each engine throws is in the README
    expect(full.big).toEqual({ ok: false, reason: 'full', message: 'The browser\'s storage for this game is full, so this wasn\'t saved. The game keeps running; your last good save is still there.' })
    expect(full.afterBig).toEqual({ xp: 30, unlocks: ['a'], stars: 0 })
    expect(full.roomy).toEqual({ ok: true })
    expect(full.loaded).toEqual({ xp: 50, unlocks: ['a', 'bb'], stars: 1 })
    expect(full.backup2).toBe(null) // the oldest copy went to make room
    await page.evaluate(() => localStorage.clear())
  }, 60_000)

  it('a browser that refuses storage: "blocked", the same words, the game keeps running', async () => {
    await reload(page) // a clean page: the kit back on the browser's own storage
    const blocked = await page.evaluate(() => {
      const results = {}
      const real = Storage.prototype.setItem
      const p = window.progress(2)
      // 1. today's browsers with storage turned off: a SecurityError on every write
      Storage.prototype.setItem = function () { throw new DOMException('The operation is insecure.', 'SecurityError') }
      results.security = p.save({ xp: 1, unlocks: [], stars: 0 })
      // 2. Safari's private window up to Safari 10: room for nothing, so every write is "quota exceeded"
      results.keysBefore = localStorage.length
      Storage.prototype.setItem = function () { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError') }
      results.noRoom = p.save({ xp: 1, unlocks: [], stars: 0 })
      Storage.prototype.setItem = real
      // 3. Chrome with "block all cookies": even looking at localStorage throws
      Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Access is denied for this document.', 'SecurityError') } })
      results.noStorage = p.save({ xp: 1, unlocks: [], stars: 0 })
      results.loadsFresh = p.load()
      return results
    })
    const words = 'This browser won\'t let the game save (a private window, or storage is blocked). Your progress lasts until you close the page.'
    expect(blocked.keysBefore).toBe(0) // an old Safari private window held nothing
    expect(blocked.security).toEqual({ ok: false, reason: 'blocked', message: words })
    expect(blocked.noRoom).toEqual({ ok: false, reason: 'blocked', message: words })
    expect(blocked.noStorage).toEqual({ ok: false, reason: 'blocked', message: words })
    expect(blocked.loadsFresh).toEqual({ xp: 0, unlocks: [], stars: 0 })
    await reload(page)
  }, 60_000)

  it('a private window: saves last while it is open, the next one starts empty', async () => {
    const browser = await launch(name, () => engine.launch())
    try {
      const fresh = await browser.newContext() // Playwright's own contexts keep nothing on disk, like a private window
      await serve(fresh)
      const tab = await open(fresh)
      expect(await tab.evaluate(() => window.progress(2).save({ xp: 5, unlocks: [], stars: 0 }))).toEqual({ ok: true })
      await reload(tab)
      expect(await tab.evaluate(() => window.progress(2).load().xp)).toBe(5)
      await fresh.close()

      const next = await browser.newContext()
      await serve(next)
      const again = await open(next)
      expect(await again.evaluate(() => window.progress(2).peek())).toBe(null)
      await next.close()
    } finally {
      await browser.close()
    }
  }, 60_000)
})
