// Callout: placeCallout puts the bubble on the asked side when it fits, flips when it doesn't, stays inside the frame,
// never covers the target, and aims the pointer at the target's middle. The component: a tap closes it unless it has
// an action button; dim + action is a dialog. Tips memory: seen / markSeen / tipsOn / reset, saved and read back,
// and still working when the browser refuses to save.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { Callout } from './teach'
import { placeCallout } from './callout'
import { tipsMemory, tipsStorageKey, useTips } from './tips'

afterEach(cleanup) // (a popover the test page can't open counts as hidden, so role queries pass hidden: true)

const frame = { left: 16, top: 16, right: 374, bottom: 828 } // a 390×844 phone minus the edge room
const size = { width: 200, height: 80 }
const overlaps = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
const boxOf = (spot: { x: number; y: number }) => ({ left: spot.x, top: spot.y, right: spot.x + size.width, bottom: spot.y + size.height })

describe('placeCallout', () => {
  it('goes on the asked side when it fits, pointer aimed at the target', () => {
    const target = { left: 150, top: 400, right: 230, bottom: 440 }
    const spot = placeCallout(target, size, frame, 12, 'top', 20)
    expect(spot.side).toBe('top')
    expect(spot.y + size.height).toBe(400 - 12)
    expect(spot.x + spot.tipX).toBe(190) // the target's middle
    expect(spot.tipY).toBe(size.height)
  })

  it('flips to the other side near an edge, and never covers the target', () => {
    const nearTop = { left: 20, top: 20, right: 80, bottom: 64 }
    const spot = placeCallout(nearTop, size, frame, 12, 'top', 20)
    expect(spot.side).toBe('bottom')
    expect(overlaps(boxOf(spot), nearTop)).toBe(false)
    const nearRight = { left: 320, top: 400, right: 370, bottom: 440 }
    expect(placeCallout(nearRight, size, frame, 12, 'right', 20).side).toBe('left')
  })

  it('shifts sideways to stay inside the frame; the pointer still aims at the target (off the corners)', () => {
    const corner = { left: 330, top: 780, right: 370, bottom: 820 }
    const spot = placeCallout(corner, size, frame, 12, 'auto', 20)
    expect(spot.side).toBe('top')
    expect(spot.x + size.width).toBeLessThanOrEqual(frame.right)
    expect(spot.x).toBeGreaterThanOrEqual(frame.left)
    expect(spot.x + spot.tipX).toBe(350)
    const farCorner = { left: 360, top: 400, right: 374, bottom: 410 }
    const pushed = placeCallout(farCorner, size, frame, 12, 'top', 20)
    expect(pushed.tipX).toBeLessThanOrEqual(size.width - 20) // clamped clear of the rounded corner
  })

  it('a point target works (no size) and auto prefers above', () => {
    const point = { left: 200, top: 300, right: 200, bottom: 300 }
    const spot = placeCallout(point, size, frame, 12, 'auto', 20)
    expect(spot.side).toBe('top')
    expect(spot.x + spot.tipX).toBe(200)
  })
})

describe('Callout', () => {
  it('shows its words; a tap closes it', () => {
    const onDismiss = vi.fn()
    render(<Callout target={{ x: 10, y: 10 }} text="Happy? Tap Plant." onDismiss={onDismiss} />)
    fireEvent.click(screen.getByText('Happy? Tap Plant.'))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(screen.getByRole('status', { hidden: true })).toBeTruthy()
  })

  it('with an action button only the button closes it; dim + action is a dialog', () => {
    const onDismiss = vi.fn()
    render(<Callout target={{ x: 10, y: 10 }} dim title="No word, no Magic" text="You can swap seeds." action="Got it" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByText('You can swap seeds.'))
    expect(onDismiss).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { hidden: true })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Got it', hidden: true }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('tips memory', () => {
  it('is named like the settings slot', () => {
    expect(tipsStorageKey()).toMatch(/^kit-tips:/)
  })

  it('remembers seen tips and the switch, saved in the browser', () => {
    const key = 'test-tips-1'
    const { result } = renderHook(() => useTips(key))
    expect(result.current.tipsOn).toBe(true)
    expect(result.current.shouldShow('danger')).toBe(true)
    act(() => result.current.markSeen('danger'))
    expect(result.current.seen('danger')).toBe(true)
    expect(result.current.shouldShow('danger')).toBe(false)
    act(() => result.current.setTipsOn(false))
    expect(result.current.shouldShow('other')).toBe(false)
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ on: false, seen: ['danger'] })
    act(() => result.current.resetTips())
    expect(result.current.seenIds).toEqual([])
    expect(result.current.tipsOn).toBe(false) // reset only forgets the seen tips
  })

  it('reads what an earlier visit saved', () => {
    localStorage.setItem('test-tips-2', JSON.stringify({ on: true, seen: ['a', 'b'] }))
    expect(tipsMemory('test-tips-2').seen('b')).toBe(true)
  })

  it('still works when the browser refuses to save', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const tips = tipsMemory('test-tips-3')
    expect(tips.tipsOn).toBe(true)
    tips.markSeen('x')
    expect(tipsMemory('test-tips-3').seen('x')).toBe(true)
    get.mockRestore(); set.mockRestore()
  })
})
