// TIC-TAC-TOE RULES — the game itself, on the Table module's `Rules` contract (src/table/core.ts).
// Pure: no screen, no network, no clock. The same rules run on the phone, the online server (party/rules.ts),
// the bots (src/ai/) and the tests. A new game replaces THIS file first.
//
// Seat 0 plays X, seat 1 plays O. Whoever goes first is decided before the game (Setup.firstSeat), so the rules
// themselves never roll dice.
import type { Rules, Seat } from '../table/core'

/** One square: empty, or the seat whose mark is on it. */
export type Cell = Seat | null

/** The whole game, as plain JSON (snapshots, saves and the online server keep it as it is). */
export interface State {
  board: Cell[] // 9 squares, row by row: 0 1 2 / 3 4 5 / 6 7 8
  turn: Seat // whose move it is (stays on the last mover once the game is over)
  firstSeat: Seat
  winner: Seat | null // null = nobody (yet, or a draw)
  winLine: number[] | null // the three squares that won
  over: boolean
}

export interface Setup {
  firstSeat: Seat
}

/** A move: put your mark on this square. */
export interface Action {
  cell: number
}

export type Event =
  | { type: 'placed'; seen: 'all'; seat: Seat; cell: number }
  | { type: 'won'; seen: 'all'; seat: Seat; line: number[] }
  | { type: 'draw'; seen: 'all' }

/** Nothing is secret in tic-tac-toe, so every seat sees the whole game. */
export type View = State

export const SEATS = 2

/** The eight ways to make three in a row. */
export const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
]

export const otherSeat = (seat: Seat): Seat => (seat === 0 ? 1 : 0)

/** The line this seat has completed, or null. */
export function lineFor(board: Cell[], seat: Seat): number[] | null {
  return LINES.find((line) => line.every((cell) => board[cell] === seat)) ?? null
}

export const emptyCells = (board: Cell[]): number[] => board.flatMap((cell, i) => (cell === null ? [i] : []))

export const ticTacToe: Rules<State, Action, Event, Setup, View> = {
  setup: ({ firstSeat }) => ({
    board: Array(9).fill(null),
    turn: firstSeat,
    firstSeat,
    winner: null,
    winLine: null,
    over: false,
  }),

  legalActions: (state, seat) => (state.over || seat !== state.turn ? [] : emptyCells(state.board).map((cell) => ({ cell }))),

  check(state, seat, action) {
    if (state.over) return 'The game is over.'
    if (seat !== state.turn) return "It's not your turn."
    if (!Number.isInteger(action?.cell) || action.cell < 0 || action.cell > 8) return 'That square is not on the board.'
    if (state.board[action.cell] !== null) return 'That square is taken.'
    return null
  },

  apply(state, seat, action) {
    const reason = ticTacToe.check(state, seat, action)
    if (reason) throw new Error(reason)
    const board = [...state.board]
    board[action.cell] = seat
    const events: Event[] = [{ type: 'placed', seen: 'all', seat, cell: action.cell }]
    const line = lineFor(board, seat)
    if (line) {
      events.push({ type: 'won', seen: 'all', seat, line })
      return { state: { ...state, board, winner: seat, winLine: line, over: true }, events }
    }
    if (emptyCells(board).length === 0) {
      events.push({ type: 'draw', seen: 'all' })
      return { state: { ...state, board, over: true }, events }
    }
    return { state: { ...state, board, turn: otherSeat(seat) }, events }
  },

  isOver: (state) => state.over,
  toAct: (state) => (state.over ? [] : [state.turn]),
  viewFor: (state) => state,
}
