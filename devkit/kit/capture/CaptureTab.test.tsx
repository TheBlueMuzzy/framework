// Runs in the framework (not copied into games): the Snapshots and Bug capture tabs with a pretend game.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerDevKitGame, type DevKitGame } from '../devkitGame'
import { SnapshotsTab } from '../snapshots/SnapshotsTab'
import { CaptureTab } from './CaptureTab'

// A tiny "game": a turn counter, with an event each time it changes
function pretendGame(online = false) {
  let turn = 1
  const listeners = new Set<(text: string) => void>()
  const game: DevKitGame = {
    name: 'Pretend',
    version: '0.0.1',
    getState: () => ({ turn }),
    setState: vi.fn((state) => { turn = (state as { turn: number }).turn }),
    canRestore: () => !online,
    onEvent: (send) => {
      listeners.add(send)
      return () => { listeners.delete(send) }
    },
    describe: (state) => `turn ${(state as { turn: number }).turn}`,
  }
  const play = () => {
    turn++
    for (const listener of listeners) listener(`turn ${turn}`)
  }
  return { game, play, turn: () => turn }
}

let clipboard = ''
beforeEach(() => {
  clipboard = ''
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (text: string) => { clipboard = text } },
  })
})
afterEach(() => {
  cleanup()
  registerDevKitGame(null)
  localStorage.clear()
})

describe('Snapshots tab', () => {
  it('says how to plug in when the game has no adapter', () => {
    render(<SnapshotsTab files={[]} />)
    expect(screen.getByText(/plugged into the Dev Kit/)).toBeTruthy()
  })

  it('saves a named moment, then restores it after the game moved on', () => {
    const { game, play, turn } = pretendGame()
    registerDevKitGame(game)
    render(<SnapshotsTab files={[]} />)
    fireEvent.change(screen.getByLabelText('Snapshot name'), { target: { value: 'Before the end' } })
    fireEvent.click(screen.getByText('Save moment'))
    expect(screen.getByText('Before the end')).toBeTruthy()
    expect(screen.getByText('turn 1')).toBeTruthy()
    play()
    play()
    expect(turn()).toBe(3)
    fireEvent.click(screen.getByText('Restore'))
    expect(turn()).toBe(1)
    expect(screen.getByRole('status').textContent).toMatch(/Restored "Before the end"/)
  })

  it('lists snapshot files too, and deletes browser ones', () => {
    const { game } = pretendGame()
    registerDevKitGame(game)
    const file = { name: 'From a file', savedAt: '2026-09-30T20:00:00Z', game: 'Pretend', version: '0.0.1', summary: '', state: { turn: 7 } }
    render(<SnapshotsTab files={[file]} />)
    fireEvent.click(screen.getByText('Save moment'))
    expect(screen.getByText('Snapshot 1')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Delete Snapshot 1'))
    expect(screen.queryByText('Snapshot 1')).toBeNull()
    fireEvent.click(screen.getByText('Restore'))
    expect(game.setState).toHaveBeenCalledWith({ turn: 7 })
  })

  it('an online game (canRestore false) cannot restore', () => {
    const { game } = pretendGame(true)
    registerDevKitGame(game)
    render(<SnapshotsTab files={[]} />)
    fireEvent.click(screen.getByText('Save moment'))
    expect((screen.getByText('Restore') as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Restoring is off/)).toBeTruthy()
  })
})

describe('Bug capture tab', () => {
  it('records events, marks a moment, and copies a capture for Claude', async () => {
    const { game, play } = pretendGame()
    registerDevKitGame(game)
    render(<CaptureTab />)
    fireEvent.click(screen.getByText('● Record'))
    act(() => {
      play()
      play()
    })
    fireEvent.click(screen.getByText('📍 Mark'))
    expect(screen.getByText(/📍 0 s ago — turn 3/)).toBeTruthy()
    expect(screen.getByText(/2 events/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('What went wrong?'), { target: { value: 'the turn skipped' } })
    await act(async () => {
      fireEvent.click(screen.getByText('Copy for Claude'))
    })
    expect(clipboard.split('\n')[0]).toBe('/bug — Dev Kit bug capture from Pretend 0.0.1: the turn skipped')
    const json = JSON.parse(clipboard.slice(clipboard.indexOf('{')))
    expect(json.events.map((e: { text: string }) => e.text)).toEqual(['turn 2', 'turn 3'])
    expect(json.marks[0].state).toEqual({ turn: 3 })
    expect(json.device.userAgent).toBeTruthy()
  })

  it('remembers ● Record across reloads', () => {
    const { game } = pretendGame()
    registerDevKitGame(game)
    const first = render(<CaptureTab />)
    fireEvent.click(screen.getByText('● Record'))
    first.unmount()
    render(<CaptureTab />)
    expect(screen.getByText('■ Stop recording')).toBeTruthy()
  })
})
