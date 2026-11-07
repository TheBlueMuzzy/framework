// template: shots.mjs 1 (2026-11-07) — keep this line: the session start compares it with templates/TEMPLATES.md (F203)
// BEFORE / AFTER SCREENSHOTS — proof that a change "looks the same" everywhere it should (framework F196, from
// Glyphtender's e2e/shots.mjs, its F29 safety net).
// TEMPLATE (~/.claude/config/bmuz/templates/shots.mjs). To use it in a game:
//   1. copy it to <game>/e2e/shots.mjs and `npm install -D pixelmatch pngjs` (playwright-core + vite the game has)
//   2. fill in the four GAME PARTS below: PORT, FREEZE_QUERY, STILL and JOURNEYS (how to reach each screen)
//   3. package.json: "shots:record": "node e2e/shots.mjs record", "check:shots": "node e2e/shots.mjs check"
//   4. scripts/check-all.mjs E2E: ['screenshots', 'e2e/shots.mjs', 'check'] (its checks page then links the changes page)
//   5. npm run shots:record, LOOK at the pictures, commit e2e/shots-before/
//
//   npm run shots:record   shoot the BEFORE set into e2e/shots-before/<platform>/<screen>@<w>x<h>.png (committed).
//                          Re-record only when a change is MEANT to look different — and look at the new pictures first.
//   npm run check:shots    shoot them again into e2e-shots/shots-now/ and compare with the before set, pixel by pixel.
//                          Each picture that differs gets e2e-shots/shots-diff/<name>.png (the changed pixels in red),
//                          and e2e-shots/report.html shows before | now | changed, side by side, the changed ones first.
//                          Exit 0 = everything looks the same; 1 = something differs, is missing, is new, or a screen
//                          couldn't be reached / never held still.
//
// The sizes follow content/ui/style.json "orientation" (the develop skill's list): upright phones 390×844, 360×780;
// sideways phones 844×390, 768×343 (a short window); desktops 1100×800, 1440×900, 1920×1080. "portrait" drops the
// sideways phones, "landscape" the upright ones, "any" (or no file) shoots all seven.
//
// How exact: a pixel counts as different when its colour moved more than pixelmatch's threshold 0.1 (anti-aliasing
// wobble inside one pixel doesn't count), and NO differing pixels are allowed. If a picture ever flakes, find what
// moved and hold it still (STILL / FREEZE_QUERY) — don't raise the tolerance.
//
// One platform's pictures: Windows and GitHub's Linux draw text differently (other fonts, other smoothing), so a before
// set only holds on the platform it was recorded on — it lives in e2e/shots-before/<platform>/ (win32, linux, darwin).
// On a platform with no before set (GitHub's checks) the screens are still all reached and shot — a screen that can't be
// reached, throws, or never holds still still fails — but the compare is skipped, and it says so. (A game that wants
// GitHub to compare too can record there: run `node e2e/shots.mjs record` on Linux and commit e2e/shots-before/linux/.)
//
// Holding the screen still (so every run is identical): every page opens with FREEZE_QUERY (the game's own switch for
// fixed "random" numbers — a seed — and nothing moving by itself) and the browser's "reduce motion" on. Before each
// picture: the fonts and images are loaded, the game says it's still (STILL), every animation that ends has ended,
// anything that loops forever is held at its start (Playwright's animations: 'disabled'; SVG <animate> paused), the
// mouse is moved off everything — and a picture is kept only once two in a row come out the same.
//
// Starts its OWN dev server on PORT and closes only that one.
//   node e2e/shots.mjs [record|check]
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

// ======================================== GAME PARTS — fill these in ========================================
// A port of its own (6000–6999; never the dev server's, never another e2e script's) — check:full's port pre-flight reads it
// (the turn-based starter's copy: 6406 — its other e2e scripts use 6401–6405, 6409, 6499)
const PORT = 6406
// Added to every page's address: the game's switch for holding random things still ('?seed=7', '?freeze', '' for none)
// (the starter: a fixed, replayable game — the bot's picks and timing — and, driven by Playwright, you go first)
const FREEZE_QUERY = '?seed=7'
/** Runs IN THE PAGE before each picture: true once the game's own motion is done (a store's "flying" / "scoring"
 *  flags, a bot not thinking…). Page animations, fonts and images are waited for already. */
const STILL = () => true
/** How to reach every screen. Each journey runs on a fresh page (its own storage — no remembered choices) at every
 *  size; `shot('name')` takes one screen's picture. Reach screens the way a player does (tap / click buttons), and
 *  wait for what the screen shows, never a set time. */
