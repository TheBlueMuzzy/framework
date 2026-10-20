// LAST ROOM — which online room this device was last in, so a player who closed the tab mid-match can get back in
// ("Rejoin match" on the main menu).  (Browser only — the server never imports this.)
//
//   { code, savedAt, phase }   in localStorage under "rooms:last-room"
//
// useRoom keeps it up to date by itself: remembered once the room arrives (phase updated with every room message),
// forgotten when the player leaves on purpose, is kicked, the game is over, or the room is closed / gone.
// The game only ASKS: `matchToRejoin()` → the record when there's a match worth offering, else null.
//
// Why localStorage and not sessionStorage: closing the tab wipes sessionStorage — and getting back after closing the
// tab is the whole point. (The seat itself is owned by the player id, identity.ts — also localStorage.)
// Privacy: the code stays on this device and is only ever sent to the game's own room server.
//
// Every read and write is wrapped: private windows or blocked storage just mean no Rejoin offer.
import type { RoomPhase } from './protocol'
import { isRoomCode } from './roomCodes'

const LAST_ROOM_KEY = 'rooms:last-room'

/**
 * How old a remembered room may be and still be offered. `savedAt` moves on with every room message while the tab is
 * open, so this counts from when the player last saw the room. The server clears an empty room long before this
 * (keepEmptyRoomMs); a room the others are still playing in can last a long match. Too old = forgotten quietly.
 */
export const LAST_ROOM_MAX_AGE_MS = 3 * 60 * 60 * 1000 // 3 hours

export interface LastRoom {
  /** The room code ("BAKU"). */
  code: string
  /** When this device last heard from the room (a Date.now() time). */
  savedAt: number
  /** Where the room was at: lobby · playing · over. */
  phase: RoomPhase
}

/** Remember this room (useRoom calls it with every room message). */
export function rememberLastRoom(code: string, phase: RoomPhase, now = Date.now()): void {
  const record: LastRoom = { code, savedAt: now, phase }
  try {
    localStorage.setItem(LAST_ROOM_KEY, JSON.stringify(record))
  } catch {
    // no storage: no Rejoin offer, nothing breaks
  }
}

/** The room this device was last in, or null (none, damaged, or older than the age limit — then it's forgotten). */
export function readLastRoom(now = Date.now(), maxAgeMs = LAST_ROOM_MAX_AGE_MS): LastRoom | null {
  let record: unknown
  try {
    const text = localStorage.getItem(LAST_ROOM_KEY)
    if (!text) return null
    record = JSON.parse(text)
  } catch {
    forgetLastRoom()
    return null
  }
  if (!isLastRoom(record) || now - record.savedAt > maxAgeMs) {
    forgetLastRoom()
    return null
  }
  return record
}

/**
 * The match to offer as "Rejoin match", or null. Only a match that was being PLAYED: a lobby seat is gone the moment
 * its player drops out (README "The seat rules"), and a finished game has nothing to come back to.
 */
export function matchToRejoin(now = Date.now(), maxAgeMs = LAST_ROOM_MAX_AGE_MS): LastRoom | null {
  const record = readLastRoom(now, maxAgeMs)
  return record?.phase === 'playing' ? record : null
}

/** Forget the remembered room. With a code: only if it's that room (an old room's goodbye never wipes a newer one). */
export function forgetLastRoom(code?: string): void {
  try {
    if (code !== undefined) {
      const text = localStorage.getItem(LAST_ROOM_KEY)
      const record: unknown = text ? JSON.parse(text) : null
      if (isLastRoom(record) && record.code !== code) return
    }
    localStorage.removeItem(LAST_ROOM_KEY)
  } catch {
    // no storage (or a damaged record we couldn't read): try to clear it anyway
    try { localStorage.removeItem(LAST_ROOM_KEY) } catch { /* nothing to do */ }
  }
}

function isLastRoom(value: unknown): value is LastRoom {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.code === 'string' && isRoomCode(record.code)
    && typeof record.savedAt === 'number' && Number.isFinite(record.savedAt)
    && (record.phase === 'lobby' || record.phase === 'playing' || record.phase === 'over')
}
