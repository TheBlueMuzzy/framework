# BMUZ engine proof — results (2026-11-08)

Throwaway proof of ARCHITECTURE.md's "How we get sure" (16 checks). Claude Code 2.1.319, Windows 11.
All code is in `C:/Users/Muzzy/Documents/dev/.scratch/bmuz-engine-proof/` (its own git repo, 8 commits). Progress notes: `NOTES.md` there. Evidence (journals, test output): `evidence/` there.
Plugin loaded only with `--plugin-dir`. Nothing was installed into Muzzy's settings.

## What was built
- `plugin/` (the mod `bmuz-proof`)
  - `hooks/register.tsx`: the engine (motor). It starts each step itself, guards every tool call, asks at gates, runs scripts, launches flows, keeps the journal, lock, band and watchdog.
  - `hooks/engine.js`: the step logic as plain JS with no Claude Code API. The mod, motor B and the no-Claude tests all share it.
  - `pipelines/hello.json`: the pipeline as data. Each step has `id`, `kind`, `needs`, `tools`, `done`, `craft`, and `writes` for checkpoints.
  - `craft/*.md`: one note per step.
  - `workflows/hello-flow.js`: a saved workflow that takes `{name, out}`.
  - `scripts/write-plan.mjs`: the script step.
  - `scripts/bmuz.mjs` + `bin/bmuz(.cmd)`: motor B.
  - `tests/engine.test.tsx`: the `claude plugin test` suite.
- `project/`: the fake game. `bmuz.json` names the pipeline. The engine writes `.bmuz/state.json`, `journal.jsonl`, `lock.json` and checkpoints there.
- The pipeline: 1 talk "game name" → 2 gate "approve the plan card" → 3 script writes `plan.json` → 4 flow, a workflow with `{name}` that writes `hello.html` → 5 talk "review", read-only. Steps 3 and 4 carry done-checks; step 4 checks the file exists and contains the name.

