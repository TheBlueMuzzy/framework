import { describe, expect, it } from 'vitest'
import { replay } from '../table/core'
import { selfTest } from '../table/selfTest'
import { SEATS, ticTacToe, type Action, type Setup, type State } from './rules'

const start = (firstSeat = 0) => ticTacToe.setup({ firstSeat })
/** Plays moves in turn order from a fresh game; returns the last state. */
function play(cells: number[], firstSeat = 0): State {
  let state = start(firstSeat)
  for (const cell of cells) state = ticTacToe.apply(state, state.turn, { cell }).state
  return state
}

describe('tic-tac-toe rules', () => {
  it('keeps every Table promise', () => {
    const setups: Setup[] = [{ firstSeat: 0 }, { firstSeat: 1 }, { firstSeat: 0 }, { firstSeat: 1 }]
    expect(selfTest(ticTacToe, setups, { seatCount: () => SEATS })).toEqual([])
  })

  it('starts empty, with the first seat to move', () => {
    const state = start(1)
    expect(state.board.every((c) => c === null)).toBe(true)
    expect(ticTacToe.toAct(state)).toEqual([1])
    expect(ticTacToe.legalActions(state, 1)).toHaveLength(9)
    expect(ticTacToe.legalActions(state, 0)).toEqual([])
  })

  it('says no in plain words', () => {
    const state = play([4])
    expect(ticTacToe.check(state, 0, { cell: 0 })).toBe("It's not your turn.")
    expect(ticTacToe.check(state, 1, { cell: 4 })).toBe('That square is taken.')
    expect(ticTacToe.check(state, 1, { cell: 9 })).toBe('That square is not on the board.')
    expect(() => ticTacToe.apply(state, 1, { cell: 4 })).toThrow('That square is taken.')
  })

  it('three in a row wins', () => {
    // X: 0 1 2 · O: 3 4
    const state = play([0, 3, 1, 4, 2])
    expect(state.over).toBe(true)
    expect(state.winner).toBe(0)
    expect(state.winLine).toEqual([0, 1, 2])
    expect(ticTacToe.toAct(state)).toEqual([])
    expect(ticTacToe.check(state, 1, { cell: 8 })).toBe('The game is over.')
  })

  it('a full board with no line is a draw', () => {
    // X O X / X O O / O X X
    const state = play([0, 1, 2, 4, 3, 5, 7, 6, 8])
    expect(state.over).toBe(true)
    expect(state.winner).toBeNull()
    const last = ticTacToe.apply(play([0, 1, 2, 4, 3, 5, 7, 6]), 0, { cell: 8 })
    expect(last.events.map((e) => e.type)).toEqual(['placed', 'draw'])
  })

  it('a move record replays to the same game', () => {
    const moves: { seat: number; action: Action }[] = [0, 4, 8, 2, 6].map((cell, i) => ({ seat: i % 2, action: { cell } }))
    const { state } = replay(ticTacToe, { setup: { firstSeat: 0 }, moves })
    expect(state).toEqual(play([0, 4, 8, 2, 6]))
  })
})
