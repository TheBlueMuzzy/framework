// INSTALL / UPDATE THE AUDIO MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-audio.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does:
//   - copies kit/ → <game>/src/audio/ (not the tests: they run here, in the framework)
//   - writes a VERSION file (module version + framework commit)
//   - removes files the module no longer ships — only ever inside src/audio/
//   - gives the game a starter content/audio.json ONCE (if it has none). After that the game owns it: never overwritten.
//   - adds "audio:check" to package.json's scripts (0.4.0) — only when missing, so a re-run changes nothing
//     (npm run audio:check = the loudness report, kit/audio-check.mjs)
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

export const AUDIO_CHECK_SCRIPT = 'node src/audio/audio-check.mjs'

// "audio:check" in the game's package.json — added when missing (a game's own different one is left alone).
// Returns true when it was (or, in a dry run, would be) added.
export function addAudioCheckScript(gameDir, { dryRun = false } = {}) {
  const pkgPath = join(gameDir, 'package.json')
  if (!existsSync(pkgPath)) return false
  const text = readFileSync(pkgPath, 'utf8')
  let pkg
  try { pkg = JSON.parse(text) } catch { return false } // unreadable: the game fixes it first
  if (pkg.scripts?.['audio:check'] !== undefined) return false
  pkg.scripts = { ...pkg.scripts, 'audio:check': AUDIO_CHECK_SCRIPT }
  const indent = text.match(/^[ \t]+(?=")/m)?.[0] ?? '  '
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  if (!dryRun) writeFileSync(pkgPath, JSON.stringify(pkg, null, indent).replaceAll('\n', eol) + eol)
  return true
}

const audioDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT_TARGET = 'src/audio'
const STARTER_CONTENT = 'content/audio.json'
const isTest = (path) => /\.test\./.test(path)

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

// Worked out once per run: it starts two git processes, which take 0.2–2 s each on a busy Windows PC (F128, as saves
// 0.6.2 did in F125: the install tests call installAudio many times, and under check:fast those git runs were most of the test's time).
// The kit's commit can't change while one install runs, so asking again only costs time.
let kitVersionOnce = null
function kitVersion() {
  kitVersionOnce ??= readKitVersion()
  return kitVersionOnce
}

function readKitVersion() {
  const version = readFileSync(join(audioDir, 'kit', 'VERSION'), 'utf8').trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: audioDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (execSync('git status --porcelain kit', { cwd: audioDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

export function installAudio(gameDir, { dryRun = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  const kitFiles = listFiles(join(audioDir, 'kit')).filter((f) => !isTest(f) && f !== 'VERSION')
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(audioDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  const starter = existsSync(join(game, STARTER_CONTENT)) ? [] : [STARTER_CONTENT]
  const { version, commit } = kitVersion()
  log(`Audio module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  starter.forEach((f) => log(`  starter ${f} (yours from now on — the installer never overwrites it)`))
  const script = addAudioCheckScript(game, { dryRun }) ? ['package.json "audio:check" script'] : []
  script.forEach((s) => log(`  ${dryRun ? 'would add' : 'add     '} ${s} (npm run audio:check: is every sound as loud as the others?)`))
  if (dryRun) return { changed, removed, starter, script }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(join(audioDir, 'kit', f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  for (const f of starter) {
    mkdirSync(dirname(join(game, f)), { recursive: true })
    copyFileSync(join(audioDir, 'templates', f), join(game, f))
  }
  { const step = checkFrameworkStep(gameDir); if (step) log(`  Also: ${step}`) }
  return { changed, removed, starter, script }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  if (!gameDir) {
    console.log('Usage: node scripts/install-audio.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  installAudio(gameDir, { dryRun: process.argv.includes('--dry-run') })
}
