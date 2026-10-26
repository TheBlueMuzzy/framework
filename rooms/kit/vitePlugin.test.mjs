// @vitest-environment node
// The rooms Vite plugin (0.13.0, F155): the page gets the port from the same wrangler.json line wrangler dev reads.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFINE_KEY, readPartyPort, roomsPort } from './vitePlugin.mjs'

const dirs = []
const gameWith = (files) => {
  const dir = mkdtempSync(join(tmpdir(), 'rooms-plugin-'))
  dirs.push(dir)
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text)
  return dir
}
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

describe('readPartyPort', () => {
  it('wrangler.json dev.port', () => {
    expect(readPartyPort(gameWith({ 'wrangler.json': '{ "name": "a", "dev": { "port": 6499, "ip": "0.0.0.0" } }' })))
      .toEqual({ port: 6499, file: 'wrangler.json' })
  })

  it('nothing set → 1999 (no wrangler file, or one without dev.port, or a port that isn\'t one)', () => {
    expect(readPartyPort(gameWith({}))).toEqual({ port: 1999, file: null })
    expect(readPartyPort(gameWith({ 'wrangler.json': '{ "name": "a" }' })).port).toBe(1999)
    expect(readPartyPort(gameWith({ 'wrangler.json': '{ "dev": { "ip": "0.0.0.0" } }' })).port).toBe(1999)
    expect(readPartyPort(gameWith({ 'wrangler.json': '{ "dev": { "port": "6499" } }' })).port).toBe(1999)
  })

  it('wrangler.jsonc with comments (a "//" inside a string is kept) and a trailing comma', () => {
    const text = '{\n  // the server\n  "name": "a", "routes": ["https://x.dev/*"],\n  /* local */ "dev": { "port": 6512, },\n}\n'
    expect(readPartyPort(gameWith({ 'wrangler.jsonc': text }))).toEqual({ port: 6512, file: 'wrangler.jsonc' })
  })

  it('wrangler.toml: only the [dev] table\'s port', () => {
    const text = 'name = "a"\n[vars]\nport = 1\n\n[dev]\nip = "0.0.0.0"\nport = 6520\n\n[other]\nport = 2\n'
    expect(readPartyPort(gameWith({ 'wrangler.toml': text }))).toEqual({ port: 6520, file: 'wrangler.toml' })
    expect(readPartyPort(gameWith({ 'wrangler.toml': 'name = "a"\n[vars]\nport = 1\n' })).port).toBe(1999)
  })

  it('a broken wrangler.json says so (wrangler dev would fail on it too)', () => {
    expect(() => readPartyPort(gameWith({ 'wrangler.json': '{ "name": ' }))).toThrow(/wrangler\.json isn't valid JSON/)
  })
})

describe('roomsPort', () => {
  it('bakes the game\'s port into the page (import.meta.env.PARTY_PORT) and the game\'s tests (test.env)', async () => {
    const root = gameWith({ 'wrangler.json': '{ "dev": { "port": 6499 } }', 'index.html': '<!doctype html><html></html>' })
    const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [roomsPort()], server: { middlewareMode: true, hmr: false } })
    try {
      expect(server.config.define[DEFINE_KEY]).toBe('"6499"')
      expect(server.config.test.env.PARTY_PORT).toBe('6499')
    } finally { await server.close() }
  })

  it('a game without a wrangler file gets 1999', async () => {
    const root = gameWith({ 'index.html': '<!doctype html><html></html>' })
    const server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [roomsPort()], server: { middlewareMode: true, hmr: false } })
    try { expect(server.config.define[DEFINE_KEY]).toBe('"1999"') } finally { await server.close() }
  })
})
