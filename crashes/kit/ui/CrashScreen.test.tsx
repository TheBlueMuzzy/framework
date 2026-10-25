// @vitest-environment jsdom
// The "Something broke" screen, and React's root options putting it up when the game breaks.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startCrashes, stopCrashes } from '../capture'
import { DEFAULT_CRASHES_CONFIG } from '../config'
import { CrashScreen } from './CrashScreen'
import { crashRootOptions } from './crashRoot'

afterEach(() => { cleanup(); stopCrashes(); vi.restoreAllMocks() })

describe('CrashScreen', () => {
  it('says something broke, and Reload calls onReload', () => {
    const reload = vi.fn()
    render(<CrashScreen onReload={reload} />)
    expect(screen.getByText('Something broke')).toBeTruthy()
    expect(screen.queryByText('The problem was reported.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('says the problem was reported when it was', () => {
    render(<CrashScreen reported words={{ title: 'Oh no' }} />)
    expect(screen.getByText('Oh no')).toBeTruthy()
    expect(screen.getByText('The problem was reported.')).toBeTruthy()
  })
})

describe('crashRootOptions', () => {
  function Broken(): ReactNode { throw new TypeError('render went wrong') }
  class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false }
    static getDerivedStateFromError() { return { failed: true } }
    render() { return this.state.failed ? <p>boundary caught it</p> : this.props.children }
  }

  it('an uncaught React error → reported as "react" and the crash screen goes up instead of a blank page', async () => {
    const sent: string[] = []
    startCrashes({
      config: { ...DEFAULT_CRASHES_CONFIG, client: { ...DEFAULT_CRASHES_CONFIG.client, url: 'https://x.example' } },
      version: '1.0.0.1', dev: false, send: (_address, body) => { sent.push(body) },
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const place = document.createElement('div')
    document.body.append(place)
    // Drawn the way a game does, without the tests' act() (which takes uncaught errors for itself)
    const actBefore = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
    createRoot(place, crashRootOptions()).render(<Broken />)
    // wait for the crash screen to draw, not a fixed 50 ms (a busy computer can take longer — 2026-10-25 look-back)
    await vi.waitFor(() => expect(document.body.textContent).toContain('The problem was reported.'), { timeout: 2000 })
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = actBefore
    expect(document.body.textContent).toContain('Something broke')
    // the report goes out after its SHA-256 fingerprint (crypto.subtle, async): wait for it, not a fixed time — on a
    // busy computer (check:fast beside a screenshot run) 50 ms wasn't always enough (2026-10-25)
    await vi.waitFor(() => expect(sent).toHaveLength(1), { timeout: 2000 })
    expect(sent.map((body) => JSON.parse(body).kind)).toEqual(['react'])
  })

  it('an error a boundary caught → reported, the game carries on (no crash screen)', async () => {
    const sent: string[] = []
    startCrashes({
      config: { ...DEFAULT_CRASHES_CONFIG, client: { ...DEFAULT_CRASHES_CONFIG.client, url: 'https://x.example' } },
      version: '1.0.0.1', dev: false, send: (_address, body) => { sent.push(body) },
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const place = document.createElement('div')
    document.body.append(place)
    await act(async () => { createRoot(place, crashRootOptions()).render(<Boundary><Broken /></Boundary>) })
    expect(place.textContent).toBe('boundary caught it')
    await vi.waitFor(() => expect(sent).toHaveLength(1), { timeout: 2000 }) // (after its async fingerprint, as above)
    expect(sent.map((body) => JSON.parse(body).kind)).toEqual(['react'])
    place.remove()
  })
})
