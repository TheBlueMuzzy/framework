import { describe, expect, it, vi } from 'vitest'
import { audioUrl, createLoader } from './loader.ts'

describe('loader', () => {
  it('builds URLs under the game\'s base URL', () => {
    expect(audioUrl('/', 'sfx/a.mp3')).toBe('/audio/sfx/a.mp3')
    expect(audioUrl('/glyphtender/', 'sfx/a.mp3')).toBe('/glyphtender/audio/sfx/a.mp3')
    expect(audioUrl('/glyphtender', '/sfx/a.mp3')).toBe('/glyphtender/audio/sfx/a.mp3')
    expect(audioUrl('./', 'ui/tap.mp3')).toBe('./audio/ui/tap.mp3')
  })

  it('fetches and decodes each file once, even when asked twice at the same time', async () => {
    const fetchFile = vi.fn(async () => new ArrayBuffer(4))
    const decode = vi.fn(async () => ({ duration: 1 }) as AudioBuffer)
    const loader = createLoader({ fetchFile, decode, baseUrl: '/g/' })
    expect(loader.get('a.mp3')).toBeUndefined()
    await Promise.all([loader.load('a.mp3'), loader.load('a.mp3'), loader.preload(['a.mp3', 'a.mp3'])])
    expect(fetchFile).toHaveBeenCalledTimes(1)
    expect(fetchFile).toHaveBeenCalledWith('/g/audio/a.mp3')
    expect(loader.get('a.mp3')).toEqual({ duration: 1 })
    loader.forget('a.mp3')
    await loader.load('a.mp3')
    expect(fetchFile).toHaveBeenCalledTimes(2)
  })

  it('a missing file warns once and resolves to null — never throws', async () => {
    const warn = vi.fn()
    const loader = createLoader({ fetchFile: async () => { throw new Error('404 Not Found') }, decode: vi.fn(), warn })
    await expect(loader.load('gone.mp3')).resolves.toBeNull()
    await expect(loader.preload(['gone.mp3'])).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain("couldn't load /audio/gone.mp3 (404 Not Found)")
  })
})
