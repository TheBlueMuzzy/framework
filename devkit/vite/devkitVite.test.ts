// @vitest-environment node
// Runs in the framework (not copied into games).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { devkit, devkitInReleaseBuilds, formatJson, isAllowedContentPath, keepHelp } from './devkitVite'

describe('isAllowedContentPath — the Dev Kit may only write JSON inside content/', () => {
  it('allows content JSON files', () => {
    expect(isAllowedContentPath('content/ui/style.json')).toBe(true)
    expect(isAllowedContentPath('content/ui/table.json')).toBe(true)
    expect(isAllowedContentPath('content/tuning/physics.json')).toBe(true)
  })
  it('refuses anything outside content/', () => {
    expect(isAllowedContentPath('src/App.tsx')).toBe(false)
    expect(isAllowedContentPath('package.json')).toBe(false)
    expect(isAllowedContentPath('/content/ui/style.json')).toBe(false)
    expect(isAllowedContentPath('C:/content/x.json')).toBe(false)
    expect(isAllowedContentPath('contentx/a.json')).toBe(false)
  })
  it('refuses sneaking out with .. or backslashes', () => {
    expect(isAllowedContentPath('content/../package.json')).toBe(false)
    expect(isAllowedContentPath('content/ui/../../vite.config.json')).toBe(false)
    expect(isAllowedContentPath('content\\..\\package.json')).toBe(false)
    expect(isAllowedContentPath('content//ui.json')).toBe(false)
    expect(isAllowedContentPath('content/./ui.json')).toBe(false)
  })
  it('refuses non-JSON files and non-strings', () => {
    expect(isAllowedContentPath('content/ui/style.ts')).toBe(false)
    expect(isAllowedContentPath('content/notes.md')).toBe(false)
    expect(isAllowedContentPath(undefined)).toBe(false)
    expect(isAllowedContentPath(42)).toBe(false)
  })
})

describe('keepHelp — a file\'s _help note survives a save', () => {
  it('puts the old _help back (first) when the tool left it out', () => {
    const out = keepHelp({ _help: 'read me', rows: '#000000' }, { rows: '#111111' })
    expect(out).toEqual({ _help: 'read me', rows: '#111111' })
    expect(Object.keys(out)[0]).toBe('_help')
  })
  it('uses the tool\'s own _help if it sent one', () => {
    expect(keepHelp({ _help: 'old' }, { _help: 'new', a: 1 })).toEqual({ _help: 'new', a: 1 })
  })
  it('does nothing for files without _help or new files', () => {
    expect(keepHelp({ preset: 'cartoon' }, { preset: 'clean' })).toEqual({ preset: 'clean' })
    expect(keepHelp(null, { a: 1 })).toEqual({ a: 1 })
  })
})

describe('formatJson', () => {
  it('is 2-space pretty JSON with a trailing newline', () => {
    expect(formatJson({ preset: 'cartoon', tweaks: {} })).toBe('{\n  "preset": "cartoon",\n  "tweaks": {}\n}\n')
  })
  it('keeps lists of numbers on one line, but not lists of text or objects', () => {
    expect(formatJson({ points: [8, 6, -4.5, 1e-7], on: [true, false] })).toBe('{\n  "points": [8, 6, -4.5, 1e-7],\n  "on": [true, false]\n}\n')
    expect(formatJson({ names: ['a', 'b'] })).toBe('{\n  "names": [\n    "a",\n    "b"\n  ]\n}\n')
    expect(formatJson({ rows: [{ a: 1 }], empty: [] })).toBe('{\n  "rows": [\n    {\n      "a": 1\n    }\n  ],\n  "empty": []\n}\n')
    expect(formatJson({ tip: 'a [1,2] in text' })).toBe('{\n  "tip": "a [1,2] in text"\n}\n')
  })
})

describe('devkitInReleaseBuilds — the release-build switch', () => {
  let game: string
  beforeEach(() => { game = mkdtempSync(join(tmpdir(), 'devkit-switch-')) })
  afterEach(() => rmSync(game, { recursive: true, force: true }))
  const writeSwitch = (on: boolean) => {
    mkdirSync(join(game, 'content'), { recursive: true })
    writeFileSync(join(game, 'content/devkit.json'), JSON.stringify({ _help: 'x', inReleaseBuilds: on }))
  }

  it('follows content/devkit.json', () => {
    writeSwitch(true)
    expect(devkitInReleaseBuilds(game, undefined)).toBe(true)
    writeSwitch(false)
    expect(devkitInReleaseBuilds(game, undefined)).toBe(false)
  })
  it('is off when the game has no content/devkit.json', () => {
    expect(devkitInReleaseBuilds(game, undefined)).toBe(false)
  })
  it('DEVKIT_IN_RELEASE overrides the file, and refuses anything but true/false', () => {
    writeSwitch(false)
    expect(devkitInReleaseBuilds(game, 'true')).toBe(true)
    expect(devkitInReleaseBuilds(game, 'false')).toBe(false)
    expect(() => devkitInReleaseBuilds(game, 'yes')).toThrow(/true or false/)
  })
})

describe('the plugin in a real Vite dev server', () => {
  let game: string
  let server: ViteDevServer
  let url: string
  beforeEach(async () => {
    game = mkdtempSync(join(tmpdir(), 'devkit-server-'))
    mkdirSync(join(game, 'content/ui'), { recursive: true })
    writeFileSync(join(game, 'content/devkit.json'), JSON.stringify({ inReleaseBuilds: true }))
    writeFileSync(join(game, 'content/ui/table.json'), JSON.stringify({ _help: 'keep me', rows: '#000000' }))
    server = await createServer({ root: game, configFile: false, logLevel: 'silent', plugins: [devkit()], server: { port: 0, host: '127.0.0.1' } })
    await server.listen()
    url = server.resolvedUrls!.local[0].replace(/\/$/, '')
  })
  afterEach(async () => {
    await server.close()
    rmSync(game, { recursive: true, force: true })
  })
  const save = (body: object, headers: Record<string, string> = {}) =>
    fetch(`${url}/__devkit/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: url, ...headers },
      body: JSON.stringify(body),
    })

  it('bakes the switch into the code as __DEVKIT_IN_RELEASE__', () => {
    expect(server.config.define?.__DEVKIT_IN_RELEASE__).toBe('true')
  })
  it('saves a content/ JSON file, keeping its _help note', async () => {
    const res = await save({ path: 'content/ui/table.json', data: { rows: '#123456' } })
    expect(res.status).toBe(200)
    expect(readFileSync(join(game, 'content/ui/table.json'), 'utf8')).toBe('{\n  "_help": "keep me",\n  "rows": "#123456"\n}\n')
  })
  it('refuses paths outside content/', async () => {
    const res = await save({ path: 'content/../package.json', data: {} })
    expect(res.status).toBe(400)
  })
  it('refuses saves from another web page', async () => {
    const res = await save({ path: 'content/ui/table.json', data: {} }, { Origin: 'http://evil.example' })
    expect(res.status).toBe(403)
  })
})
