// Callout "keep clear" (0.43.0, F199 — Glyphtender's tutorial rule, src/tutorial/tipsPlace.ts calloutPlacement):
// the bubble covers as little of the play area as it can — away from the live spot, toward the area's nearer edge —
// and still flips / shifts to fit. Without keepClear nothing changes (teach.test.tsx, untouched).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { placeKeepingClear, type CalloutBox } from './callout'
import { Callout } from './teach'

afterEach(cleanup)

const frame = { left: 16, top: 16, right: 374, bottom: 828 } // a 390×844 phone minus the edge room
const board = { left: 16, top: 140, right: 374, bottom: 640 } // the play area: a square-ish board mid-screen
const size = { width: 200, height: 80 }
const cell = (row: number, col: number): CalloutBox => ({ left: 16 + col * 50, top: 140 + row * 50, right: 66 + col * 50, bottom: 190 + row * 50 }) // 10 rows
const boxOf = (s: { x: number; y: number }) => ({ left: s.x, top: s.y, right: s.x + size.width, bottom: s.y + size.height })
const overlaps = (a: CalloutBox, b: CalloutBox) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
const shared = (a: CalloutBox, b: CalloutBox) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))

describe('placeKeepingClear', () => {
  it('toward the nearer edge: above a target in the board\'s top half, below one in its bottom half', () => {
    expect(placeKeepingClear(cell(2, 3), size, frame, 12, board).side).toBe('top')
    expect(placeKeepingClear(cell(7, 3), size, frame, 12, board).side).toBe('bottom')
  })

  it('covers less of the board than the other side would', () => {
    const near = placeKeepingClear(cell(1, 3), size, frame, 12, board)
    expect(shared(boxOf(near), board)).toBeLessThan(shared({ left: near.x, top: cell(1, 3).bottom + 12, right: near.x + size.width, bottom: cell(1, 3).bottom + 12 + size.height }, board))
  })

  it('away from the live spot first: the live hex below → above, even in the board\'s bottom half (and never on it)', () => {
    const live = cell(9, 3)
    const spot = placeKeepingClear(cell(7, 3), size, frame, 12, board, live)
    expect(spot.side).toBe('top')
    expect(overlaps(boxOf(spot), live)).toBe(false)
    expect(placeKeepingClear(cell(2, 3), size, frame, 12, board, cell(0, 3)).side).toBe('bottom')
  })

  it('a live spot that is the target itself (or inside it) counts for no side', () => {
    expect(placeKeepingClear(cell(7, 3), size, frame, 12, board, cell(7, 3)).side).toBe('bottom')
  })

  it('still flips to fit: no room above a target at the screen\'s top → below', () => {
    const tall = { left: 16, top: 16, right: 374, bottom: 828 } // the board fills the screen
    const top = { left: 150, top: 30, right: 200, bottom: 70 }
    const spot = placeKeepingClear(top, size, frame, 12, tall)
    expect(spot.side).toBe('bottom')
    expect(spot.y).toBeGreaterThanOrEqual(70)
  })

  it('still shifts to stay inside the frame, the pointer aimed at the target', () => {
    const corner = cell(1, 6) // near the right edge
    const spot = placeKeepingClear(corner, size, frame, 12, board)
    expect(spot.x + size.width).toBeLessThanOrEqual(frame.right)
    expect(spot.x + spot.tipX).toBe((corner.left + corner.right) / 2)
  })

  it('on a wide board (a phone on its side), a side placement wins when it covers less', () => {
    const wideFrame = { left: 16, top: 16, right: 828, bottom: 374 }
    const wideBoard = { left: 260, top: 16, right: 828, bottom: 374 } // the board on the right, a tray on the left
    const target = { left: 270, top: 170, right: 320, bottom: 220 } // at the board's left edge
    const spot = placeKeepingClear(target, size, wideFrame, 12, wideBoard)
    expect(spot.side).toBe('left') // off the board entirely, over the tray
    expect(shared(boxOf(spot), wideBoard)).toBe(0)
  })

  it('never covers what it is told to avoid (the button a Spotlight also lights), even where that covers less board', () => {
    const wideFrame = { left: 16, top: 16, right: 828, bottom: 374 }
    const wideBoard = { left: 260, top: 16, right: 828, bottom: 374 }
    const target = { left: 270, top: 170, right: 320, bottom: 220 }
    const button = { left: 100, top: 175, right: 200, bottom: 215 } // the Plant button, left of the board
    const spot = placeKeepingClear(target, size, wideFrame, 12, wideBoard, null, 0, [button])
    expect(spot.side).not.toBe('left')
    expect(overlaps(boxOf(spot), button)).toBe(false)
  })

  it('slides along its side to get off what it avoids, the pointer still aimed at the target', () => {
    const target = cell(7, 3) // bottom half → below
    const button = { left: 230, top: 560, right: 330, bottom: 600 } // under the right half of where it would sit
    const spot = placeKeepingClear(target, size, frame, 12, board, null, 20, [button])
    expect(spot.side).toBe('bottom')
    expect(overlaps(boxOf(spot), button)).toBe(false)
    expect(spot.x + spot.tipX).toBe((target.left + target.right) / 2)
    expect(spot.tipX).toBeGreaterThanOrEqual(20)
  })

  it('nowhere fits: it still returns a spot (the side with the most room, like placeCallout)', () => {
    const big = { width: 400, height: 900 }
    expect(placeKeepingClear(cell(4, 3), big, frame, 12, board).side).toMatch(/top|bottom|left|right/)
  })
})

describe('Callout keepClear', () => {
  it('takes a play area and a live spot (selectors or boxes) and shows its words as before', () => {
    render(<Callout target={{ x: 100, y: 300 }} text="Plant here." keepClear={{ area: board, live: '#nothing' }} />)
    expect(document.querySelector('.kit-callout')?.textContent).toContain('Plant here.')
  })
})
