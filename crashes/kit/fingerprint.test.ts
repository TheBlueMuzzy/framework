import { describe, expect, it } from 'vitest'
import { browserName, languageOnly, osName } from './device'
import { cleanTitle, fingerprint, fingerprintText, withoutBuildHash } from './fingerprint'

describe('cleanTitle', () => {
  it('quoted text, numbers and hex ids go; code words stay', () => {
    expect(cleanTitle("Cannot find player 'Bob'")).toBe('Cannot find player "…"')
    expect(cleanTitle('Cannot find player "Alice" or `Eve`')).toBe('Cannot find player "…" or "…"')
    expect(cleanTitle('Index 12 out of range 3.5')).toBe('Index # out of range #')
    expect(cleanTitle('Bad pointer 0x1f3a in Float32Array')).toBe('Bad pointer <id> in Float32Array')
    expect(cleanTitle('Room a1b2c3d4 and 550e8400-e29b-41d4-a716-446655440000 gone')).toBe('Room <id> and <id> gone')
    expect(cleanTitle('cafe face 1234')).toBe('cafe face #')
    expect(cleanTitle('x'.repeat(500))).toHaveLength(200)
  })
})

describe('withoutBuildHash', () => {
  it('leaves out a Vite build hash, keeps ordinary dashes', () => {
    expect(withoutBuildHash('assets/index-Bx12.js')).toBe('assets/index.js')
    expect(withoutBuildHash('assets/index-Q9zz.js')).toBe('assets/index.js')
    expect(withoutBuildHash('assets/vendor-DgV7mPq_.js')).toBe('assets/vendor.js')
    expect(withoutBuildHash('assets/board-view.js')).toBe('assets/board-view.js')
  })
})

describe('fingerprint', () => {
  it('16 hex, the same for the same text, different for different text', async () => {
    const a = await fingerprint(fingerprintText('error', 'TypeError: x', [{ file: 'assets/index-Bx12.js', line: 1, col: 2, fn: 'tick' }]))
    const b = await fingerprint(fingerprintText('error', 'TypeError: x', [{ file: 'assets/index-Q9zz.js', line: 9, col: 9, fn: 'tick' }]))
    const c = await fingerprint(fingerprintText('rejection', 'TypeError: x', [{ file: 'assets/index-Bx12.js', line: 1, col: 2, fn: 'tick' }]))
    expect(a).toMatch(/^[0-9a-f]{16}$/)
    expect(b).toBe(a)
    expect(c).not.toBe(a)
  })
  it('only the top 3 frames count', () => {
    const frame = (fn: string) => ({ file: 'a.js', line: 1, col: 1, fn })
    expect(fingerprintText('error', 't', [frame('a'), frame('b'), frame('c'), frame('d')]))
      .toBe(fingerprintText('error', 't', [frame('a'), frame('b'), frame('c'), frame('zzz')]))
  })
})

describe('the device in a few words', () => {
  const UA = {
    androidChrome: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.122 Mobile Safari/537.36',
    iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1',
    windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.3537.71',
    macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
    macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
    chromebook: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  }
  it('browser: a name + the major version', () => {
    expect(browserName(UA.androidChrome)).toBe('Chrome 141')
    expect(browserName(UA.iphoneSafari)).toBe('Safari 18')
    expect(browserName(UA.iphoneChrome)).toBe('Chrome 141')
    expect(browserName(UA.windowsEdge)).toBe('Edge 141')
    expect(browserName(UA.macFirefox)).toBe('Firefox 132')
    expect(browserName(UA.macSafari)).toBe('Safari 18')
    expect(browserName(UA.samsung)).toBe('Samsung Internet 27')
    expect(browserName('something else')).toBe('')
  })
  it('system: a name + the major version where the text tells the truth', () => {
    expect(osName(UA.androidChrome)).toBe('Android 15')
    expect(osName(UA.iphoneSafari)).toBe('iOS 18')
    expect(osName(UA.windowsEdge)).toBe('Windows')
    expect(osName(UA.macFirefox)).toBe('macOS')
    expect(osName(UA.chromebook)).toBe('ChromeOS')
    expect(osName('')).toBe('')
  })
  it('language without the region', () => {
    expect(languageOnly('en-GB')).toBe('en')
    expect(languageOnly('pt_BR')).toBe('pt')
    expect(languageOnly('fil')).toBe('fil')
    expect(languageOnly('')).toBe('')
    expect(languageOnly(undefined)).toBe('')
  })
})
