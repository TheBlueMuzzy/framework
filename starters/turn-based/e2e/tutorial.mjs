// THE FIRST-GAME TUTORIAL — a brand-new device gets the 3-step lesson on its first game against the computer, built
// from the Tutorial module + UI kit blocks (src/tutorial-game/firstGame.ts, src/ui/LessonView.tsx).
//   node e2e/tutorial.mjs [outDir] [port]
// At 390×844 and 1440×900 (and on their sides, 844×390 and 768×343 — style.json orientation "any"), with ?tutorial=fresh
// (a scripted check is otherwise a returning device, so the other e2e scripts never see the lesson):
//   1 "This is your board…" — Tap on a phone, Click with a mouse; the Spotlight lights the board; a tap moves it on
//   2 "Three in a row wins…" + Got it — the board lit; the bot's answer waits until it's closed
//   3 "Now beat Careless Cass!" + Play — the bot's seat lit
// On every step: the words show, the spotlight's outline goes round the right thing, and the bubble (its box and its
// pointer, as drawn on screen) covers none of the board's squares and stays inside the window. Then: the game goes on
// with no lesson; Pause → Settings → Gameplay → Replay tutorial plays it again from step 1; a second load of the page
// (the same device) doesn't show it. Console clean. Shots of every step go in outDir.
// Starts its OWN dev server and closes only that one.
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import { checkVersion } from '../src/version/e2e.mjs'

const OUT = process.argv[2] ?? 'e2e-shots'
const PORT = Number(process.argv[3] ?? 6405)
mkdirSync(OUT, { recursive: true })
const URL_ = `http://127.0.0.1:${PORT}/?tutorial=fresh`
const SIZES = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'phone-side', width: 844, height: 390, mobile: true },
  { name: 'small-side', width: 768, height: 343, mobile: true },
]
const WORDS = {
  board: { phone: 'This is your board. Tap a square to place your ✕.', mouse: 'This is your board. Click a square to place your ✕.' },
  rows: 'Three in a row wins — across, down or corner to corner.',
  beat: 'Now beat Careless Cass!',
  nudge: 'Go on — tap any empty square.',
}

const server = await createServer({ server: { port: PORT, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()
let failures = 0
const fail = (why) => { failures++; console.log(`  FAIL ${why}`) }
const check = (ok, why) => { if (!ok) fail(why) }

const box = async (locator) => {
  const r = await locator.evaluate((el) => { const b = el.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom } })
  return r
}
const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5

/** One step on screen: its words, the spotlight round `lit`, the bubble clear of every square and inside the window. */
async function checkStep(page, size, n, words, lit) {
  const bubble = page.locator('.kit-callout-layer[data-ready] .kit-callout')
  await bubble.waitFor({ timeout: 8000 })
  // (in the bubble: the Dev Kit's hidden Lessons tab holds the same words in its boxes — Dev Kit 0.30.0)
  await bubble.getByText(words, { exact: true }).waitFor({ timeout: 4000 }).catch(async () => fail(`step ${n}: the words "${words}" don't show (got "${(await bubble.innerText()).trim()}")`))
  await page.waitForTimeout(400) // (the bubble and the outline settle on their places)
  // The spotlight's outline goes round what's taught: it holds the thing, with room round it
  const ring = page.locator('.kit-spot-ring:not([data-gone])')
  check(await ring.count() === 1, `step ${n}: ${await ring.count()} spotlight outlines (want 1)`)
  const r = await box(ring.first()), t = await box(page.locator(lit).first())
  const room = Math.min(t.left - r.left, t.top - r.top, r.right - t.right, r.bottom - t.bottom)
  check(room >= 0, `step ${n}: the spotlight's outline doesn't go round ${lit} (${JSON.stringify(r)} vs ${JSON.stringify(t)})`)
  // The bubble as the player sees it (its box and its pointer) covers no square, and stays in the window
  const seen = [await box(bubble), await box(page.locator('.kit-callout-layer[data-ready] .kit-callout-tip'))]
  const cells = await page.locator('[data-cell]').evaluateAll((els) => els.map((el) => { const b = el.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom } }))
  const covered = cells.filter((c) => seen.some((s) => overlap(s, c)))
  check(covered.length === 0, `step ${n}: the bubble covers ${covered.length} square(s)`)
  const gap = (a, b) => Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom)
  const toSquares = Math.min(...cells.map((c) => gap(seen[0], c)))
  // the pointer's tip keeps clear of the spotlight's outline (it sits off the hole's edge: the outline is drawn inside it)
  const tipToOutline = gap(seen[1], r)
  check(tipToOutline >= 0, `step ${n}: the bubble's pointer runs onto the spotlight's outline (${tipToOutline.toFixed(1)} px)`)
  const inside = seen[0].left >= 0 && seen[0].top >= 0 && seen[0].right <= size.width && seen[0].bottom <= size.height
  check(inside, `step ${n}: the bubble runs off the window ${JSON.stringify(seen[0])}`)
  console.log(`  step ${n}: outline ${room.toFixed(1)} px round ${lit} · bubble ${toSquares.toFixed(1)} px from the nearest square · pointer tip ${tipToOutline.toFixed(1)} px off the outline`)
  await page.screenshot({ path: `${OUT}/tutorial-${size.name}-${n}.png` })
}

