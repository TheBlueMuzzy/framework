// THE DEV KIT'S MAIN PROMISE, END TO END — it changes the RUNNING game (MODULE-CONTRACTS "Dev Kit").
//   node e2e/devkit-live.mjs [outDir] [port]          (npm run e2e:devkit-live)
// In a game against Careless Cass (desktop 1440×900), through the real Dev Kit panel (the ` key):
//   1. Tuning tab → "Board: square size" 96 → 60: the squares on the board shrink at once, no reload.
//   2. ⏸ Full pause right after your move: the bot stops thinking — 2.5 s later it still hasn't moved. Resume → it moves.
//   3. ◐ Half pause the same way: the bot stops (rules clock), resume → it moves.
// Starts its OWN dev server (port 6402) and closes only that one. Nothing is saved (no Save button pressed).
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import { checkVersion } from '../src/version/e2e.mjs'

const OUT = process.argv[2] ?? 'e2e-shots'
const PORT = Number(process.argv[3] ?? 6402)
mkdirSync(OUT, { recursive: true })
let failures = 0
const fail = (why) => { failures++; console.log(`  FAIL ${why}`) }
const pass = (what) => console.log(`  ok   ${what}`)

const server = await createServer({ server: { port: PORT, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`http://127.0.0.1:${PORT}/`)
  await checkVersion(page)
  await page.getByRole('button', { name: /Careless/ }).click()
  await page.locator('[data-board]').waitFor()
  const cellWidth = () => page.locator('[data-cell="0"]').evaluate((el) => Math.round(el.getBoundingClientRect().width))
  const marks = () => page.locator('[data-board] [data-mark="0"], [data-board] [data-mark="1"]').count()

  // 1. A Tuning edit reaches the running game
  const before = await cellWidth()
  await page.keyboard.press('`')
  const devkit = page.locator('#devkit-root')
  await devkit.getByRole('tab', { name: 'Tuning' }).or(devkit.getByRole('button', { name: 'Tuning', exact: true })).first().click()
  await devkit.getByRole('button', { name: 'Expand all' }).click()
  const box = devkit.locator('input[aria-label="cellSize"]')
  await box.fill('60')
  await box.press('Tab')
  await page.waitForFunction(() => Math.round(document.querySelector('[data-cell="0"]').getBoundingClientRect().width) === 60, null, { timeout: 3000 }).catch(() => {})
  const after = await cellWidth()
  if (after === 60 && before !== 60) pass(`Tuning → square size ${before} → ${after} px in the running game`)
  else fail(`a square is ${after} px after the edit (was ${before}, wanted 60)`)
  await page.screenshot({ path: `${OUT}/devkit-live-tuned.png` })

  // 2 + 3. A pause holds the bot mid-think; resuming lets it move
  for (const [mode, cell] of [['full', 0], ['half', 3]]) {
    const start = await marks()
    await page.locator(`[data-cell="${cell}"]`).click() // your move — the bot starts thinking (0.6–1.2 s of rules time)
    await devkit.locator(`[data-pause="${mode}"]`).click()
    await page.waitForTimeout(2500) // proving nothing happens: the bot would have moved within 1.2 s
    const held = await marks()
    if (held === start + 1) pass(`${mode} pause: the bot stayed still for 2.5 s`)
    else fail(`${mode} pause: ${held - start} marks appeared while paused (wanted only yours)`)
    if (mode === 'half') await page.screenshot({ path: `${OUT}/devkit-live-half-paused.png` })
    await devkit.locator(`[data-pause="${mode}"]`).click() // resume
    await page.waitForFunction((n) => document.querySelectorAll('[data-board] [data-mark="0"], [data-board] [data-mark="1"]').length >= n, start + 2, { timeout: 5000 })
      .then(() => pass(`${mode} pause: resumed, the bot moved`))
      .catch(() => fail(`${mode} pause: after resume the bot never moved`))
  }
  // 4. The game's OWN pause (the HUD's ❚❚ → Pause) holds the bot the same way (rulesClock.scale = 0)
  await page.keyboard.press('Escape') // close the Dev Kit panel
  if (await page.getByRole('heading', { name: /win|draw/i }).count()) pass('(the round ended before the game-pause step — skipped)')
  else {
    const start = await marks()
    await page.locator('[data-board] [data-mark=""]').first().click()
    await page.getByRole('button', { name: 'Pause' }).click()
    await page.waitForTimeout(2500) // proving nothing happens while the game is paused
    if ((await marks()) === start + 1) pass('the game\'s own Pause: the bot stayed still for 2.5 s')
    else fail('the game\'s own Pause: the bot moved while Pause was open')
    await page.getByRole('button', { name: 'Resume' }).click()
    await page.waitForFunction((n) => document.querySelectorAll('[data-board] [data-mark="0"], [data-board] [data-mark="1"]').length >= n || !!document.querySelector('h1,h2'), start + 2, { timeout: 5000 })
      .then(() => pass('the game\'s own Pause: resumed, the bot moved'))
      .catch(() => fail('the game\'s own Pause: after Resume the bot never moved'))
  }
  if (errors.length) fail(`page errors: ${errors.join(' · ')}`)
} catch (error) {
  fail(error.message)
  await browser.contexts()[0]?.pages()[0]?.screenshot({ path: `${OUT}/devkit-live-failed.png` })
} finally {
  await browser.close()
  await server.close()
}
console.log(failures ? `\nDEVKIT-LIVE FAILED — ${failures} problem(s)` : '\nDEVKIT-LIVE OK — a Tuning edit changed the running game; both pauses held the bot')
process.exit(failures ? 1 : 0)
