// CHECK EVERY MODULE, SIDE BY SIDE — the framework's check:fast (v0.10 look-back: release.mjs found no check:fast here,
// so a framework release checked nothing locally and leaned on GitHub's Checks alone).
// Every module = every folder with a kit/VERSION (found, not typed in — same rule as .github/workflows/checks.yml).
// Each runs its own `test` and `typecheck` (when it has them), plus the root `lint` once. Exit code 0 = all passed.
//   npm run check:fast
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const modules = readdirSync(root).filter((name) => existsSync(join(root, name, 'kit', 'VERSION')))

// [label, folder, npm script]
const checks = [['lint (all modules)', root, 'lint']]
for (const name of modules) {
  const scripts = JSON.parse(readFileSync(join(root, name, 'package.json'), 'utf8')).scripts ?? {}
  for (const script of ['test', 'typecheck']) {
    if (scripts[script]) checks.push([`${name} ${script}`, join(root, name), script])
  }
}

function run([label, cwd, script]) {
  return new Promise((done) => {
    const started = Date.now()
    const child = spawn(`npm run -s ${script}`, { cwd, shell: true })
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

console.log(`Checking ${modules.length} modules: ${modules.join(', ')}`)
const results = await Promise.all(checks.map(run))
const failed = results.filter((result) => !result.ok)
for (const result of failed) console.log(`\n── ${result.label} ──\n${result.log.trim().split('\n').slice(-40).join('\n')}`)
console.log(failed.length ? `\n✗ ${failed.length} of ${results.length} checks failed` : `\n✓ all ${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
