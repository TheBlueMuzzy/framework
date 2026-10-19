// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PORT, KNOWN_GAPS_CHECK, adapterFile, applyKnownGaps, readKnownGaps, findModules, formatReport, gameCode, healthSummary, linesMatching, makeTester, readArgs, saveHealth, serverUrl } from './check-framework.mjs'
import { firstDiff, nudged, unreadTuning } from './conformance.mjs'

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

describe('review fixes', () => {
  it('serverUrl: Vite\'s own address — https when the game serves HTTPS (basicSsl), with the base path', () => {
    expect(serverUrl({ resolvedUrls: { local: ['https://127.0.0.1:5292/goops/'] }, config: {} }, 5292)).toBe('https://127.0.0.1:5292/goops/')
    expect(serverUrl({ config: { base: '/g/', server: { https: {} } } }, 5292)).toBe('https://127.0.0.1:5292/g/')
    expect(serverUrl({ config: { base: '/' } }, 5292)).toBe('http://127.0.0.1:5292/')
  })
  it('a tuning file only a test or the adapter imports is NOT read by the game', () => {
    write('src/devkit-game/gAdapter.ts', "import tank from '../../content/tuning/tank.json'")
    write('tests/fall.test.ts', "import fall from '../content/tuning/fall.json'")
    write('src/engine/hud.ts', "import hud from '../../content/tuning/hud.json'")
    expect(unreadTuning(['tank', 'fall', 'hud'], gameCode(game))).toEqual(['tank', 'fall'])
  })
})

describe('health file for the planner (F66)', () => {
  const sections = [
    { title: 'Dev Kit', version: '0.19.1', rel: 'src/devkit', results: [{ name: 'a', ok: true }, { name: 'b', ok: false }, { name: 'c', skipped: true }] },
    { title: 'UI kit', version: '0.19.0', rel: 'src/ui/kit', results: [{ name: 'd', ok: true }] },
  ]
  it('sums each module up: passed, the failed names, skipped', () => {
    const s = healthSummary(sections, { date: '2026-10-19T00:00:00.000Z', commit: 'abc1234' })
    expect(s.modules).toEqual([
      { id: 'devkit', title: 'Dev Kit', version: '0.19.1', passed: 1, failed: ['b'], skipped: 1, knownGaps: [], gapsToRemove: [] },
      { id: 'ui', title: 'UI kit', version: '0.19.0', passed: 1, failed: [], skipped: 0, knownGaps: [], gapsToRemove: [] },
    ])
    expect(s.commit).toBe('abc1234')
  })
  it('keeps the last full run when a --static run is saved', () => {
    saveHealth(game, healthSummary(sections, { commit: 'full1' }), false)
    saveHealth(game, healthSummary(sections, { commit: 'quick' }), true)
    const saved = JSON.parse(readFileSync(join(game, 'e2e-shots', 'framework.json'), 'utf8'))
    expect(saved.full.commit).toBe('full1')
    expect(saved.static.commit).toBe('quick')
  })
})

describe('known gaps (0.20.1)', () => {
  const HALF = '◐ half pause stops the rules, not the looks'
  const run = () => [
    { title: 'Dev Kit', version: '0.20.1', rel: 'src/devkit', results: [
      { name: 'a', ok: true },
      { name: HALF, ok: false, problems: ['the rules clock moved 1000 ms'], fix: 'Tick by rulesClock.rate' },
    ] },
    { title: 'UI kit', version: '0.19.0', rel: 'src/ui/kit', results: [{ name: 'no inline styles', ok: true }] },
  ]
  const listed = (entries) => { write('content/devkit.json', JSON.stringify({ inReleaseBuilds: true, knownGaps: entries })); return readKnownGaps(game) }

  it('a listed failing check is a known gap (why + roadmap), not a failure: the run passes and framework.json keeps it apart', () => {
    const sections = run()
    applyKnownGaps(sections, listed([{ check: HALF, why: 'turns move on when animations finish', roadmap: 'F99' }]))
    const { text, failed } = formatReport('g', sections)
    expect(failed).toBe(0)
    expect(text).toContain(`○ ${HALF} — KNOWN GAP (roadmap F99): turns move on when animations finish`)
    expect(text).toContain(`✓ ${KNOWN_GAPS_CHECK}`)
    expect(text).toMatch(/PASS — 3 checks kept, 1 known gap \(◐ half pause stops the rules, not the looks \(roadmap F99\)\)$/)
    const dk = healthSummary(sections).modules[0]
    expect(dk.failed).toEqual([])
    expect(dk.knownGaps).toEqual([{ name: HALF, why: 'turns move on when animations finish', roadmap: 'F99' }])
  })

  it('a listed check that passes now → a reminder to take it off the list (not a failure)', () => {
    const sections = run()
    applyKnownGaps(sections, listed([{ check: 'no inline styles', why: 'x', roadmap: 'F1' }]))
    const { text, failed } = formatReport('g', sections)
    expect(failed).toBe(1) // the half pause one isn't listed: still a real failure
    expect(text).toContain('! it passes now — take it off "knownGaps" in content/devkit.json')
    expect(text).toMatch(/! 1 known gap passes now — take it off "knownGaps" in content\/devkit\.json: no inline styles$/)
    expect(healthSummary(sections).modules[1].gapsToRemove).toEqual(['no inline styles'])
  })

  it('a listed name no check has is a failure (typo / renamed check) — only judged when every check ran', () => {
    const sections = run()
    applyKnownGaps(sections, listed([{ check: HALF, why: 'w', roadmap: 'TBD' }, { check: '◐ half pause stop the rules', why: 'typo' }]))
    const { text, failed } = formatReport('g', sections)
    expect(failed).toBe(1)
    expect(text).toContain(`✗ ${KNOWN_GAPS_CHECK}\n      "◐ half pause stop the rules" — no check has this name`)
    const partial = run()
    applyKnownGaps(partial, listed([{ check: 'a browser check' }]), { complete: false }) // --static / --only
    expect(formatReport('g', partial).failed).toBe(1) // just the unlisted half pause one
    expect(partial[0].results.some((r) => r.name === KNOWN_GAPS_CHECK)).toBe(false)
  })

  it('no file / no list → nothing changes; a broken list is a failure', () => {
    expect(readKnownGaps(game)).toEqual({ gaps: [], problems: [] })
    const sections = run()
    applyKnownGaps(sections, readKnownGaps(game))
    expect(sections[0].results).toHaveLength(2)
    write('content/devkit.json', JSON.stringify({ knownGaps: { check: HALF } }))
    expect(readKnownGaps(game).problems[0]).toMatch(/must be a list/)
  })
})
