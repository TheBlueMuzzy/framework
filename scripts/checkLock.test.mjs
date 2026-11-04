// Tests for checkLock.mjs (F178 — check:fast refuses a second run) — run: node --test scripts/
import assert from 'node:assert/strict'
import { execSync, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { takeCheckLock } from './checkLock.mjs'

// A throwaway git repo: the lock lives in its .git folder, like BMUZ's hooks keep it
function repo(t) {
  const dir = mkdtempSync(join(tmpdir(), 'checklock-'))
  execSync('git init -q', { cwd: dir })
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}
const lockFile = (dir) => join(dir, '.git', 'bmuz-check.lock')
const quietly = { say: () => {} }

test('no other run → takes the lock at once, and frees it', (t) => {
  const dir = repo(t)
  const release = takeCheckLock(dir, quietly)
  assert.ok(existsSync(lockFile(dir)))
  assert.match(readFileSync(lockFile(dir), 'utf8'), new RegExp(`^${process.pid} \\d+$`))
  release()
  assert.ok(!existsSync(lockFile(dir)))
})

test('another check:fast holds it → says so, waits for it to end, then runs', { timeout: 30_000 }, async (t) => {
  const dir = repo(t)
  // a second Node holds the lock for ~1.5 s, the way a running check:fast would
  const holder = spawn(process.execPath, ['--input-type=module', '-e',
    `import { takeCheckLock } from ${JSON.stringify(pathToFileURL(join(import.meta.dirname, 'checkLock.mjs')).href)}
const release = takeCheckLock(${JSON.stringify(dir)}, { say: () => {} }); console.log('held'); setTimeout(() => { release(); process.exit(0) }, 1500)`], { stdio: ['ignore', 'pipe', 'inherit'] })
  await new Promise((held) => holder.stdout.once('data', held))
  const said = []
  const started = Date.now()
  // the wait runs in another child so this test's own clock keeps going
  const waiter = spawn(process.execPath, ['--input-type=module', '-e',
    `import { takeCheckLock } from ${JSON.stringify(pathToFileURL(join(import.meta.dirname, 'checkLock.mjs')).href)}
const release = takeCheckLock(${JSON.stringify(dir)}); console.log('got it'); release()`], { stdio: ['ignore', 'pipe', 'inherit'] })
  waiter.stdout.on('data', (d) => said.push(...String(d).trim().split('\n')))
  await new Promise((done) => waiter.on('exit', done))
  assert.ok(Date.now() - started >= 1000, `waited ${Date.now() - started} ms`)
  assert.match(said[0], /another check:fast is running here \(process \d+, since .+\) — waiting for it/)
  assert.equal(said.at(-1), 'got it')
})

test('a lock left by a run that died is taken over at once', (t) => {
  const dir = repo(t)
  writeFileSync(lockFile(dir), `999999 ${Date.now()}`)
  const started = Date.now()
  const release = takeCheckLock(dir, quietly)
  assert.ok(Date.now() - started < 1000)
  assert.match(readFileSync(lockFile(dir), 'utf8'), new RegExp(`^${process.pid} `))
  release()
})

test('started by whoever holds the lock (the hand-back hook, /save) → runs straight on, never waits on its own parent', (t) => {
  const dir = repo(t)
  writeFileSync(lockFile(dir), `${process.ppid} ${Date.now()}`) // held by a live process: our parent
  const release = takeCheckLock(dir, { ...quietly, env: { BMUZ_CHECK_LOCK_HELD: String(process.ppid) } })
  assert.match(readFileSync(lockFile(dir), 'utf8'), new RegExp(`^${process.ppid} `)) // left as it was
  release()
  assert.ok(existsSync(lockFile(dir)), 'the holder frees its own lock')
})

test('not a git folder → runs without a lock (GitHub\'s copies, a zip)', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'checklock-nogit-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const release = takeCheckLock(dir, quietly)
  assert.equal(typeof release, 'function')
  release()
})
