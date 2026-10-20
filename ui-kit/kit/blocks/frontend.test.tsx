// Front end logic: the main menu's buttons — the old named ones, and an ordered items list.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Credits, MainMenu } from './frontend'

afterEach(cleanup)

const buttonNames = () => screen.getAllByRole('button').map((b) => b.textContent)
const primaryNames = () => screen.getAllByRole('button').filter((b) => b.dataset.variant === 'primary').map((b) => b.textContent)

describe('MainMenu', () => {
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
