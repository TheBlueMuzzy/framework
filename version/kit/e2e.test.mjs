// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { builtVersion, checkVersion, expectedVersion } from './e2e.mjs'

const dirs = []
const gameAt = (version, build) => {
  const dir = mkdtempSync(join(tmpdir(), 'version-e2e-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'version.json'), JSON.stringify({ version, build }))
  return dir
}
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

// A stand-in for a Playwright page: just the locator calls checkVersion makes
const pageShowing = (content) => ({
  locator: (selector) => {
    expect(selector).toBe('meta[name="app-version"]')
    return { count: async () => (content === null ? 0 : 1), first: () => ({ getAttribute: async (name) => (name === 'content' ? content : null) }) }
  },
})

describe('expectedVersion', () => {
  it('vX.Y.Z.B from version.json, with VERSION_BUILD as in the build', () => {
    const game = gameAt('0.11.0', 3)
    expect(expectedVersion(game, {})).toBe('v0.11.0.3')
    expect(expectedVersion(game, { VERSION_BUILD: '4' })).toBe('v0.11.0.4')
  })
})

describe('checkVersion', () => {
  it('passes on the build version.json says, and returns what the page shows', async () => {
    await expect(checkVersion(pageShowing('v0.11.0.3'), 'v0.11.0.3')).resolves.toBe('v0.11.0.3')
  })

  it('a stale build fails with the plain message', async () => {
    await expect(checkVersion(pageShowing('v0.11.0.3'), 'v0.11.0.4'))
      .rejects.toThrow('the page is version v0.11.0.3, but version.json says v0.11.0.4 — a stale build or a cached service worker?')
  })

  it('a page with no version tag says the build has no versionPlugin', async () => {
    await expect(checkVersion(pageShowing(null), 'v0.11.0.4')).rejects.toThrow(/no <meta name="app-version"> — the build wasn't made with versionPlugin\(\)/)
  })
})

describe('builtVersion', () => {
  it('reads the version from dist/index.html, or null when there is no build', () => {
    const game = gameAt('0.11.0', 3)
    expect(builtVersion(join(game, 'dist'))).toBe(null)
    mkdirSync(join(game, 'dist'))
    writeFileSync(join(game, 'dist', 'index.html'), '<head><meta name="app-version" content="v0.11.0.3"></head>')
    expect(builtVersion(join(game, 'dist'))).toBe('v0.11.0.3')
  })
})
