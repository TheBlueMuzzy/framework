// Runs in the framework: the Screens tab lists the game's previews and opens one in the overlay; closing it
// (✕ or Esc) touches nothing in the game — Esc never reaches the game's own listeners, and history ends up as it was.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DevKit } from '../DevKit'
import PreviewsTab from './PreviewsTab'
import { blockedLine } from './overlayLogic'
import { groupPreviews, previewUrl, readPreviewUrl, type DevKitPreview } from './previewTypes'

afterEach(cleanup)

// jsdom has no modal dialogs yet: open = the attribute
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
}

const previews: DevKitPreview[] = [
  { id: 'end-table', label: 'End table', group: 'End of game', variants: [{ id: '2p', label: '2 players' }, { id: '4p', label: '4 players' }], show: () => {} },
  { id: 'pause', label: 'Pause', group: 'In game', hint: 'phone', note: 'The Menu button', show: () => {} },
  { id: 'reveal', label: 'Reveal', group: 'End of game', show: () => {} },
]
const load = () => Promise.resolve(previews)
const frame = () => document.querySelector('dialog.devkit-preview iframe') as HTMLIFrameElement | null

describe('preview addresses and groups', () => {
  it('a frame address carries only the preview and its variant', () => {
    const url = previewUrl('http://localhost:5180/glyphtender/?debug=1#x', 'end-table', '3p')
    expect(url).toBe('http://localhost:5180/glyphtender/?devkit-preview=end-table&variant=3p')
    expect(readPreviewUrl(url)).toEqual({ id: 'end-table', variant: '3p' })
    expect(readPreviewUrl('http://localhost:5180/glyphtender/')).toBeNull()
  })

  it('groups keep the order they first appear in', () => {
    expect(groupPreviews(previews).map((g) => [g.group, g.previews.map((p) => p.id)])).toEqual([
      ['End of game', ['end-table', 'reveal']],
      ['In game', ['pause']],
    ])
  })

  it('says what the sandbox blocked in plain words', () => {
    expect(blockedLine({ saves: 0, sends: 0, sounds: 0, history: 0 })).toBe('nothing blocked yet')
    expect(blockedLine({ saves: 1, sends: 2, sounds: 0, history: 0 })).toBe('blocked: 1 save, 2 sends')
  })
})

describe('Screens tab', () => {
  it('lists the previews by group, with a button per variant', async () => {
    render(<PreviewsTab load={load} />)
    expect(await screen.findByText('End table')).toBeTruthy()
    expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['End of game', 'In game'])
    expect(screen.getByRole('button', { name: '4 players' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Open' })).toHaveLength(2)
    expect(screen.getByText('The Menu button')).toBeTruthy()
  })

  it('says how to add previews when the game has none', async () => {
    render(<PreviewsTab load={() => Promise.resolve([])} />)
    expect(await screen.findByText(/No screen previews yet/)).toBeTruthy()
  })

  it('opens a variant in the sandbox frame, badged PREVIEW; ✕ closes it and steps back over its history entry', async () => {
    const push = vi.spyOn(history, 'pushState')
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    render(<PreviewsTab load={load} />)
    fireEvent.click(await screen.findByRole('button', { name: '4 players' }))
    expect(frame()?.getAttribute('src')).toContain('devkit-preview=end-table&variant=4p')
    expect(screen.getByText('Preview')).toBeTruthy()
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0][0]).toEqual(history.state) // the same state: the game's screen stack sees no change
    fireEvent.click(screen.getByRole('button', { name: 'Close the preview' }))
    expect(frame()).toBeNull()
    expect(back).toHaveBeenCalledTimes(1)
    push.mockRestore()
    back.mockRestore()
  })

  it('Esc closes only the preview: the game (and the Dev Kit panel) never see it', async () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    const gameHeard = vi.fn()
    window.addEventListener('keydown', gameHeard) // like the game's screen stack (Esc pops a menu)
    render(<PreviewsTab load={load} />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Open' }))[0])
    expect(frame()).toBeTruthy()
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }) })
    expect(frame()).toBeNull()
    expect(gameHeard).not.toHaveBeenCalled()
    window.removeEventListener('keydown', gameHeard)
    back.mockRestore()
  })

  it('the Back button closes the preview without stepping history again', async () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    render(<PreviewsTab load={load} />)
    fireEvent.click(await screen.findByRole('button', { name: '2 players' }))
    act(() => { window.dispatchEvent(new PopStateEvent('popstate', { state: null })) })
    expect(frame()).toBeNull()
    expect(back).not.toHaveBeenCalled()
    back.mockRestore()
  })

  it('switching variant swaps the frame', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {})
    render(<PreviewsTab load={load} />)
    fireEvent.click(await screen.findByRole('button', { name: '2 players' }))
    const chips = screen.getByRole('group', { name: 'Variant' })
    fireEvent.click(chips.querySelector('button:last-child')!)
    expect(frame()?.getAttribute('src')).toContain('variant=4p')
    fireEvent.click(screen.getByRole('button', { name: 'Close the preview' }))
  })

  it('while a preview is open, the Dev Kit panel ignores ` and Esc', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {})
    render(<><DevKit tabs={[{ id: 'screens', label: 'Screens', Panel: () => <PreviewsTab load={load} /> }]} /></>)
    const panel = document.querySelector('aside.devkit') as HTMLElement
    act(() => { fireEvent.keyDown(window, { key: '`' }) })
    expect(panel.hidden).toBe(false)
    fireEvent.click(await screen.findByRole('button', { name: '2 players', hidden: true }))
    act(() => { fireEvent.keyDown(window, { key: '`' }) })
    expect(panel.hidden).toBe(false)
    act(() => { fireEvent.keyDown(window, { key: 'Escape' }) })
    expect(frame()).toBeNull() // the preview closed…
    expect(panel.hidden).toBe(false) // …and the panel is still open, on the Screens tab
  })
})
