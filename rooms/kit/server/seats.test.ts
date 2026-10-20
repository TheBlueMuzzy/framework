import { describe, expect, it } from 'vitest'
import {
  addBot, backToLobby, chooseHost, dropOut, handToBot, joinRoom, kick, newRoom,
  playedBy, publicRoom, startPlaying, takeBack, watchersTakeBack, whyNotStart,
} from './seats'
import type { RoomData } from './seats'
import { readSettings } from './settings'

const settings = readSettings({ minSeats: 2, maxSeats: 3, allowBots: true })
const ann = { name: 'Ann', persistentId: 'ann-persistent-1', create: true }
const bob = { name: 'Bob', persistentId: 'bob-persistent-1', create: false }
const cat = { name: 'Cat', persistentId: 'cat-persistent-1', create: false }
const dan = { name: 'Dan', persistentId: 'dan-persistent-1', create: false }

/** A lobby with Ann (host) and Bob. */
function lobby(): RoomData {
  const room = newRoom('BAKU')
  joinRoom(room, ann, settings)
  joinRoom(room, bob, settings)
  return room
}

const names = (room: RoomData) => room.seats.map((seat) => seat.name)
const host = (room: RoomData) => room.seats.find((seat) => seat.isHost)?.name ?? null

describe('seats: joining', () => {
  it('the first player makes the room and is host; others join in order', () => {
    const room = lobby()
    expect(names(room)).toEqual(['Ann', 'Bob'])
    expect(host(room)).toBe('Ann')
    expect(room.seats.map((seat) => seat.id)).toEqual(['seat-1', 'seat-2'])
  })

  it('joining a code nobody is using → no_room; creating a code in use → code_taken', () => {
    expect(joinRoom(newRoom('BAKU'), bob, settings)).toEqual({ ok: false, reason: 'no_room' })
    expect(joinRoom(lobby(), { ...cat, create: true }, settings)).toEqual({ ok: false, reason: 'code_taken' })
  })

  it('a rejoin only takes back the player\'s own seat — never a new room, never a stranger\'s lobby (0.9.0)', () => {
    const empty = newRoom('BAKU')
    expect(joinRoom(empty, { ...ann, rejoin: true }, settings)).toEqual({ ok: false, reason: 'no_room' })
    expect(empty.seats).toEqual([]) // nothing made, even though Ann's request said create: true
    const strangers = lobby()
    expect(joinRoom(strangers, { ...cat, rejoin: true }, settings)).toEqual({ ok: false, reason: 'no_room' })
    const mine = lobby()
    startPlaying(mine)
    handToBot(mine, 'seat-2')
    expect(joinRoom(mine, { ...bob, rejoin: true }, settings)).toMatchObject({ ok: true, cameBack: true, seat: { id: 'seat-2', kind: 'human' } })
  })

  it('refuses junk codes, empty names, a full room and a game in progress', () => {
    expect(joinRoom(newRoom('ZZZZ'), ann, settings)).toEqual({ ok: false, reason: 'no_room' })
    expect(joinRoom(lobby(), { ...cat, name: '   ' }, settings)).toEqual({ ok: false, reason: 'name_needed' })
    const full = lobby()
    joinRoom(full, cat, settings)
    expect(joinRoom(full, dan, settings)).toEqual({ ok: false, reason: 'room_full' })
    const playing = lobby()
    startPlaying(playing)
    expect(joinRoom(playing, cat, settings)).toEqual({ ok: false, reason: 'game_started' })
  })

  it('names are cleaned', () => {
    const room = newRoom('BAKU')
    joinRoom(room, { ...ann, name: '  Ann   Marie  ' }, settings)
    expect(names(room)).toEqual(['Ann Marie'])
  })
})

describe('seats: rejoin (persistentId owns the seat)', () => {
  it('mid-game, a dropped player gets the same seat back', () => {
    const room = lobby()
    startPlaying(room)
    expect(dropOut(room, 'seat-2')).toBe('waiting')
    expect(room.seats[1].connected).toBe(false)
    const back = joinRoom(room, bob, settings)
    expect(back).toMatchObject({ ok: true, cameBack: true, seat: { id: 'seat-2', connected: true } })
  })

  it('takes the seat back even after a bot took it — and the game can still be joined by its owner only', () => {
    const room = lobby()
    startPlaying(room)
    handToBot(room, 'seat-2')
    expect(room.seats[1].kind).toBe('bot')
    expect(joinRoom(room, cat, settings)).toEqual({ ok: false, reason: 'game_started' })
    expect(joinRoom(room, bob, settings)).toMatchObject({ ok: true, cameBack: true, seat: { id: 'seat-2', kind: 'human' } })
  })

  it('also works with create: true (a reload of the tab that made the room)', () => {
    const room = lobby()
    expect(joinRoom(room, ann, settings)).toMatchObject({ ok: true, cameBack: true, seat: { id: 'seat-1' } })
    expect(room.seats).toHaveLength(2)
  })

  it('in the lobby a dropped player loses the seat (they rejoin at the end)', () => {
    const room = lobby()
    joinRoom(room, cat, settings)
    expect(dropOut(room, 'seat-2')).toBe('removed')
    expect(names(room)).toEqual(['Ann', 'Cat'])
    joinRoom(room, bob, settings)
    expect(names(room)).toEqual(['Ann', 'Cat', 'Bob'])
    expect(room.seats[2].id).toBe('seat-4') // seat ids are never reused
  })
})

