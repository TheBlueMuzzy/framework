// MenuHeader (0.10.0): ‹ back (only with onBack) · title · an action slot on the right.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Button, setControlSound } from '../controls'
import { MenuHeader } from './MenuHeader'

afterEach(() => {
  cleanup()
  setControlSound(null)
})

describe('MenuHeader', () => {
  it('without onBack: just the title, no ‹', () => {
    render(<MenuHeader title="Paused" />)
    expect(screen.getByRole('heading', { name: 'Paused' })).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('with onBack: a ‹ button on the left, read out as "Back" (or backLabel), sounding like a Back', () => {
    const onBack = vi.fn()
    const heard: string[] = []
    setControlSound((kind) => heard.push(kind))
    const { container, rerender } = render(<MenuHeader title="Settings" onBack={onBack} />)
    const back = screen.getByRole('button', { name: 'Back' })
    expect(back.textContent).toBe('‹')
    expect(container.querySelector('.kit-menu-header')!.firstElementChild).toBe(back) // on the left
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalled()
    expect(heard).toEqual(['back'])
    rerender(<MenuHeader title="Ajustes" onBack={onBack} backLabel="Atrás" />)
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeTruthy()
  })

  it('action: sits at the right end, after the title', () => {
    const { container } = render(<MenuHeader title="New game" onBack={() => {}} action={<Button>Start</Button>} />)
    const header = container.querySelector('.kit-menu-header')!
    expect(header.lastElementChild!.className).toBe('kit-menu-header-action')
    expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy()
  })

  // F108 review: an action that shows only sometimes (Respec while something is owned) left the title shrunk
  it('the action going away puts the title back to full size', () => {
    const respec = <Button compact>Respec</Button>
    const { container, rerender } = render(<MenuHeader title="UPGRADES" action={respec} />)
    const box = container.querySelector<HTMLElement>('.kit-menu-header-title')!
    box.dataset.fit = 'tight' // what a narrow phone measures (jsdom can't measure)
    rerender(<MenuHeader title="UPGRADES" />)
    expect(box.hasAttribute('data-fit')).toBe(false)
  })
})
