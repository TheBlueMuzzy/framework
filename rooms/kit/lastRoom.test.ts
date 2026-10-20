import { afterEach, describe, expect, it, vi } from 'vitest'
import { forgetLastRoom, LAST_ROOM_MAX_AGE_MS, matchToRejoin, readLastRoom, rememberLastRoom } from './lastRoom'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('last room (Rejoin match)', () => {
  it('remembers { code, savedAt, phase } in localStorage (it must outlive a closed tab)', () => {
    rememberLastRoom('BAKU', 'playing', 1000)
    expect(JSON.parse(localStorage.getItem('rooms:last-room')!)).toEqual({ code: 'BAKU', savedAt: 1000, phase: 'playing' })
    expect(readLastRoom(2000)).toEqual({ code: 'BAKU', savedAt: 1000, phase: 'playing' })
  })

  it('only a match being played is offered — not a lobby, not a finished game', () => {
    rememberLastRoom('BAKU', 'lobby', 1000)
    expect(matchToRejoin(1000)).toBeNull()
    rememberLastRoom('BAKU', 'over', 1000)
    expect(matchToRejoin(1000)).toBeNull()
    rememberLastRoom('BAKU', 'playing', 1000)
    expect(matchToRejoin(1000)?.code).toBe('BAKU')
  })

  it('too old → forgotten quietly', () => {
    rememberLastRoom('BAKU', 'playing', 0)
    expect(matchToRejoin(LAST_ROOM_MAX_AGE_MS)).not.toBeNull()
    expect(matchToRejoin(LAST_ROOM_MAX_AGE_MS + 1)).toBeNull()
    expect(localStorage.getItem('rooms:last-room')).toBeNull()
  })

  it('damaged or junk records → nothing offered, and cleared', () => {
    for (const junk of ['{oops', '"BAKU"', JSON.stringify({ code: 'NOPE!', savedAt: 1, phase: 'playing' }), JSON.stringify({ code: 'BAKU', savedAt: 'x', phase: 'playing' }), JSON.stringify({ code: 'BAKU', savedAt: 1, phase: 'dancing' })]) {
      localStorage.setItem('rooms:last-room', junk)
      expect(readLastRoom(1)).toBeNull()
      expect(localStorage.getItem('rooms:last-room')).toBeNull()
    }
  })

  it('forget: all, or only if it is that room (an old room never wipes a newer one)', () => {
    rememberLastRoom('MOTE', 'playing', 1)
    forgetLastRoom('BAKU')
    expect(readLastRoom(1)?.code).toBe('MOTE')
    forgetLastRoom('MOTE')
    expect(readLastRoom(1)).toBeNull()
    rememberLastRoom('MOTE', 'playing', 1)
    forgetLastRoom()
    expect(readLastRoom(1)).toBeNull()
  })

  it('blocked storage: no offer, nothing throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => rememberLastRoom('BAKU', 'playing')).not.toThrow()
    expect(matchToRejoin()).toBeNull()
    expect(() => forgetLastRoom('BAKU')).not.toThrow()
  })
})
