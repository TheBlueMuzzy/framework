# BMUZ — how it's built (DRAFT, 2026-11-08)

Scored against `VISION.md`. Facts: `arch-options.md`, `arch-verify.md` (docs + Claude Code v2.1.314 files on this PC). Nothing here is built or tested yet.

## The idea in one line
The steps are **data** (a pipeline file per process); a small **engine** runs them; Claude does the thinking **inside** each step.

## The options (only ones inside Claude Code)

| | Holds the steps (V7) | Asks at gates (V22) | Never stalls (V24) | Status always visible (V28) | Works for anyone, no paid extras (V2b) | Multi-machine (V27) | Verdict |
|---|---|---|---|---|---|---|---|
| A. Today: skill text + hooks catching slips | ❌ Claude's memory | ◐ Claude decides | ❌ needed a patch | ❌ | ✅ | ✅ | the thing that keeps failing |
| B. Hooks + a state file + a script ("conductor") | ◐ can block wrong steps, can't drive the next one | ◐ | ◐ Stop cap: 8 in a row | ❌ | ✅ | ✅ | solid fallback |
| C. **Mod** (a plugin's small program inside Claude Code) | ✅ starts each step, refuses out-of-order ones | ✅ asks and waits (buttons) | ✅ own timers = watchdog | ✅ a band above the prompt | ✅ no plan needed | ✅ if state lives in project files | **front-runner — unproven** |
| D. Workflows | ✅ inside one run | ❌ no questions mid-run | ✅ restarts stalled helpers | ◐ | ❌ needs a paid plan | ◐ | optional extra for overnight runs only |
| E. Separate app (Agent SDK) | ✅ | ✅ | ✅ | ✅ | ❌ API key per user | ✅ | out — not inside Claude Code (V1) |

## Pick: C, built so B can replace the engine
- **Pipeline files** hold every process (stages, sprint loop, save, release, bug, setup sidequests): each step, its gate, and its "done" check.
- The **mod** runs them. If mods ever let us down, a hook-based engine (B) runs the **same pipeline files**: the core (the files) doesn't change, only the motor does. That's the answer to "no more core rebuilds".
- Weak spots to prove first (from `arch-verify.md`): a mod lets actions through if its code errors (must be written to refuse on error); getting a helper's answer back is documented but untested; no full example of a step machine exists.

## The rulebook — where each kind of rule lives (V12)
| Kind of rule | Lives in | Example |
|---|---|---|
| The ORDER of steps, the gates, what "done" means for a step | **pipeline file** (data) | Design → GDD Part 2 → TDD → feature map → gate "approve the plan" (updated 2026-11-09: the build plan closes Design, VISION V48) |
| Running the pipeline, status band, asking at gates, watchdog, deviation log, refusing out-of-order, writing the hand-off card from the step's data | **engine** (the mod) | "Step 3 of 7 · working · 01:52" |
| A job that needs thinking, in a fixed order, with no questions to the user | **workflow** (takes inputs, e.g. platform = Play Store) | build one task, fix one bug, a release build, a security review |
| A job done the same way every time | **script** | save, release, merge, sync, install a module |
| How to think inside a step (judgement, craft) | **skill** (.md) — no step lists in it | how to run discovery, MDA, write a GDD |
| Hard safety that must hold even if the engine is off | **hook** (small set) | no secrets pushed, no force-push, no publish without OK (V42–V44) |
| Tunable values | **content JSON** | timings, colours |
| Per-person facts | **profile** | machines, accounts |
| A project's memory | **project files** (git, so they sync) | STATE, ROADMAP, GDD, decisions, open questions |

## The ladder — which tool for which kind of job
1. **No thinking needed** → script. Instant, free, same answer every time.
2. **Thinking in a fixed order, no questions** → workflow. Every step is done by an AI helper; stalled helpers restart on their own.
3. **Thinking plus talking to the user** → engine + pipeline file, with gates.
4. **"When X happens, make sure Y"** → hook (a tripwire that guards or starts one of the above).
Two rules: a workflow never holds a taste decision (if it meets one, it stops and hands it back to the engine, which asks); a script step is never given to a workflow (the engine runs scripts directly).

## Every BMUZ process, put on the ladder
Talk = engine + gates · Flow = workflow · Script = script. "Better?" = does moving it improve on today, and which Vision items.

| Process | Talk (with the user) | Flow (fixed thinking) | Script | Better than today? |
|---|---|---|---|---|
| **First setup / setup sidequests** | what's missing, accounts the user must create | — | detect + verify each tool | yes — V2b becomes a checklist, not memory |
| **Discover** | the idea, players, references | **research flow** (input: topic): several helpers research, one merges, sources checked | — | yes — the helper fan-out done by hand tonight becomes standard (V7, V40) |
| **Define** | the blocks: story, feelings, pillars, core verbs, scope; gate "lock the concept" | **fit-check + concept-review flows**: choices checked against each other and the material | concept lint, stage | yes — the concept hangs together before Design (V14, V48) |
| **Design** | assembling the blocks, playtest calls, gate "approve the plan" | **plan-check flow**: GDD/TDD/feature map checked against each other and dependencies | plan-file shape (plan-lint) | yes — gaps found before building (V14, V17; F227) |
| **Sketch** | what to prove, presets feedback | **sketch flow** (input: the question): build → knobs check → screenshot → add the tab | publish tab | yes, small — same shape every time |
| **Develop — one task** | approval gate after the sprint | **task flow** (input: task): build → tests → checks → screenshots → a *separate* reviewer → fix → done-check | checks (lint, types, tests) | **yes, the biggest win** — this is the 35 KB develop skill where drift happens; an independent reviewer every time (V7, V35, V36, V39) |
| **Develop — overnight sprint** | report at the gate in the morning | **sprint flow**: runs the task flow for each task in order | save after each | yes — no stalls, no questions (V23, V24) |
| **Bug fix** | report, priority (P0–P3), "fix now?" | **bug flow** (input: bug): reproduce as a failing test → fix the cause → keep the test → check matching places | checks | yes — the QA way every time (V35, V39) |
| **Bug sweep** | — | **sweep flow**: find, reproduce, list | — | yes |
| **Release** | platform, version, notes, gate "go live?" | **release flow** (input: platform + version): build, fix build errors, check the live page looks right | gates (release-check), secret + package scans, merge, tag, live-check | yes — the in-between steps stop drifting (V25, V42–V46) |
| **Security review** (before every release) | — | **security flow**: AI reads the code for what scanners can't see | secret scan, package audit | yes — new (V42–V46) |
| **Milestone review (retro)** | approve the lesson proposals | **retro flow**: gathers git history, bugs, caught items, deviation log → drafts lessons | archive sprint | yes — lessons become proposals, not memory (V21) |
| **Framework catch-up in a game** | when, which game | **catch-up flow** (input: game, module): rehearse, install, run checks, fix | install-module | yes (V41) |
| **Audits** (optimize, accessibility) | which fixes to take | **audit flow**: measure + review → proposals | measurements | yes |
| **BMUZ checkup** | approve updates/cuts | **checkup flow** | checkup.sh | yes |
| Tuning, playtest, GDD/TDD what-ifs, views (/ppp /roadmap /sprint) | yes — the user is in the loop | — | PPP rebuild | no change — already talk + scripts |
| Save, sync, session start, merge | — | — | yes, already scripts | no change |

What this does to the ~97 hook rules: the hand-off card is written by the engine from step data, so most wording checks (the HC group) aren't needed; step-order checks become pipeline steps; "is it done" checks move into each flow's done-check. Hooks keep the safety set (git, secrets, publishing, report-only).

## Ideas taken from the wider research (2026-11-08)
Sources: `scout-community.md`, `scout-official.md`, `scout-wider.md`. Nobody has an engine *inside* the chat with gates and a status band, so BMUZ would be first. The pattern of steps as data run by a program matches what works elsewhere (GSD-2, Archon, Nick Tune, Statewright).

Each pipeline step carries:
- `kind` (talk / flow / script / gate), `needs` (steps before it), and the **tools it may use** (a review step can't edit code) — Archon, Statewright.
- a **done-check**; on a failure, **2 retries max** (the failure message says how to fix it), then roll back to the checkpoint and mark it BLOCKED — Stripe, 12-Factor Agents.
- its own short **craft note**: Claude gets only the current step's instructions, never the whole process — BMAD, Nick Tune.

The engine keeps:
- a **journal** in the project (git): every finished step, every deviation, the step times. A finished step is never redone, and a gate is always its own step, so resuming can't repeat a commit or publish — LangGraph's lesson.
- a **lock file** (current step + start time) to spot a crash, a **doctor** that rebuilds "where are we" from the files, and a "what went wrong" view — GSD-2.
- a **checkpoint** at every step and gate, with a plain-words undo list ("go back to before the tutorial") — Replit, Lovable.
- a **5-line plan card** before each feature (what the player sees · done when · not doing · needs from you · off-limits); the done-check tests the card, and tweaks skip it — Kiro, Devin, Factory.

Shipping and running:
- Ship through **Anthropic's plugin directory**: users there get updates automatically. Not supported: a top-level `bin/` when installed through claude.ai.
- The partner rules travel as a **forced output style + the plugin's agent** (a plugin can't ship CLAUDE.md). The agent's start prompt runs "resume here" every session.
- Never-stall settings: `askUserQuestionTimeout`, `permissions.denyInsteadOfPrompting`, the retry watchdog. Overnight runs can use **background sessions** (`claude --bg`).
- The engine starts **saved workflow commands** (the "use a workflow" opt-in only counts when a human types it).
- Rename `/bug` and `/checkup`, which clash with built-in commands.
- Don't build on the built-in task list (it's off by default on current models).

