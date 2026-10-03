// Lobby: Join waits for a whole code; Start waits for enough players who are all ready
// (unless the game has no onReady: then there's no Ready button and nobody waits for it);
// Copy puts the code on the clipboard, or selects it where there's no clipboard; Back shows only when passed.
// SeatPicker: a tap on a seat picks it; waiting swaps the list for Joining… + Cancel; no seats → the empty message.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { copyText, Lobby, SeatPicker } from './online'
import { toasts } from './dialogs'

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

  it('extra rows (children) show in the room, under the players', () => {
    render(<Lobby {...calls} onJoin={noop} roomCode="ABCD" meId="h" hostId="h" players={[{ id: 'h', name: 'Host' }]}><p>Board: Small</p></Lobby>)
    expect(screen.getByText('Board: Small')).toBeTruthy()
  })

  it('other players get a Ready button instead of Start', () => {
    const onReady = vi.fn()
    render(<Lobby {...calls} onReady={onReady} onJoin={noop} roomCode="ABCD" meId="b" hostId="h" players={[{ id: 'h', name: 'Host' }, { id: 'b', name: 'Bo' }]} />)
    expect(screen.queryByRole('button', { name: 'Start game' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'I’m ready' }))
    expect(onReady).toHaveBeenCalledWith(true)
  })

  it('without onReady: no Ready button or badges, and Start doesn’t wait for ready', () => {
    const players = [{ id: 'h', name: 'Host' }, { id: 'b', name: 'Bo' }]
    const noReady = { onCreate: noop, onStart: noop, onLeave: noop } // no onReady
    const { rerender } = render(<Lobby {...noReady} onJoin={noop} roomCode="ABCD" meId="h" hostId="h" players={players} />)
    expect(screen.getByRole('button', { name: 'Start game' })).toHaveProperty('disabled', false)
    expect(screen.queryByText('Not ready')).toBeNull()
    rerender(<Lobby {...noReady} onJoin={noop} roomCode="ABCD" meId="b" hostId="h" players={players} />)
    expect(screen.queryByRole('button', { name: 'I’m ready' })).toBeNull()
    expect(screen.getByText('Waiting for the host to start…')).toBeTruthy()
  })

  it('Back on the create / join card only when onBack is passed', () => {
    const onBack = vi.fn()
    const { rerender } = render(<Lobby {...calls} onJoin={noop} />)
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    rerender(<Lobby {...calls} onJoin={noop} onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('Copy puts the room code on the clipboard and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(<Lobby {...calls} onJoin={noop} roomCode="QX2T" meId="h" hostId="h" players={[{ id: 'h', name: 'Host' }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await vi.waitFor(() => expect(toasts.current.some((t) => t.text === 'Code copied!')).toBe(true))
    expect(writeText).toHaveBeenCalledWith('QX2T')
    vi.unstubAllGlobals()
  })
})

describe('copyText', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('with no Clipboard API it selects the text instead, and doesn’t throw', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    const box = document.createElement('span')
    box.textContent = 'QX2T'
    document.body.append(box)
    await expect(copyText('QX2T', box)).resolves.toBeTypeOf('boolean')
    expect(window.getSelection()?.toString()).toBe('QX2T')
    box.remove()
  })

  it('when the clipboard refuses, it falls back to selecting too', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: () => Promise.reject(new Error('denied')) } })
    const box = document.createElement('span')
    box.textContent = 'ABCD'
    document.body.append(box)
    await copyText('ABCD', box)
    expect(window.getSelection()?.toString()).toBe('ABCD')
    box.remove()
  })

  it('nothing to select and no clipboard: just false', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    await expect(copyText('ABCD', null)).resolves.toBe(false)
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
