// SMOKE — the game loads, a whole round against the computer plays through the real screen, the console stays clean.
//   node e2e/smoke.mjs [outDir] [port]          (npm run smoke)
// At phone (390×844) and desktop (1440×900): the main menu → Play Careless Cass → tap free squares on your turns
// (the bot answers on its own; in this scripted run you always go first) → the results open → Main menu.
// Screenshots of each step go in outDir. Any console error or warning, page error or failed request fails it.
// Starts its OWN dev server (port 6401) and closes only that one.
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import { checkVersion } from '../src/version/e2e.mjs'

const OUT = process.argv[2] ?? 'e2e-shots'
const PORT = Number(process.argv[3] ?? 6401)
mkdirSync(OUT, { recursive: true })
const URL_ = `http://127.0.0.1:${PORT}/`
const SIZES = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
]

const server = await createServer({ server: { port: PORT, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()
let failures = 0
const fail = (why) => { failures++; console.log(`  FAIL ${why}`) }

try {
  for (const size of SIZES) {
    console.log(`${size.name} ${size.width}×${size.height}`)
    const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, isMobile: size.mobile, hasTouch: size.mobile })
    const page = await context.newPage()
    const noise = []
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') noise.push(`${m.type()}: ${m.text()}`) })
    page.on('pageerror', (e) => noise.push(`page error: ${e.message}`))
    page.on('requestfailed', (r) => noise.push(`request failed: ${r.url()}`))

    await page.goto(URL_)
    await checkVersion(page)
    const play = page.getByRole('button', { name: /Careless/ })
    await play.waitFor()
    await page.screenshot({ path: `${OUT}/smoke-${size.name}-1-menu.png` })
    await play.click()
    await page.locator('[data-board]').waitFor()

    // Play: on your turn tap the first free square; the bot moves by itself
    let taps = 0
    for (let step = 0; step < 200; step++) {
      if (await page.getByRole('heading', { name: /win|draw/i }).count()) break
      const yourTurn = await page.getByText('Your turn').count()
      const free = page.locator('[data-board] [data-mark=""]:not([aria-disabled])')
      if (yourTurn && (await free.count())) {
        await free.first().click()
        taps++
        if (taps === 1) await page.screenshot({ path: `${OUT}/smoke-${size.name}-2-table.png` })
      }
      await page.waitForTimeout(150) // a polling step: the bot takes ~1 s of rules time per move
    }
    const title = page.getByRole('heading', { name: /win|draw/i })
    await title.waitFor({ timeout: 15000 })
    console.log(`  round over after ${taps} taps — "${(await title.first().textContent())?.trim()}"`)
    await page.waitForTimeout(600) // the results' rows arrive one by one
    await page.screenshot({ path: `${OUT}/smoke-${size.name}-3-results.png` })
    await page.getByRole('button', { name: 'Main menu' }).click()
    await play.waitFor()
    if (noise.length) fail(`console not clean:\n    ${noise.join('\n    ')}`)
    else console.log('  console clean')
    await context.close()
  }
} catch (error) {
  fail(error.message)
} finally {
  await browser.close()
  await server.close()
}
console.log(failures ? `\nSMOKE FAILED — ${failures} problem(s)` : '\nSMOKE OK — a round played at phone and desktop, console clean')
process.exit(failures ? 1 : 0)
