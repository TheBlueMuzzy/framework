// The installer on small made-up games in a temp folder: what it adds to the lint config, how strict, and what it
// refuses. The edited config is checked by Node itself (node --check), so a missing comma can't slip through.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { addRules, countFinds, installLint, MARK } from './install-lint.mjs'

const STARTER_CONFIG = `import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended],
  },
])
`
const PLAIN_CONFIG = `import js from '@eslint/js'

export default [
  js.configs.recommended,
  { ignores: ['dist'] }
]
`

const games = []
function makeGame(files) {
  const dir = mkdtempSync(join(tmpdir(), 'lint-game-'))
  games.push(dir)
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true })
    writeFileSync(join(dir, path), text)
  }
  return dir
}
afterEach(() => { while (games.length) rmSync(games.pop(), { recursive: true, force: true }) })
const quiet = () => {}
const syntaxOk = (text) => {
  const dir = makeGame({ 'eslint.config.mjs': text })
  execFileSync(process.execPath, ['--check', join(dir, 'eslint.config.mjs')]) // throws on a syntax error
  return true
}

describe('addRules', () => {
  it('adds the import and one block at the end of a defineConfig([ … ]) list — valid JavaScript', () => {
    const { text } = addRules(STARTER_CONFIG, 'error')
    expect(text).toContain(`import bmuz from './src/lint/rules.mjs' // ${MARK})`)
    expect(text).toContain("'bmuz/no-tuning-numbers': 'error'")
    expect(text.trimEnd().endsWith('  },\n])')).toBe(true)
    expect(syntaxOk(text)).toBe(true)
  })
  it('adds the comma a list without a trailing one needs', () => {
    const { text } = addRules(PLAIN_CONFIG, 'warn')
    expect(text).toContain("{ ignores: ['dist'] },\n  {")
    expect(text).toContain("'bmuz/no-state-in-frame': 'warn'")
    expect(syntaxOk(text)).toBe(true)
  })
  it('puts the comma after the last element, not inside a comment that follows it', () => {
    const commented = PLAIN_CONFIG.replace("{ ignores: ['dist'] }\n", "{ ignores: ['dist'] } // build output\n  // more rules later\n")
    const { text } = addRules(commented, 'error')
    expect(text).toContain("{ ignores: ['dist'] }, // build output\n  // more rules later\n  {")
    expect(syntaxOk(text)).toBe(true)
  })
  it('a // inside a string (a web address) is not a comment', () => {
    const withUrl = PLAIN_CONFIG.replace("{ ignores: ['dist'] }\n", "{ settings: { docs: 'http://example.com' } }\n")
    const { text } = addRules(withUrl, 'error')
    expect(text).toContain("{ settings: { docs: 'http://example.com' } },\n  {")
    expect(syntaxOk(text)).toBe(true)
  })
  it('leaves a config that already has the rules alone', () => {
    const once = addRules(STARTER_CONFIG, 'warn').text
    expect(addRules(once, 'error')).toEqual({ text: once, already: true })
  })
  it('refuses a shape it can\'t edit safely', () => {
    expect(addRules('module.exports = { rules: {} }\n', 'error').refuse).toBeTruthy()
  })
})

