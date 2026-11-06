// FULL SCREEN ON PHONES (F192, from Glyphtender's fullscreen.ts) — switched per game by its Settings → Full screen row.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Settings, type SettingsSchema, type SettingsValues } from './Settings'
import { fullscreenSetting, hiddenFullscreenRows, startFullscreen, stopFullscreen, withFullscreenDefault } from './fullscreen'
import { pretendDevice } from './phoneDevice.test-util'

const tap = () => window.dispatchEvent(new Event('pointerup'))

afterEach(() => {
  cleanup()
  stopFullscreen()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const rowsSchema = (): SettingsSchema => ({ tabs: [{ id: 'display', label: 'Display', rows: [
  { id: 'fullscreen', type: 'toggle', label: 'Full screen', default: false },
  { id: 'fullscreenTip', type: 'info', label: 'Full screen', default: 'Share → Add to Home Screen' },
  { id: 'brightness', type: 'slider', label: 'Brightness', default: 50 },
] }] })
const fullscreenDefault = (schema: SettingsSchema) => schema.tabs.flatMap((t) => t.rows).find((r) => r.id === 'fullscreen')?.default

describe('full screen on phones', () => {
  it('Settings → Full screen starts on for phones, off for computers', () => {
    pretendDevice({ touch: true })
    expect(fullscreenDefault(withFullscreenDefault(rowsSchema()))).toBe(true)
    pretendDevice({ touch: false })
    expect(fullscreenDefault(withFullscreenDefault(rowsSchema()))).toBe(false)
  })

  it('iPhone (no full screen) shows the Add to Home Screen tip instead; installed shows neither', () => {
    pretendDevice({ can: true })
    expect(hiddenFullscreenRows()).toEqual(['fullscreenTip'])
    pretendDevice({ can: false })
    expect(hiddenFullscreenRows()).toEqual(['fullscreen'])
    pretendDevice({ installed: true })
    expect(hiddenFullscreenRows()).toEqual(['fullscreen', 'fullscreenTip'])
  })

  it('a phone with the setting on goes full screen on a tap — never before one; with it off, taps do nothing', () => {
    const on = pretendDevice({ touch: true })
    startFullscreen({ load: () => ({ fullscreen: true }) })
    expect(on.requestFullscreen).not.toHaveBeenCalled() // (browsers only allow it from a tap)
    tap()
    expect(on.requestFullscreen).toHaveBeenCalledTimes(1)
    stopFullscreen()
    const off = pretendDevice({ touch: true })
    startFullscreen({ load: () => ({ fullscreen: false }) })
    tap()
    expect(off.requestFullscreen).not.toHaveBeenCalled()
  })

  it('a computer never goes full screen by itself, even with the setting saved on', () => {
    const pc = pretendDevice({ touch: false })
    startFullscreen({ load: () => ({ fullscreen: true }) })
    tap()
    expect(pc.requestFullscreen).not.toHaveBeenCalled()
  })

  it('flipping the setting (a tap in Settings) goes in and comes out; other rows never touch it', () => {
    const d = pretendDevice({ touch: false })
    fullscreenSetting({ fullscreen: true }, 'fullscreen')
    expect(d.requestFullscreen).toHaveBeenCalledTimes(1)
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement })
    fullscreenSetting({ fullscreen: false }, 'fullscreen')
    expect(d.exitFullscreen).toHaveBeenCalledTimes(1)
    fullscreenSetting({ fullscreen: true }, 'brightness')
    expect(d.requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it("a computer's Esc out of full screen turns the setting off (saved), so Settings never says on in a window", () => {
    pretendDevice({ touch: false })
    const save = vi.fn()
    startFullscreen({ load: () => ({ fullscreen: true, brightness: 40 }), save })
    act(() => { document.dispatchEvent(new Event('fullscreenchange')) }) // (fullscreenElement is null: it left)
    expect(save).toHaveBeenCalledWith({ fullscreen: false, brightness: 40 })
  })

  it('the Settings toggle itself asks for full screen (the kit handles the row — no game wiring)', () => {
    const d = pretendDevice({ touch: false })
    render(<Settings schema={rowsSchema()} />)
    fireEvent.click(screen.getByRole('switch', { name: 'Full screen' }))
    expect(d.requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('an open Settings follows an Esc out of full screen (it never saves an old "on" back)', () => {
    pretendDevice({ touch: false })
    let saved: SettingsValues = { fullscreen: true }
    const load = () => saved
    const save = (v: typeof saved) => { saved = v }
    startFullscreen({ load, save })
    render(<Settings schema={rowsSchema()} load={load} save={save} />)
    expect(screen.getByRole('switch', { name: 'Full screen' }).getAttribute('aria-checked')).toBe('true')
    act(() => { document.dispatchEvent(new Event('fullscreenchange')) })
    expect(screen.getByRole('switch', { name: 'Full screen' }).getAttribute('aria-checked')).toBe('false')
  })

  it("Settings hides the row this device can't use (iPhone: the tip shows instead)", () => {
    pretendDevice({ can: false })
    render(<Settings schema={rowsSchema()} />)
    expect(screen.queryByRole('switch', { name: 'Full screen' })).toBeNull()
    expect(screen.getByText('Share → Add to Home Screen')).toBeTruthy()
  })
})
