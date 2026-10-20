// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { check, findSaves, missingVersions } from './conformance.mjs'

function tester({ code = [], goldens = [], savesJson = { storageAllowed: [] }, saveTest = true, saveTestText = '', vitest = true, runResult = { code: 0, out: '' } }) {
  const results = []
  const ran = []
  const linesMatching = (files, re) => files.flatMap((f) => f.text.split('\n').map((l, i) => (re.test(l.replace(/\/\/.*$/, '')) ? `${f.path}:${i + 1}  ${l.trim()}` : null)).filter(Boolean))
  const t = {
    rel: 'src/saves', version: '0.1.0',
    gameCode: () => code, linesMatching,
    files: () => goldens.map((path) => ({ path, text: '{}' })),
    read: (p) => (p === 'tests/saves/saves.test.ts' ? saveTestText : ''),
    json: (p) => (p === 'content/saves.json' ? savesJson : null),
    exists: (p) => (p === 'tests/saves/saves.test.ts' ? saveTest : p === 'node_modules/vitest' ? vitest : false),
    run: (cmd, args) => { ran.push([cmd, ...args].join(' ')); return runResult },
    pass: (name, detail) => results.push({ name, ok: true, detail }),
    fail: (name, problems, fix) => results.push({ name, ok: false, problems, fix }),
    skip: (name, why) => results.push({ name, skipped: true, why }),
  }
  return { t, results, ran }
}

const goopsSave = { path: 'src/progress/save.ts', text: "const VERSION = 2\nexport const progressSave = createSave<Progress>({\n  key: 'goops-progress',\n  kind: 'progress',\n  version: VERSION,\n  fresh: freshProgress(),\n})\n" }

describe('finding saves in game code', () => {
  it('reads key and version as plain values or a const in the same file; names the line', () => {
    expect(findSaves([goopsSave])).toEqual([{ where: 'src/progress/save.ts:2', key: 'goops-progress', version: 2 }])
    expect(findSaves([{ path: 'a.ts', text: "createSave({ key: \"glyphtender:new-game\", kind: 'settings', version: 3, fresh })" }])).toEqual([{ where: 'a.ts:1', key: 'glyphtender:new-game', version: 3 }])
  })

  it('a key or version it can\'t read is a problem with the fix; one in a comment isn\'t a save', () => {
    const [found] = findSaves([{ path: 'b.ts', text: 'createSave({ key: makeKey(), kind: "run", version: 1, fresh })' }])
    expect(found.problem).toContain('can\'t read its key')
    expect(findSaves([{ path: 'c.ts', text: '// createSave({ key: "x:y", version: 1 })\n/* createSave({ key: "x:z", version: 1 }) */' }])).toEqual([])
  })

  it('key and version come from the call\'s own options — not a field inside fresh, not a neighbour after the call (review)', () => {
    const text = "const a = createSave({ key: 'a:b', kind: 'settings', fresh: { version: 9, key: 'x' }, version: 2 })\nconst b = createSave({ key: 'c:d', kind: 'run', fresh: {} })\nconst other = { version: 5 }\n"
    const [first, second] = findSaves([{ path: 'n.ts', text }])
    expect(first).toEqual({ where: 'n.ts:1', key: 'a:b', version: 2 })
    expect(second.problem).toContain('can\'t read its version')
  })

  it('missing versions: several files for one version count once', () => {
    expect(missingVersions('glyphtender:new-game', 3, ['tests/saves/glyphtender_new-game-v1.json', 'tests/saves/glyphtender_new-game-v1-old.json', 'tests/saves/glyphtender_new-game-v3.json'])).toEqual([2])
  })
})

