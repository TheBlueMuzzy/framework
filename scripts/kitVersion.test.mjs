// Tests for kitVersion.mjs (F159) — run: node --test scripts/
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { kitVersion } from './kitVersion.mjs'

// A fake module folder: kit/VERSION + a scripts folder
function fakeModule(version = '1.2.3') {
  const dir = mkdtempSync(join(tmpdir(), 'kitversion-'))
  mkdirSync(join(dir, 'kit'))
  mkdirSync(join(dir, 'scripts'))
  writeFileSync(join(dir, 'kit', 'VERSION'), `${version}\n`)
  return dir
}

const git = (command, cwd) => execSync(`git ${command}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()

test('a folder outside git says "no git"', (t) => {
  const dir = fakeModule('0.4.1')
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  assert.deepEqual(kitVersion(dir), { version: '0.4.1', commit: 'no git' })
})

test('edits in a watched folder are noted; edits elsewhere are not', (t) => {
  const dir = fakeModule('2.0.0')
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  git('init -q', dir)
  git('add .', dir)
  git('-c user.name=test -c user.email=test@example.com commit -q -m start', dir)
  const commit = git('rev-parse --short HEAD', dir)
  writeFileSync(join(dir, 'scripts', 'new.mjs'), '// an edit in scripts\n')
  // watching only kit: the scripts edit doesn't count
  assert.deepEqual(kitVersion(dir, { watch: ['kit'] }), { version: '2.0.0', commit })
  // watching kit + scripts: it does
  assert.deepEqual(kitVersion(dir, { watch: ['kit', 'scripts'] }), { version: '2.0.0', commit: `${commit} + uncommitted changes` })
})

test('git is asked once per folder per run, however often an installer asks', (t) => {
  const dir = fakeModule()
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const asked = []
  const run = (command) => {
    asked.push(command)
    return command.startsWith('git rev-parse') ? 'abc1234' : ''
  }
  for (let i = 0; i < 5; i++) assert.deepEqual(kitVersion(dir, { watch: ['kit'], run }), { version: '1.2.3', commit: 'abc1234' })
  assert.deepEqual(asked, ['git rev-parse --short HEAD', 'git status --porcelain kit'])
})
