// INSTALL / UPDATE THE CRASHES MODULE IN A GAME — plain Node, no packages needed.
// Usage: node scripts/install-crashes.mjs <game-folder> [--dry-run]
//   --dry-run: only show what would change
// What it does:
//   - copies kit/ → <game>/src/crashes/ (not the tests: they run here, in the framework)
//   - kit/ui/ (the "Something broke" screen, built from UI kit parts) only goes in when the game has the UI kit (src/ui/kit/)
//   - copies the PC command scripts/crash-report.mjs → src/crashes/crash-report.mjs (npm run crashes)
//   - writes a VERSION file (module version + framework commit)
//   - removes files the module no longer ships — only ever inside src/crashes/
//   - gives the game, ONCE each (after that they're the game's, never overwritten):
//       content/crashes.json                   — where reports go (empty until going live), how many, the server's limits
//       crashes/worker.ts + crashes/wrangler.json — the game's own crash server (port 1995 locally)
//   - prints the wiring steps still missing (only those), then how to try it and how to go live (Muzzy's call)
import { execSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const crashesDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT_TARGET = 'src/crashes'
const UI_FOLDER = 'ui/'
const COMMAND = 'crash-report.mjs' // scripts/crash-report.mjs → src/crashes/crash-report.mjs
export const CRASHES_PORT = 1995 // rooms 1999 · saves cloud 1998 · board 1996
const WORKER = 'crashes/worker.ts'
const WRANGLER = 'crashes/wrangler.json'
const STARTERS = ['content/crashes.json', WORKER, WRANGLER]
const isTest = (path) => /\.test\./.test(path)
const readText = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

// npm run check:framework (the Dev Kit's runner) runs this module's promise checks (kit/conformance.mjs)
export function checkFrameworkStep(gameDir) {
  let scripts = {}
  try { scripts = JSON.parse(readFileSync(join(gameDir, 'package.json'), 'utf8')).scripts ?? {} } catch { /* no package.json */ }
  if (scripts['check:framework']) return null
  return 'package.json "scripts": "check:framework": "node src/devkit/check-framework.mjs"   (comes with the Dev Kit: runs every installed module\'s promise checks, this one\'s too)'
}

// The game's name for Cloudflare (package.json "name", else the folder) — the server is "<name>-crashes"
export function gameName(gameDir) {
  try {
    const name = JSON.parse(readText(join(gameDir, 'package.json'))).name
    if (typeof name === 'string' && /^[a-z0-9-]+$/.test(name)) return name
  } catch { /* no package.json: use the folder name */ }
  return resolve(gameDir).split(/[\\/]/).filter(Boolean).at(-1).toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

/** The template's wrangler.json with the game's name in. Its own file inside crashes/, so a deploy never touches the
 *  rooms server, the saves cloud or the board (and back). Paths in it are relative to crashes/. */
export function wranglerConfig(gameDir) {
  const config = JSON.parse(readFileSync(join(crashesDir, 'templates', 'worker', 'wrangler.json'), 'utf8'))
  return { ...config, name: `${gameName(gameDir)}-crashes` }
}

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return []
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listFiles(path, base) : [relative(base, path).replaceAll('\\', '/')]
  })
}

// What a game's code says, minus comments (a how-to comment is not wiring)
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1')