const JOURNEYS = [
  {
    // the main menu, Settings, Credits, Play online
    name: 'menus',
    run: async ({ page, shot, tap }) => {
      await page.getByRole('button', { name: /Careless/ }).waitFor()
      await shot('menu')
      await tap(page.getByRole('button', { name: 'Settings' }))
      const heading = (name) => page.getByRole('heading', { name, exact: true }).waitFor()
      await heading('Settings')
      await shot('settings')
      await page.keyboard.press('Escape')
      await tap(page.getByRole('button', { name: 'Credits' }))
      await heading('Credits')
      await shot('credits')
      await page.keyboard.press('Escape')
      await tap(page.getByRole('button', { name: 'Play online' }))
      await heading('Play online')
      await shot('online')
    },
  },
  {
    // a game against Careless Cass: the empty board, Pause, then played to the end (the fixed game) → the results
    name: 'game',
    run: async ({ page, shot, tap }) => {
      await tap(page.getByRole('button', { name: /Careless/ }))
      await page.locator('[data-board]').waitFor()
      await page.getByText('Your turn').waitFor()
      await shot('board')
      await tap(page.getByRole('button', { name: 'Pause' }))
      await page.getByRole('button', { name: 'Resume' }).waitFor()
      await shot('pause')
      await tap(page.getByRole('button', { name: 'Resume' }))
      const over = page.getByRole('heading', { name: /win|draw/i })
      const free = page.locator('[data-board] [data-mark=""]:not([aria-disabled])')
      for (let move = 0; move < 9 && !(await over.count()); move++) {
        await tap(free.first())
        // the bot answers (2 more marks: yours + its) or the game ends
        await page.waitForFunction((marks) => [...document.querySelectorAll('h1, h2')].some((h) => /win|draw/i.test(h.textContent)) ||
          document.querySelectorAll('[data-board] [data-mark="0"], [data-board] [data-mark="1"]').length >= marks, (move + 1) * 2, { timeout: 10_000 })
      }
      await over.waitFor()
      await shot('results')
    },
  },
  {
    // a brand-new device's first game: the tutorial's first step (the spotlight on the board, the bubble)
    name: 'tutorial',
    query: '&tutorial=fresh',
    run: async ({ page, shot, tap }) => {
      await tap(page.getByRole('button', { name: /Careless/ }))
      await page.locator('.kit-callout').waitFor()
      await shot('tutorial')
    },
  },
]
// ============================================================================================================

const MODE = process.argv[2] ?? 'check'
if (!['record', 'check'].includes(MODE)) throw new Error(`Mode must be record or check, got ${MODE}`)
const PLATFORM = process.platform
const BEFORE_ROOT = 'e2e/shots-before'
const BEFORE = `${BEFORE_ROOT}/${PLATFORM}`
const NOW = 'e2e-shots/shots-now'
const DIFF = 'e2e-shots/shots-diff'
const REPORT = 'e2e-shots/report.html'
const THRESHOLD = 0.1 // pixelmatch: how far a pixel's colour may move and still count as the same
const ALLOWED = 0 // how many differing pixels a picture may have

const PHONES_UP = [{ width: 390, height: 844, mobile: true }, { width: 360, height: 780, mobile: true }]
const PHONES_SIDEWAYS = [{ width: 844, height: 390, mobile: true }, { width: 768, height: 343, mobile: true }]
const DESKTOPS = [{ width: 1100, height: 800, mobile: false }, { width: 1440, height: 900, mobile: false }, { width: 1920, height: 1080, mobile: false }]
const ORIENTATION = (() => {
  try { return JSON.parse(readFileSync('content/ui/style.json', 'utf8')).orientation ?? 'any' } catch { return 'any' }
})()
const SIZES = [
  ...(ORIENTATION === 'landscape' ? [] : PHONES_UP),
  ...(ORIENTATION === 'portrait' ? [] : PHONES_SIDEWAYS),
  ...DESKTOPS,
]

const OUT = MODE === 'record' ? BEFORE : NOW
// Start clean, so a screen that's gone doesn't linger
for (const dir of MODE === 'record' ? [BEFORE] : [NOW, DIFF]) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}

const problems = []
const problem = (why) => { problems.push(why); console.log(`  PROBLEM ${why}`) }
let shotCount = 0

