// UI PROBLEMS ON A REAL PAGE — one function that runs IN the browser (page.evaluate(findProblems, options)) and lists
// what's wrong with what's on screen right now, each as one plain line starting with its kind:
//   "wider:"   the page is wider than the screen (a phone quietly zooms out to fit it)
//   "small:"   a control smaller than 44×44 px (a fingertip misses it)
//   "clipped:" a control cut off at the edge of a box that hides overflow (its outline / shadow too), or text cut off
//   "overlap:" two things on screen sit on top of each other (text over text, a control over text…) — new in 0.18.0
//   "focus:"   a focus ring showing although nobody used the keyboard
// Used by the gallery's screenshots (scripts/shoot.mjs) and by a game's npm run check:framework (conformance.mjs).
// Skipped: the Dev Kit (#devkit-root), anything hidden, inert or aria-hidden, anything inside [data-ui-check="skip"]
// (a game's on-purpose overlap, e.g. a title drawn over its own shadow copy), and things covered by something else
// (a dialog over the HUD: the HUD underneath isn't "overlapping" it).
// Self-contained on purpose: page.evaluate sends the function's text to the page, so it can't use imports.
export function findProblems({ screenWidth = innerWidth, checkFocus = true } = {}) {
  const problems = []
  const SKIP = '#devkit-root, [data-ui-check="skip"], [inert], [aria-hidden="true"]'
  const name = (el) => (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30) || `<${el.tagName.toLowerCase()}>`
  const shown = (el) => {
    if (el.closest(SKIP)) return false
    const box = el.getBoundingClientRect()
    if (box.width <= 2 || box.height <= 2) return false // hidden, or "for screen readers only" (1×1, clipped away)
    if (box.right <= 0 || box.bottom <= 0 || box.left >= innerWidth || box.top >= innerHeight) return false
    let opacity = 1
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.visibility === 'hidden' || s.display === 'none') return false
      opacity *= Number(s.opacity)
    }
    return opacity > 0.05
  }

  if (document.documentElement.scrollWidth > screenWidth) {
    problems.push(`wider: the page is wider than the screen (${document.documentElement.scrollWidth} > ${screenWidth})`)
  }
  const controls = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="switch"], [role="tab"], [role="slider"], [tabindex="0"]')].filter(shown)
  for (const el of controls) {
    const box = el.getBoundingClientRect()
    if (box.width < 43.5 || box.height < 43.5) problems.push(`small: ${Math.round(box.width)}×${Math.round(box.height)} px — "${name(el)}"`)
    // Clipped inside a box: a scroll area or panel that hides overflow cuts off outlines and drop shadows drawn just
    // outside a control (Cartoon's ink). Controls need a little room from the box's left/right edge.
    for (let clip = el.parentElement; clip && clip !== document.body; clip = clip.parentElement) {
      if (getComputedStyle(clip).overflowX === 'visible') continue
      const edge = clip.getBoundingClientRect()
      const room = 3 // px of clearance for an outline or shadow
      if (box.left < edge.left + room - 0.5 || box.right > edge.right - room + 0.5) problems.push(`clipped: "${name(el)}" at the edge of a box that hides overflow`)
      break // only the nearest clipping box matters
    }
  }

  // Text: elements holding words themselves (not only through children)
  const texts = [...document.querySelectorAll('body *')].filter((el) =>
    !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName) &&
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && shown(el))
  for (const el of texts) {
    const s = getComputedStyle(el)
    if ((s.overflowX === 'hidden' || s.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 1) problems.push(`clipped: text cut off — "${name(el)}"`)
  }

  // Overlap: two shown things whose boxes cross (and neither holds the other), where one of them is really on top
  const things = [...new Set([...controls, ...texts])]
  const crossing = (a, b) => {
    const left = Math.max(a.left, b.left), right = Math.min(a.right, b.right), top = Math.max(a.top, b.top), bottom = Math.min(a.bottom, b.bottom)
    return right - left > 2 && bottom - top > 2 ? { x: (left + right) / 2, y: (top + bottom) / 2 } : null
  }
  const boxes = things.map((el) => el.getBoundingClientRect())
  for (let i = 0; i < things.length; i++) {
    for (let j = i + 1; j < things.length; j++) {
      const a = things[i], b = things[j]
      if (a.contains(b) || b.contains(a)) continue
      const at = crossing(boxes[i], boxes[j])
      if (!at) continue
      const top = document.elementFromPoint(at.x, at.y)
      if (!top || !(a.contains(top) || b.contains(top) || top.contains(a) || top.contains(b))) continue // both covered
      problems.push(`overlap: "${name(a)}" × "${name(b)}"`)
    }
  }

  const ring = checkFocus && document.querySelector(':focus-visible')
  if (ring && !ring.closest('#devkit-root')) problems.push(`focus: a focus ring shows without keyboard use — "${name(ring)}"`)
  return [...new Set(problems)]
}
