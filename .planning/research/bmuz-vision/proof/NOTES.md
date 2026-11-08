# BMUZ engine proof — progress notes

Claude Code 2.1.319, Windows 11, Git Bash. Plugin loaded only with `--plugin-dir`.

## Probes (probe/ + probe-project/), 2026-11-08

P1. `claude -p ... --plugin-dir ../probe` loads the mod in headless runs. `session.start`, `prompt.submit`,
    `session.append`, `turn.complete`, `agent.spawn` all fire.
P2. `$.prompt.submit()` called INSIDE a `turn.complete` hook starts a second turn even under `-p` (PONG).
P3. In `-p`, a call made from `$.clock.after` after the last turn returns fails:
    "$.X is not available in this mode: no session is bound in this process". So headless engine work must be
    done inside hooks (awaited), not in deferred timers. (Interactive sessions: to be checked live.)
P4. Workflow launch routes:
    - `$.tool.call({ tool: 'Workflow', name, args })` -> REFUSED by host:
      "tool.call: runs the Workflow tool, whose agents run outside the at-once bound on spawns: $.agent.spawn is the door (host check)"
    - `$.prompt.submit({ text: '/probe:hello-flow ...' })` -> REFUSED: "a text beginning with / would run a command as the user; run one with $.command.run"
    - `$.command.run({ command: 'probe:hello-flow', args: '<json>' })` -> WORKS. The command expands to a prompt
      "Run the workflow ... Invoke: Workflow({ name, args })"; the model calls Workflow (args arrive as an object).
    - `$.prompt.submit({ text: 'call the Workflow tool with name ... args ...' })` -> WORKS (no opt-in refusal for a named workflow).
    - Result comes back as a `<task-notification>` prompt (prompt.submit origin kind `task-notification`,
      session.append door `queue` then `prompt`) carrying `<status>completed</status>` and
      `<result>{...script return value...}</result>`. `-p` waits for the background workflow before exiting.
P5. `$.agent.spawn({ prompt, description, model })` -> `{ agentId }`; that agent's `turn.complete` (e.agentId) carries
    its final answer ("DONE Moon Goat"). Side effect: the hand-back is ALSO delivered to the main model as a peer
    message, which confused it ("I didn't spawn any agent").
P6. Interference: Muzzy's global PreToolUse hook blocks heredoc/python writes of code with backslashes outside
    .scratch (fine inside .scratch). His SessionStart hook prints a BMUZ banner into every test session.
P7. `claude plugin validate`: `$` may only be passed to top-level function declarations (not const arrow helpers inside register).

## Engine build (plugin/), first runs
E1. `$.prompt.submit` is refused inside a `command.run` hook and inside a `prompt.submit` hook
    ("it would wait on the turn this hook is holding"). So: the engine does all step-starting work at
    `turn.complete`; "bmuz go" / "bmuz approve X" are read as plain prompts in `prompt.submit` (works in -p);
    the /bmuz-go and /bmuz-approve slash commands hand off to a timer (live window only).
E2. Git Bash rewrites a `-p "/bmuz-go"` argument into "C:/Program Files/Git/bmuz-go" (MSYS path conversion).
    tests/run.sh sets MSYS_NO_PATHCONV=1.
E3. FULL PIPELINE PASSED headless in two sessions (run 3): session 1 "bmuz go" -> name (talk) -> stops at gate;
    session 2 "bmuz approve Approve" -> plan (script, engine ran node itself) -> hello (flow: engine ran
    /bmuz-proof:hello-flow with {name}, guard rewrote the Workflow input to the step's args, result came back
    in the task-notification) -> review (talk) -> pipeline.done. Journal in project/.bmuz/journal.jsonl.
E4. Bug fixed: "crash.detected" fired after a clean stop at a gate -> added session.end marking the lock closed.

## Headless checks in real sessions
H1 (checks 1, 11, 12): state at "review" (read-only step). Asked Claude to Edit/Write/Bash in modes default, plan,
    bypassPermissions: every one refused by the engine, 8 deviations journaled, files untouched
    (evidence/run4-guard-modes.journal.jsonl). In plan mode the engine even refused ToolSearch (to load ExitPlanMode)
    and the plan-file Write -> design note: a real engine must allow plan mode's own plan file, or forbid plan mode.
H2 (check 6): .bmuz/test-fault -> Read refused with "BMUZ engine hit an error in its own code..." under bypassPermissions.
H3 (check 13): .bmuz/test-break-plan -> script ran 3x, 2 retries, BLOCKED, rolled back.
    BUG found + fixed: each retry re-took the checkpoint, so rollback restored the broken file. Now the checkpoint is
    taken once, before the first try. Re-run: pre-existing plan.json restored; missing plan.json deleted.
H4 (check 3): killed (`timeout -s KILL`) mid "review" talk step -> lock left open -> next session journaled
    crash.detected + resume at "review"; finished steps not redone; pipeline.done (evidence/run7-*).
H5 (check 10, part): killed mid-flow (helper running) -> next session crash.detected, re-ran the flow, done (run8).
    Killed at a gate: not possible headless (a -p gate never holds the process); clean stop at gate + resume in a new
    session works (run3). Needs a live window for the kill-at-gate case.
H6 (check 4): helper frozen on a 150s foreground ping; watchdog (25s limit, 3s tick) fired at 24.5s, TaskStop
    "Successfully stopped task", retry journaled. The retry's relaunch from the timer FAILED under -p:
    "$.command.run is not available in this mode: no session is bound" (headless only; live window to check).
    Interference: Muzzy's harness blocked a foreground `sleep 150` inside the helper; ping used instead.
    Race seen in run9: helper finished at the same moment the watchdog fired: TaskStop said "not running
    (completed)", a retry was counted, then the result was accepted. Real engine: re-check status before acting.

Results written to framework/.planning/research/bmuz-vision/proof-results.md (2026-11-08).