/** "Held still" uses the same measure as the before / after comparison. */
function samePicture(a, b) {
  const pa = PNG.sync.read(a), pb = PNG.sync.read(b)
  if (pa.width !== pb.width || pa.height !== pb.height) return false
  return pixelmatch(pa.data, pb.data, null, pa.width, pa.height, { threshold: THRESHOLD }) <= ALLOWED
}

/** Wait until nothing is moving that will stop by itself, then hold what loops forever at its start. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(STILL, null, { timeout: 20_000, polling: 50 })
  await page.waitForFunction(() => {
    if ([...document.images].some((img) => !img.complete)) return false
    // (scroll-driven animations never "finish": skipped; looping ones are held by the screenshot itself)
    return document.getAnimations().every((a) => a.timeline !== document.timeline || a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity)
  }, null, { timeout: 20_000, polling: 50 })
  await page.evaluate(() => document.querySelectorAll('svg').forEach((svg) => { svg.pauseAnimations?.(); svg.setCurrentTime?.(0) }))
  await page.mouse.move(0, 0) // no button left looking hovered
}

async function shoot(page, size, name) {
  const at = `${name}@${size.width}x${size.height}`
  await settle(page)
  let last = await page.screenshot({ animations: 'disabled', caret: 'hide' })
  for (let i = 0; i < 20; i++) {
    // a polling step: the gap between two pictures that must come out the same
    await page.waitForTimeout(150)
    const next = await page.screenshot({ animations: 'disabled', caret: 'hide' })
    if (next.equals(last) || samePicture(last, next)) {
      writeFileSync(`${OUT}/${at}.png`, next)
      shotCount++
      console.log(`shot ${at}`)
      return
    }
    last = next
  }
  problem(`${at}: the screen never held still (two pictures in a row always differed) — hold what moves (STILL / FREEZE_QUERY)`)
}

const server = await createServer({ server: { port: PORT, strictPort: true, host: '127.0.0.1' }, logLevel: 'warn' })
await server.listen()
const browser = await chromium.launch()
try {
  for (const size of SIZES) {
    for (const journey of JOURNEYS) {
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, isMobile: size.mobile, hasTouch: size.mobile, reducedMotion: 'reduce' })
      const page = await context.newPage()
      page.on('pageerror', (e) => problem(`${size.width}x${size.height} ${journey.name}: page error: ${e.message}`))
      const tap = (loc) => (size.mobile ? loc.tap() : loc.click())
      try {
        await page.goto(`http://127.0.0.1:${PORT}/${FREEZE_QUERY}${journey.query ?? ''}`)
        await journey.run({ page, size, tap, shot: (name) => shoot(page, size, name) })
      } catch (e) {
        problem(`${size.width}x${size.height} ${journey.name}: ${e.message.split('\n')[0]}`)
      } finally {
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
  await server.close()
}

if (MODE === 'record') {
  console.log(`\nRecorded ${shotCount} before-screenshots in ${BEFORE}/ (${ORIENTATION}: ${SIZES.length} sizes). Look at them before committing.`)
  if (problems.length) console.log(`${problems.length} problem(s) — the before set is incomplete:\n  ${problems.join('\n  ')}`)
  process.exit(problems.length ? 1 : 0)
}

// ---- Compare: every before picture against the one just taken ----
const pngs = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')).sort() : [])
const recordedOn = existsSync(BEFORE_ROOT) ? readdirSync(BEFORE_ROOT).filter((d) => pngs(`${BEFORE_ROOT}/${d}`).length) : []
if (!pngs(BEFORE).length) {
  writeReport([], [], problems, recordedOn)
  if (!recordedOn.length) {
    console.log(`\nNO BEFORE SET — nothing in ${BEFORE_ROOT}/ yet: run npm run shots:record, look at the pictures, commit them.`)
    process.exit(1)
  }
  console.log(`\nCompare SKIPPED: the before set was recorded on ${recordedOn.join(', ')}, and this is ${PLATFORM} — text is drawn differently here, so the pictures can't match. All ${shotCount} screens were reached and held still${problems.length ? ` except ${problems.length} problem(s)` : ''}.`)
  process.exit(problems.length ? 1 : 0)
}
const before = pngs(BEFORE)
const now = new Set(pngs(NOW))
const differences = []
const describe = (f) => { const [screen, at] = f.replace('.png', '').split('@'); return `${screen} at ${at.replace('x', '×')}` }
for (const f of before) {
  if (!now.has(f)) { differences.push(`MISSING  ${describe(f)}: in the before set but couldn't be shot now`); continue }
  now.delete(f)
  const a = PNG.sync.read(readFileSync(`${BEFORE}/${f}`))
  const b = PNG.sync.read(readFileSync(`${NOW}/${f}`))
  if (a.width !== b.width || a.height !== b.height) { differences.push(`SIZE     ${describe(f)}: ${a.width}×${a.height} before, ${b.width}×${b.height} now`); continue }
  const diff = new PNG({ width: a.width, height: a.height })
  const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: THRESHOLD })
  if (changed > ALLOWED) {
    writeFileSync(`${DIFF}/${f}`, PNG.sync.write(diff))
    differences.push(`DIFFERS  ${describe(f)}: ${changed} pixel${changed === 1 ? '' : 's'} differ (${((changed / (a.width * a.height)) * 100).toFixed(2)}% of the picture) — see ${DIFF}/${f}`)
  }
}
for (const f of now) differences.push(`NEW      ${describe(f)}: shot now but not in the before set (re-record if it's meant to be there)`)

console.log('')
problems.forEach((p) => console.log(`PROBLEM  ${p}`))
differences.forEach((d) => console.log(d))
writeReport(before, differences, problems, recordedOn)
if (!problems.length && !differences.length) {
  console.log(`Same: all ${before.length} screenshots match the before set exactly (0 pixels differ).`)
  process.exit(0)
}
console.log(`\nNot the same: ${differences.length} of ${before.length} screenshot(s) differ${problems.length ? `, ${problems.length} problem(s) while shooting` : ''}. Page: ${REPORT}`)
process.exit(1)

/** e2e-shots/report.html — the result as a page (dev server: /e2e-shots/report.html): the verdict on top, then every
 *  screen at every size as before | now | the changed pixels in red (only where something changed), changed first. */
