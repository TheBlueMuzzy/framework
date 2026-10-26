// CHECK EVERY MODULE, SIDE BY SIDE — the framework's check:fast (v0.10 look-back: release.mjs found no check:fast here,
// so a framework release checked nothing locally and leaned on GitHub's Checks alone).
// Every module = every folder with a kit/VERSION (found, not typed in — same rule as .github/workflows/checks.yml).
// Each runs its own `test` and `typecheck` (when it has them), plus the root `lint` once. Exit code 0 = all passed.
// And every starter (starters/<name> with a package.json) plays today's modules (F65 — Framework test game):
// scripts/starter-check.mjs copies it, installs every module fresh into the copy and runs the starter's own check:fast
// there — so a module change that breaks a game turns this red before any game takes it (~10 s, side by side).
//   npm run check:fast
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const modules = readdirSync(root).filter((name) => existsSync(join(root, name, 'kit', 'VERSION')))

// [label, folder, command]
const checks = [['lint (all modules)', root, 'npm run -s lint']]
for (const name of modules) {
  const scripts = JSON.parse(readFileSync(join(root, name, 'package.json'), 'utf8')).scripts ?? {}
  for (const script of ['test', 'typecheck']) {
    if (scripts[script]) checks.push([`${name} ${script}`, join(root, name), `npm run -s ${script}`])
  }
}
const startersDir = join(root, 'starters')
const starters = existsSync(startersDir) ? readdirSync(startersDir).filter((name) => existsSync(join(startersDir, name, 'package.json'))) : []
for (const name of starters) checks.push([`starter ${name} (fresh modules)`, root, `node scripts/starter-check.mjs ${name} fast`])

function run([label, cwd, command]) {
  return new Promise((done) => {
    const started = Date.now()
    const child = spawn(command, { cwd, shell: true })
    let log = ''
    child.stdout.on('data', (chunk) => (log += chunk))
    child.stderr.on('data', (chunk) => (log += chunk))
    child.on('close', (code) => {
      const seconds = ((Date.now() - started) / 1000).toFixed(0)
      console.log(`${code === 0 ? '✓' : '✗'} ${label} (${seconds}s)`)
      done({ label, ok: code === 0, log })
    })
  })
}

// A module whose README keeps version notes ("- 0.35.7 (…)") ships the newest one in kit/VERSION — that's what
// install-module reads (v0.23 look-back: UI kit 0.35.7 got its README note, VERSION stayed 0.35.6, nothing noticed)
function versionNotesMatch() {
  const wrong = []
  for (const name of modules) {
    const readme = join(root, name, 'README.md')
    if (!existsSync(readme)) continue
    const noted = [...readFileSync(readme, 'utf8').matchAll(/^- \**(\d+)\.(\d+)\.(\d+)\b/gm)].map((m) => m.slice(1, 4).map(Number))
    if (!noted.length) continue
    const newest = noted.sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0].join('.')
    const version = readFileSync(join(root, name, 'kit', 'VERSION'), 'utf8').trim()
    if (version !== newest) wrong.push(`${name}: README's newest note is ${newest}, kit/VERSION says ${version} → make them agree`)
  }
  return { label: 'version notes = kit/VERSION', ok: !wrong.length, log: wrong.join('\n') }
}

console.log(`Checking ${modules.length} modules: ${modules.join(', ')}${starters.length ? ` + starter${starters.length > 1 ? 's' : ''} ${starters.join(', ')}` : ''}`)
const versions = versionNotesMatch()
console.log(`${versions.ok ? '✓' : '✗'} ${versions.label}`)
const results = [versions, ...await Promise.all(checks.map(run))]
const failed = results.filter((result) => !result.ok)
// the end of each failed log — a starter's longer: it holds the log of every starter check that failed
for (const result of failed) {
  const lines = result.label.startsWith('starter ') ? 200 : 40
  console.log(`\n── ${result.label} ──\n${result.log.trim().split('\n').slice(-lines).join('\n')}`)
}
console.log(failed.length ? `\n✗ ${failed.length} of ${results.length} checks failed` : `\n✓ all ${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
