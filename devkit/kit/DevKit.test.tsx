// Runs in the framework (not copied into games): the panel, its keys, and game tabs.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DevKit, type DevKitTab } from './DevKit'

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

  it('by default lists the kit tabs + src/devkit-game/tabs.ts (empty here)', () => {
    render(<DevKit />)
    expect(screen.getAllByRole('tab', { hidden: true }).map((t) => t.textContent)).toEqual(['Color', 'Snapshots', 'Bugs'])
  })

  it('Color tab without the UI kit: just the colour-blind preview and a note', () => {
    render(<DevKit />)
    expect(screen.getByText(/doesn't use the Game UI kit/)).toBeTruthy()
    expect(screen.getByText('Colour-blind preview')).toBeTruthy()
  })

  it('carries the marker the release check looks for', () => {
    render(<DevKit />)
    expect(panel().dataset.devkit).toBe('bmuz-devkit-console')
  })
})