function writeReport(files, differences, problems, recordedOn) {
  const same = !differences.length && !problems.length
  const changed = new Set(differences.map((d) => d.split(':')[0].slice(9).trim()))
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const rows = files.map((f) => {
    const name = describe(f)
    const bad = changed.has(name)
    const diff = bad && existsSync(`${DIFF}/${f}`) ? `<a href="shots-diff/${f}"><img src="shots-diff/${f}" loading="lazy"><span>Changed (red)</span></a>` : ''
    return { bad, html: `<section class="${bad ? 'bad' : ''}"><h3>${bad ? '✗' : '✓'} ${esc(name)}</h3><div class="row">` +
      `<a href="../${BEFORE}/${f}"><img src="../${BEFORE}/${f}" loading="lazy"><span>Before</span></a>` +
      `<a href="shots-now/${f}"><img src="shots-now/${f}" loading="lazy"><span>Now</span></a>${diff}</div></section>` }
  })
  const title = !files.length
    ? (recordedOn.length ? `Compare skipped — the before set is from ${recordedOn.join(', ')}, this is ${PLATFORM}` : 'No before set yet — npm run shots:record')
    : same ? `Same — all ${files.length} screenshots match the before set exactly` : `Not the same — ${differences.length} of ${files.length} differ`
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Screenshot check</title><style>
body{font:16px system-ui;background:#0f1729;color:#eee;margin:0;padding:16px}h1{margin:0 0 4px}p{margin:0 0 16px;color:#aab}
.ok{color:#7d7}.no{color:#f77}section{margin:0 0 20px}h3{margin:0 0 6px;font-size:15px}.bad h3{color:#f77}
.row{display:grid;grid-template-columns:repeat(3,minmax(140px,1fr));max-width:1200px;gap:8px}
.row a{color:#aab;text-decoration:none;font-size:13px;text-align:center}
.row img{display:block;width:100%;height:auto;max-height:420px;object-fit:contain;background:#000;border:1px solid #334;border-radius:4px}
pre{white-space:pre-wrap;color:#f99}</style>
<h1 class="${same && files.length ? 'ok' : 'no'}">${esc(title)}</h1>
<p>Checked ${new Date().toLocaleString()} on ${PLATFORM} · ${ORIENTATION}: ${SIZES.map((s) => `${s.width}×${s.height}`).join(' · ')} · each row: before | now${same ? '' : ' | changed pixels in red'} · tap a picture to see it full size</p>
${problems.length || differences.length ? `<pre>${esc([...problems.map((p) => 'PROBLEM ' + p), ...differences].join('\n'))}</pre>` : ''}
${[...rows.filter((r) => r.bad), ...rows.filter((r) => !r.bad)].map((r) => r.html).join('\n')}`
  writeFileSync(REPORT, html)
  console.log(`Report page: ${REPORT}`)
}
