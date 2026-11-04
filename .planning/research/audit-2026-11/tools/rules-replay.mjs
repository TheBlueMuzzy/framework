// F182 — Replay past refusals through TODAY's hook: does the rule still fire on the same command? and how long does a call take?
//   node rules-replay.mjs <ruleId> [hookFile] [max]
//   e.g. node rules-replay.mjs GE2.pipe-check guard-edits.mjs 400
// For each past PreToolUse firing of the rule (rules-fired.mjs), finds the refused tool call in its transcript, feeds the
// same {tool_name, tool_input, cwd} to the hook on stdin, and records: still refused (and by which rule) / allowed now,
// plus the call's time. Prints the totals and writes every case to ~/Documents/dev/.scratch/framework-audit-rules/replay-<ruleId>.jsonl (so the
// commands can be read and classified). The hook only reads — guard-edits / guard-git don't change files.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, basename, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const OUT = join(homedir(), 'Documents', 'dev', '.scratch', 'framework-audit-rules')
const [, , id, hookFile = 'guard-edits.mjs', max = '1000'] = process.argv
process.argv = [process.argv[0], process.argv[1], 'none'] // rules-fired prints nothing in this mode
const { load, rulesOf } = await import(pathToFileURL(join(here, 'rules-fired.mjs')).href)
const { transcripts } = await import(pathToFileURL(join(homedir(), '.claude', 'config', 'bmuz', 'scripts', 'hook-history.mjs')).href)
const HOOK = join(homedir(), '.claude', 'config', 'bmuz', 'hooks', hookFile)
const paths = new Map(transcripts(join(homedir(), '.claude', 'projects')).map(p => [basename(p), p]))
const cache = new Map()
const entriesOf = (p) => cache.get(p) || cache.set(p, readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)).get(p)

const hits = load().filter(f => rulesOf(f).includes(id) && f.event === 'PreToolUse').slice(0, Number(max))
const out = []
let still = 0, allowed = 0, other = 0, missing = 0
const times = []
for (const f of hits) {
  const p = paths.get(f.session)
  if (!p) { missing++; continue }
  const entries = entriesOf(p)
  // the refusal is a tool_result; its tool_use_id names the call
  const res = entries.find(e => e.timestamp === f.t && e.type === 'user' && Array.isArray(e.message?.content) && e.message.content.some(c => c.type === 'tool_result'))
  const useId = res?.message.content.find(c => c.type === 'tool_result')?.tool_use_id
  const call = useId && entries.flatMap(e => e.type === 'assistant' && Array.isArray(e.message?.content) ? e.message.content.map(b => ({ b, cwd: e.cwd })) : []).find(({ b }) => b.type === 'tool_use' && b.id === useId)
  if (!call) { missing++; continue }
  const input = JSON.stringify({ tool_name: call.b.name, tool_input: call.b.input, cwd: call.cwd, hook_event_name: 'PreToolUse' })
  const t0 = Date.now()
  let answer = ''
  try { answer = execFileSync('node', [HOOK], { input, encoding: 'utf8', env: { ...process.env, BMUZ_FIRE_LOG: join(here, '.replay-firelog.jsonl') }, timeout: 20000 }) } catch (e) { answer = String(e.stdout || '') }
  times.push(Date.now() - t0)
  let reason = ''
  try { reason = JSON.parse(answer)?.hookSpecificOutput?.permissionDecisionReason || '' } catch { reason = '' } // not JSON = no refusal
  const now = reason ? rulesOf({ hook: f.hook, kind: 'deny', text: reason }) : []
  if (now.includes(id)) still++
  else if (reason) other++
  else allowed++
  out.push({ t: f.t, session: f.session, tool: call.b.name, command: call.b.input.command || call.b.input.file_path, now: now.join(',') || (reason ? 'other' : 'allowed') })
}
// (past commands are transcript data — kept out of the framework repo, which is public)
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, `replay-${id}.jsonl`), out.map(o => JSON.stringify(o)).join('\n') + '\n')
times.sort((a, b) => a - b)
console.log(`${id}: ${hits.length} past refusals · replayed ${out.length} (${missing} not found) → still refused ${still} · refused by another rule ${other} · allowed now ${allowed}`)
if (times.length) console.log(`hook time per call: median ${times[Math.floor(times.length / 2)]} ms · p90 ${times[Math.floor(times.length * 0.9)]} ms · max ${times[times.length - 1]} ms`)
