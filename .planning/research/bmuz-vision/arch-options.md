# BMUZ "process layer": architecture options, fact-checked against docs

Read on 2026-11-08. Every page was fetched live (the `.md` copies at code.claude.com/docs/en/... and platform.claude.com/docs/en/...). Quotes are verbatim. Anything I didn't find in the docs is marked **UNVERIFIED**.

The question in one line: **who holds the step list, the program or the model?** Today BMUZ keeps it in skill prose, and that prose is what drifts.

---

## 1. Skills (SKILL.md), today's backbone

- **What it is:** markdown instructions that Claude follows. They can also be run as `/name`.
- **Who holds the steps:** the model. workflows.md puts it plainly: Skills = "Instructions Claude follows", and who decides what runs next = "Claude, following the prompt". https://code.claude.com/docs/en/workflows
- **Useful frontmatter** (https://code.claude.com/docs/en/skills):
  - `disable-model-invocation: true` means only `/name` starts the skill.
  - `context: fork` plus `agent:` runs the skill in a subagent.
  - `hooks:` are "Hooks that Claude Code registers when the skill is invoked and keeps running for the rest of the session".
  - `allowed-tools`, `model`, `effort`.
- **Pausing to ask the user:** yes. In an interactive session Claude can stop or use AskUserQuestion, but whether it does is Claude's own judgement.
- **Long runs:** "Interruption: Restarts the turn" (workflows.md table).
- **Distribution:** copy into `~/.claude/skills/`, or ship in a plugin (section 2).
- **Can users change it:** yes, they're plain files.
- **Limit:** this is the drift problem itself. Nothing forces the step order.

## 2. Claude Code plugins and marketplaces

- **What it is:** "a directory of skills, agents, hooks, MCP servers, or other components that Claude Code installs and loads as one unit" (https://code.claude.com/docs/en/plugins/overview).
- **What a plugin can contain** (https://code.claude.com/docs/en/plugins/components):
  - skills and commands
  - agents
  - hooks (`hooks/hooks.json`)
  - MCP servers and LSP servers
  - `bin/` executables
  - `settings.json`
  - themes and output styles
  - channels and monitors
  - **workflows** ("The `workflows/` folder holds workflow `.js` files … runs as `/my-plugin:audit-routes`")
  - a **hooks module (a "mod")**, covered in section 4
- **Default settings are very limited:** "Two keys take effect, `agent` and `subagentStatusLine`, and every other key is dropped". Also "a user's own `agent` in `~/.claude/settings.json` overrides yours." So a plugin **cannot ship permission rules or env vars** as settings.
- **Plugin subagents are limited too:** "For security reasons, plugin subagents don't support the `hooks`, `mcpServers`, or `permissionMode` frontmatter fields" (https://code.claude.com/docs/en/sub-agents).
- **Asking the user for setup values:** the `userConfig` manifest key "appears in a dialog" at install. This is for configuration only, not for process gates.
- **Distribution:** a marketplace is "a repository or directory with a `.claude-plugin/marketplace.json`… a catalog, not a hosted store". A GitHub repo works.
  - Install command: `/plugin install name@marketplace` or `claude plugin install`.
  - The Desktop app's Code tab and VS Code also install plugins (https://code.claude.com/docs/en/plugins/install).
- **Updates:** "Background auto-update is off for your marketplace by default, and `marketplace.json` has no field to turn it on". Either each user turns it on in `/plugin` → Marketplaces, or an admin sets `autoUpdate` in managed settings. Without it, users run `claude plugin update` (https://code.claude.com/docs/en/plugins/host-marketplace).
  - Users get a new copy "only when its computed version changes".
- **Can users change it:** the installed copy sits in `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` (https://code.claude.com/docs/en/plugins/security).
  - Users can disable the plugin. `disableAllHooks` stops its hooks.
  - Plugin themes are documented as read-only. **UNVERIFIED:** whether skills and hooks in the cache are protected from edits. Most likely they're ordinary files that the next version replaces.
  - So a casual user can't *silently* break it (their edits are lost on update), but they *can* turn it off.
- **Cost:** none beyond each user's own Claude plan. Each user signs into their own Claude Code.
- **Maturity:** GA. There's an evals tool, `claude plugin eval` (https://code.claude.com/docs/en/plugin-evals), and dependencies with version ranges.
- **Windows:** hooks written for Bash need Git Bash. "Without Git Bash … a shell-form hook with no `shell` set runs in PowerShell, where it can fail. Install Git for Windows" (https://code.claude.com/docs/en/hooks). **This is a real install trap for non-engineers on Windows.** Fix: write the hooks in node, or use exec form.

## 3. Hooks (settings hooks: command / http / mcp_tool / prompt / agent)

- **Where they live:** user, project, local and managed settings files, a plugin's `hooks/hooks.json`, skill frontmatter, or subagent frontmatter (https://code.claude.com/docs/en/hooks).
- **Who holds the steps:** hooks don't hold a sequence. They are **gates and nudges on events**. A program can keep a state file and use hooks to refuse anything out of order. That's what BMUZ's 102 rules do today.
- **Stop / SubagentStop:** `decision: "block"` "prevents Claude from stopping"; `additionalContext` keeps it going without showing an error.
  - Loop cap: "after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn. The count … resets each time Claude calls a tool" (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises it).
- **Prompt and agent hooks:** an LLM judges `{ok:true/false}`. Agent hooks get tools and up to 50 turns. "Agent hooks are experimental."
- **`/goal`:** "a built-in shortcut for a session-scoped prompt-based Stop hook". A fresh model checks a completion condition after every turn (https://code.claude.com/docs/en/goal).
- **Asking the user:** hooks can't ask the user directly in an interactive session, but they can block until Claude asks.
  - In `-p` mode, a PreToolUse hook can **`defer`** a tool call such as AskUserQuestion: "The turn ends with a result carrying `stop_reason: "tool_deferred"`… The calling process runs `claude -p --resume <session-id>`… There is no timeout or retry limit."
  - "Claude Code honors `"defer"` only in non-interactive mode with the `-p` flag."
- **Locking:** "Hook entries merge across settings levels … `disableAllHooks` setting can't disable managed hooks from outside managed settings". Managed hooks are the only ones a user can't turn off (section 6).
- **Maturity:** command hooks are GA; agent hooks are experimental.

## 4. Mods (a plugin's JS "hooks module"), the newest in-Claude-Code option

Sources: https://code.claude.com/docs/en/plugins/mods/overview, /api, /events, /reference

- **What it is:** "JavaScript or TypeScript event handlers" that run *inside* Claude Code. A mod can:
  - "hold a tool call while you ask the user a question"
  - add a `/command` that "runs your function at once, with no Claude turn"
  - draw panes and buttons
  - run timers
- **API pieces that matter here:**
  - `$.prompt.submit({ text })` starts a turn: "The call waits until the session is idle and then starts a new turn."
  - `$.agent.spawn`
  - `$.ui.ask` and `$.ui.notify`
  - `$.model.complete` and `classify`
  - `$.process.run` and `$.fs`
  - `$.session.usage()` (context %, rate limits)
  - `$.clock.every`
  - turn events `turn.start`, `turn.step` and `turn.complete`
- **Who holds the steps:** **the program can.** A mod can keep the step list in JS state, submit the next step's prompt when a turn completes, refuse out-of-order tool calls, and draw a gate (buttons) for human sign-off.
  - **UNVERIFIED:** whether `$.agent.spawn` hands back the subagent's result so the mod can await it (the reference lists the method but I didn't find its return shape).
  - No end-to-end "state machine" example in the docs.
- **Limits:**
  - "A hook's own execution time for one event … 10 seconds" (time spent waiting on API calls doesn't count)
  - `$.process.run` 30 s by default, 10 min at most
  - in `-p` and the Agent SDK, mod calls can be refused at `--max-turns` / budget limits
- **Where mods run:** CLI, the Desktop Code tab, VS Code, `-p` and the SDK (hooks only, no drawing), and Remote Control. Not in WSL Desktop sessions.
- **Distribution:** "A mod installs as a plugin, from a marketplace." It updates like any plugin.
- **Maturity:** "Mods are on by default" from v2.1.287. Young: there's a reference to an early-access env var. Users can turn mods off with `disableAllHooks` or `--safe-mode`.

## 5. Dynamic Workflows (saved `.js` workflow scripts)

Source: https://code.claude.com/docs/en/workflows

- **What it is:** "A script the runtime executes". "Who decides what runs next: The script." It's plain JS with `agent()`, `pipeline()`, `parallel()`, `phase()`, `log()`, `args`, and `schema` for JSON output.
- **Who holds the steps:** **the program**, the strongest guarantee in Claude Code.
- **Asking the user mid-process: NO.** "No mid-run user input | A run pauses on its own only for agent permission prompts and a usage-limit wait. For sign-off between stages, run each stage as its own workflow."
- **Long runs and stalls (best in class):**
  - A stalled agent restarts automatically: "An agent restarts at most five times"
  - Configurable with `stallMs` and `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`
  - A stopped run can be relaunched, and completed agents return their cached results
  - Usage-limit pause and auto-continue apply only when interactive on a subscription with `autoContinueAtUsageLimit`. A run doesn't pause in `-p`, the SDK, background sessions or Remote Control.
  - **Caveat:** "If you background your session or exit Claude Code while a workflow run is in progress, the run doesn't continue on its own."
- **Other limits:**
  - no filesystem or shell from the script itself
  - no `import()`
  - `Date.now()` and `Math.random()` throw
  - 16 concurrent agents
  - 1,000 agents per run
- **Distribution:** save to `.claude/workflows/` (project) or `~/.claude/workflows/`, or **ship in a plugin** ("Plugin workflows are namespaced by the plugin name").
- **Approval prompt:** every run in manual mode unless "don't ask again"; first launch only in auto mode.
- **Plans and cost:** "available on all paid plans… On Pro, turn them on … in `/config`". Workflows can use meaningfully more tokens; there's a "Large workflow" warning.
- **Can be turned off:** `disableWorkflows` by the user or by an org.

## 6. Managed / enterprise settings (the lock)

- **What it is:** precedence is "managed settings, command line, project local, shared project, user. … Nothing in your own settings files or `--settings` overrides a managed key" (https://code.claude.com/docs/en/settings).
  - `enabledPlugins: true` "force-enables" a plugin (https://code.claude.com/docs/en/plugins/org).
  - `allowManagedHooksOnly` and `strictPluginOnlyCustomization` lock out user hooks.
- **Who can use it:**
  - Server-managed: "Claude for Teams or Claude for Enterprise plan" plus the Owner role (https://code.claude.com/docs/en/server-managed-settings).
  - Endpoint-managed: MDM, the registry, or a `managed-settings.json` in a system directory. That needs admin rights on each machine.
- **For BMUZ:** a distributor **can't** lock other people's machines unless they're in the distributor's Team/Enterprise org or the distributor controls their device.
  - **UNVERIFIED but likely:** an installer *could* drop a system `managed-settings.json` with the user's admin consent. It would be heavy-handed, and it would clash with any employer policy.
  - **Dealbreaker for "users can't change it"** for a public audience: only "can't change it *by accident*" is achievable.

## 7. Subagents, output styles, agent teams

- **Subagents:** "A worker Claude spawns", and "Claude, turn by turn" decides. They're good for one fresh helper per feature (BMUZ already does this). Plugin subagents lose hooks, mcpServers and permissionMode.
- **Output styles:** "a set of instructions that sets Claude's role, tone, and response format for every response". A plugin can ship one. It's tone and role only and holds no steps.
- **Agent teams:** "experimental and disabled by default… known limitations around session resumption". Not a fit for distribution.

## 8. Headless `claude -p` and the Claude Agent SDK (TS/Python): an app that owns the loop

Sources: https://code.claude.com/docs/en/headless, /agent-sdk/overview, /agent-sdk/user-input, /agent-sdk/claude-code-features, /agent-sdk/plugins

- **What it is:** "the same tools, agent loop, and context management that power Claude Code", as a CLI or a library. Your app (CLI, exe or GUI) runs the stage machine and calls Claude for each step.
- **Who holds the steps:** **the program, fully.** Your code decides the next step, checks the output (`schema` / structured output), and retries.
- **Asking the user at gates: yes, and the strongest of all.**
  - Your app simply asks between steps.
  - Inside a step, `canUseTool` "pauses execution until you return a response… The callback can stay pending indefinitely".
  - Or a `defer` hook lets the process exit and resume later.
  - Caveat: "You can't add your own questions to this flow; if you need to ask users something yourself, do that separately in your application logic", which is easy when you own the app.
- **Reuses BMUZ:** "When you omit `settingSources`, `query()` reads the same filesystem settings as the Claude Code CLI: … CLAUDE.md files, and `.claude/` skills, agents, and commands".
  - Plugins load "from local directories" (`type: "local"`).
  - Workflows and mods run in `-p` and the SDK (hooks only, no drawing).
  - So skills, hooks and scripts carry over.
- **Long runs:** your code owns retries and resumes (sessions persist: continue/resume/fork). Workflow usage-limit auto-pause is NOT available here.
- **Installing:** "Both the TypeScript and Python SDKs bundle a native Claude Code binary, so most installs need no separate Claude Code install." You'd ship a node app or exe per OS. Updates are your job (npm, an installer, an auto-updater).
- **Users can't modify it:** yes. Compiled or bundled code isn't casually editable, which is stronger than plugins.
- **⚠ Cost and accounts, a likely DEALBREAKER for distribution:**
  - "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Use the API key authentication methods". So every other user needs **their own API key with pay-per-token billing**, not their Pro/Max plan.
  - Bare mode: "doesn't use your subscription login".
  - **UNVERIFIED (policy grey zone):** whether an app that shells out to the user's *own installed and logged-in* `claude` CLI counts as "offering claude.ai login". Ask Anthropic before relying on it.
  - For Muzzy's personal use on his own subscription, `claude -p` without `--bare` reads his login (implied by the bare-mode note; not stated outright).

## 9. Claude Managed Agents (Claude API, beta)

Source: https://platform.claude.com/docs/en/managed-agents/overview (+ /permission-policies, /define-outcomes, /self-hosted-sandboxes)

- **What it is:** a "Pre-built, configurable agent harness that runs in managed infrastructure. Best for long-running tasks and asynchronous work". The pieces are Agent / Environment / Session / Events.
  - Beta header `managed-agents-2026-04-01`.
  - Not ZDR-eligible (no zero-data-retention option).
- **Who holds the steps:** your app sends events, so the program can hold the steps. "Outcomes" add a grader: "the harness automatically provisions a grader to evaluate the artifact against a rubric … separate context window".
- **Gates:** an `always_ask` permission policy means "The session pauses and waits for your approval". Your app also controls when to send the next user event.
- **Long runs:** built for it. It runs in the cloud and handles compaction itself; there are scheduled deployments and webhooks.
- **Skills:** "Attach pre-built or custom skills to an agent". BMUZ skills could be uploaded.
- **Hooks and local scripts:** **UNVERIFIED** whether Claude Code hooks apply. It's a different harness, so assume not.
- **Where the work runs:** a cloud sandbox, or a self-hosted worker. So BMUZ projects (local git repos, Unity, browsers for playtest) would have to live in the sandbox or GitHub. That's a poor fit for a local game dev loop.
- **Cost:** API billing per token. Pricing pages not read: **UNVERIFIED**. Needs a Console account and API key, so the same distribution problem as the SDK.

## 10. Scheduled tasks (formerly Routines), Desktop scheduled tasks, /loop

- **Cloud scheduled tasks:** "research preview". Pro, Max, Ultra, Team and Enterprise. Each task belongs to the individual account and counts against that user's usage (https://code.claude.com/docs/en/routines).
  - They run with no human present. Workflows typed in a scheduled prompt don't trigger ("a scheduled task prompt" is listed as not an opt-in).
  - Good for a nightly "continue sprint" nudge. Not a process engine.
- **Desktop local scheduled tasks:** "only fires while the app is open and your computer is awake".
- **`/loop` and cron tools:** session-scoped interval re-prompts.

## 11. Remote Control and Channels (gates while away)

- **Remote Control:** drive a local session from the phone or claude.ai/code.
  - Push notifications: "A push can arrive when a long-running task finishes or when Claude needs a decision from you."
  - Needs a claude.ai login.
  - **This is the practical "ask the human at a gate while I sleep" channel for interactive Claude Code.**
- **Channels:** "research preview". An MCP server pushes events into the open session, and a channel with the "permission relay capability" can forward permission prompts.

---

## 12. Combinations worth considering

- **A. Plugin + mod + saved workflows** (all inside Claude Code; one install for every user):
  - Mod = the stage state machine: commands like `/develop`, a gate pane with buttons, `$.prompt.submit` for the next step, tool-call refusal when out of order.
  - Workflows = the long unattended inner loops (build the sprint's tasks, review, verify), one workflow per stage, because workflows can't ask mid-run.
  - Skills = the judgement inside steps.
  - Hooks = guards.
  - Remote Control = gates from the phone.
  - Runs on each user's own subscription.
- **B. Plugin (skills + hooks) + a deterministic node "conductor" script the skills call** (closest to today): a script outputs the next step and checks a state file, and Stop/PreToolUse hooks refuse progress past a gate. The step list moves out of prose into JSON that the script reads. Lower risk than mods, but still relies on Claude calling the script. Hooks enforce that.
- **C. Agent SDK app that loads the BMUZ plugin by local path:** the program owns the loop and gates, and the skills and hooks are reused. Best enforcement and question-asking. Blocked for others by the API-key requirement (section 8). Fine for Muzzy alone.
- **D. Plugin whose commands launch saved workflows**, one per stage. Simple, but no mid-stage questions, and the human sign-off happens back in the main chat between workflows.

---

## 13. Comparison table

Key: ✅ meets it (docs evidence) · ◐ partly · ❌ no · ? unverified.

Needs:
- **N1** the program holds the step list
- **N2** asks the human at gates
- **N3** survives long unattended runs and stalls
- **N4** others can install it (Windows and Mac)
- **N5** others can't silently break it, and updates roll out
- **N6** reuses BMUZ's existing skills, hooks and scripts
- **N7** cost and complexity for a non-engineer maintainer

| Option | N1 | N2 | N3 | N4 | N5 | N6 | N7 |
|---|---|---|---|---|---|---|---|
| Skills alone (today) | ❌ "Claude, following the prompt" | ◐ Claude decides when | ❌ "Restarts the turn" | ◐ copy files | ❌ plain files | ✅ | ✅ cheap |
| Plugin + marketplace (skills+hooks) | ❌ steps still in prose; hooks only gate | ◐ via Claude | ◐ Stop hook / `/goal`; 8-continuation cap | ✅ `/plugin install`, Desktop + VS Code; ◐ Windows bash hooks need Git Bash | ◐ updates overwrite edits; auto-update off by default; user can disable | ✅ | ✅ GitHub repo only |
| Settings hooks (incl. Stop, prompt/agent) | ◐ enforce order via a state file, no sequence | ◐ `defer` in `-p` only | ◐ Stop block + cap; agent hooks experimental | ✅ via plugin | ◐ (❌ unless managed) | ✅ already 102 rules | ◐ many rules to maintain |
| Mod (plugin JS hooks module) | ✅ JS state + `$.prompt.submit` + tool-call refusal (? no full example) | ✅ hold a tool call / `$.ui.ask` / buttons | ◐ timers + `turn.complete`; 10 s per-hook limit; ? resilience untested | ✅ installs as a plugin; CLI/Desktop/VS Code | ◐ same as plugin; `disableAllHooks` / `--safe-mode` turns it off | ✅ ships alongside the skills | ◐ JS code to maintain; young feature |
| Dynamic workflows (saved/plugin) | ✅ "The script" | ❌ "No mid-run user input" | ✅ stall restarts ×5, resume from cache, usage-limit pause (interactive only) | ✅ via plugin; Pro must enable in /config | ◐ same as plugin; `disableWorkflows` | ◐ agents use skills; script is new | ◐ token-heavy; JS script (Claude writes it) |
| Managed/enterprise settings | n/a | n/a | n/a | ❌ Team/Enterprise owner or MDM/admin only | ✅ "Users can't override them" | ✅ | ❌ not for a public audience |
| Agent SDK / `claude -p` app | ✅ app owns the loop | ✅ `canUseTool` waits indefinitely; `defer` + resume | ✅ app-owned retry/resume; ❌ no workflow usage-limit auto-pause | ◐ ship a binary per OS; SDK bundles Claude Code | ✅ compiled; you own the updater | ✅ `settingSources` + local plugins | ❌ for others: API key per user ("does not allow … claude.ai login"); building an app is real engineering |
| Managed Agents (API, beta) | ✅ app sends events; outcomes grader | ✅ `always_ask` pauses | ✅ built for long async runs | ◐ cloud; needs your app + API keys | ✅ server-side | ◐ skills yes; hooks/local scripts ? | ❌ API billing; cloud sandbox doesn't fit a local game loop |
| Scheduled tasks / /loop | ❌ | ❌ unattended | ◐ re-kicks a session | ✅ per account | n/a | ✅ | ✅; research preview |
| Remote Control / Channels | n/a | ✅ push "when Claude needs a decision" | ◐ reconnects after sleep | ✅ claude.ai login | n/a | ✅ | ✅; Channels research preview |
| **Combo A** (plugin + mod + workflows + Remote Control) | ✅ | ✅ between stages and in the mod; ❌ inside workflows | ✅ | ✅ | ◐ | ✅ | ◐ most moving parts, but all one plugin |
| **Combo B** (plugin + node conductor + hooks) | ◐ script holds the list; Claude must call it (hooks enforce) | ◐ | ◐ | ✅ | ◐ | ✅ closest to today | ✅ |

---

## 14. Front-runners and dealbreakers (observations, not a recommendation)

- **Front-runner for distribution:** a **single plugin** (it's GA, one install command, runs on each user's own plan, and works in the Desktop app, which non-engineers can actually install). Inside it, two candidates move the step list into code:
  - **mods**: a program-held state machine with interactive gates, inside Claude Code
  - **workflows**: program-held, stall-proof unattended stretches, but with no questions mid-run
  - The two complement each other: mod = conductor and gates, workflow = the long stretches.
- **Dealbreaker for Agent SDK / Managed Agents as a product for others:** the official note that third parties may not offer claude.ai login means every user pays per token with their own API key. It's still the best enforcement, and fine for Muzzy's own machine.
- **Dealbreaker for "users can't change it":** a true lock needs managed settings (Team/Enterprise or MDM). Plugins only give "edits get overwritten on update" and "the user can switch it off".
- **Windows trap:** Bash hooks need Git for Windows. Ship hooks as node or exec form, with `"onFailure"` set explicitly.
- **Biggest gaps I couldn't confirm in docs:**
  1. A full mod-as-state-machine example, and whether `$.agent.spawn` returns results.
  2. Whether plugin cache files are protected from edits.
  3. Whether a wrapper app that shells out to the user's own logged-in `claude` CLI is allowed.
  4. Managed Agents pricing.
  5. Whether hooks apply inside Managed Agents.
