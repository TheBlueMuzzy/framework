// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFINE_KEY, versionPlugin } from './vitePlugin.mjs'

const dirs = []
const gameAt = (version, build) => {
  const dir = mkdtempSync(join(tmpdir(), 'version-plugin-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'version.json'), JSON.stringify({ version, build }))
  writeFileSync(join(dir, 'index.html'), '<!doctype html><html><head><title>t</title></head><body></body></html>')
  return dir
}
afterEach(() => {
  delete process.env.VERSION_BUILD
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true })
})

describe('versionPlugin', () => {
  it('bakes the version in (import.meta.env.APP_VERSION) and puts the meta tag in the page', async () => {
    const root = gameAt('0.11.0', 4)
    const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [versionPlugin()], server: { middlewareMode: true, hmr: false } })
    try {
      expect(server.config.define[DEFINE_KEY]).toBe('"0.11.0.4"')
      // the game's own Vitest tests get it through test.env (Vitest skips define's import.meta.env.* keys)
      expect(server.config.test.env.APP_VERSION).toBe('0.11.0.4')
      const html = await server.transformIndexHtml('/', '<!doctype html><html><head><title>t</title></head><body></body></html>')
      expect(html).toMatch(/<meta name="app-version" content="v0\.11\.0\.4">/)
      expect(html.indexOf('app-version')).toBeLessThan(html.indexOf('</head>'))
    } finally { await server.close() }
  })

  it('VERSION_BUILD overrides the build number for one build', async () => {
    const root = gameAt('0.11.0', 4)
    process.env.VERSION_BUILD = '9'
    const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [versionPlugin()], server: { middlewareMode: true, hmr: false } })
    try { expect(server.config.define[DEFINE_KEY]).toBe('"0.11.0.9"') } finally { await server.close() }
  })

  it('a broken version.json stops the build with the plain reason', async () => {
    const root = gameAt('0.11', 4)
    await expect(createServer({ root, configFile: false, logLevel: 'silent', plugins: [versionPlugin()], server: { middlewareMode: true, hmr: false } }))
      .rejects.toThrow(/three numbers like "0\.1\.0"/)
  })
})
