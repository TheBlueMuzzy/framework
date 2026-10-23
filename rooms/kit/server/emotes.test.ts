// Emotes through the room server (Rooms 0.12.0, F107): relayed to every seat with the sender's REAL seat, checked
// against the phrase list, counted by the server (a flood is held back; the per-match cap holds), never stored, and
// a server bot's room.emote() goes through the same gate.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ServerMessage } from '../protocol'
import { parseClientMessage } from '../protocol'
import type { GameRules, RoomTools } from './gameRules'
import { EmoteGate, readEmoteRoomSettings } from './emotes'
import { RoomServer } from './roomServer'
import type { PartyConnection, PartyRoom } from './roomServer'

class FakeParty implements PartyRoom {
  id = 'BAKU' // (a real room code)
  live = new Map<string, FakeConnection>()
  saves: (string | null)[] = []
  getConnection(id: string) { return this.live.get(id) }
  saveRoom(saved: string | null) { this.saves.push(saved) }
}
class FakeConnection implements PartyConnection {
  received: ServerMessage[] = []
  id: string
  constructor(id: string) { this.id = id }
  send(text: string) { this.received.push(JSON.parse(text)) }
  close() {}
  emotes() { return this.received.filter((m) => m.type === 'emote') }
}

// A game that does nothing but exist (emotes don't touch it)
let tools: RoomTools<{ n: number }, never> | null = null
const nothing: GameRules<{ n: number }, object, object, { n: number }> = {
  checkOptions: () => ({}),
  checkAction: () => ({}),
  onStart: (_o, _s, room) => { tools = room; return { n: 0 } },
  onAction: (s) => ({ n: s.n + 1 }),
  viewFor: (s) => s,
  isOver: () => false,
}
const emotesJson = { phrases: ['hello', 'wellPlayed', 'wow'], server: { burst: 3, refillSeconds: 4, perMatch: 6 } }

let party: FakeParty
let server: RoomServer<{ n: number }, object, object, { n: number }>
function join(tab: string, name: string, id: string, create = false) {
  const c = new FakeConnection(tab)
  party.live.set(tab, c)
  server.onConnect(c)
  server.onMessage(JSON.stringify({ type: 'join', name, persistentId: id, create }), c)
  return c
}
const say = (c: FakeConnection, message: object) => server.onMessage(JSON.stringify(message), c)

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  party = new FakeParty()
  server = new RoomServer(party, nothing, { minSeats: 2, maxSeats: 3, maxMessagesPerSecond: 1000 }, { emotes: emotesJson })
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

function startGame() {
  const ann = join('tab-ann', 'Ann', 'ann-persistent-1', true)
  const bob = join('tab-bob', 'Bob', 'bob-persistent-1')
  say(bob, { type: 'ready', ready: true })
  say(ann, { type: 'start', options: {} })
  return { ann, bob }
}

describe('the emote message', () => {
  it('parses only { type: emote, id } with a short code-name id — never words', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'emote', id: 'wellPlayed' }))).toEqual({ type: 'emote', id: 'wellPlayed' })
    expect(parseClientMessage(JSON.stringify({ type: 'emote', id: 'wellPlayed', seat: 'seat-2' }))).toEqual({ type: 'emote', id: 'wellPlayed' }) // a seat in it is dropped
    for (const id of ['<img src=x onerror=alert(1)>', 'Well played!', '', 'x'.repeat(81), 3, null]) {
      expect(parseClientMessage(JSON.stringify({ type: 'emote', id }))).toBeNull()
    }
  })
})

