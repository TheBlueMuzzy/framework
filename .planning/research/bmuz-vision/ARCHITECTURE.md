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
| The ORDER of steps, the gates, what "done" means for a step | **pipeline file** (data) | Define → GDD → TDD → feature map → gate "approve the plan" |
| Running the pipeline, status band, asking at gates, watchdog, deviation log, refusing out-of-order | **engine** (the mod) | "Step 3 of 7 · working · 01:52" |
| A job done the same way every time | **script** | save, release, merge, sync, install a module |
| How to think inside a step (judgement, craft) | **skill** (.md) — no step lists in it | how to run discovery, MDA, write a GDD |
| Hard safety that must hold even if the engine is off | **hook** (small set) | no secrets pushed, no force-push, no publish without OK (V42–V44) |
| Tunable values | **content JSON** | timings, colours |
| Per-person facts | **profile** | machines, accounts |
| A project's memory | **project files** (git, so they sync) | STATE, ROADMAP, GDD, decisions, open questions |

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
7. a helper's answer comes back to the engine.
Fail on 1–6 → switch the motor to B and re-run the same test.
