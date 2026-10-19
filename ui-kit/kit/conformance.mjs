// THE UI KIT'S PROMISE CHECKS — run by the Dev Kit's check-framework.mjs (npm run check:framework).
// MODULE-CONTRACTS.md "UI kit", tested on the REAL game:
//   Code:    the kit's rule checker (check-ui.mjs) passes on the game's UI code — words, looks, sizes and layout from
//            the kit's names, page-wide game CSS in @layer game-base
//   Browser: at every size (phones both ways, a short landscape, laptop, desktop, HD) — on the first screen and in
//            live play (the Dev Kit adapter's conformance.startPlay): nothing overlaps, nothing is clipped or wider than
//            the screen, every tap target is 44 px, no focus ring without the keyboard (uiProblems.mjs)
export const title = 'UI kit'

export const SIZES = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'small phone', width: 360, height: 780, mobile: true },
  { name: 'phone on its side', width: 844, height: 390, mobile: true },
  { name: 'short landscape', width: 768, height: 343, mobile: true },
  { name: 'laptop', width: 1100, height: 800, mobile: false },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'HD', width: 1920, height: 1080, mobile: false },
]

const KINDS = [
  { kind: 'overlap', name: 'nothing overlaps', fix: 'Give each part its own slot (Screen slots, Row, Stack, the HUD slots) instead of placing it on top of another; an overlap that\'s on purpose → data-ui-check="skip" on it.' },
  { kind: 'clipped', also: ['wider'], name: 'nothing is clipped or wider than the screen', fix: 'Leave room inside scroll areas and panels (padding, not a tighter box); let text wrap or shrink (the kit\'s text sizes), and keep the page inside the screen width.' },
  { kind: 'small', name: 'every tap target is at least 44 px', fix: 'Use the kit\'s Button / IconButton (they\'re 44 px) or give the control min-width / min-height of the kit\'s tap size.' },
  { kind: 'focus', name: 'no focus ring without the keyboard', fix: 'Focus rings only on :focus-visible (the kit\'s controls do this) — don\'t call focus() on a control at start-up without { focusVisible: false }.' },
]

/** problems per screen ("phone · menu" → ["small: 30×30 px — "Close"", …]) → one row per kind: each problem + where. */
export function groupProblems(found) {
  const byKind = {}
  for (const [where, problems] of Object.entries(found)) {
    for (const p of problems) {
      const kind = p.slice(0, p.indexOf(':'))
      const text = p.slice(p.indexOf(':') + 1).trim()
      const k = KINDS.find((x) => x.kind === kind || x.also?.includes(kind))?.kind ?? kind
      byKind[k] ??= new Map()
      byKind[k].set(text, [...(byKind[k].get(text) ?? []), where])
    }
  }
  return byKind
}

/** ["phone 390×844 · in play", …] → "in play, every size" when it showed at all sizes of one phase (or of both). */
export function whereText(where, screens) {
  if (where.length === screens) return 'every screen, every size'
  const phases = [...new Set(where.map((w) => w.split(' · ')[1]))]
  if (phases.length === 1 && where.length === SIZES.length) return `${phases[0]}, every size`
  return where.join('; ')
}

/** The folders the game's own check:ui script gives check-ui.mjs — up to the next command (&&, ;, |) — or the default. */
export function checkUiArgs(script = '') {
  if (!script.includes('check-ui.mjs')) return ['src/ui', '--css', 'src']
  return script.split('check-ui.mjs')[1].split(/&&|\|\||;|\|/)[0].trim().split(/\s+/).filter(Boolean)
}

export async function check(t) {
  // ---- code: the kit's rule checker ----
  {
    const name = 'the game\'s UI code keeps the kit\'s rules (check-ui)'
    const script = t.scripts()['check:ui'] ?? ''
    const args = checkUiArgs(script)
    const run = t.run('node', [`${t.rel}/check-ui.mjs`, ...args])
    if (run.code === 0) t.pass(name, `node ${t.rel}/check-ui.mjs ${args.join(' ')}`)
    else t.fail(name, run.out.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('✓')).slice(0, 15),
      'Each line names a file and the rule: use the kit\'s style names (var(--primary), gap names, Screen slots) instead of raw values.')
    if (!script) t.fail('check-ui runs in check:fast', ['package.json has no "check:ui" script, so the rules aren\'t checked on every change.'],
      `package.json "scripts": "check:ui": "node ${t.rel}/check-ui.mjs src/ui --css src"  — and add npm run check:ui to check:fast`)
  }

  if (t.staticOnly) return t.skip('the game at every size', '--static')

  // ---- browser: the real game at every size ----
  const { findProblems } = await import('./uiProblems.mjs')
  const found = {}
  let playReason = ''
  for (const size of SIZES) {
    const page = await t.page(size)
    try {
      const label = `${size.name} ${size.width}×${size.height}`
      await page.waitForTimeout(700) // entrances settle
      found[`${label} · first screen`] = [...page.errors.map((e) => `error: ${e}`), ...(await page.evaluate(findProblems, { screenWidth: size.width, checkFocus: true }))]
      if (playReason) continue
      playReason = await t.startPlay(page)
      if (playReason) continue
      await page.waitForTimeout(500)
      found[`${label} · in play`] = await page.evaluate(findProblems, { screenWidth: size.width, checkFocus: false })
    } finally {
      await page.close()
    }
  }
  const grouped = groupProblems(found)
  const screens = Object.keys(found).length
  for (const { kind, name, fix } of KINDS) {
    const list = grouped[kind]
    if (!list?.size) { t.pass(name, `${screens} screens, ${SIZES.length} sizes`); continue }
    const lines = [...list].map(([text, where]) => `${text}  [${whereText(where, screens)}]`)
    t.fail(name, lines.length > 12 ? [...lines.slice(0, 12), `…and ${lines.length - 12} more`] : lines, fix)
  }
  if (grouped.error?.size) t.fail('no errors in the console', [...grouped.error.keys()].slice(0, 8), 'Fix the errors above (they happened while the screens loaded).')
  if (playReason) t.needsPlay('the game at every size — in play', playReason)
}
