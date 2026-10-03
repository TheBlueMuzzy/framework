// Runs in the framework: the preview sandbox keeps a preview from saving, sending or stepping history.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { failRequests, installSandbox, sandboxCounts } from './sandbox'

const realGet = Storage.prototype.getItem
const realFetch = vi.fn(async () => new Response('ok'))
const onChange = vi.fn()
const sockets = WebSocket

beforeAll(() => {
  localStorage.setItem('kept', 'real')
  window.fetch = realFetch as unknown as typeof fetch
  installSandbox(window as Window & typeof globalThis, onChange)
})

describe('preview sandbox', () => {
  it('keeps storage writes in the frame: they read back there, the real storage never changes', () => {
    localStorage.setItem('kept', 'preview')
    localStorage.setItem('new', 'x')
    sessionStorage.setItem('room', 'BAKU')
    expect(localStorage.getItem('kept')).toBe('preview')
    expect(localStorage.getItem('new')).toBe('x')
    expect(realGet.call(localStorage, 'kept')).toBe('real')
    expect(realGet.call(localStorage, 'new')).toBeNull()
    expect(realGet.call(sessionStorage, 'room')).toBeNull()
    localStorage.removeItem('kept')
    expect(localStorage.getItem('kept')).toBeNull()
    expect(realGet.call(localStorage, 'kept')).toBe('real')
    expect(sandboxCounts.saves).toBe(4)
    expect(onChange).toHaveBeenCalled()
  })

  it('lets GETs through, blocks anything that sends', async () => {
    await fetch('/words.txt')
    expect(realFetch).toHaveBeenCalledTimes(1)
    await expect(fetch('/api', { method: 'POST', body: '{}' })).rejects.toThrow(/POST blocked/)
    expect(realFetch).toHaveBeenCalledTimes(1)
    expect(sandboxCounts.sends).toBe(1)
  })

  it('failRequests makes matching GETs fail (a word list that "didn\'t load")', async () => {
    failRequests('words')
    await expect(fetch('/assets/words.txt')).rejects.toThrow(/set to fail/)
    await fetch('/art.png')
    const asked = realFetch.mock.calls.map((c) => (c as unknown[])[0])
    expect(asked).toContain('/art.png')
    expect(asked).not.toContain('/assets/words.txt')
  })

  it('WebSockets never connect; sends are dropped and counted', () => {
    const before = sandboxCounts.sends
    const socket = new WebSocket('ws://localhost:1997/parties/main/BAKU')
    expect(WebSocket).not.toBe(sockets)
    expect(socket.readyState).toBe(0)
    socket.send('hello')
    expect(sandboxCounts.sends).toBe(before + 1)
  })

  it('history steps do nothing (the frame shares the Back button)', () => {
    const length = history.length
    history.pushState({ kitScreens: 1 }, '')
    history.back()
    expect(history.length).toBe(length)
    expect(sandboxCounts.history).toBe(2)
  })

  it('media stays silent; no new windows', async () => {
    await document.createElement('audio').play()
    expect(sandboxCounts.sounds).toBe(1)
    expect(window.open('https://example.com')).toBeNull()
  })
})
