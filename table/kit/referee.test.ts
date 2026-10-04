import { describe, expect, it } from 'vitest'
import { makeReferee } from './referee'
import { GAP, moveInRack, placesOf, rackOf, refillRack, shuffleRack } from './rack'

// A tiny board for the referee: cards go on cells 0–4; seat 0 may act; only even cells are free right now.
type Card = { id: string; kind: 'card' | 'token' }
const referee = makeReferee<Card, number>({
  mayAct: (seat) => seat === 0,
  accepts: (piece) => piece.kind === 'card',
  check: (_seat, _piece, cell) => (cell % 2 === 0 ? null : 'That cell is taken'),
})
const card: Card = { id: 'c1', kind: 'card' }
const token: Card = { id: 't1', kind: 'token' }

describe('the referee: one answer for glow, shake and drop', () => {
  it('asks: may this seat act → does the place accept the piece → do the rules allow it', () => {
    expect(referee.judge(0, card, 2)).toEqual({ ok: true })
    expect(referee.judge(1, card, 2)).toEqual({ ok: false, reason: "It's not your turn" })
    expect(referee.judge(0, token, 2)).toEqual({ ok: false, reason: "That can't go there" })
    expect(referee.judge(0, card, 3)).toEqual({ ok: false, reason: 'That cell is taken' })
  })

  it('lights up every place that says yes (phones: shown on pick-up)', () => {
    expect(referee.targetsFor(0, card, [0, 1, 2, 3, 4])).toEqual([0, 2, 4])
    expect(referee.targetsFor(1, card, [0, 1, 2])).toEqual([])
  })

  it('a piece with nowhere to go can\'t be picked up — and says why', () => {
    expect(referee.mayPickUp(0, card, [1, 2])).toEqual({ ok: true })
    expect(referee.mayPickUp(0, card, [1, 3])).toEqual({ ok: false, reason: 'That cell is taken' })
    expect(referee.mayPickUp(0, card, [])).toEqual({ ok: false, reason: "There's nowhere for it to go" })
    expect(referee.mayPickUp(1, card, [2])).toEqual({ ok: false, reason: "It's not your turn" })
  })

  it('custom reasons', () => {
    const r = makeReferee<Card, number>({ mayAct: () => false, notNow: 'Wait for Blue', check: () => null })
    expect(r.judge(0, card, 0)).toEqual({ ok: false, reason: 'Wait for Blue' })
  })
})

describe('rack order: nothing shifts on its own', () => {
  const hand = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  it('dealt in order; slide onto a piece, or move into a gap', () => {
    expect(rackOf(hand)).toEqual(['a', 'b', 'c', 'd'])
    expect(moveInRack(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveInRack(['a', GAP, 'c'], 0, 1)).toEqual([GAP, 'a', 'c'])
  })

  it('a played piece leaves a gap that the next draw fills, in place', () => {
    // b is played, e drawn: e takes b's place
    expect(refillRack(['a', 'b', 'c', 'd'], ['b'], [{ id: 'a' }, { id: 'c' }, { id: 'd' }, { id: 'e' }])).toEqual(['a', 'e', 'c', 'd'])
    // nothing to draw: the gap stays (never closes up)…
    expect(refillRack(['a', 'b', 'c', 'd'], ['b'], [{ id: 'a' }, { id: 'c' }, { id: 'd' }])).toEqual(['a', GAP, 'c', 'd'])
    // …except at the very end
    expect(refillRack(['a', 'b', 'c', 'd'], ['d'], [{ id: 'a' }, { id: 'b' }, { id: 'c' }])).toEqual(['a', 'b', 'c'])
    // more new than gaps: on the end
    expect(refillRack(['a', 'b'], ['a'], [{ id: 'b' }, { id: 'x' }, { id: 'y' }])).toEqual(['x', 'b', 'y'])
  })

  it('places of given pieces; a shuffle keeps every piece', () => {
    expect(placesOf(['a', GAP, 'c', 'd'], ['d', 'a'])).toEqual([0, 3])
    expect(shuffleRack(['a', 'b', 'c'], () => 0).sort()).toEqual(['a', 'b', 'c'])
  })
})
