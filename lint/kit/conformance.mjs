// THE LINT MODULE'S PROMISE CHECKS — run by the Dev Kit's check-framework.mjs (npm run check:framework).
// The promise: the game's own lint holds the two coding rules, so every quick check refuses a setting written into the
// code and React state set every frame. What the game must provide:
//   - eslint.config imports ./src/lint/rules.mjs and switches both rules on (install-lint adds it)
//   - a "lint" script in package.json (the quick check runs it)
//   - the rules as errors once the game is clean — warnings are a game's way in, said here until they're switched
// (The finds themselves are the lint's job: npm run lint lists them.)

export const title = 'Lint'

export const CHECKS = {
  rules: 'the game\'s lint has the two coding rules (bmuz/no-state-in-frame, bmuz/no-tuning-numbers)',
  script: 'the game\'s checks run its lint (a "lint" script)',
  strict: 'the coding rules are errors, not warnings',
}

const ESLINT_CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts', 'eslint.config.mts']
const RULES = ['bmuz/no-state-in-frame', 'bmuz/no-tuning-numbers']
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1')

/** How strict each rule is in a config's text: { 'bmuz/no-tuning-numbers': 'error' | 'warn' | 'off' | null } */
export function ruleLevels(text) {
  const code = withoutComments(text)
  return Object.fromEntries(RULES.map((rule) => {
    const found = code.match(new RegExp(`['"]${rule}['"]\\s*:\\s*(?:\\[\\s*)?(['"]?)(error|warn|off|0|1|2)\\1`))
    const level = found ? { 0: 'off', 1: 'warn', 2: 'error' }[found[2]] ?? found[2] : null
    return [rule, level]
  }))
}

export async function check(t) {
  const config = ESLINT_CONFIGS.find((f) => t.exists(f))
  const text = config ? t.read(config) : ''
  const imports = /from\s*['"]\.\/src\/lint\/rules\.mjs['"]/.test(withoutComments(text))
  const levels = ruleLevels(text)
  const missing = RULES.filter((rule) => !levels[rule] || levels[rule] === 'off')
  {
    const name = CHECKS.rules
    const problems = []
    if (!config) problems.push('The game has no eslint.config.js.')
    else {
      if (!imports) problems.push(`${config} doesn't import ./src/lint/rules.mjs.`)
      if (missing.length) problems.push(`${config} doesn't switch on ${missing.join(' and ')}.`)
    }
    if (problems.length) t.fail(name, problems, 'Run the installer again: node ~/.claude/config/bmuz/scripts/install-module.mjs lint . (it adds the import and the rules block).')
    else t.pass(name, `${config}: ${RULES.map((rule) => `${rule.slice(5)} ${levels[rule]}`).join(' · ')}`)
  }
  {
    const name = CHECKS.script
    const lint = t.scripts().lint
    if (!lint) t.fail(name, ['package.json has no "lint" script, so nothing runs the rules.'], 'package.json "scripts": "lint": "eslint ." (the quick check, check-all.mjs, runs it).')
    else t.pass(name, `"lint": "${lint}"`)
  }
  {
    const name = CHECKS.strict
    const warned = RULES.filter((rule) => levels[rule] === 'warn')
    if (!config || missing.length) t.skip(name, 'the rules aren\'t on yet (above)')
    else if (warned.length) t.warn(name, [`${warned.join(' and ')} ${warned.length > 1 ? 'are' : 'is'} still a warning — a find doesn't stop the checks.`], `Move each find's setting to content/ (or mark a real constant // tuning-ok: <why>), then switch to 'error' in ${config}.`)
    else t.pass(name, 'both errors')
  }
}
