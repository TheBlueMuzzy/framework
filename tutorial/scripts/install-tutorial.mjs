// INSTALL / UPDATE THE TUTORIAL MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-tutorial.mjs <game-folder> [--dry-run]
//   (or the safe way, with the module's own checks first: node ~/.claude/config/bmuz/scripts/install-module.mjs tutorial <game>)
//   --dry-run: only show what would change
// What it does:
//   - copies kit/ → <game>/src/tutorial/ (not the tests: they run here, in the framework) + a VERSION file
//   - removes files the module no longer ships — only ever inside src/tutorial/
//   - never touches the game's own files: its lesson files (content/lessons/), its connector (the LessonGame), its look
// What the game wires by hand is in the README ("Wiring it into a game").
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { kitVersion } from '../../scripts/kitVersion.mjs'

const moduleDir = join(dirname(fileURLToPath(import.meta.url)), '..')
export const KIT_TARGET = 'src/tutorial'
const isTest = (path) => /\.test\./.test(path)

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

export function installTutorial(gameDir, { dryRun = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  // A src/tutorial/ with files but no VERSION isn't ours (the game's own tutorial code): never touch it.
  if (listFiles(target).length && !existsSync(join(target, 'VERSION'))) {
    const refused = `${KIT_TARGET}/ already holds the game's own files (no VERSION, so not this module's) — nothing was installed or removed. Rename that folder (e.g. src/teach/), then run the installer again.`
    log(`Tutorial module: ${refused}`)
    return { refused, changed: [], removed: [] }
  }
  const kitFiles = listFiles(join(moduleDir, 'kit')).filter((f) => !isTest(f) && f !== 'VERSION')
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(moduleDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  const { version, commit } = kitVersion(moduleDir, { watch: ['kit'] })
  log(`Tutorial module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  if (dryRun) return { changed, removed }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(join(moduleDir, 'kit', f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  if (!present.length) {
    log(`  Next (first install): import from './${KIT_TARGET.split('/').pop()}' — createLessonRunner({ game, clock: rulesClock, timing }),`)
    log('  your lessons in content/lessons/<id>.json, your look from the UI kit (Callout). README: "Wiring it into a game".')
  }
  return { changed, removed }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  const unknown = process.argv.slice(3).filter((a) => a !== '--dry-run')
  if (!gameDir || gameDir.startsWith('-') || unknown.length) {
    if (unknown.length) console.log(`Unknown: ${unknown.join(' ')}`)
    console.log('Usage: node scripts/install-tutorial.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  const result = installTutorial(gameDir, { dryRun: process.argv.includes('--dry-run') })
  if (result.refused) process.exit(1)
}