describe('RoomServer: emotes', () => {
  it('a phrase goes to every seat, the sender\'s too, with the sender\'s own seat', () => {
    const { ann, bob } = startGame()
    say(bob, { type: 'emote', id: 'wellPlayed' })
    expect(ann.emotes()).toEqual([{ type: 'emote', seat: 'seat-2', id: 'wellPlayed' }])
    expect(bob.emotes()).toEqual([{ type: 'emote', seat: 'seat-2', id: 'wellPlayed' }])
  })
  it('works in the lobby too; before joining it is refused like any message', () => {
    const ann = join('tab-ann', 'Ann', 'ann-persistent-1', true)
    say(ann, { type: 'emote', id: 'hello' })
    expect(ann.emotes()).toHaveLength(1)
    const stranger = new FakeConnection('tab-x')
    server.onMessage(JSON.stringify({ type: 'emote', id: 'hello' }), stranger)
    expect(stranger.received.at(-1)).toMatchObject({ type: 'error', code: 'not_now' })
    expect(ann.emotes()).toHaveLength(1)
  })
  it('a forged sender: a seat named in the message is ignored — it always comes from the connection\'s seat', () => {
    const { ann, bob } = startGame()
    say(bob, { type: 'emote', id: 'wow', seat: 'seat-1' })
    say(bob, { type: 'emote', id: 'wow', seatId: 'seat-1', from: 'seat-1' })
    expect(ann.emotes().map((m) => (m as { seat: string }).seat)).toEqual(['seat-2', 'seat-2'])
  })
  it('an id that isn\'t a phrase (or a banter line from a browser) is dropped quietly: no relay, no error back', () => {
    const { ann, bob } = startGame()
    const before = bob.received.length
    say(bob, { type: 'emote', id: 'thanks' }) // well formed, but not in this game's phrases
    say(bob, { type: 'emote', id: 'banter.bully.won' }) // banter is only for the game's own bots
    expect(ann.emotes()).toEqual([])
    expect(bob.received.length).toBe(before)
  })
  it('a flood of 500 at once: only the burst gets through; one more every refillSeconds; the per-match cap holds', () => {
    const { ann, bob } = startGame()
    for (let i = 0; i < 500; i++) say(bob, { type: 'emote', id: 'wow' })
    expect(ann.emotes()).toHaveLength(3)
    vi.advanceTimersByTime(3999)
    say(bob, { type: 'emote', id: 'wow' })
    expect(ann.emotes()).toHaveLength(3)
    vi.advanceTimersByTime(1)
    say(bob, { type: 'emote', id: 'wow' })
    expect(ann.emotes()).toHaveLength(4)
    vi.advanceTimersByTime(60_000) // full again — but the match cap is 6
    for (let i = 0; i < 10; i++) say(bob, { type: 'emote', id: 'wow' })
    expect(ann.emotes()).toHaveLength(6)
    // Ann's own count is untouched by Bob's flood
    say(ann, { type: 'emote', id: 'hello' })
    expect(bob.emotes().at(-1)).toEqual({ type: 'emote', seat: 'seat-1', id: 'hello' })
    // the drop is logged once, not 500 times
    const drops = vi.mocked(console.log).mock.calls.filter((c) => String(c.join(' ')).includes('emotes from seat-2 dropped'))
    expect(drops).toHaveLength(1)
  })
  it('leaving the lobby and joining again (a new seat) never refills the count — it is kept per player', () => {
    const ann = join('tab-ann', 'Ann', 'ann-persistent-1', true)
    let bob = join('tab-bob', 'Bob', 'bob-persistent-1')
    for (let i = 0; i < 3; i++) say(bob, { type: 'emote', id: 'wow' })
    say(bob, { type: 'leave' })
    bob = join('tab-bob2', 'Bob', 'bob-persistent-1')
    expect(server.data.seats.map((s) => s.id)).toEqual(['seat-1', 'seat-3']) // a new seat
    say(bob, { type: 'emote', id: 'wow' })
    expect(ann.emotes()).toHaveLength(3)
  })
  it('a new match starts every count again', () => {
    const { ann, bob } = startGame()
    for (let i = 0; i < 20; i++) { say(bob, { type: 'emote', id: 'wow' }); vi.advanceTimersByTime(4000) }
    expect(ann.emotes()).toHaveLength(6) // the cap
    server.game = null
    server.data.phase = 'over'
    say(ann, { type: 'start', options: {} })
    say(bob, { type: 'emote', id: 'wow' })
    expect(ann.emotes()).toHaveLength(7)
  })
  it('nothing is stored: an emote never writes the saved match or changes the game', async () => {
    const { ann, bob } = startGame()
    await Promise.resolve() // (a save goes out a moment after a change)
    const saves = party.saves.length
    expect(saves).toBeGreaterThan(0) // the match itself IS saved
    const game = server.game
    for (let i = 0; i < 3; i++) say(bob, { type: 'emote', id: 'hello' })
    await Promise.resolve()
    expect(party.saves.length).toBe(saves)
    expect(server.game).toBe(game)
    expect(JSON.stringify(party.saves.at(-1) ?? '')).not.toMatch(/hello/)
    expect(ann.emotes()).toHaveLength(3)
  })
  it('a server bot says its line with room.emote — the same gate (banter allowed from the game\'s own code)', () => {
    const { ann } = startGame()
    expect(tools!.emote('seat-2', 'banter.bully.won')).toBe(true)
    expect(ann.emotes().at(-1)).toEqual({ type: 'emote', seat: 'seat-2', id: 'banter.bully.won' })
    expect(server.emote('seat-2', 'wow')).toBe(true)
    expect(server.emote('seat-2', 'wow')).toBe(true)
    expect(server.emote('seat-2', 'wow')).toBe(false) // its burst is spent too
    expect(server.emote('seat-9', 'wow')).toBe(false) // no such seat
    expect(server.emote('seat-1', 'Hello there')).toBe(false)
  })
  it('a server without content/emotes.json drops emotes (said once in the log)', () => {
    server = new RoomServer(party, nothing, { minSeats: 1 })
    const ann = join('tab-ann', 'Ann', 'ann-persistent-1', true)
    say(ann, { type: 'emote', id: 'hello' })
    say(ann, { type: 'emote', id: 'hello' })
    expect(ann.emotes()).toEqual([])
    expect(vi.mocked(console.log).mock.calls.filter((c) => String(c.join(' ')).includes('has no emotes'))).toHaveLength(1)
  })
})

describe('EmoteGate + readEmoteRoomSettings', () => {
  it('odd settings → the defaults; ids that aren\'t code names are left out', () => {
    expect(readEmoteRoomSettings({ phrases: ['hi', 'Well played!', 'hi'], server: { burst: 0, refillSeconds: 'x', perMatch: 50 } }))
      .toEqual({ phrases: ['hi'], burst: 3, refillSeconds: 4, perMatch: 50 })
    expect(readEmoteRoomSettings(null).phrases).toHaveLength(7)
  })
  it('__proto__ and other built-in names are never phrases', () => {
    const gate = new EmoteGate(readEmoteRoomSettings({ phrases: ['hello'] }))
    for (const id of ['__proto__', 'constructor', 'toString']) expect(gate.allow('seat-1', id, 0).ok).toBe(false)
  })
})
