// F182 — Rough automatic judging of replayed refusals (rules-replay.mjs output): real catch / noise / false alarm.
//   node rules-judge.mjs pipe      → judges replay-GE2.pipe-check.jsonl
//   node rules-judge.mjs heredoc   → judges replay-GE3.heredoc-backslash.jsonl
// Heuristics (hand-checked on 14-sample reads; see rules.md §9):
//  pipe:  the check|tail pair is only in a heredoc body / quoted text → FALSE; the pair is followed by `&&` (something
//         after it trusts the exit code) → REAL; otherwise the pipe ends the step and Claude reads the printed summary → NOISE.
//  heredoc: the file written isn't code (.md/.json/.txt), or only `cat`/`printf` with a quoted <<'EOF' (the shell keeps
//         every byte), or only sed regex escapes → FALSE; the script is in a throwaway place (.scratch, Temp, scratchpad) → NOISE
//         (right by the letter, nothing lost if it went wrong); else (python/node string literals with backslashes writing
//         real code) → REAL.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const here = join(homedir(), 'Documents', 'dev', '.scratch', 'framework-audit-rules') // where rules-replay.mjs writes
const which = process.argv[2]
const file = which === 'pipe' ? 'replay-GE2.pipe-check.jsonl' : 'replay-GE3.heredoc-backslash.jsonl'
const rows = readFileSync(join(here, file), 'utf8').trim().split('\n').map(l => JSON.parse(l)).filter(r => r.now !== 'allowed')

// command with heredoc bodies removed (the delimiter line kept)
function shellOnly(cmd) {
  const lines = cmd.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i])
    const m = lines[i].match(/<<-?\s*(['"]?)([A-Za-z_]\w*)\1/)
    if (m) { while (i + 1 < lines.length && lines[i + 1].trim() !== m[2]) i++; i++ }
  }
  return out.join('\n')
}
const CHECK = /(npm\s+(run\s+)?(test|check[\w:-]*|lint|typecheck|build|e2e[\w:-]*|smoke)\b|npx\s+(tsc|eslint|vitest|playwright)\b|\b(tsc|eslint|vitest)\b|node\s+\S*(e2e|check|test)\S*)[^|\n;&]*\|\s*(tail|head|grep|Select-Object|Select-String|findstr|sort|wc|tee|more|less|Out-String)\b/i

const tally = { REAL: 0, NOISE: 0, FALSE: 0 }
const examples = { REAL: [], NOISE: [], FALSE: [] }
for (const r of rows) {
  const cmd = String(r.command || '')
  let verdict
  if (which === 'pipe') {
    const shell = shellOnly(cmd).replace(/[0-9*]?>&[0-9]/g, '').replace(/"(?:\\.|[^"\\])*"|'[^']*'/g, '""')
    const m = shell.match(new RegExp(CHECK.source + '[^\\n;&|]*((\\|[^\\n;&|]*)*)(\\s*&&)?', 'i'))
    if (!m) verdict = 'FALSE'
    else verdict = /&&\s*$/.test(m[0]) ? 'REAL' : 'NOISE'
  } else {
    const shell = shellOnly(cmd)
    const scratch = /\.scratch|[\\/]Temp[\\/]|scratchpad|\/tmp\//i.test(cmd)
    const writesNonCode = /open\([^)]*\.(md|json|txt|html)['"]|p\s*=\s*['"][^'"]+\.(md|json|txt|html)['"]|>\s*\S+\.(md|json|txt)\b/.test(cmd) && !/open\([^)]*\.(m?[jt]sx?|css|py)['"]|p\s*=\s*['"][^'"]+\.(m?[jt]sx?|css|py)['"]/.test(cmd)
    const catOnly = /\b(cat|printf)\b[^\n]*<<-?\s*['"]\w+['"]/.test(cmd) && !/\b(python3?|py|node)\b[^\n]*<</.test(cmd) && !/\b(python3?|py|node)\s+(-[ce])\s/.test(shell)
    const sedOnly = /\bsed\b/.test(shell) && !/<</.test(cmd) && !/\b(python3?|py|node)\s+-[ce]\s/.test(shell)
    if (writesNonCode || catOnly) verdict = 'FALSE'
    else if (sedOnly) verdict = 'NOISE' // sed regex / replacement escapes are usually meant — right by the letter, rarely a real slip
    else if (scratch) verdict = 'NOISE'
    else verdict = 'REAL'
  }
  tally[verdict]++
  if (examples[verdict].length < 3) examples[verdict].push(cmd.replace(/\s+/g, ' ').slice(0, 160))
}
console.log(file, rows.length, 'still-refused cases →', tally)
for (const [k, v] of Object.entries(examples)) for (const e of v) console.log(`  ${k}: ${e}`)
