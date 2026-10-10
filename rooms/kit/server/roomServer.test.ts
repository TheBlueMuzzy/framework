// RoomServer with a fake PartyKit and a tiny game ("Count to 10"): players take turns adding 1–3
// to a shared total; each player also holds a SECRET number only they may see.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Seat, ServerMessage } from '../protocol'
import { mustBeObject, mustBeWholeNumber } from './checks'
import type { GameRules, SeatChange } from './gameRules'
import { RoomServer } from './roomServer'
import type { PartyConnection, PartyRoom } from './roomServer'

// ─── A fake PartyKit ────────────────────────────────────────────────

class FakeParty implements PartyRoom {
  id: string
  live = new Map<string, FakeConnection>()
  constructor(id: string) { this.id = id }
  getConnection(id: string) { return this.live.get(id) }
}

class FakeConnection implements PartyConnection {
  id: string
  party: FakeParty
  received: ServerMessage[] = []
  closed = false
  constructor(party: FakeParty, id: string) { this.id = id; this.party = party }
  send(text: string) { this.received.push(JSON.parse(text)) }
  close() {
    this.closed = true
    if (this.party.live.get(this.id) === this) this.party.live.delete(this.id)
  }
  last<T extends ServerMessage['type']>(type: T) {
    return this.received.filter((m) => m.type === type).at(-1) as Extract<ServerMessage, { type: T }> | undefined
  }
}

// ─── The tiny game ──────────────────────────────────────────────────

interface State { total: number; turn: number; order: string[]; secrets: Record<string, number> }
interface View { total: number; whoseTurn: string; mySecret: number }
const TURN_MS = 90_000 // (longer than the idle clock: idleWarnAfterMs 30 s, idleTakeoverAfterMs 60 s)
const seatChanges: string[] = []

const countToTen: GameRules<State, { secretBase: number }, { add: number }, View, string> = {
  checkOptions(raw) {
    const options = mustBeObject(raw, 'options')
    return { secretBase: mustBeWholeNumber(options.secretBase, 0, 1000, 'secretBase') }
  },
  checkAction(raw) {
    const action = mustBeObject(raw, 'action')
    if (action.look === true) return { add: 0 } // "show me the game again"
    return { add: mustBeWholeNumber(action.add, 1, 3, 'add') }
  },
  onStart(options, seats, room) {
    const secrets: Record<string, number> = {}
    seats.forEach((seat, i) => { secrets[seat.id] = options.secretBase + i })
    room.sendEventPerSeat((seat, i) => (i === 0 ? `your secret is ${secrets[seat.id]}` : null)) // only the first seat hears it
    const state = { total: 0, turn: 0, order: seats.map((s) => s.id), secrets }
    startTurnClock(state, room)
    return state
  },
  onAction(state, seat, action, room) {
    if (action.add === 0) return state // nothing changes: the same state object
    if (state.order[state.turn] !== seat.id) throw new Error('It\'s not your turn.')
    if (action.add === 3 && state.total === 0) room.update((s) => s) // not allowed in here — throws
    room.broadcastEvent(`${seat.name} added ${action.add}`, seat.id)
    const next = { ...state, total: state.total + action.add, turn: (state.turn + 1) % state.order.length }
    startTurnClock(next, room)
    return next
  },
  viewFor(state, seat) {
    return { total: state.total, whoseTurn: state.order[state.turn], mySecret: state.secrets[seat.id] }
  },
  isOver: (state) => state.total >= 10,
  onSeatChange(state, seat: Seat, change: SeatChange) {
    seatChanges.push(`${seat.name}:${change}`)
    return state
  },
}

// Whose turn it is goes on the room's idle clock; the game's own turn timer running out hands the seat to a bot.
// (This tiny game's bots never move — the tests only watch who holds the seat.)
function startTurnClock(state: State, room: Parameters<typeof countToTen.onStart>[2]) {
  const seatId = state.order[state.turn]
  room.onTheClock(state.total >= 10 ? [] : [seatId])
  room.timers.start('turn', TURN_MS, () => room.timedOut(seatId))
}

// ─── Helpers ────────────────────────────────────────────────────────

const ANN = 'ann-persistent-1'
const BOB = 'bob-persistent-1'
const CAT = 'cat-persistent-1'
let party: FakeParty
let server: RoomServer<State, { secretBase: number }, { add: number }, View, string>

