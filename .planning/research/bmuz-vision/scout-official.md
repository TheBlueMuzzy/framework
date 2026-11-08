# Scout: official Claude Code / Anthropic features not yet in the BMUZ plan

Read 2026-11-08. The whole docs index (`code.claude.com/docs/llms.txt`, 228 pages) was downloaded and searched. Also read: the docs changelog (every "Added" line from v2.1.129 to v2.1.319, 6 Nov 2026), the weekly "What's new" digests (w13 to w37), and 13 posts from anthropic.com/engineering. Quotes are verbatim. **UNVERIFIED** = I didn't find it in the docs. Nothing here was tested on this PC.

Already covered in `arch-options.md` / `arch-verify.md`, so left out here: skills basics, plugins and marketplaces, hook basics, mods basics, workflows, managed settings, subagents, output styles (tone only), agent teams, headless / Agent SDK, Managed Agents, scheduled tasks, /loop, Remote Control, Channels, /goal, the Stop cap, `onFailure: "block"`.

Docs pages are under `https://code.claude.com/docs/en/`, so the URLs below are short forms (`skills`, `plugins/components` …). "CL x.y.z" = a changelog entry for that version.

---

## A. What matters most (it changes or sharpens the plan)

1. **Ship BMUZ through Anthropic's directory and updates arrive on their own.** This contradicts ARCHITECTURE "Converting what exists", which says auto-update is off.
   - `plugins/publish`, routes table: Anthropic's directory reaches "People who add it on claude.ai or in Cowork. It also loads in their Claude Code sessions through account sync". It needs "A GitHub repository holding the plugin and a paid claude.ai plan to submit from". Do users get updates automatically? "**Yes**, after the version you push is published". Your own marketplace: "**Off**".
   - Catch 1: `plugins/loading` says "a synced plugin's skills, agents, hooks, MCP servers, and LSP servers all load". It doesn't mention mods, workflows, monitors or `bin/`. **UNVERIFIED** whether a mod loads when the plugin arrives by sync.
   - Catch 2: `plugins/components` says "claude.ai and Cowork don't install a plugin that has a top-level `bin/` directory".
   - What it changes: the "/firstsetup switches on auto-update" step goes away for directory users. Scripts must live in `scripts/` (or be called by path), not in `bin/`. Add "a mod in a synced plugin" to the proof list.

2. **A plugin can carry Muzzy's "About me" partner rules for every user.** `plugins/components`: "Claude Code doesn't load a `CLAUDE.md` at the plugin root". Two documented ways replace it:
   - An output style with `force-for-plugin: true`, which will "apply this style automatically whenever the plugin is enabled, without requiring users to select it. Overrides the user's `outputStyle` setting" (`output-styles`). Keep `keep-coding-instructions: true`, or Claude loses its built-in engineering instructions.
   - The plugin's `settings.json` key `agent`, which "run[s] one of the plugin's own agents as the main thread". That agent's `initialPrompt` is "Auto-submitted as the first user turn when this agent runs as the main session agent" (`sub-agents`). That's a documented way to run "resume here" at every session start, with no hook. Caveat: "a user's own `agent` in `~/.claude/settings.json` overrides yours".
   - What it changes: the rulebook table needs a row for "always-on persona and plain-English rules → forced output style (plus a mod `prompt.compose` if it must be enforced)".

3. **Dynamic context injection gives skills a no-mod engine.** `skills`: "The `` !`git diff HEAD` `` line uses dynamic context injection: Claude Code runs the command and replaces the line with its output before Claude sees the skill content". A `/develop` skill whose body is `` !`node bmuz.js next` `` gets the current step, written by the script from the pipeline file, before Claude reads anything. The skill frontmatter `shell: powershell` covers Windows.
   - This makes option B (the fallback) much stronger: the script, not Claude's memory, picks the step every time a skill runs.
   - Catch: "In any other session on your machine, Claude Code doesn't run `!` commands" for skills synced from claude.ai (`skills`, lines on synced skills), and Cowork replaces them with a placeholder. So this works for marketplace installs, maybe not for directory/synced installs. **UNVERIFIED** for plugins that arrive by sync.

