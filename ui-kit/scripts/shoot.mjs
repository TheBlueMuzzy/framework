// SCREENSHOTS — the gallery at phone portrait, phone landscape and desktop, plus every style preset, saved to screenshots/.
// Starts its own Vite server on port 5180 and uses Playwright's own Chromium (never your Chrome).
// Also reports two things to fix: sideways overflow, and tap targets smaller than 44px.
// Usage: npm run shoot
import { mkdirSync, readdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'
// Preset names = the JSON files in kit/styles/
const presetNames = readdirSync('kit/styles').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))

const sizes = [
  { name: 'phone-portrait', width: 390, height: 844, mobile: true },
  { name: 'phone-landscape', width: 844, height: 390, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
]

// Finds visible controls smaller than 44×44 and anything wider than the screen.
// (Phones quietly zoom out to fit wide pages, so compare against the real screen width.)
function findProblems(screenWidth) {
  const problems = []
  if (document.documentElement.scrollWidth > screenWidth) {
    problems.push(`page is wider than the screen (${document.documentElement.scrollWidth} > ${screenWidth})`)
  }
  for (const el of document.querySelectorAll('button, input, [role="switch"], [role="tab"], [tabindex="0"]')) {
    const box = el.getBoundingClientRect()
    if (box.width === 0) continue // hidden
    if (box.width < 43.5 || box.height < 43.5) {
      problems.push(`small target ${Math.round(box.width)}×${Math.round(box.height)}: ${el.getAttribute('aria-label') ?? el.textContent?.trim()}`)
    }
  }
  return problems
}

mkdirSync('screenshots', { recursive: true })
const server = await createServer({ server: { port: 5180, strictPort: true } })
await server.listen()
const browser = await chromium.launch()
let problemCount = 0

async function shoot(name, size, prepare) {
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.mobile ? 2 : 1, isMobile: size.mobile, hasTouch: size.mobile,
  })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(`http://localhost:5180/${size.query ?? ''}`)
  await page.waitForSelector('.kit-screen')
  await page.evaluate(() => document.fonts.ready)
  if (prepare) await prepare(page)
  await page.waitForTimeout(600) // let entrances and transitions finish
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true })
  const problems = [...errors, ...(await page.evaluate(findProblems, size.width))]
  problemCount += problems.length
  console.log(`${problems.length ? '✗' : '✓'} ${name}.png${problems.map((p) => `\n    ${p}`).join('')}`)
  await page.close()
}

// Screen stack: open → dialog on top → Esc → Esc ends back at the start; covered screens can't be clicked;
// the browser/phone Back button closes a screen too. Saves screens-dialog-<size>.png of the demo.
async function checkScreens(size) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, isMobile: size.mobile, hasTouch: size.mobile })
  const problems = []
  const expectLayers = async (count, step) => {
    const ok = await page.waitForFunction((n) => document.querySelectorAll('.gallery-screens .kit-layer').length === n, count, { timeout: 2000 })
      .then(() => true, () => false)
    if (!ok) problems.push(`${step}: expected ${count - 1} open screen(s)`)
  }
  const button = (name) => page.locator('.gallery-screens .kit-button', { hasText: name })
  // A covered button must ignore clicks (if it reacted, the number of screens would change)
  // and must not take keyboard/gamepad focus.
  const checkCovered = async (name, layers) => {
    const box = await button(name).boundingBox()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expectLayers(layers, `clicking covered "${name}"`)
    if (await button(name).evaluate((el) => { el.focus(); return document.activeElement === el })) problems.push(`covered "${name}" took focus`)
  }
  try {
    await page.goto('http://localhost:5180/')
    await button('Open settings').scrollIntoViewIfNeeded()
    await button('Open settings').click()
    await expectLayers(2, 'open settings')
    await checkCovered('Open settings', 2)
    await button('Quit…').click()
    await expectLayers(3, 'open dialog')
    await checkCovered('Open settings', 3)
    // The dialog sits right over the settings panel, so its buttons are checked by focus only
    if (await button('Back').evaluate((el) => { el.focus(); return document.activeElement === el })) problems.push('covered "Back" took focus')
    await page.waitForTimeout(600)
    await page.locator('.gallery-screens').screenshot({ path: `screenshots/screens-dialog-${size.name}.png` })
    await page.keyboard.press('Escape')
    await expectLayers(2, 'first Esc')
    await page.keyboard.press('Escape')
    await expectLayers(1, 'second Esc')
    // Phone/browser Back closes the top screen and stays on the page
    await button('Open settings').click()
    await expectLayers(2, 'reopen settings')
    await page.goBack()
    await expectLayers(1, 'Back button')
    if (!page.url().startsWith('http://localhost:5180/')) problems.push('Back button left the page')
    // The dialog's Quit closes both screens at once
    await button('Open settings').click()
    await button('Quit…').click()
    await button('Quit').last().click()
    await expectLayers(1, 'Quit closes both')
  } catch (e) {
    problems.push(e.message.split('\n')[0]) // a step couldn't happen, e.g. two screens where one should be
  }
  problemCount += problems.length
  console.log(`${problems.length ? '✗' : '✓'} screen stack (${size.name})${problems.map((p) => `\n    ${p}`).join('')}`)
  await page.close()
}

try {
  await checkScreens(sizes[0])
  await checkScreens(sizes[2])
  for (const size of sizes) await shoot(size.name, size)
  // Accessibility floor: browser text size at 200%
  await shoot('phone-portrait-text-200', sizes[0], (page) => page.evaluate(() => { document.documentElement.style.fontSize = '200%' }))
  // Live restyle: change a tweak with the dev switcher and check it repaints
  await shoot('desktop-tweaked', sizes[2], async (page) => {
    await page.getByLabel('Next Corners').click()
    await page.getByLabel('Next Spacing').click()
    await page.locator('.gallery-colour').fill('#b0306a')
  })
  // Every style preset at phone and desktop size: <preset>-phone.png, <preset>-desktop.png
  for (const preset of presetNames) {
    await shoot(`${preset}-phone`, { ...sizes[0], query: `?preset=${preset}` })
    await shoot(`${preset}-desktop`, { ...sizes[2], query: `?preset=${preset}` })
  }
} finally {
  await browser.close()
  await server.close()
}
console.log(problemCount ? `\n${problemCount} problem(s) found` : '\nNo overflow or small targets found')
process.exit(problemCount ? 1 : 0)
