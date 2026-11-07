// Runs in the framework (not copied into games): every Dev Kit call to the dev server's /__devkit/ routes sends the
// page's Dev Kit key (0.32.0, F208) — the dev server refuses one that doesn't (vite/devkitVite.test.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addLibraryFont, libraryFontUrl, loadLibrary, previewFont } from './fonts/fontLibrary'
import { devkitKeyHeaders, saveContentFile } from './saveContent'
import { addCredit, uploadSound } from './sound/soundFiles'

const KEY = 'k3y-from-the-page_0123456789abcdefghijklmnopq'

describe('the Dev Kit key goes with every call to the dev server', () => {
  let sent: { url: string; key: string | null }[]
  beforeEach(() => {
    const meta = document.createElement('meta')
    meta.name = 'devkit-key'
    meta.content = KEY
    document.head.append(meta)
    sent = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      sent.push({ url, key: new Headers(init?.headers).get('X-Devkit-Key') })
      return Response.json({ ok: true, font: {}, wrote: [], already: false, fonts: [] })
    }))
    vi.stubGlobal('FontFace', class { constructor(public family: string, public source: unknown) {} load = async () => this })
    Object.defineProperty(document, 'fonts', { value: { add: () => {} }, configurable: true })
  })
  afterEach(() => {
    document.head.querySelector('meta[name="devkit-key"]')?.remove()
    vi.unstubAllGlobals()
  })

  it('reads the key from the page the dev server served', () => {
    expect(devkitKeyHeaders()).toEqual({ 'X-Devkit-Key': KEY })
  })
  it('Save, the Sound tab\'s upload + credit, and the font library (list, preview file, add) all send it', async () => {
    await saveContentFile('content/ui/style.json', { preset: 'neon' })
    await saveContentFile('content/text/en.json', { a: 'b' }, { reload: true })
    await uploadSound(new Blob(['x']), { folder: 'sfx', stem: 'sfx_a_b', bus: 'sfx', ext: 'wav' })
    await addCredit({ paths: ['public/audio/sfx/a.mp3'] } as never)
    await loadLibrary()
    await loadLibrary(true)
    await previewFont('Tiny', libraryFontUrl('folder:pixel/Tiny.ttf'))
    await addLibraryFont('folder:pixel/Tiny.ttf')
    expect(sent.map((s) => s.url.replace(/\?.*$/, ''))).toEqual([
      '/__devkit/save', '/__devkit/save', '/__devkit/save-audio', '/__devkit/add-credit',
      '/__devkit/font-library', '/__devkit/font-library', '/__devkit/font-library/file', '/__devkit/font-library/add',
    ])
    expect(sent.every((s) => s.key === KEY)).toBe(true)
  })
  it('a page with no key (a release build) sends none — the dev server isn\'t there anyway', () => {
    document.head.querySelector('meta[name="devkit-key"]')?.remove()
    expect(devkitKeyHeaders()).toEqual({})
  })
})
