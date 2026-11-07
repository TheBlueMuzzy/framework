// template: ports.mjs 2 (2026-11-03) — keep this line: the session start compares it with templates/TEMPLATES.md (F203)
// WHO HOLDS THIS PORT? (F118) — one lookup for check-all's port pre-flight and stop-servers.mjs.
// TEMPLATE (~/.claude/config/bmuz/templates/ports.mjs) — copy to <game>/scripts/ports.mjs next to check-all.mjs (it imports
// it). stop-servers.mjs imports this same file, so there is one lookup, not two. Plain Node, no packages.
// Windows: netstat -ano (IPv4 AND IPv6 — Vite listens on [::1] only) + the process list from PowerShell (CIM).
// Linux (GitHub's runner): ss, or lsof when there's no ss; the command line and folder come from /proc.
import { spawnSync } from 'node:child_process'
import { readlinkSync } from 'node:fs'

// Every call has a time limit: a stuck lookup (WMI busy or broken on Windows) must not hang check:full — it ends, and
// the run still says "port N is in use", without the name (review, F118)
const sh = (command, args, timeout = 15_000) => {
  const r = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, timeout })
  return { code: r.status ?? 1, stdout: r.stdout || '' }
}

// Every listening TCP port → the process IDs listening there: Map(port → [pid…]). One quick call (no PowerShell).
export function listeningPorts() {
  const found = new Map()
  const add = (port, pid) => { if (!found.has(port)) found.set(port, []); if (pid && !found.get(port).includes(pid)) found.get(port).push(pid) }
  if (process.platform === 'win32') {
    for (const c of sh('netstat', ['-ano']).stdout.split('\n').map(l => l.trim().split(/\s+/))) {
      if (c[0] === 'TCP' && c[3] === 'LISTENING') add(Number(c[1].split(':').pop()), Number(c[4]))
    }
    return found
  }
  const ss = sh('ss', ['-Hltnp'])
  if (ss.code === 0) { // LISTEN 0 511 *:5291 *:* users:(("node",pid=1234,fd=20))
    for (const line of ss.stdout.split('\n').filter(Boolean)) {
      const c = line.trim().split(/\s+/)
      if (!c[3]) continue // not a socket row
      add(Number(c[3].split(':').pop()), Number(/pid=(\d+)/.exec(line)?.[1] ?? 0))
    }
    return found
  }
  let pid = 0 // lsof -F: a "p<pid>" line, then "n<address:port>" lines
  for (const line of sh('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-Fpn']).stdout.split('\n')) {
    if (line[0] === 'p') pid = Number(line.slice(1))
    if (line[0] === 'n') add(Number(line.split(':').pop()), pid)
  }
  return found
}

// The processes listening on one port: [pid…].
export const listeners = (port) => listeningPorts().get(port) ?? []

// Which of these ports does something answer on? Set(port). Asked by knocking (127.0.0.1, then ::1 — Vite listens on
// [::1] only), not read from netstat (F177): a server started from Claude Code's shell is missing from netstat's list
// most of the time (1–2 reads in 20 listed it, a knock found it 20 in 20), and a port with only closing rows
// (TIME_WAIT / FIN_WAIT, owner 0) answers nothing — it's free. The knock runs in a child Node so this stays a plain call.
// If the child can't run, netstat's list is the answer (the old way).
export function answeringPorts(ports) {
  const list = [...new Set(ports)].filter(Number.isInteger)
  if (!list.length) return new Set()
  const knock = [
    "import net from 'node:net'",
    'const knock = (port, host) => new Promise(done => { const s = net.connect({ port, host }); const end = (yes) => { s.destroy(); done(yes) }; s.once(\'connect\', () => end(true)); s.once(\'error\', () => end(false)); s.setTimeout(1500, () => end(false)) })',
    `const ports = ${JSON.stringify(list)}`,
    "const yes = await Promise.all(ports.map(async p => (await knock(p, '127.0.0.1')) || (await knock(p, '::1'))))",
    'console.log(JSON.stringify(ports.filter((p, i) => yes[i])))',
  ].join(String.fromCharCode(10))
  const r = sh(process.execPath, ['--input-type=module', '-e', knock])
  try { return new Set(JSON.parse(r.stdout.trim().split(String.fromCharCode(10)).find(l => l.startsWith('[')))) } catch { /* fall back */ }
  const listening = listeningPorts()
  return new Set(list.filter(p => listening.has(p)))
}

// The processes holding one port: netstat's listeners when it lists them, else every process whose command line names
// the port as a word (`vite --port 5291`, `wrangler dev --port=1997`, `hold.mjs 6011`) — what's left to go on when
// netstat leaves the server out (F177). `all` = processes(). Never this process or the ones it runs inside (the shell
// that ran `stop-servers.mjs 5173` names the port too — it was named as 5173's holder).
export function holders(port, all) {
  const pids = listeners(port)
  if (pids.length) return pids
  const byPid = new Map(all.map(p => [p.pid, p]))
  const mine = new Set()
  for (let p = byPid.get(process.pid); p && !mine.has(p.pid); p = byPid.get(p.ppid)) mine.add(p.pid)
  mine.add(process.pid)
  // port-shaped words only: `--port 5291` / `--port=5291` / `-p 5291`, an address `127.0.0.1:1997` (workerd's
  // --socket-addr), or the port alone as an argument (`hold.mjs 6011`) — never any `=N` (`--max-old-space-size=4096`,
  // `--workers=3000` aren't ports: review)
  const named = new RegExp(`(--port[= ]|\\s-p |(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|\\[::1?\\]):|\\s)${port}($|[\\s"'/])`)
  // a shell only mentions the port in a command it was given (Claude Code's own shells keep theirs), and a browser only
  // visits it (`http://localhost:5173/`) — neither listens
  const notServer = /^"?(?:[^"]*[\\/])?(bash|sh|zsh|pwsh|powershell|chrome|msedge|firefox)(\.exe)?"?\s/i
  return all.filter(p => !mine.has(p.pid) && named.test(p.cmd) && !notServer.test(p.cmd)).map(p => p.pid)
}

