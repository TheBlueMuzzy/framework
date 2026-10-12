import { describe, expect, it } from 'vitest'
import { LiveConnections } from './liveConnections'
import type { PartyConnection } from './roomServer'

const socket = (id: string): PartyConnection => ({ id, send: () => {}, close: () => {} })

describe('LiveConnections', () => {
  it('a late close of the old socket keeps the new one live (phone reconnect)', () => {
    const live = new LiveConnections()
    const old = socket('tab-1')
    const fresh = socket('tab-1')
    live.opened(old)
    live.opened(fresh) // the new socket opens first…
    live.closed(old) // …then the old one's close arrives
    expect(live.get('tab-1')).toBe(fresh)
  })

  it('a real close forgets the socket', () => {
    const live = new LiveConnections()
    const s = socket('tab-1')
    live.opened(s)
    live.closed(s)
    expect(live.get('tab-1')).toBeUndefined()
  })

  it('all() lists one live socket per id', () => {
    const live = new LiveConnections()
    const a = socket('tab-1')
    const b = socket('tab-2')
    const aAgain = socket('tab-1')
    live.opened(a); live.opened(b); live.opened(aAgain)
    expect(live.all()).toEqual([aAgain, b])
    live.closed(b)
    expect(live.all()).toEqual([aAgain])
  })
})
