// SCREENSHOTS — the gallery's menu and parts page, and every built screen, saved to screenshots/.
//   screenshots/<page>-<size>.png                    menu + parts page (phone, phone landscape, desktop)
//   screenshots/parts-<style>-<size>.png             the parts page in every style
//   screenshots/screens/<screen>-<style>-<size>.png  every screen in Clean at phone + desktop,
//                                                    and the key screens in every style
// Starts its own Vite server on port 5180 and uses Playwright's own Chromium (never your Chrome).
// Reports what to fix: sideways overflow, controls clipped at a box edge, tap targets under 44px, console errors, a focus ring
// showing without any keyboard use, and anything wrong with the screen stack (Esc, Back, covered screens).
// Usage: npm run shoot
import { mkdirSync, readdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { screenIds } from '../gallery/menu.ts'
import { findProblems } from '../kit/uiProblems.mjs'

// Preset names = the JSON files in kit/styles/
const presetNames = readdirSync('kit/styles').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
// Shown in every style, for picking a style and catching a style that breaks one of them
const keyScreens = ['menu', 'settings', 'pause', 'results', 'endgame', 'endgamedim', 'lobby', 'room', 'seats', 'hud', 'huddock', 'chips', 'pinned', 'hand', 'emotes']
// Also shot on a landscape phone (short screens squeeze these most), in every style
const landscapeScreens = ['feedback', 'lobby', 'room', 'roomauto', 'endgame', 'endgamedim', 'chips', 'pinned', 'hand', 'hud', 'huddock', 'menu']

const sizes = {
  phone: { name: 'phone', width: 390, height: 844, mobile: true },
  landscape: { name: 'phone-landscape', width: 844, height: 390, mobile: true },
  desktop: { name: 'desktop', width: 1440, height: 900, mobile: false },
}

// What's wrong on screen (wider than the screen, controls under 44×44, clipped, overlapping, a focus ring with no
// keyboard use) — the same check a game's npm run check:framework runs on the real game (kit/uiProblems.mjs).
// (Phones quietly zoom out to fit wide pages, so it compares against the real screen width.)

mkdirSync('screenshots/screens', { recursive: true })
// SHOOT_PORT=5281 npm run shoot — when 5180 is busy (the gallery already open, or another helper running)
const PORT = Number(process.env.SHOOT_PORT) || 5180
const server = await createServer({ server: { port: PORT, strictPort: true } })
await server.listen()
const browser = await chromium.launch()
let problemCount = 0
let shotCount = 0

// One page per size, reused for every shot at that size
const pages = {}
async function pageFor(size) {
  if (pages[size.name]) return pages[size.name]
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.mobile ? 2 : 1, isMobile: size.mobile, hasTouch: size.mobile,
  })
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()))
  return (pages[size.name] = page)
}

function report(name, problems) {
  problemCount += problems.length
  console.log(`${problems.length ? '✗' : '✓'} ${name}${problems.map((p) => `\n    ${p}`).join('')}`)
}

// query: the gallery link, e.g. '?screen=settings&preset=neon'. prepare: clicks etc. before the shot.
async function shoot(file, size, query, prepare) {
  const page = await pageFor(size)
  page.errors = []
  await page.goto(`http://localhost:${PORT}/${query}`)
  const isScreen = query.includes('screen=') && !query.includes('screen=parts')
  // (a VISIBLE screen: Pause opens over the HUD, which then hides — the first .kit-screen on the page)
  await page.waitForSelector(isScreen ? '.gallery-game .kit-screen >> visible=true' : '.gallery')
  await page.evaluate(() => document.fonts.ready)
  if (prepare) await prepare(page)
  // let entrances and transitions finish (Results rows arrive one after another, so they take longer)
  await page.waitForTimeout(/screen=(results|endgame)/.test(query) ? 1300 : 700)
  await page.screenshot({ path: `screenshots/${file}.png`, fullPage: true })
  shotCount++
  report(`${file}.png`, [...page.errors, ...(await page.evaluate(findProblems, { screenWidth: size.width, checkFocus: !prepare }))])
}

