// STYLE-PICK SHEET — one image of a screen in all 5 styles side by side, for picking a game's style.
// Usage: node scripts/pick-sheet.mjs [screen]     (default: settings — it shows the most parts:
//        tabs, sliders, switches, ◀ option ▶ and buttons; any id from gallery/menu.ts works, e.g. menu, hud)
// Saves screenshots/pick-sheet.png. Starts its own Vite server on port 5180 and uses Playwright's
// own Chromium (never your Chrome). The shots are phone-sized (390×844).
import { mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { screenIds } from '../gallery/menu.ts'

process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..')) // work from ui-kit/ wherever it's run from

// What each style feels like (design §3), printed under its name
const feels = {
  clean: 'minimal, flat — the neutral default',
  cozy: 'paper, warm, wholesome',
  cartoon: 'casual mobile, party, bouncy',
  pixel: 'retro, 8-bit',
  neon: 'sci-fi, dark, glowing',
}
const presetNames = Object.keys(feels).filter((name) => readdirSync('kit/styles').includes(`${name}.json`))

const screen = process.argv[2] ?? 'settings'
if (!screenIds.includes(screen)) {
  console.log(`✗ No screen "${screen}". Pick one of: ${screenIds.join(', ')}`)
  process.exit(1)
}

const server = await createServer({ server: { port: 5180, strictPort: true } })
await server.listen()
const browser = await chromium.launch()

// 1. The screen in every style, at phone size
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const shots = []
for (const preset of presetNames) {
  await phone.goto(`http://localhost:5180/?screen=${screen}&preset=${preset}`)
  await phone.waitForSelector('.gallery-game .kit-screen')
  await phone.addStyleTag({ content: '.gallery-bar { display: none !important; }' }) // hide the gallery's own bar
  await phone.evaluate(() => document.fonts.ready)
  await phone.waitForTimeout(600) // let entrance animations finish
  shots.push({ preset, image: (await phone.screenshot()).toString('base64') })
  console.log(`✓ ${screen} in ${preset}`)
}

// 2. One plain page with the 5 shots in a row and their names, screenshotted once (no image library needed)
const sheet = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 })
await sheet.setContent(`<!doctype html>
<style>
  body { margin: 0; padding: 24px; background: #202124; color: #f1f3f4; font: 18px system-ui, sans-serif; display: inline-flex; gap: 24px; }
  figure { margin: 0; display: flex; flex-direction: column; gap: 10px; width: 390px; }
  img { width: 390px; height: 844px; border-radius: 12px; }
  b { font-size: 28px; text-transform: capitalize; }
  span { color: #bdc1c6; }
</style>
${shots.map(({ preset, image }) => `<figure>
  <figcaption><b>${preset}</b><br><span>${feels[preset]}</span></figcaption>
  <img src="data:image/png;base64,${image}">
</figure>`).join('\n')}`)
mkdirSync('screenshots', { recursive: true })
await sheet.locator('body').screenshot({ path: 'screenshots/pick-sheet.png' })

await browser.close()
await server.close()
console.log(`\nSaved screenshots/pick-sheet.png — "${screen}" in all ${shots.length} styles, side by side.`)
