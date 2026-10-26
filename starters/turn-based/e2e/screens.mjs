// EVERY SCREEN AT EVERY SIZE — the main menu, the board, Pause, Settings, Credits, the results and the online lobby,
// at the 7 sizes the UI kit checks (390×844 · 360×780 · 844×390 · 768×343 · 1100×800 · 1440×900 · 1920×1080).
//   node e2e/screens.mjs [outDir] [port]          (npm run e2e:screens)
// Each one is checked with the UI kit's own page check (src/ui/kit/uiProblems.mjs: wider than the screen, too small to
// tap, clipped, overlapping, faint, touching its box's edge, growing) and shot to outDir/screens-<size>-<screen>.png.
// (check:framework checks the first screen and live play; this adds the screens you only reach by tapping.)
// Starts its OWN dev server (port 6404) and closes only that one.
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import { checkVersion } from '../src/version/e2e.mjs'
import { findProblems } from '../src/ui/kit/uiProblems.mjs'

const OUT = process.argv[2] ?? 'e2e-shots'
const PORT = Number(process.argv[3] ?? 6404)
mkdirSync(OUT, { recursive: true })
const SIZES = [
  ['390x844', 390, 844, true], ['360x780', 360, 780, true], ['844x390', 844, 390, true], ['768x343', 768, 343, true],
  ['1100x800', 1100, 800, false], ['1440x900', 1440, 900, false], ['1920x1080', 1920, 1080, false],
]
let failures = 0
const server = await createServer({ server: { port: PORT, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()

async function look(page, size, name) {
  await page.waitForTimeout(700) // a polling step: the screen's entrance animation settles
  const problems = await page.evaluate(findProblems, {})
  await page.screenshot({ path: `${OUT}/screens-${size}-${name}.png` })
  if (problems.length) {
    failures++
    console.log(`  FAIL ${size} ${name}:\n    ${problems.join('\n    ')}`)
  } else console.log(`  ok   ${size} ${name}`)
}

try {
  for (const [size, width, height, mobile] of SIZES) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile })
    const page = await context.newPage()
    await page.goto(`http://127.0.0.1:${PORT}/`)
    await checkVersion(page)
    await page.getByRole('button', { name: /Careless/ }).waitFor()
    await look(page, size, 'menu')
    await page.getByRole('button', { name: 'Settings' }).click()
    await look(page, size, 'settings')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Credits' }).click()
    await look(page, size, 'credits')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Play online' }).click()
    await look(page, size, 'lobby')
    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: /Careless/ }).click()
    await page.locator('[data-board] [data-mark=""]').first().click()
    await look(page, size, 'board')
    await page.getByRole('button', { name: 'Pause' }).click()
    await look(page, size, 'pause')
    await page.getByRole('button', { name: 'Resume' }).click()
    // play to the end: your free squares, the bot answers
    for (let step = 0; step < 200 && !(await page.getByRole('heading', { name: /win|draw/i }).count()); step++) {
      const free = page.locator('[data-board] [data-mark=""]:not([aria-disabled])')
      if (await page.getByText('Your turn').count() && await free.count()) await free.first().click()
      await page.waitForTimeout(150) // a polling step while the bot thinks
    }
    await look(page, size, 'results')
    await context.close()
  }
} catch (error) {
  failures++
  console.log(`  FAIL ${error.message}`)
} finally {
  await browser.close()
  await server.close()
}
console.log(failures ? `\nSCREENS FAILED — ${failures} problem(s)` : '\nSCREENS OK — 7 screens × 7 sizes, no problems')
process.exit(failures ? 1 : 0)
