// Target feedback: which gap of a hand the pointer is at, magnetic snap (which spot, and how hard it pulls), the ghost
// preview, the tether's path, and the carrier showing a snapped piece pulled toward its spot.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CARRY_PRESETS, DEFAULT_CARRY_FEEL, createCarrier } from './carry'
import {
  DEFAULT_TARGET_FEEL, createPreview, createTether, insertionIndex, pulledToward, snapTarget, tetherPath,
} from './target'

afterEach(() => {
  document.documentElement.removeAttribute('data-reduce-motion')
  delete (Element.prototype as { animate?: unknown }).animate
})

// Three places in a row, 60 px apart
const row = [{ x: 30, y: 25 }, { x: 90, y: 25 }, { x: 150, y: 25 }]

describe('insertionIndex', () => {
  it('picks the gap on the pointer’s side of the nearest place, incl. before the first and after the last', () => {
    expect(insertionIndex({ x: 5, y: 25 }, row)).toBe(0) // before the first
    expect(insertionIndex({ x: 40, y: 30 }, row)).toBe(1) // right of the first
    expect(insertionIndex({ x: 80, y: 0 }, row)).toBe(1) // left of the second
    expect(insertionIndex({ x: 100, y: 25 }, row)).toBe(2)
    expect(insertionIndex({ x: 400, y: 25 }, row)).toBe(3) // after the last
  })

  it('an empty hand has one gap: 0', () => {
    expect(insertionIndex({ x: 10, y: 10 }, [])).toBe(0)
  })
})

describe('magnetic snap', () => {
  const spots = [{ x: 0, y: 0, id: 'a' }, { x: 100, y: 0, id: 'b' }]

  it('snapTarget gives the nearest spot within the radius (with its own fields), or null', () => {
    expect(snapTarget({ x: 80, y: 10 }, spots, 30)).toEqual({ x: 100, y: 0, id: 'b' })
    expect(snapTarget({ x: 10, y: 0 }, spots, 30)?.id).toBe('a')
    expect(snapTarget({ x: 50, y: 0 }, spots, 30)).toBeNull()
    expect(snapTarget({ x: 0, y: 0 }, [], 30)).toBeNull()
  })

  it('pulledToward: nothing at the radius’ edge, more as it gets closer, never past the spot', () => {
    const snap = { to: { x: 100, y: 0 }, pull: 0.5, radius: 40 }
    expect(pulledToward({ x: 60, y: 0 }, snap)).toEqual({ x: 60, y: 0 }) // at the edge
    expect(pulledToward({ x: 80, y: 0 }, snap)).toEqual({ x: 85, y: 0 }) // halfway in: 0.5 × 0.5 of 20
    expect(pulledToward({ x: 0, y: 0 }, snap)).toEqual({ x: 0, y: 0 }) // out of reach
    expect(pulledToward({ x: 80, y: 0 }, { ...snap, pull: 0 })).toEqual({ x: 80, y: 0 })
  })

  it('the carrier shows a snapped piece pulled toward its spot, and drops from where it shows', () => {
    const played: Keyframe[][] = []
    Object.assign(Element.prototype, {
      animate: vi.fn((frames: Keyframe[]) => { played.push(frames); return { cancel() {}, onfinish: null, oncancel: null } }),
    })
    const el = document.createElement('div')
    const carry = createCarrier(el, () => ({ ...DEFAULT_CARRY_FEEL, liftScale: 1 }))
    carry.start(CARRY_PRESETS.A, { x: 0, y: 0 }, 20)
    carry.move({ x: 80, y: 0 }, { to: { x: 100, y: 0 }, pull: 0.5, radius: 40 })
    expect(el.style.transform).toBe('translate(75px, -10px) scale(1)') // centre 85, 0
    carry.move({ x: 80, y: 0 }) // no snap: exactly under the pointer, as before
    expect(el.style.transform).toBe('translate(70px, -10px) scale(1)')
    carry.move({ x: 80, y: 0 }, { to: { x: 100, y: 0 }, pull: 0.5, radius: 40 })
    void carry.drop(null, { x: 0, y: 0 })
    expect(played.at(-1)![0]).toMatchObject({ transform: 'translate(75px, -10px) scale(1)' })
  })
})

describe('ghost preview', () => {
  it('shows a see-through copy centred on the spot, moves straight to a new spot, and hides', () => {
    const el = document.createElement('div')
    let feel = DEFAULT_CARRY_FEEL
    const preview = createPreview(el, () => feel)
    expect(el.style.pointerEvents).toBe('none') // never in the way of finding the spot under it
    preview.show({ x: 100, y: 50 }, 40)
    expect(preview.showing).toBe(true)
    expect(el.style.visibility).toBe('visible')
    expect(el.style.opacity).toBe('0.45')
    expect(el.style.transform).toBe('translate(80px, 30px)')
    feel = { ...feel, ghostOpacity: 0.3 }
    preview.show({ x: 160, y: 50 }, 40)
    expect(el.style.transform).toBe('translate(140px, 30px)')
    expect(el.style.opacity).toBe('0.3') // (live tuning)
    preview.hide()
    expect(preview.showing).toBe(false)
    expect(el.style.visibility).toBe('hidden')
  })
})

describe('tether', () => {
  it('tetherPath: a straight line, or a curve bowed sideways, with an arrow head at the pointer', () => {
    expect(tetherPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0, 0)).toBe('M0 0 L100 0')
    expect(tetherPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.2, 0)).toBe('M0 0 Q50 20 100 0')
    // Straight, head of 10: two wings 30° back from the tip
    expect(tetherPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 0, 10)).toBe('M0 0 L100 0 M91.3 -5 L100 0 L91.3 5')
    expect(tetherPath({ x: 5, y: 5 }, { x: 5, y: 5 }, 0.2, 10)).toBe('') // nothing to draw yet
  })

  it('draws on the game’s path: show, follow, hide; the kit class gives the look, `color` overrides it', () => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const tether = createTether(path, { feel: () => ({ ...DEFAULT_TARGET_FEEL, tetherBend: 0 }), arrow: false })
    expect(path.classList.contains('kit-tether')).toBe(true)
    expect(path.style.stroke).toBe('')
    tether.update({ x: 50, y: 50 }) // (not showing yet: nothing)
    expect(path.getAttribute('d')).toBeNull()
    tether.show({ x: 0, y: 0 }, { x: 30, y: 40 })
    expect(path.getAttribute('d')).toBe('M0 0 L30 40')
    expect(path.style.visibility).toBe('visible')
    tether.update({ x: 60, y: 0 })
    expect(path.getAttribute('d')).toBe('M0 0 L60 0')
    tether.hide()
    expect(tether.showing).toBe(false)
    expect(path.style.visibility).toBe('hidden')

    const coloured = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    createTether(coloured, { color: 'var(--accent)' })
    expect(coloured.style.stroke).toBe('var(--accent)')
  })
})