const press = (size, locator) => (size.mobile ? locator.tap() : locator.click())
/** A step's button (it only works after dismissArmSeconds: pressed until the words change). */
async function pressButton(page, size, name, words) {
  for (let tries = 0; tries < 20 && (await page.locator('.kit-callout').getByText(words, { exact: true }).count()); tries++) {
    await press(size, page.locator('.kit-callout').getByRole('button', { name }))
    await page.waitForTimeout(150)
  }
}

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
    const play = page.getByRole('button', { name: 'Play Careless Cass' })
    await play.waitFor()
    await press(size, play)
    await page.locator('[data-board]').waitFor()

    // 1 — the board, waiting for a move
    await checkStep(page, size, 1, size.mobile ? WORDS.board.phone : WORDS.board.mouse, '[data-board]')
    check(await page.getByText('Your turn').count() === 1, 'step 1: it isn\'t your turn (the lesson starts with you)')
    if (size === SIZES[0]) {
      // the UI kit's nudge timer (content/tuning/lessons.json: glow at 6 s, words at 12 s with no move)
      await page.locator('.kit-spot-layer[data-pulse]').waitFor({ timeout: 10000 })
        .then(() => console.log('  nudge ✓ the board glows'), () => fail('nudge: the board never glowed'))
      await page.getByText(WORDS.nudge, { exact: true }).waitFor({ timeout: 10000 })
        .then(() => console.log('  nudge ✓ "Go on…"'), () => fail('nudge: the words never changed'))
      await page.screenshot({ path: `${OUT}/tutorial-${size.name}-1-nudge.png` })
    }
    await press(size, page.locator('[data-cell="4"]'))
    // 2 — three in a row; the bot's answer waits under it
    await checkStep(page, size, 2, WORDS.rows, '[data-board]')
    await page.waitForTimeout(1500) // longer than the bot's think time
    check(await page.locator('[data-mark="1"]').count() === 0, 'step 2: the bot moved while the words were up')
    await pressButton(page, size, 'Got it', WORDS.rows)
    // 3 — beat them; the bot's seat lit
    await checkStep(page, size, 3, WORDS.beat, '[data-seat=bot]')
    await pressButton(page, size, 'Play', WORDS.beat)
    await page.waitForTimeout(500)
    check(await page.locator('.kit-callout-layer, .kit-spot-layer').count() === 0, 'after Play: the lesson is still on screen')
    check(await page.locator('[data-mark="1"]').count() === 1, 'after Play: the bot hasn\'t answered')
    console.log('  lesson over ✓ the game goes on')

    // Replay tutorial (Settings → Gameplay) plays it again from step 1 on a new board
    await press(size, page.getByRole('button', { name: 'Pause' }))
    await press(size, page.getByRole('button', { name: 'Settings' }))
    // (a wide Settings has tabs; a narrow one a ◀ Audio ▶ picker)
    const tab = page.getByRole('tab', { name: 'Gameplay' })
    await page.getByRole('button', { name: 'Back' }).waitFor()
    await press(size, (await tab.isVisible()) ? tab : page.getByRole('button', { name: 'Next Settings' }))
    await press(size, page.getByRole('button', { name: 'Replay tutorial' }))
    await page.locator('.kit-callout').getByText(size.mobile ? WORDS.board.phone : WORDS.board.mouse, { exact: true }).waitFor({ timeout: 5000 })
      .then(() => console.log('  Replay tutorial ✓ step 1 again'), () => fail('Replay tutorial: step 1 didn\'t show'))
    check(await page.locator('[data-board] [data-mark=""]').count() === 9, 'Replay tutorial: the board isn\'t a new one')

    // A second load on the same device: no lesson
    await page.goto(URL_)
    await press(size, play)
    await page.locator('[data-board]').waitFor()
    await page.waitForTimeout(1200)
    check(await page.locator('.kit-callout-layer, .kit-spot-layer').count() === 0, 'second load: the lesson showed again')
    console.log('  second load ✓ no lesson')

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
console.log(failures ? `\nTUTORIAL FAILED — ${failures} problem(s)` : '\nTUTORIAL OK — the 3 steps at 4 sizes, Replay, no lesson on a second load, console clean')
process.exit(failures ? 1 : 0)
