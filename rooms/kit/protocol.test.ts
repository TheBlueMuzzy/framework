import { describe, expect, it } from 'vitest'
import { MAX_MESSAGE_LENGTH, cleanName, parseClientMessage, parseServerMessage } from './protocol'

const send = (message: unknown) => parseClientMessage(JSON.stringify(message))

describe('protocol: checking what players send', () => {
  it('accepts every room message in its right shape', () => {
    expect(send({ type: 'join', name: 'Sam', persistentId: 'abcdefgh12345678', create: true }))
      .toEqual({ type: 'join', name: 'Sam', persistentId: 'abcdefgh12345678', create: true })
    expect(send({ type: 'leave' })).toEqual({ type: 'leave' })
    expect(send({ type: 'ready', ready: false })).toEqual({ type: 'ready', ready: false })
    expect(send({ type: 'start', options: { board: 'big' } })).toEqual({ type: 'start', options: { board: 'big' } })
    expect(send({ type: 'kick', seatId: 'seat-2' })).toEqual({ type: 'kick', seatId: 'seat-2' })
    expect(send({ type: 'add_bot' })).toEqual({ type: 'add_bot' })
    expect(send({ type: 'back_to_lobby' })).toEqual({ type: 'back_to_lobby' })
    expect(send({ type: 'action', action: [1, 2] })).toEqual({ type: 'action', action: [1, 2] })
  })

  it('keeps only the known fields (extra junk is dropped)', () => {
    expect(send({ type: 'leave', seatId: 'seat-1', isHost: true })).toEqual({ type: 'leave' })
  })

  it('refuses anything else', () => {
    expect(parseClientMessage('not json')).toBeNull()
    expect(parseClientMessage(42)).toBeNull()
    expect(parseClientMessage(new ArrayBuffer(4))).toBeNull()
    expect(send(null)).toBeNull()
    expect(send([1, 2])).toBeNull()
    expect(send({ type: 'teleport' })).toBeNull()
    expect(send({ type: 'ready', ready: 'yes' })).toBeNull()
    expect(send({ type: 'kick', seatId: 3 })).toBeNull()
    expect(send({ type: 'join', name: 'Sam', persistentId: 'short', create: true })).toBeNull()
    expect(send({ type: 'join', name: 'Sam', persistentId: 'x'.repeat(65), create: true })).toBeNull()
    expect(send({ type: 'join', name: 7, persistentId: 'abcdefgh12345678', create: true })).toBeNull()
    expect(send({ type: 'join', name: 'Sam', persistentId: 'abcdefgh12345678' })).toBeNull()
  })

  it('refuses huge messages unread', () => {
    expect(send({ type: 'action', action: 'x'.repeat(MAX_MESSAGE_LENGTH) })).toBeNull()
  })

  it('cleans names: trimmed, single spaces, 16 characters at most', () => {
    expect(cleanName('  Sam   the   Brave  ')).toBe('Sam the Brave')
    expect(cleanName('A very long name indeed')).toBe('A very long name')
    expect(cleanName('   ')).toBe('')
    expect(cleanName(undefined)).toBe('')
  })

  it('reads server messages, ignoring junk', () => {
    expect(parseServerMessage('{"type":"view","view":{"a":1}}')).toEqual({ type: 'view', view: { a: 1 } })
    expect(parseServerMessage('nope')).toBeNull()
    expect(parseServerMessage('{"no":"type"}')).toBeNull()
  })
})
