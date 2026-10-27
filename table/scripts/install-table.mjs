// INSTALL / UPDATE THE TABLE MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-table.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does: copies kit/ → <game>/src/table/ (not the tests: they run here, in the framework), writes a VERSION
// file (module version + framework commit), and removes files the module no longer ships — only ever inside src/table/.
// The game then writes its own rules against src/table/core.ts (e.g. src/engine/rules.ts) and runs selfTest in its tests.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { kitVersion } from '../../scripts/kitVersion.mjs'

// npm run check:framework (the Dev Kit's runner, src/devkit/check-framework.mjs) runs this module's own promise checks
// (kit/conformance.mjs) — asked for here while the game's package.json doesn't have the script yet
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too, and says what to wire where)'
}

const tableDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT_TARGET = 'src/table'
const isTest = (path) => /\.test\./.test(path)

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

export function installTable(gameDir, { dryRun = false, log = console.log } = {}) {
  const target = join(resolve(gameDir), KIT_TARGET)
  const kitFiles = listFiles(join(tableDir, 'kit')).filter((f) => !isTest(f) && f !== 'VERSION')
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(tableDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  // kit/VERSION + the commit, " + uncommitted changes" when kit has edits (git is asked once per run)
  const { version, commit } = kitVersion(tableDir, { watch: ['kit'] })
  log(`Table module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  if (dryRun) return { changed, removed }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(join(tableDir, 'kit', f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  { const step = checkFrameworkStep(gameDir); if (step) log(`  Also: ${step}`) }
  return { changed, removed }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  if (!gameDir) {
    console.log('Usage: node scripts/install-table.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  installTable(gameDir, { dryRun: process.argv.includes('--dry-run') })
}