describe('seats: host migration', () => {
  it('lobby: the host drops → the next player is host', () => {
    const room = lobby()
    dropOut(room, 'seat-1')
    expect(host(room)).toBe('Bob')
  })

  it('mid-game: the host drops → the next CONNECTED human is host, and keeps it when the old host comes back', () => {
    const room = lobby()
    joinRoom(room, cat, settings)
    startPlaying(room)
    dropOut(room, 'seat-2') // Bob away
    dropOut(room, 'seat-1') // Ann (host) away
    expect(host(room)).toBe('Cat')
    joinRoom(room, ann, settings)
    expect(host(room)).toBe('Cat') // no flip-flopping
  })

  it('a bot is never host; with no connected humans nobody is, and the first one back becomes host', () => {
    const room = lobby()
    startPlaying(room)
    handToBot(room, 'seat-1')
    expect(host(room)).toBe('Bob')
    dropOut(room, 'seat-2')
    expect(host(room)).toBeNull()
    joinRoom(room, ann, settings)
    expect(host(room)).toBe('Ann')
  })

  it('chooseHost keeps a connected human host as is', () => {
    const room = lobby()
    chooseHost(room)
    expect(host(room)).toBe('Ann')
  })
})

describe('seats: idle players and bots', () => {
  it('an idle player gets a bot; still connected, they can take the seat back', () => {
    const room = lobby()
    startPlaying(room)
    handToBot(room, 'seat-1') // (RoomServer's idle clock ran out)
    expect(room.seats[0]).toMatchObject({ kind: 'bot', isHost: false, connected: true })
    expect(host(room)).toBe('Bob')
    takeBack(room, 'seat-1')
    expect(room.seats[0]).toMatchObject({ kind: 'human', connected: true })
    expect(host(room)).toBe('Bob')
  })

  it('the host can add bots in the lobby when the game allows them', () => {
    const room = lobby()
    expect(addBot(room, settings)?.name).toBe('Bot 1')
    expect(addBot(room, settings)).toBeNull() // full (3 seats)
    expect(addBot(lobby(), readSettings({ allowBots: false }))).toBeNull()
  })

  it('a bot the game described keeps its profile and name, numbered only when the name is taken', () => {
    const named = addBot(lobby(), settings, { profile: 'Survivor/FirstClass', name: 'The Survivor' })
    expect(named).toMatchObject({ kind: 'bot', name: 'The Survivor', profile: 'Survivor/FirstClass' })
    const room = lobby()
    room.seats[0].name = 'The Survivor'
    expect(addBot(room, settings, { profile: 'Survivor/FirstClass', name: 'The Survivor' })?.name).toBe('The Survivor 2')
  })
})

describe('seats: who plays a seat (playedBy, 0.5.0)', () => {
  it('the person · idle takeover → a bot for them · takeBack → the person again', () => {
    const room = lobby()
    startPlaying(room)
    expect(playedBy(room.seats[0])).toBe('seat')
    handToBot(room, 'seat-1') // idle too long, or the turn timer ran out
    expect(playedBy(room.seats[0])).toBe('bot-for-seat')
    takeBack(room, 'seat-1')
    expect(playedBy(room.seats[0])).toBe('seat')
  })

  it('a bot the host added is a bot from the start — not a bot playing for anyone', () => {
    const room = lobby()
    const bot = addBot(room, settings, { profile: 'Survivor/FirstClass', name: 'The Survivor' })!
    startPlaying(room)
    expect(playedBy(bot)).toBe('bot')
    expect(playedBy(addBot(lobby(), settings)!)).toBe('bot') // plain "Bot 1" too
  })

  it('left / kicked / away too long → a bot playing for them', () => {
    const room = newRoom('BAKU')
    joinRoom(room, ann, settings)
    joinRoom(room, bob, settings)
    joinRoom(room, cat, settings)
    startPlaying(room)
    handToBot(room, 'seat-2') // Bob pressed Leave (RoomServer also drops his connection)
    room.seats[1].connected = false
    kick(room, 'seat-3') // the host removed Cat
    expect(playedBy(room.seats[1])).toBe('bot-for-seat')
    expect(playedBy(room.seats[2])).toBe('bot-for-seat')
    const away = lobby()
    startPlaying(away)
    dropOut(away, 'seat-2')
    expect(playedBy(away.seats[1])).toBe('seat') // dropped, waiting: nobody plays for him yet
    handToBot(away, 'seat-2') // botTakesOverAfterMs ran out
    expect(playedBy(away.seats[1])).toBe('bot-for-seat')
  })

  it('at game over an idle-held seat goes back to its person — so ask playedBy when the move is played, not after', () => {
    const room = lobby()
    startPlaying(room)
    handToBot(room, 'seat-1')
    expect(playedBy(room.seats[0])).toBe('bot-for-seat')
    watchersTakeBack(room)
    expect(playedBy(room.seats[0])).toBe('seat')
  })
})

