// A BUSY PC ISN'T A RED CHECK (F171 — Checks notice a busy PC). When something else holds the CPU (another chat's bot
// sims ran all night in the v0.32 look-back), check:fast's side-by-side tests run out of time: 11–14 of 24 went red on
// timeouts, and each module had to be proven alone by hand. So after a run: the checks that failed on a timeout are
// re-run one at a time, the busiest process is named, and the alone result is the real one. A real failure (an assert,
// a type error, lint) is never re-run — and a timed-out check that fails alone too stays red.
import { spawnSync } from 'node:child_process'
import { cpus } from 'node:os'

// A test runner's "ran out of time" words: vitest (test + hook), Playwright, node:test
const TIMEOUT = [/\b(Test|Hook) timed out in \d+ ?ms/i, /\bTimeout (of )?\d+ ?ms exceeded/i, /\btest timed out after \d+ ?ms/i]
export const timedOut = (log) => TIMEOUT.some((words) => words.test(log))

// The process using the most CPU right now, as "name (what it runs) 88%" (share of the whole PC) — or "unknown".
// Asked once, only when something timed out. Never throws: a broken process list must not hide the check results.
export function busiestProcess() {
  const sh = (command, args) => spawnSync(command, args, { encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'ignore'] }).stdout || ''
  try {
    if (process.platform !== 'win32') {
      const top = sh('ps', ['-eo', 'pcpu=,comm=,args=', '--sort=-pcpu']).trim().split('\n')[0]?.trim().match(/^([\d.]+)\s+(\S+)\s+(.*)$/)
      return top ? `${top[2]} (${top[3].slice(0, 60)}) ${Math.round(Number(top[1]) / cpus().length)}%` : 'unknown'
    }
    // the per-process CPU share right now (not the total since it started), then that process's command line
    const script = [
      "$top = Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -notin '_Total','Idle' } | Sort-Object PercentProcessorTime -Descending | Select-Object -First 1",
      '$cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($top.IDProcess)").CommandLine',
      '@{ name = $top.Name; share = $top.PercentProcessorTime; cmd = $cmd } | ConvertTo-Json -Compress',
    ].join('; ')
    const top = JSON.parse(sh('powershell', ['-NoProfile', '-Command', script]).trim())
    const what = (top.cmd || '').replace(/^"[^"]*"\s*|^\S+\s*/, '').slice(0, 60) // the command line without the program itself
    return `${top.name.replace(/#\d+$/, '')}${what ? ` (${what})` : ''} ${Math.round(top.share / cpus().length)}%`
  } catch {
    return 'unknown'
  }
}

// results: [{ label, ok, log, check }] (check = what run() was given). Returns the results with each timed-out check's
// alone result in its place. say = console.log; busiest = busiestProcess (tests pass stand-ins).
export async function rerunTimeouts(results, run, { say = console.log, busiest = busiestProcess } = {}) {
  const failed = results.filter((r) => !r.ok)
  const slow = failed.filter((r) => timedOut(r.log))
  if (!slow.length) return results
  const who = busiest()
  const n = slow.length
  say(slow.length === failed.length
    ? `\n⏱ timeouts only — the PC is busy (busiest: ${who}) — re-running ${n} check${n > 1 ? 's' : ''} one at a time`
    : `\n⏱ ${n} check${n > 1 ? 's' : ''} timed out — the PC may be busy (busiest: ${who}) — re-running ${n > 1 ? 'them one at a time' : 'it alone'}`)
  const alone = new Map()
  for (const r of slow) alone.set(r, { ...(await run(r.check)), check: r.check })
  return results.map((r) => alone.get(r) ?? r)
}
