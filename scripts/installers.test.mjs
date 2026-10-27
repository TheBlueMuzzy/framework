// THE GUARD (F159): an installer never asks git itself — scripts/kitVersion.mjs does, once per module per run.
// Eleven copies of the same git calls meant the same slow bug was fixed twice (F128, F90); a twelfth copy would bring
// it back. Run: node --test "scripts/*.test.mjs" (check:fast runs it)
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const root = join(import.meta.dirname, '..')

// Every <module>/scripts/install-*.mjs (not its tests)
function installerFiles() {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
    .filter((entry) => existsSync(join(root, entry.name, 'scripts')))
    .flatMap((entry) => readdirSync(join(root, entry.name, 'scripts'))
      .filter((file) => /^install-.*\.mjs$/.test(file) && !file.includes('.test.'))
      .map((file) => `${entry.name}/scripts/${file}`))
}

// A git command written as a string: 'git rev-parse …' / "git status …", or spawn('git', ['rev-parse', …]).
// Only strings count, so a comment that mentions git status is fine.
const ASKS_GIT = [/['"`]git\s+(rev-parse|status)\b/, /['"`]git['"`]\s*,\s*\[\s*['"`](rev-parse|status)\b/]

function asksGitItself(text) {
  return text.split(/\r?\n/).flatMap((line, i) => (ASKS_GIT.some((pattern) => pattern.test(line)) ? [`line ${i + 1}: ${line.trim()}`] : []))
}

test('the guard spots a git call and lets a comment be', () => {
  assert.equal(asksGitItself("const c = execSync('git rev-parse --short HEAD')").length, 1)
  assert.equal(asksGitItself('execSync(`git status --porcelain kit`)').length, 1)
  assert.equal(asksGitItself("spawnSync('git', ['status', '--porcelain'])").length, 1)
  assert.equal(asksGitItself('// without the line, git status shows it').length, 0)
})

test('no installer asks git for its version itself — they use scripts/kitVersion.mjs', () => {
  const files = installerFiles()
  assert.ok(files.length >= 11, `found only ${files.length} installers: ${files.join(', ')}`)
  const offenders = files.flatMap((file) => asksGitItself(readFileSync(join(root, file), 'utf8')).map((find) => `${file} ${find}`))
  assert.deepEqual(offenders, [], `use kitVersion(moduleDir, { watch: [...] }) from scripts/kitVersion.mjs instead:\n${offenders.join('\n')}`)
})
