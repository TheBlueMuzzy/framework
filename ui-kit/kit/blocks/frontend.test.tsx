// Front end logic: the main menu's buttons — the old named ones, and an ordered items list.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MainMenu } from './frontend'

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
