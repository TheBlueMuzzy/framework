# BMUZ rebuild — plan DRAFT (2026-11-08, for Muzzy's OK)

Built on: `VISION.md` (what), `ARCHITECTURE.md` (how), `proof-results.md` (the engine works: 10 of 16 checks pass, 4 partly, 2 need a live window). Proof code to start from: `proof/`.
Nothing here is started. The order and features need Muzzy's OK, and then the 6 live checks in the morning.

## Ground rules for the rebuild
- **BMUZ becomes its own project**: `Documents/dev/bmuz/`, one GitHub repo, shipped as one plugin. Today's BMUZ in `~/.claude` keeps running until each process is switched over: no big-bang switch, and no day where nothing works.
- **One process at a time.** Each goes through four stages: built as a pipeline → its journey checks pass → switched on for Muzzy → the old skill text and hooks for it are retired.
- **The step logic stays in a plain file** (`engine.js`, as in the proof), so the motor can be swapped to motor B or an outside program without touching pipelines.
- **The three rules from the proof:**
  1. The engine acts when a turn ends.
  2. Workflows start through saved plugin workflow commands, with their inputs pinned.
  3. Every guard refuses on its own error, and a gate never treats silence as an answer.
- **The mod API is "early access"**, so the Claude Code version is pinned, and `claude plugin test` plus the process tests run before every update.

## Features, in order (→ = needs the one before)
| # | Feature | What Muzzy will notice | Needs |
|---|---|---|---|
| R1 | **Engine core**: the proof turned into the real engine (pipeline format, journal, lock, doctor, checkpoints + undo list, status band, watchdog, retries/BLOCKED, tool limits, deviation log) | the status band above the prompt in every BMUZ project | live checks L1–L4 pass |
| R2 | **The plugin + install on both machines**: one plugin, a local marketplace, PC and laptop | one install line; sync keeps both machines the same | R1 |
| R3 | **The hand-off card, questions and decisions written by the engine**: one numbered question list, the open-questions file, the decisions list checked before asking (V38), taste questions ask you first (V32b) | the same card every time; no repeated questions | R1 |
| R4 | **Save + sync as pipelines** (the scripts already exist) | nothing changes, which is the point; the first, lowest-risk switch-over | R2 |
| R5 | **Bug pipeline + bug flow** (reproduce as a failing test → fix → keep the test → check matching places) | `/bug` (new name: it clashes with a built-in) runs the same way every time | R2, R3 |
| R6 | **Develop: the task flow + the sprint loop + overnight runs** (separate reviewer, plan card, never-stall settings) | sprints run the same way every time; overnight runs don't stall | R5, live checks L3 + L5 |
| R7 | **Discover + the research flow** | research arrives the same way every time, with sources checked | R3 |
| R8 | **Define + the plan-check flow + scope** | GDD, TDD and feature map checked against each other before building | R7 |
| R9 | **Deliver: release flow per platform + security scans + security review** | release in one go after your OK; secrets and private text can never go out | R6 |
| R10 | **Milestone review: retro flow → lesson proposals to Muzzy** | lessons arrive as proposals you approve | R6 |
| R11 | **First setup + setup sidequests** (git, npm, adb, Firebase… detected and walked through) | a new user goes from install to "I have an idea" with no help | R2 |
| R12 | **Made generic for other users**: Muzzy's paths, accounts and machines move into a profile; style rules sorted "everyone" vs "just me" (with you) | nothing for you; others can use it | R11 |
| R13 | **Hook diet**: keep the safety set (git, secrets, publishing, report-only), retire the rest as the pipelines take over | fewer false alarms and repeat messages | after R4–R10 each |
| R14 | **Process tests**: journeys J1–J8 as scripted runs in a scratch project, run before every BMUZ update | "done" = they pass while you watch | grows with each feature; the final gate |

Views (/ppp, /roadmap, /sprint, /gdd, /tdd), /play and /sketch move over inside R3–R8 as their processes do.

## The finish line
The core is done when R14's journeys J1–J8 all pass, watched, with zero process corrections (VISION section H). Then the framework gets its refit pass, then games resume.

## Open (for Muzzy)
- The order above: OK, or should something come earlier?
- The BMUZ repo: private or public?
