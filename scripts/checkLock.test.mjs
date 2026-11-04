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

test('another check:fast holds it → says so, waits for it to end, then runs', { timeout: 60_000 }, async (t) => {
  const dir = repo(t)
  const lib = JSON.stringify(pathToFileURL(join(import.meta.dirname, 'checkLock.mjs')).href)
  // a second Node holds the lock like a running check:fast — until this test closes its input (no timer: on a busy PC
  // the waiter took longer to start than a fixed hold, and found the lock already free)
  const holder = spawn(process.execPath, ['--input-type=module', '-e',
    `import { takeCheckLock } from ${lib}
const release = takeCheckLock(${JSON.stringify(dir)}, { say: () => {} }); console.log('held'); process.stdin.resume(); process.stdin.on('end', () => { release(); process.exit(0) })`], { stdio: ['pipe', 'pipe', 'inherit'] })
  await new Promise((held) => holder.stdout.once('data', held))
  // the wait runs in another child so this test's own clock keeps going
  const waiter = spawn(process.execPath, ['--input-type=module', '-e',
    `import { takeCheckLock } from ${lib}
const release = takeCheckLock(${JSON.stringify(dir)}); console.log('got it'); release()`], { stdio: ['ignore', 'pipe', 'inherit'] })
  const said = []
  let gotIt = false
  waiter.stdout.on('data', (d) => {
    for (const line of String(d).trim().split('\n')) {
      said.push(line)
      if (/waiting for it/.test(line)) holder.stdin.end() // it's waiting → now the first run ends
      if (line === 'got it') gotIt = true
    }
  })
  await new Promise((done) => waiter.on('exit', done))
  assert.match(said[0], /another check:fast is running here \(process \d+, since .+\) — waiting for it/)
  assert.ok(gotIt, said.join(' | '))
})

test('a lock left by a run that died is taken over without waiting', (t) => {
  const dir = repo(t)
  writeFileSync(lockFile(dir), `999999 ${Date.now()}`)
  const said = []
  const release = takeCheckLock(dir, { say: (line) => said.push(line) })
  assert.deepEqual(said, []) // (no "waiting" — a timing limit here failed on a busy PC: git alone took over 1 s)
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
