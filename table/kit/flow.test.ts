import { describe, expect, it } from 'vitest'
import { mayAct, nextClockwise, nextStep, seatToAct, snakeOrder, undoStep, type Flow } from './flow'

describe('who may act', () => {
  const play: Flow = { level: 'play', acting: [2] }
  const over: Flow = { level: 'over', acting: [] }
  it('only the acting seats', () => {
    expect(mayAct(play, 2)).toBe(true)
    expect(mayAct(play, 0)).toBe(false)
    expect(mayAct(over, 2)).toBe(false)
    expect(seatToAct(play)).toBe(2)
    expect(seatToAct(over)).toBeNull()
    expect(seatToAct({ level: 'vote', acting: [0, 1] })).toBeNull()
  })
})

describe('orders', () => {
  it('snake: the first to pick picks last next round', () => {
    expect(snakeOrder(2, 2)).toEqual([0, 1, 1, 0])
    expect(snakeOrder(3, 2)).toEqual([0, 1, 2, 2, 1, 0])
    expect(snakeOrder(4, 2)).toEqual([0, 1, 2, 3, 3, 2, 1, 0])
    expect(snakeOrder(2, 3)).toEqual([0, 1, 1, 0, 0, 1])
  })

  it('clockwise, skipping seats that cannot play; the seat itself comes last; null if nobody can', () => {
    expect(nextClockwise(0, 3, () => true)).toBe(1)
    expect(nextClockwise(2, 3, () => true)).toBe(0)
    expect(nextClockwise(0, 4, (s) => s !== 1)).toBe(2)
    expect(nextClockwise(1, 3, (s) => s === 1)).toBe(1)
    expect(nextClockwise(0, 3, () => false)).toBeNull()
  })
})

describe('turn steps and undo', () => {
  const steps = ['move', 'cast'] as const
  it('next step, in order', () => {
    expect(nextStep(steps, [])).toBe('move')
    expect(nextStep(steps, ['move'])).toBe('cast')
    expect(nextStep(steps, ['move', 'cast'])).toBeNull()
  })
  it('undo takes back the last step this turn, never past the start', () => {
    expect(undoStep(['move', 'cast'])).toBe('cast')
    expect(undoStep(['move'])).toBe('move')
    expect(undoStep([])).toBeNull()
  })
})
