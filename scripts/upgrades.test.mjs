// EVERY MODULE SAYS ITS HAND STEPS (F168): <module>/UPGRADES.md lists what a game does by hand when it updates,
// `- <version>: <step>` newest first, and optionally `Needs Dev Kit: <version>`. install-module.mjs prints the steps
// between the game's version and the new one, and refuses the install on an older Dev Kit. A step for a version the
// module hasn't reached yet would never be printed to anyone, so it's refused here.
// Run: node --test "scripts/*.test.mjs" (check:fast runs it)
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

const root = join(import.meta.dirname, '..')

// "0.35.10" → [0, 35, 10], compared number by number
const parts = (version) => version.split('.').map(Number)
const compare = (a, b) => { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0 }

// Every top-level folder with kit/VERSION (starters aren't modules)
function modules() {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'starters')
    .filter((entry) => existsSync(join(root, entry.name, 'kit', 'VERSION')))
    .map((entry) => entry.name)
}

test('every module has an UPGRADES.md', () => {
  const found = modules()
  assert.ok(found.length >= 11, `found only ${found.length} modules: ${found.join(', ')}`)
  const missing = found.filter((name) => !existsSync(join(root, name, 'UPGRADES.md')))
  assert.deepEqual(missing, [], `add <module>/UPGRADES.md (copy one, even "No hand steps so far") for: ${missing.join(', ')}`)
})

test("each UPGRADES.md's versions are real, newest first, and not past the module's own kit/VERSION", () => {
  const problems = []
  for (const name of modules()) {
    const file = join(root, name, 'UPGRADES.md')
    if (!existsSync(file)) continue
    const version = readFileSync(join(root, name, 'kit', 'VERSION'), 'utf8').trim()
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    const steps = lines.flatMap((line, i) => {
      const step = line.match(/^- (\S+?):\s/)
      return step ? [{ version: step[1], at: i + 1 }] : []
    })
    for (const step of steps) {
      if (!/^\d+\.\d+\.\d+$/.test(step.version)) problems.push(`${name}/UPGRADES.md line ${step.at}: "${step.version}" isn't a version (x.y.z)`)
      else if (compare(step.version, version) > 0) problems.push(`${name}/UPGRADES.md line ${step.at}: ${step.version} is newer than kit/VERSION ${version}`)
    }
    const real = steps.filter((step) => /^\d+\.\d+\.\d+$/.test(step.version))
    for (let i = 1; i < real.length; i++) {
      if (compare(real[i].version, real[i - 1].version) > 0) problems.push(`${name}/UPGRADES.md line ${real[i].at}: ${real[i].version} comes after ${real[i - 1].version} — newest first`)
    }
    for (const [i, line] of lines.entries()) {
      const needs = line.match(/^Needs Dev Kit:\s*(\S+)/)
      if (needs && !/^\d+\.\d+\.\d+$/.test(needs[1])) problems.push(`${name}/UPGRADES.md line ${i + 1}: "Needs Dev Kit: ${needs[1]}" isn't a version (x.y.z)`)
      else if (needs && name !== 'devkit' && compare(needs[1], readFileSync(join(root, 'devkit', 'kit', 'VERSION'), 'utf8').trim()) > 0) problems.push(`${name}/UPGRADES.md line ${i + 1}: needs Dev Kit ${needs[1]}, newer than the framework's own`)
    }
  }
  assert.deepEqual(problems, [])
})
