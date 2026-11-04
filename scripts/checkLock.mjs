// ONE CHECK:FAST AT A TIME (F178 — check:fast refuses a second run). Two runs side by side break each other (the crashes
// worker test's shared folder: TS5058, 2026-11-03) and take twice as long, so a second run waits for the first.
// The SAME lock file BMUZ's hand-back hook, commit check and /save already take (~/.claude/config/bmuz/hooks/lib.mjs
// holdCheckLock: `.git/bmuz-check.lock`, "<pid> <ms>"), so they wait for a check:fast started by hand and reuse its pass.
// Whoever holds the lock tells what it starts through BMUZ_CHECK_LOCK_HELD=<its pid> — that run goes straight on
// (it would otherwise wait on its own parent forever).
import { spawnSync } from 'node:child_process'
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'

const STALE_MS = 15 * 60_000 // a lock older than this is a run that died without cleaning up (BMUZ's lib uses the same)
const MOST_WAIT_MS = 20 * 60_000 // then run anyway, saying so — a stuck lock must never stop the checks for good

const alive = (pid) => { try { process.kill(pid, 0); return true } catch (error) { return error.code === 'EPERM' } }

// Returns release(). Waits (a second at a time) while another live run holds the lock.
export function takeCheckLock(root, { say = console.log, env = process.env } = {}) {
  const gitDir = spawnSync('git', ['rev-parse', '--git-dir'], { cwd: root, encoding: 'utf8' }).stdout?.trim()
  if (!gitDir) return () => {} // not a git folder: nothing to share a lock with
  const lock = isAbsolute(gitDir) ? join(gitDir, 'bmuz-check.lock') : join(root, gitDir, 'bmuz-check.lock')
  // our caller holds it (and frees it) — only if the lock really names it: a dev server or shell it started can
  // outlive it with the setting still in its environment, and its pid can be reused (review)
  const heldBy = Number(env.BMUZ_CHECK_LOCK_HELD)
  let named = 0
  try { named = Number(readFileSync(lock, 'utf8').split(' ')[0]) } catch { /* no lock */ }
  if (heldBy && named === heldBy && alive(heldBy)) return () => {}
  const nap = new Int32Array(new SharedArrayBuffer(4))
  const deadline = Date.now() + MOST_WAIT_MS
  let told = false
  for (;;) {
    try {
      writeFileSync(lock, `${process.pid} ${Date.now()}`, { flag: 'wx' })
      const release = () => { try { if (readFileSync(lock, 'utf8').startsWith(`${process.pid} `)) unlinkSync(lock) } catch { /* already gone */ } }
      process.on('exit', release)
      return release
    } catch (error) {
      if (error.code !== 'EEXIST') return () => {} // can't write the lock (read-only .git?) — run anyway, as before
    }
    let pid = 0, since = 0
    try { [pid, since] = readFileSync(lock, 'utf8').split(' ').map(Number) } catch { continue } // freed meanwhile
    if (!alive(pid) || Date.now() - since > STALE_MS) { try { unlinkSync(lock) } catch { /* someone else did */ } continue }
    if (Date.now() >= deadline) { say(`⚠ check:fast has waited ${MOST_WAIT_MS / 60_000} minutes for process ${pid} — running anyway`); return () => {} }
    if (!told) {
      say(`⏳ another check:fast is running here (process ${pid}, since ${new Date(since).toLocaleTimeString()}) — waiting for it, then this one runs`)
      told = true
    }
    Atomics.wait(nap, 0, 0, 1000)
  }
}
