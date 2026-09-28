// SCREENSHOTS — the gallery at phone portrait, phone landscape and desktop, saved to screenshots/.
// Starts its own Vite server on port 5180 and uses Playwright's own Chromium (never your Chrome).
// Also reports two things to fix: sideways overflow, and tap targets smaller than 44px.
// Usage: npm run shoot
import { mkdirSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright'

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
  await page.goto('http://localhost:5180/')
  await page.waitForSelector('.kit-screen')
  if (prepare) await prepare(page)
  await page.waitForTimeout(300) // let transitions finish
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true })
  const problems = [...errors, ...(await page.evaluate(findProblems, size.width))]
  problemCount += problems.length
  console.log(`${problems.length ? '✗' : '✓'} ${name}.png${problems.map((p) => `\n    ${p}`).join('')}`)
  await page.close()
}

try {
  for (const size of sizes) await shoot(size.name, size)
  // Accessibility floor: browser text size at 200%
  await shoot('phone-portrait-text-200', sizes[0], (page) => page.evaluate(() => { document.documentElement.style.fontSize = '200%' }))
  // Live restyle: change a tweak with the dev switcher and check it repaints
  await shoot('desktop-tweaked', sizes[2], async (page) => {
    await page.getByLabel('Next Corners').click()
    await page.getByLabel('Next Spacing').click()
    await page.locator('.gallery-colour').fill('#b0306a')
  })
} finally {
  await browser.close()
  await server.close()
}
console.log(problemCount ? `\n${problemCount} problem(s) found` : '\nNo overflow or small targets found')
process.exit(problemCount ? 1 : 0)
