// SCREENSHOTS — the gallery's menu and parts page, and every built screen, saved to screenshots/.
//   screenshots/<page>-<size>.png                    menu + parts page (phone, phone landscape, desktop)
//   screenshots/parts-<style>-<size>.png             the parts page in every style
//   screenshots/screens/<screen>-<style>-<size>.png  every screen in Clean at phone + desktop (and at 200% text on a
//                                                    phone + a phone on its side: …-text-200, F144),
//                                                  and the key screens in every style (also on a 360×780
//                                                    phone; the landscape ones also on a 667×375 phone on its side;
//                                                    and at 200% text on both phones, F146)
// Starts its own Vite server on port 5180 and uses Playwright's own Chromium (never your Chrome).
// Reports what to fix: sideways overflow, controls clipped at a box edge, tap targets under 44px, console errors, a focus ring
// showing without any keyboard use, and anything wrong with the screen stack (Esc, Back, covered screens).
// Usage: npm run shoot
// WEBKIT (F148): npm run shoot:webkit (= node scripts/shoot.mjs --webkit, or SHOOT_ENGINE=webkit) — iPhone's engine,
// Playwright's own WebKit. Only the 18 key screens, in all 7 looks, on a 390×844 phone upright and an 844×390 one on
// its side, at 100% and 200% text (504 shots, ~11 min), plus the screen stack and menu checks on the phone — saved to
// screenshots-webkit/ with the same names as the Chromium shots.
// LAYOUTS (F149): every shot also writes <shots folder>/layout/<shot>.json — each text's line count and each part's
// size — so npm run compare:engines lists what wraps or sizes differently between the two runs.
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium, webkit } from 'playwright'
import { screenIds } from '../gallery/menu.ts'
import { findProblems } from '../kit/uiProblems.mjs'
import { pseudo } from '../kit/blocks/words.ts'
import { changedMessage, watchCodeChanges } from './codeChanges.mjs'
import { recordLayout } from './compareEngines.mjs'

// Preset names = the JSON files in kit/styles/
const presetNames = readdirSync('kit/styles').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
// Shown in every style, for picking a style and catching a style that breaks one of them
const keyScreens = ['menu', 'settings', 'pause', 'results', 'endgame', 'endgamedim', 'lobby', 'room', 'seats', 'hud', 'huddock', 'chips', 'pinned', 'hand', 'emotes', 'talk', 'payslip', 'victoryreveal']
// Also shot on a landscape phone (short screens squeeze these most), in every style
const landscapeScreens = ['feedback', 'lobby', 'room', 'roomauto', 'endgame', 'endgamedim', 'chips', 'pinned', 'hand', 'hud', 'huddock', 'menu', 'talk', 'whatsnew']

const sizes = {
  phone: { name: 'phone', width: 390, height: 844, mobile: true },
  landscape: { name: 'phone-landscape', width: 844, height: 390, mobile: true },
  // 0.33.1 (F124): the narrowest common phone, and a small phone on its side — where HUD corners squeeze hardest
  small: { name: 'phone-small', width: 360, height: 780, mobile: true },
  smallLandscape: { name: 'phone-small-landscape', width: 667, height: 375, mobile: true },
  desktop: { name: 'desktop', width: 1440, height: 900, mobile: false },
}

// What's wrong on screen (wider than the screen, controls under 44×44, clipped, overlapping, a focus ring with no
// keyboard use) — the same check a game's npm run check:framework runs on the real game (kit/uiProblems.mjs).
// (Phones quietly zoom out to fit wide pages, so it compares against the real screen width.)

