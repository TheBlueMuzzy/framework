// F182 — Rule inventory: how often each hook RULE fired (not just each hook), and samples to judge real / false / noise.
//   node rules-fired.mjs                    → table: rule id · count · sessions · first/last date
//   node rules-fired.mjs sample <ruleId> [n] [seed]  → n firings of that rule with what Claude was doing (from the transcript)
//   node rules-fired.mjs unmatched          → firings no rule pattern caught (to grow RULES)
// Reads ~/.claude/logs/bmuz-hooks-history.jsonl + bmuz-hooks.jsonl (made by config/bmuz/scripts/hook-history.mjs and
// hooks/lib.mjs logFiring). A firing's text is only its first 300 chars, so a Stop answer listing several problems is
// matched on what fits; each rule that matches anywhere in the text counts once for that firing.
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

const LOGS = join(homedir(), '.claude', 'logs')
const { transcripts } = await import(pathToFileURL(join(homedir(), '.claude', 'config', 'bmuz', 'scripts', 'hook-history.mjs')).href)

// [ruleId, hook, pattern on the text]
export const RULES = [
  ['GE1.kit-copy', 'guard-edits', /is this game's COPY of the framework/],
  ['GE2.pipe-check', 'guard-edits', /pipes a check into another command/],
  ['GE3.heredoc-backslash', 'guard-edits', /writes a code file through a heredoc/],
  ['GE4.stop-servers', 'guard-edits', /stop local servers with/],
  ['GE5.home-clutter', 'guard-edits', /straight in the home folder/],
  ['GE6.python-newline', 'guard-edits', /Python writes a code file in text mode/],
  ['GE7.frozen-warn', 'guard-edits', /is being extracted as/],
  ['GE8.backtick', 'guard-edits', /has a backtick inside double quotes/],
  ['GE9.npm-busy', 'guard-edits', /a running process uses this folder/],
  ['GG1.reset-hard', 'guard-git', /git reset --hard` throws work away/],
  ['GG2.force-push', 'guard-git', /force-pushing rewrites history/],
  ['GG3.branch-unmerged', 'guard-git', /has work that isn't merged|can't confirm `.*` is merged/],
  ['GG4.feature-on-main', 'guard-git', /commit with code \(.*\) on /],
  ['GG5.merge-main', 'guard-git', /merging .* into .*Only \/deliver|merges work into main|puts a released version back/],
  ['GG6.secrets', 'guard-git', /secrets \(passwords, keys\)/],
  ['GG7.discard', 'guard-git', /would throw away|`git (checkout|restore)[^`]*` would/],
  ['GG8.done-roadmap', 'guard-git', /: done" but ROADMAP\.md still shows/],
  ['GG9.done-state', 'guard-git', /: done" but \.planning\/STATE\.md hasn't changed/],
  ['GG10.done-reviewed', 'guard-git', /: done" but STATE\.md's "/],
  ['GG11.done-checked', 'guard-git', /has no "Checked:" line/],
  ['GG12.worktrees', 'guard-git', /a helper's workspace/],
  ['GG13.stage-state', 'guard-git', /is a stage commit, but/],
  ['CT1.typecheck', 'commit-typecheck', /type check failed/],
  ['CT2.fix-suite', 'commit-typecheck', /suite already red|"Fix /],
  ['LP1.no-smoke', 'live-push', /(puts code live|deploys the live site).*(no smoke pass|code changed since)|code changed since the/],
  ['LP2.open-p0', 'live-push', /open P0/],
  ['LE1.eslint', 'lint-edit', /^ESLint found/],
  ['LE2.npm-install', 'lint-edit', /npm install/],
  ['CU1.check-ui', 'check-ui-edit', /^check-ui found problems/],
  ['RK1.rule-kind', 'rule-kind', /^New rule line/],
  ['SL1.sketch', 'sketch-lint', /sketch/i],
  ['HC1.card-missing', 'handoff-check', /^You did work this turn, so end with the hand-off card/],
  ['HC2.feature-name', 'handoff-check', /A feature number always comes with its name/],
  ['HC3.sprint-header', 'handoff-check', /A sprint was archived this turn/],
  ['HC4.posted-time', 'handoff-check', /The progress line says "posted/],
  ['HC5.dead-link', 'handoff-check', /under \*\*Try it:\*\* don't answer/],
  ['HC6.no-screenshot', 'handoff-check', /You changed how the game looks/],
  ['HC7.feel-question', 'handoff-check', /end the card with its one feel question/],
  ['HC8.your-game', 'handoff-check', /Never say "your game"/],
  ['HC9.weighed', 'handoff-check', /picks without weighing/],
  ['SP1.sprint-untouched', 'stop-plan-check', /you committed work this turn, but .*wasn't touched/],
  ['SP2.ppp-republish', 'stop-plan-check', /the planner page was rebuilt/],
  ['SP3.lookback', 'stop-plan-check', /look-back/],
  ['SP4.done-unsaved', 'stop-plan-check', /a feature was approved \(`Fnn: done` commit\) but/],
  ['SP5.archive', 'stop-plan-check', /is ✅ in ROADMAP — (archive it|before archiving)/],
  ['SP6.tdd-content', 'stop-plan-check', /TDD\.md doesn't mention/],
  ['SP7.sketch-unsent', 'stop-plan-check', /sketch .* changed this turn, but the planner/],
  ['SP8.live-pass', 'stop-plan-check', /live-pass|is tagged but not on GitHub/],
  ['SC1.check-fast-red', 'stop-check-fast', /check:fast is failing/],
  ['SC2.check-fast-slow', 'stop-check-fast', /ran over \d+ minutes/],
  ['SU1.unsaved-stop', 'stop-unsaved', /./],
  ['SM1.stopping', 'session-moments', /stopping or switching machines/],
  ['SM2.context-80', 'session-moments', /\b(80|90)%/],
  ['SM3.decision-brief', 'session-moments', /DECISION question/],
  ['PL1.log-trimmed', 'plan-lint', /Moved \d+ old Log line/],
  ['PL2.sprint-vs-roadmap', 'plan-lint', /is in the sprint but ROADMAP says/],
  ['PL3.task-count', 'plan-lint', /has \d+ task\(s\)/],
  ['PL4.not-in-roadmap', 'plan-lint', /isn't in ROADMAP\.md/],
  ['PL5.ready-rule', 'plan-lint', /is ⏳ waiting, but everything it needs/],
  ['PL6.needs-order', 'plan-lint', /but needs F\d+\w*, which is/],
  ['PL7.log-long', 'plan-lint', /Log has \d+ entries/],
  ['PL8.resume-long', 'plan-lint', /RESUME HERE is \d+ lines/],
  ['PL9.check-line', 'plan-lint', /has no "Check:" line/],
  ['PL10.bugs-count', 'plan-lint', /"Open:" line says/],
  ['PL11.id-twice', 'plan-lint', /is used twice/],
  ['PL12.task-owner', 'plan-lint', /task should read/],
  ['PL13.carried', 'plan-lint', /## Carried/],
  ['PL14.graph', 'plan-lint', /graph in/],
  ['PL15.needs-unread', 'plan-lint', /"needs:" isn't read/],
  ['PL16.task-under-bug', 'plan-lint', /tasks under "## B/],
  ['PL17.name-format', 'plan-lint', /write it "F|the name ".*" is too long/],
  ['PL18.released-open', 'plan-lint', /inside a released milestone/],
  ['PL19.stray-file', 'plan-lint', /doesn't belong in \.planning/],
  ['PN1.producer', 'producer-notes', /./],
  ['CN1.crash-news', 'crash-news', /./],
  ['LV1.live-down', 'live-ping', /./],
  ['X.crash', '*', null], // kind stderr: the hook itself crashed
  ['X.spike', 'spike', /./],
]

export function load() {
  const read = (f) => existsSync(join(LOGS, f)) ? readFileSync(join(LOGS, f), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : []
  return [...read('bmuz-hooks-history.jsonl'), ...read('bmuz-hooks.jsonl')]
}

export function rulesOf(f) {
  if (f.kind === 'stderr') return ['X.crash']
  const ids = RULES.filter(([, hook, re]) => re && (hook === f.hook) && re.test(f.text)).map(([id]) => id)
  return ids
}

const firings = load()
const mode = process.argv[2]

if (!mode) {
  const by = {}
  for (const f of firings) for (const id of rulesOf(f)) {
    const r = by[id] ||= { n: 0, sessions: new Set(), first: f.t, last: f.t, projects: {} }
    r.n++; r.sessions.add(f.session || 'live'); r.last = f.t
    r.projects[f.project] = (r.projects[f.project] || 0) + 1
  }
  console.log(`${firings.length} firings\n`)
  for (const [id, hook] of RULES) {
    const r = by[id]
    const projects = r ? Object.entries(r.projects).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, n]) => `${p} ${n}`).join(', ') : ''
    console.log(`${id.padEnd(22)} ${hook.padEnd(16)} ${String(r?.n || 0).padStart(5)} ${String(r?.sessions.size || 0).padStart(4)}  ${r ? r.first.slice(0, 10) + '→' + r.last.slice(0, 10) : 'never'}  ${projects}`)
  }
}

if (mode === 'unmatched') {
  for (const f of firings.filter(f => !rulesOf(f).length)) console.log(f.hook, f.kind, '::', f.text.replace(/\s+/g, ' ').slice(0, 140))
}

if (mode === 'sample') {
  const [, , , id, n = '10', seed = '1'] = process.argv
  const hits = firings.filter(f => rulesOf(f).includes(id))
  // spread the sample over time: every k-th firing, offset by the seed
  const k = Math.max(1, Math.floor(hits.length / Number(n)))
  const picks = hits.filter((_, i) => i % k === (Number(seed) % k)).slice(0, Number(n))
  const paths = new Map(transcripts(join(homedir(), '.claude', 'projects')).map(p => [basename(p), p]))
  console.log(`${id}: ${hits.length} firings, showing ${picks.length}\n`)
  for (const f of picks) console.log(context(f, paths.get(f.session)) + '\n' + '-'.repeat(100))
}

// node rules-fired.mjs turnwork <ruleId> → for each Stop firing: did the turn REALLY do work? (handoff-check's "worked")
//   real edit = an Edit/Write outside the scratchpad / .scratch / memory folders · real commit = `git … commit` as a command
//   (not the word inside a grep, a file name like commit-typecheck, or a heredoc). Neither → the send-back was a false alarm.
if (mode === 'turnwork') {
  const id = process.argv[3]
  const paths = new Map(transcripts(join(homedir(), '.claude', 'projects')).map(p => [basename(p), p]))
  const tally = { realWork: 0, scratchOnly: 0, commitWordOnly: 0, nothing: 0, notFound: 0 }
  const examples = []
  for (const f of firings.filter(f => rulesOf(f).includes(id))) {
    const tools = turnTools(f, paths.get(f.session))
    if (!tools) { tally.notFound++; continue }
    const throwaway = (p) => /scratchpad|[\\/]\.scratch[\\/]|[\\/]memory[\\/]|[\\/]Temp[\\/]/i.test(p || '')
    const edits = tools.filter(t => ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(t.name))
    const realEdit = edits.some(t => !throwaway(t.input?.file_path))
    const shells = tools.filter(t => ['Bash', 'PowerShell'].includes(t.name)).map(t => String(t.input?.command || ''))
    const wordCommit = shells.filter(c => /\bgit\b[^\n]*\bcommit\b/.test(c)) // lib.isCommit
    const realCommit = wordCommit.some(c => /(^|[;&|(\n]\s*|\bcd\s[^;&|]*&&\s*)git(\s+-C\s+\S+)?\s+(-c\s+\S+\s+)*commit\b/.test(c) || /\bgit\s+(-C\s+\S+\s+)?commit\b/.test(c.replace(/"[^"]*"|'[^']*'/g, '')))
    if (realEdit || realCommit) tally.realWork++
    else if (edits.length) tally.scratchOnly++
    else if (wordCommit.length) { tally.commitWordOnly++; if (examples.length < 5) examples.push(wordCommit[0].replace(/\s+/g, ' ').slice(0, 140)) }
    else tally.nothing++
  }
  console.log(id, tally)
  for (const e of examples) console.log('  commit-word only:', e)
}

function turnTools(f, path) {
  if (!path) return null
  const entries = readFileSync(path, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  const i = entries.findIndex(e => e.timestamp === f.t)
  if (i < 0) return null
  // handoff-check's own turn = since the last prompt of any kind (a send-back's "Stop hook feedback" starts a new turn)
  const isPrompt = (e) => e.type === 'user' && !e.isMeta && (typeof e.message?.content === 'string' || (Array.isArray(e.message?.content) && e.message.content.length && e.message.content.every(b => b.type === 'text')))
  let s = i - 1
  while (s > 0 && !isPrompt(entries[s])) s--
  const tools = []
  for (let j = s; j < i; j++) {
    const c = entries[j].message?.content
    if (entries[j].type === 'assistant' && Array.isArray(c)) for (const b of c) if (b.type === 'tool_use') tools.push(b)
  }
  return tools
}

// What Claude was doing when the rule fired: the refused command (PreToolUse), or the turn's tools + final words (Stop)
function context(f, path) {
  const head = `${f.t} ${f.project} ${f.session}\n  RULE SAID: ${f.text.replace(/\s+/g, ' ').slice(0, 160)}`
  if (!path) return head + '\n  (transcript not found)'
  const entries = readFileSync(path, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
  const at = entries.findIndex(e => e.timestamp === f.t && JSON.stringify(e).includes(f.text.slice(0, 40).replace(/["\\]/g, '').slice(0, 20)))
  const i = at >= 0 ? at : entries.findIndex(e => e.timestamp === f.t)
  if (i < 0) return head + '\n  (entry not found)'
  const out = [head]
  if (f.event === 'PreToolUse' || f.event === 'PostToolUse') {
    // the tool call just before
    for (let j = i; j >= 0 && j > i - 30; j--) {
      const c = entries[j].message?.content
      const use = Array.isArray(c) && c.find(b => b.type === 'tool_use')
      if (use && entries[j].type === 'assistant') {
        const inp = use.input || {}
        out.push(`  TOOL ${use.name}: ${(inp.command || inp.file_path || JSON.stringify(inp)).slice(0, 700)}`)
        break
      }
    }
  } else {
    // the turn: from the last real prompt to here
    // (the send-back itself shows up as a "Stop hook feedback" prompt with the same time — skip those, find the real one)
    const realPrompt = (e) => e.type === 'user' && !e.isMeta && typeof e.message?.content === 'string' && !/^Stop hook feedback/.test(e.message.content)
    let s = i - 1
    while (s > 0 && !realPrompt(entries[s])) s--
    const prompt = entries[s]?.message?.content
    out.push(`  PROMPT: ${String(prompt || '').replace(/\s+/g, ' ').slice(0, 200)}`)
    const tools = []
    let last = ''
    for (let j = s; j < i; j++) {
      const c = entries[j].message?.content
      if (!Array.isArray(c) || entries[j].type !== 'assistant') continue
      for (const b of c) {
        if (b.type === 'tool_use') tools.push(`${b.name}(${String(b.input?.command || b.input?.file_path || '').replace(/\s+/g, ' ').slice(0, 90)})`)
        if (b.type === 'text') last = b.text
      }
    }
    out.push(`  TOOLS (${tools.length}): ${tools.slice(-12).join(' | ')}`)
    out.push(`  LAST TEXT: ${last.replace(/\s+/g, ' ').slice(0, 300)}`)
    // what came after: the next assistant text (did the send-back change anything?)
    for (let j = i + 1; j < entries.length && j < i + 40; j++) {
      const c = entries[j].message?.content
      if (entries[j].type === 'assistant' && Array.isArray(c)) {
        const t = c.find(b => b.type === 'text' || b.type === 'tool_use')
        if (t) { out.push(`  NEXT: ${t.type === 'text' ? t.text.replace(/\s+/g, ' ').slice(0, 200) : 'tool ' + t.name + ' ' + String(t.input?.command || t.input?.file_path || '').slice(0, 120)}`); break }
      }
    }
  }
  return out.join('\n')
}
