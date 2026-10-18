// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PORT, adapterFile, findModules, formatReport, gameCode, linesMatching, makeTester, readArgs } from './check-framework.mjs'
import { firstDiff, nudged } from './conformance.mjs'

let game
const write = (path, text) => { mkdirSync(dirname(join(game, path)), { recursive: true }); writeFileSync(join(game, path), text) }
beforeEach(() => { game = mkdtempSync(join(tmpdir(), 'fwcheck-')) })
afterEach(() => rmSync(game, { recursive: true, force: true }))

describe('readArgs', () => {
  it('defaults, --port, --static, --only', () => {
    expect(readArgs([])).toEqual({ port: DEFAULT_PORT, staticOnly: false, only: null })
    expect(readArgs(['--port', '5292', '--static', '--only', 'devkit, ui'])).toEqual({ port: 5292, staticOnly: true, only: ['devkit', 'ui'] })
    expect(() => readArgs(['--port', 'x'])).toThrow(/--port/)
  })
})

describe('findModules', () => {
  it('finds every installed module by its VERSION file, the Dev Kit first, and notes which have checks', () => {
    write('src/ui/kit/VERSION', '0.18.0\ncommit abc\n')
    write('src/ui/kit/conformance.mjs', '')
    write('src/devkit/VERSION', '0.19.0\ncommit abc\n')
    write('src/devkit/conformance.mjs', '')
    write('src/audio/VERSION', '0.2.1 (framework abc)\n') // an older copy: no checks
    write('src/game/App.tsx', '') // the game's own folder: no VERSION
    const found = findModules(game).map(({ id, rel, version, checks }) => ({ id, rel, version, checks: !!checks }))
    expect(found).toEqual([
      { id: 'devkit', rel: 'src/devkit', version: '0.19.0', checks: true },
      { id: 'audio', rel: 'src/audio', version: '0.2.1', checks: false },
      { id: 'ui', rel: 'src/ui/kit', version: '0.18.0', checks: true },
    ])
  })
  it('no src/ → nothing', () => expect(findModules(game)).toEqual([]))
})

describe('reading the game', () => {
  it('adapterFile: what tabs.ts registers (not the how-to comment)', () => {
    write('src/devkit-game/tabs.ts', "//   registerDevKitGame(myGameAdapter)\nimport { goopsAdapter } from './goopsAdapter'\nregisterDevKitGame(goopsAdapter)\n")
    write('src/devkit-game/goopsAdapter.ts', '')
    expect(adapterFile(game)).toBe('src/devkit-game/goopsAdapter.ts')
    write('src/devkit-game/tabs.ts', '// registerDevKitGame(myGameAdapter)\nexport const gameTabs = []\n')
    expect(adapterFile(game)).toBe(null)
  })
  it('gameCode skips the framework folders and tests; linesMatching names file:line, not comments', () => {
    write('src/devkit/gameClock.ts', 'setTimeout(f, 1)')
    write('src/ui/kit/x.ts', 'setTimeout(f, 1)')
    write('src/engine/tick.ts', '// setTimeout(f, 1) in a comment\nconst a = 1\nsetTimeout(() => drop(), 500)\n')
    write('src/engine/tick.test.ts', 'setTimeout(f, 1)')
    const code = gameCode(game)
    expect(code.map((f) => f.path)).toEqual(['src/engine/tick.ts'])
    expect(linesMatching(code, /setTimeout\(/)).toEqual(['src/engine/tick.ts:3  setTimeout(() => drop(), 500)'])
  })
})

describe('the tester + report', () => {
  it('collects pass / fail / skip and prints what to fix; exit status = failures', () => {
    const results = []
    const t = makeTester({ root: game, module: { rel: 'src/devkit', version: '0.19.0' }, modules: [{ id: 'devkit' }], shared: {}, staticOnly: true, results })
    t.pass('a', 'fine')
    t.fail('b', ['src/x.ts:3 — copies tank at load'], 'Read it where it\'s used.')
    t.skip('c', '--static')
    expect(t.has('devkit')).toBe(true)
    expect(t.has('audio')).toBe(false)
    const { text, failed } = formatReport('mygame', [{ title: 'Dev Kit', version: '0.19.0', rel: 'src/devkit', results }])
    expect(failed).toBe(1)
    expect(text).toContain('✓ a — fine')
    expect(text).toContain('✗ b\n      src/x.ts:3 — copies tank at load\n      FIX: Read it where it\'s used.')
    expect(text).toContain('– c — --static')
    expect(text).toMatch(/FAIL — 1 promise not kept: b$/)
    expect(formatReport('mygame', [{ title: 'Dev Kit', version: '1', rel: 'src/devkit', results: [results[0], results[2]] }]).text).toMatch(/PASS — 1 check kept, 1 skipped$/)
  })
  it('needsPlay says exactly what to add to the adapter', () => {
    write('src/devkit-game/tabs.ts', "import { gAdapter } from './gAdapter'\nregisterDevKitGame(gAdapter)\n")
    write('src/devkit-game/gAdapter.ts', '')
    const results = []
    const t = makeTester({ root: game, module: { rel: 'src/devkit', version: '1' }, modules: [], shared: {}, staticOnly: false, results })
    t.needsPlay('full pause', 'nostart')
    expect(results[0].problems[0]).toContain('(src/devkit-game/gAdapter.ts) has no conformance.startPlay')
    expect(results[0].fix).toContain('startPlay: async () =>')
  })
})

describe('Dev Kit checks: helpers', () => {
  it('firstDiff names the first changed path', () => {
    expect(firstDiff({ a: 1, b: { c: [1, 2] } }, { a: 1, b: { c: [1, 2] } })).toBe('')
    expect(firstDiff({ a: 1, b: { c: [1, 2] } }, { a: 1, b: { c: [1, 3] } })).toBe('b.c.1: 2 → 3')
    expect(firstDiff({ a: 1 }, { a: 1, z: true })).toBe('z: missing → true')
  })
  it('nudged changes one value (numbers, booleans, text, nested), skips notes and arrays', () => {
    expect(nudged({ _help: 'x', speed: 2 })).toEqual({ data: { _help: 'x', speed: 9 }, key: 'speed' })
    expect(nudged({ fall: { msPerRow: 0.5 } })).toEqual({ data: { fall: { msPerRow: 0.637 } }, key: 'fall' })
    expect(nudged({ on: true }).data.on).toBe(false)
    expect(nudged({ list: [1, 2], colour: '#fff' })).toEqual({ data: { list: [1, 2], colour: '#fff~' }, key: 'colour' })
    expect(nudged([1, 2])).toBe(null)
    expect(nudged({ _only: 'notes' })).toBe(null)
  })
})
