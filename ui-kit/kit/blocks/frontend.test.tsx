// Front end logic: the main menu's buttons — the old named ones, and an ordered items list.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Credits, MainMenu } from './frontend'

afterEach(cleanup)

const buttonNames = () => screen.getAllByRole('button').map((b) => b.textContent)
const primaryNames = () => screen.getAllByRole('button').filter((b) => b.dataset.variant === 'primary').map((b) => b.textContent)

describe('MainMenu', () => {
  it('six buttons or more — extra buttons (children) counted — take two columns on a phone on its side (0.24.0)', () => {
    const items = ['Play', 'Daily', 'Board', 'Online', 'Settings'].map((label) => ({ label, onClick: () => {} }))
    const { container, rerender } = render(<MainMenu title="Game" items={items} version="v0.1.0.12" />)
    const many = () => container.querySelector('.kit-main-menu-buttons')?.hasAttribute('data-many')
    expect(many()).toBe(false)
    rerender(<MainMenu title="Game" items={items} version="v0.1.0.12">{false}{<button>Full screen</button>}</MainMenu>)
    expect(many()).toBe(true) // the false child doesn't count; Full screen does
    expect(screen.getByText('v0.1.0.12')).toBeTruthy()
  })

  // F145 (0.35.1): at 200% text on a phone the buttons slid over the tagline and the version — the menu scrolls as one now
  it('scrolls as one when it is taller than the window (a whole-screen scroll, the version under it)', () => {
    const { container } = render(<MainMenu title="Game" onPlay={() => {}} version="v0.1.0.12" />)
    expect(container.querySelector('.kit-screen')?.hasAttribute('data-scroll')).toBe(true)
  })

  it('named buttons: fixed order, only the ones passed, first is primary (kit 0.1 games)', () => {
    render(<MainMenu title="Game" onQuit={() => {}} onPlay={() => {}} onSettings={() => {}} words={{ play: 'Go' }} />)
    expect(buttonNames()).toEqual(['Go', 'Settings', 'Quit'])
    expect(primaryNames()).toEqual(['Go'])
  })

  it('items: shown in the order given, and each calls its own onClick', () => {
    const online = vi.fn()
    render(<MainMenu title="Game" onContinue={() => {}} items={[
      { label: 'Play', onClick: () => {} }, { label: 'Play online', onClick: online }, { label: 'Settings', onClick: () => {} },
    ]} />)
    expect(buttonNames()).toEqual(['Play', 'Play online', 'Settings']) // onContinue is ignored when items is given
    expect(primaryNames()).toEqual(['Play'])
    fireEvent.click(screen.getByText('Play online'))
    expect(online).toHaveBeenCalledOnce()
  })

  it('items: primary marks the main button(s) instead of the first', () => {
    render(<MainMenu title="Game" items={[
      { label: 'Continue', onClick: () => {} }, { label: 'New game', onClick: () => {}, primary: true },
    ]} />)
    expect(primaryNames()).toEqual(['New game'])
  })

  it('continueDetail: a second line inside Continue only (0.23.0) — and none without it', () => {
    render(<MainMenu title="Game" onContinue={() => {}} onPlay={() => {}} continueDetail="Turn 7 · 5 min ago" />)
    const [resume, play] = screen.getAllByRole('button')
    expect(resume.querySelector('.kit-button-detail')?.textContent).toBe('Turn 7 · 5 min ago')
    expect(play.querySelector('.kit-button-detail')).toBeNull()
    cleanup()
    render(<MainMenu title="Game" onPlay={() => {}} continueDetail="Turn 7" />) // no onContinue → no Continue, no line
    expect(buttonNames()).toEqual(['Play'])
  })

  it('items: detail works on any item', () => {
    render(<MainMenu title="Game" items={[{ label: 'Resume', onClick: () => {}, detail: 'Wave 3' }, { label: 'New run', onClick: () => {} }]} />)
    expect(screen.getByText('Wave 3').className).toBe('kit-button-detail')
  })
})

// Credits links the licence texts release.mjs writes (public/third-party-notices.txt, F85) — only when the file is there
describe('Credits — the open-source notices button (0.22.0)', () => {
  const answer = (type: string, ok = true) => vi.fn(async () => ({ ok, headers: new Headers({ 'content-type': type }) }))
  afterEach(() => vi.unstubAllGlobals())

  it('the notices file is there (plain text) → a button opens it in a new tab', async () => {
    const fetch = answer('text/plain; charset=utf-8')
    vi.stubGlobal('fetch', fetch)
    const open = vi.fn()
    vi.stubGlobal('open', open)
    render(<Credits />)
    fireEvent.click(await screen.findByText('Open-source licences'))
    expect(fetch).toHaveBeenCalledWith('third-party-notices.txt', { method: 'HEAD' })
    expect(open).toHaveBeenCalledWith('third-party-notices.txt', '_blank', 'noopener')
  })
  it('no file (the dev server answers with the game page, or a 404) → no button', async () => {
    for (const fetch of [answer('text/html'), answer('text/plain', false)]) {
      vi.stubGlobal('fetch', fetch)
      render(<Credits />)
      await waitFor(() => expect(fetch).toHaveBeenCalled())
      await Promise.resolve()
      expect(screen.queryByText('Open-source licences')).toBeNull()
      cleanup()
    }
  })
  it('notices={false} → not even asked', () => {
    const fetch = answer('text/plain')
    vi.stubGlobal('fetch', fetch)
    render(<Credits notices={false} />)
    expect(fetch).not.toHaveBeenCalled()
  })
})
