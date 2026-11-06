// FULL SCREEN ON PHONES (F192, from Glyphtender's fullscreen.ts) — switched per game by its Settings → Full screen row.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Settings, onSettingsChange, type SettingsSchema, type SettingsValues } from './Settings'
import { fullscreenSetting, hiddenFullscreenRows, raisePopovers, setFullscreen, startFullscreen, stopFullscreen, withFullscreenDefault } from './fullscreen'
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

  it('a phone that never opened Settings (nothing saved) still goes full screen on the first tap — startFullscreen() with no load (F195 rehearsal)', () => {
    localStorage.clear()
    const phone = pretendDevice({ touch: true })
    startFullscreen()
    tap()
    expect(phone.requestFullscreen).toHaveBeenCalledTimes(1)
    stopFullscreen()
    localStorage.clear()
    const computer = pretendDevice({ touch: false })
    startFullscreen()
    tap()
    expect(computer.requestFullscreen).not.toHaveBeenCalled()
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

  it('Reset (or any change) that turns Full screen off leaves full screen, so Settings never says off while it stays (review, sprint 60)', () => {
    const d = pretendDevice({ touch: false })
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement })
    fullscreenSetting({ fullscreen: false }, undefined) // Reset: no single row changed
    expect(d.exitFullscreen).toHaveBeenCalledTimes(1)
  })

  it("full screen's own button and a computer's Esc tell live settings too (review, sprint 60)", () => {
    pretendDevice({ touch: false })
    const told: unknown[] = []
    const stopListening = onSettingsChange((values) => told.push(values.fullscreen))
    startFullscreen({ load: () => ({ fullscreen: true }), save: () => {} })
    setFullscreen(false)
    act(() => { document.dispatchEvent(new Event('fullscreenchange')) })
    stopListening()
    expect(told[0]).toBe(false)
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

// F201 (the starter's tutorial on a phone): the first tap goes full screen, and the page's root then sits in the top
// layer ABOVE every popover already showing — the tutorial's Spotlight + Callout, shown on that same tap, were hidden
describe('popovers showing when the page goes full screen', () => {
  const fakePopover = (className: string, calls: string[]) => {
    const el = document.createElement('div')
    el.className = className
    Object.assign(el, { hidePopover: () => calls.push(`hide ${className}`), showPopover: () => calls.push(`show ${className}`) })
    return el
  }
  it('are shown again on top — every bubble (Callout) after the rest, so a Spotlight never covers its words', () => {
    const calls: string[] = []
    const bubble = fakePopover('kit-callout-layer', calls), dim = fakePopover('kit-spot-layer', calls)
    raisePopovers([bubble, dim])
    expect(calls).toEqual(['hide kit-spot-layer', 'show kit-spot-layer', 'hide kit-callout-layer', 'show kit-callout-layer'])
  })
  it('keeps the focus where it was (a pausing bubble focused its button)', () => {
    const button = document.createElement('button')
    document.body.append(button)
    button.focus()
    const bubble = fakePopover('kit-callout-layer', [])
    Object.assign(bubble, { showPopover: () => (document.activeElement as HTMLElement)?.blur() })
    raisePopovers([bubble])
    expect(document.activeElement).toBe(button)
    button.remove()
  })
  it('happens when the page goes full screen, not when it leaves', () => {
    const calls: string[] = []
    vi.spyOn(document, 'querySelectorAll').mockReturnValue([fakePopover('kit-callout-layer', calls)] as unknown as NodeListOf<Element>)
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => document.documentElement })
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(calls).toEqual(['hide kit-callout-layer', 'show kit-callout-layer'])
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null })
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(calls).toHaveLength(2)
    vi.restoreAllMocks()
    Reflect.deleteProperty(document, 'fullscreenElement')
  })
})
