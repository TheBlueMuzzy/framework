// Runs in the framework (not copied into games): the panel, its keys, and game tabs.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DevKit, type DevKitTab } from './DevKit'
import { setSelect } from './select/selectStore'

afterEach(cleanup)

const TableTab = () => <p>table tools</p>
const gameTab: DevKitTab = { id: 'table', label: 'Table', Panel: TableTab }
const panel = () => document.querySelector('aside.devkit') as HTMLElement
const press = (key: string, target: Element | Window = window) => act(() => { fireEvent.keyDown(target, { key }) })

describe('DevKit panel', () => {
  it('starts hidden; ` opens and closes it; Esc closes it', () => {
    render(<DevKit />)
    expect(panel().hidden).toBe(true)
    press('`')
    expect(panel().hidden).toBe(false)
    press('`')
    expect(panel().hidden).toBe(true)
    press('`')
    press('Escape')
    expect(panel().hidden).toBe(true)
  })

  it('ignores ` while the player types in the game', () => {
    render(<><input aria-label="name" /><DevKit /></>)
    press('`', screen.getByLabelText('name'))
    expect(panel().hidden).toBe(true)
  })

  it('shows the kit\'s Color tab first, then the game\'s tabs', () => {
    render(<DevKit tabs={[{ id: 'color', label: 'Color', Panel: () => null }, gameTab]} />)
    const tabs = screen.getAllByRole('tab', { hidden: true }).map((t) => t.textContent)
    expect(tabs).toEqual(['Color', 'Table'])
    fireEvent.click(screen.getByRole('tab', { name: 'Table', hidden: true }))
    expect(screen.getByText('table tools')).toBeTruthy()
  })

  it('by default lists the kit tabs (Screens in dev only) + src/devkit-game/tabs.ts (empty here)', () => {
    render(<DevKit />)
    expect(screen.getAllByRole('tab', { hidden: true }).map((t) => t.textContent)).toEqual(['Color', 'Snapshots', 'Bugs', 'Screens'])
  })

  it('Color tab without the UI kit: just the colour-blind preview and a note', () => {
    render(<DevKit />)
    expect(screen.getByText(/doesn't use the Game UI kit/)).toBeTruthy()
    expect(screen.getByText('Colour-blind preview')).toBeTruthy()
  })

  it('select mode on a desktop: the mouse leaving onto the game tucks the panel away; coming back brings it in', () => {
    render(<><main data-testid="game" /><DevKit /></>)
    press('`')
    const leave = (to: Element | null) => act(() => { fireEvent.pointerLeave(panel(), { pointerType: 'mouse', relatedTarget: to }) })
    leave(screen.getByTestId('game'))
    expect(panel().classList.contains('is-tucked')).toBe(false) // not selecting: stays
    act(() => setSelect({ on: true }))
    leave(null) // off the window's edge, not onto the game: stays
    expect(panel().classList.contains('is-tucked')).toBe(false)
    leave(screen.getByTestId('game'))
    expect(panel().classList.contains('is-tucked')).toBe(true)
    act(() => { fireEvent.pointerEnter(panel(), { pointerType: 'mouse' }) })
    expect(panel().classList.contains('is-tucked')).toBe(false)
    leave(screen.getByTestId('game'))
    act(() => setSelect({ on: false }))
    expect(panel().classList.contains('is-tucked')).toBe(false) // select mode off: back in
  })

  it('carries the marker the release check looks for', () => {
    render(<DevKit />)
    expect(panel().dataset.devkit).toBe('bmuz-devkit-console')
  })
})