4. **`/bug` and `/checkup` collide with built-in names. Fix this before shipping.**
   - `commands`: "`/bug [report]` | Report a bug or share your conversation" (a built-in), and `/doctor` "Alias: `/checkup`".
   - `skills`: "Your skill replaces the bundled command, but not its aliases", and for a plugin skill, "The bare `/fancy` also invokes the skill unless another command already uses that name".
   - So in a plugin, typing `/bug` opens Anthropic's feedback dialog, and `/checkup` probably runs `/doctor`. Users would have to type `/bmuz:bug`.
   - Today Muzzy's personal `bug` skill wins only "In a local terminal session".
   - Rename both (for example `/bugs` and `/bmuz-checkup`), or accept the prefix.

5. **The task list is off by default on the current models.** `tools-reference`: "The task-tracking tools … are available by default only on Opus 4.7, Sonnet 4.6, Haiku 4.5, and earlier models … On newer models, Claude keeps track of multi-step work without a written checklist". Turning them on needs `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` (in background and cloud sessions they're always on).
   - Don't build BMUZ's step display on TaskCreate. The `TaskCompleted` hook ("Use this to enforce completion criteria like passing tests … before a task can close", `hooks`) only fires if the tools exist.
   - The pipeline file plus the mod band stays the right holder.

6. **Anthropic's own research warns about "options with my pick first".** "How AI agents shape experts' judgment calls" (anthropic.com/research/agents-judgment-calls, 27 Oct 2026): "analysts went with their agent's lean 86% of the time", and "77% of analysts used the agents' own arguments … but only 15% credited the agent". Their suggestion: "Agents could make the best case for each option, or ask experts for their own view before offering one. … Agents would need to raise only the decisions that matter most".
   - This **contradicts** CLAUDE.md "a decision is options with my pick first" for *taste* gates (V22).
   - Suggestion: at taste gates (design, feel, scope), ask for Muzzy's view first or give the best case for each option, and keep "my pick first" for engineering calls, which are Claude's anyway.

7. **Overnight runs: three settings stop silent stalls (V24).**
   - `askUserQuestionTimeout` (`60s`, `5m`, `10m`). A question left unanswered then "closes on its own: it submits any options you'd already selected and tells Claude you may be away from your keyboard" (`tools-reference`). But "The timer never starts … while the session is connected to Remote Control", and "permission prompts … never auto-resolve on idle".
   - `permissions.denyInsteadOfPrompting` (CL 2.1.319, 6 Nov 2026): "a tool call that would wait on a permission prompt is denied and the turn continues, in terminal sessions, subagents and teammates". This is the missing piece for "never stalls on a permission prompt". It's too new to be on the settings page yet.
   - `CLAUDE_CODE_RETRY_WATCHDOG=1`: "Retries `429` and `529` capacity errors indefinitely" (`env-vars`).
   - Also, usage-limit auto-continue is on by default in interactive sessions: "Claude Code waits in the open session and continues the task on its own after the limit resets" (`interactive-mode`).
   - What it changes: autonomous mode should turn these on (a project settings file can carry them; a plugin can't).

8. **Background sessions keep running with the terminal closed.** `agent-view`: "Background sessions don't need any terminal open to keep working. A separate supervisor process runs them, so you can close agent view, close your shell". The workflow caveat still holds: a workflow run "doesn't continue on its own" after you background the session; it needs a relaunch (`workflows`).
   - Overnight sprints could run as a background session (`claude --bg` / `/fork`) watched from `claude agents`.
   - **UNVERIFIED:** whether mods run inside background sessions. The mods docs list CLI, Desktop, VS Code, `-p` and Remote Control, and say nothing about background sessions. Add it to the proof.

9. **Workflow opt-in rule: a risk for proof step 8.** `workflows`: "The keyword is an opt-in only in a prompt you type yourself", and "a prompt passed with `-p`", "a scheduled task prompt" and SDK prompts not stamped as human are *not* opt-ins.
   - Saved and plugin workflows started as `/plugin:name` are a separate route and aren't covered by this rule.
   - **UNVERIFIED** whether a mod's `$.prompt.submit({ asUser: true })` or a mod starting a saved workflow counts as typed. The engine→workflow link may need a saved workflow command, not "use a workflow" text.

10. **Engineering-blog lessons that fit the plan.**
    - Keep state in JSON, not Markdown: "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files" (effective-harnesses-for-long-running-agents).
    - Use a separate, skeptical reviewer: "tuning a standalone evaluator to be skeptical turns out to be far more tractable than making a generator critical of its own work" (harness-design-long-running-apps).
    - Agree a sprint "contract" before building.
    - Re-check the harness when models change: "every component in a harness encodes an assumption about what the model can't do on its own, and those assumptions are worth stress testing".

---

## B. Things that contradict or weaken the current plan

| Plan says | Official source says | Effect |
|---|---|---|
| "/firstsetup switches on auto-update (it's off by default for non-Anthropic plugins)" | Directory listing: updates "Yes" (`plugins/publish`) | Directory is a better route (watch the `bin/` and mod-sync catches) |
| Option B "can block wrong steps, can't drive the next one" | `` !`cmd` `` injection lets a script write the step into the skill (`skills`) | B is closer to C than the table shows |
| Commands `/bug`, `/checkup` | Built-in `/bug`; `/checkup` is `/doctor`'s alias (`commands`) | Rename before shipping |
| "Hard safety … hook (small set)" (V42–V44) | Auto mode (default since v2.1.283, `permission-modes`) already blocks "Force push", "`git reset --hard` …", "Committing or pushing a change that would send secrets" | The hooks still matter: auto mode is a classifier, users can switch it off, and "a boundary can be lost if context compaction removes the message". But the set could be smaller and tested against auto mode |
| CLAUDE.md "options with my pick first" | agents-judgment-calls: 86% deferral to the agent's lean | Change it for taste gates |
| Status band only via mod | Plugin settings: only `agent` and `subagentStatusLine` take effect (`plugins/components`), so a plugin can't ship a main status line | Mod band stays the only plugin-shipped status display. A status line needs the user's settings (firstsetup could write it) |
| Sandbox as security help | "On native Windows, Claude Code runs commands unsandboxed" (`sandboxing`). Mods don't run in WSL Desktop sessions | The sandbox is out for Windows users. Rely on hooks plus auto mode |
| Rewind as the "undo this session" (CLAUDE.md) | "A file that only Bash commands changed isn't tracked", and subagent edits to other files stay (`checkpointing`) | Rewind is unreliable for BMUZ: most work runs in helpers and scripts. Commit-per-task stays the real undo |
| "auto-memory isn't synced" | Confirmed: "Auto memory is machine-local … not shared across machines" (`memory`) | No change. STATE.md stays |

---

## C. Full catalogue by BMUZ part

Each entry gives: what it is (plain words) · source + quote · the BMUZ part it helps · whether it changes the plan.

### C1. Holding steps / the engine

- **Dynamic context injection (`` !`cmd` ``)**
  - What: a script's output is pasted into a skill before Claude reads it.
  - Source: `skills`: "Claude Code runs the command and replaces the line with its output before Claude sees the skill content".
  - Helps: the engine fallback (B), and thin stage skills.
  - **Yes** (see A3).
- **Skill `arguments` / `$ARGUMENTS` / `$0`**
  - What: named inputs for a skill.
  - Source: `skills`: "Named positional arguments for `$name` substitution".
  - Helps: `/sketch <question>`, `/bug <text>` without prose parsing.
  - Small.
- **Skill `disallowed-tools`**
  - What: removes tools while a skill runs.
  - Source: `skills`: "Use for autonomous skills that should never call certain tools, such as `AskUserQuestion` for a background loop".
  - Helps: overnight flows can't stall on a question.
  - Small, useful.
- **Skill `context: fork` + `background: false`**
  - What: the skill runs as a helper, and the caller waits for its result.
  - Source: `skills`: "Set to `false` to wait for the forked subagent's result in the turn that invoked the skill".
  - Helps: "Flow" steps when workflows aren't available (Pro without the opt-in, or Free).
  - Maybe. It's a cheaper rung between script and workflow.
- **Skill `paths`**
  - What: a skill loads only when matching files are touched.
  - Source: `skills`: "Claude loads the skill automatically only when working with files matching the patterns".
  - Helps: r3f, game-ui and other craft skills; context cost.
  - Small.
- **Path-scoped rules `.claude/rules/*.md` with `paths:`**
  - What: rule files that load only for matching files.
  - Source: `memory`: "path-scoped rules, which load only when Claude works with matching files".
  - Helps: per-game "tweakables live in content/" rules without hooks.
  - Note: a plugin can't ship CLAUDE.md, and the docs don't mention rules in plugins (**UNVERIFIED**), so this is for project files only.
- **Mod `$.tool.register`**
  - What: the mod adds a real tool Claude can call (e.g. `bmuz_next_step`, `bmuz_done`).
  - Source: `plugins/mods/api` "Add a tool"; CL 2.1.293: "`isDeferred` … `false` lists the tool's schema in the prompt from the start".
  - Helps: the engine API Claude uses to report "step done" instead of free text.
  - **Yes.** A cleaner link than parsing `turn.complete`.
- **Mod `tool.check` with `decider: "person"`**
  - What: only a human can approve the action.
  - Source: CL 2.1.304: "only the permission dialog or a host's callback can approve the ask, and it is refused with the mod's reason where nobody can be asked".
  - Helps: the publish/release gate (V44); overnight safety.
  - **Yes.** It is the hard "no publish without OK" in the engine.
- **Mod `$.model.fork` with `effort`**
  - What: a quick side model call at low effort.
  - Source: CL 2.1.318.
  - Helps: cheap classification (e.g. "is this message a taste question?").
  - Small.
- **Mod `agent.spawn` hook can rewrite workflow agents' prompt and model**
  - Source: CL 2.1.300: "Added support for rewriting a workflow agent's `prompt` and `model` in the `agent.spawn` mod hook".
  - Helps: the engine can inject the pipeline step context into every workflow agent.
  - Maybe.
- **Mod `$.ui.view({ agentId })`**
  - What: shows a helper's transcript on request.
  - Source: CL 2.1.300.
  - Helps: a "watch this helper" button in the band.
  - Small.
- **Mod tests: `claude plugin test`**
  - What: automated tests for a mod "with no session, sign-in, or network" (`plugins/mods/test`). It "fires the events your hooks handle and checks what the hooks did … and press buttons".
  - Helps: proof items 1, 2 and 6 can be automated, not just watched.
  - **Yes.** Add it to the proof plan.
- **`claude plugin validate --json` lists gating hooks without `.catch`**
  - Source: CL 2.1.290: "each hook a mod registers at a gating site is listed with whether it has a `.catch` (`gatingHooks`)".
  - Helps: the "mod fails open" weak spot can be checked mechanically.
  - **Yes.** Add to plan-lint / CI.
- **Plugin `agent` + `initialPrompt`**: see A2.
  - Helps: session start / resume without a hook.
  - **Yes.**

### C2. Gates and asking the user

- **AskUserQuestion behaviour**
  - Source: `tools-reference`: "Questions stay open until you answer them by default"; typed answers are relayed "with neutral wording so Claude follows what you wrote, including a request to wait or explain first".
  - Helps: gates in the skill-driven path.
  - No change.
- **`askUserQuestionTimeout`**: see A7.
  - Helps: autonomous mode.
  - **Yes.**
- **MCP elicitation**
  - What: a *server* (not Claude) asks the user a form question during a tool call.
  - Source: `mcp`: "MCP servers can request structured input from you mid-task using elicitation … Claude Code displays an interactive dialog". There are form mode and URL mode, and cloud sessions show it as a card.
  - Helps: a program-held gate without a mod (a tiny BMUZ MCP server whose `approve_step` tool asks the user). It also works where mods can't draw.
  - Maybe. It's a third engine option worth one line in the options table. Hooks: `Elicitation` / `ElicitationResult`.
- **Plan mode / ExitPlanMode**
  - What: Claude shows a plan, you approve it, and only then does it edit.
  - Source: `tools-reference`: "Presents a plan for approval and exits plan mode"; `/plan [description]` (`commands`). "permission prompts, including plan approval, never auto-resolve on idle".
  - Helps: the Define "approve the plan" gate; the per-feature build plan.
  - Maybe. It's a built-in gate UI that already exists.
- **Artifact comments → session**
  - What: a comment sent with "Send to Claude" on a published page reaches the live session.
  - Source: `artifacts`: "When someone who can edit the artifact sends a comment to Claude, it reaches your session right away".
  - Helps: approving or tweaking from the PPP planner page or a sketch tab, including from a phone browser.
  - Maybe. Docs describe it with org sharing; **UNVERIFIED** for a private Pro artifact the owner comments on.
- **Artifact "Copy as prompt" pattern**
  - Source: `artifacts`: "An artifact can act as a lightweight editor for a decision you then send back to Claude … Add a 'Copy as prompt' button".
  - Helps: the sketch "Copy values for Claude" is the officially recommended pattern.
  - No change (it confirms the design).
- **Deep links `claude-cli://open?repo=…&q=…`**
  - What: a URL opens Claude Code in the right folder with a prompt typed in (not sent).
  - Source: `deep-links`: "The prompt is populated but not sent until you press Enter". It works on Windows ("`HKEY_CURRENT_USER\Software\Classes\claude-cli`").
  - Helps: PPP planner buttons ("Start /develop F12", "Open bug B7") and STATE hand-offs.
  - **Yes.** Cheap and big for non-technical users.
- **Desktop "suggested task" cards**
  - What: when Claude spots side work, a card offers **Start** (in another session) or **Do it here**.
  - Source: `desktop` "Start a task that Claude suggests".
  - Helps: the "keep Muzzy focused, log mid-feature bugs" rule (it maps onto it).
  - Maybe.
- **`/btw` side questions**
  - Source: `commands`: "Ask a side question about the current session without adding to the conversation".
  - Helps: Muzzy asks "what's that?" mid-sprint without derailing the step.
  - Tell users about it in /bmuz.

### C3. Never stalls / long and overnight runs

- `askUserQuestionTimeout`, `permissions.denyInsteadOfPrompting`, `CLAUDE_CODE_RETRY_WATCHDOG`, usage-limit auto-continue: see A7.
- **Desktop "Auto-continue when limits reset"**
  - Source: w33 digest: "check **Auto-continue when limits reset** on the limit card and the app retries the interrupted turn".
  - Helps: Desktop users.
- **Background sessions + agent view**: see A8.
  - `claude agents` shows "what's running, what needs your input, and what's done". The `Notification` hook fires `agent_needs_input` / `agent_completed` (CL 2.1.198).
  - Helps: the overnight sprint motor and the morning check.
  - **Yes**, if mods run there (unverified).
- **`/fork [prompt]`**
  - Source: `commands`: "Copy the current conversation into a new background session and keep working here".
  - Helps: run a sprint in the background while talking design in the foreground.
  - Maybe.
- **`asyncRewake` hooks**
  - Source: `hooks`: "runs in the background and wakes Claude on exit code 2".
  - Helps: a long test or build watcher that wakes Claude only on failure.
  - Small.
- **Plugin monitors (`monitors/monitors.json`)**
  - What: "a shell command that runs in the background for the whole session. What it prints reaches Claude as notifications" (`plugins/components`). Limits: "plugin monitors don't start in non-interactive mode with the `-p` flag"; they "run … outside the sandbox".
  - Helps: watch the game's dev-server console during `/play` without a skill remembering to.
  - Maybe. This is the official version of BMUZ's "watch the console".
- **Monitor tool**
  - What: Claude watches a log, CI or WebSocket feed and reacts (`tools-reference`).
  - Helps: `/play` and live-playtest.
  - No change (already usable).
- **MCP tool calls move to the background after 2 minutes**
  - Source: `mcp`.
  - Helps: long builds through an MCP server.
  - Small.
- **Spawn and search caps**
  - Source: "a per-session cap on subagent spawns (default 200 …) `/clear` resets the budget" (CL 2.1.212) and "concurrently-running subagents (default 20)" (CL 2.1.217).
  - Helps: overnight sprints with one helper per task can hit 200. Set `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`.
  - **Yes, a hidden limit.**
- **Idle compaction**
  - Source: CL 2.1.299: "a 200K+ token conversation left idle for about 54 minutes is compacted".
  - Helps: aware-only. A gate left waiting overnight may come back compacted, so the step's state must live in files (already the plan).
- **Session recap**
  - Source: `interactive-mode`: "a one-line recap of what happened … once at least three minutes have passed … and the terminal is unfocused".
  - Helps: free "what happened while you were away".
  - Small.

### C4. Status always visible (V28)

- **Status line JSON**
  - Fields include `context_window.used_percentage`, `rate_limits.five_hour.used_percentage`, `effort.level`, `session_name`, `prompt_cache`, and a `refreshInterval` timer (`statusline`). "each `echo` … displays as a separate row"; links via OSC 8.
  - Helps: a fallback "Step 3/7 · working" line if the mod band fails. A script reads the project state file.
  - Maybe. A plugin can't ship it (see B), but firstsetup can write it to user settings.
- **`subagentStatusLine`**
  - What: plugin-shippable rows for helpers (`plugins/components`); payload has `agentType` and effort (CL 2.1.293, 2.1.214).
  - Helps: show each helper's step.
  - Small.
- **Program Status Protocol (OSC 7501)**
  - Source: `terminal-config`: terminals that support it "can show whether each interactive Claude Code session is working, waiting on you, or done … There is nothing to turn on".
  - Helps: V28 for free on supporting terminals.
  - Aware-only.
- **Hook `terminalSequence`**
  - Source: CL 2.1.141: "so hooks can emit desktop notifications, window titles, and bells".
  - Helps: the window title shows the BMUZ step even without the mod.
  - Small, robust.
- **PushNotification tool and mobile pushes**
  - Source: `tools-reference`: "Sends a desktop notification … and a phone push with Remote Control"; `CLAUDE_CLIENT_PRESENCE_FILE` suppresses pushes "while you're at the machine" (CL 2.1.181).
  - Helps: "gate waiting" pings.
  - Small.
- **Turn-end clock line**
  - Source: CL 2.1.246: "`✻ Sautéed for 23s · done 6:05 PM`".
  - Helps: the CLAUDE.md "progress line with clock time" rule is partly built in.
  - Small.
- **`/focus` view**
  - Source: `commands`: "shows only your last prompt, a one-line tool-call summary … and the final response".
  - Helps: the non-technical user's default view.
  - Mention it in /bmuz.
- **Fullscreen `/diff` live panel; Desktop pop-out panes**
  - Source: w36, w37 digests.
  - Aware-only.

### C5. Memory and project state

- **Subagent `memory: project`**
  - Source: `sub-agents`: "Persistent memory scope … Enables cross-session learning".
  - Helps: the independent reviewer agent accumulates "mistakes we keep making" per project (V21 retro).
  - Maybe. Watch the multi-machine sync: **UNVERIFIED** where project-scope agent memory lives.
- **Subagent `skills:` preload, `omitClaudeMd`, `isolation: worktree`, `maxTurns`, `effort`**
  - Source: `sub-agents` frontmatter.
  - Helps: a task-flow helper gets exactly the craft skills it needs and none of the chatty rules; a reviewer can't edit (tools list).
  - **Yes** for the reviewer design.
- **Task list across sessions** (`CLAUDE_CODE_TASK_LIST_ID`)
  - Source: `interactive-mode`: "To share a task list across sessions".
  - Off by default on new models (A5). Don't rely on it.
- **`FileChanged` hook**
  - Source: `hooks`: "runs the hook no matter what changed the file … or a process outside Claude Code entirely".
  - Helps: the engine reacts when Muzzy edits ROADMAP / Obsidian notes ("read his Obsidian edits").
  - Maybe.
- **`InstructionsLoaded` hook**
  - What: fires when CLAUDE.md or rules load.
  - Helps: verify the plain-English rules actually loaded.
  - Small.
- **`/doctor prompt-audit` and the `claude-api prompt-audit` skill**
  - Source: CL 2.1.283: "audit your CLAUDE.md files, skills, agents and commands for prompting patterns written for older models". Also `/doctor` proposes trimming CLAUDE.md (CL 2.1.206).
  - Helps: converting the 35 KB develop skill.
  - **Yes**, run it during conversion.
- **`/skill-doctor`, `/usage` per-skill breakdown, `claude plugin details`**
  - Source: `commands`: "what each of your skills costs in context and how often it gets used"; CL 2.1.139: "projected per-session token cost".
  - Helps: the BMUZ checkup.
  - Small: the checkup can call these instead of its own counting.

### C6. Safety and security (V42–V47)

- **Auto mode default blocks**: see B. `/permissions` has an Auto mode tab (CL 2.1.246); `autoMode.hard_deny` "block[s] unconditionally" (CL 2.1.136).
  - Helps: shrinks the guard-git hook set.
  - Maybe.
- **Permission rules on tool parameters**
  - Source: CL 2.1.178: "`Tool(param:value)` … e.g. `Agent(model:opus)`".
  - Helps: e.g. deny Artifact publish in project settings unless a gate passed.
  - Small.
- **`permissions.blockWritesOutsideWorkingDirectories`**
  - Source: CL 2.1.314: "Write, Edit and NotebookEdit refuse paths outside the working directories in every permission mode".
  - Helps: "never code in Google Drive", and project isolation.
  - Small, useful.
- **`/security-review`, the security-guidance plugin, the Claude Security plugin**
  - Source: `commands`: "Analyze the changes on your current branch for security vulnerabilities"; `security-guidance`: "have Claude review its own code changes for vulnerabilities and fix them in the same session"; `claude-security`: "multi-agent vulnerability scan".
  - Helps: the planned "security flow" before release. Use the official ones instead of writing our own.
  - **Yes**, it saves building it.
- **Secret scan on outbound account email**
  - Source: CL 2.1.317: "asks before a web or shell tool call sends your account email address to the network".
  - Aware-only.
- **`--safe-mode` / `disableAllHooks`**
  - Already noted in arch. Users can switch BMUZ off; no change.

### C7. Distribution and plugin features

- **Anthropic directory**: see A1.
- **Plugin dependencies with version ranges**
  - Source: `plugins/dependencies`: "Declare the plugins your plugin depends on, with version ranges such as ^1.2"; disable "refuses when another enabled plugin depends on the target" (CL 2.1.143).
  - Helps: split BMUZ core / Game UI kit / multiplayer kit into separate plugins later.
  - Maybe (later).
- **`userConfig`**: already in arch. New: `claude plugin configure --values-stdin` (CL 2.1.285), and the VS Code form "asks for unset options as a form after an install".
  - Helps: the profile (accounts, machines) captured at install.
  - Small.
- **`${CLAUDE_PLUGIN_DATA}`**
  - Source: `plugins/components`: "a directory that survives updates, for `node_modules` … caches". Node dependencies install automatically for marketplace plugins.
  - Helps: where the engine keeps per-machine caches; never in `${CLAUDE_PLUGIN_ROOT}` ("Don't write state there").
  - **Yes**, a rule for the build.
- **Archive and URL plugin sources**
  - Source: CL 2.1.224: "install plugins from a zip over HTTPS without git or npm, with optional SHA-256 pinning"; `--plugin-url`.
  - Helps: install for users without git.
  - Maybe.
- **`claude plugin install --marketplace <source>`**
  - Source: CL 2.1.292: one command adds the marketplace and installs.
  - Helps: a one-line install for newcomers.
  - Small.
- **`claude plugin init <name>`**: scaffolding (CL 2.1.157). Small.
- **Code intelligence (LSP) plugins**
  - Source: `plugins/code-intelligence`: "so Claude sees type errors after edits".
  - Helps: the TypeScript and C# (Unity) checks in the task flow.
  - Maybe.
- **Settings sync of claude.ai skills and plugins into the terminal**
  - Source: CL 2.1.275: "syncing of the skills and plugins enabled on your claude.ai account to terminal sessions".
  - Helps: V27 (multi-machine). BMUZ could reach the laptop with no config-sync script.
  - Maybe. It overlaps the current `~/.claude-config` sync.

### C8. Testing BMUZ itself

- **`claude plugin eval`**: already named in arch. Details that matter:
  - "each case runs three times by default"; with/without-plugin baseline; graders are regex, tool-called or an LLM rubric.
  - "`claude plugin eval init` asks you about your plugin, proposes the cases and graders".
  - Runs are non-interactive (`plugin-evals`: "starts a fresh, isolated non-interactive session"). So **mods' drawing, monitors and AskUserQuestion gates can't be tested this way**; it tests skills and flows.
  - Helps: V-items on "does BMUZ produce the right outcome", and regression after model updates.
  - **Yes**: pair it with `claude plugin test` for the mod.
- **Evals method** (demystifying-evals-for-ai-agents)
  - "20-50 simple tasks drawn from real failures is a great start".
  - "Regression evals … should have a nearly 100% pass rate".
  - Use pass^k when consistency matters: "(0.75)³ ≈ 42%".
  - "Read the transcripts!"
  - Helps: BMUZ's ~97 hook-caught slips are the ready-made eval set.
  - **Yes**: turn the caught-items log into the first suite.
- **skill-creator evals** (`skills` "Run evals with skill-creator")
  - For iterating on one skill in-session; it uses a separate format from plugin eval.
  - Small.

### C9. Creative, non-technical users

- **Voice dictation (`/voice`)**
  - Source: `voice-dictation`: "Speak your prompts … hold-to-record or tap-to-record"; it also works in agent view replies. It "Requires a Claude.ai account" (`commands`).
  - Helps: playtest feedback by voice.
  - Mention it in /bmuz.
- **Desktop app: Browser pane preview + auto-verify**
  - Source: `desktop`: "Claude can start a dev server and open it in the Browser pane to verify its changes"; "Auto-verify is on by default … takes screenshots, checks for errors"; config lives in `.claude/launch.json`.
  - Helps: `/play` and the "verify with screenshots" rule, built in for Desktop users.
  - **Yes** for the Desktop path: `/play` should write `launch.json`.
- **Computer use: Desktop on macOS and Windows; CLI on macOS only**
  - Source: `computer-use`: "For the Desktop app on macOS or Windows, see computer use in Desktop".
  - Helps: Unity playtests and native builds.
  - Maybe.
- **Claude in Chrome GA, and the in-app browser on Desktop**
  - Source: w27, w28 digests.
  - Helps: alternatives to the Playwright MCP for checks.
  - Aware-only.
- **iOS Simulator pane (Desktop, macOS)**
  - Source: `desktop-ios-simulator`.
  - Helps: the App Store release recipe.
  - Later.
- **`/design` (artboards on artifacts, research preview)**
  - Source: `commands`: "Draft UI mockups, screen flows, landing pages, or posters as artboards on one canvas". Note: standalone claude.ai/design "closes by December 14, 2026" (CL 2.1.302).
  - Helps: the Discover / sketch look-and-feel stage, store pages.
  - Maybe: compare it against `/sketch`.
- **Built-in output styles: Explanatory, Learning, Concise**
  - Source: `output-styles`: Explanatory "adds short `Insight` blocks that explain the choices".
  - Helps: the "explain jargon the first time" rule. A custom forced style is better (A2).
  - Small.
- **`/powerup` lessons, `/insights` report, `/team-onboarding`**
  - Source: `commands`: "quick interactive lessons with animated demos"; `/insights` covers "where things go wrong, and features to try"; `/team-onboarding` "produces a markdown guide a teammate can paste" (Team/Enterprise for sharing).
  - Helps: first setup for newcomers, and the BMUZ checkup input.
  - Small.
- **Accessibility / screen reader mode, `maxProseWidth`, `timeFormat`**
  - Source: `accessibility`; CL 2.1.282; CL 2.1.257.
  - Aware-only.
- **Creative connectors (Blender MCP, Adobe, Ableton, SketchUp, Splice, Affinity)**
  - Source: claude-for-creative-work (28 Apr 2026): "Blender offers a natural-language interface to its Python API".
  - Helps: art pipeline sidequests; organize-assets.
  - Later.

### C10. Multi-machine (V27)

- **Cross-session messaging across your machines**
  - Source: `cross-session-messaging`: "On another of your machines | Through Anthropic servers, arriving over that machine's Remote Control connection". It now works on native Windows (v2.1.234+).
  - Helps: the PC session could hand the laptop session a note. Files stay the source of truth.
  - Aware-only.
- **Remote Control device cards**
  - Source: w34: "any machine running `claude remote-control` shows up as a device card on your phone".
  - Helps: start work on the PC from the phone.
  - Small.
- **Projects (cloud, public beta, Pro/Max/Ultra)**
  - Source: `claude-projects`: "one ongoing conversation where Claude coordinates a stream of related work … threads … share repositories, instructions, and memory"; a thread can run "on your computer … through Remote Control".
  - Helps: a possible future "studio" mode.
  - No change now (beta, cloud-first, not on Team).

### C11. Other new items checked and judged not useful for BMUZ now

- Advisor tool: "experimental and requires the Anthropic API" (`advisor`).
- Ultraplan: "Removed" (`commands`).
- Fast mode and model pickers.
- Claude apps gateway, self-hosted runners, Code Review (Team/Enterprise), Slack/Claude Tag, GitHub Actions/GitLab (useful later for release CI only).
- `/radio`, keybindings (rebinding only; no BMUZ need), vim mode, spellcheck, emoji completion.
- `SendUserFile` (Remote Control file delivery: maybe for sending builds to the phone later).
- `/cd` (mid-session project switch: matches "cd <project>"; aware-only).

---

## D. Suggested additions to the throwaway proof (ARCHITECTURE "How we get sure")

10. A mod still loads and gates when the plugin is installed by **account sync / the directory** (A1).
11. A mod runs inside a **background session** (`claude --bg`), so the overnight sprint can run with the terminal closed (A8).
12. A skill whose body is `` !`node bmuz.js next` `` gets the right step on Windows (`shell: powershell`) (A3). This is the B-motor test.
13. `permissions.denyInsteadOfPrompting` + `askUserQuestionTimeout` → a fake overnight task never waits (A7).
14. Automate proofs 1, 2 and 6 with `claude plugin test`; check `gatingHooks` in `claude plugin validate --json` (C1).
