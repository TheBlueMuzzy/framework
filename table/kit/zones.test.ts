import { describe, expect, it } from 'vitest'
import { canSeeInside, hidden, idsAreUnique, indexOfPiece, stableIds, takePiece, zoneFor, type ZoneRule } from './zones'

const hand: ZoneRule = { name: 'hand', inside: 'owner', ordered: true }
const bag: ZoneRule = { name: 'bag', inside: 'nobody', ordered: true }
const board: ZoneRule = { name: 'board', inside: 'all', ordered: false }
const cards = stableIds('card', [{ face: 'A' }, { face: 'B' }, { face: 'C' }])

describe('who may see inside', () => {
  it('a hand: only its owner · a bag: nobody · the board: everyone', () => {
    expect(canSeeInside(hand, 1, 1)).toBe(true)
    expect(canSeeInside(hand, 1, 0)).toBe(false)
    expect(canSeeInside(bag, null, 0)).toBe(false)
    expect(canSeeInside(board, null, 3)).toBe(true)
  })

  it('a seat that may not see inside gets only a count — no ids, no faces', () => {
    expect(zoneFor(hand, 1, cards, 1)).toBe(cards)
    const seen = zoneFor(hand, 1, cards, 0)
    expect(seen).toEqual({ hidden: true, count: 3 })
    expect(JSON.stringify(seen)).not.toContain('card-')
    expect(hidden([])).toEqual({ hidden: true, count: 0 })
  })
})

describe('pieces', () => {
  it('stable ids come from the fixed list, in order', () => {
    expect(cards.map((c) => c.id)).toEqual(['card-0', 'card-1', 'card-2'])
    expect(cards[1].face).toBe('B')
  })

  it('takePiece returns the piece and the rest, never editing the zone', () => {
    const { piece, rest } = takePiece(cards, 'card-1')
    expect(piece.face).toBe('B')
    expect(rest.map((c) => c.id)).toEqual(['card-0', 'card-2'])
    expect(cards).toHaveLength(3)
    expect(() => takePiece(cards, 'card-9')).toThrow("That piece (card-9) isn't there")
    expect(indexOfPiece(cards, 'card-2')).toBe(2)
  })

  it('a piece is only ever in one place', () => {
    expect(idsAreUnique(cards.slice(0, 1), cards.slice(1))).toBe(true)
    expect(idsAreUnique(cards, cards.slice(2))).toBe(false)
  })
})
