// PLAY A STARTER WITH TODAY'S MODULES (F65 — Framework test game): a broken module change turns the framework's checks
// red BEFORE any game takes the update.
//   node scripts/starter-check.mjs <starter> [fast|full]      e.g.  node scripts/starter-check.mjs turn-based fast
// Why a copy: a starter (starters/<name>) holds COPIES of the modules, made when they were installed — running its
// checks as they are would only test those old copies. So this:
//   1. copies starters/<name> to a throwaway folder in the OS temp folder — not node_modules, e2e-shots, .wrangler,
//      dist, releases (node_modules is borrowed instead: one link per package to the starter's own, so no npm install;
//      the caches .vite / .tmp stay real folders in the copy, so the copy never writes into the starter's)
//   2. refreshes every module in the copy from the framework as it is right now (saved or not): each module's own
//      installer, the same one install-module.mjs runs (its "module's own tests first" step is skipped — the
//      framework's check:fast runs those beside this)
//   3. runs the starter's `npm run check:<fast|full>` in the copy, and prints the logs of any check that failed
//   4. deletes the copy. The real starters/<name> is never written to.
// Exit code 0 = the starter passed with today's modules.
// Needs: `npm ci` in starters/<name> once (its node_modules is the one borrowed). A full run also needs Playwright's
// Chromium, and only one full run of a starter at a time (its e2e scripts use fixed ports) — a lock file says so.
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const framework = join(import.meta.dirname, '..')
const [name, tier = 'fast'] = process.argv.slice(2)
const starter = join(framework, 'starters', name ?? '')
if (!name || !existsSync(join(starter, 'package.json'))) stop(`Which starter? (got "${name ?? ''}") — one of: ${starterNames().join(', ')}`)
if (!['fast', 'full'].includes(tier)) stop(`fast or full? (got "${tier}")`)
if (!existsSync(join(starter, 'node_modules'))) stop(`starters/${name} has no node_modules — run \`npm ci\` in it once (the copy borrows it)`)

// Things a copy never takes: packages (borrowed below), and what checks, servers and builds leave behind
const SKIP = new Set(['node_modules', 'e2e-shots', '.wrangler', 'dist', 'releases', '.claude', '.playwright-mcp', '.vite'])
// Caches tools write inside node_modules — real folders in the copy, never links into the starter's
const OWN_CACHES = new Set(['.vite', '.vite-temp', '.tmp', '.cache'])

// One full run per starter at a time: its e2e scripts use fixed ports (the starter's own check-all lock is inside its
// e2e-shots folder, which every copy has its own of — so this lock lives beside the copies instead)
const lock = join(tmpdir(), `framework-starter-${name}-full.lock`)
if (tier === 'full') {
  const held = existsSync(lock) && readFileSync(lock, 'utf8').trim()
  if (held && isRunning(Number(held.split(' ')[0]))) stop(`Another full check of ${name} is running (process ${held}). Wait for it — two at once share ports. (If it died, delete ${lock}.)`)
  writeFileSync(lock, `${process.pid} ${new Date().toLocaleTimeString()}`)
}

const started = Date.now()
const copy = mkdtempSync(join(tmpdir(), `starter-${name}-`))
let cleanedUp = false
function cleanUp() {
  if (cleanedUp) return
  cleanedUp = true
  rmSync(copy, { recursive: true, force: true }) // removes the package links, never what they point to
  if (tier === 'full') rmSync(lock, { force: true })
}
process.on('exit', cleanUp)
process.on('SIGINT', () => process.exit(130))
process.on('SIGTERM', () => process.exit(143))

// 1. the copy
cpSync(starter, copy, { recursive: true, filter: (from) => !SKIP.has(from.slice(starter.length + 1).split(/[\\/]/)[0]) })
mkdirSync(join(copy, 'node_modules'))
for (const entry of readdirSync(join(starter, 'node_modules'))) {
  if (OWN_CACHES.has(entry)) continue
  symlinkSync(join(starter, 'node_modules', entry), join(copy, 'node_modules', entry), 'junction') // 'junction' = Windows' no-admin link; elsewhere a plain link
}
console.log(`Copied starters/${name} → ${copy}`)

// 2. every module, fresh from the framework (every folder with a kit/VERSION — a starter has every module)
const modules = readdirSync(framework).filter((folder) => existsSync(join(framework, folder, 'kit', 'VERSION')))
for (const module of modules) {
  const scripts = join(framework, module, 'scripts')
  const installer = existsSync(scripts) && readdirSync(scripts).find((file) => /^install-.*\.mjs$/.test(file) && !file.includes('.test.'))
  if (!installer) stop(`${module} has no scripts/install-*.mjs, so it can't be put in the starter`)
  const result = spawnSync(process.execPath, [join(scripts, installer), copy], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const version = readFileSync(join(framework, module, 'kit', 'VERSION'), 'utf8').trim()
  if (result.status !== 0) stop(`${module}'s installer failed on the copy:\n${`${result.stdout}${result.stderr}`.trim()}`)
  console.log(`✓ ${module} ${version} installed`)
}

// 3. the starter's own checks, in the copy
console.log(`\nnpm run check:${tier} (starters/${name}, fresh modules):`)
const output = await runShowing(`npm run -s check:${tier}`, copy)
const failedNames = [...output.text.matchAll(/^FAIL\s+(\S+)/gm)].map((match) => match[1])
for (const failed of failedNames) {
  const log = join(copy, 'e2e-shots', 'logs', `${failed}.log`)
  if (existsSync(log)) console.log(`\n── ${failed} (last 60 lines) ──\n${readFileSync(log, 'utf8').trim().split('\n').slice(-60).join('\n')}`)
}
const minutes = ((Date.now() - started) / 60000).toFixed(1)
console.log(`\n${output.code === 0 ? '✓' : '✗'} starter ${name} with fresh modules: check:${tier} ${output.code === 0 ? 'passed' : 'FAILED'} (${minutes} min)`)
process.exit(output.code === 0 ? 0 : 1) // 4. the copy is deleted on exit (cleanUp)

// A command whose output shows as it runs, and is kept for reading afterwards
function runShowing(command, cwd) {
  return new Promise((done) => {
    const child = spawn(command, { cwd, shell: true, env: { ...process.env, FORCE_COLOR: '0' } })
    let text = ''
    const show = (chunk) => { text += chunk; process.stdout.write(chunk) }
    child.stdout.on('data', show)
    child.stderr.on('data', show)
    child.on('close', (code) => done({ code, text }))
  })
}

function starterNames() {
  const folder = join(framework, 'starters')
  return existsSync(folder) ? readdirSync(folder).filter((entry) => existsSync(join(folder, entry, 'package.json'))) : []
}

function isRunning(pid) {
  try { process.kill(pid, 0); return true } catch (error) { return error.code === 'EPERM' }
}

function stop(message) {
  console.log(`✗ ${message}`)
  process.exit(1)
}
