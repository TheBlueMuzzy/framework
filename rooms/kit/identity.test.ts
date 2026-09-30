import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPersistentId, getPlayerName, getTabId, makeId, setPlayerName } from './identity'

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('identity', () => {
  it('makes 16-character ids without look-alike characters', () => {
    const id = makeId()
    expect(id).toHaveLength(16)
    expect(id).not.toMatch(/[IOlo01]/)
    expect(makeId()).not.toBe(id)
  })

  it('the persistentId is made once and kept (localStorage)', () => {
    const first = getPersistentId()
    expect(getPersistentId()).toBe(first)
    expect(localStorage.getItem('rooms:persistent-id')).toBe(first)
  })

  it('the tab id lives in sessionStorage, apart from the persistentId', () => {
    const tab = getTabId()
    expect(getTabId()).toBe(tab)
    expect(sessionStorage.getItem('rooms:tab-id')).toBe(tab)
    expect(tab).not.toBe(getPersistentId())
  })

  it('a new tab (empty sessionStorage) gets a new tab id but the same player id', () => {
    const player = getPersistentId()
    const tab = getTabId()
    sessionStorage.clear()
    expect(getTabId()).not.toBe(tab)
    expect(getPersistentId()).toBe(player)
  })

  it('remembers the player name', () => {
    expect(getPlayerName()).toBe('')
    setPlayerName('Muzzy')
    expect(getPlayerName()).toBe('Muzzy')
  })

  it('still works when storage is blocked (private window)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const id = getPersistentId()
    expect(id).toHaveLength(16)
    expect(getPersistentId()).toBe(id) // kept in memory for this page
    setPlayerName('Sam')
    expect(getPlayerName()).toBe('Sam')
  })
})
