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
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

// Worked out once per run: it starts two git processes, 0.2–2 s each on a busy Windows PC (as version did, F128)
let kitVersionOnce = null
function kitVersion() {
  kitVersionOnce ??= readKitVersion()
  return kitVersionOnce
}

function readKitVersion() {
  const version = readFileSync(join(moduleDir, 'kit', 'VERSION'), 'utf8').trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: moduleDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (execSync('git status --porcelain kit', { cwd: moduleDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

/** The rules' finds in a game's own code today, with the framework's ESLint: [{ file, line, rule, message }]. */
export async function countFinds(gameDir) {
  const require = createRequire(join(moduleDir, '..', 'package.json'))
  const { ESLint } = require('eslint')
  const tseslint = require('typescript-eslint')
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
        rules: { 'bmuz/no-state-in-frame': 'error', 'bmuz/no-tuning-numbers': 'error' },
      },
    ],
  })
  const results = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
  return results.flatMap((r) => r.messages.filter((m) => m.ruleId?.startsWith('bmuz/')).map((m) => ({
    file: relative(resolve(gameDir), r.filePath).replaceAll('\\', '/'), line: m.line, rule: m.ruleId, message: m.message,
  })))
}

/** The game's eslint.config with the rules added at `level`, or { refuse } when its shape isn't one we can edit safely. */
export function addRules(text, level) {
  if (text.includes(MARK)) return { text, already: true }
  const imports = [...text.matchAll(/^import [^\n]*$/gm)]
  // the config list's end: defineConfig([ … ]) / tseslint.config( … ) / export default [ … ] — the last line that closes it
  const end = text.match(/\n(\]\)|\)|\])\s*;?\s*$/)
  if (!imports.length || !end) return { refuse: 'no import lines, or its list doesn\'t end the file with ]) or ]' }
  const lastImport = imports.at(-1)
  const importAt = lastImport.index + lastImport[0].length
  let before = text.slice(importAt, end.index).trimEnd()
  // the list's last real code, past any comment lines after it — a comma added after a `// note` would be inside it
  const lastCode = before.split('\n').map((line) => line.replace(/(^|\s)\/\/.*$/, '')).join('\n').trimEnd().length
  const lastChar = before[lastCode - 1]
  if (lastChar !== ',' && lastChar !== '[' && lastChar !== '(') before = `${before.slice(0, lastCode)},${before.slice(lastCode)}`
  const block = [
    '  {',
    `    // ${MARK}, install-lint): settings live in content/ (the Dev Kit and Obsidian edit them there), and React state`,
    '    // is never set every frame in useFrame. A real constant says why on its line: // tuning-ok: <why>',
    "    files: ['src/**/*.{ts,tsx}'],",
    "    ignores: ['src/devkit-game/**', '**/*.test.*'],",
    '    plugins: { bmuz },',
    `    rules: { 'bmuz/no-state-in-frame': '${level}', 'bmuz/no-tuning-numbers': '${level}' },`,
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
  const finds = await countFinds(game)
  const level = errors || !finds.length ? 'error' : 'warn'
  const added = addRules(config, level)
  if (added.refuse) {
    const refused = `${configFile} can't be edited safely (${added.refuse}) — nothing was installed. Add the import + block by hand (lint/README.md), then run this again.`
    log(`Lint module: ${refused}`)
    return { refused }
  }
  const kitFiles = listFiles(join(moduleDir, 'kit')).filter((f) => !isTest(f) && f !== 'VERSION')
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(moduleDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  const { version, commit } = kitVersion()
  log(`Lint module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  if (added.already) log(`  ${configFile}: already has the rules (how strict they are is the game's call)`)
  else log(`  ${configFile}: ${dryRun ? 'would add' : 'added'} the two rules as ${level === 'error' ? 'errors' : 'warnings'}`)
  if (finds.length) {
    log(`  ${finds.length} find(s) in the game's code today — move each setting to content/, or mark a real constant // tuning-ok: <why>:`)
    finds.slice(0, 20).forEach((f) => log(`    ${f.file}:${f.line} ${f.message}`))
    if (finds.length > 20) log(`    … and ${finds.length - 20} more (npm run lint lists them all)`)
    if (!added.already && level === 'warn') log(`  Once they're gone, switch both rules to 'error' in ${configFile} (or run this again with --errors).`)
  } else log('  0 finds in the game\'s code today')
  if (dryRun) return { changed, removed, level, finds, configChanged: !added.already }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(join(moduleDir, 'kit', f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  if (!added.already) writeFileSync(join(game, configFile), added.text)
  return { changed, removed, level, finds, configChanged: !added.already }
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