function connect(tabId: string): FakeConnection {
  const connection = new FakeConnection(party, tabId)
  party.live.set(tabId, connection)
  server.onConnect(connection)
  return connection
}
function send(connection: FakeConnection, message: object) {
  server.onMessage(JSON.stringify(message), connection)
}
function join(tabId: string, name: string, persistentId: string, create = false): FakeConnection {
  const connection = connect(tabId)
  send(connection, { type: 'join', name, persistentId, create })
  return connection
}
function drop(connection: FakeConnection) {
  connection.close()
  server.onClose(connection)
}
const seats = () => server.data.seats
const seatNamed = (name: string) => seats().find((s) => s.name === name)!

/** Ann (host) and Bob, both ready, game started. */
function startGame() {
  const ann = join('tab-ann', 'Ann', ANN, true)
  const bob = join('tab-bob', 'Bob', BOB)
  send(bob, { type: 'ready', ready: true })
  send(ann, { type: 'start', options: { secretBase: 100 } })
  return { ann, bob }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  seatChanges.length = 0
  party = new FakeParty('BAKU')
  server = new RoomServer(party, countToTen, { minSeats: 2, maxSeats: 3, botTakesOverAfterMs: 60_000, keepEmptyRoomMs: 60_000, idleWarnAfterMs: 30_000, idleTakeoverAfterMs: 60_000 })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ─── Tests ──────────────────────────────────────────────────────────

describe('RoomServer: lobby', () => {
  it('create + join: everyone gets the room and learns which seat is theirs', () => {
    const ann = join('tab-ann', 'Ann', ANN, true)
    const bob = join('tab-bob', 'Bob', BOB)
    expect(ann.last('room')).toMatchObject({ you: 'seat-1', room: { code: 'BAKU', phase: 'lobby' } })
    expect(bob.last('room')).toMatchObject({ you: 'seat-2' })
    expect(ann.last('room')!.room.seats.map((s) => [s.name, s.isHost])).toEqual([['Ann', true], ['Bob', false]])
  })

  it('a wrong code / a taken code shuts the connection out with a reason', () => {
    const lost = join('tab-x', 'Xi', CAT) // nobody made this room
    expect(lost.last('closed')?.reason).toBe('no_room')
    expect(lost.closed).toBe(true)
    join('tab-ann', 'Ann', ANN, true)
    const clash = join('tab-cat', 'Cat', CAT, true)
    expect(clash.last('closed')?.reason).toBe('code_taken')
  })

  it('anything before join, or a junk message, is refused (and the room carries on)', () => {
    const stranger = connect('tab-s')
    send(stranger, { type: 'action', action: { add: 1 } })
    expect(stranger.last('error')?.code).toBe('not_now')
    server.onMessage('{{{', stranger)
    expect(stranger.last('error')?.code).toBe('bad_message')
    expect(stranger.closed).toBe(false)
  })

  it('only the host starts, and only when everyone is ready; the game can refuse bad options', () => {
    const ann = join('tab-ann', 'Ann', ANN, true)
    const bob = join('tab-bob', 'Bob', BOB)
    send(bob, { type: 'start', options: { secretBase: 1 } })
    expect(bob.last('error')?.code).toBe('not_host')
    send(ann, { type: 'start', options: { secretBase: 1 } })
    expect(ann.last('error')).toEqual({ type: 'error', code: 'cant_start', message: 'Waiting for Bob to be ready.' })
    send(bob, { type: 'ready', ready: true })
    send(ann, { type: 'start', options: { secretBase: -5 } })
    expect(ann.last('error')?.message).toBe('secretBase must be a whole number from 0 to 1000')
    expect(server.data.phase).toBe('lobby')
  })

  it('lobby: a player who drops loses the seat, the host moves on, and an empty lobby is cleared', () => {
    const ann = join('tab-ann', 'Ann', ANN, true)
    const bob = join('tab-bob', 'Bob', BOB)
    drop(ann)
    expect(bob.last('room')!.room.seats.map((s) => [s.name, s.isHost])).toEqual([['Bob', true]])
    drop(bob)
    expect(seats()).toEqual([])
    expect(join('tab-cat', 'Cat', CAT).last('closed')?.reason).toBe('no_room') // the code is free again
  })

  it('one connection holds one seat: joining again as someone else is refused (no ghost seat or ghost host)', () => {
    join('tab-ann', 'Ann', ANN, true)
    const bob = join('tab-bob', 'Bob', BOB)
    send(bob, { type: 'join', name: 'Cat', persistentId: CAT, create: false })
    expect(bob.last('error')?.code).toBe('not_now')
    expect(seats().map((s) => s.name)).toEqual(['Ann', 'Bob'])
    drop(bob)
    expect(seats().map((s) => s.name)).toEqual(['Ann'])
  })

  it("flooding: past maxMessagesPerSecond a connection's messages are dropped unread, then it may talk again", () => {
    const ann = join('tab-ann', 'Ann', ANN, true)
    join('tab-bob', 'Bob', BOB)
    const rooms = () => ann.received.filter((m) => m.type === 'room').length
    const before = rooms()
    for (let i = 0; i < 50; i++) send(ann, { type: 'ready', ready: true }) // each one sends the room to everyone
    const roomsSent = rooms()
    expect(roomsSent - before).toBeLessThan(10) // her join was one of this second's 10
    vi.advanceTimersByTime(1000)
    send(ann, { type: 'ready', ready: true })
    expect(ann.received.filter((m) => m.type === 'room').length).toBe(roomsSent + 1)
  })

  it('host can kick; the kicked player is told and can\'t come back', () => {
    const ann = join('tab-ann', 'Ann', ANN, true)
    const bob = join('tab-bob', 'Bob', BOB)
    send(ann, { type: 'kick', seatId: 'seat-2' })
    expect(bob.last('closed')?.reason).toBe('kicked')
    expect(bob.closed).toBe(true)
    expect(join('tab-bob2', 'Bob', BOB).last('closed')?.reason).toBe('kicked')
  })
})

describe('RoomServer: identity and rejoin', () => {
  it('the same player in a second tab takes the seat; the first tab is told', () => {
    const first = join('tab-ann', 'Ann', ANN, true)
    const second = join('tab-ann-2', 'Ann', ANN)
    expect(first.last('closed')?.reason).toBe('connected_elsewhere')
    expect(second.last('room')?.you).toBe('seat-1')
    expect(seats()).toHaveLength(1)
    // The first tab's late close doesn't touch the seat
    server.onClose(first)
    expect(seats()[0].connected).toBe(true)
  })

  it('a tab that reconnects before its old socket\'s close arrives keeps its seat (late close ignored)', () => {
    const { bob } = startGame()
    const bobAgain = new FakeConnection(party, 'tab-bob') // same tab id, new socket
    party.live.set('tab-bob', bobAgain)
    send(bobAgain, { type: 'join', name: 'Bob', persistentId: BOB, create: false })
    server.onClose(bob) // the old socket's close, arriving late
    expect(seatNamed('Bob').connected).toBe(true)
    send(bobAgain, { type: 'action', action: { add: 1 } }) // not his turn, but he's recognised
    expect(bobAgain.last('error')?.message).toBe('It\'s not your turn.')
  })

  it('mid-game: dropped → seat waits; back → same seat + their view straight away', () => {
    const { ann, bob } = startGame()
    drop(bob)
    expect(seatNamed('Bob').connected).toBe(false)
    expect(ann.last('room')!.room.seats[1].connected).toBe(false)
    const bobBack = join('tab-bob-new', 'Bob', BOB)
    expect(bobBack.last('room')?.you).toBe('seat-2')
    expect(bobBack.last('view')).toEqual({ type: 'view', view: { total: 0, whoseTurn: 'seat-1', mySecret: 101 } })
    expect(seatChanges).toEqual(['Bob:dropped', 'Bob:back'])
  })

  it('a player away too long gets a bot — and can still take the seat back', () => {
    const { bob } = startGame()
    drop(bob)
    vi.advanceTimersByTime(59_999)
    expect(seatNamed('Bob').kind).toBe('human')
    vi.advanceTimersByTime(1)
    expect(seatNamed('Bob').kind).toBe('bot')
    join('tab-bob', 'Bob', BOB)
    expect(seatNamed('Bob').kind).toBe('human')
    expect(seatChanges).toContain('Bob:bot')
    expect(seatChanges.at(-1)).toBe('Bob:back')
  })
})

describe('RoomServer: the game', () => {
  it('each player gets ONLY their own view (secrets stay secret in the data)', () => {
    const { ann, bob } = startGame()
    expect(ann.last('view')?.view).toEqual({ total: 0, whoseTurn: 'seat-1', mySecret: 100 })
    expect(bob.last('view')?.view).toEqual({ total: 0, whoseTurn: 'seat-1', mySecret: 101 })
    const everythingAnnGot = JSON.stringify(ann.received)
    expect(everythingAnnGot).not.toContain('101')
    expect(everythingAnnGot).not.toContain(BOB) // persistentIds are never sent
  })

  it('a move is checked, applied, and everyone gets their new view; events go to the others', () => {
    const { ann, bob } = startGame()
    send(ann, { type: 'action', action: { add: 2 } })
    expect(ann.last('view')?.view).toMatchObject({ total: 2, whoseTurn: 'seat-2' })
    expect(bob.last('view')?.view).toMatchObject({ total: 2, whoseTurn: 'seat-2' })
    expect(bob.last('event')?.event).toBe('Ann added 2')
    expect(ann.last('event')?.event).toBe('your secret is 100') // (from the start — not Ann's own move)
  })

  it('per-seat events: a secret reaches only the seat it is for', () => {
    const { ann, bob } = startGame()
    expect(ann.last('event')?.event).toBe('your secret is 100')
    expect(bob.last('event')).toBeUndefined()
    expect(JSON.stringify(bob.received)).not.toContain('your secret')
  })

  it('bad shapes → bad_action; rule breaks → action_refused with the game\'s own words', () => {
    const { ann, bob } = startGame()
    send(ann, { type: 'action', action: { add: 9 } })
    expect(ann.last('error')).toEqual({ type: 'error', code: 'bad_action', message: 'add must be a whole number from 1 to 3' })
    send(bob, { type: 'action', action: { add: 1 } })
    expect(bob.last('error')).toEqual({ type: 'error', code: 'action_refused', message: 'It\'s not your turn.' })
  })

  it("an action that changes nothing (the same state back) re-sends only the sender's view", () => {
    const { ann, bob } = startGame()
    const bobViews = bob.received.length
    send(ann, { type: 'action', action: { look: true } })
    expect(ann.last('view')?.view).toMatchObject({ total: 0 })
    expect(ann.received.at(-1)?.type).toBe('view')
    expect(bob.received.length).toBe(bobViews) // nobody else is sent anything
  })

  it('room.update() inside onAction is refused loudly (return the state instead)', () => {
    const { ann } = startGame()
    send(ann, { type: 'action', action: { add: 3 } })
    expect(ann.last('error')?.message).toContain('room.update() was called inside')
    expect(server.game?.total).toBe(0)
  })

  it('leaving mid-game: the seat stays a bot even if a tap arrives (Leave closed the connection)', () => {
    const { ann, bob } = startGame()
    send(bob, { type: 'leave' })
    send(bob, { type: 'active' })
    expect(bob.last('error')?.code).toBe('not_now') // "Join the room first."
    expect(seatNamed('Bob')).toMatchObject({ kind: 'bot', connected: false })
    expect(ann.last('room')!.room.seats[1].kind).toBe('bot')
  })

  // ─── Idle players (the idle clock) ───

  it('idle on your turn: warned at 30 s (only you), a bot takes your seat at 60 s, mid-turn', () => {
    const { ann, bob } = startGame() // Ann's turn
    vi.advanceTimersByTime(29_999)
    expect(ann.last('idle_warning')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(ann.last('idle_warning')).toEqual({ type: 'idle_warning', msLeft: 30_000 })
    expect(bob.last('idle_warning')).toBeUndefined() // nobody else is told (Bob isn't on the clock)
    vi.advanceTimersByTime(29_999)
    expect(seatNamed('Ann').kind).toBe('human')
    vi.advanceTimersByTime(1)
    expect(seatNamed('Ann')).toMatchObject({ kind: 'bot', connected: true }) // a bot plays; she's still watching
    expect(ann.last('idle_warning_off')).toBeDefined()
    expect(bob.last('room')!.room.seats[0]).toMatchObject({ kind: 'bot', connected: true })
    expect(seatChanges).toEqual(['Ann:bot'])
  })

  it('a tap or a move restarts the clock and takes the warning away', () => {
    const { ann, bob } = startGame()
    vi.advanceTimersByTime(40_000) // warned
    send(ann, { type: 'active' })
    expect(ann.received.at(-1)).toEqual({ type: 'idle_warning_off' })
    vi.advanceTimersByTime(45_000)
    expect(seatNamed('Ann').kind).toBe('human') // 85 s in, but only 45 s since her tap
    send(ann, { type: 'action', action: { add: 1 } }) // her move: Bob's turn, her clock stops
    vi.advanceTimersByTime(30_000)
    expect(bob.last('idle_warning')).toEqual({ type: 'idle_warning', msLeft: 30_000 })
    vi.advanceTimersByTime(60_000)
    expect(seatNamed('Ann').kind).toBe('human')
    expect(seatNamed('Bob').kind).toBe('bot')
  })

  it('active again while the bot has the seat → it is theirs at once (others hear "back"), and their clock runs again', () => {
    const { ann, bob } = startGame()
    vi.advanceTimersByTime(60_000)
    expect(seatNamed('Ann').kind).toBe('bot')
    send(ann, { type: 'active' })
    expect(seatNamed('Ann')).toMatchObject({ kind: 'human', connected: true })
    expect(seatChanges).toEqual(['Ann:bot', 'Ann:back'])
    expect(bob.last('room')!.room.seats[0].kind).toBe('human')
    vi.advanceTimersByTime(60_000) // still her turn, still idle
    expect(seatNamed('Ann').kind).toBe('bot')
    // A move takes it back too (and is played)
    send(ann, { type: 'action', action: { add: 2 } })
    expect(seatNamed('Ann').kind).toBe('human')
    expect(server.game?.total).toBe(2)
  })

  it('the game\'s turn timer running out hands the seat over the same way (and a tap takes it back)', () => {
    const { ann, bob } = startGame()
    send(ann, { type: 'action', action: { add: 1 } }) // Bob's turn
    vi.advanceTimersByTime(50_000)
    send(bob, { type: 'active' }) // he's busy thinking: no idle takeover…
    vi.advanceTimersByTime(40_000) // …but his 90 s turn is up
    expect(seatNamed('Bob')).toMatchObject({ kind: 'bot', connected: true })
    expect(seatChanges).toEqual(['Bob:bot'])
    send(bob, { type: 'active' })
    expect(seatNamed('Bob').kind).toBe('human')
  })

  it('dropped out: no idle clock while away (the away timer gives the bot); reconnecting takes the seat back and restarts the clock', () => {
    const { ann, bob } = startGame()
    send(ann, { type: 'action', action: { add: 1 } }) // Bob's turn
    drop(bob)
    vi.advanceTimersByTime(59_999)
    expect(seatNamed('Bob')).toMatchObject({ kind: 'human', connected: false })
    vi.advanceTimersByTime(1) // botTakesOverAfterMs
    expect(seatNamed('Bob')).toMatchObject({ kind: 'bot', connected: false })
    const back = join('tab-bob-2', 'Bob', BOB)
    expect(seatNamed('Bob')).toMatchObject({ kind: 'human', connected: true })
    expect(server.timers.msLeft('room:idle-takeover:seat-2')).toBe(60_000) // a fresh idle clock
    expect(back.last('idle_warning')).toBeUndefined()
  })

  it('no clock for bot seats, nor once the game is over', () => {
    const { ann, bob } = startGame()
    for (let i = 0; i < 4; i++) {
      send(ann, { type: 'action', action: { add: 1 } })
      send(bob, { type: 'action', action: { add: 2 } })
    }
    expect(server.data.phase).toBe('over')
    expect(server.timers.names().filter((name) => name.includes('idle'))).toEqual([])
  })

  it('leaving mid-game hands the seat to a bot and says goodbye', () => {
    const { ann, bob } = startGame()
    send(bob, { type: 'leave' })
    expect(bob.last('closed')?.reason).toBe('left')
    expect(seatNamed('Bob').kind).toBe('bot')
    expect(ann.last('room')!.room.seats[1].kind).toBe('bot')
  })

  it('the host drops mid-game → the other human is host', () => {
    const { ann, bob } = startGame()
    drop(ann)
    expect(bob.last('room')!.room.seats.find((s) => s.isHost)?.name).toBe('Bob')
  })

  it('game over → "over", game timers stop; host can rematch or go back to the lobby', () => {
    const { ann, bob } = startGame()
    for (let i = 0; i < 4; i++) {
      send(ann, { type: 'action', action: { add: 1 } })
      send(bob, { type: 'action', action: { add: 2 } })
    } // total 12
    expect(server.data.phase).toBe('over')
    expect(ann.last('room')?.room.phase).toBe('over')
    expect(server.timers.names().filter((n) => !n.startsWith('room:'))).toEqual([])
    send(ann, { type: 'action', action: { add: 1 } })
    expect(ann.last('error')?.code).toBe('not_now')
    send(ann, { type: 'back_to_lobby' })
    expect(server.data.phase).toBe('lobby')
    expect(bob.last('view')).toEqual({ type: 'view', view: null })
    send(bob, { type: 'ready', ready: true })
    send(ann, { type: 'start', options: { secretBase: 5 } })
    expect(server.data.phase).toBe('playing')
    expect(bob.last('view')?.view).toMatchObject({ total: 0, mySecret: 6 })
  })

  it('everyone gone mid-game: the room waits, then clears', () => {
    const { ann, bob } = startGame()
    drop(ann)
    drop(bob)
    vi.advanceTimersByTime(59_000)
    expect(join('tab-ann', 'Ann', ANN).last('room')?.you).toBe('seat-1') // back in time
    drop(party.getConnection('tab-ann') as FakeConnection)
    vi.advanceTimersByTime(60_000)
    expect(server.game).toBeNull()
    expect(join('tab-bob', 'Bob', BOB).last('closed')?.reason).toBe('no_room')
  })
})
