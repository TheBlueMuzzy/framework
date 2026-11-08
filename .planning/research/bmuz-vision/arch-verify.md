# Arch verify: which in-Claude-Code mechanism can hold the step list

Facts only, no recommendation. Checked 2026-11-08 on Claude Code v2.1.314 (Windows).

Sources, short names used below:
- **SKILL** = the bundled `plugin-authoring` skill: `%TEMP%/claude/bundled-skills/2.1.314/<hash>/plugin-authoring/SKILL.md`. It is generated per build; it is not in `~/.claude`.
- **REF** = `reference.md` in the same folder.
- **TYPES** = `types/claude-code.d.ts` (22,984 lines) in the same folder.
- **EX** = `examples/` in the same folder (`tool-call.ts`, `pane.tsx`, `band.tsx`, `pane.test.tsx`).
- **WA** = the bundled `workflow-authoring` skill text.
- Docs pages under https://code.claude.com/docs/en/: `plugins/mods/overview`, `/api`, `/events`, `/reference`, `/interface`; `workflows`; `hooks`; `plugins/overview`, `plugins/install`, `plugins/loading`, `plugins/host-marketplace`, `plugins/components`; `env-vars`.

---

## 1. Mods: capabilities

**State across turns and sessions: yes, three ways.**
- `$.state`, for this session only. It survives a hot reload. TYPES: "Named values held by the host for the session … plain data that survives a hot reload … Persist through `$.store`."
- `$.store`, across sessions. It has `get` / `set` / `delete` / `keys`.
  - mods/reference: "A key-value store that every session on the machine shares."
  - Size cap: "`$.store` | 4 MiB of JSON in total".
  - mods/interface: "A `get` followed by a `set` isn't atomic … the second write replaces the first."
  - It is per machine. Nothing in the docs says it syncs between machines.
- `$.fs`, plain files. It has `read` / `write` / `list` / `exists` / `stat`. mods/reference: "`write` isn't atomic." A mod can therefore read and write a project's STATE file directly.
- Module variables do not survive a reload. SKILL: "`$.state` … and `$.store` … stay; the module's own variables start over."

**Inject the next instruction: yes.**
- `$.prompt.submit({ text, asUser? })`. mods/api: "The call waits until the session is idle and then starts a new turn. It resolves when that turn starts." REF: "never folded into a running turn".
- `prompt.submit` hook. It can rewrite the prompt with `next({ ...e, text })` or drop it with `{ drop }`.
- `prompt.compose` hook. It can add a system-prompt section (SKILL table).
- `$.session.append({ message: { type: 'user', content } })`. REF: "it REALLY appends: a user-role row the person does not see as typed … the model reads it … in a running turn's requests from the loop's next top." This one reaches a turn that is already running.

**Block or hold a tool call: yes.**
- Block: `on('tool.call', { tool }, …)` returns `{ deny: '…' }` (EX `tool-call.ts`).
- Hold: mods/events: "A `tool.call` hook can `await` before it calls `next` … the tool call stays pending until then."

**Show buttons or questions and wait for the answer: yes.**
- `$.ui.ask(question, options)`. TYPES: "Asks the user `question` in the engine's own AskUserQuestion dialog and resolves to the label they chose, or the text typed under 'Other' … Rejects when dismissed, and in a `-p` run."
- `Button` elements in a `Pane` or `AbovePrompt` band. Each press raises `ui.press` (REF).

**Timers: yes.**
- `$.clock.after(ms, fn)`, `$.clock.every(ms, fn)` and `$.clock.sleep`.
- REF: timers "run until cancelled or until the module reloads."

**The 10 s limit, exactly:**
- TYPES `HookBudget`: `ms: 10_000` is "A hook's budget per dispatch, from its call to its return; past it the hook is absent (its `.catch` asked, else `next(e)` run on its behalf)."
- `catchMs: 1_000`; `lingerMs: 5_000`.
- What counts: "the clock stops while a `next(e)` call or any `$` call of the hook's is in flight (a `$.clock` wait excepted)."
- mods/reference: "10 seconds, or 50 milliseconds for a `prompt.edit` hook."
- So waiting on `$.ui.ask` or `$.model.complete` is free, while an await on the mod's own promise counts (mods/events).
- **It fails open.** REF: "Without the handler, what the guard judges goes on when it throws, answers a wrong shape or outlasts its budget." The fix is `.catch(($,e,next) => next.called ? next(e) : { deny })`.

