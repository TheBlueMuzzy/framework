// Rack layout: places at the size the game wants, wrap to 2 rows before shrinking, never below a finger.
// (Ported from Glyphtender's trayLayout tests — the same 4 cases.)
import { describe, expect, it } from 'vitest'
import { rackLayout, rackPlaceCentre } from './rackLayout'

const base = { places: 8, tileMin: 44, gap: 6 }

describe('rackLayout', () => {
  it('places are the size the game wants when 8 fit in a row', () => {
    expect(rackLayout({ ...base, room: 1000, tileWanted: 90 })).toMatchObject({ columns: 8, rows: 1, tile: 90 })
  })

  it('never smaller than a finger (44 px), even when the game wants smaller', () => {
    expect(rackLayout({ ...base, room: 1000, tileWanted: 38 }).tile).toBe(44)
  })

  it('wraps to 2 rows of 4 rather than shrinking', () => {
    // phone portrait: 374 px of room, 42 px wanted → 8 × 44 + gaps = 394 doesn't fit
    expect(rackLayout({ ...base, room: 374, tileWanted: 42 })).toMatchObject({ columns: 4, rows: 2, tile: 44 })
    // desktop side panel: 410 px of room, 97 px wanted → 4 × 97 + gaps = 406 fits at full size
    expect(rackLayout({ ...base, room: 410, tileWanted: 97 })).toMatchObject({ columns: 4, rows: 2, tile: 97 })
  })

  it('only shrinks when even 4 in a row do not fit — and never below the minimum', () => {
    expect(rackLayout({ ...base, room: 300, tileWanted: 97 })).toMatchObject({ columns: 4, tile: 70 })
    expect(rackLayout({ ...base, room: 150, tileWanted: 97 }).tile).toBe(44)
  })
})

describe('rackPlaceCentre', () => {
  // 2 rows of 4, 44 px places, 6 px gaps → 194 px wide, centred in a 214 px box (10 px in from the left)
  const layout = rackLayout({ ...base, room: 374, tileWanted: 42 })

  it('left to right, then the next row, centred in the box', () => {
    expect(rackPlaceCentre(layout, 214, 0)).toEqual({ x: 10 + 22, y: 22 })
    expect(rackPlaceCentre(layout, 214, 3)).toEqual({ x: 10 + 3 * 50 + 22, y: 22 })
    expect(rackPlaceCentre(layout, 214, 4)).toEqual({ x: 10 + 22, y: 50 + 22 })
  })

  it('a box narrower than the places: no negative margin', () => {
    expect(rackPlaceCentre(layout, 100, 0).x).toBe(22)
  })
})
