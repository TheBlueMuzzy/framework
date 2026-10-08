import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RoomState, ServerMessage } from './protocol'
import { useRoom } from './useRoom'

// A fake PartySocket: records what's sent; the test plays the server.
class FakeSocket {
  room: string
  sent: Record<string, unknown>[] = []
  readyState = 0
  closed = false
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  constructor(room: string) { this.room = room }
  send(text: string) { this.sent.push(JSON.parse(text)) }
  close() { this.closed = true; this.readyState = 3 }
  // server side
  open() { this.readyState = 1; act(() => this.onopen?.()) }
  drop() { this.readyState = 3; act(() => this.onclose?.()) }
  receive(message: ServerMessage) { act(() => this.onmessage?.({ data: JSON.stringify(message) })) }
}

const sockets: FakeSocket[] = []
vi.mock('./roomClient', () => ({
  openRoomSocket: (room: string) => {
    const socket = new FakeSocket(room)
    sockets.push(socket)
    return socket
  },
  sendToRoom: (socket: FakeSocket, message: unknown) => socket.send(JSON.stringify(message)),
}))

const room: RoomState = {
  code: 'BAKU',
  phase: 'lobby',
  minSeats: 2,
  maxSeats: 4,
  seats: [
    { id: 'seat-1', name: 'Ann', kind: 'human', isHost: true, connected: true, ready: false },
    { id: 'seat-2', name: 'Bob', kind: 'human', isHost: false, connected: true, ready: false },
  ],
}

afterEach(() => {
  sockets.length = 0
  localStorage.clear()
})

