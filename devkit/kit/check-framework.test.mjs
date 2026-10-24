// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PORT, KNOWN_GAPS_CHECK, adapterFile, commandLine, applyKnownGaps, readKnownGaps, findModules, formatReport, gameCode, healthSummary, linesMatching, makeTester, readArgs, saveHealth, serverUrl } from './check-framework.mjs'
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
    write('src/saves/storage.ts', 'setTimeout(f, 1)') // the saves module (0.20.4)
    write('src/engine/tick.ts', '// setTimeout(f, 1) in a comment\nconst a = 1\nsetTimeout(() => drop(), 500)\n')
    write('src/engine/tick.test.ts', 'setTimeout(f, 1)')
    const code = gameCode(game)
    expect(code.map((f) => f.path)).toEqual(['src/engine/tick.ts'])
    expect(linesMatching(code, /setTimeout\(/)).toEqual(['src/engine/tick.ts:3  setTimeout(() => drop(), 500)'])
  })
  it('F112: a module this Dev Kit has never heard of (a src/ folder with a VERSION) is not game code', () => {
    write('src/engine/tick.ts', 'setTimeout(() => drop(), 500)\n')
    write('src/sparkles/VERSION', '0.1.0\n') // made-up module, not in KIT_FOLDERS
    write('src/sparkles/Sparkle.tsx', 'setTimeout(f, 1)')
    write('src/maps/kit/VERSION', '0.2.0\n') // a src/<x>/kit/ module: its kit/ is skipped, the game's src/maps/ stays
    write('src/maps/kit/grid.ts', 'setTimeout(f, 1)')
    write('src/maps/level1.ts', 'export const level = 1\n')
    write('src/notamodule/thing.ts', 'export const x = 1\n') // no VERSION → still the game's
    expect(gameCode(game).map((f) => f.path).sort()).toEqual(['src/engine/tick.ts', 'src/maps/level1.ts', 'src/notamodule/thing.ts'])
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
  it('t.warn (0.21.0): shown with its problems + fix, but the run still passes; the health file lists it', () => {
    const results = []
    const t = makeTester({ root: game, module: { rel: 'src/devkit', version: '1' }, modules: [], shared: {}, staticOnly: false, results })
    t.pass('a', 'fine')
    t.warn('pill clear', ['390×844: at "top" it covers "CRACKS 0/10"'], 'content/devkit.json "pauseBadgeSpot": "left"')
    const sections = [{ title: 'Dev Kit', version: '1', rel: 'src/devkit', results }]
    const { text, failed } = formatReport('g', sections)
    expect(failed).toBe(0)
    expect(text).toContain('! pill clear — WARNING\n      390×844: at "top" it covers "CRACKS 0/10"\n      FIX: content/devkit.json "pauseBadgeSpot": "left"')
    expect(text).toMatch(/PASS — 1 check kept, 1 warning \(pill clear\)$/)
    expect(healthSummary(sections).modules[0]).toMatchObject({ passed: 1, warnings: ['pill clear'], failed: [] })
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
      { id: 'devkit', title: 'Dev Kit', version: '0.19.1', passed: 1, warnings: [], failed: ['b'], skipped: 1, knownGaps: [], gapsToRemove: [] },
      { id: 'ui', title: 'UI kit', version: '0.19.0', passed: 1, warnings: [], failed: [], skipped: 0, knownGaps: [], gapsToRemove: [] },
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

  it('a listed check that only WARNS still has its gap — no "passes now" reminder (F103 review)', () => {
    const sections = run()
    sections[1].results[0] = { name: 'no inline styles', ok: true, warning: true, problems: ['still covers CRACKS'] }
    applyKnownGaps(sections, listed([{ check: 'no inline styles', why: 'x', roadmap: 'F1' }]))
    expect(sections[1].results[0].gapNowPasses).toBeUndefined()
    expect(formatReport('g', sections).text).not.toContain('it passes now')
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

describe('t.run never builds a shell string (0.26.2, F120)', () => {
  // names a check could pass along (test files found in the repo): each would run a command if a shell read it
  const ODD = ['$(echo pwned).test.ts', 'a;echo pwned.test.ts', 'b&echo.>marker.txt', 'c|echo.>marker2.txt', 'd %PATH% `whoami` "q".test.ts']
  const tester = () => makeTester({ root: game, module: { rel: 'src/devkit', version: '1' }, modules: [], shared: {}, staticOnly: true, results: [] })

  it('commandLine: node = this Node; npm / npx on Windows = this Node + npm\'s own cli file; anything else as it is', () => {
    const win = { platform: 'win32', execPath: 'C:\\node\\node.exe', env: {}, exists: (p) => p.endsWith('npx-cli.js') }
    expect(commandLine('node', ['x.mjs'], win)).toEqual({ file: 'C:\\node\\node.exe', args: ['x.mjs'] })
    expect(commandLine('npx', ['vitest', 'run'], win)).toEqual({ file: 'C:\\node\\node.exe', args: ['C:\\node\\node_modules\\npm\\bin\\npx-cli.js', 'vitest', 'run'] })
    const running = { ...win, env: { npm_execpath: 'D:\\tools\\npm\\bin\\npm-cli.js' } } // started by `npm run check:framework`
    expect(commandLine('npx', ['vitest'], running).args[0]).toBe('D:\\tools\\npm\\bin\\npx-cli.js')
    expect(commandLine('npm', ['test'], { ...win, exists: () => false }).error).toMatch(/couldn't find npm's npm-cli\.js/)
    expect(commandLine('npx', ['vitest'], { platform: 'linux', execPath: '/usr/bin/node', env: {} })).toEqual({ file: 'npx', args: ['vitest'] })
    expect(commandLine('git', ['status'], win)).toEqual({ file: 'git', args: ['status'] })
  })

  it('odd file names reach the program as data — nothing runs, nothing is written', () => {
    write('show.mjs', 'console.log(JSON.stringify(process.argv.slice(2)))')
    const r = tester().run('node', ['show.mjs', ...ODD])
    expect(r.code).toBe(0)
    expect(JSON.parse(r.out)).toEqual(ODD)
    expect(readdirSync(game)).toEqual(['show.mjs'])
  })

  it('npm and npx still run (on Windows they are .cmd files) — a game\'s tool gets the odd names as data too', () => {
    write('package.json', '{ "name": "g", "version": "1.0.0" }')
    write('tool/package.json', '{ "name": "show-args", "version": "1.0.0", "bin": { "show-args": "show.mjs" } }')
    write('tool/show.mjs', '#!/usr/bin/env node\nconsole.log(JSON.stringify(process.argv.slice(2)))\n')
    const t = tester()
    const install = t.run('npm', ['install', '--offline', '--no-audit', '--no-fund', './tool']) // a local folder: no network
    expect(install.code, install.out).toBe(0)
    const r = t.run('npx', ['--offline', 'show-args', ...ODD])
    expect(r.code, r.out).toBe(0)
    expect(JSON.parse(r.out.trim().split('\n').pop())).toEqual(ODD)
    expect(readdirSync(game).sort()).toEqual(['node_modules', 'package-lock.json', 'package.json', 'tool'])
  }, 60_000)
})