## The 16 checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Starts each step itself; refuses a step out of order | **PASS** | Headless run 3: the engine started name → gate → plan → hello → review on its own (`step.start` lines, `evidence/run3-full-pipeline.journal.jsonl`). Run 4, at the read-only step: Edit, Write and Bash were all refused in modes default, plan and **bypassPermissions**, with `BMUZ engine: step review (talk) may use only Read, Glob, Grep; Edit is out of order`. 8 `deviation` lines were journaled and the files were untouched. `claude plugin test`: "check 1 … refused, and the deviation is journaled" passes. |
| 2 | Stops at a gate, asks with buttons, waits | **PASS (test kit) / NEEDS-LIVE-WATCH** | `claude plugin test` "check 2": the engine raised AskUserQuestion "Approve Moon Goat?" with options [Approve, Change the name]. After 60 s on the mocked clock with no answer, state was still `waiting` and no script had run. After "Approve", `gate.answer` was journaled and the script started. Headless: a `-p` run cannot ask (`$.ui.ask` rejects), so the engine journals `gate.pending` and waits. The next session's "bmuz approve Approve" continued the run (run 3). The real button dialog has not been watched: see L1. |
| 3 | A killed window resumes at the right step | **PASS (headless)** | Run 7: `timeout -s KILL` during the review step left the lock open. The next session journaled `crash.detected {lockStep: review}` and `resume review`, then ran review to `pipeline.done`. Finished steps were not redone. Run 8: the same after a kill mid-flow. The doctor (state rebuilt from the journal alone) is covered by the no-Claude test. |
| 4 | Frozen helper caught by the watchdog within 20 min | **PARTIAL** | Run 10: the helper was frozen on a 150 s foreground ping, with a 25 s limit and a 3 s tick. The watchdog fired at 24.5 s, and TaskStop returned "Successfully stopped task wfa14su1h". A retry was journaled. **The relaunch failed under `-p`:** `$.command.run is not available in this mode: no session is bound in this process`. In a live window the relaunch is expected to work but has not been watched (L3). The 20-minute default is a config value (`watchdogMs`). |
| 5 | Status band always shows working / done / waiting | **PASS (test kit) / NEEDS-LIVE-WATCH** | `claude plugin test` "check 5": the AbovePrompt band reads `BMUZ · step 2 of 4 · approve · waiting for you · 01:00` on both terminal and desktop. The no-Claude test covers the wording for working, waiting and done. The real band has not been seen on screen (L1). |
| 6 | An error inside the mod refuses rather than lets through | **PASS** | `claude plugin test`: an injected throw is refused, and the engine reported `hook failed closed … its .catch answered`. A broken pipeline file refuses every tool. Headless run 5 under bypassPermissions: Read was refused with `BMUZ engine hit an error in its own code, so it refused this action to be safe.` `claude plugin validate --json` reports `gatingHooks: tool.call hasCatch:true`. One gap: the `prompt.submit` hook has no `.catch`, so a throw there lets the prompt through. |
| 7 | A helper's answer comes back to the engine | **PASS (probe, headless)** | Probe "spawn": `$.agent.spawn({prompt, model:'haiku'})` returned `{agentId}`, and that agent's `turn.complete` carried `answer=DONE Moon Goat`. The pipeline itself doesn't use this path (flows return via workflow results; see 8). Side effect: the same hand-back is also delivered to the main model as a peer message, and the main model was confused by it. |
| 8 | Engine starts a workflow with an input and gets its result back | **PASS (headless), via the second route** | Tried in order: **(a)** `$.tool.call({tool:'Workflow', name, args})` is **REFUSED by the host**: `runs the Workflow tool, whose agents run outside the at-once bound on spawns: $.agent.spawn is the door (host check)`. **(b)** `$.prompt.submit('/plugin:wf …')` is refused: `a text beginning with / would run a command as the user; run one with $.command.run`. **(c)** `$.command.run({command:'bmuz-proof:hello-flow', args: JSON})` **WORKS**. It expands to a prompt, "Invoke: Workflow({name, args})", and the model makes the call. The engine's guard then rewrites the Workflow input to the step's exact args, so the model can't change them. The result returns as a `<task-notification>` with `<status>completed</status><result>{"wrote":"hello.html","name":"Moon Goat"}</result>`. The engine reads it in `prompt.submit` and runs the done-check (runs 3, 7, 8). **(d)** `$.prompt.submit("call the Workflow tool with name … args …")` also works, with no opt-in refusal for a named saved workflow. |
| 9 | Engine runs a script step directly and reads its result | **PASS** | `$.process.run(['node', write-plan.mjs, project, name])` journaled `script.ran exitCode:0 stdout:{"ok":true,…}`, and the done-check read `plan.json` (run 3). A failing script gave `exitCode:2` (run 6). |
| 10 | Resumes correctly while waiting at a gate or inside a loop | **PARTIAL** | Covered: a session ending at the gate, then a new session continuing (run 3); a kill mid-flow, then a rerun of the flow (run 8). After the fix, retries survive across attempts. **Not covered:** a kill while the gate dialog is open. That needs a live window (L2). |
| 11 | Plan mode can't go around the engine | **PASS (headless) / NEEDS-LIVE-WATCH** | Run 4 with `--permission-mode plan`: the engine refused ToolSearch (Claude's route to ExitPlanMode) and the plan-file Write, both journaled. Mod hooks fire regardless of mode. Design catch: the engine also blocks plan mode's own plan file. The live shift+tab case is L4. |
| 12 | A step's tool limit holds (review can't edit) | **PASS** | `claude plugin test` "check 12": at review, Edit, Write, Bash and PowerShell were refused and Read passed. Headless run 4 showed the same in all three permission modes. Helpers are limited too: a workflow helper's ToolSearch and Monitor were refused (`a helper may not use Monitor in step hello`). |
| 13 | Failed done-check retries twice, then rolls back and marks BLOCKED | **PASS** | Run 6: the script ran 3 times, with 2 `retry` lines, then `blocked {rolledBack:["plan.json"]}`. The `plan.json` from before the step was restored byte for byte. With no earlier file, the step's output was deleted. **Bug found and fixed:** each retry used to re-take the checkpoint, so rollback restored the broken file. Covered by `claude plugin test` and the no-Claude test. |
| 14 | Mod loads when installed from the directory / account sync, and in a background session | **PARTIAL / NEEDS-LIVE** | Using an isolated `CLAUDE_CONFIG_DIR` in my scratchpad, not Muzzy's: `claude plugin marketplace add <repo>` worked, and `claude plugin install bmuz-proof@bmuz-proof-market` reported `Installed … Read from: …\plugin, Status: enabled`. A session there says `Not logged in`, so whether the installed copy loads is untested (L6). Background session: `claude --bg` refused with `Workspace not trusted. Run claude in …\project once and accept the trust prompt` (L5). Account sync / Anthropic directory: **UNTESTED**, since it needs a directory submission. |
| 15 | A fake overnight task never waits on a prompt or question | **UNTESTED (NEEDS-LIVE)** | Blocked by the same workspace-trust refusal as 14. `tests/never-stall.json` (`permissions.denyInsteadOfPrompting`, `askUserQuestionTimeout: 60s`) and the task are ready (L5). Headless `-p` never waits by design, so it proves nothing here. Engine fix made: an away-from-keyboard empty answer at a gate is treated as "no decision, keep waiting", never as approval or "go back". |
| 16 | Motor B: a skill line runs `bmuz next` → right step, on Windows | **PASS** | The skill `motor-b:bmuz-next` runs `bmuz next` from plugin `bin/`. Through the **PowerShell** tool and the **Bash** tool alike it printed `BMUZ next: step 5 of 5 "review" (talk), status working` plus the allowed tools and the craft note. It reads the same pipeline file and `engine.js`. **Windows catch:** with `MSYS_NO_PATHCONV=1` in the environment, the sh shim handed node `/c/Users/…`, which became `C:\c\Users…` (MODULE_NOT_FOUND). Fixed with `cygpath -m` in the shim. |

