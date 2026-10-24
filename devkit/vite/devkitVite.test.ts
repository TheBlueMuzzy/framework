// @vitest-environment node
// Runs in the framework (not copied into games).
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { devkit, devkitInReleaseBuilds, isAllowedBugCapturePath, isAllowedContentPath, keepHelp, liveTuningName } from './devkitVite'

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

describe('isAllowedBugCapturePath — bug captures may go in .planning/bugs/ (where /bug keeps them), nowhere else', () => {
  it('allows a capture file directly in .planning/bugs/', () => {
    expect(isAllowedBugCapturePath('.planning/bugs/capture-2026-09-30-23-15-07.json')).toBe(true)
  })
  it('refuses other .planning files, sub-folders, sneaking out, and non-JSON', () => {
    expect(isAllowedBugCapturePath('.planning/STATE.json')).toBe(false)
    expect(isAllowedBugCapturePath('.planning/bugs/a/b.json')).toBe(false)
    expect(isAllowedBugCapturePath('.planning/bugs/../../package.json')).toBe(false)
    expect(isAllowedBugCapturePath('.planning/bugs/..json')).toBe(false)
    expect(isAllowedBugCapturePath('.planning/bugs/capture.md')).toBe(false)
    expect(isAllowedBugCapturePath(undefined)).toBe(false)
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

// formatJson (how files are written): formatJson.test.ts

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
  it('keeps how the file was written (one-line rows stay one line, 1.0 stays 1.0)', async () => {
    const handWritten = '{\n  "rows": [\n    { "min": 1.0, "max": 2 }\n  ]\n}\n'
    writeFileSync(join(game, 'content/ui/rows.json'), handWritten)
    expect((await save({ path: 'content/ui/rows.json', data: JSON.parse(handWritten) })).status).toBe(200)
    expect(readFileSync(join(game, 'content/ui/rows.json'), 'utf8')).toBe(handWritten)
  })
  it('skips the game reload for a saved file — unless the save says reload: true (the Text tab)', async () => {
    const plugin = server.config.plugins.find((p) => p.name === 'bmuz-devkit')!
    const hot = (file: string) => (plugin.handleHotUpdate as (ctx: { file: string }) => unknown)({ file })
    const file = join(game, 'content/ui/table.json')
    expect((await save({ path: 'content/ui/table.json', data: { rows: '#111111' } })).status).toBe(200)
    expect(hot(file)).toEqual([]) // no reload
    expect((await save({ path: 'content/ui/table.json', data: { rows: '#222222' }, reload: true })).status).toBe(200)
    expect(hot(file)).toBeUndefined() // Vite carries on and hot-reloads the game
  })
  it('a save that changes nothing leaves the file alone', async () => {
    const file = join(game, 'content/ui/table.json')
    const before = '{\n  "_help": "keep me",\n  "rows": "#000000"\n}\n'
    writeFileSync(file, before)
    const res = await save({ path: 'content/ui/table.json', data: JSON.parse(before) })
    expect(await res.json()).toMatchObject({ ok: true, unchanged: true })
    expect(readFileSync(file, 'utf8')).toBe(before)
  })
  it('serves a content/ file as it is on disk (the Text tab reads it fresh before saving)', async () => {
    const res = await fetch(`${url}/content/ui/table.json`, { cache: 'no-store' })
    expect(await res.json()).toEqual({ _help: 'keep me', rows: '#000000' })
  })
  it('refuses paths outside content/', async () => {
    const res = await save({ path: 'content/../package.json', data: {} })
    expect(res.status).toBe(400)
  })
  it('saves a bug capture to .planning/bugs/, making the folder the first time', async () => {
    const res = await save({ path: '.planning/bugs/capture-1.json', data: { whatWentWrong: 'x' } })
    expect(res.status).toBe(200)
    expect(JSON.parse(readFileSync(join(game, '.planning/bugs/capture-1.json'), 'utf8'))).toEqual({ whatWentWrong: 'x' })
  })
  it('makes content/snapshots/ on the first snapshot, but still refuses other missing folders', async () => {
    expect((await save({ path: 'content/snapshots/a.json', data: { name: 'a' } })).status).toBe(200)
    expect(existsSync(join(game, 'content/snapshots/a.json'))).toBe(true)
    expect((await save({ path: 'content/nowhere/a.json', data: {} })).status).toBe(400)
    expect(existsSync(join(game, 'content/nowhere'))).toBe(false)
  })
  it('refuses other .planning files', async () => {
    expect((await save({ path: '.planning/STATE.json', data: {} })).status).toBe(400)
  })
  it('refuses saves from another web page', async () => {
    const res = await save({ path: 'content/ui/table.json', data: {} }, { Origin: 'http://evil.example' })
    expect(res.status).toBe(403)
  })
})

describe('the font library in a real Vite dev server (the Fonts tab)', () => {
  let base: string
  let game: string
  let server: ViteDevServer
  let url: string
  beforeEach(async () => {
    base = mkdtempSync(join(tmpdir(), 'devkit-fontlib-'))
    game = join(base, 'game')
    const lib = join(base, 'library')
    mkdirSync(join(lib, 'pixel'), { recursive: true })
    writeFileSync(join(lib, 'pixel', 'Tiny Font.ttf'), 'not really a font')
    writeFileSync(join(lib, 'pixel', 'licence.txt'), 'free')
    writeFileSync(join(base, 'secret.ttf'), 'outside the library')
    mkdirSync(join(game, 'content/ui'), { recursive: true })
    writeFileSync(join(game, 'devkit.local.json'), JSON.stringify({ fontLibrary: lib }))
    server = await createServer({ root: game, configFile: false, logLevel: 'silent', plugins: [devkit()], server: { port: 0, host: '127.0.0.1' } })
    await server.listen()
    url = server.resolvedUrls!.local[0].replace(/\/$/, '')
  })
  afterEach(async () => {
    await server.close()
    rmSync(base, { recursive: true, force: true })
  })
  const fontFile = (path: string) => fetch(`${url}/__devkit/font-library/file?path=${encodeURIComponent(path)}`)

  it('lists the library and serves one font file — nothing outside it, nothing for another site', async () => {
    const list = await (await fetch(`${url}/__devkit/font-library`)).json()
    expect(list).toMatchObject({ found: true, more: false, fonts: [{ path: 'folder:pixel/Tiny Font.ttf', name: 'Tiny Font', folder: 'pixel', file: 'pixel/Tiny Font.ttf' }] })
    const file = await fontFile('folder:pixel/Tiny Font.ttf')
    expect(file.headers.get('content-type')).toBe('font/ttf')
    expect(await file.text()).toBe('not really a font')
    expect((await fontFile('folder:../secret.ttf')).status).toBe(400)
    expect((await fontFile('pixel/Tiny Font.ttf')).status).toBe(400) // no root named
    expect((await fontFile('folder:pixel/licence.txt')).status).toBe(400)
    expect((await fontFile('installed1:../../secret.ttf')).status).toBe(400)
    expect((await fetch(`${url}/__devkit/font-library`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(403)
  })
  it('lists the computer\'s installed fonts too (one row per family) — and the off switch hides them', async () => {
    const list = await (await fetch(`${url}/__devkit/font-library`)).json()
    expect(list.installed).toMatchObject({ on: true, more: false })
    expect(list.installed.fonts.every((f: { path: string }) => /^installed\d+:/.test(f.path))).toBe(true)
    if (list.installed.fonts.length > 0) { // (a computer with installed fonts — every desktop)
      const first = await fontFile(list.installed.fonts[0].path)
      expect(first.status).toBe(200)
      expect(first.headers.get('content-type')).toMatch(/^font\//)
    }
    writeFileSync(join(game, 'devkit.local.json'), JSON.stringify({ fontLibrary: join(base, 'library'), installedFonts: false }))
    const off = await (await fetch(`${url}/__devkit/font-library`)).json()
    expect(off.installed).toEqual({ on: false, folders: [], fonts: [], more: false, skipped: {}, platform: process.platform })
    expect(off.fonts).toHaveLength(1)
  })
  it('Add to game copies it + its licence into public/fonts/ and lists it — only from the game page', async () => {
    const add = (headers: Record<string, string>) => fetch(`${url}/__devkit/font-library/add`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ path: 'folder:pixel/Tiny Font.ttf' }),
    })
    expect((await add({ Origin: 'http://evil.example' })).status).toBe(403)
    const res = await add({ Origin: url })
    expect(res.status).toBe(200)
    expect((await res.json()).font).toMatchObject({ name: 'Tiny Font', file: 'pixel/Tiny Font.ttf', licence: 'unknown' })
    expect(readFileSync(join(game, 'public/fonts/pixel/licence.txt'), 'utf8')).toBe('free')
    expect(JSON.parse(readFileSync(join(game, 'content/ui/fonts.json'), 'utf8')).fonts).toHaveLength(1)
    expect(JSON.parse(readFileSync(join(game, 'content/credits.json'), 'utf8'))[0].light).toBe('🔴')
  })
})

describe('live tuning by default — content/tuning imports come back live (0.18.0)', () => {
  let game: string
  let server: ViteDevServer
  beforeEach(async () => {
    game = mkdtempSync(join(tmpdir(), 'devkit-live-'))
    mkdirSync(join(game, 'content', 'tuning'), { recursive: true })
    mkdirSync(join(game, 'src', 'devkit', 'tuning'), { recursive: true })
    writeFileSync(join(game, 'content', 'tuning', 'tank.json'), '{ "speed": 2, "look": { "glow": 0.5 } }')
    writeFileSync(join(game, 'src', 'devkit', 'tuning', 'liveTuning.ts'), readFileSync(new URL('../kit/tuning/liveTuning.ts', import.meta.url), 'utf8')
      // (no node_modules in the temp game: React's two hooks stubbed — liveFile doesn't use them)
      .replace("import { useEffect, useRef } from 'react'", 'const useEffect = (..._: unknown[]) => {}; const useRef = <T>(current: T) => ({ current })'))
    writeFileSync(join(game, 'src', 'game.ts'), [
      "import tank from '../content/tuning/tank.json'",
      "import raw from '../content/tuning/tank.json?raw'",
      "export { tank, raw }",
    ].join('\n'))
    server = await createServer({ root: game, configFile: false, logLevel: 'silent', plugins: [devkit()], server: { port: 0, host: '127.0.0.1' } })
  })
  afterEach(async () => {
    await server.close()
    rmSync(game, { recursive: true, force: true })
  })

  it('names only files directly in content/tuning, with no query', () => {
    expect(liveTuningName('C:/game/content/tuning/tank.json', 'C:/game')).toBe('tank')
    expect(liveTuningName('c:/game/content/tuning/tank.json', 'C:\\game')).toBe('tank')
    expect(liveTuningName('C:/game/content/tuning/tank.json?raw', 'C:/game')).toBeNull()
    expect(liveTuningName('C:/game/content/tuning/sub/a.json', 'C:/game')).toBeNull()
    expect(liveTuningName('C:/game/content/ui/style.json', 'C:/game')).toBeNull()
    expect(liveTuningName('C:/game/content/tuning/notes.md', 'C:/game')).toBeNull()
  })
  it('the game\'s import reads the latest Dev Kit edit on every access; ?raw stays the plain text', async () => {
    const mod = await server.ssrLoadModule('/src/game.ts') as { tank: { speed: number; look: { glow: number } }; raw: string }
    const live = await server.ssrLoadModule('/src/devkit/tuning/liveTuning.ts') as { sendTuning: (f: string, d: unknown) => void }
    expect(mod.tank.speed).toBe(2)
    expect(JSON.parse(mod.raw).speed).toBe(2)
    ;(globalThis as { window?: unknown }).window = new EventTarget() // sendTuning dispatches on window
    try {
      live.sendTuning('tank', { speed: 5, look: { glow: 0.9 } })
    } finally {
      delete (globalThis as { window?: unknown }).window
    }
    expect(mod.tank.speed).toBe(5)
    expect(mod.tank.look.glow).toBe(0.9)
    expect({ ...mod.tank }).toEqual({ speed: 5, look: { glow: 0.9 } })
  })
})
