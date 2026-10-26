// COMPARE THE ENGINES (F149) — the Chromium shoot and the WebKit shoot side by side, by layout, not by picture.
// Each shot writes a small layout file next to its picture (<shots folder>/layout/<shot>.json, from recordLayout below):
// every text's line count and every kit part's size. This lists, for each shot both runs took:
//   WRAPS — a text on a different number of lines (a label that wraps in one engine only: the thing to fix or accept)
//   SIZES — a kit part more than 1 px bigger or smaller (summed up by part; --sizes prints every one)
// Usage (after npm run shoot and npm run shoot:webkit): npm run compare:engines   (--sizes: every size difference too)
//   npm run compare:engines -- <folder A> <folder B>: any two runs instead (a copy of screenshots/ from before a kit
//   change, and screenshots/ after it — what the change did to Chromium's own layout)
// It ends with 1 when a wrap differs that isn't in acceptedWraps (each with its reason) — 0 when the engines agree.
// Pictures differ anyway (WebKit on Windows draws variable fonts thin, emoji from another font): this reads the layout.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Wraps accepted as they are: '<shot>|<text key>' → why.
export const acceptedWraps = {
  'screens/room-pixel-phone-landscape|SPAN.kit-text "Share this code with your frie"#1':
    "F149 (B): Safari's text-wrap: pretty evens out the whole paragraph (3 lines, Chromium's 2) — the kit can't choose " +
    'how an engine balances; the card now keeps its buttons in sight while it scrolls instead',
}

// ---- In the browser (page.evaluate(recordLayout)): self-contained, like kit/uiProblems.mjs ----
// Texts: every shown element with words of its own (not its children's) → how many lines they take.
// Parts: every shown element with a kit-… class → its size (CSS px, 2 decimals).
// Each is keyed by tag, first kit class and its first words, plus #n when the same key comes again — so the same
// thing gets the same key in both engines whatever its size.
export function recordLayout() {
  const root = document.querySelector('.gallery-game') || document.body
  // (hidden: a covered screen, display: none, a closed popover; inert: a screen under a dialog)
  const shown = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[inert]') }
  const seen = {}
  const keyOf = (el) => {
    const cls = [...el.classList].find((c) => c.startsWith('kit-')) || ''
    const words = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30)
    const base = `${el.tagName}.${cls} "${words}"`
    seen[base] = (seen[base] || 0) + 1
    return `${base}#${seen[base]}`
  }
  const range = document.createRange()
  const linesOf = (el) => {
    const tops = []
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) if (r.width > 0.5) tops.push(r)
    }
    if (!tops.length) return 0
    // one line = rects whose tops are within half a line of each other
    const lines = []
    for (const r of tops.sort((a, b) => a.top - b.top)) if (!lines.some((t) => Math.abs(t - r.top) < r.height / 2)) lines.push(r.top)
    return lines.length
  }
  const texts = {}
  const parts = {}
  for (const el of root.querySelectorAll('*')) {
    if (!shown(el)) continue
    const isText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    const isPart = [...el.classList].some((c) => c.startsWith('kit-'))
    if (!isText && !isPart) continue
    const key = keyOf(el)
    if (isText) texts[key] = linesOf(el)
    if (isPart) { const b = el.getBoundingClientRect(); parts[key] = [Math.round(b.width * 100) / 100, Math.round(b.height * 100) / 100] }
  }
  return { texts, parts }
}

// ---- In Node: the compare ----
/** One shot's two layouts → { wraps: [{ key, a, b }], sizes: [{ key, a: [w,h], b: [w,h] }] } (things in both only). */
export function compareLayouts(a, b, { tolerance = 1 } = {}) {
  const wraps = []
  const sizes = []
  for (const [key, lines] of Object.entries(a.texts)) {
    if (key in b.texts && b.texts[key] !== lines) wraps.push({ key, a: lines, b: b.texts[key] })
  }
  for (const [key, size] of Object.entries(a.parts)) {
    const other = b.parts[key]
    if (other && (Math.abs(other[0] - size[0]) > tolerance || Math.abs(other[1] - size[1]) > tolerance)) sizes.push({ key, a: size, b: other })
  }
  return { wraps, sizes }
}