describe('seats: kick', () => {
  it('lobby: the seat goes and the player can\'t come back', () => {
    const room = lobby()
    expect(kick(room, 'seat-2')?.name).toBe('Bob')
    expect(names(room)).toEqual(['Ann'])
    expect(joinRoom(room, bob, settings)).toEqual({ ok: false, reason: 'kicked' })
  })

  it('mid-game: a bot takes the seat; the host can\'t kick themselves', () => {
    const room = lobby()
    startPlaying(room)
    kick(room, 'seat-2')
    expect(room.seats[1].kind).toBe('bot')
    expect(kick(room, 'seat-1')).toBeNull()
  })

  it('mid-game: a bot the host added stays (a seat is never removed mid-game — the game still has it)', () => {
    const room = lobby()
    addBot(room, settings)
    startPlaying(room)
    expect(kick(room, 'seat-3')).toBeNull()
    expect(names(room)).toEqual(['Ann', 'Bob', 'Bot 1'])
  })
})

describe('seats: starting and ending', () => {
  it('start needs enough seats and everyone (but the host) ready', () => {
    const alone = newRoom('BAKU')
    joinRoom(alone, ann, settings)
    expect(whyNotStart(alone, settings)).toBe('Needs at least 2 players.')
    const room = lobby()
    expect(whyNotStart(room, settings)).toBe('Waiting for Bob to be ready.')
    room.seats[1].ready = true
    expect(whyNotStart(room, settings)).toBeNull()
    startPlaying(room)
    expect(whyNotStart(room, settings)).toBe('A game is already on.')
  })

  it('back to the lobby: players who are gone lose their seats, added bots stay', () => {
    const room = lobby()
    joinRoom(room, cat, settings)
    startPlaying(room)
    dropOut(room, 'seat-3')
    room.phase = 'over'
    backToLobby(room)
    expect(names(room)).toEqual(['Ann', 'Bob'])
    expect(room.phase).toBe('lobby')
    expect(room.seats.every((seat) => !seat.ready)).toBe(true)
  })

  it('what players see never includes a persistentId', () => {
    const room = publicRoom(lobby(), settings)
    expect(JSON.stringify(room)).not.toContain('persistent')
    expect(room).toMatchObject({ code: 'BAKU', phase: 'lobby', minSeats: 2, maxSeats: 3 })
  })
})

describe('settings', () => {
  it('fills in defaults and ignores notes and wrong types', () => {
    const s = readSettings({ maxSeats: 6, _help: 'notes', minSeats: 'two' } as never)
    expect(s.maxSeats).toBe(6)
    expect(s.minSeats).toBe(2)
    expect(s.idleWarnAfterMs).toBe(30_000)
    expect(s.idleTakeoverAfterMs).toBe(60_000)
    expect(s.keepEmptyRoomMs).toBe(300_000) // an empty mid-game room waits 5 minutes (Muzzy, 2026-10-20)
    expect(readSettings({ keepEmptyRoomMs: 10_000 }).keepEmptyRoomMs).toBe(10_000)
  })

  it('game over: a player a bot played for (they idled, still connected) keeps their seat — back to the lobby and in a rematch', () => {
    const room = lobby()
    startPlaying(room)
    handToBot(room, 'seat-2') // idled: still connected
    room.phase = 'over'
    backToLobby(room)
    expect(room.seats.find((s) => s.id === 'seat-2')).toMatchObject({ kind: 'human', connected: true })
    startPlaying(room)
    handToBot(room, 'seat-2')
    room.phase = 'over'
    startPlaying(room) // rematch
    expect(room.seats.find((s) => s.id === 'seat-2')).toMatchObject({ kind: 'human' })
  })

  it('game over: a player who LEFT (disconnected) still loses their seat on back to the lobby', () => {
    const room = lobby()
    startPlaying(room)
    handToBot(room, 'seat-2')
    room.seats.find((s) => s.id === 'seat-2')!.connected = false
    room.phase = 'over'
    backToLobby(room)
    expect(room.seats.find((s) => s.id === 'seat-2')).toBeUndefined()
  })
})