// Screen stack (on the parts page's demo): open → dialog on top → Esc → Esc ends back at the start;
// covered screens can't be clicked; the browser/phone Back button closes a screen too.
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
    await page.goto(`http://localhost:${PORT}/?screen=parts`)
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
    if (!page.url().includes('screen=parts')) problems.push('Back button left the parts page')
    // The dialog's Quit closes both screens at once
    await button('Open settings').click()
    await button('Quit…').click()
    await button('Quit').last().click()
    await expectLayers(1, 'Quit closes both')
  } catch (e) {
    problems.push(e.message.split('\n')[0]) // a step couldn't happen, e.g. two screens where one should be
  }
  report(`screen stack (${size.name})`, problems)
  await page.close()
}

// Gallery menu: a screen opens from the menu, its own Back returns to the menu, and so does
// Esc / the phone's Back once the last screen closes
async function checkMenu(size) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, isMobile: size.mobile, hasTouch: size.mobile })
  const problems = []
  try {
    await page.goto(`http://localhost:${PORT}/`)
    await page.getByRole('button', { name: /^Credits/ }).click()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page.waitForSelector('.gallery', { timeout: 2000 })
    await page.getByRole('button', { name: /^Pause/ }).click()
    await page.getByRole('button', { name: 'Resume' }).waitFor({ timeout: 2000 })
    await page.keyboard.press('Escape') // Pause closes, the HUD stays
    await page.waitForFunction(() => document.querySelectorAll('.gallery-game .kit-layer').length === 2, null, { timeout: 2000 })
    await page.goBack() // the phone's Back closes the HUD → menu
    await page.waitForSelector('.gallery', { timeout: 2000 })
  } catch (e) {
    problems.push(e.message.split('\n')[0])
  }
  report(`gallery menu ↔ screens (${size.name})`, problems)
  await page.close()
}

const started = Date.now()
try {
  await checkScreens(sizes.phone)
  await checkScreens(sizes.desktop)
  await checkMenu(sizes.phone)
  // The gallery's own pages
  for (const size of Object.values(sizes)) {
    await shoot(`menu-${size.name}`, size, '')
    await shoot(`parts-${size.name}`, size, '?screen=parts')
  }
  // Accessibility floor: browser text size at 200%
  await shoot('parts-phone-text-200', sizes.phone, '?screen=parts', (page) => page.evaluate(() => { document.documentElement.style.fontSize = '200%' }))
  // Live restyle: change a tweak with the dev switcher and check it repaints
  await shoot('menu-desktop-tweaked', sizes.desktop, '', async (page) => {
    await page.getByLabel('Next Corners').click()
    await page.getByLabel('Next Spacing').click()
    await page.locator('.gallery-colour').fill('#b0306a')
  })
  for (const preset of presetNames) {
    await shoot(`parts-${preset}-phone`, sizes.phone, `?screen=parts&preset=${preset}`)
    await shoot(`parts-${preset}-desktop`, sizes.desktop, `?screen=parts&preset=${preset}`)
  }
  // Every screen in Clean, then the key screens in the other styles
  const shots = [
    ...screenIds.map((id) => [id, 'clean']),
    ...presetNames.filter((p) => p !== 'clean').flatMap((preset) => keyScreens.map((id) => [id, preset])),
  ]
  for (const [id, preset] of shots) {
    for (const size of [sizes.phone, sizes.desktop]) await shoot(`screens/${id}-${preset}-${size.name}`, size, `?screen=${id}&preset=${preset}`)
  }
  for (const preset of presetNames) {
    for (const id of landscapeScreens) await shoot(`screens/${id}-${preset}-${sizes.landscape.name}`, sizes.landscape, `?screen=${id}&preset=${preset}`)
  }
  // Copy the room code: the toast shows (or, where the clipboard is refused, the code is selected) — no errors
  await shoot('screens/room-copied-cartoon-desktop', sizes.desktop, '?screen=room&preset=cartoon',
    (page) => page.getByRole('button', { name: 'Copy' }).click())
} finally {
  await browser.close()
  await server.close()
}
console.log(`\n${shotCount} screenshots in ${Math.round((Date.now() - started) / 1000)} s`)
console.log(problemCount ? `${problemCount} problem(s) found` : 'No overflow, clipped controls, small targets, stray focus rings or console errors found')
process.exit(problemCount ? 1 : 0)