**Where mods run:**
- mods/overview: "Mods work in the Claude Code CLI, the Code tab of the Claude Desktop app, and the VS Code extension."
- Table, Desktop: "The Code tab of the Desktop app, except in a WSL session | Yes".
- Table, WSL: "WSL session … No, because plugins aren't available in WSL sessions".
- Table, headless: "`claude -p` and the Agent SDK | Yes | No" (hooks yes, drawing no).
- Windows CLI: no OS restriction is stated. First-hand, this Windows v2.1.314 build loaded the skill and wrote its types. I did not load a mod here.

**Subagents: yes, with one catch.**
- `$.agent.spawn({ prompt, subagentType?, model?, … })`. Its result type (TYPES `AgentSpawnResult`) is only `{ model, agentId?, teammateId? }` or `{ deny }`. It does **not** include the subagent's final text.
- REF says "its answer is its `turn.complete`". mods/events: "`turn.complete` … `e.answer` is Claude's final text … A subagent's turn fires it with `e.agentId` set."
- So the result comes back by matching `turn.complete` on `agentId`. I did not test this end to end.
- `$.agent.list()` gives each agent's status.
- mods/api: a spawn made after the user interrupts "Resolves with `{ deny }`" until the user's next input.

## 2. Mods: working examples

The skill ships 4 examples that its text says load, validate and type-check on this build:
- `tool-call.ts`: an Edit guard plus a Bash status line.
- `pane.tsx`: a pane, a slash command and `$.state`.
- `band.tsx`: a band above the prompt, `prompt.submit` and a toast.
- `pane.test.tsx`: a test.

None of them is a step machine. Below is their shape, put together into the BMUZ idea. **This composition is mine and untested.**

```ts
const step = atom({ plugin:'bmuz', key:'step' }, null)           // pane.tsx pattern
register = on => {
  on('session.start', async ($,e,next) => {                     // pane.tsx
    await $.command.register({ name:'develop', description:'…' })
    const s = await $.fs.read('<project>/STATE.json')           // or $.store.get
    await $.state.set(step, JSON.parse(s)); return next(e) })
  on('tool.call', async ($,e,next) => {                         // tool-call.ts
    const cur = await read($, step)
    return allowedIn(cur, e) ? next(e) : { deny:`step ${cur.id} first` }
  }).catch(($,e,next) => next.called ? next(e) : { deny:'guard failed' })
  on('turn.complete', async ($,e,next) => {
    const cur = await read($, step)
    if (cur.gate) { const a = await $.ui.ask(cur.gate.q, cur.gate.opts)  // gate
                    if (a !== 'Approve') return next(e) }
    const nxt = advance(cur); await update($, step, () => nxt)
    await $.fs.write('<project>/STATE.json', JSON.stringify(nxt))
    void $.prompt.submit({ text: nxt.instruction })              // next step
    return next(e) })
  on('ui.render', { component:'Pane', requestId:'bmuz' }, …)     // checklist pane
}
```

## 3. Workflows

**Start a workflow and learn its result:**
- A saved workflow or a plugin workflow becomes a slash command. workflows: "Plugin workflows are namespaced by the plugin name … runs as `/acme-tools:release-audit`." Saved ones "appear in `/` autocomplete".
- The Workflow tool returns immediately. TYPES tool result: `status: "async_launched" | "remote_launched"`, `taskId`, `runId`, `transcriptDir`, `scriptPath`.
- The end arrives later. workflows: "When the run finishes, the report appears in your session." TYPES: that arrival is a `task-notification` row (`e.props.task`: `id`, `status`).
- The script's return value is the result. The journal is at `<transcriptDir>/journal.jsonl` (WA).
- **Unverified:**
  - whether a mod can launch one through `$.tool.call({ tool:'Workflow', … })` or `$.command.run`. TYPES shows no block on it, and the docs say nothing.
  - whether a mod can read the finish through `session.append` / `UserMessage` with origin `task-notification`.

**Files between stages: yes, through agents.**
- workflows: "No direct filesystem or shell access from the workflow itself | Agents read, write, and run commands."
- So an `agent()` writes the file and a later stage, or a later workflow, reads it. Values can also pass in through `args`.

**Mid-run gates: no.** workflows: "No mid-run user input … For sign-off between stages, run each stage as its own workflow."

**Stalls:**
- workflows: "An agent whose output stops arriving for long enough starts over from the same prompt … without the stalled attempt's transcript. Files the stalled attempt already changed stay changed."
- Restarts: "An agent restarts at most five times … If the sixth attempt stalls as well, the `agent()` call fails" (`agent stalled on all 6 attempts`).
- Per-agent override: `agent(prompt, { stallMs: 1800000 })`.
- Global setting: env-vars: "`CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS` … Default `600000` (10 minutes)", covering workflow agents from v2.1.286.
- A failed agent inside `parallel()` / `pipeline()` gives `null`. One awaited directly ends the run.
- Resume uses `resumeFromRunId`, same session only. Completed agents come back from cache.
- Exit: workflows: "If you background your session or exit Claude Code while a workflow run is in progress, the run doesn't continue on its own."