describe('Saves checks', () => {
  it('a game with golden saves for every version, passing tests and no direct storage passes', async () => {
    const { t, results, ran } = tester({ code: [goopsSave], goldens: ['tests/saves/goops-progress-v1.json', 'tests/saves/goops-progress-v2.json'] })
    await check(t)
    expect(results.map((r) => r.ok ?? 'skipped')).toEqual([true, true, 'skipped', true]) // no run in Goops
    expect(ran).toEqual(['npx vitest run tests/saves/saves.test.ts'])
  })

  it('a save with no golden copy for a version fails, naming the file to add', async () => {
    const { t, results } = tester({ code: [goopsSave], goldens: ['tests/saves/goops-progress-v1.json'] })
    await check(t)
    expect(results[0]).toMatchObject({ ok: false })
    expect(results[0].problems[0]).toContain('no golden save for version 2 → tests/saves/goops-progress-v2.json')
  })

  it('failing save tests fail the check with their last lines', async () => {
    const { t, results } = tester({ code: [goopsSave], goldens: ['tests/saves/goops-progress-v1.json', 'tests/saves/goops-progress-v2.json'], runResult: { code: 1, out: 'FAIL goops-progress-v1.json loads with today\'s code\n' } })
    await check(t)
    expect(results[1].ok).toBe(false)
    expect(results[1].problems.join('\n')).toContain('goops-progress-v1.json loads')
  })

  it('direct storage use is listed — this module\'s copy, rooms ids and allowed files are not', async () => {
    const code = [
      { path: 'src/ui/fullscreen.ts', text: "localStorage.setItem('glyphtender:fullscreen', '1')" },
      { path: 'src/ui/online/session.ts', text: "sessionStorage.setItem(ROOM_KEY, code)" },
      { path: 'src/net/id.ts', text: "localStorage.getItem('rooms:persistent-id')" },
      { path: 'src/saves/storage.ts', text: 'return localStorage' },
    ]
    const { t, results } = tester({ code, savesJson: { storageAllowed: [{ file: 'src/ui/online/session.ts', why: 'room code until F95' }] } })
    await check(t)
    expect(results[0].skipped).toBe(true) // no createSave yet
    expect(results[3].ok).toBe(false)
    expect(results[3].problems.slice(1)).toEqual(["  src/ui/fullscreen.ts:1  localStorage.setItem('glyphtender:fullscreen', '1')"])
  })

  it('a missing content/saves.json or save test is named', async () => {
    const { t, results } = tester({ code: [goopsSave], goldens: ['tests/saves/goops-progress-v1.json', 'tests/saves/goops-progress-v2.json'], savesJson: null, saveTest: false })
    await check(t)
    expect(results[1].problems[0]).toContain('tests/saves/saves.test.ts is missing')
    expect(results[3].problems[0]).toContain('content/saves.json is missing')
  })
})

describe('Saves checks — a run (createRun)', () => {
  const runFile = { path: 'src/game/run.ts', text: "export const matchRun = createRun<Match>({\n  key: 'glyphtender:run',\n  version: 1,\n  fresh: emptyMatch(),\n})\n" }
  const endsIt = { path: 'src/game/flow.ts', text: 'function gameOver() {\n  matchRun.end()\n}\n' }
  const goldens = ['tests/saves/glyphtender_run-v1.json']
  const listed = "import { checkRunEnds } from '../../src/saves/oldSaves'\nconst RUNS = [{ run: matchRun }]\nit('x', () => checkRunEnds(run))\n"

  it('the module\'s own copy (src/saves/) is never read as the game\'s saves — an older Dev Kit hands it over', async () => {
    const own = { path: 'src/saves/run.ts', text: 'export function createRun(options) { return createSave({ key: options.key, version: options.version }) }\n' }
    const { t, results } = tester({ code: [own, runFile, endsIt], goldens, saveTestText: listed })
    await check(t)
    expect(results.map((r) => r.ok)).toEqual([true, true, true, true])
  })

  it('a run is found like a save (key, version, its name) — so it needs golden saves too', () => {
    expect(findSaves([runFile])).toEqual([{ where: 'src/game/run.ts:1', key: 'glyphtender:run', version: 1, run: true, name: 'matchRun' }])
  })

  it('ended in the game\'s code and tested with checkRunEnds → passes', async () => {
    const { t, results } = tester({ code: [runFile, endsIt], goldens, saveTestText: listed })
    await check(t)
    expect(results.map((r) => r.ok)).toEqual([true, true, true, true])
    expect(results[2].detail).toBe('glyphtender:run: matchRun.end()')
  })

  it('an end() only in a comment ("// TODO matchRun.end()") doesn\'t count (review F93)', async () => {
    const todo = { path: 'src/game/flow.ts', text: 'function gameOver() {\n  // TODO matchRun.end()\n  /* matchRun.end() */\n}\n' }
    const { t, results } = tester({ code: [runFile, todo], goldens, saveTestText: listed })
    await check(t)
    expect(results[2].ok).toBe(false)
  })

  it('a run nothing ends fails: it would come back as Continue after the game was over', async () => {
    const { t, results } = tester({ code: [runFile], goldens, saveTestText: listed })
    await check(t)
    expect(results[2].ok).toBe(false)
    expect(results[2].problems[0]).toContain('nothing calls matchRun.end()')
  })

  it('a save test without checkRunEnds (an older starter) or without the run in RUNS fails, saying what to add', async () => {
    const { t, results } = tester({ code: [runFile, endsIt], goldens, saveTestText: 'const SAVES = []\n' })
    await check(t)
    expect(results[2].problems.join('\n')).toContain('doesn\'t run checkRunEnds')
    expect(results[2].problems.join('\n')).toContain('matchRun isn\'t listed')
  })

  it('a run with no name can\'t be checked — says how to fix it', async () => {
    const { t, results } = tester({ code: [{ path: 'a.ts', text: "register(createRun({ key: 'x:run', version: 1, fresh }))" }], goldens: ['tests/saves/x_run-v1.json'], saveTestText: listed })
    await check(t)
    expect(results[2].problems[0]).toContain('give it a name')
  })
})
