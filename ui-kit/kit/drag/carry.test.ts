// Carry styles: the four presets, the looks they give, and the carrier — what it shows while carried and how each
// ending finishes (with and without Web Animations; reduce motion = no animation).
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CARRY_NAMES, CARRY_PRESETS, DEFAULT_CARRY_FEEL, carriedOpacity, carryStyle, createCarrier, originWhileCarried,
} from './carry'

afterEach(() => {
  document.documentElement.removeAttribute('data-reduce-motion')
  delete (Element.prototype as { animate?: unknown }).animate
})

const element = () => {
  const el = document.createElement('div')
  el.style.visibility = 'hidden'
  return el
}

// A stand-in for Web Animations: records each animation; finish() ends it
const lendAnimate = () => {
  const played: { frames: Keyframe[]; finish: () => void }[] = []
  const animate = vi.fn((frames: Keyframe[]) => {
    const anim = {
      onfinish: null as null | (() => void),
      oncancel: null as null | (() => void),
      cancel() { anim.oncancel?.() },
    }
    played.push({ frames, finish: () => anim.onfinish?.() })
    return anim
  })
  Object.assign(Element.prototype, { animate })
  return played
}

describe('carry presets', () => {
  it('names the four styles by what is carried and what stays home', () => {
    expect(CARRY_PRESETS.A).toEqual({ carried: 'solid', origin: 'empty', land: 'settle', back: 'fly' })
    expect(CARRY_PRESETS.B).toMatchObject({ carried: 'solid', origin: 'ghost' })
    expect(CARRY_PRESETS.C).toMatchObject({ carried: 'ghost', origin: 'solid', land: 'fly' })
    expect(CARRY_PRESETS.D).toMatchObject({ carried: 'ghost', origin: 'empty' })
    expect(CARRY_NAMES.C).toBe('Aim')
  })

  it('carryStyle picks a preset by letter, overrides parts, and falls back to A', () => {
    expect(carryStyle('B', { back: 'fade' })).toEqual({ ...CARRY_PRESETS.B, back: 'fade' })
    expect(carryStyle('Z')).toEqual(CARRY_PRESETS.A)
  })

  it('a ghost is see-through, a solid piece is not; home shows ghost / empty / itself', () => {
    expect(carriedOpacity(CARRY_PRESETS.C, DEFAULT_CARRY_FEEL)).toBe(DEFAULT_CARRY_FEEL.ghostOpacity)
    expect(carriedOpacity(CARRY_PRESETS.A, DEFAULT_CARRY_FEEL)).toBe(1)
    expect(originWhileCarried(CARRY_PRESETS.A)).toBe('empty')
    expect(originWhileCarried(CARRY_PRESETS.B)).toBe('ghost')
    expect(originWhileCarried(CARRY_PRESETS.C)).toBeUndefined()
  })
})

describe('carrier', () => {
  it('shows the piece lifted (bigger, shadowed) under the pointer, by its centre, and follows it', () => {
    const el = element()
    const carry = createCarrier(el)
    carry.start(CARRY_PRESETS.C, { x: 100, y: 50 }, 40)
    expect(carry.carrying).toBe(true)
    expect(el.style.visibility).toBe('visible')
    expect(el.style.opacity).toBe('0.45')
    expect(el.style.transform).toBe('translate(80px, 30px) scale(1.12)')
    expect(el.style.filter).toContain('drop-shadow')
    carry.move({ x: 120, y: 60 })
    expect(el.style.transform).toBe('translate(100px, 40px) scale(1.12)')
  })

  it('without animation: a valid drop lands and hides, a wrong one returns and hides', async () => {
    const el = element()
    const carry = createCarrier(el)
    carry.start(CARRY_PRESETS.A, { x: 0, y: 0 }, 40)
    await expect(carry.drop({ x: 10, y: 10 }, { x: 0, y: 0 })).resolves.toBe('landed')
    expect(el.style.visibility).toBe('hidden')
    expect(carry.carrying).toBe(false)
    carry.start(CARRY_PRESETS.A, { x: 0, y: 0 }, 40)
    await expect(carry.drop(null, { x: 0, y: 0 })).resolves.toBe('returned')
    expect(el.style.visibility).toBe('hidden')
  })

  it('Aim (C): on a valid drop the real piece flies from home to the target', async () => {
    const played = lendAnimate()
    const el = element()
    const carry = createCarrier(el)
    carry.start(CARRY_PRESETS.C, { x: 50, y: 50 }, 20)
    played[0].finish() // (the lift)
    carry.move({ x: 200, y: 50 })
    const done = carry.drop({ x: 210, y: 60 }, { x: 0, y: 0 })
    const fly = played[1]
    expect(fly.frames[0]).toMatchObject({ transform: 'translate(-10px, -10px) scale(1)', opacity: 1 })
    expect(fly.frames[1]).toMatchObject({ transform: 'translate(200px, 50px) scale(1)', opacity: 1 })
    expect(el.style.visibility).toBe('visible') // (still flying)
    fly.finish()
    await expect(done).resolves.toBe('landed')
    expect(el.style.visibility).toBe('hidden')
  })

  it('a wrong drop flies back home (fly) or fades where it is (fade)', async () => {
    const played = lendAnimate()
    const carry = createCarrier(element())
    carry.start(CARRY_PRESETS.A, { x: 50, y: 50 }, 20)
    const back = carry.drop(null, { x: 0, y: 0 })
    expect(played.at(-1)!.frames.at(-1)).toMatchObject({ transform: 'translate(-10px, -10px) scale(1)' })
    played.at(-1)!.finish()
    await expect(back).resolves.toBe('returned')

    carry.start(CARRY_PRESETS.C, { x: 50, y: 50 }, 20)
    const fade = carry.drop(null, { x: 0, y: 0 })
    expect(played.at(-1)!.frames.at(-1)).toMatchObject({ opacity: 0, transform: 'translate(40px, 40px) scale(1.12)' })
    played.at(-1)!.finish()
    await expect(fade).resolves.toBe('returned')
  })

  it('reduce motion: no animation at all, the drop ends at once', async () => {
    const played = lendAnimate()
    document.documentElement.setAttribute('data-reduce-motion', '')
    const carry = createCarrier(element())
    carry.start(CARRY_PRESETS.C, { x: 0, y: 0 }, 20)
    await expect(carry.drop({ x: 5, y: 5 }, { x: 0, y: 0 })).resolves.toBe('landed')
    expect(played).toHaveLength(0)
  })

  it('reads the feel on every drag, so live tuning applies to the next one', () => {
    const el = element()
    let feel = DEFAULT_CARRY_FEEL
    const carry = createCarrier(el, () => feel)
    carry.start(CARRY_PRESETS.D, { x: 0, y: 0 }, 20)
    expect(el.style.opacity).toBe('0.45')
    carry.cancel()
    expect(el.style.visibility).toBe('hidden')
    feel = { ...feel, ghostOpacity: 0.6, liftScale: 1 }
    carry.start(CARRY_PRESETS.D, { x: 0, y: 0 }, 20)
    expect(el.style.opacity).toBe('0.6')
    expect(el.style.transform).toContain('scale(1)')
  })
})
