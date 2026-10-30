// INSTALL / UPDATE THE LINT MODULE IN A GAME — plain Node; it borrows the framework's own ESLint to count finds.
// Usage: node scripts/install-lint.mjs <game-folder> [--dry-run] [--errors]
//   (or the safe way, with the module's own checks first: node ~/.claude/config/bmuz/scripts/install-module.mjs lint <game>)
// What it does:
//   - copies kit/ → <game>/src/lint/ (not the tests: they run here, in the framework) + a VERSION file
//   - the first time: adds the two rules to the game's eslint.config — an import line and one block at the end of
//     its list. How strict depends on today's code: no finds → errors (a new game stays clean from day one); finds →
//     warnings (an older game's checks don't go red overnight), with the count, so the game cleans up in its own time
//     and then switches them to 'error'. --errors makes them errors anyway.
//   - an update leaves that block alone (how strict is the game's call) and only says how many finds are left
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { kitVersion } from '../../scripts/kitVersion.mjs'

const moduleDir = join(dirname(fileURLToPath(import.meta.url)), '..')
export const KIT_TARGET = 'src/lint'
const ESLINT_CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts', 'eslint.config.mts']
// what the rules don't read: framework module copies (linted in the framework), the Dev Kit's game tools, tests
const NOT_GAME_CODE = ['src/table', 'src/devkit', 'src/ui/kit', 'src/version', 'src/saves', 'src/crashes', 'src/audio', 'src/ai/kit', 'src/emotes', 'src/rooms', 'src/lint', 'src/devkit-game']
export const MARK = 'bmuz lint (F90'
const isTest = (path) => /\.test\./.test(path)

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : listFiles(path, base)
    return [relative(base, path).replaceAll('\\', '/')]
  })
}

/** The rules' finds in a game's own code today, with the framework's ESLint: [{ file, line, rule, message }]. */
export async function countFinds(gameDir, { playerText = keepsWordsInContent(gameDir) } = {}) {
  // the game's own ESLint first (a game with a lint has it), else the framework's — GitHub's starter job installs the
  // game's packages but not the framework root's
  const load = (name) => {
    for (const base of [resolve(gameDir), join(moduleDir, '..')]) {
      try { return createRequire(join(base, 'package.json'))(name) } catch { /* not installed there */ }
    }
    throw new Error(`${name} isn't installed in the game or the framework — run npm install in the game`)
  }
  const { ESLint } = load('eslint')
  const tseslint = load('typescript-eslint')
  const { default: bmuz } = await import(pathToFileURL(join(moduleDir, 'kit', 'rules.mjs')).href)
  const eslint = new ESLint({
    cwd: resolve(gameDir),
    overrideConfigFile: true,
    errorOnUnmatchedPattern: false,
    overrideConfig: [
      { ignores: ['**/node_modules/**', '**/dist/**', ...NOT_GAME_CODE.map((f) => `${f}/**`), '**/*.test.*', '**/*.d.ts'] },
      {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
        plugins: { bmuz },
        rules: { 'bmuz/no-state-in-frame': 'error', 'bmuz/no-tuning-numbers': 'error', 'bmuz/own-clock': 'error', ...(playerText ? { 'bmuz/no-player-text': 'error' } : {}) },
      },
    ],
  })
  const results = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
  return results.flatMap((r) => r.messages.filter((m) => m.ruleId?.startsWith('bmuz/')).map((m) => ({
    file: relative(resolve(gameDir), r.filePath).replaceAll('\\', '/'), line: m.line, rule: m.ruleId, message: m.message,
  })))
}

/** A game keeps its words in content/text/en.json → the player-text rule is on for it (F91). */
export const keepsWordsInContent = (gameDir) => existsSync(join(resolve(gameDir), 'content', 'text', 'en.json'))

const TUNING_RULE = /('bmuz\/no-tuning-numbers'\s*:\s*(?:\[\s*)?'(?:error|warn|off)'(?:\s*\])?)/

/**
 * The game's eslint.config with the rules added, or { refuse } when its shape isn't one we can edit safely.
 * level: the two F90 rules · textLevel: the player-text rule (F91), null = not on (no content/text/en.json) ·
 * clockLevel: the clock rule (F157), null = not on.
 * A config that already has the block keeps it as it is (how strict is the game's call) — except that a rule new to the
 * game is added beside the tuning rule: { already: true, textAdded / clockAdded: true }.
 */