Automated suites: `claude plugin test plugin` gives **7 pass, 0 fail**. `node --test tests/engine.node.test.mjs` (no Claude) gives **12 pass, 0 fail**. `claude plugin validate plugin` passes.

## What surprised me
1. **The documented workflow route is closed.** A mod cannot call the Workflow tool, and the host names `$.agent.spawn` as "the door". The open route, `$.command.run` of a saved plugin workflow, still has the model make the call. The engine pins the inputs by rewriting the call, but if the model never makes it, only the watchdog notices.
2. **Where the engine may act is narrow.** `$.prompt.submit` is refused inside `command.run` and `prompt.submit` hooks ("would wait on the turn this hook is holding"). A slash command cannot start a step itself; it hands the work to a timer. So all step-starting happens at `turn.complete`. Under `-p`, a timer that fires after the last turn finds "no session is bound", which is what broke the watchdog's relaunch.
3. **`-p` waits for background workflows**, and timers do run while it waits. The watchdog really did fire and stop a frozen helper headless.
4. **Plan mode and the engine collide.** The engine blocked plan mode's own plan file and ExitPlanMode's ToolSearch. A real engine needs a rule for plan mode: allow its plan file, or switch plan mode off for pipeline steps.
5. **A gate and `askUserQuestionTimeout` conflict.** The never-stall setting auto-closes questions, which could look like an answer. The engine must treat it as "still waiting". That is fixed in the proof.
6. **Git Bash rewrites `/bmuz-go`** in a `-p` argument into `C:/Program Files/Git/bmuz-go`, a path. Typed slash commands are fine; scripted ones need `MSYS_NO_PATHCONV=1`.
7. **Race:** the watchdog fired at the moment a helper finished (run 9). TaskStop said "not running (completed)", a retry was counted, and then the result was accepted. A real engine should re-check the task's status before acting.
8. **Interference from Muzzy's global hooks:**
   - The PreToolUse "heredoc with a backslash" block forced me to use the Edit tool.
   - The harness refused a foreground `sleep 150` inside a workflow helper, so the freeze used ping instead.
   - The SessionStart banner ("BMUZ checkup due") appeared in every test session.
   - None of them broke the engine.

## Verdict: the mod as the engine, or motor B (a hook engine)?
**The mod works as the engine. Rebuild on it, with three design rules the proof forced.**
- The mod did everything a hook engine can't:
  - started steps itself
  - asked at gates and waited
  - ran scripts and read their output
  - launched a workflow with an input and took its result
  - refused out-of-order and out-of-scope tools in every permission mode, plan and bypass included
  - failed closed on its own errors
  - recovered after a hard kill from files in the project
- The three rules:
  1. **Engine work happens at `turn.complete`** (or in a timer in a live window), never inside a command or prompt hook.
  2. **Flows start through a saved plugin workflow command**, with the guard pinning the Workflow input and the watchdog as backstop. Direct launch is refused by the host.
  3. **Every gating hook gets a `.catch` that refuses, and every gate treats a non-option answer as "still waiting"**.
