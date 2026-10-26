// TIC-TAC-TOE ON THE SERVER — the room runs the SAME rules the phone does (src/game/rules.ts), so nobody can cheat.
// The room module (src/rooms/server) does seats, host, rejoin and idle players; this file only plugs the game in
// (src/rooms/server/gameRules.ts): check what arrives, start, apply a move, what each player sees, when it's over.
// A player who goes idle or drops out gets a bot (the rooms module decides when); the bot here plays for them —
// the "online" opponent in content/ai/opponents.json, through the same AI as the offline game.
import { mustBeObject, mustBeWholeNumber } from '../src/rooms/server/checks'
import type { GameRules, RoomTools } from '../src/rooms/server/gameRules'
import { ticTacToe, type Event as GameEvent, type State as Game } from '../src/game/rules'
import { botMove, onlineOpponent } from '../src/ai/bots'

export type Options = Record<string, never>
export interface Action { cell: number }
/** The match: the game + which room seat plays X (order[0]) and O (order[1]) + the bot's random position. Plain JSON. */
export interface State { game: Game; order: string[]; rng: number }
/** What one player sees: the whole board (nothing is secret) and which mark is theirs. */
export interface View { game: Game; order: string[]; mySeat: number | null }
export type Event = GameEvent

const BOT_PAUSE_MS = 900 // a bot playing for someone waits this long before it moves

export const rules: GameRules<State, Options, Action, View, Event> = {
  checkOptions: () => ({}),

  checkAction(raw) {
    const action = mustBeObject(raw, 'action')
    return { cell: mustBeWholeNumber(action.cell, 0, 8, 'cell') }
  },

  onStart(_options, seats, room) {
    const firstSeat = Math.random() < 0.5 ? 0 : 1 // who goes first: decided here, on the server — never on a phone
    const state: State = { game: ticTacToe.setup({ firstSeat }), order: seats.map((seat) => seat.id), rng: Math.floor(Math.random() * 2 ** 31) }
    startTurn(state, room)
    return state
  },

  onAction(state, seat, action, room) {
    const mark = state.order.indexOf(seat.id)
    const reason = ticTacToe.check(state.game, mark, action)
    if (reason) throw new Error(reason)
    const next = play(state, mark, action, room)
    startTurn(next, room)
    return next
  },

  viewFor: (state, seat) => ({ game: ticTacToe.viewFor(state.game, 0), order: state.order, mySeat: state.order.includes(seat.id) ? state.order.indexOf(seat.id) : null }),

  isOver: (state) => state.game.over,

  // A bot took the seat whose turn it is (or its player took it back): start that turn again for whoever plays it now
  onSeatChange(state, _seat, change, room) {
    if (change !== 'dropped') startTurn(state, room)
    return state
  },

  // The match came back from the server's storage (a restart): start the turn's bot or clock again
  onRestore(state, room) {
    startTurn(state, room)
    return state
  },
}

/** One move through the rules' door; the events go to every player (their sounds), before the new views. */
function play(state: State, mark: number, action: Action, room: RoomTools<State, Event>): State {
  const applied = ticTacToe.apply(state.game, mark, action)
  for (const event of applied.events) room.broadcastEvent(event)
  return { ...state, game: applied.state }
}

/** Whose move it is goes on the room's idle clock. A bot (playing for someone who left or went idle) moves by itself. */
function startTurn(state: State, room: RoomTools<State, Event>) {
  if (state.game.over) {
    room.onTheClock([])
    return
  }
  const seatId = state.order[state.game.turn]
  room.onTheClock([seatId])
  if (room.seats().find((seat) => seat.id === seatId)?.kind !== 'bot') return
  room.timers.start('turn', BOT_PAUSE_MS, () => {
    room.update((current) => {
      if (current.game.over || current.order[current.game.turn] !== seatId) return current
      const mark = current.game.turn
      const thought = botMove(onlineOpponent(), current.game, mark, current.rng)
      const next = play({ ...current, rng: thought.rng }, mark, thought.action, room)
      startTurn(next, room)
      return next
    })
  })
}