// Every process: [{ pid, ppid, cmd, started }]. Throws with the reason when the list can't be read.
// tries: stop-servers needs the list (3 tries); the pre-flight only wants a name for its message (1 try, then without it).
export function processes({ tries: most = 3 } = {}) {
  if (process.platform !== 'win32') {
    const out = sh('ps', ['-eo', 'pid=,ppid=,args=']).stdout
    return out.split('\n').map(l => l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/)).filter(Boolean).map(m => ({ pid: +m[1], ppid: +m[2], cmd: m[3], started: 0 }))
  }
  // stdout only, and no .ToString() on a missing date: a process that ends while the list is built has none, and the
  // error PowerShell printed for it was glued onto the JSON (flaky "couldn't list the running processes" under load)
  // Still failed now and then (2026-10-19, not reproduced in 8 runs after) → up to 3 tries, and the spot where it
  // broke is said so the next failure says why
  let list = null, out = '', why = ''
  for (let tries = 0; tries < most && !list; tries++) {
    out = sh('powershell', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine,@{n='Started';e={if ($_.CreationDate) { $_.CreationDate.ToString('o') }}} | ConvertTo-Json -Compress"], 20_000).stdout
    try { list = JSON.parse(out) } catch (error) { why = error.message }
  }
  if (!list) {
    const at = Number(/position (\d+)/.exec(why)?.[1] ?? 0)
    throw new Error(`couldn't list the running processes (${most} tr${most > 1 ? 'ies' : 'y'}): ${why}\n  near: ${JSON.stringify(out.slice(Math.max(0, at - 120), at + 60))}`)
  }
  return [].concat(list).map(p => ({ pid: p.ProcessId, ppid: p.ParentProcessId, cmd: p.CommandLine || '', started: p.Started ? Date.parse(p.Started) : 0 }))
}

// A command line, short: `"C:\Program Files\nodejs\node.exe" C:\…\node_modules\vite\bin\vite.js --port 5291` → `vite --port 5291`.
export function shortCommand(cmd) {
  const words = (cmd.match(/"[^"]*"|\S+/g) ?? []).map((w, i) => (i === 0 && /[\\/]node(\.exe)?"?$/i.test(w) ? 'node' : w))
  const at = words.findIndex(w => /node_modules[\\/]/.test(w)) // the tool's script: name it by its file
  if (at < 0) return words.join(' ').slice(0, 120)
  const tool = words[at].replace(/"/g, '').split(/[\\/]/).pop().replace(/\.[cm]?js$/, '').replace(/^(npm|npx)-cli$/, '$1')
  return [tool, ...words.slice(at + 1)].join(' ').slice(0, 120)
}

// The folder a process runs in: its working folder on Linux (/proc); on Windows (no working folder to ask for) the
// project its command line points into — the part before node_modules, or the script's folder.
function folderOf(p, byPid) {
  if (process.platform !== 'win32') { try { return readlinkSync(`/proc/${p.pid}/cwd`) } catch { /* not ours to read */ } }
  for (let q = p, hops = 0; q && hops < 5; q = byPid.get(q.ppid), hops++) { // the server, then the npm / cmd above it
    for (const word of (q.cmd.match(/"[^"]*"|\S+/g) ?? []).map(w => w.replace(/"/g, ''))) {
      if (/\\nodejs\\|^[A-Za-z]:\\Windows\\/i.test(word)) continue // Node's own folder (npm-cli.js) and Windows' tell nothing
      const inProject = /^(.+?)[\\/]node_modules[\\/]/.exec(word)
      if (inProject) return inProject[1]
      const script = /^([A-Za-z]:\\.+)\\[^\\]+\.[cm]?[jt]s$/.exec(word)
      if (script) return script[1]
    }
  }
  return ''
}

// The ports in the list that something already holds: [{ port, pid, cmd, folder }] — [] when all are free.
// Taken = something answers there (answeringPorts); netstat and the process list only name who. Only a taken port pays
// for those, so a run with every port free costs one quick knock.
export function heldPorts(ports) {
  const taken = [...answeringPorts(ports)]
  if (!taken.length) return []
  let all = []
  try { all = processes({ tries: 1 }) } catch { /* still say the port, without the process */ }
  const byPid = new Map(all.map(p => [p.pid, p]))
  return taken.map(port => {
    const pid = holders(port, all)[0] ?? 0
    const p = byPid.get(pid)
    return { port, pid, cmd: p ? shortCommand(p.cmd) || '(a system process)' : pid ? `process ${pid}` : "(Windows didn't say which process)", folder: p ? folderOf(p, byPid) : '' }
  })
}
