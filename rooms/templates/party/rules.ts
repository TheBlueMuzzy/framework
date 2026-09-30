// THE GAME'S RULES ON THE SERVER — an EXAMPLE to replace with the real game.
// "Count to 10": players take turns adding 1–3 to a shared total; each player also has a secret
// number only they can see. It shows every part a game plugs in (see src/rooms/server/gameRules.ts):
// check what arrives, start, apply a move, what each player may see, when it's over, idle players.
// A real game usually calls its own rules engine in onStart / onAction (the same code the phone runs).
import { mustBeObject, mustBeWholeNumber } from '../src/rooms/server/checks'
import type { GameRules, RoomTools } from '../src/rooms/server/gameRules'

export interface Options { target: number }
export interface Action { add: number }
export interface State { total: number; target: number; turn: number; order: string[]; secrets: Record<string, number> }
/** What ONE player sees: the total and whose turn it is, and only their own secret. */
export interface View { total: number; target: number; whoseTurn: string; mySecret: number }
export type Event = string

const TURN_MS = 30_000

export const rules: GameRules<State, Options, Action, View, Event> = {
  checkOptions(raw) {
    const options = mustBeObject(raw ?? {}, 'options')
    return { target: options.target === undefined ? 10 : mustBeWholeNumber(options.target, 5, 50, 'target') }
  },

  checkAction(raw) {
    const action = mustBeObject(raw, 'action')
    return { add: mustBeWholeNumber(action.add, 1, 3, 'add') }
  },

  onStart(options, seats, room) {
    // Shared random things are made here, on the server — never on a phone
    const secrets: Record<string, number> = {}
    for (const seat of seats) secrets[seat.id] = 1 + Math.floor(Math.random() * 9)
    const state: State = { total: 0, target: options.target, turn: 0, order: seats.map((seat) => seat.id), secrets }
    startTurnClock(state, room)
    return state
  },

  onAction(state, seat, action, room) {
    if (state.order[state.turn] !== seat.id) throw new Error('It\'s not your turn.')
    room.broadcastEvent(`${seat.name} added ${action.add}`, seat.id)
    const next = { ...state, total: state.total + action.add, turn: (state.turn + 1) % state.order.length }
    startTurnClock(next, room)
    return next
  },

  viewFor(state, seat) {
    return { total: state.total, target: state.target, whoseTurn: state.order[state.turn], mySecret: state.secrets[seat.id] }
  },

  isOver: (state) => state.total >= state.target,
}

// A player who doesn't move in time: the server adds 1 for them and counts a missed turn
// (after content/rooms.json "missedTurnsBeforeBot" in a row, a bot takes their seat).
// Bots here just keep adding 1 through this same clock.
function startTurnClock(state: State, room: RoomTools<State, Event>) {
  const seatId = state.order[state.turn]
  room.timers.start('turn', TURN_MS, () => {
    room.missedTurn(seatId)
    room.update((current) => {
      const next = { ...current, total: current.total + 1, turn: (current.turn + 1) % current.order.length }
      startTurnClock(next, room)
      return next
    })
  })
}
