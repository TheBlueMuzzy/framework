// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { goldenFile, goldenText, installEmotes, wiringSteps, wordsToAdd } from './install-emotes.mjs'
import { EMOTE_SAVE } from '../kit/save.ts'
import { createSave, memoryStorage } from '../saves/index.ts'
import { checkGoldenSave } from '../../saves/kit/oldSaves.ts'

const dirs = []
afterEach(() => { while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true }) })

function game(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'emotes-install-'))
  dirs.push(root)
  const all = { 'package.json': JSON.stringify({ name: 'goops', scripts: {} }), ...files }
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}
const quiet = () => {}

describe('install-emotes', () => {
  it('copies the kit (no tests), gives content/emotes.json once, and adds the starter words to en.json', () => {
    const root = game({ 'src/ui/kit/VERSION': '0.28.0\n', 'content/text/en.json': '{\n    "title": "Goops"\n}\n' })
    const result = installEmotes(root, { log: quiet })
    expect(existsSync(join(root, 'src/emotes/emotes.ts'))).toBe(true)
    expect(existsSync(join(root, 'src/emotes/conformance.mjs'))).toBe(true)
    expect(existsSync(join(root, 'src/emotes/ui/EmoteLayer.tsx'))).toBe(true)
    expect(result.changed.some((f) => /\.test\./.test(f))).toBe(false)
    expect(readFileSync(join(root, 'src/emotes/VERSION'), 'utf8')).toMatch(/^0\.\d+\.\d+ \(framework /)
    expect(JSON.parse(readFileSync(join(root, 'content/emotes.json'), 'utf8')).phrases).toHaveLength(7)
    const text = readFileSync(join(root, 'content/text/en.json'), 'utf8')
    expect(JSON.parse(text)).toMatchObject({ title: 'Goops', emotes: { wellPlayed: 'Well played!' } })
    expect(text).toMatch(/\n {4}"title"/) // the file's own indent kept
  })

  it('never overwrites the game\'s own words or starters; a second run changes nothing', () => {
    const root = game({ 'content/text/en.json': JSON.stringify({ emotes: { hello: 'Howdy!' } }) })
    installEmotes(root, { log: quiet })
    expect(JSON.parse(readFileSync(join(root, 'content/text/en.json'), 'utf8')).emotes.hello).toBe('Howdy!')
    writeFileSync(join(root, 'content/emotes.json'), '{ "phrases": ["hello"] }')
    const again = installEmotes(root, { log: quiet })
    expect(again).toMatchObject({ changed: [], starter: [], words: [] })
    expect(readFileSync(join(root, 'content/emotes.json'), 'utf8')).toMatch(/"hello"/)
  })

  it('no UI kit → no ui/; a broken en.json is never rewritten', () => {
    const root = game({ 'content/text/en.json': '{ broken' })
    const logs = []
    installEmotes(root, { log: (l) => logs.push(l) })
    expect(existsSync(join(root, 'src/emotes/ui'))).toBe(false)
    expect(readFileSync(join(root, 'content/text/en.json'), 'utf8')).toBe('{ broken')
    expect(logs.join('\n')).toMatch(/isn't valid JSON/)
  })

  it('with the saves module: a golden save that loads with the module\'s own save shape', () => {
    const root = game({ 'src/saves/VERSION': '0.6.0\n' })
    installEmotes(root, { log: quiet })
    expect(goldenFile(root)).toBe('tests/saves/goops_emotes-v1.json')
    const golden = JSON.parse(readFileSync(join(root, goldenFile(root)), 'utf8'))
    const save = createSave({ ...EMOTE_SAVE, key: 'goops:emotes', version: 1, storage: memoryStorage() })
    expect(checkGoldenSave(save, golden)).toEqual([])
    expect(goldenText(root)).toBe(readFileSync(join(root, goldenFile(root)), 'utf8'))
  })

  it('a src/emotes/ that isn\'t the module\'s is never touched', () => {
    const root = game({ 'src/emotes/mine.ts': 'export {}\n' })
    expect(installEmotes(root, { log: quiet }).refused).toMatch(/game's own files/)
  })

  it('the wiring steps: only the missing ones, and the online ones only for an online game', () => {
    const bare = game({ 'src/ui/kit/VERSION': '0.28.0\n' })
    expect(wiringSteps(bare).filter((w) => !w.done)).toHaveLength(5)
    const online = game({ 'src/ui/kit/VERSION': '0.28.0\n', 'party/server.ts': 'super(party, rules, settings, { emotes })\n',
      'src/game.tsx': [
        'const emotes = createEmotes({ send: (s, id) => online.sendEmote(id) })',
        'useRoom(code, me, { onEmote: (m) => emotes.receive(m) })',
        '<EmoteBubbles emotes={emotes} targetFor={t} /> <EmoteMenu /> {...emoteSeatProps(s, true)}',
        'applyEmoteSetting(emotes, values); const rows = EMOTE_SETTINGS_ROWS',
      ].join('\n') })
    expect(wiringSteps(online).filter((w) => !w.done).map((w) => w.step)).toEqual([])
  })

  it('wordsToAdd never re-writes the game\'s text file: one-line objects and \\u escapes stay exactly as they were (F107 proof)', () => {
    // (Glyphtender's en.json: the first installer re-wrote the whole file — one-line objects spread out, "NBSP" became a raw space)
    const glyph = '{\n  "end": { "splitWords": "Words\\u00a0{words}" },\n  "ai": {\n    "Scholar": {"name": "the Scholar", "bio": "x"}\n  }\n}\n'
    const added = wordsToAdd(glyph)
    expect(added.text.startsWith('{\n  "end": { "splitWords": "Words\\u00a0{words}" },\n  "ai": {\n    "Scholar": {"name": "the Scholar", "bio": "x"}\n  },\n  "emotes": {\n    "hello": "Hello!",')).toBe(true)
    expect(added.text.endsWith('    "goodGame": "Good game!"\n  }\n}\n')).toBe(true)
    // its own "emotes" part with some words: only the missing ones go in, at its top, nothing else moves
    const partial = '{\n  "emotes": {"hello": "Howdy!"},\n  "x": [1, 2]\n}\n'
    const more = wordsToAdd(partial)
    expect(JSON.parse(more.text).emotes).toMatchObject({ hello: 'Howdy!', wow: 'Wow!' })
    expect(more.text).toMatch(/"hello": "Howdy!"\},\n {2}"x": \[1, 2\]\n\}\n$/)
    expect(wordsToAdd('{\n  "emotes": {}\n}\n').text).toMatch(/^\{\n {2}"emotes": \{\n {4}"hello": "Hello!",[\s\S]*"goodGame": "Good game!"\n {2}\}\n\}\n$/)
    expect(wordsToAdd('{}').text).toMatch(/^\{\n {2}"emotes"/)
  })

  it('wordsToAdd: nothing to add → no new file', () => {
    expect(wordsToAdd(JSON.stringify({ emotes: { hello: 'a', wellPlayed: 'b', thanks: 'c', wow: 'd', oops: 'e', thinking: 'f', goodGame: 'g' } })).text).toBeNull()
  })
})