Quality for BMUZ itself:
- A **no-Claude test** of every pipeline (engine logic checked like normal software) and `claude plugin test` / `validate` for the mod.
- **Process tests** before any BMUZ update ships: scripted creative journeys (section H of the Vision) run in a scratch project and are checked against the journal — what keeps V11 true.

## Converting what exists
- Scripts → move as they are.
- Skills → the step lists come out (into pipeline files); the craft stays.
- ~97 hook rules → step-order rules become pipeline steps or done checks; safety rules stay hooks; the rest get cut or merged.
- Plan files, templates, framework → stay.
- Shipped as **one plugin**; `/firstsetup` switches on auto-update (it's off by default for non-Anthropic plugins).

## How we get sure: a throwaway proof (before any rebuild)
A tiny mod + one small pipeline in a scratch folder. It passes only if, watched:
1. it starts each step itself and refuses a step out of order;
2. it stops at a gate, asks with buttons, and waits;
3. a killed window resumes at the right step (state in project files);
4. a frozen helper is caught by the watchdog within 20 min;
5. the status band always shows working / done / waiting;
6. an error inside the mod refuses rather than lets things through;
7. a helper's answer comes back to the engine;
8. the engine starts a workflow with an input (e.g. a tiny "task flow" for one fake task), waits, and gets its result back — the whole plan now leans on this link, so it's tested first;
9. the engine runs a script step directly and reads its result.
10. a killed window resumes correctly even while waiting at a gate or inside a loop (Archon's known bug);
11. Claude's plan mode can't go around the engine (Nick Tune's finding);
12. a step's tool limit holds (a review step can't edit);
13. a failed done-check retries twice, then rolls back and marks BLOCKED;
14. the mod loads when the plugin is installed from the directory / account sync, and inside a background session;
15. a fake overnight task never waits on a prompt or question (the never-stall settings);
16. for motor B: a skill line that runs `bmuz next` gets the right step on Windows.
Proofs 1, 2, 6 and 12 run automatically with `claude plugin test`.
Fail on 1–6 → switch the motor to B and re-run the same test. Fail on 8 → a hook or the user's command starts the workflow instead; re-test.

## Decisions
- 2026-11-08 — **Inside Claude Code, not outside** (Muzzy: "inside is good"). An outside program like GSD-2 is the strictest, but it would mean rebuilding the chat, an unclear login position, and a big app to maintain. Fallback order if the proof fails: mod → hook engine (B) → outside program, after checking Anthropic's login rules. The pipeline files carry over to each one.
- 2026-11-08 — **Paid Claude account required** (Muzzy) → Workflows are part of the core.
- 2026-11-08 — **Taste questions ask the creative's view first** (Muzzy: "your pick") → VISION V32b. **Throwaway proof approved** (Muzzy: "yes /develop").
- 2026-11-08 — **The engine proof passed** (`proof-results.md`, code in `proof/`): 9 of 16 checks pass outright; 3 more (2, 5, 11) pass in the test kit or headless but still need watching live; 3 partly pass (4, 10, 14); 1 is untested (15). Claude re-ran both automatic test sets: 7/7 plugin tests and 12/12 no-Claude tests. **The mod is the engine, and motor B stays as the fallback.** Three rules the proof forced:
  1. the engine acts at the end of a turn;
  2. workflows start through saved plugin workflow commands, with their inputs pinned (a mod can't call the Workflow tool directly; the host refuses it);
  3. every guard refuses on its own error, and a gate never treats silence as an answer.
  The plan for the rebuild is in `REBUILD-PLAN.md` (draft).
