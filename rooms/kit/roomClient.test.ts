// Where the page looks for its room server (0.13.0, F155): the game's own local port, the page's own address.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOCAL_PARTY_PORT, localPartyPort, partyHost } from './roomClient'

afterEach(() => vi.unstubAllEnvs())

describe('partyHost', () => {
  it('a game that sets nothing keeps port 1999, on the page\'s own address', () => {
    vi.stubEnv('PARTY_PORT', '')
    vi.stubEnv('VITE_PARTY_HOST', '')
    expect(LOCAL_PARTY_PORT).toBe(1999)
    expect(localPartyPort()).toBe(1999)
    expect(partyHost()).toBe(`${window.location.hostname}:1999`)
  })

  it('takes the game\'s own port (wrangler.json dev.port, baked in by the rooms Vite plugin)', () => {
    vi.stubEnv('PARTY_PORT', '6499')
    vi.stubEnv('VITE_PARTY_HOST', '')
    expect(localPartyPort()).toBe(6499)
    // the hostname stays the page's own, so a phone on the Wi-Fi (http://192.168.x.x:…) reaches the PC
    expect(partyHost()).toBe(`${window.location.hostname}:6499`)
  })

  it('a port that isn\'t one falls back to 1999', () => {
    for (const bad of ['abc', '0', '70000', '64.5']) {
      vi.stubEnv('PARTY_PORT', bad)
      expect(localPartyPort(), bad).toBe(1999)
    }
  })

  it('a live build\'s VITE_PARTY_HOST still wins', () => {
    vi.stubEnv('PARTY_PORT', '6499')
    vi.stubEnv('VITE_PARTY_HOST', 'my-game.joebrogno.workers.dev')
    expect(partyHost()).toBe('my-game.joebrogno.workers.dev')
  })
})
