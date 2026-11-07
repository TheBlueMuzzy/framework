// @vitest-environment node
// The e2e helpers (e2e.mjs, 0.31.0, F196) against the REAL Dev Kit in a real browser (Playwright's own Chromium):
// e2e.test-page.html mounts it late on purpose, with ten extra tabs so a phone's tab row pages.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeDevKit, devkitPanel, openDevKit, openTab } from './e2e.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

let server, browser, url
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [react()],
    resolve: {
      alias: [
        { find: 'virtual:devkit-tuning-files', replacement: join(here, 'tuning', 'tuningFiles.test-stub.ts') },
        { find: /^\.\.\/devkit-game\/tabs$/, replacement: join(here, 'e2e.test-tabs.tsx') },
      ],
    },
    server: { port: 0, host: '127.0.0.1', hmr: false },
  })
  await server.listen()
  url = `${server.resolvedUrls.local[0]}kit/e2e.test-page.html`
  browser = await chromium.launch()
}, 120_000)
afterAll(async () => {
  await browser?.close()
  await server?.close()
})

async function open(size, late = 0) {
  const page = await browser.newPage({ viewport: size, isMobile: size.width < 500, hasTouch: size.width < 500 })
  await page.goto(`${url}?late=${late}`)
  return page
}
const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1440, height: 900 }

describe('openDevKit', () => {
  it('waits for a Dev Kit that arrives late (2 s after the page), then opens the panel', async () => {
    const page = await open(DESKTOP, 2000)
    try {
      expect(await devkitPanel(page).count()).toBe(0) // not there yet: a ` now would do nothing
      const panel = await openDevKit(page)
      expect(await panel.isVisible()).toBe(true)
      // already open → left open (a second ` would close it)
      await openDevKit(page)
      expect(await panel.isVisible()).toBe(true)
      await closeDevKit(page)
      expect(await panel.isVisible()).toBe(false)
      await closeDevKit(page) // already closed → nothing
    } finally { await page.close() }
  }, 60_000)

  it('opens even while the game has a text box focused (` would be a letter there)', async () => {
    const page = await open(DESKTOP)
    try {
      await page.getByLabel('Game name box').focus()
      const panel = await openDevKit(page)
      expect(await panel.isVisible()).toBe(true)
      expect(await page.getByLabel('Game name box').inputValue()).toBe('')
    } finally { await page.close() }
  }, 60_000)

  it('says plainly when the Dev Kit never arrives', async () => {
    const page = await open(DESKTOP, 60_000)
    try {
      await expect(openDevKit(page, { timeout: 500 })).rejects.toThrow(/never arrived/)
    } finally { await page.close() }
  }, 30_000)
})

describe('openTab', () => {
  it('on a phone: a tab on a later page of the tab row, then one back on the first page', async () => {
    const page = await open(PHONE, 500)
    try {
      expect(await page.locator('.devkit-tab', { hasText: /^Juliett$/ }).count()).toBe(0) // (Dev Kit not there yet)
      const juliett = await openTab(page, 'Juliett') // opens the panel too
      expect(await juliett.getByText('Juliett tools').isVisible()).toBe(true)
      expect(await page.locator('.devkit-tab', { hasText: /^Juliett$/ }).getAttribute('aria-selected')).toBe('true')
      // the row really pages here (else this test proves nothing about paging)
      expect(await page.getByRole('button', { name: 'Next tools' }).count()).toBe(1)
      const color = await openTab(page, 'Color')
      expect(await color.isVisible()).toBe(true)
      expect(await juliett.isVisible()).toBe(false)
    } finally { await page.close() }
  }, 60_000)

  it('on a desktop (the tabs wrap): any tab, then another', async () => {
    const page = await open(DESKTOP)
    try {
      expect(await (await openTab(page, 'Echo')).getByText('Echo tools').isVisible()).toBe(true)
      expect(await (await openTab(page, 'Alpha')).getByText('Alpha tools').isVisible()).toBe(true)
    } finally { await page.close() }
  }, 60_000)

  it('an unknown tab fails at once, naming the tabs there are', async () => {
    const page = await open(DESKTOP)
    try {
      await expect(openTab(page, 'Nope')).rejects.toThrow(/no "Nope" tab — it has: Color, .*Juliett/)
    } finally { await page.close() }
  }, 30_000)
})

describe('never in a game build', () => {
  it('no kit file imports e2e.mjs (Vite only bundles what the game imports)', () => {
    const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))
    const importers = files(here)
      .filter((f) => /\.(tsx?|mjs)$/.test(f) && !/\.test\./.test(f) && !f.endsWith('e2e.mjs'))
      .filter((f) => /from\s+['"][^'"]*\/e2e\.mjs['"]|import\(\s*['"][^'"]*\/e2e\.mjs/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(here, f))
    expect(importers).toEqual([])
  })
})
