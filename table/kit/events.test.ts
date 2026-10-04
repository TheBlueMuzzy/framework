import { describe, expect, it } from 'vitest'
import type { TableEvent } from './core'
import { addChange, feedFor, Listeners, newChanges, type Feed } from './events'

type Event = TableEvent & { type: 'drew' | 'played' }
const drew = (seat: number): Event => ({ type: 'drew', seen: { seats: [seat] } })
const played: Event = { type: 'played', seen: 'all' }

describe('the feed', () => {
  it('keeps the last few changes, oldest first, never editing the old feed', () => {
    let feed: Feed<Event> = []
    for (let n = 1; n <= 5; n++) feed = addChange(feed, n, [played], 3)
    expect(feed.map((c) => c.change)).toEqual([3, 4, 5])
    const before = feed
    addChange(feed, 6, [played], 3)
    expect(before.map((c) => c.change)).toEqual([3, 4, 5])
  })

  it('each seat sees every change number, but only its own secret events', () => {
    const feed = addChange([], 1, [drew(0), played])
    expect(feedFor(feed, 0)[0].events.map((e) => e.type)).toEqual(['drew', 'played'])
    expect(feedFor(feed, 1)).toEqual([{ change: 1, events: [played] }])
  })
})

describe('what the screen plays', () => {
  const feed: Feed<Event> = [3, 4, 5].map((change) => ({ change, events: [played] }))
  it('only changes newer than the last one played, in order', () => {
    expect(newChanges(feed, 3).changes.map((c) => c.change)).toEqual([4, 5])
    expect(newChanges(feed, 5).changes).toEqual([])
    expect(newChanges(feed, 3).missed).toBe(false)
  })
  it('a skipped view loses nothing — the next feed still has its change', () => {
    expect(newChanges(feed, 2).changes.map((c) => c.change)).toEqual([3, 4, 5])
    expect(newChanges(feed, 2).missed).toBe(false)
  })
  it('reports a gap the feed can no longer fill', () => {
    expect(newChanges(feed, 1).missed).toBe(true)
  })
})

describe('listeners', () => {
  it('by type and for everything; stop listening', () => {
    const hub = new Listeners<Event>()
    const heard: string[] = []
    const stop = hub.on('drew', () => heard.push('drew-listener'))
    hub.on('*', (e) => heard.push(`all:${e.type}`))
    hub.emit(drew(0))
    hub.emit(played)
    stop()
    hub.emit(drew(1))
    expect(heard).toEqual(['drew-listener', 'all:drew', 'all:played', 'all:drew'])
  })
})
