// THE DEV KIT'S MAIN PROMISE, END TO END — it changes the RUNNING game (MODULE-CONTRACTS "Dev Kit").
//   node e2e/devkit-live.mjs [outDir] [port]          (npm run e2e:devkit-live)
// In a game against Careless Cass (desktop 1440×900), through the real Dev Kit panel — opened, and its tabs picked, with
// the Dev Kit's own e2e helpers (src/devkit/e2e.mjs, Dev Kit 0.31.0: they wait for the panel itself, never a set time):
//   1. Tuning tab → "Board: square size" 96 → 60: the squares on the board shrink at once, no reload.
//   2. ⏸ Full pause right after your move: the bot stops thinking — 2.5 s later it still hasn't moved. Resume → it moves.
//   3. ◐ Half pause the same way: the bot stops (rules clock), resume → it moves.
//   5. Lessons tab (Dev Kit 0.29.0): ▶ step 1 plays the tutorial; step 2's words changed in the tab show in the running
//      game when step 2 starts; Save would change only that value in content/lessons/first-game.json — the save request
//      is caught and written the Save endpoint's way (formatJson on the file's text) WITHOUT touching the file: the
//      other e2e scripts' dev servers watch it, and a write reloads their pages mid-round (smoke failed that way).
//      0.30.0: step 1's words TYPED in the tab change the bubble already on screen at once; Save writes only that
//      value into content/text/en.json (caught the same way — every other byte as it was).
// Starts its OWN dev server (port 6402) and closes only that one. Writes no file of the game.
import { mkdirSync, readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import { checkVersion } from '../src/version/e2e.mjs'
import { closeDevKit, devkitPanel, openTab } from '../src/devkit/e2e.mjs' // (Dev Kit 0.31.0: they wait for the panel, never a set time)

const OUT = process.argv[2] ?? 'e2e-shots'
const PORT = Number(process.argv[3] ?? 6402)
mkdirSync(OUT, { recursive: true })
const LESSON_TEXT = readFileSync(new URL('../content/lessons/first-game.json', import.meta.url), 'utf8')
const EN_TEXT = readFileSync(new URL('../content/text/en.json', import.meta.url), 'utf8')
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
  const devkit = devkitPanel(page)
  const tuning = await openTab(page, 'Tuning')
  await tuning.getByRole('button', { name: 'Expand all' }).click()
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
  await closeDevKit(page)
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
  // 5. The Lessons tab (Dev Kit 0.29.0, F200): ▶ plays the tutorial; step 2's words changed in the tab show in the
  //    running game when the step starts; Save changes only that one value in content/lessons/first-game.json
  await lessonsTab()
  if (errors.length) fail(`page errors: ${errors.join(' · ')}`)

  async function lessonsTab() {
    const NEW_WORDS = 'Dev Kit words: three in a row wins!'
    const NEW_BOARD = 'Typed in the Dev Kit: click a square.'
    const callout = page.locator('.kit-callout')
    const lessons = await openTab(page, 'Lessons')
    await lessons.getByRole('button', { name: 'Play from step 1 (board)' }).click()
    await callout.filter({ hasText: 'This is your board' }).waitFor({ timeout: 5000 })
      .then(() => pass('Lessons tab → ▶ step 1: the tutorial plays in a fresh game'))
      .catch(() => fail('Lessons tab → ▶ step 1: the first step\'s words never showed'))
    // the lesson's dim and bubble (popovers that opened after the panel) must not cover the panel (Dev Kit 0.29.0 lifts it)
    await page.locator('.kit-spot-layer').waitFor({ state: 'attached', timeout: 3000 }).catch(() => {}) // the dim is up
    const onTop = await page.waitForFunction(() => {
      const box = document.querySelector('#devkit-root aside, #devkit-root .devkit')?.getBoundingClientRect()
      if (!box) return false
      return [[0.5, 0.5], [0.1, 0.9], [0.9, 0.3]].every(([x, y]) => !!document.elementFromPoint(box.left + box.width * x, box.top + box.height * y)?.closest('#devkit-root'))
    }, null, { timeout: 1000 }).then(() => true, () => false)
    if (onTop) pass('Lessons tab → the panel stays on top of the lesson\'s dim and bubble')
    else fail('the lesson\'s dim or bubble covers the Dev Kit panel')
    // 0.30.0 (F200 task 22): step 1's words typed in the tab → the bubble ALREADY on screen changes at once (live words:
    // the starter's LessonView reads en.json through liveFile('text/en') and redraws on its edits)
    await devkit.getByLabel('board: Words (mouse)').fill(NEW_BOARD)
    await callout.filter({ hasText: NEW_BOARD }).waitFor({ timeout: 3000 })
      .then(() => pass('Lessons tab → step 1\'s words typed in the tab change the bubble on screen at once (not saved)'))
      .catch(async () => fail(`the bubble on screen still says "${(await callout.textContent().catch(() => '')) ?? ''}", not the typed words`))
    const words = devkit.getByLabel('threeInARow: Words id')
    await words.fill(NEW_WORDS)
    await page.screenshot({ path: `${OUT}/devkit-live-lessons-tab.png` })
    await closeDevKit(page) // the lesson goes on
    await page.locator('[data-board] [data-mark=""]').first().click() // your move → step 2 starts, asking for the lesson again
    await callout.filter({ hasText: NEW_WORDS }).waitFor({ timeout: 5000 })
      .then(() => pass('Lessons tab → step 2\'s new words show in the running game (no reload, not saved)'))
      .catch(async () => fail(`step 2 shows "${(await callout.textContent().catch(() => '')) ?? ''}", not the tab's new words`))
    await page.screenshot({ path: `${OUT}/devkit-live-lessons-live.png` })
    // Save: only that one value in the file changes, every other byte as it was. The request is caught and written the
    // endpoint's way (the game's own vite-plugins/devkit formatJson + keepHelp on the file's text), not to disk.
    const { formatJson, keepHelp } = await server.ssrLoadModule('/vite-plugins/devkit/devkitVite.ts')
    let now = null
    let enNow = null
    // (Dev Kit 0.32.0, F208: every save carries the page's key — the dev server refuses one without it)
    const pageKey = await page.locator('meta[name="devkit-key"]').getAttribute('content')
    const savesWithoutKey = []
    await page.route('**/__devkit/save', async (route) => {
      const { path, data } = route.request().postDataJSON()
      if (!pageKey || route.request().headers()['x-devkit-key'] !== pageKey) savesWithoutKey.push(path)
      if (path === 'content/lessons/first-game.json') now = formatJson(keepHelp(JSON.parse(LESSON_TEXT), data), LESSON_TEXT)
      if (path === 'content/text/en.json') enNow = formatJson(keepHelp(JSON.parse(EN_TEXT), data), EN_TEXT)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, path }) })
    })
    await (await openTab(page, 'Lessons')).getByRole('button', { name: 'Save', exact: true }).click()
    await devkit.getByText(/Saved content\/lessons\/first-game\.json/).waitFor({ timeout: 5000 }).catch(() => {})
    await page.unroute('**/__devkit/save')
    const expected = LESSON_TEXT.replace('"message": "threeInARow"', `"message": ${JSON.stringify(NEW_WORDS)}`)
    if (expected !== LESSON_TEXT && now === expected) pass('Lessons tab → Save: only step 2\'s words changed in first-game.json, the rest byte-for-byte')
    else fail(`Lessons tab → Save: first-game.json isn't the old file with just step 2's words changed:\n${now}`)
    const oldBoard = JSON.parse(EN_TEXT).lessons['first-game'].board.mouse
    const enExpected = EN_TEXT.replace(JSON.stringify(oldBoard), JSON.stringify(NEW_BOARD))
    if (enExpected !== EN_TEXT && enNow === enExpected) pass('Lessons tab → Save: only step 1\'s typed words changed in en.json, every other byte as it was')
    else fail(`Lessons tab → Save: en.json isn't the old file with just step 1's words changed:\n${enNow}`)
    if (pageKey && savesWithoutKey.length === 0 && now !== null) pass('Lessons tab → Save sent the Dev Kit key the page was served (F208)')
    else fail(pageKey ? `Save went without the page's Dev Kit key: ${savesWithoutKey.join(', ')}` : 'the page has no <meta name="devkit-key"> — the dev server didn\'t put the key in it')
  }
} catch (error) {
  fail(error.message)
  await browser.contexts()[0]?.pages()[0]?.screenshot({ path: `${OUT}/devkit-live-failed.png` })
} finally {
  await browser.close()
  await server.close()
}
console.log(failures ? `\nDEVKIT-LIVE FAILED — ${failures} problem(s)` : '\nDEVKIT-LIVE OK — a Tuning edit changed the running game; both pauses held the bot; a Lessons tab edit reached the running tutorial, typed words changed the bubble on screen, and Save changed only them')
process.exit(failures ? 1 : 0)
