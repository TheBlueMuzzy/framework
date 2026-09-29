// Lobby: Join waits for a whole code; Start waits for enough players who are all ready.
// SeatPicker: a tap on a seat picks it; waiting swaps the list for Joining… + Cancel; no seats → the empty message.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Lobby, SeatPicker } from './online'

afterEach(cleanup)
const noop = () => {}
const calls = { onCreate: noop, onReady: noop, onStart: noop, onLeave: noop }

describe('Lobby', () => {
  it('Join only works once the whole room code is typed', () => {
    const onJoin = vi.fn()
    render(<Lobby {...calls} onJoin={onJoin} />)
    const join = screen.getByRole('button', { name: 'Join' })
    expect(join).toHaveProperty('disabled', true)
    fireEvent.paste(screen.getAllByRole('textbox')[0], { clipboardData: { getData: () => 'abcd' } })
    fireEvent.click(join)
    expect(onJoin).toHaveBeenCalledWith('ABCD')
  })

  it('the host can start only with enough players, all ready', () => {
    const players = [{ id: 'h', name: 'Host' }, { id: 'b', name: 'Bo', ready: false }]
    const { rerender } = render(<Lobby {...calls} onJoin={noop} roomCode="ABCD" meId="h" hostId="h" players={players} />)
    expect(screen.getByRole('button', { name: 'Start game' })).toHaveProperty('disabled', true)
    rerender(<Lobby {...calls} onJoin={noop} roomCode="ABCD" meId="h" hostId="h" players={[players[0], { ...players[1], ready: true }]} />)
    expect(screen.getByRole('button', { name: 'Start game' })).toHaveProperty('disabled', false)
  })

  it('other players get a Ready button instead of Start', () => {
    const onReady = vi.fn()
    render(<Lobby {...calls} onReady={onReady} onJoin={noop} roomCode="ABCD" meId="b" hostId="h" players={[{ id: 'h', name: 'Host' }, { id: 'b', name: 'Bo' }]} />)
    expect(screen.queryByRole('button', { name: 'Start game' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'I’m ready' }))
    expect(onReady).toHaveBeenCalledWith(true)
  })
})

describe('SeatPicker', () => {
  const seats = [{ id: 'z', name: 'Zippy', badge: 'bot', detail: 'Score 12' }, { id: 'b', name: 'Bolt', color: 'tomato' }]

  it('tapping a seat picks it; Leave cancels', () => {
    const onPick = vi.fn(), onCancel = vi.fn()
    render(<SeatPicker seats={seats} onPick={onPick} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /Bolt/ }))
    expect(onPick).toHaveBeenCalledWith('b')
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('while waiting: no seats to tap, Joining… and Cancel', () => {
    const onCancel = vi.fn()
    render(<SeatPicker seats={seats} waiting onPick={noop} onCancel={onCancel} />)
    expect(screen.queryByRole('button', { name: /Zippy/ })).toBeNull()
    expect(screen.getByRole('status', { name: 'Joining…' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('no seats shows the empty message and Leave', () => {
    render(<SeatPicker seats={[]} onPick={noop} onCancel={noop} words={{ empty: 'Full up' }} />)
    expect(screen.getByText('Full up')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Leave' })).toBeTruthy()
  })
})