- **Keep motor B as the fallback.** `bmuz next` already reads the same pipeline file and the same `engine.js` and works from both shells on Windows. Keep the step logic in a plain file, as here, so the motor stays swappable.
- Before the rebuild, run the live checks below. L1 (band + buttons) and L3 (watchdog relaunch in a live window) matter most: they cover what headless runs can't show.
- Risk to carry: the mod API is "EARLY ACCESS". The 2.1.314 → 2.1.319 change was invisible here, but pin a version and keep `claude plugin test` in the update routine.

## Live-watch steps for Muzzy (new terminal, one step at a time)
Do each step, then check what you see before the next one. These run in PowerShell.

**L0. Open the project once** (also answers the trust question that blocked L5).
1. `cd C:\Users\Muzzy\Documents\dev\.scratch\bmuz-engine-proof\project`
2. `node ..\tests\setup.mjs fresh`
3. `claude --plugin-dir ..\plugin`. If it asks to trust the folder, say yes.

**L1. Band, buttons and gate (checks 5, 2, 1).** In the window from L0:
1. Type `bmuz go` and press Enter.
   - PASS: a line above the prompt reads `BMUZ · step 1 of 5 · name · working · 00:0x`, and Claude asks the game's name with buttons.
   - FAIL: no line above the prompt.
2. Pick or type a name.
   - PASS: the line changes to `step 2 of 5 · approve · waiting for you`, and a question "Plan card: a hello page for "<name>". Approve it?" appears with two buttons, Approve and Change the name.
3. Wait one full minute without answering.
   - PASS: nothing moves.
   - FAIL: it goes on by itself.
4. Press **Approve**.
   - PASS: the line runs through plan, then hello (working), then review, and ends green: `all 5 steps done`. `project\hello.html` contains your name.
5. Type `/exit`.

**L2. Kill at the gate (check 10).**
1. `node ..\tests\setup.mjs fresh`, then `claude --plugin-dir ..\plugin`, then type `bmuz go` and answer the name.
2. When the Approve question shows, close the terminal window with its X.
3. Open a new terminal: `cd C:\Users\Muzzy\Documents\dev\.scratch\bmuz-engine-proof\project`, then `claude --plugin-dir ..\plugin`.
   - PASS: within about 2 seconds the Approve question comes back by itself, and the line says `step 2 of 5 · approve · waiting for you`.
   - FAIL: it starts over at step 1, or skips the gate.
4. `Get-Content .bmuz\journal.jsonl -Tail 4`
   - PASS: it shows `crash.detected` and `resume` for `approve`.

**L3. Watchdog in a live window (check 4).**
1. `node ..\tests\setup.mjs stall`
2. `claude --plugin-dir ..\plugin --permission-mode bypassPermissions`
3. Type `bmuz go`.
   - PASS: about 25 s later a toast says `BMUZ watchdog: step hello ran past 25s; stopping it`, and the helper starts again. This happens 3 times, about 90 s in all, and the line turns red: `BLOCKED`.
   - FAIL: it stays "working" for more than 3 minutes.
4. `Select-String watchdog .bmuz\journal.jsonl`
   - FAIL: a line saying `watchdog.restart-failed`.

**L4. Plan mode (check 11).**
1. `node ..\tests\setup.mjs at-review`, then `claude --plugin-dir ..\plugin`.
2. Press Shift+Tab until the bottom line says plan mode.
3. Type `Change Moon Goat to Sun Goat in hello.html, then leave plan mode and do it.`
   - PASS: the BMUZ engine refuses the tools, and `Get-Content hello.html` still says Moon Goat.

**L5. Overnight never-stall and the background session (checks 15, 14).** This needs L0 done first.
1. `node ..\tests\setup.mjs done`
2. `claude --bg "Fake overnight task. 1) Ask me with AskUserQuestion: red or blue? 2) Write colour.txt with my answer or none. 3) Run Bash: echo done > done.txt. 4) Reply FINISHED and list what was refused." --plugin-dir ..\plugin --model haiku --settings ..\tests\never-stall.json -n bmuz-never-stall`
3. Wait 3 minutes, then run `claude logs bmuz-never-stall`.
   - PASS: it ends with FINISHED. The question closed on its own after about 60 s, and any permission prompt was denied, not left waiting.
   - FAIL: `claude agents` still shows it waiting.