describe('installLint', () => {
  // The first count loads ESLint + TypeScript's parser cold (several seconds under check:fast's load) — done once here,
  // with its own time, so each test below times only its own work
  beforeAll(() => countFinds(makeGame({ 'src/a.ts': '' })), 60_000)

  it('a clean game gets the rules as errors, the kit copy and a VERSION', async () => {
    const game = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'src/game/rules.ts': 'export const LINES = [[0, 1, 2]]\nexport const half = 0.5\n' })
    const result = await installLint(game, { log: quiet })
    expect(result.level).toBe('error')
    expect(result.finds).toEqual([])
    expect(existsSync(join(game, 'src/lint/rules.mjs'))).toBe(true)
    expect(existsSync(join(game, 'src/lint/rules.test.mjs'))).toBe(false)
    expect(readFileSync(join(game, 'src/lint/VERSION'), 'utf8')).toMatch(/^\d+\.\d+\.\d+ \(framework /)
    expect(readFileSync(join(game, 'eslint.config.js'), 'utf8')).toContain("'bmuz/no-tuning-numbers': 'error'")
  })
  it('a game with finds gets warnings and the list; module copies and Dev Kit tools are not read', async () => {
    const game = makeGame({
      'eslint.config.js': STARTER_CONFIG,
      'src/game/feel.ts': 'export const POP_DURATION = 0.15\nsetTimeout(go, 2000)\n',
      'src/ui/kit/kit.ts': 'export const KIT_SIZE = 7\n', // a module copy
      'src/devkit-game/tools.ts': 'export const MAX_ACTIONS = 600\n', // a Dev Kit tool
      'src/game/feel.test.ts': 'const T = 9\n',
    })
    const lines = []
    const result = await installLint(game, { log: (line) => lines.push(line) })
    expect(result.level).toBe('warn')
    expect(result.finds.map((f) => `${f.file}:${f.line}`)).toEqual(['src/game/feel.ts:1', 'src/game/feel.ts:2'])
    expect(lines.join('\n')).toMatch(/2 find\(s\)/)
    expect(readFileSync(join(game, 'eslint.config.js'), 'utf8')).toContain("'bmuz/no-tuning-numbers': 'warn'")
  })
  it('a game with content/text/en.json gets the player-text rule, as strict as its own finds allow', async () => {
    const game = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'content/text/en.json': '{}', 'src/ui/Hud.tsx': 'export const Hud = () => <p>Your turn</p>\n' })
    const result = await installLint(game, { log: quiet })
    expect(result.level).toBe('error') // no setting found: the coding rules are errors
    expect(result.textLevel).toBe('warn') // one player word found: that rule starts as a warning
    expect(result.finds.map((f) => f.rule)).toEqual(['bmuz/no-player-text'])
    const config = readFileSync(join(game, 'eslint.config.js'), 'utf8')
    expect(config).toContain("'bmuz/no-tuning-numbers': 'error', 'bmuz/no-player-text': 'warn'")
    expect(syntaxOk(config)).toBe(true)
  })
  it('no content/text/en.json → the player-text rule stays off', async () => {
    const game = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'src/ui/Hud.tsx': 'export const Hud = () => <p>Your turn</p>\n' })
    const result = await installLint(game, { log: quiet })
    expect(result.textLevel).toBe(null)
    expect(result.finds).toEqual([])
    expect(readFileSync(join(game, 'eslint.config.js'), 'utf8')).not.toContain('no-player-text')
  })
  it('a game on the older block (lint 0.1.0) gets the player-text rule added beside its rules, once', async () => {
    const older = addRules(STARTER_CONFIG, 'warn').text // the block lint 0.1.0 wrote: no player-text rule
    const game = makeGame({ 'eslint.config.js': older, 'content/text/en.json': '{}', 'src/a.ts': 'export {}\n' })
    const result = await installLint(game, { log: quiet })
    expect(result.configChanged).toBe(true)
    const config = readFileSync(join(game, 'eslint.config.js'), 'utf8')
    expect(config).toContain("'bmuz/no-tuning-numbers': 'warn', 'bmuz/no-player-text': 'error'") // the old rules keep their 'warn'
    expect(syntaxOk(config)).toBe(true)
    expect((await installLint(game, { log: quiet })).configChanged).toBe(false)
    expect(readFileSync(join(game, 'eslint.config.js'), 'utf8')).toBe(config)
  })
  // F157: the clock rule (lint 0.3.0) — on in every game, as strict as its own finds allow
  it('a game with a stray Date.now() beside a clock option gets the clock rule as a warning, and the list', async () => {
    const game = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'src/game/timer.ts': 'export function left(o: { now: () => number }, end: number) { return end - o.now() }\nexport const age = (t: number) => Date.now() - t\n' })
    const result = await installLint(game, { log: quiet })
    expect(result.level).toBe('error') // no setting found: the coding rules are errors
    expect(result.clockLevel).toBe('warn')
    expect(result.finds.map((f) => `${f.rule} ${f.file}:${f.line}`)).toEqual(['bmuz/own-clock src/game/timer.ts:2'])
    const config = readFileSync(join(game, 'eslint.config.js'), 'utf8')
    expect(config).toContain("'bmuz/own-clock': 'warn'")
    expect(syntaxOk(config)).toBe(true)
  })
  it('a game on the lint 0.2.0 block gets the clock rule added beside its rules, once', async () => {
    const older = addRules(STARTER_CONFIG, 'warn', 'error').text // the block lint 0.2.0 wrote: no clock rule
    const game = makeGame({ 'eslint.config.js': older, 'content/text/en.json': '{}', 'src/a.ts': 'export {}\n' })
    const result = await installLint(game, { log: quiet })
    expect(result.configChanged).toBe(true)
    const config = readFileSync(join(game, 'eslint.config.js'), 'utf8')
    expect(config).toContain("'bmuz/no-tuning-numbers': 'warn', 'bmuz/own-clock': 'error', 'bmuz/no-player-text': 'error'") // old levels kept
    expect(syntaxOk(config)).toBe(true)
    expect((await installLint(game, { log: quiet })).configChanged).toBe(false)
  })
  it('--errors makes them errors even with finds', async () => {
    const game = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'src/a.ts': 'export const SPEED = 3\n' })
    expect((await installLint(game, { errors: true, log: quiet })).level).toBe('error')
  })
  it('an update keeps the game\'s own strictness', async () => {
    const game = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'src/a.ts': 'export const SPEED = 3\n' })
    await installLint(game, { log: quiet })
    const config = readFileSync(join(game, 'eslint.config.js'), 'utf8').replaceAll("'warn'", "'error'") // the game switched
    writeFileSync(join(game, 'eslint.config.js'), config)
    const again = await installLint(game, { log: quiet })
    expect(again.configChanged).toBe(false)
    expect(readFileSync(join(game, 'eslint.config.js'), 'utf8')).toBe(config)
  })
  it('a dry run changes nothing', async () => {
    const game = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'src/a.ts': 'export const A = 0\n' })
    await installLint(game, { dryRun: true, log: quiet })
    expect(existsSync(join(game, 'src/lint'))).toBe(false)
    expect(readFileSync(join(game, 'eslint.config.js'), 'utf8')).toBe(STARTER_CONFIG)
  })
  it('refuses with no eslint config, or a src/lint/ that is the game\'s own', async () => {
    expect((await installLint(makeGame({ 'src/a.ts': '' }), { log: quiet })).refused).toMatch(/no eslint.config/)
    const own = makeGame({ 'eslint.config.js': STARTER_CONFIG, 'src/lint/mine.ts': 'export {}\n' })
    expect((await installLint(own, { log: quiet })).refused).toMatch(/game's own files/)
    expect(readFileSync(join(own, 'eslint.config.js'), 'utf8')).toBe(STARTER_CONFIG)
  })
})
