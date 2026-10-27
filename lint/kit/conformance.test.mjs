// The lint module's promise checks on made-up game files, with a stand-in for check-framework's tester.
import { describe, expect, it } from 'vitest'
import { check, CHECKS, ruleLevels } from './conformance.mjs'

function tester(files) {
  const results = {}
  const t = {
    exists: (path) => path in files,
    read: (path) => files[path],
    scripts: () => JSON.parse(files['package.json'] ?? '{}').scripts ?? {},
    pass: (name) => { results[name] = 'pass' },
    fail: (name) => { results[name] = 'fail' },
    warn: (name) => { results[name] = 'warn' },
    skip: (name) => { results[name] = 'skip' },
  }
  return { t, results }
}
const config = (level) => `import bmuz from './src/lint/rules.mjs' // bmuz lint (F90)\nexport default [{ plugins: { bmuz }, rules: { 'bmuz/no-state-in-frame': '${level}', 'bmuz/no-tuning-numbers': '${level}' } }]\n`
const pkg = JSON.stringify({ scripts: { lint: 'eslint .' } })

describe('ruleLevels', () => {
  it('reads string, array and number levels', () => {
    expect(ruleLevels(`'bmuz/no-state-in-frame': ['warn'], "bmuz/no-tuning-numbers": 2`)).toEqual({ 'bmuz/no-state-in-frame': 'warn', 'bmuz/no-tuning-numbers': 'error', 'bmuz/no-player-text': null })
  })
  it('a rule only in a comment is not on', () => {
    expect(ruleLevels(`// 'bmuz/no-tuning-numbers': 'error'`)['bmuz/no-tuning-numbers']).toBe(null)
  })
})

describe('check', () => {
  it('passes a game with both rules as errors and a lint script', async () => {
    const { t, results } = tester({ 'eslint.config.js': config('error'), 'package.json': pkg })
    await check(t)
    expect(results).toEqual({ [CHECKS.rules]: 'pass', [CHECKS.script]: 'pass', [CHECKS.strict]: 'pass' })
  })
  it('a game with content/text/en.json needs the player-text rule too', async () => {
    const without = tester({ 'eslint.config.js': config('error'), 'package.json': pkg, 'content/text/en.json': '{}' })
    await check(without.t)
    expect(without.results[CHECKS.rules]).toBe('fail')
    const withRule = tester({ 'eslint.config.js': config('error').replace("'bmuz/no-tuning-numbers': 'error'", "'bmuz/no-tuning-numbers': 'error', 'bmuz/no-player-text': 'error'"), 'package.json': pkg, 'content/text/en.json': '{}' })
    await check(withRule.t)
    expect(withRule.results).toEqual({ [CHECKS.rules]: 'pass', [CHECKS.script]: 'pass', [CHECKS.strict]: 'pass' })
  })
  it('warns while the rules are warnings', async () => {
    const { t, results } = tester({ 'eslint.config.js': config('warn'), 'package.json': pkg })
    await check(t)
    expect(results[CHECKS.strict]).toBe('warn')
  })
  it('fails with no import, a rule off, or no lint script', async () => {
    for (const files of [
      { 'eslint.config.js': config('error').replace("import bmuz from './src/lint/rules.mjs'", "import bmuz from 'somewhere'"), 'package.json': pkg },
      { 'eslint.config.js': config('off'), 'package.json': pkg },
      { 'package.json': pkg },
    ]) {
      const { t, results } = tester(files)
      await check(t)
      expect(results[CHECKS.rules]).toBe('fail')
    }
    const { t, results } = tester({ 'eslint.config.js': config('error'), 'package.json': '{}' })
    await check(t)
    expect(results[CHECKS.script]).toBe('fail')
  })
})