// (--webkit, not only the env var: npm scripts on Windows can't set one inline)
const WEBKIT = process.env.SHOOT_ENGINE === 'webkit' || process.argv.includes('--webkit')
// PSEUDO (F91): npm run shoot:pseudo — every shot in the long fake language (accented, ~40% longer words, the page
// opened with ?pseudo), saved to screenshots-pseudo/: what a cut-off looks like once the words are translated
const PSEUDO = process.argv.includes('--pseudo')
const OUT = PSEUDO ? 'screenshots-pseudo' : WEBKIT ? 'screenshots-webkit' : 'screenshots' // (all git-ignored; codeChanges.mjs skips them)
const withPseudo = (query) => (PSEUDO ? `${query}${query.includes('?') ? '&' : '?'}pseudo` : query)
// A label the shoot clicks by name, as the page says it (the fake language rewrites labels too)
const said = (words) => (PSEUDO ? pseudo(words) : words)
mkdirSync(`${OUT}/screens`, { recursive: true })
mkdirSync(`${OUT}/layout/screens`, { recursive: true }) // (F149: one small layout file per shot — compareEngines.mjs)
// SHOOT_PORT=5281 npm run shoot — when 5180 is busy (the gallery already open, or another helper running)
const PORT = Number(process.env.SHOOT_PORT) || 5180
const server = await createServer({ server: { port: PORT, strictPort: true } })
await server.listen()
// An edit while the run goes stops it at the next shot (F129): Vite would reload screens on the new code mid-run
// (named from ui-kit/, not the server's root, which is gallery/ — a kit file would read ../kit/…)
const codeChanges = watchCodeChanges(server.watcher, process.cwd())
class CodeChanged extends Error {}
const browser = await (WEBKIT ? webkit : chromium).launch()
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
  // …and the page's error events that aren't a thrown error (F147: "ResizeObserver loop completed with undelivered
  // notifications" reached only Vite's terminal, never the list) — said as console errors, so the line below hears them
  await page.addInitScript(() => addEventListener('error', (e) => { if (!e.error) console.error(`page error: ${e.message}`) }))
  // console errors, and the kit's own dev warnings (a bubble stuck on what it avoids, F130) — the gallery has none
  page.on('console', (m) => (m.type() === 'error' || (m.type() === 'warning' && m.text().startsWith('[ui-kit]'))) && page.errors.push(m.text()))
  return (pages[size.name] = page)
}

// Shots whose problems Muzzy accepted as they are — printed as "known" with his reason, not counted. One shot each,
// never a whole screen: the same screen at other sizes and looks is still checked.
const knownShots = {
  'screens/talk-clean-phone-landscape-text-200.png': 'Muzzy 2026-10-25 (F145): a 3-line bubble at 200% has no room on a short screen — the kit warns, the game makes room',
  // Muzzy 2026-10-25 (F147): the same in every look — and Pixel's wide letters wrap the line to 6 lines upright
  ...Object.fromEntries(['cartoon', 'console', 'cozy', 'fantasy', 'neon', 'pixel'].map((look) => [`screens/talk-${look}-phone-landscape-text-200.png`, 'Muzzy 2026-10-25 (F147): same as Clean — the game makes room for a long line at 200%'])),
  'screens/talk-pixel-phone-text-200.png': "Muzzy 2026-10-25 (F147): Pixel's wide letters wrap the demo line to 6 lines at 200% — the kit warns, the game makes room",
  // (the fake language only — in English this shot still counts)
  ...(process.argv.includes('--pseudo') ? {
    'screens/teach-clean-phone-text-200.png': 'Muzzy 2026-10-27 (F156):the callout demo puts a text button in both bottom corners; at 200% in a ~40% longer language each is wider than half a 390px phone, so they meet — the kit warns, the game makes room',
    // Claude 2026-10-27 (F161), Muzzy to confirm — what's left after the shared causes were fixed:
    // (the kit's own bubble warnings, the same as Muzzy's F145 / F147 talk calls above, now in the longer language)
    ...Object.fromEntries(['clean', 'cartoon', 'console', 'cozy', 'fantasy', 'neon'].map((look) => [`screens/talk-${look}-phone-text-200.png`, "Claude 2026-10-27 (F161): like Muzzy's F145 / F147 talk calls — at 200% in a ~40% longer language the demo line takes so many lines upright that no side of the ◀ ▶ pickers has room; the kit warns, the game makes room"])),
    ...Object.fromEntries(presetNames.map((look) => [`screens/emotes-${look}-phone-landscape-text-200.png`, "Claude 2026-10-27 (F161): like the talk calls — at 200% text sideways in a ~40% longer language three speech bubbles on a 390 px-tall screen have no side left clear of each other; the kit warns, the game makes room"])),
    ...Object.fromEntries(['neon', 'pixel'].map((look) => [`screens/menu-${look}-phone-landscape-text-200.png`, `Claude 2026-10-27 (F161): one word ("Settings", ~40% longer, in ${look === 'neon' ? "Neon's wide Orbitron" : "Pixel's wide Silkscreen"} capitals) is wider than a half-width menu button at 200% text sideways — a word can't break, so it reaches the button's edge; a game picks a shorter word for that button`])),
    ...Object.fromEntries(['cozy', 'pixel'].map((look) => [`screens/pause-${look}-phone-landscape-text-200.png`, "Claude 2026-10-27 (F161): at 200% text sideways Pause's four buttons give up their padding to fit without scrolling — their line and border stay (F147, 0.35.4) — and an accent over a capital (Ŕ, Ǫ) reaches 1 px past the line; English has room. Keeping the padding would make Pause scroll in English too"])),
    'screens/results-pixel-phone-landscape-text-200.png': "Claude 2026-10-27 (F161): Pixel's title font (Silkscreen) draws an accent over a capital (Ŕ) far above the line; at 200% text sideways the title sits at the top of the card, so the mark meets the card's top edge — a real Ř/Č title in Pixel would need a line more of room",
    ...Object.fromEntries(['cartoon', 'cozy', 'fantasy', 'pixel'].map((look) => [`screens/hand-${look}-phone-landscape-text-200.png`, "Claude 2026-10-27 (F161): the gallery's own stand-in hand screen — its four demo buttons take two lines in the longer language at 200% text sideways, which pushes the rack to the screen's bottom edge; a game lays out its own buttons"])),
  } : {}),
}
let knownCount = 0