**Plans:** workflows: "available on all paid plans, with Anthropic API access, and on Amazon Bedrock … On Pro, turn them on from the Dynamic workflows row in `/config`." They can be turned off with `"disableWorkflows": true` by the user or an organisation.

## 4. Settings hooks enforcing "the next step must be X"

**Blocking: yes, any tool.**
- `PreToolUse` returns `permissionDecision` `allow` / `deny` / `ask` / `defer` and can rewrite `updatedInput`.
- hooks: it fires "on every tool call … except `EndConversation`".
- A hook can read a state file and deny calls that don't match the current step.
- It can block but not force: a hook cannot make Claude call a given tool.

**Limits:**
- **Stop cap.** hooks: "Claude Code applies an 8-consecutive-continuation cap: after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn. The count … resets each time Claude calls a tool." The cap can be raised with `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`. The `stop_hook_active` input flags a continuation.
- **Fails open by default.** hooks: "On most events, when a hook fails or times out, Claude Code still carries out the action … set `"onFailure": "block"`" (v2.1.295+). Also: "a timed-out … hook doesn't block the tool call … don't count on a stalled hook to act as a gate."
- **Timeouts.** "Defaults: 600 for `command`, `http`, and `mcp_tool`; 30 for `prompt`; 60 for `agent`." `UserPromptSubmit` has "a default timeout of 30 seconds."
- **UserPromptSubmit fires on more than typed prompts.** It also runs on scheduled tasks, background subagents reporting back, and cross-session messages.
- **Windows.** A shell-form hook without Git Bash runs in PowerShell. A failing `PreToolUse` hook there "can instead block the tool call."
- **Can be switched off.** `disableAllHooks` stops user, project and plugin hooks; it does not stop managed ones.

## 5. One plugin, everything inside

**Contents:**
- plugins/overview lists skills, agents, hooks, "A hooks module … A plugin that has one is called a mod", and MCP servers.
- plugins/components adds commands, LSP, `bin/` executables ("puts this folder on the `PATH`"), settings, themes, channels and monitors.
- `scripts/` is "a convention".
- workflows: "Place the script in a `workflows/` directory at the plugin root."
- So yes, one plugin can hold all of them.

**Install:**
- One line: `/plugin install <mod> --marketplace <owner>/<repo>`, or `claude plugin install …` (REF).
- Desktop: "+ next to the prompt box, then Plugins, Add marketplace" (REF).
- The terminal command works on Windows and Mac. A private repo needs a git credential already set up: "the install never prompts for one."

**Updates:**
- plugins/install: "Plugins update automatically when the marketplace they came from has auto-update turned on."
- Defaults: "**Off by default**: every other marketplace, including … third-party marketplaces." Only official and claude.ai-added marketplaces are on.
- Timing: loading: "after you send your first message, Claude Code waits a random delay of up to ten minutes" and then updates on disk. The running session keeps its old version until `/reload-plugins` or the next launch.
- A new version reaches users only when it changes: host-marketplace: "a user gets a new copy of a plugin only when its computed version changes". Either bump `version` or leave it out so users track commits.
- **The author cannot force an update.** It needs one of these:
  - the user's `/plugin` Marketplaces "Enable auto-update" toggle;
  - an admin's `autoUpdate` in managed settings;
  - `autoUpdate` on an `extraKnownMarketplaces` entry "in a settings file" (loading). A project's `.claude/settings.json` might carry this. That reading is unverified.

## 6. Plan or auth barriers

- **Mods:** no plan requirement is stated anywhere I read.
  - mods/overview: "Mods are on by default … v2.1.287 or later"; Desktop from v2.1.286.
  - "A mod's hooks run … whichever provider serves the model, including Amazon Bedrock …"
  - Model calls a mod makes are "billed to the session's credentials".
  - Users or organisations can stop mods with `--safe-mode`, `disableAllHooks`, `--bare` or `allowManagedModsOnly`.
  - Hot-loading a mod Claude writes in a session needs a one-time "Turn them on" answer (SKILL). It is off under `claude -p` and in untrusted workspaces.
  - The API is "EARLY ACCESS: this surface may change between releases without notice" (TYPES line 4).
- **Workflows:** "all paid plans" plus API, Bedrock, Vertex and Foundry. Pro users must opt in through `/config`. The default size guideline is `small` on Pro.
- **Unverified:** whether a claude.ai Free account can run Claude Code at all. The setup page I read lists no account requirement.
