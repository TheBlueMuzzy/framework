// A live setting: the game reads one of its own Settings rows, and follows the Settings screen the moment it changes
// (Glyphtender's gameSettings.ts, Goops' gooStyle / wallKick / readoutSetting — each did it by hand). F191.
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ScreenStack, screens } from '..'
import { kitScreens } from './dialogs'
import { Settings, type SettingsSchema, type SettingsValues } from './Settings'
import { liveSetting, useLiveSetting } from './liveSetting'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const schema = (): SettingsSchema => ({ tabs: [
  { id: 'gameplay', label: 'Gameplay', rows: [
    { id: 'gooStyle', type: 'selector', label: 'Goo style', options: ['Jelly', 'Particle'], default: 'Jelly' },
    { id: 'readoutPosition', type: 'slider', label: 'Readout position', default: 65 },
    { id: 'hints', type: 'toggle', label: 'Hints', default: true },
  ] },
] })

// Goo style is a ◀ Jelly ▶ selector: Next turns it to Particle
const toParticle = () => fireEvent.click(screen.getByRole('button', { name: 'Next Goo style' }))

describe('liveSetting', () => {
  it('starts from the row default, through the game mapper', () => {
    const goo = liveSetting(schema(), (v) => (v.gooStyle === 'Particle' ? 'particle' : 'jelly'))
    expect(goo.get()).toBe('jelly')
  })

  it('changing the row on the Settings screen: the game sees it at once, and subscribers are told', () => {
    const goo = liveSetting(schema(), (v) => (v.gooStyle === 'Particle' ? 'particle' : 'jelly'))
    let told = 0
    goo.subscribe(() => told++)
    render(<Settings schema={schema()} />)
    toParticle()
    expect(goo.get()).toBe('particle')
    expect(told).toBe(1)
  })

  it('a change to another row tells nobody (the value is still the same)', () => {
    const goo = liveSetting(schema(), (v) => (v.gooStyle === 'Particle' ? 'particle' : 'jelly'))
    let told = 0
    goo.subscribe(() => told++)
    render(<Settings schema={schema()} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Hints' }))
    expect(told).toBe(0)
  })

  it('a mapper that builds an object keeps the SAME object until a value in it changes (useSyncExternalStore)', () => {
    const readout = liveSetting(schema(), (v) => ({ position: Number(v.readoutPosition) / 100, flipped: v.gooStyle === 'Particle' }))
    const first = readout.get()
    render(<Settings schema={schema()} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Hints' }))
    expect(readout.get()).toBe(first)
    toParticle()
    expect(readout.get()).toEqual({ position: 0.65, flipped: true })
  })

  it('unsubscribing stops the calls', () => {
    const goo = liveSetting(schema(), (v) => v.gooStyle)
    let told = 0
    const stop = goo.subscribe(() => told++)
    stop()
    render(<Settings schema={schema()} />)
    toParticle()
    expect(told).toBe(0)
  })

  it('the value survives a reload (the kit keeps it in the browser)', () => {
    render(<Settings schema={schema()} />)
    toParticle()
    cleanup()
    // a reload: the game's module runs again and makes its setting afresh
    const afterReload = liveSetting(schema(), (v) => v.gooStyle)
    expect(afterReload.get()).toBe('Particle')
  })

  it('a game that keeps its settings with its own saves passes the same load as <Settings>', () => {
    let kept: SettingsValues | null = null
    const load = () => kept
    render(<Settings schema={schema()} load={load} save={(values) => { kept = values }} />)
    toParticle()
    cleanup()
    expect(liveSetting(schema(), (v) => v.gooStyle, { load }).get()).toBe('Particle')
  })

  it('useLiveSetting: a component on screen redraws the moment Settings changes the row', () => {
    const goo = liveSetting(schema(), (v) => String(v.gooStyle))
    function Tank() { return <p>goo is {useLiveSetting(goo)}</p> }
    render(<><Tank /><Settings schema={schema()} /></>)
    expect(screen.getByText('goo is Jelly')).toBeTruthy()
    act(() => toParticle())
    expect(screen.getByText('goo is Particle')).toBeTruthy()
  })

  it('Reset to defaults on the screen counts as a change too', () => {
    render(<ScreenStack screens={{ ...kitScreens, settings: () => <Settings schema={schema()} /> }} />)
    act(() => screens.push('settings'))
    toParticle()
    const goo = liveSetting(schema(), (v) => v.gooStyle)
    expect(goo.get()).toBe('Particle')
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    const ask = screen.getByRole('dialog', { name: 'Reset to defaults?' })
    fireEvent.click(within(ask).getByRole('button', { name: 'Reset to defaults' }))
    expect(goo.get()).toBe('Jelly')
    while (screens.current.length) screens.pop()
  })
})