export function addRules(text, level, textLevel = null, clockLevel = null) {
  if (text.includes(MARK)) {
    const missing = [
      ...(textLevel && !text.includes("'bmuz/no-player-text'") ? [['text', 'no-player-text', textLevel]] : []),
      ...(clockLevel && !text.includes("'bmuz/own-clock'") ? [['clock', 'own-clock', clockLevel]] : []),
    ]
    if (!missing.length) return { text, already: true }
    if (!TUNING_RULE.test(text)) return { text, already: true, refuseNew: missing.map(([, rule]) => `bmuz/${rule}`), textRefuse: "its lint block has no 'bmuz/no-tuning-numbers' line to add the new rules beside" }
    const added = missing.map(([, rule, ruleLevel]) => `'bmuz/${rule}': '${ruleLevel}'`).join(', ')
    return { text: text.replace(TUNING_RULE, `$1, ${added}`), already: true, ...Object.fromEntries(missing.map(([kind]) => [`${kind}Added`, true])) }
  }
  const imports = [...text.matchAll(/^import [^\n]*$/gm)]
  // the config list's end: defineConfig([ … ]) / tseslint.config( … ) / export default [ … ] — the last line that closes it
  const end = text.match(/\n(\]\)|\)|\])\s*;?\s*$/)
  if (!imports.length || !end) return { refuse: 'no import lines, or its list doesn\'t end the file with ]) or ]' }
  const lastImport = imports.at(-1)
  const importAt = lastImport.index + lastImport[0].length
  let before = text.slice(importAt, end.index).trimEnd()
  // the list's last real code, past any comment lines after it — a comma added after a `// note` would be inside it.
  // Comments become spaces of the same length, so the position found is a position in `before` itself (F165: removing
  // them shifted it back by an earlier line's comment, and the comma landed inside a word: re,actRefresh)
  const blanked = before.split('\n').map((line) => line.replace(/(^|\s)\/\/.*$/, (comment, space) => space + ' '.repeat(comment.length - space.length)))
  const lastCode = blanked.join('\n').trimEnd().length
  const lastChar = before[lastCode - 1]
  if (lastChar !== ',' && lastChar !== '[' && lastChar !== '(') before = `${before.slice(0, lastCode)},${before.slice(lastCode)}`
  const block = [
    '  {',
    `    // ${MARK}, install-lint): settings live in content/ (the Dev Kit and Obsidian edit them there), and React state`,
    '    // is never set every frame in useFrame. A real constant says why on its line: // tuning-ok: <why>',
    ...(textLevel ? ['    // Player words live in content/text/en.json; anything else says why: // text-ok: <why>'] : []),
    ...(clockLevel ? ['    // Code that takes a clock option (now) uses it, never Date.now() beside it: // clock-ok: <why>'] : []),
    "    files: ['src/**/*.{ts,tsx}'],",
    "    ignores: ['src/devkit-game/**', '**/*.test.*'],",
    '    plugins: { bmuz },',
    `    rules: { 'bmuz/no-state-in-frame': '${level}', 'bmuz/no-tuning-numbers': '${level}'${textLevel ? `, 'bmuz/no-player-text': '${textLevel}'` : ''}${clockLevel ? `, 'bmuz/own-clock': '${clockLevel}'` : ''} },`,
    '  },',
  ].join('\n')
  const out = `${text.slice(0, importAt)}\nimport bmuz from './src/lint/rules.mjs' // ${MARK})${before}\n${block}${text.slice(end.index)}`
  return { text: out, already: false }
}

