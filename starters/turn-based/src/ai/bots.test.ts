// The two personalities feel different: Careful never misses a win or a block, Careless often misses a block.
import { describe, expect, it } from 'vitest'
import { botMove } from './bots'
import { ticTacToe, type State } from '../game/rules'

/** A board from a picture: X = seat 0, O = seat 1, . = empty. `turn` = who moves next. */
function boardOf(picture: string, turn: number): State {
  const board = [...picture.replace(/\s/g, '')].map((c) => (c === 'X' ? 0 : c === 'O' ? 1 : null))
  return { ...ticTacToe.setup({ firstSeat: 0 }), board, turn }
}

const careful = { personality: 'careful', skill: 'sharp' }
const careless = { personality: 'careless', skill: 'casual' }

describe('the computer opponents', () => {
  it('Careful takes a win when there is one', () => {
    // O to move: O O . on the top row
    const state = boardOf('OO. X.. X.X', 1)
    for (let seed = 1; seed <= 30; seed++) expect(botMove(careful, state, 1, seed).action.cell).toBe(2)
  })

  it('Careful always blocks', () => {
    // O to move: X X . on the top row, nothing for O to win
    const state = boardOf('XX. .O. ...', 1)
    for (let seed = 1; seed <= 30; seed++) expect(botMove(careful, state, 1, seed).action.cell).toBe(2)
  })

  it('Careless misses some blocks', () => {
    const state = boardOf('XX. .O. ...', 1)
    let missed = 0
    for (let seed = 1; seed <= 60; seed++) if (botMove(careless, state, 1, seed).action.cell !== 2) missed++
    expect(missed).toBeGreaterThan(10)
  })

  it('every bot move is a legal move', () => {
    let state = ticTacToe.setup({ firstSeat: 0 })
    let rng = 7
    while (!state.over) {
      const who = state.turn === 0 ? careful : careless
      const move = botMove(who, state, state.turn, rng)
      rng = move.rng
      expect(ticTacToe.check(state, state.turn, move.action)).toBeNull()
      state = ticTacToe.apply(state, state.turn, move.action).state
    }
  })
})