4. `Get-Content .bmuz\lock.json`
   - PASS: the session id is new, which means the mod loaded inside the background session.

**L6. Installed, not `--plugin-dir` (check 14).** Optional, because it adds a marketplace to your own settings. Undo it after.
1. `claude plugin marketplace add C:\Users\Muzzy\Documents\dev\.scratch\bmuz-engine-proof`
2. `claude plugin install bmuz-proof@bmuz-proof-market --scope local`
3. `node ..\tests\setup.mjs fresh`, then `claude`, then type `bmuz go`.
   - PASS: the same band as in L1.
4. Undo: `claude plugin uninstall bmuz-proof@bmuz-proof-market`, then `claude plugin marketplace remove bmuz-proof-market`.

## Live checks with Muzzy (2026-11-08, 08:27–08:58, PowerShell window, `claude --plugin-dir ..\plugin`)
Claude read the project journal after each step, so every result below is backed by the journal, not by screenshots alone.

| Live | Checks | Result | What happened |
|---|---|---|---|
| L1 | 1, 2, 5 | **PASS** | The band showed in a real window ("ready" → "step 4 of 5 · hello · working" → green "all 5 steps done"). The engine started each step itself, handing Claude only that step's craft note. The name question came with buttons. At the gate, nothing moved for **96 s** with no answer (journal: `step.start approve` and nothing after; no plan.json, no hello.html). **Design flaw found:** Approve is the first, pre-selected option, so one stray Enter approved it on the first try (journal: answer 12 s after the gate opened). |
| L2 | 10 | **PASS** | Closing the window with X at the gate, then starting a new window: the Approve question came back by itself (journal: `resume approve`; the name step was not redone). Gap: no `crash.detected` line, because a lock that says "waiting" isn't read as a crash. |
| L3 | 4 | **PASS** | The watchdog stopped each frozen helper at about 25 s and relaunched it (this works live; it failed only under `-p`). After 3 attempts it marked the step **BLOCKED** and rolled back hello.html. The helper counters froze once stopped (no tokens burning). **Findings:** (a) each relaunch showed in the chat as if the user had typed it, so Claude narrated and offered to stop runs; (b) the band stayed at "working" after BLOCKED, because it only refreshes at the end of a turn. |
| L4 | 11 | **PASS** | In plan mode: "change Moon Goat to Sun Goat" left hello.html unchanged; Write and the route out of plan mode were both refused. **Finding:** plan mode and the engine jam: Claude couldn't even hand in its verdict. |
| L5 | 14 (background part), 15 | 14: **PASS for background** · 15: **FAIL** | The mod loaded inside the `claude --bg` session (lock.json carries the background session's id; band shown). But **AskUserQuestion isn't available in a background session**, so Claude asked "red or blue?" in plain text and **stopped to wait**. colour.txt and done.txt were never written. That is exactly the overnight stall the never-stall settings were meant to stop. |
| — | (seen in L1) | **finding** | Claude Code's own "workflows use a lot of tokens" confirmation appeared before the Workflow ran. Overnight, that would wait for an answer too. |
| L6 | 14 (installed copy) | not run | It would add a marketplace to Muzzy's own settings; it gets tested in R2 instead. |

**Final tally: 14 of 16 pass** (1–13, 16). Check 14 passes for the background session; the installed copy gets tested in R2. **Check 15 fails.**

**The verdict stands: the mod is the engine.** Live testing added these must-fixes to R1 and R6:
1. **Auto mode never asks.** Any question becomes an "Ask Muzzy" line plus the default choice, and the engine continues at the end of the turn. Craft notes for auto runs forbid asking. This fixes the check 15 failure, and it's retested in R6.
2. **Pre-answer Claude Code's own confirmations** (the workflow cost warning) in BMUZ's settings for auto runs.
3. **A gate never pre-selects Approve.** The safe choice comes first, or approving needs typing.
4. **Engine actions are labelled as the engine's own** (relaunches, step prompts), and Claude is told not to narrate them.
5. **The band refreshes on every engine event,** not only at the end of a turn.
6. **One plan-mode rule:** plan mode is switched off for pipeline steps, or the engine allows plan mode's own plan file.
7. **A lock that says "waiting" plus a dead session is journaled as a crash** before the resume.