export async function installLint(gameDir, { dryRun = false, errors = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  if (listFiles(target).length && !existsSync(join(target, 'VERSION'))) {
    const refused = `${KIT_TARGET}/ already holds the game's own files (no VERSION, so not this module's) — nothing was installed. Move them, then run the installer again.`
    log(`Lint module: ${refused}`)
    return { refused }
  }
  const configFile = ESLINT_CONFIGS.find((f) => existsSync(join(game, f)))
  if (!configFile) {
    const refused = 'the game has no eslint.config.js — the rules live in its lint, so there\'s nowhere to add them (a starter has one)'
    log(`Lint module: ${refused}`)
    return { refused }
  }
  const config = readFileSync(join(game, configFile), 'utf8')
  const playerText = keepsWordsInContent(game)
  const finds = await countFinds(game, { playerText })
  // each rule as strict as the game's code allows today: errors when it has no finds, else warnings
  const textFinds = finds.filter((f) => f.rule === 'bmuz/no-player-text')
  const clockFinds = finds.filter((f) => f.rule === 'bmuz/own-clock') // F157: always on — any game can take a clock
  const level = errors || finds.length === textFinds.length + clockFinds.length ? 'error' : 'warn'
  const textLevel = !playerText ? null : errors || !textFinds.length ? 'error' : 'warn'
  const clockLevel = errors || !clockFinds.length ? 'error' : 'warn'
  const added = addRules(config, level, textLevel, clockLevel)
  if (added.refuse) {
    const refused = `${configFile} can't be edited safely (${added.refuse}) — nothing was installed. Add the import + block by hand (lint/README.md), then run this again.`
    log(`Lint module: ${refused}`)
    return { refused }
  }
  const kitFiles = listFiles(join(moduleDir, 'kit')).filter((f) => !isTest(f) && f !== 'VERSION')
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(moduleDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  // kit/VERSION + the commit, " + uncommitted changes" when kit has edits (git is asked once per run)
  const { version, commit } = kitVersion(moduleDir, { watch: ['kit'] })
  log(`Lint module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  const plural = (level) => (level === 'error' ? 'errors' : 'warnings')
  if (added.already) log(`  ${configFile}: already has the rules (how strict they are is the game's call)`)
  else log(`  ${configFile}: ${dryRun ? 'would add' : 'added'} the coding rules as ${plural(level)}${textLevel ? `, the player-text rule as ${plural(textLevel)}` : ''}, the clock rule as ${plural(clockLevel)}`)
  if (added.textAdded) log(`  ${configFile}: ${dryRun ? 'would add' : 'added'} the new player-text rule as ${plural(textLevel)} (words a player reads live in content/text/en.json)`)
  if (added.clockAdded) log(`  ${configFile}: ${dryRun ? 'would add' : 'added'} the new clock rule as ${plural(clockLevel)} (code that takes a clock option never reads Date.now() beside it)`)
  if (added.textRefuse) log(`  ${configFile}: ${added.refuseNew.join(' and ')} weren't added — ${added.textRefuse}. Add them as 'warn' to the block's rules by hand.`)
  if (!playerText) log('  no content/text/en.json — the player-text rule stays off (the externalize-text skill moves a game\'s words there)')
  if (finds.length) {
    log(`  ${finds.length} find(s) in the game's code today — a setting goes to content/ (or // tuning-ok: <why>), player words to content/text/en.json (or // text-ok: <why>), a stray Date.now() uses the clock option (or // clock-ok: <why>):`)
    finds.slice(0, 20).forEach((f) => log(`    ${f.file}:${f.line} ${f.message}`))
    if (finds.length > 20) log(`    … and ${finds.length - 20} more (npm run lint lists them all)`)
    if (!added.already && (level === 'warn' || textLevel === 'warn' || clockLevel === 'warn')) log(`  Once they're gone, switch the warnings to 'error' in ${configFile} (or run this again with --errors).`)
  } else log('  0 finds in the game\'s code today')
  const configChanged = !added.already || !!added.textAdded || !!added.clockAdded
  if (dryRun) return { changed, removed, level, textLevel, clockLevel, finds, configChanged }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(join(moduleDir, 'kit', f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  if (configChanged) writeFileSync(join(game, configFile), added.text)
  return { changed, removed, level, textLevel, clockLevel, finds, configChanged }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  const unknown = process.argv.slice(3).filter((a) => a !== '--dry-run' && a !== '--errors')
  if (!gameDir || gameDir.startsWith('-') || unknown.length) {
    if (unknown.length) console.log(`Unknown: ${unknown.join(' ')}`)
    console.log('Usage: node scripts/install-lint.mjs <game-folder> [--dry-run] [--errors]')
    process.exit(1)
  }
  const result = await installLint(gameDir, { dryRun: process.argv.includes('--dry-run'), errors: process.argv.includes('--errors') })
  if (result.refused) process.exit(1)
}
