# Scout: what the community built to make Claude Code follow a process (2026-11-08)

Brief: wide net over community tools for repeatable agent processes, then a closer look at the 5 ideas most likely to change `ARCHITECTURE.md`.

**How first-hand this is:** web searches (extended mode) plus summaries of READMEs, docs, issues and blogs. My page-reading helpers didn't send back their reports, so the "deeper" checks rest on search summaries of the repos' own README, docs and issue pages, not on my reading the code. Star counts are secondhand and come from different dates. Treat them as rough size only.

## Bottom line
- The community has reached the conclusion BMUZ reached tonight: **written instructions drift, so put a program in charge of the steps.** The biggest process framework, GSD, rebuilt itself as a program (GSD-2), and its README says the new state machine replaced the "LLM self-loop".
- Nobody has shipped **"engine inside the Claude Code chat, steps as data, gates as buttons."** The ones with real engines either run **outside** the chat (GSD-2, Archon, OpenSwarm: they break V1) or enforce through **hooks + a cloud service** (Statewright: it breaks V2b's "no paid extras").
- So the plan stands. The community supplies five things worth copying (below) and one warning: resuming through a gate is where real engines break.

## The catalogue

| Name | What it is | How it holds the steps | Gates / stalls / resume | Size signal | Useful for BMUZ? |
|---|---|---|---|---|---|
| **GSD (get-shit-done)** github.com/gsd-build/get-shit-done | Spec → phases → plans → execute, for Claude Code + 12 other runtimes | Prose: markdown commands and workflows; state in `.planning/STATE.md`; `.continue-here.md` written when interrupted | Human-verify checkpoints; resume reads STATE + continue-here; open issue #940 says the pause note is loose prose, not a structured hand-off | ~48–59K stars (Augment article, 2026) | Already BMUZ's ancestor. Lesson: see GSD-2 |
| **GSD-2** github.com/gsd-build/gsd-2 | GSD rebuilt as its own program (CLI on the Pi agent SDK) | **Code**: state machine reading `.gsd/` files, state in SQLite | `auto.lock` holds the process ID + active unit → spots crashes; rebuilds a recovery note from the last session's tool calls; headless auto-restart with backoff (5s→10s→30s, 3 tries); `/gsd doctor` rebuilds STATE from disk; `/gsd forensics` | newer, same org | **Top 5 #3** |
| **BMAD-METHOD** github.com/bmad-code-org/BMAD-METHOD | Agile "team" of AI roles (analyst, PM, architect, dev…), phases, tracks (Quick / Method / Enterprise) | Prose, but **one small file per step** loaded only when reached; progress in the output doc's frontmatter (`stepsCompleted`) | "Halt at menus", [C]ontinue to advance; nothing enforces it except the text | very popular (tens of K) | **Top 5 #4** |
| **obra/superpowers** github.com/obra/superpowers | Skills pack: brainstorm → write plan → execute plan with helpers, test-first | Prose skills that trigger on their own (the `/superpowers:*` commands reportedly deprecated in favour of the skills) | Asks before coding; no state machine | ~93K–220K stars, sources disagree | Confirms "skills hold the craft". Not an engine |
| **GitHub Spec Kit** github.com/github/spec-kit | constitution → specify → plan → tasks → implement | Slash-command prompts + a `specify` CLI that scaffolds files | Human reviews between commands; reviewers say it has no checking loop | ~148K (one list) | Low: a file format, not an engine |
| **OpenSpec** | Lighter spec tool: one folder per *change* (`openspec/changes/`), archived when done | Prose + folders | Human reviews the proposal | mid | Small: "one folder per change, archived" fits Ideas/sidequests |
| **Kiro (AWS)** | Spec-first IDE: requirements → design → tasks | Built into its own IDE | Hooks can run tests | big-company product | Out (separate app) |
| **Statewright** github.com/statewright/statewright | State-machine guardrails: each step lists which tools the agent may use | **Data**: JSON states, transitions, guards, allowed tools, approval gates; checked by a Rust engine with no AI in the loop | Hard enforcement in Claude Code via hooks + an MCP server; workflows can also be written by the agent | Show HN 2026; free tier 3 workflows / 200 moves a month, Pro $29/mo; **needs a statewright.ai API key** | **Top 5 #1** |
| **Nick Tune's hook-driven workflows** (blog, Jan–Mar 2026) | One developer's engine: hooks → state machine → one written file describing each step | **Code + a written spec file**: every hook event goes to one entry point that runs the move; workflow as a "domain model" | Only the current step's rules are injected into Claude's context; blocks direct `gh` use and points Claude to the approved commands | blog, not a product | **Top 5 #2** |
| **Archon** github.com/coleam00/Archon | "Harness builder": YAML workflows (a chart of steps and what each waits on) in `.archon/workflows/` | **Data**: YAML nodes, `depends_on`, loop nodes, AI nodes mixed with bash/test/git nodes; each run in its own git worktree | `interactive: true` / approval nodes; `archon workflow approve/resume <run-id>`; CLI, web, Slack, Telegram | popular; ships 17–19 default workflows | **Top 5 #5** |
| **Ralph Wiggum loop** (official plugin `ralph-wiggum@claude-plugins-official`) | Keep Claude working until a "done" phrase appears | Stop hook + a state file + the original prompt fed back in | The Stop hook refuses to end the turn until the "done" phrase appears; experts say cap the loops and run in a sandbox; one community fork said it broke after a security update (2025, maybe stale) | widely covered (VentureBeat) | Small: a known way to "never stall", but it's the self-loop GSD-2 dropped |
| **cc-sessions** (GWUDCAP) | Edit/Write tools **blocked by default** until Claude goes through discuss → align → implement → check | Hook (`sessions_enforce.js`) + a mode in a state file | You switch it to "implement" to open the edit tools | PyPI; asks you to pin an old Claude Code (2.0.8) because of a hook bug | Small: "edits locked outside build steps" is Statewright's idea in miniature |
| **Claude Task Master** | Task list (`tasks.json`) + MCP server; break a PRD into tasks with dependencies | State file + MCP tools | Claude picks "next task"; nothing enforces order | ~25K (from memory, not checked) | Low: BMUZ's ROADMAP already does this |
| **CCPM** (automazeio/ccpm) | PRD → epic → GitHub issues → code, in parallel worktrees | GitHub Issues as the database; now packaged as a skill | Progress lives in issue comments | mid | Low: GitHub as state is too heavy for creatives |
| **Agent OS** (buildermethods) | Standards + product/spec files the agent reads | Prose files | — | mid | Low |
| **SuperClaude** | Big CLAUDE.md framework: personas, flags, commands | Prose | — | viral in 2025 | Warning: reviewers say the whole instruction set uses up the chat's memory (context) |
| **claude-flow → Ruflo** | Swarms of agents, memory, cloud "flow-nexus" | Code + cloud | — | ~16–30K | **Hype**: Fortune-500 claims are its own; one unchecked report of backdoors; the cloud part takes data off your machine. Avoid |
| **gstack** (Garry Tan) | Role skills: CEO, designer, eng manager, QA, release | Prose skills | — | ~90–100K, fast | Role idea only; popularity comes from its famous author |
| **Matt Pocock skills** | Small single-job skills (tdd, PRD, git safety); a setup skill asks your tracker once | Prose | — | big, 2026 | Confirms "one skill, one job" and "ask setup facts once" (= BMUZ profile) |
| **Claude-Code-Game-Studios** (Donchitos) | Game studio: 49 agents, ~72 skills, Godot/Unity/Unreal, `/start` onboarding | Prose agents + skills | Director agent coordinates | ~11.5K, v0.1 → Nov 2026 | Closest in topic, opposite approach: reviewers flag context bloat. Shows creatives want this; no engine |
| **OpenSwarm** (Show HN) | Runs several `claude -p` workers on Linear issues: worker → reviewer → test → docs | External orchestrator | Fixed pipeline, helpers share no conversation | small | Confirms "separate reviewer per task" (already in the plan) |
| **Spec-Flow, ospec, Pimzino spec-workflow, shinpr workflows, catlog22 CCW → Maestro Flow** | Smaller spec-driven variants (Requirements → Design → Tasks → Build; bug: Report → Analyze → Fix → Verify) | Mostly prose; CCW: JSON-driven | quality gates in prose | 97 – 3.9K | Pimzino's bug flow = BMUZ's bug flow |
| **Claude Code dynamic Workflows** (Anthropic, research preview from 28 May 2026) | A JS script runs helpers in fixed order | Code | Resume only within the same session; quitting starts it over; launch thread complained about cost | official | Matches the plan's "D: overnight only". Note the resume limit |
| Lists: hesreallyhim/awesome-claude-code (has an Orchestrators section), ithiria894 and luandro awesome-claude-code-workflows | — | — | — | — | Where to look again later |

**The pattern across all of them:**
- Prose frameworks (Superpowers, BMAD, Spec Kit, gstack, SuperClaude) are the most popular, and the most often reported as skipping steps. Anthropic issue #18454: "ignores CLAUDE.md and Skills during multi-step tasks".
- The tools that really enforce share one shape: **steps as data + a deterministic checker + hooks to block or inject**.
- Both sides agree **hooks are the only hard lever inside Claude Code** today.

## Top 5 ideas, a bit deeper

### 1. Statewright: each step says which tools Claude may use
- **Idea:** a step holds an allowed-tools list, not just "what to do". A planning step can only read; edit tools show up only in the build step. A Rust engine with no AI in the loop checks every tool call through hooks.
- **Substance:** real enforcement. The author's test: two local models went from 2/10 to 10/10 on 5 SWE-bench tasks with the limits on. That's a tiny sample, but the direction makes sense.
- **Can't adopt it:** it needs a statewright.ai API key and its cloud, so it breaks V2b. The licence is FSL, so copying the code is out too.
- **For BMUZ:** add `tools:` to each pipeline step (e.g. Define steps: no code edits; a release step: no edits outside the version files). The mod or a hook refuses calls not on the list. One field turns "refuses out-of-order steps" into "refuses out-of-step *actions*", which is where drift actually happens.

### 2. Nick Tune: one entry point, the workflow as a tested model, only the current step's rules
- **Idea:**
  - Every hook event goes to **one entry point** that moves a state machine.
  - The steps live in one written file.
  - The workflow logic can be **unit-tested with no Claude involved**.
  - On each move, only **the current step's rules** go into Claude's context.
- **What went wrong for him:** a prose-only state machine "took so much effort to find the right formula", and **in plan mode Claude ignored it** and went back to its built-in habits.
- **For BMUZ:**
  - (a) Our fallback motor B should be built exactly this way: one hook entry point that reads the same pipeline file.
  - (b) Add a **pipeline test** (a script that walks each pipeline file's moves and gates with no Claude), so a pipeline edit by Muzzy can't break order silently.
  - (c) Add a proof test: "plan mode on → does the mod still hold?"

### 3. GSD-2: what the biggest process framework did when prose failed
- **Idea:** GSD (BMUZ's ancestor) found that a self-loop driven by Claude wasn't reliable and rebuilt as a program: a state machine over `.gsd/` files, SQLite state, `auto.lock` (process ID + current unit) to spot a crash, a recovery note rebuilt from the dead session's tool calls, headless restarts with backoff, `doctor` to rebuild state from disk, `forensics` for post-mortems.
- **Substance:** high. It's the same conclusion as our V7, reached independently by the most-used framework.
- **Can't follow it all the way:** it's its own CLI on another agent SDK, so it breaks V1.
- **For BMUZ, copy three small things:**
  - a **lock file** with the active step + time, so the watchdog and the next session know "a step was running and died" (proof test 3 + 4);
  - a **`doctor`** script that rebuilds the engine's state from the project files when they disagree;
  - a **post-mortem** view that reads the deviation log.

### 4. BMAD: one small file per step, progress stamped in the document itself
- **Idea:** each step is its own small instruction file. Only the current one is loaded, and the next loads only after this one is done and the user picks [C]ontinue. Progress is written into the output document's frontmatter (`stepsCompleted`, `lastStep`).
- **Substance:** medium. The idea is good, but nothing enforces it except the text. Still, it shrinks what Claude has to keep in mind to one step, which cuts drift and tokens (third-party claim: about 2–3K tokens per step).
- **For BMUZ:**
  - (a) The engine should hand Claude **only the current step's craft text**, never the whole 35 KB skill. That makes "skills lose their step lists" concrete: a skill is split into per-step craft notes the pipeline file points to.
  - (b) Stamp the step's progress **into the artifact too** (GDD/TDD frontmatter), so the engine can check its state file against the real document when resuming (pairs with #3's `doctor`).

### 5. Archon: a working schema for "pipeline as data" that mixes AI, script and gate nodes
- **Idea:**
  - YAML workflows with node kinds (AI prompt, bash/test/git, loop, `interactive: true` / approval gate) and `depends_on`.
  - The AI runs only where it's needed.
  - Each run gets its own worktree.
  - Pause and resume by run-id.
- **Substance:** high as a schema, and the closest match in shape to BMUZ's pipeline file plus the ladder (script / workflow / talk).
- **Can't adopt it:** it runs as its own app (CLI, web, Slack) that drives Claude Code, so it breaks V1.
- **Warning from its issue tracker:** approve/resume fails for some workflows (#1663), and loops resumed through a gate lose data (#2345). **Resuming through a gate is the fragile spot.**
- **For BMUZ:**
  - (a) Borrow its vocabulary for the pipeline file: `kind: script | flow | talk | gate | loop`, `needs:` (= depends_on), so the format isn't invented from scratch.
  - (b) Strengthen proof test 3 to "killed *while waiting at a gate* and *inside a loop*", not just mid-step.

**Honourable mention: Ralph loop.** It's the community's standard "never stop" trick (a Stop hook + a "done" phrase + a loop cap). It's the fallback answer to V24 if the mod's watchdog can't restart a step. But it's the exact self-loop GSD-2 left behind, so keep it as a backstop, not the motor.

## Hype vs substance, plainly
- **Substance:** GSD-2's move to code, Statewright's per-step tool lists, Archon's mixed nodes, Nick Tune's write-ups (honest about failures), BMAD's step files (as a context trick).
- **Mostly reputation:** gstack and Superpowers star counts track their authors' fame and viral posts. Both are prose and drift like BMUZ does today.
- **Hype / risk:** claude-flow/Ruflo (big claims it makes about itself, a cloud component, an unchecked backdoor report). SuperClaude's speed claims hold only with its MCPs installed.
- **Gap nobody fills:** an engine **inside** the interactive chat with button gates and a status band. If the mod proof passes, BMUZ is ahead of the community, not behind it. If it fails, Nick Tune's hook design (motor B) is the proven fallback.

## What this would change in ARCHITECTURE.md (proposals, not edits)
1. Pipeline step gets a `tools:` allow-list (Statewright).
2. Pipeline file vocabulary borrowed from Archon: `kind`, `needs`, `gate`, `loop`.
3. Engine feeds only the current step's craft note (BMAD); skills split into per-step notes.
4. Add a lock file (active step + start time), a `doctor` script and a post-mortem view (GSD-2).
5. Add a no-Claude pipeline test script (Nick Tune).
6. Proof tests gain: resume while waiting at a gate and inside a loop (Archon bugs); plan mode doesn't bypass the engine (Tune).

## Sources
- GSD stars: https://www.augmentcode.com/learn/gsd-stars-spec-driven-dev-claude-code
- GSD-2: https://github.com/gsd-build/GSD-2/blob/main/README.md · https://getshitdone.help/user-docs/auto-mode/ · https://getshitdone.help/recipes/error-recovery/ · https://github.com/gsd-build/get-shit-done/issues/940
- BMAD: https://www.mintlify.com/bmad-code-org/BMAD-METHOD/workflows/overview · https://deepwiki.com/bmad-code-org/BMAD-METHOD/8.2-bmm-workflows · https://medium.com/@hieutrantrung.it/from-token-hell-to-90-savings-how-bmad-v6-revolutionized-ai-assisted-development-09c175013085
- Statewright: https://hn.jakechampion.name/reader/https://github.com/statewright/statewright · https://dev.to/andrew-ooo/statewright-review-state-machine-guardrails-for-ai-agents-32g · https://hn.svelte.dev/item/48108778 · https://www.sourcepulse.org/projects/29760340 · https://www.everydev.ai/tools/statewright
- Nick Tune: https://nick-tune-dot-me.pages.dev/blog/2026-02-28-hook-driven-dev-workflows-with-claude-code · https://nick-tune-dot-me.pages.dev/blog/2026-03-01-workflow-dsl-domain-driven-claude-code-workflows · https://nick-tune-dot-me.pages.dev/blog/2026-01-17-dev-workflows-as-code · https://medium.com/nick-tune-tech-strategy-blog/minimalist-claude-code-task-management-workflow-7b7bdcbc4cc1
- Archon: https://github.com/coleam00/Archon · https://github.com/coleam00/Archon/issues/1663 · https://github.com/coleam00/Archon/issues/2345 · https://andrew.ooo/posts/archon-open-source-ai-coding-harness-builder-review/
- Superpowers: https://www.pasqualepillitteri.it/en/news/215/superpowers-claude-code-complete-guide · https://mcp.directory/blog/superpowers-skill-worth-it-2026
- Comparisons: https://docs.bswen.com/blog/2026-08-07-ai-spec-frameworks-compared/ · https://codemyspec.com/blog/spec-kit-vs-kiro · https://levelop.dev/blog/spec-driven-development-tools-compared
- Ralph: https://www.atcyrus.com/stories/ralph-wiggum-technique-claude-code-autonomous-loops · https://github.com/dial481/ralph · https://venturebeat.com/ai/how-ralph-wiggum-went-from-the-simpsons-to-the-biggest-name-in-ai-right-now
- cc-sessions: https://pypi.org/project/cc-sessions/
- CCPM: https://awesome.ecosyste.ms/projects/github.com%2Fautomazeio%2Fccpm
- SuperClaude / Ruflo: https://dev.to/stevengonsalvez/superclaude-the-claudemd-framework-that-went-viral-1ced · https://dev.to/stevengonsalvez/claude-flow-is-dead-long-live-ruflo-5coi · https://reddit.sentinel-team.org/posts/1s469qg/snapshots/2026-03-28T00%3A10%3A00.994227Z
- gstack / Pocock: https://www.augmentcode.com/learn/garry-tan-gstack-hits-89.7K-stars · https://mcp.directory/blog/matt-pocock-skills-the-npm-moment-explained-2026
- Game Studios: https://www.sourcepulse.org/projects/26613615 · https://shiporskip.io/compare/claude-code-game-studios-49-agent-72-skill-game-dev-framework-2026-vs-claude-code-templates-davila7-cli-monitoring-config-2026
- OpenSwarm: https://news.ycombinator.com/item?id=47160980
- Workflows: https://code.claude.com/docs/en/workflows · https://linas.substack.com/p/claude-code-dynamic-workflows-guide
- Instructions get ignored: https://github.com/anthropics/claude-code/issues/18454
- Lists: https://github.com/ithiria894/awesome-claude-code-workflows · https://awesome.ecosyste.ms/projects/github.com%2Fhesreallyhim%2Fawesome-claude-code
- Hooks: https://code.claude.com/docs/en/hooks · https://dev.to/rulestack/6-of-6-prompts-a-claude-code-userpromptsubmit-hook-erased-were-still-in-the-transcript-and-15m2
