// INSTALL / UPDATE THE VERSION MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-version.mjs <game-folder> [--dry-run]
//   (or the safe way, with the module's own checks first: node ~/.claude/config/bmuz/scripts/install-module.mjs version <game>)
// What it does:
//   - copies kit/ → <game>/src/version/ (not the tests: they run here, in the framework)
//   - writes a VERSION file (module version + framework commit)
//   - removes files the module no longer ships — only ever inside src/version/
//   - gives the game a version.json ONCE, if it has none: { "version": "0.1.0", "build": 0 } (/save bumps the build)
//   - prints the wiring still missing (vite.config, main menu, Settings, Dev Kit adapter, an e2e check) — only the
//     steps not done yet, so an update on a wired game prints nothing to do
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { kitVersion } from '../../scripts/kitVersion.mjs'
import { adapterFile } from '../../devkit/kit/check-framework.mjs'
import { adapterVersion, E2E_DIRS, E2E_EXTS, READS_VERSION_FILE, versionProps, withoutComments } from '../kit/conformance.mjs'

const moduleDir = join(dirname(fileURLToPath(import.meta.url)), '..')
export const KIT_TARGET = 'src/version'
export const STARTER_VERSION = { version: '0.1.0', build: 0, history: [] }
const isTest = (path) => /\.test\./.test(path)
const readText = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : listFiles(path, base)
    return [relative(base, path).replaceAll('\\', '/')]
  })
}

// npm run check:framework (the Dev Kit's runner) runs this module's promise checks too
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too)'
}

/** The wiring, as { done, step } — only the missing steps are printed. */
export function wiringSteps(gameDir) {
  const game = resolve(gameDir)
  const text = (file) => readText(join(game, file))
  const src = listFiles(join(game, 'src'))
    .filter((f) => /\.(m?[jt]sx?)$/.test(f) && !f.startsWith('version/') && !/\.(test|spec)\./.test(f))
    .map((f) => ({ path: `src/${f}`, text: text(`src/${f}`) }))
  const gameCode = src.filter((f) => !/^src\/(devkit|devkit-game|ui\/kit|audio|table|ai\/kit|rooms|saves)\//.test(f.path))
  const hasUiKit = existsSync(join(game, 'src/ui/kit/VERSION'))
  const hasDevKit = existsSync(join(game, 'src/devkit/VERSION'))
  const config = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'].find((f) => existsSync(join(game, f))) ?? 'vite.config.ts'
  const passesLabel = (tag) => {
    const uses = versionProps(gameCode, tag)
    return uses.length > 0 && uses.every((u) => /\bversionLabel\b/.test(u.value ?? ''))
  }
  const adapter = hasDevKit ? adapterFile(game) : null // the one registerDevKitGame names — not every file with a version: key
  const e2e = E2E_DIRS.flatMap((dir) => listFiles(join(game, dir)).filter((f) => E2E_EXTS.test(f)).map((f) => `${dir}/${f}`))
  const ownReads = [...gameCode, ...src.filter((f) => f.path.startsWith('src/devkit-game/'))]
    .filter((f) => READS_VERSION_FILE.test(withoutComments(f.text))).map((f) => f.path)
  const steps = [
    {
      done: /\bversionPlugin\s*\(/.test(withoutComments(text(config))),
      step: `${config}: import { versionPlugin } from './src/version/vitePlugin.mjs'   and add versionPlugin() to plugins: [ … ]
       (bakes version.json in as import.meta.env.APP_VERSION and puts <meta name="app-version" content="vX.Y.Z.B"> in the page)`,
    },
    hasUiKit
      ? { done: passesLabel('MainMenu'), step: 'The main-menu footer: import { versionLabel } from \'../version\'   then   <MainMenu version={versionLabel} …>' }
      : { done: gameCode.some((f) => /\bversionLabel\b/.test(f.text)), step: 'Show versionLabel (import { versionLabel } from \'../version\') on the main menu and in Settings' },
    ...(hasUiKit ? [{ done: passesLabel('Settings'), step: 'The bottom of every Settings tab: <Settings version={versionLabel} …> (UI kit 0.24.0+; an About → Version row fills itself from it too)' }] : []),
    ...(hasDevKit ? [{
      done: !!adapter && adapterVersion(text(adapter)).ok,
      step: 'The Dev Kit adapter (src/devkit-game/<game>Adapter.ts): import { versionLabel } from \'../version\'   then   version: versionLabel,   (snapshots + bug files)',
    }] : []),
    {
      done: !ownReads.length,
      step: `Stop reading version.json yourself — use versionLabel instead (one format everywhere): ${ownReads.join(', ')}`,
    },
    {
      done: e2e.some((f) => /\bcheckVersion\s*\(/.test(withoutComments(text(f)))),
      step: 'An e2e script: import { checkVersion } from \'../src/version/e2e.mjs\'   then, after page.goto(…):   await checkVersion(page)   (refuses a stale build or a cached service worker)',
    },
  ]
  return steps
}

export function installVersion(gameDir, { dryRun = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  // A src/version/ with files but no VERSION isn't ours (the game's own code): never touch it.
  if (listFiles(target).length && !existsSync(join(target, 'VERSION'))) {
    const refused = `${KIT_TARGET}/ already holds the game's own files (no VERSION, so not this module's) — nothing was installed or removed. Move them (e.g. into src/appVersion/), then run the installer again.`
    log(`Version module: ${refused}`)
    return { refused, changed: [], removed: [], starter: [] }
  }
  const kitFiles = listFiles(join(moduleDir, 'kit')).filter((f) => !isTest(f) && f !== 'VERSION')
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = kitFiles.filter((f) => !present.includes(f) || !readFileSync(join(moduleDir, 'kit', f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !kitFiles.includes(f))
  const starter = existsSync(join(game, 'version.json')) ? [] : ['version.json']
  // kit/VERSION + the commit, " + uncommitted changes" when kit has edits (git is asked once per run)
  const { version, commit } = kitVersion(moduleDir, { watch: ['kit'] })
  log(`Version module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  starter.forEach((f) => log(`  starter ${f} — { "version": "0.1.0", "build": 0 } (yours from now on: /save bumps the build, /deliver the version)`))
  if (dryRun) return { changed, removed, starter }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(join(moduleDir, 'kit', f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  if (starter.length) writeFileSync(join(game, 'version.json'), JSON.stringify(STARTER_VERSION, null, 2) + '\n')
  const missing = wiringSteps(game).filter((w) => !w.done)
  if (missing.length) {
    log('  Still to wire (README: What a game must provide):')
    missing.forEach((w, i) => log(`  ${i + 1}. ${w.step}`))
  }
  { const step = checkFrameworkStep(game); if (step) log(`  Also: ${step}`) }
  return { changed, removed, starter, missing }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  const unknown = process.argv.slice(3).filter((a) => a !== '--dry-run')
  if (!gameDir || gameDir.startsWith('-') || unknown.length) {
    if (unknown.length) console.log(`Unknown: ${unknown.join(' ')}`)
    console.log('Usage: node scripts/install-version.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  const result = installVersion(gameDir, { dryRun: process.argv.includes('--dry-run') })
  if (result.refused) process.exit(1)
}
