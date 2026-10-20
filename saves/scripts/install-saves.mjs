// INSTALL / UPDATE THE SAVES MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-saves.mjs <game-folder> [--dry-run] [--cloud]
//   --dry-run: only show what would change
//   --cloud:   also give the game the link-code cloud (F96): cloud/worker.ts + cloud/wrangler.json (its own small
//              server on Muzzy's Cloudflare). Once a game has cloud/, every update prints its missing wiring too.
// What it does:
//   - copies kit/ → <game>/src/saves/ (not the tests: they run here, in the framework)
//   - kit/ui/ (the Save code screen, built from UI kit parts) only goes in when the game has the UI kit (src/ui/kit/)
//   - writes a VERSION file (module version + framework commit)
//   - removes files the module no longer ships — only ever inside src/saves/
//   - gives the game, ONCE each (after that they're the game's, never overwritten):
//       content/saves.json            — backups, the "back up your save" nudge, storageAllowed
//       tests/saves/saves.test.ts     — the game's save tests: list its saves there; golden saves go beside it
//       cloud/worker.ts + cloud/wrangler.json — only with --cloud: the link-code server (port 1998 locally)
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
const readText = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

// --- the link-code cloud (F96, --cloud) ---------------------------------------------------------------------------
export const CLOUD_PORT = 1998 // the rooms server is 1999 (kit/cloud.ts CLOUD_PORT says the same)
const CLOUD_WORKER = 'cloud/worker.ts'
const CLOUD_WRANGLER = 'cloud/wrangler.json'

// The game's name for Cloudflare (package.json "name", else the folder) — the cloud is "<name>-saves"
function gameName(gameDir) {
  try {
    const name = JSON.parse(readText(join(gameDir, 'package.json'))).name
    if (typeof name === 'string' && /^[a-z0-9-]+$/.test(name)) return name
  } catch { /* no package.json: use the folder name */ }
  return resolve(gameDir).split(/[\\/]/).filter(Boolean).at(-1).toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

// One SQLite Durable Object (the free plan's kind) of class SaveCloud. Its own wrangler file inside cloud/, so a game
// with the rooms kit keeps its party server separate (a rooms deploy never touches saves, and back).
// Paths in it are relative to cloud/.
export function cloudWranglerConfig(gameDir) {
  return {
    name: `${gameName(gameDir)}-saves`,
    main: 'worker.ts',
    compatibility_date: '2026-09-01',
    durable_objects: { bindings: [{ name: 'SaveCloud', class_name: 'SaveCloud' }] },
    migrations: [{ tag: 'v1', new_sqlite_classes: ['SaveCloud'] }],
    observability: { enabled: true },
    dev: { port: CLOUD_PORT, ip: '0.0.0.0' },
  }
}

// The cloud's wiring, as { done, step } — so only the missing steps are printed (like the rooms installer's)
export function cloudWiringSteps(gameDir) {
  const text = (file) => readText(join(gameDir, file))
  let pkg = {}
  try { pkg = JSON.parse(text('package.json') || '{}') } catch { /* unreadable: every package step shows */ }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const scripts = pkg.scripts ?? {}
  const name = gameName(gameDir)
  const srcFiles = listFiles(join(gameDir, 'src')).filter((f) => !f.startsWith('saves/'))
  const passesCloud = srcFiles.some((f) => /\.(ts|tsx)$/.test(f) && /cloudAddress\(/.test(text(`src/${f}`)))
  return [
    { done: Boolean(deps.wrangler), step: 'Package: npm install -D wrangler' },
    {
      done: /wrangler dev\b.*cloud[\\/]wrangler\.json/.test(scripts['cloud:dev'] ?? '') && /wrangler deploy\b.*cloud[\\/]wrangler\.json/.test(scripts['cloud:deploy'] ?? ''),
      step: 'package.json "scripts": "cloud:dev": "wrangler dev -c cloud/wrangler.json", "cloud:deploy": "wrangler deploy -c cloud/wrangler.json"',
    },
    {
      done: /(^|\n)\s*\/?\.wrangler\/?\s*(\n|$)/.test(text('.gitignore')),
      step: '.gitignore: add the line   .wrangler/   (wrangler\'s local dev state)',
    },
    {
      done: passesCloud,
      step: `The Save code screen: pass the cloud —   import { cloudAddress } from '../saves'   then
       <SaveCodePanel … cloud={{ url: cloudAddress(import.meta.env.VITE_SAVES_CLOUD) }} />   (no cloud set + not on this PC / the Wi-Fi = no Link code part)`,
    },
    // Always shown: how to run it, and the live step (can't be checked from here)
    { done: false, step: `Try it: npm run cloud:dev (port ${CLOUD_PORT}) + npm run dev → Settings → Save code → Make a link code.` },
    {
      done: false,
      step: `Going live (Muzzy's call — a public server that keeps players' saves for content/saves.json cloud.keepDays):
       once per machine   npx wrangler login   (Muzzy's Cloudflare), then   npm run cloud:deploy → https://${name}-saves.joebrogno.workers.dev,
       then build the game with VITE_SAVES_CLOUD=${name}-saves.joebrogno.workers.dev (GitHub Actions: env on the build step).
       Deploy the cloud again whenever cloud/, src/saves/cloudRoutes.ts or content/saves.json "cloud" changes.`,
    },
  ]
}

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

export function installSaves(gameDir, { dryRun = false, cloud = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  // A src/saves/ with files but no VERSION isn't ours (the game's own save code): never touch it.
  if (listFiles(target).length && !existsSync(join(target, 'VERSION'))) {
    const refused = `${KIT_TARGET}/ already holds the game's own files (no VERSION, so not this module's) — nothing was installed or removed. Rename that folder (e.g. src/save/), then run the installer again.`
    log(`Saves module: ${refused}`)
    return { refused, changed: [], removed: [], starter: [] }
  }
  const hasUiKit = existsSync(join(game, 'src/ui/kit/VERSION'))
  const kitFiles = listFiles(join(savesDir, 'kit'))
    .filter((f) => !isTest(f) && f !== 'VERSION')
    .filter((f) => hasUiKit || !f.startsWith(UI_FOLDER))
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(savesDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  const wantsCloud = cloud || existsSync(join(game, CLOUD_WORKER))
  const starter = [...STARTERS, ...(wantsCloud ? [CLOUD_WORKER, CLOUD_WRANGLER] : [])].filter((f) => !existsSync(join(game, f)))
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
    if (f === CLOUD_WRANGLER) writeFileSync(join(game, f), JSON.stringify(cloudWranglerConfig(game), null, 2) + '\n')
    else copyFileSync(join(savesDir, 'templates', f), join(game, f))
  }
  if (starter.includes('tests/saves/saves.test.ts')) log('  Next: list each createSave in tests/saves/saves.test.ts, and put a golden save per version beside it (README: Golden saves)')
  if (wantsCloud) {
    log('  The link-code cloud (cloud/) still needs:')
    cloudWiringSteps(game).filter((w) => !w.done).forEach((w, i) => log(`  ${i + 1}. ${w.step}`))
  }
  { const step = checkFrameworkStep(gameDir); if (step) log(`  Also: ${step}`) }
  return { changed, removed, starter }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  if (!gameDir) {
    console.log('Usage: node scripts/install-saves.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  const result = installSaves(gameDir, { dryRun: process.argv.includes('--dry-run'), cloud: process.argv.includes('--cloud') })
  if (result.refused) process.exit(1)
}