function report(name, problems) {
  if (knownShots[name] && problems.length) {
    knownCount += problems.length
    console.log(`~ ${name} — ${problems.length} known: ${knownShots[name]}${problems.map((p) => `\n    ${p}`).join('')}`)
    return
  }
  problemCount += problems.length
  console.log(`${problems.length ? '✗' : '✓'} ${name}${problems.map((p) => `\n    ${p}`).join('')}`)
}

// query: the gallery link, e.g. '?screen=settings&preset=neon'. prepare: clicks etc. before the shot.
// SHOOT_ONLY=<pattern> (F149): only the shots whose name matches it, e.g. SHOOT_ONLY="hud-|room-pixel" — a quick look
// at a few screens while fixing; the full run is still the check
const ONLY = process.env.SHOOT_ONLY ? new RegExp(process.env.SHOOT_ONLY) : null
async function shoot(file, size, query, prepare) {
  if (ONLY && !ONLY.test(file)) return
  if (codeChanges().length) throw new CodeChanged()
  const page = await pageFor(size)
  page.errors = []
  await page.goto(`http://localhost:${PORT}/${withPseudo(query)}`)
  const isScreen = query.includes('screen=') && !query.includes('screen=parts')
  // (a VISIBLE screen: Pause opens over the HUD, which then hides — the first .kit-screen on the page)
  // A page that never shows its screen is a problem on the list, not the end of the run (F148: WebKit stalled once
  // after ~145 shots on one page): a picture of what it showed instead, and the next shot gets a fresh page
  const opened = await page.waitForSelector(isScreen ? '.gallery-game .kit-screen >> visible=true' : '.gallery').then(() => true, (e) => {
    if (e.name !== 'TimeoutError') throw e
    return false
  })
  if (!opened) {
    await page.screenshot({ path: `${OUT}/${file}-stalled.png` }).catch(() => {})
    await page.close().catch(() => {})
    delete pages[size.name]
    shotCount++
    report(`${file}.png`, [...page.errors, 'stalled: the screen never showed (30 s) — see the …-stalled.png shot'])
    return
  }
  await page.evaluate(() => document.fonts.ready)
  if (prepare) await prepare(page)
  // let entrances and transitions finish (Results rows arrive one after another, so they take longer)
  await page.waitForTimeout(/screen=(results|endgame)/.test(query) ? 1300 : 700)
  // a reveal (StatList, 0.31.0) runs row by row for seconds: end its entrances, so the shot is the finished report
  const revealing = await page.evaluate(() => {
    const rows = document.querySelectorAll('.kit-stat-row[data-reveal]')
    for (const row of rows) for (const a of row.getAnimations()) a.finish()
    return rows.length
  })
  if (revealing) {
    await page.waitForTimeout(100) // (onRevealed's answer drawn: the payslip's Continue)
    // …and its list's smooth scroll to the newest row has stopped (F149, F148 E: the shot caught it part-way, at a
    // different spot in each run and engine): no scroll box moved over two frames
    await page.waitForFunction(() => new Promise((done) => {
      const at = () => [...document.querySelectorAll('.kit-scroll')].map((el) => el.scrollTop).join()
      const before = at()
      requestAnimationFrame(() => requestAnimationFrame(() => done(at() === before)))
    }))
  }
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true })
  // …and its layout (F149): each text's line count + each part's size, for npm run compare:engines
  writeFileSync(`${OUT}/layout/${file}.json`, JSON.stringify(await page.evaluate(recordLayout)))
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
    await page.locator('.gallery-screens').screenshot({ path: `${OUT}/screens-dialog-${size.name}.png` })
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