/** Every shot both folders hold → the plain-words report and whether it passes. shots: { name: [chromium, webkit] }. */
export function compareRuns(shots, { accepted = acceptedWraps, allSizes = false, names: [nameA, nameB] = ['Chromium', 'WebKit'] } = {}) {
  const lines = []
  const sizeByPart = {}
  let open = 0, acceptedCount = 0, sizeCount = 0
  const shotNames = Object.keys(shots).sort()
  for (const name of shotNames) {
    const { wraps, sizes } = compareLayouts(...shots[name])
    for (const w of wraps) {
      const why = accepted[`${name}|${w.key}`]
      if (why) acceptedCount++
      else open++
      lines.push(`${why ? '~' : '✗'} WRAP ${name}  ${w.key}: ${w.a} line(s) in ${nameA}, ${w.b} in ${nameB}${why ? ` — accepted: ${why}` : ''}`)
    }
    for (const s of sizes) {
      sizeCount++
      const part = s.key.replace(/ ".*$/, '')
      sizeByPart[part] = (sizeByPart[part] || 0) + 1
      if (allSizes) lines.push(`  SIZE ${name}  ${s.key}: ${s.a.join('×')} → ${s.b.join('×')}`)
    }
  }
  const parts = Object.entries(sizeByPart).sort((x, y) => y[1] - x[1])
  lines.push('', `${shotNames.length} shots compared (${nameA} → ${nameB})`)
  lines.push(open ? `✗ ${open} wrap(s) differ` : `✓ no wrap differs${acceptedCount ? ` (${acceptedCount} accepted)` : ''}`)
  lines.push(`${sizeCount} part size(s) differ by more than 1 px${parts.length ? ` — ${parts.map(([p, n]) => `${p} ${n}`).join(', ')}` : ''}${sizeCount && !allSizes ? ' (--sizes lists them)' : ''}`)
  return { text: lines.join('\n'), open, acceptedCount, sizeCount, compared: shotNames.length }
}

/** The layout files two shoot folders share: { shot name: [chromium layout, webkit layout] } */
export function readRuns(chromiumDir = 'screenshots/layout', webkitDir = 'screenshots-webkit/layout') {
  const shots = {}
  if (!existsSync(chromiumDir) || !existsSync(webkitDir)) return shots
  const walk = (dir, prefix = '') => readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(dir, `${prefix}${d.name}/`) : d.name.endsWith('.json') ? [`${prefix}${d.name}`] : [])
  for (const file of walk(webkitDir)) {
    if (!existsSync(join(chromiumDir, file))) continue
    shots[file.replace(/\.json$/, '')] = [JSON.parse(readFileSync(join(chromiumDir, file), 'utf8')), JSON.parse(readFileSync(join(webkitDir, file), 'utf8'))]
  }
  return shots
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Two shot folders named → those two instead (e.g. a copy of screenshots/ from before a change, then screenshots/:
  // what a kit change did to Chromium's own layout). Their accepted wraps don't apply.
  const dirs = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const shots = dirs.length === 2 ? readRuns(join(dirs[0], 'layout'), join(dirs[1], 'layout')) : readRuns()
  if (!Object.keys(shots).length) {
    console.log('✗ no layouts to compare: run npm run shoot and npm run shoot:webkit first (each writes <shots>/layout/)')
    process.exit(1)
  }
  const result = compareRuns(shots, { allSizes: process.argv.includes('--sizes'), ...(dirs.length === 2 && { accepted: {}, names: dirs }) })
  console.log(result.text)
  process.exit(result.open ? 1 : 0)
}