describe('useRoom', () => {
  it('no code = idle, no connection', () => {
    const { result } = renderHook(() => useRoom(null, { name: 'Ann', create: true }))
    expect(result.current.status).toBe('idle')
    expect(sockets).toHaveLength(0)
  })

  it('opens, says who we are (join), and is "open" once the room arrives', () => {
    const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
    expect(result.current.status).toBe('connecting')
    const socket = sockets[0]
    expect(socket.room).toBe('BAKU')
    socket.open()
    expect(socket.sent).toEqual([{ type: 'join', name: 'Ann', persistentId: localStorage.getItem('rooms:persistent-id'), create: true }])
    socket.receive({ type: 'room', room, you: 'seat-1' })
    expect(result.current.status).toBe('open')
    expect(result.current.mySeat?.name).toBe('Ann')
    expect(result.current.isHost).toBe(true)
    expect(result.current.room?.seats).toHaveLength(2)
  })

  it('a dropped connection → "reconnecting"; on reopen it rejoins (never "create" again)', () => {
    const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
    const socket = sockets[0]
    socket.open()
    socket.receive({ type: 'room', room, you: 'seat-1' })
    socket.drop()
    expect(result.current.status).toBe('reconnecting')
    expect(result.current.room).not.toBeNull() // keeps showing the room meanwhile
    socket.open()
    expect(socket.sent.at(-1)).toMatchObject({ type: 'join', create: false })
    socket.receive({ type: 'room', room, you: 'seat-1' })
    expect(result.current.status).toBe('open')
  })

  it('views update; every event reaches onEvent in order', () => {
    const events: unknown[] = []
    const { result } = renderHook(() => useRoom<{ total: number }>('BAKU', { name: 'Ann', create: false }, { onEvent: (e) => events.push(e) }))
    const socket = sockets[0]
    socket.open()
    socket.receive({ type: 'room', room, you: 'seat-1' })
    act(() => {
      socket.onmessage?.({ data: JSON.stringify({ type: 'event', event: 'first' }) })
      socket.onmessage?.({ data: JSON.stringify({ type: 'event', event: 'second' }) })
      socket.onmessage?.({ data: JSON.stringify({ type: 'view', view: { total: 3 } }) })
    })
    expect(events).toEqual(['first', 'second'])
    expect(result.current.view).toEqual({ total: 3 })
  })

  it('send / start / ready go out only while open', () => {
    const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
    const socket = sockets[0]
    expect(result.current.send({ add: 1 })).toBe(false)
    socket.open()
    socket.receive({ type: 'room', room, you: 'seat-1' })
    expect(result.current.send({ add: 1 })).toBe(true)
    act(() => result.current.setReady(true))
    act(() => result.current.start({ board: 'big' }))
    act(() => result.current.kick('seat-2'))
    expect(socket.sent.slice(1)).toEqual([
      { type: 'action', action: { add: 1 } },
      { type: 'ready', ready: true },
      { type: 'start', options: { board: 'big' } },
      { type: 'kick', seatId: 'seat-2' },
    ])
  })

  it('errors are shown until cleared, and the room carries on', () => {
    const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
    sockets[0].open()
    sockets[0].receive({ type: 'error', code: 'action_refused', message: 'It\'s not your turn.' })
    expect(result.current.error).toEqual({ code: 'action_refused', message: 'It\'s not your turn.' })
    act(() => result.current.clearError())
    expect(result.current.error).toBeNull()
  })

  it('"closed" from the server stops it for good (no reconnecting)', () => {
    const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: false }))
    const socket = sockets[0]
    socket.open()
    socket.receive({ type: 'closed', reason: 'no_room', message: 'There\'s no room with that code.' })
    expect(result.current.status).toBe('closed')
    expect(result.current.closedReason).toBe('no_room')
    expect(socket.closed).toBe(true)
    socket.drop()
    expect(result.current.status).toBe('closed')
  })

  it('leave() tells the server, then disconnects', () => {
    const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
    const socket = sockets[0]
    socket.open()
    socket.receive({ type: 'room', room, you: 'seat-1' })
    act(() => result.current.leave())
    expect(socket.sent.at(-1)).toEqual({ type: 'leave' })
    expect(socket.closed).toBe(true)
    expect(result.current.status).toBe('closed')
    expect(result.current.closedReason).toBe('left')
  })

  it('unmounting only drops the connection — it never gives up the seat', () => {
    const { unmount } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
    const socket = sockets[0]
    socket.open()
    unmount()
    expect(socket.closed).toBe(true)
    expect(socket.sent.some((m) => m.type === 'leave')).toBe(false)
  })

  it('StrictMode (dev) mounts twice: the first connection is closed quietly, the second one is used', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
    const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }), { wrapper, reactStrictMode: true })
    expect(sockets).toHaveLength(2)
    expect(sockets[0].closed).toBe(true)
    expect(sockets[0].sent).toEqual([])
    sockets[1].open()
    sockets[1].receive({ type: 'room', room, you: 'seat-1' })
    expect(result.current.status).toBe('open')
  })

  it('a new code starts fresh', () => {
    const { result, rerender } = renderHook(({ code }) => useRoom(code, { name: 'Ann', create: true }), { initialProps: { code: 'BAKU' } })
    sockets[0].open()
    sockets[0].receive({ type: 'room', room, you: 'seat-1' })
    rerender({ code: 'MOTI' })
    expect(sockets[0].closed).toBe(true)
    expect(sockets[1].room).toBe('MOTI')
    expect(result.current.status).toBe('connecting')
    expect(result.current.room).toBeNull()
  })

  it('idle: the warning arrives with its end time and goes away; a dropped connection clears it', () => {
    vi.useFakeTimers({ now: 1_000_000 })
    try {
      const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
      const socket = sockets[0]
      socket.open()
      socket.receive({ type: 'room', room: { ...room, phase: 'playing' }, you: 'seat-1' })
      expect(result.current.idleWarning).toBeNull()
      socket.receive({ type: 'idle_warning', msLeft: 30_000 })
      expect(result.current.idleWarning).toEqual({ endsAt: 1_030_000 })
      socket.receive({ type: 'idle_warning_off' })
      expect(result.current.idleWarning).toBeNull()
      socket.receive({ type: 'idle_warning', msLeft: 30_000 })
      socket.drop()
      expect(result.current.idleWarning).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('active(): at most one ping every few seconds — but at once while warned or while the bot plays for me', () => {
    vi.useFakeTimers({ now: 1_000_000 })
    try {
      const { result } = renderHook(() => useRoom('BAKU', { name: 'Ann', create: true }))
      const socket = sockets[0]
      socket.open()
      socket.receive({ type: 'room', room: { ...room, phase: 'playing' }, you: 'seat-1' })
      const pings = () => socket.sent.filter((message) => message.type === 'active').length
      expect(result.current.botPlaysForMe).toBe(false)
      act(() => result.current.active())
      act(() => result.current.active())
      expect(pings()).toBe(1)
      vi.advanceTimersByTime(5_000)
      act(() => result.current.active())
      expect(pings()).toBe(2)
      // Warned: every tap goes straight out
      socket.receive({ type: 'idle_warning', msLeft: 30_000 })
      act(() => result.current.active())
      expect(pings()).toBe(3)
      socket.receive({ type: 'idle_warning_off' })
      // The bot plays my seat (I idled, still connected): botPlaysForMe, and a tap goes straight out
      const botHasMe: RoomState = { ...room, phase: 'playing', seats: [{ ...room.seats[0], kind: 'bot' }, room.seats[1]] }
      socket.receive({ type: 'room', room: botHasMe, you: 'seat-1' })
      expect(result.current.botPlaysForMe).toBe(true)
      act(() => result.current.active())
      expect(pings()).toBe(4)
    } finally {
      vi.useRealTimers()
    }
  })
})
