// INSTALL / UPDATE THE SAVES MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-saves.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does:
//   - copies kit/ → <game>/src/saves/ (not the tests: they run here, in the framework)
//   - kit/ui/ (the Save code screen, built from UI kit parts) only goes in when the game has the UI kit (src/ui/kit/)
//   - writes a VERSION file (module version + framework commit)
//   - removes files the module no longer ships — only ever inside src/saves/
//   - gives the game, ONCE each (after that they're the game's, never overwritten):
//       content/saves.json            — backups, the "back up your save" nudge, storageAllowed
//       tests/saves/saves.test.ts     — the game's save tests: list its saves there; golden saves go beside it
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// npm run check:framework (the Dev Kit's runner, src/devkit/check-framework.mjs) runs this module's own promise checks
// (kit/conformance.mjs) — asked for here while the game's package.json doesn't have the script yet
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too, and says what to wire where)'
}

const savesDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT_TARGET = 'src/saves'
const STARTERS = ['content/saves.json', 'tests/saves/saves.test.ts']
const UI_FOLDER = 'ui/'
const isTest = (path) => /\.test\./.test(path)

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

function kitVersion() {
  const version = readFileSync(join(savesDir, 'kit', 'VERSION'), 'utf8').trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: savesDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (execSync('git status --porcelain kit', { cwd: savesDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

export function installSaves(gameDir, { dryRun = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  const hasUiKit = existsSync(join(game, 'src/ui/kit/VERSION'))
  const kitFiles = listFiles(join(savesDir, 'kit'))
    .filter((f) => !isTest(f) && f !== 'VERSION')
    .filter((f) => hasUiKit || !f.startsWith(UI_FOLDER))
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(savesDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  const starter = STARTERS.filter((f) => !existsSync(join(game, f)))
  const { version, commit } = kitVersion()
  log(`Saves module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  if (!hasUiKit) log(`  skipped ${UI_FOLDER} (the Save code screen — the game has no UI kit; use saveCode.ts directly)`)
  starter.forEach((f) => log(`  starter ${f} (yours from now on — the installer never overwrites it)`))
  if (dryRun) return { changed, removed, starter }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(join(savesDir, 'kit', f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  if (removed.some((f) => f.startsWith(UI_FOLDER)) && !listFiles(join(target, 'ui')).length) rmSync(join(target, 'ui'), { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  for (const f of starter) {
    mkdirSync(dirname(join(game, f)), { recursive: true })
    copyFileSync(join(savesDir, 'templates', f), join(game, f))
  }
  if (starter.includes('tests/saves/saves.test.ts')) log('  Next: list each createSave in tests/saves/saves.test.ts, and put a golden save per version beside it (README: Golden saves)')
  { const step = checkFrameworkStep(gameDir); if (step) log(`  Also: ${step}`) }
  return { changed, removed, starter }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  if (!gameDir) {
    console.log('Usage: node scripts/install-saves.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  installSaves(gameDir, { dryRun: process.argv.includes('--dry-run') })
}
