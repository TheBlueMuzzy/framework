// Lobby: Join waits for a whole code; Start waits for enough players who are all ready.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Lobby } from './online'

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
