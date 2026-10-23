// @vitest-environment node
// The checks run against a real little game folder, through the Dev Kit's real tester (check-framework.mjs makeTester).
// (The two browser checks — the picker, the bubble's bars — run in the F107 proof on a real game.)
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { makeTester } from '../../devkit/kit/check-framework.mjs'
import { CHECKS, check, limitProblems } from './conformance.mjs'
import template from '../templates/content/emotes.json'
import words from '../templates/content/words.json'

const dirs = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

const WIRED = {
  'content/emotes.json': JSON.stringify(template),
  'content/text/en.json': JSON.stringify({ title: 'Game', ...words }),
  'content/ui/settings.json': JSON.stringify({ tabs: [{ id: 'game', label: 'Game', rows: [{ id: 'hideEmotes', type: 'toggle', label: 'Hide everyone\'s emotes', default: false }] }] }),
  'src/main.tsx': [
    "import emotesJson from '../content/emotes.json'",
    "import { createEmotes, applyEmoteSetting } from './emotes'",
    'const emotes = createEmotes({ settings: emotesJson, words: text.emotes })',
    'applyEmoteSetting(emotes, loadSettings(schema))',
  ].join('\n'),
  'party/server.ts': "import emotes from '../content/emotes.json'\nexport default class S extends RoomServer { constructor(p) { super(p, rules, settings, { emotes }) } }\n",
  // the module's own copy says everything — it must never count as the game's wiring or as hard-coded words
  'src/emotes/VERSION': '0.1.0\n',
  'src/emotes/settingsRow.ts': "applyEmoteSetting(x); const w = 'Well played!'\n",
}

function game(files) {
  const root = mkdtempSync(join(tmpdir(), 'emotes-conf-'))
  dirs.push(root)
  for (const [path, text] of Object.entries(files)) {
    if (text === null) continue
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}
async function run(files) {
  const results = []
  const t = makeTester({ root: game(files), module: { rel: 'src/emotes', version: '0.1.0' }, modules: [{ id: 'emotes' }], shared: {}, staticOnly: true, results })
  await check(t)
  return Object.fromEntries(results.map((r) => [r.name, r]))
}

describe('Emotes checks', () => {
  it('a wired game passes every code check; the browser ones are skipped with --static', async () => {
    const r = await run(WIRED)
    for (const name of [CHECKS.words, CHECKS.hardCoded, CHECKS.limits, CHECKS.server, CHECKS.settings]) expect(r[name].ok, `${name}: ${r[name].problems}`).toBe(true)
    expect(r[CHECKS.picker].skipped).toBe(true)
    expect(r[CHECKS.bars].skipped).toBe(true)
  })

  it('a phrase without words fails, naming it', async () => {
    const r = await run({ ...WIRED, 'content/emotes.json': JSON.stringify({ ...template, phrases: [...template.phrases, 'taunt'] }) })
    expect(r[CHECKS.words].ok).toBe(false)
    expect(r[CHECKS.words].problems.join(' ')).toMatch(/"taunt"/)
  })

  it('a phrase\'s words typed into the game\'s code fail (comments don\'t count)', async () => {
    const r = await run({ ...WIRED, 'src/ui/Table.tsx': "// shows 'Well played!' later\nconst label = 'Good game!'\nexport const X = () => <b>Thanks!</b>\n" })
    expect(r[CHECKS.hardCoded].ok).toBe(false)
    expect(r[CHECKS.hardCoded].problems).toEqual(['src/ui/Table.tsx — "Thanks!"', 'src/ui/Table.tsx — "Good game!"'])
  })

  it('limits: burst 0, a zero refill or a server looser than the device fail', async () => {
    expect(limitProblems(template)).toEqual([])
    expect(limitProblems({ limits: { burst: 0, refillSeconds: 0 } })).toHaveLength(2)
    const r = await run({ ...WIRED, 'content/emotes.json': JSON.stringify({ ...template, server: { burst: 10, refillSeconds: 1, perMatch: 200 } }) })
    expect(r[CHECKS.limits].ok).toBe(false)
    expect(r[CHECKS.limits].problems.join(' ')).toMatch(/server\.burst \(10\) is more than limits\.burst \(3\)[\s\S]*quicker/)
  })

  it('an online game that doesn\'t pass the phrases, or handles emote itself, fails; an offline one skips', async () => {
    const r = await run({ ...WIRED, 'party/server.ts': "export default class S extends RoomServer { constructor(p) { super(p, rules, settings) } }\n", 'party/rules.ts': "if (msg.type === 'emote') broadcast(msg)\n" })
    expect(r[CHECKS.server].ok).toBe(false)
    expect(r[CHECKS.server].problems.join(' ')).toMatch(/doesn't pass content\/emotes\.json[\s\S]*party\/rules\.ts handle 'emote'/)
    expect((await run({ ...WIRED, 'party/server.ts': null }))[CHECKS.server].skipped).toBe(true)
  })

  it('no switch in Settings, or a switch nothing reads, fails', async () => {
    const r = await run({ ...WIRED, 'content/ui/settings.json': JSON.stringify({ tabs: [] }), 'src/main.tsx': 'const emotes = createEmotes({})\n' })
    expect(r[CHECKS.settings].ok).toBe(false)
    expect(r[CHECKS.settings].problems).toHaveLength(2)
  })
})