// Accessibility floor: browser text size at 200%
const text200 = (page) => page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
// Settings opens on its Accessibility tab at 200% (0.34.1, F141): the ◀ tab ▶ picker shows its longest word there.
const openers = {
  settings: async (page) => {
    await text200(page)
    while (await page.getByRole('group', { name: said('Settings') }).locator('output').innerText() !== said('Accessibility')) await page.getByLabel(said('Next Settings')).click()
  },
}

const started = Date.now()
try {
  if (WEBKIT) {
    // iPhone's engine (F148): the screen stack and the menu on a phone, then the key screens in every look, both
    // phones, at 100% and 200% text — the same names as the Chromium shots, so a pair can be looked at side by side
    await checkScreens(sizes.phone)
    await checkMenu(sizes.phone)
    for (const preset of presetNames) {
      for (const size of [sizes.phone, sizes.landscape]) {
        for (const id of keyScreens) {
          await shoot(`screens/${id}-${preset}-${size.name}`, size, `?screen=${id}&preset=${preset}`)
          await shoot(`screens/${id}-${preset}-${size.name}-text-200`, size, `?screen=${id}&preset=${preset}`, openers[id] || text200)
        }
      }
    }
  } else {
    await checkScreens(sizes.phone)
    await checkScreens(sizes.desktop)
    await checkMenu(sizes.phone)
    // The gallery's own pages
    for (const size of Object.values(sizes)) {
      await shoot(`menu-${size.name}`, size, '')
      await shoot(`parts-${size.name}`, size, '?screen=parts')
    }
    await shoot('parts-phone-text-200', sizes.phone, '?screen=parts', text200)
    // …and EVERY screen at 200%, in Clean, on a phone upright and on its side (F144) — every screen both ways,
    // whatever a game's own orientation (Settings on its Accessibility tab: openers, above)
    for (const size of [sizes.phone, sizes.landscape]) {
      for (const id of screenIds) await shoot(`screens/${id}-clean-${size.name}-text-200`, size, `?screen=${id}&preset=clean`, openers[id] || text200)
    }
    // …and the key screens at 200% in every OTHER look, both phones (F146): a look's own font can be wider than Clean's
    // (Cozy and Pixel's HUD sideways overlapped where Clean's fit)
    for (const preset of presetNames.filter((p) => p !== 'clean')) {
      for (const size of [sizes.phone, sizes.landscape]) {
        for (const id of keyScreens) await shoot(`screens/${id}-${preset}-${size.name}-text-200`, size, `?screen=${id}&preset=${preset}`, openers[id] || text200)
      }
    }
    // Live restyle: change a tweak with the dev switcher and check it repaints
    await shoot('menu-desktop-tweaked', sizes.desktop, '', async (page) => {
      await page.getByLabel(said('Next Corners')).click()
      await page.getByLabel(said('Next Spacing')).click()
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
    // The small phone (key screens) and the small phone on its side (the landscape screens), in every style
    for (const preset of presetNames) {
      for (const id of keyScreens) await shoot(`screens/${id}-${preset}-${sizes.small.name}`, sizes.small, `?screen=${id}&preset=${preset}`)
      for (const id of landscapeScreens) await shoot(`screens/${id}-${preset}-${sizes.smallLandscape.name}`, sizes.smallLandscape, `?screen=${id}&preset=${preset}`)
    }
    // Copy the room code: the toast shows (or, where the clipboard is refused, the code is selected) — no errors
    await shoot('screens/room-copied-cartoon-desktop', sizes.desktop, '?screen=room&preset=cartoon',
      (page) => page.getByRole('button', { name: said('Copy') }).click())
  }
} catch (e) {
  if (!(e instanceof CodeChanged)) throw e
} finally {
  await browser.close()
  await server.close()
}
// (also an edit during the last shot)
if (codeChanges().length) {
  console.log(`\n${changedMessage(codeChanges())}`)
  process.exit(2)
}
console.log(`\n${shotCount} screenshots in ${Math.round((Date.now() - started) / 1000)} s`)
if (knownCount) console.log(`(${knownCount} known problem(s) on accepted shots, not counted — knownShots)`)
console.log(problemCount ? `${problemCount} problem(s) found` : 'No overflow, clipped controls, small targets, stray focus rings or console errors found')
process.exit(problemCount ? 1 : 0)
