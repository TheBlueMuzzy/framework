// F182 — How long each BMUZ hook takes per call, with ordinary inputs (the everyday cost: hooks run on every edit / command / turn).
//   node rules-speed.mjs [runs=5] [transcript.jsonl]
// Inputs: a plain `ls` and a `git status` (Bash), a plain git commit line that won't pass the dry checks (it is only READ by the
// hooks — nothing runs it), an Edit of a game src file (guard-edits pre; lint-edit/check-ui post re-read the file only),
// an Edit of SPRINT.md (plan-lint — it rebuilds the planner page), and a Stop with a real transcript (handoff-check etc.).
// stop-check-fast is timed on its "code already passed" path only — a real run is npm run check:fast (minutes, by design).
// The hooks get BMUZ_FIRE_LOG pointed at a throwaway file so the live firing log isn't polluted.
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const runs = Number(process.argv[2] || 5)
const transcript = process.argv[3]
const H = join(homedir(), '.claude', 'config', 'bmuz', 'hooks')
const dev = join(homedir(), 'Documents', 'dev')
const goops = join(dev, 'games', 'goops')
const fw = join(dev, 'framework')

const bash = (command, cwd = fw) => ({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command }, cwd })
const cases = [
  ['guard-git', 'ls', bash('ls')],
  ['guard-git', 'git status', bash('git status --short')],
  ['guard-git', 'git commit (read only)', bash('git commit -m "audit timing probe" --dry-run')],
  ['commit-typecheck', 'ls', bash('ls')],
  ['live-push', 'ls', bash('ls')],
  ['live-push', 'git push', bash('git push --dry-run')],
  ['guard-edits', 'ls', bash('ls')],
  ['guard-edits', 'npm install (lists processes)', bash('npm install --dry-run')],
  ['guard-edits', 'Edit game file', { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: join(goops, 'src', 'ui', 'App.tsx'), old_string: 'x', new_string: 'y' }, cwd: goops }],
  ['lint-edit', 'Edit game file', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(goops, 'src', 'ui', 'App.tsx') }, cwd: goops }],
  ['check-ui-edit', 'Edit game file', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(goops, 'src', 'ui', 'App.tsx') }, cwd: goops }],
  ['rule-kind', 'Edit game file', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(goops, 'src', 'ui', 'App.tsx') }, cwd: goops }],
  ['sketch-lint', 'Edit game file', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(goops, 'src', 'ui', 'App.tsx') }, cwd: goops }],
  ['plan-lint', 'Edit game file', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(goops, 'src', 'ui', 'App.tsx') }, cwd: goops }],
  ['plan-lint', 'Edit SPRINT.md', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(fw, '.planning', 'SPRINT.md') }, cwd: fw }],
  ['session-moments', 'Bash done', { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: fw }],
  ['session-moments', 'prompt', { hook_event_name: 'UserPromptSubmit', prompt: 'what is next?', cwd: fw, transcript_path: transcript }],
]
if (transcript) for (const hook of ['handoff-check', 'stop-plan-check', 'stop-cleanup', 'stop-unsaved']) { // (stop-check-fast left out: on changed code it runs check:fast for minutes)
  cases.push([hook, 'Stop', { hook_event_name: 'Stop', transcript_path: transcript, cwd: fw, stop_hook_active: false, last_assistant_message: 'probe' }])
}

const env = { ...process.env, BMUZ_FIRE_LOG: join(here, '.speed-firelog.jsonl') }
console.log(`hook               case                              median   max   (${runs} runs each)`)
for (const [hook, name, input] of cases) {
  const times = []
  for (let i = 0; i < runs; i++) {
    const t0 = Date.now()
    try { execFileSync('node', [join(H, `${hook}.mjs`)], { input: JSON.stringify(input), env, cwd: input.cwd, encoding: 'utf8', timeout: 400000, stdio: ['pipe', 'pipe', 'pipe'] }) } catch { /* a refusal / send-back exits 0 too; a crash still has a time */ }
    times.push(Date.now() - t0)
  }
  times.sort((a, b) => a - b)
  console.log(`${hook.padEnd(18)} ${name.padEnd(32)} ${String(times[Math.floor(runs / 2)]).padStart(6)} ms ${String(times[runs - 1]).padStart(6)} ms`)
}
