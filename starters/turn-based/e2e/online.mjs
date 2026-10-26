// ONLINE — two browser tabs play each other through the real room server (wrangler dev, on this computer only —
// nothing is deployed).
//   node e2e/online.mjs [outDir] [vitePort] [serverPort]          (npm run e2e:online)
// Tab A: Play online → Create a room. Tab B: Play online → types A's code → Join. A starts the game. Each tab taps a
// free square on its own turn until both show the result; A sends an emote and B sees its bubble. Screenshots of
// both tabs (lobby, mid-game, results). Any console error or page error fails it.
// Starts its OWN dev server (6403) and room server (6499, its storage in a folder of its own — PERSIST_TO, default
// .wrangler/state-e2e) and stops both at the end.
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { unstable_dev } from 'wrangler'
import { chromium } from 'playwright-core'
import { checkVersion } from '../src/version/e2e.mjs'

const OUT = process.argv[2] ?? 'e2e-shots'
const PORT = Number(process.argv[3] ?? 6403)
const SERVER_PORT = Number(process.argv[4] ?? 6499)
mkdirSync(OUT, { recursive: true })
let failures = 0
let a, b // the two tabs
const fail = (why) => { failures++; console.log(`  FAIL ${why}`) }

// The room server first; the game's pages connect to it (VITE_PARTY_HOST — the rooms client's address)
const roomServer = await unstable_dev('party/worker.ts', {
  config: 'wrangler.json', port: SERVER_PORT, ip: '127.0.0.1', persistTo: process.env.PERSIST_TO ?? '.wrangler/state-e2e',
  logLevel: 'warn', experimental: { disableExperimentalWarning: true },
})
process.env.VITE_PARTY_HOST = `127.0.0.1:${SERVER_PORT}`
const server = await createServer({ server: { port: PORT, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()

async function openTab(name, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()
  page.noise = []
  page.on('console', (m) => { if (m.type() === 'error') page.noise.push(`${name} console error: ${m.text()}`) })
  page.on('pageerror', (e) => page.noise.push(`${name} page error: ${e.message}`))
  await page.goto(`http://127.0.0.1:${PORT}/`)
  await checkVersion(page)
  await page.getByRole('button', { name: 'Play online' }).click()
  return page
}

const finished = (page) => page.getByRole('heading', { name: /win|draw/i }).count()

try {
  a = await openTab('A', 390, 844)
  b = await openTab('B', 1440, 900)

  await a.getByRole('button', { name: 'Create a room' }).click()
  await a.getByText(/Room [A-Z]{4}/).waitFor()
  const code = (await a.getByText(/Room [A-Z]{4}/).first().textContent()).match(/[A-Z]{4}/)[0]
  console.log(`room ${code}`)

  await b.locator('input').nth(1).click() // the first box of the room code (the name box is the first input)
  await b.keyboard.type(code)
  await b.getByRole('button', { name: 'Join', exact: true }).click()
  await a.getByRole('button', { name: 'Start game' }).waitFor()
  await a.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => x.textContent?.includes('Start game') && !x.disabled))
  await a.screenshot({ path: `${OUT}/online-A-lobby.png` })
  await a.getByRole('button', { name: 'Start game' }).click()
  await a.locator('[data-board]').waitFor()
  await b.locator('[data-board]').waitFor()
  console.log('  both tabs see the board')

  // A says hello from its own seat; B sees the bubble
  await a.locator('[data-emote-mine]').first().click()
  await a.getByRole('button', { name: 'Hello!' }).click()
  await b.getByText('Hello!').first().waitFor({ timeout: 5000 })
  console.log('  B saw A\'s emote')

  let moves = 0
  for (let step = 0; step < 300 && !(await finished(a) && await finished(b)); step++) {
    for (const page of [a, b]) {
      if (!(await page.getByText('Your turn').count())) continue
      const free = page.locator('[data-board] [data-mark=""]:not([aria-disabled])')
      if (await free.count()) {
        await free.first().click()
        moves++
        if (moves === 3) {
          await a.screenshot({ path: `${OUT}/online-A-game.png` })
          await b.screenshot({ path: `${OUT}/online-B-game.png` })
        }
      }
    }
    await a.waitForTimeout(100) // a polling step: each move goes to the server and back
  }
  if (!(await finished(a)) || !(await finished(b))) fail('the game never ended on both tabs')
  else {
    const titleA = (await a.getByRole('heading', { name: /win|draw/i }).first().textContent()).trim()
    const titleB = (await b.getByRole('heading', { name: /win|draw/i }).first().textContent()).trim()
    console.log(`  over after ${moves} moves — A: "${titleA}" · B: "${titleB}"`)
    // Both boards must be the same board
    const boardOf = (page) => page.locator('[data-board] [data-cell]').evaluateAll((cells) => cells.map((c) => c.dataset.mark).join(','))
    if (await boardOf(a) !== await boardOf(b)) fail('the two tabs show different boards')
    await a.waitForTimeout(600)
    await a.screenshot({ path: `${OUT}/online-A-results.png` })
    await b.screenshot({ path: `${OUT}/online-B-results.png` })
  }
  const noise = [...a.noise, ...b.noise]
  if (noise.length) fail(`console not clean:\n    ${noise.join('\n    ')}`)
  else console.log('  consoles clean')
} catch (error) {
  fail(error.message)
  await a?.screenshot({ path: `${OUT}/online-A-failed.png` })
  await b?.screenshot({ path: `${OUT}/online-B-failed.png` })
  for (const line of [...(a?.noise ?? []), ...(b?.noise ?? [])]) console.log(`    ${line}`)
} finally {
  await browser.close()
  await server.close()
  await roomServer.stop()
}
console.log(failures ? `\nONLINE FAILED — ${failures} problem(s)` : '\nONLINE OK — two tabs played a whole game through the room server')
process.exit(failures ? 1 : 0)