// The wiring, as { done, step } — so only the missing steps are printed (like the saves installer's)
export function wiringSteps(gameDir) {
  const text = (file) => readText(join(gameDir, file))
  let pkg = {}
  try { pkg = JSON.parse(text('package.json') || '{}') } catch { /* unreadable: every package step shows */ }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const scripts = pkg.scripts ?? {}
  const name = gameName(gameDir)
  const code = listFiles(join(gameDir, 'src')).filter((f) => !f.startsWith('crashes/') && /\.(ts|tsx|js|jsx|mjs)$/.test(f)).map((f) => withoutComments(text(`src/${f}`)))
  const inCode = (pattern) => code.some((c) => pattern.test(c))
  const viteConfig = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'].find((f) => existsSync(join(gameDir, f)))
  const settingsRows = (() => { try { return JSON.parse(text('content/ui/settings.json')).tabs.flatMap((t) => t.rows ?? []) } catch { return [] } })()
  return [
    { done: Boolean(deps.wrangler) && Boolean(deps['source-map']), step: 'Packages: npm install -D wrangler source-map   (source-map turns the built code\'s lines back into yours, on the PC only)' },
    {
      done: /crash-report\.mjs/.test(scripts.crashes ?? '') && /wrangler dev\b.*crashes[\\/]wrangler\.json/.test(scripts['crashes:dev'] ?? '') && /wrangler deploy\b.*crashes[\\/]wrangler\.json/.test(scripts['crashes:deploy'] ?? ''),
      step: 'package.json "scripts": "crashes": "node src/crashes/crash-report.mjs", "crashes:dev": "wrangler dev -c crashes/wrangler.json", "crashes:deploy": "wrangler deploy -c crashes/wrangler.json"',
    },
    {
      done: /(^|\n)\s*\/?\.wrangler\/?\s*(\n|$)/.test(text('.gitignore')),
      step: '.gitignore: add the line   .wrangler/   (wrangler\'s local dev state)',
    },
    {
      done: Boolean(viteConfig) && /\bcrashesMaps\s*\(/.test(withoutComments(text(viteConfig))),
      step: `${viteConfig ?? 'vite.config.ts'}: import { crashesMaps } from './src/crashes/vitePlugin.mjs'   and add crashesMaps() to plugins: [ … ]
       (every build makes hidden source maps and moves them to releases/<version>/maps/ — commit that folder; players never get them)`,
    },
    {
      done: inCode(/\bstartCrashes\s*\(/),
      step: `At start-up (src/main.tsx):   import crashesJson from '../content/crashes.json'
       import { startCrashes, readCrashesConfig } from './crashes'   import { versionLabel } from './version'
       startCrashes({ config: readCrashesConfig(crashesJson), version: versionLabel })
       Game moments for the report: moment('roundStart', round) at the big beats (code names + numbers only), or
       momentsFromGame(…) on the Dev Kit adapter's onEvent. A 3D canvas: watchCanvas(gl.domElement).`,
    },
    {
      done: settingsRows.some((r) => r?.id === 'crashReports' && r.on !== false) || inCode(/\bCRASH_SETTINGS_ROWS\b/),
      step: 'Settings: paste CRASH_SETTINGS_ROWS (src/crashes/settingsRow.ts — the "Send crash reports" switch, on, with its privacy line) into a tab\'s "rows" in content/ui/settings.json',
    },
    {
      done: inCode(/\bapplyCrashSetting\s*\(/) || inCode(/\bsetOn\s*\(/),
      step: 'The switch reaches the module: applyCrashSetting(loadSettings(schema)) at start-up, and applyCrashSetting(values) in <Settings onChange>',
    },
    {
      done: !inCode(/\bcreateRoot\s*\(/) || inCode(/\bcrashRootOptions\s*\(/),
      step: "React: createRoot(element, crashRootOptions())   (import { crashRootOptions } from './crashes/ui/crashRoot') — a broken screen shows \"Something broke · Reload\" instead of a blank page",
    },
    // Always shown: how to try it, and the live steps (can't be checked from here)
    {
      done: false,
      step: `Try it: npm run crashes:dev (port ${CRASHES_PORT}) with a test token in crashes/.dev.vars (CRASHES_TOKEN=<24+ characters>; .dev.vars is never committed),
       content/crashes.json client.url = "http://localhost:${CRASHES_PORT}" + client.sendInDev = true, npm run dev, throw an error,
       then CRASHES_TOKEN=<the same> npm run crashes -- --url=http://localhost:${CRASHES_PORT}`,
    },
    {
      done: false,
      step: `Going live (Muzzy's call — a public server that keeps anonymous error reports for content/crashes.json server.keepDays):
       1. a token, once:   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
          → save it in ~/.config/bmuz/crashes/${name}.token on each machine (never in the repo), and
          npx wrangler secret put CRASHES_TOKEN -c crashes/wrangler.json   (paste the same text)
       2. npx wrangler login (once per machine), then npm run crashes:deploy → https://${name}-crashes.joebrogno.workers.dev
       3. content/crashes.json client.url = that address; STATE Key facts: "Crashes: <that address>" (session start reads it)
       4. the privacy page: the crash-report paragraph (framework .planning/design/crashes.md "Privacy wording")
       Deploy again whenever crashes/, src/crashes/crashRoutes.ts, crashRows.ts or content/crashes.json "server" changes.`,
    },
  ]
}

function kitVersion() {
  const version = readFileSync(join(crashesDir, 'kit', 'VERSION'), 'utf8').trim()
  let commit = 'no git'
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: crashesDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    if (execSync('git status --porcelain kit scripts', { cwd: crashesDir, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) commit += ' + uncommitted changes'
  } catch { /* not a git folder: fine */ }
  return { version, commit }
}

// --- a worker copy that fell behind the kit ------------------------------------------------------------------------
// crashes/worker.ts is copied ONCE, but it calls the kit, which keeps changing. The template says its version; a game's
// copy with an older one is named with what changed since. Bump the template's "Template version" line AND add a line
// here whenever the template changes.
export const TEMPLATE_CHANGES = { [WORKER]: {} }
const templateVersion = (text) => Number(/Template version: (\d+)/.exec(text)?.[1] ?? 1)

/** The game's worker copy made from an older template → [{ file, from, to, changes: [lines] }]. */
export function staleWorkers(gameDir) {
  return Object.entries(TEMPLATE_CHANGES).flatMap(([file, notes]) => {
    const mine = readText(join(gameDir, file))
    if (!mine) return []
    const from = templateVersion(mine)
    const to = templateVersion(readText(join(crashesDir, 'templates', 'worker', 'worker.ts')))
    if (from >= to) return []
    return [{ file, from, to, changes: Object.entries(notes).filter(([v]) => Number(v) > from).map(([v, note]) => `${v}: ${note}`) }]
  })
}

const STARTER_SOURCE = { 'content/crashes.json': 'templates/content/crashes.json', [WORKER]: 'templates/worker/worker.ts' }

export function installCrashes(gameDir, { dryRun = false, log = console.log } = {}) {
  const game = resolve(gameDir)
  const target = join(game, KIT_TARGET)
  // A src/crashes/ with files but no VERSION isn't ours (the game's own code): never touch it.
  if (listFiles(target).length && !existsSync(join(target, 'VERSION'))) {
    const refused = `${KIT_TARGET}/ already holds the game's own files (no VERSION, so not this module's) — nothing was installed or removed. Rename that folder, then run the installer again.`
    log(`Crashes module: ${refused}`)
    return { refused, changed: [], removed: [], starter: [] }
  }
  const hasUiKit = existsSync(join(game, 'src/ui/kit/VERSION'))
  // what the module ships: kit files (path in the game → path here)
  const ships = new Map(listFiles(join(crashesDir, 'kit'))
    .filter((f) => !isTest(f) && f !== 'VERSION')
    .filter((f) => hasUiKit || !f.startsWith(UI_FOLDER))
    .map((f) => [f, join(crashesDir, 'kit', f)]))
  ships.set(COMMAND, join(crashesDir, 'scripts', COMMAND))
  const present = listFiles(target).filter((f) => f !== 'VERSION')
  const changed = [...ships.keys()].filter((f) => !present.includes(f) || !readFileSync(ships.get(f)).equals(readFileSync(join(target, f))))
  const removed = present.filter((f) => !ships.has(f))
  const starter = STARTERS.filter((f) => !existsSync(join(game, f)))
  const { version, commit } = kitVersion()
  log(`Crashes module ${version} (framework ${commit}) → ${KIT_TARGET}/`)
  changed.forEach((f) => log(`  ${present.includes(f) ? 'changed' : 'added  '} ${f}`))
  removed.forEach((f) => log(`  removed ${f}`))
  if (!changed.length && !removed.length) log('  already up to date')
  if (!hasUiKit) log(`  skipped ${UI_FOLDER} (the "Something broke" screen — the game has no UI kit; call reportError from its own error screen)`)
  starter.forEach((f) => log(`  starter ${f} (yours from now on — the installer never overwrites it)`))
  const stale = staleWorkers(game)
  for (const s of stale) {
    log(`  ⚠ ${s.file} was made from an older template (version ${s.from}; the kit's is ${s.to}) — bring these changes over from framework/crashes/templates/worker/worker.ts:`)
    s.changes.forEach((c) => log(`      ${c}`))
  }
  if (dryRun) return { changed, removed, starter, stale }
  for (const f of changed) {
    mkdirSync(dirname(join(target, f)), { recursive: true })
    copyFileSync(ships.get(f), join(target, f))
  }
  for (const f of removed) rmSync(join(target, f))
  if (removed.some((f) => f.startsWith(UI_FOLDER)) && !listFiles(join(target, 'ui')).length) rmSync(join(target, 'ui'), { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'VERSION'), `${version} (framework ${commit})\n`)
  for (const f of starter) {
    mkdirSync(dirname(join(game, f)), { recursive: true })
    if (f === WRANGLER) writeFileSync(join(game, f), JSON.stringify(wranglerConfig(game), null, 2) + '\n')
    else copyFileSync(join(crashesDir, STARTER_SOURCE[f]), join(game, f))
  }
  const missing = wiringSteps(game).filter((w) => !w.done)
  log('  Still to wire:')
  missing.forEach((w, i) => log(`  ${i + 1}. ${w.step}`))
  { const step = checkFrameworkStep(game); if (step) log(`  Also: ${step}`) }
  return { changed, removed, starter, stale }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const gameDir = process.argv[2]
  const unknown = process.argv.slice(3).filter((a) => a !== '--dry-run')
  if (!gameDir || gameDir.startsWith('-') || unknown.length) {
    if (unknown.length) console.log(`Unknown: ${unknown.join(' ')}`)
    console.log('Usage: node scripts/install-crashes.mjs <game-folder> [--dry-run]')
    process.exit(1)
  }
  const result = installCrashes(gameDir, { dryRun: process.argv.includes('--dry-run') })
  if (result.refused) process.exit(1)
}
